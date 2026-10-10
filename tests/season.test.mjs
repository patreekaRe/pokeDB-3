import { test } from 'node:test';
import assert from 'node:assert/strict';
import { season } from '../js/season.js';

test('October is Halloween, December winter, the rest of the year plain', () => {
  assert.equal(season(new Date(2026, 9, 1)), 'halloween');
  assert.equal(season(new Date(2026, 9, 31, 23, 59)), 'halloween');
  assert.equal(season(new Date(2026, 10, 1)), null);
  assert.equal(season(new Date(2026, 11, 25)), 'winter');
  assert.equal(season(new Date(2027, 0, 1)), null);
  assert.equal(season(new Date(2026, 6, 4)), null);
});
