// Everything on the start page that the team may want to change later lives here:
// texts (UA / EN), which header buttons are visible, the video and the logos.

const BASE = import.meta.env.BASE_URL || './';
export const asset = (path) => `${BASE}${path}`;

// Header navigation. `show: false` = already built and styled, hidden until the
// feature exists (the item stays in the page with display: none).
export const NAV = [
  { id: 'about', label: { uk: 'Про проєкт', en: 'About' }, href: '#about', show: true, scroll: true },
  { id: 'features', label: { uk: 'Можливості', en: 'Features' }, href: '#features', show: true, scroll: true },
  { id: 'roadmap', label: { uk: 'Плани', en: 'Roadmap' }, href: '#roadmap', show: true, dialog: 'roadmap' },
  { id: 'sources', label: { uk: 'Джерела', en: 'Sources' }, href: '#sources', show: true, dialog: 'sources' },
  { id: 'research', label: { uk: 'Дослідження', en: 'Research' }, href: '#/research', show: false },
  { id: 'glossary', label: { uk: 'Глосарій', en: 'Glossary' }, href: '#/glossary', show: false },
  { id: 'ai', label: { uk: 'Штучний інтелект', en: 'AI assistant' }, href: '#/ai', show: false },
  { id: 'earth', label: { uk: '3D Земля', en: '3D Earth' }, href: '#/earth', show: true, primary: true },
];

// Right side of the header.
export const TOOLS = {
  lang: true,                                                    // EN / UA switch (English by default)
  auth: { show: false, label: { uk: 'Авторизація', en: 'Sign in' }, href: '#/auth' },
};

export const BRAND = 'Be An Earth Detective';

export const HERO = {
  eyebrow: 'NASA Space Apps Challenge • IT Detectives',
  title: 'Be An Earth Detective',
  subtitle: {
    uk: 'Досліджуй, як змінюється наша планета, — за даними супутників NASA',
    en: 'Explore how our planet is changing — with NASA satellite data',
  },
  start: { uk: 'Почати', en: 'Start' },
  more: { uk: 'Дізнатись про проєкт більше', en: 'Learn more about the project' },
};

// Background video: NASA Scientific Visualization Studio, "Earth Observing Fleet
// (January 2023)" — NASA's Earth-observing satellites on their orbits (public domain).
// The original 1920×1080 60 fps WebM from the SVS page; the older 1280×720 cut stays
// as a fallback for browsers without WebM.
export const VIDEO = {
  webm: asset('video/earth-fleet-1080p.webm'),
  src: asset('video/earth-orbit.mp4'),
  poster: asset('video/earth-orbit.jpg'),
  page: 'https://svs.gsfc.nasa.gov/5061/',
  credit: 'NASA’s Scientific Visualization Studio · Earth Observing Fleet (2023)',
};

// Small numbers under the hero
export const STATS = [
  { value: '39', label: { uk: 'шарів даних NASA', en: 'NASA data layers' } },
  { value: '246', label: { uk: 'країн для порівняння', en: 'countries to compare' } },
  { value: '1880', label: { uk: 'з цього року є температура планети', en: 'the planet’s temperature since' } },
  { value: '58', label: { uk: 'місячних знімків фронту з 2022', en: 'monthly front-line snapshots since 2022' } },
];

// "About": what the project is, which problem it solves, for whom
export const ABOUT = {
  kicker: { uk: 'Про проєкт', en: 'About the project' },
  title: { uk: 'Супутники NASA бачать, як змінюється Земля. Ми допомагаємо це зрозуміти.', en: 'NASA satellites see how the Earth changes. We help you understand it.' },
  lead: {
    uk: 'Earth Trend Detective — інтерактивна Земля для кожного, кому цікаво, як змінюється наша планета. Ти обираєш тему — температуру, ліси, пожежі, лід чи забруднення повітря, — а сайт показує справжні супутникові дані NASA, перевіряє, чи зміна справді є трендом, і пояснює результат простими словами.',
    en: 'Earth Trend Detective is an interactive Earth for anyone curious about how our planet is changing. You pick a topic — temperature, forests, fires, ice or air pollution — and the site shows real satellite data, checks whether a change is really a trend and explains the result in plain words.',
  },
  pillars: [
    {
      icon: 'problem', title: { uk: 'Проблема', en: 'The problem' },
      text: {
        uk: 'Про клімат говорять усі, але перевірити самому складно. Дані NASA розкидані по десятках сайтів, у незвичних форматах і одиницях. А один спекотний рік — ще не тренд: без статистики легко повірити і паніці, і запереченню.',
        en: 'Everyone talks about the climate, but checking it yourself is hard. NASA data sits on dozens of websites in unusual formats and units. And one hot year is not a trend yet: without statistics it is easy to believe both panic and denial.',
      },
    },
    {
      icon: 'solution', title: { uk: 'Наше рішення', en: 'Our solution' },
      text: {
        uk: 'Усе в одному місці: 3D-Земля, контурна карта й карта OpenStreetMap з прогнозом погоди. Програма сама рахує тренд (нахил Сена й тест Манна–Кендалла), показує, наскільки йому можна вірити, і пояснює формули на прикладах із життя.',
        en: 'Everything in one place: a 3D Earth, a contour map and an OpenStreetMap map with a weather forecast. The app computes the trend itself (Sen’s slope and the Mann–Kendall test), shows how far you can trust it and explains the formulas with everyday examples.',
      },
    },
    {
      icon: 'people', title: { uk: 'Для кого', en: 'Who it is for' },
      text: {
        uk: 'Для всіх, хто хоче сам розібратися, що відбувається з планетою. Школярам і студентам — для уроків, проєктів МАН та олімпіад. Вчителям — щоб пояснювати клімат на живих прикладах. Журналістам, дослідникам і просто допитливим — щоб перевіряти факти власними очима. Спеціальних знань не треба; українською й англійською, безкоштовно, без реєстрації.',
        en: 'For everyone who wants to figure out for themselves what is happening to the planet. Students — for lessons, science fairs and olympiads. Teachers — to explain the climate with live examples. Journalists, researchers and the simply curious — to check facts with their own eyes. No special knowledge needed; in Ukrainian and English, free, no sign-up.',
      },
    },
  ],
};

// What you can explore — each card has a screenshot of the site (public/landing/shots)
export const FEATURES = [
  {
    id: 'globe', shot: { en: asset('landing/shots/en/globe.webp'), uk: asset('landing/shots/globe.webp') },
    title: { uk: '3D Земля', en: '3D Earth' },
    text: {
      uk: 'Справжні знімки супутників NASA на глобусі: обери день із 2000 року й наклади один із 39 шарів — температуру, рослинність, пожежі, нічні вогні, забруднення повітря.',
      en: 'Real NASA satellite pictures on a globe: pick any day since 2000 and add one of 39 layers — temperature, vegetation, fires, night lights, air pollution.',
    },
  },
  {
    id: 'weather', shot: asset('landing/shots/weather.webp'),   // English shot: retake when Open-Meteo allows
    title: { uk: 'Карта OSM і прогноз погоди', en: 'OSM map and weather forecast' },
    text: {
      uk: 'Детальна карта OpenStreetMap з містами й дорогами та живий прогноз на 4 дні: рух вітру, температура, опади, тиск з ізобарами, грози, пил і PM2.5. Клікни будь-де — отримаєш прогноз у точці.',
      en: 'A detailed OpenStreetMap map with towns and roads and a live 4-day forecast: moving wind, temperature, rain, pressure with isobars, thunderstorms, dust and PM2.5. Click anywhere for a point forecast.',
    },
  },
  {
    id: 'front', shot: { en: asset('landing/shots/en/front.webp'), uk: asset('landing/shots/front.webp') },
    title: { uk: 'Війна в Україні', en: 'War in Ukraine' },
    text: {
      uk: 'Як змінювалася окупована територія щомісяця з лютого 2022 року — за офіційним переліком Мінрозвитку. А ще пожежі вздовж фронту, підрив Каховської ГЕС і блекаути, помітні з космосу.',
      en: 'How the occupied territory changed month by month since February 2022, from the official government list. Plus fires along the front, the destroyed Kakhovka dam and blackouts seen from space.',
    },
  },
  {
    id: 'compare', shot: { en: asset('landing/shots/en/compare.webp'), uk: asset('landing/shots/compare.webp') },
    title: { uk: 'Порівняння країн і тренди', en: 'Countries and trends' },
    text: {
      uk: 'Дві країни поруч: 15 показників із 1981 року, перевірка тренду на значущість, прогноз до 2050 року й формули з підставленими числами — щоб кожен крок можна було перевірити.',
      en: 'Two countries side by side: 15 indicators since 1981, a significance test for every trend, a forecast to 2050 and formulas with real numbers — so every step can be checked.',
    },
  },
  {
    id: 'swipe', shot: { en: asset('landing/shots/en/swipe.webp'), uk: asset('landing/shots/swipe.webp') },
    title: { uk: 'Було / стало', en: 'Before / after' },
    text: {
      uk: 'Потягни повзунок між двома знімками: Аральське море в 1985 і 2025 роках, Каховське водосховище до й після, озеро Урмія, вирубка лісів Амазонії.',
      en: 'Drag the slider between two pictures: the Aral Sea in 1985 and 2025, the Kakhovka reservoir before and after, Lake Urmia, Amazon deforestation.',
    },
  },
];

// How it works, from a satellite to a conclusion
export const STEPS = [
  { icon: 'satellite', title: { uk: 'Супутники', en: 'Satellites' }, text: { uk: 'Terra, Aqua, Suomi NPP, NOAA-20 та інші щодня фотографують усю планету.', en: 'Terra, Aqua, Suomi NPP, NOAA-20 and others photograph the whole planet every day.' } },
  { icon: 'data', title: { uk: 'Дані NASA', en: 'NASA data' }, text: { uk: 'Знімки GIBS, клімат POWER, пожежі FIRMS, температура GISTEMP — ми перетворюємо їх на числа.', en: 'GIBS imagery, POWER climate, FIRMS fires, GISTEMP temperature — we turn them into numbers.' } },
  { icon: 'test', title: { uk: 'Перевірка', en: 'The test' }, text: { uk: 'Нахил Сена й тест Манна–Кендалла відділяють справжній тренд від випадкових коливань.', en: 'Sen’s slope and the Mann–Kendall test tell a real trend from random ups and downs.' } },
  { icon: 'answer', title: { uk: 'Висновок', en: 'The answer' }, text: { uk: 'Графік, формула й пояснення простими словами — висновок робиш ти сам.', en: 'A chart, a formula and a plain-language explanation — you draw the conclusion yourself.' } },
];

// Our planet: public-domain NASA photos (public/landing/photos)
export const PHOTOS = [
  {
    id: 'earthrise', src: asset('landing/photos/earthrise-1968.jpg'), year: '1968', url: 'https://images.nasa.gov/details/as08-14-2383',
    title: { uk: 'Схід Землі', en: 'Earthrise' },
    text: { uk: 'Apollo 8, 24 грудня 1968 року. Люди вперше побачили Землю, що сходить над Місяцем.', en: 'Apollo 8, 24 December 1968. People saw the Earth rise above the Moon for the first time.' },
    credit: 'NASA / Apollo 8',
  },
  {
    id: 'bluemarble', src: asset('landing/photos/blue-marble-1972.jpg'), year: '1972', url: 'https://images.nasa.gov/details/as17-148-22727',
    title: { uk: 'Блакитна куля', en: 'The Blue Marble' },
    text: { uk: 'Apollo 17, 7 грудня 1972 року, з відстані 29 000 км: уся Африка, Антарктида й Аравія на одному кадрі.', en: 'Apollo 17, 7 December 1972, from 29,000 km: all of Africa, Antarctica and Arabia in one frame.' },
    credit: 'NASA / Apollo 17',
  },
  {
    id: 'blackmarble', src: asset('landing/photos/black-marble-2016.jpg'), year: '2016', url: 'https://images.nasa.gov/details/GSFC_20171208_Archive_e001591',
    title: { uk: 'Чорна куля', en: 'Black Marble' },
    text: { uk: 'Вогні міст уночі за даними Suomi NPP. За такими знімками видно, де зникло світло під час блекаутів.', en: 'City lights at night from Suomi NPP. Pictures like this show where the lights went out during blackouts.' },
    credit: 'NASA Earth Observatory',
    action: { href: '#/earth/night', label: { uk: 'Подивитися Землю вночі на 3D-глобусі', en: 'See the night Earth on the 3D globe' } },
  },
  {
    id: 'epic', src: asset('landing/photos/epic-2025-06-21.jpg'), year: '2025', url: 'https://epic.gsfc.nasa.gov',
    title: { uk: 'Земля сьогодні', en: 'The Earth today' },
    text: { uk: '21 червня 2025 року, день літнього сонцестояння: камера EPIC на супутнику DSCOVR за 1,5 млн км знімає Землю щодня.', en: '21 June 2025, the summer solstice: the EPIC camera on DSCOVR, 1.5 million km away, photographs the Earth every day.' },
    credit: 'NASA EPIC / DSCOVR',
  },
];

export const CTA = {
  title: { uk: 'Готовий до розслідування?', en: 'Ready to investigate?' },
  text: { uk: 'Обери тему, знайди докази в даних і перевір їх числами. Земля чекає на свого детектива.', en: 'Pick a topic, find the evidence in the data and check it with numbers. The Earth is waiting for its detective.' },
  start: { uk: 'Відкрити 3D Землю', en: 'Open the 3D Earth' },
};

export const SECTIONS = {
  features: { kicker: { uk: 'Можливості', en: 'Features' }, title: { uk: 'Що можна дослідити', en: 'What you can explore' } },
  steps: { kicker: { uk: 'Як це працює', en: 'How it works' }, title: { uk: 'Від супутника до висновку', en: 'From a satellite to a conclusion' } },
  photos: { kicker: { uk: 'Наша планета', en: 'Our planet' }, title: { uk: 'Земля з космосу: 1968 → 2025', en: 'The Earth from space: 1968 → 2025' }, note: { uk: 'Усі фото — NASA, суспільне надбання.', en: 'All photos — NASA, public domain.' } },
};

export const FOOTER = {
  text: {
    uk: 'Проєкт створено в рамках челенджу «Earth System Trend Detective» хакатону NASA Space Apps Challenge 2026 командою IT Detectives.',
    en: 'Built for the “Earth System Trend Detective” challenge of the NASA Space Apps Challenge 2026 by team IT Detectives.',
  },
  // logos supplied by the team; `tile` = background the logo is designed for
  partners: [
    { id: 'nasa', name: 'NASA', url: 'https://www.nasa.gov/', logo: asset('brand/nasa.png'), tile: 'clear' },
    { id: 'spaceapps', name: 'NASA Space Apps Challenge', url: 'https://www.spaceappschallenge.org/', logo: asset('brand/space-apps.png'), tile: 'navy' },
    { id: 'noosphere', name: 'Noosphere Engineering School', url: 'https://noosphereglobal.com/', logo: asset('brand/noosphere.png'), tile: 'white' },
  ],
  sources: { uk: 'Джерела', en: 'Sources' },
  roadmap: { uk: 'Майбутні оновлення', en: 'Coming next' },
  ai: {
    uk: 'Під час розробки ми використовували ШІ-асистента Claude (Anthropic) — він допомагав писати код і тексти. Ідеї, дані, дизайн і перевірку зробила команда. Докладніше — у «Джерелах».',
    en: 'During development we used the AI assistant Claude (Anthropic) — it helped write code and texts. Ideas, data, design and checking were done by the team. More in “Sources”.',
  },
  sourcesTitle: { uk: 'Джерела даних і матеріалів', en: 'Data sources and materials' },
  sourcesLead: {
    uk: 'Усе, що ми використали для цього проєкту: дані, супутники, карти, статті, фото, відео, логотипи, шрифти, бібліотеки коду й інструменти, зокрема ШІ.',
    en: 'Everything we used for this project: data, satellites, maps, articles, photos, video, logos, fonts, code libraries and tools, including AI.',
  },
  disclaimer: {
    uk: 'Це студентський проєкт хакатону, а не офіційний продукт NASA; NASA його не схвалювала. Логотипи належать їхнім власникам і ведуть на їхні сайти.',
    en: 'This is a student hackathon project, not an official NASA product, and it is not endorsed by NASA. Logos belong to their owners and link to their websites.',
  },
};
