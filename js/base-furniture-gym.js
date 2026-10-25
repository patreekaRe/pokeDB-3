/* base-furniture-gym.js  -  the Gym Leaders' signed posters (2026-10-13, the user's pick): a wall piece each, earned
   from the third win against them (js/data/furniture.js's `gym` source), never sold. A gym promo poster in their badge's
   colours: a sunburst, their own sprite, their name on a band and a signature. Painters are synchronous, so the sprites
   are loaded once before the catalogue is built (this module's top-level await); a sprite that fails leaves the poster
   without its picture, never the base without its furniture. */

import { R, disc, panel, inset, ctx, sh } from './base-paint.js';
import { PHOTO_KIND } from './data/level-letters.js';
import { GYM_LEADERS, GYM_INK, posterKind, spriteOf } from './data/gym.js';

/** Each leader's sprite, cropped to what is painted. */
const PICS = {};
export const LEADER_PICS = PICS;   // the Trainer set's Gym Leader case shows them too (js/base-furniture-trainer.js)
async function load(l) {
  const res = await fetch(new URL(`../${spriteOf(l)}`, import.meta.url));
  if (!res.ok) return;
  const bmp = await createImageBitmap(await res.blob());
  const c = new OffscreenCanvas(bmp.width, bmp.height), g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(bmp, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height).data;
  let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 8) {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  if (x1 >= 0) PICS[l.id] = { bmp, x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}
if (typeof createImageBitmap === 'function' && typeof OffscreenCanvas === 'function') {
  await Promise.all(GYM_LEADERS.map(l => load(l).catch(() => {})));
}

const title = (s) => s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
const whose = (s) => `${title(s)}${/s$/i.test(s) ? "'" : "'s"}`;

function poster(l) {
  const [hi, mid, lo] = GYM_INK[l.id];
  return { id: posterKind(l.id), name: `${whose(l.name)} poster`, solo: true, w: 1, h: 1, layer: 'wall', price: 300, wall(x) {
    const g = ctx(), X = x + 3, Y = 10, W = 26, H = 54;
    R(X + 1, Y + 1, W, H, 'rgba(0,0,0,0.2)');
    panel(X, Y, W, H, '#f8f4ec');
    // the sunburst behind them
    g.save();
    g.beginPath(); g.rect(X + 2, Y + 2, W - 4, H - 15); g.clip();
    const bg = g.createLinearGradient(0, Y, 0, Y + H - 13);
    bg.addColorStop(0, hi); bg.addColorStop(1, mid);
    g.fillStyle = bg; g.fillRect(X + 2, Y + 2, W - 4, H - 15);
    const cx = X + W / 2, cy = Y + 22;
    g.fillStyle = 'rgba(255,255,255,0.28)';
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2;
      g.beginPath(); g.moveTo(cx, cy);
      g.arc(cx, cy, 50, a, a + Math.PI / 12); g.closePath(); g.fill();
    }
    // them, in their own pixels
    const pic = PICS[l.id];
    if (pic) {
      const boxW = W - 6, boxH = H - 19, s = Math.min(boxW / pic.w, boxH / pic.h);
      const w = pic.w * s, h = pic.h * s;
      g.imageSmoothingEnabled = false;
      g.drawImage(pic.bmp, pic.x, pic.y, pic.w, pic.h, cx - w / 2, Y + H - 13 - h, w, h);
    }
    g.restore();
    // their name on a band in their colours, and a scrawled signature across the corner
    R(X + 2, Y + H - 13, W - 4, 8, lo);
    R(X + 2, Y + H - 13, W - 4, 1, mid);
    g.font = `bold ${l.name.length > 7 ? 3.6 : 4.6}px system-ui, sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#fff'; g.fillText(l.name, cx, Y + H - 8.8, W - 6);
    g.strokeStyle = sh(lo, -1); g.lineWidth = 0.7;
    g.beginPath();
    for (let i = 0; i <= 14; i++) {
      const t = i / 14, px = X + W - 15 + t * 11, py = Y + H - 2.6 - Math.sin(t * Math.PI * 3) * 1.2 - t * 1.4;
      i ? g.lineTo(px, py) : g.moveTo(px, py);
    }
    g.stroke();
    R(X + 4, Y + H - 3.2, 6, 0.8, sh('#f8f4ec', -1));
    // a pin at each top corner
    for (const px of [X + 3, X + W - 3]) { disc(px, Y + 3, 1.4, '#d84848'); disc(px - 0.4, Y + 2.6, 0.5, '#ffb0a8'); }
  } };
}

/** A scrawled signature from (x, y), `w` long, in `ink`: a few loops of a pen. */
function scrawl(g, x, y, w, ink, seed) {
  g.strokeStyle = ink; g.lineWidth = 0.5;
  g.beginPath();
  for (let i = 0; i <= 12; i++) {
    const t = i / 12, px = x + t * w, py = y - Math.sin(t * Math.PI * (2 + seed % 3) + seed) * 1.1 - t * 0.8;
    i ? g.lineTo(px, py) : g.moveTo(px, py);
  }
  g.stroke();
}

/** The Gym Leaders' signed group photo (the roadmap's Level 6-10 reward 10, 2026-10-23): the Nietos' letter for your
    first Level 10 win holds it. All thirteen on the Clearing's grass at golden hour, in two rows, each signing over
    themselves in their own ink, in a gilt frame. Painted at [4,16]-[60,68] (js/base-models-l.js frames it). */
const PHOTO = { id: PHOTO_KIND, name: 'The Gym Leaders\' signed photo', solo: true, w: 2, h: 1, layer: 'wall', price: 600, wall(x) {
  const g = ctx(), X = x + 4, Y = 16, W = 56, H = 52, PX = X + 5, PY = Y + 5, PW = W - 10, PH = H - 10;
  R(X + 1, Y + 1, W, H, 'rgba(0,0,0,0.22)');
  panel(X, Y, W, H, '#d8a830', 2);
  R(X + 2, Y + 2, W - 4, 1, '#fff0a8');
  inset(X + 4, Y + 4, W - 8, H - 8, '#8a6010');
  g.save();
  g.beginPath(); g.rect(PX, PY, PW, PH); g.clip();
  const sky = g.createLinearGradient(0, PY, 0, PY + PH);
  sky.addColorStop(0, '#f8b070'); sky.addColorStop(0.45, '#ffd890'); sky.addColorStop(0.62, '#a8d070'); sky.addColorStop(1, '#5a9a40');
  g.fillStyle = sky; g.fillRect(PX, PY, PW, PH);
  disc(PX + PW - 9, PY + 9, 4, 'rgba(255,248,210,0.9)');
  for (const [tx, r] of [[PX + 3, 6], [PX + PW - 2, 7]]) disc(tx, PY + PH * 0.5, r, '#4a8a3a');
  // two rows: the back seven a little smaller and higher, the front six over them
  const back = GYM_LEADERS.slice(0, 7), front = GYM_LEADERS.slice(7);
  g.imageSmoothingEnabled = false;
  const row = (list, feet, tall) => list.forEach((l, i) => {
    const pic = PICS[l.id], cx = PX + PW * (i + 0.5) / list.length;
    if (pic) {
      const s = tall / pic.h, w = pic.w * s;
      g.drawImage(pic.bmp, pic.x, pic.y, pic.w, pic.h, cx - w / 2, feet - tall, w, tall);
    }
    scrawl(g, cx - 3, feet - tall * 0.55, 6, sh(GYM_INK[l.id][2], -1), i * 1.7 + feet);
  });
  row(back, PY + PH * 0.62, 17);
  row(front, PY + PH - 2, 19);
  g.restore();
  // a gloss across the print, and a gold plate under it
  g.fillStyle = 'rgba(255,255,255,0.12)';
  g.beginPath(); g.moveTo(PX, PY); g.lineTo(PX + PW * 0.45, PY); g.lineTo(PX + PW * 0.2, PY + PH); g.lineTo(PX, PY + PH); g.closePath(); g.fill();
  R(X + W / 2 - 9, Y + H - 4, 18, 3, '#f0c850');
  R(X + W / 2 - 7, Y + H - 2.8, 14, 0.6, '#8a6010');
} };

export const GYM_KINDS = [...GYM_LEADERS.map(l => ({ group: 'Wall', ...poster(l) })), { group: 'Wall', ...PHOTO }];
