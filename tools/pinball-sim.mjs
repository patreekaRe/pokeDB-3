/* pinball-sim.mjs  -  plays a js/pinball-kit.js table headless with a bot, no drawing (2026-10-17):
   NODE_PATH=$(npm root -g) node tools/pinball-sim.mjs <file> [games=6] [minutes=12]
   e.g. node tools/pinball-sim.mjs pinball-gengar 8
   The file exports TABLE (its definition). The bot flips a side when a ball comes down onto its flippers and launches
   at a random point of the gauge, and lets a ball rest on a flipper now and then rather than pinning it there (re-flipping
   at every touch held balls against a raised flipper and stretched every table's ball life). Prints each game's score and length, the table's own counters (`t.stat`), how often
   the ball search nudged a still ball, balls that left the table, and the display lines seen most. */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const [file, games = '6', minutes = '12'] = process.argv.slice(2);
if (!file) { console.log('usage: node tools/pinball-sim.mjs <file> [games] [minutes]'); process.exit(1); }
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require(join(process.execPath, '../../lib/node_modules/playwright')); }
const TYPES = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.gif': 'image/gif', '.png': 'image/png', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  const path = decodeURIComponent(req.url.split('?')[0]);
  if (path === '/__sim.html') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end('<!doctype html><meta charset="utf-8"><body></body>'); }
  try { const body = await readFile(normalize(join(root, path))); res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
}).listen(0);
const port = server.address().port;
const browser = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => pw.chromium.launch());
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(`${e.message}\n${e.stack || ''}`));
await page.goto(`http://localhost:${port}/__sim.html`);
const out = await page.evaluate(async ({ file, games, minutes }) => {
  const { makeTable } = await import('./js/pinball-kit.js');
  const { TABLE } = await import(`./js/${file}.js`);
  const runs = [], lines = {};
  for (let n = 0; n < games; n++) {
    let score = 0, over = false, overLine = '';
    const api = { add: (k) => { score += k; }, sound() {}, say: (s) => { const k = s.replace(/[\d,]+/g, '#'); lines[k] = (lines[k] || 0) + 1; }, over: (s) => { over = true; overLine = s; }, calm: true };
    const game = makeTable(TABLE, api), t = game.t, dt = 1 / 120;
    const hold = { l: 0, r: 0 }, lives = [];
    let time = 0, ballAt = 0, ballNo = 1;
    while (!over && time < minutes * 60) {
      if (t.waiting()) { if (Math.random() < 0.02) { t.phase = Math.random() * Math.PI * 2; game.plunge(); } }
      for (const s of ['l', 'r']) {
        const fs = t.flippers.filter(f => f.s === s);
        const near = t.field.some(b => !b.gone && !b.lane && fs.some(f => {
          const tipX = f.x + Math.cos(f.rest) * f.len, tipY = f.y + Math.sin(f.rest) * f.len;
          const d = Math.hypot(b.x - (f.x + tipX) / 2, b.y - (f.y + tipY) / 2);
          return d < f.len * 0.75 + 14 && b.y < f.y + 6 && b.vy > -50 && (Math.hypot(b.vx, b.vy) > 40 || Math.random() < 0.01);
        }));
        if (near && hold[s] <= 0) { hold[s] = 0.16 + Math.random() * 0.08; game.press(s, true); }
        if (hold[s] > 0 && (hold[s] -= dt) <= 0) game.press(s, false);
      }
      game.tick(dt, time * 1000);
      if (t.ball !== ballNo) { lives.push(time - ballAt); ballAt = time; ballNo = t.ball; }
      time += dt;
    }
    lives.push(time - ballAt);
    runs.push({ score, time: Math.round(time), over, overLine, lives: lives.map(l => Math.round(l)), stats: t.stats });
  }
  return { runs, lines };
}, { file, games: Number(games), minutes: Number(minutes) });
const sum = {};
for (const r of out.runs) {
  console.log(`score ${r.score.toLocaleString().padStart(11)}  ${String(r.time).padStart(4)}s  balls ${r.lives.join('/')}s  ${r.over ? r.overLine : 'TIMED OUT'}`);
  for (const [k, v] of Object.entries(r.stats)) sum[k] = (sum[k] || 0) + v;
}
console.log('per game: ' + Object.entries(sum).map(([k, v]) => `${k} ${(v / out.runs.length).toFixed(1)}`).join(', '));
console.log('lines: ' + Object.entries(out.lines).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([k, v]) => `${v}× ${k}`).join(' | '));
if (errors.length) console.log('ERRORS:\n' + [...new Set(errors)].slice(0, 6).join('\n'));
await browser.close(); server.close();
