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
export function analyse(years, ys) {
  const lr = linreg(years, ys);
  const mk = mannKendall(ys);
  const sen = senSlope(years, ys);
  if (!lr) return null;
  const [x, y] = clean(years, ys);
  const firstAvg = mean(y.slice(0, Math.min(10, y.length)));
  const lastAvg = mean(y.slice(-Math.min(10, y.length)));
  return {
    lr, mk, sen, n: x.length, first: x[0], last: x[x.length - 1],
    perDecade: lr.slope * 10, change: lr.slope * (x[x.length - 1] - x[0]),
    firstAvg, lastAvg, mean: mean(y), sd: std(y),
    significant: (mk ? mk.p : lr.p) < 0.05,
  };
}
