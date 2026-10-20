/* dark-probe.mjs  -  Dark's mechanics in a real fight, headless (docs/duo-design.md section 5, "Dark's first session"):
   the Intimidate Ability, Steal (strength and block, before the hit), its payoffs (Brutal Swing, Jaw Lock, Pickpocket,
   Plunder's ₽), Punish (Throat Chop, Lash Out, the glow, Taunt, Ruination, Unnerve, Prankster), Illusion and Disguise
   (the better of two types, on a stand-in partner), Doppelganger, Imposter, Mirage, Fighting's card renamed Stare Down,
   and the art, back sprites and cries:
     NODE_PATH=$(npm root -g) node tools/dark-probe.mjs
   Prints what it checks and exits 1 on a failed check or a console error. */
import { serve, launch, phone, threeCopy } from './probe-kit.mjs';

const HOOK = (path, body) => path === '/js/battle.js'
  ? body.toString() + `
window.__battle = () => battle;
window.__give = (id) => { const card = CARDS_BY_ID[id]; const uid = nextUid++; battle.hand.push({ uid, card }); renderAll(); return uid; };
window.__play = async (id) => { const uid = window.__give(id); await playCard(uid); for (let i = 0; i < 40 && battle.busy; i++) await sleep(100); };
window.__render = () => renderAll();
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

// the art, back sprites and cries
const assets = await page.evaluate(async () => {
  const art = await import('/js/card-art.js');
  const { ALL_CARDS } = await import('/js/data/cards.js');
  const missing = ALL_CARDS.filter(c => c.type === 'dark' && !art.CARD_ART_IDS.includes(c.id)).map(c => c.id);
  const files = ['deino-back', 'zweilous-back', 'hydreigon-back', 'deino-shiny-back', 'zweilous-shiny-back', 'hydreigon-shiny-back'].map(n => `/assets/pokemon/${n}.gif`)
    .concat(['deino', 'zweilous', 'hydreigon'].map(n => `/assets/audio/cries/${n}.mp3`));
  const bad = [];
  for (const u of files) if (!(await fetch(u)).ok) bad.push(u);
  return { missing, bad };
});
check(!assets.missing.length, `every Dark card has art (${assets.missing})`);
check(!assets.bad.length, `Deino's line has its backs and cries (${assets.bad})`);

check(!errors.length, `no console errors (${errors.slice(0, 3).join(' | ')})`);
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
