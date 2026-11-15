import { sampleField } from './data.js';

// Moving wind lines over the map: a few thousand particles drift with the wind
// and leave fading trails (the classic "earth wind map" technique). The wind is
// looked up once per map position on a coarse screen grid, then every particle
// reads it from there, so one frame costs only a few milliseconds.

const CELL = 8;           // CSS px between wind samples on the screen
const SPEED = 0.11;       // CSS px per frame for 1 m/s
const FADE = 0.93;        // how much of the old trail stays each frame

export class WindParticles {
  constructor(map) {
    this.map = map;
    const c = document.createElement('canvas');
    c.className = 'wx-particles';
    map.getCanvasContainer().appendChild(c);
    this.canvas = c;
    this.ctx = c.getContext('2d');
    this.field = null;
    this.data = null;
    this.on = false;
    this.moving = false;
    this.reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    this._frame = this._frame.bind(this);
    this._onStart = () => { this.moving = true; this._clear(); };
    this._onEnd = () => { this.moving = false; this._build(); };
    this._onResize = () => this._build();
    map.on('movestart', this._onStart);
    map.on('moveend', this._onEnd);
    map.on('resize', this._onResize);
  }

  /** wind components u, v (m/s, Float32Array on the grid) */
  setWind(grid, u, v) {
    this.data = grid && u && v ? { grid, u, v } : null;
    this._build();
  }

  setVisible(on) {
    this.on = on;
    this.canvas.style.display = on ? '' : 'none';
    if (on) this._build(); else { this._clear(); cancelAnimationFrame(this.raf); this.raf = null; }
  }

  _clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /** wind on a screen grid for the current view */
  _build() {
    if (!this.on || !this.data) { this._clear(); return; }
    const map = this.map;
    const el = map.getCanvas();
    const w = el.clientWidth, h = el.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (this.canvas.width !== Math.round(w * dpr) || this.canvas.height !== Math.round(h * dpr)) {
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
      this.canvas.style.width = w + 'px';
      this.canvas.style.height = h + 'px';
    }
    this.dpr = dpr;
    const cols = Math.ceil(w / CELL) + 1, rows = Math.ceil(h / CELL) + 1;
    // no rotation or tilt on this map: lon depends only on x, lat only on y
    const lons = new Float64Array(cols), lats = new Float64Array(rows);
    for (let i = 0; i < cols; i++) lons[i] = map.unproject([i * CELL, 0]).lng;
    for (let j = 0; j < rows; j++) lats[j] = map.unproject([0, j * CELL]).lat;
    const fu = new Float32Array(cols * rows), fv = new Float32Array(cols * rows);
    const { grid, u, v } = this.data;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const k = j * cols + i;
      const lon = ((((lons[i] + 180) % 360) + 360) % 360) - 180;
      fu[k] = sampleField(grid, u, lon, lats[j]);
      fv[k] = sampleField(grid, v, lon, lats[j]);
    }
    this.field = { cols, rows, fu, fv, w, h };
    const n = this.reduced ? 0 : Math.min(7000, Math.round((w * h) / 260));
    this.particles = Array.from({ length: n }, () => this._spawn({}));
    this._clear();
    if (this.reduced) { this._drawArrows(); return; }
    if (!this.raf) this.raf = requestAnimationFrame(this._frame);
  }

  _spawn(p) {
    p.x = Math.random() * this.field.w;
    p.y = Math.random() * this.field.h;
    p.age = Math.floor(Math.random() * 80);
    p.max = 50 + Math.floor(Math.random() * 60);
    return p;
  }

  _wind(x, y) {
    const f = this.field;
    const gx = x / CELL, gy = y / CELL;
    const i = Math.floor(gx), j = Math.floor(gy);
    if (i < 0 || j < 0 || i >= f.cols - 1 || j >= f.rows - 1) return null;
    const fx = gx - i, fy = gy - j, k = j * f.cols + i;
    const lerp = (a) => (a[k] * (1 - fx) + a[k + 1] * fx) * (1 - fy) + (a[k + f.cols] * (1 - fx) + a[k + f.cols + 1] * fx) * fy;
    const u = lerp(f.fu), v = lerp(f.fv);
    return Number.isNaN(u) || Number.isNaN(v) ? null : [u, v];
  }

  _frame() {
    this.raf = requestAnimationFrame(this._frame);
    if (!this.on || this.moving || !this.field) return;
    const ctx = this.ctx, d = this.dpr;
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = `rgba(0,0,0,${FADE})`;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineWidth = 1.1 * d;
    ctx.strokeStyle = 'rgba(255,255,255,0.78)';
    ctx.beginPath();
    for (const p of this.particles) {
      const wv = this._wind(p.x, p.y);
      if (!wv || ++p.age > p.max) { this._spawn(p); p.age = 0; continue; }
      const nx = p.x + wv[0] * SPEED, ny = p.y - wv[1] * SPEED;
      ctx.moveTo(p.x * d, p.y * d);
      ctx.lineTo(nx * d, ny * d);
      p.x = nx; p.y = ny;
    }
    ctx.stroke();
  }

  /** with "reduced motion": small still arrows instead of moving lines */
  _drawArrows() {
    const ctx = this.ctx, d = this.dpr, f = this.field;
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1.2 * d;
    ctx.beginPath();
    for (let y = 20; y < f.h; y += 44) for (let x = 20; x < f.w; x += 44) {
      const wv = this._wind(x, y);
      if (!wv) continue;
      const s = Math.hypot(wv[0], wv[1]);
      if (s < 0.3) continue;
      const L = Math.min(18, 6 + s), ux = wv[0] / s, uy = -wv[1] / s;
      const x2 = x + ux * L, y2 = y + uy * L;
      ctx.moveTo(x * d, y * d); ctx.lineTo(x2 * d, y2 * d);
      ctx.lineTo((x2 - ux * 5 - uy * 3) * d, (y2 - uy * 5 + ux * 3) * d);
      ctx.moveTo(x2 * d, y2 * d);
      ctx.lineTo((x2 - ux * 5 + uy * 3) * d, (y2 - uy * 5 - ux * 3) * d);
    }
    ctx.stroke();
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.map.off('movestart', this._onStart);
    this.map.off('moveend', this._onEnd);
    this.map.off('resize', this._onResize);
    this.canvas.remove();
  }
}
