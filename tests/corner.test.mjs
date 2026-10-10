import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  VOLTORB_BOARDS, VOLTORB_CAP, dealBoard, voltorbBoard, clues, score, cleared, payout, paysToday, nextLevel, bestScore,
  gachaSet, gachaPull, GACHA_SET, pickDeal, dealPrice, capPay, GAMES_CAP,
  quizRound, quizPay, QUIZ_LEN, memoryBoard, memoryPay, MEMORY_PAIRS,
} from '../js/data/corner.js';
import { makeRng } from '../js/rng.js';

test('every Voltorb Flip board fits 25 tiles', () => {
  for (const level of VOLTORB_BOARDS) for (const [t, h, b] of level) assert.ok(t + h + b <= 25);
});

test('a dealt board holds its set', () => {
  for (let level = 1; level <= 8; level++) for (let s = 0; s < 20; s++) {
    const board = dealBoard(level, makeRng(s * 31 + level));
    assert.equal(board.length, 25);
    const n = (v) => board.filter(x => x === v).length;
    assert.ok(VOLTORB_BOARDS[level - 1].some(([t, h, b]) => n(2) === t && n(3) === h && n(0) === b));
  }
});

test('the same day, round and level deal the same board', () => {
  assert.deepEqual(voltorbBoard('2026-10-10', 3, 4), voltorbBoard('2026-10-10', 3, 4));
  assert.notDeepEqual(voltorbBoard('2026-10-10', 3, 4), voltorbBoard('2026-10-10', 4, 4));
});

test('clues add up', () => {
  const board = voltorbBoard('2026-10-10', 0, 5), c = clues(board);
  const total = board.reduce((n, v) => n + v, 0), bombs = board.filter(v => v === 0).length;
  assert.equal(c.rows.reduce((n, r) => n + r.sum, 0), total);
  assert.equal(c.cols.reduce((n, r) => n + r.sum, 0), total);
  assert.equal(c.cols.reduce((n, r) => n + r.bombs, 0), bombs);
});

test('score, clearing and the payout', () => {
  const board = [2, 3, 1, 0, ...Array(21).fill(1)];
  assert.equal(score(board, []), 0);
  assert.equal(score(board, [0, 1, 2]), 6);
  assert.equal(cleared(board, [0]), false);
  assert.equal(cleared(board, [0, 1]), true);
  assert.ok(payout(bestScore(1)) >= 4 && payout(bestScore(1)) <= 8);
  assert.ok(payout(bestScore(8)) <= 60);
  assert.equal(paysToday(10000, VOLTORB_CAP - 5), 5);
  assert.equal(paysToday(10000, VOLTORB_CAP), 0);
});

test('levels go up on a win and drop to the flips on a Voltorb', () => {
  assert.equal(nextLevel(3, { won: true }), 4);
  assert.equal(nextLevel(8, { won: true }), 8);
  assert.equal(nextLevel(5, { won: false, flips: 2 }), 2);
  assert.equal(nextLevel(2, { won: false, flips: 6 }), 2);
  assert.equal(nextLevel(4, { won: false, flips: 0 }), 1);
});

test('the Gachapon deals a week set and pulls from it alike for everyone', () => {
  const pool = Array.from({ length: 60 }, (_, i) => `big${i}doll`);
  const set = gachaSet('2026-10-05', pool);
  assert.equal(set.length, GACHA_SET);
  assert.equal(new Set(set).size, GACHA_SET);
  assert.deepEqual(set, gachaSet('2026-10-05', [...pool].reverse()));
  assert.notDeepEqual(set, gachaSet('2026-10-12', pool));
  for (let n = 0; n < 50; n++) assert.ok(set.includes(gachaPull('2026-10-05', n, set)));
  assert.equal(gachaPull('2026-10-05', 7, set), gachaPull('2026-10-05', 7, set));
});

test('the Deal of the Day is one of the keys, stable for the day', () => {
  const keys = ['perks:hpBoost', 'skins:tepig', 'shiny:charmander'];
  assert.ok(keys.includes(pickDeal('2026-10-10', keys)));
  assert.equal(pickDeal('2026-10-10', keys), pickDeal('2026-10-10', [...keys].reverse()));
  assert.equal(pickDeal('2026-10-10', []), null);
  assert.equal(dealPrice(250), 175);
});

test('the games share one daily cap', () => {
  assert.equal(capPay(40, 0), 40);
  assert.equal(capPay(40, GAMES_CAP - 10), 10);
  assert.equal(capPay(40, GAMES_CAP), 0);
});

test('a quiz round has distinct questions, each with its answer among distinct options', () => {
  const pool = Array.from({ length: 40 }, (_, i) => `mon${i}`);
  const round = quizRound('2026-10-10', 0, pool);
  assert.equal(round.length, QUIZ_LEN);
  assert.equal(new Set(round.map(q => q.answer)).size, QUIZ_LEN);
  for (const q of round) { assert.ok(q.options.includes(q.answer)); assert.equal(new Set(q.options).size, 4); }
  assert.deepEqual(round, quizRound('2026-10-10', 0, [...pool].reverse()));
  assert.equal(quizPay(QUIZ_LEN), 40);
  assert.equal(quizPay(4), 12);
});

test('a memory board holds each Pokémon twice', () => {
  const pool = Array.from({ length: 40 }, (_, i) => `mon${i}`);
  const board = memoryBoard('2026-10-10', 2, pool);
  assert.equal(board.length, MEMORY_PAIRS * 2);
  for (const id of new Set(board)) assert.equal(board.filter(x => x === id).length, 2);
  assert.deepEqual(board, memoryBoard('2026-10-10', 2, pool));
  assert.equal(memoryPay(0), 30);
  assert.equal(memoryPay(20), 4);
});
