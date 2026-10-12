/* ============================================================
   casino.js  -  the Game Corner's betting games (2026-10-10, the user's asks; the lineup the user picked 2026-10-11):
   tap-to-stop Slots with a jackpot and a bonus round, Blackjack, High-Low and Plinko, and Meowth's daily scratch card.
   Since 2026-10-12 (the user's call) nobody bets: each play stakes Meowth's house chips (js/data/corner.js's STAKE,
   PLAYS and caps) and pays what they win, so the odds below (about 95% back) set what a play is worth. Every roll comes
   from a stream keyed by the day and the play's number, so a refresh can't re-roll a spin or a hand. Pure rules, no
   DOM, so node tests read them.
   ============================================================ */

import { streamOf, randIndex, shuffled } from '../rng.js';

/** A play's stream: the game, the day and how many plays of it came before. */
export const playRand = (game, day, n) => streamOf(`casino:${game}`, `${day}:${n}`);

/* ---------- Slots: three reels you stop yourself, one line ---------- */

export const SYMBOLS = ['seven', 'pikachu', 'poliwag', 'ball', 'berry', 'voltorb'];
export const REEL_WEIGHT = { seven: 1, pikachu: 2, poliwag: 3, ball: 4, berry: 5, voltorb: 5 };
/** Each reel's strip, in order round the reel: every symbol as often as its weight, the one 7 between Voltorbs. */
export const STRIP = ['seven', 'voltorb', 'berry', 'ball', 'pikachu', 'berry', 'poliwag', 'voltorb', 'ball', 'berry',
  'poliwag', 'voltorb', 'pikachu', 'ball', 'berry', 'poliwag', 'voltorb', 'ball', 'berry', 'voltorb'];
export const PAY_THREE = { seven: 0, pikachu: 20, poliwag: 12, ball: 10, berry: 8, voltorb: 0 };   // three 7s pay the jackpot
export const PAY_TWO = { seven: 5, pikachu: 3, poliwag: 2, ball: 2, berry: 2, voltorb: 0 };        // the first two reels
export const PAY_BERRY = 2;          // an Oran Berry on the first reel alone
export const SLIP = 3;               // a stopped reel slides on 0 to SLIP-1 more symbols, from the spin's stream
export const BONUS_SPINS = 5;        // three Pikachu: free spins paying double
export const JACKPOT = 150;          // three 7s: a whole day's worth from the slots (GAME_CAP)

/** Where a reel stops when tapped with `at` under the line: a slip of 0 to SLIP-1 from the spin's roll. */
export const stopAt = (at, rand) => (at + randIndex(SLIP, rand)) % STRIP.length;

/** What a line pays, as a multiple of the bet ('jackpot' for three 7s). */
export function slotPay([a, b, c]) {
  if (a === b && b === c) return a === 'seven' ? 'jackpot' : PAY_THREE[a];
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

/* ---------- High-Low: the next card higher or lower; a tie loses; cash out any time ---------- */

export const HL_EDGE = 0.95;   // each right guess multiplies the pot by 0.95 over the guess's chance

/** A card, 1 (ace) to 13 (king), from a fresh deck each draw. */
export const drawRank = (rand) => 1 + randIndex(13, rand);

/** A guess's chance from `rank`: 'hi' wins on a higher card, 'lo' on a lower. */
export const hlChance = (rank, guess) => (guess === 'hi' ? 13 - rank : rank - 1) / 13;

/** What a right guess multiplies the pot by (0 if it can't win). */
export const hlMult = (rank, guess) => { const p = hlChance(rank, guess); return p > 0 ? HL_EDGE / p : 0; };

/* ---------- Plinko: a Poké Ball down twelve rows of pegs ---------- */

/* A coin-flip at every peg would pile nearly every ball into the middle three bins (the user saw only the middle,
   2026-10-11), so the bin is dealt from PLINKO_ODDS first, flatter than a bell, and the bounces are shuffled to land
   there: about 1 drop in 25 reaches an edge. */
export const PLINKO_ROWS = 12;
export const PLINKO_PAYS = [10, 2.4, 1.4, 1, 0.55, 0.4, 0.2, 0.4, 0.55, 1, 1.4, 2.4, 10];
export const PLINKO_ODDS = [12, 35, 55, 75, 95, 110, 236, 110, 95, 75, 55, 35, 12];   // in 1000

/** A drop: its bin, and its path, a left (0) or right (1) bounce at each row, with as many rights as the bin. */
export function plinkoDrop(rand) {
  let r = randIndex(1000, rand), bin = 0;
  while (r >= PLINKO_ODDS[bin]) r -= PLINKO_ODDS[bin++];
  const path = shuffled([...Array(bin).fill(1), ...Array(PLINKO_ROWS - bin).fill(0)], rand);
  return { bin, path };
}

/* ---------- Meowth's scratch card: one free a UTC day, always a prize, counted in the day's cap ---------- */

export const SCRATCH_PRIZES = [[10, 40], [25, 25], [50, 15], [75, 10], [100, 7], [150, 3]];   // [coins, weight]
export const SCRATCH_SYMBOLS = ['berry', 'ball', 'poliwag', 'pikachu', 'seven', 'voltorb'];
const PRIZE_SYMBOL = { 10: 'berry', 25: 'ball', 50: 'poliwag', 75: 'pikachu', 100: 'voltorb', 150: 'seven' };

/** A day's card: its prize and nine cells, three of the prize's symbol and no other symbol three times. */
export function scratchCard(day) {
  const rand = streamOf('casino:scratch', day);
  const total = SCRATCH_PRIZES.reduce((n, [, w]) => n + w, 0);
  let roll = rand() * total, prize = SCRATCH_PRIZES[0][0];
  for (const [coins, w] of SCRATCH_PRIZES) { if ((roll -= w) < 0) { prize = coins; break; } }
  const win = PRIZE_SYMBOL[prize], others = shuffled(SCRATCH_SYMBOLS.filter(s => s !== win), rand);
  const cells = [win, win, win, others[0], others[0], others[1], others[1], others[2], others[3]];
  return { prize, symbol: win, cells: shuffled(cells, rand) };
}

