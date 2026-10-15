/* satchel.js  -  the save's side of the Satchel (its things: js/data/satchel.js; the app: js/satcheldex.js). What goes
   in stays across runs, a lost one too. */

import { getSave, updateSave } from './storage.js';
import { satchelOf, addMat, addKey } from './data/satchel.js';

/** The Satchel as saved (no `?satchel` loan): what a change is made to. */
const saved = (d) => satchelOf(d, false);

/** Add `n` of a material (take, `n` < 0). */
export const gainMat = (id, n = 1) => updateSave(d => { d.satchel = addMat(saved(d), id, n); });

/** Put a key item in the Satchel. */
export const gainKey = (id) => updateSave(d => { d.satchel = addKey(saved(d), id); });

/** The Satchel app has shown these: their "!" goes. */
export function clearSatchelNews(ids) {
  const gone = new Set(ids), sat = saved(getSave());
  if (!sat.fresh.some(id => gone.has(id))) return;
  updateSave(d => { d.satchel = { ...saved(d), fresh: saved(d).fresh.filter(id => !gone.has(id)) }; });
}

/** Whether anything in the Satchel is new (the device's "!"); a questline just opened (`q:<town>`) is the Quests app's. */
export const satchelNews = (save = getSave()) => saved(save).fresh.some(id => !id.startsWith('q:'));
export const questNews = (save = getSave()) => saved(save).fresh.some(id => id.startsWith('q:'));
