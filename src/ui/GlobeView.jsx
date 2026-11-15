import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Engine } from '../engine/Engine.js';
import { Vectors } from '../engine/Vectors.js';
import { Front } from '../engine/Front.js';
import { Fires } from '../engine/Fires.js';
import MapOverlay from './MapOverlay.jsx';
import { setEngine } from '../engine/instance.js';
import { countryAt, loadCountries } from '../lib/data.js';
import { valueAt } from '../lib/legend.js';
import { useStore } from '../state/store.js';
import { useT } from '../i18n/index.js';
import { EVENTS } from '../content/events.js';
import { markerIcon } from './markerIcon.js';
import { activeHotspots } from '../content/hotspots.js';
import { HotspotCard, enterHotspot, hotspotHtml, leaveHotspot, pinHotspot } from './Hotspots.jsx';

// the OpenStreetMap view (MapLibre) is a separate chunk, loaded the first time it is opened
const MapView = lazy(() => import('../map/MapView.jsx'));

export function layerById(catalog, id) {
  return catalog?.layers.find((l) => l.id === id) || null;
}

export default function GlobeView() {
  const ref = useRef(null);
  const engRef = useRef(null);
  const vecRef = useRef(null);
  const [hover, setHover] = useState(null);
  const [countries, setCountries] = useState(null);
  const [contour, setContour] = useState(false);
  const { t, pick, lang } = useT();
  const s = useStore();

  // ---- create the engine once
  useEffect(() => {
    const eng = new Engine(ref.current);
    const vec = new Vectors(eng);
    eng.vectors = vec;
    eng.front = new Front(eng);
    eng.fires = new Fires(eng);
    engRef.current = eng;
    vecRef.current = vec;
    setEngine(eng);
    loadCountries().then(setCountries);
    const offStyle = eng.on('style', (st) => setContour(st.contour));
    return () => { offStyle(); setEngine(null); eng.dispose(); };
  }, []);

  // ---- store -> engine
  const { catalog, baseId, overlayId, dates, overlayOpacity, toggles, mode, flatStyle, selA, selB, swipe, trendMap, cloudDate, front, fire } = s;
  useEffect(() => {
    const f = engRef.current?.fires;
    if (!f) return;
    if (!fire?.id) { f.hide(); return; }
    f.load(fire.id).then(() => f.setDay(fire.day));
  }, [fire?.id, fire?.day]);
  useEffect(() => {
    const f = engRef.current?.front;
    if (!f) return;
    if (!front.on) { f.hide(); return; }
    f.load().then((d) => f.show(front.idx ?? d.snapshots.length - 1, front.compare));
  }, [front.on, front.idx, front.compare]);
  useEffect(() => {
    const eng = engRef.current;
    if (!eng || !catalog) return;
    const base = layerById(catalog, baseId);
    eng.setBase(base, dates[baseId] ?? base?.date);
  }, [catalog, baseId, dates[baseId]]);

  useEffect(() => {
    const eng = engRef.current;
    if (!eng || !catalog) return;
    const ov = layerById(catalog, overlayId);
    eng.setOverlay(ov, ov ? dates[overlayId] ?? ov.date : null, overlayOpacity);
  }, [catalog, overlayId, overlayId && dates[overlayId]]);

  useEffect(() => { engRef.current?.setOverlayOpacity(overlayOpacity); }, [overlayOpacity]);
  useEffect(() => { engRef.current?.setClouds(toggles.clouds, cloudDate); }, [toggles.clouds, cloudDate]);
  useEffect(() => {
    const v = vecRef.current;
    if (!v) return;
    for (const k of ['borders', 'rivers', 'graticule', 'capitals', 'labels', 'oceans', 'tint']) if (v.state[k] !== toggles[k]) v.set(k, toggles[k]);
    engRef.current.labels.setVisible('events', toggles.events);
  }, [toggles]);
  useEffect(() => { if (mode !== 'osm') engRef.current?.setMode(mode); }, [mode]);
  const osm = mode === 'osm';
  const [osmUsed, setOsmUsed] = useState(osm);
  useEffect(() => { if (osm) setOsmUsed(true); }, [osm]);
  // the before/after slider lives in the 3D engine: opening it leaves the OSM map
  useEffect(() => { if (osm && swipe.enabled) s.setMode('globe'); }, [osm, swipe.enabled]);
  useEffect(() => { engRef.current?.setFlatStyle(flatStyle); }, [flatStyle]);
  // the two compared countries are highlighted only while comparing (they would hide other layers)
  const comparing = s.panel === 'compare';
  useEffect(() => {
    vecRef.current?.ready.then((v) => (comparing ? v.setSelection(selA, selB) : v.setSelection(null, null)));
  }, [selA, selB, comparing]);
  useEffect(() => { engRef.current?.labels.setLang(lang); }, [lang]);
  useEffect(() => {
    const eng = engRef.current;
    if (!eng || !catalog) return;
    const side = (x) => (x?.image ? { image: x.image } : x && layerById(catalog, x.layer) ? { layer: layerById(catalog, x.layer), date: x.date } : null);
    const L = side(swipe.left);
    const R = side(swipe.right);
    eng.setSwipe({
      enabled: swipe.enabled && !!L && !!R, split: swipe.split,
      left: L || undefined,
      right: R || undefined,
    });
  }, [catalog, swipe]);
  useEffect(() => {
    const eng = engRef.current;
    if (!eng) return;
    eng.setImage(trendMap?.url || null, trendMap?.opacity ?? 0.85);
  }, [trendMap]);

  // ---- event markers
  useEffect(() => {
    const eng = engRef.current;
    if (!eng) return;
    eng.labels.setGroup('events', EVENTS.map((ev) => ({
      key: 'ev' + ev.id, lon: ev.lon, lat: ev.lat, html: markerIcon(ev.cat), title: ev.title,
      cls: 'lbl-event cat-' + ev.cat, marker: true, priority: 1, minZoom: 0,
      onClick: () => { useStore.getState().setEvent(ev.id); useStore.getState().setPanel('events'); },
    })), useStore.getState().toggles.events);
  }, []);

  // ---- signs of anomalies of the layers that are on (src/content/hotspots.js)
  const hsList = activeHotspots(overlayId, baseId);
  const hsKey = hsList.map((h) => h.id).join(',');
  useEffect(() => {
    const eng = engRef.current;
    if (!eng) return;
    eng.labels.setGroup('hotspots', hsList.map((h) => ({
      key: 'hs' + h.id, lon: h.lon, lat: h.lat, html: hotspotHtml(h.level), cls: `lbl-hotspot lvl-${h.level}`,
      marker: true, priority: 0, minZoom: 0,
      onClick: (it, el) => pinHotspot(h.id, el), onEnter: (it, el) => enterHotspot(h.id, el), onLeave: () => leaveHotspot(),
    })), toggles.hotspots && mode !== 'osm');
    // the card of a layer that was switched off closes
    const cur = useStore.getState().hotspot;
    if (cur && !hsList.some((h) => h.id === cur.id)) useStore.setState({ hotspot: null });
  }, [hsKey, toggles.hotspots, mode]);

  // ---- engine -> UI (hover tooltip, clicks)
  useEffect(() => {
    const eng = engRef.current;
    if (!eng) return;
    const offHover = eng.on('hover', (p) => {
      if (!p) { setHover(null); vecRef.current?.setHover(null); useStore.setState({ probe: null }); return; }
      const c = countryAt(countries, p.lon, p.lat);
      vecRef.current?.setHover(c?.id || null);
      const st = useStore.getState();
      const ov = layerById(st.catalog, st.overlayId);
      const val = ov ? valueAt(ov, eng.sampleOverlay(p.lon, p.lat), st.lang) : null;
      setHover({ ...p, country: c, val, layer: ov });
      useStore.setState({ probe: val && ov ? { layer: ov.id, value: val.value, text: val.text } : null });
    });
    const offClick = eng.on('click', (p) => {
      const c = countryAt(countries, p.lon, p.lat);
      const st = useStore.getState();
      if (!c) return;
      if (st.panel === 'compare') {
        st.setSel(st.pickTarget, c.id);
        st.setPickTarget(st.pickTarget === 'a' ? 'b' : 'a');
      } else {
        st.setSel('a', st.selA === c.id ? st.selA : c.id);
      }
    });
    return () => { offHover(); offClick(); };
  }, [countries]);

  return (
    <div className={`globe-wrap${contour && !osm ? ' contour' : ''}${osm ? ' osm-on' : ''}`}>
      <div className={osm ? 'globe is-covered' : 'globe'} ref={ref} />
      {osmUsed && <Suspense fallback={<div className="osm-wrap osm-loading">{t('loading')}</div>}><MapView active={osm} /></Suspense>}
      {!osm && hover && (hover.country || hover.val) && (
        <div className="tooltip" style={{ left: hover.x + 14, top: hover.y + 14 }}>
          {hover.country && <b>{pick(hover.country.name)}</b>}
          <div className="muted">{hover.lat.toFixed(2)}°, {hover.lon.toFixed(2)}°</div>
          {hover.val && <div>{pick(hover.layer.title)}: <b>{hover.val.text}</b></div>}
        </div>
      )}
      <MapOverlay />
      <HotspotCard />
      {!osm && <div className="hint">{t('zoomHint')}</div>}
    </div>
  );
}
