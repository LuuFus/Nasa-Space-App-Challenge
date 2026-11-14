import { EVENT_CATS } from '../content/events.js';

/** Small flags drawn as SVG (emoji flags show as letters on Windows). */
export function Flag({ code, size = 16 }) {
  const h = Math.round(size * 0.66);
  if (code === 'uk') {
    return (
      <svg width={size} height={h} viewBox="0 0 3 2" className="flag" aria-hidden="true">
        <rect width="3" height="1" fill="#0057b7" />
        <rect y="1" width="3" height="1" fill="#ffd700" />
      </svg>
    );
  }
  // simplified Union Jack
  return (
    <svg width={size} height={h} viewBox="0 0 60 40" className="flag" aria-hidden="true">
      <rect width="60" height="40" fill="#012169" />
      <path d="M0,0 60,40 M60,0 0,40" stroke="#fff" strokeWidth="8" />
      <path d="M0,0 60,40 M60,0 0,40" stroke="#c8102e" strokeWidth="3" />
      <path d="M30,0 v40 M0,20 h60" stroke="#fff" strokeWidth="12" />
      <path d="M30,0 v40 M0,20 h60" stroke="#c8102e" strokeWidth="7" />
    </svg>
  );
}

/** category icon; the war in Ukraine gets a blue-yellow badge instead of a warning sign */
export function CatIcon({ cat }) {
  if (cat === 'war') return <span className="ua-badge" aria-hidden="true" />;
  return <span aria-hidden="true">{EVENT_CATS[cat]?.icon}</span>;
}
