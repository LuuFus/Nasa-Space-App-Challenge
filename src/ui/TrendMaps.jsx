import { useEffect, useRef, useState } from 'react';
import { useStore } from '../state/store.js';
import { useT } from '../i18n/index.js';
import { dataUrl, loadJSON } from '../lib/data.js';
import { num } from '../lib/explain.js';
import { suggestContourMap } from './ConsentPrompt.jsx';

let metaCache = null;
const loadMeta = () => (metaCache ||= loadJSON('trends/trends.json').catch(() => []));

/** switch on one of our computed maps (trend or yearly anomaly) */
export async function showTrendMap(id, year) {
  const meta = await loadMeta();
  const m = meta.find((x) => x.id === id);
  if (!m) return;
  const y = year ?? m.years[1];
  const url = dataUrl(m.url.replace('{year}', y));
  useStore.getState().setTrendMap({ id, year: y, url, opacity: 0.9 });
}

const REASON = {
  uk: 'Карта трендів показує зміни на всій планеті одразу — на контурній карті це видно найкраще.',
  en: 'A trend map shows changes over the whole planet at once — it reads best on the contour map.',
};

export default function TrendMaps() {
  const { t, pick, lang } = useT();
  const trend = useStore((s) => s.trendMap);
  const setTrendMap = useStore((s) => s.setTrendMap);
  const [meta, setMeta] = useState([]);
  const [playing, setPlaying] = useState(false);
  const timer = useRef(null);
  useEffect(() => { loadMeta().then(setMeta); }, []);
  const active = meta.find((m) => m.id === trend?.id);
  useEffect(() => {
    if (!playing || !active || active.kind !== 'anomaly') return;
    timer.current = setInterval(() => {
      const cur = useStore.getState().trendMap?.year ?? active.years[0];
      const nx = cur >= active.years[1] ? active.years[0] : cur + 1;
      showTrendMap(active.id, nx);
    }, 900);
    return () => clearInterval(timer.current);
  }, [playing, active?.id]);
  if (!meta.length) return null;
  const pick2 = (m) => suggestContourMap(REASON, () => showTrendMap(m.id));
  const [neg, mid, pos] = active?.palette || [[0, 0, 255], [255, 255, 255], [255, 0, 0]];
  const rgb = (c) => `rgb(${c.join(',')})`;
  return (
    <div className="trend-maps">
      <div className="muted small" style={{ marginTop: 6 }}>{lang === 'uk' ? 'Розраховано нашими скриптами з даних NASA:' : 'Computed by our scripts from NASA data:'}</div>
      {meta.map((m) => (
        <button key={m.id} className={trend?.id === m.id ? 'item on' : 'item'} onClick={() => (trend?.id === m.id ? setTrendMap(null) : pick2(m))}>
          📊 {pick(m.title)} ({m.years[0]}–{m.years[1]})
        </button>
      ))}
      {active && (
        <div className="active-layer">
          <b>{pick(active.title)}</b>
          {active.kind === 'trend' ? (
            <p className="desc">{lang === 'uk'
              ? `Колір показує, наскільки змінювалося значення кожні 10 років (${active.years[0]}–${active.years[1]}). Яскраві пікселі — зміни статистично значущі (тест Манна–Кендалла, p < 0,05), бліді — можуть бути випадковими. Значущий тренд має ${Math.round(active.significantShare * 100)} % площі.`
              : `Colour shows how much the value changed per decade (${active.years[0]}–${active.years[1]}). Bright pixels are statistically significant (Mann–Kendall test, p < 0.05), pale ones could be random. ${Math.round(active.significantShare * 100)}% of the mapped area has a significant trend.`}
              {active.id === 'lst_day_trend' && (lang === 'uk'
                ? ' Увага: орбіта супутника Terra з ~2022 року зсувається на ранок, тож останні роки трохи «холодніші», ніж насправді.'
                : ' Careful: Terra’s orbit has drifted towards the morning since ~2022, so recent years look slightly too cold.')}</p>
          ) : (
            <>
              <p className="desc">{lang === 'uk'
                ? 'Наскільки рік був теплішим (червоне) чи холоднішим (синє) за норму 1991–2020 років. Натисни «Анімація» й подивись, як планета червоніє.'
                : 'How much warmer (red) or colder (blue) the year was than the 1991–2020 normal. Press “Animate” and watch the planet turn red.'}</p>
              <div className="row">
                <input type="range" min={active.years[0]} max={active.years[1]} value={trend.year} onChange={(e) => showTrendMap(active.id, +e.target.value)} style={{ flex: 1 }} />
                <b>{trend.year}</b>
                <button onClick={() => setPlaying(!playing)}>{playing ? t('stop') : t('play')}</button>
              </div>
            </>
          )}
          <div className="legend">
            <div className="bar" style={{ background: `linear-gradient(to right, ${rgb(neg)}, ${rgb(mid)}, ${rgb(pos)})` }} />
            <div className="ticks"><span>−{num(active.vmax, 2, lang)}</span><span>0</span><span>+{num(active.vmax, 2, lang)} {active.unit}{active.kind === 'trend' ? ` / 10 ${lang === 'uk' ? 'р.' : 'yr'}` : ''}</span></div>
          </div>
          {active.periods && (
            <button className="primary" style={{ margin: '4px 0' }} onClick={() => {
              const p = active.periods;
              useStore.getState().setTrendMap(null);
              useStore.getState().setSwipe({
                enabled: true, split: 0.5, preset: null,
                left: { image: dataUrl(p.early_url), label: `${p.early[0]}–${p.early[1]}`, title: active.title },
                right: { image: dataUrl(p.late_url), label: `${p.late[0]}–${p.late[1]}`, title: active.title },
              });
            }}>⇆ {lang === 'uk' ? `Порівняти ${active.periods.early[0]}–${active.periods.early[1]} і ${active.periods.late[0]}–${active.periods.late[1]}` : `Compare ${active.periods.early[0]}–${active.periods.early[1]} with ${active.periods.late[0]}–${active.periods.late[1]}`}</button>
          )}
          {active.periods && <p className="muted small">{lang === 'uk'
            ? `У порівнянні колір — відхилення середнього за ці роки від середнього за весь період (±${num(active.periods.vmax, 2, lang)} ${active.unit}): ліворуч ранні роки, праворуч останні.`
            : `In the comparison the colour is the departure of those years' mean from the whole-period mean (±${num(active.periods.vmax, 2, lang)} ${active.unit}): early years left, recent years right.`}</p>}
          {active.id === 't2m_trend' && <button onClick={() => showTrendMap('t2m_anom')}>▶ {lang === 'uk' ? 'Анімація по роках' : 'Year-by-year animation'}</button>}
          <label className="row small">{t('opacity')}
            <input type="range" min="0.2" max="1" step="0.05" value={trend.opacity} onChange={(e) => setTrendMap({ ...trend, opacity: +e.target.value })} />
          </label>
          <button className="link" onClick={() => setTrendMap(null)}>✕ {t('trendMapOff')}</button>
        </div>
      )}
    </div>
  );
}
