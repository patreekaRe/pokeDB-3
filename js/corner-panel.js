/* corner-panel.js  -  the frame every Game Corner game and showcase opens in: a panel over whatever is showing, shut by
   Escape, a tap outside it or its own Close, with `busy()` holding it open mid-animation. */

import { playSound } from './audio.js';
import { el, refreshCoins } from './ui.js';

export function openPanel(cls, label, { onClose, busy = () => false, outside = false } = {}) {
  document.querySelector('.cg-overlay')?.remove();
  const root = el('div', `cg-overlay ${cls}`);
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', label);
  const onKey = (e) => { if (e.key === 'Escape' && !busy()) { e.stopPropagation(); shut(); } };
  function shut() {
    playSound('cancel', 'confirm');
    document.removeEventListener('keydown', onKey, true);
    root.remove();
    refreshCoins();
    onClose?.();
  }
  // a game never closes on a tap outside it (the user's call, 2026-10-12: a stray tap lost a game); only a browsing window does
  if (outside) root.addEventListener('pointerdown', (e) => { if (e.target === root && !busy()) shut(); });
  document.addEventListener('keydown', onKey, true);
  document.body.append(root);
  return { root, shut };
}

/** A round pill key (the games' Buy / Next / Close). */
export function key(text, cls, fn) {
  const b = el('button', `vf-key ${cls}`, text);
  b.type = 'button';
  b.addEventListener('click', fn);
  return b;
}

/** Every Pokémon with a Gen 5 sprite in the game (the wilds, Alphas and bosses), once each: [id, name]. */
export async function monPool() {
  const { ENEMY_DEFS } = await import('./data/enemies.js');
  const seen = new Map();
  for (const d of Object.values(ENEMY_DEFS)) {
    if (d.spriteId && d.image === `assets/pokemon/${d.spriteId}-front.gif` && !seen.has(d.spriteId)) seen.set(d.spriteId, d.name.replace(/^Alpha /, ''));
  }
  return seen;
}

export const spriteOf = (id) => `assets/pokemon/${id}-front.gif`;

/** Has this device seen a game's How to play yet? The first open shows it by itself; the "?" brings it back. */
export function firstLook(game) {
  try {
    const seen = JSON.parse(localStorage.getItem('pokedb.cornerHelp') || '{}');
    if (seen[game]) return false;
    localStorage.setItem('pokedb.cornerHelp', JSON.stringify({ ...seen, [game]: 1 }));
    return true;
  } catch { return false; }
}

/** The "?" in a game's head, lit while its How to play is open. */
export function helpKey(on, fn) {
  const b = el('button', `cg-help-key${on ? ' on' : ''}`, '?');
  b.type = 'button';
  b.setAttribute('aria-label', 'How to play');
  b.addEventListener('click', () => { playSound('select'); fn(); });
  return b;
}

/** A How to play card: an optional picture, then numbered steps, each [bold lead, the rest], and a Got it key. */
export function helpCard(steps, { picture = null, done } = {}) {
  const card = el('div', 'cg-help');
  card.append(el('strong', 'cg-help-title', 'HOW TO PLAY'));
  if (picture) card.append(picture);
  const list = el('ol', 'cg-help-steps');
  for (const [lead, rest] of steps) { const li = el('li'); li.append(el('b', '', lead), ` ${rest}`); list.append(li); }
  card.append(list, key('Got it!', 'vf-go', () => { playSound('confirm'); done(); }));
  return card;
}
