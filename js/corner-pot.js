/* corner-pot.js  -  the Game Corner games' shared pot: what they've paid today, all told and by game, capped at
   DAILY_CAP and GAME_CAP a UTC day (js/data/corner.js), kept in `save.corner.pot` ({ day, won, games }). */

import { capPay, TICKET_COINS, better } from './data/corner.js';
import { badgeLine } from './data/badges.js';
import { safariDay } from './data/safari.js';
import { getSave, updateSave } from './storage.js';
import { el, refreshCoins } from './ui.js';
import { checkBadges } from './progress.js';
import { playSound } from './audio.js';

/* Home play (2026-10-12, the user's ask: the Game Corner's prizes playable in the Secret Base): while a game is open on a
   machine at home it is free play, never using a paying play, a stamp or the day's saved hand or board. */
let home = false;
export const atHome = () => home;
export const setHome = (on) => { home = !!on; };

const pot = () => { const p = getSave().corner?.pot; return p?.day === safariDay() ? p : { won: 0, games: {} }; };

/** The coins the games have paid today, all told. */
export const potWon = () => pot().won;
/** The coins one game has paid today. */
export const gameWon = (game) => pot().games?.[game] ?? 0;
/** Can `game` still pay today? */
export const canPay = (game) => capPay(1, potWon(), gameWon(game)) > 0;

/** Pays `game`'s win of up to `coins` (what the caps leave), and returns what was paid. */
export function payGame(coins, game) {
  const day = safariDay(), p = pot(), paid = capPay(coins, p.won, p.games?.[game] ?? 0);
  if (!paid) return 0;
  updateSave(d => {
    d.corner = { ...d.corner, pot: { day, won: p.won + paid, games: { ...p.games, [game]: (p.games?.[game] ?? 0) + paid } } };
    d.coins += paid;
    d.stats.coinsEarned += paid;
  });
  refreshCoins();
  record('coins', paid, true);
  return paid;
}

/** Meowth's stamp card: a stamp for each different game played today; STAMPS of them earn the day's scratch card. */
export const STAMPS = 5;
export function stamps() {
  const s = getSave().corner?.stamps;
  return s?.day === safariDay() ? s.games : [];
}
export function stamp(game) {
  if (home) return;
  const have = stamps();
  if (have.includes(game)) return;
  updateSave(d => { d.corner = { ...d.corner, stamps: { day: safariDay(), games: [...have, game] } }; });
}

/* ---------- the prize counter and records (js/data/corner.js) ---------- */

/** Buys a prize for `coins` PokéCoins; false if there aren't enough. */
export function buyPrize(coins, kind) {
  if (getSave().coins < coins) return false;
  updateSave(d => { d.coins -= coins; d.corner = { ...d.corner, prizes: [...(d.corner?.prizes || []), kind] }; });
  refreshCoins();
  badgeNews();
  return true;
}

/** Cashes in a save's old prize tickets (the game gave them for a day); returns the PokéCoins paid, 0 if none. */
export function cashTickets() {
  const have = getSave().corner?.tickets?.have ?? 0;
  if (!have) return 0;
  const coins = have * TICKET_COINS;
  updateSave(d => { d.coins += coins; d.corner = { ...d.corner, tickets: { ...d.corner.tickets, have: 0 } }; });
  refreshCoins();
  return coins;
}

/** Keeps a record (the higher value, or a count added to), then grants any badge it earns. */
export function record(key, value, add = false) {
  updateSave(d => { d.corner = { ...d.corner, best: better(d.corner?.best, key, value, add) }; });
  badgeNews();
}
export const best = (key) => getSave().corner?.best?.[key] ?? 0;

/** A badge just earned pops up over the game for a moment, with the achievement jingle. */
function badgeNews() {
  const earned = checkBadges();
  earned.forEach((b, i) => setTimeout(() => {
    const note = el('div', 'cg-badge', badgeLine(b));
    document.body.append(note);
    playSound('achievement');
    setTimeout(() => note.remove(), 3200);
  }, 400 + i * 1800));
}
