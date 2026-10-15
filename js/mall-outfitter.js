/* mall-outfitter.js  -  the Poké Mall's Safari Outfitter (2026-10-15, the user's ask; picked with the mall's revamp
   2026-10-10 so each shop is one thing coins buy: home, runs, the Safari). The east front in the hall, and its one room:
   a ranger's lodge of woven rattan over dark wood, the Safari Zone's map on the wall. The ball packs rest on cushions
   along two display tables, the Master Ball turns in a glass case, the Day Pass comes from a ticket machine, and today's
   top catchers are chalked on a board on the back wall (a tap opens the whole leaderboard). Kangaskhan keeps the counter.
   Opens with the Safari Zone (safariOpen()). Painted smooth like the hall (fine()); js/mall-3d.js walks it and sells. */

import { BALLS, DAY_PASS, safariAccess } from './data/balls.js';
import { safariDaily } from './data/safari.js';
import { getSave } from './storage.js';
import { cornerEntries } from './shop.js';
import { pieceArt } from './secret-base.js';
import { tex, trim } from './hd2d.js';
import { HD, RES } from './base-paint.js';
import { fine, texOf, words, star } from './hub-3d.js';
import { calmFx } from './prefs.js';

const PX = 1 / (16 * RES);
const L = {
  rattan: ['#e8d29a', '#dcc286'], weave: '#c4a468', wood: '#9a6a3a', lite: '#c8945a', dark: '#5a3a1e',
  trim: '#4a7a3a', trimDark: '#2e5426', khaki: '#d8c08a', cloth: '#c8a868', felt: '#4f8a3e',
  planks: ['#a87a4a', '#9c6e40', '#b08452'], gap: '#5e3e20', rug: ['#6a9a48', '#a8cc78', '#d8c08a'],
};
export const OUTFITTER_COLOUR = L.trim;

/* `x, y` a ware's tile, its step the tile in front. The packs along a back table against the wall and a shorter one in
   front; the Master Ball's case and the Day Pass machine by the board; the counter at the right. */
const BACK = { x: 1, y: 0, w: 4 }, FRONT = { x: 1, y: 3, w: 3 };
const CASE = { x: 6, y: 0 }, KIOSK = { x: 8, y: 0 }, BOARD = { x: 7 };
const COUNTER = { x: 9, y: 3, w: 3 };
const TABLE_H = 0.72, BALL_R = 0.17;

export const OUTFITTER_KEEPER = { id: 'kangaskhan', name: 'Kangaskhan',
  src: 'assets/pokemon/kangaskhan-front.gif',
  hello: ['Welcome to the Safari Outfitter! Kit up before you head into the Zone.', 'Ah, a ranger in the making! Have a look round.', 'Fresh balls on every cushion. My little one polished them all.'],
  chat: ['Great and Ultra Balls are the safe bet. The others shine at the right moment: read their tags!', 'Your first try each day is free. After that, a Day Pass from the machine buys replays till midnight.',
    'The board on the wall shows today\'s best catchers. Think you can top it?', 'My little one wants to come along on a run. Not until it\'s bigger!',
    'Packs are used up as you throw them. The Safari Balls you get every run are always free.'] };

/** The Day Pass machine's state today: 'pass' (held, even before the free try), 'first' (today's try is free) or
    'locked' (buy one to replay). */
export function passState() {
  const { day } = safariDaily(), safari = getSave().safari;
  return safari?.pass === day ? 'pass' : safariAccess(safari, day);
}

/** What the keeper says at the Day Pass machine. */
export function passLine(state = passState()) {
  if (state === 'pass') return 'You\'ve got today\'s Day Pass already: replay the Safari as much as you like till midnight (UTC).';
  if (state === 'first') return `Today's first try is free! A Day Pass (${DAY_PASS} PokéCoins) covers replays after it, till midnight (UTC). Tap again to buy one now.`;
  return `You've had today's free try. A Day Pass is ${DAY_PASS} PokéCoins: replay the Safari as much as you like till midnight (UTC). Tap again!`;
}

/* ---------- the hall's front ---------- */

/** A Poké Ball, flat, for the paintings: `top` its upper half's colour. */
function flatBall(g, x, y, r, top = '#e84838') {
  g.fillStyle = '#f6f6f6'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  g.fillStyle = top; g.beginPath(); g.arc(x, y, r, Math.PI, 0); g.fill();
  g.strokeStyle = '#26262c'; g.lineWidth = r * 0.16;
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.moveTo(x - r, y); g.lineTo(x + r, y); g.stroke();
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x, y, r * 0.3, 0, Math.PI * 2); g.fill(); g.stroke();
}

/** A ranger's hat, for the windows and the wall: a khaki crown and brim, a green band. */
function hat(g, x, y, r) {
  g.fillStyle = L.cloth; g.beginPath(); g.ellipse(x, y + r * 0.45, r * 1.5, r * 0.38, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = L.khaki; g.beginPath(); g.roundRect(x - r * 0.8, y - r * 0.6, r * 1.6, r * 1.1, [r * 0.6, r * 0.6, 0, 0]); g.fill();
  g.fillStyle = L.trim; g.fillRect(x - r * 0.8, y + r * 0.05, r * 1.6, r * 0.3);
}

/** The front on the hall's back wall, between x0 and x1 (the painting's units) from `top` to `foot`: a jungle-green
    fascia saying SAFARI OUTFITTER, two windows of gear (balls on a shelf, a hat, binoculars) and a wooden door. */
export function outfitterFront(f, s, x0, x1, top, foot, closed = false) {
  const { g, rr, lin } = f, mid = (x0 + x1) / 2;
  rr(x0, top, x1 - x0, foot - top, 0, '#4a3420');
  rr(x0, top, x1 - x0, 12, 1, lin(0, top, 0, top + 12, [L.trim, L.trim, L.trimDark]));
  g.strokeStyle = L.khaki; g.lineWidth = 0.7; g.strokeRect(x0 + 0.8, top + 0.8, x1 - x0 - 1.6, 10.4);
  flatBall(g, x0 + 5, top + 6, 2.6, '#58a848');
  words(g, 'SAFARI OUTFITTER', mid + 2.4, top + 6.2, 4.6, '#fbf3dc');
  s.fillStyle = '#304a2a'; s.beginPath(); s.roundRect(x0 + 1, top + 1, x1 - x0 - 2, 10, 1); s.fill();
  words(s, 'SAFARI OUTFITTER', mid + 2.4, top + 6.2, 4.6, '#fff4c8');
  const wt = top + 15, wb = foot - 4, dw = 14;
  for (const [a, b] of [[x0 + 2, mid - dw / 2 - 1.5], [mid + dw / 2 + 1.5, x1 - 2]]) {
    rr(a, wt, b - a, wb - wt, 0.8, lin(0, wt, 0, wb, ['#fff2c8', '#ffd890', '#e8a860']));
    s.fillStyle = '#806040'; s.fillRect(a, wt, b - a, wb - wt);
    const sh = wt + (wb - wt) * 0.62;
    rr(a + 1, sh, b - a - 2, 1.4, 0.4, L.dark);
    const n = 3, step = (b - a - 4) / n, tops = ['#e84838', '#3a74e0', '#2c2c34'];
    for (let i = 0; i < n; i++) flatBall(g, a + 2 + step * (i + 0.5), sh - 2.6, 2.4, tops[i]);
    hat(g, a + (b - a) * 0.32, wt + 5.4, 2.6);
    g.fillStyle = '#3a3a40';
    for (const dx of [-1.6, 1.6]) { g.beginPath(); g.arc(a + (b - a) * 0.72 + dx, wt + 6, 1.5, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(a + 1, wt + 1, 1.2, wb - wt - 2);
    rr(a - 0.6, wb, b - a + 1.2, 4, 0.4, L.dark);
  }
  rr(mid - dw / 2, wt - 2, dw, foot - wt + 2, 0.6, L.dark);
  rr(mid - dw / 2 + 1.2, wt - 0.8, dw - 2.4, foot - wt + 0.8, 0.4, lin(0, wt, 0, foot, [L.lite, L.wood, '#7a5230']));
  g.fillStyle = 'rgba(210,235,255,0.55)'; g.fillRect(mid - dw / 2 + 3, wt + 1.5, dw - 6, 10);
  g.fillStyle = L.dark; g.fillRect(mid - 0.4, wt - 0.8, 0.8, foot - wt);
  for (const x of [mid - 2.4, mid + 1.6]) rr(x, (wt + foot) / 2 + 2, 0.8, 5, 0.4, '#e0b040');
  rr(mid - 4.5, wt + 3, 9, 3.6, 0.8, '#fbf3dc');
  words(g, closed ? 'CLOSED' : 'OPEN', mid, wt + 4.9, 2.6, closed ? '#c83a2a' : L.trimDark);
}

/** The board over the hall's front: green, a woven border, a Safari Ball and the name. Drawn on a 66 x 13 canvas. */
export function outfitterSign(f) {
  const { g, rr, lin, shine } = f, s = shine();
  rr(0, 0, 66, 13, 2, L.dark);
  rr(0.8, 0.8, 64.4, 11.4, 1.6, lin(0, 0, 0, 13, ['#5e9a48', L.trim, L.trimDark]));
  g.strokeStyle = L.khaki; g.lineWidth = 0.5; g.setLineDash([1.2, 0.8]);
  g.beginPath(); g.roundRect(2, 2, 62, 9, 1.2); g.stroke(); g.setLineDash([]);
  flatBall(g, 7, 6.5, 3, '#58a848');
  g.lineWidth = 1; g.strokeStyle = '#1e3818';
  g.font = '900 5.6px "Trebuchet MS", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.strokeText('SAFARI OUTFITTER', 37, 7); words(g, 'SAFARI OUTFITTER', 37, 7, 5.6, '#fbf3dc');
  s.fillStyle = '#203818'; s.fillRect(1, 1, 64, 11);
  words(s, 'SAFARI OUTFITTER', 37, 7, 5.6, '#fff0b8');
}

/** The hall front's awning: khaki and jungle-green stripes. */
export function outfitterAwning() {
  const f = fine(64, 24, 6), { g } = f;
  for (let x = 0; x < 64; x += 8) { g.fillStyle = (x / 8) % 2 ? L.khaki : L.trim; g.fillRect(x, 0, 8, 24); }
  g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, 20, 64, 4);
  return f.c;
}

/* ---------- the balls ---------- */

/* Each ball's skin, wrapped round a sphere: x runs round it (16 is the front, where the button is), y top to bottom,
   the top half its colour and pattern, the bottom white (or black), a dark band round the middle. */
const SKINS = {
  great: { top: '#3a74e0', paint: (g) => { g.fillStyle = '#e04838'; for (const x of [0, 32, 64]) { g.beginPath(); g.roundRect(x - 5, 2.5, 10, 11, 3); g.fill(); } } },
  ultra: { top: '#2c2c34', paint: (g) => { g.fillStyle = '#f8d040'; for (const x of [0, 32, 64]) g.fillRect(x - 4, 1, 8, 15); } },
  dusk: { top: '#26362a', bottom: '#2c2c30', paint: (g) => {
    g.fillStyle = '#58c060'; g.fillRect(0, 3.5, 64, 2.4); g.fillRect(0, 9.5, 64, 2);
    g.fillStyle = '#f08030'; for (let x = 4; x < 64; x += 8) { g.beginPath(); g.arc(x, 13.4, 0.9, 0, Math.PI * 2); g.fill(); } } },
  quick: { top: '#3a6ad8', paint: (g) => { g.fillStyle = '#f8d040'; for (let x = 0; x <= 64; x += 16) { g.beginPath(); g.ellipse(x, 7.5, 4.2, 5.6, 0, 0, Math.PI * 2); g.fill(); } } },
  timer: { top: '#f6f6f6', paint: (g) => { g.fillStyle = '#e04838'; g.fillRect(0, 0, 64, 4.2); g.fillStyle = '#2c2c34'; for (const y of [6.4, 9.4, 12.4]) g.fillRect(0, y, 64, 1.4); } },
  net: { top: '#3aa8c8', paint: (g) => {
    g.strokeStyle = '#1e2a34'; g.lineWidth = 0.55;
    g.beginPath();
    for (let x = 0; x <= 64; x += 4) { g.moveTo(x, 0); g.lineTo(x, 16); }
    for (let y = 3; y < 16; y += 4) { g.moveTo(0, y); g.lineTo(64, y); }
    g.stroke(); } },
  luxury: { top: '#2a2a30', bottom: '#2a2a30', paint: (g) => { g.fillStyle = '#d83838'; g.fillRect(0, 6, 64, 2); g.fillStyle = '#e8c048'; g.fillRect(0, 9.2, 64, 2.2); g.fillRect(0, 17.6, 64, 1.2); } },
  master: { top: '#7a3ac0', paint: (g) => {
    g.fillStyle = '#e870b8'; for (const x of [6.5, 25.5, 38.5, 57.5]) { g.beginPath(); g.arc(x, 8, 3.4, 0, Math.PI * 2); g.fill(); }
    words(g, 'M', 16, 9.4, 7, '#ffffff'); words(g, 'M', 48, 9.4, 7, '#ffffff'); } },
};

function skinArt(id) {
  const k = SKINS[id] ?? { top: '#e84838' }, f = fine(64, 32, 8), { g } = f;
  g.fillStyle = k.bottom ?? '#f4f4f4'; g.fillRect(0, 0, 64, 32);
  g.fillStyle = k.top; g.fillRect(0, 0, 64, 16);
  k.paint?.(g);
  g.fillStyle = '#26262c'; g.fillRect(0, 14.9, 64, 2.2);
  g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(0, 2, 64, 1.4);
  return f.c;
}

/** A ball: the skinned sphere and its button at the front, on a group that turns. */
function ballMesh(THREE, std, id, r) {
  const g = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 20), std({ map: texOf(skinArt(id)), roughness: 0.3, metalness: 0.05 }));
  shell.castShadow = true;
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.34, r * 0.34, r * 0.1, 20), std({ color: '#26262c', roughness: 0.4 }));
  ring.rotation.x = Math.PI / 2; ring.position.z = r * 0.95;
  const button = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.22, r * 0.22, r * 0.1, 20), std({ color: '#fafafa', roughness: 0.25 }));
  button.rotation.x = Math.PI / 2; button.position.z = r * 1.0;
  g.add(shell, ring, button);
  return g;
}

/* ---------- the room's paintings ---------- */

/** Woven rattan over dark wood: the room's walls, `W` wide; `wy` a height's y. */
function rattan(f, W, H, wy) {
  const { g, rr, lin } = f;
  g.fillStyle = lin(0, 0, 0, H, [L.rattan[0], L.rattan[1]]); g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(140,100,40,0.28)'; g.lineWidth = 0.45;
  g.beginPath();
  for (let x = -H; x < W; x += 3) { g.moveTo(x, wy(1.05)); g.lineTo(x + (wy(1.05) - wy(5)), wy(5)); }
  for (let x = 0; x < W + H; x += 3) { g.moveTo(x, wy(1.05)); g.lineTo(x - (wy(1.05) - wy(5)), wy(5)); }
  g.stroke();
  rr(0, wy(5.15), W, wy(4.9) - wy(5.15), 0, L.trim);
  rr(0, wy(5.4), W, wy(5.15) - wy(5.4), 0, L.dark);
  const top = wy(1.05), foot = H;
  g.fillStyle = lin(0, top, 0, foot, [L.wood, L.dark]); g.fillRect(0, top, W, foot - top);
  g.fillStyle = 'rgba(30,15,5,0.4)';
  for (let x = 6; x < W; x += 9) g.fillRect(x, top, 0.5, foot - top);
  rr(0, top - 1.6, W, 2.2, 0, L.lite);
  g.fillStyle = L.dark; g.fillRect(0, foot - 2, W, 2);
}

/** The Safari Zone's map: parchment, its paths dotted between the areas, a compass and a red X. */
function mapArt(g, x, y, w, h) {
  g.fillStyle = 'rgba(60,30,10,0.3)'; g.beginPath(); g.roundRect(x + 1.2, y + 1.6, w, h, 2); g.fill();
  g.fillStyle = '#4a3420'; g.beginPath(); g.roundRect(x - 1.5, y - 1.5, w + 3, h + 3, 2); g.fill();
  g.fillStyle = '#f0e0b4'; g.beginPath(); g.roundRect(x, y, w, h, 1); g.fill();
  const blob = (cx, cy, rx, ry, col) => { g.fillStyle = col; g.beginPath(); g.ellipse(x + cx * w, y + cy * h, rx * w, ry * h, 0, 0, Math.PI * 2); g.fill(); };
  blob(0.24, 0.32, 0.17, 0.2, '#9cc878');
  blob(0.7, 0.28, 0.2, 0.19, '#7ab0d8');
  blob(0.3, 0.74, 0.18, 0.16, '#d8b878');
  blob(0.74, 0.72, 0.16, 0.18, '#78a860');
  g.strokeStyle = '#8a4a28'; g.lineWidth = 0.7; g.setLineDash([1.6, 1.4]);
  g.beginPath();
  g.moveTo(x + 0.5 * w, y + 0.97 * h); g.lineTo(x + 0.5 * w, y + 0.55 * h);
  g.lineTo(x + 0.24 * w, y + 0.32 * h); g.moveTo(x + 0.5 * w, y + 0.55 * h); g.lineTo(x + 0.7 * w, y + 0.28 * h);
  g.moveTo(x + 0.5 * w, y + 0.55 * h); g.lineTo(x + 0.3 * w, y + 0.74 * h); g.moveTo(x + 0.5 * w, y + 0.55 * h); g.lineTo(x + 0.74 * w, y + 0.72 * h);
  g.stroke(); g.setLineDash([]);
  g.strokeStyle = '#c83a2a'; g.lineWidth = 1;
  const X = x + 0.74 * w, Y = y + 0.72 * h;
  g.beginPath(); g.moveTo(X - 2, Y - 2); g.lineTo(X + 2, Y + 2); g.moveTo(X + 2, Y - 2); g.lineTo(X - 2, Y + 2); g.stroke();
  const cx = x + w - 7, cy = y + 7;
  g.fillStyle = '#4a3420'; g.beginPath(); g.moveTo(cx, cy - 4.5); g.lineTo(cx + 1.3, cy); g.lineTo(cx, cy + 4.5); g.lineTo(cx - 1.3, cy); g.closePath(); g.fill();
  words(g, 'N', cx, cy - 6.4, 2.6, '#4a3420');
  words(g, 'SAFARI ZONE', x + w * 0.5, y + 5, 4.4, '#5a3a20');
}

/** The back wall: rattan over wainscoting, high windows of sky, the shop's board over the middle, the Safari Zone's map
    over the back table, and a ranger's hat and binoculars on pegs at the right. */
function wallArt({ cols, top: TOP, u: U }) {
  const W = (cols + 0.8) * U, H = TOP * U, f = fine(W, H, 4), { g, rr, lin, shine } = f, s = shine();
  const wx = (t) => (t + 0.4) * U, wy = (y) => (TOP - y) * U;
  rattan(f, W, H, wy);
  g.fillStyle = L.rattan[1]; g.fillRect(0, 0, W, wy(5.4));
  const wt = wy(TOP - 0.4), wb = wy(5.8);
  for (let t = 0.4; t < cols - 0.4; t += 2.6) {
    const x0 = wx(t) + 4, x1 = wx(t + 2.6) - 4;
    rr(x0 - 1.8, wt - 1.8, x1 - x0 + 3.6, wb - wt + 3.6, 1, L.dark);
    g.fillStyle = lin(0, wt, 0, wb, ['#7ab8f0', '#a8d4f8', '#e0f0ff']); g.fillRect(x0, wt, x1 - x0, wb - wt);
    g.fillStyle = L.wood; g.fillRect((x0 + x1) / 2 - 0.6, wt, 1.2, wb - wt);
    s.fillStyle = '#404850'; s.fillRect(x0, wt, x1 - x0, wb - wt);
  }
  // the board, hung from the beam on two cords
  const sx = wx(BOARD.x + 0.5), sw = 5.6 * U, sy = wy(4.55), sh = 18;
  g.strokeStyle = L.dark; g.lineWidth = 0.8;
  for (const x of [sx - sw / 2 + 12, sx + sw / 2 - 12]) { g.beginPath(); g.moveTo(x, wy(4.95)); g.lineTo(x, sy); g.stroke(); }
  rr(sx - sw / 2 + 1, sy + 1.4, sw, sh, 4, 'rgba(60,30,10,0.25)');
  rr(sx - sw / 2, sy, sw, sh, 4, L.dark);
  rr(sx - sw / 2 + 1.2, sy + 1.2, sw - 2.4, sh - 2.4, 3, lin(0, sy, 0, sy + sh, ['#5e9a48', L.trimDark]));
  flatBall(g, sx - sw / 2 + 11, sy + sh / 2, 5.4, '#58a848');
  words(g, 'SAFARI OUTFITTER', sx + 7, sy + sh / 2 + 0.4, 8.4, '#fbf3dc');
  s.fillStyle = '#3a5a32'; s.beginPath(); s.roundRect(sx - sw / 2 + 1.2, sy + 1.2, sw - 2.4, sh - 2.4, 3); s.fill();
  words(s, 'SAFARI OUTFITTER', sx + 7, sy + sh / 2 + 0.4, 8.4, '#fff4d0');
  mapArt(g, wx(BACK.x - 0.3), wy(3.45), (BACK.w + 0.6) * U, wy(1.35) - wy(3.45));
  // pegs at the right, over the crates: a hat and a pair of binoculars on their strap
  const px = wx(12.5);
  g.fillStyle = L.dark; for (const y of [wy(3.2), wy(2.3)]) { g.beginPath(); g.arc(px, y, 1, 0, Math.PI * 2); g.fill(); }
  hat(g, px, wy(3.2) + 3.6, 5);
  g.strokeStyle = '#4a3420'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(px - 3.2, wy(2.3) + 6); g.lineTo(px, wy(2.3)); g.lineTo(px + 3.2, wy(2.3) + 6); g.stroke();
  for (const dx of [-2.4, 2.4]) { rr(px + dx - 1.9, wy(2.3) + 5, 3.8, 6, 1.2, '#3a3a40'); g.fillStyle = '#88b0d0'; g.beginPath(); g.arc(px + dx, wy(2.3) + 10.6, 1.4, 0, Math.PI * 2); g.fill(); }
  // a picture of a Tauros herd over the counter's shelf
  const fx = wx(COUNTER.x + 0.6), fy = wy(3.85), fw = 28, fh = 15;
  rr(fx - 1.4, fy - 1.4, fw + 2.8, fh + 2.8, 1, L.dark);
  g.fillStyle = lin(0, fy, 0, fy + fh, ['#f8d090', '#f0b070', '#d8a060']); g.fillRect(fx, fy, fw, fh);
  g.fillStyle = '#b08a50'; g.fillRect(fx, fy + fh * 0.66, fw, fh * 0.34);
  g.fillStyle = '#5a3a20';
  for (const [dx, k] of [[6, 1], [13, 0.8], [20, 0.9]]) { g.beginPath(); g.ellipse(fx + dx, fy + fh * 0.66, 3 * k, 1.6 * k, 0, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = '#f8f0c8'; g.beginPath(); g.arc(fx + fw - 6, fy + 4, 2.4, 0, Math.PI * 2); g.fill();
  return f.c;
}

/** A side wall's inside, the same rattan: a window on the left one (its painting's left is the room's front), a poster
    on the right one (its left is the back). */
function sideArt(left, { rows, top: TOP, u: U }) {
  const W = rows * U, H = TOP * U, f = fine(W, H, 3), { g, rr, lin } = f;
  const wy = (y) => (TOP - y) * U, at = (t) => (left ? rows - t - 0.5 : t + 0.5) * U;
  rattan(f, W, H, wy);
  g.fillStyle = L.rattan[1]; g.fillRect(0, 0, W, wy(5.4));
  if (left) {
    const cx = at(2.4), w = 34, t0 = wy(3.7), t1 = wy(1.5);
    rr(cx - w / 2 - 2, t0 - 2, w + 4, t1 - t0 + 4, 1, L.dark);
    rr(cx - w / 2, t0, w, t1 - t0, 0.6, lin(0, t0, 0, t1, ['#8ac4f0', '#c8e4fa', '#f0f8ff']));
    g.fillStyle = '#8ab860'; g.fillRect(cx - w / 2, t1 - 10, w, 10);
    g.fillStyle = '#5a8a40';
    for (let x = cx - w / 2 + 3; x < cx + w / 2; x += 7) { g.beginPath(); g.moveTo(x - 3, t1 - 9); g.lineTo(x, t1 - 17); g.lineTo(x + 3, t1 - 9); g.fill(); }
    g.fillStyle = L.wood; g.fillRect(cx - 0.6, t0, 1.2, t1 - t0);
  } else {
    const x = at(2.2) - 15, y = wy(4.2), w = 30, h = 40;
    rr(x + 1, y + 1.4, w, h, 1.4, 'rgba(60,30,10,0.25)');
    rr(x, y, w, h, 1.4, '#fbf3dc');
    rr(x + 2, y + 2, w - 4, 22, 1, lin(0, y, 0, y + 24, ['#8ac4f0', '#c8e4b0', '#8ab860']));
    flatBall(g, x + w / 2, y + 14, 6, '#58a848');
    words(g, 'CATCH', x + w / 2, y + 29, 5, L.trimDark);
    words(g, 'THEM ALL!', x + w / 2, y + 35, 4.4, L.trimDark);
  }
  return f.c;
}

/** The floor: dark planks, a round woven rug in the middle with a Safari Ball in it, a welcome mat at the way in. */
function floorArt({ cols, rows }) {
  const T = 16, f = fine(cols * T, rows * T, 5), { g, rr } = f;
  g.fillStyle = L.gap; g.fillRect(0, 0, cols * T, rows * T);
  const PH = 4;
  for (let r = 0; r * PH < rows * T; r++) {
    let x = -((r * 23) % 40);
    for (let n = 0; x < cols * T; n++) {
      const len = 28 + ((r * 7 + n * 13) % 4) * 8, col = L.planks[(r * 5 + n * 3) % 3];
      rr(x + 0.25, r * PH + 0.25, len - 0.5, PH - 0.5, 0.4, col);
      g.fillStyle = 'rgba(255,230,190,0.16)'; g.fillRect(x + 0.4, r * PH + 0.35, len - 0.8, 0.45);
      x += len;
    }
  }
  const cx = 6.5 * T, cy = 3.6 * T, rw = 2.3 * T, rh = 1.35 * T;
  g.fillStyle = 'rgba(40,20,5,0.25)'; g.beginPath(); g.ellipse(cx + 0.8, cy + 1, rw, rh, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = L.rug[0]; g.beginPath(); g.ellipse(cx, cy, rw, rh, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = L.rug[2]; g.lineWidth = 1.6;
  for (const k of [0.88, 0.62]) { g.beginPath(); g.ellipse(cx, cy, rw * k, rh * k, 0, 0, Math.PI * 2); g.stroke(); }
  g.save(); g.translate(cx, cy); g.scale(1, rh / rw);
  flatBall(g, 0, 0, rw * 0.32, L.rug[1]);
  g.restore();
  rr(6 * T + 1.5, (rows - 1) * T + 2.5, T - 3, T - 5, 2, L.trim);
  words(g, 'WELCOME', 6.5 * T, (rows - 0.5) * T, 2.6, '#fbf3dc');
  return f.c;
}

/** A ware's price card: cream, a green band with its name, a coin and the price, and how many you have under it. */
function tagArt(e, name, note = '') {
  const f = fine(44, 30, 6), { g, rr } = f;
  rr(0.6, 1.2, 43, 28.6, 3, 'rgba(60,30,10,0.25)');
  rr(0, 0, 43, 28.6, 3, '#fbf3dc');
  rr(0, 0, 43, 8.4, [3, 3, 0, 0], L.trim);
  words(g, name, 21.5, 4.4, 4.6, '#fbf3dc');
  const big = e.blocked ? 'LOCKED' : e.done ? e.done.toUpperCase() : e.cost.toLocaleString();
  if (!e.blocked && !e.done) { g.fillStyle = '#f0c048'; g.beginPath(); g.arc(8, 15.4, 3.8, 0, Math.PI * 2); g.fill(); g.fillStyle = '#c89418'; star(g, 8, 15.4, 2.1); }
  words(g, big, e.blocked || e.done ? 21.5 : 25, 15.8, e.blocked || e.done ? 7 : 9.6, '#5a3a20');
  words(g, e.level ? e.level.toUpperCase() : note, 21.5, 24.4, 4.2, L.trimDark);
  return f.c;
}

/** The Day Pass machine's screen: a ticket, DAY PASS, and today's state. */
function passArt(state) {
  const f = fine(40, 30, 8), { g, rr, lin } = f;
  rr(0, 0, 40, 30, 2.4, '#1e2a20');
  rr(1.4, 1.4, 37.2, 27.2, 1.6, lin(0, 0, 0, 30, ['#2e4a30', '#1e3420']));
  rr(7, 4, 26, 11, 1.2, '#f8e8b8');
  g.fillStyle = '#1e3420'; for (const y of [6.5, 9.5, 12.5]) { g.beginPath(); g.arc(7, y, 0.8, 0, Math.PI * 2); g.arc(33, y, 0.8, 0, Math.PI * 2); g.fill(); }
  words(g, 'DAY PASS', 20, 9.6, 5, '#7a4a20');
  const [text, col] = state === 'pass' ? ['HELD TODAY ✓', '#a8f080'] : state === 'first' ? ['1ST TRY FREE', '#ffe890'] : [`${DAY_PASS} COINS`, '#ffffff'];
  words(g, text, 20, 21.6, 4.6, col);
  return f.c;
}

/** The leaderboard on the wall: a chalkboard in a wood frame, TODAY'S TOP CATCHERS and up to five names. `rows` is
    safariTop()'s (null: unreachable, undefined: still loading). */
function boardArt(c, rows) {
  const g = c.getContext('2d'), W = c.width, H = c.height;
  g.clearRect(0, 0, W, H);
  g.fillStyle = '#6a4424'; g.beginPath(); g.roundRect(0, 0, W, H, 18); g.fill();
  g.fillStyle = '#8a5a30'; g.beginPath(); g.roundRect(8, 8, W - 16, H - 16, 12); g.fill();
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#2e4a34'); bg.addColorStop(1, '#203628');
  g.fillStyle = bg; g.beginPath(); g.roundRect(20, 20, W - 40, H - 40, 8); g.fill();
  g.textBaseline = 'middle'; g.textAlign = 'center';
  g.font = '800 26px system-ui, sans-serif'; g.fillStyle = '#ffe890';
  g.fillText('TODAY\'S TOP CATCHERS', W / 2, 52, W - 70);
  g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(60, 74); g.lineTo(W - 60, 74); g.stroke();
  if (!rows?.length) {
    g.font = '700 26px system-ui, sans-serif'; g.fillStyle = '#f4f0e0';
    g.fillText(rows === undefined ? 'Loading…' : rows === null ? 'Catch some today to make the board!' : 'No catches yet today. Be the first!', W / 2, H / 2 + 14, W - 80);
    return;
  }
  const MEDAL = ['#ffd84a', '#d8d8e8', '#e09858', '#a8c8a0', '#a8c8a0'];
  rows.slice(0, 5).forEach((r, i) => {
    const y = 104 + i * 38;
    if (r.mine) { g.fillStyle = 'rgba(255,232,144,0.16)'; g.beginPath(); g.roundRect(38, y - 17, W - 76, 34, 8); g.fill(); }
    g.fillStyle = MEDAL[i]; g.beginPath(); g.arc(60, y, 14, 0, Math.PI * 2); g.fill();
    g.font = '900 18px system-ui, sans-serif'; g.fillStyle = '#203628'; g.textAlign = 'center'; g.fillText(String(i + 1), 60, y + 1);
    g.font = '700 25px system-ui, sans-serif'; g.textAlign = 'left'; g.fillStyle = r.mine ? '#ffe890' : '#f4f0e0';
    g.fillText(r.name, 86, y + 1, W - 260);
    g.textAlign = 'right'; g.fillStyle = '#c8ffb8'; g.fillText(`${r.caught} caught`, W - 52, y + 1);
  });
}

/** The gear on the shelf behind the counter: hats, rolled maps, canteens, jars of Bait and a backpack. */
function shelfArt() {
  const f = fine(48, 40, 4), { g, rr } = f;
  rr(0, 0, 48, 40, 1, L.dark);
  rr(2, 2, 44, 36, 0.6, '#7a5230');
  for (let r = 0; r < 3; r++) rr(1, 2 + (r + 1) * 12 - 0.6, 46, 2, 0.4, L.wood);
  for (const x of [8, 20, 32]) hat(g, x, 9.6, 3.6);
  g.fillStyle = '#f0e0b4';
  for (const x of [5, 9, 13]) { rr(x, 18, 3.4, 8, 1.4, '#f0e0b4'); g.fillStyle = '#c83a2a'; g.fillRect(x, 21.4, 3.4, 0.8); }
  for (const x of [22, 30]) { rr(x, 18.6, 6, 7.4, 3, '#5a7a8a'); rr(x + 2, 17, 2, 2, 0.6, '#3a3a40'); }
  for (const x of [38, 42]) { rr(x - 1.6, 19, 3.4, 7, 0.8, 'rgba(220,240,255,0.7)'); rr(x - 1.6, 22, 3.4, 4, 0.6, '#c89040'); }
  rr(5, 29, 12, 9, 2.4, L.trim); rr(7, 31, 8, 3, 1, L.trimDark);
  for (const [x, top] of [[24, '#e84838'], [30, '#3a74e0'], [36, '#f8d040'], [42, '#2c2c34']]) flatBall(g, x, 34.4, 2.6, top);
  return f.c;
}

/** The counter's front: dark wood, a green panel and a Safari Ball. */
function counterArt(w) {
  const W = w * 16, f = fine(W, 14, 5), { g, rr, lin } = f;
  rr(0, 0, W, 14, 0, lin(0, 0, 0, 14, [L.lite, L.wood]));
  for (let x = 0; x < W; x += 4) { g.fillStyle = 'rgba(60,30,10,0.22)'; g.fillRect(x, 0, 0.35, 14); }
  rr(3, 3.4, W - 6, 7.6, 1.4, lin(0, 3.4, 0, 11, [L.trim, L.trimDark]));
  flatBall(g, W / 2, 7.2, 3, '#58a848');
  rr(0, 12.6, W, 1.4, 0, L.dark);
  return f.c;
}

/** A crate's side: planks, BAIT or a ball stencilled on. */
function crateArt(label) {
  const f = fine(24, 24, 5), { g, rr } = f;
  rr(0, 0, 24, 24, 0, '#b08452');
  g.fillStyle = 'rgba(60,30,10,0.35)'; for (const y of [7.6, 15.6]) g.fillRect(0, y, 24, 0.7);
  rr(0, 0, 24, 2, 0, '#8a6038'); rr(0, 22, 24, 2, 0, '#8a6038'); rr(0, 0, 2, 24, 0, '#8a6038'); rr(22, 0, 2, 24, 0, '#8a6038');
  words(g, label, 12, 12.4, 5.4, '#4a2c14');
  return f.c;
}

/* ---------- building it ---------- */

/** The Outfitter's room. `size` is the hall's ({ cols, rows, top, u }), so one camera fits both. Returns its group, the
    tiles it blocks, the spots you can walk up to (each ware, the Master Ball's case, the Day Pass machine, the board and
    the counter), the gold ring that marks a picked one, `refresh()` to repaint the tags after a buy, `tick()` to turn
    the balls and fetch the board, and its shopkeeper's place. */
export function buildOutfitter(THREE, size) {
  const { cols, rows, top: TOP } = size;
  const tileX = (tx) => tx + 0.5 - cols / 2, tileZ = (ty) => ty + 0.5 - rows / 2;
  const group = new THREE.Group(), blocked = new Set(), spots = [], ticks = [], redraws = [];
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, ...o });
  const edge = std({ color: '#3a2a1a' }), cap = std({ color: L.dark });
  const block = (x, y) => blocked.add(`${x},${y}`), calm = calmFx();

  const floorBox = new THREE.Mesh(new THREE.BoxGeometry(cols, 0.6, rows), [edge, edge, std({ map: texOf(floorArt(size)), roughness: 0.7 }), edge, std({ color: '#4a2e18' }), edge]);
  floorBox.position.y = -0.3;
  floorBox.receiveShadow = true;
  group.add(floorBox);
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(cols + 0.8, 7, rows + 0.4), [edge, edge, edge, edge, std({ color: '#4a3420' }), edge]);
  plinth.position.set(0, -0.6 - 3.5, -0.2);
  group.add(plinth);
  const wall = wallArt(size);
  const back = new THREE.Mesh(new THREE.BoxGeometry(cols + 0.8, TOP, 0.4), [cap, cap, cap, cap,
    std({ map: texOf(wall), emissive: new THREE.Color('#fff4dc'), emissiveMap: texOf(wall.glow), roughness: 0.9 }), cap]);
  back.position.set(0, TOP / 2, -rows / 2 - 0.2);
  back.receiveShadow = true;
  group.add(back);
  for (const s of [-1, 1]) {
    const inside = std({ map: texOf(sideArt(s < 0, size)), roughness: 0.9 });
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.4, TOP, rows), s < 0 ? [inside, cap, cap, cap, cap, cap] : [cap, inside, cap, cap, cap, cap]);
    m.position.set(s * (cols / 2 + 0.2), TOP / 2, 0);
    m.receiveShadow = true;
    group.add(m);
  }

  const entries = () => cornerEntries('balls');
  const packs = BALLS.filter(b => b.stock), master = BALLS.find(b => b.weekly);
  const short = (b) => b.name.replace(/ Ball$/, '').toUpperCase();
  const spinners = [];

  // the display tables: wood, a khaki cloth over the top, and a green cushion for each ball with its card at the front
  const wood = std({ color: L.wood, roughness: 0.7 }), cloth = std({ color: L.cloth, roughness: 0.95 }), felt = std({ color: L.felt, roughness: 1 });
  const tagged = (spot, e, b) => {
    const art = (x) => tagArt(x, b.stock ? `${short(b)} ×${b.pack}` : short(b), b.weekly ? '1 THROW A WEEK' : '');
    const map = texOf(art(e));
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.34), std({ map, alphaTest: 0.3, roughness: 0.7 }));
    redraws.push(() => {
      map.image = art(entries().find(x => x.id === b.id)); map.needsUpdate = true;
    });
    return m;
  };
  packs.forEach((b, i) => {
    const row = i < BACK.w ? BACK : FRONT, x = row.x + (i < BACK.w ? i : i - BACK.w), y = row.y;
    const e = entries().find(x => x.id === b.id);
    const spot = { id: `ware-${b.id}`, kind: 'ware', ball: b.id, name: e.name, open: true, step: { x, y: y + 1 },
      at: { x: tileX(x), y: TABLE_H + 0.02, z: tileZ(y) }, ring: 0.3 };
    spots.push(spot);
    block(x, y);
    const cell = new THREE.Group();
    cell.position.set(tileX(x), 0, tileZ(y));
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.98, TABLE_H - 0.06, 0.8), wood);
    body.position.y = (TABLE_H - 0.06) / 2;
    const top = new THREE.Mesh(new THREE.BoxGeometry(1, 0.06, 0.86), cloth);
    top.position.y = TABLE_H - 0.03;
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(1, 0.16, 0.02), cloth);
    skirt.position.set(0, TABLE_H - 0.12, 0.43);
    const cushion = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.23, 0.07, 24), felt);
    cushion.position.y = TABLE_H + 0.035;
    for (const m of [body, top, skirt, cushion]) { m.castShadow = m.receiveShadow = true; cell.add(m); }
    const ball = ballMesh(THREE, std, b.id, BALL_R);
    ball.position.y = TABLE_H + 0.07 + BALL_R - 0.02;
    ball.rotation.y = i * 0.7;
    cell.add(ball);
    spinners.push({ o: ball, k: 0.35 + (i % 3) * 0.08 });
    for (let n = 0; n < Math.min(b.pack, 5) - 1; n++) {   // the rest of the pack, small, in a ring round the cushion
      const a = -Math.PI * 0.85 + (n / Math.max(1, b.pack - 2)) * Math.PI * 0.7;
      const little = ballMesh(THREE, std, b.id, 0.07);
      little.position.set(Math.cos(a) * 0.33, TABLE_H + 0.07, Math.sin(a) * 0.3 - 0.06);
      little.rotation.y = a + Math.PI;
      cell.add(little);
    }
    const tag = tagged(spot, e, b);
    tag.position.set(0, TABLE_H + 0.17, 0.36);
    tag.rotation.x = -0.35;
    cell.add(tag);
    cell.traverse(o => { o.userData.front = spot; });
    group.add(cell);
  });

  // the Master Ball's case: a dark pedestal, a purple velvet cushion under glass, the ball turning slowly and floating
  {
    const b = master, e = entries().find(x => x.id === b.id), x = CASE.x, y = CASE.y;
    const spot = { id: `ware-${b.id}`, kind: 'ware', ball: b.id, name: e.name, open: true, step: { x, y: y + 1 },
      at: { x: tileX(x), y: 0.02, z: tileZ(y) }, ring: 0.5 };
    spots.push(spot);
    block(x, y);
    const cell = new THREE.Group();
    cell.position.set(tileX(x), 0, tileZ(y));
    const dark = std({ color: '#3a2418', roughness: 0.5 }), gold = std({ color: '#e0b040', metalness: 0.7, roughness: 0.3 });
    const ped = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.86, 0.62), dark);
    ped.position.y = 0.43;
    const lip = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.05, 0.7), gold);
    lip.position.y = 0.885;
    const velvet = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.06, 24), std({ color: '#6a2a9a', roughness: 1 }));
    velvet.position.y = 0.94;
    const glass = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.62, 0.6), std({ color: '#d8ecff', transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.1, depthWrite: false }));
    glass.position.y = 0.91 + 0.31;
    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.04, 0.64), gold);
    lid.position.y = 1.54;
    for (const m of [ped, lip, velvet, lid]) { m.castShadow = m.receiveShadow = true; cell.add(m); }
    cell.add(glass);
    const ball = ballMesh(THREE, std, b.id, 0.19);
    ball.position.y = 1.2;
    cell.add(ball);
    spinners.push({ o: ball, k: 0.6, float: 1.2 });
    const tag = tagged(spot, e, b);
    tag.position.set(0, 0.5, 0.315);
    cell.add(tag);
    cell.traverse(o => { o.userData.front = spot; });
    group.add(cell);
  }

  // the Day Pass machine: a cream box with a green cap, its screen, a red button and a ticket in its slot
  let passMap;
  {
    const x = KIOSK.x, y = KIOSK.y;
    const spot = { id: 'pass', kind: 'pass', name: 'Day Pass', open: true, step: { x, y: y + 1 }, at: { x: tileX(x), y: 0.02, z: tileZ(y) }, ring: 0.5 };
    spots.push(spot);
    block(x, y);
    const cell = new THREE.Group();
    cell.position.set(tileX(x), 0, tileZ(y));
    const cream = std({ color: '#f4ead2', roughness: 0.5 }), green = std({ color: L.trim, roughness: 0.5 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.66, 1.3, 0.5), cream);
    body.position.y = 0.65;
    const capTop = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.12, 0.56), green);
    capTop.position.y = 1.36;
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.1, 0.56), green);
    foot.position.y = 0.05;
    passMap = texOf(passArt(passState()));
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.39), new THREE.MeshBasicMaterial({ map: passMap, toneMapped: false }));
    screen.position.set(0, 1.0, 0.252);
    const button = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 18), std({ color: '#e04838', emissive: new THREE.Color('#e04838'), emissiveIntensity: 0.4, roughness: 0.3 }));
    button.rotation.x = Math.PI / 2; button.position.set(0.16, 0.66, 0.26);
    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.04), std({ color: '#2a2a30' }));
    slot.position.set(-0.08, 0.66, 0.26);
    const ticket = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.01), std({ color: '#f8e8b8', roughness: 0.8 }));
    ticket.position.set(-0.08, 0.6, 0.27);
    ticket.rotation.x = 0.25;
    for (const m of [body, capTop, foot, button, slot, ticket]) { m.castShadow = m.receiveShadow = true; cell.add(m); }
    cell.add(screen);
    cell.traverse(o => { o.userData.front = spot; });
    group.add(cell);
    redraws.push(() => { passMap.image = passArt(passState()); passMap.needsUpdate = true; });
  }

  // the board on the back wall: today's top catchers, fetched now and then; a tap opens the leaderboard
  {
    const BW = 2.8, BH = 1.75, canvas = new OffscreenCanvas(448, 280), map = texOf(canvas), lb = { rows: undefined, fetched: -Infinity };
    const board = new THREE.Mesh(new THREE.PlaneGeometry(BW, BH), new THREE.MeshBasicMaterial({ map, transparent: true, toneMapped: false }));
    board.position.set(tileX(BOARD.x), 1.55 + BH / 2, -rows / 2 + 0.04);
    const paint = () => { boardArt(canvas, lb.rows); map.needsUpdate = true; };
    paint();
    const spot = { id: 'safari-board', kind: 'game', name: 'Safari leaderboard', open: true, step: { x: BOARD.x, y: 1 } };
    spot.line = spot.name;
    spot.game = { name: spot.name, line: 'Today\'s best catchers in the Safari Zone. Tap again to see the whole board!',
      open: (done) => import('./leaderboard.js').then(m => {
        m.openLeaderboard(0, 'safari');
        document.getElementById('board-dialog')?.addEventListener('close', () => { lb.fetched = -Infinity; done?.(); }, { once: true });
      }) };
    spots.push(spot);
    board.userData.front = spot;
    group.add(board);
    ticks.push((now) => {
      if (now - lb.fetched < 90000) return;
      lb.fetched = now;
      import('./leaderboard.js').then(m => m.safariTop(5)).then(r => { lb.rows = r; paint(); }).catch(() => {});
    });
  }

  // the counter at the right, the gear shelf behind it, and the keeper's place between them
  const keeper = { id: 'keeper', kind: 'keeper', name: OUTFITTER_KEEPER.name, open: true, step: { x: COUNTER.x + 1, y: COUNTER.y + 1 } };
  spots.push(keeper);
  for (let x = COUNTER.x; x < COUNTER.x + COUNTER.w; x++) for (let y = 0; y <= COUNTER.y; y++) block(x, y);
  const desk = new THREE.Group();
  desk.position.set(tileX(COUNTER.x + 1), 0, tileZ(COUNTER.y));
  const deskTop = std({ color: L.lite, roughness: 0.5 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(COUNTER.w - 0.1, 0.8, 0.72), [wood, wood, wood, wood, std({ map: texOf(counterArt(COUNTER.w)), roughness: 0.7 }), wood]);
  body.position.y = 0.4;
  const slab = new THREE.Mesh(new THREE.BoxGeometry(COUNTER.w + 0.04, 0.08, 0.86), deskTop);
  slab.position.y = 0.84;
  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), std({ color: '#e8c050', metalness: 0.7, roughness: 0.3 }));
  bell.position.set(0.5, 0.88, 0.18);
  for (const m of [body, slab]) { m.castShadow = m.receiveShadow = true; desk.add(m); }
  desk.add(bell);
  const spare = ballMesh(THREE, std, 'great', 0.1);   // a ball left out on the counter, and a rolled map
  spare.position.set(-0.85, 0.98, 0.1);
  desk.add(spare);
  const scroll = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 12), std({ color: '#f0e0b4', roughness: 0.9 }));
  scroll.rotation.z = Math.PI / 2; scroll.rotation.y = 0.4;
  scroll.position.set(-0.3, 0.93, 0.05);
  desk.add(scroll);
  desk.traverse(o => { o.userData.front = keeper; });
  group.add(desk);
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(COUNTER.w - 0.2, 2.3, 0.45), [cap, cap, cap, cap, std({ map: texOf(shelfArt()), roughness: 0.8 }), cap]);
  shelf.position.set(tileX(COUNTER.x + 1), 1.15, -rows / 2 + 0.24);
  shelf.castShadow = shelf.receiveShadow = true;
  group.add(shelf);

  // crates stacked in the back right corner, plants by the front corners
  const crate = (label, x, y, h, s = 0.8, turn = 0) => {
    const side = std({ map: texOf(crateArt(label)), roughness: 0.9 });
    const m = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), side);
    m.position.set(x, h + s / 2, y);
    m.rotation.y = turn;
    m.castShadow = m.receiveShadow = true;
    group.add(m);
  };
  crate('BAIT', tileX(12), tileZ(0), 0, 0.8, 0.1);
  crate('BALLS', tileX(12) + 0.02, tileZ(0) + 0.02, 0.8, 0.62, -0.15);
  crate('ROCKS', tileX(12), tileZ(1), 0, 0.7, -0.08);
  block(12, 0); block(12, 1);
  const leafy = trim(pieceArt('plant', 0, HD));
  for (const [x, k] of [[0, 1.3], [12, 1.3]]) {
    const lw = leafy.w * PX * k, lh = leafy.h * PX * k;
    const tree = new THREE.Mesh(new THREE.PlaneGeometry(lw, lh), std({ map: tex(leafy.c), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1 }));
    tree.position.set(tileX(x), lh / 2, tileZ(rows - 1));
    tree.castShadow = true;
    group.add(tree);
    block(x, rows - 1);
  }

  const ring = new THREE.Mesh(new THREE.RingGeometry(0.98, 1.08, 64), new THREE.MeshBasicMaterial({ color: '#f8d040', transparent: true, opacity: 0.9, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2;
  ring.visible = false;
  ring.raycast = () => {};
  group.add(ring);

  return {
    group, blocked, spots, ring, top: 4.4, title: 'Safari Outfitter',
    keeper: { ...OUTFITTER_KEEPER, x: tileX(COUNTER.x + 1), z: tileZ(COUNTER.y - 1) },
    refresh: () => redraws.forEach(r => r()),
    tick(now, dt) {
      ticks.forEach(t => t(now));
      if (calm) return;
      for (const s of spinners) {
        s.o.rotation.y += dt / 1000 * s.k;
        if (s.float) s.o.position.y = s.float + Math.sin(now / 700) * 0.03;
      }
    },
  };
}
