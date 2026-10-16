/* base-furniture-statues.js  -  a gold statue of each starter (2026-10-16, js/data/catalogue.js): its own sprite,
   gilded, on a marble pedestal with its name on a gold plate. Never in the store's daily deal (`luxury`), sold only in
   the PC's Grand Catalogue. The sprites are fetched only when needed (loadStatues(): the catalogue and the Secret Base
   wait for it), not at boot like the Gym Leaders' posters: thirty GIFs are 2 MB. Until a statue's sprite is in, it
   paints its bare pedestal, and its `live()` changes once it is, so every picture of it is painted afresh. */

import { R, panel, floorShadow, ctx, sh } from './base-paint.js';
import { STARTERS, STARTERS_BY_ID } from './data/starters.js';
import { STATUE_COSTS, statueKind, statueClass, statueForm, statueSprite } from './data/catalogue.js';

/** Each starter's sprite, cropped and gilded, by starter id. */
const PICS = {};
const loading = {};
// dark to light: the sprite's own shading becomes the gold's
const GOLD = ['#3e2808', '#6e4a10', '#a0721c', '#cc9a30', '#e8bc48', '#f8dc80', '#fff4c4'];
const MARBLE = '#e8e4da', VEIN = '#cfc8ba', PLATE = '#d8a830';

function gild(bmp) {
  const c = new OffscreenCanvas(bmp.width, bmp.height), g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(bmp, 0, 0);
  const im = g.getImageData(0, 0, c.width, c.height), d = im.data;
  let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
  const rgb = GOLD.map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] <= 8) { d[i + 3] = 0; continue; }
    const p = i >> 2, x = p % c.width, y = (p - x) / c.width;
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
    const lum = (0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]) / 255;
    const [r, gg, b] = rgb[Math.min(GOLD.length - 1, Math.floor(Math.pow(lum, 0.8) * GOLD.length))];
    d[i] = r; d[i + 1] = gg; d[i + 2] = b; d[i + 3] = 255;
  }
  if (x1 < 0) return null;
  g.putImageData(im, 0, 0);
  return { c, x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/** Fetch and gild the sprites of these starters' statues (every starter's by default). Resolves when all are in. */
export function loadStatues(ids = STARTERS.map(s => s.id)) {
  if (typeof createImageBitmap !== 'function' || typeof OffscreenCanvas !== 'function') return Promise.resolve();
  return Promise.all(ids.filter(id => STARTERS_BY_ID[id]).map(id => loading[id] ||= fetch(new URL(`../${statueSprite(STARTERS_BY_ID[id])}`, import.meta.url))
    .then(r => (r.ok ? r.blob() : null)).then(b => b && createImageBitmap(b)).then(bmp => { PICS[id] = bmp ? gild(bmp) : null; })
    .catch(() => { PICS[id] = null; })));
}

/** True once a starter's statue has its sprite (or never will: it failed, or this browser can't paint it). */
export const statueReady = (id) => id in PICS || typeof createImageBitmap !== 'function';

/** The starter ids of the statue kinds among `kinds` (a base's `owned` keys, say). */
export const statuesIn = (kinds) => STARTERS.filter(s => kinds.includes(statueKind(s.id))).map(s => s.id);

function statue(s) {
  const form = statueForm(s), id = s.id;
  return { id: statueKind(id), name: `${form.name} statue`, group: 'Statues', solo: true, luxury: true,
    statueOf: id, w: 2, h: 2, price: STATUE_COSTS[statueClass(s)], live: () => (PICS[id] ? 'gilt' : ''), draw(x, b, vw) {
      const g = ctx(), cx = x + vw / 2;
      floorShadow(x + 4, b, vw - 8);
      // the pedestal: a plinth, a block with a gold plate, a cap; every row one centred run, so it turns on a lathe in 3D
      panel(cx - 25, b - 7, 50, 7, sh(MARBLE, -1));
      panel(cx - 20, b - 25, 40, 18, MARBLE);
      for (const [vx, vy, vw2] of [[-14, -22, 7], [6, -16, 9], [-6, -11, 5]]) R(cx + vx, b + vy, vw2, 1, VEIN);
      panel(cx - 24, b - 30, 48, 5, sh(MARBLE, 1));
      panel(cx - 14, b - 21, 28, 9, PLATE);
      R(cx - 13, b - 20, 26, 1, sh(PLATE, 2));
      g.font = `bold ${form.name.length > 8 ? 4 : 5}px system-ui, sans-serif`;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = '#5a3a08'; g.fillText(form.name.toUpperCase(), cx, b - 16.4, 25);
      const pic = PICS[id];
      if (!pic) return;
      const k = Math.min(58 / pic.w, 94 / pic.h), w = pic.w * k, h = pic.h * k;
      g.imageSmoothingEnabled = false;
      g.drawImage(pic.c, pic.x, pic.y, pic.w, pic.h, cx - w / 2, b - 30 - h, w, h);
    } };
}

export const STATUE_KINDS = STARTERS.map(statue);
