/* mall-furniture.js  -  the Poké Mall's Furniture store (roadmap 5a; branch secret-base): its front in the hall, glass
   with two of the day's pieces on show behind it, and its two 3D shop floors, the day's stock (furnitureStock()) standing
   on plinths as the real pieces, each with its price tag. The second floor (`secretBase.upstairs`, bought once) holds the
   next STOCK pieces of the same day's shuffle; its stair at the back right is roped off until it's open. Painted smooth
   like the hall (fine()), the furniture in its own pixels (pieceArt()). js/mall-3d.js walks it; this file only builds it. */

import { PIECES, pieceArt, furnitureStock, UPSTAIRS_PRICE } from './secret-base.js';
import { tex, trim } from './hd2d.js';
import { furnitureModel } from './base-mesh.js';
import { fine, texOf, words, star } from './hub-3d.js';
import { RES, HD } from './base-paint.js';

const PX = 1 / (16 * RES);   // one of a piece's painted pixels, in tiles
export const STAIR_H = 2.6;   // the stair's top, up at the back wall
export const STAIR = { x: 11, foot: { x: 11, y: 4 }, climb: [{ x: 11, y: 3 }, { x: 11, y: 2 }, { x: 11, y: 1 }, { x: 11, y: 0 }] };
/* Laid out like Animal Crossing's Nook's Cranny (the user's pick, 2026-10-08): teal stands with a gold price plaque, a
   row along the back wall and a lower row staggered in front of it, and a counter at the right with the floor's
   shopkeeper behind it, a bookshelf at its back. Since 2026-10-09 each stand takes one tile, with a free tile between,
   so you can walk round them (the user's ask: the 2 x 2 stands boxed the room in). `x, y` a stand's tile, `step` where
   you stand to look at it, `h` its height, `tall` how tall its piece may stand (low ones in front so the back row shows). */
const BAYS = [
  ...[0, 2, 4, 6].map(x => ({ x, y: 0, step: { x, y: 1 }, h: 0.4, tall: 1.75 })),
  ...[1, 3, 5, 7].map(x => ({ x, y: 3, step: { x, y: 4 }, h: 0.3, tall: 1.1 })),
];
const STAND = 0.84;   // a stand's width, a little under its tile
const COUNTER = { x: 8, y: 4, w: 3 };   // its tiles, left to right; the shopkeeper stands a tile behind its middle
const LOOK = {
  1: { paper: ['#f2a462', '#e8965a'], wood: '#7a4a2c', dark: '#4a2c1a', trim: '#2a9a90', sign: '#2a9a90',
    floor: ['#9a5a40', '#8a4c36', '#7e4432', '#5a3024'] },
  2: { paper: ['#f6cfc8', '#eebfb8'], wood: '#8a4a5a', dark: '#5a2c3a', trim: '#c8566a', sign: '#c8566a',
    floor: ['#7a5a8a', '#6a4a7a', '#4e3460'] },
};
export const STORE_COLOUR = LOOK[1].trim;
const TEAL = { top: '#3fa89e', hi: '#62c2b6', side: '#2a8a80', deep: '#1e6a62' };

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

/** Wallpaper the height of a wall: its colour with a faint stripe, a crown moulding at the top of the shop's storey and a
    dark wood skirting along the floor. `wy` turns a height into the painting's y. */
function paper(f, W, H, L, wy) {
  const { g, rr, lin } = f;
  g.fillStyle = L.paper[0]; g.fillRect(0, 0, W, H);
  g.fillStyle = L.paper[1];
  for (let x = 0; x < W; x += 10) g.fillRect(x, 0, 4, H);
  g.fillStyle = 'rgba(255,255,255,0.08)';
  for (let x = 5; x < W; x += 10) g.fillRect(x, 0, 0.6, H);
  rr(0, wy(5.15), W, 2.6, 0, lin(0, wy(5.15), 0, wy(5.15) + 2.6, [L.wood, L.dark]));
  const sk = wy(0.32), rail = wy(1.15);
  // wainscoting up to a chair rail, in raised panels, so the wall under the stands reads as a room's
  g.fillStyle = 'rgba(80,40,20,0.14)'; g.fillRect(0, rail, W, sk - rail);
  for (let x = 3; x + 18 < W; x += 22) {
    g.strokeStyle = 'rgba(60,30,10,0.22)'; g.lineWidth = 0.7; g.strokeRect(x + 0.4, rail + 3.4, 18, sk - rail - 6);
    g.strokeStyle = 'rgba(255,255,255,0.16)'; g.strokeRect(x, rail + 3, 18, sk - rail - 6);
  }
  rr(0, rail - 1, W, 2.2, 0, lin(0, rail - 1, 0, rail + 1.2, [L.wood, L.dark]));
  g.fillStyle = 'rgba(255,255,255,0.2)'; g.fillRect(0, rail - 1, W, 0.5);
  rr(0, sk, W, H - sk, 0, lin(0, sk, 0, H, [L.wood, L.dark]));
  g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(0, sk, W, 0.6);
}

/** Bunting strung from x0 to x1 at y, sagging in the middle: little cloth pennants in turn. */
function bunting(g, x0, x1, y, sag, cols) {
  const at = (t) => [x0 + (x1 - x0) * t, y + Math.sin(t * Math.PI) * sag];
  g.strokeStyle = '#5a4030'; g.lineWidth = 0.5;
  g.beginPath(); g.moveTo(x0, y); g.quadraticCurveTo((x0 + x1) / 2, y + sag * 2, x1, y); g.stroke();
  const n = Math.round(Math.abs(x1 - x0) / 7);
  for (let i = 0; i < n; i++) {
    const [ax, ay] = at((i + 0.15) / n), [bx, by] = at((i + 0.85) / n);
    g.fillStyle = cols[i % cols.length];
    g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.lineTo((ax + bx) / 2, (ay + by) / 2 + 5.5); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.22)';
    g.beginPath(); g.moveTo(ax, ay); g.lineTo((ax + bx) / 2, (ay + by) / 2); g.lineTo((ax + bx) / 2, (ay + by) / 2 + 5.5); g.fill();
  }
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
    posters and framed pictures, a clock over the counter, tall windows up high for a tall phone, and on the ground floor
    the lit doorway the stair climbs to. */
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
  const flags = floor === 1 ? [L.trim, '#fbf3e4', '#e4584a', '#f0c040'] : [L.trim, '#fbf3e4', '#7a9ad8', '#f0c8d0'];
  bunting(g, 0, W * 0.5, wy(5.15) + 2.8, 3, flags);
  bunting(g, W * 0.5, W, wy(5.15) + 2.8, 3, flags);
  // the sign over the back stand: a wooden board hung on two chains, a teal sofa and the name, lit
  const sx = wx(4), sw = 4.6 * U, sy = wy(4.75), sh = 18;
  g.strokeStyle = '#3a3a44'; g.lineWidth = 0.6;
  for (const x of [sx - sw / 2 + 8, sx + sw / 2 - 8]) { g.beginPath(); g.moveTo(x, wy(5.15) + 2.6); g.lineTo(x, sy); g.stroke(); }
  rr(sx - sw / 2, sy, sw, sh, 3, L.dark);
  rr(sx - sw / 2 + 1.4, sy + 1.4, sw - 2.8, sh - 2.8, 2.2, lin(0, sy, 0, sy + sh, ['#a8724a', L.wood]));
  sofa(g, sx - sw / 2 + 12, sy + sh / 2 - 0.4, 4.4, L.sign);
  const name = floor === 1 ? 'FURNITURE' : 'FURNITURE 2F';
  words(g, name, sx + 7, sy + sh / 2 + 0.2, floor === 1 ? 9 : 7.8, '#fbf0d8');
  s.fillStyle = '#806040'; s.beginPath(); s.roundRect(sx - sw / 2 + 1.4, sy + 1.4, sw - 2.8, sh - 2.8, 2.2); s.fill();
  words(s, name, sx + 7, sy + sh / 2 + 0.2, floor === 1 ? 9 : 7.8, '#ffe0a0');
  // big posters either side of it, pictures and a clock over the counter's bookshelf, little frames between the stands
  const one = floor === 1;
  poster(g, wx(-0.3), wy(4.95), 28, 40, ...(one ? ['#e4584a', '#fbe6c8', 'flower', 'NEW!'] : ['#7a9ad8', '#fbf0e0', 'ball', 'COZY']));
  poster(g, wx(6.4), wy(4.95), 30, 40, ...(one ? ['#5aa060', '#fbf3e4', 'hill', 'HOME'] : ['#e88aa0', '#fbf3e4', 'sofa', 'RELAX']));
  frame(g, wx(8.1), wy(4.45), 20, 15, L);
  clock(g, wx(9.5), wy(4.05), 8, L);
  frame(g, wx(9.95), wy(4.45), 20, 15, L, '#f8c8a0');
  for (const t of [1, 3, 5]) frame(g, wx(t + 0.5) - 6, wy(3.35), 12, 10, L, ['#c8e0f0', '#f8d8a8', '#d8c8f0'][t >> 1]);
  if (!one) poster(g, wx(11.2), wy(4.9), 30, 40, '#3fa89e', '#fbf3e4', 'sofa', 'SALE');
  if (floor === 1) {
    const x0 = wx(STAIR.x) + 3, x1 = wx(STAIR.x + 2) - 3, top = wy(STAIR_H + 1.8), foot = wy(STAIR_H);
    rr(x0 - 2, top - 2, x1 - x0 + 4, foot - top + 2, 1.4, L.dark);
    rr(x0, top, x1 - x0, foot - top, 1, lin(0, top, 0, foot, ['#ffe8b0', '#ffc878', '#c8884a']));
    s.fillStyle = '#c0a070'; s.beginPath(); s.roundRect(x0, top, x1 - x0, foot - top, 1); s.fill();
    rr((x0 + x1) / 2 - 7, top - 13, 14, 9, 2, L.sign);
    words(g, '2F', (x0 + x1) / 2, top - 8.4, 6.4, '#ffffff');
    s.fillStyle = '#ffffff'; words(s, '2F', (x0 + x1) / 2, top - 8.4, 6.4, '#ffffff');
  }
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
    poster(g, at(3.5) - 14, wy(4.6), 28, 40, '#d8463c', '#fbe6c8', 'ball', 'SHOP');
    swatches(g, at(5.4) - 13, wy(4.1), 26, 30, L);
    bunting(g, at(6.5), at(0.5), wy(5.15) + 2.8, 3, [L.trim, '#fbf3e4', '#f0c040']);
  } else {
    frame(g, at(2) - 10, wy(4.7), 20, 15, L, '#c8e0f0');
    poster(g, at(5.3) - 14, wy(4.6), 28, 40, '#3fa89e', '#fbf3e4', 'sofa', 'COMFY');
    bunting(g, at(0.5), at(6.5), wy(5.15) + 2.8, 3, [L.trim, '#fbf3e4', '#f0c040']);
  }
  return f.c;
}

/** The floor: terracotta tiles in a basket weave downstairs (Nook's), a carpet upstairs, a red rug by the counter and a
    welcome mat at the way in, and upstairs the stairwell going down at the back right, its steps darker the deeper. */
function floorArt(floor, { cols, rows }) {
  const T = 16, L = LOOK[floor], f = fine(cols * T, rows * T, 5), { g, rr, lin } = f;
  if (floor === 1) {
    g.fillStyle = L.floor[3]; g.fillRect(0, 0, cols * T, rows * T);
    for (let by = 0; by < rows * 2; by++) for (let bx = 0; bx < cols * 2; bx++) {
      const x = bx * 8, y = by * 8, flat = (bx + by) % 2;
      for (let k = 0; k < 2; k++) {
        const col = L.floor[(bx * 7 + by * 13 + k * 5) % 3];
        if (flat) rr(x + 0.35, y + 0.35 + k * 4, 7.3, 3.3, 0.5, col);
        else rr(x + 0.35 + k * 4, y + 0.35, 3.3, 7.3, 0.5, col);
      }
    }
    g.fillStyle = 'rgba(255,220,180,0.07)'; g.fillRect(0, 0, cols * T, rows * T);
  } else {
    g.fillStyle = L.floor[0]; g.fillRect(0, 0, cols * T, rows * T);
    g.fillStyle = L.floor[1];
    for (let y = 0; y < rows * T; y += 8) for (let x = (y / 8) % 2 ? 4 : 0; x < cols * T; x += 8) { g.beginPath(); g.arc(x, y, 1.2, 0, Math.PI * 2); g.fill(); }
  }
  // a rug in front of the counter, a pattern woven into it
  const rx = 9.2 * T, ry = 5.2 * T, rw = 3.6 * T, rh = 1.6 * T;
  rr(rx, ry, rw, rh, 1.4, floor === 1 ? '#a82a34' : '#3a7a8a');
  g.strokeStyle = floor === 1 ? '#d8585a' : '#6ab0c0'; g.lineWidth = 1.2;
  g.beginPath(); g.roundRect(rx + 2.5, ry + 2.5, rw - 5, rh - 5, 1); g.stroke();
  g.fillStyle = floor === 1 ? '#d8585a' : '#6ab0c0';
  for (let i = 0; i < 4; i++) {
    const cx = rx + rw * (i + 0.5) / 4, cy = ry + rh / 2;
    g.beginPath(); g.moveTo(cx, cy - 5); g.lineTo(cx + 4, cy); g.lineTo(cx, cy + 5); g.lineTo(cx - 4, cy); g.fill();
  }
  rr(6 * T + 1.5, (rows - 1) * T + 2.5, T - 3, T - 5, 2, L.trim);
  words(g, 'HELLO', 6.5 * T, (rows - 0.5) * T, 3.2, '#ffffff');
  if (floor === 2) {
    const x0 = STAIR.x * T, x1 = (STAIR.x + 2) * T, y1 = 4 * T;
    rr(x0, 0, x1 - x0, y1, 0, '#1a1420');
    for (let i = 0; i < 8; i++) {
      const y = y1 - (i + 1) * 8, k = 1 - i / 9;
      g.fillStyle = `rgb(${Math.round(200 * k)},${Math.round(160 * k)},${Math.round(120 * k)})`; g.fillRect(x0 + 1, y + 1, x1 - x0 - 2, 5.5);
      g.fillStyle = `rgba(0,0,0,${0.3 + i * 0.07})`; g.fillRect(x0 + 1, y + 6.5, x1 - x0 - 2, 1.5);
    }
    g.fillStyle = lin(0, 0, 0, y1, ['rgba(0,0,0,0.85)', 'rgba(0,0,0,0)']); g.fillRect(x0, 0, x1 - x0, y1);
  }
  return f.c;
}

/** A stand's top: Nook's teal, a lighter bevel round its edge. */
function standTop() {
  const f = fine(32, 32, 4), { g, rr } = f;
  rr(0, 0, 32, 32, 0, TEAL.hi);
  rr(1.6, 1.6, 28.8, 28.8, 1, TEAL.top);
  g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(1.6, 1.6, 28.8, 9);
  return f.c;
}

/** A stand's side: teal, darker at the foot, a thin light edge along its top. */
function standSide() {
  const f = fine(32, 8, 4), { g, rr, lin } = f;
  rr(0, 0, 32, 8, 0, lin(0, 0, 0, 8, [TEAL.side, TEAL.deep]));
  g.fillStyle = TEAL.hi; g.fillRect(0, 0, 32, 0.7);
  return f.c;
}

/** A stand's gold plaque: a brass plate, a coin and the price. */
function plaqueArt(text) {
  const f = fine(40, 12, 6), { g, rr, lin } = f;
  rr(0.3, 0.3, 39.4, 11.4, 1.6, '#8a6418');
  rr(1, 1, 38, 10, 1.2, lin(0, 1, 0, 11, ['#ffe48a', '#f0c048', '#c89428']));
  g.fillStyle = '#fff6c8'; g.beginPath(); g.arc(8, 6, 3.2, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#c89418'; star(g, 8, 6, 1.8);
  words(g, text, 23, 6.4, 6.4, '#5a3a10');
  return f.c;
}

/** The rope across the stair's foot until the second floor is open: two brass posts, a red rope and its sign. */
function ropeArt() {
  const f = fine(30, 12, 6), { g, rr } = f;
  rr(0.5, 0.5, 29, 11, 2, LOOK[2].trim);
  rr(1.6, 1.6, 26.8, 8.8, 1.4, '#ffffff');
  words(g, '2F CLOSED', 15, 6.2, 4.4, LOOK[2].dark);
  return f.c;
}

/** The counter's front: dark red wood in raised panels, a lighter rail along its top. */
function counterArt(w) {
  const f = fine(w * 16, 14, 5), { g, rr, lin } = f;
  rr(0, 0, w * 16, 14, 0, lin(0, 0, 0, 14, ['#8a3a2e', '#6a2a22']));
  rr(0, 0, w * 16, 1.6, 0, '#b4584a');
  for (let x = 2; x < w * 16 - 4; x += 12) {
    rr(x, 3.2, 10, 8.6, 0.8, '#7a3228');
    rr(x + 0.8, 4, 8.4, 7, 0.6, lin(0, 4, 0, 11, ['#9a4636', '#7e3428']));
  }
  return f.c;
}

/** The bookshelf behind the counter: three shelves of books, some leaning, a little plant on top. */
function shelfArt(L) {
  const f = fine(48, 40, 4), { g, rr } = f;
  rr(0, 0, 48, 40, 1, L.dark);
  rr(2, 2, 44, 36, 0.6, '#3a2216');
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
    the tiles it blocks, the spots you can walk up to (a stand each, the counter and the stair), the gold ring that marks a
    picked stand, the rope (hidden once the second floor is open) and its shopkeeper's place (js/mall-3d.js puts the
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

  // the stands and their pieces
  const top = std({ map: texOf(standTop()), roughness: 0.55 }), side = std({ map: texOf(standSide()), roughness: 0.7 });
  const stock = furnitureStock(undefined, floor);
  stock.forEach((id, i) => {
    const b = BAYS[i], p = PIECES[id], cx = tileX(b.x), cz = tileZ(b.y), H = b.h;
    const spot = { id: `bay${i}`, kind: 'bay', piece: id, name: p.name, open: true, step: { ...b.step }, at: { x: cx, y: H + 0.01, z: cz } };
    spots.push(spot);
    blocked.add(`${b.x},${b.y}`);
    const bay = new THREE.Group();
    bay.position.set(cx, 0, cz);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(STAND, H, STAND), [side, side, top, side, side, side]);
    slab.position.y = H / 2;
    slab.castShadow = slab.receiveShadow = true;
    bay.add(slab);
    const model = p.wall ? null : furnitureModel(THREE, id, (art) => std({ map: tex(art), roughness: 0.9 }));
    if (model) {
      // its 3D model (js/base-mesh.js), turned a little so its depth shows
      const w = Math.hypot(p.w, p.h), k = Math.min(1, 1.3 / w, b.tall / model.userData.top);
      model.scale.setScalar(k);
      model.position.y = H;
      model.rotation.y = -0.45;
      model.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
      bay.add(model);
    } else if (p.flat) {
      const k = Math.min(1, 0.96 / Math.max(p.w, p.h)), h = Math.max(0.04, p.high * k), s = std({ color: p.side, roughness: 0.95 });
      const box = new THREE.Mesh(new THREE.BoxGeometry(p.w * k, h, p.h * k), [s, s, std({ map: tex(pieceArt(id, 0, HD)), alphaTest: 0.5, roughness: 0.9 }), s, s, s]);
      box.position.y = H + h / 2;
      box.castShadow = h > 0.1; box.receiveShadow = true;
      bay.add(box);
    } else {
      const cut = trim(pieceArt(id, 0, HD)), w = cut.w * PX, h = cut.h * PX, k = Math.min(1, 1.25 / w, b.tall / h);
      const board = new THREE.Mesh(new THREE.PlaneGeometry(w * k, h * k), std({ map: tex(cut.c), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1 }));
      board.position.set(0, H + h * k / 2, p.wall ? -0.2 : 0);
      board.castShadow = true;
      bay.add(board);
      if (p.wall) {   // a wall piece hangs on a little display board of its own
        const panel = new THREE.Mesh(new THREE.BoxGeometry(w * k + 0.16, h * k + 0.16, 0.06), std({ color: '#efe6d4' }));
        panel.position.set(0, H + h * k / 2, -0.25);
        panel.castShadow = true;
        bay.add(panel);
      }
    }
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.18), std({ map: texOf(plaqueArt(price(p.price))), metalness: 0.3, roughness: 0.45 }));
    plaque.position.set(0, H / 2, STAND / 2 + 0.005);
    bay.add(plaque);
    bay.traverse(o => { o.userData.front = spot; });
    group.add(bay);
  });

  // the counter at the right, a bookshelf against the wall behind it, and the shopkeeper's place between them
  const keeper = { id: 'keeper', kind: 'keeper', name: KEEPERS[floor].name, open: true, step: { x: COUNTER.x + 1, y: COUNTER.y + 1 } };
  spots.push(keeper);
  for (let x = COUNTER.x; x < COUNTER.x + COUNTER.w; x++) for (let y = 0; y <= COUNTER.y; y++) blocked.add(`${x},${y}`);
  const desk = new THREE.Group();
  desk.position.set(tileX(COUNTER.x + 1), 0, tileZ(COUNTER.y));
  const wood = std({ color: '#6a2a22', roughness: 0.7 }), deskTop = std({ color: '#9a4434', roughness: 0.5 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(COUNTER.w - 0.1, 0.8, 0.72), [wood, wood, wood, wood, std({ map: texOf(counterArt(COUNTER.w)), roughness: 0.7 }), wood]);
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

  // the stair: up to the doorway on the ground floor, a stairwell going down on the second
  for (let x = STAIR.x; x < STAIR.x + 2; x++) for (let y = 0; y < 4; y++) blocked.add(`${x},${y}`);
  const sx = tileX(STAIR.x) + 0.5, zFront = tileZ(3) + 0.5;
  const stair = { id: 'stairs', kind: 'stairs', name: floor === 1 ? 'Second floor' : 'Ground floor', open: true, step: { ...STAIR.foot } };
  spots.push(stair);
  const steel = std({ color: '#d8dce6', metalness: 0.6, roughness: 0.3 });
  const stairGroup = new THREE.Group();
  let rope = null;
  if (floor === 1) {
    const tread = std({ color: '#b4844e', roughness: 0.7 }), riser = std({ color: '#fbf6ea' });
    for (let i = 0; i < 8; i++) {
      const h = (i + 1) * STAIR_H / 8;
      const step = new THREE.Mesh(new THREE.BoxGeometry(2, h, 0.5), [riser, riser, tread, riser, riser, riser]);
      step.position.set(sx, h / 2, zFront - (i + 0.5) * 0.5);
      step.castShadow = step.receiveShadow = true;
      stairGroup.add(step);
    }
    const run = Math.hypot(4, STAIR_H), rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, run), steel);
    rail.position.set(sx - 0.97, STAIR_H / 2 + 0.75, zFront - 2);
    rail.rotation.x = Math.atan2(STAIR_H, 4);
    stairGroup.add(rail);
    for (let i = 0; i < 4; i++) {
      const z = zFront - 0.25 - i * 1.15, y = (zFront - z) / 4 * STAIR_H;
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.75, 0.04), steel);
      post.position.set(sx - 0.97, y + 0.375, z);
      stairGroup.add(post);
    }
    if (!upstairs) {
      rope = new THREE.Group();
      const brass = std({ color: '#e0b040', metalness: 0.7, roughness: 0.3 });
      for (const x of [sx - 0.85, sx + 0.85]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.07, 0.7, 10), brass);
        post.position.set(x, 0.35, zFront + 0.2);
        post.castShadow = true;
        const knob = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), brass);
        knob.position.set(x, 0.72, zFront + 0.2);
        rope.add(post, knob);
      }
      const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(sx - 0.85, 0.66, zFront + 0.2), new THREE.Vector3(sx, 0.36, zFront + 0.2), new THREE.Vector3(sx + 0.85, 0.66, zFront + 0.2));
      rope.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.03, 6), std({ color: '#c8283a', roughness: 0.6 })));
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.24), std({ map: texOf(ropeArt()) }));
      sign.position.set(sx, 0.4, zFront + 0.24);
      rope.add(sign);
      stairGroup.add(rope);
    }
  } else {
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(4, 0.55), std({ color: '#cfeaff', transparent: true, opacity: 0.3, roughness: 0.1, metalness: 0.2, depthWrite: false, side: THREE.DoubleSide }));
    glass.rotation.y = Math.PI / 2;
    glass.position.set(sx - 1, 0.3, zFront - 2);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 4), steel);
    rail.position.set(sx - 1, 0.6, zFront - 2);
    stairGroup.add(glass, rail);
    for (let i = 0; i <= 4; i++) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.6, 0.04), steel);
      post.position.set(sx - 1, 0.3, zFront - i);
      stairGroup.add(post);
    }
  }
  // the stair answers a tap anywhere on it: an invisible board over the whole of it
  const tap = new THREE.Mesh(new THREE.BoxGeometry(2, floor === 1 ? STAIR_H + 0.6 : 0.4, 4), new THREE.MeshBasicMaterial({ visible: false }));
  tap.position.set(sx, floor === 1 ? (STAIR_H + 0.6) / 2 : 0.1, zFront - 2);
  stairGroup.add(tap);
  stairGroup.traverse(o => { o.userData.front = stair; });
  group.add(stairGroup);

  const ring = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.6, 48), new THREE.MeshBasicMaterial({ color: '#f8d040', transparent: true, opacity: 0.9, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  ring.visible = false;
  ring.raycast = () => {};
  group.add(ring);

  return { group, blocked, spots, ring, rope, keeper: { ...KEEPERS[floor], x: tileX(COUNTER.x + 1), z: tileZ(COUNTER.y - 1) }, top: 4.4, title: floor === 1 ? 'Furniture' : 'Furniture 2F' };
}

/** How high (or, upstairs, how deep) your partner stands at world x, z: on the stair's tiles it rises with each step. */
export function stairLift(floor, x, z, { cols, rows }) {
  const x0 = STAIR.x - cols / 2, zFront = 3.5 - rows / 2 + 0.5;
  if (x < x0 || z > zFront) return 0;
  const t = Math.min(1, (zFront - z) / 4);
  return floor === 1 ? t * STAIR_H : -t * 2.2;
}

export const upstairsLine = () => `Upstairs there are 8 more pieces every day. Shall I open it for ${price(UPSTAIRS_PRICE)} PokéCoins? Tap again.`;
