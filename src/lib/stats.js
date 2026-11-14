// Statistics used by the "trend detective": linear regression with a t-test,
// the Mann–Kendall trend test, Sen's slope and simple forecasts.
// Everything is written out by hand so the formulas shown on screen are exactly
// the ones that produced the numbers.

export function clean(xs, ys) {
  const x = [], y = [];
  for (let i = 0; i < xs.length; i++) {
    if (ys[i] != null && Number.isFinite(ys[i])) { x.push(xs[i]); y.push(ys[i]); }
  }
  return [x, y];
}

export const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
export function std(a) {
  const m = mean(a);
  return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1));
}

// ---------------------------------------------------------------- special functions
function logGamma(z) {
  const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let x = z, y = z;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) ser += c[j] / ++y;
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

function betacf(a, b, x) {
  const MAXIT = 200, EPS = 3e-14, FPMIN = 1e-300;
  let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d; h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

/** regularized incomplete beta I_x(a, b) */
export function ibeta(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? (bt * betacf(a, b, x)) / a : 1 - (bt * betacf(b, a, 1 - x)) / b;
}

/** two-sided p-value of Student's t with df degrees of freedom */
export function tTwoSided(t, df) {
  return ibeta(df / (df + t * t), df / 2, 0.5);
}

/** t value with P(|T| < t) = conf */
export function tCritical(conf, df) {
  let lo = 0, hi = 100;
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    if (tTwoSided(mid, df) > 1 - conf) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

export function normalCdf(z) {
  // Abramowitz & Stegun 7.1.26
  const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(z * z) / 2);
  return z >= 0 ? (1 + y) / 2 : (1 - y) / 2;
}

// ---------------------------------------------------------------- trend tests
/** ordinary least squares y = a + b·x, with the t-test for the slope */
export function linreg(xs, ys) {
  const [x, y] = clean(xs, ys);
  const n = x.length;
  if (n < 3) return null;
  const xb = mean(x), yb = mean(y);
  let sxx = 0, sxy = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    sxx += (x[i] - xb) ** 2;
    sxy += (x[i] - xb) * (y[i] - yb);
    syy += (y[i] - yb) ** 2;
  }
  const slope = sxy / sxx;
  const intercept = yb - slope * xb;
  let sse = 0;
  for (let i = 0; i < n; i++) sse += (y[i] - (intercept + slope * x[i])) ** 2;
  const s = Math.sqrt(sse / (n - 2));
  const se = s / Math.sqrt(sxx);
  const t = se > 0 ? slope / se : Infinity;
  const p = se > 0 ? tTwoSided(t, n - 2) : 0;
  const r2 = syy > 0 ? 1 - sse / syy : 0;
  const F = (r2 / (1 - r2)) * (n - 2);
  return { slope, intercept, r2, n, s, se, t, p, F, sxx, xbar: xb, ybar: yb, x0: x[0], x1: x[n - 1] };
}

/** Mann–Kendall test (no assumption about the shape of the trend) */
export function mannKendall(ys) {
  const y = ys.filter((v) => v != null && Number.isFinite(v));
  const n = y.length;
  if (n < 4) return null;
  let S = 0;
  for (let i = 0; i < n - 1; i++) for (let j = i + 1; j < n; j++) S += Math.sign(y[j] - y[i]);
  // tie correction
  const counts = new Map();
  for (const v of y) counts.set(v, (counts.get(v) || 0) + 1);
  let tie = 0;
  for (const t of counts.values()) if (t > 1) tie += t * (t - 1) * (2 * t + 5);
  const varS = (n * (n - 1) * (2 * n + 5) - tie) / 18;
  const Z = S > 0 ? (S - 1) / Math.sqrt(varS) : S < 0 ? (S + 1) / Math.sqrt(varS) : 0;
  const p = 2 * (1 - normalCdf(Math.abs(Z)));
  const tau = S / ((n * (n - 1)) / 2);
  return { S, varS, Z, p, tau, n };
}

/** Sen's slope: median of all pairwise slopes (robust to outliers) */
export function senSlope(xs, ys) {
  const [x, y] = clean(xs, ys);
  const s = [];
  for (let i = 0; i < x.length - 1; i++) for (let j = i + 1; j < x.length; j++) if (x[j] !== x[i]) s.push((y[j] - y[i]) / (x[j] - x[i]));
  if (!s.length) return null;
  s.sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** forecast with a 95% prediction interval from the linear trend */
export function forecast(lr, x0, conf = 0.95) {
  if (!lr) return null;
  const yhat = lr.intercept + lr.slope * x0;
  const tc = tCritical(conf, lr.n - 2);
  const half = tc * lr.s * Math.sqrt(1 + 1 / lr.n + (x0 - lr.xbar) ** 2 / lr.sxx);
  return { y: yhat, lo: yhat - half, hi: yhat + half, t: tc };
}

export function movingAverage(ys, k = 5) {
  const h = Math.floor(k / 2);
  return ys.map((_, i) => {
    const w = ys.slice(Math.max(0, i - h), i + h + 1).filter((v) => v != null);
    return w.length >= Math.min(3, k) ? mean(w) : null;
  });
}

export function anomalies(years, ys, from = 1991, to = 2020) {
  const base = ys.filter((v, i) => v != null && years[i] >= from && years[i] <= to);
  if (!base.length) return ys.map(() => null);
  const m = mean(base);
  return ys.map((v) => (v == null ? null : v - m));
}

/** the whole trend report used by charts and explanations */
// ---------------------------------------------------------------- robust trend toolkit
export const Z_CRIT = 1.959964; // two-sided 5 % level

function ranks(a) {
  const idx = a.map((v, i) => [v, i]).sort((p, q) => p[0] - q[0]);
  const r = new Array(a.length);
  for (let i = 0; i < idx.length;) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++;
    const avg = (i + j) / 2 + 1; // average rank for ties
    for (let k = i; k <= j; k++) r[idx[k][1]] = avg;
    i = j + 1;
  }
  return r;
}

function tieTerm(y) {
  const counts = new Map();
  for (const v of y) counts.set(v, (counts.get(v) || 0) + 1);
  let t = 0;
  for (const c of counts.values()) if (c > 1) t += c * (c - 1) * (2 * c + 5);
  return t;
}

/**
 * Modified Mann–Kendall test (Hamed & Rao, 1998). When neighbouring years are
 * correlated (a warm year tends to follow a warm year) the classic test is too
 * optimistic, so Var(S) is inflated by n/n* computed from the autocorrelation of
 * the ranks of the de-trended series.
 */
export function mannKendallModified(xs, ys) {
  const [x, y] = clean(xs, ys);
  const n = y.length;
  if (n < 8) return null;
  let S = 0;
  for (let i = 0; i < n - 1; i++) for (let j = i + 1; j < n; j++) S += Math.sign(y[j] - y[i]);
  const varS = (n * (n - 1) * (2 * n + 5) - tieTerm(y)) / 18;
  const beta = senSlope(x, y) ?? 0;
  const res = y.map((v, i) => v - beta * x[i]);
  const R = ranks(res);
  const rm = mean(R);
  const den = R.reduce((a, v) => a + (v - rm) ** 2, 0);
  let sum = 0;
  const lagLimit = Z_CRIT / Math.sqrt(n); // only significant lags count
  const used = [];
  for (let k = 1; k < n - 2; k++) {
    let num = 0;
    for (let i = 0; i < n - k; i++) num += (R[i] - rm) * (R[i + k] - rm);
    const rho = den > 0 ? num / den : 0;
    if (Math.abs(rho) > lagLimit) {
      sum += (n - k) * (n - k - 1) * (n - k - 2) * rho;
      used.push([k, rho]);
    }
  }
  let factor = 1 + (2 / (n * (n - 1) * (n - 2))) * sum; // n / n*
  if (!(factor > 0)) factor = 1;
  const varStar = varS * factor;
  const Z = S > 0 ? (S - 1) / Math.sqrt(varStar) : S < 0 ? (S + 1) / Math.sqrt(varStar) : 0;
  const p = 2 * (1 - normalCdf(Math.abs(Z)));
  return { S, varS, factor, varStar, Z, p, n, lags: used, zCrit: Z_CRIT, reject: Math.abs(Z) > Z_CRIT };
}

/**
 * Seasonal Mann–Kendall (Hirsch, Slack & Smith, 1982) for monthly data:
 * January is compared only with Januaries, July with Julys…, so the yearly cycle
 * can never look like a trend. S and Var(S) are summed over the 12 months.
 * monthly: flat array, 12 values per year starting at year y0 (null = missing).
 */
export function seasonalMannKendall(monthly, y0) {
  const nYears = Math.floor(monthly.length / 12);
  let S = 0, varS = 0, used = 0;
  const slopes = [];
  const perMonth = [];
  for (let m = 0; m < 12; m++) {
    const xs = [], ys = [];
    for (let k = 0; k < nYears; k++) {
      const v = monthly[k * 12 + m];
      if (v != null && Number.isFinite(v)) { xs.push(y0 + k); ys.push(v); }
    }
    const n = ys.length;
    if (n < 4) { perMonth.push(null); continue; }
    let s = 0;
    for (let i = 0; i < n - 1; i++) for (let j = i + 1; j < n; j++) {
      s += Math.sign(ys[j] - ys[i]);
      slopes.push((ys[j] - ys[i]) / (xs[j] - xs[i]));
    }
    const v = (n * (n - 1) * (2 * n + 5) - tieTerm(ys)) / 18;
    S += s; varS += v; used++;
    const z = s > 0 ? (s - 1) / Math.sqrt(v) : s < 0 ? (s + 1) / Math.sqrt(v) : 0;
    perMonth.push({ S: s, Z: z, p: 2 * (1 - normalCdf(Math.abs(z))), sen: senSlope(xs, ys), n });
  }
  if (!used) return null;
  slopes.sort((a, b) => a - b);
  const m = slopes.length >> 1;
  const sen = slopes.length % 2 ? slopes[m] : (slopes[m - 1] + slopes[m]) / 2;
  const Z = S > 0 ? (S - 1) / Math.sqrt(varS) : S < 0 ? (S + 1) / Math.sqrt(varS) : 0;
  return { S, varS, Z, p: 2 * (1 - normalCdf(Math.abs(Z))), sen, months: used, perMonth, zCrit: Z_CRIT, reject: Math.abs(Z) > Z_CRIT };
}

/** 95 % confidence interval of Sen's slope (Gilbert, 1987) */
export function senInterval(xs, ys, varS) {
  const [x, y] = clean(xs, ys);
  const sl = [];
  for (let i = 0; i < x.length - 1; i++) for (let j = i + 1; j < x.length; j++) if (x[j] !== x[i]) sl.push((y[j] - y[i]) / (x[j] - x[i]));
  if (sl.length < 3 || !(varS > 0)) return null;
  sl.sort((a, b) => a - b);
  const N = sl.length;
  const C = Z_CRIT * Math.sqrt(varS);
  const lo = Math.max(0, Math.round((N - C) / 2) - 1);
  const hi = Math.min(N - 1, Math.round((N + C) / 2));
  return [sl[lo], sl[hi]];
}

/** Sen line y = a + β·x (a = median of y − β·x) and the spread of the points around it */
export function senLine(xs, ys) {
  const [x, y] = clean(xs, ys);
  const beta = senSlope(x, y);
  if (beta == null) return null;
  const a0 = y.map((v, i) => v - beta * x[i]).sort((p, q) => p - q);
  const m = a0.length >> 1;
  const a = a0.length % 2 ? a0[m] : (a0[m - 1] + a0[m]) / 2;
  const res = y.map((v, i) => v - (a + beta * x[i]));
  const s = Math.sqrt(res.reduce((acc, r) => acc + r * r, 0) / Math.max(1, x.length - 2));
  const xb = mean(x);
  const sxx = x.reduce((acc, v) => acc + (v - xb) ** 2, 0);
  return { a, beta, s, n: x.length, xbar: xb, sxx };
}

/** forecast from the Sen line with a 95 % prediction band (same form as for least squares) */
export function forecastSen(line, x0, conf = 0.95) {
  if (!line) return null;
  const y = line.a + line.beta * x0;
  const t = tCritical(conf, Math.max(1, line.n - 2));
  const half = t * line.s * Math.sqrt(1 + 1 / line.n + (x0 - line.xbar) ** 2 / line.sxx);
  return { y, lo: y - half, hi: y + half, t };
}

/**
 * Honest check of the forecast method: pretend we live in `split`, fit the Sen
 * line on the earlier years, "predict" the later ones and compare with reality.
 */
export function hindcast(xs, ys, split) {
  const [x, y] = clean(xs, ys);
  const tx = [], ty = [], vx = [], vy = [];
  x.forEach((v, i) => { if (v <= split) { tx.push(v); ty.push(y[i]); } else { vx.push(v); vy.push(y[i]); } });
  if (tx.length < 10 || vx.length < 3) return null;
  const line = senLine(tx, ty);
  const clim = mean(ty);
  let se = 0, seClim = 0, inside = 0;
  vx.forEach((v, i) => {
    const f = forecastSen(line, v);
    se += (vy[i] - f.y) ** 2;
    seClim += (vy[i] - clim) ** 2;
    if (vy[i] >= f.lo && vy[i] <= f.hi) inside++;
  });
  const rmse = Math.sqrt(se / vx.length);
  const rmseClim = Math.sqrt(seClim / vx.length);
  return { split, train: tx.length, test: vx.length, rmse, rmseClim, skill: 1 - rmse / rmseClim, coverage: inside / vx.length };
}

/** the whole trend report used by charts and explanations */
export function analyse(years, ys, monthly = null, y0 = null) {
  const lr = linreg(years, ys);
  if (!lr) return null;
  const mk = mannKendall(ys);
  const mkMod = mannKendallModified(years, ys);
  const sen = senSlope(years, ys);
  const line = senLine(years, ys);
  const smk = monthly ? seasonalMannKendall(monthly, y0) : null;
  const [x, y] = clean(years, ys);
  const firstAvg = mean(y.slice(0, Math.min(10, y.length)));
  const lastAvg = mean(y.slice(-Math.min(10, y.length)));
  const expected = years.length ? years[years.length - 1] - years[0] + 1 : 0;
  const test = mkMod || mk;
  return {
    lr, mk, mkMod, smk, sen, line,
    senCI: senInterval(x, y, mkMod?.varStar ?? mk?.varS),
    hind: hindcast(x, y, x[0] + Math.floor((x[x.length - 1] - x[0]) * 0.55)),
    n: x.length, missing: Math.max(0, expected - x.length), first: x[0], last: x[x.length - 1],
    // size of the change = Sen's slope (non-parametric, the partner of the Mann–Kendall test)
    perDecade: (sen ?? lr.slope) * 10, change: (sen ?? lr.slope) * (x[x.length - 1] - x[0]),
    firstAvg, lastAvg, mean: mean(y), sd: std(y),
    p: test?.p ?? lr.p,
    significant: (test?.p ?? lr.p) < 0.05,
  };
}
