import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EVENTS, EVENTS_BY_ID, snorlaxWakesAt, trashDig, dittoMorph, eventsFor, wheelSlice, idolBoulder, keystoneAsk, swapWares, swapGift, libraryShelf, goopLoss, contestWinner, BASICS, tabletUps, bonfireGift, flipState, rivalWants } from '../js/data/events.js';
import { poolForType } from '../js/data/cards.js';
import { RELICS_BY_ID, prizeMult } from '../js/data/relics.js';

const snorlax = EVENTS_BY_ID['sleeping-snorlax'], heap = EVENTS_BY_ID['trash-heap'];

test('every event has a unique id, a name, an icon and text', () => {
  assert.equal(new Set(EVENTS.map(e => e.id)).size, EVENTS.length);
  for (const e of EVENTS) assert.ok(e.name && e.icon && e.text, e.id);
});

test('the Snorlax wakes on the first search whose roll is under its odds, or sleeps through', () => {
  assert.equal(snorlaxWakesAt(snorlax, [0.1, 0, 0]), 0);
  assert.equal(snorlaxWakesAt(snorlax, [0.3, 0.4, 0]), 1);
  assert.equal(snorlaxWakesAt(snorlax, [0.9, 0.9, 0.7]), 2);
  assert.equal(snorlaxWakesAt(snorlax, [0.9, 0.9, 0.9]), snorlax.loot.length);
});

test('each dig of the trash heap costs one HP more and is likelier to find the relic, never past certain', () => {
  const first = trashDig(heap, 0, 0), third = trashDig(heap, 2, 0);
  assert.equal(third.hp, first.hp + 2);
  assert.ok(third.odds > first.odds);
  assert.equal(trashDig(heap, 50, 0).odds, 1);
  assert.equal(trashDig(heap, 0, 3).hp, heap.digHp[3]);
});

test("Ditto's Transform never gives back the same card, or one you hold too many of", () => {
  const offers = { common: ['ember', 'scratch', 'growl'] };
  const held = { scratch: 4 };
  assert.equal(dittoMorph(offers, { id: 'ember' }, (id) => held[id] || 0, 4), 'growl');
  assert.equal(dittoMorph(offers, { id: 'ember', rarity: 'rare' }, () => 0, 4), null);
});

test("Bill's PC stays out of Safari days and climbs, Abra out of climbs", () => {
  assert.ok(eventsFor('run').some(e => e.id === 'bills-pc'));
  assert.ok(!eventsFor('safari').some(e => e.id === 'bills-pc'));
  assert.ok(!eventsFor('tower').some(e => e.id === 'bills-pc' || e.id === 'abra'));
  assert.ok(eventsFor('safari').some(e => e.id === 'abra'));
});

const wheel = EVENTS_BY_ID['prize-wheel'], idol = EVENTS_BY_ID['ruins-idol'], keystone = EVENTS_BY_ID['odd-keystone'], stall = EVENTS_BY_ID['swap-stall'];

test('the Prize Wheel gives every slice an even share of the rolls, the last one included', () => {
  const counts = {};
  for (let i = 0; i < 600; i++) { const s = wheelSlice(wheel, i / 600); counts[s] = (counts[s] || 0) + 1; }
  for (const s of wheel.slices) assert.equal(counts[s], 100, s);
  assert.equal(wheelSlice(wheel, 0.9999999), wheel.slices.at(-1));
  assert.ok(wheel.slices.includes('heal'));
});

test("the Ruins Idol is the Relic Statue, never offered, and the boulder's two prices round up", () => {
  const statue = RELICS_BY_ID[idol.relic];
  assert.ok(statue.unique && statue.event === idol.id);
  assert.deepEqual(idolBoulder(idol, 70), { hp: 18, maxHp: 6 });
  assert.equal(prizeMult([]), 1);
  assert.equal(prizeMult(['relic-statue']), 1.25);
  assert.equal(prizeMult(['amulet-coin', 'relic-statue']), 2.5);
});

test('each ask of the Odd Keystone costs one HP more than the last', () => {
  assert.equal(keystoneAsk(keystone, 0, 0), keystone.askHp[0]);
  assert.equal(keystoneAsk(keystone, 3, 2), keystone.askHp[2] + 3);
});

test('Kecleon only asks for common and uncommon relics, two different ones, and gives one a tier rarer you lack', () => {
  const owned = ['muscle-band', 'leftovers', 'scope-lens', 'choice-band', 'exp-share'].map(id => RELICS_BY_ID[id]);
  const wares = swapWares(stall, owned, [0.99, 0]);
  assert.equal(wares.length, 2);
  assert.deepEqual(wares.map(r => r.id).sort(), ['leftovers', 'muscle-band']);
  assert.equal(swapWares(stall, [RELICS_BY_ID['scope-lens']], [0.5, 0.5]).length, 0);
  const offers = ['scope-lens', 'shell-bell', 'focus-sash'].map(id => RELICS_BY_ID[id]);
  assert.equal(swapGift(stall, RELICS_BY_ID['muscle-band'], offers, []).id, 'shell-bell');
  assert.equal(swapGift(stall, RELICS_BY_ID['leftovers'], offers, ['scope-lens']).id, 'focus-sash');
  assert.equal(swapGift(stall, RELICS_BY_ID['leftovers'], offers, ['scope-lens', 'focus-sash']), null);
});

const library = EVENTS_BY_ID['canalave-library'], goop = EVENTS_BY_ID['sludge-pit'], contest = EVENTS_BY_ID['bug-contest'];

test("the Library's shelf holds 20 different moves of your type's pool, never an evolution or unplayable card", () => {
  for (const type of ['fire', 'grass', 'water']) {
    const pool = poolForType(type), shelf = libraryShelf(library, pool);
    assert.equal(shelf.length, library.books, type);
    assert.equal(new Set(shelf.map(c => c.id)).size, shelf.length);
    assert.ok(shelf.every(c => pool.includes(c) && !c.evoOnly && !c.unplayable));
  }
});

test('climbing out of the Sludge Pit costs ₽ between the biome\'s two numbers, never more than you have', () => {
  for (let biome = 0; biome < 4; biome++) {
    const [lo, hi] = goop.lose[biome];
    assert.equal(goopLoss(goop, 0, biome, 999), lo);
    assert.equal(goopLoss(goop, 0.9999999, biome, 999), hi);
    for (let i = 0; i < 50; i++) { const n = goopLoss(goop, i / 50, biome, 999); assert.ok(n >= lo && n <= hi); }
  }
  assert.equal(goopLoss(goop, 0.5, 2, 12), 12);
  assert.equal(goopLoss(goop, 0.5, 2, 0), 0);
});

test('Scyther wins the Bug-Catching Contest 7 times in 10, and a bet on the underdog pays more', () => {
  let wins = 0;
  for (let i = 0; i < 1000; i++) if (contestWinner(contest, i / 1000) === 'favourite') wins++;
  assert.equal(wins, 700);
  assert.ok(contest.pays.underdog > contest.pays.favourite);
  // the underdog's bet is worth a touch more on average, as StS's Joust's is
  assert.ok((1 - contest.favourite) * contest.pays.underdog > contest.favourite * contest.pays.favourite);
});

test("batch 3's five are in every run's bag, and the Sludge Pit's numbers come per biome", () => {
  for (const key of ['goopMoney', 'goopHp', 'lose']) assert.equal(goop[key].length, 4, key);
  for (const e of ['fishing-spot', 'silph-storeroom', 'canalave-library', 'bug-contest', 'sludge-pit']) assert.ok(eventsFor('run').some(x => x.id === e), e);
});

const tablet = EVENTS_BY_ID['unown-tablet'], bonfire = EVENTS_BY_ID['litwick-bonfire'], flip = EVENTS_BY_ID['voltorb-flip'];

test("each type's two basics are an attack and a block its starting deck holds, and both can PP Up", async () => {
  const { STARTERS } = await import('../js/data/starters.js');
  const { CARDS_BY_ID, canUpgrade } = await import('../js/data/cards.js');
  for (const starter of STARTERS.filter(s => BASICS[s.type])) {
    for (const id of BASICS[starter.type]) {
      assert.ok(starter.deck.includes(id), `${starter.id} starts with ${id}`);
      assert.ok(canUpgrade(CARDS_BY_ID[id]), id);
    }
  }
});

test('the Unown Tablet PP Ups every copy of the basics not yet PP Upped, and nothing else', () => {
  const deck = ['ember', 'ember+', 'flame-wall', 'scorch', 'ember', 'flame-wall+'];
  assert.deepEqual(tabletUps('fire', deck), [0, 2, 4]);
  assert.deepEqual(tabletUps('fire', ['scorch']), []);
  assert.deepEqual(tabletUps('normal', deck), []);
});

test('the Litwick Bonfire warms by rarity: a basic least, an uncommon fully, a rare with max HP too', () => {
  const card = (id, rarity) => ({ id, rarity });
  assert.equal(bonfireGift(bonfire, card('ember+'), 'fire', 0).rank, 'basic');
  assert.equal(bonfireGift(bonfire, card('vine-whip'), 'fire', 0).rank, 'common');
  const [basic, common, uncommon, rare] = [card('ember'), card('scorch'), card('x', 'uncommon'), card('y', 'rare')].map(c => bonfireGift(bonfire, c, 'fire', 2));
  assert.ok(basic.heal < common.heal && common.heal < uncommon.heal);
  assert.equal(uncommon.heal, 1);
  assert.equal(rare.heal, 1);
  assert.equal(rare.maxHp, bonfire.rareMaxHp[2]);
  assert.equal(uncommon.maxHp, 0);
});

test('Voltorb Flip counts its tries, keeps matched moves, and is over once only Voltorb lie face down', () => {
  const board = ['a', 'voltorb', 'b', 'a', 'c', 'b', 'voltorb', 'c'];
  let g = flipState(flip, board, []);
  assert.equal(g.left, flip.tries);
  assert.equal(g.over, false);
  g = flipState(flip, board, [0, 3, 1, 2]);
  assert.deepEqual(g.won, ['a']);
  assert.deepEqual([...g.matched].sort(), [0, 3]);
  assert.equal(g.left, flip.tries - 2);
  g = flipState(flip, board, [1, 6]);
  assert.equal(g.zapped, true);
  assert.deepEqual(g.won, []);
  g = flipState(flip, board, [0, 3, 2, 5, 4, 7]);
  assert.deepEqual(g.won, ['a', 'b', 'c']);
  assert.equal(g.over, true);
  assert.equal(flipState(flip, board, [0, 1, 0, 1, 0, 1, 0, 1]).over, true);
  assert.equal(flipState(flip, board, [0, 0]).matched.size, 0);
});

test('your rival asks for one of the list by its roll, and for nothing from an empty one', () => {
  assert.equal(rivalWants(['a', 'b', 'c'], 0), 'a');
  assert.equal(rivalWants(['a', 'b', 'c'], 0.99999), 'c');
  assert.equal(rivalWants(['a', 'b', 'c'], 0.5), 'b');
  assert.equal(rivalWants([], 0.5), null);
});

test("batch 3's last five are in every run's bag, which now holds 30", () => {
  for (const e of ['unown-tablet', 'smeargle-studio', 'litwick-bonfire', 'voltorb-flip', 'rivals-return']) assert.ok(eventsFor('run').some(x => x.id === e), e);
  assert.equal(EVENTS.length, 30);
});
