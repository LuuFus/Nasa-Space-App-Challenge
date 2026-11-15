import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, Pause, Play, X, Moon, TriangleAlert } from 'lucide-react';
import { useStore } from '../state/store.js';
import { showNight } from '../lib/actions.js';
import { activeHotspots } from '../content/hotspots.js';
import { useT } from '../i18n/index.js';
import { fmtDate, firstDate, lastDate, periodOf, snapDate, stepDate, worldviewUrl } from '../lib/dates.js';
import Legend from './Legend.jsx';
import TrendMaps from './TrendMaps.jsx';
import FrontControls from './FrontControls.jsx';
import { layerById } from './GlobeView.jsx';
import { DATA_ICONS, STROKE } from './Icons.jsx';

const CATS = ['temperature', 'vegetation', 'water', 'fire', 'lights', 'air', 'ozone', 'climate'];

/** "Blue Marble (relief)" -> ["Blue Marble", "relief"] */
const splitTitle = (s) => {
  const i = s.lastIndexOf(' (');
  return i > 0 && s.endsWith(')') ? [s.slice(0, i), s.slice(i + 2, -1)] : [s, ''];
};

export default function LayersPanel() {
  const { t, pick, lang } = useT();
  const s = useStore();
  const cat = s.catalog;
  if (!cat) return <p className="muted">{t('loading')}</p>;
  const uk = lang === 'uk';
  const bases = cat.layers.filter((l) => l.cat === 'base');
  const base = layerById(cat, s.baseId);
  const ov = layerById(cat, s.overlayId);
  const choose = (l) => {
    if (l.base) { s.setBase(l.id); s.setOverlay(null); }
    else s.setOverlay(s.overlayId === l.id ? null : l.id);
  };
  return (
    <div className="layers-panel">
      {/* 1. base map */}
      <section className="block">
        <h3 className="block-title"><span className="block-num mono">01</span>{uk ? 'Базова підкладка' : 'Base map'}</h3>
        <div className="radio-cards" role="radiogroup" aria-label={t('baseImagery')}>
          {bases.map((l) => {
            const [main, sub] = splitTitle(pick(l.title));
            return (
              <label key={l.id} className={s.baseId === l.id ? 'rcard on' : 'rcard'}>
                <input type="radio" name="base" checked={s.baseId === l.id} onChange={() => { s.setBase(l.id); }} />
                <span className="rcard-title">{main}</span>
                {sub && <span className="rcard-sub mono">{sub}</span>}
              </label>
            );
          })}
        </div>
        {base && <p className="desc">{pick(base.desc)}</p>}
        {base && base.period && <LayerDate layer={base} />}
      </section>

      {/* 2. special monitoring */}
      <section className="block">
        <h3 className="block-title"><span className="block-num mono">02</span>{uk ? 'Спеціальний моніторинг' : 'Special monitoring'}</h3>
        <FrontControls />
      </section>

      {/* 3. science data layers */}
      <section className="block">
        <h3 className="block-title"><span className="block-num mono">03</span>{uk ? 'Наукові шари даних' : 'Science data layers'}</h3>
        <div className="acc-list">
          {CATS.map((c) => {
            const items = cat.layers.filter((l) => l.cat === c);
            const I = DATA_ICONS[c];
            const active = items.some((l) => l.id === s.overlayId);
            return (
              <details key={c} className="acc" open={active || undefined}>
                <summary>
                  {I && <I size={17} strokeWidth={STROKE} className="acc-icon" />}
                  <span>{t('cat_' + c)}</span>
                  {active && <span className="acc-dot" aria-label={uk ? 'увімкнено' : 'on'} />}
                  <span className="acc-count mono">{items.length || ''}</span>
                  <ChevronRight size={16} strokeWidth={STROKE} className="chev" />
                </summary>
                <div className="acc-body">
                  {items.map((l) => {
                    const on = s.overlayId === l.id || (l.base && s.baseId === l.id);
                    return (
                      <button key={l.id} type="button" className={on ? 'layer-row on' : 'layer-row'} aria-pressed={on} onClick={() => choose(l)}>
                        {pick(l.title)}
                      </button>
                    );
                  })}
                  {c === 'climate' && <TrendMaps />}
                  {c === 'lights' && (
                    <button type="button" className={s.baseId === 'nightlights' ? 'night-btn on' : 'night-btn'} onClick={showNight}>
                      <Moon size={18} strokeWidth={STROKE} />
                      <span>
                        <b>{uk ? 'Подивитися на Землю вночі' : 'See the Earth at night'}</b>
                        <small>{uk ? 'Уся планета у світлі міст: видно, де живуть люди, де газові факели, а де темрява.' : 'The whole planet in city lights: where people live, where gas flares burn and where it is dark.'}</small>
                      </span>
                    </button>
                  )}
                </div>
              </details>
            );
          })}
        </div>
      </section>

      {ov && (
        <section className="card active-layer">
          <div className="card-head">
            <h4>{pick(ov.title)}</h4>
            <button type="button" className="icon-btn" onClick={() => s.setOverlay(null)} title={uk ? 'Вимкнути шар' : 'Turn the layer off'}>
              <X size={15} strokeWidth={STROKE} />
            </button>
          </div>
          <p className="desc">{pick(ov.desc)}</p>
          {(() => {
            const n = activeHotspots(ov.id, null).length;
            return n > 0 && s.toggles.hotspots && (
              <p className="hs-hint"><TriangleAlert size={14} strokeWidth={STROKE} /> {uk
                ? `На карті ${n} ${n === 1 ? 'значок' : n < 5 ? 'значки' : 'значків'} — місця, де з цим шаром щось незвичне. Наведи на значок: там пояснення, фото й графік.`
                : `${n} sign${n === 1 ? '' : 's'} on the map mark places where this layer shows something unusual. Point at a sign for an explanation, a photo and a chart.`}</p>
            );
          })()}
          <LayerDate layer={ov} />
          <label className="row small">{t('opacity')}
            <input type="range" min="0.1" max="1" step="0.05" value={s.overlayOpacity} onChange={(e) => s.setOverlayOpacity(+e.target.value)} />
            <span className="mono">{Math.round(s.overlayOpacity * 100)}%</span>
          </label>
          <Legend layer={ov} />
          <div className="card-foot">
            <a className="ext" href={worldviewUrl(ov, s.dates[ov.id] ?? ov.date)} target="_blank" rel="noreferrer">{t('openWorldview')} <ExternalLink size={12} strokeWidth={STROKE} /></a>
            <span className="muted small">NASA GIBS · <span className="mono">{ov.gibs}</span></span>
          </div>
        </section>
      )}
    </div>
  );
}

/** date picker + previous / next + simple animation through time */
export function LayerDate({ layer }) {
  const { t, lang } = useT();
  const dates = useStore((s) => s.dates);
  const setDate = useStore((s) => s.setDate);
  const date = dates[layer.id] ?? layer.date;
  const [playing, setPlaying] = useState(false);
  const timer = useRef(null);
  const p = periodOf(layer);
  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => {
      const cur = useStore.getState().dates[layer.id] ?? layer.date;
      const nx = stepDate(layer, cur, p === 'P1D' ? 30 : 1);
      if (nx === cur) { setPlaying(false); return; }
      setDate(layer.id, nx);
    }, 1600);
    return () => clearInterval(timer.current);
  }, [playing, layer.id]);
  if (!p) return null;
  const uk = lang === 'uk';
  const type = p === 'P1M' ? 'month' : 'date';
  const value = p === 'P1M' ? date?.slice(0, 7) : date;
  return (
    <div className="date-ctl">
      <div className="date-row">
        <button type="button" className="icon-btn" onClick={() => setDate(layer.id, stepDate(layer, date, -1))} title={uk ? 'Назад' : 'Back'}><ChevronLeft size={16} strokeWidth={STROKE} /></button>
        <input className="mono" type={p === 'P1Y' ? 'number' : type} value={p === 'P1Y' ? date?.slice(0, 4) : value}
          aria-label={t('date')}
          min={p === 'P1Y' ? firstDate(layer)?.slice(0, 4) : type === 'month' ? firstDate(layer)?.slice(0, 7) : firstDate(layer)}
          max={p === 'P1Y' ? lastDate(layer)?.slice(0, 4) : type === 'month' ? lastDate(layer)?.slice(0, 7) : lastDate(layer)}
          onChange={(e) => {
            const v = e.target.value;
            if (!v) return;
            const d = p === 'P1Y' ? `${v}-${(layer.date || '2000-01-01').slice(5)}` : type === 'month' ? v + '-01' : v;
            setDate(layer.id, snapDate(layer, d));
          }} />
        <button type="button" className="icon-btn" onClick={() => setDate(layer.id, stepDate(layer, date, 1))} title={uk ? 'Далі' : 'Next'}><ChevronRight size={16} strokeWidth={STROKE} /></button>
        <button type="button" className={playing ? 'icon-btn on' : 'icon-btn'} onClick={() => setPlaying(!playing)} title={playing ? (uk ? 'Зупинити' : 'Stop') : (uk ? 'Анімація в часі' : 'Animate through time')}>
          {playing ? <Pause size={15} strokeWidth={STROKE} /> : <Play size={15} strokeWidth={STROKE} />}
        </button>
      </div>
      <div className="muted small">{fmtDate(layer, date, lang)} · <span className="mono">{firstDate(layer)?.slice(0, 4)}–{lastDate(layer)?.slice(0, 4)}</span></div>
    </div>
  );
}
