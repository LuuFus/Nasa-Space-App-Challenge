import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ExternalLink, LineChart, MapPin, SplitSquareHorizontal } from 'lucide-react';
import { useStore } from '../state/store.js';
import { useT } from '../i18n/index.js';
import { EVENTS, EVENT_CATS } from '../content/events.js';
import { applyEvent } from '../lib/actions.js';
import { CatBadge, CatIcon, STROKE } from './Icons.jsx';
import CausesPanel from './CausesPanel.jsx';

const fmtDay = (d, lang) => {
  if (!d || d.length < 10) return d || '';
  return new Date(d + 'T00:00:00Z').toLocaleDateString(lang === 'uk' ? 'uk-UA' : 'en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
};

/**
 * Event card shared by "Events" and "Before / after": category badge and date on
 * top, the title, then small actions (compare, on the map, source).
 */
export function EventCard({ ev, active, dateText, children, extra }) {
  const { t, pick, lang } = useT();
  const uk = lang === 'uk';
  return (
    <article className={active ? 'event-card on' : 'event-card'}>
      <header className="ec-top">
        <CatBadge cat={ev.cat} pick={pick} />
        <span className="ec-date mono">{dateText ?? fmtDay(ev.date, lang)}</span>
      </header>
      <h4 className="ec-title">{pick(ev.title)}</h4>
      {children}
      <footer className="ec-actions">
        {ev.swipe && (
          <button type="button" className="act" onClick={() => applyEvent(ev)} title={uk ? 'Порівняти «було / стало»' : 'Compare before / after'}>
            <SplitSquareHorizontal size={15} strokeWidth={STROKE} /><span>{uk ? 'Порівняти' : 'Compare'}</span>
          </button>
        )}
        <button type="button" className="act" onClick={() => applyEvent(ev, { swipe: false })} title={t('showOnMap')}>
          <MapPin size={15} strokeWidth={STROKE} /><span>{uk ? 'На карті' : 'On the map'}</span>
        </button>
        {extra}
        {ev.source && (
          <a className="ec-src" href={ev.source.url} target="_blank" rel="noreferrer" title={ev.source.title}>
            {t('source')} <ExternalLink size={12} strokeWidth={STROKE} />
          </a>
        )}
      </footer>
    </article>
  );
}

export default function EventsPanel() {
  const { t, pick, lang } = useT();
  const uk = lang === 'uk';
  const eventId = useStore((s) => s.eventId);
  const setPanel = useStore((s) => s.setPanel);
  const [cat, setCat] = useState('all');
  // which card shows its full story (a click on a map marker opens that one)
  const [openId, setOpenId] = useState(eventId);
  const refs = useRef({});
  useEffect(() => {
    if (!eventId) return;
    setOpenId(eventId);
    refs.current[eventId]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [eventId]);
  const list = EVENTS.filter((e) => cat === 'all' || e.cat === cat);
  return (
    <div className="events-panel">
      <div className="filters" role="group" aria-label={uk ? 'Категорії' : 'Categories'}>
        <button type="button" className={cat === 'all' ? 'filter on' : 'filter'} aria-pressed={cat === 'all'} onClick={() => setCat('all')}>{t('all')}</button>
        {Object.entries(EVENT_CATS).map(([id, c]) => (
          <button key={id} type="button" className={cat === id ? 'filter on' : 'filter'} aria-pressed={cat === id} onClick={() => setCat(id)}>
            <CatIcon cat={id} size={12} />{pick(c.title)}
          </button>
        ))}
      </div>
      {list.map((ev) => {
        const open = openId === ev.id;
        return (
          <div key={ev.id} ref={(el) => (refs.current[ev.id] = el)}>
            <EventCard ev={ev} active={eventId === ev.id} extra={(
              <>
                {ev.chart && (
                  <button type="button" className="act" onClick={() => { useStore.setState({ planetChart: ev.chart }); setPanel('planet'); }} title={t('planet')}>
                    <LineChart size={15} strokeWidth={STROKE} /><span>{uk ? 'Графік' : 'Chart'}</span>
                  </button>
                )}
                <button type="button" className={open ? 'act on' : 'act'} aria-expanded={open}
                  onClick={() => setOpenId(open ? null : ev.id)}>
                  <ChevronDown size={15} strokeWidth={STROKE} className={open ? 'chev-up' : ''} /><span>{open ? (uk ? 'Згорнути' : 'Less') : t('readMore')}</span>
                </button>
              </>
            )}>
              {open && <p className="desc">{pick(ev.text)}</p>}
              {open && ev.why && <div className="explain"><p>{pick(ev.why)}</p></div>}
              {open && ev.causes && <CausesPanel eventId={ev.id} />}
            </EventCard>
          </div>
        );
      })}
    </div>
  );
}
