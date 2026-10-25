/* ============================================================
   pc-news.js  -  which of the Clearing PC's pages are new to this device (2026-10-10, the user's ask: House Upgrades
   and Duplicate landed with no "!", so nobody found them). A page here wears the gold "!" (and the PC in the hub its
   "!" too) until it's opened once. A new PC page gets a line in NEWS; its menu row then follows by itself.
   ============================================================ */

import { journalReady } from './data/journal.js';
import { latestPatch, patchUnseen } from './patchnotes.js';
import { claimable } from './missions.js';

const SEEN_KEY = 'pokedb.pcSeen';   // per device, like the patch notes' "!"
const LOOKED_KEY = 'pokedb.pcLooked';   // the news the hub's "!" over the PC last showed when you logged on

const hasBase = (save) => !!(save.baseOwned || save.secretBase?.v >= 2);   // a `secretBase` of only `mons` is the first catches moved in before the base is bought

/** Each new page: the menu it sits in, and whether it's any use yet (a base page waits for a base). */
const NEWS = {
  prof: { in: 'home', ready: () => true },
  missions: { in: 'home', ready: () => true },
  house: { in: 'home', ready: hasBase },
  yard: { in: 'house', ready: hasBase },   // the backyard's plot on House Upgrades' blueprint (2026-10-14)
  decor: { in: 'mine', ready: hasBase },
  dupe: { in: 'mine', ready: hasBase },
};

function seen() {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')); } catch { return new Set(); }
}

/** True while the page `id` (or, for a menu, any new page inside it) hasn't been opened on this device. */
export function pcNew(id, save) {
  const done = seen();
  const fresh = (k) => NEWS[k] && !done.has(k) && NEWS[k].ready(save);
  return fresh(id) || Object.keys(NEWS).some(k => NEWS[k].in === id && fresh(k));
}

export const anyPcNew = (save) => Object.keys(NEWS).some(k => pcNew(k, save));

export function markPcSeen(id) {
  if (!NEWS[id]) return;
  const done = seen();
  if (done.has(id)) return;
  done.add(id);
  try { localStorage.setItem(SEEN_KEY, JSON.stringify([...done])); } catch {}
}

/** Everything new on the PC right now, as one key: the hub's "!" asks for a log on, not for every page read. */
function newsNow(save) {
  return [...(patchUnseen() ? [`patch:${latestPatch.version}`] : []), ...Object.keys(NEWS).filter(k => pcNew(k, save))].join(',');
}

/** The "!" over the Clearing's PC: something new it hasn't shown you yet (2026-10-10, the user's ask: it stayed up
    forever while a page inside was unread, and inside nothing said which). */
export function pcBeckons(save) {
  if (claimable(save)) return true;   // a mission reward waits, like the mail's envelope, till it's claimed
  if (journalReady(save).length) return true;   // and a Trainer's Journal task (js/data/journal.js)
  const now = newsNow(save);
  try { return !!now && localStorage.getItem(LOOKED_KEY) !== now; } catch { return false; }
}

export function pcLookedAt(save) {
  try { localStorage.setItem(LOOKED_KEY, newsNow(save)); } catch {}
}
