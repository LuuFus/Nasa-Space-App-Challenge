import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// MapLibre finds its worker next to its own file; after bundling it lives elsewhere, so say where
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import './map.css';
import { useStore } from '../state/store.js';
import { useT } from '../i18n/index.js';
import { EVENTS } from '../content/events.js';
import { countryAt, loadCountries, loadJSON } from '../lib/data.js';
import { valueAt } from '../lib/legend.js';
import { FRONT_STYLE, parseFront } from '../lib/frontGeo.js';
import { getEngine } from '../engine/instance.js';
import { markerIcon } from '../ui/markerIcon.js';
import { buildStyle, firstLabelLayer, FONT, GLYPHS, setLabelLanguage } from './basemaps.js';
import { gibsSource, sampleGibs } from './gibs.js';
import { fillColorExpr, frontAreas, frontLines, HATCHED, hatchImage } from './frontLayer.js';
import { altToZoom, setMap, zoomToAlt } from './instance.js';
import { covers, gridFor, loadGrid, nowIndex, sampleField } from './weather/data.js';
import { wxLayer } from './weather/layers.js';
import { WindParticles } from './weather/particles.js';
import { isolines, renderField } from './weather/render.js';
import WeatherUI from './WeatherUI.jsx';

// The OpenStreetMap view: a flat "real" map (roads, towns, rivers) instead of the
// 3D globe. Everything the panels switch on (NASA layers, the front line, events,
// fires, trend maps, compared countries) is drawn here too, plus a live weather
// forecast in the spirit of windy.com.

const EMPTY = { type: 'FeatureCollection', features: [] };
const BLANK = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
const WORLD = [[-180, 85.05], [180, 85.05], [180, -85.05], [-180, -85.05]];
const START_STYLE = { version: 8, glyphs: GLYPHS, sources: {}, layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#0d1626' } }] };
const SEL = { a: '#ff9f1c', b: '#8f5cff' };

maplibregl.setWorkerUrl(workerUrl);

const layerById = (catalog, id) => catalog?.layers.find((l) => l.id === id) || null;

let frontPromise = null;
const loadFront = () => (frontPromise ??= loadJSON('front.json').then(parseFront));

/** our layers, always in the same order, under the names of the base map */
function addOwnLayers(map) {
  const before = firstLabelLayer(map);
  const add = (l) => map.addLayer(l, before);
  for (const k of HATCHED) {
    if (!map.hasImage(`hatch-${k}`)) map.addImage(`hatch-${k}`, hatchImage(FRONT_STYLE[k].hatch));
  }
  const geo = (id) => map.addSource(id, { type: 'geojson', data: EMPTY });
  map.addSource('etd-choro', { type: 'geojson', data: EMPTY });
  add({ id: 'etd-choro', type: 'fill', source: 'etd-choro', paint: { 'fill-color': ['get', 'color'], 'fill-antialias': false } });
  map.addSource('etd-trend', { type: 'image', url: BLANK, coordinates: WORLD });
  add({ id: 'etd-trend', type: 'raster', source: 'etd-trend', layout: { visibility: 'none' }, paint: { 'raster-opacity': 0.9, 'raster-resampling': 'nearest', 'raster-fade-duration': 0 } });
  map.addSource('etd-wx', { type: 'image', url: BLANK, coordinates: WORLD });
  add({ id: 'etd-wx', type: 'raster', source: 'etd-wx', layout: { visibility: 'none' }, paint: { 'raster-opacity': 1, 'raster-resampling': 'linear', 'raster-fade-duration': 0 } });
  geo('etd-front-areas');
  add({ id: 'etd-front-fill', type: 'fill', source: 'etd-front-areas', paint: { 'fill-color': fillColorExpr(), 'fill-antialias': false } });
  add({ id: 'etd-front-hatch', type: 'fill', source: 'etd-front-areas', filter: ['in', ['get', 'k'], ['literal', HATCHED]], paint: { 'fill-pattern': ['concat', 'hatch-', ['get', 'k']], 'fill-opacity': 0.9 } });
  geo('etd-front-lines');
  add({ id: 'etd-front-line', type: 'line', source: 'etd-front-lines', layout: { 'line-join': 'round' }, paint: { 'line-color': ['get', 'color'], 'line-width': ['case', ['get', 'strong'], 2.2, 1.1] } });
  geo('etd-front-cmp');
  add({ id: 'etd-front-cmp', type: 'line', source: 'etd-front-cmp', paint: { 'line-color': '#ffffff', 'line-width': 1.8, 'line-dasharray': [3, 2] } });
  geo('etd-sel');
  add({ id: 'etd-sel-glow', type: 'line', source: 'etd-sel', paint: { 'line-color': ['get', 'color'], 'line-width': 7, 'line-opacity': 0.25, 'line-blur': 3 } });
  add({ id: 'etd-sel', type: 'line', source: 'etd-sel', paint: { 'line-color': ['get', 'color'], 'line-width': 2.2 } });
  geo('etd-iso');
  add({ id: 'etd-iso', type: 'line', source: 'etd-iso', paint: { 'line-color': 'rgba(255,255,255,0.7)', 'line-width': ['case', ['==', ['%', ['get', 'level'], 20], 0], 1.6, 0.9] } });
  geo('etd-fire-track');
  add({ id: 'etd-fire-track', type: 'line', source: 'etd-fire-track', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#ffffff', 'line-width': 2, 'line-opacity': 0.9 } });
  geo('etd-fires');
  add({ id: 'etd-fires', type: 'circle', source: 'etd-fires', filter: ['<', ['get', 'day'], -1], paint: { 'circle-radius': 3, 'circle-color': '#fff' } });
  geo('etd-spot');
  map.addLayer({ id: 'etd-iso-label', type: 'symbol', source: 'etd-iso', layout: { 'symbol-placement': 'line', 'text-field': ['get', 'label'], 'text-font': FONT, 'text-size': 11, 'symbol-spacing': 320 },
    paint: { 'text-color': '#ffffff', 'text-halo-color': 'rgba(4,11,36,0.75)', 'text-halo-width': 1.3 } });
}

/** equirectangular picture (our trend maps) -> web Mercator canvas, row by row */
function toMercator(img) {
  const W = img.width, H = Math.round(img.width);
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const yMax = Math.log(Math.tan(Math.PI / 4 + (85.05 * Math.PI) / 360));
  for (let y = 0; y < H; y++) {
    const my = yMax - ((y + 0.5) / H) * 2 * yMax;
    const lat = (2 * Math.atan(Math.exp(my)) - Math.PI / 2) * (180 / Math.PI);
    const sy = Math.min(img.height - 1, Math.max(0, Math.floor(((90 - lat) / 180) * img.height)));
    ctx.drawImage(img, 0, sy, W, 1, 0, y, W, 1);
  }
  return c;
}

const toGeo = (rings) => rings.map((poly) => poly.map((r) => {
  const out = [];
  for (let i = 0; i < r.length; i += 2) out.push([r[i], r[i + 1]]);
  return out;
}));

export default function MapView({ active }) {
  const ref = useRef(null);
  const mapRef = useRef(null);
  const partRef = useRef(null);
  const markersRef = useRef([]);
  const spotMarker = useRef(null);
  const wxBlob = useRef(null);
  const [ready, setReady] = useState(0);         // number of the loaded base map style, 0 while loading
  const styleGen = useRef(0);
  const [countries, setCountries] = useState(null);
  const [hover, setHover] = useState(null);
  const [view, setView] = useState(0);           // +1 after the map stopped moving
  const [fc, setFc] = useState(null);            // weather forecast grid
  const [aq, setAq] = useState(null);            // air-quality grid
  const [wxState, setWxState] = useState({ loading: false, error: null });
  const [retry, setRetry] = useState(0);
  const { t, pick, lang } = useT();
  const s = useStore();
  const { catalog, basemap, baseId, overlayId, dates, overlayOpacity, toggles, front, fire, trendMap, selA, selB, panel, wx } = s;
  const langRef = useRef(lang);
  langRef.current = lang;

  // ---------------------------------------------------------------- create the map once
  useEffect(() => {
    const eng = getEngine();
    const g = eng?.controls?.globe;
    const h = ref.current.clientHeight || 800;
    const map = new maplibregl.Map({
      container: ref.current, style: START_STYLE,
      center: g ? [g.lon, Math.max(-75, Math.min(75, g.lat))] : [31, 48.5],
      zoom: g ? altToZoom(g.alt, g.lat, h) : 4.6,
      minZoom: 1, maxZoom: 17, dragRotate: false, pitchWithRotate: false, touchPitch: false,
      attributionControl: { compact: true }, fadeDuration: 150,
    });
    map.touchZoomRotate.disableRotation();
    map.keyboard.disableRotation();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');
    // every loaded style gets a new number, so effects re-run even when React batches 0 -> n
    map.on('style.load', () => { addOwnLayers(map); setReady(++styleGen.current); });
    map.on('error', (e) => { if (import.meta.env.DEV) console.warn('map:', e.error?.message || e); });
    map.on('moveend', () => setView((v) => v + 1));
    mapRef.current = map;
    partRef.current = new WindParticles(map);
    setMap(map);
    loadCountries().then(setCountries);
    const markers = EVENTS.map((ev) => {
      const el = document.createElement('div');
      el.className = `lbl-event cat-${ev.cat} osm-marker`;
      el.innerHTML = `<span>${markerIcon(ev.cat)}</span>`;
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const st = useStore.getState();
        st.setEvent(ev.id);
        st.setPanel('events');
      });
      const m = new maplibregl.Marker({ element: el }).setLngLat([ev.lon, ev.lat]).addTo(map);
      m.ev = ev;
      return m;
    });
    markersRef.current = markers;
    return () => { markers.forEach((m) => m.remove()); partRef.current.dispose(); setMap(null); map.remove(); };
  }, []);

  // ---------------------------------------------------------------- shown / hidden
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const eng = getEngine();
    if (active) {
      map.resize();
      const g = eng?.controls?.globe;
      if (g && eng.mode === 'globe') map.jumpTo({ center: [g.lon, Math.max(-75, Math.min(75, g.lat))], zoom: altToZoom(g.alt, g.lat, map.getContainer().clientHeight) });
      eng?.setPaused?.(true);
    } else if (eng) {
      // back to the 3D engine at the place the map shows
      const c = map.getCenter();
      eng.setCameraTo?.(c.lng, c.lat, zoomToAlt(map.getZoom(), c.lat, map.getContainer().clientHeight || 800));
      eng.setPaused?.(false);
    }
  }, [active]);

  // ---------------------------------------------------------------- base map
  const satLayer = layerById(catalog, baseId) || layerById(catalog, 'bluemarble');
  const satDate = satLayer ? dates[satLayer.id] ?? satLayer.date : null;
  const satKey = basemap === 'satellite' ? `${satLayer?.id}@${satDate}` : '';
  useEffect(() => {
    const map = mapRef.current;
    if (!map || (basemap === 'satellite' && !satLayer)) return;
    let dead = false;
    buildStyle(basemap, langRef.current, { layer: satLayer, date: satDate })
      .then((style) => {
        if (dead) return;
        setReady(0);       // our layers wait for the new style (style.load sets it back)
        map.setStyle(style, { diff: false });
      })
      .catch(() => { if (!dead && basemap !== 'osm') useStore.getState().setBasemap('osm'); });
    return () => { dead = true; };
  }, [basemap, satKey]);
  useEffect(() => { if (ready && basemap !== 'osm') setLabelLanguage(mapRef.current, lang); }, [lang]);
  // a NASA picture chosen in the Layers tab is shown as the satellite base map
  const firstBase = useRef(baseId);
  useEffect(() => {
    if (baseId !== firstBase.current) { firstBase.current = baseId; if (baseId !== 'bluemarble') s.setBasemap('satellite'); }
  }, [baseId]);

  // ---------------------------------------------------------------- NASA data layer
  const ov = layerById(catalog, overlayId);
  const ovDate = ov ? dates[ov.id] ?? ov.date : null;
  useEffect(() => {
    const map = mapRef.current;
    if (!ready) return;
    if (map.getLayer('etd-nasa')) map.removeLayer('etd-nasa');
    if (map.getSource('etd-nasa')) map.removeSource('etd-nasa');
    if (!ov) return;
    map.addSource('etd-nasa', gibsSource(ov, ovDate));
    map.addLayer({ id: 'etd-nasa', type: 'raster', source: 'etd-nasa', paint: { 'raster-opacity': useStore.getState().overlayOpacity, 'raster-fade-duration': 200 } }, 'etd-trend');
  }, [ready, ov?.id, ovDate]);
  useEffect(() => { if (ready && mapRef.current.getLayer('etd-nasa')) mapRef.current.setPaintProperty('etd-nasa', 'raster-opacity', overlayOpacity); }, [ready, overlayOpacity]);

  // ---------------------------------------------------------------- trend maps (our own pictures)
  useEffect(() => {
    const map = mapRef.current;
    if (!ready) return;
    if (!trendMap?.url) { map.setLayoutProperty('etd-trend', 'visibility', 'none'); return; }
    let dead = false;
    const img = new Image();
    img.onload = () => {
      if (dead) return;
      map.getSource('etd-trend').updateImage({ url: toMercator(img).toDataURL(), coordinates: WORLD });
      map.setPaintProperty('etd-trend', 'raster-opacity', trendMap.opacity ?? 0.85);
      map.setLayoutProperty('etd-trend', 'visibility', 'visible');
    };
    img.src = trendMap.url;
    return () => { dead = true; };
  }, [ready, trendMap?.url, trendMap?.opacity]);

  // ---------------------------------------------------------------- front line in Ukraine
  useEffect(() => {
    const map = mapRef.current;
    if (!ready) return;
    const set = (id, data) => map.getSource(id)?.setData(data);
    if (!front.on) { set('etd-front-areas', EMPTY); set('etd-front-lines', EMPTY); set('etd-front-cmp', EMPTY); return; }
    let dead = false;
    loadFront().then((d) => {
      if (dead) return;
      const i = Math.max(0, Math.min(d.snapshots.length - 1, front.idx ?? d.snapshots.length - 1));
      const snap = d.snapshots[i];
      const cmp = front.compare != null && front.compare !== i ? d.snapshots[front.compare] : null;
      const { lines, compare } = frontLines(d, snap, cmp);
      set('etd-front-areas', frontAreas(snap));
      set('etd-front-lines', lines);
      set('etd-front-cmp', compare);
    });
    return () => { dead = true; };
  }, [ready, front.on, front.idx, front.compare]);

  // ---------------------------------------------------------------- compared countries + choropleth
  const comparing = panel === 'compare';
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !countries) return;
    const feats = comparing ? [['a', selA], ['b', selB]].map(([k, id]) => {
      const c = countries.byId.get(id);
      return c && { type: 'Feature', properties: { color: SEL[k] }, geometry: { type: 'MultiLineString', coordinates: toGeo(c.rings).flat() } };
    }).filter(Boolean) : [];
    map.getSource('etd-sel').setData({ type: 'FeatureCollection', features: feats });
  }, [ready, countries, selA, selB, comparing]);
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !countries) return;
    const fn = s.choropleth;
    const feats = fn ? countries.list.map((c) => {
      const color = fn(c.id);
      return color && { type: 'Feature', properties: { color }, geometry: { type: 'MultiPolygon', coordinates: toGeo(c.rings) } };
    }).filter(Boolean) : [];
    map.getSource('etd-choro').setData({ type: 'FeatureCollection', features: feats });
  }, [ready, countries, s.choropleth]);

  // ---------------------------------------------------------------- fires day by day
  const fireData = useRef(null);
  useEffect(() => {
    const map = mapRef.current;
    if (!ready) return;
    if (!fire?.id) { map.getSource('etd-fires').setData(EMPTY); map.getSource('etd-fire-track').setData(EMPTY); fireData.current = null; return; }
    let dead = false;
    loadJSON(`fires/${fire.id}.json`).then((d) => {
      if (dead) return;
      fireData.current = d;
      map.getSource('etd-fires').setData({
        type: 'FeatureCollection',
        features: d.points.map((p) => ({ type: 'Feature', properties: { day: p[2], frp: p[3] }, geometry: { type: 'Point', coordinates: [p[0], p[1]] } })),
      });
      const big = d.points.length > 20000 ? 0.7 : d.points.length > 3000 ? 1 : 1.4;
      map.setPaintProperty('etd-fires', 'circle-radius', ['interpolate', ['linear'], ['zoom'], 3, 1.6 * big, 8, 3.5 * big, 12, 6 * big]);
      setFireDay(map, d, useStore.getState().fire?.day ?? 0);
    });
    return () => { dead = true; };
  }, [ready, fire?.id]);
  useEffect(() => { if (ready && fireData.current && fire) setFireDay(mapRef.current, fireData.current, fire.day); }, [ready, fire?.day]);

  // ---------------------------------------------------------------- event markers
  useEffect(() => {
    for (const m of markersRef.current) {
      m.getElement().style.display = toggles.events ? '' : 'none';
      m.getElement().title = pick(m.ev.title);
    }
  }, [toggles.events, lang]);

  // ---------------------------------------------------------------- weather (Open-Meteo)
  const L = wxLayer(wx.layer);
  const weatherOn = !!L;
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !weatherOn || !active) return;
    const b = map.getBounds();
    const g = gridFor([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
    const jobs = [];
    if (!covers(fc?.grid, g)) jobs.push(() => loadGrid(g, 'forecast').then((d) => !dead && setFc(d)));
    if (L.api === 'air' && !covers(aq?.grid, g)) jobs.push(() => loadGrid(g, 'air').then((d) => !dead && setAq(d)));
    if (!jobs.length) return;
    let dead = false;
    // wait until the map has rested a moment: one request per stop, not per frame
    const timer = setTimeout(() => {
      setWxState({ loading: true, error: null });
      Promise.all(jobs.map((j) => j())).then(() => !dead && setWxState({ loading: false, error: null }))
        .catch((e) => !dead && setWxState({ loading: false, error: e.message || String(e) }));
    }, 300);
    return () => { dead = true; clearTimeout(timer); };
  }, [weatherOn, L?.api, view, active, retry]);
  // start at the step closest to now
  useEffect(() => { if (fc && wx.t == null) s.setWx({ t: nowIndex(fc.times) }); }, [fc]);

  // the field shown now: forecast or air quality, at the chosen time
  const tIdx = fc ? Math.max(0, Math.min(fc.times.length - 1, wx.t ?? nowIndex(fc.times))) : 0;
  const field = (() => {
    if (!L || !fc) return null;
    if (L.api === 'forecast') return { grid: fc.grid, f: fc.vars[L.v][tIdx] };
    if (!aq) return null;
    const time = fc.times[tIdx];
    let k = aq.times.findIndex((x) => x >= time);
    if (k < 0) k = aq.times.length - 1;
    return { grid: aq.grid, f: aq.vars[L.v][k] };
  })();
  const fieldRef = useRef(null);
  fieldRef.current = field && { ...field, layer: L };

  useEffect(() => {
    const map = mapRef.current;
    if (!ready) return;
    if (!field) {
      map.setLayoutProperty('etd-wx', 'visibility', 'none');
      map.getSource('etd-iso').setData(EMPTY);
      return;
    }
    const { canvas, coordinates } = renderField(field.grid, field.f, L.id);
    let dead = false;
    canvas.toBlob((blob) => {
      if (dead || !blob) return;
      const url = URL.createObjectURL(blob);
      map.getSource('etd-wx').updateImage({ url, coordinates });
      map.setLayoutProperty('etd-wx', 'visibility', 'visible');
      if (wxBlob.current) setTimeout(((old) => () => URL.revokeObjectURL(old))(wxBlob.current), 2000);
      wxBlob.current = url;
    });
    map.getSource('etd-iso').setData(L.isolines ? isolines(field.grid, field.f, L.isolines) : EMPTY);
    return () => { dead = true; };
  }, [ready, field?.f, L?.id]);

  useEffect(() => {
    const p = partRef.current;
    if (!p) return;
    const on = active && weatherOn && wx.particles && !!fc;
    p.setVisible(on);
    if (on) p.setWind(fc.grid, fc.vars.u[tIdx], fc.vars.v[tIdx]);
  }, [active, weatherOn, wx.particles, fc, tIdx]);

  // timeline playback
  useEffect(() => {
    if (!wx.playing || !fc) return;
    const id = setInterval(() => {
      const cur = useStore.getState().wx.t ?? 0;
      s.setWx({ t: cur >= fc.times.length - 1 ? 0 : cur + 1 });
    }, 900);
    return () => clearInterval(id);
  }, [wx.playing, fc]);

  // ---------------------------------------------------------------- spot forecast marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    spotMarker.current?.remove();
    spotMarker.current = null;
    if (s.spot) {
      const el = document.createElement('div');
      el.className = 'spot-pin';
      spotMarker.current = new maplibregl.Marker({ element: el }).setLngLat([s.spot.lon, s.spot.lat]).addTo(map);
    }
  }, [s.spot]);

  // ---------------------------------------------------------------- hover and click
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    let last = 0, seq = 0;
    const move = (e) => {
      const now = performance.now();
      if (now - last < 50) return;
      last = now;
      const { lng, lat } = e.lngLat;
      const lon = ((((lng + 180) % 360) + 360) % 360) - 180;
      const c = countryAt(countries, lon, lat);
      const st = useStore.getState();
      const F = fieldRef.current;
      let wxv = null;
      if (F) {
        const v = sampleField(F.grid, F.f, lon, lat);
        if (!Number.isNaN(v)) wxv = { title: F.layer.title, text: `${v.toFixed(F.layer.digits)} ${pick(F.layer.units)}` };
      }
      const base = { x: e.point.x, y: e.point.y, lon, lat, country: c, wx: wxv };
      setHover(base);
      const layer = layerById(st.catalog, st.overlayId);
      if (layer?.legend) {
        const my = ++seq;
        sampleGibs(layer, st.dates[layer.id] ?? layer.date, lon, lat, map.getZoom()).then((rgba) => {
          if (my !== seq) return;
          const val = valueAt(layer, rgba, st.lang);
          if (val) setHover((h) => (h && h.lon === lon ? { ...h, val, layer } : h));
        });
      }
    };
    const out = () => { seq++; setHover(null); };
    const click = (e) => {
      const { lng, lat } = e.lngLat;
      const lon = ((((lng + 180) % 360) + 360) % 360) - 180;
      const st = useStore.getState();
      const c = countryAt(countries, lon, lat);
      if (st.panel === 'compare' && c) {
        st.setSel(st.pickTarget, c.id);
        st.setPickTarget(st.pickTarget === 'a' ? 'b' : 'a');
        return;
      }
      if (c) st.setSel('a', c.id);
      if (st.wx.layer) st.setSpot({ lon, lat });
    };
    map.on('mousemove', move);
    map.on('mouseout', out);
    map.on('click', click);
    return () => { map.off('mousemove', move); map.off('mouseout', out); map.off('click', click); };
  }, [countries, lang]);

  const show = active ? 'osm-wrap' : 'osm-wrap is-hidden';
  return (
    <div className={`${show} base-${basemap}${weatherOn ? ' wx-on' : ''}`}>
      <div className="osm-map" ref={ref} />
      {hover && (hover.country || hover.val || hover.wx) && (
        <div className="tooltip" style={{ left: hover.x + 14, top: hover.y + 14 }}>
          {hover.country && <b>{pick(hover.country.name)}</b>}
          <div className="muted">{hover.lat.toFixed(2)}°, {hover.lon.toFixed(2)}°</div>
          {hover.wx && <div>{pick(hover.wx.title)}: <b>{hover.wx.text}</b></div>}
          {hover.val && <div>{pick(hover.layer.title)}: <b>{hover.val.text}</b></div>}
        </div>
      )}
      {active && (
        <WeatherUI fc={fc} tIdx={tIdx} state={wxState} retry={() => setRetry((x) => x + 1)} />
      )}
      {active && <div className="hint osm-hint">{weatherOn ? t('osmHintWx') : t('osmHint')}</div>}
    </div>
  );
}

/** fires up to `day`: colour by age (today bright, last days orange, older dark red) + centre track */
function setFireDay(map, d, day) {
  const dd = Math.min(day, d.days - 1);
  map.setFilter('etd-fires', ['<=', ['get', 'day'], dd]);
  map.setPaintProperty('etd-fires', 'circle-color', ['step', ['-', dd, ['get', 'day']], '#fff28c', 1, '#ff7314', 4, '#8c0f0d']);
  map.setPaintProperty('etd-fires', 'circle-opacity', ['step', ['-', dd, ['get', 'day']], 1, 1, 0.85, 4, 0.55]);
  const pts = [];
  for (let i = 0; i <= dd; i++) {
    let sx = 0, sy = 0, k = 0;
    for (let j = Math.max(0, i - 1); j <= Math.min(d.days - 1, i + 1); j++) if (d.centre[j]) { sx += d.centre[j][0]; sy += d.centre[j][1]; k++; }
    if (k) pts.push([sx / k, sy / k]);
  }
  map.getSource('etd-fire-track').setData(pts.length >= 2 ? { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: pts } } : EMPTY);
}
