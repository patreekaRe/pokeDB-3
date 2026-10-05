import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { towerWeek, weekOffset, towerWeekly, landingTypes, guardianOf, towerMods, towerPools, towerBiome, floorOf, towerOpen,
  LANDINGS, FLIGHT, RAYQUAZA, PAST_TOP, TOP_FLOOR, TOP_FLIGHT } from '../js/data/tower.js';
import { towerResult, checkTowerEntry, rankTower, TOWER_LIMITS, TOWER_KEYS, boardValue } from '../js/data/leaderboard.js';
import { BADGES_BY_ID, newBadges } from '../js/data/badges.js';
import { ENEMY_DEFS, BIOMES } from '../js/data/enemies.js';
import { useStream } from '../js/rng.js';

test('a week starts on Monday (UTC) and moves by 7 days', () => {
  assert.equal(towerWeek(new Date('2026-10-05T00:00:00Z')), '2026-10-05');   // a Monday
  assert.equal(towerWeek(new Date('2026-10-11T23:59:59Z')), '2026-10-05');   // its Sunday
  assert.equal(towerWeek(new Date('2026-10-12T00:00:00Z')), '2026-10-12');
  assert.equal(weekOffset('2026-10-05', -1), '2026-09-28');
});

test('the week deals the same tower and starter on every device, never Mewtwo or Rayquaza', () => {
  const a = towerWeekly('2026-10-05'), b = towerWeekly('2026-10-05');
  assert.equal(a.seed, b.seed);
  assert.equal(a.starter.id, b.starter.id);
  for (let i = 0; i < 60; i++) {
    const { starter } = towerWeekly(weekOffset('2026-10-05', i));
    assert.ok(!starter.secret && !starter.safariPrize, starter.id);
  }
});

const deal = (seed, flight) => { useStream(seed, `biome:t${flight}`); const rows = landingTypes(flight); useStream(null); return rows; };

test('a seeded flight always deals the same doors', () => {
  assert.deepEqual(deal(123, 0), deal(123, 0));
  assert.notDeepEqual(deal(123, 0), deal(124, 0));
});

test('landings keep their rules', () => {
  for (let seed = 1; seed <= 200; seed++) {
    for (const flight of [0, 1, 4]) {
      const rows = deal(seed, flight);
      assert.equal(rows.length, LANDINGS);
      rows.forEach((row, i) => {
        const floor = floorOf(flight, i);
        assert.ok(row.length === 2 || row.length === 3, `${row}`);
        assert.ok(row.includes('fight'), `floor ${floor} has a fight`);
        if (floor <= 2) assert.ok(!row.includes('elite'), `no Alpha on floor ${floor}`);
        if (floor === 1) assert.ok(!row.includes('rest'));
        for (const t of ['shop', 'rest', 'event', 'elite']) assert.ok(row.filter(x => x === t).length <= 1, `${t} twice on ${floor}`);
      });
      assert.ok(rows.at(-1).includes('rest'), 'a Center before the guardian');
      assert.ok(rows.some(row => row.includes('shop')), 'a Mart every flight');
    }
  }
});

test('guardians: a boss of the flight\'s biome, Rayquaza only on the top floor', () => {
  useStream(9, 'g');
  assert.ok(BIOMES[0].bosses.includes(guardianOf(0)));
  assert.ok(BIOMES[1].bosses.includes(guardianOf(1)));
  assert.notEqual(guardianOf(4), RAYQUAZA);   // floor 50
  assert.equal(guardianOf(9), RAYQUAZA);   // floor 100
  useStream(null);
  assert.ok(ENEMY_DEFS[RAYQUAZA]?.boss);
  assert.equal(floorOf(4, LANDINGS), 50);
  assert.equal(floorOf(TOP_FLIGHT, LANDINGS), TOP_FLOOR);
  useStream(9, 'g');
  assert.equal(Array.from({ length: TOP_FLIGHT + 1 }, (_, f) => guardianOf(f)).filter(g => g === RAYQUAZA).length, 1);
  useStream(null);
});

test('floors 1-30 are the biomes in order; past 30 every flight grows', () => {
  const charmander = { id: 'charmander' };
  assert.deepEqual([0, 1, 2, 3, 7].map(towerBiome), [0, 1, 2, 2, 2]);
  const m2 = towerMods(charmander, 2), m3 = towerMods(charmander, 3), m5 = towerMods(charmander, 5);
  assert.equal(m3.normalHp, m2.normalHp * PAST_TOP.hp);
  assert.equal(m5.enemyDmg, m2.enemyDmg + 3 * PAST_TOP.dmg);
  assert.equal(m2.enemyDmgMult, 1);
  assert.equal(m5.enemyDmgMult, PAST_TOP.dmgMult ** 3);
  assert.equal(towerPools(1).normals, null);
  assert.ok(towerPools(3).normals.length >= 36);
  assert.equal(FLIGHT, 10);
});

test('the Sky Pillar opens with a won run', () => {
  assert.equal(towerOpen({ stats: { runsWon: 0 }, hallOfFame: [] }), false);
  assert.equal(towerOpen({ stats: { runsWon: 1 }, hallOfFame: [] }), true);
});

test('the Tower Badges follow your highest floor', () => {
  const save = { stats: { bossesDefeated: {}, winsBy: {}, maxLevelWinByType: {} }, unlocked: [], badges: [], hallOfFame: [], dex: { done: [] }, safariDex: { done: [] }, tower: { bestEver: 52 } };
  const got = newBadges(save).map(b => b.id);
  assert.ok(got.includes('tower-25') && got.includes('tower-50') && !got.includes('tower-100'));
  assert.ok(!BADGES_BY_ID['tower-100'].locked);
});

test('a climb\'s entry passes the board\'s checks, and the board ranks by floor', () => {
  const result = towerResult({ week: '2026-10-05', starter: 'charmander', floor: 23, turns: 140, startedAt: new Date(Date.now() - 600000).toISOString() });
  const entry = { ...result, uid: 'u1', name: 'Pat' };
  assert.equal(checkTowerEntry(entry, '2026-10-05'), null);
  assert.equal(checkTowerEntry(entry, '2026-10-12'), null);    // posted the Monday after
  assert.match(checkTowerEntry(entry, '2026-10-19'), /week/);
  assert.match(checkTowerEntry({ ...entry, floor: 1000 }, '2026-10-05'), /floor/);
  const [board] = rankTower([{ ...entry, floor: 10 }, { ...entry, uid: 'u2', floor: 30 }, { ...entry, uid: 'u3', floor: 30, turns: 99 }], 'u1');
  assert.deepEqual(board.rows.map(r => r.entry.uid), ['u3', 'u2', 'u1']);
  assert.equal(boardValue('floor', { floor: 30 }), 'F30');
});

test('firestore.rules keeps the tower board\'s bounds', () => {
  const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
  for (const [key, [lo, hi]] of Object.entries(TOWER_LIMITS)) assert.ok(rules.includes(`inRange(d.${key}, ${lo}, ${hi})`), key);
  for (const key of TOWER_KEYS) assert.ok(rules.includes(`'${key}'`), key);
  assert.match(rules, /match \/towerBoard\/\{id\}/);
});
