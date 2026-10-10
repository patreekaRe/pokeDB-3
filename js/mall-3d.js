/* mall-3d.js  -  the Poké Mall's hall (branch secret-base; the user's call, 2026-10-08: the Game Corner's stall grew into a
   shopping centre with the Game Corner inside). Walked into from its doors in the Clearing (js/hub-3d.js), the same
   HD-2D look as the Secret Base: a marble floor with a red runner, shop fronts along the back wall, a mezzanine with a
   glass rail and the upper floor's lit shops over them, tall windows above. The Game Corner is the middle front, its
   front flat on the wall (cornerFront()), walked into as its own arcade (js/mall-corner.js); the west front is the Furniture store,
   its own place too (js/mall-furniture.js builds its two floors; this file walks every place); the east one is shuttered for a shop
   to come (a new one is a FRONTS line and its painting on the wall). Tap the floor to walk, a front to go to it and in (no pill at
   the bottom since 2026-10-09, the user's call); the doormat on each place's doorstep walks back out (doormat() in
   js/hd2d.js), but the store's second floor has none, its way out is the lift. A buy is two taps: the first says the
   price, the second asks in a window with the thing's picture (ask()). */

import { getSave } from './storage.js';
import { calmFx } from './prefs.js';
import { playSound, playCry, playMusic } from './audio.js';
import { buddy } from './trainercard.js';
import { loadThree, dispose, monBoard, drawMon, createPost, curtain, doormat } from './hd2d.js';
import { fine, texOf, GC, words, star, hubThree } from './hub-3d.js';
import { cornerEntries, buyCorner } from './shop.js';
import { PIECES, styles, loadBase, saveBase, buyPiece, buyUpstairs, UPSTAIRS_PRICE, metSmeargle, shopOpen, tillMidnight } from './secret-base.js';
import { frontArt, frontWindow, buildFloor, upstairsLine, LIFT, KEEPERS } from './mall-furniture.js';
import { buildCorner } from './mall-corner.js';

const COLS = 13, ROWS = 7;
const U = 20;                 // the paintings' units a tile
const TOP = 11;               // the walls run up this high, so a tall phone shows no sky over them
const DECK = 3.1, DECK_D = 1;   // the mezzanine's underside and how far it reaches out
const PITCH = 0.6, ACROSS = 8, LOOK_Y = 0.9;   // the Clearing's shot, so your partner is the same size in here

const C = { cream: '#f8f0e0', stone: '#e4d6bc', shade: '#c4b290', red: '#e84838', redDark: '#a82820', ink: '#2a2238',
  marble: ['#f6efe2', '#e8dcc8'], grout: '#d2c2a4', steel: '#d8dce6', warm: ['#fff2c8', '#ffd890', '#e8a860'] };

// the shop fronts along the back wall: x the room's tile at their middle, `step` where you stand to go in
const FRONTS = [
  // the Furniture store opens the UTC day after Smeargle's housewarming in the Secret Base (syncShop()); the Game Corner
  // is closed till the user has finished its insides (2026-10-08), `open: true` lets you in; ?mall= goes in either way
  { id: 'furniture', name: 'Furniture', line: '', x: 2, step: { x: 2, y: 1 } },
  { id: 'corner', name: 'Game Corner', line: 'Closed for now: the machines are still being set up.', x: 6, step: { x: 6, y: 1 } },
  { id: 'east', name: 'Coming soon', line: 'Shutters down: a new shop is moving in.', x: 10, step: { x: 10, y: 1 }, colour: '#e88a30' },
];

let THREE, renderer, scene, camera, post, root, view, lineEl, askEl, hemi, sun;
let mon, walker = { x: 0, z: 0, tile: { x: 6, y: ROWS - 1 }, path: [], facing: 'back', flip: false, hop: 0 };
let hall, glows = [], blocked = new Set(), aim = null, here = null, answer = null;
// where you are: the hall, a floor of the Furniture store (js/mall-furniture.js) or the Game Corner (js/mall-corner.js),
// each its own group, tiles and spots
let places = {}, P = null, picked = null, riding = null;   // riding: the lift, 'in' stepping into its car, 'out' stepping out
let mats = [];   // every place's doormat, breathing
let wallMat = null, painted = null, tapes = {};   // the back wall's painting (its OPEN / CLOSED plaque) and each front's tape
let calm = false, last = 0, camX = 0, shot = null, viewW = 0, viewH = 0, leaveTo = null;

const tileX = (tx) => tx + 0.5 - COLS / 2;
const tileZ = (ty) => ty + 0.5 - ROWS / 2;
const key = (x, y) => `${x},${y}`;
const wx = (t) => (t + 0.4) * U;            // a room tile's x on the back wall's painting (it runs 0.4 past each side)
const wy = (y) => (TOP - y) * U;            // a height's y on it

/* ---------- painting ---------- */

function ball(g, x, y, r, ink = C.ink) {
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  g.fillStyle = C.red; g.beginPath(); g.arc(x, y, r, Math.PI, 0); g.fill();
  g.strokeStyle = ink; g.lineWidth = r * 0.16;
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.moveTo(x - r, y); g.lineTo(x + r, y); g.stroke();
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x, y, r * 0.32, 0, Math.PI * 2); g.fill(); g.stroke();
}

/** A shuttered front: its colour's fascia saying COMING SOON over a rolled-down steel shutter between two pilasters. */
function shutter(f, s, x0, x1, colour) {
  const { g, rr, lin } = f, top = wy(2.5), foot = wy(0);
  rr(x0, top, x1 - x0, foot - top, 0, '#5a5668');
  rr(x0, top, x1 - x0, 12, 1, lin(0, top, 0, top + 12, [colour, colour, '#00000040']));
  rr(x0 + 2, top + 2, x1 - x0 - 4, 8, 1, '#ffffff');
  words(g, 'COMING SOON', (x0 + x1) / 2, top + 6.2, 5, colour);
  s.fillStyle = '#b0b0b0'; s.beginPath(); s.roundRect(x0 + 2, top + 2, x1 - x0 - 4, 8, 1); s.fill();
  words(s, 'COMING SOON', (x0 + x1) / 2, top + 6.2, 5, '#606060');
  const st = top + 13;
  g.fillStyle = lin(0, st, 0, foot, ['#c8ccd6', '#a8acb8', '#8a8e9a']); g.fillRect(x0 + 2, st, x1 - x0 - 4, foot - st);
  g.fillStyle = 'rgba(40,40,60,0.25)';
  for (let y = st + 2; y < foot; y += 2.6) g.fillRect(x0 + 2, y, x1 - x0 - 4, 0.5);
  rr((x0 + x1) / 2 - 4, foot - 4, 8, 1.4, 0.7, '#5a5e6a');   // its handle
  g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(x0 + 2, st, x1 - x0 - 4, 1.2);
}

/** The Game Corner's front, flat on the wall like the others: a violet fascia trimmed in gold saying GAME CORNER between
    two stars, slot reels lit in its two windows, a dark glass door with an OPEN or CLOSED plaque. */
function cornerFront(f, s, x0, x1, top, foot, closed) {
  const { g, rr, lin } = f, mid = (x0 + x1) / 2;
  rr(x0, top, x1 - x0, foot - top, 0, GC.violetDark);
  rr(x0, top, x1 - x0, 12, 1, lin(0, top, 0, top + 12, [GC.violet, GC.violet, GC.violetDark]));
  g.strokeStyle = GC.gold; g.lineWidth = 0.8; g.strokeRect(x0 + 0.8, top + 0.8, x1 - x0 - 1.6, 10.4);
  words(g, 'GAME CORNER', mid, top + 6.2, 5, GC.gold);
  words(s, 'GAME CORNER', mid, top + 6.2, 5, '#ffe890');
  for (const x of [x0 + 4.5, x1 - 4.5]) { g.fillStyle = GC.gold; star(g, x, top + 6, 2.2); s.fillStyle = '#ffe890'; star(s, x, top + 6, 2.2); }
  for (let x = x0 + 3; x < x1 - 2; x += 5) {   // bulbs along the fascia's foot
    g.fillStyle = '#fff6c8'; g.beginPath(); g.arc(x, top + 12.6, 0.7, 0, Math.PI * 2); g.fill();
    s.fillStyle = '#ffffff'; s.beginPath(); s.arc(x, top + 12.6, 0.8, 0, Math.PI * 2); s.fill();
  }
  const wt = top + 15, wb = foot - 4, dw = 14;
  for (const [a, b] of [[x0 + 2, mid - dw / 2 - 1.5], [mid + dw / 2 + 1.5, x1 - 2]]) {
    rr(a, wt, b - a, wb - wt, 0.8, lin(0, wt, 0, wb, ['#7a4ab8', '#4a2a80', '#2e1c4e']));
    const rw = (b - a - 4) / 3, ry = wt + 5;
    for (let i = 0; i < 3; i++) {
      const rx = a + 2 + i * rw;
      rr(rx + 0.3, ry, rw - 0.6, 9, 0.6, '#ffffff');
      words(g, '7', rx + rw / 2, ry + 4.8, 4, GC.red);
      s.fillStyle = '#c0a0ff'; s.fillRect(rx + 0.3, ry, rw - 0.6, 9);
    }
    rr(a - 0.6, wb, b - a + 1.2, 4, 0.4, GC.goldDark);
  }
  rr(mid - dw / 2, wt - 2, dw, foot - wt + 2, 0.6, '#1a1028');
  rr(mid - dw / 2 + 1.2, wt - 0.8, dw - 2.4, foot - wt + 0.8, 0.4, lin(0, wt, 0, foot, ['#5a4880', '#3a2a5a', '#2a1c44']));
  g.fillStyle = '#1a1028'; g.fillRect(mid - 0.4, wt - 0.8, 0.8, foot - wt);
  for (const x of [mid - 2.4, mid + 1.6]) rr(x, (wt + foot) / 2, 0.8, 5, 0.4, GC.gold);
  rr(mid - 4.5, wt + 3, 9, 3.6, 0.8, '#ffffff');
  words(g, closed ? 'CLOSED' : 'OPEN', mid, wt + 4.9, 2.6, closed ? GC.red : GC.violet);
}

/** Glass onto an upper floor's shop: warm light, shelves, an icon on its sign. */
function upperShop(f, s, x0, x1, icon, colour) {
  const { g, rr, lin } = f, top = wy(DECK + 2.25), foot = wy(DECK + 0.2);
  rr(x0, top, x1 - x0, foot - top, 0.6, '#4a4458');
  rr(x0 + 1, top + 9, x1 - x0 - 2, foot - top - 10, 0.4, lin(0, top + 9, 0, foot, C.warm));
  g.fillStyle = 'rgba(120,70,40,0.3)';
  for (let x = x0 + 3; x < x1 - 4; x += 6) g.fillRect(x, top + 16, 4, foot - top - 17);
  g.fillStyle = 'rgba(210,235,255,0.35)'; g.fillRect(x0 + 1, top + 9, x1 - x0 - 2, foot - top - 10);
  s.fillStyle = '#806040'; s.fillRect(x0 + 1, top + 9, x1 - x0 - 2, foot - top - 10);
  rr(x0 + 1, top + 1, x1 - x0 - 2, 7, 1, colour);
  const cx = (x0 + x1) / 2, cy = top + 4.5;
  icon(g, cx, cy); icon(s, cx, cy);
}

const ICONS = {
  ball: (g, x, y) => ball(g, x, y, 2.6),
  potion: (g, x, y) => { g.fillStyle = '#b070e0'; g.beginPath(); g.roundRect(x - 2, y - 1.5, 4, 4, 1); g.fill(); g.fillStyle = '#e0e0ea'; g.fillRect(x - 1, y - 3, 2, 1.6); },
  berry: (g, x, y) => { g.fillStyle = '#4a7ce0'; g.beginPath(); g.arc(x, y + 0.5, 2.2, 0, Math.PI * 2); g.fill(); g.fillStyle = '#58b048'; g.beginPath(); g.ellipse(x + 1, y - 2, 1.4, 0.7, -0.5, 0, Math.PI * 2); g.fill(); },
  disc: (g, x, y) => { g.fillStyle = '#e8e8f0'; g.beginPath(); g.arc(x, y, 2.6, 0, Math.PI * 2); g.fill(); g.fillStyle = '#e84838'; g.beginPath(); g.arc(x, y, 0.9, 0, Math.PI * 2); g.fill(); },
  star: (g, x, y) => { g.fillStyle = '#f8d040'; star(g, x, y, 2.6); },
};

/** The back wall, all one painting: the shop fronts on the ground floor, the Game Corner's violet alcove in the middle, the
    upper floor's lit shops, then tall windows of sky under a white truss and POKé MALL in lights. */
function wallArt() {
  const W = (COLS + 0.8) * U, H = TOP * U, f = fine(W, H, 5), { g, rr, lin, shine } = f, s = shine();
  g.fillStyle = lin(0, 0, 0, H, [C.stone, C.cream, C.cream, C.stone]); g.fillRect(0, 0, W, H);
  // the tall windows, sky and a white truss
  const wt = wy(TOP - 0.3), wb = wy(DECK + 2.8);
  for (let t = 0.3; t < COLS - 0.3; t += 2.6) {
    const x0 = wx(t) + 3, x1 = wx(t + 2.6) - 3;
    rr(x0 - 1, wt - 1, x1 - x0 + 2, wb - wt + 2, 1, C.shade);
    g.fillStyle = lin(0, wt, 0, wb, ['#7ab8f0', '#a8d4f8', '#e0f0ff']); g.fillRect(x0, wt, x1 - x0, wb - wt);
    g.strokeStyle = '#ffffff'; g.lineWidth = 0.9;
    g.beginPath();
    for (let y = wt; y < wb; y += 14) { g.moveTo(x0, y); g.lineTo(x1, y); }
    g.moveTo((x0 + x1) / 2, wt); g.lineTo((x0 + x1) / 2, wb);
    g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.moveTo(x0 + 3, wt); g.lineTo(x0 + 9, wt); g.lineTo(x0 + 2, wb); g.lineTo(x0, wb); g.lineTo(x0, wt + 20); g.closePath(); g.fill();
    s.fillStyle = '#404850'; s.fillRect(x0, wt, x1 - x0, wb - wt);
  }
  // POKé MALL in lights across the middle of them
  const sy = wy(DECK + 4.6), sw = 6 * U;
  rr(W / 2 - sw / 2, sy, sw, 18, 3, C.red);
  rr(W / 2 - sw / 2 + 1.5, sy + 1.5, sw - 3, 15, 2.2, '#ffffff');
  ball(g, W / 2 - sw / 2 + 11, sy + 9, 5);
  words(g, 'POKé MALL', W / 2 + 7, sy + 9.5, 10, C.red);
  s.fillStyle = '#d0d0d0'; s.beginPath(); s.roundRect(W / 2 - sw / 2 + 1.5, sy + 1.5, sw - 3, 15, 2.2); s.fill();
  ball(s, W / 2 - sw / 2 + 11, sy + 9, 5, '#000');
  words(s, 'POKé MALL', W / 2 + 7, sy + 9.5, 10, '#ff8070');
  // the upper floor
  rr(0, wy(DECK + 2.6), W, wy(DECK) - wy(DECK + 2.6), 0, lin(0, wy(DECK + 2.6), 0, wy(DECK), [C.cream, C.stone]));
  const ups = [['ball', '#e84838'], ['potion', '#8a5ad0'], ['berry', '#3a8ad8'], ['disc', '#58a858'], ['star', '#e8a830']];
  ups.forEach(([icon, colour], i) => { const t = 0.4 + i * 2.6; upperShop(f, s, wx(t) + 2, wx(t + 2.3), ICONS[icon], colour); });
  // the ground floor: pilasters and the three fronts
  for (const fr of FRONTS) {
    const x0 = wx(fr.x - 1) + 2, x1 = wx(fr.x + 2) - 2;
    if (fr.id === 'corner') cornerFront(f, s, x0, x1, wy(2.5), wy(0), !fr.open);
    else if (fr.id === 'furniture') frontArt(f, s, x0, x1, wy(2.5), wy(0), !fr.open);
    else shutter(f, s, x0, x1, fr.colour);
  }
  for (const t of [0, 4, 9, 13]) rr(wx(t) - 3, wy(DECK), 6, wy(0) - wy(DECK), 0.8, lin(wx(t) - 3, 0, wx(t) + 3, 0, ['#ffffff', C.cream, C.shade]));
  g.fillStyle = '#6a5a48'; g.fillRect(0, wy(0.12), W, wy(0) - wy(0.12));
  return f.c;
}

/** Marble in big squares, a red runner from the doors up to the Game Corner, gold edging it, a Poké Ball inlaid midway. */
function floorArt() {
  const f = fine(COLS * 16, ROWS * 16, 5), { g, rr, lin } = f, T = 16;
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    g.fillStyle = lin(x * T, y * T, x * T + T, y * T + T, (x + y) % 2 ? C.marble : [C.marble[1], C.marble[0]]);
    g.fillRect(x * T, y * T, T, T);
  }
  g.strokeStyle = C.grout; g.lineWidth = 0.4;
  for (let x = 0; x <= COLS; x++) { g.beginPath(); g.moveTo(x * T, 0); g.lineTo(x * T, ROWS * T); g.stroke(); }
  for (let y = 0; y <= ROWS; y++) { g.beginPath(); g.moveTo(0, y * T); g.lineTo(COLS * T, y * T); g.stroke(); }
  const rx = 6 * T + 2, rw = T - 4, ry = 0;
  rr(rx - 1, ry, rw + 2, ROWS * T - ry, 0, '#c89418');
  rr(rx, ry, rw, ROWS * T - ry, 0, lin(rx, 0, rx + rw, 0, ['#a82838', '#c83848', '#a82838']));
  ball(g, 6.5 * T, 4.5 * T, 5);
  g.strokeStyle = '#c89418'; g.lineWidth = 0.8; g.beginPath(); g.arc(6.5 * T, 4.5 * T, 6.4, 0, Math.PI * 2); g.stroke();
  return f.c;
}

/** A planter: a white tub banded red, a palm over it. */
function planterArt() {
  const f = fine(16, 26), { g, rr, lin } = f;
  g.strokeStyle = '#7a5430'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(8, 18); g.quadraticCurveTo(7, 12, 8.5, 7); g.stroke();
  for (const [a, l] of [[-2.6, 7], [-2, 8], [-1.2, 7], [-0.5, 6.5], [0.3, 7.5], [-3.2, 5.5]]) {
    g.fillStyle = lin(0, 0, 0, 12, ['#7ad060', '#3a9038']);
    g.save(); g.translate(8.5, 7); g.rotate(a); g.beginPath(); g.ellipse(l / 2, 0, l / 2, 1.3, 0, 0, Math.PI * 2); g.fill(); g.restore();
  }
  rr(2.5, 17, 11, 8.6, 1.6, lin(2.5, 0, 13.5, 0, ['#ffffff', '#f0ece4', '#cfc8bc']));
  rr(2.5, 19, 11, 1.6, 0, C.red);
  return f.c;
}

/** A bench: wooden slats on two steel legs. */
function benchArt() {
  const f = fine(28, 12), { rr, lin } = f;
  for (const x of [3, 23]) rr(x, 6, 2, 6, 0.4, '#9aa0ae');
  rr(1, 1, 26, 2.6, 0.8, lin(0, 1, 0, 3.6, ['#d8a868', '#a87840']));
  rr(1, 4.4, 26, 2.6, 0.8, lin(0, 4.4, 0, 7, ['#d8a868', '#a87840']));
  return f.c;
}

/** A banner hung from the mezzanine: red, a Poké Ball, a swallowtail end. */
function bannerArt() {
  const f = fine(10, 28), { g, lin } = f;
  g.fillStyle = lin(0, 0, 10, 0, [C.redDark, C.red, C.redDark]);
  g.beginPath(); g.moveTo(0, 0); g.lineTo(10, 0); g.lineTo(10, 28); g.lineTo(5, 24); g.lineTo(0, 28); g.closePath(); g.fill();
  g.fillStyle = '#ffffff'; g.fillRect(0, 2, 10, 0.8);
  ball(g, 5, 12, 3.4);
  return f.c;
}

/** The mezzanine's face: white, a red stripe, little lights along it. */
function fasciaArt() {
  const f = fine((COLS + 0.8) * U, 8, 5), { g, lin, shine } = f, s = shine();
  g.fillStyle = lin(0, 0, 0, 8, ['#ffffff', C.cream]); g.fillRect(0, 0, (COLS + 0.8) * U, 8);
  g.fillStyle = C.red; g.fillRect(0, 3, (COLS + 0.8) * U, 2);
  for (let x = 4; x < (COLS + 0.8) * U; x += 8) {
    g.fillStyle = '#fff6c8'; g.beginPath(); g.arc(x, 6.6, 0.7, 0, Math.PI * 2); g.fill();
    s.fillStyle = '#ffffff'; s.beginPath(); s.arc(x, 6.6, 0.8, 0, Math.PI * 2); s.fill();
  }
  return f.c;
}

/** Light falling from the windows: a soft column fading to nothing at its foot. */
function shaftArt() {
  const f = fine(8, 32, 4), { g, lin } = f;
  g.fillStyle = lin(0, 0, 0, 32, ['rgba(255,248,220,0.9)', 'rgba(255,248,220,0.35)', 'rgba(255,248,220,0)']);
  g.fillRect(0, 0, 8, 32);
  g.fillStyle = lin(0, 0, 8, 0, ['rgba(0,0,0,1)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,1)']);
  g.globalCompositeOperation = 'destination-out'; g.fillRect(0, 0, 8, 32);
  return f.c;
}

/** Caution tape: a yellow band edged black, CAUTION over and over, a little sheen along it. */
function tapeArt() {
  const W = 96, H = 7, f = fine(W, H, 5), { g, lin } = f;
  g.fillStyle = lin(0, 0, 0, H, ['#ffe24a', '#f8d020', '#e0b410']); g.fillRect(0, 0, W, H);
  g.fillStyle = '#1a1a1a'; g.fillRect(0, 0, W, 0.8); g.fillRect(0, H - 0.8, W, 0.8);
  for (let x = 12; x < W; x += 24) {
    words(g, 'CAUTION', x, H / 2 + 0.2, 3.6, '#1a1a1a');
    g.save(); g.translate(x + 12, H / 2); g.rotate(Math.PI / 4); g.fillRect(-0.9, -0.9, 1.8, 1.8); g.restore();
  }
  g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(0, 1.1, W, 0.6);
  return f.c;
}

/** Two strips of tape crossed over a closed front and out onto the wall either side, a third straight across. */
function tapeOver(fr, tape) {
  const x = tileX(fr.x), z = -ROWS / 2 + 0.42;
  for (const [rot, y, len, dz] of [[0.42, 1.15, 4.1, 0], [-0.42, 1.15, 4.1, 0.03], [0.04, 0.6, 3.6, 0.06]]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(len, len * 7 / 96), std({ map: texOf(tape), side: THREE.DoubleSide, roughness: 0.5 }));
    m.position.set(x, y, z + dz);
    m.rotation.z = rot;
    m.castShadow = true;
    m.userData.front = fr;
    hall.add(m);
    (tapes[fr.id] ||= []).push(m);
  }
}

/* ---------- the grand opening ---------- */

// The store's first opening day (2026-10-09, the user's ask): a red ribbon on brass posts across its front, a bow in the
// middle, a GRAND OPENING board and Smeargle waiting beside it. A tap has Smeargle ask you to cut it, a second snips it:
// the halves drop, the bow falls, confetti, and Smeargle leads you in. Saved as `ribbonCut`; a save that has already been
// inside (`shopGreeted`) never sees it. `?ribbon` puts it up for the page load, never saved.
const RIBBON_PEEK = new URLSearchParams(location.search).has('ribbon');
const RIBBON_Y = 0.82, RIBBON_Z = -ROWS / 2 + 0.72, RIBBON_TILES = ['1,0', '2,0', '3,0', '4,0'];
let ribbon = null, confetti = [];

/** Red satin: a darker edge top and bottom, a sheen along the middle. */
function ribbonArt() {
  const f = fine(48, 4, 6), { g, lin } = f;
  g.fillStyle = lin(0, 0, 0, 4, ['#8a1020', '#e02838', '#ff6070', '#d82030', '#8a1020']); g.fillRect(0, 0, 48, 4);
  g.fillStyle = 'rgba(255,215,120,0.9)'; g.fillRect(0, 0.3, 48, 0.25); g.fillRect(0, 3.45, 48, 0.25);
  return f.c;
}

/** The bow: two puffed loops, a knot and two tails cut in a V. */
function bowArt() {
  const f = fine(24, 22, 6), { g, lin } = f;
  for (const s of [-1, 1]) {
    g.fillStyle = '#a81828';
    g.beginPath(); g.moveTo(12 + s * 1.2, 11); g.lineTo(12 + s * 4, 21); g.lineTo(12 + s * 6.4, 19.4); g.lineTo(12 + s * 7.6, 21.6); g.lineTo(12 + s * 3, 10); g.closePath(); g.fill();
    g.fillStyle = lin(12, 4, 12 + s * 11, 12, ['#ff6a78', '#e02838', '#a81828']);
    g.beginPath(); g.ellipse(12 + s * 5.6, 8.6, 5.8, 4.4, s * -0.35, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#7a0c1a';
    g.beginPath(); g.ellipse(12 + s * 5, 9, 2.6, 1.6, s * -0.35, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.45)';
    g.beginPath(); g.ellipse(12 + s * 6.4, 6.4, 2.4, 0.9, s * -0.5, 0, Math.PI * 2); g.fill();
  }
  g.fillStyle = lin(9.6, 6, 14.4, 12, ['#ff5060', '#c01c2c']);
  g.beginPath(); g.roundRect(9.6, 6, 4.8, 6, 1.6); g.fill();
  g.fillStyle = 'rgba(255,215,120,0.9)'; g.fillRect(9.6, 8.6, 4.8, 0.5);
  return f.c;
}

/** The board on an easel: GRAND OPENING! in red on cream, under a little bow, gold stars either side. */
function grandSignArt() {
  const f = fine(26, 30), { g, rr, lin } = f;
  g.strokeStyle = '#8a5a30'; g.lineWidth = 1.4;
  g.beginPath(); g.moveTo(6, 18); g.lineTo(3.5, 30); g.moveTo(20, 18); g.lineTo(22.5, 30); g.moveTo(13, 6); g.lineTo(13, 30); g.stroke();
  rr(1, 3, 24, 17, 1.6, '#c83040');
  rr(2.2, 4.2, 21.6, 14.6, 1, lin(0, 4, 0, 19, ['#fffaf0', '#f4e8d0']));
  words(g, 'GRAND', 13, 9, 5, '#c83040');
  words(g, 'OPENING!', 13, 14.6, 4.6, '#c83040');
  g.fillStyle = '#e8b830';
  for (const x of [4.6, 21.4]) star(g, x, 6.6, 1.4);
  g.fillStyle = '#e02838';
  for (const s of [-1, 1]) { g.beginPath(); g.ellipse(13 + s * 2.4, 2.8, 2.4, 1.6, 0, 0, Math.PI * 2); g.fill(); }
  g.beginPath(); g.arc(13, 2.9, 1.1, 0, Math.PI * 2); g.fill();
  return f.c;
}

/** The ribbon's parts, standing in the hall in front of the store's doors (hidden till syncShop() puts them up). */
function buildRibbon(shop) {
  const group = new THREE.Group(), cx = tileX(shop.x), half = 1.38;
  const brass = std({ color: '#d8a838', metalness: 0.75, roughness: 0.3 }), tag = (m) => { m.userData.front = shop; m.castShadow = true; return m; };
  for (const s of [-1, 1]) {
    const x = cx + s * (half + 0.04);
    const post = tag(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, RIBBON_Y + 0.08, 12), brass));
    post.position.set(x, (RIBBON_Y + 0.08) / 2, RIBBON_Z);
    const knob = tag(new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 12), brass));
    knob.position.set(x, RIBBON_Y + 0.12, RIBBON_Z);
    const foot = tag(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, 0.05, 20), brass));
    foot.position.set(x, 0.025, RIBBON_Z);
    group.add(post, knob, foot);
  }
  const satin = texOf(ribbonArt()), mat = std({ map: satin, side: THREE.DoubleSide, roughness: 0.35 });
  const halves = [-1, 1].map(s => {
    const geo = new THREE.PlaneGeometry(half, 0.17);
    geo.translate(-s * half / 2, 0, 0);   // each half turns about its post
    const m = tag(new THREE.Mesh(geo, mat));
    m.position.set(cx + s * half, RIBBON_Y, RIBBON_Z);
    m.userData.side = s;
    group.add(m);
    return m;
  });
  const bow = tag(new THREE.Mesh(new THREE.PlaneGeometry(0.74, 0.68), std({ map: texOf(bowArt()), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.4 })));
  bow.position.set(cx, RIBBON_Y - 0.08, RIBBON_Z + 0.03);
  group.add(bow);
  const sign = grandSignArt(), sw = sign.width / sign.fine / 16, sh = sign.height / sign.fine / 16;
  const board = tag(new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), std({ map: texOf(sign), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1 })));
  board.position.set(cx - half - 0.5, sh / 2, RIBBON_Z + 0.3);
  group.add(board);
  group.visible = false;
  hall.add(group);
  return { group, halves, bow, shop, cutAt: 0, asked: false, done: false, mon: null };
}

const ribbonUp = (b) => FRONTS[0].open && !ribbon?.done && (RIBBON_PEEK || !(b.ribbonCut || b.shopGreeted));

/** Puts the ribbon up or takes it down by the save, and Smeargle beside it; the tiles under it are walked round. */
async function syncRibbon() {
  if (!ribbon) return;
  const up = ribbonUp(loadBase());
  ribbon.group.visible = up;
  for (const k of RIBBON_TILES) up ? places.hall?.blocked.add(k) : places.hall?.blocked.delete(k);
  if (!up) { if (ribbon.mon) ribbon.mon.group.visible = false; return clearConfetti(); }
  ribbon.asked = false;
  if (!ribbon.mon) {
    ribbon.mon = await monBoard(KEEPERS[1], false);
    ribbon.mon.board.rotation.x = -PITCH;
    ribbon.mon.group.traverse(o => { o.userData.front = ribbon.shop; });
    hall.add(ribbon.mon.group);
  }
  ribbon.home = { x: tileX(ribbon.shop.x) + 1.95, z: RIBBON_Z + 0.25 };
  ribbon.mon.group.position.set(ribbon.home.x, 0, ribbon.home.z);
  ribbon.mon.group.visible = true;
  ribbon.walkIn = 0;
}

/** Smeargle says it, in the speech window, out in the hall. */
const smeargle = (line, ms) => say({ line, who: 'Smeargle' }, ms);

/** A tap on the store while the ribbon is up: the first has Smeargle ask, the second cuts it. */
async function ribbonTap() {
  if (ribbon.cutAt) return;
  ribbon.hopUntil = performance.now() + 600;
  if (!ribbon.asked) {
    ribbon.asked = true;
    playCry('smeargle');
    return smeargle('It\'s the grand opening! Will you do the honours and cut the ribbon? Tap it again!', 6000);
  }
  ribbon.cutAt = performance.now();
  playSound('snip');
  if (!RIBBON_PEEK) { const b = loadBase(); b.ribbonCut = true; saveBase(b); }
  burst();
  await later(260);
  playSound('fw-pop');
  playSound('achievement');
  playCry('smeargle');
  ribbon.hopUntil = performance.now() + 1400;
  walker.hopUntil = performance.now() + 900;
  smeargle('Snip! The Furniture store is open! Thank you, thank you! Come in, come in!', 4200);
  await later(1900);
  ribbon.walkIn = performance.now();
  await later(1700);
  if (P?.id !== 'hall' || !root?.isConnected) return;
  ribbon.done = true;
  await goPlace('f1', { x: 6, y: ROWS - 1 });
  syncRibbon();
}

const CONFETTI = ['#e84838', '#f8d040', '#3a8ad8', '#58b048', '#e870b0', '#ffffff', '#ff9a30'];

/** Confetti over the doors and off each post. */
function burst() {
  if (calm) return;
  const cx = tileX(ribbon.shop.x), geo = new THREE.PlaneGeometry(0.06, 0.1);
  const mats = CONFETTI.map(color => new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
  const spawn = (n, x, y, spread, up) => {
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(geo, mats[i % mats.length]);
      m.position.set(x, y, RIBBON_Z + 0.1);
      m.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      m.raycast = () => {};
      hall.add(m);
      confetti.push({ m, v: new THREE.Vector3((Math.random() - 0.5) * spread, up * (0.6 + Math.random() * 0.6), 0.3 + Math.random() * 1.6),
        spin: new THREE.Vector3(Math.random() * 9, Math.random() * 9, Math.random() * 9), sway: Math.random() * 6, down: false });
    }
  };
  spawn(110, cx, RIBBON_Y, 5, 5.2);
  for (const s of [-1, 1]) spawn(35, cx + s * 1.42, RIBBON_Y + 0.12, 2.4, 6.4);
}

function tickConfetti(dt, now) {
  if (!confetti.length) return;
  const t = dt / 1000;
  for (const c of confetti) {
    if (c.down) continue;
    c.v.y -= 7 * t;
    c.v.multiplyScalar(1 - Math.min(1, t * 1.6));
    if (c.v.y < -1.1) c.v.y = -1.1;   // flutters down, not drops
    c.m.position.addScaledVector(c.v, t);
    if (c.v.y < 0) c.m.position.x += Math.sin(now / 260 + c.sway) * 0.4 * t;
    c.m.rotation.x += c.spin.x * t; c.m.rotation.y += c.spin.y * t; c.m.rotation.z += c.spin.z * t;
    if (c.m.position.y <= 0.006) { c.m.position.y = 0.006; c.m.rotation.set(-Math.PI / 2, 0, Math.random() * 6); c.down = true; }
  }
}

function clearConfetti() {
  for (const c of confetti) hall.remove(c.m);
  if (confetti.length) { confetti[0].m.geometry.dispose(); new Set(confetti.map(c => c.m.material)).forEach(m => m.dispose()); }
  confetti = [];
}

/** The cut halves swing down off their posts, the bow drops and bounces, and Smeargle hops, then walks in at the doors. */
function tickRibbon(dt, now) {
  if (!ribbon?.group.visible) return;
  const t = ribbon.cutAt ? (now - ribbon.cutAt) / 1000 : 0;
  for (const h of ribbon.halves) {
    const fall = !ribbon.cutAt ? 0 : calm ? 1 : 1 - Math.exp(-t * 3.4) * Math.cos(t * 9);
    h.rotation.z = h.userData.side * (Math.PI / 2 - 0.08) * fall;
  }
  if (ribbon.cutAt) {
    const b = ribbon.bow, y0 = RIBBON_Y - 0.08, floor = 0.3;
    if (calm) b.position.y = floor;
    else {
      const drop = y0 - 0.5 * 9 * t * t;
      if (drop > floor) b.position.y = drop;
      else { const tf = Math.sqrt(2 * (y0 - floor) / 9), u = t - tf, hop = 0.9 * u - 0.5 * 9 * u * u; b.position.y = floor + Math.max(0, hop); }
      b.rotation.z = Math.min(0.5, t * 0.8);
    }
  }
  const m = ribbon.mon;
  if (!m?.group.visible) return;
  drawMon(m, { facing: 'front' }, dt);
  m.board.scale.x = walker.x > m.group.position.x + 0.3 ? -1 : 1;
  const left = (ribbon.hopUntil || 0) - now;
  m.board.position.y = !calm && left > 0 ? Math.abs(Math.sin(left / 600 * Math.PI * 2)) * 0.3 : 0;
  if (ribbon.walkIn) {   // over to the middle of the doors and in through them
    const k = Math.min(1, (now - ribbon.walkIn) / 1400), e = k * k * (3 - 2 * k);
    const tx = tileX(ribbon.shop.x), tz = -ROWS / 2 + 0.25;
    m.group.position.set(ribbon.home.x + (tx - ribbon.home.x) * e, 0, ribbon.home.z + (tz - ribbon.home.z) * Math.max(0, e * 2 - 1));
    m.board.scale.x = tx > ribbon.home.x ? -1 : 1;
    if (k >= 1) m.group.visible = false;
  }
}

/** The Furniture store's doors by the save: taped up until Smeargle has said it opens, then until that UTC day. */
function syncShop() {
  const fr = FRONTS[0];
  fr.open = shopOpen(loadBase()) || RIBBON_PEEK;
  for (const m of tapes[fr.id] || []) m.visible = !fr.open;
  syncRibbon();
  if (!wallMat || painted === fr.open) return;
  const wall = wallArt();
  wallMat.map = texOf(wall); wallMat.emissiveMap = texOf(wall.glow);
  wallMat.needsUpdate = true;
  painted = fr.open;
}

/** What the store's taped door says: a note from Smeargle, and once it has visited, how long until it opens. */
function shopLine() {
  if (!metSmeargle(loadBase())) return 'Closed. A note on the door says: "Opening soon! Painting like mad. Smeargle"';
  const m = tillMidnight(), h = Math.floor(m / 60);
  return `"Opening tomorrow! The paint's still drying. Smeargle" Opens in ${h ? `${h}h ` : ''}${m % 60}m.`;
}

/* ---------- building the hall ---------- */

const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, ...o });
const lit = (m, src, colour, k) => {
  m.emissive = new THREE.Color(colour); m.emissiveMap = texOf(src.glow); m.userData.glow = k;
  glows.push(m);
  return m;
};

/** A smooth painting standing on the floor, `s` units a painted tile (16 units). */
function stand(c, x, z, s = 1) {
  const w = c.width / c.fine / 16 * s, h = c.height / c.fine / 16 * s;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), std({ map: texOf(c), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1 }));
  mesh.position.set(x, h / 2, z);
  mesh.castShadow = true;
  hall.add(mesh);
  return mesh;
}

function buildHall() {
  hall = new THREE.Group();
  scene.add(hall);
  const edge = std({ color: '#3a3040' });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(COLS, 0.6, ROWS), [edge, edge, std({ map: texOf(floorArt()), roughness: 0.35, metalness: 0.05 }), edge, std({ color: '#d8c8a8' }), edge]);
  floor.position.y = -0.3;
  floor.receiveShadow = true;
  hall.add(floor);
  // a plinth under it, cut at the front, so a tall phone shows no empty band below
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(COLS + 0.8, 7, ROWS + 0.4), [edge, edge, edge, edge, std({ color: '#6a5a48' }), edge]);
  plinth.position.set(0, -0.6 - 3.5, -0.2);
  hall.add(plinth);

  const wall = wallArt(), wm = lit(std({ map: texOf(wall), roughness: 0.9 }), wall, '#fff4dc', 1);
  wallMat = wm; painted = FRONTS[0].open;
  const cap = std({ color: C.shade }), back = new THREE.Mesh(new THREE.BoxGeometry(COLS + 0.8, TOP, 0.4), [cap, cap, cap, cap, wm, cap]);
  back.position.set(0, TOP / 2, -ROWS / 2 - 0.2);
  back.receiveShadow = true;
  hall.add(back);
  // side walls, cut away at the front like the base's
  const side = std({ color: C.cream });
  for (const s of [-1, 1]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.4, TOP, ROWS), side);
    m.position.set(s * (COLS / 2 + 0.2), TOP / 2, 0);
    m.receiveShadow = true;
    hall.add(m);
  }

  // the mezzanine, its lit face and glass rail
  const deckZ = -ROWS / 2 + DECK_D / 2, fascia = fasciaArt();
  const fm = lit(std({ map: texOf(fascia) }), fascia, '#fff4c8', 1);
  const slab = new THREE.Mesh(new THREE.BoxGeometry(COLS + 0.8, 0.22, DECK_D + 0.4), [cap, cap, std({ color: '#e6dcc8' }), std({ color: '#f0e8d8' }), fm, cap]);
  slab.position.set(0, DECK + 0.11, deckZ - 0.2);
  slab.castShadow = slab.receiveShadow = true;
  hall.add(slab);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(COLS + 0.8, 0.5), std({ color: '#cfeaff', transparent: true, opacity: 0.3, roughness: 0.1, metalness: 0.2, depthWrite: false }));
  glass.position.set(0, DECK + 0.22 + 0.25, deckZ + DECK_D / 2 - 0.02);
  hall.add(glass);
  const steel = std({ color: C.steel, metalness: 0.6, roughness: 0.3 });
  const rail = new THREE.Mesh(new THREE.BoxGeometry(COLS + 0.8, 0.05, 0.06), steel);
  rail.position.set(0, DECK + 0.74, deckZ + DECK_D / 2);
  hall.add(rail);
  for (let x = -COLS / 2; x <= COLS / 2 + 0.01; x += COLS / 8) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.52, 0.04), steel);
    post.position.set(x, DECK + 0.48, deckZ + DECK_D / 2);
    hall.add(post);
  }
  for (const x of [-6.1, 6.1]) {   // clear of the shop fronts' signs
    const b = bannerArt(), w = 0.4, h = w * 28 / 10;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), std({ map: texOf(b), alphaTest: 0.5, side: THREE.DoubleSide }));
    m.position.set(x, DECK - h / 2, deckZ + DECK_D / 2 + 0.03);
    hall.add(m);
  }

  // the fronts answer a tap: an invisible board over each
  for (const fr of FRONTS) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.5), new THREE.MeshBasicMaterial({ visible: false }));
    m.position.set(tileX(fr.x), 1.25, -ROWS / 2 + 0.02);
    m.userData.front = fr;
    hall.add(m);
  }
  const shop = FRONTS.find(f => f.id === 'furniture'), show = frontWindow(THREE, tileX(shop.x), -ROWS / 2);
  show.traverse(o => { o.userData.front = shop; });
  hall.add(show);
  const tape = tapeArt();
  for (const fr of FRONTS) if (fr.id !== 'east') tapeOver(fr, tape);
  ribbon = buildRibbon(shop);

  // planters and benches down the sides, light falling from the windows
  const planter = planterArt(), bench = benchArt();
  for (const [x, y] of [[0, 3], [12, 3], [3, 3], [9, 3]]) { stand(planter, tileX(x), tileZ(y), 1.3); blocked.add(key(x, y)); }
  for (const [x, y] of [[1, 5], [11, 5]]) {
    stand(bench, tileX(x), tileZ(y), 1); blocked.add(key(x, y));
  }
  const shaft = shaftArt();
  for (const x of [-4.5, 0.5, 5]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 7), new THREE.MeshBasicMaterial({ map: texOf(shaft), transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.position.set(x, 3.5, -0.6);
    m.rotation.z = 0.32;
    m.raycast = () => {};
    hall.add(m);
  }
  for (const m of glows) m.emissiveIntensity = Math.max(m.userData.glowMin || 0, 0.9) * m.userData.glow;
  places.hall = { id: 'hall', group: hall, blocked, spots: FRONTS, top: DECK + 0.8, title: 'Poké Mall' };
  addDoor(places.hall);
}

const DOOR = { x: 6, y: ROWS - 1 };   // the tile in from the doormat, where every place is walked into

/** A place's way out: the doorstep and doormat past its floor's front edge, under the door tile. */
function addDoor(p) {
  const { step, mat } = doormat(tileX(DOOR.x), ROWS / 2 + 0.47, std({ color: '#b8a888' }));
  mat.userData.exit = true;
  p.group.add(step, mat);
  mats.push(mat.material);
}

/* ---------- walking ---------- */

const STEPS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const free = (c) => c.x >= 0 && c.y >= 0 && c.x < COLS && c.y < ROWS && !blocked.has(key(c.x, c.y));

function route(from, to) {
  const prev = new Map([[key(from.x, from.y), null]]), queue = [from];
  let best = from, bestD = Infinity;
  while (queue.length) {
    const c = queue.shift();
    const d = Math.abs(c.x - to.x) + Math.abs(c.y - to.y);
    if (d < bestD) { best = c; bestD = d; }
    if (!d) break;
    for (const [dx, dy] of STEPS) {
      const n = { x: c.x + dx, y: c.y + dy }, k = key(n.x, n.y);
      if (!free(n) || prev.has(k)) continue;
      prev.set(k, c); queue.push(n);
    }
  }
  const path = [];
  for (let c = best; c && key(c.x, c.y) !== key(from.x, from.y); c = prev.get(key(c.x, c.y))) path.unshift(c);
  return path;
}

function walk(dt) {
  const w = walker, step = w.path[0];
  if (!step) { w.hop = 0; return false; }
  const tx = tileX(step.x), tz = tileZ(step.y), dx = tx - w.x, dz = tz - w.z;
  const d = Math.hypot(dx, dz), move = dt / 1000 * 3.4;
  if (Math.abs(dz) > Math.abs(dx)) w.facing = dz < 0 && mon.sheets.back ? 'back' : 'front';
  else { w.facing = 'front'; w.flip = dx > 0; }
  if (d <= move) { w.x = tx; w.z = tz; w.tile = step; w.path.shift(); }
  else { w.x += dx / d * move; w.z += dz / d * move; }
  w.hop += dt;
  return !w.path.length;
}

const frontAt = (t) => P.spots.find(f => f.step.x === t.x && f.step.y === t.y) ?? null;

/** To a front's doorstep; `enter` goes in on arrival. */
function goTo(fr, enter) {
  if (!walker.path.length && frontAt(walker.tile) === fr) return enter ? enterFront(fr) : say(fr);
  walker.path = route(walker.tile, fr.step);
  aim = enter ? fr : null;
  if (!walker.path.length) enterFront(fr);
}

function arrived() {
  if (walker.exit) { walker.exit = false; return back(); }
  if (riding) return rideOn();
  const go = aim;
  aim = null;
  // a case's things share doorsteps, so the one you walked to is the one you're at
  here = go && go.step.x === walker.tile.x && go.step.y === walker.tile.y ? go : frontAt(walker.tile);
  if (!here) return;
  walker.facing = mon.sheets.back ? 'back' : 'front'; walker.flip = false;
  if (go === here) enterFront(here); else say(here);
}

/* ---------- the shops ---------- */

const SIZE = { cols: COLS, rows: ROWS, top: TOP, u: U };
const floorOf = () => (P.id === 'f2' ? 2 : P.id === 'f1' ? 1 : 0);
// each place inside a shop: how it's built and which of the hall's fronts its doormat walks back out to
const SHOPS = {
  f1: { front: 'furniture', build: () => buildFloor(THREE, 1, SIZE, !!loadBase().upstairs) },
  f2: { front: 'furniture', build: () => buildFloor(THREE, 2, SIZE, !!loadBase().upstairs) },
  gc: { front: 'corner', build: () => buildCorner(THREE, SIZE) },
};

/** Into a place: the hall, a store floor or the Game Corner (built the first time), at tile `at`, under the curtain. */
async function goPlace(id, at, facing = 'back', sound = 'door') {
  await curtain(true);
  if (!root?.isConnected) return;
  if (!places[id]) {
    const built = SHOPS[id].build();
    const k = built.keeper, spot = built.spots.find(s => s.kind === 'keeper');
    k.mon = await monBoard(k, false);
    k.mon.board.rotation.x = -PITCH;
    k.mon.group.position.set(k.x, 0.3, k.z);   // on a step behind the counter, so it shows over it
    k.mon.group.traverse(o => { o.userData.front = spot; });
    built.group.add(k.mon.group);
    places[id] = { id, front: SHOPS[id].front, ...built };
    if (id !== 'f2') addDoor(places[id]);   // upstairs the way out is the lift down
    scene.add(built.group);
  }
  setPlace(places[id], at, facing);
  if (id === 'hall') syncRibbon();
  if (sound) playSound(sound);
  await curtain(false);
  const b = loadBase();
  if (id === 'f1' && metSmeargle(b) && !b.shopGreeted) {
    b.shopGreeted = true;
    saveBase(b);
    return talk('You came! Welcome to my shop! Every piece on the stands is fresh today. Tap one and I\'ll tell you about it.', 5600);
  }
  if (P.keeper) talk(pickLine(P.keeper.hello), 4200);
}

const pickLine = (lines) => lines[Math.floor(Math.random() * lines.length)];

/** The shopkeeper says it, in its speech window. */
const talk = (line, ms) => say({ line }, ms);

function setPlace(p, at, facing = 'back') {
  if (P) P.group.visible = false;
  P = p; P.group.visible = true; blocked = P.blocked;
  pick(null);
  closeAsk(false);
  walker.path = []; aim = null; here = null; riding = null;
  // the shops' tilt-shift is gentle (the user found them too blurry), the hall keeps the Clearing's
  const shop = P.id !== 'hall', u = post.final.uniforms;
  u.uBlur.value = shop ? 1.5 : 5;
  u.uBand.value = shop ? 0.3 : 0.16;
  walker.tile = { ...at }; walker.x = tileX(at.x); walker.z = tileZ(at.y);
  walker.facing = facing === 'back' && mon.sheets.back ? 'back' : 'front'; walker.flip = false;
  camX = walker.x;
  root.querySelector('.b3-top h2').textContent = P.title;
  hemi.intensity = 1.7 * (P.light ?? 1); sun.intensity = 2.2 * (P.light ?? 1);   // the arcade is dim, its neon does the lighting
  showCoins();
  if (viewW) fitShot(viewW, viewH);
}

function showCoins() {
  const el = root.querySelector('.mall-coins');
  el.hidden = P.id === 'hall';
  el.textContent = `${(getSave().coins ?? 0).toLocaleString()} coins`;
}

function pick(spot) {
  picked = spot;
  if (P?.ring) {
    P.ring.visible = !!spot && spot.kind === 'bay';
    if (P.ring.visible) P.ring.position.set(spot.at.x, spot.at.y ?? 0.02, spot.at.z);
  }
  if (P?.frame) {   // the Game Corner's gold frame, over a case's thing or a machine
    const f = spot?.frame;
    P.frame.visible = !!f;
    if (f) { P.frame.position.set(f.x, f.y, f.z); P.frame.scale.set(f.w, f.h, 1); }
  }
}

/** The buy window over the store: the question, the thing's picture if it has one, Buy and No; a tap on the room is No.
    Resolves true for Buy. */
function ask(text, art = null) {
  closeAsk(false);
  clearTimeout(say.t);
  lineEl.classList.remove('on');
  askEl.querySelector('.mall-ask-q').textContent = text;
  askEl.querySelector('.mall-ask-who').textContent = P.keeper?.name ?? '';
  const pic = askEl.querySelector('.mall-ask-pic');
  pic.replaceChildren(...(art ? [art] : []));
  pic.hidden = !art;
  askEl.hidden = false;
  askEl.classList.remove('b3-say'); void askEl.offsetWidth; askEl.classList.add('b3-say');
  return new Promise(res => { answer = res; });
}

function closeAsk(yes) {
  if (askEl) askEl.hidden = true;
  const res = answer;
  answer = null;
  res?.(yes);
}

/** A piece's painting, front on, for the buy window. */
function pieceArt(id) {
  const a = PIECES[id].art(0, 4), c = document.createElement('canvas');
  c.width = a.width; c.height = a.height;
  c.getContext('2d').drawImage(a, 0, 0);
  return c;
}

/** A Game Corner prize (a skin, a ball pack, a shiny, a perk): the first tap picks it and Meowth says what it is and
    costs, the next buys it, the same as the cabinet's Buy (js/shop.js's buyCorner()). */
async function prizeTap(spot) {
  const e = cornerEntries(spot.row)[spot.i], coins = getSave().coins ?? 0;
  if (picked !== spot) {
    pick(spot);
    playSound('select');
    if (e.blocked) return talk(`${e.dark ? 'Who\'s that Pokémon? ' : ''}${e.text}`, 4600);
    if (e.done) return talk(`${e.name}: ${e.done === 'Maxed' ? 'maxed out already, meow!' : 'that one\'s yours already, meow!'}`, 3600);
    const what = spot.row === 'perks' ? ` ${e.text}${e.level ? ` (${e.level})` : ''}` : spot.row === 'balls' ? ` ${e.text}` : '';
    return talk(`${e.name}!${what} That's ${e.cost.toLocaleString()} PokéCoins. Tap again and it's yours, meow.`, 5200);
  }
  if (e.done || e.blocked) { pick(null); return prizeTap(spot); }
  if (coins < e.cost) { playSound('cancel'); return talk(`No dice, you're ${(e.cost - coins).toLocaleString()} PokéCoins short for that, meow.`, 3600); }
  if (!await ask(`Buy ${e.name} for ${e.cost.toLocaleString()} PokéCoins?`)) return pick(null);
  const news = buyCorner(e);
  if (!news) { playSound('cancel'); return talk(`No dice, you're ${(e.cost - coins).toLocaleString()} PokéCoins short for that, meow.`, 3600); }
  playSound('buy');
  walker.hopUntil = performance.now() + 500;
  P.keeper.hopUntil = performance.now() + 600;
  pick(null);
  P.refresh();
  showCoins();
  talk(`Ka-ching! ${news.join(' ')}`, 4600);
}

/** A plinth: the first tap picks it and says its price, the next buys it into the Secret Base's storage. */
async function bayTap(spot) {
  const p = PIECES[spot.piece], n = styles(spot.piece).length, all = n > 1 ? ` (all ${n} styles)` : '';
  if (picked !== spot) {
    pick(spot);
    playSound('select');
    const had = loadBase().owned[p.own] || 0;
    return talk(`Ooh, the ${p.name.toLowerCase()}${all}! That's ${p.price.toLocaleString()} PokéCoins. Tap again and it's yours.${had ? ` You have ${had} already.` : ''}`, 4600);
  }
  const coins = getSave().coins ?? 0, short = () => { playSound('cancel'); talk(`Oh dear, you're ${(p.price - coins).toLocaleString()} PokéCoins short for the ${p.name.toLowerCase()}.`, 3600); };
  if (coins < p.price) return short();
  if (!await ask(`Buy the ${p.name.toLowerCase()}${all} for ${p.price.toLocaleString()} PokéCoins?`, pieceArt(spot.piece))) return pick(null);
  if (!buyPiece(loadBase(), spot.piece)) return short();
  playSound('buy');
  walker.hopUntil = performance.now() + 500;
  P.keeper.hopUntil = performance.now() + 600;
  pick(null);
  showCoins();
  talk(n > 1 ? `Thank you! All ${n} styles of the ${p.name.toLowerCase()} are off to your Secret Base.` : `Thank you! The ${p.name.toLowerCase()} is off to your Secret Base.`, 3600);
}

/** The shopkeeper: its cry, a little hop and a line. */
function keeperTap() {
  pick(null);
  playCry(P.keeper.mon.id);
  P.keeper.hopUntil = performance.now() + 600;
  talk(pickLine(P.keeper.chat), 4200);
}

/** The lift: roped off until the second floor is bought (a tap asks, a second buys), then ridden up, or down again. */
async function liftTap(spot) {
  if (floorOf() === 1 && !loadBase().upstairs) {
    if (picked !== spot) { pick(spot); playSound('select'); return talk(upstairsLine(), 4600); }
    const coins = getSave().coins ?? 0;
    if (coins >= UPSTAIRS_PRICE && !await ask(`Open the second floor for ${UPSTAIRS_PRICE.toLocaleString()} PokéCoins?`)) return pick(null);
    if (!buyUpstairs(loadBase())) { playSound('cancel'); return talk(`Hmm, you'd need ${(UPSTAIRS_PRICE - coins).toLocaleString()} more PokéCoins to open the second floor.`, 3600); }
    playSound('buy');
    pick(null);
    showCoins();
    if (P.rope) P.rope.visible = false;
    walker.hopUntil = performance.now() + 500;
    return talk('The second floor is open! Hop in the lift.', 3600);
  }
  pick(null);
  riding = 'to';
  walker.path = [{ ...LIFT.door }];   // a step over to the middle of its doors
}

const later = (ms) => new Promise(r => setTimeout(r, calm ? Math.min(ms, 150) : ms));

/** The ride, a step at a time as your partner arrives: at the doors they open with a ding and it steps in; in the car
    it turns round, the doors shut and the dial swings over, then on the other floor they open and it steps out. */
async function rideOn() {
  const place = P, L = P.lift;
  if (riding === 'to') {
    riding = 'in';
    L.want = 1;
    playSound('lift-ding');
    await later(480);
    if (P === place && riding === 'in') walker.path = [{ ...LIFT.inside }];
    return;
  }
  if (riding === 'in') {
    riding = 'ride';
    walker.facing = 'front'; walker.flip = false;
    L.want = 0;
    const to = floorOf() === 1 ? 2 : 1;
    await later(450);
    L.dial = to;
    await later(750);
    if (P !== place) return;
    await goPlace(to === 2 ? 'f2' : 'f1', LIFT.inside, 'front', null);
    if (!root?.isConnected) return;
    riding = 'out';
    P.lift.open = 0; P.lift.want = 1;
    playSound('lift-ding');
    await later(480);
    if (riding === 'out') walker.path = [{ ...LIFT.door }, { ...LIFT.foot }];
    return;
  }
  riding = null;   // out on the mat, the doors shut behind
  L.want = 0;
}

/** A front's line at the bottom, a moment; in the store the shopkeeper says it, in a speech window with its name. */
function say(fr, ms = 2600) {
  lineEl.lastChild.textContent = fr.kind === 'bay' ? `The ${fr.name.toLowerCase()}: ${PIECES[fr.piece].price.toLocaleString()} PokéCoins.`
    : fr.kind === 'prize' ? prizeLine(cornerEntries(fr.row)[fr.i])
    : fr.kind === 'lift' ? (floorOf() === 2 ? 'The lift down to the ground floor.' : loadBase().upstairs ? 'The lift up to the second floor.' : 'The lift upstairs is roped off.')
    : fr.kind === 'keeper' ? 'Tap me if you need anything!'
    : fr.id === 'furniture' && !fr.open ? shopLine()
    : fr.line;
  lineEl.firstChild.textContent = fr.who ?? P.keeper?.name ?? '';
  lineEl.classList.toggle('talk', !!(fr.who || P.keeper));
  lineEl.classList.add('on');
  clearTimeout(say.t);
  say.t = setTimeout(() => lineEl.classList.remove('on'), ms);
}

const prizeLine = (e) => (e.blocked ? `${e.name}: not yet.` : e.done ? `${e.name}: ${e.done.toLowerCase()}.` : `${e.name}: ${e.cost.toLocaleString()} PokéCoins.`);

/** In: a shop's place (the Furniture store, the Game Corner); a shutter only says so. Inside, a spot's own tap. */
function enterFront(fr) {
  if (fr.kind === 'bay') return bayTap(fr);
  if (fr.kind === 'prize') return prizeTap(fr);
  if (fr.kind === 'lift') return liftTap(fr);
  if (fr.kind === 'keeper') return keeperTap();
  if (!fr.open) { playSound('cancel'); return say(fr); }
  if (fr.id === 'furniture' && ribbon?.group.visible) return ribbonTap();
  if (fr.id === 'furniture') return goPlace('f1', { x: 6, y: ROWS - 1 });
  if (fr.id === 'corner') return goPlace('gc', { x: 6, y: ROWS - 1 });
}

/* ---------- taps ---------- */

function ndc(e) {
  const r = view.getBoundingClientRect();
  return [(e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1];
}

function onTap(e) {
  if (answer) return closeAsk(false);
  if (riding || (ribbon?.cutAt && !ribbon.done)) return;
  const ray = new THREE.Raycaster();
  ray.setFromCamera(new THREE.Vector2(...ndc(e)), camera);
  const hits = ray.intersectObjects([P.group, mon.group], true);   // not scene.children: a hidden place still answers a ray
  const first = hits[0]?.object;
  walker.exit = false;
  if (first?.userData.exit) return headOut();
  if (first && first === mon.board) { playCry(mon.id); walker.hopUntil = performance.now() + 500; return; }
  let o = first;
  while (o && !o.userData.front) o = o.parent;
  if (o?.userData.front) return goTo(o.userData.front, true);
  const hit = new THREE.Vector3();
  if (!ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit)) return;
  const t = { x: Math.round(hit.x + COLS / 2 - 0.5), y: Math.round(hit.z + ROWS / 2 - 0.5) };
  if (t.x < 0 || t.y < 0 || t.x >= COLS || t.y >= ROWS) return;
  walker.path = route(walker.tile, t);
  aim = null; here = null; pick(null);
}

/** Your partner walks to the door tile and out over the doormat; then the place is left. */
function headOut() {
  if (riding) return;
  walker.path = route(walker.tile, DOOR);
  walker.path.push({ x: DOOR.x, y: ROWS - 0.03 });
  walker.exit = true;
  aim = null; here = null; pick(null);
}

/* ---------- camera ---------- */

function aimCamera(x, d) {
  camera.position.set(x, LOOK_Y + Math.sin(PITCH) * d, Math.cos(PITCH) * d);
  camera.lookAt(x, LOOK_Y, 0);
  camera.updateMatrixWorld();
}

/* The Clearing's shot: ACROSS tiles at least, and far enough back that the hall from the floor's front edge up to the
   mezzanine's rail fits between the title and the speech window, the doorstep included; a lens shift centres it there. */
function fitShot(w, h) {
  camera.clearViewOffset();
  camera.updateProjectionMatrix();
  const topBar = root.querySelector('.b3-top').offsetHeight, below = root.querySelector('.mall-foot').offsetHeight + 16;
  const avail = h - topBar - below, room = 2 * avail / h * 0.94;
  const span = (d) => {
    aimCamera(0, d);
    return [new THREE.Vector3(0, P.top, -ROWS / 2).project(camera).y, new THREE.Vector3(0, -0.3, ROWS / 2 + 0.95).project(camera).y];
  };
  let lo = 2, hi = 80;
  for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; const [t, b] = span(mid); if (t - b > room) lo = mid; else hi = mid; }
  const halfTan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect;
  const d = Math.max(hi, ACROSS / 2 / halfTan);
  const [t, b] = span(d);
  shot = { dist: d, half: d * halfTan, shift: (1 - (t + b) / 2) / 2 * h - (topBar + avail / 2) };
}

function placeCamera(dt) {
  if (!shot) resize();   // opened while the page had no size yet (a hidden tab)
  if (!shot) return;
  const room = COLS / 2 + 0.4, half = shot.half;
  const want = half >= room ? 0 : Math.max(-room + half, Math.min(room - half, walker.x));
  camX = calm ? want : camX + (want - camX) * Math.min(1, dt / 1000 * 4);
  camera.setViewOffset(viewW, viewH, 0, shot.shift, viewW, viewH);
  aimCamera(camX, shot.dist);
}

function resize() {
  const w = view.clientWidth, h = view.clientHeight;
  if (!w || !h) return;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(w, h, false);
  post.size(w, h);
  camera.aspect = w / h;
  viewW = w; viewH = h;
  fitShot(w, h);
}

/* ---------- the frame ---------- */

function frame(now) {
  if (!root?.isConnected) return;
  const dt = Math.min(100, now - (last || now));
  last = now;
  if (walk(dt)) arrived();
  const hopping = walker.hopUntil > now;
  const bob = calm ? 0 : walker.path.length ? Math.abs(Math.sin(walker.hop / 1000 * Math.PI * 4)) * 0.08 : hopping ? Math.abs(Math.sin((walker.hopUntil - now) / 500 * Math.PI * 2)) * 0.35 : 0;
  mon.group.position.set(walker.x, 0, walker.z);
  const lift = P.lift;
  if (lift) {   // the doors slide apart into the case's sides, eased; the dial's needle swings to the floor it's going to
    const gap = lift.want - lift.open;
    lift.open = calm ? lift.want : lift.open + Math.sign(gap) * Math.min(Math.abs(gap), dt / 420);
    const e = lift.open * lift.open * (3 - 2 * lift.open);
    for (const d of lift.doors) d.position.x = d.userData.home + d.userData.side * 0.5 * e;
    const turn = lift.dial === 1 ? Math.PI / 4 : -Math.PI / 4;
    lift.needle.rotation.z += (turn - lift.needle.rotation.z) * (calm ? 1 : Math.min(1, dt / 1000 * 2.5));
  }
  mon.board.position.y = bob;
  mon.board.scale.x = walker.flip ? -1 : 1;
  drawMon(mon, walker, dt);
  const k = P.keeper?.mon;
  if (k) {   // the shopkeeper turns to face your partner, and hops when it's pleased
    drawMon(k, { facing: 'front' }, dt);
    k.board.scale.x = walker.x > P.keeper.x + 0.3 ? -1 : 1;
    const left = (P.keeper.hopUntil || 0) - now;
    k.board.position.y = !calm && left > 0 ? Math.abs(Math.sin(left / 600 * Math.PI * 2)) * 0.3 : 0;
  }
  tickRibbon(dt, now);
  tickConfetti(dt, now);
  if (!calm) for (const m of mats) m.emissiveIntensity = 0.12 + Math.sin(now / 420) * 0.1;
  placeCamera(dt);
  post.draw(scene, camera, (new THREE.Vector3(walker.x, 0.6, walker.z).project(camera).y + 1) / 2);
  requestAnimationFrame(frame);
}

/* ---------- in and out ---------- */

/** In at the doors: the bottom of the hall, facing in. */
function atDoors() {
  setPlace(places.hall, { x: 6, y: ROWS - 1 });
}

/** Out over the doormat: from a shop to its doorstep in the hall, or out of the mall. */
function back() {
  if (P.id === 'hall') return leave();
  goPlace('hall', FRONTS.find(f => f.id === P.front).step, 'front');
}

async function leave() {
  const shop = document.getElementById('shop-dialog');
  if (shop?.open) shop.close();
  playSound('door');
  await curtain(true);
  root.remove();
  if (leaveTo) await leaveTo(); else location.href = location.pathname;
  curtain(false);
}

/** The Poké Mall's hall. `onLeave` is where its doormat goes (the Clearing hands it the way back out of the doors). */
export async function openMall({ onLeave = null, store = null } = {}) {
  leaveTo = onLeave;
  playMusic('mart');   // the Poké Mart's song through the hall and every shop in it; the doormat's showHome() brings 'title' back
  calm = calmFx();
  if (root && renderer) {
    document.body.append(root);
    const mate = buddy(getSave());
    if (mon.src !== mate.src) { dispose(mon.group); scene.remove(mon.group); mon = await monBoard(mate); mon.board.rotation.x = -PITCH; scene.add(mon.group); }
    syncShop();
    atDoors();
    resize();
    last = 0;
    requestAnimationFrame(frame);
    return curtain(false);
  }
  root = document.createElement('section');
  root.className = 'base3d mall3d';
  root.innerHTML = `
    <div class="b3-stage">
      <canvas class="b3-view"></canvas>
      <header class="b3-top"><h2>Poké Mall</h2><span class="mall-coins" hidden></span></header>
      <div class="mall-foot"><p class="mall-line" aria-live="polite"><b class="mall-who"></b><span></span></p><div class="mall-ask" hidden><b class="mall-ask-who"></b><div class="mall-ask-pic"></div><p class="mall-ask-q"></p><div class="mall-ask-keys"><button type="button" class="mall-ask-yes">Buy</button><button type="button" class="mall-ask-no">No</button></div></div></div>
    </div>`;
  document.body.append(root);
  view = root.querySelector('.b3-view');
  askEl = root.querySelector('.mall-ask');
  askEl.querySelector('.mall-ask-yes').addEventListener('click', () => closeAsk(true));
  askEl.querySelector('.mall-ask-no').addEventListener('click', () => { playSound('cancel'); closeAsk(false); });
  lineEl = root.querySelector('.mall-line');

  THREE = await loadThree();
  await hubThree();
  renderer = new THREE.WebGLRenderer({ canvas: view, antialias: false, powerPreference: 'high-performance' });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  scene = new THREE.Scene();
  scene.background = new THREE.Color('#2a2236');
  camera = new THREE.PerspectiveCamera(30, 1, 0.5, 140);
  hemi = new THREE.HemisphereLight('#fffaf0', '#8a7a68', 1.7);
  sun = new THREE.DirectionalLight('#fff4e0', 2.2);
  sun.position.set(-4, 12, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 });
  sun.shadow.bias = -0.0015;
  sun.shadow.normalBias = 0.02;
  scene.add(hemi, sun);
  post = createPost(renderer);
  syncShop();
  buildHall();
  syncShop();
  mon = await monBoard(buddy(getSave()));
  mon.board.rotation.x = -PITCH;
  scene.add(mon.group);
  atDoors();
  resize();
  new ResizeObserver(resize).observe(view);
  view.addEventListener('click', onTap);
  requestAnimationFrame(frame);
  curtain(false);
  if (store === 'furniture' || store === '2f') goPlace(store === '2f' ? 'f2' : 'f1', store === '2f' ? LIFT.foot : { x: 6, y: ROWS - 1 });
  if (store === 'corner') goPlace('gc', { x: 6, y: ROWS - 1 });
}
