/* enemy-probe.mjs  -  smarter enemies in a real fight, headless (2026-11-04; the rules in js/data/enemies.js' header):
   a multi-hit move's intent ("5×3"), each hit through what block the ones before it left, Rocky Helmet on every hit, a
   Guard stopping the whole move, the half-HP move coming once and the loop picking up after it, an Alpha's Frenzy, and
   a random order never using one move three turns running:
     NODE_PATH=$(npm root -g) node tools/enemy-probe.mjs
   Prints what it checks and exits 1 on a failed check or a console error. */
import { serve, launch, phone, threeCopy } from './probe-kit.mjs';

const HOOK = (path, body) => path === '/js/battle.js'
  ? body.toString() + `
window.__battle = () => battle;
window.__endTurn = async () => { battle.busy = false; await endTurn(); for (let i = 0; i < 80 && (battle.busy || battle.enemyActing); i++) await sleep(100); };
window.__render = () => renderAll();
`
  : body;

const three = await threeCopy('');
const { server, port } = serve(HOOK);
const browser = await launch();
const { page, errors } = await phone(browser, three);
let failed = 0;
const check = (ok, what) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`); if (!ok) failed++; };
const B = (fn, arg) => page.evaluate(fn, arg);
const ready = async () => { for (let i = 0; i < 40 && await B(() => !window.__battle?.() || window.__battle().busy !== false); i++) await page.waitForTimeout(500); };
const intent = () => B(() => { window.__render(); const box = document.getElementById('enemy-intent'); return { value: box.querySelector('.intent-value')?.textContent, title: box.title }; });
/** A calm, long fight against `def`'s moves: lots of HP both sides, nothing on either. */
const setUp = (o) => B((o) => {
  const b = window.__battle();
  b.def = { ...b.def, ...o.def };
  Object.assign(b.enemy, { hp: o.hp ?? 999, maxHp: 999, block: 0, strength: 0, dmgBonus: 0, weak: 0, vulnerable: 0, moveIndex: o.at ?? 0, recent: [], halfUsed: false, burn: 0, seed: 0, static: 0, frostbite: 0, fault: 0 });
  Object.assign(b, { hp: 200, maxHp: 200, block: o.block ?? 0, guard: !!o.guard, evasion: 0, hand: [], kind: 'fight', turn: 1 });
  b.relics = o.relics ?? [];
}, o);

await page.goto(`http://localhost:${port}/?arena=wild&foe=sentret&starter=bulbasaur`);
await page.waitForTimeout(8000);
await ready();
check(await B(() => window.__battle()?.def.name === 'Sentret'), '&foe=sentret walks into a Sentret');

const swipes = { kind: 'attack', name: 'Fury Swipes', amount: 5, hits: 3, type: 'normal' };
await setUp({ def: { moves: [swipes, { kind: 'defend', name: 'Harden', amount: 1 }], order: undefined, atHalf: undefined }, block: 7 });
let s = await intent();
check(s.value === '5×3', `the intent reads 5×3 (${s.value}: ${s.title})`);
let hp0 = await B(() => window.__battle().hp);
await B(() => window.__endTurn());
s = await B(() => ({ hp: window.__battle().hp, block: window.__battle().block }));
check(hp0 - s.hp === 8, `3 hits of 5 into 7 block: 8 through (${hp0 - s.hp})`);

await setUp({ def: { moves: [swipes] }, guard: true });
hp0 = await B(() => window.__battle().hp);
await B(() => window.__endTurn());
check(await B(() => window.__battle().hp) === hp0, 'a Guard stops all three hits');

await setUp({ def: { moves: [swipes] } });
await B(() => window.__battle().relics.push('rocky-helmet'));
let e0 = await B(() => window.__battle().enemy.hp);
await B(() => window.__endTurn());
check(e0 - await B(() => window.__battle().enemy.hp) === 9, 'Rocky Helmet hits back on each of 3 hits (9)');

const rage = { kind: 'buff', name: 'Rage', amount: 3 };
await setUp({ def: { moves: [{ kind: 'attack', name: 'Tackle', amount: 1 }, { kind: 'defend', name: 'Harden', amount: 2 }], atHalf: rage }, hp: 600 });
s = await intent();
check(s.title.includes('Tackle'), `above half HP: the loop's Tackle (${s.title})`);
await B(() => { window.__battle().enemy.hp = 400; });
s = await intent();
check(s.title.includes('Rage'), `at or under half HP: Rage comes up at once (${s.title})`);
await B(() => window.__endTurn());
s = await B(() => ({ str: window.__battle().enemy.strength, used: window.__battle().enemy.halfUsed }));
check(s.str >= 3 && s.used, `Rage used once (+${s.str} strength)`);
s = await intent();
check(s.title.includes('Tackle'), `then the loop picks up where it was (${s.title})`);

const elite = await B(async () => { const { eliteOf, ENEMY_DEFS } = await import('./js/data/enemies.js'); return eliteOf(ENEMY_DEFS.sentret).atHalf; });
check(elite?.name === 'Frenzy' && elite.hits === 3, `an Alpha's half-HP move is a 3-hit Frenzy (${JSON.stringify(elite)})`);

await setUp({ def: { order: 'random', atHalf: undefined, moves: [{ kind: 'defend', name: 'Harden', amount: 1, weight: 30 }, { kind: 'buff', name: 'Growl', amount: 0 }] } });
const used = [];
for (let t = 0; t < 12; t++) { used.push((await intent()).title.includes('Harden') ? 'H' : 'G'); await B(() => { window.__battle().turn = 1; return window.__endTurn(); }); }
check(!/HHH|GGG/.test(used.join('')), `a random order never uses one move three turns running (${used.join('')})`);

await page.goto(`http://localhost:${port}/?arena=wild&foe=kangaskhan&starter=bulbasaur`);
await page.waitForTimeout(8000);
await ready();
await B(() => { const e = window.__battle().enemy; e.hp = Math.floor(e.maxHp / 2); });
s = await intent();
check(/^\d+×4$/.test(s.value) && s.title.includes('Comet Punch'), `Kangaskhan at half HP: Comet Punch, 4 hits (${s.value}: ${s.title})`);

check(!errors.length, `no console errors${errors.length ? `: ${errors.join(' | ')}` : ''}`);
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
