import * as THREE from 'three';
import { DEG, GLSL_PROJECTION, haversineKm } from './projection.js';

// Screen-space lines drawn on the globe / map.
// Each segment is a quad expanded in the vertex shader, so widths are in pixels
// at any zoom. `inset` shifts the line to the LEFT of its direction of travel:
// country rings are counter-clockwise, so a positive inset puts each country's
// border stroke just INSIDE that country, in that country's colour — two
// neighbours get two parallel strokes and you can tell whose border is whose.

const VERT = /* glsl */ `
${GLSL_PROJECTION}
attribute vec4 aAB;      // segment end points (lon, lat of A, lon, lat of B), radians
attribute vec2 aCorner;   // x: 0 at A, 1 at B; y: 0 inner edge, 1 outer edge
attribute vec4 aColor;
attribute vec4 aStyle;    // inset px, width px, dash px, gap px
attribute vec2 aDist2;    // km from the start of the line at A and at B
attribute float aRank;
uniform vec2 uViewport;
uniform float uLift;
uniform float uDpr;
uniform float uMaxRank;
uniform float uWidthScale;
uniform vec3 uCam;
varying vec4 vColor;
varying vec2 vDash;
varying float vDist;
void main() {
  vec2 aA = aAB.xy;
  vec2 aB = aAB.zw;
  if (aRank > uMaxRank) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  // on the globe, hide segments that are over the horizon (no depth test is used)
  if (uMorph <= 0.0 && (dot(globePos(aA, 1.0), uCam) < 1.0 || dot(globePos(aB, 1.0), uCam) < 1.0)) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return;
  }
  vec4 cA = projectionMatrix * modelViewMatrix * vec4(surfacePos(aA, uLift), 1.0);
  vec4 cB = projectionMatrix * modelViewMatrix * vec4(surfacePos(aB, uLift), 1.0);
  if (cA.w < 1e-6 || cB.w < 1e-6) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  vec2 sA = cA.xy / cA.w * uViewport * 0.5;
  vec2 sB = cB.xy / cB.w * uViewport * 0.5;
  vec2 d = sB - sA;
  float len = length(d);
  vec2 dir = len > 1e-6 ? d / len : vec2(1.0, 0.0);
  vec2 nrm = vec2(-dir.y, dir.x);
  vec4 c = mix(cA, cB, aCorner.x);
  float w = aStyle.y * uWidthScale;
  float off = (aStyle.x * uWidthScale + aCorner.y * w) * uDpr;
  // extend the quad a little along the line so joints have no gaps
  float ext = (aCorner.x - 0.5) * 2.0 * 0.5 * w * uDpr;
  vec2 offPx = nrm * off + dir * ext;
  c.xy += offPx / (uViewport * 0.5) * c.w;
  gl_Position = c;
  vColor = aColor;
  vDash = aStyle.zw * uDpr;
  vDist = mix(aDist2.x, aDist2.y, aCorner.x);
}`;

const FRAG = /* glsl */ `
uniform float uPxPerKm;
uniform float uOpacity;
varying vec4 vColor;
varying vec2 vDash;
varying float vDist;
void main() {
  if (vDash.x > 0.0) {
    float p = vDist * uPxPerKm;
    if (mod(p, vDash.x + vDash.y) > vDash.x) discard;
  }
  gl_FragColor = vec4(vColor.rgb, vColor.a * uOpacity);
}`;

const CELL = 30; // degrees: segments are grouped into 30°×30° chunks that can be skipped when off screen

export class LineLayer {
  constructor(engine, { lift = 0.00025, renderOrder = 10, opacity = 1 } = {}) {
    this.engine = engine;
    this.material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uMorph: engine.uniforms.uMorph,
        uViewport: engine.uniforms.uViewport,
        uDpr: engine.uniforms.uDpr,
        uPxPerKm: engine.uniforms.uPxPerKm,
        uCam: engine.uniforms.uCam,
        uLift: { value: lift },
        uMaxRank: { value: 999 },
        uWidthScale: { value: 1 },
        uOpacity: { value: opacity },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.material.userData.surface = true;
    this.renderOrder = renderOrder;
    this.mesh = new THREE.Group();   // one child mesh per chunk
    this.chunks = [];
    engine.lineLayers.push(this);
  }

  set visible(v) {
    if (this.mesh.visible === v) return;
    this.mesh.visible = v;
    this.engine.requestRender();
  }
  get visible() { return this.mesh.visible; }
  setMaxRank(r) { this.material.uniforms.uMaxRank.value = r; }
  setWidthScale(s) { this.material.uniforms.uWidthScale.value = s; }
  setOpacity(o) { this.material.uniforms.uOpacity.value = o; }

  /** hide chunks behind the globe or outside the screen */
  update(view) {
    if (!this.mesh.visible) return;
    const cam = view.camera.position;
    const globe = view.morph === 0;
    const dist = cam.length();
    const horizon = Math.acos(Math.min(1, 1 / dist));
    for (const c of this.chunks) {
      if (!globe) { c.mesh.visible = true; continue; }
      const theta = c.center.angleTo(cam);
      c.mesh.visible = theta - c.radius < horizon + 0.03 && view.frustum.intersectsSphere(c.sphere);
    }
  }

  /**
   * lines: [{ coords: [lon,lat,lon,lat,...] (degrees), closed, color: [r,g,b,a],
   *           width, inset (default -width/2 = centred), dash, gap, rank }]
   * One instance per segment (4 shared corner vertices).
   */
  setLines(lines) {
    // pass 1: count segments per chunk
    const counts = new Map();
    const cellOf = (lon, lat) => Math.floor((lon + 180) / CELL) * 100 + Math.floor((lat + 90) / CELL);
    for (const l of lines) {
      const co = l.coords, n = co.length / 2, segs = l.closed ? n : n - 1;
      for (let i = 0; i < segs; i++) {
        const j = (i + 1) % n;
        const k = cellOf((co[i * 2] + co[j * 2]) / 2, (co[i * 2 + 1] + co[j * 2 + 1]) / 2);
        counts.set(k, (counts.get(k) || 0) + 1);
      }
    }
    const buf = new Map();
    for (const [k, n] of counts) {
      buf.set(k, { n: 0, AB: new Float32Array(n * 4), COL: new Uint8Array(n * 4), ST: new Float32Array(n * 4), DI: new Float32Array(n * 2), RK: new Float32Array(n), pts: [] });
    }
    // pass 2: fill
    for (const l of lines) {
      const co = l.coords;
      const n = co.length / 2;
      const segs = l.closed ? n : n - 1;
      const width = l.width ?? 1;
      const inset = l.inset ?? -width / 2;
      const col = l.color ?? [1, 1, 1, 1];
      const c0 = Math.round(col[0] * 255), c1 = Math.round(col[1] * 255), c2 = Math.round(col[2] * 255), c3 = Math.round((col[3] ?? 1) * 255);
      let dist = 0;
      for (let i = 0; i < segs; i++) {
        const j = (i + 1) % n;
        const lon1 = co[i * 2], lat1 = co[i * 2 + 1], lon2 = co[j * 2], lat2 = co[j * 2 + 1];
        const segKm = haversineKm(lon1, lat1, lon2, lat2);
        // cuts made by the data along the 180° meridian or at the poles are not real borders
        const fake = (Math.abs(lon1) > 179.999 && Math.abs(lon2) > 179.999) ||
          (lat1 < -89.99 && lat2 < -89.99) || (lat1 > 89.99 && lat2 > 89.99) || Math.abs(lon1 - lon2) > 180;
        if (!fake) {
          const b = buf.get(cellOf((lon1 + lon2) / 2, (lat1 + lat2) / 2));
          const s = b.n++;
          b.AB[s * 4] = lon1 * DEG; b.AB[s * 4 + 1] = lat1 * DEG; b.AB[s * 4 + 2] = lon2 * DEG; b.AB[s * 4 + 3] = lat2 * DEG;
          b.COL[s * 4] = c0; b.COL[s * 4 + 1] = c1; b.COL[s * 4 + 2] = c2; b.COL[s * 4 + 3] = c3;
          b.ST[s * 4] = inset; b.ST[s * 4 + 1] = width; b.ST[s * 4 + 2] = l.dash ?? 0; b.ST[s * 4 + 3] = l.gap ?? 0;
          b.DI[s * 2] = dist; b.DI[s * 2 + 1] = dist + segKm;
          b.RK[s] = l.rank ?? 0;
          if (s % 8 === 0) b.pts.push(lon1, lat1);
        }
        dist += segKm;
      }
    }
    // rebuild chunk meshes
    for (const c of this.chunks) { c.mesh.geometry.dispose(); this.mesh.remove(c.mesh); }
    this.chunks = [];
    const corner = new THREE.BufferAttribute(new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), 2);
    for (const b of buf.values()) {
      if (!b.n) continue;
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('aCorner', corner);
      g.setIndex([0, 2, 1, 1, 2, 3]);
      g.setAttribute('aAB', new THREE.InstancedBufferAttribute(b.AB.subarray(0, b.n * 4), 4));
      g.setAttribute('aColor', new THREE.InstancedBufferAttribute(b.COL.subarray(0, b.n * 4), 4, true));
      g.setAttribute('aStyle', new THREE.InstancedBufferAttribute(b.ST.subarray(0, b.n * 4), 4));
      g.setAttribute('aDist2', new THREE.InstancedBufferAttribute(b.DI.subarray(0, b.n * 2), 2));
      g.setAttribute('aRank', new THREE.InstancedBufferAttribute(b.RK.subarray(0, b.n), 1));
      g.instanceCount = b.n;
      const mesh = new THREE.Mesh(g, this.material);
      mesh.frustumCulled = false;
      mesh.renderOrder = this.renderOrder;
      // bounding cap of the chunk on the unit sphere
      const center = new THREE.Vector3();
      const vs = [];
      for (let i = 0; i < b.pts.length; i += 2) {
        const la = b.pts[i + 1] * DEG, lo = b.pts[i] * DEG;
        const v = new THREE.Vector3(Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo));
        vs.push(v);
        center.add(v);
      }
      if (center.lengthSq() < 1e-9) center.set(0, 1, 0);
      center.normalize();
      let radius = 0;
      for (const v of vs) radius = Math.max(radius, center.angleTo(v));
      radius += 0.05;
      const sphere = new THREE.Sphere(center.clone().multiplyScalar(Math.cos(Math.min(radius, Math.PI / 2) / 2)), 2 * Math.sin(Math.min(radius, Math.PI / 2) / 2) + 0.05);
      this.chunks.push({ mesh, center, radius, sphere });
      this.mesh.add(mesh);
    }
    this.engine.requestRender();
  }
}
