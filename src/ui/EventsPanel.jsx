import { useEffect, useRef, useState } from 'react';
import { useStore } from '../state/store.js';
import { useT } from '../i18n/index.js';
import { EVENTS, EVENT_CATS } from '../content/events.js';
import { applyEvent } from '../lib/actions.js';
import { CatIcon } from './Icons.jsx';
import CausesPanel from './CausesPanel.jsx';

export default function EventsPanel() {
  const { t, pick } = useT();
  const eventId = useStore((s) => s.eventId);
  const setPanel = useStore((s) => s.setPanel);
  const [cat, setCat] = useState('all');
  const refs = useRef({});
  useEffect(() => { if (eventId) refs.current[eventId]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [eventId]);
  const list = EVENTS.filter((e) => cat === 'all' || e.cat === cat);
  return (
    <div>
      <h3>{t('events')}</h3>
      <div className="row small" style={{ marginBottom: 6 }}>
        <button className={cat === 'all' ? 'on' : ''} onClick={() => setCat('all')}>{t('all')}</button>
        {Object.entries(EVENT_CATS).map(([id, c]) => (
          <button key={id} className={cat === id ? 'on' : ''} onClick={() => setCat(id)}><CatIcon cat={id} /> {pick(c.title)}</button>
        ))}
      </div>
      {list.map((ev) => (
        <div key={ev.id} ref={(el) => (refs.current[ev.id] = el)} className={eventId === ev.id ? 'event-card on' : 'event-card'}>
          <h4><CatIcon cat={ev.cat} /> {pick(ev.title)}</h4>
          <div className="muted small">{ev.date}</div>
          {eventId === ev.id && <p className="desc">{pick(ev.text)}</p>}
          {eventId === ev.id && ev.why && <div className="explain"><p>{pick(ev.why)}</p></div>}
          {eventId === ev.id && ev.causes && <CausesPanel eventId={ev.id} />}
          <div className="row small">
            <button className="primary" onClick={() => applyEvent(ev)}>{ev.swipe ? `⇆ ${t('showBeforeAfter')}` : `📍 ${t('showOnMap')}`}</button>
            {ev.chart && <button onClick={() => { useStore.setState({ planetChart: ev.chart }); setPanel('planet'); }}>📈 {t('planet')}</button>}
            {eventId !== ev.id && <button onClick={() => useStore.getState().setEvent(ev.id)}>{t('readMore')}</button>}
            {ev.source && <a href={ev.source.url} target="_blank" rel="noreferrer" title={ev.source.title}>{t('source')} ↗</a>}
          </div>
        </div>
      ))}
    </div>
  );
}
