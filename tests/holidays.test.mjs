// The seasonal furniture's windows (js/data/holidays.js) and the Furniture store dealing them (js/secret-base.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { holidaysOn, HOLIDAYS } from '../js/data/holidays.js';

globalThis.location ??= { search: '', pathname: '/', hostname: 'localhost' };
const mem = new Map();
globalThis.localStorage ??= { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };

test('each holiday is on in its window and off outside it, New Year across the turn of the year', () => {
  assert.deepEqual(holidaysOn('2027-02-14'), ['valentine']);
  assert.deepEqual(holidaysOn('2027-02-15'), []);
  assert.deepEqual(holidaysOn('2026-12-31'), ['newyear']);
  assert.deepEqual(holidaysOn('2027-01-10'), ['newyear']);
  assert.deepEqual(holidaysOn('2026-12-25'), ['holidays']);
  assert.deepEqual(holidaysOn('2026-10-16'), []);
  for (const h of HOLIDAYS) assert.ok(h.name && h.from.length === 2 && h.to.length === 2);
});

test('a holiday\'s set is on the stands only in its window, a stand a floor while it is on', async () => {
  const { dealDay, PIECES } = await import('../js/secret-base.js');
  const ids = (day) => dealDay(day).flat();
  for (const day of ['2026-10-16', '2026-05-05']) assert.ok(ids(day).every(id => !PIECES[id].holiday), `${day} deals no holiday piece`);
  for (const [day, h] of [['2027-02-10', 'valentine'], ['2026-11-12', 'harvest'], ['2026-12-28', 'newyear']]) {
    const have = Object.values(PIECES).some(p => p.holiday === h);
    if (!have) continue;
    const [one, two] = dealDay(day);
    for (const floor of [one, two]) {
      assert.equal(floor.length, 8);
      assert.equal(floor.filter(id => PIECES[id].holiday === h).length, 1, `${day}: one ${h} stand a floor`);
      assert.ok(floor.every(id => !PIECES[id].holiday || PIECES[id].holiday === h));
    }
  }
});
