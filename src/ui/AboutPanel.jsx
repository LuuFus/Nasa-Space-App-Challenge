import { useT } from '../i18n/index.js';
import { SOURCES } from '../content/sources.js';


export default function AboutPanel() {
  const { t, pick, lang } = useT();
  const uk = lang === 'uk';
  return (
    <div>
      <h3>{t('appTitle')}</h3>
      <p className="desc">{uk
        ? 'Інтерактивна Земля для школярів і студентів: дивись супутникові дані NASA на 3D-глобусі або на контурній карті, порівнюй країни, перевіряй, чи зміни справжні, а не випадкові, і дізнавайся, що вони означають у житті.'
        : 'An interactive Earth for students: explore NASA satellite data on a 3D globe or a contour map, compare countries, test whether changes are real or random, and learn what they mean in everyday life.'}</p>
      <h4>{uk ? 'Як користуватися' : 'How to use'}</h4>
      <ul className="desc">
        <li>{uk ? 'Колесо миші — наблизити, перетягування — обертати, подвійний клік — політ до точки.' : 'Mouse wheel to zoom, drag to rotate, double-click to fly to a point.'}</li>
        <li>{uk ? '«Шари» — обери тему (температура, рослинність, пожежі…) і дату. Наведи мишку — побачиш число.' : '“Layers” — pick a topic (temperature, vegetation, fires…) and a date. Hover to read the value.'}</li>
        <li>{uk ? '«Порівняти країни» — клацни дві країни на карті й отримай графік, пояснення та прогноз.' : '“Compare countries” — click two countries on the map to get a chart, explanation and forecast.'}</li>
        <li>{uk ? '«Було / стало» — тягни повзунок і порівнюй роки.' : '“Before / after” — drag the slider to compare years.'}</li>
      </ul>
      <h4>{uk ? 'Звідки дані' : 'Where the data comes from'}</h4>
      <ul className="desc small">
        {SOURCES.map(([n, u, d]) => <li key={n}><a href={u} target="_blank" rel="noreferrer">{n}</a> — {pick(d)}</li>)}
      </ul>
      <h4>{uk ? 'Чесно про обмеження' : 'Honest limitations'}</h4>
      <ul className="desc small">
        <li>{uk ? 'Значення країни — середнє з кількох точок NASA POWER усередині неї (від 1 для малих до 16 для найбільших країн), а не з кожного кілометра.' : 'A country value is the average of several NASA POWER points inside it (1 for small countries up to 16 for the largest), not every kilometre.'}</li>
        <li>{uk ? 'Карти трендів і NDVI країн отримано, перетворивши кольори знімків GIBS назад у числа за офіційною палітрою: точність обмежена кроком палітри (наприклад, ~0,5 °C).' : 'Trend maps and country NDVI were obtained by turning GIBS image colours back into numbers using the official colour map: precision is limited by the palette step (e.g. ~0.5 °C).'}</li>
        <li>{uk ? 'Прогноз — це продовження лінійного тренду, а не кліматична модель.' : 'The forecast extends a linear trend; it is not a climate model.'}</li>
      </ul>
      <p className="muted small">{t('team')}</p>
    </div>
  );
}
