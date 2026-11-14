import { useEffect, useState } from 'react';
import { useStore } from '../state/store.js';
import { useT } from '../i18n/index.js';
import { EVENTS, EVENT_CATS } from '../content/events.js';
import { closeEvent, clearSwipe } from '../lib/actions.js';
import { fmtDate } from '../lib/dates.js';
import { loadJSON } from '../lib/data.js';
import { layerById } from './GlobeView.jsx';

function longDate(date, lang, monthOnly = false) {
  if (!date) return '';
  const d = new Date(date + 'T00:00:00Z');
  return d.toLocaleDateString(lang === 'uk' ? 'uk-UA' : 'en-GB', monthOnly
    ? { month: 'long', year: 'numeric', timeZone: 'UTC' }
    : { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** Everything drawn over the map: active-layer chips with ✕, the event banner, the before/after slider. */
export default function MapOverlay() {
  const { t, pick, lang } = useT();
  const s = useStore();
  const [front, setFront] = useState(null);
  useEffect(() => { if (s.front.on && !front) loadJSON('front.json').then(setFront); }, [s.front.on]);
  const ov = layerById(s.catalog, s.overlayId);
  const base = layerById(s.catalog, s.baseId);
  const ev = EVENTS.find((e) => e.id === s.eventId && s.eventApplied);
  const snaps = front?.snapshots;
  const fIdx = snaps ? (s.front.idx ?? snaps.length - 1) : null;
  return (
    <>
      <div className="map-chips">
        {base && base.period && !s.swipe.enabled && (
          <div className="chip-map">🛰 {pick(base.title)} · <b>{fmtDate(base, s.dates[base.id] ?? base.date, lang)}</b>
            {base.id !== 'bluemarble' && <button title={t('none')} onClick={() => s.setBase('bluemarble')}>✕</button>}
          </div>
        )}
        {ov && (
          <div className="chip-map">🗺 {pick(ov.title)}{ov.period && <> · <b>{fmtDate(ov, s.dates[ov.id] ?? ov.date, lang)}</b></>}
            <button title={t('none')} onClick={() => s.setOverlay(null)}>✕</button>
          </div>
        )}
        {s.trendMap && (
          <div className="chip-map">📊 {lang === 'uk' ? 'Карта трендів' : 'Trend map'}{s.trendMap.year && s.trendMap.id.includes('anom') ? <> · <b>{s.trendMap.year}</b></> : null}
            <button onClick={() => s.setTrendMap(null)}>✕</button>
          </div>
        )}
        {s.front.on && snaps && (
          <div className="chip-map front">⚠ {lang === 'uk' ? 'Лінія фронту' : 'Front line'} ·
            <button onClick={() => s.setFront({ idx: Math.max(0, fIdx - 1) })}>◀</button>
            <b>{longDate(snaps[fIdx].date, lang, fIdx !== snaps.length - 1)}</b>
            <button onClick={() => s.setFront({ idx: Math.min(snaps.length - 1, fIdx + 1) })}>▶</button>
            <button onClick={() => s.setFront({ on: false, compare: null })}>✕</button>
          </div>
        )}
      </div>

      {ev && (
        <div className="event-banner">
          <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
            <b>{EVENT_CATS[ev.cat].icon} {pick(ev.title)}</b>
            <button onClick={() => closeEvent()} title={lang === 'uk' ? 'Закрити подію' : 'Close event'}>✕ {lang === 'uk' ? 'Закрити' : 'Close'}</button>
          </div>
          {ev.see && <p><b>{lang === 'uk' ? 'Що ти бачиш: ' : 'What you see: '}</b>{pick(ev.see)}</p>}
          {s.front.on && <FrontLegend lang={lang} compare={s.front.compare != null && snaps ? snaps[s.front.compare].date : null} />}
        </div>
      )}
      {!ev && s.front.on && <div className="event-banner small-banner"><FrontLegend lang={lang} compare={s.front.compare != null && snaps ? snaps[s.front.compare].date : null} /></div>}

      {s.swipe.enabled && <Swipe />}
    </>
  );
}

function FrontLegend({ lang, compare }) {
  const items = [
    ['rgba(230,40,40,0.6)', lang === 'uk' ? 'окуповано з 2022' : 'occupied since 2022', true],
    ['rgba(120,10,30,0.7)', lang === 'uk' ? 'окуповано з 2014' : 'occupied since 2014', true],
    ['rgba(160,150,140,0.8)', lang === 'uk' ? 'сіра зона' : 'grey zone'],
    ['rgba(30,160,90,0.6)', lang === 'uk' ? 'звільнено' : 'liberated'],
  ];
  return (
    <div className="front-legend">
      {items.map(([c, l, h]) => <span key={l}><i style={{ background: c }} className={h ? 'hatched' : ''} />{l}</span>)}
      {compare && <span><i className="dashed" />{lang === 'uk' ? `фронт ${longDate(compare, lang)}` : `front on ${longDate(compare, lang)}`}</span>}
      <span className="muted">© DeepStateMap</span>
    </div>
  );
}

function Swipe() {
  const swipe = useStore((st) => st.swipe);
  const setSwipe = useStore((st) => st.setSwipe);
  const catalog = useStore((st) => st.catalog);
  const { pick, t, lang } = useT();
  const drag = (e) => {
    const box = e.currentTarget.parentElement.getBoundingClientRect();
    const move = (ev) => setSwipe({ split: Math.min(0.98, Math.max(0.02, (ev.clientX - box.left) / box.width)) });
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    e.preventDefault();
  };
  const L = layerById(catalog, swipe.left?.layer), R = layerById(catalog, swipe.right?.layer);
  const pct = `${swipe.split * 100}%`;
  return (
    <>
      <div className="swipe-bar" style={{ left: pct }} onPointerDown={drag}>
        <div className="swipe-knob" title={t('dragHint')}>⇆</div>
      </div>
      <div className="swipe-date left" style={{ right: `calc(${100 - swipe.split * 100}% + 14px)` }}>
        <div className="big">◀ {fmtDate(L, swipe.left?.date, lang)}</div>
        <div className="small">{pick(L?.title)}</div>
      </div>
      <div className="swipe-date right" style={{ left: `calc(${pct} + 14px)` }}>
        <div className="big">{fmtDate(R, swipe.right?.date, lang)} ▶</div>
        <div className="small">{pick(R?.title)}</div>
      </div>
      <button className="swipe-exit" onClick={clearSwipe}>✕ {t('turnOff')}</button>
    </>
  );
}
