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
