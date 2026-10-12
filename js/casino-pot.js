/* casino-pot.js  -  the table games' bookkeeping (js/data/casino.js has the rules): how many plays each game has had
   today (the play's number seeds its roll, and the first PLAYS of them pay) and paying out through the shared pot
   (js/corner-pot.js). Nobody bets (2026-10-12, the user's call): a play stakes STAKE of Meowth's house chips and pays
   what they win. Kept in `save.corner.bets` ({ day, plays }); a game's hand in progress is its own field there. */

import { PLAYS, NO_TICKETS, DAILY_CAP, GAME_CAP, ticketsFor, RECORDS } from './data/corner.js';
import { safariDay } from './data/safari.js';
import { getSave, updateSave } from './storage.js';
import { el } from './ui.js';
import { stamp, payGame, potWon, gameWon, canPay, earnTickets, best, tickets } from './corner-pot.js';

function today() {
  const b = getSave().corner?.bets, day = safariDay();
  return b?.day === day ? b : { day, plays: {} };
}
const write = (b) => updateSave(d => { d.corner = { ...d.corner, bets: b }; });

/** Plays of `game` left today that pay. */
export const playsLeft = (game) => Math.max(0, PLAYS[game] - (today().plays[game] ?? 0));
/** Would `game`'s next play pay? */
export const paysNow = (game) => playsLeft(game) > 0 && canPay(game);

/** A new play of `game`: { day, n } (its seed) and whether it pays (`paid`); past that it's for fun. */
export function stake(game) {
  const b = today(), n = b.plays[game] ?? 0, paid = paysNow(game);
  write({ ...b, plays: { ...b.plays, [game]: n + 1 } });
  stamp(game);
  return { day: b.day, n, paid };
}

/** A free extra play of `game` (a bonus round's spin): its seed, using up no play. */
export function freePlay(game) {
  const b = today(), n = (b.plays[`${game}Bonus`] ?? 0);
  write({ ...b, plays: { ...b.plays, [`${game}Bonus`]: n + 1 } });
  return { day: b.day, n: 1000 + n };
}

/** Pays a play's win: what the chips won as coins if the play pays (up to the caps), else as prize tickets.
    Returns { coins, tickets, chips }. */
export function settle(amount, game, paid) {
  const chips = Math.floor(amount);
  if (chips <= 0) return { coins: 0, tickets: 0, chips: 0 };
  if (paid) return { coins: payGame(chips, game), tickets: 0, chips };
  return { coins: 0, tickets: NO_TICKETS.has(game) ? 0 : earnTickets(ticketsFor(chips)), chips, fun: NO_TICKETS.has(game) };
}

/** What a settled win paid, in words: "40 PokéCoins", "3 tickets", or the chips when today's tickets are used up. */
export function wonText(r, paid) {
  if (paid) return `${r.coins} PokéCoins${r.coins < r.chips ? ' (all today allows)' : ''}`;
  if (r.fun) return 'just for fun';
  return r.tickets ? `${r.tickets} prize ticket${r.tickets > 1 ? 's' : ''}` : 'no tickets (today\'s are used up)';
}

/** A game's Best line: its records as "Best streak 6 · Jackpots 1" (nothing before the first). */
export function bestLine(keys) {
  const parts = keys.filter(k => best(k) > 0).map(k => `${RECORDS[k]} ${k === 'plinko' ? `×${best(k)}` : best(k).toLocaleString()}`);
  return parts.length ? el('p', 'cg-best', `🏆 ${parts.join(' · ')}`) : el('span', '');
}

/** A game's saved hand in progress (`save.corner.bets[game + 'Hand']`), only if it's today's. */
export const handOf = (game) => { const b = today(), h = b[`${game}Hand`]; return h?.day === b.day ? h : null; };
export const keepHand = (game, hand) => write({ ...today(), [`${game}Hand`]: hand });

/** The meters every table shows: plays left that pay and today's coins against the cap (no chips meter since 2026-10-12,
    the user's call: a fixed stake told the player nothing).
    `held` is won but not yet shown (a Plinko ball still falling), kept off the meters till it lands. */
export function tableMeters(game, held = { coins: 0, tickets: 0 }) {
  const m = el('div', 'vf-meters');
  const left = playsLeft(game);
  for (const [k, v] of [paysNow(game) || NO_TICKETS.has(game) ? ['Plays', `${left}/${PLAYS[game]}`] : ['Tickets', `🎟️${tickets().have - held.tickets}`], ['Today', `${potWon() - held.coins}/${DAILY_CAP}`]]) {
    const box = el('div', 'vf-meter'); box.append(el('span', '', k), el('b', '', v)); m.append(box);
  }
  return m;
}

/** Why `game` plays for fun now, in Meowth's words. */
export function funLine(game) {
  if (NO_TICKETS.has(game)) return 'Your paying drops are done for today. Drop on for fun, meow! New drops tomorrow.';
  if (potWon() >= DAILY_CAP) return `That's ${DAILY_CAP} PokéCoins today, the most the Game Corner pays! Play on for prize tickets, meow. New coins tomorrow.`;
  if (gameWon(game) >= GAME_CAP) return `This game's paid its ${GAME_CAP} for today. Try another for coins, or play on for prize tickets, meow!`;
  return 'Your paying plays here are done for today. Play on and wins earn prize tickets for my prize counter, meow! New plays tomorrow.';
}

/** A play key's label: "Spin (3 left)" while plays pay, "Spin for tickets" after. */
export const playLabel = (game, word) => (paysNow(game) ? `${word} (${playsLeft(game)} left)` : NO_TICKETS.has(game) ? `${word} for fun` : `${word} for tickets`);

/** A table's words: `line`, and once its plays stop paying, why (not mid-play, `busy`). */
export const sayLine = (game, line, busy = false) => (busy || paysNow(game) ? line : `${line} ${funLine(game)}`);
