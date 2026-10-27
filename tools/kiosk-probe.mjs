/* kiosk-probe.mjs  -  the house catalogue (js/house-kiosk.js) in text, no screenshots (the user's rule): opens Timburr's
   stand on the veteran save (tools/fixtures) with ?houses=all on a phone, then for every house picks its card and prints
   its tag, the key, Timburr's line and whether the picked house's name or paint name is cut off; and the card's height.
   Built 2026-10-23 (the houses' session B), for long names cut off.
     NODE_PATH=$(npm root -g) node tools/kiosk-probe.mjs [query, default houses=all] [width, default 402] */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { serve, launch, phone, threeCopy, root } from './probe-kit.mjs';

const [q = 'houses=all', width = '402'] = process.argv.slice(2);
const veteran = await readFile(join(root, 'tools/fixtures/veteran-save.json'), 'utf8');
const { server, port } = serve((path, body) => path === '/js/hub-3d.js' ? body.toString() + '\nwindow.__kiosk = openKiosk;\n' : body);
const browser = await launch(), three = await threeCopy();
const { ctx, page, errors } = await phone(browser, three);
await page.setViewportSize({ width: +width, height: 874 });
await ctx.addInitScript(s => localStorage.setItem('pokedb.save.v2', s), veteran);
await page.goto(`http://localhost:${port}/?${q}&coins=20000`);
await page.waitForFunction(() => window.__kiosk && document.querySelector('.hub-view'), null, { timeout: 60000 });
await page.waitForTimeout(3000);
await page.evaluate(() => window.__kiosk());
await page.waitForSelector('.hk-card');
await page.waitForTimeout(800);
const n = await page.$$eval('.hk-card', c => c.length);
console.log(`cards ${n}, sheet ${await page.$eval('.hk-sheet', s => Math.round(s.getBoundingClientRect().height))} px tall at ${width} px`);
for (let i = 0; i < n; i++) {
  await page.evaluate(i => document.querySelectorAll('.hk-card')[i].click(), i);
  await page.waitForTimeout(250);
  console.log(await page.evaluate(() => {
    const t = document.querySelector('.hk-pick-title'), pn = document.querySelector('.hk-paint-name'), card = document.querySelector('.hk-card.on'), k = document.querySelector('.hk-go');
    const cut = (e) => (e.scrollWidth > e.clientWidth + 1 ? ' CUT' : '');
    const tag = card.querySelector('.hk-tag'), tagCut = tag.getBoundingClientRect().width > card.getBoundingClientRect().width + 1 ? ' TAG-OVER' : '';
    return `${t.textContent} (${getComputedStyle(t).fontSize}${cut(t)}) · ${pn.textContent}${cut(pn)} · [${card.getAttribute('aria-label')}${card.classList.contains('locked') ? ', greyed' : ''}${tagCut}] · key "${k.textContent}"${k.disabled ? ' (off)' : ''} · ${document.querySelector('.hk-say').textContent}`;
  }));
}
console.log(`sheet ${await page.$eval('.hk-sheet', s => Math.round(s.getBoundingClientRect().height))} px`);
if (errors.length) console.log('ERRORS\n' + errors.join('\n'));
await browser.close(); server.close();
