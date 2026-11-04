/* battle-flows-probe.mjs  -  a whole fight of each kind played out headless on a phone viewport (the double battles' phase 1,
   2026-11-04: `b.enemies[]` with one enemy must play as before): a wild fight to its reward screen, Eternatus rising as
   Eternamax and falling, a Safari catch, and a gym's leader; each with its enemy list checked:
     NODE_PATH=$(npm root -g) node tools/battle-flows-probe.mjs
   Prints what it checks and exits 1 on a failed check or a console error. */
import { serve, launch, phone, threeCopy } from './probe-kit.mjs';

const HOOK = (path, body) => path === '/js/battle.js'
  ? body.toString() + `
window.__battle = () => battle;
window.__render = () => renderAll();
window.__ends = 0;
window.__step = async () => {
  const b = battle; if (!b || b.over) return;
  for (let k = 0; k < 12 && !b.over; k++) {
    const h = b.hand.find(h => !h.card.status && typeof costOf(h.card) === 'number' && costOf(h.card) <= b.energy && !whyNotPlayable(h.card));
    if (!h) break;
    b.busy = false; await playCard(h.uid);
    for (let i = 0; i < 60 && b.busy && !b.over; i++) await sleep(100);
  }
  if (b.over) return;
  b.busy = false; await endTurn();
  for (let i = 0; i < 200 && (b.busy || b.enemyActing) && !b.over; i++) await sleep(100);
};
window.__throw = async (id) => { const b = battle; b.energy = 9; b.busy = false; await throwBall(id); for (let i = 0; i < 120 && (b.busy || b.enemyActing) && !b.over; i++) await sleep(100); };
`
  : path === '/js/run.js'
  ? body.toString() + `
window.__run = () => run;
window.__fight = (enemyId) => fight({ id: 'probe', type: 'fight', enemyId });
`
  : body;

const three = await threeCopy('');
const { server, port } = serve(HOOK);
const browser = await launch();
let failed = 0;
const check = (ok, what) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`); if (!ok) failed++; };

async function open(q) {
  const { ctx, page, errors } = await phone(browser, three);
  // known, on main too (2026-11-04): two music fades at once after a gym win; not this probe's to check
  const known = (e) => /setValueCurveAtTime/.test(e);
  page.on('pageerror', () => { for (let i = errors.length - 1; i >= 0; i--) if (known(errors[i])) errors.splice(i, 1); });
  await page.goto(`http://localhost:${port}/index.html${q}`);
  for (let i = 0; i < 60 && await page.evaluate(() => !window.__battle?.() || window.__battle().busy !== false); i++) {
    await page.waitForTimeout(500);
    await page.mouse.click(200, 400).catch(() => {});
  }
  return { ctx, page, errors };
}
const shape = (page) => page.evaluate(() => { const b = window.__battle(); return { n: b.enemies.length, target: b.target, same: b.enemy === b.enemies[0], def: b.def === b.enemies[0].def, name: b.def.name, hp: b.enemy.hp }; });
async function playOut(page, turns = 40, each = null) {
  for (let t = 0; t < turns; t++) {
    if (await page.evaluate(() => window.__battle().over)) break;
    await page.evaluate(() => window.__step());
    if (each) await each(t);
  }
  return page.evaluate(() => { const b = window.__battle(); return { over: b.over, turn: b.turn, hp: b.hp, foe: b.enemy.hp, acting: b.acting, log: document.getElementById('battle-log')?.textContent?.slice(0, 120) }; });
}

// 1. merge check + a wild fight
{
  const { ctx, page, errors } = await open('?arena=wild&foe=minccino');
  const s = await shape(page);
  check(s.n === 1 && s.target === 0 && s.same && s.def && s.name === 'Minccino', `one enemy in b.enemies, targeted (${JSON.stringify(s)})`);
  // 2×5 in the data; the Clearing wild's +7 shared over 5 hits adds 1 a hit
  const slap = await page.evaluate(() => { const b = window.__battle(); b.enemy.moveIndex = b.def.moves.findIndex(m => m.name === 'Tail Slap'); window.__render(); return document.querySelector('#enemy-intent .intent-value')?.textContent; });
  check(slap === '3×5', `Minccino's Tail Slap (2×5, +1 a hit from the biome) reads 3×5 (${slap})`);
  await page.evaluate(() => { const b = window.__battle(); b.hp = b.maxHp = 400; });
  const r = await playOut(page);
  check(r.over && r.foe <= 0 && r.acting === null, `a wild fight played out to a win (${JSON.stringify(r)})`);
  await page.waitForTimeout(4000);
  const scr = await page.evaluate(() => [...document.querySelectorAll('section')].filter(s => !s.hidden && s.id).map(s => s.id).join());
  check(!scr.includes('battle-screen'), `the fight handed on after the win (${scr})`);
  check(!errors.length, `no console errors (${errors.join(' | ')})`);
  await ctx.close();
}
// 2. a boss with a second form: Eternatus -> Eternamax
{
  const { ctx, page, errors } = await open('?bossfight=depths&hp=0.1');
  const s = await shape(page);
  check(s.n === 1 && s.name === 'Eternatus', `boss: ${s.name}, one enemy`);
  await page.evaluate(() => { const b = window.__battle(); b.hp = b.maxHp = 999; });
  let rose = null;
  const r = await playOut(page, 60, async () => { if (!rose) rose = await page.evaluate(() => { const b = window.__battle(); return b.enemy.phased ? { name: b.def.name, hp: b.enemy.maxHp, n: b.enemies.length } : null; }); });
  check(rose && rose.name === 'Eternamax' && rose.n === 1, `it rose in its second form on the same enemy (${JSON.stringify(rose)})`);
  check(r.over && r.foe <= 0, `the boss fight played out to a win (${JSON.stringify(r)})`);
  check(!errors.length, `no console errors (${errors.join(' | ')})`);
  await ctx.close();
}
// 3. a catch: a Safari wild Pokémon
{
  const { ctx, page, errors } = await open('?bossfight=wetland');
  await page.evaluate(() => window.__fight('psyduck'));
  for (let i = 0; i < 60 && await page.evaluate(() => window.__battle().def.name !== 'Psyduck' || window.__battle().busy); i++) { await page.waitForTimeout(500); await page.mouse.click(200, 400).catch(() => {}); }
  const s = await shape(page);
  check(s.name === 'Psyduck' && await page.evaluate(() => window.__battle().catchable), `a catchable Safari Psyduck (${s.name})`);
  await page.evaluate(() => { const b = window.__battle(); b.hp = b.maxHp = 999; b.enemy.hp = 1; b.enemy.bait = 5; });
  let caught = false;
  for (let i = 0; i < 12 && !caught; i++) {
    await page.evaluate(() => window.__throw('safari'));
    caught = await page.evaluate(() => window.__battle().over);
  }
  check(caught, 'a ball caught it');
  await page.waitForTimeout(3000);
  check(!errors.length, `no console errors (${errors.join(' | ')})`);
  await ctx.close();
}
// 4. a gym
{
  const { ctx, page, errors } = await open('?gym=britt&hp=0.3');
  const s = await shape(page);
  check(s.n === 1, `gym: ${s.name}, one enemy, leader ${await page.evaluate(() => window.__battle().leader?.id)}`);
  await page.evaluate(() => { const b = window.__battle(); b.hp = b.maxHp = 999; });
  const r = await playOut(page, 60);
  check(r.over && r.foe <= 0, `the gym fight played out to a win (${JSON.stringify(r)})`);
  await page.waitForTimeout(3000);
  check(!errors.length, `no console errors (${errors.join(' | ')})`);
  await ctx.close();
}
await browser.close(); server.close();
console.log(failed ? `${failed} FAILED` : 'all ok');
process.exit(failed ? 1 : 0);
