/* ground-probe.mjs  -  Ground's mechanics in a real fight, headless (docs/duo-design.md section 5, "Ground's first
   session"): Dig cards going underground and surfacing at your next turn's start (their hits and blocks, Arena Trap,
   Excavate, Earth Power), Fault and its knock-out (half on an Alpha), Stomping Tantrum, Precipice Blades, Quicksand,
   Sandstorm's chip and its +3 on Ground blocks, Mud-Slap, Sand Force, Desert Spirit, Sand Stream, the Sturdy Ability;
   and the art, back sprites and cries:
     NODE_PATH=$(npm root -g) node tools/ground-probe.mjs
   Prints what it checks and exits 1 on a failed check or a console error. */
import { serve, launch, phone, threeCopy } from './probe-kit.mjs';

const HOOK = (path, body) => path === '/js/battle.js'
  ? body.toString() + `
window.__battle = () => battle;
window.__give = (id) => { const card = CARDS_BY_ID[id]; const uid = nextUid++; battle.hand.push({ uid, card }); renderAll(); return uid; };
window.__play = async (id) => { const uid = window.__give(id); await playCard(uid); for (let i = 0; i < 40 && battle.busy; i++) await sleep(100); };
window.__render = () => renderAll();
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

// Dig: underground when played, surfacing at your next turn's start
check(await gain('dig') === 6, 'Dig: block 6 now');
s = await B(() => { const b = window.__battle(); return { under: b.underground.map(u => u.card.id), inDiscard: b.discard.some(c => c.id === 'dig'), badge: [...document.querySelectorAll('#player-status .badge')].map(n => n.title).find(t => /^Underground/.test(t)) }; });
check(s.under.join() === 'dig' && !s.inDiscard && !!s.badge, `Dig goes underground, not to the discard pile (${s.badge})`);
await B(() => window.__play('tunnel'));
let pre = await B(() => window.__battle().enemy.hp);
await B(() => window.__endTurn());
s = await B(() => { const b = window.__battle(); return { hp: b.enemy.hp, under: b.underground.length, disc: b.discard.filter(c => ['dig', 'tunnel'].includes(c.id)).length }; });
check(pre - s.hp === 12 + 7 && s.under === 0 && s.disc === 2, `next turn they surface: 12 + 7, then to the discard pile (${pre - s.hp}, ${s.disc} discarded)`);

await fresh();
await B(() => window.__play('tunnel'));
await B(() => window.__play('tunnel'));
check(await hit('earth-power') === 6 + 12, 'Earth Power with 2 cards underground: 6 + 6 x2');
await B(() => window.__play('arena-trap'));
await B(() => window.__play('excavate'));
await B(() => window.__play('shore-up'));
pre = await B(() => window.__battle().enemy.hp);
await B(() => window.__endTurn());
s = await B(() => { const b = window.__battle(); return { hp: b.enemy.hp, hand: b.hand.length, block: b.block }; });
check(pre - s.hp === 7 + 7 + 7 * 3, `three surface: two Tunnels' 7 and Excavate's 7 each (${pre - s.hp})`);
check(s.hand === 5 + 3, `Arena Trap: a card for each that surfaced (hand ${s.hand})`);
check(s.block === 7, `Shore Up's Surface: block 7 on the new turn (${s.block})`);

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

// every Ground card's art parses, and Trapinch's line's back sprites and cries load
s = await B(async () => {
  const { GROUND } = await import('/js/card-art-ground.js');
  const broken = Object.entries(GROUND).filter(([, svg]) => new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${svg.replaceAll('$', 'x')}</svg>`, 'image/svg+xml').querySelector('parsererror')).map(([id]) => id);
  const ids = ['trapinch', 'vibrava', 'flygon'];
  const sizes = await Promise.all(ids.flatMap(id => [`${id}-back`, `${id}-shiny-back`]).map(f => new Promise(res => { const i = new Image(); i.onload = () => res(i.naturalWidth); i.onerror = () => res(0); i.src = `/assets/pokemon/${f}.gif`; })));
  const cries = await Promise.all(ids.map(async id => (await fetch(`/assets/audio/cries/${id}.mp3`)).ok));
  return { n: Object.keys(GROUND).length, broken, sizes, cries };
});
check(s.n === 38 && !s.broken.length && s.sizes.every(w => w > 0) && s.cries.every(Boolean), `${s.n} Ground arts parse${s.broken.length ? ` (broken: ${s.broken.join(', ')})` : ''}; back GIFs ${s.sizes.join(' ')}px; cries ${s.cries.join(' ')}`);

const bad = errors.filter(e => !/favicon|net::|Failed to load resource|cloud|firebase|gstatic/i.test(e));
check(!bad.length, `no console errors${bad.length ? `: ${bad.slice(0, 3).join(' | ')}` : ''}`);
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
