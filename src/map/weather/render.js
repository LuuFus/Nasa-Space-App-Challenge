import { paletteLUT, wxLayer } from './layers.js';
import { sampleField } from './data.js';

// A weather field -> a coloured picture for a MapLibre "image" source.
// MapLibre stretches an image linearly in web-Mercator space, so the rows of the
// picture are spaced evenly in Mercator y (not in latitude) and every pixel looks
// up its own latitude — the colours land exactly where the data is.

const R = 180 / Math.PI;
const mercY = (lat) => Math.log(Math.tan(Math.PI / 4 + lat / (2 * R)));
const latOf = (y) => R * (2 * Math.atan(Math.exp(y)) - Math.PI / 2);

const luts = new Map();
function lutFor(id) {
  if (!luts.has(id)) luts.set(id, paletteLUT(wxLayer(id).stops));
  return luts.get(id);
}

/**
 * colour picture of field `f` (Float32Array on grid g) for weather layer `id`.
 * Returns { canvas, coordinates } — corners for the image source.
 */
export function renderField(g, f, id, canvas = document.createElement('canvas')) {
  const W = Math.min(720, Math.max(96, (g.cols - 1) * 18));
  const y0 = mercY(g.lat0), y1 = mercY(g.lat1);
  const H = Math.min(720, Math.max(96, Math.round((W * (y1 - y0)) / (((g.lon1 - g.lon0) * Math.PI) / 180))));
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(W, H);
  const { lut, lo, hi } = lutFor(id);
  const k = 255 / (hi - lo);
  const d = img.data;
  const dx = (g.lon1 - g.lon0) / (W - 1);
  for (let py = 0; py < H; py++) {
    const lat = latOf(y1 - ((y1 - y0) * py) / (H - 1));
    for (let px = 0; px < W; px++) {
      const v = sampleField(g, f, g.lon0 + px * dx, lat);
      const o = (py * W + px) * 4;
      if (Number.isNaN(v)) { d[o + 3] = 0; continue; }
      const i = Math.max(0, Math.min(255, Math.round((v - lo) * k))) * 4;
      d[o] = lut[i]; d[o + 1] = lut[i + 1]; d[o + 2] = lut[i + 2]; d[o + 3] = lut[i + 3];
    }
  }
  ctx.putImageData(img, 0, 0);
  return {
    canvas,
    coordinates: [[g.lon0, g.lat1], [g.lon1, g.lat1], [g.lon1, g.lat0], [g.lon0, g.lat0]],
  };
}

// ---------------------------------------------------------------- isolines
/**
 * Lines of equal value (isobars) by marching squares on a 3× finer grid.
 * Returns a GeoJSON FeatureCollection of LineStrings with { level, label }.
 */
export function isolines(g, f, every) {
  const S = 3;
  const cols = (g.cols - 1) * S + 1, rows = (g.rows - 1) * S + 1, st = g.step / S;
  const v = new Float32Array(cols * rows);
  let lo = Infinity, hi = -Infinity;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = sampleField(g, f, g.lon0 + c * st, g.lat0 + r * st);
    v[r * cols + c] = x;
    if (!Number.isNaN(x)) { if (x < lo) lo = x; if (x > hi) hi = x; }
  }
  const feats = [];
  if (!Number.isFinite(lo)) return { type: 'FeatureCollection', features: feats };
  const P = (c, r) => [g.lon0 + c * st, g.lat0 + r * st];
  for (let L = Math.ceil(lo / every) * every; L <= hi; L += every) {
    const segs = [];
    for (let r = 0; r < rows - 1; r++) for (let c = 0; c < cols - 1; c++) {
      const a = v[r * cols + c], b = v[r * cols + c + 1], cc = v[(r + 1) * cols + c + 1], dd = v[(r + 1) * cols + c];
      if ([a, b, cc, dd].some(Number.isNaN)) continue;
      const idx = (a > L ? 1 : 0) | (b > L ? 2 : 0) | (cc > L ? 4 : 0) | (dd > L ? 8 : 0);
      if (idx === 0 || idx === 15) continue;
      const t = (p, q) => (L - p) / (q - p);
      const e = [
        () => { const k = t(a, b); const A = P(c, r), B = P(c + 1, r); return [A[0] + (B[0] - A[0]) * k, A[1]]; },        // bottom
        () => { const k = t(b, cc); const A = P(c + 1, r), B = P(c + 1, r + 1); return [A[0], A[1] + (B[1] - A[1]) * k]; }, // right
        () => { const k = t(dd, cc); const A = P(c, r + 1), B = P(c + 1, r + 1); return [A[0] + (B[0] - A[0]) * k, A[1]]; }, // top
        () => { const k = t(a, dd); const A = P(c, r), B = P(c, r + 1); return [A[0], A[1] + (B[1] - A[1]) * k]; },        // left
      ];
      const CASES = { 1: [[3, 0]], 2: [[0, 1]], 3: [[3, 1]], 4: [[1, 2]], 5: [[3, 2], [0, 1]], 6: [[0, 2]], 7: [[3, 2]],
        8: [[2, 3]], 9: [[2, 0]], 10: [[0, 3], [1, 2]], 11: [[2, 1]], 12: [[1, 3]], 13: [[1, 0]], 14: [[0, 3]] };
      for (const [i, j] of CASES[idx]) segs.push([e[i](), e[j]()]);
    }
    for (const line of chain(segs)) {
      if (line.length < 4) continue;
      feats.push({ type: 'Feature', properties: { level: L, label: String(Math.round(L)) }, geometry: { type: 'LineString', coordinates: smooth(line) } });
    }
  }
  return { type: 'FeatureCollection', features: feats };
}

/** join segments that share end points into polylines */
function chain(segs) {
  const key = (p) => `${p[0].toFixed(5)},${p[1].toFixed(5)}`;
  const ends = new Map();
  segs.forEach((s, i) => { for (const p of s) { const k = key(p); if (!ends.has(k)) ends.set(k, []); ends.get(k).push(i); } });
  const used = new Uint8Array(segs.length);
  const out = [];
  for (let i = 0; i < segs.length; i++) {
    if (used[i]) continue;
    used[i] = 1;
    const line = [segs[i][0], segs[i][1]];
    for (const dir of [1, -1]) {
      for (;;) {
        const tip = dir === 1 ? line[line.length - 1] : line[0];
        const next = (ends.get(key(tip)) || []).find((j) => !used[j]);
        if (next == null) break;
        used[next] = 1;
        const s = segs[next];
        const far = key(s[0]) === key(tip) ? s[1] : s[0];
        if (dir === 1) line.push(far); else line.unshift(far);
      }
    }
    out.push(line);
  }
  return out;
}

/** two rounds of Chaikin corner cutting: soft curves instead of grid zig-zags */
function smooth(pts) {
  let p = pts;
  for (let k = 0; k < 2; k++) {
    const q = [p[0]];
    for (let i = 0; i < p.length - 1; i++) {
      const [a, b] = [p[i], p[i + 1]];
      q.push([0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1]], [0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1]]);
    }
    q.push(p[p.length - 1]);
    p = q;
  }
  return p;
}
