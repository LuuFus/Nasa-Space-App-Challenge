import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../state/store.js';
import { useT } from '../i18n/index.js';
import { loadCountries, loadJSON } from '../lib/data.js';
import { analyse } from '../lib/stats.js';
import { num } from '../lib/explain.js';
import { VARIABLES, unitText } from '../content/variables.js';
import { SEL_COLORS } from '../engine/Vectors.js';
import { Term } from './Formula.jsx';
import CompareDetail from './ComparePanel.jsx';
import { STROKE } from './Icons.jsx';
import { AlertTriangle, ChevronRight, Crosshair, LineChart, Microscope, TrendingUp } from 'lucide-react';

// Which direction is a worry for each indicator (+1: rising is bad, -1: falling is bad, 0: neutral)
const GROUPS = [
  { title: { uk: 'Клімат', en: 'Climate' }, ids: ['T2M', 'T2M_MAX', 'T2M_MIN', 'PRECTOTCORR', 'RH2M', 'QV2M', 'WS2M', 'ALLSKY_SFC_SW_DWN'] },
  { title: { uk: 'Вода й ґрунт', en: 'Water & soil' }, ids: ['GWETROOT', 'GWETTOP'] },
  { title: { uk: 'Земля й рослини', en: 'Land & plants' }, ids: ['NDVI', 'LST_DAY'] },
  { title: { uk: 'Повітря й викиди', en: 'Air & emissions' }, ids: ['PM25', 'AOD', 'SO2'] },
];
const BAD = { T2M: 1, T2M_MAX: 1, T2M_MIN: 0, PRECTOTCORR: -1, RH2M: -1, QV2M: 0, WS2M: 0, ALLSKY_SFC_SW_DWN: 0, GWETROOT: -1, GWETTOP: -1, NDVI: -1, LST_DAY: 1, PM25: 1, AOD: 1, SO2: 1 };
const ISSUE = {
  T2M: [{ uk: 'Швидке потепління', en: 'Fast warming' }, null],
  T2M_MAX: [{ uk: 'Спекотніші дні', en: 'Hotter days' }, null],
  PRECTOTCORR: [{ uk: 'Менше опадів — ризик посух', en: 'Less rain — drought risk' }, { uk: 'Більше опадів', en: 'More rain' }],
  RH2M: [{ uk: 'Повітря сухішає — ризик пожеж', en: 'Air is drying — fire risk' }, null],
  GWETROOT: [{ uk: 'Ґрунт пересихає', en: 'Soil is drying out' }, { uk: 'Ґрунт вологішає', en: 'Soil is getting wetter' }],
  GWETTOP: [{ uk: 'Верхній шар ґрунту пересихає', en: 'Topsoil is drying' }, null],
  NDVI: [{ uk: 'Рослинність бідніє', en: 'Vegetation is getting poorer' }, { uk: 'Земля зеленіє', en: 'The land is greening' }],
  LST_DAY: [{ uk: 'Земля нагрівається вдень', en: 'The ground gets hotter by day' }, null],
  PM25: [{ uk: 'Більше пилу PM2.5', en: 'More PM2.5 dust' }, { uk: 'Менше пилу PM2.5', en: 'Less PM2.5 dust' }],
  AOD: [{ uk: 'Повітря каламутнішає', en: 'The air is getting hazier' }, { uk: 'Повітря чистішає', en: 'The air is getting cleaner' }],
  SO2: [{ uk: 'Більше SO₂ (вугілля, металургія)', en: 'More SO₂ (coal, smelters)' }, { uk: 'Менше SO₂ — менше кислотних дощів', en: 'Less SO₂ — less acid rain' }],
};

function seriesOf(id, cid, power, gibs) {
  const v = VARIABLES[id];
  if (v.src === 'gibs') {
    const g = gibs?.[v.key];
    const arr = g?.countries[cid];
    return arr ? { years: g.years, values: arr } : null;
  }
  const arr = power?.countries[cid]?.[id];
  if (!arr) return null;
  const years = arr.map((_, i) => power.years[0] + i);
  return { years, values: arr };
}

/** Sen's slope of every country, to say "faster than X % of countries" */
function useGlobalTrends(power, gibs) {
  return useMemo(() => {
    if (!power) return null;
    const out = {};
    for (const id of Object.keys(BAD)) {
      const v = VARIABLES[id];
      const ids = v.src === 'gibs' ? Object.keys(gibs?.[v.key]?.countries || {}) : Object.keys(power.countries);
      const sl = {};
      for (const cid of ids) {
        const s = seriesOf(id, cid, power, gibs);
        if (!s) continue;
        const an = analyse(s.years, s.values);
        if (an) sl[cid] = an.perDecade;
      }
      out[id] = sl;
    }
    return out;
  }, [power, gibs]);
}

function percentile(map, cid, sign) {
  const vals = Object.values(map);
  const me = map[cid];
  if (me == null || !vals.length) return null;
  const worse = vals.filter((x) => (sign >= 0 ? x < me : x > me)).length;
  return worse / vals.length;
}

function Spark({ s, an, color }) {
  if (!s) return null;
  const xs = s.years, ys = s.values.filter((v) => v != null);
  if (ys.length < 3) return null;
  const min = Math.min(...ys), max = Math.max(...ys);
  const W = 120, H = 30;
  const X = (x) => ((x - xs[0]) / (xs[xs.length - 1] - xs[0])) * W;
  const Y = (y) => H - 2 - ((y - min) / (max - min || 1)) * (H - 4);
  const pts = s.values.map((v, i) => (v == null ? null : `${X(xs[i]).toFixed(1)},${Y(v).toFixed(1)}`)).filter(Boolean).join(' ');
  const l = an?.line;
  return (
    <svg width={W} height={H} className="spark">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.3" />
      {l && <line x1={X(xs[0])} y1={Y(l.a + l.beta * xs[0])} x2={X(xs[xs.length - 1])} y2={Y(l.a + l.beta * xs[xs.length - 1])} stroke="#fff" strokeDasharray="3 2" strokeWidth="1" />}
    </svg>
  );
}

function gibsSnapshot(layer, bbox, time, w = 340) {
  let [x0, y0, x1, y1] = bbox;
  const padX = (x1 - x0) * 0.08 + 0.3, padY = (y1 - y0) * 0.08 + 0.3;
  x0 -= padX; x1 += padX; y0 -= padY; y1 += padY;
  const h = Math.max(120, Math.min(340, Math.round(w * (y1 - y0) / (x1 - x0))));
  const p = new URLSearchParams({ SERVICE: 'WMS', REQUEST: 'GetMap', VERSION: '1.3.0', LAYERS: layer, CRS: 'EPSG:4326', BBOX: `${y0},${x0},${y1},${x1}`, WIDTH: w, HEIGHT: h, FORMAT: 'image/jpeg' });
  if (time) p.set('TIME', time);
  return { url: `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?${p}`, box: [x0, y0, x1, y1], w, h };
}

function outlinePath(c, box, w, h) {
  const [x0, y0, x1, y1] = box;
  let d = '';
  for (const poly of c.rings) {
    const r = poly[0];
    const step = Math.max(2, Math.floor(r.length / 2 / 400) * 2);
    for (let i = 0; i < r.length; i += step) {
      const X = ((r[i] - x0) / (x1 - x0)) * w, Y = ((y1 - r[i + 1]) / (y1 - y0)) * h;
      d += `${i === 0 ? 'M' : 'L'}${X.toFixed(1)},${Y.toFixed(1)}`;
    }
    d += 'Z';
  }
  return d;
}

/** compact view box for countries that stretch over the 180° meridian (Russia, USA, Fiji…) */
function viewBox(c) {
  const b = c.bbox;
  if (b[2] - b[0] < 200) return b;
  const [lx, ly] = c.label;
  return [Math.max(-180, lx - 40), Math.max(-85, ly - 18), Math.min(180, lx + 40), Math.min(85, ly + 18)];
}

/** one country: selector chip, day and night pictures, a few facts */
function CountryColumn({ k, c, sorted }) {
  const { pick, lang, t } = useT();
  const s = useStore();
  const uk = lang === 'uk';
  const sel = k === 'a' ? s.selA : s.selB;
  const box = c ? viewBox(c) : null;
  const pics = c ? [
    [gibsSnapshot('BlueMarble_NextGeneration', box, null, 240), uk ? 'День' : 'Day', 'NASA Blue Marble'],
    [gibsSnapshot('VIIRS_Black_Marble', box, '2016-01-01', 240), uk ? 'Ніч' : 'Night', 'NASA Black Marble 2016'],
  ] : [];
  return (
    <div className={`country-col sel-${k}-border`}>
      <div className="country-pick">
        <span className={`dot dot-${k}`} aria-hidden="true" />
        <select value={sel || ''} onChange={(e) => s.setSel(k, e.target.value || null)} aria-label={t(k === 'a' ? 'countryA' : 'countryB')}>
          {k === 'b' && <option value="">—</option>}
          {sorted.map((x) => <option key={x.id} value={x.id}>{pick(x.name)}</option>)}
        </select>
        <button type="button" className={s.pickTarget === k ? 'icon-btn on' : 'icon-btn'} onClick={() => s.setPickTarget(k)}
          title={uk ? 'Обрати цю країну кліком на карті' : 'Pick this country by clicking the map'} aria-pressed={s.pickTarget === k}>
          <Crosshair size={15} strokeWidth={STROKE} />
        </button>
      </div>
      {c && (
        <>
          <div className="daynight">
            {pics.map(([im, cap, src]) => (
              <figure key={cap} title={src}>
                <div className="photo" style={{ aspectRatio: `${im.w} / ${im.h}` }}>
                  <img src={im.url} alt={`${pick(c.name)} — ${cap}`} loading="lazy" />
                  <svg viewBox={`0 0 ${im.w} ${im.h}`} preserveAspectRatio="none" aria-hidden="true"><path d={outlinePath(c, im.box, im.w, im.h)} fill="none" stroke={SEL_COLORS[k]} strokeWidth="1.6" /></svg>
                </div>
                <figcaption>{cap}</figcaption>
              </figure>
            ))}
          </div>
          <div className="facts mono">
            {c.pop ? (c.pop / 1e6).toFixed(c.pop > 1e7 ? 0 : 1) + (uk ? ' млн' : ' M') : '—'} · {c.area.toLocaleString(uk ? 'uk-UA' : 'en-GB')} {uk ? 'км²' : 'km²'}
          </div>
        </>
      )}
    </div>
  );
}

function IssueList({ items, empty, kind }) {
  if (!items) return <div />;
  return items.length
    ? <ul className={`issues ${kind}`}>{items.map((x) => <li key={x.id}>{x.text}</li>)}</ul>
    : <p className="small muted">{empty}</p>;
}

/** one indicator: values, trends, sparklines and its own chart switch */
function IndicatorRow({ id, a, b, A, B }) {
  const { pick, lang } = useT();
  const uk = lang === 'uk';
  // only this row's chart visibility — never the active tab or the chosen countries
  const [showChart, setShowChart] = useState(false);
  const v = VARIABLES[id];
  const u = unitText(v, lang);
  const cell = (x, color) => (x?.an ? (
    <div>
      <b className="mono">{num(x.an.lastAvg, v.digits, lang)}</b> <span className="unit">{u}</span>
      <div className={x.an.significant ? 'trend sig mono' : 'trend mono'}>
        {x.an.perDecade > 0 ? '+' : ''}{num(x.an.perDecade, v.digits + 1, lang)} / 10 {uk ? 'р.' : 'yr'}{x.an.significant ? ' *' : ''}
      </div>
      <Spark s={x.ser} an={x.an} color={color} />
    </div>
  ) : <span className="muted">—</span>);
  let note = '';
  if (a?.an && b?.an) {
    const diff = a.an.lastAvg - b.an.lastAvg;
    const higher = diff >= 0 ? pick(A.name) : pick(B.name);
    const faster = Math.abs(a.an.perDecade) >= Math.abs(b.an.perDecade) ? pick(A.name) : pick(B.name);
    note = uk
      ? `Вище — ${higher} (на ${num(Math.abs(diff), v.digits, lang)} ${u}). Швидше змінюється — ${faster}.`
      : `Higher: ${higher} (by ${num(Math.abs(diff), v.digits, lang)} ${u}). Changing faster: ${faster}.`;
  }
  return (
    <>
      <tr className="ind-row">
        <td>
          <Term id={v.term}>{pick(v.title)}</Term>
          <button type="button" className={showChart ? 'chart-toggle on' : 'chart-toggle'} aria-expanded={showChart}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowChart((x) => !x); }}>
            <LineChart size={13} strokeWidth={STROKE} /> {showChart ? (uk ? 'Сховати графік' : 'Hide chart') : (uk ? 'Графік' : 'Chart')}
          </button>
        </td>
        <td>{cell(a, SEL_COLORS.a)}</td>
        <td>{cell(b, SEL_COLORS.b)}</td>
      </tr>
      {note && <tr className="note-row"><td colSpan={3}>{note}</td></tr>}
      {showChart && <tr className="chart-row"><td colSpan={3}><CompareDetail varId={id} /></td></tr>}
    </>
  );
}

/** "Country comparison": two countries, a short summary, then (folded) every indicator with charts */
export default function CountriesPanel() {
  const { pick, lang, t } = useT();
  const uk = lang === 'uk';
  const s = useStore();
  const [countries, setCountries] = useState(null);
  const [power, setPower] = useState(null);
  const [gibs, setGibs] = useState(null);
  useEffect(() => {
    loadCountries().then(setCountries);
    loadJSON('power_annual.json').then(setPower);
    loadJSON('gibs_country_annual.json').then(setGibs).catch(() => setGibs({}));
  }, []);
  const glob = useGlobalTrends(power, gibs);
  const sorted = useMemo(() => countries?.list.filter((c) => c.area > 300).slice().sort((a, b) => pick(a.name).localeCompare(pick(b.name), lang)) || [], [countries, lang]);
  const A = countries?.byId.get(s.selA), B = countries?.byId.get(s.selB);
  const rowsFor = (cid) => {
    const res = {};
    for (const g of GROUPS) for (const id of g.ids) {
      const ser = seriesOf(id, cid, power, gibs);
      res[id] = { ser, an: ser ? analyse(ser.years, ser.values) : null };
    }
    return res;
  };
  const rA = useMemo(() => (A && power && gibs ? rowsFor(A.id) : null), [A, power, gibs]);
  const rB = useMemo(() => (B && power && gibs ? rowsFor(B.id) : null), [B, power, gibs]);
  if (!countries || !power || !glob) return <p className="muted">{t('loading')}</p>;

  const issuesFor = (cid, rows) => {
    if (!rows) return null;
    const bad = [], good = [];
    for (const [id, { an }] of Object.entries(rows)) {
      const sign = BAD[id];
      if (!an || !an.significant || !sign || !ISSUE[id]) continue;
      const v = VARIABLES[id];
      const u = unitText(v, lang);
      const worse = Math.sign(an.perDecade) === sign;
      const pct = percentile(glob[id] || {}, cid, sign);
      const share = pct != null ? Math.round((worse ? pct : 1 - pct) * 100) : null;
      const label = worse ? ISSUE[id][0] : ISSUE[id][1];
      if (!label) continue;
      const text = `${pick(label)}: ${an.perDecade > 0 ? '+' : ''}${num(an.perDecade, v.digits + 1, lang)} ${u} / 10 ${uk ? 'р.' : 'yr'}` +
        (share != null && worse ? (uk ? ` — швидше, ніж у ${share} % країн` : ` — faster than in ${share}% of countries`) : '');
      (worse ? bad : good).push({ id, text, score: share ?? 0 });
    }
    bad.sort((x, y) => y.score - x.score);
    return { bad: bad.slice(0, 5), good: good.slice(0, 4) };
  };
  const iA = A ? issuesFor(A.id, rA) : null, iB = B ? issuesFor(B.id, rB) : null;

  return (
    <div className="countries">
      <p className="muted small">{uk
        ? 'Обери дві країни у списках або кліком на карті (кнопка-приціл). Нижче — коротке зведення, а ще нижче — усі показники з графіками.'
        : 'Pick two countries from the lists or by clicking the map (crosshair button). Below is a short summary, and further down every indicator with charts.'}</p>
      <div className="duo">
        <CountryColumn k="a" c={A} sorted={sorted} />
        <CountryColumn k="b" c={B} sorted={sorted} />
      </div>

      <section className="card summary">
        <h4 className="sum-title bad"><AlertTriangle size={16} strokeWidth={STROKE} /> {uk ? 'Головні виклики' : 'Main challenges'}</h4>
        <div className="duo">
          <IssueList kind="bad" items={iA?.bad} empty={uk ? 'Значущих погіршень не знайдено.' : 'No significant worsening found.'} />
          <IssueList kind="bad" items={iB?.bad} empty={uk ? 'Значущих погіршень не знайдено.' : 'No significant worsening found.'} />
        </div>
        <h4 className="sum-title good"><TrendingUp size={16} strokeWidth={STROKE} /> {uk ? 'Позитивні тренди' : 'Positive trends'}</h4>
        <div className="duo">
          <IssueList kind="good" items={iA?.good} empty={uk ? 'Поки немає.' : 'None yet.'} />
          <IssueList kind="good" items={iB?.good} empty={uk ? 'Поки немає.' : 'None yet.'} />
        </div>
        <p className="muted small">{uk
          ? 'Лише статистично значущі тренди (нахил Сена, модифікований тест Манна–Кендалла, p < 0,05).'
          : 'Only statistically significant trends (Sen’s slope, modified Mann–Kendall test, p < 0.05).'}</p>
      </section>

      <details className="acc deep">
        <summary>
          <Microscope size={17} strokeWidth={STROKE} className="acc-icon" />
          <span>{uk ? 'Детальне дослідження та графіки показників' : 'Detailed study and indicator charts'}</span>
          <ChevronRight size={16} strokeWidth={STROKE} className="chev" />
        </summary>
        <p className="muted small">{uk
          ? 'Середнє за останні 10 років і тренд за десятиліття. * — тренд статистично значущий. Кнопка «Графік» відкриває графік, прогноз, пояснення й формули прямо тут.'
          : 'Last-10-year mean and the trend per decade. * — the trend is statistically significant. “Chart” opens the chart, forecast, explanation and formulas right here.'}</p>
        <table className="stat-table report-table">
          <thead>
            <tr>
              <th>{uk ? 'Показник' : 'Indicator'}</th>
              <th className="sel-a">{A && pick(A.name)}</th>
              <th className="sel-b">{B && pick(B.name)}</th>
            </tr>
          </thead>
          <tbody>
            {GROUPS.map((g) => [
              <tr key={g.title.en} className="group-row"><td colSpan={3}>{pick(g.title)}</td></tr>,
              ...g.ids.map((id) => <IndicatorRow key={id} id={id} a={rA?.[id]} b={rB?.[id]} A={A} B={B} />),
            ])}
          </tbody>
        </table>
      </details>
      <p className="muted small">{uk
        ? 'Джерела: NASA POWER (клімат, ґрунт), NASA GIBS: MODIS (NDVI, температура поверхні) і MERRA-2 (пил, аерозолі, SO₂), розшифровані за офіційними палітрами. Знімки країн — NASA Blue Marble і Black Marble.'
        : 'Sources: NASA POWER (climate, soil), NASA GIBS: MODIS (NDVI, land surface temperature) and MERRA-2 (dust, aerosols, SO₂) decoded with the official colour maps. Country pictures — NASA Blue Marble and Black Marble.'}</p>
    </div>
  );
}
