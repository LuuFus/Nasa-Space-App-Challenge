// Copies the list of sources (src/content/sources.js) into README.md (English)
// and README.uk.md (Ukrainian), between the <!-- sources:start/end --> marks,
// so the site and the READMEs always credit the same things.
// Usage: npm run sources
import fs from 'node:fs';
import { SOURCE_GROUPS } from '../src/content/sources.js';

function markdown(lang) {
  const out = [];
  for (const g of SOURCE_GROUPS) {
    out.push(`### ${g.title[lang]}`, '');
    for (const [name, url, d] of g.items) {
      out.push(`- ${url ? `[${name}](${url})` : `**${name}**`} — ${d[lang]}`);
    }
    out.push('');
  }
  return out.join('\n');
}

for (const [file, lang] of [['README.md', 'en'], ['README.uk.md', 'uk']]) {
  const text = fs.readFileSync(file, 'utf8');
  const re = /(<!-- sources:start -->\n)[\s\S]*?(<!-- sources:end -->)/;
  if (!re.test(text)) throw new Error(`${file}: no <!-- sources:start/end --> marks`);
  fs.writeFileSync(file, text.replace(re, `$1\n${markdown(lang)}$2`));
  console.log(`${file}: ${SOURCE_GROUPS.reduce((n, g) => n + g.items.length, 0)} sources`);
}
