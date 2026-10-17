import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EVENTS, EVENTS_BY_ID, snorlaxWakesAt, trashDig, dittoMorph, eventsFor, wheelSlice, idolBoulder, keystoneAsk, swapWares, swapGift } from '../js/data/events.js';
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
