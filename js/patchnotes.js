/* ============================================================
   patchnotes.js  -  the patch notes: read on the Clearing's PC (js/pc.js, since 2026-10-10, the user's ask: the hub's
   corner tag went) and, on the Signs title, from the version tag (#title-version) in the Patch notes window. Whether this
   device has read the newest patch drives the tag's glow and the "!" over the Clearing's PC. The words live in
   js/data/patchnotes.js.
   ============================================================ */

import { PATCHES, NEXT, IN_THE_GAME, sectionsOf } from './data/patchnotes.js';
import { $, el, openDialog } from './ui.js';

export const latestPatch = PATCHES[0];
const SEEN_KEY = 'pokedb.patchSeen';   // a per-device nicety (the "!" stops beckoning), so not in the save or the cloud

/** True while this device hasn't opened the newest patch's notes. */
export function patchUnseen() { try { return localStorage.getItem(SEEN_KEY) !== latestPatch.version; } catch { return false; } }

export function markPatchSeen() {
  try { localStorage.setItem(SEEN_KEY, latestPatch.version); } catch {}
  $('title-version')?.classList.add('seen');
}

export function initPatchNotes() {
  $('title-version').textContent = `v${latestPatch.version}`;
  $('title-version').addEventListener('click', openPatchNotes);
  $('title-version').classList.toggle('seen', !patchUnseen());
}

const label = (text) => el('h3', 'records-label', text);

/** One patch's notes, its heading and a list under each group. `since` is the unreleased lines' version instead. */
export function patchNode(p, { icons = true } = {}) {
  const node = el('section', 'patch');
  node.append(el('h3', 'patch-title', p.since ? `Since v${p.since}` : `v${p.version}: ${p.name}`));
  if (p.date) node.append(el('p', 'patch-date', p.date));
  for (const [icon, heading, lines] of sectionsOf(p)) {
    const list = el('ul', 'patch-list');
    list.append(...lines.map(line => el('li', '', line)));
    node.append(el('h4', 'patch-head', icons ? `${icon} ${heading}` : heading), list);
  }
  return node;
}

/** The small changes shipped since the newest patch, shaped like one, or null. */
export const sincePatch = () => (NEXT.length ? { since: latestPatch.version, notes: NEXT } : null);

/** What's in the game, a row each. */
export function inTheGame({ icons = true } = {}) {
  const list = el('div', 'patch-game');
  list.append(...IN_THE_GAME.map(([icon, what, text]) => {
    const row = el('div', 'patch-row');
    const words = el('span', 'patch-row-text');
    words.append(el('b', '', what), el('span', '', text));
    if (icons) row.append(el('span', 'patch-row-icon', icon));
    row.append(words);
    return row;
  }));
  return list;
}

export function openPatchNotes() {
  const since = sincePatch();
  $('patch-body').replaceChildren(
    ...(since ? [patchNode(since)] : []),
    patchNode(latestPatch),
    label('In the game'), inTheGame(),
    ...(PATCHES.length > 1 ? [label('Earlier patches'), ...PATCHES.slice(1).map(p => patchNode(p))] : []),
  );
  $('patch-dialog').querySelector('h2').textContent = patchUnseen() ? `✨ New in v${latestPatch.version}!` : '📖 Patch notes';
  openDialog('patch-dialog');
  markPatchSeen();
  $('patch-body').scrollTop = 0;
}
