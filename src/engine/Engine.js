import * as THREE from 'three';
import { Controls, MAX_ALT, clamp } from './Controls.js';
import { DEG, FLAT_H, FLAT_W, equalEarthInverse, flatPos, globePos, vecToLonLat } from './projection.js';
import { TileLayer, gibsUrl, scheduler } from './TileLayer.js';
import { SurfaceLayer } from './SurfaceLayer.js';
import { Labels } from './Labels.js';

// colours are used exactly as written (sRGB numbers), NASA tiles are shown untouched
THREE.ColorManagement.enabled = false;

// Daily satellite pictures have black stripes between orbits ("no data").
// Those pixels are made transparent and a second picture fills them:
// the twin satellite on the same day (Terra <-> Aqua, NOAA-20 <-> Suomi NPP).
const TWIN = {
  MODIS_Terra_CorrectedReflectance_TrueColor: { gibs: 'MODIS_Aqua_CorrectedReflectance_TrueColor', tms: '250m', format: 'jpg', maxLevel: 8 },
  MODIS_Aqua_CorrectedReflectance_TrueColor: { gibs: 'MODIS_Terra_CorrectedReflectance_TrueColor', tms: '250m', format: 'jpg', maxLevel: 8 },
  VIIRS_NOAA20_CorrectedReflectance_TrueColor: { gibs: 'VIIRS_SNPP_CorrectedReflectance_TrueColor', tms: '250m', format: 'jpg', maxLevel: 8 },
  MODIS_Terra_CorrectedReflectance_Bands721: { gibs: 'MODIS_Aqua_CorrectedReflectance_Bands721', tms: '250m', format: 'jpg', maxLevel: 8 },
  // Landsat mosaics of the 1980s have empty areas: show Blue Marble there
  Landsat_WELD_CorrectedReflectance_TrueColor_Global_Annual: { gibs: 'BlueMarble_NextGeneration', tms: '500m', format: 'jpg', maxLevel: 7, static: true },
};
// daily data layers with swath gaps: the previous day fills them
const GAPPY = new Set(['OMI_Nitrogen_Dioxide_Tropo_Column', 'TROPOMI_L2_Nitrogen_Dioxide_Tropospheric_Column',
  'OMPS_Ozone_Total_Column', 'OMI_Ozone_TOMS_Total_Column', 'MODIS_Aqua_L2_Chlorophyll_A']);

function prevDay(date) {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

const COLORS = {
  space: new THREE.Color(0x000000),
  paper: new THREE.Color(0xf3f6f9),   // background around the contour map
  dark: new THREE.Color(0x0d1626),    // background around the imagery map
  oceanGlobe: new THREE.Color(0x0a1b36),
  oceanContour: new THREE.Color(0xc9e4f4),
};

/**
 * The 3D Earth. Plain Three.js, no React inside — the UI talks to it through
 * the small public API below (setBase, setOverlay, setMode, setSwipe, ...).
 */
export class Engine {
  constructor(container) {
    this.container = container;
    this.listeners = {};
    this.mode = 'globe';
    this.flatStyle = 'contour';
    this.morph = 0;
    this.dirty = true;
    this.frame = 0;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace; // keep NASA colours exactly as delivered
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(this.dpr);
    renderer.domElement.className = 'globe-canvas';
    container.appendChild(renderer.domElement);
    this.renderer = renderer;
    this.maxAniso = renderer.capabilities.getMaxAnisotropy();

    this.scene = new THREE.Scene();
    this.scene.background = COLORS.space.clone();
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.01, 100);

    this.uniforms = {
      uMorph: { value: 0 },
      uViewport: { value: new THREE.Vector2(1, 1) },
      uDpr: { value: this.dpr },
      uPxPerKm: { value: 1 },
      uCam: { value: new THREE.Vector3() },
    };

    // ------------------------------------------------------------ layer stack
    // Surface layers are drawn without a depth test: on a convex globe back-face
    // culling alone hides the far side, and the layers simply stack by renderOrder.
    // Only the "under" sphere writes depth (it hides the stars and the far half of
    // the atmosphere). During the globe<->map morph depth testing is switched on.
    this.depthOn = false;
    this.under = new SurfaceLayer(this, { color: COLORS.oceanGlobe, lift: -0.002, renderOrder: 0, depth: true });
    this.scene.add(this.under.mesh);
    this.uploads = [];
    this.lineLayers = [];
    this.base = new TileLayer(this, { id: 'base', transparent: false, renderOrder: 1, lift: 0, maxTextures: 180 });
    this.baseFill = new TileLayer(this, { id: 'baseFill', transparent: false, renderOrder: 0.5, lift: 0, maxTextures: 120, lodBias: 1.4 });
    this.scene.add(this.base.group, this.baseFill.group);
    // the two sides of the before/after swipe (each with its own gap filler)
    this.swipeL = new TileLayer(this, { id: 'swipeL', transparent: false, renderOrder: 1, lift: 0 });
    this.swipeR = new TileLayer(this, { id: 'swipeR', transparent: false, renderOrder: 1, lift: 0 });
    this.swipeLFill = new TileLayer(this, { id: 'swipeLFill', transparent: false, renderOrder: 0.5, lift: 0, lodBias: 1.4, maxTextures: 80 });
    this.swipeRFill = new TileLayer(this, { id: 'swipeRFill', transparent: false, renderOrder: 0.5, lift: 0, lodBias: 1.4, maxTextures: 80 });
    this.scene.add(this.swipeL.group, this.swipeR.group, this.swipeLFill.group, this.swipeRFill.group);
    this.land = new SurfaceLayer(this, { lift: 0.000005, transparent: true, renderOrder: 2 });
    this.land.visible = false;
    this.scene.add(this.land.mesh);
    this.overlay = new TileLayer(this, { id: 'overlay', transparent: true, renderOrder: 3, lift: 0.00001, maxTextures: 160 });
    this.overlayFill = new TileLayer(this, { id: 'overlayFill', transparent: true, renderOrder: 2.9, lift: 0.000008, maxTextures: 100 });
    this.overlayFill.visible = false;
    this.scene.add(this.overlay.group, this.overlayFill.group);
    this.image = new SurfaceLayer(this, { lift: 0.000015, transparent: true, renderOrder: 4 });
    this.image.visible = false;
    this.scene.add(this.image.mesh);
    this.tint = new SurfaceLayer(this, { lift: 0.00002, transparent: true, renderOrder: 5 });
    this.tint.visible = false;
    this.scene.add(this.tint.mesh);
    this.clouds = new TileLayer(this, { id: 'clouds', transparent: true, renderOrder: 6, lift: 0.0011, mode: 1, lodBias: 1.6, maxTextures: 100 });
    this.clouds.visible = false;
    this.scene.add(this.clouds.group);

    this._makeAtmosphere();
    this._makeStars();

    this.controls = new Controls(this);
    this.labels = new Labels(this, container);
    this.swipe = { enabled: false, split: 0.5 };

    this.view = { camera: this.camera, frustum: new THREE.Frustum(), sphere: new THREE.Sphere(), focalPx: 1, morph: 0, frame: 0 };
    this._vp = new THREE.Matrix4();
    this._ray = new THREE.Raycaster();
    this._ndc = new THREE.Vector2();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();

    renderer.domElement.addEventListener('pointermove', (e) => this._hover(e));
    renderer.domElement.addEventListener('pointerleave', () => this.emit('hover', null));
    this._loop = this._loop.bind(this);
    this.raf = requestAnimationFrame(this._loop);
  }

  // ------------------------------------------------------------------ events
  on(name, cb) { (this.listeners[name] ||= new Set()).add(cb); return () => this.listeners[name].delete(cb); }
  emit(name, data) { this.listeners[name]?.forEach((cb) => cb(data)); }
  requestRender() { this.dirty = true; }

  _hover(e) {
    if (this.controls.pointers.size) return;
    const now = performance.now();
    if (now - (this._lastHover || 0) < 40) return;
    this._lastHover = now;
    const p = this.pick(e.clientX, e.clientY);
    const r = this.renderer.domElement.getBoundingClientRect();
    this.emit('hover', p ? { ...p, x: e.clientX - r.left, y: e.clientY - r.top } : null);
  }

  _emitClick(e) {
    const p = this.pick(e.clientX, e.clientY);
    if (p) this.emit('click', p);
  }

  // ------------------------------------------------------------------ public API
  /** main picture + its gap filler (twin satellite) */
  _setPair(main, fill, layer, date) {
    const twin = TWIN[layer.gibs];
    main.visible = true;
    main.setSource(gibsUrl(layer, date), layer.maxLevel, `${layer.id}@${date}`, twin ? 2 : 0);
    fill.visible = !!twin;
    if (twin) fill.setSource(gibsUrl(twin, twin.static ? null : date), twin.maxLevel, `${twin.gibs}@${twin.static ? '' : date}`, twin.static ? 0 : 2);
  }

  setBase(layer, date) {
    if (!layer) { this.base.visible = false; this.baseFill.visible = false; this.requestRender(); return; }
    this._setPair(this.base, this.baseFill, layer, date);
    this.requestRender();
  }

  setOverlay(layer, date, opacity = 0.85) {
    if (!layer) { this.overlay.visible = false; this.overlayFill.visible = false; this.overlayLayer = null; this.requestRender(); return; }
    this.overlay.visible = true;
    this.overlayLayer = layer;
    this.overlay.setSource(gibsUrl(layer, date), layer.maxLevel, `${layer.id}@${date}`);
    this.overlay.setOpacity(opacity);
    const gappy = GAPPY.has(layer.gibs) && date;
    this.overlayFill.visible = !!gappy;
    if (gappy) {
      const d = prevDay(date);
      this.overlayFill.setSource(gibsUrl(layer, d), layer.maxLevel, `${layer.id}@${d}`);
      this.overlayFill.setOpacity(opacity);
    }
    this.requestRender();
  }

  setOverlayOpacity(o) { this.overlay.setOpacity(o); this.overlayFill.setOpacity(o); this.requestRender(); }

  enqueueUpload(fn) { this.uploads.push(fn); this.dirty = true; }

  setClouds(on, date) {
    this.clouds.visible = on;
    if (on) {
      this.clouds.setSource(
        gibsUrl({ gibs: 'VIIRS_NOAA20_CorrectedReflectance_TrueColor', tms: '250m', format: 'jpg' }, date),
        5, `clouds@${date}`);
    }
    this.requestRender();
  }

  /** our own equirectangular pictures (trend maps); url = null hides it */
  setImage(url, opacity = 0.85) {
    if (!url) { this.image.visible = false; this.requestRender(); return; }
    if (url !== this._imageUrl) {
      this._imageUrl = url;
      new THREE.TextureLoader().load(url, (tex) => {
        if (this._imageUrl !== url) return;
        tex.userData.owned = true;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.NearestFilter;
        this.image.setTexture(tex);
      });
    }
    this.image.visible = true;
    this.image.setOpacity(opacity);
    this.requestRender();
  }

  setFlatStyle(style) {
    this.flatStyle = style;
    this._applyStyle();
  }

  _applyStyle() {
    const contour = this.mode === 'flat' && this.flatStyle === 'contour';
    this.contour = contour;
    this.under.setColor(contour ? COLORS.oceanContour : COLORS.oceanGlobe);
    this.land.visible = contour && !!this.land.material.uniforms.uTex.value;
    this.base.group.visible = !contour;
    this.baseFill.group.visible = !contour;
    this.emit('style', { contour });
    this.requestRender();
  }

  /** switch between the 3D globe and the flat (contour) map with an animation */
  setMode(mode, { animate = true } = {}) {
    if (mode === this.mode) return Promise.resolve();
    const c = this.controls;
    if (mode === 'flat') {
      const g = c.globe;
      if (g.alt > 1.2) c.flat = { x: 0, y: 0.08, dist: this._fitDist() };
      else {
        const [x, y] = flatPos(g.lon, g.lat);
        c.flat = { x, y, dist: clamp(g.alt * 1.15, 0.001, this._fitDist()) };
      }
    } else {
      const f = c.flat;
      const ll = equalEarthInverse(f.x, f.y);
      if (ll) { c.globe.lon = ll[0] / DEG; c.globe.lat = clamp(ll[1] / DEG, -80, 80); }
      c.globe.alt = clamp(f.dist / 1.15, 0.001, 2.6);
      if (f.dist >= this._fitDist() * 0.8) c.globe.alt = 2.4;
    }
    this.mode = mode;
    this._applyStyle();
    const to = mode === 'flat' ? 1 : 0;
    if (!animate) { this.morph = to; this.requestRender(); return Promise.resolve(); }
    const from = this.morph;
    const t0 = performance.now();
    const ms = 1400;
    return new Promise((res) => {
      this.morphAnim = {
        step: () => {
          const t = Math.min(1, (performance.now() - t0) / ms);
          const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
          this.morph = from + (to - from) * e;
          if (t >= 1) { this.morph = to; this.morphAnim = null; res(); }
        },
      };
      this.requestRender();
    });
  }

  _fitDist() {
    const tan = Math.tan((this.camera.fov * DEG) / 2);
    const needH = (FLAT_H * 2 * 1.06) / (2 * tan);
    const needW = (FLAT_W * 2 * 1.04) / (2 * tan * this.camera.aspect);
    return Math.max(needH, needW);
  }

  setSwipe(s) {
    this.swipe = { ...this.swipe, ...s };
    if (s.left) this._setPair(this.swipeL, this.swipeLFill, s.left.layer, s.left.date);
    if (s.right) this._setPair(this.swipeR, this.swipeRFill, s.right.layer, s.right.date);
    this.requestRender();
  }

  flyTo(lon, lat, alt, ms) { return this.controls.flyTo(lon, lat, alt, ms); }

  /** colour under lon/lat in the active data layer -> [r,g,b,a] */
  sampleOverlay(lon, lat) {
    if (!this.overlay.visible) return null;
    return this.overlay.sample(lon, lat);
  }

  // ------------------------------------------------------------------ geometry helpers
  /** screen pixel -> {lon, lat} (degrees) or null when pointing at space */
  pick(clientX, clientY) {
    const r = this.renderer.domElement.getBoundingClientRect();
    this._ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    this._ray.setFromCamera(this._ndc, this.camera);
    const { origin, direction } = this._ray.ray;
    if (this.morph < 0.02) {
      const b = origin.dot(direction);
      const c = origin.lengthSq() - 1;
      const disc = b * b - c;
      if (disc < 0) return null;
      const t = -b - Math.sqrt(disc);
      if (t < 0) return null;
      const p = origin.clone().addScaledVector(direction, t);
      const [lon, lat] = vecToLonLat(p.x, p.y, p.z);
      return { lon, lat };
    }
    if (this.morph > 0.98) {
      if (Math.abs(direction.z) < 1e-9) return null;
      const t = -origin.z / direction.z;
      if (t < 0) return null;
      const x = origin.x + direction.x * t, y = origin.y + direction.y * t;
      const ll = equalEarthInverse(x, y);
      if (!ll) return null;
      return { lon: ll[0] / DEG, lat: ll[1] / DEG };
    }
    return null;
  }

  /** lon/lat -> screen pixel {x, y} (CSS px) or null if hidden behind the globe */
  project(lon, lat) {
    const m = this.morph;
    const g = globePos(lon, lat, 1.0005);
    let v;
    if (m <= 0) {
      v = this._v1 || (this._v1 = new THREE.Vector3());
      v.set(g[0], g[1], g[2]);
      const cam = this.camera.position;
      if (v.dot(cam) < 1.0 + 0.01 * Math.min(1, cam.length() - 1)) return null; // over the horizon
    } else {
      const f = flatPos(lon, lat);
      v = this._v1 || (this._v1 = new THREE.Vector3());
      v.set(g[0] + (f[0] - g[0]) * m, g[1] + (f[1] - g[1]) * m, g[2] + (0.001 - g[2]) * m);
      if (m < 0.98) return null;
    }
    v.project(this.camera);
    if (v.z > 1) return null;
    return { x: (v.x + 1) * 0.5 * this.width, y: (1 - v.y) * 0.5 * this.height };
  }

  get altitudeKm() {
    return this.mode === 'flat' ? this.controls.flat.dist * 6371 : this.controls.globe.alt * 6371;
  }

  // ------------------------------------------------------------------ scene pieces
  _makeAtmosphere() {
    const geo = new THREE.SphereGeometry(1.025, 96, 64);
    this.atmo = new THREE.Mesh(geo, new THREE.ShaderMaterial({
      uniforms: { uOpacity: { value: 1 } },
      vertexShader: `varying vec3 vN; varying vec3 vP;
        void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.0); vP = mv.xyz; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform float uOpacity; varying vec3 vN; varying vec3 vP;
        void main(){ vec3 v = normalize(-vP); float d = dot(vN, v);
          float i = pow(clamp(1.0 + d * 1.6, 0.0, 1.0), 3.0);
          gl_FragColor = vec4(vec3(0.35, 0.62, 1.0) * i * 1.3, i) * uOpacity; }`,
      side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
    }));
    this.atmo.renderOrder = 20;
    this.scene.add(this.atmo);
    // soft haze over the edge of the globe (as seen from space)
    this.haze = new THREE.Mesh(new THREE.SphereGeometry(1.002, 96, 64), new THREE.ShaderMaterial({
      uniforms: { uOpacity: { value: 1 } },
      vertexShader: `varying vec3 vN; varying vec3 vP;
        void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.0); vP = mv.xyz; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform float uOpacity; varying vec3 vN; varying vec3 vP;
        void main(){ float f = 1.0 - max(0.0, dot(vN, normalize(-vP)));
          float a = pow(f, 3.5) * 0.75; gl_FragColor = vec4(0.62, 0.8, 1.0, a * uOpacity); }`,
      transparent: true, depthWrite: false,
    }));
    this.haze.renderOrder = 19;
    this.scene.add(this.haze);
  }

  _makeStars() {
    const n = 5000;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = Math.random() * 2 - 1, t = Math.random() * Math.PI * 2;
      const r = Math.sqrt(1 - u * u);
      pos.set([r * Math.cos(t) * 80, u * 80, r * Math.sin(t) * 80], i * 3);
      const b = 0.35 + Math.random() ** 3 * 0.65;
      col.set([b, b, b * (0.9 + Math.random() * 0.2)], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.stars = new THREE.Points(g, new THREE.PointsMaterial({ size: 1.4, sizeAttenuation: false, vertexColors: true, transparent: true, depthWrite: false }));
    this.stars.renderOrder = -1;
    this.scene.add(this.stars);
  }

  // ------------------------------------------------------------------ frame
  resize() {
    const w = this.container.clientWidth || 1, h = this.container.clientHeight || 1;
    this.width = w; this.height = h;
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = w + 'px';
    this.renderer.domElement.style.height = h + 'px';
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.uniforms.uViewport.value.set(w * this.dpr, h * this.dpr);
    this.focalPx = (h * this.dpr * 0.5) / Math.tan((this.camera.fov * DEG) / 2);
    this.requestRender();
  }

  _updateCamera() {
    const c = this.controls;
    const g = c.globe, f = c.flat, m = this.morph;
    const gp = globePos(g.lon, g.lat, 1 + g.alt);
    const fp = [f.x, f.y, f.dist];
    const cam = this.camera;
    if (m <= 0) {
      cam.position.set(...gp);
      cam.up.set(0, 1, 0);
      cam.lookAt(0, 0, 0);
      cam.near = Math.max(g.alt * 0.15, 0.00002);
      cam.far = 1 + g.alt + 2 + 100;
    } else if (m >= 1) {
      cam.position.set(...fp);
      cam.up.set(0, 1, 0);
      cam.lookAt(f.x, f.y, 0);
      cam.near = Math.max(f.dist * 0.15, 0.00002);
      cam.far = f.dist + 100;
    } else {
      // blend the two camera set-ups while the globe unrolls
      const e = m;
      cam.position.set(gp[0] + (fp[0] - gp[0]) * e, gp[1] + (fp[1] - gp[1]) * e, gp[2] + (fp[2] - gp[2]) * e);
      cam.up.set(0, 1, 0);
      cam.lookAt(f.x * e, f.y * e, 0);
      cam.near = 0.001;
      cam.far = 200;
    }
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
    // map scale for labels and dashes
    const alt = m >= 0.5 ? f.dist : g.alt;
    const pxPerRad = this.focalPx / this.dpr / Math.max(alt, 1e-6) * (m >= 0.5 ? 0.86 : 1);
    this.zoom = Math.log2((2 * Math.PI * pxPerRad) / 256);
    this.uniforms.uPxPerKm.value = (this.focalPx / Math.max(alt, 1e-6) / 6371) * (m >= 0.5 ? 0.86 : 1);
  }

  _loop(now) {
    this.raf = requestAnimationFrame(this._loop);
    const moving = this.controls.tick();
    if (this.morphAnim) this.morphAnim.step();
    const busy = scheduler.queue.size > 0 || this.uploads.length > 0;
    if (!(this.dirty || moving || this.morphAnim || busy)) { this._lastFrame = null; return; }
    this.dirty = false;
    this.frame++;
    this._watchSpeed(now);
    // at most a few new tile textures per frame (each costs a GPU upload + mipmaps)
    for (let i = 0; i < 3 && this.uploads.length; i++) this.uploads.shift()();
    if (this.uploads.length) this.dirty = true;
    this.uniforms.uMorph.value = this.morph;
    this._updateCamera();

    const m = this.morph;
    const contour = this.contour;
    this.uniforms.uCam.value.copy(this.camera.position);
    const needDepth = m > 0 && m < 1;
    if (needDepth !== this.depthOn) { this.depthOn = needDepth; this._applyDepth(); }
    // background, space objects
    const bg = this.scene.background;
    bg.copy(COLORS.space).lerp(contour ? COLORS.paper : COLORS.dark, m);
    this.stars.visible = m < 0.99;
    this.stars.material.opacity = 1 - m;
    const altFade = clamp((this.controls.globe.alt - 0.02) / 0.25, 0, 1);
    this.atmo.visible = this.haze.visible = m < 0.6;
    this.atmo.material.uniforms.uOpacity.value = (1 - m / 0.6) * altFade;
    this.haze.material.uniforms.uOpacity.value = (1 - m / 0.6) * clamp((this.controls.globe.alt - 0.005) / 0.2, 0, 1);

    const v = this.view;
    v.morph = m;
    v.frame = this.frame;
    v.focalPx = this.focalPx;
    v.frustum.setFromProjectionMatrix(this._vp.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse));

    const sw = this.swipe.enabled && !contour;
    if (!sw) { this.base.update(v); this.baseFill.update(v); }
    this.overlay.update(v);
    this.overlayFill.update(v);
    this.clouds.update(v);
    if (sw) { this.swipeL.update(v); this.swipeR.update(v); this.swipeLFill.update(v); this.swipeRFill.update(v); }
    for (const l of this.lineLayers) l.update(v);
    const sides = [this.swipeL, this.swipeR, this.swipeLFill, this.swipeRFill];
    for (const t of sides) t.group.visible = false;
    scheduler.tick();

    const r = this.renderer;
    if (!sw) {
      r.setScissorTest(false);
      r.render(this.scene, this.camera);
    } else {
      const W = this.width, H = this.height;
      const split = Math.round(W * this.swipe.split);
      const baseVis = this.base.group.visible;
      this.base.group.visible = this.baseFill.group.visible = false;
      r.setScissorTest(true);
      this.swipeL.group.visible = this.swipeLFill.group.visible = true;
      r.setScissor(0, 0, split, H);
      r.setViewport(0, 0, W, H);
      r.render(this.scene, this.camera);
      this.swipeL.group.visible = this.swipeLFill.group.visible = false;
      this.swipeR.group.visible = this.swipeRFill.group.visible = true;
      r.setScissor(split, 0, W - split, H);
      r.render(this.scene, this.camera);
      this.swipeR.group.visible = this.swipeRFill.group.visible = false;
      r.setScissorTest(false);
      this.base.group.visible = this.baseFill.group.visible = baseVis;
    }
    // labels are DOM elements: only move them when the camera really moved
    const key = this.camera.matrixWorld.elements.join(',') + this.width + this.height;
    if (key !== this._labelKey || this.labels.dirty || this.frame % 30 === 0) {
      this._labelKey = key;
      this.labels.dirty = false;
      this.labels.update();
    }
    this.emit('frame', this);
    if (moving || this.morphAnim) this.emit('view', this);
  }

  /** if frames are slow for a while, render fewer pixels (sharpness vs smoothness) */
  _watchSpeed(now) {
    if (this._lastFrame != null && now) {
      const dt = now - this._lastFrame;
      if (dt < 200) {
        this._slow = (this._slow || 0) * 0.95 + (dt > 34 ? 1 : 0) * 0.05;
        if (this._slow > 0.6 && this.dpr > 1) {
          this.dpr = 1;
          this.renderer.setPixelRatio(1);
          this.uniforms.uDpr.value = 1;
          this.resize();
          this._slow = 0;
        }
      }
    }
    this._lastFrame = now;
  }

  _applyDepth() {
    this.scene.traverse((o) => {
      const mat = o.material;
      if (!mat?.userData?.surface) return;
      mat.depthTest = this.depthOn;
      mat.depthWrite = this.depthOn && !mat.transparent;
    });
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.resizeObserver.disconnect();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.labels.root.remove();
  }
}

export { MAX_ALT };
