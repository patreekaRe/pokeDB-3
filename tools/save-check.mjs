/* save-check.mjs  -  the Clearing must start for a well-played save, not only a new one (2026-10-23: deleting the Berry
   Booth's painting broke the 3D Clearing for every save with Kurt's Workshop open, while every check, run on a fresh
   save, passed). Loads tools/fixtures/veteran-save.json (a real player's save, names and friends taken out: a Secret
   Base with rooms and a yard, the towns, Kurt's, the Safari, the Game Corner) and a fresh save, each with and without
   ?houses, and fails if the Clearing falls back to the signs title, printing the error the title swallows.
     NODE_PATH=$(npm root -g) node tools/save-check.mjs */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { serve, launch, phone, threeCopy, root } from './probe-kit.mjs';

const veteran = await readFile(join(root, 'tools/fixtures/veteran-save.json'), 'utf8');
// the title catches a failed build and shows the signs: print why
const { server, port } = serve((path, body) => path === '/js/title.js'
  ? body.toString().replace("}, () => { screen.classList.remove('hub-mode');", "}, (err) => { console.error('CLEARING FAILED', err?.stack || err); screen.classList.remove('hub-mode');")
  : body);
const browser = await launch(), three = await threeCopy();
let bad = 0;
for (const [name, save] of [['veteran', veteran], ['fresh', null]]) for (const q of ['', '?houses', '?houses&tree']) {
  const { ctx, page, errors } = await phone(browser, three);
  const failed = [];
  page.on('console', m => { if (/CLEARING FAILED/.test(m.text())) failed.push(m.text().slice(0, 600)); });
  if (save) await ctx.addInitScript(s => localStorage.setItem('pokedb.save.v2', s), save);
  await page.goto(`http://localhost:${port}/${q}`);
  await page.waitForTimeout(11000);
  const ok = await page.evaluate(() => !!document.querySelector('.hub-view') && document.getElementById('title-screen')?.classList.contains('hub-mode'));
  const fine = ok && !failed.length && !errors.length;
  if (!fine) bad++;
  console.log(`${name.padEnd(8)} ${(q || '/').padEnd(14)} ${fine ? 'Clearing up' : 'BROKEN'}${failed.length ? `\n  ${failed.join('\n  ')}` : ''}${errors.length ? `\n  ${errors.join('\n  ')}` : ''}`);
  await ctx.close();
}
await browser.close(); server.close();
if (bad) { console.log(`\n${bad} broken`); process.exit(1); }
console.log('\nevery save starts the Clearing');
