import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useStore } from '../state/store.js';
import { useT } from '../i18n/index.js';
import { Flag, STROKE, Switch } from './Icons.jsx';
import SearchBox from './SearchBox.jsx';


// map display options, grouped; shown in a menu under the view switch
const GROUPS = [
  { title: { uk: 'Поверхня', en: 'Surface' }, keys: ['clouds', 'tint', 'graticule'] },
  { title: { uk: 'Лінії й підписи', en: 'Lines & names' }, keys: ['borders', 'capitals', 'rivers', 'labels', 'oceans'] },
  { title: { uk: 'Події й підказки', en: 'Events & hints' }, keys: ['events', 'hotspots'] },
];
const OSM_GROUPS = [{ title: { uk: 'Події й підказки', en: 'Events & hints' }, keys: ['events', 'hotspots'] }];
const TOGGLE_TEXT = { labels: 'countryNames', events: 'eventMarkers', hotspots: 'hotspotMarkers' };
const MODES = [
  { id: 'globe', text: 'globe3d', menu: true },
  { id: 'contour', text: 'contourMap', menu: false },
  { id: 'osm', text: 'osmMap', menu: true },
];
// base maps of the OpenStreetMap view (src/map/basemaps.js)
const BASEMAPS = [
  { id: 'osm', title: { uk: 'OSM класична', en: 'OSM classic' } },
  { id: 'light', title: { uk: 'Світла', en: 'Light' } },
  { id: 'dark', title: { uk: 'Темна', en: 'Dark' } },
  { id: 'satellite', title: { uk: 'Супутник NASA', en: 'NASA satellite' } },
];

export default function Toolbar() {
  const { t, lang, pick } = useT();
  const s = useStore();
  const [menu, setMenu] = useState(null);   // id of the mode whose menu is open
  const [anchor, setAnchor] = useState(0);  // x of the menu, px from the left of the switch
  const timer = useRef(null);
  const refs = useRef({});
  const setView = (v) => {
    if (v === 'globe' || v === 'osm') s.setMode(v);
    else { s.setFlatStyle('contour'); s.setMode('flat'); }
  };
  const view = s.mode === 'globe' || s.mode === 'osm' ? s.mode : s.flatStyle;
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
        {/* the project's own mark (the NASA insignia may not be used without NASA's permission) */}
        <svg className="brand-logo" viewBox="0 0 32 32" width="28" height="28" fill="none" aria-hidden="true">
          <circle cx="16" cy="16" r="7.5" stroke="currentColor" strokeWidth="1.4" />
          <ellipse cx="16" cy="16" rx="14" ry="5" transform="rotate(-24 16 16)" stroke="#38BDF8" strokeWidth="1.2" />
          <circle cx="28.2" cy="10.6" r="1.8" fill="#38BDF8" />
        </svg>
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
          {menu === 'osm' && (
            <div className="vm-group">
              <div className="vm-title">{uk ? 'Вигляд' : 'View'}</div>
              <div className="vm-proj seg-ctl">
                <button type="button" className={!s.osmGlobe ? 'on' : ''} aria-pressed={!s.osmGlobe} tabIndex={menu ? 0 : -1} onClick={() => s.setOsmGlobe(false)}>{uk ? 'Плоска карта' : 'Flat map'}</button>
                <button type="button" className={s.osmGlobe ? 'on' : ''} aria-pressed={s.osmGlobe} tabIndex={menu ? 0 : -1} onClick={() => s.setOsmGlobe(true)}>{uk ? 'Глобус' : 'Globe'}</button>
              </div>
              <div className="vm-title">{uk ? 'Основа карти (OpenStreetMap)' : 'Base map (OpenStreetMap)'}</div>
              <div className="vm-bases">
                {BASEMAPS.map((b) => (
                  <button key={b.id} type="button" className={s.basemap === b.id ? `vm-base on base-${b.id}` : `vm-base base-${b.id}`} aria-pressed={s.basemap === b.id}
                    tabIndex={menu ? 0 : -1} onClick={() => s.setBasemap(b.id)}>
                    <i aria-hidden="true" /><span>{pick(b.title)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {(menu === 'osm' ? OSM_GROUPS : GROUPS).map((g) => (
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

      <SearchBox />

      <div className="seg-ctl lang" role="group" aria-label={uk ? 'Мова' : 'Language'}>
        <button type="button" className={lang === 'en' ? 'on' : ''} aria-pressed={lang === 'en'} onClick={() => s.setLang('en')}><Flag code="en" /> EN</button>
        <button type="button" className={lang === 'uk' ? 'on' : ''} aria-pressed={lang === 'uk'} onClick={() => s.setLang('uk')}><Flag code="uk" /> UA</button>
      </div>
    </header>
  );
}
