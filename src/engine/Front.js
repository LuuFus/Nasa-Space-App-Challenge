import { LineLayer } from './LineLayer.js';
import { LonLatCanvas, SurfaceLayer } from './SurfaceLayer.js';
import { loadJSON } from '../lib/data.js';
import { FRONT_STYLE, ORDER, STRONG, edgesOf, occupiedOutline, parseFront } from '../lib/frontGeo.js';

export { FRONT_STYLE, outline, snapshotIndex } from '../lib/frontGeo.js';

// Front line in Ukraine, one snapshot per month (see pipeline/10_tot_official.py).
// Areas are painted into a canvas that covers only Ukraine (~1 km per pixel);
// the edges of each class (= the front line) are drawn as lines on top.

const BBOX = [21.5, 43.5, 41.5, 53.0];

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
      this.data = parseFront(await loadJSON('front.json'));
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
