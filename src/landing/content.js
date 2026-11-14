// Everything on the start page that the team may want to change later lives here:
// texts (UA / EN), which header buttons are visible, the video and the logos.

const BASE = import.meta.env.BASE_URL || './';
export const asset = (path) => `${BASE}${path}`;

// Header navigation. `show: false` = already built and styled, hidden until the
// feature exists (the item stays in the page with display: none).
export const NAV = [
  { id: 'research', label: { uk: 'Дослідження', en: 'Research' }, href: '#/research', show: false },
  { id: 'glossary', label: { uk: 'Глосарій', en: 'Glossary' }, href: '#/glossary', show: false },
  { id: 'ai', label: { uk: 'Штучний інтелект', en: 'AI assistant' }, href: '#/ai', show: false },
  { id: 'earth', label: { uk: '3D Земля', en: '3D Earth' }, href: '#/earth', show: true, primary: true },
];

// Right side of the header.
export const TOOLS = {
  lang: true,                                                    // UA / EN switch (works already)
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
// We cut 36 s of it, slowed it down a little and saved it at 1280×720 without sound.
export const VIDEO = {
  src: asset('video/earth-orbit.mp4'),
  poster: asset('video/earth-orbit.jpg'),
  page: 'https://svs.gsfc.nasa.gov/5061/',
  credit: 'NASA’s Scientific Visualization Studio · Earth Observing Fleet (2023)',
};

// "About" card — placeholder until the team writes the text.
export const ABOUT = {
  title: { uk: 'Про проєкт', en: 'About the project' },
  text: {
    uk: 'Тут буде опис проєкту, його мета та можливості дослідження... [Текст для заміни]',
    en: 'The project description, its goal and what you can explore will go here... [Placeholder text]',
  },
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
  sourcesTitle: { uk: 'Джерела даних і матеріалів', en: 'Data sources and materials' },
  disclaimer: {
    uk: 'Це студентський проєкт хакатону, а не офіційний продукт NASA; NASA його не схвалювала. Логотипи належать їхнім власникам і ведуть на їхні сайти.',
    en: 'This is a student hackathon project, not an official NASA product, and it is not endorsed by NASA. Logos belong to their owners and link to their websites.',
  },
};
