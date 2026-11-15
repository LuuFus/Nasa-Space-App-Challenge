// Forecast on a regular lon/lat grid that covers the visible part of the map.
// Open-Meteo accepts many points in one request; the grid step grows when you
// zoom out, so one request never asks for more than ~380 points.

const FORECAST = 'https://api.open-meteo.com/v1/forecast';
const AIR = 'https://air-quality-api.open-meteo.com/v1/air-quality';
// ≤ 10 variables keep one point = one API call (Open-Meteo's fair-use counting)
export const FORECAST_VARS = ['wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m', 'temperature_2m', 'precipitation',
  'cloud_cover', 'relative_humidity_2m', 'pressure_msl', 'cape'];
export const AIR_VARS = ['pm2_5', 'dust'];
const DAYS = 4;
const STEPS = [0.25, 0.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 16, 20];
const MAX_COLS = 24, MAX_ROWS = 16;

/** grid for map bounds [west, south, east, north] (with a margin, snapped to the step) */
export function gridFor(b) {
  let [w, s, e, n] = b;
  const mx = (e - w) * 0.2, my = (n - s) * 0.2;
  w -= mx; e += mx; s -= my; n += my;
  if (e - w > 360) { const c = (w + e) / 2; w = c - 180; e = c + 180; }
  s = Math.max(-78, s); n = Math.min(80, n);
  const step = STEPS.find((st) => Math.ceil((e - w) / st) + 1 <= MAX_COLS && Math.ceil((n - s) / st) + 1 <= MAX_ROWS) ?? 20;
  const lon0 = Math.floor(w / step) * step, lon1 = Math.ceil(e / step) * step;
  const lat0 = Math.max(-78, Math.floor(s / step) * step), lat1 = Math.min(80, Math.ceil(n / step) * step);
  const cols = Math.round((lon1 - lon0) / step) + 1;
  const rows = Math.round((lat1 - lat0) / step) + 1;
  return { step, lon0, lat0, cols, rows, lon1: lon0 + (cols - 1) * step, lat1: lat0 + (rows - 1) * step };
}

/** does grid g already cover grid h (same step)? */
export function covers(g, h) {
  return g && h && g.step === h.step && g.lon0 <= h.lon0 && g.lat0 <= h.lat0 && g.lon1 >= h.lon1 && g.lat1 >= h.lat1;
}

const wrapLon = (x) => ((((x + 180) % 360) + 360) % 360) - 180;

function points(g) {
  const lat = [], lon = [];
  for (let r = 0; r < g.rows; r++) for (let c = 0; c < g.cols; c++) {
    lat.push(+(g.lat0 + r * g.step).toFixed(3));
    lon.push(+wrapLon(g.lon0 + c * g.step).toFixed(3));
  }
  return { lat: lat.join(','), lon: lon.join(',') };
}

async function getJSON(url) {
  const r = await fetch(url);
  if (!r.ok) {
    let reason = `HTTP ${r.status}`;
    try { reason = (await r.json()).reason || reason; } catch { /* not JSON */ }
    throw new Error(reason);
  }
  return r.json();
}

/**
 * Load a grid: { grid, times: [ms], vars: { name: Float32Array[steps][rows*cols] } }.
 * `api` = 'forecast' (weather) or 'air' (air quality).
 */
export async function loadGrid(g, api = 'forecast') {
  const p = points(g);
  const n = g.rows * g.cols;
  let list;
  if (api === 'air') {
    list = await getJSON(`${AIR}?latitude=${p.lat}&longitude=${p.lon}&hourly=${AIR_VARS.join(',')}&forecast_days=${DAYS}&timezone=GMT&cell_selection=nearest`);
  } else {
    list = await getJSON(`${FORECAST}?latitude=${p.lat}&longitude=${p.lon}&hourly=${FORECAST_VARS.join(',')}`
      + `&wind_speed_unit=ms&forecast_days=${DAYS}&timezone=GMT&temporal_resolution=hourly_3&cell_selection=nearest`);
  }
  if (!Array.isArray(list)) list = [list];
  const names = api === 'air' ? AIR_VARS : FORECAST_VARS;
  // air quality comes hourly: keep every 3rd hour so both share one timeline
  const allTimes = list[0].hourly.time.map((t) => Date.parse(t + 'Z'));
  const keep = allTimes.map((t, i) => i).filter((i) => api !== 'air' || new Date(allTimes[i]).getUTCHours() % 3 === 0);
  const times = keep.map((i) => allTimes[i]);
  const vars = {};
  for (const name of names) {
    vars[name] = times.map(() => new Float32Array(n).fill(NaN));
    list.forEach((loc, k) => {
      const arr = loc.hourly[name];
      if (!arr) return;
      keep.forEach((i, t) => { const v = arr[i]; vars[name][t][k] = v == null ? NaN : v; });
    });
  }
  if (vars.wind_speed_10m) {   // wind as components (towards east / north) for the particles
    vars.u = vars.wind_speed_10m.map((s, t) => s.map((sp, k) => -sp * Math.sin((vars.wind_direction_10m[t][k] * Math.PI) / 180)));
    vars.v = vars.wind_speed_10m.map((s, t) => s.map((sp, k) => -sp * Math.cos((vars.wind_direction_10m[t][k] * Math.PI) / 180)));
  }
  return { grid: g, times, vars, api };
}

/** bilinear value of a field at lon/lat (NaN outside the grid or where data is missing) */
export function sampleField(g, f, lon, lat) {
  let x = (lon - g.lon0) / g.step;
  if (x < 0 || x > g.cols - 1) {   // the grid may sit one world copy away
    const alt = (lon + (lon < g.lon0 ? 360 : -360) - g.lon0) / g.step;
    if (alt >= 0 && alt <= g.cols - 1) x = alt; else return NaN;
  }
  const y = (lat - g.lat0) / g.step;
  if (y < 0 || y > g.rows - 1) return NaN;
  const c0 = Math.min(g.cols - 2, Math.floor(x)), r0 = Math.min(g.rows - 2, Math.floor(y));
  const fx = x - c0, fy = y - r0;
  const i = r0 * g.cols + c0;
  const a = f[i], b = f[i + 1], c = f[i + g.cols], d = f[i + g.cols + 1];
  return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
}

/** index of the time step closest to now */
export function nowIndex(times) {
  const now = Date.now();
  let best = 0;
  times.forEach((t, i) => { if (Math.abs(t - now) < Math.abs(times[best] - now)) best = i; });
  return best;
}

/** forecast for one point (the "spot forecast" card) */
export function loadSpot(lon, lat) {
  return getJSON(`${FORECAST}?latitude=${lat.toFixed(3)}&longitude=${wrapLon(lon).toFixed(3)}`
    + '&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,pressure_msl,cloud_cover,precipitation'
    + '&hourly=temperature_2m,precipitation,wind_speed_10m,wind_gusts_10m,cloud_cover'
    + `&wind_speed_unit=ms&forecast_days=${DAYS}&timezone=auto`);
}
