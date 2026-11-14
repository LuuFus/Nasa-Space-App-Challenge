import katex from 'katex';
import { useStore } from '../state/store.js';

export default function Formula({ tex, block = true }) {
  const html = katex.renderToString(tex, { throwOnError: false, displayMode: block });
  return <span className={block ? 'formula-block' : ''} style={block ? { display: 'block' } : undefined} dangerouslySetInnerHTML={{ __html: html }} />;
}

/** a word that opens its glossary entry */
export function Term({ id, children }) {
  const open = useStore((s) => s.openGlossary);
  return <span className="term-link" onClick={() => open(id)} title="Глосарій / Glossary">{children}</span>;
}
