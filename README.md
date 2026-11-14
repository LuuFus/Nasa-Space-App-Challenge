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
| 📈 **Порівняння країн** | Дві країни, 15 змінних (зокрема NDVI, температура поверхні, PM2.5, аерозолі, SO₂ з MODIS), сезони, аномалії, різниця A−B. Тренд — **нахил Сена** з 95 % інтервалом + **модифікований тест Манна–Кендалла** (Hamed & Rao 1998, поправка на автокореляцію) + **сезонний тест Манна–Кендалла** (Hirsch 1982); показано Z, критичне значення 1,96 і p; МНК — для порівняння. Прогноз до 2030–2050 уздовж лінії Сена з 95 % інтервалом і перевіркою на минулому (hindcast). Пропуски в даних не заповнюються, а пропускаються й рахуються. Формули з підставленими числами й поясненням «чому саме ці числа» |
| 🆚 **Країна проти країни** | Усі показники двох країн поруч: знімки країни вдень і вночі, головні проблеми й покращення (порівняно з рештою світу, у перцентилях), міні-графіки; панель можна розширити |
| 🌡 **Карти трендів** | Наші розрахунки по кожному пікселю (нахил Сена + модифікований Манн–Кендалл): де тренд значущий (p < 0,05); порівняння першого й останнього десятиліття повзунком; річні аномалії температури 1980–2025 з анімацією |
| ⇆ **Було / стало** | Розділений екран з повзунком: Арал (Landsat 1985 → MODIS 2025), Каховка, Урмія, Поопо, Рондонія, Пакистан… |
| 🇺🇦 **Війна в Україні** | Лінія фронту й окуповані території щомісяця з лютого 2022 за **офіційним переліком ТОТ** (наказ Мінрозвитку № 376) на межах громад OCHA, з анімацією та порівнянням дат; графік окупованої площі; події: Каховська ГЕС, блекаути (нічні вогні), пожежі вздовж фронту, Чорнобильська зона, ліси біля Кремінної, Демидів — з поясненням «що ти бачиш»; графік пожеж FIRMS 2001–2025 за областями |
| 🔥 **Поширення пожеж** | Точки NASA FIRMS день за днем (колір = вік вогню), програвання, денна гістограма, рух центру пожежі й напрям (Чорнобильська зона 2020, Австралія 2019–20, Канада 2023, фронт 2022–23) |
| 🌀 **Події 2026** | Пожежі в США, спека в Європі, ураган, озеро Пауелл, повені в Таїланді, землетрус і цунамі — «було / стало» і графіки причин: чим погода перед подією відрізнялася від норми 1991–2020 (NASA POWER) |
| 🏠 **Стартова сторінка** | «Be An Earth Detective»: відео NASA з МКС (суспільне надбання), опис проєкту, джерела |
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

Крок 10 (лінія фронту) читає офіційний перелік ТОТ: завантаж додатки до наказу № 376 (.docx) з
[zakon.rada.gov.ua/laws/show/z0380-25](https://zakon.rada.gov.ua/laws/show/z0380-25) у `pipeline/data/tot/`
і запусти `python pipeline/run_all.py 10`.

## Стек / Stack

React 19 · Vite · Three.js (власний рушій тайлів, без готових глобус-бібліотек) · ECharts · KaTeX · Zustand ·
Python (requests, numpy, Pillow) для конвертації даних NASA.

```
src/engine/    3D engine: TileLayer (GIBS quadtree), LineLayer (borders), Labels, Controls, globe↔map morph
src/lib/       statistics (stats.js + tests), explanations, legends (colour → number), dates
src/ui/        panels: layers, compare, country report, planet, before/after, events, fires, causes, glossary, about
src/landing/   start page
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
| [DeepStateMap](https://deepstatemap.live) | *тимчасово*: попередня версія лінії фронту (крок 07); буде прибрано після переходу на офіційний перелік (крок 10) |
| [IAEA](https://www.iaea.org/newscenter/focus/ukraine), [EcoZagroza](https://ecozagroza.gov.ua/) | факти до подій війни (Чорнобиль, ліси) |
| [NOAA NESDIS](https://www.nesdis.noaa.gov/imagery/hurricanes/2026-hurricane-season-media-gallery), Wikipedia | дати й цифри подій 2026 року (тексти наші, лише посилання) |
| [NASA Image and Video Library](https://images.nasa.gov/details/NHQ_2020_1221_Earth%20Views) | відео «Earth Views from the ISS — No Music» на стартовій сторінці — суспільне надбання; логотипи NASA не використовуємо |
| [Fontsource](https://fontsource.org): Unbounded, Manrope | шрифти — SIL Open Font License 1.1 |

Обмеження чесно описані у вкладці «Про проєкт»: значення країни — середнє з кількох точок POWER;
карти трендів і NDVI країн отримані з кольорів GIBS (точність = крок палітри); прогноз — продовження лінійного тренду.

## Команда / Team

IT Detectives · NASA Space Apps Challenge 2026
