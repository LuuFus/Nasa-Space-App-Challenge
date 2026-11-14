import { useEffect, useState } from 'react';
import { useStore } from '../state/store.js';
import { useT } from '../i18n/index.js';
import { loadJSON } from '../lib/data.js';

const DIRS = {
  uk: ['північ', 'північний схід', 'схід', 'південний схід', 'південь', 'південний захід', 'захід', 'північний захід'],
  en: ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'],
};
const dir = (b, lang) => DIRS[lang][Math.round(b / 45) % 8];
const addDays = (iso, n) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d; };
const fmt = (d, lang) => d.toLocaleDateString(lang === 'uk' ? 'uk-UA' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/** Day-by-day player for fire events: date, counters, play button, daily chart, plain summary. */
export default function FireTimeline() {
  const fire = useStore((s) => s.fire);
  const setFire = useStore((s) => s.setFire);
  const { lang } = useT();
  const uk = lang === 'uk';
  const [d, setD] = useState(null);
  useEffect(() => { if (fire?.id) loadJSON(`fires/${fire.id}.json`).then(setD); else setD(null); }, [fire?.id]);
  useEffect(() => {
    if (!fire?.playing || !d) return;
    const ms = d.days > 90 ? 160 : d.days > 40 ? 260 : 420;
    const t = setInterval(() => {
      const cur = useStore.getState().fire;
      if (!cur) return;
      const next = cur.day + 1;
      if (next >= d.days) setFire({ ...cur, day: d.days - 1, playing: false });
      else setFire({ ...cur, day: next });
    }, ms);
    return () => clearInterval(t);
  }, [fire?.playing, d]);
  if (!fire || !d) return null;
  const day = Math.min(fire.day, d.days - 1);
  const total = d.daily.slice(0, day + 1).reduce((a, b) => a + b, 0);
  const max = Math.max(...d.daily, 1);
  const sm = d.summary || {};
  const W = 300, H = 46;
  return (
    <div className="fire-timeline">
      <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
        <b>🔥 {fmt(addDays(d.start, day), lang)}</b>
        <span className="small">{uk ? 'сьогодні' : 'today'}: <b>{d.daily[day]}</b> · {uk ? 'усього' : 'total'}: <b>{total}</b></span>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="fire-chart" preserveAspectRatio="none"
        onPointerDown={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setFire({ ...fire, day: Math.round(((e.clientX - r.left) / r.width) * (d.days - 1)), playing: false });
        }}>
        {d.daily.map((c, i) => (
          <rect key={i} x={(i / d.days) * W} y={H - (c / max) * (H - 4)} width={Math.max(1, W / d.days - 0.5)} height={(c / max) * (H - 4)}
            fill={i === day ? '#fff3a0' : i < day ? '#ff7a1a' : '#5a3a2a'} />
        ))}
        <line x1={(day / d.days) * W} x2={(day / d.days) * W} y1="0" y2={H} stroke="#fff" strokeWidth="1" />
      </svg>
      <div className="row">
        <button onClick={() => setFire({ ...fire, playing: !fire.playing, day: fire.day >= d.days - 1 ? 0 : fire.day })}>{fire.playing ? '⏸' : '▶'}</button>
        <input type="range" min="0" max={d.days - 1} value={day} style={{ flex: 1 }} onChange={(e) => setFire({ ...fire, day: +e.target.value, playing: false })} />
      </div>
      {sm.total > 0 && (
        <p className="small">{uk
          ? `Супутник ${d.sensor} помітив ${sm.total} осередків. Перші — ${fmt(addDays(d.start, sm.firstDay), lang)}, найбільше (${sm.peakCount} за добу) — ${fmt(addDays(d.start, sm.peakDay), lang)}, останні — ${fmt(addDays(d.start, sm.lastDay), lang)}. Центр вогню (біла лінія) змістився на ~${sm.shiftKm} км на ${dir(sm.bearing, lang)}. Жовті точки — горить сьогодні, помаранчеві — останні дні, темно-червоні — вже вигоріло.`
          : `The ${d.sensor} satellite detected ${sm.total} fire spots. First on ${fmt(addDays(d.start, sm.firstDay), lang)}, most (${sm.peakCount} in a day) on ${fmt(addDays(d.start, sm.peakDay), lang)}, last on ${fmt(addDays(d.start, sm.lastDay), lang)}. The centre of the fire (white line) moved ~${sm.shiftKm} km to the ${dir(sm.bearing, lang)}. Yellow dots burn today, orange — the last days, dark red — already burnt.`}</p>
      )}
      <div className="muted small">{d.source}</div>
    </div>
  );
}
