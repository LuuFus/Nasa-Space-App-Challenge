// Date helpers for GIBS layers (daily / 8-day / monthly / yearly time steps).
const iso = (d) => d.toISOString().slice(0, 10);
const parse = (s) => new Date(s + 'T00:00:00Z');

function ranges(layer) {
  return (layer?.ranges || []).map((r) => {
    const [a, b, p] = r.split('/');
    return { a: a.slice(0, 10), b: b.slice(0, 10), p };
  });
}

export function firstDate(layer) { const r = ranges(layer); return r.length ? r[0].a : null; }
export function lastDate(layer) { const r = ranges(layer); return r.length ? r[r.length - 1].b : null; }

export function isAvailable(layer, date) {
  return ranges(layer).some((r) => date >= r.a && date <= r.b);
}

function addStep(date, p, dir) {
  const d = parse(date);
  if (p === 'P1M') d.setUTCMonth(d.getUTCMonth() + dir);
  else if (p === 'P1Y') d.setUTCFullYear(d.getUTCFullYear() + dir);
  else if (p === 'P8D') d.setUTCDate(d.getUTCDate() + 8 * dir);
  else d.setUTCDate(d.getUTCDate() + dir);
  return iso(d);
}

/** next / previous date that exists for this layer */
export function stepDate(layer, date, dir) {
  const rs = ranges(layer);
  if (!rs.length) return date;
  const p = rs[rs.length - 1].p;
  let d = date;
  for (let i = 0; i < 400; i++) {
    d = addStep(d, p, dir);
    if (d < rs[0].a) return rs[0].a;
    if (d > rs[rs.length - 1].b) return rs[rs.length - 1].b;
    const r = rs.find((r) => d >= r.a && d <= r.b);
    if (r) {
      // align to the range's own grid (e.g. 8-day composites)
      if (r.p === 'P8D') {
        const k = Math.round((parse(d) - parse(r.a)) / 864e5 / 8);
        return addStep(r.a, 'P8D', k);
      }
      return d;
    }
  }
  return date;
}

/** snap any picked date to a valid one (first of month for monthly layers, etc.) */
export function snapDate(layer, date) {
  const rs = ranges(layer);
  if (!rs.length || !date) return date;
  const p = rs[rs.length - 1].p;
  let d = date;
  if (p === 'P1M') d = date.slice(0, 7) + '-01';
  if (p === 'P1Y') {
    const r = rs.find((r) => date.slice(0, 4) === r.a.slice(0, 4)) || rs.find((r) => date >= r.a && date <= r.b);
    d = r ? r.a.slice(0, 4) + r.a.slice(4) : date.slice(0, 4) + rs[0].a.slice(4);
  }
  if (isAvailable(layer, d)) return d;
  // nearest available
  let best = rs[0].a, bestDiff = Infinity;
  for (const r of rs) for (const c of [r.a, r.b]) {
    const diff = Math.abs(parse(c) - parse(d));
    if (diff < bestDiff) { bestDiff = diff; best = c; }
  }
  return best;
}

export function periodOf(layer) {
  const rs = ranges(layer);
  return rs.length ? rs[rs.length - 1].p : null;
}

export function fmtDate(layer, date, lang) {
  if (!date) return '';
  const p = periodOf(layer);
  const d = parse(date);
  const loc = lang === 'uk' ? 'uk-UA' : 'en-GB';
  if (p === 'P1Y') return String(d.getUTCFullYear());
  if (p === 'P1M') return d.toLocaleDateString(loc, { month: 'long', year: 'numeric', timeZone: 'UTC' });
  return d.toLocaleDateString(loc, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export function worldviewUrl(layer, date, bbox) {
  const l = encodeURIComponent(`${layer.gibs},Coastlines_15m,Reference_Features_15m`);
  const v = bbox ? `&v=${bbox.join(',')}` : '';
  return `https://worldview.earthdata.nasa.gov/?l=${l}${date ? `&t=${date}` : ''}${v}`;
}
