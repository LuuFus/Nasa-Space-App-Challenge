// Turning NASA GIBS colours back into numbers using the official colour maps,
// and converting SI units into units students know (K -> °C, kg/m²/s -> mm/day...).
const lookups = new WeakMap();

const IGBP_UK = {
  'Evergreen Needleleaf Forests': 'Вічнозелені хвойні ліси', 'Evergreen Broadleaf Forests': 'Вічнозелені широколисті ліси',
  'Deciduous Needleleaf Forests': 'Листопадні хвойні ліси', 'Deciduous Broadleaf Forests': 'Листопадні широколисті ліси',
  'Mixed Forests': 'Мішані ліси', 'Closed Shrublands': 'Густі чагарники', 'Open Shrublands': 'Рідкі чагарники',
  'Woody Savannas': 'Лісисті савани', 'Savannas': 'Савани', 'Grasslands': 'Луки й степи', 'Permanent Wetlands': 'Болота',
  'Croplands': 'Поля (рілля)', 'Urban and Built-up Lands': 'Міста й забудова', 'Cropland/Natural Vegetation Mosaics': 'Поля впереміш із природою',
  'Permanent Snow and Ice': 'Вічний сніг і лід', 'Barren': 'Пустеля, голий ґрунт', 'Water Bodies': 'Водойми', 'Unclassified': 'Не визначено',
};

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
  if (a !== 0 && (a < 0.001 || a >= 1e6)) return v.toExponential(2);
  const d = digits ?? (a >= 100 ? 0 : a >= 10 ? 1 : a >= 1 ? 2 : a >= 0.01 ? 3 : 4);
  return v.toFixed(d);
}

export function unitsOf(layer, lang = 'uk') {
  const L = layer?.legend;
  if (!L) return '';
  const u = layer.transform?.units ?? L.units ?? '';
  const parts = u.split('|');
  return parts.length === 2 ? parts[lang === 'uk' ? 0 : 1] : u;
}

const conv = (layer, v) => (v == null ? null : v * (layer.transform?.scale ?? 1) + (layer.transform?.offset ?? 0));

function labelText(L, i, lang) {
  const l = L.labels?.[i];
  if (!l) return null;
  return lang === 'uk' ? IGBP_UK[l] || l : l;
}

/** rgba from a tile -> { value, text } or null */
export function valueAt(layer, rgba, lang = 'uk') {
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
  const label = labelText(L, i, lang);
  if (label) return { value: null, text: label };
  const units = unitsOf(layer, lang);
  const lo = conv(layer, e[3]), hi = conv(layer, e[4]);
  if (lo == null && hi == null) return null;
  if (lo == null) return { value: hi, text: `< ${fmtNum(hi)} ${units}` };
  if (hi == null) return { value: lo, text: `> ${fmtNum(lo)} ${units}` };
  const mid = (lo + hi) / 2;
  return { value: mid, text: `≈ ${fmtNum(mid)} ${units}` };
}

/** CSS gradient + tick labels for drawing a legend bar */
export function legendBar(layer, lang = 'uk') {
  const L = layer?.legend;
  if (!L) return null;
  const ents = L.entries.map((e, i) => [e, i]).filter(([e]) => !e[5]);
  if (!ents.length) return null;
  if (L.type === 'classification' || L.labels) {
    return {
      classes: ents.slice(0, 24).map(([e, i]) => ({ color: `rgb(${e[0]},${e[1]},${e[2]})`, label: labelText(L, i, lang) ?? (e[3] != null ? fmtNum(conv(layer, e[3])) : '') })),
    };
  }
  const n = ents.length;
  const stops = [];
  const step = Math.max(1, Math.floor(n / 48));
  for (let k = 0; k < n; k += step) { const e = ents[k][0]; stops.push(`rgb(${e[0]},${e[1]},${e[2]}) ${((k / Math.max(1, n - 1)) * 100).toFixed(1)}%`); }
  const vals = ents.map(([e]) => e[3] ?? e[4]).filter((v) => v != null);
  const lo = conv(layer, vals[0]), hi = conv(layer, vals[vals.length - 1]);
  return {
    gradient: `linear-gradient(to right, ${stops.join(',')})`,
    min: lo != null ? fmtNum(lo) : '', max: hi != null ? fmtNum(hi) : '',
    mid: lo != null && hi != null ? fmtNum((lo + hi) / 2) : '',
    units: unitsOf(layer, lang),
  };
}
