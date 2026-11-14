// Shared "do something on the map" helpers used by several panels.
import { useStore } from '../state/store.js';
import { whenEngine } from '../engine/instance.js';
import { loadJSON } from './data.js';
import { snapshotIndex } from '../engine/Front.js';

export async function flyTo(lon, lat, alt = 0.3) {
  const eng = await whenEngine();
  return eng.flyTo(lon, lat, alt, 2200);
}

/** apply an event / preset: fly there, set layers and dates, maybe open a swipe or the front line */
export async function applyEvent(ev) {
  const st = useStore.getState();
  if (st.eventApplied) closeEvent(false);
  const undo = { baseId: st.baseId, overlayId: st.overlayId, front: st.front, swipe: st.swipe.enabled };
  useStore.setState({ eventId: ev.id, eventApplied: undo });
  if (ev.swipe) {
    st.setSwipe({ enabled: true, split: 0.5, left: ev.swipe.left, right: ev.swipe.right, preset: ev.id });
  } else if (st.swipe.enabled) {
    st.setSwipe({ enabled: false });
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

export function clearSwipe() {
  useStore.getState().setSwipe({ enabled: false, preset: null });
}
