import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BERRIES, BERRY, DAY_CAP, sow, stageOf, minutesLeft, harvest, coinsLeft, picked, water, canWater, wetToday, yieldOf, sell } from '../js/data/berries.js';
import { FURNITURE_BY_KIND, isEarned } from '../js/data/furniture.js';

const DAY = 864e5, noon = Date.UTC(2026, 9, 14, 12);

test('a berry ripens on the UTC midnight its days end, sprouting then blooming on the way', () => {
  const crop = sow('sitrus', noon);
  assert.equal(crop.ready, Date.UTC(2026, 9, 16));
  assert.equal(stageOf(crop, noon), 'sprout');
  assert.equal(stageOf(crop, noon + DAY), 'bloom');
  assert.equal(stageOf(crop, crop.ready - 1), 'bloom');
  assert.equal(stageOf(crop, crop.ready), 'fruit');
  assert.equal(minutesLeft(crop, crop.ready - 6e4), 1);
  assert.equal(stageOf(undefined), null);
  assert.equal(stageOf({ id: 'gone', at: 0, ready: 1 }), null);
});

test('picking gives berries, the first of a kind its basket as well, and no coins', () => {
  const b = {}, plot = () => ({ id: 'berryplot', crop: sow('lum', noon - 3 * DAY) });
  assert.equal(harvest(b, { crop: sow('lum', noon) }, noon), null, 'nothing to pick before it is ripe');
  const first = harvest(b, plot(), noon);
  assert.deepEqual([first.berry.id, first.n, first.basket, first.coins], ['lum', 1, true, undefined]);
  assert.ok(isEarned(FURNITURE_BY_KIND.lumbasket, { secretBase: b }));
  assert.ok(!isEarned(FURNITURE_BY_KIND.oranbasket, { secretBase: b }));
  const it = plot(), again = harvest(b, it, noon);
  assert.ok(!again.basket && again.n === 1);
  assert.equal(it.crop, undefined);
  assert.deepEqual(picked({ secretBase: b }), ['lum']);
  assert.equal(b.garden.coins, undefined, 'picking books no sales');
});

test('a growing crop takes water once a UTC day, and gives a berry more for each day watered', () => {
  const crop = sow('lum', noon);
  assert.ok(canWater(crop, noon) && !wetToday(crop, noon));
  assert.ok(water(crop, noon));
  assert.ok(!water(crop, noon + 60e3), 'once a day');
  assert.ok(wetToday(crop, noon) && !wetToday(crop, noon + DAY));
  assert.ok(water(crop, noon + DAY));
  assert.ok(water(crop, noon + 2 * DAY - 6 * 36e5));
  assert.ok(!water(crop, crop.ready), 'a ripe crop needs none');
  assert.ok(!water(undefined, noon), 'nor an empty plot');
  assert.deepEqual(crop.wet, ['2026-10-14', '2026-10-15', '2026-10-16']);
  assert.equal(yieldOf(crop), 4);
  const got = harvest({}, { crop }, crop.ready);
  assert.equal(got.n, 4);
});

test('berries sell at their price, never past the day\'s cap, which a new UTC day lifts', () => {
  const b = {};
  assert.deepEqual(sell(b, 'cheri', 0, noon), { n: 0, coins: 0 });
  assert.deepEqual(sell(b, 'gone', 3, noon), { n: 0, coins: 0 });
  assert.deepEqual(sell(b, 'sitrus', 3, noon), { n: 3, coins: 3 * BERRY.sitrus.coins });
  const lum = sell(b, 'lum', 5, noon);
  assert.equal(lum.n, Math.floor((DAY_CAP - 60) / BERRY.lum.coins));
  assert.ok(coinsLeft(b.garden, noon) >= 0 && coinsLeft(b.garden, noon) < BERRY.lum.coins);
  let total = 3 * BERRY.sitrus.coins + lum.coins;
  for (let i = 0; i < 20; i++) total += sell(b, 'cheri', 1, noon).coins;
  assert.ok(total <= DAY_CAP && DAY_CAP - total < BERRY.cheri.coins);
  assert.equal(coinsLeft(b.garden, noon + DAY), DAY_CAP, 'a new UTC day buys again');
  assert.equal(sell(b, 'lum', 9, noon + DAY).n, Math.floor(DAY_CAP / BERRY.lum.coins));
});

test('the garden pays well under the Game Corner\'s ~380 a day, and every berry has a basket', () => {
  assert.ok(DAY_CAP <= 150);
  for (const berry of BERRIES) {
    assert.ok(berry.days >= 1 && berry.coins > 0 && berry.coins / berry.days <= 15, berry.id);
    assert.ok(FURNITURE_BY_KIND[`${berry.id}basket`], berry.id);
  }
});
