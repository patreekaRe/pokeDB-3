/* mall-3d.js  -  the Poké Mall's hall (branch secret-base; the user's call, 2026-10-08: the Game Corner's stall grew into a
   shopping centre with the Game Corner inside). Walked into from its doors in the Clearing (js/hub-3d.js), the same
   HD-2D look as the Secret Base: a marble floor with a red runner, shop fronts along the back wall, a mezzanine with a
   glass rail and the upper floor's lit shops over them, tall windows above. The Game Corner is the middle front, its
   front flat on the wall (cornerFront()), walked into as its own arcade (js/mall-corner.js); the west front is the Furniture store,
   its own place too (js/mall-furniture.js builds its two floors; this file walks every place); the east one is the Safari
   Outfitter (js/mall-outfitter.js), open with the Safari Zone (a new shop is a FRONTS line and its painting on the wall). Tap the floor to walk, a front to go to it and in (no pill at
   the bottom since 2026-10-09, the user's call); the doormat on each place's doorstep walks back out (doormat() in
   js/hd2d.js), but the store's second floor has none, its way out is the lift. A buy is two taps: the first says the
   price, the second asks in a window with the thing's picture (ask()). */

import { getSave, updateSave } from './storage.js';
import { cornerOpen } from './meowth.js';
import { calmFx } from './prefs.js';
import { playSound, playCry, playMusic } from './audio.js';
import { dragWalk, reroute } from './drag-walk.js';
import { buddy, deviceNews } from './trainercard.js';
import { smoothIcon, roundKey } from './smooth-icons.js';
import { openPokedex, openHowto } from './collection.js';
import { loadThree, dispose, monBoard, drawMon, createPost, curtain, doormat, warmShaders, wakeGL, sleepGL } from './hd2d.js';
import { makeCrowd } from './corner-crowd.js';
import { SHOPPERS, MALL_SHARED, MALL_CHATS } from './data/mall-crowd.js';
import { fine, texOf, GC, words, star, hubThree } from './hub-3d.js';
import { cornerEntries, buyCorner } from './shop.js';
import { PIECES, styles, loadBase, saveBase, buyPiece, buyUpstairs, UPSTAIRS_PRICE, metSmeargle, shopOpen, tillMidnight } from './secret-base.js';
import { frontArt, frontWindow, buildFloor, upstairsLine, LIFT, KEEPERS } from './mall-furniture.js';
import { buildCorner, KEEPER } from './mall-corner.js';
import { buildOutfitter, outfitterFront, OUTFITTER_KEEPER, passState, passLine } from './mall-outfitter.js';
import { safariOpen } from './data/pokedex.js';
import { safariDaily } from './data/safari.js';
import { DAY_PASS } from './data/balls.js';
import { cabinetUp } from './home-arcade.js';
import { dressHall, dressFronts, FOUNTAINS, FOUNTAIN_SCALE } from './mall-hall.js';

const COLS = 13, ROWS = 7;   // the shops' floors; the hall is bigger (the user's ask, 2026-10-12: it felt small)
const HC = 21, HR = 10, HALL_DOOR = { x: 10, y: HR - 1 };
const U = 20;                 // the paintings' units a tile
const TOP = 11;               // the walls run up this high, so a tall phone shows no sky over them
const DECK = 3.1, DECK_D = 1;   // the mezzanine's underside and how far it reaches out
const PITCH = 0.6, ACROSS = 8, LOOK_Y = 0.9;   // the Clearing's shot, so your partner is the same size in here

const C = { cream: '#f8f0e0', stone: '#e4d6bc', shade: '#c4b290', red: '#e84838', redDark: '#a82820', ink: '#2a2238',
  marble: ['#f6efe2', '#e8dcc8'], grout: '#d2c2a4', steel: '#d8dce6', warm: ['#fff2c8', '#ffd890', '#e8a860'] };

// the shop fronts along the back wall: x the room's tile at their middle, `step` where you stand to go in
const FRONTS = [
  // the Furniture store opens the UTC day after Smeargle's housewarming in the Secret Base, the Game Corner once Meowth
  // has been met at a crossroads (js/meowth.js), the Safari Outfitter with the Safari Zone; syncShop() opens them; ?mall= goes in
  // either way
  { id: 'furniture', name: 'Furniture', line: '', x: 4, step: { x: 4, y: 1 } },
  { id: 'corner', name: 'Game Corner', line: 'Closed. A note on the tape says: "Grand openin\' soon! Win a run and find me at a crossroads. Meowth"', x: 10, step: { x: 10, y: 1 } },
  { id: 'outfitter', name: 'Safari Outfitter', line: 'Closed. A note on the door says: "Opening with the Safari Zone! Beat every Pokémon in all three biomes. Kangaskhan"', x: 16, step: { x: 16, y: 1 } },
];

let THREE, renderer, scene, camera, post, root, view, lineEl, askEl, hemi, sun;
let mon, walker = { x: 0, z: 0, tile: { ...HALL_DOOR }, path: [], facing: 'back', flip: false, hop: 0 };
let hall, glows = [], blocked = new Set(), aim = null, here = null, answer = null;
// where you are: the hall, a floor of the Furniture store (js/mall-furniture.js) or the Game Corner (js/mall-corner.js),
// each its own group, tiles and spots
let places = {}, P = null, picked = null, riding = null;   // riding: the lift, 'in' stepping into its car, 'out' stepping out
let mats = [];   // every place's doormat, breathing
let wallMat = null, painted = null, tapes = {};   // the back wall's painting (its OPEN / CLOSED plaque) and each front's tape
let dressed = [], env = null;   // the hall's models' ticks (js/mall-hall.js) and its reflections
let calm = false, last = 0, camX = 0, camZ = 0, shot = null, viewW = 0, viewH = 0, leaveTo = null;

// the place you're in can be bigger than the hall (the Game Corner): its tiles, set by setPlace()
let PC = HC, PR = HR;
/** What a place's tick() may draw over the view with: your partner, the camera, the view and its stage. */
const hud = { partner: () => walker, get camera() { return camera; }, get view() { return view; }, get stage() { return root?.querySelector('.b3-stage'); } };
const tileX = (tx) => tx + 0.5 - PC / 2;
const tileZ = (ty) => ty + 0.5 - PR / 2;
const hx = (tx) => tx + 0.5 - HC / 2;       // a hall tile's middle, whichever place is shown
const hz = (ty) => ty + 0.5 - HR / 2;
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
  const W = (HC + 0.8) * U, H = TOP * U, f = fine(W, H, 5), { g, rr, lin, shine } = f, s = shine();
  g.fillStyle = lin(0, 0, 0, H, [C.stone, C.cream, C.cream, C.stone]); g.fillRect(0, 0, W, H);
  // the tall windows, sky and a white truss
  const wt = wy(TOP - 0.3), wb = wy(DECK + 2.8);
  for (let t = 0.3; t < HC - 0.3; t += 2.6) {
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
  const ups = [['ball', '#e84838'], ['potion', '#8a5ad0'], ['berry', '#3a8ad8'], ['disc', '#58a858'], ['star', '#e8a830'], ['ball', '#3a8ad8'], ['berry', '#e870b0'], ['potion', '#58a858']];
  ups.forEach(([icon, colour], i) => { const t = 0.4 + i * 2.6; upperShop(f, s, wx(t) + 2, wx(t + 2.3), ICONS[icon], colour); });
  // the ground floor: pilasters and the three fronts
  for (const fr of FRONTS) {
    const x0 = wx(fr.x - 1) + 2, x1 = wx(fr.x + 2) - 2;
    if (fr.id === 'corner') cornerFront(f, s, x0, x1, wy(2.5), wy(0), !fr.open);
    else if (fr.id === 'furniture') frontArt(f, s, x0, x1, wy(2.5), wy(0), !fr.open);
    else outfitterFront(f, s, x0, x1, wy(2.5), wy(0), !fr.open);
  }
  g.fillStyle = '#6a5a48'; g.fillRect(0, wy(0.12), W, wy(0) - wy(0.12));
  return f.c;
}

/** Polished marble: cream squares set on the diagonal inside a dark granite border, a gold-inlaid ring round the fountain
    with a Poké Ball compass under each fountain, and a red runner straight from the doors to the Game Corner. */
function floorArt() {
  const T = 16, W = HC * T, H = HR * T, f = fine(W, H, 5), { g, rr, lin } = f;
  g.fillStyle = '#4a3e4a'; g.fillRect(0, 0, W, H);
  const b = T * 0.45;
  g.fillStyle = lin(0, 0, W, H, ['#f4ecdc', '#e6d8c0', '#f4ecdc']); g.fillRect(b, b, W - 2 * b, H - 2 * b);
  g.save(); g.beginPath(); g.rect(b, b, W - 2 * b, H - 2 * b); g.clip();
  const d = T * 1.5;
  for (let i = -HR * 2; i < HC * 2; i++) for (let j = -2; j < HR * 2; j++) {
    const cx = i * d + (j % 2) * d / 2, cy = j * d / 2;
    if ((i + j) % 3) continue;
    g.fillStyle = 'rgba(190,160,120,0.32)';
    g.beginPath(); g.moveTo(cx, cy - d / 2); g.lineTo(cx + d / 2, cy); g.lineTo(cx, cy + d / 2); g.lineTo(cx - d / 2, cy); g.closePath(); g.fill();
  }
  g.strokeStyle = 'rgba(170,150,120,0.35)'; g.lineWidth = 0.35;
  for (let k = -H; k < W + H; k += d / 2) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + H, H); g.moveTo(k, H); g.lineTo(k + H, 0); g.stroke(); }
  g.strokeStyle = 'rgba(150,130,110,0.18)'; g.lineWidth = 0.25;   // veins in the marble
  for (let i = 0; i < 70; i++) {
    const x = (i * 97) % W, y = (i * 61) % H;
    g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 8, y + 3, x + 12, y - 4, x + 22, y + 2); g.stroke();
  }
  g.restore();
  g.strokeStyle = '#c89418'; g.lineWidth = 0.7; g.strokeRect(b + 1.2, b + 1.2, W - 2 * b - 2.4, H - 2 * b - 2.4);
  // the runner, from the doors to the Game Corner
  const rx = (HC / 2) * T;
  rr(rx - T / 2 + 1, 0, T - 2, H, 0, '#c89418');
  rr(rx - T / 2 + 2, 0, T - 4, H, 0, lin(rx - T / 2, 0, rx + T / 2, 0, ['#a82838', '#d04050', '#a82838']));
  g.strokeStyle = 'rgba(248,208,64,0.6)'; g.lineWidth = 0.35;
  g.beginPath(); g.moveTo(rx - T / 2 + 3.2, 0); g.lineTo(rx - T / 2 + 3.2, H); g.moveTo(rx + T / 2 - 3.2, 0); g.lineTo(rx + T / 2 - 3.2, H); g.stroke();
  // a ring under each fountain: a dark band set with gold, eight points of a compass, a Poké Ball under the basin
  for (const [tx, ty] of FOUNTAINS) {
    const fx = (tx + 0.5) * T, fy = (ty + 0.5) * T, R = 2.6 * T * FOUNTAIN_SCALE + 1.5, k = FOUNTAIN_SCALE;
    g.fillStyle = '#5a4a5a'; g.beginPath(); g.arc(fx, fy, R, 0, Math.PI * 2); g.fill();
    g.fillStyle = lin(fx - R, fy - R, fx + R, fy + R, ['#fbf6ea', '#ece0c8']); g.beginPath(); g.arc(fx, fy, R - 1.6, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#c89418'; g.lineWidth = 0.7;
    for (const r of [R - 0.4, R - 1.6, R - 4.5]) { g.beginPath(); g.arc(fx, fy, r, 0, Math.PI * 2); g.stroke(); }
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4, r1 = R - 1.8, r0 = R - 4.5;
      g.fillStyle = i % 2 ? '#c89418' : '#a82838';
      g.beginPath(); g.moveTo(fx + Math.cos(a) * r1, fy + Math.sin(a) * r1);
      g.lineTo(fx + Math.cos(a + 0.3) * r0, fy + Math.sin(a + 0.3) * r0);
      g.lineTo(fx + Math.cos(a) * (r0 - 1), fy + Math.sin(a) * (r0 - 1));
      g.lineTo(fx + Math.cos(a - 0.3) * r0, fy + Math.sin(a - 0.3) * r0); g.closePath(); g.fill();
    }
    ball(g, fx, fy, 1.5 * T * 0.62 * k);
  }
  // brass medallions in the border, one before each front
  for (const fr of FRONTS) { g.fillStyle = '#c89418'; star(g, (fr.x + 0.5) * T, b / 2, 2.6); }
  return f.c;
}

/** The mezzanine's face: white, a red stripe, little lights along it. */
function fasciaArt() {
  const W = (HC + 0.8) * U, f = fine(W, 8, 5), { g, lin, shine } = f, s = shine();
  g.fillStyle = lin(0, 0, 0, 8, ['#ffffff', C.cream]); g.fillRect(0, 0, W, 8);
  g.fillStyle = C.red; g.fillRect(0, 3, W, 2);
  for (let x = 4; x < W; x += 8) {
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
  const x = hx(fr.x), z = -HR / 2 + 0.42;
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
// inside (`shopGreeted`) never sees it. `?ribbon` puts it up for the page load, never saved. The Game Corner gets its own
// (2026-10-11, the user's ask) once Meowth has opened it at a crossroads (js/meowth.js): Meowth waits by it, saved as the
// save's `cornerRibbon`; the Safari Outfitter's (2026-10-15) once the Safari Zone is open, Kangaskhan by it, `outfitterRibbon`.
// A shop's ribbon is a RIBBONS line.
const RIBBON_PEEK = new URLSearchParams(location.search).has('ribbon');
const RIBBON_Y = 0.82, RIBBON_Z = -HR / 2 + 0.72;
let ribbons = [], confetti = [];

const RIBBONS = {
  furniture: {
    keeper: KEEPERS[1], into: 'f1',
    up: (b) => RIBBON_PEEK || !(b.ribbonCut || b.shopGreeted),
    cut: () => { const b = loadBase(); b.ribbonCut = true; saveBase(b); },
    ask: 'It\'s the grand opening! Will you do the honours and cut the ribbon? Tap it again!',
    done: 'Snip! The Furniture store is open! Thank you, thank you! Come in, come in!',
  },
  outfitter: {
    keeper: OUTFITTER_KEEPER, into: 'so',
    up: () => RIBBON_PEEK || !getSave().outfitterRibbon,
    cut: () => updateSave(d => { d.outfitterRibbon = true; }),
    ask: 'You opened the Safari Zone, so we\'re open too! Will you cut the ribbon for the Safari Outfitter? Tap it again!',
    done: 'Snip! The Safari Outfitter is open! Come in and kit yourself out, ranger!',
  },
  corner: {
    keeper: KEEPER, into: 'gc',
    up: () => RIBBON_PEEK || !getSave().cornerRibbon,
    cut: () => updateSave(d => { d.cornerRibbon = true; }),
    ask: 'Ya made it, meow! Grand openin\' of the Game Corner! Do the honours and snip that ribbon. Tap it again!',
    done: 'Snip! The Game Corner is open for business! My first honest day\'s work, meow! Step right in!',
  },
};

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
  const group = new THREE.Group(), cx = hx(shop.x), half = 1.38;
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
  return { group, halves, bow, shop, cfg: RIBBONS[shop.id], cutAt: 0, asked: false, done: false, mon: null };
}

const ribbonUp = (r) => r.shop.open && !r.done && r.cfg.up(loadBase());
/** The tiles a ribbon stands on, its keeper's too, walked round while it's up. */
const ribbonTiles = (r) => [-1, 0, 1, 2].map(d => `${r.shop.x + d},0`);

/** Puts each ribbon up or takes it down by the save, its keeper beside it. */
function syncRibbon() {
  for (const r of ribbons) syncOne(r);
  if (!ribbons.some(r => r.group.visible)) clearConfetti();
}

async function syncOne(r) {
  const up = ribbonUp(r);
  r.group.visible = up;
  for (const k of ribbonTiles(r)) up ? places.hall?.blocked.add(k) : places.hall?.fixed.has(k) || places.hall?.blocked.delete(k);
  if (!up) { if (r.mon) r.mon.group.visible = false; return; }
  r.asked = false;
  if (!r.mon) {
    r.mon = await monBoard(r.cfg.keeper, false);
    r.mon.board.rotation.x = -PITCH;
    r.mon.group.traverse(o => { o.userData.front = r.shop; });
    hall.add(r.mon.group);
  }
  r.home = { x: hx(r.shop.x) + 1.95, z: RIBBON_Z + 0.25 };
  r.mon.group.position.set(r.home.x, 0, r.home.z);
  r.mon.group.visible = true;
  r.walkIn = 0;
}

/** The keeper says it, in the speech window, out in the hall. */
const cheer = (r, line, ms) => say({ line, who: r.cfg.keeper.name }, ms);

/** A tap on a shop while its ribbon is up: the first has its keeper ask, the second cuts it. */
async function ribbonTap(r) {
  if (r.cutAt) return;
  r.hopUntil = performance.now() + 600;
  if (!r.asked) {
    r.asked = true;
    playCry(r.cfg.keeper.id);
    return cheer(r, r.cfg.ask, 6000);
  }
  r.cutAt = performance.now();
  playSound('snip');
  if (!RIBBON_PEEK) r.cfg.cut();
  burst(r);
  await later(260);
  playSound('fw-pop');
  playSound('achievement');
  playCry(r.cfg.keeper.id);
  r.hopUntil = performance.now() + 1400;
  walker.hopUntil = performance.now() + 900;
  cheer(r, r.cfg.done, 4200);
  await later(1900);
  r.walkIn = performance.now();
  await later(1700);
  if (P?.id !== 'hall' || !root?.isConnected) return;
  r.done = true;
  await walkIn(r.cfg.into);
  syncRibbon();
}

const CONFETTI = ['#e84838', '#f8d040', '#3a8ad8', '#58b048', '#e870b0', '#ffffff', '#ff9a30'];

/** Confetti over the doors and off each post. */
function burst(r) {
  if (calm) return;
  const cx = hx(r.shop.x), geo = new THREE.PlaneGeometry(0.06, 0.1);
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

/** The cut halves swing down off their posts, the bow drops and bounces, and the keeper hops, then walks in at the doors. */
function tickRibbon(dt, now) {
  for (const r of ribbons) tickOne(r, dt, now);
}

function tickOne(ribbon, dt, now) {
  if (!ribbon.group.visible) return;
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
    const tx = hx(ribbon.shop.x), tz = -HR / 2 + 0.25;
    m.group.position.set(ribbon.home.x + (tx - ribbon.home.x) * e, 0, ribbon.home.z + (tz - ribbon.home.z) * Math.max(0, e * 2 - 1));
    m.board.scale.x = tx > ribbon.home.x ? -1 : 1;
    if (k >= 1) m.group.visible = false;
  }
}

/** The shops' doors by the save: the Furniture store taped up until Smeargle has said it opens, then until that UTC day;
    the Game Corner until Meowth has been met; the Safari Outfitter until the Safari Zone is open. */
function syncShop() {
  const [fr, gc, so] = FRONTS;
  fr.open = shopOpen(loadBase()) || RIBBON_PEEK;
  gc.open = cornerOpen() || RIBBON_PEEK;
  so.open = safariOpen(getSave()) || RIBBON_PEEK;
  for (const f of FRONTS) for (const m of tapes[f.id] || []) m.visible = !f.open;
  syncRibbon();
  if (!wallMat || painted === wallKey()) return;
  const wall = wallArt();
  wallMat.map = texOf(wall); wallMat.emissiveMap = texOf(wall.glow);
  wallMat.needsUpdate = true;
  painted = wallKey();
}
const wallKey = () => FRONTS.map(f => !!f.open).join('|');

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

function buildHall() {
  hall = new THREE.Group();
  scene.add(hall);
  const edge = std({ color: '#3a3040' });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(HC, 0.6, HR), [edge, edge, std({ map: texOf(floorArt()), color: '#e4dccc', roughness: 0.28, metalness: 0.05, envMapIntensity: 0.55 }), edge, std({ color: '#d8c8a8' }), edge]);
  floor.position.y = -0.3;
  floor.receiveShadow = true;
  hall.add(floor);
  // a plinth under it, cut at the front, so a tall phone shows no empty band below
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(HC + 0.8, 7, HR + 0.4), [edge, edge, edge, edge, std({ color: '#6a5a48' }), edge]);
  plinth.position.set(0, -0.6 - 3.5, -0.2);
  hall.add(plinth);

  const wall = wallArt(), wm = lit(std({ map: texOf(wall), roughness: 0.9 }), wall, '#fff4dc', 1);
  wallMat = wm; painted = wallKey();
  const cap = std({ color: C.shade }), back = new THREE.Mesh(new THREE.BoxGeometry(HC + 0.8, TOP, 0.4), [cap, cap, cap, cap, wm, cap]);
  back.position.set(0, TOP / 2, -HR / 2 - 0.2);
  back.receiveShadow = true;
  hall.add(back);
  // side walls, cut away at the front like the base's: cream over a marble dado
  const side = std({ color: C.cream }), dado = std({ color: '#d8ccb4', roughness: 0.3 });
  for (const s of [-1, 1]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.4, TOP, HR), side);
    m.position.set(s * (HC / 2 + 0.2), TOP / 2, 0);
    m.receiveShadow = true;
    const d = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, HR), dado);
    d.position.set(s * HC / 2, 0.45, 0);
    d.receiveShadow = true;
    hall.add(m, d);
  }

  // the mezzanine, its lit face and glass rail (the escalators come up through each end)
  const deckZ = -HR / 2 + DECK_D / 2, fascia = fasciaArt();
  const fm = lit(std({ map: texOf(fascia) }), fascia, '#fff4c8', 1);
  const slab = new THREE.Mesh(new THREE.BoxGeometry(HC + 0.8, 0.22, DECK_D + 0.4), [cap, cap, std({ color: '#e6dcc8' }), std({ color: '#f0e8d8' }), fm, cap]);
  slab.position.set(0, DECK + 0.11, deckZ - 0.2);
  slab.castShadow = slab.receiveShadow = true;
  hall.add(slab);
  const railW = HC - 4.4;
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(railW, 0.5), std({ color: '#cfeaff', transparent: true, opacity: 0.3, roughness: 0.1, metalness: 0.2, depthWrite: false }));
  glass.position.set(0, DECK + 0.22 + 0.25, deckZ + DECK_D / 2 - 0.02);
  hall.add(glass);
  const steel = std({ color: C.steel, metalness: 0.6, roughness: 0.3 });
  const rail = new THREE.Mesh(new THREE.BoxGeometry(railW, 0.05, 0.06), steel);
  rail.position.set(0, DECK + 0.74, deckZ + DECK_D / 2);
  hall.add(rail);
  for (let x = -railW / 2; x <= railW / 2 + 0.01; x += railW / 12) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.52, 0.04), steel);
    post.position.set(x, DECK + 0.48, deckZ + DECK_D / 2);
    hall.add(post);
  }

  // the fronts answer a tap: an invisible board over each
  for (const fr of FRONTS) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.5), new THREE.MeshBasicMaterial({ visible: false }));
    m.position.set(hx(fr.x), 1.25, -HR / 2 + 0.02);
    m.userData.front = fr;
    hall.add(m);
  }
  const shop = FRONTS.find(f => f.id === 'furniture'), show = frontWindow(THREE, hx(shop.x), -HR / 2);
  show.userData.front = shop;
  show.traverse(o => { o.userData.front = shop; });
  hall.add(show);
  const tape = tapeArt();
  for (const fr of FRONTS) tapeOver(fr, tape);
  ribbons = FRONTS.map(buildRibbon);

  // everything modelled: the fountain, planters, benches, lamps, escalators, the shops' entrances (js/mall-hall.js)
  const at = (x, y) => [hx(x), hz(y)], block = (x, y) => blocked.add(key(x, y));
  const decor = dressHall(THREE, { group: hall, at, cols: HC, rows: HR, deck: DECK, deckD: DECK_D, block, calm });
  const fronts = dressFronts(THREE, { group: hall, fronts: FRONTS, at, wallZ: -HR / 2, block, calm });
  dressed = [decor.tick, fronts.tick];
  const shaft = shaftArt();
  for (const x of [-7, -2.5, 2.5, 7]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 7), new THREE.MeshBasicMaterial({ map: texOf(shaft), transparent: true, opacity: 0.26, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.position.set(x, 3.5, -1.2);
    m.rotation.z = 0.32;
    m.raycast = () => {};
    hall.add(m);
  }
  for (const m of glows) m.emissiveIntensity = Math.max(m.userData.glowMin || 0, 0.9) * m.userData.glow;
  places.hall = { id: 'hall', group: hall, blocked, fixed: new Set(blocked), spots: FRONTS, top: DECK + 0.8, title: 'Poké Mall', cols: HC, rows: HR, door: HALL_DOOR };
  addDoor(places.hall);
}

/** Soft reflections for the hall's marble, brass and glass: a warm room with a skylight, a few lamps and the shop
    windows' glow, baked once into an environment map. */
function hallEnv() {
  const pm = new THREE.PMREMGenerator(renderer), s = new THREE.Scene();
  s.add(new THREE.Mesh(new THREE.BoxGeometry(30, 12, 30), new THREE.MeshBasicMaterial({ color: '#6a5a50', side: THREE.BackSide })));
  const panel = (w, h, x, y, z, rx, ry, c) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.rotation.set(rx, ry, 0); s.add(m);
  };
  panel(18, 6, 0, 5.9, 0, Math.PI / 2, 0, new THREE.Color(3.2, 3.1, 2.8));
  for (const x of [-9, -3, 3, 9]) panel(4, 2, x, 2, -14.9, 0, 0, new THREE.Color(2.4, 1.9, 1.2));
  panel(26, 1.2, 0, 0.2, 14.9, 0, 0, new THREE.Color(0.9, 0.8, 0.7));
  const t = pm.fromScene(s, 0.035).texture;
  pm.dispose();
  return t;
}

const DOOR = { x: 6, y: ROWS - 1 };   // the tile in from the doormat, where every place is walked into

/** A place's way out: the doorstep and doormat past its floor's front edge, under the door tile. */
function addDoor(p) {
  const cols = p.cols ?? COLS, rows = p.rows ?? ROWS, door = p.door ?? DOOR;
  const { step, mat } = doormat(door.x + 0.5 - cols / 2, rows / 2 + 0.47, std({ color: '#b8a888' }));
  mat.userData.exit = true;
  p.group.add(step, mat);
  mats.push(mat.material);
}

/* ---------- walking ---------- */

const STEPS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const free = (c) => c.x >= 0 && c.y >= 0 && c.x < PC && c.y < PR && !blocked.has(key(c.x, c.y));

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
  playSound('confirm');   // as you tap, not as you get there (the user's ask, 2026-10-12)
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
  so: { front: 'outfitter', build: () => buildOutfitter(THREE, SIZE) },
};

/** A place's shaders compiled (in parallel where the GPU can), its pictures uploaded and its first frame drawn while the
    curtain is still down: left to the first frame on screen, they froze the mall for a moment just after it opened (the
    user's ask, 2026-10-12). */
async function warm() {
  try {
    scene.traverseVisible(o => { for (const m of [o.material].flat()) if (m) for (const t of [m.map, m.emissiveMap]) if (t?.image && !t.userData.warm) { renderer.initTexture(t); t.userData.warm = true; } });
    await warmShaders(renderer, scene, camera, null, 2000);   // for the post pass's target, as the frame is drawn
    // where the GPU can't compile in parallel that resolves at once and the first frame still links every shader, so
    // draw that frame here, unseen
    placeCamera(0);
    post.draw(scene, camera, 0.5);
  } catch {}
}

/** Into a place: the hall, a store floor or the Game Corner (built the first time), at tile `at`, under the curtain. */
async function goPlace(id, at, facing = 'back', sound = 'door') {
  await curtain(true);
  if (!root?.isConnected) return;
  if (!places[id]) {
    const built = SHOPS[id].build();
    const k = built.keeper, spot = built.spots.find(s => s.kind === 'keeper');
    k.mon = await monBoard(k, false);
    k.mon.board.rotation.x = -PITCH;
    k.mon.group.position.set(k.x, k.lift ?? 0.3, k.z);   // on a step behind the counter, so it shows over it
    k.mon.group.traverse(o => { o.userData.front = spot; });
    built.group.add(k.mon.group);
    places[id] = { id, front: SHOPS[id].front, ...built };
    if (id !== 'f2') addDoor(places[id]);   // upstairs the way out is the lift down
    scene.add(built.group);
    if (id === 'gc') places.gc.crowd = makeCrowd({   // the Game Corner's regulars (js/corner-crowd.js)
      oneWalker: true,
      THREE, group: built.group, monBoard, drawMon, dispose, PITCH, spots: built.spots, door: built.door ?? DOOR,
      cols: built.cols ?? COLS, rows: built.rows ?? ROWS, route, free, tileX, tileZ, camera, view, stage: root.querySelector('.b3-stage'),
      say, partner: () => walker, keeper: () => places.gc.keeper, calm: () => calm,
    });
  }
  setPlace(places[id], at ?? places[id].door ?? DOOR, facing);
  if (id === 'hall') syncRibbon();
  await warm();
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
  if (P) { P.group.visible = false; P.leave?.(); }
  P = p; P.group.visible = true; blocked = P.blocked;
  PC = P.cols ?? COLS; PR = P.rows ?? ROWS;
  pick(null);
  closeAsk(false);
  walker.path = []; aim = null; here = null; riding = null;
  post.final.uniforms.uBlur.value = 0;   // no tilt-shift blur anywhere in the mall (the user's call, 2026-10-12)
  walker.tile = { ...at }; walker.x = tileX(at.x); walker.z = tileZ(at.y);
  walker.facing = facing === 'back' && mon.sheets.back ? 'back' : 'front'; walker.flip = false;
  root.querySelector('.b3-top h2').textContent = P.title;
  placeSign(P.title);
  scene.environment = P.id === 'hall' ? env : null;
  const glow = P.id === 'hall' ? 0.75 : 1;   // the hall's reflections light it too
  hemi.intensity = 1.7 * glow * (P.light ?? 1); sun.intensity = 2.2 * (P.light ?? 1);   // the arcade is dim, its neon does the lighting
  showCoins();
  if (viewW) fitShot(viewW, viewH);
  const deep = Math.max(0, (PR - (shot?.win ?? ROWS)) / 2);
  camX = walker.x; camZ = Math.max(-deep, Math.min(deep, walker.z));
  if (P.id === 'hall' && !P.crowd) P.crowd = hallCrowd();
  P.crowd?.enter();   // after the place is set, so they're dealt to its free tiles
}

// where the hall's Pokémon stand about: the shop windows, the vending machines, the guide, round the fountains
const HALL_STANDS = [[3, 1], [5, 1], [6, 1], [8, 1], [12, 1], [15, 1], [17, 1], [6, 3], [14, 3], [6, 7], [14, 7], [3, 4], [17, 4], [4, 7], [16, 7]];

/** The hall's passers-by (the user's ask, 2026-10-12): two standing about, two wandering, one coming or going now and
    then, a new cast every 8 hours (js/data/mall-crowd.js, walked by js/corner-crowd.js). */
function hallCrowd() {
  return makeCrowd({
    THREE, group: hall, monBoard, drawMon, dispose, PITCH, spots: FRONTS, door: HALL_DOOR, cols: HC, rows: HR,
    route, free, tileX, tileZ, camera, view, stage: root.querySelector('.b3-stage'),
    say, partner: () => walker, keeper: () => null, calm: () => calm,
    cast: SHOPPERS, shared: MALL_SHARED, chats: MALL_CHATS, seed: 'hall', size: 4, castSize: 6, castHours: 8,
    stations: HALL_STANDS.map(([x, y]) => ({ spot: { id: `stand-${x},${y}`, step: { x, y } }, kind: 'stand' })),
    wants: ['stand', 'stand', null, null], swap: [40000, 80000],
  });
}

function showCoins() {
  root.querySelector('.hbar-coins').textContent = (getSave().coins ?? 0).toLocaleString();
  dexNews();
}

/** The Clearing's Pokédex bar along the bottom (the user's ask, 2026-10-13): lens, lights, Home and How to play, the
    PokéCoins on their LCD and the place's name on the right, which pops in as you walk into a shop. No run's LCD here. */
function placeSign(name) {
  const sign = root.querySelector('.hbar-sign b');
  if (sign.textContent === name) return;
  sign.textContent = name;
  sign.classList.remove('hbar-pop');
  void sign.offsetWidth;
  sign.classList.add('hbar-pop');
}

const dexNews = () => root.querySelector('.mall-dex').classList.toggle('dex-news', deviceNews());

/** The device grows out of its key over the mall and shuts back into it, as in the Clearing. */
function fromKey(open, key) {
  if (key.classList.contains('out') || answer || riding) return;
  walker.path = []; aim = null;
  playSound('confirm');
  open(key, () => { key.classList.remove('out'); dexNews(); showCoins(); });
  key.classList.add('out');
}

function pick(spot) {
  picked = spot;
  if (P?.ring) {
    P.ring.visible = !!spot && (spot.kind === 'bay' || !!spot.ring);
    if (P.ring.visible) { P.ring.position.set(spot.at.x, spot.at.y ?? 0.02, spot.at.z); P.ring.scale.setScalar(spot.ring || 1); }
  }
  if (P?.frame) {   // the Game Corner's gold frame, over a case's thing or a machine
    const f = spot?.frame;
    P.frame.visible = !!f;
    if (f) { P.frame.position.set(f.x, f.y, f.z); P.frame.scale.set(f.w, f.h, 1); P.frame.rotation.y = f.ry ?? 0; }
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
    if (e.blocked) return talk(`${e.dark ? 'Who\'s that Pokémon? ' : ''}${e.text}`, 4600);
    if (e.done) return talk(`${e.name}: ${e.done === 'Maxed' ? 'maxed out already, meow!' : 'that one\'s yours already, meow!'}`, 3600);
    const what = spot.row === 'perks' ? ` ${e.text}${e.level ? ` (${e.level})` : ''}` : spot.row === 'balls' ? ` ${e.text}` : '';
    const price = `That's ${e.cost.toLocaleString()} PokéCoins.`;
    return talk(`${e.name}!${what} ${price} Tap again and it's yours, meow.`, 5200);
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

const wareOf = (spot) => cornerEntries('balls').find(e => e.id === spot.ball);

/** A ball pack at the Safari Outfitter: the first tap picks it and Kangaskhan says what it does and costs, the next buys
    it (js/shop.js's buyCorner(), the same as the Game Corner app's Buy). */
async function wareTap(spot) {
  const e = wareOf(spot), coins = getSave().coins ?? 0;
  const short = () => { playSound('cancel'); talk(`Hmm, you're ${(e.cost - coins).toLocaleString()} PokéCoins short for that one.`, 3600); };
  if (picked !== spot) {
    pick(spot);
    if (e.blocked) return talk(e.text, 4600);
    if (e.done) return talk(`${e.name}: that one's yours already! ${e.text}`, 4600);
    const carrying = e.level ? ` You're carrying ${getSave().balls[spot.ball] || 0}.` : '';
    return talk(`${e.name}! ${e.text} ${e.cost.toLocaleString()} PokéCoins.${carrying} Tap again and ${e.level ? 'they\'re' : 'it\'s'} yours.`, 5600);
  }
  if (e.done || e.blocked) { pick(null); return wareTap(spot); }
  if (coins < e.cost) return short();
  if (!await ask(`Buy ${e.name} for ${e.cost.toLocaleString()} PokéCoins?`)) return pick(null);
  const news = buyCorner(e);
  if (!news) return short();
  thanks(`Thank you, ranger! ${news.join(' ')}`);
}

/** The Day Pass machine: the first tap says where today stands, the next buys a pass (if one is still worth buying). */
async function passTap(spot) {
  const state = passState(), coins = getSave().coins ?? 0;
  if (picked !== spot || state === 'pass') { pick(spot); return talk(passLine(state), 5600); }
  const short = () => { playSound('cancel'); talk(`A Day Pass is ${DAY_PASS} PokéCoins, and you have ${coins.toLocaleString()}.`, 3600); };
  if (coins < DAY_PASS) return short();
  if (!await ask(`Buy a Day Pass for ${DAY_PASS} PokéCoins? Replay today's Safari as often as you like until the day ends.`)) return pick(null);
  if ((getSave().coins ?? 0) < DAY_PASS) return short();
  const { day } = safariDaily();
  updateSave(d => { d.coins -= DAY_PASS; d.safari.pass = day; });
  thanks('Here\'s your Day Pass! Replay the Safari as much as you like today.');
}

/** After a buy: the till, two happy hops, the tags repainted and the keeper's thanks. */
function thanks(line) {
  playSound('buy');
  walker.hopUntil = performance.now() + 500;
  P.keeper.hopUntil = performance.now() + 600;
  pick(null);
  P.refresh?.();
  showCoins();
  talk(line, 4600);
}

/** A plinth: the first tap picks it and says its price, the next buys it into the Secret Base's storage. One of each
    piece a player (the user's call, 2026-10-12): once it's owned the platform is sold out, and copies are the PC's. */
async function bayTap(spot) {
  const p = PIECES[spot.piece], n = styles(spot.piece).length, all = n > 1 ? ` (all ${n} styles)` : '';
  if (spot.sold) {
    pick(null);
    return talk(`Sorry, the ${p.name.toLowerCase()} is sold out: you have one already! Your PC's Duplicate can make you more copies.`, 4600);
  }
  if (picked !== spot) {
    pick(spot);
    return talk(`Ooh, the ${p.name.toLowerCase()}${all}! That's ${p.price.toLocaleString()} PokéCoins. Tap again and it's yours.`, 4600);
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
  poof(spot);
  talk(n > 1 ? `Thank you! All ${n} styles of the ${p.name.toLowerCase()} are off to your Secret Base.` : `Thank you! The ${p.name.toLowerCase()} is off to your Secret Base.`, 3600);
}

/* The poof as a piece is bought: it swells and shrinks away into a cloud of soft puffs and a few gold sparkles, then the
   SOLD OUT board pops up in its place. */
const POOF_MS = 900, SIGN_AT = 320;
let poofs = [];

function poof(spot) {
  spot.sold = true;
  if (calm) { spot.ware.visible = false; spot.soldSign.visible = true; return; }
  const box = new THREE.Box3().setFromObject(spot.ware), tall = Math.max(0.5, box.max.y - box.min.y), y0 = box.min.y - spot.bay.position.y;
  const bits = [], puff = new THREE.SphereGeometry(0.26, 12, 8), glint = new THREE.OctahedronGeometry(0.07);
  const smoke = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, depthWrite: false });
  const gold = new THREE.MeshBasicMaterial({ color: '#f8d040', transparent: true, depthWrite: false });
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 7 + Math.random() * 0.4, m = new THREE.Mesh(puff, smoke);
    m.position.set(Math.cos(a) * 0.2, y0 + 0.15 + (i / 23) * tall * 0.9, Math.sin(a) * 0.2);
    m.raycast = () => {};
    spot.bay.add(m);
    bits.push({ m, v: new THREE.Vector3(Math.cos(a) * (0.9 + Math.random() * 0.6), 0.5 + Math.random() * 0.9, Math.sin(a) * (0.9 + Math.random() * 0.6)), grow: 1.4 + Math.random() });
  }
  for (let i = 0; i < 10; i++) {
    const a = Math.random() * Math.PI * 2, m = new THREE.Mesh(glint, gold);
    m.position.set(0, y0 + tall * (0.4 + Math.random() * 0.4), 0);
    m.raycast = () => {};
    spot.bay.add(m);
    bits.push({ m, v: new THREE.Vector3(Math.cos(a) * 1.8, 1.2 + Math.random() * 1.4, Math.sin(a) * 1.8), spark: true });
  }
  spot.soldSign.scale.setScalar(0.001);
  poofs.push({ spot, bits, smoke, gold, t0: performance.now() });
  playSound('fx-poof');
}

function tickPoofs(dt, now) {
  if (!poofs.length) return;
  const t = dt / 1000;
  poofs = poofs.filter(f => {
    const age = now - f.t0, k = Math.min(1, age / POOF_MS);
    const w = Math.min(1, age / 200);   // the piece swells a touch, then shrinks to nothing
    f.spot.ware.scale.setScalar(Math.max(0.001, (1 + Math.sin(w * Math.PI) * 0.15) * (1 - w * w)));
    f.spot.ware.visible = w < 1;
    if (age >= SIGN_AT) {   // the board pops up with a little overshoot
      const s = Math.min(1, (age - SIGN_AT) / 380);
      f.spot.soldSign.visible = true;
      f.spot.soldSign.scale.setScalar(Math.max(0.001, 1 + Math.sin(s * Math.PI) * 0.25 * (1 - s) - (1 - s) ** 3));
    }
    for (const b of f.bits) {
      b.v.multiplyScalar(1 - Math.min(1, t * (b.spark ? 1.5 : 3.2)));
      if (b.spark) b.v.y -= 3 * t;
      b.m.position.addScaledVector(b.v, t);
      if (!b.spark) b.m.scale.setScalar(0.6 + k * b.grow);
      else b.m.rotation.y += 9 * t;
    }
    f.smoke.opacity = 0.9 * (1 - k) ** 1.5;
    f.gold.opacity = 1 - k;
    if (k < 1) return true;
    for (const b of f.bits) b.m.parent?.remove(b.m);
    f.bits[0].m.geometry.dispose(); f.bits.at(-1).m.geometry.dispose(); f.smoke.dispose(); f.gold.dispose();
    f.spot.ware.scale.setScalar(1);
    f.spot.soldSign.scale.setScalar(1);
    return false;
  });
}

/** A Game Corner game (Voltorb Flip, the Gachapon): the first tap picks it and Meowth says what it is, the next sits
    down at it; coming back repaints the coins and the prize cases. */
function gameTap(spot) {
  if (picked !== spot) { pick(spot); return talk(spot.game.line, 4600); }
  if (spot.game.talkOnly) return talk(spot.game.line, 4600);
  pick(null);
  spot.game.open(() => { showCoins(); P?.refresh?.(); });
}

/** The shopkeeper: its cry, a little hop and a line. */
function keeperTap() {
  pick(null);
  playCry(P.keeper.mon.id);
  P.keeper.hopUntil = performance.now() + 600;
  const chat = () => talk(pickLine(P.keeper.chat), 4200);
  if (!P.keeper.special) return chat();
  const place = P;
  P.keeper.special(() => { showCoins(); place?.refresh?.(); }).then(r => { if (r === true || P !== place) return; if (typeof r === 'string') talk(r, 5200); else chat(); });
}

/** The lift: roped off until the second floor is bought (a tap asks, a second buys), then ridden up, or down again. */
async function liftTap(spot) {
  if (floorOf() === 1 && !loadBase().upstairs) {
    if (picked !== spot) { pick(spot); return talk(upstairsLine(), 4600); }
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
    : fr.kind === 'ware' ? prizeLine(wareOf(fr))
    : fr.kind === 'pass' ? `The Day Pass machine: ${passState() === 'pass' ? 'yours for today.' : `${DAY_PASS} PokéCoins.`}`
    : fr.kind === 'lift' ? (floorOf() === 2 ? 'The lift down to the ground floor.' : loadBase().upstairs ? 'The lift up to the second floor.' : 'The lift upstairs is roped off.')
    : fr.kind === 'keeper' ? 'Tap me if you need anything!'
    : fr.id === 'furniture' && !fr.open ? shopLine()
    : FRONTS.includes(fr) && fr.open ? fr.name
    : fr.line;
  lineEl.firstChild.textContent = fr.who ?? P.keeper?.name ?? '';
  lineEl.classList.toggle('talk', !!(fr.who || P.keeper));
  lineEl.classList.add('on');
  clearTimeout(say.t);
  say.t = setTimeout(() => lineEl.classList.remove('on'), ms);
}

const prizeLine = (e) => (e.blocked ? `${e.name}: not yet.` : e.done ? `${e.name}: ${e.done.toLowerCase()}.` : `${e.name}: ${e.cost.toLocaleString()} PokéCoins.`);

/** Into a shop from the hall, through its door (its confirm blip was the tap's, 2026-10-12, the user's ask). */
const walkIn = (id) => goPlace(id, null);

/** In: a shop's place (the Furniture store, the Game Corner); a shutter only says so. Inside, a spot's own tap. */
function enterFront(fr) {
  if (fr.kind === 'bay') return bayTap(fr);
  if (fr.kind === 'prize') return prizeTap(fr);
  if (fr.kind === 'lift') return liftTap(fr);
  if (fr.kind === 'keeper') return keeperTap();
  if (fr.kind === 'game') return gameTap(fr);
  if (fr.kind === 'ware') return wareTap(fr);
  if (fr.kind === 'pass') return passTap(fr);
  if (!fr.open) { playSound('cancel'); return say(fr); }
  const r = ribbons.find(r => r.shop === fr && r.group.visible);
  if (r) return ribbonTap(r);
  if (fr.id === 'furniture') return walkIn('f1');
  if (fr.id === 'corner') return walkIn('gc');
  if (fr.id === 'outfitter') return walkIn('so');
}

/* ---------- taps ---------- */

function ndc(e) {
  const r = view.getBoundingClientRect();
  return [(e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1];
}

/** The floor tile under a pointer, or null off the floor. */
function floorTile(e) {
  const ray = new THREE.Raycaster(), hit = new THREE.Vector3();
  ray.setFromCamera(new THREE.Vector2(...ndc(e)), camera);
  if (!ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit)) return null;
  const t = { x: Math.round(hit.x + PC / 2 - 0.5), y: Math.round(hit.z + PR / 2 - 0.5) };
  return t.x < 0 || t.y < 0 || t.x >= PC || t.y >= PR ? null : t;
}
let drags = null;

function onTap(e) {
  if (drags?.swallowed()) return;
  if (answer) return closeAsk(false);
  if (riding || ribbons.some(r => r.cutAt && !r.done)) return;
  const ray = new THREE.Raycaster();
  ray.setFromCamera(new THREE.Vector2(...ndc(e)), camera);
  const hits = ray.intersectObjects([P.group, mon.group], true);   // not scene.children: a hidden place still answers a ray
  const first = hits[0]?.object;
  walker.exit = false;
  if (first?.userData.patron && P.crowd?.tap(first)) return;
  if (first?.userData.exit) return headOut();
  if (first && first === mon.board) {
    // standing at a stand, your partner covers what's on it (the Outfitter's balls): a tap through it is for the stand
    const at = !walker.path.length && frontAt(walker.tile);
    const behind = at && hits.find(h => { for (let o = h.object; o; o = o.parent) if (o.userData.front) return o.userData.front === at; return false; });
    if (behind) return goTo(at, true);
    playCry(mon.id); walker.hopUntil = performance.now() + 500; return;
  }
  let o = first;
  while (o && !o.userData.front) o = o.parent;
  if (o?.userData.front) return goTo(o.userData.front, true);
  const hit = new THREE.Vector3();
  if (!ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit)) return;
  const t = { x: Math.round(hit.x + PC / 2 - 0.5), y: Math.round(hit.z + PR / 2 - 0.5) };
  if (t.x < 0 || t.y < 0 || t.x >= PC || t.y >= PR) return;
  walker.path = route(walker.tile, t);
  aim = null; here = null; pick(null);
}

/** Your partner walks to the door tile and out over the doormat; then the place is left. */
function headOut() {
  if (riding) return;
  playSound('confirm');
  const door = P.door ?? DOOR;
  walker.path = route(walker.tile, door);
  walker.path.push({ x: door.x, y: PR - 0.03 });
  walker.exit = true;
  aim = null; here = null; pick(null);
}

/* ---------- camera ---------- */

function aimCamera(x, d, z = 0) {
  camera.position.set(x, LOOK_Y + Math.sin(PITCH) * d, z + Math.cos(PITCH) * d);
  camera.lookAt(x, LOOK_Y, z);
  camera.updateMatrixWorld();
}

/* The Clearing's shot: ACROSS tiles at least, and far enough back that ROWS of floor, from its front edge up to the
   mezzanine's rail, fit between the title and the speech window, the doorstep included; a lens shift centres it there.
   A place deeper than that slides the window with your partner; in the hall, a tall phone (whose shot ACROSS already
   holds far back) sees as much more of its depth as fits without stepping back. */
function fitShot(w, h) {
  camera.clearViewOffset();
  camera.updateProjectionMatrix();
  const topBar = root.querySelector('.b3-top').offsetHeight;
  const below = root.querySelector('.mall-foot').offsetHeight + root.querySelector('.hub-bar').offsetHeight + 16;
  const avail = h - topBar - below, room = 2 * avail / h * 0.94;
  const span = (d, w) => {
    aimCamera(0, d);
    return [new THREE.Vector3(0, P.top, -w / 2).project(camera).y, new THREE.Vector3(0, -0.3, w / 2 + 0.95).project(camera).y];
  };
  const fit = (w) => {
    let lo = 2, hi = 80;
    for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; const [t, b] = span(mid, w); if (t - b > room) lo = mid; else hi = mid; }
    return hi;
  };
  const halfTan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect, wide = ACROSS / 2 / halfTan;
  let win = ROWS;
  if (P.id === 'hall') for (let w = PR; w > ROWS; w -= 0.25) if (fit(w) <= wide) { win = w; break; }
  const d = Math.max(fit(win), wide);
  const [t, b] = span(d, win);
  shot = { dist: d, half: d * halfTan, win, shift: (1 - (t + b) / 2) / 2 * h - (topBar + avail / 2) };
}

function placeCamera(dt) {
  if (!shot) resize();   // opened while the page had no size yet (a hidden tab)
  if (!shot) return;
  const room = PC / 2 + 0.4, half = shot.half;
  const want = half >= room ? 0 : Math.max(-room + half, Math.min(room - half, walker.x));
  camX = calm ? want : camX + (want - camX) * Math.min(1, dt / 1000 * 4);
  // a room deeper than the hall slides a hall-deep window along with your partner, so it stays the hall's size
  const deep = Math.max(0, (PR - shot.win) / 2), wantZ = Math.max(-deep, Math.min(deep, walker.z));
  camZ = calm ? wantZ : camZ + (wantZ - camZ) * Math.min(1, dt / 1000 * 4);
  camera.setViewOffset(viewW, viewH, 0, shot.shift, viewW, viewH);
  aimCamera(camX, shot.dist, camZ);
}

function resize() {
  const w = view.clientWidth, h = view.clientHeight;
  if (!w || !h) return;
  // the canvas at the scene's own size, like the Secret Base's: the last pass (bloom, vignette) at a phone's 2x drew four
  // times the pixels and showed nothing more, and cost the mall its frame rate (the user's ask, 2026-10-12)
  renderer.setPixelRatio(post.scale(w, h));
  renderer.setSize(w, h, false);
  post.size(w, h);
  camera.aspect = w / h;
  viewW = w; viewH = h;
  fitShot(w, h);
}

/* ---------- the frame ---------- */

function frame(now) {
  if (!root?.isConnected) return;
  if (cabinetUp()) { last = now; return requestAnimationFrame(frame); }
  const dt = Math.min(100, now - (last || now));
  last = now;
  fpsLog.push(dt); if (fpsLog.length > 60) fpsLog.shift();
  keepUp(now);
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
  P.tick?.(now, dt, hud);
  if (P.id === 'hall') for (const t of dressed) t(now, dt);
  places.gc?.crowd?.tick(now, dt, P.id === 'gc');
  places.hall?.crowd?.tick(now, dt, P.id === 'hall');
  tickRibbon(dt, now);
  tickConfetti(dt, now);
  tickPoofs(dt, now);
  if (!calm) for (const m of mats) m.emissiveIntensity = 0.12 + Math.sin(now / 420) * 0.1;
  placeCamera(dt);
  post.draw(scene, camera, (new THREE.Vector3(walker.x, 0.6, walker.z).project(camera).y + 1) / 2);
  requestAnimationFrame(frame);
}

/** A device that can't hold ~40 fps for 3 s steps down, shadows first, then resolution, remembered per device (the
    Secret Base's way, `keepUp()` in js/base-3d.js). */
let fpsLog = [], slowSince = 0, lowered = 0;
try { lowered = +localStorage.getItem('pokedb.mall3d.low') || 0; } catch {}
function keepUp(now) {
  if (fpsLog.length < 60 || document.hidden) { slowSince = 0; return; }
  const avg = fpsLog.reduce((a, b) => a + b, 0) / fpsLog.length;
  if (avg < 25) { slowSince = 0; return; }
  if (!slowSince) { slowSince = now; return; }
  if (now - slowSince < 3000) return;
  slowSince = 0;
  if (!stepDown()) return;
  try { localStorage.setItem('pokedb.mall3d.low', String(++lowered)); } catch {}
  fpsLog.length = 0;
}
function stepDown() {
  if (sun.shadow.mapSize.x > 512) { sun.shadow.mapSize.set(512, 512); sun.shadow.map?.dispose(); sun.shadow.map = null; return true; }
  if (!post.lower(view.clientWidth || 9999, view.clientHeight || 9999)) return false;
  resize();
  return true;
}

/* ---------- in and out ---------- */

/** In at the doors: the bottom of the hall, facing in. */
function atDoors() {
  setPlace(places.hall, { ...HALL_DOOR });
}

/** Out over the doormat: from a shop to its doorstep in the hall, or out of the mall. */
function back() {
  if (P.id === 'hall') return leave();
  goPlace('hall', FRONTS.find(f => f.id === P.front).step, 'front');
}

export async function leave() {
  const shop = document.getElementById('shop-dialog');
  if (shop?.open) shop.close();
  playSound('door');
  await curtain(true);
  root.remove();
  drags?.off(); drags = null;
  sleepGL(renderer);   // its GPU memory let go; woken as openMall() reopens it
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
    await wakeGL(renderer);
    const mate = buddy(getSave());
    if (mon.src !== mate.src) { dispose(mon.group); scene.remove(mon.group); mon = await monBoard(mate); mon.board.rotation.x = -PITCH; scene.add(mon.group); }
    syncShop();
    atDoors();
    resize();
    last = 0; fpsLog.length = 0;
    requestAnimationFrame(frame);
    return curtain(false);
  }
  root = document.createElement('section');
  root.className = 'base3d mall3d';
  root.innerHTML = `
    <div class="b3-stage">
      <canvas class="b3-view"></canvas>
      <header class="b3-top"><h2>Poké Mall</h2></header>
      <div class="mall-foot"><p class="mall-line" aria-live="polite"><b class="mall-who"></b><span></span></p><div class="mall-ask" hidden><b class="mall-ask-who"></b><div class="mall-ask-pic"></div><p class="mall-ask-q"></p><div class="mall-ask-keys"><button type="button" class="mall-ask-yes">Buy</button><button type="button" class="mall-ask-no">No</button></div></div></div>
      <div class="hub-bar mall-bar">
        <div class="room-hinge"><span class="pdx-lens" aria-hidden="true"></span><span class="mdex-lights" aria-hidden="true"><span class="pdx-light red"></span><span class="pdx-light yellow"></span><span class="pdx-light green"></span></span>
          <div class="room-keys"><button type="button" class="room-home hub-dex mall-dex" aria-label="Pokédex"></button><button type="button" class="room-home hub-help mall-help" title="How to play" aria-label="How to play"></button></div>
          <div class="room-sign hbar-cash" title="PokéCoins"><span class="hbar-coins">0</span></div>
          <div class="room-sign hbar-sign" aria-live="polite"><b></b></div></div>
      </div>
    </div>`;
  document.body.append(root);
  view = root.querySelector('.b3-view');
  askEl = root.querySelector('.mall-ask');
  askEl.querySelector('.mall-ask-yes').addEventListener('click', () => closeAsk(true));
  askEl.querySelector('.mall-ask-no').addEventListener('click', () => { playSound('cancel'); closeAsk(false); });
  lineEl = root.querySelector('.mall-line');
  const bar = root.querySelector('.mall-bar');
  bar.querySelector('.hbar-coins').before(smoothIcon('coin', 'hbar-coin'));
  new ResizeObserver(() => { root.style.setProperty('--hub-bar-h', `${bar.offsetHeight}px`); if (P) resize(); }).observe(bar);
  const dex = bar.querySelector('.mall-dex'), help = bar.querySelector('.mall-help');
  dex.append(roundKey('home'));
  dex.addEventListener('click', () => fromKey((from, onClose) => openPokedex({}, { from, onClose }), dex));
  help.append(roundKey('help'));
  help.addEventListener('click', () => fromKey(openHowto, help));

  THREE = await loadThree();
  await hubThree();
  renderer = new THREE.WebGLRenderer({ canvas: view, antialias: false, powerPreference: 'high-performance' });
  wakeGL(renderer);
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
  post = createPost(renderer, { short: 760, crisp: false });   // smooth, like the Secret Base
  env = hallEnv();
  syncShop();
  buildHall();
  syncShop();
  mon = await monBoard(buddy(getSave()));
  mon.board.rotation.x = -PITCH;
  scene.add(mon.group);
  atDoors();
  resize();
  for (let i = 0; i < lowered; i++) if (!stepDown()) break;
  new ResizeObserver(resize).observe(view);
  view.addEventListener('click', onTap);
  drags?.off();
  drags = dragWalk({
    target: view,
    can: () => !answer && !riding && !ribbons.some(r => r.cutAt && !r.done),
    tile: floorTile,
    go: (t) => { walker.exit = false; aim = null; here = null; pick(null); walker.path = reroute(walker, route, t); },
    done: () => { if (!walker.path.length) arrived(); },
  });
  if (!store) await warm();
  requestAnimationFrame(frame);
  curtain(false);
  if (store === 'furniture' || store === '2f') goPlace(store === '2f' ? 'f2' : 'f1', store === '2f' ? LIFT.foot : null);
  if (store === 'corner') goPlace('gc', null);
  if (store === 'outfitter') goPlace('so', null);
}
