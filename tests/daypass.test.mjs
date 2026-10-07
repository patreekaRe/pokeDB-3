import test from 'node:test';
import assert from 'node:assert/strict';
import { SAFARI_BALLS, safariAccess, safariBallsLeft, ballsInBag } from '../js/data/balls.js';

test('the daily try is free, a replay needs the day\'s pass', () => {
  assert.equal(safariAccess({ day: null, tries: 0 }, '2026-10-07'), 'first');
  assert.equal(safariAccess({ day: '2026-10-06', tries: 3, pass: '2026-10-06' }, '2026-10-07'), 'first');
  assert.equal(safariAccess({ day: '2026-10-07', tries: 1 }, '2026-10-07'), 'locked');
  assert.equal(safariAccess({ day: '2026-10-07', tries: 1, pass: '2026-10-06' }, '2026-10-07'), 'locked');
  assert.equal(safariAccess({ day: '2026-10-07', tries: 2, pass: '2026-10-07' }, '2026-10-07'), 'pass');
});

test('Safari Balls are counted per run', () => {
  assert.equal(safariBallsLeft({}), SAFARI_BALLS);
  assert.equal(safariBallsLeft({ balls: 4 }), 4);
  const balls = { great: 2, owned: [], masterWeek: null };
  assert.deepEqual(ballsInBag(balls, 'W', 4).map(b => [b.ball.id, b.left]), [['safari', 4], ['great', 2]]);
  assert.deepEqual(ballsInBag(balls, 'W', 0).map(b => b.ball.id), ['great']);
});
