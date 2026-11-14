import * as THREE from 'three';
import { DEG, GLSL_PROJECTION } from './projection.js';

// One mesh that covers the whole planet. It is used for
//  * the "ocean" underneath everything (solid colour, so there are never holes),
//  * pictures that we draw ourselves in plain lon/lat (equirectangular) form:
//    land for the contour map, country tints, choropleths, trend maps.

let sharedGeom = null;
function worldGeometry() {
  if (sharedGeom) return sharedGeom;
  const nx = 360, ny = 180;
  const ll = new Float32Array((nx + 1) * (ny + 1) * 2);
  const uv = new Float32Array((nx + 1) * (ny + 1) * 2);
  const pos = new Float32Array((nx + 1) * (ny + 1) * 3);
  let k = 0;
  for (let j = 0; j <= ny; j++) {
    const lat = 90 - (180 * j) / ny;
    for (let i = 0; i <= nx; i++) {
      const lon = -180 + (360 * i) / nx;
      ll[k * 2] = lon * DEG;
      ll[k * 2 + 1] = lat * DEG;
      uv[k * 2] = i / nx;
      uv[k * 2 + 1] = 1 - j / ny;
      const c = Math.cos(lat * DEG);
      pos[k * 3] = c * Math.sin(lon * DEG);
      pos[k * 3 + 1] = Math.sin(lat * DEG);
      pos[k * 3 + 2] = c * Math.cos(lon * DEG);
      k++;
    }
  }
  const idx = new Uint32Array(nx * ny * 6);
  let p = 0;
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i, b = a + nx + 1, c = a + 1, d = b + 1;
      idx[p++] = a; idx[p++] = b; idx[p++] = c;
      idx[p++] = b; idx[p++] = d; idx[p++] = c;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('lonlat', new THREE.BufferAttribute(ll, 2));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  sharedGeom = g;
  return g;
}

const VERT = /* glsl */ `
${GLSL_PROJECTION}
attribute vec2 lonlat;
uniform float uLift;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(surfacePos(lonlat, uLift), 1.0);
}`;

const FRAG = /* glsl */ `
uniform sampler2D uTex;
uniform bool uUseTex;
uniform vec3 uColor;
uniform float uOpacity;
varying vec2 vUv;
void main() {
  vec4 c = uUseTex ? texture2D(uTex, vUv) : vec4(uColor, 1.0);
  gl_FragColor = vec4(c.rgb, c.a * uOpacity);
  if (gl_FragColor.a < 0.003) discard;
}`;

export class SurfaceLayer {
  constructor(engine, { color = 0x0b1a33, lift = 0, opacity = 1, transparent = false, renderOrder = 0, depth = false } = {}) {
    this.engine = engine;
    this.material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uMorph: engine.uniforms.uMorph,
        uTex: { value: null }, uUseTex: { value: false },
        uColor: { value: new THREE.Color(color) },
        uOpacity: { value: opacity }, uLift: { value: lift },
      },
      transparent,
      depthTest: depth,
      depthWrite: depth,
    });
    if (!depth) this.material.userData.surface = true;
    this.mesh = new THREE.Mesh(worldGeometry(), this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = renderOrder;
  }
  setColor(c) { this.material.uniforms.uColor.value.set(c); this.engine.requestRender(); }
  setOpacity(o) { this.material.uniforms.uOpacity.value = o; this.engine.requestRender(); }
  setTexture(tex) {
    const old = this.material.uniforms.uTex.value;
    if (old && old !== tex && old.userData?.owned) old.dispose();
    this.material.uniforms.uTex.value = tex;
    this.material.uniforms.uUseTex.value = !!tex;
    this.engine.requestRender();
  }
  set visible(v) { this.mesh.visible = v; }
  get visible() { return this.mesh.visible; }
}

/** Equirectangular canvas helper: draw lon/lat polygons into a texture. */
export class LonLatCanvas {
  constructor(width = 4096) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = width / 2;
    this.ctx = this.canvas.getContext('2d');
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.generateMipmaps = true;
    this.texture.minFilter = THREE.LinearMipmapLinearFilter;
    this.texture.anisotropy = 8;
  }
  get w() { return this.canvas.width; }
  get h() { return this.canvas.height; }
  clear(color = null) {
    const { ctx } = this;
    ctx.clearRect(0, 0, this.w, this.h);
    if (color) { ctx.fillStyle = color; ctx.fillRect(0, 0, this.w, this.h); }
  }
  /** rings: arrays of [lon, lat, lon, lat, ...] (Float32Array); one path, even-odd holes */
  fillPolygon(polys, style) {
    const { ctx, w, h } = this;
    ctx.beginPath();
    for (const poly of polys) {
      for (const ring of poly) {
        for (let i = 0; i < ring.length; i += 2) {
          const x = ((ring[i] + 180) / 360) * w;
          const y = ((90 - ring[i + 1]) / 180) * h;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
      }
    }
    ctx.fillStyle = style;
    ctx.fill('evenodd');
  }
  commit() { this.texture.needsUpdate = true; }
}
