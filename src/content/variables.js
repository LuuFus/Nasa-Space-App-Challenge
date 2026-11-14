// What can be compared between countries (NASA POWER series) and how to talk
// about it in everyday words.

export const VARIABLES = {
  T2M: {
    title: { uk: 'Температура повітря', en: 'Air temperature' },
    unit: '°C', digits: 1, term: 'temperature', gibs: 't2m',
    more: { uk: 'тепліше', en: 'warmer' },
    has: { uk: 'Вищу середню температуру має', en: 'Higher average temperature:' },
    life: {
      uk: (d) => d >= 1.5
        ? `+${d.toFixed(1)} °C — це дуже багато для клімату: приблизно так відрізняється погода Києва і Одеси. Весна настає на 1–2 тижні раніше, спекотних днів понад +30 °C стає в рази більше, взимку частіше йде дощ замість снігу.`
        : d >= 0.5
          ? `+${d.toFixed(1)} °C здається дрібницею, але це середнє за весь рік. На практиці це означає більше спекотних днів улітку, коротшу зиму і раніше цвітіння садів.`
          : `Зміна менша за 0,5 °C — людина її не помітить, але для льодовиків і рослин вона вже відчутна.`,
      en: (d) => d >= 1.5
        ? `+${d.toFixed(1)} °C is a lot for a climate: roughly the difference between Kyiv and Odesa. Spring arrives 1–2 weeks earlier, days above +30 °C become much more common, and winter brings more rain instead of snow.`
        : d >= 0.5
          ? `+${d.toFixed(1)} °C sounds small, but it is an average over the whole year. In practice it means more hot summer days, shorter winters and earlier blossoming.`
          : `A change below 0.5 °C is not something a person would notice, but glaciers and plants already feel it.`,
    },
  },
  T2M_MAX: {
    title: { uk: 'Денна максимальна температура', en: 'Daytime maximum temperature' },
    unit: '°C', digits: 1, term: 'temperature',
    has: { uk: 'Спекотніші дні має', en: 'Hotter days:' },
    life: {
      uk: (d) => `Середній денний максимум змінився на ${d >= 0 ? '+' : ''}${d.toFixed(1)} °C. Від денної спеки залежить, скільки води випаровується з полів і як важко працювати надворі.`,
      en: (d) => `The average daily maximum changed by ${d >= 0 ? '+' : ''}${d.toFixed(1)} °C. Daytime heat controls how much water evaporates from fields and how hard it is to work outdoors.`,
    },
  },
  T2M_MIN: {
    title: { uk: 'Нічна мінімальна температура', en: 'Night-time minimum temperature' },
    unit: '°C', digits: 1, term: 'temperature',
    has: { uk: 'Тепліші ночі має', en: 'Warmer nights:' },
    life: {
      uk: (d) => `Нічний мінімум змінився на ${d >= 0 ? '+' : ''}${d.toFixed(1)} °C. Теплі ночі — це менше заморозків (добре для садів), але й гірший сон у спеку та більше комарів і кліщів.`,
      en: (d) => `The night-time minimum changed by ${d >= 0 ? '+' : ''}${d.toFixed(1)} °C. Warm nights mean fewer frosts (good for orchards) but worse sleep in heatwaves and more mosquitoes and ticks.`,
    },
  },
  PRECTOTCORR: {
    title: { uk: 'Опади', en: 'Precipitation' },
    unit: { uk: 'мм/рік', en: 'mm/year' }, unitMonth: { uk: 'мм', en: 'mm' }, digits: 0, term: 'precipitation', gibs: 'precip',
    has: { uk: 'Більше опадів отримує', en: 'More rain and snow:' },
    life: {
      uk: (d) => `1 мм опадів — це 1 літр води на кожен квадратний метр. Тож ${Math.abs(d).toFixed(0)} мм на рік — як ${Math.max(1, Math.round(Math.abs(d) / 10))} відер води на кожен метр городу ${d >= 0 ? 'більше' : 'менше'} щороку.`,
      en: (d) => `1 mm of precipitation is 1 litre of water on every square metre. So ${Math.abs(d).toFixed(0)} mm a year is like ${Math.max(1, Math.round(Math.abs(d) / 10))} buckets of water ${d >= 0 ? 'more' : 'less'} on every square metre of garden each year.`,
    },
  },
  GWETROOT: {
    title: { uk: 'Вологість ґрунту (коренева зона)', en: 'Soil moisture (root zone)' },
    unit: '%', digits: 1, term: 'soil_moisture', gibs: 'soil',
    has: { uk: 'Вологіший ґрунт має', en: 'Wetter soil:' },
    life: {
      uk: (d) => `Показник у відсотках від повного насичення ґрунту водою (0 % — пил, 100 % — болото). Зміна на ${d >= 0 ? '+' : ''}${d.toFixed(1)} в. п. ${d < 0 ? 'означає, що коріння пшениці чи кукурудзи влітку частіше «спрагле» — урожай падає в посуху.' : 'означає більше запасу води для рослин між дощами.'}`,
      en: (d) => `Shown as a percentage of full saturation (0% is dust, 100% is a swamp). A change of ${d >= 0 ? '+' : ''}${d.toFixed(1)} points ${d < 0 ? 'means wheat or maize roots are thirsty more often in summer — harvests drop in droughts.' : 'means more water stored for plants between rains.'}`,
    },
  },
  GWETTOP: {
    title: { uk: 'Вологість верхнього шару ґрунту', en: 'Topsoil moisture' },
    unit: '%', digits: 1, term: 'soil_moisture',
    has: { uk: 'Вологіший верхній шар має', en: 'Wetter topsoil:' },
    life: {
      uk: (d) => `Верхні ~5 см ґрунту швидко пересихають після спеки й швидко намокають після дощу. Зміна: ${d >= 0 ? '+' : ''}${d.toFixed(1)} в. п. Від цього залежить, чи зійде насіння навесні і чи буде пилова буря.`,
      en: (d) => `The top ~5 cm of soil dries quickly in heat and wets quickly after rain. Change: ${d >= 0 ? '+' : ''}${d.toFixed(1)} points. It decides whether seeds sprout in spring and whether dust storms happen.`,
    },
  },
  RH2M: {
    title: { uk: 'Відносна вологість повітря', en: 'Relative humidity' },
    unit: '%', digits: 1, term: 'humidity', gibs: 'humidity',
    has: { uk: 'Вологіше повітря має', en: 'More humid air:' },
    life: {
      uk: (d) => `100 % — туман, 30 % — сухо, як у пустелі чи в квартирі взимку. Зміна на ${d >= 0 ? '+' : ''}${d.toFixed(1)} в. п. ${d < 0 ? 'Сухіше повітря швидше висушує ліс і поля — зростає ризик пожеж.' : 'Вологе повітря важче переносити в спеку: піт гірше випаровується.'}`,
      en: (d) => `100% is fog, 30% is as dry as a desert or a heated flat in winter. Change: ${d >= 0 ? '+' : ''}${d.toFixed(1)} points. ${d < 0 ? 'Drier air dries forests and fields faster — fire risk rises.' : 'Humid air is harder to bear in heat because sweat evaporates poorly.'}`,
    },
  },
  QV2M: {
    title: { uk: 'Кількість водяної пари', en: 'Water vapour (specific humidity)' },
    unit: { uk: 'г/кг', en: 'g/kg' }, digits: 2, term: 'humidity',
    has: { uk: 'Більше пари в повітрі має', en: 'More water vapour:' },
    life: {
      uk: (d) => `Скільки грамів води в кожному кілограмі повітря. Тепле повітря тримає більше пари (+7 % на кожен градус), тому злива може бути сильнішою. Зміна: ${d >= 0 ? '+' : ''}${d.toFixed(2)} г/кг.`,
      en: (d) => `Grams of water in each kilogram of air. Warm air holds more vapour (+7% per degree), so downpours can be heavier. Change: ${d >= 0 ? '+' : ''}${d.toFixed(2)} g/kg.`,
    },
  },
  WS2M: {
    title: { uk: 'Швидкість вітру', en: 'Wind speed' },
    unit: { uk: 'м/с', en: 'm/s' }, digits: 2, term: 'wind',
    has: { uk: 'Сильніший вітер має', en: 'Windier:' },
    life: {
      uk: (d) => `5 м/с — гойдаються гілки, 10 м/с — важко тримати парасолю. Зміна на ${d >= 0 ? '+' : ''}${d.toFixed(2)} м/с впливає на вітрові електростанції: їхня потужність росте як куб швидкості вітру.`,
      en: (d) => `5 m/s moves branches, 10 m/s makes an umbrella hard to hold. A change of ${d >= 0 ? '+' : ''}${d.toFixed(2)} m/s matters for wind farms: their power grows with the cube of wind speed.`,
    },
  },
  ALLSKY_SFC_SW_DWN: {
    title: { uk: 'Сонячне світло біля поверхні', en: 'Sunlight at the surface' },
    unit: { uk: 'кВт·год/м²/день', en: 'kWh/m²/day' }, digits: 2, term: 'solar',
    has: { uk: 'Більше сонця має', en: 'More sunshine:' },
    life: {
      uk: (d) => `Сонячна панель площею 1 м² (ККД 20 %) дає приблизно 0,2 × це число кВт·год на день. Зміна на ${d >= 0 ? '+' : ''}${d.toFixed(2)} — це ±${(Math.abs(d) * 0.2 * 365).toFixed(0)} кВт·год на рік з одного метра.`,
      en: (d) => `A 1 m² solar panel (20% efficient) makes about 0.2 × this number kWh a day. A change of ${d >= 0 ? '+' : ''}${d.toFixed(2)} is ±${(Math.abs(d) * 0.2 * 365).toFixed(0)} kWh a year per square metre.`,
    },
  },
};

// Series computed by pipeline/06_gibs_trends.py from MODIS maps (yearly only)
Object.assign(VARIABLES, {
  NDVI: {
    title: { uk: 'Рослинність (NDVI, MODIS)', en: 'Vegetation (NDVI, MODIS)' },
    unit: 'NDVI', digits: 3, term: 'ndvi', gibs: 'ndvi', src: 'gibs', key: 'ndvi',
    has: { uk: 'Зеленішу рослинність має', en: 'Greener vegetation:' },
    life: {
      uk: (d) => `NDVI змінився на ${d >= 0 ? '+' : ''}${d.toFixed(3)}. Для порівняння: густий ліс ≈ 0,8, поле влітку ≈ 0,6, сухий степ ≈ 0,2. ${d < -0.02 ? 'Рослинність бідніє — посухи, пожежі, вирубки або забудова.' : d > 0.02 ? 'Земля «зеленіє» — більше посівів, лісів або довший вегетаційний сезон.' : 'Помітних змін зеленості немає.'}`,
      en: (d) => `NDVI changed by ${d >= 0 ? '+' : ''}${d.toFixed(3)}. For reference: dense forest ≈ 0.8, summer crops ≈ 0.6, dry steppe ≈ 0.2. ${d < -0.02 ? 'Vegetation is getting poorer — droughts, fires, logging or building.' : d > 0.02 ? 'The land is greening — more crops, forest or a longer growing season.' : 'No noticeable change in greenness.'}`,
    },
  },
  LST_DAY: {
    title: { uk: 'Температура поверхні суші вдень (MODIS)', en: 'Daytime land surface temperature (MODIS)' },
    unit: '°C', digits: 1, term: 'lst', gibs: 'lst_day', src: 'gibs', key: 'lst_day',
    note: {
      uk: 'Увага: супутник Terra старіє, і з ~2022 року його орбіта «зсувається» — він пролітає раніше вранці, коли земля ще не прогріта. Тому останні роки можуть виглядати холоднішими, ніж були насправді. Це гарний приклад, чому дані треба перевіряти!',
      en: 'Careful: the ageing Terra satellite’s orbit has been drifting since ~2022 — it passes earlier in the morning, before the ground warms up. So recent years may look colder than they really were. A good example of why data must be checked!',
    },
    has: { uk: 'Гарячішу поверхню має', en: 'Hotter ground:' },
    life: {
      uk: (d) => `Середня денна температура самої землі змінилася на ${d >= 0 ? '+' : ''}${d.toFixed(1)} °C. Гаряча поверхня швидше висушує ґрунт і нагріває повітря над містами.`,
      en: (d) => `The average daytime temperature of the ground itself changed by ${d >= 0 ? '+' : ''}${d.toFixed(1)} °C. A hot surface dries soil faster and heats the air above cities.`,
    },
  },
});

// Air quality, MERRA-2 maps decoded by pipeline/06_gibs_trends.py (yearly only)
Object.assign(VARIABLES, {
  PM25: {
    title: { uk: 'Пил PM2.5 у повітрі (MERRA-2)', en: 'Dust PM2.5 in the air (MERRA-2)' },
    unit: { uk: 'мкг/м³', en: 'µg/m³' }, digits: 1, term: 'pm25', gibs: 'pm25', src: 'gibs', key: 'pm25',
    has: { uk: 'Більше пилу в повітрі має', en: 'More dust in the air:' },
    life: {
      uk: (d) => `Концентрація дрібного пилу змінилася на ${d >= 0 ? '+' : ''}${d.toFixed(1)} мкг/м³. ВООЗ радить, щоб у середньому за рік PM2.5 не перевищував 5 мкг/м³ — дрібний пил потрапляє глибоко в легені.`,
      en: (d) => `Fine dust changed by ${d >= 0 ? '+' : ''}${d.toFixed(1)} µg/m³. The WHO advises a yearly average of PM2.5 below 5 µg/m³ — fine dust goes deep into the lungs.`,
    },
  },
  AOD: {
    title: { uk: 'Аерозолі — каламутність повітря (MERRA-2)', en: 'Aerosols — haze (MERRA-2)' },
    unit: 'AOD', digits: 3, term: 'aod', gibs: 'aod', src: 'gibs', key: 'aod',
    has: { uk: 'Каламутніше повітря має', en: 'Hazier air:' },
    life: {
      uk: (d) => `Оптична товщина аерозолів змінилася на ${d >= 0 ? '+' : ''}${d.toFixed(3)}. Менше — прозоріше небо й більше сонця для рослин і сонячних панелей; більше — дим, пил і смог.`,
      en: (d) => `Aerosol optical depth changed by ${d >= 0 ? '+' : ''}${d.toFixed(3)}. Lower means a clearer sky and more sun for plants and solar panels; higher means smoke, dust and smog.`,
    },
  },
  SO2: {
    title: { uk: 'Діоксид сірки SO₂ — викиди (MERRA-2)', en: 'Sulphur dioxide SO₂ — emissions (MERRA-2)' },
    unit: { uk: 'мг/м²', en: 'mg/m²' }, digits: 2, term: 'so2', gibs: 'so2', src: 'gibs', key: 'so2',
    has: { uk: 'Більше SO₂ над собою має', en: 'More SO₂ overhead:' },
    life: {
      uk: (d) => `Кількість SO₂ змінилася на ${d >= 0 ? '+' : ''}${d.toFixed(2)} мг/м². SO₂ дають вугільні електростанції та металургія; з нього утворюються кислотні дощі. ${d < 0 ? 'Падіння — ознака фільтрів на ТЕС або закриття заводів.' : 'Зростання — більше спаленого вугілля.'}`,
      en: (d) => `SO₂ changed by ${d >= 0 ? '+' : ''}${d.toFixed(2)} mg/m². SO₂ comes from coal power plants and smelters and causes acid rain. ${d < 0 ? 'A fall means filters at power plants or closed factories.' : 'A rise means more coal burned.'}`,
    },
  },
});

export const SEASONS = [
  { id: 'year', months: null, title: { uk: 'Увесь рік', en: 'Whole year' } },
  { id: 'winter', months: [12, 1, 2], title: { uk: 'Зима (гру–лют)', en: 'Winter (Dec–Feb)' } },
  { id: 'spring', months: [3, 4, 5], title: { uk: 'Весна (бер–тра)', en: 'Spring (Mar–May)' } },
  { id: 'summer', months: [6, 7, 8], title: { uk: 'Літо (чер–сер)', en: 'Summer (Jun–Aug)' } },
  { id: 'autumn', months: [9, 10, 11], title: { uk: 'Осінь (вер–лис)', en: 'Autumn (Sep–Nov)' } },
  ...[...Array(12)].map((_, i) => ({
    id: 'm' + (i + 1), months: [i + 1],
    title: {
      uk: ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'][i],
      en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][i],
    },
  })),
];

export const unitText = (v, lang, monthly = false) => {
  const u = monthly && v.unitMonth ? v.unitMonth : v.unit;
  return typeof u === 'string' ? u : u[lang];
};
