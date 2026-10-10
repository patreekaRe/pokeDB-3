/* ============================================================
   pc-news.js  -  which of the Clearing PC's pages are new to this device (2026-10-10, the user's ask: House Upgrades
   and Duplicate landed with no "!", so nobody found them). A page here wears the gold "!" (and the PC in the hub its
   "!" too) until it's opened once. A new PC page gets a line in NEWS; its menu row then follows by itself.
   ============================================================ */

const SEEN_KEY = 'pokedb.pcSeen';   // per device, like the patch notes' "!"

const hasBase = (save) => !!(save.baseOwned || save.secretBase);

/** Each new page: the menu it sits in, and whether it's any use yet (a base page waits for a base). */
const NEWS = {
  prof: { in: 'home', ready: () => true },
  house: { in: 'home', ready: hasBase },
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
