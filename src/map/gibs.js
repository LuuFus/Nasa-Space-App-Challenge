// NASA GIBS layers for the OpenStreetMap view. The 3D engine reads GIBS in
// EPSG:4326 (plate carrée); a web map needs EPSG:3857 (web Mercator), which
// GIBS serves from the same layers under "GoogleMapsCompatible" tile sets.

const ROOT = 'https://gibs.earthdata.nasa.gov';

// resolution of the EPSG:4326 tile set -> the matching EPSG:3857 tile set level
const LEVEL = { '250m': 9, '500m': 8, '1km': 7, '2km': 6, '31.25m': 12 };

// fire detections are vector layers in GIBS: rendered for us by its WMS
const WMS_ONLY = new Set(['VIIRS_SNPP_Thermal_Anomalies_375m_All', 'VIIRS_NOAA20_Thermal_Anomalies_375m_All', 'MODIS_Terra_Thermal_Anomalies_All']);

export const GIBS_ATTRIBUTION = '<a href="https://earthdata.nasa.gov/gibs" target="_blank" rel="noreferrer">NASA GIBS</a>';

/** maximum native zoom of a layer in web Mercator */
export function maxZoom(layer) {
  return LEVEL[layer.tms] ?? 8;
}

/** MapLibre raster source for a catalogue layer on a date (null date = the layer's default) */
export function gibsSource(layer, date) {
  const time = date || 'default';
  if (WMS_ONLY.has(layer.gibs)) {
    return {
      type: 'raster', tileSize: 256, maxzoom: 9, attribution: GIBS_ATTRIBUTION,
      tiles: [`${ROOT}/wms/epsg3857/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&STYLES=&LAYERS=${layer.gibs}`
        + `&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256&FORMAT=image/png&TRANSPARENT=true&TIME=${time}`],
    };
  }
  const ext = layer.format === 'png' ? 'png' : 'jpg';
  const z = maxZoom(layer);
  return {
    type: 'raster', tileSize: 256, maxzoom: z, attribution: GIBS_ATTRIBUTION,
    tiles: [`${ROOT}/wmts/epsg3857/best/${layer.gibs}/default/${time}/GoogleMapsCompatible_Level${z}/{z}/{y}/{x}.${ext}`],
  };
}

// ---------------------------------------------------------------- colour under the cursor
// The legend turns a colour back into a number (src/lib/legend.js). On the web
// map the tiles live inside MapLibre, so the few tiles under the cursor are
// fetched once more as images (the browser cache usually has them already).
const tiles = new Map();
const MAX_TILES = 48;

function tileImage(url) {
  let t = tiles.get(url);
  if (t) { tiles.delete(url); tiles.set(url, t); return t; }   // LRU: move to the end
  t = new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = img.width; c.height = img.height;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);
        resolve(ctx.getImageData(0, 0, c.width, c.height));
      } catch { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
  tiles.set(url, t);
  while (tiles.size > MAX_TILES) tiles.delete(tiles.keys().next().value);
  return t;
}

/** [r, g, b, a] of a GIBS layer at lon/lat, read from the tile of a zoom level */
export async function sampleGibs(layer, date, lon, lat, zoom) {
  if (!layer || WMS_ONLY.has(layer.gibs)) return null;
  const z = Math.max(0, Math.min(maxZoom(layer), Math.floor(zoom)));
  const n = 2 ** z;
  const x = ((lon + 180) / 360) * n;
  const s = Math.sin((Math.max(-85.05, Math.min(85.05, lat)) * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n;
  const tx = Math.floor(x), ty = Math.floor(y);
  if (ty < 0 || ty >= n) return null;
  const src = gibsSource(layer, date).tiles[0];
  const url = src.replace('{z}', z).replace('{x}', ((tx % n) + n) % n).replace('{y}', ty);
  const img = await tileImage(url);
  if (!img) return null;
  const px = Math.min(img.width - 1, Math.floor((x - tx) * img.width));
  const py = Math.min(img.height - 1, Math.floor((y - ty) * img.height));
  const i = (py * img.width + px) * 4;
  return [img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3]];
}
