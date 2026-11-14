// Events that matter for the planet's ecology. Each one can fly the globe to the
// place, switch on the right NASA layer and date, or open a before/after swipe.
// Imagery dates were checked by hand so the NASA pictures really show the change
// (cloud-free days). Sources are NASA pages unless stated otherwise.

// icons for these categories are vector icons in src/ui/Icons.jsx (EVENT_ICONS)
export const EVENT_CATS = {
  war: { title: { uk: 'Війна в Україні', en: 'War in Ukraine' } },
  water: { title: { uk: 'Вода', en: 'Water' } },
  fire: { title: { uk: 'Пожежі й дим', en: 'Fire & smoke' } },
  ice: { title: { uk: 'Лід', en: 'Ice' } },
  air: { title: { uk: 'Атмосфера', en: 'Atmosphere' } },
  land: { title: { uk: 'Ліси й земля', en: 'Forests & land' } },
  heat: { title: { uk: 'Спека', en: 'Heat' } },
  storm: { title: { uk: 'Урагани', en: 'Hurricanes' } },
  quake: { title: { uk: 'Землетруси й цунамі', en: 'Earthquakes & tsunamis' } },
};

const S = (left, ld, right, rd) => ({ left: { layer: left, date: ld }, right: { layer: right, date: rd } });

export const EVENTS = [
  // ------------------------------------------------------------------ 2026
  {
    id: 'morrill_fire_2026', cat: 'fire', causes: true, lon: -102.3, lat: 41.4, alt: 0.06, date: '2026-03-12',
    title: { uk: 'Пожежа Морріл, Небраска (березень 2026)', en: 'Morrill Fire, Nebraska (March 2026)' },
    text: {
      uk: 'Пожежа почалася 12 березня 2026 року і за один день пройшла близько 110 км степом. До 25 березня вигоріло понад 2600 км² (643 тис. акрів) — найбільша пожежа в історії штату і одна з найбільших у США. Евакуювали села біля озера Мак-Коногі. Зима 2025–2026 була однією з найтепліших і найсухіших у Небрасці.',
      en: 'The fire started on 12 March 2026 and ran about 110 km across the prairie in a single day. By 25 March more than 2,600 km² (643,000 acres) had burned — the largest fire in the state’s history and one of the largest in the US. Villages near Lake McConaughy were evacuated. Winter 2025–2026 was one of Nebraska’s warmest and driest.',
    },
    see: { uk: 'Хибні кольори 7-2-1: ліворуч 26 лютого, праворуч 2 квітня 2026. Руда пляма — згарище. Нижче, у панелі події, графіки показують, чому степ спалахнув.', en: 'False colour 7-2-1: left 26 February, right 2 April 2026. The rusty patch is the burn scar. Charts in the event panel show why the prairie caught fire.' },
    source: { title: 'Wikipedia — 2026 Nebraska wildfires', url: 'https://en.wikipedia.org/wiki/2026_Nebraska_wildfires' },
    swipe: S('falsecolor_721', '2026-02-26', 'falsecolor_721', '2026-04-02'),
  },
  {
    id: 'cottonwood_fire_2026', cat: 'fire', causes: true, lon: -112.38, lat: 38.32, alt: 0.035, date: '2026-06-23',
    title: { uk: 'Пожежа Коттонвуд, Юта (червень 2026)', en: 'Cottonwood Fire, Utah (June 2026)' },
    text: {
      uk: 'Пожежа біля міст Бівер і Джанкшен 23 червня 2026 року за 12 годин збільшилася втричі. До 7 липня вигоріло близько 390 км², згоріли до 150 будівель, зокрема гірськолижний курорт Ігл-Пойнт. NASA пояснює: сніжний покрив узимку був нижчим за норму, а початок літа — незвично теплим і сухим.',
      en: 'The fire near Beaver and Junction tripled in size within 12 hours on 23 June 2026. By 7 July about 390 km² had burned and up to 150 buildings were lost, including the Eagle Point ski resort. NASA explains: winter snowpack was below normal and the start of summer unusually warm and dry.',
    },
    see: { uk: 'Хибні кольори 7-2-1: ліворуч 20 червня, праворуч 12 липня 2026. Темно-руда пляма серед зелених лісів — вигоріла територія.', en: 'False colour 7-2-1: left 20 June, right 12 July 2026. The dark rusty patch in the green forest is the burnt area.' },
    source: { title: 'NASA Earth Observatory — Cottonwood Fire Chars Utah', url: 'https://science.nasa.gov/earth/earth-observatory/cottonwood-fire-chars-utah/' },
    swipe: S('falsecolor_721', '2026-06-20', 'falsecolor_721', '2026-07-12'),
  },
  {
    id: 'europe_heat_2026', cat: 'heat', causes: true, lon: -0.58, lat: 44.84, alt: 0.6, date: '2026-06-24',
    title: { uk: 'Рекордна спека в Європі (літо 2026)', en: 'Record heat in Europe (summer 2026)' },
    text: {
      uk: 'Літо 2026 року в Західній Європі стало найспекотнішим за всю історію спостережень. У Лондоні 26 травня було +35,1 °C (рекорд травня на 2,3 °C), у Бордо 24 червня — +42,5 °C, третій рекорд поспіль. До серпня пройшло п’ять хвиль спеки; річки міліли через посуху.',
      en: 'Summer 2026 was the hottest on record in Western Europe. London hit 35.1 °C on 26 May (beating the May record by 2.3 °C), Bordeaux 42.5 °C on 24 June, its third record in a row. Five heat waves came by August; rivers ran low because of the drought.',
    },
    see: { uk: 'Шар — середня температура повітря за червень 2026 (MERRA-2). Графіки нижче — денні максимуми в Бордо порівняно з нормою.', en: 'The layer is the mean air temperature in June 2026 (MERRA-2). Charts below show daily maxima in Bordeaux versus normal.' },
    source: { title: 'NASA — Europe’s Scorching Summer', url: 'https://science.nasa.gov/earth/europes-scorching-summer/' },
    layer: { id: 't2m', date: '2026-06-01' },
  },
  {
    id: 'isaias_2026', cat: 'storm', causes: true, lon: -86.5, lat: 28.8, alt: 0.45, date: '2026-10-10',
    title: { uk: 'Ураган Ісаяс (жовтень 2026)', en: 'Hurricane Isaias (October 2026)' },
    text: {
      uk: 'Єдиний ураган атлантичного сезону 2026 року. 9 жовтня він посилився до 3-ї категорії (вітер до 195 км/год), а 10 жовтня вийшов на сушу біля міста Дестін (Флорида) з вітром 165 км/год. Загинули щонайменше 9 людей, збитки — понад 2 млрд доларів.',
      en: 'The only hurricane of the 2026 Atlantic season. On 9 October it reached Category 3 (winds up to 195 km/h) and on 10 October made landfall near Destin, Florida, with 165 km/h winds. At least 9 people died and damage exceeded $2 billion.',
    },
    see: { uk: 'Ліворуч — аномалія температури води 6 жовтня (червоне = тепліше за норму): «паливо» урагану. Праворуч — сам ураган 9 жовтня, видно око.', en: 'Left — sea temperature anomaly on 6 October (red = warmer than normal): the hurricane’s fuel. Right — the hurricane itself on 9 October, with its eye.' },
    source: { title: 'NOAA NESDIS — 2026 Hurricane Season Media Gallery', url: 'https://www.nesdis.noaa.gov/imagery/hurricanes/2026-hurricane-season-media-gallery' },
    swipe: S('sst_anom', '2026-10-06', 'truecolor_modis', '2026-10-09'),
  },
  {
    id: 'lake_powell_2026', cat: 'water', causes: true, lon: -111.1, lat: 37.2, alt: 0.05, date: '2026-09-10',
    title: { uk: 'Озеро Пауелл — рекордно низько (2026)', en: 'Lake Powell at a record low (2026)' },
    text: {
      uk: 'Водосховище на річці Колорадо 10 вересня 2026 року опустилося до 3517 футів над рівнем моря — нижче попереднього рекорду 2023 року. Від нього залежать вода й електрика для мільйонів людей на південному заході США. Причина — «сніжна посуха» в горах і тепла весна на тлі мегапосухи, що триває з 2000 року.',
      en: 'On 10 September 2026 the reservoir on the Colorado River fell to 3,517 feet above sea level — below the 2023 record. Water and electricity for millions in the US Southwest depend on it. The cause: a “snow drought” in the mountains and a warm spring during a megadrought lasting since 2000.',
    },
    see: { uk: 'Хибні кольори 7-2-1: ліворуч 1 вересня 2017, праворуч 10 вересня 2026 — темні затоки озера стали вужчими. Графіки — погода у Скелястих горах, звідки береться вода.', en: 'False colour 7-2-1: left 1 September 2017, right 10 September 2026 — the dark arms of the lake have narrowed. Charts show the weather in the Rocky Mountains where the water comes from.' },
    source: { title: 'NASA Earth Observatory — Lake Powell Drops to Record-Low Levels', url: 'https://science.nasa.gov/earth/earth-observatory/lake-powell-drops-to-record-low-levels/' },
    swipe: S('falsecolor_721', '2017-09-01', 'falsecolor_721', '2026-09-10'),
  },
  {
    id: 'thailand_floods_2026', cat: 'water', causes: true, lon: 101.52, lat: 13.99, alt: 0.05, date: '2026-10-02',
    title: { uk: 'Повені в Таїланді (вересень–жовтень 2026)', en: 'Floods in Thailand (Sep–Oct 2026)' },
    text: {
      uk: 'З середини вересня 2026 року повені охопили 50 провінцій Таїланду: постраждали понад 4 млн людей, затоплено 270 тис. га полів і садів. У Бангкоку за 48 годин випало майже 300 мм — майже місячна норма. Над країною кілька днів стояла зона низького тиску, яка тягнула вологу з теплої Сіамської затоки.',
      en: 'From mid-September 2026 floods hit 50 provinces of Thailand: more than 4 million people affected, 270,000 ha of fields and orchards flooded. Bangkok got almost 300 mm in 48 hours — nearly a month’s worth. A low-pressure system stalled for days, pulling moisture from the warm Gulf of Thailand.',
    },
    see: { uk: 'Хибні кольори: ліворуч 1 грудня 2025 (звичайно), праворуч 2 жовтня 2026 — темно-синя вода розлилася долиною річки Банг-Паконг (провінція Прачінбурі).', en: 'False colour: left 1 December 2025 (normal), right 2 October 2026 — dark blue water across the Bang Pakong river valley (Prachin Buri province).' },
    source: { title: 'NASA Earth Observatory — Floodwaters Overwhelm Thailand', url: 'https://science.nasa.gov/earth/earth-observatory/floodwaters-overwhelm-thailand/' },
    swipe: S('falsecolor_721', '2025-12-01', 'falsecolor_721', '2026-10-02'),
  },
  {
    id: 'flores_quake_2026', cat: 'quake', lon: 121.35, lat: -8.31, alt: 0.2, date: '2026-08-15',
    title: { uk: 'Землетрус і цунамі біля острова Флорес (2026)', en: 'Earthquake and tsunami off Flores (2026)' },
    text: {
      uk: '15 серпня 2026 року о 05:58 за місцевим часом біля північного узбережжя острова Флорес (Індонезія) стався землетрус магнітудою 7,8 на глибині близько 10 км. Хвиля цунамі заввишки до 2,7 м накрила прибережні села; загинули щонайменше 142 людини.',
      en: 'On 15 August 2026 at 05:58 local time a magnitude 7.8 earthquake struck off the north coast of Flores (Indonesia) at about 10 km depth. A tsunami up to 2.7 m high hit coastal villages; at least 142 people died.',
    },
    why: {
      uk: 'Чому це сталося: тут не клімат, а рух тектонічних плит. Австралійська плита насувається на Зондську приблизно на 7 см на рік. Частину цього тиску «бере» Флореський задуговий насув на північ від острова. Коли напруга в розломі перевищила міцність порід, вони різко зсунулися — дно моря підскочило й підняло воду, утворивши цунамі. Тому для цунамі важливі не погода, а сейсмографи й датчики рівня моря (NASA тестує систему GUARDIAN, яка помічає цунамі за сигналами супутників GPS).',
      en: 'Why it happened: not climate but moving tectonic plates. The Australian plate pushes under the Sunda plate by about 7 cm a year. Part of that squeeze is taken by the Flores back-arc thrust north of the island. When the stress exceeded the rock strength, the fault slipped suddenly — the sea floor jumped and lifted the water into a tsunami. So for tsunamis what matters is seismometers and sea-level sensors, not weather (NASA is testing GUARDIAN, which spots tsunamis from GPS satellite signals).',
    },
    source: { title: 'Wikipedia — 2026 Flores earthquake (USGS data)', url: 'https://en.wikipedia.org/wiki/2026_Flores_earthquake' },
  },
  // ------------------------------------------------------------------ war in Ukraine
  {
    id: 'kakhovka', cat: 'war', lon: 34.0, lat: 47.25, alt: 0.045, date: '2023-06-06',
    title: { uk: 'Знищення Каховської ГЕС', en: 'Destruction of the Kakhovka dam' },
    text: {
      uk: '6 червня 2023 року була зруйнована гребля Каховської ГЕС, яку контролювали російські війська. Вода з водосховища ринула вниз Дніпром — затопила Херсон і села, а за ~12 днів, за оцінкою NASA, витекло близько 75 % води водосховища (приблизно стільки, скільки у Великому Солоному озері в США). Без води лишилися канали, що зрошували поля півдня України, і міста, які пили цю воду. На дні колишнього водосховища за рік виріс молодий вербовий ліс. Потягни повзунок: ліворуч 5 червня, праворуч 2 липня 2023 року.',
      en: 'On 6 June 2023 the Kakhovka dam, controlled by Russian forces, was destroyed. Water from the reservoir rushed down the Dnipro, flooding Kherson and villages; within ~12 days, NASA estimates, about 75% of the reservoir had drained (roughly the volume of Utah’s Great Salt Lake). Canals irrigating southern Ukraine’s fields and towns relying on the water were left dry. Within a year a young willow forest grew on the old reservoir bed. Drag the slider: left 5 June, right 2 July 2023.',
    },
    front: '2023-06-01',
    see: {
      uk: 'Ліворуч — 5 червня 2023 (водосховище повне, темна смуга), праворуч — 2 липня 2023 (води майже немає, видно старе русло Дніпра). Червона штриховка — окупована територія: лівий берег водосховища й ГЕС контролювала Росія.',
      en: 'Left — 5 June 2023 (the reservoir is full, a dark band); right — 2 July 2023 (almost no water, the old Dnipro channel shows). Red hatching is occupied territory: Russia controlled the left bank and the dam.',
    },
    source: { title: 'NASA Earth Observatory — Canals in Ukraine are Drying Up', url: 'https://earthobservatory.nasa.gov/images/151622/canals-in-ukraine-are-drying-up' },
    swipe: S('truecolor_modis', '2023-06-05', 'truecolor_modis', '2023-07-02'),
  },
  {
    id: 'blackout', cat: 'war', lon: 31.5, lat: 48.8, alt: 0.25, date: '2022-11-23',
    title: { uk: 'Україна в темряві: удари по енергосистемі', en: 'Ukraine goes dark: strikes on the power grid' },
    text: {
      uk: 'Восени 2022 року Росія масовано била ракетами по електростанціях і підстанціях. Після удару 23 листопада 2022 року більша частина країни залишилася без світла. Супутник Suomi NPP (продукт Black Marble) щоночі вимірює світло міст — порівняй ніч у листопаді 2021 і 2022 років. Відключення світла — це не лише незручність: зупиняються насоси водоканалів і очисні споруди, тож забруднена вода може потрапляти в річки.',
      en: 'In autumn 2022 Russia launched massive missile strikes on power plants and substations. After the strike of 23 November 2022 most of the country lost power. The Suomi NPP satellite (Black Marble product) measures city lights every night — compare a night in November 2021 with one in November 2022. Blackouts also stop water pumps and sewage treatment, so polluted water can reach rivers.',
    },
    front: '2022-11-01',
    see: {
      uk: 'Яскраві плями — освітлені міста вночі. Ліворуч 23 листопада 2021 (звичайна ніч), праворуч 25 листопада 2022 (після масованого удару): більшість міст України темні, а сусідні країни світяться як завжди. Червона штриховка — окупована територія.',
      en: 'Bright spots are lit cities at night. Left: 23 November 2021 (a normal night); right: 25 November 2022 (after a massive strike): most Ukrainian cities are dark while neighbouring countries shine as usual. Red hatching is occupied territory.',
    },
    source: { title: 'NASA Earth Observatory — Tracking Night Lights in Ukraine', url: 'https://earthobservatory.nasa.gov/images/150002/tracking-night-lights-in-ukraine' },
    swipe: S('nightlights_daily', '2021-11-23', 'nightlights_daily', '2022-11-25'),
  },
  {
    id: 'front_fires_2022', fires: true, cat: 'war', lon: 37.4, lat: 49.2, alt: 0.12, date: '2022-09-10',
    title: { uk: 'Пожежі вздовж лінії фронту (Харківщина, 2022)', en: 'Fires along the front line (Kharkiv region, 2022)' },
    text: {
      uk: 'Під час звільнення Харківщини у вересні 2022 року супутники NASA зафіксували десятки «теплових точок» уздовж лінії бойових дій — горіли поля, ліси, техніка й будинки після обстрілів. Порівняй з тим самим місцем у 2021 році: тоді вогнища були розкидані по полях (це спалювання стерні), а не зібрані в лінію. Графік пожеж в Україні за роками — у вкладці «Уся планета».',
      en: 'During the liberation of the Kharkiv region in September 2022 NASA satellites detected dozens of heat spots along the line of fighting — fields, forests, vehicles and houses burning after shelling. Compare with the same place in 2021: then fires were scattered over farmland (stubble burning) rather than lined up. The chart of fires in Ukraine by year is in the “Whole planet” tab.',
    },
    front: '2022-10-01', frontCompare: '2022-09-01',
    see: {
      uk: 'Біла пунктирна лінія — фронт на 1 вересня 2022, червона штриховка — окупована територія на 1 жовтня 2022. Простір між ними (зелений) — Харківщина, звільнена у вересні 2022. Точки — пожежі день за днем (програвач праворуч угорі): жовті — горить сьогодні, темно-червоні — вже вигоріло.',
      en: 'The white dashed line is the front on 1 September 2022, red hatching is occupied territory on 1 October 2022. The area between them (green) is the Kharkiv region liberated in September 2022. Dots are fires day by day (player top right): yellow burns today, dark red has already burned.',
    },
    source: { title: 'NASA FIRMS — Fire Information for Resource Management System', url: 'https://firms.modaps.eosdis.nasa.gov/map/' },
    base: { id: 'bluemarble' },
  },
  {
    id: 'south_front_2023', fires: true, cat: 'war', lon: 35.8, lat: 47.3, alt: 0.1, date: '2023-08-20',
    title: { uk: 'Південний фронт, літо 2023', en: 'Southern front, summer 2023' },
    text: {
      uk: 'Влітку 2023 року вогнища вишикувалися вздовж фронту на Запоріжжі. Степ, поля й лісосмуги горять від вибухів, а родючий чорнозем роками лишається забрудненим уламками, металами й мінами. За даними уряду України, сотні тисяч гектарів земель потребують розмінування.',
      en: 'In summer 2023 fires lined up along the front in the Zaporizhzhia region. Steppe, fields and shelterbelts burn from explosions, and fertile black soil stays polluted with fragments, metals and mines for years. According to Ukraine’s government, hundreds of thousands of hectares need demining.',
    },
    front: '2023-08-01',
    see: {
      uk: 'Пожежі червня–вересня 2023 (програвач праворуч угорі) вишиковуються вздовж краю червоної штриховки — це і є лінія фронту на Запоріжжі. Сіра смуга — «сіра зона», де йдуть бої.',
      en: 'Fires of June–September 2023 (player top right) line up along the edge of the red hatching — that is the front line in the Zaporizhzhia region. The grey strip is the “grey zone” where fighting goes on.',
    },
    source: { title: 'NASA FIRMS', url: 'https://firms.modaps.eosdis.nasa.gov/map/' },
    base: { id: 'bluemarble' },
  },
  {
    id: 'chornobyl_2022', cat: 'war', lon: 30.1, lat: 51.39, alt: 0.03, date: '2022-02-24',
    title: { uk: 'Окупація Чорнобильської зони', en: 'Occupation of the Chornobyl zone' },
    text: {
      uk: 'З 24 лютого до 31 березня 2022 року Чорнобильську зону відчуження окупували російські війська. За даними МАГАТЕ, вони рили окопи в «Рудому лісі» — одному з найзабрудненіших радіацією місць, піднімаючи радіоактивний пил. Цієї ж весни в зоні реєстрували пожежі, а гасити їх було неможливо.',
      en: 'From 24 February to 31 March 2022 the Chornobyl exclusion zone was occupied by Russian troops. According to the IAEA they dug trenches in the “Red Forest”, one of the most radioactive places, stirring up contaminated dust. Fires were also recorded in the zone that spring and could not be fought.',
    },
    front: '2022-04-03',
    see: {
      uk: 'Зелені ділянки — північ Київщини, Чернігівщина й Сумщина, звільнені наприкінці березня — на початку квітня 2022 року, разом із Чорнобильською зоною (31 березня). Червона штриховка — території, що лишалися окупованими 3 квітня 2022.',
      en: 'Green areas are northern Kyiv, Chernihiv and Sumy regions, liberated at the end of March – early April 2022, together with the Chornobyl zone (31 March). Red hatching shows land still occupied on 3 April 2022.',
    },
    source: { title: 'IAEA — Update on Ukraine (2022)', url: 'https://www.iaea.org/newscenter/focus/ukraine' },
  },
  {
    id: 'kreminna', cat: 'war', lon: 38.15, lat: 49.0, alt: 0.05, date: '2022-08-01',
    title: { uk: 'Ліси біля Кремінної та Лиману', en: 'Forests near Kreminna and Lyman' },
    text: {
      uk: 'Соснові ліси вздовж Сіверського Дінця (Серебрянське лісництво, околиці Лиману) опинилися на лінії фронту з 2022 року. Обстріли спричиняли пожежі, які неможливо гасити, а ліс замінований. Увімкни шар «Рослинність — NDVI» і порівняй липень 2021 та липень 2023 років.',
      en: 'Pine forests along the Siverskyi Donets (Serebrianka forestry, around Lyman) have been on the front line since 2022. Shelling causes fires that cannot be put out, and the forest is mined. Turn on “Vegetation — NDVI” and compare July 2021 with July 2023.',
    },
    front: '2023-07-01',
    see: {
      uk: 'Ліси вздовж Сіверського Дінця лежать просто на лінії фронту (край червоної штриховки). Шар NDVI показує, наскільки зелена рослинність: порівняй липень 2021 і липень 2023 у панелі «Шари».',
      en: 'The forests along the Siverskyi Donets lie right on the front line (edge of the red hatching). The NDVI layer shows how green the vegetation is: compare July 2021 and July 2023 in the Layers panel.',
    },
    source: { title: 'Ministry of Environmental Protection of Ukraine — EcoZagroza', url: 'https://ecozagroza.gov.ua/' },
    layer: { id: 'ndvi', date: '2023-07-01' },
  },
  {
    id: 'demydiv', cat: 'war', lon: 30.33, lat: 50.73, alt: 0.02, date: '2022-02-26',
    title: { uk: 'Затоплення заплави Ірпеня (Демидів)', en: 'Flooding of the Irpin floodplain (Demydiv)' },
    text: {
      uk: 'Наприкінці лютого 2022 року українські військові відкрили дамбу на річці Ірпінь, щоб вода затопила заплаву й зупинила наступ на Київ. Село Демидів опинилося у воді, але російська техніка не змогла пройти. На місці осушених колись боліт знову з’явилися водно-болотні угіддя — дім для птахів і риб.',
      en: 'At the end of February 2022 Ukrainian forces opened a dam on the Irpin river so that water would flood the floodplain and stop the advance on Kyiv. The village of Demydiv was flooded, but Russian vehicles could not pass. Wetlands that had been drained decades ago came back — a home for birds and fish.',
    },
    front: '2022-04-03',
    see: {
      uk: 'Демидів — на північ від Києва, біля зеленої ділянки «звільнено». Затоплена заплава Ірпеня допомогла зупинити колони, що йшли на Київ у лютому–березні 2022.',
      en: 'Demydiv is north of Kyiv, next to the green “liberated” area. The flooded Irpin floodplain helped stop columns heading for Kyiv in February–March 2022.',
    },
    source: { title: 'Worldview (NASA) — compare imagery yourself', url: 'https://worldview.earthdata.nasa.gov/?v=29.8,50.4,31.0,51.1&t=2022-04-20' },
  },
  // ------------------------------------------------------------------ water
  {
    id: 'aral', cat: 'water', lon: 60.0, lat: 45.1, alt: 0.12, date: '1960',
    title: { uk: 'Аральське море зникає', en: 'The vanishing Aral Sea' },
    text: {
      uk: 'У 1960-х роках річки Амудар’я та Сирдар’я почали розбирати на зрошення бавовни. Колись четверте за площею озеро світу за кілька десятиліть розпалося на частини; східна частина Південного Аралу повністю висохла. На дні лишилися сіль і пестициди — вітер розносить їх як отруйний пил. Потягни повзунок: ліворуч Landsat 1985 року, праворуч MODIS 2025 року.',
      en: 'In the 1960s the Amu Darya and Syr Darya rivers were diverted to irrigate cotton. Once the fourth-largest lake in the world, it broke apart within decades; the eastern basin of the South Aral dried completely. Salt and pesticides were left on the bed and the wind spreads them as toxic dust. Drag the slider: left Landsat 1985, right MODIS 2025.',
    },
    see: { uk: 'Ліворуч — Landsat, 1985 рік: море ще велике. Праворуч — MODIS, серпень 2025: лишилися лише маленькі озера, решта — пустеля Аралкум.', en: 'Left — Landsat, 1985: the sea is still large. Right — MODIS, August 2025: only small lakes remain, the rest is the Aralkum desert.' },
    source: { title: 'NASA — World of Change: Shrinking Aral Sea', url: 'https://science.nasa.gov/earth/earth-observatory/world-of-change/aral-sea/' },
    swipe: S('landsat_weld', '1985-12-01', 'truecolor_modis', '2025-08-15'),
  },
  {
    id: 'urmia', cat: 'water', lon: 45.6, lat: 37.65, alt: 0.05, date: '2023-09-07',
    title: { uk: 'Озеро Урмія (Іран) висихає', en: 'Lake Urmia (Iran) is drying' },
    text: {
      uk: 'Від 1995 року рівень озера впав більш ніж на 7 метрів, а площа скоротилася приблизно на 90 % (за NASA). Причини — посухи, забір води на поля і греблі на річках. Червоний колір — це мікроводорості, що виживають у дуже солоній воді.',
      en: 'Since 1995 the lake level fell by more than 7 metres and its area shrank by about 90% (NASA). Causes: droughts, water taken for farming and dams on rivers. The red colour comes from micro-algae surviving in very salty water.',
    },
    see: { uk: 'Ліворуч — серпень 2000, праворуч — серпень 2023: на місці синьої води біла сіль і червонуваті калюжі.', en: 'Left — August 2000, right — August 2023: white salt and reddish puddles where blue water used to be.' },
    source: { title: 'NASA Earth Observatory — Lake Urmia Shrivels Again', url: 'https://earthobservatory.nasa.gov/images/151913/lake-urmia-shrivels-again' },
    swipe: S('truecolor_modis', '2000-08-25', 'truecolor_modis', '2023-08-20'),
  },
  {
    id: 'poopo', cat: 'water', lon: -67.0, lat: -18.8, alt: 0.04, date: '2015-12-01',
    title: { uk: 'Озеро Поопо (Болівія) зникло', en: 'Lake Poopó (Bolivia) disappeared' },
    text: {
      uk: 'Друге за величиною озеро Болівії у грудні 2015 року майже повністю висохло. Винні посухи (Ель-Ніньйо), потепління і забір води для шахт і полів. Рибалки з навколишніх сіл втратили роботу.',
      en: 'Bolivia’s second-largest lake almost completely dried up in December 2015. Droughts (El Niño), warming and water taken for mines and farms are to blame. Fishermen from nearby villages lost their jobs.',
    },
    see: { uk: 'Ліворуч — Landsat, 1989, праворуч — MODIS, 20 січня 2016: озеро перетворилося на білу сольову пустку.', en: 'Left — Landsat 1989, right — MODIS 20 January 2016: the lake has become a white salt flat.' },
    source: { title: 'NASA Earth Observatory — Bolivia’s Lake Poopó Disappears', url: 'https://earthobservatory.nasa.gov/images/87363/bolivias-lake-poopo-disappears' },
    swipe: S('landsat_weld', '1989-12-01', 'truecolor_modis', '2016-01-20'),
  },
  {
    id: 'pakistan', cat: 'water', lon: 68.3, lat: 26.9, alt: 0.08, date: '2022-08-28',
    title: { uk: 'Повінь у Пакистані 2022', en: 'Pakistan floods 2022' },
    text: {
      uk: 'Влітку 2022 року мусонні дощі в провінції Сінд були в кілька разів сильнішими за норму. Ріка Інд вийшла з берегів, озеро Манчар переповнилося, загинуло понад 1300 людей. На знімку «хибні кольори 7-2-1» вода темно-синя, а рослини яскраво-зелені — порівняй серпень 2021 і серпень 2022 року.',
      en: 'In summer 2022 monsoon rains in Sindh province were several times heavier than normal. The Indus overflowed, Lake Manchar spilled over and more than 1,300 people died. In “false colour 7-2-1” water is dark blue and plants are bright green — compare August 2021 with August 2022.',
    },
    see: { uk: 'Хибні кольори: вода темно-синя. Ліворуч 28 серпня 2021, праворуч 28 серпня 2022 — величезні площі вздовж Інду під водою.', en: 'False colour: water is dark blue. Left 28 August 2021, right 28 August 2022 — huge areas along the Indus under water.' },
    source: { title: 'NASA Earth Observatory — Lake Manchar is Overflowing', url: 'https://earthobservatory.nasa.gov/images/150306/lake-manchar-is-overflowing' },
    swipe: S('falsecolor_721', '2021-08-28', 'falsecolor_721', '2022-08-28'),
  },
  // ------------------------------------------------------------------ fire & smoke
  {
    id: 'australia', fires: true, cat: 'fire', lon: 148.5, lat: -35.5, alt: 0.3, date: '2020-01-04',
    title: { uk: '«Чорне літо» в Австралії', en: 'Australia’s Black Summer' },
    text: {
      uk: 'Після найспекотнішого й найсухішого року в історії спостережень Австралії ліси на південному сході палали місяцями (2019–2020). Дим піднявся до стратосфери (15–19 км) і облетів усю Землю. Порівняй 4 січня 2019 і 4 січня 2020 року.',
      en: 'After Australia’s hottest and driest year on record, south-eastern forests burned for months (2019–2020). The smoke rose into the stratosphere (15–19 km) and circled the whole Earth. Compare 4 January 2019 with 4 January 2020.',
    },
    see: { uk: 'Ліворуч 4 січня 2019, праворуч 4 січня 2020: коричнево-сірий дим тягнеться над океаном на сотні кілометрів.', en: 'Left 4 January 2019, right 4 January 2020: brownish-grey smoke stretches hundreds of kilometres over the ocean.' },
    source: { title: 'NASA Earth Observatory — Fires and Smoke Engulf Southeastern Australia', url: 'https://earthobservatory.nasa.gov/images/146110/fires-and-smoke-engulf-southeastern-australia' },
    swipe: S('truecolor_modis', '2019-01-04', 'truecolor_modis', '2020-01-04'),
  },
  {
    id: 'canada2023', fires: true, cat: 'fire', lon: -74, lat: 46, alt: 0.3, date: '2023-06-06',
    title: { uk: 'Дим канадських пожеж над Нью-Йорком', en: 'Canadian wildfire smoke over New York' },
    text: {
      uk: '2023 рік став рекордним за площею лісових пожеж у Канаді. 6–7 червня дим з Квебеку накрив північний схід США — у Нью-Йорку повітря стало найбруднішим щонайменше з 2002 року, скасовували рейси.',
      en: '2023 was a record year for the area burned by wildfires in Canada. On 6–7 June smoke from Quebec covered the north-eastern US — New York had its worst air since at least 2002 and flights were delayed.',
    },
    see: { uk: 'Ліворуч 7 червня 2022, праворуч 6 червня 2023: жовто-сірий серпанок диму над Великими озерами та Нью-Йорком.', en: 'Left 7 June 2022, right 6 June 2023: a yellow-grey haze of smoke over the Great Lakes and New York.' },
    source: { title: 'NASA Earth Observatory — Smoke Smothers the Northeast', url: 'https://earthobservatory.nasa.gov/images/151433/smoke-smothers-the-northeast' },
    swipe: S('truecolor_modis', '2022-06-07', 'truecolor_modis', '2023-06-06'),
  },
  {
    id: 'chornobyl_2020', fires: true, cat: 'fire', lon: 29.9, lat: 51.3, alt: 0.04, date: '2020-04-05',
    title: { uk: 'Пожежі в Чорнобильській зоні (2020)', en: 'Fires in the Chornobyl zone (2020)' },
    text: {
      uk: 'У квітні 2020 року в зоні відчуження понад тиждень горіли ліси й трава. Ґрунт і дерева там досі забруднені радіацією після аварії 1986 року, тому дим може переносити радіоактивні частинки. На знімку 5 квітня видно довгий шлейф диму.',
      en: 'In April 2020 forests and grass burned in the exclusion zone for more than a week. Soil and trees there are still contaminated after the 1986 accident, so smoke can carry radioactive particles. The 5 April image shows a long smoke plume.',
    },
    source: { title: 'NASA Earth Observatory — Fires Burn in Northern Ukraine', url: 'https://science.nasa.gov/earth/earth-observatory/fires-burn-in-northern-ukraine-146561/' },
    base: { id: 'truecolor_modis', date: '2020-04-05' },
  },
  // ------------------------------------------------------------------ forests
  {
    id: 'rondonia', cat: 'land', lon: -62.5, lat: -10.2, alt: 0.07, date: '1985',
    title: { uk: 'Вирубка Амазонії (Рондонія)', en: 'Amazon deforestation (Rondônia)' },
    text: {
      uk: 'Уздовж нових доріг ліс вирубували «ялинкою» (fishbone): від дороги в обидва боки — ділянки під пасовища. За 1980–1992 роки тільки в Рондонії щороку зникало понад 2500 км² лісу. Ліворуч Landsat 1985, праворуч MODIS 2024: темно-зелене — ліс, світле — вирубки.',
      en: 'Along new roads the forest was cut in a “fishbone” pattern: plots for pasture on both sides of the road. In 1980–1992 more than 2,500 km² of forest disappeared every year in Rondônia alone. Left Landsat 1985, right MODIS 2024: dark green is forest, light is cleared land.',
    },
    see: { uk: 'Ліворуч Landsat 1985: суцільний ліс із кількома «ялинками» доріг. Праворуч MODIS 2024: світлі вирубки займають більшу частину території.', en: 'Left Landsat 1985: continuous forest with a few road “fishbones”. Right MODIS 2024: light-coloured clearings cover most of the area.' },
    source: { title: 'NASA — World of Change: Amazon Deforestation', url: 'https://science.nasa.gov/earth/earth-observatory/world-of-change/amazon-deforestation' },
    swipe: S('landsat_weld', '1985-12-01', 'truecolor_modis', '2024-07-15'),
  },
  // ------------------------------------------------------------------ ice & atmosphere
  {
    id: 'seaice2012', cat: 'ice', lon: 0, lat: 85, alt: 1.6, date: '2012-09-16',
    title: { uk: 'Рекордно мало арктичного льоду (2012)', en: 'Record-low Arctic sea ice (2012)' },
    text: {
      uk: '16 вересня 2012 року площа льоду в Арктиці впала до 3,41 млн км² — найменше за всю історію супутникових спостережень (з 1979 року). Це майже вдвічі менше, ніж у середньому за 1979–2000 роки. Темний океан поглинає більше сонячного тепла, ніж білий лід, тому Арктика гріється найшвидше на планеті.',
      en: 'On 16 September 2012 Arctic sea ice fell to 3.41 million km² — the smallest since satellite records began in 1979, about half the 1979–2000 average. Dark ocean absorbs more sunlight than white ice, so the Arctic warms fastest on the planet.',
    },
    source: { title: 'NASA — Arctic Sea Ice Hits Smallest Extent in Satellite Era', url: 'https://climate.nasa.gov/news/782/arctic-sea-ice-hits-smallest-extent-in-satellite-era/' },
    layer: { id: 'seaice', date: '2012-09-16' }, chart: 'arctic_ice',
  },
  {
    id: 'ozone2006', cat: 'air', lon: 0, lat: -80, alt: 1.6, date: '2006-09-25',
    title: { uk: 'Озонова діра над Антарктидою', en: 'The Antarctic ozone hole' },
    text: {
      uk: 'Фреони з холодильників і аерозолів руйнували озон, який захищає нас від ультрафіолету. 2006 рік — одна з найбільших озонових дір. Монреальський протокол 1987 року заборонив ці речовини, і діра повільно «заростає» — це приклад того, як люди разом виправили екологічну проблему.',
      en: 'CFCs from fridges and spray cans destroyed ozone, which shields us from ultraviolet light. 2006 had one of the largest ozone holes. The 1987 Montreal Protocol banned these chemicals and the hole is slowly healing — an example of humanity fixing an environmental problem together.',
    },
    source: { title: 'NASA Ozone Watch', url: 'https://ozonewatch.gsfc.nasa.gov/' },
    layer: { id: 'ozone_omi', date: '2006-09-25' }, chart: 'ozone_area',
  },
  {
    id: 'pinatubo', cat: 'air', lon: 120.35, lat: 15.14, alt: 0.6, date: '1991-06-15',
    title: { uk: 'Виверження Пінатубо охолодило Землю', en: 'Pinatubo’s eruption cooled the Earth' },
    text: {
      uk: '15 червня 1991 року на Філіппінах вивергся вулкан Пінатубо. Мільйони тонн сірчаного газу утворили в стратосфері «вуаль» з крапельок, яка відбивала сонячне світло, — середня температура планети впала приблизно на 0,5 °C на 1992–1993 роки. На графіку GISTEMP (вкладка «Уся планета») видно цю «ямку».',
      en: 'On 15 June 1991 Mount Pinatubo erupted in the Philippines. Millions of tonnes of sulphur gas formed a veil of droplets in the stratosphere that reflected sunlight, and global temperature dropped by about 0.5 °C in 1992–1993. You can see the dip on the GISTEMP chart (“Whole planet” tab).',
    },
    source: { title: 'NASA Earth Observatory — Global Effects of Mount Pinatubo', url: 'https://science.nasa.gov/earth/earth-observatory/global-effects-of-mount-pinatubo-1510/' },
    chart: 'gistemp',
  },
];
