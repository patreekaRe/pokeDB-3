/* prizes.js  -  Meowth's prize counter (2026-10-12, the user's ask): a tap on Meowth, once the day's scratch card is had
   or still being earned, opens it. PokéCoins (prize tickets until they were taken out the same day, the user's call)
   buy PRIZES (js/data/corner.js): Game Corner furniture and Gen 1's prize dolls, which go to the Secret Base's
   storage like any piece (js/data/furniture.js counts them owned). A tap picks a prize and says what it is, a second
   swaps for it, Gen 1's way. */

import { PRIZES } from './data/corner.js';
import { getSave } from './storage.js';
import { playSound, preloadSounds } from './audio.js';
import { el } from './ui.js';
import { openPanel, key } from './corner-panel.js';
import { buyPrize, cashTickets } from './corner-pot.js';

let panel = null, picked = null, line = '', stampLine = '';

const owned = (kind) => (getSave().corner?.prizes || []).includes(kind) || (getSave().secretBase?.owned?.[kind] || 0) > 0;

/** Opens the counter; `stamps` is Meowth's word on today's stamp card. */
export async function openPrizes(onClose, stamps = '') {
  preloadSounds('select', 'buy', 'cancel', 'achievement');
  const { PIECES } = await import('./base-furniture.js');
  stampLine = stamps;
  picked = null;
  const cashed = cashTickets();
  line = cashed ? `Tickets are out, coins are in! I swapped your old tickets for ${cashed.toLocaleString()} PokéCoins, meow.`
    : 'Things you can\'t buy anywhere else, for PokéCoins. Tap a prize to see it, tap again to buy, meow!';
  panel = openPanel('pz', 'Prize counter', { onClose });
  render(PIECES);
}

function art(PIECES, kind) {
  const box = el('span', 'pz-art');
  try {   // the piece paints on an OffscreenCanvas with headroom: copied onto a page canvas cut to what's painted
    const src = PIECES[kind].art(0, 2), { width: w, height: h } = src;
    const px = src.getContext('2d').getImageData(0, 0, w, h).data;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (px[(y * w + x) * 4 + 3] > 8) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    if (x1 < 0) return box;
    const c = el('canvas', 'pz-pic');
    c.width = x1 - x0 + 1; c.height = y1 - y0 + 1;
    c.getContext('2d').drawImage(src, x0, y0, c.width, c.height, 0, 0, c.width, c.height);
    box.append(c);
  } catch (err) { /* a piece that can't paint shows its name only */ }
  return box;
}

function render(PIECES) {
  const have = getSave().coins;
  const head = el('div', 'vf-head');
  head.append(el('strong', 'vf-title', 'PRIZE COUNTER'), el('span', 'vf-lv', 'For PokéCoins'));
  const meters = el('div', 'vf-meters');
  for (const [k, v] of [['Coins', have.toLocaleString()], ['Prizes', `${PRIZES.filter(p => owned(p.kind)).length}/${PRIZES.length}`]]) {
    const m = el('div', 'vf-meter'); m.append(el('span', '', k), el('b', '', v)); meters.append(m);
  }
  const grid = el('div', 'pz-grid');
  for (const p of PRIZES) {
    const piece = PIECES[p.kind], got = owned(p.kind);
    const tile = el('button', `pz-tile${got ? ' got' : ''}${picked === p.kind ? ' on' : ''}${!got && have < p.coins ? ' short' : ''}`);
    tile.type = 'button';
    tile.append(art(PIECES, p.kind), el('b', 'pz-name', piece?.name ?? p.kind), el('span', 'pz-cost', got ? 'Got it!' : `${p.coins} coins`));
    tile.addEventListener('click', () => tap(PIECES, p));
    grid.append(tile);
  }
  const box = el('div', 'vf-panel pz-panel');
  box.append(head, meters);
  if (stampLine) box.append(el('p', 'pz-stamps', stampLine));
  box.append(grid, el('p', 'vf-say', line));
  const keys = el('div', 'vf-keys');
  keys.append(key('Close', 'vf-close', () => panel.shut()));
  box.append(keys);
  panel.root.replaceChildren(box);
}

function tap(PIECES, p) {
  const name = PIECES[p.kind]?.name ?? p.kind, have = getSave().coins;
  if (owned(p.kind)) { picked = p.kind; line = `The ${name.toLowerCase()} is already yours: it's in your Secret Base's storage, meow.`; playSound('select'); return render(PIECES); }
  if (picked !== p.kind) {
    picked = p.kind;
    line = have >= p.coins ? `The ${name.toLowerCase()}, ${p.coins} PokéCoins. Tap it again to buy, meow!` : `The ${name.toLowerCase()}: ${p.coins} PokéCoins. You need ${p.coins - have} more, meow.`;
    playSound('select');
    return render(PIECES);
  }
  if (!buyPrize(p.coins, p.kind)) { playSound('cancel'); line = `You need ${p.coins - have} more PokéCoins for that one, meow.`; return render(PIECES); }
  playSound('achievement', 'buy');
  line = `Here you go: the ${name.toLowerCase()}! It's waiting in your Secret Base's storage, meow.`;
  render(PIECES);
}
