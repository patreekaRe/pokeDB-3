/* base-furniture-rooms5.js  -  themed shelves, batch 5, the last on the road to 1,000 kinds (2026-10-08): the Desert,
   Hot Spring, Arcade, Greenhouse, Station and Sky Palace shelves, 25 kinds each (1,008 in all). Same kit and rules as
   js/base-furniture-rooms.js: painted at 32 pixels a tile with js/base-paint.js in the piece's theme palette `k`, outlined
   and rim-lit by `finish()`. Each shelf opens with a list that shares one body and differs by what's on it (hieroglyph
   tablets, folding screens, arcade cabinets by their game, terrariums, model trains, sky orbs). */

import { k, sh, R, P, clear, hash, panel, inset, wood, cushion, sphere, disc, oval, ovalShade, cyl, glass, leaf, foliage, tri,
  speckle, stamp, floorShadow, clipped } from './base-paint.js';
import { motif, ink, sideBox, shadowWall, potAt } from './base-furniture-kinds.js';
import { STONE, flower, ball } from './base-furniture-rooms.js';
import { line, ring } from './base-furniture-rooms3.js';
import { arc } from './base-furniture-rooms4.js';
import { view } from './base-paint-scenes.js';

export const ROOM_KINDS_5 = [];
const add = (group, list) => list.forEach(f => ROOM_KINDS_5.push({ group, ...f }));

const GOLD = '#f0c040', BRASS = '#d8a838', INK = '#303038', SAND = '#e0cc98', SANDST = '#d8b878', LAPIS = '#2a58b8',
  TURQ = '#38b8a8', CLAY = '#c8784a', WATER = '#58b0e0', SPRING = '#58b8b0', BAMBOO = '#a8c060', HINOKI = '#e0b880',
  CHROME = '#c8ccd8', GLASS = '#d8f0f8', MARBLE = '#ece8e0', CLOUD = '#eef2fc', MARQUEE = '#fff4c0';
const RAINBOW = ['#e04848', '#f08030', '#f8d030', '#58b848', '#4a98d8', '#5a58c8', '#a858d8'];
const NEON = ['#f858c8', '#58f0f8', '#f8f058', '#78f858'];
/** Little letters for signs (3x5). */
const LETTERS = { G: ['###', '#..', '#.#', '#.#', '###'], A: ['.#.', '#.#', '###', '#.#', '#.#'], M: ['#.#', '###', '###', '#.#', '#.#'],
  E: ['###', '#..', '##.', '#..', '###'], H: ['#.#', '#.#', '###', '#.#', '#.#'], I: ['###', '.#.', '.#.', '.#.', '###'],
  P: ['##.', '#.#', '##.', '#..', '#..'], O: ['###', '#.#', '#.#', '#.#', '###'], T: ['###', '.#.', '.#.', '.#.', '.#.'] };
const bitmap = (rows, x, y, c, s) => rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === '#') R(x + i * s, y + j * s, s, s, c); }));
const say = (text, x, y, c, s = 1) => [...text].forEach((ch, n) => bitmap(LETTERS[ch], x + n * 4 * s, y, c, s));
/** A bitmap turned a quarter clockwise. */
const turn = (rows) => [...rows[0]].map((_, i) => rows.map(r => r[i]).reverse().join(''));
/** A wheel seen side on: tyre, rim, spokes, hub. */
function rim(cx, cy, r, c) {
  disc(cx, cy, r, INK); disc(cx, cy, r - 1, c);
  if (r > 3) for (let a = 0; a < 4; a++) line(cx, cy, cx + Math.cos(a * 0.785) * (r - 1), cy + Math.sin(a * 0.785) * (r - 1), sh(c, -2));
  disc(cx, cy, Math.max(1, r * 0.3), CHROME);
}
/** A cloud: a row of puffs, rx wide and ry deep, lit from the top left. */
function puff(cx, cy, rx, ry, c = CLOUD) {
  const n = Math.max(3, Math.round(rx / 3));
  const at = (i) => { const t = i / (n - 1); return [cx - rx + ry * 0.6 + t * (rx - ry * 0.6) * 2, cy - Math.sin(t * Math.PI) * ry * 0.5, ry * (0.55 + Math.sin(t * Math.PI) * 0.45)]; };
  for (let i = 0; i < n; i++) { const [px, py, r] = at(i); disc(px, py, r, sh(c, -1)); }
  for (let i = 0; i < n; i++) { const [px, py, r] = at(i); disc(px - 0.5, py - 1, r - 1, c); }
  for (let i = 0; i < n; i++) { const [px, py, r] = at(i); disc(px - r * 0.3, py - r * 0.4, r * 0.35, sh(c, 1)); }
}
/** Specks inside an oval only (sand, gravel), so a round rug keeps clear corners. */
function speckOval(cx, cy, rx, ry, c, seed, d) {
  for (let j = -ry; j <= ry; j++) for (let i = -rx; i <= rx; i++) if ((i * i) / (rx * rx) + (j * j) / (ry * ry) < 1 && hash(i + 99, j + 99, seed) < d) P(cx + i, cy + j, c);
}

/* ---------- desert ---------- */
const GLYPHS = {
  eye: ['Eye', ['.........', '..#####..', '.#.....#.', '#..+++..#', '.#.+k+.#.', '..#####..', '....#....', '...#.##..', '..#...#..']],
  ankh: ['Ankh', ['...###...', '..#...#..', '..#...#..', '...#.#...', '#########', '....#....', '....#....', '....#....', '...###...']],
  scarab: ['Scarab', ['#..+++..#', '.#.+++.#.', '..#####..', '.##+#+##.', '#.##+##.#', '.###+###.', '#.##+##.#', '..#####..', '...#.#...']],
  falcon: ['Falcon', ['...##....', '..####...', '..#k###..', '...+####.', '..######.', '.########', '#######..', '...###...', '...#.#...']],
  sun: ['Sun', ['...+++...', '.+#####+.', '.##+++##.', '###+++###', '.##+++##.', '.#######.', '#..###..#', '.#.....#.', '..#...#..']],
  lotus: ['Lotus', ['....#....', '...#+#...', '.#.#+#.#.', '.##+++##.', '#.#+++#.#', '.#######.', '...###...', '....#....', '....#....']],
};
add('Desert', Object.entries(GLYPHS).map(([id, [name, rows]]) => ({ id: `${id}tablet`, name: `${name} tablet`, w: 1, h: 1, layer: 'wall', price: 260,
  wall(x) {
    shadowWall(x + 3, 12, 26, 46); panel(x + 3, 12, 26, 46, SANDST, 2); inset(x + 6, 15, 20, 40, sh(SANDST, -1));
    speckle(x + 6, 15, 20, 40, sh(SANDST, -2), 7, 0.05); R(x + 6, 16, 20, 2, k.c); R(x + 6, 52, 20, 2, k.c);
    stamp(rows, x + 7, 20, { '#': LAPIS, '+': GOLD, k: INK }, 2);
    for (let n = 0; n < 4; n++) R(x + 8 + n * 4, 42 + (n % 2) * 3, 3, 3, n % 2 ? k.c : LAPIS);
    for (let n = 0; n < 5; n++) P(x + 8 + n * 4, 49, sh(SANDST, -2));
  } })));
/** A pharaoh's striped headdress and face, its top at `top`. */
function nemes(cx, top) {
  for (let j = 0; j < 26; j++) { const h = j < 6 ? 5 + j : Math.min(13, 10 + (j - 6) * 0.25); R(cx - h, top + j, h * 2, 1, j % 3 === 0 ? LAPIS : GOLD); }
  panel(cx - 5, top + 4, 10, 15, SANDST); R(cx - 6, top + 2, 12, 2, GOLD); disc(cx, top + 1, 1.5, k.c);
  for (const s of [-3, 2]) { R(cx + s, top + 9, 2, 1, INK); P(cx + s, top + 8, LAPIS); }
  R(cx - 1, top + 12, 2, 2, sh(SANDST, -1)); R(cx - 2, top + 16, 4, 1, sh(SANDST, -2)); cyl(cx - 2, top + 19, 4, 6, sh(SANDST, -1));
}
/** A palm's crown seen from above. */
function crownTop(cx, cy, r) {
  for (let n = 0; n < 8; n++) { const a = n / 8 * Math.PI * 2 + 0.3; line(cx, cy, cx + Math.cos(a) * r, cy + Math.sin(a) * r, n % 2 ? k.leaf : sh(k.leaf, 1), 2); }
  disc(cx, cy, 2, '#8a5a30');
}
add('Desert', [
  { id: 'pyramid', name: 'Pyramid model', w: 1, h: 1, price: 620, draw(x, b) {
    floorShadow(x, b, 32); panel(x + 1, b - 7, 30, 7, k.w);
    for (let j = 0; j < 32; j++) {
      const h = Math.round(j * 0.44) + 1, y = b - 39 + j, step = j % 4 === 3;
      R(x + 16 - h, y, h, 1, step ? sh(SANDST, -2) : SANDST); R(x + 16, y, h, 1, step ? sh(SANDST, -3) : sh(SANDST, -1));
    }
    tri(x + 16, b - 42, 5, GOLD, 0.6); P(x + 15, b - 41, sh(GOLD, 2)); R(x + 14, b - 13, 4, 6, INK);
  } },
  { id: 'obelisk', name: 'Obelisk', w: 1, h: 1, price: 700, draw(x, b) {
    floorShadow(x + 3, b, 26); panel(x + 5, b - 9, 22, 9, sh(SANDST, -1));
    for (let j = 0; j < 72; j++) { const h = Math.round(7 - j * 0.035), y = b - 9 - j; R(x + 16 - h, y, h, 1, SANDST); R(x + 16, y, h, 1, sh(SANDST, -1)); }
    tri(x + 16, b - 89, 8, GOLD, 0.6); for (let j = 0; j < 8; j++) R(x + 16, b - 89 + j, Math.floor(j * 0.6) + 1, 1, sh(GOLD, -1));
    for (let n = 0; n < 7; n++) { const y = b - 76 + n * 9; R(x + 12, y, 3, 3, n % 2 ? k.c : LAPIS); R(x + 17, y + 4, 3, 2, n % 2 ? LAPIS : k.c); P(x + 13, y + 5, INK); }
  } },
  { id: 'sphinx', name: 'Sphinx statue', w: 2, h: 1, price: 1400, draw(x, b, vw, dir) {
    if (dir % 2) { floorShadow(x + 2, b, 28); panel(x + 3, b - 10, 26, 10, sh(SANDST, -1)); ovalShade(x + 16, b - 22, 11, 10, SANDST); nemes(x + 16, b - 56); return; }
    floorShadow(x, b, vw); panel(x + 1, b - 10, vw - 2, 10, sh(SANDST, -1)); R(x + 3, b - 8, vw - 6, 1, SANDST);
    ovalShade(x + vw / 2 + 8, b - 22, vw / 2 - 12, 11, SANDST); R(x + vw / 2 - 6, b - 18, vw / 2, 8, SANDST);
    cushion(x + 3, b - 17, 24, 7, SANDST, 2); for (const i of [4, 8, 12]) P(x + i, b - 11, sh(SANDST, -2));
    line(x + vw - 6, b - 12, x + vw - 3, b - 28, SANDST, 2); disc(x + vw - 3, b - 29, 2, sh(SANDST, -1));
    nemes(x + 18, b - 58);
  } },
  { id: 'sarcophagus', name: 'Sarcophagus', w: 1, h: 1, price: 1100, draw(x, b) {
    const FACE = '#d8a058';
    floorShadow(x + 2, b, 28); panel(x + 4, b - 6, 24, 6, sh(SANDST, -1)); cushion(x + 6, b - 66, 20, 60, GOLD, 6);
    for (let n = 0; n < 6; n++) R(x + 7, b - 40 + n * 6, 18, 2, n % 2 ? LAPIS : k.c);
    R(x + 7, b - 50, 18, 6, LAPIS); for (let i = 8; i < 24; i += 2) P(x + i, b - 48, GOLD);
    line(x + 8, b - 56, x + 24, b - 46, sh(GOLD, -1), 2); line(x + 24, b - 56, x + 8, b - 46, sh(GOLD, 1), 2);
    for (let j = 0; j < 22; j++) { const h = j < 5 ? 6 + j : 11; R(x + 16 - h, b - 88 + j, h * 2, 1, j % 3 === 1 ? LAPIS : GOLD); }
    ovalShade(x + 16, b - 76, 6, 8, FACE); R(x + 10, b - 85, 12, 3, GOLD);
    for (const s of [-4, 1]) { R(x + 16 + s, b - 78, 3, 1, INK); R(x + 16 + s, b - 79, 3, 1, LAPIS); }
    R(x + 15, b - 74, 2, 2, sh(FACE, -1)); R(x + 14, b - 71, 4, 1, sh(FACE, -2)); cyl(x + 14, b - 68, 4, 6, LAPIS);
  } },
  { id: 'canopicjars', name: 'Canopic jars', w: 1, h: 1, price: 480, draw(x, b) {
    const ALAB = '#e8dcc0';
    floorShadow(x, b, 32); wood(x + 1, b - 7, 30, 7, k.w);
    [[5, GOLD, 'man'], [12, '#a8784a', 'ape'], [19, INK, 'jackal'], [26, k.c, 'falcon']].forEach(([i, c, kind]) => {
      const cx = x + i;
      ovalShade(cx, b - 15, 3.5, 8, ALAB); R(cx - 3, b - 22, 7, 2, sh(ALAB, -1)); R(cx - 2, b - 13, 5, 1, LAPIS); R(cx - 2, b - 16, 5, 1, k.c);
      if (kind === 'man') R(cx - 3, b - 27, 7, 5, LAPIS);
      if (kind === 'jackal') { R(cx - 3, b - 32, 2, 5, c); R(cx + 2, b - 32, 2, 5, c); }
      disc(cx, b - 26, 3, c);
      if (kind === 'jackal') R(cx + 1, b - 26, 3, 2, c);
      if (kind === 'falcon') R(cx + 3, b - 26, 2, 2, GOLD);
      P(cx - 1, b - 27, kind === 'jackal' ? GOLD : INK);
    });
  } },
  { id: 'papyrus', name: 'Papyrus', w: 1, h: 1, price: 260, draw(x, b) {
    floorShadow(x + 4, b, 24); const top = potAt(x, b, 'square');
    [[8, 30], [16, 0], [24, 30], [11, 14], [21, 12]].forEach(([i, drop], n) => {
      const tx = x + i, ty = b - 80 + drop + n * 2;
      line(x + 16 + (i - 16) * 0.3, top, tx, ty, sh(k.leaf, -1));
      for (let r = 0; r < 9; r++) { const a = -Math.PI / 2 + (r - 4) * 0.32; line(tx, ty, tx + Math.cos(a) * 7, ty + Math.sin(a) * 6, r % 2 ? k.leaf : sh(k.leaf, 1)); }
      P(tx, ty, sh(k.leaf, -2));
    });
  } },
  { id: 'datepalm', name: 'Date palm', w: 1, h: 1, price: 520, draw(x, b) {
    floorShadow(x + 2, b, 28); const top = potAt(x, b);
    for (let y = b - 70; y < top; y++) { const wv = Math.round(Math.sin(y / 11) * 1.5); R(x + 14 + wv, y, 5, 1, y % 4 < 2 ? sh(k.w, -1) : k.w); P(x + 14 + wv + ((y >> 2) % 2 ? 4 : 0), y, sh(k.w, -2)); }
    const cx = x + 16, cy = b - 72;
    for (let n = 0; n < 9; n++) {
      const a = Math.PI * (1.05 + n / 8 * 0.9);
      for (let s = 2; s < 15; s++) { const px = cx + Math.cos(a) * s, py = cy + Math.sin(a) * s * 0.7 + s * s * 0.06; R(px, py - 1, 2, 2, s % 3 ? k.leaf : sh(k.leaf, 1)); P(px + (n < 4 ? -1 : 1), py + 1, sh(k.leaf, -1)); }
    }
    for (const [i, j] of [[12, -66], [20, -65]]) for (let d = 0; d < 7; d++) disc(x + i + (d % 3) - 1, b + j + Math.floor(d / 3) * 2, 1.2, d % 2 ? '#a85a20' : '#c87a30');
  } },
  { id: 'oasis', name: 'Oasis', w: 2, h: 2, layer: 'rug', price: 900, high: 0.03, side: 'p', flat(w, h) {
    oval(w / 2, h / 2, w / 2 - 1, h / 2 - 1, sh(SAND, -1)); oval(w / 2, h / 2, w / 2 - 2, h / 2 - 2, SAND); speckOval(w / 2, h / 2, w / 2 - 3, h / 2 - 3, sh(SAND, -1), 21, 0.08);
    oval(w / 2, h / 2 + 2, w / 2 - 10, h / 2 - 12, sh(WATER, -1)); oval(w / 2, h / 2 + 2, w / 2 - 12, h / 2 - 14, WATER);
    for (const [i, j, l] of [[22, 30, 8], [36, 38, 6], [26, 44, 5]]) R(i, j, l, 1, sh(WATER, 2));
    oval(40, 32, 3, 2, k.leaf); flower(40, 31, k.c);
    for (const [i, j] of [[14, 24], [50, 26], [18, 48], [46, 50]]) for (let n = 0; n < 4; n++) R(i + n * 2 - 3, j - (n % 2) * 3 - 2, 1, 4, n % 2 ? k.leaf : sh(k.leaf, 1));
    crownTop(13, 13, 9); crownTop(52, 15, 8);
  } },
  { id: 'dunerug', name: 'Dune rug', w: 2, h: 2, layer: 'rug', price: 280, high: 0.04, side: 'c', flat(w, h) {
    R(0, 0, w, h, sh(k.c, -1)); R(2, 2, w - 4, h - 4, SAND);
    disc(w - 14, 13, 6, GOLD); disc(w - 15, 12, 4, sh(GOLD, 1));
    for (let i = 2; i < w - 2; i++) for (let s = 0; s < 4; s++) {
      const y = 16 + s * 12 + Math.round(Math.sin(i / 9 + s * 1.7) * 4);
      R(i, y, 1, 2, s % 2 ? k.c : sh(k.c, 1)); R(i, y + 2, 1, 3, sh(SAND, -1));
    }
    for (let i = 1; i < w; i += 3) { R(i, 0, 1, 2, k.a); R(i, h - 2, 1, 2, k.a); }
  } },
  { id: 'pharaohthrone', name: "Pharaoh's throne", w: 1, h: 1, price: 1200, seat: 'cushion', draw(x, b) {
    floorShadow(x, b, 32);
    for (const i of [3, 25]) { cyl(x + i, b - 20, 4, 18, GOLD); R(x + i - 1, b - 3, 6, 3, sh(GOLD, -1)); P(x + i, b - 2, INK); P(x + i + 3, b - 2, INK); }
    panel(x + 5, b - 76, 22, 56, GOLD, 2); inset(x + 8, b - 72, 16, 46, LAPIS);
    for (let j = 0; j < 46; j += 4) R(x + 8, b - 72 + j, 16, 1, sh(LAPIS, 1));
    for (const s of [-1, 1]) line(x + 16 + s * 4, b - 64, x + 16 + s * 7, b - 60, GOLD, 2);
    disc(x + 16, b - 64, 4, sh(GOLD, -1)); disc(x + 16, b - 64, 3, '#d84838');
    panel(x + 2, b - 26, 28, 7, GOLD); cushion(x + 4, b - 31, 24, 7, k.c, 2);
    for (const i of [1, 27]) { panel(x + i, b - 40, 4, 16, GOLD); disc(x + i + 2, b - 42, 2.5, sh(GOLD, -1)); P(x + i + 1, b - 43, INK); }
  } },
  { id: 'scarablamp', name: 'Scarab lamp', w: 1, h: 1, price: 420, glow: ['#ffe490', '#fff6d0'], draw(x, b) {
    floorShadow(x + 4, b, 24); panel(x + 8, b - 6, 16, 6, GOLD);
    for (const s of [-1, 1]) for (let n = 0; n < 3; n++) line(x + 16 + s * 8, b - 18 + n * 4, x + 16 + s * 12, b - 16 + n * 4, INK);
    ovalShade(x + 16, b - 16, 9, 9, TURQ); R(x + 15, b - 24, 2, 16, sh(TURQ, -2));
    oval(x + 16, b - 26, 5, 3, sh(TURQ, -1)); for (const s of [-1, 1]) line(x + 16 + s * 3, b - 28, x + 16 + s * 8, b - 34, INK);
    disc(x + 16, b - 42, 10, '#ffe490'); disc(x + 14, b - 44, 6, '#fff6d0'); ring(x + 16, b - 42, 10, GOLD);
  } },
  { id: 'brasslantern', name: 'Brass lantern', w: 1, h: 1, layer: 'wall', price: 300, glow: ['#ffd070', '#fff0b0'], wall(x) {
    for (let j = 0; j < 14; j += 3) R(x + 15, j, 2, 2, BRASS);
    for (let j = 0; j < 8; j++) R(x + 14 - j, 14 + j, 4 + j * 2, 1, j % 2 ? BRASS : sh(BRASS, -1));
    for (let j = 0; j < 24; j++) { const h = Math.round(9 + Math.sin(j / 23 * Math.PI) * 3); R(x + 16 - h, 22 + j, h * 2, 1, BRASS); P(x + 16 - h, 22 + j, sh(BRASS, 1)); P(x + 15 + h, 22 + j, sh(BRASS, -1)); }
    for (let j = 0; j < 4; j++) for (let i = 0; i < 5; i++) { const px = x + 9 + i * 3 + (j % 2), py = 25 + j * 5; P(px, py, '#ffd070'); P(px, py + 1, '#fff0b0'); }
    for (let j = 0; j < 6; j++) R(x + 7 + j, 46 + j, 18 - j * 2, 1, sh(BRASS, -1));
    R(x + 15, 52, 2, 4, BRASS); disc(x + 16, 57, 1.5, BRASS);
  } },
  { id: 'bedouintent', name: 'Desert tent', w: 2, h: 1, price: 1300, draw(x, b, vw, dir) {
    floorShadow(x, b, vw);
    const stripe = (i) => (Math.floor(i / 6) % 2 ? k.c : sh(k.p, -1));
    if (dir % 2) { for (let i = 2; i < vw - 2; i++) { const top = b - 58 + Math.abs(i - vw / 2) * 1.4; R(x + i, top, 1, b - top, stripe(i)); } return; }
    R(x + 6, b - 50, vw - 12, 50, sh(k.c, -2));
    for (let i = 0; i < vw; i++) {
      const d = Math.abs(((i % (vw / 2)) - vw / 4) / (vw / 4)), top = b - 62 + Math.round((1 - d * d) * 6), c = stripe(i);
      R(x + i, top, 1, 10, c); P(x + i, top + 10, sh(c, -1)); if (i % 4 === 0) P(x + i, top + 11, k.a);
    }
    for (const s of [0, 1]) for (let j = 0; j < 40; j++) { const wdt = Math.round(12 - j * 0.22); R(s ? x + vw - 3 - wdt : x + 3, b - 51 + j, wdt, 1, stripe(j + s * 6)); }
    for (const i of [1, vw / 2 - 1, vw - 3]) cyl(x + i, b - 62, 3, 62, k.w);
    R(x + 14, b - 6, vw - 28, 6, k.a); for (let i = x + 15; i < x + vw - 14; i += 3) P(i, b - 4, sh(k.a, -2));
    cushion(x + 16, b - 16, 12, 10, k.c, 3); cushion(x + vw - 28, b - 16, 12, 10, sh(k.p, -1), 3);
    oval(x + vw / 2, b - 10, 6, 2, BRASS); cyl(x + vw / 2 - 1, b - 15, 3, 5, sh(BRASS, -1));
    line(x + vw / 2 + 4, b - 54, x + vw / 2 + 4, b - 44, BRASS); disc(x + vw / 2 + 4, b - 41, 3, '#ffd070');
  } },
  { id: 'waterjar', name: 'Water jar', w: 1, h: 1, price: 300, draw(x, b) {
    floorShadow(x + 2, b, 28); for (const [i0, i1] of [[4, 10], [28, 22], [16, 16]]) line(x + i0, b, x + i1, b - 22, k.w, 2);
    ovalShade(x + 16, b - 32, 12, 14, CLAY); R(x + 6, b - 34, 20, 2, k.c); R(x + 6, b - 30, 20, 1, sh(CLAY, -2));
    for (let i = 0; i < 6; i++) P(x + 8 + i * 3, b - 37, k.a);
    cyl(x + 11, b - 50, 10, 6, CLAY); oval(x + 16, b - 50, 6, 2, sh(CLAY, -2)); oval(x + 16, b - 50, 4, 1, '#3a6aa8');
    line(x + 20, b - 52, x + 26, b - 62, k.w, 2); oval(x + 26, b - 63, 2, 1, k.w);
  } },
  { id: 'featherfan', name: 'Feather fan', w: 1, h: 1, price: 380, draw(x, b) {
    floorShadow(x + 6, b, 20); panel(x + 10, b - 5, 12, 5, GOLD); cyl(x + 15, b - 60, 3, 56, GOLD);
    for (let j = b - 54; j < b - 6; j += 8) R(x + 14, j, 5, 2, LAPIS);
    for (let n = 0; n < 7; n++) {
      const a = Math.PI * (1.15 + n / 6 * 0.7), ex = x + 16 + Math.cos(a) * 14, ey = b - 62 + Math.sin(a) * 24, c = n % 2 ? k.c : k.p;
      line(x + 16, b - 60, ex, ey, c);
      for (let s = 0.3; s < 1; s += 0.08) disc(x + 16 + (ex - x - 16) * s, b - 60 + (ey - b + 60) * s, 1 + s * 2, c);
      disc(ex, ey, 2, sh(c, -1));
    }
    disc(x + 16, b - 60, 3, GOLD);
  } },
  { id: 'cobrastatue', name: 'Cobra statue', w: 1, h: 1, price: 680, draw(x, b) {
    floorShadow(x + 2, b, 28); panel(x + 4, b - 10, 24, 10, sh(SANDST, -1)); R(x + 5, b - 9, 22, 1, SANDST);
    oval(x + 16, b - 14, 11, 4, GOLD); oval(x + 16, b - 15, 8, 3, sh(GOLD, 1)); oval(x + 16, b - 15, 5, 2, GOLD);
    for (let j = 0; j < 30; j++) { const cx = x + 16 + Math.round(Math.sin(j / 7) * 3); R(cx - 3, b - 18 - j, 6, 1, j % 4 < 2 ? GOLD : sh(GOLD, -1)); R(cx - 1, b - 18 - j, 2, 1, j % 3 ? LAPIS : sh(LAPIS, 1)); }
    for (let j = 0; j < 22; j++) { const h = Math.round(Math.sin(j / 21 * Math.PI) * 9) + 2; R(x + 16 - h, b - 66 + j, h * 2, 1, GOLD); R(x + 16 - Math.floor(h / 2), b - 66 + j, h, 1, j % 3 ? LAPIS : k.c); }
    ovalShade(x + 16, b - 70, 5, 4, GOLD); P(x + 14, b - 71, '#e04848'); P(x + 18, b - 71, '#e04848'); R(x + 16, b - 66, 1, 3, '#e04848');
  } },
  { id: 'lotuscolumn', name: 'Lotus column', w: 1, h: 1, price: 760, draw(x, b) {
    floorShadow(x + 2, b, 28); panel(x + 3, b - 6, 26, 6, sh(SANDST, -1));
    cyl(x + 7, b - 72, 18, 66, SANDST); for (const i of [11, 15, 19]) R(x + i, b - 62, 1, 50, sh(SANDST, -1));
    for (let j = b - 66; j < b - 8; j += 12) { R(x + 7, j, 18, 2, k.c); R(x + 7, j + 3, 18, 1, LAPIS); }
    for (let j = 0; j < 18; j++) { const h = Math.round(9 + Math.sin(j / 17 * Math.PI) * 4) - (j < 4 ? 4 - j : 0); for (let i = -h; i < h; i++) P(x + 16 + i, b - 90 + j, ((i + 20) >> 2) % 2 ? k.leaf : LAPIS); }
    panel(x + 5, b - 73, 22, 3, SANDST);
  } },
  { id: 'goldurn', name: 'Treasure urn', w: 1, h: 1, price: 900, draw(x, b) {
    floorShadow(x, b, 32);
    for (let n = 0; n < 14; n++) { const cx = x + 4 + hash(n, 5) * 24, cy = b - 2 - hash(n, 6) * 5; oval(cx, cy, 2.5, 1.2, n % 3 ? GOLD : sh(GOLD, -1)); P(cx - 1, cy - 1, sh(GOLD, 2)); }
    for (const s of [-1, 1]) ring(x + 16 + s * 11, b - 30, 3, sh(GOLD, -1));
    ovalShade(x + 16, b - 20, 11, 13, GOLD); R(x + 6, b - 22, 20, 3, LAPIS); for (let i = 7; i < 26; i += 3) P(x + i, b - 21, k.c);
    cyl(x + 11, b - 40, 10, 8, GOLD); oval(x + 16, b - 40, 7, 2, sh(GOLD, 1)); oval(x + 16, b - 40, 5, 1, sh(GOLD, -2));
    for (let n = 0; n < 6; n++) disc(x + 13 + (n % 3) * 3, b - 43 - Math.floor(n / 3) * 2, 1.5, n % 2 ? GOLD : sh(GOLD, 1));
    disc(x + 22, b - 44, 2, k.c); P(x + 21, b - 45, '#ffffff');
  } },
  { id: 'sundisc', name: 'Winged sun', w: 2, h: 1, layer: 'wall', price: 640, wall(x) {
    for (const s of [-1, 1]) for (let r = 0; r < 4; r++) for (let i = 0; i < 22 - r * 3; i++) {
      const px = x + 32 + s * (8 + i) - (s < 0 ? 1 : 0), py = 24 + r * 5 + Math.round(i * i / 80), c = r % 2 ? LAPIS : k.c;
      R(px, py, 1, 4, c); P(px, py, sh(c, 1));
    }
    for (const s of [-1, 1]) { R(x + 31 + s * 10, 26, 2, 12, GOLD); disc(x + 32 + s * 10, 25, 2, GOLD); P(x + 32 + s * 10, 24, INK); }
    disc(x + 32, 30, 9, sh(GOLD, -1)); disc(x + 31, 29, 8, GOLD); disc(x + 29, 27, 3, sh(GOLD, 2));
  } },
]);

/* ---------- hot spring ---------- */
/** A folding screen of four gold-leaf panels with a picture painted across them. */
function byobu(x, b, vw, pic) {
  floorShadow(x, b, vw);
  const top = b - 70, H = 64, pw = (vw - 4) / 4;
  clipped(x + 2, top, vw - 4, H, () => {
    R(x + 2, top, vw - 4, H, GOLD); speckle(x + 2, top, vw - 4, H, sh(GOLD, 1), 5, 0.06);
    oval(x + 14, top + 8, 10, 2, sh(GOLD, 1)); oval(x + vw - 18, top + 44, 12, 2, sh(GOLD, 1));
    pic(x + 2, top, vw - 4, H);
  });
  for (let p = 0; p < 4; p++) { const px = Math.round(x + 2 + p * pw); if (p % 2) R(px, top, Math.round(pw), H, 'rgba(0,0,0,0.14)'); }
  R(x + 1, top - 2, vw - 2, 2, k.w); R(x + 1, top + H, vw - 2, 3, k.w);
  for (let p = 0; p <= 4; p++) R(Math.min(x + vw - 3, x + 1 + p * pw), top - 2, 2, H + 5, k.w);
  for (const i of [3, vw - 7]) R(x + i, b - 3, 4, 3, sh(k.w, -1));
}
const SCREENS = {
  wave: ['Wave', (x, y, w, h) => {
    for (let r = 0; r < 4; r++) for (let i = 0; i < w; i++) {
      const crest = y + 30 + r * 9 + Math.round(Math.sin(i / 6 + r * 1.3) * 3), c = r % 2 ? '#2a5aa8' : '#3a78c8';
      R(x + i, crest, 1, h, c); P(x + i, crest, '#f4f8ff'); if ((i + r * 5) % 12 === 0) disc(x + i, crest - 1, 1.5, '#f4f8ff');
    }
  }],
  crane: ['Crane', (x, y, w, h) => {
    line(x, y + h - 10, x + 22, y + h - 26, '#5a3a24', 3); foliage(x + 10, y + h - 26, 7, '#3a7a3a', 2); foliage(x + 24, y + h - 30, 6, '#3a7a3a', 3);
    oval(x + 38, y + 26, 9, 4, '#ffffff'); line(x + 30, y + 24, x + 16, y + 10, '#ffffff', 3); line(x + 44, y + 24, x + 56, y + 8, '#f0f0f0', 3);
    line(x + 46, y + 26, x + 52, y + 32, INK); line(x + 30, y + 27, x + 24, y + 31, '#ffffff', 2); disc(x + 23, y + 31, 1.5, '#e04848'); P(x + 21, y + 32, INK);
    line(x + 40, y + 30, x + 46, y + 40, INK);
  }],
  plum: ['Plum', (x, y, w, h) => {
    line(x, y + h - 6, x + 18, y + 34, '#3a2418', 4); line(x + 18, y + 34, x + 34, y + 30, '#3a2418', 3); line(x + 34, y + 30, x + 52, y + 12, '#3a2418', 2); line(x + 18, y + 34, x + 22, y + 14, '#3a2418', 2);
    for (const [i, j] of [[16, 30], [24, 28], [30, 34], [36, 26], [44, 20], [50, 14], [22, 18], [20, 40], [40, 32], [10, 46]]) { disc(x + i, y + j, 2.5, '#f8a8c8'); P(x + i, y + j, '#f8e070'); }
  }],
  mountain: ['Mountain', (x, y, w, h) => {
    disc(x + w - 12, y + 14, 6, '#e04838');
    tri(x + 28, y + 18, 40, '#5a78b8', 1.1); tri(x + 28, y + 18, 10, '#ffffff', 1.1); for (let i = -9; i < 10; i += 3) R(x + 28 + i, y + 27, 2, 3, '#ffffff');
    oval(x + 18, y + 46, 16, 3, '#ffffff'); oval(x + 44, y + 52, 14, 2, '#ffffff');
  }],
  moon: ['Moon', (x, y, w, h) => {
    disc(x + 40, y + 20, 12, '#f8f4e0'); disc(x + 37, y + 17, 4, '#fffcf0');
    for (let n = 0; n < 12; n++) { const bx = x + 4 + n * 5, lean = (n % 3 - 1) * 4; line(bx, y + h, bx + lean, y + h - 22 - (n * 7) % 14, '#b8a060'); R(bx + lean - 1, y + h - 24 - (n * 7) % 14, 2, 4, '#e8d8a0'); }
  }],
  fan: ['Fan', (x, y, w, h) => {
    for (const [cx, cy, r, c] of [[16, 40, 14, k.c], [40, 28, 14, '#4a88d8'], [36, 54, 12, '#e04848']]) {
      for (let n = 0; n < 9; n++) { const a = Math.PI * (1 + n / 8); line(x + cx, y + cy, x + cx + Math.cos(a) * r, y + cy + Math.sin(a) * r, n % 2 ? c : sh(c, 1), 2); }
      arc(x + cx, y + cy, r, r, Math.PI, Math.PI * 2, sh(c, -1)); P(x + cx, y + cy, INK);
    }
  }],
};
add('Hot Spring', Object.entries(SCREENS).map(([id, [name, pic]]) => ({ id: `${id}byobu`, name: `${name} screen`, w: 2, h: 1, price: 900,
  draw(x, b, vw, dir) { if (dir % 2) return sideBox(x, b, vw, 70); byobu(x, b, vw, pic); } })));
add('Hot Spring', [
  { id: 'onsenpool', name: 'Hot spring', w: 2, h: 2, price: 1600, high: 0.12, side: 'm', flat(w, h) {
    oval(w / 2, h / 2, w / 2 - 1, h / 2 - 1, sh(STONE, -1));
    for (let n = 0; n < 22; n++) { const a = n / 22 * Math.PI * 2; ovalShade(w / 2 + Math.cos(a) * (w / 2 - 7), h / 2 + Math.sin(a) * (h / 2 - 7), 5 + hash(n, 1) * 2, 4 + hash(n, 2) * 2, hash(n, 3) < 0.5 ? STONE : sh(STONE, 1)); }
    oval(w / 2, h / 2, w / 2 - 11, h / 2 - 11, sh(SPRING, -1)); oval(w / 2, h / 2 + 1, w / 2 - 12, h / 2 - 12, SPRING);
    for (const r of [4, 8, 12]) arc(w / 2 + 3, h / 2 - 2, r, r * 0.7, 0.3, 2.4, sh(SPRING, 1));
    for (let n = 0; n < 40; n++) { const a = hash(n, 7) * Math.PI * 2, d = hash(n, 8) * 16; P(w / 2 + Math.cos(a) * d, h / 2 + Math.sin(a) * d, '#e8f4f8'); }
    disc(w - 14, h - 14, 4, HINOKI); disc(w - 14, h - 14, 2.5, sh(HINOKI, -1));
  } },
  { id: 'shishiodoshi', name: 'Bamboo fountain', w: 1, h: 1, price: 420, draw(x, b) {
    floorShadow(x, b, 32); for (let n = 0; n < 5; n++) ovalShade(x + 5 + n * 5.5, b - 4 - (n % 2) * 2, 4, 3, STONE);
    oval(x + 23, b - 9, 7, 2, sh(STONE, -1)); oval(x + 23, b - 9, 5, 1, WATER);
    for (const i of [8, 15]) { cyl(x + i, b - 30, 3, 26, BAMBOO); R(x + i, b - 20, 3, 1, sh(BAMBOO, -1)); }
    R(x + 7, b - 27, 12, 2, sh(BAMBOO, -1));
    line(x + 3, b - 36, x + 26, b - 22, BAMBOO, 3); R(x + 26, b - 23, 2, 3, sh(BAMBOO, -2));
    cyl(x + 2, b - 58, 3, 22, BAMBOO); line(x + 3, b - 56, x + 9, b - 52, BAMBOO, 2); R(x + 10, b - 50, 1, 8, WATER);
  } },
  { id: 'okebucket', name: 'Bath buckets', w: 1, h: 1, price: 220, draw(x, b) {
    floorShadow(x, b, 32);
    const tub = (cx, bb, r, hgt) => {
      for (let j = 0; j < hgt; j++) { const hw = r - j * 0.08; R(cx - hw, bb - hgt + j, hw * 2, 1, HINOKI); }
      for (let i = -r + 2; i < r - 1; i += 3) R(cx + i, bb - hgt, 1, hgt, sh(HINOKI, -1));
      R(cx - r, bb - hgt + 2, r * 2, 2, k.m); R(cx - r + 1, bb - 4, r * 2 - 2, 2, k.m);
      oval(cx, bb - hgt, r, 2, sh(HINOKI, 1)); oval(cx, bb - hgt, r - 2, 1, sh(HINOKI, -2));
    };
    tub(x + 9, b, 8, 12); tub(x + 23, b, 8, 12); tub(x + 16, b - 12, 8, 12);
    cushion(x + 9, b - 30, 14, 5, k.c, 2);
  } },
  { id: 'yukatarack', name: 'Yukata rack', w: 1, h: 1, price: 460, draw(x, b) {
    floorShadow(x, b, 32); for (const i of [2, 27]) { cyl(x + i, b - 76, 3, 76, BAMBOO); R(x + i - 2, b - 3, 7, 3, sh(BAMBOO, -1)); }
    cyl(x + 1, b - 75, 30, 3, BAMBOO); R(x + 4, b - 30, 24, 2, sh(BAMBOO, -1));
    R(x + 4, b - 72, 24, 12, k.c); R(x + 9, b - 60, 14, 32, k.c); R(x + 4, b - 61, 5, 1, sh(k.c, -1)); R(x + 23, b - 61, 5, 1, sh(k.c, -1));
    for (let j = 0; j < 44; j += 4) for (let i = 0; i < 24; i += 4) if (j > 12 ? i >= 5 && i < 19 : true) P(x + 5 + i + (j % 8 ? 2 : 0), b - 70 + j, k.p);
    line(x + 12, b - 72, x + 16, b - 60, k.p, 2); line(x + 20, b - 72, x + 16, b - 60, k.p, 2);
    R(x + 9, b - 50, 14, 6, k.a); R(x + 9, b - 50, 14, 1, sh(k.a, 1)); R(x + 14, b - 51, 4, 8, sh(k.a, -1));
  } },
  { id: 'massagechair', name: 'Massage chair', w: 1, h: 1, price: 1200, seat: 'cushion', draw(x, b) {
    floorShadow(x, b, 32); panel(x + 3, b - 12, 26, 12, k.m);
    cushion(x + 5, b - 72, 22, 48, k.c, 6); for (let j = 0; j < 4; j++) for (const i of [12, 20]) disc(x + i, b - 62 + j * 9, 2, sh(k.c, -1));
    cushion(x + 6, b - 80, 20, 9, sh(k.c, 1), 4);
    cushion(x + 3, b - 26, 26, 14, k.c, 3); cushion(x + 5, b - 28, 22, 5, sh(k.c, 1), 2);
    for (const i of [0, 24]) cushion(x + i, b - 40, 8, 26, sh(k.c, -1), 3);
    panel(x + 25, b - 46, 7, 6, k.m); P(x + 27, b - 44, '#e05050'); P(x + 29, b - 44, '#58d858');
  } },
  { id: 'milkfridge', name: 'Milk cooler', w: 1, h: 1, price: 800, glow: ['#e8f8ff'], draw(x, b) {
    floorShadow(x, b, 32); panel(x + 2, b - 82, 28, 82, k.m, 2); R(x + 4, b - 80, 24, 10, k.c); R(x + 14, b - 79, 4, 8, '#ffffff'); R(x + 15, b - 81, 2, 2, '#ffffff');
    glass(x + 5, b - 67, 22, 56, '#e8f8ff');
    for (let s = 0; s < 3; s++) {
      const sy = b - 50 + s * 17, bc = ['#ffffff', '#c8946a', '#f8b0c8'][s];
      R(x + 5, sy, 22, 1, sh(k.m, 1));
      for (let n = 0; n < 4; n++) { const bx = x + 7 + n * 5; R(bx, sy - 10, 4, 10, bc); R(bx + 1, sy - 12, 2, 2, bc); R(bx, sy - 13, 4, 1, k.c); P(bx, sy - 8, sh(bc, 1)); }
    }
    R(x + 25, b - 52, 1, 14, CHROME); R(x + 4, b - 9, 24, 5, sh(k.m, -1)); for (let i = 6; i < 26; i += 3) R(x + i, b - 8, 2, 3, INK);
  } },
  { id: 'pingpong', name: 'Table tennis', w: 2, h: 1, price: 900, draw(x, b, vw, dir) {
    if (dir % 2) return sideBox(x, b, vw, 30);
    const TOP = '#2a7a5a';
    floorShadow(x, b, vw); for (const i of [6, vw - 10]) cyl(x + i, b - 28, 4, 28, k.m); R(x + 8, b - 14, vw - 16, 2, sh(k.m, -1));
    R(x + 1, b - 38, vw - 2, 8, TOP); R(x + 1, b - 38, vw - 2, 1, '#ffffff'); R(x + 1, b - 38, 1, 8, '#ffffff'); R(x + vw - 2, b - 38, 1, 8, '#ffffff'); R(x + vw / 2, b - 38, 1, 8, '#f0f0f0');
    panel(x + 1, b - 30, vw - 2, 4, sh(TOP, -1));
    for (let i = 0; i < vw - 4; i++) for (let j = 0; j < 5; j++) if ((i + j) % 2 === 0) P(x + 2 + i, b - 40 + j, j === 0 ? '#ffffff' : '#c8c8c8');
    R(x + 1, b - 41, 2, 7, k.m); R(x + vw - 3, b - 41, 2, 7, k.m);
    disc(x + 14, b - 33, 3, k.c); R(x + 16, b - 32, 4, 1, k.w); disc(x + vw - 16, b - 34, 3, sh(k.c, -1)); disc(x + vw / 2 + 8, b - 46, 1.5, '#ffffff');
  } },
  { id: 'footbath', name: 'Foot bath', w: 2, h: 1, price: 700, high: 0.15, side: 'w', flat(w, h) {
    wood(0, 0, w, h, k.w); inset(4, 5, w - 8, h - 10, sh(SPRING, -1)); R(5, 6, w - 10, h - 12, SPRING);
    for (let n = 0; n < 8; n++) ovalShade(9 + n * 6.5, h / 2 + (n % 2 ? 3 : -3), 3, 2, STONE);
    for (let n = 0; n < 16; n++) P(6 + hash(n, 4) * (w - 12), 7 + hash(n, 5) * (h - 14), '#e8f4f8');
    for (const i of [2, w - 3]) R(i, 2, 1, h - 4, sh(k.w, 1));
  } },
  { id: 'onsensign', name: 'Hot spring curtain', w: 1, h: 1, layer: 'wall', price: 160, wall(x) {
    cyl(x + 1, 10, 30, 3, k.w);
    R(x + 3, 13, 26, 44, k.c); R(x + 3, 13, 26, 2, sh(k.c, -1)); R(x + 3, 13, 2, 44, sh(k.c, 1)); R(x + 27, 13, 2, 44, sh(k.c, -1));
    clear(x + 15, 44, 2, 13);
    arc(x + 16, 33, 9, 6, 0, Math.PI, '#ffffff', 2);
    for (const n of [-5, 0, 5]) for (let j = 0; j < 12; j++) R(x + 16 + n + Math.round(Math.sin(j / 2) * 1.5), 33 - j, 2, 1, '#ffffff');
  } },
  { id: 'sakebarrel', name: 'Sake barrel', w: 1, h: 1, price: 380, draw(x, b) {
    const STRAW = '#e8d8a0', ROPE = '#8a6a3a';
    floorShadow(x, b, 32); cyl(x + 3, b - 34, 26, 34, STRAW);
    for (let j = b - 32; j < b; j += 4) for (let i = 0; i < 26; i += 2) P(x + 3 + i + ((j >> 2) % 2), j, sh(STRAW, -1));
    for (const j of [-31, -4]) R(x + 3, b + j, 26, 2, ROPE); line(x + 3, b - 28, x + 28, b - 7, ROPE); line(x + 28, b - 28, x + 3, b - 7, ROPE);
    oval(x + 16, b - 34, 13, 3, sh(STRAW, 1)); oval(x + 16, b - 34, 10, 2, HINOKI);
    panel(x + 9, b - 26, 14, 16, k.c); R(x + 12, b - 23, 2, 10, '#ffffff'); R(x + 16, b - 23, 4, 2, '#ffffff'); R(x + 17, b - 20, 2, 7, '#ffffff');
  } },
  { id: 'futonstack', name: 'Futon stack', w: 1, h: 1, price: 420, draw(x, b) {
    floorShadow(x, b, 32);
    [k.c, k.p, sh(k.c, 1), k.a, k.p, k.c].forEach((c, n) => { const y = b - 10 - n * 9; cushion(x + 1 + (n % 2), y, 29, 10, c, 4); if (n % 3 === 0) for (let i = 4; i < 28; i += 6) P(x + 2 + i, y + 5, k.p); });
    cushion(x + 8, b - 63, 16, 9, '#ffffff', 4);
  } },
  { id: 'washbasin', name: 'Wash station', w: 1, h: 1, price: 360, draw(x, b) {
    floorShadow(x, b, 32);
    panel(x + 6, b - 84, 20, 24, k.w); glass(x + 8, b - 82, 16, 20, '#d8eef4');
    R(x + 14, b - 58, 2, 6, CHROME); R(x + 14, b - 58, 7, 2, CHROME); disc(x + 13, b - 59, 2, '#e04848');
    for (let j = 0; j < 12; j++) R(x + 6 + j * 0.2, b - 46 + j, 20 - j * 0.4, 1, HINOKI); oval(x + 16, b - 46, 10, 2, sh(HINOKI, 1)); oval(x + 16, b - 46, 8, 1, SPRING);
    for (const i of [8, 22]) cyl(x + i, b - 34, 3, 34, k.w);
    panel(x + 3, b - 12, 12, 4, HINOKI); for (const i of [4, 12]) R(x + i, b - 8, 2, 8, sh(HINOKI, -1));
    oval(x + 24, b - 47, 3, 1.5, '#f8f0f8');
  } },
  { id: 'bamboowall', name: 'Bamboo panel', w: 2, h: 1, layer: 'wall', price: 300, wall(x) {
    for (let i = 2; i < 60; i += 5) { cyl(x + i, 8, 5, 80, BAMBOO); for (let j = 16 + (i * 7) % 11; j < 86; j += 18) { R(x + i, j, 5, 1, sh(BAMBOO, -1)); R(x + i, j + 1, 5, 1, sh(BAMBOO, 1)); } }
    for (const j of [26, 66]) { R(x + 1, j, 62, 3, sh(BAMBOO, -1)); for (let i = 4; i < 60; i += 10) R(x + i, j - 1, 3, 5, k.c); }
  } },
  { id: 'andon', name: 'Paper lamp', w: 1, h: 1, price: 340, glow: ['#fff0c0', '#fff8e0'], draw(x, b) {
    floorShadow(x + 4, b, 24); for (const i of [7, 22]) cyl(x + i, b - 58, 3, 58, k.w);
    R(x + 10, b - 55, 12, 41, '#fff0c0'); R(x + 10, b - 55, 3, 41, '#fff8e0'); for (const j of [-42, -28]) R(x + 10, b + j, 12, 1, sh(k.w, -1)); R(x + 16, b - 55, 1, 41, sh('#fff0c0', -1));
    R(x + 7, b - 58, 18, 3, k.w); R(x + 7, b - 14, 18, 2, k.w); R(x + 5, b - 4, 22, 4, k.w);
  } },
  { id: 'steamrocks', name: 'Sauna stones', w: 1, h: 1, price: 380, glow: ['#f8a040'], draw(x, b) {
    floorShadow(x, b, 32); panel(x + 3, b - 28, 26, 28, k.m, 2); for (let j = b - 24; j < b - 4; j += 4) R(x + 5, j, 22, 1, sh(k.m, -1));
    R(x + 9, b - 14, 14, 7, INK); R(x + 10, b - 13, 12, 5, '#f8a040');
    for (const [i, j] of [[7, -30], [13, -31], [19, -30], [25, -30], [10, -35], [17, -36], [23, -34], [14, -40]]) ovalShade(x + i, b + j, 4, 3, hash(i, j) < 0.5 ? STONE : sh(STONE, -1));
    for (let n = 0; n < 3; n++) for (let j = 0; j < 22; j++) P(x + 10 + n * 6 + Math.round(Math.sin(j / 3 + n) * 2), b - 44 - j, j % 2 ? '#f4f8ff' : '#dfe8f0');
  } },
  { id: 'mossrock', name: 'Mossy rock', w: 1, h: 1, price: 280, draw(x, b) {
    floorShadow(x, b, 32); ovalShade(x + 16, b - 16, 15, 15, STONE); ovalShade(x + 8, b - 9, 7, 7, sh(STONE, -1));
    for (let i = -12; i <= 12; i++) { const top = b - 30 + Math.round(i * i / 14); for (let d = 0; d < 4 - (Math.abs(i) % 2); d++) P(x + 16 + i, top + d, d ? '#5a8a3a' : '#7aaa4a'); }
    leaf(x + 26, b - 30, 2, 6, k.leaf, 0.6); leaf(x + 22, b - 32, 2, 5, sh(k.leaf, 1), 0.2); flower(x + 9, b - 26, k.c);
  } },
  { id: 'monkeystatue', name: 'Snow monkey statue', w: 1, h: 1, price: 520, draw(x, b) {
    floorShadow(x + 2, b, 28); panel(x + 4, b - 8, 24, 8, sh(STONE, -1));
    ovalShade(x + 16, b - 22, 10, 13, STONE); for (const s of [-1, 1]) ovalShade(x + 16 + s * 8, b - 22, 3, 7, sh(STONE, -1));
    ovalShade(x + 16, b - 42, 8, 8, STONE); oval(x + 16, b - 40, 5, 4, sh(STONE, 1));
    P(x + 14, b - 42, INK); P(x + 18, b - 42, INK); R(x + 15, b - 38, 3, 1, sh(STONE, -2));
    cushion(x + 10, b - 53, 12, 5, k.c, 2); R(x + 12, b - 52, 8, 1, k.p);
  } },
  { id: 'towelbasket', name: 'Towel basket', w: 1, h: 1, price: 220, draw(x, b) {
    floorShadow(x, b, 32);
    for (let n = 0; n < 5; n++) { const cx = x + 7 + n * 4.5, cy = b - 22 - (n % 2) * 5, c = n % 2 ? k.c : k.p; disc(cx, cy, 4, c); ring(cx, cy, 2, sh(c, -1)); P(cx, cy, sh(c, -2)); }
    R(x + 3, b - 20, 26, 20, k.w);
    for (let j = 0; j < 20; j += 3) for (let i = (j % 6 ? 0 : 2); i < 26; i += 4) R(x + 3 + i, b - 20 + j, 2, 2, sh(k.w, j % 6 ? 1 : -1));
    R(x + 2, b - 21, 28, 2, sh(k.w, -1));
  } },
  { id: 'getarack', name: 'Sandal shelf', w: 1, h: 1, price: 300, draw(x, b) {
    floorShadow(x, b, 32); wood(x + 1, b - 54, 30, 54, k.w, 'y');
    for (let r = 0; r < 3; r++) {
      const fy = b - 6 - r * 16; inset(x + 3, fy - 13, 26, 13, sh(k.w, -2)); R(x + 3, fy, 26, 2, k.w);
      for (const s of [0, 1]) { const gx = x + 5 + s * 12; panel(gx, fy - 4, 10, 2, HINOKI); R(gx + 1, fy - 2, 2, 2, sh(HINOKI, -1)); R(gx + 7, fy - 2, 2, 2, sh(HINOKI, -1)); line(gx + 2, fy - 5, gx + 5, fy - 8, k.c); line(gx + 8, fy - 5, gx + 5, fy - 8, k.c); }
    }
  } },
]);

/* ---------- arcade ---------- */
/** An upright arcade cabinet; returns its screen's box. */
function cabinet(x, b) {
  floorShadow(x, b, 32);
  panel(x + 2, b - 90, 28, 90, k.c, 2); R(x + 2, b - 76, 2, 28, sh(k.c, -1)); R(x + 28, b - 76, 2, 28, sh(k.c, -1));
  R(x + 4, b - 88, 24, 10, MARQUEE); R(x + 4, b - 79, 24, 1, sh(MARQUEE, -2)); for (let i = 6; i < 26; i += 4) R(x + i, b - 85, 2, 4, k.c);
  inset(x + 4, b - 74, 24, 24, INK);
  panel(x + 1, b - 48, 30, 8, k.m); R(x + 8, b - 54, 2, 6, INK); disc(x + 9, b - 55, 2, '#e04848');
  for (const [i, c] of [[17, '#f8d030'], [21, '#58b8f8'], [25, '#58d858']]) { disc(x + i, b - 45, 1.5, c); P(x + i - 1, b - 46, sh(c, 2)); }
  panel(x + 4, b - 40, 24, 38, sh(k.c, -1)); inset(x + 11, b - 32, 10, 12, k.m); R(x + 13, b - 29, 2, 4, '#f8d030'); R(x + 17, b - 29, 2, 4, '#f8d030');
  return [x + 6, b - 72, 20, 20];
}
const GAMES = {
  racer: ['Racing', (x, y, w, h) => {
    R(x, y, w, 6, '#3a2a68'); R(x, y + 6, w, h - 6, '#2a7a3a');
    for (let j = 0; j < h - 6; j++) { const half = 2 + j * 0.45; R(x + w / 2 - half, y + 6 + j, half * 2, 1, '#5a5a68'); if ((j >> 2) % 2) P(x + w / 2, y + 6 + j, '#ffffff'); }
    panel(x + 7, y + 13, 6, 5, '#e04848'); R(x + 8, y + 14, 4, 1, '#a8d8f8');
  }],
  shooter: ['Space shooter', (x, y, w, h) => {
    R(x, y, w, h, '#0a0a20'); for (let n = 0; n < 10; n++) P(x + hash(n, 1) * w, y + hash(n, 2) * h, '#ffffff');
    for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) { const ax = x + 2 + i * 5, ay = y + 2 + r * 4; R(ax, ay, 3, 2, r ? '#f858c8' : '#78f858'); P(ax, ay + 2, r ? '#f858c8' : '#78f858'); P(ax + 2, ay + 2, r ? '#f858c8' : '#78f858'); }
    tri(x + 10, y + 15, 4, '#58f0f8', 1); R(x + 10, y + 11, 1, 2, '#f8f058');
  }],
  puzzle: ['Block puzzle', (x, y, w, h) => {
    R(x, y, w, h, '#101828'); R(x + 4, y, 1, h, '#5a5a78'); R(x + 15, y, 1, h, '#5a5a78');
    const cells = [[0, 0, 3], [1, 0, 3], [2, 0, 1], [0, 1, 2], [3, 0, 4], [4, 0, 4], [3, 1, 4], [1, 1, 2], [2, 1, 6], [4, 1, 0], [2, 2, 5], [0, 2, 5], [1, 4, 4], [2, 4, 4], [2, 5, 4]];
    for (const [c, r, n] of cells) { const cx = x + 5 + c * 2, cy = r > 3 ? y + 2 + (r - 4) * 2 : y + h - 2 - (r + 1) * 2; R(cx, cy, 2, 2, RAINBOW[n]); P(cx, cy, sh(RAINBOW[n], 2)); }
  }],
  fighter: ['Fighting game', (x, y, w, h) => {
    R(x, y, w, h, '#f89848'); R(x, y + 12, w, h - 12, '#a85a38'); disc(x + w / 2, y + 10, 4, '#f8e070');
    R(x + 1, y + 1, 8, 1, '#f8d030'); R(x + 11, y + 1, 8, 1, '#f8d030');
    for (const [i, c, s] of [[5, '#4a88d8', 1], [14, '#e04848', -1]]) { disc(x + i, y + 8, 1.5, '#f8c8a0'); R(x + i - 1, y + 10, 3, 5, c); R(x + i - 1, y + 15, 1, 3, INK); R(x + i + 1, y + 15, 1, 3, INK); line(x + i, y + 11, x + i + s * 3, y + 10, c); }
  }],
  maze: ['Maze game', (x, y, w, h) => {
    R(x, y, w, h, '#000010');
    for (const [i, j, ww, hh] of [[0, 0, 20, 1], [0, 19, 20, 1], [0, 0, 1, 20], [19, 0, 1, 20], [4, 4, 5, 1], [11, 4, 5, 1], [4, 9, 1, 6], [15, 9, 1, 6], [8, 9, 4, 1], [7, 14, 6, 1]]) R(x + i, y + j, ww, hh, '#3a58e8');
    for (let i = 2; i < 18; i += 2) { P(x + i, y + 2, '#f8d8a0'); P(x + i, y + 17, '#f8d8a0'); }
    disc(x + 6, y + 12, 2, '#f8e048'); P(x + 8, y + 12, '#000010'); disc(x + 12, y + 7, 2, '#f858c8'); P(x + 11, y + 6, '#ffffff');
  }],
  rhythm: ['Rhythm game', (x, y, w, h) => {
    R(x, y, w, h, '#1a1030');
    const ARROW = ['.#.', '###', '.#.'];
    for (let l = 0; l < 4; l++) { R(x + 2 + l * 5, y, 1, h, '#3a2a58'); bitmap(ARROW, x + 1 + l * 5, y + 16, '#8a7aa8', 1); for (let n = 0; n < 2; n++) bitmap(ARROW, x + 1 + l * 5, y + 2 + ((l * 7 + n * 9) % 13), NEON[l], 1); }
  }],
};
add('Arcade', Object.entries(GAMES).map(([id, [name, play]]) => ({ id: `${id}cabinet`, name: `${name} cabinet`, w: 1, h: 1, price: 1100, glow: [MARQUEE],
  draw(x, b) { const [sx, sy, sw, sh2] = cabinet(x, b); clipped(sx, sy, sw, sh2, () => play(sx, sy, sw, sh2)); } })));
const UP = ['...#...', '..###..', '.#####.', '#######', '..###..', '..###..', '..###..'];
const RIGHT = turn(UP), DOWN = turn(RIGHT), LEFT = turn(DOWN);
add('Arcade', [
  { id: 'pinball', name: 'Pinball', w: 1, h: 1, price: 1400, glow: [MARQUEE, '#f858c8', '#f8a030'], draw(x, b) {
    floorShadow(x, b, 32); for (const i of [3, 26]) cyl(x + i, b - 30, 3, 30, CHROME);
    R(x + 2, b - 46, 28, 6, '#2a2a48'); for (let i = 4; i < 28; i += 5) disc(x + i, b - 43, 1, NEON[(i >> 2) % 4]);
    panel(x + 1, b - 40, 30, 12, k.c, 2); R(x, b - 37, 2, 4, '#f8d030'); R(x + 30, b - 37, 2, 4, '#f8d030'); R(x + 23, b - 33, 4, 2, CHROME);
    panel(x + 2, b - 90, 28, 44, k.c, 2); inset(x + 5, b - 87, 22, 28, '#2a1840');
    disc(x + 16, b - 74, 7, '#f858c8'); disc(x + 16, b - 74, 4, MARQUEE); for (let n = 0; n < 8; n++) { const a = n / 8 * Math.PI * 2; line(x + 16 + Math.cos(a) * 8, b - 74 + Math.sin(a) * 8, x + 16 + Math.cos(a) * 10, b - 74 + Math.sin(a) * 10, '#58f0f8'); }
    inset(x + 5, b - 56, 22, 7, INK); for (let n = 0; n < 6; n++) R(x + 7 + n * 3, b - 54, 2, 3, '#f8a030');
  } },
  { id: 'clawmachine', name: 'Claw machine', w: 1, h: 1, price: 1100, glow: [MARQUEE], draw(x, b) {
    floorShadow(x, b, 32); panel(x + 1, b - 36, 30, 36, k.c, 2); inset(x + 4, b - 26, 10, 10, INK); panel(x + 16, b - 32, 13, 6, k.m);
    R(x + 19, b - 36, 2, 4, INK); disc(x + 20, b - 37, 2, '#e04848'); disc(x + 26, b - 30, 1.5, '#f8d030');
    glass(x + 3, b - 80, 26, 44, GLASS);
    [[6, -40, '#f8d030'], [11, -39, '#f8a8c8'], [16, -40, '#58b8f8'], [21, -39, '#a8e078'], [26, -40, '#f8a030'], [8, -45, '#c8a0f0'], [14, -45, '#f8f0e8'], [20, -44, '#e04848'], [25, -45, '#58d8b8']]
      .forEach(([i, j, c]) => { sphere(x + i, b + j, 3, c); P(x + i - 1, b + j, INK); P(x + i + 1, b + j, INK); });
    R(x + 18, b - 80, 1, 16, CHROME); R(x + 15, b - 64, 7, 2, CHROME); line(x + 15, b - 63, x + 13, b - 58, CHROME); line(x + 21, b - 63, x + 23, b - 58, CHROME);
    panel(x + 1, b - 90, 30, 10, k.c, 2); R(x + 4, b - 87, 24, 4, MARQUEE);
  } },
  { id: 'airhockey', name: 'Air hockey', w: 2, h: 1, price: 1300, glow: ['#f85050'], draw(x, b, vw, dir) {
    if (dir % 2) return sideBox(x, b, vw, 30);
    floorShadow(x, b, vw); for (const i of [5, vw - 9]) cyl(x + i, b - 24, 4, 24, k.m);
    R(x + 1, b - 40, vw - 2, 10, '#e8f0f8'); for (let j = b - 39; j < b - 30; j += 2) for (let i = x + 3 + (j % 4 ? 1 : 0); i < x + vw - 3; i += 3) P(i, j, '#c8d4e0');
    R(x + 1, b - 40, vw - 2, 1, k.c); R(x + vw / 2, b - 40, 1, 10, '#e04848'); arc(x + vw / 2, b - 35, 5, 3, 0, Math.PI * 2, '#e04848');
    R(x + 1, b - 37, 2, 4, INK); R(x + vw - 3, b - 37, 2, 4, INK);
    panel(x + 1, b - 30, vw - 2, 8, k.c, 2);
    disc(x + 12, b - 36, 3, '#e04848'); cyl(x + 11, b - 41, 2, 5, '#e04848'); disc(x + vw - 12, b - 35, 3, '#4a88d8'); cyl(x + vw - 13, b - 40, 2, 5, '#4a88d8'); oval(x + vw / 2 + 7, b - 34, 2, 1, INK);
    for (const i of [-11, 9]) R(x + vw / 2 + i, b - 50, 2, 10, k.m); panel(x + vw / 2 - 12, b - 58, 24, 9, INK);
    for (const [i, n] of [[-9, 3], [3, 5]]) for (let d = 0; d < n; d += 2) R(x + vw / 2 + i + d, b - 56, 1, 5, '#f85050');
  } },
  { id: 'dancepad', name: 'Dance mat', w: 2, h: 2, layer: 'rug', price: 500, high: 0.04, side: 'm', flat(w, h) {
    R(0, 0, w, h, k.m); R(2, 2, w - 4, h - 4, sh(k.m, -1));
    const cell = (w - 8) / 3;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) panel(4 + c * cell, 4 + r * cell, cell - 2, cell - 2, (r + c) % 2 ? k.c : sh(k.m, 1));
    for (const [c, r, rows, col] of [[1, 0, UP, '#58f0f8'], [1, 2, DOWN, '#58f0f8'], [0, 1, LEFT, '#f858c8'], [2, 1, RIGHT, '#f858c8']]) stamp(rows, 4 + c * cell + 1.5, 4 + r * cell + 1.5, { '#': col }, 2);
    motif('star', 4 + cell + 0.5, 4 + cell + 0.5, ink(k.a, sh(k.a, 1), sh(k.a, -2), '#ffffff'), 2);
  } },
  { id: 'skeeball', name: 'Skee-ball', w: 1, h: 1, price: 1000, glow: ['#f85050'], draw(x, b) {
    floorShadow(x, b, 32);
    for (let j = 0; j < 46; j++) { const hw = 13 - j * 0.12; R(x + 16 - hw, b - 4 - j, hw * 2, 1, (j % 8) < 4 ? HINOKI : sh(HINOKI, -1)); }
    line(x + 2, b - 2, x + 8, b - 50, k.c, 3); line(x + 29, b - 2, x + 23, b - 50, k.c, 3);
    panel(x + 5, b - 84, 22, 34, k.c, 2); disc(x + 16, b - 64, 9, INK);
    ring(x + 16, b - 64, 9, '#f8d030', 2); ring(x + 16, b - 64, 6, '#58f0f8', 2); ring(x + 16, b - 64, 3, '#f858c8', 1); disc(x + 16, b - 64, 1.5, INK);
    disc(x + 8, b - 79, 2, INK); disc(x + 24, b - 79, 2, INK);
    inset(x + 8, b - 92, 16, 7, INK); for (let n = 0; n < 4; n++) R(x + 10 + n * 3, b - 90, 2, 3, '#f85050');
    for (const [i, c] of [[11, '#d84848'], [16, '#4a88d8'], [21, '#f8d030']]) sphere(x + i, b - 6, 2.5, c);
  } },
  { id: 'prizecounter', name: 'Prize counter', w: 2, h: 1, price: 1200, draw(x, b, vw, dir) {
    if (dir % 2) return sideBox(x, b, vw, 34);
    floorShadow(x, b, vw); panel(x + 1, b - 34, vw - 2, 34, k.c, 2); glass(x + 4, b - 30, vw - 8, 22, GLASS);
    ball(x + 12, b - 15, 4); sphere(x + 23, b - 14, 4, '#f8a8c8'); for (let n = 0; n < 5; n++) disc(x + 32 + n * 4, b - 12, 1.5, RAINBOW[n]); sphere(x + 54, b - 15, 4, '#f8d030');
    panel(x, b - 37, vw, 4, k.w);
    const BEAR = '#c8945a'; disc(x + 9, b - 51, 2.5, BEAR); disc(x + 19, b - 51, 2.5, BEAR); sphere(x + 14, b - 45, 7, BEAR); oval(x + 14, b - 43, 3, 2, sh(BEAR, 1)); P(x + 12, b - 47, INK); P(x + 16, b - 47, INK); P(x + 14, b - 44, INK);
    panel(x + vw - 28, b - 56, 24, 17, MARQUEE); R(x + vw - 25, b - 52, 18, 9, '#f86060');
    for (let j = b - 51; j < b - 44; j += 2) P(x + vw - 19, j, '#ffffff'); disc(x + vw - 25, b - 48, 1.5, MARQUEE); disc(x + vw - 7, b - 48, 1.5, MARQUEE);
  } },
  { id: 'tokenmachine', name: 'Token machine', w: 1, h: 1, price: 600, glow: ['#68f070'], draw(x, b) {
    floorShadow(x, b, 32); panel(x + 4, b - 80, 24, 80, k.m, 2); R(x + 4, b - 80, 3, 80, k.c); R(x + 25, b - 80, 3, 80, k.c);
    R(x + 7, b - 78, 18, 8, k.c); disc(x + 16, b - 74, 3, GOLD); P(x + 15, b - 75, sh(GOLD, 2));
    inset(x + 8, b - 66, 16, 8, '#102018'); for (let n = 0; n < 4; n++) R(x + 10 + n * 3, b - 64, 2, 4, '#68f070');
    R(x + 9, b - 54, 14, 2, INK); R(x + 20, b - 48, 2, 5, INK); disc(x + 12, b - 46, 2, '#e04848');
    inset(x + 8, b - 26, 16, 8, INK); for (let n = 0; n < 5; n++) oval(x + 11 + n * 2.5, b - 20, 2, 1, GOLD);
  } },
  { id: 'photobooth', name: 'Photo booth', w: 1, h: 1, price: 1000, glow: [MARQUEE], draw(x, b) {
    floorShadow(x, b, 32); panel(x + 1, b - 92, 30, 92, k.m, 2); R(x + 3, b - 90, 26, 9, MARQUEE); say('PHOTO', x + 7, b - 88, k.c);
    R(x + 4, b - 78, 22, 2, CHROME);
    for (let i = 0; i < 20; i++) R(x + 5 + i, b - 76, 1, 66 + (i % 3), i % 4 < 2 ? k.c : sh(k.c, -1));
    R(x + 10, b - 8, 4, 3, INK); R(x + 17, b - 8, 4, 3, INK);
    R(x + 27, b - 44, 2, 10, INK); R(x + 28, b - 38, 3, 12, '#ffffff'); for (let n = 0; n < 3; n++) R(x + 29, b - 37 + n * 4, 1, 2, '#a8c8e8');
  } },
  { id: 'neonsign', name: 'Neon sign', w: 2, h: 1, layer: 'wall', price: 600, glow: ['#f858c8', '#58f0f8'], wall(x) {
    shadowWall(x + 2, 20, 60, 42); panel(x + 2, 20, 60, 42, '#1a1428', 2);
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) say('GAME', x + 10 + dx, 26 + dy, sh('#f858c8', -2), 3);
    say('GAME', x + 10, 26, '#f858c8', 3);
    R(x + 10, 49, 44, 2, sh('#58f0f8', -2)); R(x + 10, 48, 44, 1, '#58f0f8'); tri(x + 32, 52, 4, '#58f0f8', 1);
    for (const [i, j] of [[5, 23], [58, 23], [5, 58], [58, 58]]) P(x + i, j, CHROME);
  } },
  { id: 'hoopshot', name: 'Hoop shot', w: 1, h: 1, price: 1100, glow: ['#f85050'], draw(x, b) {
    floorShadow(x, b, 32);
    for (const i of [1, 28]) cyl(x + i, b - 90, 3, 62, CHROME);
    for (let n = 0; n < 6; n++) { line(x + 4, b - 86 + n * 9, x + 28, b - 80 + n * 9, '#d8dce4'); }
    panel(x + 1, b - 30, 30, 30, k.c, 2); inset(x + 4, b - 28, 24, 10, '#2a2a38'); for (let n = 0; n < 4; n++) sphere(x + 8 + n * 5, b - 22, 2.5, '#e87830');
    panel(x + 6, b - 88, 20, 16, '#f4f4f0'); R(x + 12, b - 82, 8, 1, '#e04848'); R(x + 12, b - 82, 1, 6, '#e04848'); R(x + 19, b - 82, 1, 6, '#e04848');
    R(x + 11, b - 72, 10, 2, '#e04848'); for (let j = 0; j < 8; j++) for (let i = 0; i < 8 - j * 0.5; i += 2) P(x + 12 + j * 0.25 + i + (j % 2), b - 70 + j, '#ffffff');
    inset(x + 8, b - 60, 16, 7, INK); for (let n = 0; n < 4; n++) R(x + 10 + n * 3, b - 58, 2, 3, '#f85050');
  } },
  { id: 'whackamole', name: 'Whack-a-mole', w: 1, h: 1, price: 900, draw(x, b) {
    const MOLE = '#a8784a';
    floorShadow(x, b, 32); for (const i of [4, 26]) R(x + i, b - 76, 2, 40, k.m);
    panel(x + 3, b - 88, 26, 14, k.c, 2); for (let n = 0; n < 5; n++) flower(x + 7 + n * 4.5, b - 81, n % 2 ? '#f8d030' : '#ffffff');
    panel(x + 2, b - 30, 28, 30, k.c, 2); R(x + 1, b - 40, 30, 10, sh(k.m, 1));
    for (const i of [7, 16, 25]) for (const j of [-37, -33]) oval(x + i, b + j, 3, 1.2, INK);
    for (const [i, j] of [[16, -37], [7, -33]]) { ovalShade(x + i, b + j - 4, 3, 5, MOLE); P(x + i - 1, b + j - 6, INK); P(x + i + 1, b + j - 6, INK); disc(x + i, b + j - 4, 1, '#f8a0a8'); }
    line(x + 22, b - 58, x + 27, b - 44, k.w, 2); panel(x + 17, b - 63, 10, 6, '#e04848');
  } },
  { id: 'gumball', name: 'Gumball machine', w: 1, h: 1, price: 300, draw(x, b) {
    floorShadow(x + 4, b, 24); panel(x + 8, b - 6, 16, 6, k.c); cyl(x + 14, b - 28, 4, 22, k.c);
    panel(x + 8, b - 40, 16, 12, k.c, 2); disc(x + 16, b - 35, 3, CHROME); P(x + 15, b - 36, '#ffffff'); R(x + 13, b - 31, 6, 2, INK);
    disc(x + 16, b - 55, 13, '#e8f4f8');
    for (let n = 0; n < 34; n++) { const a = hash(n, 1) * Math.PI * 2, d = Math.sqrt(hash(n, 2)) * 10, py = b - 52 + Math.abs(Math.sin(a)) * d * 0.6; disc(x + 16 + Math.cos(a) * d, Math.min(py, b - 44), 1.5, RAINBOW[n % 7]); }
    R(x + 9, b - 63, 2, 5, '#ffffff'); P(x + 11, b - 65, '#ffffff');
    panel(x + 11, b - 70, 10, 4, k.c); sphere(x + 16, b - 72, 2, k.c);
  } },
  { id: 'coinpusher', name: 'Coin pusher', w: 1, h: 1, price: 1000, glow: [MARQUEE], draw(x, b) {
    floorShadow(x, b, 32); panel(x + 1, b - 36, 30, 36, k.c, 2); inset(x + 6, b - 16, 20, 8, INK); for (let n = 0; n < 6; n++) oval(x + 9 + n * 3, b - 10, 2, 1, GOLD);
    glass(x + 3, b - 80, 26, 44, GLASS);
    for (const y of [b - 62, b - 44]) { panel(x + 4, y, 24, 3, k.m); for (let n = 0; n < 10; n++) { oval(x + 5 + n * 2.4, y - 1 - (n % 3), 1.6, 1, GOLD); P(x + 5 + n * 2.4, y - 2 - (n % 3), sh(GOLD, 2)); } oval(x + 27, y + 4, 1.6, 1, GOLD); }
    panel(x + 1, b - 90, 30, 10, k.c, 2); R(x + 4, b - 87, 24, 4, MARQUEE); disc(x + 16, b - 85, 2, GOLD);
  } },
  { id: 'arcadestool', name: 'Arcade stool', w: 1, h: 1, price: 160, seat: 'cushion', draw(x, b) {
    floorShadow(x + 4, b, 24); oval(x + 16, b - 3, 10, 3, CHROME); oval(x + 16, b - 4, 8, 2, sh(CHROME, 1));
    cyl(x + 14, b - 26, 4, 22, CHROME); arc(x + 16, b - 14, 8, 2, 0, Math.PI * 2, sh(CHROME, -1));
    cushion(x + 4, b - 34, 24, 8, k.c, 4); R(x + 5, b - 27, 22, 2, sh(k.c, -2));
  } },
  { id: 'arcaderug', name: 'Arcade carpet', w: 2, h: 2, layer: 'rug', price: 320, high: 0.04, side: 'c', flat(w, h) {
    R(0, 0, w, h, sh(k.c, -2)); R(2, 2, w - 4, h - 4, '#1a1430');
    for (let n = 0; n < 16; n++) {
      const cx = 7 + hash(n, 1) * (w - 14), cy = 7 + hash(n, 2) * (h - 14), c = NEON[n % 4], s = n % 3;
      if (s === 0) ring(cx, cy, 3, c); else if (s === 1) { for (let i = 0; i < 8; i++) P(cx - 4 + i, cy + (i % 2 ? -1 : 1), c); } else tri(cx, cy - 3, 4, c, 0.8);
    }
    for (let i = 3; i < w - 3; i += 6) { R(i, 0, 3, 2, k.c); R(i, h - 2, 3, 2, k.c); }
  } },
  { id: 'highscore', name: 'High score board', w: 1, h: 1, layer: 'wall', price: 260, glow: ['#f8d030', '#58f0f8'], wall(x) {
    shadowWall(x + 3, 14, 26, 46); panel(x + 3, 14, 26, 46, k.m, 2); inset(x + 5, 16, 22, 42, '#101018');
    say('HI', x + 11, 19, '#f8d030');
    for (let r = 0; r < 5; r++) { const y = 28 + r * 6; for (let n = 0; n < 3; n++) R(x + 7 + n * 3, y, 2, 3, '#58f0f8'); for (let n = 0; n < 4; n++) R(x + 17 + n * 2, y, 1, 3, r ? '#ffffff' : '#f8d030'); }
  } },
  { id: 'racingseat', name: 'Racing cockpit', w: 2, h: 1, price: 1600, seat: 'cushion', glow: [MARQUEE], draw(x, b, vw, dir) {
    floorShadow(x, b, vw); panel(x + 1, b - 8, vw - 2, 8, k.m);
    if (dir % 2) { cushion(x + 4, b - 46, 12, 38, k.c, 4); panel(x + 18, b - 70, 12, 62, k.c, 2); return; }
    cushion(x + 4, b - 52, 18, 30, k.c, 5); cushion(x + 2, b - 24, 24, 14, k.c, 3); R(x + 11, b - 50, 4, 26, '#ffffff');
    panel(x + 30, b - 82, 32, 74, k.c, 2); R(x + 33, b - 80, 26, 8, MARQUEE); inset(x + 33, b - 68, 26, 20, INK);
    clipped(x + 34, b - 67, 24, 18, () => GAMES.racer[1](x + 34, b - 67, 24, 18));
    ring(x + 46, b - 36, 6, INK, 2); R(x + 45, b - 36, 3, 6, INK); R(x + 33, b - 14, 4, 3, CHROME); R(x + 39, b - 14, 4, 3, CHROME);
  } },
  { id: 'capsuletoy', name: 'Capsule toys', w: 1, h: 1, price: 500, draw(x, b) {
    floorShadow(x, b, 32);
    for (const s of [0, 1]) {
      const by = b - s * 44; panel(x + 3, by - 44, 26, 44, s ? sh(k.c, 1) : k.c, 2); glass(x + 5, by - 42, 22, 22, '#e8f4f8');
      for (let n = 0; n < 8; n++) { const cx = x + 8 + (n % 4) * 5, cy = by - 25 - Math.floor(n / 4) * 5; disc(cx, cy, 2, '#ffffff'); R(cx - 2, cy - 2, 5, 2, RAINBOW[(n + s * 3) % 7]); }
      disc(x + 12, by - 12, 3, CHROME); R(x + 10, by - 13, 5, 1, INK); inset(x + 20, by - 16, 6, 6, INK);
    }
  } },
  { id: 'pixelposter', name: 'Pixel poster', w: 1, h: 1, layer: 'wall', price: 120, wall(x) {
    shadowWall(x + 4, 16, 24, 42); panel(x + 4, 16, 24, 42, '#1a1430');
    for (let n = 0; n < 8; n++) P(x + 6 + hash(n, 3) * 20, 18 + hash(n, 4) * 30, '#ffffff');
    stamp(['..#.....#..', '...#...#...', '..#######..', '.##.###.##.', '###########', '#.#######.#', '#.#.....#.#', '...##.##...'], x + 5, 21, { '#': k.c }, 2);
    tri(x + 16, 43, 4, '#58f0f8', 1); R(x + 6, 48, 20, 1, '#58f0f8'); R(x + 8, 52, 16, 2, '#f8d030');
  } },
]);

/* ---------- greenhouse ---------- */
/** A glass dome on a wooden stand with a garden in it. */
function terrarium(x, b, grow) {
  floorShadow(x, b, 32); for (const i of [5, 24]) cyl(x + i, b - 20, 3, 20, k.w); wood(x + 2, b - 24, 28, 5, k.w);
  const cx = x + 16, base = b - 25;
  for (let j = 0; j < 40; j++) { const hw = j < 14 ? Math.sqrt(1 - ((14 - j) / 14) ** 2) * 13 : 13; R(cx - hw, base - 40 + j, hw * 2, 1, '#d8eef4'); }
  R(x + 4, base - 6, 24, 6, '#5a3a24'); R(x + 4, base - 2, 24, 2, STONE); speckle(x + 4, base - 6, 24, 4, '#7a5a3a', 12, 0.2);
  grow(cx, base - 6);
  line(cx - 9, base - 34, cx - 11, base - 14, '#ffffff'); P(cx - 6, base - 37, '#ffffff');
  R(x + 2, base - 1, 28, 2, BRASS); disc(cx, base - 41, 2, BRASS);
}
const JARS = {
  moss: ['Moss', (cx, s) => { for (let i = -11; i <= 11; i++) { const hgt = 3 + Math.round(Math.sin(i / 3) * 2 + 2); R(cx + i, s - hgt, 1, hgt, i % 3 ? '#5a9a3a' : '#7aba4a'); } ovalShade(cx + 5, s - 6, 4, 3, STONE); for (const i of [-6, -2]) { R(cx + i, s - 10, 1, 4, '#f4f0e0'); oval(cx + i, s - 10, 2, 1, '#e04848'); } }],
  fern: ['Fern', (cx, s) => { for (const [a, l] of [[-0.9, 14], [-0.4, 18], [0, 20], [0.4, 18], [0.9, 14]]) for (let t = 2; t < l; t += 2) { const px = cx + Math.sin(a) * t, py = s - Math.cos(a) * t + t * t * 0.02; R(px - 2, py, 5, 1, t % 4 ? k.leaf : sh(k.leaf, 1)); P(px, py, sh(k.leaf, -1)); } }],
  cactus: ['Cactus', (cx, s) => { cyl(cx - 3, s - 22, 6, 22, '#5a9a4a'); cyl(cx - 9, s - 14, 4, 8, '#5a9a4a'); R(cx - 6, s - 10, 3, 3, '#5a9a4a'); cyl(cx + 4, s - 18, 4, 9, '#5a9a4a'); R(cx + 3, s - 12, 2, 3, '#5a9a4a'); for (let j = s - 20; j < s - 2; j += 4) P(cx, j, '#f0f0d0'); flower(cx, s - 24, '#f878a8'); ovalShade(cx + 8, s - 2, 3, 2, STONE); }],
  pitcher: ['Pitcher plant', (cx, s) => { for (const [i, hgt] of [[-6, 16], [1, 22], [7, 13]]) { cyl(cx + i - 2, s - hgt, 5, hgt, '#8ab848'); R(cx + i - 2, s - hgt + 3, 5, 2, '#c84848'); oval(cx + i, s - hgt, 3, 1.5, '#a83838'); R(cx + i - 2, s - hgt - 4, 5, 3, '#c84848'); } leaf(cx - 9, s - 4, 3, 2, k.leaf, -0.5); }],
  mushroom: ['Mushroom', (cx, s) => { for (const [i, hgt, r, c] of [[-5, 12, 5, '#e04848'], [4, 8, 4, '#f0a040'], [9, 5, 3, '#58c8f0']]) { R(cx + i - 1, s - hgt, 3, hgt, '#f4ecd8'); for (let j = 0; j < r; j++) R(cx + i - r + j * 0.5, s - hgt - r + j, (r - j * 0.5) * 2 + 1, 1, j < 1 ? sh(c, 1) : c); P(cx + i - 2, s - hgt - 2, '#ffffff'); P(cx + i + 1, s - hgt - 3, '#ffffff'); } }],
  orchid: ['Orchid', (cx, s) => { leaf(cx - 4, s - 3, 5, 2, k.leaf, 0); leaf(cx + 4, s - 4, 5, 2, sh(k.leaf, 1), 0); for (let j = 0; j < 24; j++) P(cx + Math.round(j > 14 ? (j - 14) * 0.6 : 0), s - 4 - j, sh(k.leaf, -1)); for (let n = 0; n < 3; n++) { const fx = cx + 3 + n * 2, fy = s - 24 + n * 4; for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [-1, 2], [1, 2]]) disc(fx + dx, fy + dy, 1.4, k.c); P(fx, fy, '#f8e070'); P(fx, fy + 1, sh(k.c, -2)); } }],
};
add('Greenhouse', Object.entries(JARS).map(([id, [name, grow]]) => ({ id: `${id}terrarium`, name: `${name} terrarium`, w: 1, h: 1, price: 380,
  draw(x, b) { terrarium(x, b, grow); } })));
add('Greenhouse', [
  { id: 'glasspanel', name: 'Greenhouse glass', w: 2, h: 1, layer: 'wall', price: 600, sky: true, wall(x) {
    const F = '#f0f2ee'; view(x + 2, 4, 60, 88);
    for (const i of [0, 21, 42, 60]) { R(x + i, 2, 4, 92, F); R(x + i + 3, 2, 1, 92, sh(F, -1)); }
    for (const j of [2, 33, 64, 90]) { R(x, j, 64, 3, F); R(x, j + 2, 64, 1, sh(F, -1)); }
    for (const [i, j] of [[8, 14], [29, 44], [50, 74]]) line(x + i, j + 8, x + i + 8, j, '#ffffff');
    for (let i = 4; i < 60; i += 3) { const j = 35 + Math.round(Math.sin(i / 5) * 2); leaf(x + i, j + 3, 1, 2, i % 2 ? k.leaf : sh(k.leaf, 1), 0); }
  } },
  { id: 'pottingbench', name: 'Potting bench', w: 2, h: 1, price: 800, draw(x, b, vw, dir) {
    if (dir % 2) return sideBox(x, b, vw, 36);
    floorShadow(x, b, vw); for (const i of [3, vw - 7]) { cyl(x + i, b - 36, 4, 36, k.w); cyl(x + i, b - 72, 3, 36, k.w); }
    wood(x + 2, b - 72, vw - 4, 9, k.w); R(x + 10, b - 66, 1, 8, k.m); line(x + 10, b - 58, x + 8, b - 52, k.m, 2); R(x + 20, b - 66, 1, 6, k.m); panel(x + 18, b - 61, 5, 6, k.m);
    wood(x + 3, b - 12, vw - 6, 3, k.w); for (let n = 0; n < 4; n++) cyl(x + 8 + n * 7, b - 20, 6, 8, k.pot);
    wood(x + 1, b - 38, vw - 2, 5, k.w);
    cyl(x + 30, b - 50, 10, 12, k.pot); R(x + 30, b - 50, 10, 2, '#3a2416'); leaf(x + 33, b - 54, 2, 3, k.leaf, -0.5); leaf(x + 38, b - 55, 2, 4, k.leaf, 0.5);
    oval(x + 14, b - 40, 8, 3, '#5a3a24'); panel(x + 46, b - 48, 9, 10, '#f4f0e0'); flower(x + 50, b - 44, k.c);
    line(x + 6, b - 40, x + 12, b - 44, k.m); R(x + 4, b - 40, 3, 2, k.w);
  } },
  { id: 'seedrack', name: 'Seed rack', w: 1, h: 1, price: 340, draw(x, b) {
    floorShadow(x, b, 32); for (const i of [2, 28]) cyl(x + i, b - 84, 2, 84, k.m); panel(x + 2, b - 90, 28, 7, k.c);
    for (let r = 0; r < 5; r++) {
      const ry = b - 80 + r * 15; R(x + 2, ry + 12, 28, 1, k.m);
      for (let n = 0; n < 4; n++) { const px = x + 4 + n * 6.5; panel(px, ry, 6, 11, '#f4f0e0'); disc(px + 3, ry + 4, 2, RAINBOW[(r * 4 + n) % 7]); R(px + 1, ry + 8, 4, 1, k.leaf); }
    }
  } },
  { id: 'sprinkler', name: 'Sprinkler', w: 1, h: 1, price: 220, draw(x, b) {
    floorShadow(x + 8, b, 16);
    for (const [s, top, len] of [[-1, 22, 15], [1, 22, 15], [-1, 14, 10], [1, 16, 11]]) for (let n = 0; n < 24; n++) { const t = n / 24; P(x + 16 + s * t * len, b - 34 - Math.sin(t * Math.PI) * top + t * 30, n % 2 ? WATER : sh(WATER, 1)); }
    R(x + 15, b - 30, 2, 30, k.m); R(x + 12, b - 33, 8, 3, k.m); disc(x + 16, b - 34, 2, k.c);
  } },
  { id: 'growlamp', name: 'Grow lamp', w: 1, h: 1, price: 480, glow: ['#e878f0', '#f8c8f8'], draw(x, b) {
    floorShadow(x, b, 32);
    for (let j = 0; j < 44; j += 3) for (let i = 0; i < 20; i += 2) if (hash(i, j, 4) < 0.18) P(x + 5 + i, b - 58 + j, '#f8c8f8');
    panel(x + 2, b - 8, 28, 8, k.m); R(x + 3, b - 9, 26, 2, '#5a3a24');
    for (let n = 0; n < 6; n++) { const sx = x + 5 + n * 4.4; R(sx, b - 14, 1, 5, sh(k.leaf, -1)); P(sx - 1, b - 15, k.leaf); P(sx + 1, b - 15, k.leaf); P(sx - 1, b - 14, sh(k.leaf, 1)); }
    cyl(x + 28, b - 70, 3, 62, k.m); R(x + 6, b - 70, 24, 3, k.m); panel(x + 4, b - 67, 22, 5, k.m); R(x + 5, b - 62, 20, 2, '#e878f0');
  } },
  { id: 'flytrap', name: 'Venus flytrap', w: 1, h: 1, price: 300, draw(x, b) {
    floorShadow(x + 4, b, 24); const top = potAt(x, b);
    for (const [i, j] of [[8, -14], [16, -28], [24, -16]]) {
      const tx = x + i, ty = top + j; line(x + 16, top, tx, ty + 3, sh(k.leaf, -1));
      oval(tx, ty - 2, 4, 2.5, k.leaf); oval(tx, ty - 1, 3, 1, '#d84848'); oval(tx, ty + 3, 4, 2, sh(k.leaf, -1)); oval(tx, ty + 2, 3, 1, '#c83838');
      for (let t = 0; t < 4; t++) { P(tx - 3 + t * 2, ty - 5, '#e8f0a0'); P(tx - 3 + t * 2, ty + 5, '#e8f0a0'); }
    }
  } },
  { id: 'monstera', name: 'Monstera', w: 1, h: 1, price: 420, draw(x, b) {
    floorShadow(x + 2, b, 28); const top = potAt(x, b, 'basket');
    for (const [i, j, d] of [[9, -38, -1], [24, -46, 1], [15, -62, 0], [23, -26, 1], [8, -24, -1]]) {
      const cx = x + i, cy = b + j; line(x + 16, top, cx, cy + 4, sh(k.leaf, -1));
      const side = d || 1;
      ovalShade(cx, cy, 9, 7, k.leaf); line(cx - side * 7, cy + 3, cx + side * 6, cy - 3, sh(k.leaf, -1));
      // the splits run in from the leaf's edge, cut right through so the outline follows them
      for (let s = -2; s <= 2; s++) if (s) for (let t = 0; t < 4; t++) clear(Math.round(cx + side * (2 + Math.abs(s) * 1.5 + t)), Math.round(cy + s * 2.4 - side * t * 0.3), 1, 1);
      clear(cx - side * 2, cy - 2, 1, 1); clear(cx - side * 3, cy + 2, 1, 1);
    }
  } },
  { id: 'stringpearls', name: 'String of pearls', w: 1, h: 1, layer: 'wall', price: 220, wall(x) {
    R(x + 15, 0, 2, 10, k.m); line(x + 16, 10, x + 8, 24, k.m); line(x + 16, 10, x + 24, 24, k.m);
    ovalShade(x + 16, 28, 9, 6, k.pot); R(x + 7, 23, 18, 2, sh(k.pot, 1));
    for (let s = 0; s < 7; s++) { const sx = x + 9 + s * 2.4, len = 30 + hash(s, 3) * 30; for (let j = 0; j < len; j += 3) disc(sx + Math.sin(j / 6 + s) * 2, 32 + j, 1.3, j % 2 ? k.leaf : sh(k.leaf, 1)); }
  } },
  { id: 'orchidstand', name: 'Orchid', w: 1, h: 1, price: 360, draw(x, b) {
    floorShadow(x + 4, b, 24); for (const i of [9, 21]) cyl(x + i, b - 16, 2, 16, k.w); panel(x + 7, b - 20, 18, 4, k.w);
    cyl(x + 10, b - 30, 12, 10, k.pot); R(x + 10, b - 30, 12, 2, '#3a2416');
    leaf(x + 10, b - 32, 6, 2, k.leaf, 0); leaf(x + 21, b - 33, 6, 2, sh(k.leaf, 1), 0);
    R(x + 15, b - 70, 1, 38, BAMBOO);
    for (let j = 0; j < 40; j++) P(x + 16 + Math.round(j > 22 ? (j - 22) * 0.45 : 0), b - 32 - j, sh(k.leaf, -1));
    for (let n = 0; n < 4; n++) { const fx = x + 18 + n * 2.5, fy = b - 70 + n * 7; for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [-1, 2], [1, 2]]) disc(fx + dx, fy + dy, 1.5, k.c); P(fx, fy, '#f8e070'); P(fx, fy + 1, sh(k.c, -2)); }
  } },
  { id: 'compostbin', name: 'Compost bin', w: 1, h: 1, price: 200, draw(x, b) {
    floorShadow(x, b, 32); R(x + 3, b - 44, 26, 44, '#4a3020');
    for (let r = 0; r < 5; r++) wood(x + 2, b - 8 - r * 9, 28, 6, k.w);
    for (const i of [2, 27]) cyl(x + i, b - 46, 3, 46, sh(k.w, -1));
    oval(x + 16, b - 45, 12, 4, '#5a3a24'); speckOval(x + 16, b - 45, 11, 3, '#7a5a3a', 3, 0.3);
    R(x + 11, b - 48, 4, 2, '#f8d030'); leaf(x + 20, b - 47, 2, 1, k.leaf, 0); P(x + 16, b - 46, '#ffffff');
  } },
  { id: 'tomatovine', name: 'Tomato plant', w: 1, h: 1, price: 260, draw(x, b) {
    floorShadow(x + 4, b, 24); const top = potAt(x, b);
    for (const i of [9, 23]) R(x + i, b - 84, 1, 66, BAMBOO); for (const j of [-40, -64]) R(x + 9, b + j, 15, 1, BAMBOO);
    for (let j = 0; j < 60; j++) P(x + 16 + Math.round(Math.sin(j / 8) * 4), top - j, sh(k.leaf, -1));
    foliage(x + 12, top - 20, 6, k.leaf, 1); foliage(x + 20, top - 36, 6, k.leaf, 2); foliage(x + 13, top - 52, 5, k.leaf, 3);
    sphere(x + 18, top - 15, 3, '#e04838'); sphere(x + 9, top - 30, 3, '#e04838'); sphere(x + 23, top - 46, 2.5, '#f08a38'); sphere(x + 15, top - 60, 2.5, '#78c048');
  } },
  { id: 'citrustree', name: 'Lemon tree', w: 1, h: 1, price: 560, draw(x, b) {
    floorShadow(x + 2, b, 28); panel(x + 6, b - 18, 20, 18, k.pot); R(x + 7, b - 18, 18, 2, '#3a2416'); R(x + 6, b - 12, 20, 1, sh(k.pot, -1));
    cyl(x + 15, b - 46, 3, 28, k.w);
    foliage(x + 10, b - 52, 7, k.leaf, 8); foliage(x + 23, b - 52, 7, k.leaf, 9); foliage(x + 16, b - 60, 12, k.leaf, 7);
    for (let n = 0; n < 7; n++) sphere(x + 7 + hash(n, 1) * 18, b - 68 + hash(n, 2) * 20, 2, '#f8e040');
  } },
  { id: 'lilytub', name: 'Water lily tub', w: 1, h: 1, price: 380, draw(x, b) {
    floorShadow(x, b, 32);
    R(x + 24, b - 50, 1, 32, k.leaf); R(x + 23, b - 50, 3, 8, '#7a4a2a'); R(x + 27, b - 44, 1, 26, sh(k.leaf, 1)); R(x + 26, b - 44, 3, 6, '#7a4a2a');
    cyl(x + 2, b - 18, 28, 18, k.w); for (let i = 6; i < 28; i += 5) R(x + i, b - 17, 1, 16, sh(k.w, -1)); for (const j of [-14, -6]) R(x + 2, b + j, 28, 2, k.m);
    oval(x + 16, b - 18, 14, 3, sh(WATER, -1)); oval(x + 16, b - 18, 12, 2, WATER);
    oval(x + 9, b - 18, 4, 1.5, k.leaf); oval(x + 20, b - 19, 3, 1.2, sh(k.leaf, 1)); tri(x + 12, b - 25, 6, k.c, 0.7); tri(x + 12, b - 23, 3, sh(k.c, 1), 0.5);
  } },
  { id: 'seedtrays', name: 'Seed trays', w: 2, h: 1, price: 260, high: 0.18, side: 'm', flat(w, h) {
    for (const t of [0, 1]) {
      const tx = 1 + t * 32; panel(tx, 1, 30, h - 2, k.m); inset(tx + 2, 3, 26, h - 6, '#4a3020');
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { const cx = tx + 3 + c * 6.5, cy = 4 + r * 6.5; R(cx, cy, 5, 5, '#5a3a24'); if (hash(c, r, t) < 0.8) { P(cx + 2, cy + 2, k.leaf); P(cx + 1, cy + 1, sh(k.leaf, 1)); P(cx + 3, cy + 1, sh(k.leaf, 1)); } }
    }
  } },
  { id: 'beanpole', name: 'Bean poles', w: 1, h: 1, price: 240, draw(x, b) {
    floorShadow(x, b, 32); oval(x + 16, b - 3, 13, 3, '#5a3a24');
    const poles = [[3, 16], [29, 16], [16, 16]];
    for (const [x0, x1] of poles) line(x + x0, b - 2, x + x1, b - 88, BAMBOO, 2); R(x + 14, b - 84, 5, 2, k.c);
    poles.forEach(([x0, x1], p) => { for (let t = 0.05; t < 0.92; t += 0.03) { const px = x + x0 + (x1 - x0) * t + Math.sin(t * 30 + p) * 2.5, py = b - 2 - 86 * t; P(px, py, sh(k.leaf, -1)); if (Math.round(t * 100) % 9 === 0) leaf(px + 2, py, 2, 1, k.leaf, 0); if (Math.round(t * 100) % 21 === 0) R(px - 2, py, 1, 5, sh(k.leaf, 1)); if (Math.round(t * 100) % 26 === 0) P(px + 1, py - 1, k.c); } });
  } },
  { id: 'thermometer', name: 'Garden thermometer', w: 1, h: 1, layer: 'wall', price: 140, wall(x) {
    shadowWall(x + 8, 10, 16, 70); panel(x + 8, 10, 16, 70, k.w, 2);
    disc(x + 16, 18, 5, '#f8d030'); P(x + 14, 17, INK); P(x + 18, 17, INK); R(x + 15, 20, 3, 1, INK);
    R(x + 15, 26, 3, 44, '#f4f4f0'); R(x + 16, 44, 1, 26, '#e04838'); disc(x + 16, 72, 3, '#e04838');
    for (let j = 0; j < 11; j++) { R(x + 12, 28 + j * 4, 2, 1, INK); R(x + 19, 28 + j * 4, j % 2 ? 1 : 2, 1, INK); }
  } },
  { id: 'plantstair', name: 'Plant stand', w: 1, h: 1, price: 360, draw(x, b) {
    floorShadow(x, b, 32); line(x + 3, b, x + 13, b - 68, k.w, 2); line(x + 29, b, x + 19, b - 68, k.w, 2);
    for (let s = 0; s < 3; s++) {
      const left = x + 2 + s * 4, wdt = 28 - s * 8, sy = b - 20 - s * 22; wood(left, sy, wdt, 3, k.w);
      for (let n = 0; n < 3 - s; n++) { const px = left + 2 + n * 8 + s; cyl(px, sy - 7, 6, 7, k.pot); if ((n + s) % 2) { leaf(px + 1, sy - 10, 1, 3, k.leaf, -0.4); leaf(px + 5, sy - 10, 1, 3, k.leaf, 0.4); } else { R(px + 2, sy - 12, 1, 5, sh(k.leaf, -1)); flower(px + 3, sy - 13, n ? k.c : k.a); } }
    }
  } },
  { id: 'gourdarch', name: 'Gourd arch', w: 2, h: 1, price: 900, draw(x, b, vw, dir) {
    if (dir % 2) { floorShadow(x + 6, b, 20); cyl(x + 14, b - 80, 4, 80, k.w); foliage(x + 16, b - 80, 8, k.leaf, 3); ovalShade(x + 20, b - 64, 3, 5, '#e8c048'); return; }
    floorShadow(x, b, vw); for (const i of [3, vw - 7]) cyl(x + i, b - 60, 4, 60, k.w);
    arc(x + vw / 2, b - 58, vw / 2 - 5, 24, Math.PI, Math.PI * 2, k.w, 3);
    for (let n = 0; n < 24; n++) { const a = Math.PI + n / 23 * Math.PI; oval(x + vw / 2 + Math.cos(a) * (vw / 2 - 4), b - 57 + Math.sin(a) * 24, 3, 2, n % 2 ? k.leaf : sh(k.leaf, 1)); }
    for (const [i, c] of [[14, '#e8c048'], [26, '#7aa848'], [40, '#e8c048'], [50, '#f09838']]) {
      const a = Math.PI + (i - 2) / (vw - 4) * Math.PI, ty = b - 56 + Math.sin(a) * 24;
      R(x + i, ty, 1, 6, sh(k.leaf, -1)); disc(x + i, ty + 8, 2.5, c); ovalShade(x + i, ty + 14, 4, 5, c);
    }
  } },
  { id: 'mosswall', name: 'Living wall', w: 2, h: 1, layer: 'wall', price: 620, wall(x) {
    shadowWall(x + 2, 8, 60, 80); panel(x + 2, 8, 60, 80, k.w, 2); inset(x + 5, 11, 54, 74, '#3a2a1a');
    clipped(x + 5, 11, 54, 74, () => {
      for (let n = 0; n < 60; n++) {
        const cx = x + 8 + hash(n, 1) * 48, cy = 14 + hash(n, 2) * 68, s = n % 4;
        if (s === 0) foliage(cx, cy, 5, k.leaf, n); else if (s === 1) leaf(cx, cy, 2, 4, sh(k.leaf, 1), hash(n, 3) - 0.5); else if (s === 2) disc(cx, cy, 3, '#6a9a3a'); else flower(cx, cy, k.c);
      }
    });
  } },
]);

/* ---------- station ---------- */
/** A boiler or tank lying on its side: shaded top to bottom. */
function hcyl(x, y, w, h, c) {
  for (let j = 0; j < h; j++) { const t = j / (h - 1); R(x, y + j, w, 1, t < 0.15 ? sh(c, 1) : t < 0.3 ? sh(c, 2) : t > 0.8 ? sh(c, -1) : c); }
}
/** A display plinth with a length of track on top; returns the rail's line. */
function display(x, b, vw) {
  floorShadow(x, b, vw); panel(x + 1, b - 12, vw - 2, 12, k.w, 2); R(x + vw / 2 - 6, b - 9, 12, 4, BRASS);
  for (let i = 3; i < vw - 4; i += 4) R(x + i, b - 15, 2, 3, '#6a4a30');
  R(x + 2, b - 15, vw - 4, 1, CHROME); R(x + 2, b - 14, vw - 4, 1, sh(CHROME, -2));
  return b - 15;
}
const LOCOS = {
  steam: ['Steam engine', (x, r) => {
    for (const i of [12, 24, 36]) rim(x + i, r - 6, 6, k.c); for (const i of [46, 53]) rim(x + i, r - 3, 3, k.c);
    hcyl(x + 8, r - 27, 46, 14, k.m); for (const i of [22, 32, 42]) R(x + i, r - 27, 1, 14, BRASS);
    R(x + 6, r - 13, 52, 3, sh(k.m, -1)); R(x + 6, r - 13, 52, 1, k.c);
    cyl(x + 46, r - 39, 6, 12, k.m); R(x + 44, r - 41, 10, 3, k.m); ovalShade(x + 33, r - 28, 4, 3, BRASS);
    panel(x + 2, r - 40, 16, 27, k.c, 2); inset(x + 5, r - 36, 10, 9, '#bfe0f0'); R(x + 1, r - 43, 18, 3, k.m);
    line(x + 12, r - 6, x + 36, r - 6, CHROME, 2);
    for (let j = 0; j < 8; j++) R(x + 55, r - 9 + j, Math.min(8, j + 2), 1, sh(k.m, -1));
    disc(x + 56, r - 31, 2, '#fff4c0'); disc(x + 49, r - 46, 4, '#f4f4f8'); disc(x + 54, r - 51, 3, '#e8ecf4');
  }],
  diesel: ['Diesel engine', (x, r) => {
    for (const i of [10, 18, 44, 52]) rim(x + i, r - 3, 3, k.m); R(x + 6, r - 8, 18, 3, k.m); R(x + 40, r - 8, 18, 3, k.m);
    panel(x + 4, r - 32, 56, 24, k.c, 2); R(x + 4, r - 18, 56, 4, k.a); R(x + 4, r - 14, 56, 1, sh(k.a, -1));
    inset(x + 7, r - 29, 8, 7, '#bfe0f0'); inset(x + 49, r - 29, 8, 7, '#bfe0f0'); for (let n = 0; n < 8; n++) R(x + 20 + n * 3, r - 28, 1, 8, sh(k.c, -1));
    R(x + 6, r - 34, 52, 2, k.m); R(x + 29, r - 37, 6, 3, CHROME); disc(x + 58, r - 12, 1.5, '#fff4c0');
  }],
  bullet: ['Bullet train', (x, r) => {
    for (const i of [12, 20, 44, 52]) rim(x + i, r - 3, 3, k.m);
    for (let i = 0; i < 60; i++) {
      const top = r - 28 + (i > 40 ? Math.round(((i - 40) / 20) ** 2 * 16) : 0);
      R(x + 2 + i, top, 1, r - 6 - top, '#f4f4f0'); P(x + 2 + i, top, '#ffffff'); if (top < r - 12) R(x + 2 + i, r - 14, 1, 3, k.c);
    }
    for (let i = 6; i < 40; i += 5) R(x + 2 + i, r - 24, 3, 4, '#3a4a6a'); line(x + 44, r - 24, x + 52, r - 19, '#3a4a6a', 2);
    R(x + 2, r - 8, 58, 2, k.m);
  }],
  tram: ['Tram', (x, r) => {
    for (const i of [16, 48]) { rim(x + i - 4, r - 3, 3, k.m); rim(x + i + 4, r - 3, 3, k.m); }
    panel(x + 6, r - 36, 52, 30, k.c, 2); R(x + 6, r - 15, 52, 9, k.p); R(x + 6, r - 16, 52, 1, k.a);
    for (let n = 0; n < 6; n++) inset(x + 9 + n * 8, r - 32, 6, 11, '#bfe0f0');
    panel(x + 8, r - 40, 48, 4, k.m); line(x + 28, r - 40, x + 34, r - 50, INK); line(x + 40, r - 40, x + 34, r - 50, INK); R(x + 26, r - 51, 16, 1, INK);
    R(x + 46, r - 39, 8, 3, INK); P(x + 48, r - 38, '#f8d030'); P(x + 50, r - 38, '#f8d030');
  }],
  monorail: ['Monorail', (x, r) => {
    panel(x + 2, r - 6, 60, 8, STONE); R(x + 4, r - 4, 56, 1, sh(STONE, -1));
    cushion(x + 4, r - 30, 56, 22, k.c, 8); R(x + 8, r - 26, 48, 6, '#3a4a6a'); for (let i = 14; i < 56; i += 8) R(x + i, r - 26, 1, 6, k.c);
    R(x + 6, r - 16, 52, 2, k.a); R(x + 10, r - 10, 44, 2, k.m);
  }],
  minecart: ['Mine cart', (x, r) => {
    rim(x + 20, r - 3, 3, k.m); rim(x + 42, r - 3, 3, k.m);
    for (let j = 0; j < 18; j++) { const hw = 22 - j * 0.3; R(x + 31 - hw, r - 24 + j, hw * 2, 1, j < 2 ? sh(k.m, 1) : k.m); }
    for (const j of [-20, -12]) R(x + 10, r + j, 42, 1, sh(k.m, -1)); for (const i of [14, 31, 47]) R(x + i, r - 23, 1, 16, sh(k.m, -1));
    for (let n = 0; n < 16; n++) disc(x + 13 + hash(n, 1) * 36, r - 25 - hash(n, 2) * 6, 2.5, n % 4 ? '#5a5050' : ['#a858d8', '#58c8f0', '#f05878'][n % 3]);
  }],
};
add('Station', Object.entries(LOCOS).map(([id, [name, paint]]) => ({ id: `${id}loco`, name: `${name} model`, w: 2, h: 1, price: 980,
  draw(x, b, vw, dir) { if (dir % 2) return sideBox(x, b, vw, 30); paint(x, display(x, b, vw)); } })));
add('Station', [
  { id: 'platformbench', name: 'Platform bench', w: 2, h: 1, price: 600, seat: 'cushion', draw(x, b, vw, dir) {
    floorShadow(x, b, vw);
    if (dir % 2) { R(x + 4, b - 50, 4, 50, k.m); R(x + 24, b - 22, 4, 22, k.m); wood(x + 2, b - 26, vw - 4, 4, k.w); wood(dir === 1 ? x + 22 : x + 4, b - 52, 6, 26, k.w, 'y'); return; }
    for (const i of [3, vw - 9]) { R(x + i, b - 22, 6, 22, k.m); ring(x + i + 3, b - 9, 3, sh(k.m, 1)); R(x + i - 1, b - 2, 8, 2, k.m); }
    for (const i of [4, vw - 7]) R(x + i, b - 54, 3, 30, k.m);
    for (let n = 0; n < 3; n++) wood(x + 3, b - 52 + n * 8, vw - 6, 5, k.w);
    for (let n = 0; n < 2; n++) wood(x + 1, b - 26 + n * 3, vw - 2, 3, k.w);
  } },
  { id: 'stationclock', name: 'Station clock', w: 1, h: 1, layer: 'wall', price: 380, wall(x) {
    R(x + 14, 4, 4, 10, k.m); R(x + 10, 4, 12, 2, k.m);
    disc(x + 16, 32, 14, k.m); ring(x + 16, 32, 13, BRASS); disc(x + 16, 32, 12, '#f8f6ec');
    for (let h = 0; h < 12; h++) { const a = h * Math.PI / 6; R(x + 16 + Math.cos(a) * 10, 32 + Math.sin(a) * 10, h % 3 ? 1 : 2, h % 3 ? 1 : 2, INK); }
    line(x + 16, 32, x + 16, 24, INK, 2); line(x + 16, 32, x + 22, 35, INK); line(x + 16, 32, x + 11, 40, '#e04848'); disc(x + 16, 32, 1.5, INK);
  } },
  { id: 'departures', name: 'Departures board', w: 2, h: 1, layer: 'wall', price: 700, glow: ['#f8c838'], wall(x) {
    R(x + 12, 0, 2, 16, k.m); R(x + 50, 0, 2, 16, k.m);
    shadowWall(x + 2, 16, 60, 46); panel(x + 2, 16, 60, 46, k.m, 2); inset(x + 4, 18, 56, 42, '#141418'); R(x + 5, 19, 54, 6, k.c);
    for (let r = 0; r < 5; r++) for (let c = 0; c < 15; c++) {
      const cx = Math.round(x + 6 + c * 3.5), y = 28 + r * 6; R(cx, y, 3, 5, '#2a2a30'); R(cx, y + 2, 3, 1, '#0a0a0c');
      if (c === 4) continue;
      for (let p = 0; p < 4; p++) if (hash(r * 20 + c, p) < 0.55) P(cx + (p % 2) * 2, y + (p >> 1) * 3 + (p % 3 ? 1 : 0), '#f8c838');
    }
  } },
  { id: 'ticketgate', name: 'Ticket gate', w: 1, h: 1, price: 700, glow: ['#58e878'], draw(x, b) {
    floorShadow(x, b, 32);
    for (const i of [1, 22]) { panel(x + i, b - 40, 9, 40, k.m, 2); R(x + i, b - 42, 9, 3, k.c); }
    R(x + 3, b - 37, 5, 1, INK); for (let j = 0; j < 4; j++) R(x + 4 + j % 2, b - 31 + j, 3 - Math.abs(j - 1.5), 1, '#58e878'); R(x + 3, b - 30, 2, 2, '#58e878');
    panel(x + 10, b - 30, 6, 10, k.c); panel(x + 16, b - 30, 6, 10, k.c); R(x + 23, b - 39, 7, 4, '#58b8f8');
  } },
  { id: 'ticketmachine', name: 'Ticket machine', w: 1, h: 1, price: 760, glow: ['#68c8f8'], draw(x, b) {
    floorShadow(x, b, 32); panel(x + 3, b - 82, 26, 82, k.c, 2); R(x + 5, b - 80, 22, 6, k.m); R(x + 12, b - 79, 8, 4, '#f8f0d0');
    inset(x + 6, b - 70, 20, 16, '#1a3048'); line(x + 8, b - 60, x + 24, b - 64, '#68c8f8'); line(x + 10, b - 66, x + 22, b - 58, '#68c8f8');
    for (const [i, j] of [[8, -60], [16, -62], [24, -64], [16, -62]]) disc(x + i, b + j, 1, '#ffffff');
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) R(x + 7 + c * 4, b - 50 + r * 4, 3, 3, CHROME);
    R(x + 22, b - 50, 2, 6, INK); R(x + 20, b - 40, 6, 1, INK);
    inset(x + 8, b - 30, 16, 6, INK); R(x + 12, b - 29, 8, 3, '#f8f0d0');
  } },
  { id: 'luggagecart', name: 'Luggage trolley', w: 1, h: 1, price: 420, draw(x, b) {
    floorShadow(x, b, 32); line(x + 28, b - 8, x + 30, b - 56, k.m, 2); R(x + 26, b - 58, 6, 2, k.m);
    panel(x + 3, b - 26, 22, 18, k.c, 2); for (const i of [8, 18]) R(x + i, b - 26, 2, 18, sh(k.c, -2)); R(x + 12, b - 28, 4, 2, INK);
    panel(x + 5, b - 40, 16, 14, '#8a5a3a', 2); P(x + 6, b - 39, BRASS); P(x + 19, b - 39, BRASS); disc(x + 15, b - 33, 2, k.a);
    cyl(x + 8, b - 48, 10, 8, k.p); oval(x + 13, b - 48, 5, 1.5, sh(k.p, 1));
    R(x + 2, b - 8, 28, 3, k.m); disc(x + 6, b - 3, 3, INK); disc(x + 26, b - 3, 3, INK); P(x + 6, b - 3, CHROME); P(x + 26, b - 3, CHROME);
  } },
  { id: 'suitcases', name: 'Suitcase stack', w: 1, h: 1, price: 300, draw(x, b) {
    floorShadow(x, b, 32); let y = b;
    [[2, 28, 16, k.c], [4, 24, 14, '#8a5a3a'], [6, 20, 12, k.a], [8, 16, 10, k.p]].forEach(([i, wdt, hgt, c], n) => {
      y -= hgt; panel(x + i, y, wdt, hgt, c, 2); R(x + i + 4, y, 2, hgt, sh(c, -2)); R(x + i + wdt - 6, y, 2, hgt, sh(c, -2));
      for (const [px, py] of [[0, 0], [wdt - 1, 0], [0, hgt - 1], [wdt - 1, hgt - 1]]) P(x + i + px, y + py, BRASS);
      disc(x + i + wdt / 2 + 2, y + hgt / 2, 2, RAINBOW[(n * 2 + 1) % 7]);
    });
    R(x + 14, y - 2, 4, 2, INK);
  } },
  { id: 'railrug', name: 'Track rug', w: 2, h: 2, layer: 'rug', price: 260, high: 0.04, side: 'w', flat(w, h) {
    R(0, 0, w, h, '#8a8478'); speckle(0, 0, w, h, '#6a6458', 31, 0.2); speckle(0, 0, w, h, '#a8a498', 32, 0.1);
    for (let j = 2; j < h; j += 8) wood(6, j, w - 12, 4, k.w);
    for (const i of [16, 45]) { R(i, 0, 3, h, CHROME); R(i, 0, 1, h, sh(CHROME, 1)); R(i + 2, 0, 1, h, sh(CHROME, -2)); }
  } },
  { id: 'railsignal', name: 'Railway signal', w: 1, h: 1, price: 520, glow: ['#e83838'], draw(x, b) {
    floorShadow(x + 6, b, 20); panel(x + 11, b - 6, 10, 6, STONE); cyl(x + 14, b - 60, 4, 54, k.m);
    R(x + 19, b - 56, 1, 50, k.m); for (let j = b - 54; j < b - 6; j += 5) R(x + 19, j, 4, 1, k.m); R(x + 22, b - 56, 1, 50, k.m);
    panel(x + 8, b - 90, 16, 32, INK, 2);
    [['#e83838', 0], [sh('#f8c838', -2), 1], [sh('#48e070', -2), 2]].forEach(([c, n]) => { const cy = b - 84 + n * 10; R(x + 11, cy - 5, 10, 1, k.m); disc(x + 16, cy, 4, '#202024'); disc(x + 16, cy, 3, c); if (!n) P(x + 15, cy - 1, '#ffd0d0'); });
  } },
  { id: 'crossing', name: 'Level crossing', w: 1, h: 1, price: 480, glow: ['#ff4040'], draw(x, b) {
    floorShadow(x + 6, b, 20); cyl(x + 14, b - 74, 4, 74, '#f4f4f0'); for (let j = b - 70; j < b; j += 10) R(x + 14, j, 4, 4, INK);
    for (const [d, c] of [[1, '#e04848'], [0, '#f4f4f0']]) { line(x + 3, b - 89 + d, x + 29, b - 73 + d, c, 3); line(x + 3, b - 73 + d, x + 29, b - 89 + d, c, 3); }
    R(x + 4, b - 62, 24, 3, INK); disc(x + 6, b - 56, 4, INK); disc(x + 6, b - 56, 3, '#ff4040'); disc(x + 26, b - 56, 4, INK); disc(x + 26, b - 56, 3, sh('#ff4040', -2));
    R(x + 2, b - 61, 8, 1, k.m); R(x + 22, b - 61, 8, 1, k.m);
  } },
  { id: 'watertower', name: 'Water tower', w: 1, h: 1, price: 600, draw(x, b) {
    floorShadow(x, b, 32);
    line(x + 4, b, x + 8, b - 44, k.m, 2); line(x + 28, b, x + 24, b - 44, k.m, 2); line(x + 12, b, x + 13, b - 44, k.m); line(x + 20, b, x + 19, b - 44, k.m);
    line(x + 6, b - 18, x + 26, b - 34, k.m); line(x + 26, b - 18, x + 6, b - 34, k.m);
    cyl(x + 4, b - 74, 24, 30, k.w); for (let i = 8; i < 26; i += 4) R(x + 4 + i, b - 74, 1, 30, sh(k.w, -1)); for (const j of [-66, -52]) R(x + 4, b + j, 24, 1, INK);
    tri(x + 16, b - 88, 14, k.c, 0.9); line(x + 28, b - 56, x + 31, b - 40, k.m, 2);
  } },
  { id: 'stationlamp', name: 'Station lamp', w: 1, h: 1, price: 400, glow: ['#fff0b0', '#fffad8'], draw(x, b) {
    floorShadow(x + 6, b, 20); panel(x + 10, b - 8, 12, 8, k.m); cyl(x + 14, b - 70, 4, 62, k.m);
    for (const j of [-30, -66]) R(x + 12, b + j, 8, 2, sh(k.m, 1));
    for (let j = 0; j < 16; j++) { const hw = 5 + Math.round(Math.sin(j / 15 * Math.PI) * 2); R(x + 16 - hw, b - 86 + j, hw * 2, 1, j % 5 === 0 ? k.m : j < 5 ? '#fffad8' : '#fff0b0'); }
    R(x + 15, b - 85, 2, 15, k.m); tri(x + 16, b - 92, 6, k.m, 1); disc(x + 16, b - 93, 1.5, k.m);
  } },
  { id: 'timetable', name: 'Timetable', w: 1, h: 1, layer: 'wall', price: 120, wall(x) {
    shadowWall(x + 4, 14, 24, 44); panel(x + 4, 14, 24, 44, k.p); R(x + 4, 14, 24, 6, k.c); ring(x + 24, 17, 2, '#ffffff');
    for (let r = 0; r < 10; r++) { const y = Math.round(23 + r * 3.4); R(x + 6, y, 5, 1, INK); R(x + 13, y, 12 - (r % 3) * 2, 1, sh(k.p, -2)); }
  } },
  { id: 'newsstand', name: 'News stand', w: 1, h: 1, price: 380, draw(x, b) {
    floorShadow(x, b, 32); panel(x + 2, b - 60, 28, 60, k.w, 2);
    for (let i = 0; i < 30; i++) R(x + 1 + i, b - 67, 1, 6 + (i % 4 === 1 ? 1 : 0), (i >> 2) % 2 ? k.c : '#ffffff');
    for (let r = 0; r < 3; r++) {
      const ty = b - 54 + r * 16; R(x + 4, ty + 12, 24, 2, sh(k.w, -1));
      for (let n = 0; n < 3; n++) { const mx = x + 5 + n * 8, c = r === 2 ? '#f0f0e8' : RAINBOW[(r * 3 + n) % 7]; panel(mx, ty, 7, 12, c); R(mx + 1, ty + 2, 5, 1, r === 2 ? INK : '#ffffff'); for (let l = 0; l < 3; l++) R(mx + 1, ty + 5 + l * 2, 5, 1, r === 2 ? '#a8a8a0' : sh(c, -1)); }
    }
  } },
  { id: 'bufferstop', name: 'Buffer stop', w: 1, h: 1, price: 420, glow: ['#e83838'], draw(x, b) {
    floorShadow(x, b, 32); R(x, b - 3, 32, 2, CHROME);
    panel(x + 3, b - 24, 26, 21, k.m); line(x + 4, b - 4, x + 14, b - 22, sh(k.m, -1), 2); line(x + 28, b - 4, x + 18, b - 22, sh(k.m, -1), 2);
    panel(x + 1, b - 36, 30, 12, '#e04040', 2); for (let n = 0; n < 4; n++) line(x + 3 + n * 7, b - 26, x + 8 + n * 7, b - 34, '#ffffff', 2);
    for (const i of [7, 25]) { disc(x + i, b - 30, 4, CHROME); disc(x + i, b - 30, 2.5, sh(CHROME, -1)); }
    disc(x + 16, b - 40, 2.5, '#e83838'); R(x + 14, b - 37, 5, 1, k.m);
  } },
  { id: 'trainwindow', name: 'Carriage window', w: 2, h: 1, layer: 'wall', price: 520, sky: true, wall(x) {
    panel(x + 2, 12, 60, 60, k.c, 2); view(x + 8, 18, 48, 40); R(x + 7, 17, 50, 1, sh(k.c, -2)); R(x + 7, 17, 1, 42, sh(k.c, -2));
    R(x + 8, 36, 48, 2, k.m);
    for (const s of [0, 1]) for (let j = 0; j < 44; j++) { const wdt = 8 - Math.round(Math.sin(j / 43 * Math.PI) * 3); R(s ? x + 56 - wdt : x + 8, 16 + j, wdt, 1, (j >> 2) % 2 ? k.p : sh(k.p, -1)); }
    R(x + 4, 14, 56, 2, BRASS); wood(x + 4, 60, 56, 5, k.w); cyl(x + 40, 54, 5, 6, '#f4f4f0'); R(x + 45, 56, 2, 2, '#f4f4f0');
  } },
  { id: 'trainseat', name: 'Carriage seat', w: 2, h: 1, price: 900, seat: 'cushion', draw(x, b, vw, dir) {
    floorShadow(x, b, vw);
    if (dir % 2) { R(x + 4, b - 8, vw - 8, 8, k.m); cushion(x + 2, b - 22, vw - 4, 14, k.c, 3); cushion(dir === 1 ? x + vw - 10 : x + 2, b - 62, 8, 54, sh(k.c, -1), 3); return; }
    R(x + 4, b - 8, vw - 8, 8, k.m);
    for (const s of [0, 1]) {
      const sx = x + 3 + s * (vw / 2 - 2), sw = vw / 2 - 4;
      cushion(sx, b - 62, sw, 40, k.c, 4); for (let j = b - 54; j < b - 26; j += 4) for (let i = sx + 3 + ((j >> 2) % 2) * 2; i < sx + sw - 3; i += 4) P(i, j, sh(k.c, -1));
      R(sx + 4, b - 60, sw - 8, 9, '#f4f4f0'); R(sx + 4, b - 52, sw - 8, 1, sh('#f4f4f0', -1));
      cushion(sx, b - 24, sw, 12, sh(k.c, 1), 3);
    }
    for (const i of [0, vw / 2 - 2, vw - 5]) cushion(x + i, b - 32, 5, 14, k.m, 2);
  } },
  { id: 'coalcart', name: 'Coal wagon', w: 1, h: 1, price: 360, draw(x, b) {
    floorShadow(x, b, 32); R(x, b - 3, 32, 2, CHROME);
    line(x + 24, b - 28, x + 30, b - 46, k.w, 2);
    for (let n = 0; n < 16; n++) { const t = hash(n, 1); disc(x + 5 + t * 22, b - 27 - hash(n, 2) * 7 * Math.sin(t * Math.PI), 2.5, n % 4 ? '#2a2a30' : '#5a5a68'); }
    panel(x + 2, b - 26, 28, 16, k.m, 2); R(x + 2, b - 18, 28, 1, sh(k.m, -1)); R(x + 3, b - 26, 2, 16, sh(k.m, -2)); R(x + 27, b - 26, 2, 16, sh(k.m, -2));
    for (const i of [8, 24]) { disc(x + i, b - 6, 4, INK); disc(x + i, b - 6, 2, k.m); }
  } },
  { id: 'handcar', name: 'Handcar', w: 2, h: 1, price: 950, draw(x, b, vw, dir) {
    if (dir % 2) return sideBox(x, b, vw, 22);
    floorShadow(x, b, vw); R(x, b - 3, vw, 2, CHROME);
    for (const i of [12, vw - 12]) { disc(x + i, b - 7, 6, INK); disc(x + i, b - 7, 4, k.m); line(x + i - 3, b - 7, x + i + 3, b - 7, sh(k.m, -2)); line(x + i, b - 10, x + i, b - 4, sh(k.m, -2)); disc(x + i, b - 7, 1, CHROME); }
    wood(x + 2, b - 16, vw - 4, 5, k.w); R(x + 2, b - 11, vw - 4, 2, sh(k.w, -2));
    line(x + vw / 2 - 8, b - 16, x + vw / 2, b - 40, k.m, 2); line(x + vw / 2 + 8, b - 16, x + vw / 2, b - 40, k.m, 2); ring(x + vw / 2, b - 22, 4, k.m);
    line(x + 8, b - 34, x + vw - 8, b - 46, k.c, 3); R(x + 5, b - 37, 6, 3, k.w); R(x + vw - 11, b - 49, 6, 3, k.w); disc(x + vw / 2, b - 40, 2.5, BRASS);
  } },
]);

/* ---------- sky palace ---------- */
/** A cloud plinth with a gold ring and an orb floating over it; `paint` draws inside the orb. */
const ORBS = {
  sun: ['Sun', '#f8b830', (cx, cy) => { for (let n = 0; n < 12; n++) { const a = n / 12 * Math.PI * 2; line(cx + Math.cos(a) * 11, cy + Math.sin(a) * 11, cx + Math.cos(a) * 14, cy + Math.sin(a) * 14, GOLD); } disc(cx - 2, cy - 2, 4, '#fff0a0'); }],
  moon: ['Moon', '#3a4a8a', (cx, cy) => { disc(cx - 2, cy, 5, '#f8f0c0'); disc(cx + 1, cy - 2, 4.5, '#3a4a8a'); P(cx + 4, cy + 3, '#ffffff'); P(cx + 5, cy - 5, '#ffffff'); }],
  star: ['Star', '#9a68e8', (cx, cy) => motif('star', cx - 9, cy - 9, ink('#fff4a0', '#ffffff', '#c8a030', '#ffffff'), 2)],
  rain: ['Rain', '#4a98e8', (cx, cy) => { oval(cx, cy - 3, 6, 3, '#e8f0f8'); for (const i of [-4, 0, 4]) { line(cx + i, cy + 1, cx + i - 1, cy + 5, '#c8e8ff'); } }],
  wind: ['Wind', '#58c8b0', (cx, cy) => { arc(cx, cy, 6, 4, Math.PI * 0.2, Math.PI * 1.7, '#ffffff'); arc(cx + 1, cy, 3, 2, Math.PI * 0.2, Math.PI * 1.7, '#e8fff8'); line(cx - 8, cy + 5, cx + 4, cy + 5, '#ffffff'); }],
  thunder: ['Thunder', '#4a4a68', (cx, cy) => motif('bolt', cx - 9, cy - 8, ink('#f8e048', '#fff8a0', '#c8a020', '#ffffff'), 2)],
};
add('Sky Palace', Object.entries(ORBS).map(([id, [name, c, paint]]) => ({ id: `${id}orb`, name: `${name} orb`, w: 1, h: 1, price: 720, glow: [c, sh(c, 1)],
  draw(x, b) {
    floorShadow(x + 2, b, 28); puff(x + 16, b - 9, 13, 8);
    oval(x + 16, b - 24, 7, 2, sh(GOLD, -1)); oval(x + 16, b - 25, 6, 1, GOLD);
    for (let n = 0; n < 3; n++) P(x + 9 + n * 7, b - 30 - n % 2 * 3, '#ffffff');
    const cx = x + 16, cy = b - 52; sphere(cx, cy, 10, c); clipped(cx - 16, cy - 16, 32, 32, () => paint(cx, cy));
  } })));
add('Sky Palace', [
  { id: 'cloudbed', name: 'Cloud bed', w: 2, h: 3, price: 1400, high: 0.5, side: 'p', seat: 'bed', flat(w, h) {
    for (let n = 0; n < 22; n++) { const t = n / 22 * Math.PI * 2; disc(w / 2 + Math.cos(t) * (w / 2 - 7), h / 2 + Math.sin(t) * (h / 2 - 7), 7, sh(CLOUD, -1)); }
    for (let n = 0; n < 22; n++) { const t = n / 22 * Math.PI * 2; disc(w / 2 + Math.cos(t) * (w / 2 - 7) - 1, h / 2 + Math.sin(t) * (h / 2 - 7) - 1, 5.5, CLOUD); }
    oval(w / 2, h / 2, w / 2 - 7, h / 2 - 7, CLOUD);
    cushion(9, 12, w - 18, h - 22, k.p, 4); cushion(15, 14, w - 30, 12, '#ffffff', 4);
    cushion(9, 36, w - 18, h - 46, k.c, 4); for (let j = 44; j < h - 14; j += 8) for (let i = 14; i < w - 12; i += 8) P(i + (j % 16 ? 4 : 0), j, k.a);
  } },
  { id: 'cloudsofa', name: 'Cloud sofa', w: 2, h: 1, price: 1100, seat: 'cushion', draw(x, b, vw, dir) {
    floorShadow(x, b, vw);
    if (dir % 2) { puff(x + 16, b - 12, 13, 10); puff(dir === 1 ? x + 22 : x + 10, b - 34, 7, 14); return; }
    puff(x + vw / 2, b - 34, vw / 2 - 8, 14); puff(x + vw / 2, b - 12, vw / 2 - 4, 10); puff(x + 8, b - 20, 7, 12); puff(x + vw - 8, b - 20, 7, 12);
    cushion(x + 14, b - 40, 14, 12, k.c, 5); cushion(x + vw - 28, b - 40, 14, 12, k.a, 5);
    R(x + 9, b - 3, 4, 3, GOLD); R(x + vw - 13, b - 3, 4, 3, GOLD);
  } },
  { id: 'rainbowbridge', name: 'Rainbow arch', w: 2, h: 1, price: 1200, glow: RAINBOW, draw(x, b, vw, dir) {
    if (dir % 2) { floorShadow(x + 4, b, 24); for (let n = 0; n < 7; n++) R(x + 9 + n * 2, b - 64, 2, 56, RAINBOW[n]); puff(x + 16, b - 8, 12, 7); return; }
    floorShadow(x, b, vw);
    for (let n = 0; n < 7; n++) arc(x + vw / 2, b - 10, vw / 2 - 8 - n * 3, 56 - n * 3, Math.PI, Math.PI * 2, RAINBOW[n], 3);
    puff(x + 11, b - 9, 10, 8); puff(x + vw - 11, b - 9, 10, 8);
  } },
  { id: 'skythrone', name: 'Sky throne', w: 1, h: 1, price: 1300, seat: 'cushion', draw(x, b) {
    floorShadow(x, b, 32);
    for (const s of [-1, 1]) for (let f = 0; f < 6; f++) line(x + 16 + s * 5, b - 34, x + 16 + s * (7 + f * 1.2), b - 84 + f * 9, f % 2 ? '#ffffff' : '#e0e6f4', 3);
    panel(x + 9, b - 76, 14, 50, MARBLE, 2); R(x + 9, b - 76, 14, 3, GOLD); disc(x + 16, b - 66, 3, k.a); P(x + 15, b - 67, '#ffffff');
    panel(x + 5, b - 26, 22, 10, MARBLE); cushion(x + 6, b - 30, 20, 6, k.c, 2);
    for (const i of [3, 24]) panel(x + i, b - 38, 5, 14, GOLD);
    puff(x + 16, b - 8, 14, 7);
  } },
  { id: 'cloudrug', name: 'Cloud rug', w: 2, h: 2, layer: 'rug', price: 300, high: 0.04, side: 'c', flat(w, h) {
    for (let n = 0; n < 14; n++) { const t = n / 14 * Math.PI * 2; disc(w / 2 + Math.cos(t) * (w / 2 - 9), h / 2 + Math.sin(t) * (h / 2 - 11), 9, sh(k.c, -1)); }
    for (let n = 0; n < 14; n++) { const t = n / 14 * Math.PI * 2; disc(w / 2 + Math.cos(t) * (w / 2 - 9), h / 2 + Math.sin(t) * (h / 2 - 11), 7.5, k.c); }
    oval(w / 2, h / 2, w / 2 - 9, h / 2 - 11, k.c); oval(w / 2 - 3, h / 2 - 3, w / 2 - 16, h / 2 - 18, sh(k.c, 1));
    for (let n = 0; n < 8; n++) { const px = 14 + hash(n, 1) * (w - 28), py = 16 + hash(n, 2) * (h - 32); P(px, py, k.a); P(px - 1, py, sh(k.a, -1)); P(px + 1, py, sh(k.a, -1)); P(px, py - 1, sh(k.a, -1)); P(px, py + 1, sh(k.a, -1)); }
  } },
  { id: 'skyfountain', name: 'Sky fountain', w: 1, h: 1, price: 1000, draw(x, b) {
    floorShadow(x, b, 32);
    for (let j = 0; j < 8; j++) R(x + 3 + j * 0.4, b - 22 + j, 26 - j * 0.8, 1, j < 2 ? sh(MARBLE, 1) : MARBLE); R(x + 4, b - 18, 24, 1, GOLD);
    cyl(x + 14, b - 46, 4, 24, MARBLE); oval(x + 16, b - 46, 7, 2, MARBLE); oval(x + 16, b - 47, 5, 1, WATER); disc(x + 16, b - 52, 2, GOLD);
    for (const s of [-1, 1]) for (let n = 0; n <= 16; n++) { const t = n / 16; P(x + 16 + s * t * 11, b - 48 - Math.sin(t * Math.PI * 0.6) * 4 + t * t * 26, n % 2 ? WATER : sh(WATER, 1)); }
    oval(x + 16, b - 22, 12, 2.5, WATER); oval(x + 13, b - 23, 4, 1, sh(WATER, 2));
    puff(x + 16, b - 7, 14, 6);
  } },
  { id: 'wingcrest', name: 'Golden wings', w: 2, h: 1, layer: 'wall', price: 800, wall(x) {
    for (const s of [-1, 1]) for (let f = 0; f < 7; f++) { const len = 23 - f * 2.5, a = -0.55 + f * 0.2; line(x + 32 + s * 6, 40 + f, x + 32 + s * (6 + Math.cos(a) * len), 40 + Math.sin(a) * len * 0.9 + f * 2, f % 2 ? GOLD : sh(GOLD, 1), 3); }
    disc(x + 32, 41, 6, sh(GOLD, -1)); disc(x + 32, 41, 4, k.c); P(x + 30, 39, '#ffffff');
  } },
  { id: 'skywindow', name: 'Sky arch window', w: 2, h: 1, layer: 'wall', price: 900, sky: true, wall(x) {
    view(x + 10, 8, 44, 70);
    const cx = x + 32, cy = 30, rx = 22, ry = 22;
    for (let j = 4; j < 82; j++) for (let i = x + 6; i < x + 58; i++) {
      const dx = (i + 0.5 - cx) / rx, dy = j < cy ? (j + 0.5 - cy) / ry : 0, d = Math.hypot(dx, dy);
      if (d < 1 && j < 78) continue;
      if (d < 1.18) P(i, j, d < 1.08 ? sh(GOLD, -1) : GOLD); else clear(i, j, 1, 1);
    }
    R(cx - 1, 8, 2, 70, MARBLE); R(x + 10, 46, 44, 2, MARBLE);
    puff(cx, 86, 26, 6);
  } },
  { id: 'featherlamp', name: 'Feather lamp', w: 1, h: 1, price: 420, glow: ['#fff4d8', '#ffffff'], draw(x, b) {
    floorShadow(x + 4, b, 24); cyl(x + 15, b - 58, 2, 52, GOLD);
    for (let j = 0; j < 34; j++) { const t = j / 33, hw = Math.sin(t * Math.PI) * 9, cx = x + 16 + Math.round(Math.sin(t * 2) * 4); R(cx - hw, b - 92 + j, hw * 2, 1, j % 4 ? '#fff4d8' : '#ffffff'); }
    line(x + 16, b - 58, x + 17, b - 92, sh('#fff4d8', -2));
    puff(x + 16, b - 6, 10, 5);
  } },
  { id: 'floatisland', name: 'Floating island', w: 1, h: 1, price: 1100, draw(x, b) {
    floorShadow(x + 4, b, 24); puff(x + 16, b - 8, 12, 6);
    for (let j = 0; j < 18; j++) { const hw = 14 - j * 0.7; R(x + 16 - hw, b - 46 + j, hw * 2, 1, j < 3 ? (j ? k.leaf : sh(k.leaf, 1)) : j % 4 ? '#9a7a5a' : '#7a5a3a'); }
    cyl(x + 10, b - 60, 3, 14, k.w); foliage(x + 11, b - 64, 7, k.leaf, 4);
    panel(x + 18, b - 52, 7, 6, MARBLE); tri(x + 21, b - 57, 4, k.c, 1);
    R(x + 24, b - 45, 2, 18, WATER); P(x + 24, b - 40, '#ffffff'); P(x + 25, b - 33, '#ffffff');
    for (const [i, j] of [[4, -50], [28, -58], [6, -30]]) P(x + i, b + j, '#ffffff');
  } },
  { id: 'skybanner', name: 'Sky banner', w: 1, h: 1, layer: 'wall', price: 200, wall(x) {
    R(x + 3, 6, 26, 3, GOLD); disc(x + 3, 7, 2, GOLD); disc(x + 29, 7, 2, GOLD);
    R(x + 6, 9, 20, 70, k.c); R(x + 6, 9, 2, 70, sh(k.c, 1)); R(x + 24, 9, 2, 70, sh(k.c, -1));
    for (let j = 0; j < 8; j++) { const wdt = Math.round(10 - j * 1.25); R(x + 6, 79 + j, wdt, 1, k.c); R(x + 26 - wdt, 79 + j, wdt, 1, k.c); }
    R(x + 6, 13, 20, 1, GOLD); R(x + 6, 75, 20, 1, GOLD);
    motif('sun', x + 7, 22, ink(GOLD, sh(GOLD, 1), sh(GOLD, -2), '#ffffff'), 2);
  } },
  { id: 'cloudcolumn', name: 'Cloud column', w: 1, h: 1, price: 700, draw(x, b) {
    floorShadow(x + 2, b, 28); cyl(x + 9, b - 78, 14, 66, MARBLE); for (const i of [12, 15, 18]) R(x + i, b - 76, 1, 60, sh(MARBLE, -1));
    panel(x + 5, b - 84, 22, 6, GOLD); for (const i of [6, 26]) { disc(x + i, b - 80, 3, GOLD); ring(x + i, b - 80, 2, sh(GOLD, -1)); }
    for (let j = 0; j < 56; j++) { const vx = x + 16 + Math.round(Math.sin(j / 5) * 7); P(vx, b - 20 - j, k.leaf); if (j % 7 === 0) leaf(vx + 1, b - 20 - j, 2, 1, sh(k.leaf, 1), 0); }
    puff(x + 16, b - 8, 14, 8);
  } },
  { id: 'airshipmodel', name: 'Airship model', w: 1, h: 1, price: 760, draw(x, b) {
    floorShadow(x + 6, b, 20); panel(x + 9, b - 6, 14, 6, k.w); R(x + 15, b - 40, 2, 34, BRASS);
    R(x + 1, b - 72, 5, 6, k.a); R(x + 1, b - 54, 5, 6, k.a);
    ovalShade(x + 16, b - 60, 15, 9, k.c); for (const i of [-8, -2, 4, 10]) R(x + 16 + i, b - 68, 1, 16, sh(k.c, -1));
    panel(x + 11, b - 49, 10, 5, k.w); for (const i of [13, 16, 19]) P(x + i, b - 47, '#fff4c0'); R(x + 22, b - 49, 1, 5, CHROME);
  } },
  { id: 'balloonmodel', name: 'Hot air balloon', w: 1, h: 1, price: 680, draw(x, b) {
    const BASKET = '#a87a48';
    floorShadow(x + 6, b, 20); line(x + 11, b - 12, x + 11, b - 36, INK); line(x + 21, b - 12, x + 21, b - 36, INK);
    panel(x + 10, b - 12, 12, 12, BASKET); for (let j = b - 10; j < b - 1; j += 3) R(x + 11, j, 10, 1, sh(BASKET, -1)); R(x + 9, b - 13, 14, 2, sh(BASKET, -1));
    for (let j = 0; j < 50; j++) {
      const hw = j < 26 ? Math.sqrt(1 - ((26 - j) / 26) ** 2) * 14 : 14 - (j - 26) * 0.4;
      for (let i = Math.round(-hw); i < Math.round(hw); i++) { const c = Math.floor((i + 14) / 4) % 2 ? k.c : k.p; P(x + 16 + i, b - 86 + j, i < -hw * 0.6 ? sh(c, 1) : i > hw * 0.6 ? sh(c, -1) : c); }
    }
    R(x + 11, b - 37, 11, 2, k.a);
  } },
  { id: 'skybell', name: 'Sky bell', w: 1, h: 1, price: 820, draw(x, b) {
    floorShadow(x, b, 32); cyl(x + 3, b - 70, 4, 62, MARBLE); cyl(x + 25, b - 70, 4, 62, MARBLE);
    arc(x + 16, b - 70, 11, 12, Math.PI, Math.PI * 2, MARBLE, 4); R(x + 15, b - 86, 3, 4, GOLD);
    R(x + 16, b - 80, 1, 14, k.c);
    for (let j = 0; j < 18; j++) { const hw = 4 + j * 0.35 + (j > 14 ? 2 : 0); R(x + 16 - hw, b - 66 + j, hw * 2, 1, j < 3 ? sh(GOLD, 1) : GOLD); }
    R(x + 8, b - 48, 16, 2, sh(GOLD, -1)); disc(x + 16, b - 45, 2, sh(GOLD, -2));
    puff(x + 16, b - 8, 14, 7);
  } },
  { id: 'rainbowrug', name: 'Rainbow rug', w: 2, h: 2, layer: 'rug', price: 320, high: 0.04, side: 'c', flat(w, h) {
    for (let n = 0; n < 7; n++) disc(w / 2, h - 8, w / 2 - 2 - n * 3.4, RAINBOW[n]);
    disc(w / 2, h - 8, w / 2 - 26, k.p);
    for (const i of [7, w - 7]) { disc(i, h - 8, 7, sh(CLOUD, -1)); disc(i - 1, h - 9, 6, CLOUD); disc(i + (i < w / 2 ? 6 : -6), h - 5, 5, CLOUD); }
  } },
  { id: 'cloudstool', name: 'Cloud pouf', w: 1, h: 1, price: 260, seat: 'cushion', draw(x, b) {
    floorShadow(x + 2, b, 28); puff(x + 16, b - 12, 13, 11, k.p);
    for (const [i, j] of [[10, -24], [21, -26], [16, -18]]) P(x + i, b + j, k.a);
    disc(x + 23, b - 30, 2, k.c); disc(x + 27, b - 30, 2, k.c); P(x + 25, b - 30, sh(k.c, -1));
  } },
  { id: 'wingstatue', name: 'Winged statue', w: 1, h: 1, price: 900, draw(x, b) {
    floorShadow(x, b, 32); panel(x + 7, b - 24, 18, 24, MARBLE, 2); R(x + 5, b - 26, 22, 3, GOLD); R(x + 5, b - 4, 22, 4, sh(MARBLE, -1));
    for (const s of [-1, 1]) for (let f = 0; f < 5; f++) line(x + 16 + s * 4, b - 42, x + 16 + s * (8 + f * 1.6), b - 64 + f * 5, f % 2 ? MARBLE : sh(MARBLE, 1), 2);
    ovalShade(x + 16, b - 36, 6, 9, MARBLE); tri(x + 16, b - 32, 6, sh(MARBLE, -1), 1);
    disc(x + 16, b - 49, 4, MARBLE); R(x + 19, b - 50, 3, 2, GOLD); P(x + 17, b - 51, INK);
  } },
  { id: 'cloudstair', name: 'Cloud stairs', w: 1, h: 1, price: 640, draw(x, b) {
    floorShadow(x, b, 32);
    for (let n = 5; n >= 0; n--) { const a = n * 1.1, px = x + 16 + Math.cos(a) * 8, py = b - 8 - n * 14; puff(px, py, 8, 4); R(px - 5, py + 3, 10, 1, GOLD); }
    for (const [i, j] of [[6, -84], [26, -70], [24, -90]]) { P(x + i, b + j, '#fff4a0'); P(x + i - 1, b + j, sh('#fff4a0', -1)); P(x + i + 1, b + j, sh('#fff4a0', -1)); }
  } },
]);
