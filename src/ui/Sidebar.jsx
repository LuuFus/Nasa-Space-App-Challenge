import { lazy, Suspense } from 'react';
import { useStore } from '../state/store.js';
import { useT } from '../i18n/index.js';
import LayersPanel from './LayersPanel.jsx';

const ComparePanel = lazy(() => import('./ComparePanel.jsx'));
const PlanetPanel = lazy(() => import('./PlanetPanel.jsx'));
const SwipePanel = lazy(() => import('./SwipePanel.jsx'));
const EventsPanel = lazy(() => import('./EventsPanel.jsx'));
const GlossaryPanel = lazy(() => import('./GlossaryPanel.jsx'));
const AboutPanel = lazy(() => import('./AboutPanel.jsx'));

const TABS = [
  ['layers', '🗺'], ['compare', '📈'], ['planet', '🌍'], ['swipe', '⇆'], ['events', '📍'], ['glossary', '📖'], ['about', 'ℹ'],
];

export default function Sidebar() {
  const panel = useStore((s) => s.panel);
  const setPanel = useStore((s) => s.setPanel);
  const { t } = useT();
  const P = { layers: LayersPanel, compare: ComparePanel, planet: PlanetPanel, swipe: SwipePanel, events: EventsPanel, glossary: GlossaryPanel, about: AboutPanel }[panel];
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
        <section className="panel">
          <Suspense fallback={<p className="muted">{t('loading')}</p>}><P /></Suspense>
        </section>
      )}
    </aside>
  );
}
