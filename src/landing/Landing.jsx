import { useEffect, useRef, useState } from 'react';
import '@fontsource/unbounded/500.css';
import '@fontsource/unbounded/700.css';
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/600.css';
import './landing.css';
import { useStore } from '../state/store.js';
import { pickLang } from '../i18n/index.js';
import { Flag } from '../ui/Icons.jsx';
import { ABOUT, FOOTER, HERO, NAV, VIDEO } from './content.js';
import { SOURCES } from '../content/sources.js';

/* Simple line icons (not the organisations' logos, which are protected marks). */
const Icon = {
  nasa: () => (<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="5" /><ellipse cx="12" cy="12" rx="10.5" ry="4" transform="rotate(-25 12 12)" /><circle cx="20" cy="8" r="1.2" fill="currentColor" /></svg>),
  spaceapps: () => (<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 2c3 3 4 7 3 12l-3 3-3-3c-1-5 0-9 3-12z" /><circle cx="12" cy="9" r="1.6" /><path d="M9 14l-3 2 1 3 3-2M15 14l3 2-1 3-3-2" /></svg>),
  noosphere: () => (<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></svg>),
  book: () => (<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z" /><path d="M4 21V5M8 7h7M8 11h7" /></svg>),
};

export default function Landing() {
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  const pick = (o) => pickLang(lang, o);
  const video = useRef(null);
  const [showSources, setShowSources] = useState(false);
  // loop only a few minutes of the long NASA video (less data to stream)
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const [a, b] = VIDEO.segment;
    const onMeta = () => { v.currentTime = a; };
    const onTime = () => { if (v.currentTime > b) v.currentTime = a; };
    v.addEventListener('loadedmetadata', onMeta);
    v.addEventListener('timeupdate', onTime);
    return () => { v.removeEventListener('loadedmetadata', onMeta); v.removeEventListener('timeupdate', onTime); };
  }, []);
  const scrollMore = () => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
  return (
    <div className="landing">
      <header className="l-header">
        <a className="l-brand" href="#/">
          <span className="l-dot" /> IT Detectives
        </a>
        <nav className="l-nav">
          {NAV.filter((n) => n.show).map((n) => (n.id === 'lang' ? (
            <div key="lang" className="l-lang">
              <button className={lang === 'uk' ? 'on' : ''} onClick={() => setLang('uk')}><Flag code="uk" /> UA</button>
              <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}><Flag code="en" /> EN</button>
            </div>
          ) : (
            <a key={n.id} className={n.id === 'earth' ? 'l-btn l-btn-primary' : 'l-btn'} href={n.href || '#/'}>{pick(n.label)}</a>
          )))}
        </nav>
      </header>

      <section className="l-hero">
        <video ref={video} className="l-video" src={VIDEO.src} poster={VIDEO.poster} autoPlay muted loop playsInline preload="auto" aria-hidden="true" />
        <div className="l-veil" />
        <div className="l-hero-content">
          <h1>{HERO.title}</h1>
          <p className="l-sub">{pick(HERO.subtitle)}</p>
          <a className="l-start" href="#/earth">{pick(HERO.start)}</a>
          <button className="l-more" onClick={scrollMore}>{pick(HERO.more)} <span aria-hidden="true">↓</span></button>
        </div>
        <a className="l-credit" href={VIDEO.page} target="_blank" rel="noreferrer">Video: NASA, Earth Views from the ISS</a>
      </section>

      <section className="l-about" id="about">
        <div className="l-card">
          <h2>{pick(ABOUT.title)}</h2>
          <p>{pick(ABOUT.text)}</p>
        </div>
      </section>

      <footer className="l-footer">
        <p className="l-foot-text">{pick(FOOTER.text)}</p>
        <div className="l-links">
          <button className="l-link" onClick={() => setShowSources(!showSources)} title={lang === 'uk' ? 'Джерела даних' : 'Data sources'}>
            {Icon.book()} <span>{lang === 'uk' ? 'Джерела' : 'Sources'}</span>
          </button>
          {FOOTER.links.map((l) => (
            <a key={l.id} className="l-link" href={l.url} target="_blank" rel="noreferrer">{Icon[l.id]?.()} <span>{pick(l.label)}</span></a>
          ))}
        </div>
        {showSources && (
          <ul className="l-sources">
            {SOURCES.map(([n, u, d]) => <li key={n}><a href={u} target="_blank" rel="noreferrer">{n}</a> — {pick(d)}</li>)}
          </ul>
        )}
        <p className="l-small">{lang === 'uk' ? 'Логотипи NASA та партнерів не використовуються: це їхні захищені знаки.' : 'NASA and partner logos are not used: they are protected marks.'}</p>
      </footer>
    </div>
  );
}
