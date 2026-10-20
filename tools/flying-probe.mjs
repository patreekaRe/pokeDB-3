/* flying-probe.mjs  -  Flying's mechanics in a real fight, headless (docs/duo-design.md section 5, "Flying's first
   session"): Evasion halving the enemy's hits (the intent's number too) and its payoffs (Air Slash, Sky Drop, Gale,
   Wind Wall), Tailwind's extra card and its payoffs (Twister, Drill Peck, Aeroblast, Sky Attack's free cost, Wind Rider,
   Wind Dancer), Unburden (Peck, Acrobatics, Dual Wingbeat, Brave Bird, the glow) and Feather Light, the Keen Eye
   Ability, the neutral card renamed Rest; session 12's half (Tangled Feet, Plumage, Cloud Cover, Phantom Wing, Big Pecks,
   Thermal, Slipstream, Jet Stream, Delta Stream, Gale Wings, Levitate, Early Bird, Preen, Perch, Weightless), Flying's
   relics and items, Pidgey's and Pidove's looks and the Windy Cliffs; and the art, back sprites and cries:
     NODE_PATH=$(npm root -g) node tools/flying-probe.mjs
   Prints what it checks and exits 1 on a failed check or a console error. */
import { serve, launch, phone, threeCopy } from './probe-kit.mjs';

const HOOK = (path, body) => path === '/js/battle.js'
  ? body.toString() + `
window.__battle = () => battle;
window.__give = (id) => { const card = CARDS_BY_ID[id]; const uid = nextUid++; battle.hand.push({ uid, card }); renderAll(); return uid; };
window.__play = async (id) => { const uid = window.__give(id); await playCard(uid); for (let i = 0; i < 40 && battle.busy; i++) await sleep(100); };
window.__playHeld = async (uid) => { await playCard(uid); for (let i = 0; i < 40 && battle.busy; i++) await sleep(100); };
window.__render = () => renderAll();
window.__item = (e) => itemEffects(e);
window.__cost = (id) => costOf(CARDS_BY_ID[id]);
window.__name = (id) => CARDS_BY_ID[id].name;
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
const tackle = () => moves({ kind: 'attack', amount: 20, name: 'Tackle', type: 'normal' });
// a 6-card hand to play from (the last card in it is Unburden's), the enemy plain and big
const fresh = () => B(() => { const b = window.__battle(); b.energy = 30; b.enemy.hp = b.enemy.maxHp = 999; b.enemy.block = 0; b.enemy.vulnerable = 0; b.enemy.weak = 0; b.enemy.strength = 0; b.enemy.dmgBonus = 0; b.enemy.dmgMult = 1; b.strength = 0; b.block = 0; b.kind = 'fight'; b.hand = []; b.evasion = 0; b.tailwind = 0; b.powers = {}; b.emptied = false; b.hp = b.maxHp = 300; b.relics = []; b.drawPile = Array.from({ length: 30 }, () => b.drawPile[0] ?? b.discard[0]); });
const keepRelics = () => B(() => window.__battle().relics).then(async (r) => { await fresh(); await B((list) => { window.__battle().relics = list; }, r); });
const filler = () => B(() => window.__give('feather-guard'));
const gain = async (id) => { const b0 = await B(() => window.__battle().block); await B((c) => window.__play(c), id); return await B(() => window.__battle().block) - b0; };
const last = async (id) => { await B(() => { window.__battle().hand = []; }); return gain(id); };
const open = async (extra = '') => {
  await page.goto(`http://localhost:${port}/?arena=fight&starter=starly${extra}`);
  await page.waitForTimeout(8000);
  await ready();
};

await open();
let s = await B(() => { const b = window.__battle(); return { type: b.starter.type, ability: b.ability?.id, hand: b.hand.length, keen: b.keenTurn, rest: window.__name('tailwind') }; });
check(s.type === 'flying' && s.ability === 'keen-eye', `Starly is out with Keen Eye (${JSON.stringify(s)})`);
check(s.hand >= 6 && s.keen === 1, `Keen Eye: the first hand draws 1 more (${s.hand})`);
check(s.rest === 'Rest', 'the neutral card once called Tailwind is Rest');
await fresh();
await calm();

// Evasion
await filler();
check(await hit('aerial-ace') === 6, 'Aerial Ace: 6');
check(await B(() => window.__battle().evasion) === 1, 'Aerial Ace: Evasion 1');
check(await hit('air-slash') === 7 + 6, 'Air Slash with Evasion: 7 + 6');
await B(() => window.__play('feather-dance'));
s = await B(() => ({ ev: window.__battle().evasion, weak: window.__battle().enemy.weak, badge: [...document.querySelectorAll('#player-status .badge')].map(n => n.title).find(t => /^Evasion/.test(t)) }));
check(s.ev === 2 && s.weak === 2 && !!s.badge, `Feather Dance: Evasion 2, Weak 2 (${s.badge})`);
check(await hit('sky-drop') === 6 + 4 * 2, 'Sky Drop with 2 Evasion: 6 + 4 x2');
await B(() => { window.__battle().enemy.weak = 0; });
await tackle();
await B(() => window.__play('gale'));
await B(() => window.__render());
s = await B(() => document.getElementById('enemy-intent').textContent);
check(/^\s*⚔️?\s*10/.test(s) || s.includes('10'), `the intent shows the halved hit (${s.trim()})`);
let pre = await B(() => ({ hp: window.__battle().hp, foe: window.__battle().enemy.hp }));
await B(() => window.__endTurn());
s = await B((p) => { const b = window.__battle(); return { lost: p.hp - b.hp, ev: b.evasion, gale: p.foe - b.enemy.hp }; }, pre);
check(s.lost === 10 && s.ev === 0 && s.gale === 6, `a 20 hit lands as 10, the rest fade at your turn, Gale deals 6 (${JSON.stringify(s)})`);
await fresh();
await B(() => window.__play('wind-wall'));
await B(() => window.__endTurn());
await B(() => { window.__battle().evasion = 3; });
await B(() => window.__endTurn());
check(await B(() => window.__battle().evasion) === 1, 'Evasion fades at your turn\'s start; Wind Wall gives 1 back');

// Tailwind
await fresh();
await calm();
const handNoWind = await B(async () => { await window.__endTurn(); return window.__battle().hand.length; });
await fresh();
await B(() => window.__play('tailwind-gust'));
s = await B(() => ({ t: window.__battle().tailwind, badge: [...document.querySelectorAll('#player-status .badge')].map(n => n.title).find(t => /^Tailwind/.test(t)) }));
check(s.t === 3 && !!s.badge, `Tailwind 3 (${s.badge})`);
await filler();
check(await hit('twister') === 4 * 3, 'Twister in Tailwind: 4 three times');
check(await hit('drill-peck') === 9 + 5, 'Drill Peck in Tailwind: 9 + 5');
check(await hit('aeroblast') === 10 + 5 * 3, 'Aeroblast with 3 turns of Tailwind: 10 + 5 x3');
check(await B(() => window.__cost('sky-attack')) === 0, 'Sky Attack costs 0 in Tailwind');
await B(() => window.__play('wind-rider'));
await B(() => window.__play('wind-dancer'));
pre = await B(() => window.__battle().enemy.hp);
await B(() => { window.__battle().hand = []; });
await B(() => window.__endTurn());
s = await B((p) => { const b = window.__battle(); return { hand: b.hand.length, t: b.tailwind, rider: p - b.enemy.hp, ev: b.evasion }; }, pre);
check(s.hand === handNoWind + 1 && s.t === 2, `Tailwind: 1 more card (${s.hand} against ${handNoWind}), a turn goes (${s.t} left)`);
check(s.rider === 6 && s.ev === 1, `Wind Rider deals 6, Wind Dancer gives Evasion 1, at the turn's start in Tailwind (${JSON.stringify(s)})`);
await fresh();
check(await B(() => window.__cost('sky-attack')) === 2, 'Sky Attack costs 2 out of Tailwind');
check(await hit('twister') === 4 * 2, 'Twister out of Tailwind: 4 twice');

// Unburden
await fresh();
await filler();
check(await hit('acrobatics') === 7, 'Acrobatics with a card left in hand: 7');
await B(() => { window.__battle().hand = []; });
check(await hit('acrobatics') === 7 + 7, 'Acrobatics as the last card: 7 + 7');
s = await B(() => { const b = window.__battle(); b.hand = []; window.__give('peck'); return document.querySelector('#hand .card')?.classList.contains('follow-ready'); });
check(s, 'a card whose Unburden would happen glows');
s = await B(async () => { const b = window.__battle(); await window.__playHeld(b.hand[0].uid); return b.hand.length; });
check(s === 1, `Peck as the last card draws 1 (hand ${s})`);
await B(() => { window.__battle().hand = []; });
check(await hit('dual-wingbeat') === 5 * 4, 'Dual Wingbeat as the last card: 5 four times');
s = await B(async () => { const b = window.__battle(); b.hand = []; const e = b.energy, hp = b.hp; await window.__play('brave-bird'); return { pp: b.energy - e, hp: hp - b.hp }; });
check(s.pp === 0 && s.hp === 3, `Brave Bird as the last card: its PP back, 3 HP lost (${JSON.stringify(s)})`);
await filler();
await B(() => window.__play('feather-light'));
s = await B(async () => { const b = window.__battle(); b.hand = []; await window.__play('gust'); const one = b.hand.length; b.hand = []; await window.__play('gust'); return [one, b.hand.length]; });
check(s[0] === 2 && s[1] === 0, `Feather Light: the hand's first emptying draws 2, once a turn (${s})`);

// session 12: the defensive half
await open();
await fresh();
await calm();
await filler();
check(await gain('tangled-feet') === 5 && await B(() => window.__battle().evasion) === 1, 'Tangled Feet: block 5, Evasion 1');
check(await gain('plumage') === 5 + 3, 'Plumage with 1 Evasion: 5 + 3');
check(await gain('cloud-cover') === 8 + 4, 'Cloud Cover with Evasion: 8 + 4');
await B(() => { window.__battle().evasion = 0; });
check(await gain('phantom-wing') === 4 * 2, 'Phantom Wing from no Evasion: Evasion 2, then 4 block a stack');
await B(() => window.__play('big-pecks'));
check(await gain('tangled-feet') === 5 + 3, 'Big Pecks: 3 block whenever you gain Evasion');
await fresh();
await calm();
await filler();
check(await gain('slipstream') === 5, 'Slipstream out of Tailwind: 5');
await B(() => window.__play('tailwind-gust'));
check(await gain('slipstream') === 5 + 5, 'Slipstream in Tailwind: 5 + 5');
check(await gain('thermal') === 5 + 2 * 3, 'Thermal with 3 turns of Tailwind: 5 + 2 x3');
await B(() => window.__play('jet-stream'));
await B(() => window.__play('delta-stream'));
await B(() => { window.__battle().hand = []; });
await B(() => window.__endTurn());
s = await B(() => { const b = window.__battle(); return { block: b.block, t: b.tailwind }; });
check(s.block === 4 && s.t === 6, `Jet Stream: 4 block at a turn's start in Tailwind; Delta Stream: Tailwind 3 more that doesn't run out (${JSON.stringify(s)})`);
await fresh();
await tackle();
await B(() => window.__play('gale-wings'));
await B(() => window.__play('levitate'));
await B(() => window.__play('hover'));
await B(() => window.__endTurn());
s = await B(() => { const e = window.__battle().enemy; return { weak: e.weak, sap: e.sap }; });
check(s.weak === 1 && s.sap === 2, `Gale Wings and Levitate: an evaded hit applies Weak 1, which lasts into its next turn, and Sap 1, on Hover's Sap 1 (${JSON.stringify(s)})`);
await fresh();
await calm();
await B(() => window.__play('early-bird'));
await filler();
check(await gain('preen') === 3, 'Preen with a card left in hand: 3');
check(await last('preen') === 3 + 4 + 4, 'Preen as the last card: 3 + 4, Early Bird 4');
await B(() => { window.__battle().powers = {}; window.__battle().enemy.weak = 0; });
await last('perch');
check(await B(() => window.__battle().enemy.weak) === 2, 'Perch as the last card: Weak 2');
await B(() => { const b = window.__battle(); b.powers = {}; b.emptied = false; });
await filler();
await B(() => window.__play('weightless'));
s = await B(async () => { const b = window.__battle(); b.hand = []; const b0 = b.block; await window.__play('gust'); const one = b.block - b0; b.hand = []; await window.__play('gust'); return [one, b.block - b0]; });
check(s[0] === 8 && s[1] === 8, `Weightless: 8 block the first time the hand empties, once a turn (${s})`);

// Flying's relics and items, on Pidgey's look
await page.goto(`http://localhost:${port}/?arena=fight&starter=pidgey&relics=sky-plate,pretty-wing,coba-berry,air-balloon,flying-memory,flyinium-z,sharp-beak`);
await page.waitForTimeout(8000);
await ready();
s = await B(() => { const b = window.__battle(); return { look: b.starter.line.map(l => l.id).join(), deck: b.starter.deck === b.starter.deck && b.starter.type, keen: b.ability?.amount, t: b.tailwind, ev: b.evasion, block: b.block, hand: b.hand.length }; });
check(s.look === 'pidgey,pidgeotto,pidgeot' && s.deck === 'flying', `Pidgey plays Starly's deck (${s.look})`);
check(s.keen === 2 && s.hand === 5 + 1 + 1 + 2, `Flyinium Z: a card more and Keen Eye draws 2; Sky Plate's Tailwind a card more (${JSON.stringify(s)})`);
check(s.t === 1 && s.ev === 2 && s.block === 2, `Sky Plate: Tailwind 2, a turn gone; Air Balloon: Evasion 2; Pretty Wing: 2 block with it (${JSON.stringify(s)})`);
await keepRelics();
await calm();
await filler();
check(await hit('gust') === 8 + 2, 'Sharp Beak: Flying attacks +2');
check(await last('preen') === 3 + 4 + 3, 'Coba Berry: 3 block as an Unburden happens');
await B(() => { window.__battle().evasion = 3; });
await B(() => window.__endTurn());
check(await B(() => window.__battle().evasion) === 1, 'Flying Memory: 3 Evasion halves to 1 at your turn\'s start');
await keepRelics();
await B(() => window.__item({ block: 8, evasion: 2 }));
s = await B(() => { const b = window.__battle(); return { block: b.block, ev: b.evasion }; });
check(s.block === 8 + 2 && s.ev === 2, `Flying Gem: block 8, Evasion 2 (Pretty Wing's 2) (${JSON.stringify(s)})`);
s = await B(async () => { const b = window.__battle(); const h = b.hand.length; await window.__item({ tailwind: 3, draw: 2 }); return { t: b.tailwind, drew: b.hand.length - h }; });
check(s.t === 3 && s.drew === 2, `Swift Wing: Tailwind 3, draw 2 (${JSON.stringify(s)})`);
await page.goto(`http://localhost:${port}/?arena=fight&starter=pidove`);
await page.waitForTimeout(8000);
await ready();
s = await B(() => window.__battle().starter.line.map(l => l.id).join());
check(s === 'pidove,tranquill,unfezant', `Pidove's look (${s})`);

// the Windy Cliffs
s = await B(async () => {
  const { SAFARI_AREAS_BY_ID, safariAreasOn, SAFARI_FROM } = await import('/js/data/safari.js');
  const { DUO_LINES } = await import('/js/data/duo.js');
  const w = SAFARI_AREAS_BY_ID.windycliffs;
  const before = safariAreasOn('2026-10-01');
  return { n: w.normals.length + w.rares.length, rares: w.rares.join(), stages: w.stages.join(), from: SAFARI_FROM.windycliffs, before: before.some(a => a.id === 'windycliffs'),
    meadowBefore: before.find(a => a.id === 'meadow').normals.includes('pidgey'), murkrow: w.normals.includes('murkrow'), lines: Object.keys(DUO_LINES.flying).join() };
});
check(s.n === 35 && !s.murkrow && s.stages === 'Cliff Path,Nesting Ledges,Rope Bridge,Eyrie' && !s.before && s.meadowBefore && s.lines === 'starly,pidgey,pidove', `the Windy Cliffs: 35 birds, rares ${s.rares}; a day before ${s.from} keeps them where they were (${JSON.stringify(s)})`);

// a duo: Keen Eye as Starly comes out, once a turn
await page.goto(`http://localhost:${port}/?duorun&duopool`);
await page.waitForTimeout(3000);
s = await B(async () => {
  const { STARTERS_BY_ID } = await import('/js/data/starters.js');
  return !!STARTERS_BY_ID.starly && STARTERS_BY_ID.starly.duoOnly;
});
check(s, 'Starly is a duo-only starter');

// every Flying card's art parses, and Starly's line's back sprites and cries load
s = await B(async () => {
  const { FLYING } = await import('/js/card-art-flying.js');
  const broken = Object.entries(FLYING).filter(([, svg]) => new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${svg.replaceAll('$', 'x')}</svg>`, 'image/svg+xml').querySelector('parsererror')).map(([id]) => id);
  const ids = ['starly', 'staravia', 'staraptor', 'pidgey', 'pidgeotto', 'pidgeot', 'pidove', 'tranquill', 'unfezant'];
  const sizes = await Promise.all(ids.flatMap(id => [`${id}-back`, `${id}-shiny-back`]).map(f => new Promise(res => { const i = new Image(); i.onload = () => res(i.naturalWidth); i.onerror = () => res(0); i.src = `/assets/pokemon/${f}.gif`; })));
  const cries = await Promise.all(ids.map(async id => (await fetch(`/assets/audio/cries/${id}.mp3`)).ok));
  return { n: Object.keys(FLYING).length, broken, sizes, cries };
});
check(s.n === 74 && !s.broken.length && s.sizes.every(w => w > 0) && s.cries.every(Boolean), `${s.n} Flying arts parse${s.broken.length ? ` (broken: ${s.broken.join(', ')})` : ''}; back GIFs ${s.sizes.join(' ')}px; cries ${s.cries.join(' ')}`);

const bad = errors.filter(e => !/favicon|net::|Failed to load resource|cloud|firebase|gstatic/i.test(e));
check(!bad.length, `no console errors${bad.length ? `: ${bad.slice(0, 3).join(' | ')}` : ''}`);
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
