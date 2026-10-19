/* electric-probe.mjs  -  Electric's mechanics in a real fight, headless (docs/duo-design.md section 5): Static on the
   enemy and its badge, the intent's "Paralyzed" once the meter is full, the enemy losing its move and the meter going
   back to 0 with the next cap 5 higher, the Static Ability on an enemy attack, a card's switch alone (it still counts:
   Shock Wave, Wired) and in a Duo Run (the partner comes out free), Shed Shell's free switch, Electrify, Magnet Pull,
   Battery and Rising Voltage's discount; then session 4's: Mareep's look, its new cards (Faraday Cage, Static Storm,
   Electromorphosis, Electric Seed, Dynamo, Volt Retreat, Volt Guard, the switch powers), relics and items:
     NODE_PATH=$(npm root -g) node tools/electric-probe.mjs
   Prints what it checks and exits 1 on a failed check or a console error. */
import { serve, launch, phone, threeCopy } from './probe-kit.mjs';

const HOOK = (path, body) => path === '/js/battle.js'
  ? body.toString() + `
window.__battle = () => battle;
window.__give = (id) => { const card = CARDS_BY_ID[id]; const uid = nextUid++; battle.hand.push({ uid, card }); renderAll(); return uid; };
window.__play = async (id) => { const uid = window.__give(id); await playCard(uid); for (let i = 0; i < 40 && battle.busy; i++) await sleep(100); };
window.__item = (e) => itemEffects(e);
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

// alone: Shinx in a throwaway wild fight
await page.goto(`http://localhost:${port}/?arena=fight&starter=shinx&relics=shed-shell`);
await page.waitForTimeout(8000);
await ready();
let s = await B(() => { const b = window.__battle(); return { type: b.starter.type, ability: b.ability?.id, hand: b.hand.map(h => h.card.id) }; });
check(s.type === 'electric' && s.ability === 'static', `Shinx is out with Static (${s.hand.join(' ')})`);

await B(() => { const b = window.__battle(); b.energy = 10; b.enemy.hp = b.enemy.maxHp = 999; b.kind = 'fight'; });   // a wild one: Paralyzed at 10
await B(() => window.__play('thunder-wave'));
s = await B(() => ({ st: window.__battle().enemy.static, badge: [...document.querySelectorAll('#enemy-status .badge')].map(n => n.title).find(t => /Static/.test(t)) }));
check(s.st === 5 && !!s.badge, `Thunder Wave: Static 5 (${s.badge})`);
await B(() => window.__play('discharge'));
s = await B(() => window.__battle().enemy.hp);
check(s <= 999 - 11, `Discharge counts the Static (enemy at ${s})`);
await B(() => window.__play('spark'));
s = await B(() => ({ st: window.__battle().enemy.static, intent: document.querySelector('#enemy-intent').textContent, title: document.querySelector('#enemy-intent').title }));
check(s.st >= 9, `Spark: Static ${s.st}`);
await B(() => window.__play('nuzzle'));
s = await B(() => ({ st: window.__battle().enemy.static, intent: document.querySelector('#enemy-intent').textContent, cls: document.querySelector('#enemy-intent').className }));
check(s.st >= 10 && /Paralyzed/.test(s.intent) && /paralyzed/.test(s.cls), `a full meter shows on the intent: "${s.intent}"`);
const before = await B(() => ({ hp: window.__battle().hp, move: window.__battle().enemy.moveIndex }));
await B(() => window.__endTurn());
s = await B(() => { const b = window.__battle(); return { hp: b.hp, st: b.enemy.static, paras: b.enemy.paras, move: b.enemy.moveIndex }; });
check(s.paras === 1 && s.st === 0 && s.hp === before.hp && s.move === before.move + 1, `Paralyzed: it lost its move (HP ${before.hp} -> ${s.hp}), Static back to ${s.st}, the next move up`);

// the Static Ability: an enemy attack charges it
await B(() => { const b = window.__battle(); b.def = { ...b.def, moves: [{ kind: 'attack', amount: 3, name: 'Tackle', type: 'normal' }] }; b.enemy.moveIndex = 0; b.block = 99; });
await B(() => window.__endTurn());
s = await B(() => window.__battle().enemy.static);
check(s === 2, `the Static Ability: an attack on you gave it 2 Static (${s})`);

// a card's switch, alone: it still counts
await B(() => { const b = window.__battle(); b.energy = 10; });
await B(() => window.__play('wired'));
const blk = await B(() => window.__battle().block);
await B(() => window.__play('volt-switch'));
s = await B(() => { const b = window.__battle(); return { n: b.switches, turn: b.switchesTurn, block: b.block }; });
check(s.n === 1 && s.turn === 1 && s.block >= blk + 5, `Volt Switch alone counts as a switch (${s.n}), Wired blocked (${blk} -> ${s.block})`);
const e0 = await B(() => window.__battle().energy), h0 = await B(() => window.__battle().hand.length);
await B(() => window.__play('shock-wave'));
s = await B(() => ({ e: window.__battle().energy, h: window.__battle().hand.length }));
check(s.e === e0 && s.h === h0 + 1, `Shock Wave after a switch: +1 PP and a card (PP ${e0} -> ${s.e}, hand ${h0} -> ${s.h})`);

// Overcharge
await B(() => { window.__battle().energy = 3; });
await B(() => window.__play('electrify'));
s = await B(() => window.__battle().energy);
check(s === 4, `Electrify doubles what's left (3 - 1 = 2 -> ${s})`);
await B(() => { const b = window.__battle(); b.drawPile = [...b.drawPile, ...Array(12).fill(b.drawPile[0] ?? b.discard[0])]; b.energy = 1; });
const dp = await B(() => window.__battle().drawPile.length);
await B(() => window.__play('magnet-pull'));
s = await B(() => window.__battle().energy);
check(s === Math.floor(dp / 4), `Magnet Pull: +1 PP per 4 in the draw pile (${dp} cards -> ${s} PP)`);
await B(() => { window.__battle().energy = 5; });
await B(() => window.__play('battery'));
await B(() => { window.__battle().energy = 3; });
await B(() => window.__endTurn());
s = await B(() => window.__battle().energy);
check(s >= 3 + 3, `Battery keeps unspent PP (3 kept, ${s} this turn)`);
await B(() => { window.__battle().energy = 10; });
await B(() => window.__play('rising-voltage'));
s = await B(() => { const b = window.__battle(); const c = [...b.discard].reverse().find(c => c.id === 'rising-voltage'); return c ? c.discount : null; });
check(s === 1, `Rising Voltage's pile copy costs 1 less (discount ${s})`);

// a Duo Run: a card's switch brings the partner out, free; Shed Shell's first chip switch a turn is free
await page.goto(`http://localhost:${port}/?arena=fight&starter=shinx&relics=shed-shell`);
await page.waitForTimeout(6000);
await ready();
const duo = await B(async () => {
  const b = window.__battle();
  const { STARTERS_BY_ID } = await import('/js/data/starters.js');
  b.duo = { run: { ids: ['shinx', 'squirtle'], out: 0 }, types: ['electric', 'water'], came: [0], armed: false, switches: 0, piles: [null, { drawPile: STARTERS_BY_ID.squirtle.deck.map(() => b.hand[0].card), hand: [], discard: [], exhaust: [] }], drew: [true, false] };
  b.energy = 3;
  return true;
});
check(duo, 'a duo set on the fight');
await B(() => window.__play('volt-switch'));
s = await B(() => { const b = window.__battle(); return { out: b.duo.run.out, type: b.starter.type, e: b.energy, hand: b.hand.length, vs: b.duo.piles[0].discard.some(c => c.id === 'volt-switch') }; });
check(s.out === 1 && s.type === 'water' && s.e === 2 && s.vs, `Volt Switch brings Squirtle out free (PP 3 -> ${s.e}), the card in Shinx's discard pile`);
await page.evaluate(() => document.querySelector('#player-bench').click());
await page.waitForTimeout(150);
const goText = await B(() => document.querySelector('#switch-go').textContent);
await page.evaluate(() => document.querySelector('#switch-go').click());
for (let i = 0; i < 20 && await B(() => window.__battle().busy); i++) await page.waitForTimeout(200);
s = await B(() => ({ out: window.__battle().duo.run.out, e: window.__battle().energy }));
check(/Free/.test(goText) && s.out === 0 && s.e === 2, `Shed Shell: "${goText.trim()}", the turn's first chip switch is free (PP ${s.e})`);

// session 4: Mareep (Shinx's deck under another look), the new cards, relics and items
await page.goto(`http://localhost:${port}/?arena=fight&starter=mareep&relics=light-ball,eject-button,zap-plate,electirizer,electric-memory,thunder-stone,bar-magnet`);
await page.waitForTimeout(6000);
await ready();
s = await B(() => { const b = window.__battle(); return { name: b.starter.line[0].name, type: b.starter.type, st: b.enemy.static, hand: b.hand.length, amount: b.ability?.amount }; });
check(s.name === 'Mareep' && s.type === 'electric' && s.st === 3 && s.hand === 6 && s.amount === 4, `Mareep out as Electric, Light Ball's 3 Static, Thunder Stone's 6 cards and Static 4`);
await B(() => { const b = window.__battle(); b.energy = 20; b.enemy.hp = b.enemy.maxHp = 999; b.block = 0; b.kind = 'fight'; });
await B(() => window.__play('faraday-cage'));
s = await B(() => window.__battle().block);
check(s === 13, `Faraday Cage: 10 + 3 Static = ${s} block`);
await B(() => window.__play('static-storm'));
s = await B(() => window.__battle().enemy.static);
check(s === 6, `Static Storm doubles it (${s})`);
await B(() => { window.__battle().block = 0; });
await B(() => window.__play('surge-protector'));
s = await B(() => window.__battle().block);
check(s === 24 + 8, `Zap Plate: a 3-cost card gives 8 more block (${s})`);
const hp0 = await B(() => window.__battle().enemy.hp);
await B(() => window.__play('thunder-shock'));
s = await B((h) => h - window.__battle().enemy.hp, hp0);
check(s >= 10, `Magnet: Thunder Shock deals 8 + 2 (${s})`);
for (const id of ['electromorphosis', 'electric-seed', 'dynamo', 'galvanize', 'minus', 'shock-tactics']) await B((c) => window.__play(c), id);
s = await B(() => Object.keys(window.__battle().powers).join(','));
check(['thornStatic', 'staticBlock', 'energyBlock', 'switchStatic', 'switchSap', 'switchWeak'].every(k => s.includes(k)), `the new powers are on (${s})`);
const sw = await B(() => ({ st: window.__battle().enemy.static, sap: window.__battle().enemy.sap, weak: window.__battle().enemy.weak, block: window.__battle().block }));
await B(() => window.__play('polarity-swap'));
s = await B(() => ({ st: window.__battle().enemy.static, sap: window.__battle().enemy.sap, weak: window.__battle().enemy.weak, block: window.__battle().block }));
check(s.st === sw.st + 3 && s.sap === sw.sap + 1 && s.weak === sw.weak + 1 && s.block === sw.block + 9 + 4, `a switch: Galvanize's Static, Minus's Sap, Shock Tactics' Weak, Eject Button's 4 block (${JSON.stringify(sw)} -> ${JSON.stringify(s)})`);
s = await B(() => { window.__battle().block = 0; return true; });
await B(() => window.__play('volt-guard'));
s = await B(() => window.__battle().block);
check(s === 10 + 3, `Volt Guard: 10 + 3 for the one switch this fight (${s})`);
await B(() => { const b = window.__battle(); b.def = { ...b.def, moves: [{ kind: 'defend', amount: 3, name: 'Harden', type: 'normal' }] }; b.enemy.moveIndex = 0; });
const vr = await B(() => window.__battle().switches);
await B(() => window.__play('volt-retreat'));
s = await B(() => window.__battle().switches);
check(s === vr, `Volt Retreat doesn't switch when no hit is coming (${vr} -> ${s})`);
await B(() => window.__item({ energy: 2, static: 3 }));
const st1 = await B(() => window.__battle().enemy.static);
await B(() => window.__item({ staticMult: 2 }));
s = await B(() => window.__battle().enemy.static);
check(s === st1 * 2, `Electric Gem's Static 3, Shock Drive doubles it (${st1} -> ${s})`);
// a Paralysis: Electric Memory keeps half, Electirizer draws 2 more; the next turn Electric Seed blocks and Dynamo's spare PP did
await B(() => { const b = window.__battle(); b.enemy.static = 20; b.energy = 2; b.block = 0; });
await B(() => window.__endTurn());
s = await B(() => { const b = window.__battle(); return { st: b.enemy.static, paras: b.enemy.paras, hand: b.hand.length, block: b.block }; });
check(s.paras === 1 && s.st === 10 && s.hand === 8 && s.block === 10, `Paralyzed: Electric Memory left ${s.st} Static, Electirizer drew ${s.hand}, Electric Seed blocked ${s.block}`);
await B(() => { const b = window.__battle(); b.def = { ...b.def, moves: [{ kind: 'attack', amount: 3, name: 'Tackle', type: 'normal' }] }; b.enemy.moveIndex = 0; b.enemy.static = 0; b.block = 99; b.energy = 0; });
await B(() => window.__endTurn());
s = await B(() => window.__battle().enemy.static);
check(s === 4 + 2, `an attack on you: Static 4 (Thunder Stone) + Electromorphosis 2 = ${s}`);

const bad = errors.filter(e => !/favicon|net::|Failed to load resource|cloud|firebase|gstatic/i.test(e));
check(!bad.length, `no console errors${bad.length ? `: ${bad.slice(0, 3).join(' | ')}` : ''}`);
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
