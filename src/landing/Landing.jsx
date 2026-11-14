import { useEffect, useRef, useState } from 'react';
import '@fontsource/cormorant-garamond/300.css';
import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import './landing.css';
import { useStore } from '../state/store.js';
import { pickLang } from '../i18n/index.js';
import { SOURCES } from '../content/sources.js';
import { ABOUT, BRAND, FOOTER, HERO, NAV, TOOLS, VIDEO } from './content.js';

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Split-chip button: a text chip and a separate square chip with an arrow / icon. */
function Chip({ href, onClick, icon = '→', iconFirst = false, variant = 'light', size, label, className = '', children, ...rest }) {
  const Tag = href ? 'a' : 'button';
  const parts = [
    <span key="m" className="chip-main">{children}</span>,
    <span key="i" className="chip-icon" aria-hidden="true">{icon}</span>,
  ];
  return (
    <Tag className={`chip chip-${variant}${size ? ` chip-${size}` : ''} ${className}`.trim()} href={href} onClick={onClick}
      type={href ? undefined : 'button'} aria-label={label} {...rest}>
      {iconFirst ? parts.reverse() : parts}
    </Tag>
  );
}

const BookIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" /><path d="M4 20.5V5.5M8 7.5h8M8 11h6" />
  </svg>
);

const Mark = () => (
  <svg className="l-mark" viewBox="0 0 32 32" width="26" height="26" fill="none" aria-hidden="true">
    <circle cx="16" cy="16" r="7.5" stroke="currentColor" strokeWidth="1.2" />
    <ellipse cx="16" cy="16" rx="14" ry="5" transform="rotate(-24 16 16)" stroke="#38BDF8" strokeWidth="1" />
    <circle cx="28.2" cy="10.6" r="1.6" fill="#38BDF8" />
  </svg>
);

function Header({ lang, setLang, pick }) {
  return (
    <header className="l-header">
      <div className="l-wrap l-header-row">
        <a className="l-brand" href="#/" aria-label={BRAND}>
          <Mark /><span className="l-brand-text">{BRAND}</span>
        </a>
        <nav className="l-nav" aria-label={lang === 'uk' ? 'Головне меню' : 'Main menu'}>
          {NAV.map((n) => (n.primary
            ? <Chip key={n.id} href={n.href} variant="ice" className={n.show ? '' : 'is-hidden'}>{pick(n.label)}</Chip>
            : <a key={n.id} className={`l-navlink${n.show ? '' : ' is-hidden'}`} href={n.href}>{pick(n.label)}</a>))}
        </nav>
        <div className="l-tools">
          {TOOLS.lang && (
            <div className="l-lang" role="group" aria-label={lang === 'uk' ? 'Мова' : 'Language'}>
              {[['uk', 'UA'], ['en', 'EN']].map(([code, txt]) => (
                <button key={code} type="button" className={lang === code ? 'on' : ''} aria-pressed={lang === code} onClick={() => setLang(code)}>{txt}</button>
              ))}
            </div>
          )}
          <a className={`l-navlink${TOOLS.auth.show ? '' : ' is-hidden'}`} href={TOOLS.auth.href}>{pick(TOOLS.auth.label)}</a>
        </div>
      </div>
    </header>
  );
}

function Hero({ lang, pick }) {
  const video = useRef(null);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    v.muted = true;
    // the button follows what the video really does (autoplay may start late or be blocked)
    const sync = () => setPaused(v.paused);
    v.addEventListener('play', sync);
    v.addEventListener('pause', sync);
    if (reducedMotion()) v.pause(); else v.play().catch(() => {});
    sync();
    return () => { v.removeEventListener('play', sync); v.removeEventListener('pause', sync); };
  }, []);
  const toggle = () => {
    const v = video.current;
    if (v.paused) v.play().catch(() => {}); else v.pause();
  };
  const more = () => document.getElementById('about')?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth' });
  const uk = lang === 'uk';
  return (
    <section className="l-hero">
      <video ref={video} className="l-video" poster={VIDEO.poster} autoPlay muted loop playsInline preload="auto" aria-hidden="true">
        <source src={VIDEO.src} type="video/mp4" />
      </video>
      <div className="l-veil" />
      <div className="l-hero-content">
        <p className="l-eyebrow">{HERO.eyebrow}</p>
        <h1>{HERO.title}</h1>
        <p className="l-sub">{pick(HERO.subtitle)}</p>
        <Chip href="#/earth" variant="light" size="lg">{pick(HERO.start)}</Chip>
      </div>
      <div className="l-more-row">
        <Chip onClick={more} variant="ghost" icon="↓" className="l-more">{pick(HERO.more)}</Chip>
      </div>
      <button type="button" className="l-pause" onClick={toggle} aria-label={paused ? (uk ? 'Увімкнути відео' : 'Play video') : (uk ? 'Зупинити відео' : 'Pause video')}>
        {paused ? '▶' : '❚❚'}
      </button>
      <a className="l-credit" href={VIDEO.page} target="_blank" rel="noreferrer">{uk ? 'Відео' : 'Video'}: {VIDEO.credit}</a>
    </section>
  );
}

function About({ pick }) {
  return (
    <section className="l-about" id="about">
      <div className="l-card">
        <h2>{pick(ABOUT.title)}</h2>
        <hr className="l-rule" />
        <p>{pick(ABOUT.text)}</p>
      </div>
    </section>
  );
}

function SourcesDialog({ open, onClose, pick }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className="l-dialog" onClose={onClose} onClick={(e) => { if (e.target === ref.current) onClose(); }}>
      <div className="l-dialog-head">
        <h3>{pick(FOOTER.sourcesTitle)}</h3>
        <button type="button" className="l-close" onClick={onClose} aria-label="Close">✕</button>
      </div>
      <ol className="l-sources">
        {SOURCES.map(([n, u, d]) => (
          <li key={n}><a href={u} target="_blank" rel="noreferrer">{n}</a><span>{pick(d)}</span></li>
        ))}
      </ol>
    </dialog>
  );
}

function Footer({ pick }) {
  const [open, setOpen] = useState(false);
  return (
    <footer className="l-footer">
      <div className="l-wrap">
        <div className="l-foot-grid">
          <div className="l-foot-about">
            <p className="l-foot-team">IT Detectives</p>
            <p className="l-foot-text">{pick(FOOTER.text)}</p>
            <Chip onClick={() => setOpen(true)} variant="ghost" icon={<BookIcon />} iconFirst aria-haspopup="dialog">{pick(FOOTER.sources)}</Chip>
          </div>
          <ul className="l-logos">
            {FOOTER.partners.map((p) => (
              <li key={p.id}>
                <a className={`l-logo tile-${p.tile}`} href={p.url} target="_blank" rel="noreferrer" title={p.name}>
                  <img src={p.logo} alt={p.name} loading="lazy" />
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="l-foot-bottom">
          <p>{pick(FOOTER.disclaimer)}</p>
          <p>© 2026 IT Detectives</p>
        </div>
      </div>
      <SourcesDialog open={open} onClose={() => setOpen(false)} pick={pick} />
    </footer>
  );
}

export default function Landing() {
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  const pick = (o) => pickLang(lang, o);
  return (
    <div className="landing">
      <Header lang={lang} setLang={setLang} pick={pick} />
      <main>
        <Hero lang={lang} pick={pick} />
        <About pick={pick} />
      </main>
      <Footer pick={pick} />
    </div>
  );
}
