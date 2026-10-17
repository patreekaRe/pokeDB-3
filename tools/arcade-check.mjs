/* arcade-check.mjs  -  plays an arcade game headless and reports what broke, without a screenshot (the user's rule):
   node tools/arcade-check.mjs <file> <opener> [seconds=12] [mash]
   e.g. node tools/arcade-check.mjs arcade-pinball openPinball 20
   Serves the repo, opens a bare page with the game's CSS, opens the game, starts it, presses random controls (or
   only `mash`, a comma list of left,right,up,down,act or a pad action), and prints console errors, the score, the
   status line and frames drawn a second. Needs Playwright: run it as `NODE_PATH=$(npm root -g) node tools/arcade-check.mjs ...` in the cloud. */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const [file, opener, secs = '12', mash = ''] = process.argv.slice(2);
if (!file || !opener) { console.log('usage: node tools/arcade-check.mjs <file> <opener> [seconds] [mash]'); process.exit(1); }
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require(join(process.execPath, '../../lib/node_modules/playwright')); }

const TYPES = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.gif': 'image/gif', '.png': 'image/png', '.json': 'application/json', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
const PAGE = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
${['base', 'cards', 'screens', 'menus', 'secret-base', 'hub', 'corner-games'].map(c => `<link rel="stylesheet" href="css/${c}.css">`).join('')}
</head><body><script type="module">
import('./js/${file}.js').then(m => { window.__open = m['${opener}']; window.__ready = true; }).catch(e => { window.__err = String(e.stack || e); });
</script></body></html>`;
const server = createServer(async (req, res) => {
  const path = decodeURIComponent(req.url.split('?')[0]);
  if (path === '/__arcade.html') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(PAGE); }
  try {
    const body = await readFile(normalize(join(root, path)));
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' }); res.end(body);
  } catch { res.writeHead(404); res.end(); }
}).listen(0);
const port = server.address().port;
const browser = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] }).catch(() => pw.chromium.launch());
const page = await browser.newPage({ viewport: { width: 420, height: 860 } });
const errors = [];
page.on('pageerror', e => errors.push(`pageerror: ${e.message}\n${e.stack || ''}`));
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|404|firebase|firestore/i.test(m.text())) errors.push(`console: ${m.text()}`); });
await page.addInitScript(() => localStorage.clear());
await page.goto(`http://localhost:${port}/__arcade.html`);
await page.waitForFunction(() => window.__ready || window.__err, null, { timeout: 15000 });
const err = await page.evaluate(() => window.__err);
if (err) { console.log('IMPORT FAILED\n' + err); await browser.close(); server.close(); process.exit(1); }
await page.evaluate(() => { window.__closed = false; window.__open(() => { window.__closed = true; }); });
await page.waitForTimeout(400);
const got = await page.$('.vf-go');   // the first look's How to play
if (got) { await got.click(); await page.waitForTimeout(200); }
await page.evaluate(() => {
  window.__frames = 0;
  const c = () => { window.__frames++; requestAnimationFrame(c); }; requestAnimationFrame(c);
  const p = CanvasRenderingContext2D.prototype, d = p.drawImage;
  window.__draws = 0; p.drawImage = function (...a) { window.__draws++; return d.apply(this, a); };
});
await page.click('.ar-start');
const t0 = Date.now(), until = t0 + Number(secs) * 1000;
const keys = mash ? mash.split(',') : ['left', 'right', 'up', 'down', 'act'];
const KEY = { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown', act: ' ' };
let restarts = 0, lastLine = '';
const lines = new Set();
while (Date.now() < until) {
  const k = keys[Math.floor(Math.random() * keys.length)];
  const box = await page.$('canvas.ar-canvas');
  if (KEY[k]) { await page.keyboard.down(KEY[k]); await page.waitForTimeout(40 + Math.random() * 220); await page.keyboard.up(KEY[k]); }
  else if (k === 'tap' && box) { const b = await box.boundingBox(); await page.mouse.click(b.x + Math.random() * b.width, b.y + Math.random() * b.height); }
  else { const b = await page.$(`.ar-pad-${k}`); if (b) { const r = await b.boundingBox(); await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2); await page.mouse.down(); await page.waitForTimeout(60); await page.mouse.up(); } }
  await page.waitForTimeout(30);
  const s = await page.evaluate(() => ({ line: document.querySelector('.vf-say')?.textContent || '', over: !document.querySelector('.ar-cab.playing') }));
  if (s.line !== lastLine) { lines.add(s.line); lastLine = s.line; }
  if (s.over && Date.now() - t0 > 500) { restarts++; await page.waitForTimeout(700); const st = await page.$('.ar-start'); if (st) await st.click(); }
}
const frames = await page.evaluate(() => window.__frames), draws = await page.evaluate(() => window.__draws);
const score = await page.evaluate(() => document.querySelector('.ar-best')?.textContent);
console.log(`${file}: ${(frames / Number(secs)).toFixed(0)} fps headless, ${(draws / Math.max(1, frames)).toFixed(0)} drawImage/frame, best ${score}, ${restarts} game overs`);
console.log('lines seen:\n  ' + [...lines].slice(-14).join('\n  '));
console.log(errors.length ? `ERRORS (${errors.length}):\n${[...new Set(errors)].slice(0, 8).join('\n')}` : 'no errors');
await browser.close(); server.close();
process.exit(errors.length ? 1 : 0);
