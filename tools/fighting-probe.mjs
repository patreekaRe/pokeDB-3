/* fighting-probe.mjs  -  Fighting's mechanics in a real fight, headless (docs/duo-design.md section 5, "Fighting's first
   session"): Follow-up after an attack and after a skill (and the hand's glow), Fighting Spirit, Iron Fist, Counter on
   each enemy attack and gone at your turn's start, Revenge and Counter reading the last enemy turn, Bide, Anger Point,
   Counterstance, Sore and the Guts Ability, Reversal, Defiant on a faded Sore, Steadfast, Superpower's Sores, and the
   art, back sprites and cries:
     NODE_PATH=$(npm root -g) node tools/fighting-probe.mjs
   Prints what it checks and exits 1 on a failed check or a console error. */
import { serve, launch, phone, threeCopy } from './probe-kit.mjs';

const HOOK = (path, body) => path === '/js/battle.js'
  ? body.toString() + `
window.__battle = () => battle;
window.__give = (id) => { const card = CARDS_BY_ID[id]; const uid = nextUid++; battle.hand.push({ uid, card }); renderAll(); return uid; };
window.__play = async (id) => { const uid = window.__give(id); await playCard(uid); for (let i = 0; i < 40 && battle.busy; i++) await sleep(100); };
window.__draw = (n) => { draw(n); renderAll(); };
window.__endTurn = async () => { battle.busy = false; await endTurn(); for (let i = 0; i < 60 && (battle.busy || battle.enemyActing); i++) await sleep(100); };
`
  : body;

const three = await threeCopy('');
const { server, port } = serve(HOOK);
const browser = await launch();
const { page, errors } = await phone(browser, three);
let failed = 0;
const check = (ok, what) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`); if (!ok) failed++; };
const ready = async () => { for (let i = 0; i < 40 && await page.evaluate(() => !window.__battle?.() || window.__battle().busy !== false); i++) await page.waitForTimeout(500); };
const B = (fn, arg) => page.evaluate(fn, arg);
const hit = async (id) => { const h = await B(() => window.__battle().enemy.hp); await B((c) => window.__play(c), id); return h - await B(() => window.__battle().enemy.hp); };
const moves = (m) => B((mv) => { const b = window.__battle(); b.def = { ...b.def, moves: [mv] }; b.enemy.moveIndex = 0; }, m);
const calm = () => moves({ kind: 'defend', amount: 0, name: 'Harden', type: 'normal' });
const fresh = () => B(() => { const b = window.__battle(); b.energy = 30; b.enemy.hp = b.enemy.maxHp = 999; b.enemy.block = 0; b.enemy.vulnerable = 0; b.enemy.weak = 0; b.strength = 0; b.block = 0; b.kind = 'fight'; b.hand = []; b.lastKind = null; });

await page.goto(`http://localhost:${port}/?arena=fight&starter=timburr`);
await page.waitForTimeout(8000);
await ready();
let s = await B(() => { const b = window.__battle(); return { type: b.starter.type, ability: b.ability?.id, deck: [...b.drawPile, ...b.hand.map(h => h.card)].length }; });
check(s.type === 'fighting' && s.ability === 'guts' && s.deck === 10, `Timburr is out with Guts, its 10-card deck (${JSON.stringify(s)})`);

await fresh();
await calm();
let n0 = await B(() => window.__battle().hand.length);
await B(() => window.__play('mach-punch'));
s = await B(() => window.__battle().hand.length);
check(s === n0, `Mach Punch as the turn's first card: no Follow-up, no draw (${n0} -> ${s})`);
await B(() => window.__play('rock-smash'));
await B(() => window.__give('mach-punch'));
s = await B(() => !!document.querySelector('#hand .card.in-hand.follow-ready'));
check(s, 'after an attack, Mach Punch glows in hand');
n0 = await B(() => window.__battle().hand.length);
await B(() => { const b = window.__battle(); b.hand = b.hand.filter(h => h.card.id !== 'mach-punch'); });
await B(() => window.__play('mach-punch'));
s = await B(() => window.__battle().hand.length);
check(s === n0, `Mach Punch after Rock Smash: Follow-up (attack) draws 1 (hand back to ${s})`);
await B(() => window.__play('mat-block'));
check(await hit('double-kick') === 12, 'Double Kick after Mat Block: Follow-up (skill), 4 three times');
check(await hit('double-kick') === 8, 'Double Kick after an attack: 4 twice');
await B(() => window.__play('mat-block'));
await B(() => window.__play('karate-chop'));
s = await B(() => window.__battle().enemy.vulnerable);
check(s === 1, `Karate Chop after a skill: Vulnerable 1 (${s})`);
await fresh();
await B(() => window.__play('fighting-spirit'));
await B(() => window.__play('rock-smash'));
let blk = await B(() => window.__battle().block);
await B(() => window.__play('mat-block'));
s = await B(() => window.__battle().block);
check(s === blk + 8 + 3, `Fighting Spirit: a skill after an attack, +3 block (${blk} -> ${s})`);
const e0 = await B(() => { const b = window.__battle(); b.lastKind = null; return b.energy; });
await B(() => window.__play('iron-fist'));
await B(() => { window.__battle().lastKind = null; });
const e1 = await B(() => window.__battle().energy);
await B(() => window.__play('force-palm'));
s = await B(() => window.__battle().energy);
check(e1 === e0 - 2 && s === e1 - 1 + 1, `Iron Fist: Force Palm's Follow-up (skill) with nothing played before it (PP ${e1} -> ${s})`);

// Counter, Revenge, the Counter card, Bide, Anger Point, Counterstance
await page.goto(`http://localhost:${port}/?arena=fight&starter=timburr`);
await page.waitForTimeout(8000);
await ready();
await fresh();
await moves({ kind: 'attack', amount: 9, name: 'Tackle', type: 'normal' });
await B(() => { const b = window.__battle(); b.enemy.dmgBonus = 0; b.enemy.strength = 0; b.dmgMult = 1; });
await B(() => window.__play('anger-point'));
await B(() => window.__play('counterstance'));
await B(() => window.__play('detect'));
s = await B(() => ({ c: window.__battle().counter, badge: [...document.querySelectorAll('#player-status .badge')].map(n => n.title).find(t => /^Counter/.test(t)) }));
check(s.c === 8 && !!s.badge, `Detect: Counter 8 (${s.badge})`);
await B(() => window.__play('bide'));
let pre = await B(() => ({ hp: window.__battle().enemy.hp, me: window.__battle().hp }));
await B(() => window.__endTurn());
s = await B(() => { const b = window.__battle(); return { hp: b.enemy.hp, me: b.hp, c: b.counter, att: b.attackedLast, lost: b.lostLast, str: b.strength, bide: b.bide }; });
const lost1 = pre.me - s.me;
check(pre.hp - s.hp === 8, `the enemy's attack takes Counter 8 back (${pre.hp} -> ${s.hp})`);
check(s.att && s.lost === lost1 && lost1 > 0, `last enemy turn read on yours: attacked, ${s.lost} HP lost`);
check(s.c === 3, `Counter is gone at your turn's start, Counterstance gives 3 (${s.c})`);
check(s.str === 1, `Anger Point: +1 strength for the hit that took HP (${s.str})`);
check(s.bide?.stored === lost1 && s.bide.turns === 1, `Bide stored ${s.bide?.stored} (lost ${lost1}), 1 turn to go`);
await B(() => { const b = window.__battle(); b.strength = 0; b.powers.hurtStrength = 0; b.enemy.hp = 999; });
const rv = await hit('revenge');
check(rv === 12, `Revenge after an attack on you: 6 + 6 (${rv})`);
const ct = await hit('counter');
check(ct === 5 + 2 * lost1, `Counter: 5 + 2 per HP lost (${ct})`);
await B(() => { window.__battle().block = 0; });
pre = await B(() => ({ hp: window.__battle().enemy.hp, me: window.__battle().hp }));
await B(() => window.__endTurn());
s = await B(() => { const b = window.__battle(); return { hp: b.enemy.hp, me: b.hp, bide: b.bide }; });
const lost2 = pre.me - s.me;
check(s.bide === null && pre.hp - s.hp === 3 + 2 * (lost1 + lost2), `Bide lets go: twice ${lost1} + ${lost2}, and Counterstance's 3 (${pre.hp - s.hp})`);
await calm();
await B(() => window.__endTurn());
s = await B(() => ({ att: window.__battle().attackedLast, lost: window.__battle().lostLast }));
check(!s.att && s.lost === 0, `no attack last enemy turn: nothing to read (${JSON.stringify(s)})`);
check(await hit('revenge') === 6, 'Revenge with no attack last turn: 6');

// Guts: Sore, the Ability, Reversal, Defiant, Steadfast, Superpower
await page.goto(`http://localhost:${port}/?arena=fight&starter=timburr`);
await page.waitForTimeout(8000);
await ready();
await fresh();
await calm();
check(await hit('rock-smash') === 8, 'Rock Smash with no status card in hand: 8');
await B(() => window.__play('close-combat'));
s = await B(() => ({ sore: window.__battle().hand.filter(h => h.card.id === 'sore').length, guts: [...document.querySelectorAll('#player-status .badge')].map(n => n.title).find(t => /^Guts/.test(t)), pill: document.getElementById('player-ability').dataset.state }));
check(s.sore === 1 && !!s.guts && s.pill === 'on', `Close Combat adds a Sore; Guts lights up (${s.guts}; pill ${s.pill})`);
check(await hit('rock-smash') === 8 + 3, 'Rock Smash with a Sore in hand: 8 + Guts 3');
check(await hit('reversal') === 6 + 6 + 3, 'Reversal with one status card: 6 + 6 + Guts 3');
await B(() => window.__play('defiant'));
await B(() => window.__play('steadfast'));
await B(() => window.__endTurn());
s = await B(() => { const b = window.__battle(); return { str: b.strength, sore: b.exhaust.filter(c => c.id === 'sore').length }; });
check(s.sore === 1 && s.str === 1, `the Sore fades at the turn's end; Defiant: +1 strength (${JSON.stringify(s)})`);
n0 = await B(() => { const b = window.__battle(); b.drawPile.push(b.hand[0].card, b.exhaust.find(c => c.id === 'sore')); return b.hand.length; });
await B(() => window.__draw(1));
s = await B(() => window.__battle().hand.length);
check(s === n0 + 2, `Steadfast: drawing a Sore draws 1 more (${n0} -> ${s})`);
await B(() => { const b = window.__battle(); b.energy = 10; });
const d0 = await B(() => window.__battle().drawPile.filter(c => c.id === 'sore').length);
await B(() => window.__play('superpower'));
s = await B(() => window.__battle().drawPile.filter(c => c.id === 'sore').length);
check(s === d0 + 2, `Superpower shuffles 2 Sores into the draw pile (${d0} -> ${s})`);

// every Fighting card's art parses, and Timburr's line's back sprites and cries load
s = await B(async () => {
  const { FIGHTING } = await import('/js/card-art-fighting.js');
  const broken = Object.entries(FIGHTING).filter(([, svg]) => new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${svg.replaceAll('$', 'x')}</svg>`, 'image/svg+xml').querySelector('parsererror')).map(([id]) => id);
  const sizes = await Promise.all(['timburr', 'gurdurr', 'conkeldurr'].flatMap(id => [`${id}-back`, `${id}-shiny-back`]).map(f => new Promise(res => { const i = new Image(); i.onload = () => res(i.naturalWidth); i.onerror = () => res(0); i.src = `/assets/pokemon/${f}.gif`; })));
  const cries = await Promise.all(['timburr', 'gurdurr', 'conkeldurr'].map(async id => (await fetch(`/assets/audio/cries/${id}.mp3`)).ok));
  return { n: Object.keys(FIGHTING).length, broken, sizes, cries };
});
check(s.n === 39 && !s.broken.length && s.sizes.every(w => w > 0) && s.cries.every(Boolean), `${s.n} Fighting arts parse${s.broken.length ? ` (broken: ${s.broken.join(', ')})` : ''}; back GIFs ${s.sizes.join(' ')}px; cries ${s.cries.join(' ')}`);

const bad = errors.filter(e => !/favicon|net::|Failed to load resource|cloud|firebase|gstatic/i.test(e));
check(!bad.length, `no console errors${bad.length ? `: ${bad.slice(0, 3).join(' | ')}` : ''}`);
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
