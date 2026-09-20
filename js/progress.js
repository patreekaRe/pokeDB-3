/* ============================================================
   progress.js  -  which starters are unlocked, and checking whether
   you just earned a new one.
   ============================================================ */

import { getSave, updateSave } from './storage.js';
import { ACHIEVEMENTS } from './data/achievements.js';
import { STARTERS_BY_ID } from './data/starters.js';
import { ACHIEVEMENT_FOR } from './data/achievements.js';

/** The three Kanto starters have no achievement, so they're always unlocked. */
export function isStarterUnlocked(starter) {
  return !ACHIEVEMENT_FOR[starter.id] || getSave().unlocked.includes(starter.id);
}

/**
 * Look at your stats and unlock any starters you have earned.
 * Returns the list of starters that were newly unlocked.
 */
export function checkAchievements() {
  const save = getSave();
  const earned = ACHIEVEMENTS.filter(a => !save.unlocked.includes(a.starter) && a.test(save.stats));
  if (earned.length) {
    updateSave(d => { d.unlocked.push(...earned.map(a => a.starter)); });
  }
  return earned.map(a => STARTERS_BY_ID[a.starter]);
}
