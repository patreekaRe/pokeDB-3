/* prizes.js  -  Meowth's prize counter (2026-10-12, the user's ask): a tap on Meowth, once the day's scratch card is had
   or still being earned, opens it. PokéCoins (prize tickets until they were taken out the same day, the user's call)
   buy PRIZES (js/data/corner.js): Game Corner furniture and Gen 1's prize dolls, which go to the Secret Base's
   storage like any piece (js/data/furniture.js counts them owned). Since 2026-10-12 (the user's ask: like the showcases) it is a
   showcase row (js/showcase.js): one prize on the screen, ◀ / ▶, Buy twice. */

import { PRIZES } from './data/corner.js';
import { getSave } from './storage.js';
import { playSound } from './audio.js';
import { el } from './ui.js';
import { openShowcase, showcaseSource } from './showcase.js';
import { buyPrize, cashTickets } from './corner-pot.js';
import { homeGame } from './home-arcade.js';

const owned = (kind) => (getSave().corner?.prizes || []).includes(kind) || (getSave().secretBase?.owned?.[kind] || 0) > 0;
const pics = new Map();

/** Opens the counter; `stamps` is Meowth's word on today's stamp card. */
export async function openPrizes(onClose, stamps = '') {
  const { PIECES } = await import('./base-furniture.js');
  showcaseSource('prizes', {
    entries: () => PRIZES.map(p => ({
      kind: p.kind, name: PIECES[p.kind]?.name ?? p.kind, cost: p.coins, done: owned(p.kind) ? 'Owned' : null,
      text: homeGame(p.kind) ? 'A game for your Secret Base: place it, then tap it there to play as much as you like.' : 'For your Secret Base. You can\'t buy it anywhere else, meow!',
      art: () => art(PIECES, p.kind),
    })),
    buy: (e) => {
      if (!buyPrize(e.cost, e.kind)) { playSound('cancel'); return [`You need ${e.cost - getSave().coins} more PokéCoins for that one, meow.`]; }
      playSound('achievement');
      return [`Here you go: the ${e.name.toLowerCase()}! It's in your Secret Base's storage, meow.`];
    },
  });
  const cashed = cashTickets();
  const say = cashed ? `Tickets are out, coins are in! I swapped your old tickets for ${cashed.toLocaleString()} PokéCoins, meow.` : stamps;
  const start = Math.max(0, PRIZES.findIndex(p => !owned(p.kind)));
  openShowcase('prizes', start, { close: onClose, say: say || null });
}

/** A prize's painting, cut to what's painted, as a canvas for the showcase screen. */
function art(PIECES, kind) {
  if (!pics.has(kind)) {
    try {
      const src = PIECES[kind].art(0, 4), { width: w, height: h } = src;
      const px = src.getContext('2d').getImageData(0, 0, w, h).data;
      let x0 = w, y0 = h, x1 = -1, y1 = -1;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (px[(y * w + x) * 4 + 3] > 8) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      const c = document.createElement('canvas');
      if (x1 >= 0) { c.width = x1 - x0 + 1; c.height = y1 - y0 + 1; c.getContext('2d').drawImage(src, x0, y0, c.width, c.height, 0, 0, c.width, c.height); }
      pics.set(kind, c);
    } catch { pics.set(kind, document.createElement('canvas')); }
  }
  const src = pics.get(kind), c = el('canvas', 'sc-art sc-piece');
  c.width = src.width || 1; c.height = src.height || 1;
  c.getContext('2d').drawImage(src, 0, 0);
  return c;
}
