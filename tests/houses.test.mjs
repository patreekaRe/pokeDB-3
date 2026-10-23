import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HOUSES, HOUSES_BY_ID, TIERS, REPAINT_PRICE, HOUSES_LIVE, housesOf, homeOf, cantBuy, buyHouse, firstHouse, moveIn, repaint, EARN, earnedOf, claimEarned, onSale } from '../js/data/houses.js';
import { GYM_LEADERS } from '../js/data/gym.js';
import { RING } from '../js/data/towns.js';

test('players see no houses until the playtest says go', () => {
  assert.equal(HOUSES_LIVE, false);
});

test('every house has a tier and eight paints, the tree its crown\'s colours', () => {
  for (const h of HOUSES) {
    assert.ok(TIERS.some(t => t.id === h.tier), h.id);
    assert.equal(h.paints.length, 8, h.id);
    assert.equal(new Set(h.paints.map(p => p.name)).size, 8, h.id);
    for (const p of h.paints) assert.ok(p.name, h.id);
  }
  for (const p of HOUSES_BY_ID.tree.paints) assert.equal(p.shade.length, 4);
  assert.equal(HOUSES_BY_ID.tree.price, 0);
});

test('every paint names each colour its house is built from, and its swatch\'s two', () => {
  for (const h of HOUSES) {
    const keys = Object.keys(h.paints[0]).sort();
    for (const p of h.paints) assert.deepEqual(Object.keys(p).sort(), keys, `${h.id} ${p.name}`);
    if (h.id === 'tree') continue;
    for (const k of h.swatch || ['roof', 'wall']) assert.match(h.paints[0][k], /^#[0-9a-f]{6}$/, `${h.id} ${k}`);
    for (const p of h.paints) for (const k of keys) if (k !== 'name') assert.match(p[k], /^#[0-9a-f]{6}$/, `${h.id} ${p.name} ${k}`);
  }
});

test('the coin houses: six Homesteads from 1,500 to 2,000 and six Estates from 5,000 to 8,000', () => {
  const tier = (t) => HOUSES.filter(h => h.tier === t).map(h => [h.id, h.price]);
  assert.deepEqual(tier('homestead'), [['cabin', 1500], ['bungalow', 1500], ['mushroom', 2000], ['barn', 2000], ['treehouse', 2000], ['windmill', 1800]]);
  assert.deepEqual(tier('estate'), [['machiya', 5000], ['lighthouse', 6000], ['glasshouse', 6000], ['victorian', 8000], ['riad', 6500], ['pagoda', 7000]]);
  const d = { baseOwned: true, coins: 8000 };
  assert.equal(cantBuy(d, 'victorian'), null);
  assert.equal(buyHouse(d, 'victorian', 7), true);
  assert.equal(d.coins, 0);
  assert.deepEqual(homeOf(d), { id: 'victorian', paint: 7 });
  assert.equal(cantBuy(d, 'machiya'), 'coins');
});

test('an old save keeps the Ancient Tree and has the Starter Cottage free', () => {
  const save = { baseOwned: true, coins: 0 };
  assert.deepEqual(housesOf(save), { owned: ['tree', 'cottage'], home: 'tree', paint: {} });
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

test('a base bought with houses on lives in the Ancient Tree, the Starter Cottage free beside it', () => {
  const d = { baseOwned: true };
  firstHouse(d, 2);
  assert.deepEqual(housesOf(d), { owned: ['tree', 'cottage'], home: 'tree', paint: { tree: 2 } });
  assert.equal(TIERS.map(t => t.id).join(), 'starter,homestead,estate,earned,seasonal,legendary');
  assert.equal(cantBuy(d, 'tree'), 'owned');
  const c = { baseOwned: true };
  firstHouse(c, 1, 'cottage');
  assert.deepEqual(housesOf(c), { owned: ['tree', 'cottage'], home: 'cottage', paint: { cottage: 1 } });
  firstHouse(c, 0, 'cabin');
  assert.equal(homeOf(c).id, 'tree');
});

test('buying pays, moves in and keeps the first paint job free', () => {
  const d = { baseOwned: true, coins: 1600 };
  assert.equal(buyHouse(d, 'cabin', 1), true);
  assert.equal(d.coins, 100);
  assert.deepEqual(housesOf(d), { owned: ['tree', 'cottage', 'cabin'], home: 'cabin', paint: { cabin: 1 } });
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
  assert.equal(repaint(d, 'tree', 8), false);
  assert.equal(repaint(d, 'cabin', 1), false);
  assert.deepEqual(housesOf(d).paint, { tree: 1 });
});

test('a stored list with unknown ids or a lost cottage is mended on read', () => {
  const save = { baseOwned: true, houses: { owned: ['castle', 'cabin'], home: 'castle', paint: { cabin: 9, cottage: 1 } } };
  assert.deepEqual(housesOf(save), { owned: ['tree', 'cottage', 'cabin'], home: 'tree', paint: { cottage: 1 } });
});

test('the earned houses are never sold, each earned by what the save already keeps', () => {
  const earned = HOUSES.filter(h => h.earn).map(h => [h.id, h.earn]);
  assert.deepEqual(earned, [['gymhall', 'gyms'], ['ryokan', 'waystones'], ['lodge', 'safari'], ['spire', 'summit'], ['balldome', 'master'], ['keep', 'champion'], ['observatory', 'pokedex'], ['crystal', 'eternatus']]);
  for (const [id, key] of earned) { assert.equal(HOUSES_BY_ID[id].price, null, id); assert.equal(typeof EARN[key], 'function', id); assert.equal(EARN[key]({}), false, id); }
  assert.equal(EARN.gyms({ gym: Object.fromEntries(GYM_LEADERS.map(l => [l.id, 1])) }), true);
  assert.equal(EARN.gyms({ gym: Object.fromEntries(GYM_LEADERS.slice(1).map(l => [l.id, 3])) }), false);
  assert.equal(EARN.waystones({ towns: Object.fromEntries(RING.map(t => [t.id, { quest: { lit: true } }])) }), true);
  assert.equal(EARN.waystones({ towns: Object.fromEntries(RING.slice(1).map(t => [t.id, { quest: { lit: true } }])) }), false);
  assert.equal(EARN.safari({ safariDex: { complete: true } }), true);
  assert.equal(EARN.summit({ tower: { bestEver: 100 } }), true);
  assert.equal(EARN.summit({ tower: { bestEver: 99 } }), false);
  assert.equal(EARN.master({ badges: ['master'] }), true);
  assert.equal(EARN.eternatus({ feats: ['eternatus'] }), true);
  assert.equal(EARN.champion({ stats: { maxLevelWinByType: { fire: 9, grass: 10, water: -1 } } }), true);
  assert.equal(EARN.champion({ stats: { maxLevelWinByType: { fire: 9, grass: 5, water: -1 } } }), false);
  assert.equal(EARN.pokedex({ dex: { complete: true } }), true);
  assert.equal(EARN.pokedex({ badges: ['pokedex'] }), true);
  assert.equal(cantBuy({ baseOwned: true, coins: 1e6 }, 'gymhall'), 'earned');
});

test('an earned house is owned as soon as it is earned, and stored for good once claimed', () => {
  const d = { baseOwned: true, badges: ['master'] };
  firstHouse(d);
  assert.deepEqual(housesOf(d).owned, ['tree', 'cottage', 'balldome']);
  assert.equal(moveIn(d, 'balldome'), true);
  assert.deepEqual(claimEarned(d), []);
  d.badges.push('depths');
  assert.deepEqual(claimEarned(d), ['crystal']);
  d.badges = [];
  assert.deepEqual(housesOf(d).owned, ['tree', 'cottage', 'balldome', 'crystal']);
  assert.deepEqual(claimEarned(d), []);
});

test('an old save keeps its tree without a letter for it, and no base claims nothing', () => {
  const old = { baseOwned: true, badges: ['clearing', 'depths'] };
  assert.deepEqual(claimEarned(old), ['crystal']);
  assert.deepEqual(old.houses, { owned: ['tree', 'cottage', 'crystal'], home: 'tree', paint: {} });
  const none = { badges: ['master'] };
  assert.deepEqual(claimEarned(none), []);
  assert.equal(none.houses, undefined);
  assert.deepEqual(housesOf(none).owned, []);
  assert.deepEqual(earnedOf(none), ['balldome']);
});

test('the seasonal houses: 3,000 in their own month only, and kept for good once bought', () => {
  const tier = HOUSES.filter(h => h.tier === 'seasonal').map(h => [h.id, h.price, h.season]);
  assert.deepEqual(tier, [['teahouse', 3000, 4], ['chateau', 3000, 10], ['chalet', 3000, 12]]);
  const oct = new Date(Date.UTC(2026, 9, 31, 23)), nov = new Date(Date.UTC(2026, 10, 1)), dec = new Date(Date.UTC(2026, 11, 5));
  assert.equal(onSale(HOUSES_BY_ID.chateau, oct), true);
  assert.equal(onSale(HOUSES_BY_ID.chateau, nov), false);
  assert.equal(onSale(HOUSES_BY_ID.chalet, dec), true);
  assert.equal(onSale(HOUSES_BY_ID.cabin, nov), true);
  const d = { baseOwned: true, coins: 3000 };
  assert.equal(cantBuy(d, 'chateau', nov), 'season');
  assert.equal(buyHouse(d, 'chateau', 0, nov), false);
  assert.equal(buyHouse(d, 'chateau', 3, oct), true);
  assert.equal(d.coins, 0);
  assert.equal(cantBuy(d, 'chateau', nov), 'owned');
  assert.deepEqual(homeOf(d), { id: 'chateau', paint: 3 });
});
