/* corner-panel.js  -  the frame every Game Corner game and showcase opens in: a panel over whatever is showing, shut by
   Escape, a tap outside it or its own Close, with `busy()` holding it open mid-animation. */

import { playSound } from './audio.js';
import { el, refreshCoins } from './ui.js';

export function openPanel(cls, label, { onClose, busy = () => false } = {}) {
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
  root.addEventListener('pointerdown', (e) => { if (e.target === root && !busy()) shut(); });
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
