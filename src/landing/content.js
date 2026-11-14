// Everything on the first page that the team may want to change later lives here.

// Header buttons. `show: false` = prepared for the future, not displayed yet.
export const NAV = [
  { id: 'research', label: { uk: 'Дослідження', en: 'Research' }, show: false },
  { id: 'glossary', label: { uk: 'Глосарій', en: 'Glossary' }, show: false },
  { id: 'ai', label: { uk: 'Штучний інтелект', en: 'AI assistant' }, show: false },
  { id: 'auth', label: { uk: 'Увійти', en: 'Sign in' }, show: false },
  { id: 'lang', show: true },               // language switch (already works, so it is shown)
  { id: 'earth', label: { uk: '3D Земля', en: '3D Earth' }, show: true, href: '#/earth' },
];

export const HERO = {
  title: 'Be An Earth Detective',
  subtitle: {
    uk: 'Досліджуй, як змінюється наша планета, — за даними супутників NASA',
    en: 'Explore how our planet is changing — with NASA satellite data',
  },
  start: { uk: 'Почати', en: 'Start' },
  more: { uk: 'Дізнатись про проєкт більше', en: 'Learn more about the project' },
};

// Background video: NASA "Earth Views from the ISS – No Music" (NASA HQ, 2020),
// NASA Image and Video Library, public domain (no third-party music or credits).
export const VIDEO = {
  src: 'https://images-assets.nasa.gov/video/NHQ_2020_1221_Earth%20Views/NHQ_2020_1221_Earth%20Views~medium.mp4',
  poster: 'https://images-assets.nasa.gov/video/NHQ_2020_1221_Earth%20Views/NHQ_2020_1221_Earth%20Views~large_2.jpg',
  page: 'https://images.nasa.gov/details/NHQ_2020_1221_Earth%20Views',
  segment: [120, 300],   // seconds of the 44-minute video that loop on the page
};

// Text under the hero — placeholder until the team writes it.
export const ABOUT = {
  title: { uk: 'Про проєкт', en: 'About the project' },
  text: {
    uk: 'Тут буде розповідь про проєкт: яку проблему ми розв’язуємо, для кого він і що можна дослідити. (Текст для заміни.)',
    en: 'The project story goes here: what problem we solve, who it is for and what you can explore. (Placeholder text.)',
  },
};

export const FOOTER = {
  text: {
    uk: 'Проєкт створено для NASA Space Apps Challenge 2026 на челендж «Earth System Trend Detective». Розробила команда IT Detectives.',
    en: 'Made for the NASA Space Apps Challenge 2026, challenge “Earth System Trend Detective”, by team IT Detectives.',
  },
  links: [
    { id: 'nasa', label: 'NASA', url: 'https://www.nasa.gov/' },
    { id: 'spaceapps', label: 'NASA Space Apps', url: 'https://www.spaceappschallenge.org/2026/challenges/earth-system-trend-detective/' },
    // TODO: replace with the official site of the Noosphere Association when known
    { id: 'noosphere', label: { uk: 'Ноосфера', en: 'Noosphere' }, url: 'https://dou.ua/calendar/58348/' },
  ],
};
