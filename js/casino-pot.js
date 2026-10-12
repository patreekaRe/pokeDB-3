/* casino-pot.js  -  the table games' bookkeeping (js/data/casino.js has the rules): how many plays each game has had
   today (the play's number seeds its roll, and the first PLAYS of them pay) and paying out through the shared pot
   (js/corner-pot.js). Nobody bets (2026-10-12, the user's call): a play stakes STAKE of Meowth's house chips and pays
   what they win. Kept in `save.corner.bets` ({ day, plays }); a game's hand in progress is its own field there. */

import { PLAYS, DAILY_CAP, GAME_CAP, RECORDS, QUIZ_LEN } from './data/corner.js';
import { safariDay } from './data/safari.js';
import { getSave, updateSave } from './storage.js';
import { el } from './ui.js';
import { stamp, payGame, potWon, gameWon, canPay, best, atHome } from './corner-pot.js';

const homeHands = {};   // a hand in progress at home, kept for the page load only
const homeSeed = () => ({ day: 'home', n: Math.floor(Math.random() * 1e9), paid: false });

function today() {
  const b = getSave().corner?.bets, day = safariDay();
  return b?.day === day ? b : { day, plays: {} };
}
const write = (b) => updateSave(d => { d.corner = { ...d.corner, bets: b }; });

/** Plays of `game` left today that pay. */
export const playsLeft = (game) => Math.max(0, PLAYS[game] - (today().plays[game] ?? 0));
/** Would `game`'s next play pay? */
export const paysNow = (game) => playsLeft(game) > 0 && canPay(game);

/** Rounds of Voltorb Flip (of PLAYS.voltorb) and questions of today's quiz (of QUIZ_LEN) played today. */
export function puzzlesPlayed() {
  const c = getSave().corner ?? {}, day = safariDay();
  const v = c.voltorb?.day === day ? c.voltorb.round : 0;
  const q = c.quiz?.day === day ? (c.quiz.round >= 1 ? QUIZ_LEN : c.quiz.q ?? 0) : 0;
  return { voltorb: Math.min(PLAYS.voltorb, v), quiz: Math.min(QUIZ_LEN, q) };
}

/** Has `game` (a pot key: slots, plinko, bj, hl, voltorb, quiz) still a paying play today? The Game Corner's "!" over it
    stays until it hasn't (the user's ask, 2026-10-12). */
export function stillPays(game) {
  if (!canPay(game)) return false;
  const done = puzzlesPlayed();
  if (game === 'voltorb') return done.voltorb < PLAYS.voltorb;
  if (game === 'quiz') return done.quiz < QUIZ_LEN;
  return playsLeft(game) > 0;
}

/** A new play of `game`: { day, n } (its seed) and whether it pays (`paid`); past that it's for fun. */
export function stake(game) {
  if (atHome()) return homeSeed();
  const b = today(), n = b.plays[game] ?? 0, paid = paysNow(game);
  write({ ...b, plays: { ...b.plays, [game]: n + 1 } });
  stamp(game);
  return { day: b.day, n, paid };
}

/** A free extra play of `game` (a bonus round's spin): its seed, using up no play. */
export function freePlay(game) {
  if (atHome()) return homeSeed();
  const b = today(), n = (b.plays[`${game}Bonus`] ?? 0);
  write({ ...b, plays: { ...b.plays, [`${game}Bonus`]: n + 1 } });
  return { day: b.day, n: 1000 + n };
}

/** Pays a play's win: what the chips won as coins if the play pays (up to the caps), else nothing (played for fun).
    Returns { coins, chips }. */
export function settle(amount, game, paid) {
  const chips = Math.floor(amount);
  return { coins: paid && chips > 0 ? payGame(chips, game) : 0, chips: Math.max(0, chips) };
}

/** What a settled win paid, in words: "40 PokéCoins", or "just for fun" once the plays stop paying. */
export function wonText(r, paid) {
  if (paid) return `${r.coins} PokéCoins${r.coins < r.chips ? ' (all today allows)' : ''}`;
  return 'just for fun';
}

/** A game's Best line: its records as "Best streak 6 · Jackpots 1" (nothing before the first). */
export function bestLine(keys) {
  const parts = keys.filter(k => best(k) > 0).map(k => `${RECORDS[k]} ${k === 'plinko' ? `×${best(k)}` : best(k).toLocaleString()}`);
  return parts.length ? el('p', 'cg-best', `🏆 ${parts.join(' · ')}`) : el('span', '');
}

/** A game's saved hand in progress (`save.corner.bets[game + 'Hand']`), only if it's today's. */
export const handOf = (game) => { if (atHome()) return homeHands[game] ?? null; const b = today(), h = b[`${game}Hand`]; return h?.day === b.day ? h : null; };
export const keepHand = (game, hand) => (atHome() ? void (homeHands[game] = hand) : write({ ...today(), [`${game}Hand`]: hand }));

/** The meters every table shows: plays left that pay and today's coins against the cap (no chips meter since 2026-10-12,
    the user's call: a fixed stake told the player nothing).
    `held` is won but not yet shown (a Plinko ball still falling), kept off the meters till it lands. */
export function tableMeters(game, held = { coins: 0 }) {
  const m = el('div', 'vf-meters');
  if (atHome()) { const box = el('div', 'vf-meter'); box.append(el('span', '', 'At home'), el('b', '', 'Free play')); m.append(box); return m; }
  const left = playsLeft(game);
  for (const [k, v] of [['Plays', `${left}/${PLAYS[game]}`], ['Today', `${potWon() - held.coins}/${DAILY_CAP}`]]) {
    const box = el('div', 'vf-meter'); box.append(el('span', '', k), el('b', '', v)); m.append(box);
  }
  return m;
}

/** Why `game` plays for fun now, in Meowth's words. */
export function funLine(game) {
  if (potWon() >= DAILY_CAP) return `That's ${DAILY_CAP} PokéCoins today, the most the Game Corner pays! Play on for fun, meow. New coins tomorrow.`;
  if (gameWon(game) >= GAME_CAP) return `This game's paid its ${GAME_CAP} for today. Try another for coins, or play on for fun, meow!`;
  return 'Your paying plays here are done for today. Play on for fun, meow! New plays tomorrow.';
}

/** A play key's label: "Spin (3 left)" while plays pay, "Spin for fun" after. */
export const playLabel = (game, word) => (atHome() ? word : paysNow(game) ? `${word} (${playsLeft(game)} left)` : `${word} for fun`);

/** A table's words: `line`, and once its plays stop paying, why (not mid-play, `busy`). */
export const sayLine = (game, line, busy = false) => (busy || atHome() || paysNow(game) ? line : `${line} ${funLine(game)}`);
