/* base-furniture-rooms.js  -  the catalogue's themed shelves (the road to 1,000 kinds, the user's ask, 2026-10-08): batch 1
   is the Kitchen, Garden, Pokémon Center, Gym, Beach and Spooky. Same kit and rules as js/base-furniture-kinds.js:
   painted at 32 pixels a tile with js/base-paint.js in the piece's theme palette `k`, outlined and rim-lit by `finish()`.
   Kitchen counters share one cabinet and differ by what stands on top (`TOPS`); flower beds and vegetable patches are a
   list each. A new shelf is a new `add(group, [...])`. */

import { k, sh, R, P, clear, hash, panel, inset, wood, cushion, sphere, disc, oval, ovalShade, cyl, glass, leaf, foliage, tri,
  speckle, stamp, floorShadow, clipped } from './base-paint.js';
import { MOTIFS, motif, ink, legs4, sideBox, shadowWall } from './base-furniture-kinds.js';

export const ROOM_KINDS = [];
const add = (group, list) => list.forEach(f => ROOM_KINDS.push({ group, ...f }));

export const BERRY = ['#e03838', '#4a78d8', '#f890b8', '#f0d848', '#7a4ab8', '#58b8a8'];
export const STONE = '#9a9aa6';
export const flower = (cx, cy, c) => { for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) P(cx + dx, cy + dy, dy < 0 ? sh(c, 1) : c); P(cx, cy, '#f8d850'); };
/** A Poké Ball r pixels round, its top half in `top`. */
export const ball = (cx, cy, r, top = '#e04848') => {
  disc(cx, cy, r + 1, '#303038'); disc(cx, cy, r, '#f4f4f0');
  for (let j = -r; j < 0; j++) { const h = Math.sqrt(r * r - j * j); R(Math.round(cx - h), cy + j, Math.round(h * 2) + 1, 1, j < -r * 0.7 ? sh(top, 1) : top); }
  R(cx - r, cy, r * 2 + 1, Math.max(1, Math.round(r / 5)), '#303038');
  if (r > 3) { disc(cx, cy, Math.max(1.5, r * 0.32), '#303038'); disc(cx, cy, Math.max(1, r * 0.2), '#ffffff'); }
};
/** The cloth's colour, unless it's white (the Poké theme), when it's the wood's. */
const ballTop = () => (k.c === '#f4f4f0' ? k.w : k.c);

/* ---------- kitchen ---------- */
/** A kitchen cabinet with a worktop, vw wide; returns the worktop's line. */
export function cabinet(x, b, vw) {
  floorShadow(x, b, vw);
  wood(x + 1, b - 32, vw - 2, 29, k.w); R(x + 2, b - 3, vw - 4, 3, sh(k.w, -3));
  for (let i = 0; i + 20 < vw; i += 30) {
    const dw = Math.min(26, vw - 6 - i);
    inset(x + 3 + i, b - 30, dw, 7, sh(k.w, 1)); panel(x + 4 + i, b - 29, dw - 2, 5, k.w); R(x + 1 + i + dw / 2, b - 27, 4, 1, k.a);
    inset(x + 3 + i, b - 21, dw, 16, sh(k.w, 1)); wood(x + 4 + i, b - 20, dw - 2, 14, k.w, 'y'); R(x + i + dw - 2, b - 17, 1, 6, k.a);
  }
  panel(x, b - 36, vw, 5, k.p); R(x, b - 32, vw, 1, sh(k.p, -2));
  return b - 36;
}
const TOPS = {
  toaster: ['Toaster', (x, t) => {
    R(x + 11, t - 15, 4, 4, '#d8a058'); R(x + 17, t - 14, 4, 3, '#c88a40'); R(x + 11, t - 15, 4, 1, '#f0c880');
    panel(x + 8, t - 12, 16, 12, k.m, 2); R(x + 10, t - 9, 12, 1, sh(k.m, 2));
    R(x + 11, t - 12, 4, 1, '#202028'); R(x + 17, t - 12, 4, 1, '#202028'); R(x + 24, t - 8, 3, 2, k.a);
  }],
  kettle: ['Kettle', (x, t) => {
    for (let i = 0; i < 6; i++) R(x + 21 + i, t - 7 - i, 2, 2, k.c);
    ovalShade(x + 15, t - 7, 8, 7, k.c); R(x + 7, t - 2, 16, 2, sh(k.c, -1));
    for (let i = 0; i < 11; i++) R(x + 10 + i, t - 15 - Math.round(Math.sin(i / 10 * Math.PI) * 4), 1, 2, sh(k.m, -1));
    sphere(x + 15, t - 14, 1.5, k.a);
    for (const [i, j] of [[28, -16], [27, -20], [29, -24], [28, -28]]) P(x + i, t + j, '#ffffff');
  }],
  microwave: ['Microwave', (x, t) => {
    panel(x + 2, t - 18, 28, 18, k.m, 2);
    inset(x + 4, t - 16, 16, 14, '#2a2a3a'); R(x + 5, t - 13, 14, 9, '#5a5030'); R(x + 6, t - 12, 3, 1, '#ffffff'); R(x + 5, t - 15, 14, 1, '#3a3a4a');
    R(x + 22, t - 16, 6, 3, '#68e868'); for (let j = 0; j < 3; j++) for (let i = 0; i < 2; i++) R(x + 22 + i * 3, t - 11 + j * 3, 2, 2, sh(k.m, 2));
  }],
  mixer: ['Stand mixer', (x, t) => {
    panel(x + 6, t - 4, 20, 4, k.c); cyl(x + 19, t - 22, 7, 18, k.c);
    cushion(x + 5, t - 27, 22, 8, k.c, 3);
    R(x + 11, t - 19, 2, 7, k.m);
    for (let j = 0; j < 8; j++) { const h = 8 - Math.floor(j * 0.45); R(x + 12 - h, t - 12 + j, h * 2, 1, j < 1 ? sh(k.m, 2) : k.m); }
    R(x + 6, t - 12, 12, 2, '#fff4e0');
  }],
  coffee: ['Coffee maker', (x, t) => {
    panel(x + 18, t - 24, 9, 24, k.m); panel(x + 5, t - 27, 22, 6, k.m); panel(x + 5, t - 3, 22, 3, k.m);
    glass(x + 7, t - 16, 10, 13, '#d8eef8'); R(x + 7, t - 9, 10, 6, '#5a3018'); R(x + 7, t - 9, 10, 1, '#8a5a30'); R(x + 17, t - 14, 2, 7, sh(k.m, -1));
    sphere(x + 22, t - 16, 1.5, '#e04848'); R(x + 9, t - 21, 6, 3, sh(k.m, -1));
  }],
  ricecooker: ['Rice cooker', (x, t) => {
    cyl(x + 6, t - 14, 20, 14, k.p); ovalShade(x + 16, t - 15, 10, 4, sh(k.p, 1)); R(x + 6, t - 14, 20, 1, sh(k.p, -1));
    sphere(x + 16, t - 19, 2, k.c); R(x + 11, t - 9, 10, 4, '#3a4a5a'); R(x + 12, t - 8, 4, 2, '#68e868'); P(x + 19, t - 7, k.c);
  }],
  breadbox: ['Bread box', (x, t) => {
    for (let j = 0; j < 14; j++) { const h = Math.round(Math.sqrt(196 - (14 - j) ** 2)); R(x + 16 - h, t - 14 + j, h * 2, 1, j < 3 ? sh(k.w, 1) : k.w); }
    R(x + 4, t - 7, 24, 1, sh(k.w, -2));
    oval(x + 16, t - 4, 9, 3, '#d8a058'); oval(x + 15, t - 5, 6, 1, '#f0c880'); for (const i of [-5, 0, 5]) R(x + 16 + i, t - 6, 1, 2, '#a8702a');
    sphere(x + 16, t - 10, 1.5, k.a);
  }],
  fruitbowl: ['Fruit bowl', (x, t) => {
    for (const [i, j, c] of [[10, -9, BERRY[0]], [22, -9, BERRY[1]], [16, -11, BERRY[3]], [13, -14, BERRY[2]], [19, -15, '#f08030']]) sphere(x + i, t + j, 3.5, c);
    leaf(x + 20, t - 20, 2, 3, k.leaf, 0.4);
    for (let j = 0; j < 7; j++) { const h = 12 - Math.floor(j * j / 5); R(x + 16 - h, t - 7 + j, h * 2, 1, j < 1 ? sh(k.c, 1) : k.c); }
  }],
  cake: ['Cake stand', (x, t) => {
    cyl(x + 15, t - 6, 3, 6, k.m); oval(x + 16, t - 7, 12, 2, sh(k.m, 1));
    cyl(x + 6, t - 18, 20, 10, '#f8e8d0'); R(x + 6, t - 14, 20, 2, k.c); cyl(x + 9, t - 26, 14, 8, '#f8e8d0'); R(x + 9, t - 23, 14, 1, k.c);
    for (let i = 0; i < 5; i++) disc(x + 8 + i * 4, t - 18, 1.5, '#ffffff');
    sphere(x + 16, t - 28, 2.5, BERRY[0]); R(x + 16, t - 32, 1, 2, k.leaf);
  }],
  dishrack: ['Dish rack', (x, t) => {
    cyl(x + 24, t - 14, 5, 11, k.c); R(x + 24, t - 14, 5, 1, sh(k.c, 1));
    for (let i = 0; i < 5; i++) { const px = x + 6 + i * 4; oval(px, t - 11, 2, 8, sh(k.p, -1)); oval(px, t - 11, 1, 7, i % 2 ? k.p : '#ffffff'); P(px, t - 18, k.c); }
    R(x + 3, t - 3, 26, 3, k.m); for (let i = 0; i < 9; i++) R(x + 4 + i * 3, t - 7, 1, 4, k.m);
  }],
  chopping: ['Chopping board', (x, t) => {
    wood(x + 2, t - 4, 28, 4, sh(k.w, 1));
    for (let j = 0; j < 4; j++) R(x + 5 + j, t - 8 + j, 12 - j * 3, 1, '#f08030'); for (let i = 0; i < 3; i++) R(x + 3 + i * 2, t - 10 + i, 1, 3, k.leaf);
    for (let i = 0; i < 3; i++) { disc(x + 19 + i * 3, t - 5, 1.5, '#f08030'); P(x + 19 + i * 3, t - 5, '#f8b060'); }
    sphere(x + 25, t - 9, 3.5, '#e8d0a8'); R(x + 25, t - 13, 1, 2, '#8a6a40');
  }],
  blender: ['Blender', (x, t) => {
    panel(x + 9, t - 7, 14, 7, k.m); sphere(x + 16, t - 4, 1.5, k.a);
    for (let j = 0; j < 20; j++) { const h = 6 - Math.floor(j / 6); R(x + 16 - h, t - 27 + j, h * 2, 1, j < 5 ? '#e0f0f8' : j % 5 ? k.c : sh(k.c, 1)); }
    R(x + 11, t - 24, 1, 14, '#ffffff'); R(x + 9, t - 29, 14, 2, k.m); R(x + 22, t - 22, 2, 8, '#d8eef8');
  }],
  spices: ['Spice jars', (x, t) => {
    ['#c84830', '#e8b030', '#6a9a3a', '#8a4a2a', '#f4f0e0'].forEach((c, i) => {
      const px = x + 3 + i * 5, hh = 8 + (i % 2) * 3;
      R(px, t - hh, 4, hh, c); R(px, t - hh, 4, 2, '#e8f4f8'); R(px, t - hh - 2, 4, 2, k.a); P(px, t - hh + 3, '#ffffff');
    });
  }],
  herbs: ['Herb pots', (x, t) => {
    for (const [i, c] of [[3, k.pot], [12, sh(k.pot, 1)], [21, k.pot]]) {
      foliage(x + i + 4, t - 11, 5, i === 12 ? sh(k.leaf, 1) : k.leaf, i);
      cyl(x + i, t - 7, 8, 7, c); R(x + i - 1, t - 8, 10, 2, sh(c, 1));
    }
  }],
};
add('Kitchen', Object.entries(TOPS).map(([id, [name, top]]) => ({ set: 'counter', id: `${id}counter`, name: `${name} counter`, w: 1, h: 1, price: 380,
  draw(x, b) { top(x, cabinet(x, b, 32)); } })));
add('Kitchen', [
  { id: 'island', name: 'Kitchen island', w: 2, h: 1, price: 750, draw(x, b, vw, dir) {
    if (dir % 2) return sideBox(x, b, vw, 36);
    const t = cabinet(x, b, vw);
    if (dir === 2) return;
    TOPS.chopping[1](x, t); TOPS.fruitbowl[1](x + 32, t);
  } },
  { id: 'highchair', name: 'High chair', w: 1, h: 1, price: 260, draw(x, b) {
    floorShadow(x + 2, b, 28);
    cyl(x + 5, b - 42, 3, 42, sh(k.w, -1)); cyl(x + 24, b - 42, 3, 42, sh(k.w, -1)); R(x + 7, b - 14, 18, 2, k.w);
    wood(x + 7, b - 66, 18, 24, k.w, 'y'); cushion(x + 9, b - 62, 14, 18, k.c, 3);
    wood(x + 4, b - 44, 24, 5, k.w); panel(x + 1, b - 50, 30, 4, k.p); R(x + 2, b - 49, 28, 1, '#ffffff');
    sphere(x + 9, b - 52, 2, BERRY[3]);
  } },
  { id: 'watercooler', name: 'Water cooler', w: 1, h: 1, price: 320, draw(x, b) {
    floorShadow(x + 2, b, 28); panel(x + 6, b - 44, 20, 44, k.p, 2); R(x + 7, b - 30, 18, 1, sh(k.p, -2));
    R(x + 10, b - 38, 3, 3, '#e04848'); R(x + 19, b - 38, 3, 3, '#4a78d8'); R(x + 8, b - 26, 16, 2, sh(k.p, -1)); R(x + 13, b - 22, 6, 6, '#3a3a48');
    for (let j = 0; j < 26; j++) { const h = j < 2 ? 8 + j : j < 20 ? 10 : Math.max(3, 10 - (j - 19) * 2); R(x + 16 - h, b - 70 + j, h * 2, 1, j < 6 ? '#a8dcf8' : '#68b8f0'); }
    R(x + 9, b - 66, 2, 16, '#d8f0ff'); R(x + 6, b - 58, 20, 1, '#4a98d8'); R(x + 6, b - 50, 20, 1, '#4a98d8');
  } },
  { id: 'milkcrate', name: 'Moomoo Milk crate', proper: true, w: 1, h: 1, price: 220, draw(x, b) {
    floorShadow(x, b, 32);
    for (let i = 0; i < 4; i++) { const px = x + 4 + i * 6; cyl(px, b - 30, 5, 14, '#f8f8f0'); R(px + 1, b - 34, 3, 4, '#f8f8f0'); R(px + 1, b - 36, 3, 2, '#4a78d8'); R(px, b - 26, 5, 3, '#4a78d8'); }
    panel(x + 2, b - 18, 28, 18, k.c); R(x + 2, b - 18, 28, 2, sh(k.c, 1));
    for (let i = 0; i < 4; i++) R(x + 5 + i * 6, b - 13, 4, 4, sh(k.c, -2));
  } },
  { id: 'pantry', name: 'Pantry shelf', w: 2, h: 1, price: 600, solid: true, draw(x, b, vw, dir) {
    if (dir % 2) return sideBox(x, b, vw, 76);
    floorShadow(x, b, vw); wood(x, b - 76, vw, 76, k.w, 'y'); wood(x, b - 78, vw, 5, sh(k.w, 1));
    if (dir === 2) return;
    for (let row = 0; row < 3; row++) {
      const top = b - 70 + row * 22, fl = top + 18;
      R(x + 4, top, vw - 8, 18, sh(k.w, -2)); R(x + 4, top, vw - 8, 2, sh(k.w, -3));
      for (let i = 0; i < 7; i++) {
        const px = x + 6 + i * 8, kind = (i + row * 3) % 4;
        if (kind === 0) { R(px, fl - 12, 6, 12, '#e8f4f8'); R(px, fl - 8, 6, 8, BERRY[(i + row) % 6]); R(px, fl - 14, 6, 2, k.a); P(px + 1, fl - 11, '#ffffff'); }
        else if (kind === 1) { cyl(px, fl - 10, 6, 10, k.m); R(px, fl - 7, 6, 4, k.c); }
        else if (kind === 2) { panel(px, fl - 15, 7, 15, '#e8d8a8'); R(px + 1, fl - 11, 5, 4, k.c); }
        else ovalShade(px + 3, fl - 6, 4, 6, '#f0e4c8');
      }
      wood(x + 2, fl, vw - 4, 3, sh(k.w, 1));
    }
  } },
  { id: 'teacart', name: 'Tea trolley', w: 1, h: 1, price: 340, draw(x, b) {
    floorShadow(x, b, 32); for (const i of [4, 24]) { disc(x + i + 2, b - 3, 3, '#303038'); P(x + i + 1, b - 4, '#6a6a78'); }
    cyl(x + 3, b - 34, 2, 30, k.m); cyl(x + 27, b - 34, 2, 30, k.m);
    wood(x + 2, b - 12, 28, 3, k.w); wood(x + 2, b - 30, 28, 3, k.w); R(x + 27, b - 40, 2, 7, k.m); R(x + 24, b - 41, 6, 2, k.m);
    ovalShade(x + 10, b - 36, 6, 5, k.c); R(x + 15, b - 39, 4, 2, k.c); sphere(x + 10, b - 42, 1.5, k.a);
    for (const i of [19, 24]) { cyl(x + i, b - 35, 4, 4, '#ffffff'); P(x + i + 1, b - 35, k.c); }
    for (const i of [6, 14, 21]) { disc(x + i + 2, b - 15, 3, '#f8e8c8'); P(x + i + 2, b - 16, '#c89058'); }
  } },
  { id: 'spicerack', name: 'Spice rack', w: 1, h: 1, layer: 'wall', price: 180, wall(x) {
    for (const y of [36, 54]) {
      ['#c84830', '#e8b030', '#6a9a3a', '#8a4a2a', '#f4f0e0'].forEach((c, i) => { const px = x + 5 + i * 5; R(px, y - 10, 4, 10, c); R(px, y - 10, 4, 2, '#e8f4f8'); R(px, y - 12, 4, 2, k.a); });
      wood(x + 2, y, 28, 4, k.w); R(x + 2, y + 4, 28, 1, 'rgba(0,0,0,0.25)');
    }
    wood(x + 2, 22, 3, 36, sh(k.w, -1), 'y'); wood(x + 27, 22, 3, 36, sh(k.w, -1), 'y');
  } },
  { id: 'potrack', name: 'Pot rack', w: 2, h: 1, layer: 'wall', price: 300, wall(x) {
    for (const [cx, r, c] of [[13, 9, k.m], [32, 11, k.c], [51, 8, sh(k.m, 1)]]) {
      R(x + cx - 1, 20, 3, 12, sh(c, -1)); disc(x + cx, 33 + r, r + 1, sh(c, -2)); disc(x + cx, 33 + r, r, c); disc(x + cx - 2, 31 + r, r * 0.5, sh(c, 1)); P(x + cx - 3, 29 + r, sh(c, 3));
    }
    cyl(x + 3, 16, 58, 4, k.m); sphere(x + 4, 18, 3, k.a); sphere(x + 60, 18, 3, k.a);
  } },
  { id: 'platerack', name: 'Plate rack', w: 2, h: 1, layer: 'wall', price: 320, wall(x) {
    shadowWall(x + 4, 24, 56, 38); wood(x + 4, 24, 56, 4, k.w); wood(x + 4, 56, 56, 6, k.w);
    for (let i = 0; i < 6; i++) { const px = x + 12 + i * 8; disc(px, 42, 7, sh(k.p, -2)); disc(px, 42, 6, '#ffffff'); disc(px, 42, 5, i % 2 ? k.c : k.a); disc(px, 42, 4, '#ffffff'); P(px - 3, 37, '#ffffff'); }
    for (let i = 0; i < 7; i++) R(x + 6 + i * 9, 28, 1, 28, sh(k.w, -1));
  } },
  { id: 'utensils', name: 'Utensil rail', w: 1, h: 1, layer: 'wall', price: 160, wall(x) {
    R(x + 7, 21, 2, 18, k.m); disc(x + 8, 42, 4, k.m); disc(x + 8, 42, 2.5, sh(k.m, -2));
    R(x + 15, 21, 2, 14, k.w); panel(x + 13, 35, 6, 9, k.c); for (let j = 0; j < 3; j++) R(x + 14, 37 + j * 2, 4, 1, sh(k.c, -1));
    R(x + 23, 21, 2, 12, k.m); for (let i = 0; i < 4; i++) oval(x + 24, 40, 1 + i, 7, i % 2 ? sh(k.m, 1) : k.m); oval(x + 24, 40, 1, 6, sh(k.m, 2));
    cyl(x + 3, 18, 26, 3, k.m); sphere(x + 3, 19, 2, k.a); sphere(x + 29, 19, 2, k.a);
  } },
  { id: 'menuboard', name: 'Menu board', w: 1, h: 1, layer: 'wall', price: 150, wall(x) {
    shadowWall(x + 4, 18, 24, 40); wood(x + 4, 18, 24, 40, k.w); R(x + 6, 20, 20, 36, '#2a4a3a');
    for (let j = 0; j < 4; j++) { R(x + 8, 32 + j * 5, 10 + (j % 2) * 4, 1, '#d8e8d8'); P(x + 23, 32 + j * 5, '#f8e070'); }
    disc(x + 12, 26, 3, '#f8a0a0'); P(x + 12, 22, '#a8e8a0'); R(x + 17, 25, 7, 1, '#d8e8d8'); R(x + 17, 28, 5, 1, '#d8e8d8');
    R(x + 9, 54, 6, 2, '#f4f4f0');
  } },
  { id: 'mugshelf', name: 'Mug shelf', w: 2, h: 1, layer: 'wall', price: 240, wall(x) {
    [k.c, k.a, '#ffffff', BERRY[1], k.c].forEach((c, i) => { const px = x + 6 + i * 11; cyl(px, 32, 7, 9, c); R(px + 7, 34, 2, 1, c); R(px + 8, 34, 1, 4, c); R(px + 7, 37, 2, 1, c); R(px, 32, 7, 1, sh(c, 1)); });
    wood(x + 2, 41, 60, 4, k.w); R(x + 2, 45, 60, 1, 'rgba(0,0,0,0.25)');
    for (let i = 0; i < 5; i++) { R(x + 9 + i * 11, 45, 1, 3, k.m); P(x + 10 + i * 11, 48, k.m); }
    wood(x + 8, 46, 3, 8, sh(k.w, -1), 'y'); wood(x + 53, 46, 3, 8, sh(k.w, -1), 'y');
  } },
  { id: 'tilemat', name: 'Tile mat', w: 2, h: 2, layer: 'rug', price: 260, high: 0.04, side: 'p', flat(w, h) {
    R(0, 0, w, h, sh(k.p, -2));
    for (let j = 0; j < h; j += 8) for (let i = 0; i < w; i += 8) { const c = ((i + j) / 8) % 2 ? k.p : k.c; R(i + 1, j + 1, 7, 7, c); R(i + 1, j + 1, 7, 1, sh(c, 1)); P(i + 2, j + 2, sh(c, 2)); }
  } },
]);

/* ---------- garden ---------- */
const edged = (w, h, soil) => {
  R(0, 0, w, h, sh(k.w, -1));
  for (let i = 0; i < w; i += 8) { panel(i, 0, 8, 4, k.w); panel(i, h - 4, 8, 4, k.w); }
  for (let j = 4; j < h - 4; j += 8) { panel(0, j, 4, 8, k.w); panel(w - 4, j, 4, 8, k.w); }
  R(4, 4, w - 8, h - 8, soil); speckle(4, 4, w - 8, h - 8, sh(soil, -1), 7, 0.15); speckle(4, 4, w - 8, h - 8, sh(soil, 1), 8, 0.05);
};
/* Each bed grows its own kind of flower, not one flower in five colours: rose bushes, a carpet of daisies, violets under
   their leaves, marigold pompoms, bluebells hanging off arched stems. */
const BLOOMS = {
  rose(w, h) {
    for (const [cx, cy, n] of [[14, 16, 0], [32, 15, 1], [50, 16, 2]]) {
      foliage(cx, cy + 1, 9, sh(k.leaf, -1), n);
      for (const [dx, dy] of [[-4, -3], [3, -2], [0, 4]]) {
        disc(cx + dx, cy + dy, 3, '#a02038'); disc(cx + dx, cy + dy, 2.2, '#e04858');
        P(cx + dx, cy + dy, '#a02038'); P(cx + dx + 1, cy + dy, '#c83048'); P(cx + dx - 1, cy + dy - 2, '#f898a8');
      }
    }
  },
  daisy(w, h) {
    speckle(4, 4, w - 8, h - 8, sh(k.leaf, 1), 21, 0.18); speckle(4, 4, w - 8, h - 8, k.leaf, 22, 0.12);
    for (let n = 0; n < 26; n++) {
      const cx = 7 + Math.floor(hash(n, 1) * (w - 14)), cy = 7 + Math.floor(hash(n, 2) * (h - 14));
      for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2], [-1, -1], [1, -1], [-1, 1], [1, 1]]) P(cx + dx, cy + dy, dy > 0 ? '#e0e0d8' : '#ffffff');
      P(cx, cy, '#f8c838');
    }
  },
  violet(w, h) {
    for (let n = 0; n < 34; n++) leaf(6 + (n % 9) * 6.5 + (Math.floor(n / 9) % 2) * 3, 7 + Math.floor(n / 9) * 6, 3, 2, n % 3 ? sh(k.leaf, -1) : sh(k.leaf, -2), (n % 2 ? 0.6 : -0.6));
    for (const [cx, cy] of [[10, 9], [22, 20], [33, 10], [44, 21], [55, 10], [16, 23], [48, 13]]) for (const [dx, dy] of [[0, 0], [4, 1], [2, -3]]) {
      const fx = cx + dx, fy = cy + dy;
      P(fx - 1, fy - 1, '#a07ae8'); P(fx + 1, fy - 1, '#a07ae8'); P(fx - 1, fy, '#8a5ad8'); P(fx + 1, fy, '#8a5ad8'); P(fx, fy + 1, '#6a3ab8'); P(fx, fy, '#f8d850');
    }
  },
  marigold(w, h) {
    for (let i = 6; i < w - 6; i += 3) for (const y of [9, 20]) { P(i, y + 4, sh(k.leaf, -1)); P(i + 1, y + 5, k.leaf); }
    for (let n = 0; n < 10; n++) {
      const cx = 10 + (n % 5) * 11 + (Math.floor(n / 5) % 2) * 5, cy = 10 + Math.floor(n / 5) * 11;
      disc(cx, cy, 4.5, '#c85a10'); disc(cx, cy, 3.6, '#f08a20'); for (let a = 0; a < 8; a++) P(cx + Math.round(Math.cos(a * 0.785) * 2.4), cy + Math.round(Math.sin(a * 0.785) * 2.4), '#d86a18'); disc(cx, cy, 1.5, '#f8c040'); P(cx - 1, cy - 3, '#ffd080');
    }
  },
  bluebell(w, h) {
    for (let n = 0; n < 7; n++) { const lx = 7 + n * 8; for (let j = 0; j < 18; j++) P(lx + Math.round(j * 0.35), h - 6 - j, j % 5 ? k.leaf : sh(k.leaf, 1)); }
    for (let n = 0; n < 6; n++) {
      const sx = 7 + n * 9, sy = h - 7;
      for (let s = 0; s <= 14; s++) {
        const a = s / 14 * Math.PI * 0.85, nx = sx + Math.round(Math.sin(a) * 7), ny = sy - Math.round(Math.sin(a * 1.2) * 15);
        P(nx, ny, sh(k.leaf, -1));
        if (s > 5 && s % 3 === 0) { R(nx, ny + 1, 2, 2, '#4a78e0'); P(nx, ny + 3, '#2a4ab0'); P(nx + 1, ny + 3, '#7aa8ff'); }
      }
    }
  },
};
add('Garden', ['Rose', 'Daisy', 'Violet', 'Marigold', 'Bluebell'].map(name => ({ set: 'bed', id: `${name.toLowerCase()}bed`, name: `${name} bed`, w: 2, h: 1, price: 240, high: 0.12, side: 'w', flat(w, h) {
  edged(w, h, '#5a3a22');
  BLOOMS[name.toLowerCase()](w, h);
} })));
const CROPS = [
  ['carrot', 'Carrot', (cx, cy) => { R(cx - 1, cy - 3, 1, 4, k.leaf); R(cx + 1, cy - 3, 1, 4, k.leaf); R(cx, cy - 4, 1, 4, sh(k.leaf, 1)); R(cx - 1, cy + 1, 3, 2, '#f08030'); }],
  ['cabbage', 'Cabbage', (cx, cy) => { disc(cx, cy, 5, sh('#8ac868', -1)); disc(cx, cy, 4, '#8ac868'); disc(cx - 1, cy - 1, 2, '#c8f0a0'); P(cx, cy, '#5a9a48'); }],
  ['pumpkin', 'Pumpkin', (cx, cy) => { leaf(cx + 4, cy - 3, 2, 2, k.leaf); ovalShade(cx, cy, 5, 4, '#f08030'); R(cx, cy - 5, 1, 2, '#6a8a3a'); R(cx - 2, cy - 3, 1, 6, '#d86a20'); R(cx + 2, cy - 3, 1, 6, '#d86a20'); }],
  ['tomato', 'Tomato', (cx, cy) => { leaf(cx, cy, 3, 5, k.leaf); sphere(cx - 2, cy + 1, 2, '#e04040'); sphere(cx + 2, cy - 2, 2, '#e04040'); }],
];
add('Garden', CROPS.map(([id, name, crop]) => ({ set: 'patch', id: `${id}patch`, name: `${name} patch`, w: 2, h: 1, price: 220, high: 0.1, side: 'w', flat(w, h) {
  edged(w, h, '#6a4428');
  for (const cy of [11, 22]) { R(5, cy + 3, w - 10, 2, '#4a2e18'); R(5, cy - 4, w - 10, 1, '#7a5432'); for (let cx = 10; cx < w - 6; cx += 9) crop(cx, cy); }
} })));
add('Garden', [
  { id: 'pond', name: 'Garden pond', w: 2, h: 2, price: 650, high: 0.06, side: 'p', flat(w, h) {
    for (let a = 0; a < 22; a++) { const ang = a / 22 * Math.PI * 2; ovalShade(w / 2 + Math.cos(ang) * 27, h / 2 + Math.sin(ang) * 27, 5, 4, hash(a) < 0.5 ? STONE : sh(STONE, 1)); }
    oval(w / 2, h / 2, 25, 25, '#2a5a8a'); oval(w / 2, h / 2 - 2, 22, 21, '#3a7ab8'); oval(w / 2 - 4, h / 2 - 7, 12, 8, '#5a9ad0');
    for (const [i, j] of [[22, 34], [40, 26], [30, 46]]) { disc(i, j, 4, k.leaf); R(i, j - 4, 1, 4, '#2a5a8a'); P(i - 2, j - 1, sh(k.leaf, 1)); }
    flower(41, 25, k.c); ovalShade(26, 22, 3, 2, '#f08030'); P(24, 21, '#202028'); tri(30, 21, 2, '#f08030', 0.6);
    for (const [i, j] of [[18, 18], [44, 40]]) R(i, j, 4, 1, '#a8d8f0');
  } },
  { id: 'steppingstones', name: 'Stepping stones', w: 2, h: 1, layer: 'rug', price: 140, high: 0.03, side: 'p', flat(w, h) {
    for (const [i, j, rx] of [[11, 18, 8], [32, 13, 9], [53, 18, 8]]) { ovalShade(i, j, rx, rx * 0.75, STONE); speckle(i - rx + 2, j - 4, rx * 2 - 4, 8, sh(STONE, -1), i, 0.12); leaf(i + rx - 1, j + 4, 2, 1, k.leaf); }
  } },
  { id: 'gravelpath', name: 'Gravel path', w: 3, h: 1, layer: 'rug', price: 160, high: 0.03, side: 'w', flat(w, h) {
    R(0, 0, w, h, '#c8b89c'); speckle(0, 0, w, h, '#a8987c', 1, 0.2); speckle(0, 0, w, h, '#e8dcc4', 2, 0.12); speckle(0, 0, w, h, '#8a7c66', 3, 0.05);
    for (let i = 0; i < w; i += 8) { panel(i, 0, 8, 3, k.w); panel(i, h - 3, 8, 3, k.w); }
  } },
  { id: 'wateringcan', name: 'Watering can', w: 1, h: 1, price: 120, draw(x, b) {
    floorShadow(x + 4, b, 24);
    for (let i = 0; i < 9; i++) R(x + 20 + i, b - 9 - i, 2, 2, k.c);
    cyl(x + 6, b - 17, 15, 17, k.c); oval(x + 13, b - 17, 7, 2, sh(k.c, 1)); oval(x + 13, b - 17, 4, 1, '#2a3a5a');
    disc(x + 29, b - 18, 2.5, k.a); for (let i = 0; i < 3; i++) P(x + 28 + i, b - 18, sh(k.a, -2));
    for (let i = 0; i < 11; i++) R(x + 7 + i, b - 26 + Math.round((i - 5) ** 2 / 4), 1, 2, sh(k.c, -1));
    R(x + 6, b - 10, 15, 2, k.a);
  } },
  { id: 'wheelbarrow', name: 'Wheelbarrow', w: 1, h: 1, price: 280, draw(x, b) {
    floorShadow(x, b, 32);
    for (let i = 0; i < 18; i++) R(x + 12 + i, b - 12 - Math.floor(i * 0.4), 1, 2, sh(k.w, -1)); R(x + 26, b - 10, 2, 10, sh(k.w, -1));
    for (let j = 0; j < 12; j++) R(x + 1 + Math.floor(j * 0.6), b - 24 + j, 24 - Math.floor(j * 1.2), 1, j < 2 ? sh(k.c, 1) : k.c);
    oval(x + 13, b - 25, 11, 2, '#5a3a22'); foliage(x + 9, b - 28, 4, k.leaf, 3); flower(x + 16, b - 29, k.a);
    disc(x + 8, b - 6, 6, '#303038'); disc(x + 8, b - 6, 3, k.m); P(x + 8, b - 6, sh(k.m, 2));
  } },
  { id: 'gnome', name: 'Garden gnome', w: 1, h: 1, price: 180, draw(x, b) {
    floorShadow(x + 6, b, 20); R(x + 10, b - 4, 5, 4, '#5a3a22'); R(x + 17, b - 4, 5, 4, '#5a3a22');
    ovalShade(x + 16, b - 13, 8, 10, k.a); R(x + 8, b - 13, 16, 2, sh(k.w, -1)); R(x + 15, b - 13, 3, 2, '#f8d050');
    disc(x + 16, b - 26, 5, '#f8d0b0'); disc(x + 18, b - 25, 2, '#f8a090');
    for (let j = 0; j < 9; j++) R(x + 11 + Math.floor(j / 2), b - 24 + j, 10 - Math.floor(j / 2) * 2, 1, j < 1 ? '#e8e8f0' : '#ffffff');
    P(x + 14, b - 27, '#202028'); P(x + 18, b - 27, '#202028');
    tri(x + 16, b - 46, 16, k.c, 0.42); R(x + 9, b - 31, 15, 2, sh(k.c, -1)); P(x + 16, b - 46, sh(k.c, 2));
  } },
  { id: 'birdbath', name: 'Birdbath', w: 1, h: 1, price: 260, draw(x, b) {
    floorShadow(x + 4, b, 24); panel(x + 8, b - 5, 16, 5, k.p); cyl(x + 13, b - 24, 6, 19, k.p); R(x + 11, b - 12, 10, 2, sh(k.p, -1));
    for (let j = 0; j < 6; j++) { const h = 13 - j; R(x + 16 - h, b - 30 + j, h * 2, 1, j < 1 ? sh(k.p, 1) : k.p); }
    oval(x + 16, b - 30, 11, 2, '#7ab8e0'); R(x + 9, b - 31, 6, 1, '#c8e8f8');
    ovalShade(x + 22, b - 35, 4, 3, '#b8885a'); disc(x + 19, b - 38, 2.5, '#b8885a'); P(x + 18, b - 39, '#202028'); R(x + 16, b - 38, 2, 1, '#f0b040'); R(x + 25, b - 36, 3, 1, '#8a6040');
  } },
  { id: 'birdhouse', name: 'Birdhouse', w: 1, h: 1, price: 220, draw(x, b) {
    floorShadow(x + 6, b, 20); cyl(x + 14, b - 46, 4, 46, k.w);
    panel(x + 8, b - 64, 16, 18, k.c); disc(x + 16, b - 57, 3, '#2a1a10'); R(x + 15, b - 51, 2, 3, k.w);
    for (let j = 0; j < 9; j++) { R(x + 16 - j - 2, b - 74 + j, 2, 1, sh(k.a, -1)); R(x + 16 - j, b - 74 + j, j * 2 + 1, 1, k.a); R(x + 16 + j + 1, b - 74 + j, 2, 1, sh(k.a, -1)); }
    R(x + 5, b - 66, 22, 2, sh(k.a, -1));
  } },
  { id: 'gardenlamp', name: 'Garden lamp', w: 1, h: 1, price: 300, glow: ['g', 'gl'], draw(x, b) {
    floorShadow(x + 4, b, 24); panel(x + 10, b - 6, 12, 6, k.m); cyl(x + 14, b - 60, 4, 54, k.m); R(x + 12, b - 30, 8, 2, sh(k.m, 1));
    panel(x + 8, b - 78, 16, 18, k.m); R(x + 10, b - 76, 12, 14, k.g); R(x + 12, b - 74, 4, 10, k.gl); R(x + 15, b - 76, 2, 14, k.m);
    tri(x + 16, b - 86, 7, k.m, 1.2); sphere(x + 16, b - 87, 1.5, k.a); R(x + 7, b - 61, 18, 2, sh(k.m, -1));
  } },
  { id: 'picket', name: 'Picket fence', w: 1, h: 1, price: 90, draw(x, b, vw, dir) {
    floorShadow(x, b, vw);
    if (dir % 2) { panel(x + 13, b - 34, 6, 34, k.p); tri(x + 16, b - 38, 4, k.p, 0.8); return; }
    for (const i of [0, 11, 22]) { panel(x + i + 1, b - 32, 8, 32, k.p); tri(x + i + 5, b - 37, 5, k.p, 0.8); R(x + i + 1, b - 3, 8, 3, sh(k.p, -2)); }
    for (const j of [26, 12]) R(x, b - j, 32, 3, sh(k.p, -1));
  } },
  { id: 'rosearch', name: 'Rose arch', w: 2, h: 1, price: 700, draw(x, b, vw, dir) {
    floorShadow(x, b, vw);
    if (dir % 2) { cyl(x + 14, b - 72, 4, 72, k.w); foliage(x + 16, b - 40, 6, k.leaf, 4); return; }
    cyl(x + 3, b - 56, 4, 56, k.w); cyl(x + vw - 7, b - 56, 4, 56, k.w);
    for (let a = 0; a <= 40; a++) { const ang = Math.PI + a / 40 * Math.PI; R(Math.round(x + vw / 2 + Math.cos(ang) * 27) - 2, Math.round(b - 56 + Math.sin(ang) * 24), 4, 4, k.w); }
    for (let n = 0; n < 16; n++) { const ang = Math.PI + (n + 0.5) / 16 * Math.PI, rx = Math.round(x + vw / 2 + Math.cos(ang) * 27), ry = Math.round(b - 56 + Math.sin(ang) * 24); foliage(rx, ry, 4, k.leaf, n); if (n % 2) { disc(rx, ry, 2, k.c); P(rx - 1, ry - 1, sh(k.c, 2)); } }
    for (const [i, j] of [[5, -40], [vw - 5, -34], [5, -20], [vw - 5, -14]]) { foliage(x + i, b + j, 4, k.leaf, j); disc(x + i + 1, b + j, 2, k.c); }
  } },
  { id: 'hedge', name: 'Hedge', w: 1, h: 1, price: 160, draw(x, b) {
    floorShadow(x, b, 32); R(x + 1, b - 30, 30, 30, sh(k.leaf, -2));
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) foliage(x + 5 + i * 7, b - 25 + j * 7, 5, j === 0 ? sh(k.leaf, 1) : k.leaf, i + j * 4);
    R(x + 1, b - 3, 30, 3, sh(k.leaf, -3));
  } },
  { id: 'topiary', name: 'Topiary', w: 1, h: 1, price: 300, draw(x, b) {
    floorShadow(x + 4, b, 24); panel(x + 8, b - 14, 16, 14, k.pot); R(x + 7, b - 16, 18, 3, sh(k.pot, 1));
    cyl(x + 15, b - 50, 3, 36, k.w); foliage(x + 16, b - 30, 7, k.leaf, 1); foliage(x + 16, b - 54, 11, k.leaf, 2);
    for (const [i, j] of [[12, -60], [20, -50], [14, -30]]) { disc(x + i, b + j, 1.5, k.c); }
  } },
  { id: 'sundial', name: 'Sundial', w: 1, h: 1, price: 280, draw(x, b) {
    floorShadow(x + 4, b, 24); panel(x + 7, b - 6, 18, 6, k.p); cyl(x + 11, b - 26, 10, 20, k.p); for (let j = 8; j < 24; j += 4) R(x + 11, b - j, 10, 1, sh(k.p, -1));
    ovalShade(x + 16, b - 28, 13, 4, sh(k.p, 1)); oval(x + 16, b - 29, 10, 2, k.a);
    for (let h = 0; h < 12; h++) P(x + 16 + Math.round(Math.cos(h * Math.PI / 6) * 9), b - 29 + Math.round(Math.sin(h * Math.PI / 6) * 2), sh(k.a, -2));
    for (let j = 0; j < 7; j++) R(x + 16, b - 36 + j, Math.max(1, 7 - j), 1, k.m);
  } },
  { id: 'stonelantern', name: 'Stone lantern', w: 1, h: 1, price: 420, glow: ['g', 'gl'], draw(x, b) {
    floorShadow(x + 2, b, 28); panel(x + 6, b - 6, 20, 6, STONE); cyl(x + 12, b - 26, 8, 20, STONE); panel(x + 5, b - 30, 22, 4, STONE);
    panel(x + 8, b - 46, 16, 16, STONE); R(x + 11, b - 43, 10, 10, k.g); R(x + 12, b - 42, 4, 8, k.gl); R(x + 15, b - 43, 2, 10, STONE);
    for (let j = 0; j < 8; j++) R(x + 2 + j, b - 54 + j, 28 - j * 2, 1, j > 5 ? sh(STONE, -1) : STONE);
    sphere(x + 16, b - 58, 4, STONE); P(x + 15, b - 60, sh(STONE, 2)); speckle(x + 6, b - 46, 20, 40, k.leaf, 2, 0.04);
  } },
  { id: 'scarecrow', name: 'Scarecrow', w: 1, h: 1, price: 260, draw(x, b) {
    floorShadow(x + 4, b, 24); cyl(x + 15, b - 70, 3, 70, k.w); R(x + 2, b - 54, 28, 3, k.w);
    for (const i of [2, 27]) for (let j = 0; j < 4; j++) R(x + i + (i < 10 ? -1 : 1) * Math.floor(j / 2), b - 52 + j, 3, 1, '#e8c860');
    for (let j = 0; j < 24; j++) { const h = 8 + Math.floor(j / 6); R(x + 16 - h, b - 54 + j, h * 2, 1, j % 6 === 5 ? sh(k.c, -1) : k.c); }
    panel(x + 9, b - 44, 5, 5, k.a); R(x + 8, b - 32, 16, 2, '#8a5a30'); for (let i = 0; i < 4; i++) R(x + 9 + i * 4, b - 30, 2, 4, '#e8c860');
    disc(x + 16, b - 62, 7, '#e8d8a8'); P(x + 13, b - 63, '#202028'); P(x + 19, b - 63, '#202028'); R(x + 13, b - 59, 7, 1, '#8a5a30');
    R(x + 5, b - 70, 22, 2, '#c8a050'); panel(x + 9, b - 78, 14, 8, '#c8a050'); R(x + 9, b - 72, 14, 2, k.c);
  } },
  { id: 'swingseat', name: 'Garden swing', w: 2, h: 1, price: 800, draw(x, b, vw, dir) {
    floorShadow(x, b, vw);
    if (dir % 2) { for (let j = 0; j < 70; j++) { P(x + 16 - Math.floor(j / 5), b - 70 + j, k.w); P(x + 16 + Math.floor(j / 5), b - 70 + j, k.w); } cushion(x + 8, b - 30, 16, 8, k.c, 2); return; }
    for (const i of [2, vw - 6]) { cyl(x + i, b - 70, 4, 70, k.w); }
    wood(x, b - 74, vw, 5, sh(k.w, 1));
    for (const i of [10, vw - 12]) for (let j = b - 69; j < b - 34; j += 2) P(x + i, j, k.m);
    wood(x + 8, b - 34, vw - 16, 5, k.w); cushion(x + 8, b - 54, vw - 16, 18, k.c, 3); cushion(x + 8, b - 38, vw - 16, 6, sh(k.c, 1), 2);
    cushion(x + 14, b - 50, 10, 9, k.a, 3);
  } },
  { id: 'hammock', name: 'Hammock', w: 2, h: 1, price: 600, draw(x, b, vw, dir) {
    floorShadow(x, b, vw);
    if (dir % 2) { cyl(x + 14, b - 56, 4, 56, k.w); oval(x + 16, b - 30, 8, 5, k.c); return; }
    cyl(x + 1, b - 56, 4, 56, k.w); cyl(x + vw - 5, b - 56, 4, 56, k.w); sphere(x + 3, b - 57, 2.5, sh(k.w, 1)); sphere(x + vw - 3, b - 57, 2.5, sh(k.w, 1));
    for (let i = 0; i < vw - 10; i++) {
      const sag = Math.round(Math.sin(i / (vw - 11) * Math.PI) * 18), y = b - 50 + sag;
      R(x + 5 + i, y, 1, 7, (Math.floor(i / 5) % 2) ? k.c : k.a); P(x + 5 + i, y, sh(k.c, 1)); P(x + 5 + i, y + 6, sh(k.c, -2));
    }
    for (let i = 0; i < 6; i++) { P(x + 5 + i, b - 52 + i, k.m); P(x + vw - 6 - i, b - 52 + i, k.m); }
  } },
  { id: 'planter', name: 'Flower planter', w: 1, h: 1, price: 200, draw(x, b) {
    floorShadow(x, b, 32);
    for (let n = 0; n < 6; n++) { const cx = x + 5 + n * 4.5 | 0, h = 6 + (n % 3) * 3; R(cx, b - 16 - h, 1, h, sh(k.leaf, -1)); leaf(cx + 2, b - 18 - h / 2 | 0, 2, 1, k.leaf); }
    for (let n = 0; n < 6; n++) { const cx = x + 5 + n * 4.5 | 0, h = 6 + (n % 3) * 3; flower(cx, b - 17 - h, [k.c, k.a, k.p][n % 3]); }
    wood(x + 2, b - 16, 28, 16, k.w); R(x + 2, b - 16, 28, 2, sh(k.w, 1)); R(x + 4, b - 3, 24, 3, sh(k.w, -2));
  } },
  { id: 'beehive', name: 'Beehive', w: 1, h: 1, price: 340, draw(x, b) {
    floorShadow(x + 2, b, 28); panel(x + 5, b - 6, 22, 6, k.w);
    for (let j = 0; j < 6; j++) { const r = 12 - Math.abs(j - 2) * (j > 2 ? 1.6 : 1); cyl(x + 16 - r, b - 12 - j * 6, r * 2, 6, j % 2 ? '#e8b848' : '#d8a038'); R(x + 16 - r, b - 7 - j * 6, r * 2, 1, '#a87a28'); }
    disc(x + 16, b - 14, 3, '#3a2a10');
    for (const [i, j] of [[25, -34], [6, -42], [27, -48]]) { R(x + i, b + j, 3, 2, '#f8d030'); P(x + i + 1, b + j, '#303038'); P(x + i + 1, b + j - 1, '#ffffff'); }
  } },
  { id: 'appletree', name: 'Apple tree', w: 1, h: 1, price: 600, draw(x, b) {
    floorShadow(x, b, 32); for (let j = 0; j < 40; j++) R(x + 13 + Math.round(Math.sin(j / 8) * 1.5), b - j, 6 - Math.floor(j / 14), 1, j % 5 ? k.w : sh(k.w, -1));
    R(x + 10, b - 2, 12, 2, sh(k.w, -1)); foliage(x + 9, b - 52, 9, k.leaf, 1); foliage(x + 23, b - 54, 9, k.leaf, 2); foliage(x + 16, b - 66, 11, k.leaf, 3);
    for (const [i, j] of [[8, -48], [22, -50], [15, -60], [25, -62], [10, -66], [18, -72]]) sphere(x + i, b + j, 2, BERRY[0]);
    sphere(x + 24, b - 4, 2, BERRY[0]);
  } },
  { id: 'well', name: 'Wishing well', w: 1, h: 1, price: 900, draw(x, b) {
    floorShadow(x, b, 32); cyl(x + 3, b - 26, 3, 26, k.w); cyl(x + 26, b - 66, 3, 40, k.w); cyl(x + 3, b - 66, 3, 40, k.w);
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) panel(x + 2 + i * 7 + (j % 2 ? 3 : 0), b - 24 + j * 6, 7, 6, hash(i, j) < 0.4 ? sh(STONE, -1) : STONE);
    oval(x + 16, b - 26, 14, 3, sh(STONE, 1)); oval(x + 16, b - 26, 11, 2, '#1a2a3a');
    for (let j = 0; j < 12; j++) R(x + 15 - j - 1, b - 76 + j, j * 2 + 4, 1, j < 2 ? sh(k.c, 1) : j % 3 ? k.c : sh(k.c, -1));
    cyl(x + 5, b - 56, 22, 3, k.w); R(x + 16, b - 53, 1, 12, k.m); panel(x + 13, b - 41, 7, 6, k.w); R(x + 13, b - 39, 7, 1, k.m);
  } },
  { id: 'hosereel', name: 'Hose reel', w: 1, h: 1, price: 180, draw(x, b) {
    floorShadow(x + 2, b, 28); for (const i of [5, 24]) R(x + i, b - 22, 3, 22, k.m);
    disc(x + 16, b - 18, 12, sh(k.c, -1));
    for (let r = 11; r > 3; r -= 2) disc(x + 16, b - 18, r, r % 4 === 3 ? k.c : sh(k.c, 1));
    disc(x + 16, b - 18, 3, k.m); R(x + 26, b - 20, 4, 2, k.a);
    for (let i = 0; i < 12; i++) R(x + 2 + i, b - 3 - Math.round(Math.sin(i / 3) * 1), 1, 2, k.c);
  } },
  { id: 'trellis', name: 'Ivy trellis', w: 1, h: 1, layer: 'wall', price: 200, wall(x) {
    for (let i = 0; i < 4; i++) { R(x + 4 + i * 8, 14, 2, 62, k.w); R(x + 2, 18 + i * 16, 28, 2, k.w); }
    for (let n = 0; n < 22; n++) leaf(x + 4 + Math.floor(hash(n) * 24), 20 + Math.floor(hash(n, 3) * 54), 3, 2, n % 3 ? k.leaf : sh(k.leaf, -1), hash(n, 5) - 0.5);
    for (let n = 0; n < 4; n++) flower(x + 6 + Math.floor(hash(n, 8) * 20), 24 + Math.floor(hash(n, 9) * 44), k.c);
  } },
  { id: 'windowbox', name: 'Window box', w: 2, h: 1, layer: 'wall', price: 260, wall(x) {
    for (let n = 0; n < 9; n++) { const cx = x + 8 + n * 6, h = 8 + (n % 3) * 4; R(cx, 58 - h, 1, h, sh(k.leaf, -1)); leaf(cx - 2, 54 - h / 2 | 0, 2, 2, k.leaf, -0.4); leaf(cx + 2, 52 - h / 2 | 0, 2, 2, k.leaf, 0.4); flower(cx, 57 - h, [k.c, k.a, '#ffffff'][n % 3]); }
    shadowWall(x + 4, 56, 56, 14); wood(x + 4, 56, 56, 14, k.w); R(x + 4, 56, 56, 2, sh(k.w, 1)); for (const i of [10, 50]) R(x + i, 70, 4, 4, sh(k.w, -1));
  } },
  { id: 'gardentools', name: 'Tool rack', w: 2, h: 1, layer: 'wall', price: 240, wall(x) {
    R(x + 11, 22, 2, 34, k.w); for (let i = 0; i < 6; i++) R(x + 6 + i * 2, 56, 1, 6, k.m); R(x + 6, 55, 11, 2, k.m);
    R(x + 31, 22, 2, 30, k.w); for (let j = 0; j < 12; j++) R(x + 28 + Math.floor(j / 6), 52 + j, 8 - Math.floor(j / 4), 1, k.m);
    R(x + 51, 22, 2, 30, k.w); for (let i = 0; i < 4; i++) R(x + 47 + i * 3, 52, 1, 10, k.m); R(x + 47, 52, 10, 2, k.m);
    shadowWall(x + 4, 18, 56, 6); wood(x + 4, 18, 56, 6, k.w); for (const i of [12, 32, 52]) sphere(x + i, 21, 1.5, k.a);
  } },
]);

/* ---------- Pokémon Center and Poké Mart ---------- */
const SHELF_ITEMS = {
  potion: ['Potion shelf', (px, fl) => { R(px + 1, fl - 9, 4, 9, '#a868d8'); R(px + 1, fl - 6, 4, 3, '#ffffff'); R(px + 2, fl - 11, 2, 2, '#e8e8f0'); P(px + 1, fl - 9, '#d0a0f0'); }],
  ball: ['Poké Ball shelf', (px, fl, i) => ball(px + 3, fl - 4, 3, ['#e04848', '#3a6ac8', '#f0c838', '#7a3ab8'][i % 4])],
  berry: ['Berry shelf', (px, fl, i) => { sphere(px + 3, fl - 3, 3, BERRY[i % 6]); R(px + 3, fl - 7, 1, 2, '#4f9a42'); }],
  medicine: ['Medicine shelf', (px, fl, i) => { const c = ['#f0d030', '#68c868', '#f08888', '#68b8f0'][i % 4]; R(px + 1, fl - 9, 4, 9, c); R(px + 1, fl - 9, 4, 2, '#ffffff'); R(px + 2, fl - 6, 2, 3, sh(c, 1)); }],
};
add('Pokémon Center', Object.entries(SHELF_ITEMS).map(([id, [name, item]]) => ({ set: 'shelf', id: `${id}shelf`, name, proper: id === 'ball', w: 1, h: 1, price: 420, solid: true,
  draw(x, b, vw, dir) {
    floorShadow(x, b, vw); wood(x + 1, b - 72, 30, 72, k.w, 'y'); wood(x, b - 74, 32, 5, sh(k.w, 1)); R(x + 2, b - 72, 28, 4, k.c);
    if (dir % 2 || dir === 2) return;
    for (let row = 0; row < 3; row++) {
      const top = b - 66 + row * 21, fl = top + 17;
      R(x + 3, top, 26, 17, sh(k.w, -2)); R(x + 3, top, 26, 2, sh(k.w, -3));
      for (let i = 0; i < 4; i++) item(x + 4 + i * 6, fl, i + row);
      wood(x + 2, fl, 28, 3, sh(k.w, 1)); R(x + 12, fl + 1, 8, 2, '#ffffff');
    }
  } })));
add('Pokémon Center', [
  { id: 'reception', name: 'Reception desk', w: 2, h: 1, price: 900, draw(x, b, vw, dir) {
    if (dir % 2) return sideBox(x, b, vw, 38);
    floorShadow(x, b, vw); panel(x, b - 36, vw, 36, k.p, 2); R(x, b - 22, vw, 6, k.c); R(x, b - 22, vw, 1, sh(k.c, 2)); R(x, b - 4, vw, 4, sh(k.p, -2));
    panel(x - 1, b - 40, vw + 2, 5, k.w);
    if (dir === 2) return;
    ball(x + vw / 2, b - 19, 7, ballTop());
    sphere(x + 10, b - 43, 3, k.a); R(x + 7, b - 41, 7, 1, sh(k.a, -2)); P(x + 10, b - 47, k.a);
    panel(x + 44, b - 46, 12, 7, '#ffffff'); R(x + 45, b - 46, 10, 2, k.m); for (let i = 0; i < 2; i++) R(x + 46, b - 43 + i * 2, 8, 1, sh(k.p, -2));
  } },
  { id: 'register', name: 'Cash register', w: 1, h: 1, price: 480, draw(x, b) {
    floorShadow(x, b, 32); wood(x + 1, b - 30, 30, 30, k.w); R(x + 1, b - 30, 30, 4, k.c); R(x + 3, b - 3, 26, 3, sh(k.w, -2));
    panel(x + 4, b - 40, 24, 10, k.m); R(x + 6, b - 38, 20, 1, sh(k.m, 2)); for (let j = 0; j < 2; j++) for (let i = 0; i < 4; i++) R(x + 7 + i * 5, b - 36 + j * 3, 3, 2, sh(k.m, 2));
    panel(x + 8, b - 50, 16, 8, sh(k.m, -1)); R(x + 10, b - 48, 12, 4, '#68f0a0'); R(x + 11, b - 47, 4, 1, '#e8fff0'); R(x + 14, b - 42, 4, 2, k.m);
    R(x + 4, b - 30, 24, 3, sh(k.m, -1)); sphere(x + 26, b - 33, 1.5, '#f8d030');
  } },
  { id: 'trademachine', name: 'Trade machine', w: 2, h: 1, price: 1400, glow: ['#68e8f8', '#d8faff'], draw(x, b, vw, dir) {
    if (dir % 2) return sideBox(x, b, vw, 50);
    floorShadow(x, b, vw);
    for (const px of [x + 2, x + vw - 22]) {
      panel(px, b - 12, 20, 12, k.m, 2); R(px + 2, b - 10, 16, 2, k.c);
      for (let j = 0; j < 30; j++) { const h = j < 8 ? Math.round(Math.sqrt(64 - (8 - j) ** 2)) + 1 : 9; R(px + 10 - h, b - 42 + j, h * 2, 1, j < 10 ? '#d8faff' : '#a8eef8'); }
      R(px + 3, b - 38, 2, 22, '#ffffff'); ball(px + 10, b - 22, 4, ballTop());
    }
    for (let i = 0; i < vw - 40; i++) R(x + 22 + i, b - 8 + Math.round(Math.sin(i / 3)), 1, 2, k.a);
    panel(x + 26, b - 30, 12, 18, k.p); R(x + 28, b - 28, 8, 6, '#68e8f8'); sphere(x + 32, b - 17, 2, '#68e868');
  } },
  { id: 'incubator', name: 'Egg incubator', w: 1, h: 1, price: 700, glow: ['#f8d8a0', '#fff4d8'], draw(x, b) {
    floorShadow(x, b, 32); panel(x + 3, b - 14, 26, 14, k.m, 2); R(x + 5, b - 12, 22, 2, k.c); sphere(x + 8, b - 6, 1.5, '#68e868'); R(x + 13, b - 7, 12, 3, '#3a4a5a'); R(x + 14, b - 6, 6, 1, '#f8a030');
    for (let j = 0; j < 22; j++) { const h = Math.round(Math.sqrt(Math.max(0, 121 - (11 - Math.min(j, 11)) ** 2))) + 1; R(x + 16 - h, b - 36 + j, h * 2, 1, j < 4 ? '#fff4d8' : '#f8e8c0'); }
    ovalShade(x + 16, b - 22, 6, 8, '#f8f0e0'); for (const [i, j] of [[13, -25], [19, -21], [15, -18]]) disc(x + i, b + j, 1.5, '#68b868');
    R(x + 7, b - 32, 2, 14, '#ffffff');
  } },
  { id: 'balldisplay', name: 'Poké Ball stand', proper: true, w: 1, h: 1, price: 450, draw(x, b) {
    floorShadow(x + 2, b, 28); panel(x + 4, b - 8, 24, 8, k.w); cyl(x + 10, b - 28, 12, 20, k.p); R(x + 10, b - 22, 12, 2, k.a);
    panel(x + 6, b - 32, 20, 4, k.w); cushion(x + 8, b - 36, 16, 5, k.c, 2);
    ball(x + 16, b - 43, 7, '#e04848'); R(x + 11, b - 49, 3, 2, '#f8a8a8');
  } },
  { id: 'waitbench', name: 'Waiting bench', w: 2, h: 1, price: 520, draw(x, b, vw, dir) {
    if (dir % 2) return sideBox(x, b, vw, 22);
    floorShadow(x, b, vw); for (const i of [5, vw - 9]) cyl(x + i, b - 14, 4, 14, k.m); R(x + 8, b - 6, vw - 16, 2, k.m);
    cushion(x + 2, b - 44, vw - 4, 22, k.c, 4); if (dir === 0) ball(x + vw / 2, b - 34, 5, '#ffffff');
    cushion(x, b - 22, vw, 9, sh(k.c, 1), 3); R(x + vw / 2, b - 21, 1, 7, sh(k.c, -1));
  } },
  { id: 'nursecart', name: 'Nurse’s cart', w: 1, h: 1, price: 400, draw(x, b) {
    floorShadow(x, b, 32); for (const i of [5, 25]) disc(x + i, b - 3, 3, '#303038');
    panel(x + 2, b - 30, 28, 24, k.p, 2); R(x + 4, b - 22, 24, 1, sh(k.p, -2)); R(x + 4, b - 14, 24, 1, sh(k.p, -2)); for (const j of [-27, -19, -11]) R(x + 14, b + j, 4, 2, k.c);
    R(x + 1, b - 32, 30, 3, k.c); R(x + 28, b - 42, 2, 12, k.m); R(x + 24, b - 43, 7, 2, k.m);
    for (const i of [4, 10]) { R(x + i, b - 40, 4, 8, '#a868d8'); R(x + i + 1, b - 42, 2, 2, '#ffffff'); } ball(x + 20, b - 36, 3, ballTop());
  } },
  { id: 'candyjar', name: 'Rare Candy jar', proper: true, w: 1, h: 1, price: 380, draw(x, b) {
    floorShadow(x + 4, b, 24); panel(x + 6, b - 4, 20, 4, k.w);
    R(x + 7, b - 30, 18, 26, '#e0f0f8'); R(x + 6, b - 28, 20, 22, '#e0f0f8');
    for (let n = 0; n < 16; n++) { const i = x + 9 + (n % 4) * 4 + (Math.floor(n / 4) % 2) * 2, j = b - 9 - Math.floor(n / 4) * 4; oval(i, j, 2, 1.5, ['#4a78d8', '#f0c8e8', '#68b8f0', '#ffffff'][n % 4]); }
    R(x + 8, b - 28, 2, 18, '#ffffff'); R(x + 8, b - 33, 16, 3, k.a); cyl(x + 9, b - 36, 14, 3, k.c); sphere(x + 16, b - 38, 2, k.a);
  } },
  { id: 'tmcase', name: 'TM case', w: 1, h: 1, price: 520, draw(x, b) {
    floorShadow(x, b, 32); wood(x + 1, b - 28, 30, 28, k.w); inset(x + 4, b - 24, 24, 18, sh(k.w, -1)); panel(x + 5, b - 23, 22, 16, k.w); R(x + 14, b - 16, 4, 2, k.a);
    panel(x, b - 38, 32, 10, k.m); glass(x + 2, b - 37, 28, 8, '#d8eef8');
    for (let i = 0; i < 5; i++) { const c = ['#e04848', '#4a78d8', '#68c868', '#f0d030', '#a868d8'][i]; disc(x + 5 + i * 5.5 | 0, b - 33, 2.5, c); P(x + 5 + i * 5.5 | 0, b - 33, '#ffffff'); }
  } },
  { id: 'itemball', name: 'Item ball', w: 1, h: 1, price: 100, draw(x, b) {
    floorShadow(x + 6, b, 20); ball(x + 16, b - 9, 8, ballTop()); R(x + 11, b - 15, 3, 2, sh(ballTop(), 3));
  } },
  { id: 'centerplant', name: 'Tall Center plant', w: 1, h: 1, price: 360, draw(x, b) {
    floorShadow(x + 2, b, 28); panel(x + 6, b - 16, 20, 16, k.p); R(x + 6, b - 11, 20, 3, k.c); R(x + 5, b - 18, 22, 3, sh(k.p, 1));
    for (const [cx, h] of [[12, 44], [18, 56], [22, 38]]) { cyl(x + cx, b - 16 - h, 2, h, k.w); for (let n = 0; n < 4; n++) { leaf(x + cx - 4, b - 18 - h + n * 6, 5, 2, n % 2 ? k.leaf : sh(k.leaf, 1), -0.5); leaf(x + cx + 5, b - 15 - h + n * 6, 5, 2, k.leaf, 0.5); } }
  } },
  { id: 'scale', name: 'Pokémon scale', proper: true, w: 1, h: 1, price: 300, draw(x, b) {
    floorShadow(x, b, 32); panel(x + 1, b - 6, 30, 6, k.m); R(x + 3, b - 8, 26, 2, k.p);
    cyl(x + 14, b - 42, 4, 34, k.m); disc(x + 16, b - 48, 9, sh(k.m, -1)); disc(x + 16, b - 48, 8, '#ffffff');
    for (let h = 0; h < 8; h++) P(x + 16 + Math.round(Math.cos(h * Math.PI / 4) * 6), b - 48 + Math.round(Math.sin(h * Math.PI / 4) * 6), sh(k.m, -1));
    for (let i = 0; i < 5; i++) P(x + 16 + i, b - 48 - Math.floor(i / 2), k.c);
  } },
  { id: 'eggbasket', name: 'Egg basket', w: 1, h: 1, price: 260, draw(x, b) {
    floorShadow(x + 2, b, 28);
    for (const [i, j, c, s] of [[10, -14, '#f8f0d8', '#68b868'], [21, -15, '#f8e0f0', '#e868a8'], [16, -20, '#e0f0f8', '#4a88d8']]) { ovalShade(x + i, b + j, 5, 6, c); disc(x + i + 1, b + j - 1, 1.5, s); P(x + i - 2, b + j + 2, s); }
    for (let j = 0; j < 12; j++) R(x + 3 + Math.floor(j / 4), b - 12 + j, 26 - Math.floor(j / 4) * 2, 1, j % 3 ? k.w : sh(k.w, 1));
    for (let i = 0; i < 9; i++) R(x + 5 + i * 3, b - 12, 1, 12, sh(k.w, -1));
    for (let a = 0; a <= 20; a++) R(Math.round(x + 16 + Math.cos(Math.PI + a / 20 * Math.PI) * 12), Math.round(b - 12 + Math.sin(Math.PI + a / 20 * Math.PI) * 18), 2, 2, k.w);
  } },
  { id: 'healpod', name: 'Healing pod', w: 1, h: 1, price: 1200, glow: ['#a8f0d8', '#e8fff8'], draw(x, b) {
    floorShadow(x, b, 32); panel(x + 2, b - 10, 28, 10, k.m, 2); R(x + 4, b - 8, 24, 2, k.c);
    for (let j = 0; j < 52; j++) { const h = j < 8 ? Math.round(Math.sqrt(64 - (8 - j) ** 2)) + 4 : 12; R(x + 16 - h, b - 62 + j, h * 2, 1, j % 8 === 0 ? '#e8fff8' : '#a8f0d8'); }
    R(x + 6, b - 56, 2, 42, '#ffffff'); ball(x + 16, b - 34, 6, ballTop());
    panel(x + 1, b - 66, 30, 6, k.m); R(x + 3, b - 64, 26, 1, sh(k.m, 2));
  } },
  { id: 'balllamp', name: 'Poké Ball lamp', proper: true, w: 1, h: 1, price: 340, glow: ['gl'], draw(x, b) {
    floorShadow(x + 4, b, 24); ovalShade(x + 16, b - 4, 9, 3, k.m); cyl(x + 15, b - 30, 3, 26, k.m);
    disc(x + 16, b - 42, 13, '#303038'); disc(x + 16, b - 42, 12, k.gl);
    for (let j = -12; j < 0; j++) { const h = Math.sqrt(144 - j * j); R(Math.round(x + 16 - h), b - 42 + j, Math.round(h * 2) + 1, 1, j < -9 ? sh(ballTop(), 1) : ballTop()); }
    R(x + 4, b - 43, 25, 3, '#303038'); disc(x + 16, b - 42, 4, '#303038'); disc(x + 16, b - 42, 2.5, k.gl); R(x + 9, b - 51, 3, 2, sh(ballTop(), 3));
  } },
  { id: 'centersign', name: 'Center sign', w: 2, h: 1, layer: 'wall', price: 450, wall(x) {
    shadowWall(x + 4, 20, 56, 36); panel(x + 4, 20, 56, 36, k.c, 2); R(x + 6, 22, 52, 2, sh(k.c, 2)); inset(x + 7, 26, 50, 26, sh(k.c, -1));
    ball(x + 20, 39, 9, '#ffffff');
    stamp(['###.', '#..#', '###.', '#...', '#...'], x + 33, 32, { '#': '#ffffff' }, 3); stamp(['.##', '#..', '#..', '#..', '.##'], x + 48, 32, { '#': '#ffffff' }, 3);
    for (const i of [10, 54]) R(x + i, 14, 1, 6, k.m);
  } },
  { id: 'badgecase', name: 'Badge case', w: 2, h: 1, layer: 'wall', price: 600, wall(x) {
    shadowWall(x + 4, 24, 56, 32); wood(x + 4, 24, 56, 32, k.w); inset(x + 7, 27, 50, 26, sh(k.c, -2)); R(x + 8, 28, 48, 24, sh(k.c, -1));
    const looks = [['#a8a8b0', 'o'], ['#68b8f0', 'd'], ['#f08030', 's'], ['#78c858', 'f'], ['#e868a8', 'h'], ['#f0d030', 'o'], ['#e04848', 'd'], ['#68c868', 's']];
    looks.forEach(([c, s], i) => {
      const cx = x + 13 + (i % 4) * 12, cy = 34 + Math.floor(i / 4) * 11;
      if (s === 'o') { disc(cx, cy, 3.5, sh(c, -1)); disc(cx - 0.5, cy - 0.5, 2.5, c); }
      else if (s === 'd') { for (let j = -3; j <= 3; j++) R(cx - (3 - Math.abs(j)), cy + j, (3 - Math.abs(j)) * 2 + 1, 1, j < 0 ? sh(c, 1) : c); }
      else if (s === 's') stamp(['.#.', '###', '.#.'], cx - 3, cy - 3, { '#': c }, 2);
      else if (s === 'f') { for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2]]) disc(cx + dx, cy + dy, 1.5, c); P(cx, cy, '#f8f0a0'); }
      else stamp(MOTIFS.heart, cx - 4, cy - 4, { '#': c, '+': sh(c, 1) }, 1);
      P(cx - 1, cy - 2, '#ffffff');
    });
    R(x + 7, 27, 50, 1, 'rgba(255,255,255,0.4)');
  } },
  { id: 'firstaid', name: 'First-aid kit', w: 1, h: 1, layer: 'wall', price: 140, wall(x) {
    shadowWall(x + 6, 28, 20, 18); panel(x + 6, 28, 20, 18, '#ffffff'); R(x + 6, 28, 20, 3, k.c);
    R(x + 14, 33, 4, 11, k.c); R(x + 10, 37, 12, 4, k.c); R(x + 14, 33, 4, 1, sh(k.c, 1)); R(x + 13, 25, 6, 3, k.m);
  } },
  { id: 'floorseal', name: 'Center floor seal', w: 2, h: 2, layer: 'rug', price: 500, high: 0.04, side: 'c', flat(w, h) {
    disc(w / 2, h / 2, 31, sh(k.c, -1)); disc(w / 2, h / 2, 29, k.p); disc(w / 2, h / 2, 26, k.c); disc(w / 2, h / 2, 24, k.p);
    for (let j = -23; j < 0; j++) { const s = Math.sqrt(529 - j * j); R(Math.round(w / 2 - s), h / 2 + j, Math.round(s * 2) + 1, 1, sh(k.c, 1)); }
    R(w / 2 - 24, h / 2 - 2, 49, 4, sh(k.c, -2)); disc(w / 2, h / 2, 8, sh(k.c, -2)); disc(w / 2, h / 2, 6, k.p); disc(w / 2, h / 2, 3, k.a);
    for (let a = 0; a < 8; a++) { const ang = a / 8 * Math.PI * 2; disc(w / 2 + Math.cos(ang) * 27.5, h / 2 + Math.sin(ang) * 27.5, 1.5, k.a); }
  } },
  { id: 'doormat', name: 'Welcome mat', w: 2, h: 1, layer: 'rug', price: 150, high: 0.04, side: 'c', flat(w, h) {
    R(0, 0, w, h, sh(k.c, -1)); R(2, 2, w - 4, h - 4, k.c); speckle(2, 2, w - 4, h - 4, sh(k.c, -1), 3, 0.25);
    R(4, 4, w - 8, 1, k.a); R(4, h - 5, w - 8, 1, k.a);
    stamp(['#...#', '#...#', '#.#.#', '##.##', '#...#'], 22, 11, { '#': k.p }, 2);
    ball(48, h / 2, 5, k.a); ball(14, h / 2, 5, k.a);
  } },
  { id: 'restbed', name: 'Rest bed', w: 1, h: 2, price: 500, high: 0.5, side: 'm', seat: 'bed', flat(w, h) {
    panel(0, 0, w, h, k.m); R(2, 2, w - 4, h - 4, '#ffffff'); cushion(4, 4, w - 8, 10, '#ffffff', 3); ball(16, 9, 3, k.c);
    cushion(2, 22, w - 4, h - 25, k.c, 2); R(2, 22, w - 4, 3, sh(k.c, 1)); R(2, 27, w - 4, 2, '#ffffff');
    for (let y = 34; y < h - 4; y += 8) R(5, y, w - 10, 1, sh(k.c, -1));
  } },
]);

/* ---------- gym ---------- */
const STATUE = ['....#.....', '...##.....', '..###.....', '.#####....', '.#k####...', '.######.#.', '..####..#.', '.#######..', '########..', '.######...', '.######...', '.##..##...'];
add('Gym', [
  { id: 'gymstatue', name: 'Gym statue', w: 1, h: 1, price: 900, draw(x, b) {
    floorShadow(x, b, 32); panel(x + 2, b - 22, 28, 22, k.p, 2); R(x + 4, b - 20, 24, 1, sh(k.p, 2)); panel(x + 9, b - 16, 14, 7, k.a); R(x + 11, b - 13, 10, 1, sh(k.a, -2));
    panel(x, b - 26, 32, 4, sh(k.p, -1));
    stamp(STATUE, x + 6, b - 50, { '#': STONE, k: '#3a3a48' }, 2);
  } },
  { id: 'dummy', name: 'Training dummy', w: 1, h: 1, price: 220, draw(x, b) {
    floorShadow(x + 4, b, 24); panel(x + 8, b - 5, 16, 5, k.w); cyl(x + 14, b - 64, 4, 60, k.w); R(x + 4, b - 50, 24, 3, k.w);
    cyl(x + 7, b - 46, 18, 32, '#e8c860'); for (const j of [-42, -30, -18]) R(x + 7, b + j, 18, 2, k.m);
    for (const r of [7, 5, 3, 1]) disc(x + 16, b - 34, r, r % 4 === 3 ? '#ffffff' : k.c);
    disc(x + 16, b - 56, 7, '#e8c860'); R(x + 12, b - 58, 8, 2, k.c); P(x + 13, b - 54, '#5a3a22'); P(x + 19, b - 54, '#5a3a22');
  } },
  { id: 'punchbag', name: 'Punching bag', w: 1, h: 1, price: 380, draw(x, b) {
    floorShadow(x, b, 32); for (let j = 0; j < 80; j++) R(x + 2 + Math.floor(j / 40), b - 80 + j, 3, 1, k.m); R(x + 1, b - 4, 10, 4, sh(k.m, -1));
    R(x + 2, b - 82, 18, 3, k.m); for (let j = b - 79; j < b - 70; j += 2) P(x + 17, j, sh(k.m, 1));
    cyl(x + 10, b - 70, 15, 44, k.c); oval(x + 17, b - 70, 7, 2, sh(k.c, 1)); oval(x + 17, b - 26, 7, 2, sh(k.c, -1));
    for (const j of [-62, -34]) R(x + 10, b + j, 15, 3, k.a);
  } },
  { id: 'dumbbells', name: 'Dumbbell rack', w: 1, h: 1, price: 420, draw(x, b) {
    floorShadow(x, b, 32); R(x + 3, b - 34, 3, 34, k.m); R(x + 26, b - 34, 3, 34, k.m);
    for (let r = 0; r < 3; r++) {
      const y = b - 30 + r * 10; R(x + 2, y + 5, 28, 2, sh(k.m, -1));
      for (const i of [6, 18]) { R(x + i + 2, y + 1, 4, 2, k.m); const s = 2 + r; panel(x + i, y + 2 - s / 2 | 0, 3, s + 2, k.c); panel(x + i + 6, y + 2 - s / 2 | 0, 3, s + 2, k.c); }
    }
  } },
  { id: 'weightbench', name: 'Weight bench', w: 2, h: 1, price: 650, draw(x, b, vw, dir) {
    if (dir % 2) return sideBox(x, b, vw, 30);
    floorShadow(x, b, vw); for (const i of [8, vw - 12]) cyl(x + i, b - 16, 4, 16, k.m);
    cushion(x + 4, b - 22, vw - 8, 7, k.c, 2);
    for (const i of [2, vw - 5]) cyl(x + i, b - 48, 3, 48, k.m);
    R(x - 1, b - 46, vw + 2, 2, sh(k.m, 1));
    for (const i of [3, vw - 9]) { panel(x + i, b - 54, 6, 18, '#303038'); R(x + i + 1, b - 52, 1, 14, '#5a5a68'); }
  } },
  { id: 'treadmill', name: 'Treadmill', w: 2, h: 1, price: 900, draw(x, b, vw, dir) {
    if (dir % 2) return sideBox(x, b, vw, 50);
    floorShadow(x, b, vw); panel(x + 2, b - 10, vw - 4, 10, k.m, 2); R(x + 4, b - 12, vw - 14, 3, '#303038'); for (let i = 6; i < vw - 12; i += 5) P(x + i, b - 11, '#5a5a68');
    for (const i of [vw - 12, vw - 6]) cyl(x + i, b - 50, 3, 40, k.m);
    panel(x + vw - 22, b - 60, 22, 12, k.c, 2); R(x + vw - 19, b - 57, 12, 5, '#3a4a5a'); R(x + vw - 18, b - 56, 6, 2, '#68e868'); sphere(x + vw - 5, b - 54, 1.5, k.a);
    R(x + vw - 30, b - 40, 18, 2, k.m);
  } },
  { id: 'exbike', name: 'Exercise bike', w: 1, h: 1, price: 600, draw(x, b) {
    floorShadow(x, b, 32); R(x + 2, b - 4, 28, 4, k.m);
    disc(x + 22, b - 16, 9, k.m); disc(x + 22, b - 16, 7, sh(k.m, -1)); disc(x + 22, b - 16, 2, k.a);
    for (let j = 0; j < 30; j++) R(x + 8 + Math.floor(j * 0.25), b - 34 + j, 3, 1, k.c);
    for (let j = 0; j < 22; j++) R(x + 24 + Math.floor(j * 0.15), b - 46 + j, 3, 1, k.c);
    cushion(x + 3, b - 38, 12, 5, '#303038', 2); R(x + 22, b - 48, 9, 3, '#303038'); panel(x + 25, b - 44, 6, 4, '#3a4a5a');
    R(x + 15, b - 16, 6, 2, k.m); R(x + 13, b - 20, 4, 2, '#303038');
  } },
  { id: 'kettlebells', name: 'Kettlebells', w: 1, h: 1, price: 200, draw(x, b) {
    floorShadow(x, b, 32);
    for (const [cx, r, c] of [[8, 6, k.m], [22, 8, k.c], [15, 4, k.a]]) {
      for (let a = 0; a <= 12; a++) R(Math.round(x + cx + Math.cos(Math.PI + a / 12 * Math.PI) * (r - 1)), Math.round(b - r * 2 + Math.sin(Math.PI + a / 12 * Math.PI) * r * 0.8) - 1, 2, 2, sh(c, -1));
      ovalShade(x + cx, b - r, r, r, c);
    }
  } },
  { id: 'yogamat', name: 'Exercise mat', w: 1, h: 2, layer: 'rug', price: 160, high: 0.04, side: 'c', flat(w, h) {
    R(2, 8, w - 4, h - 10, k.c); for (let j = 10; j < h - 2; j += 4) R(4, j, w - 8, 1, sh(k.c, -1)); R(2, h - 3, w - 4, 1, sh(k.c, -2));
    cyl(1, 0, w - 2, 10, sh(k.c, 1)); for (const i of [6, 13, 20]) R(i, 1, 1, 8, sh(k.c, -1)); R(1, 4, w - 2, 1, k.a);
  } },
  { id: 'battlecourt', name: 'Battle court', w: 3, h: 2, layer: 'rug', price: 900, high: 0.04, side: 'c', flat(w, h) {
    for (let i = 0; i < w; i += 8) R(i, 0, 8, h, (i / 8) % 2 ? k.c : sh(k.c, -1));
    R(3, 3, w - 6, 2, k.p); R(3, h - 5, w - 6, 2, k.p); R(3, 3, 2, h - 6, k.p); R(w - 5, 3, 2, h - 6, k.p); R(w / 2 - 1, 3, 2, h - 6, k.p);
    disc(w / 2, h / 2, 13, k.p); disc(w / 2, h / 2, 11, k.c); R(w / 2 - 11, h / 2 - 1, 22, 2, k.p); disc(w / 2, h / 2, 4, k.p); disc(w / 2, h / 2, 2, k.c);
    for (const i of [12, w - 22]) { R(i, h / 2 - 12, 10, 2, k.p); R(i, h / 2 + 10, 10, 2, k.p); R(i === 12 ? i + 8 : i, h / 2 - 12, 2, 24, k.p); }
  } },
  { id: 'refstand', name: 'Referee stand', w: 1, h: 1, price: 450, draw(x, b) {
    floorShadow(x, b, 32); for (const i of [3, 25]) cyl(x + i, b - 50, 4, 50, k.w); for (let j = 8; j < 50; j += 9) R(x + 5, b - j, 22, 2, sh(k.w, -1));
    wood(x + 1, b - 54, 30, 5, k.w); wood(x + 3, b - 76, 26, 22, k.w, 'y'); cushion(x + 6, b - 72, 20, 14, k.c, 3);
    R(x + 28, b - 86, 2, 28, k.m); for (let j = 0; j < 8; j++) R(x + 18, b - 86 + j, 10, 1, j < 4 ? k.a : '#ffffff');
  } },
  { id: 'trophyshelf', name: 'Trophy cabinet', w: 2, h: 1, price: 900, solid: true, draw(x, b, vw, dir) {
    if (dir % 2) return sideBox(x, b, vw, 76);
    floorShadow(x, b, vw); wood(x, b - 76, vw, 76, k.w, 'y'); wood(x, b - 78, vw, 5, sh(k.w, 1));
    if (dir === 2) return;
    for (let row = 0; row < 3; row++) {
      const top = b - 70 + row * 22, fl = top + 18;
      R(x + 4, top, vw - 8, 18, sh(k.c, -2));
      for (let i = 0; i < 4; i++) {
        const cx = x + 11 + i * 14;
        if ((i + row) % 2) { R(cx - 3, fl - 3, 6, 3, k.a); R(cx - 1, fl - 6, 2, 3, k.a); for (let j = 0; j < 6; j++) R(cx - 4 + Math.floor(j / 2), fl - 12 + j, 8 - Math.floor(j / 2) * 2, 1, j < 1 ? sh(k.a, 2) : k.a); }
        else { R(cx - 2, fl - 14, 1, 6, k.c); R(cx + 1, fl - 14, 1, 6, k.c); disc(cx, fl - 5, 4, sh(k.a, -1)); disc(cx - 0.5, fl - 5.5, 3, k.a); P(cx - 1, fl - 7, '#ffffff'); }
      }
      wood(x + 2, fl, vw - 4, 3, sh(k.w, 1));
    }
    for (let i = 0; i < 14; i++) { P(x + 8 + i, b - 30 - i, '#ffffff'); P(x + 12 + i, b - 30 - i, '#e8f4f8'); }
  } },
  { id: 'gymflag', name: 'Gym flag', w: 1, h: 1, price: 240, draw(x, b) {
    floorShadow(x + 4, b, 24); panel(x + 9, b - 5, 14, 5, k.m); cyl(x + 4, b - 86, 3, 82, k.m); sphere(x + 5, b - 87, 2.5, k.a);
    for (let i = 0; i < 24; i++) { const wv = Math.round(Math.sin(i / 4) * 2); R(x + 7 + i, b - 82 + wv, 1, 22, i % 6 < 3 ? k.c : sh(k.c, -1)); }
    motif('star', x + 10, b - 79, ink(k.a, sh(k.a, 2), sh(k.a, -2), k.p), 2);
  } },
  { id: 'locker', name: 'Locker', w: 1, h: 1, price: 380, draw(x, b) {
    floorShadow(x, b, 32); panel(x + 1, b - 80, 30, 80, k.c, 2); R(x + 15, b - 78, 1, 76, sh(k.c, -2));
    for (const i of [3, 17]) { for (let j = 0; j < 4; j++) R(x + i + 2, b - 74 + j * 3, 8, 1, sh(k.c, -2)); R(x + i + 9, b - 48, 2, 6, k.m); R(x + i + 2, b - 30, 6, 4, k.p); }
    R(x + 1, b - 4, 30, 4, sh(k.c, -2));
  } },
  { id: 'cones', name: 'Training cones', w: 1, h: 1, price: 90, draw(x, b) {
    floorShadow(x, b, 32);
    for (const [cx, hh] of [[8, 14], [24, 14], [16, 20]]) { R(x + cx - 6, b - 2, 13, 2, sh(k.c, -1)); tri(x + cx, b - hh - 2, hh, k.c, 0.3); R(x + cx - 2, b - hh + 6, 5, 2, '#ffffff'); P(x + cx, b - hh - 2, sh(k.c, 2)); }
  } },
  { id: 'hurdle', name: 'Hurdle', w: 1, h: 1, price: 150, draw(x, b) {
    floorShadow(x, b, 32); for (const i of [2, 26]) { cyl(x + i, b - 30, 3, 30, k.m); R(x + i - 2, b - 2, 7, 2, k.m); }
    for (let i = 0; i < 28; i++) R(x + 2 + i, b - 32, 1, 5, Math.floor(i / 4) % 2 ? k.p : k.c); R(x + 2, b - 32, 28, 1, sh(k.c, 2));
  } },
  { id: 'beam', name: 'Balance beam', w: 2, h: 1, price: 520, draw(x, b, vw, dir) {
    if (dir % 2) return sideBox(x, b, vw, 30);
    floorShadow(x, b, vw); for (const i of [8, vw - 12]) { cyl(x + i, b - 24, 4, 24, k.m); R(x + i - 4, b - 3, 12, 3, k.m); }
    wood(x, b - 30, vw, 6, k.w); R(x, b - 30, vw, 1, sh(k.w, 2)); R(x, b - 25, vw, 1, sh(k.w, -2));
  } },
  { id: 'tires', name: 'Tire stack', w: 1, h: 1, price: 160, draw(x, b) {
    floorShadow(x, b, 32);
    for (let n = 0; n < 3; n++) { const y = b - 10 - n * 9; cyl(x + 3, y, 26, 9, '#2a2a34'); oval(x + 16, y, 13, 3, '#3a3a48'); oval(x + 16, y, 7, 1.5, '#101018'); for (let i = 5; i < 28; i += 3) R(x + i, y + 3, 1, 5, '#1a1a22'); }
    R(x + 3, b - 18, 26, 1, k.c);
  } },
  { id: 'pullupbar', name: 'Pull-up bar', w: 1, h: 1, price: 300, draw(x, b) {
    floorShadow(x, b, 32); for (const i of [2, 27]) { cyl(x + i, b - 84, 3, 84, k.m); R(x + i - 2, b - 3, 7, 3, k.m); }
    R(x + 2, b - 80, 28, 3, sh(k.m, 1)); for (const i of [6, 22]) R(x + i, b - 80, 4, 3, k.c);
    R(x + 4, b - 30, 24, 2, k.m);
  } },
  { id: 'plyobox', name: 'Jump box', w: 1, h: 1, price: 180, draw(x, b) {
    floorShadow(x, b, 32); wood(x + 2, b - 20, 28, 20, k.w); wood(x + 6, b - 36, 20, 16, sh(k.w, 1));
    R(x + 2, b - 20, 28, 2, sh(k.w, 2)); R(x + 6, b - 36, 20, 2, sh(k.w, 2));
    stamp(['###', '#.#', '#.#', '#.#', '###'], x + 13, b - 15, { '#': k.c }, 2); R(x + 11, b - 31, 10, 6, k.c);
  } },
  { id: 'bleachers', name: 'Bleachers', w: 2, h: 1, price: 700, draw(x, b, vw, dir) {
    if (dir % 2) { floorShadow(x, b, vw); for (let s = 0; s < 3; s++) wood(x + 2 + s * 9, b - 14 - s * 14, vw - 4 - s * 9, 14 + s * 14, k.w); return; }
    floorShadow(x, b, vw);
    for (let s = 2; s >= 0; s--) { const y = b - 14 - s * 14; R(x + 2, y, vw - 4, b - y, sh(k.m, -1)); wood(x, y - 2, vw, 5, s % 2 ? k.c : sh(k.c, 1)); R(x + 4, y + 3, vw - 8, 1, sh(k.m, -2)); }
    for (const i of [2, vw - 5]) cyl(x + i, b - 54, 3, 54, k.m); R(x + 2, b - 54, vw - 4, 2, k.m);
  } },
  { id: 'scoreboard', name: 'Scoreboard', w: 2, h: 1, layer: 'wall', price: 500, wall(x) {
    shadowWall(x + 4, 18, 56, 40); panel(x + 4, 18, 56, 40, '#2a2a34', 2); R(x + 6, 20, 52, 8, k.c); R(x + 6, 20, 52, 1, sh(k.c, 2));
    const seg = (ox, n) => { const on = ['abcdef', 'bc', 'abged', 'abgcd', 'fgbc', 'afgcd', 'afgedc', 'abc', 'abcdefg', 'abfgcd'][n]; const S = { a: [1, 0, 6, 2], b: [7, 1, 2, 7], c: [7, 9, 2, 7], d: [1, 16, 6, 2], e: [0, 9, 2, 7], f: [0, 1, 2, 7], g: [1, 8, 6, 2] }; for (const s of 'abcdefg') { const [i, j, w2, h2] = S[s]; R(ox + i, 32 + j, w2, h2, on.includes(s) ? k.a : '#3a3a48'); } };
    seg(x + 10, 2); seg(x + 21, 4); seg(x + 35, 1); seg(x + 46, 8); R(x + 31, 38, 2, 2, k.a); R(x + 31, 44, 2, 2, k.a);
  } },
  { id: 'medal', name: 'Medal', w: 1, h: 1, layer: 'wall', price: 260, wall(x) {
    for (let j = 0; j < 20; j++) { R(x + 8 + Math.floor(j / 2.4), 20 + j, 5, 1, k.c); R(x + 19 - Math.floor(j / 2.4), 20 + j, 5, 1, sh(k.c, -1)); }
    disc(x + 16, 46, 9, sh(k.a, -2)); disc(x + 16, 46, 8, k.a); disc(x + 14, 44, 4, sh(k.a, 1));
    motif('star', x + 8, 38, ink(sh(k.a, -1), k.a, sh(k.a, -2), k.a), 2); R(x + 13, 36, 6, 2, sh(k.a, -1));
  } },
  { id: 'climbwall', name: 'Climbing wall', w: 2, h: 1, layer: 'wall', price: 650, wall(x) {
    panel(x + 2, 8, 60, 70, k.p, 2); for (let j = 16; j < 76; j += 12) R(x + 3, j, 58, 1, sh(k.p, -1)); for (let i = 16; i < 62; i += 14) R(x + i, 9, 1, 68, sh(k.p, -1));
    for (let n = 0; n < 16; n++) { const c = [k.c, k.a, '#68c868', '#4a88d8'][n % 4]; ovalShade(x + 8 + Math.floor(hash(n, 2) * 48), 14 + Math.floor(hash(n, 7) * 58), 2 + (n % 2), 2, c); }
  } },
  { id: 'stopwatch', name: 'Big stopwatch', w: 1, h: 1, layer: 'wall', price: 220, wall(x) {
    R(x + 14, 18, 4, 6, k.m); R(x + 12, 16, 8, 3, k.a); R(x + 24, 23, 4, 3, k.m);
    disc(x + 16, 40, 13, sh(k.m, -1)); disc(x + 16, 40, 12, k.m); disc(x + 16, 40, 10, '#ffffff');
    for (let h = 0; h < 12; h++) P(x + 16 + Math.round(Math.cos(h * Math.PI / 6) * 8), 40 + Math.round(Math.sin(h * Math.PI / 6) * 8), h % 3 ? '#8a8a98' : '#303038');
    for (let i = 0; i < 7; i++) P(x + 16 + Math.round(i * 0.7), 40 - i, k.c); disc(x + 16, 40, 1.5, k.c); oval(x + 12, 35, 3, 2, '#f4f8fc');
  } },
  { id: 'gloves', name: 'Boxing gloves', w: 1, h: 1, layer: 'wall', price: 200, wall(x) {
    sphere(x + 16, 20, 2, k.m); for (let j = 0; j < 12; j++) { P(x + 15 - Math.floor(j * 0.5), 22 + j, '#f4f4f0'); P(x + 17 + Math.floor(j * 0.5), 22 + j, '#f4f4f0'); }
    for (const [cx, s] of [[9, -1], [23, 1]]) { ovalShade(x + cx, 44, 7, 10, k.c); ovalShade(x + cx - s * 6, 42, 3, 4, k.c); R(x + cx - 6, 52, 13, 5, '#ffffff'); R(x + cx - 6, 52, 13, 1, sh(k.c, -1)); }
  } },
  { id: 'gymsign', name: 'Gym sign', w: 2, h: 1, layer: 'wall', price: 500, wall(x) {
    shadowWall(x + 4, 20, 56, 36); panel(x + 4, 20, 56, 36, k.a, 2); inset(x + 8, 24, 48, 28, sh(k.w, -1)); R(x + 9, 25, 46, 26, k.w);
    stamp(['.###.', '#....', '#.##.', '#...#', '.###.'], x + 14, 30, { '#': k.a }, 3); stamp(['#...#', '.#.#.', '..#..', '..#..', '..#..'], x + 30, 30, { '#': k.a }, 3);
    stamp(['#...#', '##.##', '#.#.#', '#...#', '#...#'], x + 44, 30, { '#': k.a }, 2);
  } },
]);

/* ---------- beach ---------- */
const SAND = '#e8d090';
add('Beach', [
  { id: 'beachumbrella', name: 'Beach umbrella', w: 1, h: 1, price: 280, draw(x, b) {
    oval(x + 16, b - 3, 15, 3, 'rgba(30,18,10,0.22)'); oval(x + 16, b - 2, 6, 2, SAND); cyl(x + 15, b - 70, 2, 68, k.m);
    for (let j = 0; j < 16; j++) { const half = Math.round(Math.sqrt(Math.max(0, 1 - ((16 - j) / 16) ** 2)) * 16); for (let i = -half; i < half; i++) P(x + 16 + i, b - 84 + j, Math.floor((i + 32) / 6) % 2 ? k.c : k.p); }
    for (let i = -16; i < 16; i += 6) disc(x + 19 + i, b - 68, 2, Math.floor((i + 32) / 6) % 2 ? k.c : k.p);
    sphere(x + 16, b - 85, 1.5, k.a);
  } },
  { id: 'lounger', name: 'Sun lounger', w: 2, h: 1, price: 450, draw(x, b, vw, dir) {
    if (dir % 2) return sideBox(x, b, vw, 22);
    floorShadow(x, b, vw); for (const i of [4, 24, vw - 8]) cyl(x + i, b - 12, 3, 12, k.m);
    for (let i = 0; i < 40; i++) { R(x + 2 + i, b - 18, 1, 5, Math.floor(i / 4) % 2 ? k.c : k.p); }
    for (let j = 0; j < 22; j++) R(x + 42 + Math.floor(j * 0.6), b - 18 - j, 5, 1, Math.floor(j / 4) % 2 ? k.c : k.p);
    R(x + 2, b - 14, 40, 1, sh(k.m, -1)); cushion(x + 49, b - 42, 10, 6, '#ffffff', 2);
  } },
  { id: 'beachtowel', name: 'Beach towel', w: 1, h: 2, layer: 'rug', price: 140, high: 0.03, side: 'c', flat(w, h) {
    for (let j = 2; j < h - 2; j++) R(2, j, w - 4, 1, [k.c, k.c, k.p, k.a, k.p][Math.floor(j / 6) % 5]);
    for (let i = 3; i < w - 3; i += 2) { P(i, 0, k.c); P(i, 1, k.c); P(i, h - 1, k.c); P(i, h - 2, k.c); }
    motif('sun', 7, h / 2 - 9, ink(k.a, sh(k.a, 2), sh(k.a, -2), '#ffffff'), 2);
  } },
  { id: 'sandcastle', name: 'Sandcastle', w: 1, h: 1, price: 220, draw(x, b) {
    floorShadow(x, b, 32); oval(x + 16, b - 3, 15, 3, sh(SAND, -1));
    for (const [i, w2, hh] of [[2, 8, 18], [22, 8, 18], [9, 14, 28]]) { panel(x + i, b - hh, w2, hh, SAND); for (let c = 0; c < w2; c += 3) R(x + i + c, b - hh - 2, 2, 2, SAND); }
    R(x + 2, b - 12, 28, 12, SAND); R(x + 13, b - 9, 6, 9, sh(SAND, -2)); disc(x + 16, b - 9, 3, sh(SAND, -2));
    speckle(x + 2, b - 28, 28, 28, sh(SAND, -1), 4, 0.08); R(x + 15, b - 38, 1, 8, k.w); R(x + 16, b - 38, 6, 4, k.c);
    sphere(x + 6, b - 5, 1.5, '#f8b8c8');
  } },
  { id: 'surfboard', name: 'Surfboard', w: 1, h: 1, price: 380, draw(x, b) {
    floorShadow(x + 6, b, 20); panel(x + 8, b - 6, 16, 6, k.w);
    oval(x + 16, b - 44, 9, 40, sh(k.c, -1)); oval(x + 15, b - 45, 8, 38, k.c); R(x + 15, b - 82, 2, 76, k.a); oval(x + 12, b - 60, 2, 14, sh(k.c, 2));
    for (let i = 0; i < 5; i++) R(x + 9 + i * 3, b - 28, 2, 1, k.p);
  } },
  { id: 'beachball', name: 'Beach ball', w: 1, h: 1, price: 100, draw(x, b) {
    floorShadow(x + 4, b, 24); disc(x + 16, b - 12, 11, '#f4f4f0');
    const cols = [k.c, '#f8d030', '#4a88d8', '#ffffff', '#58c868', k.c];
    for (let j = -10; j <= 10; j++) for (let i = -10; i <= 10; i++) { if (i * i + j * j > 110) continue; const seg = Math.floor((Math.atan2(j, i * 1.8) + Math.PI) / (Math.PI / 3)) % 6; P(x + 16 + i, b - 12 + j, cols[seg]); }
    disc(x + 16, b - 12, 2, '#ffffff'); disc(x + 12, b - 17, 3, 'rgba(255,255,255,0.45)');
  } },
  { id: 'swimring', name: 'Swim ring', w: 1, h: 1, price: 140, draw(x, b) {
    floorShadow(x + 2, b, 28);
    for (let j = -12; j <= 12; j++) for (let i = -14; i <= 14; i++) { const d = Math.hypot(i / 14, j / 12); if (d > 1 || d < 0.45) continue; const ang = Math.atan2(j, i); P(x + 16 + i, b - 14 + j, Math.floor((ang + Math.PI) / (Math.PI / 4)) % 2 ? k.c : k.p); }
    for (let i = -10; i <= 0; i++) P(x + 16 + i, b - 22 + Math.floor((i * i) / 30), '#ffffff');
  } },
  { id: 'palmtree', name: 'Palm tree', w: 1, h: 1, price: 650, draw(x, b) {
    oval(x + 16, b - 2, 10, 2, 'rgba(30,18,10,0.25)');
    for (let j = 0; j < 70; j++) { const off = Math.round((j / 70) ** 2 * 8); R(x + 13 + off, b - j, 6 - Math.floor(j / 30), 1, j % 5 < 2 ? sh(k.w, -1) : k.w); }
    const frond = (cx, cy, dir, len) => { for (let i = 0; i < len; i++) { const fx = cx + dir * i, fy = cy + Math.round(i * i / (len * 1.3)); R(fx, fy - 2, 2, 3, k.leaf); R(fx, fy + 1, 2, 2, sh(k.leaf, -1)); if (i % 2) P(fx, fy - 3, sh(k.leaf, 1)); } };
    const tx = x + 21, ty = b - 72;
    frond(tx, ty, -1, 18); frond(tx, ty, 1, 11); frond(tx - 1, ty - 3, -1, 13); frond(tx + 1, ty - 3, 1, 10); frond(tx, ty + 2, -1, 10);
    for (const [i, j] of [[19, -68], [23, -67], [21, -64]]) sphere(x + i, b + j, 2.5, '#6a4426');
  } },
  { id: 'tikitorch', name: 'Tiki torch', w: 1, h: 1, price: 200, glow: ['#f8a030', '#f8e070', '#f86030'], draw(x, b) {
    floorShadow(x + 8, b, 16); cyl(x + 14, b - 56, 4, 56, k.w); for (let j = 8; j < 56; j += 8) R(x + 14, b - j, 4, 1, sh(k.w, -2));
    for (let j = 0; j < 10; j++) R(x + 11 + Math.floor(j / 4), b - 66 + j, 10 - Math.floor(j / 4) * 2, 1, j % 3 ? k.a : sh(k.a, -1));
    tri(x + 16, b - 82, 15, '#f86030', 0.38); tri(x + 16, b - 78, 11, '#f8a030', 0.3); tri(x + 16, b - 73, 6, '#f8e070', 0.3);
  } },
  { id: 'lifeguard', name: 'Lifeguard chair', w: 1, h: 1, price: 600, draw(x, b) {
    floorShadow(x, b, 32); for (const i of [1, 27]) for (let j = 0; j < 58; j++) R(x + i + (i < 10 ? Math.floor(j / 14) : -Math.floor(j / 14)), b - j, 3, 1, k.p);
    for (let j = 10; j < 54; j += 10) R(x + 3, b - j, 26, 2, sh(k.p, -1));
    wood(x + 3, b - 62, 26, 5, k.p); wood(x + 4, b - 84, 24, 22, k.c, 'y'); R(x + 13, b - 80, 6, 14, '#ffffff'); R(x + 9, b - 75, 14, 5, '#ffffff');
  } },
  { id: 'cooler', name: 'Cool box', w: 1, h: 1, price: 200, draw(x, b) {
    floorShadow(x, b, 32); panel(x + 2, b - 20, 28, 20, k.c, 2); R(x + 4, b - 6, 24, 2, sh(k.c, -1));
    panel(x + 1, b - 26, 30, 7, k.p); R(x + 2, b - 25, 28, 1, '#ffffff'); R(x + 10, b - 30, 12, 2, k.m); R(x + 10, b - 30, 2, 5, k.m); R(x + 20, b - 30, 2, 5, k.m);
    R(x + 6, b - 16, 8, 6, '#ffffff'); P(x + 8, b - 14, k.c);
  } },
  { id: 'seashells', name: 'Seashells', w: 1, h: 1, price: 90, draw(x, b) {
    oval(x + 16, b - 3, 14, 4, sh(SAND, -1)); oval(x + 16, b - 4, 12, 3, SAND);
    for (let j = 0; j < 7; j++) { const h = 6 - Math.abs(j - 3); R(x + 10 - h, b - 12 + j, h * 2, 1, j < 3 ? '#f8c8b8' : '#f0a898'); } for (let i = -4; i <= 4; i += 2) R(x + 10 + i, b - 11, 1, 5, '#d88878');
    for (let r = 5; r > 0; r--) disc(x + 21 + (5 - r) * 0.4, b - 9 - (5 - r) * 0.6, r, r % 2 ? k.c : sh(k.c, 1));
    stamp(MOTIFS.star, x + 13, b - 9, { '#': '#f08850', '+': '#f8b080' }, 1);
  } },
  { id: 'bottlemsg', name: 'Message in a bottle', w: 1, h: 1, price: 160, draw(x, b) {
    oval(x + 16, b - 3, 14, 3, sh(SAND, -1));
    for (let i = 0; i < 20; i++) { const h = i < 13 ? 5 : 2; R(x + 4 + i, b - 6 - h, 1, h * 2, i < 13 ? '#5aa878' : '#4a9868'); }
    R(x + 24, b - 9, 4, 4, '#a87a48'); R(x + 6, b - 12, 10, 2, '#a8e0c0');
    panel(x + 8, b - 9, 8, 5, '#f4e8c8'); R(x + 11, b - 9, 2, 5, k.c);
  } },
  { id: 'sandbucket', name: 'Sand bucket', w: 1, h: 1, price: 110, draw(x, b) {
    floorShadow(x + 2, b, 28); for (let j = 0; j < 16; j++) R(x + 6 + Math.floor(j / 6), b - 18 + j, 18 - Math.floor(j / 6) * 2, 1, j < 1 ? sh(k.c, 1) : k.c);
    oval(x + 15, b - 18, 9, 2, SAND); for (let i = 0; i <= 12; i++) P(Math.round(x + 15 + Math.cos(Math.PI + i / 12 * Math.PI) * 9), Math.round(b - 20 + Math.sin(Math.PI + i / 12 * Math.PI) * 8), k.m);
    R(x + 25, b - 30, 2, 24, k.a); for (let j = 0; j < 7; j++) R(x + 23, b - 7 + j / 2 | 0, 6, 1, k.a);
  } },
  { id: 'beachhut', name: 'Beach hut', w: 2, h: 2, price: 1300, draw(x, b, vw) {
    floorShadow(x, b, vw); for (let i = 0; i < vw - 8; i += 6) wood(x + 4 + i, b - 68, 6, 64, Math.floor(i / 6) % 2 ? k.c : k.p, 'y');
    R(x + 2, b - 4, vw - 4, 4, sh(k.w, -1)); inset(x + vw / 2 - 9, b - 44, 18, 40, sh(k.w, -1)); wood(x + vw / 2 - 8, b - 43, 16, 39, k.w, 'y'); sphere(x + vw / 2 + 5, b - 24, 1.5, k.a);
    for (let j = 0; j < 20; j++) R(x + vw / 2 - 2 - j * 1.7, b - 88 + j, 4 + j * 3.4, 1, j < 2 ? sh(k.w, 1) : k.w);
    R(x, b - 69, vw, 2, sh(k.w, -2)); inset(x + 8, b - 56, 10, 10, k.m); glass(x + 9, b - 55, 8, 8); inset(x + vw - 18, b - 56, 10, 10, k.m); glass(x + vw - 17, b - 55, 8, 8);
  } },
  { id: 'driftwood', name: 'Driftwood', w: 1, h: 1, price: 120, draw(x, b) {
    oval(x + 16, b - 3, 14, 3, 'rgba(30,18,10,0.2)');
    for (let i = 0; i < 28; i++) { const y = b - 8 - Math.round(Math.sin(i / 5) * 2), h = 5 - Math.floor(Math.abs(i - 12) / 7); R(x + 2 + i, y - h, 1, h * 2, i % 4 ? '#b8a890' : '#9a8a74'); P(x + 2 + i, y - h, '#d8ccb8'); }
    for (let j = 0; j < 9; j++) R(x + 20 + Math.floor(j / 3), b - 12 - j, 2, 1, '#b8a890'); speckle(x + 2, b - 14, 28, 10, '#8a7a64', 3, 0.05);
  } },
  { id: 'coral', name: 'Coral', w: 1, h: 1, price: 300, draw(x, b) {
    floorShadow(x + 2, b, 28); ovalShade(x + 16, b - 5, 12, 5, STONE);
    const branch = (sx, sy, ang, len, d) => { for (let i = 0; i < len; i++) { const px = sx + Math.round(Math.sin(ang) * i), py = sy - Math.round(Math.cos(ang) * i); R(px, py, 3 - Math.min(1, d), 2, i % 4 ? k.c : sh(k.c, 1)); } if (d < 2) { const ex = sx + Math.round(Math.sin(ang) * len), ey = sy - Math.round(Math.cos(ang) * len); branch(ex, ey, ang - 0.5, len * 0.6 | 0, d + 1); branch(ex, ey, ang + 0.5, len * 0.6 | 0, d + 1); } else disc(sx + Math.round(Math.sin(ang) * len), sy - Math.round(Math.cos(ang) * len), 1.5, sh(k.c, 2)); };
    branch(x + 15, b - 8, -0.15, 14, 0); branch(x + 9, b - 8, -0.6, 9, 1); branch(x + 22, b - 8, 0.6, 9, 1);
  } },
  { id: 'laprasfloat', name: 'Lapras float', proper: true, solo: true, w: 1, h: 1, price: 420, draw(x, b) {
    floorShadow(x, b, 32); ovalShade(x + 15, b - 10, 14, 9, '#68a8e8'); for (const [i, j] of [[10, -14], [16, -16], [21, -13]]) { disc(x + i, b + j, 3, '#a8a8b8'); P(x + i, b + j - 2, '#e8e8f0'); }
    R(x + 23, b - 30, 5, 20, '#68a8e8'); R(x + 24, b - 30, 2, 20, '#88c0f0'); ovalShade(x + 27, b - 32, 5, 4, '#68a8e8'); P(x + 28, b - 34, '#202028'); tri(x + 26, b - 39, 4, '#68a8e8', 0.4);
    oval(x + 15, b - 5, 11, 2, '#f0e8d0');
  } },
  { id: 'deckchair', name: 'Deckchair', w: 1, h: 1, price: 220, draw(x, b) {
    floorShadow(x, b, 32);
    for (const i of [6, 23]) cyl(x + i, b - 18, 3, 18, sh(k.w, -1));
    for (let j = 0; j < 48; j++) { const lean = Math.floor(j / 16); R(x + 3 + lean, b - 4 - j, 3, 1, k.w); R(x + 26 - lean, b - 4 - j, 3, 1, k.w); }
    for (let i = 0; i < 18; i++) { const sag = Math.round(Math.sin(i / 17 * Math.PI) * 3); R(x + 7 + i, b - 48, 1, 30 + sag, Math.floor(i / 3) % 2 ? k.c : k.p); P(x + 7 + i, b - 18 + sag, sh(k.c, -2)); }
    wood(x + 3, b - 52, 26, 4, k.w); wood(x + 4, b - 20, 24, 3, sh(k.w, -1));
  } },
  { id: 'starfish', name: 'Starfish', w: 1, h: 1, layer: 'wall', price: 120, wall(x) {
    stamp(MOTIFS.star, x + 4, 26, { '#': '#f08850', '+': '#f8b080' }, 2); stamp(MOTIFS.star, x + 15, 46, { '#': k.c, '+': sh(k.c, 1) }, 1);
    for (const [i, j] of [[13, 33], [9, 40], [17, 41]]) P(x + i, j, '#ffffff');
  } },
  { id: 'fishnet', name: 'Fishing net', w: 2, h: 1, layer: 'wall', price: 260, wall(x) {
    for (let i = 0; i < 9; i++) for (let j = 0; j < 44; j++) P(x + 6 + i * 7 + Math.round(Math.sin(j / 4 + i) * 2), 18 + j + Math.round(Math.sin(i / 2) * 4), k.w);
    for (let j = 0; j < 6; j++) for (let i = 0; i < 56; i++) P(x + 4 + i, 22 + j * 8 + Math.round(Math.sin(i / 9) * 3 + (i - 28) ** 2 / 200), k.w);
    for (const [i, j] of [[8, 20], [32, 18], [56, 20]]) sphere(x + i, j, 3, k.c);
    stamp(MOTIFS.star, x + 22, 40, { '#': '#f08850', '+': '#f8b080' }, 1); for (let r = 3; r > 0; r--) disc(x + 44, 48, r, r % 2 ? '#f8c8b8' : '#f0a898');
  } },
  { id: 'lifering', name: 'Life ring', w: 1, h: 1, layer: 'wall', price: 180, wall(x) {
    for (let j = -12; j <= 12; j++) for (let i = -12; i <= 12; i++) { const d = Math.hypot(i, j); if (d > 12 || d < 6) continue; const ang = Math.atan2(j, i); P(x + 16 + i, 40 + j, Math.floor((ang + Math.PI + 0.39) / (Math.PI / 2)) % 2 ? k.c : '#ffffff'); }
    for (let a = 0; a < 40; a++) P(Math.round(x + 16 + Math.cos(a / 40 * Math.PI * 2) * 13), Math.round(40 + Math.sin(a / 40 * Math.PI * 2) * 13), a % 2 ? '#e8d8b0' : '#c8b088');
    sphere(x + 16, 25, 1.5, k.m);
  } },
  { id: 'anchor', name: 'Anchor', w: 1, h: 1, layer: 'wall', price: 240, wall(x) {
    disc(x + 16, 22, 4, k.m); clear(x + 15, 21, 2, 2); R(x + 15, 26, 3, 30, k.m); R(x + 9, 30, 15, 3, k.m);
    for (let a = 0; a <= 16; a++) { const ang = a / 16 * Math.PI; R(Math.round(x + 16 - Math.cos(ang) * 11), Math.round(52 + Math.sin(ang) * 8), 3, 3, k.m); }
    tri(x + 5, 46, 5, k.m, 0.6); tri(x + 27, 46, 5, k.m, 0.6);
    for (let j = 0; j < 30; j++) P(x + 18 + Math.round(Math.sin(j / 3) * 3), 24 + j, '#d8c8a0');
  } },
  { id: 'shipwheel', name: 'Ship’s wheel', w: 1, h: 1, layer: 'wall', price: 300, wall(x) {
    for (let a = 0; a < 8; a++) { const ang = a / 8 * Math.PI * 2; for (let r = 0; r < 15; r++) R(Math.round(x + 16 + Math.cos(ang) * r), Math.round(40 + Math.sin(ang) * r), 2, 2, r > 11 ? sh(k.w, 1) : k.w); }
    for (let a = 0; a < 60; a++) R(Math.round(x + 16 + Math.cos(a / 60 * Math.PI * 2) * 10), Math.round(40 + Math.sin(a / 60 * Math.PI * 2) * 10), 2, 2, sh(k.w, -1));
    disc(x + 16, 40, 4, k.a); P(x + 15, 39, sh(k.a, 2));
  } },
  { id: 'kiddiepool', name: 'Paddling pool', w: 2, h: 2, price: 520, high: 0.25, side: 'c', flat(w, h) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const d = Math.hypot(i + 0.5 - w / 2, j + 0.5 - h / 2); if (d > 31) continue; if (d > 24) { const ang = Math.atan2(j - h / 2, i - w / 2); P(i, j, Math.floor((ang + Math.PI) / (Math.PI / 6)) % 2 ? k.c : k.p); } }
    disc(w / 2, h / 2, 24, '#4a98d8'); disc(w / 2 - 3, h / 2 - 3, 18, '#68b8f0'); for (const [i, j] of [[20, 26], [38, 40], [30, 18]]) R(i, j, 5, 1, '#c8e8f8');
    ovalShade(40, 26, 4, 3, '#f8d030'); disc(43, 23, 2, '#f8d030'); P(44, 22, '#202028'); P(45, 24, '#f08030');
  } },
  { id: 'tidepool', name: 'Tide pool', w: 2, h: 2, price: 480, high: 0.08, side: 'm', flat(w, h) {
    for (let a = 0; a < 18; a++) { const ang = a / 18 * Math.PI * 2; ovalShade(w / 2 + Math.cos(ang) * 25, h / 2 + Math.sin(ang) * 24, 7, 6, hash(a, 2) < 0.5 ? '#7a7a88' : '#8a8a98'); }
    oval(w / 2, h / 2, 22, 21, '#3a7a98'); oval(w / 2 - 3, h / 2 - 3, 16, 15, '#5aa0b8');
    stamp(MOTIFS.star, 18, 34, { '#': '#f08850', '+': '#f8b080' }, 1);
    for (let n = 0; n < 8; n++) { const ang = n / 8 * Math.PI * 2; R(40 + Math.round(Math.cos(ang) * 3), 24 + Math.round(Math.sin(ang) * 3), 2, 2, k.c); } disc(41, 25, 2, sh(k.c, 1));
    for (let i = 0; i < 6; i++) leaf(26 + i * 2, 20 + (i % 2) * 2, 1, 3, k.leaf);
  } },
  { id: 'sandpatch', name: 'Sand patch', w: 2, h: 2, layer: 'rug', price: 180, high: 0.03, side: 'p', flat(w, h) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const d = Math.hypot(i + 0.5 - w / 2, (j + 0.5 - h / 2) * 1.1) + Math.sin(i / 3 + j) * 1.2; if (d < 30) P(i, j, (j + Math.round(Math.sin(i / 5) * 2)) % 7 === 0 ? sh(SAND, -1) : SAND); }
    speckle(6, 6, w - 12, h - 12, sh(SAND, 1), 9, 0.04); for (let r = 3; r > 0; r--) disc(44, 20, r, r % 2 ? k.c : sh(k.c, 1)); stamp(MOTIFS.star, 16, 38, { '#': '#f08850' }, 1);
  } },
]);

/* ---------- spooky ---------- */
add('Spooky', [
  { id: 'jackolantern', name: 'Jack-o’-lantern', w: 1, h: 1, price: 240, glow: ['#f8d050', '#fff0a0'], draw(x, b) {
    floorShadow(x + 2, b, 28); ovalShade(x + 16, b - 12, 13, 11, '#f08030');
    for (const i of [-6, 0, 6]) for (let j = -9; j <= 9; j++) P(x + 16 + i + Math.round(Math.sin(j / 10) * (i / 3)), b - 12 + j, '#d86a20');
    for (const s of [-1, 1]) for (let j = 0; j < 4; j++) R(x + 16 + s * 6 - (s < 0 ? 3 - j : 0) - 1, b - 18 + j, 4 - j, 1, '#f8d050');
    for (let i = -7; i <= 7; i++) R(x + 16 + i, b - 9 + Math.round(i * i / 18), 1, 3, i % 3 === 0 ? '#d86a20' : '#f8d050');
    R(x + 15, b - 27, 3, 5, '#5a7a2a'); leaf(x + 21, b - 25, 3, 2, k.leaf);
  } },
  ...[['round', 'Round gravestone'], ['square', 'Square gravestone'], ['obelisk', 'Obelisk grave']].map(([id, name]) => ({ id: `${id}grave`, name, w: 1, h: 1, price: 260, draw(x, b) {
    floorShadow(x, b, 32); oval(x + 16, b - 2, 14, 3, '#5a4a3a'); for (let i = 0; i < 6; i++) R(x + 4 + i * 4, b - 3 - (i % 2), 1, 2, k.leaf);
    const st = k.m, lit = sh(st, 1);
    if (id === 'round') { panel(x + 6, b - 34, 20, 30, st, 2); disc(x + 16, b - 34, 10, st); disc(x + 14, b - 36, 6, lit); R(x + 6, b - 34, 20, 4, st); }
    else if (id === 'square') { panel(x + 5, b - 36, 22, 32, st, 2); panel(x + 3, b - 40, 26, 5, lit); }
    else { panel(x + 6, b - 12, 20, 8, st); for (let j = 0; j < 40; j++) R(x + 11 + Math.floor(j / 14), b - 52 + j, 10 - Math.floor(j / 14) * 2, 1, st); tri(x + 16, b - 58, 6, st, 0.9); R(x + 11, b - 52, 2, 40, lit); }
    const t = id === 'obelisk' ? b - 40 : b - 30;
    R(x + 11, t, 10, 1, sh(st, -2)); R(x + 12, t + 4, 8, 1, sh(st, -2)); R(x + 12, t + 8, 8, 1, sh(st, -2));
    speckle(x + 5, b - 40, 22, 36, k.leaf, id.length, 0.04); speckle(x + 5, b - 40, 22, 36, sh(st, -1), 3, 0.06);
  } })),
  { id: 'candelabra', name: 'Candelabra', w: 1, h: 1, price: 380, glow: ['g', 'gl'], draw(x, b) {
    floorShadow(x + 4, b, 24); ovalShade(x + 16, b - 4, 8, 3, k.a); cyl(x + 15, b - 40, 3, 36, k.a); ovalShade(x + 16, b - 22, 4, 2, k.a);
    for (let i = 0; i < 9; i++) { R(x + 16 - i, b - 40 + Math.round(i * i / 14) - 6, 1, 2, k.a); R(x + 16 + i, b - 40 + Math.round(i * i / 14) - 6, 1, 2, k.a); }
    for (const i of [6, 16, 26]) { const top = i === 16 ? b - 56 : b - 50; R(x + i - 2, top + 8, 5, 2, k.a); cyl(x + i - 1, top, 3, 8, k.p); R(x + i, top - 2, 1, 2, '#303038'); for (let j = 0; j < 6; j++) R(x + i - (j > 1 && j < 5 ? 1 : 0), top - 8 + j, j > 1 && j < 5 ? 3 : 1, 1, j < 3 ? k.gl : k.g); }
    for (let j = 0; j < 4; j++) P(x + 15, b - 34 + j * 3, sh(k.a, 2));
  } },
  { id: 'cobweb', name: 'Cobweb', w: 1, h: 1, layer: 'wall', price: 80, wall(x) {
    const web = '#e8e8f0';
    for (let a = 0; a < 6; a++) { const ang = a / 5 * Math.PI / 2; for (let r = 0; r < 30; r++) P(Math.round(x + 1 + Math.cos(ang) * r), Math.round(12 + Math.sin(ang) * r), web); }
    for (let rr = 6; rr < 30; rr += 6) for (let a = 0; a < 5; a++) { const a0 = a / 5 * Math.PI / 2, a1 = (a + 1) / 5 * Math.PI / 2; for (let s = 0; s <= 6; s++) { const t2 = s / 6, ang = a0 + (a1 - a0) * t2, sag = Math.sin(t2 * Math.PI) * 2; P(Math.round(x + 1 + Math.cos(ang) * (rr - sag)), Math.round(12 + Math.sin(ang) * (rr - sag)), web); } }
    R(x + 18, 30, 1, 10, web); ovalShade(x + 18, 43, 3, 3, '#303038'); for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { P(x + 18 + s * 3, 41 + i * 2, '#303038'); P(x + 18 + s * 4, 40 + i * 2, '#303038'); }
    P(x + 17, 43, '#e04848'); P(x + 19, 43, '#e04848');
  } },
  { id: 'hauntportrait', name: 'Haunted portrait', w: 1, h: 1, layer: 'wall', price: 340, wall(x) {
    shadowWall(x + 3, 16, 26, 46); oval(x + 16, 39, 13, 23, sh(k.a, -1)); oval(x + 16, 39, 12, 22, k.a); oval(x + 16, 39, 9, 18, '#2a2438');
    clipped(x + 7, 21, 18, 36, () => { oval(x + 16, 52, 10, 12, '#3a3048'); disc(x + 16, 36, 6, '#4a3e5a'); R(x + 13, 35, 2, 2, '#f84848'); R(x + 18, 35, 2, 2, '#f84848'); });
    for (let i = 0; i < 6; i++) P(x + 6 + i * 4, 18 + (i % 2) * 2, sh(k.a, 2));
  } },
  { id: 'coffin', name: 'Coffin', w: 1, h: 1, price: 480, draw(x, b) {
    floorShadow(x, b, 32);
    for (let j = 0; j < 72; j++) { const half = j < 18 ? 8 + Math.floor(j / 3) : 14 - Math.floor((j - 18) / 9); R(x + 16 - half, b - 74 + j, half * 2, 1, j < 2 ? sh(k.w, 1) : k.w); P(x + 16 - half, b - 74 + j, sh(k.w, 1)); P(x + 15 + half, b - 74 + j, sh(k.w, -1)); }
    for (let j = 0; j < 64; j++) { const half = j < 14 ? 5 + Math.floor(j / 3) : 10 - Math.floor((j - 14) / 9); P(x + 16 - half, b - 70 + j, sh(k.w, -1)); P(x + 15 + half, b - 70 + j, sh(k.w, -1)); }
    motif('moon', x + 9, b - 54, ink(k.a, sh(k.a, 2), sh(k.a, -2), k.a), 2); for (const j of [-62, -10]) sphere(x + 16, b + j, 1.5, k.a);
  } },
  { id: 'blackcat', name: 'Black cat statue', w: 1, h: 1, price: 360, draw(x, b) {
    floorShadow(x, b, 32); panel(x + 4, b - 10, 24, 10, k.p); R(x + 6, b - 8, 20, 1, sh(k.p, -1));
    stamp(['#.....#..', '##...##..', '#######..', '#y###y#..', '#######..', '.#####...', '.######..', '#######..', '########.', '########.', '#######.#', '.######.#', '.#.##.##.'], x + 6, b - 36, { '#': '#2a2430', y: '#f8d030' }, 2);
    P(x + 9, b - 30, '#202020'); P(x + 19, b - 30, '#202020'); R(x + 10, b - 22, 8, 2, k.c);
  } },
  { id: 'broom', name: 'Witch’s broom', w: 1, h: 1, price: 180, draw(x, b) {
    floorShadow(x + 2, b, 28); for (let j = 0; j < 64; j++) R(x + 22 - Math.floor(j / 6), b - 22 - j, 2, 1, j % 9 ? k.w : sh(k.w, -1));
    for (let i = 0; i < 18; i++) { const sx = x + 6 + i; for (let j = 0; j < 20; j++) P(sx + Math.round((j / 20) * (i - 9) * 0.4), b - 22 + j, (i + j) % 4 ? '#d8b860' : '#b89840'); }
    R(x + 10, b - 24, 12, 3, k.c); R(x + 10, b - 24, 12, 1, sh(k.c, 1));
  } },
  { id: 'hatstand', name: 'Witch hat stand', w: 1, h: 1, price: 260, draw(x, b) {
    floorShadow(x + 4, b, 24); ovalShade(x + 16, b - 4, 9, 3, k.w); cyl(x + 15, b - 40, 3, 36, k.w);
    oval(x + 16, b - 42, 14, 3, sh(k.c, -1)); oval(x + 16, b - 43, 13, 2, k.c);
    for (let j = 0; j < 30; j++) { const half = Math.max(1, 8 - Math.floor(j / 4)), lean = Math.round((j / 30) ** 2 * 7); R(x + 16 - half + lean, b - 45 - j, half * 2, 1, j > 26 ? sh(k.c, 1) : k.c); }
    R(x + 8, b - 48, 16, 3, k.a); R(x + 14, b - 48, 4, 3, sh(k.a, 2));
  } },
  { id: 'lectern', name: 'Spellbook stand', w: 1, h: 1, price: 420, glow: ['#a8f0c8'], draw(x, b) {
    floorShadow(x + 2, b, 28); panel(x + 8, b - 5, 16, 5, k.w); cyl(x + 13, b - 32, 6, 27, k.w); for (let j = 0; j < 8; j++) R(x + 3 + j / 2 | 0, b - 40 + j, 26 - j, 1, k.w);
    for (let j = 0; j < 6; j++) { R(x + 4, b - 46 + j, 12, 1, '#f0e4c4'); R(x + 16, b - 46 + j, 12, 1, '#e8dcb8'); } R(x + 15, b - 47, 2, 7, k.c);
    for (let j = 0; j < 4; j++) { R(x + 6, b - 45 + j, 7, 1, j % 2 ? '#8a7a5a' : '#f0e4c4'); } motif('star', x + 18, b - 49, ink('#68e8a0', '#d8ffe8', '#68e8a0', '#ffffff'), 1);
    for (const [i, j] of [[22, -54], [12, -56], [26, -60]]) P(x + i, b + j, '#a8f0c8');
  } },
  { id: 'spookylamp', name: 'Crooked lamp post', w: 1, h: 1, price: 380, glow: ['#88f0a8', '#d8ffe0'], draw(x, b) {
    floorShadow(x + 4, b, 24); panel(x + 9, b - 6, 14, 6, k.m);
    for (let j = 0; j < 70; j++) R(x + 14 + Math.round(Math.sin(j / 18) * 4 + (j > 50 ? (j - 50) * 0.4 : 0)), b - 6 - j, 3, 1, k.m);
    const lx = x + 26, ly = b - 76; R(lx - 4, ly - 2, 9, 2, k.m); panel(lx - 4, ly, 9, 12, k.m); R(lx - 2, ly + 2, 5, 8, '#88f0a8'); R(lx - 1, ly + 3, 2, 5, '#d8ffe0'); tri(lx, ly - 6, 4, k.m, 1);
    for (const [i, j] of [[8, -60], [10, -40]]) leaf(x + i, b + j, 2, 1, k.leaf);
  } },
  { id: 'ironfence', name: 'Iron fence', w: 1, h: 1, price: 140, draw(x, b, vw, dir) {
    floorShadow(x, b, vw);
    if (dir % 2) { R(x + 15, b - 40, 3, 40, k.m); tri(x + 16, b - 46, 6, k.m, 0.5); return; }
    for (let i = 1; i < 32; i += 6) { R(x + i, b - 40, 2, 40, k.m); tri(x + i + 1, b - 46, 6, k.m, 0.4); P(x + i, b - 40, sh(k.m, 2)); }
    for (const j of [34, 10]) R(x, b - j, 32, 2, k.m);
    for (let i = 4; i < 32; i += 6) { disc(x + i, b - 22, 2, k.m); clear(x + i, b - 22, 1, 1); }
  } },
  { id: 'deadtree', name: 'Dead tree', w: 1, h: 1, price: 320, draw(x, b) {
    floorShadow(x, b, 32); const bark = sh(k.w, -1);
    for (let j = 0; j < 56; j++) R(x + 13 + Math.round(Math.sin(j / 9) * 2), b - j, 6 - Math.floor(j / 20), 1, j % 6 < 2 ? sh(bark, -1) : bark);
    R(x + 9, b - 3, 14, 3, bark); R(x + 6, b - 2, 4, 2, bark); R(x + 22, b - 2, 4, 2, bark);
    const twig = (sx, sy, ang, len, d) => { for (let i = 0; i < len; i++) R(sx + Math.round(Math.sin(ang) * i), sy - Math.round(Math.cos(ang) * i), d ? 1 : 2, 1, bark); if (d < 2) { const ex = sx + Math.round(Math.sin(ang) * len), ey = sy - Math.round(Math.cos(ang) * len); twig(ex, ey, ang - 0.6, len * 0.55 | 0, d + 1); twig(ex, ey, ang + 0.5, len * 0.6 | 0, d + 1); } };
    twig(x + 15, b - 50, -0.7, 14, 0); twig(x + 17, b - 54, 0.6, 15, 0); twig(x + 16, b - 56, 0.05, 12, 1);
    disc(x + 16, b - 28, 2.5, '#1a1420');
  } },
  { id: 'witchshelf', name: 'Witch’s shelf', w: 1, h: 1, price: 520, solid: true, glow: ['#a8f878', '#f878e8'], draw(x, b, vw, dir) {
    floorShadow(x, b, vw); wood(x + 1, b - 70, 30, 70, sh(k.w, -1), 'y'); wood(x, b - 72, 32, 4, k.w);
    if (dir % 2 || dir === 2) return;
    for (let row = 0; row < 3; row++) {
      const top = b - 66 + row * 21, fl = top + 17; R(x + 3, top, 26, 17, '#1e1a26');
      for (let i = 0; i < 3; i++) { const c = ['#a8f878', '#f878e8', '#78c8f8', '#f8b048'][(i + row) % 4], px = x + 5 + i * 8; ovalShade(px + 3, fl - 5, 3, 5, c); R(px + 2, fl - 12, 2, 3, '#d8e8e8'); R(px + 2, fl - 13, 2, 1, '#8a6a40'); P(px + 2, fl - 7, '#ffffff'); }
      wood(x + 2, fl, 28, 3, k.w);
    }
    for (let j = 0; j < 8; j++) P(x + 4 + (j % 2), b - 66 + j * 2, '#e8e8f0');
  } },
  { id: 'hauntmirror', name: 'Haunted mirror', w: 1, h: 1, layer: 'wall', price: 380, wall(x) {
    oval(x + 16, 40, 12, 22, sh(k.a, -1)); oval(x + 16, 40, 11, 21, k.a); oval(x + 16, 40, 8, 18, '#a8b8c8'); oval(x + 15, 36, 6, 10, '#c0ccd8');
    oval(x + 16, 42, 5, 8, 'rgba(240,240,255,0.7)'); R(x + 13, 40, 2, 3, '#303048'); R(x + 18, 40, 2, 3, '#303048'); oval(x + 16, 46, 2, 1, '#303048');
    for (let j = 0; j < 5; j++) P(x + 12 + j * 2, 50 + (j % 2), 'rgba(240,240,255,0.7)'); tri(x + 16, 14, 6, k.a, 0.8);
  } },
  { id: 'litwick', name: 'Litwick candles', proper: true, w: 1, h: 1, price: 320, glow: ['#a868f8', '#e0c8ff'], draw(x, b) {
    floorShadow(x + 2, b, 28);
    for (const [cx, hh] of [[8, 16], [24, 12], [16, 22]]) {
      cyl(x + cx - 4, b - hh, 8, hh, '#f4f4f8'); oval(x + cx, b - hh, 4, 1.5, '#ffffff'); for (const s of [-3, 2]) R(x + cx + s, b - hh, 1, 4 + (s > 0 ? 2 : 0), '#ffffff');
      R(x + cx - 2, b - hh + 5, 1, 2, '#f8d030'); R(x + cx + 1, b - hh + 5, 1, 2, '#f8d030');
      for (let j = 0; j < 9; j++) { const h = Math.floor(Math.sin(j / 9 * Math.PI) * 3); R(x + cx - h, b - hh - 10 + j, h * 2 + 1, 1, j < 4 ? '#e0c8ff' : '#a868f8'); }
    }
  } },
  { id: 'chandelier', name: 'Ghost chandelier', w: 2, h: 1, layer: 'wall', price: 800, glow: ['#a868f8', '#e0c8ff'], wall(x) {
    R(x + 31, 2, 2, 22, k.m); ovalShade(x + 32, 28, 9, 6, k.m); sphere(x + 32, 36, 3, k.m);
    for (const s of [-1, 1]) for (let i = 0; i < 22; i++) R(x + 32 + s * i, 30 - Math.round(Math.sin(i / 21 * Math.PI) * 10) + (i > 16 ? (i - 16) : 0), 2, 2, k.m);
    for (const cx of [10, 21, 43, 54]) { const cy = cx === 21 || cx === 43 ? 26 : 32; R(x + cx - 2, cy, 5, 2, k.m); for (let j = 0; j < 9; j++) { const h = Math.floor(Math.sin(j / 9 * Math.PI) * 3); R(x + cx - h, cy - 9 + j, h * 2 + 1, 1, j < 4 ? '#e0c8ff' : '#a868f8'); } }
    disc(x + 29, 27, 1.5, '#f8d030'); disc(x + 35, 27, 1.5, '#f8d030');
  } },
  { id: 'pumpkins', name: 'Pumpkin pile', w: 1, h: 1, price: 200, draw(x, b) {
    floorShadow(x, b, 32);
    for (const [cx, cy, rx, ry, c] of [[9, -7, 8, 6, '#f08030'], [23, -8, 8, 7, '#e86a20'], [16, -18, 7, 6, '#f8a040']]) {
      ovalShade(x + cx, b + cy, rx, ry, c); for (const i of [-3, 0, 3]) R(x + cx + i, b + cy - ry + 2, 1, ry * 2 - 3, sh(c, -1)); R(x + cx, b + cy - ry - 2, 2, 3, '#5a7a2a');
    }
    leaf(x + 22, b - 24, 3, 2, k.leaf, 0.4);
  } },
  { id: 'batgarland', name: 'Bat garland', w: 2, h: 1, layer: 'wall', price: 160, wall(x) {
    for (let i = 0; i < 60; i++) P(x + 2 + i, 18 + Math.round(Math.sin(i / 59 * Math.PI) * 14), sh(k.m, 1));
    const bat = ['#.......#', '##.#.#.##', '#########', '.#######.', '..#.#.#..'];
    for (const i of [8, 24, 40, 54]) { const y = 18 + Math.round(Math.sin((i - 2) / 59 * Math.PI) * 14); stamp(bat, x + i - 6, y + 1, { '#': k.c }, 1); P(x + i - 1, y + 3, '#f8d030'); P(x + i + 1, y + 3, '#f8d030'); }
  } },
  { id: 'webrug', name: 'Web rug', w: 2, h: 2, layer: 'rug', price: 280, high: 0.04, side: 'c', flat(w, h) {
    disc(w / 2, h / 2, 31, sh(k.c, -2)); disc(w / 2, h / 2, 29, sh(k.c, -1));
    for (let a = 0; a < 12; a++) { const ang = a / 12 * Math.PI * 2; for (let r = 0; r < 28; r++) P(Math.round(w / 2 + Math.cos(ang) * r), Math.round(h / 2 + Math.sin(ang) * r), k.p); }
    for (let rr = 5; rr < 28; rr += 5) for (let a = 0; a < 12; a++) { const a0 = a / 12 * Math.PI * 2, a1 = (a + 1) / 12 * Math.PI * 2; for (let s = 0; s <= 8; s++) { const t2 = s / 8, ang = a0 + (a1 - a0) * t2, r = rr - Math.sin(t2 * Math.PI) * 1.5; P(Math.round(w / 2 + Math.cos(ang) * r), Math.round(h / 2 + Math.sin(ang) * r), k.p); } }
    ovalShade(w / 2 + 8, h / 2 - 6, 3, 3, '#303038'); P(w / 2 + 7, h / 2 - 6, '#e04848');
  } },
  { id: 'moonwindow', name: 'Moonlit window', w: 2, h: 1, layer: 'wall', price: 650, glow: ['#f4f0c8'], wall(x) {
    const inside = (i, j) => j >= 30 ? i >= x + 15 && i < x + 49 && j < 68 : Math.hypot(i + 0.5 - x - 32, j + 0.5 - 30) < 17;
    for (let j = 10; j < 70; j++) for (let i = x + 10; i < x + 54; i++) if (inside(i, j)) P(i, j, j < 40 ? '#141c3a' : '#1e2a50');
    disc(x + 32, 30, 8, '#f4f0c8'); disc(x + 30, 28, 3, '#e0dcb0'); disc(x + 35, 33, 2, '#e0dcb0');
    for (let n = 0; n < 12; n++) P(x + 16 + Math.floor(hash(n, 4) * 32), 16 + Math.floor(hash(n, 6) * 50), '#c8d0f8');
    stamp(['#.......#', '##.#.#.##', '#########', '.#######.', '..#.#.#..'], x + 38, 46, { '#': '#0e1428' }, 1);
    for (let j = 10; j < 72; j++) for (let i = x + 10; i < x + 54; i++) { if (inside(i, j)) continue; const outer = j >= 30 ? i >= x + 11 && i < x + 53 && j < 71 : Math.hypot(i + 0.5 - x - 32, j + 0.5 - 30) < 21; if (outer) P(i, j, sh(k.w, -1)); }
    R(x + 31, 13, 2, 55, sh(k.w, -1)); R(x + 15, 44, 34, 2, sh(k.w, -1)); R(x + 8, 70, 48, 4, k.w);
  } },
  { id: 'raggeddoll', name: 'Ragged doll', w: 1, h: 1, price: 280, draw(x, b) {
    floorShadow(x + 4, b, 24); R(x + 9, b - 6, 5, 6, sh(k.c, -1)); R(x + 18, b - 6, 5, 6, sh(k.c, -1));
    cushion(x + 7, b - 24, 18, 19, k.c, 4); for (let j = 0; j < 14; j += 3) R(x + 15, b - 22 + j, 2, 1, sh(k.c, -2)); R(x + 3, b - 21, 5, 4, k.c); R(x + 24, b - 19, 5, 4, k.c);
    disc(x + 16, b - 32, 9, k.p); disc(x + 12, b - 34, 2.5, '#303038'); P(x + 11, b - 35, '#ffffff'); R(x + 18, b - 35, 4, 1, '#303038'); R(x + 19, b - 36, 2, 3, '#303038');
    for (let i = 0; i < 7; i++) { P(x + 13 + i, b - 28, '#a84848'); if (i % 2) P(x + 13 + i, b - 29, '#a84848'); }
    for (let i = 0; i < 9; i++) R(x + 8 + i * 2, b - 42 + (i % 2), 2, 4, k.a);
  } },
  { id: 'ghostsheet', name: 'Sheet ghost', w: 1, h: 1, price: 220, draw(x, b) {
    floorShadow(x + 2, b, 28);
    for (let j = 0; j < 50; j++) { const half = j < 14 ? Math.round(Math.sqrt(196 - (14 - j) ** 2) * 0.85) : 12 + Math.floor((j - 14) / 9); R(x + 16 - half, b - 52 + j, half * 2, 1, j < 3 ? '#ffffff' : '#ecedf4'); }
    for (let i = 0; i < 6; i += 2) { clear(x + 2 + i * 5, b - 4, 5, 4); R(x + 2 + i * 5, b - 5, 5, 1, '#c8c8d8'); }
    oval(x + 11, b - 40, 2.5, 3.5, '#303038'); oval(x + 21, b - 40, 2.5, 3.5, '#303038'); oval(x + 16, b - 32, 3, 2, '#303038');
    for (let j = 20; j < 46; j += 6) R(x + 8 + (j % 4), b - j, 1, 8, '#d8d8e8');
  } },
  { id: 'organ', name: 'Pipe organ', w: 2, h: 1, price: 1500, draw(x, b, vw, dir) {
    if (dir % 2) return sideBox(x, b, vw, 80);
    floorShadow(x, b, vw);
    for (let i = 0; i < 9; i++) { const hh = 30 + Math.round(Math.sin(i / 8 * Math.PI) * 26); cyl(x + 4 + i * 6.4 | 0, b - 30 - hh, 5, hh, k.a); R(x + 5 + i * 6.4 | 0, b - 40, 3, 2, '#303038'); }
    wood(x, b - 36, vw, 36, k.w); wood(x - 1, b - 38, vw + 2, 4, sh(k.w, 1));
    if (dir === 2) return;
    R(x + 4, b - 30, vw - 8, 6, '#ffffff'); for (let i = 4; i < vw - 4; i += 3) R(x + i + 2, b - 30, 1, 6, '#c8c8c8'); for (let i = 5; i < vw - 5; i += 3) if (![2, 6].includes(Math.floor(i / 3) % 7)) R(x + i + 2, b - 30, 2, 4, '#202028');
    R(x + 4, b - 24, vw - 8, 2, sh(k.w, -1)); for (let i = 0; i < 6; i++) R(x + 8 + i * 9, b - 8, 6, 3, sh(k.w, -2));
    sphere(x + 6, b - 46, 2, '#a868f8'); sphere(x + vw - 6, b - 46, 2, '#a868f8');
  } },
]);
