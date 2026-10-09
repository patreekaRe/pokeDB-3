/* mall-furniture.js  -  the Poké Mall's Furniture store (roadmap 5a; branch secret-base): its front in the hall, glass
   with two of the day's pieces on show behind it, and its two 3D shop floors, the day's stock (furnitureStock()) standing
   on low wooden platforms as the real pieces, each with its price card. The second floor (`secretBase.upstairs`, bought once) holds the
   next STOCK pieces of the same day's shuffle; its lift at the back right is roped off until it's open. Painted smooth
   like the hall (fine()), the furniture in its own pixels (pieceArt()). js/mall-3d.js walks it; this file only builds it. */

import { PIECES, pieceArt, furnitureStock, UPSTAIRS_PRICE } from './secret-base.js';
import { tex, trim } from './hd2d.js';
import { furnitureModel } from './base-mesh.js';
import { fine, texOf, words, star } from './hub-3d.js';
import { RES, HD } from './base-paint.js';

const PX = 1 / (16 * RES);   // one of a piece's painted pixels, in tiles
/* The lift between the floors at the back right (2026-10-09, the user's ask: the stair's steps were blocks under a smooth
   ramp, so your partner sank into every tread, and upstairs walked down into a stairwell only painted on the floor):
   `x` its middle (snug between the counter's shelf and the side wall), `foot` the tile you stand on at its doors, `door`
   right in front of them and `inside` in its car. */
export const LIFT = { x: 11.45, foot: { x: 11, y: 2 }, door: { x: 11.45, y: 2 }, inside: { x: 11.45, y: 0.45 } };
const LIFT_W = 2, LIFT_D = 1.4, LIFT_H = 2.5, LIFT_DOOR = 1.8;   // its case, and its doorway's height
/* Restyled after New Horizons' Nook's Cranny (2026-10-09, the user's ask: a full restyle, and the pieces were too
   small): cream plaster between timber posts over light wood wainscoting, a plank floor, leaf-green trim, and the day's
   pieces near life size on low wooden platforms, 2 x 2 tiles, four along the back and four in front with an aisle
   between, each with a price card standing at its front. `x, y` a platform's back-left tile, `step` where you stand to
   look at it, `tall` how tall its piece may stand (lower in front, so the back row shows over it). */
const BAYS = [
  ...[0, 2, 4, 6].map(x => ({ x, y: 0, step: { x, y: 2 }, tall: 2.3 })),
  ...[0, 2, 4, 6].map(x => ({ x, y: 3, step: { x, y: 5 }, tall: 1.35 })),
];
const DAIS = 1.84, DAIS_H = 0.14;   // a platform's width (a little under its two tiles) and height
const COUNTER = { x: 8, y: 4, w: 3 };   // its tiles, left to right; the shopkeeper stands a tile behind its middle
const LOOK = {
  1: { plaster: ['#fbf4e4', '#f3e8d0'], wood: '#c89058', lite: '#e4b47a', dark: '#7a4c2a', trim: '#4fa45e', trimDark: '#347a44',
    planks: ['#e6bc86', '#dcb07a', '#d2a46e'], gap: '#a8743e', mat: ['#a8d494', '#94c47e'], rug: ['#6ab8a0', '#a8e0cc'] },
  2: { plaster: ['#fdf2f2', '#f6e2e4'], wood: '#c8946e', lite: '#e8bc96', dark: '#7a4a4a', trim: '#d0708a', trimDark: '#9a4a62',
    planks: ['#ecd2b4', '#e2c6a6', '#d8ba98'], gap: '#b08a6a', mat: ['#f2c0cc', '#e8acbc'], rug: ['#8aa8d8', '#c8d8f4'] },
};
for (const L of Object.values(LOOK)) Object.assign(L, { sign: L.trim, paper: L.plaster });
export const STORE_COLOUR = LOOK[1].trim;

/* Each floor's shopkeeper, who says every line in the store (the user's ask: "a shopkeeper, one of the Pokémon"):
   Smeargle paints the furniture, Minccino keeps the second floor spotless. */
export const KEEPERS = {
  1: { id: 'smeargle', name: 'Smeargle', src: 'assets/pokemon/smeargle-front.gif',
    hello: ['Welcome in! I painted every piece in here myself.', 'Fresh pieces on the stands today, still wet! Kidding.', 'Have a look round. Tap a piece and I\'ll tell you about it.'],
    chat: ['Every colour of a piece comes with it. I can never pick just one.', 'New stock every day, the moment the clock strikes midnight.', 'A room is a canvas, you know. Your Secret Base is your masterpiece!'] },
  2: { id: 'minccino', name: 'Minccino', src: 'assets/pokemon/minccino-front.gif',
    hello: ['Welcome upstairs! Mind the... no, there\'s no dust. I checked.', 'Oh! A customer! Let me just polish that stand. There.'],
    chat: ['I dust every stand twice a day. Three times on Sundays.', 'Eight more pieces up here, every day. All spotless.'] },
};

const price = (n) => n.toLocaleString();

/** A sofa, the store's sign: two arms, a back and a seat. */
function sofa(g, x, y, r, col) {
  g.fillStyle = col;
  g.beginPath(); g.roundRect(x - r, y - r * 0.5, r * 2, r * 0.9, r * 0.25); g.fill();
  g.beginPath(); g.roundRect(x - r * 1.25, y - r * 0.1, r * 0.5, r * 0.9, r * 0.2); g.fill();
  g.beginPath(); g.roundRect(x + r * 0.75, y - r * 0.1, r * 0.5, r * 0.9, r * 0.2); g.fill();
  g.beginPath(); g.roundRect(x - r * 0.8, y + 0.2 * r, r * 1.6, r * 0.6, r * 0.15); g.fill();
}

/** The front on the hall's back wall, between x0 and x1 (the painting's units) from `top` to `foot`: a teal fascia saying
    FURNITURE, two warm-lit display windows (the pieces in them are real, set in front of this) and a glass door. */
export function frontArt(f, s, x0, x1, top, foot, closed = false) {
  const { g, rr, lin } = f, L = LOOK[1], mid = (x0 + x1) / 2;
  rr(x0, top, x1 - x0, foot - top, 0, '#4a3a2e');
  rr(x0, top, x1 - x0, 12, 1, lin(0, top, 0, top + 12, [L.trim, L.trim, L.dark]));
  rr(x0 + 2, top + 2, x1 - x0 - 4, 8, 1, '#ffffff');
  sofa(g, x0 + 9, top + 6.4, 2.6, L.trim);
  words(g, 'FURNITURE', mid + 4, top + 6.2, 5.4, L.dark);
  s.fillStyle = '#c8c8c8'; s.beginPath(); s.roundRect(x0 + 2, top + 2, x1 - x0 - 4, 8, 1); s.fill();
  words(s, 'FURNITURE', mid + 4, top + 6.2, 5.4, '#40a0a0');
  const wt = top + 14, wb = foot - 4, dw = 14;
  for (const [a, b] of [[x0 + 2, mid - dw / 2 - 1.5], [mid + dw / 2 + 1.5, x1 - 2]]) {
    rr(a, wt, b - a, wb - wt, 0.8, lin(0, wt, 0, wb, ['#fff4d0', '#ffd890', '#e8b070']));
    g.fillStyle = 'rgba(120,70,40,0.18)'; g.fillRect(a, wb - 6, b - a, 6);   // the display's back, under the pieces
    s.fillStyle = '#a08060'; s.fillRect(a, wt, b - a, wb - wt - 6);
    rr(a - 0.6, wb, b - a + 1.2, 4, 0.4, '#e8dcc4');
  }
  rr(mid - dw / 2, wt - 2, dw, foot - wt + 2, 0.6, '#3a3a44');
  rr(mid - dw / 2 + 1.2, wt - 0.8, dw - 2.4, foot - wt + 0.8, 0.4, lin(0, wt, 0, foot, ['#cfeaff', '#9ac8e8', '#7aa8c8']));
  g.fillStyle = '#3a3a44'; g.fillRect(mid - 0.4, wt - 0.8, 0.8, foot - wt);
  for (const x of [mid - 2.4, mid + 1.6]) rr(x, (wt + foot) / 2, 0.8, 5, 0.4, '#d8dce6');
  rr(mid - 4.5, wt + 3, 9, 3.6, 0.8, '#ffffff');
  words(g, closed ? 'CLOSED' : 'OPEN', mid, wt + 4.9, 2.6, closed ? '#c83828' : L.trim);
}

/** Two of today's pieces in the front's windows (uprights, so they read as themselves), with the glass in front of them
    and a sill under each. `cx` is the front's middle, `z` the wall's face. */
export function frontWindow(THREE, cx, z) {
  const group = new THREE.Group(), stock = furnitureStock(), shown = stock.filter(id => !PIECES[id].flat && !PIECES[id].wall);
  const picks = [...shown, 'plant', 'lamp'].slice(0, 2);
  picks.forEach((id, i) => {
    const cut = trim(pieceArt(id, 0, HD)), w = cut.w * PX, h = cut.h * PX, k = Math.min(1, 0.78 / w, 1.15 / h);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w * k, h * k), new THREE.MeshStandardMaterial({ map: tex(cut.c), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1 }));
    m.position.set(cx + (i ? 1 : -1), 0.42 + h * k / 2, z + 0.12);
    group.add(m);
  });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 1.95), new THREE.MeshStandardMaterial({ color: '#d8f0ff', transparent: true, opacity: 0.16, roughness: 0.05, metalness: 0.3, depthWrite: false }));
  glass.position.set(cx, 0.98, z + 0.3);
  group.add(glass);
  return group;
}

/** A wall the height of the room: cream plaster framed by timber, a beam along the top of the shop's storey with posts
    down from it every `bay` units, light wood wainscoting in vertical boards up to a green-trimmed rail, a dark skirting.
    `wy` turns a height into the painting's y. */
function paper(f, W, H, L, wy, bay = 52) {
  const { g, rr, lin } = f;
  g.fillStyle = lin(0, 0, 0, H, [L.plaster[1], L.plaster[0], L.plaster[0]]); g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(160,120,70,0.05)';   // the plaster's soft trowel marks
  for (let i = 0; i < 160; i++) { g.beginPath(); g.ellipse((i * 97) % W, (i * 53) % H, 3 + i % 4, 1.2, 0, 0, Math.PI * 2); g.fill(); }
  const beam = wy(5.15), rail = wy(1.2), sk = wy(0.3);
  // wainscoting: light boards, each with a lit left edge and a shadowed seam
  rr(0, rail, W, sk - rail, 0, lin(0, rail, 0, sk, [L.lite, L.wood]));
  for (let x = 0; x < W; x += 6) {
    g.fillStyle = 'rgba(90,50,20,0.28)'; g.fillRect(x, rail, 0.5, sk - rail);
    g.fillStyle = 'rgba(255,240,210,0.3)'; g.fillRect(x + 0.5, rail, 0.6, sk - rail);
  }
  rr(0, rail - 1.6, W, 2.6, 0.6, lin(0, rail - 1.6, 0, rail + 1, [L.trim, L.trimDark]));
  g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(0, rail - 1.6, W, 0.5);
  rr(0, sk, W, H - sk, 0, lin(0, sk, 0, H, [L.dark, '#4a2c18']));
  // timber: posts from the beam to the rail, the beam itself, all with a lit face and grain
  const timber = (x, y, w, h) => {
    rr(x, y, w, h, 0.4, lin(x, 0, x + w, 0, [L.lite, L.wood, L.dark]));
    g.strokeStyle = 'rgba(90,50,20,0.25)'; g.lineWidth = 0.3;
    for (let i = 1; i < 3; i++) { g.beginPath(); g.moveTo(x + w * i / 3, y); g.lineTo(x + w * i / 3 + 0.4, y + h); g.stroke(); }
  };
  for (let x = bay / 2; x < W; x += bay) timber(x - 2, beam, 4, rail - beam - 1.6);
  rr(0, beam - 3.4, W, 4.4, 0.6, lin(0, beam - 3.4, 0, beam + 1, [L.lite, L.wood, L.dark]));
  g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(0, beam - 3.4, W, 0.5);
}

/** Nook's leaf: a leaf on its tip with a curled stalk and a vein. */
function leaf(g, x, y, r, col) {
  g.fillStyle = col;
  g.beginPath(); g.moveTo(x, y + r); g.bezierCurveTo(x - r * 1.2, y + r * 0.2, x - r * 0.6, y - r * 0.9, x, y - r);
  g.bezierCurveTo(x + r * 0.6, y - r * 0.9, x + r * 1.2, y + r * 0.2, x, y + r); g.fill();
  g.strokeStyle = '#fbf3e0'; g.lineWidth = r * 0.14;
  g.beginPath(); g.moveTo(x, y + r * 0.8); g.lineTo(x, y - r * 0.6); g.stroke();
  g.strokeStyle = col; g.lineWidth = r * 0.2;
  g.beginPath(); g.moveTo(x, y + r); g.quadraticCurveTo(x + r * 0.2, y + r * 1.5, x + r * 0.6, y + r * 1.4); g.stroke();
}

/** A paint-swatch board, Smeargle's: a cork board with a card of colour chips pinned to it, every colour a piece comes in. */
function swatches(g, x, y, w, h, L) {
  g.fillStyle = 'rgba(60,30,10,0.25)'; g.fillRect(x + 1, y + 1, w, h);
  g.fillStyle = L.dark; g.fillRect(x, y, w, h);
  g.fillStyle = '#c89a64'; g.fillRect(x + 1.4, y + 1.4, w - 2.8, h - 2.8);
  g.fillStyle = 'rgba(90,50,20,0.25)';
  for (let i = 0; i < 40; i++) g.fillRect(x + 2 + (i * 37 % (w - 4)), y + 2 + (i * 53 % (h - 4)), 0.5, 0.5);
  const chips = ['#e4584a', '#f0904a', '#f0c040', '#9ac850', '#4aa860', '#3fa89e', '#4a8ad8', '#6a5ac8', '#b85ab8', '#e888a8',
    '#fbf3e4', '#c8b8a0', '#8a6a4a', '#5a5a64', '#2a2a30', '#a8d4f0', '#f8d0a0', '#c84a6a', '#7ab0a0', '#d8a040'];
  const cw = (w - 8) / 5, ch = (h - 12) / 4;
  g.fillStyle = '#ffffff'; g.fillRect(x + 3, y + 3, w - 6, h - 6);
  chips.forEach((c, i) => { g.fillStyle = c; g.fillRect(x + 4 + (i % 5) * cw, y + 4 + Math.floor(i / 5) * ch, cw - 0.8, ch - 0.8); });
  words(g, '20 COLOURS', x + w / 2, y + h - 4.4, 2.6, L.dark);
  for (const px of [x + 4, x + w - 4]) { g.fillStyle = '#d83a3a'; g.beginPath(); g.arc(px, y + 3, 1, 0, Math.PI * 2); g.fill(); }
}

/** A poster: a white margin round a coloured sheet, a motif and two lines of "writing". */
function poster(g, x, y, w, h, bg, ink, motif, title) {
  g.fillStyle = 'rgba(60,30,10,0.22)'; g.fillRect(x + 0.8, y + 0.8, w, h);
  g.fillStyle = '#fbf3e4'; g.fillRect(x, y, w, h);
  g.fillStyle = bg; g.fillRect(x + 1.2, y + 1.2, w - 2.4, h - 2.4);
  const cx = x + w / 2, cy = y + h * 0.42, r = Math.min(w, h) * 0.24;
  g.fillStyle = ink;
  if (motif === 'ball') {
    g.beginPath(); g.arc(cx, cy, r, Math.PI, 0); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI); g.fill();
    g.fillStyle = ink; g.fillRect(cx - r, cy - 0.4, r * 2, 0.8);
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(cx, cy, r * 0.3, 0, Math.PI * 2); g.fill();
  } else if (motif === 'flower') {
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; g.beginPath(); g.arc(cx + Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.55, r * 0.45, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#f8d040'; g.beginPath(); g.arc(cx, cy, r * 0.35, 0, Math.PI * 2); g.fill();
  } else if (motif === 'sofa') {
    sofa(g, cx, cy, r * 0.9, ink);
  } else {
    g.beginPath(); g.moveTo(cx - r, cy + r * 0.7); g.lineTo(cx - r * 0.2, cy - r * 0.6); g.lineTo(cx + r * 0.3, cy + r * 0.1);
    g.lineTo(cx + r * 0.6, cy - r * 0.3); g.lineTo(cx + r, cy + r * 0.7); g.fill();
  }
  g.fillStyle = ink;
  if (title) {
    words(g, title, cx, y + h * 0.75, w * 0.17, ink);
    g.fillRect(x + w * 0.3, y + h * 0.86, w * 0.4, 0.8);
  } else {
    g.fillRect(x + w * 0.2, y + h * 0.74, w * 0.6, 1);
    g.fillRect(x + w * 0.28, y + h * 0.84, w * 0.44, 0.8);
  }
  g.fillStyle = '#c8c0b0';   // a pin at each top corner
  for (const px of [x + 2, x + w - 2]) { g.beginPath(); g.arc(px, y + 2, 0.8, 0, Math.PI * 2); g.fill(); }
}

/** A framed picture: a dark wood frame round a little landscape. */
function frame(g, x, y, w, h, L, sky = '#a8d4f0') {
  g.fillStyle = 'rgba(60,30,10,0.25)'; g.fillRect(x + 0.8, y + 0.8, w, h);
  g.fillStyle = L.dark; g.fillRect(x, y, w, h);
  g.fillStyle = '#f4ead8'; g.fillRect(x + 1, y + 1, w - 2, h - 2);
  g.fillStyle = sky; g.fillRect(x + 2, y + 2, w - 4, h - 4);
  g.fillStyle = '#7ab060'; g.beginPath(); g.moveTo(x + 2, y + h - 2); g.quadraticCurveTo(x + w * 0.4, y + h * 0.4, x + w - 2, y + h - 3); g.lineTo(x + w - 2, y + h - 2); g.fill();
}

/** A wall clock, its hands at ten past ten. */
function clock(g, x, y, r, L) {
  g.fillStyle = L.dark; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#fbf6ea'; g.beginPath(); g.arc(x, y, r * 0.82, 0, Math.PI * 2); g.fill();
  g.fillStyle = L.dark;
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.fillRect(x + Math.cos(a) * r * 0.66 - 0.3, y + Math.sin(a) * r * 0.66 - 0.3, 0.6, 0.6); }
  g.strokeStyle = L.dark; g.lineWidth = 0.7;
  g.beginPath(); g.moveTo(x, y); g.lineTo(x - r * 0.38, y - r * 0.28); g.moveTo(x, y); g.lineTo(x + r * 0.5, y - r * 0.4); g.stroke();
}

/** A floor's back wall, one painting: warm wallpaper over a dark skirting, the store's wooden sign over the back stand,
    posters and framed pictures, a clock over the counter, tall windows up high for a tall phone. */
function wallArt(floor, { cols, top: TOP, u: U }) {
  const W = (cols + 0.8) * U, H = TOP * U, L = LOOK[floor], f = fine(W, H, 4), { g, rr, lin, shine } = f, s = shine();
  const wx = (t) => (t + 0.4) * U, wy = (y) => (TOP - y) * U;
  paper(f, W, H, L, wy);
  // windows up high, sky through them
  const wt = wy(TOP - 0.4), wb = wy(5.6);
  for (let t = 0.4; t < cols - 0.4; t += 2.6) {
    const x0 = wx(t) + 4, x1 = wx(t + 2.6) - 4;
    rr(x0 - 1.8, wt - 1.8, x1 - x0 + 3.6, wb - wt + 3.6, 1, L.dark);
    g.fillStyle = lin(0, wt, 0, wb, ['#7ab8f0', '#a8d4f8', '#e0f0ff']); g.fillRect(x0, wt, x1 - x0, wb - wt);
    g.fillStyle = L.wood; g.fillRect((x0 + x1) / 2 - 0.6, wt, 1.2, wb - wt); g.fillRect(x0, (wt + wb) / 2 - 0.6, x1 - x0, 1.2);
    s.fillStyle = '#404850'; s.fillRect(x0, wt, x1 - x0, wb - wt);
  }
  // the sign over the back row, hung from the beam: a green board, a cream leaf in a ring, the name, lit
  const sx = wx(4), sw = 4.8 * U, sy = wy(4.85), sh = 20, name = floor === 1 ? 'FURNITURE' : 'FURNITURE 2F';
  g.strokeStyle = L.dark; g.lineWidth = 0.8;
  for (const x of [sx - sw / 2 + 10, sx + sw / 2 - 10]) { g.beginPath(); g.moveTo(x, wy(5.15)); g.lineTo(x, sy); g.stroke(); }
  rr(sx - sw / 2 + 1, sy + 1.4, sw, sh, 5, 'rgba(60,30,10,0.25)');
  rr(sx - sw / 2, sy, sw, sh, 5, L.trimDark);
  rr(sx - sw / 2 + 1.2, sy + 1.2, sw - 2.4, sh - 2.4, 4, lin(0, sy, 0, sy + sh, [L.trim, L.trimDark]));
  const lx = sx - sw / 2 + 12, ly = sy + sh / 2;
  g.fillStyle = '#fbf3e0'; g.beginPath(); g.arc(lx, ly, 6.6, 0, Math.PI * 2); g.fill();
  leaf(g, lx, ly, 4.6, L.trim);
  words(g, name, sx + 7, ly + 0.4, floor === 1 ? 9.4 : 8, '#fbf3e0');
  s.fillStyle = '#4a6a4a'; s.beginPath(); s.roundRect(sx - sw / 2 + 1.2, sy + 1.2, sw - 2.4, sh - 2.4, 4); s.fill();
  words(s, name, sx + 7, ly + 0.4, floor === 1 ? 9.4 : 8, '#fff4d0');
  // only a few things on the walls: a swatch board at the left, a clock and a picture over the counter's shelf
  swatches(g, wx(0.25), wy(4.6), 26, 30, L);
  clock(g, wx(9.5), wy(4.2), 8, L);
  frame(g, wx(8.05), wy(4.55), 20, 15, L);
  if (floor === 2) frame(g, wx(9.95), wy(4.55), 20, 15, L, '#f8c8a0');
  return f.c;
}

/** A side wall's inside, `rows` tiles long, the same paper; the left one has a curtained window and a poster (its
    painting's left is the room's front), the right one a picture by the front (its left is the back). */
function sideArt(floor, left, { rows, top: TOP, u: U }) {
  const W = rows * U, H = TOP * U, L = LOOK[floor], f = fine(W, H, 3), { g, rr, lin } = f;
  const wy = (y) => (TOP - y) * U, at = (t) => (left ? rows - t - 0.5 : t + 0.5) * U;
  paper(f, W, H, L, wy);
  if (left) {
    const cx = at(1.6), w = 30, t0 = wy(3.6), t1 = wy(1.3);
    rr(cx - w / 2 - 2, t0 - 2, w + 4, t1 - t0 + 4, 1, L.dark);
    rr(cx - w / 2, t0, w, t1 - t0, 0.6, lin(0, t0, 0, t1, ['#8ac4f0', '#c8e4fa', '#f0f8ff']));
    g.fillStyle = '#7ab060'; g.fillRect(cx - w / 2, t1 - 8, w, 8);
    g.fillStyle = L.wood; g.fillRect(cx - 0.6, t0, 1.2, t1 - t0);
    rr(cx - w / 2 - 5, t0 - 4, w + 10, 1.6, 0.8, '#5a4a3a');
    for (const side of [-1, 1]) {   // curtains drawn back to each side, in soft folds
      const x0 = cx + side * (w / 2 - 3);
      for (let i = 0; i < 4; i++) {
        g.fillStyle = i % 2 ? '#f4f0ea' : '#e4ded4';
        g.beginPath(); g.moveTo(x0 + side * i * 2.4, t0 - 3); g.lineTo(x0 + side * (i + 1) * 2.4, t0 - 3);
        g.lineTo(x0 + side * (i + 1) * 2.4 + side * 1.5, t1 + 3); g.lineTo(x0 + side * i * 2.4 + side * 1.5, t1 + 3); g.fill();
      }
    }
    poster(g, at(4.4) - 14, wy(4.6), 28, 40, L.trim, '#fbf3e4', 'sofa', 'HOME');
  } else {
    frame(g, at(2) - 10, wy(4.7), 20, 15, L, '#c8e0f0');
  }
  return f.c;
}

/** The floor: terracotta tiles in a basket weave downstairs (Nook's), a carpet upstairs, a red rug by the counter and a
    welcome mat at the way in, and a mat at the lift's doors. */
function floorArt(floor, { cols, rows }) {
  const T = 16, L = LOOK[floor], f = fine(cols * T, rows * T, 5), { g, rr, lin } = f;
  // light planks running across, staggered, each its own shade with a little grain and a dark seam
  g.fillStyle = L.gap; g.fillRect(0, 0, cols * T, rows * T);
  const PH = 4;
  for (let r = 0; r * PH < rows * T; r++) {
    let x = -((r * 23) % 40);
    for (let n = 0; x < cols * T; n++) {
      const len = 28 + ((r * 7 + n * 13) % 4) * 8, col = L.planks[(r * 5 + n * 3) % 3];
      rr(x + 0.25, r * PH + 0.25, len - 0.5, PH - 0.5, 0.4, col);
      g.fillStyle = 'rgba(255,240,210,0.22)'; g.fillRect(x + 0.4, r * PH + 0.35, len - 0.8, 0.45);
      g.strokeStyle = 'rgba(120,70,30,0.14)'; g.lineWidth = 0.25;
      g.beginPath(); g.moveTo(x + 2, r * PH + PH * 0.55); g.bezierCurveTo(x + len * 0.3, r * PH + PH * 0.3, x + len * 0.6, r * PH + PH * 0.8, x + len - 2, r * PH + PH * 0.5); g.stroke();
      x += len;
    }
  }
  // a round rug in front of the counter, two rings woven in
  const rx = 9.5 * T, ry = 5.75 * T, rw = 1.9 * T, rh = 0.75 * T;
  g.fillStyle = 'rgba(60,30,10,0.18)'; g.beginPath(); g.ellipse(rx + 0.6, ry + 0.8, rw, rh, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = L.rug[0]; g.beginPath(); g.ellipse(rx, ry, rw, rh, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = L.rug[1]; g.lineWidth = 1.4;
  for (const k of [0.82, 0.5]) { g.beginPath(); g.ellipse(rx, ry, rw * k, rh * k, 0, 0, Math.PI * 2); g.stroke(); }
  rr(6 * T + 1.5, (rows - 1) * T + 2.5, T - 3, T - 5, 2, L.trim);
  words(g, 'HELLO', 6.5 * T, (rows - 0.5) * T, 3.2, '#ffffff');
  // a mat at the lift's doors
  const mx = (LIFT.x + 0.5) * T, my = (LIFT_D + 0.32) * T;
  rr(mx - 0.75 * T, my - 0.28 * T, 1.5 * T, 0.56 * T, 2, L.trimDark);
  rr(mx - 0.75 * T + 1, my - 0.28 * T + 1, 1.5 * T - 2, 0.56 * T - 2, 1.4, L.trim);
  return f.c;
}

/** A platform's top: a woven mat in the floor's green (or rose) inside a light wood border. */
function daisTop(L) {
  const f = fine(48, 48, 4), { g, rr, lin } = f;
  rr(0, 0, 48, 48, 0, lin(0, 0, 48, 48, [L.lite, L.wood]));
  rr(3, 3, 42, 42, 2, L.mat[0]);
  g.strokeStyle = L.mat[1]; g.lineWidth = 0.6;
  for (let i = 5; i < 44; i += 2.2) { g.beginPath(); g.moveTo(4, i); g.lineTo(44, i); g.stroke(); }
  g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 0.5;
  g.beginPath(); g.roundRect(5, 5, 38, 38, 1.4); g.stroke();
  return f.c;
}

/** A platform's side: a light wood board, a lit top edge, darker at the foot. */
function daisSide(L) {
  const f = fine(48, 6, 4), { g, rr, lin } = f;
  rr(0, 0, 48, 6, 0, lin(0, 0, 0, 6, [L.wood, L.dark]));
  g.fillStyle = 'rgba(255,240,210,0.45)'; g.fillRect(0, 0, 48, 0.7);
  return f.c;
}

/** A price card standing at a platform's front: cream, a green band with the leaf, the price big under it. */
function tagArt(text, L) {
  const f = fine(40, 26, 6), { g, rr } = f;
  rr(0.6, 1.2, 39, 24.6, 3, 'rgba(60,30,10,0.25)');
  rr(0, 0, 39, 24.6, 3, '#fbf3e0');
  rr(0, 0, 39, 8, [3, 3, 0, 0], L.trim);
  leaf(g, 6, 4, 2.6, '#fbf3e0');
  words(g, 'PRICE', 22, 4.2, 4.2, '#fbf3e0');
  g.fillStyle = '#f0c048'; g.beginPath(); g.arc(8, 16.4, 4, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#c89418'; star(g, 8, 16.4, 2.2);
  words(g, text, 24, 16.8, 11, '#5a3a20');
  return f.c;
}

/** The rope across the lift's doors until the second floor is open: two brass posts, a red rope and its sign. */
function ropeArt() {
  const f = fine(30, 12, 6), { g, rr } = f;
  rr(0.5, 0.5, 29, 11, 2, LOOK[2].trim);
  rr(1.6, 1.6, 26.8, 8.8, 1.4, '#ffffff');
  words(g, '2F CLOSED', 15, 6.2, 4.4, LOOK[2].dark);
  return f.c;
}

/** The lift's header: a wood fascia with a leaf-green band, and a brass dial reading 1 and 2 (its needle is a mesh). */
function liftDialArt(L) {
  const f = fine(40, 14, 8), { g, rr, lin } = f;
  rr(0, 0, 40, 14, 0, lin(0, 0, 0, 14, [L.lite, L.wood]));
  for (let x = 0; x < 40; x += 3.2) { g.fillStyle = 'rgba(90,50,20,0.14)'; g.fillRect(x, 0, 0.25, 12); }
  rr(0, 12, 40, 2, 0, lin(0, 12, 0, 14, [L.trim, L.trimDark]));
  const cx = 20, cy = 10.6;
  g.fillStyle = 'rgba(60,30,10,0.25)'; g.beginPath(); g.arc(cx + 0.3, cy + 0.4, 8, Math.PI, 0); g.closePath(); g.fill();
  g.fillStyle = lin(0, cy - 8, 0, cy, ['#fff0b0', '#e0b040', '#a87818']); g.beginPath(); g.arc(cx, cy, 8, Math.PI, 0); g.closePath(); g.fill();
  g.fillStyle = '#fbf6ea'; g.beginPath(); g.arc(cx, cy, 6.6, Math.PI, 0); g.closePath(); g.fill();
  g.strokeStyle = L.dark; g.lineWidth = 0.3;
  for (let i = 0; i <= 8; i++) {
    const a = Math.PI + (0.25 + i / 8 * 0.5) * Math.PI;
    g.beginPath(); g.moveTo(cx + Math.cos(a) * 5.4, cy + Math.sin(a) * 5.4); g.lineTo(cx + Math.cos(a) * 6.2, cy + Math.sin(a) * 6.2); g.stroke();
  }
  for (const [n, a] of [['1', -0.75], ['2', -0.25]]) words(g, n, cx + Math.cos(a * Math.PI) * 3.9, cy + Math.sin(a * Math.PI) * 3.9 + 0.2, 2.6, L.dark);
  rr(cx - 8.4, cy, 16.8, 0.9, 0.3, '#a87818');
  return f.c;
}

/** The lift's two doors as one picture (each door shows its half): brushed champagne metal, a panel inset on each, and
    the store's leaf in a cream ring split down the middle. */
function liftDoorArt(L) {
  const f = fine(20, 36, 8), { g, rr, lin } = f;
  rr(0, 0, 20, 36, 0, lin(0, 0, 20, 0, ['#e8d6aa', '#f6ead0', '#dcc694', '#f2e2c0', '#e0cc9c']));
  for (let x = 0.4; x < 20; x += 0.7) { g.fillStyle = `rgba(${x % 1.4 < 0.7 ? '255,255,255' : '120,90,40'},0.08)`; g.fillRect(x, 0, 0.3, 36); }
  for (const x0 of [1.4, 11.4]) {
    g.strokeStyle = 'rgba(140,100,40,0.45)'; g.lineWidth = 0.4; g.strokeRect(x0, 2, 7.2, 32);
    g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 0.3; g.strokeRect(x0 + 0.35, 2.35, 7.2, 32);
  }
  g.fillStyle = 'rgba(90,60,20,0.5)'; g.fillRect(9.9, 0, 0.2, 36);
  g.fillStyle = '#fbf3e0'; g.beginPath(); g.arc(10, 14, 4.4, 0, Math.PI * 2); g.fill();
  g.strokeStyle = L.trimDark; g.lineWidth = 0.5; g.stroke();
  leaf(g, 10, 14, 3.1, L.trim);
  return f.c;
}

/** The call buttons beside the doors: a brass plate, up and down in round lit buttons. */
function liftCallArt(L) {
  const f = fine(7, 12, 10), { g, rr, lin, shine } = f, s = shine();
  rr(0, 0, 7, 12, 1.4, lin(0, 0, 0, 12, ['#fff0b0', '#d8a838', '#a87818']));
  rr(0.6, 0.6, 5.8, 10.8, 1, '#f6ecd0');
  for (const [y, up] of [[3.6, true], [8.4, false]]) {
    for (const c of [g, s]) {
      c.fillStyle = c === g ? '#6a5040' : '#000000'; c.beginPath(); c.arc(3.5, y, 2, 0, Math.PI * 2); c.fill();
      c.fillStyle = c === g ? '#ffd870' : '#ffd870';
      c.beginPath();
      if (up) { c.moveTo(3.5, y - 1.1); c.lineTo(4.7, y + 0.8); c.lineTo(2.3, y + 0.8); }
      else { c.moveTo(3.5, y + 1.1); c.lineTo(4.7, y - 0.8); c.lineTo(2.3, y - 0.8); }
      c.closePath(); c.fill();
    }
  }
  return f.c;
}

/** The counter's front: light wood boards, a green panel across the middle with the leaf in a cream ring. */
function counterArt(w, L) {
  const W = w * 16, f = fine(W, 14, 5), { g, rr, lin } = f;
  rr(0, 0, W, 14, 0, lin(0, 0, 0, 14, [L.lite, L.wood]));
  for (let x = 0; x < W; x += 4) { g.fillStyle = 'rgba(90,50,20,0.22)'; g.fillRect(x, 0, 0.35, 14); }
  rr(0, 0, W, 1.4, 0, L.lite);
  rr(3, 3.4, W - 6, 7.6, 1.4, lin(0, 3.4, 0, 11, [L.trim, L.trimDark]));
  g.fillStyle = '#fbf3e0'; g.beginPath(); g.arc(W / 2, 7.2, 3.2, 0, Math.PI * 2); g.fill();
  leaf(g, W / 2, 7.2, 2.2, L.trim);
  rr(0, 12.6, W, 1.4, 0, L.dark);
  return f.c;
}

/** The bookshelf behind the counter: three shelves of books, some leaning, a little plant on top. */
function shelfArt(L) {
  const f = fine(48, 40, 4), { g, rr } = f;
  rr(0, 0, 48, 40, 1, L.dark);
  rr(2, 2, 44, 36, 0.6, '#8a5a34');
  const books = ['#c84a3a', '#3a6aa8', '#e8b048', '#5a9a5a', '#8a5aa8', '#e4dcc8', '#2a8a80', '#a83a5a'];
  let n = 0;
  for (let r = 0; r < 3; r++) {
    const base = 2 + (r + 1) * 12;
    rr(1, base - 0.6, 46, 2, 0.4, L.wood);
    let x = 3.5;
    while (x < 44) {
      const w = 1.8 + (n * 7 % 5) * 0.35, h = 7 + (n * 11 % 4), lean = n % 9 === 4;
      if (x + w > 44.5) break;
      g.fillStyle = books[n % books.length];
      if (lean) { g.save(); g.translate(x, base - 0.6); g.rotate(0.28); g.fillRect(0, -h, w, h); g.restore(); x += w + 2.4; }
      else { g.fillRect(x, base - 0.6 - h, w, h); g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(x, base - 0.6 - h + 1.5, w, 0.6); x += w + 0.3; }
      n++;
      if (n % 7 === 0) x += 3;
    }
  }
  return f.c;
}

/** One floor of the store. `size` is the hall's ({ cols, rows, top, u }), so one camera fits both. Returns its group,
    the tiles it blocks, the spots you can walk up to (a stand each, the counter and the lift), the gold ring that marks a
    picked stand, the rope (hidden once the second floor is open), the lift (its doors, dial needle, how open) and its shopkeeper's place (js/mall-3d.js puts the
    Pokémon there, its sprite loading in). */
export function buildFloor(THREE, floor, size, upstairs) {
  const { cols, rows, top: TOP } = size, L = LOOK[floor];
  const tileX = (tx) => tx + 0.5 - cols / 2, tileZ = (ty) => ty + 0.5 - rows / 2;
  const group = new THREE.Group(), blocked = new Set(), spots = [];
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, ...o });
  const lit = (src, colour, k = 1) => std({ map: texOf(src), emissive: new THREE.Color(colour), emissiveMap: texOf(src.glow), emissiveIntensity: k, roughness: 0.9 });
  const edge = std({ color: '#3a3040' });

  const floorBox = new THREE.Mesh(new THREE.BoxGeometry(cols, 0.6, rows), [edge, edge, std({ map: texOf(floorArt(floor, size)), roughness: 0.6 }), edge, std({ color: '#6a3a28' }), edge]);
  floorBox.position.y = -0.3;
  floorBox.receiveShadow = true;
  group.add(floorBox);
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(cols + 0.8, 7, rows + 0.4), [edge, edge, edge, edge, std({ color: '#5a4434' }), edge]);
  plinth.position.set(0, -0.6 - 3.5, -0.2);
  group.add(plinth);
  const cap = std({ color: L.dark });
  const back = new THREE.Mesh(new THREE.BoxGeometry(cols + 0.8, TOP, 0.4), [cap, cap, cap, cap, lit(wallArt(floor, size), '#fff4dc', 1), cap]);
  back.position.set(0, TOP / 2, -rows / 2 - 0.2);
  back.receiveShadow = true;
  group.add(back);
  for (const s of [-1, 1]) {
    const inside = std({ map: texOf(sideArt(floor, s < 0, size)), roughness: 0.9 });
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.4, TOP, rows), s < 0 ? [inside, cap, cap, cap, cap, cap] : [cap, inside, cap, cap, cap, cap]);
    m.position.set(s * (cols / 2 + 0.2), TOP / 2, 0);
    m.receiveShadow = true;
    group.add(m);
  }

  // the platforms and their pieces, near life size
  const top = std({ map: texOf(daisTop(L)), roughness: 0.8 }), side = std({ map: texOf(daisSide(L)), roughness: 0.7 });
  // the tallest four along the back, so nothing in front hides a rug or a doll behind it
  const tall = (id) => (PIECES[id].flat ? PIECES[id].high : PIECES[id].wall ? 3 : trim(pieceArt(id, 0, 1)).h * PX);
  const stock = [...furnitureStock(undefined, floor)].sort((a, b) => tall(b) - tall(a));
  stock.forEach((id, i) => {
    const b = BAYS[i], p = PIECES[id], cx = tileX(b.x) + 0.5, cz = tileZ(b.y) + 0.5, H = DAIS_H;
    const spot = { id: `bay${i}`, kind: 'bay', piece: id, name: p.name, open: true, step: { ...b.step }, at: { x: cx, y: H + 0.01, z: cz } };
    spots.push(spot);
    for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) blocked.add(`${b.x + dx},${b.y + dy}`);
    const bay = new THREE.Group();
    bay.position.set(cx, 0, cz);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(DAIS, H, DAIS), [side, side, top, side, side, side]);
    slab.position.y = H / 2;
    slab.castShadow = slab.receiveShadow = true;
    bay.add(slab);
    const fit = Math.min(1.35, 1.8 / Math.max(p.w, p.h));   // small pieces a little larger than life, so they read on a platform
    const model = p.wall ? null : furnitureModel(THREE, id, (art) => std({ map: tex(art), roughness: 0.9 }));
    if (model) {
      // its 3D model (js/base-mesh.js), turned a little so its depth shows
      const k = Math.min(fit, b.tall / model.userData.top);
      model.scale.setScalar(k);
      model.position.y = H;
      model.rotation.y = -0.3;
      model.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
      bay.add(model);
    } else if (p.flat) {
      const k = Math.min(1, fit), h = Math.max(0.04, p.high * k), s = std({ color: p.side, roughness: 0.95 });
      const box = new THREE.Mesh(new THREE.BoxGeometry(p.w * k, h, p.h * k), [s, s, std({ map: tex(pieceArt(id, 0, HD)), alphaTest: 0.5, roughness: 0.9 }), s, s, s]);
      box.position.y = H + h / 2;
      box.castShadow = h > 0.1; box.receiveShadow = true;
      bay.add(box);
    } else {
      const cut = trim(pieceArt(id, 0, HD)), w = cut.w * PX, h = cut.h * PX, k = Math.min(1.35, 1.6 / w, b.tall / h);
      const board = new THREE.Mesh(new THREE.PlaneGeometry(w * k, h * k), std({ map: tex(cut.c), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1 }));
      board.position.set(0, H + h * k / 2 + (p.wall ? 0.08 : 0), p.wall ? -0.5 : 0);
      board.castShadow = true;
      bay.add(board);
      if (p.wall) {   // a wall piece hangs on a little display board of its own, on two legs
        const panel = new THREE.Mesh(new THREE.BoxGeometry(w * k + 0.2, h * k + 0.2, 0.06), std({ color: '#fbf3e0' }));
        panel.position.set(0, H + h * k / 2 + 0.08, -0.55);
        panel.castShadow = true;
        bay.add(panel);
      }
    }
    // the price card on a little wooden easel at the platform's front
    const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.4), std({ map: texOf(tagArt(price(p.price), L)), alphaTest: 0.3, roughness: 0.7 }));
    tag.position.set(0.5, H + 0.24, DAIS / 2 - 0.08);
    tag.rotation.x = -0.3;
    tag.castShadow = true;
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.24, 0.05), std({ color: L.dark }));
    leg.position.set(0.5, H + 0.1, DAIS / 2 - 0.16);
    bay.add(tag, leg);
    bay.traverse(o => { o.userData.front = spot; });
    group.add(bay);
  });

  // the counter at the right, a bookshelf against the wall behind it, and the shopkeeper's place between them
  const keeper = { id: 'keeper', kind: 'keeper', name: KEEPERS[floor].name, open: true, step: { x: COUNTER.x + 1, y: COUNTER.y + 1 } };
  spots.push(keeper);
  for (let x = COUNTER.x; x < COUNTER.x + COUNTER.w; x++) for (let y = 0; y <= COUNTER.y; y++) blocked.add(`${x},${y}`);
  const desk = new THREE.Group();
  desk.position.set(tileX(COUNTER.x + 1), 0, tileZ(COUNTER.y));
  const wood = std({ color: L.wood, roughness: 0.7 }), deskTop = std({ color: L.lite, roughness: 0.5 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(COUNTER.w - 0.1, 0.8, 0.72), [wood, wood, wood, wood, std({ map: texOf(counterArt(COUNTER.w, L)), roughness: 0.7 }), wood]);
  body.position.y = 0.4;
  body.castShadow = body.receiveShadow = true;
  const slabTop = new THREE.Mesh(new THREE.BoxGeometry(COUNTER.w + 0.04, 0.08, 0.86), deskTop);
  slabTop.position.y = 0.84;
  slabTop.castShadow = slabTop.receiveShadow = true;
  const till = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.26, 0.32), std({ color: '#e4e0d8', roughness: 0.5 }));
  till.position.set(-0.9, 1.01, -0.1);
  const screen = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 0.04), std({ color: '#2a3440', emissive: new THREE.Color('#60c0a0'), emissiveIntensity: 0.6 }));
  screen.position.set(-0.9, 1.22, -0.2);
  screen.rotation.x = -0.4;
  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), std({ color: '#e8c050', metalness: 0.7, roughness: 0.3 }));
  bell.position.set(0.2, 0.88, 0.18);
  desk.add(body, slabTop, till, screen, bell);
  const sprig = trim(pieceArt('plant', 0, HD)), sw = sprig.w * PX * 0.55, sh = sprig.h * PX * 0.55;
  const pot = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), std({ map: tex(sprig.c), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1 }));
  pot.position.set(1.05, 0.88 + sh / 2, -0.05);
  desk.add(pot);
  desk.traverse(o => { o.userData.front = keeper; });
  group.add(desk);
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(COUNTER.w - 0.2, 2.3, 0.45), [cap, cap, cap, cap, std({ map: texOf(shelfArt(L)), roughness: 0.8 }), cap]);
  shelf.position.set(tileX(COUNTER.x + 1), 1.15, -rows / 2 + 0.24);
  shelf.castShadow = shelf.receiveShadow = true;
  group.add(shelf);
  const leafy = trim(pieceArt('plant', 0, HD)), lw = leafy.w * PX * 1.3, lh = leafy.h * PX * 1.3;
  const tree = new THREE.Mesh(new THREE.PlaneGeometry(lw, lh), std({ map: tex(leafy.c), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1 }));
  tree.position.set(tileX(cols - 1), lh / 2, tileZ(rows - 1));
  tree.castShadow = true;
  group.add(tree);
  blocked.add(`${cols - 1},${rows - 1}`);

  // the lift at the back right (LIFT): a timber case against the back wall, its car lit inside, two doors that slide
  // apart into its sides, a brass dial over them and call buttons beside them (js/mall-3d.js opens and rides it)
  for (let x = 10; x <= 12; x++) for (let y = 0; y < 2; y++) blocked.add(`${x},${y}`);
  const liftSpot = { id: 'lift', kind: 'lift', name: floor === 1 ? 'Lift up' : 'Lift down', open: true, step: { ...LIFT.foot } };
  spots.push(liftSpot);
  const liftGroup = new THREE.Group();
  liftGroup.position.set(tileX(LIFT.x), 0, -rows / 2);
  const put = (geo, m, x, y, z, shadow = true) => {
    const o = new THREE.Mesh(geo, m);
    o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true;
    liftGroup.add(o);
    return o;
  };
  const timber = std({ color: L.wood, roughness: 0.7 }), lite = std({ color: L.lite, roughness: 0.7 }), dark = std({ color: L.dark, roughness: 0.8 });
  const brass = std({ color: '#e0b040', metalness: 0.7, roughness: 0.3 }), champagne = std({ color: '#e4d0a0', metalness: 0.5, roughness: 0.35 });
  const PW = (LIFT_W - 1) / 2;   // each side's width: the doorway is a tile across
  for (const sgn of [-1, 1]) {
    put(new THREE.BoxGeometry(PW, LIFT_H, LIFT_D), timber, sgn * (0.5 + PW / 2), LIFT_H / 2, LIFT_D / 2);
    put(new THREE.BoxGeometry(0.08, LIFT_DOOR + 0.04, 0.06), lite, sgn * 0.54, (LIFT_DOOR + 0.04) / 2, LIFT_D + 0.03);
    put(new THREE.BoxGeometry(PW + 0.06, 0.12, LIFT_D + 0.06), dark, sgn * (0.5 + PW / 2), 0.06, LIFT_D / 2);
  }
  const ceiling = std({ color: '#fff4d8', emissive: new THREE.Color('#ffe8b0'), emissiveIntensity: 0.9 });
  put(new THREE.BoxGeometry(LIFT_W, LIFT_H - LIFT_DOOR, LIFT_D), [timber, timber, timber, ceiling, std({ map: texOf(liftDialArt(L)), roughness: 0.7 }), timber],
    0, (LIFT_H + LIFT_DOOR) / 2, LIFT_D / 2);
  put(new THREE.BoxGeometry(LIFT_W + 0.12, 0.1, LIFT_D + 0.12), dark, 0, LIFT_H + 0.05, LIFT_D / 2);
  // the car: a warm-lit back panel, a wood floor, a brass handrail
  put(new THREE.PlaneGeometry(1, LIFT_DOOR), std({ color: '#f6e6c4', emissive: new THREE.Color('#ffe0a8'), emissiveIntensity: 0.3 }), 0, LIFT_DOOR / 2, 0.01, false);
  put(new THREE.BoxGeometry(1, 0.02, LIFT_D), std({ color: L.wood, roughness: 0.6 }), 0, 0.01, LIFT_D / 2, false);
  put(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 10), brass, 0, 0.85, 0.1, false).rotation.z = Math.PI / 2;
  // the dial's needle, turning about its foot (rotation.z: 1F left, 2F right)
  const needle = new THREE.Group();
  needle.position.set(0, LIFT_H - 10.6 / 14 * (LIFT_H - LIFT_DOOR), LIFT_D + 0.006);
  const hand = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.25, 0.008), std({ color: '#3a2418' }));
  hand.position.y = 0.11;
  needle.add(hand, new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.012, 14), brass).rotateX(Math.PI / 2));
  needle.rotation.z = floor === 1 ? Math.PI / 4 : -Math.PI / 4;
  liftGroup.add(needle);
  // the doors, each showing its half of the picture
  const doorTex = texOf(liftDoorArt(L)), doors = [-1, 1].map(sgn => {
    const map = doorTex.clone();
    map.repeat.set(0.5, 1); map.offset.set(sgn < 0 ? 0 : 0.5, 0); map.needsUpdate = true;
    const face = std({ map, metalness: 0.45, roughness: 0.35 });
    const d = put(new THREE.BoxGeometry(0.5, LIFT_DOOR, 0.04), [champagne, champagne, champagne, champagne, face, champagne], sgn * 0.25, LIFT_DOOR / 2, LIFT_D - 0.08);
    d.userData.home = sgn * 0.25; d.userData.side = sgn;
    return d;
  });
  put(new THREE.PlaneGeometry(0.15, 0.26), lit(liftCallArt(L), '#ffd870', 0.6), 0.5 + PW / 2, 1, LIFT_D + 0.004, false);
  let rope = null;
  if (floor === 1 && !upstairs) {
    rope = new THREE.Group();
    for (const x of [-0.6, 0.6]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.07, 0.7, 10), brass);
      post.position.set(x, 0.35, LIFT_D + 0.3);
      post.castShadow = true;
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), brass);
      knob.position.set(x, 0.72, LIFT_D + 0.3);
      rope.add(post, knob);
    }
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-0.6, 0.66, LIFT_D + 0.3), new THREE.Vector3(0, 0.36, LIFT_D + 0.3), new THREE.Vector3(0.6, 0.66, LIFT_D + 0.3));
    rope.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.03, 6), std({ color: '#c8283a', roughness: 0.6 })));
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.24), std({ map: texOf(ropeArt()) }));
    sign.position.set(0, 0.4, LIFT_D + 0.34);
    rope.add(sign);
    liftGroup.add(rope);
  }
  // the lift answers a tap anywhere on it: an invisible box over the whole of it
  put(new THREE.BoxGeometry(LIFT_W, LIFT_H, LIFT_D + 0.4), new THREE.MeshBasicMaterial({ visible: false }), 0, LIFT_H / 2, LIFT_D / 2 + 0.2, false);
  liftGroup.traverse(o => { o.userData.front = liftSpot; });
  group.add(liftGroup);
  const lift = { doors, needle, open: 0, want: 0, dial: floor };

  const ring = new THREE.Mesh(new THREE.RingGeometry(0.98, 1.08, 64), new THREE.MeshBasicMaterial({ color: '#f8d040', transparent: true, opacity: 0.9, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  ring.visible = false;
  ring.raycast = () => {};
  group.add(ring);

  return { group, blocked, spots, ring, rope, lift, keeper: { ...KEEPERS[floor], x: tileX(COUNTER.x + 1), z: tileZ(COUNTER.y - 1) }, top: 4.4, title: floor === 1 ? 'Furniture' : 'Furniture 2F' };
}

export const upstairsLine = () => `Upstairs there are 8 more pieces every day. Shall I open it for ${price(UPSTAIRS_PRICE)} PokéCoins? Tap again.`;
