/* mall-outfitter.js  -  the Poké Mall's Safari Outfitter (2026-10-15, the user's ask; picked with the mall's revamp
   2026-10-10 so each shop is one thing coins buy: home, runs, the Safari). The east front in the hall, and its lodge,
   made grand the same day (the user: "way bigger", price cards they couldn't read, "more of a safari aesthetic", the
   wall's things overlapping): a 21 x 13 hall of bamboo and log posts under a thatched eave, its back wall three tidy bays
   (the Safari Zone's map over a jeep, the savanna and the carved sign over Kangaskhan's counter, the leaderboard), the
   packs on tree stumps down two wings each under a big lit price sign, the Master Ball on a roped dais in the middle and
   a thatched Day Pass booth. Opens with the Safari Zone (safariOpen()). Painted smooth like the hall (fine());
   js/mall-3d.js walks it and sells. */

import { BALLS, DAY_PASS, safariAccess } from './data/balls.js';
import { safariDaily } from './data/safari.js';
import { getSave } from './storage.js';
import { cornerEntries } from './shop.js';
import { fine, texOf, words, star } from './hub-3d.js';
import { hallKit } from './mall-hall.js';
import { calmFx } from './prefs.js';

const L = {
  rattan: ['#e8d29a', '#dcc286'], wood: '#9a6a3a', lite: '#c8945a', dark: '#5a3a1e',
  trim: '#4a7a3a', trimDark: '#2e5426', khaki: '#d8c08a', cloth: '#c8a868', felt: '#4f8a3e',
  planks: ['#b8884e', '#ac7c44', '#c09058'], gap: '#6a4422',
  cane: ['#d8b870', '#cca860', '#b8924a'], thatch: ['#e0c078', '#b89048'], sisal: ['#d8c08a', '#c4a870'],
};
export const OUTFITTER_COLOUR = L.trim;

/* The lodge: `x, y` a thing's tile, y 0 the back wall; the aisle runs up the middle from the door to the counter. The
   back wall is three bays between log posts at BAYS' tile edges: the jeep under the map, the counter under the sign,
   the board. Each pack's stump stands in a wing, its step the tile in front. */
const COLS = 21, ROWS = 13, AISLE = 10, DOOR = { x: AISLE, y: ROWS - 1 };
const BAYS = [0, 7, 14, 21];
const STANDS = { great: [2, 4], ultra: [5, 4], luxury: [2, 8], quick: [5, 8], dusk: [15, 4], timer: [18, 4], net: [15, 8], master: [18, 8] };
const DAIS = { x: AISLE, y: 8 }, BOARD = { x: 17, w: 5, h: 3.1, y: 1.3 };
const JEEP = { x: 3, y: 1 }, COUNTER = { x: 8, y: 3, w: 5 };
const STUMP_H = 0.82, BALL_R = 0.24, SIGN_W = 1.5, SIGN_H = 0.75;

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

/** Bamboo poles side by side over dark wood wainscoting, the room's walls, `W` wide; `wy` a height's y. Thatch above
    the beam at 4.85. */
function bamboo(f, W, H, wy) {
  const { g, rr, lin } = f;
  for (let x = 0, i = 0; x < W; x += 6, i++) {
    g.fillStyle = lin(x, 0, x + 6, 0, [L.cane[i % 2], L.cane[2], L.cane[i % 2]]);
    g.fillRect(x, 0, 6, H);
    g.fillStyle = 'rgba(90,60,20,0.35)'; g.fillRect(x + 5.6, 0, 0.4, H);
    for (let y = (i * 11) % 30; y < H; y += 30) { g.fillStyle = 'rgba(110,80,30,0.45)'; g.fillRect(x + 0.4, y, 5.2, 1); g.fillStyle = 'rgba(255,250,220,0.3)'; g.fillRect(x + 0.4, y + 1, 5.2, 0.5); }
  }
  const eave = wy(4.85);
  g.fillStyle = L.thatch[1]; g.fillRect(0, 0, W, eave);
  g.strokeStyle = L.thatch[0]; g.lineWidth = 0.6;
  g.beginPath();
  for (let x = -20; x < W; x += 2.2) { g.moveTo(x, 0); g.lineTo(x + 9, eave); }
  g.stroke();
  g.strokeStyle = 'rgba(80,50,20,0.3)'; g.lineWidth = 0.4;
  g.beginPath();
  for (let x = -20; x < W; x += 3.7) { g.moveTo(x, 0); g.lineTo(x + 6, eave); }
  g.stroke();
  const top = wy(1.05);
  g.fillStyle = lin(0, top, 0, H, [L.wood, L.dark]); g.fillRect(0, top, W, H - top);
  g.fillStyle = 'rgba(30,15,5,0.35)';
  for (let y = top + 5; y < H; y += 5) g.fillRect(0, y, W, 0.5);
  rr(0, top - 1.6, W, 2.2, 0, L.lite);
}

/** The savanna at sunset, framed in bamboo: an orange sky and a low sun, acacias, a herd on the horizon, tall grass. */
function savannaArt(g, x, y, w, h) {
  g.fillStyle = L.dark; g.beginPath(); g.roundRect(x - 2.5, y - 2.5, w + 5, h + 5, 2); g.fill();
  g.fillStyle = L.cane[1]; g.beginPath(); g.roundRect(x - 1.4, y - 1.4, w + 2.8, h + 2.8, 1.4); g.fill();
  const sky = g.createLinearGradient(0, y, 0, y + h);
  for (const [k, c] of [[0, '#f4a860'], [0.45, '#f8c878'], [0.7, '#f8dc98'], [1, '#d8b060']]) sky.addColorStop(k, c);
  g.fillStyle = sky; g.fillRect(x, y, w, h);
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  g.fillStyle = '#fff2c0'; g.beginPath(); g.arc(x + w * 0.62, y + h * 0.62, h * 0.22, 0, Math.PI * 2); g.fill();
  const ground = y + h * 0.72;
  g.fillStyle = '#b08848'; g.fillRect(x, ground, w, h);
  g.fillStyle = '#6a4a28';
  for (const [k, s] of [[0.08, 1], [0.3, 0.7], [0.88, 1.1]]) {   // acacias: a trunk and a flat crown
    const ax = x + w * k, base = ground + 1;
    g.fillRect(ax - 0.6 * s, base - 12 * s, 1.2 * s, 12 * s);
    g.beginPath(); g.ellipse(ax, base - 12 * s, 9 * s, 2.6 * s, 0, 0, Math.PI * 2); g.fill();
  }
  for (const [k, s] of [[0.42, 1], [0.48, 0.8], [0.53, 0.9], [0.72, 0.7]]) {   // a herd far off
    const hx = x + w * k, hy = ground - 1.4 * s;
    g.beginPath(); g.ellipse(hx, hy, 3 * s, 1.5 * s, 0, 0, Math.PI * 2); g.fill();
    g.fillRect(hx - 2.4 * s, hy, 0.6 * s, 2 * s); g.fillRect(hx + 1.8 * s, hy, 0.6 * s, 2 * s);
    g.beginPath(); g.arc(hx + 3.2 * s, hy - 0.8 * s, 1 * s, 0, Math.PI * 2); g.fill();
  }
  g.strokeStyle = '#8a6a30'; g.lineWidth = 0.6;
  g.beginPath();
  for (let gx = x; gx < x + w; gx += 1.6) { g.moveTo(gx, y + h); g.lineTo(gx + 1, ground + 1 + ((gx * 7) % 3)); }
  g.stroke();
  g.restore();
}

/** The back wall: bamboo over wainscoting and thatch over the beam, in three bays between the log posts (js models
    them): the Safari Zone's map over the jeep at the left, the savanna and the carved sign over the counter in the
    middle, the board's bay at the right left clear for it. */
function wallArt({ top: TOP, u: U }) {
  const W = (COLS + 0.8) * U, H = TOP * U, f = fine(W, H, 4), { g, rr, lin, shine } = f, s = shine();
  const wx = (t) => (t + 0.4) * U, wy = (y) => (TOP - y) * U;
  bamboo(f, W, H, wy);
  mapArt(g, wx(0.7), wy(4.45), wx(6.3) - wx(0.7), wy(2.15) - wy(4.45));
  savannaArt(g, wx(7.7), wy(4.0), wx(13.3) - wx(7.7), wy(2.55) - wy(4.0));
  // the carved sign over the counter, on the beam: a wood board, a green inset, a Safari Ball and the name, lit
  const sx = wx(10.5), sw = 5.4 * U, sy = wy(4.75), sh = wy(4.12) - sy;
  rr(sx - sw / 2 + 1, sy + 1.4, sw, sh, 3, 'rgba(40,20,5,0.3)');
  rr(sx - sw / 2, sy, sw, sh, 3, L.dark);
  rr(sx - sw / 2 + 1.4, sy + 1.4, sw - 2.8, sh - 2.8, 2, lin(0, sy, 0, sy + sh, ['#5e9a48', L.trimDark]));
  flatBall(g, sx - sw / 2 + 9, sy + sh / 2, 4.2, '#58a848');
  flatBall(g, sx + sw / 2 - 9, sy + sh / 2, 4.2, '#58a848');
  words(g, 'SAFARI OUTFITTER', sx, sy + sh / 2 + 0.4, 8, '#fbf3dc');
  s.fillStyle = '#3a5a32'; s.beginPath(); s.roundRect(sx - sw / 2 + 1.4, sy + 1.4, sw - 2.8, sh - 2.8, 2); s.fill();
  words(s, 'SAFARI OUTFITTER', sx, sy + sh / 2 + 0.4, 8, '#fff4d0');
  return f.c;
}

/** A side wall's inside, the same bamboo, with a wide window onto the savanna in its middle. */
function sideArt({ top: TOP, u: U }) {
  const W = ROWS * U, H = TOP * U, f = fine(W, H, 3), { g } = f;
  const wy = (y) => (TOP - y) * U;
  bamboo(f, W, H, wy);
  savannaArt(g, W / 2 - 50, wy(3.9), 100, wy(1.6) - wy(3.9));
  return f.c;
}

/** The floor: honey planks, a woven sisal mat under each wing in a green border, a kilim runner up the aisle from the
    door to the counter, a round rug with a compass under the Master Ball's dais, and a welcome mat at the way in. */
function floorArt() {
  const T = 16, f = fine(COLS * T, ROWS * T, 5), { g, rr } = f;
  g.fillStyle = L.gap; g.fillRect(0, 0, COLS * T, ROWS * T);
  const PH = 4;
  for (let r = 0; r * PH < ROWS * T; r++) {
    let x = -((r * 23) % 40);
    for (let n = 0; x < COLS * T; n++) {
      const len = 28 + ((r * 7 + n * 13) % 4) * 8;
      rr(x + 0.25, r * PH + 0.25, len - 0.5, PH - 0.5, 0.4, L.planks[(r * 5 + n * 3) % 3]);
      g.fillStyle = 'rgba(255,230,190,0.16)'; g.fillRect(x + 0.4, r * PH + 0.35, len - 0.8, 0.45);
      x += len;
    }
  }
  for (const x0 of [0.6, 13.6]) {   // the wings' mats
    const x = x0 * T, y = 3.4 * T, w = 6.8 * T, h = 6.6 * T;
    rr(x + 1, y + 1.4, w, h, 3, 'rgba(40,20,5,0.25)');
    rr(x, y, w, h, 3, L.trimDark);
    rr(x + 3, y + 3, w - 6, h - 6, 2, L.sisal[0]);
    g.strokeStyle = L.sisal[1]; g.lineWidth = 0.5;
    g.beginPath();
    for (let k = x + 4; k < x + w - 4; k += 1.8) { g.moveTo(k, y + 3.5); g.lineTo(k, y + h - 3.5); }
    g.stroke();
  }
  // the runner up the aisle, under the dais's rug, to the counter
  const ax = (AISLE - 0.7) * T, aw = 2.4 * T, ay = 4.2 * T, ah = (ROWS - 0.2) * T - ay;
  rr(ax, ay, aw, ah, 1, '#8a3a24');
  rr(ax + 2, ay + 2, aw - 4, ah - 4, 1, '#c8642e');
  g.fillStyle = '#f0d8a0';
  for (let y = ay + 8; y < ay + ah - 6; y += 12) {
    const cx = ax + aw / 2;
    g.beginPath(); g.moveTo(cx, y - 5); g.lineTo(cx + 6, y); g.lineTo(cx, y + 5); g.lineTo(cx - 6, y); g.closePath(); g.fill();
    g.fillStyle = '#2e5426'; g.beginPath(); g.arc(cx, y, 1.6, 0, Math.PI * 2); g.fill(); g.fillStyle = '#f0d8a0';
    for (const sx of [ax + 4.5, ax + aw - 4.5]) { g.beginPath(); g.moveTo(sx, y - 2.4); g.lineTo(sx + 2, y); g.lineTo(sx, y + 2.4); g.lineTo(sx - 2, y); g.closePath(); g.fill(); }
  }
  const cx = (DAIS.x + 0.5) * T, cy = (DAIS.y + 0.5) * T, r = 1.75 * T;
  g.fillStyle = 'rgba(40,20,5,0.3)'; g.beginPath(); g.arc(cx + 1, cy + 1.4, r, 0, Math.PI * 2); g.fill();
  g.fillStyle = L.trimDark; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
  g.fillStyle = L.sisal[0]; g.beginPath(); g.arc(cx, cy, r - 3, 0, Math.PI * 2); g.fill();
  g.strokeStyle = L.trim; g.lineWidth = 1.2; g.beginPath(); g.arc(cx, cy, r - 7, 0, Math.PI * 2); g.stroke();
  g.fillStyle = L.trim;
  for (let i = 0; i < 8; i++) {   // a compass star
    const a = i * Math.PI / 4, long = i % 2 ? r * 0.45 : r * 0.72;
    g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a - 0.18) * 6, cy + Math.sin(a - 0.18) * 6);
    g.lineTo(cx + Math.cos(a) * long, cy + Math.sin(a) * long); g.lineTo(cx + Math.cos(a + 0.18) * 6, cy + Math.sin(a + 0.18) * 6); g.closePath(); g.fill();
  }
  rr(DOOR.x * T + 1.5, (ROWS - 1) * T + 2.5, T - 3, T - 5, 2, L.trim);
  words(g, 'WELCOME', (DOOR.x + 0.5) * T, (ROWS - 0.5) * T, 2.6, '#fbf3dc');
  return f.c;
}

/** A stand's price sign, big and low: a bamboo frame, the ball's name on a green band, a coin and the price, and the
    pack and how many you carry under it (LOCKED / OWNED in place of the price). */
function priceArt(e, b) {
  const f = fine(72, 36, 8), { g, rr } = f;
  rr(0, 0, 72, 36, 3, L.cane[2]);
  g.fillStyle = 'rgba(90,60,20,0.35)'; for (let x = 6; x < 72; x += 6) g.fillRect(x, 0, 0.4, 36);
  rr(2.2, 2.2, 67.6, 31.6, 2, '#fbf3dc');
  rr(2.2, 2.2, 67.6, 10, [2, 2, 0, 0], L.trim);
  words(g, b.name.toUpperCase(), 36, 7.6, 7, '#fbf3dc');
  const big = e.blocked ? 'LOCKED' : e.done ? e.done.toUpperCase() : e.cost.toLocaleString();
  if (!e.blocked && !e.done) {
    g.fillStyle = '#f0c048'; g.beginPath(); g.arc(19, 20.4, 5.2, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#c89418'; star(g, 19, 20.4, 3);
    words(g, big, 43, 21, 13.5, '#4a2c14');
  } else words(g, big, 36, 21, 10, '#4a2c14');
  const note = b.weekly ? 'ONE THROW A WEEK' : `PACK OF ${b.pack} · HAVE ${getSave().balls?.[b.id] || 0}`;
  words(g, note, 36, 30.4, 5, L.trimDark);
  return f.c;
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

/** A ticket's outline, its ends notched like a stub: for the Day Pass signs. */
function ticket(g, x, y, w, h, fill, edge) {
  const n = h * 0.18;
  g.beginPath();
  g.moveTo(x, y); g.lineTo(x + w, y); g.lineTo(x + w, y + h / 2 - n); g.arc(x + w, y + h / 2, n, -Math.PI / 2, Math.PI / 2, true);
  g.lineTo(x + w, y + h); g.lineTo(x, y + h); g.lineTo(x, y + h / 2 + n); g.arc(x, y + h / 2, n, Math.PI / 2, -Math.PI / 2, true); g.closePath();
  g.fillStyle = fill; g.fill();
  g.strokeStyle = edge; g.lineWidth = 1.2; g.stroke();
}

/** The booth's header, so it reads as the Day Pass from across the lodge: a big gold ticket saying DAY PASS. */
function passHeaderArt() {
  const f = fine(64, 18, 8), { g } = f;
  g.clearRect(0, 0, 64, 18);
  ticket(g, 1.5, 1.5, 61, 15, '#f8d048', '#a8381e');
  g.strokeStyle = 'rgba(168,56,30,0.5)'; g.setLineDash([1, 1]); g.lineWidth = 0.5;
  for (const x of [12, 52]) { g.beginPath(); g.moveTo(x, 3); g.lineTo(x, 15); g.stroke(); }
  g.setLineDash([]);
  g.fillStyle = '#a8381e'; for (const x of [7, 57]) star(g, x, 9, 2.6);
  words(g, 'DAY PASS', 32, 9.6, 10, '#8a2a14');
  return f.c;
}

/** The sandwich board beside the booth: DAY PASS, what it does and its price. */
function passBoardArt() {
  const f = fine(40, 50, 8), { g, rr } = f;
  rr(0, 0, 40, 50, 2, L.dark);
  rr(2, 2, 36, 46, 1.4, '#203628');
  ticket(g, 5, 5, 30, 12, '#f8d048', '#a8381e');
  words(g, 'DAY PASS', 20, 11.4, 6, '#8a2a14');
  words(g, 'REPLAY THE', 20, 23, 4.6, '#f4f0e0');
  words(g, 'SAFARI ALL DAY', 20, 28.6, 4.6, '#f4f0e0');
  g.fillStyle = '#f0c048'; g.beginPath(); g.arc(12, 39, 4, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#c89418'; star(g, 12, 39, 2.3);
  words(g, String(DAY_PASS), 25, 39.6, 9, '#ffe890');
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

/** The jeep's door: a Safari Ball and SAFARI ZONE in cream on its green. */
function decalArt() {
  const f = fine(60, 20, 8), { g } = f;
  g.clearRect(0, 0, 60, 20);
  flatBall(g, 10, 10, 7, '#58a848');
  words(g, 'SAFARI', 38, 7.4, 8, '#f4e8c4');
  words(g, 'ZONE', 38, 15, 6, '#f4e8c4');
  return f.c;
}

/** The eave's thatch, strands running down to a ragged edge. */
function thatchArt() {
  const f = fine(64, 24, 6), { g } = f;
  g.clearRect(0, 0, 64, 24);
  g.fillStyle = L.thatch[1]; g.fillRect(0, 0, 64, 18);
  g.strokeStyle = L.thatch[0]; g.lineWidth = 0.7;
  g.beginPath();
  for (let x = 0; x < 64; x += 1.3) { const end = 18 + ((x * 7) % 5); g.moveTo(x, 0); g.lineTo(x + 0.6, end); }
  g.stroke();
  g.strokeStyle = 'rgba(80,50,20,0.4)'; g.lineWidth = 0.4;
  g.beginPath();
  for (let x = 0.6; x < 64; x += 2.9) { g.moveTo(x, 0); g.lineTo(x + 0.4, 17); }
  g.stroke();
  return f.c;
}

/** A stump's top: pale wood in rings. */
function ringsArt() {
  const f = fine(32, 32, 6), { g } = f;
  g.fillStyle = '#d8b080'; g.fillRect(0, 0, 32, 32);
  g.strokeStyle = 'rgba(120,80,40,0.45)'; g.lineWidth = 0.5;
  for (let r = 2; r < 16; r += 2.2) { g.beginPath(); g.arc(16, 16, r, 0, Math.PI * 2); g.stroke(); }
  return f.c;
}

/* ---------- building it ---------- */

/** The Outfitter's lodge, its own COLS x ROWS (like the Game Corner), so the camera follows you through it. `size` gives
    the walls' height and the paintings' units. Returns its group, the tiles it blocks, the spots you can walk up to (each
    ball's stand, the Master Ball's dais, the Day Pass booth, the board and the counter), the gold ring that marks a
    picked one, `refresh()` to repaint the signs after a buy, `tick()` to turn the balls, flicker the torches and fetch
    the board, its size and door, and its shopkeeper's place. */
export function buildOutfitter(THREE, size) {
  const { top: TOP } = size, cols = COLS, rows = ROWS;
  const tileX = (tx) => tx + 0.5 - cols / 2, tileZ = (ty) => ty + 0.5 - rows / 2, wallZ = -rows / 2;
  const group = new THREE.Group(), blocked = new Set(), spots = [], ticks = [], redraws = [];
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, ...o });
  const block = (x0, y0, x1 = x0, y1 = y0) => { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) blocked.add(`${x},${y}`); };
  const calm = calmFx(), kit = hallKit(THREE);
  const put = (parent, geo, mat, x = 0, y = 0, z = 0, shadow = true) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z); m.castShadow = shadow; m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  const edge = std({ color: '#3a2a1a' }), cap = std({ color: L.dark });
  const wood = std({ color: L.wood, roughness: 0.7 }), dark = std({ color: L.dark, roughness: 0.8 });
  const log = std({ color: '#7a5634', roughness: 0.95 }), cane = std({ color: L.cane[2], roughness: 0.6 });
  const brass = std({ color: '#e0b040', metalness: 0.7, roughness: 0.3 }), green = std({ color: L.trim, roughness: 0.6 });
  const thatch = std({ map: texOf(thatchArt()), alphaTest: 0.4, side: THREE.DoubleSide, roughness: 1 });

  put(group, new THREE.BoxGeometry(cols, 0.6, rows), [edge, edge, std({ map: texOf(floorArt()), roughness: 0.7 }), edge, std({ color: '#4a2e18' }), edge], 0, -0.3, 0, false);
  put(group, new THREE.BoxGeometry(cols + 0.8, 7, rows + 0.4), [edge, edge, edge, edge, std({ color: '#4a3420' }), edge], 0, -0.6 - 3.5, -0.2, false);
  const wall = wallArt(size);
  put(group, new THREE.BoxGeometry(cols + 0.8, TOP, 0.4), [cap, cap, cap, cap,
    std({ map: texOf(wall), emissive: new THREE.Color('#fff4dc'), emissiveMap: texOf(wall.glow), roughness: 0.9 }), cap], 0, TOP / 2, wallZ - 0.2, false);
  const sideMat = std({ map: texOf(sideArt(size)), roughness: 0.9 });
  for (const s of [-1, 1]) put(group, new THREE.BoxGeometry(0.4, TOP, rows), s < 0 ? [sideMat, cap, cap, cap, cap, cap] : [cap, sideMat, cap, cap, cap, cap], s * (cols / 2 + 0.2), TOP / 2, 0, false);

  // the lodge's frame: log posts between the back wall's bays and down the side walls, a beam along the back, and a
  // thatched eave over it
  const postAt = (x, z) => {
    put(group, new THREE.CylinderGeometry(0.2, 0.23, TOP, 14), log, x, TOP / 2, z);
    for (const y of [1.1, 4.7]) put(group, new THREE.TorusGeometry(0.22, 0.035, 8, 18), cane, x, y, z, false).rotation.x = Math.PI / 2;
  };
  for (const e of BAYS) postAt(Math.max(-cols / 2 + 0.2, Math.min(cols / 2 - 0.2, e - cols / 2)), wallZ + 0.22);
  for (const s of [-1, 1]) for (const z of [-1.5, 2.5]) postAt(s * (cols / 2 - 0.2), z);
  put(group, new THREE.CylinderGeometry(0.17, 0.17, cols + 0.8, 14), log, 0, 4.86, wallZ + 0.24).rotation.z = Math.PI / 2;
  const eave = put(group, new THREE.PlaneGeometry(cols + 0.8, 1.1), thatch, 0, 5.25, wallZ + 0.62, false);
  eave.rotation.x = -Math.PI / 2 + 0.75;

  const entries = () => cornerEntries('balls');
  const entry = (id) => entries().find(e => e.id === id);
  const spinners = [], flames = [];
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.98, 1.08, 64), new THREE.MeshBasicMaterial({ color: '#f8d040', transparent: true, opacity: 0.9, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2;
  ring.visible = false;
  ring.raycast = () => {};
  group.add(ring);
  /** A price sign's mesh, lit so it reads, repainted after every buy. */
  const sign = (b, w, h) => {
    const map = texOf(priceArt(entry(b.id), b));
    redraws.push(() => { map.image = priceArt(entry(b.id), b); map.needsUpdate = true; });
    return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map, toneMapped: false }));
  };

  // the packs, each on a tree stump with a woven cushion, the rest of the pack at its foot, and its price sign on a low
  // easel in front: kept low (2026-10-16, the user's phone shot: signs up on poles hid the stands behind them), and the
  // wings' rows four apart, so nothing in front reaches what stands behind
  const rings = std({ map: texOf(ringsArt()), roughness: 0.8 }), cushion = std({ color: L.felt, roughness: 1 });
  const velvet = std({ color: '#6a2a9a', roughness: 1 });
  for (const b of BALLS.filter(x => x.stock || x.weekly)) {
    const [x, y] = STANDS[b.id], e = entry(b.id);
    const spot = { id: `ware-${b.id}`, kind: 'ware', ball: b.id, name: e.name, open: true, step: { x, y: y + 1 },
      at: { x: tileX(x), y: 0.02, z: tileZ(y) }, ring: 0.62 };
    spots.push(spot);
    block(x, y);
    const cell = new THREE.Group();
    cell.position.set(tileX(x), 0, tileZ(y));
    put(cell, new THREE.CylinderGeometry(0.4, 0.47, STUMP_H, 18), [log, rings, log], 0, STUMP_H / 2, 0);
    put(cell, new THREE.CylinderGeometry(0.3, 0.32, 0.08, 22), b.weekly ? velvet : cushion, 0, STUMP_H + 0.04, 0);
    const ball = ballMesh(THREE, std, b.id, BALL_R);
    ball.position.y = STUMP_H + 0.07 + BALL_R;
    ball.rotation.y = x * 0.7;
    cell.add(ball);
    // the Master Ball floats a little over its velvet in a soft violet glow, a gold ring round the stump's top
    spinners.push(b.weekly ? { o: ball, k: 0.6, float: STUMP_H + 0.14 + BALL_R } : { o: ball, k: 0.35 + (x % 3) * 0.08 });
    if (b.weekly) {
      put(cell, new THREE.TorusGeometry(0.41, 0.03, 8, 32), brass, 0, STUMP_H, 0, false).rotation.x = Math.PI / 2;
      const glow = put(cell, new THREE.CircleGeometry(0.3, 24), new THREE.MeshBasicMaterial({ color: '#c890ff', transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false }), 0, STUMP_H + 0.085, 0, false);
      glow.rotation.x = -Math.PI / 2;
    }
    for (let n = 0; n < Math.min(b.pack ?? 1, 5) - 1; n++) {
      const a = 0.35 + n * 0.55, little = ballMesh(THREE, std, b.id, 0.1);
      little.position.set(Math.cos(a + 2.4) * 0.6, 0.1, Math.sin(a + 2.4) * 0.42);
      little.rotation.y = -a;
      cell.add(little);
    }
    const board = sign(b, SIGN_W, SIGN_H);
    board.position.set(0, 0.48, 0.62);
    board.rotation.x = -0.55;
    cell.add(board);
    for (const sx of [-0.5, 0.5]) put(cell, new THREE.BoxGeometry(0.05, 0.5, 0.05), cane, sx, 0.25, 0.5).rotation.x = -0.3;
    cell.traverse(o => { o.userData.front = spot; });
    group.add(cell);
  }

  // the Day Pass booth in the middle of the lodge (the user's call, 2026-10-16: off in the corner it was awkward), up on
  // a two-tier dais: a bamboo ticket booth under a thatched roof, its screen, a red button and a ticket in its slot
  let passMap;
  {
    const { x, y } = DAIS;
    const spot = { id: 'pass', kind: 'pass', name: 'Day Pass', open: true, step: { x, y: y + 2 }, at: { x: tileX(x), y: 0.02, z: tileZ(y) }, ring: 1.5 };
    spots.push(spot);
    block(x - 1, y - 1, x + 1, y + 1);
    const base = new THREE.Group();
    base.position.set(tileX(x), 0, tileZ(y));
    put(base, new THREE.CylinderGeometry(1.4, 1.45, 0.14, 40), wood, 0, 0.07, 0);
    put(base, new THREE.CylinderGeometry(1.0, 1.05, 0.14, 40), dark, 0, 0.21, 0);
    const cell = new THREE.Group();
    cell.position.y = 0.28;
    base.add(cell);
    put(cell, new THREE.BoxGeometry(0.95, 1.3, 0.75), cane, 0, 0.65, 0);
    put(cell, new THREE.BoxGeometry(1.05, 0.08, 0.3), wood, 0, 0.74, 0.42);
    for (const sx of [-0.45, 0.45]) put(cell, new THREE.CylinderGeometry(0.05, 0.05, 1.65, 8), log, sx, 0.825, 0.4);
    const roof = put(cell, new THREE.ConeGeometry(0.95, 0.45, 4), std({ color: L.thatch[1], roughness: 1 }), 0, 1.86, 0.05);
    roof.rotation.y = Math.PI / 4;
    passMap = texOf(passArt(passState()));
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.6), new THREE.MeshBasicMaterial({ map: passMap, toneMapped: false }));
    screen.position.set(0, 1.12, 0.38);
    cell.add(screen);
    const button = put(cell, new THREE.CylinderGeometry(0.06, 0.06, 0.05, 18), std({ color: '#e04838', emissive: new THREE.Color('#e04838'), emissiveIntensity: 0.4, roughness: 0.3 }), 0.25, 0.8, 0.45);
    button.rotation.x = 0;
    put(cell, new THREE.BoxGeometry(0.22, 0.01, 0.14), std({ color: '#f8e8b8', roughness: 0.8 }), -0.2, 0.79, 0.44);
    base.traverse(o => { o.userData.front = spot; });
    group.add(base);
    // a big gold DAY PASS ticket across the booth's front under its roof, and a sandwich board beside it (the user's
    // ask, 2026-10-16: make it obvious); both kept low, so they hide nothing behind
    const header = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.42), new THREE.MeshBasicMaterial({ map: texOf(passHeaderArt()), transparent: true, alphaTest: 0.3, toneMapped: false }));
    header.position.set(0, 1.62, 0.5);
    cell.add(header);
    const sandwich = new THREE.Group();
    sandwich.position.set(0.95, -0.14, 0.75);
    sandwich.rotation.y = -0.35;
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.82), new THREE.MeshBasicMaterial({ map: texOf(passBoardArt()), toneMapped: false }));
    face.position.set(0, 0.44, 0.13);
    face.rotation.x = -0.28;
    sandwich.add(face);
    put(sandwich, new THREE.BoxGeometry(0.7, 0.86, 0.03), wood, 0, 0.43, 0.11).rotation.x = -0.28;
    put(sandwich, new THREE.BoxGeometry(0.7, 0.86, 0.03), wood, 0, 0.43, -0.11).rotation.x = 0.28;
    cell.add(sandwich);
    base.traverse(o => { o.userData.front = spot; });
    redraws.push(() => { passMap.image = passArt(passState()); passMap.needsUpdate = true; });
  }

  // the board in the right bay: today's top catchers, fetched now and then; a tap opens the leaderboard
  {
    const canvas = new OffscreenCanvas(448, 280), map = texOf(canvas), lb = { rows: undefined, fetched: -Infinity };
    const board = new THREE.Mesh(new THREE.PlaneGeometry(BOARD.w, BOARD.h), new THREE.MeshBasicMaterial({ map, transparent: true, toneMapped: false }));
    board.position.set(tileX(BOARD.x), BOARD.y + BOARD.h / 2, wallZ + 0.05);
    const paint = () => { boardArt(canvas, lb.rows); map.needsUpdate = true; };
    paint();
    const spot = { id: 'safari-board', kind: 'game', name: 'Safari leaderboard', open: true, step: { x: BOARD.x, y: 2 } };
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

  // the jeep in the left bay, under the map, turned a little to show its side and its door's SAFARI ZONE
  {
    const jeep = new THREE.Group();
    jeep.position.set(tileX(JEEP.x), 0, tileZ(JEEP.y) - 0.45);
    jeep.rotation.y = 0.18;
    const olive = std({ color: '#6a7a3a', roughness: 0.6 }), oliveDark = std({ color: '#4e5a2a', roughness: 0.6 });
    const tyre = std({ color: '#26262c', roughness: 0.9 }), hub = std({ color: '#c8c8c0', metalness: 0.5, roughness: 0.4 });
    const canvasTop = std({ color: L.khaki, roughness: 0.95 }), seat = std({ color: '#6a3a20', roughness: 0.8 });
    put(jeep, new THREE.BoxGeometry(2.8, 0.55, 1.35), olive, 0, 0.6, 0);
    put(jeep, new THREE.BoxGeometry(0.95, 0.12, 1.3), oliveDark, 0.92, 0.93, 0);
    put(jeep, new THREE.BoxGeometry(0.08, 0.42, 1.2), std({ color: '#2a2a30' }), 1.42, 0.62, 0);
    for (const z of [-0.42, 0.42]) {
      const lamp = put(jeep, new THREE.CylinderGeometry(0.09, 0.09, 0.06, 14), std({ color: '#fff4c0', emissive: new THREE.Color('#ffe890'), emissiveIntensity: 0.6 }), 1.45, 0.72, z, false);
      lamp.rotation.z = Math.PI / 2;
    }
    for (const [x, z] of [[-0.9, -0.7], [-0.9, 0.7], [0.95, -0.7], [0.95, 0.7]]) {
      const t = put(jeep, new THREE.CylinderGeometry(0.33, 0.33, 0.24, 20), tyre, x, 0.33, z);
      t.rotation.x = Math.PI / 2;
      const h = put(jeep, new THREE.CylinderGeometry(0.15, 0.15, 0.26, 14), hub, x, 0.33, z, false);
      h.rotation.x = Math.PI / 2;
    }
    const spare = put(jeep, new THREE.CylinderGeometry(0.3, 0.3, 0.2, 20), tyre, -1.5, 0.8, 0);
    spare.rotation.z = Math.PI / 2;
    for (const x of [0.15, -0.65]) put(jeep, new THREE.BoxGeometry(0.5, 0.35, 1.1), seat, x, 0.95, 0);
    for (const z of [-0.62, 0.62]) put(jeep, new THREE.BoxGeometry(0.05, 0.6, 0.05), oliveDark, 0.45, 1.16, z);
    put(jeep, new THREE.BoxGeometry(0.05, 0.05, 1.3), oliveDark, 0.45, 1.46, 0);
    const glass = put(jeep, new THREE.PlaneGeometry(1.2, 0.5), std({ color: '#cfeaff', transparent: true, opacity: 0.3, roughness: 0.1, side: THREE.DoubleSide, depthWrite: false }), 0.45, 1.18, 0, false);
    glass.rotation.y = Math.PI / 2;
    for (const [x, z] of [[-1.25, -0.62], [-1.25, 0.62], [0.3, -0.62], [0.3, 0.62]]) put(jeep, new THREE.CylinderGeometry(0.03, 0.03, 0.75, 8), oliveDark, x, 1.25, z);
    put(jeep, new THREE.BoxGeometry(1.7, 0.08, 1.42), canvasTop, -0.47, 1.64, 0);
    const decal = put(jeep, new THREE.PlaneGeometry(1.2, 0.4), std({ map: texOf(decalArt()), transparent: true, alphaTest: 0.2, roughness: 0.7 }), -0.25, 0.62, 0.68, false);
    decal.position.z = 0.677;
    group.add(jeep);
    block(1, 0, 5, 1);
  }

  // the counter in the middle bay, gear shelves behind it, and the keeper's place between them
  const keeper = { id: 'keeper', kind: 'keeper', name: OUTFITTER_KEEPER.name, open: true, step: { x: COUNTER.x + 2, y: COUNTER.y + 1 } };
  spots.push(keeper);
  block(COUNTER.x, 0, COUNTER.x + COUNTER.w - 1, COUNTER.y);
  const desk = new THREE.Group();
  desk.position.set(tileX(COUNTER.x + 2), 0, tileZ(COUNTER.y));
  put(desk, new THREE.BoxGeometry(COUNTER.w - 0.1, 0.8, 0.72), [wood, wood, wood, wood, std({ map: texOf(counterArt(COUNTER.w)), roughness: 0.7 }), wood], 0, 0.4, 0);
  put(desk, new THREE.BoxGeometry(COUNTER.w + 0.04, 0.08, 0.86), std({ color: L.lite, roughness: 0.5 }), 0, 0.84, 0);
  put(desk, new THREE.SphereGeometry(0.1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), brass, 0.9, 0.88, 0.18);
  const spare = ballMesh(THREE, std, 'great', 0.12);
  spare.position.set(-1.6, 1.0, 0.1);
  desk.add(spare);
  put(desk, new THREE.CylinderGeometry(0.05, 0.05, 0.5, 12), std({ color: '#f0e0b4', roughness: 0.9 }), -0.9, 0.93, 0.05).rotation.set(0, 0.4, Math.PI / 2);
  desk.traverse(o => { o.userData.front = keeper; });
  group.add(desk);
  const shelfMat = std({ map: texOf(shelfArt()), roughness: 0.8 });
  for (const s of [-1, 1]) put(group, new THREE.BoxGeometry(2.3, 2.3, 0.45), [cap, cap, cap, cap, shelfMat, cap], tileX(COUNTER.x + 2) + s * 1.2, 1.15, wallZ + 0.5);

  // crates by the jeep, a torch either side of the way in and the counter, palms in the corners
  const crate = (label, x, y, h, s = 0.8, turn = 0) => put(group, new THREE.BoxGeometry(s, s, s), std({ map: texOf(crateArt(label)), roughness: 0.9 }), tileX(x), h + s / 2, tileZ(y), true).rotation.y = turn;
  crate('BAIT', 0, 0, 0, 0.8, 0.1); crate('BALLS', 0, 0, 0.8, 0.6, -0.2); crate('ROCKS', 6, 0, 0, 0.75, 0.15);
  block(0, 0); block(6, 0);
  const flame = new THREE.MeshBasicMaterial({ color: '#ffb040', transparent: true, opacity: 0.9 });
  for (const [x, y] of [[AISLE - 3, rows - 2], [AISLE + 3, rows - 2], [COUNTER.x - 1, COUNTER.y], [COUNTER.x + COUNTER.w, COUNTER.y]]) {
    put(group, new THREE.CylinderGeometry(0.05, 0.06, 1.5, 8), cane, tileX(x), 0.75, tileZ(y));
    put(group, new THREE.CylinderGeometry(0.16, 0.08, 0.18, 12), dark, tileX(x), 1.55, tileZ(y));
    const f = put(group, new THREE.ConeGeometry(0.11, 0.32, 10), flame, tileX(x), 1.78, tileZ(y), false);
    flames.push({ f, seed: x * 1.3 + y });
    block(x, y);
  }
  for (const [x, y, s] of [[0, rows - 1, 1], [cols - 1, rows - 1, 2], [0, 3, 3], [cols - 1, 3, 4]]) { ticks.push(kit.palm(group, tileX(x), tileZ(y), 2.1, s)); block(x, y); }

  return {
    group, blocked, spots, ring, top: 5.3, title: 'Safari Outfitter', cols, rows, door: DOOR,
    keeper: { ...OUTFITTER_KEEPER, x: tileX(COUNTER.x + 2), z: tileZ(COUNTER.y - 1) },
    refresh: () => redraws.forEach(r => r()),
    tick(now, dt) {
      ticks.forEach(t => t(now));
      if (calm) return;
      for (const s of spinners) {
        s.o.rotation.y += dt / 1000 * s.k;
        if (s.float) s.o.position.y = s.float + Math.sin(now / 700) * 0.03;
      }
      for (const { f, seed } of flames) f.scale.set(1 + Math.sin(now / 90 + seed) * 0.08, 1 + Math.sin(now / 130 + seed * 2) * 0.15, 1);
    },
  };
}
