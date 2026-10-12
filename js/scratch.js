/* scratch.js  -  Meowth's scratch card (2026-10-11, the user's pick): earned each UTC day by filling Meowth's stamp card
   (a stamp for each different game played, js/corner-pot.js), handed over at the prize counter, nine
   foil spots to scratch (a tap, or a finger dragged across), three of a kind somewhere under them, and it always pays
   (js/data/casino.js's scratchCard(), the same card for everyone that day), counted in the games' daily cap. What's scratched and whether it's paid are
   saved (`save.corner.scratch`), so a refresh keeps the card. */

import { scratchCard } from './data/casino.js';
import { DAILY_CAP } from './data/corner.js';
import { safariDay } from './data/safari.js';
import { getSave, updateSave } from './storage.js';
import { playSound, preloadSounds } from './audio.js';
import { el } from './ui.js';
import { openPanel, key } from './corner-panel.js';
import { SYMBOL_ART } from './slots.js';
import { stamps, STAMPS, payGame } from './corner-pot.js';

let panel = null, card = null, st = null, down = false;   // down: a finger pressed, scratching what it crosses
addEventListener('pointerup', () => { down = false; });
addEventListener('pointercancel', () => { down = false; });

const today = () => { const s = getSave().corner?.scratch, day = safariDay(); return s?.day === day ? s : { day, open: [], paid: false }; };
const keep = () => updateSave(d => { d.corner = { ...d.corner, scratch: st }; });

/** Is today's card earned (a full stamp card) and still to be scratched? */
export const scratchReady = () => stamps().length >= STAMPS && !today().paid;
/** Meowth's sign over its head: how full today's stamp card is, or the card waiting, or done. */
export function stampState() {
  const n = Math.min(STAMPS, stamps().length), paid = today().paid;
  return { n, of: STAMPS, ready: n >= STAMPS && !paid, paid };
}

export function openScratch(onClose) {
  preloadSounds('select', 'coins', 'achievement');
  st = { ...today(), open: [...today().open] };
  card = scratchCard(st.day);
  panel = openPanel('sc2', "Meowth's scratch card", { onClose });
  render();
}

function symbol(s) {
  const box = el('span', 'sl-sym');
  if (SYMBOL_ART[s]) { const i = el('img', 'pixel'); i.src = SYMBOL_ART[s]; i.alt = s; box.append(i); }
  else box.append(el('b', 'sl-seven', '7'));
  return box;
}

function render() {
  const head = el('div', 'vf-head');
  head.append(el('strong', 'vf-title', 'SCRATCH CARD'), el('span', 'vf-lv', 'Free today'));
  const grid = el('div', 'sx-grid');
  grid.addEventListener('pointerdown', (e) => { down = true; e.target.releasePointerCapture?.(e.pointerId); });
  card.cells.forEach((s, i) => {
    const cell = el('button', `sx-cell${st.open.includes(i) ? ' open' : ''}${st.paid && s === card.symbol ? ' win' : ''}`);
    cell.type = 'button';
    cell.append(symbol(s), el('span', 'sx-foil'));
    cell.addEventListener('click', () => scratch(i));
    cell.addEventListener('pointerenter', () => { if (down) scratch(i); });
    grid.append(cell);
  });
  const won = st.won ?? card.prize, short = won < card.prize ? ` (${won} under today's ${DAILY_CAP} cap)` : '';
  const say = st.paid ? `Three ${card.symbol === 'seven' ? '7s' : `${card.symbol}s`}! ${card.prize} PokéCoins${short}, meow! Come back tomorrow for another.`
    : 'Scratch the spots! Find three of a kind to win what they\'re worth.';
  const keys = el('div', 'vf-keys');
  if (!st.paid) keys.append(key('Scratch all', 'vf-go', () => { card.cells.forEach((_, i) => scratch(i, true)); render(); }));
  keys.append(key('Close', 'vf-close', () => panel.shut()));
  const box = el('div', 'vf-panel sx-panel');
  box.append(head, grid, el('p', 'vf-say', say), keys);
  panel.root.replaceChildren(box);
}

function scratch(i, quiet = false) {
  if (st.open.includes(i)) return;
  st.open.push(i);
  if (!quiet) playSound('select');
  const found = card.cells.filter((s, k) => s === card.symbol && st.open.includes(k)).length;
  if (!st.paid && (found >= 3 || st.open.length === 9)) {
    st.paid = true;
    st.open = card.cells.map((_, k) => k);
    st.won = payGame(card.prize, 'scratch');
    setTimeout(() => playSound(card.prize >= 200 ? 'achievement' : 'coins', 'buy'), 150);
  }
  keep();
  if (!quiet) render();
}
