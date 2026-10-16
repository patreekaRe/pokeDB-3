/* held-tips.js  -  the held berries' three first-time words (2026-10-16, the user's ask), each once a save:
   `save.workshop.told[key]`: 'held' Kurt on the first held berry made (js/workshop.js), 'eaten' the battle's tip on the
   first one eaten (js/battle.js), 'pouch' the map's note on the first biome a pouch berry can go on (js/run.js), 'kit'
   Kurt on the first run kit item made (js/workshop.js).
   Under `?satchel` they play once a page load and nothing is saved. */

import { getSave, updateSave } from './storage.js';
import { workshopOf } from './data/workshop.js';
import { satchelFlag } from './data/satchel.js';

const lent = new Set();

/** Whether a tip has been shown already. */
export const toldHeld = (key) => !!workshopOf(getSave()).told?.[key] || lent.has(key);

/** Mark a tip shown, as it shows. */
export function tellHeld(key) {
  lent.add(key);
  if (!satchelFlag()) updateSave(d => { const ws = workshopOf(d); d.workshop = { ...ws, told: { ...ws.told, [key]: true } }; });
}
