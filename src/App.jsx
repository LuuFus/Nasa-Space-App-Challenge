import { useEffect } from 'react';
import GlobeView from './ui/GlobeView.jsx';
import Toolbar from './ui/Toolbar.jsx';
import Sidebar from './ui/Sidebar.jsx';
import ConsentPrompt from './ui/ConsentPrompt.jsx';
import { loadJSON } from './lib/data.js';
import { useStore } from './state/store.js';

export default function App() {
  const setCatalog = useStore((s) => s.setCatalog);
  const lang = useStore((s) => s.lang);
  useEffect(() => { loadJSON('layers.json').then(setCatalog); }, []);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
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
