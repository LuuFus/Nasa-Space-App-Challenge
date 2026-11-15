// Base maps of the OpenStreetMap view. All of them are OpenStreetMap data
// (© OpenStreetMap contributors, ODbL):
//  * osm    — the classic raster tiles of openstreetmap.org;
//  * light / dark — vector tiles of OpenFreeMap (free, no key), so the names can
//    follow the UA / EN switch and our layers can sit *under* the names;
//  * satellite — a NASA GIBS picture with the names and borders of the dark style.
import { gibsSource } from './gibs.js';

const OSM_ATTR = '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>';
const OFM_ATTR = '<a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a> ' + OSM_ATTR;
export const GLYPHS = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';
export const FONT = ['Noto Sans Regular'];
export const FONT_BOLD = ['Noto Sans Bold'];

export const BASEMAPS = [
  { id: 'osm', title: { uk: 'OSM класична', en: 'OSM classic' }, dark: false },
  { id: 'light', title: { uk: 'Світла', en: 'Light' }, dark: false },
  { id: 'dark', title: { uk: 'Темна', en: 'Dark' }, dark: true },
  { id: 'satellite', title: { uk: 'Супутник NASA', en: 'NASA satellite' }, dark: true },
];

const styleCache = new Map();
function fetchStyle(name) {
  if (!styleCache.has(name)) {
    styleCache.set(name, fetch(`https://tiles.openfreemap.org/styles/${name}`).then((r) => {
      if (!r.ok) throw new Error(`style ${name}: HTTP ${r.status}`);
      return r.json();
    }).catch((e) => { styleCache.delete(name); throw e; }));
  }
  return styleCache.get(name).then((s) => structuredClone(s));
}

/** names in the chosen language, falling back to the local name */
function nameExpr(lang) {
  return lang === 'uk'
    ? ['coalesce', ['get', 'name:uk'], ['get', 'name']]
    : ['coalesce', ['get', 'name:en'], ['get', 'name:latin'], ['get', 'name']];
}

/** localise names, hide "disputed" border lines (the project shows Ukraine in its official borders) */
function adapt(style, lang) {
  for (const l of style.layers) {
    const tf = l.layout?.['text-field'];
    if (tf && JSON.stringify(tf).includes('name')) l.layout['text-field'] = nameExpr(lang);
    if (l.id === 'boundary_disputed') (l.layout ||= {}).visibility = 'none';
  }
  for (const src of Object.values(style.sources)) if (src.type === 'vector') src.attribution = OFM_ATTR;
  return style;
}

function rasterStyle(id, source) {
  return {
    version: 8, glyphs: GLYPHS,
    sources: { [id]: source },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': '#0d1626' } },
      { id: `${id}-tiles`, type: 'raster', source: id, paint: { 'raster-fade-duration': 150 } },
    ],
  };
}

/**
 * MapLibre style for a base map.
 * `sat` = { layer, date } — the NASA picture for the satellite map.
 */
export async function buildStyle(id, lang, sat) {
  if (id === 'osm') {
    return rasterStyle('osm', {
      type: 'raster', tileSize: 256, maxzoom: 19, attribution: OSM_ATTR,
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
    });
  }
  if (id === 'light') return adapt(await fetchStyle('positron'), lang);
  if (id === 'dark') return adapt(await fetchStyle('dark'), lang);
  // satellite: NASA picture + only names and borders of the dark style on top
  const dark = adapt(await fetchStyle('dark'), lang);
  const keep = dark.layers.filter((l) => l.type === 'symbol' || l['source-layer'] === 'boundary');
  const base = rasterStyle('sat', gibsSource(sat.layer, sat.date));
  return {
    ...dark,
    sources: { ...dark.sources, sat: base.sources.sat },
    layers: [...base.layers, ...keep.filter((l) => !/highway|road|path/.test(l.id))],
  };
}

/** id of the first layer with names: our layers go under it, so the names stay readable */
export function firstLabelLayer(map) {
  return map.getStyle().layers.find((l) => l.type === 'symbol')?.id;
}

/** switch the names of a vector style to another language without reloading it */
export function setLabelLanguage(map, lang) {
  for (const l of map.getStyle().layers) {
    if (l.type !== 'symbol' || l.id.startsWith('etd-')) continue;
    const tf = map.getLayoutProperty(l.id, 'text-field');
    if (tf && JSON.stringify(tf).includes('name')) map.setLayoutProperty(l.id, 'text-field', nameExpr(lang));
  }
}
