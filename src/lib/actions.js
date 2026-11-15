// Shared "do something on the map" helpers used by several panels.
import { useStore } from '../state/store.js';
import { whenEngine } from '../engine/instance.js';
import { loadJSON } from './data.js';
import { snapshotIndex } from './frontGeo.js';

export async function flyTo(lon, lat, alt = 0.3) {
  if (useStore.getState().mode === 'osm') {
    const { whenMap, altToZoom } = await import('../map/instance.js');
    const map = await whenMap();
    map.flyTo({ center: [lon, lat], zoom: altToZoom(alt, lat, map.getContainer().clientHeight), duration: 2200, essential: true });
    return;
  }
  const eng = await whenEngine();
  return eng.flyTo(lon, lat, alt, 2200);
}

/** fly so that a whole box [west, south, east, north] fits on the screen */
export async function flyToBox(bbox, center) {
  const [w, s, e, n] = bbox;
  if (useStore.getState().mode === 'osm' && e - w < 180) {
    const { whenMap } = await import('../map/instance.js');
    (await whenMap()).fitBounds([[w, s], [e, n]], { padding: 70, duration: 2000, maxZoom: 7.5 });
    return;
  }
  const lon = center?.[0] ?? (w + e) / 2, lat = center?.[1] ?? (s + n) / 2;
  const dlon = e - w > 180 ? 70 : e - w;   // a country across the 180th meridian (Russia, USA, Fiji)
  const spanKm = Math.max((n - s) * 111, dlon * 111 * Math.cos((lat * Math.PI) / 180));
  return flyTo(lon, lat, Math.min(2.4, Math.max(0.03, (spanKm * 1.5) / 4638)));
}

/**
 * apply an event / preset: fly there, set layers and dates, maybe open a swipe or the front line.
 * { swipe: false } = only show it on the map (the "after" picture instead of the split screen).
 */
export async function applyEvent(ev, { swipe = true } = {}) {
  const st = useStore.getState();
  if (st.eventApplied) closeEvent(false);
  const undo = { baseId: st.baseId, overlayId: st.overlayId, front: st.front, swipe: st.swipe.enabled };
  useStore.setState({ eventId: ev.id, eventApplied: undo });
  if (ev.swipe && swipe) {
    st.setSwipe({ enabled: true, split: 0.5, left: ev.swipe.left, right: ev.swipe.right, preset: ev.id });
  } else {
    if (st.swipe.enabled) st.setSwipe({ enabled: false, preset: null });
    if (ev.swipe && !ev.base && !ev.layer) {
      const r = ev.swipe.right;
      const layer = st.catalog?.layers.find((l) => l.id === r.layer);
      if (layer?.base) { st.setBase(layer.id); st.setOverlay(null); } else if (layer) st.setOverlay(layer.id);
      if (layer && r.date) st.setDate(layer.id, r.date);
    }
  }
  if (ev.base) {
    st.setBase(ev.base.id);
    if (ev.base.date) st.setDate(ev.base.id, ev.base.date);
  }
  if (ev.layer) {
    const layer = st.catalog?.layers.find((l) => l.id === ev.layer.id);
    if (layer?.base) { st.setBase(layer.id); st.setOverlay(null); } else st.setOverlay(ev.layer.id);
    if (ev.layer.date) st.setDate(ev.layer.id, ev.layer.date);
  }
  if (ev.front) {
    const d = await loadJSON('front.json');
    const idx = snapshotIndex(d.snapshots, ev.front);
    const compare = ev.frontCompare ? snapshotIndex(d.snapshots, ev.frontCompare) : null;
    st.setFront({ on: true, idx, compare });
  }
  st.setFire(ev.fires ? { id: ev.id, day: 0, playing: true } : null);
  if (ev.lon != null) flyTo(ev.lon, ev.lat, ev.alt ?? 0.3);
}

/** leave the event: switch off what it switched on and put the old layers back */
export function closeEvent(clearId = true) {
  const st = useStore.getState();
  const u = st.eventApplied;
  if (u) {
    if (st.baseId !== u.baseId) st.setBase(u.baseId);
    if (st.overlayId !== u.overlayId) st.setOverlay(u.overlayId);
    st.setFront(u.front);
    if (!u.swipe) st.setSwipe({ enabled: false, preset: null });
  }
  st.setFire(null);
  useStore.setState({ eventApplied: null, ...(clearId ? { eventId: null } : {}) });
}

/**
 * The Earth at night: the Black Marble picture (city lights seen by Suomi NPP)
 * as the whole globe, without other colours on top.
 */
export function showNight() {
  const st = useStore.getState();
  if (st.eventApplied) closeEvent();
  if (st.swipe.enabled) st.setSwipe({ enabled: false, preset: null });
  st.setOverlay(null);
  st.setTrendMap(null);
  st.setBase('nightlights');
  // bright borders and rivers would hide the lights: only the names of countries stay
  for (const k of ['tint', 'clouds', 'borders', 'rivers', 'capitals']) st.toggle(k, false);
  if (st.mode === 'osm') st.setBasemap('satellite');
  else if (st.mode !== 'globe') st.setMode('globe');
  flyTo(18, 34, 2.1);
}

/** resolves when the pictures on the screen have loaded (or after maxMs) */
export async function waitForPictures(maxMs = 10000) {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const t0 = performance.now();
  await sleep(350);
  while (performance.now() - t0 < maxMs) {
    if (useStore.getState().mode === 'osm') {
      const { getMap } = await import('../map/instance.js');
      const m = getMap();
      if (!m || (m.loaded() && m.areTilesLoaded())) return true;
    } else {
      const { getEngine } = await import('../engine/instance.js');
      const e = getEngine();
      if (!e || !e.isBusy()) return true;
    }
    await sleep(250);
  }
  return false;
}

export function clearSwipe() {
  useStore.getState().setSwipe({ enabled: false, preset: null });
}
