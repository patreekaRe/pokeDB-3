// The Poké Mall's Furniture store (js/secret-base.js): each floor's daily stock, the second floor's never the first's.
import test from 'node:test';
import assert from 'node:assert/strict';
import { FURNITURE_BY_KIND } from '../js/data/furniture.js';

// js/secret-base.js reaches the save and the page at load; a bare stand-in is enough for the stock
globalThis.location ??= { search: '', pathname: '/', hostname: 'localhost' };
const mem = new Map();
globalThis.localStorage ??= { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
const { furnitureStock, shopStock } = await import('../js/secret-base.js');

test('each floor sells 8 pieces a day, the same for everyone, never the same piece twice', () => {
  for (const day of ['2026-10-08', '2026-10-09', '2027-01-01']) {
    const one = furnitureStock(day), two = furnitureStock(day, 2);
    assert.equal(one.length, 8);
    assert.equal(two.length, 8);
    assert.deepEqual(furnitureStock(day), one);
    assert.equal(new Set([...one, ...two]).size, 16);
    for (const id of [...one, ...two]) assert.ok(!FURNITURE_BY_KIND[id], `${id} is earned, never sold`);
  }
});

test('the Shop tab lists the second floor only once it is open', () => {
  assert.equal(shopStock({}).length, 8);
  assert.equal(shopStock({ upstairs: true }).length, 16);
});
