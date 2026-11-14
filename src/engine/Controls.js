import { DEG, FLAT_H, FLAT_W, flatPos, wrapLon } from './projection.js';

// Mouse / touch / keyboard navigation.
// Globe: the camera always looks at the Earth's centre from above (lon, lat)
// at height `alt` (in Earth radii). Map: the camera looks straight down at (x, y).

export const MIN_ALT = 0.0005;  // ≈ 3 km above the ground
export const MAX_ALT = 9;
export const MIN_DIST = 0.0008;
export const MAX_DIST = 6;

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export class Controls {
  constructor(engine) {
    this.engine = engine;
    this.el = engine.renderer.domElement;
    this.globe = { lon: 31, lat: 30, alt: 2.4 };
    this.flat = { x: 0, y: 0.1, dist: 4.2 };
    this.vel = { a: 0, b: 0 };
    this.pointers = new Map();
    this.anim = null;
    this.enabled = true;
    this._bind();
  }

  _bind() {
    const el = this.el;
    el.style.touchAction = 'none';
    el.addEventListener('pointerdown', (e) => this._down(e));
    window.addEventListener('pointermove', (e) => this._move(e));
    window.addEventListener('pointerup', (e) => this._up(e));
    window.addEventListener('pointercancel', (e) => this._up(e));
    el.addEventListener('wheel', (e) => this._wheel(e), { passive: false });
    el.addEventListener('dblclick', (e) => this._dbl(e));
    el.tabIndex = 0;
    el.addEventListener('keydown', (e) => this._key(e));
  }

  get isFlat() { return this.engine.mode === 'flat'; }

  _down(e) {
    if (!this.enabled) return;
    this.el.focus({ preventScroll: true });
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    this.anim = null;
    this.vel.a = this.vel.b = 0;
    this.dragged = false;
    this.downAt = { x: e.clientX, y: e.clientY, t: performance.now() };
    this.lastMove = performance.now();
  }

  _move(e) {
    const p = this.pointers.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    if (this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()];
      const before = Math.hypot(a.x - b.x, a.y - b.y);
      p.x = e.clientX; p.y = e.clientY;
      const [a2, b2] = [...this.pointers.values()];
      const after = Math.hypot(a2.x - b2.x, a2.y - b2.y);
      if (before > 0 && after > 0) this.zoomBy(before / after, (a2.x + b2.x) / 2, (a2.y + b2.y) / 2);
      this.dragged = true;
      return;
    }
    p.x = e.clientX; p.y = e.clientY;
    if (Math.abs(e.clientX - this.downAt.x) + Math.abs(e.clientY - this.downAt.y) > 3) this.dragged = true;
    const now = performance.now();
    const dt = Math.max(1, now - this.lastMove);
    this.lastMove = now;
    const [da, db] = this._pan(dx, dy);
    this.vel.a = da / dt; this.vel.b = db / dt;
  }

  _up(e) {
    if (!this.pointers.has(e.pointerId)) return;
    this.pointers.delete(e.pointerId);
    if (performance.now() - this.lastMove > 80) this.vel.a = this.vel.b = 0;
    if (!this.dragged && e.button === 0 && this.pointers.size === 0) this.engine._emitClick(e);
  }

  /** move the view by a screen-space delta; returns the change applied */
  _pan(dx, dy) {
    const f = this.engine.focalPx / this.engine.dpr;
    if (this.isFlat) {
      const u = this.flat.dist / f;
      this.flat.x = clamp(this.flat.x - dx * u, -FLAT_W, FLAT_W);
      this.flat.y = clamp(this.flat.y + dy * u, -FLAT_H, FLAT_H);
      this.engine.requestRender();
      return [-dx * u, dy * u];
    }
    const g = this.globe;
    const radPerPx = Math.min(g.alt, 1.6) / f;
    const dLon = (-dx * radPerPx) / Math.max(0.25, Math.cos(g.lat * DEG)) / DEG;
    const dLat = (dy * radPerPx) / DEG;
    g.lon = wrapLon(g.lon + dLon);
    g.lat = clamp(g.lat + dLat, -88, 88);
    this.engine.requestRender();
    return [dLon, dLat];
  }

  _wheel(e) {
    if (!this.enabled) return;
    e.preventDefault();
    this.anim = null;
    const k = e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? 400 : 1;
    this.zoomBy(Math.exp(e.deltaY * k * 0.0013), e.clientX, e.clientY);
  }

  /** factor < 1 zooms in, keeping the point under the cursor roughly in place */
  zoomBy(factor, cx, cy) {
    const target = cx != null ? this.engine.pick(cx, cy) : null;
    if (this.isFlat) {
      const fl = this.flat;
      const nd = clamp(fl.dist * factor, MIN_DIST, MAX_DIST);
      const f = nd / fl.dist;
      if (target) {
        const [tx, ty] = flatPos(target.lon, target.lat);
        fl.x = clamp(fl.x + (tx - fl.x) * (1 - f), -FLAT_W, FLAT_W);
        fl.y = clamp(fl.y + (ty - fl.y) * (1 - f), -FLAT_H, FLAT_H);
      }
      fl.dist = nd;
    } else {
      const g = this.globe;
      const na = clamp(g.alt * factor, MIN_ALT, MAX_ALT);
      const f = na / g.alt;
      if (target && f < 1) {
        let dl = wrapLon(target.lon - g.lon);
        g.lon = wrapLon(g.lon + dl * (1 - f) * 0.9);
        g.lat = clamp(g.lat + (target.lat - g.lat) * (1 - f) * 0.9, -88, 88);
      }
      g.alt = na;
    }
    this.engine.requestRender();
  }

  _dbl(e) {
    const t = this.engine.pick(e.clientX, e.clientY);
    if (!t) return;
    if (this.isFlat) {
      const [x, y] = flatPos(t.lon, t.lat);
      this.animateFlat({ x, y, dist: Math.max(MIN_DIST, this.flat.dist * 0.4) }, 700);
    } else {
      this.flyTo(t.lon, t.lat, Math.max(MIN_ALT, this.globe.alt * 0.4), 800);
    }
  }

  _key(e) {
    const step = 40;
    const map = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    if (map[e.key]) { this._pan(...map[e.key]); e.preventDefault(); }
    if (e.key === '+' || e.key === '=') this.zoomBy(0.7);
    if (e.key === '-' || e.key === '_') this.zoomBy(1.4);
  }

  /** fly over the globe to (lon, lat) at altitude alt (Earth radii) */
  flyTo(lon, lat, alt = this.globe.alt, ms = 1800) {
    if (this.isFlat) {
      const [x, y] = flatPos(lon, lat);
      return this.animateFlat({ x, y, dist: clamp(alt, MIN_DIST, MAX_DIST) }, ms);
    }
    const from = { ...this.globe };
    const dLon = wrapLon(lon - from.lon);
    const arc = Math.acos(clamp(Math.sin(from.lat * DEG) * Math.sin(lat * DEG) +
      Math.cos(from.lat * DEG) * Math.cos(lat * DEG) * Math.cos(dLon * DEG), -1, 1));
    const peak = Math.max(from.alt, alt, Math.min(2.5, arc * 1.2));
    this.anim = {
      t0: performance.now(), ms,
      step: (t) => {
        const e = ease(t);
        this.globe.lon = wrapLon(from.lon + dLon * e);
        this.globe.lat = from.lat + (lat - from.lat) * e;
        // zoom in log space (smooth from orbit to street level) plus a hop for long trips
        const base = Math.exp(Math.log(from.alt) * (1 - e) + Math.log(Math.max(alt, MIN_ALT)) * e);
        const bump = (peak - Math.max(from.alt, alt)) * Math.sin(Math.PI * e);
        this.globe.alt = base + Math.max(0, bump);
      },
    };
    this.engine.requestRender();
    return new Promise((res) => { this.anim.done = res; });
  }

  animateFlat(to, ms = 1000) {
    const from = { ...this.flat };
    this.anim = {
      t0: performance.now(), ms,
      step: (t) => {
        const e = ease(t);
        this.flat.x = from.x + (to.x - from.x) * e;
        this.flat.y = from.y + (to.y - from.y) * e;
        this.flat.dist = Math.exp(Math.log(from.dist) * (1 - e) + Math.log(to.dist) * e);
      },
    };
    this.engine.requestRender();
    return new Promise((res) => { this.anim.done = res; });
  }

  /** called every frame; returns true while something is moving */
  tick() {
    let moving = false;
    if (this.anim) {
      const t = Math.min(1, (performance.now() - this.anim.t0) / this.anim.ms);
      this.anim.step(t);
      moving = true;
      if (t >= 1) { const d = this.anim.done; this.anim = null; d?.(); }
    } else if (this.pointers.size === 0 && (Math.abs(this.vel.a) > 1e-6 || Math.abs(this.vel.b) > 1e-6)) {
      // inertia after a flick
      if (this.isFlat) {
        this.flat.x = clamp(this.flat.x + this.vel.a * 16, -FLAT_W, FLAT_W);
        this.flat.y = clamp(this.flat.y + this.vel.b * 16, -FLAT_H, FLAT_H);
      } else {
        this.globe.lon = wrapLon(this.globe.lon + this.vel.a * 16);
        this.globe.lat = clamp(this.globe.lat + this.vel.b * 16, -88, 88);
      }
      this.vel.a *= 0.9; this.vel.b *= 0.9;
      if (Math.abs(this.vel.a) < 1e-5 && Math.abs(this.vel.b) < 1e-5) this.vel.a = this.vel.b = 0;
      moving = true;
    }
    return moving;
  }
}

export function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
