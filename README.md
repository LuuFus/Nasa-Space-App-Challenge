# Earth Trend Detective — IT Detectives

<img width="1024" height="1024" alt="зображення" src="https://github.com/user-attachments/assets/81a83602-7c35-4e13-8475-0d06a85c84fc" />

**NASA Space Apps Challenge 2026 · [Earth System Trend Detective](https://www.spaceappschallenge.org/2026/challenges/earth-system-trend-detective/)**

Інтерактивна Земля для школярів і студентів: супутникові дані NASA на 3D-глобусі або на контурній карті,
порівняння країн, перевірка трендів на статистичну значущість і пояснення простими словами.

An interactive Earth for students: NASA satellite data on a 3D globe or a contour map, country comparisons,
statistical trend tests and plain-language explanations (Ukrainian / English).

## Що вміє / Features

| | |
|---|---|
| 🌍 **3D Земля** | Тайли NASA GIBS з рівнями деталізації (як у Google Earth), атмосфера, зорі, справжні хмари обраного дня (VIIRS) |
| 🛰 **Карта OSM** | Детальна карта OpenStreetMap (MapLibre GL): класична, світла, темна (векторні тайли OpenFreeMap, підписи UA/EN) або супутникова NASA з підписами. На ній ті самі шари NASA GIBS (у веб-Меркаторі, зі значенням під курсором), лінія фронту, події, пожежі, порівняння країн |
| ⚠️ **Підказки-аномалії** | Коли увімкнено шар (хлорофіл, NDVI, температура, лід, пожежі, NO₂, AOD, SO₂, озон, GRACE, опади, нічні вогні…), на карті з'являються значки там, де він показує щось незвичне — 26 місць. Наведи — відкриється вікно, яке можна гортати: що ти бачиш, чому так (люди чи природа), чим загрожує, приклад із життя, що з цим роблять, супутникове фото того місця й графік змін за роки з трендом (Сен + Манн–Кендалл). Дані готує крок 11 |
| 🌙 **Земля вночі** | Уся планета у світлі міст (Black Marble 2016) — кнопка в шарах «Нічні вогні» і посилання з фото на стартовій сторінці |
| 🌬 **Прогноз погоди (ідея Windy)** | Живий прогноз Open-Meteo на 4 дні на карті OSM: рухомі лінії вітру (частинки), пориви, температура, опади, хмарність, вологість, тиск з ізобарами, грози (CAPE), PM2.5 і пилові бурі (CAMS); шкала часу з анімацією, легенда, прогноз у точці кліку з графіком і назвою місця (Nominatim) |
| 🗺 **Контурна карта** | Глобус «розгортається» в карту світу (проєкція Equal Earth); біла суша, блакитні моря, сітка — як шкільна контурна карта. Для глобальних тем програма *пропонує* перейти на неї, але питає згоди |
| 🧭 **Кордони** | Кожна країна обведена смужкою **свого** кольору з внутрішнього боку кордону — видно, чий кордон; малі країни — пунктиром, мікродержави — кільцем; Крим — у складі України (Natural Earth, Ukraine POV) |
| 🏙 **Підписи** | Країни, столиці, річки, океани й моря українською/англійською, з усуненням накладань |
| 🛰 **Шари** | 39 шарів NASA: температура повітря й поверхні, NDVI/EVI, вологість ґрунту, опади, вологість повітря, сніг, лід, GRACE, пожежі, нічні вогні, NO₂, PM2.5, аерозолі, SO₂, CO, метан, озон… з датою, анімацією, легендою і значенням під курсором |
| 📈 **Порівняння країн** | Дві країни, 15 змінних (зокрема NDVI, температура поверхні, PM2.5, аерозолі, SO₂ з MODIS), сезони, аномалії, різниця A−B. Тренд — **нахил Сена** з 95 % інтервалом + **модифікований тест Манна–Кендалла** (Hamed & Rao 1998, поправка на автокореляцію) + **сезонний тест Манна–Кендалла** (Hirsch 1982); показано Z, критичне значення 1,96 і p; МНК — для порівняння. Прогноз до 2030–2050 уздовж лінії Сена з 95 % інтервалом і перевіркою на минулому (hindcast). Пропуски в даних не заповнюються, а пропускаються й рахуються. Формули з підставленими числами й поясненням «чому саме ці числа» |
| 🆚 **Порівняння країн** (одна вкладка) | Дві країни поруч зі знімками вдень і вночі; зведення «Головні виклики» / «Позитивні тренди» (порівняно з рештою світу, у перцентилях); згорнуте «Детальне дослідження» — усі показники з міні-графіками, і кожен відкриває свій графік, прогноз і формули просто в таблиці |
| 🌡 **Карти трендів** | Наші розрахунки по кожному пікселю (нахил Сена + модифікований Манн–Кендалл): де тренд значущий (p < 0,05); порівняння першого й останнього десятиліття повзунком; річні аномалії температури 1980–2025 з анімацією |
| ⇆ **Було / стало** | Розділений екран з повзунком: Арал (Landsat 1985 → MODIS 2025), Каховка, Урмія, Поопо, Рондонія, Пакистан… |
| 🇺🇦 **Війна в Україні** | Лінія фронту й окуповані території щомісяця з лютого 2022 за **офіційним переліком ТОТ** (наказ Мінрозвитку № 376) на межах громад OCHA, з анімацією та порівнянням дат; графік окупованої площі; події: Каховська ГЕС, блекаути (нічні вогні), пожежі вздовж фронту, Чорнобильська зона, ліси біля Кремінної, Демидів — з поясненням «що ти бачиш»; графік пожеж FIRMS 2001–2025 за областями |
| 🔥 **Поширення пожеж** | Точки NASA FIRMS день за днем (колір = вік вогню), програвання, денна гістограма, рух центру пожежі й напрям (Чорнобильська зона 2020, Австралія 2019–20, Канада 2023, фронт 2022–23) |
| 🌀 **Події 2026** | Пожежі в США, спека в Європі, ураган, озеро Пауелл, повені в Таїланді, землетрус і цунамі — «було / стало» і графіки причин: чим погода перед подією відрізнялася від норми 1991–2020 (NASA POWER) |
| 🏠 **Стартова сторінка** | «Be An Earth Detective»: відео NASA SVS 1080p60 із супутниками на орбітах, на якому під курсором розходяться брижі (WebGPU, пакет `shaders`); про проєкт — проблема, рішення, для кого; можливості зі скриншотами сайту; «як це працює»; фото Землі NASA 1968–2025; фінал із полярним сяйвом; кнопки, що переливаються, і кільце-курсор. Без WebGPU або з «зменшеним рухом» — та сама сторінка без ефектів |
| 📖 **Глосарій** | ~50 термінів і формул (NDVI, p-значення, Манн–Кендалл, Добсон…) |
| 🇺🇦/🇬🇧 | Перемикання мови |

## Запуск / Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in dist/ (works from any sub-folder, e.g. GitHub Pages)
npm test           # unit tests for the statistics
```

Дані вже лежать у `public/data`. Щоб перебудувати їх з першоджерел NASA:

```bash
python -m pip install -r pipeline/requirements.txt
python pipeline/run_all.py            # all steps (first run downloads a few GB of tiles, ~30 min)
python pipeline/run_all.py 02 06      # only some steps
```

Крок 10 (лінія фронту) читає офіційний перелік ТОТ: завантаж додатки до наказу № 376 (.docx, зараз це три файли
редакції від 26.05.2026) з [zakon.rada.gov.ua/laws/show/z0380-25](https://zakon.rada.gov.ua/laws/show/z0380-25) у `pipeline/data/tot/`
і запусти `python pipeline/run_all.py 10`. Громада вважається окупованою, коли окуповано щонайменше половину її населених пунктів зі списку.

Для розробників з Claude Code: у `.mcp.json` підключено MCP-сервер [Shaders](https://shaders.com/docs/guide/mcp)
(при першому підключенні попросить увійти в акаунт Shaders), у `.claude/skills/shaders/` — скіл бібліотеки.

## Стек / Stack

React 19 · Vite · Three.js (власний рушій тайлів, без готових глобус-бібліотек) · MapLibre GL (карта OSM) · Shaders (WebGPU-ефекти стартової сторінки) · ECharts · KaTeX · Zustand · Lucide ·
Python (requests, numpy, Pillow) для конвертації даних NASA.

```
src/engine/    3D engine: TileLayer (GIBS quadtree), LineLayer (borders), Labels, Controls, globe↔map morph
src/lib/       statistics (stats.js + tests), explanations, legends (colour → number), dates
src/ui/        panels: layers, compare, country report, planet, before/after, events, fires, causes, glossary, about
src/map/       OpenStreetMap view (MapLibre): base maps, NASA layers in web Mercator, front line, weather (Open-Meteo)
src/landing/   start page (content.js = all texts; shaders.jsx = WebGPU effects)
src/content/   events, glossary, variables (UA/EN texts)
pipeline/      01…10 Python scripts that turn NASA (and other open) data into files in public/data
```

## Дані / Data sources

| Джерело | Що беремо |
|---|---|
| [NASA GIBS](https://gibs.earthdata.nasa.gov) | усі знімки й шари на глобусі; офіційні палітри (colormaps) для легенд і для перетворення кольору в число |
| [NASA POWER](https://power.larc.nasa.gov) | місячні ряди 1981–2025 (T2M, T2M_MAX/MIN, PRECTOTCORR, GWETROOT/TOP, RH2M, QV2M, WS2M, ALLSKY_SFC_SW_DWN) для 246 країн, 900 точок; денні ряди 1991–2026 для місць подій 2026 року (крок 09) |
| [NASA GISS GISTEMP v4](https://data.giss.nasa.gov/gistemp/) | глобальна аномалія температури 1880–2025 |
| [NASA Ozone Watch](https://ozonewatch.gsfc.nasa.gov) | площа озонової діри, мінімум озону |
| [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov) | пожежі MODIS в Україні, Польщі, Білорусі, Молдові, Румунії 2001–2025; точки пожеж для подій (крок 08) |
| [NASA Earth Observatory](https://science.nasa.gov/earth/earth-observatory/) | статті до подій |
| [NSIDC Sea Ice Index v4](https://nsidc.org/data/g02135) | площа морського льоду (Арктика у вересні, Антарктика в лютому) |
| [NOAA GML](https://gml.noaa.gov/ccgg/trends/) | CO₂ Мауна-Лоа |
| [Natural Earth 1:10m, Ukraine POV](https://www.naturalearthdata.com) | кордони, столиці, річки, озера, моря |
| [Перелік ТОТ, наказ Мінрозвитку № 376](https://zakon.rada.gov.ua/laws/show/z0380-25) | окуповані території й території бойових дій з датами початку й завершення (кодами КАТОТТГ) — офіційний документ, не є об’єктом авторського права |
| [OCHA COD-AB Ukraine (HDX)](https://data.humdata.org/dataset/cod-ab-ukr) | межі громад України для лінії фронту — CC BY-IGO |
| [IAEA](https://www.iaea.org/newscenter/focus/ukraine), [EcoZagroza](https://ecozagroza.gov.ua/) | факти до подій війни (Чорнобиль, ліси) |
| [NOAA NESDIS](https://www.nesdis.noaa.gov/imagery/hurricanes/2026-hurricane-season-media-gallery), Wikipedia | дати й цифри подій 2026 року (тексти наші, лише посилання) |
| [NASA Scientific Visualization Studio](https://svs.gsfc.nasa.gov/5061/) | відео «Earth Observing Fleet (January 2023)» на стартовій сторінці: оригінальний файл 1920×1080, 60 кадрів/с (`public/video/earth-fleet-1080p.webm`) і запасний 1280×720 (`earth-orbit.mp4`) — суспільне надбання |
| [NASA Image and Video Library](https://images.nasa.gov), [NASA EPIC](https://epic.gsfc.nasa.gov) | фото на стартовій сторінці: «Схід Землі» (Apollo 8), «Блакитна куля» (Apollo 17), «Чорна куля» 2016, DSCOVR EPIC 21.06.2025 — суспільне надбання |
| [OpenStreetMap](https://www.openstreetmap.org/copyright) | карта OSM (тайли openstreetmap.org) і назви місць для прогнозу в точці (Nominatim) — © учасники OpenStreetMap, ODbL |
| [OpenFreeMap](https://openfreemap.org) | векторні тайли OSM для світлої й темної карти — безкоштовно, без ключа |
| [NASA Worldview Snapshots](https://wvs.earthdata.nasa.gov) | супутникові фото місць у підказках-аномаліях (`public/data/hotspots/`, крок 11) — суспільне надбання |
| [Open-Meteo](https://open-meteo.com) | прогноз погоди (моделі DWD ICON, NOAA GFS, ECMWF…) і якості повітря (CAMS) — CC BY 4.0, некомерційне використання |
| Логотипи NASA, NASA Space Apps Challenge, Noosphere | лише як посилання на організаторів хакатону; належать власникам, проєкт не схвалений NASA |
| [Fontsource](https://fontsource.org): Cormorant Garamond, Inter, JetBrains Mono | шрифти — SIL Open Font License 1.1 |
| [Lucide](https://lucide.dev) | векторні іконки інтерфейсу й маркерів подій — ISC; іконки стартової сторінки намальовані нами |
| [MapLibre GL JS](https://maplibre.org) · [Shaders](https://shaders.com) | рушій карти OSM (BSD-3) і WebGPU-ефекти стартової сторінки (MIT) |

Обмеження чесно описані у вкладці «Про проєкт»: значення країни — середнє з кількох точок POWER;
карти трендів і NDVI країн отримані з кольорів GIBS (точність = крок палітри); прогноз — продовження лінійного тренду.

## Команда / Team

IT Detectives · NASA Space Apps Challenge 2026
