import { useEffect, useMemo, useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { useT } from '../i18n/index.js';
import { loadJSON } from '../lib/data.js';
import { num } from '../lib/explain.js';
import Chart from './Chart.jsx';

// "Why did it happen?" — NASA POWER weather at the place, compared with the
// 1991–2020 normal: the year before the event (by month) and the last 60 days.

const P = {
  T2M_MAX: { uk: 'Денна максимальна температура', en: 'Daily maximum temperature', unit: '°C', mode: 'diff' },
  PRECTOTCORR: { uk: 'Опади', en: 'Precipitation', unit: { uk: 'мм/добу', en: 'mm/day' }, mode: 'pct' },
  GWETROOT: { uk: 'Вологість ґрунту', en: 'Soil moisture', unit: '%', mode: 'diff', scale: 100 },
  RH2M: { uk: 'Вологість повітря', en: 'Air humidity', unit: '%', mode: 'diff' },
  WS2M: { uk: 'Вітер', en: 'Wind', unit: { uk: 'м/с', en: 'm/s' }, mode: 'diff' },
  PRECSNOLAND: { uk: 'Снігопад', en: 'Snowfall', unit: { uk: 'мм/добу', en: 'mm/day' }, mode: 'pct' },
};
const KIND_PARAMS = {
  fire: ['T2M_MAX', 'PRECTOTCORR', 'GWETROOT', 'RH2M', 'WS2M'],
  heat: ['T2M_MAX', 'GWETROOT', 'RH2M', 'PRECTOTCORR'],
  hurricane: ['PRECTOTCORR', 'WS2M', 'RH2M'],
  drought: ['PRECSNOLAND', 'T2M_MAX', 'PRECTOTCORR', 'GWETROOT'],
  flood: ['PRECTOTCORR', 'GWETROOT', 'RH2M'],
};
const MONTHS = {
  uk: ['січень', 'лютий', 'березень', 'квітень', 'травень', 'червень', 'липень', 'серпень', 'вересень', 'жовтень', 'листопад', 'грудень'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};
const MONTHS_IN = ['січні', 'лютому', 'березні', 'квітні', 'травні', 'червні', 'липні', 'серпні', 'вересні', 'жовтні', 'листопаді', 'грудні'];
const u = (p, lang) => (typeof P[p].unit === 'string' ? P[p].unit : P[p].unit[lang]);
const mname = (ym, lang) => MONTHS[lang][+ym.slice(5) - 1];
const rankText = (r, lang, low) => {
  if (!r) return '';
  const n = low ? r.rankLow : r.years - r.rankLow + 1;
  if (lang === 'uk') return n === 1 ? `рекорд за ${r.years} років` : `${n}-й за ${r.years} років`;
  return n === 1 ? `a record in ${r.years} years` : `#${n} in ${r.years} years`;
};

function explainCauses(c, lang) {
  const uk = lang === 'uk';
  const evm = c.date.slice(0, 7);
  const row = c.months.find((r) => r.month === evm) || c.months[c.months.length - 1];
  const before = c.months.filter((r) => r.month < evm).slice(-3);
  const pct = (p, rows) => {
    const v = rows.reduce((a, r) => a + (r[p]?.value ?? 0), 0), n = rows.reduce((a, r) => a + (r[p]?.normal ?? 0), 0);
    return n > 0 ? Math.round((v / n) * 100) : null;
  };
  const daysBefore = c.days.filter((d) => d.date < c.date).slice(-14);
  const maxWind = Math.max(0, ...daysBefore.map((d) => d.WS2M ?? 0));
  const out = [];
  const m = mname(evm, lang);
  const mIn = uk ? MONTHS_IN[+evm.slice(5) - 1] : m;
  const t = row.T2M_MAX, pr = row.PRECTOTCORR, so = row.GWETROOT, rh = row.RH2M;
  if (c.kind === 'fire' || c.kind === 'heat') {
    if (t) out.push(uk
      ? `Спека: у ${mIn} денний максимум був у середньому ${num(t.value, 1, lang)} °C — на ${num(t.value - t.normal, 1, lang)} °C вище норми (${rankText(t, lang, false)} — найтепліший).`
      : `Heat: in ${m} the daily maximum averaged ${num(t.value, 1, lang)} °C — ${num(t.value - t.normal, 1, lang)} °C above normal (${rankText(t, lang, false)} — warmest).`);
    const p3 = pct('PRECTOTCORR', before.concat([row]));
    if (p3 != null) out.push(uk
      ? `Посуха: за останні місяці випало лише ${p3} % звичайної кількості опадів.`
      : `Drought: the last months brought only ${p3}% of the usual precipitation.`);
    if (so) out.push(uk
      ? `Ґрунт: вологість кореневої зони ${num(so.value * 100, 0, lang)} % проти норми ${num(so.normal * 100, 0, lang)} % (${rankText(so, lang, true)} — найсухіший). Сухий ґрунт не охолоджує повітря випаровуванням, тож спека посилюється.`
      : `Soil: root-zone moisture ${num(so.value * 100, 0, lang)}% vs a normal ${num(so.normal * 100, 0, lang)}% (${rankText(so, lang, true)} — driest). Dry soil cannot cool the air by evaporation, so the heat grows.`);
    if (rh) out.push(uk
      ? `Сухе повітря: відносна вологість ${num(rh.value, 0, lang)} % (норма ${num(rh.normal, 0, lang)} %) — трава й гілки висихають і спалахують від іскри.`
      : `Dry air: relative humidity ${num(rh.value, 0, lang)}% (normal ${num(rh.normal, 0, lang)}%) — grass and twigs dry out and ignite from a spark.`);
    if (c.kind === 'fire' && maxWind) out.push(uk
      ? `Вітер: за два тижні до пожежі середньодобовий вітер сягав ${num(maxWind, 1, lang)} м/с (пориви — значно сильніші): він розносить іскри й жене вогонь.`
      : `Wind: in the two weeks before, daily mean wind reached ${num(maxWind, 1, lang)} m/s (gusts much stronger): it spreads sparks and drives the fire.`);
    out.push(uk
      ? (c.kind === 'fire' ? 'Разом: спека + посуха + сухе повітря + вітер = «паливо» готове, і будь-яка іскра (людина, блискавка, лінія електропередач) перетворюється на велику пожежу.' : 'Разом: «купол спеки» (антициклон) затримав гаряче повітря, а сухий ґрунт ще більше його нагрів — тому температура побила рекорди.')
      : (c.kind === 'fire' ? 'Together: heat + drought + dry air + wind = the fuel is ready, and any spark (people, lightning, power lines) becomes a huge fire.' : 'Together: a “heat dome” (high pressure) trapped hot air, and dry soil heated it further — so temperatures broke records.'));
  }
  if (c.kind === 'hurricane' && pr) {
    const wet = Math.max(...c.days.filter((d) => d.date >= c.date).slice(0, 5).map((d) => d.PRECTOTCORR ?? 0));
    out.push(uk
      ? `Злива: у день проходження урагану випало до ${num(wet, 0, lang)} мм за добу; середнє за ${m} — ${num(pr.value, 1, lang)} мм/добу проти норми ${num(pr.normal, 1, lang)} (${rankText(pr, lang, false)} — найвологіший).`
      : `Downpour: up to ${num(wet, 0, lang)} mm fell in a day as the hurricane passed; the ${m} average was ${num(pr.value, 1, lang)} mm/day vs a normal ${num(pr.normal, 1, lang)} (${rankText(pr, lang, false)} — wettest).`);
    out.push(uk
      ? 'Чому так сильно: ураган живиться теплою водою. На шарі «Аномалія температури океану» видно, що Мексиканська затока перед ураганом була тепліша за норму — більше пари, більше енергії та дощу.'
      : 'Why so strong: hurricanes feed on warm water. The “Sea surface temperature anomaly” layer shows the Gulf of Mexico warmer than normal before the storm — more vapour, more energy and rain.');
  }
  if (c.kind === 'drought') {
    const winter = c.months.filter((r) => ['11', '12', '01', '02', '03', '04'].includes(r.month.slice(5)) && r.month < evm).slice(-6);
    const ps = pct('PRECSNOLAND', winter);
    const spring = c.months.filter((r) => ['03', '04', '05'].includes(r.month.slice(5)) && r.month < evm);
    const dT = spring.length ? spring.reduce((a, r) => a + ((r.T2M_MAX?.value ?? 0) - (r.T2M_MAX?.normal ?? 0)), 0) / spring.length : null;
    if (ps != null) out.push(uk
      ? `Сніжна посуха: у Скелястих горах (верхів'я річки Колорадо) узимку 2025–2026 випало лише ${ps} % звичайного снігу.`
      : `Snow drought: the Rocky Mountains (upper Colorado River) got only ${ps}% of their usual winter snow in 2025–2026.`);
    if (dT != null) out.push(uk
      ? `Тепла весна: денні максимуми навесні були в середньому на ${num(dT, 1, lang)} °C вищими за норму — сніг танув рано й випаровувався.`
      : `Warm spring: spring daytime highs averaged ${num(dT, 1, lang)} °C above normal — snow melted early and evaporated.`);
    out.push(uk
      ? 'Разом: мало снігу → мало талої води в річці Колорадо → озеро Пауелл не наповнилося, а воду з нього й далі забирали для міст і полів.'
      : 'Together: little snow → little meltwater in the Colorado River → Lake Powell did not refill while water kept being taken for cities and farms.');
  }
  if (c.kind === 'flood') {
    const last30 = c.days.filter((d) => d.date <= c.date).slice(-30);
    const sum = last30.reduce((a, d) => a + (d.PRECTOTCORR ?? 0), 0), norm = last30.reduce((a, d) => a + (d.PRECTOTCORR_n ?? 0), 0);
    const maxd = Math.max(...last30.map((d) => d.PRECTOTCORR ?? 0));
    out.push(uk
      ? `Злива за зливою: за 30 днів перед знімком випало ${num(sum, 0, lang)} мм опадів — ${norm > 0 ? num(sum / norm, 1, lang) + ' раза' : ''} більше норми (${num(norm, 0, lang)} мм); найсильніший день — ${num(maxd, 0, lang)} мм.`
      : `Rain after rain: ${num(sum, 0, lang)} mm fell in the 30 days before the image — ${norm > 0 ? num(sum / norm, 1, lang) + ' times' : ''} the normal (${num(norm, 0, lang)} mm); the wettest day brought ${num(maxd, 0, lang)} mm.`);
    out.push(uk
      ? 'Ґрунт уже був насичений водою, тож новий дощ не вбирався, а стікав у річки — вони вийшли з берегів. Тепла вода Сіамської затоки давала хмарам багато вологи.'
      : 'The soil was already soaked, so new rain ran off into rivers instead of sinking in — they burst their banks. The warm Gulf of Thailand fed the clouds with moisture.');
  }
  return out;
}

export default function CausesPanel({ eventId }) {
  const { lang } = useT();
  const uk = lang === 'uk';
  const [c, setC] = useState(null);
  const [param, setParam] = useState(null);
  useEffect(() => { loadJSON(`causes/${eventId}.json`).then((d) => { setC(d); setParam(KIND_PARAMS[d.kind][0]); }).catch(() => setC(null)); }, [eventId]);
  const text = useMemo(() => (c ? explainCauses(c, lang) : []), [c, lang]);
  const opts = useMemo(() => {
    if (!c || !param) return null;
    const meta = P[param];
    const sc = meta.scale || 1;
    const monthsOpt = {
      backgroundColor: 'transparent',
      title: { text: uk ? 'Місяці перед подією: відхилення від норми 1991–2020' : 'Months before the event: departure from the 1991–2020 normal', textStyle: { fontSize: 11, color: '#c7d1e3' }, left: 4, top: 2 },
      tooltip: { trigger: 'axis' },
      grid: { left: 44, right: 10, top: 30, bottom: 26 },
      xAxis: { type: 'category', data: c.months.map((r) => r.month), axisLabel: { fontSize: 10 } },
      yAxis: { type: 'value', name: meta.mode === 'pct' ? '% норми' : `Δ ${u(param, lang)}`, nameTextStyle: { fontSize: 10 } },
      series: [{
        type: 'bar',
        data: c.months.map((r) => {
          const x = r[param];
          if (!x) return null;
          const v = meta.mode === 'pct' ? (x.normal > 0 ? Math.round((x.value / x.normal) * 100) : null) : +((x.value - x.normal) * sc).toFixed(2);
          const bad = meta.mode === 'pct' ? (c.kind === 'flood' || c.kind === 'hurricane' ? v > 100 : v < 100) : (param === 'T2M_MAX' ? v > 0 : param === 'WS2M' ? v > 0 : v < 0);
          return { value: v, itemStyle: { color: r.month === c.date.slice(0, 7) ? '#ffd166' : bad ? '#ff6b6b' : '#4cc9f0' } };
        }),
        markLine: meta.mode === 'pct' ? { symbol: 'none', data: [{ yAxis: 100 }], lineStyle: { color: '#fff', type: 'dashed' } } : undefined,
      }],
    };
    const days = c.days;
    const daysOpt = {
      backgroundColor: 'transparent',
      title: { text: uk ? '60 днів до події і 15 після (пунктир — норма)' : '60 days before and 15 after (dashed — normal)', textStyle: { fontSize: 11, color: '#c7d1e3' }, left: 4, top: 2 },
      tooltip: { trigger: 'axis' },
      grid: { left: 44, right: 10, top: 30, bottom: 26 },
      xAxis: { type: 'category', data: days.map((d) => d.date.slice(5)), axisLabel: { fontSize: 10 } },
      yAxis: { type: 'value', name: u(param, lang), nameTextStyle: { fontSize: 10 }, scale: true },
      series: [
        { name: uk ? 'Факт' : 'Actual', type: param === 'PRECTOTCORR' || param === 'PRECSNOLAND' ? 'bar' : 'line', symbol: 'none', color: '#ff9f1c', data: days.map((d) => (d[param] != null ? +(d[param] * sc).toFixed(2) : null)),
          markLine: { symbol: 'none', label: { formatter: uk ? 'подія' : 'event', fontSize: 10 }, lineStyle: { color: '#fff' }, data: [{ xAxis: c.date.slice(5) }] } },
        { name: uk ? 'Норма' : 'Normal', type: 'line', symbol: 'none', color: '#8fb4ff', lineStyle: { type: 'dashed' }, data: days.map((d) => (d[param + '_n'] != null ? +(d[param + '_n'] * sc).toFixed(2) : null)) },
      ],
    };
    return { monthsOpt, daysOpt };
  }, [c, param, lang]);
  if (!c) return null;
  return (
    <div className="causes">
      <h4 className="with-icon"><HelpCircle size={16} strokeWidth={1.75} /> {uk ? 'Чому це сталося — що пішло не так' : 'Why it happened — what went wrong'}</h4>
      <div className="explain">{text.map((p, i) => <p key={i}>{p}</p>)}</div>
      <div className="row small">
        {KIND_PARAMS[c.kind].map((p) => <button key={p} className={param === p ? 'on' : ''} onClick={() => setParam(p)}>{P[p][lang]}</button>)}
      </div>
      {opts && <Chart option={opts.monthsOpt} height={190} />}
      {opts && <Chart option={opts.daysOpt} height={190} />}
      <p className="muted small">{c.source}. {uk ? 'Точка' : 'Point'}: {c.point[1].toFixed(2)}°, {c.point[0].toFixed(2)}°.</p>
    </div>
  );
}
