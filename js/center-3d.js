/* center-3d.js  -  the run's Pokémon Center as a 3D room you walk about (branch pokecenter-3d; the user's ask, 2026-10-09,
   after the Diamond / Pearl / Platinum Centers): orange walls over a red band, a cream tiled floor with the Poké Ball seal,
   the red counter with Chansey behind it, the healing machine (one Poké Ball, put in only once you
   agree to heal) under a big patient monitor, the Clearing's PC (js/hub-pc.js) on the floor before the counter, shelves of
   towels, books and medicine, benches and an escalator down in each front corner. It is only the scene: restSite() in js/run.js keeps the room's
   choices, text box and bar, and this lays the room under them (a canvas in place of the pixel scene). A tap on the
   machine, the PC or Chansey (or the floating sign over it) walks your Pokémon up and picks that choice; the doormat walks
   it to the door and presses Leave. The decor is the Secret Base's furniture models (js/base-mesh.js). */

import { calmFx } from './prefs.js';
import { playSound, playCry } from './audio.js';
import { loadThree, tex, crop, monBoard, drawMon, createPost, doormat } from './hd2d.js';
import { fine, texOf, words, hubThree } from './hub-3d.js';
import { sh as shadeOf } from './base-paint.js';
import { furnitureModel } from './base-mesh.js';
import { dressPlay, tickPlay } from './base-play.js';
import { pcModel, livePc } from './hub-pc.js';
import { PIECES } from './secret-base.js';

const COLS = 11, ROWS = 8;
const U = 20;                 // the paintings' units a tile
const TOP = 8;                // the walls' height, so a tall phone shows wall, not sky, over the counter
const PITCH = 0.42, ACROSS = 6.4, LOOK_Y = 0.8, SHOT_TOP = 3.2;   // a gentle tilt, close in: the room up to the shelves
const COUNTER = { x0: 3, x1: 7, y: 2, h: 0.95, d: 0.9 };
const MACHINE = { x: 3.5, y: 0.3 };   // in tiles, behind the counter
const PC_AT = { x: 7, y: 3 };
// where your Pokémon stands for each choice (the option's index in restSite()), and what it faces
const SPOTS = {
  machine: { option: 0, step: { x: 3, y: 3 } },
  pc: { option: 1, step: { x: 7, y: 4 } },
  nurse: { option: 2, step: { x: 5, y: 3 } },
};
const DOOR = { x: 5, y: ROWS - 1 };
const ESCALATORS = [0, 9];   // each one's left tile; they take the front three rows

const C = { orange: ['#f8a060', '#f08040', '#e06830'], panel: '#f8b070', red: '#e03830', redDark: '#a82418', cream: ['#fdf2dc', '#f6e2c0'],
  tile: ['#fbeec4', '#f4e0a8'], grout: '#e6cc8c', ink: '#2a2238', skirting: '#7a2c1c' };

let THREE, renderer, scene, camera, post, view, hemi, sun;
let room, mon, nurse, monitor, machine, plays = [], anchors = {}, blocked = new Set(), mat = null;
let walker = { x: 0, z: 0, tile: { ...DOOR }, path: [], facing: 'back', flip: false, hop: 0 };
let opts = null, aim = null, busy = false, raf = 0, last = 0, calm = false, shot = null, viewW = 0, viewH = 0, camX = 0;
let vitals = { now: 0, coming: 0, blink: 0, drawn: '' }, healing = null, flashing = null, going = null, popping = null, leftAt = 0, runId = null;

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

/** The lower wall's orange, in panels a tile wide, the red band over it and the cream upper wall. */
function wallBands(f, W) {
  const { g, rr, lin } = f;
  g.fillStyle = lin(0, wy(TOP), 0, wy(2.9), ['#f6dcb4', C.cream[0], C.cream[1]]); g.fillRect(0, 0, W, wy(2.9));
  g.fillStyle = lin(0, wy(2.5), 0, wy(0), C.orange); g.fillRect(0, wy(2.5), W, wy(0) - wy(2.5));
  for (let x = 0; x < W; x += U) {
    rr(x + 2, wy(2.35), U - 4, wy(0.4) - wy(2.35), 1.5, lin(0, wy(2.35), 0, wy(0.4), [C.panel, '#f49058']));
    g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(x + 2.5, wy(2.33), U - 5, 0.8);
  }
  g.fillStyle = lin(0, wy(2.9), 0, wy(2.5), ['#f05040', C.red, C.redDark]); g.fillRect(0, wy(2.9), W, wy(2.5) - wy(2.9));
  g.fillStyle = '#ffffff'; g.fillRect(0, wy(2.83), W, 0.9); g.fillRect(0, wy(2.58), W, 0.9);
  g.fillStyle = C.skirting; g.fillRect(0, wy(0.3), W, wy(0) - wy(0.3));
  g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(0, wy(0.3), W, 0.8);
}

/** A window of sky in a white frame, a curtain each side. */
function skyWindow(f, s, x0, x1, y0, y1) {
  const { g, rr, lin } = f;
  rr(x0 - 1.5, y0 - 1.5, x1 - x0 + 3, y1 - y0 + 3, 1.5, '#ffffff');
  g.fillStyle = lin(0, y0, 0, y1, ['#68b0f0', '#a8d8f8', '#e0f4ff']); g.fillRect(x0, y0, x1 - x0, y1 - y0);
  g.fillStyle = '#ffffff';
  for (const [cx, cy, r] of [[x0 + (x1 - x0) * 0.3, y0 + 9, 4], [x0 + (x1 - x0) * 0.42, y0 + 8, 5], [x0 + (x1 - x0) * 0.55, y0 + 9.5, 3.6]]) { g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = lin(0, y0 + (y1 - y0) * 0.7, 0, y1, ['#78c060', '#58a048']); g.fillRect(x0, y0 + (y1 - y0) * 0.72, x1 - x0, (y1 - y0) * 0.28);
  g.strokeStyle = '#ffffff'; g.lineWidth = 1.2;
  g.beginPath(); g.moveTo((x0 + x1) / 2, y0); g.lineTo((x0 + x1) / 2, y1); g.moveTo(x0, (y0 + y1) / 2); g.lineTo(x1, (y0 + y1) / 2); g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.moveTo(x0 + 2, y0); g.lineTo(x0 + 8, y0); g.lineTo(x0 + 1, y1); g.lineTo(x0, y1); g.lineTo(x0, y0 + 12); g.closePath(); g.fill();
  for (const [a, b] of [[x0 - 4, x0 + 3], [x1 - 3, x1 + 4]]) {
    g.fillStyle = lin(a, 0, b, 0, ['#f8d0d8', '#f0a8b8', '#f8d0d8']);
    g.beginPath(); g.moveTo(a, y0 - 3); g.lineTo(b, y0 - 3); g.quadraticCurveTo((a + b) / 2, (y0 + y1) / 2, b - 1, y1 + 2); g.lineTo(a + 1, y1 + 2); g.closePath(); g.fill();
  }
  rr(x0 - 6, y0 - 5, x1 - x0 + 12, 3, 1.5, '#c89060');
  s.fillStyle = '#304050'; s.fillRect(x0, y0, x1 - x0, y1 - y0);
}

/* ---------- the cabinet behind the counter: what a real Center keeps to hand, never two shelves alike ---------- */

function seeded(n) { return () => { n = (n + 0x6d2b79f5) | 0; let t = Math.imul(n ^ (n >>> 15), 1 | n); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const BOOKS = ['#c84838', '#3868b8', '#e8b838', '#58985a', '#7a4ab0', '#d87830', '#2a6878', '#efe4cc', '#8a3a48'];

// each draws on the shelf's top edge at y, from x, and says how wide it was
const STOCK = {
  books(f, x, y, r) {
    const { g, rr, lin } = f, n = 3 + Math.floor(r() * 4);
    let w = 0;
    for (let i = 0; i < n; i++) {
      const bw = 1.7 + r() * 1.2, bh = 6 + r() * 3.4, col = BOOKS[Math.floor(r() * BOOKS.length)];
      const lean = i === n - 1 && r() < 0.5;
      g.save();
      if (lean) { g.translate(x + w, y); g.rotate(0.2); g.translate(-(x + w), -y); }
      rr(x + w, y - bh, bw, bh, 0.35, lin(x + w, 0, x + w + bw, 0, [col, col, '#00000030']));
      g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillRect(x + w + 0.3, y - bh + 1, bw - 0.6, 0.45); g.fillRect(x + w + 0.3, y - 1.6, bw - 0.6, 0.45);
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x + w + 0.5, y - bh * 0.62, bw - 1, bh * 0.22);
      g.restore();
      w += bw + 0.15 + (lean ? 1.8 : 0);
    }
    return w;
  },
  binders(f, x, y, r) {
    const { g, rr } = f, n = 2 + Math.floor(r() * 3), col = ['#e85848', '#3a8ad8', '#f8f0e0'][Math.floor(r() * 3)];
    for (let i = 0; i < n; i++) {
      rr(x + i * 2.9, y - 9.2, 2.7, 9.2, 0.5, col);
      rr(x + i * 2.9 + 0.5, y - 7.6, 1.7, 2.4, 0.3, '#ffffff');
      g.fillStyle = '#60606a'; g.beginPath(); g.arc(x + i * 2.9 + 1.35, y - 2.2, 0.55, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(x + i * 2.9 + 2.2, y - 9.2, 0.5, 9.2);
    }
    return n * 2.9;
  },
  frame(f, x, y) {
    const { g, rr, lin } = f;
    rr(x, y - 7.2, 6, 7.2, 0.6, '#b8844c');
    rr(x + 0.8, y - 6.4, 4.4, 5.6, 0.3, lin(0, y - 6.4, 0, y - 0.8, ['#9cd0f4', '#d8f0ff']));
    g.fillStyle = '#f8b8c8'; g.beginPath(); g.ellipse(x + 3, y - 2.6, 1.6, 1.8, 0, 0, Math.PI * 2); g.fill();   // Chansey in the photo
    g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(x + 3, y - 2.1, 0.7, 0.6, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#6ab858'; g.fillRect(x + 0.8, y - 1.6, 4.4, 0.8);
    return 6;
  },
  potions(f, x, y, r) {
    const { g, rr, lin } = f, n = 2 + Math.floor(r() * 3);
    const kinds = [['#a868e0', '#7a40b0'], ['#f0c838', '#c09018'], ['#e86090', '#b03060'], ['#58b0f0', '#2a78c0']];
    for (let i = 0; i < n; i++) {
      const [c0, c1] = kinds[Math.floor(r() * kinds.length)], px = x + i * 4.2, h = 5.2 + r() * 1.4;
      rr(px, y - h, 3.4, h, 1.1, lin(px, 0, px + 3.4, 0, [c0, c0, c1]));
      rr(px + 0.4, y - h * 0.62, 2.6, 1.8, 0.3, '#ffffff');
      rr(px + 1, y - h - 1.4, 1.4, 1.6, 0.3, '#e8e8f0');
      rr(px + 0.5, y - h - 2.3, 2.6, 1, 0.4, '#d0d0dc');
      g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(px + 0.55, y - h + 0.8, 0.5, h * 0.4);
    }
    return n * 4.2;
  },
  jar(f, x, y, r) {
    const { g, rr } = f, col = ['#5888f0', '#f06868', '#f8c040'][Math.floor(r() * 3)];
    rr(x, y - 6.4, 5.2, 6.4, 1.2, 'rgba(220,240,255,0.55)');
    for (let i = 0; i < 9; i++) { g.fillStyle = i % 3 ? col : '#ffffff'; g.beginPath(); g.arc(x + 1.2 + (i % 3) * 1.4, y - 1.2 - Math.floor(i / 3) * 1.3, 0.7, 0, Math.PI * 2); g.fill(); }
    rr(x - 0.2, y - 7.4, 5.6, 1.3, 0.5, '#c86848');
    g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(x + 0.6, y - 5.8, 0.5, 4);
    return 5.2;
  },
  towels(f, x, y, r) {
    const { g, rr } = f, n = 2 + Math.floor(r() * 2), w = 8 + r() * 1.5;
    for (let i = 0; i < n; i++) {
      const col = i % 2 ? '#ffffff' : ['#f8b8cc', '#a8d8f0'][Math.floor(r() * 2)];
      rr(x + (i % 2) * 0.4, y - (i + 1) * 2.3, w, 2.2, 1, col);
      g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x + (i % 2) * 0.4 + 0.8, y - (i + 1) * 2.3 + 1.4, w - 1.6, 0.35);
    }
    return w + 0.4;
  },
  kit(f, x, y) {
    const { rr } = f;
    rr(x, y - 5.4, 7.4, 5.4, 0.8, '#f8f6f2');
    rr(x + 2.9, y - 4.6, 1.6, 3.8, 0.2, '#e03830'); rr(x + 1.8, y - 3.5, 3.8, 1.6, 0.2, '#e03830');
    rr(x + 2.6, y - 6.2, 2.2, 0.9, 0.4, '#9a9aa6');
    return 7.4;
  },
  rolls(f, x, y, r) {
    const { g, rr } = f, n = 2 + Math.floor(r() * 2);
    for (let i = 0; i < n; i++) {
      rr(x + i * 2.8, y - 3.4, 2.6, 3.4, 1.2, '#fbfaf6');
      g.fillStyle = '#d8d4cc'; g.beginPath(); g.ellipse(x + i * 2.8 + 1.3, y - 3.4, 1.3, 0.5, 0, 0, Math.PI * 2); g.fill();
    }
    return n * 2.8;
  },
  plant(f, x, y, r) {
    const { g, rr } = f;
    for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? '#58a848' : '#3e8a38'; g.save(); g.translate(x + 2.4, y - 3.6); g.rotate(-1.2 + i * 0.48 + r() * 0.2); g.beginPath(); g.ellipse(0, -2.4, 0.9, 2.6, 0, 0, Math.PI * 2); g.fill(); g.restore(); }
    rr(x + 0.6, y - 3.8, 3.6, 3.8, 0.6, '#d07848');
    rr(x + 0.3, y - 4.2, 4.2, 1, 0.4, '#e08858');
    return 4.8;
  },
};
const LEVELS = [['books', 'frame', 'binders', 'books', 'plant'], ['potions', 'jar', 'potions', 'towels', 'kit'], ['towels', 'kit', 'rolls', 'towels', 'jar']];

/** A wooden cabinet of three shelves on the wall, each stocked differently, a soft shadow under every board. */
function cabinet(f, x0, x1, y0, y1) {
  const { g, rr, lin } = f, r = seeded(11);
  rr(x0 - 2, y0 - 2, x1 - x0 + 4, y1 - y0 + 4, 1.5, lin(x0, 0, x1, 0, ['#b8723c', '#c8844c', '#a8622e']));
  rr(x0, y0, x1 - x0, y1 - y0, 0.8, lin(0, y0, 0, y1, ['#f6e6c8', '#ead2aa']));
  const rows = 3, step = (y1 - y0) / rows;
  for (let i = 0; i < rows; i++) {
    const base = y0 + step * (i + 1) - 1.4, kinds = LEVELS[i].slice().sort(() => r() - 0.5);
    g.fillStyle = lin(0, base - 8, 0, base, ['rgba(120,70,30,0)', 'rgba(120,70,30,0.18)']); g.fillRect(x0, base - 8, x1 - x0, 8);
    let x = x0 + 1.5 + r() * 2, k = 0;
    while (x < x1 - 6) {
      const w = STOCK[kinds[k % kinds.length]](f, x, base, r);
      x += w + 1.4 + r() * 2.4;
      k++;
    }
    rr(x0 - 1, base, x1 - x0 + 2, 1.6, 0.4, lin(0, base, 0, base + 1.6, ['#d89458', '#9a5a28']));
  }
  g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x0, y0, 1.2, y1 - y0);
}

/** The back wall, one painting: windows at either end, the cabinet behind the counter, the red band, POKéMON CENTER on
    a red sign with the Poké Ball, and round ceiling lights. */
function wallArt() {
  const W = (COLS + 0.8) * U, H = TOP * U, f = fine(W, H, 5), { g, rr, lin, shine } = f, s = shine();
  wallBands(f, W);
  skyWindow(f, s, wx(0.15), wx(1.7), wy(2.15), wy(0.95));
  skyWindow(f, s, wx(9.3), wx(10.85), wy(2.15), wy(0.95));
  // the cabinet behind Chansey
  cabinet(f, wx(5.1), wx(8.9), wy(2.42), wy(0.62));
  // the sign
  const sw = 6.4 * U, sx = W / 2 - sw / 2, sy = wy(4.3);
  rr(sx - 2, sy - 2, sw + 4, 26, 6, '#ffffff');
  rr(sx, sy, sw, 22, 5, lin(0, sy, 0, sy + 22, ['#f05848', C.red, C.redDark]));
  ball(g, sx + 14, sy + 11, 7.5, '#5a1810');
  words(g, 'POKéMON CENTER', W / 2 + 9, sy + 11.6, 11, '#ffffff');
  s.fillStyle = '#c0a0a0'; s.beginPath(); s.roundRect(sx, sy, sw, 22, 5); s.fill();
  words(s, 'POKéMON CENTER', W / 2 + 9, sy + 11.6, 11, '#ffffff');
  ball(s, sx + 14, sy + 11, 7.5, '#000');
  // a cross either side, the Center's own sign
  for (const cx of [sx - 22, sx + sw + 22]) {
    rr(cx - 9, sy + 1, 18, 18, 4, '#ffffff');
    rr(cx - 2.5, sy + 4, 5, 12, 1, C.red); rr(cx - 6, sy + 7.5, 12, 5, 1, C.red);
  }
  // round ceiling lights, glowing
  for (let t = 1; t < COLS; t += 2.25) {
    const cx = wx(t + 0.5), cy = wy(TOP - 0.55);
    g.fillStyle = '#e8d8c0'; g.beginPath(); g.ellipse(cx, cy, 11, 3.6, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fffbe8'; g.beginPath(); g.ellipse(cx, cy + 0.6, 9, 2.6, 0, 0, Math.PI * 2); g.fill();
    s.fillStyle = '#ffffff'; s.beginPath(); s.ellipse(cx, cy + 0.6, 9.5, 3, 0, 0, Math.PI * 2); s.fill();
  }
  return f.c;
}

/** A side wall: the same bands, a framed poster of the Center's healing tips on each. */
function sideArt(left) {
  const W = ROWS * U, H = TOP * U, f = fine(W, H, 4), { g, rr } = f;
  wallBands(f, W);
  const px = left ? wx(1.4) : wx(4.4), py = wy(2.15);
  rr(px - 1.5, py - 1.5, 2 * U + 3, 1.2 * U + 3, 1.5, '#a8582c');
  rr(px, py, 2 * U, 1.2 * U, 1, '#fffaf0');
  ball(g, px + 8, py + 9, 4.5);
  rr(px + 16, py + 5, 20, 2, 1, C.red); rr(px + 16, py + 10, 16, 1.4, 0.7, '#a0a0b0'); rr(px + 16, py + 14, 18, 1.4, 0.7, '#a0a0b0');
  rr(px + 4, py + 18, 32, 1.4, 0.7, '#a0a0b0');
  return f.c;
}

/** Cream tiles in pairs a tile, the Poké Ball seal set in before the counter, and the escalators' wells cut out. */
function floorArt() {
  const T = 16, f = fine(COLS * T, ROWS * T, 5), { g, lin } = f;
  for (let y = 0; y < ROWS * 2; y++) for (let x = 0; x < COLS * 2; x++) {
    g.fillStyle = lin(x * 8, y * 8, x * 8 + 8, y * 8 + 8, (x + y) % 2 ? C.tile : [C.tile[1], C.tile[0]]);
    g.fillRect(x * 8, y * 8, 8, 8);
  }
  g.strokeStyle = C.grout; g.lineWidth = 0.35;
  for (let x = 0; x <= COLS * 2; x++) { g.beginPath(); g.moveTo(x * 8, 0); g.lineTo(x * 8, ROWS * T); g.stroke(); }
  for (let y = 0; y <= ROWS * 2; y++) { g.beginPath(); g.moveTo(0, y * 8); g.lineTo(COLS * T, y * 8); g.stroke(); }
  // the seal: a big ring, its line and its button, in white set into the tiles
  const cx = 5.5 * T, cy = 5.1 * T, R = 1.75 * T;
  g.fillStyle = 'rgba(240,200,120,0.35)'; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#fffaf0'; g.lineWidth = 2;
  g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 1.6;
  g.beginPath(); g.moveTo(cx - R, cy); g.lineTo(cx - 7, cy); g.moveTo(cx + 7, cy); g.lineTo(cx + R, cy); g.stroke();
  g.beginPath(); g.arc(cx, cy, 7, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.arc(cx, cy, 3.4, 0, Math.PI * 2); g.stroke();
  // a red runner from the door to the seal
  g.fillStyle = 'rgba(224,56,48,0.85)'; g.fillRect(cx - 7, cy + R + 3, 14, ROWS * T - cy - R - 3);
  g.fillStyle = '#f8d040'; g.fillRect(cx - 7, cy + R + 3, 1, ROWS * T); g.fillRect(cx + 6, cy + R + 3, 1, ROWS * T);
  // the escalators' wells
  g.globalCompositeOperation = 'destination-out';
  for (const x of ESCALATORS) g.fillRect(x * T, 5 * T, 2 * T, 3 * T);
  return f.c;
}

/** The counter's front: red, lighter panels, a white stripe with the Poké Ball in its middle. */
function counterFront(w) {
  const f = fine(w * 16, 14, 6), { g, rr, lin } = f, W = w * 16;
  g.fillStyle = lin(0, 0, 0, 14, ['#f05848', C.red, '#c02c20']); g.fillRect(0, 0, W, 14);
  for (let x = 1; x < W - 2; x += 16) rr(x + 1, 6, 14, 6.5, 1.2, 'rgba(255,255,255,0.12)');
  g.fillStyle = '#ffffff'; g.fillRect(0, 2.2, W, 2);
  g.fillStyle = C.redDark; g.fillRect(0, 13, W, 1);
  ball(g, W / 2, 6.8, 4.6, '#5a1810');
  return f.c;
}

/** The patient monitor's screen: your Pokémon's face, its name and HP in green phosphor, what resting would heal blinking
    on the end of the bar. Redrawn only when something on it changes. */
function drawVitals() {
  const m = monitor, { g, c } = m, k = vitals;
  const on = !k.coming || Math.floor(k.blink / 450) % 2 === 0;
  const sig = `${Math.round(k.now)}|${Math.round(k.coming)}|${on}|${m.faceReady}`;
  if (sig === k.drawn) return;
  k.drawn = sig;
  const W = c.width, H = c.height, max = opts.maxHp, font = (n) => `900 ${n}px "Trebuchet MS", sans-serif`;
  g.fillStyle = '#0a2012'; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(120,255,160,0.06)';
  for (let y = 0; y < H; y += 5) g.fillRect(0, y, W, 2);
  g.shadowColor = 'rgba(120,255,160,0.7)'; g.shadowBlur = 10;
  if (m.face) { g.imageSmoothingEnabled = false; g.drawImage(m.face, 6, 30, 150, 150); }
  g.fillStyle = '#a8ffc0'; g.font = font(30); g.textAlign = 'left'; g.textBaseline = 'middle';
  g.fillText(opts.name.toUpperCase(), 166, 30);
  const bx = 166, by = 56, bw = W - bx - 18, bh = 40;
  g.fillStyle = '#163a20'; g.fillRect(bx, by, bw, bh);
  const fill = k.now / max, add = k.coming / max;
  g.fillStyle = fill > 0.5 ? '#58f080' : fill > 0.2 ? '#f8d048' : '#f86048';
  g.fillRect(bx, by, bw * fill, bh);
  if (on && add) { g.fillStyle = 'rgba(180,255,200,0.55)'; g.fillRect(bx + bw * fill, by, bw * add, bh); }
  g.strokeStyle = '#a8ffc0'; g.lineWidth = 3; g.strokeRect(bx, by, bw, bh);
  g.fillStyle = '#a8ffc0'; g.font = font(26); g.fillText('HP', bx, 152);
  g.fillStyle = vitals.fill ? '#ffffff' : '#d8ffe2'; g.font = font(64);
  g.fillText(`${Math.round(k.now)}/${max}`, bx + 44, 150);
  if (on && k.coming >= 1 && !healing && !k.fill) { g.textAlign = 'right'; g.fillStyle = '#d8ffe0'; g.font = font(52); g.fillText(`+${Math.round(k.coming)}`, W - 18, 150); }
  g.shadowBlur = 0;
  g.fillStyle = '#58c070'; g.font = font(20); g.textAlign = 'left';
  g.fillText(k.fill ? 'HEALING...' : k.now >= max ? 'FULL HP' : 'PATIENT STATUS', bx, 200);
  m.t.needsUpdate = true;
}

/* ---------- building the room ---------- */

const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, ...o });

/** The Secret Base's mask: only the painting's glowing colours, for an emissive map. */
function mask(src, colours) {
  const keep = colours.flatMap(h => [-1, 0, 1, 2].map(n => shadeOf(h, n))).map(h => { const v = parseInt(h.slice(1), 16); return [v >> 16, (v >> 8) & 255, v & 255]; });
  const c = crop(src, 0, 0, src.width, src.height), g = c.getContext('2d');
  c.hd = src.hd;
  const img = g.getImageData(0, 0, c.width, c.height), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    let near = 1e9;
    for (const [r, gg, b] of keep) near = Math.min(near, Math.abs(d[i] - r) + Math.abs(d[i + 1] - gg) + Math.abs(d[i + 2] - b));
    const f = Math.max(0, 1 - near / 70);
    d[i] *= f; d[i + 1] *= f; d[i + 2] *= f;
  }
  g.putImageData(img, 0, 0);
  return c;
}

/** A furniture piece's 3D model, alive (its screen, its balls), feet on the floor at x, z. */
function piece(id, x, z, { turn = 0, scale = 1, y = 0, spot = null } = {}) {
  const p = PIECES[id];
  if (!p) return null;
  const model = furnitureModel(THREE, id, (art) => {
    const m = std({ map: tex(art), roughness: 0.9 });
    if (p.glow) { m.emissive = new THREE.Color('#ffd890'); m.emissiveMap = tex(mask(art, p.glow)); m.emissiveIntensity = 0.8; }
    return m;
  });
  if (!model) return null;
  const play = dressPlay(THREE, model, p);
  if (play) plays.push(play);
  model.traverse(o => { if (o.isMesh) { o.castShadow = o.castShadow !== false; o.receiveShadow = true; } if (spot) o.userData.spot = spot; });
  model.scale.setScalar(scale);
  model.position.set(x, y, z);
  model.rotation.y = turn;
  room.add(model);
  return model;
}

function box(w, h, d, mats, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats);
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  room.add(m);
  return m;
}

/** An escalator going down in a front corner: a well of steps sinking under the front edge between red balustrades
    capped with black handrails. */
function escalator(tx) {
  const x = tileX(tx) + 0.5, z0 = tileZ(5) - 0.5, z1 = ROWS / 2, n = 9, steel = std({ color: '#b8bcc8', metalness: 0.5, roughness: 0.35 });
  const tread = std({ color: '#8a8e9a', metalness: 0.4, roughness: 0.5 });
  for (let i = 0; i < n; i++) {
    const zz = z0 + (i + 0.5) * (z1 - z0) / n, top = -0.04 - i * 0.075;
    box(1.5, 0.08, (z1 - z0) / n, [steel, steel, tread, steel, steel, steel], x, top - 0.04, zz);
  }
  const comb = std({ color: '#f8d040', metalness: 0.3, roughness: 0.5 });
  box(1.5, 0.02, 0.06, comb, x, 0.0, z0 + 0.03);
  const red = std({ color: C.red, roughness: 0.6 }), white = std({ color: '#fbf6ea' }), rail = std({ color: '#1c1c24', roughness: 0.4 });
  for (const s of [-1, 1]) {
    const bx = x + s * 0.84;
    box(0.16, 0.95, z1 - z0 + 0.2, [red, red, white, red, red, red], bx, 0.475 - 0.5, (z0 + z1) / 2 + 0.1);
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, z1 - z0 + 0.3, 12), rail);
    r.rotation.x = Math.PI / 2;
    r.position.set(bx, 0.49, (z0 + z1) / 2 + 0.1);
    room.add(r);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), rail);   // the rail's rounded back end
    cap.position.set(bx, 0.49, z0 - 0.05);
    room.add(cap);
  }
  for (let ty = 5; ty < ROWS; ty++) { blocked.add(key(tx, ty)); blocked.add(key(tx + 1, ty)); }
}

/** A box with rounded edges (js/hub-pc.js's). */
function rbox(w, h, d, r) {
  r = Math.min(r, w / 2, h / 2, d / 2) - 1e-4;
  const n = 5, g = new THREE.BoxGeometry(1, 1, 1, n, n, n).toNonIndexed();
  const pos = g.attributes.position, nor = g.attributes.normal, half = 0.5 / n, v = new THREE.Vector3();
  const bx = w / 2 - r, by = h / 2 - r, bz = d / 2 - r;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    v.set(x - Math.sign(x) * half, y - Math.sign(y) * half, z - Math.sign(z) * half).normalize();
    pos.setXYZ(i, bx * Math.sign(x) + v.x * r, by * Math.sign(y) + v.y * r, bz * Math.sign(z) + v.z * r);
    nor.setXYZ(i, v.x, v.y, v.z);
  }
  return g;
}

/** The Poké Ball's skin on a sphere: red over a black band over white (its button is a part of its own). */
function ballSkin() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const g = c.getContext('2d'), red = g.createLinearGradient(0, 0, 0, 60);
  red.addColorStop(0, '#ff6a5a'); red.addColorStop(1, '#e02a20');
  g.fillStyle = red; g.fillRect(0, 0, 256, 60);
  g.fillStyle = '#f8f8fa'; g.fillRect(0, 68, 256, 60);
  g.fillStyle = '#22222a'; g.fillRect(0, 59, 256, 10);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** The healing machine: a rounded white cabinet banded red, a console on its front, a dish on top under a glowing arch.
    Its one Poké Ball is only put in once you agree to heal (heal() in mountCenter()). */
function buildMachine() {
  const g = new THREE.Group(), add = (geo, m, x, y, z) => { const mesh = new THREE.Mesh(geo, m); mesh.position.set(x, y, z); mesh.castShadow = mesh.receiveShadow = true; g.add(mesh); return mesh; };
  const white = std({ color: '#f6f5fa', roughness: 0.3 }), red = std({ color: C.red, roughness: 0.35 }), grey = std({ color: '#c8ccd8', roughness: 0.35, metalness: 0.2 });
  const dark = std({ color: '#2c3040', roughness: 0.25, metalness: 0.3 });
  const glow = std({ color: '#f8a8c8', emissive: new THREE.Color('#ff70a8'), emissiveIntensity: 0.35, roughness: 0.3 });
  add(rbox(1.6, 0.95, 0.8, 0.12), white, 0, 0.475, 0);
  add(rbox(1.64, 0.1, 0.84, 0.05), red, 0, 0.8, 0);
  add(rbox(1.64, 0.06, 0.84, 0.03), red, 0, 0.1, 0);
  add(rbox(0.62, 0.26, 0.05, 0.03), dark, -0.32, 0.5, 0.4);
  for (let i = 0; i < 3; i++) add(new THREE.SphereGeometry(0.03, 12, 8), std({ color: ['#58f080', '#f8d048', '#58b0f8'][i], emissive: new THREE.Color(['#58f080', '#f8d048', '#58b0f8'][i]), emissiveIntensity: 0.8 }), -0.5 + i * 0.12, 0.5, 0.43);
  for (const [x, col] of [[0.3, '#e03830'], [0.48, '#3878e0']]) add(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 20), std({ color: col, roughness: 0.3 }), x, 0.5, 0.41).rotation.x = Math.PI / 2;
  add(rbox(1.3, 0.06, 0.62, 0.03), grey, 0, 0.98, 0);
  add(new THREE.CylinderGeometry(0.22, 0.24, 0.06, 40), dark, 0, 1.03, 0.04);
  const ring = add(new THREE.TorusGeometry(0.23, 0.025, 12, 48), glow, 0, 1.06, 0.04);
  ring.rotation.x = Math.PI / 2;
  const arch = add(new THREE.TorusGeometry(0.5, 0.045, 14, 48, Math.PI), glow, 0, 1.0, -0.2);
  arch.castShadow = false;
  for (const x of [-0.5, 0.5]) add(rbox(0.12, 0.08, 0.14, 0.03), white, x, 1.0, -0.2);
  // the ball, hidden till it's needed: a true sphere with its button facing out
  const ball = new THREE.Group(), R = 0.16;
  const skin = std({ map: ballSkin(), roughness: 0.22, emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0 });
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(R, 48, 32), skin);
  sphere.castShadow = true;
  const ink = std({ color: '#22222a', roughness: 0.3 }), knob = std({ color: '#f8f8fa', roughness: 0.2, emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0 });
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.066, 0.066, 0.03, 32), ink);
  rim.rotation.x = Math.PI / 2; rim.position.z = R - 0.005;
  const button = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.044, 0.03, 32), knob);
  button.rotation.x = Math.PI / 2; button.position.z = R + 0.008;
  ball.add(sphere, rim, button);
  ball.visible = false;
  const x = tileX(MACHINE.x), z = -ROWS / 2 + 0.45;
  g.position.set(x, 0, z);
  g.traverse(o => { o.userData.spot = 'machine'; });
  room.add(g);
  scene.add(ball);   // in world space, so it can fly from your Pokémon to the dish
  machine = { group: g, ball, R, skin, knob, glow, dish: new THREE.Vector3(x, 1.06 + R, z + 0.04) };
  blocked.add(key(3, 0)); blocked.add(key(4, 0));
  anchors.machine = new THREE.Vector3(x - 0.2, 0.32, tileZ(COUNTER.y) + COUNTER.d / 2 + 0.1);   // on the counter's front, under the machine
}

function buildRoom() {
  room = new THREE.Group();
  scene.add(room);
  const edge = std({ color: '#5a2418' });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(COLS, 0.6, ROWS), [edge, edge, std({ map: texOf(floorArt()), alphaTest: 0.5, roughness: 0.4, metalness: 0.05 }), edge, std({ color: '#d8c090' }), edge]);
  floor.position.y = -0.3;
  floor.receiveShadow = true;
  room.add(floor);
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(COLS + 0.8, 7, ROWS + 0.4), [edge, edge, std({ color: '#3a1810' }), edge, std({ color: '#5a2c1c' }), edge]);
  plinth.position.set(0, -0.62 - 3.5, -0.2);
  room.add(plinth);

  const wall = wallArt(), wm = std({ map: texOf(wall), roughness: 0.9, emissive: new THREE.Color('#fff4dc'), emissiveMap: texOf(wall.glow), emissiveIntensity: 0.9 });
  const cap = std({ color: '#d87040' });
  const back = new THREE.Mesh(new THREE.BoxGeometry(COLS + 0.8, TOP, 0.4), [cap, cap, cap, cap, wm, cap]);
  back.position.set(0, TOP / 2, -ROWS / 2 - 0.2);
  back.receiveShadow = true;
  room.add(back);
  for (const s of [-1, 1]) {
    const inside = std({ map: texOf(sideArt(s < 0)), roughness: 0.9 });
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.4, TOP, ROWS), s < 0 ? [inside, cap, cap, cap, cap, cap] : [cap, inside, cap, cap, cap, cap]);
    m.position.set(s * (COLS / 2 + 0.2), TOP / 2, 0);
    m.receiveShadow = true;
    room.add(m);
  }

  // the counter: red front with the Poké Ball, white top overhanging it, rounded ends
  const w = COUNTER.x1 - COUNTER.x0 + 1, cx = (tileX(COUNTER.x0) + tileX(COUNTER.x1)) / 2, cz = tileZ(COUNTER.y), H = COUNTER.h;
  const red = std({ color: C.red, roughness: 0.55 }), front = std({ map: texOf(counterFront(w)), roughness: 0.55 }), top = std({ color: '#fbf8f2', roughness: 0.3 });
  box(w, H - 0.08, COUNTER.d, [red, red, red, red, front, red], cx, (H - 0.08) / 2, cz);
  box(w + 0.16, 0.08, COUNTER.d + 0.16, top, cx, H - 0.04, cz + 0.02);
  for (const s of [-1, 1]) {
    const end = new THREE.Mesh(new THREE.CylinderGeometry(COUNTER.d / 2, COUNTER.d / 2, H - 0.08, 24, 1, false, s < 0 ? Math.PI : 0, Math.PI), red);
    end.position.set(cx + s * w / 2, (H - 0.08) / 2, cz);
    end.castShadow = end.receiveShadow = true;
    room.add(end);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(COUNTER.d / 2 + 0.08, COUNTER.d / 2 + 0.08, 0.08, 24, 1, false, s < 0 ? Math.PI : 0, Math.PI), top);
    lid.position.set(cx + s * w / 2, H - 0.04, cz + 0.02);
    room.add(lid);
  }
  for (let x = COUNTER.x0 - 1; x <= COUNTER.x1 + 1; x++) for (let y = 0; y <= COUNTER.y; y++) blocked.add(key(x, y));
  // a low back counter along the wall, under the shelves
  box(3.9, 0.6, 0.6, [red, red, top, red, std({ color: '#f05848', roughness: 0.6 }), red], tileX(7) - 0.05, 0.3, -ROWS / 2 + 0.3);

  // the healing machine behind the counter, the patient monitor on the wall over it
  buildMachine();
  const mc = document.createElement('canvas');
  mc.width = 512; mc.height = 220;
  const mt = new THREE.CanvasTexture(mc);
  mt.colorSpace = THREE.SRGBColorSpace;
  mt.anisotropy = 4;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.9), new THREE.MeshBasicMaterial({ map: mt, toneMapped: false }));
  const bezel = box(2.26, 1.06, 0.08, std({ color: '#e8e8f0', roughness: 0.4 }), tileX(MACHINE.x), 2.42, -ROWS / 2 + 0.07);
  screen.position.set(0, 0, 0.045);
  bezel.add(screen);
  bezel.traverse(o => { o.userData.spot = 'machine'; });
  monitor = { c: mc, g: mc.getContext('2d'), t: mt, face: null };

  // the Clearing's PC, on the floor before the counter's right end
  const glows = [], pc = pcModel(THREE, glows);
  for (const m of glows) m.emissiveIntensity = 0.85;
  pc.scale.setScalar(0.62);
  pc.position.set(tileX(PC_AT.x), 0, tileZ(PC_AT.y) - 0.05);
  pc.rotation.y = -0.25;   // turned a little, so its side shows
  pc.traverse(o => { o.userData.spot = 'pc'; });
  room.add(pc);
  blocked.add(key(PC_AT.x, PC_AT.y));
  anchors.pc = new THREE.Vector3(pc.position.x, 1.35, pc.position.z);

  // benches by the side walls, a Poké Ball stand and
  // the TM case at the back
  piece('balldisplay', tileX(1), tileZ(0)); blocked.add(key(1, 0));
  piece('tmcase', tileX(9), tileZ(0)); blocked.add(key(9, 0));
  piece('waitbench', tileX(0) - 0.05, tileZ(2) + 0.5, { turn: Math.PI / 2 }); blocked.add(key(0, 2)); blocked.add(key(0, 3));
  piece('waitbench', tileX(10) + 0.05, tileZ(2) + 0.5, { turn: -Math.PI / 2 }); blocked.add(key(10, 2)); blocked.add(key(10, 3));
  for (const tx of ESCALATORS) escalator(tx);

  const { step, mat: m } = doormat(tileX(DOOR.x), ROWS / 2 + 0.47, std({ color: '#c8b088' }));
  m.userData.spot = 'exit';
  room.add(step, m);
  mat = m.material;
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

/** Up to the counter for a choice, or to the door to leave; `aim` is acted on as it arrives. */
function goTo(kind) {
  const target = kind === 'exit' ? DOOR : SPOTS[kind].step;
  aim = kind;
  walker.path = route(walker.tile, target);
  if (!walker.path.length) arrived();
}

function arrived() {
  const kind = aim;
  aim = null;
  if (!kind) return;
  if (kind === 'exit') return opts.onLeave();
  if (walker.tile.x !== SPOTS[kind].step.x || walker.tile.y !== SPOTS[kind].step.y) return;
  walker.facing = mon.sheets.back ? 'back' : 'front'; walker.flip = false;
  if (kind === 'nurse') { playCry('chansey'); nurse.hopUntil = performance.now() + 600; }
  opts.onPick(SPOTS[kind].option);
}

/* ---------- taps ---------- */

function onTap(e) {
  if (busy || !alive()) return;
  if (e.target.closest('button, a, input, select, dialog, .reward-bottom, #room-bar, .room-hinge, .top-bar, #collection-screen, .over')) return;
  if (document.querySelector('dialog[open]')) return;
  const sign = signAt(e.clientX, e.clientY);
  if (sign) { playSound('select'); return goTo(sign); }
  const r = view.getBoundingClientRect();
  const v = new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
  const ray = new THREE.Raycaster();
  ray.setFromCamera(v, camera);
  const hits = ray.intersectObjects([room, mon.group, nurse.group], true);
  const first = hits[0]?.object;
  if (first && first === mon.board) { playCry(mon.id); walker.hopUntil = performance.now() + 500; return; }
  let o = first;
  while (o && !o.userData.spot) o = o.parent;
  if (o?.userData.spot) { playSound('select'); return goTo(o.userData.spot); }
  const hit = new THREE.Vector3();
  if (!ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit)) return;
  const t = { x: Math.round(hit.x + COLS / 2 - 0.5), y: Math.round(hit.z + ROWS / 2 - 0.5) };
  if (t.y >= ROWS && Math.abs(t.x - DOOR.x) <= 1) return goTo('exit');   // the doorstep round the mat
  if (t.x < 0 || t.y < 0 || t.x >= COLS || t.y >= ROWS) return;
  aim = null;
  walker.path = route(walker.tile, t);
}

/* ---------- camera ---------- */

function aimCamera(x, d) {
  camera.position.set(x, LOOK_Y + Math.sin(PITCH) * d, Math.cos(PITCH) * d);
  camera.lookAt(x, LOOK_Y, 0);
  camera.updateMatrixWorld();
}

/** How much of the screen the room's bar and hinge take at the bottom. The text box is left out: it comes and goes, and
    the shot refitting round it swung the camera every time it closed. */
function below() {
  const tops = ['#room-bar', '#reward-screen .room-hinge']
    .map(s => document.querySelector(s)).filter(n => n?.offsetHeight).map(n => n.getBoundingClientRect().top);
  return tops.length ? Math.max(0, viewH - Math.min(...tops)) + 6 : 120;
}

/* The shot: ACROSS tiles at least, and far enough back that the room from the doorstep up to the sign fits over the
   bar and text box (SHOT_TOP: the cabinet's top, the sign above it left to a tall phone); a lens shift sets the doorstep just over them, so a shot held back by the room's width shows more
   wall, not more plinth. */
function fitShot() {
  const h = viewH;
  camera.clearViewOffset();
  camera.updateProjectionMatrix();
  const topGap = 10, low = below(), avail = Math.max(120, h - topGap - low), room = 2 * avail / h * 0.96;
  const span = (d) => {
    aimCamera(0, d);
    return [new THREE.Vector3(0, SHOT_TOP, -ROWS / 2).project(camera).y, new THREE.Vector3(0, -0.3, ROWS / 2 + 0.95).project(camera).y];
  };
  let lo = 2, hi = 80;
  for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; const [t, b] = span(mid); if (t - b > room) lo = mid; else hi = mid; }
  const halfTan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect;
  const d = Math.max(hi, ACROSS / 2 / halfTan);
  const [, b] = span(d);
  shot = { dist: d, half: d * halfTan, shift: (1 - b) / 2 * h - (h - low - 2), low };
}

function placeCamera(dt) {
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
  renderer.setPixelRatio(1);
  const k = post.scale(w, h);
  renderer.setSize(Math.round(w * k), Math.round(h * k), false);
  post.size(w, h);
  camera.aspect = w / h;
  viewW = w; viewH = h;
  fitShot();
}

/* ---------- the frame ---------- */

/** Still in the Center: its room is up and showing. Anything else (a deck picker, the map) puts the 3D room away. */
const alive = () => !!document.querySelector('#reward-options.center-room') && !document.getElementById('reward-screen').hidden;

function frame(now) {
  raf = 0;
  if (!alive()) return unmount();
  const dt = Math.min(100, now - (last || now));
  last = now;
  if (walk(dt)) arrived();
  const hopping = walker.hopUntil > now;
  const bob = calm ? 0 : walker.path.length ? Math.abs(Math.sin(walker.hop / 1000 * Math.PI * 4)) * 0.08 : hopping ? Math.abs(Math.sin((walker.hopUntil - now) / 500 * Math.PI * 2)) * 0.35 : 0;
  mon.group.position.set(walker.x, 0, walker.z);
  const size = walker.size ?? 1;   // shrunk into its ball while it heals
  mon.board.scale.set((walker.flip ? -1 : 1) * size, size, 1);
  mon.board.position.y = bob + (1 - size) * 0.4;
  mon.board.material.emissive.setRGB(1, 0.25, 0.2);
  mon.board.material.emissiveIntensity = size < 1 ? (1 - size) * 1.6 + 0.4 : 0;
  mon.group.children[1].visible = size > 0.3;
  drawMon(mon, walker, dt);
  drawMon(nurse, { facing: 'front' }, dt);
  nurse.board.scale.x = walker.x > nurse.group.position.x + 0.3 ? -1 : 1;
  const left = (nurse.hopUntil || 0) - now;
  nurse.board.position.y = !calm && left > 0 ? Math.abs(Math.sin(left / 600 * Math.PI * 2)) * 0.3 : 0;
  for (const p of plays) tickPlay(p, now, dt);
  tickHeal(now);
  vitals.blink += dt;
  if (!monitor.face && mon.c.width) { monitor.face = mon.sheets.front.frames[0]?.bmp ?? null; monitor.faceReady = !!monitor.face; }
  drawVitals();
  if (!calm && mat) mat.emissiveIntensity = 0.12 + Math.sin(now / 420) * 0.1;
  placeCamera(dt);
  placeSigns();
  if (!calm) livePc(now);
  post.draw(scene, camera, (new THREE.Vector3(walker.x, 0.6, walker.z).project(camera).y + 1) / 2);
  raf = requestAnimationFrame(frame);
}

/** The machine's glow and the ball's: `k` 0 at rest to 1 lit. */
function glowMachine(k) {
  machine.glow.emissiveIntensity = 0.35 + k * 1.4;
  machine.skin.emissiveIntensity = k * 0.35;
  machine.knob.emissiveIntensity = k * 1.2;
}

const ease = (k) => k * k * (3 - 2 * k);

/** Where the ball is on a hop between two points: an arc `up` high, `k` 0 to 1. */
function arc(from, to, k, up) {
  const e = ease(k);
  return new THREE.Vector3(from.x + (to.x - from.x) * e, from.y + (to.y - from.y) * e + Math.sin(Math.PI * k) * up, from.z + (to.z - from.z) * e);
}

/** The ball: your Pokémon shrinks into it in a red glow, it's thrown over the counter into the dish, flashes there while
    the chime plays, then hops back and your Pokémon pops out of it. */
function tickHeal(now) {
  const B = machine.ball, here = () => new THREE.Vector3(walker.x, 0.55, walker.z);
  if (healing) {
    const k = Math.min(1, (now - healing.from) / healing.ms), IN = 0.25;
    B.visible = true;
    walker.size = calm ? 0 : Math.max(0, 1 - k / IN);
    if (calm) B.position.copy(machine.dish);
    else {
      if (!healing.thrown && k >= IN) { healing.thrown = true; playSound('ball-throw'); }
      const fly = Math.max(0, Math.min(1, (k - IN) / 0.55)), settle = Math.max(0, (k - IN - 0.55) / 0.2);
      B.position.copy(arc(here(), machine.dish, fly, 1.1));
      if (fly >= 1) B.position.y += Math.abs(Math.sin(settle * Math.PI * 2)) * 0.12 * (1 - settle);
      B.rotation.x = fly < 1 ? -fly * Math.PI * 4 : 0;
    }
    B.scale.setScalar(calm ? 1 : Math.min(1, 0.3 + k * 3));
    B.rotation.y = 0;
    glowMachine(k >= 1 ? 0.3 : 0);
    if (k >= 1) { const done = healing.done; healing = null; done(); }
  } else if (flashing) {
    if (now > flashing.to) { flashing = null; going = { from: now, ms: calm ? 1 : 650 }; glowMachine(0); nurse.hopUntil = now + 600; playSound('select'); }
    else glowMachine(calm ? 0.8 : 0.25 + 0.75 * (0.5 + 0.5 * Math.cos((now - flashing.from) / 200 * Math.PI)));
  } else if (going) {
    const k = Math.min(1, (now - going.from) / going.ms);
    B.position.copy(arc(machine.dish, here(), k, 0.9));
    B.scale.setScalar(1 - ease(k) * 0.8);
    if (k >= 1) { going = null; B.visible = false; popping = { from: now, ms: calm ? 1 : 320 }; playSound('ball-open'); }
  } else if (popping) {
    const k = Math.min(1, (now - popping.from) / popping.ms);
    walker.size = ease(k);
    if (k >= 1) { popping = null; busy = false; walker.size = 1; walker.hopUntil = now + 500; }
  }
  if (vitals.fill) {
    const f = vitals.fill, k = Math.min(1, (now - f.from) / f.ms);
    vitals.now = f.a + (f.b - f.a) * k;
    vitals.coming = (f.b - f.a) * (1 - k);
    if (k >= 1) vitals.fill = null;
  }
}

/** The room's own signs (Heal, Forget, Upgrade), floating over the machine, the PC and Chansey. */
function placeSigns() {
  const btns = document.querySelectorAll('#reward-options.c3d .reward-option'), r = view.getBoundingClientRect();
  for (const [kind, spot] of Object.entries(SPOTS)) {
    const b = btns[spot.option], at = anchors[kind];
    if (!b || !at) continue;
    const p = at.clone().project(camera), x = Math.round(r.left + (p.x + 1) / 2 * r.width), y = Math.round(r.top + (1 - p.y) / 2 * r.height);
    if (b.dataset.at === `${x},${y}`) continue;
    b.dataset.at = `${x},${y}`;
    Object.assign(b.style, { left: `${x}px`, top: `${y}px`, width: '0px', height: '0px' });
    const label = b.querySelector('.center-label');
    if (label) label.style.marginLeft = label.style.marginBottom = '';   // the pixel room's nudges
  }
}

/** The choice whose floating sign is under a tap, if any. */
function signAt(x, y) {
  const btns = document.querySelectorAll('#reward-options.c3d .reward-option');
  for (const [kind, spot] of Object.entries(SPOTS)) {
    const r = btns[spot.option]?.querySelector('.center-label')?.getBoundingClientRect();
    if (r && x >= r.left - 6 && x <= r.right + 6 && y >= r.top - 6 && y <= r.bottom + 12) return kind;
  }
  return null;
}

function unmount() {
  cancelAnimationFrame(raf);
  raf = 0;
  view?.classList.remove('on');
  view?.remove();
  removeEventListener('click', onTap, true);
  removeEventListener('resize', resize);
  document.getElementById('reward-options')?.classList.remove('c3d');
  leftAt = performance.now();
  busy = false; aim = null; healing = null; flashing = null; going = null; popping = null;
  if (walker) walker.size = 1;
  if (machine) machine.ball.visible = false;
}

/* ---------- in ---------- */

let warming = null;
/** Three.js loaded and the room built, before it is needed (the map calls it, so walking in is instant). */
export function warmCenter() {
  warming ??= (async () => {
    THREE = await loadThree();
    await hubThree();
    view = document.createElement('canvas');
    view.className = 'center3d-view';
    renderer = new THREE.WebGLRenderer({ canvas: view, antialias: false, powerPreference: 'high-performance' });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    scene = new THREE.Scene();
    scene.background = new THREE.Color('#3a1c14');
    camera = new THREE.PerspectiveCamera(30, 1, 0.5, 140);
    hemi = new THREE.HemisphereLight('#fff8ec', '#9a7a60', 1.75);
    sun = new THREE.DirectionalLight('#fff2dc', 2.1);
    sun.position.set(-4, 12, 7);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 });
    sun.shadow.bias = -0.0015;
    sun.shadow.normalBias = 0.02;
    scene.add(hemi, sun);
    post = createPost(renderer, { short: 760, crisp: false });
    post.final.uniforms.uBlur.value = 0;   // no tilt-shift in the Center (the user's call, 2026-10-09)
    buildRoom();
    nurse = await monBoard({ src: 'assets/pokemon/chansey-front.gif', name: 'Chansey', cry: 'chansey' }, false);
    nurse.board.rotation.x = -PITCH;
    nurse.group.position.set(tileX(5), 0.12, tileZ(1));
    nurse.group.traverse(n => { n.userData.spot = 'nurse'; });
    anchors.nurse = new THREE.Vector3(tileX(5) + 0.7, 0.12 + nurse.top + 0.15, tileZ(1));
    scene.add(nurse.group);
    new ResizeObserver(() => { if (view.isConnected) resize(); }).observe(view);
  })();
  warming.catch(() => { warming = null; });
  return warming;
}

/** Lays the 3D Center under the room restSite() just showed. `o`: { run (to tell a new visit from coming back from the
    PC or Chansey), hp, maxHp, heal (what resting would heal), name, mate ({ src, name, cry }: your Pokémon),
    onPick(index): press that choice, onLeave(): press Leave }. Resolves the room's controls, or throws if Three.js won't
    load (the pixel room stays). */
export async function mountCenter(o) {
  const back = o.run === runId && performance.now() - leftAt < 20000;   // back from a deck picker, standing where it was
  runId = o.run;
  opts = o;
  calm = calmFx();
  await warmCenter();
  if (!alive()) return null;   // left while it loaded
  if (mon?.src !== o.mate.src) {
    if (mon) scene.remove(mon.group);
    mon = await monBoard(o.mate);
    mon.board.rotation.x = -PITCH;
    scene.add(mon.group);
    monitor.face = null;
  }
  if (!alive()) return null;
  if (!back) {
    walker = { x: tileX(DOOR.x), z: tileZ(DOOR.y), tile: { ...DOOR }, path: [], facing: mon.sheets.back ? 'back' : 'front', flip: false, hop: 0 };
    camX = walker.x;
  }
  walker.path = [];
  vitals = { now: o.hp, coming: o.heal, blink: 0, drawn: '' };
  machine.ball.visible = false;
  glowMachine(0);
  document.body.append(view);
  document.getElementById('reward-log').hidden = true;   // the signs say it; the hint only covered the room
  document.getElementById('reward-options').classList.add('c3d');
  // one word a sign, so the three fit side by side this close in (the hint keeps the detail)
  for (const label of document.querySelectorAll('#reward-options .reward-option .center-label')) label.textContent = label.textContent.replace(/^(Heal|Upgrade|Forget) .*$/, '$1').replace(/ card$/, '');
  addEventListener('click', onTap, true);
  addEventListener('resize', resize);
  resize();
  last = 0;
  if (!raf) raf = requestAnimationFrame(frame);
  requestAnimationFrame(() => view.classList.add('on'));
  return {
    /** Your Pokémon's ball thrown into the machine's dish; resolves once it's in. */
    heal() {
      busy = true;
      walker.path = []; aim = null;
      walker.facing = mon.sheets.back ? 'back' : 'front'; walker.flip = false;
      return new Promise(done => { healing = { from: performance.now(), ms: calm ? 150 : 1800, done }; });
    },
    /** The ball flashing while the chime plays, and the monitor's bar filling from `from` to `to`. */
    flash(seconds, from, to) {
      const now = performance.now();
      flashing = { from: now, to: now + seconds * 1000 };
      vitals.fill = { from: now, ms: seconds * 1000, a: from, b: to };
    },
  };
}
