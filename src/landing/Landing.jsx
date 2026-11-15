import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import '@fontsource/cormorant-garamond/300.css';
import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/300-italic.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import './landing.css';
import { useStore } from '../state/store.js';
import { pickLang } from '../i18n/index.js';
import { SOURCE_GROUPS } from '../content/sources.js';
import { ABOUT, BRAND, CTA, FEATURES, FOOTER, HERO, NAV, PHOTOS, SECTIONS, STATS, STEPS, TOOLS, VIDEO } from './content.js';
import { CursorAura, ShaderBoundary, trackLight, useReveal, useWebGPU } from './effects.jsx';
import { LIcon } from './icons.jsx';
import RoadmapDialog from '../ui/Roadmap.jsx';

// WebGPU effects live in their own chunk: browsers without WebGPU never load it
const HeroShader = lazy(() => import('./shaders.jsx').then((m) => ({ default: m.HeroShader })));
const CtaShader = lazy(() => import('./shaders.jsx').then((m) => ({ default: m.CtaShader })));

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const scrollToId = (id) => document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth' });

/** Split-chip button: a text chip and a separate square chip with an arrow / icon. */
function Chip({ href, onClick, icon = '→', iconFirst = false, variant = 'light', size, label, magnetic = false, className = '', children, ...rest }) {
  const Tag = href ? 'a' : 'button';
  const parts = [
    <span key="m" className="chip-main">{children}</span>,
    <span key="i" className="chip-icon" aria-hidden="true">{icon}</span>,
  ];
  // the button leans a little towards the mouse
  const move = magnetic ? (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--tx', `${((e.clientX - r.left) / r.width - 0.5) * 10}px`);
    e.currentTarget.style.setProperty('--ty', `${((e.clientY - r.top) / r.height - 0.5) * 8}px`);
  } : undefined;
  const leave = magnetic ? (e) => { e.currentTarget.style.setProperty('--tx', '0px'); e.currentTarget.style.setProperty('--ty', '0px'); } : undefined;
  return (
    <Tag className={`chip chip-${variant}${size ? ` chip-${size}` : ''}${magnetic ? ' chip-magnetic' : ''} ${className}`.trim()} href={href} onClick={onClick}
      type={href ? undefined : 'button'} aria-label={label} onPointerMove={move} onPointerLeave={leave} {...rest}>
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
    <ellipse className="l-mark-orbit" cx="16" cy="16" rx="14" ry="5" transform="rotate(-24 16 16)" stroke="#38BDF8" strokeWidth="1" />
    <circle className="l-mark-sat" cx="28.2" cy="10.6" r="1.6" fill="#38BDF8" />
  </svg>
);

function Header({ lang, setLang, pick, openDialog }) {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 40);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <header className={solid ? 'l-header solid' : 'l-header'}>
      <div className="l-wrap l-header-row">
        <a className="l-brand" href="#/" aria-label={BRAND} onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' }); }}>
          <Mark /><span className="l-brand-text">{BRAND}</span>
        </a>
        <nav className="l-nav" aria-label={lang === 'uk' ? 'Головне меню' : 'Main menu'}>
          {NAV.map((n) => (n.primary
            ? <Chip key={n.id} href={n.href} variant="ice" className={n.show ? '' : 'is-hidden'}>{pick(n.label)}</Chip>
            : <a key={n.id} className={`l-navlink${n.show ? '' : ' is-hidden'}`} href={n.href}
              onClick={n.scroll ? (e) => { e.preventDefault(); scrollToId(n.href.slice(1)); } : n.dialog ? (e) => { e.preventDefault(); openDialog(n.dialog); } : undefined}>{pick(n.label)}</a>))}
        </nav>
        <div className="l-tools">
          {TOOLS.lang && (
            <div className="l-lang" role="group" aria-label={lang === 'uk' ? 'Мова' : 'Language'}>
              {[['en', 'EN'], ['uk', 'UA']].map(([code, txt]) => (
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
  const gpu = useWebGPU();
  const [shaderOn, setShaderOn] = useState(false);
  useEffect(() => { if (gpu && !paused) setShaderOn(true); }, [gpu]);
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    v.muted = true;
    if (reducedMotion()) { v.pause(); setPaused(true); } else v.play().catch(() => {});
  }, []);
  // while the WebGPU picture runs, the plain video underneath rests (one decoder is enough)
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (shaderOn && !paused) { const t = setTimeout(() => v.pause(), 2500); return () => clearTimeout(t); }
    if (!paused) v.play().catch(() => {});
  }, [shaderOn, paused]);
  const toggle = () => {
    const next = !paused;
    setPaused(next);
    if (next) { setShaderOn(false); video.current?.pause(); } else { if (gpu) setShaderOn(true); video.current?.play().catch(() => {}); }
  };
  const uk = lang === 'uk';
  return (
    <section className="l-hero">
      <video ref={video} className="l-video" poster={VIDEO.poster} autoPlay muted loop playsInline preload="auto" aria-hidden="true">
        <source src={VIDEO.webm} type="video/webm" />
        <source src={VIDEO.src} type="video/mp4" />
      </video>
      {shaderOn && (
        <ShaderBoundary fallback={null}>
          <Suspense fallback={null}><div className="l-shader-wrap"><HeroShader url={VIDEO.webm} /></div></Suspense>
        </ShaderBoundary>
      )}
      <div className="l-veil" />
      <div className="l-hero-content">
        <p className="l-eyebrow">{HERO.eyebrow}</p>
        <h1>{HERO.title}</h1>
        <p className="l-sub">{pick(HERO.subtitle)}</p>
        <Chip href="#/earth" variant="light" size="lg" magnetic>{pick(HERO.start)}</Chip>
      </div>
      <div className="l-more-row">
        <Chip onClick={() => scrollToId('about')} variant="ghost" icon="↓" className="l-more">{pick(HERO.more)}</Chip>
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
      <div className="l-card" data-reveal>
        <p className="l-kicker">{pick(ABOUT.kicker)}</p>
        <h2>{pick(ABOUT.title)}</h2>
        <hr className="l-rule" />
        <p className="l-lead">{pick(ABOUT.lead)}</p>
        <div className="l-pillars">
          {ABOUT.pillars.map((p, i) => (
            <article key={p.icon} className="l-pillar" data-reveal style={{ '--d': `${i * 90}ms` }} onPointerMove={trackLight}>
              <span className="l-pillar-icon"><LIcon name={p.icon} /></span>
              <h3>{pick(p.title)}</h3>
              <p>{pick(p.text)}</p>
            </article>
          ))}
        </div>
        <dl className="l-stats">
          {STATS.map((s) => (
            <div key={s.value}><dt className="l-stat-num">{s.value}</dt><dd>{pick(s.label)}</dd></div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function Features({ pick, lang }) {
  return (
    <section className="l-features" id="features">
      <div className="l-wrap">
        <header className="l-sec-head" data-reveal>
          <p className="l-kicker">{pick(SECTIONS.features.kicker)}</p>
          <h2>{pick(SECTIONS.features.title)}</h2>
        </header>
        <div className="l-feature-list">
          {FEATURES.map((f, i) => (
            <article key={f.id} className={i % 2 ? 'l-feature flip' : 'l-feature'} data-reveal>
              <figure className="l-shot">
                <span className="l-shot-bar" aria-hidden="true"><i /><i /><i /></span>
                <img src={pick(f.shot)} alt={pick(f.title)} loading="lazy" width="1280" height="768" />
              </figure>
              <div className="l-feature-text">
                <span className="l-feature-num mono">{String(i + 1).padStart(2, '0')}</span>
                <h3>{pick(f.title)}</h3>
                <p>{pick(f.text)}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Steps({ pick }) {
  return (
    <section className="l-steps">
      <div className="l-wrap">
        <header className="l-sec-head" data-reveal>
          <p className="l-kicker">{pick(SECTIONS.steps.kicker)}</p>
          <h2>{pick(SECTIONS.steps.title)}</h2>
        </header>
        <ol className="l-step-list">
          {STEPS.map((s, i) => (
            <li key={s.icon} className="l-step" data-reveal style={{ '--d': `${i * 110}ms` }}>
              <span className="l-step-icon"><LIcon name={s.icon} size={30} /></span>
              <h3><span className="mono">{i + 1}.</span> {pick(s.title)}</h3>
              <p>{pick(s.text)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Photos({ pick }) {
  return (
    <section className="l-photos">
      <div className="l-wrap">
        <header className="l-sec-head" data-reveal>
          <p className="l-kicker">{pick(SECTIONS.photos.kicker)}</p>
          <h2>{pick(SECTIONS.photos.title)}</h2>
        </header>
        <div className="l-photo-grid">
          {PHOTOS.map((p, i) => (
            <figure key={p.id} className="l-photo" data-reveal style={{ '--d': `${i * 90}ms` }} onPointerMove={trackLight}>
              <div className="l-photo-img">
                <img src={p.src} alt={pick(p.title)} loading="lazy" width="1100" height="1100" />
                <span className="l-photo-year">{p.year}</span>
              </div>
              <figcaption>
                <b>{pick(p.title)}</b>
                <span>{pick(p.text)}</span>
                {p.action && <a className="l-photo-action" href={p.action.href}>{pick(p.action.label)} →</a>}
                <a href={p.url} target="_blank" rel="noreferrer">{p.credit} ↗</a>
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="l-photo-note">{pick(SECTIONS.photos.note)}</p>
      </div>
    </section>
  );
}

function Cta({ pick }) {
  const gpu = useWebGPU();
  const ref = useRef(null);
  const [near, setNear] = useState(false);
  // the aurora starts only when the section comes close to the screen
  useEffect(() => {
    if (!gpu || !ref.current || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setNear(true); io.disconnect(); } }, { rootMargin: '300px' });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [gpu]);
  return (
    <section className="l-cta" ref={ref}>
      {near && (
        <ShaderBoundary fallback={null}>
          <Suspense fallback={null}><div className="l-shader-wrap"><CtaShader /></div></Suspense>
        </ShaderBoundary>
      )}
      <div className="l-cta-inner" data-reveal>
        <h2>{pick(CTA.title)}</h2>
        <p>{pick(CTA.text)}</p>
        <Chip href="#/earth" variant="light" size="lg" magnetic>{pick(CTA.start)}</Chip>
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
      <p className="l-sources-lead">{pick(FOOTER.sourcesLead)}</p>
      <div className="l-sources-all">
        {SOURCE_GROUPS.map((g) => (
          <section key={g.id} className="l-sources-group">
            <h4>{pick(g.title)}</h4>
            <ol className="l-sources">
              {g.items.map(([n, u, d]) => (
                <li key={n}>{u ? <a href={u} target="_blank" rel="noreferrer">{n}</a> : <b>{n}</b>}<span>{pick(d)}</span></li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </dialog>
  );
}

function Footer({ pick, openDialog }) {
  return (
    <footer className="l-footer">
      <div className="l-wrap">
        <div className="l-foot-grid">
          <div className="l-foot-about">
            <p className="l-foot-team">IT Detectives</p>
            <p className="l-foot-text">{pick(FOOTER.text)}</p>
            <div className="l-foot-btns">
              <Chip onClick={() => openDialog('sources')} variant="ghost" icon={<BookIcon />} iconFirst aria-haspopup="dialog">{pick(FOOTER.sources)}</Chip>
              <Chip onClick={() => openDialog('roadmap')} variant="ghost" icon="↗" aria-haspopup="dialog">{pick(FOOTER.roadmap)}</Chip>
            </div>
            <p className="l-foot-ai">{pick(FOOTER.ai)}</p>
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
    </footer>
  );
}

export default function Landing() {
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  const pick = (o) => pickLang(lang, o);
  // 'sources' | 'roadmap' | null; #sources in the address opens the sources list
  const [dialog, setDialog] = useState(() => (window.location.hash === '#sources' ? 'sources' : null));
  useReveal();
  return (
    <div className="landing">
      <CursorAura />
      <Header lang={lang} setLang={setLang} pick={pick} openDialog={setDialog} />
      <main>
        <Hero lang={lang} pick={pick} />
        <About pick={pick} />
        <Features pick={pick} lang={lang} />
        <Steps pick={pick} />
        <Photos pick={pick} />
        <Cta pick={pick} />
      </main>
      <Footer pick={pick} openDialog={setDialog} />
      <SourcesDialog open={dialog === 'sources'} onClose={() => setDialog(null)} pick={pick} />
      <RoadmapDialog open={dialog === 'roadmap'} onClose={() => setDialog(null)} lang={lang} />
    </div>
  );
}
