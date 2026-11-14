import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useStore } from '../state/store.js';
import { useT } from '../i18n/index.js';
import LayersPanel from './LayersPanel.jsx';

const load = {
  compare: () => import('./ComparePanel.jsx'),
  report: () => import('./ReportPanel.jsx'),
  planet: () => import('./PlanetPanel.jsx'),
  swipe: () => import('./SwipePanel.jsx'),
  events: () => import('./EventsPanel.jsx'),
  glossary: () => import('./GlossaryPanel.jsx'),
  about: () => import('./AboutPanel.jsx'),
};
const PANELS = Object.fromEntries(Object.entries(load).map(([k, f]) => [k, lazy(f)]));
PANELS.layers = LayersPanel;

const TABS = [
  ['layers', '🗺'], ['compare', '📈'], ['report', '🆚'], ['planet', '🌍'], ['swipe', '⇆'], ['events', '📍'], ['glossary', '📖'], ['about', 'ℹ'],
];

export default function Sidebar() {
  const panel = useStore((s) => s.panel);
  const setPanel = useStore((s) => s.setPanel);
  const { t, lang } = useT();
  const [width, setWidth] = useState(() => +localStorage.getItem('panelWidth') || 380);
  const [drag, setDrag] = useState(false);
  const wide = width > window.innerWidth * 0.5;
  const ref = useRef(null);
  // download the other panels in the background so opening them is instant
  useEffect(() => {
    const go = () => Object.values(load).forEach((f) => f());
    const id = 'requestIdleCallback' in window ? requestIdleCallback(go, { timeout: 4000 }) : setTimeout(go, 3000);
    return () => ('cancelIdleCallback' in window ? cancelIdleCallback(id) : clearTimeout(id));
  }, []);
  useEffect(() => { localStorage.setItem('panelWidth', String(width)); window.dispatchEvent(new Event('resize')); }, [width]);
  const startDrag = (e) => {
    e.preventDefault();
    setDrag(true);
    const left = ref.current.getBoundingClientRect().left;
    const move = (ev) => setWidth(Math.max(300, Math.min(window.innerWidth - 260, ev.clientX - left)));
    const up = () => { setDrag(false); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  const P = PANELS[panel];
  return (
    <aside className="sidebar">
      <nav className="tabs">
        {TABS.map(([id, icon]) => (
          <button key={id} className={panel === id ? 'on' : ''} onClick={() => setPanel(panel === id ? null : id)} title={t(id)}>
            <span className="icon">{icon}</span><span className="tab-text">{t(id)}</span>
          </button>
        ))}
      </nav>
      {P && (
        <section className="panel" ref={ref} style={{ width }}>
          <div className="panel-tools" style={{ padding: '4px 12px' }}>
            <button onClick={() => setWidth(wide ? 380 : Math.round(window.innerWidth * 0.62))}>
              {wide ? (lang === 'uk' ? '⇤ Звузити' : '⇤ Narrow') : (lang === 'uk' ? '⇥ Розгорнути' : '⇥ Widen')}
            </button>
          </div>
          <div className="panel-body"><Suspense fallback={<p className="muted">{t('loading')}</p>}><P /></Suspense></div>
          <div className={drag ? 'panel-resizer drag' : 'panel-resizer'} onPointerDown={startDrag} title={lang === 'uk' ? 'Потягни, щоб змінити ширину' : 'Drag to resize'} />
        </section>
      )}
    </aside>
  );
}
