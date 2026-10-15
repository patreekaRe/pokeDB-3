import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runMods, sealedMult, SEALED_WEAKNESS } from '../js/data/difficulty.js';
import { STARTERS_BY_ID } from '../js/data/starters.js';
import { weaknessShards, shardsPlaced, placeOf, RING } from '../js/data/towns.js';
import { campLines, runLines, strengthOf } from '../js/data/camp.js';

test('the Sealed Weakness starts at half and gives a tenth back a shard', () => {
  assert.equal(sealedMult(0), SEALED_WEAKNESS.base);
  assert.equal(strengthOf(0), 50);
  assert.equal(strengthOf(3), 80);
  assert.equal(sealedMult(5), 1);
  assert.equal(sealedMult(9), 1);
});

test('only Mewtwo, and only in the Depths, carries it', () => {
  const mewtwo = STARTERS_BY_ID.mewtwo, fire = STARTERS_BY_ID.charmander;
  assert.equal(runMods(mewtwo, 0, 3, 0).playerDmg, 0.5);
  assert.equal(runMods(mewtwo, 0, 3, 2).playerDmg, 0.7);
  assert.equal(runMods(mewtwo, 0, 0, 0).playerDmg, 1.25);   // its sprint keeps its +25%
  assert.equal(runMods(fire, 0, 3, 0).playerDmg ?? 1, 1);
});

test('with the towns off the shards don\'t count yet: full strength', () => {
  assert.equal(shardsPlaced({}), 0);
  assert.equal(weaknessShards({}), RING.length);
});

test('the camp is a place of its own, and Mewtwo\'s lines follow the shards', () => {
  assert.equal(placeOf('depths').homes.camp.mewtwo, true);
  for (let n = 0; n <= 5; n++) {
    assert.ok(campLines(n).length >= 3);
    assert.ok(runLines(n).length >= 1);
  }
  assert.match(campLines(2).join(' '), /70%/);
  assert.notDeepEqual(campLines(0), campLines(5));
});
