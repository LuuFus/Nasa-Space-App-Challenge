import { useStore } from '../state/store.js';

// UI text in Ukrainian and English. Content (layers, events, glossary) carries
// its own {uk, en} pairs and is picked with pick().
export const STRINGS = {
  appTitle: { uk: 'Детектив змін Землі', en: 'Earth Trend Detective' },
  team: { uk: 'Команда IT Detectives · NASA Space Apps 2026', en: 'Team IT Detectives · NASA Space Apps 2026' },
  globe3d: { uk: '3D Земля', en: '3D Earth' },
  contourMap: { uk: 'Контурна карта', en: 'Contour map' },
  mapImagery: { uk: 'Карта зі знімками', en: 'Map with imagery' },
  osmMap: { uk: 'Карта OSM', en: 'OSM map' },
  hotspotMarkers: { uk: 'Значки аномалій на шарах', en: 'Anomaly signs on layers' },
  osmHint: { uk: 'Колесо — наблизити, тягни — рухати карту. Справа — прогноз погоди', en: 'Wheel to zoom, drag to move the map. Weather forecast on the right' },
  osmHintWx: { uk: 'Клікни на карту — прогноз у точці', en: 'Click the map for a point forecast' },
  layers: { uk: 'Шари', en: 'Layers' },
  compare: { uk: 'Порівняння країн', en: 'Country comparison' },
  planet: { uk: 'Уся планета', en: 'Whole planet' },
  report: { uk: 'Країна проти країни', en: 'Country vs country' },
  swipe: { uk: 'Було / стало', en: 'Before / after' },
  events: { uk: 'Події', en: 'Events' },
  glossary: { uk: 'Глосарій', en: 'Glossary' },
  about: { uk: 'Про проєкт', en: 'About' },
  view: { uk: 'Вигляд', en: 'View' },
  clouds: { uk: 'Хмари', en: 'Clouds' },
  borders: { uk: 'Кордони', en: 'Borders' },
  capitals: { uk: 'Столиці', en: 'Capitals' },
  rivers: { uk: 'Річки', en: 'Rivers' },
  countryNames: { uk: 'Назви країн', en: 'Country names' },
  oceans: { uk: 'Океани й моря', en: 'Oceans & seas' },
  graticule: { uk: 'Сітка координат', en: 'Grid lines' },
  tint: { uk: 'Кольори країн', en: 'Country colours' },
  eventMarkers: { uk: 'Події на карті', en: 'Events on the map' },
  baseImagery: { uk: 'Основа (знімок)', en: 'Base imagery' },
  dataLayer: { uk: 'Шар даних', en: 'Data layer' },
  none: { uk: 'Немає', en: 'None' },
  opacity: { uk: 'Прозорість', en: 'Opacity' },
  date: { uk: 'Дата', en: 'Date' },
  latest: { uk: 'Найновіше', en: 'Latest' },
  prev: { uk: '◀ Назад', en: '◀ Back' },
  next: { uk: 'Далі ▶', en: 'Next ▶' },
  play: { uk: '▶ Анімація', en: '▶ Animate' },
  stop: { uk: '■ Стоп', en: '■ Stop' },
  legend: { uk: 'Легенда', en: 'Legend' },
  source: { uk: 'Джерело', en: 'Source' },
  openWorldview: { uk: 'Відкрити в NASA Worldview', en: 'Open in NASA Worldview' },
  cat_base: { uk: 'Знімки Землі', en: 'Earth imagery' },
  cat_temperature: { uk: 'Температура', en: 'Temperature' },
  cat_vegetation: { uk: 'Рослинність і суходіл', en: 'Vegetation & land' },
  cat_water: { uk: 'Вода, ґрунт, лід', en: 'Water, soil, ice' },
  cat_fire: { uk: 'Пожежі', en: 'Fires' },
  cat_lights: { uk: 'Нічні вогні', en: 'Night lights' },
  cat_air: { uk: 'Повітря і викиди', en: 'Air & emissions' },
  cat_ozone: { uk: 'Озоновий шар', en: 'Ozone layer' },
  cat_climate: { uk: 'Клімат і тренди', en: 'Climate & trends' },
  cat_war: { uk: 'Війна в Україні: лінія фронту', en: 'War in Ukraine: front line' },
  valueHere: { uk: 'Тут', en: 'Here' },
  clickToPick: { uk: 'Клацни на країну, щоб обрати її', en: 'Click a country to select it' },
  countryA: { uk: 'Країна A', en: 'Country A' },
  countryB: { uk: 'Країна B', en: 'Country B' },
  pickOnMap: { uk: 'обрати на карті', en: 'pick on map' },
  variable: { uk: 'Що порівнюємо', en: 'What to compare' },
  season: { uk: 'Період року', en: 'Time of year' },
  wholeYear: { uk: 'Увесь рік', en: 'Whole year' },
  showAs: { uk: 'Показати як', en: 'Show as' },
  values: { uk: 'Значення', en: 'Values' },
  anomalies: { uk: 'Відхилення від норми', en: 'Anomalies' },
  difference: { uk: 'Різниця A − B', en: 'Difference A − B' },
  forecastTo: { uk: 'Прогноз до', en: 'Forecast to' },
  fullscreen: { uk: '⛶ На весь екран', en: '⛶ Full screen' },
  closeFullscreen: { uk: '✕ Закрити', en: '✕ Close' },
  whatItMeans: { uk: 'Що це означає простими словами', en: 'What it means in plain words' },
  formulas: { uk: 'Формули й розрахунки', en: 'Formulas & calculations' },
  trend: { uk: 'Тренд', en: 'Trend' },
  forecast: { uk: 'Прогноз', en: 'Forecast' },
  loading: { uk: 'Завантаження…', en: 'Loading…' },
  noData: { uk: 'Немає даних', en: 'No data' },
  consentTitle: { uk: 'Показати на контурній карті?', en: 'Show on the contour map?' },
  consentYes: { uk: 'Так, перейти', en: 'Yes, switch' },
  consentNo: { uk: 'Ні, лишити 3D', en: 'No, keep 3D' },
  remember: { uk: 'Не питати знову', en: 'Don’t ask again' },
  swipeTitle: { uk: 'Порівняння «було — стало»', en: 'Before / after comparison' },
  left: { uk: 'Ліворуч (було)', en: 'Left (before)' },
  right: { uk: 'Праворуч (стало)', en: 'Right (after)' },
  layer: { uk: 'Шар', en: 'Layer' },
  turnOff: { uk: 'Вимкнути порівняння', en: 'Turn comparison off' },
  turnOn: { uk: 'Увімкнути', en: 'Turn on' },
  presets: { uk: 'Готові приклади', en: 'Ready-made examples' },
  dragHint: { uk: 'Тягни повзунок ↔', en: 'Drag the slider ↔' },
  search: { uk: 'Пошук…', en: 'Search…' },
  example: { uk: 'Приклад', en: 'Example' },
  formula: { uk: 'Формула', en: 'Formula' },
  showOnMap: { uk: 'Показати на карті', en: 'Show on the map' },
  showBeforeAfter: { uk: 'Було / стало', en: 'Before / after' },
  readMore: { uk: 'Докладніше', en: 'Read more' },
  all: { uk: 'Усі', en: 'All' },
  mapColor: { uk: 'Розфарбувати карту за трендом', en: 'Colour the map by trend' },
  trendMapOff: { uk: 'Прибрати розфарбування', en: 'Clear map colours' },
  perDecade: { uk: 'за 10 років', en: 'per decade' },
  significant: { uk: 'статистично значущий', en: 'statistically significant' },
  notSignificant: { uk: 'може бути випадковим', en: 'could be random' },
  data: { uk: 'Дані', en: 'Data' },
  year: { uk: 'Рік', en: 'Year' },
  zoomHint: { uk: 'Колесо — наблизити, тягни — обертати, подвійний клік — до точки', en: 'Wheel to zoom, drag to rotate, double-click to fly in' },
};

export function translate(lang, key, vars) {
  const s = STRINGS[key];
  let txt = s ? s[lang] ?? s.en : key;
  if (vars) for (const [k, v] of Object.entries(vars)) txt = txt.replaceAll(`{${k}}`, v);
  return txt;
}

export function pickLang(lang, obj) {
  if (obj == null) return '';
  if (typeof obj === 'string') return obj;
  return obj[lang] ?? obj.en ?? obj.uk ?? '';
}

export function useT() {
  const lang = useStore((s) => s.lang);
  return {
    lang,
    t: (key, vars) => translate(lang, key, vars),
    pick: (obj) => pickLang(lang, obj),
  };
}
