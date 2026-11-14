import { useStore } from '../state/store.js';
import { useT } from '../i18n/index.js';
import { EVENTS } from '../content/events.js';
import { applyEvent, clearSwipe } from '../lib/actions.js';
import { fmtDate, firstDate, lastDate, periodOf, snapDate, stepDate } from '../lib/dates.js';
import { layerById } from './GlobeView.jsx';

export default function SwipePanel() {
  const { t, pick, lang } = useT();
  const s = useStore();
  const cat = s.catalog;
  if (!cat) return <p className="muted">{t('loading')}</p>;
  const sw = s.swipe;
  const presets = EVENTS.filter((e) => e.swipe);
  const layers = cat.layers.filter((l) => !l.overlayOnly);
  const defaults = {
    left: sw.left || { layer: 'landsat_weld', date: '1985-12-01' },
    right: sw.right || { layer: 'truecolor_modis', date: '2025-08-15' },
  };
  const update = (side, patch) => s.setSwipe({ enabled: true, ...defaults, [side]: { ...defaults[side], ...patch } });
  return (
    <div>
      <h3>{t('swipeTitle')}</h3>
      <p className="desc">{lang === 'uk'
        ? 'Екран ділиться навпіл: ліворуч — як було, праворуч — як стало. Тягни білий повзунок і дивись, як змінилося місце.'
        : 'The screen is split in two: the past on the left, the present on the right. Drag the white slider to see how the place changed.'}</p>
      <div className="row">
        {sw.enabled
          ? <button onClick={clearSwipe}>✕ {t('turnOff')}</button>
          : <button className="primary" onClick={() => s.setSwipe({ enabled: true, ...defaults })}>{t('turnOn')}</button>}
      </div>
      {['left', 'right'].map((side) => {
        const cur = defaults[side];
        const layer = layerById(cat, cur.layer);
        const p = periodOf(layer);
        return (
          <div key={side} className="active-layer">
            <b>{t(side)}</b>
            <select value={cur.layer} onChange={(e) => {
              const l = layerById(cat, e.target.value);
              update(side, { layer: l.id, date: snapDate(l, cur.date) || l.date });
            }} style={{ width: '100%', margin: '4px 0' }}>
              {layers.map((l) => <option key={l.id} value={l.id}>{pick(l.title)}</option>)}
            </select>
            {p && (
              <div className="row">
                <button onClick={() => update(side, { date: stepDate(layer, cur.date, -1) })}>◀</button>
                <input type="date" value={cur.date || ''} min={firstDate(layer)} max={lastDate(layer)}
                  onChange={(e) => e.target.value && update(side, { date: snapDate(layer, e.target.value) })} />
                <button onClick={() => update(side, { date: stepDate(layer, cur.date, 1) })}>▶</button>
                <span className="muted small">{fmtDate(layer, cur.date, lang)}</span>
              </div>
            )}
          </div>
        );
      })}
      <h3>{t('presets')}</h3>
      {presets.map((ev) => (
        <div key={ev.id} className={sw.preset === ev.id ? 'event-card on' : 'event-card'}>
          <b>{pick(ev.title)}</b>
          <div className="muted small">{ev.swipe.left.date.slice(0, 4)} → {ev.swipe.right.date.slice(0, 4)}</div>
          <div className="row small">
            <button className="primary" onClick={() => applyEvent(ev)}>⇆ {t('showBeforeAfter')}</button>
            <a href={ev.source.url} target="_blank" rel="noreferrer">{t('source')} ↗</a>
          </div>
        </div>
      ))}
    </div>
  );
}
