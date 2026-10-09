// The Secret Base's earned pieces (js/data/furniture.js): owned once their source is, never saved apart.
import test from 'node:test';
import assert from 'node:assert/strict';
import { FURNITURE, FURNITURE_BY_ID, LAYERS, SWATCHES, sourceOf, earnedFurniture, howToEarn } from '../js/data/furniture.js';

const fresh = () => ({ unlocked: [], badges: [], feats: [], safariDex: { seen: [], caught: [], done: [], complete: false } });
const ids = (save) => earnedFurniture(save).map(p => p.id).sort();

test('every piece is well formed and its source exists', () => {
  assert.equal(Object.keys(FURNITURE_BY_ID).length, FURNITURE.length, 'ids are unique');
  for (const p of FURNITURE) {
    assert.ok(p.name, p.id);
    assert.ok(LAYERS.includes(p.layer), p.id);
    const surface = p.layer === 'wallpaper' || p.layer === 'flooring';
    assert.equal(!p.size, surface, `${p.id}: a surface has no size, a piece does`);
    if (p.size) assert.ok(p.size.every(n => Number.isInteger(n) && n >= 1 && n <= 3), p.id);
    for (const c of p.colours || []) assert.ok(SWATCHES[c], `${p.id}: ${c}`);
    assert.ok(sourceOf(p), `${p.id}: ${p.from.join(' ')}`);
  }
});

test('no two pieces come from the same source', () => {
  const keys = FURNITURE.map(p => p.from.join(':'));
  assert.equal(new Set(keys).size, keys.length);
});

test('a fresh save has nothing; an old one has what its lists prove', () => {
  assert.deepEqual(ids(fresh()), []);
  const save = { ...fresh(), badges: ['clearing', 'fire'], unlocked: ['torchic'], feats: ['eternatus'] };
  save.safariDex.done = ['wetland'];
  assert.deepEqual(ids(save), ['charmander-doll', 'eternatus-core', 'lily-pond', 'stump-table', 'torchic-doll']);
  delete save.badges;
  delete save.safariDex;
  assert.deepEqual(ids(save), ['eternatus-core', 'torchic-doll']);
});

test('how a piece is earned, secret ones hidden until they are', () => {
  const save = fresh();
  assert.match(howToEarn(FURNITURE_BY_ID['stump-table'], save), /Clearing Badge/);
  assert.match(howToEarn(FURNITURE_BY_ID['lily-pond'], save), /Wetland/);
  assert.equal(howToEarn(FURNITURE_BY_ID['eternatus-core'], save), '???');
  assert.equal(howToEarn(FURNITURE_BY_ID['crystal-wall'], save), '???');
  save.feats = ['eternatus'];
  assert.match(howToEarn(FURNITURE_BY_ID['eternatus-core'], save), /Eternatus/);
});
