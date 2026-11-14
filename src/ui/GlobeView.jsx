import { useEffect, useRef, useState } from 'react';
import { Engine } from '../engine/Engine.js';
import { Vectors } from '../engine/Vectors.js';
import { setEngine } from '../engine/instance.js';
import { countryAt, loadCountries } from '../lib/data.js';
import { valueAt } from '../lib/legend.js';
import { useStore } from '../state/store.js';
import { useT } from '../i18n/index.js';
import { EVENTS, EVENT_CATS } from '../content/events.js';

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
    engRef.current = eng;
    vecRef.current = vec;
    setEngine(eng);
    loadCountries().then(setCountries);
    const offStyle = eng.on('style', (st) => setContour(st.contour));
    return () => { offStyle(); setEngine(null); eng.dispose(); };
  }, []);

  // ---- store -> engine
  const { catalog, baseId, overlayId, dates, overlayOpacity, toggles, mode, flatStyle, selA, selB, swipe, trendMap, cloudDate } = s;
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
  useEffect(() => { engRef.current?.setMode(mode); }, [mode]);
  useEffect(() => { engRef.current?.setFlatStyle(flatStyle); }, [flatStyle]);
  useEffect(() => { vecRef.current?.setSelection(selA, selB); }, [selA, selB]);
  useEffect(() => { vecRef.current?.ready.then((v) => v.setSelection(useStore.getState().selA, useStore.getState().selB)); }, []);
  useEffect(() => { engRef.current?.labels.setLang(lang); }, [lang]);
  useEffect(() => {
    const eng = engRef.current;
    if (!eng || !catalog) return;
    const L = swipe.left && layerById(catalog, swipe.left.layer);
    const R = swipe.right && layerById(catalog, swipe.right.layer);
    eng.setSwipe({
      enabled: swipe.enabled && !!L && !!R, split: swipe.split,
      left: L ? { layer: L, date: swipe.left.date } : undefined,
      right: R ? { layer: R, date: swipe.right.date } : undefined,
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
      key: 'ev' + ev.id, lon: ev.lon, lat: ev.lat, text: EVENT_CATS[ev.cat]?.icon || '●', title: ev.title,
      cls: 'lbl-event cat-' + ev.cat, marker: true, priority: 1, minZoom: 0,
      onClick: () => { useStore.getState().setEvent(ev.id); useStore.getState().setPanel('events'); },
    })), useStore.getState().toggles.events);
  }, []);

  // ---- engine -> UI (hover tooltip, clicks)
  useEffect(() => {
    const eng = engRef.current;
    if (!eng) return;
    const offHover = eng.on('hover', (p) => {
      if (!p) { setHover(null); vecRef.current?.setHover(null); return; }
      const c = countryAt(countries, p.lon, p.lat);
      vecRef.current?.setHover(c?.id || null);
      const st = useStore.getState();
      const ov = layerById(st.catalog, st.overlayId);
      const val = ov ? valueAt(ov, eng.sampleOverlay(p.lon, p.lat)) : null;
      setHover({ ...p, country: c, val, layer: ov });
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
    <div className={contour ? 'globe-wrap contour' : 'globe-wrap'}>
      <div className="globe" ref={ref} />
      {hover && (hover.country || hover.val) && (
        <div className="tooltip" style={{ left: hover.x + 14, top: hover.y + 14 }}>
          {hover.country && <b>{pick(hover.country.name)}</b>}
          <div className="muted">{hover.lat.toFixed(2)}°, {hover.lon.toFixed(2)}°</div>
          {hover.val && <div>{pick(hover.layer.title)}: <b>{hover.val.text}</b></div>}
        </div>
      )}
      {s.swipe.enabled && <SwipeHandle />}
      <div className="hint">{t('zoomHint')}</div>
    </div>
  );
}

function SwipeHandle() {
  const swipe = useStore((s) => s.swipe);
  const setSwipe = useStore((s) => s.setSwipe);
  const catalog = useStore((s) => s.catalog);
  const { pick, t } = useT();
  const drag = (e) => {
    const box = e.currentTarget.parentElement.getBoundingClientRect();
    const move = (ev) => setSwipe({ split: Math.min(0.98, Math.max(0.02, (ev.clientX - box.left) / box.width)) });
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    e.preventDefault();
  };
  const L = layerById(catalog, swipe.left?.layer), R = layerById(catalog, swipe.right?.layer);
  const label = (side, layer) => `${pick(layer?.title)} · ${side?.date ?? ''}`;
  return (
    <>
      <div className="swipe-bar" style={{ left: `${swipe.split * 100}%` }} onPointerDown={drag}>
        <div className="swipe-knob" title={t('dragHint')}>⇆</div>
      </div>
      <div className="swipe-label left">{label(swipe.left, L)}</div>
      <div className="swipe-label right">{label(swipe.right, R)}</div>
    </>
  );
}
