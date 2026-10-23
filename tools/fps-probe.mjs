/* fps-probe.mjs  -  what a place costs the main thread a frame, without a screenshot (the user's ask, 2026-10-21: an fps
   check of the Clearing and the Safari's new areas and duos):
     NODE_PATH=$(npm root -g) node tools/fps-probe.mjs [--only=clearing,safari-*] [--secs=6]
   Each place is a fresh phone (tools/probe-kit.mjs). After it settles, for --secs it times every requestAnimationFrame and
   timer callback the game runs (by the file that scheduled it), the GC (a trace's MinorGC / MajorGC), style and layout
   work, long tasks, GL draws, and CSS animations running on things that can't be seen. Swiftshader draws on the CPU, so
   the frames it manages say nothing of a phone's; the JS a frame costs does (a phone's core is about this machine's):
   at 60 fps a frame has 16.7 ms, and a phone wants the game's share well under half of it. */
import { serve, launch, phone, threeCopy, HUB_PEEK, startDuo } from './probe-kit.mjs';

const args = process.argv.slice(2), opt = (k, d) => args.find(a => a.startsWith(`--${k}=`))?.split('=')[1] ?? d;
const SECS = Number(opt('secs', 6)), SETTLE = 11000;
const AREAS = ['meadow', 'forest', 'wetland', 'marsh', 'peak', 'desert', 'powerplant', 'icecave', 'dojomountain', 'quarry', 'windycliffs', 'nightalley'];
const PLACES = {
  clearing: '/', 'clearing-aura': '/?aura=10', 'clearing-night': '/?time=night', 'clearing-graves': '/?graves=8', base: '/?base', 'mall-hall': '/?mall',
  'town-shrine': '/?town=shrine&towns', 'town-ruins': '/?town=ruins&towns', 'run-map': '/?biome=ruins&starter=charmander',
  ...Object.fromEntries(AREAS.map(a => [`safari-${a}`, `/?area=${a}&intro=0`])),
  ...Object.fromEntries(AREAS.map(a => [`boss-${a}`, `/?area=${a}&intro=0&stage=3&kind=boss`])),
  ...Object.fromEntries(AREAS.map(a => [`storm-${a}`, [`/?area=${a}&intro=0&stage=3&kind=boss`, (page) => page.evaluate(() => import('/js/scene.js').then(m => m.setStorm(true))).then(() => page.waitForTimeout(3000))]])),
  'safari-lobby-duo': ['/?duorun&duopool', (page) => page.evaluate(() => import('/js/safariprep.js').then(m => m.openSafariPrep())).then(() => page.waitForTimeout(1500)).then(() => page.evaluate(() => document.querySelector('#sp-duo').click())).then(() => page.waitForTimeout(2000))],
  'duo-map': ['/?duorun&duopool&coins=500&powerplant', (page) => startDuo(page, ['fire', 'water'])],
  'duo-battle': ['/?duorun&duopool&coins=500&powerplant', (page) => startDuo(page, ['fire', 'water']).then(() => intoFight(page))],
  'duo-battle-ice': ['/?duorun&duopool&coins=500&icecave', (page) => startDuo(page, ['grass', 'water']).then(() => intoFight(page))],
  'clearing-master': '/?master&aura=10',
  // a fight with and without Level 10's foil, the phone's tilt firing every frame as a held phone's does
  battle: ['/?biome=ruins&starter=charmander', (page) => intoFight(page).then(() => tilt(page))],
  'battle-foil': ['/?biome=ruins&starter=charmander&foil=10', (page) => intoFight(page).then(() => tilt(page))],
};

const tilt = (page) => page.evaluate(() => { const go = (t) => { dispatchEvent(Object.assign(new Event('deviceorientation'), { alpha: 0, beta: 45 + Math.sin(t / 900) * 8, gamma: Math.sin(t / 700) * 10 })); requestAnimationFrame(go); }; requestAnimationFrame(go); });

/** From the map into its first fight (tools/duo-probe.mjs's steps). */
async function intoFight(page) {
  for (let i = 0; i < 20 && await page.evaluate(() => document.body.dataset.screen) !== 'battle-screen'; i++) {
    await page.evaluate(() => {
      const vis = (n) => n && n.getClientRects().length && !n.disabled;
      const node = [...document.querySelectorAll('.map-node.reachable, .map-node')].find(n => vis(n) && /fight|wild/.test(n.className + n.dataset.type));
      (node || [...document.querySelectorAll('#confirm-yes, .travel-skip, dialog[open] button')].find(vis) || document.body).click();
    });
    await page.waitForTimeout(1500);
  }
  await page.waitForTimeout(6000);
}

/* In the page, before its scripts: every rAF and timer callback timed, by the first game file on the stack that set it. */
function timeCallbacks() {
  const cost = new Map(), at = () => (new Error().stack.split('\n').slice(2).map(l => l.match(/\/js\/([\w.-]+\.js):(\d+)/)).find(Boolean) || [, 'other', 0]).slice(1).join(':');
  let on = false, frames = 0;
  const timed = (site, cb) => function (...a) {
    if (!on) return cb.apply(this, a);
    const t = performance.now();
    try { return cb.apply(this, a); } finally { const c = cost.get(site) || { ms: 0, n: 0, max: 0 }, d = performance.now() - t; c.ms += d; c.n++; c.max = Math.max(c.max, d); cost.set(site, c); }
  };
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => raf(timed(`raf ${at()}`, cb));
  for (const k of ['setInterval', 'setTimeout']) {
    const f = window[k].bind(window);
    window[k] = (cb, ...r) => typeof cb === 'function' ? f(timed(`${k === 'setInterval' ? 'interval' : 'timeout'} ${at()}`, cb), ...r) : f(cb, ...r);
  }
  const long = [];
  try { new PerformanceObserver(l => { if (on) for (const e of l.getEntries()) long.push(e.duration); }).observe({ type: 'longtask', buffered: false }); } catch {}
  window.__fps = {
    start() { cost.clear(); long.length = 0; frames = 0; on = true; const tick = () => { if (on) { frames++; raf(tick); } }; raf(tick); this.draws0 = window.__drawsAll || 0; },
    stop() {
      on = false;
      const hidden = document.getAnimations().filter(a => a.playState === 'running' && a.effect?.target && !a.effect.target.checkVisibility?.({ visibilityProperty: true, opacityProperty: true }));
      return { frames, draws: (window.__drawsAll || 0) - this.draws0, cost: [...cost].map(([k, v]) => ({ site: k, ...v })), long: [...long],
        anims: document.getAnimations().filter(a => a.playState === 'running').length, hiddenAnims: [...new Set(hidden.map(a => `${a.animationName || a.constructor.name} on ${a.effect.target.id || a.effect.target.className || a.effect.target.tagName}`))].slice(0, 6) };
    },
  };
}

const three = await threeCopy(opt('three', ''));
const { server, port } = serve(HUB_PEEK);
const browser = await launch();
const only = opt('only') ? opt('only').split(',') : null;
const r1 = (x) => Math.round(x * 10) / 10;
const rows = [];

for (const [name, place] of Object.entries(PLACES)) {
  const [q, setup] = Array.isArray(place) ? place : [place];
  if (only && !only.some(o => name === o || (o.endsWith('*') && name.startsWith(o.slice(0, -1))))) continue;
  const { ctx, page, errors } = await phone(browser, three);
  await ctx.addInitScript(timeCallbacks);
  await page.goto(`http://localhost:${port}${q}`);
  await page.waitForTimeout(SETTLE);
  if (setup) await setup(page);
  const where = await page.evaluate(() => document.body.dataset.screen || '');
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Performance.enable');
  const m = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
  await browser.startTracing(page, { categories: ['devtools.timeline', 'v8'] });
  const a = await m();
  await page.evaluate(() => window.__fps.start());
  await page.waitForTimeout(SECS * 1000);
  const got = await page.evaluate(() => window.__fps.stop());
  const z = await m();
  const trace = JSON.parse((await browser.stopTracing()).toString());
  const gc = trace.traceEvents.filter(e => /^(MinorGC|MajorGC)$/.test(e.name) && e.ph === 'X');
  const gcMs = gc.reduce((s, e) => s + e.dur / 1000, 0);
  const js = got.cost.reduce((s, c) => s + c.ms, 0);
  const row = {
    name: setup ? `${name} (${where})` : name, frames: r1(got.frames / SECS), jsPerSec: r1(js / SECS), jsPerFrame: r1(js / Math.max(1, got.frames)),
    taskPerSec: r1((z.TaskDuration - a.TaskDuration) * 1000 / SECS), stylePerSec: r1(((z.RecalcStyleDuration - a.RecalcStyleDuration) + (z.LayoutDuration - a.LayoutDuration)) * 1000 / SECS),
    layouts: r1((z.LayoutCount - a.LayoutCount) / SECS), gcPerSec: r1(gcMs / SECS), gcs: gc.length, long: got.long.length, longMax: r1(Math.max(0, ...got.long)),
    draws: Math.round(got.draws / Math.max(1, got.frames)), anims: got.anims, hiddenAnims: got.hiddenAnims,
    top: got.cost.sort((x, y) => y.ms - x.ms).slice(0, 4).map(c => `${c.site} ${r1(c.ms / SECS)}ms/s x${Math.round(c.n / SECS)} (max ${r1(c.max)})`), errors,
  };
  rows.push(row);
  console.log(`${row.name.padEnd(20)} ${String(row.frames).padStart(3)} fps  JS ${String(row.jsPerFrame).padStart(5)} ms/frame ${String(row.jsPerSec).padStart(6)} ms/s  main ${String(row.taskPerSec).padStart(6)} ms/s  style+layout ${String(row.stylePerSec).padStart(5)} ms/s (${row.layouts} layouts/s)  GC ${row.gcPerSec} ms/s (${row.gcs})  long ${row.long}${row.long ? ` max ${row.longMax}` : ''}  draws ${row.draws}  anims ${row.anims}${row.hiddenAnims.length ? ` hidden: ${row.hiddenAnims.join(', ')}` : ''}${errors.length ? `  ERRORS ${errors.length}: ${errors[0]}` : ''}`);
  console.log(`${''.padEnd(20)} ${row.top.join(' | ')}`);
  await cdp.detach();
  await ctx.close();
}
await browser.close(); server.close();
if (opt('json')) await (await import('node:fs/promises')).writeFile(opt('json'), JSON.stringify(rows, null, 1));
