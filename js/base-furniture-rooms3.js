/* base-furniture-rooms3.js  -  themed shelves, batch 3 of the road to 1,000 kinds (2026-10-08): the Festival, Lab, Castle,
   Japanese, Toys and Types shelves, 25 kinds each. Same kit and rules as js/base-furniture-rooms.js: painted at 32 pixels
   a tile with js/base-paint.js in the piece's theme palette `k`, outlined and rim-lit by `finish()`. Each shelf opens with
   a list that shares one body and differs by what's on it (stalls by what they sell, specimen tanks, tapestries by their
   charge, hanging scrolls by their picture, toy shelves, type shrines by their glyph). */

import { k, sh, R, P, hash, panel, inset, wood, cushion, sphere, disc, oval, ovalShade, cyl, glass, leaf, foliage, tri,
  speckle, stamp, floorShadow } from './base-paint.js';
import { MOTIFS, sideBox, shadowWall } from './base-furniture-kinds.js';
import { STONE, flower, ball } from './base-furniture-rooms.js';

export const ROOM_KINDS_3 = [];
const add = (group, list) => list.forEach(f => ROOM_KINDS_3.push({ group, ...f }));

const RAINBOW = ['#e04848', '#f08030', '#f8d030', '#58b848', '#4a98d8', '#5a58c8', '#a858d8'];
const PINK = '#f8a8c8', SKYB = '#a8d8f8', GOLD = '#f0c040', INK = '#303038', ICE = '#bfe6f8', STRAW = '#e0c070';
/** A string sagging between two points on a wall, as y at each x from 0 to `len`. */
const sag = (len, top, dip) => (i) => top + Math.round(Math.sin(Math.max(0, Math.min(len, i)) / len * Math.PI) * dip);
/** A straight line of pixels, `t` thick. */
export function line(x0, y0, x1, y1, c, t = 1) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) R(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), t, t, c);
}
/** A ring of pixels. */
export function ring(cx, cy, r, c, t = 1) {
  for (let a = 0; a < r * 7; a++) { const th = a / (r * 7) * Math.PI * 2; R(Math.round(cx + Math.cos(th) * r), Math.round(cy + Math.sin(th) * r), t, t, c); }
}
/** A disc split into wedges, each coloured by `colour(i)`. */
export function wheel(cx, cy, r, n, colour) {
  for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
    if (i * i + j * j > r * r) continue;
    const a = (Math.atan2(j, i) + Math.PI * 2.5) % (Math.PI * 2);
    P(cx + i, cy + j, colour(Math.floor(a / (Math.PI * 2) * n)));
  }
}
const FONT = { A: ['.#.', '#.#', '###', '#.#', '#.#'], F: ['###', '#..', '##.', '#..', '#..'], I: ['###', '.#.', '.#.', '.#.', '###'],
  R: ['##.', '#.#', '##.', '#.#', '#.#'], B: ['##.', '#.#', '##.', '#.#', '##.'], L: ['#..', '#..', '#..', '#..', '###'] };
const word = (text, x, y, c, s = 2) => [...text].forEach((ch, n) => bits(FONT[ch], x + n * 4 * s, y, { '#': c }, s));
function bits(rows, x, y, ink2, s = 1) { rows.forEach((row, j) => [...row].forEach((ch, i) => { const c = ink2[ch]; if (c) R(x + i * s, y + j * s, s, s, c); })); }
const HORSE = ['.........mm.', '........m###', '.......m##k#', '.......m####', '..#######m#.', '.#########..', '##########..',
  '#.########..', '..#.#..#.#..', '..#.#..#.#..', '..+.+..+.+..'];

/* ---------- festival ---------- */
/** A fair stall two tiles wide: a counter under a striped awning on poles; returns the counter's top. */
function stall(x, b, vw) {
  floorShadow(x, b, vw);
  cyl(x + 3, b - 78, 3, 78, k.m); cyl(x + vw - 6, b - 78, 3, 78, k.m);
  wood(x + 2, b - 28, vw - 4, 25, k.w); R(x + 3, b - 3, vw - 6, 3, sh(k.w, -3));
  for (let i = 6; i + 12 < vw; i += 14) inset(x + i, b - 24, 10, 18, sh(k.w, -1));
  panel(x, b - 32, vw, 5, k.p);
  for (let i = 0; i < vw; i++) R(x + i, b - 88, 1, 12, (i >> 3) % 2 ? k.p : k.c);
  for (let i = 0; i < vw; i += 8) { const c = (i >> 3) % 2 ? k.p : k.c; for (let j = 0; j < 4; j++) { const h = Math.round(Math.sqrt(16 - j * j)); R(x + i + 4 - h, b - 76 + j, h * 2, 1, j > 2 ? sh(c, -1) : c); } }
  R(x, b - 89, vw, 2, sh(k.c, -1)); R(x, b - 86, vw, 1, sh(k.c, 1));
  return b - 32;
}
const plush = (cx, by, c) => {
  ovalShade(cx, by - 4, 5, 4, c); ovalShade(cx, by - 11, 5, 4, c); R(cx - 5, by - 16, 2, 3, c); R(cx + 4, by - 16, 2, 3, c);
  P(cx - 2, by - 12, INK); P(cx + 2, by - 12, INK); P(cx, by - 10, sh(c, -2));
};
const STALLS = {
  popcorn: ['Popcorn', (x, t) => {
    panel(x + 6, t - 34, 24, 34, '#d84040', 2); glass(x + 9, t - 29, 18, 20, '#fff4d0');
    for (let n = 0; n < 46; n++) disc(x + 10 + hash(n, 1) * 16, t - 11 - hash(n, 2) * hash(n, 3) * 12, 1.2, hash(n, 4) < 0.3 ? '#f8e070' : '#fffaf0');
    R(x + 9, t - 34, 18, 4, '#f8d030'); R(x + 9, t - 8, 18, 5, sh('#d84040', -1));
    for (const i of [36, 46]) {
      R(x + i, t - 12, 8, 12, '#ffffff'); R(x + i + 1, t - 12, 2, 12, '#e04848'); R(x + i + 5, t - 12, 2, 12, '#e04848');
      for (let n = 0; n < 6; n++) disc(x + i + 1 + hash(n, i) * 6, t - 13 - hash(i, n) * 3, 1.5, '#fffaf0');
    }
  }],
  floss: ['Candy floss', (x, t) => {
    cyl(x + 6, t - 12, 24, 12, k.m); oval(x + 18, t - 12, 12, 3, sh(k.m, -2));
    ovalShade(x + 18, t - 18, 10, 7, PINK); speckle(x + 10, t - 24, 16, 10, '#ffffff', 5, 0.08);
    panel(x + 34, t - 9, 22, 9, k.a);
    for (const [i, c] of [[38, PINK], [45, SKYB], [52, PINK]]) { R(x + i, t - 22, 1, 14, '#f4e8d0'); ovalShade(x + i, t - 28, 5, 6, c); }
  }],
  lemon: ['Lemonade', (x, t) => {
    glass(x + 8, t - 26, 18, 24, '#fff0a0'); R(x + 9, t - 20, 16, 17, '#f8e060');
    for (const [i, j] of [[13, -12], [20, -8], [16, -5]]) { disc(x + i, t + j, 3, '#f0d020'); disc(x + i, t + j, 2, '#fff8c0'); }
    R(x + 7, t - 28, 20, 3, k.m); R(x + 20, t - 5, 6, 2, k.m);
    for (let i = 0; i < 3; i++) { const cx = x + 32 + i * 8; R(cx, t - 10, 6, 10, '#f4f8ff'); R(cx, t - 7, 6, 7, '#f8e060'); P(cx + 1, t - 10, '#ffffff'); }
    disc(x + 52, t - 14, 4, '#f0d020'); P(x + 51, t - 16, '#fff8c0');
  }],
  balloon: ['Balloon', (x, t) => {
    panel(x + 26, t - 6, 12, 6, k.a);
    for (let n = 0; n < 6; n++) {
      const bx = x + 9 + n * 9, by = t - 46 + (n % 2) * 8, c = RAINBOW[n];
      for (let j = by + 5; j < t - 6; j++) P(Math.round(bx + (x + 32 - bx) * (j - by - 5) / (t - 6 - by - 5)), j, '#e8e8e8');
      ovalShade(bx, by, 4, 5, c); P(bx, by + 6, sh(c, -1));
    }
  }],
  prize: ['Prize', (x, t) => {
    [[10, PINK], [20, '#f8d030'], [30, SKYB], [40, '#a8e098'], [50, '#d8a8f0']].forEach(([i, c]) => plush(x + i, t, c));
    for (const [i, c] of [[14, '#f8b070'], [32, '#f8f0a0'], [48, '#f8a8a8']]) { R(x + i, t - 42, 1, 6, '#d8d8d8'); plush(x + i, t - 22, c); }
  }],
  apple: ['Toffee apple', (x, t) => {
    cyl(x + 6, t - 14, 16, 14, k.m); oval(x + 14, t - 14, 7, 2, '#c87830'); R(x + 13, t - 24, 1, 10, '#f4e8d0');
    for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) {
      const cx = x + 30 + i * 7 + r * 3, cy = t - 5 - r * 8;
      R(cx, cy - 9, 1, 5, '#f4e8d0'); sphere(cx, cy, 3.5, '#d02828'); R(cx - 3, cy + 1, 7, 1, '#a85818');
    }
  }],
};
add('Festival', Object.entries(STALLS).map(([id, [name, goods]]) => ({ id: `${id}stall`, name: `${name} stall`, w: 2, h: 1, price: 800,
  draw(x, b, vw, dir) { if (dir % 2) return sideBox(x, b, vw, 30); goods(x, stall(x, b, vw)); } })));
add('Festival', [
  { id: 'carouselhorse', name: 'Carousel horse', w: 1, h: 1, price: 650, draw(x, b) {
    floorShadow(x, b, 32); ovalShade(x + 16, b - 4, 14, 4, k.w);
    cyl(x + 14, b - 92, 4, 88, k.m); for (let j = b - 90; j < b - 6; j += 6) R(x + 14, j, 4, 2, k.a);
    R(x + 10, b - 94, 12, 3, k.a);
    stamp(HORSE, x + 3, b - 64, { '#': k.p, k: INK, '+': k.a, m: k.c }, 2);
    R(x + 10, b - 56, 10, 4, k.c); R(x + 10, b - 56, 10, 1, sh(k.c, 1)); P(x + 9, b - 54, k.a);
  } },
  { id: 'ferriswheel', name: 'Ferris wheel', w: 2, h: 1, price: 1400, glow: ['g', 'gl'], draw(x, b, vw) {
    floorShadow(x, b, vw);
    const cx = x + vw / 2, r = Math.min(30, vw / 2 - 4), cy = b - r - 22;
    line(cx, cy, x + 4, b - 2, k.m, 2); line(cx, cy, x + vw - 6, b - 2, k.m, 2);
    for (let s = 0; s < 8; s++) { const a = s / 8 * Math.PI * 2; line(cx, cy, cx + Math.cos(a) * r, cy + Math.sin(a) * r, sh(k.m, 1)); }
    ring(cx, cy, r, k.a, 2);
    for (let s = 0; s < 16; s++) { const a = (s + 0.5) / 16 * Math.PI * 2; P(cx + Math.cos(a) * r, cy + Math.sin(a) * r, k.g); }
    for (let s = 0; s < 8; s++) { const a = s / 8 * Math.PI * 2, px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r; R(px, py, 1, 2, k.m); panel(px - 3, py + 2, 7, 5, s % 2 ? k.c : RAINBOW[s % 7]); }
    sphere(cx, cy, 3, k.a); panel(x + 2, b - 4, vw - 4, 4, k.w);
  } },
  { id: 'bunting', name: 'Bunting', w: 2, h: 1, layer: 'wall', price: 120, wall(x) {
    const y = sag(60, 16, 8); for (let i = 0; i < 61; i++) P(x + 2 + i, y(i), sh(k.m, 1));
    for (let n = 0; n < 7; n++) {
      const i = 4 + n * 8, top = y(i) + 1, c = [k.c, k.a, k.p][n % 3];
      for (let j = 0; j < 9; j++) { const h = Math.max(0, 3 - Math.floor(j / 3)); R(x + i - h, top + j, h * 2 + 1, 1, j < 2 ? sh(c, 1) : c); }
    }
  } },
  { id: 'lanternstring', name: 'Festival lanterns', w: 2, h: 1, layer: 'wall', price: 220, glow: ['#ffd890'], wall(x) {
    const y = sag(60, 14, 6); for (let i = 0; i < 61; i++) P(x + 2 + i, y(i), INK);
    [8, 22, 36, 50].forEach((i, n) => {
      const t = y(i) + 2, c = [k.c, '#f8d030', k.a, '#f08030'][n];
      R(x + i, t - 1, 1, 3, INK); R(x + i - 3, t + 2, 7, 2, INK);
      ovalShade(x + i, t + 10, 6, 7, c); for (const j of [6, 10, 14]) R(x + i - 5, t + j, 11, 1, sh(c, -1));
      R(x + i - 2, t + 9, 3, 3, '#fff4c0'); R(x + i - 3, t + 17, 7, 2, INK); R(x + i, t + 19, 1, 4, k.c);
    });
  } },
  { id: 'balloons', name: 'Balloon bunch', w: 1, h: 1, price: 140, draw(x, b) {
    floorShadow(x + 10, b, 12); panel(x + 12, b - 6, 8, 6, k.a);
    [[8, -80, 0], [22, -82, 4], [15, -88, 2], [5, -66, 5], [25, -68, 6]].forEach(([i, j, n]) => {
      for (let yy = b + j + 6; yy < b - 6; yy++) P(Math.round(x + i + (16 - i) * (yy - b - j - 6) / (-j - 12)), yy, '#e8e8e8');
      ovalShade(x + i, b + j, 5, 6, n === 0 ? k.c : RAINBOW[n]); P(x + i, b + j + 7, sh(RAINBOW[n], -1));
    });
  } },
  { id: 'highstriker', name: 'High striker', w: 1, h: 1, price: 560, draw(x, b) {
    floorShadow(x, b, 32);
    wood(x + 10, b - 86, 12, 80, k.w, 'y'); R(x + 15, b - 84, 2, 76, sh(k.w, -2));
    for (let n = 0; n < 6; n++) R(x + 11, b - 18 - n * 12, 10, 2, RAINBOW[n]);
    sphere(x + 16, b - 90, 4, GOLD); disc(x + 16, b - 60, 2, '#e04848');
    panel(x + 6, b - 8, 20, 8, k.c); panel(x + 12, b - 11, 8, 3, '#e04848');
    for (let j = 0; j < 30; j++) P(x + 27 - Math.floor(j / 6), b - 4 - j, k.w); panel(x + 21, b - 38, 9, 6, k.m);
  } },
  { id: 'ringtoss', name: 'Ring toss', w: 1, h: 1, price: 300, draw(x, b) {
    floorShadow(x, b, 32); wood(x + 2, b - 22, 28, 22, k.w); R(x + 2, b - 22, 28, 2, k.c);
    for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) {
      const cx = x + 5 + i * 7 + r * 3, by = b - 22 - r * 4;
      glass(cx, by - 10, 4, 10, ['#a8e098', '#f8a8a8', SKYB][(i + r) % 3]); R(cx + 1, by - 14, 2, 4, sh('#a8e098', -1));
      if ((i + r) % 3 === 0) { oval(cx + 2, by - 9, 4, 1.5, k.c); oval(cx + 2, by - 9, 2, 0.5, '#a8e098'); }
    }
  } },
  { id: 'ticketbooth', name: 'Ticket booth', w: 1, h: 1, price: 600, draw(x, b) {
    floorShadow(x, b, 32); wood(x + 3, b - 60, 26, 60, k.w);
    inset(x + 7, b - 52, 18, 16, '#3a3a4a'); glass(x + 8, b - 51, 16, 14, '#cfe8f4'); R(x + 5, b - 36, 22, 3, k.p);
    panel(x + 8, b - 30, 16, 10, k.a); bits(['##.##', '#####', '##.##'], x + 11, b - 28, { '#': k.c }, 2);
    for (let j = 0; j < 14; j++) { const h = 15 - Math.floor(j * j / 16); for (let i = -h; i <= h; i++) P(x + 16 + i, b - 61 - j, ((i + 40) >> 2) % 2 ? k.p : k.c); }
    R(x + 15, b - 82, 2, 8, k.m); R(x + 17, b - 82, 6, 4, k.c);
  } },
  { id: 'fireworkrack', name: 'Firework rack', w: 1, h: 1, price: 380, draw(x, b) {
    floorShadow(x, b, 32); wood(x + 3, b - 14, 26, 14, k.w); R(x + 5, b - 12, 22, 2, sh(k.w, -2));
    [[6, 30, 0], [12, 40, 1], [18, 34, 4], [24, 26, 6]].forEach(([i, h, n]) => {
      const c = n ? RAINBOW[n] : k.c; cyl(x + i, b - 12 - h, 5, h - 6, c); tri(x + i + 2, b - 19 - h, 7, k.a, 0.4);
      R(x + i + 1, b - 4 - h / 2, 3, 2, '#ffffff'); R(x + i + 2, b - 12, 1, 4, k.w);
    });
    for (const [i, j] of [[4, -70], [26, -62], [14, -84], [28, -80]]) { P(x + i, b + j, '#fff4c0'); P(x + i - 1, b + j, GOLD); P(x + i + 1, b + j, GOLD); P(x + i, b + j - 1, GOLD); P(x + i, b + j + 1, GOLD); }
  } },
  { id: 'maypole', name: 'Maypole', w: 1, h: 1, price: 420, draw(x, b) {
    floorShadow(x, b, 32); panel(x + 8, b - 5, 16, 5, k.w);
    for (let n = 0; n < 6; n++) line(x + 16, b - 84, x + 2 + n * 5.6, b - 8, n % 2 ? k.c : RAINBOW[n], 1);
    cyl(x + 14, b - 88, 4, 84, k.p);
    for (let a = 0; a < 10; a++) flower(x + 16 + Math.round(Math.cos(a / 10 * Math.PI * 2) * 6), b - 88 + Math.round(Math.sin(a / 10 * Math.PI * 2) * 2), a % 2 ? '#f890b8' : '#ffffff');
    sphere(x + 16, b - 91, 3, k.a);
  } },
  { id: 'pinata', name: 'Piñata', w: 1, h: 1, layer: 'wall', price: 160, wall(x) {
    R(x + 16, 6, 1, 18, '#d8c8a0');
    const S = MOTIFS.star;
    S.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === '.') return; const c = [k.c, '#f8d030', '#58b848', '#e04848', k.a][(j + i) % 5]; R(x + 3 + i * 3, 22 + j * 3, 3, 3, c); P(x + 3 + i * 3, 24 + j * 3, sh(c, -1)); }));
    for (let n = 0; n < 5; n++) R(x + 6 + n * 5, 49, 1, 8 + (n % 2) * 4, RAINBOW[n]);
  } },
  { id: 'festivalstage', name: 'Stage', w: 2, h: 1, price: 1100, draw(x, b, vw, dir) {
    if (dir % 2) return sideBox(x, b, vw, 16);
    floorShadow(x, b, vw);
    for (const i of [0, vw - 10]) { panel(x + i, b - 86, 10, 70, k.c); for (let j = 0; j < 70; j += 2) P(x + i + 2 + (j % 6 ? 3 : 5), b - 86 + j, sh(k.c, -1)); }
    panel(x, b - 90, vw, 6, k.c); for (let i = 0; i < vw; i += 6) disc(x + i + 3, b - 84, 2, k.c); R(x, b - 90, vw, 2, k.a);
    wood(x + 1, b - 18, vw - 2, 4, k.w); R(x + 1, b - 14, vw - 2, 14, k.a); for (let i = 3; i < vw; i += 6) R(x + i, b - 14, 2, 14, sh(k.a, -1));
    for (const i of [16, vw - 20]) { disc(x + i, b - 4, 3, '#f8f0c0'); R(x + i - 3, b - 4, 7, 4, k.m); }
    ovalShade(x + vw / 2, b - 30, 2, 2, k.m); R(x + vw / 2, b - 44, 1, 14, k.m); cushion(x + vw / 2 - 2, b - 50, 5, 7, k.m, 2);
  } },
  { id: 'carnivalmask', name: 'Carnival mask', w: 1, h: 1, layer: 'wall', price: 180, wall(x) {
    shadowWall(x + 5, 30, 22, 14);
    for (let n = 0; n < 5; n++) leaf(x + 8 + n * 4, 22 - (n === 2 ? 4 : n % 2 * 2), 2, 8, n % 2 ? k.a : k.c, (n - 2) * 0.3);
    oval(x + 16, 37, 12, 7, k.c); R(x + 4, 36, 24, 2, sh(k.c, 1));
    for (const i of [10, 22]) { oval(x + i, 37, 4, 2, INK); P(x + i - 3, 35, k.a); }
    for (let i = 0; i < 24; i += 3) P(x + 4 + i, 43 - Math.round(Math.sin(i / 23 * Math.PI) * 3), k.a);
    R(x + 26, 40, 1, 24, k.w);
  } },
  { id: 'confettirug', name: 'Confetti rug', w: 2, h: 2, layer: 'rug', price: 260, high: 0.04, side: 'c', flat(w, h) {
    R(0, 0, w, h, sh(k.c, -1)); R(2, 2, w - 4, h - 4, k.c);
    for (let n = 0; n < 90; n++) { const c = RAINBOW[n % 7]; R(3 + Math.floor(hash(n, 1) * (w - 7)), 3 + Math.floor(hash(n, 2) * (h - 7)), hash(n, 3) < 0.5 ? 2 : 1, hash(n, 3) < 0.5 ? 1 : 2, c); }
    for (let s = 0; s < 3; s++) for (let i = 4; i < w - 4; i++) P(i, 12 + s * 20 + Math.round(Math.sin(i / 4 + s) * 3), [k.a, k.p, '#f8d030'][s]);
  } },
  { id: 'haybale', name: 'Hay bale', w: 1, h: 1, price: 120, draw(x, b) {
    floorShadow(x, b, 32); panel(x + 2, b - 22, 28, 22, STRAW, 2);
    for (let n = 0; n < 60; n++) R(x + 3 + Math.floor(hash(n, 4) * 25), b - 21 + Math.floor(hash(n, 5) * 20), 3, 1, hash(n, 6) < 0.5 ? sh(STRAW, -1) : sh(STRAW, 1));
    for (const i of [8, 22]) R(x + i, b - 22, 2, 22, k.c);
    for (let i = 0; i < 6; i++) P(x + 4 + i * 5, b - 23, sh(STRAW, 1));
  } },
  { id: 'prizewheel', name: 'Prize wheel', w: 1, h: 1, layer: 'wall', price: 300, wall(x) {
    shadowWall(x + 3, 20, 26, 26); disc(x + 16, 33, 14, k.w);
    wheel(x + 16, 33, 12, 8, (i) => i % 2 ? k.p : [k.c, '#f8d030', '#58b848', '#4a98d8'][i >> 1]);
    for (let a = 0; a < 12; a++) P(x + 16 + Math.round(Math.cos(a / 12 * Math.PI * 2) * 13), 33 + Math.round(Math.sin(a / 12 * Math.PI * 2) * 13), '#fff4c0');
    sphere(x + 16, 33, 2.5, k.a); tri(x + 16, 16, 5, k.a, 0.6); R(x + 15, 47, 2, 20, k.w);
  } },
  { id: 'hookaduck', name: 'Hook-a-duck', w: 2, h: 2, price: 700, high: 0.3, side: 'c', flat(w, h) {
    oval(w / 2, h / 2, w / 2 - 1, h / 2 - 1, k.c); for (let a = 0; a < 16; a += 2) { const t = a / 16 * Math.PI * 2; disc(w / 2 + Math.cos(t) * (w / 2 - 4), h / 2 + Math.sin(t) * (h / 2 - 4), 3, k.p); }
    oval(w / 2, h / 2, w / 2 - 8, h / 2 - 8, '#4a98d8'); oval(w / 2 - 3, h / 2 - 3, w / 2 - 14, h / 2 - 14, '#68b8f0');
    for (let n = 0; n < 6; n++) {
      const a = n / 6 * Math.PI * 2, cx = w / 2 + Math.cos(a) * 14, cy = h / 2 + Math.sin(a) * 14;
      oval(cx, cy, 4, 3, '#f8d030'); disc(cx + 2, cy - 2, 2, '#f8d030'); P(cx + 4, cy - 2, '#f08030'); P(cx + 2, cy - 3, INK); P(cx - 1, cy - 1, '#fff090');
    }
  } },
  { id: 'fairsign', name: 'Fair sign', w: 2, h: 1, layer: 'wall', price: 260, glow: ['#fff4c0'], wall(x) {
    shadowWall(x + 4, 18, 56, 30); panel(x + 4, 22, 56, 26, k.c, 2);
    for (let i = 0; i < 56; i++) { const y = 22 - Math.round(Math.sin(i / 55 * Math.PI) * 8); R(x + 4 + i, y, 1, 23 - y, k.c); }
    for (let i = 0; i < 56; i += 5) { P(x + 6 + i, 46, '#fff4c0'); P(x + 6 + i, 21 - Math.round(Math.sin((i + 2) / 55 * Math.PI) * 8), '#fff4c0'); }
    word('FAIR', x + 10, 26, k.p, 3);
    R(x + 10, 48, 2, 22, k.m); R(x + 52, 48, 2, 22, k.m);
  } },
  { id: 'teacupride', name: 'Teacup ride', w: 1, h: 1, price: 520, seat: 'cushion', draw(x, b) {
    floorShadow(x, b, 32); ovalShade(x + 16, b - 4, 15, 4, k.a);
    for (let j = 0; j < 24; j++) { const h = Math.round(13 - (j / 24) ** 2 * 6); R(x + 16 - h, b - 30 + j, h * 2, 1, j < 3 ? sh(k.c, 1) : j > 19 ? sh(k.c, -1) : k.c); }
    for (const [i, j] of [[8, -24], [16, -18], [24, -24], [12, -12], [21, -12]]) disc(x + i, b + j, 2, k.p);
    oval(x + 16, b - 30, 13, 3, sh(k.c, -2)); oval(x + 16, b - 30, 11, 2, k.p);
    ring(x + 29, b - 20, 4, k.c, 2); R(x + 16, b - 34, 1, 4, k.m); disc(x + 16, b - 35, 3, k.m);
  } },
]);

/* ---------- sci-fi lab ---------- */
/** A specimen tank: a glass cylinder of glowing liquid between metal caps; returns the middle of the liquid. */
function tank(x, b) {
  floorShadow(x, b, 32);
  panel(x + 3, b - 12, 26, 12, k.m); R(x + 6, b - 8, 4, 2, '#68e868'); R(x + 12, b - 8, 4, 2, k.a);
  R(x + 6, b - 74, 20, 62, sh(k.g, -1)); R(x + 7, b - 66, 18, 54, k.g);
  for (let n = 0; n < 10; n++) disc(x + 9 + hash(n, 9) * 14, b - 16 - hash(n, 8) * 48, hash(n, 7) < 0.5 ? 1 : 0.6, '#ffffff');
  R(x + 8, b - 70, 2, 54, 'rgba(255,255,255,0.5)'); R(x + 22, b - 70, 1, 54, 'rgba(255,255,255,0.3)');
  panel(x + 3, b - 80, 26, 7, k.m); R(x + 14, b - 88, 4, 8, sh(k.m, -1)); R(x + 4, b - 77, 24, 1, sh(k.m, 1));
  return [x + 16, b - 42];
}
const TANKS = {
  egg: ['Egg', (cx, cy) => { ovalShade(cx, cy, 7, 9, '#f8f0d8'); for (const [i, j] of [[-3, -4], [2, 1], [-2, 4], [3, -6]]) disc(cx + i, cy + j, 1.5, k.c); }],
  helix: ['Helix', (cx, cy) => {
    disc(cx, cy, 8, '#a08058'); disc(cx, cy, 7, '#c8a878');
    for (let a = 0; a < 50; a++) { const t = a / 50 * Math.PI * 5, r = 7 - a / 50 * 6; P(cx + Math.round(Math.cos(t) * r), cy + Math.round(Math.sin(t) * r), '#7a5a38'); }
  }],
  dome: ['Dome', (cx, cy) => {
    for (let j = 0; j < 9; j++) { const h = Math.round(Math.sqrt(81 - (9 - j) ** 2) * 1.1); R(cx - h, cy - 4 + j, h * 2, 1, j < 2 ? '#c8a878' : '#a08058'); }
    for (const i of [-4, 0, 4]) R(cx + i, cy - 2, 1, 6, '#7a5a38'); R(cx - 9, cy + 5, 18, 2, '#5a4028');
  }],
  sprout: ['Sprout', (cx, cy) => { R(cx, cy - 2, 1, 12, '#3a8a2a'); leaf(cx - 4, cy - 2, 4, 2, '#58b848', 0.5); leaf(cx + 4, cy - 5, 4, 2, '#58b848', -0.5); leaf(cx, cy - 9, 2, 4, '#78d060'); ovalShade(cx, cy + 10, 5, 2, '#7a5a38'); }],
  crystal: ['Crystal', (cx, cy) => { for (const [i, h, c] of [[-5, 10, k.a], [0, 16, sh(k.a, 1)], [5, 12, k.a]]) { tri(cx + i, cy - h / 2, h, c, 0.25); R(cx + i - 2, cy + h / 2, 5, 3, c); } P(cx, cy - 6, '#ffffff'); }],
  orb: ['Orb', (cx, cy) => { disc(cx, cy, 9, sh(k.a, 1)); sphere(cx, cy, 7, k.a); ring(cx, cy, 10, '#ffffff'); }],
};
add('Lab', Object.entries(TANKS).map(([id, [name, inside]]) => ({ id: `${id}tank`, name: `${name} tank`, w: 1, h: 1, price: 700, glow: ['g', 'gl'],
  draw(x, b) { const [cx, cy] = tank(x, b); inside(cx, cy); } })));
add('Lab', [
  { id: 'controlpanel', name: 'Control panel', w: 2, h: 1, layer: 'wall', price: 520, glow: ['#68e8a8'], wall(x) {
    shadowWall(x + 3, 20, 58, 40); panel(x + 3, 20, 58, 40, k.m, 2);
    for (const i of [7, 25]) { inset(x + i, 24, 16, 12, '#1a2a2a'); for (let n = 0; n < 14; n++) P(x + i + 1 + n, 30 + Math.round(Math.sin(n / 2 + i) * 3), '#68e8a8'); }
    inset(x + 43, 24, 14, 12, '#1a2a2a'); for (let n = 0; n < 4; n++) R(x + 45 + n * 3, 34 - (n + 1) * 2, 2, (n + 1) * 2, '#f8d030');
    for (let n = 0; n < 8; n++) { disc(x + 9 + n * 6, 44, 2, RAINBOW[n % 7]); P(x + 8 + n * 6, 43, '#ffffff'); }
    for (let n = 0; n < 3; n++) { R(x + 10 + n * 8, 50, 4, 6, sh(k.m, -2)); R(x + 11 + n * 8, 48 - n, 2, 4, k.a); }
    R(x + 40, 50, 18, 6, sh(k.m, -2)); for (let n = 0; n < 6; n++) P(x + 42 + n * 3, 52, n % 2 ? '#e04848' : '#68e868');
  } },
  { id: 'monitorwall', name: 'Monitor wall', w: 2, h: 1, layer: 'wall', price: 600, glow: ['#68b8f0'], wall(x) {
    shadowWall(x + 4, 12, 56, 52); R(x + 4, 12, 56, 52, k.m);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
      const sx = x + 6 + c * 27, sy = 14 + r * 25; panel(sx, sy, 25, 23, sh(k.m, -1)); R(sx + 2, sy + 2, 21, 17, '#14243a');
      const n = r * 2 + c;
      if (n === 0) for (let i = 0; i < 19; i++) P(sx + 3 + i, sy + 10 + Math.round(Math.sin(i / 2) * 5), '#68e8a8');
      if (n === 1) for (let i = 0; i < 5; i++) R(sx + 4 + i * 4, sy + 17 - (3 + hash(i, 2) * 12), 3, 3 + hash(i, 2) * 12, '#68b8f0');
      if (n === 2) { ring(sx + 12, sy + 10, 6, '#68e8a8'); line(sx + 12, sy + 10, sx + 17, sy + 6, '#68e8a8'); P(sx + 9, sy + 8, '#e04848'); }
      if (n === 3) for (let j = 0; j < 5; j++) R(sx + 4, sy + 4 + j * 3, 8 + hash(j, 5) * 9, 1, '#a8d8f8');
      P(sx + 21, sy + 20, '#68e868');
    }
  } },
  { id: 'labrobot', name: 'Robot', w: 1, h: 1, price: 900, glow: ['g'], draw(x, b) {
    floorShadow(x, b, 32);
    for (const i of [4, 20]) { panel(x + i, b - 10, 8, 10, sh(k.m, -1)); for (let j = 0; j < 10; j += 3) R(x + i, b - 10 + j, 8, 1, sh(k.m, -2)); }
    panel(x + 6, b - 40, 20, 30, k.m, 2); inset(x + 10, b - 34, 12, 10, '#1a2a2a'); for (let n = 0; n < 3; n++) R(x + 12 + n * 3, b - 32 + n * 2, 2, 2, RAINBOW[n * 2]);
    for (const i of [1, 26]) { cyl(x + i, b - 38, 5, 18, sh(k.m, 1)); R(x + i - 1, b - 22, 7, 3, k.a); }
    panel(x + 8, b - 58, 16, 16, k.c, 2); R(x + 11, b - 53, 10, 5, '#1a2a2a'); R(x + 12, b - 52, 3, 3, k.g); R(x + 17, b - 52, 3, 3, k.g);
    R(x + 15, b - 66, 2, 8, k.m); sphere(x + 16, b - 68, 2.5, '#e04848');
  } },
  { id: 'robotarm', name: 'Robot arm', w: 1, h: 1, price: 700, draw(x, b) {
    floorShadow(x, b, 32); panel(x + 4, b - 10, 24, 10, k.m); cyl(x + 10, b - 14, 12, 4, sh(k.m, -1));
    line(x + 16, b - 14, x + 9, b - 48, k.c, 5); sphere(x + 11, b - 48, 4, k.m);
    line(x + 11, b - 48, x + 26, b - 66, k.c, 4); sphere(x + 26, b - 66, 3, k.m);
    for (const s of [-1, 1]) line(x + 26, b - 66, x + 26 + s * 4, b - 58, k.a, 2);
    for (let n = 0; n < 6; n++) P(x + 13 - Math.floor(n * 0.4), b - 20 - n * 4, k.a);
  } },
  { id: 'teleporter', name: 'Teleporter pad', w: 2, h: 2, layer: 'rug', price: 1200, high: 0.08, side: 'm', glow: ['g'], flat(w, h) {
    disc(w / 2, h / 2, w / 2 - 1, k.m); disc(w / 2, h / 2, w / 2 - 4, sh(k.m, -1));
    for (let a = 0; a < 24; a++) { const t = a / 24 * Math.PI * 2; R(w / 2 + Math.cos(t) * (w / 2 - 3) - 1, h / 2 + Math.sin(t) * (h / 2 - 3) - 1, 2, 2, a % 2 ? '#f8d030' : INK); }
    disc(w / 2, h / 2, 20, k.g); disc(w / 2, h / 2, 16, sh(k.g, 1)); ring(w / 2, h / 2, 12, '#ffffff'); disc(w / 2, h / 2, 6, '#ffffff');
    for (let a = 0; a < 6; a++) { const t = a / 6 * Math.PI * 2; disc(w / 2 + Math.cos(t) * 25, h / 2 + Math.sin(t) * 25, 2, k.a); }
  } },
  { id: 'hologram', name: 'Hologram projector', w: 1, h: 1, price: 800, glow: ['#88f0ff'], draw(x, b) {
    floorShadow(x, b, 32); panel(x + 6, b - 8, 20, 8, k.m); ovalShade(x + 16, b - 9, 6, 2, '#88f0ff');
    for (let j = 0; j < 50; j++) { const h = Math.round(2 + j * 0.24); R(x + 16 - h, b - 10 - j, h * 2, 1, 'rgba(136,240,255,0.25)'); }
    ring(x + 16, b - 46, 10, '#88f0ff'); line(x + 6, b - 46, x + 26, b - 46, '#88f0ff'); ring(x + 16, b - 46, 3, '#88f0ff');
    for (let j = 0; j < 20; j += 3) R(x + 6, b - 56 + j, 20, 1, 'rgba(200,250,255,0.35)');
  } },
  { id: 'teslacoil', name: 'Tesla coil', w: 1, h: 1, price: 750, glow: ['#c8f0ff'], draw(x, b) {
    floorShadow(x, b, 32); panel(x + 5, b - 10, 22, 10, k.m); cyl(x + 11, b - 58, 10, 48, k.p);
    for (let j = b - 56; j < b - 12; j += 3) R(x + 11, j, 10, 1, '#c87838');
    ovalShade(x + 16, b - 62, 10, 4, k.m); R(x + 6, b - 63, 20, 1, sh(k.m, 1));
    for (const [pts, c] of [[[[16, -66], [12, -74], [16, -78], [10, -88]], '#c8f0ff'], [[[20, -64], [26, -72], [24, -78], [30, -86]], '#ffffff'], [[[6, -62], [2, -70], [5, -76]], '#c8f0ff']]) for (let n = 1; n < pts.length; n++) line(x + pts[n - 1][0], b + pts[n - 1][1], x + pts[n][0], b + pts[n][1], c);
  } },
  { id: 'cryopod', name: 'Cryo pod', w: 1, h: 1, price: 1000, glow: ['#bfe6f8'], draw(x, b) {
    floorShadow(x, b, 32);
    for (let j = 0; j < 86; j++) { const e = j < 8 ? 8 - j : j > 80 ? j - 80 : 0, h = 13 - Math.round(e * e / 10); R(x + 16 - h, b - 86 + j, h * 2, 1, k.m); }
    for (let j = 0; j < 58; j++) { const e = j < 6 ? 6 - j : 0, h = 8 - Math.round(e * e / 6); R(x + 16 - h, b - 76 + j, h * 2, 1, ICE); }
    speckle(x + 8, b - 76, 16, 58, '#ffffff', 7, 0.18); R(x + 10, b - 70, 2, 48, '#ffffff');
    R(x + 9, b - 14, 14, 6, '#1a2a2a'); R(x + 10, b - 12, 6, 2, '#68b8f0'); P(x + 19, b - 12, '#68e868'); R(x + 3, b - 50, 3, 14, k.a);
  } },
  { id: 'tuberack', name: 'Test tube rack', w: 1, h: 1, price: 260, draw(x, b) {
    floorShadow(x, b, 32); cyl(x + 6, b - 30, 2, 30, k.m); cyl(x + 24, b - 30, 2, 30, k.m); panel(x + 3, b - 32, 26, 4, k.p);
    panel(x + 4, b - 40, 24, 3, k.w); R(x + 4, b - 34, 24, 2, k.w);
    ['#e04848', '#58b848', '#4a98d8', k.c, '#f8d030'].forEach((c, n) => { const i = x + 6 + n * 4; glass(i, b - 46, 3, 14, '#e8f4f8'); R(i, b - 40, 3, 6, c); P(i + 1, b - 39, sh(c, 2)); });
    disc(x + 26, b - 38, 3, k.a);
  } },
  { id: 'centrifuge', name: 'Centrifuge', w: 1, h: 1, price: 480, draw(x, b) {
    floorShadow(x, b, 32); panel(x + 3, b - 30, 26, 30, k.p, 2); R(x + 3, b - 30, 26, 2, sh(k.p, 1));
    oval(x + 16, b - 31, 11, 4, k.m); oval(x + 16, b - 32, 9, 3, k.c); ring(x + 16, b - 32, 3, sh(k.c, -1));
    inset(x + 6, b - 24, 12, 6, '#1a2a2a'); R(x + 7, b - 22, 8, 2, '#68e868'); disc(x + 23, b - 21, 2, '#e04848'); disc(x + 23, b - 14, 2, k.a);
    R(x + 5, b - 4, 22, 2, sh(k.p, -2));
  } },
  { id: 'hazardfloor', name: 'Hazard floor', w: 2, h: 2, layer: 'rug', price: 240, high: 0.03, side: 'm', flat(w, h) {
    R(0, 0, w, h, k.m);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (((i + j * 3) % 8 === 0 && j % 4 === 1) || ((i * 3 + j) % 8 === 0 && j % 4 === 3)) R(i, j, 2, 1, sh(k.m, 1));
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (i < 5 || j < 5 || i >= w - 5 || j >= h - 5) P(i, j, ((i + j) >> 2) % 2 ? '#f8d030' : INK);
  } },
  { id: 'dnamodel', name: 'DNA model', w: 1, h: 1, price: 380, draw(x, b) {
    floorShadow(x + 4, b, 24); panel(x + 6, b - 6, 20, 6, k.w); R(x + 15, b - 86, 2, 80, k.m);
    for (let n = 0; n < 14; n++) {
      const y = b - 12 - n * 5.5, s = Math.sin(n * 0.7) * 10;
      R(x + 16 - Math.abs(s), y, Math.abs(s) * 2, 1, '#e8e8e8');
      sphere(x + 16 + s, y, 2.2, k.c); sphere(x + 16 - s, y, 2.2, k.a);
    }
  } },
  { id: 'satdish', name: 'Satellite dish', w: 1, h: 1, price: 560, draw(x, b) {
    floorShadow(x, b, 32); line(x + 16, b - 34, x + 5, b - 1, k.m, 2); line(x + 16, b - 34, x + 26, b - 1, k.m, 2); line(x + 16, b - 34, x + 16, b - 1, sh(k.m, -1), 2);
    for (let j = -14; j <= 14; j++) { const h = Math.round(Math.sqrt(196 - j * j) * 0.55); R(x + 15 - h + Math.round(j * 0.3), b - 54 + j, h * 2, 1, j < -8 ? sh(k.p, 1) : j > 8 ? sh(k.p, -1) : k.p); }
    line(x + 16, b - 54, x + 26, b - 64, k.m); sphere(x + 26, b - 65, 2, k.c); P(x + 12, b - 62, '#ffffff');
  } },
  { id: 'rocketmodel', name: 'Rocket', w: 1, h: 1, price: 880, draw(x, b) {
    floorShadow(x, b, 32); panel(x + 2, b - 6, 28, 6, k.m);
    for (const s of [-1, 1]) for (let j = 0; j < 16; j++) R(x + 16 + s * (8 + Math.floor(j / 3)) - (s < 0 ? 2 : 0), b - 26 + j, 3, 1, k.c);
    cyl(x + 9, b - 70, 14, 62, k.p);
    for (let j = 0; j < 18; j++) { const h = Math.round(7 * Math.sqrt(j / 18)); R(x + 16 - h, b - 88 + j, h * 2, 1, j < 4 ? sh(k.c, 1) : k.c); }
    disc(x + 16, b - 54, 4, k.m); disc(x + 16, b - 54, 3, SKYB); P(x + 15, b - 56, '#ffffff'); R(x + 9, b - 38, 14, 2, k.c);
    R(x + 12, b - 8, 8, 2, sh(k.m, -2));
  } },
  { id: 'airlock', name: 'Airlock door', w: 1, h: 1, layer: 'wall', price: 640, wall(x) {
    shadowWall(x + 2, 6, 28, 70); panel(x + 2, 6, 28, 70, k.m, 2);
    for (let j = 6; j < 76; j++) for (const i of [2, 3, 28, 29]) P(x + i, j, ((j + i) >> 2) % 2 ? '#f8d030' : INK);
    inset(x + 7, 12, 18, 58, sh(k.m, 1)); disc(x + 16, 26, 6, sh(k.m, -2)); disc(x + 16, 26, 5, SKYB); P(x + 14, 24, '#ffffff');
    ring(x + 16, 48, 6, k.a, 2); line(x + 10, 48, x + 22, 48, k.a, 2); line(x + 16, 42, x + 16, 54, k.a, 2);
    R(x + 9, 62, 14, 3, '#e04848');
  } },
  { id: 'hazardsign', name: 'Hazard sign', w: 1, h: 1, layer: 'wall', price: 90, wall(x) {
    shadowWall(x + 4, 24, 24, 22);
    for (let j = 0; j < 22; j++) { const h = Math.round(j * 0.56); R(x + 16 - h, 24 + j, h * 2 + 1, 1, k.c); }
    for (let j = 4; j < 19; j++) { const h = Math.round((j - 4) * 0.56); R(x + 16 - h, 24 + j + 1, h * 2 + 1, 1, '#f8d030'); }
    R(x + 15, 32, 3, 7, INK); R(x + 15, 41, 3, 2, INK);
  } },
  { id: 'elementchart', name: 'Element chart', w: 2, h: 1, layer: 'wall', price: 200, wall(x) {
    shadowWall(x + 3, 14, 58, 40); panel(x + 3, 14, 58, 40, k.p);
    const shape = ['#..............#', '##..........####', '##..........####', '################', '################', '..##############'];
    shape.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '#') return; const c = [k.c, '#f8d030', '#58b848', SKYB, k.a][i < 2 ? 0 : i > 11 ? 3 : j > 4 ? 4 : (i + j) % 2 + 1]; R(x + 5 + i * 3.5, 17 + j * 5, 3, 4, c); P(x + 5 + i * 3.5, 17 + j * 5, sh(c, 1)); }));
    R(x + 7, 48, 40, 1, sh(k.p, -2));
  } },
  { id: 'startertable', name: 'Starter table', w: 2, h: 1, price: 1500, draw(x, b, vw, dir) {
    if (dir % 2) return sideBox(x, b, vw, 30);
    floorShadow(x, b, vw); wood(x + 2, b - 30, vw - 4, 26, k.w); R(x + 3, b - 4, vw - 6, 4, sh(k.w, -3));
    for (const i of [6, vw / 2 - 1]) { inset(x + i, b - 26, vw / 2 - 7, 18, sh(k.w, 1)); }
    panel(x, b - 34, vw, 5, k.p);
    R(x + 6, b - 58, vw - 12, 24, 'rgba(200,232,248,0.35)'); R(x + 6, b - 58, vw - 12, 1, '#e0f4ff'); R(x + 6, b - 58, 1, 24, '#e0f4ff'); R(x + vw - 7, b - 58, 1, 24, '#e0f4ff');
    for (let i = 0; i < 8; i++) P(x + 10 + i, b - 52 + i, '#ffffff');
    ['#e04848', '#e04848', '#e04848'].forEach((c, n) => ball(x + 18 + n * 14, b - 41, 5, c));
    R(x + 4, b - 60, vw - 8, 3, k.a);
  } },
  { id: 'labcoat', name: 'Lab coat stand', w: 1, h: 1, price: 300, draw(x, b) {
    floorShadow(x + 4, b, 24); line(x + 16, b - 4, x + 8, b, k.m, 2); line(x + 16, b - 4, x + 24, b, k.m, 2); R(x + 15, b - 86, 2, 82, k.m);
    R(x + 9, b - 84, 14, 2, k.m);
    for (let j = 0; j < 52; j++) { const h = Math.round(7 + j * 0.12); R(x + 16 - h, b - 82 + j, h * 2, 1, j < 4 ? sh('#f4f4f0', 1) : '#f4f4f0'); }
    for (let j = 0; j < 22; j++) { P(x + 15 - Math.floor(j / 4), b - 80 + j, '#c8c8d0'); P(x + 17 + Math.floor(j / 4), b - 80 + j, '#c8c8d0'); }
    R(x + 16, b - 58, 1, 28, '#d8d8e0'); R(x + 18, b - 56, 6, 6, '#e8e8ee'); R(x + 20, b - 59, 1, 4, k.c); R(x + 22, b - 59, 1, 4, '#4a78d8');
    for (const i of [-10, 8]) R(x + 16 + i, b - 78, 3, 34, '#e8e8ee');
  } },
]);

/* ---------- castle ---------- */
const CHARGES = {
  crown: ['Crown', ['.........', '#...#...#', '##.###.##', '#########', '#+#+#+#+#', '#########', '#########']],
  sword: ['Sword', ['....#....', '...#+#...', '...#+#...', '...#+#...', '...#+#...', '.#######.', '....#....', '...###...', '....#....']],
  tower: ['Tower', ['#.#.#.#.#', '#########', '.#######.', '.###k###.', '.##kkk##.', '.##kkk##.', '.#######.', '#########']],
  key: ['Key', ['..###....', '.#...#...', '.#...#...', '..###....', '...#.....', '...###...', '...#.....', '...##....']],
  fleur: ['Fleur', ['....#....', '...###...', '#..###..#', '##.###.##', '.#######.', '...###...', '#########', '...###...', '..#.#.#..']],
  shield: ['Shield', ['#########', '#+++++++#', '#+#+++#+#', '#++#+#++#', '#+++#+++#', '.#+++++#.', '..#+++#..', '...#+#...', '....#....']],
};
add('Castle', Object.entries(CHARGES).map(([id, [name, rows]]) => ({ id: `${id}tapestry`, name: `${name} tapestry`, w: 1, h: 1, layer: 'wall', price: 240,
  wall(x) {
    shadowWall(x + 6, 14, 20, 58);
    for (let j = 0; j < 58; j++) { const cut = j > 48 ? j - 48 : 0; R(x + 6, 14 + j, 10 - cut, 1, k.c); R(x + 16 + cut, 14 + j, 10 - cut, 1, k.c); }
    for (let j = 0; j < 50; j++) { P(x + 7, 15 + j, k.a); P(x + 24, 15 + j, k.a); }
    R(x + 7, 15, 18, 1, k.a); for (let i = 0; i < 18; i += 2) P(x + 7 + i, 17, sh(k.c, 1));
    stamp(rows, x + 7, 28, { '#': k.a, '+': sh(k.a, 1), k: sh(k.c, -2) }, 2);
    cyl(x + 3, 12, 26, 3, k.w); sphere(x + 3, 13, 2, k.a); sphere(x + 29, 13, 2, k.a); R(x + 15, 6, 2, 6, k.m);
  } })));
add('Castle', [
  { id: 'armour', name: 'Suit of armour', w: 1, h: 1, price: 900, draw(x, b) {
    floorShadow(x, b, 32); panel(x + 6, b - 6, 20, 6, STONE);
    for (const i of [10, 17]) { cyl(x + i, b - 32, 5, 26, k.m); R(x + i - 1, b - 10, 7, 4, sh(k.m, -1)); }
    panel(x + 8, b - 58, 16, 26, k.m, 2); R(x + 15, b - 56, 2, 22, sh(k.m, 1)); R(x + 8, b - 36, 16, 3, k.a);
    for (const i of [3, 24]) { sphere(x + i + 2, b - 56, 4, k.m); cyl(x + i, b - 54, 5, 20, sh(k.m, -1)); }
    ovalShade(x + 16, b - 66, 7, 8, k.m); for (let i = 0; i < 3; i++) R(x + 12, b - 68 + i * 3, 9, 1, INK);
    for (let n = 0; n < 5; n++) leaf(x + 16 + n - 2, b - 78 - n, 2, 5, k.c, 0.6);
    R(x + 29, b - 92, 2, 90, k.w); tri(x + 30, b - 96, 6, k.m, 0.4); R(x + 26, b - 86, 7, 4, k.m);
  } },
  { id: 'portcullis', name: 'Portcullis', w: 2, h: 1, layer: 'wall', price: 800, wall(x) {
    R(x + 10, 20, 44, 56, '#1a1420');
    for (let j = 0; j < 56; j += 6) for (const i of [10, 18, 26, 34, 42, 50]) R(x + i, 20 + j, 4, 2, sh(k.m, -1));
    for (const i of [10, 18, 26, 34, 42, 50]) { R(x + i + 1, 22, 2, 46, k.m); tri(x + i + 2, 66, 6, k.m, -0.3); }
    for (let j = 24; j < 66; j += 8) R(x + 10, j, 44, 2, k.m);
    for (let j = 0; j < 76; j += 8) for (const [i, w] of [[0, 10], [54, 10]]) { panel(x + i, j, w, 8, STONE); }
    for (let i = 0; i < 44; i += 11) panel(x + 10 + i, 10, 11, 10, STONE);
  } },
  { id: 'arrowslit', name: 'Arrow slit', w: 1, h: 1, layer: 'wall', price: 260, wall(x) {
    for (let j = 0; j < 7; j++) for (let i = -1; i < 3; i++) panel(x + 2 + i * 10 + (j % 2) * 5, 12 + j * 9, 10, 9, STONE);
    R(x + 14, 22, 5, 40, SKYB); R(x + 9, 38, 15, 5, SKYB); R(x + 14, 22, 1, 40, '#ffffff'); R(x + 9, 38, 15, 1, '#d8eef8');
    R(x + 13, 21, 7, 1, sh(STONE, -2)); R(x + 13, 22, 1, 40, sh(STONE, -2));
  } },
  { id: 'walltorch', name: 'Wall torch', w: 1, h: 1, layer: 'wall', price: 220, glow: ['#ffb060', '#ffe0a0'], wall(x) {
    panel(x + 12, 46, 8, 12, k.m); R(x + 14, 40, 4, 8, k.m);
    line(x + 16, 46, x + 16, 28, k.w, 3); cyl(x + 13, 26, 7, 6, k.m);
    tri(x + 16, 8, 18, '#f08030', 0.35); tri(x + 16, 13, 13, '#f8d030', 0.3); tri(x + 16, 18, 7, '#fff4c0', 0.25);
    for (const [i, j] of [[10, 6], [22, 10], [18, 2]]) P(x + i, j, '#f8d030');
  } },
  { id: 'hoard', name: 'Treasure hoard', w: 1, h: 1, price: 1200, draw(x, b) {
    floorShadow(x, b, 32);
    wood(x + 12, b - 28, 18, 16, k.w); R(x + 12, b - 24, 18, 2, k.a); R(x + 12, b - 16, 18, 2, k.a);
    for (let j = 0; j < 8; j++) R(x + 12, b - 36 + j, 18, 1, j < 2 ? sh(k.w, 1) : k.w); R(x + 12, b - 36, 18, 1, k.a);
    for (let j = 0; j < 14; j++) { const h = Math.round(Math.sqrt(j) * 4); R(x + 12 - h, b - 14 + j, h * 2 + 6, 1, GOLD); }
    for (let n = 0; n < 24; n++) { const cx = x + 2 + hash(n, 2) * 26, cy = b - 2 - hash(n, 3) * 12 * (1 - Math.abs(cx - x - 14) / 18); disc(cx, cy, 1.5, sh(GOLD, hash(n, 4) < 0.5 ? 1 : -1)); }
    for (const [i, j, c] of [[8, -10, '#e04848'], [18, -6, '#58b848'], [24, -10, '#4a98d8'], [12, -4, '#a858d8']]) { R(x + i, b + j, 3, 3, c); P(x + i, b + j, '#ffffff'); }
    R(x + 16, b - 32, 6, 3, GOLD);
  } },
  { id: 'banquettable', name: 'Banquet table', w: 2, h: 1, price: 1000, draw(x, b, vw, dir) {
    if (dir % 2) return sideBox(x, b, vw, 30);
    floorShadow(x, b, vw); for (const i of [4, vw - 9]) cyl(x + i, b - 26, 5, 26, sh(k.w, -1));
    wood(x, b - 32, vw, 7, k.w); R(x + 2, b - 32, vw - 4, 2, k.c); for (let i = 4; i < vw - 4; i += 8) R(x + i, b - 30, 4, 6, k.c);
    ovalShade(x + vw / 2, b - 34, 12, 3, k.m); ovalShade(x + vw / 2, b - 39, 9, 6, '#b86a30'); R(x + vw / 2 - 4, b - 44, 3, 2, '#e09858'); R(x + vw / 2 + 7, b - 44, 2, 6, '#f4f0e0');
    for (const i of [8, vw - 14]) { R(x + i + 2, b - 38, 2, 4, k.a); R(x + i, b - 44, 6, 6, k.a); R(x + i + 1, b - 43, 4, 2, '#8a2030'); }
    for (const i of [16, vw - 18]) { cyl(x + i, b - 46, 3, 12, '#f4f0e0'); tri(x + i + 1, b - 51, 4, '#f8d030', 0.3); }
  } },
  { id: 'shieldwall', name: 'Round shield', w: 1, h: 1, layer: 'wall', price: 260, wall(x) {
    line(x + 3, 14, x + 29, 64, k.w, 2); line(x + 29, 14, x + 3, 64, k.w, 2); tri(x + 3, 8, 6, k.m, 0.4); tri(x + 29, 8, 6, k.m, 0.4);
    disc(x + 16, 38, 14, k.m); disc(x + 16, 38, 12, k.c); for (let i = -10; i <= 10; i += 5) R(x + 16 + i, 27, 1, 22, sh(k.c, -1));
    sphere(x + 16, 38, 4, k.a); for (let a = 0; a < 8; a++) P(x + 16 + Math.round(Math.cos(a * 0.8) * 13), 38 + Math.round(Math.sin(a * 0.8) * 13), k.a);
  } },
  { id: 'swordrack', name: 'Weapon rack', w: 1, h: 1, price: 520, draw(x, b) {
    floorShadow(x, b, 32); wood(x + 2, b - 8, 28, 8, k.w); wood(x + 2, b - 54, 28, 5, k.w); cyl(x + 2, b - 58, 3, 58, k.w); cyl(x + 27, b - 58, 3, 58, k.w);
    R(x + 8, b - 84, 2, 76, k.w); tri(x + 9, b - 94, 10, k.m, 0.3);
    R(x + 15, b - 70, 3, 58, k.m); R(x + 16, b - 70, 1, 58, sh(k.m, 2)); R(x + 12, b - 16, 9, 2, k.a); R(x + 15, b - 14, 3, 7, k.w); tri(x + 16, b - 74, 4, k.m, 0.4);
    R(x + 23, b - 80, 2, 72, k.w); for (let j = 0; j < 12; j++) R(x + 19 - Math.floor(Math.sin(j / 11 * Math.PI) * 3), b - 82 + j, 4 + Math.floor(Math.sin(j / 11 * Math.PI) * 3), 1, k.m);
  } },
  { id: 'cannon', name: 'Cannon', w: 2, h: 1, price: 900, draw(x, b, vw) {
    floorShadow(x, b, vw); wood(x + 6, b - 16, vw - 20, 10, k.w);
    const len = vw - 12;
    for (let i = 0; i < len; i++) { const r = Math.round(9 - i / len * 3); R(x + 4 + i, b - 26 - r + Math.round(i * 0.12), 1, r * 2, i % 12 < 2 ? k.a : k.m); }
    for (let i = 0; i < len; i++) P(x + 4 + i, b - 32 + Math.round(i * 0.12), sh(k.m, 2));
    disc(x + vw - 8, b - 26 + Math.round(len * 0.12), 4, INK); sphere(x + 8, b - 28, 3, k.m);
    for (const i of [12, vw - 22]) { disc(x + i, b - 9, 8, sh(k.w, -1)); disc(x + i, b - 9, 6, k.w); for (let a = 0; a < 6; a++) line(x + i, b - 9, x + i + Math.cos(a) * 6, b - 9 + Math.sin(a) * 6, sh(k.w, -2)); disc(x + i, b - 9, 2, k.m); }
    for (const [i, j] of [[vw / 2 - 4, -4], [vw / 2 + 4, -4], [vw / 2, -9]]) if (i > 0) sphere(x + i, b + j, 3, INK);
  } },
  { id: 'catapult', name: 'Catapult', w: 2, h: 1, price: 1100, draw(x, b, vw) {
    floorShadow(x, b, vw); wood(x + 4, b - 12, vw - 8, 6, k.w);
    for (const i of [12, vw - 12]) { disc(x + i, b - 6, 6, sh(k.w, -1)); disc(x + i, b - 6, 2, k.m); }
    line(x + vw / 2 - 8, b - 12, x + vw / 2, b - 44, k.w, 3); line(x + vw / 2 + 8, b - 12, x + vw / 2, b - 44, k.w, 3);
    line(x + 8, b - 16, x + vw - 6, b - 60, sh(k.w, 1), 3); cyl(x + vw / 2 - 4, b - 46, 8, 4, k.m);
    ovalShade(x + vw - 8, b - 64, 6, 3, k.w); sphere(x + vw - 8, b - 69, 5, STONE); R(x + 4, b - 22, 6, 6, k.c);
  } },
  { id: 'royalcarpet', name: 'Royal carpet', w: 1, h: 3, layer: 'rug', price: 380, high: 0.03, side: 'c', flat(w, h) {
    R(0, 0, w, h, k.a); R(3, 0, w - 6, h, k.c); R(5, 0, w - 10, h, sh(k.c, 1)); R(7, 0, w - 14, h, k.c);
    for (let j = 8; j < h; j += 16) { for (let i = 0; i < 5; i++) { R(w / 2 - i, j - 4 + i, i * 2 + 1, 1, k.a); R(w / 2 - i, j + 4 - i, i * 2 + 1, 1, k.a); } P(w / 2, j, sh(k.a, 2)); }
    for (let i = 1; i < w; i += 3) { R(i, 0, 1, 2, k.a); R(i, h - 2, 1, 2, k.a); }
  } },
  { id: 'castlecolumn', name: 'Stone column', w: 1, h: 1, price: 480, solid: true, draw(x, b) {
    floorShadow(x, b, 32); panel(x + 3, b - 8, 26, 8, STONE); panel(x + 5, b - 12, 22, 4, sh(STONE, 1));
    cyl(x + 7, b - 82, 18, 70, STONE); for (const i of [10, 14, 18, 22]) R(x + i, b - 80, 1, 66, sh(STONE, -1));
    panel(x + 4, b - 88, 24, 6, sh(STONE, 1)); panel(x + 2, b - 92, 28, 4, STONE);
    for (let n = 0; n < 14; n++) leaf(x + 8 + Math.round(Math.sin(n) * 6) + (n % 2) * 8, b - 20 - n * 4, 2, 2, k.leaf, 0.4);
  } },
  { id: 'crowncushion', name: 'Crown on a cushion', w: 1, h: 1, price: 1300, draw(x, b) {
    floorShadow(x, b, 32); panel(x + 8, b - 32, 16, 32, k.w); panel(x + 5, b - 36, 22, 5, sh(k.w, 1)); R(x + 6, b - 4, 20, 4, sh(k.w, -1));
    cushion(x + 3, b - 44, 26, 9, k.c, 3); for (const i of [3, 28]) { P(x + i, b - 36, k.a); R(x + i, b - 35, 1, 4, k.a); }
    R(x + 9, b - 52, 14, 8, GOLD); for (const i of [9, 15, 21]) tri(x + i + 1, b - 58, 6, GOLD, 0.4); R(x + 9, b - 46, 14, 2, sh(GOLD, -1));
    for (const [i, c] of [[11, '#e04848'], [16, '#4a98d8'], [21, '#58b848']]) P(x + i, b - 49, c); for (const i of [10, 16, 22]) P(x + i, b - 58, '#fff4c0');
  } },
  { id: 'spinwheel', name: 'Spinning wheel', w: 1, h: 1, price: 450, draw(x, b) {
    floorShadow(x, b, 32); line(x + 4, b, x + 10, b - 22, k.w, 2); line(x + 28, b, x + 22, b - 22, k.w, 2); wood(x + 4, b - 22, 24, 4, k.w);
    ring(x + 16, b - 44, 13, k.w, 2); for (let a = 0; a < 8; a++) line(x + 16, b - 44, x + 16 + Math.cos(a / 8 * Math.PI * 2) * 12, b - 44 + Math.sin(a / 8 * Math.PI * 2) * 12, sh(k.w, 1));
    disc(x + 16, b - 44, 2, k.m); R(x + 26, b - 40, 2, 18, k.w); ovalShade(x + 27, b - 44, 3, 4, k.c);
    line(x + 27, b - 44, x + 16, b - 57, k.c); R(x + 2, b - 4, 10, 2, k.w);
  } },
  { id: 'candlestand', name: 'Iron candle stand', w: 1, h: 1, price: 420, glow: ['#ffd070', '#fff4c0'], draw(x, b) {
    floorShadow(x + 4, b, 24); for (const i of [-10, 0, 10]) line(x + 16, b - 12, x + 16 + i, b, k.m, 2);
    R(x + 15, b - 70, 2, 58, k.m); ovalShade(x + 16, b - 70, 13, 3, k.m);
    for (const i of [-10, -5, 0, 5, 10]) { const t = b - 82 + Math.abs(i) * 0.4; cyl(x + 15 + i, t, 3, 10, '#f4f0e0'); tri(x + 16 + i, t - 5, 5, '#f8b040', 0.3); P(x + 16 + i, t - 2, '#fff4c0'); }
    for (let n = 0; n < 4; n++) P(x + 9 + n * 5, b - 68, '#f4f0e0');
  } },
  { id: 'stainedglass', name: 'Stained glass window', w: 1, h: 1, layer: 'wall', price: 700, glow: ['#f8a8c8', '#a8d8f8', '#f8e078'], wall(x) {
    shadowWall(x + 5, 12, 22, 60);
    for (let j = 0; j < 60; j++) { const top = j < 11 ? Math.round(11 - Math.sqrt(121 - (11 - j) ** 2)) : 0; R(x + 5 + top, 12 + j, 22 - top * 2, 1, STONE); }
    for (let j = 2; j < 58; j++) for (let i = 2; i < 20; i++) {
      const top = j < 11 ? 11 - Math.sqrt(121 - (11 - j) ** 2) : 0; if (i < top + 1 || i > 20 - top) continue;
      const lead = i % 6 === 1 || j % 8 === 1 || Math.abs(i - 11 - Math.round(Math.sin(j / 4) * 3)) < 1;
      P(x + 5 + i, 12 + j, lead ? INK : [k.c, '#f8d030', '#4a98d8', '#58b848', k.a, '#a858d8'][(((i / 6) | 0) * 3 + ((j / 8) | 0)) % 6]);
    }
    R(x + 3, 72, 26, 3, STONE);
  } },
  { id: 'dragonnest', name: 'Dragon egg nest', w: 1, h: 1, price: 1100, glow: ['#ffb060'], draw(x, b) {
    floorShadow(x, b, 32);
    for (let n = 0; n < 26; n++) line(x + 2 + hash(n, 1) * 8, b - 2 - hash(n, 2) * 10, x + 22 + hash(n, 3) * 8, b - 2 - hash(n, 4) * 10, hash(n, 5) < 0.5 ? '#8a6038' : '#a87848');
    ovalShade(x + 16, b - 26, 9, 13, k.c);
    for (const [i, j] of [[-4, -6], [3, -2], [-2, 4], [4, 6]]) { R(x + 16 + i, b - 26 + j, 3, 2, k.a); P(x + 16 + i, b - 26 + j, sh(k.a, 2)); }
    line(x + 10, b - 30, x + 14, b - 22, '#ffb060'); line(x + 14, b - 22, x + 12, b - 16, '#ffb060');
  } },
  { id: 'battlement', name: 'Battlement wall', w: 2, h: 1, price: 600, draw(x, b, vw) {
    floorShadow(x, b, vw);
    for (let r = 0; r < 4; r++) { const y = b - 10 - r * 10; for (let i = -(r % 2) * 7; i < vw; i += 14) { const px = Math.max(x, x + i), pw = Math.min(x + i + 13, x + vw) - px; panel(px, y, pw, 10, STONE); } }
    for (let i = 0; i + 10 <= vw; i += 16) panel(x + i, b - 52, 10, 12, STONE);
    for (let n = 0; n < 8; n++) speckle(x + 1, b - 50, vw - 2, 48, sh(STONE, -1), n, 0.01);
    R(x + 4, b - 34, 10, 14, k.c); tri(x + 9, b - 20, 4, k.c, -1); R(x + 6, b - 30, 6, 2, k.a);
  } },
  { id: 'archerytarget', name: 'Archery target', w: 1, h: 1, price: 280, draw(x, b) {
    floorShadow(x, b, 32); line(x + 8, b - 46, x + 3, b, k.w, 2); line(x + 24, b - 46, x + 29, b, k.w, 2); line(x + 16, b - 46, x + 18, b, sh(k.w, -1), 2);
    disc(x + 16, b - 46, 14, STRAW); disc(x + 16, b - 46, 12, k.p); disc(x + 16, b - 46, 9, k.c); disc(x + 16, b - 46, 6, k.p); disc(x + 16, b - 46, 3, GOLD);
    for (const [i, j] of [[18, -47], [11, -52], [22, -40]]) { line(x + i, b + j, x + i + 7, b + j - 4, k.w); R(x + i + 6, b + j - 6, 3, 3, k.a); }
  } },
]);

/* ---------- japanese ---------- */
const SCROLLS = {
  crane: ['Crane', (x, y) => {
    R(x + 5, y + 14, 1, 14, INK); R(x + 7, y + 14, 1, 14, INK);
    ovalShade(x + 6, y + 10, 4, 4, '#ffffff'); for (let i = 0; i < 4; i++) P(x + 3 - i, y + 7 - i, INK);
    R(x + 9, y + 3, 1, 8, '#ffffff'); R(x + 8, y + 2, 2, 2, '#e04848'); P(x + 10, y + 3, '#c8a058'); leaf(x + 3, y + 12, 3, 2, INK, -0.5);
  }],
  fuji: ['Mountain', (x, y) => {
    disc(x + 9, y + 6, 3, '#e04848');
    for (let j = 0; j < 14; j++) { const h = Math.round(j * 0.75); R(x + 6 - h, y + 14 + j, h * 2 + 1, 1, j < 5 ? '#ffffff' : '#5a78a8'); }
    for (let i = 0; i < 12; i++) P(x + i, y + 31 - (i % 3), '#5a78a8');
  }],
  bamboo: ['Bamboo', (x, y) => {
    for (const [i, c] of [[3, '#4a8a3a'], [8, '#5a9a42']]) { R(x + i, y, 2, 34, c); for (let j = 4; j < 34; j += 8) R(x + i - 1, y + j, 4, 1, sh(c, -1)); }
    for (const [i, j, t] of [[7, 6, 0.7], [2, 14, -0.7], [10, 22, 0.6]]) leaf(x + i, y + j, 3, 1, '#58a848', t);
  }],
  koi: ['Koi', (x, y) => {
    for (let j = 0; j < 18; j++) { const cx = x + 6 + Math.round(Math.sin(j / 5) * 2), w = j < 3 ? j + 1 : j > 12 ? Math.max(1, 18 - j) : 3; R(cx - w, y + 8 + j, w * 2, 1, j % 6 < 3 ? '#f08030' : '#ffffff'); }
    R(x + 3, y + 26, 2, 3, '#f08030'); R(x + 8, y + 26, 2, 3, '#f08030'); P(x + 5, y + 10, INK); P(x + 8, y + 10, INK);
    for (let i = 0; i < 10; i += 3) P(x + i, y + 4, '#a8c8e8');
  }],
  moon: ['Moon', (x, y) => {
    disc(x + 6, y + 9, 6, '#f8f0c0'); disc(x + 5, y + 8, 2, '#e8dca0');
    for (let n = 0; n < 6; n++) R(x + n * 2, y + 22 + (n % 3), 1, 10 - (n % 3), '#8a9a58');
    leaf(x + 9, y + 26, 2, 4, '#a8b878', 0.4);
  }],
  wave: ['Wave', (x, y) => {
    for (let j = 0; j < 14; j++) R(x, y + 20 + j, 12, 1, j < 3 ? '#4a78c8' : '#2a4a8a');
    for (let a = 0; a < 30; a++) { const t = a / 30 * Math.PI * 1.6, r = 8 - a / 6; P(x + 6 + Math.round(Math.cos(t + 2) * r), y + 18 + Math.round(Math.sin(t + 2) * r), '#ffffff'); }
    for (let i = 0; i < 12; i += 2) P(x + i, y + 20, '#ffffff'); disc(x + 9, y + 4, 2, '#e04848');
  }],
};
add('Japanese', Object.entries(SCROLLS).map(([id, [name, pic]]) => ({ id: `${id}scroll`, name: `${name} scroll`, w: 1, h: 1, layer: 'wall', price: 260,
  wall(x) {
    R(x + 15, 4, 2, 6, INK); line(x + 10, 10, x + 16, 5, INK); line(x + 22, 10, x + 16, 5, INK);
    shadowWall(x + 8, 10, 16, 64); R(x + 8, 10, 16, 64, k.c); R(x + 8, 10, 16, 2, sh(k.c, 1)); R(x + 8, 16, 16, 1, k.a); R(x + 8, 66, 16, 1, k.a);
    R(x + 10, 18, 12, 46, '#f4ecd8'); speckle(x + 10, 18, 12, 46, '#e8dcc0', 6, 0.08);
    pic(x + 10, 24);
    cyl(x + 6, 72, 20, 3, k.w); R(x + 5, 72, 2, 3, INK); R(x + 25, 72, 2, 3, INK);
    P(x + 19, 59, '#e04848'); P(x + 20, 60, '#e04848');
  } })));
add('Japanese', [
  { id: 'tatami', name: 'Tatami mat', w: 1, h: 2, layer: 'rug', price: 200, high: 0.04, side: 'c', flat(w, h) {
    const T2 = '#c8c078'; R(0, 0, w, h, T2);
    for (let j = 0; j < h; j++) for (let i = 4; i < w - 4; i++) if (j % 2 === 0 && (i + j) % 4 < 2) P(i, j, sh(T2, -1)); else if ((i * 7 + j) % 11 === 0) P(i, j, sh(T2, 1));
    R(0, 0, 4, h, k.c); R(w - 4, 0, 4, h, k.c); for (let j = 2; j < h; j += 4) { P(1, j, k.a); P(w - 2, j, k.a); }
  } },
  { id: 'shoji', name: 'Shoji screen', w: 2, h: 1, price: 600, draw(x, b, vw) {
    floorShadow(x, b, vw);
    for (let p = 0; p < vw; p += 16) {
      const pw = Math.min(16, vw - p);
      R(x + p, b - 86, pw, 84, k.w); R(x + p + 2, b - 82, pw - 4, 66, '#fbf6e8');
      for (let j = b - 72; j < b - 16; j += 11) R(x + p + 2, j, pw - 4, 1, k.w);
      R(x + p + Math.floor(pw / 2), b - 82, 1, 66, k.w); wood(x + p + 2, b - 14, pw - 4, 10, sh(k.w, -1), 'y');
    }
    R(x, b - 86, vw, 2, sh(k.w, 1));
  } },
  { id: 'chochin', name: 'Paper lantern', w: 1, h: 1, layer: 'wall', price: 200, glow: ['#ffb070', '#fff0c0'], wall(x) {
    R(x + 15, 2, 2, 10, INK); R(x + 10, 12, 12, 4, INK);
    for (let j = 0; j < 40; j++) { const h = Math.round(Math.sqrt(1 - ((j - 20) / 21) ** 2) * 12); R(x + 16 - h, 16 + j, h * 2, 1, j % 5 === 0 ? sh(k.c, -1) : j < 10 ? sh(k.c, 1) : k.c); }
    R(x + 11, 22, 3, 22, sh(k.c, 2)); R(x + 13, 26, 6, 1, INK); R(x + 15, 26, 1, 14, INK); R(x + 12, 32, 8, 1, INK);
    R(x + 10, 56, 12, 4, INK); R(x + 15, 60, 2, 10, k.a); R(x + 14, 68, 4, 3, k.a);
  } },
  { id: 'torii', name: 'Torii gate', w: 2, h: 1, price: 1400, draw(x, b, vw) {
    floorShadow(x, b, vw);
    for (const i of [6, vw - 12]) { cyl(x + i, b - 80, 6, 80, k.c); R(x + i - 1, b - 6, 8, 6, INK); }
    for (let i = 0; i < vw; i++) { const up = Math.round(((i - vw / 2) / (vw / 2)) ** 4 * 4); R(x + i, b - 92 - up, 1, 5, INK); R(x + i, b - 87 - up, 1, 4, k.c); }
    panel(x + 2, b - 70, vw - 4, 5, k.c); panel(x + vw / 2 - 5, b - 82, 10, 12, INK); R(x + vw / 2 - 3, b - 80, 6, 8, k.a);
  } },
  { id: 'koipond', name: 'Koi pond', w: 2, h: 2, layer: 'rug', price: 900, high: 0.03, side: 'p', flat(w, h) {
    for (let a = 0; a < 22; a++) { const t = a / 22 * Math.PI * 2; ovalShade(w / 2 + Math.cos(t) * 28, h / 2 + Math.sin(t) * 27, 4, 3, hash(a, 7) < 0.6 ? STONE : '#7a8a6a'); }
    oval(w / 2, h / 2, 26, 25, '#2a6a7a'); oval(w / 2 - 3, h / 2 - 3, 20, 18, '#3a8a9a');
    for (const [cx, cy, a, c] of [[22, 24, 0.6, '#f08030'], [40, 36, 2.5, '#ffffff'], [30, 42, 4, '#e04848']]) {
      for (let n = 0; n < 9; n++) { const px = cx + Math.cos(a) * (n - 4), py = cy + Math.sin(a) * (n - 4); disc(px, py, n < 2 ? 1 : n > 6 ? 1 : 2, n % 3 === 1 && c === '#ffffff' ? '#f08030' : c); }
    }
    for (const [cx, cy] of [[44, 18], [16, 40]]) { disc(cx, cy, 5, '#4a9a3a'); R(cx, cy - 5, 1, 5, '#3a8a9a'); flower(cx + 1, cy + 1, '#f8b8d0'); }
  } },
  { id: 'zengarden', name: 'Zen garden', w: 2, h: 2, layer: 'rug', price: 600, high: 0.05, side: 'w', flat(w, h) {
    wood(0, 0, w, h, k.w); R(3, 3, w - 6, h - 6, '#e8e0d0');
    const rocks = [[20, 22, 6], [44, 40, 5]];
    for (let j = 3; j < h - 3; j++) for (let i = 3; i < w - 3; i++) {
      let d = Infinity; for (const [cx, cy] of rocks) d = Math.min(d, Math.hypot(i - cx, j - cy));
      const lineOn = d < 14 ? Math.round(d) % 3 === 0 : j % 3 === 0;
      if (lineOn) P(i, j, '#c8bca8');
    }
    for (const [cx, cy, r] of rocks) { ovalShade(cx, cy, r, r - 1, '#7a7a84'); P(cx - 2, cy + r - 2, '#4a9a3a'); }
  } },
  { id: 'bamboofence', name: 'Bamboo fence', w: 2, h: 1, price: 380, draw(x, b, vw) {
    floorShadow(x, b, vw);
    for (let i = 0; i + 5 <= vw; i += 5) { const h = 56 + (i % 3) * 2, c = (i / 5) % 2 ? '#a8b858' : '#98a848'; cyl(x + i, b - h, 5, h, c); for (let j = 12; j < h; j += 16) R(x + i, b - j, 5, 1, sh(c, -1)); oval(x + i + 2.5, b - h, 2, 1, sh(c, 1)); }
    for (const j of [18, 44]) { R(x, b - j, vw, 3, '#7a6a38'); for (let i = 4; i < vw; i += 10) { R(x + i, b - j - 1, 2, 5, k.c); } }
  } },
  { id: 'sakura', name: 'Cherry tree', w: 1, h: 1, price: 750, draw(x, b) {
    floorShadow(x, b, 32); panel(x + 6, b - 14, 20, 14, k.pot); R(x + 7, b - 14, 18, 2, sh(k.pot, 1));
    line(x + 16, b - 14, x + 14, b - 46, '#5a3a2a', 4); line(x + 15, b - 40, x + 6, b - 56, '#5a3a2a', 2); line(x + 15, b - 42, x + 25, b - 58, '#5a3a2a', 2);
    for (const [cx, cy, r] of [[8, -62, 8], [24, -64, 8], [16, -72, 10], [16, -56, 7]]) foliage(x + cx, b + cy, r, '#f8b0c8', cx + cy);
    for (let n = 0; n < 8; n++) P(x + 4 + hash(n, 2) * 24, b - 44 + hash(n, 3) * 28, '#f8c8d8');
  } },
  { id: 'luckycat', name: 'Lucky cat', w: 1, h: 1, price: 480, draw(x, b) {
    floorShadow(x, b, 32); panel(x + 4, b - 6, 24, 6, k.c);
    ovalShade(x + 16, b - 18, 11, 12, '#fbf6ee'); ovalShade(x + 16, b - 38, 10, 9, '#fbf6ee');
    for (const s of [-1, 1]) tri(x + 16 + s * 7, b - 50, 6, '#fbf6ee', 0.6); for (const s of [-1, 1]) P(x + 16 + s * 7, b - 46, '#f8a8b8');
    for (const s of [-1, 1]) { R(x + 16 + s * 4 - 1, b - 40, 3, 1, INK); } P(x + 16, b - 36, '#f88898'); R(x + 13, b - 34, 7, 1, INK);
    R(x + 7, b - 30, 18, 3, k.c); sphere(x + 16, b - 26, 2.5, GOLD);
    ovalShade(x + 26, b - 46, 4, 5, '#fbf6ee'); R(x + 23, b - 42, 5, 10, '#fbf6ee');
    ovalShade(x + 12, b - 16, 5, 6, GOLD); R(x + 10, b - 18, 4, 1, sh(GOLD, -2));
  } },
  { id: 'daruma', name: 'Daruma', w: 1, h: 1, price: 300, draw(x, b) {
    floorShadow(x + 2, b, 28);
    for (let j = 0; j < 30; j++) { const h = Math.round(Math.sqrt(1 - ((j - 17) / 18) ** 2) * 13); R(x + 16 - h, b - 32 + j, h * 2, 1, j < 4 ? sh(k.c, 1) : j > 26 ? sh(k.c, -1) : k.c); }
    oval(x + 16, b - 22, 7, 6, '#fbf6ee'); disc(x + 12, b - 23, 2, INK); disc(x + 20, b - 23, 2, '#fbf6ee'); ring(x + 20, b - 23, 2, INK);
    for (let i = 0; i < 4; i++) { P(x + 10 + i, b - 28 + Math.floor(i / 2), INK); P(x + 22 - i, b - 28 + Math.floor(i / 2), INK); }
    R(x + 14, b - 18, 5, 1, INK); for (const i of [7, 23]) R(x + i, b - 12, 3, 6, k.a); R(x + 12, b - 8, 9, 2, k.a);
  } },
  { id: 'taiko', name: 'Taiko drum', w: 1, h: 1, price: 680, draw(x, b) {
    floorShadow(x, b, 32); line(x + 6, b - 20, x + 3, b, k.w, 3); line(x + 26, b - 20, x + 29, b, k.w, 3); R(x + 4, b - 12, 24, 3, k.w);
    for (let j = 0; j < 30; j++) { const h = Math.round(13 + Math.sin(j / 29 * Math.PI) * 3); R(x + 16 - h, b - 54 + j, h * 2, 1, j < 3 || j > 26 ? '#f4ecd8' : sh(k.w, j < 8 ? 1 : j > 22 ? -1 : 0)); }
    for (let i = 0; i < 9; i++) { P(x + 4 + i * 3, b - 51, INK); P(x + 4 + i * 3, b - 28, INK); }
    disc(x + 16, b - 40, 5, k.c); for (let a = 0; a < 3; a++) disc(x + 16 + Math.cos(a * 2.1) * 2, b - 40 + Math.sin(a * 2.1) * 2, 1.5, k.a);
    for (const i of [6, 22]) { line(x + i, b - 62, x + i + 6, b - 70, k.w, 2); }
  } },
  { id: 'kimonostand', name: 'Kimono stand', w: 1, h: 1, price: 820, draw(x, b) {
    floorShadow(x, b, 32); for (const i of [2, 26]) { R(x + i, b - 4, 4, 4, k.w); R(x + i + 1, b - 80, 2, 76, k.w); } R(x, b - 82, 32, 3, k.w); R(x + 2, b - 8, 28, 2, k.w);
    for (let j = 0; j < 62; j++) { const h = j < 20 ? 15 : 10; R(x + 16 - h, b - 78 + j, h * 2, 1, k.c); }
    for (let n = 0; n < 10; n++) flower(x + 6 + hash(n, 1) * 20, b - 74 + hash(n, 2) * 56, n % 2 ? '#ffffff' : k.a);
    R(x + 6, b - 50, 20, 7, k.a); R(x + 6, b - 50, 20, 1, sh(k.a, 1)); R(x + 15, b - 78, 2, 24, sh(k.c, -1)); line(x + 12, b - 78, x + 16, b - 66, k.p, 2); line(x + 20, b - 78, x + 16, b - 66, k.p, 2);
  } },
  { id: 'zabuton', name: 'Floor cushion', w: 1, h: 1, price: 140, high: 0.12, side: 'c', seat: 'cushion', flat(w, h) {
    cushion(2, 2, w - 4, h - 4, k.c, 3); R(5, 5, w - 10, 1, sh(k.c, 1));
    for (const [i, j] of [[w / 2, h / 2], [8, 8], [w - 8, 8], [8, h - 8], [w - 8, h - 8]]) { P(i, j, k.a); P(i - 1, j - 1, sh(k.c, -1)); }
  } },
  { id: 'chabudai', name: 'Low table', w: 2, h: 2, price: 500, high: 0.3, side: 'w', flat(w, h) {
    disc(w / 2, h / 2, w / 2 - 2, sh(k.w, -1)); disc(w / 2, h / 2, w / 2 - 4, k.w); for (let j = 8; j < h - 8; j += 4) R(10, j, w - 20, 1, sh(k.w, j % 8 ? -1 : 1));
    disc(w / 2, h / 2, 9, '#5a5a68'); disc(w / 2 - 1, h / 2 - 1, 7, '#7a7a88'); R(w / 2 + 6, h / 2 - 1, 4, 2, '#5a5a68');
    for (const [i, j] of [[18, 20], [46, 22], [20, 44], [44, 44]]) { disc(i, j, 4, '#f4ecd8'); disc(i, j, 2.5, '#88b858'); }
  } },
  { id: 'teaset', name: 'Tea set', w: 1, h: 1, price: 320, draw(x, b) {
    floorShadow(x, b, 32); for (const i of [4, 24]) R(x + i, b - 12, 4, 12, k.w); wood(x + 2, b - 16, 28, 5, k.w); R(x + 2, b - 16, 28, 1, k.a);
    ovalShade(x + 12, b - 23, 7, 6, k.c); R(x + 9, b - 30, 6, 2, sh(k.c, -1)); sphere(x + 12, b - 31, 1.5, k.a); line(x + 19, b - 24, x + 23, b - 27, k.c, 2); line(x + 5, b - 26, x + 3, b - 22, k.c, 2);
    for (const i of [22, 27]) { R(x + i - 2, b - 21, 5, 5, '#f4ecd8'); R(x + i - 1, b - 21, 3, 1, '#88b858'); }
  } },
  { id: 'noren', name: 'Noren curtain', w: 2, h: 1, layer: 'wall', price: 220, wall(x) {
    cyl(x + 2, 12, 60, 3, k.w);
    for (let p = 0; p < 3; p++) { const px = x + 4 + p * 19; R(px, 15, 18, 46, k.c); R(px, 15, 18, 2, sh(k.c, -1)); R(px + 17, 15, 1, 46, sh(k.c, -1)); for (let i = 0; i < 18; i += 3) P(px + i, 60, sh(k.c, -1)); }
    ring(x + 32, 34, 9, k.p, 2); for (let a = 0; a < 3; a++) disc(x + 32 + Math.cos(a * 2.1) * 4, 34 + Math.sin(a * 2.1) * 4, 2, k.p);
  } },
  { id: 'wallfan', name: 'Folding fan', w: 1, h: 1, layer: 'wall', price: 180, wall(x) {
    for (let j = 0; j < 24; j++) for (let i = -15; i <= 15; i++) { const d = Math.hypot(i, j); if (d > 15 || d < 4) continue; const rib = Math.round((Math.atan2(j, i) / Math.PI) * 12) % 2; P(x + 16 + i, 50 - j, rib ? k.c : sh(k.c, 1)); }
    for (let a = 0; a <= 12; a++) { const t = a / 12 * Math.PI; line(x + 16, 50, x + 16 + Math.cos(t) * 15, 50 - Math.sin(t) * 15, a % 2 ? sh(k.c, -1) : k.w); }
    disc(x + 20, 40, 3, k.a); R(x + 15, 49, 3, 3, k.m); R(x + 16, 52, 1, 8, k.a);
  } },
  { id: 'furin', name: 'Wind chime', w: 1, h: 1, layer: 'wall', price: 140, wall(x) {
    R(x + 15, 4, 2, 14, '#d8d8d8');
    for (let j = 0; j < 12; j++) { const h = Math.round(Math.sqrt(j / 11) * 8); R(x + 16 - h, 18 + j, h * 2, 1, 'rgba(200,232,248,0.9)'); }
    P(x + 12, 22, '#ffffff'); R(x + 13, 26, 3, 2, '#f08030'); P(x + 16, 27, '#f08030'); R(x + 15, 30, 2, 6, '#d8d8d8');
    R(x + 11, 36, 10, 24, k.c); R(x + 11, 36, 10, 1, sh(k.c, 1)); for (let j = 40; j < 58; j += 4) R(x + 13, j, 6, 1, INK);
  } },
  { id: 'kadomatsu', name: 'Kadomatsu', w: 1, h: 1, price: 360, draw(x, b) {
    floorShadow(x, b, 32);
    for (const [i, h] of [[11, 62], [5, 50], [18, 46]]) { cyl(x + i, b - h, 7, h - 10, '#88b048'); for (let n = 0; n < 7; n++) P(x + i + n, b - h + Math.round(n * 0.9), sh('#88b048', 2)); R(x + i, b - h + 2, 7, 1, '#e8f0c8'); }
    for (const [i, j] of [[3, -30], [25, -30], [14, -32]]) foliage(x + i + 2, b + j, 5, '#3a7a3a', i);
    panel(x + 3, b - 20, 26, 20, STRAW); for (const j of [-16, -8]) { R(x + 3, b + j, 26, 2, k.c); } R(x + 14, b - 20, 4, 20, sh(STRAW, -1));
  } },
]);

/* ---------- toys ---------- */
/** A low cube shelf of toys: two rows; returns their floors. */
function toyShelf(x, b) {
  floorShadow(x, b, 32); wood(x + 1, b - 52, 30, 52, k.w);
  for (const f of [b - 26, b - 4]) R(x + 4, f - 20, 24, 20, sh(k.w, -2));
  wood(x + 1, b - 27, 30, 3, sh(k.w, 1)); wood(x, b - 54, 32, 3, sh(k.w, 1));
  return [b - 27, b - 4];
}
const TOYS = {
  block: ['Block', (x, f, n) => { for (let i = 0; i < 3; i++) { const c = RAINBOW[(i + n * 3) % 7]; panel(x + 5 + i * 8, f - 7, 7, 7, c); R(x + 7 + i * 8, f - 5, 3, 3, sh(c, 2)); } panel(x + 9, f - 14, 7, 7, RAINBOW[n + 4]); }],
  car: ['Car', (x, f, n) => { for (let i = 0; i < 2; i++) { const c = i ? k.c : RAINBOW[n * 4]; panel(x + 5 + i * 12, f - 8, 11, 5, c); panel(x + 7 + i * 12, f - 11, 6, 3, sh(c, 1)); R(x + 8 + i * 12, f - 10, 4, 1, SKYB); disc(x + 7 + i * 12, f - 2, 1.5, INK); disc(x + 14 + i * 12, f - 2, 1.5, INK); } }],
  robot: ['Robot', (x, f, n) => { for (let i = 0; i < 2; i++) { const c = i ? k.m : k.c, cx = x + 9 + i * 12; panel(cx - 3, f - 10, 7, 10, c); panel(cx - 2, f - 16, 5, 5, c); P(cx - 1, f - 14, '#68e8f8'); P(cx + 1, f - 14, '#68e8f8'); R(cx, f - 18, 1, 2, c); P(cx, f - 19, '#e04848'); } }],
  ball: ['Ball', (x, f, n) => { for (let i = 0; i < 3; i++) sphere(x + 9 + i * 7, f - 4 - (i % 2), 3 + (i % 2), RAINBOW[(i * 2 + n) % 7]); }],
  boat: ['Boat', (x, f, n) => { for (let i = 0; i < 2; i++) { const cx = x + 10 + i * 12; for (let j = 0; j < 4; j++) R(cx - 5 + j, f - 4 + j, 10 - j * 2, 1, i ? k.c : '#e04848'); R(cx, f - 15, 1, 11, k.w); tri(cx + 3, f - 14, 8, k.p, 0.4); } }],
  top: ['Spinning top', (x, f, n) => { for (let i = 0; i < 3; i++) { const cx = x + 9 + i * 7, c = RAINBOW[(i * 3 + n) % 7]; for (let j = 0; j < 8; j++) { const h = j < 4 ? j + 1 : 8 - j; R(cx - h, f - 9 + j, h * 2 + 1, 1, j === 3 ? sh(c, 1) : c); } R(cx, f - 12, 1, 3, k.w); } }],
};
add('Toys', Object.entries(TOYS).map(([id, [name, row]]) => ({ id: `${id}toyshelf`, name: `${name} shelf`, w: 1, h: 1, price: 380,
  draw(x, b) { toyShelf(x, b).forEach((f, n) => row(x, f, n)); } })));
add('Toys', [
  { id: 'rockinghorse', name: 'Rocking horse', w: 1, h: 1, price: 520, draw(x, b) {
    floorShadow(x, b, 32);
    for (let i = 0; i < 32; i++) R(x + i, b - 3 - Math.round(((i - 16) / 16) ** 2 * 6), 1, 3, k.w);
    for (const i of [7, 23]) line(x + i, b - 8, x + i + (i < 16 ? 2 : -2), b - 22, k.w, 2);
    stamp(HORSE, x + 3, b - 46, { '#': k.c, k: INK, '+': k.w, m: k.a }, 2);
    R(x + 10, b - 38, 9, 3, k.a);
  } },
  { id: 'trainset', name: 'Train set', w: 2, h: 2, layer: 'rug', price: 700, high: 0.04, side: 'w', flat(w, h) {
    R(0, 0, w, h, '#78b860'); speckle(0, 0, w, h, '#68a850', 3, 0.15);
    for (let a = 0; a < 60; a++) { const t = a / 60 * Math.PI * 2; R(w / 2 + Math.cos(t) * 22 - 2, h / 2 + Math.sin(t) * 20 - 2, 4, 4, k.w); }
    for (const r of [19, 25]) for (let a = 0; a < 160; a++) { const t = a / 160 * Math.PI * 2; P(w / 2 + Math.cos(t) * r * (r === 19 ? 1 : 0.98), h / 2 + Math.sin(t) * (r - 2), k.m); }
    for (let n = 0; n < 3; n++) { const t = -0.4 - n * 0.35, cx = w / 2 + Math.cos(t) * 22, cy = h / 2 + Math.sin(t) * 20; panel(cx - 3, cy - 3, 7, 7, n ? RAINBOW[n * 2] : k.c); }
    foliage(w / 2, h / 2, 6, '#3a8a2a', 1); disc(10, 10, 3, '#4a98d8');
  } },
  { id: 'jackbox', name: 'Jack-in-the-box', w: 1, h: 1, price: 280, draw(x, b) {
    floorShadow(x + 3, b, 26); panel(x + 5, b - 20, 22, 20, k.c, 2); stamp(MOTIFS.star, x + 7, b - 18, { '#': k.a, '+': sh(k.a, 1) }, 2);
    R(x + 27, b - 12, 4, 2, k.m); R(x + 29, b - 16, 2, 6, k.m); R(x + 4, b - 22, 24, 3, sh(k.c, -1));
    for (let j = 0; j < 14; j++) R(x + 13 + (j % 4 < 2 ? 0 : 3), b - 22 - j, 4, 1, k.m);
    disc(x + 16, b - 42, 7, '#fbe8d8'); disc(x + 16, b - 41, 2, '#e04848'); P(x + 13, b - 44, INK); P(x + 19, b - 44, INK); R(x + 13, b - 38, 7, 1, '#e04848');
    tri(x + 16, b - 58, 10, k.a, 0.7); sphere(x + 16, b - 59, 2, k.p); for (const s of [-1, 1]) disc(x + 16 + s * 7, b - 44, 2.5, '#f08030');
  } },
  { id: 'dollhouse', name: 'Dollhouse', w: 2, h: 1, price: 1100, draw(x, b, vw, dir) {
    if (dir % 2) return sideBox(x, b, vw, 50);
    floorShadow(x, b, vw); wood(x + 4, b - 54, vw - 8, 54, k.w);
    for (let j = 0; j < 22; j++) { const h = Math.round(j * (vw / 2) / 22); R(x + vw / 2 - h, b - 76 + j, h * 2, 1, j < 2 ? sh(k.c, 1) : k.c); }
    for (let j = 0; j < 22; j += 4) R(x + vw / 2 - Math.round(j * (vw / 2) / 22), b - 76 + j, Math.round(j * vw / 22), 1, sh(k.c, -1));
    for (const [rx, ry, rw] of [[8, -50, 22], [34, -50, 22], [8, -24, 22], [34, -24, 22]]) { R(x + rx, b + ry, rw, 20, ['#f8e0c8', '#d8e8f8', '#f8d8e8', '#e8f0d0'][(rx + ry) & 3]); R(x + rx, b + ry + 18, rw, 2, sh(k.w, 1)); }
    panel(x + 12, b - 37, 10, 6, k.c); panel(x + 38, b - 40, 8, 10, k.a); R(x + 48, b - 34, 4, 4, '#58b848');
    panel(x + 12, b - 11, 6, 7, k.a); cushion(x + 36, b - 12, 16, 6, k.c, 2); ovalShade(x + 26, b - 64, 3, 3, SKYB);
  } },
  { id: 'teepee', name: 'Play tent', w: 1, h: 1, price: 450, draw(x, b) {
    floorShadow(x, b, 32);
    for (let j = 0; j < 72; j++) { const h = Math.round(j * 0.2); for (let i = -h; i <= h; i++) P(x + 16 + i, b - 72 + j, ((i + 40) >> 2) % 2 ? k.p : k.c); }
    for (let j = 0; j < 30; j++) { const h = Math.round(j * 0.2); R(x + 16 - h, b - 30 + j, h, 1, '#3a2a3a'); }
    for (const s of [-1, 1]) line(x + 16, b - 72, x + 16 + s * 6, b - 86, k.w, 1); R(x + 10, b - 86, 1, 1, k.w);
    R(x + 22, b - 86, 5, 4, k.a); R(x + 22, b - 88, 1, 6, k.w);
  } },
  { id: 'ballpit', name: 'Ball pit', w: 2, h: 2, price: 800, high: 0.3, side: 'c', flat(w, h) {
    cushion(0, 0, w, h, k.c, 6); R(6, 6, w - 12, h - 12, sh(k.c, -2));
    for (let n = 0; n < 70; n++) sphere(9 + hash(n, 1) * (w - 18), 9 + hash(n, 2) * (h - 18), 3, [k.a, '#e04848', '#f8d030', '#4a98d8', '#58b848'][n % 5]);
  } },
  { id: 'blocktower', name: 'Block tower', w: 1, h: 1, price: 220, draw(x, b) {
    floorShadow(x + 2, b, 28);
    const L = ['A', 'B', 'F', 'I', 'L', 'R'];
    for (let n = 0; n < 6; n++) { const c = n % 2 ? k.c : RAINBOW[n], sz = 14 - Math.floor(n / 2), cx = x + 16 + Math.round(Math.sin(n * 1.7) * 2); panel(cx - sz / 2, b - 14 * (n + 1) + Math.floor(n / 2) * n * 0.5 - 0, sz, 13, c, 2); bits(FONT[L[n]], cx - 3, b - 14 * (n + 1) + 4, { '#': '#ffffff' }, 2); }
  } },
  { id: 'bigtop', name: 'Giant spinning top', w: 1, h: 1, price: 300, draw(x, b) {
    floorShadow(x + 4, b, 24); R(x + 15, b - 4, 2, 4, k.m);
    for (let j = 0; j < 30; j++) { const h = j < 12 ? Math.round(j * 1.1) : Math.round(13 - (j - 12) * 0.7); R(x + 16 - h, b - 34 + j, h * 2 + 1, 1, ((j / 4) | 0) % 2 ? k.a : k.c); }
    R(x + 15, b - 44, 2, 10, k.w); sphere(x + 16, b - 45, 2, k.w);
    for (const [i, j] of [[2, -26], [28, -22], [0, -18]]) R(x + i, b + j, 4, 1, '#ffffff');
  } },
  { id: 'kite', name: 'Kite', w: 1, h: 1, layer: 'wall', price: 150, wall(x) {
    for (let j = 0; j < 36; j++) { const h = j < 12 ? j : Math.round((36 - j) / 2); for (let i = -h; i <= h; i++) P(x + 16 + i, 8 + j, (i < 0) === (j < 12) ? k.c : k.a); }
    line(x + 16, 8, x + 16, 44, k.w); line(x + 4, 20, x + 28, 20, k.w);
    for (let j = 0; j < 30; j++) P(x + 16 + Math.round(Math.sin(j / 4) * 3), 44 + j, '#d8d8d8');
    for (const j of [8, 16, 24]) { const cx = x + 16 + Math.round(Math.sin(j / 4) * 3); R(cx - 3, 44 + j, 2, 2, RAINBOW[j / 8]); R(cx + 2, 44 + j, 2, 2, RAINBOW[j / 8]); }
  } },
  { id: 'toyrobot', name: 'Wind-up robot', w: 1, h: 1, price: 420, draw(x, b) {
    floorShadow(x, b, 32); for (const i of [9, 18]) panel(x + i, b - 12, 6, 12, sh(k.m, -1));
    panel(x + 6, b - 40, 20, 28, k.c, 2); for (const [i, j] of [[8, -38], [23, -38], [8, -15], [23, -15]]) P(x + i, b + j, k.a);
    inset(x + 10, b - 34, 12, 8, '#1a2a2a'); for (let n = 0; n < 3; n++) disc(x + 12 + n * 4, b - 30, 1, RAINBOW[n * 2 + 1]);
    for (const i of [1, 26]) { panel(x + i, b - 38, 5, 14, k.m); R(x + i, b - 24, 5, 3, k.a); }
    for (let j = 0; j < 12; j++) { const h = Math.round(Math.sqrt(1 - ((12 - j) / 12) ** 2) * 9); R(x + 16 - h, b - 52 + j, h * 2, 1, k.m); }
    R(x + 11, b - 48, 4, 3, '#f8d030'); R(x + 18, b - 48, 4, 3, '#f8d030'); R(x + 15, b - 58, 2, 6, k.a); sphere(x + 16, b - 59, 2, '#e04848');
    R(x + 26, b - 32, 4, 2, k.a); R(x + 28, b - 36, 2, 10, k.a);
  } },
  { id: 'spacehopper', name: 'Space hopper', w: 1, h: 1, price: 200, draw(x, b) {
    floorShadow(x, b, 32); sphere(x + 16, b - 14, 13, k.c);
    for (const s of [-1, 1]) { R(x + 16 + s * 5 - 1, b - 36, 3, 10, k.c); disc(x + 16 + s * 5, b - 37, 3, k.c); }
    for (const s of [-1, 1]) { disc(x + 16 + s * 4, b - 18, 2, '#ffffff'); P(x + 16 + s * 4, b - 18, INK); } R(x + 11, b - 11, 10, 1, INK); P(x + 10, b - 12, INK); P(x + 21, b - 12, INK);
  } },
  { id: 'carbed', name: 'Race car bed', w: 2, h: 3, price: 1200, high: 0.5, side: 'c', seat: 'bed', flat(w, h) {
    cushion(0, 4, w, h - 8, k.c, 8); R(w / 2 - 4, 4, 8, h - 8, k.p);
    for (const [i, j] of [[0, 10], [w - 6, 10], [0, h - 22], [w - 6, h - 22]]) { R(i, j, 6, 12, INK); R(i + 1, j + 2, 4, 8, '#5a5a68'); }
    R(4, h - 6, w - 8, 6, sh(k.c, -1)); R(6, h - 4, w - 12, 2, k.a);
    R(8, 14, w - 16, h - 30, k.p); cushion(12, 16, w - 24, 10, '#ffffff', 3); R(8, 30, w - 16, h - 46, sh(k.c, 1)); R(w / 2 - 3, 30, 6, h - 46, k.p);
    panel(8, 2, w - 16, 6, SKYB); bits(['###', '#.#', '###'], w / 2 - 3, h - 18, { '#': INK }, 2);
  } },
  { id: 'puzzlemat', name: 'Puzzle mat', w: 2, h: 2, layer: 'rug', price: 200, high: 0.05, side: 'c', flat(w, h) {
    const cs = [k.c, k.a, '#58b848', '#4a98d8'];
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      let ti = (i >> 5) & 1, tj = (j >> 5) & 1; const li = i & 31, lj = j & 31;
      if (li < 4 && Math.abs(lj - 16) < 4 && ti) ti = 0; if (lj < 4 && Math.abs(li - 16) < 4 && tj) tj = 0;
      P(i, j, cs[ti + tj * 2]);
    }
    for (let i = 0; i < w; i++) { P(i, 31, 'rgba(0,0,0,0.2)'); P(31, i, 'rgba(0,0,0,0.2)'); }
    speckle(0, 0, w, h, 'rgba(255,255,255,0.2)', 5, 0.04);
  } },
  { id: 'marblerun', name: 'Marble run', w: 1, h: 1, price: 480, draw(x, b) {
    floorShadow(x, b, 32); panel(x + 2, b - 6, 28, 6, k.w); R(x + 3, b - 88, 3, 82, k.w); R(x + 26, b - 88, 3, 82, k.w);
    for (let n = 0; n < 5; n++) { const y = b - 80 + n * 15, l = n % 2 === 0; line(x + (l ? 5 : 26), y, x + (l ? 26 : 5), y + 10, RAINBOW[n], 2); }
    for (const [i, j, c] of [[10, -78, k.c], [22, -60, '#4a98d8'], [12, -34, '#f8d030']]) sphere(x + i, b + j, 2, c);
    R(x + 10, b - 10, 12, 3, sh(k.w, -1)); sphere(x + 14, b - 12, 2, '#58b848'); sphere(x + 18, b - 12, 2, k.a);
  } },
  { id: 'toytrain', name: 'Toy train', w: 2, h: 1, price: 620, draw(x, b, vw, dir) {
    floorShadow(x, b, vw);
    if (dir % 2) { panel(x + 6, b - 38, 20, 32, k.c); disc(x + 16, b - 26, 5, '#f8f0c0'); R(x + 13, b - 48, 6, 10, INK); for (const i of [8, 24]) disc(x + i, b - 5, 4, INK); return; }
    panel(x + 4, b - 30, 26, 22, k.c); panel(x + 18, b - 44, 14, 16, k.c); R(x + 20, b - 42, 10, 8, SKYB); R(x + 16, b - 46, 18, 3, k.a);
    cyl(x + 6, b - 40, 6, 10, INK); R(x + 5, b - 42, 8, 2, INK); disc(x + 3, b - 18, 3, '#f8f0c0');
    panel(x + 36, b - 26, vw - 40, 18, k.a); for (let n = 0; n < 3; n++) panel(x + 38 + n * 7, b - 32, 6, 6, RAINBOW[n * 2]);
    R(x + 30, b - 14, 6, 2, k.m);
    for (const i of [10, 24, 42, vw - 10]) { disc(x + i, b - 6, 5, sh(k.w, -1)); disc(x + i, b - 6, 3, k.w); P(x + i, b - 6, k.m); }
  } },
  { id: 'stackrings', name: 'Stacking rings', w: 1, h: 1, price: 160, draw(x, b) {
    floorShadow(x + 2, b, 28); panel(x + 4, b - 6, 24, 6, k.w); R(x + 15, b - 52, 3, 46, k.w);
    for (let n = 0; n < 6; n++) { const r = 12 - n * 1.6, y = b - 10 - n * 7; ovalShade(x + 16, y, r, 4, n === 0 ? k.c : RAINBOW[n]); }
    sphere(x + 16, b - 56, 4, k.c);
  } },
  { id: 'jigsaw', name: 'Jigsaw picture', w: 2, h: 1, layer: 'wall', price: 240, wall(x) {
    shadowWall(x + 4, 16, 56, 40); wood(x + 4, 16, 56, 40, k.w);
    for (let j = 0; j < 34; j++) R(x + 7, 19 + j, 50, 1, j < 16 ? '#a8d8f8' : '#78b860');
    disc(x + 46, 26, 5, '#f8e070'); for (const [i, h] of [[14, 10], [26, 14]]) tri(x + i, 35 - h, h, '#6a7a9a', 1);
    for (let i = 7; i < 57; i += 10) for (let j = 19; j < 53; j++) P(x + i + (Math.abs(j - 28) < 2 || Math.abs(j - 45) < 2 ? 1 : 0), j, 'rgba(0,0,0,0.25)');
    for (const j of [30, 42]) for (let i = 7; i < 57; i++) P(x + i, j + (i % 10 > 3 && i % 10 < 6 ? 1 : 0), 'rgba(0,0,0,0.25)');
    R(x + 37, 31, 10, 11, sh(k.w, -2));
  } },
  { id: 'puzzlecube', name: 'Puzzle cube', w: 1, h: 1, price: 260, draw(x, b) {
    floorShadow(x + 2, b, 28); const F = ['#e04848', '#f8d030', '#58b848', '#4a98d8', '#f4f4f0', '#f08030'];
    for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) { R(x + 4 + i * 7, b - 22 + j * 7, 7, 7, INK); panel(x + 5 + i * 7, b - 21 + j * 7, 5, 5, F[(i + j * 2) % 6]); }
    for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) { const sx = x + 4 + i * 7 + (2 - j) * 2, sy = b - 30 + j * 3 - 2; R(sx + 2, sy, 7, 3, INK); R(sx + 3, sy, 5, 2, F[(i * 3 + j + 2) % 6]); }
    for (let j = 0; j < 21; j++) for (let i = 0; i < 6; i++) P(x + 25 + i, b - 22 + j - Math.floor(i * 0.6), j % 7 ? sh(F[(j / 7 | 0) + 2], -1) : INK);
  } },
  { id: 'toysoldier', name: 'Toy soldier', w: 1, h: 1, price: 440, draw(x, b) {
    floorShadow(x + 4, b, 24); panel(x + 8, b - 5, 16, 5, '#58b848');
    for (const i of [11, 17]) { R(x + i, b - 28, 5, 23, '#f4f4f0'); R(x + i, b - 8, 5, 3, INK); }
    panel(x + 9, b - 50, 14, 22, k.c); R(x + 9, b - 30, 14, 3, INK); R(x + 15, b - 30, 2, 3, GOLD); for (let j = 0; j < 4; j++) P(x + 16, b - 46 + j * 4, GOLD);
    for (const s of [6, 22]) { R(x + s, b - 48, 4, 18, k.c); R(x + s, b - 50, 4, 3, GOLD); }
    ovalShade(x + 16, b - 56, 6, 6, '#fbe0c8'); P(x + 14, b - 57, INK); P(x + 18, b - 57, INK); disc(x + 13, b - 54, 1, '#f8a8a8'); disc(x + 19, b - 54, 1, '#f8a8a8');
    cyl(x + 10, b - 76, 12, 16, INK); R(x + 10, b - 62, 12, 2, GOLD); R(x + 15, b - 72, 2, 4, GOLD);
  } },
]);

/* ---------- types: a room per Pokémon type ---------- */
const GLYPHS = {
  fire: ['Fire', '#f08030', MOTIFS.flame], water: ['Water', '#4a98d8', MOTIFS.drop], grass: ['Grass', '#58b848', MOTIFS.sprout],
  electric: ['Electric', '#f8d030', MOTIFS.bolt],
  psychic: ['Psychic', '#f85888', ['.........', '..#####..', '.##...##.', '##..k..##', '#..kkk..#', '##..k..##', '.##...##.', '..#####..']],
  ice: ['Ice', '#78c8d8', ['....#....', '.#..#..#.', '..#.#.#..', '...###...', '#########', '...###...', '..#.#.#..', '.#..#..#.', '....#....']],
  rock: ['Rock', '#b8a038', ['...###...', '..#####..', '.###k###.', '.##k####.', '########.', '#####k###', '###k#####', '.#######.']],
  ghost: ['Ghost', '#705898', ['..#####..', '.#######.', '##k###k##', '##k###k##', '#########', '#########', '#########', '#.#.#.#.#']],
  dragon: ['Dragon', '#7038f8', ['#.......#', '##.....##', '.##...##.', '.###.###.', '..#####..', '..##k##..', '...###...', '....#....']],
};
add('Types', Object.entries(GLYPHS).map(([id, [name, c, rows]]) => ({ id: `${id}shrine`, name: `${name} shrine`, w: 1, h: 1, price: 900, glow: [c],
  draw(x, b) {
    floorShadow(x, b, 32); panel(x + 2, b - 8, 28, 8, STONE); panel(x + 6, b - 34, 20, 26, STONE); panel(x + 4, b - 38, 24, 5, sh(STONE, 1));
    R(x + 6, b - 20, 20, 2, k.a); speckle(x + 6, b - 34, 20, 26, sh(STONE, -1), 3, 0.06);
    disc(x + 16, b - 60, 14, sh(c, -1)); disc(x + 16, b - 60, 12, c); ring(x + 16, b - 60, 13, k.a);
    stamp(rows, x + 7, b - 69, { '#': '#ffffff', '+': '#ffffff', o: '#ffffff', k: sh(c, -2) }, 2);
    for (const [i, j] of [[2, -76], [30, -70], [4, -46]]) P(x + i, b + j, sh(c, 2));
  } })));
add('Types', [
  { id: 'brazier', name: 'Brazier', w: 1, h: 1, price: 450, glow: ['#ffb060', '#fff0c0'], draw(x, b) {
    floorShadow(x + 2, b, 28); for (const i of [-10, 0, 10]) line(x + 16, b - 26, x + 16 + i, b, k.m, 2);
    for (let j = 0; j < 10; j++) { const h = 13 - Math.round(j * j / 12); R(x + 16 - h, b - 34 + j, h * 2, 1, j < 2 ? sh(k.m, 1) : k.m); }
    for (let n = 0; n < 4; n++) R(x + 6 + n * 6, b - 32, 4, 2, sh(k.m, -2));
    tri(x + 16, b - 66, 32, '#e04828', 0.4); tri(x + 11, b - 54, 20, '#f08030', 0.35); tri(x + 21, b - 56, 22, '#f08030', 0.35); tri(x + 16, b - 50, 16, '#f8d030', 0.3); tri(x + 16, b - 44, 9, '#fff4c0', 0.25);
    for (const [i, j] of [[6, -72], [26, -76], [14, -84]]) P(x + i, b + j, '#f8d030');
  } },
  { id: 'magmafloor', name: 'Magma floor', w: 2, h: 2, layer: 'rug', price: 380, high: 0.03, side: 'm', flat(w, h) {
    R(0, 0, w, h, '#3a2a2a');
    for (let n = 0; n < 9; n++) { const cx = 6 + hash(n, 1) * (w - 12), cy = 6 + hash(n, 2) * (h - 12); ovalShade(cx, cy, 6 + hash(n, 3) * 5, 5 + hash(n, 4) * 4, '#4a3a3a'); }
    for (let s = 0; s < 4; s++) { let px = hash(s, 7) * w, py = 0; while (py < h) { R(px, py, 2, 2, '#f08030'); P(px, py, '#f8d030'); px += Math.round((hash(px, py, s) - 0.5) * 4); py += 2; } }
    for (let i = 0; i < w; i++) if (i % 5 === 0) P(i, 0, k.m);
  } },
  { id: 'generator', name: 'Generator', w: 1, h: 1, price: 680, glow: ['#f8e070'], draw(x, b) {
    floorShadow(x, b, 32); panel(x + 2, b - 40, 28, 40, '#f8d030', 2);
    for (let j = b - 40; j < b - 34; j++) for (let i = 2; i < 30; i++) P(x + i, j, ((i + j) >> 2) % 2 ? '#f8d030' : INK);
    inset(x + 6, b - 30, 20, 12, k.m); stamp(MOTIFS.bolt, x + 8, b - 30, { '#': '#f8e070' }, 1); for (let n = 0; n < 4; n++) R(x + 18 + n * 2, b - 28, 1, 8, sh(k.m, -2));
    disc(x + 10, b - 10, 4, '#f4f4f0'); line(x + 10, b - 10, x + 12, b - 13, '#e04848'); for (const i of [20, 25]) disc(x + i, b - 10, 2, k.c);
    for (const i of [6, 22]) { cyl(x + i, b - 52, 5, 12, '#c87838'); sphere(x + i + 2, b - 53, 3, k.m); }
    line(x + 8, b - 58, x + 16, b - 64, '#f8f0a0'); line(x + 16, b - 64, x + 24, b - 58, '#f8f0a0');
  } },
  { id: 'plasmaglobe', name: 'Plasma globe', w: 1, h: 1, price: 520, glow: ['#e0a0ff'], draw(x, b) {
    floorShadow(x + 4, b, 24); panel(x + 8, b - 12, 16, 12, k.m); R(x + 12, b - 8, 8, 2, sh(k.m, -2));
    disc(x + 16, b - 28, 13, '#2a1a3a'); disc(x + 16, b - 28, 12, '#3a2050');
    for (let a = 0; a < 7; a++) { const t = a / 7 * Math.PI * 2; let px = x + 16, py = b - 28; for (let s = 1; s <= 10; s++) { const nx = x + 16 + Math.cos(t + Math.sin(s + a) * 0.3) * s * 1.1, ny = b - 28 + Math.sin(t + Math.sin(s + a) * 0.3) * s * 1.1; line(px, py, nx, ny, s < 5 ? '#f0c8ff' : '#c878f0'); px = nx; py = ny; } }
    disc(x + 16, b - 28, 3, '#ffffff'); R(x + 8, b - 36, 3, 2, 'rgba(255,255,255,0.6)');
  } },
  { id: 'vinewall', name: 'Vine wall', w: 2, h: 1, layer: 'wall', price: 260, wall(x) {
    for (let s = 0; s < 5; s++) { let px = 4 + s * 13; for (let j = 4; j < 76; j++) { px += Math.round(Math.sin(j / 6 + s) * 0.6); P(x + px, j, '#3a6a2a'); if (j % 6 === s % 6) leaf(x + px + (j % 12 < 6 ? 3 : -3), j, 3, 2, k.leaf, j % 12 < 6 ? 0.5 : -0.5); } }
    for (let n = 0; n < 9; n++) flower(x + 4 + hash(n, 1) * 56, 10 + hash(n, 2) * 60, [k.c, '#f8f0a0', '#ffffff'][n % 3]);
  } },
  { id: 'iceshards', name: 'Ice crystals', w: 1, h: 1, price: 420, glow: ['#d8f4ff'], draw(x, b) {
    floorShadow(x, b, 32); ovalShade(x + 16, b - 3, 14, 3, '#eef6ff');
    for (const [i, h, w, tilt] of [[8, 34, 5, -0.15], [16, 58, 7, 0], [24, 40, 5, 0.18], [12, 24, 4, -0.3], [21, 22, 4, 0.3]]) {
      for (let j = 0; j < h; j++) { const half = j < 8 ? Math.round(j / 8 * w) : w; const cx = x + i + Math.round(tilt * (h - j)); R(cx - half, b - h - 2 + j, half, 1, ICE); R(cx, b - h - 2 + j, half, 1, sh(ICE, -1)); }
      P(x + i - 1 + Math.round(tilt * h), b - h + 4, '#ffffff');
    }
  } },
  { id: 'boulder', name: 'Boulder', w: 1, h: 1, price: 200, draw(x, b) {
    floorShadow(x, b, 32);
    for (let j = 0; j < 30; j++) { const h = Math.round(Math.sqrt(1 - ((j - 18) / 19) ** 2) * 15); R(x + 16 - h, b - 32 + j, h * 2, 1, j < 6 ? sh(STONE, 1) : j > 24 ? sh(STONE, -1) : STONE); }
    speckle(x + 2, b - 30, 28, 28, sh(STONE, -1), 9, 0.08); line(x + 10, b - 24, x + 14, b - 14, sh(STONE, -2)); line(x + 14, b - 14, x + 12, b - 6, sh(STONE, -2));
    for (let n = 0; n < 10; n++) P(x + 8 + n * 1.5, b - 31 + (n % 3), k.leaf); oval(x + 12, b - 31, 6, 2, k.leaf);
  } },
  { id: 'geode', name: 'Geode', w: 1, h: 1, price: 560, draw(x, b) {
    floorShadow(x + 2, b, 28); panel(x + 8, b - 8, 16, 8, k.w); R(x + 14, b - 14, 4, 6, k.m);
    disc(x + 16, b - 34, 14, '#7a6a68'); disc(x + 16, b - 34, 12, '#a89890'); disc(x + 16, b - 34, 10, sh(k.c, -2));
    for (let n = 0; n < 22; n++) { const a = n / 22 * Math.PI * 2, r = 4 + (n % 3) * 2; tri(x + 16 + Math.round(Math.cos(a) * r), b - 36 + Math.round(Math.sin(a) * r), 4, n % 2 ? k.c : sh(k.c, 1), 0.5); }
    disc(x + 16, b - 34, 2, '#ffffff');
  } },
  { id: 'gearwall', name: 'Gear wall', w: 2, h: 1, layer: 'wall', price: 340, wall(x) {
    const gear = (cx, cy, r, c) => { for (let a = 0; a < 10; a++) { const t = a / 10 * Math.PI * 2; R(cx + Math.cos(t) * r - 2, cy + Math.sin(t) * r - 2, 5, 5, c); } disc(cx, cy, r, c); disc(cx - 1, cy - 1, r - 2, sh(c, 1)); disc(cx, cy, r * 0.35, sh(c, -2)); };
    gear(x + 18, 32, 13, k.m); gear(x + 42, 48, 10, k.a); gear(x + 48, 22, 7, sh(k.m, 1)); gear(x + 14, 60, 6, k.a);
  } },
  { id: 'anvil', name: 'Anvil', w: 1, h: 1, price: 480, draw(x, b) {
    floorShadow(x, b, 32); cyl(x + 7, b - 16, 18, 16, k.w); oval(x + 16, b - 16, 9, 2, sh(k.w, 1));
    panel(x + 11, b - 26, 10, 10, k.m); panel(x + 5, b - 32, 22, 6, k.m); for (let j = 0; j < 4; j++) R(x - 1 + j, b - 32 + j, 6 - j, 1, k.m);
    R(x + 5, b - 32, 22, 1, sh(k.m, 2)); line(x + 22, b - 34, x + 30, b - 44, k.w, 2); panel(x + 26, b - 48, 6, 4, sh(k.m, 1));
  } },
  { id: 'poisonvat', name: 'Poison vat', w: 1, h: 1, price: 520, glow: ['#c070f0'], draw(x, b) {
    floorShadow(x, b, 32);
    for (let j = 0; j < 34; j++) { const h = Math.round(13 + Math.sin(j / 33 * Math.PI) * 2); R(x + 16 - h, b - 34 + j, h * 2, 1, sh(k.w, j < 4 ? 1 : j > 30 ? -1 : 0)); }
    for (const j of [-30, -18, -6]) R(x + 2, b + j, 28, 2, k.m);
    oval(x + 16, b - 34, 13, 3, '#7a3aa8'); for (let n = 0; n < 6; n++) sphere(x + 6 + hash(n, 1) * 20, b - 36 - hash(n, 2) * 6, 1.5 + hash(n, 3) * 2, '#b860e8');
    for (const i of [8, 22]) { R(x + i, b - 32, 2, 6 + (i % 3), '#9a48d0'); disc(x + i + 1, b - 25 + (i % 3), 1.5, '#9a48d0'); }
    bits(['.###.', '#.#.#', '#####', '.#.#.'], x + 13, b - 24, { '#': '#f4f4f0' }, 1);
  } },
  { id: 'weathervane', name: 'Weathervane', w: 1, h: 1, price: 300, draw(x, b) {
    floorShadow(x + 8, b, 16); panel(x + 10, b - 6, 12, 6, k.w); R(x + 15, b - 82, 2, 76, k.m);
    line(x + 6, b - 50, x + 26, b - 50, k.m); line(x + 16, b - 44, x + 16, b - 56, k.m);
    for (const i of [3, 27]) R(x + i, b - 51, 2, 2, k.a);
    line(x + 4, b - 74, x + 28, b - 74, k.m); tri(x + 27, b - 77, 4, k.m, 0.8);
    ovalShade(x + 14, b - 80, 6, 4, k.c); disc(x + 9, b - 84, 3, k.c); P(x + 8, b - 85, INK); R(x + 5, b - 84, 2, 1, '#f8b040');
    for (let n = 0; n < 4; n++) R(x + 17 + n, b - 84 - n, 2, 6 - n, sh(k.c, -1));
  } },
  { id: 'cloudcushion', name: 'Cloud cushion', w: 1, h: 1, price: 220, high: 0.2, side: 'p', seat: 'cushion', flat(w, h) {
    for (const [i, j, r] of [[10, 18, 8], [22, 18, 8], [16, 12, 9], [16, 22, 8]]) disc(i, j, r, sh(k.p, -1));
    for (const [i, j, r] of [[10, 17, 7], [22, 17, 7], [16, 11, 8], [16, 21, 7]]) disc(i, j, r, k.p);
    disc(13, 9, 3, '#ffffff'); P(12, 8, '#ffffff');
  } },
  { id: 'honeycomb', name: 'Honeycomb', w: 1, h: 1, layer: 'wall', price: 200, wall(x) {
    const HC = '#e8a828';
    for (let r = 0; r < 6; r++) for (let c = 0; c < 4; c++) {
      const cx = x + 6 + c * 7 + (r % 2) * 3.5, cy = 18 + r * 7;
      for (let j = -3; j <= 3; j++) { const h = 3 - Math.floor(Math.abs(j) / 2); R(cx - h, cy + j, h * 2 + 1, 1, sh(HC, -1)); }
      for (let j = -2; j <= 2; j++) { const h = 2 - Math.floor(Math.abs(j) / 2); R(cx - h, cy + j, h * 2 + 1, 1, (r + c) % 3 ? '#f8c840' : '#fde890'); }
    }
    R(x + 12, 62, 2, 5, '#f8c840'); disc(x + 13, 68, 1.5, '#f8c840');
    ovalShade(x + 26, 12, 3, 2, '#f8d030'); R(x + 25, 11, 1, 3, INK); R(x + 27, 11, 1, 3, INK); oval(x + 25, 9, 2, 1, '#e8f4ff');
  } },
  { id: 'antfarm', name: 'Ant farm', w: 1, h: 1, price: 280, draw(x, b) {
    floorShadow(x, b, 32); for (const i of [5, 24]) R(x + i, b - 20, 3, 20, k.w); wood(x + 2, b - 22, 28, 4, k.w);
    panel(x + 3, b - 56, 26, 34, k.c); R(x + 5, b - 54, 22, 30, '#c8e8f8'); R(x + 5, b - 44, 22, 20, '#c89858'); speckle(x + 5, b - 44, 22, 20, '#a87838', 4, 0.15);
    for (const [pts] of [[[[8, -44], [10, -38], [16, -36], [20, -30], [24, -28]]], [[[18, -44], [16, -40], [12, -32], [9, -27]]]]) for (let n = 1; n < pts.length; n++) line(x + pts[n - 1][0], b + pts[n - 1][1], x + pts[n][0], b + pts[n][1], '#7a5028', 2);
    for (const [i, j] of [[12, -37], [21, -30], [10, -29], [14, -45]]) R(x + i, b + j, 2, 1, INK);
    R(x + 5, b - 56, 22, 2, k.c);
  } },
  { id: 'fairyring', name: 'Fairy ring', w: 2, h: 2, layer: 'rug', price: 340, high: 0.03, side: 'leaf', flat(w, h) {
    oval(w / 2, h / 2, w / 2 - 1, h / 2 - 1, '#6aaa4a'); speckle(2, 2, w - 4, h - 4, '#5a9a3a', 9, 0.12);
    for (let a = 0; a < 12; a++) { const t = a / 12 * Math.PI * 2, cx = w / 2 + Math.cos(t) * 22, cy = h / 2 + Math.sin(t) * 20; disc(cx, cy, 3, a % 2 ? k.c : '#f4f0e0'); P(cx - 1, cy - 1, '#ffffff'); }
    for (let n = 0; n < 10; n++) { const cx = w / 2 + (hash(n, 4) - 0.5) * 26, cy = h / 2 + (hash(n, 5) - 0.5) * 24; P(cx, cy, '#fff4fc'); P(cx - 1, cy, '#f8b8e0'); P(cx + 1, cy, '#f8b8e0'); P(cx, cy - 1, '#f8b8e0'); P(cx, cy + 1, '#f8b8e0'); }
  } },
]);
