/* fx-probe.mjs  -  what the battle's card and move effects (js/cardfx.js, js/movefx.js) cost, and that they clean up
   (the user's ask, 2026-10-28: fps and memory leaks checked before the move effects went to main):
     NODE_PATH=$(npm root -g) node tools/fx-probe.mjs [secs=10] [flat]
   For `secs` it plays a card's flight, then every move's effect in turn, a shield, a heal and every ninth a cut-in, with
   all four statuses' ambience on, and times each frame the effects' loop takes (avg / 95th / worst), the page's frame
   gaps and the most particles at once. Then it checks nothing is left (particles, jobs, the canvas, the tints) and the
   heap (after a forced GC) before, after and after a second round. `flat` runs it on the Signs title without three.js:
   in the 3D arena swiftshader's frames take ~430 ms, which says nothing of the effects. 2026-10-28, flat, 15 s: avg
   1.1 ms, p95 2.2, page frames 16.7 / 16.7 ms, ~445 particles at most, all cleaned up, heap 11.8 -> 12.3 -> 12.4 MB. */
import { serve, launch, phone, threeCopy } from './probe-kit.mjs';
const three = await threeCopy('');
const { server, port } = serve();
const browser = await launch();
const FLAT = process.argv.includes('flat');
const { ctx, page, errors } = await phone(browser, FLAT ? null : three);
await page.addInitScript(() => {
  const raf = window.requestAnimationFrame.bind(window);
  window.__fx = { times: [], frames: [] };
  window.requestAnimationFrame = (cb) => {
    const fx = /\/js\/(cardfx|movefx)\.js/.test(new Error().stack.split('\n').slice(2, 4).join(''));
    return raf((t) => { if (!fx) return cb(t); const s = performance.now(); cb(t); window.__fx.times.push(performance.now() - s); });
  };
  let last = 0; const tick = (t) => { if (last) window.__fx.frames.push(t - last); last = t; raf(tick); }; raf(tick);
});
await page.goto(FLAT ? `http://localhost:${port}/?signs` : `http://localhost:${port}/?arena=wild&starter=charmander`);
await page.waitForTimeout(11000);
const cdp = await ctx.newCDPSession(page);
const heap = async () => { await cdp.send('HeapProfiler.collectGarbage'); return (await cdp.send('Runtime.getHeapUsage')).usedSize / 1e6; };
const h0 = await heap();
const SECS = Number(process.argv[2] || 10);
const res = await page.evaluate(async (secs) => {
  const m = await import('/js/movefx.js'), d = await import('/js/data/move-fx.js'), c = await import('/js/cardfx.js');
  const mk = (l, t, w, h) => { const e = document.createElement('div'); Object.assign(e.style, { position: 'fixed', left: l + 'px', top: t + 'px', width: w + 'px', height: h + 'px' }); document.body.append(e); return e; };
  const A = document.getElementById('player-sprite')?.getClientRects().length ? document.getElementById('player-sprite') : mk(40, 430, 140, 140);
  const B = document.getElementById('enemy-img')?.getClientRects().length ? document.getElementById('enemy-img') : mk(220, 170, 150, 150);
  const hand = document.querySelector('#hand .card') || mk(150, 700, 90, 126);
  const kinds = {}; for (const [id, k] of Object.entries(d.MOVE_FX)) kinds[k] ??= id;
  const list = Object.values(kinds).concat(['zz']);
  const types = ['fire', 'water', 'grass', 'electric', 'ice', 'psychic', 'dark', 'ground', 'flying', 'fighting', 'normal'];
  window.__fx.times.length = 0; window.__fx.frames.length = 0;
  m.ambience(B, { burn: 3, seed: 2, stat: 4, frost: 1 });
  let maxParts = 0; const t0 = performance.now(); let i = 0;
  while (performance.now() - t0 < secs * 1000) {
    const id = list[i % list.length], type = types[i % types.length];
    if (hand) c.flyTrail(hand, B, { type, attack: true });
    await new Promise(r => setTimeout(r, 180));
    m.attackFx({ id, type }, A, B, { power: 0.6 });
    if (i % 3 === 0) m.shieldFx(A); if (i % 4 === 0) m.healFx(A);
    if (i % 9 === 0) await m.cutIn({ name: 'Blast Burn', type });
    for (let k = 0; k < 4; k++) { await new Promise(r => setTimeout(r, 55)); maxParts = Math.max(maxParts, c.kit.parts.length); }
    i++;
  }
  const t = window.__fx.times.slice().sort((a, b) => a - b), f = window.__fx.frames.slice().sort((a, b) => a - b);
  const q = (a, p) => a[Math.floor(a.length * p)]?.toFixed(2);
  const out = { plays: i, maxParts, fxFrames: t.length, fxAvg: (t.reduce((s, x) => s + x, 0) / t.length).toFixed(2), fxP95: q(t, 0.95), fxMax: q(t, 0.999), frameP50: q(f, 0.5), frameP95: q(f, 0.95) };
  m.ambience(B, {});
  await new Promise(r => setTimeout(r, 7000));
  out.after = { parts: c.kit.parts.length, jobs: c.kit.jobs.length, canvas: document.querySelector('.card-fx').width, tints: document.querySelectorAll('.hit-tint').length };
  return out;
}, SECS);
const h1 = await heap();
// a second round, to see the heap doesn't keep climbing
await page.evaluate(async () => { const m = await import('/js/movefx.js'); const A = document.getElementById('player-sprite'), B = document.getElementById('enemy-img'); for (let i = 0; i < 40; i++) { m.attackFx({ id: 'zz', type: 'fire' }, A, B, {}); m.shieldFx(A); await new Promise(r => setTimeout(r, 120)); } await new Promise(r => setTimeout(r, 3000)); });
const h2 = await heap();
console.log(JSON.stringify({ ...res, heapMB: [h0.toFixed(1), h1.toFixed(1), h2.toFixed(1)] }), errors.slice(0, 4));
await browser.close(); server.close();
