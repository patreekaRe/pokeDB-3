/* ============================================================
   corner.js  -  the Game Corner's games and deals (the revamp, 2026-10-10; the user's picks: no betting coins and no
   prize tickets). Pure rules, kept free of the DOM so node tests can read them.

   Every game is free (2026-10-12, the user's call: no betting). Each has PLAYS a UTC day that pay; past them, or past
   GAME_CAP from one game or DAILY_CAP from them all (`save.corner.pot`), it's played for fun. The table games stake
   STAKE of Meowth's house chips a play, never your coins, and pay what the chips win. Average play pays about 250 a
   day all told (tests/corner.test.mjs works it out), under a winning run, so runs stay the way to earn.
   Voltorb Flip  HeartGold / SoulSilver's: a 5x5 board of 1s, 2s, 3s and Voltorbs, each row and column's sum and
                 Voltorbs told at its edge. Flip a tile to multiply the round's score; flip every 2 and 3 to win it.
                 A won (or quit) round pays coins from its score. Levels 1-8 as in HGSS. Each board comes from the day's seed and
                 the round number, so a refresh can't deal a new one.
   Who's That Pokémon?  one round of QUIZ_LEN silhouettes a UTC day.
   Deal of the Day  one skin, perk level or shiny at DEAL_OFF off, picked once a UTC day from what you can still buy.
   ============================================================ */

import { streamOf, randIndex, shuffled, hashString } from '../rng.js';

/* ---------- Voltorb Flip ---------- */

export const DAILY_CAP = 500;   // PokéCoins a UTC day from every game together
export const GAME_CAP = 150;    // from any one game, so the cap takes several
export const STAKE = 10;        // house chips a table play stakes
/** Plays a UTC day that pay, by game (the cut-down numbers, the user's pick 2026-10-12). Who's That is one round a day. */
export const PLAYS = { slots: 5, plinko: 4, bj: 3, hl: 3, voltorb: 2 };

/** What a win pays today, after `won` from every game and `gameWon` from this one. */
export const capPay = (coins, won, gameWon = 0) => Math.max(0, Math.min(coins, DAILY_CAP - won, GAME_CAP - gameWon));
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

/** PokéCoins a score pays: three times its square root, so a cleared level 1 board pays ~15-20 and a level 8 one 150. */
export const payout = (points) => (points > 0 ? Math.round(3 * Math.sqrt(points)) : 0);

/** The next round's level: up one after a win; after a Voltorb, down to the tiles flipped that round if fewer (HGSS). */
export function nextLevel(level, { won, flips }) {
  if (won) return Math.min(VOLTORB_LEVELS, level + 1);
  return Math.max(1, Math.min(level, flips));
}

/** A fresh Voltorb Flip record for a day. `level` carries over between days. */
export const freshVoltorb = (day, level = 1) => ({ day, level, round: 0, won: 0, flipped: [] });

/* ---------- Prize tickets (2026-10-12, the user's ask: playing on for fun is still worth something) ----------
   A play that no longer pays coins earns tickets instead, one for every STAKE chips it wins (a Voltorb round one for
   every 5 coins it would pay), up to TICKET_CAP a UTC day. Tickets buy PRIZES at Meowth's prize counter: Game Corner
   furniture and Gen 1's Game Corner dolls, never sold for coins (js/data/furniture.js keeps them out of the store).
   Priced so a regular player swaps for one every few days. Kept in `save.corner.tickets` ({ have, earned, day, today })
   and `save.corner.prizes` (kinds swapped for). */

export const TICKET_CAP = 100;
/** Games whose for-fun plays earn no tickets (2026-10-12, the user's call: Plinko drops could be spammed for them). */
export const NO_TICKETS = new Set(['plinko']);
/** Tickets a for-fun play's win earns: one per STAKE chips. */
export const ticketsFor = (chips) => Math.max(0, Math.floor(chips / STAKE));
/** Tickets a for-fun Voltorb round earns: one per 5 coins it would have paid. */
export const voltorbTickets = (points) => Math.floor(payout(points) / 5);

export const PRIZES = [
  { kind: 'abradoll', tickets: 60 },
  { kind: 'clefairydoll', tickets: 60 },
  { kind: 'casinorug', tickets: 80 },
  { kind: 'dratinidoll', tickets: 90 },
  { kind: 'jackpotsign', tickets: 100 },
  { kind: 'luckyseven', tickets: 120 },
  { kind: 'plinkoboard', tickets: 150 },
  { kind: 'slotmachine', tickets: 150 },
  { kind: 'voltorbflip', tickets: 150 },
  { kind: 'bigdratinidoll', tickets: 250 },
];
export const PRIZES_BY_KIND = Object.fromEntries(PRIZES.map(p => [p.kind, p]));

/* ---------- Records: each game's personal bests, paid or for fun (`save.corner.best`) ---------- */

/** What each record means, for the games' Best lines and the badges. */
export const RECORDS = {
  slots: 'Biggest spin', jackpots: 'Jackpots', plinko: 'Best drop', bjStreak: 'Win streak', hl: 'Best streak',
  voltorbLevel: 'Best level', voltorbScore: 'Best board', quizPerfect: 'Perfect rounds', tickets: 'Tickets earned',
};
/** A record's new value: the higher of the old and `value`, or the old plus one for a count (`add`). */
export const better = (best, key, value, add = false) => ({ ...best, [key]: add ? (best?.[key] ?? 0) + value : Math.max(best?.[key] ?? 0, value) });



export const QUIZ_LEN = 5;       // silhouettes in the day's one round (slimmed 2026-10-11, the user's pick)
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

/** Coins for the day's round: 5 a right answer, and 5 more for all of them. */
export const quizPay = (right) => right * 5 + (right === QUIZ_LEN ? 5 : 0);

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
