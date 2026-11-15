import { useEffect, useMemo, useState } from 'react';
import { Cloud, CloudLightning, CloudRain, CloudSun, Droplets, Factory, Gauge, Loader2, Pause, Play, Sparkles, Sun, Thermometer, Tornado, Wind, X } from 'lucide-react';
import { useStore } from '../state/store.js';
import { useT } from '../i18n/index.js';
import { STROKE } from '../ui/Icons.jsx';
import Chart from '../ui/Chart.jsx';
import { paletteCss, WX_LAYERS, wxLayer } from './weather/layers.js';
import { loadSpot, nowIndex } from './weather/data.js';

const ICONS = { Wind, Tornado, Thermometer, CloudRain, Cloud, Droplets, Gauge, CloudLightning, Factory, Sun };
const GROUPS = [
  { title: { uk: 'Погода', en: 'Weather' }, ids: ['wind', 'gust', 'temp', 'rain', 'clouds', 'humidity', 'pressure', 'cape'] },
  { title: { uk: 'Повітря', en: 'Air' }, ids: ['pm25', 'dust'] },
];
const COMPASS = { uk: ['Пн', 'ПнСх', 'Сх', 'ПдСх', 'Пд', 'ПдЗх', 'Зх', 'ПнЗх'], en: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] };
const compass = (deg, lang) => COMPASS[lang][Math.round(((deg % 360) + 360) % 360 / 45) % 8];
const loc = (lang) => (lang === 'uk' ? 'uk-UA' : 'en-GB');

/** Everything of the windy.com-style forecast that sits over the map. */
export default function WeatherUI({ fc, tIdx, state, retry }) {
  const wx = useStore((s) => s.wx);
  const spot = useStore((s) => s.spot);
  const L = wxLayer(wx.layer);
  return (
    <>
      <WxRail />
      {L && <Timeline fc={fc} tIdx={tIdx} L={L} state={state} retry={retry} />}
      {L && spot && <SpotCard spot={spot} />}
    </>
  );
}

function WxRail() {
  const { pick, lang } = useT();
  const wx = useStore((s) => s.wx);
  const setWx = useStore((s) => s.setWx);
  const setSpot = useStore((s) => s.setSpot);
  const uk = lang === 'uk';
  const [open, setOpen] = useState(true);
  return (
    <nav className={open ? 'wx-rail glass open' : 'wx-rail glass'} aria-label={uk ? 'Шари прогнозу погоди' : 'Weather forecast layers'}>
      <button type="button" className="wx-head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <CloudSun size={18} strokeWidth={STROKE} />
        <span>{uk ? 'Прогноз погоди' : 'Weather forecast'}</span>
      </button>
      {open && GROUPS.map((g) => (
        <div key={g.title.en} className="wx-group">
          <div className="wx-gtitle">{pick(g.title)}</div>
          {g.ids.map((id) => {
            const l = wxLayer(id);
            const I = ICONS[l.icon];
            const on = wx.layer === id;
            return (
              <button key={id} type="button" className={on ? 'wx-btn on' : 'wx-btn'} aria-pressed={on} title={pick(l.desc)}
                onClick={() => { setWx({ layer: on ? null : id, playing: false }); if (on) setSpot(null); }}>
                <I size={16} strokeWidth={STROKE} /><span>{pick(l.title)}</span>
              </button>
            );
          })}
        </div>
      ))}
      {open && wx.layer && (
        <button type="button" className={wx.particles ? 'wx-btn wx-anim on' : 'wx-btn wx-anim'} aria-pressed={wx.particles} onClick={() => setWx({ particles: !wx.particles })}>
          <Sparkles size={16} strokeWidth={STROKE} /><span>{uk ? 'Рух вітру' : 'Wind flow'}</span>
        </button>
      )}
    </nav>
  );
}

function Timeline({ fc, tIdx, L, state, retry }) {
  const { pick, lang } = useT();
  const wx = useStore((s) => s.wx);
  const setWx = useStore((s) => s.setWx);
  const uk = lang === 'uk';
  const lo = L.stops[0][0], hi = L.stops[L.stops.length - 1][0];
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => +(lo + (hi - lo) * f).toFixed(L.digits > 0 && hi - lo < 10 ? 1 : 0));
  const days = useMemo(() => {
    if (!fc) return [];
    const out = [];
    fc.times.forEach((t, i) => {
      const key = new Date(t).toLocaleDateString(loc(lang), { weekday: 'short', day: 'numeric' });
      if (!out.length || out[out.length - 1].key !== key) out.push({ key, from: i, n: 0 });
      out[out.length - 1].n++;
    });
    return out;
  }, [fc, lang]);
  const now = fc ? nowIndex(fc.times) : 0;
  const when = fc ? new Date(fc.times[tIdx]).toLocaleString(loc(lang), { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : '';
  return (
    <div className="wx-time glass">
      <div className="wx-legend">
        <span className="wx-ltitle">{pick(L.title)}, {pick(L.units)}</span>
        <div className="wx-bar" style={{ background: paletteCss(L.stops) }} />
        <div className="wx-ticks mono">{ticks.map((v) => <span key={v}>{v}</span>)}</div>
      </div>
      <p className="wx-desc">{pick(L.desc)}</p>
      {state.wait > 0 && (
        <p className="wx-note"><Loader2 size={14} className="spin" /> {uk
          ? `Безкоштовний сервіс прогнозу дає обмежену кількість запитів на хвилину. Решту карти домалюю через ${state.wait} с.`
          : `The free forecast service allows a limited number of requests per minute. The rest of the map comes in ${state.wait} s.`}</p>
      )}
      {state.error && !fc ? (
        <p className="wx-note">{uk ? 'Не вдалося завантажити прогноз' : 'Could not load the forecast'}: {state.error}. <button type="button" className="link" onClick={retry}>{uk ? 'Спробувати ще' : 'Try again'}</button></p>
      ) : !fc ? (
        <p className="wx-note"><Loader2 size={14} className="spin" /> {uk ? 'Завантажую прогноз…' : 'Loading the forecast…'}</p>
      ) : (
        <>
          <div className="wx-row">
            <button type="button" className={wx.playing ? 'icon-btn on' : 'icon-btn'} onClick={() => setWx({ playing: !wx.playing })}
              title={wx.playing ? (uk ? 'Зупинити' : 'Pause') : (uk ? 'Прогнати прогноз у часі' : 'Play the forecast')}>
              {wx.playing ? <Pause size={15} strokeWidth={STROKE} /> : <Play size={15} strokeWidth={STROKE} />}
            </button>
            <div className="wx-track">
              <input type="range" min="0" max={fc.times.length - 1} value={tIdx} aria-label={uk ? 'Час прогнозу' : 'Forecast time'}
                onChange={(e) => setWx({ t: +e.target.value, playing: false })} />
              <div className="wx-days">
                {days.map((d) => <span key={d.key} style={{ flex: d.n }}>{d.key}</span>)}
              </div>
              <i className="wx-now" style={{ left: `${(now / (fc.times.length - 1)) * 100}%` }} title={uk ? 'Зараз' : 'Now'} />
            </div>
          </div>
          <div className="wx-when">
            <b>{when}</b>
            {state.loading && <Loader2 size={13} className="spin" />}
            <span className="muted">{tIdx === now ? (uk ? ' · зараз' : ' · now') : tIdx < now ? (uk ? ' · минуле' : ' · past') : (uk ? ' · прогноз' : ' · forecast')}</span>
          </div>
        </>
      )}
      <p className="wx-credit">{uk ? 'Прогноз' : 'Forecast'}: <a href="https://open-meteo.com" target="_blank" rel="noreferrer">Open-Meteo</a> (CC BY 4.0){L.api === 'air' ? ' · CAMS / Copernicus' : ''}. {uk ? 'Клікни на карту — прогноз у точці.' : 'Click the map for a point forecast.'}</p>
    </div>
  );
}

function SpotCard({ spot }) {
  const { lang } = useT();
  const setSpot = useStore((s) => s.setSpot);
  const [data, setData] = useState(null);
  const [place, setPlace] = useState(null);
  const [err, setErr] = useState(null);
  const uk = lang === 'uk';
  useEffect(() => {
    let dead = false;
    setData(null); setErr(null); setPlace(null);
    loadSpot(spot.lon, spot.lat).then((d) => !dead && setData(d)).catch((e) => !dead && setErr(e.message));
    // place name from OpenStreetMap (Nominatim): one request per click, as its usage policy asks
    fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&lat=${spot.lat.toFixed(4)}&lon=${spot.lon.toFixed(4)}&accept-language=${lang}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        if (dead || !p?.address) return;
        const a = p.address;
        setPlace([a.city || a.town || a.village || a.municipality || a.county || a.state, a.country].filter(Boolean).join(', '));
      }).catch(() => {});
    return () => { dead = true; };
  }, [spot.lon, spot.lat, lang]);
  const option = useMemo(() => {
    if (!data) return null;
    const h = data.hourly;
    const x = h.time;
    const fmtT = (v) => new Date(v).toLocaleString(loc(lang), { weekday: 'short', hour: '2-digit' });
    return {
      backgroundColor: 'transparent', animation: false,
      grid: { left: 34, right: 34, top: 18, bottom: 22 },
      tooltip: { trigger: 'axis', valueFormatter: (v) => (v == null ? '—' : (+v).toFixed(1)) },
      legend: { top: 0, right: 0, itemWidth: 10, itemHeight: 6, textStyle: { fontSize: 10, color: '#cbd5e1' } },
      xAxis: { type: 'category', data: x, axisLabel: { fontSize: 9, color: '#94a3b8', interval: 11, formatter: fmtT }, axisTick: { show: false } },
      yAxis: [
        { type: 'value', scale: true, axisLabel: { fontSize: 9, color: '#94a3b8' }, splitLine: { lineStyle: { color: 'rgba(148,163,184,0.12)' } } },
        { type: 'value', min: 0, axisLabel: { fontSize: 9, color: '#94a3b8' }, splitLine: { show: false } },
      ],
      series: [
        { name: uk ? 'Темп., °C' : 'Temp, °C', type: 'line', data: h.temperature_2m, smooth: true, symbol: 'none', lineStyle: { width: 2, color: '#f59e0b' }, itemStyle: { color: '#f59e0b' } },
        { name: uk ? 'Вітер, м/с' : 'Wind, m/s', type: 'line', data: h.wind_speed_10m, smooth: true, symbol: 'none', lineStyle: { width: 1.4, color: '#38bdf8', type: 'dashed' }, itemStyle: { color: '#38bdf8' } },
        { name: uk ? 'Опади, мм' : 'Precip., mm', type: 'bar', yAxisIndex: 1, data: h.precipitation, barWidth: '60%', itemStyle: { color: 'rgba(96,165,250,0.85)' } },
      ],
    };
  }, [data, lang]);
  const c = data?.current;
  return (
    <div className="spot-card glass" role="dialog" aria-label={uk ? 'Прогноз у точці' : 'Point forecast'}>
      <div className="spot-head">
        <div>
          <b>{place || `${spot.lat.toFixed(2)}°, ${spot.lon.toFixed(2)}°`}</b>
          <div className="muted small mono">{spot.lat.toFixed(3)}°, {spot.lon.toFixed(3)}°{data?.elevation != null ? ` · ${Math.round(data.elevation)} ${uk ? 'м н.р.м.' : 'm a.s.l.'}` : ''}</div>
        </div>
        <button type="button" className="icon-btn" onClick={() => setSpot(null)} aria-label={uk ? 'Закрити' : 'Close'}><X size={15} strokeWidth={STROKE} /></button>
      </div>
      {err && <p className="wx-note">{err}</p>}
      {!data && !err && <p className="wx-note"><Loader2 size={14} className="spin" /> {uk ? 'Завантажую…' : 'Loading…'}</p>}
      {c && (
        <div className="spot-now">
          <span className="spot-temp mono">{Math.round(c.temperature_2m)}°</span>
          <dl>
            <div><dt>{uk ? 'Відчувається' : 'Feels like'}</dt><dd className="mono">{Math.round(c.apparent_temperature)}°</dd></div>
            <div><dt>{uk ? 'Вітер' : 'Wind'}</dt><dd className="mono"><i className="spot-arrow" style={{ transform: `rotate(${c.wind_direction_10m + 180}deg)` }}>↑</i>{c.wind_speed_10m.toFixed(1)} {uk ? 'м/с' : 'm/s'} {compass(c.wind_direction_10m, lang)}</dd></div>
            <div><dt>{uk ? 'Пориви' : 'Gusts'}</dt><dd className="mono">{c.wind_gusts_10m.toFixed(0)} {uk ? 'м/с' : 'm/s'}</dd></div>
            <div><dt>{uk ? 'Вологість' : 'Humidity'}</dt><dd className="mono">{c.relative_humidity_2m}%</dd></div>
            <div><dt>{uk ? 'Тиск' : 'Pressure'}</dt><dd className="mono">{Math.round(c.pressure_msl)} {uk ? 'гПа' : 'hPa'}</dd></div>
            <div><dt>{uk ? 'Хмари' : 'Clouds'}</dt><dd className="mono">{c.cloud_cover}%</dd></div>
          </dl>
        </div>
      )}
      {option && <Chart option={option} height={150} />}
      <p className="wx-credit">{uk ? 'Прогноз' : 'Forecast'}: Open-Meteo (CC BY 4.0) · {uk ? 'назва місця' : 'place name'}: © OpenStreetMap (Nominatim)</p>
    </div>
  );
}

export { WX_LAYERS };
