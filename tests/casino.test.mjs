import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SYMBOLS, REEL_WEIGHT, STRIP, SLIP, slotPay, stopAt, shuffledDeck, handValue, dealerPlays, blackjackReturn, isBlackjack,
  hlChance, hlMult, playRand, tablesOpen, BET_CAP, plinkoDrop, PLINKO_PAYS,
  PLINKO_ROWS, PLINKO_ODDS, scratchCard, SCRATCH_PRIZES,
} from '../js/data/casino.js';
import { makeRng } from '../js/rng.js';

test('the slot strip holds each symbol as often as its weight', () => {
  assert.equal(STRIP.length, 20);
  for (const s of SYMBOLS) assert.equal(STRIP.filter(x => x === s).length, REEL_WEIGHT[s]);
  for (let at = 0; at < 20; at++) { const s = stopAt(at, makeRng(at)); assert.ok(((s - at + 20) % 20) < SLIP); }
});

test('slots stopped at random return under 100%, the jackpot aside', () => {
  let rtp = 0;
  for (const a of STRIP) for (const b of STRIP) for (const c of STRIP) { const m = slotPay([a, b, c]); rtp += (m === 'jackpot' ? 0 : m) / 8000; }
  assert.ok(rtp > 0.8 && rtp < 0.95, `slots return ${rtp}`);
  assert.equal(slotPay(['seven', 'seven', 'seven']), 'jackpot');
});

test('blackjack hands add up', () => {
  assert.deepEqual(handValue([['A', '♠'], ['K', '♥']]), { total: 21, soft: true });
  assert.equal(handValue([['A', '♠'], ['A', '♥'], ['9', '♣']]).total, 21);
  assert.ok(isBlackjack([['A', '♠'], ['J', '♦']]));
  assert.equal(blackjackReturn([['A', '♠'], ['J', '♦']], [['10', '♠'], ['9', '♦']]), 2.5);
  assert.equal(blackjackReturn([['10', '♠'], ['8', '♦']], [['10', '♣'], ['8', '♥']]), 1);
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
  assert.ok(back / n > 0.9 && back / n < 1, `blackjack returns ${back / n}`);
});

test('high-low keeps a 5% edge each guess and never offers a sure loss', () => {
  for (let r = 1; r <= 13; r++) for (const g of ['hi', 'lo']) {
    const p = hlChance(r, g), m = hlMult(r, g);
    if (p === 0) assert.equal(m, 0); else assert.ok(Math.abs(p * m - 0.95) < 1e-9);
  }
});

test('Plinko returns about 95%, and its paths land in their bins', () => {
  assert.equal(PLINKO_ODDS.reduce((a, b) => a + b, 0), 1000);
  assert.equal(PLINKO_PAYS.length, PLINKO_ROWS + 1);
  const rtp = PLINKO_ODDS.reduce((s, c, i) => s + c * PLINKO_PAYS[i], 0) / 1000;
  assert.ok(rtp > 0.93 && rtp < 0.97, `plinko returns ${rtp}`);
  const rand = makeRng(9), seen = new Set();
  for (let i = 0; i < 3000; i++) {
    const { bin, path } = plinkoDrop(rand);
    assert.equal(path.length, PLINKO_ROWS);
    assert.equal(path.reduce((a, b) => a + b, 0), bin);
    seen.add(bin);
  }
  assert.equal(seen.size, PLINKO_ROWS + 1);
});

test('the scratch card always wins its prize, the same for the day', () => {
  for (const day of ['2026-10-11', '2026-10-12', '2026-11-01']) {
    const c = scratchCard(day);
    assert.ok(SCRATCH_PRIZES.some(([coins]) => coins === c.prize));
    assert.equal(c.cells.length, 9);
    assert.equal(c.cells.filter(s => s === c.symbol).length, 3);
    for (const s of new Set(c.cells)) if (s !== c.symbol) assert.ok(c.cells.filter(x => x === s).length < 3);
    assert.deepEqual(c, scratchCard(day));
  }
});

test('plays come from the day and their number, and the tables close once the day is won', () => {
  assert.equal(playRand('slots', '2026-10-10', 4)(), playRand('slots', '2026-10-10', 4)());
  assert.ok(tablesOpen(BET_CAP - 1));
  assert.ok(!tablesOpen(BET_CAP));
});
