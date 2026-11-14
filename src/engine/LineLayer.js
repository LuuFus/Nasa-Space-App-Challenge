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
attribute vec2 aA;
attribute vec2 aB;
attribute vec2 aCorner;   // x: 0 at A, 1 at B; y: 0 inner edge, 1 outer edge
attribute vec4 aColor;
attribute vec4 aStyle;    // inset px, width px, dash px, gap px
attribute float aDist;    // km from the start of the line
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
  vDist = aDist;
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
    this.mesh = new THREE.Mesh(new THREE.BufferGeometry(), this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = renderOrder;
  }

  set visible(v) { this.mesh.visible = v; this.engine.requestRender(); }
  get visible() { return this.mesh.visible; }
  setMaxRank(r) { this.material.uniforms.uMaxRank.value = r; }
  setWidthScale(s) { this.material.uniforms.uWidthScale.value = s; }
  setOpacity(o) { this.material.uniforms.uOpacity.value = o; }

  /**
   * lines: [{ coords: [lon,lat,lon,lat,...] (degrees), closed, color: [r,g,b,a],
   *           width, inset (default -width/2 = centred), dash, gap, rank }]
   */
  setLines(lines) {
    let nSeg = 0;
    for (const l of lines) nSeg += l.coords.length / 2 - (l.closed ? 0 : 1);
    const A = new Float32Array(nSeg * 8), B = new Float32Array(nSeg * 8);
    const C = new Float32Array(nSeg * 8), COL = new Float32Array(nSeg * 16);
    const ST = new Float32Array(nSeg * 16), DI = new Float32Array(nSeg * 4), RK = new Float32Array(nSeg * 4);
    const idx = new Uint32Array(nSeg * 6);
    let s = 0;
    for (const l of lines) {
      const co = l.coords;
      const n = co.length / 2;
      const segs = l.closed ? n : n - 1;
      const width = l.width ?? 1;
      const inset = l.inset ?? -width / 2;
      const col = l.color ?? [1, 1, 1, 1];
      let dist = 0;
      for (let i = 0; i < segs; i++) {
        const j = (i + 1) % n;
        const lon1 = co[i * 2], lat1 = co[i * 2 + 1], lon2 = co[j * 2], lat2 = co[j * 2 + 1];
        const segKm = haversineKm(lon1, lat1, lon2, lat2);
        // cuts made by the data along the 180° meridian or at the poles are not real borders
        const fake = (Math.abs(lon1) > 179.999 && Math.abs(lon2) > 179.999) ||
          (lat1 < -89.99 && lat2 < -89.99) || (lat1 > 89.99 && lat2 > 89.99) || Math.abs(lon1 - lon2) > 180;
        if (fake) { dist += segKm; continue; }
        for (let v = 0; v < 4; v++) {
          const q = s * 4 + v;
          A[q * 2] = lon1 * DEG; A[q * 2 + 1] = lat1 * DEG;
          B[q * 2] = lon2 * DEG; B[q * 2 + 1] = lat2 * DEG;
          const atB = v === 1 || v === 3 ? 1 : 0;
          const outer = v >= 2 ? 1 : 0;
          C[q * 2] = atB; C[q * 2 + 1] = outer;
          COL.set(col.length === 4 ? col : [...col, 1], q * 4);
          ST[q * 4] = inset; ST[q * 4 + 1] = width; ST[q * 4 + 2] = l.dash ?? 0; ST[q * 4 + 3] = l.gap ?? 0;
          DI[q] = atB ? dist + segKm : dist;
          RK[q] = l.rank ?? 0;
        }
        const b = s * 4;
        idx.set([b, b + 2, b + 1, b + 1, b + 2, b + 3], s * 6);
        s++;
        dist += segKm;
      }
    }
    const g = new THREE.BufferGeometry();
    const nv = s * 4;
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nv * 3), 3));
    g.setAttribute('aA', new THREE.BufferAttribute(A.subarray(0, nv * 2), 2));
    g.setAttribute('aB', new THREE.BufferAttribute(B.subarray(0, nv * 2), 2));
    g.setAttribute('aCorner', new THREE.BufferAttribute(C.subarray(0, nv * 2), 2));
    g.setAttribute('aColor', new THREE.BufferAttribute(COL.subarray(0, nv * 4), 4));
    g.setAttribute('aStyle', new THREE.BufferAttribute(ST.subarray(0, nv * 4), 4));
    g.setAttribute('aDist', new THREE.BufferAttribute(DI.subarray(0, nv), 1));
    g.setAttribute('aRank', new THREE.BufferAttribute(RK.subarray(0, nv), 1));
    g.setIndex(new THREE.BufferAttribute(idx.subarray(0, s * 6), 1));
    this.mesh.geometry.dispose();
    this.mesh.geometry = g;
    this.engine.requestRender();
  }
}
