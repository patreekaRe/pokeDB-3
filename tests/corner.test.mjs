import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  VOLTORB_BOARDS, dealBoard, voltorbBoard, clues, score, cleared, payout, nextLevel, bestScore,
  capPay, DAILY_CAP, GAME_CAP, PLAYS, STAKE, quizRound, quizPay, QUIZ_LEN, SIZE,
  PRIZES, PRIZES_BY_KIND, RETIRED_PRIZES, better,
} from '../js/data/corner.js';
import {
  STRIP, slotPay, stopAt, BONUS_SPINS, JACKPOT, PLINKO_ODDS, PLINKO_PAYS, shuffledDeck, handValue, isBlackjack,
  dealerPlays, blackjackReturn, hlMult, SCRATCH_PRIZES,
} from '../js/data/casino.js';
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
  assert.ok(payout(bestScore(1)) >= 12 && payout(bestScore(1)) <= 24);
  assert.ok(payout(bestScore(8)) <= 180);
});

test('levels go up on a win and drop to the flips on a Voltorb', () => {
  assert.equal(nextLevel(3, { won: true }), 4);
  assert.equal(nextLevel(8, { won: true }), 8);
  assert.equal(nextLevel(5, { won: false, flips: 2 }), 2);
  assert.equal(nextLevel(2, { won: false, flips: 6 }), 2);
  assert.equal(nextLevel(4, { won: false, flips: 0 }), 1);
});

test('the games share one daily cap, and each has its own', () => {
  assert.equal(capPay(40, 0), 40);
  assert.equal(capPay(40, DAILY_CAP - 10), 10);
  assert.equal(capPay(40, DAILY_CAP), 0);
  assert.equal(capPay(40, 100, GAME_CAP - 15), 15);
  assert.equal(capPay(40, 100, GAME_CAP), 0);
});

/* What an average day pays, game by game: the table games played plainly (random reel stops, Blackjack by the book,
   High-Low cashed out after one guess), Voltorb Flip by a careful player (only tiles a clue proves safe, then quit), 5
   of 7 in the quiz and the scratch card's mean. The user's first pick (2026-10-12) was about 250 a day; they raised the paying plays the same day
   (10 slots, 10 Plinko, 5 each of Blackjack, High-Low and Voltorb Flip, 7 quiz questions), so it's about 380 now,
   still under the cap. */
function averageDay() {
  const N = 20000, rng = makeRng(77);
  let slots = 0;
  for (let i = 0; i < N; i++) {
    let spins = 1, mult = 1;
    while (spins-- > 0) {
      const got = [0, 1, 2].map(() => STRIP[stopAt(Math.floor(rng() * STRIP.length), rng)]), m = slotPay(got);
      slots += m === 'jackpot' ? JACKPOT : STAKE * m * mult;
      if (got.every(s => s === 'pikachu')) { spins += BONUS_SPINS; mult = 2; }
    }
  }
  slots = Math.min(GAME_CAP, PLAYS.slots * slots / N);
  const plinko = PLAYS.plinko * STAKE * PLINKO_ODDS.reduce((s, c, i) => s + c * PLINKO_PAYS[i], 0) / 1000;
  let bj = 0;
  for (let i = 0; i < N; i++) {
    const deck = shuffledDeck(makeRng(i * 7919 + 3)), p = [deck.shift(), deck.shift()], d = [deck.shift(), deck.shift()];
    if (!isBlackjack(p) && !isBlackjack(d)) {
      const up = handValue([d[0]]).total;
      while (handValue(p).total < (up >= 7 ? 17 : 12) || (handValue(p).soft && handValue(p).total < 18)) p.push(deck.shift());
    }
    bj += STAKE * blackjackReturn(p, handValue(p).total > 21 ? d : dealerPlays(d, deck));
  }
  bj = PLAYS.bj * bj / N;
  let hl = 0;
  for (let r = 1; r <= 13; r++) { const g = r <= 7 ? 'hi' : 'lo', m = hlMult(r, g); hl += Math.floor(STAKE * m) * (g === 'hi' ? 13 - r : r - 1) / 13 / 13; }
  hl *= PLAYS.hl;
  let voltorb = 0;
  for (let i = 0; i < 2000; i++) {
    const board = dealBoard(1 + (i % 2), makeRng(i + 1)), c = clues(board), flipped = [];
    for (let k = 0; k < SIZE * SIZE; k++) if (c.rows[Math.floor(k / SIZE)].bombs === 0 || c.cols[k % SIZE].bombs === 0) flipped.push(k);
    voltorb += payout(score(board, flipped));
  }
  voltorb = PLAYS.voltorb * voltorb / 2000;
  const quiz = quizPay(5);
  const scratch = SCRATCH_PRIZES.reduce((s, [c, w]) => s + c * w, 0) / SCRATCH_PRIZES.reduce((s, [, w]) => s + w, 0);
  return { slots, plinko, bj, hl, voltorb, quiz, scratch };
}

test('an average day pays about 380, under the cap', () => {
  const day = averageDay(), total = Object.values(day).reduce((a, b) => a + b, 0);
  if (process.env.CORNER_DAY) console.log(Object.fromEntries(Object.entries(day).map(([k, v]) => [k, Math.round(v)])), Math.round(total));
  assert.ok(total > 300 && total < 450, `an average day pays ${total}`);
  for (const [game, v] of Object.entries(day)) assert.ok(v < GAME_CAP, `${game} averages ${v}`);
});

test('a quiz round has distinct questions, each with its answer among distinct options', () => {
  const pool = Array.from({ length: 40 }, (_, i) => `mon${i}`);
  const round = quizRound('2026-10-10', 0, pool);
  assert.equal(round.length, QUIZ_LEN);
  assert.equal(new Set(round.map(q => q.answer)).size, QUIZ_LEN);
  for (const q of round) { assert.ok(q.options.includes(q.answer)); assert.equal(new Set(q.options).size, 4); }
  assert.deepEqual(round, quizRound('2026-10-10', 0, [...pool].reverse()));
  assert.equal(quizPay(QUIZ_LEN), 40);
  assert.equal(quizPay(4), 20);
});

test('prizes are unique and priced to take a few days of Game Corner coins', () => {
  assert.equal(Object.keys(PRIZES_BY_KIND).length, PRIZES.length + RETIRED_PRIZES.length);
  const games = readFileSync(new URL('../js/home-arcade.js', import.meta.url), 'utf8');
  for (const p of PRIZES) assert.match(games, new RegExp(`^  ${p.kind}:`, 'm'), `${p.kind} is a game you can play at home`);
  for (const p of PRIZES) assert.ok(p.coins >= 150 && p.coins <= DAILY_CAP * 2, p.kind);
});

test('records keep the best, and counts add up', () => {
  let best = better(undefined, 'hl', 4);
  best = better(best, 'hl', 2);
  assert.equal(best.hl, 4);
  best = better(better(best, 'jackpots', 1, true), 'jackpots', 1, true);
  assert.equal(best.jackpots, 2);
});
