/* ground-probe.mjs  -  Ground's mechanics in a real fight, headless (docs/duo-design.md section 5, "Ground's first
   session"): Dig cards going underground and surfacing at your next turn's start (their hits and blocks, Arena Trap,
   Excavate, Earth Power), Fault and its knock-out (half on an Alpha), Stomping Tantrum, Precipice Blades, Quicksand,
   Sandstorm's chip and its +3 on Ground blocks, Mud-Slap, Sand Force, Desert Spirit, Sand Stream, the Sturdy Ability;
   session 10's half (Trench, Bunker, Foxhole, Hibernate, Earth Wall, Rubble Wall, Groundswell, Tectonics, Sand Screen,
   Blinding Sand, Endless Sands), Ground's relics and items, Rhyhorn's look and the Quarry; and the art, back sprites and cries:
     NODE_PATH=$(npm root -g) node tools/ground-probe.mjs
   Prints what it checks and exits 1 on a failed check or a console error. */
import { serve, launch, phone, threeCopy } from './probe-kit.mjs';

const HOOK = (path, body) => path === '/js/battle.js'
  ? body.toString() + `
window.__battle = () => battle;
window.__give = (id) => { const card = CARDS_BY_ID[id]; const uid = nextUid++; battle.hand.push({ uid, card }); renderAll(); return uid; };
window.__play = async (id) => { const uid = window.__give(id); await playCard(uid); for (let i = 0; i < 40 && battle.busy; i++) await sleep(100); };
window.__render = () => renderAll();
window.__why = (id) => whyNotPlayable(CARDS_BY_ID[id]);
window.__whyThrow = () => whyNotThrow();
window.__settle = async () => { for (let i = 0; i < 80 && (battle.busy || battle.enemyActing); i++) await sleep(100); };
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
const hit = async (id) => { const h = await B(() => window.__battle().enemy.hp); await B((c) => window.__play(c), id); return h - await B(() => window.__battle().enemy.hp); };
const gain = async (id) => { const b0 = await B(() => window.__battle().block); await B((c) => window.__play(c), id); return await B(() => window.__battle().block) - b0; };
const moves = (m) => B((mv) => { const b = window.__battle(); b.def = { ...b.def, moves: [mv] }; b.enemy.moveIndex = 0; }, m);
const calm = () => moves({ kind: 'defend', amount: 0, name: 'Harden', type: 'normal' });
const fresh = () => B(() => { const b = window.__battle(); b.energy = 30; b.enemy.hp = b.enemy.maxHp = 999; b.enemy.block = 0; b.enemy.vulnerable = 0; b.enemy.weak = 0; b.enemy.fault = 0; b.strength = 0; b.block = 0; b.kind = 'fight'; b.hand = []; b.underground = []; b.weather = null; b.drawPile = Array.from({ length: 20 }, () => b.drawPile[0] ?? b.discard[0]); });
const open = async (extra = '') => {
  await page.goto(`http://localhost:${port}/?arena=fight&starter=trapinch${extra}`);
  await page.waitForTimeout(8000);
  await ready();
  await fresh();
  await calm();
};

await open();
let s = await B(() => { const b = window.__battle(); return { type: b.starter.type, ability: b.ability?.id, deck: [...b.drawPile, ...b.hand.map(h => h.card)].length }; });
check(s.type === 'ground' && s.ability === 'sturdy', `Trapinch is out with Sturdy (${JSON.stringify(s)})`);

// Dig (Dig, Tunnel, Burrow): your Pokémon goes under with the card, out of sight, and the turn ends by itself; it surfaces
// at your next turn's start. Bury cards go under alone and the turn goes on (the user's call, 2026-10-28)
const turn0 = await B(() => window.__battle().turn);
let pre = await B(() => window.__battle().enemy.hp);
const digging = B(() => window.__play('dig'));
await page.waitForFunction(() => window.__battle().enemyActing || window.__battle().turn > 1, null, { timeout: 15000 });
s = await B(() => { const b = window.__battle(); return { dug: b.dug, hidden: document.getElementById('player-sprite').classList.contains('dug'), under: b.underground.map(u => u.card.id), inDiscard: b.discard.some(c => c.id === 'dig'), badge: [...document.querySelectorAll('#player-status .badge')].map(n => n.title).find(t => /^Underground/.test(t)) }; });
check(s.dug && s.hidden && s.under.join() === 'dig' && !s.inDiscard && !!s.badge, `Dig: Trapinch goes under with the card, out of sight, and its turn ends by itself (${JSON.stringify(s)})`);
await digging;
await B(() => window.__settle());
s = await B(() => { const b = window.__battle(); return { turn: b.turn, hp: b.enemy.hp, dug: b.dug, hidden: document.getElementById('player-sprite').classList.contains('dug'), under: b.underground.length, disc: b.discard.filter(c => c.id === 'dig').length }; });
check(s.turn === turn0 + 1 && pre - s.hp === 12 && !s.dug && !s.hidden && s.under === 0 && s.disc === 1, `next turn it surfaces: back in sight, 12 damage, Dig to the discard pile (${JSON.stringify(s)})`);
s = await B(() => window.__why('tunnel'));
check(s === null, `a fresh turn can play again (${s})`);
await B(() => window.__play('hunker-down'));
s = await B(() => { const b = window.__battle(); return { turn: b.turn, dug: b.dug, busy: b.busy, under: b.underground.map(u => u.card.id) }; });
check(s.turn === turn0 + 1 && !s.dug && !s.busy && s.under.join() === 'hunker-down', `Bury (Hunker Down): the card goes under, the turn goes on (${JSON.stringify(s)})`);
pre = await B(() => window.__battle().enemy.hp);
await B(() => window.__endTurn());
check(pre === await B(() => window.__battle().enemy.hp) && await B(() => window.__battle().block) === 4, 'Hunker Down surfaces: block 4');

// a wild Pokémon's Dig: out of reach for a turn (your attacks can't be played, other hits miss), then it strikes
await fresh();
await B(() => { const b = window.__battle(); b.def = { ...b.def, moves: [{ kind: 'away', name: 'Dig', type: 'ground', how: 'dig' }, { kind: 'attack', amount: 10, name: 'Dig', type: 'ground' }] }; b.enemy.moveIndex = 0; });
await B(() => window.__render());
s = await B(() => document.getElementById('enemy-intent').title);
check(/underground/.test(s) && /Dig deals \d+ damage/.test(s), `the intent warns it goes underground, then the hit to come (${s})`);
const hp0 = await B(() => window.__battle().hp);
await B(() => window.__endTurn());
s = await B(() => { const b = window.__battle(); return { away: b.enemy.away, cls: document.getElementById('enemy-portrait-box').classList.contains('away-dig'), hp: b.hp, why: window.__why('mud-shot'), throwWhy: window.__whyThrow() }; });
check(s.away === 'dig' && s.cls && s.hp === hp0, `it digs in, out of sight, and doesn't hit (${JSON.stringify(s)})`);
check(/underground/.test(s.why || '') && /underground/.test(s.throwWhy || ''), `attacks and throws can't reach it (${s.why}; ${s.throwWhy})`);
pre = await B(() => window.__battle().enemy.hp);
await B(() => window.__play('mud-shot'));
await B(() => window.__play('sand-veil'));
check(pre === await B(() => window.__battle().enemy.hp) && await B(() => window.__battle().block) >= 8, 'Mud Shot does nothing; Sand Veil still blocks');
await B(() => { const b = window.__battle(); b.block = 0; });
await B(() => window.__endTurn());
s = await B((h) => { const b = window.__battle(); return { away: b.enemy.away, cls: document.getElementById('enemy-portrait-box').classList.contains('away-dig'), lost: h - b.hp }; }, hp0);
check(!s.away && !s.cls && s.lost > 0, `it pops up and strikes (${JSON.stringify(s)})`);
await calm();

await fresh();
await B(() => window.__play('hunker-down'));
await B(() => window.__play('hunker-down'));
check(await hit('earth-power') === 6 + 12, 'Earth Power with 2 cards underground: 6 + 6 x2');
await B(() => window.__play('arena-trap'));
await B(() => window.__play('excavate'));
await B(() => window.__play('shore-up'));
pre = await B(() => window.__battle().enemy.hp);
await B(() => window.__endTurn());
s = await B(() => { const b = window.__battle(); return { hp: b.enemy.hp, hand: b.hand.length, block: b.block }; });
check(pre - s.hp === 7 * 3, `three surface: Excavate's 7 each (${pre - s.hp})`);
check(s.hand === 5 + 3, `Arena Trap: a card for each that surfaced (hand ${s.hand})`);
check(s.block === 4 + 4 + 8, `two Hunker Downs' and Shore Up's Surface: block 16 on the new turn (${s.block})`);

// Fault
await open();
await B(() => window.__play('mud-sport'));
s = await B(() => ({ f: window.__battle().enemy.fault, badge: [...document.querySelectorAll('#enemy-status .badge')].map(n => n.title).find(t => /^Fault/.test(t)) }));
check(s.f === 8 && !!s.badge, `Mud Sport: Fault 8 (${s.badge})`);
check(await hit('stomping-tantrum') === 6 + 8, 'Stomping Tantrum: 6 + 1 per Fault');
await B(() => window.__play('precipice-blades'));
check(await B(() => window.__battle().enemy.fault) === 16, 'Precipice Blades doubles the Fault');
await B(() => window.__play('quicksand'));
await B(() => { const b = window.__battle(); b.kind = 'elite'; b.enemy.hp = 10; });
await B(() => window.__render());
s = await B(() => [...document.querySelectorAll('#enemy-status .badge')].map(n => n.textContent + ' ' + n.title).find(t => /Fault/.test(t)));
await B(() => window.__endTurn());
let t = await B(() => { const b = window.__battle(); return { over: b.over, hp: b.enemy.hp, f: b.enemy.fault }; });
check(!t.over && t.hp === 10 && t.f === 19, `an Alpha at 10 HP with Fault 16 counts 8: it stands; Quicksand +3 (${JSON.stringify(t)}; ${s})`);
await B(() => { const b = window.__battle(); b.kind = 'fight'; b.enemy.hp = 19; });
await B(() => window.__endTurn());
t = await B(() => { const b = window.__battle(); return { over: b.over, hp: b.enemy.hp, by: b.felledBy }; });
check(t.over && t.hp === 0 && t.by === 'fault', `a wild one at 19 HP with Fault 19: knocked out at its turn's start (${JSON.stringify(t)})`);

// Sandstorm and its payoffs
await open();
check(await gain('sand-veil') === 8, 'Sand Veil with no weather: 8');
await B(() => window.__play('sandstorm'));
s = await B(() => window.__battle().weather);
check(s?.kind === 'sand' && s.turns === 4, `Sandstorm 4 (${JSON.stringify(s)})`);
check(await gain('sand-veil') === 8 + 3, 'Sand Veil in Sandstorm: 8 + 3');
check(await gain('sand-attack') === 10 + 3, 'Sand Attack in Sandstorm: 10 + 3');
check(await hit('mud-shot') === 8, 'Mud Shot in Sandstorm: 8 (only blocks gain)');
await B(() => window.__play('mud-slap'));
check(await B(() => window.__battle().enemy.weak) === 2, 'Mud-Slap in Sandstorm: Weak 2');
await B(() => window.__play('sand-force'));
check(await hit('mud-shot') === 8 + 2, 'Sand Force: +2 on every hit in Sandstorm');
check(await hit('lands-wrath') === 12 + 8 + 2, "Land's Wrath in Sandstorm: 12 + 8, and Sand Force's 2");
await B(() => window.__play('desert-spirit'));
await B(() => window.__play('sand-stream'));
pre = await B(() => window.__battle().enemy.hp);
await B(() => window.__endTurn());
s = await B((p0) => { const b = window.__battle(); return { lost: p0 - b.enemy.hp, f: b.enemy.fault, w: b.weather }; }, pre);
check(s.lost === 3 && s.f === 3 + 4, `the sandstorm's chip 3 and Desert Spirit's Fault 4 (on Sand Attack's 3) (${JSON.stringify(s)})`);
check(s.w?.kind === 'sand' && s.w.turns === 4, `a turn goes, Sand Stream adds one back (${JSON.stringify(s.w)})`);
await B(() => window.__play('hail'));
s = await B(() => window.__battle().weather);
check(s?.kind === 'hail', 'Hail replaces the Sandstorm');

// Sturdy
await open();
await moves({ kind: 'attack', amount: 60, name: 'Mega Kick', type: 'normal' });
await B(() => { const b = window.__battle(); b.hp = 20; b.block = 0; b.relics = b.relics.filter(r => r !== 'focus-sash'); b.sashReady = false; });
await B(() => window.__endTurn());
s = await B(() => { const b = window.__battle(); return { hp: b.hp, used: b.sturdy, over: b.over }; });
check(s.hp === 1 && s.used && !s.over, `Sturdy: a knock-out hit leaves you at 1 HP, once (${JSON.stringify(s)})`);

// session 10: the defensive half
await open();
await B(() => window.__play('hunker-down'));
await B(() => window.__play('hunker-down'));
check(await gain('trench') === 6 + 3 * 2, 'Trench with 2 cards underground: 6 + 3 x2');
check(await gain('bunker') === 6 + 4 * 2, 'Bunker with 2 cards underground: 6 + 4 x2, then it digs in too');
await B(() => window.__play('foxhole'));
check(await gain('hunker-down') === 2 + 3, 'Foxhole: 3 block as Hunker Down goes under, on its own 2');
await B(() => window.__play('hibernate'));
await B(() => window.__endTurn());
s = await B(() => { const b = window.__battle(); return { block: b.block, hand: b.hand.length, under: b.underground.length }; });
check(s.block === 4 + 15 && s.hand === 5 + 1 && s.under === 0, `next turn Hunker Down's 4 and Hibernate's 15 surface, Bunker draws 1 (${JSON.stringify(s)})`);

await fresh();
check(await gain('earth-wall') === 8, 'Earth Wall with no Fault: 8');
await B(() => window.__play('mud-sport'));
check(await gain('earth-wall') === 8 + 4, 'Earth Wall on Fault: 8 + 4');
check(await gain('rubble-wall') === 8 + 8, 'Rubble Wall on Fault 8: 8 + 8');
await B(() => window.__play('rumble'));
check(await B(() => window.__battle().enemy.weak) === 2, 'Rumble on Fault: Weak 2');
await fresh();
await B(() => window.__play('groundswell'));
s = await B(() => { const b = window.__battle(); return { block: b.block, fault: b.enemy.fault }; });
check(s.block === 8 && s.fault === 8, `Groundswell: block 8, then Fault 8 (${JSON.stringify(s)})`);
await B(() => window.__play('tectonics'));
check(await gain('mud-bomb') === 3, 'Tectonics: 3 block whenever you apply Fault');

await fresh();
await B(() => window.__play('sandstorm'));
await B(() => window.__play('sand-screen'));
await B(() => window.__play('blinding-sand'));
await moves({ kind: 'attack', amount: 20, name: 'Tackle', type: 'normal' });
await B(() => { const b = window.__battle(); b.hp = b.maxHp = 200; b.block = 0; b.enemy.dmgBonus = 0; });
await B(() => window.__endTurn());
s = await B(() => 200 - window.__battle().hp);
check(s === 15 - 4, `Sand Screen's 4 block and Blinding Sand's Weak on the chip: a 20 hit lands as 15 - 4 (${s})`);

// Ground's relics and items
await page.goto(`http://localhost:${port}/?arena=fight&starter=rhyhorn&relics=earth-plate,light-clay,shuca-berry,smooth-rock,ground-memory,groundium-z,soft-sand`);
await page.waitForTimeout(8000);
await ready();
s = await B(() => { const b = window.__battle(); return { f: b.enemy.fault, look: b.starter.line.map(l => l.id).join(), sturdy: b.ability?.amount, deck: b.starter.deck.join() }; });
check(s.f === 6, `Earth Plate: the enemy starts with Fault 6 (${s.f})`);
check(s.look === 'rhyhorn,rhydon,rhyperior' && s.sturdy === 2, `Rhyhorn plays Trapinch's deck; Groundium Z: Sturdy twice (${JSON.stringify(s)})`);
await fresh();
await calm();
check(await gain('mud-bomb') === 2, 'Light Clay: 2 block whenever you apply Fault');
check(await gain('hunker-down') === 2 + 3, 'Shuca Berry: 3 block as a card goes underground');
check(await hit('mud-shot') === 8 + 2, 'Soft Sand: Ground attacks +2');
await B(() => window.__play('endless-sands'));
s = await B(() => window.__battle().weather);
check(s?.kind === 'sand' && s.turns === 3 + 3, `Smooth Rock: Endless Sands' Sandstorm 3 lasts 3 more (${JSON.stringify(s)})`);
await B(() => window.__endTurn());
s = await B(() => window.__battle().weather);
check(s?.turns === 6, `Endless Sands: the Sandstorm doesn't run out (${JSON.stringify(s)})`);
await fresh();
await B(() => window.__item({ block: 8, fault: 8 }));
await B(() => window.__item({ faultMult: 2 }));
s = await B(() => { const b = window.__battle(); return { block: b.block, f: b.enemy.fault }; });
check(s.block === 8 + 2 && s.f === 16, `Ground Gem: block 8, Fault 8 (Light Clay's 2); Terrain Extender doubles it (${JSON.stringify(s)})`);
await B(() => { const b = window.__battle(); b.kind = 'boss'; b.enemy.hp = 16; });
await B(() => window.__endTurn());
t = await B(() => { const b = window.__battle(); return { over: b.over, by: b.felledBy }; });
check(t.over && t.by === 'fault', `Ground Memory: a boss at 16 HP with Fault 16 counts all of it (${JSON.stringify(t)})`);
await page.goto(`http://localhost:${port}/?arena=fight&starter=rhyhorn&relics=groundium-z`);
await page.waitForTimeout(8000);
await ready();
await fresh();
await moves({ kind: 'attack', amount: 60, name: 'Mega Kick', type: 'normal' });
await B(() => { const b = window.__battle(); b.hp = 20; b.relics = b.relics.filter(r => r !== 'focus-sash'); b.sashReady = false; });
await B(() => window.__endTurn());
await B(() => { window.__battle().block = 0; });
await B(() => window.__endTurn());
s = await B(() => { const b = window.__battle(); return { hp: b.hp, used: b.sturdy, over: b.over }; });
check(s.hp === 1 && s.used === 2 && !s.over, `Groundium Z: Sturdy saves you twice (${JSON.stringify(s)})`);

// the Quarry
s = await B(async () => {
  const { SAFARI_AREAS_BY_ID, safariAreasOn, SAFARI_FROM } = await import('/js/data/safari.js');
  const q = SAFARI_AREAS_BY_ID.quarry;
  const before = safariAreasOn('2026-10-01').map(a => a.id);
  const desertBefore = safariAreasOn('2026-10-01').find(a => a.id === 'desert').normals.includes('trapinch');
  return { n: q.normals.length + q.rares.length, rares: q.rares.join(), stages: q.stages.join(), from: SAFARI_FROM.quarry, before: before.includes('quarry'), desertBefore, drilbur: q.normals.includes('drilbur') };
});
check(s.n === 40 && !s.drilbur && s.stages === 'Dig Site,Mudflats,Sinkhole,Fault Line' && !s.before && s.desertBefore, `the Quarry: 40 Pokémon, rares ${s.rares}; a day before ${s.from} keeps them where they were (${JSON.stringify(s)})`);

// every Ground card's art parses, and Trapinch's line's back sprites and cries load
s = await B(async () => {
  const { GROUND } = await import('/js/card-art-ground.js');
  const broken = Object.entries(GROUND).filter(([, svg]) => new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${svg.replaceAll('$', 'x')}</svg>`, 'image/svg+xml').querySelector('parsererror')).map(([id]) => id);
  const ids = ['trapinch', 'vibrava', 'flygon', 'rhyhorn', 'rhydon', 'rhyperior'];
  const sizes = await Promise.all(ids.flatMap(id => [`${id}-back`, `${id}-shiny-back`]).map(f => new Promise(res => { const i = new Image(); i.onload = () => res(i.naturalWidth); i.onerror = () => res(0); i.src = `/assets/pokemon/${f}.gif`; })));
  const cries = await Promise.all(ids.map(async id => (await fetch(`/assets/audio/cries/${id}.mp3`)).ok));
  return { n: Object.keys(GROUND).length, broken, sizes, cries };
});
check(s.n === 74 && !s.broken.length && s.sizes.every(w => w > 0) && s.cries.every(Boolean), `${s.n} Ground arts parse${s.broken.length ? ` (broken: ${s.broken.join(', ')})` : ''}; back GIFs ${s.sizes.join(' ')}px; cries ${s.cries.join(' ')}`);

const bad = errors.filter(e => !/favicon|net::|Failed to load resource|cloud|firebase|gstatic/i.test(e));
check(!bad.length, `no console errors${bad.length ? `: ${bad.slice(0, 3).join(' | ')}` : ''}`);
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
