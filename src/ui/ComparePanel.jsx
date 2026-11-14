import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../state/store.js';
import { useT } from '../i18n/index.js';
import { loadCountries, loadCountrySeries, loadJSON } from '../lib/data.js';
import { compareReport, explain, num } from '../lib/explain.js';
import { anomalies, linreg, mean } from '../lib/stats.js';
import { SEASONS, VARIABLES, unitText } from '../content/variables.js';
import { getEngine } from '../engine/instance.js';
import { SEL_COLORS } from '../engine/Vectors.js';
import Chart from './Chart.jsx';
import Formula, { Term } from './Formula.jsx';
import { suggestContourMap } from './ConsentPrompt.jsx';

export default function ComparePanel() {
  const { t, pick, lang } = useT();
  const s = useStore();
  const [countries, setCountries] = useState(null);
  const [docs, setDocs] = useState({});
  const [varId, setVarId] = useState('T2M');
  const [seasonId, setSeasonId] = useState('year');
  const [mode, setMode] = useState('values');
  const [horizon, setHorizon] = useState(2050);
  const [showFor, setShowFor] = useState('a');
  const [choro, setChoro] = useState(null);

  useEffect(() => { loadCountries().then(setCountries); }, []);
  useEffect(() => {
    for (const id of [s.selA, s.selB]) {
      if (id && !docs[id]) loadCountrySeries(id).then((d) => setDocs((o) => ({ ...o, [id]: d }))).catch(() => setDocs((o) => ({ ...o, [id]: null })));
    }
  }, [s.selA, s.selB]);
  const [gibsData, setGibsData] = useState(null);
  useEffect(() => { loadJSON('gibs_country_annual.json').then(setGibsData).catch(() => {}); }, []);
  // leaving the panel clears the trend colouring
  useEffect(() => () => getEngine()?.vectors?.setChoropleth(null), []);

  const v0 = VARIABLES[varId];
  const season = v0.src === 'gibs' ? SEASONS[0] : SEASONS.find((x) => x.id === seasonId);
  // MODIS-derived variables come from gibs_country_annual.json (yearly values only)
  const gibsDoc = (id) => {
    const g = gibsData?.[v0.key];
    const arr = id && g?.countries[id];
    if (!arr) return null;
    const y0 = g.years[0], y1 = g.years[g.years.length - 1];
    const annual = [];
    for (let y = y0; y <= y1; y++) { const i = g.years.indexOf(y); annual.push(i >= 0 ? arr[i] : null); }
    return { id, years: [y0, y1], points: [], source: g.source, series: { [varId]: { annual, monthly: [] } } };
  };
  const docA = v0.src === 'gibs' ? gibsDoc(s.selA) : docs[s.selA];
  const docB = v0.src === 'gibs' ? gibsDoc(s.selB) : (s.selB ? docs[s.selB] : null);
  const names = {
    a: countries?.byId.get(s.selA) ? pick(countries.byId.get(s.selA).name) : s.selA,
    b: countries?.byId.get(s.selB) ? pick(countries.byId.get(s.selB).name) : s.selB,
  };
  const rep = useMemo(() => (docA ? compareReport(docA, docB, varId, season, horizon) : null), [docA, docB, varId, seasonId, horizon, gibsData]);
  const text = useMemo(() => (rep ? explain(rep, lang, names) : []), [rep, lang, names.a, names.b]);
  const option = useMemo(() => (rep ? buildOption(rep, mode, lang, names, t) : null), [rep, mode, lang, names.a, names.b]);

  const sorted = useMemo(() => countries?.list.filter((c) => c.area > 300).slice().sort((a, b) => pick(a.name).localeCompare(pick(b.name), lang)) || [], [countries, lang]);
  const v = VARIABLES[varId];
  const u = unitText(v, lang, season.months?.length === 1);

  const colourMap = async () => {
    const slopes = {};
    if (v0.src === 'gibs') {
      const g = gibsData?.[v0.key];
      for (const [id, arr] of Object.entries(g?.countries || {})) {
        const lr = linreg(g.years, arr);
        if (lr) slopes[id] = { v: lr.slope * 10, p: lr.p };
      }
    } else {
      const data = await loadJSON('power_annual.json');
      const years = [];
      for (let y = data.years[0]; y <= data.years[1]; y++) years.push(y);
      for (const [id, ser] of Object.entries(data.countries)) {
        const lr = linreg(years, ser[varId]);
        if (lr) slopes[id] = { v: lr.slope * 10, p: lr.p };
      }
    }
    const vals = Object.values(slopes).map((x) => Math.abs(x.v)).sort((a, b) => a - b);
    const max = vals[Math.floor(vals.length * 0.95)] || 1;
    const warmCold = varId.startsWith('T2M') || varId === 'LST_DAY';
    const fn = (c) => {
      const x = slopes[c.id];
      if (!x) return null;
      const k = Math.max(-1, Math.min(1, x.v / max));
      const a = x.p < 0.05 ? 0.85 : 0.35;
      return divergingColor(k, warmCold, a);
    };
    const apply = () => { getEngine()?.vectors?.setChoropleth(fn); setChoro({ max, warmCold }); };
    suggestContourMap({
      uk: 'Тренд по всіх країнах світу — це глобальна картина. На контурній карті видно всю планету одразу.',
      en: 'A trend for every country is a global picture. The contour map shows the whole planet at once.',
    }, apply);
  };

  return (
    <div className="compare-panel">
      <h3>{t('compare')}</h3>
      <p className="muted small">{t('clickToPick')}</p>
      {['a', 'b'].map((k) => (
        <div className="row" key={k} style={{ marginBottom: 4 }}>
          <span className={k === 'a' ? 'sel-a' : 'sel-b'} style={{ width: 70 }}>{t(k === 'a' ? 'countryA' : 'countryB')}</span>
          <select value={(k === 'a' ? s.selA : s.selB) || ''} onChange={(e) => s.setSel(k, e.target.value || null)} style={{ flex: 1 }}>
            {k === 'b' && <option value="">—</option>}
            {sorted.map((c) => <option key={c.id} value={c.id}>{pick(c.name)}</option>)}
          </select>
          <button className={s.pickTarget === k ? 'on' : ''} onClick={() => s.setPickTarget(k)} title={t('pickOnMap')}>🎯</button>
        </div>
      ))}
      <div className="row">
        <label className="small">{t('variable')}
          <select value={varId} onChange={(e) => setVarId(e.target.value)}>
            {Object.entries(VARIABLES).map(([id, x]) => <option key={id} value={id}>{pick(x.title)}</option>)}
          </select>
        </label>
        <label className="small">{t('season')}
          <select value={season.id} disabled={v0.src === 'gibs'} onChange={(e) => setSeasonId(e.target.value)}>
            {SEASONS.map((x) => <option key={x.id} value={x.id}>{pick(x.title)}</option>)}
          </select>
        </label>
      </div>
      <div className="row" style={{ marginTop: 4 }}>
        <div className="seg">
          {['values', 'anomalies', 'difference'].map((m) => (
            <button key={m} className={mode === m ? 'on' : ''} disabled={m === 'difference' && !docB} onClick={() => setMode(m)}>{t(m)}</button>
          ))}
        </div>
        <label className="small">{t('forecastTo')}
          <select value={horizon} onChange={(e) => setHorizon(+e.target.value)}>
            {[2030, 2035, 2040, 2050].map((h) => <option key={h}>{h}</option>)}
          </select>
        </label>
      </div>

      {!rep && <p className="muted">{t('loading')}</p>}
      {option && <Chart option={option} />}
      {rep && (
        <>
          <div className="explain">
            <b>{t('whatItMeans')}</b>
            {text.map((p, i) => <p key={i}>{p}</p>)}
          </div>
          <div className="row">
            {v.gibs && (
              <button onClick={() => s.setOverlay(v.gibs)}>🗺 {pick(v.title)} — {t('showOnMap')}</button>
            )}
            <button onClick={colourMap}>🎨 {t('mapColor')}</button>
            {choro && <button onClick={() => { getEngine()?.vectors?.setChoropleth(null); setChoro(null); }}>{t('trendMapOff')}</button>}
          </div>
          {choro && (
            <div className="legend">
              <div className="bar" style={{ background: `linear-gradient(to right, ${[-1, -0.5, 0, 0.5, 1].map((k) => divergingColor(k, choro.warmCold, 1)).join(',')})` }} />
              <div className="ticks"><span>{num(-choro.max, v.digits + 1, lang)}</span><span>0</span><span>+{num(choro.max, v.digits + 1, lang)} {u} / 10 {lang === 'uk' ? 'р.' : 'yr'}</span></div>
              <div className="muted small">{lang === 'uk' ? 'Бліді країни — тренд статистично не значущий (p ≥ 0,05).' : 'Pale countries — trend not statistically significant (p ≥ 0.05).'}</div>
            </div>
          )}
          <StatsTable rep={rep} names={names} u={u} digits={v.digits} />
          <details>
            <summary>{t('formulas')}</summary>
            <div className="row small">
              {['a', 'b'].filter((k) => (k === 'a' ? rep.A : rep.B)).map((k) => (
                <button key={k} className={showFor === k ? 'on' : ''} onClick={() => setShowFor(k)}>{names[k]}</button>
              ))}
            </div>
            <Formulas X={showFor === 'b' && rep.B ? rep.B : rep.A} u={u} horizon={horizon} lang={lang} />
          </details>
          <p className="muted small">{t('source')}: {v0.src === 'gibs' ? rep.A.doc.source : `NASA POWER (MERRA-2), ${rep.A.doc.points.length} ${lang === 'uk' ? 'точок усередині країни A, усереднено' : 'points inside country A, averaged'}`}.</p>
        </>
      )}
    </div>
  );
}

export function divergingColor(k, warmCold, a = 1) {
  // k in [-1, 1]; blue-white-red for temperature, brown-white-teal for water
  const neg = warmCold ? [49, 104, 196] : [166, 97, 26];
  const pos = warmCold ? [214, 47, 39] : [1, 133, 113];
  const mid = [247, 247, 247];
  const c = k < 0 ? neg : pos;
  const f = Math.min(1, Math.abs(k));
  const rgb = mid.map((m, i) => Math.round(m + (c[i] - m) * f));
  const alpha = Math.round(a * 255).toString(16).padStart(2, '0');
  return '#' + rgb.map((x) => x.toString(16).padStart(2, '0')).join('') + alpha;
}

function StatsTable({ rep, names, u, digits }) {
  const { lang } = useT();
  const rows = [['A', rep.A], ['B', rep.B]].filter(([, X]) => X?.an);
  const uk = lang === 'uk';
  return (
    <table className="stat-table">
      <thead>
        <tr><th></th>{rows.map(([k]) => <th key={k} className={k === 'A' ? 'sel-a' : 'sel-b'}>{names[k.toLowerCase()]}</th>)}</tr>
      </thead>
      <tbody>
        <tr><td><Term id="mean">{uk ? 'Середнє' : 'Mean'}</Term></td>{rows.map(([k, X]) => <td key={k}>{num(X.an.mean, digits, lang)} {u}</td>)}</tr>
        <tr><td><Term id="trend">{uk ? 'Тренд / 10 р.' : 'Trend / decade'}</Term></td>{rows.map(([k, X]) => <td key={k}>{num(X.an.perDecade, digits + 1, lang)}</td>)}</tr>
        <tr><td><Term id="sen_slope">{uk ? 'Нахил Сена / 10 р.' : "Sen's slope / decade"}</Term></td>{rows.map(([k, X]) => <td key={k}>{num((X.an.sen ?? 0) * 10, digits + 1, lang)}</td>)}</tr>
        <tr><td><Term id="r_squared">R²</Term></td>{rows.map(([k, X]) => <td key={k}>{num(X.an.lr.r2, 2, lang)}</td>)}</tr>
        <tr><td><Term id="p_value">p (t-test)</Term></td>{rows.map(([k, X]) => <td key={k}>{X.an.lr.p < 0.001 ? '<0.001' : num(X.an.lr.p, 3, lang)}</td>)}</tr>
        <tr><td><Term id="mann_kendall">Mann–Kendall Z / p</Term></td>{rows.map(([k, X]) => <td key={k}>{X.an.mk ? `${num(X.an.mk.Z, 2, lang)} / ${X.an.mk.p < 0.001 ? '<0.001' : num(X.an.mk.p, 3, lang)}` : '—'}</td>)}</tr>
        <tr><td><Term id="standard_deviation">{uk ? 'Розкид (σ)' : 'Spread (σ)'}</Term></td>{rows.map(([k, X]) => <td key={k}>{num(X.an.sd, digits, lang)}</td>)}</tr>
        <tr><td>n</td>{rows.map(([k, X]) => <td key={k}>{X.an.n}</td>)}</tr>
      </tbody>
    </table>
  );
}

function Formulas({ X, u, horizon, lang }) {
  if (!X?.an) return null;
  const { lr, mk, sen } = X.an;
  const f = (v, d = 4) => (Number.isFinite(v) ? v.toFixed(d) : '—');
  const uk = lang === 'uk';
  return (
    <div className="small">
      <p>{uk ? '1. Лінійний тренд (метод найменших квадратів): шукаємо пряму, найближчу до всіх точок.' : '1. Linear trend (least squares): the straight line closest to all points.'}</p>
      <Formula tex={`b = \\frac{\\sum (x_i-\\bar x)(y_i-\\bar y)}{\\sum (x_i-\\bar x)^2} = ${f(lr.slope)}\\ \\text{${u}/рік}`.replace('рік', uk ? 'рік' : 'yr')} />
      <Formula tex={`a = \\bar y - b\\,\\bar x = ${f(lr.intercept, 2)},\\quad \\hat y = a + b\\,x`} />
      <p>{uk ? '2. Наскільки пряма пояснює дані (0 — ніяк, 1 — ідеально):' : '2. How well the line explains the data (0 = not at all, 1 = perfectly):'}</p>
      <Formula tex={`R^2 = 1-\\frac{\\sum (y_i-\\hat y_i)^2}{\\sum (y_i-\\bar y)^2} = ${f(lr.r2, 3)}`} />
      <p>{uk ? '3. t-тест: чи нахил відрізняється від нуля більше, ніж дозволяє випадковий шум.' : '3. t-test: is the slope further from zero than random noise allows?'}</p>
      <Formula tex={`t = \\frac{b}{s/\\sqrt{\\sum (x_i-\\bar x)^2}} = ${f(lr.t, 2)},\\quad p = ${lr.p < 1e-4 ? '<0.0001' : f(lr.p)},\\quad F = t^2 = ${f(lr.F, 1)}`} />
      {mk && <>
        <p>{uk ? '4. Тест Манна–Кендалла: рахуємо, скільки разів пізніше значення більше за раніше (+1) чи менше (−1).' : '4. Mann–Kendall test: count how often a later value is higher (+1) or lower (−1) than an earlier one.'}</p>
        <Formula tex={`S = \\sum_{i<j} \\operatorname{sgn}(y_j-y_i) = ${mk.S},\\quad \\operatorname{Var}(S)=\\frac{n(n-1)(2n+5)}{18} = ${f(mk.varS, 0)}`} />
        <Formula tex={`Z = \\frac{S-\\operatorname{sgn}(S)}{\\sqrt{\\operatorname{Var}(S)}} = ${f(mk.Z, 2)},\\quad p = ${mk.p < 1e-4 ? '<0.0001' : f(mk.p)}`} />
      </>}
      {sen != null && <>
        <p>{uk ? '5. Нахил Сена — медіана всіх нахилів між парами років (не боїться аномальних років):' : "5. Sen's slope — median of slopes between all pairs of years (robust to odd years):"}</p>
        <Formula tex={`\\beta = \\operatorname{median}\\left(\\frac{y_j-y_i}{x_j-x_i}\\right) = ${f(sen)}`} />
      </>}
      {X.fH && <>
        <p>{uk ? `6. Прогноз на ${horizon} рік з 95 % інтервалом:` : `6. Forecast for ${horizon} with a 95% interval:`}</p>
        <Formula tex={`\\hat y_0 = a + b\\,x_0 \\pm t_{0.975,\\,n-2}\\, s\\sqrt{1+\\frac1n+\\frac{(x_0-\\bar x)^2}{\\sum (x_i-\\bar x)^2}} = ${f(X.fH.y, 2)} \\pm ${f(X.fH.hi - X.fH.y, 2)}`} />
      </>}
    </div>
  );
}

// ---------------------------------------------------------------- chart
function buildOption(rep, mode, lang, names, t) {
  const v = VARIABLES[rep.varId];
  const u = unitText(v, lang, rep.season?.months?.length === 1);
  const H = rep.horizon;
  const series = [];
  const add = (X, key, color) => {
    if (!X?.an) return;
    const base = mode === 'anomalies' ? mean(X.values.filter((_, i) => X.years[i] >= 1991 && X.years[i] <= 2020)) : 0;
    const vals = mode === 'anomalies' ? anomalies(X.years, X.values) : X.values;
    const lr = X.an.lr;
    const at = (x) => lr.intercept + lr.slope * x - base;
    const name = names[key];
    series.push({ name, type: 'line', data: X.years.map((y, i) => [y, round(vals[i])]), color, symbolSize: 5, lineStyle: { width: 2 } });
    series.push({ name: `${name} — ${t('trend')}`, type: 'line', data: [[X.an.first, round(at(X.an.first))], [X.an.last, round(at(X.an.last))]], color, symbol: 'none', lineStyle: { type: 'dashed', width: 1.5 } });
    const fy = [];
    for (let y = X.an.last; y <= H; y++) fy.push(y);
    const band = fy.map((y) => {
      const n = lr.n, s = lr.s;
      const tc = X.fH?.t ?? 2;
      const half = tc * s * Math.sqrt(1 + 1 / n + (y - lr.xbar) ** 2 / lr.sxx);
      return { y, m: at(y), lo: at(y) - half, hi: at(y) + half };
    });
    series.push({ name: `${name} — ${t('forecast')}`, type: 'line', data: band.map((b) => [b.y, round(b.m)]), color, symbol: 'none', lineStyle: { type: 'dotted', width: 2 } });
    series.push({ name: `${name} — ${t('forecast')}`, type: 'line', data: band.map((b) => [b.y, round(b.lo)]), stack: 'band' + key, symbol: 'none', lineStyle: { opacity: 0 }, color, tooltip: { show: false } });
    series.push({ name: `${name} — ${t('forecast')}`, type: 'line', data: band.map((b) => [b.y, round(b.hi - b.lo)]), stack: 'band' + key, symbol: 'none', lineStyle: { opacity: 0 }, areaStyle: { color, opacity: 0.13 }, color, tooltip: { show: false } });
  };
  if (mode === 'difference' && rep.B?.an) {
    const mapB = new Map(rep.B.years.map((y, i) => [y, rep.B.values[i]]));
    const ys = [], ds = [];
    rep.A.years.forEach((y, i) => { if (mapB.has(y)) { ys.push(y); ds.push(rep.A.values[i] - mapB.get(y)); } });
    const lr = linreg(ys, ds);
    series.push({ name: `${names.a} − ${names.b}`, type: 'bar', data: ys.map((y, i) => [y, round(ds[i])]), itemStyle: { color: (p) => (p.value[1] >= 0 ? SEL_COLORS.a : SEL_COLORS.b) } });
    if (lr) {
      series.push({ name: t('trend'), type: 'line', data: [[ys[0], round(lr.intercept + lr.slope * ys[0])], [H, round(lr.intercept + lr.slope * H)]], symbol: 'none', color: '#ffffff', lineStyle: { type: 'dashed' } });
    }
  } else {
    add(rep.A, 'a', SEL_COLORS.a);
    add(rep.B, 'b', SEL_COLORS.b);
  }
  return {
    backgroundColor: 'transparent',
    animationDuration: 400,
    tooltip: { trigger: 'axis', valueFormatter: (x) => (x == null ? '—' : `${num(x, v.digits + 1, lang)} ${u}`) },
    legend: { top: 4, type: 'scroll', textStyle: { fontSize: 11 }, data: series.filter((s) => !s.stack).map((s) => s.name).filter((n, i, a) => a.indexOf(n) === i) },
    grid: { left: 48, right: 16, top: 44, bottom: 58 },
    xAxis: { type: 'value', min: Math.min(rep.A.years[0], rep.B?.years[0] ?? 9999), max: H, minInterval: 1, axisLabel: { formatter: (x) => String(x) }, splitLine: { show: false } },
    yAxis: { type: 'value', scale: true, name: mode === 'anomalies' ? `Δ ${u}` : u, nameTextStyle: { fontSize: 11 } },
    dataZoom: [{ type: 'inside' }, { type: 'slider', height: 18, bottom: 8 }],
    series,
  };
}

const round = (x) => (x == null || !Number.isFinite(x) ? null : Math.round(x * 1000) / 1000);
