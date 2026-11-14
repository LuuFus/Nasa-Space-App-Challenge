import { lazy, Suspense, useEffect, useState } from 'react';
import Landing from './landing/Landing.jsx';
import { loadJSON } from './lib/data.js';
import { useStore } from './state/store.js';

// The 3D Earth is a separate, heavier chunk: it loads only after "Start".
const EarthApp = lazy(() => import('./EarthApp.jsx'));

function useRoute() {
  const get = () => (window.location.hash.startsWith('#/earth') ? 'earth' : 'home');
  const [route, setRoute] = useState(get);
  useEffect(() => {
    const on = () => setRoute(get());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export default function App() {
  const route = useRoute();
  const lang = useStore((s) => s.lang);
  const setCatalog = useStore((s) => s.setCatalog);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  useEffect(() => { loadJSON('layers.json').then(setCatalog); }, []);
  useEffect(() => { document.body.classList.toggle('earth-mode', route === 'earth'); window.scrollTo(0, 0); }, [route]);
  if (route === 'home') return <Landing />;
  return <Suspense fallback={<div className="boot">…</div>}><EarthApp /></Suspense>;
}
