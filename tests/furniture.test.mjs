// The Secret Base's earned kinds (js/data/furniture.js): owned once their source is, never saved apart.
import test from 'node:test';
import assert from 'node:assert/strict';
import { FURNITURE, FURNITURE_BY_KIND, sourceOf, earnedFurniture, howToEarn } from '../js/data/furniture.js';

const fresh = () => ({ unlocked: [], badges: [], feats: [], safariDex: { seen: [], caught: [], done: [], complete: false } });
const kinds = (save) => earnedFurniture(save).map(p => p.kind).sort();

test('every kind is listed once and its source exists', () => {
  assert.equal(Object.keys(FURNITURE_BY_KIND).length, FURNITURE.length, 'kinds are unique');
  for (const p of FURNITURE) assert.ok(sourceOf(p), `${p.kind}: ${p.from.join(' ')}`);
});

test('no two kinds come from the same source', () => {
  const keys = FURNITURE.map(p => p.from.join(':'));
  assert.equal(new Set(keys).size, keys.length);
});

test('a fresh save has nothing; an old one has what its lists prove', () => {
  assert.deepEqual(kinds(fresh()), []);
  const save = { ...fresh(), badges: ['clearing', 'fire'], unlocked: ['torchic'], feats: ['eternatus'] };
  save.safariDex.done = ['wetland'];
  assert.deepEqual(kinds(save), ['charmanderdoll', 'goldcandle', 'koipond', 'plasmaglobe', 'stump', 'torchicdoll']);
  delete save.badges;
  delete save.safariDex;
  assert.deepEqual(kinds(save), ['goldcandle', 'plasmaglobe', 'torchicdoll']);
});

test('a Golden piece comes with each achievement, whichever it is', () => {
  const save = { ...fresh(), unlocked: ['lugia', 'squirtle'] };
  assert.ok(kinds(save).includes('goldcandle'));
  assert.ok(!kinds(save).includes('goldclock'), 'a starter bought or free is not an achievement');
  assert.match(howToEarn(FURNITURE_BY_KIND.goldclock, save), /2 achievements \(1\/2\)/);
  assert.match(howToEarn(FURNITURE_BY_KIND.goldthrone, save), /every achievement/);
});

test('a Game Corner prize is owned once swapped for, and says where to get it', () => {
  const save = { ...fresh(), corner: { prizes: ['slotmachine'] } };
  assert.ok(kinds(save).includes('slotmachine'));
  assert.ok(!kinds(save).includes('casinorug'));
  assert.match(howToEarn(FURNITURE_BY_KIND.casinorug, save), /prize counter/);
});

test('how a kind is earned, secret ones hidden until they are', () => {
  const save = fresh();
  assert.match(howToEarn(FURNITURE_BY_KIND.stump, save), /Clearing Badge/);
  assert.match(howToEarn(FURNITURE_BY_KIND.koipond, save), /Wetland/);
  assert.equal(howToEarn(FURNITURE_BY_KIND.plasmaglobe, save), '???');
  assert.equal(howToEarn(FURNITURE_BY_KIND.geode, save), '???');
  save.feats = ['eternatus'];
  assert.match(howToEarn(FURNITURE_BY_KIND.plasmaglobe, save), /Eternatus/);
});

test('a Gym Leader\'s poster comes with the third win against them', () => {
  const save = fresh();
  const poster = FURNITURE_BY_KIND.lawrenceposter;
  assert.ok(poster, 'every leader has a poster');
  save.gym = { lawrence: 2 };
  assert.ok(!kinds(save).includes('lawrenceposter'));
  assert.match(howToEarn(poster, save), /3 times \(2\/3\)/);
  save.gym.lawrence = 3;
  assert.ok(kinds(save).includes('lawrenceposter'));
  assert.ok(!kinds(save).includes('brittposter'));
});
