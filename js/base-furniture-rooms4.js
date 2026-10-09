/* base-furniture-rooms4.js  -  themed shelves, batch 4 of the road to 1,000 kinds (2026-10-08): the Music, Library,
   Pirate, Space, Farm and Underwater shelves, 25 kinds each. Same kit and rules as js/base-furniture-rooms.js: painted at
   32 pixels a tile with js/base-paint.js in the piece's theme palette `k`, outlined and rim-lit by `finish()`. Each shelf
   opens with a list that shares one body and differs by what's on it (instrument stands, bookcases by subject, flags by
   emblem, planet models, produce crates, corals). */

import { k, sh, R, P, hash, panel, inset, wood, cushion, sphere, disc, oval, ovalShade, cyl, glass, leaf, foliage, tri,
  speckle, stamp, bits, floorShadow, clear } from './base-paint.js';
import { MOTIFS, sideBox, shadowWall } from './base-furniture-kinds.js';
import { STONE, ball } from './base-furniture-rooms.js';
import { line, ring } from './base-furniture-rooms3.js';
import { view, books } from './base-paint-scenes.js';

export const ROOM_KINDS_4 = [];
const add = (group, list) => list.forEach(f => ROOM_KINDS_4.push({ group, ...f }));

const GOLD = '#f0c040', BRASS = '#d8a838', INK = '#303038', SILVER = '#d8dce4', SAND = '#e0cc98', PARCH = '#f0e0b0',
  SEA = '#3a78b8', STRAW = '#e0c070', SPACE = '#141a34';
const RAINBOW = ['#e04848', '#f08030', '#f8d030', '#58b848', '#4a98d8', '#5a58c8', '#a858d8'];
/** A half ring: an arc of pixels from angle a0 to a1. */
export function arc(cx, cy, rx, ry, a0, a1, c, t = 1) {
  const n = Math.ceil(Math.max(rx, ry) * Math.abs(a1 - a0) * 1.5);
  for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; R(Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry), t, t, c); }
}
/** A ball painted row by row in `colour(j)` (bands, land), then shaded towards its lower right. */
function globe(cx, cy, r, colour) {
  for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
    if (i * i + j * j > r * r) continue;
    const c = colour(i, j), d = Math.hypot(i + r * 0.4, j + r * 0.4);
    P(cx + i, cy + j, d > r * 1.25 ? sh(c, -1) : d < r * 0.35 ? sh(c, 1) : c);
  }
}
/** A wall plank for things to hang on. */
const plank = (x, y, w, h) => { shadowWall(x, y, w, h); wood(x, y, w, h, k.w); };
/** Little letters for signs (3x5). */
const LETTERS = { S: ['###', '#..', '###', '..#', '###'], H: ['#.#', '#.#', '###', '#.#', '#.#'], W: ['#.#', '#.#', '#.#', '###', '#.#'],
  A: ['.#.', '#.#', '###', '#.#', '#.#'], N: ['#.#', '###', '###', '###', '#.#'], T: ['###', '.#.', '.#.', '.#.', '.#.'],
  E: ['###', '#..', '##.', '#..', '###'], D: ['##.', '#.#', '#.#', '#.#', '##.'], M: ['#.#', '###', '###', '#.#', '#.#'],
  R: ['##.', '#.#', '##.', '#.#', '#.#'], U: ['#.#', '#.#', '#.#', '#.#', '###'], O: ['###', '#.#', '#.#', '#.#', '###'] };
const say = (text, x, y, c, s = 1) => [...text].forEach((ch, n) => bits(LETTERS[ch], x + n * 4 * s, y, { '#': c }, s));

/* ---------- music room ---------- */
/** A tripod instrument stand; returns the top of its cradle. */
function stand(x, b) {
  floorShadow(x + 4, b, 24);
  line(x + 16, b - 26, x + 6, b - 1, k.m, 2); line(x + 16, b - 26, x + 25, b - 1, k.m, 2); line(x + 16, b - 26, x + 16, b - 1, sh(k.m, -1));
  cyl(x + 15, b - 40, 3, 14, k.m);
  R(x + 8, b - 42, 16, 3, sh(k.m, 1)); R(x + 8, b - 47, 2, 5, k.m); R(x + 22, b - 47, 2, 5, k.m);
  return b - 42;
}
const STANDS = {
  violin: ['Violin', (c, t) => {
    ovalShade(c, t - 8, 8, 7, k.w); ovalShade(c, t - 22, 7, 6, k.w); R(c - 5, t - 16, 10, 3, k.w);
    R(c - 1, t - 46, 3, 32, INK); disc(c, t - 48, 2.5, sh(k.w, -1)); P(c - 1, t - 49, sh(k.w, 1));
    R(c - 4, t - 13, 1, 4, INK); R(c + 4, t - 13, 1, 4, INK); R(c - 3, t - 9, 7, 1, '#e8d8b0'); R(c, t - 44, 1, 36, '#e8e8e8'); R(c - 1, t - 5, 3, 3, INK);
    line(c + 11, t, c + 4, t - 50, '#e8e0c8'); line(c + 12, t, c + 5, t - 50, k.w);
  }],
  trumpet: ['Trumpet', (c, t) => {
    for (let j = 0; j < 10; j++) { const h = Math.round(2 + (10 - j) ** 2 / 12); R(c - h, t - 50 + j, h * 2 + 1, 1, j < 2 ? sh(BRASS, 1) : BRASS); }
    oval(c, t - 50, 9, 1.5, sh(BRASS, -2)); cyl(c - 2, t - 40, 5, 34, BRASS);
    ring(c + 7, t - 20, 5, BRASS, 2); for (let n = 0; n < 3; n++) { cyl(c + 4, t - 34 + n * 5, 4, 3, sh(BRASS, -1)); disc(c + 9, t - 33 + n * 5, 1.5, '#fff4d0'); }
    R(c - 1, t - 6, 3, 5, sh(BRASS, -1));
  }],
  banjo: ['Banjo', (c, t) => {
    R(c - 1, t - 54, 3, 36, k.w); panel(c - 3, t - 60, 7, 7, k.w); for (const j of [-58, -55]) { P(c - 4, t + j, SILVER); P(c + 4, t + j, SILVER); }
    disc(c, t - 12, 11, k.m); disc(c, t - 12, 9, '#f4f0e0'); ring(c, t - 12, 10, sh(k.m, 1));
    for (let a = 0; a < 12; a++) P(c + Math.round(Math.cos(a / 12 * Math.PI * 2) * 10), t - 12 + Math.round(Math.sin(a / 12 * Math.PI * 2) * 10), SILVER);
    R(c, t - 52, 1, 44, '#c8c8c8'); R(c - 3, t - 14, 7, 1, k.w); R(c - 2, t - 4, 5, 2, SILVER);
  }],
  ukulele: ['Ukulele', (c, t) => {
    ovalShade(c, t - 8, 8, 7, k.c); ovalShade(c, t - 20, 6, 6, k.c); R(c - 5, t - 15, 10, 3, k.c);
    disc(c, t - 16, 2.5, INK); R(c - 1, t - 44, 3, 26, k.w); panel(c - 3, t - 50, 7, 7, k.w);
    R(c, t - 44, 1, 38, '#e8e8e8'); R(c - 3, t - 8, 7, 2, sh(k.w, -1)); for (const i of [-4, 4]) P(c + i, t - 48, SILVER);
  }],
  sax: ['Saxophone', (c, t) => {
    line(c - 5, t - 46, c - 2, t - 10, BRASS, 5);
    for (let a = 0; a <= 20; a++) { const th = a / 20 * Math.PI; disc(c + 2 - Math.cos(th) * 4, t - 8 + Math.sin(th) * 3, 2.5, BRASS); }
    cyl(c + 4, t - 30, 6, 22, BRASS); oval(c + 7, t - 31, 6, 2, sh(BRASS, 1)); oval(c + 7, t - 31, 4, 1, sh(BRASS, -2));
    for (let n = 0; n < 6; n++) disc(c - 2 + n * 0.5, t - 42 + n * 5, 1.5, '#fff4d0');
    line(c - 5, t - 46, c + 2, t - 54, BRASS, 2); R(c + 2, t - 57, 2, 4, INK);
  }],
  flute: ['Flute', (c, t) => {
    line(c - 6, t, c + 7, t - 56, SILVER, 3); line(c - 5, t, c + 8, t - 56, sh(SILVER, 1));
    for (let n = 0; n < 7; n++) { const f = 0.15 + n * 0.1; disc(c - 6 + 13 * f + 1, t - 56 * f, 1.5, sh(SILVER, -1)); }
    disc(c + 6, t - 50, 1, INK); R(c + 6, t - 58, 3, 3, sh(SILVER, -1));
  }],
};
add('Music', Object.entries(STANDS).map(([id, [name, play]]) => ({ id: `${id}stand`, name: `${name} stand`, w: 1, h: 1, price: 520,
  draw(x, b) { play(x + 16, stand(x, b)); } })));
add('Music', [
  { id: 'grandpiano', name: 'Grand piano', w: 2, h: 1, price: 1500, draw(x, b, vw, dir) {
    if (dir % 2) return sideBox(x, b, vw, 40);
    floorShadow(x, b, vw); const body = sh(k.w, -1);
    for (const i of [5, vw / 2 - 2, vw - 10]) { cyl(x + i, b - 24, 5, 24, body); R(x + i - 1, b - 3, 7, 3, GOLD); }
    panel(x + 2, b - 40, vw - 4, 16, body, 2);
    for (let i = 0; i < vw - 12; i++) { const top = b - 40 - Math.round(i / (vw - 12) * 34); R(x + 8 + i, top, 1, b - 40 - top, i < 2 ? sh(k.w, 1) : k.w); }
    line(x + vw - 18, b - 40, x + vw - 26, b - 66, GOLD);
    R(x + 6, b - 30, vw - 12, 6, '#f8f8f0'); for (let i = 0; i < vw - 12; i += 3) R(x + 6 + i, b - 30, 1, 6, '#c8c8c0');
    for (let i = 2; i < vw - 14; i += 7) { R(x + 8 + i, b - 30, 2, 3, INK); R(x + 11 + i, b - 30, 2, 3, INK); }
    panel(x + 14, b - 50, 22, 10, k.w); R(x + 16, b - 49, 18, 8, PARCH); for (const j of [-47, -45, -43]) R(x + 17, b + j, 16, 1, sh(PARCH, -2));
    panel(x + 18, b - 12, 24, 4, k.c); cyl(x + 20, b - 8, 2, 8, body); cyl(x + 38, b - 8, 2, 8, body);
  } },
  { id: 'harp', name: 'Harp', w: 1, h: 1, price: 980, draw(x, b) {
    floorShadow(x, b, 32); panel(x + 3, b - 6, 26, 6, GOLD);
    const sb = (i) => b - 6 - (i - 9) * 64 / 17, nk = (i) => b - 84 + (i - 5) * 10 / 22 + Math.sin((i - 5) / 22 * Math.PI * 2) * 3;
    for (let i = 9; i <= 25; i += 2) if (sb(i) > nk(i)) R(x + i, nk(i), 1, sb(i) - nk(i), '#f4f0d8');
    line(x + 9, b - 6, x + 26, b - 70, k.w, 4); for (let i = 5; i <= 27; i++) R(x + i, nk(i) - 1, 1, 4, GOLD);
    cyl(x + 3, b - 86, 4, 80, GOLD); sphere(x + 5, b - 88, 3, GOLD); disc(x + 27, b - 76, 2.5, sh(GOLD, -1));
  } },
  { id: 'drumkit', name: 'Drum kit', w: 2, h: 1, price: 1200, draw(x, b, vw) {
    floorShadow(x, b, vw); const c = x + vw / 2, r = Math.min(16, vw / 2 - 4);
    for (const s of [-1, 1]) { const sx = c + s * (vw / 2 - 5); line(sx, b - 2, sx, b - 54, k.m); oval(sx, b - 56, 7, 2, GOLD); R(sx - 6, b - 56, 13, 1, sh(GOLD, 1)); }
    for (const s of vw > 40 ? [-1, 1] : [0]) { const tx = c + s * 9; cyl(tx - 6, b - 46, 12, 10, k.c); oval(tx, b - 46, 6, 2, '#f4f0e0'); }
    disc(c, b - 18, r, k.c); disc(c, b - 18, r - 2, '#f4f0e0'); ring(c, b - 18, r - 1, sh(k.c, -1)); disc(c, b - 18, r * 0.4, k.c);
    for (const s of [-1, 1]) line(c + s * (r - 3), b - 6, c + s * (r + 2), b, k.m);
    if (vw > 40) { cyl(x + 6, b - 26, 10, 8, sh(k.m, 1)); oval(x + 11, b - 26, 5, 1.5, '#f4f0e0'); line(x + 11, b - 18, x + 11, b, k.m); }
  } },
  { id: 'cello', name: 'Cello', w: 1, h: 1, price: 900, draw(x, b) {
    floorShadow(x + 4, b, 24); R(x + 15, b - 8, 2, 8, SILVER);
    ovalShade(x + 16, b - 20, 12, 11, k.w); ovalShade(x + 16, b - 42, 10, 9, k.w); R(x + 8, b - 33, 16, 4, k.w);
    R(x + 15, b - 84, 3, 50, INK); disc(x + 16, b - 86, 3, sh(k.w, -1));
    for (const i of [10, 22]) R(x + i, b - 30, 1, 7, INK); R(x + 12, b - 24, 9, 1, '#e8d8b0'); R(x + 16, b - 80, 1, 64, '#e8e8e8'); R(x + 14, b - 12, 5, 3, INK);
    line(x + 28, b - 6, x + 20, b - 76, '#e8e0c8'); line(x + 29, b - 6, x + 21, b - 76, k.w);
  } },
  { id: 'podium', name: "Conductor's podium", w: 1, h: 1, price: 480, draw(x, b) {
    floorShadow(x, b, 32); panel(x + 1, b - 14, 30, 14, k.c, 2); R(x + 3, b - 12, 26, 1, sh(k.c, 1)); R(x + 1, b - 14, 30, 2, GOLD);
    R(x + 15, b - 56, 2, 42, k.m); line(x + 16, b - 56, x + 8, b - 66, k.m); line(x + 16, b - 56, x + 24, b - 66, k.m);
    panel(x + 6, b - 72, 20, 12, k.m); R(x + 8, b - 71, 16, 10, PARCH); for (const j of [-69, -66, -63]) R(x + 9, b + j, 14, 1, sh(PARCH, -2));
    line(x + 22, b - 18, x + 28, b - 36, '#f4f4f0');
  } },
  { id: 'gramophone', name: 'Gramophone', w: 1, h: 1, price: 760, draw(x, b) {
    floorShadow(x, b, 32); wood(x + 3, b - 18, 26, 18, k.w); R(x + 5, b - 4, 22, 2, sh(k.w, -2)); disc(x + 26, b - 10, 2, GOLD);
    oval(x + 14, b - 19, 11, 3, INK); oval(x + 14, b - 19, 3, 1, k.c);
    for (let s = 0; s < 16; s++) disc(x + 13 + s * 0.6, b - 22 - s * 3.2, 1 + s * 0.65, s > 12 ? sh(BRASS, 1) : BRASS);
    oval(x + 23, b - 72, 9, 6, sh(BRASS, -2)); oval(x + 23, b - 72, 6, 4, INK); line(x + 13, b - 22, x + 18, b - 20, SILVER);
  } },
  { id: 'metronome', name: 'Metronome', w: 1, h: 1, price: 200, draw(x, b) {
    floorShadow(x + 4, b, 24);
    for (let j = 0; j < 46; j++) { const h = Math.round(4 + j * 0.2); R(x + 16 - h, b - 46 + j, h * 2, 1, j < 2 ? sh(k.w, 1) : k.w); }
    for (let j = 6; j < 34; j++) { const h = Math.round(2 + j * 0.15); R(x + 16 - h, b - 46 + j, h * 2, 1, k.p); }
    for (let j = 10; j < 32; j += 4) R(x + 14, b - 46 + j, 4, 1, sh(k.p, -2));
    line(x + 16, b - 12, x + 22, b - 44, INK); R(x + 18, b - 34, 4, 3, GOLD); R(x + 10, b - 10, 12, 4, sh(k.w, -1));
  } },
  { id: 'speakerstack', name: 'Speaker stack', w: 1, h: 1, price: 640, draw(x, b) {
    floorShadow(x, b, 32);
    for (const [y, h, r] of [[-38, 38, 10], [-74, 34, 7]]) {
      panel(x + 3, b + y, 26, h, k.m, 2); disc(x + 16, b + y + h - r - 5, r, INK); disc(x + 16, b + y + h - r - 5, r - 2, sh(k.m, -2)); disc(x + 16, b + y + h - r - 5, r * 0.35, sh(k.m, 1));
      disc(x + 16, b + y + 5, 2.5, INK);
    }
    R(x + 5, b - 2, 22, 2, k.c);
  } },
  { id: 'micstand', name: 'Microphone', w: 1, h: 1, price: 300, draw(x, b) {
    floorShadow(x + 6, b, 20); oval(x + 16, b - 2, 9, 2, k.m); R(x + 15, b - 60, 2, 58, k.m);
    line(x + 16, b - 60, x + 22, b - 70, k.m, 2); for (let j = 0; j < 9; j++) { const h = j < 2 || j > 6 ? 3 : 4; R(x + 23 - h, b - 82 + j, h * 2, 1, j % 2 ? SILVER : sh(SILVER, -1)); }
    R(x + 20, b - 74, 6, 3, INK); R(x + 18, b - 72, 1, 70, k.c); R(x + 18, b - 3, 8, 1, k.c);
  } },
  { id: 'mixingdesk', name: 'Mixing desk', w: 2, h: 1, price: 1100, glow: ['#68e8a8'], draw(x, b, vw, dir) {
    if (dir % 2) return sideBox(x, b, vw, 32);
    floorShadow(x, b, vw); for (const i of [4, vw - 8]) cyl(x + i, b - 24, 4, 24, k.m);
    panel(x + 1, b - 32, vw - 2, 10, k.w); panel(x + 2, b - 40, vw - 4, 9, sh(k.m, -1));
    for (let n = 0; n < (vw - 10) / 5; n++) { const i = x + 5 + n * 5; R(i + 1, b - 39, 1, 7, INK); R(i, b - 37 + (n * 3) % 5, 3, 2, RAINBOW[n % 7]); }
    for (let n = 0; n < (vw - 10) / 5; n++) disc(x + 6 + n * 5, b - 28, 1.5, n % 3 ? SILVER : GOLD);
    inset(x + vw / 2 - 10, b - 54, 20, 12, '#1a2a2a'); for (let n = 0; n < 6; n++) R(x + vw / 2 - 8 + n * 3, b - 44 - (n * 7) % 9, 2, (n * 7) % 9 + 1, '#68e8a8');
  } },
  { id: 'amplifier', name: 'Amplifier', w: 1, h: 1, price: 420, draw(x, b) {
    floorShadow(x, b, 32); panel(x + 2, b - 36, 28, 36, k.m, 2); inset(x + 5, b - 28, 22, 24, sh(k.c, -1));
    for (let j = b - 27; j < b - 5; j += 2) R(x + 6, j, 20, 1, sh(k.c, -2));
    R(x + 4, b - 34, 24, 5, INK); for (let n = 0; n < 5; n++) disc(x + 7 + n * 4.5, b - 32, 1.5, SILVER); R(x + 22, b - 34, 4, 1, GOLD);
    R(x + 12, b - 40, 8, 4, sh(k.m, -1));
  } },
  { id: 'tuba', name: 'Tuba', w: 1, h: 1, price: 820, draw(x, b) {
    floorShadow(x + 2, b, 28); panel(x + 8, b - 6, 16, 6, k.w);
    ring(x + 16, b - 26, 10, BRASS, 4); ring(x + 16, b - 26, 6, sh(BRASS, -1));
    cyl(x + 18, b - 66, 7, 36, BRASS);
    for (let j = 0; j < 12; j++) { const h = Math.round(4 + (12 - j) ** 2 / 14); R(x + 21 - h, b - 80 + j, h * 2, 1, j < 2 ? sh(BRASS, 1) : BRASS); }
    oval(x + 21, b - 80, 12, 2, sh(BRASS, -2));
    for (let n = 0; n < 4; n++) { cyl(x + 8, b - 52 + n * 5, 6, 3, sh(BRASS, -1)); disc(x + 7, b - 51 + n * 5, 1.5, '#fff4d0'); }
    line(x + 10, b - 56, x + 4, b - 62, BRASS, 2);
  } },
  { id: 'chimes', name: 'Tubular bells', w: 1, h: 1, price: 700, draw(x, b) {
    floorShadow(x, b, 32); for (const i of [2, 27]) { cyl(x + i, b - 84, 3, 84, k.w); R(x + i - 2, b - 4, 7, 4, k.w); }
    panel(x + 1, b - 88, 30, 5, k.w);
    for (let n = 0; n < 6; n++) { const i = x + 7 + n * 3.4, h = 62 - n * 7; R(i + 1, b - 83, 1, 3, INK); cyl(i, b - 80, 3, h, SILVER); R(i, b - 80, 3, 1, GOLD); }
    line(x + 26, b - 30, x + 20, b - 20, k.w); disc(x + 20, b - 20, 2, k.c);
  } },
  { id: 'notesrug', name: 'Melody rug', w: 2, h: 2, layer: 'rug', price: 280, high: 0.04, side: 'c', flat(w, h) {
    R(0, 0, w, h, sh(k.c, -1)); R(2, 2, w - 4, h - 4, k.p);
    for (let s = 0; s < 2; s++) for (let l = 0; l < 5; l++) R(4, 12 + s * 28 + l * 3, w - 8, 1, sh(k.p, -2));
    [[8, 4, 0], [24, 8, 1], [40, 2, 0], [14, 32, 1], [32, 36, 0], [48, 30, 1]].forEach(([i, j, n]) => stamp(MOTIFS.note, i, j, { '#': n ? k.c : INK }, 1));
  } },
  { id: 'keysrug', name: 'Piano keys rug', w: 2, h: 1, layer: 'rug', price: 240, high: 0.03, side: 'm', flat(w, h) {
    R(0, 0, w, h, INK); R(1, 1, w - 2, h - 2, '#f8f8f0');
    for (let i = 1; i < w - 1; i += 6) R(i, 1, 1, h - 2, '#b8b8b0');
    for (let n = 0; (n + 1) * 6 < w - 1; n++) if (n % 7 !== 2 && n % 7 !== 6) R(n * 6 + 5, 1, 4, h * 0.6, INK);
    R(1, 1, w - 2, 2, k.c);
  } },
  { id: 'concertposter', name: 'Concert poster', w: 1, h: 1, layer: 'wall', price: 120, wall(x) {
    shadowWall(x + 4, 16, 24, 40); panel(x + 4, 16, 24, 40, sh(k.c, -1));
    for (let n = 0; n < 6; n++) { const a = n / 6 * Math.PI * 2; line(x + 16, 30, x + 16 + Math.cos(a) * 11, 30 + Math.sin(a) * 11, sh(k.c, 1)); }
    ovalShade(x + 14, 36, 5, 4, k.a); ovalShade(x + 14, 30, 4, 3, k.a); R(x + 15, 16, 2, 14, INK); disc(x + 14, 33, 1.5, INK);
    R(x + 7, 44, 18, 3, k.p); R(x + 9, 49, 14, 2, sh(k.p, -1)); disc(x + 16, 17, 1.5, k.m);
  } },
  { id: 'vinylwall', name: 'Record wall', w: 2, h: 1, layer: 'wall', price: 340, wall(x) {
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
      const fx = x + 4 + c * 19, fy = 14 + r * 26; shadowWall(fx, fy, 18, 24); panel(fx, fy, 18, 24, k.w);
      disc(fx + 9, fy + 12, 7, INK); ring(fx + 9, fy + 12, 5, '#4a4a54'); disc(fx + 9, fy + 12, 2.5, RAINBOW[(r * 3 + c * 2) % 7]); P(fx + 9, fy + 12, '#ffffff'); P(fx + 6, fy + 8, '#6a6a74');
    }
  } },
  { id: 'musicstand', name: 'Music stand', w: 1, h: 1, price: 160, draw(x, b) {
    floorShadow(x + 6, b, 20); for (const i of [-8, 0, 8]) line(x + 16, b - 12, x + 16 + i, b, k.m);
    R(x + 15, b - 56, 2, 44, k.m); panel(x + 4, b - 74, 24, 18, k.m); R(x + 6, b - 73, 20, 16, PARCH);
    for (let s = 0; s < 2; s++) { for (let l = 0; l < 5; l++) R(x + 7, b - 71 + s * 8 + l, 18, 1, l % 2 ? PARCH : sh(PARCH, -2)); for (let n = 0; n < 4; n++) disc(x + 9 + n * 4, b - 69 + s * 8 + (n * 3) % 4, 1, INK); }
    R(x + 4, b - 57, 24, 2, sh(k.m, -1));
  } },
  { id: 'discoball', name: 'Disco ball', w: 1, h: 1, layer: 'wall', price: 380, glow: ['#f0f8ff'], wall(x) {
    R(x + 16, 0, 1, 18, SILVER);
    for (let j = -12; j <= 12; j++) for (let i = -12; i <= 12; i++) {
      if (i * i + j * j > 144) continue;
      const lit = hash(Math.floor((i + 12) / 3), Math.floor((j + 12) / 3)) < 0.25, d = Math.hypot(i + 5, j + 5);
      P(x + 16 + i, 31 + j, (i + 12) % 3 === 0 || (j + 12) % 3 === 0 ? sh(SILVER, -2) : lit ? '#f0f8ff' : d > 14 ? sh(SILVER, -1) : SILVER);
    }
    for (const [i, j] of [[3, 50], [28, 46], [6, 12], [27, 14]]) { P(x + i, j, '#f0f8ff'); P(x + i - 1, j, sh(k.a, 1)); P(x + i + 1, j, sh(k.a, 1)); }
  } },
]);

/* ---------- library ---------- */
/** A tall bookcase with three shelves; returns each shelf's floor, top first. */
function bookcase(x, b) {
  floorShadow(x, b, 32); wood(x + 1, b - 90, 30, 90, k.w, 'y'); inset(x + 4, b - 86, 24, 80, sh(k.w, -2));
  for (const j of [-62, -34]) { R(x + 3, b + j, 26, 3, k.w); R(x + 3, b + j, 26, 1, sh(k.w, 1)); }
  R(x + 1, b - 6, 30, 6, sh(k.w, -1)); panel(x, b - 92, 32, 4, k.w);
  return [b - 62, b - 34, b - 6];
}
/** A row of books in the given colours. */
function row(x0, x1, floor, cols, seed, tall = 18) {
  for (let bx = x0, i = 0; bx < x1 - 2; i++) {
    const c = cols[(seed + i * 3) % cols.length], bw = Math.min(2 + ((seed + i) % 3), x1 - bx), bh = tall - 3 + ((i * 5 + seed) % 4);
    R(bx, floor - bh, bw, bh, c); R(bx, floor - bh, 1, bh, sh(c, 1)); R(bx + 1, floor - bh + 3, Math.max(1, bw - 1), 1, GOLD);
    bx += bw;
  }
}
const CASES = {
  atlas: ['Atlas', (x, [a, b2, c]) => {
    for (let n = 0; n < 4; n++) panel(x + 5, a - 3 - n * 3, 14, 3, ['#4a7ac8', '#4f9a42', '#d0485a', '#e0b04a'][n]);
    R(x + 23, a - 4, 2, 4, GOLD); globe(x + 24, a - 11, 5, (i, j) => hash(Math.floor(i / 2) + 9, Math.floor(j / 2)) < 0.4 ? '#58a848' : '#4a88d0');
    books(x + 5, x + 27, b2, 2); for (let n = 0; n < 3; n++) panel(x + 5, c - 4 - n * 4, 22, 4, ['#8a5ab8', '#4a7ac8', '#e8e4d8'][n]);
  }],
  poetry: ['Poetry', (x, [a, b2, c]) => {
    row(x + 5, x + 27, a, ['#f4a0c0', '#b898c0', '#fff4e0', '#a8d8f8'], 1, 20); row(x + 5, x + 20, b2, ['#f4a0c0', '#e8c8d8', '#b898c0'], 3, 18);
    cyl(x + 21, b2 - 7, 5, 7, k.a); line(x + 23, b2 - 7, x + 27, b2 - 22, '#ffffff', 2); P(x + 27, b2 - 23, sh(k.c, 1));
    row(x + 5, x + 27, c, ['#d0485a', '#f4a0c0', '#e8e4d8'], 5, 18);
  }],
  mystery: ['Mystery', (x, [a, b2, c]) => {
    const DARK = ['#3a3048', '#4a2a2a', '#2a3a3a', '#5a4a3a'];
    row(x + 5, x + 27, a, DARK, 0, 20); row(x + 5, x + 17, b2, DARK, 2, 18);
    ring(x + 21, b2 - 10, 4, BRASS, 1); disc(x + 21, b2 - 10, 3, '#cfe8f4'); line(x + 24, b2 - 7, x + 27, b2 - 2, k.w, 2);
    row(x + 5, x + 20, c, DARK, 4, 18); cyl(x + 22, c - 10, 4, 10, '#f4f0e0'); R(x + 23, c - 13, 2, 3, '#f8b040');
  }],
  recipe: ['Recipe', (x, [a, b2, c]) => {
    for (let n = 0; n < 3; n++) { const i = x + 6 + n * 7; cyl(i, a - 12, 6, 12, ['#d84040', '#f0a020', '#8a3aa8'][n]); R(i - 1, a - 14, 8, 3, '#f4e0c0'); R(i, a - 16, 6, 2, k.c); }
    books(x + 5, x + 27, b2, 4); row(x + 5, x + 18, c, ['#e0b04a', '#d0485a', '#f4f0e0'], 1, 18);
    R(x + 22, c - 18, 1, 14, SILVER); for (let n = 0; n < 4; n++) oval(x + 22, c - 6 - n, 3 - n * 0.5, 4, SILVER); R(x + 21, c - 4, 3, 4, k.c);
  }],
  fairy: ['Fairy-tale', (x, [a, b2, c]) => {
    row(x + 5, x + 27, a, ['#f4a0c0', '#a8d8f8', '#f8e078', '#a8e098'], 2, 20);
    panel(x + 9, b2 - 12, 14, 12, '#f4f0f8'); for (const i of [7, 21]) { panel(x + i, b2 - 18, 5, 18, '#f4f0f8'); tri(x + i + 2, b2 - 24, 6, '#f4a0c0', 0.5); }
    tri(x + 16, b2 - 20, 8, '#a8d8f8', 0.8); R(x + 14, b2 - 6, 4, 6, '#b898c0'); P(x + 25, b2 - 26, '#f8e078');
    row(x + 5, x + 27, c, ['#a8e098', '#f8e078', '#f4a0c0', '#a8d8f8'], 6, 18);
  }],
  scroll: ['Scroll', (x, floors) => floors.forEach((f, n) => {
    for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) { const cx = x + 8 + i * 5.5 + (r % 2) * 2, cy = f - 4 - r * 7; disc(cx, cy, 3, PARCH); disc(cx, cy, 1.5, sh(PARCH, -2)); if ((i + r + n) % 3 === 0) R(cx - 3, cy - 1, 1, 3, k.c); }
  })],
};
add('Library', Object.entries(CASES).map(([id, [name, fill]]) => ({ set: 'bookcase', id: `${id}bookcase`, name: `${name} bookcase`, w: 1, h: 1, price: 600,
  draw(x, b) { fill(x, bookcase(x, b)); } })));
add('Library', [
  { id: 'wingchair', name: 'Wingback chair', w: 1, h: 1, price: 560, seat: 'cushion', draw(x, b) {
    floorShadow(x, b, 32); for (const i of [4, 25]) { cyl(x + i, b - 8, 3, 8, k.w); }
    cushion(x + 5, b - 64, 22, 44, k.c, 4); for (const [i, j] of [[10, -52], [16, -52], [22, -52], [13, -44], [19, -44], [10, -36], [16, -36], [22, -36]]) P(x + i, b + j, sh(k.c, -2));
    cushion(x + 1, b - 56, 7, 22, sh(k.c, 1), 3); cushion(x + 24, b - 56, 7, 22, k.c, 3);
    cushion(x + 3, b - 24, 26, 14, k.c, 3); cushion(x + 6, b - 26, 20, 6, sh(k.c, 1), 2);
    R(x + 3, b - 10, 26, 2, GOLD);
  } },
  { id: 'librarydesk', name: 'Library desk', w: 2, h: 1, price: 900, glow: ['#fff0b0'], draw(x, b, vw, dir) {
    if (dir % 2) return sideBox(x, b, vw, 30);
    floorShadow(x, b, vw); wood(x + 2, b - 30, vw - 4, 26, k.w); R(x + 3, b - 4, vw - 6, 4, sh(k.w, -3)); panel(x, b - 32, vw, 4, sh(k.w, 1));
    for (const i of [6, vw - 22]) { inset(x + i, b - 26, 16, 8, sh(k.w, -1)); R(x + i + 6, b - 23, 4, 1, GOLD); }
    R(x + 10, b - 37, 2, 5, BRASS); R(x + 6, b - 34, 10, 2, BRASS);
    for (let j = 0; j < 6; j++) R(x + 5 + j, b - 46 + j, 12 - j * 2 + 2 * j, 1, '#3a8a4a'); panel(x + 4, b - 46, 14, 6, '#3a8a4a'); R(x + 6, b - 40, 10, 1, '#fff0b0');
    row(x + vw - 26, x + vw - 6, b - 32, ['#d0485a', '#4a7ac8', '#e0b04a', '#4f9a42'], 1, 14);
    panel(x + 24, b - 34, 14, 2, PARCH);
  } },
  { id: 'cardcatalogue', name: 'Card catalogue', w: 1, h: 1, price: 520, draw(x, b) {
    floorShadow(x, b, 32); wood(x + 2, b - 60, 28, 54, k.w, 'y'); cyl(x + 3, b - 6, 3, 6, k.w); cyl(x + 26, b - 6, 3, 6, k.w);
    for (let r = 0; r < 6; r++) for (let c = 0; c < 3; c++) { const dx = x + 4 + c * 8, dy = b - 58 + r * 8.5; panel(dx, dy, 7, 7, sh(k.w, 1)); R(dx + 2, dy + 2, 3, 1, PARCH); R(dx + 3, dy + 4, 1, 1, BRASS); }
    panel(x + 1, b - 63, 30, 4, sh(k.w, -1));
  } },
  { id: 'libraryladder', name: 'Library ladder', w: 1, h: 1, price: 340, draw(x, b) {
    floorShadow(x + 4, b, 24); R(x + 2, b - 92, 28, 2, BRASS);
    for (const s of [0, 14]) line(x + 8 + s, b - 4, x + 4 + s, b - 90, k.w, 3);
    for (let n = 0; n < 9; n++) { const f = n / 9, y = b - 10 - n * 9; R(x + 8 - Math.round(f * 4), y, 17, 2, sh(k.w, 1)); }
    for (const i of [9, 23]) { disc(x + i, b - 3, 3, k.m); P(x + i - 1, b - 4, SILVER); }
    for (const i of [5, 19]) { R(x + i, b - 92, 3, 5, BRASS); }
  } },
  { id: 'writingdesk', name: 'Writing desk', w: 1, h: 1, price: 480, draw(x, b) {
    floorShadow(x, b, 32); for (const i of [3, 26]) cyl(x + i, b - 26, 3, 26, k.w);
    wood(x + 1, b - 30, 30, 6, k.w); inset(x + 4, b - 24, 24, 6, sh(k.w, -1)); R(x + 15, b - 22, 2, 1, BRASS);
    wood(x + 2, b - 50, 28, 18, k.w); for (let c = 0; c < 4; c++) inset(x + 4 + c * 6.5, b - 47, 5, 13, sh(k.w, -2));
    R(x + 5, b - 36, 3, 2, PARCH); R(x + 18, b - 40, 3, 6, PARCH);
    panel(x + 6, b - 33, 12, 3, PARCH); cyl(x + 22, b - 35, 5, 5, INK); line(x + 24, b - 35, x + 29, b - 50, '#ffffff', 2);
  } },
  { id: 'bankerslamp', name: "Banker's lamp", w: 1, h: 1, price: 380, glow: ['#fff0b0'], draw(x, b) {
    floorShadow(x, b, 32); for (const i of [5, 24]) cyl(x + i, b - 28, 3, 28, k.w); wood(x + 3, b - 32, 26, 5, k.w);
    oval(x + 16, b - 33, 8, 2, BRASS); R(x + 15, b - 46, 2, 13, BRASS);
    for (let j = 0; j < 8; j++) { const h = 6 + j; R(x + 16 - h, b - 54 + j, h * 2, 1, j < 2 ? sh('#3a8a4a', 1) : '#3a8a4a'); }
    R(x + 3, b - 46, 26, 1, '#fff0b0'); R(x + 14, b - 58, 4, 4, BRASS); R(x + 23, b - 44, 1, 6, BRASS);
  } },
  { id: 'orrery', name: 'Orrery', w: 1, h: 1, price: 860, draw(x, b) {
    floorShadow(x + 4, b, 24); panel(x + 8, b - 8, 16, 8, k.w); cyl(x + 14, b - 30, 4, 22, BRASS);
    ring(x + 16, b - 44, 14, sh(BRASS, -1)); arc(x + 16, b - 44, 9, 4, 0, Math.PI * 2, BRASS);
    sphere(x + 16, b - 44, 4, '#f8c040');
    for (const [a, r, c, s] of [[0.4, 9, '#4a88d0', 2], [2.6, 9, '#d06838', 2], [4.2, 14, '#d8b878', 3], [5.6, 14, '#8a5ab8', 2]]) {
      const px = x + 16 + Math.cos(a) * r, py = b - 44 + Math.sin(a) * r * 0.45; line(x + 16, b - 44, px, py, BRASS); sphere(px, py, s, c);
    }
  } },
  { id: 'mapcase', name: 'Map chest', w: 2, h: 1, price: 720, draw(x, b, vw, dir) {
    if (dir % 2) return sideBox(x, b, vw, 30);
    floorShadow(x, b, vw); wood(x + 2, b - 30, vw - 4, 26, k.w); R(x + 3, b - 4, vw - 6, 4, sh(k.w, -3));
    for (let n = 0; n < 4; n++) { inset(x + 5, b - 28 + n * 6, vw - 10, 5, sh(k.w, -1)); R(x + vw / 2 - 4, b - 26 + n * 6, 8, 1, BRASS); }
    panel(x, b - 32, vw, 3, sh(k.w, 1));
    cyl(x + 10, b - 38, 30, 6, PARCH); oval(x + 40, b - 35, 2, 3, sh(PARCH, -1)); R(x + 24, b - 38, 2, 6, k.c);
    cyl(x + 42, b - 37, 14, 5, sh(PARCH, -1));
  } },
  { id: 'scrollrack', name: 'Scroll rack', w: 1, h: 1, price: 300, draw(x, b) {
    floorShadow(x, b, 32); line(x + 4, b, x + 28, b - 56, k.w, 3); line(x + 28, b, x + 4, b - 56, k.w, 3);
    for (const [i, j, c] of [[10, -14, k.c], [16, -24, '#4a7ac8'], [10, -34, k.a], [22, -34, k.c], [16, -44, '#4f9a42']]) {
      cyl(x + i - 6, b + j - 3, 14, 6, PARCH); disc(x + i - 6, b + j, 3, sh(PARCH, -1)); disc(x + i + 8, b + j, 3, sh(PARCH, -1)); R(x + i, b + j - 3, 2, 6, c);
    }
  } },
  { id: 'bookarch', name: 'Book arch', w: 2, h: 1, price: 1000, draw(x, b, vw) {
    floorShadow(x, b, vw); const cx = x + vw / 2, r = vw / 2 - 2, ri = Math.max(6, r - 12);
    for (let n = 0; n < 40; n++) {
      const a0 = Math.PI + n / 40 * Math.PI, c = ['#d0485a', '#4a7ac8', '#e0b04a', '#4f9a42', '#8a5ab8', '#e8e4d8'][n % 6];
      for (let s = ri; s < r; s++) P(cx + Math.cos(a0) * s, b - 40 + Math.sin(a0) * s * 1.3, s < ri + 2 ? sh(c, -1) : c);
    }
    for (const i of [x + 2, x + vw - 14]) for (let n = 0; n < 10; n++) panel(i, b - 4 - n * 4, 12, 4, ['#d0485a', '#4a7ac8', '#e0b04a', '#4f9a42', '#8a5ab8'][(n + i) % 5]);
  } },
  { id: 'readingrug', name: 'Reading rug', w: 2, h: 2, layer: 'rug', price: 280, high: 0.04, side: 'c', flat(w, h) {
    oval(w / 2, h / 2, w / 2 - 1, h / 2 - 1, sh(k.c, -1)); oval(w / 2, h / 2, w / 2 - 3, h / 2 - 3, k.c);
    for (let a = 0; a < 32; a++) { const t = a / 32 * Math.PI * 2; P(w / 2 + Math.cos(t) * (w / 2 - 6), h / 2 + Math.sin(t) * (h / 2 - 6), k.a); }
    R(w / 2 - 16, h / 2 - 9, 15, 18, k.p); R(w / 2 + 1, h / 2 - 9, 15, 18, k.p); R(w / 2 - 1, h / 2 - 10, 2, 20, sh(k.p, -2));
    for (let l = 0; l < 5; l++) { R(w / 2 - 13, h / 2 - 6 + l * 3, 10, 1, sh(k.p, -2)); R(w / 2 + 3, h / 2 - 6 + l * 3, 10, 1, sh(k.p, -2)); }
    R(w / 2 + 6, h / 2 + 9, 2, 6, k.a);
  } },
  { id: 'quietsign', name: 'Quiet sign', w: 1, h: 1, layer: 'wall', price: 80, wall(x) {
    shadowWall(x + 3, 28, 26, 14); panel(x + 3, 28, 26, 14, k.w); R(x + 5, 30, 22, 10, k.p); say('SHH', x + 6, 32, INK, 1);
    disc(x + 24, 35, 2.5, k.c); R(x + 24, 31, 1, 2, k.c); R(x + 16, 22, 1, 6, k.m); disc(x + 16, 21, 1.5, k.m);
  } },
  { id: 'bookends', name: 'Bookends', w: 1, h: 1, layer: 'wall', price: 180, wall(x) {
    shadowWall(x + 2, 46, 28, 4); wood(x + 2, 46, 28, 4, k.w); R(x + 6, 50, 2, 6, k.w); R(x + 24, 50, 2, 6, k.w);
    books(x + 8, x + 24, 46, 3, 18); ball(x + 5, 40, 4, k.c); R(x + 2, 44, 7, 2, sh(k.m, -1)); ball(x + 27, 40, 4, k.c); R(x + 24, 44, 7, 2, sh(k.m, -1));
  } },
  { id: 'returnbox', name: 'Book return', w: 1, h: 1, price: 260, draw(x, b) {
    floorShadow(x, b, 32); panel(x + 4, b - 44, 24, 44, k.m, 2);
    for (let j = 0; j < 6; j++) R(x + 4 + j, b - 50 + j, 24 - j * 2, 1, sh(k.m, 1)); R(x + 4, b - 44, 24, 2, sh(k.m, 1));
    inset(x + 8, b - 38, 16, 4, INK); panel(x + 7, b - 30, 18, 8, k.c); R(x + 15, b - 29, 2, 4, '#ffffff'); tri(x + 16, b - 25, 3, '#ffffff', 1);
    R(x + 6, b - 4, 20, 2, sh(k.m, -2));
  } },
  { id: 'magnifier', name: 'Giant magnifier', w: 1, h: 1, price: 420, draw(x, b) {
    floorShadow(x + 4, b, 24); oval(x + 16, b - 3, 10, 3, k.w); R(x + 15, b - 34, 3, 32, BRASS);
    disc(x + 16, b - 54, 14, BRASS); disc(x + 16, b - 54, 12, '#cfe8f4'); disc(x + 16, b - 54, 10, '#dff0f8');
    for (let n = 0; n < 6; n++) P(x + 10 + n, b - 60 + n, '#ffffff'); disc(x + 18, b - 52, 3, k.c);
  } },
  { id: 'readingpillow', name: 'Reading pillow', w: 1, h: 1, price: 200, high: 0.2, side: 'c', seat: 'cushion', flat(w, h) {
    cushion(1, 1, w - 2, h - 2, k.c, 5); cushion(4, 4, w - 8, h - 8, sh(k.c, 1), 4);
    for (const [i, j] of [[1, 1], [w - 3, 1], [1, h - 3], [w - 3, h - 3]]) R(i, j, 2, 2, k.a);
    R(w / 2 - 6, h / 2 - 3, 12, 7, k.p); R(w / 2 - 1, h / 2 - 3, 1, 7, sh(k.p, -2));
  } },
  { id: 'chesterfield', name: 'Chesterfield sofa', w: 2, h: 1, price: 1100, seat: 'cushion', draw(x, b, vw, dir) {
    if (dir % 2) return sideBox(x, b, vw, 30);
    floorShadow(x, b, vw); for (const i of [4, vw - 8]) cyl(x + i, b - 6, 4, 6, sh(k.w, -1));
    cushion(x + 4, b - 44, vw - 8, 26, k.c, 4);
    for (let r = 0; r < 3; r++) for (let i = 8 + (r % 2) * 4; i < vw - 8; i += 8) P(x + i, b - 40 + r * 7, sh(k.c, -2));
    cushion(x + 4, b - 22, vw - 8, 16, k.c, 3); cushion(x + 6, b - 24, vw / 2 - 7, 6, sh(k.c, 1), 2); cushion(x + vw / 2 + 1, b - 24, vw / 2 - 7, 6, sh(k.c, 1), 2);
    for (const i of [0, vw - 9]) { cushion(x + i, b - 34, 9, 28, sh(k.c, i ? -1 : 0), 3); ovalShade(x + i + 4, b - 34, 5, 3, sh(k.c, 1)); }
  } },
  { id: 'bust', name: 'Marble bust', w: 1, h: 1, price: 640, draw(x, b) {
    const M = '#e8e4dc'; floorShadow(x + 4, b, 24); panel(x + 8, b - 6, 16, 6, M); cyl(x + 10, b - 44, 12, 38, M); panel(x + 7, b - 48, 18, 5, M);
    for (let i = 12; i < 22; i += 3) R(x + i, b - 42, 1, 34, sh(M, -1));
    oval(x + 16, b - 53, 10, 5, M); cyl(x + 14, b - 62, 5, 8, M); ovalShade(x + 16, b - 70, 7, 8, M);
    for (let n = 0; n < 6; n++) disc(x + 11 + n * 2, b - 77 + (n % 2), 2, sh(M, 1)); P(x + 13, b - 70, sh(M, -2)); P(x + 18, b - 70, sh(M, -2)); R(x + 15, b - 66, 2, 1, sh(M, -1));
  } },
  { id: 'scholarportrait', name: "Scholar's portrait", w: 1, h: 1, layer: 'wall', price: 360, wall(x) {
    shadowWall(x + 3, 12, 26, 52); panel(x + 3, 12, 26, 52, GOLD, 2); inset(x + 6, 15, 20, 46, '#5a3a2a');
    R(x + 7, 44, 18, 17, '#f4f4f0'); R(x + 15, 44, 2, 17, sh('#f4f4f0', -1)); R(x + 13, 44, 6, 6, k.c);
    ovalShade(x + 16, 34, 6, 7, '#f0c8a0'); for (const i of [-6, -4, 4, 6]) disc(x + 16 + i, 30, 2, '#c8c8c8'); oval(x + 16, 27, 5, 2, '#a8a8a8');
    P(x + 14, 33, INK); P(x + 18, 33, INK); R(x + 15, 37, 3, 1, sh('#f0c8a0', -2));
    R(x + 10, 62, 12, 3, sh(GOLD, -1));
  } },
]);

/* ---------- pirate ship ---------- */
/** A flag on a pole, rippling; returns the middle of its cloth. */
function flag(x) {
  const cloth = sh(k.c, -3);
  R(x + 4, 8, 2, 70, k.w); sphere(x + 5, 7, 2, GOLD);
  for (let i = 0; i < 23; i++) { const y = 12 + Math.round(Math.sin(i / 4) * 2); R(x + 6 + i, y, 1, 28, i % 6 < 3 ? cloth : sh(cloth, 1)); R(x + 6 + i, y + 26, 1, 2, k.c); }
  return [x + 17, 26];
}
const FLAGS = {
  skull: ['Skull', (c, y) => {
    disc(c, y - 3, 6, '#f4f4f0'); R(c - 3, y + 2, 7, 3, '#f4f4f0'); disc(c - 2, y - 3, 1.5, INK); disc(c + 2, y - 3, 1.5, INK); P(c, y, INK);
    for (const s of [-1, 1]) line(c - 8, y + 4 + s * 3, c + 8, y + 4 - s * 3, '#f4f4f0', 2);
  }],
  swords: ['Crossed swords', (c, y) => { for (const s of [-1, 1]) { line(c - 8 * s, y + 8, c + 7 * s, y - 8, '#f4f4f0', 2); R(c - 8 * s - 2, y + 5, 5, 2, GOLD); } }],
  anchor: ['Anchor', (c, y) => {
    R(c - 1, y - 8, 2, 16, '#f4f4f0'); ring(c, y - 9, 2, '#f4f4f0'); R(c - 5, y - 5, 10, 2, '#f4f4f0');
    arc(c, y + 3, 7, 5, 0, Math.PI, '#f4f4f0', 2); for (const s of [-1, 1]) tri(c + s * 7, y, 4, '#f4f4f0', 0.6);
  }],
  kraken: ['Kraken', (c, y) => {
    ovalShade(c, y - 4, 6, 6, '#c870d8'); P(c - 2, y - 3, INK); P(c + 2, y - 3, INK);
    for (let n = 0; n < 5; n++) { const sx = c - 6 + n * 3; for (let j = 0; j < 10; j++) P(sx + Math.round(Math.sin(j / 2 + n) * 2), y + 2 + j, '#c870d8'); }
  }],
  ball: ['Poké Ball', (c, y) => ball(c, y, 8)],
  compass: ['Compass', (c, y) => {
    ring(c, y, 8, '#f4f4f0'); for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) line(c, y, c + dx * 10, y + dy * 10, dy < 0 ? '#e04848' : '#f4f4f0', 2);
    disc(c, y, 2, GOLD);
  }],
};
add('Pirate', Object.entries(FLAGS).map(([id, [name, emblem]]) => ({ set: 'flag', id: `${id}flag`, name: `${name} flag`, proper: id === 'ball', w: 1, h: 1, layer: 'wall', price: 200,
  wall(x) { const [c, y] = flag(x); emblem(c, y); } })));
add('Pirate', [
  { id: 'mast', name: 'Ship mast', w: 1, h: 1, price: 1200, draw(x, b) {
    floorShadow(x, b, 32); panel(x + 6, b - 6, 20, 6, k.w); cyl(x + 13, b - 94, 6, 88, k.w);
    for (const s of [-1, 1]) line(x + 16, b - 70, x + 16 + s * 14, b - 2, '#c8b080');
    R(x + 1, b - 58, 30, 3, k.w); cyl(x + 3, b - 56, 26, 6, k.p); for (let i = 5; i < 29; i += 6) R(x + i, b - 56, 1, 6, sh(k.p, -1));
    panel(x + 7, b - 84, 18, 8, k.w); for (let i = 8; i < 25; i += 3) R(x + i, b - 84, 1, 8, sh(k.w, -2)); R(x + 6, b - 85, 20, 2, sh(k.w, 1));
    for (let i = 0; i < 8; i++) R(x + 18 + i, b - 94 + Math.round(Math.sin(i) * 1), 1, 5, k.c);
  } },
  { id: 'cannonballs', name: 'Cannonball stack', w: 1, h: 1, price: 220, draw(x, b) {
    floorShadow(x, b, 32); wood(x + 2, b - 6, 28, 6, k.w);
    for (const [i, j] of [[7, -11], [16, -11], [25, -11], [11, -19], [21, -19], [16, -27]]) sphere(x + i, b + j, 5, '#3a3a44');
  } },
  { id: 'deckfloor', name: 'Ship deck', w: 2, h: 2, layer: 'rug', price: 300, high: 0.03, side: 'w', flat(w, h) {
    for (let j = 0; j < h; j += 8) { wood(0, j, w, 8, j % 16 ? k.w : sh(k.w, -1)); for (let i = (j % 16) ? 6 : 22; i < w; i += 32) R(i, j, 1, 8, sh(k.w, -2)); }
    for (let j = 0; j < h; j += 8) for (let i = 3; i < w; i += 16) P(i, j + 4, sh(k.m, -1));
    inset(w / 2 - 10, h / 2 - 10, 20, 20, sh(k.w, -2)); for (let n = 0; n < 4; n++) { R(w / 2 - 9 + n * 5, h / 2 - 9, 2, 18, k.w); R(w / 2 - 9, h / 2 - 9 + n * 5, 18, 2, k.w); }
  } },
  { id: 'treasuremap', name: 'Treasure map', w: 1, h: 1, layer: 'wall', price: 220, wall(x) {
    shadowWall(x + 3, 18, 26, 32);
    for (let j = 0; j < 32; j++) { const e = Math.round(hash(j, 3) * 2); R(x + 3 + e, 18 + j, 26 - e - Math.round(hash(j, 5) * 2), 1, j % 7 === 0 ? sh(PARCH, -1) : PARCH); }
    oval(x + 12, 30, 7, 6, '#9ad070'); oval(x + 21, 40, 5, 4, '#9ad070'); R(x + 9, 28, 3, 2, '#5a9a3a');
    for (let n = 0; n < 9; n++) P(x + 8 + n * 1.6, 34 + Math.round(Math.sin(n) * 2), '#a83030');
    line(x + 19, 37, x + 23, 41, '#d02828', 2); line(x + 23, 37, x + 19, 41, '#d02828', 2);
    ring(x + 24, 24, 3, sh(PARCH, -2)); P(x + 24, 21, '#d02828');
  } },
  { id: 'shipbell', name: "Ship's bell", w: 1, h: 1, price: 380, draw(x, b) {
    floorShadow(x, b, 32); for (const i of [4, 25]) wood(x + i, b - 70, 4, 70, k.w, 'y'); wood(x + 2, b - 74, 28, 5, k.w);
    R(x + 15, b - 69, 2, 5, k.m);
    for (let j = 0; j < 22; j++) { const h = Math.round(5 + (j / 22) ** 2 * 6); R(x + 16 - h, b - 64 + j, h * 2, 1, j < 3 ? sh(BRASS, 1) : j > 19 ? sh(BRASS, -1) : BRASS); }
    R(x + 7, b - 45, 18, 2, sh(BRASS, -2)); R(x + 15, b - 42, 2, 18, '#c8b080'); disc(x + 16, b - 23, 2, '#c8b080');
  } },
  { id: 'ropecoil', name: 'Rope coil', w: 1, h: 1, price: 90, high: 0.15, side: 'p', flat(w, h) {
    const ROPE = '#c8a868';
    for (let r = 13; r > 2; r -= 2.5) { ring(w / 2, h / 2, r, sh(ROPE, -1), 2); for (let a = 0; a < r * 4; a++) { const t = a / (r * 4) * Math.PI * 2; P(w / 2 + Math.cos(t) * r, h / 2 + Math.sin(t) * r, a % 3 ? ROPE : sh(ROPE, 1)); } }
    line(w / 2 + 13, h / 2, w - 1, h - 3, ROPE, 2);
  } },
  { id: 'figurehead', name: 'Figurehead', w: 1, h: 1, layer: 'wall', price: 600, wall(x) {
    shadowWall(x + 4, 14, 24, 56); wood(x + 12, 40, 12, 32, k.w, 'y');
    for (let j = 0; j < 30; j++) { const cx = x + 18 - Math.round(Math.sin(j / 30 * Math.PI) * 6); R(cx - 5, 14 + j, 10, 1, j < 3 ? sh(k.w, 1) : k.w); }
    oval(x + 10, 22, 6, 4, k.w); disc(x + 9, 21, 1.5, GOLD); R(x + 4, 24, 5, 1, sh(k.w, -2));
    for (let n = 0; n < 4; n++) tri(x + 21 + n * 2, 12 + n * 5, 5, sh(k.w, -1), 0.5);
    for (let j = 46; j < 70; j += 5) R(x + 12, j, 12, 1, sh(k.w, -2));
  } },
  { id: 'porthole', name: 'Porthole', w: 1, h: 1, layer: 'wall', price: 420, sky: true, wall(x) {
    view(x + 4, 22, 24, 24);
    for (let j = 18; j < 50; j++) for (let i = 0; i < 32; i++) { const d = Math.hypot(i + 0.5 - 16, j + 0.5 - 34); if (d >= 11.5 && d < 15) P(x + i, j, d < 12.5 ? sh(BRASS, -2) : d < 13.5 ? BRASS : sh(BRASS, 1)); else if (d >= 15 && j >= 22 && j < 46 && i >= 4 && i < 28) clear(x + i, j, 1, 1); }
    for (let a = 0; a < 8; a++) { const t = a / 8 * Math.PI * 2; P(x + 16 + Math.round(Math.cos(t) * 13), 34 + Math.round(Math.sin(t) * 13), sh(BRASS, 2)); }
    R(x + 10, 26, 2, 3, 'rgba(255,255,255,0.6)');
  } },
  { id: 'captainchair', name: "Captain's chair", w: 1, h: 1, price: 680, seat: 'cushion', draw(x, b) {
    floorShadow(x, b, 32); for (const i of [4, 25]) cyl(x + i, b - 14, 3, 14, k.w);
    wood(x + 5, b - 72, 22, 52, k.w, 'y'); cushion(x + 8, b - 66, 16, 40, k.c, 3); for (const j of [-58, -48, -38]) P(x + 16, b + j, GOLD);
    for (let i = 0; i < 22; i++) R(x + 5 + i, b - 76 + Math.round(Math.abs(i - 11) * 0.3), 1, 5, k.w); disc(x + 16, b - 76, 2.5, GOLD);
    for (const i of [1, 26]) { wood(x + i, b - 36, 5, 16, k.w, 'y'); sphere(x + i + 2, b - 37, 2.5, GOLD); }
    cushion(x + 3, b - 24, 26, 10, k.c, 3); R(x + 3, b - 14, 26, 2, GOLD);
  } },
  { id: 'maptable', name: 'Chart table', w: 2, h: 1, price: 860, glow: ['#fff4c0'], draw(x, b, vw, dir) {
    if (dir % 2) return sideBox(x, b, vw, 30);
    floorShadow(x, b, vw); for (const i of [4, vw - 9]) { cyl(x + i, b - 28, 5, 28, k.w); R(x + i - 1, b - 14, 7, 2, sh(k.w, -1)); }
    wood(x + 1, b - 32, vw - 2, 6, k.w); R(x + 6, b - 35, vw - 12, 3, PARCH); R(x + 6, b - 35, vw - 12, 1, sh(PARCH, 1));
    for (let n = 0; n < 6; n++) P(x + 12 + n * 3, b - 34, '#a83030'); R(x + 30, b - 35, 2, 2, '#d02828');
    ring(x + 46, b - 38, 3, BRASS); cyl(x + 10, b - 42, 4, 8, '#f4f0e0'); R(x + 11, b - 45, 2, 3, '#fff4c0');
  } },
  { id: 'coinsack', name: 'Coin sack', w: 1, h: 1, price: 900, draw(x, b) {
    floorShadow(x, b, 32); const SACK = '#b89868';
    for (let j = 0; j < 30; j++) { const h = Math.round(13 * Math.sin((j + 4) / 34 * Math.PI)); R(x + 15 - h, b - 30 + j, h * 2, 1, j < 4 ? sh(SACK, 1) : j > 26 ? sh(SACK, -1) : SACK); }
    speckle(x + 3, b - 28, 24, 26, sh(SACK, -1), 6, 0.1);
    oval(x + 15, b - 30, 9, 3, GOLD); for (let n = 0; n < 9; n++) disc(x + 8 + hash(n, 2) * 14, b - 32 - hash(n, 3) * 4, 2, n % 3 ? GOLD : sh(GOLD, 1));
    for (const [i, j] of [[24, -4], [28, -3], [26, -6], [4, -3]]) { oval(x + i, b + j, 2.5, 1.2, GOLD); P(x + i - 1, b + j, sh(GOLD, 2)); }
    R(x + 18, b - 36, 3, 3, '#58c8e8');
  } },
  { id: 'parrotperch', name: 'Parrot perch', w: 1, h: 1, price: 520, draw(x, b) {
    floorShadow(x + 4, b, 24); oval(x + 16, b - 3, 9, 3, k.w); R(x + 15, b - 52, 3, 50, k.w); R(x + 4, b - 52, 24, 3, k.w);
    cyl(x + 6, b - 50, 4, 4, SILVER);
    const BIRD = '#e04040'; ovalShade(x + 20, b - 62, 5, 8, BIRD); disc(x + 21, b - 72, 4, BIRD); P(x + 22, b - 73, INK); P(x + 21, b - 74, '#ffffff');
    tri(x + 25, b - 72, 3, '#f8d030', 0.4); R(x + 25, b - 72, 3, 2, '#f8d030');
    leaf(x + 18, b - 60, 3, 6, '#58b848', 0.3); for (let j = 0; j < 8; j++) R(x + 19 + Math.floor(j / 3), b - 54 + j, 2, 1, j > 4 ? '#4a98d8' : BIRD);
  } },
  { id: 'shiplantern', name: 'Ship lantern', w: 1, h: 1, layer: 'wall', price: 260, glow: ['#ffd890'], wall(x) {
    shadowWall(x + 6, 14, 8, 4); R(x + 6, 14, 14, 3, k.m); R(x + 18, 14, 2, 8, k.m);
    panel(x + 13, 22, 12, 3, k.m); glass(x + 14, 25, 10, 18, '#ffd890'); for (const i of [14, 23]) R(x + i, 25, 1, 18, k.m);
    R(x + 18, 31, 2, 6, '#fff4c0'); panel(x + 12, 43, 14, 3, k.m); tri(x + 19, 17, 5, k.m, 0.8);
  } },
  { id: 'ropeladder', name: 'Rope ladder', w: 1, h: 1, layer: 'wall', price: 140, wall(x) {
    const ROPE = '#c8a868'; R(x + 4, 4, 24, 3, k.w);
    for (const i of [8, 23]) for (let j = 6; j < 90; j++) P(x + i + Math.round(Math.sin(j / 9) * 1), j, (j >> 1) % 2 ? ROPE : sh(ROPE, -1));
    for (let j = 14; j < 88; j += 10) wood(x + 8, j, 16, 3, k.w);
  } },
  { id: 'spyglass', name: 'Spyglass', w: 1, h: 1, price: 380, draw(x, b) {
    floorShadow(x, b, 32); for (const i of [-10, 0, 10]) line(x + 16, b - 34, x + 16 + i, b - 1, k.w, 2);
    line(x + 4, b - 30, x + 28, b - 52, BRASS, 6); line(x + 4, b - 30, x + 14, b - 39, sh(BRASS, -1), 5); line(x + 20, b - 45, x + 28, b - 52, sh(BRASS, 1), 7);
    for (const f of [0.35, 0.65]) { const i = 4 + 24 * f, j = -30 - 22 * f; R(x + i, b + j - 4, 2, 8, sh(BRASS, -2)); }
    disc(x + 29, b - 53, 3, '#cfe8f4');
  } },
  { id: 'shipbottle', name: 'Ship in a bottle', w: 1, h: 1, price: 320, draw(x, b) {
    floorShadow(x + 2, b, 28); panel(x + 4, b - 6, 24, 6, k.w); for (const i of [7, 23]) R(x + i, b - 10, 3, 4, k.w);
    glass(x + 3, b - 26, 22, 16, '#d8eef0'); for (let j = 0; j < 6; j++) R(x + 25 + Math.floor(j / 3), b - 21 + j, 3, 1, '#d8eef0'); R(x + 27, b - 21, 4, 6, '#a87838');
    R(x + 4, b - 13, 20, 2, SEA); R(x + 8, b - 16, 12, 3, k.w); R(x + 13, b - 24, 1, 8, k.w); tri(x + 15, b - 24, 6, k.p, 0.8); R(x + 13, b - 25, 3, 1, k.c);
  } },
  { id: 'wantedposter', name: 'Wanted poster', w: 1, h: 1, layer: 'wall', price: 100, wall(x) {
    shadowWall(x + 3, 14, 26, 40); R(x + 3, 14, 26, 40, PARCH); R(x + 3, 14, 26, 1, sh(PARCH, 1)); speckle(x + 3, 14, 26, 40, sh(PARCH, -1), 4, 0.06);
    say('WANTED', x + 4, 16, INK); inset(x + 8, 23, 16, 16, sh(PARCH, -1));
    disc(x + 16, 32, 6, '#f0e0b0'); tri(x + 11, 23, 5, '#f0e0b0', 0.5); tri(x + 21, 23, 5, '#f0e0b0', 0.5); disc(x + 16, 28, 1.5, GOLD); P(x + 14, 32, INK); P(x + 18, 32, INK);
    R(x + 8, 42, 16, 2, sh(PARCH, -2)); R(x + 10, 46, 12, 2, '#a83030'); disc(x + 16, 15, 1, k.m);
  } },
  { id: 'cutlasses', name: 'Crossed cutlasses', w: 1, h: 1, layer: 'wall', price: 300, wall(x) {
    plank(x + 4, 26, 24, 22);
    for (const s of [-1, 1]) { for (let n = 0; n < 30; n++) { const f = n / 30; R(x + 16 - s * 13 + s * 26 * f, 58 - f * 40 - Math.sin(f * Math.PI) * 4, 2, 2, n > 26 ? sh(SILVER, 1) : SILVER); } R(x + 16 - s * 12 - 3, 52, 6, 2, GOLD); arc(x + 16 - s * 12, 56, 4, 4, Math.PI * 0.1, Math.PI * 0.9, GOLD); }
  } },
  { id: 'xmarks', name: 'X marks the spot', w: 2, h: 2, layer: 'rug', price: 260, high: 0.03, side: 'p', flat(w, h) {
    R(0, 0, w, h, sh(SAND, -1)); R(2, 2, w - 4, h - 4, SAND); speckle(2, 2, w - 4, h - 4, sh(SAND, -1), 3, 0.08);
    for (let n = 0; n < 14; n++) R(6 + n * 3, 8 + n * 2.6 + Math.round(Math.sin(n) * 3), 2, 1, '#a83030');
    line(w - 18, h - 18, w - 8, h - 8, '#d02828', 3); line(w - 8, h - 18, w - 18, h - 8, '#d02828', 3);
    for (const [i, j] of [[10, h - 10], [w - 12, 10]]) { disc(i, j, 3, '#f0e8d8'); P(i, j, sh(SAND, -2)); }
  } },
]);

/* ---------- space station ---------- */
/** A model planet on a stand under a metal meridian; returns its middle. */
function planetStand(x, b) {
  floorShadow(x + 4, b, 24); panel(x + 8, b - 6, 16, 6, k.m); R(x + 15, b - 34, 2, 28, k.m);
  return [x + 16, b - 50];
}
const PLANETS = {
  red: ['Red planet', (c, y) => { globe(c, y, 13, (i, j) => hash(Math.floor(i / 3) + 3, Math.floor(j / 3)) < 0.2 ? '#a84828' : '#d86838'); for (const [i, j] of [[-4, -3], [5, 4], [2, -7]]) ring(c + i, y + j, 2, '#a84828'); }],
  ringed: ['Ringed planet', (c, y) => {
    arc(c, y, 18, 5, Math.PI, Math.PI * 2, '#c8b080', 2);
    globe(c, y, 11, (i, j) => [ '#e0c898', '#d8b880', '#e8d8a8'][Math.floor((j + 11) / 4) % 3]);
    arc(c, y, 18, 5, 0, Math.PI, '#e8d8a8', 2);
  }],
  banded: ['Banded planet', (c, y) => { globe(c, y, 13, (i, j) => ['#e8c8a0', '#c88858', '#f0dcc0', '#b87848'][Math.floor((j + 13) / 3.5) % 4]); oval(c + 4, y + 4, 3, 2, '#c84838'); }],
  blue: ['Blue planet', (c, y) => { globe(c, y, 13, (i, j) => Math.abs(Math.sin(j / 3 + i / 9)) < 0.25 ? '#a8d8f8' : '#4a78d8'); }],
  green: ['Green planet', (c, y) => { globe(c, y, 13, (i, j) => hash(Math.floor((i + 13) / 5), Math.floor((j + 13) / 5)) < 0.45 ? '#58a848' : '#3a88d0'); for (const [i, j] of [[-6, -6], [3, 2]]) oval(c + i, y + j, 4, 1.5, '#ffffff'); }],
  moon: ['Moon', (c, y) => { globe(c, y, 13, () => '#c8c8c8'); for (const [i, j, r] of [[-4, -4, 3], [5, 2, 2], [-1, 6, 2], [6, -6, 1.5]]) { disc(c + i, y + j, r, '#a8a8a8'); P(c + i - 1, y + j - 1, '#909090'); } }],
};
add('Space', Object.entries(PLANETS).map(([id, [name, paint]]) => ({ set: 'planet', id: `${id}planet`, name: `${name} model`, w: 1, h: 1, price: 560,
  draw(x, b) { const [c, y] = planetStand(x, b); arc(c, y, 15, 15, Math.PI * 0.5, Math.PI * 1.5, k.m, 2); paint(c, y); R(c - 1, y - 17, 2, 3, k.a); } })));
add('Space', [
  { id: 'spacesuit', name: 'Space suit', w: 1, h: 1, price: 1100, draw(x, b) {
    const S = '#eef0f4'; floorShadow(x, b, 32); panel(x + 6, b - 6, 20, 6, k.m);
    for (const i of [9, 17]) { cyl(x + i, b - 32, 7, 26, S); R(x + i, b - 12, 7, 3, k.c); }
    panel(x + 4, b - 62, 24, 32, S, 2); R(x + 8, b - 52, 16, 10, sh(S, -1)); for (let n = 0; n < 3; n++) R(x + 10 + n * 4, b - 50, 2, 2, RAINBOW[n * 2]);
    R(x + 4, b - 44, 24, 2, k.c);
    for (const i of [0, 27]) { cyl(x + i, b - 60, 5, 24, S); R(x + i, b - 38, 5, 4, k.c); }
    disc(x + 16, b - 72, 11, S); disc(x + 16, b - 71, 8, '#2a3a5a'); oval(x + 13, b - 74, 3, 2, '#c8d8f8'); disc(x + 16, b - 71, 8, 'rgba(240,192,64,0.18)');
  } },
  { id: 'spacehelmet', name: 'Helmet display', w: 1, h: 1, price: 600, draw(x, b) {
    const S = '#eef0f4'; floorShadow(x + 2, b, 28); panel(x + 6, b - 30, 20, 30, k.p); R(x + 6, b - 30, 20, 2, k.a);
    R(x + 8, b - 18, 16, 3, k.a);
    disc(x + 16, b - 46, 14, S); R(x + 4, b - 36, 24, 5, sh(S, -1)); disc(x + 16, b - 47, 10, GOLD); oval(x + 13, b - 50, 4, 3, '#fff4c0');
    for (const i of [3, 29]) disc(x + i, b - 46, 2, k.c);
  } },
  { id: 'spacewindow', name: 'Space window', w: 2, h: 1, layer: 'wall', price: 900, glow: ['#e8ecff'], wall(x) {
    shadowWall(x + 3, 10, 58, 56); panel(x + 3, 10, 58, 56, k.m, 3); R(x + 8, 15, 48, 46, SPACE);
    for (let n = 0; n < 40; n++) P(x + 8 + Math.floor(hash(n, 7) * 48), 15 + Math.floor(hash(n, 8) * 46), n % 5 ? '#e8ecff' : '#a8b8f8');
    globe(x + 42, 48, 12, (i, j) => hash(Math.floor((i + 12) / 5), Math.floor((j + 12) / 4)) < 0.45 ? '#58a848' : '#3a88d0'); R(x + 6, 58, 52, 3, k.m);
    R(x + 31, 15, 2, 46, k.m); for (const [i, j] of [[5, 12], [57, 12], [5, 62], [57, 62]]) P(x + i, j, sh(k.m, 2));
    oval(x + 18, 26, 5, 2, '#c8a8f8');
  } },
  { id: 'commandchair', name: 'Command chair', w: 1, h: 1, price: 900, seat: 'cushion', glow: ['#68e8a8'], draw(x, b) {
    floorShadow(x, b, 32); oval(x + 16, b - 3, 12, 3, k.m); cyl(x + 13, b - 18, 6, 15, k.m);
    for (let j = 0; j < 48; j++) { const h = 9 - Math.round(Math.abs(j - 20) * 0.08); R(x + 16 - h, b - 70 + j, h * 2, 1, j < 3 ? sh(k.c, 1) : k.c); }
    R(x + 9, b - 66, 14, 2, k.a); cushion(x + 4, b - 26, 24, 8, k.c, 2);
    for (const i of [0, 24]) { panel(x + i, b - 36, 8, 10, k.m); R(x + i + 2, b - 34, 4, 2, '#68e8a8'); P(x + i + 3, b - 31, '#e04848'); }
  } },
  { id: 'navdesk', name: 'Navigation console', w: 2, h: 1, price: 1200, glow: ['#68e8a8', '#68b8f0'], draw(x, b, vw, dir) {
    if (dir % 2) return sideBox(x, b, vw, 34);
    floorShadow(x, b, vw); panel(x + 2, b - 30, vw - 4, 30, k.m, 2); R(x + 4, b - 6, vw - 8, 2, k.a);
    for (let j = 0; j < 10; j++) R(x + 2 + j * 0.4, b - 40 + j, vw - 4 - j * 0.8, 1, j < 2 ? sh(k.m, 1) : sh(k.m, -1));
    for (let n = 0; n < (vw - 12) / 5; n++) disc(x + 7 + n * 5, b - 35, 1.5, RAINBOW[n % 7]);
    for (const [i, c] of [[6, '#68e8a8'], [vw / 2 + 2, '#68b8f0']]) { inset(x + i, b - 66, vw / 2 - 8, 22, '#14243a'); R(x + i + 1, b - 44, vw / 2 - 10, 4, k.m); for (let n = 0; n < vw / 2 - 12; n++) P(x + i + 2 + n, b - 56 + Math.round(Math.sin(n / 2 + i) * 5), c); }
    ring(x + vw / 2 + 10, b - 56, 6, '#68b8f0');
  } },
  { id: 'starfloor', name: 'Starfield floor', w: 2, h: 2, layer: 'rug', price: 320, high: 0.03, side: 'm', glow: ['#e8ecff'], flat(w, h) {
    R(0, 0, w, h, k.m); R(2, 2, w - 4, h - 4, SPACE);
    for (let n = 0; n < 50; n++) P(3 + Math.floor(hash(n, 1) * (w - 6)), 3 + Math.floor(hash(n, 2) * (h - 6)), n % 4 ? '#e8ecff' : '#a8b8f8');
    const C = [[12, 14], [22, 10], [32, 18], [44, 14], [40, 30], [28, 36]];
    for (let n = 1; n < C.length; n++) line(C[n - 1][0], C[n - 1][1], C[n][0], C[n][1], '#5a6aa8');
    for (const [i, j] of C) { P(i, j, '#ffffff'); P(i - 1, j, '#e8ecff'); P(i + 1, j, '#e8ecff'); P(i, j - 1, '#e8ecff'); P(i, j + 1, '#e8ecff'); }
    oval(w * 0.7, h * 0.75, 8, 4, '#4a3a8a'); oval(w * 0.7, h * 0.75, 4, 2, '#8a6ad8');
  } },
  { id: 'meteorite', name: 'Meteorite', w: 1, h: 1, price: 700, glow: ['g'], draw(x, b) {
    floorShadow(x, b, 32); panel(x + 6, b - 10, 20, 10, k.m); R(x + 10, b - 6, 12, 2, k.a);
    for (let j = 0; j < 26; j++) { const h = Math.round(Math.sqrt(1 - ((j - 14) / 15) ** 2) * 13 + Math.sin(j) * 1.5); R(x + 16 - h, b - 36 + j, h * 2, 1, j < 4 ? '#6a5a5a' : '#4a3e40'); }
    speckle(x + 4, b - 34, 24, 24, '#3a3032', 4, 0.15);
    line(x + 10, b - 30, x + 16, b - 22, k.g); line(x + 16, b - 22, x + 14, b - 14, k.g); line(x + 16, b - 22, x + 23, b - 26, k.g);
  } },
  { id: 'ufolamp', name: 'UFO lamp', w: 1, h: 1, price: 460, glow: ['#c8f8d8'], draw(x, b) {
    floorShadow(x + 4, b, 24); oval(x + 16, b - 3, 8, 3, k.m);
    for (let j = 0; j < 40; j++) { const h = Math.round(3 + j * 0.2); R(x + 16 - h, b - 44 + j, h * 2, 1, 'rgba(200,248,216,0.35)'); }
    oval(x + 16, b - 48, 14, 4, k.m); oval(x + 16, b - 49, 13, 3, sh(k.m, 1)); for (let n = 0; n < 6; n++) disc(x + 5 + n * 4.4, b - 47, 1, n % 2 ? '#c8f8d8' : k.a);
    disc(x + 16, b - 53, 6, '#a8e8f8'); R(x + 10, b - 53, 12, 1, sh(k.m, -1)); P(x + 14, b - 57, '#ffffff');
    oval(x + 16, b - 44, 6, 1.5, '#c8f8d8');
  } },
  { id: 'alienplant', name: 'Alien plant', w: 1, h: 1, price: 360, glow: ['#f0a0ff'], draw(x, b) {
    floorShadow(x + 4, b, 24); for (let j = 0; j < 14; j++) { const h = 8 - Math.round(j * 0.15); R(x + 16 - h, b - 14 + j, h * 2, 1, j < 2 ? sh(k.m, 1) : k.m); }
    oval(x + 16, b - 14, 8, 2, '#3a2a4a');
    for (const [dx, h, n] of [[-6, 40, 0], [0, 58, 1], [6, 46, 2], [-3, 26, 3], [4, 30, 4]]) {
      let px = x + 16, py = b - 14;
      for (let s = 0; s < h; s++) { px = x + 16 + dx * (s / h) + Math.sin(s / 6 + n) * 2; py = b - 14 - s; R(px, py, 2, 1, '#6a3a9a'); }
      sphere(px + 1, py - 2, 3, '#f0a0ff'); P(px, py - 4, '#ffffff');
    }
  } },
  { id: 'oxygentanks', name: 'Oxygen tanks', w: 1, h: 1, price: 380, draw(x, b) {
    floorShadow(x, b, 32); panel(x + 3, b - 52, 26, 3, k.m); R(x + 4, b - 49, 2, 49, k.m); R(x + 26, b - 49, 2, 49, k.m);
    for (const [i, c] of [[7, '#e8ecf0'], [17, k.c]]) { cyl(x + i, b - 44, 9, 44, c); oval(x + i + 4.5, b - 44, 4.5, 2, sh(c, 1)); R(x + i + 3, b - 50, 3, 6, SILVER); disc(x + i + 4.5, b - 30, 2.5, '#ffffff'); P(x + i + 4, b - 31, '#e04848'); }
    R(x + 4, b - 24, 24, 2, k.a);
  } },
  { id: 'solarpanel', name: 'Solar panel', w: 2, h: 1, layer: 'wall', price: 420, wall(x) {
    shadowWall(x + 2, 18, 60, 36); panel(x + 2, 18, 60, 36, SILVER, 2);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) { const cx = x + 5 + c * 9.5, cy = 21 + r * 10.5; R(cx, cy, 8, 9, '#2a4a8a'); R(cx, cy, 8, 1, '#5a7ac8'); for (let n = 0; n < 3; n++) P(cx + 1 + n * 3, cy + 1 + n * 3, '#8aa8e8'); }
    R(x + 30, 54, 4, 14, k.m);
  } },
  { id: 'moonrock', name: 'Moon rock case', w: 1, h: 1, price: 640, draw(x, b) {
    floorShadow(x, b, 32); panel(x + 4, b - 34, 24, 34, k.p); R(x + 4, b - 34, 24, 2, k.a); R(x + 8, b - 20, 16, 4, k.a);
    glass(x + 5, b - 64, 22, 30, '#e0eef8');
    for (let j = 0; j < 12; j++) { const h = Math.round(Math.sqrt(1 - ((j - 6) / 7) ** 2) * 8); R(x + 16 - h, b - 47 + j, h * 2, 1, j < 3 ? '#b8b8b8' : '#989898'); }
    for (const [i, j] of [[-3, -43], [3, -40]]) disc(x + 16 + i, b + j, 1.5, '#7a7a7a');
    R(x + 5, b - 64, 22, 1, sh('#e0eef8', -2));
  } },
  { id: 'moonrover', name: 'Moon rover', w: 2, h: 1, price: 1300, draw(x, b, vw, dir) {
    if (dir % 2) return sideBox(x, b, vw, 24);
    floorShadow(x, b, vw);
    for (const i of [10, vw / 2, vw - 10]) { disc(x + i, b - 7, 7, '#3a3a44'); disc(x + i, b - 7, 4, SILVER); disc(x + i, b - 7, 1.5, k.m); }
    panel(x + 2, b - 22, vw - 4, 8, SILVER); R(x + 2, b - 16, vw - 4, 2, k.c);
    for (const i of [12, 24]) { cushion(x + i, b - 32, 10, 10, k.p, 2); }
    R(x + vw - 18, b - 40, 2, 18, k.m); disc(x + vw - 17, b - 44, 6, GOLD); disc(x + vw - 17, b - 44, 4, sh(GOLD, 1)); R(x + vw - 17, b - 46, 1, 3, k.m);
    R(x + 6, b - 34, 2, 12, k.m); R(x + 3, b - 34, 8, 2, k.c);
  } },
  { id: 'foodpods', name: 'Space food dispenser', w: 1, h: 1, price: 680, glow: ['#68e8a8'], draw(x, b) {
    floorShadow(x, b, 32); panel(x + 2, b - 70, 28, 70, k.m, 2); inset(x + 5, b - 64, 22, 30, '#1a2a3a');
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { const px = x + 7 + c * 7, py = b - 62 + r * 10; R(px, py, 5, 8, RAINBOW[(r * 3 + c) % 7]); R(px, py, 5, 2, SILVER); P(px + 2, py + 4, '#ffffff'); }
    R(x + 7, b - 30, 18, 4, '#1a2a3a'); R(x + 8, b - 29, 10, 2, '#68e8a8'); inset(x + 8, b - 20, 16, 10, sh(k.m, -2));
    R(x + 4, b - 72, 24, 2, k.a);
  } },
  { id: 'capsulebed', name: 'Capsule bed', w: 1, h: 2, price: 1100, high: 0.45, side: 'm', seat: 'bed', glow: ['#a8e8f8'], flat(w, h) {
    cushion(0, 0, w, h, k.m, 8); cushion(3, 3, w - 6, h - 6, sh(k.m, 1), 6);
    cushion(5, 6, w - 10, 12, '#ffffff', 4); cushion(4, 20, w - 8, h - 26, k.c, 3);
    for (let j = 22; j < h - 8; j += 6) R(6, j, w - 12, 1, sh(k.c, -1));
    for (let j = 4; j < h / 2; j++) for (let i = 3; i < w - 3; i++) if ((i + j) % 9 === 0) P(i, j, 'rgba(255,255,255,0.4)');
    R(w / 2 - 4, h - 5, 8, 2, '#a8e8f8');
  } },
  { id: 'lander', name: 'Lunar lander', w: 1, h: 1, price: 1400, draw(x, b) {
    floorShadow(x, b, 32);
    for (const s of [-1, 1]) { line(x + 16 + s * 8, b - 30, x + 16 + s * 14, b - 3, SILVER, 2); oval(x + 16 + s * 14, b - 2, 3, 1.5, SILVER); }
    panel(x + 5, b - 40, 22, 14, GOLD); speckle(x + 6, b - 39, 20, 12, sh(GOLD, 1), 3, 0.15); R(x + 13, b - 28, 6, 4, k.m);
    for (let j = 0; j < 20; j++) { const h = 9 - Math.round(Math.abs(j - 10) * 0.3); R(x + 16 - h, b - 60 + j, h * 2, 1, j < 2 ? '#f4f4f8' : '#d8dce4'); }
    disc(x + 12, b - 52, 2.5, INK); R(x + 18, b - 56, 5, 2, k.c);
    R(x + 15, b - 70, 1, 10, k.m); disc(x + 15, b - 70, 3, SILVER);
  } },
  { id: 'constellation', name: 'Constellation map', w: 2, h: 1, layer: 'wall', price: 360, glow: ['#fff4c0'], wall(x) {
    shadowWall(x + 4, 14, 56, 46); panel(x + 4, 14, 56, 46, k.m, 2); R(x + 7, 17, 50, 40, SPACE);
    const S = [[14, 46], [20, 34], [30, 28], [40, 32], [46, 22], [50, 44], [36, 46]];
    for (let n = 1; n < S.length; n++) line(x + S[n - 1][0], S[n - 1][1], x + S[n][0], S[n][1], '#4a5a98');
    for (const [i, j] of S) { P(x + i, j, '#fff4c0'); P(x + i - 1, j, '#c8b878'); P(x + i + 1, j, '#c8b878'); P(x + i, j - 1, '#c8b878'); P(x + i, j + 1, '#c8b878'); }
    for (let n = 0; n < 25; n++) P(x + 8 + Math.floor(hash(n, 4) * 48), 18 + Math.floor(hash(n, 5) * 38), '#6a7ab8');
  } },
  { id: 'beacon', name: 'Signal beacon', w: 1, h: 1, price: 420, glow: ['#ff6060'], draw(x, b) {
    floorShadow(x + 4, b, 24); panel(x + 8, b - 10, 16, 10, k.m);
    for (const s of [-1, 1]) line(x + 16 + s * 7, b - 10, x + 16 + s * 1, b - 80, k.m);
    for (let j = 16; j < 78; j += 9) { const w2 = Math.round(7 - j * 0.08); line(x + 16 - w2, b - j, x + 16 + w2, b - j - 7, sh(k.m, 1)); R(x + 16 - w2, b - j, w2 * 2, 1, k.m); }
    disc(x + 16, b - 84, 4, '#ff6060'); disc(x + 15, b - 85, 2, '#ffd0d0');
    for (const s of [-1, 1]) arc(x + 16, b - 84, 8, 8, s > 0 ? -0.6 : Math.PI - 0.6, s > 0 ? 0.6 : Math.PI + 0.6, sh(k.a, 1));
  } },
  { id: 'planetrug', name: 'Planet rug', w: 2, h: 2, layer: 'rug', price: 300, high: 0.04, side: 'c', flat(w, h) {
    oval(w / 2, h / 2, w / 2 - 1, h / 4, sh(k.a, -1)); oval(w / 2, h / 2, w / 2 - 4, h / 4 - 3, sh(k.a, 1));
    oval(w / 2, h / 2, w / 2 - 8, h / 4 - 6, sh(k.a, -2));
    globe(w / 2, h / 2, 18, (i, j) => [k.c, sh(k.c, 1), k.p][Math.floor((j + 18) / 6) % 3]);
    for (let i = -24; i <= 24; i++) { const y = h / 2 + Math.round(Math.sqrt(Math.max(0, 1 - (i / 28) ** 2)) * (h / 4 - 3)); if (Math.abs(i) < 26) R(w / 2 + i, y - 1, 1, 2, sh(k.a, 1)); }
  } },
]);

/* ---------- farm ---------- */
/** A slatted produce crate; returns its top. */
function crate(x, b) {
  floorShadow(x, b, 32); wood(x + 2, b - 24, 28, 24, k.w);
  for (const j of [-16, -8]) R(x + 2, b + j, 28, 1, sh(k.w, -2));
  for (const i of [2, 27]) R(x + i, b - 24, 3, 24, sh(k.w, -1));
  panel(x + 10, b - 15, 12, 6, k.p);
  return b - 24;
}
const CROPS = {
  apple: ['Apple', (x, t) => { for (let r = 0; r < 2; r++) for (let i = 0; i < 4 - r; i++) { const cx = x + 8 + i * 6 + r * 3; sphere(cx, t - 3 - r * 5, 3.5, '#d83030'); R(cx, t - 7 - r * 5, 1, 2, '#6a4a2a'); } disc(x + 16, t + 12, 2, '#d83030'); }],
  carrot: ['Carrot', (x, t) => { for (let n = 0; n < 6; n++) { const cx = x + 6 + n * 4; R(cx, t - 4 - (n % 2) * 3, 3, 6, '#f08030'); for (let l = -1; l <= 1; l++) line(cx + 1, t - 5 - (n % 2) * 3, cx + 1 + l * 2, t - 13 - (n % 2) * 3, '#58b848'); } R(x + 14, t + 10, 5, 2, '#f08030'); }],
  corn: ['Corn', (x, t) => { for (let n = 0; n < 4; n++) { const cx = x + 7 + n * 6; for (let j = 0; j < 14; j++) R(cx + Math.round(j * 0.15), t - 3 - j, 4, 1, j % 2 ? '#f8d850' : '#f0c030'); leaf(cx, t - 6, 2, 6, '#78b848', -0.4); } R(x + 14, t + 10, 4, 3, '#f8d850'); }],
  tomato: ['Tomato', (x, t) => { for (let r = 0; r < 2; r++) for (let i = 0; i < 4 - r; i++) { const cx = x + 8 + i * 6 + r * 3, cy = t - 3 - r * 5; sphere(cx, cy, 3.5, '#e83828'); for (const [dx, dy] of [[-1, -3], [1, -3], [0, -4]]) P(cx + dx, cy + dy, '#3a8a2a'); } disc(x + 16, t + 12, 2, '#e83828'); }],
  potato: ['Potato', (x, t) => { for (let r = 0; r < 2; r++) for (let i = 0; i < 4 - r; i++) { const cx = x + 8 + i * 6 + r * 3; ovalShade(cx, t - 3 - r * 4, 4, 3, '#c8a068'); P(cx - 1, t - 4 - r * 4, '#8a6a3a'); } oval(x + 16, t + 12, 3, 2, '#c8a068'); }],
  cabbage: ['Cabbage', (x, t) => { for (let i = 0; i < 3; i++) { const cx = x + 9 + i * 7; foliage(cx, t - 5, 5, '#78c058', i); disc(cx, t - 5, 2, '#b8e098'); } disc(x + 16, t + 12, 2, '#78c058'); }],
};
add('Farm', Object.entries(CROPS).map(([id, [name, heap]]) => ({ set: 'crate', id: `${id}crate`, name: `${name} crate`, w: 1, h: 1, price: 240,
  draw(x, b) { heap(x, crate(x, b)); } })));
add('Farm', [
  { id: 'barndoor', name: 'Barn doors', w: 2, h: 1, layer: 'wall', price: 600, wall(x) {
    shadowWall(x + 4, 6, 56, 72); wood(x + 4, 6, 56, 72, k.c, 'y'); R(x + 31, 6, 2, 72, sh(k.c, -2));
    for (const i of [4, 33]) { R(x + i, 6, 27, 3, '#f4f0e8'); R(x + i, 75, 27, 3, '#f4f0e8'); R(x + i, 6, 3, 72, '#f4f0e8'); R(x + i + 24, 6, 3, 72, '#f4f0e8'); line(x + i + 2, 8, x + i + 25, 76, '#f4f0e8', 3); line(x + i + 25, 8, x + i + 2, 76, '#f4f0e8', 3); }
    R(x + 2, 2, 60, 4, k.m); for (const i of [28, 35]) R(x + i, 40, 2, 6, k.m);
  } },
  { id: 'silo', name: 'Silo', w: 1, h: 1, price: 900, draw(x, b) {
    floorShadow(x, b, 32); cyl(x + 4, b - 74, 24, 74, k.c);
    for (const j of [-62, -44, -26, -8]) R(x + 4, b + j, 24, 2, sh(k.c, -2));
    for (let j = 0; j < 16; j++) { const h = Math.round(Math.sqrt(1 - ((16 - j) / 16) ** 2) * 13); R(x + 16 - h, b - 90 + j, h * 2, 1, j < 4 ? sh(k.m, 1) : k.m); }
    R(x + 12, b - 70, 1, 66, sh(k.c, -1)); for (let j = -66; j < -4; j += 4) R(x + 11, b + j, 3, 1, sh(k.m, -1));
    R(x + 14, b - 94, 4, 4, k.m);
  } },
  { id: 'trough', name: 'Water trough', w: 2, h: 1, price: 320, draw(x, b, vw) {
    floorShadow(x, b, vw); for (const i of [4, vw - 8]) { R(x + i, b - 8, 4, 8, k.w); }
    for (let j = 0; j < 16; j++) { const h = Math.round(vw / 2 - 3 - (16 - j) * 0.1 - j * 0.15); R(x + vw / 2 - h, b - 24 + j, h * 2, 1, j < 2 ? sh(k.w, 1) : k.w); }
    for (const j of [-18, -12]) R(x + 4, b + j, vw - 8, 1, sh(k.w, -2));
    R(x + 4, b - 24, vw - 8, 3, SEA); R(x + 8, b - 24, vw / 3, 1, '#a8d8f8');
  } },
  { id: 'coop', name: 'Chicken coop', w: 1, h: 1, price: 680, draw(x, b) {
    floorShadow(x, b, 32); for (const i of [4, 25]) R(x + i, b - 18, 3, 18, k.w);
    wood(x + 3, b - 52, 26, 34, k.w); for (let j = 0; j < 12; j++) R(x + 1 + j, b - 64 + j, 30 - j * 2, 1, k.c);
    for (let j = 0; j < 12; j++) R(x + 16 - j * 1.25, b - 64 + j, j * 2.5, 1, sh(k.c, j % 3 ? 0 : -1));
    inset(x + 11, b - 40, 10, 12, INK); line(x + 21, b - 28, x + 30, b - 2, sh(k.w, 1), 3);
    ovalShade(x + 16, b - 46, 4, 3, '#f4f4f0'); P(x + 14, b - 47, INK); R(x + 12, b - 46, 2, 1, '#f8b040'); R(x + 15, b - 50, 2, 2, '#e04848');
  } },
  { id: 'tractor', name: 'Tractor', w: 2, h: 1, price: 1500, draw(x, b, vw, dir) {
    if (dir % 2) return sideBox(x, b, vw, 30);
    floorShadow(x, b, vw);
    panel(x + 16, b - 32, vw - 22, 14, k.c, 2); R(x + vw - 8, b - 30, 4, 10, SILVER); for (let j = 0; j < 4; j++) R(x + vw - 30 + j * 4, b - 30, 2, 10, sh(k.c, -1));
    panel(x + 6, b - 56, 18, 26, k.c, 2); inset(x + 9, b - 52, 12, 12, '#cfe8f4'); R(x + 4, b - 58, 22, 3, sh(k.c, -1));
    cyl(x + vw - 18, b - 44, 3, 12, '#3a3a44');
    for (const [i, r] of [[14, 13], [vw - 12, 8]]) { disc(x + i, b - r, r, '#3a3a44'); for (let a = 0; a < 12; a++) P(x + i + Math.round(Math.cos(a / 12 * Math.PI * 2) * r), b - r + Math.round(Math.sin(a / 12 * Math.PI * 2) * r), '#5a5a64'); disc(x + i, b - r, r * 0.5, '#f8d030'); disc(x + i, b - r, 1.5, k.m); }
  } },
  { id: 'windpump', name: 'Windpump', w: 1, h: 1, price: 820, draw(x, b) {
    floorShadow(x, b, 32);
    for (const s of [-1, 1]) line(x + 16 + s * 12, b - 1, x + 16 + s * 3, b - 64, k.m, 2);
    for (let j = 10; j < 64; j += 10) { const w2 = Math.round(12 - j * 0.14); line(x + 16 - w2, b - j, x + 16 + w2 - 1, b - j - 10, sh(k.m, 1)); R(x + 16 - w2, b - j, w2 * 2, 1, k.m); }
    const cy = b - 74; for (let n = 0; n < 12; n++) { const a = n / 12 * Math.PI * 2; line(x + 16, cy, x + 16 + Math.cos(a) * 14, cy + Math.sin(a) * 14, n % 2 ? k.p : sh(k.p, -1), 2); }
    ring(x + 16, cy, 14, k.m); sphere(x + 16, cy, 3, k.c); R(x + 18, cy - 2, 12, 3, k.m); tri(x + 30, cy - 8, 12, k.c, 0.4);
  } },
  { id: 'pitchfork', name: 'Pitchfork and rake', w: 1, h: 1, price: 160, draw(x, b) {
    floorShadow(x + 4, b, 24); wood(x + 13, b - 50, 6, 50, k.w, 'y');
    line(x + 8, b - 1, x + 12, b - 78, sh(k.w, 1), 2); R(x + 6, b - 86, 12, 2, SILVER); for (let n = 0; n < 4; n++) R(x + 6 + n * 3.5, b - 94, 1, 8, SILVER);
    line(x + 24, b - 1, x + 20, b - 76, sh(k.w, 1), 2); R(x + 14, b - 78, 14, 2, SILVER); for (let n = 0; n < 6; n++) R(x + 14 + n * 2.6, b - 76, 1, 4, SILVER);
  } },
  { id: 'cornrow', name: 'Corn row', w: 2, h: 1, price: 420, draw(x, b, vw) {
    floorShadow(x, b, vw); R(x + 1, b - 4, vw - 2, 4, '#7a5a3a'); speckle(x + 1, b - 4, vw - 2, 4, '#5a4028', 2, 0.2);
    for (let n = 0; n < vw / 10; n++) {
      const cx = x + 6 + n * 10, h = 70 + (n * 7) % 14;
      R(cx, b - h, 2, h - 2, '#5a9a3a');
      for (let l = 0; l < 4; l++) { const s = (l + n) % 2 ? 1 : -1, ly = b - 12 - l * 15 - (n % 3) * 5; for (let i = 0; i < 9; i++) R(cx + 1 + s * i, ly + Math.round(i * i / 14) - 3, 1, 2, i > 6 ? '#9ad070' : '#78b848'); }
      for (let j = 0; j < 12; j++) R(cx + 2, b - h + 20 + j, 3, 1, j % 2 ? '#f8d850' : '#f0c030'); leaf(cx + 4, b - h + 26, 2, 6, '#9ad070');
      for (let t = 0; t < 3; t++) line(cx + 1, b - h, cx + 1 + (t - 1) * 3, b - h - 6, '#d8b858');
    }
  } },
  { id: 'milkbottles', name: 'Milk bottles', w: 1, h: 1, price: 180, draw(x, b) {
    floorShadow(x, b, 32); panel(x + 3, b - 14, 26, 14, k.c); for (const i of [3, 15, 26]) R(x + i, b - 14, 1, 14, sh(k.c, -1));
    for (let n = 0; n < 4; n++) { const i = x + 5 + n * 6; glass(i, b - 30, 5, 16, '#fbfbf6'); R(i + 1, b - 34, 3, 4, '#fbfbf6'); R(i + 1, b - 35, 3, 1, ['#4a98d8', '#e04848', '#58b848', '#f8d030'][n]); }
  } },
  { id: 'fencegate', name: 'Farm gate', w: 2, h: 1, price: 280, draw(x, b, vw, dir) {
    if (dir % 2) { floorShadow(x + 10, b, 12); wood(x + 12, b - 48, 8, 48, k.w, 'y'); return; }
    floorShadow(x, b, vw); for (const i of [1, vw - 7]) { wood(x + i, b - 48, 6, 48, k.w, 'y'); R(x + i, b - 50, 6, 2, sh(k.w, 1)); }
    for (const j of [-42, -28, -14]) wood(x + 7, b + j, vw - 14, 5, k.p);
    line(x + 8, b - 10, x + vw - 9, b - 40, k.p, 4); R(x + 7, b - 40, 3, 3, k.m); R(x + vw - 10, b - 28, 3, 2, k.m);
  } },
  { id: 'mailbox', name: 'Mailbox', w: 1, h: 1, price: 160, draw(x, b) {
    floorShadow(x + 6, b, 20); wood(x + 14, b - 40, 4, 40, k.w, 'y'); for (let n = 0; n < 4; n++) leaf(x + 12 + n * 3, b - 3, 2, 3, k.leaf);
    panel(x + 6, b - 54, 20, 14, k.c); for (let j = 0; j < 4; j++) R(x + 6 + j, b - 58 + j, 20 - j * 2, 1, k.c);
    disc(x + 16, b - 52, 9, k.c); R(x + 7, b - 52, 18, 12, k.c); R(x + 7, b - 52, 18, 1, sh(k.c, 1)); R(x + 7, b - 41, 18, 1, sh(k.c, -1));
    R(x + 25, b - 60, 2, 14, '#e04848'); R(x + 25, b - 60, 5, 4, '#e04848'); R(x + 9, b - 48, 4, 1, k.p);
  } },
  { id: 'hayrug', name: 'Straw floor', w: 2, h: 2, layer: 'rug', price: 160, high: 0.03, side: 'p', flat(w, h) {
    R(0, 0, w, h, STRAW);
    for (let n = 0; n < 260; n++) { const i = hash(n, 1) * w, j = hash(n, 2) * h, a = hash(n, 3) * Math.PI; line(i, j, i + Math.cos(a) * 4, j + Math.sin(a) * 2, hash(n, 4) < 0.5 ? sh(STRAW, -1) : sh(STRAW, 1)); }
  } },
  { id: 'feedsack', name: 'Feed sacks', w: 1, h: 1, price: 140, draw(x, b) {
    floorShadow(x, b, 32); const S = '#d8c8a0';
    for (const [i, w2, h, y] of [[1, 16, 22, 0], [14, 17, 26, 0], [7, 16, 14, -24]]) {
      cushion(x + i, b - y - h, w2, h, S, 4); speckle(x + i + 2, b - y - h + 2, w2 - 4, h - 4, sh(S, -1), i, 0.08);
      R(x + i + 3, b - y - h + 6, w2 - 6, 5, k.c); P(x + i + w2 / 2, b - y - h + 8, k.p);
    }
    for (let n = 0; n < 8; n++) P(x + 2 + hash(n, 4) * 6, b - 2 - hash(n, 5) * 2, '#e8c058');
  } },
  { id: 'handpump', name: 'Water pump', w: 1, h: 1, price: 300, draw(x, b) {
    floorShadow(x, b, 32); panel(x + 4, b - 6, 18, 6, STONE); cyl(x + 9, b - 44, 8, 38, k.m); sphere(x + 13, b - 46, 4, k.m);
    R(x + 17, b - 36, 8, 3, k.m); R(x + 23, b - 36, 3, 6, k.m); line(x + 12, b - 46, x + 2, b - 58, k.m, 2);
    cyl(x + 19, b - 14, 11, 12, SILVER); R(x + 20, b - 14, 9, 2, SEA); line(x + 19, b - 14, x + 24, b - 20, SILVER); line(x + 30, b - 14, x + 24, b - 20, SILVER);
    for (const j of [-28, -24]) P(x + 24, b + j, '#a8d8f8');
  } },
  { id: 'woolbasket', name: 'Wool basket', w: 1, h: 1, price: 220, draw(x, b) {
    floorShadow(x, b, 32); const BASK = '#c89858';
    for (const [i, c] of [[9, '#f8f4e0'], [18, k.c], [24, '#f8e070'], [13, k.p]]) { sphere(x + i, b - 20 - (i % 3) * 2, 5, c); for (let a = 0; a < 4; a++) line(x + i - 3, b - 22 - (i % 3) * 2 + a, x + i + 3, b - 18 - (i % 3) * 2 + a - 4, sh(c, -1)); }
    for (let j = 0; j < 16; j++) { const h = 14 - Math.round(j * 0.15); R(x + 16 - h, b - 16 + j, h * 2, 1, (j >> 1) % 2 ? BASK : sh(BASK, -1)); }
    for (let i = 3; i < 29; i += 3) R(x + i, b - 16, 1, 16, sh(BASK, -2));
    line(x + 20, b - 26, x + 28, b - 42, SILVER); line(x + 23, b - 26, x + 26, b - 44, SILVER);
  } },
  { id: 'preserves', name: 'Jam shelf', w: 1, h: 1, layer: 'wall', price: 220, wall(x) {
    for (const j of [36, 60]) { plank(x + 2, j, 28, 4); R(x + 5, j + 4, 2, 4, k.w); R(x + 25, j + 4, 2, 4, k.w); }
    for (let r = 0; r < 2; r++) for (let n = 0; n < 3; n++) {
      const i = x + 5 + n * 8, top = 24 + r * 24, c = ['#c82838', '#f0a020', '#7a3aa8', '#e85868', '#58a048', '#f8d040'][r * 3 + n];
      glass(i, top, 7, 12, sh(c, -1)); R(i + 1, top + 3, 5, 8, c); R(i - 1, top - 2, 9, 3, k.p); R(i, top - 3, 7, 1, k.c); P(i + 2, top + 5, sh(c, 2));
    }
  } },
  { id: 'horseshoe', name: 'Lucky horseshoe', w: 1, h: 1, layer: 'wall', price: 120, wall(x) {
    plank(x + 6, 22, 20, 30);
    for (let a = 0; a <= 30; a++) { const t = Math.PI * 0.05 + a / 30 * Math.PI * 1.9; disc(x + 16 + Math.sin(t) * 6, 38 - Math.cos(t) * 7, 2, a % 6 === 3 ? sh(SILVER, -1) : SILVER); }
    for (let a = 2; a < 30; a += 6) { const t = Math.PI * 0.05 + a / 30 * Math.PI * 1.9; P(x + 16 + Math.sin(t) * 6, 38 - Math.cos(t) * 7, INK); }
    disc(x + 16, 24, 1.5, k.m);
  } },
  { id: 'sproutbed', name: 'Seedling tray', w: 1, h: 1, price: 140, high: 0.12, side: 'w', flat(w, h) {
    wood(0, 0, w, h, k.w); inset(2, 2, w - 4, h - 4, '#6a4a2a');
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { const cx = 6 + c * 10, cy = 6 + r * 10; disc(cx, cy, 3, '#5a3a20'); leaf(cx - 2, cy - 1, 2, 1, '#78c858', 0.4); leaf(cx + 2, cy - 1, 2, 1, '#58b848', -0.4); }
  } },
  { id: 'plough', name: 'Old plough', w: 1, h: 1, price: 360, draw(x, b) {
    floorShadow(x, b, 32); line(x + 4, b - 6, x + 28, b - 6, k.w, 3); line(x + 26, b - 6, x + 30, b - 50, k.w, 2); line(x + 20, b - 6, x + 22, b - 44, k.w, 2);
    line(x + 22, b - 30, x + 30, b - 32, k.w); for (let j = 0; j < 12; j++) R(x + 2 + j * 0.4, b - 16 + j, 10 - j * 0.6, 1, j < 3 ? sh(SILVER, 1) : SILVER);
    disc(x + 8, b - 4, 4, k.m); disc(x + 8, b - 4, 1.5, SILVER);
  } },
]);

/* ---------- underwater ---------- */
/** A sandy mound with a pebble or two; returns its top. */
function seabed(x, b) {
  floorShadow(x, b, 32); ovalShade(x + 16, b - 4, 14, 5, SAND); P(x + 8, b - 4, sh(SAND, -2)); disc(x + 24, b - 4, 1.5, STONE);
  return b - 6;
}
const CORALS = {
  brain: ['Brain', (x, t) => {
    for (let j = 0; j < 20; j++) { const h = Math.round(Math.sqrt(1 - ((20 - j) / 20) ** 2) * 13); R(x + 16 - h, t - 20 + j, h * 2, 1, j < 4 ? sh(k.c, 1) : k.c); }
    for (let s = 0; s < 5; s++) for (let i = -11; i <= 11; i++) { const y = t - 16 + s * 3.5 + Math.round(Math.sin(i / 2 + s) * 1.5); if (Math.abs(i) < Math.sqrt(Math.max(0, 1 - ((t - y - 20) / 20) ** 2)) * 13 - 1) P(x + 16 + i, y, sh(k.c, -2)); }
  }],
  fan: ['Fan', (x, t) => {
    for (let n = 0; n < 11; n++) { const a = Math.PI + n / 10 * Math.PI; let px = x + 16, py = t; for (let s = 0; s < 6; s++) { const nx = x + 16 + Math.cos(a + Math.sin(s + n) * 0.1) * (s + 1) * 4.4, ny = t + Math.sin(a + Math.sin(s + n) * 0.1) * (s + 1) * 7; line(px, py, nx, ny, s > 3 ? sh(k.c, 1) : k.c); px = nx; py = ny; } }
    for (let n = 0; n < 30; n++) P(x + 4 + hash(n, 1) * 24, t - 6 - hash(n, 2) * 36, sh(k.c, -1));
    R(x + 15, t - 4, 3, 4, sh(k.c, -2));
  }],
  tube: ['Tube', (x, t) => {
    for (const [i, h] of [[5, 22], [11, 34], [17, 28], [23, 38], [14, 16], [25, 18]]) { cyl(x + i - 2, t - h, 5, h, k.c); oval(x + i + 0.5, t - h, 2.5, 1.5, sh(k.c, -3)); R(x + i - 2, t - h, 5, 1, sh(k.c, 1)); }
  }],
  stag: ['Staghorn', (x, t) => {
    const branch = (px, py, a, len, d) => { const nx = px + Math.cos(a) * len, ny = py + Math.sin(a) * len; line(px, py, nx, ny, d ? k.c : sh(k.c, 1), Math.max(1, 3 - d)); if (d < 3) { branch(nx, ny, a - 0.45, len * 0.75, d + 1); branch(nx, ny, a + 0.4, len * 0.7, d + 1); } else P(nx, ny, sh(k.c, 2)); };
    branch(x + 16, t, -Math.PI / 2, 14, 0);
  }],
  table: ['Table', (x, t) => {
    cyl(x + 14, t - 18, 4, 18, sh(k.c, -1));
    for (const [y, r] of [[-20, 14], [-26, 11], [-31, 7]]) { oval(x + 16, t + y, r, 2.5, sh(k.c, -1)); oval(x + 16, t + y - 1, r - 1, 1.5, k.c); for (let i = -r + 2; i < r - 1; i += 3) P(x + 16 + i, t + y - 1, sh(k.c, 1)); }
  }],
  bubble: ['Bubble', (x, t) => { for (let n = 0; n < 18; n++) { const i = 6 + hash(n, 1) * 20, j = 3 + hash(n, 2) * hash(n, 3) * 24, r = 2 + hash(n, 4) * 2.5; sphere(x + i, t - j, r, n % 3 ? k.p : sh(k.c, 1)); } }],
};
add('Underwater', Object.entries(CORALS).map(([id, [name, grow]]) => ({ id: `${id}coral`, name: `${name} coral`, w: 1, h: 1, price: 340,
  draw(x, b) { grow(x, seabed(x, b)); } })));
add('Underwater', [
  { id: 'clambed', name: 'Clam bed', w: 2, h: 2, price: 1300, high: 0.35, side: 'c', seat: 'bed', flat(w, h) {
    for (let n = 0; n < 9; n++) { const a = Math.PI + (n + 0.5) / 9 * Math.PI; for (let s = 6; s < w / 2 - 1; s++) R(w / 2 + Math.cos(a) * s - 2, h * 0.42 + Math.sin(a) * s * 0.8 - 2, 4, 4, n % 2 ? k.c : sh(k.c, 1)); }
    oval(w / 2, h * 0.42, w / 2 - 1, 3, sh(k.c, -2));
    oval(w / 2, h * 0.7, w / 2 - 3, h * 0.28, sh(k.c, -1)); oval(w / 2, h * 0.68, w / 2 - 6, h * 0.24, k.p);
    cushion(w / 2 - 14, h * 0.5, 28, 22, sh(k.p, 1), 5); sphere(w / 2, h * 0.38, 6, '#f8f4f0');
  } },
  { id: 'kelp', name: 'Kelp', w: 1, h: 1, price: 180, draw(x, b) {
    const t = seabed(x, b), KELP = '#4a8a3a';
    for (const [i, h, ph] of [[9, 84, 0], [17, 70, 2], [23, 88, 4], [13, 50, 1]]) {
      for (let j = 0; j < h; j++) { const px = x + i + Math.round(Math.sin(j / 10 + ph) * 3); R(px, t - j, 2, 1, j % 9 < 2 ? sh(KELP, 1) : KELP); if (j % 12 === 6) leaf(px + (j % 24 < 12 ? 4 : -3), t - j, 4, 2, sh(KELP, 1), j % 24 < 12 ? 0.6 : -0.6); }
      sphere(x + i + Math.round(Math.sin(h / 10 + ph) * 3) + 1, t - h, 2, '#8ab858');
    }
  } },
  { id: 'sunkenpillar', name: 'Sunken pillar', w: 1, h: 1, price: 520, draw(x, b) {
    floorShadow(x, b, 32); const M = '#d8d4c8'; panel(x + 3, b - 8, 26, 8, M);
    cyl(x + 7, b - 60, 18, 52, M); for (let i = 10; i < 24; i += 4) R(x + i, b - 60, 1, 52, sh(M, -1));
    for (let i = 0; i < 18; i++) R(x + 7 + i, b - 62 - Math.round(hash(i, 3) * 6) - (i < 9 ? i * 0.6 : (18 - i) * 0.3), 1, 6, M);
    for (let n = 0; n < 7; n++) disc(x + 9 + hash(n, 5) * 14, b - 14 - hash(n, 6) * 40, 1.5, '#a8a090');
    for (let j = 0; j < 40; j++) P(x + 22 + Math.round(Math.sin(j / 4) * 2), b - 8 - j, '#4a8a3a'); leaf(x + 22, b - 30, 3, 2, '#5a9a4a', 0.6);
  } },
  { id: 'shipwreck', name: 'Shipwreck', w: 2, h: 1, price: 1400, draw(x, b, vw) {
    floorShadow(x, b, vw); const W = sh(k.w, -1);
    for (let i = 0; i < vw - 6; i++) { const top = b - 30 + Math.round((i / (vw - 6)) ** 2 * 14) + (i > vw * 0.6 ? Math.round(hash(i, 2) * 8) : 0); R(x + 3 + i, top, 1, b - top - 2, i % 7 === 0 ? sh(W, -1) : W); }
    for (let j = b - 26; j < b - 4; j += 5) R(x + 3, j, vw * 0.6, 1, sh(W, -2));
    for (let n = 0; n < 4; n++) arc(x + vw * 0.65 + n * 5, b - 4, 4, 22, Math.PI, Math.PI * 1.5, sh(k.w, 1), 2);
    line(x + 14, b - 28, x + 22, b - 80, k.w, 3); line(x + 10, b - 64, x + 28, b - 68, k.w, 2);
    for (let n = 0; n < 8; n++) R(x + 10 + n * 2, b - 64 + Math.round(Math.sin(n) * 2), 2, 10 + n % 3, sh(k.p, -1));
    sphere(x + 30, b - 6, 4, GOLD); R(x + vw - 16, b - 10, 10, 8, sh(k.w, -2)); R(x + vw - 16, b - 10, 10, 2, GOLD);
  } },
  { id: 'amphora', name: 'Amphora', w: 1, h: 1, price: 300, draw(x, b) {
    floorShadow(x + 4, b, 24); const C = k.pot;
    for (let j = 0; j < 40; j++) { const h = Math.round(j < 6 ? 4 : j < 34 ? 4 + Math.sin((j - 6) / 28 * Math.PI) * 8 : 3 - (j - 34) * 0.3); R(x + 16 - h, b - 44 + j, h * 2, 1, j % 10 === 8 ? sh(C, -1) : C); }
    oval(x + 16, b - 44, 4, 1.5, sh(C, -2));
    for (const s of [-1, 1]) arc(x + 16 + s * 6, b - 36, 3, 5, s > 0 ? -Math.PI / 2 : Math.PI / 2, s > 0 ? Math.PI / 2 : Math.PI * 1.5, sh(C, -1), 2);
    for (let n = 0; n < 5; n++) { const i = 10 + hash(n, 1) * 12, j = 14 + hash(n, 2) * 20; disc(x + i, b - j, 1.5, '#e8e4d8'); P(x + i, b - j, '#a8a090'); }
    R(x + 10, b - 26, 12, 2, k.a);
  } },
  { id: 'divinghelmet', name: 'Diving helmet', w: 1, h: 1, price: 760, draw(x, b) {
    const t = seabed(x, b); panel(x + 5, t - 8, 22, 8, BRASS);
    for (let j = 0; j < 30; j++) { const h = Math.round(Math.sqrt(1 - ((j - 16) / 17) ** 2) * 12); R(x + 16 - h, t - 38 + j, h * 2, 1, j < 5 ? sh(BRASS, 1) : j > 26 ? sh(BRASS, -1) : BRASS); }
    disc(x + 16, t - 22, 6, sh(BRASS, -2)); disc(x + 16, t - 22, 5, '#2a4a6a'); P(x + 14, t - 24, '#a8d8f8'); for (const i of [6, 26]) { disc(x + i, t - 24, 3, sh(BRASS, -2)); disc(x + i, t - 24, 2, '#2a4a6a'); }
    for (let a = 0; a < 8; a++) { const th = a / 8 * Math.PI * 2; P(x + 16 + Math.round(Math.cos(th) * 7), t - 22 + Math.round(Math.sin(th) * 7), sh(BRASS, 2)); }
    R(x + 14, t - 42, 4, 4, sh(BRASS, -1)); for (const [i, j] of [[24, -48], [26, -56], [23, -64]]) ring(x + i, t + j, 1.5, '#cfe8f4');
  } },
  { id: 'jellylamp', name: 'Jellyfish lamp', w: 1, h: 1, price: 520, glow: ['#f8b0e0', '#ffe0f4'], draw(x, b) {
    floorShadow(x + 4, b, 24); panel(x + 8, b - 8, 16, 8, k.m); glass(x + 6, b - 64, 20, 56, 'rgba(200,232,248,0.5)');
    R(x + 6, b - 66, 20, 3, k.m);
    for (let j = 0; j < 10; j++) { const h = Math.round(Math.sqrt(1 - ((10 - j) / 10) ** 2) * 8); R(x + 16 - h, b - 52 + j, h * 2, 1, j < 3 ? '#ffe0f4' : '#f8b0e0'); }
    for (let n = 0; n < 5; n++) for (let j = 0; j < 20; j++) P(x + 11 + n * 2.5 + Math.round(Math.sin(j / 3 + n) * 1), b - 42 + j, '#f8b0e0');
  } },
  { id: 'bubblecolumn', name: 'Bubble column', w: 1, h: 1, price: 600, glow: ['#a8e8ff'], draw(x, b) {
    floorShadow(x + 2, b, 28); panel(x + 5, b - 10, 22, 10, k.m); panel(x + 5, b - 92, 22, 6, k.m);
    R(x + 8, b - 86, 16, 76, '#3a88c8'); R(x + 9, b - 86, 2, 76, '#5aa8e0');
    for (let n = 0; n < 16; n++) { const i = 11 + hash(n, 1) * 10, j = 14 + n * 4.5, r = 1 + hash(n, 2) * 1.6; ring(x + i, b - j, r, '#a8e8ff'); }
    for (let i = 0; i < 16; i += 2) P(x + 8 + i, b - 11, '#a8e8ff');
  } },
  { id: 'seabedrug', name: 'Seabed rug', w: 2, h: 2, layer: 'rug', price: 260, high: 0.03, side: 'p', flat(w, h) {
    R(0, 0, w, h, sh(SAND, -1)); R(2, 2, w - 4, h - 4, SAND);
    for (let s = 0; s < 8; s++) for (let i = 3; i < w - 3; i++) P(i, 6 + s * 7 + Math.round(Math.sin(i / 5 + s) * 1.5), sh(SAND, -1));
    stamp(MOTIFS.star, 8, 34, { '#': k.c, '+': sh(k.c, 1) }, 2);
    for (const [i, j] of [[44, 12], [50, 44], [14, 10]]) { for (let a = 0; a < 5; a++) line(i, j + 2, i + (a - 2) * 2, j - 2, '#f4e0d8'); R(i - 1, j + 2, 3, 2, sh('#f4e0d8', -1)); }
  } },
  { id: 'pearlstand', name: 'Giant pearl', w: 1, h: 1, price: 1000, glow: ['#fffaf4'], draw(x, b) {
    floorShadow(x + 4, b, 24); panel(x + 8, b - 20, 16, 20, k.p); R(x + 8, b - 20, 16, 2, GOLD); R(x + 6, b - 4, 20, 4, k.a);
    cushion(x + 5, b - 28, 22, 9, k.c, 3); for (const i of [5, 26]) R(x + i, b - 24, 1, 5, GOLD);
    disc(x + 16, b - 38, 10, '#e8e0e8'); disc(x + 15, b - 39, 9, '#f8f0f4'); disc(x + 12, b - 42, 3, '#fffaf4'); R(x + 11, b - 43, 2, 1, '#ffffff');
  } },
  { id: 'seaurchin', name: 'Sea urchin', w: 1, h: 1, price: 160, draw(x, b) {
    const t = seabed(x, b), U = '#5a3a7a';
    for (let a = 0; a < 26; a++) { const th = Math.PI + a / 25 * Math.PI; line(x + 16, t - 8, x + 16 + Math.cos(th) * 15, t - 8 + Math.sin(th) * 15, a % 2 ? U : sh(U, 1)); }
    for (let j = 0; j < 9; j++) { const h = Math.round(Math.sqrt(1 - ((9 - j) / 9) ** 2) * 9); R(x + 16 - h, t - 9 + j, h * 2, 1, j < 3 ? sh(U, 1) : U); }
  } },
  { id: 'anemone', name: 'Anemone', w: 1, h: 1, price: 280, draw(x, b) {
    const t = seabed(x, b); cyl(x + 9, t - 12, 14, 12, sh(k.c, -1));
    for (let n = 0; n < 12; n++) { const sx = x + 8 + n * 1.4; for (let j = 0; j < 16; j++) P(sx + Math.round(Math.sin(j / 3 + n) * 2), t - 12 - j, j > 13 ? sh(k.c, 2) : k.c); }
    const F = '#f08030', fx = x + 24, fy = t - 34;
    oval(fx, fy, 5, 3, F); R(fx - 1, fy - 3, 2, 6, '#ffffff'); R(fx + 3, fy - 2, 1, 4, '#ffffff'); tri(fx - 6, fy - 2, 5, F, 0.6); P(fx + 3, fy - 1, INK);
  } },
  { id: 'shellmirror', name: 'Shell mirror', w: 1, h: 1, layer: 'wall', price: 340, wall(x) {
    shadowWall(x + 4, 16, 24, 40); oval(x + 16, 36, 11, 18, k.p); oval(x + 16, 36, 8, 15, '#cfe8f4');
    for (let n = 0; n < 5; n++) P(x + 12 + n, 28 + n * 2, '#ffffff');
    for (let a = 0; a < 14; a++) { const th = a / 14 * Math.PI * 2, sx = x + 16 + Math.cos(th) * 11, sy = 36 + Math.sin(th) * 18; disc(sx, sy, 2.5, a % 2 ? k.c : '#f4e0d8'); P(sx, sy, sh(k.c, -1)); }
    tri(x + 16, 12, 8, k.c, 0.8); for (let i = -3; i <= 3; i += 2) line(x + 16, 13, x + 16 + i * 1.5, 19, sh(k.c, -1));
  } },
  { id: 'fishschool', name: 'Fish wall', w: 2, h: 1, layer: 'wall', price: 300, wall(x) {
    const fish = (fx, fy, c, s) => { oval(fx, fy, 5 * s, 3 * s, c); tri(fx - 6 * s, fy - 3 * s, 6 * s, c, 0.5); P(fx + 3 * s, fy - 1, INK); R(fx - 1, fy - 3 * s, 1, 6 * s, sh(c, -1)); };
    [[12, 24, 1], [26, 18, 0.8], [40, 28, 1.2], [20, 42, 0.9], [36, 50, 1], [52, 40, 0.8], [50, 16, 0.7]].forEach(([i, j, s], n) => { shadowWall(x + i - 5, j - 2, 10 * s, 6 * s); fish(x + i, j, n % 2 ? k.c : k.a, s); });
    for (const [i, j] of [[30, 34], [58, 26], [8, 50]]) ring(x + i, j, 1.5, '#a8d8f8');
  } },
  { id: 'seahorse', name: 'Seahorse statue', w: 1, h: 1, price: 480, draw(x, b) {
    floorShadow(x + 4, b, 24); panel(x + 6, b - 8, 20, 8, STONE); const C = k.c;
    for (let j = 0; j < 40; j++) { const cx = x + 16 + Math.round(Math.sin(j / 12) * 4), w2 = j < 6 ? 3 : j < 30 ? 5 : 3; R(cx - w2, b - 50 + j, w2 * 2, 1, j % 4 === 0 ? sh(C, -1) : C); }
    arc(x + 14, b - 14, 5, 5, -Math.PI / 2, Math.PI, C, 2);
    disc(x + 16, b - 56, 6, C); R(x + 20, b - 56, 7, 3, C); P(x + 17, b - 58, INK); tri(x + 14, b - 66, 6, sh(C, 1), 0.4);
    for (let j = 0; j < 20; j += 3) tri(x + 10, b - 46 + j, 3, sh(C, 1), 0.5);
  } },
  { id: 'octopuschair', name: 'Octopus beanbag', w: 1, h: 1, price: 300, high: 0.25, side: 'c', seat: 'cushion', flat(w, h) {
    for (let n = 0; n < 6; n++) {
      const a = Math.PI * 0.15 + n / 5 * Math.PI * 0.7; let px = 0, py = 0;
      for (let s = 0; s < 12; s++) { const t = a + s * s * 0.012 * (n < 3 ? 1 : -1); px = w / 2 + Math.cos(t) * (6 + s); py = h * 0.42 + Math.sin(t) * (6 + s); disc(px, py, 2.6 - s * 0.12, s % 3 ? k.c : sh(k.c, -1)); }
      P(px, py, k.p);
    }
    ovalShade(w / 2, h * 0.38, 10, 9, k.c); disc(w / 2 - 4, h * 0.3, 2, sh(k.c, 1));
    for (const s of [-1, 1]) { disc(w / 2 + s * 4, h * 0.44, 2, '#ffffff'); P(w / 2 + s * 4, h * 0.45, INK); }
  } },
  { id: 'lanternfish', name: 'Lanternfish lamp', w: 1, h: 1, price: 440, glow: ['#fff4a0'], draw(x, b) {
    floorShadow(x + 4, b, 24); panel(x + 8, b - 8, 16, 8, k.m); R(x + 15, b - 20, 2, 12, k.m);
    const F = '#3a6ab8'; ovalShade(x + 15, b - 32, 12, 10, F); tri(x + 2, b - 40, 16, F, 0.3); oval(x + 15, b - 26, 9, 4, '#f8e8a0');
    disc(x + 20, b - 36, 3, '#ffffff'); disc(x + 21, b - 36, 1.5, INK); for (let i = 0; i < 5; i++) tri(x + 18 + i * 2, b - 26, 2, '#ffffff', 0.5);
    arc(x + 24, b - 46, 6, 8, Math.PI, Math.PI * 1.8, sh(F, 1)); disc(x + 28, b - 50, 3, '#fff4a0'); P(x + 27, b - 51, '#ffffff');
  } },
  { id: 'trident', name: 'Trident', w: 1, h: 1, layer: 'wall', price: 500, wall(x) {
    line(x + 6, 84, x + 26, 12, GOLD, 2); line(x + 7, 84, x + 27, 12, sh(GOLD, -1));
    for (const [dx, dy] of [[-6, -2], [0, 0], [6, 2]]) { line(x + 24 + dx, 18 + dy, x + 28 + dx, 4 + dy, GOLD, 2); tri(x + 28 + dx, 0 + dy, 4, sh(GOLD, 1), 0.6); }
    line(x + 18, 15, x + 30, 21, GOLD, 2); disc(x + 20, 30, 2.5, '#58c8e8'); for (const j of [70, 74]) line(x + 9 + (84 - j) * 0.27, j, x + 11 + (84 - j) * 0.27, j, k.c, 2);
  } },
  { id: 'sunkenarch', name: 'Sunken arch', w: 2, h: 1, price: 1100, draw(x, b, vw, dir) {
    const M = '#c8c4b8';
    if (dir % 2) { floorShadow(x + 6, b, 20); cyl(x + 8, b - 70, 16, 70, M); return; }
    floorShadow(x, b, vw);
    for (const i of [2, vw - 16]) { cyl(x + i, b - 66, 14, 66, M); for (let j = b - 60; j < b; j += 12) R(x + i, j, 14, 1, sh(M, -1)); }
    for (let i = 0; i < vw; i++) { const d = Math.abs(i - vw / 2) / (vw / 2), top = b - 86 + Math.round(d * d * 6), bot = b - 66 + Math.round((1 - Math.sqrt(Math.max(0, 1 - ((i - vw / 2) / (vw / 2 - 16)) ** 2))) * 16 * (Math.abs(i - vw / 2) < vw / 2 - 16 ? 1 : 0)); R(x + i, top, 1, Math.max(4, bot - top), i % 9 === 0 ? sh(M, -1) : M); }
    R(x + vw / 2 - 3, b - 86, 6, 10, sh(M, 1));
    for (let n = 0; n < 3; n++) for (let j = 0; j < 30; j++) P(x + 10 + n * 20 + Math.round(Math.sin(j / 4 + n) * 2), b - 84 + j, '#4a8a3a');
    for (let n = 0; n < 8; n++) disc(x + 4 + hash(n, 3) * (vw - 8), b - 20 - hash(n, 4) * 60, 1.2, '#a8a090');
  } },
]);
