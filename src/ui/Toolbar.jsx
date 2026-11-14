import { useStore } from '../state/store.js';
import { useT } from '../i18n/index.js';

const VIEW_TOGGLES = ['clouds', 'borders', 'capitals', 'rivers', 'labels', 'oceans', 'graticule', 'tint', 'events'];
const TOGGLE_TEXT = { labels: 'countryNames', events: 'eventMarkers' };

export default function Toolbar() {
  const { t, lang } = useT();
  const s = useStore();
  const setView = (v) => {
    if (v === 'globe') s.setMode('globe');
    else { s.setFlatStyle(v === 'contour' ? 'contour' : 'imagery'); s.setMode('flat'); }
  };
  const view = s.mode === 'globe' ? 'globe' : s.flatStyle;
  return (
    <header className="toolbar">
      <div className="brand">
        <b>{t('appTitle')}</b>
        <span className="muted small">{t('team')}</span>
      </div>
      <div className="seg" role="group" aria-label={t('view')}>
        <button className={view === 'globe' ? 'on' : ''} onClick={() => setView('globe')}>{t('globe3d')}</button>
        <button className={view === 'contour' ? 'on' : ''} onClick={() => setView('contour')}>{t('contourMap')}</button>
        <button className={view === 'imagery' ? 'on' : ''} onClick={() => setView('imagery')}>{t('mapImagery')}</button>
      </div>
      <div className="toggles">
        {VIEW_TOGGLES.map((k) => (
          <label key={k} className={s.toggles[k] ? 'chip on' : 'chip'}>
            <input type="checkbox" checked={!!s.toggles[k]} onChange={() => s.toggle(k)} />
            {t(TOGGLE_TEXT[k] || k)}
          </label>
        ))}
        {s.toggles.clouds && (
          <input type="date" className="small-date" value={s.cloudDate} min="2018-01-05" max="2026-11-13"
            title={t('clouds')} onChange={(e) => e.target.value && s.setCloudDate(e.target.value)} />
        )}
      </div>
      <div className="seg lang">
        <button className={lang === 'uk' ? 'on' : ''} onClick={() => s.setLang('uk')}>UA</button>
        <button className={lang === 'en' ? 'on' : ''} onClick={() => s.setLang('en')}>EN</button>
      </div>
    </header>
  );
}
