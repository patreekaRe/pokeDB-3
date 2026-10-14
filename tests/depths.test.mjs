import test from 'node:test';
import assert from 'node:assert/strict';
import { gateTalk } from '../js/data/gate.js';
import { finalBiome, BIOMES } from '../js/data/enemies.js';
import { runMods, modsFor, DEPTHS_MODS, LEVELS } from '../js/data/difficulty.js';
import { STARTERS_BY_ID } from '../js/data/starters.js';

test('a deep run ends in the Crystal Depths, like Mewtwo\'s', () => {
  const depths = BIOMES.length - 1;
  assert.equal(BIOMES[depths].id, 'depths');
  assert.equal(finalBiome(STARTERS_BY_ID.charmander), depths - 1);
  assert.equal(finalBiome(STARTERS_BY_ID.charmander, true), depths);
  assert.equal(finalBiome(STARTERS_BY_ID.mewtwo), depths);
});

test('the Depths have numbers for every Trainer Level, on top of its own', () => {
  assert.equal(DEPTHS_MODS.length, LEVELS.length);
  const bulba = STARTERS_BY_ID.bulbasaur;
  for (let level = 0; level < LEVELS.length; level++) {
    assert.deepEqual(runMods(bulba, level, 2), modsFor(level), 'the first three biomes keep the Level\'s rules');
    const deep = runMods(bulba, level, 3);
    for (const [k, v] of Object.entries(DEPTHS_MODS[level])) assert.equal(deep[k], v, `L${level} ${k}`);
  }
  assert.equal(runMods(STARTERS_BY_ID.mewtwo, 5, 3).bossDmg, runMods(STARTERS_BY_ID.mewtwo, 0, 3).bossDmg, 'Mewtwo keeps its own');
});

test('Mewtwo at the gate follows the Waystones lit', () => {
  for (let lit = 0; lit <= 5; lit++) for (const first of [true, false]) {
    const lines = gateTalk(lit, first);
    assert.ok(lines.length >= 2, `${lit} lit, first ${first}`);
    for (const line of lines) assert.equal(typeof line, 'string');
    assert.ok(lines.every(l => !/[{}]/.test(l)), 'no unfilled names');
    assert.equal(lines.some(l => /open/.test(l)), true);
  }
  assert.ok(gateTalk(0, true).length > gateTalk(0, false).length, 'the first time tells the story');
  assert.match(gateTalk(5, false).join(' '), /way is open/);
  assert.match(gateTalk(2, false).join(' '), /Two of the five/);
  assert.match(gateTalk(1, false).join(' '), /One of the five Waystones burns/);
});
