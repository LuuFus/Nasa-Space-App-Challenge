import * as THREE from 'three';
import { DEG, GLSL_PROJECTION } from './projection.js';
import { LineLayer } from './LineLayer.js';
import { loadJSON } from '../lib/data.js';

// Day-by-day playback of satellite fire detections (NASA FIRMS) for one event.
// Today's fires glow yellow-white, the last days orange, older ones stay as dark
// red "scars", so you can watch where the fire started, which way it ran and
// where it died out. The white line is the daily centre of the fire.

const VERT = /* glsl */ `
${GLSL_PROJECTION}
attribute vec2 aLL;
attribute float aDay;
attribute float aFrp;
uniform float uDay;
uniform float uDpr;
uniform float uScale;
uniform vec3 uCam;
varying float vAge;
void main() {
  float age = uDay - aDay;
  vec3 p = surfacePos(aLL, 0.00006);
  if (age < 0.0 || (uMorph <= 0.0 && dot(normalize(p), uCam) < 1.0)) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; return; }
  vAge = age;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  float s = uScale * (2.5 + clamp(log(1.0 + aFrp) * 0.9, 0.0, 4.0));
  gl_PointSize = s * (age < 1.0 ? 1.5 : 1.0) * uDpr;
}`;

const FRAG = /* glsl */ `
varying float vAge;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r = length(c);
  if (r > 0.5) discard;
  vec3 col;
  float a;
  if (vAge < 1.0) { col = vec3(1.0, 0.95, 0.55); a = 1.0; }            // burning today
  else if (vAge < 4.0) { col = vec3(1.0, 0.45, 0.08); a = 0.85; }      // last few days
  else { col = vec3(0.55, 0.06, 0.05); a = 0.55; }                     // burnt earlier
  a *= smoothstep(0.5, 0.3, r);
  gl_FragColor = vec4(col, a);
}`;

export class Fires {
  constructor(engine) {
    this.engine = engine;
    this.material = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG,
      uniforms: { uMorph: engine.uniforms.uMorph, uDpr: engine.uniforms.uDpr, uCam: engine.uniforms.uCam, uDay: { value: 0 }, uScale: { value: 1 } },
      transparent: true, depthTest: false, depthWrite: false,
    });
    this.points = new THREE.Points(new THREE.BufferGeometry(), this.material);
    this.points.frustumCulled = false;
    this.points.renderOrder = 13;
    this.points.visible = false;
    engine.scene.add(this.points);
    this.track = new LineLayer(engine, { lift: 0.00007, renderOrder: 14 });
    this.track.visible = false;
    engine.scene.add(this.track.mesh);
    this.data = null;
  }

  async load(id) {
    if (this.id === id && this.data) return this.data;
    const d = await loadJSON(`fires/${id}.json`);
    this.id = id;
    this.data = d;
    const n = d.points.length;
    const ll = new Float32Array(n * 2), day = new Float32Array(n), frp = new Float32Array(n), pos = new Float32Array(n * 3);
    d.points.forEach((p, i) => { ll[i * 2] = p[0] * DEG; ll[i * 2 + 1] = p[1] * DEG; day[i] = p[2]; frp[i] = p[3]; });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aLL', new THREE.BufferAttribute(ll, 2));
    g.setAttribute('aDay', new THREE.BufferAttribute(day, 1));
    g.setAttribute('aFrp', new THREE.BufferAttribute(frp, 1));
    this.points.geometry.dispose();
    this.points.geometry = g;
    // smaller dots for huge fires (Australia, Canada), bigger for local ones
    this.material.uniforms.uScale.value = n > 20000 ? 0.8 : n > 3000 ? 1.1 : 1.6;
    return d;
  }

  /** show detections up to `day` (days since the event start) and the centre track */
  setDay(day) {
    const d = this.data;
    if (!d) return;
    this.material.uniforms.uDay.value = day;
    const pts = [];
    for (let i = 0; i <= Math.min(day, d.days - 1); i++) {
      // 3-day running centre so the track is smooth
      let sx = 0, sy = 0, k = 0;
      for (let j = Math.max(0, i - 1); j <= Math.min(d.days - 1, i + 1); j++) {
        if (d.centre[j]) { sx += d.centre[j][0]; sy += d.centre[j][1]; k++; }
      }
      if (k) pts.push(sx / k, sy / k);
    }
    this.track.setLines(pts.length >= 4 ? [{ coords: pts, closed: false, color: [1, 1, 1, 0.9], width: 2 }] : []);
    this.points.visible = true;
    this.track.visible = true;
    this.engine.requestRender();
  }

  hide() {
    this.points.visible = false;
    this.track.visible = false;
    this.id = null;
    this.data = null;
    this.engine.requestRender();
  }
}
