import { LineLayer } from './LineLayer.js';
import { LonLatCanvas, SurfaceLayer } from './SurfaceLayer.js';
import { decodeRing, loadJSON } from '../lib/data.js';

// Front line in Ukraine (DeepStateMap monthly snapshots, see pipeline/07_frontline.py).
// Areas are painted into a canvas that covers only Ukraine (~1 km per pixel);
// the edges of occupied land (= the front line) are drawn as lines on top.

const BBOX = [21.5, 43.5, 41.5, 53.0];

export const FRONT_STYLE = {
  crimea: { fill: 'rgba(120,10,30,0.42)', hatch: 'rgba(60,0,10,0.55)', line: [0.55, 0.05, 0.12, 1], title: { uk: 'Окуповано з 2014 (Крим)', en: 'Occupied since 2014 (Crimea)' } },
  ordlo: { fill: 'rgba(120,10,30,0.42)', hatch: 'rgba(60,0,10,0.55)', line: [0.55, 0.05, 0.12, 1], title: { uk: 'Окуповано з 2014 (частини Донеччини й Луганщини)', en: 'Occupied since 2014 (parts of Donetsk & Luhansk)' } },
  occupied: { fill: 'rgba(230,40,40,0.33)', hatch: 'rgba(170,0,0,0.55)', line: [0.9, 0.12, 0.12, 1], title: { uk: 'Окуповано з 2022', en: 'Occupied since 2022' } },
  contested: { fill: 'rgba(160,150,140,0.45)', hatch: null, line: [0.6, 0.58, 0.55, 1], title: { uk: 'Сіра зона (статус невідомий)', en: 'Grey zone (status unknown)' } },
  liberated: { fill: 'rgba(30,160,90,0.30)', hatch: null, line: [0.1, 0.65, 0.35, 1], title: { uk: 'Звільнено Силами оборони', en: 'Liberated by Ukraine' } },
};

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
      const d = await loadJSON('front.json');
      this.data = {
        ...d,
        snapshots: d.snapshots.map((s) => ({
          ...s,
          rings: Object.fromEntries(Object.entries(s.polys).map(([k, polys]) => [k, polys.map((p) => p.map((r) => decodeRing(r, d.quant)))])),
        })),
      };
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
    const order = ['liberated', 'contested', 'crimea', 'ordlo', 'occupied'];
    for (const k of order) {
      const polys = s.rings[k];
      if (!polys?.length) continue;
      const st = FRONT_STYLE[k];
      c.fillPolygon(polys, st.fill, 'nonzero');
      if (st.hatch) c.fillPolygon(polys, c.hatch(st.hatch), 'nonzero');
    }
    c.commit();
    this.surface.setTexture(c.texture);
    const lines = [];
    for (const k of order) {
      for (const poly of s.rings[k] || []) for (const r of poly) {
        const st = FRONT_STYLE[k];
        const strong = k === 'occupied' || k === 'ordlo' || k === 'crimea';
        lines.push({ coords: r, closed: true, color: st.line, width: strong ? 2.4 : 1.2, inset: strong ? -1.2 : -0.6 });
      }
    }
    if (compareIdx != null && compareIdx !== i) {
      const o = d.snapshots[compareIdx];
      for (const k of ['occupied', 'ordlo', 'crimea']) for (const poly of o.rings[k] || []) for (const r of poly) {
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
