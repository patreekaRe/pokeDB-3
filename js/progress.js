/* ============================================================
   progress.js  -  what is unlocked, based on your total wins.
   ============================================================ */

import { getSave } from './storage.js';
import { ALL_CARDS } from './data/cards.js';
import { STARTERS } from './data/starters.js';

export const isCardUnlocked    = (card)    => getSave().wins >= (card.unlockAt || 0);
export const isStarterUnlocked = (starter) => getSave().wins >= starter.unlockAt;

/**
 * Everything that became unlocked when going from `before` wins to `after` wins.
 * Used to show "New unlocks!" after a victory.
 */
export function newUnlocks(before, after) {
  const crossed = (needed) => needed > before && needed <= after;
  return [
    ...STARTERS.filter(s => crossed(s.unlockAt)).map(s => `Starter: ${s.name}`),
    ...ALL_CARDS.filter(c => crossed(c.unlockAt || 0)).map(c => `Card: ${c.name}`),
  ];
}
