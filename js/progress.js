/* ============================================================
   progress.js  -  which starters are unlocked, and checking whether
   you just earned a new one.
   ============================================================ */

import { getSave, updateSave } from './storage.js';
import { ACHIEVEMENTS } from './data/achievements.js';
import { STARTERS_BY_ID } from './data/starters.js';
import { ACHIEVEMENT_FOR } from './data/achievements.js';

/** The three real characters are always unlocked. Every skin needs an achievement or a shop purchase. */
export function isStarterUnlocked(starter) {
  return !!starter.free || getSave().unlocked.includes(starter.id);
}

/** True if a locked starter can be bought in the shop rather than earned. */
export function isShopUnlock(starter) {
  return !starter.free && !ACHIEVEMENT_FOR[starter.id];
}

/**
 * Look at your stats and unlock any starters you have earned.
 * Returns the list of starters that were newly unlocked.
 */
export function checkAchievements() {
  const save = getSave();
  const earned = [];
  // One at a time, so a later goal (Mewtwo's "unlock everything") sees what the earlier ones just unlocked.
  for (const a of ACHIEVEMENTS) {
    if (save.unlocked.includes(a.starter) || !a.test(save.stats, save)) continue;
    updateSave(d => { d.unlocked.push(a.starter); });
    earned.push(STARTERS_BY_ID[a.starter]);
  }
  return earned;
}
