/* mall-tailor.js  -  the Poké Mall's Trainer Tailor (2026-10-28, the user's pick of a shop for the trainers you walk as),
   kept by Kecleon. A fourth front in the hall, between the Game Corner and the Safari Outfitter, and its boutique: plum
   damask over wainscoting, a herringbone floor, rails of clothes and a fitting room along the back wall either side of
   Kecleon's counter, a tall gilt mirror, and a mannequin for every look (its walking sheet's front frame on a runway,
   a plaque in front saying WORN, OWNED or the price; no names, the user's call). Walk up to one to try it on: the trainer
   window (js/look-window.js) opens on it and you wear it while it's open. Buying a look is the tailor's only.
   js/mall-3d.js walks it and opens the window. Painted smooth like the hall (fine()). */

import { LOOKS, LOOK_PRICE, lookSheet, ownsLook } from './data/looks.js';
import { getSave } from './storage.js';
import { fine, texOf, words, star } from './hub-3d.js';
import { hallKit } from './mall-hall.js';
import { WALKER_PX } from './hd2d.js';

const T = {
  plum: '#7a3478', plumDark: '#4e1e4c', plumLite: '#a85aa4', cream: '#fbf1e2', gold: '#e2b648', goldDark: '#a8801e',
  wood: '#8a5a34', woodLite: '#b07a48', woodDark: '#4e3018', kecleon: '#5cb85a', stripe: '#d84848',
};
export const TAILOR_COLOUR = T.plum;

/* The boutique: `x, y` a thing's tile, y 0 the back wall; the aisle runs up the middle from the door to the counter. The
   mannequins stand on runways in three rows three tiles apart, so a row's heads never hide the feet of the one behind
   (the Outfitter's rule), each walked up to from the tile in front. */
const COLS = 17, ROWS = 13, AISLE = 8, DOOR = { x: AISLE, y: ROWS - 1 };
const COUNTER = { x: 7, y: 2, w: 3 }, MIRROR = { x: 5, y: 0 }, FITTING = { x: 11, y: 0 };
const RACKS = [[1, 4], [12, 15]];
const ROWS_AT = [
  { y: 10, xs: [2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14] },
  { y: 7, xs: [2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14] },
  { y: 4, xs: [3, 4, 5, 6, 7, 9, 10, 11, 12, 13] },
];
const PLINTH = 0.16, CELL = 64, PITCH = 0.6;

export const TAILOR_KEEPER = { id: 'kecleon', name: 'Kecleon',
  src: 'assets/pokemon/kecleon-front.gif',
  hello: ['Welcome to the Trainer Tailor! Walk up to any mannequin to try it on.', 'Ooh, a new face! Or is it? I change mine all the time.', 'Every outfit on the floor, ready to try. The mirror is free too!'],
  chat: ['Walk up to a mannequin and you\'re wearing it, just like that. Buy it and you walk out in it!', 'Bought outfits stay yours. Switch between them any time on your Trainer Card.',
    'Every outfit is the same price. Fashion should be fair!', 'I blend in with anything. You should too!', 'The mirror shows what you\'re wearing now. Have a twirl!',
    'Your partner loves a new look. Watch it follow you round the shop!'] };

/* ---------- the hall's front ---------- */

/** A spool of thread, for the sign and the windows. */
function spool(g, x, y, r, col = T.stripe) {
  g.fillStyle = T.woodLite; g.fillRect(x - r, y - r * 1.2, r * 2, r * 0.35); g.fillRect(x - r, y + r * 0.85, r * 2, r * 0.35);
  g.fillStyle = col; g.fillRect(x - r * 0.8, y - r * 0.85, r * 1.6, r * 1.7);
  g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = r * 0.12;
  for (let k = -0.6; k <= 0.6; k += 0.3) { g.beginPath(); g.moveTo(x - r * 0.8, y + k * r); g.lineTo(x + r * 0.8, y + k * r - r * 0.15); g.stroke(); }
}

/** A dress form in a window: a cream torso on a pole, a sash across it. */
function form(g, x, foot, h, sash) {
  g.fillStyle = T.woodDark; g.fillRect(x - 0.3, foot - h * 0.42, 0.6, h * 0.42);
  g.fillRect(x - h * 0.12, foot - 0.6, h * 0.24, 0.6);
  g.fillStyle = T.cream;
  g.beginPath(); g.moveTo(x - h * 0.16, foot - h); g.quadraticCurveTo(x, foot - h * 1.06, x + h * 0.16, foot - h);
  g.lineTo(x + h * 0.11, foot - h * 0.66); g.quadraticCurveTo(x + h * 0.15, foot - h * 0.45, x + h * 0.1, foot - h * 0.4);
  g.lineTo(x - h * 0.1, foot - h * 0.4); g.quadraticCurveTo(x - h * 0.15, foot - h * 0.45, x - h * 0.11, foot - h * 0.66); g.closePath(); g.fill();
  g.strokeStyle = sash; g.lineWidth = h * 0.07;
  g.beginPath(); g.moveTo(x - h * 0.14, foot - h * 0.95); g.lineTo(x + h * 0.11, foot - h * 0.55); g.stroke();
}

/** A hanger with a shirt on it. */
function shirt(g, x, y, w, col) {
  g.strokeStyle = '#8a8a90'; g.lineWidth = 0.4;
  g.beginPath(); g.arc(x, y - 1, 0.8, Math.PI, Math.PI * 2.2); g.stroke();
  g.fillStyle = col;
  g.beginPath(); g.moveTo(x - w * 0.5, y); g.lineTo(x + w * 0.5, y); g.lineTo(x + w * 0.62, y + w * 0.4); g.lineTo(x + w * 0.38, y + w * 0.48);
  g.lineTo(x + w * 0.38, y + w * 1.2); g.lineTo(x - w * 0.38, y + w * 1.2); g.lineTo(x - w * 0.38, y + w * 0.48); g.lineTo(x - w * 0.62, y + w * 0.4); g.closePath(); g.fill();
}

/** The front on the hall's back wall, between x0 and x1 (the painting's units) from `top` to `foot`: a plum fascia
    saying TRAINER TAILOR in gold between two spools, two lit windows (a dress form, shirts on a rail) and a door. */
export function tailorFront(f, s, x0, x1, top, foot, closed = false) {
  const { g, rr, lin } = f, mid = (x0 + x1) / 2;
  rr(x0, top, x1 - x0, foot - top, 0, T.plumDark);
  rr(x0, top, x1 - x0, 12, 1, lin(0, top, 0, top + 12, [T.plumLite, T.plum, T.plumDark]));
  g.strokeStyle = T.gold; g.lineWidth = 0.7; g.strokeRect(x0 + 0.8, top + 0.8, x1 - x0 - 1.6, 10.4);
  spool(g, x0 + 5, top + 6, 2.4); spool(g, x1 - 5, top + 6, 2.4, T.kecleon);
  words(g, 'TRAINER TAILOR', mid, top + 6.2, 4.8, T.gold);
  s.fillStyle = '#3a1838'; s.beginPath(); s.roundRect(x0 + 1, top + 1, x1 - x0 - 2, 10, 1); s.fill();
  words(s, 'TRAINER TAILOR', mid, top + 6.2, 4.8, '#ffe890');
  const wt = top + 15, wb = foot - 4, dw = 14;
  [[x0 + 2, mid - dw / 2 - 1.5], [mid + dw / 2 + 1.5, x1 - 2]].forEach(([a, b], i) => {
    rr(a, wt, b - a, wb - wt, 0.8, lin(0, wt, 0, wb, ['#fff4dc', '#f8d8e8', '#e8b0c8']));
    s.fillStyle = '#806070'; s.fillRect(a, wt, b - a, wb - wt);
    if (i === 0) { form(g, a + (b - a) * 0.3, wb - 0.5, 15, T.stripe); form(g, a + (b - a) * 0.72, wb - 0.5, 13, T.kecleon); }
    else {
      g.fillStyle = T.goldDark; g.fillRect(a + 1.5, wt + 4, b - a - 3, 0.6);
      ['#3a74e0', '#e84838', '#f8d040', '#58a848'].forEach((c, k) => shirt(g, a + 4 + k * (b - a - 8) / 3, wt + 5.5, 4.4, c));
    }
    g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(a + 1, wt + 1, 1.2, wb - wt - 2);
    rr(a - 0.6, wb, b - a + 1.2, 4, 0.4, T.woodDark);
  });
  rr(mid - dw / 2, wt - 2, dw, foot - wt + 2, 0.6, T.woodDark);
  rr(mid - dw / 2 + 1.2, wt - 0.8, dw - 2.4, foot - wt + 0.8, 0.4, lin(0, wt, 0, foot, [T.plumLite, T.plum, T.plumDark]));
  g.fillStyle = 'rgba(255,230,250,0.45)'; g.fillRect(mid - dw / 2 + 3, wt + 1.5, dw - 6, 10);
  g.fillStyle = T.woodDark; g.fillRect(mid - 0.4, wt - 0.8, 0.8, foot - wt);
  for (const x of [mid - 2.4, mid + 1.6]) rr(x, (wt + foot) / 2 + 2, 0.8, 5, 0.4, T.gold);
  rr(mid - 4.5, wt + 3, 9, 3.6, 0.8, T.cream);
  words(g, closed ? 'CLOSED' : 'OPEN', mid, wt + 4.9, 2.6, closed ? '#c83a2a' : T.plum);
}

/** The board over the hall's front: plum in a gold rim, a spool and the name. Drawn on a 66 x 13 canvas. */
export function tailorSign(f) {
  const { g, rr, lin, shine } = f, s = shine();
  rr(0, 0, 66, 13, 2, T.goldDark);
  rr(0.8, 0.8, 64.4, 11.4, 1.6, lin(0, 0, 0, 13, [T.plumLite, T.plum, T.plumDark]));
  g.strokeStyle = T.gold; g.lineWidth = 0.4; g.setLineDash([1.2, 0.8]);
  g.beginPath(); g.roundRect(2, 2, 62, 9, 1.2); g.stroke(); g.setLineDash([]);
  spool(g, 7, 6.5, 2.8);
  g.fillStyle = T.gold; star(g, 60, 6.5, 2.4);
  g.lineWidth = 1; g.strokeStyle = '#2a0e28';
  g.font = '900 5.8px "Trebuchet MS", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.strokeText('TRAINER TAILOR', 34, 7); words(g, 'TRAINER TAILOR', 34, 7, 5.8, '#ffe890');
  s.fillStyle = '#301030'; s.fillRect(1, 1, 64, 11);
  words(s, 'TRAINER TAILOR', 34, 7, 5.8, '#fff0b8');
}

/** The hall front's awning: plum and cream stripes. */
export function tailorAwning() {
  const f = fine(64, 24, 6), { g } = f;
  for (let x = 0; x < 64; x += 8) { g.fillStyle = (x / 8) % 2 ? T.cream : T.plum; g.fillRect(x, 0, 8, 24); }
  g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, 20, 64, 4);
  return f.c;
}

/* ---------- the boutique's paintings ---------- */

/** Plum damask over a wood wainscot: the back wall, with the shop's name in gold over the counter. */
function wallArt({ top: TOP, u: U }, wide, sign) {
  const W = wide * U, H = TOP * U, f = fine(W, H, 4), { g, rr, lin, shine } = f, s = shine();
  const wy = (y) => (TOP - y) * U;
  g.fillStyle = lin(0, 0, 0, H, [T.plumDark, T.plum, T.plum]); g.fillRect(0, 0, W, H);
  for (let x = 0; x < W; x += 10) { g.fillStyle = 'rgba(255,220,250,0.07)'; g.fillRect(x, 0, 5, H); }
  g.fillStyle = 'rgba(226,182,72,0.22)';
  for (let y = 8; y < wy(1.2); y += 16) for (let x = (y / 16) % 2 ? 10 : 0; x < W; x += 20) {   // a gold fleur on every other stripe
    g.beginPath(); g.ellipse(x, y, 1.6, 3, 0, 0, Math.PI * 2); g.ellipse(x - 2.4, y + 1.4, 1, 2, -0.8, 0, Math.PI * 2); g.ellipse(x + 2.4, y + 1.4, 1, 2, 0.8, 0, Math.PI * 2); g.fill();
  }
  const dado = wy(1.1);
  g.fillStyle = lin(0, dado, 0, H, [T.woodLite, T.wood, T.woodDark]); g.fillRect(0, dado, W, H - dado);
  g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 0.6;
  for (let x = 6; x < W; x += 24) g.strokeRect(x, dado + 3, 18, H - dado - 7);
  g.fillStyle = T.gold; g.fillRect(0, dado - 1.4, W, 1.4);
  g.fillStyle = '#f6e2b4'; g.fillRect(0, 0, W, 4);
  if (!sign) return f.c;
  const sx = W / 2, sw = 5.2 * U, sy = wy(4.3), sh = 0.75 * U;
  rr(sx - sw / 2 + 1, sy + 1.4, sw, sh, 3, 'rgba(20,0,20,0.35)');
  rr(sx - sw / 2, sy, sw, sh, 3, T.goldDark);
  rr(sx - sw / 2 + 1.4, sy + 1.4, sw - 2.8, sh - 2.8, 2, lin(0, sy, 0, sy + sh, [T.plumLite, T.plumDark]));
  spool(g, sx - sw / 2 + 9, sy + sh / 2, 4); spool(g, sx + sw / 2 - 9, sy + sh / 2, 4, T.kecleon);
  words(g, 'TRAINER TAILOR', sx, sy + sh / 2 + 0.4, 8, T.gold);
  s.fillStyle = '#3a1838'; s.beginPath(); s.roundRect(sx - sw / 2 + 1.4, sy + 1.4, sw - 2.8, sh - 2.8, 2); s.fill();
  words(s, 'TRAINER TAILOR', sx, sy + sh / 2 + 0.4, 8, '#ffe890');
  return f.c;
}

/** Honey herringbone, a plum runner from the door to the counter with gold edges, and a round rug before the mirror. */
function floorArt() {
  const P = 16, W = COLS * P, H = ROWS * P, f = fine(W, H, 4), { g, rr } = f;
  g.fillStyle = '#6a4224'; g.fillRect(0, 0, W, H);
  const cols = ['#c08a52', '#b47e48', '#cc9660'];
  for (let y = -P; y < H + P; y += 4) for (let x = -P; x < W + P; x += 8) {
    const k = ((x / 8) + (y / 4)) % 3 | 0;
    g.save(); g.translate(x + ((y / 4) % 2) * 4, y); g.rotate(Math.PI / 4);
    g.fillStyle = cols[Math.abs(k)]; g.fillRect(0, 0, 5.4, 2.4);
    g.restore();
  }
  const ax = (AISLE + 0.5) * P;
  rr(ax - P * 0.55, (COUNTER.y + 1) * P, P * 1.1, H, 0, T.gold);
  rr(ax - P * 0.5 + 0.8, (COUNTER.y + 1) * P, P - 1.6, H, 0, T.plum);
  g.strokeStyle = 'rgba(255,220,120,0.5)'; g.lineWidth = 0.4;
  g.beginPath(); g.moveTo(ax - P * 0.35, (COUNTER.y + 1) * P); g.lineTo(ax - P * 0.35, H); g.moveTo(ax + P * 0.35, (COUNTER.y + 1) * P); g.lineTo(ax + P * 0.35, H); g.stroke();
  const mx = (MIRROR.x + 0.5) * P, my = (MIRROR.y + 1.6) * P;
  g.fillStyle = T.plumDark; g.beginPath(); g.ellipse(mx, my, P * 1.05, P * 0.7, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#c86aa8'; g.beginPath(); g.ellipse(mx, my, P * 0.9, P * 0.58, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = T.gold; g.lineWidth = 0.6; g.beginPath(); g.ellipse(mx, my, P * 0.7, P * 0.42, 0, 0, Math.PI * 2); g.stroke();
  return f.c;
}

/** The mirror's glass: a pale sheen, a streak or two, the shop's plum faint in it. */
function glassArt() {
  const f = fine(24, 48, 6), { g, lin } = f;
  g.fillStyle = lin(0, 0, 24, 48, ['#e8f4ff', '#bcd8f0', '#d8c8e8', '#a8c4e0']); g.fillRect(0, 0, 24, 48);
  g.fillStyle = 'rgba(255,255,255,0.6)';
  for (const [x, w] of [[4, 3], [9, 1.2], [15, 2]]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + w, 0); g.lineTo(x + w - 8, 48); g.lineTo(x - 8, 48); g.closePath(); g.fill(); }
  return f.c;
}

/** The fitting room's curtain: plum velvet in folds, a gold fringe. */
function curtainArt() {
  const f = fine(32, 48, 5), { g, lin } = f;
  for (let x = 0; x < 32; x += 4) { g.fillStyle = lin(x, 0, x + 4, 0, [T.plumDark, T.plumLite, T.plum]); g.fillRect(x, 0, 4, 48); }
  g.fillStyle = T.gold; g.fillRect(0, 44, 32, 4);
  g.fillStyle = T.goldDark; for (let x = 1; x < 32; x += 2) g.fillRect(x, 46, 0.8, 2);
  return f.c;
}

/** The counter's face: wood panels with a tape measure draped along it. */
function counterArt(w) {
  const f = fine(w * 16, 13, 6), { g, lin } = f;
  g.fillStyle = lin(0, 0, 0, 13, [T.woodLite, T.wood, T.woodDark]); g.fillRect(0, 0, w * 16, 13);
  g.strokeStyle = 'rgba(0,0,0,0.2)'; g.lineWidth = 0.4;
  for (let x = 2; x < w * 16 - 4; x += 12) g.strokeRect(x, 2, 10, 9);
  g.strokeStyle = '#f8d040'; g.lineWidth = 1.4;
  g.beginPath(); g.moveTo(0, 2); g.quadraticCurveTo(w * 8, 9, w * 16, 3); g.stroke();
  g.strokeStyle = '#2a2a30'; g.lineWidth = 0.2;
  for (let t = 0.02; t < 1; t += 0.04) { const x = t * w * 16, y = 2 + (1 - (2 * t - 1) ** 2) * 3.6 - t; g.beginPath(); g.moveTo(x, y - 0.5); g.lineTo(x, y + 0.2); g.stroke(); }
  return f.c;
}

/** A mannequin's plaque: WORN in gold, OWNED in green, or the price by a coin. */
function plaque(g, x, y, w, h, look, save) {
  const worn = save.look === look.id, mine = ownsLook(save, look.id);
  const [bg, ink, text] = worn ? ['#f8d040', '#5a3a00', 'WORN'] : mine ? ['#d4ecd8', '#24603a', 'OWNED'] : [T.cream, '#5a3a10', `${LOOK_PRICE}`];
  g.fillStyle = T.goldDark; g.beginPath(); g.roundRect(x, y, w, h, 3); g.fill();
  g.fillStyle = bg; g.beginPath(); g.roundRect(x + 1, y + 1, w - 2, h - 2, 2.4); g.fill();
  if (!mine) {
    g.fillStyle = '#f0b830'; g.beginPath(); g.arc(x + 9, y + h / 2, 4.4, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffe070'; g.beginPath(); g.arc(x + 9, y + h / 2, 3, 0, Math.PI * 2); g.fill();
    words(g, text, x + w / 2 + 4, y + h / 2 + 0.3, 8, ink);
  } else words(g, text, x + w / 2, y + h / 2 + 0.3, 7.5, ink);
}

/* ---------- the boutique ---------- */

export function buildTailor(THREE, size) {
  const { top: TOP } = size, cols = COLS, rows = ROWS;
  const tileX = (tx) => tx + 0.5 - cols / 2, tileZ = (ty) => ty + 0.5 - rows / 2, wallZ = -rows / 2;
  const group = new THREE.Group(), blocked = new Set(), spots = [], redraws = [];
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, ...o });
  const block = (x0, y0, x1 = x0, y1 = y0) => { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) blocked.add(`${x},${y}`); };
  const kit = hallKit(THREE);
  const put = (parent, geo, mat, x = 0, y = 0, z = 0, shadow = true) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z); m.castShadow = shadow; m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  const edge = std({ color: '#2e1a2c' }), cap = std({ color: T.plumDark });
  const wood = std({ color: T.wood, roughness: 0.6 }), woodDark = std({ color: T.woodDark, roughness: 0.7 });
  const gold = std({ color: T.gold, metalness: 0.8, roughness: 0.28 }), brass = std({ color: '#d8b050', metalness: 0.75, roughness: 0.3 });

  put(group, new THREE.BoxGeometry(cols, 0.6, rows), [edge, edge, std({ map: texOf(floorArt()), roughness: 0.55 }), edge, std({ color: '#4a2a18' }), edge], 0, -0.3, 0, false);
  put(group, new THREE.BoxGeometry(cols + 0.8, 7, rows + 0.4), [edge, edge, edge, edge, std({ color: '#3a2236' }), edge], 0, -0.6 - 3.5, -0.2, false);
  const wall = wallArt(size, cols + 0.8, true);
  put(group, new THREE.BoxGeometry(cols + 0.8, TOP, 0.4), [cap, cap, cap, cap,
    std({ map: texOf(wall), emissive: new THREE.Color('#fff4dc'), emissiveMap: texOf(wall.glow), roughness: 0.9 }), cap], 0, TOP / 2, wallZ - 0.2, false);
  const sideMat = std({ map: texOf(wallArt(size, rows, false)), roughness: 0.9 });
  for (const s of [-1, 1]) put(group, new THREE.BoxGeometry(0.4, TOP, rows), s < 0 ? [sideMat, cap, cap, cap, cap, cap] : [cap, sideMat, cap, cap, cap, cap], s * (cols / 2 + 0.2), TOP / 2, 0, false);
  // a gold crown moulding along the back wall at the clothes rails' height
  put(group, new THREE.BoxGeometry(cols + 0.8, 0.08, 0.12), gold, 0, 3.4, wallZ + 0.06, false);

  // Kecleon's counter in the middle of the back, the aisle running up to it: a till, spools and a pincushion on it
  const keeper = { id: 'keeper', kind: 'keeper', name: TAILOR_KEEPER.name, open: true, step: { x: AISLE, y: COUNTER.y + 1 } };
  spots.push(keeper);
  block(COUNTER.x, 0, COUNTER.x + COUNTER.w - 1, COUNTER.y);
  const desk = new THREE.Group();
  desk.position.set(tileX(AISLE), 0, tileZ(COUNTER.y));
  put(desk, new THREE.BoxGeometry(COUNTER.w - 0.1, 0.8, 0.72), [wood, wood, wood, wood, std({ map: texOf(counterArt(COUNTER.w)), roughness: 0.6 }), wood], 0, 0.4, 0);
  put(desk, new THREE.BoxGeometry(COUNTER.w + 0.04, 0.07, 0.86), std({ color: T.plum, roughness: 0.4 }), 0, 0.835, 0);
  put(desk, new THREE.BoxGeometry(0.42, 0.26, 0.32), std({ color: '#c8a050', metalness: 0.6, roughness: 0.35 }), 0.95, 1.0, 0.05);
  put(desk, new THREE.BoxGeometry(0.36, 0.1, 0.06), std({ color: '#2a2a30' }), 0.95, 1.16, 0.18);
  for (const [x, c] of [[-1.1, T.stripe], [-0.92, T.kecleon], [-0.74, '#3a74e0']]) {
    put(desk, new THREE.CylinderGeometry(0.06, 0.06, 0.14, 12), std({ color: c, roughness: 0.7 }), x, 0.94, 0.12);
    put(desk, new THREE.CylinderGeometry(0.075, 0.075, 0.02, 12), wood, x, 1.02, 0.12, false);
  }
  put(desk, new THREE.SphereGeometry(0.1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), std({ color: T.stripe, roughness: 0.9 }), -0.2, 0.87, 0.2);
  desk.traverse(o => { o.userData.front = keeper; });
  group.add(desk);

  // rails of clothes against the back wall either side: a brass rail on two posts, shirts on hangers, a shoe shelf under
  const tones = ['#3a74e0', '#e84838', '#f8d040', '#58a848', '#e870b0', '#2c2c34', '#f4f4f4', '#ff9a30', '#8a5ad0'];
  const shirtMats = tones.map(color => std({ color, roughness: 0.9 }));
  const shirtGeo = new THREE.BoxGeometry(0.34, 0.5, 0.06), hanger = new THREE.TorusGeometry(0.07, 0.008, 6, 12, Math.PI);
  RACKS.forEach(([x0, x1], r) => {
    const rack = new THREE.Group(), w = x1 - x0 + 0.7, cx = (tileX(x0) + tileX(x1)) / 2;
    rack.position.set(cx, 0, wallZ + 0.55);
    put(rack, new THREE.CylinderGeometry(0.025, 0.025, w, 10), brass, 0, 1.72, 0).rotation.z = Math.PI / 2;
    for (const s of [-1, 1]) {
      put(rack, new THREE.CylinderGeometry(0.03, 0.03, 1.72, 10), brass, s * w / 2, 0.86, 0);
      put(rack, new THREE.CylinderGeometry(0.16, 0.18, 0.04, 16), brass, s * w / 2, 0.02, 0);
    }
    const n = Math.round(w / 0.24);
    for (let i = 0; i < n; i++) {
      const sx = -w / 2 + 0.2 + i * (w - 0.4) / (n - 1);
      const sh = put(rack, shirtGeo, shirtMats[(i * 4 + r * 3) % tones.length], sx, 1.42, 0);
      sh.rotation.y = Math.PI / 2 - 0.25 + (i % 3) * 0.12;
      put(rack, hanger, brass, sx, 1.7, 0, false);
    }
    put(rack, new THREE.BoxGeometry(w, 0.05, 0.36), woodDark, 0, 0.3, 0);
    for (let i = 0; i < Math.floor(w / 0.42); i++) put(rack, new THREE.BoxGeometry(0.22, 0.1, 0.12), shirtMats[(i * 5 + r) % tones.length], -w / 2 + 0.3 + i * 0.42, 0.38, 0.04);
    group.add(rack);
    block(x0, 0, x1, 0);
  });

  // the mirror: tall, in a gilt frame, on a little plum rug; a tap shows what you're wearing
  const mirror = { id: 'mirror', kind: 'mirror', name: 'Mirror', open: true, step: { x: MIRROR.x, y: MIRROR.y + 1 }, at: { x: tileX(MIRROR.x), y: 0.02, z: tileZ(MIRROR.y + 1) }, ring: 0.6 };
  spots.push(mirror);
  block(MIRROR.x, MIRROR.y);
  {
    const m = new THREE.Group();
    m.position.set(tileX(MIRROR.x), 0, wallZ + 0.3);
    put(m, new THREE.BoxGeometry(0.98, 2.3, 0.08), gold, 0, 1.25, 0);
    put(m, new THREE.SphereGeometry(0.12, 14, 10), gold, 0, 2.45, 0);
    for (const s of [-1, 1]) put(m, new THREE.BoxGeometry(0.12, 0.14, 0.3), gold, s * 0.42, 0.07, 0.08);
    const glass = put(m, new THREE.PlaneGeometry(0.8, 2.1), new THREE.MeshStandardMaterial({ map: texOf(glassArt()), roughness: 0.08, metalness: 0.4, emissive: new THREE.Color('#40384a') }), 0, 1.25, 0.045, false);
    glass.receiveShadow = false;
    m.traverse(o => { o.userData.front = mirror; });
    group.add(m);
  }

  // the fitting room: a plum curtain on a brass rod between two wood screens, a gold star over it
  {
    const fr = new THREE.Group();
    fr.position.set(tileX(FITTING.x), 0, wallZ + 0.5);
    for (const s of [-1, 1]) put(fr, new THREE.BoxGeometry(0.06, 2.2, 0.9), wood, s * 0.48, 1.1, 0);
    put(fr, new THREE.CylinderGeometry(0.02, 0.02, 1.0, 8), brass, 0, 2.1, 0.42, false).rotation.z = Math.PI / 2;
    const cur = put(fr, new THREE.PlaneGeometry(0.92, 2.0), std({ map: texOf(curtainArt()), side: THREE.DoubleSide, roughness: 1 }), 0, 1.07, 0.42);
    cur.castShadow = true;
    group.add(fr);
    block(FITTING.x, 0);
  }

  // potted plants in the back corners, and either side of the door
  for (const [x, y, s] of [[0, 0, 1], [cols - 1, 0, 2], [0, rows - 1, 3], [cols - 1, rows - 1, 4], [6, 0, 5], [10, 0, 6]]) { kit.topiary(group, tileX(x), tileZ(y), 0.26, s); block(x, y); }

  // the mannequins: every look's front frame on a runway, three rows from the door back; their figures one mesh on one
  // picture of them all, their plaques another, so 33 cost a few draws
  const figs = [], at = [];
  let n = 0;
  for (const row of ROWS_AT) for (const x of row.xs) if (n < LOOKS.length) at.push({ look: LOOKS[n++], x, y: row.y });
  const across = Math.ceil(Math.sqrt(at.length)), down = Math.ceil(at.length / across);
  const atlas = document.createElement('canvas');
  atlas.width = across * CELL; atlas.height = down * CELL;
  const ag = atlas.getContext('2d');
  const figMap = texOf(atlas);
  const PW = 48, PH = 18, plaques = fine(across * PW, down * PH, 6), plaqueMap = texOf(plaques.c);
  const paintPlaques = () => {
    const save = getSave();
    plaques.g.clearRect(0, 0, across * PW, down * PH);
    at.forEach((m, i) => plaque(plaques.g, (i % across) * PW + 1, Math.floor(i / across) * PH + 1, PW - 2, PH - 2, m.look, save));
    plaqueMap.needsUpdate = true;
  };
  paintPlaques();
  redraws.push(paintPlaques);
  // each sheet's first frame, its feet set on the cell's floor, as it loads
  at.forEach((m, i) => {
    const img = new Image();
    img.onload = () => {
      const tmp = document.createElement('canvas');
      tmp.width = tmp.height = CELL;
      const tg = tmp.getContext('2d', { willReadFrequently: true });
      tg.drawImage(img, 0, 0, img.width / 4, img.height / 4, 0, 0, CELL, CELL);
      const px = tg.getImageData(0, 0, CELL, CELL).data;
      let foot = CELL - 1;
      while (foot > 0 && ![...Array(CELL).keys()].some(x => px[(foot * CELL + x) * 4 + 3] > 0)) foot--;
      ag.drawImage(tmp, (i % across) * CELL, Math.floor(i / across) * CELL + (CELL - 1 - foot));
      figMap.needsUpdate = true;
    };
    img.src = lookSheet(m.look.id);
  });
  const quads = (list) => {   // tilted quads, each its own corner of a picture: [{ x, y, z, w, h, tilt, u0, v0, u1, v1 }]
    const pos = [], nor = [], uv = [], idx = [];
    list.forEach((q, k) => {
      const c = Math.cos(q.tilt), s = Math.sin(q.tilt);
      for (const [dx, dy, u, v] of [[-q.w / 2, 0, q.u0, q.v0], [q.w / 2, 0, q.u1, q.v0], [q.w / 2, q.h, q.u1, q.v1], [-q.w / 2, q.h, q.u0, q.v1]]) {
        pos.push(q.x + dx, q.y + dy * c, q.z - dy * s); nor.push(0, s, c); uv.push(u, v);
      }
      idx.push(k * 4, k * 4 + 1, k * 4 + 2, k * 4, k * 4 + 2, k * 4 + 3);
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    return geo;
  };
  const size1 = CELL * WALKER_PX, hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const shadows = [], plaqueQuads = [];
  at.forEach((m, i) => {
    const cx = i % across, cy = Math.floor(i / across), x = tileX(m.x), z = tileZ(m.y);
    figs.push({ x, y: PLINTH, z, w: size1, h: size1, tilt: PITCH, u0: cx / across, u1: (cx + 1) / across, v0: 1 - (cy + 1) / down, v1: 1 - cy / down });
    plaqueQuads.push({ x, y: PLINTH + 0.02, z: z + 0.42, w: 0.62, h: 0.24, tilt: 0.9, u0: cx / across, u1: (cx + 1) / across, v0: 1 - (cy + 1) / down, v1: 1 - cy / down });
    shadows.push(x, z);
    const spot = { id: `look-${m.look.id}`, kind: 'look', look: m.look.id, name: m.look.name, open: true, step: { x: m.x, y: m.y + 1 }, at: { x, y: PLINTH + 0.01, z }, ring: 0.5 };
    spots.push(spot);
    const hit = new THREE.Mesh(new THREE.BoxGeometry(0.86, size1 * 0.8, 0.9), hitMat);
    hit.position.set(x, size1 * 0.4, z + 0.1);
    hit.userData.front = spot;
    group.add(hit);
    block(m.x, m.y);
  });
  const noRay = (o) => { o.raycast = () => {}; return o; };
  const figures = noRay(new THREE.Mesh(quads(figs), new THREE.MeshStandardMaterial({ map: figMap, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1 })));
  group.add(figures);
  const tags = noRay(new THREE.Mesh(quads(plaqueQuads), new THREE.MeshBasicMaterial({ map: plaqueMap, transparent: true, toneMapped: false })));
  group.add(tags);
  {   // the figures' soft shadows, one mesh
    const geos = [];
    for (let i = 0; i < shadows.length; i += 2) {
      const c = new THREE.CircleGeometry(0.3, 16);
      c.rotateX(-Math.PI / 2); c.translate(shadows[i], PLINTH + 0.012, shadows[i + 1]);
      geos.push(c.index ? c.toNonIndexed() : c);
    }
    const pos = new Float32Array(geos.reduce((k, g) => k + g.attributes.position.array.length, 0));
    let o = 0;
    for (const g of geos) { pos.set(g.attributes.position.array, o); o += g.attributes.position.array.length; g.dispose(); }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    group.add(noRay(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.26, depthWrite: false }))));
  }
  // the runways, a run of plum-topped wood each side of the aisle per row, gold along their edges
  {
    const run = new THREE.Group(), top = std({ color: T.plum, roughness: 0.5 });
    for (const row of ROWS_AT) for (const side of [row.xs.filter(x => x < AISLE), row.xs.filter(x => x > AISLE)]) {
      if (!side.length) continue;
      const x0 = Math.min(...side), x1 = Math.max(...side), w = x1 - x0 + 0.9, cx = (tileX(x0) + tileX(x1)) / 2, z = tileZ(row.y);
      put(run, new THREE.BoxGeometry(w, PLINTH - 0.03, 0.8), wood, cx, (PLINTH - 0.03) / 2, z);
      put(run, new THREE.BoxGeometry(w + 0.02, 0.03, 0.82), top, cx, PLINTH - 0.015, z);
      put(run, new THREE.BoxGeometry(w + 0.04, 0.025, 0.025), gold, cx, PLINTH - 0.01, z + 0.41, false);
    }
    run.traverse(o => { o.raycast = () => {}; });
    group.add(run);
  }

  const ring = new THREE.Mesh(new THREE.RingGeometry(0.98, 1.08, 64), new THREE.MeshBasicMaterial({ color: '#f8d040', transparent: true, opacity: 0.9, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2;
  ring.visible = false;
  ring.raycast = () => {};
  group.add(ring);

  return {
    group, blocked, spots, ring, top: 4, title: 'Trainer Tailor', cols, rows, door: DOOR,
    keeper: { ...TAILOR_KEEPER, x: tileX(AISLE), z: tileZ(COUNTER.y - 1) },
    refresh: () => redraws.forEach(r => r()),
    tick() {},
  };
}
