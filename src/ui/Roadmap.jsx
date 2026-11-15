import { useEffect, useRef } from 'react';
import { Bell, Bot, Box, Download, GraduationCap, Languages, Map as MapIcon, Satellite, Smartphone, Users, Video, X } from 'lucide-react';
import { pickLang } from '../i18n/index.js';

// What we plan to add next (shown on the start page and in the "About" tab).

const T = (uk, en) => ({ uk, en });
const NOW = T('у роботі', 'in progress');
const NEXT = T('наступне', 'next');
const LATER = T('у планах', 'planned');

export const ROADMAP = [
  { icon: Bot, status: NOW, title: T('ШІ-помічник «Детектив»', 'AI assistant “Detective”'),
    text: T('Питаєш звичайними словами — «чому в Індії в листопаді смог?», «покажи, як танув лід у 2012-му» — і помічник вмикає потрібний шар, будує графік і пояснює, звідки взялися числа. Відповідає лише за даними NASA на сайті й чесно каже, коли чогось не знає.',
      'Ask in plain words — “why is there smog in India in November?”, “show how the ice melted in 2012” — and the assistant turns on the right layer, builds a chart and explains where the numbers come from. It answers only from the NASA data on the site and says honestly when it does not know.') },
  { icon: GraduationCap, status: NEXT, title: T('Режим вчителя й уроки', 'Teacher mode and lessons'),
    text: T('Готові уроки для 6–11 класів (географія, біологія, фізика, інформатика): завдання на карті, тест з автоперевіркою, роздруківка для класу.',
      'Ready-made lessons for grades 6–11 (geography, biology, physics, computer science): map tasks, a self-checking quiz, a printout for the class.') },
  { icon: Users, status: NEXT, title: T('Акаунти й спільні нотатки', 'Accounts and shared notes'),
    text: T('Вхід, щоб нотатки не губилися при зміні комп’ютера, і можливість поділитися знахідкою з класом чи командою за посиланням.',
      'Sign-in so notes are not lost when you change computers, and sharing a finding with your class or team by a link.') },
  { icon: MapIcon, status: NEXT, title: T('Області й громади України', 'Ukrainian regions and communities'),
    text: T('Порівнювати не лише країни, а й області та громади: температура, посухи, пожежі, відновлення після війни.',
      'Compare not only countries but oblasts and communities too: temperature, droughts, fires, recovery after the war.') },
  { icon: Bell, status: LATER, title: T('Сповіщення', 'Alerts'),
    text: T('Попередження про пожежі поруч, сильну спеку, брудне повітря чи повінь у твоєму місті — за даними супутників і прогнозу.',
      'Warnings about fires nearby, extreme heat, dirty air or floods in your town — from satellite data and the forecast.') },
  { icon: Satellite, status: LATER, title: T('Нові місії NASA', 'New NASA missions'),
    text: T('PACE (колір океану й планктон), SWOT (рівень води в річках і озерах), TEMPO (забруднення повітря щогодини), NISAR (рухи земної поверхні).',
      'PACE (ocean colour and plankton), SWOT (water levels of rivers and lakes), TEMPO (hourly air pollution), NISAR (ground motion).') },
  { icon: Download, status: LATER, title: T('Завантаження даних', 'Data download'),
    text: T('Зберегти графік, карту чи таблицю (CSV, PNG) для власного дослідження, проєкту МАН чи олімпіади.',
      'Save a chart, a map or a table (CSV, PNG) for your own research, a science-fair project or an olympiad.') },
  { icon: Smartphone, status: LATER, title: T('Телефон і офлайн', 'Phone and offline'),
    text: T('Зручна мобільна версія, яку можна встановити як застосунок і відкрити без інтернету (збережені шари).',
      'A handy mobile version that installs like an app and opens without internet (saved layers).') },
  { icon: Video, status: LATER, title: T('Таймлапси Землі', 'Earth time-lapses'),
    text: T('Відео 2000–2026 у високій якості: як міста світяться вночі, як тануть льодовики, як рухається лінія фронту.',
      'High-quality videos 2000–2026: cities lighting up at night, glaciers melting, the front line moving.') },
  { icon: Box, status: LATER, title: T('AR-глобус', 'AR globe'),
    text: T('Поставити Землю на парту через камеру телефону й обійти навколо неї.', 'Put the Earth on your desk through the phone camera and walk around it.') },
  { icon: Languages, status: LATER, title: T('Більше мов', 'More languages'),
    text: T('Польська, німецька, іспанська — щоб сайтом могли користуватися школярі інших країн.', 'Polish, German, Spanish — so students in other countries can use the site.') },
];

export function RoadmapList({ lang }) {
  const pick = (o) => pickLang(lang, o);
  return (
    <ol className="rm-list">
      {ROADMAP.map((r) => {
        const I = r.icon;
        return (
          <li key={r.title.en}>
            <span className="rm-icon"><I size={18} strokeWidth={1.75} /></span>
            <div>
              <div className="rm-head"><b>{pick(r.title)}</b><span className={`rm-status ${r.status.en.replace(' ', '-')}`}>{pick(r.status)}</span></div>
              <p>{pick(r.text)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default function RoadmapDialog({ open, onClose, lang }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  const uk = lang === 'uk';
  return (
    <dialog ref={ref} className="rm-dialog" onClose={onClose} onClick={(e) => { if (e.target === ref.current) onClose(); }}>
      <div className="rm-dhead">
        <div>
          <h3>{uk ? 'Майбутні оновлення' : 'Coming next'}</h3>
          <p>{uk ? 'Що ми плануємо додати після хакатону. Є ідея? Напиши нам!' : 'What we plan to add after the hackathon. Have an idea? Tell us!'}</p>
        </div>
        <button type="button" className="rm-close" onClick={onClose} aria-label={uk ? 'Закрити' : 'Close'}><X size={16} /></button>
      </div>
      <RoadmapList lang={lang} />
    </dialog>
  );
}
