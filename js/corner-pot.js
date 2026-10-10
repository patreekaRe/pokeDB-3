/* corner-pot.js  -  the Game Corner games' shared pot: what they've paid today, capped at GAMES_CAP a UTC day
   (js/data/corner.js), kept in `save.corner.pot`. */

import { capPay } from './data/corner.js';
import { safariDay } from './data/safari.js';
import { getSave, updateSave } from './storage.js';
import { refreshCoins } from './ui.js';

/** The coins the games have paid today. */
export function potWon() {
  const p = getSave().corner?.pot;
  return p?.day === safariDay() ? p.won : 0;
}

/** Pays up to `coins` (what the cap leaves), and returns what was paid. */
export function payGame(coins) {
  const day = safariDay(), won = potWon(), paid = capPay(coins, won);
  if (!paid) return 0;
  updateSave(d => {
    d.corner = { ...d.corner, pot: { day, won: won + paid } };
    d.coins += paid;
    d.stats.coinsEarned += paid;
  });
  refreshCoins();
  return paid;
}
