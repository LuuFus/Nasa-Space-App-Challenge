import { useEffect, useRef, useState } from 'react';
import { Lightbulb } from 'lucide-react';
import { useStore } from '../state/store.js';
import { useT } from '../i18n/index.js';
import { GLOSSARY } from '../content/glossary.js';
import Formula from './Formula.jsx';

const GROUPS = {
  stats: { uk: 'Статистика й тренди', en: 'Statistics & trends' },
  climate: { uk: 'Клімат', en: 'Climate' },
  satellite: { uk: 'Що бачать супутники', en: 'What satellites see' },
  data: { uk: 'Дані й прилади NASA', en: 'NASA data & instruments' },
};

export default function GlossaryPanel() {
  const { t, pick } = useT();
  const term = useStore((s) => s.glossaryTerm);
  const [q, setQ] = useState('');
  const refs = useRef({});
  useEffect(() => { if (term) setTimeout(() => refs.current[term]?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 50); }, [term]);
  const ql = q.trim().toLowerCase();
  const list = GLOSSARY.filter((g) => !ql || [g.term.uk, g.term.en, g.def.uk, g.def.en].some((x) => x.toLowerCase().includes(ql)));
  return (
    <div>
      <input placeholder={t('search')} value={q} onChange={(e) => setQ(e.target.value)} style={{ width: '100%' }} />
      {Object.entries(GROUPS).map(([gid, gt]) => {
        const items = list.filter((g) => g.group === gid);
        if (!items.length) return null;
        return (
          <div key={gid}>
            <h4>{pick(gt)}</h4>
            {items.map((g) => (
              <div key={g.id} ref={(el) => (refs.current[g.id] = el)} className={term === g.id ? 'gloss-entry on' : 'gloss-entry'}>
                <b>{pick(g.term)}</b>
                <div className="desc">{pick(g.def)}</div>
                {g.tex && <Formula tex={g.tex} />}
                {g.ex && <div className="small muted gloss-ex"><Lightbulb size={13} strokeWidth={1.75} /> {t('example')}: {pick(g.ex)}</div>}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
