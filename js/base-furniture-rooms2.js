/* base-furniture-rooms2.js  -  themed shelves, batch 2 of the road to 1,000 kinds (2026-10-08): the Bathroom, Bedroom,
   Office, Café, School and Winter, 25 kinds each. Same kit and rules as js/base-furniture-rooms.js: painted at 32 pixels
   a tile with js/base-paint.js in the piece's theme palette `k`, outlined and rim-lit by `finish()`. Each shelf opens
   with a list that shares one body and differs by what stands on it (vanities, quilts, desks, café tables, school
   desks, ice sculptures). */

import { k, sh, R, P, hash, panel, inset, wood, cushion, sphere, disc, oval, ovalShade, cyl, glass, leaf, foliage, tri,
  speckle, stamp, bits, floorShadow } from './base-paint.js';
import { MOTIFS, motif, ink, legs4, sideBox, shadowWall } from './base-furniture-kinds.js';
import { BERRY, STONE, flower, ball, cabinet } from './base-furniture-rooms.js';

export const ROOM_KINDS_2 = [];
const add = (group, list) => list.forEach(f => ROOM_KINDS_2.push({ group, ...f }));

const RAINBOW = ['#e04848', '#f08030', '#f8d030', '#58b848', '#4a98d8', '#5a58c8', '#a858d8'];
const SNOW = '#eef6ff', ICE = '#bfe6f8';
const DUCK = ['..###...', '.##k#oo.', '.#####..', '..##....', '.######.', '########', '#++#####', '.######.'];
const duckInk = { '#': '#f8d030', '+': '#fff090', k: '#303038', o: '#f08030' };
const LETTERS = { A: ['.#.', '#.#', '###', '#.#', '#.#'], B: ['##.', '#.#', '##.', '#.#', '##.'], C: ['.##', '#..', '#..', '#..', '.##'],
  D: ['##.', '#.#', '#.#', '#.#', '##.'], E: ['###', '#..', '##.', '#..', '###'], F: ['###', '#..', '##.', '#..', '#..'] };
/** A string sagging between two points on a wall, as y at each x from 0 to `len`. */
const sag = (len, top, dip) => (i) => top + Math.round(Math.sin(Math.max(0, Math.min(len, i)) / len * Math.PI) * dip);

/* ---------- bathroom ---------- */
const TILE = '#e8f0f4';
/** A wash-stand, its basin on the left of the top; returns the top's line. */
function vanity(x, b) {
  floorShadow(x, b, 32);
  wood(x + 2, b - 30, 28, 27, k.w); R(x + 3, b - 3, 26, 3, sh(k.w, -3));
  for (const i of [4, 17]) { inset(x + i, b - 28, 11, 23, sh(k.w, 1)); wood(x + i + 1, b - 27, 9, 21, k.w, 'y'); R(x + i + (i < 10 ? 8 : 2), b - 18, 1, 4, k.a); }
  panel(x, b - 34, 32, 5, k.p);
  oval(x + 9, b - 34, 7, 2, sh(k.p, -2)); oval(x + 9, b - 34, 6, 1, '#bfe0f0');
  cyl(x + 8, b - 41, 2, 6, k.m); R(x + 8, b - 41, 5, 2, k.m); P(x + 12, b - 39, '#bfe0f0');
  return b - 34;
}
const VANITY = {
  soap: ['Soap pump', (x, t) => { cyl(x + 20, t - 10, 7, 10, k.c); R(x + 22, t - 14, 3, 4, k.m); R(x + 22, t - 15, 6, 2, k.m); R(x + 21, t - 7, 5, 3, '#ffffff'); }],
  brush: ['Toothbrush', (x, t) => {
    R(x + 21, t - 17, 1, 10, BERRY[1]); R(x + 25, t - 15, 1, 8, BERRY[0]); R(x + 20, t - 19, 2, 3, '#ffffff'); R(x + 24, t - 17, 2, 3, '#ffffff');
    cyl(x + 19, t - 8, 9, 8, k.c); R(x + 19, t - 8, 9, 1, sh(k.c, 1));
  }],
  perfume: ['Perfume', (x, t) => {
    glass(x + 18, t - 9, 6, 9, sh(k.c, 1)); R(x + 20, t - 12, 2, 3, k.a); sphere(x + 21, t - 14, 2, k.a);
    for (let j = 0; j < 8; j++) { const h = 4 - Math.abs(j - 4); R(x + 27 - h, t - 8 + j, h * 2 + 1, 1, j < 3 ? sh(k.a, 1) : k.a); } R(x + 26, t - 11, 3, 3, k.m);
  }],
  towels: ['Towel', (x, t) => { panel(x + 17, t - 5, 13, 5, k.c); panel(x + 18, t - 10, 12, 5, k.p); panel(x + 17, t - 15, 13, 5, k.c); R(x + 17, t - 13, 13, 1, sh(k.c, 1)); }],
  duck: ['Rubber duck', (x, t) => stamp(DUCK, x + 19, t - 9, duckInk, 1)],
  salts: ['Bath salts', (x, t) => {
    R(x + 19, t - 12, 10, 12, '#e8f4f8'); R(x + 19, t - 8, 10, 8, sh(k.c, 1)); speckle(x + 19, t - 8, 10, 8, '#ffffff', 4, 0.25);
    R(x + 18, t - 14, 12, 2, k.a); P(x + 20, t - 11, '#ffffff');
  }],
};
add('Bathroom', Object.entries(VANITY).map(([id, [name, top]]) => ({ set: 'vanity', id: `${id}vanity`, name: `${name} vanity`, w: 1, h: 1, price: 360,
  draw(x, b) { top(x, vanity(x, b)); } })));
add('Bathroom', [
  { id: 'clawtub', name: 'Clawfoot tub', w: 2, h: 1, price: 950, draw(x, b, vw) {
    floorShadow(x, b, vw);
    for (const i of [5, vw - 10]) { R(x + i, b - 6, 5, 6, k.a); R(x + i - 1, b - 2, 7, 2, sh(k.a, -1)); }
    for (let j = 0; j < 22; j++) { const s = Math.round(((j / 22) ** 3) * 8); R(x + 2 + s, b - 28 + j, vw - 4 - s * 2, 1, j < 3 ? sh(k.p, 1) : j > 16 ? sh(k.p, -1) : k.p); }
    R(x + 6, b - 22, vw - 12, 1, k.c);
    R(x + 1, b - 30, vw - 2, 3, sh(k.p, 1)); R(x + 1, b - 28, vw - 2, 1, sh(k.p, -2));
    for (const [i, r] of [[0.25, 4], [0.38, 5], [0.52, 4], [0.33, 3]]) sphere(x + vw * i, b - 31 - r * 0.6, r, '#ffffff');
    cyl(x + vw - 8, b - 42, 2, 12, k.m); R(x + vw - 14, b - 42, 8, 2, k.m); P(x + vw - 14, b - 40, '#bfe0f0');
  } },
  { id: 'bubblebath', name: 'Bubble bath', w: 2, h: 1, price: 900, draw(x, b, vw) {
    floorShadow(x, b, vw); panel(x + 1, b - 24, vw - 2, 24, k.c, 2); for (let i = 4; i < vw - 6; i += 8) R(x + i, b - 20, 6, 1, sh(k.c, 1));
    panel(x, b - 27, vw, 4, k.p);
    for (let n = 0; n < 16; n++) sphere(x + 6 + hash(n, 3) * (vw - 12), b - 29 - hash(n, 5) * 8, 2 + hash(n, 7) * 3, '#f4f8ff');
    stamp(DUCK, x + vw - 22, b - 42, duckInk, 1);
  } },
  { id: 'shower', name: 'Shower', w: 1, h: 1, price: 820, draw(x, b) {
    floorShadow(x, b, 32); R(x + 2, b - 84, 28, 80, TILE);
    for (let j = 0; j < 14; j++) { R(x + 2, b - 84 + j * 6, 28, 1, sh(TILE, -1)); for (let i = 0; i < 4; i++) R(x + 2 + i * 7 + (j % 2) * 3, b - 84 + j * 6, 1, 6, sh(TILE, -1)); }
    R(x + 2, b - 48, 28, 4, k.c); R(x + 2, b - 48, 28, 1, sh(k.c, 1));
    cyl(x + 22, b - 80, 2, 30, k.m); R(x + 14, b - 80, 10, 2, k.m); ovalShade(x + 14, b - 77, 4, 2, k.m);
    for (let n = 0; n < 12; n++) R(x + 10 + Math.floor(hash(n) * 9), b - 72 + Math.floor(hash(n, 2) * 62), 1, 3, '#a8d8f8');
    panel(x + 1, b - 4, 30, 4, k.p);
    R(x + 3, b - 84, 26, 80, 'rgba(190,225,245,0.3)'); for (let i = 0; i < 10; i++) { P(x + 6 + i, b - 30 - i, '#ffffff'); P(x + 10 + i, b - 22 - i, '#ffffff'); }
    R(x + 1, b - 86, 30, 2, k.m); R(x + 1, b - 86, 2, 82, k.m); R(x + 29, b - 86, 2, 82, k.m);
  } },
  { id: 'toilet', name: 'Toilet', w: 1, h: 1, price: 400, draw(x, b) {
    floorShadow(x + 3, b, 26);
    panel(x + 7, b - 56, 18, 20, k.p, 2); panel(x + 6, b - 58, 20, 4, sh(k.p, 1)); R(x + 20, b - 52, 4, 2, k.m);
    cyl(x + 12, b - 12, 8, 12, k.p);
    for (let j = 0; j < 22; j++) { const h = Math.round(11 - (j / 22) ** 2 * 6); R(x + 16 - h, b - 34 + j, h * 2, 1, j < 3 ? sh(k.p, 1) : j > 18 ? sh(k.p, -1) : k.p); }
    panel(x + 4, b - 37, 24, 4, k.c); R(x + 6, b - 36, 20, 1, sh(k.c, 1));
  } },
  { id: 'towelrail', name: 'Towel rail', w: 1, h: 1, layer: 'wall', price: 180, wall(x) {
    panel(x + 5, 26, 11, 30, k.c); R(x + 5, 47, 11, 2, k.p); R(x + 5, 51, 11, 1, k.p); for (let j = 28; j < 56; j += 4) P(x + 15, j, sh(k.c, -2));
    panel(x + 17, 26, 10, 24, k.p); R(x + 17, 43, 10, 2, k.c);
    cyl(x + 3, 23, 26, 3, k.m); sphere(x + 3, 24, 2, k.a); sphere(x + 29, 24, 2, k.a);
  } },
  { id: 'bathmirror', name: 'Vanity mirror', w: 1, h: 1, layer: 'wall', price: 340, glow: ['#fff4c0'], wall(x) {
    shadowWall(x + 5, 14, 22, 42); panel(x + 5, 14, 22, 42, k.a, 2); glass(x + 8, 17, 16, 36, '#cfe8f4');
    for (const j of [18, 28, 38, 48]) { disc(x + 5, j, 2, '#fff4c0'); disc(x + 27, j, 2, '#fff4c0'); }
    wood(x + 3, 58, 26, 3, k.w); cyl(x + 7, 51, 3, 7, k.c); cyl(x + 22, 53, 4, 5, BERRY[2]); R(x + 13, 55, 6, 3, '#ffffff');
  } },
  { id: 'medcabinet', name: 'Medicine cabinet', w: 1, h: 1, layer: 'wall', price: 300, wall(x) {
    shadowWall(x + 4, 18, 24, 36); panel(x + 4, 18, 24, 36, k.w); inset(x + 6, 20, 16, 32, sh(k.w, -2));
    for (const y of [30, 41]) R(x + 6, y, 16, 1, sh(k.w, 1));
    [['#e04848', 7], ['#f4f4f0', 12], ['#4a78d8', 17]].forEach(([c, i]) => { cyl(x + i, 23, 4, 7, c); R(x + i + 1, 22, 2, 1, k.m); });
    panel(x + 8, 35, 6, 6, '#f4f4f0'); R(x + 10, 36, 2, 4, '#e04848'); R(x + 9, 37, 4, 2, '#e04848'); panel(x + 15, 34, 6, 7, '#f8d030');
    R(x + 8, 48, 10, 3, '#ffffff'); cyl(x + 18, 46, 3, 6, '#a8d8f0');
    panel(x + 22, 18, 7, 36, k.w); glass(x + 23, 20, 5, 32, '#cfe8f4'); P(x + 23, 36, k.a);
  } },
  { id: 'bathmat', name: 'Bath mat', w: 2, h: 1, layer: 'rug', price: 120, high: 0.03, side: 'c', flat(w, h) {
    cushion(1, 1, w - 2, h - 2, k.c, 4); for (let i = 6; i < w - 6; i += 6) R(i, 4, 2, h - 8, sh(k.c, 1));
    speckle(3, 3, w - 6, h - 6, sh(k.c, -1), 3, 0.15); for (let i = 3; i < w - 3; i += 3) { P(i, 0, k.p); P(i, h - 1, k.p); }
  } },
  { id: 'duckmat', name: 'Duck mat', w: 2, h: 1, layer: 'rug', price: 140, high: 0.03, side: 'c', flat(w, h) {
    R(0, 0, w, h, sh(k.c, -1)); R(2, 2, w - 4, h - 4, k.p); speckle(2, 2, w - 4, h - 4, sh(k.p, -1), 5, 0.1);
    for (let i = 4; i < w - 4; i++) P(i, 24 + Math.round(Math.sin(i / 3) * 1.5), '#68b8f0');
    stamp(DUCK, 8, 6, duckInk, 2); stamp(DUCK, w - 26, 6, duckInk, 2);
  } },
  { id: 'hamper', name: 'Laundry hamper', w: 1, h: 1, price: 200, draw(x, b) {
    floorShadow(x + 4, b, 24);
    for (let j = 0; j < 30; j++) { const half = 11 - Math.floor(j / 12); R(x + 16 - half, b - 32 + j, half * 2, 1, (j >> 1) % 2 ? k.w : sh(k.w, 1)); }
    for (let i = -10; i <= 10; i += 4) R(x + 16 + i, b - 32, 1, 30, sh(k.w, -1));
    R(x + 7, b - 32, 4, 10, k.c); R(x + 7, b - 23, 4, 2, sh(k.c, -1));
    cushion(x + 4, b - 37, 24, 6, sh(k.w, -1), 2); R(x + 13, b - 40, 6, 3, k.w);
  } },
  { id: 'toiletroll', name: 'Toilet roll stand', w: 1, h: 1, price: 110, draw(x, b) {
    floorShadow(x + 8, b, 16); R(x + 10, b - 3, 12, 3, k.m); cyl(x + 15, b - 44, 3, 42, k.m); sphere(x + 16, b - 46, 2.5, k.a);
    for (let n = 0; n < 3; n++) { const y = b - 6 - n * 11; cyl(x + 10, y - 9, 12, 9, '#f8f8f4'); oval(x + 16, y - 9, 6, 1.5, '#ffffff'); P(x + 16, y - 9, '#c8c0b0'); }
  } },
  { id: 'saunabench', name: 'Sauna bench', w: 2, h: 1, price: 700, draw(x, b, vw, dir) {
    if (dir % 2) return sideBox(x, b, vw, 30);
    floorShadow(x, b, vw);
    for (const i of [3, vw - 8]) { wood(x + i, b - 30, 5, 30, sh(k.w, -1), 'y'); }
    wood(x + 1, b - 14, vw - 2, 4, k.w); for (let j = 0; j < 2; j++) wood(x + 1, b - 32 + j * 5, vw - 2, 4, sh(k.w, 1));
    cyl(x + 10, b - 44, 10, 10, k.w); R(x + 10, b - 42, 10, 1, k.m); R(x + 10, b - 37, 10, 1, k.m); oval(x + 15, b - 44, 5, 1, '#68b8f0');
    R(x + 19, b - 50, 1, 9, k.w); R(x + 19, b - 50, 6, 1, k.w);
    for (const [i, j] of [[34, -40], [38, -46], [35, -52]]) if (i < vw) P(x + i, b + j, '#ffffff');
  } },
  { id: 'bathstool', name: 'Bath stool', w: 1, h: 1, price: 140, draw(x, b) {
    floorShadow(x + 2, b, 28); panel(x + 5, b - 14, 22, 4, k.c); R(x + 6, b - 10, 3, 10, sh(k.c, -1)); R(x + 23, b - 10, 3, 10, sh(k.c, -1)); R(x + 9, b - 6, 14, 2, sh(k.c, -1));
    for (let j = 0; j < 7; j++) { const h = 9 - Math.floor(j * j / 6); R(x + 16 - h, b - 21 + j, h * 2, 1, j < 1 ? sh(k.p, 1) : k.p); }
    oval(x + 16, b - 21, 8, 1.5, '#a8d8f0');
  } },
  { id: 'towelladder', name: 'Towel ladder', w: 1, h: 1, price: 220, draw(x, b) {
    floorShadow(x + 4, b, 24);
    for (let j = 0; j < 72; j++) { const o = Math.floor(j / 12); R(x + 6 + o, b - j, 3, 1, k.w); R(x + 22 + o, b - j, 3, 1, k.w); }
    for (let r = 0; r < 5; r++) { const y = b - 12 - r * 14; R(x + 8 + Math.floor((b - y) / 12), y, 15, 2, sh(k.w, 1)); }
    const towel = (y, c) => { const o = Math.floor((b - y) / 12); panel(x + 7 + o, y - 1, 17, 12, c); R(x + 7 + o, y + 7, 17, 1, sh(c, 1)); };
    towel(b - 26, k.c); towel(b - 54, k.p);
  } },
  { id: 'jacuzzi', name: 'Hot tub', w: 2, h: 2, price: 1500, high: 0.25, side: 'w', flat(w, h) {
    wood(0, 0, w, h, k.w); R(3, 3, w - 6, h - 6, sh(k.w, -2));
    cushion(5, 5, w - 10, h - 10, '#3a9ad8', 6); R(9, 9, w - 18, h - 18, '#5ab8f0');
    for (let n = 0; n < 26; n++) disc(9 + hash(n) * (w - 18), 9 + hash(n, 1) * (h - 18), 1 + hash(n, 2) * 1.5, '#d8f4ff');
    cushion(6, 6, 12, 6, k.c, 2); cushion(w - 18, 6, 12, 6, k.c, 2); R(w / 2 - 8, h - 3, 16, 3, sh(k.w, 1));
  } },
  { id: 'showercurtain', name: 'Shower curtain', w: 2, h: 1, layer: 'wall', price: 200, wall(x) {
    for (let i = 0; i < 54; i++) { const s = Math.sin(i / 2.2); R(x + 5 + i, 18, 1, 56, sh(k.c, s > 0.4 ? 1 : s < -0.4 ? -1 : 0)); }
    for (const [i, j] of [[8, 24], [28, 22], [46, 26], [16, 44], [38, 42], [8, 60], [28, 62], [46, 58]]) motif('drop', x + i, j, ink(k.p, '#ffffff', sh(k.p, -2), '#ffffff'), 1);
    R(x + 5, 72, 54, 2, sh(k.c, -1)); cyl(x + 4, 13, 56, 3, k.m); for (let i = 0; i < 8; i++) disc(x + 7 + Math.floor(i * 7.4), 17, 2, k.a);
  } },
  { id: 'tilewall', name: 'Tile panel', w: 2, h: 1, layer: 'wall', price: 180, wall(x) {
    shadowWall(x + 2, 14, 60, 60); R(x + 2, 14, 60, 60, sh(k.p, -2));
    for (let j = 0; j < 6; j++) for (let i = 0; i < 6; i++) { const c = (i + j) % 2 ? k.p : k.c; R(x + 3 + i * 10, 15 + j * 10, 9, 9, c); R(x + 3 + i * 10, 15 + j * 10, 9, 1, sh(c, 1)); P(x + 4 + i * 10, 16 + j * 10, sh(c, 2)); }
    R(x + 2, 44, 60, 2, k.a);
  } },
  { id: 'bigduck', name: 'Giant rubber duck', solo: true, w: 1, h: 1, price: 260, draw(x, b) {
    floorShadow(x, b, 32); stamp(DUCK, x, b - 34, duckInk, 4);
  } },
  { id: 'washingline', name: 'Washing line', w: 2, h: 1, layer: 'wall', price: 160, wall(x) {
    const y = sag(56, 18, 6);
    R(x + 2, 16, 2, 8, k.m); R(x + 60, 16, 2, 8, k.m); for (let i = 0; i < 57; i++) P(x + 4 + i, y(i), sh(k.m, 1));
    let t = y(6); R(x + 8, t, 14, 16, k.c); R(x + 4, t, 4, 6, k.c); R(x + 22, t, 4, 6, k.c); R(x + 13, t, 4, 2, sh(k.c, -2)); P(x + 9, t - 1, k.a); P(x + 20, t - 1, k.a);
    t = y(28); R(x + 31, t, 4, 12, k.p); R(x + 31, t + 9, 8, 4, k.p); R(x + 31, t, 4, 2, k.a);
    t = y(42); panel(x + 44, t, 12, 18, k.a); R(x + 44, t + 13, 12, 2, k.p);
  } },
]);

/* ---------- bedroom ---------- */
const QUILTS = [
  ['patch', 'Patchwork', (x, y, w, h) => { const cs = [k.c, k.a, sh(k.c, 1), k.p, sh(k.a, -1)]; for (let j = 0; j < h; j += 8) for (let i = 0; i < w; i += 8) { const c = cs[Math.floor(hash(i, j, 3) * 5)]; R(x + i, y + j, 8, 8, c); R(x + i, y + j, 8, 1, sh(c, -1)); R(x + i, y + j, 1, 8, sh(c, -1)); } }],
  ['star', 'Star', (x, y, w, h) => { speckle(x, y, w, h, sh(k.c, 1), 9, 0.05); motif('star', x + w / 2 - 18, y + h / 2 - 18, ink(k.a, sh(k.a, 1), sh(k.a, -2), '#ffffff'), 4); }],
  ['stripe', 'Striped', (x, y, w, h) => { for (let i = 0; i < w; i += 8) { R(x + i, y, 4, h, sh(k.c, 1)); R(x + i + 5, y, 1, h, k.a); } }],
  ['check', 'Gingham', (x, y, w, h) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const a = (i >> 2) % 2, bb = (j >> 2) % 2; if (a || bb) P(x + i, y + j, a && bb ? sh(k.c, -1) : sh(k.c, 1)); } }],
  ['heart', 'Heart', (x, y, w, h) => { for (let i = 2; i < w; i += 6) { P(x + i, y + 3, k.p); P(x + i, y + h - 4, k.p); } motif('heart', x + w / 2 - 18, y + h / 2 - 16, ink(k.a, sh(k.a, 1), sh(k.a, -2), '#ffffff'), 4); }],
];
add('Bedroom', QUILTS.map(([id, name, pattern]) => ({ set: 'quilt', id: `${id}quilt`, name: `${name} quilt bed`, w: 2, h: 3, price: 650, high: 0.5, side: 'w', seat: 'bed',
  flat(w, h) {
    wood(0, 0, w, h, k.w); wood(2, 2, w - 4, 10, sh(k.w, -1)); R(4, 4, w - 8, 2, sh(k.w, 1)); R(2, 12, w - 4, 1, sh(k.w, -3));
    R(5, 13, w - 10, h - 17, k.p); cushion(10, 15, w - 20, 12, '#ffffff', 4); R(w / 2, 17, 1, 8, sh(k.p, -1));
    R(4, 30, w - 8, h - 33, k.c); pattern(4, 33, w - 8, h - 36); R(4, 30, w - 8, 3, k.p); R(4, 33, w - 8, 1, sh(k.c, -2));
  } })));
add('Bedroom', [
  { id: 'bunkbed', name: 'Bunk bed', w: 1, h: 2, price: 900, draw(x, b, vw) {
    floorShadow(x, b, vw);
    for (const lvl of [b - 12, b - 52]) {
      wood(x + 2, lvl, vw - 4, 6, k.w); cushion(x + 4, lvl - 7, vw - 8, 8, k.p, 2);
      R(x + 4 + Math.round(vw * 0.35), lvl - 6, vw - 8 - Math.round(vw * 0.35), 6, k.c); R(x + 4 + Math.round(vw * 0.35), lvl - 6, 2, 6, sh(k.c, 1));
      cushion(x + 5, lvl - 11, 10, 6, '#ffffff', 2);
    }
    R(x + 2, b - 72, vw - 4, 3, k.w);
    wood(x, b - 86, 4, 86, sh(k.w, -1), 'y'); wood(x + vw - 4, b - 86, 4, 86, sh(k.w, -1), 'y');
    if (vw > 40) { const lx = x + vw - 16; R(lx, b - 56, 2, 56, k.w); R(lx + 9, b - 56, 2, 56, k.w); for (let j = 8; j < 56; j += 10) R(lx, b - j, 11, 2, sh(k.w, 1)); }
  } },
  { id: 'canopybed', name: 'Canopy bed', w: 2, h: 3, price: 1300, high: 0.6, side: 'a', seat: 'bed', flat(w, h) {
    wood(0, 0, w, h, k.w); R(5, 13, w - 10, h - 17, k.p); cushion(10, 16, w - 20, 13, '#ffffff', 4);
    R(5, 34, w - 10, h - 39, k.c); R(5, 34, w - 10, 2, sh(k.c, 1)); speckle(5, 37, w - 10, h - 42, sh(k.c, 1), 6, 0.06);
    for (const sx of [0, w - 6]) for (let j = 0; j < h; j++) R(sx, j, 6, 1, sh(k.a, Math.floor(j / 4) % 2 ? 0 : 1));
    for (const [i, j] of [[3, 3], [w - 4, 3], [3, h - 4], [w - 4, h - 4]]) { disc(i, j, 3, sh(k.w, -1)); disc(i - 1, j - 1, 1.5, sh(k.w, 1)); }
  } },
  { id: 'crib', name: 'Crib', w: 1, h: 1, price: 480, draw(x, b) {
    floorShadow(x, b, 32); R(x + 3, b - 18, 26, 6, k.c); cushion(x + 4, b - 22, 9, 5, '#ffffff', 2);
    for (let i = 0; i < 6; i++) cyl(x + 6 + i * 4, b - 36, 2, 26, k.p);
    R(x + 1, b - 38, 30, 3, k.w); R(x + 1, b - 11, 30, 3, k.w); cyl(x + 1, b - 40, 3, 40, k.w); cyl(x + 28, b - 40, 3, 40, k.w);
    R(x + 29, b - 64, 1, 24, k.m); R(x + 13, b - 64, 17, 1, k.m);
    [k.a, k.c, '#f8d030'].forEach((c, n) => { const i = 15 + n * 6; R(x + i, b - 63, 1, 5, '#c8c8d0'); disc(x + i, b - 56, 2, c); });
  } },
  { id: 'dressingtable', name: 'Dressing table', w: 1, h: 1, price: 520, draw(x, b) {
    floorShadow(x, b, 32); legs4(x, b, 32, 22, k.w); wood(x + 1, b - 30, 30, 8, k.w); inset(x + 8, b - 28, 16, 4, sh(k.w, 1)); R(x + 15, b - 27, 2, 2, k.a);
    R(x + 15, b - 36, 2, 6, k.a); oval(x + 16, b - 50, 11, 14, sh(k.a, -1)); oval(x + 16, b - 50, 9, 12, '#cfe8f4');
    for (let i = 0; i < 6; i++) { P(x + 11 + i, b - 50 - i, '#ffffff'); P(x + 14 + i, b - 46 - i, '#ffffff'); }
    cyl(x + 4, b - 36, 4, 6, k.c); R(x + 5, b - 38, 2, 2, k.a); R(x + 26, b - 36, 2, 6, '#e04858'); R(x + 26, b - 38, 2, 2, '#f08098');
  } },
  { id: 'jewelbox', name: 'Jewellery box', w: 1, h: 1, price: 300, draw(x, b) {
    floorShadow(x + 4, b, 24);
    panel(x + 6, b - 28, 20, 13, sh(k.w, 1)); inset(x + 8, b - 26, 16, 9, '#cfe8f4'); P(x + 10, b - 24, '#ffffff');
    panel(x + 6, b - 14, 20, 14, k.w); R(x + 6, b - 10, 20, 1, k.a); R(x + 15, b - 8, 2, 3, k.a);
    R(x + 7, b - 17, 18, 3, k.c); sphere(x + 12, b - 17, 2, '#e04878'); sphere(x + 19, b - 17, 2, '#48c8e8');
    for (let i = 0; i < 6; i++) disc(x + 6 + i * 3, b - 12 + (i % 2), 1.2, '#fff8f0');
  } },
  { id: 'alarmclock', name: 'Alarm clock', w: 1, h: 1, price: 150, draw(x, b) {
    floorShadow(x + 6, b, 20); R(x + 9, b - 4, 3, 4, k.m); R(x + 20, b - 4, 3, 4, k.m);
    sphere(x + 9, b - 26, 4, k.a); sphere(x + 23, b - 26, 4, k.a); R(x + 15, b - 29, 2, 4, k.m);
    disc(x + 16, b - 15, 11, sh(k.c, -1)); disc(x + 16, b - 15, 10, k.c); disc(x + 16, b - 15, 8, '#fffbe8');
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; P(Math.round(x + 16 + Math.cos(a) * 7), Math.round(b - 15 + Math.sin(a) * 7), '#8a8a98'); }
    R(x + 16, b - 21, 1, 6, '#303038'); R(x + 16, b - 15, 5, 1, '#303038');
  } },
  { id: 'dreamcatcher', name: 'Dreamcatcher', w: 1, h: 1, layer: 'wall', price: 180, wall(x) {
    R(x + 15, 12, 2, 8, k.p);
    for (let a = 0; a < 8; a++) { const t = a / 8 * Math.PI * 2; for (let r = 0; r < 10; r += 2) P(Math.round(x + 16 + Math.cos(t) * r), Math.round(30 + Math.sin(t) * r), k.p); }
    for (let a = 0; a < 72; a++) { const t = a / 72 * Math.PI * 2; P(Math.round(x + 16 + Math.cos(t) * 11), Math.round(30 + Math.sin(t) * 11), k.w); P(Math.round(x + 16 + Math.cos(t) * 10), Math.round(30 + Math.sin(t) * 10), sh(k.w, 1)); }
    disc(x + 16, 30, 1.5, k.a);
    for (const [i, len] of [[9, 14], [16, 20], [23, 14]]) { R(x + i, 41, 1, len, k.p); disc(x + i, 41 + len / 2, 1.5, k.a); leaf(x + i, 41 + len + 4, 2, 5, k.c); }
  } },
  { id: 'fairylights', name: 'Fairy lights', w: 2, h: 1, layer: 'wall', price: 220, glow: ['gl', '#fff4a0'], wall(x) {
    const cs = [k.c, '#fff4a0', k.a, '#a0e0f8'];
    for (const [top, dip] of [[16, 10], [30, 12]]) {
      const y = sag(59, top, dip);
      for (let i = 0; i < 60; i++) P(x + 2 + i, y(i), sh(k.m, 1));
      for (let i = 3, n = 0; i < 60; i += 6, n++) { disc(x + 2 + i, y(i) + 3, 1.5, cs[(n + top) % 4]); P(x + 2 + i, y(i) + 1, k.m); }
    }
  } },
  { id: 'photowall', name: 'Photo wall', w: 2, h: 1, layer: 'wall', price: 260, wall(x) {
    const skies = ['#88c8f0', '#f8c8a0', '#b8a8e8', '#a8e0c8', '#f8e0a0'];
    [[4, 16], [24, 12], [44, 18], [12, 40], [34, 38]].forEach(([px, py], i) => {
      shadowWall(x + px, py, 16, 18); panel(x + px, py, 16, 18, '#ffffff');
      R(x + px + 2, py + 2, 12, 11, skies[i]); R(x + px + 2, py + 10, 12, 3, '#68b048'); disc(x + px + 5 + (i % 3) * 2, py + 5, 1.5, '#fff4c0'); P(x + px + 9, py + 9, '#303038');
      disc(x + px + 8, py, 1.5, i % 2 ? k.c : k.a);
    });
  } },
  { id: 'starmobile', name: 'Star mobile', w: 1, h: 1, layer: 'wall', price: 160, wall(x) {
    R(x + 15, 10, 2, 4, k.w); R(x + 5, 14, 22, 2, k.w);
    [[7, 26, 'moon', k.a], [16, 36, 'star', k.c], [25, 24, 'star', k.a]].forEach(([i, y, id, c]) => { R(x + i, 16, 1, y - 16, '#c8c8d0'); motif(id, x + i - 4, y, ink(c, sh(c, 1), sh(c, -2), '#ffffff'), 1); });
  } },
  { id: 'tallboy', name: 'Chest of drawers', w: 1, h: 1, price: 560, draw(x, b, vw, dir) {
    floorShadow(x, b, 32); wood(x + 3, b - 62, 26, 58, k.w, 'y'); R(x + 4, b - 4, 3, 4, sh(k.w, -2)); R(x + 25, b - 4, 3, 4, sh(k.w, -2));
    wood(x + 2, b - 64, 28, 4, sh(k.w, 1));
    if (dir === 2) return;
    for (let r = 0; r < 5; r++) { const y = b - 58 + r * 11; inset(x + 5, y, 22, 9, sh(k.w, 1)); wood(x + 6, y + 1, 20, 7, k.w); R(x + 14, y + 4, 4, 1, k.a); }
    cyl(x + 21, b - 71, 5, 7, k.c); leaf(x + 23, b - 75, 2, 3, k.leaf, 0.3);
  } },
  { id: 'slippers', name: 'Slippers', w: 1, h: 1, price: 90, draw(x, b) {
    oval(x + 16, b - 2, 14, 2, 'rgba(30,18,10,0.25)');
    for (const sx of [3, 16]) { ovalShade(x + sx + 6, b - 5, 6, 4, k.c); oval(x + sx + 8, b - 6, 3, 1.5, sh(k.c, -2)); disc(x + sx + 3, b - 8, 2.5, k.p); P(x + sx + 2, b - 9, '#ffffff'); }
  } },
  { id: 'fluffyrug', name: 'Fluffy rug', w: 2, h: 2, layer: 'rug', price: 280, high: 0.04, side: 'c', flat(w, h) {
    disc(w / 2, h / 2, 30, sh(k.c, -1)); disc(w / 2, h / 2, 28, k.c);
    for (let n = 0; n < 300; n++) { const a = hash(n, 1) * Math.PI * 2, d = Math.sqrt(hash(n, 2)) * 27; P(w / 2 + Math.cos(a) * d, h / 2 + Math.sin(a) * d, hash(n, 3) < 0.5 ? sh(k.c, 1) : sh(k.c, -1)); }
    for (let a = 0; a < 90; a++) { const t = a / 90 * Math.PI * 2; P(w / 2 + Math.cos(t) * 31, h / 2 + Math.sin(t) * 31, sh(k.c, 1)); }
  } },
  { id: 'starprojector', name: 'Star projector', w: 1, h: 1, price: 380, glow: ['#a8c8ff', '#fff4c0'], draw(x, b) {
    floorShadow(x + 6, b, 20); cyl(x + 9, b - 8, 14, 8, k.m);
    for (let j = 0; j < 12; j++) { const h = Math.round(Math.sqrt(Math.max(0, 144 - (12 - j) ** 2))); R(x + 16 - h, b - 20 + j, h * 2, 1, j < 3 ? '#3a4a8a' : '#2a3a6a'); }
    for (let n = 0; n < 9; n++) P(x + 8 + Math.floor(hash(n) * 16), b - 17 + Math.floor(hash(n, 3) * 8), '#fff4c0');
    for (let n = 0; n < 8; n++) P(x + 3 + Math.floor(hash(n, 5) * 26), b - 62 + Math.floor(hash(n, 6) * 34), n % 2 ? '#fff4c0' : '#a8c8ff');
    R(x + 9, b - 4, 14, 1, k.a);
  } },
  { id: 'moonlamp', name: 'Moon nightlight', w: 1, h: 1, price: 260, glow: ['g', 'gl'], draw(x, b) {
    floorShadow(x + 6, b, 20); panel(x + 8, b - 6, 16, 6, k.w); R(x + 15, b - 13, 2, 7, k.m);
    for (let j = -12; j <= 12; j++) for (let i = -12; i <= 12; i++) { if (i * i + j * j > 144 || (i - 6) ** 2 + (j + 3) ** 2 < 100) continue; P(x + 16 + i, b - 26 + j, i < -7 ? sh(k.g, 1) : k.g); }
    P(x + 8, b - 27, sh(k.g, -2)); P(x + 9, b - 26, sh(k.g, -2));
    stamp(['.#.', '###', '.#.'], x + 23, b - 40, { '#': k.g }, 1);
  } },
  { id: 'laundrypile', name: 'Laundry pile', w: 1, h: 1, price: 80, draw(x, b) {
    floorShadow(x + 1, b, 30); ovalShade(x + 16, b - 6, 14, 6, k.c); R(x + 2, b - 8, 6, 3, k.p);
    ovalShade(x + 11, b - 11, 8, 5, k.p); ovalShade(x + 21, b - 12, 8, 5, k.a); ovalShade(x + 16, b - 17, 7, 4, BERRY[1]); R(x + 23, b - 21, 3, 8, k.p); R(x + 23, b - 21, 3, 1, k.c);
  } },
  { id: 'bedbench', name: 'Bed bench', w: 2, h: 1, price: 420, draw(x, b, vw, dir) {
    if (dir % 2) return sideBox(x, b, vw, 22);
    floorShadow(x, b, vw); for (const i of [3, vw - 7]) cyl(x + i, b - 12, 4, 12, sh(k.w, -1));
    wood(x + 1, b - 16, vw - 2, 5, k.w); cushion(x + 2, b - 23, vw - 4, 8, k.c, 3); for (let i = 8; i < vw - 6; i += 10) disc(x + i, b - 19, 1, sh(k.c, -2));
  } },
  { id: 'hathooks', name: 'Hat hooks', w: 1, h: 1, layer: 'wall', price: 140, wall(x) {
    wood(x + 1, 24, 30, 5, k.w); for (const i of [6, 17, 27]) R(x + i, 29, 2, 4, k.m);
    cushion(x + 1, 33, 11, 7, k.c, 3); R(x + 6, 38, 8, 2, sh(k.c, -1));
    oval(x + 17, 43, 6, 2, k.a); ovalShade(x + 17, 39, 4, 4, k.a); R(x + 13, 41, 9, 1, k.c);
    R(x + 26, 33, 3, 22, k.p); R(x + 29, 33, 2, 16, k.p); R(x + 26, 50, 3, 2, k.c); R(x + 26, 46, 3, 1, k.c);
  } },
  { id: 'divider', name: 'Folding screen', w: 2, h: 1, price: 480, draw(x, b, vw) {
    floorShadow(x, b, vw);
    const n = Math.max(2, Math.round(vw / 16)), pw = Math.floor(vw / n);
    for (let i = 0; i < n; i++) {
      const px = x + i * pw;
      wood(px, b - 70, pw - 1, 66, k.w, 'y'); inset(px + 2, b - 67, pw - 5, 58, k.p);
      for (let j = 0; j < 30; j++) P(px + 4 + Math.round(Math.sin(j / 5 + i) * 2), b - 20 - j, sh(k.leaf, -1));
      flower(px + Math.floor(pw / 2), b - 46 + (i % 2) * 10, k.c); flower(px + 4, b - 30 - (i % 2) * 8, k.a);
      R(px + 1, b - 4, 3, 4, sh(k.w, -2));
    }
  } },
  { id: 'heartpillow', name: 'Heart pillow', w: 1, h: 1, price: 160, high: 0.2, side: 'c', seat: 'cushion', flat() {
    stamp(MOTIFS.heart, 2, 4, { '#': k.c, '+': sh(k.c, 1) }, 3); disc(16, 15, 1.5, sh(k.c, -1));
  } },
]);

/* ---------- office ---------- */
function officeDesk(x, b) {
  floorShadow(x, b, 32); cyl(x + 3, b - 30, 2, 30, k.m); R(x + 3, b - 2, 14, 2, k.m);
  wood(x + 17, b - 30, 13, 28, k.w); R(x + 17, b - 2, 13, 2, sh(k.w, -2));
  for (let r = 0; r < 3; r++) { inset(x + 18, b - 28 + r * 9, 11, 7, sh(k.w, 1)); R(x + 22, b - 25 + r * 9, 3, 1, k.a); }
  wood(x, b - 34, 32, 4, sh(k.w, 1));
  return b - 34;
}
const DESKS = {
  laptop: ['Laptop', (x, t) => {
    R(x + 6, t - 2, 18, 2, k.m); panel(x + 8, t - 15, 14, 13, k.m); R(x + 9, t - 14, 12, 10, '#68b8f0'); R(x + 10, t - 12, 6, 1, '#ffffff'); R(x + 10, t - 10, 8, 1, '#d8f0ff');
    cyl(x + 25, t - 6, 4, 6, k.c); R(x + 29, t - 5, 1, 3, k.c);
  }],
  typewriter: ['Typewriter', (x, t) => {
    R(x + 10, t - 18, 12, 10, '#fffbe8'); for (let j = 0; j < 3; j++) R(x + 12, t - 16 + j * 2, 8, 1, '#a8a8b8');
    panel(x + 5, t - 9, 22, 9, k.c, 2); R(x + 7, t - 10, 18, 2, '#303038');
    for (let j = 0; j < 2; j++) for (let i = 0; i < 6; i++) P(x + 8 + i * 3 + j, t - 6 + j * 2, '#f4f4f0');
  }],
  paper: ['Paperwork', (x, t) => {
    for (let i = 0; i < 3; i++) { const h = [8, 12, 6][i]; panel(x + 3 + i * 9, t - h, 8, h, '#f8f8f0'); for (let j = 2; j < h; j += 2) R(x + 4 + i * 9, t - h + j, 6, 1, '#d8d8d0'); }
    R(x + 2, t - 2, 28, 2, k.c);
  }],
  phone: ['Phone', (x, t) => {
    panel(x + 4, t - 6, 14, 6, k.c); R(x + 3, t - 10, 16, 3, sh(k.c, -1)); disc(x + 4, t - 8, 2, sh(k.c, -1)); disc(x + 18, t - 8, 2, sh(k.c, -1));
    for (let i = 0; i < 3; i++) P(x + 8 + i * 3, t - 4, '#f4f4f0');
    cyl(x + 23, t - 3, 6, 3, k.m); R(x + 25, t - 16, 1, 13, k.m); tri(x + 25, t - 21, 6, k.a, 0.9);
  }],
  monitor: ['Twin monitor', (x, t) => {
    for (const i of [2, 17]) { panel(x + i, t - 18, 13, 11, '#303038'); R(x + i + 1, t - 17, 11, 8, '#4a88d8'); R(x + i + 2, t - 15, 5, 1, '#d8f0ff'); R(x + i + 5, t - 7, 3, 5, k.m); R(x + i + 3, t - 2, 7, 2, k.m); }
  }],
};
add('Office', Object.entries(DESKS).map(([id, [name, top]]) => ({ set: 'desk', id: `${id}desk`, name: `${name} desk`, w: 1, h: 1, price: 420,
  draw(x, b) { top(x, officeDesk(x, b)); } })));
add('Office', [
  { id: 'swivelchair', name: 'Swivel chair', w: 1, h: 1, price: 300, draw(x, b) {
    floorShadow(x + 2, b, 28); R(x + 5, b - 4, 22, 2, k.m); for (const i of [5, 15, 25]) disc(x + i + 1, b - 2, 1.5, '#303038');
    cyl(x + 15, b - 18, 3, 14, k.m); cushion(x + 8, b - 50, 16, 26, k.c, 4); R(x + 12, b - 30, 8, 4, k.m);
    cushion(x + 6, b - 24, 20, 7, k.c, 3); R(x + 4, b - 30, 3, 8, k.m); R(x + 25, b - 30, 3, 8, k.m); R(x + 3, b - 31, 5, 2, k.m); R(x + 24, b - 31, 5, 2, k.m);
  } },
  { id: 'filing', name: 'Filing cabinet', w: 1, h: 1, price: 340, draw(x, b) {
    floorShadow(x + 2, b, 28); panel(x + 4, b - 62, 24, 62, k.m, 2);
    for (let r = 0; r < 4; r++) { const y = b - 59 + r * 15; inset(x + 6, y, 20, 13, sh(k.m, 1)); R(x + 12, y + 3, 8, 2, k.a); R(x + 13, y + 7, 6, 2, '#fffbe8'); }
  } },
  { id: 'copier', name: 'Photocopier', w: 1, h: 1, price: 700, draw(x, b) {
    floorShadow(x, b, 32); panel(x + 2, b - 34, 28, 30, k.p, 2); R(x + 2, b - 4, 28, 4, sh(k.p, -2));
    for (const y of [26, 16]) { inset(x + 5, b - y, 22, 8, sh(k.p, -1)); R(x + 13, b - y + 3, 6, 1, k.m); }
    panel(x + 1, b - 42, 30, 8, k.p); R(x + 3, b - 46, 20, 4, sh(k.p, -1)); R(x + 22, b - 41, 7, 4, '#3a3a48'); P(x + 24, b - 40, '#68e868'); P(x + 27, b - 40, k.c);
    R(x + 28, b - 31, 4, 2, k.m); R(x + 28, b - 33, 4, 2, '#ffffff');
  } },
  { id: 'whiteboard', name: 'Whiteboard', w: 2, h: 1, layer: 'wall', price: 280, wall(x) {
    shadowWall(x + 3, 14, 58, 40); panel(x + 3, 14, 58, 40, k.m); R(x + 5, 16, 54, 36, '#f8faff');
    for (let i = 0; i < 20; i++) P(x + 9 + i, 44 - Math.round(i * 0.8 + Math.sin(i / 2) * 2), '#e04848'); R(x + 9, 22, 1, 24, '#303038'); R(x + 9, 45, 22, 1, '#303038');
    for (let j = 0; j < 4; j++) R(x + 36, 22 + j * 5, 16 - (j % 2) * 5, 1, '#4a78d8');
    for (let a = 0; a < 24; a++) P(Math.round(x + 44 + Math.cos(a / 24 * Math.PI * 2) * 5), Math.round(44 + Math.sin(a / 24 * Math.PI * 2) * 4), k.c);
    R(x + 8, 54, 48, 3, k.m); R(x + 12, 52, 5, 2, '#e04848'); R(x + 19, 52, 5, 2, '#4a78d8'); R(x + 40, 52, 7, 2, k.c);
  } },
  { id: 'shredder', name: 'Shredder', w: 1, h: 1, price: 220, draw(x, b) {
    floorShadow(x + 4, b, 24); panel(x + 6, b - 26, 20, 26, k.m); glass(x + 8, b - 20, 16, 16, '#d8e4ea');
    for (let i = 0; i < 7; i++) R(x + 9 + i * 2, b - 12 + Math.floor(hash(i) * 4), 1, 6, '#ffffff');
    R(x + 10, b - 40, 12, 9, '#ffffff'); for (let j = 0; j < 3; j++) R(x + 12, b - 38 + j * 2, 8, 1, '#c8c8d0');
    panel(x + 4, b - 32, 24, 6, k.c); R(x + 8, b - 30, 16, 1, '#202028'); P(x + 25, b - 30, '#68e868');
  } },
  { id: 'bindershelf', name: 'Binder shelf', w: 1, h: 1, price: 480, draw(x, b, vw, dir) {
    floorShadow(x, b, 32); wood(x + 1, b - 74, 30, 74, k.w, 'y');
    if (dir === 2) return;
    const cs = [k.c, k.a, BERRY[1], k.p, BERRY[5]];
    for (let r = 0; r < 3; r++) {
      const top = b - 70 + r * 23; R(x + 4, top, 24, 19, sh(k.w, -2));
      for (let i = 0; i < 5; i++) { const c = cs[(i + r) % 5], px = x + 5 + Math.floor(i * 4.6); panel(px, top + 3, 4, 16, c); R(px + 1, top + 6, 2, 3, '#ffffff'); disc(px + 2, top + 14, 1, sh(c, -2)); }
      wood(x + 2, top + 19, 28, 3, sh(k.w, 1));
    }
  } },
  { id: 'safe', name: 'Office safe', w: 1, h: 1, price: 600, draw(x, b) {
    floorShadow(x + 1, b, 30); panel(x + 3, b - 30, 26, 28, k.m, 2); R(x + 4, b - 2, 4, 2, '#202028'); R(x + 24, b - 2, 4, 2, '#202028');
    inset(x + 6, b - 27, 20, 22, sh(k.m, 1)); disc(x + 14, b - 16, 5, sh(k.m, -1)); disc(x + 14, b - 16, 4, k.a); R(x + 14, b - 20, 1, 4, '#202028');
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; P(Math.round(x + 14 + Math.cos(a) * 3), Math.round(b - 16 + Math.sin(a) * 3), sh(k.a, -2)); }
    R(x + 21, b - 20, 2, 9, k.a);
  } },
  { id: 'saleschart', name: 'Sales chart', w: 1, h: 1, layer: 'wall', price: 120, wall(x) {
    shadowWall(x + 4, 16, 24, 30); panel(x + 4, 16, 24, 30, '#ffffff'); R(x + 6, 19, 1, 24, '#303038'); R(x + 6, 42, 20, 1, '#303038');
    [6, 10, 14, 20].forEach((h, i) => R(x + 9 + i * 4, 42 - h, 3, h, i % 2 ? k.a : k.c));
    for (let i = 0; i < 16; i++) P(x + 8 + i, 37 - i, '#e04848'); R(x + 22, 21, 3, 1, '#e04848'); R(x + 24, 21, 1, 3, '#e04848');
    disc(x + 16, 16, 1.5, k.c);
  } },
  { id: 'cubicle', name: 'Cubicle wall', w: 2, h: 1, price: 400, draw(x, b, vw, dir) {
    floorShadow(x, b, vw);
    if (dir % 2) { panel(x + 12, b - 56, 8, 56, k.m); return; }
    panel(x + 1, b - 56, vw - 2, 56, k.m); R(x + 4, b - 52, vw - 8, 48, k.c); speckle(x + 4, b - 52, vw - 8, 48, sh(k.c, -1), 5, 0.2);
    for (const [i, j, c] of [[8, -46, '#f8e870'], [20, -40, '#a8e8f8'], [34, -48, '#f8b0c8'], [46, -38, '#ffffff']]) { panel(x + i, b + j, 9, 9, c); R(x + i + 2, b + j + 3, 5, 1, sh(c, -2)); R(x + i + 2, b + j + 5, 4, 1, sh(c, -2)); disc(x + i + 4, b + j, 1, k.a); }
    panel(x + 12, b - 26, 12, 10, '#ffffff'); R(x + 13, b - 25, 10, 6, '#88c8f0'); R(x + 13, b - 21, 10, 2, '#68b048');
  } },
  { id: 'serverrack', name: 'Server rack', w: 1, h: 1, price: 1100, glow: ['#68e868', '#68b8f8'], draw(x, b) {
    floorShadow(x + 2, b, 28); panel(x + 4, b - 76, 24, 76, sh(k.m, -1), 2);
    for (let r = 0; r < 9; r++) {
      const y = b - 72 + r * 8; R(x + 6, y, 20, 6, '#3a3a48'); R(x + 6, y, 20, 1, '#4a4a5a');
      for (let i = 0; i < 3; i++) P(x + 8 + i * 3, y + 3, hash(r, i) < 0.5 ? '#68e868' : '#68b8f8');
      R(x + 18, y + 2, 6, 2, '#1a1a22');
    }
    R(x + 4, b - 78, 24, 2, k.a);
  } },
  { id: 'projscreen', name: 'Projector screen', w: 2, h: 1, layer: 'wall', price: 360, wall(x) {
    R(x + 6, 17, 52, 44, '#f8f8f4'); R(x + 6, 17, 52, 2, '#d8d8d0'); R(x + 12, 24, 40, 2, sh(k.c, 1));
    [12, 18, 9, 22].forEach((h, i) => R(x + 16 + i * 8, 54 - h, 5, h, i % 2 ? sh(k.a, 1) : sh(k.c, 1)));
    R(x + 6, 59, 52, 2, k.m); R(x + 32, 61, 1, 6, k.m); disc(x + 32, 68, 1.5, k.a); cyl(x + 2, 12, 60, 5, k.m);
  } },
  { id: 'meetingtable', name: 'Meeting table', w: 2, h: 1, price: 800, draw(x, b, vw) {
    floorShadow(x, b, vw); for (const i of [6, vw - 10]) cyl(x + i, b - 24, 4, 24, sh(k.w, -1));
    wood(x + 1, b - 28, vw - 2, 5, k.w); R(x + 1, b - 23, vw - 2, 1, sh(k.w, -3));
    panel(x + 6, b - 30, 10, 2, '#ffffff'); cyl(x + vw - 16, b - 34, 4, 6, k.c);
    if (vw > 40) { panel(x + 24, b - 31, 9, 3, '#ffffff'); cyl(x + 38, b - 40, 6, 12, '#d8eef8'); R(x + 38, b - 34, 6, 6, '#a8d8f0'); }
  } },
  { id: 'mailcart', name: 'Mail trolley', w: 1, h: 1, price: 280, draw(x, b) {
    floorShadow(x, b, 32); for (const i of [6, 24]) { disc(x + i, b - 3, 3, '#303038'); P(x + i - 1, b - 4, '#6a6a78'); }
    R(x + 3, b - 8, 26, 2, k.m); cushion(x + 4, b - 34, 22, 26, k.c, 3); R(x + 4, b - 22, 22, 1, sh(k.c, -1));
    panel(x + 7, b - 40, 10, 7, '#fffbe8'); for (let i = 0; i < 5; i++) { P(x + 7 + i, b - 40 + i, '#c8b890'); P(x + 16 - i, b - 40 + i, '#c8b890'); }
    panel(x + 15, b - 42, 10, 8, '#f8e8c8'); R(x + 18, b - 40, 3, 3, '#e04848');
    R(x + 26, b - 46, 2, 38, k.m); R(x + 24, b - 47, 6, 2, k.m);
  } },
  { id: 'paperboxes', name: 'Paper boxes', w: 1, h: 1, price: 120, draw(x, b) {
    floorShadow(x, b, 32); panel(x + 2, b - 16, 28, 16, '#d8b888'); R(x + 2, b - 12, 28, 2, k.c); inset(x + 10, b - 9, 12, 5, '#ffffff');
    R(x + 8, b - 33, 16, 3, '#ffffff'); panel(x + 5, b - 30, 22, 14, '#d8b888'); R(x + 5, b - 26, 22, 2, k.c); R(x + 14, b - 22, 4, 3, '#ffffff');
  } },
  { id: 'plaque', name: 'Brass plaque', w: 1, h: 1, layer: 'wall', price: 140, wall(x) {
    shadowWall(x + 4, 26, 24, 16); wood(x + 4, 26, 24, 16, k.w); panel(x + 6, 28, 20, 12, k.a);
    R(x + 9, 31, 14, 1, sh(k.a, -2)); R(x + 11, 35, 10, 1, sh(k.a, -2)); for (const [i, j] of [[7, 29], [24, 29], [7, 38], [24, 38]]) P(x + i, j, sh(k.a, -2));
  } },
  { id: 'minifridge', name: 'Mini fridge', w: 1, h: 1, price: 380, draw(x, b) {
    floorShadow(x + 3, b, 26); panel(x + 5, b - 32, 22, 32, k.p, 2); R(x + 5, b - 22, 22, 1, sh(k.p, -2));
    R(x + 22, b - 30, 2, 6, k.m); R(x + 22, b - 19, 2, 10, k.m); disc(x + 10, b - 27, 1.5, k.c); panel(x + 9, b - 16, 6, 7, '#fffbe8'); disc(x + 12, b - 16, 1, k.a);
    cyl(x + 9, b - 37, 7, 5, k.pot); foliage(x + 12, b - 41, 5, k.leaf, 3);
  } },
  { id: 'printer', name: 'Printer stand', w: 1, h: 1, price: 320, draw(x, b) {
    floorShadow(x + 1, b, 30); R(x + 4, b - 20, 2, 20, k.m); R(x + 26, b - 20, 2, 20, k.m); R(x + 4, b - 8, 24, 2, k.m); wood(x + 2, b - 22, 28, 3, k.w);
    R(x + 6, b - 13, 20, 5, '#f8f8f0'); R(x + 9, b - 40, 14, 6, '#ffffff');
    panel(x + 4, b - 34, 24, 12, k.p, 2); R(x + 8, b - 30, 16, 2, '#303038'); R(x + 9, b - 29, 14, 1, '#ffffff'); P(x + 24, b - 32, '#68e868');
  } },
  { id: 'briefcase', name: 'Briefcase', w: 1, h: 1, price: 160, draw(x, b) {
    floorShadow(x + 3, b, 26); R(x + 11, b - 23, 10, 2, sh(k.w, -1)); R(x + 11, b - 23, 2, 5, sh(k.w, -1)); R(x + 19, b - 23, 2, 5, sh(k.w, -1));
    panel(x + 4, b - 18, 24, 18, k.w, 2); R(x + 4, b - 12, 24, 1, sh(k.w, -2)); R(x + 8, b - 14, 3, 3, k.a); R(x + 21, b - 14, 3, 3, k.a);
  } },
  { id: 'execdesk', name: 'Executive desk', w: 2, h: 1, price: 1200, draw(x, b, vw, dir) {
    if (dir % 2) return sideBox(x, b, vw, 36);
    floorShadow(x, b, vw); wood(x + 1, b - 32, vw - 2, 32, k.w);
    if (dir === 2) return;
    for (const i of [4, vw - 22]) { inset(x + i, b - 28, 18, 24, sh(k.w, 1)); wood(x + i + 1, b - 27, 16, 22, k.w, 'y'); R(x + i + 7, b - 16, 4, 1, k.a); }
    R(x + 23, b - 28, vw - 46, 24, sh(k.w, -2));
    wood(x, b - 36, vw, 5, sh(k.w, 1)); R(x + 8, b - 36, vw - 16, 1, k.c);
    panel(x + vw / 2 - 8, b - 40, 16, 4, k.a); R(x + 10, b - 46, 1, 10, k.a); R(x + 7, b - 37, 7, 1, k.a); ovalShade(x + 12, b - 47, 7, 3, '#3a8a5a');
    cyl(x + vw - 14, b - 40, 5, 4, '#303038'); R(x + vw - 12, b - 48, 1, 8, '#ffffff');
  } },
  { id: 'stickywall', name: 'Sticky notes', w: 1, h: 1, layer: 'wall', price: 90, wall(x) {
    const cs = ['#f8e870', '#f8b0c8', '#a8e8f8', '#b8f0a0', '#f8c890'];
    for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) {
      const c = i === 1 && j === 1 ? k.c : cs[(i + j * 2) % 5], px = x + 4 + i * 9, py = 16 + j * 10 + (i % 2);
      panel(px, py, 8, 8, c); R(px + 1, py + 3, 5, 1, sh(c, -2)); R(px + 1, py + 5, 4, 1, sh(c, -2));
    }
  } },
]);

/* ---------- café ---------- */
function bistro(x, b) {
  floorShadow(x + 4, b, 24); R(x + 9, b - 2, 14, 2, k.m); cyl(x + 15, b - 28, 3, 26, k.m);
  oval(x + 16, b - 29, 14, 3, sh(k.p, -1)); oval(x + 16, b - 30, 13, 2, k.p);
  return b - 31;
}
const CAFE = {
  latte: ['Latte', (x, t) => {
    oval(x + 15, t, 7, 1.5, '#ffffff'); cyl(x + 11, t - 7, 8, 7, '#ffffff'); R(x + 19, t - 6, 2, 1, '#ffffff'); R(x + 20, t - 6, 1, 3, '#ffffff');
    oval(x + 15, t - 7, 3, 1, '#c89058'); P(x + 15, t - 7, '#fff4e0'); for (const [i, j] of [[13, -10], [15, -12], [14, -14]]) P(x + i, t + j, '#ffffff');
    disc(x + 24, t - 1, 2.5, '#d8a058'); P(x + 23, t - 2, '#5a3018');
  }],
  cake: ['Cake', (x, t) => {
    oval(x + 16, t, 9, 1.5, '#ffffff');
    for (let j = 0; j < 10; j++) R(x + 9, t - 10 + j, 4 + Math.round(j * 1.2), 1, j < 2 ? '#fff4e0' : j % 4 === 1 ? k.c : '#f8e0b8');
    sphere(x + 11, t - 12, 2, '#e03838'); R(x + 11, t - 15, 1, 2, k.leaf);
  }],
  macaron: ['Macaron', (x, t) => {
    oval(x + 16, t, 9, 1.5, '#ffffff');
    [[12, -3, k.c], [20, -3, '#a8e0a8'], [16, -7, '#f8c8d8'], [12, -11, k.a], [20, -11, '#c8b0f0'], [16, -15, k.c]].forEach(([i, j, c]) => { oval(x + i, t + j - 1, 3.5, 1.5, c); R(x + i - 3, t + j, 7, 1, '#fff4e0'); oval(x + i, t + j + 1, 3.5, 1, sh(c, -1)); });
  }],
  teapot: ['Teapot', (x, t) => {
    for (let i = 0; i < 6; i++) R(x + 4 + i, t - 4 - Math.floor(i * 0.8), 2, 2, k.c);
    ovalShade(x + 14, t - 6, 7, 6, k.c); R(x + 20, t - 9, 3, 1, k.c); R(x + 22, t - 9, 1, 5, k.c); R(x + 20, t - 5, 3, 1, k.c);
    sphere(x + 14, t - 13, 2, k.a); cyl(x + 24, t - 4, 4, 4, '#ffffff'); P(x + 25, t - 4, '#c87830');
  }],
  sundae: ['Sundae', (x, t) => {
    R(x + 14, t - 3, 5, 3, '#e8f4f8'); R(x + 15, t - 7, 3, 4, '#e8f4f8');
    for (let j = 0; j < 8; j++) { const h = 6 - Math.floor(j / 3); R(x + 16 - h, t - 15 + j, h * 2 + 1, 1, j < 3 ? '#fff4e0' : '#e8f4f8'); }
    sphere(x + 14, t - 17, 3.5, '#f8f0e0'); sphere(x + 19, t - 17, 3, BERRY[2]); sphere(x + 16, t - 21, 3, k.c); sphere(x + 17, t - 25, 1.5, '#e03838');
    R(x + 21, t - 24, 2, 6, '#e8c070');
  }],
};
add('Café', Object.entries(CAFE).map(([id, [name, top]]) => ({ id: `${id}table`, name: `${name} table`, w: 1, h: 1, price: 340,
  draw(x, b) { top(x, bistro(x, b)); } })));
add('Café', [
  { id: 'espresso', name: 'Espresso bar', w: 1, h: 1, price: 900, draw(x, b) {
    const t = cabinet(x, b, 32);
    for (let i = 0; i < 3; i++) cyl(x + 7 + i * 6, t - 27, 4, 5, k.c);
    panel(x + 4, t - 22, 24, 22, k.m, 2); R(x + 4, t - 22, 24, 3, sh(k.m, 1)); R(x + 8, t - 14, 16, 1, '#202028');
    R(x + 10, t - 13, 2, 4, k.m); R(x + 20, t - 13, 2, 4, k.m); cyl(x + 9, t - 6, 4, 5, '#ffffff'); cyl(x + 19, t - 6, 4, 5, '#ffffff');
    disc(x + 16, t - 18, 2.5, '#fffbe8'); P(x + 16, t - 19, '#e04848'); R(x + 26, t - 14, 1, 8, k.m);
  } },
  { id: 'pastrycase', name: 'Pastry case', w: 2, h: 1, price: 950, draw(x, b, vw, dir) {
    if (dir % 2) return sideBox(x, b, vw, 44);
    floorShadow(x, b, vw); wood(x + 1, b - 20, vw - 2, 20, k.w);
    R(x + 2, b - 44, vw - 4, 22, '#e0eef4'); R(x + 2, b - 33, vw - 4, 1, '#c8d8e0');
    for (let i = 6; i < vw - 6; i += 10) { oval(x + i, b - 25, 4, 2, '#d8a058'); R(x + i - 2, b - 26, 4, 1, '#f0c880'); }
    for (let i = 8; i < vw - 6; i += 10) { disc(x + i, b - 37, 3, (i / 10 | 0) % 2 ? k.c : BERRY[2]); disc(x + i, b - 37, 1, '#e0eef4'); }
    for (let i = 0; i < 12; i++) { P(x + 6 + i, b - 24 - i, '#ffffff'); if (vw > 40) P(x + 36 + i, b - 24 - i, '#ffffff'); }
    R(x + 1, b - 46, vw - 2, 2, k.m); panel(x, b - 22, vw, 3, sh(k.w, 1));
  } },
  { id: 'aframe', name: 'Chalk A-board', w: 1, h: 1, price: 160, draw(x, b) {
    floorShadow(x + 4, b, 24); R(x + 6, b - 4, 2, 4, sh(k.w, -1)); R(x + 24, b - 4, 2, 4, sh(k.w, -1));
    wood(x + 6, b - 44, 20, 40, k.w); inset(x + 8, b - 42, 16, 32, '#2a3a34');
    R(x + 13, b - 36, 6, 5, '#f4f4f0'); R(x + 19, b - 35, 2, 1, '#f4f4f0'); R(x + 20, b - 35, 1, 3, '#f4f4f0'); disc(x + 16, b - 38, 1, k.c);
    R(x + 10, b - 26, 12, 1, '#d8e8d8'); R(x + 11, b - 22, 9, 1, '#d8e8d8'); R(x + 12, b - 17, 6, 1, '#f8e070');
  } },
  { id: 'awning', name: 'Café awning', w: 2, h: 1, layer: 'wall', price: 240, wall(x) {
    R(x + 2, 33, 60, 2, 'rgba(0,0,0,0.18)');
    for (let i = 0; i < 8; i++) { const c = i % 2 ? k.c : k.p; for (let j = 0; j < 14; j++) R(x + i * 8, 14 + j, 8, 1, j < 1 ? sh(c, 1) : c); disc(x + i * 8 + 4, 28, 4, c); }
    R(x, 12, 64, 2, k.m);
  } },
  { id: 'cafelights', name: 'Café bulbs', w: 2, h: 1, layer: 'wall', price: 260, glow: ['#f8d890', '#fff0c0'], wall(x) {
    const y = sag(59, 16, 16);
    for (let i = 0; i < 60; i++) P(x + 2 + i, y(i), '#3a3a40');
    for (let i = 4; i < 60; i += 10) { R(x + 1 + i, y(i), 2, 3, k.m); ovalShade(x + 2 + i, y(i) + 6, 2.5, 3.5, '#f8d890'); P(x + 2 + i, y(i) + 6, '#fff8e0'); }
  } },
  { id: 'beansacks', name: 'Coffee sacks', w: 1, h: 1, price: 180, draw(x, b) {
    floorShadow(x, b, 32);
    const sack = (cx, h, c) => {
      for (let j = 0; j < h; j++) { const half = j < 4 ? 3 + j : 7 + Math.min(4, Math.floor((j - 4) / 4)); R(cx - half, b - h + j, half * 2, 1, j < 4 ? sh(c, -1) : c); for (let i = -half; i < half; i++) if (hash(cx + i, j, 7) < 0.15) P(cx + i, b - h + j, sh(c, -1)); }
      R(cx - 4, b - h + 3, 8, 2, sh(c, -2));
    };
    sack(x + 10, 22, '#b89868'); sack(x + 21, 28, '#c8a878'); R(x + 17, b - 15, 8, 5, k.c); P(x + 20, b - 13, '#ffffff');
    for (let n = 0; n < 6; n++) oval(x + 4 + n * 4, b - 1, 1.5, 1, '#5a3018');
  } },
  { id: 'grinder', name: 'Bean grinder', w: 1, h: 1, price: 260, draw(x, b) {
    floorShadow(x + 4, b, 24); wood(x + 6, b - 26, 20, 26, k.w, 'y'); inset(x + 10, b - 22, 12, 6, sh(k.w, 1)); R(x + 15, b - 19, 2, 1, k.a);
    panel(x + 9, b - 34, 14, 8, k.m);
    for (let j = 0; j < 10; j++) { const half = 7 - Math.floor(j / 2); R(x + 16 - half, b - 44 + j, half * 2, 1, j > 4 ? '#6a3a1a' : '#e8f4f8'); }
    R(x + 22, b - 46, 6, 1, k.m); R(x + 27, b - 48, 2, 3, k.a);
  } },
  { id: 'booth', name: 'Café booth', w: 2, h: 1, price: 760, draw(x, b, vw, dir) {
    if (dir % 2) return sideBox(x, b, vw, 48);
    floorShadow(x, b, vw); cushion(x + 2, b - 52, vw - 4, 32, k.c, 4); for (let i = 10; i < vw - 6; i += 10) R(x + i, b - 48, 1, 24, sh(k.c, -1));
    wood(x, b - 56, vw, 5, k.w); wood(x + 1, b - 14, vw - 2, 14, k.w); cushion(x + 2, b - 22, vw - 4, 9, k.c, 3);
  } },
  { id: 'donutwall', name: 'Donut board', w: 1, h: 1, layer: 'wall', price: 200, wall(x) {
    shadowWall(x + 3, 14, 26, 48); wood(x + 3, 14, 26, 48, k.w, 'y');
    const icing = [k.c, '#f890b8', '#5a3018', k.a];
    for (let r = 0; r < 3; r++) for (let i = 0; i < 2; i++) {
      const cx = x + 10 + i * 12, cy = 25 + r * 14;
      disc(cx, cy, 5, '#d8a058'); disc(cx - 0.5, cy - 0.5, 4.5, icing[(r + i) % 4]); disc(cx, cy, 1.5, k.w);
      for (let n = 0; n < 4; n++) P(cx - 3 + Math.floor(hash(r, i, n) * 6), cy - 3 + Math.floor(hash(n, r, i) * 3), RAINBOW[(n + r) % 7]);
    }
  } },
  { id: 'icecreamcart', name: 'Ice cream cart', w: 1, h: 1, price: 680, draw(x, b) {
    floorShadow(x, b, 32); R(x + 15, b - 82, 2, 52, k.m);
    for (let j = 0; j < 12; j++) { const half = Math.round(j * 1.3); for (let i = -half; i <= half; i++) P(x + 16 + i, b - 86 + j, Math.floor((i + 40) / 4) % 2 ? k.c : k.p); }
    panel(x + 3, b - 30, 26, 22, k.p, 2); R(x + 3, b - 24, 26, 3, k.c); sphere(x + 16, b - 16, 3, BERRY[2]); tri(x + 16, b - 13, 5, '#d8a058', 0.5);
    R(x + 2, b - 33, 28, 3, k.m); disc(x + 7, b - 5, 5, '#303038'); disc(x + 7, b - 5, 2, k.m); R(x + 26, b - 8, 2, 8, k.m);
  } },
  { id: 'parasoltable', name: 'Parasol table', w: 1, h: 1, price: 520, draw(x, b) {
    const t = bistro(x, b); R(x + 15, b - 82, 2, 52, k.m);
    for (let j = 0; j < 10; j++) { const half = 4 + j * 1.3; R(x + 16 - half, b - 88 + j, half * 2, 1, j < 2 ? sh(k.a, 1) : k.a); }
    for (let i = 0; i < 5; i++) disc(x + 4 + i * 6, b - 78, 2.5, k.a);
    cyl(x + 7, t - 6, 4, 6, '#ffffff'); P(x + 8, t - 6, '#8a5a30');
  } },
  { id: 'syrupshelf', name: 'Syrup shelf', w: 2, h: 1, layer: 'wall', price: 300, wall(x) {
    const cs = ['#8a3018', '#e8a030', k.c, '#5a8a3a', '#c84878', '#f0d8a0', k.a];
    for (const y of [36, 58]) {
      cs.forEach((c, i) => { const px = x + 5 + i * 8; R(px + 1, y - 16, 4, 16, c); R(px + 2, y - 20, 2, 4, c); R(px + 2, y - 21, 2, 1, '#303038'); R(px + 1, y - 10, 4, 4, '#fffbe8'); P(px + 1, y - 14, '#ffffff'); });
      wood(x + 2, y, 60, 4, k.w); R(x + 2, y + 4, 60, 1, 'rgba(0,0,0,0.25)');
    }
  } },
  { id: 'breadoven', name: 'Bread oven', w: 1, h: 1, price: 1000, glow: ['#f8a030', '#f8e070'], draw(x, b) {
    floorShadow(x, b, 32); wood(x + 2, b - 18, 28, 18, k.w);
    R(x + 20, b - 46, 6, 10, '#8a4a3a'); R(x + 19, b - 47, 8, 2, '#6a3a2a');
    for (let j = 0; j < 14; j++) { const half = Math.round(Math.sqrt(196 - (14 - j) ** 2)); R(x + 16 - half, b - 32 + j, half * 2, 1, j % 4 === 3 ? '#a85840' : j < 3 ? '#d8805a' : '#c8684a'); for (let i = -half; i < half; i += 6) P(x + 16 + i + (j >> 2) % 2 * 3, b - 32 + j, '#a85840'); }
    R(x + 10, b - 24, 12, 6, '#2a1810'); disc(x + 16, b - 24, 6, '#2a1810'); R(x + 10, b - 22, 12, 4, '#2a1810');
    tri(x + 16, b - 27, 8, '#f86030', 0.6); tri(x + 16, b - 24, 5, '#f8e070', 0.6);
    R(x + 3, b - 19, 26, 2, sh(k.w, 1));
  } },
  { id: 'teatins', name: 'Tea tins', w: 1, h: 1, layer: 'wall', price: 180, wall(x) {
    [38, 58].forEach((y, r) => {
      for (let i = 0; i < 3; i++) { const c = [k.c, k.a, '#4a8a5a'][(i + r) % 3]; cyl(x + 5 + i * 8, y - 12, 7, 12, c); R(x + 5 + i * 8, y - 14, 7, 2, sh(c, 1)); R(x + 6 + i * 8, y - 8, 5, 3, '#fffbe8'); }
      wood(x + 2, y, 28, 4, k.w); R(x + 2, y + 4, 28, 1, 'rgba(0,0,0,0.25)');
    });
  } },
  { id: 'cafefloor', name: 'Café tiles', w: 2, h: 2, layer: 'rug', price: 240, high: 0.03, side: 'm', flat(w, h) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) P(i, j, (Math.floor((i + j) / 8) + Math.floor((i - j + 64) / 8)) % 2 ? '#f4f4f0' : '#303038');
    R(0, 0, w, 3, k.c); R(0, h - 3, w, 3, k.c); R(0, 0, 3, h, k.c); R(w - 3, 0, 3, h, k.c);
  } },
  { id: 'cafechair', name: 'Bentwood chair', w: 1, h: 1, price: 220, draw(x, b) {
    floorShadow(x + 4, b, 24); cyl(x + 8, b - 18, 2, 18, k.w); cyl(x + 22, b - 18, 2, 18, k.w); R(x + 10, b - 8, 12, 1, k.w);
    R(x + 8, b - 34, 2, 12, k.w); R(x + 22, b - 34, 2, 12, k.w);
    for (let a = 0; a <= 40; a++) { const t = a / 40 * Math.PI; R(Math.round(x + 15 + Math.cos(t) * 8), Math.round(b - 34 - Math.sin(t) * 12), 2, 2, k.w); }
    for (let a = 0; a <= 30; a++) { const t = a / 30 * Math.PI; P(Math.round(x + 16 + Math.cos(t) * 5), Math.round(b - 30 - Math.sin(t) * 7), sh(k.w, -1)); }
    oval(x + 16, b - 20, 9, 3, sh(k.w, -1)); cushion(x + 7, b - 23, 18, 4, k.c, 2);
  } },
  { id: 'breadbasket', name: 'Bread basket', w: 1, h: 1, price: 150, draw(x, b) {
    floorShadow(x + 2, b, 28);
    for (const [i, ang] of [[10, -3], [16, 0], [22, 3]]) for (let j = 0; j < 26; j++) R(x + i + Math.round(ang * (26 - j) / 26), b - 40 + j, 4, 1, j < 2 ? '#e8b868' : j % 5 ? '#d8a058' : '#b8803a');
    for (let j = 0; j < 14; j++) { const s = Math.floor(j / 5); R(x + 3 + s, b - 14 + j, 26 - s * 2, 1, (j >> 1) % 2 ? k.w : sh(k.w, 1)); }
    for (let i = 0; i < 26; i += 4) R(x + 3 + i, b - 16, 2, 3, k.c); R(x + 3, b - 16, 26, 1, sh(k.c, 1));
  } },
  { id: 'milkchurn', name: 'Milk churn', w: 1, h: 1, price: 200, draw(x, b) {
    floorShadow(x + 5, b, 22); cyl(x + 7, b - 30, 18, 28, k.m); R(x + 6, b - 4, 20, 4, sh(k.m, -1)); R(x + 6, b - 20, 20, 2, sh(k.m, 1));
    cyl(x + 11, b - 38, 10, 8, k.m); cyl(x + 10, b - 42, 12, 4, sh(k.m, 1)); R(x + 5, b - 30, 2, 5, k.m); R(x + 25, b - 30, 2, 5, k.m);
    R(x + 7, b - 16, 18, 6, k.c); P(x + 15, b - 14, '#ffffff'); P(x + 17, b - 14, '#ffffff');
  } },
  { id: 'crepestand', name: 'Crêpe stand', w: 1, h: 1, price: 600, draw(x, b) {
    floorShadow(x, b, 32); R(x + 3, b - 62, 2, 34, k.w); R(x + 27, b - 62, 2, 34, k.w); panel(x + 2, b - 68, 28, 8, k.p); R(x + 8, b - 65, 16, 2, k.c);
    panel(x + 2, b - 28, 28, 22, k.c, 2); R(x + 2, b - 22, 28, 2, k.p); disc(x + 7, b - 4, 3, '#303038'); disc(x + 25, b - 4, 3, '#303038');
    R(x + 4, b - 31, 24, 3, '#303038'); oval(x + 12, b - 32, 7, 1.5, '#f0d090'); R(x + 18, b - 35, 6, 1, k.m); cyl(x + 24, b - 37, 4, 6, '#5a3018');
  } },
  { id: 'coffeeposter', name: 'Coffee poster', w: 1, h: 1, layer: 'wall', price: 120, wall(x) {
    shadowWall(x + 5, 14, 22, 32); panel(x + 5, 14, 22, 32, k.p); R(x + 7, 16, 18, 28, k.c);
    R(x + 11, 26, 10, 10, '#ffffff'); R(x + 21, 28, 3, 1, '#ffffff'); R(x + 23, 28, 1, 4, '#ffffff'); R(x + 21, 31, 3, 1, '#ffffff'); oval(x + 16, 26, 5, 1, '#8a5a30');
    for (const [i, j] of [[14, 23], [15, 21], [17, 22], [18, 20]]) P(x + i, j, '#ffffff'); R(x + 10, 38, 12, 2, '#fffbe8');
  } },
]);

/* ---------- school ---------- */
function schoolDesk(x, b) {
  floorShadow(x + 1, b, 30); cyl(x + 4, b - 26, 2, 26, k.m); cyl(x + 26, b - 26, 2, 26, k.m); R(x + 4, b - 6, 24, 1, k.m);
  panel(x + 3, b - 24, 26, 6, sh(k.w, -1)); R(x + 6, b - 23, 10, 4, k.c); R(x + 17, b - 22, 6, 3, k.a);
  wood(x + 1, b - 30, 30, 4, k.w);
  return b - 30;
}
const SCHOOL = {
  book: ['Book', (x, t) => {
    for (let i = 0; i < 9; i++) { R(x + 6 + i, t - 3 - Math.floor(i / 3), 1, 3 + Math.floor(i / 3), '#ffffff'); R(x + 16 + i, t - 5 + Math.floor(i / 3), 1, 5 - Math.floor(i / 3), '#f4f0e0'); }
    R(x + 5, t - 1, 21, 1, k.c); R(x + 15, t - 6, 1, 6, sh(k.c, -1)); R(x + 24, t - 2, 6, 1, '#f8d030'); P(x + 29, t - 2, '#e8a0a0');
  }],
  notebook: ['Notebook', (x, t) => {
    panel(x + 6, t - 3, 14, 3, k.c); for (let i = 0; i < 6; i++) P(x + 7 + i * 2, t - 4, k.m);
    R(x + 21, t - 2, 8, 2, '#f8d030'); P(x + 29, t - 2, '#303038'); panel(x + 8, t - 6, 10, 3, k.a);
  }],
  apple: ['Apple', (x, t) => { sphere(x + 16, t - 5, 5, '#e03838'); R(x + 16, t - 12, 1, 3, '#6a4426'); leaf(x + 19, t - 11, 2, 1, k.leaf); }],
  crayon: ['Crayon', (x, t) => {
    for (let i = 0; i < 5; i++) { R(x + 9 + i * 3, t - 14, 2, 6, RAINBOW[i]); P(x + 9 + i * 3, t - 15, RAINBOW[i]); }
    panel(x + 8, t - 9, 16, 9, '#f8d030'); R(x + 8, t - 6, 16, 2, k.c);
  }],
  test: ['A+', (x, t) => {
    panel(x + 9, t - 18, 14, 18, k.w); R(x + 13, t - 19, 6, 2, k.m); R(x + 11, t - 16, 10, 15, '#ffffff');
    bits(['.#.', '#.#', '###', '#.#'], x + 12, t - 14, { '#': '#e04848' }); R(x + 17, t - 12, 3, 1, '#e04848'); R(x + 18, t - 13, 1, 3, '#e04848');
    for (let j = 0; j < 3; j++) R(x + 12, t - 8 + j * 2, 8, 1, '#a8a8b8');
  }],
};
add('School', Object.entries(SCHOOL).map(([id, [name, top]]) => ({ set: 'schooldesk', id: `${id}schooldesk`, name: `${name} school desk`, proper: id === 'test', w: 1, h: 1, price: 280,
  draw(x, b) { top(x, schoolDesk(x, b)); } })));
add('School', [
  { id: 'chalkboard', name: 'Chalkboard', w: 2, h: 1, layer: 'wall', price: 320, wall(x) {
    shadowWall(x + 2, 14, 60, 42); wood(x + 2, 14, 60, 42, k.w); R(x + 5, 17, 54, 34, '#2a4a3a'); speckle(x + 5, 17, 54, 34, '#34584a', 4, 0.15);
    'ABC'.split('').forEach((L, i) => bits(LETTERS[L], x + 9 + i * 8, 22, { '#': '#e8f0e8' }, 2));
    R(x + 9, 37, 3, 1, '#e8f0e8'); R(x + 10, 36, 1, 3, '#e8f0e8'); R(x + 14, 37, 3, 1, '#e8f0e8'); R(x + 14, 39, 3, 1, '#e8f0e8');
    for (let a = 0; a < 32; a++) P(Math.round(x + 46 + Math.cos(a / 32 * Math.PI * 2) * 7), Math.round(32 + Math.sin(a / 32 * Math.PI * 2) * 7), '#e8f0e8');
    R(x + 39, 32, 14, 1, '#e8f0e8'); disc(x + 46, 32, 1.5, '#e8f0e8');
    R(x + 5, 52, 54, 3, sh(k.w, 1)); R(x + 12, 51, 4, 1, '#ffffff'); panel(x + 40, 50, 8, 3, k.c);
  } },
  { id: 'teacherdesk', name: 'Teacher’s desk', w: 2, h: 1, price: 760, draw(x, b, vw, dir) {
    if (dir % 2) return sideBox(x, b, vw, 34);
    floorShadow(x, b, vw); wood(x + 1, b - 30, vw - 2, 30, k.w);
    if (dir === 2) return;
    inset(x + 4, b - 26, 16, 22, sh(k.w, 1)); wood(x + 5, b - 25, 14, 20, k.w, 'y'); R(x + 16, b - 16, 1, 4, k.a);
    wood(x, b - 34, vw, 5, sh(k.w, 1));
    sphere(x + 10, b - 39, 4, '#e03838'); R(x + 10, b - 45, 1, 3, '#6a4426');
    panel(x + vw - 22, b - 38, 14, 4, k.c); panel(x + vw - 21, b - 42, 12, 4, k.a); panel(x + vw - 22, b - 46, 14, 4, BERRY[1]);
    ovalShade(x + 30, b - 37, 4, 3, k.a); R(x + 30, b - 42, 1, 2, k.m);
  } },
  { id: 'abacus', name: 'Abacus', w: 1, h: 1, price: 180, draw(x, b) {
    floorShadow(x + 2, b, 28); wood(x + 3, b - 40, 3, 38, k.w, 'y'); wood(x + 26, b - 40, 3, 38, k.w, 'y'); wood(x + 3, b - 42, 26, 3, k.w); wood(x + 3, b - 6, 26, 3, k.w);
    const cs = [k.c, k.a, BERRY[1], BERRY[3], BERRY[5]];
    [3, 6, 2, 5, 4].forEach((cnt, r) => { const y = b - 36 + r * 6; R(x + 6, y, 20, 1, k.m); for (let n = 0; n < 6; n++) disc(n < cnt ? x + 8 + n * 3 : x + 24 - (5 - n) * 3, y, 1.5, cs[r]); });
  } },
  { id: 'schoolbell', name: 'School bell', w: 1, h: 1, layer: 'wall', price: 220, wall(x) {
    wood(x + 12, 16, 8, 6, k.w); R(x + 15, 22, 2, 4, k.m);
    disc(x + 16, 36, 11, sh(k.a, -1)); disc(x + 15, 35, 10, k.a); disc(x + 12, 32, 4, sh(k.a, 1)); P(x + 10, 30, sh(k.a, 3)); disc(x + 16, 36, 2, sh(k.a, -2));
    R(x + 16, 47, 1, 4, k.m); disc(x + 16, 52, 2, k.m);
  } },
  { id: 'alphabet', name: 'Alphabet banner', w: 2, h: 1, layer: 'wall', price: 160, wall(x) {
    const y = sag(59, 18, 6); for (let i = 0; i < 60; i++) P(x + 2 + i, y(i), k.m);
    const cs = [k.c, k.a, BERRY[1], BERRY[3], BERRY[5], BERRY[2]];
    'ABCDEF'.split('').forEach((L, i) => { const cx = x + 3 + i * 10, top = y(cx - x - 2 + 4) + 1; panel(cx, top, 9, 11, cs[i]); bits(LETTERS[L], cx + 3, top + 3, { '#': '#ffffff' }); });
  } },
  { id: 'typechart', name: 'Type chart', w: 2, h: 1, layer: 'wall', price: 260, wall(x) {
    shadowWall(x + 4, 14, 56, 44); panel(x + 4, 14, 56, 44, '#ffffff'); R(x + 6, 16, 52, 4, k.c);
    const T = ['#f08030', '#6890f0', '#78c850', '#a8a878', '#f8d030', '#f85888'];
    for (let i = 0; i < 6; i++) { R(x + 12 + i * 8, 22, 6, 4, T[i]); R(x + 6, 28 + i * 5, 4, 4, T[i]); }
    for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) { const v = hash(i, j, 4); R(x + 12 + i * 8, 28 + j * 5, 6, 4, v < 0.2 ? '#e05050' : v < 0.4 ? '#58b858' : '#e8e8e8'); }
  } },
  { id: 'microscope', name: 'Microscope', w: 1, h: 1, price: 420, draw(x, b) {
    floorShadow(x, b, 32); legs4(x, b, 32, 20, k.w); wood(x + 2, b - 24, 28, 4, k.w);
    panel(x + 9, b - 28, 14, 4, k.m); for (let j = 0; j < 18; j++) R(x + 19 - Math.floor(j / 6), b - 28 - j, 3, 1, k.c);
    R(x + 9, b - 36, 11, 2, k.m); R(x + 11, b - 37, 8, 1, '#a8d8f0'); cyl(x + 11, b - 52, 5, 14, k.m); cyl(x + 10, b - 56, 7, 4, '#303038');
  } },
  { id: 'fossil', name: 'Fossil stand', w: 1, h: 1, price: 520, draw(x, b) {
    floorShadow(x + 3, b, 26); panel(x + 5, b - 12, 22, 12, k.w); R(x + 9, b - 8, 14, 3, k.a); R(x + 15, b - 14, 2, 2, k.m);
    ovalShade(x + 16, b - 23, 10, 9, '#c8b89c'); speckle(x + 8, b - 30, 16, 14, '#b0a084', 6, 0.1);
    for (let a = 0; a < 40; a++) { const t = a * 0.35, r = 8 - a * 0.18; P(Math.round(x + 16 + Math.cos(t) * r), Math.round(b - 23 + Math.sin(t) * r * 0.9), '#8a7a60'); }
  } },
  { id: 'sciencebench', name: 'Science bench', w: 2, h: 1, price: 880, draw(x, b, vw, dir) {
    if (dir % 2) return sideBox(x, b, vw, 34);
    floorShadow(x, b, vw); wood(x + 1, b - 30, vw - 2, 30, k.w);
    for (let i = 3; i + 14 < vw; i += 20) { inset(x + i, b - 27, 16, 22, sh(k.w, 1)); wood(x + i + 1, b - 26, 14, 20, k.w, 'y'); R(x + i + 12, b - 17, 1, 4, k.a); }
    panel(x, b - 34, vw, 5, '#303038');
    for (let j = 0; j < 12; j++) R(x + 10 - Math.floor(j / 2), b - 46 + j, 2 + Math.floor(j / 2) * 2, 1, j < 4 ? '#e8f4f8' : '#68e8a8');
    R(x + 22, b - 38, 16, 4, k.m); ['#e04848', '#4a98d8', '#f8d030', '#a858d8'].forEach((c, i) => { R(x + 23 + i * 4, b - 46, 2, 10, '#e8f4f8'); R(x + 23 + i * 4, b - 41, 2, 5, c); });
    if (vw > 40) { R(x + 46, b - 44, 10, 10, '#e8f4f8'); R(x + 46, b - 39, 10, 5, BERRY[2]); P(x + 49, b - 42, '#ffffff'); P(x + 52, b - 46, '#ffffff'); }
  } },
  { id: 'arttable', name: 'Art table', w: 1, h: 1, price: 300, draw(x, b) {
    floorShadow(x + 1, b, 30); legs4(x, b, 32, 26, k.w); wood(x + 1, b - 30, 30, 4, k.w);
    for (let n = 0; n < 6; n++) P(x + 3 + Math.floor(hash(n) * 26), b - 28 + Math.floor(hash(n, 1) * 2), RAINBOW[n]);
    [k.c, BERRY[1], BERRY[3]].forEach((c, i) => { cyl(x + 4 + i * 7, b - 38, 6, 8, '#e8f4f8'); R(x + 4 + i * 7, b - 34, 6, 4, c); });
    R(x + 18, b - 44, 1, 10, '#c8a060'); R(x + 20, b - 42, 1, 8, '#c8a060'); P(x + 18, b - 45, k.c); P(x + 20, b - 43, BERRY[1]);
  } },
  { id: 'giantcrayons', name: 'Giant crayons', w: 1, h: 1, price: 200, draw(x, b) {
    floorShadow(x + 2, b, 28);
    ['#e04848', '#4a78d8', k.a, '#58b848', '#a858d8'].forEach((c, i) => { const cx = x + 6 + Math.round(i * 4.4); cyl(cx, b - 36 + (i % 2) * 3, 4, 16, c); tri(cx + 2, b - 40 + (i % 2) * 3, 4, c, 0.5); });
    panel(x + 4, b - 22, 24, 22, k.c); R(x + 4, b - 16, 24, 6, '#f8d030'); for (let i = 0; i < 24; i++) P(x + 4 + i, b - 13 + Math.round(Math.sin(i / 2)), k.c);
  } },
  { id: 'starchart', name: 'Gold star chart', w: 1, h: 1, layer: 'wall', price: 120, wall(x) {
    shadowWall(x + 4, 14, 24, 38); panel(x + 4, 14, 24, 38, '#ffffff'); R(x + 6, 16, 20, 4, k.c);
    [3, 2, 4, 1, 3].forEach((n, j) => { R(x + 6, 24 + j * 6, 6, 1, '#8a8a98'); for (let i = 0; i < n; i++) bits(['.#.', '###', '.#.'], x + 13 + i * 3, 23 + j * 6, { '#': '#f0c020' }); });
  } },
  { id: 'alpharug', name: 'Alphabet rug', w: 2, h: 2, layer: 'rug', price: 320, high: 0.04, side: 'c', flat(w, h) {
    R(0, 0, w, h, k.c); const cs = [k.a, BERRY[1], BERRY[3], BERRY[5], '#ffffff', BERRY[2]];
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const c = cs[(i + j * 3) % 6], px = 3 + Math.floor(i * 14.5), py = 3 + Math.floor(j * 14.5); panel(px, py, 13, 13, c); bits(LETTERS['ABCDEF'[(i + j * 4) % 6]], px + 3, py + 1, { '#': sh(c, -2) }, 2); }
  } },
  { id: 'storycushion', name: 'Story cushion', w: 1, h: 1, price: 150, high: 0.18, side: 'c', seat: 'cushion', flat() {
    cushion(3, 3, 26, 26, k.c, 5); R(5, 15, 22, 1, sh(k.c, -1)); R(15, 5, 1, 22, sh(k.c, -1)); disc(16, 16, 2, k.a);
    for (const [i, j] of [[3, 3], [28, 3], [3, 28], [28, 28]]) disc(i, j, 2, k.a);
  } },
  { id: 'bookcart', name: 'Library cart', w: 1, h: 1, price: 360, draw(x, b) {
    floorShadow(x, b, 32); for (const i of [5, 25]) disc(x + i, b - 3, 3, '#303038');
    wood(x + 3, b - 34, 26, 28, k.w, 'y');
    for (const top of [b - 32, b - 18]) { R(x + 5, top, 22, 11, sh(k.w, -2)); for (let i = 0; i < 6; i++) panel(x + 5 + Math.floor(i * 3.6), top + 1 + (i % 3), 3, 10 - (i % 3), BERRY[(i + (top & 3)) % 6]); }
    R(x + 27, b - 46, 2, 14, k.m); R(x + 24, b - 47, 6, 2, k.m);
  } },
  { id: 'schoolbag', name: 'School bag', w: 1, h: 1, price: 140, draw(x, b) {
    floorShadow(x + 3, b, 26); R(x + 15, b - 34, 2, 5, sh(k.c, -1)); R(x + 4, b - 26, 2, 20, sh(k.c, -2));
    cushion(x + 5, b - 30, 22, 30, k.c, 5); cushion(x + 8, b - 16, 16, 12, sh(k.c, -1), 3); R(x + 8, b - 16, 16, 1, k.a);
    R(x + 26, b - 14, 1, 4, k.m); ball(x + 26, b - 8, 2, k.a);
  } },
  { id: 'coatpegs', name: 'Coat pegs', w: 2, h: 1, layer: 'wall', price: 160, wall(x) {
    wood(x + 2, 24, 60, 6, k.w); for (let i = 0; i < 5; i++) { R(x + 8 + i * 12, 30, 2, 4, k.m); sphere(x + 9 + i * 12, 34, 1.5, k.a); }
    for (const [i, c] of [[1, k.c], [3, BERRY[1]]]) { const px = x + 4 + i * 12; R(px + 4, 34, 1, 4, sh(c, -1)); cushion(px, 36, 11, 14, c, 3); R(px + 2, 43, 7, 1, sh(c, 1)); }
    R(x + 52, 34, 8, 24, k.c); R(x + 50, 34, 12, 4, sh(k.c, 1)); R(x + 55, 38, 1, 20, sh(k.c, -1));
  } },
  { id: 'xylophone', name: 'Xylophone', w: 1, h: 1, price: 220, draw(x, b) {
    floorShadow(x + 1, b, 30);
    RAINBOW.forEach((c, i) => { const h = 16 - i * 1.5; R(x + 4 + Math.floor(i * 3.6), b - 6 - h, 3, h, c); R(x + 4 + Math.floor(i * 3.6), b - 6 - h, 3, 1, sh(c, 1)); });
    R(x + 2, b - 8, 28, 2, k.w); R(x + 3, b - 6, 2, 6, sh(k.w, -1)); R(x + 27, b - 6, 2, 6, sh(k.w, -1));
    R(x + 20, b - 32, 1, 10, k.w); sphere(x + 20, b - 33, 2, k.c);
  } },
  { id: 'lunchtable', name: 'Lunch table', w: 2, h: 1, price: 560, draw(x, b, vw) {
    floorShadow(x, b, vw); for (const i of [4, vw - 8]) cyl(x + i, b - 26, 4, 26, k.m);
    wood(x + 1, b - 30, vw - 2, 4, k.w);
    for (const i of vw > 40 ? [4, 34] : [4]) { panel(x + i, b - 32, 22, 2, k.c); disc(x + i + 5, b - 34, 2, '#f8e070'); R(x + i + 9, b - 35, 5, 2, '#e07848'); panel(x + i + 16, b - 39, 5, 7, '#ffffff'); tri(x + i + 18, b - 42, 3, '#ffffff', 0.8); R(x + i + 16, b - 37, 5, 2, '#4a78d8'); }
    wood(x + 2, b - 14, vw - 4, 4, sh(k.w, 1)); R(x + 8, b - 10, 2, 10, k.m); R(x + vw - 10, b - 10, 2, 10, k.m);
  } },
  { id: 'ohp', name: 'Overhead projector', w: 1, h: 1, price: 380, draw(x, b) {
    floorShadow(x + 2, b, 28); legs4(x, b, 32, 24, k.m); panel(x + 2, b - 28, 28, 4, k.m);
    panel(x + 6, b - 38, 20, 10, k.p, 2); R(x + 8, b - 40, 16, 2, '#a8d8f0'); R(x + 22, b - 58, 2, 18, k.m);
    panel(x + 12, b - 62, 12, 6, k.p); disc(x + 13, b - 59, 2, '#303038'); P(x + 12, b - 60, '#a8d8f0');
  } },
]);

/* ---------- winter ---------- */
const iceInk = ink(ICE, '#f0faff', '#7ab8d8', '#ffffff');
const SCULPT = [['star', 'Star'], ['heart', 'Heart'], ['ball', 'Poké Ball'], ['moon', 'Moon'], ['flower', 'Flower']];
add('Winter', SCULPT.map(([id, name]) => ({ id: `ice${id}`, name: `${name} ice sculpture`, proper: id === 'ball', w: 1, h: 1, price: 480,
  draw(x, b) {
    floorShadow(x + 2, b, 28); panel(x + 5, b - 10, 22, 10, k.w); R(x + 7, b - 6, 18, 1, sh(k.w, -1));
    motif(id, x + 3, b - 38, iceInk, 3);
    for (const [i, j] of [[8, -34], [24, -20], [12, -16]]) { P(x + i, b + j, '#ffffff'); P(x + i - 1, b + j, '#d8f4ff'); P(x + i + 1, b + j, '#d8f4ff'); }
  } })));
add('Winter', [
  { id: 'snowyfir', name: 'Snowy fir', w: 1, h: 1, price: 600, draw(x, b) {
    oval(x + 16, b - 2, 12, 2, 'rgba(30,18,10,0.25)'); R(x + 14, b - 8, 4, 8, '#6a4426');
    for (const [top, h, w] of [[b - 30, 22, 14], [b - 48, 22, 11], [b - 64, 20, 8]]) {
      tri(x + 16, top, h, '#2a6a4a', w / h); for (let j = 0; j < h; j += 3) R(x + 16, top + j, 1, 2, '#3a7a5a');
      R(x + 16 - w + 1, top + h - 2, (w - 1) * 2 + 1, 2, SNOW); tri(x + 16, top, 4, '#ffffff', w / h);
    }
    for (const [i, j, c] of [[10, -14, k.c], [21, -18, k.a], [13, -34, k.a], [19, -40, k.c], [15, -52, k.c]]) sphere(x + i, b + j, 2, c);
    stamp(MOTIFS.star, x + 12, b - 72, { '#': '#f8d030', '+': '#fff8a0' }, 1);
  } },
  { id: 'sled', name: 'Sled', w: 1, h: 1, price: 240, draw(x, b) {
    floorShadow(x + 1, b, 30); R(x + 3, b - 3, 24, 2, k.m);
    for (let a = 0; a <= 12; a++) R(Math.round(x + 26 + Math.sin(a / 12 * Math.PI) * 3), Math.round(b - 3 - a * 0.9), 2, 1, k.m);
    R(x + 7, b - 9, 2, 6, k.m); R(x + 21, b - 9, 2, 6, k.m); wood(x + 3, b - 13, 24, 4, k.w); R(x + 4, b - 12, 22, 1, k.c);
    for (let i = 0; i < 6; i++) P(x + 26 - i, b - 16 + Math.floor(i / 2), '#c8a878');
  } },
  { id: 'skirack', name: 'Ski rack', w: 1, h: 1, price: 380, draw(x, b) {
    floorShadow(x + 1, b, 30);
    for (const [i, c] of [[7, k.c], [11, k.c], [18, k.a], [22, k.a]]) { R(x + i, b - 70, 3, 68, c); R(x + i, b - 70, 1, 68, sh(c, 1)); R(x + i + 1, b - 73, 2, 3, c); }
    R(x + 15, b - 60, 1, 58, k.m); disc(x + 15, b - 8, 2, '#303038');
    R(x + 3, b - 40, 3, 40, k.w); R(x + 26, b - 40, 3, 40, k.w); wood(x + 2, b - 42, 28, 4, k.w);
  } },
  { id: 'snowdrift', name: 'Snowdrift', w: 1, h: 1, price: 100, draw(x, b) {
    R(x + 21, b - 32, 1, 18, k.m); panel(x + 22, b - 32, 8, 5, k.c);
    for (let j = 0; j < 16; j++) { const half = Math.round(Math.sqrt(256 - (16 - j) ** 2) * 0.9); R(x + 16 - half, b - 16 + j, half * 2, 1, j < 3 ? '#ffffff' : j > 12 ? '#c8d8ec' : '#e8f2fc'); }
    ovalShade(x + 9, b - 12, 7, 5, '#e8f2fc');
    for (let n = 0; n < 6; n++) P(x + 4 + Math.floor(hash(n, 9) * 24), b - 12 + Math.floor(hash(n, 8) * 10), n % 2 ? '#ffffff' : '#a8c8e8');
  } },
  { id: 'igloo', name: 'Igloo', w: 2, h: 2, price: 1400, draw(x, b, vw) {
    floorShadow(x, b, vw); const r = vw / 2 - 3, ry = 44, cx = x + vw / 2;
    R(cx, b - ry - 14, 1, 14, k.m); panel(cx + 1, b - ry - 14, 9, 6, k.c);
    for (let j = 0; j < ry; j++) {
      const half = Math.round(r * Math.sqrt(1 - ((ry - j) / ry) ** 2)), y = b - ry + j, blk = Math.floor(j / 7);
      for (let i = -half; i < half; i++) P(cx + i, y, j % 7 === 0 ? '#c0d0e4' : (i + 100 + (blk % 2) * 5) % 10 === 0 ? '#c8d8ec' : i < -half * 0.4 ? '#ffffff' : i > half * 0.5 ? '#d8e6f4' : SNOW);
    }
    for (let j = 0; j < 22; j++) { const half = j < 8 ? Math.round(Math.sqrt(64 - (8 - j) ** 2)) : 8; R(cx - half - 2, b - 22 + j, half * 2 + 4, 1, '#d8e6f4'); R(cx - half, b - 22 + j, half * 2, 1, '#3a4a6a'); }
  } },
  { id: 'cocoastand', name: 'Cocoa stand', w: 1, h: 1, price: 500, draw(x, b) {
    floorShadow(x, b, 32); wood(x + 2, b - 28, 28, 28, k.w); panel(x + 6, b - 22, 20, 9, k.c); cyl(x + 12, b - 20, 6, 5, '#ffffff'); P(x + 14, b - 20, '#8a5a30');
    panel(x + 1, b - 31, 30, 4, k.p);
    cyl(x + 4, b - 42, 12, 11, k.m); cyl(x + 3, b - 44, 14, 2, sh(k.m, 1)); for (const [i, j] of [[8, -48], [10, -51], [9, -54]]) P(x + i, b + j, '#ffffff');
    for (let i = 0; i < 2; i++) { cyl(x + 19 + i * 6, b - 37, 5, 6, k.c); R(x + 19 + i * 6, b - 37, 5, 1, '#5a3018'); P(x + 20 + i * 6, b - 38, '#ffffff'); }
  } },
  { id: 'woodstove', name: 'Wood stove', w: 1, h: 1, price: 900, glow: ['#f8a030', '#f8e070'], draw(x, b) {
    floorShadow(x + 2, b, 28); cyl(x + 13, b - 90, 6, 54, k.m); R(x + 12, b - 62, 8, 2, sh(k.m, 1));
    R(x + 7, b - 6, 3, 6, k.m); R(x + 22, b - 6, 3, 6, k.m); panel(x + 5, b - 36, 22, 30, k.m, 2);
    inset(x + 9, b - 30, 14, 16, '#1a1a22'); R(x + 10, b - 22, 12, 7, '#f86030'); tri(x + 13, b - 27, 6, '#f8a030', 0.5); tri(x + 19, b - 26, 5, '#f8e070', 0.5);
    for (let i = 11; i < 23; i += 3) R(x + i, b - 29, 1, 14, '#2a2a30');
    ovalShade(x + 24, b - 40, 4, 3, k.c); R(x + 21, b - 43, 2, 1, k.c);
  } },
  { id: 'mittenline', name: 'Mitten line', w: 2, h: 1, layer: 'wall', price: 140, wall(x) {
    const y = sag(56, 18, 6); R(x + 2, 16, 2, 6, k.m); R(x + 60, 16, 2, 6, k.m); for (let i = 0; i < 57; i++) P(x + 4 + i, y(i), sh(k.m, 1));
    [[4, k.c], [16, k.c], [32, k.a], [44, k.a]].forEach(([i, c]) => { const t = y(i + 4) + 1; P(x + 8 + i, t - 1, k.w); cushion(x + 4 + i, t, 8, 12, c, 3); R(x + 11 + i, t + 3, 3, 5, c); R(x + 4 + i, t + 10, 8, 3, k.p); P(x + 7 + i, t + 5, k.p); });
  } },
  { id: 'icicles', name: 'Icicles', w: 2, h: 1, layer: 'wall', price: 120, wall(x) {
    wood(x, 8, 64, 5, k.w);
    for (let i = 0; i < 64; i++) R(x + i, 12, 1, 3 + Math.round(hash(i, 2) * 3), '#f4faff');
    for (let n = 0; n < 12; n++) {
      const px = x + 3 + n * 5, len = 6 + Math.floor(hash(n, 5) * 18);
      for (let j = 0; j < len; j++) { const wd = Math.max(1, 3 - Math.floor(j * 3 / len)); R(px + Math.floor((3 - wd) / 2), 15 + j, wd, 1, j % 4 ? ICE : '#e8f8ff'); }
      P(px, 16, '#ffffff');
    }
  } },
  { id: 'frostwindow', name: 'Frosted window', w: 2, h: 1, layer: 'wall', price: 600, glow: ['#d8f0ff'], wall(x) {
    for (let j = 0; j < 48; j++) R(x + 10, 16 + j, 44, 1, j < 24 ? '#a8c8e8' : '#c8dcf0');
    for (const [i, h] of [[16, 10], [22, 14], [44, 12]]) tri(x + i, 54 - h, h, '#4a7a8a', 0.4);
    oval(x + 24, 64, 18, 8, '#ffffff'); oval(x + 44, 66, 16, 9, '#f0f8ff');
    for (let n = 0; n < 14; n++) P(x + 11 + Math.floor(hash(n, 3) * 42), 17 + Math.floor(hash(n, 4) * 40), '#ffffff');
    for (const [ox, oy, sx, sy] of [[10, 16, 1, 1], [53, 16, -1, 1], [10, 63, 1, -1], [53, 63, -1, -1]]) for (let j = 0; j < 10; j++) for (let i = 0; i < 10 - j; i++) if (hash(i, j, ox) < 0.55) P(x + ox + i * sx, oy + j * sy, '#f4faff');
    R(x + 31, 16, 2, 48, k.w); R(x + 10, 39, 44, 2, k.w);
    R(x + 7, 13, 50, 3, k.w); R(x + 7, 13, 3, 51, k.w); R(x + 54, 13, 3, 51, k.w); wood(x + 5, 64, 54, 4, k.w); R(x + 6, 63, 52, 1, '#ffffff');
  } },
  { id: 'snowflakes', name: 'Snowflake garland', w: 2, h: 1, layer: 'wall', price: 130, wall(x) {
    const FLAKE = ['....#....', '.#..#..#.', '..#.#.#..', '...###...', '#########', '...###...', '..#.#.#..', '.#..#..#.', '....#....'];
    const y = sag(59, 18, 10); for (let i = 0; i < 60; i++) P(x + 2 + i, y(i), sh(k.m, 1));
    [8, 22, 38, 52].forEach((i, n) => { const t = y(i - 2); R(x + i, t, 1, 4, sh(k.m, 1)); stamp(FLAKE, x + i - 4, t + 4, { '#': n % 2 ? k.c : '#ffffff' }, 1); });
  } },
  { id: 'knitrug', name: 'Knitted rug', w: 2, h: 2, layer: 'rug', price: 300, high: 0.04, side: 'c', flat(w, h) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const band = Math.floor(j / 8) % 4, jj = j % 8, ii = i % 8;
      let c = band % 2 ? k.p : k.c;
      if (band === 0 && Math.abs(ii - 3.5) + Math.abs(jj - 3.5) < 2.5) c = k.a;
      if (band === 1 && (jj === 3 || jj === 4) && ii % 4 < 2) c = k.c;
      if (band === 2 && ii === 4 && jj === 4) c = k.p;
      if (band === 3 && jj === 2 + (ii < 4 ? ii : 8 - ii)) c = k.a;
      P(i, j, c);
    }
    for (let i = 1; i < w; i += 3) { P(i, 0, k.a); P(i, h - 1, k.a); }
  } },
  { id: 'snowballs', name: 'Snowball pile', w: 1, h: 1, price: 90, draw(x, b) {
    floorShadow(x + 2, b, 28);
    for (const [i, j, r] of [[9, -6, 6], [21, -6, 6], [15, -15, 6]]) sphere(x + i, b + j, r, SNOW);
    cushion(x + 24, b - 6, 7, 5, k.c, 2); R(x + 24, b - 3, 7, 2, k.p);
  } },
  { id: 'skates', name: 'Ice skates', w: 1, h: 1, price: 160, draw(x, b) {
    floorShadow(x + 2, b, 28);
    for (const sx of [3, 16]) {
      R(x + sx, b - 24, 8, 14, k.c); cushion(x + sx, b - 13, 13, 7, k.c, 2); R(x + sx, b - 24, 8, 2, k.p);
      for (let j = 0; j < 4; j++) { P(x + sx + 3, b - 21 + j * 3, k.p); P(x + sx + 5, b - 20 + j * 3, k.p); }
      R(x + sx + 1, b - 4, 12, 1, k.m); R(x + sx + 2, b - 6, 1, 2, k.m); R(x + sx + 10, b - 6, 1, 2, k.m); P(x + sx + 13, b - 5, k.m);
    }
  } },
  { id: 'snowshovel', name: 'Snow shovel', w: 1, h: 1, price: 120, draw(x, b) {
    ovalShade(x + 14, b - 5, 12, 5, SNOW);
    panel(x + 15, b - 16, 14, 14, k.c, 2); R(x + 16, b - 17, 12, 2, '#ffffff');
    for (let j = 0; j < 48; j++) R(x + 10 + Math.floor(j * 0.25), b - 60 + j, 2, 1, k.w); R(x + 7, b - 62, 7, 2, '#303038');
  } },
  { id: 'logpile', name: 'Log pile', w: 1, h: 1, price: 140, draw(x, b) {
    floorShadow(x, b, 32);
    for (let r = 0; r < 3; r++) for (let i = 0; i < 3 - r; i++) {
      const cx = x + 6 + i * 10 + r * 5, cy = b - 5 - r * 9;
      disc(cx, cy, 5, sh(k.w, -1)); disc(cx, cy, 4, '#d8b078'); disc(cx, cy, 2.5, '#c89858'); disc(cx, cy, 1, '#a8784a');
    }
    R(x + 12, b - 29, 9, 2, '#ffffff'); R(x + 3, b - 11, 6, 1, '#ffffff'); R(x + 23, b - 11, 6, 1, '#ffffff');
  } },
  { id: 'frozenpond', name: 'Frozen pond', w: 2, h: 2, layer: 'rug', price: 420, high: 0.03, side: 'p', flat(w, h) {
    for (let a = 0; a < 20; a++) { const t = a / 20 * Math.PI * 2; ovalShade(w / 2 + Math.cos(t) * 28, h / 2 + Math.sin(t) * 27, 4, 3, hash(a, 4) < 0.5 ? STONE : SNOW); }
    oval(w / 2, h / 2, 26, 25, '#9ad0f0'); oval(w / 2 - 4, h / 2 - 5, 16, 12, '#c0e4f8');
    for (let i = 0; i < 14; i++) { P(20 + i, 24 + Math.round(i * 0.6), '#ffffff'); P(36 + Math.round(i * 0.3), 30 + i, '#ffffff'); }
    for (let a = 0; a < 30; a++) { const t = a / 30 * Math.PI; P(w / 2 + Math.cos(t) * 14, h / 2 + 4 + Math.sin(t) * 6, '#e0f4ff'); }
    ovalShade(42, 42, 4, 3, k.c); disc(42, 38, 1.5, k.p);
  } },
  { id: 'sleigh', name: 'Sleigh', w: 2, h: 1, price: 1300, draw(x, b, vw, dir) {
    if (dir % 2) return sideBox(x, b, vw, 34);
    floorShadow(x, b, vw); R(x + 4, b - 3, vw - 10, 2, k.a);
    for (let a = 0; a <= 16; a++) R(Math.round(x + vw - 7 + Math.sin(a / 16 * Math.PI) * 5), Math.round(b - 3 - a * 1.5), 2, 2, k.a);
    R(x + 10, b - 9, 2, 6, k.a); R(x + vw - 20, b - 9, 2, 6, k.a);
    panel(x + 20, b - 36, 10, 8, '#58b848'); R(x + 24, b - 36, 2, 8, '#f8d030');
    panel(x + 4, b - 28, vw - 16, 20, k.c, 2); disc(x + vw - 14, b - 22, 8, k.c); cushion(x + 4, b - 40, 14, 14, k.c, 3);
    R(x + 4, b - 12, vw - 16, 2, k.a); R(x + 8, b - 24, vw - 26, 1, sh(k.c, 1));
  } },
  { id: 'icelantern', name: 'Ice lantern', w: 1, h: 1, price: 260, glow: ['#f8d890', '#fff4c0'], draw(x, b) {
    floorShadow(x + 5, b, 22); panel(x + 7, b - 24, 18, 24, ICE); R(x + 11, b - 18, 10, 14, '#fff0c0');
    cyl(x + 14, b - 12, 4, 8, k.c); tri(x + 16, b - 18, 5, '#f8a030', 0.3); P(x + 16, b - 15, '#fff8d0');
    for (let n = 0; n < 5; n++) P(x + 8 + Math.floor(hash(n, 2) * 16), b - 22 + Math.floor(hash(n, 6) * 20), '#ffffff');
    R(x + 6, b - 26, 20, 3, '#ffffff');
  } },
  { id: 'snowfort', name: 'Snow fort', w: 2, h: 1, price: 700, draw(x, b, vw) {
    floorShadow(x, b, vw); R(x + vw - 10, b - 60, 1, 22, k.m); panel(x + vw - 9, b - 60, 9, 6, k.c);
    for (let r = 0; r < 4; r++) { const y = b - 8 - r * 8; for (let i = -(r % 2) * 5; i < vw; i += 10) { const px = Math.max(x + 1, x + i), pw = Math.min(x + i + 9, x + vw - 1) - px; panel(px, y, pw, 7, SNOW); } }
    for (let i = 2; i + 8 < vw; i += 14) panel(x + i, b - 40, 8, 8, SNOW);
    for (const [i, j] of [[8, -4], [14, -4], [11, -9]]) if (i < vw) sphere(x + i, b + j, 3, '#ffffff');
  } },
]);
