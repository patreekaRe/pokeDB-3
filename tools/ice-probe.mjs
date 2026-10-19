/* ice-probe.mjs  -  Ice's mechanics in a real fight, headless (docs/duo-design.md section 5, "Ice's first session"):
   Snow Warning's Hail at the fight's start and its badge, Hail's +3 on Ice hits and its chip at the end of your turn,
   Frostbite on every hit and its thaw, Icicle's growth (a card's own play counting for the next one), Blizzard free in
   Hail, Weather Ball, Glaciate, Snow Flurry's Icicles, Sheer Cold, Refrigerate, Cold Snap, Ice Age, Permafrost, and
   in a Duo Run Snow Warning the first time Vanillite comes out:
     NODE_PATH=$(npm root -g) node tools/ice-probe.mjs
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
const B = (fn, arg) => page.evaluate(fn, arg);
const hit = async (id) => { const h = await B(() => window.__battle().enemy.hp); await B((c) => window.__play(c), id); return h - await B(() => window.__battle().enemy.hp); };
const calm = () => B(() => { const b = window.__battle(); b.def = { ...b.def, moves: [{ kind: 'defend', amount: 0, name: 'Harden', type: 'normal' }] }; b.enemy.moveIndex = 0; });

await page.goto(`http://localhost:${port}/?arena=fight&starter=vanillite`);
await page.waitForTimeout(8000);
await ready();
let s = await B(() => { const b = window.__battle(); return { type: b.starter.type, ability: b.ability?.id, weather: b.weather, badge: [...document.querySelectorAll('#enemy-status .badge')].map(n => n.title).find(t => /Hail/.test(t)), hand: b.hand.map(h => h.card.id) }; });
check(s.type === 'ice' && s.ability === 'snow-warning' && s.weather?.kind === 'hail' && s.weather.turns === 2 && !!s.badge, `Vanillite is out with Snow Warning: Hail 2 (${s.badge}; ${s.hand.join(' ')})`);

await B(() => { const b = window.__battle(); b.energy = 20; b.enemy.hp = b.enemy.maxHp = 999; b.enemy.block = 0; b.enemy.vulnerable = 0; b.strength = 0; b.kind = 'fight'; });
await calm();
check(await hit('powder-snow') === 8 + 3, 'Powder Snow in Hail: 8 + 3');
await B(() => window.__play('icy-wind'));
s = await B(() => ({ fb: window.__battle().enemy.frostbite, badge: [...document.querySelectorAll('#enemy-status .badge')].map(n => n.title).find(t => /Frostbite/.test(t)) }));
check(s.fb === 4 && !!s.badge, `Icy Wind: Frostbite 4 (${s.badge})`);
check(await hit('powder-snow') === 8 + 3 + 4, 'Powder Snow on Frostbite 4: 8 + 3 + 4');
check(await hit('icicle-spear') === 3 * (2 + 3 + 4), 'Icicle Spear: Frostbite and Hail on each of its three hits');
check(await hit('ice-shard') === 3 + 3 + 4 + 2, 'Ice Shard after one Icicle card: 3 + 3 + 4 + 2');
check(await hit('ice-shard') === 3 + 3 + 4 + 4, 'and after two: +4');
s = await B(() => window.__battle().icicles);
check(s === 3, `three Icicle cards played (${s})`);
const e0 = await B(() => window.__battle().energy);
await B(() => window.__play('blizzard'));
s = await B(() => window.__battle().energy);
check(s === e0, `Blizzard is free in Hail (PP ${e0} -> ${s})`);
const wb = await hit('weather-ball');
check(wb === 8 + 8 + 3 + 4, `Weather Ball in Hail: 8 + 8, Hail and Frostbite (${wb})`);
await B(() => window.__play('sheer-cold'));
s = await B(() => window.__battle().enemy.frostbite);
check(s === 8, `Sheer Cold doubles Frostbite (${s})`);
await B(() => window.__play('refrigerate'));
const blk = await B(() => window.__battle().block);
await B(() => window.__play('ice-spinner'));
s = await B(() => window.__battle().block);
check(s === blk + 3 + 2, `Refrigerate: a 0-cost card gives 2 more block (${blk} -> ${s})`);
const h0 = await B(() => window.__battle().hand.length);
await B(() => window.__play('snow-flurry'));
s = await B(() => window.__battle().hand.filter(h => h.card.id === 'icicle').length);
check(s === 2, `Snow Flurry: 2 Icicles in hand (${h0} -> ${s})`);
s = await B(() => window.__battle().discard.filter(c => c.cost === 0).length);
const back = await B(() => { const b = window.__battle(); return b.hand.length; });
await B(() => window.__play('glaciate'));
const after = await B(() => window.__battle().hand.length);
check(s >= 3 && after === back + s, `Glaciate brings back the ${s} 0-cost cards in the discard pile (hand ${back} -> ${after})`);
await B(() => window.__play('ice-age'));
await B(() => window.__play('cold-snap'));
const before = await B(() => ({ hp: window.__battle().enemy.hp, fb: window.__battle().enemy.frostbite, turns: window.__battle().weather.turns }));
await B(() => window.__endTurn());
s = await B(() => { const b = window.__battle(); return { hp: b.enemy.hp, fb: b.enemy.frostbite, w: b.weather }; });
check(before.hp - s.hp === 3 && s.w?.turns === before.turns - 1, `Hail chips 3 at the end of your turn (${before.hp} -> ${s.hp}), ${s.w?.turns} turn left`);
check(s.fb === before.fb + 3 - 1 + 2, `Frostbite: +3 Ice Age, thaws 1, +2 Cold Snap next turn (${before.fb} -> ${s.fb})`);
await B(() => window.__endTurn());
s = await B(() => window.__battle().weather);
check(s === null, 'Hail ends after its turns');
const e1 = await B(() => { window.__battle().energy = 5; return 5; });
await B(() => window.__play('blizzard'));
s = await B(() => window.__battle().energy);
check(s === e1 - 2, `out of Hail Blizzard costs 2 (${e1} -> ${s})`);
await B(() => window.__play('permafrost'));
const fb = await B(() => window.__battle().enemy.frostbite);
await B(() => window.__endTurn());
s = await B(() => window.__battle().enemy.frostbite);
check(s === fb + 2, `Permafrost: no thaw, Cold Snap's +2 (${fb} -> ${s})`);

// session 6: its relics at the fight's start, then its new keys and powers
await page.goto(`http://localhost:${port}/?arena=fight&starter=vanillite&relics=icy-rock,icicle-plate,snowball,safety-goggles`);
await page.waitForTimeout(8000);
await ready();
s = await B(() => { const b = window.__battle(); return { w: b.weather, ic: b.icicles, fb: b.enemy.frostbite }; });
check(s.w?.turns === 5 && s.ic === 2 && s.fb === 3, `Icy Rock: Hail 2 + 3 (${s.w?.turns}); Icicle Plate: 2 Icicles (${s.ic}); Snowball: Frostbite 3 (${s.fb})`);
await B(() => { const b = window.__battle(); b.energy = 30; b.enemy.hp = b.enemy.maxHp = 999; b.enemy.block = 0; b.enemy.vulnerable = 0; b.strength = 0; b.block = 0; b.kind = 'fight'; });
await calm();
check(await hit('ice-shard') === 3 + 3 + 3 + 4, 'Ice Shard with Icicle Plate: 3 + Hail 3 + Frostbite 3 + 4');
let blk0 = await B(() => window.__battle().block);
await B(() => window.__play('hoarfrost'));
s = await B(() => window.__battle().block);
check(s - blk0 === 5 + 2 * 3, `Hoarfrost: 5 + 2 a Frostbite (${s - blk0})`);
blk0 = s;
await B(() => window.__play('igloo'));
s = await B(() => window.__battle().block);
check(s - blk0 === 8 + 2 * 3, `Igloo: 8 + 2 an Icicle played (${s - blk0})`);
const sh = await hit('shatter');
s = await B(() => window.__battle().enemy.frostbite);
check(sh === 4 + 4 * 3 + 3 + 3 && s === 0, `Shatter: 4 + 4 a Frostbite, its +3 and Hail's (${sh}), then the Frostbite is gone (${s})`);
for (const id of ['ice-scales', 'ice-core', 'polar-vortex', 'icefall', 'endless-winter', 'cold-storage', 'ice-crown']) await B((c) => window.__play(c), id);
await B(() => { const b = window.__battle(); b.def = { ...b.def, moves: [{ kind: 'attack', amount: 1, name: 'Tackle', type: 'normal' }] }; b.enemy.moveIndex = 0; b.block = 0; b.enemy.frostbite = 4; b.hand = []; });
await B(() => window.__give('ice-shard'));
const pre = await B(() => ({ turns: window.__battle().weather.turns }));
await B(() => window.__endTurn());
s = await B(() => { const b = window.__battle(); return { w: b.weather, fb: b.enemy.frostbite, block: b.block, hand: b.hand.map(h => h.card.id) }; });
check(s.w?.turns === pre.turns, `Endless Winter: Hail doesn't run out (${pre.turns} -> ${s.w?.turns})`);
check(s.fb === 4 + 2 - 1, `Ice Scales: the attack adds Frostbite 2, then it thaws 1 (${s.fb})`);
check(s.hand.filter(id => id === 'icicle').length === 2 && s.hand.includes('ice-shard'), `Icefall's and Ice Crown's Icicles, and Cold Storage kept Ice Shard (${s.hand.join(' ')})`);
check(s.block >= 5, `Ice Core: block equal to its Frostbite at the turn's start (${s.block})`);

// a Duo Run: Snow Warning the first time Vanillite comes out, never again that fight
await page.goto(`http://localhost:${port}/?arena=fight&starter=charmander`);
await page.waitForTimeout(6000);
await ready();
await B(async () => {
  const b = window.__battle();
  const { STARTERS_BY_ID } = await import('/js/data/starters.js');
  b.duo = { run: { ids: ['charmander', 'vanillite'], out: 0 }, types: ['fire', 'ice'], came: [0], armed: false, switches: 0, piles: [null, { drawPile: STARTERS_BY_ID.vanillite.deck.map(() => b.hand[0].card), hand: [], discard: [], exhaust: [] }], drew: [true, false] };
  b.energy = 5;
});
s = await B(() => window.__battle().weather);
check(s === null, 'Charmander leads: no Hail yet');
await B(() => window.__play('baton-pass'));
s = await B(() => ({ out: window.__battle().starter.id, w: window.__battle().weather }));
check(s.out === 'vanillite' && s.w?.kind === 'hail' && s.w.turns === 2, `Vanillite comes out: Snow Warning's Hail 2 (${JSON.stringify(s.w)})`);
await B(() => window.__play('baton-pass'));
await B(() => window.__play('baton-pass'));
s = await B(() => window.__battle().weather);
check(s?.turns === 2, `a second time out doesn't add more Hail (${JSON.stringify(s)})`);

// every Ice card's art parses, and Vanillite's back sprite and cry load
s = await B(async () => {
  const { ICE } = await import('/js/card-art-ice.js');
  const broken = Object.entries(ICE).filter(([, svg]) => new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${svg.replaceAll('$', 'x')}</svg>`, 'image/svg+xml').querySelector('parsererror')).map(([id]) => id);
  const img = await new Promise(res => { const i = new Image(); i.onload = () => res(i.naturalWidth); i.onerror = () => res(0); i.src = '/assets/pokemon/vanilluxe-back.gif'; });
  const cry = (await fetch('/assets/audio/cries/vanillite.mp3')).ok;
  return { n: Object.keys(ICE).length, broken, img, cry };
});
check(s.n === 75 && !s.broken.length && s.img > 0 && s.cry, `${s.n} Ice arts parse${s.broken.length ? ` (broken: ${s.broken.join(', ')})` : ''}; Vanilluxe's back GIF ${s.img}px wide, Vanillite's cry ${s.cry ? 'there' : 'missing'}`);

const bad = errors.filter(e => !/favicon|net::|Failed to load resource|cloud|firebase|gstatic/i.test(e));
check(!bad.length, `no console errors${bad.length ? `: ${bad.slice(0, 3).join(' | ')}` : ''}`);
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
