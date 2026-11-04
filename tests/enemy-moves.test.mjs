import test from 'node:test';
import assert from 'node:assert/strict';
import { ENEMY_DEFS, eliteOf, enemyMove, firstMove, moveOn, moveAfter, hitCount } from '../js/data/enemies.js';

const fresh = (def) => ({ hp: 100, maxHp: 100, moveIndex: firstMove(def), recent: [], halfUsed: false });

test('a random order never uses one move three turns running', () => {
  const def = { order: 'random', moves: [{ kind: 'attack', name: 'A', amount: 1, weight: 50 }, { kind: 'defend', name: 'B', amount: 1 }] };
  for (let run = 0; run < 50; run++) {
    const en = fresh(def), used = [];
    for (let t = 0; t < 40; t++) { const m = enemyMove(def, en); used.push(m.name); moveOn(def, en, m); }
    for (let t = 2; t < used.length; t++) assert.ok(!(used[t] === used[t - 1] && used[t] === used[t - 2]), used.join(''));
  }
});

test('a charge in a random order is still followed by its hit', () => {
  const def = { order: 'random', moves: [{ kind: 'charge', name: 'C' }, { kind: 'attack', name: 'Hit', amount: 9, weight: 0 }, { kind: 'attack', name: 'A', amount: 1 }] };
  for (let run = 0; run < 50; run++) {
    const en = fresh(def);
    for (let t = 0; t < 20; t++) {
      const m = enemyMove(def, en);
      if (m.name === 'C') assert.equal(moveAfter(def, en).name, 'Hit');
      moveOn(def, en, m);
      if (m.name === 'C') assert.equal(enemyMove(def, en).name, 'Hit');
    }
  }
});

test('the half-HP move comes once, then the loop picks up where it was', () => {
  const def = { opens: 1, atHalf: { kind: 'buff', name: 'Rage', amount: 3 }, moves: [{ kind: 'attack', name: 'A', amount: 1 }, { kind: 'attack', name: 'B', amount: 1 }] };
  const en = fresh(def);
  assert.equal(enemyMove(def, en).name, 'B');
  moveOn(def, en, enemyMove(def, en));
  en.hp = 50;
  assert.equal(enemyMove(def, en).name, 'Rage');
  assert.equal(moveAfter(def, en).name, 'A');
  moveOn(def, en, enemyMove(def, en));
  assert.equal(enemyMove(def, en).name, 'A');
  en.hp = 10;
  moveOn(def, en, enemyMove(def, en));
  assert.equal(enemyMove(def, en).name, 'B');
});

test('every enemy move is well formed', () => {
  const defs = Object.entries(ENEMY_DEFS).flatMap(([id, d]) => [[id, d], ...(d.phase2 ? [[`${id}2`, d.phase2]] : [])]);
  for (const [id, def] of defs) {
    for (const m of [...def.moves, ...(def.atHalf ? [def.atHalf] : [])]) {
      if (m.hits != null) assert.ok(Number.isInteger(m.hits) && m.hits >= 2 && ['attack', 'drain'].includes(m.kind), `${id} ${m.name}`);
    }
    if (def.atHalf) assert.ok(!['charge', 'away'].includes(def.atHalf.kind), id);
    if (def.opens != null) assert.ok(def.moves[def.opens], id);
    if (def.order === 'random') assert.ok(def.moves.some(m => (m.weight ?? 1) > 0), id);
  }
  assert.equal(hitCount(eliteOf(ENEMY_DEFS.sentret).atHalf), 3);
});
