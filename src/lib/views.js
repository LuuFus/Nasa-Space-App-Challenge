// A "view" is a link to a place in the app: which map, layer, date, panel and
// where the camera looks. Notes keep views, so a student can come back to what
// they found with one click.
import { useStore } from '../state/store.js';
import { getEngine } from '../engine/instance.js';
import { flyTo } from './actions.js';

/** the view on the screen right now */
export async function captureView() {
  const st = useStore.getState();
  let cam = null;
  if (st.mode === 'osm') {
    const { getMap, zoomToAlt } = await import('../map/instance.js');
    const m = getMap();
    if (m) {
      const c = m.getCenter();
      cam = { lon: +c.lng.toFixed(3), lat: +c.lat.toFixed(3), alt: +zoomToAlt(m.getZoom(), c.lat, m.getContainer().clientHeight).toFixed(4) };
    }
  } else {
    const eng = getEngine();
    if (eng) {
      const r = eng.renderer.domElement.getBoundingClientRect();
      const p = eng.pick(r.left + r.width / 2, r.top + r.height / 2);
      const alt = eng.mode === 'flat' ? eng.controls.flat.dist / 1.15 : eng.controls.globe.alt;
      const g = p || eng.controls.globe;
      cam = { lon: +g.lon.toFixed(3), lat: +g.lat.toFixed(3), alt: +alt.toFixed(4) };
    }
  }
  const dates = {};
  for (const id of [st.baseId, st.overlayId]) if (id && st.dates[id]) dates[id] = st.dates[id];
  return {
    mode: st.mode, flatStyle: st.flatStyle, basemap: st.basemap, baseId: st.baseId, overlayId: st.overlayId, dates,
    front: st.front.on ? { on: true, idx: st.front.idx, compare: st.front.compare } : null,
    wx: st.wx.layer, panel: st.panel, cam,
  };
}

/** go back to a saved view */
export function openView(v) {
  const st = useStore.getState();
  if (v.mode === 'flat') { st.setFlatStyle(v.flatStyle || 'contour'); st.setMode('flat'); } else if (v.mode) st.setMode(v.mode);
  if (v.basemap) st.setBasemap(v.basemap);
  // only what the view names is changed (shortcuts name just a few things)
  if (v.baseId) st.setBase(v.baseId);
  if ('overlayId' in v) st.setOverlay(v.overlayId ?? null);
  for (const [id, d] of Object.entries(v.dates || {})) st.setDate(id, d);
  if ('front' in v) st.setFront(v.front ? v.front : { on: false });
  if ('wx' in v) st.setWx({ layer: v.wx ?? null });
  if ('panel' in v) st.setPanel(v.panel);
  if (v.cam) setTimeout(() => flyTo(v.cam.lon, v.cam.lat, v.cam.alt), 250);
}

/** a short description of a view, e.g. "3D Earth · Air temperature · July 2025" */
export function describeView(v, catalog, lang) {
  const uk = lang === 'uk';
  const mode = v.mode === 'osm' ? (uk ? 'Карта OSM' : 'OSM map') : v.mode === 'flat' ? (uk ? 'Контурна карта' : 'Contour map') : (uk ? '3D Земля' : '3D Earth');
  const layer = catalog?.layers.find((l) => l.id === (v.overlayId || (v.baseId !== 'bluemarble' ? v.baseId : null)));
  const parts = [mode];
  if (layer) parts.push(layer.title[lang]);
  const d = layer && v.dates?.[layer.id];
  if (d) parts.push(d);
  if (v.front?.on) parts.push(uk ? 'лінія фронту' : 'front line');
  if (v.wx) parts.push(uk ? 'прогноз погоди' : 'weather forecast');
  return parts.join(' · ');
}

/** ready-made links to the main features of the site */
export const SHORTCUTS = [
  { id: 'war', title: { uk: 'Війна в Україні: лінія фронту', en: 'War in Ukraine: front line' },
    view: { mode: 'osm', basemap: 'light', front: { on: true }, panel: 'layers', cam: { lon: 34.2, lat: 48.4, alt: 0.33 } } },
  { id: 'compare', title: { uk: 'Порівняння країн', en: 'Compare countries' }, view: { panel: 'compare' } },
  { id: 'night', title: { uk: 'Земля вночі', en: 'The Earth at night' },
    view: { mode: 'globe', baseId: 'nightlights', overlayId: null, panel: 'layers', cam: { lon: 18, lat: 34, alt: 2.1 } } },
  { id: 'wind', title: { uk: 'Прогноз вітру (карта OSM)', en: 'Wind forecast (OSM map)' },
    view: { mode: 'osm', basemap: 'dark', wx: 'wind', panel: null, cam: { lon: 16, lat: 49, alt: 0.9 } } },
  { id: 'temp', title: { uk: 'Температура повітря з 1980 року', en: 'Air temperature since 1980' },
    view: { mode: 'globe', overlayId: 't2m', panel: 'layers' } },
  { id: 'chl', title: { uk: 'Хлорофіл в океані й підказки-аномалії', en: 'Ocean chlorophyll and anomaly hints' },
    view: { mode: 'globe', overlayId: 'chlorophyll', panel: 'layers', cam: { lon: -30, lat: 40, alt: 1.8 } } },
  { id: 'planet', title: { uk: 'Графіки всієї планети (CO₂, лід, озон)', en: 'Whole-planet charts (CO₂, ice, ozone)' }, view: { panel: 'planet' } },
  { id: 'events', title: { uk: 'Події та «було / стало»', en: 'Events and before / after' }, view: { panel: 'events' } },
  { id: 'glossary', title: { uk: 'Глосарій термінів', en: 'Glossary of terms' }, view: { panel: 'glossary' } },
];
