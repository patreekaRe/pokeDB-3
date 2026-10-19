/* electric-probe.mjs  -  Electric's mechanics in a real fight, headless (docs/duo-design.md section 5): Static on the
   enemy and its badge, the intent's "Paralyzed" once the meter is full, the enemy losing its move and the meter going
   back to 0 with the next cap 5 higher, the Static Ability on an enemy attack, a card's switch alone (it still counts:
   Shock Wave, Wired) and in a Duo Run (the partner comes out free), Shed Shell's free switch, Electrify, Magnet Pull,
   Battery and Rising Voltage's discount:
     NODE_PATH=$(npm root -g) node tools/electric-probe.mjs
   Prints what it checks and exits 1 on a failed check or a console error. */
import { serve, launch, phone, threeCopy } from './probe-kit.mjs';

const HOOK = (path, body) => path === '/js/battle.js'
  ? body.toString() + `
window.__battle = () => battle;
window.__give = (id) => { const card = CARDS_BY_ID[id]; const uid = nextUid++; battle.hand.push({ uid, card }); renderAll(); return uid; };
window.__play = async (id) => { const uid = window.__give(id); await playCard(uid); for (let i = 0; i < 40 && battle.busy; i++) await sleep(100); };
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
const B = (fn) => page.evaluate(fn);

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

const bad = errors.filter(e => !/favicon|net::|Failed to load resource|cloud|firebase|gstatic/i.test(e));
check(!bad.length, `no console errors${bad.length ? `: ${bad.slice(0, 3).join(' | ')}` : ''}`);
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
