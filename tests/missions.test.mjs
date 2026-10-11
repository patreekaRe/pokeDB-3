import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DAILY, WEEKLY, PER_ROLL, MISSIONS_BY_ID, rollMissions, freshRoll, countInto, bonusReady, missionWeek } from '../js/data/missions.js';

const fresh = { maxLevel: 0, stats: { runsWon: 0 }, hallOfFame: [], dex: { done: [] } };
const veteran = { maxLevel: 5, stats: { runsWon: 9 }, hallOfFame: [{}], dex: { done: [] }, safariPass: true };

test('ids are unique and every mission has a goal and a prize', () => {
  assert.equal(Object.keys(MISSIONS_BY_ID).length, DAILY.length + WEEKLY.length);
  for (const m of [...DAILY, ...WEEKLY]) assert.ok(m.n > 0 && m.coins > 0 && m.on, m.id);
});

test('a roll is the same all day, three missions on three different events', () => {
  for (const day of ['2026-10-11', '2026-10-12', '2027-01-01']) {
    const a = rollMissions('daily', day, veteran);
    assert.deepEqual(a, rollMissions('daily', day, veteran));
    assert.equal(a.length, PER_ROLL);
    assert.equal(new Set(a.map(id => MISSIONS_BY_ID[id].on)).size, PER_ROLL);
  }
});

test('a new save is never set a mission in a mode it has not opened', () => {
  for (let i = 0; i < 60; i++) {
    const day = `2026-${String(1 + (i % 12)).padStart(2, '0')}-${String(1 + (i % 28)).padStart(2, '0')}`;
    for (const id of [...rollMissions('daily', day, fresh), ...rollMissions('weekly', missionWeek(new Date(day)), fresh)]) {
      assert.ok(!['d-catch', 'd-floors', 'd-floors2', 'd-safari', 'd-special', 'w-road', 'w-height', 'w-safaridays', 'w-catch', 'w-floors', 'w-catch', 'w-floors', 'w-level'].includes(id), id);
    }
  }
});

test('counting fills a mission once, filters by its context, and the bonus waits for every claim', () => {
  const roll = { key: 'x', list: [{ id: 'd-fights', got: 0, claimed: false }, { id: 'd-fire', got: 0, claimed: false }], bonus: false };
  assert.equal(countInto(roll, 'fight-type', 3, { type: 'water' }).length, 0);
  assert.equal(roll.list[1].got, 0);
  assert.equal(countInto(roll, 'fight-type', 5, { type: 'fire' }).length, 1);
  assert.equal(countInto(roll, 'fight-type', 5, { type: 'fire' }).length, 0);   // finished once only
  assert.equal(countInto(roll, 'fight', 20).length, 1);
  assert.equal(roll.list[0].got, MISSIONS_BY_ID['d-fights'].n);
  assert.equal(bonusReady(roll), false);
  roll.list.forEach(e => { e.claimed = true; });
  assert.equal(bonusReady(roll), true);
  assert.equal(freshRoll('weekly', '2026-10-05', veteran).list.length, PER_ROLL);
});

test('a distinct mission counts each different value once', () => {
  const roll = { key: 'x', list: [{ id: 'w-types', got: 0, claimed: false }], bonus: false };
  countInto(roll, 'win-type', 1, { type: 'fire' });
  countInto(roll, 'win-type', 1, { type: 'fire' });
  assert.equal(roll.list[0].got, 1);
  assert.equal(countInto(roll, 'win-type', 1, { type: 'water' }).length, 1);
  assert.equal(roll.list[0].got, 2);
});

test('every roll is one easy, one medium and one hard mission, for a new save and a veteran alike', () => {
  for (const save of [fresh, veteran]) {
    for (let i = 0; i < 200; i++) {
      const day = new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10);
      for (const kind of ['daily', 'weekly']) {
        const ms = rollMissions(kind, day, save).map(id => MISSIONS_BY_ID[id]);
        assert.deepEqual(ms.map(m => m.tier), [0, 1, 2], `${kind} ${day}`);
        assert.equal(new Set(ms.map(m => m.on)).size, 3);
        const groups = ms.map(m => m.group).filter(Boolean);
        if (save === veteran) assert.equal(new Set(groups).size, groups.length, `${kind} ${day} ${ms.map(m => m.id)}`);
      }
    }
  }
});

test('every event a mission counts is fed by the game', () => {
  const src = readFileSync(new URL('../js/run.js', import.meta.url), 'utf8') + readFileSync(new URL('../js/missions.js', import.meta.url), 'utf8');
  for (const m of [...DAILY, ...WEEKLY]) assert.ok(src.includes(`'${m.on}'`), `${m.id} counts '${m.on}', which nothing sends`);
});
