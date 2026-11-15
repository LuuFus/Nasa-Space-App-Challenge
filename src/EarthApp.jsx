import GlobeView from './ui/GlobeView.jsx';
import Toolbar from './ui/Toolbar.jsx';
import Sidebar from './ui/Sidebar.jsx';
import ConsentPrompt from './ui/ConsentPrompt.jsx';
import { useEffect } from 'react';
import { useStore } from './state/store.js';
import { showNight } from './lib/actions.js';

export default function EarthApp() {
  const catalog = useStore((s) => s.catalog);
  // "#/earth/night" opens the Earth at night (link from the start page)
  useEffect(() => {
    if (!catalog) return;
    const check = () => {
      if (!window.location.hash.startsWith('#/earth/night')) return;
      showNight();
      window.history.replaceState(null, '', '#/earth');
    };
    check();
    window.addEventListener('hashchange', check);
    return () => window.removeEventListener('hashchange', check);
  }, [catalog]);
  return (
    <div className="app">
      <Toolbar />
      <div className="main">
        <Sidebar />
        <GlobeView />
      </div>
      <ConsentPrompt />
    </div>
  );
}
