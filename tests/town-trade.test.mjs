import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS } from '../js/data/items.js';
import { offersFor, TRADE_OFFERS } from '../js/data/towns.js';

const commons = ITEMS.filter(i => i.rarity === 'common' && !i.only).map(i => i.id);

test('different Bag items of one rarity get different offers', () => {
  const held = commons.slice(0, 3), offers = { common: commons };
  const sets = held.map(id => offersFor(offers, id, held));
  sets.forEach(s => assert.equal(s.length, TRADE_OFFERS));
  const all = sets.flat();
  assert.equal(new Set(all).size, all.length);
  all.forEach(id => assert.ok(!held.includes(id)));
});

test('a short rarity still offers what it has', () => {
  const held = [commons[0]], offers = { common: commons.slice(0, 3) };
  assert.deepEqual(offersFor(offers, commons[0], held), commons.slice(1, 3));
});
