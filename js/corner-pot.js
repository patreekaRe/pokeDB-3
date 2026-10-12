/* corner-pot.js  -  the Game Corner games' shared pot: what they've paid today, all told and by game, capped at
   DAILY_CAP and GAME_CAP a UTC day (js/data/corner.js), kept in `save.corner.pot` ({ day, won, games }). */

import { capPay } from './data/corner.js';
import { safariDay } from './data/safari.js';
import { getSave, updateSave } from './storage.js';
import { refreshCoins } from './ui.js';

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
  return paid;
}

/** Meowth's stamp card: a stamp for each different game played today; STAMPS of them earn the day's scratch card. */
export const STAMPS = 5;
export function stamps() {
  const s = getSave().corner?.stamps;
  return s?.day === safariDay() ? s.games : [];
}
export function stamp(game) {
  const have = stamps();
  if (have.includes(game)) return;
  updateSave(d => { d.corner = { ...d.corner, stamps: { day: safariDay(), games: [...have, game] } }; });
}
