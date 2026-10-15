import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BERRIES, DAY_CAP, sow, stageOf, minutesLeft, harvest, coinsLeft, picked } from '../js/data/berries.js';
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

test('the first of a berry is its basket, the rest coins, never past the day\'s cap', () => {
  const b = {}, plot = () => ({ id: 'berryplot', crop: sow('lum', noon - 3 * DAY) });
  assert.equal(harvest(b, { crop: sow('lum', noon) }, noon), null, 'nothing to pick before it is ripe');
  const first = harvest(b, plot(), noon);
  assert.ok(first.basket && first.coins === 0);
  assert.ok(isEarned(FURNITURE_BY_KIND.lumbasket, { secretBase: b }));
  assert.ok(!isEarned(FURNITURE_BY_KIND.oranbasket, { secretBase: b }));
  let total = 0;
  for (let i = 0; i < 10; i++) { const it = plot(); total += harvest(b, it, noon).coins; assert.equal(it.crop, undefined); }
  assert.equal(total, DAY_CAP);
  assert.equal(coinsLeft(b.garden, noon), 0);
  assert.equal(coinsLeft(b.garden, noon + DAY), DAY_CAP, 'a new UTC day buys again');
  assert.deepEqual(picked({ secretBase: b }), ['lum']);
});

test('the garden pays well under the Game Corner\'s ~380 a day, and every berry has a basket', () => {
  assert.ok(DAY_CAP <= 150);
  for (const berry of BERRIES) {
    assert.ok(berry.days >= 1 && berry.coins > 0 && berry.coins / berry.days <= 15, berry.id);
    assert.ok(FURNITURE_BY_KIND[`${berry.id}basket`], berry.id);
  }
});
