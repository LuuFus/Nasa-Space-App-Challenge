// Every data source, picture, tool and piece of code the project uses, in groups.
// Shown on the start page ("Sources") and in the app's "About" panel, and copied
// into README.md. Rule of the team: if we used it, it is listed here.
// Each item: [name, link or null, { en, uk } — what we use it for and the licence].

export const SOURCE_GROUPS = [
  {
    id: 'ai',
    title: { en: 'AI and tools we used to build the site', uk: 'ШІ та інструменти, якими ми робили сайт' },
    items: [
      ['Claude (Anthropic) — AI assistant', 'https://www.anthropic.com/claude', {
        en: 'we used AI while building this project: Claude (the Claude Opus 5.5 model) in Claude Code helped write the code, the explanation texts, the data pipeline and the hand-drawn SVG icons, and helped check the data. Ideas, choice of data, design and checking the results were done by team IT Detectives',
        uk: 'ми використовували ШІ під час розробки: Claude (модель Claude Opus 5.5) у Claude Code допомагав писати код, тексти пояснень, пайплайн даних і намальовані вручну SVG-іконки, а також перевіряти дані. Ідеї, вибір даних, дизайн і перевірку результатів робила команда IT Detectives',
      }],
      ['Claude Code', 'https://claude.com/claude-code', {
        en: 'the coding tool in which Claude worked on this repository, with the Shaders MCP server and skill (see .mcp.json and .claude/skills/)',
        uk: 'інструмент, у якому Claude працював із цим репозиторієм, разом із MCP-сервером і скілом Shaders (див. .mcp.json і .claude/skills/)',
      }],
      ['Figma', 'https://www.figma.com', { en: 'the team’s page design mock-ups', uk: 'макети дизайну сторінок, які зробила команда' }],
      ['GitHub and GitHub Pages', 'https://github.com/LuuFus/Nasa-Space-App-Challenge', {
        en: 'the project code, its whole development history and hosting of the live site',
        uk: 'код проєкту, уся історія розробки й розміщення сайту в інтернеті',
      }],
      ['Playwright + Google Chrome', 'https://playwright.dev', {
        en: 'automatic screenshots of our own site (start page, README) and an automatic check that every layer loads — Apache-2.0',
        uk: 'автоматичні скриншоти нашого сайту (стартова сторінка, README) і автоматична перевірка, що кожен шар завантажується — Apache-2.0',
      }],
      ['Python: requests, NumPy, Pillow', 'https://www.python.org', {
        en: 'the pipeline that turns NASA data into the site’s files (pipeline/ folder) — PSF, Apache-2.0, BSD-3, MIT-CMU licences',
        uk: 'пайплайн, що перетворює дані NASA на файли сайту (папка pipeline/) — ліцензії PSF, Apache-2.0, BSD-3, MIT-CMU',
      }],
      ['Node.js and npm', 'https://nodejs.org', { en: 'building the site and unit tests for the statistics (node --test) — MIT', uk: 'збирання сайту й тести статистики (node --test) — MIT' }],
    ],
  },
  {
    id: 'nasa',
    title: { en: 'NASA data and services', uk: 'Дані й сервіси NASA' },
    items: [
      ['NASA GIBS (WMTS / WMS)', 'https://gibs.earthdata.nasa.gov', {
        en: 'all satellite imagery and data layers, official colour maps and legends; part of NASA EOSDIS / Earthdata — public domain (NASA)',
        uk: 'усі супутникові знімки й шари даних, офіційні палітри й легенди; частина NASA EOSDIS / Earthdata — суспільне надбання (NASA)',
      }],
      ['NASA Worldview', 'https://worldview.earthdata.nasa.gov', { en: 'the “Open in NASA Worldview” link of every layer', uk: 'посилання «Відкрити в NASA Worldview» для кожного шару' }],
      ['NASA Worldview Snapshots', 'https://wvs.earthdata.nasa.gov', {
        en: 'satellite photos of the places in the anomaly hints (Terra, Aqua, Suomi NPP) — public domain',
        uk: 'супутникові фото місць у підказках-аномаліях (Terra, Aqua, Suomi NPP) — суспільне надбання',
      }],
      ['NASA POWER', 'https://power.larc.nasa.gov', {
        en: 'climate of 246 countries 1981–2025, the hotspot charts and daily weather for the 2026 events (NASA Langley Research Center POWER Project) — free use',
        uk: 'клімат 246 країн 1981–2025, графіки підказок і щоденна погода для подій 2026 року (NASA Langley Research Center, проєкт POWER) — вільне використання',
      }],
      ['NASA GISS GISTEMP v4', 'https://data.giss.nasa.gov/gistemp/', {
        en: 'planet temperature since 1880 (GISTEMP Team: GISS Surface Temperature Analysis, NASA Goddard Institute for Space Studies)',
        uk: 'температура планети з 1880 року (GISTEMP Team: GISS Surface Temperature Analysis, NASA GISS)',
      }],
      ['datasets/global-temp', 'https://github.com/datasets/global-temp', {
        en: 'a CSV copy of the same GISTEMP numbers, used by the pipeline only when the NASA server cannot be reached — ODC-PDDL',
        uk: 'CSV-копія тих самих чисел GISTEMP; пайплайн бере її, лише коли сервер NASA недоступний — ODC-PDDL',
      }],
      ['NASA Ozone Watch', 'https://ozonewatch.gsfc.nasa.gov', { en: 'ozone hole area and minimum ozone', uk: 'площа озонової діри й мінімум озону' }],
      ['NASA FIRMS', 'https://firms.modaps.eosdis.nasa.gov', {
        en: 'fires in Ukraine 2001–2025 and fire spread during events. We acknowledge the use of data from NASA’s Fire Information for Resource Management System (FIRMS), part of NASA’s ESDIS',
        uk: 'пожежі в Україні 2001–2025 і поширення вогню під час подій. Використано дані системи NASA FIRMS (Fire Information for Resource Management System), частини NASA ESDIS',
      }],
      ['NASA DSCOVR EPIC', 'https://epic.gsfc.nasa.gov', { en: 'photo of the whole Earth from 1.5 million km (21 June 2025) — public domain', uk: 'фото всієї Землі з відстані 1,5 млн км (21.06.2025) — суспільне надбання' }],
    ],
  },
  {
    id: 'missions',
    title: { en: 'Satellites, instruments and models behind the layers (all served by NASA GIBS)', uk: 'Супутники, прилади й моделі, з яких зроблено шари (усі — через NASA GIBS)' },
    items: [
      ['Terra & Aqua — MODIS (NASA)', 'https://www.earthdata.nasa.gov/data/instruments/modis', {
        en: 'pictures of the day, false colour 7-2-1, land surface temperature, NDVI / EVI, snow, land cover (MCD12Q1), ocean chlorophyll, fires',
        uk: 'знімки дня, хибні кольори 7-2-1, температура поверхні, NDVI / EVI, сніг, типи поверхні (MCD12Q1), хлорофіл в океані, пожежі',
      }],
      ['Suomi NPP, NOAA-20, NOAA-21 — VIIRS (NASA / NOAA)', 'https://www.earthdata.nasa.gov/data/instruments/viirs', {
        en: 'pictures of the day, fires (375 m), daily night-time radiance, ocean chlorophyll',
        uk: 'знімки дня, пожежі (375 м), нічне світіння за конкретну ніч, хлорофіл в океані',
      }],
      ['Black Marble (NASA)', 'https://blackmarble.gsfc.nasa.gov', { en: 'night lights of the whole planet (VIIRS)', uk: 'нічні вогні всієї планети (VIIRS)' }],
      ['Blue Marble (NASA Earth Observatory)', 'https://science.nasa.gov/earth/earth-observatory/collections/blue-marble/', { en: 'base pictures of the Earth (relief and true colour)', uk: 'основні знімки Землі (рельєф і справжні кольори)' }],
      ['Landsat (NASA / USGS) — WELD', 'https://science.nasa.gov/mission/landsat/', { en: 'Landsat 1984–2000 mosaic (Web-Enabled Landsat Data) and “before” pictures', uk: 'мозаїка Landsat 1984–2000 (Web-Enabled Landsat Data) і знімки «було»' }],
      ['MERRA-2 (NASA GMAO)', 'https://gmao.gsfc.nasa.gov/gmao-products/merra-2/', {
        en: 'monthly air temperature, root-zone soil water, precipitation, water vapour, dust PM2.5, aerosols, SO₂, ozone at 50 hPa',
        uk: 'місячні температура повітря, вода в ґрунті, опади, водяна пара, пил PM2.5, аерозолі, SO₂, озон на 50 гПа',
      }],
      ['GHRSST MUR (NASA JPL PO.DAAC)', 'https://podaac.jpl.nasa.gov/MEaSUREs-MUR', { en: 'sea surface temperature and its anomaly', uk: 'температура поверхні моря та її аномалія' }],
      ['SMAP (NASA)', 'https://smap.jpl.nasa.gov', { en: 'daily root-zone soil moisture', uk: 'щоденна вологість ґрунту' }],
      ['GPM IMERG (NASA / JAXA)', 'https://gpm.nasa.gov/data/imerg', { en: 'daily precipitation', uk: 'щоденні опади' }],
      ['AIRS on Aqua (NASA JPL)', 'https://airs.jpl.nasa.gov', { en: 'air humidity and methane', uk: 'вологість повітря й метан' }],
      ['AMSR2 on GCOM-W (JAXA)', 'https://www.eorc.jaxa.jp/AMSR/', { en: 'sea-ice concentration (AMSR Unified product)', uk: 'концентрація морського льоду (продукт AMSR Unified)' }],
      ['GRACE & GRACE-FO (NASA / DLR / GFZ)', 'https://grace.jpl.nasa.gov', { en: 'water storage (GRACE Tellus mascons) and the groundwater hint for India', uk: 'запаси води (GRACE Tellus mascons) і підказка про підземні води Індії' }],
      ['Aura — OMI (NASA, KNMI, FMI)', 'https://science.nasa.gov/mission/aura/', { en: 'nitrogen dioxide (NO₂) and total ozone', uk: 'діоксид азоту (NO₂) і загальний озон' }],
      ['Suomi NPP — OMPS (NASA / NOAA)', 'https://ozoneaq.gsfc.nasa.gov', { en: 'total ozone', uk: 'загальний озон' }],
      ['Terra — MOPITT (Canadian Space Agency, University of Toronto, NCAR)', 'https://www2.acom.ucar.edu/mopitt', { en: 'carbon monoxide (CO)', uk: 'чадний газ (CO)' }],
      ['Sentinel-5P — TROPOMI (ESA / EU Copernicus, KNMI)', 'https://sentiwiki.copernicus.eu/web/s5p-mission', {
        en: 'nitrogen dioxide (NO₂, TROPOMI layer). Contains modified Copernicus Sentinel data, processed by ESA and KNMI',
        uk: 'діоксид азоту (NO₂, шар TROPOMI). Містить змінені дані Copernicus Sentinel, оброблені ESA і KNMI',
      }],
    ],
  },
  {
    id: 'science',
    title: { en: 'Other science data', uk: 'Інші наукові дані' },
    items: [
      ['NOAA GML — Mauna Loa CO₂', 'https://gml.noaa.gov/ccgg/trends/', { en: 'atmospheric CO₂ (Dr. Xin Lan, NOAA/GML, and Dr. Ralph Keeling, Scripps) — US government, public domain', uk: 'CO₂ в атмосфері (Dr. Xin Lan, NOAA/GML, і Dr. Ralph Keeling, Scripps) — уряд США, суспільне надбання' }],
      ['NSIDC Sea Ice Index v4 (G02135)', 'https://nsidc.org/data/g02135', { en: 'sea-ice extent (Fetterer et al., National Snow and Ice Data Center) — free with citation', uk: 'площа морського льоду (Fetterer et al., NSIDC) — вільно з посиланням' }],
      ['Open-Meteo', 'https://open-meteo.com', {
        en: 'weather data by Open-Meteo.com: the forecast on the “OSM map” (best-match models of national weather services such as DWD, NOAA, ECMWF) — CC BY 4.0, non-commercial use',
        uk: 'дані погоди від Open-Meteo.com: прогноз на «Карті OSM» (найкращі моделі національних метеослужб, як-от DWD, NOAA, ECMWF) — CC BY 4.0, некомерційне використання',
      }],
      ['Copernicus Atmosphere Monitoring Service (CAMS)', 'https://atmosphere.copernicus.eu', {
        en: 'air-quality forecast (PM2.5, dust) through Open-Meteo: generated using Copernicus Atmosphere Monitoring Service information',
        uk: 'прогноз якості повітря (PM2.5, пил) через Open-Meteo: створено з використанням інформації Copernicus Atmosphere Monitoring Service',
      }],
      ['NOAA NESDIS', 'https://www.nesdis.noaa.gov/imagery/hurricanes/2026-hurricane-season-media-gallery', { en: 'Hurricane Isaias 2026 (link)', uk: 'ураган Ісаяс 2026 (посилання)' }],
    ],
  },
  {
    id: 'maps',
    title: { en: 'Maps, borders and place names', uk: 'Карти, кордони й назви' },
    items: [
      ['OpenStreetMap', 'https://www.openstreetmap.org/copyright', { en: 'world map of the “OSM map” — © OpenStreetMap contributors, ODbL', uk: 'карта світу на «Карті OSM» — © учасники OpenStreetMap, ODbL' }],
      ['Nominatim', 'https://nominatim.org', { en: 'place names for the point forecast (reverse geocoding on nominatim.openstreetmap.org) — © OpenStreetMap contributors, ODbL', uk: 'назви місць для прогнозу в точці (зворотне геокодування nominatim.openstreetmap.org) — © учасники OpenStreetMap, ODbL' }],
      ['OpenFreeMap', 'https://openfreemap.org', { en: 'OpenStreetMap vector tiles and Noto Sans map fonts (light and dark maps) — free, no key', uk: 'векторні тайли OpenStreetMap і шрифти карти Noto Sans (світла й темна карта) — безкоштовно, без ключа' }],
      ['OpenMapTiles', 'https://openmaptiles.org', { en: 'vector tile schema and the Positron / Dark Matter styles behind the light and dark maps — © OpenMapTiles, style design © CARTO; BSD-3 / CC BY 4.0', uk: 'схема векторних тайлів і стилі Positron / Dark Matter для світлої й темної карти — © OpenMapTiles, дизайн стилів © CARTO; BSD-3 / CC BY 4.0' }],
      ['Natural Earth 1:10m (Ukraine POV)', 'https://www.naturalearthdata.com', { en: 'borders, capitals, rivers, lakes, seas (files from github.com/nvkelso/natural-earth-vector) — public domain', uk: 'кордони, столиці, річки, озера, моря (файли з github.com/nvkelso/natural-earth-vector) — суспільне надбання' }],
      ['OCHA COD-AB Ukraine (HDX)', 'https://data.humdata.org/dataset/cod-ab-ukr', { en: 'Ukrainian community boundaries for the front layer — CC BY-IGO (with attribution)', uk: 'межі громад України для шару фронту — CC BY-IGO (з посиланням)' }],
      ['Order No. 376 of the Ministry for Development of Communities and Territories of Ukraine', 'https://zakon.rada.gov.ua/laws/show/z0380-25', {
        en: 'the official list of occupied territories and combat areas — an official document (not subject to copyright)',
        uk: 'наказ Мінрозвитку № 376: офіційний перелік окупованих територій і територій бойових дій — офіційний документ (не об’єкт авторського права)',
      }],
      ['Equal Earth projection (Šavrič, Patterson, Jenny, 2019)', 'https://doi.org/10.1080/13658816.2018.1504949', { en: 'the map projection of the contour map — free to use', uk: 'картографічна проєкція контурної карти — вільне використання' }],
    ],
  },
  {
    id: 'refs',
    title: { en: 'Articles, facts and methods (links only, the texts are written by us)', uk: 'Статті, факти й методи (лише посилання, тексти написали ми)' },
    items: [
      ['NASA Earth Observatory / NASA Science', 'https://science.nasa.gov/earth/earth-observatory/', { en: 'articles behind the events and anomaly hints', uk: 'статті до подій і підказок-аномалій' }],
      ['NASA Climate', 'https://science.nasa.gov/climate-change/', { en: 'the Arctic sea-ice record story', uk: 'історія про рекорд арктичного льоду' }],
      ['NOAA and NOAA GLERL', 'https://www.glerl.noaa.gov', { en: 'Gulf of Mexico “dead zone” and Lake Erie algal blooms', uk: '«мертва зона» Мексиканської затоки й цвітіння озера Ері' }],
      ['HELCOM', 'https://helcom.fi', { en: 'Baltic Sea algal blooms and dead zones', uk: 'цвітіння й мертві зони Балтійського моря' }],
      ['IAEA', 'https://www.iaea.org/newscenter/focus/ukraine', { en: 'facts for the war events (nuclear sites in Ukraine)', uk: 'факти до подій війни (ядерні об’єкти України)' }],
      ['EcoZagroza (Ministry of Environmental Protection of Ukraine)', 'https://ecozagroza.gov.ua', { en: 'war damage to nature', uk: 'шкода довкіллю від війни' }],
      ['Wikipedia', 'https://en.wikipedia.org', { en: 'dates and figures for some 2026 events', uk: 'дати й цифри деяких подій 2026 року' }],
      ['Trend statistics', 'https://doi.org/10.1016/S0022-1694(97)00125-X', {
        en: 'Sen’s slope (Sen, 1968), Mann–Kendall test (Mann, 1945; Kendall, 1975), modified Mann–Kendall test (Hamed & Rao, 1998), seasonal Mann–Kendall test (Hirsch et al., 1982) — our own code',
        uk: 'нахил Сена (Sen, 1968), тест Манна–Кендалла (Mann, 1945; Kendall, 1975), модифікований тест (Hamed & Rao, 1998), сезонний тест (Hirsch et al., 1982) — власний код',
      }],
      ['Windy.com', 'https://www.windy.com', { en: 'inspiration for the weather map (moving wind lines, time bar) — no code or data taken', uk: 'натхнення для карти погоди (рухомі лінії вітру, шкала часу) — код і дані не брали' }],
    ],
  },
  {
    id: 'media',
    title: { en: 'Photos, video, icons, fonts and logos', uk: 'Фото, відео, іконки, шрифти й логотипи' },
    items: [
      ['NASA Scientific Visualization Studio', 'https://svs.gsfc.nasa.gov/5061/', {
        en: 'start-page background video “Earth Observing Fleet (January 2023)” — NASA satellites in orbit; the original 1920×1080 60 fps file, a 1280×720 copy and its poster frame; public domain',
        uk: 'фонове відео стартової сторінки «Earth Observing Fleet (January 2023)» — супутники NASA на орбітах; оригінал 1920×1080 60 кадрів/с, копія 1280×720 і кадр-обкладинка; суспільне надбання',
      }],
      ['NASA Image and Video Library', 'https://images.nasa.gov', {
        en: 'photos “Earthrise” (Apollo 8, 1968), “The Blue Marble” (Apollo 17, 1972), “Black Marble” (Suomi NPP, 2016) — public domain',
        uk: 'фото «Схід Землі» (Apollo 8, 1968), «Блакитна куля» (Apollo 17, 1972), «Чорна куля» (Suomi NPP, 2016) — суспільне надбання',
      }],
      ['Screenshots of this site', null, { en: 'the pictures of the features on the start page and in README are screenshots of our own site', uk: 'картинки можливостей на стартовій сторінці й у README — скриншоти нашого власного сайту' }],
      ['Lucide icons', 'https://lucide.dev', { en: 'interface and event-marker icons — ISC; the start-page icons were drawn for this project (SVG code)', uk: 'іконки інтерфейсу й маркерів подій — ISC; іконки стартової сторінки намальовані для цього проєкту (SVG-код)' }],
      ['Fonts: Cormorant Garamond, Inter, JetBrains Mono (Fontsource), Noto Sans', 'https://fontsource.org', { en: 'SIL Open Font License 1.1', uk: 'SIL Open Font License 1.1' }],
      ['NASA Space Apps Challenge logo', 'https://www.spaceappschallenge.org', { en: 'shown to name the hackathon; belongs to NASA Space Apps', uk: 'показано, щоб назвати хакатон; належить NASA Space Apps' }],
      ['Noosphere Engineering School logo', 'https://noosphereglobal.com/', { en: 'logo of our partner, supplied by the team; belongs to its owner', uk: 'логотип нашого партнера, наданий командою; належить власнику' }],
      ['NASA logo', 'https://www.nasa.gov/nasa-brand-center/', { en: 'belongs to NASA; shown only as a reference to the hackathon. This is a student project, not endorsed by NASA', uk: 'належить NASA; показано лише як посилання на хакатон. Це студентський проєкт, NASA його не схвалювала' }],
    ],
  },
  {
    id: 'code',
    title: { en: 'Open-source code libraries', uk: 'Бібліотеки з відкритим кодом' },
    items: [
      ['React 19', 'https://react.dev', { en: 'the user interface — MIT', uk: 'інтерфейс — MIT' }],
      ['Vite 8 and @vitejs/plugin-react', 'https://vite.dev', { en: 'development server and build — MIT', uk: 'сервер розробки й збирання — MIT' }],
      ['Three.js', 'https://threejs.org', { en: 'the 3D globe (our own tile engine on top of it) — MIT', uk: '3D-глобус (наш власний рушій тайлів поверх неї) — MIT' }],
      ['MapLibre GL JS', 'https://maplibre.org', { en: 'the “OSM map” (flat and globe) — BSD-3-Clause', uk: '«Карта OSM» (плоска й глобус) — BSD-3-Clause' }],
      ['Apache ECharts', 'https://echarts.apache.org', { en: 'charts — Apache-2.0', uk: 'графіки — Apache-2.0' }],
      ['KaTeX', 'https://katex.org', { en: 'formulas — MIT', uk: 'формули — MIT' }],
      ['Zustand', 'https://github.com/pmndrs/zustand', { en: 'app state — MIT', uk: 'стан застосунку — MIT' }],
      ['Lucide / lucide-react', 'https://lucide.dev', { en: 'icon components — ISC', uk: 'компоненти іконок — ISC' }],
      ['Shaders', 'https://shaders.com', { en: 'WebGPU effects of the start page (ripples under the cursor, aurora) — MIT', uk: 'WebGPU-ефекти стартової сторінки (брижі під курсором, полярне сяйво) — MIT' }],
    ],
  },
  {
    id: 'event',
    title: { en: 'The challenge', uk: 'Хакатон' },
    items: [
      ['NASA Space Apps Challenge 2026 — “Earth System Trend Detective”', 'https://www.spaceappschallenge.org/2026/challenges/earth-system-trend-detective/', {
        en: 'the challenge this project answers; built by team IT Detectives',
        uk: 'челендж, на який відповідає проєкт; зробила команда IT Detectives',
      }],
    ],
  },
];

// flat list (older code and the README table use it)
export const SOURCES = SOURCE_GROUPS.flatMap((g) => g.items);
