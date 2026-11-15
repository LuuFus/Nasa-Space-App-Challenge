import { Component, useEffect, useRef, useState } from 'react';

// Visual effects of the start page. The WebGPU shaders (package `shaders`) are
// a bonus: without WebGPU, or with "reduced motion", the page shows the same
// content with plain HTML/CSS (video, gradients).

let gpuPromise = null;
/** true when the browser can really draw with WebGPU (not only has the API) */
export function useWebGPU() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    gpuPromise ??= (async () => {
      try { return !!(navigator.gpu && (await navigator.gpu.requestAdapter())); } catch { return false; }
    })();
    let alive = true;
    gpuPromise.then((v) => alive && setOk(v));
    return () => { alive = false; };
  }, []);
  return ok;
}

/** a failing shader must never take the page down */
export class ShaderBoundary extends Component {
  constructor(p) { super(p); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(e) { if (import.meta.env.DEV) console.warn('shader:', e); }
  render() { return this.state.failed ? this.props.fallback ?? null : this.props.children; }
}

/**
 * A soft ring that follows the mouse and grows over links and buttons.
 * Only for a real mouse (not touch) and without "reduced motion".
 */
export function CursorAura() {
  const ring = useRef(null);
  const dot = useRef(null);
  useEffect(() => {
    const fine = window.matchMedia?.('(pointer: fine)').matches;
    const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!fine || calm) return;
    let x = -100, y = -100, rx = -100, ry = -100, raf = 0, shown = false;
    const move = (e) => {
      x = e.clientX; y = e.clientY;
      if (!shown) { shown = true; rx = x; ry = y; document.documentElement.classList.add('aura-on'); }
      const hot = e.target.closest?.('a, button, [data-hot]');
      ring.current?.classList.toggle('hot', !!hot);
    };
    const leave = () => { shown = false; document.documentElement.classList.remove('aura-on'); };
    const down = () => ring.current?.classList.add('press');
    const up = () => ring.current?.classList.remove('press');
    const tick = () => {
      rx += (x - rx) * 0.18; ry += (y - ry) * 0.18;
      if (ring.current) ring.current.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      if (dot.current) dot.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerleave', leave);
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerleave', leave);
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
      document.documentElement.classList.remove('aura-on');
    };
  }, []);
  return (
    <>
      <div ref={ring} className="aura-ring" aria-hidden="true"><i /></div>
      <div ref={dot} className="aura-dot" aria-hidden="true"><i /></div>
    </>
  );
}

/** sections fade in once when they scroll into view */
export function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.landing [data-reveal]');
    if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('is-in')); return; }
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
}

/** the light on a card follows the mouse (CSS variables --mx / --my) */
export function trackLight(e) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
  e.currentTarget.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
}
