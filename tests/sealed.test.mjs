import test from 'node:test';
import assert from 'node:assert/strict';
import { SEALED, sealedMult, runMods, MEWTWO_MODE } from '../js/data/difficulty.js';
import { shardsBack, newShards, campLines, strengthBack, pentagramLine, CAMP_LINES, MEET, campOpen } from '../js/data/sealed.js';
import { RING } from '../js/data/towns.js';
import { STARTERS_BY_ID } from '../js/data/starters.js';

const lit = (...ids) => ({ towns: Object.fromEntries(ids.map(id => [id, { quest: { step: 4, got: 0, picks: {}, lit: true } }])) });

test('Mewtwo starts the Depths at half strength, a tenth back a shard, full at five', () => {
  assert.equal(sealedMult(0), SEALED.weak);
  assert.equal(sealedMult(5), 1);
  assert.equal(sealedMult(9), 1);
  for (let n = 1; n < 5; n++) assert.ok(sealedMult(n) > sealedMult(n - 1));
  assert.equal(SEALED.shards, RING.length);
});

test('the weakness is only Mewtwo\'s, only in the Depths, and only with the shards counted', () => {
  const mewtwo = STARTERS_BY_ID.mewtwo, charmander = STARTERS_BY_ID.charmander;
  assert.equal(runMods(mewtwo, 0, SEALED.biome, null).playerDmg, 1);
  assert.equal(runMods(mewtwo, 0, SEALED.biome, null).sealed, undefined);
  assert.equal(runMods(mewtwo, 0, SEALED.biome, 0).playerDmg, SEALED.weak);
  assert.equal(runMods(mewtwo, 0, SEALED.biome, 2).sealed, 2);
  assert.equal(runMods(mewtwo, 0, SEALED.biome, 5).sealed, undefined);
  for (let b = 0; b < SEALED.biome; b++) assert.equal(runMods(mewtwo, 0, b, 0).playerDmg, MEWTWO_MODE.mods[b].playerDmg ?? 1);
  assert.equal(runMods(charmander, 0, 2, 0).playerDmg, 1);
  assert.equal(runMods(mewtwo, 0, SEALED.biome, 0).bossHp, MEWTWO_MODE.mods[SEALED.biome].bossHp);
});

test('a shard counts once its town\'s Waystone is mended, and is new until Mewtwo has seen it', () => {
  assert.deepEqual(shardsBack({}), []);
  const save = lit('ruins', 'shrine');
  assert.deepEqual(shardsBack(save), ['shrine', 'ruins']);
  assert.deepEqual(newShards(save), ['shrine', 'ruins']);
  assert.deepEqual(newShards({ ...save, pentagram: ['shrine'] }), ['ruins']);
  assert.deepEqual(shardsBack({ towns: { wastes: { done: 5 } } }), ['wastes']);   // an old save's friendship mended it
});

test('Mewtwo has something to say at every count, the first meeting first and a new shard thanked', () => {
  assert.equal(CAMP_LINES.length, SEALED.shards + 1);
  for (const lines of CAMP_LINES) assert.ok(lines.length >= 2);
  const first = campLines({}, { first: true });
  assert.deepEqual(first.slice(0, MEET.length), MEET);
  const save = lit('shrine');
  const back = campLines(save, { fresh: 1, short: true });
  assert.equal(back.length, 2);
  assert.match(back[0], new RegExp(`${strengthBack(1)}%`));
  assert.match(pentagramLine(0), /50%/);
  assert.match(pentagramLine(5), /full strength/);
});

test('the camp waits on the gate being broken', () => {
  assert.equal(campOpen(10), false);
});
