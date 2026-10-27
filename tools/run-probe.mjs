/* run-probe.mjs  -  memory across one run, fight after fight, on one page (the user's ask, 2026-10-19: the tab still reloads
   mid-run, and tools/budget-check.mjs loads each place fresh, so growth from fight to fight never showed):
     NODE_PATH=$(npm root -g) node tools/run-probe.mjs [--fights=8] [--starter=charmander] [--biome=ruins]
     NODE_PATH=$(npm root -g) node tools/run-probe.mjs --duo=fire,water [--area=powerplant]   (a Duo Run from the lobby)
   A throwaway run on the map; each round taps the first open node, wins a fight outright (battle.js served with a hook),
   skips the reward, and counts on the map again (tools/memory-probe.mjs's count). A ? room, Center or Mart is left
   through its own way out. Growth after the first round is what leaks. */
import { serve, launch, phone, threeCopy, startDuo } from './probe-kit.mjs';

const args = process.argv.slice(2), opt = (k, d) => args.find(a => a.startsWith(`--${k}=`))?.split('=')[1] ?? d;
const FIGHTS = Number(opt('fights', 8));
const HOOK = (path, body) => path === '/js/battle.js'
  ? body.toString() + '\nwindow.__win = () => { if (!battle || battle.over) return false; battle.enemy.hp = 0; finish(true); return true; };\n'
  : body;

const three = await threeCopy(opt('three', ''));
const { server, port } = serve(HOOK);
const browser = await launch();
const { ctx, page, errors } = await phone(browser, three);
const duo = opt('duo', '');
await page.goto(`http://localhost:${port}/${duo ? `?duorun&duopool&coins=500${opt('area', '') && `&${opt('area')}`}` : `?biome=${opt('biome', 'ruins')}&starter=${opt('starter', 'charmander')}`}`);
await page.waitForTimeout(11000);
if (duo) await startDuo(page, duo.split(','));

const screen = () => page.evaluate(() => document.body.dataset.screen || '');
const count = async (label) => {
  const p = await page.evaluate(() => window.__probe());
  const cdp = await ctx.newCDPSession(page), d = await cdp.send('Memory.getDOMCounters');
  await cdp.detach();
  Object.assign(p, { nodes: d.nodes, listeners: d.jsEventListeners });
  console.log(`${label.padEnd(26)} ${String(p.totalMB).padStart(6)} MB  heap ${String(p.heapMB).padStart(5)}  DOM ${p.nodes} / ${p.listeners} listeners  awake ${p.contextsAwake} asleep ${p.contextsAsleep} (${p.asleepHeldMB} MB)  textures ${p.textures}  canvases ${JSON.stringify(p.canvasCount)}`);
  if (label.startsWith('map')) {
    console.log(`    canvases MB ${JSON.stringify(p.canvasMB)}  GL MB ${JSON.stringify(p.glMB)}  audio ${p.audioMB}  images ${p.imagesMB}  bitmaps ${p.bitmapsMB}`);
    const now = Object.fromEntries(p.bySite.map(l => { const [mb, , ...k] = l.split(' '); return [k.join(' '), Number(mb)]; }));
    for (const [k, mb] of Object.entries(now)) if (mb - (seen[k] || 0) >= 1) console.log(`    + ${(mb - (seen[k] || 0)).toFixed(1)} MB ${k}`);
    seen = now;
  }
  return p;
};
let seen = {};

/** Clicks through whatever stands between the run and the map again, for up to `ms`. */
async function backToMap(ms = 40000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const s = await screen();
    if (s === 'map-screen' && await page.evaluate(() => !document.querySelector('dialog[open]'))) return true;
    await page.evaluate(() => {
      if (window.__win?.()) return;
      const vis = (n) => n && n.getClientRects().length && !n.disabled;
      const pick = ['#confirm-yes', '#reward-skip', '.travel-skip', '.evo-skip', '.b3-leave', '.b3-door', '#room-leave', '.room-leave', 'dialog[open] .ds-skip', 'dialog[open] button']
        .map(s => [...document.querySelectorAll(s)].find(vis)).find(Boolean);
      (pick || document.body).click();
    }).catch(() => {});
    await page.waitForTimeout(1500);
  }
  return false;
}

const first = await count('map, start');
let base = null;
for (let i = 1; i <= FIGHTS; i++) {
  const kind = await page.evaluate(() => {
    const b = [...document.querySelectorAll('.map-node')].find(n => !n.disabled && n.matches('.reachable')) ||
      [...document.querySelectorAll('.map-node')].find(n => !n.disabled && n.getClientRects().length);
    if (!b) return null;
    b.click();
    return [...b.classList].find(c => c.startsWith('type-'));
  });
  if (!kind) { console.log('no node to tap'); break; }
  await page.waitForTimeout(9000);
  const there = await count(`  in ${kind} (${await screen()})`);
  if (!(await backToMap())) { console.log(`stuck on ${await screen()}: ${await page.evaluate(() => [...document.querySelectorAll('button')].filter(b => b.getClientRects().length).map(b => `${b.id || b.className}${b.disabled ? '(off)' : ''}`).join(' | '))}`); break; }
  await page.waitForTimeout(6000);
  const p = await count(`map after round ${i}`);
  if (i === 1) base = p;
}
if (base) {
  const p = await page.evaluate(() => window.__probe());
  console.log(`canvases MB ${JSON.stringify(p.canvasMB)}  GL MB ${JSON.stringify(p.glMB)}\nbiggest:\n  ${p.biggest.join('\n  ')}\nby site:\n  ${p.bySite.join('\n  ')}`);
  const last = await count('map, end');
  console.log(`\ngrowth after round 1: ${Math.round((p.totalMB - base.totalMB) * 10) / 10} MB, heap ${Math.round((p.heapMB - base.heapMB) * 10) / 10} MB, ${last.nodes - base.nodes} DOM nodes, ${last.listeners - base.listeners} listeners`);
}
if (errors.length) console.log('\nerrors:\n' + [...new Set(errors)].slice(0, 20).join('\n'));
await browser.close(); server.close();
