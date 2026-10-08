/* base-furniture.js  -  the Secret Base's furniture catalogue: 25 kinds of piece (FAMILIES) in 20 colour themes (THEMES),
   500 pieces, every one painted in code from its theme's palette (Gen 3's decorations were the reference for the kinds
   and the theme names; no sprite sheet). A classic piece keeps its kind's bare id (`bed`, `chair`...), so rooms saved
   before the catalogue load unchanged; a themed one is `<kind>-<theme>` (`bed-fire`). Plus the present (`gift`), which
   is no catalogue piece: a new room's box of starter furniture (js/base-3d.js opens it).
   Painters draw on the context handed to them: a flat piece top-down at its first facing (`flat(ctx, w, h)`), an upright
   one at a facing with its footprint's top edge at `y` (`upright(ctx, x, y, dir)`: front 0, side 1 / 3, back 2), a wall
   one as its strip of the wall (`wall(ctx, x)`). */

import { timeOfDay } from './daytime.js';

const T = 16;

let g, k;   // the context and palette while painting
const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
const box = (x, y, w, h, fill, edge) => { R(x, y, w, h, edge); R(x + 1, y + 1, w - 2, h - 2, fill); };

/** A colour darker (f < 1) or towards white (f > 1). */
function tone(hex, f) {
  const n = parseInt(hex.slice(1), 16), ch = [n >> 16, (n >> 8) & 255, n & 255];
  const out = ch.map(v => Math.max(0, Math.min(255, Math.round(f <= 1 ? v * f : v + (255 - v) * (f - 1)))));
  return '#' + out.map(v => v.toString(16).padStart(2, '0')).join('');
}

/* w frame / wood, c cloth, a accent, p pale (sheets, paper), m metal, g a lamp's shade, leaf and pot for plants.
   `tier` sets the price: 1 plain, 2 typed, 3 the Poké Ball sets. */
const THEMES = [
  { id: 'classic', name: '', w: '#a8723f', c: '#d0485a', a: '#e0b04a', p: '#f4f4f0', m: '#5a5a68', g: '#f4dc88', leaf: '#4f9a42', pot: '#c86a3a', tier: 1 },
  { id: 'pretty', name: 'Pretty', w: '#e8c8d8', c: '#f4a0c0', a: '#f8e078', p: '#fff8fc', m: '#b898c0', g: '#ffd0e8', leaf: '#78c878', pot: '#f4c0d8', tier: 1 },
  { id: 'heavy', name: 'Heavy', w: '#6e4626', c: '#8a3434', a: '#c8a050', p: '#e8dcc0', m: '#3a3a44', g: '#f0c070', leaf: '#3a7a3a', pot: '#8a4a2a', tier: 1 },
  { id: 'ragged', name: 'Ragged', w: '#8a7a5a', c: '#a09070', a: '#6a8a4a', p: '#d8d0b8', m: '#6a6050', g: '#e8d090', leaf: '#6a8a3a', pot: '#9a7a5a', tier: 1 },
  { id: 'comfort', name: 'Comfort', w: '#c89868', c: '#e8c890', a: '#d07048', p: '#fff4e0', m: '#8a7060', g: '#ffe0a0', leaf: '#5aa050', pot: '#d08858', tier: 1 },
  { id: 'brick', name: 'Brick', w: '#b5573e', c: '#d8c8a8', a: '#e8a040', p: '#f0e8d8', m: '#6a5a50', g: '#ffc890', leaf: '#4f8a42', pot: '#b5573e', tier: 1 },
  { id: 'camp', name: 'Camp', w: '#6a8a4a', c: '#c8a868', a: '#d86a2a', p: '#f0e8c8', m: '#4a5a3a', g: '#ffd070', leaf: '#4a7a32', pot: '#7a6a4a', tier: 1 },
  { id: 'hard', name: 'Hard', w: '#8a94a4', c: '#4a5a78', a: '#e0e4ec', p: '#e8ecf4', m: '#5a6474', g: '#d8f0ff', leaf: '#5a9a6a', pot: '#7a8494', tier: 1 },
  { id: 'poke', name: 'Poké', w: '#e04848', c: '#f4f4f0', a: '#303038', p: '#ffffff', m: '#3a3a44', g: '#fff4c0', leaf: '#4f9a42', pot: '#e04848', tier: 3 },
  { id: 'great', name: 'Great', w: '#3a6ac8', c: '#e85050', a: '#f4f4f0', p: '#ffffff', m: '#2a3a6a', g: '#d8ecff', leaf: '#4f9a42', pot: '#3a6ac8', tier: 3 },
  { id: 'ultra', name: 'Ultra', w: '#3a3a44', c: '#f0c838', a: '#f4f4f0', p: '#ffffff', m: '#202028', g: '#fff0a0', leaf: '#4f9a42', pot: '#3a3a44', tier: 3 },
  { id: 'master', name: 'Master', w: '#7a3ab8', c: '#e858a8', a: '#f4f4f0', p: '#ffffff', m: '#4a2070', g: '#ffd0f0', leaf: '#4f9a42', pot: '#7a3ab8', tier: 3 },
  { id: 'fire', name: 'Fire', w: '#c8482a', c: '#f08030', a: '#f8d030', p: '#fff0d8', m: '#5a2a1e', g: '#ffb060', leaf: '#6a9a3a', pot: '#c8482a', tier: 2 },
  { id: 'aqua', name: 'Aqua', w: '#3a7ac8', c: '#68b8f0', a: '#e8f8ff', p: '#f0faff', m: '#2a4a7a', g: '#b8f0ff', leaf: '#3a9a7a', pot: '#3a7ac8', tier: 2 },
  { id: 'leaf', name: 'Leaf', w: '#5a9a3a', c: '#9ad860', a: '#f0e070', p: '#f4fce8', m: '#3a5a2a', g: '#e8ffb0', leaf: '#3a8a2a', pot: '#7a5a3a', tier: 2 },
  { id: 'pika', name: 'Pika', w: '#e8b830', c: '#f8e070', a: '#d84838', p: '#fffbe8', m: '#6a4a20', g: '#fff8a0', leaf: '#5aa042', pot: '#e8b830', tier: 2 },
  { id: 'psychic', name: 'Psychic', w: '#c858a0', c: '#f890c8', a: '#a8f0f8', p: '#fff0fa', m: '#6a2a5a', g: '#ffc8f0', leaf: '#5a9a6a', pot: '#c858a0', tier: 2 },
  { id: 'frost', name: 'Frost', w: '#88c0e0', c: '#d8f0ff', a: '#4a88c8', p: '#ffffff', m: '#4a6a8a', g: '#e0faff', leaf: '#5aa08a', pot: '#88c0e0', tier: 2 },
  { id: 'dragon', name: 'Dragon', w: '#5a4ab8', c: '#7068e8', a: '#f0c040', p: '#f0eeff', m: '#2a2060', g: '#ffe090', leaf: '#4a8a5a', pot: '#5a4ab8', tier: 2 },
  { id: 'shadow', name: 'Shadow', w: '#3a3048', c: '#5a4a70', a: '#c84858', p: '#d8d0e0', m: '#1a1624', g: '#e888a0', leaf: '#3a6a4a', pot: '#3a3048', tier: 2 },
].map(t => ({
  ...t, wd: tone(t.w, 0.55), wl: tone(t.w, 1.3), cd: tone(t.c, 0.75), cl: tone(t.c, 1.35), ad: tone(t.a, 0.7),
  pd: tone(t.p, 0.85), md: tone(t.m, 0.5), ml: tone(t.m, 1.3), gl: tone(t.g, 1.6), leafD: tone(t.leaf, 0.5),
  leafL: tone(t.leaf, 1.35), potD: tone(t.pot, 0.5), potL: tone(t.pot, 1.25),
}));

const BOOKS = ['#d0485a', '#4a7ac8', '#e0b04a', '#4f9a42', '#8a5ab8', '#f4f4f0'];
const SKY = { dawn: '#f4b8a0', day: '#8cc8f4', dusk: '#e8885a', night: '#2a3a6a' };

/* An upright painter draws a view `vw` wide whose floor line is `b`: its front at dir 0, its back at 2, a side at 1 / 3
   (the side towards its back on the right at 1, the left at 3). A side view stands as tall as the front. */
const lean = (dir, x, vw, wide) => (dir === 1 ? x + vw - wide : x);

const FAMILIES = [
  /* ----- flat pieces: painted from above ----- */
  { id: 'bed', name: 'Bed', w: 2, h: 3, price: 600, high: 0.5, side: 'wd', flat(w, h) {
    box(0, 0, w, h, k.w, k.wd);
    R(0, 0, w, 6, k.wd); R(2, 1, w - 4, 2, k.w);
    R(2, 6, w - 4, h - 8, k.p);
    box(5, 8, w - 10, 7, '#ffffff', k.pd);
    R(2, 18, w - 4, h - 20, k.c); R(2, 18, w - 4, 2, k.cl);
    for (let y = 24; y < h - 4; y += 6) R(4, y, w - 8, 1, k.cd);
  } },
  { id: 'rug', name: 'Round rug', w: 3, h: 2, layer: 'rug', price: 300, high: 0.04, side: 'cd', flat(w, h) {
    R(2, 0, w - 4, h, k.c); R(0, 2, w, h - 4, k.c);
    R(3, 2, w - 6, h - 4, k.a); R(5, 4, w - 10, h - 8, k.c);
    for (let x = 8; x < w - 8; x += 6) R(x, h / 2 - 1, 2, 2, k.p);
  } },
  { id: 'mat', name: 'Square mat', w: 2, h: 2, layer: 'rug', price: 250, high: 0.04, side: 'cd', flat(w, h) {
    R(0, 0, w, h, k.cd); R(2, 2, w - 4, h - 4, k.a); R(4, 4, w - 8, h - 8, k.c);
    for (let i = 0; i < 6; i++) R(w / 2 - i, h / 2 - 6 + i, i * 2, 1, k.p), R(w / 2 - i, h / 2 + 5 - i, i * 2, 1, k.p);
    for (let x = 1; x < w; x += 3) { R(x, 0, 1, 1, k.p); R(x, h - 1, 1, 1, k.p); }
  } },
  { id: 'table', name: 'Table', w: 2, h: 2, price: 400, high: 0.55, side: 'wd', flat(w, h) {
    box(1, 1, w - 2, h - 2, k.w, k.wd);
    R(3, 3, w - 6, h - 6, k.p);
    for (let i = 3; i < w - 3; i += 4) { R(i, 3, 2, 2, k.c); R(i, h - 5, 2, 2, k.c); }
    box(w / 2 - 3, h / 2 - 3, 6, 6, k.a, k.ad);
  } },
  { id: 'endtable', name: 'Side table', w: 1, h: 1, price: 200, high: 0.55, side: 'wd', flat() {
    R(3, 1, 10, 14, k.wd); R(1, 3, 14, 10, k.wd);
    R(4, 2, 8, 12, k.w); R(2, 4, 12, 8, k.w); R(4, 3, 6, 2, k.wl);
    box(6, 6, 4, 4, k.a, k.ad);
  } },
  { id: 'cushion', name: 'Ball cushion', w: 1, h: 1, price: 150, high: 0.22, side: 'md', flat() {
    R(3, 1, 10, 14, k.md); R(1, 3, 14, 10, k.md);
    R(4, 2, 8, 6, k.c === '#f4f4f0' ? k.w : k.c); R(2, 4, 12, 4, k.c === '#f4f4f0' ? k.w : k.c);
    R(4, 8, 8, 6, k.p); R(2, 8, 12, 4, k.p);
    R(2, 7, 12, 2, k.md); box(6, 6, 4, 4, k.p, k.md);
  } },

  /* ----- upright pieces: stand up out of their tiles ----- */
  { id: 'chair', name: 'Chair', w: 1, h: 1, price: 180, draw(x, b, vw, dir) {
    const y = b - 16;
    const back = { 0: [x + 3, y - 8, 10, 12], 2: [x + 3, y + 2, 10, 12], 1: [x + 11, y - 6, 3, 16], 3: [x + 2, y - 6, 3, 16] }[dir];
    if (dir !== 2) box(...back, k.w, k.wd);
    R(x + 3, y + 12, 2, 4, k.wd); R(x + 11, y + 12, 2, 4, k.wd);
    box(x + 2, y + 4, 12, 9, k.wl, k.wd);
    R(x + 3, y + 5, 10, 2, k.c);
    if (dir === 2) box(...back, k.w, k.wd);
  } },
  { id: 'stool', name: 'Stool', w: 1, h: 1, price: 120, draw(x, b) {
    R(x + 4, b - 9, 2, 9, k.wd); R(x + 10, b - 9, 2, 9, k.wd); R(x + 5, b - 4, 6, 1, k.wd);
    box(x + 2, b - 13, 12, 5, k.c, k.cd); R(x + 3, b - 12, 10, 1, k.cl);
  } },
  { id: 'sofa', name: 'Sofa', w: 2, h: 1, price: 700, draw(x, b, vw, dir) {
    if (dir % 2) {
      const r = lean(dir, x, vw, 6);
      R(x + 2, b - 3, 2, 3, k.wd); R(x + 12, b - 3, 2, 3, k.wd);
      box(x + 1, b - 12, 14, 9, k.c, k.cd);
      box(r, b - 20, 6, 17, k.c, k.cd); R(r + 1, b - 19, 4, 2, k.cl);
      box(x + 3, b - 15, 10, 5, k.cd, k.md);
      return;
    }
    R(x + 3, b - 3, 2, 3, k.wd); R(x + vw - 5, b - 3, 2, 3, k.wd);
    if (dir === 2) { box(x + 1, b - 22, vw - 2, 19, k.cd, k.md); R(x + 3, b - 20, vw - 6, 1, k.c); return; }
    box(x + 3, b - 22, vw - 6, 12, k.c, k.cd); R(x + 4, b - 21, vw - 8, 2, k.cl);
    R(x + vw / 2, b - 21, 1, 10, k.cd);
    box(x + 1, b - 12, vw - 2, 9, k.cl, k.cd); R(x + vw / 2, b - 11, 1, 7, k.c);
    box(x, b - 16, 5, 13, k.c, k.cd); box(x + vw - 5, b - 16, 5, 13, k.c, k.cd);
    R(x + 1, b - 15, 3, 2, k.cl); R(x + vw - 4, b - 15, 3, 2, k.cl);
  } },
  { id: 'armchair', name: 'Armchair', w: 1, h: 1, price: 400, draw(x, b, vw, dir) {
    R(x + 2, b - 3, 2, 3, k.wd); R(x + 12, b - 3, 2, 3, k.wd);
    if (dir % 2) {
      const r = lean(dir, x, vw, 5);
      box(x + 1, b - 12, 14, 9, k.c, k.cd);
      box(r, b - 21, 5, 18, k.c, k.cd); R(r + 1, b - 20, 3, 2, k.cl);
      return;
    }
    if (dir === 2) { box(x + 1, b - 22, 14, 19, k.cd, k.md); return; }
    box(x + 3, b - 22, 10, 12, k.c, k.cd); R(x + 4, b - 21, 8, 2, k.cl);
    box(x + 2, b - 12, 12, 9, k.cl, k.cd);
    box(x, b - 15, 4, 12, k.c, k.cd); box(x + 12, b - 15, 4, 12, k.c, k.cd);
    R(x + 7, b - 18, 2, 2, k.a);
  } },
  { id: 'lamp', name: 'Lamp', w: 1, h: 1, price: 250, glow: ['g', 'gl'], draw(x, b) {
    const y = b - 16;
    box(x + 4, y + 11, 8, 4, k.m, k.md);
    R(x + 7, y - 2, 2, 13, k.md);
    box(x + 2, y - 12, 12, 10, k.g, k.ad); R(x + 3, y - 11, 10, 2, k.gl);
  } },
  { id: 'floorlamp', name: 'Floor lamp', w: 1, h: 1, price: 350, glow: ['g', 'gl'], draw(x, b) {
    box(x + 3, b - 3, 10, 3, k.m, k.md);
    R(x + 7, b - 30, 2, 27, k.md); R(x + 8, b - 30, 1, 27, k.m);
    R(x + 4, b - 40, 8, 1, k.ad); R(x + 3, b - 39, 10, 8, k.ad);
    R(x + 4, b - 39, 8, 7, k.g); R(x + 5, b - 38, 6, 2, k.gl);
  } },
  { id: 'plant', name: 'Potted plant', w: 1, h: 1, price: 200, draw(x, b) {
    const y = b - 16;
    box(x + 4, y + 7, 8, 8, k.pot, k.potD); R(x + 4, y + 7, 8, 2, k.potL);
    box(x + 1, y - 4, 7, 9, k.leaf, k.leafD); box(x + 8, y - 6, 7, 9, k.leaf, k.leafD); box(x + 4, y - 11, 8, 10, k.leaf, k.leafD);
    R(x + 6, y - 9, 2, 3, k.leafL); R(x + 10, y - 4, 2, 3, k.leafL); R(x + 3, y - 2, 2, 3, k.leafL);
  } },
  { id: 'palm', name: 'Big plant', w: 1, h: 1, price: 450, draw(x, b) {
    box(x + 3, b - 10, 10, 10, k.pot, k.potD); R(x + 3, b - 10, 10, 2, k.potL);
    R(x + 7, b - 30, 2, 20, k.wd); for (let y = b - 28; y < b - 10; y += 4) R(x + 7, y, 2, 1, k.w);
    const frond = (dx, dy, w, h) => { box(x + dx, b + dy, w, h, k.leaf, k.leafD); R(x + dx + 1, b + dy + 1, w - 2, 1, k.leafL); };
    frond(0, -34, 8, 5); frond(8, -36, 8, 5); frond(1, -29, 6, 7); frond(9, -30, 6, 7); frond(5, -40, 6, 6);
  } },
  { id: 'shelf', name: 'Bookshelf', w: 2, h: 1, price: 550, solid: true, draw(x, b, vw, dir) {
    const y = b - 16;
    if (dir % 2) {
      box(x + 2, y - 22, 12, 38, k.w, k.wd);
      R(dir === 1 ? x + 3 : x + 11, y - 21, 2, 36, k.wd);
      return;
    }
    box(x, y - 22, 32, 36, k.w, k.wd);
    if (dir === 2) { for (let i = 0; i < 3; i++) R(x + 2, y - 14 + i * 10, 28, 1, k.wd); return; }
    for (let row = 0; row < 3; row++) {
      const top = y - 20 + row * 11;
      R(x + 2, top, 28, 10, tone(k.wd, 0.8));
      let bx = x + 3;
      for (let i = 0; bx < x + 28; i++) {
        const bw = 2 + ((row * 3 + i) % 3);
        R(bx, top + 2 + (i % 2), bw, 8 - (i % 2), (row + i) % 4 === 0 ? k.a : BOOKS[(row + i) % BOOKS.length]);
        bx += bw + 1;
      }
      R(x + 1, top + 10, 30, 1, k.wd);
    }
  } },
  { id: 'dresser', name: 'Dresser', w: 2, h: 1, price: 500, draw(x, b, vw, dir) {
    R(x + 2, b - 2, 2, 2, k.wd); R(x + vw - 4, b - 2, 2, 2, k.wd);
    box(x, b - 24, vw, 22, k.w, k.wd); R(x + 1, b - 23, vw - 2, 2, k.wl);
    if (dir === 2) { R(x + 2, b - 12, vw - 4, 1, k.wd); return; }
    if (dir % 2) { R(dir === 1 ? x + 1 : x + vw - 3, b - 21, 2, 18, k.wd); return; }
    for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
      box(x + 2 + c * 14, b - 20 + r * 9, 14, 8, k.wl, k.wd); R(x + 8 + c * 14, b - 17 + r * 9, 2, 2, k.a);
    }
    box(x + 22, b - 31, 6, 7, k.c, k.cd); R(x + 23, b - 33, 4, 2, k.leaf);
  } },
  { id: 'tv', name: 'TV', w: 2, h: 1, price: 800, draw(x, b, vw, dir) {
    const y = b - 16;
    if (dir % 2) {
      R(x + 6, y + 8, 4, 8, k.md);
      box(x + 3, y - 10, 10, 20, k.m, k.md);
      R(dir === 1 ? x + 3 : x + 11, y - 9, 2, 18, '#2a3a5a');
      return;
    }
    R(x + 13, y + 8, 6, 6, k.md); R(x + 9, y + 13, 14, 2, k.md);
    box(x + 1, y - 12, 30, 22, k.m, k.md);
    if (dir === 2) { for (let i = 0; i < 4; i++) R(x + 8, y - 6 + i * 3, 16, 1, k.md); return; }
    R(x + 3, y - 10, 26, 16, '#2a4a8a'); R(x + 5, y - 8, 6, 2, '#a8d8f8'); R(x + 5, y - 6, 2, 3, '#a8d8f8');
    R(x + 24, y + 7, 2, 2, k.a === k.m ? '#e04848' : k.a); R(x + 20, y + 7, 2, 2, k.ml);
  } },
  { id: 'desk', name: 'Desk', w: 2, h: 1, price: 450, draw(x, b, vw, dir) {
    if (dir % 2) {
      R(x + 2, b - 14, 2, 14, k.wd); R(x + 12, b - 14, 2, 14, k.wd);
      box(x, b - 17, vw, 4, k.wl, k.wd);
      return;
    }
    R(x + 2, b - 14, 2, 14, k.wd);
    box(x + vw - 12, b - 14, 11, 14, k.w, k.wd);
    if (dir === 0) { box(x + vw - 11, b - 12, 9, 5, k.wl, k.wd); R(x + vw - 7, b - 10, 2, 1, k.a); box(x + vw - 11, b - 6, 9, 5, k.wl, k.wd); R(x + vw - 7, b - 4, 2, 1, k.a); }
    box(x, b - 17, vw, 4, k.wl, k.wd);
    if (dir === 0) { box(x + 4, b - 25, 8, 8, k.p, k.pd); R(x + 5, b - 24, 6, 1, k.c); R(x + 5, b - 22, 5, 1, k.pd); box(x + 15, b - 21, 4, 4, k.a, k.ad); }
  } },
  { id: 'wardrobe', name: 'Wardrobe', w: 2, h: 1, price: 700, draw(x, b, vw, dir) {
    R(x + 2, b - 2, 3, 2, k.wd); R(x + vw - 5, b - 2, 3, 2, k.wd);
    box(x, b - 40, vw, 38, k.w, k.wd); R(x, b - 40, vw, 3, k.wd); R(x + 1, b - 37, vw - 2, 1, k.wl);
    if (dir % 2 || dir === 2) return;
    box(x + 2, b - 35, 13, 30, k.wl, k.wd); box(x + 17, b - 35, 13, 30, k.wl, k.wd);
    R(x + 4, b - 32, 9, 10, k.w); R(x + 19, b - 32, 9, 10, k.w);
    R(x + 13, b - 22, 1, 4, k.a); R(x + 18, b - 22, 1, 4, k.a);
  } },
  { id: 'vase', name: 'Flower vase', w: 1, h: 1, price: 150, draw(x, b) {
    box(x + 4, b - 12, 8, 12, k.c, k.cd); R(x + 5, b - 11, 2, 9, k.cl); R(x + 4, b - 7, 8, 2, k.a);
    box(x + 6, b - 14, 4, 3, k.c, k.cd);
    R(x + 7, b - 20, 1, 6, k.leaf); R(x + 9, b - 19, 1, 5, k.leaf); R(x + 5, b - 18, 1, 4, k.leaf);
    const bloom = (dx, dy, c) => { R(x + dx - 1, b + dy, 3, 1, c); R(x + dx, b + dy - 1, 1, 3, c); R(x + dx, b + dy, 1, 1, '#f8e070'); };
    bloom(7, -21, k.a === k.p ? '#e04848' : k.a); bloom(10, -20, k.p); bloom(4, -19, k.cl);
  } },
  { id: 'crate', name: 'Crate', w: 1, h: 1, price: 100, draw(x, b) {
    box(x + 1, b - 14, 14, 14, k.w, k.wd);
    R(x + 2, b - 9, 12, 1, k.wd); R(x + 2, b - 5, 12, 1, k.wd);
    for (let i = 0; i < 12; i++) R(x + 2 + i, b - 13 + i, 1, 1, k.wl);
    R(x + 6, b - 12, 4, 2, k.a);
  } },

  /* ----- wall pieces: hung on the wall strip ----- */
  { id: 'window', name: 'Window', w: 2, h: 1, layer: 'wall', price: 500, wall(x) {
    const t = timeOfDay();
    box(x + 2, 8, 28, 28, SKY[t], k.wd);
    R(x + 3, 26, 26, 9, t === 'night' ? '#1a2a4a' : '#6cbf58');
    R(x + 15, 9, 2, 26, k.w); R(x + 3, 21, 26, 2, k.w);
    R(x + 1, 35, 30, 3, k.wl);
  } },
  { id: 'poster', name: 'Poster', w: 1, h: 1, layer: 'wall', price: 100, wall(x) {
    box(x + 2, 10, 12, 18, k.p, k.md);
    R(x + 4, 13, 8, 6, k.c); R(x + 6, 15, 4, 2, k.a); R(x + 4, 21, 8, 1, k.md); R(x + 4, 23, 6, 1, k.md);
  } },
  { id: 'clock', name: 'Clock', w: 1, h: 1, layer: 'wall', price: 200, wall(x) {
    R(x + 4, 10, 8, 10, k.wd); R(x + 2, 12, 12, 6, k.wd);
    R(x + 5, 11, 6, 8, k.p); R(x + 3, 13, 10, 4, k.p);
    R(x + 7, 12, 2, 4, k.md); R(x + 8, 15, 3, 1, k.md); R(x + 7, 19, 2, 3, k.a);
  } },
  { id: 'painting', name: 'Painting', w: 2, h: 1, layer: 'wall', price: 400, wall(x) {
    box(x + 3, 9, 26, 22, k.a, k.ad); R(x + 4, 10, 24, 1, tone(k.a, 1.3));
    R(x + 5, 11, 22, 18, k.cl); R(x + 5, 21, 22, 8, k.leaf); R(x + 5, 21, 22, 1, k.leafL);
    R(x + 9, 14, 4, 4, k.p); R(x + 17, 17, 8, 4, k.c); R(x + 19, 15, 4, 2, k.c);
  } },
];

const NOUN = { cushion: 'Cushion' };   // a themed piece's name drops the classic one's adjective

/** The present a new room starts with: no theme, never sold. */
const GIFT = { id: 'gift', name: 'Present', w: 1, h: 1, price: 0, draw(x, b) {
  box(x + 1, b - 14, 14, 14, '#d84848', '#7a1e24'); R(x + 2, b - 13, 12, 2, '#f07070');
  R(x + 7, b - 14, 2, 14, '#f8d030'); R(x + 1, b - 9, 14, 2, '#f8d030');
  box(x, b - 17, 16, 4, '#e85858', '#7a1e24');
  R(x + 7, b - 17, 2, 4, '#f8d030');
  R(x + 3, b - 21, 4, 3, '#f8d030'); R(x + 9, b - 21, 4, 3, '#f8d030'); R(x + 4, b - 20, 2, 1, '#fff4a0'); R(x + 10, b - 20, 2, 1, '#fff4a0');
  R(x + 7, b - 19, 2, 2, '#e0a818');
} };

/** One piece: a kind in a theme, its painters bound to the theme's palette. */
function makePiece(fam, theme) {
  const pal = theme || THEMES[0];
  const bind = (fn) => fn && ((ctx, ...args) => { const keep = [g, k]; g = ctx; k = pal; try { fn(...args); } finally { [g, k] = keep; } });
  const p = {
    name: theme ? `${theme.name} ${fam.id === 'tv' ? 'TV' : (NOUN[fam.id] || fam.name).toLowerCase()}` : fam.name,
    fam: fam.id, theme: pal.id, w: fam.w, h: fam.h, price: Math.round(fam.price * (theme ? [1, 1, 1.4, 2][theme.tier] : 1) / 10) * 10,
  };
  if (fam.layer) p.layer = fam.layer;
  if (fam.flat) { p.flat = bind((w, h) => fam.flat(w, h)); p.high = fam.high; p.side = pal[fam.side]; }
  if (fam.wall) p.wall = bind((x) => fam.wall(x));
  if (fam.draw) p.upright = bind((x, y, dir) => {
    const [fw, fh] = dir % 2 ? [fam.h, fam.w] : [fam.w, fam.h];
    fam.draw(x, y + fh * T, fw * T, dir);
  });
  if (fam.solid) Object.assign(p, { solid: true, wood: pal.w, woodLit: pal.wl });
  if (fam.glow) p.glow = fam.glow.map(key => pal[key]);
  if (fam.id === 'window') p.glow = Object.values(SKY);
  return p;
}

const PIECES = {};
for (const fam of FAMILIES) for (const theme of THEMES) {
  PIECES[theme.id === 'classic' ? fam.id : `${fam.id}-${theme.id}`] = makePiece(fam, theme.id === 'classic' ? null : theme);
}
/** Every catalogue id, kind by kind (the present isn't one). */
const CATALOGUE = Object.keys(PIECES);
PIECES.gift = makePiece(GIFT, null);
PIECES.gift.gift = true;

export { PIECES, CATALOGUE, THEMES, FAMILIES };
