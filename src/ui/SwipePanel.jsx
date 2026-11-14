import { ChevronLeft, ChevronRight, Power, SplitSquareHorizontal } from 'lucide-react';
import { useStore } from '../state/store.js';
import { useT } from '../i18n/index.js';
import { EVENTS } from '../content/events.js';
import { clearSwipe } from '../lib/actions.js';
import { fmtDate, firstDate, lastDate, periodOf, snapDate, stepDate } from '../lib/dates.js';
import { layerById } from './GlobeView.jsx';
import { STROKE } from './Icons.jsx';
import { EventCard } from './EventsPanel.jsx';

/** 1985 → 2025, or 02.2026 → 04.2026 when both pictures are from the same year */
const span = (a, b) => (a.slice(0, 4) === b.slice(0, 4)
  ? `${a.slice(5, 7)}.${a.slice(0, 4)} → ${b.slice(5, 7)}.${b.slice(0, 4)}`
  : `${a.slice(0, 4)} → ${b.slice(0, 4)}`);

export default function SwipePanel() {
  const { t, pick, lang } = useT();
  const s = useStore();
  const cat = s.catalog;
  if (!cat) return <p className="muted">{t('loading')}</p>;
  const uk = lang === 'uk';
  const sw = s.swipe;
  const presets = EVENTS.filter((e) => e.swipe);
  const layers = cat.layers.filter((l) => !l.overlayOnly);
  const defaults = {
    left: sw.left || { layer: 'landsat_weld', date: '1985-12-01' },
    right: sw.right || { layer: 'truecolor_modis', date: '2025-08-15' },
  };
  const update = (side, patch) => s.setSwipe({ enabled: true, ...defaults, [side]: { ...defaults[side], ...patch } });
  return (
    <div className="swipe-panel">
      <p className="desc">{uk
        ? 'Екран ділиться навпіл: ліворуч — як було, праворуч — як стало. Тягни повзунок на карті й дивись, як змінилося місце.'
        : 'The screen is split in two: the past on the left, the present on the right. Drag the slider on the map to see how the place changed.'}</p>

      <div className={sw.enabled ? 'swipe-status on' : 'swipe-status'}>
        {sw.enabled ? (
          <>
            <span className="status-pill"><span className="live-dot" />{uk ? 'Активно' : 'Active'}</span>
            <button type="button" className="btn-ghost" onClick={clearSwipe}><Power size={15} strokeWidth={STROKE} /> {uk ? 'Вимкнути' : 'Turn off'}</button>
          </>
        ) : (
          <button type="button" className="btn-accent" onClick={() => s.setSwipe({ enabled: true, ...defaults })}>
            <SplitSquareHorizontal size={16} strokeWidth={STROKE} /> {uk ? 'Увімкнути порівняння' : 'Turn the comparison on'}
          </button>
        )}
      </div>

      <div className="duo">
        {['left', 'right'].map((side) => {
          const cur = defaults[side];
          const layer = layerById(cat, cur.layer);
          const p = periodOf(layer);
          return (
            <div key={side} className={`side-card side-${side}`}>
              <div className="side-label">{t(side)}</div>
              <select value={cur.layer} aria-label={`${t(side)} — ${t('layer')}`} onChange={(e) => {
                const l = layerById(cat, e.target.value);
                update(side, { layer: l.id, date: snapDate(l, cur.date) || l.date });
              }}>
                {layers.map((l) => <option key={l.id} value={l.id}>{pick(l.title)}</option>)}
              </select>
              {p ? (
                <>
                  <div className="side-date mono">{fmtDate(layer, cur.date, lang)}</div>
                  <div className="date-row">
                    <button type="button" className="icon-btn" onClick={() => update(side, { date: stepDate(layer, cur.date, -1) })} title={uk ? 'Раніше' : 'Earlier'}><ChevronLeft size={15} strokeWidth={STROKE} /></button>
                    <input className="mono" type="date" value={cur.date || ''} min={firstDate(layer)} max={lastDate(layer)} aria-label={`${t(side)} — ${t('date')}`}
                      onChange={(e) => e.target.value && update(side, { date: snapDate(layer, e.target.value) })} />
                    <button type="button" className="icon-btn" onClick={() => update(side, { date: stepDate(layer, cur.date, 1) })} title={uk ? 'Пізніше' : 'Later'}><ChevronRight size={15} strokeWidth={STROKE} /></button>
                  </div>
                </>
              ) : <div className="side-date muted small">{uk ? 'знімок без дати' : 'undated mosaic'}</div>}
            </div>
          );
        })}
      </div>

      <h3 className="section-title">{t('presets')}</h3>
      {presets.map((ev) => (
        <EventCard key={ev.id} ev={ev} active={sw.preset === ev.id}
          dateText={span(ev.swipe.left.date, ev.swipe.right.date)} />
      ))}
    </div>
  );
}
