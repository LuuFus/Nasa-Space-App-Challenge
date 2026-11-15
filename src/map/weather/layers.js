// Weather layers of the map (an idea taken from windy.com: a live forecast you
// can scroll through in time). Data: Open-Meteo (CC BY 4.0, free for
// non-commercial use, no key) — it combines national weather models
// (DWD ICON, NOAA GFS, ECMWF IFS, Météo-France...) and the CAMS air-quality forecast.
//
// `stops` = palette: [value, [r, g, b, a]] — a = 0..1; values between are blended.

export const WX_LAYERS = [
  {
    id: 'wind', v: 'wind_speed_10m', api: 'forecast', icon: 'Wind', units: { uk: 'м/с', en: 'm/s' }, digits: 1,
    title: { uk: 'Вітер', en: 'Wind' },
    desc: {
      uk: 'Швидкість вітру на висоті 10 м. Рухомі лінії показують, куди дме вітер: так дим від пожежі чи пилок розносяться за сотні кілометрів.',
      en: 'Wind speed 10 m above the ground. The moving lines show where the wind blows — this is how smoke or pollen travel hundreds of kilometres.',
    },
    stops: [[0, [56, 84, 160, 0.55]], [3, [43, 131, 186, 0.6]], [6, [53, 168, 140, 0.62]], [9, [120, 190, 80, 0.65]], [12, [226, 200, 70, 0.7]], [16, [240, 140, 50, 0.72]], [21, [214, 64, 64, 0.75]], [28, [170, 40, 120, 0.78]], [36, [110, 50, 150, 0.8]]],
  },
  {
    id: 'gust', v: 'wind_gusts_10m', api: 'forecast', icon: 'Tornado', units: { uk: 'м/с', en: 'm/s' }, digits: 1,
    title: { uk: 'Пориви вітру', en: 'Wind gusts' },
    desc: {
      uk: 'Найсильніші короткі пориви. Понад 20 м/с ламають гілки, понад 30 м/с — дерева й дахи.',
      en: 'The strongest short gusts. Above 20 m/s they break branches, above 30 m/s trees and roofs.',
    },
    stops: [[0, [56, 84, 160, 0.55]], [5, [43, 131, 186, 0.6]], [10, [53, 168, 140, 0.62]], [15, [226, 200, 70, 0.7]], [20, [240, 140, 50, 0.74]], [26, [214, 64, 64, 0.78]], [34, [170, 40, 120, 0.8]], [45, [110, 50, 150, 0.82]]],
  },
  {
    id: 'temp', v: 'temperature_2m', api: 'forecast', icon: 'Thermometer', units: { uk: '°C', en: '°C' }, digits: 0,
    title: { uk: 'Температура', en: 'Temperature' },
    desc: {
      uk: 'Температура повітря на висоті 2 м — як на термометрі за вікном. Порівняй із середньомісячною температурою NASA MERRA-2 у шарах.',
      en: 'Air temperature 2 m above the ground, like a thermometer outside the window. Compare it with NASA MERRA-2 monthly temperature in Layers.',
    },
    stops: [[-40, [120, 60, 160, 0.7]], [-25, [70, 80, 190, 0.68]], [-10, [60, 140, 210, 0.62]], [0, [150, 210, 230, 0.58]], [8, [110, 190, 130, 0.58]], [16, [200, 210, 90, 0.62]], [24, [240, 170, 60, 0.66]], [32, [225, 90, 50, 0.72]], [42, [150, 30, 50, 0.78]]],
  },
  {
    id: 'rain', v: 'precipitation', api: 'forecast', icon: 'CloudRain', units: { uk: 'мм / 3 год', en: 'mm / 3 h' }, digits: 1,
    title: { uk: 'Дощ і сніг', en: 'Rain & snow' },
    desc: {
      uk: 'Скільки опадів випаде за 3 години. 1 мм — це 1 літр води на кожен квадратний метр.',
      en: 'How much rain or snow falls in 3 hours. 1 mm is 1 litre of water on every square metre.',
    },
    stops: [[0, [0, 0, 0, 0]], [0.15, [120, 180, 240, 0]], [0.3, [120, 180, 240, 0.45]], [1, [60, 130, 230, 0.6]], [3, [50, 180, 120, 0.7]], [6, [240, 210, 60, 0.75]], [12, [240, 120, 40, 0.8]], [25, [210, 40, 60, 0.85]], [50, [170, 40, 170, 0.88]]],
  },
  {
    id: 'clouds', v: 'cloud_cover', api: 'forecast', icon: 'Cloud', units: { uk: '%', en: '%' }, digits: 0,
    title: { uk: 'Хмарність', en: 'Clouds' },
    desc: {
      uk: 'Яку частку неба вкривають хмари. Хмари вдень охолоджують Землю, а вночі — гріють, як ковдра.',
      en: 'How much of the sky is covered by clouds. By day clouds cool the Earth, at night they keep it warm like a blanket.',
    },
    stops: [[0, [30, 40, 70, 0]], [20, [200, 210, 225, 0.12]], [50, [215, 222, 232, 0.4]], [80, [230, 234, 240, 0.62]], [100, [245, 247, 250, 0.75]]],
  },
  {
    id: 'humidity', v: 'relative_humidity_2m', api: 'forecast', icon: 'Droplets', units: { uk: '%', en: '%' }, digits: 0,
    title: { uk: 'Вологість', en: 'Humidity' },
    desc: {
      uk: 'Відносна вологість повітря: 100 % — повітря більше не може втримати пару, з’являються туман чи роса.',
      en: 'Relative humidity: at 100 % the air cannot hold more water vapour, and fog or dew appears.',
    },
    stops: [[0, [160, 100, 50, 0.6]], [30, [210, 170, 100, 0.55]], [50, [190, 200, 150, 0.5]], [70, [90, 180, 170, 0.55]], [85, [50, 130, 200, 0.62]], [100, [40, 70, 170, 0.7]]],
  },
  {
    id: 'pressure', v: 'pressure_msl', api: 'forecast', icon: 'Gauge', units: { uk: 'гПа', en: 'hPa' }, digits: 0, isolines: 4,
    title: { uk: 'Тиск', en: 'Pressure' },
    desc: {
      uk: 'Атмосферний тиск на рівні моря. Лінії (ізобари) з’єднують місця з однаковим тиском. Низький тиск (циклон) — хмари й дощ, високий (антициклон) — ясно.',
      en: 'Air pressure at sea level. The lines (isobars) join places of equal pressure. Low pressure (a cyclone) brings clouds and rain, high pressure (an anticyclone) clear skies.',
    },
    stops: [[960, [110, 50, 150, 0.6]], [985, [60, 90, 190, 0.58]], [1000, [70, 160, 200, 0.52]], [1013, [120, 190, 150, 0.45]], [1022, [220, 200, 100, 0.52]], [1035, [230, 130, 60, 0.6]], [1050, [200, 50, 60, 0.66]]],
  },
  {
    id: 'cape', v: 'cape', api: 'forecast', icon: 'CloudLightning', units: { uk: 'Дж/кг', en: 'J/kg' }, digits: 0,
    title: { uk: 'Грози (CAPE)', en: 'Thunderstorms (CAPE)' },
    desc: {
      uk: 'Запас енергії для висхідних потоків повітря (CAPE). Понад 1000 Дж/кг — можливі грози й град, понад 2500 — дуже сильні грози.',
      en: 'Energy available for rising air (CAPE). Above 1000 J/kg thunderstorms and hail are possible, above 2500 very strong storms.',
    },
    stops: [[0, [0, 0, 0, 0]], [100, [80, 170, 90, 0]], [300, [80, 170, 90, 0.45]], [1000, [230, 210, 60, 0.62]], [2000, [240, 120, 40, 0.72]], [3000, [210, 40, 60, 0.8]], [4500, [170, 40, 170, 0.85]]],
  },
  {
    id: 'pm25', v: 'pm2_5', api: 'air', icon: 'Factory', units: { uk: 'мкг/м³', en: 'µg/m³' }, digits: 0,
    title: { uk: 'Пил PM2.5', en: 'PM2.5 particles' },
    desc: {
      uk: 'Дрібні частинки в повітрі (дим, вихлопи, пил), у 30 разів тонші за волосину. ВООЗ радить не більше 15 мкг/м³ за добу. Прогноз CAMS (Copernicus).',
      en: 'Tiny particles in the air (smoke, exhaust, dust), 30 times thinner than a hair. WHO advises at most 15 µg/m³ per day. CAMS (Copernicus) forecast.',
    },
    stops: [[0, [60, 170, 110, 0.35]], [10, [130, 200, 90, 0.45]], [15, [220, 210, 70, 0.55]], [25, [240, 160, 50, 0.62]], [50, [220, 70, 50, 0.7]], [100, [150, 40, 110, 0.78]], [250, [90, 20, 60, 0.85]]],
  },
  {
    id: 'dust', v: 'dust', api: 'air', icon: 'Sun', units: { uk: 'мкг/м³', en: 'µg/m³' }, digits: 0,
    title: { uk: 'Пилові бурі', en: 'Desert dust' },
    desc: {
      uk: 'Пил із пустель (Сахара, Аравія). Вітер іноді приносить його аж до України — тоді небо жовтіє, а на машинах лишається пил.',
      en: 'Dust from deserts (Sahara, Arabia). Sometimes the wind carries it as far as Ukraine: the sky turns yellow and cars get dusty.',
    },
    stops: [[0, [0, 0, 0, 0]], [10, [230, 200, 140, 0]], [25, [230, 200, 140, 0.4]], [100, [225, 165, 90, 0.6]], [300, [200, 120, 60, 0.72]], [800, [150, 80, 40, 0.82]], [2000, [100, 50, 30, 0.88]]],
  },
];

export const wxLayer = (id) => WX_LAYERS.find((l) => l.id === id) || null;

/** 256-entry RGBA lookup table over [min, max] of the palette */
export function paletteLUT(stops) {
  const lo = stops[0][0], hi = stops[stops.length - 1][0];
  const lut = new Uint8ClampedArray(256 * 4);
  for (let i = 0; i < 256; i++) {
    const v = lo + ((hi - lo) * i) / 255;
    let k = 0;
    while (k < stops.length - 2 && v > stops[k + 1][0]) k++;
    const [v0, c0] = stops[k], [v1, c1] = stops[k + 1];
    const f = Math.max(0, Math.min(1, (v - v0) / (v1 - v0 || 1)));
    for (let j = 0; j < 3; j++) lut[i * 4 + j] = c0[j] + (c1[j] - c0[j]) * f;
    lut[i * 4 + 3] = 255 * (c0[3] + (c1[3] - c0[3]) * f);
  }
  return { lut, lo, hi };
}

/** CSS gradient of a palette, for the legend bar (opaque, so it reads well) */
export function paletteCss(stops) {
  const lo = stops[0][0], hi = stops[stops.length - 1][0];
  const parts = stops.map(([v, c]) => `rgba(${c[0]},${c[1]},${c[2]},${Math.max(0.25, Math.min(1, c[3] + 0.3))}) ${(((v - lo) / (hi - lo)) * 100).toFixed(1)}%`);
  return `linear-gradient(to right, ${parts.join(',')})`;
}
