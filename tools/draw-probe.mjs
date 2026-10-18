/* draw-probe.mjs  -  GL draws a frame in a 3D place, and every town door walked into, without a screenshot (the user's rule):
   NODE_PATH=$(npm root -g) node tools/draw-probe.mjs --three=<three.module.min.js> [--doors] '<query>' ['<query>' ...]
   e.g. node tools/draw-probe.mjs --three=/tmp/three/package/build/three.module.min.js --doors '?town=thornwood&towns&gymwins=1'
   Each query is a fresh page at 390 x 844 (2x): after it settles, the median GL draws over 12 frames (every pass: shadow,
   scene, post), the meshes in the room, contexts awake and console errors. --doors then opens a fresh page per door of a
   town, stands your Pokémon on its step and walks in: a home must change the room. Made for the towns' draw calls
   (2026-10-18); compare runs before and after a change, as swiftshader's numbers aren't a phone's. */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const args = process.argv.slice(2), opt = (k) => args.find(a => a.startsWith(`--${k}`))?.split('=')[1] ?? args.includes(`--${k}`);
const queries = args.filter(a => !a.startsWith('--'));
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require(join(process.execPath, '../../lib/node_modules/playwright')); }
const TYPES = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.gif': 'image/gif', '.png': 'image/png', '.json': 'application/json', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.webmanifest': 'application/json' };
// js/event-3d.js is served with a peek at its room, camera and walker, for this probe only
const PEEK = '\nwindow.__ev = { get R() { return R; }, get walker() { return walker; }, goTo };\n';
const server = createServer(async (req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]);
  try {
    let body = await readFile(normalize(join(root, p === '/' ? 'index.html' : p)));
    if (p === '/js/event-3d.js') body = body.toString() + PEEK;
    res.writeHead(200, { 'content-type': TYPES[extname(p === '/' ? '.html' : p)] || 'application/octet-stream' }); res.end(body);
  } catch { res.writeHead(404); res.end(); }
}).listen(0);
const port = server.address().port;
const browser = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });

function instrument() {
  window.__draws = 0; window.__gls = [];
  const gc = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (t, o) { const r = gc.call(this, t, o); if (r && /webgl/.test(t) && !window.__gls.includes(r)) window.__gls.push(r); return r; };
  for (const P of [WebGL2RenderingContext.prototype, WebGLRenderingContext.prototype]) for (const f of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced']) {
    const o = P[f]; if (o) P[f] = function (...a) { window.__draws++; return o.apply(this, a); };
  }
}
async function open(q) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  // the cloud's proxy turns jsDelivr away (npm pack three@0.160.0 for a copy)
  if (opt('three')) await ctx.route(/cdn\.jsdelivr\.net\/npm\/three/, async r => r.fulfill({ contentType: 'text/javascript', body: await readFile(opt('three')) }));
  await ctx.route(/gstatic\.com|googleapis\.com/, r => r.abort());
  await ctx.addInitScript(instrument);
  const page = await ctx.newPage(), errors = [];
  page.on('pageerror', e => errors.push(`pageerror: ${e.message.slice(0, 200)}`));
  page.on('console', m => { if ((m.type() === 'error' && !/Failed to load resource|404|firebase|firestore|ERR_|GL Driver/i.test(m.text())) || /too many active/i.test(m.text())) errors.push(m.text().slice(0, 200)); });
  await page.goto(`http://localhost:${port}/index.html${q}`);
  await page.waitForTimeout(12000);
  return { ctx, page, errors };
}

for (const q of queries) {
  const { ctx, page, errors } = await open(q);
  const r = await page.evaluate(async () => {
    const frames = [];
    for (let i = 0; i < 12; i++) { const a = window.__draws; await new Promise(r => requestAnimationFrame(r)); frames.push(window.__draws - a); }
    const per = frames.filter(n => n > 0).sort((a, b) => a - b), R = window.__ev?.R;
    let meshes = 0; R?.group.traverse(o => { if (o.isMesh) meshes++; });
    return { draws: per[per.length >> 1], meshes, awake: window.__gls.filter(g => !g.isContextLost()).length, doors: Object.keys(R?.doors || {}) };
  });
  console.log(q, `draws a frame ${r.draws}, meshes ${r.meshes}, contexts awake ${r.awake}`, errors.length ? errors : '');
  await ctx.close();
  if (!opt('doors')) continue;
  for (const door of r.doors) {
    const { ctx, page, errors } = await open(q);
    await page.evaluate((d) => {
      const ev = window.__ev, w = ev.walker, st = ev.R.doors[d].step;
      window.__R0 = ev.R;
      w.path = []; w.tile = { ...st }; w.x = st.x - 19 + 0.5; w.z = st.y - 18 + 0.5;   // a town's 38 x 36 tiles
      ev.goTo(d);
    }, door);
    await page.waitForTimeout(9000);
    const res = await page.evaluate(() => ({ inside: window.__ev.R !== window.__R0, awake: window.__gls.filter(g => !g.isContextLost()).length }));
    console.log(`  ${door}: ${res.inside ? 'walked in' : 'knocked (no home)'}, contexts awake ${res.awake}`, errors.length ? errors : '');
    await ctx.close();
  }
}
await browser.close(); server.close();
