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

/* --why: where a place's draws go. The biggest scene drawn is walked: each mesh in the camera's view (and each shadow
   caster) is counted under the group it sits in, at depth --depth (3 by default) below the scene, with that group's
   centre in world units, so a heavy group can be found in the code by where it stands. */
async function why(page) {
  return page.evaluate(async (depth) => {
    const T = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js');
    const R = T.Scene.prototype, o = R.onBeforeRender;
    let seen = null;
    R.onBeforeRender = function (r, s, c) { if (!seen || s.children.length >= seen.s.children.length) seen = { s, c }; };
    for (let i = 0; i < 30 && !seen; i++) await new Promise(r => requestAnimationFrame(r));
    await new Promise(r => requestAnimationFrame(r));
    R.onBeforeRender = o;
    if (!seen) return 'no scene drawn';
    const { s, c } = seen, fr = new T.Frustum().setFromProjectionMatrix(new T.Matrix4().multiplyMatrices(c.projectionMatrix, c.matrixWorldInverse));
    const rows = new Map(), box = new T.Box3(), v = new T.Vector3();
    let sunCam = null; s.traverse(l => { if (l.isDirectionalLight && l.castShadow) sunCam = l.shadow.camera; });
    const sf = sunCam && new T.Frustum().setFromProjectionMatrix(new T.Matrix4().multiplyMatrices(sunCam.projectionMatrix, sunCam.matrixWorldInverse));
    let main = 0, shadow = 0;
    const walk = (obj, path) => {
      if (!obj.visible) return;
      if (obj.isMesh || obj.isSprite || obj.isPoints || obj.isLine) {
        const n = Array.isArray(obj.material) ? new Set((obj.geometry.groups || []).map(g => g.materialIndex)).size || 1 : 1;
        const inView = obj.frustumCulled === false || obj.isSprite || (obj.geometry.boundingSphere || obj.geometry.computeBoundingSphere(), fr.intersectsObject(obj));
        const key = path.slice(0, depth).join('/') || '(scene)';
        const row = rows.get(key) || rows.set(key, { main: 0, shadow: 0, meshes: 0, kinds: {} }).get(key);
        row.meshes++;
        if (inView) { row.main += n; main += n; }
        if (obj.castShadow && obj.isMesh && (!sf || obj.frustumCulled === false || sf.intersectsObject(obj))) { row.shadow += n; shadow += n; }
        const k = obj.isInstancedMesh ? 'inst' : obj.isSprite ? 'sprite' : (Array.isArray(obj.material) ? obj.material[0] : obj.material)?.map ? 'tex' : 'plain';
        row.kinds[k] = (row.kinds[k] || 0) + 1;
      }
      obj.children.forEach((ch, i) => walk(ch, [...path, `${i}${ch.name ? ':' + ch.name : ''}`]));
    };
    s.children.forEach((ch, i) => walk(ch, [`${i}${ch.name ? ':' + ch.name : ''}`]));
    const named = (key) => {
      let obj = s; for (const p of key.split('/')) obj = obj?.children[parseInt(p)];
      if (!obj) return '';
      box.setFromObject(obj); box.getCenter(v);
      return `at ${v.x.toFixed(1)},${v.z.toFixed(1)} size ${box.max.x - box.min.x | 0}x${box.max.z - box.min.z | 0}`;
    };
    const top = [...rows].sort((a, b) => (b[1].main + b[1].shadow) - (a[1].main + a[1].shadow)).slice(0, 40);
    let sprites = 0; s.traverse(o => { if (o.isSprite && o.visible) { let v = true; for (let p = o.parent; p; p = p.parent) v &&= p.visible; if (v) sprites++; } });
    return [`in view ${main}, shadow casters ${shadow}, sprites shown ${sprites}`, ...top.map(([k, r]) => `  ${k.padEnd(16)} main ${String(r.main).padStart(4)} shadow ${String(r.shadow).padStart(4)} meshes ${String(r.meshes).padStart(4)} ${JSON.stringify(r.kinds)} ${named(k)}`)].join('\n');
  }, Number(opt('depth')) || 3);
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
  if (opt('why')) console.log(await why(page));
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
