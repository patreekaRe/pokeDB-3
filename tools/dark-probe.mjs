/* dark-probe.mjs  -  Dark's mechanics in a real fight, headless (docs/duo-design.md section 5, "Dark's first session"):
   the Intimidate Ability, Steal (strength, below its 0 too, and block, before the hit), its payoffs (Brutal Swing, Jaw Lock, Pickpocket,
   Plunder's ₽), Punish (Throat Chop, Lash Out, the glow, Taunt, Ruination, Unnerve, Prankster), Illusion and Disguise
   (the better of two types, on a stand-in partner), Doppelganger, Imposter, Mirage, Fighting's card renamed Stare Down,
   and the art, back sprites and cries; and the second session's defensive half (Hoard, Ill-Gotten Gains, Turnabout,
   Retribution, Goad, the powers), its relics and items on Sandile's look, and Night Alley:
     NODE_PATH=$(npm root -g) node tools/dark-probe.mjs
   Prints what it checks and exits 1 on a failed check or a console error. */
import { serve, launch, phone, threeCopy } from './probe-kit.mjs';

const HOOK = (path, body) => path === '/js/battle.js'
  ? body.toString() + `
window.__battle = () => battle;
window.__give = (id) => { const card = CARDS_BY_ID[id]; const uid = nextUid++; battle.hand.push({ uid, card }); renderAll(); return uid; };
window.__play = async (id) => { const uid = window.__give(id); await playCard(uid); for (let i = 0; i < 40 && battle.busy; i++) await sleep(100); };
window.__render = () => renderAll();
window.__item = (e) => itemEffects(e);
window.__intent = () => currentMove().kind;
window.__name = (id) => CARDS_BY_ID[id].name;
window.__begin = () => { battle.busy = false; beginPlayerTurn(); };
window.__endTurn = async () => { battle.busy = false; await endTurn(); for (let i = 0; i < 60 && (battle.busy || battle.enemyActing); i++) await sleep(100); };
// a stand-in partner of type t for the type rules only (nothing renders while it's set)
window.__asDuo = (t, fn) => { const d = battle.duo; battle.duo = { types: [battle.starter.type, t], run: { out: 0 } }; try { return fn(); } finally { battle.duo = d; } };
window.__mult = (id) => cardMultiplier(CARDS_BY_ID[id]);
window.__guard = (move) => guardType(move);
window.__hits = (id) => damageFor(CARDS_BY_ID[id], effectsOf(CARDS_BY_ID[id])).hits;
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
const moves = (m) => B((mv) => { const b = window.__battle(); b.def = { ...b.def, moves: mv }; b.enemy.moveIndex = 0; }, m);
const calm = () => moves([{ kind: 'defend', amount: 0, name: 'Harden', type: 'normal' }]);
const tackle = () => moves([{ kind: 'attack', amount: 20, name: 'Tackle', type: 'normal' }]);
const fresh = () => B(() => { const b = window.__battle(); b.energy = 30; b.enemy.hp = b.enemy.maxHp = 999; b.enemy.block = 0; b.enemy.vulnerable = 0; b.enemy.weak = 0; b.enemy.strength = 0; b.enemy.dmgBonus = 0; b.enemy.dmgMult = 1; b.strength = 0; b.block = 0; b.kind = 'fight'; b.hand = []; b.powers = {}; b.disguised = false; b.illusions = 0; b.lastCards = [null, null]; b.hp = b.maxHp = 300; b.relics = []; b.tally.payDay = 0; b.drawPile = Array.from({ length: 30 }, () => b.drawPile[0] ?? b.discard[0]); });

await page.goto(`http://localhost:${port}/?arena=fight&starter=deino`);
await page.waitForTimeout(8000);
await ready();
let s = await B(() => { const b = window.__battle(); return { type: b.starter.type, ability: b.ability?.id, weak: b.enemy.weak, intim: b.intimTurn, stare: window.__name('intimidate') }; });
check(s.type === 'dark' && s.ability === 'intimidate', `Deino is out with Intimidate (${JSON.stringify(s)})`);
check(s.weak >= 1 && s.intim === 1, 'Intimidate: the enemy starts Weak');
check(s.stare === 'Stare Down', 'Fighting\'s card once called Intimidate is Stare Down');
await fresh();
await calm();

// Steal: strength, then block, before the hit
await B(() => { const en = window.__battle().enemy; en.strength = 3; en.block = 0; });
await B(() => window.__play('covet'));
s = await B(() => { const b = window.__battle(); return { mine: b.strength, its: b.enemy.strength }; });
check(s.mine === 1 && s.its === 2, `Covet's Steal 1 takes 1 strength (${JSON.stringify(s)})`);
await fresh();
await B(() => window.__play('covet'));
s = await B(() => { const b = window.__battle(); return { mine: b.strength, its: b.enemy.strength }; });
check(s.mine === 0 && s.its === -1, `on a foe with no strength, Steal 1 still takes 1: it goes to -1, you gain none (${JSON.stringify(s)})`);
await fresh();
await B(() => { window.__battle().enemy.block = 10; });
let dealt = await hit('ransack');
s = await B(() => { const b = window.__battle(); return { block: b.block, its: b.enemy.block }; });
check(s.block === 6 && s.its === 0 && dealt === 4, `Ransack's Steal 2 takes 6 of its 10 block first, so 4 of its 8 get through (${JSON.stringify({ ...s, dealt })})`);
await fresh();
check(await hit('brutal-swing') === 7, 'Brutal Swing: 7 on a plain enemy');
await B(() => { window.__battle().enemy.strength = 2; });
check(await hit('brutal-swing') === 13, 'Brutal Swing: +6 while it has strength');
await fresh();
await B(() => { window.__battle().enemy.block = 3; });
let hand = await B(() => window.__battle().hand.length);
await B(() => window.__play('jaw-lock'));
check(await B(() => window.__battle().hand.length) === hand + 1, 'Jaw Lock draws 1 when it has block');
await fresh();
await B(() => window.__play('pickpocket'));
await moves([{ kind: 'buff', amount: 2, name: 'Hone Claws', type: 'normal' }]);
await B(() => window.__endTurn());
s = await B(() => { const b = window.__battle(); return { mine: b.strength, its: b.enemy.strength }; });
check(s.mine === 1 && s.its >= 2, `Pickpocket: its Hone Claws gives you 1 strength (${JSON.stringify(s)})`);
await fresh();
await B(() => { window.__battle().enemy.hp = 10; });
await B(() => window.__play('plunder'));
await page.waitForTimeout(3000);
check(await B(() => window.__battle().tally.payDay) === 20, 'Plunder\'s knockout gives 20 ₽');

await page.goto(`http://localhost:${port}/?arena=fight&starter=deino`);
await page.waitForTimeout(8000);
await ready();
await fresh();

// Punish
await calm();
check(await hit('throat-chop') === 7, 'Throat Chop: 7 when it isn\'t attacking');
await tackle();
check(await hit('throat-chop') === 13, 'Throat Chop: 13 when it intends to attack');
hand = await B(() => window.__battle().hand.length);
await B(() => window.__play('lash-out'));
check(await B(() => window.__battle().hand.length) === hand + 1, 'Lash Out draws 1 on an attack intent');
await B(() => { window.__give('throat-chop'); window.__render(); });
check(await page.evaluate(() => !!document.querySelector('.card.in-hand.follow-ready')), 'a Punish card glows when it would pay');
await fresh();
await moves([{ kind: 'buff', amount: 2, name: 'Hone Claws', type: 'normal' }, { kind: 'defend', amount: 5, name: 'Harden', type: 'normal' }, { kind: 'attack', amount: 12, name: 'Bite', type: 'normal' }]);
await B(() => window.__play('taunt'));
s = await B(() => { const b = window.__battle(); const m = b.def.moves[b.enemy.moveIndex % b.def.moves.length]; return m.name; });
check(s === 'Bite', `Taunt: its intent becomes its next attack (${s})`);
const ruin = await hit('ruination');
check(ruin === 8 + 12, `Ruination: 8 + the 12 its Bite would deal (${ruin})`);
await fresh();
await tackle();
await B(() => window.__play('unnerve'));
dealt = await hit('throat-chop');
check(dealt === 13 + 5, `Unnerve: a Punish deals 5 more (${dealt})`);
await fresh();
await B(() => window.__play('prankster'));
await tackle();
hand = await B(() => { const b = window.__battle(); b.hand = []; return 0; });
await B(() => window.__begin());
await ready();
hand = await B(() => window.__battle().hand.length);
check(hand === 7, `Prankster: an attack intent at the turn's start draws 2 more (${hand})`);

// Illusion and Disguise, on a stand-in partner (the triangle: Fire beats Grass, Water beats Fire)
await fresh();
s = await B(() => { const b = window.__battle(); b.def = { ...b.def, type: 'grass' }; b.kind = 'fight'; b.safari = false;
  return window.__asDuo('fire', () => ({ illusion: window.__mult('feint-attack'), plain: window.__mult('bite') })); });
check(s.illusion > 1 && s.plain === 1, `an Illusion card hits Grass as the Fire partner, a plain Dark card doesn't (${JSON.stringify(s)})`);
s = await B(() => window.__mult('feint-attack'));
check(s === 1, 'alone, an Illusion is Dark or Neutral');
s = await B(() => { const b = window.__battle(); b.disguised = true;
  return window.__asDuo('fire', () => ({ grass: window.__guard({ kind: 'attack', amount: 10, type: 'grass' }), water: window.__guard({ kind: 'attack', amount: 10, type: 'water' }) })); });
check(s.grass === 'fire' && s.water === 'dark', `Disguised, a Grass hit lands on the Fire partner, a Water hit stays on Dark (${JSON.stringify(s)})`);
await B(() => { window.__battle().disguised = false; });
await B(() => window.__play('disguise'));
s = await B(() => ({ d: window.__battle().disguised, badge: [...document.querySelectorAll('#player-status .badge, #player-status [title]')].some(n => /Disguised/.test(n.title)) }));
check(s.d && s.badge, `Disguise sets the 🎭 badge (${JSON.stringify(s)})`);
await tackle();
await B(() => window.__endTurn());
check(!await B(() => window.__battle().disguised), 'Disguise is gone at your next turn');
await fresh();
await calm();
await B(() => window.__play('sleight-of-hand'));
await B(() => window.__play('feint-attack'));
dealt = await hit('doppelganger');
check(dealt === 5 + 8, `Doppelganger: +4 per other Illusion this turn (${dealt})`);
await fresh();
await B(() => window.__play('wicked-blow'));
await B(() => window.__play('imposter'));
s = await B(() => { const h = window.__battle().hand.map(x => x.card); return h.map(c => `${c.id}${c.illusion ? '*' : ''}`); });
check(s.includes('wicked-blow*'), `Imposter alone copies your last card, as an Illusion (${s})`);
await fresh();
await B(() => window.__play('mirage'));
s = await B(() => { const b = window.__battle(); b.hand = []; return 0; });
await B(() => window.__begin());
await ready();
s = await B(() => ({ d: window.__battle().disguised, illusive: window.__asDuo('fire', () => window.__mult('bite')) }));
check(s.d && s.illusive > 1, `Mirage: Disguised each turn, every Dark card an Illusion (${JSON.stringify(s)})`);

// session 14: the defensive half
const gain = async (id) => { const b0 = await B(() => window.__battle().block); await B((c) => window.__play(c), id); return await B(() => window.__battle().block) - b0; };
const turn = async () => { await B(() => { window.__battle().hand = []; }); await B(() => window.__begin()); await ready(); };
await fresh();
await calm();
await B(() => { window.__battle().strength = 3; });
check(await gain('hoard') === 5 + 6, 'Hoard: 5 block, +2 per strength you have');
await fresh();
await B(() => { window.__battle().enemy.strength = 2; });
s = { block: await gain('ill-gotten-gains'), str: await B(() => window.__battle().strength) };
check(s.block === 8 && s.str === 2, `Ill-Gotten Gains: Steal 2, then 4 block per strength, its own Steal counted (${JSON.stringify(s)})`);
await fresh();
check(await gain('pilfer') === 6 && await B(() => window.__battle().enemy.strength) === -1, 'Pilfer: 6 block, Steal 1');
await fresh();
await B(() => window.__play('shakedown'));
check(await B(() => window.__battle().enemy.weak) === 0, 'Shakedown: no Weak on a plain enemy');
await B(() => { window.__battle().enemy.strength = 1; });
await B(() => window.__play('shakedown'));
check(await B(() => window.__battle().enemy.weak) === 1, 'Shakedown: Weak 1 while it has strength');
await fresh();
check(await gain('brace-for-it') === 6, 'Brace for It: 6 when it isn\'t attacking');
await tackle();
check(await gain('brace-for-it') === 11, 'Brace for It: 11 on an attack intent');
check(await gain('turnabout') === 5 + 20, 'Turnabout: 5 + the 20 its Tackle would deal');
s = { block: await gain('retribution'), weak: await B(() => window.__battle().enemy.weak) };
check(s.block === 10 + 20 && s.weak === 1, `Retribution: 10 + its attack, Weak 1 (${JSON.stringify(s)})`);
await fresh();
await moves([{ kind: 'buff', amount: 2, name: 'Hone Claws', type: 'normal' }, { kind: 'attack', amount: 12, name: 'Bite', type: 'normal' }]);
check(await gain('goad') === 8 && await B(() => window.__intent()) === 'attack', 'Goad: 8 block and its intent becomes its Bite');
await fresh();
await tackle();
await B(() => window.__play('vendetta'));
check(await gain('cower') === 3 + 4 + 4, 'Vendetta: 4 block as a Punish happens (Cower 3 + 4)');
await fresh();
await tackle();
for (const id of ['night-watch', 'pressure', 'magician']) await B((c) => window.__play(c), id);
await turn();
s = await B(() => { const b = window.__battle(); return { block: b.block, weak: b.enemy.weak, its: b.enemy.strength }; });
check(s.block === 4 && s.weak === 1 && s.its === -1, `Night Watch, Pressure and Magician at a turn's start on an attack intent (${JSON.stringify(s)})`);
await fresh();
await calm();
await B(() => window.__play('sticky-hold'));
check(await gain('pilfer') === 6 + 3, 'Sticky Hold: 3 block whenever you Steal');
await fresh();
for (const id of ['costume-change', 'phantom-mask']) await B((c) => window.__play(c), id);
s = { block: await gain('decoy'), weak: await B(() => window.__battle().enemy.weak) };
check(s.block === 3 + 3 && s.weak === 1, `Costume Change and Phantom Mask: 3 block and Weak 1 whenever you Disguise (${JSON.stringify(s)})`);
check(await gain('veil') === 10, 'Veil: 5, +5 while Disguised');
await fresh();
await B(() => window.__play('hall-of-mirrors'));
check(await gain('reflection') === 7 + 2, 'Hall of Mirrors: 2 block whenever you play an Illusion card');
await fresh();
await B(() => window.__play('decoy'));
await B(() => window.__play('reflection'));
check(await gain('night-shroud') === 5 + 6, 'Night Shroud: +3 per other Illusion card played this turn');

// Dark's relics and items, on Sandile's look
await page.goto(`http://localhost:${port}/?arena=fight&starter=sandile&relics=dread-plate,reveal-glass,colbur-berry,razor-claw,dark-memory,darkinium-z,black-glasses`);
await page.waitForTimeout(8000);
await ready();
s = await B(() => { const b = window.__battle(); return { look: b.starter.line.map(l => l.id).join(), type: b.starter.type, intim: b.ability?.amount, weak: b.enemy.weak, its: b.enemy.strength, hand: b.hand.length, intent: window.__intent(), attacks: b.def.moves.some(m => ['attack', 'drain'].includes(m.kind)) }; });
check(s.look === 'sandile,krokorok,krookodile' && s.type === 'dark', `Sandile plays Deino's deck (${s.look})`);
check(s.intim === 2 && s.weak >= 2 && s.hand === 6, `Darkinium Z: Intimidate applies 2 Weak and a card more (${JSON.stringify(s)})`);
check(s.its === -1, `Dread Plate: Steal 1 at the start, Dark Memory's 1 more only on a card's (${s.its})`);
check(!s.attacks || s.intent === 'attack' || s.intent === 'drain', `Razor Claw: its first intent is an attack (${s.intent})`);
const keepRelics = () => B(() => window.__battle().relics).then(async (r) => { await fresh(); await B((list) => { window.__battle().relics = list; }, r); });
await keepRelics();
await calm();
check(await hit('bite') === 8 + 2, 'Black Glasses: Dark attacks +2');
check(await gain('decoy') === 3 + 3, 'Reveal Glass: 3 block whenever you Disguise');
await tackle();
check(await gain('cower') === 3 + 4 + 3, 'Colbur Berry: 3 block as a Punish happens');
await keepRelics();
await B(() => window.__play('pilfer'));
check(await B(() => window.__battle().enemy.strength) === -2, 'Dark Memory: Steal 1 takes 2');
await keepRelics();
await B(() => window.__item({ block: 8, steal: 2 }));
s = await B(() => { const b = window.__battle(); return { block: b.block, its: b.enemy.strength }; });
check(s.block === 8 && s.its === -2, `Dark Gem: 8 block, Steal 2 (Dark Memory's 1 more only on a card's) (${JSON.stringify(s)})`);
await keepRelics();
await B(() => window.__play('magician'));
await B(() => window.__begin());
check(await B(() => window.__battle().enemy.strength) === -1, 'Magician: Steal 1 a turn, Dark Memory adds nothing to it (2026-10-20)');
s = await B(async () => { const b = window.__battle(); const h = b.hand.length, b0 = b.block; await window.__item({ disguise: 1, draw: 2 }); return { d: b.disguised, drew: b.hand.length - h, block: b.block - b0 }; });
check(s.d && s.drew === 2 && s.block === 3, `Smoke Ball: Disguise (Reveal Glass's 3 block), draw 2 (${JSON.stringify(s)})`);

// Night Alley
s = await B(async () => {
  const { SAFARI_AREAS_BY_ID, safariAreasOn, SAFARI_FROM } = await import('/js/data/safari.js');
  const { DUO_LINES } = await import('/js/data/duo.js');
  const w = SAFARI_AREAS_BY_ID.nightalley;
  const before = safariAreasOn('2026-10-01');
  return { n: w.normals.length + w.rares.length, rares: w.rares.join(), stages: w.stages.join(), from: SAFARI_FROM.nightalley, before: before.some(a => a.id === 'nightalley'),
    forestBefore: before.find(a => a.id === 'forest').normals.includes('poochyena'), sandile: w.normals.includes('sandile'), quarry: SAFARI_AREAS_BY_ID.quarry.normals.includes('sandile'), lines: Object.keys(DUO_LINES.dark).join() };
});
check(s.n === 23 && s.sandile && !s.quarry && s.stages === 'Back Streets,Night Market,Rooftops,Moonlit Square' && !s.before && s.forestBefore && s.lines === 'deino,sandile', `Night Alley: 23 Pokémon, rares ${s.rares}; a day before ${s.from} keeps them where they were (${JSON.stringify(s)})`);

// the art, back sprites and cries
const assets = await page.evaluate(async () => {
  const art = await import('/js/card-art.js');
  const { ALL_CARDS } = await import('/js/data/cards.js');
  const missing = ALL_CARDS.filter(c => c.type === 'dark' && !art.CARD_ART_IDS.includes(c.id)).map(c => c.id);
  const { DARK } = await import('/js/card-art-dark.js');
  const broken = Object.entries(DARK).filter(([, svg]) => new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${svg.replaceAll('$', 'x')}</svg>`, 'image/svg+xml').querySelector('parsererror')).map(([id]) => id);
  const ids = ['deino', 'zweilous', 'hydreigon', 'sandile', 'krokorok', 'krookodile'];
  const files = ids.flatMap(n => [`${n}-back`, `${n}-shiny-back`]).map(n => `/assets/pokemon/${n}.gif`)
    .concat(ids.map(n => `/assets/audio/cries/${n}.mp3`));
  const bad = [];
  for (const u of files) if (!(await fetch(u)).ok) bad.push(u);
  return { missing, bad, broken, n: Object.keys(DARK).length };
});
check(!assets.missing.length && assets.n === 74 && !assets.broken.length, `every Dark card has art, ${assets.n} parse (${assets.missing} ${assets.broken})`);
check(!assets.bad.length, `Deino's and Sandile's lines have their backs and cries (${assets.bad})`);

check(!errors.length, `no console errors (${errors.slice(0, 3).join(' | ')})`);
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
