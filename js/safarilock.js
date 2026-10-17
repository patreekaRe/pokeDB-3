// The Safari Zone's locked door (the user's ask, 2026-10-17): a tap on it pops a window with a bar per biome, how many of
// its Pokémon you've beaten, so you can see how far you are from opening it.
import { $, el, openDialog } from './ui.js';
import { getSave } from './storage.js';
import { playSound } from './audio.js';
import { safariUnlockPages } from './data/pokedex.js';

export function showSafariLock() {
  const pages = safariUnlockPages(getSave());
  const n = pages.reduce((a, p) => a + p.n, 0), total = pages.reduce((a, p) => a + p.total, 0);
  $('sl-total').textContent = `${n}/${total}`;
  $('sl-bars').replaceChildren(...pages.map(p => {
    const row = el('li', `sl-row${p.n === p.total ? ' done' : ''}`);
    const head = el('div', 'sl-head');
    head.append(el('span', 'sl-name', p.name), el('span', 'sl-count', p.n === p.total ? '✓ Done' : `${p.n}/${p.total}`));
    const bar = el('div', 'sl-bar'), fill = el('i', 'sl-fill');
    fill.style.width = `${Math.round((p.n / p.total) * 100)}%`;
    bar.append(fill);
    bar.setAttribute('role', 'progressbar');
    bar.setAttribute('aria-valuemin', '0');
    bar.setAttribute('aria-valuemax', String(p.total));
    bar.setAttribute('aria-valuenow', String(p.n));
    bar.setAttribute('aria-label', p.name);
    row.append(head, bar);
    return row;
  }));
  playSound('cancel');
  openDialog('safari-lock-dialog');
}
