/* ============================================================
   corner.js  -  the Game Corner's games and deals (the revamp, 2026-10-10; the user's picks: no betting coins and no
   prize tickets). Pure rules, kept free of the DOM so node tests can read them.

   The games share one pot: GAMES_CAP PokéCoins a UTC day across them all (`save.corner.pot`).
   Voltorb Flip  HeartGold / SoulSilver's: a 5x5 board of 1s, 2s, 3s and Voltorbs, each row and column's sum and
                 Voltorbs told at its edge. Flip a tile to multiply the round's score; flip every 2 and 3 to win it.
                 Free to play; a won (or quit) round pays coins from its score, up to VOLTORB_CAP a UTC day, so it's a
                 fun extra and never replaces runs. Levels 1-8 as in HGSS. Each board comes from the day's seed and
                 the round number, so a refresh can't deal a new one.
   Gachapon      a capsule machine of the Secret Base's big Pokémon dolls (sold nowhere else). A week's set of
                 GACHA_SET dolls, the same for everyone; a pull costs GACHA_PRICE and a doll already owned refunds
                 GACHA_REFUND.
   Deal of the Day  one skin, perk level or shiny at DEAL_OFF off, picked once a UTC day from what you can still buy.
   ============================================================ */

import { streamOf, randIndex, shuffled, hashString } from '../rng.js';

/* ---------- Voltorb Flip ---------- */

export const GAMES_CAP = 250;   // PokéCoins a UTC day from all the games together; after that they're played for fun
export const VOLTORB_CAP = GAMES_CAP;

/** What a game's win pays today, after `won` coins already. */
export const capPay = (coins, won) => Math.max(0, Math.min(coins, GAMES_CAP - won));
export const VOLTORB_LEVELS = 8;
export const SIZE = 5;

/** Each level's boards, as HGSS deals them: [twos, threes, Voltorbs]; the rest of the 25 are 1s. */
export const VOLTORB_BOARDS = [
  [[3, 1, 6], [0, 3, 6], [5, 0, 6], [2, 2, 6], [4, 1, 6]],
  [[1, 3, 7], [6, 0, 7], [3, 2, 7], [0, 4, 7], [5, 1, 7]],
  [[2, 3, 8], [7, 0, 8], [4, 2, 8], [1, 4, 8], [6, 1, 8]],
  [[3, 3, 8], [0, 5, 8], [8, 0, 10], [5, 2, 10], [2, 4, 10]],
  [[7, 1, 10], [4, 3, 10], [1, 5, 10], [9, 0, 10], [6, 2, 10]],
  [[3, 4, 10], [0, 6, 10], [8, 1, 10], [5, 3, 10], [2, 5, 10]],
  [[7, 2, 10], [4, 4, 10], [1, 6, 13], [9, 1, 13], [6, 3, 10]],
  [[0, 7, 10], [8, 2, 10], [5, 4, 10], [2, 6, 10], [7, 3, 10]],
];

/** A board for `level` (1-8): 25 tile values, row by row (0 a Voltorb), from `rand`. */
export function dealBoard(level, rand) {
  const set = VOLTORB_BOARDS[Math.min(VOLTORB_LEVELS, Math.max(1, level)) - 1];
  const [twos, threes, bombs] = set[randIndex(set.length, rand)];
  const tiles = [...Array(twos).fill(2), ...Array(threes).fill(3), ...Array(bombs).fill(0)];
  return shuffled([...tiles, ...Array(SIZE * SIZE - tiles.length).fill(1)], rand);
}

/** The board of a day's nth round: the same for everyone who reaches it at that level. */
export const voltorbBoard = (day, round, level) => dealBoard(level, streamOf('voltorb', `${day}:${round}:${level}`));

/** The clues at each row's right and each column's foot: { sum, bombs }. */
export function clues(board) {
  const line = (cells) => ({ sum: cells.reduce((n, v) => n + v, 0), bombs: cells.filter(v => v === 0).length });
  const at = (r, c) => board[r * SIZE + c];
  const idx = [...Array(SIZE).keys()];
  return { rows: idx.map(r => line(idx.map(c => at(r, c)))), cols: idx.map(c => line(idx.map(r => at(r, c)))) };
}

/** The round's score so far: the product of the flipped tiles (0 before the first flip). */
export function score(board, flipped) {
  const vals = flipped.map(i => board[i]);
  return vals.length ? vals.reduce((n, v) => n * v, 1) : 0;
}

/** Every 2 and 3 is flipped: the round is won. */
export const cleared = (board, flipped) => board.every((v, i) => v < 2 || flipped.includes(i));

/** The most a level's boards can score (for the payout table). */
export const bestScore = (level) => Math.max(...VOLTORB_BOARDS[level - 1].map(([t, h]) => 2 ** t * 3 ** h));

/** PokéCoins a score pays: its square root, so a level 1 board pays ~5 and a level 8 one ~50. */
export const payout = (points) => (points > 0 ? Math.round(Math.sqrt(points)) : 0);

/** What today still pays, after `won` coins already. */
export const paysToday = (points, won) => Math.max(0, Math.min(payout(points), VOLTORB_CAP - won));

/** The next round's level: up one after a win; after a Voltorb, down to the tiles flipped that round if fewer (HGSS). */
export function nextLevel(level, { won, flips }) {
  if (won) return Math.min(VOLTORB_LEVELS, level + 1);
  return Math.max(1, Math.min(level, flips));
}

/** A fresh Voltorb Flip record for a day. `level` carries over between days. */
export const freshVoltorb = (day, level = 1) => ({ day, level, round: 0, won: 0, flipped: [] });

/* ---------- Who's That Pokémon? ---------- */

export const QUIZ_LEN = 10;      // silhouettes a round
export const QUIZ_CHOICES = 4;

/** A round's questions: QUIZ_LEN Pokémon from `pool` (ids), each with QUIZ_CHOICES names to pick from, the same for
    everyone on a day's nth round. */
export function quizRound(day, n, pool) {
  const rand = streamOf('quiz', `${day}:${n}`), ids = [...pool].sort();
  return shuffled(ids, rand).slice(0, QUIZ_LEN).map(answer => {
    const others = shuffled(ids.filter(id => id !== answer), rand).slice(0, QUIZ_CHOICES - 1);
    return { answer, options: shuffled([answer, ...others], rand) };
  });
}

/** Coins for a round: 3 a right answer, and 10 more for all of them. */
export const quizPay = (right) => right * 3 + (right === QUIZ_LEN ? 10 : 0);

/* ---------- Memory Match ---------- */

export const MEMORY_PAIRS = 8;   // a 4 x 4 board

/** A day's nth board: MEMORY_PAIRS Pokémon from `pool`, each twice, shuffled. */
export function memoryBoard(day, n, pool) {
  const rand = streamOf('memory', `${day}:${n}`);
  const picks = shuffled([...pool].sort(), rand).slice(0, MEMORY_PAIRS);
  return shuffled([...picks, ...picks], rand);
}

/** Coins for a cleared board: 30, less 2 a miss, never under 4. */
export const memoryPay = (misses) => Math.max(4, 30 - 2 * misses);

/* ---------- Gachapon ---------- */

export const GACHA_SET = 8;       // dolls in a week's capsules
export const GACHA_PRICE = 100;   // PokéCoins a pull
export const GACHA_REFUND = 60;   // back for a doll you already have

/** The week's capsules: GACHA_SET kinds of `pool` (the big dolls), the same for everyone that week. */
export const gachaSet = (week, pool) => shuffled([...pool].sort(), streamOf('gacha', week)).slice(0, GACHA_SET);

/** The doll in a week's nth capsule: rolled on the week and the pull, so a refresh opens the same one. */
export const gachaPull = (week, n, set) => set[randIndex(set.length, streamOf('gacha', `${week}:${n}`))];

/* ---------- Deal of the Day ---------- */

export const DEAL_OFF = 0.3;
export const DEAL_ROWS = ['skins', 'perks', 'shiny'];

/** A discounted price, rounded to 5. */
export const dealPrice = (cost) => Math.round(cost * (1 - DEAL_OFF) / 5) * 5;

/** The day's deal from the keys you could buy now ("perks:hpBoost"): one, from the day's seed, or null. */
export function pickDeal(day, keys) {
  if (!keys.length) return null;
  return [...keys].sort()[hashString(`deal:${day}`) % keys.length];
}
