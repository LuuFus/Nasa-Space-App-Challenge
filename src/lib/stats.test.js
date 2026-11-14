// Run with: npm test   (Node's built-in test runner)
import test from 'node:test';
import assert from 'node:assert/strict';
import { linreg, mannKendall, senSlope, tTwoSided, tCritical, forecast, normalCdf } from './stats.js';

const close = (a, b, eps = 1e-3) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);

test('t distribution matches tables', () => {
  close(tCritical(0.95, 10), 2.228, 2e-3);
  close(tCritical(0.95, 30), 2.042, 2e-3);
  close(tTwoSided(2.086, 20), 0.05, 1e-3);
  close(normalCdf(1.96), 0.975, 1e-3);
});

test('linear regression on a perfect line', () => {
  const x = [1, 2, 3, 4, 5], y = [3, 5, 7, 9, 11];
  const r = linreg(x, y);
  close(r.slope, 2); close(r.intercept, 1); close(r.r2, 1);
});

test('regression slope and p-value on known data', () => {
  // y = 0.5x + noise (noise fixed)
  const x = [...Array(20)].map((_, i) => i);
  const noise = [0.3, -0.2, 0.1, -0.4, 0.2, 0.0, -0.1, 0.3, -0.3, 0.1, 0.2, -0.2, 0.0, 0.1, -0.1, 0.4, -0.3, 0.2, -0.1, 0.0];
  const y = x.map((v, i) => 0.5 * v + noise[i]);
  const r = linreg(x, y);
  close(r.slope, 0.5, 0.02);
  assert.ok(r.p < 1e-10);
});

test('Mann-Kendall detects a monotonic trend and not a flat one', () => {
  const up = [1, 2, 3, 2.5, 4, 5, 4.8, 6, 7, 8];
  const mk = mannKendall(up);
  assert.ok(mk.S > 0 && mk.p < 0.01);
  const flat = [1, 3, 2, 3, 1, 2, 3, 1, 2, 2];
  assert.ok(mannKendall(flat).p > 0.3);
});

test('Sen slope is the median pairwise slope', () => {
  close(senSlope([1, 2, 3, 4, 5], [1, 2, 3, 4, 100]), 1); // robust to the outlier
});

test('forecast interval widens away from the data', () => {
  const x = [...Array(30)].map((_, i) => 1990 + i);
  const y = x.map((v, i) => 10 + 0.03 * (v - 1990) + (i % 3 - 1) * 0.2);
  const r = linreg(x, y);
  const f1 = forecast(r, 2020), f2 = forecast(r, 2050);
  assert.ok(f2.hi - f2.lo > f1.hi - f1.lo);
  close(f2.y, 10 + 0.03 * 60, 0.15);
});

import { mannKendallModified, seasonalMannKendall, senLine, forecastSen, hindcast, analyse } from './stats.js';

test('modified Mann-Kendall inflates the variance for autocorrelated noise', () => {
  let v = 0, seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) - 0.5;
  const y = [];
  for (let i = 0; i < 40; i++) { v = 0.9 * v + rnd(); y.push(v); }
  const x = y.map((_, i) => 1980 + i);
  const mod = mannKendallModified(x, y);
  assert.ok(mod.factor >= 1, `factor ${mod.factor}`);
  assert.ok(mod.varStar >= mod.varS);
});

test('modified Mann-Kendall still finds a strong real trend', () => {
  const x = [...Array(30)].map((_, i) => 1990 + i);
  const y = x.map((v, i) => 0.05 * i + [0.1, -0.1, 0.05, 0, -0.05][i % 5]);
  const mod = mannKendallModified(x, y);
  assert.ok(mod.p < 0.01 && mod.reject);
});

test('seasonal Mann-Kendall ignores the yearly cycle', () => {
  const up = [], flat = [];
  for (let k = 0; k < 20; k++) for (let m = 0; m < 12; m++) {
    up.push(10 * Math.sin((m / 12) * 2 * Math.PI) + 0.1 * k);
    flat.push(10 * Math.sin((m / 12) * 2 * Math.PI) + (((k * 7 + m) % 5) - 2) * 0.01);
  }
  const s1 = seasonalMannKendall(up, 2000);
  assert.ok(s1.p < 0.001);
  close(s1.sen, 0.1, 1e-9);
  assert.ok(seasonalMannKendall(flat, 2000).p > 0.05);
});

test('Sen interval contains Sen slope; Sen forecast and hindcast behave', () => {
  const x = [...Array(40)].map((_, i) => 1981 + i);
  const y = x.map((v, i) => 8 + 0.04 * i + (((i * 37) % 11) - 5) * 0.05);
  const a = analyse(x, y);
  assert.ok(a.senCI[0] <= a.sen && a.sen <= a.senCI[1]);
  const f = forecastSen(senLine(x, y), 2050);
  assert.ok(f.lo < f.y && f.y < f.hi);
  const h = hindcast(x, y, 2002);
  assert.ok(h.skill > 0 && h.coverage > 0.8, JSON.stringify(h));
});
