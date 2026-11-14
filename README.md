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
| 🗺 **Контурна карта** | Глобус «розгортається» в карту світу (проєкція Equal Earth); біла суша, блакитні моря, сітка — як шкільна контурна карта. Для глобальних тем програма *пропонує* перейти на неї, але питає згоди |
| 🧭 **Кордони** | Кожна країна обведена смужкою **свого** кольору з внутрішнього боку кордону — видно, чий кордон; малі країни — пунктиром, мікродержави — кільцем; Крим — у складі України (Natural Earth, Ukraine POV) |
| 🏙 **Підписи** | Країни, столиці, річки, океани й моря українською/англійською, з усуненням накладань |
| 🛰 **Шари** | 39 шарів NASA: температура повітря й поверхні, NDVI/EVI, вологість ґрунту, опади, вологість повітря, сніг, лід, GRACE, пожежі, нічні вогні, NO₂, PM2.5, аерозолі, SO₂, CO, метан, озон… з датою, анімацією, легендою і значенням під курсором |
| 📈 **Порівняння країн** | Дві країни, 12 змінних, сезони, аномалії, різниця A−B; тренд (МНК + t-тест), тест Манна–Кендалла, нахил Сена, прогноз до 2030–2050 з 95 % інтервалом; графік розтягується на весь екран; формули з підставленими числами; пояснення з прикладами з життя |
| 🌡 **Карти трендів** | Наші розрахунки по кожному пікселю: де тренд значущий (p < 0,05); річні аномалії температури 1980–2025 з анімацією |
| ⇆ **Було / стало** | Розділений екран з повзунком: Арал (Landsat 1985 → MODIS 2025), Каховка, Урмія, Поопо, Рондонія, Пакистан… |
| ⚠ **Війна в Україні** | Каховська ГЕС, блекаути (нічні вогні), пожежі вздовж фронту, Чорнобильська зона, ліси біля Кремінної, Демидів; графік пожеж FIRMS 2001–2025 за областями |
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

## Стек / Stack

React 19 · Vite · Three.js (власний рушій тайлів, без готових глобус-бібліотек) · ECharts · KaTeX · Zustand ·
Python (requests, numpy, Pillow) для конвертації даних NASA.

```
src/engine/    3D engine: TileLayer (GIBS quadtree), LineLayer (borders), Labels, Controls, globe↔map morph
src/lib/       statistics (stats.js + tests), explanations, legends (colour → number), dates
src/ui/        panels: layers, compare, planet, before/after, events, glossary, about
src/content/   events, glossary, variables (UA/EN texts)
pipeline/      01…06 Python scripts that turn NASA data into files in public/data
```

## Дані / Data sources

| Джерело | Що беремо |
|---|---|
| [NASA GIBS](https://gibs.earthdata.nasa.gov) | усі знімки й шари на глобусі; офіційні палітри (colormaps) для легенд і для перетворення кольору в число |
| [NASA POWER](https://power.larc.nasa.gov) | місячні ряди 1981–2025 (T2M, T2M_MAX/MIN, PRECTOTCORR, GWETROOT/TOP, RH2M, QV2M, WS2M, ALLSKY_SFC_SW_DWN) для 246 країн, 900 точок |
| [NASA GISS GISTEMP v4](https://data.giss.nasa.gov/gistemp/) | глобальна аномалія температури 1880–2025 |
| [NASA Ozone Watch](https://ozonewatch.gsfc.nasa.gov) | площа озонової діри, мінімум озону |
| [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov) | пожежі MODIS в Україні, Польщі, Білорусі, Молдові, Румунії 2001–2025 |
| [NASA Earth Observatory](https://science.nasa.gov/earth/earth-observatory/) | статті до подій |
| [NSIDC Sea Ice Index v4](https://nsidc.org/data/g02135) | площа морського льоду (Арктика у вересні, Антарктика в лютому) |
| [NOAA GML](https://gml.noaa.gov/ccgg/trends/) | CO₂ Мауна-Лоа |
| [Natural Earth 1:10m, Ukraine POV](https://www.naturalearthdata.com) | кордони, столиці, річки, озера, моря |
| [IAEA](https://www.iaea.org/newscenter/focus/ukraine), [EcoZagroza](https://ecozagroza.gov.ua/) | факти до подій війни (Чорнобиль, ліси) |

Обмеження чесно описані у вкладці «Про проєкт»: значення країни — середнє з кількох точок POWER;
карти трендів і NDVI країн отримані з кольорів GIBS (точність = крок палітри); прогноз — продовження лінійного тренду.

## Команда / Team

IT Detectives · NASA Space Apps Challenge 2026
