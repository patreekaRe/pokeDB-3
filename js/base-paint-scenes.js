/* base-paint-scenes.js  -  furniture details more than one painter shares: a window's view of the sky at this hour (its
   colours exact, so js/base-3d.js can make them glow) and a shelf's row of books. */

import { timeOfDay } from './daytime.js';
import { sh, R, P, disc, oval, hash, clipped } from './base-paint.js';

export const BOOKS = ['#d0485a', '#4a7ac8', '#e0b04a', '#4f9a42', '#8a5ab8', '#e8e4d8'];
export const SKY = { dawn: '#f4b8a0', day: '#8cc8f4', dusk: '#e8885a', night: '#2a3a6a' };

/** The view through a window: the sky now, a cloud or the moon and stars, hills. */
export function view(x, y, w, h) {
  clipped(x, y, w, h, () => paintView(x, y, w, h));
}
function paintView(x, y, w, h) {
  const t = timeOfDay(), sky = SKY[t];
  R(x, y, w, h, sky);
  if (t === 'night') {
    for (let i = 0; i < w * h / 50; i++) P(x + Math.floor(hash(i, w) * w), y + Math.floor(hash(i, h, 2) * h * 0.6), '#e8ecff');
    disc(x + w - 7, y + 6, 3, '#f4f0c8');
  } else {
    oval(x + w * 0.3, y + h * 0.18, Math.min(6, w / 5), 2, '#ffffff'); oval(x + w * 0.3 + 4, y + h * 0.18 - 1, Math.min(4, w / 7), 2, '#ffffff');
  }
  const hill = t === 'night' ? '#1a2a4a' : t === 'dusk' ? '#5a7a48' : '#6cbf58';
  oval(x + w * 0.25, y + h, w * 0.45, h * 0.35, hill); oval(x + w * 0.8, y + h, w * 0.4, h * 0.28, sh(hill, -1));
  R(x, y + h - 1, w, 1, sh(hill, -1));
}

/** A row of books standing on `floor` from x0 to x1, spines lit, tops and bands picked out. */
export function books(x0, x1, floor, seed = 0, tall = 16) {
  let bx = x0;
  for (let i = 0; bx < x1 - 2; i++) {
    const c = BOOKS[(seed + i * 5) % BOOKS.length], bw = Math.min(3 + ((seed + i * 2) % 3), x1 - bx), bh = tall - 4 + ((i * 5 + seed) % 5);
    R(bx, floor - bh, bw, bh, c); R(bx, floor - bh, 1, bh, sh(c, 1)); R(bx + bw - 1, floor - bh, 1, bh, sh(c, -1));
    R(bx + 1, floor - bh + 2, Math.max(1, bw - 2), 1, sh(c, 2)); R(bx + 1, floor - 4, Math.max(1, bw - 2), 1, sh(c, -2));
    bx += bw + (hash(seed, i) < 0.15 ? 1 : 0);
  }
}
