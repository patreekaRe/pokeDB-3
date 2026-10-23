// The Super Saiyan aura's rules (js/data/difficulty.js): the best Level won from 6 up, the Trainer Card's pick, and off.
import test from 'node:test';
import assert from 'node:assert/strict';
import { auraBest, aurasEarned, auraWorn } from '../js/data/difficulty.js';

const won = (...levels) => ({ hallOfFame: levels.map(level => ({ starter: 'charmander', level })) });

test('no aura until a win on Level 6 or higher', () => {
  assert.equal(auraBest(won(0, 3, 5)), 0);
  assert.deepEqual(aurasEarned(won(5)), []);
  assert.equal(auraWorn({ ...won(5), aura: 8 }), 0);
});

test('Mewtwo\'s runs and summits earn none', () => {
  assert.equal(auraBest({ hallOfFame: [{ starter: 'mewtwo', level: 10 }, { starter: 'bulbasaur', level: 9, summit: true }] }), 0);
});

test('the best Level won is worn, and every Level below it is earned', () => {
  const save = won(5, 6, 8, 7);
  assert.equal(auraBest(save), 8);
  assert.deepEqual(aurasEarned(save), [6, 7, 8]);
  assert.equal(auraWorn(save), 8);
});

test('the Aura key picks an earned one or none; a pick above the best falls back to it', () => {
  assert.equal(auraWorn({ ...won(9), aura: 7 }), 7);
  assert.equal(auraWorn({ ...won(9), aura: 0 }), 0);
  assert.equal(auraWorn({ ...won(7), aura: 10 }), 7);
});

test('a new win is read, not a stale answer', () => {
  const save = won(6);
  assert.equal(auraBest(save), 6);
  save.hallOfFame.push({ starter: 'squirtle', level: 10 });
  assert.equal(auraBest(save), 10);
});
