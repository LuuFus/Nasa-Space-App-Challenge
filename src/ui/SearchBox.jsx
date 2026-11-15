import { useEffect, useMemo, useRef, useState } from 'react';
import { Building2, Flag as FlagIcon, Radar, Search, X } from 'lucide-react';
import { useStore } from '../state/store.js';
import { useT } from '../i18n/index.js';
import { loadCountries, loadJSON } from '../lib/data.js';
import { flyToBox, flyTo } from '../lib/actions.js';
import { EVENTS } from '../content/events.js';
import { getEngine } from '../engine/instance.js';
import { STROKE } from './Icons.jsx';

// Search at the top: countries, capitals and events, in Ukrainian or English.
// Ctrl+K (or "/") puts the cursor into the field.

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’'ʼ`]/g, '');

export default function SearchBox() {
  const { lang, pick } = useT();
  const uk = lang === 'uk';
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(0);
  const [items, setItems] = useState([]);
  const input = useRef(null);
  useEffect(() => {
    // everything that can be found, built once
    Promise.all([loadCountries(), loadJSON('geo/capitals.json')]).then(([cs, caps]) => {
      const byId = cs.byId;
      setItems([
        ...cs.list.filter((c) => c.name?.en).map((c) => ({ kind: 'country', id: c.id, name: c.name, bbox: c.bbox, label: c.label, key: 'c' + c.id })),
        ...caps.filter((c) => !c.alt).map((c) => ({ kind: 'city', id: c.country, name: c.name, lon: c.lon, lat: c.lat, of: byId.get(c.country)?.name, key: 'k' + c.name.en + c.country })),
        ...EVENTS.map((e) => ({ kind: 'event', id: e.id, name: e.title, lon: e.lon, lat: e.lat, key: 'e' + e.id })),
      ]);
    });
  }, []);
  useEffect(() => {
    const key = (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName);
      if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !typing)) { e.preventDefault(); input.current?.focus(); setOpen(true); }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);
  const found = useMemo(() => {
    const s = norm(q.trim());
    if (!s) return [];
    const scored = [];
    for (const it of items) {
      const a = norm(it.name.uk || ''), b = norm(it.name.en || '');
      const score = a.startsWith(s) || b.startsWith(s) ? 0 : a.includes(` ${s}`) || b.includes(` ${s}`) ? 1 : a.includes(s) || b.includes(s) ? 2 : 9;
      if (score < 9) scored.push([score + (it.kind === 'country' ? 0 : it.kind === 'city' ? 0.3 : 0.6), it]);
    }
    return scored.sort((x, y) => x[0] - y[0]).slice(0, 8).map((x) => x[1]);
  }, [q, items]);
  useEffect(() => setSel(0), [q]);

  const go = (it) => {
    const st = useStore.getState();
    if (it.kind === 'country') {
      flyToBox(it.bbox, it.label);
      st.setSel('a', it.id);
      // the country lights up for a few seconds
      const v = getEngine()?.vectors;
      v?.setHover(it.id);
      setTimeout(() => v?.setHover(null), 3500);
    } else if (it.kind === 'city') {
      flyTo(it.lon, it.lat, 0.06);
    } else {
      st.setEvent(it.id);
      st.setPanel('events');
      flyTo(it.lon, it.lat, 0.4);
    }
    setQ('');
    setOpen(false);
    input.current?.blur();
  };
  const ICON = { country: FlagIcon, city: Building2, event: Radar };
  const KIND = { country: uk ? 'країна' : 'country', city: uk ? 'столиця' : 'capital', event: uk ? 'подія' : 'event' };
  return (
    <div className={open && q ? 'search open' : 'search'} role="search">
      <Search size={15} strokeWidth={STROKE} className="search-icon" />
      <input ref={input} value={q} placeholder={uk ? 'Пошук країни, столиці, події…' : 'Find a country, capital, event…'}
        aria-label={uk ? 'Пошук' : 'Search'} aria-expanded={open && found.length > 0} aria-controls="search-list" role="combobox"
        onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setSel((i) => Math.min(found.length - 1, i + 1)); }
          if (e.key === 'ArrowUp') { e.preventDefault(); setSel((i) => Math.max(0, i - 1)); }
          if (e.key === 'Enter' && found[sel]) go(found[sel]);
          if (e.key === 'Escape') { setQ(''); input.current?.blur(); }
        }} />
      {q ? <button type="button" className="search-clear" onClick={() => setQ('')} aria-label={uk ? 'Очистити' : 'Clear'}><X size={14} strokeWidth={STROKE} /></button>
        : <kbd className="search-kbd">Ctrl K</kbd>}
      {open && q && (
        <ul className="search-list glass" id="search-list" role="listbox">
          {found.length === 0 && <li className="search-empty">{uk ? 'Нічого не знайдено' : 'Nothing found'}</li>}
          {found.map((it, i) => {
            const I = ICON[it.kind];
            return (
              <li key={it.key} role="option" aria-selected={i === sel} className={i === sel ? 'on' : ''}
                onMouseEnter={() => setSel(i)} onMouseDown={(e) => { e.preventDefault(); go(it); }}>
                <I size={15} strokeWidth={STROKE} />
                <span className="search-name">{pick(it.name)}{it.of && <small> · {pick(it.of)}</small>}</span>
                <span className="search-kind">{KIND[it.kind]}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
