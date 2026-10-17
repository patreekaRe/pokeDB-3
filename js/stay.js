/* The refresh key (the user's ask, 2026-10-17): a round key top right in the places you walk (the Clearing, the Secret
   Base, the Poké Mall, a town or a house in one, a run's map) that fetches the newest version and puts you back where you
   stood. Where you stood rides the tab's sessionStorage and is read once on the next load (main.js's stayBack()), so a
   plain browser refresh still opens on the title, and a note left by a refresh that never finished goes stale. */
import { roundKey } from './smooth-icons.js';

const KEY = 'pokedb.stay.v1', FRESH_MS = 60000;

/**
 * A plain reload can keep showing the old game for up to 10 minutes after a push, since the browser keeps its files
 * (GitHub Pages caches them that long), so every file this page loaded is fetched again past the cache first, and then
 * the page reloads onto them. The save is in localStorage, untouched.
 */
export async function reloadFresh() {
  const files = performance.getEntriesByType('resource').map(r => r.name)
    .filter(url => url.startsWith(location.origin) && /\.(js|css)(\?|$)/.test(url));   // the code and styles: art and sound rarely change
  await Promise.all([location.href, ...files].map(url => fetch(url, { cache: 'reload' }).catch(() => null)));
  location.reload();
}

/** The key. `spot()` says where you stand ({ at: 'hub' | 'base' | 'mall' | 'visit' | 'run', ... }); null reloads onto the title. */
export function stayKey(spot, glyph = 'round-key') {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'stay-key';
  b.title = 'Refresh for the newest version, right where you are';
  b.setAttribute('aria-label', 'Refresh for the newest version');
  b.append(roundKey('refresh', glyph));
  b.addEventListener('click', (e) => {
    e.stopPropagation();
    if (b.classList.contains('spinning')) return;
    b.classList.add('spinning');
    try {
      const at = spot();
      if (at) sessionStorage.setItem(KEY, JSON.stringify({ ...at, t: Date.now() }));
    } catch { /* no sessionStorage: a plain refresh onto the title */ }
    reloadFresh();
  });
  return b;
}

/** Where the refresh key left you, once (the note goes as it's read), or null. */
export function takeStay() {
  try {
    const at = JSON.parse(sessionStorage.getItem(KEY));
    sessionStorage.removeItem(KEY);
    const age = Date.now() - (at?.t ?? 0);
    return at && age >= 0 && age < FRESH_MS ? at : null;
  } catch { return null; }
}
