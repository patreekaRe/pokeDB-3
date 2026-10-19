// The Safari's real types (js/data/real-types.js): the chart's rules and every Safari Pokémon and move on it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { REAL_TYPES, realFactor, realMultiplier, speciesTypes, moveType, realBeats } from '../js/data/real-types.js';
import { CHART, SPECIES, MOVES, GEN } from '../js/data/real-types-table.js';
import { SAFARI_ROSTER } from '../js/data/safari.js';
import { ENEMY_DEFS } from '../js/data/enemies.js';
import { SUPER_EFFECTIVE, NOT_VERY_EFFECTIVE } from '../js/data/cards.js';
import { pixelIcon } from '../js/icons.js';

const TYPES = Object.keys(REAL_TYPES);

test('the chart has all 18 types (17 on Gen 5\'s), each with a name and a pixel icon', () => {
  assert.equal(TYPES.length, 18);
  assert.deepEqual(Object.keys(CHART).sort(), TYPES.filter(t => GEN > 5 || t !== 'fairy').sort());
  for (const t of TYPES) assert.ok(pixelIcon(REAL_TYPES[t].icon), `${t}'s icon is drawn`);
});

test('no immunities, a x2 cap and a x0.5 floor', () => {
  const chart = Object.keys(CHART);
  for (const a of chart) for (const d of chart) for (const d2 of [null, ...chart]) {
    const f = realFactor(a, d2 && d2 !== d ? [d, d2] : [d]);
    assert.ok(f >= 0.5 && f <= 2, `${a} on ${d}/${d2}: ${f}`);
  }
  assert.equal(realFactor('normal', ['ghost']), 0.5);
  assert.equal(realFactor('electric', ['ground']), 0.5);
  assert.equal(realFactor('water', ['ground', 'rock']), 2);   // x4 capped
  assert.equal(realFactor('grass', ['bug', 'flying']), 0.5);   // x0.25 floored
  assert.equal(realFactor('fire', ['water', 'ground']), 0.5);
  assert.equal(realFactor('grass', ['water', 'ground']), 2);
  assert.equal(realFactor('fire', ['grass', 'water']), 1);
});

test('the battle multiplier is the game\'s own steps, and Neutral cards stay outside the chart', () => {
  assert.equal(realMultiplier('fire', ['bug', 'steel']), SUPER_EFFECTIVE);   // x4, capped
  assert.equal(realMultiplier('water', ['water', 'dragon']), NOT_VERY_EFFECTIVE);
  assert.equal(realMultiplier('normal', ['ghost'], { card: true }), 1);
  assert.equal(realMultiplier('normal', ['rock'], { card: true }), 1);
  assert.equal(realMultiplier('normal', ['rock']), NOT_VERY_EFFECTIVE);   // a wild's Normal move is a real Normal move
});

test('every Safari Pokémon has its real types and every move it uses a real type', () => {
  const known = new Set(Object.values(SPECIES).flatMap(ids => ids.split(' ')));
  const moves = new Set(Object.values(MOVES).flatMap(names => names.split('|')));
  for (const id of SAFARI_ROSTER) {
    assert.ok(known.has(id), `${id} is in real-types-table.js (run tools/real-types.py)`);
    const def = ENEMY_DEFS[id];
    for (const t of speciesTypes(def)) assert.ok(REAL_TYPES[t], `${id}: ${t}`);
    for (const m of def.moves) assert.ok(moves.has(m.name), `${id}'s ${m.name} has a type (run tools/real-types.py)`);
  }
  assert.deepEqual(speciesTypes(ENEMY_DEFS.oddish), ['grass', 'poison']);
  assert.equal(moveType({ name: 'Bite' }, ENEMY_DEFS.growlithe), 'dark');
  assert.equal(moveType({ name: 'Thunder Wave' }, ENEMY_DEFS.mareep), 'electric');
});

test('a tough match-up is a wild whose real type hits yours super effectively', () => {
  assert.equal(realBeats(ENEMY_DEFS.mareep, 'water'), true);   // Electric
  assert.equal(realBeats(ENEMY_DEFS.oddish, 'water'), true);   // Grass / Poison
  assert.equal(realBeats(ENEMY_DEFS.oddish, 'fire'), false);
  assert.equal(realBeats(ENEMY_DEFS.pidgey, 'grass'), true);   // Normal / Flying
});
