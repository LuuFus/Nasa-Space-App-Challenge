import {
  BookOpen, NotebookPen, Cloud, Droplets, Flame, GitCompareArrows, Globe, Info, Layers, LineChart, Radar, Shield,
  Snowflake, SplitSquareHorizontal, Sparkles, Sun, Thermometer, Tornado, Trees, Waves, Wind,
} from 'lucide-react';
import { EVENT_CATS } from '../content/events.js';

// One set of thin vector icons for the whole app (lucide, ISC licence).
export const STROKE = 1.75;

/** side rail */
export const TAB_ICONS = {
  layers: Layers, compare: GitCompareArrows, planet: Globe, swipe: SplitSquareHorizontal,
  events: Radar, notes: NotebookPen, glossary: BookOpen, about: Info,
};

/** data-layer categories in the Layers tab */
export const DATA_ICONS = {
  temperature: Thermometer, vegetation: Trees, water: Droplets, fire: Flame,
  lights: Sparkles, air: Wind, ozone: Sun, climate: LineChart,
};

/** event categories (badges, filters, map markers) */
export const EVENT_ICONS = {
  war: Shield, water: Droplets, fire: Flame, ice: Snowflake, air: Cloud,
  land: Trees, heat: Thermometer, storm: Tornado, quake: Waves,
};

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

/** round category icon; the war in Ukraine is blue and yellow */
export function CatIcon({ cat, size = 13 }) {
  const I = EVENT_ICONS[cat] || Radar;
  return <span className={`cat-icon cat-${cat}`} aria-hidden="true"><I size={size} strokeWidth={STROKE} /></span>;
}

/** category badge: icon + name */
export function CatBadge({ cat, pick }) {
  return <span className={`cat-badge cat-${cat}`}><CatIcon cat={cat} size={12} />{pick(EVENT_CATS[cat]?.title)}</span>;
}

/** custom on/off switch (a real button with role="switch") */
export function Switch({ checked, onChange, label, disabled }) {
  return (
    <button type="button" role="switch" aria-checked={!!checked} aria-label={label} disabled={disabled}
      className={checked ? 'switch on' : 'switch'} onClick={(e) => { e.stopPropagation(); onChange(!checked); }}>
      <span className="knob" />
    </button>
  );
}
