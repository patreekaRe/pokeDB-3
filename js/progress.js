/* ============================================================
   progress.js  -  which starters are unlocked, and checking whether
   you just earned a new one.
   ============================================================ */

import { getSave, updateSave } from './storage.js';
import { playSound } from './audio.js';
import { post } from './mail.js';
import { ACHIEVEMENTS, FEATS } from './data/achievements.js';
import { STARTERS_BY_ID } from './data/starters.js';
import { ACHIEVEMENT_FOR } from './data/achievements.js';
import { newBadges } from './data/badges.js';

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
 * Returns the list of starters that were newly unlocked. `sound: false` leaves the jingle to whoever shows them.
 */
export function checkAchievements({ sound = true } = {}) {
  const save = getSave();
  const earned = [];
  // One at a time, so a later goal (Mewtwo's "unlock everything") sees what the earlier ones just unlocked.
  for (const a of ACHIEVEMENTS) {
    if (save.unlocked.includes(a.starter) || !a.test(save.stats, save)) continue;
    updateSave(d => { d.unlocked.push(a.starter); });
    earned.push(STARTERS_BY_ID[a.starter]);
  }
  if (earned.length && sound) playSound('achievement');   // after a fight, unlockWindow() in run.js plays it with its window
  return earned;
}

/** Grant every feat (FEATS) newly earned: its PokéCoins or shiny, saved at once. Returns them, for their windows. */
export function checkFeats() {
  const earned = [];
  for (const f of FEATS) {
    const save = getSave();
    if (save.feats.includes(f.id) || !f.test(save.stats, save)) continue;
    updateSave(d => {
      d.feats.push(f.id);
      if (f.shiny && !d.shiny.owned.includes(f.shiny)) d.shiny.owned.push(f.shiny);
      if (f.shiny && !d.shiny.on.includes(f.shiny)) d.shiny.on.push(f.shiny);
    });
    earned.push({ ...f, feat: true, coinLine: f.coins ? post('depths', f.name, `${f.text}: you did it! Please accept this reward from the deep.`, f.coins) : '' });
  }
  return earned;
}

/** Grant every badge (js/data/badges.js) the save can now prove, quietly: no window, only a line where it was earned.
    Returns them. Also run at load, so an old save gets what it already earned. */
export function checkBadges() {
  const earned = newBadges(getSave());
  if (earned.length) updateSave(d => { d.badges = [...(d.badges || []), ...earned.map(b => b.id)]; });
  return earned;
}
