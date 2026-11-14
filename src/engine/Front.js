import { LineLayer } from './LineLayer.js';
import { LonLatCanvas, SurfaceLayer } from './SurfaceLayer.js';
import { decodeRing, loadJSON } from '../lib/data.js';

// Front line in Ukraine, one snapshot per month (see pipeline/10_tot_official.py).
// Two data formats are understood:
//  * "communities" — the official list of occupied / combat territories (order
//    No. 376) joined with community (hromada) borders: every snapshot only names
//    the communities of each class, the shapes are stored once;
//  * the older one with ready polygons per snapshot (pipeline/07_frontline.py).
// Areas are painted into a canvas that covers only Ukraine (~1 km per pixel);
// the edges of each class (= the front line) are drawn as lines on top.

const BBOX = [21.5, 43.5, 41.5, 53.0];

export const FRONT_STYLE = {
  crimea: { fill: 'rgba(120,10,30,0.42)', hatch: 'rgba(60,0,10,0.55)', line: [0.55, 0.05, 0.12, 1], title: { uk: 'Окуповано з 2014 (Крим)', en: 'Occupied since 2014 (Crimea)' } },
  ordlo: { fill: 'rgba(120,10,30,0.42)', hatch: 'rgba(60,0,10,0.55)', line: [0.55, 0.05, 0.12, 1], title: { uk: 'Окуповано з 2014 (частини Донеччини й Луганщини)', en: 'Occupied since 2014 (parts of Donetsk & Luhansk)' } },
  occupied: { fill: 'rgba(230,40,40,0.33)', hatch: 'rgba(170,0,0,0.55)', line: [0.9, 0.12, 0.12, 1], title: { uk: 'Окуповано з 2022', en: 'Occupied since 2022' } },
  partial: { fill: 'rgba(230,40,40,0.16)', hatch: 'rgba(170,0,0,0.32)', line: [0.9, 0.35, 0.35, 0.9], title: { uk: 'Громада окупована частково (окремі села)', en: 'Community partly occupied (some villages)' } },
  contested: { fill: 'rgba(160,150,140,0.45)', hatch: null, line: [0.6, 0.58, 0.55, 1], title: { uk: 'Активні бойові дії / сіра зона', en: 'Active hostilities / grey zone' } },
  liberated: { fill: 'rgba(30,160,90,0.30)', hatch: null, line: [0.1, 0.65, 0.35, 1], title: { uk: 'Звільнено Силами оборони', en: 'Liberated by Ukraine' } },
};
const ORDER = ['liberated', 'contested', 'partial', 'crimea', 'ordlo', 'occupied'];
const STRONG = new Set(['occupied', 'ordlo', 'crimea']);

/**
 * Outer edges of a set of polygons. An edge used by two neighbouring
 * communities lies inside the set and is dropped; the edges that are left are
 * chained into closed rings — the boundary of the whole area (the front line).
 * Works because neighbours share exactly the same vertices (pipeline step 10
 * simplifies all communities together).
 */
export function outline(polys, quant) {
  const key = (x, y) => Math.round(x * quant) * 400000 + Math.round(y * quant);
  const count = new Map();
  const edges = [];
  for (const poly of polys) for (const r of poly) {
    const n = r.length / 2;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const a = key(r[2 * i], r[2 * i + 1]);
      const b = key(r[2 * j], r[2 * j + 1]);
      if (a === b) continue;
      const u = a < b ? `${a}|${b}` : `${b}|${a}`;
      count.set(u, (count.get(u) || 0) + 1);
      edges.push([a, b, u, r[2 * i], r[2 * i + 1]]);
    }
  }
  const from = new Map();
  for (const e of edges) {
    if (count.get(e[2]) !== 1) continue;
    if (!from.has(e[0])) from.set(e[0], []);
    from.get(e[0]).push(e);
  }
  const rings = [];
  for (const list of from.values()) {
    while (list.length) {
      let e = list.pop();
      const start = e[0];
      const pts = [];
      for (let guard = 0; e && guard < 1e6; guard++) {
        pts.push(e[3], e[4]);
        if (e[1] === start) break;
        e = from.get(e[1])?.pop();
      }
      if (pts.length >= 6) rings.push(new Float32Array(pts));
    }
  }
  return rings;
}

function parse(d) {
  if (d.format === 'communities') {
    const geo = {};
    for (const [pc, h] of Object.entries(d.hromadas)) geo[pc] = h.polys.map((p) => p.map((r) => decodeRing(r, d.quant)));
    return {
      ...d,
      snapshots: d.snapshots.map((s) => ({
        ...s,
        rings: Object.fromEntries(Object.entries(s.groups).map(([k, pcs]) => [k, pcs.flatMap((pc) => geo[pc] || [])])),
      })),
    };
  }
  return {
    ...d,
    snapshots: d.snapshots.map((s) => ({
      ...s,
      rings: Object.fromEntries(Object.entries(s.polys).map(([k, polys]) => [k, polys.map((p) => p.map((r) => decodeRing(r, d.quant)))])),
    })),
  };
}

/** rings to draw as lines for one class: its outline (communities) or every polygon ring (old format) */
function edgesOf(d, s, k) {
  if (d.format !== 'communities') return (s.rings[k] || []).flat();
  s.edges ??= {};
  s.edges[k] ??= outline(s.rings[k] || [], d.quant);
  return s.edges[k];
}

/** boundary of all occupied land of a snapshot (for the dashed "compare" line) */
function occupiedOutline(d, s) {
  const polys = [...STRONG].flatMap((k) => s.rings[k] || []);
  if (d.format !== 'communities') return polys.flat();
  s.occOutline ??= outline(polys, d.quant);
  return s.occOutline;
}

export class Front {
  constructor(engine) {
    this.engine = engine;
    this.canvas = new LonLatCanvas(2048, BBOX);
    this.surface = new SurfaceLayer(engine, { lift: 0.000025, transparent: true, renderOrder: 5, bbox: BBOX });
    this.surface.visible = false;
    engine.scene.add(this.surface.mesh);
    this.lines = new LineLayer(engine, { lift: 0.00005, renderOrder: 12 });
    this.lines.visible = false;
    engine.scene.add(this.lines.mesh);
    this.data = null;
    this.idx = -1;
  }

  async load() {
    if (!this.data) {
      this.data = parse(await loadJSON('front.json'));
    }
    return this.data;
  }

  hide() {
    this.surface.visible = false;
    this.lines.visible = false;
    this.engine.requestRender();
  }

  /** show the snapshot at index i; compareIdx draws another month as a dashed outline */
  async show(i, compareIdx = null) {
    const d = await this.load();
    const s = d.snapshots[Math.max(0, Math.min(d.snapshots.length - 1, i))];
    const c = this.canvas;
    c.clear();
    for (const k of ORDER) {
      const polys = s.rings[k];
      if (!polys?.length) continue;
      const st = FRONT_STYLE[k];
      c.fillPolygon(polys, st.fill, 'nonzero');
      if (st.hatch) c.fillPolygon(polys, c.hatch(st.hatch), 'nonzero');
    }
    c.commit();
    this.surface.setTexture(c.texture);
    const lines = [];
    for (const k of ORDER) {
      const strong = STRONG.has(k);
      for (const r of edgesOf(d, s, k)) {
        lines.push({ coords: r, closed: true, color: FRONT_STYLE[k].line, width: strong ? 2.4 : 1.2, inset: strong ? -1.2 : -0.6 });
      }
    }
    if (compareIdx != null && compareIdx !== i) {
      for (const r of occupiedOutline(d, d.snapshots[compareIdx])) {
        lines.push({ coords: r, closed: true, color: [1, 1, 1, 0.95], width: 1.6, dash: 6, gap: 4 });
      }
    }
    this.lines.setLines(lines);
    this.surface.visible = true;
    this.lines.visible = true;
    this.idx = i;
    this.engine.requestRender();
    return s;
  }
}

/** index of the last snapshot on or before a date (YYYY-MM-DD) */
export function snapshotIndex(snapshots, date) {
  let best = 0;
  snapshots.forEach((s, i) => { if (s.date <= date) best = i; });
  return best;
}
