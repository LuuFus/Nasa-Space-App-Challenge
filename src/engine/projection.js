// Two ways to draw the same lon/lat point:
//  * globe — a unit sphere (x east at lon 90°, y = north pole, z faces lon 0°)
//  * flat  — the Equal Earth projection (Šavrič, Patterson & Jenny, 2018),
//            an equal-area world map that looks like the school "contour map".
// Every mesh computes both positions in its vertex shader and blends them with
// the uMorph uniform, so the globe can unroll into the map and back.

export const DEG = Math.PI / 180;
const A1 = 1.340264, A2 = -0.081106, A3 = 0.000893, A4 = 0.003796;
const M = Math.sqrt(3) / 2;

export const FLAT_W = 2.7066297319215575; // half width of the map  (lon = ±180°)
export const FLAT_H = 1.3173627591574133; // half height of the map (lat = ±90°)

export function equalEarth(lonRad, latRad) {
  const th = Math.asin(M * Math.sin(latRad));
  const t2 = th * th, t6 = t2 * t2 * t2;
  const x = (lonRad * Math.cos(th)) / (M * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2)));
  const y = th * (A1 + A2 * t2 + t6 * (A3 + A4 * t2));
  return [x, y];
}

export function equalEarthInverse(x, y) {
  let th = y / A1;
  for (let i = 0; i < 20; i++) {
    const t2 = th * th, t6 = t2 * t2 * t2;
    const fy = th * (A1 + A2 * t2 + t6 * (A3 + A4 * t2)) - y;
    const fpy = A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2);
    const d = fy / fpy;
    th -= d;
    if (Math.abs(d) < 1e-10) break;
  }
  const t2 = th * th, t6 = t2 * t2 * t2;
  const lon = (M * x * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2))) / Math.cos(th);
  const s = Math.sin(th) / M;
  if (Math.abs(s) > 1 || Math.abs(lon) > Math.PI + 1e-9) return null; // outside the map outline
  return [lon, Math.asin(s)];
}

export function globePos(lonDeg, latDeg, r = 1) {
  const lon = lonDeg * DEG, lat = latDeg * DEG;
  const c = Math.cos(lat);
  return [c * Math.sin(lon) * r, Math.sin(lat) * r, c * Math.cos(lon) * r];
}

export function flatPos(lonDeg, latDeg) {
  return equalEarth(lonDeg * DEG, latDeg * DEG);
}

export function vecToLonLat(x, y, z) {
  const r = Math.hypot(x, y, z);
  return [Math.atan2(x, z) / DEG, Math.asin(y / r) / DEG];
}

export function wrapLon(lon) {
  return ((((lon + 180) % 360) + 360) % 360) - 180;
}

// great-circle distance in km
export function haversineKm(lon1, lat1, lon2, lat2) {
  const dLat = (lat2 - lat1) * DEG, dLon = (lon2 - lon1) * DEG;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * DEG) * Math.cos(lat2 * DEG) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(a)));
}

// GLSL shared by all surface shaders. Needs `uniform float uMorph;`
export const GLSL_PROJECTION = /* glsl */ `
uniform float uMorph;
const float EE_A1 = 1.340264;
const float EE_A2 = -0.081106;
const float EE_A3 = 0.000893;
const float EE_A4 = 0.003796;
const float EE_M = 0.8660254037844386;
vec2 equalEarth(vec2 ll) {
  float th = asin(EE_M * sin(ll.y));
  float t2 = th * th;
  float t6 = t2 * t2 * t2;
  float x = ll.x * cos(th) / (EE_M * (EE_A1 + 3.0 * EE_A2 * t2 + t6 * (7.0 * EE_A3 + 9.0 * EE_A4 * t2)));
  float y = th * (EE_A1 + EE_A2 * t2 + t6 * (EE_A3 + EE_A4 * t2));
  return vec2(x, y);
}
vec3 globePos(vec2 ll, float r) {
  float c = cos(ll.y);
  return vec3(c * sin(ll.x), sin(ll.y), c * cos(ll.x)) * r;
}
// lift: tiny height above the ground so layers stack without z-fighting
vec3 surfacePos(vec2 ll, float lift) {
  vec3 g = globePos(ll, 1.0 + lift);
  if (uMorph <= 0.0) return g;
  vec3 f = vec3(equalEarth(ll), lift * 8.0);
  if (uMorph >= 1.0) return f;
  return mix(g, f, uMorph);
}
`;
