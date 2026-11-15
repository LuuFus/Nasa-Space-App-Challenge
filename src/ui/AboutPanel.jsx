import { useT } from '../i18n/index.js';
import { useState } from 'react';
import { Rocket } from 'lucide-react';
import { SOURCE_GROUPS } from '../content/sources.js';
import RoadmapDialog from './Roadmap.jsx';


export default function AboutPanel() {
  const { t, pick, lang } = useT();
  const uk = lang === 'uk';
  const [plans, setPlans] = useState(false);
  return (
    <div>
      <button type="button" className="btn-accent rm-open" onClick={() => setPlans(true)}><Rocket size={15} strokeWidth={1.75} /> {uk ? 'Майбутні оновлення: ШІ-помічник та інше' : 'Coming next: AI assistant and more'}</button>
      <RoadmapDialog open={plans} onClose={() => setPlans(false)} lang={lang} />
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
      <h4>{uk ? 'Джерела: дані, матеріали, інструменти' : 'Sources: data, materials, tools'}</h4>
      {SOURCE_GROUPS.map((g) => (
        <details key={g.id} className="src-group" open={g.id === 'ai' || g.id === 'nasa'}>
          <summary>{pick(g.title)} <span className="muted">({g.items.length})</span></summary>
          <ul className="desc small">
            {g.items.map(([n, u, d]) => <li key={n}>{u ? <a href={u} target="_blank" rel="noreferrer">{n}</a> : <b>{n}</b>} — {pick(d)}</li>)}
          </ul>
        </details>
      ))}
      <h4>{uk ? 'Чесно про обмеження' : 'Honest limitations'}</h4>
      <ul className="desc small">
        <li>{uk ? 'Значення країни — середнє з кількох точок NASA POWER усередині неї (від 1 для малих до 16 для найбільших країн), а не з кожного кілометра.' : 'A country value is the average of several NASA POWER points inside it (1 for small countries up to 16 for the largest), not every kilometre.'}</li>
        <li>{uk ? 'Карти трендів і NDVI країн отримано, перетворивши кольори знімків GIBS назад у числа за офіційною палітрою: точність обмежена кроком палітри (наприклад, ~0,5 °C).' : 'Trend maps and country NDVI were obtained by turning GIBS image colours back into numbers using the official colour map: precision is limited by the palette step (e.g. ~0.5 °C).'}</li>
        <li>{uk ? 'Прогноз — це продовження лінійного тренду, а не кліматична модель.' : 'The forecast extends a linear trend; it is not a climate model.'}</li>
      </ul>
      <h4>{uk ? 'Як ми працювали' : 'How we worked'}</h4>
      <p className="desc small">{uk
        ? 'Під час розробки ми використовували ШІ-асистента Claude (Anthropic) у Claude Code: він допомагав писати код, тексти пояснень і перевіряти дані. Ідеї, вибір даних, дизайн і перевірку результатів робила команда.'
        : 'During development we used the AI assistant Claude (Anthropic) in Claude Code: it helped write code and explanations and check data. Ideas, data choices, design and checking the results were done by the team.'}</p>
      <p className="muted small">{uk ? 'Це студентський проєкт хакатону, а не офіційний продукт NASA; NASA його не схвалювала.' : 'This is a student hackathon project, not an official NASA product, and it is not endorsed by NASA.'}</p>
      <p className="muted small">{t('team')}</p>
    </div>
  );
}
