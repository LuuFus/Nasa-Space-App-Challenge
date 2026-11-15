// Publishes the built site to GitHub Pages: builds dist/ and pushes it as the
// `gh-pages` branch of the same GitHub repository. The site then lives at
// https://<user>.github.io/<repo>/ (all asset paths are relative, see vite.config.js).
// Usage: npm run deploy   (needs push rights to the repository)
// The gh-pages branch holds only the built files and is replaced on every deploy.
import { execSync } from 'node:child_process';
import fs from 'node:fs';

const sh = (cmd, cwd) => execSync(cmd, { stdio: 'inherit', cwd });
const out = (cmd) => execSync(cmd).toString().trim();

const origin = out('git remote get-url origin');
const commit = out('git rev-parse --short HEAD');
const branch = out('git rev-parse --abbrev-ref HEAD');

sh('npm run build');
fs.writeFileSync('dist/.nojekyll', '');          // serve files as they are (no Jekyll)
fs.rmSync('dist/.git', { recursive: true, force: true });
sh('git init -q', 'dist');
sh('git checkout -q -b gh-pages', 'dist');
sh('git add -A', 'dist');
sh(`git commit -q -m "Site built from ${branch} @ ${commit}"`, 'dist');
sh(`git push -f "${origin}" gh-pages`, 'dist');
fs.rmSync('dist/.git', { recursive: true, force: true });

const m = origin.match(/github\.com[:/]([^/]+)\/(.+?)(\.git)?$/);
if (m) console.log(`\nPublished: https://${m[1].toLowerCase()}.github.io/${m[2]}/`);
