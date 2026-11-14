import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useStore } from '../state/store.js';
import { useT } from '../i18n/index.js';
import { Flag, STROKE, Switch } from './Icons.jsx';

const BASE = import.meta.env.BASE_URL || './';

// map display options, grouped; shown in a menu under the view switch
const GROUPS = [
  { title: { uk: 'Поверхня', en: 'Surface' }, keys: ['clouds', 'tint', 'graticule'] },
  { title: { uk: 'Лінії й підписи', en: 'Lines & names' }, keys: ['borders', 'capitals', 'rivers', 'labels', 'oceans'] },
  { title: { uk: 'Події', en: 'Events' }, keys: ['events'] },
];
const TOGGLE_TEXT = { labels: 'countryNames', events: 'eventMarkers' };
const MODES = [
  { id: 'globe', text: 'globe3d', menu: true },
  { id: 'contour', text: 'contourMap', menu: false },
  { id: 'imagery', text: 'mapImagery', menu: true },
];

export default function Toolbar() {
  const { t, lang, pick } = useT();
  const s = useStore();
  const [menu, setMenu] = useState(null);   // id of the mode whose menu is open
  const [anchor, setAnchor] = useState(0);  // x of the menu, px from the left of the switch
  const timer = useRef(null);
  const refs = useRef({});
  const setView = (v) => {
    if (v === 'globe') s.setMode('globe');
    else { s.setFlatStyle(v === 'contour' ? 'contour' : 'imagery'); s.setMode('flat'); }
  };
  const view = s.mode === 'globe' ? 'globe' : s.flatStyle;
  const open = (id) => {
    clearTimeout(timer.current);
    const el = refs.current[id];
    if (el) setAnchor(el.offsetLeft);
    setMenu(id);
  };
  // a short delay lets the mouse travel from the button to the menu
  const closeSoon = () => { clearTimeout(timer.current); timer.current = setTimeout(() => setMenu(null), 150); };
  useEffect(() => {
    if (!menu) return;
    const esc = (e) => e.key === 'Escape' && setMenu(null);
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [menu]);
  useEffect(() => () => clearTimeout(timer.current), []);
  const uk = lang === 'uk';
  return (
    <header className="toolbar">
      <a className="brand" href="#/" title={uk ? 'На головну сторінку' : 'To the start page'}>
        <img src={`${BASE}brand/nasa.png`} alt="NASA" height="28" className="brand-logo" />
        <span className="brand-text">
          <b>{t('appTitle')}</b>
          <span>{t('team')}</span>
        </span>
      </a>

      <div className="modes" onMouseLeave={closeSoon}>
        <div className="seg-ctl" role="group" aria-label={t('view')}>
          {MODES.map((m) => (
            <div key={m.id} ref={(el) => (refs.current[m.id] = el)} className={view === m.id ? 'mode on' : 'mode'}
              onMouseEnter={() => (view === m.id ? open(m.id) : clearTimeout(timer.current))}>
              <button type="button" className="mode-btn" aria-pressed={view === m.id} onClick={() => { setView(m.id); open(m.id); }}>
                {t(m.text)}
              </button>
              {m.menu && (
                <button type="button" className="mode-chev" aria-haspopup="true" aria-expanded={menu === m.id}
                  aria-label={uk ? 'Що показувати на карті' : 'What to show on the map'}
                  onClick={(e) => { e.stopPropagation(); if (menu === m.id) setMenu(null); else open(m.id); }}>
                  <ChevronDown size={14} strokeWidth={STROKE} />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className={menu ? 'view-menu glass open' : 'view-menu glass'} style={{ left: anchor }}
          onMouseEnter={() => clearTimeout(timer.current)} role="menu" aria-hidden={!menu}>
          {GROUPS.map((g) => (
            <div key={g.title.en} className="vm-group">
              <div className="vm-title">{pick(g.title)}</div>
              {g.keys.map((k) => (
                <div key={k} className="vm-row">
                  <span>{t(TOGGLE_TEXT[k] || k)}</span>
                  <Switch checked={s.toggles[k]} onChange={() => s.toggle(k)} label={t(TOGGLE_TEXT[k] || k)} disabled={!menu} />
                  {k === 'clouds' && s.toggles.clouds && (
                    <input type="date" className="mono vm-date" value={s.cloudDate} min="2018-01-05" max="2026-11-13"
                      aria-label={uk ? 'Дата хмар' : 'Cloud date'} tabIndex={menu ? 0 : -1}
                      onChange={(e) => e.target.value && s.setCloudDate(e.target.value)} />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="seg-ctl lang" role="group" aria-label={uk ? 'Мова' : 'Language'}>
        <button type="button" className={lang === 'uk' ? 'on' : ''} aria-pressed={lang === 'uk'} onClick={() => s.setLang('uk')}><Flag code="uk" /> UA</button>
        <button type="button" className={lang === 'en' ? 'on' : ''} aria-pressed={lang === 'en'} onClick={() => s.setLang('en')}><Flag code="en" /> EN</button>
      </div>
    </header>
  );
}
