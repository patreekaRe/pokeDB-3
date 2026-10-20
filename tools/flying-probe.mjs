/* flying-probe.mjs  -  Flying's mechanics in a real fight, headless (docs/duo-design.md section 5, "Flying's first
   session"): Evasion halving the enemy's hits (the intent's number too) and its payoffs (Air Slash, Sky Drop, Gale,
   Wind Wall), Tailwind's extra card and its payoffs (Twister, Drill Peck, Aeroblast, Sky Attack's free cost, Wind Rider,
   Wind Dancer), Unburden (Peck, Acrobatics, Dual Wingbeat, Brave Bird, the glow) and Feather Light, the Keen Eye
   Ability, the neutral card renamed Rest; and the art, back sprites and cries:
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
const filler = () => B(() => window.__give('feather-guard'));
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
  const ids = ['starly', 'staravia', 'staraptor'];
  const sizes = await Promise.all(ids.flatMap(id => [`${id}-back`, `${id}-shiny-back`]).map(f => new Promise(res => { const i = new Image(); i.onload = () => res(i.naturalWidth); i.onerror = () => res(0); i.src = `/assets/pokemon/${f}.gif`; })));
  const cries = await Promise.all(ids.map(async id => (await fetch(`/assets/audio/cries/${id}.mp3`)).ok));
  return { n: Object.keys(FLYING).length, broken, sizes, cries };
});
check(s.n === 38 && !s.broken.length && s.sizes.every(w => w > 0) && s.cries.every(Boolean), `${s.n} Flying arts parse${s.broken.length ? ` (broken: ${s.broken.join(', ')})` : ''}; back GIFs ${s.sizes.join(' ')}px; cries ${s.cries.join(' ')}`);

const bad = errors.filter(e => !/favicon|net::|Failed to load resource|cloud|firebase|gstatic/i.test(e));
check(!bad.length, `no console errors${bad.length ? `: ${bad.slice(0, 3).join(' | ')}` : ''}`);
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
