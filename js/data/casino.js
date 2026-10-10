/* ============================================================
   casino.js  -  the Game Corner's betting games (2026-10-10, the user's ask): Slots, Blackjack, Roulette and High-Low,
   bet in PokéCoins. Each keeps a small house edge (about 5% or less, measured in tests/casino.test.mjs), and the day's
   winnings from them are capped: once you're BET_CAP up on a UTC day the tables close till tomorrow, so a lucky night
   can't buy every perk. Losses aren't capped. Every roll comes from a stream keyed by the day and the play's number, so a
   refresh can't re-roll a spin or a hand. Pure rules, no DOM, so node tests read them.
   ============================================================ */

import { streamOf, randIndex, shuffled } from '../rng.js';

export const BETS = [10, 25, 50, 100];
export const BET_CAP = 500;   // PokéCoins up on a UTC day before the tables close

/** May you bet today, `net` up so far? */
export const tablesOpen = (net) => net < BET_CAP;

/** A play's stream: the game, the day and how many plays of it came before. */
export const playRand = (game, day, n) => streamOf(`casino:${game}`, `${day}:${n}`);

/* ---------- Slots: three reels, one line ---------- */

export const SYMBOLS = ['seven', 'pikachu', 'poliwag', 'ball', 'berry', 'voltorb'];
export const REEL_WEIGHT = { seven: 1, pikachu: 2, poliwag: 3, ball: 4, berry: 5, voltorb: 5 };
export const PAY_THREE = { seven: 100, pikachu: 40, poliwag: 20, ball: 12, berry: 8, voltorb: 0 };
export const PAY_TWO = { seven: 10, pikachu: 5, poliwag: 2, ball: 1, berry: 2, voltorb: 0 };   // the first two reels
export const PAY_BERRY = 2;   // an Oran Berry on the first reel alone

const REEL = SYMBOLS.flatMap(s => Array(REEL_WEIGHT[s]).fill(s));

/** A spin's three symbols. */
export const spinReels = (rand) => [0, 1, 2].map(() => REEL[randIndex(REEL.length, rand)]);

/** What a spin pays, as a multiple of the bet. */
export function slotPay([a, b, c]) {
  if (a === b && b === c) return PAY_THREE[a];
  if (a === b) return PAY_TWO[a];
  return a === 'berry' ? PAY_BERRY : 0;
}

/* ---------- Blackjack: one deck a hand, dealer stands on 17, blackjack pays 3:2, double on two cards ---------- */

export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
export const SUITS = ['♠', '♥', '♦', '♣'];

/** A fresh shuffled deck of 52 as [rank, suit] pairs. */
export const shuffledDeck = (rand) => shuffled(RANKS.flatMap(r => SUITS.map(s => [r, s])), rand);

/** A hand's best total (aces 11 where they fit) and whether it's soft. */
export function handValue(cards) {
  let total = 0, aces = 0;
  for (const [r] of cards) { total += r === 'A' ? 11 : ['J', 'Q', 'K'].includes(r) ? 10 : Number(r); if (r === 'A') aces += 1; }
  while (total > 21 && aces) { total -= 10; aces -= 1; }
  return { total, soft: aces > 0 };
}
export const isBlackjack = (cards) => cards.length === 2 && handValue(cards).total === 21;

/** The dealer draws from `deck` (taking from its front) to 17 or more. */
export function dealerPlays(hand, deck) {
  const h = [...hand];
  while (handValue(h).total < 17) h.push(deck.shift());
  return h;
}

/** What a finished hand returns, as a multiple of the stake (0 lost, 1 push, 2 won, 2.5 a blackjack). */
export function blackjackReturn(player, dealer) {
  const p = handValue(player).total, d = handValue(dealer).total;
  if (p > 21) return 0;
  if (isBlackjack(player) && !isBlackjack(dealer)) return 2.5;
  if (isBlackjack(dealer) && !isBlackjack(player)) return 0;
  if (d > 21 || p > d) return 2;
  return p === d ? 1 : 0;
}

/* ---------- Roulette: a single-zero wheel of 37 ---------- */

export const REDS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
export const WHEEL = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];

/** The bets: what wins and what it pays (as a multiple of the stake, the stake back included). */
export const ROULETTE_BETS = {
  red: { name: 'Red', wins: (n) => REDS.has(n), pays: 2 },
  black: { name: 'Black', wins: (n) => n > 0 && !REDS.has(n), pays: 2 },
  odd: { name: 'Odd', wins: (n) => n % 2 === 1, pays: 2 },
  even: { name: 'Even', wins: (n) => n > 0 && n % 2 === 0, pays: 2 },
  low: { name: '1-18', wins: (n) => n >= 1 && n <= 18, pays: 2 },
  high: { name: '19-36', wins: (n) => n >= 19, pays: 2 },
  d1: { name: '1st 12', wins: (n) => n >= 1 && n <= 12, pays: 3 },
  d2: { name: '2nd 12', wins: (n) => n >= 13 && n <= 24, pays: 3 },
  d3: { name: '3rd 12', wins: (n) => n >= 25, pays: 3 },
};
/** A bet on one number pays 36 times the stake. */
export const NUMBER_PAYS = 36;

export const spinWheel = (rand) => randIndex(37, rand);
export const rouletteReturn = (bet, n) => (typeof bet === 'number' ? (bet === n ? NUMBER_PAYS : 0) : ROULETTE_BETS[bet].wins(n) ? ROULETTE_BETS[bet].pays : 0);

/* ---------- High-Low: the next card higher or lower; a tie loses; cash out any time ---------- */

export const HL_EDGE = 0.95;   // each right guess multiplies the pot by 0.95 over the guess's chance

/** A card, 1 (ace) to 13 (king), from a fresh deck each draw. */
export const drawRank = (rand) => 1 + randIndex(13, rand);

/** A guess's chance from `rank`: 'hi' wins on a higher card, 'lo' on a lower. */
export const hlChance = (rank, guess) => (guess === 'hi' ? 13 - rank : rank - 1) / 13;

/** What a right guess multiplies the pot by (0 if it can't win). */
export const hlMult = (rank, guess) => { const p = hlChance(rank, guess); return p > 0 ? HL_EDGE / p : 0; };
