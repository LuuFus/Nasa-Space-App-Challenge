import { FRONT_STYLE, ORDER, STRONG, edgesOf, occupiedOutline } from '../lib/frontGeo.js';

// The front line in Ukraine on the OpenStreetMap view: the same monthly data
// and colours as on the 3D globe (src/engine/Front.js), as GeoJSON for MapLibre.
// Names of towns and roads of the base map stay readable above the areas.

const ring = (r) => {
  const out = [];
  for (let i = 0; i < r.length; i += 2) out.push([r[i], r[i + 1]]);
  if (out.length && (out[0][0] !== out[out.length - 1][0] || out[0][1] !== out[out.length - 1][1])) out.push(out[0]);
  return out;
};

const rgba = (c) => `rgba(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)},${c[3]})`;

/** areas of one snapshot: one MultiPolygon feature per class */
export function frontAreas(snap) {
  const features = [];
  for (const k of ORDER) {
    const polys = snap.rings[k];
    if (!polys?.length) continue;
    features.push({
      type: 'Feature', properties: { k, order: ORDER.indexOf(k), strong: STRONG.has(k) },
      geometry: { type: 'MultiPolygon', coordinates: polys.map((p) => p.map(ring)) },
    });
  }
  return { type: 'FeatureCollection', features };
}

/** edges of each class (the front line) + the dashed outline of another month */
export function frontLines(d, snap, compare) {
  const features = [];
  for (const k of ORDER) {
    const rings = edgesOf(d, snap, k);
    if (!rings.length) continue;
    features.push({
      type: 'Feature', properties: { k, color: rgba(FRONT_STYLE[k].line), strong: STRONG.has(k) },
      geometry: { type: 'MultiLineString', coordinates: rings.map(ring) },
    });
  }
  const cmp = compare ? occupiedOutline(d, compare).map(ring) : [];
  return {
    lines: { type: 'FeatureCollection', features },
    compare: { type: 'FeatureCollection', features: cmp.length ? [{ type: 'Feature', properties: {}, geometry: { type: 'MultiLineString', coordinates: cmp } }] : [] },
  };
}

/** fill colours by class, for a MapLibre "match" expression */
export function fillColorExpr() {
  const e = ['match', ['get', 'k']];
  for (const k of ORDER) e.push(k, FRONT_STYLE[k].fill);
  e.push('rgba(0,0,0,0)');
  return e;
}

/** diagonal hatching as a small image for fill-pattern (dark lines on transparent) */
export function hatchImage(color, size = 12) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let o = -size; o <= size; o += size / 2) { ctx.moveTo(o, size); ctx.lineTo(o + size, 0); }
  ctx.stroke();
  return ctx.getImageData(0, 0, size, size);
}

export const HATCHED = ORDER.filter((k) => FRONT_STYLE[k].hatch);
