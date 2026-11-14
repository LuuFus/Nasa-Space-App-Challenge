// Loading the files produced by the Python pipeline (public/data/...).
const BASE = import.meta.env.BASE_URL || './';
const cache = new Map();

export function dataUrl(path) {
  return `${BASE}data/${path}`;
}

export function loadJSON(path) {
  if (!cache.has(path)) {
    cache.set(path, fetch(dataUrl(path)).then((r) => {
      if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
      return r.json();
    }).catch((e) => { cache.delete(path); throw e; }));
  }
  return cache.get(path);
}

/** delta-encoded integer ring -> Float32Array [lon, lat, lon, lat, ...] in degrees */
export function decodeRing(flat, quant) {
  const out = new Float32Array(flat.length);
  let x = 0, y = 0;
  for (let i = 0; i < flat.length; i += 2) {
    if (i === 0) { x = flat[0]; y = flat[1]; } else { x += flat[i]; y += flat[i + 1]; }
    out[i] = x / quant;
    out[i + 1] = y / quant;
  }
  return out;
}

let countriesPromise = null;
/** countries with decoded polygons: c.rings = [[Float32Array ext, holes...], ...] */
export function loadCountries() {
  if (!countriesPromise) {
    countriesPromise = loadJSON('geo/countries.json').then((d) => {
      const list = d.countries.map((c) => ({ ...c, rings: c.polys.map((p) => p.map((r) => decodeRing(r, d.quant))) }));
      const byId = new Map(list.map((c) => [c.id, c]));
      return { list, byId, quant: d.quant, raw: d };
    });
  }
  return countriesPromise;
}

function inRing(x, y, r) {
  let inside = false;
  for (let i = 0, n = r.length / 2, j = n - 1; i < n; j = i++) {
    const xi = r[i * 2], yi = r[i * 2 + 1], xj = r[j * 2], yj = r[j * 2 + 1];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function countryAt(countries, lon, lat) {
  if (!countries) return null;
  for (const c of countries.list) {
    const b = c.bbox;
    if (lon < b[0] || lon > b[2] || lat < b[1] || lat > b[3]) continue;
    for (const poly of c.rings) {
      if (inRing(lon, lat, poly[0]) && !poly.slice(1).some((h) => inRing(lon, lat, h))) return c;
    }
  }
  return null;
}

export function loadCountrySeries(id) {
  return loadJSON(`countries/${id}.json`);
}
