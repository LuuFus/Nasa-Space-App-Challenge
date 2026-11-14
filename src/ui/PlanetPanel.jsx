import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../state/store.js';
import { useT } from '../i18n/index.js';
import { loadJSON } from '../lib/data.js';
import { analyse, forecast, movingAverage } from '../lib/stats.js';
import { num } from '../lib/explain.js';
import Chart from './Chart.jsx';
import Formula, { Term } from './Formula.jsx';
import { suggestContourMap } from './ConsentPrompt.jsx';
import { showTrendMap } from './TrendMaps.jsx';

const CHARTS = {
  gistemp: {
    title: { uk: 'Температура планети (GISTEMP, з 1880)', en: 'Planet temperature (GISTEMP, since 1880)' },
    unit: '°C', digits: 2, trendFrom: 1975, term: 'gistemp',
    marks: [[1991, { uk: 'Пінатубо', en: 'Pinatubo' }], [1998, { uk: 'Ель-Ніньйо', en: 'El Niño' }], [2016, { uk: 'Ель-Ніньйо', en: 'El Niño' }], [2024, { uk: 'рекорд', en: 'record' }]],
    text: (an, lang) => lang === 'uk'
      ? `Це відхилення середньої температури всієї Землі від норми 1951–1980 років. Після 1975 року планета тепліє на ${num(an.perDecade, 2, lang)} °C кожні 10 років. Останні 10 років — найтепліші за всю історію вимірювань. Ямка після 1991 року — це виверження вулкана Пінатубо, а піки — роки Ель-Ніньйо.`
      : `This is how much the whole Earth’s average temperature differs from the 1951–1980 normal. Since 1975 the planet has warmed by ${num(an.perDecade, 2, lang)} °C every decade. The last 10 years are the warmest on record. The dip after 1991 is the Pinatubo eruption; the peaks are El Niño years.`,
    map: { id: 't2m_anom', reason: { uk: 'Потепління — глобальне явище. На контурній карті видно, які частини світу нагрілися найбільше.', en: 'Warming is global. The contour map shows which parts of the world warmed most.' } },
  },
  co2: {
    title: { uk: 'CO₂ в атмосфері (Мауна-Лоа)', en: 'CO₂ in the air (Mauna Loa)' },
    unit: 'ppm', digits: 1, term: 'co2_ppm',
    text: (an, lang) => lang === 'uk'
      ? `Концентрація вуглекислого газу зростає щороку — у середньому на ${num(an.perDecade / 10, 2, lang)} ppm за рік. До промислової революції було ~280 ppm, зараз — понад 420. Це головна причина потепління.`
      : `Carbon dioxide grows every year — on average by ${num(an.perDecade / 10, 2, lang)} ppm per year. Before the industrial revolution it was ~280 ppm, now it is over 420. This is the main cause of warming.`,
  },
  ozone_area: {
    title: { uk: 'Площа озонової діри (вересень–жовтень)', en: 'Ozone hole area (September–October)' },
    unit: { uk: 'млн км²', en: 'million km²' }, digits: 1, trendFrom: 2000, term: 'ozone',
    text: (an, lang) => lang === 'uk'
      ? `Діра росла до кінця 1990-х, поки діяли фреони. Після заборони (Монреальський протокол, 1987) з 2000 року тренд ${an.perDecade < 0 ? 'спадний' : 'ще не спадний'}: ${num(an.perDecade, 2, lang)} млн км² за 10 років. Озон відновлюється повільно — повністю очікують до ~2066 року.`
      : `The hole grew until the late 1990s while CFCs were in use. After the ban (Montreal Protocol, 1987) the trend since 2000 is ${an.perDecade < 0 ? 'downward' : 'not yet downward'}: ${num(an.perDecade, 2, lang)} million km² per decade. Ozone recovers slowly — full recovery is expected around 2066.`,
    layer: 'ozone',
  },
  arctic_ice: {
    title: { uk: 'Арктичний лід у вересні', en: 'Arctic sea ice in September' },
    unit: { uk: 'млн км²', en: 'million km²' }, digits: 2, term: 'sea_ice_extent',
    text: (an, lang) => lang === 'uk'
      ? `Площа льоду в кінці літа зменшується на ${num(Math.abs(an.perDecade), 2, lang)} млн км² за 10 років — це приблизно ${Math.round(Math.abs(an.perDecade) / 0.6037)} площі України кожні 10 років. Рекорд мінімуму — 2012 рік.`
      : `Late-summer ice shrinks by ${num(Math.abs(an.perDecade), 2, lang)} million km² per decade — about ${Math.round(Math.abs(an.perDecade) / 0.6037)} times the area of Ukraine every decade. The record low was in 2012.`,
    layer: 'seaice',
  },
  fires_ua: {
    title: { uk: 'Пожежі в Україні: прифронтові області та решта', en: 'Fires in Ukraine: front-line oblasts vs the rest' },
    unit: { uk: 'пожеж', en: 'fires' }, digits: 0, term: 'firms',
  },
};

export default function PlanetPanel() {
  const { t, pick, lang } = useT();
  const chartId = useStore((s) => s.planetChart) || 'gistemp';
  const setChart = (id) => useStore.setState({ planetChart: id });
  const [data, setData] = useState(null);
  const [firms, setFirms] = useState(null);
  useEffect(() => { loadJSON('global.json').then(setData); loadJSON('firms_ukraine.json').then(setFirms).catch(() => {}); }, []);
  const C = CHARTS[chartId];
  const ser = data?.[chartId];
  const an = useMemo(() => {
    if (!ser) return null;
    const from = C.trendFrom ?? ser.years[0];
    const idx = ser.years.map((y, i) => (y >= from ? i : -1)).filter((i) => i >= 0);
    return analyse(idx.map((i) => ser.years[i]), idx.map((i) => ser.values[i]));
  }, [ser, chartId]);
  const option = useMemo(() => {
    if (chartId === 'fires_ua') return firms ? firesOption(firms, lang) : null;
    if (!ser || !an) return null;
    return seriesOption(ser, an, C, lang, t);
  }, [ser, an, firms, chartId, lang]);
  const u = typeof C.unit === 'string' ? C.unit : C.unit[lang];
  return (
    <div>
      <h3>{t('planet')}</h3>
      <div className="list">
        {Object.entries(CHARTS).map(([id, c]) => (
          <button key={id} className={chartId === id ? 'item on' : 'item'} onClick={() => setChart(id)}>{pick(c.title)}</button>
        ))}
      </div>
      {option && <Chart option={option} height={300} />}
      {chartId !== 'fires_ua' && an && (
        <>
          <div className="explain"><b>{t('whatItMeans')}</b><p>{C.text(an, lang)}</p>
            <p className="small">{lang === 'uk' ? 'Тренд' : 'Trend'}: {num(an.perDecade, C.digits + 1, lang)} {u} / 10 {lang === 'uk' ? 'р.' : 'yr'} · <Term id="mann_kendall">Mann–Kendall</Term> p {an.mk?.p < 0.001 ? '< 0.001' : num(an.mk?.p, 3, lang)} · <Term id="r_squared">R²</Term> = {num(an.lr.r2, 2, lang)}</p>
            {(() => { const f = forecast(an.lr, 2050); return f && <p className="small">{lang === 'uk' ? 'Якщо тенденція збережеться, у 2050 році' : 'If the trend continues, in 2050'}: ≈ {num(f.y, C.digits, lang)} {u} ({num(f.lo, C.digits, lang)} … {num(f.hi, C.digits, lang)}).</p>; })()}
          </div>
          <Formula tex={`\\hat y = a + b\\,x,\\quad b = ${num(an.lr.slope, 4, 'en')}\\ \\text{per year}`} />
          <div className="row">
            {C.map && <button onClick={() => suggestContourMap(C.map.reason, () => showTrendMap(C.map.id))}>🗺 {lang === 'uk' ? 'Показати на карті світу' : 'Show on the world map'}</button>}
            {C.layer && <button onClick={() => useStore.getState().setOverlay(C.layer)}>🗺 {lang === 'uk' ? 'Шар NASA на глобусі' : 'NASA layer on the globe'}</button>}
          </div>
          <p className="muted small">{t('source')}: {ser.source}</p>
        </>
      )}
      {chartId === 'fires_ua' && firms && <FiresText firms={firms} />}
    </div>
  );
}

function FiresText({ firms }) {
  const { lang } = useT();
  const share = (i) => firms.front[i] / Math.max(1, firms.total[i]);
  const iy = (y) => firms.years.indexOf(y);
  const s21 = share(iy(2021)), s23 = share(iy(2023)), s24 = share(iy(2024));
  const pct = (x) => `${Math.round(x * 100)} %`;
  // summer (Jun–Sep) detections in the front-line oblasts
  const summer = (i) => firms.monthlyFront[i].slice(5, 9).reduce((a, b) => a + b, 0);
  const pre = [2015, 2016, 2017, 2018, 2019, 2020, 2021].map((y) => summer(iy(y)));
  const preAvg = pre.reduce((a, b) => a + b, 0) / pre.length;
  const war = [2022, 2023, 2024, 2025].map((y) => summer(iy(y)));
  const uk = lang === 'uk';
  return (
    <div className="explain">
      <b>{uk ? 'Що це означає простими словами' : 'What it means in plain words'}</b>
      <p>{uk
        ? `Найбільше пожеж в Україні завжди давало спалювання стерні й сухої трави навесні та восени (це заборонено, штраф за ст. 77-1 КУпАП). З роками його стало менше, тож загальна кількість пожеж падає. Але з початком повномасштабної війни змінилося, ДЕ горить: частка п’яти прифронтових областей (Донецька, Луганська, Харківська, Запорізька, Херсонська) зросла з ${pct(s21)} у 2021 році до ${pct(s23)} у 2023 та ${pct(s24)} у 2024.`
        : `Most fires in Ukraine have always come from burning stubble and dry grass in spring and autumn (illegal, fined under the Code of Administrative Offences, art. 77-1). That burning has declined, so the total number of fires is falling. But since the full-scale war began, WHERE things burn has changed: the share of the five front-line oblasts (Donetsk, Luhansk, Kharkiv, Zaporizhzhia, Kherson) rose from ${pct(s21)} in 2021 to ${pct(s23)} in 2023 and ${pct(s24)} in 2024.`}</p>
      <p>{uk
        ? `Влітку (червень–вересень), коли поля зазвичай не палять, у прифронтових областях у 2015–2021 роках було в середньому ${Math.round(preAvg)} пожеж, а у 2022–2025: ${war.join(', ')}. Літні пожежі вздовж фронту — це здебільшого наслідки обстрілів: горять поля пшениці, ліси, степ.`
        : `In summer (June–September), when fields are not usually burned, the front-line oblasts averaged ${Math.round(preAvg)} fires in 2015–2021, and in 2022–2025: ${war.join(', ')}. Summer fires along the front are mostly caused by shelling: wheat fields, forests and steppe burn.`}</p>
      <p className="small muted">{uk ? 'Обережно з висновками: супутник бачить вогонь, але не знає його причини; частина цих областей окупована, і дані там ніхто не перевіряє на землі.' : 'Careful with conclusions: the satellite sees fire but not its cause; parts of these oblasts are occupied and nobody can verify on the ground.'}</p>
      <p className="muted small">{firms.source}</p>
    </div>
  );
}

function seriesOption(ser, an, C, lang, t) {
  const u = typeof C.unit === 'string' ? C.unit : C.unit[lang];
  const data = ser.years.map((y, i) => [y, ser.values[i]]);
  const ma = movingAverage(ser.values, 5);
  const lr = an.lr;
  const H = 2050;
  const band = [];
  for (let y = an.last; y <= H; y++) { const f = forecast(lr, y); band.push([y, f.y, f.lo, f.hi]); }
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', valueFormatter: (x) => (x == null ? '—' : `${num(x, C.digits + 1, lang)} ${u}`) },
    legend: { top: 4, textStyle: { fontSize: 11 } },
    grid: { left: 48, right: 14, top: 40, bottom: 58 },
    xAxis: { type: 'value', min: ser.years[0], max: H, minInterval: 1, axisLabel: { formatter: String }, splitLine: { show: false } },
    yAxis: { type: 'value', scale: true, name: u },
    dataZoom: [{ type: 'inside' }, { type: 'slider', height: 18, bottom: 8 }],
    series: [
      { name: lang === 'uk' ? 'Дані' : 'Data', type: 'line', data, symbolSize: 3, color: '#4cc9f0',
        markPoint: C.marks ? { symbolSize: 34, label: { fontSize: 9 }, data: C.marks.map(([y, lbl]) => ({ coord: [y, ser.values[ser.years.indexOf(y)]], value: lbl[lang] })).filter((m) => m.coord[1] != null) } : undefined },
      { name: lang === 'uk' ? 'Середнє за 5 років' : '5-year average', type: 'line', data: ser.years.map((y, i) => [y, ma[i]]), symbol: 'none', color: '#ffd166', lineStyle: { width: 2 } },
      { name: t('trend'), type: 'line', data: [[an.first, lr.intercept + lr.slope * an.first], [an.last, lr.intercept + lr.slope * an.last]], symbol: 'none', color: '#ff6b6b', lineStyle: { type: 'dashed' } },
      { name: t('forecast'), type: 'line', data: band.map((b) => [b[0], b[1]]), symbol: 'none', color: '#ff6b6b', lineStyle: { type: 'dotted' } },
      { name: t('forecast'), type: 'line', data: band.map((b) => [b[0], b[2]]), stack: 'b', symbol: 'none', lineStyle: { opacity: 0 }, color: '#ff6b6b', tooltip: { show: false } },
      { name: t('forecast'), type: 'line', data: band.map((b) => [b[0], b[3] - b[2]]), stack: 'b', symbol: 'none', lineStyle: { opacity: 0 }, areaStyle: { color: '#ff6b6b', opacity: 0.12 }, color: '#ff6b6b', tooltip: { show: false } },
    ],
  };
}

function firesOption(f, lang) {
  const uk = lang === 'uk';
  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: { top: 4, textStyle: { fontSize: 11 } },
    grid: { left: 52, right: 44, top: 40, bottom: 58 },
    xAxis: { type: 'category', data: f.years.map(String) },
    yAxis: [{ type: 'value', name: uk ? 'пожеж' : 'fires' }, { type: 'value', name: '%', max: 100, splitLine: { show: false } }],
    dataZoom: [{ type: 'inside' }, { type: 'slider', height: 18, bottom: 8 }],
    series: [
      { name: uk ? 'Прифронтові області' : 'Front-line oblasts', type: 'bar', stack: 'f', data: f.front, color: '#ff6b6b' },
      { name: uk ? 'Решта України' : 'Rest of Ukraine', type: 'bar', stack: 'f', data: f.rest, color: '#5c7cfa' },
      { name: uk ? 'Частка прифронтових, %' : 'Front-line share, %', type: 'line', yAxisIndex: 1, data: f.front.map((x, i) => Math.round((100 * x) / Math.max(1, f.total[i]))), color: '#ffd166',
        markArea: { itemStyle: { color: 'rgba(255,209,102,0.08)' }, data: [[{ xAxis: '2022' }, { xAxis: String(f.years[f.years.length - 1]) }]] } },
    ],
  };
}
