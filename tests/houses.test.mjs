import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HOUSES, HOUSES_BY_ID, TIERS, REPAINT_PRICE, HOUSES_LIVE, housesOf, homeOf, cantBuy, buyHouse, firstHouse, moveIn, repaint } from '../js/data/houses.js';

test('players see no houses until the playtest says go', () => {
  assert.equal(HOUSES_LIVE, false);
});

test('every house has a tier and three paints, the tree its crown\'s colours', () => {
  for (const h of HOUSES) {
    assert.ok(TIERS.some(t => t.id === h.tier), h.id);
    assert.equal(h.paints.length, 3, h.id);
    for (const p of h.paints) assert.ok(p.name, h.id);
  }
  for (const p of HOUSES_BY_ID.tree.paints) assert.equal(p.shade.length, 4);
  assert.equal(HOUSES_BY_ID.tree.price, null);
});

test('an old save keeps the Ancient Tree and has the Starter Cottage free', () => {
  const save = { baseOwned: true, coins: 0 };
  assert.deepEqual(housesOf(save), { owned: ['cottage', 'tree'], home: 'tree', paint: {} });
  assert.deepEqual(homeOf(save), { id: 'tree', paint: 0 });
  assert.equal(cantBuy(save, 'tree'), 'owned');
});

test('no base, no houses, and nothing to buy but the base', () => {
  const save = { coins: 9999 };
  assert.deepEqual(housesOf(save), { owned: [], home: null, paint: {} });
  assert.equal(homeOf(save), null);
  assert.equal(cantBuy(save, 'cabin'), 'base');
  assert.equal(buyHouse(save, 'cabin'), false);
});

test('a base bought with houses on is a Starter Cottage, in the paint picked', () => {
  const d = { baseOwned: true };
  firstHouse(d, 2);
  assert.deepEqual(housesOf(d), { owned: ['cottage'], home: 'cottage', paint: { cottage: 2 } });
  assert.equal(cantBuy(d, 'tree'), 'earned');
});

test('buying pays, moves in and keeps the first paint job free', () => {
  const d = { baseOwned: true, coins: 1600 };
  assert.equal(buyHouse(d, 'cabin', 1), true);
  assert.equal(d.coins, 100);
  assert.deepEqual(housesOf(d), { owned: ['cottage', 'tree', 'cabin'], home: 'cabin', paint: { cabin: 1 } });
  assert.equal(cantBuy(d, 'bungalow'), 'coins');
  assert.equal(buyHouse(d, 'bungalow'), false);
  assert.equal(d.coins, 100);
});

test('moving is free between owned houses, each keeping its paint', () => {
  const d = { baseOwned: true, coins: 2000 };
  buyHouse(d, 'bungalow', 2);
  assert.equal(moveIn(d, 'cabin'), false);
  assert.equal(moveIn(d, 'tree'), true);
  assert.deepEqual(homeOf(d), { id: 'tree', paint: 0 });
  assert.equal(d.coins, 500);
  moveIn(d, 'bungalow');
  assert.deepEqual(homeOf(d), { id: 'bungalow', paint: 2 });
});

test('a repaint costs 250, and not for the paint it already wears', () => {
  const d = { baseOwned: true, coins: REPAINT_PRICE + 10 };
  assert.equal(repaint(d, 'tree', 0), false);
  assert.equal(repaint(d, 'tree', 1), true);
  assert.equal(d.coins, 10);
  assert.equal(repaint(d, 'cottage', 2), false);
  assert.equal(repaint(d, 'cabin', 1), false);
  assert.deepEqual(housesOf(d).paint, { tree: 1 });
});

test('a stored list with unknown ids or a lost cottage is mended on read', () => {
  const save = { baseOwned: true, houses: { owned: ['castle', 'cabin'], home: 'castle', paint: { cabin: 9, cottage: 1 } } };
  assert.deepEqual(housesOf(save), { owned: ['cottage', 'cabin'], home: 'cottage', paint: { cottage: 1 } });
});
