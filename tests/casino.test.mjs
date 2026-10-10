import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SYMBOLS, REEL_WEIGHT, slotPay, spinReels, shuffledDeck, handValue, dealerPlays, blackjackReturn, isBlackjack,
  rouletteReturn, ROULETTE_BETS, spinWheel, hlChance, hlMult, playRand, tablesOpen, BET_CAP, WHEEL,
} from '../js/data/casino.js';
import { makeRng } from '../js/rng.js';

test('the slots return about 95% of what goes in', () => {
  const T = Object.values(REEL_WEIGHT).reduce((a, b) => a + b, 0);
  let rtp = 0;
  for (const a of SYMBOLS) for (const b of SYMBOLS) for (const c of SYMBOLS) rtp += REEL_WEIGHT[a] * REEL_WEIGHT[b] * REEL_WEIGHT[c] / T ** 3 * slotPay([a, b, c]);
  assert.ok(rtp > 0.93 && rtp < 0.97, `slots return ${rtp}`);
  assert.equal(slotPay(['seven', 'seven', 'seven']), 100);
  assert.equal(spinReels(makeRng(1)).length, 3);
});

test('blackjack hands add up', () => {
  assert.deepEqual(handValue([['A', '♠'], ['K', '♥']]), { total: 21, soft: true });
  assert.equal(handValue([['A', '♠'], ['A', '♥'], ['9', '♣']]).total, 21);
  assert.equal(handValue([['K', '♠'], ['Q', '♥'], ['5', '♣']]).total, 25);
  assert.ok(isBlackjack([['A', '♠'], ['J', '♦']]));
  assert.equal(blackjackReturn([['A', '♠'], ['J', '♦']], [['10', '♠'], ['9', '♦']]), 2.5);
  assert.equal(blackjackReturn([['10', '♠'], ['8', '♦']], [['10', '♣'], ['8', '♥']]), 1);
  assert.equal(blackjackReturn([['10', '♠'], ['8', '♦'], ['9', '♣']], [['10', '♣'], ['8', '♥']]), 0);
  assert.ok(handValue(dealerPlays([['2', '♠'], ['3', '♦']], shuffledDeck(makeRng(4)))).total >= 17);
  assert.equal(new Set(shuffledDeck(makeRng(2)).map(c => c.join(''))).size, 52);
});

test('blackjack played by the book loses a little', () => {
  let back = 0, n = 20000;
  for (let i = 0; i < n; i++) {
    const deck = shuffledDeck(makeRng(i * 7919 + 1)), p = [deck.shift(), deck.shift()], d = [deck.shift(), deck.shift()];
    if (!isBlackjack(p) && !isBlackjack(d)) {
      const up = handValue([d[0]]).total;
      while (handValue(p).total < (up >= 7 ? 17 : 12) || (handValue(p).soft && handValue(p).total < 18)) p.push(deck.shift());
    }
    back += blackjackReturn(p, handValue(p).total > 21 ? d : dealerPlays(d, deck));
  }
  const rtp = back / n;
  assert.ok(rtp > 0.9 && rtp < 1, `blackjack returns ${rtp}`);
});

test('roulette pays a single-zero wheel', () => {
  assert.equal(WHEEL.length, 37);
  assert.equal(new Set(WHEEL).size, 37);
  for (const bet of [...Object.keys(ROULETTE_BETS), 17]) {
    let back = 0;
    for (let n = 0; n <= 36; n++) back += rouletteReturn(bet, n);
    assert.ok(Math.abs(back / 37 - 36 / 37) < 1e-9, `${bet} returns ${back / 37}`);
  }
  assert.ok(spinWheel(makeRng(3)) <= 36);
});

test('high-low keeps a 5% edge each guess and never offers a sure loss', () => {
  for (let r = 1; r <= 13; r++) for (const g of ['hi', 'lo']) {
    const p = hlChance(r, g), m = hlMult(r, g);
    if (p === 0) assert.equal(m, 0); else assert.ok(Math.abs(p * m - 0.95) < 1e-9);
  }
});

test('plays come from the day and their number, and the tables close once the day is won', () => {
  assert.equal(playRand('slots', '2026-10-10', 4)(), playRand('slots', '2026-10-10', 4)());
  assert.notEqual(playRand('slots', '2026-10-10', 4)(), playRand('slots', '2026-10-10', 5)());
  assert.ok(tablesOpen(BET_CAP - 1));
  assert.ok(!tablesOpen(BET_CAP));
});
