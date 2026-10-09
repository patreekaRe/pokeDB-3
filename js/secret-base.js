/* secret-base.js  -  the Secret Base (roadmap idea, part a's first pass): a room of your own, its furniture painted in
   code like the biomes' landmarks, placed on a tile grid with taps (no dragging, for phones). A tap on a piece in the
   tray then on the room places it; a tap on a placed piece gives Rotate / Move / Store. The layout is the save's
   `secretBase`. Since the 3D base (js/base-3d.js) this 2D room is only its fallback where WebGL fails (or ?base&flat);
   the 3D one builds from the paintings, rules and tray icons exported here. */

import { getSave, updateSave } from './storage.js';
import { playSound } from './audio.js';
import { PIECES, CATALOGUE, KINDS, DESIGNS, colours, styles } from './base-furniture.js';
import { RES } from './base-paint.js';
import { safariDay } from './data/safari.js';
import { streamOf, shuffled } from './rng.js';
import { FURNITURE, FURNITURE_BY_KIND, isEarned, howToEarn } from './data/furniture.js';
import { surfaceHeight, seatHeight } from './base-shapes.js';

const T = 16, COLS = 11, ROWS = 8, WALL = 48;
const W = COLS * T, H = WALL + ROWS * T;

const WALLPAPERS = [
  { id: 'cream', name: 'Cream stripes', look: 'stripe', a: '#f4e6c4', b: '#ead6a8', trim: '#a8794a' },
  { id: 'mint', name: 'Mint dots', look: 'dots', a: '#cdebd4', b: '#9fd2ad', trim: '#4f8a63' },
  { id: 'sky', name: 'Sky panels', look: 'panel', a: '#c8dcf4', b: '#9dbbe4', trim: '#4a6aa0' },
  { id: 'brick', name: 'Red brick', look: 'brick', a: '#b5573e', b: '#8e3f2c', trim: '#5a2a1e' },
  // for sale (a `price`): bought once in the Wallpaper tab, tried on first
  { id: 'plaid', name: 'Plaid', look: 'plaid', a: '#e8d0a0', b: '#c0503c', c: '#3c5a8c', trim: '#6a3a24', price: 400 },
  { id: 'waves', name: 'Sea waves', look: 'wave', a: '#d4eef4', b: '#5aa8d0', trim: '#2a6a94', price: 450 },
  { id: 'stars', name: 'Night stars', look: 'star', a: '#2a2c5a', b: '#f8e070', c: '#8a90d0', trim: '#14163a', price: 600 },
  { id: 'boards', name: 'Log cabin', look: 'boards', a: '#b07a48', b: '#8a5a32', c: '#d09a60', trim: '#4a2c18', price: 500 },
  { id: 'leaves', name: 'Leafy', look: 'leaf', a: '#e4f0c8', b: '#6aa84a', c: '#3e7a34', trim: '#3e5a2a', price: 450 },
  { id: 'hearts', name: 'Sweet hearts', look: 'heart', a: '#fbe0ea', b: '#e8608c', trim: '#a83a60', price: 500 },
  { id: 'harlequin', name: 'Harlequin', look: 'diamond', a: '#f0d878', b: '#d8a830', c: '#8a5a10', trim: '#6a4410', price: 550 },
  { id: 'pokeballs', name: 'Poké Balls', look: 'ball', a: '#cfe0ec', b: '#e04040', c: '#303030', trim: '#a02828', price: 800 },
  { id: 'stone', name: 'Castle stone', look: 'stone', a: '#9a9a90', b: '#7a7a72', c: '#b8b8ac', trim: '#4a4a44', price: 650 },
  { id: 'sunset', name: 'Sunset', look: 'fade', a: '#f8c070', b: '#e86a60', c: '#8a4a90', trim: '#5a2a5a', price: 900 },
];
const FLOORS = [
  { id: 'wood', name: 'Wood', look: 'wood', a: '#c48a52', b: '#a8723f', c: '#8a5a30' },
  { id: 'tile', name: 'Tiles', look: 'tile', a: '#e8e4dc', b: '#cfc8bb', c: '#a49c8e' },
  { id: 'carpet', name: 'Carpet', look: 'carpet', a: '#7a5aa8', b: '#6a4c96', c: '#8c6cba' },
  { id: 'grass', name: 'Grass', look: 'grass', a: '#6cbf58', b: '#58a848', c: '#86d46e' },
  { id: 'checker', name: 'Checkerboard', look: 'checker', a: '#f0ece4', b: '#3a3a44', c: '#22222a', price: 500 },
  { id: 'darkwood', name: 'Dark wood', look: 'wood', a: '#6a4228', b: '#583620', c: '#3e2414', price: 450 },
  { id: 'parquet', name: 'Parquet', look: 'parquet', a: '#d0a060', b: '#b08040', c: '#8a5e2c', price: 650 },
  { id: 'flagstone', name: 'Flagstones', look: 'flag', a: '#a8a498', b: '#8e8a7e', c: '#6a665c', price: 550 },
  { id: 'tatami', name: 'Tatami', look: 'tatami', a: '#cfd08a', b: '#b8b874', c: '#4a5a2a', price: 600 },
  { id: 'sand', name: 'Beach sand', look: 'sand', a: '#ecd8a0', b: '#d8c080', c: '#f8ecc4', price: 400 },
  { id: 'ice', name: 'Ice', look: 'ice', a: '#cfe8f4', b: '#a8d0e8', c: '#ffffff', price: 700 },
  { id: 'marble', name: 'Marble', look: 'marble', a: '#f4f0ea', b: '#d8d0c4', c: '#b0a898', price: 900 },
  { id: 'redcarpet', name: 'Red carpet', look: 'carpet', a: '#b02838', b: '#98202e', c: '#d04050', price: 500 },
  { id: 'mosaic', name: 'Mosaic', look: 'mosaic', a: '#e8dcc4', b: '#4a8ac0', c: '#e0a030', price: 800 },
];
const papers = (field) => field === 'wall' ? WALLPAPERS : FLOORS;

let g;   // the room's 2D context while painting
const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };

const footprint = (it) => { const p = PIECES[it.id]; return it.dir % 2 ? [p.h, p.w] : [p.w, p.h]; };

// every new room is the same: a bed, a lamp, a rug under the window, and a present of starter furniture to open
const FIRST_ROOM = [{ id: 'window', x: 4 }, { id: 'rug', x: 4, y: 3, dir: 0 }, { id: 'bed', x: 0, y: 0, dir: 0 },
  { id: 'lamp', x: 2, y: 0, dir: 0 }, { id: 'gift', x: 5, y: 3, dir: 0 }];
const STARTER_GIFT = ['table', 'chair', 'chair', 'cushion', 'cushion', 'plant', 'shelf', 'tv', 'poster', 'clock'];
const STOCK = 8;   // pieces on each floor of the Furniture store each day
const UPSTAIRS_PRICE = 2500;   // PokéCoins to open the store's second floor, and STOCK more pieces a day with it

const freshBase = (mons) => ({
  v: 2, wall: 'cream', floor: 'wood', items: FIRST_ROOM.map(it => ({ ...it })),
  owned: { window: 1, rug: 1, bed: 1, lamp: 1 }, ...(mons ? { mons } : {}),
});

export { PIECES, CATALOGUE, KINDS, DESIGNS, colours, styles, WALLPAPERS, FLOORS, papers, T, WALL, COLS, ROWS, STARTER_GIFT, footprint, cells, fits, aimTile, icon };

/* Things on tables (the user's ask, 2026-10-09): a piece with a `top` (js/base-shapes.js: tables, desks, counters,
   dressers) holds small pieces on its tiles, one a tile. Such a piece is saved with `up: 1` on the tile it stands on;
   the table under it is whatever covers that tile, so nothing else is saved, and moving or storing the table takes what
   stands on it along (js/base-3d.js). */

/** The height in tiles of a piece's top that small pieces can stand on, or 0. */
export const surfaceOf = (id) => surfaceHeight(PIECES[id].fam, PIECES[id]);

const heights = new Map();
/** Whether a piece is small enough to stand on a table: one tile, upright, no seat or table itself, and painted under
    2 tiles tall (a lamp, a potted plant, a doll, a radio; not a floor lamp or a fridge). */
export function small(id) {
  const p = PIECES[id];
  if (!p?.upright || p.w !== 1 || p.h !== 1 || p.solid || p.gift || seatHeight(p.fam, p) || surfaceOf(id)) return false;
  if (!heights.has(p.fam)) {
    const a = p.art(0, 1, true), d = a.getContext('2d').getImageData(0, 0, a.width, a.height).data;
    let top = a.height;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 128) { top = Math.floor((i >> 2) / a.width); break; }
    heights.set(p.fam, (a.height - top) / (T * RES));
  }
  return heights.get(p.fam) <= 2;
}

/** The table (its index in the room) whose top covers a piece's tile, or -1. */
export const surfaceUnder = (it, b) => b.items.findIndex(o => !o.up && o.y !== undefined && surfaceOf(o.id) && cells(o).includes(`${it.x},${it.y}`));

/** What stands on a table: the pieces up on its tiles. */
export const ridersOf = (it, b) => { const mine = new Set(cells(it)); return b.items.filter(o => o.up && o !== it && mine.has(`${o.x},${o.y}`)); };

/** A placed piece's spot for `it` at a tile: up on a table if it's small and a table is there. */
export const standing = (it, b) => small(it.id) && surfaceUnder(it, b) >= 0 ? { ...it, up: 1 } : (({ up, ...rest }) => rest)(it);
/** The saved room, or the first one. A room from before furniture was owned (v 1, when every piece was free) starts
    over as the first room, keeping its Pokémon: only playtests of the unreleased branch made those. `?basefresh` does
    the same on purpose. */
export function loadBase() {
  const b = getSave().secretBase;
  if (!b || !(b.v >= 2) || new URLSearchParams(location.search).has('basefresh')) return freshBase(b?.mons);
  b.owned ||= {};
  // furniture was once owned colour by colour (`bed-fire`), then kind by kind; now a kind or a whole set (`own`) is owned, every colour and style with it
  for (const id of Object.keys(b.owned)) {
    const kind = PIECES[id]?.own;
    if (kind && kind !== id) { b.owned[kind] = (b.owned[kind] || 0) + b.owned[id]; delete b.owned[id]; }
  }
  return b;
}
export const saveBase = (b) => updateSave(d => { d.secretBase = b; });

/** `?allfurniture`: every catalogue piece to hand for a playtest, never saved as owned. */
export const lendAll = () => new URLSearchParams(location.search).has('allfurniture');

/** How many of a kind you own: bought, plus one of an earned kind once its badge, achievement, feat or page is
    (js/data/furniture.js; worked out from the save each time, never stored in `owned`). */
const owns = (b, kind) => (b.owned[kind] || 0) + (FURNITURE_BY_KIND[kind] && isEarned(FURNITURE_BY_KIND[kind], getSave()) ? 1 : 0);

/** The earned kinds not yet earned, for the Shop's locked shelf, with how to get each. */
export const lockedEarned = () => FURNITURE.filter(p => !isEarned(p, getSave()) && PIECES[p.kind])
  .map(p => ({ id: p.kind, how: howToEarn(p, getSave()) }));

/** How many of a piece's kind (or set) are in storage, in any colour or style: owned, less those standing in the room. */
export function spare(b, id) {
  if (lendAll() && PIECES[id] && !PIECES[id].gift) return Infinity;
  const kind = PIECES[id].own;
  return owns(b, kind) - b.items.filter(it => PIECES[it.id].own === kind).length;
}

/** Open the room's present: it's gone, and the starter furniture is in storage. Returns what was inside. */
export function openGift(b) {
  b.items = b.items.filter(it => it.id !== 'gift');
  for (const id of STARTER_GIFT) b.owned[id] = (b.owned[id] || 0) + 1;
  saveBase(b);
  return STARTER_GIFT;
}

/** The Furniture store's stock for a UTC day on a floor: STOCK designs (a kind, or a whole set), the same for everyone
    that day; the second floor's are the next STOCK of the same shuffle, so the two never share a piece. */
export const furnitureStock = (day = safariDay(), floor = 1) => shuffled(DESIGNS.filter(id => !FURNITURE_BY_KIND[id]), streamOf('furniture', day)).slice((floor - 1) * STOCK, floor * STOCK);
/** Everything for sale today: the ground floor's, and the second floor's once it's open. */
export const shopStock = (b) => [...furnitureStock(), ...(b.upstairs ? furnitureStock(undefined, 2) : [])];
export { UPSTAIRS_PRICE };
/** Open the store's second floor for good (`b.upstairs`). False if the coins aren't there. */
export function buyUpstairs(b) {
  if ((getSave().coins ?? 0) < UPSTAIRS_PRICE) return false;
  b.upstairs = true;
  updateSave(d => { d.coins -= UPSTAIRS_PRICE; d.secretBase = b; });
  return true;
}

/** Whether today's Shop stock is still unseen (the "!" on the Decorate key and the Shop tab), and marking it seen. */
export const shopNews = (b) => b.shopSeen !== safariDay();
export function seeShop(b) { b.shopSeen = safariDay(); }

/** A wallpaper or floor is free (no price), bought (`b.papers`, as `wall:id` / `floor:id`), or lent by ?allfurniture. */
export const ownsPaper = (b, field, s) => !s.price || lendAll() || (b.papers || []).includes(`${field}:${s.id}`);

/** Buy a wallpaper or floor and put it up. False if the coins aren't there. */
export function buyPaper(b, field, s) {
  if ((getSave().coins ?? 0) < s.price) return false;
  b.papers = [...(b.papers || []), `${field}:${s.id}`];
  b[field] = s.id;
  updateSave(d => { d.coins -= s.price; d.secretBase = b; });
  return true;
}

/** A wallpaper or floor's tray picture: a corner of the room painted in it. */
export function paperArt(field, id) {
  const art = roomArt({ wall: field === 'wall' ? id : 'cream', floor: field === 'floor' ? id : 'wood' });
  const c = document.createElement('canvas');
  c.width = 48; c.height = 36;
  c.getContext('2d').drawImage(art, 0, field === 'wall' ? 8 : WALL + 8, 48, 36, 0, 0, 48, 36);
  return c;
}

/** Buy a piece for PokéCoins into storage. False if the coins aren't there. */
export function buyPiece(b, id) {
  const price = PIECES[id].price;
  if ((getSave().coins ?? 0) < price) return false;
  b.owned[PIECES[id].own] = (b.owned[PIECES[id].own] || 0) + 1;
  updateSave(d => { d.coins -= price; d.secretBase = b; });
  return true;
}

/** The wallpaper strip (WALL high) and the bare floor, painted on one canvas the room's size. */
export function roomArt(b) {
  const c = new OffscreenCanvas(W, H), keep = g, kept = base;
  g = c.getContext('2d'); base = b;
  paintWall(); paintFloor();
  g = keep; base = kept;
  return c;
}

/** One piece alone on a clear canvas, RES painted pixels to a room pixel (its `art()`): a flat one top-down at its first
    facing, a wall one as its strip, an upright one at `dir` with headroom above its tiles. */
export const pieceArt = (id, dir = 0, s = 1) => PIECES[id].art(dir, s);

let base, canvas, holding = null, sel = -1, ghost = null, badGhost = 0, hint;

function paintWall() {
  const wp = WALLPAPERS.find(w => w.id === base.wall);
  R(0, 0, W, WALL, wp.a);
  for (let x = 0; x < W; x += 8) for (let y = 0; y < WALL - 4; y += 8) {
    if (wp.look === 'stripe' && x % 16 === 0) R(x, y, 4, 8, wp.b);
    if (wp.look === 'dots' && (x / 8 + y / 8) % 2 === 0) R(x + 3, y + 3, 2, 2, wp.b);
    if (wp.look === 'panel' && x % 32 === 0) { R(x + 3, 6, 26, 1, wp.b); R(x + 3, 6, 1, 30, wp.b); R(x + 3, 36, 26, 1, wp.trim); R(x + 28, 6, 1, 31, wp.trim); }
    if (wp.look === 'brick') { R(x, y + 7, 8, 1, wp.b); if ((x / 8 + (y / 8) % 2 * 1) % 2 === 0) R(x, y, 1, 7, wp.b); }
    // the patterns repeat every 8, 16 or 32 rows, since the 3D room runs the top 32 up its tall wall
    const cx = x / 8, cy = y / 8;
    if (wp.look === 'plaid') { if (cx % 2 === 0) R(x + 2, y, 3, 8, wp.b + '90'); if (cy % 2 === 0) R(x, y + 2, 8, 3, wp.b + '90'); if (cx % 4 === 1) R(x + 4, y, 1, 8, wp.c); if (cy % 4 === 1) R(x, y + 5, 8, 1, wp.c); }
    if (wp.look === 'wave' && cy % 2 === 0) for (let i = 0; i < 8; i++) R(x + i, y + 4 + [0, -1, -2, -2, -1, 0, 1, 1][i], 1, 2, wp.b);
    if (wp.look === 'star') {
      if ((cx * 3 + cy * 5) % 7 === 0) { R(x + 3, y + 2, 1, 5, wp.b); R(x + 1, y + 4, 5, 1, wp.b); R(x + 3, y + 4, 1, 1, '#fff'); }
      else if ((cx * 5 + cy) % 3 === 0) R(x + (cx * 7 % 6) + 1, y + (cy * 3 % 5) + 1, 1, 1, wp.c);
    }
    if (wp.look === 'boards') { if (cx % 2 === 0) R(x, y, 1, 8, wp.b); if ((cx * 5 + cy * 3) % 9 === 0) R(x + 4, y + 3, 2, 2, wp.b); if (cx % 2 === 1) R(x + 1, y, 1, 8, wp.c); }
    if (wp.look === 'leaf' && (cx + cy) % 2 === 0) { R(x + 2, y + 2, 3, 2, wp.b); R(x + 3, y + 1, 3, 2, wp.b); R(x + 1, y + 4, 2, 1, wp.c); R(x + 3, y + 3, 1, 1, wp.c); }
    if (wp.look === 'heart' && (cx + cy) % 2 === 0) { R(x + 2, y + 2, 2, 1, wp.b); R(x + 5, y + 2, 2, 1, wp.b); R(x + 1, y + 3, 7, 2, wp.b); R(x + 2, y + 5, 5, 1, wp.b); R(x + 3, y + 6, 3, 1, wp.b); R(x + 4, y + 7, 1, 1, wp.b); R(x + 2, y + 3, 1, 1, '#fff8'); }
    if (wp.look === 'diamond') for (let i = 0; i < 8; i++) { const w = i < 4 ? i * 2 + 1 : 15 - i * 2; if ((cx + cy) % 2 === 0) R(x + 4 - (w >> 1), y + i, w, 1, wp.b); else R(x + 4 - (w >> 1), y + i, 1, 1, wp.c); }
    if (wp.look === 'ball' && cx % 2 === 0 && cy % 2 === 0 && (cx / 2 + cy / 2) % 2 === 0) for (let j = 0; j < 12; j++) for (let i = 0; i < 12; i++) {
      // a 12-pixel ball, staggered every other 16-pixel cell, outlined so its white half shows on the pale paper
      const d = (i - 5.5) ** 2 + (j - 5.5) ** 2, mid = (i - 5.5) ** 2 + (j - 5.5) ** 2 <= 6;
      if (d > 36) continue;
      const col = d > 25 ? wp.c : mid ? (d > 3 ? wp.c : '#fff') : j === 5 || j === 6 ? wp.c : j < 5 ? (i < 4 && j < 3 ? '#f88' : wp.b) : '#fff';
      R(x + 2 + i, y + 2 + j, 1, 1, col);
    }
    if (wp.look === 'stone') { R(x, y + 7, 8, 1, wp.b); if ((cx + (cy % 2) * 1) % 2 === 0) R(x, y, 1, 7, wp.b); if ((cx * 7 + cy * 3) % 5 === 0) R(x + 2, y + 2, 3, 2, wp.c); }
    if (wp.look === 'fade') {
      // three bands down a 32-row repeat, dithered into each other
      for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) {
        const t = ((y + j) % 32) / 32 * 3, band = Math.floor(t), mix = t - band, dith = ((i + j * 3) % 4) / 4;
        R(x + i, y + j, 1, 1, [wp.a, wp.b, wp.c, wp.a][band + (mix > 0.6 + dith * 0.4 ? 1 : 0)]);
      }
    }
  }
  R(0, WALL - 5, W, 5, wp.trim); R(0, WALL - 5, W, 1, '#00000030');
}

function paintFloor() {
  const f = FLOORS.find(x => x.id === base.floor);
  R(0, WALL, W, H - WALL, f.a);
  for (let ty = 0; ty < ROWS * 2; ty++) for (let tx = 0; tx < COLS * 2; tx++) {
    const x = tx * 8, y = WALL + ty * 8;
    if (f.look === 'wood') { if ((tx + (ty % 2) * 3) % 6 === 0) R(x, y, 1, 8, f.c); R(x, y + 7, 8, 1, f.b); }
    if (f.look === 'tile') { if ((tx >> 1) % 2 === (ty >> 1) % 2) R(x, y, 8, 8, f.b); if (tx % 2 === 0) R(x, y, 1, 8, f.c); if (ty % 2 === 0) R(x, y, 8, 1, f.c); }
    if (f.look === 'carpet' && (tx * 7 + ty * 3) % 5 === 0) R(x + 3, y + 3, 1, 1, f.c);
    if (f.look === 'grass' && (tx * 5 + ty * 11) % 7 === 0) { R(x + 2, y + 3, 1, 3, f.c); R(x + 4, y + 2, 1, 4, f.c); R(x + 3, y + 5, 3, 1, f.b); }
    if (f.look === 'checker') { if ((tx >> 1) % 2 === (ty >> 1) % 2) R(x, y, 8, 8, f.b); if ((tx >> 1) % 2 === (ty >> 1) % 2 && tx % 2 === 0 && ty % 2 === 0) R(x, y, 8, 1, '#ffffff18'); }
    if (f.look === 'parquet') {
      // herringbone-ish: 8x8 blocks of three boards, turned every other block
      if ((tx + ty) % 2 === 0) { R(x, y + 2, 8, 1, f.b); R(x, y + 5, 8, 1, f.b); R(x, y + 7, 8, 1, f.c); }
      else { R(x + 2, y, 1, 8, f.b); R(x + 5, y, 1, 8, f.b); R(x + 7, y, 1, 8, f.c); }
    }
    if (f.look === 'flag') { R(x, y + 7, 8, 1, f.c); if ((tx + (ty % 2) * 2) % 3 === 0) R(x, y, 1, 7, f.c); if ((tx * 3 + ty * 7) % 4 === 0) R(x + 2, y + 2, 4, 3, f.b); }
    if (f.look === 'tatami') {
      // mats two cells wide and one tall, their dark cloth edging on the long sides
      const across = (Math.floor(tx / 4) + ty) % 2 === 0;
      if (across ? tx % 4 === 0 : ty % 2 === 0) R(x, y, across ? 1 : 8, across ? 8 : 1, f.c);
      for (let i = 1; i < 8; i += 2) R(across ? x : x + i, across ? y + i : y, across ? 8 : 1, across ? 1 : 8, f.b);
    }
    if (f.look === 'sand') { if ((tx * 7 + ty * 13) % 5 === 0) R(x + 2, y + 5, 1, 1, f.b); if ((tx * 11 + ty * 3) % 7 === 0) R(x + 5, y + 2, 1, 1, f.c); if ((tx * 3 + ty * 5) % 11 === 0) R(x + 1, y + 1, 2, 1, f.b); }
    if (f.look === 'ice') { R(x, y, 8, 8, (tx + ty) % 3 ? f.a : f.b); if ((tx * 5 + ty * 3) % 6 === 0) for (let i = 0; i < 5; i++) R(x + 1 + i, y + 5 - i, 1, 1, f.c); }
    if (f.look === 'marble') {
      if (tx % 4 === 0) R(x, y, 1, 8, f.b); if (ty % 4 === 0) R(x, y, 8, 1, f.b);
      if ((tx * 7 + ty * 5) % 9 < 2) for (let i = 0; i < 8; i++) R(x + i, y + ((i * 3 + tx) % 5), 1, 1, f.c);
    }
    if (f.look === 'mosaic') {
      R(x, y, 8, 1, '#00000018'); R(x, y, 1, 8, '#00000018');
      const k = (tx * 7 + ty * 11 + (tx * ty) % 3) % 6;
      if (k === 0) R(x + 2, y + 2, 4, 4, f.b); if (k === 3) R(x + 2, y + 2, 4, 4, f.c);
      if ((tx % 4 === 2) && (ty % 4 === 2)) { R(x + 1, y + 3, 6, 2, f.c); R(x + 3, y + 1, 2, 6, f.c); R(x + 3, y + 3, 2, 2, f.b); }
    }
  }
  R(0, WALL, W, 2, '#00000028');
}

function paintPiece(it, alpha = 1) {
  const p = PIECES[it.id];
  g.globalAlpha = alpha;
  if (p.layer === 'wall') { g.drawImage(p.art(), it.x * T, 0, p.w * T, WALL); g.globalAlpha = 1; return; }
  const x = it.x * T, y = WALL + it.y * T, [fw, fh] = footprint(it);
  if (p.flat) {
    g.save();
    g.translate(x + fw * T / 2, y + fh * T / 2);
    g.rotate(it.dir * Math.PI / 2);
    g.drawImage(p.art(), -p.w * T / 2, -p.h * T / 2, p.w * T, p.h * T);
    g.restore();
    if (p.layer !== 'rug') R(x + 1, y + fh * T - 2, fw * T - 2, 2, '#00000040');   // its side, so it stands off the floor
  } else {
    // up on a table it stands on the table's top, a little smaller
    const art = p.art(it.dir), under = it.up ? base.items[surfaceUnder(it, base)] : null, k = under ? 0.75 : 1;
    const lift = under ? surfaceOf(under.id) * T : 0, w = art.width / RES * k, h = art.height / RES * k;
    g.drawImage(art, x + (fw * T - w) / 2, y + fh * T - h - lift, w, h);
  }
  g.globalAlpha = 1;
}

function paint() {
  g = canvas.getContext('2d');
  g.imageSmoothingEnabled = false;
  paintWall();
  paintFloor();
  const order = base.items.map((it, i) => ({ it, i }));
  const rank = ({ it }) => PIECES[it.id].layer === 'wall' ? -2 : PIECES[it.id].layer === 'rug' ? -1 : it.y + footprint(it)[1] + (it.up ? 0.5 : 0);
  order.sort((a, b) => rank(a) - rank(b));
  for (const { it } of order) paintPiece(it);
  if (sel >= 0) outline(base.items[sel], '#ffe060');
  if (holding && ghost) {
    const it = { ...holding, ...ghost };
    paintPiece(it, 0.6);
    outline(it, fits(it) ? '#60e080' : '#ff5050');
  }
}

function outline(it, colour) {
  const p = PIECES[it.id], [fw, fh] = footprint(it);
  const x = it.x * T, y = p.layer === 'wall' ? 4 : WALL + it.y * T, w = fw * T, h = p.layer === 'wall' ? 38 : fh * T;
  g.strokeStyle = colour; g.lineWidth = 1;
  g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

const cells = (it) => { const [fw, fh] = footprint(it), out = []; for (let i = 0; i < fw; i++) for (let j = 0; j < fh; j++) out.push(`${it.x + i},${it.y + j}`); return out; };

/** Whether a piece fits the room `b` (the 2D room's own by default), leaving out item `skip` (the one being moved). */
function fits(it, skip = -1, b = base) {
  const p = PIECES[it.id], [fw, fh] = footprint(it);
  if (it.x < 0 || it.x + fw > COLS) return false;
  if (it.up) {
    // on a table: a small piece, a table under it, and nothing else up on that tile
    if (!small(it.id) || surfaceUnder(it, b) < 0) return false;
    return b.items.every((o, i) => i === skip || !o.up || o.x !== it.x || o.y !== it.y);
  }
  if (p.layer === 'wall') return b.items.every((o, i) => i === skip || PIECES[o.id].layer !== 'wall' || o.x + PIECES[o.id].w <= it.x || it.x + fw <= o.x);
  if (it.y < 0 || it.y + fh > ROWS) return false;
  const mine = new Set(cells(it)), rug = p.layer === 'rug';
  return b.items.every((o, i) => {
    if (i === skip || o.up || PIECES[o.id].layer === 'wall' || (PIECES[o.id].layer === 'rug') !== rug) return true;
    return !cells(o).some(c => mine.has(c));
  });
}

/** Where a tap lands, in tiles (fractions allowed): the piece's footprint centred on it, pulled inside the room. */
function aimTile(id, dir, tx, ty) {
  const p = PIECES[id], [fw, fh] = dir % 2 ? [p.h, p.w] : [p.w, p.h];
  const x = Math.max(0, Math.min(COLS - fw, Math.floor(tx - (fw - 1) / 2)));
  if (p.layer === 'wall') return { x };
  return { x, y: Math.max(0, Math.min(ROWS - fh, Math.floor(ty - (fh - 1) / 2))) };
}
const aim = (id, dir, lx, ly) => aimTile(id, dir, lx / T, (ly - WALL) / T);

function pieceAt(lx, ly) {
  const tx = Math.floor(lx / T), ty = Math.floor((ly - WALL) / T);
  const hit = (it) => {
    if (PIECES[it.id].layer === 'wall') return ly < WALL && tx >= it.x && tx < it.x + PIECES[it.id].w;
    return ly >= WALL && cells(it).includes(`${tx},${ty}`);
  };
  const order = base.items.map((it, i) => i).filter(i => hit(base.items[i]));
  return order.find(i => PIECES[base.items[i].id].layer !== 'rug') ?? order[0] ?? -1;
}

const save = () => updateSave(d => { d.secretBase = base; });

function local(e) {
  const r = canvas.getBoundingClientRect();
  return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height];
}

function onTap(e) {
  const [lx, ly] = local(e);
  if (holding) {
    const it = standing({ ...holding, ...aim(holding.id, holding.dir, lx, ly) }, base);
    if (!fits(it)) { ghost = aim(holding.id, holding.dir, lx, ly); playSound('cancel'); clearTimeout(badGhost); badGhost = setTimeout(() => { ghost = null; paint(); }, 600); paint(); return; }
    delete it.back;
    base.items.push(PIECES[it.id].layer === 'wall' ? { id: it.id, x: it.x } : { id: it.id, x: it.x, y: it.y, dir: it.dir, ...(it.up ? { up: 1 } : {}) });
    holding = null; ghost = null;
    sel = base.items.length - 1;
    playSound('confirm');
    save();
  } else {
    sel = pieceAt(lx, ly);
    if (base.items[sel]?.id === 'gift') { openGift(base); sel = -1; playSound('item-get'); tray('furniture'); }
    else if (sel >= 0) playSound('confirm');
  }
  refresh();
}

function onMove(e) {
  if (!holding || e.pointerType !== 'mouse') return;
  const [lx, ly] = local(e);
  ghost = aim(holding.id, holding.dir, lx, ly);
  paint();
}

function act(kind) {
  const it = base.items[sel];
  if (!it) return;
  if (kind === 'rotate') {
    const turned = { ...it, dir: (it.dir + 1) % 4 };
    const [fw, fh] = footprint(turned);
    turned.x = Math.min(turned.x, COLS - fw); turned.y = Math.min(turned.y, ROWS - fh);
    if (fits(turned, sel)) { base.items[sel] = turned; save(); }
    else playSound('cancel');
  }
  if (kind === 'move') { holding = { ...it, back: it }; base.items.splice(sel, 1); sel = -1; ghost = null; }
  if (kind === 'store') { const gone = [it, ...ridersOf(it, base)]; base.items = base.items.filter(o => !gone.includes(o)); sel = -1; playSound('cancel'); save(); }
  if (kind === 'done') sel = -1;
  refresh();
}

function cancelHold() {
  if (holding?.back) base.items.push(holding.back);
  holding = null; ghost = null;
  refresh();
}

const icons = new Map();
/** A piece's tray picture: painted once, then copied, since a tray can list hundreds. */
function icon(id) {
  const made = icons.get(id);
  if (made) { const c = document.createElement('canvas'); c.width = made.width; c.height = made.height; c.getContext('2d').drawImage(made, 0, 0); return c; }
  // the piece's own picture, cropped to what's painted
  const art = PIECES[id].art(0, 2), d = art.getContext('2d').getImageData(0, 0, art.width, art.height).data;
  let x0 = art.width, y0 = art.height, x1 = 0, y1 = 0;
  for (let y = 0; y < art.height; y++) for (let x = 0; x < art.width; x++) if (d[(y * art.width + x) * 4 + 3] > 40) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const c = document.createElement('canvas');
  c.width = Math.max(1, x1 - x0 + 1); c.height = Math.max(1, y1 - y0 + 1);
  c.getContext('2d').drawImage(art, -x0, -y0);
  icons.set(id, c);
  return icon(id);
}

function tray(tab) {
  const list = document.getElementById('sb-list');
  list.replaceChildren();
  document.querySelectorAll('.sb-tab').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  const add = (label, art, on, pick) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'sb-item' + (on ? ' on' : '');
    b.append(art, Object.assign(document.createElement('span'), { textContent: label }));
    b.addEventListener('click', pick);
    list.append(b);
  };
  if (tab === 'furniture') for (const id of DESIGNS.filter(id => spare(base, id) > 0)) add(PIECES[id].name, icon(id), holding?.id === id && !holding.back, () => {
    if (holding?.back) cancelHold();
    holding = holding?.id === id ? null : { id, dir: 0 }; sel = -1; ghost = null;
    refresh(); tray(tab);
  });
  const swatch = (list2, key) => list2.filter(s => ownsPaper(base, key, s)).forEach(s => {
    const sw = document.createElement('span');
    sw.className = 'sb-swatch';
    sw.style.background = `repeating-linear-gradient(90deg, ${s.a} 0 6px, ${s.b} 6px 10px)`;
    add(s.name, sw, base[key] === s.id, () => { base[key] = s.id; save(); refresh(); tray(tab); });
  });
  if (tab === 'wall') swatch(WALLPAPERS, 'wall');
  if (tab === 'floor') swatch(FLOORS, 'floor');
}

function refresh() {
  paint();
  const bar = document.getElementById('sb-actions');
  bar.hidden = sel < 0 && !holding;
  bar.querySelectorAll('[data-act]').forEach(b => {
    const a = b.dataset.act, wall = sel >= 0 && PIECES[base.items[sel].id].layer === 'wall';
    b.hidden = holding ? a !== 'cancel' : a === 'cancel' || (a === 'rotate' && wall);
  });
  hint.textContent = holding ? `Tap where the ${PIECES[holding.id].name.toLowerCase()} goes.`
    : sel >= 0 ? PIECES[base.items[sel].id].name
    : 'Pick a piece below, then tap a spot in the room. Tap a piece in the room to rotate, move or store it.';
}

export function openBase() {
  base = loadBase();
  const root = document.createElement('section');
  root.className = 'secret-base';
  root.innerHTML = `
    <header class="sb-top"><h2>Secret Base</h2><button type="button" class="sb-close" aria-label="Leave">✕</button></header>
    <div class="sb-room"><canvas class="pixel" width="${W}" height="${H}"></canvas></div>
    <p class="sb-hint"></p>
    <div class="sb-actions" id="sb-actions" hidden>
      <button type="button" data-act="rotate">Rotate</button><button type="button" data-act="move">Move</button>
      <button type="button" data-act="store">Store</button><button type="button" data-act="done">Done</button>
      <button type="button" data-act="cancel">Cancel</button>
    </div>
    <nav class="sb-tabs">
      <button type="button" class="sb-tab" data-tab="furniture">Furniture</button>
      <button type="button" class="sb-tab" data-tab="wall">Wallpaper</button>
      <button type="button" class="sb-tab" data-tab="floor">Floor</button>
    </nav>
    <div class="sb-list" id="sb-list"></div>`;
  document.body.append(root);
  canvas = root.querySelector('canvas');
  hint = root.querySelector('.sb-hint');
  canvas.addEventListener('click', onTap);
  canvas.addEventListener('pointermove', onMove);
  root.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => b.dataset.act === 'cancel' ? cancelHold() || tray('furniture') : act(b.dataset.act)));
  root.querySelectorAll('.sb-tab').forEach(b => b.addEventListener('click', () => tray(b.dataset.tab)));
  root.querySelector('.sb-close').addEventListener('click', () => { location.href = location.pathname; });
  tray('furniture');
  refresh();
}
