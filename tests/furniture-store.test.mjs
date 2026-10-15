// The Poké Mall's Furniture store (js/secret-base.js): each floor's daily stock, the second floor's never the first's.
import test from 'node:test';
import assert from 'node:assert/strict';
import { FURNITURE_BY_KIND } from '../js/data/furniture.js';

// js/secret-base.js reaches the save and the page at load; a bare stand-in is enough for the stock
globalThis.location ??= { search: '', pathname: '/', hostname: 'localhost' };
const mem = new Map();
globalThis.localStorage ??= { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
const { furnitureStock, shopStock, dealDay, PIECES } = await import('../js/secret-base.js');

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


test('a piece you own is never dealt again', () => {
  const day = '2026-11-02', [one, two] = dealDay(day), owned = {};
  for (const id of [...one, ...two]) owned[PIECES[id].own] = 1;
  const [a, b] = dealDay(day, owned);
  assert.equal(a.length, 8);
  assert.equal(b.length, 8);
  for (const id of [...a, ...b]) assert.ok(!owned[PIECES[id].own], `${id} is owned, so never offered`);
  assert.deepEqual(dealDay(day, owned), [a, b]);
});

test('the backyard\'s pieces are never on the stands, and stand only out in the yard', async () => {
  const { fitsHere, DESIGNS } = await import('../js/secret-base.js');
  const yard = DESIGNS.filter(id => PIECES[id].outdoor);
  assert.ok(yard.length >= 12);
  for (const day of ['2026-10-14', '2026-12-25']) for (const id of [...furnitureStock(day), ...furnitureStock(day, 2)]) assert.ok(!PIECES[id].outdoor, `${id} is the garden catalogue's`);
  assert.ok(fitsHere(yard[0], { here: 'yard' }));
  assert.ok(!fitsHere(yard[0], {}));
  assert.ok(!fitsHere('bed', { here: 'yard' }));
  assert.ok(fitsHere('bed', { here: 'r1' }));
});
