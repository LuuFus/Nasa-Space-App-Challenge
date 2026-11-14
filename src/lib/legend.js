// Turning NASA GIBS colours back into numbers using the official colour maps.
const lookups = new WeakMap();

function lookup(legend) {
  let m = lookups.get(legend);
  if (!m) {
    m = new Map();
    legend.entries.forEach((e, i) => m.set((e[0] << 16) | (e[1] << 8) | e[2], i));
    lookups.set(legend, m);
  }
  return m;
}

export function fmtNum(v, digits) {
  if (v == null || Number.isNaN(v)) return '—';
  const a = Math.abs(v);
  const d = digits ?? (a >= 100 ? 0 : a >= 10 ? 1 : a >= 1 ? 2 : a >= 0.01 ? 3 : 4);
  if (a !== 0 && (a < 0.001 || a >= 1e6)) return v.toExponential(2);
  return v.toFixed(d);
}

export function unitsOf(layer) {
  const L = layer?.legend;
  if (!L) return '';
  return layer.transform?.units || L.units || '';
}

/** rgba from a tile -> { value, text } or null */
export function valueAt(layer, rgba) {
  const L = layer?.legend;
  if (!L || !rgba || rgba[3] < 10) return null;
  const m = lookup(L);
  let i = m.get((rgba[0] << 16) | (rgba[1] << 8) | rgba[2]);
  if (i == null) {
    // tiles are smoothed when shrunk: take the closest colour
    let best = 1e9;
    L.entries.forEach((e, k) => {
      const d = (e[0] - rgba[0]) ** 2 + (e[1] - rgba[1]) ** 2 + (e[2] - rgba[2]) ** 2;
      if (d < best) { best = d; i = k; }
    });
    if (best > 300) return null;
  }
  const e = L.entries[i];
  if (e[5]) return null;
  const off = layer.transform?.offset || 0;
  const units = unitsOf(layer);
  if (L.labels && L.labels[i]) return { value: null, text: L.labels[i] };
  const lo = e[3], hi = e[4];
  if (lo == null && hi == null) return null;
  if (lo == null) return { value: hi + off, text: `< ${fmtNum(hi + off)} ${units}` };
  if (hi == null) return { value: lo + off, text: `> ${fmtNum(lo + off)} ${units}` };
  const mid = (lo + hi) / 2 + off;
  return { value: mid, text: `≈ ${fmtNum(mid)} ${units}` };
}

/** CSS gradient + tick labels for drawing a legend bar */
export function legendBar(layer) {
  const L = layer?.legend;
  if (!L) return null;
  const ents = L.entries.filter((e) => !e[5]);
  if (!ents.length) return null;
  const off = layer.transform?.offset || 0;
  if (L.type === 'classification' || L.labels) {
    return {
      classes: ents.map((e, i) => ({ color: `rgb(${e[0]},${e[1]},${e[2]})`, label: L.labels?.[L.entries.indexOf(e)] ?? (e[3] != null ? fmtNum(e[3] + off) : '') })).slice(0, 24),
    };
  }
  const n = ents.length;
  const stops = [];
  const step = Math.max(1, Math.floor(n / 48));
  for (let i = 0; i < n; i += step) stops.push(`rgb(${ents[i][0]},${ents[i][1]},${ents[i][2]}) ${((i / (n - 1)) * 100).toFixed(1)}%`);
  const first = ents.find((e) => e[3] != null || e[4] != null);
  const last = [...ents].reverse().find((e) => e[3] != null || e[4] != null);
  const lo = first?.[4] ?? first?.[3], hi = last?.[3] ?? last?.[4];
  return {
    gradient: `linear-gradient(to right, ${stops.join(',')})`,
    min: lo != null ? fmtNum(lo + off) : '', max: hi != null ? fmtNum(hi + off) : '',
    mid: lo != null && hi != null ? fmtNum((lo + hi) / 2 + off) : '',
    units: unitsOf(layer),
  };
}
