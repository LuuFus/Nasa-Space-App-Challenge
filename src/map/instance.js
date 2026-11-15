// The single MapLibre map of the OpenStreetMap view (like src/engine/instance.js).
let current = null;
const waiters = [];

export function setMap(m) {
  current = m;
  if (import.meta.env.DEV) window.__map = m;
  if (m) while (waiters.length) waiters.shift()(m);
}
export function getMap() { return current; }
export function whenMap() {
  return current ? Promise.resolve(current) : new Promise((res) => waiters.push(res));
}

// The 3D engine measures height above the ground in Earth radii (alt); a web map
// uses zoom levels. Both describe how many kilometres fit on the screen.
const KM_PER_ALT = 6371 * 2 * Math.tan((20 * Math.PI) / 180);   // vertical field of view 40°
const kmTall = (zoom, lat, h) => ((h / 512) * 40075 * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom;

export function altToZoom(alt, lat, h = 800) {
  return Math.max(1, Math.min(16, Math.log2(((h / 512) * 40075 * Math.cos((lat * Math.PI) / 180)) / (alt * KM_PER_ALT))));
}
export function zoomToAlt(zoom, lat, h = 800) {
  return kmTall(zoom, lat, h) / KM_PER_ALT;
}
