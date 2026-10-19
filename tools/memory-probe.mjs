/* memory-probe.mjs  -  what a page holds in memory, at an iPhone's size, without a screenshot (the user's rule):
   NODE_PATH=$(npm root -g) node tools/memory-probe.mjs [--wait=9] [--standalone] [--three=<file>] '<query>' ['<query>' ...]
   e.g. node tools/memory-probe.mjs '?town=shrine&towns' '?mall=2f' '?base'
   Each query is a fresh page load of the game (402 x 874 at 3x, an iPhone 17 Pro's screen), left to settle for --wait
   seconds; then, after a forced GC, it counts every live 2D canvas (split into smooth paintings, their glow layers and
   the rest), every GL texture and renderbuffer still on an awake context, decoded audio, ImageBitmaps and images, and
   the biggest canvases with where they were made. A query of '+N' instead waits N more seconds on the same page and
   counts again; 'eval:<js>' runs code on it (e.g. 'eval:document.querySelector(".b3-door").click()').
   Round four's sweep (2026-10-18) used a probe like this from the scratchpad; this is it kept. Chromium's numbers
   aren't Safari's (it may share or skip a backing store Safari keeps), so compare runs, not absolutes. */
import { instrument, serve, launch, UA, threeCopy, HUB_PEEK } from './probe-kit.mjs';
import { readFile } from 'node:fs/promises';

const args = process.argv.slice(2);
const opt = (k, d) => { const a = args.find(x => x.startsWith(`--${k}`)); return a ? (a.includes('=') ? a.split('=')[1] : true) : d; };
const steps = args.filter(a => !a.startsWith('--'));
if (!steps.length) { console.log("usage: node tools/memory-probe.mjs [--wait=9] [--standalone] '<query>' ..."); process.exit(1); }
const WAIT = Number(opt('wait', 9)) * 1000;
const { server, port } = serve(HUB_PEEK);

const browser = await launch();
const ctx = await browser.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: UA });
await ctx.addInitScript(instrument);
// the cloud's proxy turns jsDelivr away: --three=<path to three.module.min.js> serves a copy (npm pack three@0.160.0)
const THREE_COPY = await threeCopy(opt('three', ''));
if (THREE_COPY) await ctx.route(/cdn\.jsdelivr\.net\/npm\/three/, async r => r.fulfill({ contentType: 'text/javascript', body: await readFile(THREE_COPY) }));
await ctx.route(/gstatic\.com|googleapis\.com/, r => r.abort());
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|404|firebase|firestore|ERR_/i.test(m.text())) errors.push(`console: ${m.text().slice(0, 200)}`); });

for (const step of steps) {
  if (/^\+\d+$/.test(step)) await page.waitForTimeout(Number(step.slice(1)) * 1000);
  else if (step.startsWith('eval:')) { await page.evaluate(step.slice(5)).catch(e => errors.push(`eval ${step.slice(5, 60)}: ${e.message}`)); await page.waitForTimeout(WAIT); }
  else {
    const q = opt('standalone') && !step.includes('standalone') ? `${step}${step.includes('?') ? '&' : '?'}standalone` : step;
    await page.goto(`http://localhost:${port}/${q.replace(/^\//, '')}`);
    await page.waitForTimeout(WAIT);
  }
  const r = await page.evaluate(() => window.__probe());
  console.log(`\n=== ${step}  (${r.where})  total ~${r.totalMB} MB`);
  console.log(`canvases MB ${JSON.stringify(r.canvasMB)} count ${JSON.stringify(r.canvasCount)}`);
  console.log(`GL MB ${JSON.stringify(r.glMB)} awake ${r.contextsAwake} asleep ${r.contextsAsleep} (holding ${r.asleepHeldMB} MB) textures ${r.textures} | audio ${r.audioMB} (biggest ${r.audioBig.join(', ')}) bitmaps ${r.bitmapsMB} images ${r.imagesMB} heap ${r.heapMB}`);
  console.log('awake since last count: ' + r.drawn.join(' | '));
  console.log('biggest:\n  ' + r.biggest.join('\n  '));
  console.log('by site:\n  ' + r.bySite.join('\n  '));
  const odd = await page.evaluate(() => window.__odd());
  if (odd.length) console.log('glow maps used in canvas pixels:\n  ' + odd.join('\n  '));
}
if (errors.length) console.log('\nerrors:\n' + [...new Set(errors)].slice(0, 20).join('\n'));
await browser.close();
server.close();
