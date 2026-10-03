// The Safari leaderboard's pure part (js/data/leaderboard.js): what a run posts, what the rules would take, the boards.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runResult, buildEntry, checkEntry, rankBoards, cleanName, dayOffset, formatTime, entryId, ENTRY_KEYS, LIMITS, NAME_MAX } from '../js/data/leaderboard.js';

const DAY = '2026-10-02';
const result = (over = {}) => runResult({ day: DAY, starter: 'charmander', won: true, biome: 2, turns: 80,
  startedAt: '2026-10-02T10:00:00.000Z', endedAt: Date.parse('2026-10-02T10:25:30.000Z'), caught: 3, ...over });

test('a run becomes an entry the rules take', () => {
  const r = result();
  assert.deepEqual(r, { day: DAY, starter: 'charmander', won: true, area: 3, bosses: 3, turns: 80, time: 1530, caught: 3 });
  const e = buildEntry(r, 'uid1', '  Ash  ');
  assert.equal(e.name, 'Ash');
  assert.equal(checkEntry(e, DAY), null);
  assert.ok(Object.keys(e).every(k => ENTRY_KEYS.includes(k)));
  assert.equal(entryId(DAY, 'uid1'), '2026-10-02_uid1');
});

test('a loss counts the bosses beaten and the area reached', () => {
  const r = result({ won: false, biome: 1 });
  assert.equal(r.bosses, 1);
  assert.equal(r.area, 2);
  assert.equal(checkEntry(buildEntry(r, 'u', 'Misty'), DAY), null);
});

test('out-of-range numbers are clamped, missing ones are 0', () => {
  const r = result({ turns: 99999, caught: -4, startedAt: null });
  assert.equal(r.turns, LIMITS.turns[1]);
  assert.equal(r.caught, 0);
  assert.equal(r.time, 0);
});

test('the rules\' checks refuse bad entries', () => {
  const ok = buildEntry(result(), 'u', 'Brock');
  assert.equal(checkEntry(ok, dayOffset(DAY, 1)), null);
  assert.equal(checkEntry(ok, dayOffset(DAY, -1)), null);
  assert.match(checkEntry(ok, dayOffset(DAY, 2)), /day/);
  assert.match(checkEntry({ ...ok, extra: 1 }, DAY), /unknown/);
  assert.match(checkEntry({ ...ok, name: '' }, DAY), /name/);
  assert.match(checkEntry({ ...ok, turns: 2.5 }, DAY), /turns/);
  assert.match(checkEntry({ ...ok, caught: 301 }, DAY), /caught/);
  assert.match(checkEntry({ ...ok, bosses: 2 }, DAY), /won/);
  assert.match(checkEntry({ ...ok, won: 'yes' }, DAY), /won/);
});

test('names are trimmed, flattened and cut', () => {
  assert.equal(cleanName('  Red\n\tBlue  '), 'Red Blue');
  assert.equal(cleanName('<b>x</b>'), 'bx/b');
  assert.equal([...cleanName('x'.repeat(40))].length, NAME_MAX);
  assert.equal(cleanName(null), '');
  assert.equal(cleanName('   '), '');
});

test('day offsets cross months and years', () => {
  assert.equal(dayOffset('2026-01-01', -1), '2025-12-31');
  assert.equal(dayOffset('2026-02-28', 1), '2026-03-01');
});

test('the three boards rank and keep your own row', () => {
  const mk = (uid, o) => ({ ...buildEntry(result(o), uid, uid), at: o.at ?? 0 });
  const entries = [
    mk('a', { endedAt: Date.parse('2026-10-02T10:30:00Z'), turns: 70, caught: 0 }),
    mk('b', { endedAt: Date.parse('2026-10-02T10:20:00Z'), turns: 90, caught: 5 }),
    mk('c', { won: false, biome: 1, caught: 9 }),
    mk('d', { endedAt: Date.parse('2026-10-02T10:20:00Z'), turns: 85, caught: 1, at: 5 }),
  ];
  const [fastest, turns, caught] = rankBoards(entries, 'c', 2);
  assert.deepEqual(fastest.rows.map(r => r.entry.uid), ['d', 'b']);   // same time: fewer turns first
  assert.deepEqual(turns.rows.map(r => r.entry.uid), ['a', 'd']);
  assert.equal(turns.total, 3);                                        // the loss isn't on the win boards
  assert.deepEqual(caught.rows.map(r => r.entry.uid), ['c', 'b']);
  assert.ok(caught.rows[0].mine);
  const caughtA = rankBoards(entries, 'a', 2)[2];
  assert.equal(caughtA.me, null);                                       // caught nothing: not on that board
  const fastA = rankBoards(entries, 'a', 2)[0];
  assert.equal(fastA.me.rank, 3);
  assert.ok(fastA.me.mine);
});

test('times read as m:ss or h:mm:ss', () => {
  assert.equal(formatTime(65), '1:05');
  assert.equal(formatTime(3725), '1:02:05');
});

test('firestore.rules keeps the same bounds', () => {
  const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
  for (const [key, [lo, hi]] of Object.entries(LIMITS)) assert.ok(rules.includes(`inRange(d.${key}, ${lo}, ${hi})`), key);
  assert.ok(rules.includes(`d.name.size() <= ${NAME_MAX}`));
  for (const key of ENTRY_KEYS) assert.ok(rules.includes(`'${key}'`), key);
  assert.match(rules, /allow update, delete: if false/);
});

test('shareLine: a short line to copy, a loss with its floor and area, a replay marked', async () => {
  const { shareLine } = await import('../js/data/leaderboard.js');
  assert.equal(shareLine({ day: DAY, won: false, caught: 4, floor: 11, floors: 33, area: 'Wetland' }), `Safari ${DAY}: 4 caught, floor 11/33 (Wetland)`);
  assert.equal(shareLine({ day: DAY, won: true, caught: 7, floors: 33 }), `Safari ${DAY}: 7 caught, crossed all 33 floors!`);
  assert.match(shareLine({ day: DAY, won: true, floors: 33, first: false }), /0 caught.*\(replay\)$/);
});
