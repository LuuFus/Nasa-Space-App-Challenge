import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createElement as lucideSvg, AlertTriangle, AlertCircle, Lightbulb, Sprout } from 'lucide';
import { Factory, Leaf, MapPin, Pin, Users, X } from 'lucide-react';
import { useStore } from '../state/store.js';
import { useT } from '../i18n/index.js';
import { dataUrl, loadJSON } from '../lib/data.js';
import { analyse } from '../lib/stats.js';
import { num } from '../lib/explain.js';
import { flyTo } from '../lib/actions.js';
import { HOTSPOTS, KINDS, LEVELS } from '../content/hotspots.js';
import { STROKE } from './Icons.jsx';
import Chart from './Chart.jsx';

// Signs of anomalies right on the map (3D globe and OSM map) and the card that
// opens when you point at one. The card can be scrolled; a click on the sign
// pins it, so it stays while you read.

const LEVEL_ICON = { danger: AlertTriangle, warn: AlertCircle, info: Lightbulb, good: Sprout };

/** small trusted SVG for a sign (made by our own code, not user input) */
export function hotspotHtml(level) {
  return lucideSvg(LEVEL_ICON[level] || Lightbulb, { width: 15, height: 15, 'stroke-width': 2 }).outerHTML;
}

// ---------------------------------------------------------------- hover logic
let closeTimer = null;

function place(el) {
  const wrap = el.closest('.globe-wrap');
  if (!wrap) return null;
  const r = el.getBoundingClientRect(), w = wrap.getBoundingClientRect();
  return { x: r.left + r.width / 2 - w.left, y: r.top + r.height / 2 - w.top };
}

/** the pointer came onto a sign */
export function enterHotspot(id, el) {
  clearTimeout(closeTimer);
  const cur = useStore.getState().hotspot;
  if (cur?.pinned && cur.id !== id) return;          // a pinned card stays until it is closed
  const p = place(el);
  if (!p) return;
  if (cur?.id === id) return;
  useStore.setState({ hotspot: { id, ...p, pinned: false } });
}

/** the pointer left a sign or the card: close a little later (time to move onto the card) */
export function leaveHotspot() {
  clearTimeout(closeTimer);
  closeTimer = setTimeout(() => {
    // still pointing at the card or at a sign: keep it (its own "leave" will come later)
    if (document.querySelector('.hs-card:hover, .lbl-hotspot:hover')) return;
    const h = useStore.getState().hotspot;
    if (h && !h.pinned) useStore.setState({ hotspot: null });
  }, 450);
}

/** a click pins the card */
export function pinHotspot(id, el) {
  clearTimeout(closeTimer);
  const p = place(el);
  const cur = useStore.getState().hotspot;
  if (cur?.id === id && cur.pinned) { useStore.setState({ hotspot: null }); return; }
  useStore.setState({ hotspot: { id, ...(p || { x: cur?.x ?? 100, y: cur?.y ?? 100 }), pinned: true } });
}

// ---------------------------------------------------------------- the card
const PHOTO_SOURCE = {
  MODIS_Terra_CorrectedReflectance_TrueColor: { uk: 'супутник Terra (MODIS), справжні кольори', en: 'Terra satellite (MODIS), true colour' },
  MODIS_Aqua_CorrectedReflectance_TrueColor: { uk: 'супутник Aqua (MODIS), справжні кольори', en: 'Aqua satellite (MODIS), true colour' },
  VIIRS_SNPP_CorrectedReflectance_TrueColor: { uk: 'супутник Suomi NPP (VIIRS), справжні кольори', en: 'Suomi NPP satellite (VIIRS), true colour' },
  VIIRS_Black_Marble: { uk: 'Suomi NPP (VIIRS), «Чорна куля» 2016', en: 'Suomi NPP (VIIRS), Black Marble 2016' },
  OMI_Ozone_TOMS_Total_Column: { uk: 'супутник Aura (OMI): озон', en: 'Aura satellite (OMI): ozone' },
};
const fmtDay = (d, lang) => new Date(d + 'T00:00:00Z').toLocaleDateString(lang === 'uk' ? 'uk-UA' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

function SeriesChart({ s, lang }) {
  const uk = lang === 'uk';
  const res = useMemo(() => (s.years.length >= 8 ? analyse(s.years, s.values) : null), [s]);
  const unit = s.unit[lang];
  const option = useMemo(() => {
    const line = res?.line;
    return {
      backgroundColor: 'transparent', animation: false,
      grid: { left: 42, right: 10, top: 14, bottom: 22 },
      tooltip: { trigger: 'axis', valueFormatter: (v) => (v == null ? '—' : `${num(v, Math.abs(v) < 10 ? 2 : 0, lang)} ${unit}`) },
      xAxis: { type: 'category', data: s.years, axisLabel: { fontSize: 9, color: '#94a3b8' }, axisTick: { show: false } },
      yAxis: { type: 'value', scale: true, axisLabel: { fontSize: 9, color: '#94a3b8' }, splitLine: { lineStyle: { color: 'rgba(148,163,184,0.12)' } } },
      series: [
        { name: s.label[lang], type: 'line', data: s.values, symbolSize: 4, lineStyle: { width: 2, color: '#38bdf8' }, itemStyle: { color: '#38bdf8' } },
        line && { name: uk ? 'Тренд (Сен)' : 'Trend (Sen)', type: 'line', symbol: 'none', data: s.years.map((y) => +(line.a + line.beta * y).toFixed(4)),
          lineStyle: { type: 'dashed', width: 1.5, color: res.significant ? '#f59e0b' : '#94a3b8' } },
      ].filter(Boolean),
    };
  }, [s, res, lang]);
  return (
    <div className="hs-chart">
      <div className="hs-chart-title">{s.label[lang]}, {unit}</div>
      <Chart option={option} height={150} />
      {res && (
        <p className="hs-trend">
          {uk ? 'Тренд: ' : 'Trend: '}
          <b className="mono">{res.perDecade > 0 ? '+' : ''}{num(res.perDecade, Math.abs(res.perDecade) < 1 ? 3 : 1, lang)} {unit}</b>
          {uk ? ' за 10 років' : ' per decade'} · {res.significant
            ? <span className="hs-sig">{uk ? 'справжній (p < 0,05)' : 'real (p < 0.05)'}</span>
            : <span className="muted">{uk ? 'може бути випадковим' : 'may be random'}</span>}
          {' '}— {uk ? 'нахил Сена й тест Манна–Кендалла.' : 'Sen’s slope and the Mann–Kendall test.'}
        </p>
      )}
    </div>
  );
}

export function HotspotCard() {
  const h = useStore((s) => s.hotspot);
  const catalog = useStore((s) => s.catalog);
  const { lang, pick } = useT();
  const uk = lang === 'uk';
  const [data, setData] = useState(null);
  const ref = useRef(null);
  const [pos, setPos] = useState(null);
  useEffect(() => { if (h && !data) loadJSON('hotspots.json').then(setData).catch(() => setData({})); }, [h, data]);
  useEffect(() => {
    if (!h) return;
    const esc = (e) => e.key === 'Escape' && useStore.setState({ hotspot: null });
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [h]);
  // next to the sign, inside the map, never under the screen edge
  useLayoutEffect(() => {
    const el = ref.current;
    if (!h || !el) { setPos(null); return; }
    const wrap = el.parentElement.getBoundingClientRect();
    const W = el.offsetWidth, H = el.offsetHeight;
    let left = h.x + 24;
    if (left + W > wrap.width - 8) left = h.x - 24 - W;
    left = Math.max(8, left);
    const top = Math.max(8, Math.min(wrap.height - H - 8, h.y - 70));
    setPos({ left, top });
  }, [h?.id, h?.x, h?.y, data]);
  if (!h) return null;
  const spot = HOTSPOTS.find((x) => x.id === h.id);
  if (!spot) return null;
  const extra = data?.[spot.id] || {};
  const showOnMap = () => {
    const st = useStore.getState();
    const layer = st.catalog?.layers.find((l) => l.id === spot.show.layer);
    if (layer) {
      if (layer.base) st.setBase(layer.id); else st.setOverlay(layer.id);
      if (spot.show.date && layer.period) st.setDate(layer.id, spot.show.date);
    }
    flyTo(spot.lon, spot.lat, spot.alt);
    useStore.setState({ hotspot: { ...h, pinned: true } });
  };
  const KindIcon = spot.kind === 'nature' ? Leaf : spot.kind === 'human' ? Factory : Users;
  const showLayer = catalog?.layers.find((l) => l.id === spot.show.layer);
  return (
    <aside ref={ref} className={`hs-card glass lvl-${spot.level}${h.pinned ? ' pinned' : ''}`} style={pos ? { left: pos.left, top: pos.top } : { left: -9999, top: 0 }}
      onPointerEnter={() => clearTimeout(closeTimer)} onPointerLeave={leaveHotspot} onWheel={(e) => e.stopPropagation()}
      role="dialog" aria-label={pick(spot.title)}>
      <header className="hs-head">
        <div className="hs-tags">
          <span className={`hs-level lvl-${spot.level}`}>{pick(LEVELS[spot.level])}</span>
          <span className="hs-kind"><KindIcon size={13} strokeWidth={STROKE} /> {pick(KINDS[spot.kind])}</span>
        </div>
        <div className="hs-btns">
          <button type="button" className={h.pinned ? 'icon-btn on' : 'icon-btn'} title={h.pinned ? (uk ? 'Відкріпити' : 'Unpin') : (uk ? 'Закріпити вікно' : 'Pin the card')}
            onClick={() => useStore.setState({ hotspot: { ...h, pinned: !h.pinned } })}><Pin size={14} strokeWidth={STROKE} /></button>
          <button type="button" className="icon-btn" onClick={() => useStore.setState({ hotspot: null })} aria-label={uk ? 'Закрити' : 'Close'}><X size={15} strokeWidth={STROKE} /></button>
        </div>
      </header>
      <div className="hs-body">
        <h3>{pick(spot.title)}</h3>
        <p className="hs-lead">{pick(spot.lead)}</p>
        {extra.photo && (
          <figure className="hs-photo">
            <img src={dataUrl(extra.photo.file)} alt={pick(spot.title)} loading="lazy" />
            <figcaption>{extra.photo.layer === 'VIIRS_Black_Marble' ? '2016' : fmtDay(extra.photo.date, lang)} · {pick(PHOTO_SOURCE[extra.photo.layer] || { uk: 'NASA', en: 'NASA' })} · NASA Worldview</figcaption>
          </figure>
        )}
        {extra.series?.years?.length > 2 && <SeriesChart s={extra.series} lang={lang} />}
        {spot.sections.map((s) => (
          <section key={s.h.en} className="hs-sec">
            <h4>{pick(s.h)}</h4>
            <p>{pick(s.t)}</p>
          </section>
        ))}
        <div className="hs-actions">
          <button type="button" className="btn-accent" onClick={showOnMap}>
            <MapPin size={14} strokeWidth={STROKE} /> {uk ? 'Показати на карті' : 'Show on the map'}
            {showLayer && <small>{pick(showLayer.title)}{spot.show.date && showLayer.period ? ` · ${spot.show.date}` : ''}</small>}
          </button>
        </div>
        {spot.links?.length > 0 && (
          <p className="hs-links">{uk ? 'Докладніше: ' : 'More: '}{spot.links.map(([t, u], i) => <span key={u}>{i ? ' · ' : ''}<a href={u} target="_blank" rel="noreferrer">{t}</a></span>)}</p>
        )}
      </div>
    </aside>
  );
}
