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
