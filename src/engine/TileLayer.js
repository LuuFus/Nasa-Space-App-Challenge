import * as THREE from 'three';
import { DEG, GLSL_PROJECTION, equalEarth } from './projection.js';

// ---------------------------------------------------------------------------
// NASA GIBS tiles in EPSG:4326. Level z has tiles of 288/2^z degrees and 512 px;
// level 0 is 2×1 tiles (the grid is larger than the world, extra parts are empty).
// Each tile becomes a small curved patch; the shader places it on the globe or
// on the flat map. Tiles are chosen every frame so roughly one texture pixel
// covers one screen pixel (like Google Earth), with parents shown while children load.
// ---------------------------------------------------------------------------

export const TILE_PX = 512;
export const tileSpan = (z) => 288 / 2 ** z;

export function tileExtent(z, x, y) {
  const S = tileSpan(z);
  const w = -180 + x * S, n = 90 - y * S;
  return {
    S, w, n, // unclamped origin
    lonW: Math.max(-180, w), lonE: Math.min(180, w + S),
    latN: Math.min(90, n), latS: Math.max(-90, n - S),
  };
}

export function tileChildren(z, x, y) {
  const S = tileSpan(z + 1);
  const out = [];
  for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    const cx = 2 * x + dx, cy = 2 * y + dy;
    if (cx * S < 360 && cy * S < 180) out.push([z + 1, cx, cy]);
  }
  return out;
}

// ------------------------------------------------------------------ geometry cache (shared)
const geomCache = new Map();
export function tileGeometry(z, x, y) {
  const key = `${z}/${x}/${y}`;
  let g = geomCache.get(key);
  if (g) return g;
  const e = tileExtent(z, x, y);
  const dLon = e.lonE - e.lonW, dLat = e.latN - e.latS;
  const nx = Math.max(4, Math.min(64, Math.ceil(dLon / 2)));
  const ny = Math.max(4, Math.min(64, Math.ceil(dLat / 2)));
  const ll = new Float32Array((nx + 1) * (ny + 1) * 2);
  const tuv = new Float32Array((nx + 1) * (ny + 1) * 2);
  const pos = new Float32Array((nx + 1) * (ny + 1) * 3);
  let k = 0;
  for (let j = 0; j <= ny; j++) {
    const lat = e.latN - (dLat * j) / ny;
    for (let i = 0; i <= nx; i++) {
      const lon = e.lonW + (dLon * i) / nx;
      ll[k * 2] = lon * DEG;
      ll[k * 2 + 1] = lat * DEG;
      tuv[k * 2] = (lon - e.w) / e.S;
      tuv[k * 2 + 1] = (e.n - lat) / e.S;
      const c = Math.cos(lat * DEG);
      pos[k * 3] = c * Math.sin(lon * DEG);
      pos[k * 3 + 1] = Math.sin(lat * DEG);
      pos[k * 3 + 2] = c * Math.cos(lon * DEG);
      k++;
    }
  }
  const idx = [];
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i, b = a + nx + 1, c = a + 1, d = b + 1;
      idx.push(a, b, c, b, d, c);
    }
  }
  g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('lonlat', new THREE.BufferAttribute(ll, 2));
  g.setAttribute('tuv', new THREE.BufferAttribute(tuv, 2));
  g.setIndex(idx);
  // culling/LOD helpers
  const cLon = (e.lonW + e.lonE) / 2, cLat = (e.latN + e.latS) / 2;
  const cc = Math.cos(cLat * DEG);
  const center = new THREE.Vector3(cc * Math.sin(cLon * DEG), Math.sin(cLat * DEG), cc * Math.cos(cLon * DEG));
  let rho = 0;
  const flatPts = [];
  for (const lo of [e.lonW, cLon, e.lonE]) {
    for (const la of [e.latS, cLat, e.latN]) {
      const c2 = Math.cos(la * DEG);
      const v = new THREE.Vector3(c2 * Math.sin(lo * DEG), Math.sin(la * DEG), c2 * Math.cos(lo * DEG));
      rho = Math.max(rho, center.angleTo(v));
      flatPts.push(equalEarth(lo * DEG, la * DEG));
    }
  }
  const fb = new THREE.Box3(
    new THREE.Vector3(Math.min(...flatPts.map((p) => p[0])), Math.min(...flatPts.map((p) => p[1])), -0.01),
    new THREE.Vector3(Math.max(...flatPts.map((p) => p[0])), Math.max(...flatPts.map((p) => p[1])), 0.05),
  );
  g.userData = { e, center, rho, flatBox: fb };
  geomCache.set(key, g);
  return g;
}

// ------------------------------------------------------------------ loader queue (shared)
class Scheduler {
  constructor() {
    this.queue = new Map(); // url -> job
    this.active = 0;
    this.max = 16;
    this.frame = 0;
  }
  /** ask for a URL; calling again each frame keeps the request alive */
  request(url, priority, onDone) {
    let j = this.queue.get(url);
    if (!j) {
      j = { url, priority, frame: this.frame, cbs: [], started: false };
      this.queue.set(url, j);
    } else {
      j.priority = Math.min(j.priority, priority);
      j.frame = this.frame;
    }
    if (onDone) j.cbs.push(onDone);
  }
  tick() {
    this.frame++;
    if (this.active >= this.max) return;
    const waiting = [];
    for (const j of this.queue.values()) {
      if (j.started) continue;
      if (this.frame - j.frame > 3) { // nobody wants it any more
        this.queue.delete(j.url);
        j.cbs.forEach((cb) => cb(null, 'dropped'));
        continue;
      }
      waiting.push(j);
    }
    waiting.sort((a, b) => a.priority - b.priority);
    for (const j of waiting) {
      if (this.active >= this.max) break;
      j.started = true;
      this.active++;
      loadImage(j.url)
        .then((img) => j.cbs.forEach((cb) => cb(img, null)))
        .catch((err) => j.cbs.forEach((cb) => cb(null, err)))
        .finally(() => { this.active--; this.queue.delete(j.url); });
    }
  }
}
export const scheduler = new Scheduler();

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('tile failed: ' + url));
    img.src = url;
  });
}

// ------------------------------------------------------------------ material
const VERT = /* glsl */ `
${GLSL_PROJECTION}
attribute vec2 lonlat;
attribute vec2 tuv;
uniform vec3 uUV;     // offset.xy, scale  (when a parent tile stands in for a child)
uniform float uLift;
varying vec2 vUv;
void main() {
  vec2 t = uUV.xy + tuv * uUV.z;
  vUv = vec2(t.x, 1.0 - t.y);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(surfacePos(lonlat, uLift), 1.0);
}`;

const FRAG = /* glsl */ `
uniform sampler2D uTex;
uniform float uOpacity;
uniform int uMode;      // 0 = as is, 1 = keep only clouds, 2 = black "no data" becomes a hole
uniform float uTexel;   // one texel of the tile texture
varying vec2 vUv;
float noData(vec2 uv) { vec3 c = texture2D(uTex, uv).rgb; return step(max(c.r, max(c.g, c.b)), 0.045); }
void main() {
  vec4 c = texture2D(uTex, vUv);
  if (uMode == 2) {
    // the hole is widened by ~2 texels: the edge of a swath is blurred into dark
    // grey by filtering, which would otherwise show as thin black seams
    float t = uTexel * 2.0;
    if (noData(vUv) + noData(vUv + vec2(t, 0.0)) + noData(vUv - vec2(t, 0.0)) + noData(vUv + vec2(0.0, t)) + noData(vUv - vec2(0.0, t)) > 0.5) discard;
  }
  if (uMode == 1) {
    float lum = dot(c.rgb, vec3(0.299, 0.587, 0.114));
    float sat = max(c.r, max(c.g, c.b)) - min(c.r, min(c.g, c.b));
    float a = smoothstep(0.36, 0.78, lum) * (1.0 - smoothstep(0.07, 0.2, sat));
    c = vec4(vec3(0.94 + 0.06 * lum), a * 0.95);
  }
  gl_FragColor = vec4(c.rgb, c.a * uOpacity);
  if (gl_FragColor.a < 0.004) discard;
}`;

// ------------------------------------------------------------------ the layer
export class TileLayer {
  /**
   * @param engine   Engine (for shared uniforms and view state)
   * @param opts     { id, url(z,x,y) => string, maxLevel, lift, opacity, transparent, mode, renderOrder }
   */
  constructor(engine, opts) {
    this.engine = engine;
    this.id = opts.id;
    this.urlFn = opts.url;
    this.maxLevel = opts.maxLevel ?? 8;
    this.lift = opts.lift ?? 0;
    this.opacity = opts.opacity ?? 1;
    this.mode = opts.mode ?? 0;
    this.transparent = opts.transparent ?? true;
    this.lodBias = opts.lodBias ?? 1.3;
    this.group = new THREE.Group();
    this.group.renderOrder = opts.renderOrder ?? 0;
    this.tiles = new Map(); // key -> { state, tex, img, used }
    this.pool = [];
    this.inUse = 0;
    this.maxTextures = opts.maxTextures ?? 140;
    this.sourceKey = opts.sourceKey ?? '';
    this.visible = true;
    this.loading = 0;
  }

  setSource(url, maxLevel, sourceKey, mode) {
    if (mode != null) this.mode = mode;
    if (sourceKey === this.sourceKey) return;
    this.urlFn = url;
    this.maxLevel = maxLevel;
    this.sourceKey = sourceKey;
    // the old picture stays on screen until the new tiles arrive (no blank globe)
    this._dropPrev();
    this.prev = this.tiles.size ? this.tiles : null;
    this._prevIdle = 0;
    this.tiles = new Map();
    // whole-world coarse tiles first: something sensible appears almost at once
    if (url) {
      for (const [z, x, y] of [[0, 0, 0], [0, 1, 0], [1, 0, 0], [1, 1, 0], [1, 2, 0], [1, 0, 1], [1, 1, 1], [1, 2, 1]]) {
        this._request(this._tile(z, x, y), -10 + z);
      }
    }
  }

  _dropPrev() {
    if (!this.prev) return;
    for (const t of this.prev.values()) t.tex?.dispose();
    this.prev = null;
  }

  setOpacity(o) { this.opacity = o; }

  _mesh() {
    let m = this.pool[this.inUse];
    if (!m) {
      const mat = new THREE.ShaderMaterial({
        vertexShader: VERT, fragmentShader: FRAG,
        uniforms: {
          uMorph: this.engine.uniforms.uMorph,
          uTex: { value: null }, uUV: { value: new THREE.Vector3(0, 0, 1) },
          uLift: { value: this.lift }, uOpacity: { value: 1 }, uMode: { value: this.mode }, uTexel: { value: 1 / TILE_PX },
        },
        transparent: this.transparent,
        depthTest: this.engine.depthOn,
        depthWrite: this.engine.depthOn && !this.transparent,
      });
      mat.userData.surface = true;
      m = new THREE.Mesh(undefined, mat);
      m.frustumCulled = false;
      m.renderOrder = this.group.renderOrder;
      this.pool.push(m);
      this.group.add(m);
    }
    this.inUse++;
    return m;
  }

  _tile(z, x, y) {
    const key = `${z}/${x}/${y}`;
    let t = this.tiles.get(key);
    if (!t) { t = { state: 'idle', tex: null, used: 0, z, x, y }; this.tiles.set(key, t); }
    return t;
  }

  _request(t, priority) {
    if (t.state !== 'idle') return;
    const url = this.urlFn(t.z, t.x, t.y);
    if (!url) { t.state = 'empty'; return; }
    t.state = 'loading';
    const src = this.sourceKey;
    t.url = url;
    scheduler.request(url, priority, (img, err) => {
      if (src !== this.sourceKey) return; // the date/layer changed meanwhile
      if (err === 'dropped') { t.state = 'idle'; return; }
      if (!img) {
        // missing tile (404) or a network hiccup: try again a couple of times, later
        t.tries = (t.tries || 0) + 1;
        t.state = 'empty';
        if (t.tries < 3) setTimeout(() => { if (t.state === 'empty') { t.state = 'idle'; this.engine.requestRender(); } }, 4000 * t.tries);
        return;
      }
      // turning an image into a GPU texture is expensive: the engine does a few per frame
      t.state = 'pending';
      this.engine.enqueueUpload(() => {
        if (src !== this.sourceKey) return;
        const tex = new THREE.Texture(img);
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.anisotropy = Math.min(8, this.engine.maxAniso);
        tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.needsUpdate = true;
        t.tex = tex;
        t.img = img;
        t.state = 'ready';
        t.readyAt = performance.now();
      });
      this.engine.requestRender();
    });
  }

  /** true when the picture on the screen is complete: no stand-in tiles, nothing that is shown still loading */
  isComplete() {
    if (!this.visible || !this.urlFn) return true;
    if (this._usedPrev > 0) return false;
    for (const t of this.tiles.values()) if (t.used === this.frame && (t.state === 'loading' || t.state === 'pending' || t.state === 'idle')) return false;
    return true;
  }

  /** Choose tiles for this frame. view: { camera, frustum, focalPx, morph, frame } */
  update(view) {
    this.inUse = 0;
    this._usedPrev = 0;
    this.frame = view.frame;
    if (this.visible && this.urlFn) {
      this._visit(0, 0, 0, view);
      this._visit(0, 1, 0, view);
    }
    for (let i = 0; i < this.pool.length; i++) this.pool[i].visible = i < this.inUse;
    if (this.prev && this._usedPrev === 0 && ++this._prevIdle > 20) this._dropPrev();
    this._evict();
  }

  _metric(g, view) {
    const { e, center, rho, flatBox } = g.userData;
    const cam = view.camera.position;
    const texelRad = (e.S * DEG) / TILE_PX;
    if (view.morph > 0 && view.morph < 1) {
      // while the globe unrolls nothing can be culled reliably: keep coarse tiles everywhere
      const d = Math.max(0.8, view.camera.position.length() - 1);
      return { px: (texelRad / d) * view.focalPx * 0.5, d };
    }
    if (view.morph === 0) {
      const dist = cam.length();
      const theta = center.angleTo(cam);
      const horizon = Math.acos(Math.min(1, 1 / dist));
      if (theta - rho > horizon + 0.02) return null; // behind the globe
      view.sphere.center.copy(center).multiplyScalar(Math.cos(rho * 0.5));
      view.sphere.radius = 2 * Math.sin(Math.min(rho, Math.PI / 2) / 2) + 0.02;
      if (view.morph === 0 && !view.frustum.intersectsSphere(view.sphere)) return null;
      const phi = Math.max(0, theta - rho);
      const d = Math.sqrt(Math.max(1e-10, dist * dist + 1 - 2 * dist * Math.cos(phi)));
      return { px: (texelRad / d) * view.focalPx, d };
    }
    if (view.morph === 1 && !view.frustum.intersectsBox(flatBox)) return null;
    const d = Math.max(1e-6, flatBox.distanceToPoint(cam));
    return { px: (texelRad * 0.85 / d) * view.focalPx, d };
  }

  _visit(z, x, y, view) {
    const g = tileGeometry(z, x, y);
    const m = this._metric(g, view);
    if (!m) return;
    const wantSplit = z < this.maxLevel && m.px > 1.15 * this.lodBias;
    if (wantSplit) {
      for (const [cz, cx, cy] of tileChildren(z, x, y)) this._visit(cz, cx, cy, view);
      return;
    }
    const t = this._tile(z, x, y);
    t.used = view.frame;
    if (t.state === 'idle') this._request(t, z * 1000 + m.d);
    else if (t.state === 'loading') scheduler.request(t.url, z * 1000 + m.d); // still wanted
    if (t.state === 'ready') return this._draw(g, t, z, x, y);
    // not ready: stand-in from the closest loaded ancestor (parents load first, so this is
    // usually just one level coarser), otherwise from the previous date/layer
    let pz = z, px = x, py = y;
    while (pz > 0) {
      pz--; px >>= 1; py >>= 1;
      const p = this._tile(pz, px, py);
      p.used = view.frame;
      if (p.state === 'ready') return this._draw(g, p, z, x, y);
      if (pz >= z - 2) {
        if (p.state === 'idle') this._request(p, pz * 1000 - 500);
        else if (p.state === 'loading') scheduler.request(p.url, pz * 1000 - 500);
      }
    }
    if (this.prev) {
      let qz = z, qx = x, qy = y;
      for (;;) {
        const q = this.prev.get(`${qz}/${qx}/${qy}`);
        if (q && q.state === 'ready') { this._usedPrev++; return this._draw(g, q, z, x, y, true); }
        if (qz === 0) break;
        qz--; qx >>= 1; qy >>= 1;
      }
    }
  }

  _draw(g, t, z, x, y, old = false) {
    const m = this._mesh();
    m.geometry = g;
    const u = m.material.uniforms;
    u.uTex.value = t.tex;
    // new tiles fade in over ~0.3 s instead of popping in as squares
    const age = old ? 1 : Math.min(1, (performance.now() - (t.readyAt || 0)) / 300);
    if (age < 1) this.engine.requestRender();
    u.uOpacity.value = this.opacity * (this.transparent ? age : 1);
    u.uLift.value = this.lift;
    u.uMode.value = this.mode;
    if (t.z === z) u.uUV.value.set(0, 0, 1);
    else {
      const k = 2 ** (z - t.z);
      u.uUV.value.set(x / k - t.x, y / k - t.y, 1 / k);
    }
  }

  _evict() {
    if (this.tiles.size <= this.maxTextures) return;
    const list = [...this.tiles.entries()].filter(([, t]) => t.used !== this.frame && t.state !== 'loading' && t.state !== 'pending');
    list.sort((a, b) => a[1].used - b[1].used);
    let extra = this.tiles.size - this.maxTextures;
    for (const [k, t] of list) {
      if (extra-- <= 0) break;
      if (t.z <= 1) continue; // keep the whole-world tiles
      t.tex?.dispose();
      this.tiles.delete(k);
    }
  }

  /** Colour of the loaded image under lon/lat (for reading values off a data layer). */
  sample(lon, lat) {
    let best = null;
    for (const t of this.tiles.values()) {
      if (t.state !== 'ready') continue;
      const e = tileExtent(t.z, t.x, t.y);
      if (lon < e.lonW || lon > e.lonE || lat < e.latS || lat > e.latN) continue;
      if (!best || t.z > best.z) best = t;
    }
    if (!best) return null;
    const e = tileExtent(best.z, best.x, best.y);
    const px = Math.min(TILE_PX - 1, Math.floor(((lon - e.w) / e.S) * TILE_PX));
    const py = Math.min(TILE_PX - 1, Math.floor(((e.n - lat) / e.S) * TILE_PX));
    if (!best.data) {
      const c = document.createElement('canvas');
      c.width = c.height = TILE_PX;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(best.img, 0, 0);
      try { best.data = ctx.getImageData(0, 0, TILE_PX, TILE_PX).data; } catch { return null; }
    }
    const i = (py * TILE_PX + px) * 4;
    const d = best.data;
    return [d[i], d[i + 1], d[i + 2], d[i + 3]];
  }

  dispose() {
    for (const t of this.tiles.values()) t.tex?.dispose();
    this.tiles.clear();
    for (const m of this.pool) m.material.dispose();
    this.group.removeFromParent();
  }
}

// GIBS URL builder
export function gibsUrl(layer, date) {
  const ext = layer.format === 'png' ? 'png' : 'jpg';
  const time = date ? date : 'default';
  return (z, x, y) =>
    `https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/${layer.gibs}/default/${time}/${layer.tms}/${z}/${y}/${x}.${ext}`;
}
