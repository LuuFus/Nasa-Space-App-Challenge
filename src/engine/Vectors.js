import { LineLayer } from './LineLayer.js';
import { LonLatCanvas } from './SurfaceLayer.js';
import { decodeRing, loadCountries, loadJSON } from '../lib/data.js';

// Country colours (Natural Earth MAPCOLOR9 guarantees neighbours never share a colour).
export const PALETTE = ['#ffd166', '#2ec4b6', '#ff6b6b', '#4cc9f0', '#f4a261', '#c77dff', '#90e050', '#ff8fd8', '#e9c46a'];
export const SEL_COLORS = { a: '#ff9f1c', b: '#8f5cff' };

const hex = (h, a = 1) => {
  const n = parseInt(h.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, a];
};

/** Borders, coastlines, rivers, graticule, labels and country fills. */
export class Vectors {
  constructor(engine) {
    this.engine = engine;
    this.graticule = new LineLayer(engine, { lift: 0.00003, renderOrder: 7 });
    this.rivers = new LineLayer(engine, { lift: 0.00003, renderOrder: 8 });
    this.borders = new LineLayer(engine, { lift: 0.00004, renderOrder: 9 });
    this.selection = new LineLayer(engine, { lift: 0.00005, renderOrder: 10 });
    this.hover = new LineLayer(engine, { lift: 0.00006, renderOrder: 11 });
    for (const l of [this.graticule, this.rivers, this.borders, this.selection, this.hover]) engine.scene.add(l.mesh);
    this.tintCanvas = new LonLatCanvas(4096);
    this.landCanvas = new LonLatCanvas(4096);
    this.state = { borders: true, rivers: true, graticule: false, capitals: true, labels: true, oceans: true, tint: false };
    this.sel = { a: null, b: null };
    this.choropleth = null;
    this.ready = this._load();
    engine.on('style', () => this._restyle());
    engine.on('frame', () => this._zoomStyle());
  }

  async _load() {
    const [countries, rivers, lakes, marine, capitals] = await Promise.all([
      loadCountries(), loadJSON('geo/rivers.json'), loadJSON('geo/lakes.json'),
      loadJSON('geo/marine.json'), loadJSON('geo/capitals.json'),
    ]);
    this.countries = countries;
    this.riverData = rivers.rivers.filter((r) => !r.lake).map((r) => ({ ...r, coords: decodeRing(r.line, rivers.quant) }));
    this.lakeData = lakes.lakes.map((l) => ({ ...l, rings: l.polys.map((p) => p.map((r) => decodeRing(r, lakes.quant))) }));
    this.marine = marine;
    this.capitals = capitals;
    this._findSharedSegments();
    this._drawLand();
    this._restyle();
    this._makeLabels();
    return this;
  }

  // A segment used by two countries is a land border; otherwise it is coastline.
  _findSharedSegments() {
    const count = new Map();
    const key = (r, i, j) => {
      const a = `${r[i * 2].toFixed(4)},${r[i * 2 + 1].toFixed(4)}`, b = `${r[j * 2].toFixed(4)},${r[j * 2 + 1].toFixed(4)}`;
      return a < b ? a + '|' + b : b + '|' + a;
    };
    for (const c of this.countries.list) for (const poly of c.rings) for (const r of poly) {
      const n = r.length / 2;
      for (let i = 0; i < n; i++) { const k = key(r, i, (i + 1) % n); count.set(k, (count.get(k) || 0) + 1); }
    }
    // split every ring into runs of land border / coast
    for (const c of this.countries.list) {
      c.runs = [];
      for (const poly of c.rings) for (const r of poly) {
        const n = r.length / 2;
        const shared = new Uint8Array(n);
        for (let i = 0; i < n; i++) shared[i] = count.get(key(r, i, (i + 1) % n)) > 1 ? 1 : 0;
        let start = 0;
        while (start < n && shared[start] === shared[(start + n - 1) % n]) start++;
        if (start === n) { c.runs.push({ land: !!shared[0], coords: r, closed: true }); continue; }
        let i = start;
        do {
          const type = shared[i];
          const pts = [r[i * 2], r[i * 2 + 1]];
          let j = i;
          while (shared[j] === type) {
            j = (j + 1) % n;
            pts.push(r[j * 2], r[j * 2 + 1]);
            if (j === start) break;
          }
          c.runs.push({ land: !!type, coords: pts, closed: false });
          i = j;
        } while (i !== start);
      }
    }
  }

  _drawLand() {
    const lc = this.landCanvas;
    lc.clear();
    for (const c of this.countries.list) lc.fillPolygon(c.rings, '#ffffff');
    for (const l of this.lakeData) if ((l.rank ?? 9) <= 6) lc.fillPolygon(l.rings, '#c9e4f4');
    lc.commit();
    this.engine.land.setTexture(lc.texture);
    this.engine._applyStyle();
  }

  _restyle() {
    if (!this.countries) return;
    const contour = this.engine.contour;
    // ---- borders
    const lines = [];
    const center = contour ? hex('#2b6fb0', 0.95) : hex('#ffffff', 0.9);
    const coast = contour ? hex('#2b6fb0', 0.9) : hex('#ffffff', 0.32);
    for (const c of this.countries.list) {
      const col = PALETTE[c.color % PALETTE.length];
      const dash = c.small ? { dash: 5, gap: 3.5 } : {};
      for (const run of c.runs) {
        if (run.land) {
          lines.push({ coords: run.coords, closed: run.closed, color: hex(col, contour ? 0.75 : 0.95), width: contour ? 1.6 : 2.2, inset: 0.6, ...dash });
          lines.push({ coords: run.coords, closed: run.closed, color: center, width: contour ? 1.2 : 1, ...dash });
        } else {
          lines.push({ coords: run.coords, closed: run.closed, color: hex(col, contour ? 0.0 : 0.55), width: 1.3, inset: 0.4, ...dash });
          lines.push({ coords: run.coords, closed: run.closed, color: coast, width: contour ? 1.1 : 0.8 });
        }
      }
    }
    this.borders.setLines(lines);
    this.borders.visible = this.state.borders;
    // ---- rivers
    const rcol = contour ? hex('#2f86d6', 0.95) : hex('#6cc0ff', 0.85);
    this.rivers.setLines(this.riverData.map((r) => ({
      coords: r.coords, closed: false, color: rcol, rank: r.rank,
      width: r.rank <= 2 ? 1.7 : r.rank <= 4 ? 1.25 : 0.9,
    })));
    this.rivers.visible = this.state.rivers;
    // ---- graticule
    const g = [];
    const gcol = contour ? hex('#7fb8df', 0.9) : hex('#ffffff', 0.16);
    const step = contour ? 15 : 15;
    for (let lon = -180; lon <= 180; lon += step) {
      const pts = [];
      const L = Math.max(-179.99, Math.min(179.99, lon));
      for (let lat = -90; lat <= 90; lat += 2) pts.push(L, lat);
      g.push({ coords: pts, closed: false, color: gcol, width: Math.abs(lon) === 180 ? 1.4 : 0.8 });
    }
    for (let lat = -75; lat <= 75; lat += step) {
      const pts = [];
      for (let lon = -180; lon <= 180; lon += 2) pts.push(Math.max(-179.99, Math.min(179.99, lon)), lat);
      g.push({ coords: pts, closed: false, color: gcol, width: lat === 0 ? 1.3 : 0.8 });
    }
    this.graticule.setLines(g);
    this.graticule.visible = this.state.graticule || contour;
    this._drawTint();
    this._drawSelection();
  }

  _zoomStyle() {
    const z = this.engine.zoom ?? 3;
    const s = Math.max(0.55, Math.min(1.25, 0.45 + z * 0.14));
    this.borders.setWidthScale(s);
    this.rivers.setWidthScale(s);
    this.rivers.setMaxRank(Math.max(2, Math.min(9, Math.round(z * 1.5 - 1.5))));
  }

  // ------------------------------------------------------------------ fills
  _drawTint() {
    const tc = this.tintCanvas;
    tc.clear();
    let any = false;
    if (this.choropleth) {
      for (const c of this.countries.list) {
        const col = this.choropleth(c);
        if (col) { tc.fillPolygon(c.rings, col); any = true; }
      }
    } else if (this.state.tint) {
      for (const c of this.countries.list) tc.fillPolygon(c.rings, PALETTE[c.color % PALETTE.length] + '55');
      any = true;
    }
    for (const k of ['a', 'b']) {
      const c = this.sel[k] && this.countries.byId.get(this.sel[k]);
      if (c) { tc.fillPolygon(c.rings, SEL_COLORS[k] + '40'); any = true; }
    }
    tc.commit();
    this.engine.tint.setTexture(tc.texture);
    this.engine.tint.visible = any;
    this.engine.tint.setOpacity(1);
  }

  _drawSelection() {
    const lines = [];
    for (const k of ['a', 'b']) {
      const c = this.sel[k] && this.countries.byId.get(this.sel[k]);
      if (!c) continue;
      for (const poly of c.rings) for (const r of poly) {
        lines.push({ coords: r, closed: true, color: hex(SEL_COLORS[k], 1), width: 3, inset: 0 });
      }
    }
    this.selection.setLines(lines);
  }

  // ------------------------------------------------------------------ public API
  set(key, value) {
    this.state[key] = value;
    if (!this.countries) return;
    if (key === 'borders') this.borders.visible = value;
    if (key === 'rivers') { this.rivers.visible = value; this.engine.labels.setVisible('rivers', value); }
    if (key === 'graticule') this.graticule.visible = value || this.engine.contour;
    if (key === 'capitals') this.engine.labels.setVisible('capitals', value);
    if (key === 'labels') { this.engine.labels.setVisible('countries', value); this.engine.labels.setVisible('tiny', value); }
    if (key === 'oceans') { this.engine.labels.setVisible('marine', value); this.engine.labels.setVisible('lakes', value); }
    if (key === 'tint') this._drawTint();
    this.engine.requestRender();
  }

  setSelection(a, b) {
    this.sel = { a, b };
    if (!this.countries) return;
    this._drawTint();
    this._drawSelection();
  }

  setHover(id) {
    if (id === this.hoverId || !this.countries) return;
    this.hoverId = id;
    const c = id && this.countries.byId.get(id);
    const lines = [];
    if (c) for (const poly of c.rings) for (const r of poly) lines.push({ coords: r, closed: true, color: [1, 1, 1, 0.95], width: 2.2, inset: 0 });
    this.hover.setLines(lines);
  }

  /** fn(country) -> css colour or null; null fn = off */
  setChoropleth(fn) {
    this.choropleth = fn;
    if (this.countries) this._drawTint();
  }

  // ------------------------------------------------------------------ labels
  _makeLabels() {
    const L = this.engine.labels;
    const countries = [], tiny = [];
    for (const c of this.countries.list) {
      if (!c.label) continue;
      if (c.tiny) {
        tiny.push({ key: 't' + c.id, lon: c.label[0], lat: c.label[1], text: '', title: c.name, cls: 'lbl-tiny', marker: true,
          minZoom: 2.2, priority: 90, style: PALETTE[c.color % PALETTE.length] });
      }
      countries.push({ key: c.id, lon: c.label[0], lat: c.label[1], text: c.name, cls: c.small ? 'lbl-country small' : 'lbl-country',
        priority: (c.rank ?? 5) * 2 + (c.minLabel ?? 3), minZoom: Math.max(0, (c.minLabel ?? 3) - 0.6), charW: 7 });
    }
    const caps = this.capitals.filter((c) => !c.alt || c.pop > 2e6).map((c) => ({
      key: 'c' + c.country + c.name.en, lon: c.lon, lat: c.lat, text: c.name, cls: 'lbl-capital', anchorLeft: true,
      priority: 30 + (c.rank ?? 5), minZoom: c.pop > 8e6 ? 3.3 : c.pop > 2e6 ? 3.8 : 4.4,
    }));
    const marine = this.marine.map((m) => ({
      key: 'm' + m.name.en, lon: m.label[0], lat: m.label[1], text: m.name,
      cls: m.kind === 'ocean' ? 'lbl-ocean' : 'lbl-sea', priority: m.kind === 'ocean' ? 4 : 40 + (m.rank ?? 5),
      minZoom: m.kind === 'ocean' ? 0 : Math.max(2.8, (m.minLabel ?? 3) - 0.3), maxZoom: m.kind === 'ocean' ? 6 : 9,
    }));
    const lakes = this.lakeData.filter((l) => l.name && (l.rank ?? 9) <= 5).map((l) => ({
      key: 'l' + l.name.en, lon: l.label[0], lat: l.label[1], text: l.name, cls: 'lbl-water', priority: 60 + (l.rank ?? 5),
      minZoom: (l.rank ?? 5) <= 2 ? 3.6 : 4.6,
    }));
    // one label per named river, in the middle of its longest piece
    const byName = new Map();
    for (const r of this.riverData) {
      if (!r.name || r.rank > 6) continue;
      const prev = byName.get(r.name.en);
      if (!prev || r.coords.length > prev.coords.length) byName.set(r.name.en, r);
    }
    const rivers = [...byName.values()].map((r) => {
      const mid = Math.floor(r.coords.length / 4) * 2;
      return { key: 'r' + r.name.en, lon: r.coords[mid], lat: r.coords[mid + 1], text: r.name, cls: 'lbl-river',
        priority: 70 + r.rank, minZoom: r.rank <= 2 ? 4.2 : r.rank <= 4 ? 5 : 5.8 };
    });
    L.setGroup('marine', marine, this.state.oceans);
    L.setGroup('lakes', lakes, this.state.oceans);
    L.setGroup('countries', countries, this.state.labels);
    L.setGroup('tiny', tiny, this.state.labels);
    L.setGroup('capitals', caps, this.state.capitals);
    L.setGroup('rivers', rivers, this.state.rivers);
    for (const t of tiny) { const el = L._el(t); el.style.setProperty('--c', t.style); }
  }
}
