import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EVENTS, EVENTS_BY_ID, snorlaxWakesAt, trashDig, dittoMorph, eventsFor } from '../js/data/events.js';

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
