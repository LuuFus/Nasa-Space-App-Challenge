// Turns the numbers of a two-country comparison into short plain-language text
// for school students (Ukrainian and English). Sentences are built so that the
// country name always stays in the nominative case.
import { VARIABLES, unitText } from '../content/variables.js';
import { analyse, forecastSen } from './stats.js';

export function num(v, digits = 1, lang = 'uk') {
  if (v == null || !Number.isFinite(v)) return '—';
  const s = v.toFixed(digits);
  return lang === 'uk' ? s.replace('.', ',').replace('-', '−') : s.replace('-', '−');
}
const signed = (v, d, lang) => (v > 0 ? '+' : '') + num(v, d, lang);

function pText(p, lang) {
  if (p == null) return '';
  if (p < 0.001) return lang === 'uk' ? 'менше 0,1 %' : 'below 0.1%';
  return lang === 'uk' ? `${num(p * 100, 1, lang)} %` : `${num(p * 100, 1, lang)}%`;
}

/** monthly series -> one value per year for a season */
export function seasonalSeries(doc, varId, season) {
  const s = doc.series[varId];
  const [y0, y1] = doc.years;
  const years = [], values = [];
  const sum = varId === 'PRECTOTCORR';
  for (let y = y0; y <= y1; y++) {
    if (!season?.months) {
      years.push(y);
      values.push(s.annual[y - y0]);
      continue;
    }
    const vals = [];
    for (const m of season.months) {
      const yy = m === 12 && season.months.includes(1) ? y - 1 : y; // December belongs to the next winter
      const idx = (yy - y0) * 12 + (m - 1);
      if (yy < y0) { vals.push(null); continue; }
      vals.push(s.monthly[idx]);
    }
    if (vals.some((v) => v == null)) continue;
    years.push(y);
    values.push(sum ? vals.reduce((a, b) => a + b, 0) : vals.reduce((a, b) => a + b, 0) / vals.length);
  }
  return { years, values };
}

export function compareReport(docA, docB, varId, season, horizon = 2050) {
  const sa = seasonalSeries(docA, varId, season);
  const sb = docB ? seasonalSeries(docB, varId, season) : null;
  // for the whole year we also run the seasonal Mann–Kendall test on the monthly data
  const monthlyOf = (doc) => (!season?.months && doc.series[varId]?.monthly?.length ? doc.series[varId].monthly : null);
  const A = { doc: docA, ...sa, an: analyse(sa.years, sa.values, monthlyOf(docA), docA.years[0]) };
  const B = sb ? { doc: docB, ...sb, an: analyse(sb.years, sb.values, monthlyOf(docB), docB.years[0]) } : null;
  for (const X of [A, B]) {
    if (!X?.an) continue;
    X.f2035 = forecastSen(X.an.line, 2035);
    X.fH = forecastSen(X.an.line, horizon);
  }
  return { A, B, varId, season, horizon };
}

export function explain(rep, lang, names) {
  const v = VARIABLES[rep.varId];
  const d = v.digits;
  const u = unitText(v, lang, rep.season?.months?.length === 1);
  const out = [];
  const { A, B } = rep;
  const nA = names.a, nB = names.b;
  const per = lang === 'uk' ? 'за 10 років' : 'per decade';
  const uk = lang === 'uk';
  const describe = (X, n) => {
    const an = X.an;
    if (!an) return uk ? `${n}: недостатньо даних.` : `${n}: not enough data.`;
    const dir = an.perDecade > 0 ? (uk ? 'зростає' : 'is rising') : (uk ? 'зменшується' : 'is falling');
    const sig = an.significant
      ? (uk ? `Це не випадковість: імовірність отримати такий тренд «просто так» — ${pText(an.p, lang)} (тест Манна–Кендалла з поправкою на автокореляцію).`
        : `This is not chance: the probability of such a trend appearing by accident is ${pText(an.p, lang)} (Mann–Kendall test corrected for autocorrelation).`)
      : (uk ? `Але коливання з року в рік великі, тож тренд може бути випадковим (імовірність ${pText(an.p, lang)}).`
        : `But year-to-year swings are large, so the trend could be random (probability ${pText(an.p, lang)}).`);
    return uk
      ? `${n}: показник ${dir} — у середньому ${signed(an.perDecade, d + 1, lang)} ${u} ${per}, тобто ${signed(an.change, d, lang)} ${u} за ${an.first}–${an.last} рр. ${sig}`
      : `${n}: the value ${dir} — on average ${signed(an.perDecade, d + 1, lang)} ${u} ${per}, i.e. ${signed(an.change, d, lang)} ${u} over ${an.first}–${an.last}. ${sig}`;
  };
  out.push(describe(A, nA));
  if (B) out.push(describe(B, nB));

  // who has more right now (last 10 years)
  if (B?.an && A.an) {
    const diff = A.an.lastAvg - B.an.lastAvg;
    const leader = diff >= 0 ? nA : nB;
    out.push(uk
      ? `Останні 10 років: ${nA} — ${num(A.an.lastAvg, d, lang)} ${u}, ${nB} — ${num(B.an.lastAvg, d, lang)} ${u}. ${v.has.uk} ${leader} — на ${num(Math.abs(diff), d, lang)} ${u}.`
      : `Last 10 years: ${nA} — ${num(A.an.lastAvg, d, lang)} ${u}, ${nB} — ${num(B.an.lastAvg, d, lang)} ${u}. ${v.has.en} ${leader}, by ${num(Math.abs(diff), d, lang)} ${u}.`);
    const faster = Math.abs(A.an.perDecade) >= Math.abs(B.an.perDecade) ? nA : nB;
    const ratio = Math.abs(A.an.perDecade) / Math.max(1e-9, Math.abs(B.an.perDecade));
    const r = ratio >= 1 ? ratio : 1 / ratio;
    if (r > 1.15) {
      out.push(uk
        ? `Швидше змінюється ${faster} — приблизно в ${num(r, 1, lang)} раза. Різниця між країнами ${Math.sign(A.an.perDecade - B.an.perDecade) === Math.sign(diff) ? 'з роками збільшується' : 'з роками зменшується'}.`
        : `${faster} is changing faster — about ${num(r, 1, lang)} times. The gap between the countries is ${Math.sign(A.an.perDecade - B.an.perDecade) === Math.sign(diff) ? 'growing' : 'shrinking'} over time.`);
    } else {
      out.push(uk ? 'Обидві країни змінюються з майже однаковою швидкістю.' : 'Both countries are changing at almost the same speed.');
    }
  }
  // everyday meaning
  if (A.an) {
    let life = v.life[lang](A.an.change);
    if (uk) life = life.replace(/(\d)\.(\d)/g, '$1,$2');
    out.push((uk ? `У житті (${nA}): ` : `In real life (${nA}): `) + life);
  }

  // forecast
  const fc = (X, n) => X?.fH && (uk
    ? `${n}: якщо тенденція збережеться, у ${rep.horizon} році буде ≈ ${num(X.fH.y, d, lang)} ${u} (з імовірністю 95 % — від ${num(X.fH.lo, d, lang)} до ${num(X.fH.hi, d, lang)}).`
    : `${n}: if the trend continues, ${rep.horizon} would see ≈ ${num(X.fH.y, d, lang)} ${u} (95% range ${num(X.fH.lo, d, lang)} to ${num(X.fH.hi, d, lang)}).`);
  const f = [fc(A, nA), fc(B, nB)].filter(Boolean);
  if (f.length) {
    out.push(f.join(' ') + (uk
      ? ' Це не точне передбачення, а продовження лінії тренду: справжнє майбутнє залежить від того, скільки парникових газів викидатиме людство.'
      : ' This is not a precise prediction but an extension of the trend line: the real future depends on how much greenhouse gas humanity emits.'));
  }
  return out;
}
