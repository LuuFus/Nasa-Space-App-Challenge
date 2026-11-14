// Shared "do something on the map" helpers used by several panels.
import { useStore } from '../state/store.js';
import { whenEngine } from '../engine/instance.js';

export async function flyTo(lon, lat, alt = 0.3) {
  const eng = await whenEngine();
  return eng.flyTo(lon, lat, alt, 2200);
}

/** apply an event / preset: fly there, set layers and dates, maybe open a swipe */
export function applyEvent(ev) {
  const st = useStore.getState();
  st.setEvent(ev.id);
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
  if (ev.lon != null) flyTo(ev.lon, ev.lat, ev.alt ?? 0.3);
}

export function clearSwipe() {
  useStore.getState().setSwipe({ enabled: false, preset: null });
}
