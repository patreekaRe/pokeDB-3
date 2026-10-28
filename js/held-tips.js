/* held-tips.js  -  the first-time words (2026-10-16, the user's ask), each once a save: `save.workshop.told[key]`:
   'held' Kurt on the first held berry made (js/workshop.js), 'eaten' the battle's tip on the first one eaten
   (js/battle.js), 'pouch' the map's note on the first biome a pouch berry can go on (js/run.js), 'kit' Kurt on the first
   run kit item made (js/workshop.js), 'tree' Professor Oak on the first berry a Berry Tree gives (js/run.js), 'gift' Kurt
   on the first gift made (js/workshop.js) and 'meet-<friend>' each friend's hello at home (js/run.js; js/data/workshop.js's
   GIFT_TOLD and meetKey()), and 'ball-look' Kurt in the Clearing on the Apricorn ball sent out in every battle
   (js/hub-3d.js's ballNews(), 2026-10-27). Under `?satchel` they play once a page load and nothing is saved. */

import { getSave, updateSave } from './storage.js';
import { workshopOf, withTold } from './data/workshop.js';
import { satchelFlag } from './data/satchel.js';

const lent = new Set();

/** Whether a tip has been shown already. */
export const toldHeld = (key) => !!workshopOf(getSave()).told?.[key] || lent.has(key);

/** Mark a tip shown, as it shows (`keep` false: a playtest's, for the page load only). */
export function tellHeld(key, keep = true) {
  lent.add(key);
  if (keep && !satchelFlag()) updateSave(d => { d.workshop = withTold(workshopOf(d), key); });
}
