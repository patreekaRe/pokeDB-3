/* base-furniture.js  -  the Secret Base's furniture catalogue: its first 25 kinds of piece (FAMILIES) here and the rest
   from js/base-furniture-kinds.js, each in 20 colour themes (THEMES) but the Pokémon dolls (`solo`). A kind is bought once
   and every colour of it comes with it (`colours()`). Every piece is painted in code at 32 pixels a tile with the kit in
   js/base-paint.js (Gen 3's decorations were the reference for the kinds and the theme names; no sprite sheet), then
   outlined and rim-lit by its `finish()`. A classic piece keeps its kind's bare id (`bed`, `chair`...), so rooms saved
   before the catalogue load unchanged; a themed one is `<kind>-<theme>` (`bed-fire`). Plus the present (`gift`), which
   is no catalogue piece: a new room's box of starter furniture (js/base-3d.js opens it).
   A piece's picture is `p.art(dir)`, a canvas: a flat piece top-down at its first facing, w x h tiles; a wall one as its
   strip of the wall (WALL_PX high); an upright one at a facing (front 0, side 1 / 3, back 2), its footprint's tiles plus
   HEAD pixels of headroom, the floor line at the canvas's bottom. Painters: `flat(w, h)` in pixels, `wall(x)`, and
   `draw(x, b, vw, dir)` for a view `vw` wide standing on the line `b` (a side view stands as tall as the front). */

import { timeOfDay } from './daytime.js';
import { MORE_KINDS } from './base-furniture-kinds.js';
import { ROOM_KINDS } from './base-furniture-rooms.js';
import { ROOM_KINDS_2 } from './base-furniture-rooms2.js';
import { ROOM_KINDS_3 } from './base-furniture-rooms3.js';
import { ROOM_KINDS_4 } from './base-furniture-rooms4.js';
import { ROOM_KINDS_5 } from './base-furniture-rooms5.js';
import { k, sh, R, P, panel, inset, wood, cushion, disc, oval, ovalShade, cyl, leaf, foliage, speckle,
  floorShadow, paintWith, finish, setBare, FT, WALL_PX, HEAD } from './base-paint.js';
import { BOOKS, SKY, view, books } from './base-paint-scenes.js';

const T = 16;

/** A colour darker (f < 1) or towards white (f > 1). */
function tone(hex, f) {
  const n = parseInt(hex.slice(1), 16), ch = [n >> 16, (n >> 8) & 255, n & 255];
  const out = ch.map(v => Math.max(0, Math.min(255, Math.round(f <= 1 ? v * f : v + (255 - v) * (f - 1)))));
  return '#' + out.map(v => v.toString(16).padStart(2, '0')).join('');
}

/* w frame / wood, c cloth, a accent, p pale (sheets, paper), m metal, g a lamp's shade, leaf and pot for plants. */
const THEMES = [
  { id: 'classic', name: '', w: '#a8723f', c: '#d0485a', a: '#e0b04a', p: '#f4f4f0', m: '#5a5a68', g: '#f4dc88', leaf: '#4f9a42', pot: '#c86a3a' },
  { id: 'pretty', name: 'Pretty', w: '#e8c8d8', c: '#f4a0c0', a: '#f8e078', p: '#fff8fc', m: '#b898c0', g: '#ffd0e8', leaf: '#78c878', pot: '#f4c0d8' },
  { id: 'heavy', name: 'Heavy', w: '#6e4626', c: '#8a3434', a: '#c8a050', p: '#e8dcc0', m: '#3a3a44', g: '#f0c070', leaf: '#3a7a3a', pot: '#8a4a2a' },
  { id: 'ragged', name: 'Ragged', w: '#8a7a5a', c: '#a09070', a: '#6a8a4a', p: '#d8d0b8', m: '#6a6050', g: '#e8d090', leaf: '#6a8a3a', pot: '#9a7a5a' },
  { id: 'comfort', name: 'Comfort', w: '#c89868', c: '#e8c890', a: '#d07048', p: '#fff4e0', m: '#8a7060', g: '#ffe0a0', leaf: '#5aa050', pot: '#d08858' },
  { id: 'brick', name: 'Brick', w: '#b5573e', c: '#d8c8a8', a: '#e8a040', p: '#f0e8d8', m: '#6a5a50', g: '#ffc890', leaf: '#4f8a42', pot: '#b5573e' },
  { id: 'camp', name: 'Camp', w: '#6a8a4a', c: '#c8a868', a: '#d86a2a', p: '#f0e8c8', m: '#4a5a3a', g: '#ffd070', leaf: '#4a7a32', pot: '#7a6a4a' },
  { id: 'hard', name: 'Hard', w: '#8a94a4', c: '#4a5a78', a: '#e0e4ec', p: '#e8ecf4', m: '#5a6474', g: '#d8f0ff', leaf: '#5a9a6a', pot: '#7a8494' },
  { id: 'poke', name: 'Poké', w: '#e04848', c: '#f4f4f0', a: '#303038', p: '#ffffff', m: '#3a3a44', g: '#fff4c0', leaf: '#4f9a42', pot: '#e04848' },
  { id: 'great', name: 'Great', w: '#3a6ac8', c: '#e85050', a: '#f4f4f0', p: '#ffffff', m: '#2a3a6a', g: '#d8ecff', leaf: '#4f9a42', pot: '#3a6ac8' },
  { id: 'ultra', name: 'Ultra', w: '#3a3a44', c: '#f0c838', a: '#f4f4f0', p: '#ffffff', m: '#202028', g: '#fff0a0', leaf: '#4f9a42', pot: '#3a3a44' },
  { id: 'master', name: 'Master', w: '#7a3ab8', c: '#e858a8', a: '#f4f4f0', p: '#ffffff', m: '#4a2070', g: '#ffd0f0', leaf: '#4f9a42', pot: '#7a3ab8' },
  { id: 'fire', name: 'Fire', w: '#c8482a', c: '#f08030', a: '#f8d030', p: '#fff0d8', m: '#5a2a1e', g: '#ffb060', leaf: '#6a9a3a', pot: '#c8482a' },
  { id: 'aqua', name: 'Aqua', w: '#3a7ac8', c: '#68b8f0', a: '#e8f8ff', p: '#f0faff', m: '#2a4a7a', g: '#b8f0ff', leaf: '#3a9a7a', pot: '#3a7ac8' },
  { id: 'leaf', name: 'Leaf', w: '#5a9a3a', c: '#9ad860', a: '#f0e070', p: '#f4fce8', m: '#3a5a2a', g: '#e8ffb0', leaf: '#3a8a2a', pot: '#7a5a3a' },
  { id: 'pika', name: 'Pika', w: '#e8b830', c: '#f8e070', a: '#d84838', p: '#fffbe8', m: '#6a4a20', g: '#fff8a0', leaf: '#5aa042', pot: '#e8b830' },
  { id: 'psychic', name: 'Psychic', w: '#c858a0', c: '#f890c8', a: '#a8f0f8', p: '#fff0fa', m: '#6a2a5a', g: '#ffc8f0', leaf: '#5a9a6a', pot: '#c858a0' },
  { id: 'frost', name: 'Frost', w: '#88c0e0', c: '#d8f0ff', a: '#4a88c8', p: '#ffffff', m: '#4a6a8a', g: '#e0faff', leaf: '#5aa08a', pot: '#88c0e0' },
  { id: 'dragon', name: 'Dragon', w: '#5a4ab8', c: '#7068e8', a: '#f0c040', p: '#f0eeff', m: '#2a2060', g: '#ffe090', leaf: '#4a8a5a', pot: '#5a4ab8' },
  { id: 'shadow', name: 'Shadow', w: '#3a3048', c: '#5a4a70', a: '#c84858', p: '#d8d0e0', m: '#1a1624', g: '#e888a0', leaf: '#3a6a4a', pot: '#3a3048' },
].map(t => ({ ...t, gl: tone(t.g, 1.6) }));

const FAMILIES = [
  /* ----- flat pieces: painted from above ----- */
  { id: 'bed', name: 'Bed', w: 2, h: 3, price: 600, high: 0.5, side: 'w', seat: 'bed', flat(w, h) {
    wood(0, 0, w, h, k.w);
    wood(2, 2, w - 4, 10, sh(k.w, -1)); R(4, 4, w - 8, 2, sh(k.w, 1)); for (let x = 8; x < w - 6; x += 10) inset(x, 7, 6, 4, sh(k.w, -1));
    R(2, 12, w - 4, 1, sh(k.w, -3));
    R(5, 13, w - 10, h - 17, k.p); R(5, 13, w - 10, 2, sh(k.p, 1));
    cushion(10, 16, w - 20, 15, '#ffffff', 4); R(w / 2, 18, 1, 11, sh(k.p, -1));
    cushion(4, 38, w - 8, h - 42, k.c, 3);
    R(4, 38, w - 8, 6, sh(k.c, 1)); R(4, 43, w - 8, 1, sh(k.c, -1)); R(8, 39, w - 20, 1, sh(k.c, 2));
    for (let y = 52; y < h - 8; y += 8) for (let x = 10; x < w - 6; x += 8) { P(x, y, sh(k.c, -2)); P(x - 1, y - 1, sh(k.c, 1)); }
    R(4, h - 6, w - 8, 2, sh(k.c, -1));
  } },
  { id: 'rug', name: 'Round rug', w: 3, h: 2, layer: 'rug', price: 300, high: 0.04, side: 'c', flat(w, h) {
    oval(w / 2, h / 2, w / 2 - 1, h / 2 - 1, sh(k.c, -1));
    oval(w / 2, h / 2, w / 2 - 3, h / 2 - 3, k.c);
    oval(w / 2, h / 2, w / 2 - 7, h / 2 - 7, k.a); oval(w / 2, h / 2, w / 2 - 9, h / 2 - 9, k.c);
    oval(w / 2, h / 2, w / 2 - 15, h / 2 - 13, sh(k.c, 1)); oval(w / 2, h / 2, w / 2 - 19, h / 2 - 17, k.c);
    for (let x = 18; x < w - 18; x += 8) { R(x, h / 2 - 1, 3, 3, k.p); P(x + 1, h / 2, k.a); }
    speckle(4, 4, w - 8, h - 8, sh(k.c, -1), 3, 0.05);
  } },
  { id: 'mat', name: 'Square mat', w: 2, h: 2, layer: 'rug', price: 250, high: 0.04, side: 'c', flat(w, h) {
    R(0, 0, w, h, sh(k.c, -1)); R(2, 2, w - 4, h - 4, k.a); R(4, 4, w - 8, h - 8, k.c); R(6, 6, w - 12, h - 12, sh(k.c, 1)); R(8, 8, w - 16, h - 16, k.c);
    for (let i = 0; i < 11; i++) { R(w / 2 - i, h / 2 - 11 + i, i * 2 + 1, 1, k.p); R(w / 2 - i, h / 2 + 11 - i, i * 2 + 1, 1, k.p); }
    for (let i = 0; i < 7; i++) { R(w / 2 - i, h / 2 - 7 + i, i * 2 + 1, 1, k.a); R(w / 2 - i, h / 2 + 7 - i, i * 2 + 1, 1, k.a); }
    for (let x = 1; x < w; x += 3) { R(x, 0, 1, 2, k.p); R(x, h - 2, 1, 2, k.p); }
    speckle(8, 8, w - 16, h - 16, sh(k.c, -1), 4, 0.06);
  } },
  { id: 'table', name: 'Table', w: 2, h: 2, price: 400, high: 0.55, side: 'w', flat(w, h) {
    wood(1, 1, w - 2, h - 2, k.w); R(1, h / 2, w - 2, 1, sh(k.w, -2));
    R(6, 14, w - 12, h - 28, k.p); R(6, 14, w - 12, 1, sh(k.p, 1)); R(6, h - 15, w - 12, 1, sh(k.p, -1));
    for (let x = 6; x < w - 6; x += 4) { P(x, 13, k.c); P(x + 2, h - 14, k.c); }
    disc(w / 2, h / 2, 6, sh(k.a, -1)); disc(w / 2, h / 2, 5, k.a); disc(w / 2 - 1, h / 2 - 1, 2, sh(k.a, 2));
    disc(14, 8, 3, '#ffffff'); disc(14, 8, 2, sh(k.c, 1));
  } },
  { id: 'endtable', name: 'Side table', w: 1, h: 1, price: 200, high: 0.55, side: 'w', flat(w) {
    disc(w / 2, w / 2, 15, sh(k.w, -1)); disc(w / 2, w / 2, 14, k.w); disc(w / 2 - 2, w / 2 - 2, 9, sh(k.w, 1)); disc(w / 2, w / 2, 9, k.w);
    disc(w / 2, w / 2, 7, k.p); for (let a = 0; a < 12; a++) P(w / 2 + Math.round(Math.cos(a / 2) * 7), w / 2 + Math.round(Math.sin(a / 2) * 7), sh(k.p, -1));
    disc(w / 2 + 1, w / 2 + 1, 3, '#ffffff'); disc(w / 2 + 1, w / 2 + 1, 2, k.c); P(w / 2, w / 2, sh(k.c, 2));
  } },
  { id: 'cushion', name: 'Ball cushion', w: 1, h: 1, price: 150, high: 0.22, side: 'm', seat: 'cushion', flat() {
    const top = k.c === '#f4f4f0' ? k.w : k.c;
    disc(16, 16, 14, '#303038');
    disc(16, 16, 13, k.p);
    for (let j = -13; j <= 0; j++) { const s = Math.sqrt(169 - j * j); R(Math.round(16 - s), 16 + j, Math.round(s * 2) + 1, 1, top); }
    disc(12, 10, 4, sh(top, 1)); R(9, 7, 3, 2, sh(top, 3));
    R(3, 15, 27, 3, '#303038'); disc(16, 16, 5, '#303038'); disc(16, 16, 3, '#ffffff'); P(15, 15, '#ffffff');
    oval(18, 23, 6, 2, sh(k.p, -1));
  } },

  /* ----- upright pieces: stand up out of their tiles ----- */
  { id: 'chair', name: 'Chair', w: 1, h: 1, price: 180, draw(x, b, vw, dir) {
    floorShadow(x, b, vw);
    const back = () => {
      if (dir % 2) { const bx = dir === 1 ? x + 22 : x + 4; wood(bx, b - 46, 6, 34, k.w, 'y'); return; }
      cyl(x + 6, b - 48, 4, 36, k.w); cyl(x + 22, b - 48, 4, 36, k.w);
      wood(x + 6, b - 48, 20, 7, k.w); wood(x + 9, b - 38, 14, 4, sh(k.w, -1));
      cushion(x + 10, b - 33, 12, 9, k.c, 2);
    };
    if (dir !== 2) back();
    cyl(x + 6, b - 16, 3, 16, sh(k.w, -1)); cyl(x + 23, b - 16, 3, 16, sh(k.w, -1));
    R(x + 9, b - 8, 14, 2, sh(k.w, -1));
    wood(x + 4, b - 20, 24, 6, k.w);
    cushion(x + 5, b - 24, 22, 6, k.c, 2);
    if (dir === 2) back();
  } },
  { id: 'stool', name: 'Stool', w: 1, h: 1, price: 120, draw(x, b) {
    floorShadow(x, b, 32);
    cyl(x + 8, b - 18, 3, 18, sh(k.w, -1)); cyl(x + 21, b - 18, 3, 18, sh(k.w, -1)); cyl(x + 14, b - 16, 3, 13, sh(k.w, -2));
    R(x + 10, b - 8, 12, 2, sh(k.w, -1));
    wood(x + 5, b - 22, 22, 5, k.w);
    cushion(x + 5, b - 28, 22, 8, k.c, 3);
  } },
  { id: 'sofa', name: 'Sofa', w: 2, h: 1, price: 700, draw(x, b, vw, dir) {
    // a plump sofa: a curved back, rolled arms with round scrolled fronts, two puffy seat cushions, tapered legs
    floorShadow(x, b, vw);
    const c = k.c, legs = (xs) => xs.forEach(lx => { cyl(lx, b - 6, 3.5, 6, sh(k.w, -1)); disc(lx + 1.75, b - 0.6, 1.6, sh(k.w, -2)); });
    if (dir % 2) {
      const bk = dir === 1 ? x + vw - 13 : x + 1;
      legs([x + 4, x + vw - 8]);
      cushion(bk, b - 42, 12, 34, sh(c, -1), 6);
      cushion(x + 1, b - 20, vw - 2, 14, sh(c, -1), 7);
      cushion(x + 3, b - 25, vw - 6, 9, c, 4.5);
      cushion(x + 5, b - 32, vw - 10, 12, c, 6);
      return;
    }
    legs([x + 6, x + vw - 10]);
    if (dir === 2) { cushion(x + 2, b - 46, vw - 4, 40, sh(c, -1), 14); cushion(x + 4, b - 20, vw - 8, 12, sh(c, -2), 6); return; }
    cushion(x + 4, b - 46, vw - 8, 30, c, 14);
    for (const cx of [x + 10, x + vw / 2 + 1]) {
      cushion(cx, b - 42, vw / 2 - 11, 22, sh(c, 1), 8);
      for (const [dx, dy] of [[0.3, 0.35], [0.7, 0.35], [0.5, 0.65]]) { disc(cx + (vw / 2 - 11) * dx, b - 42 + 22 * dy, 0.9, sh(c, -1)); disc(cx + (vw / 2 - 11) * dx - 0.3, b - 42 + 22 * dy - 0.3, 0.4, sh(c, 2)); }
    }
    cushion(x + 3, b - 17, vw - 6, 12, sh(c, -1), 6);
    for (const cx of [x + 9, x + vw / 2 + 1]) cushion(cx, b - 24, vw / 2 - 10, 10, sh(c, 1), 5);
    for (const ax of [x, x + vw - 12]) {
      cushion(ax, b - 32, 12, 27, c, 6);
      ovalShade(ax + 6, b - 27, 5.6, 5.2, sh(c, -1));
      ovalShade(ax + 5.6, b - 27.4, 3.4, 3.1, c);
      disc(ax + 5.4, b - 27.6, 1, sh(c, -1));
    }
  } },
  { id: 'armchair', name: 'Armchair', w: 1, h: 1, price: 400, draw(x, b, vw, dir) {
    floorShadow(x, b, vw);
    cyl(x + 4, b - 6, 4, 6, sh(k.w, -1)); cyl(x + 24, b - 6, 4, 6, sh(k.w, -1));
    if (dir % 2) {
      const bk = dir === 1 ? x + 20 : x + 2;
      cushion(x + 2, b - 22, 28, 16, k.c, 3);
      cushion(bk, b - 44, 10, 38, sh(k.c, -1), 4);
      return;
    }
    if (dir === 2) { cushion(x + 2, b - 46, 28, 40, sh(k.c, -1), 5); R(x + 8, b - 40, 16, 1, sh(k.c, -2)); return; }
    cushion(x + 6, b - 46, 20, 26, k.c, 6);
    for (const [cx, cy] of [[11, -38], [16, -38], [21, -38], [13, -31], [19, -31]]) { P(x + cx, b + cy, sh(k.c, -2)); P(x + cx - 1, b + cy - 1, sh(k.c, 1)); }
    cushion(x + 4, b - 20, 24, 8, sh(k.c, 1), 3);
    cushion(x + 4, b - 13, 24, 8, sh(k.c, -1), 2); for (let i = 7; i < 27; i += 4) R(x + i, b - 11, 1, 5, sh(k.c, -2));
    cushion(x, b - 28, 8, 22, k.c, 3); cushion(x + 24, b - 28, 8, 22, k.c, 3);
    R(x + 1, b - 27, 5, 2, sh(k.c, 2)); R(x + 25, b - 27, 5, 2, sh(k.c, 2));
  } },
  { id: 'lamp', name: 'Lamp', w: 1, h: 1, price: 250, glow: ['g', 'gl'], draw(x, b) {
    floorShadow(x + 4, b, 24);
    wood(x + 6, b - 12, 20, 12, k.w); R(x + 7, b - 6, 18, 1, sh(k.w, -1)); R(x + 15, b - 9, 2, 2, k.a);
    ovalShade(x + 16, b - 18, 6, 6, k.m);
    cyl(x + 15, b - 30, 3, 10, k.m);
    for (let j = 0; j < 20; j++) { const half = 7 + Math.floor(j * 0.4); R(x + 16 - half, b - 52 + j, half * 2, 1, j < 3 ? k.gl : k.g); }
    R(x + 9, b - 52, 14, 1, sh(k.g, -1)); R(x + 8, b - 33, 16, 2, sh(k.g, -1));
    R(x + 11, b - 48, 2, 12, k.gl);
  } },
  { id: 'floorlamp', name: 'Floor lamp', w: 1, h: 1, price: 350, glow: ['g', 'gl'], draw(x, b) {
    floorShadow(x + 4, b, 24);
    ovalShade(x + 16, b - 3, 10, 3, k.m);
    cyl(x + 15, b - 60, 3, 58, k.m); R(x + 13, b - 32, 7, 2, sh(k.m, 1));
    for (let j = 0; j < 18; j++) { const half = 6 + Math.floor(j * 0.45); R(x + 16 - half, b - 80 + j, half * 2, 1, j < 3 ? k.gl : k.g); }
    R(x + 10, b - 80, 12, 1, sh(k.g, -1)); R(x + 8, b - 63, 16, 2, sh(k.a, -1));
    R(x + 11, b - 77, 2, 11, k.gl);
  } },
  { id: 'plant', name: 'Potted plant', w: 1, h: 1, price: 200, draw(x, b) {
    floorShadow(x + 4, b, 24);
    cyl(x + 9, b - 16, 14, 15, k.pot); R(x + 10, b - 2, 12, 2, sh(k.pot, -1));
    cushion(x + 7, b - 20, 18, 5, sh(k.pot, 1), 1); R(x + 9, b - 19, 14, 2, '#3a2416');
    R(x + 15, b - 38, 2, 19, sh(k.leaf, -1)); R(x + 11, b - 30, 2, 10, sh(k.leaf, -1)); R(x + 20, b - 32, 2, 12, sh(k.leaf, -1));
    leaf(x + 8, b - 29, 5, 7, k.leaf, -0.5); leaf(x + 24, b - 31, 5, 8, k.leaf, 0.5); leaf(x + 15, b - 25, 4, 5, sh(k.leaf, -1));
    leaf(x + 12, b - 40, 5, 8, k.leaf, -0.3); leaf(x + 21, b - 43, 5, 8, k.leaf, 0.3); leaf(x + 16, b - 48, 4, 7, sh(k.leaf, 1));
  } },
  { id: 'palm', name: 'Big plant', w: 1, h: 1, price: 450, draw(x, b) {
    floorShadow(x + 2, b, 28);
    cyl(x + 7, b - 18, 18, 17, k.pot); R(x + 8, b - 2, 16, 2, sh(k.pot, -1));
    cushion(x + 5, b - 22, 22, 6, sh(k.pot, 1), 1); R(x + 7, b - 20, 18, 2, '#3a2416');
    for (let y = b - 62; y < b - 20; y += 1) { const wv = Math.round(Math.sin(y / 9) * 1.5); R(x + 15 + wv, y, 3, 1, (y % 6 < 2) ? sh(k.w, -1) : k.w); }
    const frond = (cx, cy, dir, len) => { for (let i = 0; i < len; i++) { const fx = cx + dir * i, fy = cy + Math.round(i * i / (len * 1.4)); R(fx, fy - 3 + (i % 2), 2, 3, k.leaf); R(fx, fy, 2, 1, sh(k.leaf, -1)); R(fx, fy + 1, 2, 3 - (i % 2), sh(k.leaf, -1)); if (i % 3 === 0) P(fx, fy - 3, sh(k.leaf, 1)); } };
    frond(x + 16, b - 62, -1, 15); frond(x + 18, b - 62, 1, 14); frond(x + 16, b - 66, -1, 10); frond(x + 18, b - 66, 1, 11);
    frond(x + 15, b - 58, -1, 12); frond(x + 19, b - 58, 1, 12);
    leaf(x + 17, b - 72, 3, 7, sh(k.leaf, 1));
  } },
  { id: 'shelf', name: 'Bookshelf', w: 2, h: 1, price: 550, solid: true, draw(x, b, vw, dir) {
    if (dir % 2) { wood(x + 4, b - 76, vw - 8, 76, k.w, 'y'); R(dir === 1 ? x + 6 : x + vw - 10, b - 72, 4, 70, sh(k.w, -1)); return; }
    wood(x, b - 76, vw, 76, k.w, 'y'); wood(x, b - 76, vw, 6, sh(k.w, 1));
    R(x, b - 4, vw, 4, sh(k.w, -1));
    if (dir === 2) { for (let i = 0; i < 3; i++) R(x + 3, b - 52 + i * 22, vw - 6, 2, sh(k.w, -1)); return; }
    for (let row = 0; row < 3; row++) {
      const top = b - 68 + row * 22, floor = top + 18;
      R(x + 4, top, vw - 8, 3, sh(k.w, -3)); R(x + 4, top + 3, vw - 8, 15, sh(k.w, -2));
      if (row === 1) {
        books(x + 5, x + 34, floor, 3);
        cyl(x + 38, floor - 9, 9, 9, k.pot); leaf(x + 40, floor - 13, 2, 4, k.leaf, -0.4); leaf(x + 45, floor - 14, 2, 5, k.leaf, 0.4);
        R(x + 51, floor - 6, 6, 6, sh(k.a, -1)); R(x + 53, floor - 12, 2, 6, k.a); R(x + 50, floor - 16, 8, 4, k.a); R(x + 51, floor - 16, 2, 1, sh(k.a, 2));
      } else books(x + 5, x + vw - 5, floor, row * 7);
      wood(x + 2, floor, vw - 4, 3, sh(k.w, 1));
    }
  } },
  { id: 'dresser', name: 'Dresser', w: 2, h: 1, price: 500, draw(x, b, vw, dir) {
    floorShadow(x, b, vw);
    cyl(x + 4, b - 4, 4, 4, sh(k.w, -1)); cyl(x + vw - 8, b - 4, 4, 4, sh(k.w, -1));
    wood(x, b - 48, vw, 44, k.w); wood(x, b - 50, vw, 4, sh(k.w, 1));
    if (dir === 2) { R(x + 3, b - 26, vw - 6, 1, sh(k.w, -1)); return; }
    if (dir % 2) { R(dir === 1 ? x + 2 : x + vw - 5, b - 44, 3, 38, sh(k.w, -1)); return; }
    for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) {
      const dx = x + 3 + c * 29, dy = b - 45 + r * 13;
      inset(dx, dy, 26, 12, sh(k.w, 1)); panel(dx + 1, dy + 1, 24, 10, k.w);
      ovalShade(dx + 13, dy + 6, 2, 2, k.a);
    }
    cyl(x + 44, b - 64, 10, 14, k.c); R(x + 43, b - 66, 12, 3, sh(k.c, 1));
    leaf(x + 46, b - 70, 2, 4, k.leaf, -0.5); leaf(x + 52, b - 72, 2, 5, k.leaf, 0.4); disc(x + 49, b - 76, 3, k.a); P(x + 48, b - 77, sh(k.a, 2));
    R(x + 8, b - 52, 14, 2, k.p); R(x + 10, b - 54, 10, 2, sh(k.p, -1));
  } },
  { id: 'tv', name: 'TV', w: 2, h: 1, price: 800, draw(x, b, vw, dir) {
    floorShadow(x, b, vw);
    if (dir % 2) {
      R(x + 12, b - 16, 8, 16, sh(k.m, -1)); panel(x + 6, b - 52, 20, 38, k.m);
      R(dir === 1 ? x + 6 : x + 22, b - 50, 4, 34, '#2a3a5a');
      return;
    }
    wood(x + 4, b - 14, vw - 8, 14, k.w); R(x + 8, b - 10, vw - 16, 6, sh(k.w, -2)); R(x + 10, b - 9, 10, 4, k.m); R(x + 24, b - 9, 6, 4, '#202028');
    panel(x + 2, b - 54, vw - 4, 40, k.m, 2);
    if (dir === 2) { for (let i = 0; i < 6; i++) R(x + 16, b - 46 + i * 4, vw - 32, 1, sh(k.m, -2)); return; }
    for (let j = 0; j < 28; j++) R(x + 6, b - 50 + j, vw - 12, 1, j % 2 ? '#24345a' : '#2a4a8a');
    R(x + 10, b - 46, 14, 3, '#a8d8f8'); R(x + 10, b - 43, 3, 6, '#a8d8f8'); disc(x + 42, b - 36, 5, '#f8d030'); R(x + 40, b - 38, 2, 2, '#ffffff');
    R(x + 6, b - 50, vw - 12, 1, '#000000');
    disc(x + vw - 10, b - 18, 1.5, '#e04848'); R(x + vw - 18, b - 19, 5, 1, sh(k.m, 1));
    R(x + 18, b - 62, 1, 8, k.m); R(x + 45, b - 62, 1, 8, k.m); R(x + 17, b - 63, 2, 2, sh(k.m, 2)); R(x + 44, b - 63, 2, 2, sh(k.m, 2));
  } },
  { id: 'desk', name: 'Desk', w: 2, h: 1, price: 450, draw(x, b, vw, dir) {
    floorShadow(x, b, vw);
    if (dir % 2) {
      cyl(x + 4, b - 28, 4, 28, sh(k.w, -1)); cyl(x + 24, b - 28, 4, 28, sh(k.w, -1));
      wood(x, b - 34, vw, 7, k.w);
      return;
    }
    cyl(x + 4, b - 28, 4, 28, sh(k.w, -1));
    wood(x + vw - 24, b - 28, 22, 28, k.w);
    if (dir === 0) for (let r = 0; r < 2; r++) { inset(x + vw - 22, b - 26 + r * 13, 18, 11, sh(k.w, 1)); panel(x + vw - 21, b - 25 + r * 13, 16, 9, k.w); R(x + vw - 15, b - 21 + r * 13, 4, 2, k.a); }
    wood(x, b - 34, vw, 7, sh(k.w, 1));
    if (dir === 0) {
      R(x + 6, b - 50, 18, 16, sh(k.p, -1)); R(x + 7, b - 49, 16, 14, k.p); for (let i = 0; i < 4; i++) R(x + 9, b - 46 + i * 3, 10 - (i % 2) * 3, 1, sh(k.p, -2));
      R(x + 7, b - 49, 16, 2, k.c);
      cyl(x + 30, b - 44, 8, 10, k.a); R(x + 31, b - 44, 6, 2, sh(k.a, -2)); R(x + 32, b - 50, 1, 6, k.c); R(x + 35, b - 48, 1, 4, '#4a7ac8');
      R(x + 44, b - 36, 12, 2, '#ffffff'); R(x + 46, b - 38, 10, 2, sh(k.c, 1));
    }
  } },
  { id: 'wardrobe', name: 'Wardrobe', w: 2, h: 1, price: 700, draw(x, b, vw, dir) {
    floorShadow(x, b, vw);
    cyl(x + 4, b - 4, 5, 4, sh(k.w, -1)); cyl(x + vw - 9, b - 4, 5, 4, sh(k.w, -1));
    wood(x, b - 80, vw, 76, k.w, 'y'); wood(x, b - 84, vw, 6, sh(k.w, 1)); R(x, b - 79, vw, 1, sh(k.w, -2));
    if (dir % 2 || dir === 2) return;
    for (const dx of [3, vw / 2 + 1]) {
      inset(x + dx, b - 74, vw / 2 - 4, 66, sh(k.w, -1)); wood(x + dx + 1, b - 73, vw / 2 - 6, 64, k.w, 'y');
      inset(x + dx + 4, b - 69, vw / 2 - 12, 24, sh(k.w, -1)); inset(x + dx + 4, b - 40, vw / 2 - 12, 26, sh(k.w, -1));
    }
    cyl(x + vw / 2 - 4, b - 46, 2, 8, k.a); cyl(x + vw / 2 + 2, b - 46, 2, 8, k.a);
  } },
  { id: 'vase', name: 'Flower vase', w: 1, h: 1, price: 150, draw(x, b) {
    floorShadow(x + 6, b, 20);
    ovalShade(x + 16, b - 12, 8, 11, k.c); R(x + 8, b - 14, 16, 3, k.a); R(x + 9, b - 14, 3, 1, sh(k.a, 2));
    cyl(x + 12, b - 28, 8, 7, k.c); R(x + 11, b - 30, 10, 3, sh(k.c, 1));
    R(x + 15, b - 42, 1, 12, sh(k.leaf, -1)); R(x + 19, b - 40, 1, 10, sh(k.leaf, -1)); R(x + 11, b - 38, 1, 8, sh(k.leaf, -1));
    leaf(x + 13, b - 34, 2, 3, k.leaf, -0.6); leaf(x + 21, b - 34, 2, 3, k.leaf, 0.6);
    const bloom = (cx, cy, c) => { for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2], [-1, -1], [1, -1], [-1, 1], [1, 1]]) P(x + cx + dx, cy + dy, dy < 0 ? sh(c, 1) : c); P(x + cx, cy, '#f8e070'); };
    bloom(15, b - 44, k.a === k.p ? '#e04848' : k.a); bloom(20, b - 42, k.p); bloom(10, b - 40, sh(k.c, 1));
  } },
  { id: 'crate', name: 'Crate', w: 1, h: 1, price: 100, draw(x, b) {
    floorShadow(x, b, 32);
    wood(x + 2, b - 28, 28, 28, k.w);
    for (const y of [b - 19, b - 10]) R(x + 3, y, 26, 1, sh(k.w, -2));
    wood(x + 2, b - 28, 4, 28, sh(k.w, 1), 'y'); wood(x + 26, b - 28, 4, 28, sh(k.w, -1), 'y');
    for (let i = 0; i < 20; i++) { R(x + 6 + i, b - 26 + i, 2, 2, sh(k.w, 1)); P(x + 6 + i, b - 24 + i, sh(k.w, -1)); }
    R(x + 12, b - 24, 8, 4, k.a); R(x + 13, b - 23, 6, 1, sh(k.a, 1));
    for (const [cx, cy] of [[4, -26], [28, -26], [4, -3], [28, -3]]) P(x + cx, b + cy, k.m);
  } },

  /* ----- wall pieces: hung on the wall strip ----- */
  { id: 'window', name: 'Window', w: 2, h: 1, layer: 'wall', price: 500, wall(x) {
    wood(x + 3, 14, 58, 56, k.w); view(x + 7, 18, 50, 48);
    wood(x + 30, 18, 4, 48, k.w, 'y'); wood(x + 7, 40, 50, 4, k.w);
    R(x + 7, 18, 50, 1, sh(k.w, -2)); R(x + 7, 18, 1, 48, sh(k.w, -2));
    wood(x + 1, 70, 62, 6, sh(k.w, 1)); R(x + 3, 76, 58, 2, sh(k.w, -2));
  } },
  { id: 'poster', name: 'Poster', w: 1, h: 1, layer: 'wall', price: 100, wall(x) {
    R(x + 5, 21, 23, 37, 'rgba(0,0,0,0.18)');
    panel(x + 4, 20, 24, 36, k.p);
    R(x + 7, 24, 18, 15, k.c); R(x + 7, 24, 18, 2, sh(k.c, 1)); oval(x + 16, 33, 6, 4, sh(k.c, -1));
    disc(x + 16, 31, 4, k.a); R(x + 15, 29, 2, 1, sh(k.a, 2));
    R(x + 8, 43, 16, 2, sh(k.p, -2)); R(x + 8, 47, 11, 1, sh(k.p, -1)); R(x + 8, 50, 13, 1, sh(k.p, -1));
    disc(x + 16, 21, 1.5, k.m);
  } },
  { id: 'clock', name: 'Clock', w: 1, h: 1, layer: 'wall', price: 200, wall(x) {
    disc(x + 16, 32, 12, sh(k.w, -1)); disc(x + 16, 32, 11, k.w); disc(x + 15, 31, 9, sh(k.w, 1));
    disc(x + 16, 32, 9, k.p); oval(x + 13, 28, 4, 2, '#ffffff');
    for (let h = 0; h < 12; h++) P(x + 16 + Math.round(Math.cos(h * Math.PI / 6) * 7), 32 + Math.round(Math.sin(h * Math.PI / 6) * 7), sh(k.m, h % 3 ? 0 : -1));
    R(x + 16, 26, 1, 7, sh(k.m, -1)); R(x + 16, 32, 5, 1, sh(k.m, -1)); P(x + 16, 32, k.c);
    cyl(x + 15, 44, 2, 12, k.a); disc(x + 16, 58, 3, k.a); P(x + 15, 57, sh(k.a, 2));
  } },
  { id: 'painting', name: 'Painting', w: 2, h: 1, layer: 'wall', price: 400, wall(x) {
    R(x + 7, 19, 52, 44, 'rgba(0,0,0,0.18)');
    panel(x + 6, 18, 52, 44, k.a, 2); R(x + 8, 20, 48, 1, sh(k.a, 2)); inset(x + 10, 22, 44, 36, sh(k.a, -1));
    for (let j = 0; j < 34; j++) R(x + 11, 23 + j, 42, 1, j < 12 ? sh(k.c, 2) : sh(k.c, 1));
    disc(x + 22, 31, 5, k.p);
    oval(x + 34, 48, 22, 10, sh(k.leaf, -1)); oval(x + 18, 52, 14, 8, k.leaf); R(x + 11, 50, 42, 7, k.leaf); R(x + 11, 50, 42, 1, sh(k.leaf, 1));
    cyl(x + 42, 36, 3, 12, sh(k.w, -1)); foliage(x + 43, 34, 6, k.leaf, 4);
    R(x + 28, 52, 6, 3, k.c); R(x + 27, 50, 2, 2, k.c);
  } },
].map(f => ({ group: f.layer === 'wall' ? 'Wall' : f.layer === 'rug' ? 'Rugs' : 'Classics', ...f }));

FAMILIES.push(...MORE_KINDS, ...ROOM_KINDS, ...ROOM_KINDS_2, ...ROOM_KINDS_3, ...ROOM_KINDS_4, ...ROOM_KINDS_5);
const seen = new Set();
for (const f of FAMILIES) { if (seen.has(f.id)) throw new Error(`furniture: two kinds called ${f.id}`); seen.add(f.id); }
/* A `set` is one painter's family whose kinds differ only by the picture on them or the thing on top (13 banners by
   motif, 14 kitchen counters by appliance): reskins, not new designs, so the whole set is bought and owned as one, by
   its first kind's id, the way a kind's 20 colours are (the user's call, 2026-10-08). */
const SETS = {};
for (const f of FAMILIES) if (f.set) (SETS[f.set] ||= []).push(f.id);
for (const f of FAMILIES) f.own = f.set ? SETS[f.set][0] : f.id;

const NOUN = { cushion: 'Cushion' };   // a themed piece's name drops the classic one's adjective
const noun = (fam) => fam.id === 'tv' ? 'TV' : NOUN[fam.id] || (fam.proper ? fam.name : fam.name[0].toLowerCase() + fam.name.slice(1));

/** The present a new room starts with: no theme, never sold. */
const GIFT = { id: 'gift', name: 'Present', w: 1, h: 1, price: 0, draw(x, b) {
  floorShadow(x, b, 32);
  panel(x + 3, b - 26, 26, 26, '#d84848'); R(x + 4, b - 25, 24, 3, '#f07070');
  cyl(x + 14, b - 26, 4, 26, '#f8d030'); R(x + 3, b - 16, 26, 4, '#f8d030'); R(x + 3, b - 16, 26, 1, '#fff4a0');
  panel(x + 1, b - 32, 30, 7, '#e85858'); R(x + 2, b - 31, 28, 1, '#f89090');
  cyl(x + 14, b - 32, 4, 7, '#f8d030');
  ovalShade(x + 10, b - 37, 5, 4, '#f8d030'); ovalShade(x + 22, b - 37, 5, 4, '#f8d030'); disc(x + 10, b - 37, 1.5, '#c89018'); disc(x + 22, b - 37, 1.5, '#c89018');
  R(x + 14, b - 38, 4, 5, '#e0a818'); R(x + 15, b - 37, 2, 1, '#fff4a0');
} };

/** What a piece costs at the store, from its authored price (80 to 1,600): 50 to 150 PokéCoins on a log curve, so the
    order holds (a crate cheapest, a grand piano dearest) but furniture is cheap (the user's call, 2026-10-09). */
export const shopPrice = (p) => (p ? Math.min(150, Math.max(50, Math.round((50 + 100 * Math.log(p / 80) / Math.log(20)) / 5) * 5)) : 0);

// HD pictures, the least recently used dropped past FINE_KEEP (each is a few hundred kilobytes)
const FINE = new Map(), FINE_KEEP = 64;

/** One piece: a kind in a theme. Its pictures are painted once per facing (a window's once per hour of the day). */
function makePiece(fam, theme) {
  const pal = theme || THEMES[0];
  const p = {
    name: theme ? `${theme.name} ${noun(fam)}` : fam.name,
    fam: fam.id, own: fam.own || fam.id, group: fam.group, theme: pal.id, w: fam.w, h: fam.h, price: shopPrice(fam.price), pal,
  };
  if (fam.layer) p.layer = fam.layer;
  if (fam.flat) { p.flat = true; p.high = fam.high; p.side = sh(pal[fam.side] || pal.w, -1); }
  if (fam.wall) p.wall = true;
  if (fam.doll) p.doll = fam.doll;
  if (fam.draw) p.upright = true;
  const cache = new Map();
  /** Its picture at a facing, `s` canvas pixels a painted unit (1 for the carving and the 2D room, HD for textures);
      `bare` leaves out its floor shadow, for reading its outline. */
  p.art = (dir = 0, s = 1, bare = false) => {
    const key = (fam.flat || fam.wall ? 0 : dir) + (fam.sky || fam.id === 'window' ? timeOfDay() : '') + (bare ? 'b' : '');
    const store = s === 1 ? cache : FINE, at = s === 1 ? key : `${fam.id}-${pal.id}|${key}|${s}`;
    if (store.has(at)) { const c = store.get(at); if (s !== 1) { store.delete(at); store.set(at, c); } return c; }
    let c, w, h, paint;
    if (fam.flat) [w, h, paint] = [fam.w * FT, fam.h * FT, () => fam.flat(w, h)];
    else if (fam.wall) [w, h, paint] = [fam.w * FT, WALL_PX, () => fam.wall(0)];
    else {
      const [fw, fh] = dir % 2 ? [fam.h, fam.w] : [fam.w, fam.h];
      [w, h, paint] = [fw * FT, fh * FT + HEAD, () => fam.draw(0, h, fw * FT, dir)];
    }
    c = new OffscreenCanvas(w * s, h * s);
    c.hd = s;
    const ctx = c.getContext('2d');
    ctx.scale(s, s);
    setBare(bare);
    try { paintWith(ctx, pal, paint); } finally { setBare(false); }
    finish(c, { outline: !fam.flat });
    store.set(at, c);
    if (FINE.size > FINE_KEEP) FINE.delete(FINE.keys().next().value);
    return c;
  };
  if (fam.solid) Object.assign(p, { solid: true, wood: pal.w, woodLit: sh(pal.w, 1) });
  if (fam.seat) p.seat = fam.seat;
  if (fam.glow) p.glow = fam.glow.map(key => key[0] === '#' ? key : pal[key]);
  if (fam.id === 'window' || fam.sky) p.glow = Object.values(SKY);
  return p;
}

const PIECES = {};
for (const fam of FAMILIES) for (const theme of fam.solo ? THEMES.slice(0, 1) : THEMES) {
  PIECES[theme.id === 'classic' ? fam.id : `${fam.id}-${theme.id}`] = makePiece(fam, theme.id === 'classic' ? null : theme);
}
/** Every catalogue id, kind by kind (the present isn't one). */
const CATALOGUE = Object.keys(PIECES);
/** Every kind, by its classic piece's id. */
const KINDS = FAMILIES.map(f => f.id);
const COLOURS = {};
for (const id of CATALOGUE) (COLOURS[PIECES[id].fam] ||= []).push(id);
/** Every colour of a piece's kind, the classic first. */
const colours = (id) => COLOURS[PIECES[id].fam];
/** What you buy and own: a kind, or a whole set by its first kind. Owning one gives every colour of every style in it. */
const DESIGNS = KINDS.filter(id => PIECES[id].own === id);
/** Every style of a piece's set in the piece's colour (just the piece, outside a set). */
const styles = (id) => {
  const { own, theme } = PIECES[id];
  return FAMILIES.filter(f => f.own === own).map(f => theme === 'classic' ? f.id : `${f.id}-${theme}`).filter(s => PIECES[s]);
};
PIECES.gift = makePiece(GIFT, null);
PIECES.gift.gift = true;

export { PIECES, CATALOGUE, KINDS, DESIGNS, colours, styles, THEMES, FAMILIES, T };
