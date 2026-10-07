/* ============================================================
   daypass.js  -  the Safari Zone's Day Pass: today's first try is free,
   replays until the UTC day turns need one pass (DAY_PASS coins).
   ============================================================ */

import { safariDaily } from './data/safari.js';
import { DAY_PASS, safariAccess } from './data/balls.js';
import { getSave, updateSave } from './storage.js';
import { confirmDialog, refreshCoins } from './ui.js';
import { playSound } from './audio.js';

/** Whether today's Safari may start now: the first try and a held pass go straight through; otherwise it offers the
    pass, and resolves true once it's bought. */
export async function safariTicket() {
  const { day } = safariDaily();
  if (safariAccess(getSave().safari, day) !== 'locked') return true;
  const coins = getSave().coins;
  if (coins < DAY_PASS) {
    await confirmDialog(`You've played today's try. A Day Pass for replays costs ${DAY_PASS} coins, and you have ${coins}.`, 'OK');
    return false;
  }
  if (!(await confirmDialog(`Buy a Day Pass for ${DAY_PASS} coins? Replay today's Safari as often as you like until the day ends, each run with its own Safari Balls.`, `Buy (${DAY_PASS})`))) return false;
  updateSave(d => { d.coins -= DAY_PASS; d.safari.pass = day; });
  refreshCoins();
  playSound('buy');
  return true;
}
