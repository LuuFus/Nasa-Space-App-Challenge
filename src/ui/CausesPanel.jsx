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
// How far from the normal is "noticeable", "strong" and "dangerous" — rough
// thresholds used by weather services for heat waves and droughts, written for students.
// `bad`: +1 = above the normal is the problem (heat, wind, flood rain), -1 = below.
const LEVELS = [
  { color: '#5b8def', uk: 'близько до норми', en: 'close to normal' },
  { color: '#f2c94c', uk: 'помітно', en: 'noticeable' },
  { color: '#f2994a', uk: 'сильно', en: 'strong' },
  { color: '#eb5757', uk: 'небезпечно', en: 'dangerous' },
];
const SCALE = {
  T2M_MAX: { bad: 1, th: [1, 2.5, 4],
    what: { uk: 'на скільки градусів денний максимум був вищим (+) чи нижчим (−) за звичайний для цього місяця', en: 'how many degrees the daily maximum was above (+) or below (−) the usual for the month' },
    risk: { uk: 'Від +2,5 °C — хвиля спеки: тепловий удар у людей, рослини в’януть. Від +4 °C — небезпечна спека: рекорди, лісові пожежі, перевантаження енергосистеми.', en: 'From +2.5 °C — a heat wave: heat stroke, wilting plants. From +4 °C — dangerous heat: records, wildfires, overloaded power grids.' } },
  PRECTOTCORR: { bad: -1, pct: true, th: [90, 70, 50], wet: [130, 170, 250],
    what: { uk: 'скільки відсотків від звичайної кількості опадів випало (100 % — рівно норма)', en: 'what percent of the usual rain fell (100% = exactly normal)' },
    risk: { uk: 'Менше 70 % — посуха: висихають ґрунт і трава. Менше 50 % — сильна посуха: неврожай, пожежі, міліють річки. Для повеней навпаки: понад 170 % — ґрунт не встигає вбирати воду.', en: 'Below 70% — drought: soil and grass dry out. Below 50% — severe drought: crop failure, fires, shallow rivers. For floods it is the other way: above 170% the soil cannot soak up the water.' } },
  GWETROOT: { bad: -1, th: [-3, -7, -12],
    what: { uk: 'на скільки процентних пунктів ґрунт на глибині коренів був сухішим (−) чи вологішим (+) за норму', en: 'how many percentage points the root-zone soil was drier (−) or wetter (+) than normal' },
    risk: { uk: 'Від −7 — посуха ґрунту: рослинам бракує води, трава й ліс легко займаються. Від −12 — небезпечно: неврожай, загибель лісу, великі пожежі.', en: 'From −7 — soil drought: plants lack water, grass and forest catch fire easily. From −12 — dangerous: crop failure, dying forests, big fires.' } },
  RH2M: { bad: -1, th: [-3, -7, -12],
    what: { uk: 'на скільки процентних пунктів повітря було сухішим (−) чи вологішим (+) за норму', en: 'how many percentage points the air was drier (−) or wetter (+) than normal' },
    risk: { uk: 'Від −7 — сухе повітря швидко висушує траву й гілки. Від −12 — будь-яка іскра може стати пожежею.', en: 'From −7 — dry air quickly dries grass and twigs. From −12 — any spark can become a fire.' } },
  WS2M: { bad: 1, th: [0.3, 0.7, 1.2],
    what: { uk: 'на скільки метрів за секунду вітер був сильнішим (+) чи слабшим (−) за звичайний', en: 'how many metres per second the wind was stronger (+) or weaker (−) than usual' },
    risk: { uk: 'Це середній вітер за місяць — пориви в окремі дні в кілька разів сильніші. Навіть +1 м/с у середньому означає частіші бурі й швидше поширення вогню.', en: 'This is the monthly mean wind — gusts on single days are several times stronger. Even +1 m/s on average means more storms and faster-spreading fires.' } },
  PRECSNOLAND: { bad: -1, pct: true, th: [80, 60, 40],
    what: { uk: 'скільки відсотків від звичайного снігу випало (100 % — норма)', en: 'what percent of the usual snow fell (100% = normal)' },
    risk: { uk: 'Менше 60 % — «сніжна посуха»: навесні річкам бракує талої води. Менше 40 % — небезпечно для водосховищ, полів і міст.', en: 'Below 60% — a “snow drought”: rivers lack meltwater in spring. Below 40% — dangerous for reservoirs, farms and cities.' } },
};
const WET_KINDS = new Set(['flood', 'hurricane']);
/** 0..3 — how far from the normal, in the direction that caused the event */
function level(param, v, kind) {
  const sc = SCALE[param];
  if (v == null || !sc) return 0;
  if (sc.pct) {
    if (WET_KINDS.has(kind)) return sc.wet.filter((t) => v >= t).length;
    return sc.th.filter((t) => v <= t).length;
  }
  const x = v * sc.bad;
  return sc.th.filter((t) => x >= Math.abs(t)).length;
}

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

/** what the colours and numbers of the monthly chart mean, and when it gets dangerous */
function ChartGuide({ c, param, lang }) {
  const uk = lang === 'uk';
  const sc = SCALE[param];
  if (!sc) return null;
  const ev = c.months.find((r) => r.month === c.date.slice(0, 7)) || c.months[c.months.length - 1];
  const x = ev[param];
  const k = P[param].scale || 1;
  let example = '';
  if (x) {
    const v = P[param].mode === 'pct' ? Math.round((x.value / x.normal) * 100) : (x.value - x.normal) * k;
    const valTxt = P[param].mode === 'pct' ? `${v} %` : `${v > 0 ? '+' : ''}${num(v, 1, lang)} ${u(param, lang)}`;
    example = uk
      ? `Приклад: у ${MONTHS_IN[+ev.month.slice(5) - 1]} ${ev.month.slice(0, 4)} стовпчик показує ${valTxt}: звичайно тут ${num(x.normal * k, 1, lang)} ${u(param, lang)}, а було ${num(x.value * k, 1, lang)} ${u(param, lang)}. Рівень — «${LEVELS[level(param, P[param].mode === 'pct' ? Math.round((x.value / x.normal) * 100) : +((x.value - x.normal) * k).toFixed(2), c.kind)].uk}».`
      : `Example: in ${MONTHS.en[+ev.month.slice(5) - 1]} ${ev.month.slice(0, 4)} the bar shows ${valTxt}: usually ${num(x.normal * k, 1, lang)} ${u(param, lang)}, but it was ${num(x.value * k, 1, lang)} ${u(param, lang)}. Level — “${LEVELS[level(param, P[param].mode === 'pct' ? Math.round((x.value / x.normal) * 100) : +((x.value - x.normal) * k).toFixed(2), c.kind)].en}”.`;
  }
  return (
    <div className="chart-guide">
      <div className="cg-legend">
        {LEVELS.map((l) => <span key={l.en}><i style={{ background: l.color }} />{l[lang]}</span>)}
        <span><i className="cg-event" />{uk ? 'місяць події' : 'month of the event'}</span>
      </div>
      <p><b>{uk ? 'Що означає число. ' : 'What the number means. '}</b>{uk ? 'Кожен стовпчик — один місяць; пунктир — норма (середнє 1991–2020 для цього місяця). Число — ' : 'Each bar is one month; the dashed line is the normal (the 1991–2020 average for that month). The number is '}{sc.what[lang]}.</p>
      <p><b>{uk ? 'Колір — наскільки це далеко від норми ' : 'The colour shows how far from the normal it is '}</b>{uk ? '(у бік, що спричинив подію): синій — майже норма, жовтий — помітно, помаранчевий — сильно, червоний — небезпечно.' : '(in the direction that caused the event): blue — about normal, yellow — noticeable, orange — strong, red — dangerous.'}</p>
      <p><b>{uk ? 'Наскільки небезпечно. ' : 'How dangerous. '}</b>{sc.risk[lang]}</p>
      {example && <p className="cg-example">{example}</p>}
    </div>
  );
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
    const evMonth = c.date.slice(0, 7);
    const vals = c.months.map((r) => {
      const x = r[param];
      if (!x) return null;
      return meta.mode === 'pct' ? (x.normal > 0 ? Math.round((x.value / x.normal) * 100) : null) : +((x.value - x.normal) * sc).toFixed(2);
    });
    const scl = SCALE[param];
    const unitTxt = meta.mode === 'pct' ? (uk ? '% норми' : '% of normal') : u(param, lang);
    // background bands: where "noticeable", "strong", "dangerous" begin
    const bands = [];
    if (scl) {
      const edges = scl.pct ? (WET_KINDS.has(c.kind) ? scl.wet : scl.th) : scl.th.map((t) => Math.abs(t) * scl.bad);
      edges.forEach((e0, i) => {
        const up = scl.pct ? WET_KINDS.has(c.kind) : scl.bad > 0;
        const ok = vals.filter((v) => v != null);
        const e1 = edges[i + 1] ?? (up ? Math.max(e0, ...ok) : Math.min(e0, ...ok));
        bands.push([{ yAxis: e0, itemStyle: { color: LEVELS[i + 1].color, opacity: 0.08 + i * 0.03 } }, { yAxis: e1 }]);
      });
    }
    const monthsOpt = {
      backgroundColor: 'transparent',
      title: { text: uk ? 'Місяці перед подією: відхилення від норми 1991–2020' : 'Months before the event: departure from the 1991–2020 normal', textStyle: { fontSize: 11, color: '#c7d1e3' }, left: 4, top: 2 },
      tooltip: {
        trigger: 'axis',
        formatter: (ps) => {
          const pt = (Array.isArray(ps) ? ps : [ps])[0];
          const i = pt.dataIndex, v = vals[i], r = c.months[i], x = r[param];
          if (v == null) return '';
          const lv = level(param, v, c.kind);
          const sign = meta.mode === 'pct' ? '' : v > 0 ? '+' : '';
          const norm = x ? `${uk ? 'норма' : 'normal'} ${num(x.normal * sc, 1, lang)}, ${uk ? 'було' : 'was'} ${num(x.value * sc, 1, lang)} ${u(param, lang)}` : '';
          return `<b>${mname(r.month, lang)} ${r.month.slice(0, 4)}</b>${r.month === evMonth ? (uk ? ' — місяць події' : ' — month of the event') : ''}<br/>`
            + `${sign}${num(v, meta.mode === 'pct' ? 0 : 1, lang)} ${unitTxt}<br/>${norm}<br/>`
            + `<span style="color:${LEVELS[lv].color}">● ${LEVELS[lv][lang]}</span>`;
        },
      },
      grid: { left: 44, right: 10, top: 34, bottom: 26 },
      xAxis: { type: 'category', data: c.months.map((r) => `${mname(r.month, lang).slice(0, 3)} ${r.month.slice(2, 4)}`), axisLabel: { fontSize: 10 } },
      yAxis: { type: 'value', name: meta.mode === 'pct' ? (uk ? '% норми' : '% of normal') : `Δ ${u(param, lang)}`, nameTextStyle: { fontSize: 10 } },
      series: [{
        type: 'bar',
        data: vals.map((v, i) => {
          if (v == null) return null;
          const ev = c.months[i].month === evMonth;
          return {
            value: v,
            itemStyle: { color: LEVELS[level(param, v, c.kind)].color, borderColor: ev ? '#ffffff' : 'transparent', borderWidth: ev ? 2 : 0 },
            label: ev ? { show: true, position: v < (meta.mode === 'pct' ? 100 : 0) ? 'bottom' : 'top', formatter: uk ? 'подія' : 'event', color: '#fff', fontSize: 10, fontWeight: 600 } : undefined,
          };
        }),
        markLine: { symbol: 'none', silent: true, data: [{ yAxis: meta.mode === 'pct' ? 100 : 0 }], lineStyle: { color: '#fff', type: 'dashed', opacity: 0.7 },
          label: { formatter: uk ? 'норма' : 'normal', fontSize: 10, color: '#c7d1e3' } },
        markArea: bands.length ? { silent: true, data: bands } : undefined,
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
      {opts && <Chart option={opts.monthsOpt} height={210} />}
      {opts && <ChartGuide c={c} param={param} lang={lang} />}
      {opts && <Chart option={opts.daysOpt} height={190} />}
      <p className="muted small">{c.source}. {uk ? 'Точка' : 'Point'}: {c.point[1].toFixed(2)}°, {c.point[0].toFixed(2)}°.</p>
    </div>
  );
}
