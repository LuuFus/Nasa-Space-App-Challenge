import { useEffect, useRef, useState } from 'react';
import { useStore } from '../state/store.js';
import { useT } from '../i18n/index.js';
import { fmtDate, firstDate, lastDate, periodOf, snapDate, stepDate, worldviewUrl } from '../lib/dates.js';
import Legend from './Legend.jsx';
import TrendMaps from './TrendMaps.jsx';
import FrontControls from './FrontControls.jsx';
import { layerById } from './GlobeView.jsx';

const CATS = ['temperature', 'vegetation', 'water', 'fire', 'lights', 'air', 'ozone', 'climate'];

export default function LayersPanel() {
  const { t, pick } = useT();
  const s = useStore();
  const cat = s.catalog;
  if (!cat) return <p className="muted">{t('loading')}</p>;
  const bases = cat.layers.filter((l) => l.cat === 'base');
  const base = layerById(cat, s.baseId);
  const ov = layerById(cat, s.overlayId);
  const choose = (l) => {
    if (l.base) { s.setBase(l.id); s.setOverlay(null); }
    else s.setOverlay(s.overlayId === l.id ? null : l.id);
  };
  return (
    <div className="layers-panel">
      <h3>{t('baseImagery')}</h3>
      <div className="list">
        {bases.map((l) => (
          <label key={l.id} className={s.baseId === l.id ? 'item on' : 'item'}>
            <input type="radio" name="base" checked={s.baseId === l.id} onChange={() => s.setBase(l.id)} />
            {pick(l.title)}
          </label>
        ))}
      </div>
      {base && base.period && <LayerDate layer={base} />}
      {base && <p className="desc">{pick(base.desc)}</p>}

      <h3>{t('dataLayer')}</h3>
      <details open={s.front.on}>
        <summary><span className="ua-badge" /> {t('cat_war')}</summary>
        <FrontControls />
      </details>
      {CATS.map((c) => {
        const items = cat.layers.filter((l) => l.cat === c);
        return (
          <details key={c} open={items.some((l) => l.id === s.overlayId || l.id === s.baseId) || c === 'temperature'}>
            <summary>{t('cat_' + c)}</summary>
            <div className="list">
              {items.map((l) => (
                <button key={l.id} className={(s.overlayId === l.id || (l.base && s.baseId === l.id)) ? 'item on' : 'item'} onClick={() => choose(l)}>
                  {pick(l.title)}
                </button>
              ))}
              {c === 'climate' && <TrendMaps />}
            </div>
          </details>
        );
      })}
      {ov && (
        <div className="active-layer">
          <h4>{pick(ov.title)}</h4>
          <p className="desc">{pick(ov.desc)}</p>
          <LayerDate layer={ov} />
          <label className="row small">{t('opacity')}
            <input type="range" min="0.1" max="1" step="0.05" value={s.overlayOpacity} onChange={(e) => s.setOverlayOpacity(+e.target.value)} />
          </label>
          <Legend layer={ov} />
          <a className="small" href={worldviewUrl(ov, s.dates[ov.id] ?? ov.date)} target="_blank" rel="noreferrer">{t('openWorldview')} ↗</a>
          <p className="muted small">{t('source')}: NASA GIBS · {ov.gibs}</p>
        </div>
      )}
      {ov && <button className="link" onClick={() => s.setOverlay(null)}>✕ {t('none')}</button>}
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
  const type = p === 'P1M' ? 'month' : 'date';
  const value = p === 'P1M' ? date?.slice(0, 7) : date;
  return (
    <div className="date-ctl">
      <div className="row">
        <button onClick={() => setDate(layer.id, stepDate(layer, date, -1))}>{t('prev')}</button>
        <input type={p === 'P1Y' ? 'number' : type} value={p === 'P1Y' ? date?.slice(0, 4) : value}
          min={p === 'P1Y' ? firstDate(layer)?.slice(0, 4) : type === 'month' ? firstDate(layer)?.slice(0, 7) : firstDate(layer)}
          max={p === 'P1Y' ? lastDate(layer)?.slice(0, 4) : type === 'month' ? lastDate(layer)?.slice(0, 7) : lastDate(layer)}
          onChange={(e) => {
            const v = e.target.value;
            if (!v) return;
            const d = p === 'P1Y' ? `${v}-${(layer.date || '2000-01-01').slice(5)}` : type === 'month' ? v + '-01' : v;
            setDate(layer.id, snapDate(layer, d));
          }} />
        <button onClick={() => setDate(layer.id, stepDate(layer, date, 1))}>{t('next')}</button>
        <button onClick={() => setPlaying(!playing)}>{playing ? t('stop') : t('play')}</button>
      </div>
      <div className="muted small">{fmtDate(layer, date, lang)} · {firstDate(layer)?.slice(0, 4)}–{lastDate(layer)?.slice(0, 4)}</div>
    </div>
  );
}
