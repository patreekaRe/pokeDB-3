// Run with `node --test` from the repo root (Node 20+). The Safari Zone's daily run must be the same for everyone on a UTC date, so
// these pin down the seeded rolls: the generator, the day's areas and starter, and a whole biome's map and enemies.
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeRng, hashString, streamOf, random, useStream, shuffled } from '../js/rng.js';
import { SAFARI_AREAS, SAFARI_DAY_AREAS, safariDay, safariSeed, safariDaily } from '../js/data/safari.js';
import { ENEMY_DEFS, dealEnemies } from '../js/data/enemies.js';
import { STARTERS } from '../js/data/starters.js';
import { generateMap } from '../js/map.js';

const roll = (rand, n = 20) => Array.from({ length: n }, rand);

test('a seed always rolls the same numbers, in [0, 1)', () => {
  const a = roll(makeRng(12345)), b = roll(makeRng(12345));
  assert.deepEqual(a, b);
  assert.ok(a.every(x => x >= 0 && x < 1));
  assert.notDeepEqual(a, roll(makeRng(12346)));
});

test('the generator is pinned: a change to it would change every saved day', () => {
  assert.equal(makeRng(1)(), 0.6270739405881613);   // mulberry32's well-known first roll
  assert.equal(safariSeed('2026-10-02'), hashString('safari:2026-10-02'));
  const day = safariDaily('2026-10-02');
  assert.deepEqual(day.areas.map(a => a.id), ['meadow', 'marsh', 'peak']);
  assert.equal(day.starter.id, 'hooh');
});

test('random() follows the stream it is given, and Math.random without one', () => {
  useStream(99, 'room:0:n3');
  const a = roll(random);
  useStream(99, 'room:0:n3');
  assert.deepEqual(roll(random), a);
  assert.deepEqual(roll(streamOf(99, 'room:0:n3')), a);
  useStream(99, 'room:0:n4');
  assert.notDeepEqual(roll(random), a);
  useStream(null);
  const real = Math.random;
  Math.random = () => 0.25;
  try { assert.equal(random(), 0.25); } finally { Math.random = real; }
});

test('shuffled is a deterministic permutation', () => {
  const list = Array.from({ length: 30 }, (_, i) => i);
  const a = shuffled(list, makeRng(7)), b = shuffled(list, makeRng(7));
  assert.deepEqual(a, b);
  assert.deepEqual([...a].sort((x, y) => x - y), list);
  assert.notDeepEqual(a, list);
});

test('the day is the UTC date', () => {
  assert.equal(safariDay(new Date('2026-10-02T00:00:00Z')), '2026-10-02');
  assert.equal(safariDay(new Date('2026-10-02T23:59:59Z')), '2026-10-02');
  assert.equal(safariDay(new Date('2026-10-03T00:00:00Z')), '2026-10-03');
  assert.equal(safariDay(new Date('2026-10-02T23:30:00-05:00')), '2026-10-03');   // late evening in New York is tomorrow
});

test('a day always deals the same areas and starter', () => {
  const a = safariDaily('2026-10-02'), b = safariDaily('2026-10-02');
  assert.equal(a.seed, b.seed);
  assert.deepEqual(a.areas.map(x => x.id), b.areas.map(x => x.id));
  assert.equal(a.starter.id, b.starter.id);
});

test('each day has 3 different areas and any starter but Mewtwo', () => {
  const starters = new Set(), areaSets = new Set();
  for (let d = 0; d < 120; d++) {
    const day = safariDay(new Date(Date.UTC(2026, 9, 1 + d)));
    const { areas, starter } = safariDaily(day);
    assert.equal(areas.length, SAFARI_DAY_AREAS);
    assert.equal(new Set(areas.map(a => a.id)).size, SAFARI_DAY_AREAS);
    assert.notEqual(starter.id, 'mewtwo');
    starters.add(starter.id);
    areaSets.add(areas.map(a => a.id).join());
  }
  assert.ok(starters.size > 10, `only ${starters.size} starters in 120 days`);
  assert.ok(areaSets.size > 30, `only ${areaSets.size} area orders in 120 days`);
  assert.ok(STARTERS.some(s => s.id === 'mewtwo'));
});

test('every Safari area roster is real Pokémon from the game', () => {
  for (const area of SAFARI_AREAS) {
    assert.ok(area.normals.length >= 6, area.id);
    for (const id of area.normals) assert.ok(ENEMY_DEFS[id], `${area.id}: ${id}`);
  }
});

test('a seeded biome builds the same map and enemies every time', () => {
  const build = () => {
    useStream(safariSeed('2026-10-02'), 'biome:0');
    const map = generateMap();
    const nodes = Object.values(map.byId).sort((a, b) => a.floor - b.floor || (a.col ?? 0) - (b.col ?? 0));
    for (const kind of ['fight', 'elite', 'boss']) {
      dealEnemies(0, kind, nodes.filter(n => n.type === kind), map.byId, undefined, SAFARI_AREAS[2].normals);
    }
    useStream(null);
    return nodes.map(n => ({ id: n.id, type: n.type, enemyId: n.enemyId, next: n.next }));
  };
  const a = build();
  assert.deepEqual(build(), a);
  const wild = a.filter(n => n.type === 'fight').map(n => n.enemyId);
  assert.ok(wild.length && wild.every(id => SAFARI_AREAS[2].normals.includes(id)));
});
