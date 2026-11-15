import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Pause, Play } from 'lucide-react';
import { useStore } from '../state/store.js';
import { useT } from '../i18n/index.js';
import { firstDate, fmtDate, lastDate, periodOf, snapDate, stepDate } from '../lib/dates.js';
import { waitForPictures } from '../lib/actions.js';
import { STROKE } from './Icons.jsx';

// Date of a layer: separate year / month / day lists (a typed date field was
// awkward to change), back / forward buttons and a player. The player moves on
// only when the picture of the current date has fully loaded, and then shows it
// for a moment — so every frame can really be seen.

const MONTHS = {
  uk: ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};
const SPEEDS = { slow: 3500, normal: 2000, fast: 1000 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pad = (n) => String(n).padStart(2, '0');
const daysIn = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/** one step of the player: a day, a month, or a year (the same month and day of the next year) */
function stepBy(layer, date, unit) {
  if (unit === 'day') return stepDate(layer, date, 1);
  const d = new Date(date + 'T00:00:00Z');
  if (unit === 'month') d.setUTCMonth(d.getUTCMonth() + 1); else d.setUTCFullYear(d.getUTCFullYear() + 1);
  const next = snapDate(layer, d.toISOString().slice(0, 10));
  return next > date ? next : date;
}

export default function LayerDate({ layer }) {
  const { lang } = useT();
  const uk = lang === 'uk';
  const date = useStore((s) => s.dates[layer.id]) ?? layer.date;
  const setDate = useStore((s) => s.setDate);
  const p = periodOf(layer);
  const daily = p === 'P1D' || p === 'P8D';
  const units = p === 'P1Y' ? ['year'] : daily ? ['day', 'month', 'year'] : ['month', 'year'];
  const [unit, setUnit] = useState('year');
  const [speed, setSpeed] = useState('normal');
  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [wanted, setWanted] = useState(null);   // the date that was asked for, when it had to be moved
  const first = firstDate(layer), last = lastDate(layer);
  const years = useMemo(() => {
    if (!first || !last) return [];
    const out = [];
    for (let y = +first.slice(0, 4); y <= +last.slice(0, 4); y++) out.push(y);
    return out.reverse();
  }, [first, last]);
  useEffect(() => { setPlaying(false); setWanted(null); if (!units.includes(unit)) setUnit(units[units.length - 1]); }, [layer.id]);

  // the player
  useEffect(() => {
    if (!playing) return;
    let alive = true;
    (async () => {
      while (alive) {
        setWaiting(true);
        await waitForPictures(12000);
        setWaiting(false);
        await sleep(SPEEDS[speed]);
        if (!alive) return;
        const cur = useStore.getState().dates[layer.id] ?? layer.date;
        const nx = stepBy(layer, cur, unit);
        if (nx === cur) { setPlaying(false); return; }
        setDate(layer.id, nx);
      }
    })();
    return () => { alive = false; setWaiting(false); };
  }, [playing, unit, speed, layer.id]);

  if (!p || !date) return null;
  const y = +date.slice(0, 4), m = +date.slice(5, 7), d = +date.slice(8, 10);
  const pickDate = (yy, mm, dd) => {
    const want = `${yy}-${pad(mm)}-${pad(Math.min(dd, daysIn(yy, mm)))}`;
    const got = snapDate(layer, want);
    setWanted(got !== want && p !== 'P1Y' && !(p === 'P1M' && got.slice(0, 7) === want.slice(0, 7)) ? want : null);
    setDate(layer.id, got);
  };
  const unitName = { day: uk ? 'день' : 'day', month: uk ? 'місяць' : 'month', year: uk ? 'рік' : 'year' };
  return (
    <div className="date-ctl">
      <div className="date-row">
        <button type="button" className="icon-btn" onClick={() => { setWanted(null); setDate(layer.id, stepDate(layer, date, -1)); }} title={uk ? 'Назад' : 'Back'} disabled={date <= first}>
          <ChevronLeft size={16} strokeWidth={STROKE} />
        </button>
        <select className="mono" value={y} aria-label={uk ? 'Рік' : 'Year'} onChange={(e) => pickDate(+e.target.value, m, d)}>
          {years.map((yy) => <option key={yy} value={yy}>{yy}</option>)}
        </select>
        {p !== 'P1Y' && (
          <select value={m} aria-label={uk ? 'Місяць' : 'Month'} onChange={(e) => pickDate(y, +e.target.value, d)}>
            {MONTHS[lang].map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
          </select>
        )}
        {daily && (
          <select className="mono date-day" value={d} aria-label={uk ? 'День' : 'Day'} onChange={(e) => pickDate(y, m, +e.target.value)}>
            {Array.from({ length: daysIn(y, m) }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
          </select>
        )}
        <button type="button" className="icon-btn" onClick={() => { setWanted(null); setDate(layer.id, stepDate(layer, date, 1)); }} title={uk ? 'Далі' : 'Next'} disabled={date >= last}>
          <ChevronRight size={16} strokeWidth={STROKE} />
        </button>
      </div>
      {wanted && (
        <p className="date-note">{uk
          ? `За ${fmtDate({ ...layer, ranges: ['2000-01-01/2000-01-01/P1D'] }, wanted, lang)} знімка немає — показано найближчий: ${fmtDate(layer, date, lang)}.`
          : `There is no picture for ${fmtDate({ ...layer, ranges: ['2000-01-01/2000-01-01/P1D'] }, wanted, lang)} — showing the nearest: ${fmtDate(layer, date, lang)}.`}</p>
      )}
      <div className="player">
        <button type="button" className={playing ? 'btn-play on' : 'btn-play'} onClick={() => setPlaying(!playing)}>
          {playing ? <Pause size={15} strokeWidth={STROKE} /> : <Play size={15} strokeWidth={STROKE} />}
          {playing ? (uk ? 'Зупинити' : 'Stop') : (uk ? 'Програти в часі' : 'Play through time')}
        </button>
        {units.length > 1 && (
          <label className="small">{uk ? 'крок' : 'step'}
            <select value={unit} onChange={(e) => setUnit(e.target.value)}>{units.map((u) => <option key={u} value={u}>{unitName[u]}</option>)}</select>
          </label>
        )}
        <label className="small">{uk ? 'швидкість' : 'speed'}
          <select value={speed} onChange={(e) => setSpeed(e.target.value)}>
            <option value="slow">{uk ? 'повільно' : 'slow'}</option>
            <option value="normal">{uk ? 'звичайно' : 'normal'}</option>
            <option value="fast">{uk ? 'швидко' : 'fast'}</option>
          </select>
        </label>
      </div>
      <div className="muted small">
        <b className="date-now">{fmtDate(layer, date, lang)}</b>
        {playing && waiting && <span className="date-wait"><Loader2 size={12} className="spin" /> {uk ? 'чекаю, поки знімок завантажиться' : 'waiting for the picture to load'}</span>}
        {' · '}{uk ? 'дані є за' : 'data for'} <span className="mono">{first?.slice(0, 4)}–{last?.slice(0, 4)}</span>
        {playing && <> · {uk ? `крок — ${unitName[unit]}` : `step: ${unitName[unit]}`}</>}
      </div>
    </div>
  );
}
