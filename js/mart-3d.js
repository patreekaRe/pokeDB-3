/* mart-3d.js  -  the run's Poké Mart as a 3D room you walk about (branch pokemart-3d; the user's ask, 2026-10-09, after
   the HeartGold / SoulSilver Marts and the walk-in Center, js/center-3d.js): white walls over a blue wainscot, pale blue
   tiles, the moves on sale standing on a lit rack along the back wall, the items on a shelf on the right, the relics under
   the glass of Kecleon's counter on the left, the PC on that counter to forget a move, ball bins and plants. It is only
   the scene: martRoom() in js/run.js keeps the shop's choices, its two-tap Buy, text box and bar, and this lays the room
   under them. A tap on a ware walks your Pokémon up to it and presses that choice; the doormat walks it out. */

import { calmFx } from './prefs.js';
import { playSound, playCry } from './audio.js';
import { loadThree, tex, monBoard, drawMon, createPost, doormat, dispose } from './hd2d.js';
import { fine, texOf, words, hubThree } from './hub-3d.js';
import { furnitureModel } from './base-mesh.js';
import { pcModel, livePc } from './hub-pc.js';
import { PIECES } from './secret-base.js';
import { ITEM_FIT } from './data/item-fit.js';

const COLS = 11, ROWS = 8;
const U = 20;                 // the paintings' units a tile
const TOP = 8;
const PITCH = 0.42, ACROSS = 7.2, LOOK_Y = 0.9, SHOT_TOP = 3.4;
// the one wall unit everything on sale stands on (the pixel Mart's shelf, which the user liked): a counter-height cabinet
// with the items and the relics (under glass domes) on top, and over it a shelf of the moves
const RACK = { x0: 3, n: 5, low: 0.9, shelf: 1.56, h: 1.0, top: 3.0 };
const COUNTER = { x0: 1, x1: 2, y: 2, h: 0.95, d: 0.8 };
const SHELF = { x0: 8, n: 2, y: 2, h: 0.98 };         // a gondola of the Mart's everyday goods
const DOOR = { x: 5, y: ROWS - 1 };
const CLERK = { x: 1.55, y: 1 };

const C = { blue: ['#5aa0f8', '#3a7ce0', '#2a60c0'], navy: '#1c3270', white: ['#ffffff', '#f2f6fc', '#e2eaf6'],
  tile: ['#eef5ff', '#dceaff'], grout: '#bcd2f0', ink: '#1e2a48', red: '#e84838' };
const TYPE = { fire: ['#ff8f4d', '#b8321a'], water: ['#5cbcff', '#1d58b8'], grass: ['#72dc70', '#257a38'], psychic: ['#d49aff', '#7138a8'],
  normal: ['#9aa2c8', '#565d84'], status: ['#8c8c94', '#505058'] };

let THREE, renderer, scene, camera, post, view;
let room, wares = null, mon, clerk, plays = [], blocked = new Set(), mat = null, signEl = null, pcAt = null, shine = null;
let walker = { x: 0, z: 0, tile: { ...DOOR }, path: [], facing: 'back', flip: false, hop: 0 };
let opts = null, aim = null, raf = 0, last = 0, calm = false, shot = null, viewW = 0, viewH = 0, camX = 0, leftAt = 0, runId = null;
let flying = [];

const tileX = (tx) => tx + 0.5 - COLS / 2;
const tileZ = (ty) => ty + 0.5 - ROWS / 2;
const key = (x, y) => `${x},${y}`;
const wx = (t) => (t + 0.4) * U;
const wy = (y) => (TOP - y) * U;
const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.8, ...o });

/* ---------- painting ---------- */

function ballIcon(g, x, y, r, top = C.red, ink = C.ink) {
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  g.fillStyle = top; g.beginPath(); g.arc(x, y, r, Math.PI, 0); g.fill();
  g.strokeStyle = ink; g.lineWidth = r * 0.16;
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.moveTo(x - r, y); g.lineTo(x + r, y); g.stroke();
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x, y, r * 0.32, 0, Math.PI * 2); g.fill(); g.stroke();
}

/** White upper wall, a blue band, blue wainscot in panels a tile wide, a navy skirting. */
function wallBands(f, W) {
  const { g, rr, lin } = f;
  g.fillStyle = lin(0, wy(TOP), 0, wy(2.7), ['#e4eefa', '#f6f9fe', '#ffffff']); g.fillRect(0, 0, W, wy(2.7));
  g.fillStyle = lin(0, wy(2.4), 0, wy(0), C.blue); g.fillRect(0, wy(2.4), W, wy(0) - wy(2.4));
  for (let x = 0; x < W; x += U) {
    rr(x + 2, wy(2.22), U - 4, wy(0.42) - wy(2.22), 1.6, lin(0, wy(2.22), 0, wy(0.42), ['#6aacfa', '#4a8aea']));
    g.fillStyle = 'rgba(255,255,255,0.28)'; g.fillRect(x + 2.6, wy(2.2), U - 5.2, 0.7);
  }
  g.fillStyle = lin(0, wy(2.7), 0, wy(2.4), ['#ffffff', '#dbe6f6']); g.fillRect(0, wy(2.7), W, wy(2.4) - wy(2.7));
  g.fillStyle = C.navy; g.fillRect(0, wy(2.44), W, 0.9);
  g.fillStyle = '#ffd040'; g.fillRect(0, wy(2.66), W, 0.7);
  g.fillStyle = C.navy; g.fillRect(0, wy(0.3), W, wy(0) - wy(0.3));
  g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(0, wy(0.3), W, 0.8);
}

/** Painted shelves of goods on the wall: boxes, sprays, jars, in rows, each row a little different. */
function goods(f, x0, x1, y0, y1, seed) {
  const { g, rr, lin } = f;
  let n = seed;
  const r = () => { n = (n * 16807) % 2147483647; return n / 2147483647; };
  rr(x0 - 1.5, y0 - 1.5, x1 - x0 + 3, y1 - y0 + 3, 1.2, '#d8e2f0');
  rr(x0, y0, x1 - x0, y1 - y0, 0.8, lin(0, y0, 0, y1, ['#f8fbff', '#e6eef8']));
  const rows = 3, step = (y1 - y0) / rows;
  const cols = [['#e85848', '#f8f0e8'], ['#4a8ae8', '#e8f0ff'], ['#f8c840', '#7a5810'], ['#58b868', '#eaf8e8'], ['#b070e0', '#f4ecff'], ['#f08840', '#fff2e4']];
  for (let i = 0; i < rows; i++) {
    const base = y0 + step * (i + 1) - 1.2;
    let x = x0 + 1.2 + r() * 1.5;
    while (x < x1 - 4) {
      const [a, b] = cols[Math.floor(r() * cols.length)], kind = r();
      if (kind < 0.45) {   // a box with a label
        const w = 3.4 + r() * 1.6, h = 5 + r() * 2.2;
        rr(x, base - h, w, h, 0.4, lin(x, 0, x + w, 0, [a, a, '#00000022']));
        rr(x + 0.5, base - h * 0.66, w - 1, h * 0.32, 0.3, b);
        x += w + 0.5;
      } else if (kind < 0.8) {   // a spray bottle, the Potion's
        const h = 5.4 + r() * 1.2;
        rr(x, base - h, 2.8, h, 1, lin(x, 0, x + 2.8, 0, [a, a, '#00000030']));
        rr(x + 0.4, base - h * 0.6, 2, 1.6, 0.3, '#ffffff');
        rr(x + 0.8, base - h - 1.4, 1.2, 1.5, 0.3, '#e8e8f0');
        g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(x + 0.45, base - h + 0.8, 0.45, h * 0.45);
        x += 3.4;
      } else {   // a heap of balls in a basket
        rr(x, base - 3.2, 6, 3.2, 0.8, '#c89458');
        for (let k = 0; k < 4; k++) ballIcon(g, x + 1.4 + (k % 3) * 1.6, base - 3.6 - Math.floor(k / 3) * 1.2, 0.9, [C.red, '#3a78e8', '#f8c840'][k % 3]);
        x += 6.6;
      }
      x += r() * 1.2;
    }
    rr(x0 - 1, base, x1 - x0 + 2, 1.4, 0.4, lin(0, base, 0, base + 1.4, ['#ffffff', '#9aaccc']));
  }
}

/** The back wall: goods behind Kecleon, POKé MART on a blue sign, MOVES over the card rack, a window behind the items'
    shelf, long ceiling lights. */
function wallArt() {
  const W = (COLS + 0.8) * U, H = TOP * U, f = fine(W, H, 5), { g, rr, lin, shine: lit } = f, s = lit();
  wallBands(f, W);
  goods(f, wx(0.1), wx(2.9), wy(2.35), wy(1.05), 7);
  // a window of sky behind the items' shelf
  const x0 = wx(8.3), x1 = wx(10.6), y0 = wy(2.25), y1 = wy(1.15);
  rr(x0 - 1.5, y0 - 1.5, x1 - x0 + 3, y1 - y0 + 3, 1.5, '#ffffff');
  g.fillStyle = lin(0, y0, 0, y1, ['#5aa8f0', '#9cd4f8', '#e2f4ff']); g.fillRect(x0, y0, x1 - x0, y1 - y0);
  g.fillStyle = '#ffffff';
  for (const [cx, cy, r] of [[x0 + 12, y0 + 7, 3.4], [x0 + 16, y0 + 6, 4.4], [x0 + 21, y0 + 7.5, 3]]) { g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = lin(0, y1 - 6, 0, y1, ['#7cc464', '#58a048']); g.fillRect(x0, y1 - 6, x1 - x0, 6);
  g.strokeStyle = '#ffffff'; g.lineWidth = 1.2;
  g.beginPath(); g.moveTo((x0 + x1) / 2, y0); g.lineTo((x0 + x1) / 2, y1); g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.moveTo(x0 + 2, y0); g.lineTo(x0 + 7, y0); g.lineTo(x0 + 1, y1); g.lineTo(x0, y1); g.closePath(); g.fill();
  s.fillStyle = '#2a3a48'; s.fillRect(x0, y0, x1 - x0, y1 - y0);
  // the sign
  const sw = 6.2 * U, sx = wx(5.5) - sw / 2, sy = wy(4.85);
  rr(sx - 2, sy - 2, sw + 4, 26, 6, '#ffffff');
  rr(sx, sy, sw, 22, 5, lin(0, sy, 0, sy + 22, ['#5aa8ff', '#2f74e0', '#1e54b8']));
  ballIcon(g, sx + 14, sy + 11, 7.5, C.red, '#12245a');
  words(g, 'POKé MART', sx + sw / 2 + 9, sy + 11.6, 13, '#ffffff');
  s.fillStyle = '#90a8d0'; s.beginPath(); s.roundRect(sx, sy, sw, 22, 5); s.fill();
  words(s, 'POKé MART', sx + sw / 2 + 9, sy + 11.6, 13, '#ffffff');
  ballIcon(s, sx + 14, sy + 11, 7.5, '#ffffff', '#000');
  bunting(g, W, wy(5.95), 9);
  bunting(g, W, wy(6.7), 6);
  // long ceiling lights
  for (let t = 0.6; t < COLS; t += 3.4) {
    const cx = wx(t + 1), cy = wy(TOP - 0.5);
    rr(cx - 22, cy - 3, 44, 6, 3, '#d8e0ec');
    rr(cx - 20, cy - 1.6, 40, 3.6, 1.8, '#ffffff');
    s.fillStyle = '#ffffff'; s.beginPath(); s.roundRect(cx - 21, cy - 2, 42, 4.4, 2.2); s.fill();
  }
  return f.c;
}

/** A string of pennants swagging across the wall, `sag` deep. */
function bunting(g, W, y, sag) {
  const cols = ['#e84838', '#f8c838', '#3a7ce0', '#58b868', '#ffffff', '#f08840'];
  const at = (x) => y + Math.sin((x % (W / 3)) / (W / 3) * Math.PI) * sag;
  g.strokeStyle = '#8a98b8'; g.lineWidth = 0.5;
  g.beginPath(); for (let x = 0; x <= W; x += 2) g.lineTo(x, at(x)); g.stroke();
  let i = 0;
  for (let x = 4; x < W - 3; x += 7, i++) {
    const a = at(x), b = at(x + 5);
    g.fillStyle = cols[i % cols.length];
    g.beginPath(); g.moveTo(x, a); g.lineTo(x + 5, b); g.lineTo(x + 2.5, (a + b) / 2 + 6); g.closePath(); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.beginPath(); g.moveTo(x + 2.5, (a + b) / 2); g.lineTo(x + 5, b); g.lineTo(x + 2.5, (a + b) / 2 + 6); g.closePath(); g.fill();
  }
}

/** A header board: navy, a gold inner face, the word in navy, its ends rounded. */
function header(text, w, h = 0.3) {
  const c = document.createElement('canvas'), k = 200;
  c.width = Math.round(w * k); c.height = Math.round(h * k);
  const g = c.getContext('2d'), W = c.width, H = c.height;
  g.fillStyle = C.navy; g.beginPath(); g.roundRect(0, 0, W, H, H / 2); g.fill();
  const l = g.createLinearGradient(0, 6, 0, H - 6);
  l.addColorStop(0, '#fff6c8'); l.addColorStop(1, '#ffd040');
  g.fillStyle = l; g.beginPath(); g.roundRect(6, 6, W - 12, H - 12, (H - 12) / 2); g.fill();
  g.font = `900 ${H * 0.56}px "Trebuchet MS", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = C.navy; g.fillText(text, W / 2, H / 2 + H * 0.04);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.5, emissive: '#ffffff', emissiveMap: t, emissiveIntensity: 0.35 }));
  room.add(m);
  return m;
}

/** A side wall: the same bands, a poster on each (a sale, the Mart's own ball). */
function sideArt(left) {
  const W = ROWS * U, H = TOP * U, f = fine(W, H, 4), { g, rr, lin } = f;
  wallBands(f, W);
  const px = left ? wx(2.6) : wx(3.2), py = wy(2.25);
  rr(px - 1.5, py - 1.5, 1.6 * U + 3, 1.3 * U + 3, 1.5, '#ffffff');
  rr(px, py, 1.6 * U, 1.3 * U, 1, lin(0, py, 0, py + 1.3 * U, left ? ['#ff6858', '#e83828'] : ['#ffe070', '#f8b828']));
  words(g, left ? 'SALE' : 'NEW!', px + 0.8 * U, py + 8, 7.5, left ? '#ffffff' : '#7a3a10');
  ballIcon(g, px + 0.8 * U, py + 18, 5, left ? '#ffd040' : C.red);
  return f.c;
}

/** Pale blue tiles, a blue runner from the door up to the moves, and a Poké Ball ring set in at its end. */
function floorArt() {
  const T = 16, f = fine(COLS * T, ROWS * T, 5), { g, lin } = f;
  for (let y = 0; y < ROWS * 2; y++) for (let x = 0; x < COLS * 2; x++) {
    g.fillStyle = lin(x * 8, y * 8, x * 8 + 8, y * 8 + 8, (x + y) % 2 ? C.tile : [C.tile[1], C.tile[0]]);
    g.fillRect(x * 8, y * 8, 8, 8);
  }
  g.strokeStyle = C.grout; g.lineWidth = 0.35;
  for (let x = 0; x <= COLS * 2; x++) { g.beginPath(); g.moveTo(x * 8, 0); g.lineTo(x * 8, ROWS * T); g.stroke(); }
  for (let y = 0; y <= ROWS * 2; y++) { g.beginPath(); g.moveTo(0, y * 8); g.lineTo(COLS * T, y * 8); g.stroke(); }
  const cx = 5.5 * T, cy = 3.6 * T, R = 1.3 * T;
  g.fillStyle = 'rgba(58,124,224,0.88)'; g.fillRect(cx - 9, cy + R + 2, 18, ROWS * T);
  g.fillStyle = '#ffffff'; g.fillRect(cx - 9, cy + R + 2, 1.2, ROWS * T); g.fillRect(cx + 7.8, cy + R + 2, 1.2, ROWS * T);
  g.fillStyle = 'rgba(90,160,248,0.22)'; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#4a8aea'; g.lineWidth = 1.8;
  g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 1.4;
  g.beginPath(); g.moveTo(cx - R, cy); g.lineTo(cx - 6, cy); g.moveTo(cx + 6, cy); g.lineTo(cx + R, cy); g.stroke();
  g.beginPath(); g.arc(cx, cy, 6, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.arc(cx, cy, 2.8, 0, Math.PI * 2); g.stroke();
  return f.c;
}

/** A shelf-edge price label: white, a blue tab, the price in navy (red when you can't afford it); SOLD OUT in grey. */
function tagArt(text, { dear = false, sold = false } = {}) {
  const c = document.createElement('canvas');
  c.width = 240; c.height = 92;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.roundRect(6, 10, 228, 78, 16); g.fill();
  g.fillStyle = sold ? '#e4e8ee' : '#ffffff'; g.beginPath(); g.roundRect(4, 4, 228, 78, 16); g.fill();
  g.fillStyle = sold ? '#a8b0bc' : dear ? '#e84838' : '#3a7ce0'; g.beginPath(); g.roundRect(4, 4, 30, 78, [16, 0, 0, 16]); g.fill();
  g.font = `900 ${sold ? 34 : 50}px "Trebuchet MS", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = sold ? '#8a929e' : dear ? '#d02818' : C.navy;
  g.fillText(text, 134, 46);
  return c;
}

/* ---------- the wares' pictures ---------- */

const images = new Map();
function image(src) {
  if (!images.has(src)) images.set(src, new Promise(done => { const i = new Image(); i.onload = () => done(i); i.onerror = () => done(null); i.src = src; }));
  return images.get(src);
}

/** An item or relic's sprite, cut to its pixels and scaled up in whole steps (its emoji if the file is missing). */
async function spriteArt(thing) {
  const id = thing.sprite || thing.id, img = await image(`assets/items/${id}.png`);
  const c = document.createElement('canvas'), k = 8;
  if (!img) {
    c.width = c.height = 256;
    const g = c.getContext('2d');
    g.font = '180px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(thing.icon || '?', 128, 138);
    c.hd = 2;
    return c;
  }
  const [x, y, w, h] = ITEM_FIT[id] || [0, 0, img.width, img.height];
  const side = Math.max(w, h);
  c.width = c.height = side * k;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.drawImage(img, x, y, w, h, (side - w) / 2 * k, (side - h) * k, w * k, h * k);
  return c;
}

/** The card as the shop shows it small (makeCard()'s .card.small: cost, name, rarity, art), painted for the rack. */
async function cardArt(card) {
  const cq = 3, W = 100 * cq, H = 124 * cq, c = document.createElement('canvas');
  c.width = W; c.height = H;
  c.hd = 2;
  const g = c.getContext('2d'), [c1, c2] = TYPE[card.status ? 'status' : card.type] || TYPE.normal;
  const pixel = '"PokeDB Pixel", "Trebuchet MS", sans-serif';
  await document.fonts.load(`20px ${pixel}`).catch(() => {});
  g.fillStyle = '#181010'; g.beginPath(); g.roundRect(0, 0, W, H, 8 * cq); g.fill();
  g.fillStyle = c2; g.beginPath(); g.roundRect(1.2 * cq, 1.2 * cq, W - 2.4 * cq, H - 2.4 * cq, 7 * cq); g.fill();
  g.fillStyle = c1; g.beginPath(); g.roundRect(3.6 * cq, 3.6 * cq, W - 7.2 * cq, H - 7.2 * cq, 5 * cq); g.fill();
  g.save(); g.clip();
  g.fillStyle = 'rgba(255,255,255,0.07)';
  for (let y = 0; y < H; y += 4 * cq) for (let x = (y / (4 * cq)) % 2 ? 0 : 4 * cq; x < W; x += 8 * cq) g.fillRect(x, y, 4 * cq, 4 * cq);
  g.restore();
  g.strokeStyle = 'rgba(255,255,255,0.3)'; g.lineWidth = cq; g.beginPath(); g.roundRect(4.1 * cq, 4.1 * cq, W - 8.2 * cq, H - 8.2 * cq, 4.6 * cq); g.stroke();
  // the art window
  const ax = 6.5 * cq, ay = 31 * cq, aw = W - 13 * cq, ah = H - ay - 6.5 * cq;
  g.fillStyle = '#181010'; g.fillRect(ax - 1.2 * cq, ay - 1.2 * cq, aw + 2.4 * cq, ah + 2.4 * cq);
  g.fillStyle = mix(c1, '#fff8e8', 0.7); g.fillRect(ax, ay, aw, ah);
  g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = cq; g.strokeRect(ax + 0.5 * cq, ay + 0.5 * cq, aw - cq, ah - cq);
  const img = card.sprite ? await image(`assets/items/${card.sprite}.png`) : null;
  if (img) {
    const [x, y, w, h] = ITEM_FIT[card.sprite] || [0, 0, 32, 32], k = Math.min(64 * cq / w, 60 * cq / h) * 0.92;
    g.imageSmoothingEnabled = false;
    g.drawImage(img, x, y, w, h, ax + (aw - w * k) / 2, ay + (ah - h * k) / 2, w * k, h * k);
  } else {
    g.font = `${30 * cq}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(card.art || '?', ax + aw / 2, ay + ah / 2 + 2 * cq);
  }
  // the name in its band, on one or two lines, shrunk to fit
  const band = { x: 18 * cq, w: W - 36 * cq, y: 5 * cq, h: 24 * cq };
  const parts = card.name.split(' ');
  let size = 10 * cq, lines;
  for (;;) {
    g.font = `${size}px ${pixel}`;
    lines = fitLines(g, parts, band.w);
    if ((lines.length <= 2 && lines.every(l => g.measureText(l).width <= band.w)) || size < 5 * cq) break;
    size -= 0.5 * cq;
  }
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const lh = size * 1.15, top = band.y + band.h / 2 - (lines.length - 1) * lh / 2;
  lines.forEach((l, i) => {
    g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillText(l, W / 2 + 0.9 * cq, top + i * lh + 0.9 * cq);
    g.fillStyle = card.upgraded ? '#9cf0a8' : '#fff8e0'; g.fillText(l, W / 2, top + i * lh);
  });
  // the PP cost, the battle's PP box in small
  if (!card.unplayable) {
    const cx = 11 * cq, cy = 17 * cq, r = 7.5 * cq;
    g.fillStyle = '#303038'; g.beginPath(); g.arc(cx, cy, r + 2.8 * cq, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#f07068'; g.beginPath(); g.arc(cx, cy, r + 1.6 * cq, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#f8f8f8'; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
    g.font = `${10.5 * cq}px ${pixel}`;
    g.fillStyle = '#c0c0c8'; g.fillText(String(card.cost), cx + 0.9 * cq, cy + 1.4 * cq);
    g.fillStyle = '#404048'; g.fillText(String(card.cost), cx, cy + 0.5 * cq);
  }
  // the rarity mark opposite
  const rarity = card.rarity || (card.evoOnly || card.token || card.status || card.safari ? null : 'common');
  const rx = W - 10 * cq, ry = 16.5 * cq;
  g.fillStyle = '#181010'; g.strokeStyle = '#181010'; g.lineWidth = 1.4 * cq; g.lineJoin = 'round';
  if (rarity === 'rare') {
    const star = (rad) => { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, d = i % 2 ? rad * 0.45 : rad; g.lineTo(rx + Math.cos(a) * d, ry + Math.sin(a) * d); } g.closePath(); };
    star(5.2 * cq); g.stroke(); g.fillStyle = '#f8d030'; g.fill();
  } else if (rarity === 'uncommon') {
    g.beginPath(); g.moveTo(rx, ry - 3.6 * cq); g.lineTo(rx + 3.6 * cq, ry); g.lineTo(rx, ry + 3.6 * cq); g.lineTo(rx - 3.6 * cq, ry); g.closePath();
    g.stroke(); g.fillStyle = '#a8d8ff'; g.fill();
  } else if (rarity) {
    g.beginPath(); g.arc(rx, ry, 2.8 * cq, 0, Math.PI * 2); g.stroke(); g.fillStyle = '#e8e8f0'; g.fill();
  }
  return c;
}

function fitLines(g, words, width) {
  const lines = [];
  for (const w of words) {
    const last = lines[lines.length - 1];
    if (last && g.measureText(`${last} ${w}`).width <= width) lines[lines.length - 1] = `${last} ${w}`;
    else lines.push(w);
  }
  return lines;
}

function mix(a, b, k) {
  const p = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * k)).join(',')})`;
}

/* ---------- building the room ---------- */

function box(w, h, d, mats, x, y, z, parent = room) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats);
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
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

function mesh(geo, m, x, y, z, parent = room) {
  const o = new THREE.Mesh(geo, m);
  o.position.set(x, y, z);
  o.castShadow = o.receiveShadow = true;
  parent.add(o);
  return o;
}

function piece(id, x, z, { turn = 0, scale = 1 } = {}) {
  const p = PIECES[id];
  if (!p) return null;
  const model = furnitureModel(THREE, id, (art) => std({ map: tex(art), roughness: 0.9 }));
  if (!model) return null;
  model.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  model.scale.setScalar(scale);
  model.position.set(x, 0, z);
  model.rotation.y = turn;
  room.add(model);
  return model;
}

/** A ball's skin on a sphere: its top colour over a dark band over white, a Great Ball's red flashes, an Ultra's yellow H. */
function ballSkin(kind) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = { poke: '#ee3a30', great: '#3a7ce8', ultra: '#2a2a32', premier: '#f8f8fa' }[kind]; g.fillRect(0, 0, 128, 30);
  if (kind === 'great') { g.fillStyle = '#ee3a30'; g.fillRect(16, 6, 20, 16); g.fillRect(80, 6, 20, 16); }
  if (kind === 'ultra') { g.fillStyle = '#f8d040'; g.fillRect(10, 0, 14, 30); g.fillRect(74, 0, 14, 30); }
  g.fillStyle = '#f8f8fa'; g.fillRect(0, 34, 128, 30);
  g.fillStyle = kind === 'premier' ? '#e84838' : '#22222a'; g.fillRect(0, 29, 128, 6);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** A round blue bin heaped with Poké, Great and Ultra Balls, a price card on a stick. */
function ballBin(tx, ty) {
  const g = new THREE.Group(), blue = std({ color: '#3a7ce0', roughness: 0.4 }), rim = std({ color: '#ffffff', roughness: 0.3 });
  const tub = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.36, 0.48, 32, 1, true), blue);
  tub.position.y = 0.24; tub.castShadow = true; g.add(tub);
  mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.04, 32), blue, 0, 0.02, 0, g);
  const lip = mesh(new THREE.TorusGeometry(0.42, 0.035, 10, 36), rim, 0, 0.48, 0, g);
  lip.rotation.x = Math.PI / 2;
  const skins = ['poke', 'great', 'ultra', 'poke', 'premier'].map(k => std({ map: ballSkin(k), roughness: 0.25 }));
  let n = 7 + tx * 13 + ty * 31;
  const r = () => { n = (n * 16807) % 2147483647; return n / 2147483647; };
  for (let i = 0; i < 26; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.3, h = 0.4 + (0.3 - d) * 0.6 + r() * 0.06;
    const b = mesh(new THREE.SphereGeometry(0.075, 18, 12), skins[i % skins.length], Math.cos(a) * d, h, Math.sin(a) * d, g);
    b.rotation.set(r() * 0.8 - 0.4, r() * Math.PI * 2, r() * 0.8 - 0.4);
  }
  g.position.set(tileX(tx), 0, tileZ(ty));
  room.add(g);
  blocked.add(key(tx, ty));
}

/** The wall unit: a white cabinet at counter height (cupboards, a blue top) for the items and relics, a lit blue back
    over it, and a shelf across it at eye level for the moves on acrylic easels, MOVES on its crown. */
function buildRack() {
  const w = RACK.n + 0.3, cx = tileX(RACK.x0) + (RACK.n - 1) / 2, wall = -ROWS / 2, z = wall + 0.3;
  const white = std({ color: '#f8fafe', roughness: 0.35 }), back = std({ color: '#d8e8fc', emissive: new THREE.Color('#bcd8ff'), emissiveIntensity: 0.35, roughness: 0.6 });
  const blue = std({ color: '#3a7ce0', roughness: 0.4 }), H = RACK.low;
  box(w, H - 0.05, 0.6, [white, white, white, white, std({ color: '#eef3fa', roughness: 0.4 }), white], cx, (H - 0.05) / 2, z);
  for (let i = 0; i < RACK.n; i++) {   // cupboard doors, a round handle each
    const dx = tileX(RACK.x0 + i);
    mesh(rbox(0.86, 0.5, 0.03, 0.02), std({ color: '#ffffff', roughness: 0.3 }), dx, 0.3, z + 0.31);
    mesh(new THREE.SphereGeometry(0.028, 12, 8), blue, dx, 0.47, z + 0.335);
  }
  box(w + 0.06, 0.05, 0.66, blue, cx, H - 0.025, z + 0.01);
  const tall = RACK.top - H;
  box(w, tall, 0.06, back, cx, H + tall / 2, wall + 0.03);
  for (const s of [-1, 1]) box(0.08, tall, 0.4, white, cx + s * (w / 2 - 0.04), H + tall / 2, wall + 0.2);
  box(w, 0.1, 0.44, white, cx, RACK.top, wall + 0.22);
  header('MOVES', 1.7, 0.34).position.set(cx, RACK.top + 0.26, wall + 0.3);
  // the moves' shelf: white with a blue lip; a light strip under it and one under the crown
  box(w - 0.16, 0.05, 0.32, white, cx, RACK.shelf, wall + 0.2);
  box(w - 0.16, 0.06, 0.03, blue, cx, RACK.shelf - 0.005, wall + 0.37);
  for (const y of [RACK.shelf - 0.04, RACK.top - 0.06]) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(w - 0.3, 0.02, 0.05), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
    strip.position.set(cx, y, wall + 0.3);
    room.add(strip);
  }
  for (let i = 0; i < RACK.n; i++) blocked.add(key(RACK.x0 + i, 0));
}

/** Kecleon's counter left of the unit: blue, a white stripe with the Poké Ball, a white top; the PC on its right end. */
function buildCounter() {
  const w = COUNTER.x1 - COUNTER.x0 + 1, cx = (tileX(COUNTER.x0) + tileX(COUNTER.x1)) / 2, cz = tileZ(COUNTER.y), H = COUNTER.h, D = COUNTER.d;
  const blue = std({ color: C.blue[1], roughness: 0.5 }), top = std({ color: '#fbfcff', roughness: 0.3 });
  const f = fine(w * 16, 14, 6), { g, rr, lin } = f, W = w * 16;
  g.fillStyle = lin(0, 0, 0, 14, ['#5aa0f8', C.blue[1], '#2a5cc0']); g.fillRect(0, 0, W, 14);
  for (let x = 1; x < W - 2; x += 16) rr(x + 1, 6, 14, 6.5, 1.2, 'rgba(255,255,255,0.14)');
  g.fillStyle = '#ffffff'; g.fillRect(0, 2.2, W, 2);
  g.fillStyle = C.navy; g.fillRect(0, 13, W, 1);
  ballIcon(g, W / 2, 6.8, 4.6, C.red, '#12245a');
  box(w, H - 0.08, D, [blue, blue, blue, blue, std({ map: texOf(f.c), roughness: 0.5 }), blue], cx, (H - 0.08) / 2, cz);
  box(w + 0.16, 0.08, D + 0.16, top, cx, H - 0.04, cz + 0.02);
  for (const s of [-1, 1]) {
    const end = new THREE.Mesh(new THREE.CylinderGeometry(D / 2, D / 2, H - 0.08, 24, 1, false, s < 0 ? Math.PI : 0, Math.PI), blue);
    end.position.set(cx + s * w / 2, (H - 0.08) / 2, cz);
    end.castShadow = end.receiveShadow = true;
    room.add(end);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(D / 2 + 0.08, D / 2 + 0.08, 0.08, 24, 1, false, s < 0 ? Math.PI : 0, Math.PI), top);
    lid.position.set(cx + s * w / 2, H - 0.04, cz + 0.02);
    room.add(lid);
  }
  for (let x = COUNTER.x0 - 1; x <= COUNTER.x1; x++) for (let y = 0; y <= COUNTER.y; y++) blocked.add(key(x, y));
  const glows = [], pc = pcModel(THREE, glows);
  for (const m of glows) m.emissiveIntensity = 0.85;
  pc.scale.setScalar(0.4);
  pc.position.set(tileX(COUNTER.x1) + 0.3, H, cz + 0.02);
  pc.rotation.y = -0.3;
  pc.traverse(o => { o.userData.spot = 'pc'; });
  room.add(pc);
  pcAt = new THREE.Vector3(pc.position.x, H + 0.95, pc.position.z);
}

/** A gondola of the Mart's everyday goods on the right: white tiers with blue ends, stocked, boxes and bottles on top. */
function buildShelf() {
  const w = SHELF.n, cx = tileX(SHELF.x0) + (w - 1) / 2, z = tileZ(SHELF.y), H = SHELF.h;
  const white = std({ color: '#f8fafe', roughness: 0.35 }), blue = std({ color: '#3a7ce0', roughness: 0.4 });
  box(w - 0.1, H, 0.12, std({ color: '#e6eef8', roughness: 0.6 }), cx, H / 2, z - 0.25);
  for (const s of [-1, 1]) box(0.08, H + 0.04, 0.66, blue, cx + s * (w / 2 - 0.09), (H + 0.04) / 2, z);
  for (const y of [0.08, 0.5, H - 0.03]) box(w - 0.2, 0.05, 0.6, white, cx, y, z);
  box(w - 0.2, 0.06, 0.03, blue, cx, H - 0.03, z + 0.31);
  for (const [y, seed] of [[0.29, 3], [0.71, 5]]) {
    const f = fine(w * 20, 9, 6);
    goods(f, 1, w * 20 - 1, -16.5, 8.6, seed);   // three rows, only the last on the canvas
    const front = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.24, 0.36), std({ map: texOf(f.c), roughness: 0.7 }));
    front.position.set(cx, y, z + 0.02);
    room.add(front);
  }
  for (let i = 0; i < 4; i++) {   // the top tier: a box and a bottle a step along
    const x = cx - w / 2 + 0.32 + i * (w - 0.64) / 3, col = ['#e85848', '#4a8ae8', '#f8c840', '#58b868'][i];
    mesh(rbox(0.22, 0.3, 0.2, 0.03), std({ color: col, roughness: 0.5 }), x - 0.07, H + 0.15, z - 0.06);
    mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.26, 16), std({ color: '#ffffff', roughness: 0.3 }), x + 0.1, H + 0.13, z + 0.1);
  }
  for (let i = 0; i < w; i++) blocked.add(key(SHELF.x0 + i, SHELF.y));
}

function buildRoom() {
  room = new THREE.Group();
  scene.add(room);
  const edge = std({ color: '#1c2c58' });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(COLS, 0.6, ROWS), [edge, edge, std({ map: texOf(floorArt()), roughness: 0.35, metalness: 0.05 }), edge, std({ color: '#c8d8f0' }), edge]);
  floor.position.y = -0.3;
  floor.receiveShadow = true;
  room.add(floor);
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(COLS + 0.8, 7, ROWS + 0.4), [edge, edge, std({ color: '#121c3a' }), edge, std({ color: '#1c2c58' }), edge]);
  plinth.position.set(0, -0.62 - 3.5, -0.2);
  room.add(plinth);

  const wall = wallArt(), wm = std({ map: texOf(wall), roughness: 0.9, emissive: new THREE.Color('#f4f8ff'), emissiveMap: texOf(wall.glow), emissiveIntensity: 0.9 });
  const cap = std({ color: '#3a6ac8' });
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

  buildRack();
  buildCounter();
  buildShelf();
  ballBin(2, 6);
  ballBin(8, 6);
  piece('centerplant', tileX(10), tileZ(0)); blocked.add(key(10, 0));
  piece('centerplant', tileX(0), tileZ(6)); blocked.add(key(0, 6));
  piece('centerplant', tileX(10), tileZ(6)); blocked.add(key(10, 6));
  piece('watercooler', tileX(8), tileZ(0)); blocked.add(key(8, 0));
  piece('centerplant', tileX(0), tileZ(0)); blocked.add(key(0, 0));
  ballBin(0, 3);

  const { step, mat: m } = doormat(tileX(DOOR.x), ROWS / 2 + 0.47, std({ color: '#c8d0e0' }));
  m.userData.spot = 'exit';
  room.add(step, m);
  mat = m.material;

  // a soft sheen that sweeps across the cards now and then (the pixel Mart's shine)
  const c = document.createElement('canvas');
  c.width = 128; c.height = 8;
  const g = c.getContext('2d'), l = g.createLinearGradient(0, 0, 128, 0);
  l.addColorStop(0, 'rgba(255,255,255,0)'); l.addColorStop(0.45, 'rgba(255,255,255,0)'); l.addColorStop(0.5, 'rgba(255,255,255,0.55)'); l.addColorStop(0.55, 'rgba(255,255,255,0)'); l.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = l; g.fillRect(0, 0, 128, 8);
  shine = new THREE.CanvasTexture(c);
  shine.wrapS = THREE.ClampToEdgeWrapping;
  shine.repeat.set(0.5, 1);
}

/* ---------- the wares ---------- */

/** Where each ware stands and where your Pokémon stands to look at it: the moves along the shelf, the items then the
    relics along the cabinet's top under them. */
function slotOf(kind, i) {
  const wall = -ROWS / 2, x = RACK.x0 + i;
  if (kind === 'card') return { at: new THREE.Vector3(tileX(x), RACK.shelf + 0.03 + RACK.h / 2, wall + 0.22), step: { x, y: 1 } };
  return { at: new THREE.Vector3(tileX(x), RACK.low + 0.27, wall + 0.36), step: { x, y: 1 } };
}

function tagMesh(text, look, w = 0.56) {
  const t = new THREE.CanvasTexture(tagArt(text, look));
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, w * 92 / 240), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.6, emissive: '#ffffff', emissiveMap: t, emissiveIntensity: 0.25 }));
}

const cardTex = new Map();
async function buildWares(list) {
  const group = new THREE.Group(), out = [], wall = -ROWS / 2;
  const counts = { card: 0, low: 0 };
  for (const w of list) {
    if (w.kind === 'pc') { out.push({ ...w, spot: { at: pcAt, step: { x: COUNTER.x1, y: COUNTER.y + 1 } } }); continue; }
    const i = w.kind === 'card' ? counts.card++ : counts.low++, spot = slotOf(w.kind, i), g = new THREE.Group();
    g.position.copy(spot.at);
    const entry = { ...w, spot, group: g, base: spot.at.clone(), seed: Math.random() * 6 };
    const tag = tagMesh(w.sold ? 'SOLD OUT' : `₽${w.price}`, { dear: w.dear, sold: w.sold }, w.kind === 'card' ? 0.56 : 0.62);
    if (w.kind === 'card') tag.position.set(spot.at.x, RACK.shelf - 0.07, wall + 0.39);
    else tag.position.set(spot.at.x, RACK.low - 0.2, wall + 0.61);
    group.add(tag);
    if (w.kind === 'card' && !w.sold) {
      const id = w.thing.id;
      if (!cardTex.has(id)) cardTex.set(id, cardArt(w.thing).then(c => { const t = texOf(Object.assign(c, { fine: 2 })); t.userData.keep = true; return t; }));
      const map = await cardTex.get(id);
      const h = RACK.h, cw = h * 100 / 124;
      const face = new THREE.Mesh(new THREE.PlaneGeometry(cw, h), std({ map, roughness: 0.45, emissive: new THREE.Color('#ffffff'), emissiveMap: map, emissiveIntensity: 0.18 }));
      face.castShadow = true;
      g.add(face);
      const sheen = new THREE.Mesh(new THREE.PlaneGeometry(cw, h), new THREE.MeshBasicMaterial({ map: shine.clone(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
      sheen.material.map.needsUpdate = true;
      sheen.position.z = 0.002;
      sheen.raycast = () => {};
      g.add(sheen);
      entry.sheen = sheen.material.map;
      const easel = new THREE.Mesh(new THREE.BoxGeometry(cw * 0.9, 0.03, 0.12), new THREE.MeshPhysicalMaterial({ color: '#e8f6ff', transparent: true, opacity: 0.45, roughness: 0.1 }));
      easel.position.set(0, -h / 2 + 0.005, 0.03);
      g.add(easel);
      g.rotation.x = -0.1;
    } else if (!w.sold) {
      const art = await spriteArt(w.thing);
      const s = w.kind === 'item' ? 0.54 : 0.32;
      const map = tex(art);
      const board = new THREE.Mesh(new THREE.PlaneGeometry(s, s), std({ map, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6, emissive: new THREE.Color('#ffffff'), emissiveMap: map, emissiveIntensity: 0.15 }));
      board.position.y = w.kind === 'relic' ? -0.02 : s / 2 - 0.22;
      board.castShadow = true;
      board.rotation.x = -PITCH * 0.6;
      g.add(board);
      entry.board = board;
      if (w.kind === 'relic') {   // under a glass dome on a gold base, on a blue velvet pad
        const gold = std({ color: '#f8d048', roughness: 0.35, metalness: 0.5 });
        mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.06, 32), gold, 0, -0.24, 0, g).castShadow = false;
        mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.03, 32), std({ color: '#2a58c0', roughness: 1 }), 0, -0.2, 0, g).castShadow = false;
        const glass = new THREE.MeshPhysicalMaterial({ color: '#e8f6ff', transparent: true, opacity: 0.16, roughness: 0.05, depthWrite: false });
        const dome = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.18, 8, 32), glass);
        dome.position.y = 0.0;
        dome.raycast = () => {};
        g.add(dome);
        mesh(new THREE.SphereGeometry(0.03, 12, 8), gold, 0, 0.3, 0, g).castShadow = false;
      } else {
        mesh(rbox(0.36, 0.06, 0.3, 0.02), std({ color: '#ffffff', roughness: 0.3 }), 0, -0.24, 0, g).castShadow = false;
      }
    }
    g.traverse(o => { o.userData.spot = `ware:${out.length}`; });
    tag.userData.spot = `ware:${out.length}`;
    group.add(g);
    out.push(entry);
  }
  return { group, list: out };
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

/** Up to a ware, Kecleon or the door; `aim` is acted on as it arrives. */
function goTo(kind) {
  aim = kind;
  const target = kind === 'exit' ? DOOR : kind === 'clerk' ? { x: COUNTER.x0, y: COUNTER.y + 1 } : wares.list[+kind.split(':')[1]]?.spot.step;
  if (!target) { aim = null; return; }
  walker.path = route(walker.tile, target);
  if (!walker.path.length) arrived();
}

function arrived() {
  const kind = aim;
  aim = null;
  if (!kind) return;
  if (kind === 'exit') return opts.onLeave();
  walker.facing = mon.sheets.back ? 'back' : 'front'; walker.flip = false;
  if (kind === 'clerk') { playCry('kecleon'); clerk.hopUntil = performance.now() + 600; return opts.onClerk?.(); }
  const w = wares.list[+kind.split(':')[1]];
  if (!w || w.sold) return w && opts.onSoldOut?.();
  w.lift = performance.now();
  opts.onPick(w.index);
}

/* ---------- taps ---------- */

function onTap(e) {
  if (!alive() || flying.length) return;
  if (e.target.closest('button, a, input, select, dialog, .reward-bottom, #room-bar, .room-hinge, .top-bar, #collection-screen, .over, .reward-focus')) return;
  if (document.querySelector('dialog[open], .reward-focus')) return;
  if (signEl && hitSign(e.clientX, e.clientY)) { playSound('select'); return goTo(wares.list.findIndex(w => w.kind === 'pc') >= 0 ? `ware:${wares.list.findIndex(w => w.kind === 'pc')}` : 'clerk'); }
  const r = view.getBoundingClientRect();
  const v = new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
  const ray = new THREE.Raycaster();
  ray.setFromCamera(v, camera);
  const hits = ray.intersectObjects([room, wares.group, mon.group, clerk.group], true);
  const first = hits[0]?.object;
  if (first && first === mon.board) { playCry(mon.id); walker.hopUntil = performance.now() + 500; return; }
  let o = first;
  while (o && !o.userData.spot) o = o.parent;
  const spot = o?.userData.spot;
  if (spot === 'pc') { playSound('select'); return goTo(`ware:${wares.list.findIndex(w => w.kind === 'pc')}`); }
  if (spot) { playSound('select'); return goTo(spot); }
  const hit = new THREE.Vector3();
  if (!ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit)) return;
  const t = { x: Math.round(hit.x + COLS / 2 - 0.5), y: Math.round(hit.z + ROWS / 2 - 0.5) };
  if (t.y >= ROWS && Math.abs(t.x - DOOR.x) <= 1) return goTo('exit');
  if (t.x < 0 || t.y < 0 || t.x >= COLS || t.y >= ROWS) return;
  aim = null;
  walker.path = route(walker.tile, t);
}

function hitSign(x, y) {
  const r = signEl.getBoundingClientRect();
  return x >= r.left - 6 && x <= r.right + 6 && y >= r.top - 6 && y <= r.bottom + 10;
}

/* ---------- camera ---------- */

function aimCamera(x, d) {
  camera.position.set(x, LOOK_Y + Math.sin(PITCH) * d, Math.cos(PITCH) * d);
  camera.lookAt(x, LOOK_Y, 0);
  camera.updateMatrixWorld();
}

function below() {
  const tops = ['#room-bar', '#reward-screen .room-hinge']
    .map(s => document.querySelector(s)).filter(n => n?.offsetHeight).map(n => n.getBoundingClientRect().top);
  return tops.length ? Math.max(0, viewH - Math.min(...tops)) + 6 : 120;
}

/** As the Center's: ACROSS tiles at least, back far enough that the doorstep up to the rack's top fits over the bar. */
function fitShot() {
  const h = viewH;
  camera.clearViewOffset();
  camera.updateProjectionMatrix();
  const topGap = 10, low = below(), avail = Math.max(120, h - topGap - low), span = 2 * avail / h * 0.96;
  const ends = (d) => {
    aimCamera(0, d);
    return [new THREE.Vector3(0, SHOT_TOP, -ROWS / 2).project(camera).y, new THREE.Vector3(0, -0.3, ROWS / 2 + 0.95).project(camera).y];
  };
  let lo = 2, hi = 80;
  for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; const [t, b] = ends(mid); if (t - b > span) lo = mid; else hi = mid; }
  const halfTan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect;
  const d = Math.max(hi, ACROSS / 2 / halfTan);
  const [, b] = ends(d);
  shot = { dist: d, half: d * halfTan, shift: (1 - b) / 2 * h - (h - low - 2), low };
}

function placeCamera(dt) {
  if (!shot) return;
  const edge = COLS / 2 + 0.4, half = shot.half;
  const want = half >= edge ? 0 : Math.max(-edge + half, Math.min(edge - half, walker.x));
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

const alive = () => !!document.querySelector('#reward-options.mart-window') && !document.getElementById('reward-screen').hidden;

function frame(now) {
  raf = 0;
  if (!alive()) return unmount();
  const dt = Math.min(100, now - (last || now));
  last = now;
  if (walk(dt)) arrived();
  const hopping = walker.hopUntil > now;
  const bob = calm ? 0 : walker.path.length ? Math.abs(Math.sin(walker.hop / 1000 * Math.PI * 4)) * 0.08 : hopping ? Math.abs(Math.sin((walker.hopUntil - now) / 500 * Math.PI * 2)) * 0.35 : 0;
  mon.group.position.set(walker.x, 0, walker.z);
  mon.board.scale.set(walker.flip ? -1 : 1, 1, 1);
  mon.board.position.y = bob;
  drawMon(mon, walker, dt);
  drawMon(clerk, { facing: 'front' }, dt);
  clerk.board.scale.x = walker.x > clerk.group.position.x + 0.3 ? -1 : 1;
  const left = (clerk.hopUntil || 0) - now;
  clerk.board.position.y = !calm && left > 0 ? Math.abs(Math.sin(left / 600 * Math.PI * 2)) * 0.3 : 0;
  tickWares(now);
  if (!calm && mat) mat.emissiveIntensity = 0.12 + Math.sin(now / 420) * 0.1;
  placeCamera(dt);
  placeSign();
  if (!calm) livePc(now);
  post.draw(scene, camera, 0.5);
  raf = requestAnimationFrame(frame);
}

/** Items and relics bob and turn a little, the cards' sheen sweeps across one after another, a ware just picked hops,
    and one just bought flies into your Pokémon. */
function tickWares(now) {
  for (const w of wares.list) {
    if (!w.group || w.sold) continue;
    if (w.board && !calm) {
      w.group.position.y = w.base.y + Math.sin(now / 700 + w.seed) * 0.025;
      w.board.rotation.y = Math.sin(now / 1300 + w.seed) * 0.35;
    }
    if (w.sheen) w.sheen.offset.x = calm ? 1 : ((now / 3400 + w.seed * 0.11) % 1.6) * 1.6 - 1.1;
    if (w.lift && !calm) {
      const k = (now - w.lift) / 380;
      w.group.position.y = w.base.y + (w.board ? Math.sin(now / 700 + w.seed) * 0.025 : 0) + (k < 1 ? Math.sin(k * Math.PI) * 0.14 : 0);
      if (k >= 1) w.lift = 0;
    }
  }
  flying = flying.filter(f => {
    const k = Math.min(1, (now - f.from) / 520), e = k * k * (3 - 2 * k);
    const to = new THREE.Vector3(walker.x, 0.5, walker.z);
    f.obj.position.lerpVectors(f.start, to, e).y += Math.sin(Math.PI * k) * 0.7;
    f.obj.scale.setScalar(1 - e * 0.85);
    if (k >= 1) { f.obj.parent?.remove(f.obj); walker.hopUntil = now + 500; return false; }
    return true;
  });
}

/** The PC's sign: its price and Forget, a small cream speech window over the PC like the Center's. */
function placeSign() {
  if (!signEl || !pcAt) return;
  const r = view.getBoundingClientRect(), p = pcAt.clone().project(camera);
  signEl.style.left = `${Math.round(r.left + (p.x + 1) / 2 * r.width)}px`;
  signEl.style.top = `${Math.round(r.top + (1 - p.y) / 2 * r.height)}px`;
}

function unmount() {
  cancelAnimationFrame(raf);
  raf = 0;
  view?.classList.remove('on');
  view?.remove();
  signEl?.remove();
  removeEventListener('click', onTap, true);
  removeEventListener('resize', resize);
  document.getElementById('reward-options')?.classList.remove('m3d');
  leftAt = performance.now();
  aim = null;
  for (const f of flying) f.obj.parent?.remove(f.obj);
  flying = [];
}

/* ---------- in ---------- */

let warming = null;
/** Three.js loaded and the room built before it's needed (the map calls it, so walking in is instant). */
export function warmMart() {
  warming ??= (async () => {
    THREE = await loadThree();
    await hubThree();
    view = document.createElement('canvas');
    view.className = 'center3d-view mart3d-view';
    renderer = new THREE.WebGLRenderer({ canvas: view, antialias: false, powerPreference: 'high-performance' });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    scene = new THREE.Scene();
    scene.background = new THREE.Color('#141c34');
    camera = new THREE.PerspectiveCamera(30, 1, 0.5, 140);
    const hemi = new THREE.HemisphereLight('#ffffff', '#8a9ab8', 1.8);
    const sun = new THREE.DirectionalLight('#fffaf0', 2.0);
    sun.position.set(-3, 12, 7);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 });
    sun.shadow.bias = -0.0015;
    sun.shadow.normalBias = 0.02;
    scene.add(hemi, sun);
    post = createPost(renderer, { short: 760, crisp: false });
    post.final.uniforms.uBlur.value = 0;
    post.final.uniforms.uBloom.value = 0.45;
    buildRoom();
    clerk = await monBoard({ src: 'assets/pokemon/kecleon-front.gif', name: 'Kecleon', cry: 'kecleon' }, false);
    clerk.board.rotation.x = -PITCH;
    clerk.group.position.set(tileX(CLERK.x), 0.16, tileZ(CLERK.y) + 0.2);
    clerk.group.traverse(n => { n.userData.spot = 'clerk'; });
    scene.add(clerk.group);
    wares = { group: new THREE.Group(), list: [] };
    scene.add(wares.group);
    new ResizeObserver(() => { if (view.isConnected) resize(); }).observe(view);
  })();
  warming.catch(() => { warming = null; });
  return warming;
}

/** Lays the 3D Mart under the shop martRoom() just showed. `o`: { run, mate ({ src, name, cry }), wares (in the stock's
    order: { kind: 'card' | 'item' | 'relic' | 'pc', thing, price, dear, sold, index (its choice), sign (the PC's) }),
    onPick(index), onLeave(), onClerk(), onSoldOut() }. Resolves once it's showing (null if the shop was left meanwhile);
    throws if Three.js won't load (the pixel shop stays). */
export async function mountMart(o) {
  const back = o.run === runId && performance.now() - leftAt < 20000;
  const again = o.run === runId && !!raf;   // re-shown after a purchase: the room is already up
  runId = o.run;
  opts = o;
  calm = calmFx();
  await warmMart();
  if (!alive()) return null;
  if (mon?.src !== o.mate.src) {
    if (mon) scene.remove(mon.group);
    mon = await monBoard(o.mate);
    mon.board.rotation.x = -PITCH;
    scene.add(mon.group);
  }
  const next = await buildWares(o.wares);
  if (!alive()) return null;
  // what was on sale before and is gone now was just bought: it flies into your Pokémon
  if (again) {
    for (const [i, w] of wares.list.entries()) {
      const now = next.list[i];
      if (w.group && !w.sold && now?.sold && !calm) {
        const start = new THREE.Vector3();
        w.group.getWorldPosition(start);
        scene.attach(w.group);
        flying.push({ obj: w.group, start, from: performance.now() });
      }
    }
  }
  scene.remove(wares.group);
  dispose(wares.group);   // the card faces are kept (cardTex), so a re-shown shelf needn't paint them again
  wares = next;
  scene.add(wares.group);
  if (!back && !again) {
    walker = { x: tileX(DOOR.x), z: tileZ(DOOR.y), tile: { ...DOOR }, path: [], facing: mon.sheets.back ? 'back' : 'front', flip: false, hop: 0 };
    camX = walker.x;
  }
  walker.path = [];
  const pc = o.wares.find(w => w.kind === 'pc');
  signEl?.remove();
  signEl = null;
  if (pc) {
    signEl = document.createElement('span');
    signEl.className = `mart3d-sign${pc.dear || pc.sold ? ' off' : ''}`;
    signEl.textContent = pc.sign;
    document.body.append(signEl);
  }
  document.body.append(view);
  document.getElementById('reward-options').classList.add('m3d');
  addEventListener('click', onTap, true);
  addEventListener('resize', resize);
  resize();
  last = 0;
  if (!raf) raf = requestAnimationFrame(frame);
  requestAnimationFrame(() => view.classList.add('on'));
  return true;
}
