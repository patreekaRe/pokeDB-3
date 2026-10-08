/* ============================================================
   patchnotes.js  -  the title's version tag (#title-version) and
   the Patch notes window it opens: what's new in each patch, then
   what's in the game. The words live in js/data/patchnotes.js.
   ============================================================ */

import { PATCHES, IN_THE_GAME } from './data/patchnotes.js';
import { $, el, openDialog } from './ui.js';

const [latest] = PATCHES;
const SEEN_KEY = 'pokedb.patchSeen';   // a per-device nicety (the tag stops beckoning), so not in the save or the cloud

const seenNow = () => { try { return localStorage.getItem(SEEN_KEY) === latest.version; } catch { return true; } };

function markSeen() {
  try { localStorage.setItem(SEEN_KEY, latest.version); } catch {}
  $('title-version').classList.add('seen');
  $('title-version').textContent = `v${latest.version}`;
}

export function initPatchNotes() {
  const seen = seenNow();
  $('title-version').textContent = seen ? `v${latest.version}` : `v${latest.version}`;
  $('title-version').addEventListener('click', openPatchNotes);
  $('title-version').classList.toggle('seen', seen);
}


const label = (text) => el('h3', 'records-label', text);

function patch(p) {
  const node = el('section', 'patch');
  node.append(el('h3', 'patch-title', `v${p.version}: ${p.name}`), el('p', 'patch-date', p.date));
  for (const [icon, heading, lines] of p.sections) {
    const list = el('ul', 'patch-list');
    list.append(...lines.map(line => el('li', '', line)));
    node.append(el('h4', 'patch-head', `${icon} ${heading}`), list);
  }
  return node;
}

function contents() {
  const list = el('div', 'patch-game');
  list.append(...IN_THE_GAME.map(([icon, what, text]) => {
    const row = el('div', 'patch-row');
    const words = el('span', 'patch-row-text');
    words.append(el('b', '', what), el('span', '', text));
    row.append(el('span', 'patch-row-icon', icon), words);
    return row;
  }));
  return list;
}

export function openPatchNotes() {
  $('patch-body').replaceChildren(
    patch(latest),
    label('In the game'), contents(),
    ...(PATCHES.length > 1 ? [label('Earlier patches'), ...PATCHES.slice(1).map(patch)] : []),
  );
  $('patch-dialog').querySelector('h2').textContent = seenNow() ? '📖 Patch notes' : `✨ New in v${latest.version}!`;
  openDialog('patch-dialog');
  markSeen();
  $('patch-body').scrollTop = 0;
}
