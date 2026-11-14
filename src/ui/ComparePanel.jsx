import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../state/store.js';
import { useT } from '../i18n/index.js';
import { loadCountries, loadCountrySeries, loadJSON } from '../lib/data.js';
import { compareReport, explain, num, seasonalSeries } from '../lib/explain.js';
import { analyse, anomalies, forecastSen, linreg, mean, senLine } from '../lib/stats.js';
import { SEASONS, VARIABLES, unitText } from '../content/variables.js';
import { getEngine } from '../engine/instance.js';
import { SEL_COLORS } from '../engine/Vectors.js';
import Chart, { yearTooltip } from './Chart.jsx';
import Formula, { Term } from './Formula.jsx';
import { suggestContourMap } from './ConsentPrompt.jsx';

export default function ComparePanel() {
  const { t, pick, lang } = useT();
  const s = useStore();
  const [countries, setCountries] = useState(null);
  const [docs, setDocs] = useState({});
  const varId = useStore((st) => st.compareVar);
  const setVarId = useStore((st) => st.setCompareVar);
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
            {v0.note && <p className="small">⚠ {pick(v0.note)}</p>}
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
          {v0.src !== 'gibs' && season.id === 'year' && (
            <details>
              <summary>{lang === 'uk' ? 'Тренд у кожному сезоні' : 'Trend in each season'}</summary>
              <SeasonTable docA={docA} docB={docB} varId={varId} names={names} digits={v.digits} />
              <p className="muted small">{lang === 'uk' ? 'Бліді клітинки — тренд у цьому сезоні не значущий (p ≥ 0,05).' : 'Pale cells — the trend in this season is not significant (p ≥ 0.05).'}</p>
            </details>
          )}
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

function pFmt(p, lang) {
  if (p == null) return '—';
  return p < 0.001 ? '< 0,001'.replace(',', lang === 'uk' ? ',' : '.') : num(p, 3, lang);
}

function StatsTable({ rep, names, u, digits }) {
  const { lang } = useT();
  const rows = [['A', rep.A], ['B', rep.B]].filter(([, X]) => X?.an);
  const uk = lang === 'uk';
  const d1 = digits + 1;
  const cell = (fn) => rows.map(([k, X]) => <td key={k}>{fn(X.an)}</td>);
  return (
    <table className="stat-table">
      <thead>
        <tr><th></th>{rows.map(([k]) => <th key={k} className={k === 'A' ? 'sel-a' : 'sel-b'}>{names[k.toLowerCase()]}</th>)}</tr>
      </thead>
      <tbody>
        <tr><td><Term id="mean">{uk ? 'Середнє' : 'Mean'}</Term></td>{cell((a) => `${num(a.mean, digits, lang)} ${u}`)}</tr>
        <tr><td><Term id="sen_slope">{uk ? 'Тренд (нахил Сена) / 10 р.' : "Trend (Sen's slope) / decade"}</Term></td>{cell((a) => <b>{num(a.perDecade, d1, lang)}</b>)}</tr>
        <tr><td>{uk ? '95 % інтервал тренду / 10 р.' : '95% interval of the trend / decade'}</td>{cell((a) => (a.senCI ? `${num(a.senCI[0] * 10, d1, lang)} … ${num(a.senCI[1] * 10, d1, lang)}` : '—'))}</tr>
        <tr><td><Term id="mann_kendall">{uk ? 'Манн–Кендалл (з поправкою) Z' : 'Mann–Kendall (corrected) Z'}</Term></td>{cell((a) => (a.mkMod ? `${num(a.mkMod.Z, 2, lang)} ${Math.abs(a.mkMod.Z) > 1.96 ? '> 1,96 ✔' : '≤ 1,96'}`.replace(/1,96/g, lang === 'uk' ? '1,96' : '1.96') : '—'))}</tr>
        <tr><td><Term id="p_value">p</Term></td>{cell((a) => <b>{pFmt(a.p, lang)}</b>)}</tr>
        <tr><td><Term id="seasonal_mk">{uk ? 'Сезонний Манн–Кендалл (місяці) Z / p' : 'Seasonal Mann–Kendall (months) Z / p'}</Term></td>{cell((a) => (a.smk ? `${num(a.smk.Z, 2, lang)} / ${pFmt(a.smk.p, lang)}` : '—'))}</tr>
        <tr><td><Term id="autocorrelation">{uk ? 'Поправка на автокореляцію n/n*' : 'Autocorrelation correction n/n*'}</Term></td>{cell((a) => (a.mkMod ? num(a.mkMod.factor, 2, lang) : '—'))}</tr>
        <tr><td><Term id="linear_regression">{uk ? 'Для порівняння: МНК / 10 р., R²' : 'For comparison: least squares / decade, R²'}</Term></td>{cell((a) => `${num(a.lr.slope * 10, d1, lang)}, ${num(a.lr.r2, 2, lang)}`)}</tr>
        <tr><td><Term id="standard_deviation">{uk ? 'Розкид (σ)' : 'Spread (σ)'}</Term></td>{cell((a) => num(a.sd, digits, lang))}</tr>
        <tr><td>{uk ? 'Років із даними (пропусків)' : 'Years with data (missing)'}</td>{cell((a) => `${a.n} (${a.missing})`)}</tr>
        <tr><td><Term id="hindcast">{uk ? 'Перевірка прогнозу на минулому' : 'Forecast check on the past'}</Term></td>{cell((a) => (a.hind ? `${uk ? 'влучань' : 'hits'} ${Math.round(a.hind.coverage * 100)} %, ${uk ? 'краще за «середнє»' : 'better than “average”'} ${a.hind.skill > 0 ? '✔' : '✘'}` : '—'))}</tr>
      </tbody>
    </table>
  );
}

/** trend in each season, so a hot summer and a cold winter cannot hide behind a flat yearly mean */
function SeasonTable({ docA, docB, varId, names, digits }) {
  const { lang, pick } = useT();
  const uk = lang === 'uk';
  const seasons = SEASONS.slice(1, 5);
  const rows = seasons.map((s) => {
    const r = [docA, docB].map((doc) => {
      if (!doc) return null;
      const ser = seasonalSeries(doc, varId, s);
      return analyse(ser.years, ser.values);
    });
    return { s, r };
  });
  return (
    <table className="stat-table">
      <thead><tr><th>{uk ? 'Сезон' : 'Season'}</th><th className="sel-a">{names.a}</th>{docB && <th className="sel-b">{names.b}</th>}</tr></thead>
      <tbody>
        {rows.map(({ s, r }) => (
          <tr key={s.id}>
            <td>{pick(s.title)}</td>
            {r.map((a, i) => (i === 1 && !docB ? null : (
              <td key={i} style={{ opacity: a && a.significant ? 1 : 0.55 }}>
                {a ? `${num(a.perDecade, digits + 1, lang)} / 10 ${uk ? 'р.' : 'yr'} (p ${pFmt(a.p, lang)})` : '—'}
              </td>
            )))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Formulas({ X, u, horizon, lang }) {
  if (!X?.an) return null;
  const { lr, mk, mkMod, smk, sen, senCI, line, hind } = X.an;
  const f = (v, d = 4) => (Number.isFinite(v) ? v.toFixed(d) : '—');
  const uk = lang === 'uk';
  const yr = uk ? 'рік' : 'yr';
  return (
    <div className="small">
      <p><b>1. {uk ? 'Наскільки швидко змінюється — нахил Сена.' : "How fast it changes — Sen's slope."}</b> {uk
        ? 'Беремо нахил між КОЖНОЮ парою років і знаходимо медіану. Один аномальний рік (Ель-Ніньйо, вулкан) майже не впливає на результат — тому цей метод «у парі» з тестом Манна–Кендалла.'
        : 'Take the slope between EVERY pair of years and find the median. One odd year (El Niño, a volcano) hardly changes it — that is why it pairs with the Mann–Kendall test.'}</p>
      <Formula tex={`\\beta = \\operatorname{median}_{i<j}\\frac{y_j-y_i}{x_j-x_i} = ${f(sen)}\\ \\text{${u}/${yr}}`} />
      {senCI && <Formula tex={`95\\%\\ CI:\\ [\\beta_{(M_1)},\\ \\beta_{(M_2+1)}],\\ M_{1,2} = \\tfrac{N' \\mp 1.96\\sqrt{\\operatorname{Var}(S)}}{2} \\Rightarrow [${f(senCI[0])},\\ ${f(senCI[1])}]`} />}
      {line && <Formula tex={`a = \\operatorname{median}(y_i - \\beta x_i) = ${f(line.a, 2)},\\quad \\hat y = a + \\beta x`} />}
      {mk && <>
        <p><b>2. {uk ? 'Чи це не випадковість — тест Манна–Кендалла.' : 'Is it not chance — the Mann–Kendall test.'}</b> {uk
          ? 'Для кожної пари років ставимо +1, якщо пізніший більший, −1 — якщо менший. Потім S порівнюємо з тим, яким воно буває у випадкових даних.'
          : 'For each pair of years write +1 if the later is higher, −1 if lower. Then compare S with what random data would give.'}</p>
        <Formula tex={`S = \\sum_{i<j}\\operatorname{sgn}(y_j-y_i) = ${mk.S},\\qquad \\operatorname{Var}(S)=\\frac{n(n-1)(2n+5)-\\sum_t t(t-1)(2t+5)}{18} = ${f(mk.varS, 1)}`} />
      </>}
      {mkMod && <>
        <p><b>3. {uk ? 'Поправка на автокореляцію (Hamed & Rao, 1998).' : 'Autocorrelation correction (Hamed & Rao, 1998).'}</b> {uk
          ? 'Теплий рік часто йде за теплим — такі ряди «схожі» на тренд частіше, ніж чесний випадок. Тому дисперсію S збільшуємо на коефіцієнт n/n*, порахований з автокореляції рангів ряду без тренду (враховуємо лише значущі лаги, |ρ| > 1,96/√n).'
          : 'A warm year often follows a warm year — such series look like a trend more often than honest chance. So Var(S) is multiplied by n/n*, computed from the autocorrelation of the ranks of the de-trended series (only significant lags, |ρ| > 1.96/√n).'}</p>
        <Formula tex={`\\frac{n}{n^*} = 1 + \\frac{2}{n(n-1)(n-2)}\\sum_{k}(n-k)(n-k-1)(n-k-2)\\,\\rho_k = ${f(mkMod.factor, 3)}`} />
        <Formula tex={`Z = \\frac{S-\\operatorname{sgn}(S)}{\\sqrt{\\operatorname{Var}(S)\\cdot n/n^*}} = ${f(mkMod.Z, 2)}\\quad ${Math.abs(mkMod.Z) > 1.96 ? '>' : '\\le'}\\ Z_{0.975}=1.96 \\;\\Rightarrow\\; p = ${mkMod.p < 1e-4 ? '<0.0001' : f(mkMod.p)}`} />
        <p>{uk
          ? (mkMod.reject ? '|Z| більше за критичне 1,96 → відкидаємо гіпотезу «тренду немає» з ризиком помилки 5 %.' : '|Z| не перевищує 1,96 → доказу тренду недостатньо.')
          : (mkMod.reject ? '|Z| exceeds the critical 1.96 → we reject “no trend” with a 5% risk of error.' : '|Z| does not exceed 1.96 → not enough evidence of a trend.')}</p>
      </>}
      {smk && <>
        <p><b>4. {uk ? 'Сезонний тест (Hirsch et al., 1982) на всіх місяцях.' : 'Seasonal test (Hirsch et al., 1982) on all months.'}</b> {uk
          ? 'Січні порівнюємо лише з січнями, липні — з липнями, тож зміна пір року не може «прикинутися» трендом, і ми не втрачаємо, що відбувається всередині року.'
          : 'Januaries are compared only with Januaries, Julys with Julys, so the seasons cannot pretend to be a trend and we keep what happens within the year.'}</p>
        <Formula tex={`S=\\sum_{m=1}^{12}S_m = ${smk.S},\\ \\operatorname{Var}(S)=\\sum_m \\operatorname{Var}(S_m),\\ Z = ${f(smk.Z, 2)},\\ p = ${smk.p < 1e-4 ? '<0.0001' : f(smk.p)},\\ \\beta_{seas} = ${f(smk.sen)}`} />
      </>}
      <p><b>5. {uk ? 'Для порівняння — звичайна лінійна регресія (МНК).' : 'For comparison — ordinary least squares.'}</b></p>
      <Formula tex={`b = \\frac{\\sum (x_i-\\bar x)(y_i-\\bar y)}{\\sum (x_i-\\bar x)^2} = ${f(lr.slope)},\\quad R^2 = ${f(lr.r2, 3)}`} />
      {X.fH && line && <>
        <p><b>6. {uk ? `Прогноз на ${horizon} рік` : `Forecast for ${horizon}`}</b> {uk ? '— продовжуємо лінію Сена; смуга 95 % враховує розкид точок навколо лінії та невизначеність нахилу.' : '— we extend the Sen line; the 95% band includes the scatter around the line and the slope uncertainty.'}</p>
        <Formula tex={`\\hat y_0 = a + \\beta x_0 \\pm t_{0.975,\\,n-2}\\, s\\sqrt{1+\\tfrac1n+\\tfrac{(x_0-\\bar x)^2}{\\sum (x_i-\\bar x)^2}} = ${f(X.fH.y, 2)} \\pm ${f(X.fH.hi - X.fH.y, 2)}`} />
      </>}
      {hind && <>
        <p><b>7. {uk ? 'Перевірка прогнозу на минулому.' : 'Checking the forecast on the past.'}</b> {uk
          ? `Уявімо, що ми в ${hind.split} році: будуємо лінію лише за ${hind.train} попередніми роками і «прогнозуємо» наступні ${hind.test}. Реальні значення потрапили в смугу 95 % у ${Math.round(hind.coverage * 100)} % випадків; похибка RMSE = ${f(hind.rmse, 2)} ${u} проти ${f(hind.rmseClim, 2)} ${u}, якби ми просто взяли середнє минулих років (показник якості ${f(hind.skill, 2)}; більше 0 — прогноз корисніший за середнє).`
          : `Imagine we are in ${hind.split}: we fit the line on the ${hind.train} earlier years only and “forecast” the next ${hind.test}. Real values fell inside the 95% band in ${Math.round(hind.coverage * 100)}% of cases; RMSE = ${f(hind.rmse, 2)} ${u} versus ${f(hind.rmseClim, 2)} ${u} if we had just used the past average (skill ${f(hind.skill, 2)}; above 0 means the forecast beats the average).`}</p>
      </>}
      <p><b>8. {uk ? 'Чому саме ці числа?' : 'Why exactly these numbers?'}</b></p>
      <ul>
        <li>{uk ? 'α = 0,05 і Z = 1,96: загальноприйнята межа — ризик 5 % назвати трендом те, що є випадковістю (1,96 — значення нормального розподілу для 95 % двобічно).' : 'α = 0.05 and Z = 1.96: the usual limit — a 5% risk of calling chance a trend (1.96 is the normal-distribution value for 95% two-sided).'}</li>
        <li>{uk ? 'Норма 1991–2020: стандартний 30-річний кліматичний період Всесвітньої метеорологічної організації (для GISTEMP NASA — 1951–1980).' : 'Normal 1991–2020: the standard 30-year climate period of the World Meteorological Organization (NASA GISTEMP uses 1951–1980).'}</li>
        <li>{uk ? '«За 10 років»: нахил за рік × 10 — так легше уявити зміну; «останні 10 років» — середнє, що згладжує випадкові стрибки.' : '“Per decade”: the yearly slope × 10, easier to imagine; “last 10 years” is an average that smooths random jumps.'}</li>
        <li>{uk ? 't₀.₉₇₅,ₙ₋₂: 95 % двобічно; n − 2 ступенів свободи, бо з даних оцінено два числа (a і β).' : 't₀.₉₇₅,ₙ₋₂: 95% two-sided; n − 2 degrees of freedom because two numbers (a and β) are estimated from the data.'}</li>
        <li>{uk ? '1,96/√n для лагів автокореляції: межа, вище якої кореляція вже не схожа на випадкову.' : '1.96/√n for autocorrelation lags: the limit above which a correlation no longer looks random.'}</li>
        <li>{uk ? 'Перевірка прогнозу: перші ~55 % років — навчання, решта — перевірка.' : 'Forecast check: the first ~55% of years are for fitting, the rest for checking.'}</li>
      </ul>
      <p><b>9. {uk ? 'Пропуски в даних.' : 'Missing data.'}</b> {uk
        ? `Рік рахуємо, лише якщо є всі 12 місяців (для знімків MODIS — щонайменше 10, хмарні пікселі не беруться). Неповні роки просто не входять у розрахунок — їх не «вигадуємо». Тест Манна–Кендалла і нахил Сена порівнюють лише наявні пари років, тож пропуски не зсувають результат, а лише зменшують n (тут пропущено ${X.an.missing}).`
        : `A year counts only if all 12 months exist (for MODIS images at least 10; cloudy pixels are skipped). Incomplete years are simply left out — we never invent values. Mann–Kendall and Sen's slope only compare the pairs of years that exist, so gaps do not shift the result, they only reduce n (missing here: ${X.an.missing}).`}</p>
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
    if (!X?.an?.line) return;
    const base = mode === 'anomalies' ? mean(X.values.filter((_, i) => X.years[i] >= 1991 && X.years[i] <= 2020)) : 0;
    const vals = mode === 'anomalies' ? anomalies(X.years, X.values) : X.values;
    const line = X.an.line;
    const at = (x) => line.a + line.beta * x - base;
    const name = names[key];
    series.push({ name, type: 'line', data: X.years.map((y, i) => [y, round(vals[i])]), color, symbolSize: 5, lineStyle: { width: 2 } });
    series.push({ name: `${name} — ${t('trend')}`, type: 'line', data: [[X.an.first, round(at(X.an.first))], [X.an.last, round(at(X.an.last))]], color, symbol: 'none', lineStyle: { type: 'dashed', width: 1.5 } });
    const band = [];
    for (let y = X.an.last; y <= H; y++) {
      const f = forecastSen(line, y);
      band.push({ y, m: f.y - base, lo: f.lo - base, hi: f.hi - base });
    }
    series.push({ name: `${name} — ${t('forecast')}`, type: 'line', data: band.map((b) => [b.y, round(b.m)]), color, symbol: 'none', lineStyle: { type: 'dotted', width: 2 } });
    series.push({ name: `${name} — ${t('forecast')}`, type: 'line', data: band.map((b) => [b.y, round(b.lo)]), stack: 'band' + key, symbol: 'none', lineStyle: { opacity: 0 }, color, tooltip: { show: false } });
    series.push({ name: `${name} — ${t('forecast')}`, type: 'line', data: band.map((b) => [b.y, round(b.hi - b.lo)]), stack: 'band' + key, symbol: 'none', lineStyle: { opacity: 0 }, areaStyle: { color, opacity: 0.13 }, color, tooltip: { show: false } });
  };
  if (mode === 'difference' && rep.B?.an) {
    const mapB = new Map(rep.B.years.map((y, i) => [y, rep.B.values[i]]));
    const ys = [], ds = [];
    rep.A.years.forEach((y, i) => { if (mapB.has(y)) { ys.push(y); ds.push(rep.A.values[i] - mapB.get(y)); } });
    const line = senLine(ys, ds);
    series.push({ name: `${names.a} − ${names.b}`, type: 'bar', data: ys.map((y, i) => [y, round(ds[i])]), itemStyle: { color: (p) => (p.value[1] >= 0 ? SEL_COLORS.a : SEL_COLORS.b) } });
    if (line) {
      series.push({ name: t('trend'), type: 'line', data: [[ys[0], round(line.a + line.beta * ys[0])], [H, round(line.a + line.beta * H)]], symbol: 'none', color: '#ffffff', lineStyle: { type: 'dashed' } });
    }
  } else {
    add(rep.A, 'a', SEL_COLORS.a);
    add(rep.B, 'b', SEL_COLORS.b);
  }
  const fmtVal = (x) => `${num(x, v.digits + 1, lang)} ${u}`;
  return {
    backgroundColor: 'transparent',
    animationDuration: 400,
    tooltip: { trigger: 'axis', formatter: yearTooltip(fmtVal) },
    legend: { top: 4, type: 'scroll', textStyle: { fontSize: 11 }, data: series.filter((s) => !s.stack).map((s) => s.name).filter((n, i, a) => a.indexOf(n) === i) },
    grid: { left: 48, right: 16, top: 44, bottom: 58 },
    xAxis: {
      type: 'value', min: Math.min(rep.A.years[0], rep.B?.years[0] ?? 9999), max: H, minInterval: 1,
      axisLabel: { formatter: (x) => String(Math.round(x)) },
      axisPointer: { label: { formatter: ({ value }) => String(Math.round(value)) } },
      splitLine: { show: false },
    },
    yAxis: { type: 'value', scale: true, name: mode === 'anomalies' ? `Δ ${u}` : u, nameTextStyle: { fontSize: 11 } },
    dataZoom: [{ type: 'inside' }, { type: 'slider', height: 18, bottom: 8, labelFormatter: (x) => String(Math.round(x)) }],
    series,
  };
}

const round = (x) => (x == null || !Number.isFinite(x) ? null : Math.round(x * 1000) / 1000);
