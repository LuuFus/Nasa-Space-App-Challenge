// "Hot spots": places where a layer shows something unusual. When one of the
// `layers` is switched on, a sign appears right on that place of the map;
// hovering it opens a card: what you see, why (people or nature), why it
// matters, a real example and what helps — with a satellite picture and a
// chart from pipeline/11_hotspots.py (public/data/hotspots.json).
//
// kind:  'human' | 'nature' | 'both'      level: 'danger' | 'warn' | 'info' | 'good'
// show:  { layer, date } — the layer and day that show it best ("Show on the map")

const T = (uk, en) => ({ uk, en });
const S = (h, t) => ({ h, t });
const SEE = T('Що ти бачиш', 'What you see');
const WHY = T('Чому так', 'Why');
const RISK = T('Чим це загрожує', 'Why it matters');
const EX = T('Приклад із життя', 'A real example');
const HELP = T('Що з цим роблять', 'What helps');

export const KINDS = {
  human: T('Через людей', 'Caused by people'),
  nature: T('Природа', 'Nature'),
  both: T('Люди й природа', 'People and nature'),
};
export const LEVELS = {
  danger: T('Небезпечно', 'Dangerous'),
  warn: T('Тривожно', 'Worrying'),
  info: T('Цікаво знати', 'Good to know'),
  good: T('Добра новина', 'Good news'),
};

const CHL = ['chlorophyll'];
const FIRE = ['fires', 'fires_noaa20', 'fires_modis'];
const NIGHT = ['nightlights', 'nightlights_daily'];

export const HOTSPOTS = [
  // ------------------------------------------------------------------ ocean colour
  {
    id: 'baltic_bloom', layers: CHL, lon: 19.5, lat: 57.4, alt: 0.25, kind: 'both', level: 'danger',
    show: { layer: 'chlorophyll', date: '2018-07-20' },
    title: T('Балтійське море «цвіте»', 'The Baltic Sea is “blooming”'),
    lead: T('Улітку Балтика зеленіє від ціанобактерій (синьо-зелених водоростей). Це не норма: море «перегодоване» добривами.', 'In summer the Baltic turns green with cyanobacteria (blue-green algae). This is not normal: the sea is “overfed” with fertiliser.'),
    sections: [
      S(SEE, T('Жовті й червоні кольори хлорофілу посеред моря — це мільярди мікроскопічних водоростей. На фото зі супутника вони виглядають як зелені завитки на воді.', 'Yellow and red chlorophyll colours in the middle of the sea are billions of microscopic algae. On the satellite photo they look like green swirls on the water.')),
      S(WHY, T('У море стікають азот і фосфор з полів, ферм і каналізації 85 млн людей дев’яти країн. Це їжа для водоростей. Тепле безвітряне літо (як у 2018 році) запускає вибухове «цвітіння». Балтика майже закрита — вода в ній оновлюється за 25–30 років.', 'Nitrogen and phosphorus from fields, farms and the sewage of 85 million people in nine countries flow into the sea — food for algae. A warm, calm summer (like 2018) sets off an explosive bloom. The Baltic is almost closed: its water is renewed only every 25–30 years.')),
      S(RISK, T('Коли водорості відмирають і гниють, вони забирають кисень. На дні Балтики — одні з найбільших «мертвих зон» світу (десятки тисяч км²), де не виживає риба. Деякі ціанобактерії отруйні: пляжі закривають, а собаки, що пили таку воду, гинуть.', 'When algae die and rot they use up oxygen. The Baltic floor has some of the largest “dead zones” in the world (tens of thousands of km²) where fish cannot live. Some cyanobacteria are toxic: beaches are closed and dogs that drink the water can die.')),
      S(EX, T('Липень 2018: спека в Північній Європі — і «цвітіння» вкрило майже всю центральну Балтику; у Фінляндії та Швеції закривали пляжі.', 'July 2018: a heat wave in northern Europe — and the bloom covered almost the whole central Baltic; beaches closed in Finland and Sweden.')),
      S(HELP, T('Країни Балтики за планом HELCOM будують очисні споруди (Санкт-Петербург перестав скидати неочищені стоки) і менше вносять добрив. Фосфору в морі вже менше, але старий, накопичений на дні, ще десятиліттями «годуватиме» водорості.', 'Under the HELCOM plan Baltic countries build sewage plants and use less fertiliser. There is less phosphorus already, but old phosphorus stored in the sea floor will keep feeding algae for decades.')),
    ],
    links: [['NASA Earth Observatory — Baltic blooms', 'https://science.nasa.gov/earth/earth-observatory/'], ['HELCOM', 'https://helcom.fi']],
  },
  {
    id: 'erie_bloom', layers: CHL, lon: -82.6, lat: 41.75, alt: 0.08, kind: 'human', level: 'danger',
    show: { layer: 'chlorophyll', date: '2019-08-15' },
    title: T('Отруйні водорості озера Ері', 'Toxic algae of Lake Erie'),
    lead: T('Західна частина озера Ері (США/Канада) щоліта зеленіє від ціанобактерії Microcystis, яка виділяє отруту мікроцистин.', 'The western part of Lake Erie (USA/Canada) turns green every summer with the cyanobacterium Microcystis, which makes the poison microcystin.'),
    sections: [
      S(SEE, T('Яскраво-зелені смуги біля Толідо на фото — це не трава, а водорості на поверхні води.', 'The bright green streaks near Toledo on the photo are not grass but algae on the water surface.')),
      S(WHY, T('Річка Мамі несе в озеро фосфор із добрив і гною з тисяч ферм. Озеро Ері — наймілкіше з Великих озер, тож улітку швидко прогрівається. Тепло + фосфор = «цвітіння».', 'The Maumee River brings phosphorus from fertiliser and manure of thousands of farms. Erie is the shallowest of the Great Lakes and warms quickly in summer. Warmth + phosphorus = a bloom.')),
      S(RISK, T('Мікроцистин шкодить печінці. Його не знищує кип’ятіння, тож місто може лишитися без питної води.', 'Microcystin damages the liver. Boiling does not destroy it, so a city can be left without drinking water.')),
      S(EX, T('2 серпня 2014 року в місті Толідо (Огайо) понад 400 тисяч людей три дні не могли пити воду з-під крана: отрута потрапила у водогін.', 'On 2 August 2014 in Toledo, Ohio, more than 400,000 people could not drink tap water for three days: the toxin got into the water supply.')),
      S(HELP, T('США й Канада домовилися зменшити потік фосфору в озеро на 40 %. Фермери сіють покривні культури, вносять добрива точніше й відновлюють болота, які «ловлять» фосфор.', 'The USA and Canada agreed to cut the phosphorus flowing into the lake by 40%. Farmers plant cover crops, apply fertiliser more precisely and restore wetlands that trap phosphorus.')),
    ],
    links: [['NOAA — Lake Erie HABs', 'https://www.glerl.noaa.gov/res/HABs_and_Hypoxia/']],
  },
  {
    id: 'gulf_deadzone', layers: CHL, lon: -91.0, lat: 28.9, alt: 0.12, kind: 'human', level: 'danger',
    show: { layer: 'chlorophyll', date: '2021-06-20' },
    title: T('«Мертва зона» Мексиканської затоки', 'The Gulf of Mexico “dead zone”'),
    lead: T('Біля гирла Міссісіпі щоліта з’являється зона без кисню, більша за деякі країни Європи.', 'Every summer an oxygen-free zone larger than some European countries appears off the mouth of the Mississippi.'),
    sections: [
      S(SEE, T('Яскраве «перо» хлорофілу вздовж узбережжя Луїзіани: річка виносить у море добрива, і водорості розростаються.', 'A bright “plume” of chlorophyll along the Louisiana coast: the river carries fertiliser into the sea and algae thrive.')),
      S(WHY, T('Міссісіпі збирає воду з 41 % території США — з кукурудзяних і соєвих полів Середнього Заходу. Азот із добрив живить водорості, а ті, відмираючи, гниють на дні й «з’їдають» кисень.', 'The Mississippi drains 41% of the USA — including the corn and soy fields of the Midwest. Nitrogen from fertiliser feeds algae; when they die they rot on the bottom and use up the oxygen.')),
      S(RISK, T('У «мертвій зоні» в середньому 14 000 км² (у 2017 році — рекордні 22 700 км²). Риба й креветки тікають, а ті, що не встигли, гинуть. Рибалки втрачають улов.', 'The dead zone averages about 14,000 km² (a record 22,700 km² in 2017). Fish and shrimp flee, the slow ones die. Fishermen lose their catch.')),
      S(HELP, T('Фермерам допомагають вносити менше азоту, сіяти покривні культури й відновлювати прибережні болота. Мета — зменшити зону до 5 000 км².', 'Farmers are helped to use less nitrogen, plant cover crops and restore riverside wetlands. The goal is to shrink the zone to 5,000 km².')),
    ],
    links: [['NOAA — Gulf hypoxia', 'https://www.noaa.gov/news-release/larger-than-average-gulf-dead-zone-measured']],
  },
  {
    id: 'mauritania_upwelling', layers: CHL, lon: -17.8, lat: 20.5, alt: 0.25, kind: 'nature', level: 'good',
    show: { layer: 'chlorophyll', date: '2021-03-15' },
    title: T('Апвелінг біля Мавританії — «годівниця» океану', 'Upwelling off Mauritania — the ocean’s feeding ground'),
    lead: T('Тут хлорофілу багато, але це добре: так виглядає одне з найбагатших на рибу місць планети.', 'There is a lot of chlorophyll here, but that is good: this is one of the richest fishing grounds on the planet.'),
    sections: [
      S(SEE, T('Зелено-жовта смуга вздовж берега Західної Африки, а далі в океані — синій колір.', 'A green-yellow band along the coast of West Africa, and blue further out to sea.')),
      S(WHY, T('Пасати весь час відганяють поверхневу воду від берега, а на її місце з глибини піднімається холодна вода, багата на поживні речовини. Це апвелінг. Водорості розквітають, ними живиться дрібна риба, а нею — велика.', 'Trade winds keep pushing surface water away from the coast, and cold water rich in nutrients rises from the deep to replace it. This is upwelling. Algae bloom, small fish eat them, big fish eat the small ones.')),
      S(RISK, T('Ризик тут від людей: великі іноземні флоти виловлюють забагато риби, а частину переробляють на борошно для корму. Місцеві рибалки втрачають заробіток.', 'The risk comes from people: big foreign fleets catch too many fish, and some is turned into fishmeal for animal feed. Local fishermen lose their living.')),
      S(EX, T('Так само «працюють» узбережжя Перу, Каліфорнії та Намібії. Перуанський апвелінг дає близько десятої частини всього світового вилову риби.', 'The coasts of Peru, California and Namibia work the same way. The Peruvian upwelling gives about a tenth of the world’s fish catch.')),
    ],
  },
  {
    id: 'sargasso_desert', layers: CHL, lon: -55.0, lat: 28.0, alt: 0.9, kind: 'nature', level: 'info',
    show: { layer: 'chlorophyll', date: '2025-05-15' },
    title: T('Саргасове море — «океанічна пустеля»', 'The Sargasso Sea — an “ocean desert”'),
    lead: T('Фіолетовий колір — дуже мало хлорофілу. Це не забруднення й не біда: так виглядає природна «пустеля» посеред океану.', 'Purple means very little chlorophyll. It is neither pollution nor a disaster: this is a natural “desert” in the middle of the ocean.'),
    sections: [
      S(SEE, T('Великі фіолетові й сині області в центрі Атлантики, а ближче до берегів — зелені.', 'Large purple and blue areas in the middle of the Atlantic, greener near the coasts.')),
      S(WHY, T('Тут вода повільно обертається (океанічний круговорот) і опускається вниз. Поживні речовини з глибини до поверхні майже не доходять, тож водоростям нічого їсти. Тому вода тут дуже прозора — видно на 60 метрів углиб.', 'Here the water slowly spins (an ocean gyre) and sinks. Nutrients from the deep hardly reach the surface, so algae have nothing to eat. That is why the water is so clear — you can see 60 metres down.')),
      S(RISK, T('Самі «пустелі» — нормальна частина океану. Але дослідження за супутниками показують, що через потепління такі бідні області розширюються: тепла поверхнева вода ще гірше змішується з глибинною.', 'The “deserts” themselves are a normal part of the ocean. But satellite studies show that with warming such poor areas are growing: warm surface water mixes even less with deep water.')),
      S(EX, T('Саме сюди з Європи й Америки пливуть на нерест вугрі, а на поверхні плавають острови водорості саргасум, від якої й пішла назва моря.', 'European and American eels swim here to spawn, and islands of sargassum seaweed float on the surface — that is where the sea got its name.')),
    ],
  },
  // ------------------------------------------------------------------ land
  {
    id: 'rondonia_forest', layers: ['ndvi', 'evi', 'landcover', ...FIRE], lon: -62.8, lat: -10.0, alt: 0.2, kind: 'human', level: 'danger',
    show: { layer: 'ndvi', date: '2024-08-01' },
    title: T('Вирубка Амазонії — «риб’ячий скелет»', 'Amazon clearing — the “fishbone”'),
    lead: T('У бразильському штаті Рондонія ліс вирубують уздовж доріг — згори це схоже на скелет риби.', 'In the Brazilian state of Rondônia the forest is cut along roads — from above it looks like a fish skeleton.'),
    sections: [
      S(SEE, T('Серед темно-зеленого лісу — світлі прямокутники пасовищ і полів, що тягнуться від доріг. На шарі NDVI там зеленість менша.', 'Pale rectangles of pastures and fields stretch from the roads through the dark-green forest. On the NDVI layer greenness is lower there.')),
      S(WHY, T('З 1970-х уряд будував дороги й роздавав землю переселенцям. Ліс вирубували й палили під пасовища для корів і поля сої. Кожна нова дорога відкривала нові «ребра» вирубок.', 'Since the 1970s the government built roads and gave land to settlers. The forest was cut and burned for cattle pastures and soy. Every new road opened new “ribs” of clearings.')),
      S(RISK, T('Ліс Амазонії тримає величезні запаси вуглецю й сам «робить» дощі: дерева випаровують воду. Без лісу клімат регіону стає сухішим і спекотнішим, зникають тварини й рослини, яких більше ніде немає.', 'The Amazon forest stores enormous amounts of carbon and makes its own rain: trees release water vapour. Without the forest the region becomes drier and hotter, and animals and plants found nowhere else disappear.')),
      S(HELP, T('Бразилія стежить за вирубками із супутників щодня (системи DETER і PRODES) і штрафує порушників. У 2023–2024 роках вирубка в Амазонії скоротилася майже вдвічі.', 'Brazil watches clearing from satellites every day (the DETER and PRODES systems) and fines offenders. In 2023–2024 deforestation in the Amazon fell by almost half.')),
    ],
    links: [['NASA Earth Observatory — Rondônia', 'https://science.nasa.gov/earth/earth-observatory/']],
  },
  {
    id: 'sahel_greening', layers: ['ndvi', 'evi', 'landcover', 'precip', 'soil'], lon: -14.5, lat: 14.8, alt: 0.35, kind: 'both', level: 'good',
    show: { layer: 'ndvi', date: '2024-09-01' },
    title: T('Сахель зеленіє', 'The Sahel is greening'),
    lead: T('Смуга на південь від Сахари після страшних посух 1970–80-х знову стає зеленішою. Це видно із супутників.', 'The strip south of the Sahara is becoming greener again after the terrible droughts of the 1970s–80s. Satellites can see it.'),
    sections: [
      S(SEE, T('У вересні, після сезону дощів, зелень на шарі NDVI доходить далеко на північ — до самої Сахари.', 'In September, after the rainy season, greenness on the NDVI layer reaches far north — right up to the Sahara.')),
      S(WHY, T('Дощі частково повернулися. А ще допомогли люди: селяни в Нігері перестали корчувати пагони дерев на полях і виростили нові «ліси» на 5 млн гектарів. Ініціатива «Велика зелена стіна» висаджує дерева від Сенегалу до Джибуті.', 'The rains partly came back. People helped too: farmers in Niger stopped clearing tree shoots in their fields and regrew “forests” on 5 million hectares. The Great Green Wall initiative plants trees from Senegal to Djibouti.')),
      S(RISK, T('Зелень крихка: один посушливий рік — і поля висихають. Населення швидко росте, і людей та худоби стає більше, ніж може прогодувати земля.', 'The green is fragile: one dry year and the fields dry out. The population grows fast, and there are more people and animals than the land can feed.')),
      S(EX, T('Посуха 1968–1985 років у Сахелі забрала понад 100 тисяч життів. Саме тоді вчені вперше почали стежити за пустелями із супутників.', 'The 1968–1985 Sahel drought took more than 100,000 lives. That is when scientists first began to watch deserts from satellites.')),
    ],
  },
  {
    id: 'lut_heat', layers: ['lst_day', 't2m'], lon: 59.3, lat: 30.3, alt: 0.2, kind: 'nature', level: 'info',
    show: { layer: 'lst_day', date: '2025-07-01' },
    title: T('Пустеля Лут — найгарячіша поверхня Землі', 'The Lut Desert — the hottest surface on Earth'),
    lead: T('У пустелі Лут (Іран) супутник Aqua виміряв 70,7 °C — одну з найвищих температур поверхні на планеті.', 'In Iran’s Lut Desert the Aqua satellite measured 70.7 °C — one of the highest surface temperatures on the planet.'),
    sections: [
      S(SEE, T('Темно-червона пляма на шарі «Температура поверхні вдень» у липні.', 'A dark-red spot on the “Daytime surface temperature” layer in July.')),
      S(WHY, T('Темна галька й базальт поглинають сонце, рослин і води немає, тож нічим охолоджуватися випаровуванням. Гори навколо не пускають вологі вітри.', 'Dark pebbles and basalt soak up the sun; there are no plants and no water to cool the ground by evaporation. Mountains around keep out moist winds.')),
      S(RISK, T('Важливо розрізняти: це температура самої землі, а не повітря. Повітря там «лише» близько 50 °C. Але саме так супутники допомагають знаходити найгарячіші місця, де не може бути метеостанцій.', 'Note the difference: this is the temperature of the ground, not of the air. The air is “only” about 50 °C. But this is how satellites find the hottest places, where no weather station could stand.')),
      S(EX, T('Пісок на пляжі в спеку теж гарячий настільки, що обпікає ноги, хоча повітря «лише» +30 °C. Лут — це такий пляж завбільшки з Україну.', 'Beach sand in a heat wave also burns your feet even though the air is “only” +30 °C. Lut is such a beach the size of Ukraine.')),
    ],
  },
  {
    id: 'arctic_warming', layers: ['t2m', 'lst_day', 'snow'], lon: 15.6, lat: 78.2, alt: 0.35, kind: 'human', level: 'danger',
    show: { layer: 't2m', date: '2025-07-01' },
    title: T('Шпіцберген: Арктика гріється найшвидше', 'Svalbard: the Arctic warms fastest'),
    lead: T('Арктика нагрівається приблизно вчетверо швидше за середнє по планеті. Шпіцберген — одне з найшвидших місць.', 'The Arctic is warming about four times faster than the planet on average. Svalbard is one of the fastest places.'),
    sections: [
      S(WHY, T('Білий лід і сніг відбивають сонце, а темна вода й земля — поглинають. Коли лід тане, поверхня темнішає, нагрівається сильніше, і лід тане ще швидше. Це «ефект альбедо».', 'White ice and snow reflect sunlight, dark water and land absorb it. When ice melts the surface darkens, warms more, and the ice melts even faster. This is the “albedo effect”.')),
      S(RISK, T('Тане вічна мерзлота: в Лонгйїрбюені руйнуються будинки, сходять лавини, а у 2017 році талі води залили вхід до Всесвітнього сховища насіння. Білим ведмедям бракує льоду для полювання.', 'Permafrost thaws: houses in Longyearbyen crack, avalanches come down, and in 2017 meltwater flooded the entrance of the Global Seed Vault. Polar bears lack ice to hunt from.')),
      S(EX, T('На графіку — середня температура року в Лонгйїрбюені за даними NASA POWER: лінія піднімається набагато крутіше, ніж для Києва.', 'The chart shows the mean yearly temperature in Longyearbyen from NASA POWER: the line rises much more steeply than for Kyiv.')),
      S(HELP, T('Зупинити танення Арктики можна лише одним способом — скоротити викиди парникових газів по всій планеті.', 'There is only one way to stop the Arctic melting — to cut greenhouse gas emissions all over the planet.')),
    ],
  },
  // ------------------------------------------------------------------ sea and ice
  {
    id: 'med_heatwave', layers: ['sst', 'sst_anom'], lon: 5.0, lat: 40.5, alt: 0.6, kind: 'human', level: 'danger',
    show: { layer: 'sst_anom', date: '2023-07-25' },
    title: T('Морські хвилі спеки в Середземному морі', 'Marine heat waves in the Mediterranean'),
    lead: T('Улітку 2022–2024 років поверхня Середземного моря нагрівалася до рекордних ~28–29 °C.', 'In the summers of 2022–2024 the surface of the Mediterranean heated to record ~28–29 °C.'),
    sections: [
      S(SEE, T('На шарі «Аномалія температури океану» — червоні області: вода тепліша за звичну на 3–5 °C.', 'On the “Sea temperature anomaly” layer red areas show water 3–5 °C warmer than usual.')),
      S(WHY, T('Середземне море майже закрите й неглибоке, тож гріється швидше за океан. Довгі антициклони з безвітряною спекою не дають воді перемішуватися.', 'The Mediterranean is almost closed and shallow, so it warms faster than the ocean. Long anticyclones with calm hot weather stop the water from mixing.')),
      S(RISK, T('Масово гинуть горгонарії, губки, мушлі й посідонія — підводна трава, що дає кисень і притулок рибі. Сюди приходять тропічні види з Червоного моря, а тепла вода живить сильніші зливи на суші.', 'Gorgonians, sponges, shellfish and posidonia — the sea grass that gives oxygen and shelter to fish — die in masses. Tropical species from the Red Sea move in, and warm water fuels heavier downpours on land.')),
      S(EX, T('Вересень 2023: тепла вода дала енергію циклону «Даніель», який спричинив катастрофічну повінь у Лівії.', 'September 2023: warm water powered Storm Daniel, which caused the catastrophic flood in Libya.')),
    ],
  },
  {
    id: 'reef_bleaching', layers: ['sst', 'sst_anom'], lon: 147.5, lat: -18.0, alt: 0.3, kind: 'human', level: 'danger',
    show: { layer: 'sst_anom', date: '2024-03-01' },
    title: T('Великий Бар’єрний риф знебарвлюється', 'The Great Barrier Reef is bleaching'),
    lead: T('Найбільший кораловий риф планети (2300 км уздовж Австралії) переживає масові «знебарвлення» дедалі частіше.', 'The planet’s largest coral reef (2,300 km along Australia) suffers mass “bleaching” more and more often.'),
    sections: [
      S(WHY, T('Корали живуть разом із крихітними водоростями, які дають їм їжу й колір. Якщо вода кілька тижнів поспіль тепліша за звичний літній максимум на 1–2 °C, корали «виганяють» водорості й біліють.', 'Corals live together with tiny algae that give them food and colour. If the water stays 1–2 °C above the usual summer maximum for a few weeks, corals expel the algae and turn white.')),
      S(RISK, T('Білий корал ще живий, але голодує. Якщо спека не мине — він гине. На рифах живе чверть усіх морських видів риб; від рифу залежать туризм і рибальство.', 'A white coral is still alive but starving. If the heat lasts it dies. A quarter of all sea fish species live on reefs; tourism and fishing depend on them.')),
      S(EX, T('Масові знебарвлення були в 1998, 2002, 2016, 2017, 2020, 2022 і 2024 роках — раніше вони траплялися раз на десятиліття.', 'Mass bleaching hit in 1998, 2002, 2016, 2017, 2020, 2022 and 2024 — they used to happen once a decade.')),
      S(HELP, T('Вчені вирощують стійкіші до спеки корали й висаджують їх на риф, але врятувати рифи можна лише зупинивши потепління.', 'Scientists grow more heat-tolerant corals and plant them on the reef, but reefs can only be saved by stopping the warming.')),
    ],
  },
  {
    id: 'arctic_sea_ice', layers: ['seaice', 'sst', 'sst_anom', 'snow'], lon: -160.0, lat: 76.0, alt: 0.9, kind: 'human', level: 'danger',
    show: { layer: 'seaice', date: '2024-09-15' },
    title: T('Арктичного льоду стає дедалі менше', 'Arctic sea ice is shrinking'),
    lead: T('У вересні, коли льоду найменше, його площа тепер приблизно на третину менша, ніж у 1980-х.', 'In September, when the ice is at its smallest, it now covers about a third less than in the 1980s.'),
    sections: [
      S(SEE, T('Білі й рожеві кольори — лід. У морі Бофорта й Чукотському морі на кінець літа тепер часто відкрита вода.', 'White and pink colours are ice. The Beaufort and Chukchi seas now often have open water by the end of summer.')),
      S(WHY, T('Тепліше повітря й вода топлять лід знизу й згори; відкрита темна вода поглинає більше сонця (ефект альбедо). Старий товстий лід майже зник — лишився тонкий однорічний.', 'Warmer air and water melt the ice from above and below; open dark water absorbs more sunlight (the albedo effect). Old thick ice has almost disappeared — mostly thin one-year ice is left.')),
      S(RISK, T('Білі ведмеді й тюлені втрачають «дім», корінні народи — шляхи полювання. Менше льоду — швидше нагрівається вся Північ, і зміни погоди доходять навіть до Європи.', 'Polar bears and seals lose their home, Indigenous peoples lose their hunting routes. Less ice means the whole North warms faster, and weather changes reach even Europe.')),
      S(EX, T('Рекорд — вересень 2012 року. На графіку — площа льоду у вересні за даними NSIDC (партнер NASA).', 'The record low was September 2012. The chart shows the September ice area from NSIDC (a NASA partner).')),
    ],
  },
  // ------------------------------------------------------------------ fires and smoke
  {
    id: 'siberia_fires', layers: [...FIRE, 'co', 'aod'], lon: 128.0, lat: 63.0, alt: 0.6, kind: 'both', level: 'danger',
    show: { layer: 'fires', date: '2021-08-06' },
    title: T('Пожежі в Якутії', 'Fires in Yakutia'),
    lead: T('Улітку 2021 року ліси Якутії горіли так сильно, що дим уперше в історії спостережень дійшов до Північного полюса.', 'In summer 2021 the forests of Yakutia burned so badly that, for the first time on record, the smoke reached the North Pole.'),
    sections: [
      S(SEE, T('Тисячі червоних точок пожеж і величезний шлейф диму на фото — на площі, більшій за пів України.', 'Thousands of red fire dots and a huge smoke plume on the photo — over an area larger than half of Ukraine.')),
      S(WHY, T('Рекордна спека й посуха висушили тайгу. Займання — від блискавок і від людей (недогашені вогнища, підпали трави). Танення мерзлоти й торфу робить пожежі глибшими й довшими.', 'Record heat and drought dried the taiga. Fires start from lightning and from people (unattended campfires, grass burning). Thawing permafrost and peat make fires deeper and longer.')),
      S(RISK, T('Згоріло понад 8 млн гектарів. Пожежі викидають стільки CO₂, скільки цілі країни, а дим отруює повітря в містах за тисячі кілометрів.', 'More than 8 million hectares burned. Such fires release as much CO₂ as whole countries, and the smoke poisons the air of cities thousands of kilometres away.')),
      S(HELP, T('Супутники NASA (FIRMS) знаходять вогонь за кілька годин після займання — так пожежники встигають загасити його, поки він малий.', 'NASA satellites (FIRMS) spot fires within hours of ignition — so firefighters can put them out while they are small.')),
    ],
  },
  {
    id: 'africa_burning', layers: [...FIRE, 'co', 'aod'], lon: 22.0, lat: -9.0, alt: 0.7, kind: 'human', level: 'warn',
    show: { layer: 'fires', date: '2024-08-10' },
    title: T('Африка — континент вогню', 'Africa — the continent of fire'),
    lead: T('Близько 70 % усієї площі, що горить на Землі за рік, — в Африці. Більшість пожеж розпалюють люди.', 'About 70% of all the land that burns on Earth in a year is in Africa. Most fires are lit by people.'),
    sections: [
      S(SEE, T('У липні–вересні над Анголою, Конго й Замбією тисячі точок пожеж, а на шарі CO — хмара чадного газу.', 'In July–September thousands of fire dots over Angola, Congo and Zambia, and a cloud of carbon monoxide on the CO layer.')),
      S(WHY, T('У сухий сезон фермери спалюють траву й залишки врожаю, щоб розчистити поле й отримати свіжу траву для худоби. Так роблять століттями — це дешево, але шкідливо.', 'In the dry season farmers burn grass and crop leftovers to clear fields and get fresh grass for cattle. It has been done for centuries — cheap, but harmful.')),
      S(RISK, T('Дим і чадний газ розносяться над Атлантикою, шкодять легеням мільйонів людей. Часті пожежі не дають савані перетворитися на ліс і збіднюють ґрунт.', 'Smoke and carbon monoxide spread over the Atlantic and harm the lungs of millions. Frequent fires stop savanna from growing into forest and make the soil poorer.')),
      S(EX, T('Те саме роблять і в Україні — навесні палять суху траву, хоча це заборонено й часто перекидається на ліси та будинки.', 'The same happens in Ukraine — dry grass is burned in spring, although it is banned and often spreads to forests and houses.')),
    ],
  },
  // ------------------------------------------------------------------ air
  {
    id: 'highveld_no2', layers: ['no2', 'no2_tropomi', 'so2'], lon: 29.2, lat: -26.2, alt: 0.25, kind: 'human', level: 'danger',
    show: { layer: 'no2_tropomi', date: '2023-07-10' },
    title: T('Вугільні ТЕС Мпумаланги (ПАР)', 'Coal power plants of Mpumalanga (South Africa)'),
    lead: T('Одна з найбільших «плям» діоксиду азоту на всій планеті — над десятком вугільних електростанцій.', 'One of the largest nitrogen dioxide “spots” on the whole planet — above a dozen coal power plants.'),
    sections: [
      S(SEE, T('Яскрава пляма NO₂ на сході ПАР, хоча навколо — сільська місцевість.', 'A bright NO₂ spot in eastern South Africa, although the land around is countryside.')),
      S(WHY, T('Тут працює понад 10 великих вугільних ТЕС, які дають більшу частину електрики країни. Узимку (червень–липень) холодне повітря затримує дим біля землі.', 'More than 10 big coal power plants here make most of the country’s electricity. In winter (June–July) cold air traps the smoke near the ground.')),
      S(RISK, T('NO₂ і SO₂ спричиняють астму й хвороби легень. У 2022 році суд ПАР визнав, що забруднене повітря Гайвельду порушує право людей на здорове довкілля.', 'NO₂ and SO₂ cause asthma and lung disease. In 2022 a South African court ruled that the polluted Highveld air violates people’s right to a healthy environment.')),
      S(HELP, T('Країна будує сонячні й вітрові станції та поступово закриває старі вугільні блоки.', 'The country is building solar and wind farms and slowly closing old coal units.')),
    ],
  },
  {
    id: 'po_valley', layers: ['no2', 'no2_tropomi', 'aod'], lon: 10.2, lat: 45.3, alt: 0.2, kind: 'human', level: 'danger',
    show: { layer: 'no2_tropomi', date: '2020-01-15' },
    title: T('Долина По — смог між горами', 'The Po Valley — smog between mountains'),
    lead: T('Північ Італії — одне з найзабрудненіших місць Європи. Альпи й Апенніни не випускають брудне повітря.', 'Northern Italy is one of the most polluted places in Europe. The Alps and Apennines trap the dirty air.'),
    sections: [
      S(SEE, T('Узимку на шарі NO₂ уся долина від Турина до Венеції світиться; на фото — сірий серпанок над рівниною, а гори навколо чисті.', 'In winter the whole valley from Turin to Venice glows on the NO₂ layer; on the photo a grey haze lies over the plain while the mountains around are clear.')),
      S(WHY, T('Тут багато заводів, машин і ферм. Узимку холодне повітря застоюється в долині (температурна інверсія) і вітер не може його вивіяти.', 'There are many factories, cars and farms. In winter cold air stagnates in the valley (a temperature inversion) and wind cannot blow it away.')),
      S(EX, T('Березень 2020 року: під час карантину через COVID-19 машини й заводи зупинилися — і супутник Sentinel-5P показав, що NO₂ над долиною впав майже вдвічі. Доказ, що бруд — від людей.', 'March 2020: during the COVID-19 lockdown cars and factories stopped — and the Sentinel-5P satellite showed NO₂ over the valley dropping by almost half. Proof that the dirt comes from people.')),
      S(HELP, T('Міста обмежують в’їзд старих машин, переводять опалення з дров і вугілля на чистіше паливо.', 'Cities restrict old cars and switch heating from wood and coal to cleaner fuels.')),
    ],
  },
  {
    id: 'gangetic_haze', layers: ['aod', 'no2', 'no2_tropomi', ...FIRE], lon: 79.0, lat: 27.5, alt: 0.45, kind: 'human', level: 'danger',
    show: { layer: 'aod', date: '2024-11-01' },
    title: T('Смог над Індо-Гангською рівниною', 'Smog over the Indo-Gangetic Plain'),
    lead: T('Щолистопада величезна сіра хмара накриває північ Індії, Пакистан і Бангладеш. Дели стає одним із найбрудніших міст світу.', 'Every November a huge grey cloud covers northern India, Pakistan and Bangladesh. Delhi becomes one of the most polluted cities in the world.'),
    sections: [
      S(SEE, T('На фото 7 листопада 2017 року рівнину ледь видно крізь серпанок; на шарі AOD — найвищі значення на планеті поза пустелями.', 'On the photo of 7 November 2017 the plain is barely visible through the haze; on the AOD layer — the highest values on the planet outside deserts.')),
      S(WHY, T('Фермери Пенджабу після збору рису спалюють стерню, щоб швидко посіяти пшеницю. До цього додаються вихлопи, вугільні ТЕС, заводи й холодне безвітряне повітря, яке тримає все це внизу.', 'After the rice harvest Punjab farmers burn the stubble to sow wheat quickly. Add exhaust, coal plants, factories and cold calm air that keeps it all near the ground.')),
      S(RISK, T('У листопаді 2017 року вміст PM2.5 у Делі перевищував норму ВООЗ у десятки разів — закривали школи. Брудне повітря скорочує життя мешканців рівнини в середньому на кілька років.', 'In November 2017 PM2.5 in Delhi exceeded the WHO guideline dozens of times — schools were closed. Dirty air shortens the lives of people on the plain by several years on average.')),
      S(HELP, T('Уряд дає фермерам машини, що сіють пшеницю прямо в стерню без спалювання, і переводить транспорт на газ та електрику.', 'The government gives farmers machines that sow wheat straight into the stubble without burning, and switches transport to gas and electricity.')),
    ],
  },
  {
    id: 'bodele_dust', layers: ['pm25', 'aod'], lon: 17.5, lat: 17.0, alt: 0.35, kind: 'nature', level: 'info',
    show: { layer: 'pm25', date: '2025-02-01' },
    title: T('Западина Боделе — найпиловіше місце Землі', 'The Bodélé Depression — the dustiest place on Earth'),
    lead: T('Висохле дно давнього озера в Чаді дає більше пилу, ніж будь-яке інше місце планети. І цей пил… удобрює Амазонію!', 'The dry bed of an ancient lake in Chad gives off more dust than any other place on the planet. And this dust… fertilises the Amazon!'),
    sections: [
      S(SEE, T('На шарі «Пил PM2.5» узимку — найяскравіша пляма Сахари; на фото — рудий пиловий шлейф, що тягнеться на південний захід.', 'On the “PM2.5 dust” layer in winter — the brightest spot of the Sahara; on the photo — a reddish dust plume stretching to the south-west.')),
      S(WHY, T('Тисячі років тому тут було озеро Мега-Чад, більше за Каспійське море. Тепер на дні лежать дрібні панцирі мікроводоростей (діатоміт). Сильний вітер між горами Тібесті й Еннеді щодня здуває цей легкий пил.', 'Thousands of years ago Lake Mega-Chad lay here, bigger than the Caspian Sea. Now the bed is covered with tiny shells of micro-algae (diatomite). Strong wind between the Tibesti and Ennedi mountains blows this light dust away every day.')),
      S(RISK, T('Для людей поруч пил — біда для легень і очей. Але для планети це добре: вітер несе пил через Атлантику, і фосфор із нього живить ґрунти Амазонії (за даними супутника NASA CALIPSO — близько 22 тисяч тонн фосфору на рік).', 'For people nearby the dust is bad for lungs and eyes. But for the planet it is good: wind carries it across the Atlantic and its phosphorus feeds Amazon soils (about 22,000 tonnes of phosphorus a year, according to NASA’s CALIPSO satellite).')),
    ],
  },
  {
    id: 'norilsk_so2', layers: ['so2'], lon: 88.2, lat: 69.35, alt: 0.15, kind: 'human', level: 'danger',
    show: { layer: 'so2', date: '2024-01-01' },
    title: T('Норильськ — «мертва зона» навколо заводів', 'Norilsk — a “dead zone” around the smelters'),
    lead: T('Нікелеві й мідні заводи Норильська десятиліттями були найбільшим джерелом діоксиду сірки на планеті.', 'The nickel and copper smelters of Norilsk were for decades the largest source of sulphur dioxide on the planet.'),
    sections: [
      S(SEE, T('Яскрава пляма SO₂ посеред порожньої тундри; на літньому фото навколо міста — сіра й руда земля замість тайги.', 'A bright SO₂ spot in the middle of empty tundra; on the summer photo the land around the city is grey and rust instead of taiga.')),
      S(WHY, T('Руда містить багато сірки. Під час виплавки металу сірка згоряє й виходить у повітря як SO₂ — близько 2 млн тонн щороку.', 'The ore contains a lot of sulphur. When the metal is smelted, the sulphur burns and goes into the air as SO₂ — about 2 million tonnes a year.')),
      S(RISK, T('SO₂ утворює кислотні дощі. Ліс у радіусі десятків кілометрів загинув, люди в місті хворіють частіше. У 2020 році тут ще й сталася аварія — у річки витекло понад 20 тисяч тонн дизелю.', 'SO₂ forms acid rain. The forest died within tens of kilometres, and people in the city are ill more often. In 2020 there was also an accident here — more than 20,000 tonnes of diesel leaked into rivers.')),
      S(HELP, T('Уловлювання сірки на заводі перетворює SO₂ на гіпс. Такі установки давно працюють у Європі — і кислотних дощів там стало значно менше.', 'Capturing sulphur at the plant turns SO₂ into gypsum. Such units have long worked in Europe — and acid rain there has become much rarer.')),
    ],
  },
  // ------------------------------------------------------------------ ozone and water
  {
    id: 'ozone_hole', layers: ['ozone', 'ozone_omi', 'ozone_merra'], lon: 0, lat: -82.0, alt: 2.2, kind: 'human', level: 'good',
    show: { layer: 'ozone', date: '2025-09-25' },
    title: T('Озонова діра повільно заростає', 'The ozone hole is slowly healing'),
    lead: T('Над Антарктидою щовесни (у вересні–жовтні) з’являється «діра» в озоновому шарі. Але вона меншає — і це заслуга людей.', 'Every southern spring (September–October) a “hole” opens in the ozone layer over Antarctica. But it is shrinking — and that is thanks to people.'),
    sections: [
      S(SEE, T('Фіолетова й синя пляма над Антарктидою — мало озону (менше 220 одиниць Добсона).', 'A purple and blue patch over Antarctica — little ozone (below 220 Dobson units).')),
      S(WHY, T('Фреони з холодильників і аерозольних балончиків піднімалися в стратосферу й руйнували озон, який захищає нас від ультрафіолету.', 'CFCs from fridges and spray cans rose into the stratosphere and destroyed the ozone that shields us from ultraviolet light.')),
      S(HELP, T('У 1987 році країни світу підписали Монреальський протокол і заборонили фреони. Діра поступово зменшується, і вчені чекають повного відновлення над Антарктидою приблизно до 2066 року.', 'In 1987 the world signed the Montreal Protocol and banned CFCs. The hole is gradually shrinking, and scientists expect full recovery over Antarctica around 2066.')),
      S(EX, T('Це найкращий приклад того, що люди можуть разом виправити глобальну екологічну проблему. На графіку — площа діри з 1979 року (NASA Ozone Watch).', 'This is the best example that people together can fix a global environmental problem. The chart shows the hole area since 1979 (NASA Ozone Watch).')),
    ],
    links: [['NASA Ozone Watch', 'https://ozonewatch.gsfc.nasa.gov']],
  },
  {
    id: 'india_groundwater', layers: ['grace', 'soil', 'soil_smap'], lon: 76.5, lat: 29.7, alt: 0.4, kind: 'human', level: 'danger',
    show: { layer: 'grace', date: '2022-07-01' },
    title: T('Північна Індія випиває підземну воду', 'North India is drinking its groundwater'),
    lead: T('Супутники GRACE «зважують» воду під землею за силою тяжіння. Над Пенджабом і Хар’яною вони побачили, як вода зникає.', 'The GRACE satellites “weigh” underground water by its gravity. Over Punjab and Haryana they saw the water disappear.'),
    sections: [
      S(SEE, T('Червона пляма на шарі GRACE: запас води тут менший, ніж був, на десятки сантиметрів «шару води».', 'A red spot on the GRACE layer: there is tens of centimetres less “layer of water” here than before.')),
      S(WHY, T('Рис і пшеницю поливають водою зі свердловин. Електрика для насосів фермерам дешева або безкоштовна, тож воду качають більше, ніж її поповнюють дощі.', 'Rice and wheat are irrigated with water from wells. Electricity for pumps is cheap or free for farmers, so more water is pumped than rain refills.')),
      S(RISK, T('За 2002–2008 роки регіон втратив понад 100 км³ підземної води — це втричі більше за Каховське водосховище. Колодязі пересихають, і їх доводиться бурити все глибше.', 'In 2002–2008 the region lost more than 100 km³ of groundwater — three times the Kakhovka reservoir. Wells run dry and have to be drilled ever deeper.')),
      S(HELP, T('Крапельне зрошення, вирощування менш «спраглих» культур замість рису, збирання дощової води.', 'Drip irrigation, growing less thirsty crops instead of rice, collecting rainwater.')),
    ],
    links: [['NASA — GRACE and India groundwater', 'https://grace.jpl.nasa.gov']],
  },
  {
    id: 'cherrapunji_rain', layers: ['precip', 'precip_imerg', 'humidity', 'water_vapor'], lon: 91.7, lat: 25.3, alt: 0.3, kind: 'nature', level: 'info',
    show: { layer: 'precip', date: '2025-07-01' },
    title: T('Черрапунджі — одне з найдощовіших місць Землі', 'Cherrapunji — one of the wettest places on Earth'),
    lead: T('На пагорбах Меґхалаї (Індія) за рік випадає понад 11 метрів дощу — у 20 разів більше, ніж у Києві.', 'On the hills of Meghalaya (India) more than 11 metres of rain fall in a year — 20 times more than in Kyiv.'),
    sections: [
      S(WHY, T('Улітку мусон несе дуже вологе повітря з Бенгальської затоки. Воно впирається в пагорби Кхасі, піднімається, охолоджується — і вся вода випадає дощем саме тут.', 'In summer the monsoon brings very moist air from the Bay of Bengal. It hits the Khasi Hills, rises, cools — and drops all its water right here.')),
      S(EX, T('Місцевий народ кхасі вирощує «живі мости» з коренів фікусів — дерев’яні мости там би згнили від постійної вологи.', 'The local Khasi people grow “living bridges” from the roots of fig trees — wooden bridges would rot in the constant wet.')),
      S(RISK, T('Парадокс: узимку тут бракує питної води — дощова вода швидко стікає з пагорбів, бо ліси вирубано.', 'A paradox: in winter there is a shortage of drinking water — rain runs off the hills fast because the forests were cut.')),
    ],
  },
  {
    id: 'atacama_dry', layers: ['precip', 'precip_imerg', 'humidity', 'water_vapor', 'soil'], lon: -69.9, lat: -23.9, alt: 0.3, kind: 'nature', level: 'info',
    show: { layer: 'precip', date: '2025-07-01' },
    title: T('Атакама — найсухіша пустеля світу', 'The Atacama — the driest desert in the world'),
    lead: T('На деяких метеостанціях Атаками (Чилі) дощу не було за всі роки спостережень.', 'Some weather stations in Chile’s Atacama have never recorded rain.'),
    sections: [
      S(WHY, T('Анди зі сходу «з’їдають» дощі, що йдуть від Амазонії, а холодна течія Гумбольдта з заходу охолоджує повітря над океаном, і хмари не дають дощу.', 'The Andes to the east block the rain coming from the Amazon, and the cold Humboldt Current to the west cools the air over the ocean, so clouds give no rain.')),
      S(EX, T('Ґрунти тут такі сухі й бідні, що NASA випробовує тут марсоходи й прилади для пошуку життя на Марсі. А після рідкісних дощів пустеля розквітає — це називають «desierto florido».', 'The soils are so dry and poor that NASA tests Mars rovers and life-detecting instruments here. After rare rains the desert bursts into flower — the “desierto florido”.')),
      S(RISK, T('Шахти міді й літію (для батарей телефонів і електромобілів) забирають і так рідкісну воду, через що страждають села й фламінго солоних озер.', 'Copper and lithium mines (for phone and car batteries) take the scarce water, and villages and the flamingos of salt lakes suffer.')),
    ],
  },
  // ------------------------------------------------------------------ night lights
  {
    id: 'korea_night', layers: NIGHT, lon: 127.0, lat: 39.0, alt: 0.25, kind: 'human', level: 'info',
    show: { layer: 'nightlights', date: '2016-01-01' },
    title: T('Корея вночі: світло й темрява', 'Korea at night: light and darkness'),
    lead: T('Південна Корея сяє, а Північна майже повністю темна — помітна лише маленька точка Пхеньяна.', 'South Korea shines while North Korea is almost completely dark — only the small dot of Pyongyang is visible.'),
    sections: [
      S(WHY, T('У КНДР бракує електрики: старі електростанції, бідність і ізоляція від світу. Світло вночі — один зі способів «побачити» економіку країни з космосу.', 'North Korea lacks electricity: old power plants, poverty and isolation from the world. Night light is one way to “see” a country’s economy from space.')),
      S(EX, T('Економісти використовують знімки нічних вогнів, щоб оцінити, як живуть люди там, де статистиці не можна вірити.', 'Economists use night-light images to estimate how people live where official statistics cannot be trusted.')),
      S(SEE, T('Порівняй: так само видно, де вимикалося світло в Україні після ударів по енергосистемі (шар «Нічні вогні за конкретну ніч», листопад 2022).', 'Compare: the same way you can see where the lights went out in Ukraine after strikes on the power grid (layer “Night lights on a given night”, November 2022).')),
    ],
  },
  {
    id: 'nile_night', layers: NIGHT, lon: 31.2, lat: 27.0, alt: 0.4, kind: 'both', level: 'info',
    show: { layer: 'nightlights', date: '2016-01-01' },
    title: T('Ніл — світляна стрічка в пустелі', 'The Nile — a ribbon of light in the desert'),
    lead: T('Уночі русло Нілу видно з космосу як тонку яскраву нитку, а дельту — як віяло світла.', 'At night the Nile can be seen from space as a thin bright thread, and its delta as a fan of light.'),
    sections: [
      S(WHY, T('Довкола — Сахара. Майже всі 110 млн єгиптян живуть уздовж річки й у дельті — на ~5 % території країни, де є вода для полів.', 'All around is the Sahara. Almost all 110 million Egyptians live along the river and in the delta — on ~5% of the country, where there is water for fields.')),
      S(EX, T('Це наочний урок географії: люди селяться там, де є вода. Порівняй на шарі «Зеленість рослин (NDVI)»: зелена стрічка Нілу збігається зі світляною.', 'This is a clear geography lesson: people settle where there is water. Compare with the “Plant greenness (NDVI)” layer: the green ribbon of the Nile matches the light one.')),
    ],
  },
  {
    id: 'bakken_flares', layers: NIGHT, lon: -103.0, lat: 48.0, alt: 0.25, kind: 'human', level: 'warn',
    show: { layer: 'nightlights', date: '2016-01-01' },
    title: T('Газові факели Північної Дакоти', 'Gas flares of North Dakota'),
    lead: T('Посеред порожніх прерій світиться пляма, яскрава, як велике місто. Але міста тут немає — це горить газ.', 'In the middle of empty prairie there is a patch as bright as a big city. But there is no city — it is gas burning.'),
    sections: [
      S(WHY, T('Під час нафтового буму 2010-х (сланцева формація Баккен) разом із нафтою з-під землі йшов газ. Труб для нього не вистачало, тож його просто спалювали у факелах.', 'During the oil boom of the 2010s (the Bakken shale) gas came up with the oil. There were not enough pipelines, so it was simply burned in flares.')),
      S(RISK, T('Це марнування палива й зайві викиди CO₂, а частина газу (метан) потрапляє в повітря незгорілою — він гріє клімат у десятки разів сильніше за CO₂.', 'This wastes fuel and adds CO₂, and some gas (methane) escapes unburned — it heats the climate dozens of times more than CO₂.')),
      S(EX, T('Такі самі факели видно в дельті Нігеру, у Перській затоці й у Західному Сибіру.', 'The same flares can be seen in the Niger Delta, the Persian Gulf and Western Siberia.')),
    ],
  },
];

/** hot spots for the layers that are on (data layer and/or base picture) */
export function activeHotspots(overlayId, baseId) {
  return HOTSPOTS.filter((h) => h.layers.includes(overlayId) || h.layers.includes(baseId));
}
