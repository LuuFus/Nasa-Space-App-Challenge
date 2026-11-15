import { useEffect, useMemo, useRef, useState } from 'react';
import { Bookmark, Download, ExternalLink, Link2, Plus, Search, Trash2, Upload, X } from 'lucide-react';
import { useStore } from '../state/store.js';
import { useT } from '../i18n/index.js';
import { captureView, describeView, openView, SHORTCUTS } from '../lib/views.js';
import { STROKE } from './Icons.jsx';

// Personal notes: write down what you found, keep links to places in the app
// (a saved view or a ready-made shortcut) and come back with one click.
// Stored only in this browser (localStorage) — nothing is sent anywhere.

const KEY = 'etd-notes';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
const save = (list) => { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* private mode */ } };
const uid = () => Math.random().toString(36).slice(2, 10);
const URL_RE = /(https?:\/\/[^\s]+)/g;

/** plain text with clickable web links */
function Linkified({ text }) {
  return text.split(URL_RE).map((part, i) => (i % 2
    ? <a key={i} href={part} target="_blank" rel="noreferrer">{part}</a>
    : <span key={i}>{part}</span>));
}

function Note({ note, update, remove, lang }) {
  const uk = lang === 'uk';
  const catalog = useStore((s) => s.catalog);
  const [editing, setEditing] = useState(!note.title && !note.text);
  const [adding, setAdding] = useState(false);
  const titleRef = useRef(null);
  useEffect(() => { if (editing) titleRef.current?.focus(); }, [editing]);
  const addView = async () => {
    const v = await captureView();
    update({ links: [...(note.links || []), { id: uid(), kind: 'view', view: v, label: describeView(v, catalog, lang) }] });
    setAdding(false);
  };
  const addShortcut = (sc) => {
    update({ links: [...(note.links || []), { id: uid(), kind: 'shortcut', view: sc.view, label: sc.title[lang] }] });
    setAdding(false);
  };
  return (
    <article className="note">
      {editing ? (
        <>
          <input ref={titleRef} className="note-title" value={note.title} placeholder={uk ? 'Назва нотатки' : 'Note title'} onChange={(e) => update({ title: e.target.value })} />
          <textarea className="note-text" rows={4} value={note.text} placeholder={uk ? 'Що ти помітив? Що треба перевірити?' : 'What did you notice? What should you check?'}
            onChange={(e) => update({ text: e.target.value })} />
        </>
      ) : (
        <button type="button" className="note-view" onClick={() => setEditing(true)} title={uk ? 'Натисни, щоб змінити' : 'Click to edit'}>
          <b>{note.title || (uk ? 'Без назви' : 'Untitled')}</b>
          {note.text && <p><Linkified text={note.text} /></p>}
        </button>
      )}
      {note.links?.length > 0 && (
        <div className="note-links">
          {note.links.map((l) => (
            <span key={l.id} className="note-link">
              <button type="button" onClick={() => openView(l.view)} title={uk ? 'Відкрити' : 'Open'}>
                {l.kind === 'view' ? <Bookmark size={13} strokeWidth={STROKE} /> : <ExternalLink size={13} strokeWidth={STROKE} />} {l.label}
              </button>
              <button type="button" className="note-link-x" aria-label={uk ? 'Прибрати посилання' : 'Remove link'}
                onClick={() => update({ links: note.links.filter((x) => x.id !== l.id) })}><X size={12} strokeWidth={STROKE} /></button>
            </span>
          ))}
        </div>
      )}
      {adding && (
        <div className="note-add glass">
          <button type="button" className="note-add-main" onClick={addView}>
            <Bookmark size={14} strokeWidth={STROKE} /> {uk ? 'Що зараз на екрані (шар, дата, місце)' : 'What is on the screen now (layer, date, place)'}
          </button>
          <div className="note-add-title">{uk ? 'або функція сайту:' : 'or a feature of the site:'}</div>
          {SHORTCUTS.map((sc) => <button key={sc.id} type="button" onClick={() => addShortcut(sc)}>{sc.title[lang]}</button>)}
        </div>
      )}
      <footer className="note-foot">
        <span className="muted small">{new Date(note.updated).toLocaleString(uk ? 'uk-UA' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
        <span className="note-actions">
          <button type="button" className={adding ? 'on' : ''} onClick={() => setAdding(!adding)}><Link2 size={13} strokeWidth={STROKE} /> {uk ? 'Посилання' : 'Link'}</button>
          <button type="button" onClick={() => setEditing(!editing)}>{editing ? (uk ? 'Готово' : 'Done') : (uk ? 'Змінити' : 'Edit')}</button>
          <button type="button" className="note-del" onClick={() => { if (window.confirm(uk ? 'Видалити цю нотатку?' : 'Delete this note?')) remove(); }}
            aria-label={uk ? 'Видалити' : 'Delete'}><Trash2 size={13} strokeWidth={STROKE} /></button>
        </span>
      </footer>
    </article>
  );
}

export default function NotesPanel() {
  const { lang } = useT();
  const uk = lang === 'uk';
  const [notes, setNotes] = useState(load);
  const [q, setQ] = useState('');
  const file = useRef(null);
  useEffect(() => { save(notes); }, [notes]);
  const add = () => setNotes((ns) => [{ id: uid(), title: '', text: '', links: [], updated: Date.now() }, ...ns]);
  const update = (id, patch) => setNotes((ns) => ns.map((n) => (n.id === id ? { ...n, ...patch, updated: Date.now() } : n)));
  const remove = (id) => setNotes((ns) => ns.filter((n) => n.id !== id));
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? notes.filter((n) => `${n.title} ${n.text} ${(n.links || []).map((l) => l.label).join(' ')}`.toLowerCase().includes(s)) : notes;
  }, [notes, q]);
  const exportAll = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(notes, null, 2)], { type: 'application/json' }));
    a.download = 'earth-detective-notes.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const importAll = (f) => {
    if (!f) return;
    f.text().then((t) => {
      const list = JSON.parse(t);
      if (!Array.isArray(list)) throw new Error('not a list');
      setNotes((ns) => [...list.filter((n) => n && n.id && !ns.some((m) => m.id === n.id)), ...ns]);
    }).catch(() => window.alert(uk ? 'Це не файл нотаток.' : 'This is not a notes file.'));
  };
  return (
    <div className="notes-panel">
      <p className="desc">{uk
        ? 'Твої власні нотатки: записуй, що знайшов, і додавай посилання на шари, дати й місця на карті — потім відкриєш їх одним кліком. Нотатки зберігаються лише в цьому браузері.'
        : 'Your own notes: write down what you found and add links to layers, dates and places — open them later with one click. Notes are kept only in this browser.'}</p>
      <div className="notes-bar">
        <button type="button" className="btn-accent" onClick={add}><Plus size={15} strokeWidth={STROKE} /> {uk ? 'Нова нотатка' : 'New note'}</button>
        {notes.length > 2 && (
          <label className="notes-search"><Search size={14} strokeWidth={STROKE} />
            <input value={q} placeholder={uk ? 'Пошук у нотатках' : 'Search notes'} onChange={(e) => setQ(e.target.value)} />
          </label>
        )}
      </div>
      {notes.length === 0 && (
        <div className="notes-empty">
          <b>{uk ? 'Ще немає нотаток' : 'No notes yet'}</b>
          <span>{uk ? 'Наприклад: «Аральське море: порівняти 1985 і 2025 → посилання», «Спитати вчителя, що таке NDVI».' : 'For example: “Aral Sea: compare 1985 and 2025 → link”, “Ask the teacher what NDVI is”.'}</span>
        </div>
      )}
      {shown.map((n) => <Note key={n.id} note={n} lang={lang} update={(p) => update(n.id, p)} remove={() => remove(n.id)} />)}
      <div className="notes-io">
        <button type="button" className="btn-ghost" onClick={exportAll} disabled={!notes.length}><Download size={14} strokeWidth={STROKE} /> {uk ? 'Зберегти у файл' : 'Save to a file'}</button>
        <button type="button" className="btn-ghost" onClick={() => file.current?.click()}><Upload size={14} strokeWidth={STROKE} /> {uk ? 'Відкрити файл' : 'Open a file'}</button>
        <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => { importAll(e.target.files?.[0]); e.target.value = ''; }} />
      </div>
    </div>
  );
}
