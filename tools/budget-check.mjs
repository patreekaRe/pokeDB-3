/* budget-check.mjs  -  the phone's budgets, checked before a push (the user's ask, 2026-10-19: the reload fixes held by a
   check, not by a session remembering them):
     NODE_PATH=$(npm root -g) node tools/budget-check.mjs [--only=clearing,town-shrine] [--update] [--three=<file>]
   Each place is a fresh page at an iPhone 17 Pro's size (tools/probe-kit.mjs). After it settles it counts GL draws a frame,
   the memory it holds (tools/memory-probe.mjs's count: canvases, textures, drawing buffers, audio, images), the 3D places
   awake, page errors, and every canvas still drawn into many times while it can't be seen (the scenery under a 3D fight,
   a title light behind the Clearing: work a phone pays for, for nothing). Then one page walks the Clearing -> mall ->
   Clearing -> Secret Base -> Clearing three times and checks the second and third trips hold no more than the first.
   It fails (exit 1) on a place over its budget in tools/budgets.json: draws or memory more than 10% (and a little) over
   the recorded figure, more 3D places awake than recorded (never over two), a new canvas drawn while hidden, or a page
   error. A change that means to cost more (a bigger town) reruns it with --update, which records today's figures, and
   says so in its commit. Swiftshader's numbers aren't a phone's: compare against the file, not against an iPhone. */
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { serve, launch, phone, threeCopy, root, HUB_PEEK } from './probe-kit.mjs';

const args = process.argv.slice(2), opt = (k) => args.find(a => a.startsWith(`--${k}`))?.split('=')[1] ?? args.includes(`--${k}`);
const BUDGETS = join(root, 'tools/budgets.json');

const PLACES = {
  clearing: '/', base: '?base', yard: '?yard',
  'mall-hall': '?mall', 'mall-2f': '?mall=2f', 'mall-corner': '?mall=corner', 'mall-arcade': '?mall=arcade',
  'mall-outfitter': '?mall=outfitter', 'mall-furniture': '?mall=furniture',
  'town-shrine': '?town=shrine&towns', 'town-wastes': '?town=wastes&towns', 'town-ruins': '?town=ruins&towns',
  'town-thornwood': '?town=thornwood&towns', 'town-savanna': '?town=savanna&towns',
  center: '?center', mart: '?mart', 'event-spring': '?event=spring', gym: '?gym=britt', dojo: '?dojo',
  tower: '?tower=25', 'run-map': '?biome=ruins&starter=charmander',
  'safari-powerplant': '?area=powerplant&intro=0', 'safari-nightalley': '?area=nightalley&intro=0&stage=3&kind=boss',
};
const SETTLE = 11000, TRIPS = 3;

/* In the page: 2D drawing into each on-page canvas, counted while `__watch` is on. */
function watchCanvases() {
  const calls = new Map();
  window.__watch = false;
  for (const m of ['drawImage', 'putImageData', 'fillRect', 'clearRect', 'fill', 'stroke', 'fillText']) {
    const f = CanvasRenderingContext2D.prototype[m];
    CanvasRenderingContext2D.prototype[m] = function (...a) { if (window.__watch) calls.set(this.canvas, (calls.get(this.canvas) || 0) + 1); return f.apply(this, a); };
  }
  const label = (c) => {
    if (c.id) return `#${c.id}`;
    const up = c.parentElement?.closest('[id]');
    return `${up ? `#${up.id} ` : ''}canvas${c.className && typeof c.className === 'string' ? '.' + c.className.trim().split(/\s+/).join('.') : ''}`;
  };
  window.__hiddenDrawn = async (ms) => {
    calls.clear(); window.__watch = true;
    await new Promise(r => setTimeout(r, ms));
    window.__watch = false;
    const out = new Set();
    for (const [c, n] of calls) if (c.isConnected && n >= 20 && !c.checkVisibility({ visibilityProperty: true, opacityProperty: true })) out.add(label(c));
    return [...out].sort();
  };
  window.__drawsAFrame = async () => {
    const frames = [];
    for (let i = 0; i < 12; i++) { const a = window.__drawsAll || 0; await new Promise(r => requestAnimationFrame(r)); frames.push((window.__drawsAll || 0) - a); }
    const per = frames.filter(n => n > 0).sort((a, b) => a - b);
    return per.length ? per[per.length >> 1] : 0;
  };
}

async function measure(page) {
  const draws = await page.evaluate(() => window.__drawsAFrame());
  const hidden = await page.evaluate(() => window.__hiddenDrawn(3000));
  const p = await page.evaluate(() => window.__probe());
  return { draws, mb: p.totalMB, awake: p.contextsAwake, hidden, heap: p.heapMB };
}

async function dom(page) {
  const cdp = await page.context().newCDPSession(page);
  await page.evaluate(() => window.__probe());   // its forced GC first
  const c = await cdp.send('Memory.getDOMCounters');
  await cdp.detach();
  return { nodes: c.nodes, listeners: c.jsEventListeners };
}

const three = await threeCopy(opt('three') || '');
const { server, port } = serve(HUB_PEEK);
const browser = await launch();
const url = (q) => `http://localhost:${port}/${q.replace(/^\//, '')}`;
const only = opt('only') ? String(opt('only')).split(',') : null;
const got = {}, errorsAt = {};

for (const [name, q] of Object.entries(PLACES)) {
  if (only && !only.includes(name)) continue;
  const { ctx, page, errors } = await phone(browser, three);
  await ctx.addInitScript(watchCanvases);
  await page.goto(url(q));
  await page.waitForTimeout(SETTLE);
  got[name] = await measure(page);
  errorsAt[name] = errors;
  console.log(`${name.padEnd(15)} draws ${String(got[name].draws).padStart(4)}  ${String(got[name].mb).padStart(6)} MB  awake ${got[name].awake}${got[name].hidden.length ? `  hidden drawn: ${got[name].hidden.join(', ')}` : ''}${errors.length ? `  ERRORS ${errors.length}` : ''}`);
  await ctx.close();
}

if (!only || only.includes('trips')) {
  const { ctx, page, errors } = await phone(browser, three);
  await ctx.addInitScript(watchCanvases);
  await page.goto(url('/'));
  await page.waitForTimeout(SETTLE);
  const at = [];
  for (let i = 0; i < TRIPS; i++) {
    for (const [go, back] of [['__hub.enterMall()', "import('/js/mall-3d.js').then(m => m.leave())"], ['__hub.enterBase()', "import('/js/base-3d.js').then(m => m.leave())"]]) {
      await page.evaluate(go); await page.waitForTimeout(8000);
      await page.evaluate(back); await page.waitForTimeout(6000);
    }
    const p = await page.evaluate(() => window.__probe());
    at.push({ mb: p.totalMB, heap: p.heapMB, ...(await dom(page)) });
  }
  const [a, z] = [at[0], at[at.length - 1]];
  got.trips = { growthMB: Math.round((z.mb - a.mb) * 10) / 10, growthHeapMB: Math.round((z.heap - a.heap) * 10) / 10, growthNodes: z.nodes - a.nodes, growthListeners: z.listeners - a.listeners };
  errorsAt.trips = errors;
  console.log(`trips x${TRIPS}       after the first: ${got.trips.growthMB} MB, heap ${got.trips.growthHeapMB} MB, ${got.trips.growthNodes} DOM nodes, ${got.trips.growthListeners} listeners${errors.length ? `  ERRORS ${errors.length}` : ''}`);
  await ctx.close();
}
await browser.close(); server.close();

const saved = JSON.parse(await readFile(BUDGETS, 'utf8').catch(() => '{}'));
if (opt('update')) {
  for (const [k, v] of Object.entries(got)) saved[k] = k === 'trips' ? saved.trips ?? { growthMB: 10, growthHeapMB: 4, growthNodes: 300, growthListeners: 30 } : { draws: v.draws, mb: v.mb, awake: v.awake, hidden: v.hidden };
  await writeFile(BUDGETS, JSON.stringify(saved, null, 1) + '\n');
  console.log(`\nrecorded ${Object.keys(got).length} figures in tools/budgets.json`);
}

const fails = [];
for (const [k, v] of Object.entries(got)) {
  for (const e of errorsAt[k] || []) fails.push(`${k}: ${e}`);
  const b = saved[k];
  if (!b) { fails.push(`${k}: no budget recorded (run with --update)`); continue; }
  if (k === 'trips') {
    for (const m of Object.keys(b)) if (v[m] > b[m]) fails.push(`trips: ${m} ${v[m]} over ${b[m]} (something left behind on each trip)`);
    continue;
  }
  if (v.draws > b.draws * 1.1 + 10) fails.push(`${k}: ${v.draws} draws a frame, budget ${b.draws}`);
  if (v.mb > b.mb * 1.1 + 5) fails.push(`${k}: ${v.mb} MB, budget ${b.mb}`);
  if (v.awake > Math.min(2, Math.max(1, b.awake))) fails.push(`${k}: ${v.awake} 3D places awake, budget ${Math.min(2, Math.max(1, b.awake))}`);
  for (const h of v.hidden) if (!b.hidden.includes(h)) fails.push(`${k}: ${h} drawn into while it can't be seen`);
}
if (fails.length) { console.log(`\nOVER BUDGET:\n  ${fails.join('\n  ')}`); process.exit(1); }
console.log('\nwithin budget');
