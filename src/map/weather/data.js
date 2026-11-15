// Forecast on a regular lon/lat grid for the visible part of the map.
//
// Open-Meteo is free, but counts every grid point as one call (600 per minute,
// 5000 per hour from one computer). So the world is cut into fixed blocks of
// 4×4 points; a block is downloaded once and reused while you pan around, and
// downloads go through a small "budget" that waits instead of hitting the limit.
// The picture on the screen is glued together from the blocks it needs.

const FORECAST = 'https://api.open-meteo.com/v1/forecast';
const AIR = 'https://air-quality-api.open-meteo.com/v1/air-quality';
// ≤ 10 variables keep one point = one API call (Open-Meteo's fair-use counting)
export const FORECAST_VARS = ['wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m', 'temperature_2m', 'precipitation',
  'cloud_cover', 'relative_humidity_2m', 'pressure_msl', 'cape'];
export const AIR_VARS = ['pm2_5', 'dust'];
const DAYS = 4;
const B = 4;                                     // block = B×B grid points
const STEPS = [0.25, 0.5, 1, 2, 4, 8, 16];
const MAX_COLS = 18, MAX_ROWS = 12;              // points across the screen
const LAT_MIN = -80, LAT_MAX = 80;
const PER_MINUTE = 480;                          // our own budget, below Open-Meteo's 600
const PER_REQUEST = 192;                         // points in one request (12 blocks)
const FRESH_MS = 60 * 60 * 1000;                 // a forecast block is re-downloaded after an hour

const wrapLon = (x) => ((((x + 180) % 360) + 360) % 360) - 180;

/** grid step (degrees) for map bounds [west, south, east, north] */
export function stepFor([w, s, e, n]) {
  const dx = Math.min(360, e - w), dy = Math.min(LAT_MAX - LAT_MIN, Math.min(n, LAT_MAX) - Math.max(s, LAT_MIN));
  return STEPS.find((st) => dx / st <= MAX_COLS && dy / st <= MAX_ROWS) ?? STEPS[STEPS.length - 1];
}

async function getJSON(url) {
  const r = await fetch(url);
  if (!r.ok) {
    let reason = `HTTP ${r.status}`;
    try { reason = (await r.json()).reason || reason; } catch { /* not JSON */ }
    const err = new Error(reason);
    err.status = r.status;
    throw err;
  }
  return r.json();
}

/**
 * Blocks of forecast data with a download queue that respects the API limits.
 * `onChange` is called whenever a block arrives or the state changes.
 */
export class WxBlocks {
  constructor(onChange) {
    this.onChange = onChange;
    this.blocks = new Map();       // key -> { status, t, times, vars }
    this.spent = [];               // [time, points] of recent requests
    this.queue = [];               // block keys waiting for download
    this.busy = 0;
    this.waitUntil = 0;            // when the limit was hit: do not ask before this time
    this.limit = null;             // which limit was hit: 'minute' | 'hour' | 'day'
    this.error = null;
  }

  key(api, step, bx, by) { return `${api}|${step}|${bx}|${by}`; }

  /** the grid that covers bounds at a step (a margin of one point around) */
  gridAt(bounds, step) {
    let [w, s, e, n] = bounds;
    if (e - w > 360) { const c = (w + e) / 2; w = c - 180; e = c + 180; }
    const i0 = Math.floor(w / step) - 1, i1 = Math.ceil(e / step) + 1;
    const j0 = Math.max(Math.ceil(LAT_MIN / step), Math.floor(s / step) - 1), j1 = Math.min(Math.floor(LAT_MAX / step), Math.ceil(n / step) + 1);
    const grid = { step, lon0: i0 * step, lat0: j0 * step, cols: i1 - i0 + 1, rows: j1 - j0 + 1 };
    grid.lon1 = grid.lon0 + (grid.cols - 1) * step;
    grid.lat1 = grid.lat0 + (grid.rows - 1) * step;
    return grid;
  }

  /** make sure the blocks under bounds are (being) downloaded; returns the grid of the view */
  want(bounds, api) {
    const grid = this.gridAt(bounds, stepFor(bounds));
    const { step } = grid;
    const i0 = Math.round(grid.lon0 / step), i1 = i0 + grid.cols - 1;
    const j0 = Math.round(grid.lat0 / step), j1 = j0 + grid.rows - 1;
    const now = Date.now();
    for (let by = Math.floor(j0 / B); by <= Math.floor(j1 / B); by++) {
      for (let bx = Math.floor(i0 / B); bx <= Math.floor(i1 / B); bx++) {
        const k = this.key(api, step, bx, by);
        const b = this.blocks.get(k);
        if (b && (b.status === 'queued' || b.status === 'loading' || (b.status === 'ok' && now - b.t < FRESH_MS))) continue;
        this.blocks.set(k, { status: 'queued', api, step, bx, by });
        this.queue.push(k);
      }
    }
    this.pump();
    return grid;
  }

  /** points of a block (row by row), with the latitudes outside ±80° left out */
  points(b) {
    const pts = [];
    for (let r = 0; r < B; r++) for (let c = 0; c < B; c++) {
      const lat = (b.by * B + r) * b.step;
      if (lat < LAT_MIN || lat > LAT_MAX) continue;
      pts.push({ k: r * B + c, lat, lon: wrapLon((b.bx * B + c) * b.step) });
    }
    return pts;
  }

  budgetLeft() {
    const now = Date.now();
    this.spent = this.spent.filter(([t]) => now - t < 60000);
    return PER_MINUTE - this.spent.reduce((a, [, p]) => a + p, 0);
  }

  /** seconds until the next download may start (0 = now) */
  waitSeconds() {
    return Math.max(0, Math.ceil((this.waitUntil - Date.now()) / 1000));
  }

  pump() {
    clearTimeout(this.timer);
    if (this.busy >= 2 || !this.queue.length) return;
    if (Date.now() < this.waitUntil) { this.timer = setTimeout(() => this.pump(), this.waitUntil - Date.now() + 50); this.onChange(); return; }
    // take blocks of the same API and step together, up to PER_REQUEST points
    const first = this.blocks.get(this.queue[0]);
    const batch = [];
    let pts = 0;
    for (const k of [...this.queue]) {
      const b = this.blocks.get(k);
      if (!b || b.api !== first.api || b.step !== first.step) continue;
      const n = this.points(b).length;
      if (batch.length && pts + n > PER_REQUEST) break;
      batch.push(k); pts += n;
    }
    if (this.budgetLeft() < pts) {
      // wait until enough of the last minute's budget has expired
      const oldest = this.spent[0]?.[0] ?? Date.now();
      this.waitUntil = oldest + 61000;
      this.timer = setTimeout(() => this.pump(), this.waitUntil - Date.now());
      this.onChange();
      return;
    }
    this.queue = this.queue.filter((k) => !batch.includes(k));
    this.spent.push([Date.now(), pts]);
    this.busy++;
    this.load(batch).finally(() => { this.busy--; this.pump(); });
    if (this.queue.length) this.pump();
  }

  async load(keys) {
    const bs = keys.map((k) => this.blocks.get(k));
    bs.forEach((b) => { b.status = 'loading'; });
    const all = bs.flatMap((b) => this.points(b).map((p) => ({ ...p, b })));
    if (!all.length) { bs.forEach((b) => { b.status = 'ok'; b.t = Date.now(); b.times = []; b.vars = {}; }); return; }
    const api = bs[0].api;
    const lat = all.map((p) => p.lat.toFixed(3)).join(','), lon = all.map((p) => p.lon.toFixed(3)).join(',');
    try {
      let list = api === 'air'
        ? await getJSON(`${AIR}?latitude=${lat}&longitude=${lon}&hourly=${AIR_VARS.join(',')}&forecast_days=${DAYS}&timezone=GMT&cell_selection=nearest`)
        : await getJSON(`${FORECAST}?latitude=${lat}&longitude=${lon}&hourly=${FORECAST_VARS.join(',')}`
          + `&wind_speed_unit=ms&forecast_days=${DAYS}&timezone=GMT&temporal_resolution=hourly_3&cell_selection=nearest`);
      if (!Array.isArray(list)) list = [list];
      const names = api === 'air' ? AIR_VARS : FORECAST_VARS;
      const allTimes = list[0].hourly.time.map((t) => Date.parse(t + 'Z'));
      // air quality comes hourly: keep every 3rd hour so both share one timeline
      const keep = allTimes.map((t, i) => i).filter((i) => api !== 'air' || new Date(allTimes[i]).getUTCHours() % 3 === 0);
      const times = keep.map((i) => allTimes[i]);
      for (const b of bs) {
        b.times = times;
        b.vars = Object.fromEntries(names.map((nm) => [nm, times.map(() => new Float32Array(B * B).fill(NaN))]));
      }
      all.forEach((p, idx) => {
        const h = list[idx]?.hourly;
        if (!h) return;
        for (const nm of names) {
          const arr = h[nm];
          if (!arr) continue;
          keep.forEach((i, t) => { const v = arr[i]; p.b.vars[nm][t][p.k] = v == null ? NaN : v; });
        }
      });
      for (const b of bs) {
        if (b.vars.wind_speed_10m) {   // wind as components (towards east / north) for the particles
          const S = b.vars.wind_speed_10m, D = b.vars.wind_direction_10m;
          b.vars.u = S.map((s, t) => s.map((sp, k) => -sp * Math.sin((D[t][k] * Math.PI) / 180)));
          b.vars.v = S.map((s, t) => s.map((sp, k) => -sp * Math.cos((D[t][k] * Math.PI) / 180)));
        }
        b.status = 'ok';
        b.t = Date.now();
      }
      this.error = null;
      this.limit = null;
    } catch (e) {
      if (e.status === 429 || /limit/i.test(e.message)) {
        // the service says "too many": put the blocks back and wait — a minute for the
        // per-minute limit, longer for the hourly / daily limit of this internet address
        bs.forEach((b) => { b.status = 'queued'; });
        this.queue.unshift(...keys);
        this.limit = /daily/i.test(e.message) ? 'day' : /hourly/i.test(e.message) ? 'hour' : 'minute';
        this.waitUntil = Date.now() + { minute: 65000, hour: 10 * 60000, day: 30 * 60000 }[this.limit];
      } else {
        bs.forEach((b) => { b.status = 'error'; b.t = Date.now(); });
        this.error = e.message || String(e);
        setTimeout(() => bs.forEach((b) => { if (b.status === 'error') this.blocks.delete(this.key(b.api, b.step, b.bx, b.by)); }), 30000);
      }
    }
    this.onChange();
  }

  /**
   * the best picture for bounds right now: the wanted step if enough of it has
   * arrived, otherwise a coarser or finer step that is already in the cache
   */
  best(bounds, api) {
    const want = stepFor(bounds);
    const main = this.mosaic(this.gridAt(bounds, want), api);
    if (main.coverage >= 0.6 || !main.pending) return main;
    const others = STEPS.filter((st) => st !== want).sort((a, b) => Math.abs(Math.log(a / want)) - Math.abs(Math.log(b / want)));
    for (const st of others) {
      if (st < want / 4) continue;       // far too fine: would be thousands of points
      const m = this.mosaic(this.gridAt(bounds, st), api);
      if (m.times && m.coverage >= 0.6) return { ...m, pending: main.pending };
    }
    return main;
  }

  /** the grid glued together from loaded blocks: { grid, times, vars, coverage, pending } */
  mosaic(grid, api) {
    if (!grid) return null;
    const { step, cols, rows } = grid;
    const i0 = Math.round(grid.lon0 / step), j0 = Math.round(grid.lat0 / step);
    let times = null, names = null, have = 0, pending = 0;
    const cells = [];
    for (let by = Math.floor(j0 / B); by <= Math.floor((j0 + rows - 1) / B); by++) {
      for (let bx = Math.floor(i0 / B); bx <= Math.floor((i0 + cols - 1) / B); bx++) {
        const b = this.blocks.get(this.key(api, step, bx, by));
        if (b?.status === 'ok' && b.times?.length) { times ??= b.times; names ??= Object.keys(b.vars); cells.push(b); } else if (b && b.status !== 'error') pending++;
      }
    }
    if (!times) return { grid, times: null, vars: null, coverage: 0, pending };
    const n = cols * rows;
    const vars = Object.fromEntries(names.map((nm) => [nm, times.map(() => new Float32Array(n).fill(NaN))]));
    for (const b of cells) {
      if (b.times.length !== times.length) continue;
      for (let r = 0; r < B; r++) {
        const row = b.by * B + r - j0;
        if (row < 0 || row >= rows) continue;
        for (let c = 0; c < B; c++) {
          const col = b.bx * B + c - i0;
          if (col < 0 || col >= cols) continue;
          const src = r * B + c, dst = row * cols + col;
          for (const nm of names) for (let t = 0; t < times.length; t++) vars[nm][t][dst] = b.vars[nm][t][src];
          have++;
        }
      }
    }
    return { grid, times, vars, coverage: have / n, pending };
  }
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
