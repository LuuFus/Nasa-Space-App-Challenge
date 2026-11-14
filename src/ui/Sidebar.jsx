import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2, Pin, PinOff, X } from 'lucide-react';
import { useStore } from '../state/store.js';
import { useT } from '../i18n/index.js';
import LayersPanel from './LayersPanel.jsx';
import { STROKE, TAB_ICONS } from './Icons.jsx';

const load = {
  compare: () => import('./CountriesPanel.jsx'),
  planet: () => import('./PlanetPanel.jsx'),
  swipe: () => import('./SwipePanel.jsx'),
  events: () => import('./EventsPanel.jsx'),
  glossary: () => import('./GlossaryPanel.jsx'),
  about: () => import('./AboutPanel.jsx'),
};
const PANELS = Object.fromEntries(Object.entries(load).map(([k, f]) => [k, lazy(f)]));
PANELS.layers = LayersPanel;
const TABS = ['layers', 'compare', 'planet', 'swipe', 'events', 'glossary', 'about'];
const DEFAULT_W = 400;

/**
 * Narrow icon rail + work panel.
 * Pinned: the panel stays open next to the map (clicking the active icon folds it).
 * Not pinned: the panel slides over the map when the mouse rests on an icon and
 * slides away when the mouse leaves.
 */
export default function Sidebar() {
  const panel = useStore((s) => s.panel);
  const setPanel = useStore((s) => s.setPanel);
  const { t, lang } = useT();
  const uk = lang === 'uk';
  const [pinned, setPinned] = useState(() => localStorage.getItem('panelPinned') !== '0');
  const [hover, setHover] = useState(false);
  const [width, setWidth] = useState(() => +localStorage.getItem('panelWidth') || DEFAULT_W);
  const [drag, setDrag] = useState(false);
  const wide = width > window.innerWidth * 0.5;
  const ref = useRef(null);
  const timers = useRef({});
  // download the other panels in the background so opening them is instant
  useEffect(() => {
    const go = () => Object.values(load).forEach((f) => f());
    const id = 'requestIdleCallback' in window ? requestIdleCallback(go, { timeout: 4000 }) : setTimeout(go, 3000);
    return () => ('cancelIdleCallback' in window ? cancelIdleCallback(id) : clearTimeout(id));
  }, []);
  useEffect(() => { localStorage.setItem('panelWidth', String(width)); }, [width]);
  useEffect(() => { localStorage.setItem('panelPinned', pinned ? '1' : '0'); }, [pinned]);
  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);

  const open = pinned ? !!panel : hover && !!panel;
  const clear = () => { clearTimeout(timers.current.open); clearTimeout(timers.current.close); };
  const hoverIcon = (id) => {
    if (pinned) return;
    clear();
    timers.current.open = setTimeout(() => { setPanel(id); setHover(true); }, 120);
  };
  const leave = () => {
    if (pinned) return;
    clear();
    timers.current.close = setTimeout(() => {
      // keep the panel while the user types or picks from a list inside it
      const a = document.activeElement;
      if (ref.current?.contains(a) && /^(SELECT|INPUT|TEXTAREA)$/.test(a.tagName)) return;
      setHover(false);
    }, 260);
  };
  const clickIcon = (id) => {
    clear();
    if (pinned) setPanel(panel === id ? null : id);
    else if (hover && panel === id) setHover(false);
    else { setPanel(id); setHover(true); }
  };
  const startDrag = (e) => {
    e.preventDefault();
    setDrag(true);
    const left = ref.current.getBoundingClientRect().left;
    const move = (ev) => setWidth(Math.max(320, Math.min(window.innerWidth - 300, ev.clientX - left)));
    const up = () => { setDrag(false); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  const P = PANELS[panel];
  const TabIcon = TAB_ICONS[panel];
  return (
    <aside className={`sidebar ${pinned ? 'pinned' : 'floating'}${open ? ' is-open' : ''}`} onMouseLeave={leave} onMouseEnter={() => clearTimeout(timers.current.close)}>
      <nav className="rail" aria-label={uk ? 'Розділи' : 'Sections'}>
        <button type="button" className={pinned ? 'rail-pin on' : 'rail-pin'} onClick={() => { setPinned(!pinned); setHover(false); }}
          aria-pressed={pinned} title={pinned ? (uk ? 'Відкріпити: панель виїжджатиме при наведенні' : 'Unpin: the panel slides out on hover') : (uk ? 'Закріпити панель' : 'Pin the panel')}>
          {pinned ? <Pin size={17} strokeWidth={STROKE} /> : <PinOff size={17} strokeWidth={STROKE} />}
        </button>
        <span className="rail-sep" />
        {TABS.map((id) => {
          const I = TAB_ICONS[id];
          return (
            <button key={id} type="button" className={panel === id && open ? 'rail-btn on' : 'rail-btn'}
              aria-label={t(id)} aria-current={panel === id && open ? 'page' : undefined}
              onMouseEnter={() => hoverIcon(id)} onMouseLeave={() => clearTimeout(timers.current.open)} onClick={() => clickIcon(id)}>
              <I size={20} strokeWidth={STROKE} />
              <span className="rail-tip">{t(id)}</span>
            </button>
          );
        })}
      </nav>
      <section ref={ref} className={open ? 'drawer glass open' : 'drawer glass'} style={{ width }} aria-hidden={!open}>
        {P && (
          <>
            <div className="drawer-head">
              {TabIcon && <TabIcon size={18} strokeWidth={STROKE} className="drawer-icon" />}
              <h2>{t(panel)}</h2>
              <button type="button" className="icon-btn" onClick={() => setWidth(wide ? DEFAULT_W : Math.round(window.innerWidth * 0.62))}
                title={wide ? (uk ? 'Звузити панель' : 'Narrow the panel') : (uk ? 'Розширити панель' : 'Widen the panel')}>
                {wide ? <Minimize2 size={15} strokeWidth={STROKE} /> : <Maximize2 size={15} strokeWidth={STROKE} />}
              </button>
              <button type="button" className="icon-btn" onClick={() => (pinned ? setPanel(null) : setHover(false))} title={uk ? 'Згорнути панель' : 'Fold the panel'}>
                <X size={16} strokeWidth={STROKE} />
              </button>
            </div>
            <div className="panel-body"><Suspense fallback={<p className="muted">{t('loading')}</p>}><P /></Suspense></div>
            <div className={drag ? 'panel-resizer drag' : 'panel-resizer'} onPointerDown={startDrag} title={uk ? 'Потягни, щоб змінити ширину' : 'Drag to resize'} />
          </>
        )}
      </section>
    </aside>
  );
}
