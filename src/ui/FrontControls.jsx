import { useEffect, useRef, useState } from 'react';
import { useStore } from '../state/store.js';
import { useT } from '../i18n/index.js';
import { loadJSON } from '../lib/data.js';
import { flyTo } from '../lib/actions.js';
import { frontSource, frontTotal, isOfficial, UKRAINE_KM2 } from '../lib/front.js';

const month = (date, lang) => new Date(date + 'T00:00:00Z').toLocaleDateString(lang === 'uk' ? 'uk-UA' : 'en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });

/** Front line in Ukraine: on/off, month slider, animation, compare with another month. */
export default function FrontControls() {
  const { lang, pick } = useT();
  const front = useStore((s) => s.front);
  const setFront = useStore((s) => s.setFront);
  const [data, setData] = useState(null);
  const [playing, setPlaying] = useState(false);
  const timer = useRef(null);
  useEffect(() => { if (front.on && !data) loadJSON('front.json').then(setData); }, [front.on]);
  useEffect(() => {
    if (!playing || !data) return;
    timer.current = setInterval(() => {
      const cur = useStore.getState().front.idx ?? 0;
      const nx = cur >= data.snapshots.length - 1 ? 0 : cur + 1;
      setFront({ idx: nx });
    }, 700);
    return () => clearInterval(timer.current);
  }, [playing, data]);
  const uk = lang === 'uk';
  const snaps = data?.snapshots;
  const idx = snaps ? (front.idx ?? snaps.length - 1) : 0;
  const s = snaps?.[idx];
  const total = s ? frontTotal(s.area) : 0;
  const src = frontSource(data);
  const loc = uk ? 'uk-UA' : 'en-GB';
  return (
    <div className="active-layer">
      <label className="row">
        <input type="checkbox" checked={front.on} onChange={(e) => {
          setFront({ on: e.target.checked });
          if (e.target.checked) flyTo(33.5, 48.3, 0.5);
        }} />
        <b>{uk ? 'Лінія фронту та окуповані території' : 'Front line and occupied territories'}</b>
      </label>
      <p className="desc">{uk
        ? `Як змінювалася окупована територія України щомісяця${snaps ? ' з ' + month(snaps[0].date, lang) : ''}. Червона штриховка — окуповано, темно-червона — окуповано ще з 2014 року, сіра — бойові дії, зелена — звільнено.`
        : `How Ukraine’s occupied territory changed month by month${snaps ? ' since ' + month(snaps[0].date, lang) : ''}. Red hatching — occupied, dark red — occupied since 2014, grey — hostilities, green — liberated.`}</p>
      {front.on && snaps && (
        <>
          <div className="row">
            <input type="range" min="0" max={snaps.length - 1} value={idx} style={{ flex: 1 }}
              onChange={(e) => setFront({ idx: +e.target.value })} />
            <button onClick={() => setPlaying(!playing)}>{playing ? '■' : '▶'}</button>
          </div>
          <div className="small"><b>{month(s.date, lang)}</b> · {uk ? 'окуповано' : 'occupied'} ≈ {total.toLocaleString(loc)} {uk ? 'км²' : 'km²'} ({(100 * total / UKRAINE_KM2).toFixed(1)} % {uk ? 'території України' : 'of Ukraine'})
            {s.area.partial > 0 && <> {uk ? `+ ${s.area.partial.toLocaleString(loc)} км² громад, окупованих частково` : `+ ${s.area.partial.toLocaleString(loc)} km² of partly occupied communities`}</>}</div>
          <label className="row small">{uk ? 'Порівняти з' : 'Compare with'}
            <select value={front.compare ?? ''} onChange={(e) => setFront({ compare: e.target.value === '' ? null : +e.target.value })}>
              <option value="">—</option>
              {snaps.map((x, i) => <option key={x.date} value={i}>{month(x.date, lang)}</option>)}
            </select>
          </label>
          <p className="muted small">{uk ? 'Джерело' : 'Source'}: <a href={src.url} target="_blank" rel="noreferrer">{pick(src)}</a>. {isOfficial(data)
            ? (uk ? 'Точність — одна громада (у середньому ~300 км²): громада позначена, щойно вона є в переліку, навіть якщо фронт проходить через неї.' : 'Precision is one community (~300 km² on average): a community is marked as soon as it is on the list, even if the front runs through it.')
            : (uk ? 'Карта бойових дій приблизна.' : 'Battle maps are approximate.')}</p>
        </>
      )}
    </div>
  );
}
