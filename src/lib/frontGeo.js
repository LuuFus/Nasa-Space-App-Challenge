import { decodeRing } from './data.js';

// Pure helpers for the front-line data (public/data/front.json), shared by the
// 3D engine layer (src/engine/Front.js) and the OpenStreetMap view (src/map/).
// Two data formats are understood:
//  * "communities" — the official list of occupied / combat territories (order
//    No. 376) joined with community (hromada) borders: every snapshot only names
//    the communities of each class, the shapes are stored once;
//  * the older one with ready polygons per snapshot (pipeline/07_frontline.py).

export const FRONT_STYLE = {
  crimea: { fill: 'rgba(120,10,30,0.42)', hatch: 'rgba(60,0,10,0.55)', line: [0.55, 0.05, 0.12, 1], title: { uk: 'Окуповано з 2014 (Крим)', en: 'Occupied since 2014 (Crimea)' } },
  ordlo: { fill: 'rgba(120,10,30,0.42)', hatch: 'rgba(60,0,10,0.55)', line: [0.55, 0.05, 0.12, 1], title: { uk: 'Окуповано з 2014 (частини Донеччини й Луганщини)', en: 'Occupied since 2014 (parts of Donetsk & Luhansk)' } },
  occupied: { fill: 'rgba(230,40,40,0.33)', hatch: 'rgba(170,0,0,0.55)', line: [0.9, 0.12, 0.12, 1], title: { uk: 'Окуповано з 2022', en: 'Occupied since 2022' } },
  partial: { fill: 'rgba(230,40,40,0.16)', hatch: 'rgba(170,0,0,0.32)', line: [0.9, 0.35, 0.35, 0.9], title: { uk: 'Громада окупована частково (окремі села)', en: 'Community partly occupied (some villages)' } },
  contested: { fill: 'rgba(160,150,140,0.45)', hatch: null, line: [0.6, 0.58, 0.55, 1], title: { uk: 'Активні бойові дії / сіра зона', en: 'Active hostilities / grey zone' } },
  liberated: { fill: 'rgba(30,160,90,0.30)', hatch: null, line: [0.1, 0.65, 0.35, 1], title: { uk: 'Звільнено Силами оборони', en: 'Liberated by Ukraine' } },
};
export const ORDER = ['liberated', 'contested', 'partial', 'crimea', 'ordlo', 'occupied'];
export const STRONG = new Set(['occupied', 'ordlo', 'crimea']);

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

export function parseFront(d) {
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
export function edgesOf(d, s, k) {
  if (d.format !== 'communities') return (s.rings[k] || []).flat();
  s.edges ??= {};
  s.edges[k] ??= outline(s.rings[k] || [], d.quant);
  return s.edges[k];
}

/** boundary of all occupied land of a snapshot (for the dashed "compare" line) */
export function occupiedOutline(d, s) {
  const polys = [...STRONG].flatMap((k) => s.rings[k] || []);
  if (d.format !== 'communities') return polys.flat();
  s.occOutline ??= outline(polys, d.quant);
  return s.occOutline;
}

/** index of the last snapshot on or before a date (YYYY-MM-DD) */
export function snapshotIndex(snapshots, date) {
  let best = 0;
  snapshots.forEach((s, i) => { if (s.date <= date) best = i; });
  return best;
}
