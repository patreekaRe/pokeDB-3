/* base-furniture-season2.js  -  three seasonal sets (2026-10-16, the user's pick from docs/furniture-expansion.md:
   seasonal sets, Animal Crossing's way), each sold only in its holiday's window (js/data/holidays.js): Wedding season
   in June (an arch, a cake, bowed chairs, a gown on a form...), the Summer festival in July and August (shaved ice,
   Magikarp scooping, a mikoshi, sparklers; no stalls or yukata, the Festival and Hot Spring shelves have those) and the
   Lantern Festival in September (Lantern Village's own: sky lanterns, a moon gate, a dragon lantern, Chandelure and
   Litwick). One fixed colour set each, `solo`. Their models are js/base-models-s.js, which reads the colours and the
   shared layouts (HEARTS, DRAGON) from here. */

import { R, P, disc, oval, ovalShade, cyl, panel, wood, leaf, sphere, glass, tri, floorShadow, hash, ctx, sh } from './base-paint.js';

// wedding
export const WHITE = '#f8f6f0', IVORY = '#efe4cc', BLUSH = '#f4b8c8', ROSE = '#e46a88', GOLD = '#e0b85a', SAGE = '#8fae7e',
  SILVER = '#c8ccd4', CHAPEL = '#7a9ac8', BOTTLE = '#2e5a3a', GOWNG = '#58b46a', GOWNR = '#e04a58', FORM = '#b88a5e';
// summer festival
export const CEDAR = '#b0784a', VERMIL = '#d8452e', INDIGO = '#2a3a78', BAMBOO = '#c8b468', KARP = '#ec6a34', TUB = '#3a8ad8',
  WATER = '#78c8f0', IRON = '#3a3a42', MELON = '#3a8a3a', MELOND = '#1e5226', PIG = '#c8703e', TEAL = '#5ac8c4', SPARK = '#ffd060';
// lantern festival
export const LRED = '#d8382e', LACQ = '#2e1e1c', RUBY = '#a8302a', PAPER = '#f8d890', LGLOW = '#ffcf70', PURPLE = '#a868f8',
  LILAC = '#e0c8ff', STONE = '#9a9aa6', HINOKI = '#e0b880', JADE = '#7ab8a0', TILE = '#2a7a5a', PLASTER = '#f0ece0',
  DARKW = '#4a3428', WAX = '#f4f4f8', CRUST = '#c8883a', PINK = '#f890b8', PALEPINK = '#ffd0e0', BLOSSOM = '#f8c8d8';
const INK = '#2a2430';

/* ----- painters ----- */
const line = (x0, y0, x1, y1, c, w = 1) => {
  const g = ctx(); g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
};
const path = (pts, c, w = 1) => {
  const g = ctx(); g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); pts.forEach(([a, b], i) => (i ? g.lineTo(a, b) : g.moveTo(a, b))); g.stroke();
};
const poly = (pts, c) => {
  const g = ctx(); g.fillStyle = c; g.beginPath(); pts.forEach(([a, b], i) => (i ? g.lineTo(a, b) : g.moveTo(a, b))); g.closePath(); g.fill();
};
const arcS = (cx, cy, r, a0, a1, c, w = 1) => {
  const g = ctx(); g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.arc(cx, cy, r, a0, a1); g.stroke();
};
const words = (text, x, y, size, col, w) => {
  const g = ctx(); g.font = `bold ${size}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = col; g.fillText(text, x, y, w);
};
/** A heart `s` wide round (cx, cy), the same curve as js/base-models-s.js's. */
export function heartPath(g, cx, cy, s) {
  g.beginPath(); g.moveTo(cx, cy + 0.45 * s);
  g.bezierCurveTo(cx - 0.1 * s, cy + 0.3 * s, cx - 0.5 * s, cy + 0.1 * s, cx - 0.5 * s, cy - 0.12 * s);
  g.bezierCurveTo(cx - 0.5 * s, cy - 0.4 * s, cx - 0.15 * s, cy - 0.5 * s, cx, cy - 0.25 * s);
  g.bezierCurveTo(cx + 0.15 * s, cy - 0.5 * s, cx + 0.5 * s, cy - 0.4 * s, cx + 0.5 * s, cy - 0.12 * s);
  g.bezierCurveTo(cx + 0.5 * s, cy + 0.1 * s, cx + 0.1 * s, cy + 0.3 * s, cx, cy + 0.45 * s);
  g.closePath();
}
const heart = (cx, cy, s, c) => {
  const g = ctx(); heartPath(g, cx, cy, s); g.fillStyle = c; g.fill();
  oval(cx - s * 0.24, cy - s * 0.2, s * 0.1, s * 0.07, sh(c, 2));
};
const rose = (cx, cy, r, c) => {
  disc(cx, cy, r, sh(c, -1)); disc(cx - r * 0.12, cy - r * 0.12, r * 0.78, c);
  arcS(cx, cy, r * 0.45, 0.4, 4.4, sh(c, 1), Math.max(0.4, r * 0.25)); P(cx - 0.5, cy - 0.5, sh(c, -1));
};
const bow = (cx, cy, c, s = 1) => {
  for (const sx of [-1, 1]) { oval(cx + sx * 3 * s, cy, 3 * s, 2 * s, c); oval(cx + sx * 3 * s, cy, 1.6 * s, 0.9 * s, sh(c, -1)); }
  line(cx - 0.5, cy + 1, cx - 2.5 * s, cy + 7 * s, c, 1.4 * s); line(cx + 0.5, cy + 1, cx + 2.5 * s, cy + 7 * s, c, 1.4 * s);
  disc(cx, cy, 1.5 * s, sh(c, -1));
};
/** A round silk lantern, its top cap at `top`, `rx` x `ry` round, gold caps and a tassel. */
const lantern = (cx, top, rx, ry, c, tassel = 1) => {
  R(cx - rx * 0.55, top, rx * 1.1, 2, GOLD);
  ovalShade(cx, top + 1.5 + ry, rx, ry, c);
  const g = ctx(); g.strokeStyle = sh(c, -1); g.lineWidth = 0.6;
  for (const f of [0.5, 0]) { g.beginPath(); g.ellipse(cx, top + 1.5 + ry, Math.max(0.3, rx * f), ry, 0, 0, Math.PI * 2); g.stroke(); }
  oval(cx - rx * 0.35, top + 1.5 + ry * 0.6, rx * 0.25, ry * 0.3, sh(c, 2));
  R(cx - rx * 0.55, top + 1 + ry * 2, rx * 1.1, 2, GOLD);
  if (tassel) R(cx - 0.7, top + 3 + ry * 2, 1.4, ry * 0.9, sh(c, -1));
};
const flame = (cx, cy, rx, ry, c, core) => { oval(cx, cy, rx, ry, c); oval(cx, cy + ry * 0.3, rx * 0.5, ry * 0.5, core); };

/* ----- shared layouts: the models build the same things in the same places ----- */
/** The heart balloon arch's balloons: [painted x, height, colour]. */
export const HEARTS = (() => {
  const out = [], cols = [ROSE, WHITE, BLUSH, '#d83a4a'];
  for (let j = 12; j <= 47; j += 7) out.push([7, j]);
  for (let a = 162; a >= 18; a -= 18) out.push([32 + Math.cos(a * Math.PI / 180) * 25, 50 + Math.sin(a * Math.PI / 180) * 25]);
  for (let j = 47; j >= 12; j -= 7) out.push([57, j]);
  return out.map(([i, j], n) => [i, j, cols[n % 4]]);
})();
/** The dragon lantern's body, head end first: [painted x, height, radius]. */
export const DRAGON = Array.from({ length: 8 }, (_, n) => [17 + n * 6, 52 + Math.sin(n * 0.9) * 6, 6 - Math.max(0, n - 4) * 0.8]);

/* ----- wedding ----- */
const WEDDING = [
  // a white arch, flowers along its curve and cascading down its posts, a blush bow on each post
  { id: 'weddingarch', name: 'Flower wedding arch', w: 2, h: 1, price: 1200, draw(x, b, vw) {
    floorShadow(x, b, vw);
    for (const px of [1, 53]) panel(x + px, b - 5, 10, 5, IVORY);
    for (const px of [4, 56]) { cyl(x + px, b - 62, 4, 57, WHITE); bow(x + px + 2, b - 34, BLUSH, 0.85); }
    arcS(x + 32, b - 62, 26, Math.PI, Math.PI * 2, WHITE, 4);
    arcS(x + 32, b - 62, 27.6, Math.PI, Math.PI * 2, sh(WHITE, -1), 0.8);
    for (let i = 0; i <= 12; i++) { const a = Math.PI + i / 12 * Math.PI; leaf(x + 32 + Math.cos(a) * 26, b - 62 + Math.sin(a) * 26 - 1, 2.6, 1.6, SAGE, Math.cos(a)); }
    [[1.08, 3, ROSE], [1.2, 2.5, BLUSH], [1.32, 3, WHITE], [1.42, 2.5, BLUSH], [1.5, 3.5, ROSE], [1.58, 2.5, WHITE], [1.68, 3, BLUSH], [1.8, 2.5, ROSE], [1.92, 3, WHITE]]
      .forEach(([a, r, c]) => rose(x + 32 + Math.cos(a * Math.PI) * 26, b - 62 + Math.sin(a * Math.PI) * 26, r, c));
    for (const px of [6, 58]) for (const [j, c] of [[-56, BLUSH], [-49, WHITE], [-43, ROSE]]) { leaf(x + px - 2, b + j + 2, 1.6, 2.4, SAGE); rose(x + px, b + j, 2.2, c); }
  } },
  // three tiers on a cake table, blush ribbon round each, roses climbing them, a gold heart on top
  { id: 'weddingcake', name: 'Tiered wedding cake', w: 1, h: 1, price: 700, draw(x, b) {
    floorShadow(x + 2, b, 28);
    poly([[x + 5, b - 30], [x + 27, b - 30], [x + 29, b], [x + 3, b]], IVORY);
    for (const i of [8, 13, 19, 24]) line(x + i, b - 27, x + i + (i - 16) * 0.12, b - 1, sh(IVORY, -1), 0.7);
    R(x + 4, b - 31, 24, 2, WHITE);
    for (let i = 0; i < 4; i++) arcS(x + 7 + i * 6, b - 30, 3, 0, Math.PI, BLUSH, 1);
    panel(x + 7, b - 42, 18, 11, WHITE); panel(x + 10, b - 52, 12, 10, WHITE); panel(x + 12.5, b - 60, 7, 8, WHITE);
    for (const [x0, w, y] of [[7, 18, -32], [10, 12, -43], [12.5, 7, -53]]) {
      for (let i = 1; i < w; i += 2) P(x + x0 + i, b + y, IVORY);
      R(x + x0, b + y - 5, w, 1.5, BLUSH);
    }
    rose(x + 21, b - 45, 2, ROSE); rose(x + 11, b - 38, 1.8, ROSE); rose(x + 18, b - 55, 1.5, BLUSH); rose(x + 14, b - 36, 1.4, BLUSH);
    leaf(x + 23, b - 43, 1.2, 1.8, SAGE, 0.6); leaf(x + 9, b - 36, 1.2, 1.8, SAGE, -0.6);
    R(x + 15.5, b - 62, 1, 3, GOLD); heart(x + 16, b - 65, 7, GOLD);
  } },
  // a white Chiavari chair, a blush sash and bow round its back
  { id: 'bowchair', name: 'Bow-back wedding chair', w: 1, h: 1, price: 300, draw(x, b) {
    floorShadow(x, b, 32);
    for (const px of [7, 22.5]) cyl(x + px, b - 52, 2.5, 52, WHITE);
    R(x + 7, b - 52, 18, 3, WHITE); R(x + 7, b - 44, 18, 1.6, sh(WHITE, -1));
    for (const px of [12, 15.5, 19]) R(x + px, b - 49, 1.5, 24, sh(WHITE, -1));
    R(x + 6, b - 9, 20, 1.5, sh(WHITE, -1));
    for (const px of [5, 24]) cyl(x + px, b - 18, 3, 18, WHITE);
    wood(x + 4, b - 22, 24, 4, WHITE); cushion0(x + 5, b - 25, 22, 4);
    R(x + 7, b - 36, 18, 3.5, BLUSH); R(x + 7, b - 36, 18, 1, sh(BLUSH, 1));
    bow(x + 16, b - 34, BLUSH, 1.2);
  } },
  // a white runner for the aisle, gold-edged, rose petals scattered down it
  { id: 'aislerunner', name: 'Petal aisle runner', w: 1, h: 3, layer: 'rug', price: 300, high: 0.04, side: 'p', flat(w, h) {
    R(0, 0, w, h, sh(WHITE, -1)); R(2, 0, w - 4, h, WHITE);
    for (const i of [3, w - 4]) R(i, 0, 1, h, GOLD);
    for (let j = 2; j < h; j += 4) { P(5, j, IVORY); P(w - 6, j, IVORY); }
    for (let n = 0; n < 46; n++) {
      const px = 6 + hash(n, 1) * (w - 12), py = 2 + hash(n, 2) * (h - 4), c = [ROSE, BLUSH, '#ffffff', '#d83a4a'][n % 4];
      oval(px, py, 1.6, 1, c); P(px - 0.5, py - 0.5, sh(c, 1));
    }
    heart(w / 2, 8, 9, ROSE); heart(w / 2, h - 8, 9, ROSE);
  } },
  // a slim gold stand, a round bouquet of roses in its cup, ribbons trailing
  { id: 'bouquetstand', name: 'Bouquet stand', w: 1, h: 1, price: 350, draw(x, b) {
    floorShadow(x + 6, b, 20);
    ovalShade(x + 16, b - 2.5, 7, 2.5, GOLD); cyl(x + 15, b - 48, 2, 46, GOLD); ovalShade(x + 16, b - 24, 2.2, 1.6, GOLD);
    line(x + 15, b - 50, x + 12, b - 36, BLUSH, 1.4); line(x + 17, b - 50, x + 20, b - 38, BLUSH, 1.4);
    poly([[x + 10, b - 54], [x + 22, b - 54], [x + 19, b - 48], [x + 13, b - 48]], GOLD); R(x + 9.5, b - 55, 13, 1.5, sh(GOLD, 1));
    disc(x + 16, b - 63, 10, sh(SAGE, -1));
    for (const [i, j] of [[8, -57], [24, -57], [10, -66], [22, -66]]) leaf(x + i, b + j, 2, 3, SAGE, (i - 16) / 8);
    [[12, -59, ROSE], [16, -57, WHITE], [20, -60, BLUSH], [13, -65, BLUSH], [19, -66, ROSE], [16, -70, WHITE], [16, -63, ROSE]].forEach(([i, j, c]) => rose(x + i, b + j, 3, c));
    bow(x + 16, b - 51, BLUSH, 0.8);
  } },
  // a dress form wearing a gown after Gardevoir: white, its skirt open on green, a red fin at the chest
  { id: 'gardevoirgown', name: 'Gardevoir gown', w: 1, h: 1, price: 900, draw(x, b) {
    floorShadow(x + 2, b, 28);
    poly([[x + 11, b - 40], [x + 8, b - 26], [x + 4, b - 10], [x + 3, b - 1], [x + 29, b - 1], [x + 28, b - 10], [x + 24, b - 26], [x + 21, b - 40]], WHITE);
    for (const i of [7, 11, 21, 25]) line(x + 16 + (i - 16) * 0.35, b - 38, x + i, b - 2, sh(WHITE, -1), 0.8);
    poly([[x + 16, b - 38], [x + 21, b - 1], [x + 11, b - 1]], GOWNG); line(x + 16, b - 38, x + 11, b - 1, sh(GOWNG, 1), 0.8);
    R(x + 3, b - 2, 26, 2, sh(WHITE, -1));
    cyl(x + 14.5, b - 65, 3, 8, FORM); ovalShade(x + 16, b - 65, 3.5, 1.5, sh(FORM, -1));
    oval(x + 16, b - 57, 7, 2.5, WHITE); panel(x + 11, b - 57, 10, 17, WHITE);
    for (const sx of [-1, 1]) oval(x + 16 + sx * 2.5, b - 51, 2.2, 2.6, sh(WHITE, -1));
    R(x + 10.5, b - 42, 11, 3, GOWNG); R(x + 10.5, b - 42, 11, 1, sh(GOWNG, 1));
    poly([[x + 16, b - 57], [x + 19, b - 52], [x + 16, b - 45], [x + 13, b - 52]], GOWNR); line(x + 15.5, b - 55, x + 14, b - 52, sh(GOWNR, 2), 0.8);
  } },
  // a little white belfry: a gold bell under a blue roof, a bow on the bell, its rope down the side
  { id: 'chapelbell', name: 'Chapel bell', w: 1, h: 1, price: 650, draw(x, b) {
    floorShadow(x, b, 32);
    panel(x + 1, b - 5, 30, 5, IVORY);
    wood(x + 3, b - 82, 4, 77, WHITE, 'y'); wood(x + 25, b - 82, 4, 77, WHITE, 'y');
    poly([[x, b - 84], [x + 32, b - 84], [x + 16, b - 94]], CHAPEL); R(x, b - 85, 32, 1.5, sh(CHAPEL, -1));
    wood(x + 1, b - 84, 30, 4, WHITE);
    R(x + 15, b - 80, 2, 4, IRON);
    poly([[x + 13, b - 77], [x + 19, b - 77], [x + 21, b - 72], [x + 22, b - 60], [x + 25, b - 52], [x + 25, b - 50], [x + 7, b - 50], [x + 7, b - 52], [x + 10, b - 60], [x + 11, b - 72]], GOLD);
    R(x + 12, b - 72, 2, 18, sh(GOLD, 1)); R(x + 19, b - 72, 2, 18, sh(GOLD, -1)); R(x + 7, b - 52, 18, 2, sh(GOLD, -1));
    disc(x + 16, b - 48, 2, sh(GOLD, -1));
    bow(x + 16, b - 76, BLUSH, 0.9);
    line(x + 23, b - 80, x + 23, b - 24, IVORY, 1); R(x + 22, b - 25, 2, 5, BLUSH);
  } },
  // a white podium, its sloped top holding an open guest book and a quill, a heart on its front
  { id: 'guestbook', name: 'Guest book podium', w: 1, h: 1, price: 450, draw(x, b) {
    floorShadow(x + 3, b, 26);
    panel(x + 6, b - 4, 20, 4, WHITE);
    panel(x + 10, b - 38, 12, 34, WHITE);
    for (const [a, c0, w0, h0] of [[12, 34, 8, 1], [12, 9, 8, 1]]) R(x + a, b - c0, w0, h0, GOLD);
    R(x + 12, b - 34, 1, 26, GOLD); R(x + 19, b - 34, 1, 26, GOLD);
    heart(x + 16, b - 22, 6, BLUSH);
    panel(x + 3, b - 45, 26, 7, WHITE); R(x + 3, b - 39.5, 26, 1.5, GOLD);
    R(x + 5, b - 46, 22, 1.5, ROSE);
    for (const px of [6, 16]) { R(x + px, b - 50, 10, 5, '#fffef8'); for (let i = 0; i < 3; i++) R(x + px + 1.5, b - 49 + i * 1.4, 7, 0.5, sh(IVORY, -1)); }
    R(x + 15.5, b - 50, 1, 5, sh(IVORY, -1));
    line(x + 24, b - 47, x + 28, b - 60, sh(WHITE, -1), 1); poly([[x + 28, b - 61], [x + 30, b - 55], [x + 26, b - 50]], WHITE);
  } },
  // a gold candelabra of three white tapers, lit, roses and ribbon where its arms meet
  { id: 'weddingcandles', name: 'Wedding candle stand', w: 1, h: 1, price: 450, glow: ['#ffcf60', '#fff4d0'], draw(x, b) {
    floorShadow(x + 4, b, 24);
    ovalShade(x + 16, b - 3, 8, 3, GOLD); R(x + 12, b - 9, 8, 6, GOLD);
    cyl(x + 15, b - 51, 2, 42, GOLD); ovalShade(x + 16, b - 26, 2.4, 1.6, GOLD);
    arcS(x + 11, b - 44, 5, 0, Math.PI, GOLD, 1.6); arcS(x + 21, b - 44, 5, 0, Math.PI, GOLD, 1.6);
    for (const [px, top] of [[6, -47], [26, -47], [16, -51]]) R(x + px - 2.5, b + top, 5, 2, GOLD);
    for (const [px, top, h] of [[6, -60, 13], [26, -60, 13], [16, -68, 17]]) {
      cyl(x + px - 1.5, b + top, 3, h, WHITE); flame(x + px, b + top - 3, 1.5, 2.6, '#ffcf60', '#fff4d0');
    }
    leaf(x + 12, b - 41, 1.4, 2.2, SAGE, -0.6); leaf(x + 20, b - 41, 1.4, 2.2, SAGE, 0.6);
    rose(x + 16, b - 42, 2.4, BLUSH);
    line(x + 15, b - 40, x + 13, b - 30, BLUSH, 1.2); line(x + 17, b - 40, x + 19, b - 31, BLUSH, 1.2);
  } },
  // an arch of heart balloons over two weighted gift boxes
  { id: 'weddingballoons', name: 'Wedding balloon arch', w: 2, h: 1, price: 800, draw(x, b, vw) {
    floorShadow(x, b, vw);
    for (const px of [2, 53]) { panel(x + px, b - 9, 9, 9, WHITE); R(x + px + 3.5, b - 9, 2, 9, ROSE); R(x + px, b - 5.5, 9, 2, ROSE); }
    for (const [i, j, c] of HEARTS) heart(x + i, b - j, 9, c);
  } },
  // a little clothed table: champagne on ice in a silver bucket, two flutes beside it
  { id: 'champagnetable', name: 'Champagne table', w: 1, h: 1, price: 500, draw(x, b) {
    floorShadow(x + 3, b, 26);
    poly([[x + 6, b - 28], [x + 26, b - 28], [x + 28, b], [x + 4, b]], WHITE);
    for (const i of [9, 23]) line(x + i, b - 26, x + i + (i - 16) * 0.15, b - 1, sh(WHITE, -1), 0.7);
    R(x + 5, b - 29, 22, 2, sh(WHITE, 1));
    poly([[x + 13, b - 28], [x + 19, b - 28], [x + 19, b - 14], [x + 16, b - 11], [x + 13, b - 14]], BLUSH);
    cyl(x + 11.5, b - 60, 2, 8, BOTTLE); R(x + 11, b - 61, 3, 4, GOLD); cyl(x + 9.5, b - 52, 6, 8, BOTTLE);
    cyl(x + 7, b - 44, 11, 15, SILVER); R(x + 6.5, b - 45, 12, 1.5, sh(SILVER, 1));
    for (const i of [8, 11, 15, 17]) P(x + i, b - 46, '#e8f8ff');
    for (const px of [6, 18]) disc(x + px, b - 38, 1.2, sh(SILVER, -1));
    for (const px of [21.5, 25]) { glass(x + px, b - 44, 3, 7, '#f0dca0'); R(x + px + 1, b - 37, 1, 6, '#e8f0f4'); R(x + px, b - 31, 3, 1, '#e8f0f4'); }
  } },
];

const WEDDING_WALL = [
  // a garland of roses and leaves sagging between two blush bows, strands of petals hanging from it
  { id: 'petalgarland', name: 'Flower petal garland', w: 2, h: 1, layer: 'wall', price: 300, wall(x) {
    const j = (i) => 14 + Math.sin(Math.max(0, Math.min(58, i - 3)) / 58 * Math.PI) * 10;
    for (const i of [16, 32, 48]) { line(x + i, j(i) + 2, x + i, j(i) + 26, sh(SAGE, -1), 0.6); for (let k = 0; k < 4; k++) oval(x + i + (k % 2 ? 1 : -1), j(i) + 7 + k * 5, 1.6, 1.2, [ROSE, BLUSH][k % 2]); }
    path(Array.from({ length: 30 }, (_, n) => [x + 3 + n * 2, j(3 + n * 2)]), sh(SAGE, -1), 1.5);
    for (let i = 5; i <= 59; i += 3) leaf(x + i, j(i) + 1, 2, 1.3, SAGE, 0.6);
    for (let i = 7, n = 0; i <= 57; i += 5, n++) rose(x + i, j(i), n % 3 ? 2.2 : 2.8, [ROSE, WHITE, BLUSH][n % 3]);
    bow(x + 7, 15, BLUSH, 0.8); bow(x + 57, 15, BLUSH, 0.8);
  } },
  // a gold-framed wall of roses, a warm neon heart lit in the middle of it
  { id: 'photobackdrop', name: 'Wedding flower wall', w: 2, h: 1, layer: 'wall', price: 700, glow: ['#ffd890'], wall(x) {
    R(x + 3, 8, 58, 72, sh(BLUSH, -1));
    for (let r = 0; r < 8; r++) for (let c = 0; c < 10; c++) {
      const i = 7 + c * 5.6 + (r % 2) * 2.8, jj = 13 + r * 9.2;
      if (i > 59) continue;
      leaf(i + 2, jj + 2.5, 1.6, 1, SAGE, 0.6);
      rose(x + i, jj, 2.7, [WHITE, BLUSH, ROSE, IVORY][(r * 3 + c) % 4]);
    }
    const g = ctx();
    heartPath(g, x + 32, 46, 30); g.strokeStyle = 'rgba(255,216,144,0.45)'; g.lineWidth = 4.5; g.stroke();
    heartPath(g, x + 32, 46, 30); g.strokeStyle = '#ffd890'; g.lineWidth = 2; g.stroke();
    panel(x + 1, 6, 62, 4, GOLD); panel(x + 1, 78, 62, 4, GOLD); panel(x + 1, 6, 4, 76, GOLD); panel(x + 59, 6, 4, 76, GOLD);
  } },
];

/* ----- summer festival ----- */
const SUMMER = [
  // a red hand-cranked kakigori machine on a little table: a block of ice over a bowl of strawberry ice, ICE on its flag
  { id: 'shavedice', name: 'Shaved-ice machine', w: 1, h: 1, price: 550, draw(x, b) {
    floorShadow(x, b, 32);
    for (const px of [4, 25]) cyl(x + px, b - 24, 3, 24, CEDAR);
    R(x + 5, b - 8, 22, 2, sh(CEDAR, -1));
    wood(x + 1, b - 27, 30, 3, CEDAR);
    panel(x + 10, b - 23, 12, 10, '#f8f8f4'); for (let i = 0; i < 3; i++) arcS(x + 12 + i * 4, b - 13, 2, Math.PI, Math.PI * 2, '#3a7ad8', 0.8);
    words('ICE', x + 16, b - 19.5, 5, '#d83a4a', 11);
    R(x + 5, b - 29, 22, 2, VERMIL);
    for (const px of [6, 23]) cyl(x + px, b - 62, 3, 33, VERMIL);
    poly([[x + 10, b - 37], [x + 22, b - 37], [x + 20, b - 31], [x + 12, b - 31]], '#bfe6f8');
    oval(x + 16, b - 39, 6, 4.5, '#f8fcff'); oval(x + 16, b - 41.5, 4.6, 2.6, '#e83a4a'); R(x + 19, b - 41, 1, 4, '#e83a4a');
    R(x + 9, b - 49, 14, 2, IRON);
    glass(x + 10, b - 58, 12, 9, '#d0f0ff');
    R(x + 10, b - 61, 12, 2, IRON);
    panel(x + 5, b - 66, 22, 5, VERMIL); R(x + 7, b - 64, 18, 1, GOLD);
    R(x + 15, b - 72, 2, 6, IRON);
    arcS(x + 16, b - 76, 6, 0, Math.PI * 2, IRON, 1.5); line(x + 10, b - 76, x + 22, b - 76, IRON, 1); line(x + 16, b - 82, x + 16, b - 70, IRON, 1);
    R(x + 21, b - 83, 2, 5, CEDAR);
  } },
  // a blue tub of water, Magikarp swimming, one leaping out, paper scoops on its rim
  { id: 'karpscoop', name: 'Magikarp scooping tub', w: 2, h: 1, price: 700, draw(x, b, vw) {
    floorShadow(x, b, vw);
    panel(x + 2, b - 20, 60, 20, TUB);
    for (let i = 0; i < 10; i++) arcS(x + 5 + i * 6, b - 9, 3, Math.PI, Math.PI * 2, sh(TUB, 2), 0.8);
    R(x + 3, b - 21, 58, 1.5, WATER); R(x + 1, b - 22, 62, 3, sh(TUB, 1));
    for (const i of [16, 28]) tri(x + i, b - 26, 4, KARP, 0.8);
    const cx = x + 40, cy = b - 33;
    tri(cx - 1, cy - 9, 5, '#f8d030', 0.9);
    poly([[cx + 5, cy], [cx + 11, cy - 5], [cx + 11, cy + 5]], '#f0f0f0');
    ovalShade(cx, cy, 7, 4.5, KARP); oval(cx - 1, cy + 2, 5, 1.6, '#f8e8d8');
    disc(cx - 3.5, cy - 1, 1.6, '#ffffff'); P(cx - 4, cy - 1.5, INK);
    line(cx - 6, cy + 1, cx - 9, cy + 5, '#f8d030', 0.8);
    for (const [px, tilt] of [[9, 1], [55, -1]]) { arcS(x + px, b - 30, 4, 0, Math.PI * 2, '#f4f4f0', 1.2); disc(x + px, b - 30, 3.3, 'rgba(248,248,240,0.8)'); line(x + px + tilt * 3, b - 27, x + px + tilt * 9, b - 22, VERMIL, 1.4); }
  } },
  // a bamboo frame hung with three glass furin, a paper strip trailing from each
  { id: 'windchimestand', name: 'Wind chime stand', w: 1, h: 1, price: 380, draw(x, b) {
    floorShadow(x, b, 32);
    for (const px of [1, 21]) R(x + px, b - 3, 10, 3, sh(BAMBOO, -1));
    for (const px of [4, 25]) { cyl(x + px, b - 82, 3, 79, BAMBOO); for (const j of [-30, -56]) R(x + px, b + j, 3, 1, sh(BAMBOO, -2)); }
    R(x + 1, b - 85, 30, 3, BAMBOO); R(x + 1, b - 85, 30, 1, sh(BAMBOO, 1));
    [[10, -74, '#bfe6f8', VERMIL], [16, -70, '#f8c8d8', INDIGO], [22, -74, '#d8f0c0', '#e8b830']].forEach(([i, top, tint, strip]) => {
      line(x + i, b - 82, x + i, b + top, INK, 0.5);
      disc(x + i, b + top + 4.5, 4.5, tint); R(x + i - 4.5, b + top + 4.5, 9, 4, tint); R(x + i - 4.5, b + top + 8, 9, 1, sh(tint, -1));
      oval(x + i - 1.5, b + top + 3, 1, 1.5, '#ffffff'); P(x + i + 1, b + top + 5, VERMIL);
      line(x + i, b + top + 9, x + i, b + top + 14, INK, 0.5); R(x + i - 1.5, b + top + 14, 3, 14, strip);
    });
  } },
  // three mortar tubes in a wooden crate, the fuse lit
  { id: 'fireworkmortar', name: 'Firework launcher', w: 1, h: 1, price: 450, glow: ['#ffd060', '#fff4c0'], draw(x, b) {
    floorShadow(x, b, 32);
    [[9.5, -40, VERMIL], [23.5, -42, '#e8b830'], [16.5, -48, INDIGO]].forEach(([cx, top, c]) => {
      cyl(x + cx - 3.5, b + top, 7, -top - 14, c); oval(x + cx, b + top, 3.5, 1, '#2a2020');
      R(x + cx - 3.5, b + top + 4, 7, 2, '#f4f0e0'); for (const k of [10, 18]) P(x + cx, b + top + k, sh(c, 2));
    });
    wood(x + 3, b - 16, 26, 16, CEDAR); for (const j of [-11, -6]) R(x + 4, b + j, 24, 1, sh(CEDAR, -2));
    path([[x + 18, b - 16], [x + 24, b - 19], [x + 28, b - 22], [x + 29.5, b - 27]], '#5a4a30', 1);
    disc(x + 29.5, b - 28, 3.4, 'rgba(255,210,100,0.45)'); disc(x + 29.5, b - 28, 1.6, SPARK); P(x + 29, b - 28.5, '#fff4c0');
    for (let a = 0; a < 6; a++) line(x + 29.5 + Math.cos(a) * 2, b - 28 + Math.sin(a) * 2, x + 29.5 + Math.cos(a) * 3.6, b - 28 + Math.sin(a) * 3.6, '#fff4c0', 0.5);
  } },
  // a big okedo drum lying on its X-frame stand, red ropes laced round it, two sticks across its top
  { id: 'festivaldrum', name: 'Big festival drum', w: 2, h: 1, price: 1000, draw(x, b, vw) {
    floorShadow(x, b, vw);
    for (const cx of [16, 48]) { line(x + cx - 6, b, x + cx + 6, b - 27, sh(CEDAR, -1), 3); line(x + cx + 6, b, x + cx - 6, b - 27, sh(CEDAR, -1), 3); }
    R(x + 12, b - 14, 40, 2.5, sh(CEDAR, -1));
    const g = ctx(), top = [], bot = [];
    for (let i = 0; i <= 48; i += 2) { const h = 13 + Math.sin(i / 48 * Math.PI) * 2; top.push([x + 8 + i, b - 41 - h]); bot.unshift([x + 8 + i, b - 41 + h]); }
    const lg = g.createLinearGradient(0, b - 56, 0, b - 26); lg.addColorStop(0, sh(CEDAR, 1)); lg.addColorStop(0.4, CEDAR); lg.addColorStop(1, sh(CEDAR, -2));
    g.fillStyle = lg; g.beginPath(); [...top, ...bot].forEach(([a, c], n) => (n ? g.lineTo(a, c) : g.moveTo(a, c))); g.closePath(); g.fill();
    for (let n = 0; n < 5; n++) {
      const yl = b - 41 - 13 * Math.cos(n / 5 * Math.PI), yr = b - 41 - 13 * Math.cos((n + 1) / 5 * Math.PI);
      line(x + 10, n % 2 ? yr : yl, x + 54, n % 2 ? yl : yr, VERMIL, 1.4);
    }
    for (const px of [7, 55]) { R(x + px, b - 54, 2, 26, '#f4ecd8'); for (let j = -53; j < -28; j += 3) P(x + px + (px < 32 ? 2.5 : -1.5), b + j, IRON); }
    line(x + 24, b - 58, x + 40, b - 61, sh(CEDAR, 1), 2); line(x + 26, b - 61, x + 42, b - 57, sh(CEDAR, 1), 2);
  } },
  // a wooden rack of round uchiwa fans: a red sun, waves, a sakura, a Magikarp, a firework
  { id: 'fanrack', name: 'Paper fan rack', w: 1, h: 1, price: 300, draw(x, b) {
    floorShadow(x + 2, b, 28);
    const FANS = [[6, -44, '#f4f4f0'], [26, -44, '#7ac8f0'], [11, -54, INDIGO], [21, -54, '#f8b8c8'], [16, -58, '#283058']];
    for (const [i, j, c] of FANS) {
      line(x + 16, b - 9, x + i, b + j, sh(CEDAR, 1), 1.4);
      disc(x + i, b + j, 6.5, sh(c, -1)); disc(x + i, b + j, 5.8, c);
    }
    disc(x + 6, b - 44, 3, VERMIL);
    for (const k of [-2, 0, 2]) arcS(x + 11, b - 52 + k, 3, Math.PI * 1.1, Math.PI * 1.9, '#ffffff', 0.8);
    for (let a = 0; a < 5; a++) disc(x + 21 + Math.cos(a * 1.26) * 1.8, b - 54 + Math.sin(a * 1.26) * 1.8, 1.4, '#ffffff');
    oval(x + 26, b - 44, 3, 1.8, KARP); tri(x + 29, b - 46, 3, KARP, 0.7);
    for (let a = 0; a < 8; a++) line(x + 16, b - 58, x + 16 + Math.cos(a * 0.785) * 4, b - 58 + Math.sin(a * 0.785) * 4, a % 2 ? '#e8b830' : VERMIL, 0.8);
    wood(x + 6, b - 10, 20, 10, CEDAR); R(x + 8, b - 9, 16, 1, sh(CEDAR, -2));
  } },
  // a whole watermelon and an upright slice on a low wooden stand
  { id: 'watermelonstand', name: 'Watermelon stand', w: 1, h: 1, price: 300, draw(x, b) {
    floorShadow(x, b, 32);
    for (const px of [4, 25]) cyl(x + px, b - 14, 3, 14, CEDAR);
    wood(x + 2, b - 17, 28, 3, CEDAR);
    sphere(x + 12, b - 27, 10, MELON);
    for (const k of [-6, -2, 2, 6]) { const g = ctx(); g.strokeStyle = MELOND; g.lineWidth = 1.4; g.beginPath(); g.ellipse(x + 12, b - 27, Math.abs(k) * 1.4 + 0.4, 9.6, 0, k < 0 ? Math.PI / 2 : -Math.PI / 2, k < 0 ? Math.PI * 1.5 : Math.PI / 2); g.stroke(); }
    R(x + 11.5, b - 38, 1, 2, '#6a5a2a');
    const g = ctx();
    for (const [r, c] of [[7, MELOND], [6.4, '#f4f0d0'], [5.8, '#e8484a']]) { g.fillStyle = c; g.beginPath(); g.arc(x + 25, b - 17, r, Math.PI, 0); g.fill(); }
    for (const [i, j] of [[22, -19], [25, -21], [28, -19], [24, -18.5], [26.5, -18]]) P(x + i, b + j, INK);
  } },
  // a terracotta katori-buta, a coil smouldering in its open snout
  { id: 'mosquitopig', name: 'Mosquito-coil pig', w: 1, h: 1, price: 200, glow: ['#ff8030'], draw(x, b) {
    floorShadow(x + 5, b, 22);
    for (const px of [9, 20]) R(x + px, b - 4, 3, 4, sh(PIG, -1));
    for (const sx of [-1, 1]) tri(x + 16 + sx * 7, b - 25, 4, sh(PIG, -1), 0.6);
    ovalShade(x + 16, b - 13, 11, 10, PIG);
    disc(x + 16, b - 13, 6.2, sh(PIG, -1)); disc(x + 16, b - 13, 5, '#2a1a14');
    const g = ctx(); g.strokeStyle = '#5a7a4a'; g.lineWidth = 0.8; g.beginPath();
    for (let a = 0; a < 14; a += 0.4) { const r = 0.6 + a * 0.28; g.lineTo(x + 16 + Math.cos(a) * r, b - 13 + Math.sin(a) * r); } g.stroke();
    disc(x + 19.5, b - 11, 1.2, '#ff8030');
    for (const sx of [-1, 1]) P(x + 16 + sx * 7, b - 19, INK);
    path([[x + 16, b - 24], [x + 14, b - 30], [x + 18, b - 36], [x + 15, b - 42]], 'rgba(220,220,230,0.4)', 1.5);
  } },
  // a wooden tub of ice water, ramune bottles chilling in it, a towel over its rim
  { id: 'ramunetub', name: 'Ramune ice tub', w: 1, h: 1, price: 350, draw(x, b) {
    floorShadow(x + 2, b, 28);
    [[9, -36, '#3a7ad8'], [21, -35, '#f06a9a'], [13, -40, '#f06a9a'], [17.5, -38, '#3a7ad8']].forEach(([i, top, cap]) => {
      cyl(x + i - 1.5, b + top + 3, 3, -top - 23, TEAL); cyl(x + i - 2, b + top + 7, 4, -top - 27, TEAL);
      disc(x + i, b + top + 5.5, 1.3, '#e8fcff'); R(x + i - 1.5, b + top, 3, 3, cap);
    });
    R(x + 5, b - 23, 22, 3, '#d8f0ff'); for (const i of [7, 12, 19, 24]) R(x + i, b - 24, 3, 2, '#f4fcff');
    wood(x + 4, b - 20, 24, 20, CEDAR, 'y'); for (const i of [10, 16, 22]) R(x + i, b - 19, 0.6, 18, sh(CEDAR, -2));
    for (const j of [-17, -6]) R(x + 4, b + j, 24, 2, IRON);
    panel(x + 3, b - 23, 6, 12, '#f8f8f4'); R(x + 3, b - 18, 6, 1.5, '#3a7ad8');
  } },
  // a gold and black mikoshi on its carrying poles, red pillars, gold doors, a phoenix on its roof
  { id: 'mikoshi', name: 'Festival mikoshi', w: 2, h: 1, price: 1400, draw(x, b, vw) {
    floorShadow(x, b, vw);
    for (const px of [6, 50]) wood(x + px, b - 10, 8, 10, sh(CEDAR, -1));
    wood(x, b - 14, 64, 4, CEDAR);
    panel(x + 10, b - 22, 44, 8, LACQ); R(x + 10, b - 22, 44, 1.5, GOLD); R(x + 10, b - 16, 44, 1.5, GOLD);
    R(x + 12, b - 27, 40, 1.5, VERMIL); for (let i = 13; i < 52; i += 6) R(x + i, b - 27, 1.5, 5, VERMIL);
    panel(x + 16, b - 47, 32, 21, VERMIL);
    panel(x + 23, b - 45, 18, 18, GOLD); R(x + 31.5, b - 45, 1, 18, sh(GOLD, -1));
    for (let j = -42; j < -28; j += 4) R(x + 24, b + j, 16, 0.6, sh(GOLD, -1));
    for (const px of [16, 46]) R(x + px, b - 47, 2, 21, '#1e1414');
    poly([[x + 5, b - 52], [x + 10, b - 48], [x + 54, b - 48], [x + 59, b - 52], [x + 46, b - 56], [x + 38, b - 61], [x + 34, b - 66], [x + 30, b - 66], [x + 26, b - 61], [x + 18, b - 56]], LACQ);
    R(x + 9, b - 49.5, 46, 1.5, GOLD); line(x + 6, b - 52, x + 31, b - 66, GOLD, 0.8); line(x + 58, b - 52, x + 33, b - 66, GOLD, 0.8);
    disc(x + 32, b - 56, 3, GOLD); disc(x + 32, b - 56, 1.5, sh(GOLD, -1));
    oval(x + 32, b - 71, 2.5, 4, GOLD); poly([[x + 31, b - 71], [x + 24, b - 77], [x + 29, b - 70]], GOLD); poly([[x + 33, b - 71], [x + 40, b - 77], [x + 35, b - 70]], GOLD);
    tri(x + 31.5, b - 78, 3, GOLD, 0.5);
    for (const px of [7, 57]) { line(x + px, b - 51, x + px, b - 41, '#9a3ac8', 1); R(x + px - 1, b - 41, 2, 4, '#9a3ac8'); }
  } },
  // a tin pail of senko sparklers, one lit, a candle burning beside it to light them
  { id: 'sparklerbucket', name: 'Sparkler bucket', w: 1, h: 1, price: 200, glow: [SPARK, '#fff4c0'], draw(x, b) {
    floorShadow(x + 2, b, 26);
    [[11, -40, VERMIL], [14, -44, '#3a7ad8'], [17, -46, '#e8b830'], [20, -42, '#f06a9a']].forEach(([i, j, c]) => {
      line(x + 15 + (i - 15) * 0.3, b - 18, x + i, b + j, '#8a8a90', 0.6); line(x + i - (i - 15) * 0.05, b + j + 6, x + i, b + j, c, 1.2);
    });
    line(x + 20, b - 18, x + 26, b - 44, '#8a8a90', 0.6);
    disc(x + 26.5, b - 45, 4, 'rgba(255,210,100,0.45)'); disc(x + 26.5, b - 45, 1.6, SPARK); P(x + 26, b - 45.5, '#fff4c0');
    for (let a = 0; a < 6; a++) line(x + 26.5 + Math.cos(a + 0.3) * 2, b - 45 + Math.sin(a + 0.3) * 2, x + 26.5 + Math.cos(a + 0.3) * 4, b - 45 + Math.sin(a + 0.3) * 4, '#ffe080', 0.6);
    arcS(x + 16, b - 18, 7, Math.PI, Math.PI * 2, IRON, 1);
    poly([[x + 9, b - 18], [x + 23, b - 18], [x + 21, b], [x + 11, b]], '#b8c0c8');
    R(x + 9.5, b - 18.5, 13, 1.5, sh('#b8c0c8', 1)); for (const j of [-12, -5]) R(x + 10, b + j, 12, 1, sh('#b8c0c8', -1));
    R(x + 2, b - 2, 6, 2, IRON); cyl(x + 3.5, b - 9, 3, 7, WHITE); flame(x + 5, b - 12, 1.4, 2.4, SPARK, '#fff4c0');
  } },
];

const SUMMER_WALL = [
  // an indigo festival banner on a bamboo rod: a firework burst over white waves
  { id: 'summerbanner', name: 'Summer festival banner', w: 1, h: 1, layer: 'wall', price: 220, wall(x) {
    line(x + 4, 11, x + 16, 4, INK, 0.6); line(x + 28, 11, x + 16, 4, INK, 0.6); disc(x + 16, 4, 1, IRON);
    panel(x + 6, 13, 20, 60, INDIGO); R(x + 6, 13, 20, 4, VERMIL);
    for (let a = 0; a < 12; a++) line(x + 16 + Math.cos(a * 0.52) * 2, 32 + Math.sin(a * 0.52) * 2, x + 16 + Math.cos(a * 0.52) * 7, 32 + Math.sin(a * 0.52) * 7, a % 2 ? '#e8b830' : '#f06a6a', 1);
    disc(x + 16, 32, 1.4, '#fff4c0');
    for (let a = 0; a < 6; a++) P(x + 16 + Math.cos(a * 1.05 + 0.3) * 9, 32 + Math.sin(a * 1.05 + 0.3) * 9, '#e8b830');
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) arcS(x + 8.5 + c * 5 + (r % 2) * 2.5, 72 - r * 4, 2.5, Math.PI, Math.PI * 2, '#ffffff', 0.8);
    cyl(x + 2, 10, 28, 3, BAMBOO); R(x + 2, 10, 28, 1, sh(BAMBOO, 1));
    for (const px of [6, 24]) R(x + px, 73, 2, 6, VERMIL);
  } },
  // a bamboo sudare blind with red ties, morning glories climbing its corner
  { id: 'sudare', name: 'Bamboo blind', w: 2, h: 1, layer: 'wall', price: 350, wall(x) {
    for (let j = 11; j < 70; j += 2) R(x + 4, j, 56, 1.6, (j / 2) % 2 < 1 ? BAMBOO : sh(BAMBOO, -1));
    for (const i of [14, 32, 50]) R(x + i, 11, 1, 59, '#6a4a2a');
    cyl(x + 2, 8, 60, 3, sh(BAMBOO, -1)); cyl(x + 3, 70, 58, 3, sh(BAMBOO, -1));
    for (const i of [20, 44]) { R(x + i, 11, 1, 30, VERMIL); R(x + i - 1, 41, 3, 6, VERMIL); }
    line(x + 58, 70, x + 52, 52, '#4a8a3a', 0.8);
    for (const [i, j] of [[57, 64], [53, 56]]) { leaf(x + i - 2, j + 2, 1.6, 2.2, '#4a8a3a', 0.4); disc(x + i, j, 2.6, '#5a6ad8'); disc(x + i, j, 0.9, '#ffffff'); }
  } },
];

/* ----- the Lantern Festival ----- */
const LANTERN = [
  // a paper sky lantern on its launching stool, its fuel cell lit, a wish tied to it
  { id: 'skylantern', name: 'Sky lantern', w: 1, h: 1, price: 350, glow: [PAPER, LGLOW], draw(x, b) {
    floorShadow(x + 4, b, 24);
    cyl(x + 9, b - 8, 14, 8, RUBY); oval(x + 16, b - 8, 7, 1.5, sh(RUBY, 1));
    const g = ctx(), lg = g.createLinearGradient(x + 6, 0, x + 26, 0);
    lg.addColorStop(0, sh(PAPER, -1)); lg.addColorStop(0.45, sh(PAPER, 1)); lg.addColorStop(1, sh(PAPER, -1));
    g.fillStyle = lg; g.beginPath(); g.moveTo(x + 8, b - 12); g.lineTo(x + 24, b - 12); g.lineTo(x + 26, b - 56); g.quadraticCurveTo(x + 26, b - 62, x + 20, b - 62);
    g.lineTo(x + 12, b - 62); g.quadraticCurveTo(x + 6, b - 62, x + 6, b - 56); g.closePath(); g.fill();
    for (const i of [11, 16, 21]) line(x + i, b - 61, x + i + (i - 16) * 0.1, b - 13, sh(PAPER, -1), 0.5);
    disc(x + 16, b - 40, 4, LRED); arcS(x + 16, b - 40, 4, 0, Math.PI * 2, GOLD, 0.8);
    R(x + 8, b - 13, 16, 1.5, '#8a6a40'); disc(x + 16, b - 14, 2.4, LGLOW);
    line(x + 22, b - 12, x + 24, b - 6, LRED, 1); R(x + 23, b - 6, 4, 5, LRED);
  } },
  // a little tree in a celadon pot, its branches in blossom, red lanterns hung from them
  { id: 'lanterntree', name: 'Lantern tree', w: 1, h: 1, price: 700, glow: [LRED], draw(x, b) {
    floorShadow(x + 4, b, 24);
    line(x + 16, b - 12, x + 15, b - 40, '#5a3a2a', 3);
    for (const [x0, y0, x1, y1] of [[15, -40, 6, -62], [15, -40, 26, -66], [15, -46, 16, -82], [8, -58, 4, -66], [24, -62, 29, -70]]) line(x + x0, b + y0, x + x1, b + y1, '#5a3a2a', x0 === 15 ? 2 : 1.2);
    for (const [i, j] of [[5, -64], [9, -60], [25, -67], [28, -70], [16, -80], [14, -72], [18, -66], [22, -63], [4, -67]]) { disc(x + i, b + j, 2, BLOSSOM); P(x + i, b + j, '#ffffff'); }
    for (const [i, j] of [[6, -56], [26, -60], [12, -66], [20, -74], [16, -46]]) { line(x + i, b + j - 3, x + i, b + j, INK, 0.5); lantern(x + i, b + j, 3, 3.6, LRED, 1); }
    poly([[x + 10, b - 12], [x + 22, b - 12], [x + 20, b], [x + 12, b]], '#2a6a6a'); R(x + 9.5, b - 13, 13, 2, sh('#2a6a6a', 1));
  } },
  // a sanbo stand of moon-viewing dango, pampas grass in a vase beside it
  { id: 'moonviewing', name: 'Moon-viewing stand', w: 1, h: 1, price: 450, draw(x, b) {
    floorShadow(x, b, 32);
    for (const [x1, y1] of [[20, -70], [25, -80], [29, -74], [31, -62]]) {
      line(x + 26, b - 15, x + x1, b + y1, '#b8a878', 0.8);
      for (let k = 0; k < 4; k++) oval(x + x1 - (x1 - 26) * k * 0.04, b + y1 + 2 + k * 2.4, 1.6, 2, '#ece0c4');
    }
    poly([[x + 23, b - 12], [x + 29, b - 12], [x + 30, b - 4], [x + 28, b], [x + 24, b], [x + 22, b - 4]], '#4a5a8a'); R(x + 24.5, b - 15, 3, 3, '#4a5a8a');
    wood(x + 4, b - 14, 16, 14, HINOKI); oval(x + 12, b - 7, 4, 4, sh(HINOKI, -2));
    wood(x + 2, b - 18, 20, 4, HINOKI); R(x + 2, b - 18, 20, 1, sh(HINOKI, 1));
    for (const [i, j] of [[7, -20.4], [12, -20.4], [17, -20.4], [9.5, -24.6], [14.5, -24.6], [12, -28.8]]) sphere(x + i, b + j, 2.5, '#f8f6ee');
  } },
  // a black iron floor stand topped with a Chandelure, its arms and crown burning violet
  { id: 'chandelurestand', name: 'Chandelure floor stand', w: 1, h: 1, price: 900, glow: [PURPLE, LILAC], draw(x, b) {
    floorShadow(x + 4, b, 24);
    line(x + 16, b - 8, x + 6, b, IRON, 2); line(x + 16, b - 8, x + 26, b, IRON, 2);
    cyl(x + 15, b - 52, 2, 46, IRON);
    for (const sx of [-1, 1]) {
      path([[x + 16 + sx * 6, b - 60], [x + 16 + sx * 11, b - 61], [x + 16 + sx * 13, b - 67]], INK, 1.4);
      path([[x + 16 + sx * 4, b - 64], [x + 16 + sx * 7, b - 68], [x + 16 + sx * 8, b - 74]], INK, 1.4);
      for (const [i, j] of [[13, -67], [8, -74]]) { R(x + 16 + sx * i - 1.5, b + j - 1, 3, 1.5, INK); flame(x + 16 + sx * i, b + j - 4, 1.6, 3, PURPLE, LILAC); }
    }
    disc(x + 16, b - 58, 7.5, '#c8b0e8'); oval(x + 16, b - 57, 3, 4, PURPLE); oval(x + 13, b - 62, 1.5, 2, 'rgba(255,255,255,0.6)');
    for (const sx of [-1, 1]) { oval(x + 16 + sx * 3, b - 59, 1.6, 1.2, '#f8d030'); P(x + 16 + sx * 3, b - 59, INK); }
    poly([[x + 10, b - 64], [x + 22, b - 64], [x + 20, b - 68], [x + 16, b - 71], [x + 12, b - 68]], INK);
    flame(x + 16, b - 75, 2, 3.5, PURPLE, LILAC);
  } },
  // a round stone basin of water, three paper lanterns floating on it among lily pads
  { id: 'lanternpond', name: 'Floating lantern basin', w: 2, h: 1, price: 900, glow: [PAPER], draw(x, b, vw) {
    floorShadow(x, b, vw);
    for (const [cx, w0, h0] of [[18, 8, 9], [46, 8, 9], [32, 9, 11]]) {
      R(x + cx - w0 / 2 - 1, b - 22, w0 + 2, 2, LACQ);
      panel(x + cx - w0 / 2, b - 22 - h0, w0, h0, PAPER); R(x + cx - w0 / 2, b - 22 - h0, 1, h0, LACQ); R(x + cx + w0 / 2 - 1, b - 22 - h0, 1, h0, LACQ);
      R(x + cx - w0 / 2 - 1, b - 24 - h0, w0 + 2, 2, LACQ); P(x + cx, b - 22 - h0 / 2, LRED);
    }
    for (const i of [8, 56]) oval(x + i, b - 21, 5, 1.2, '#4a9a4a');
    oval(x + 9, b - 23, 2, 1.6, PINK);
    panel(x + 2, b - 18, 60, 18, STONE); R(x + 1, b - 21, 62, 3, sh(STONE, 1)); R(x + 4, b - 20.5, 56, 1, WATER);
    for (let n = 0; n < 24; n++) P(x + 4 + hash(n, 9) * 56, b - 16 + hash(n, 3) * 14, sh(STONE, -1));
  } },
  // a red lacquered frame hung with four silk lanterns, a riddle slip under each
  { id: 'riddlerack', name: 'Lantern riddle rack', w: 2, h: 1, price: 750, glow: [LRED], draw(x, b, vw) {
    floorShadow(x, b, vw);
    for (const px of [0, 54]) R(x + px, b - 3, 10, 3, LACQ);
    for (const px of [3.5, 57.5]) wood(x + px, b - 86, 3, 83, RUBY, 'y');
    R(x + 5, b - 12, 54, 2, RUBY);
    wood(x, b - 88, 64, 4, RUBY); for (const px of [0, 61]) R(x + px, b - 90, 3, 2, GOLD);
    [[15, '#ffffff'], [26, '#f8e070'], [38, '#f8c0c8'], [49, '#c8e8f8']].forEach(([i, slip]) => {
      line(x + i, b - 84, x + i, b - 80, INK, 0.5); lantern(x + i, b - 80, 6, 7, LRED, 0);
      R(x + i - 0.7, b - 62, 1.4, 4, sh(LRED, -1)); line(x + i, b - 58, x + i, b - 56, INK, 0.5);
      panel(x + i - 2.5, b - 56, 5, 14, slip); words('?', x + i, b - 49, 6, INK, 5);
    });
  } },
  // a long red dragon lantern held up on three poles, a gold-maned head at its front
  { id: 'dragonlantern', name: 'Dragon lantern', w: 2, h: 1, price: 1300, glow: [LRED, '#f8a040'], draw(x, b, vw) {
    floorShadow(x, b, vw);
    for (const px of [16, 36, 56]) { R(x + px - 3, b - 4, 6, 4, LACQ); cyl(x + px - 1, b - 50, 2, 46, CEDAR); }
    [...DRAGON].reverse().forEach(([i, j, r], n) => {
      tri(x + i, b - j - r - 3, 3, GOLD, 0.6);
      disc(x + i, b - j, r, LRED); arcS(x + i, b - j, r * 0.7, Math.PI * 0.2, Math.PI * 0.8, '#f8a040', 0.8);
      arcS(x + i - 1, b - j, r, Math.PI * 0.6, Math.PI * 1.4, GOLD, 0.8);
    });
    poly([[x + 60, b - 50], [x + 64, b - 56], [x + 63.5, b - 45]], GOLD);
    for (const [i, j, r] of [[14, 62, 3], [17, 58, 3], [16, 54, 2.6]]) disc(x + i, b - j, r, GOLD);
    for (const [x1, y1] of [[18, -74], [14, -76]]) line(x + 11, b - 64, x + x1, b + y1, GOLD, 1.4);
    ovalShade(x + 10, b - 58, 8, 6, LRED);
    panel(x + 1, b - 59, 9, 4, LRED); panel(x + 2, b - 55, 7, 2.5, '#f8a040');
    for (const i of [3, 5, 7]) P(x + i, b - 55.5, '#ffffff');
    disc(x + 11, b - 61, 2, '#ffffff'); P(x + 11, b - 61, INK);
    line(x + 2, b - 58, x - 0, b - 63, GOLD, 0.6); line(x + 2, b - 56, x - 0, b - 52, GOLD, 0.6);
  } },
  // a low lacquered table: a plate of mooncakes, a celadon teapot and a cup
  { id: 'mooncaketable', name: 'Mooncake table', w: 1, h: 1, price: 450, draw(x, b) {
    floorShadow(x, b, 32);
    for (const px of [4, 25]) R(x + px, b - 14, 3, 14, LACQ);
    R(x + 3, b - 15, 26, 3, LACQ);
    panel(x, b - 19, 32, 4, RUBY); R(x, b - 16, 32, 0.8, GOLD);
    oval(x + 12, b - 19.5, 9, 1.6, '#f4f4f0');
    for (const [x0, top] of [[5, -25], [12, -25], [8.5, -30]]) { cyl(x + x0, b + top, 7, 5, CRUST); oval(x + x0 + 3.5, b + top, 3.5, 0.8, sh(CRUST, 1)); R(x + x0 + 1.5, b + top + 1.5, 4, 2, sh(CRUST, 1)); }
    line(x + 21, b - 25, x + 17.5, b - 29, JADE, 1.2);
    ovalShade(x + 25, b - 24.5, 5, 4.5, JADE); R(x + 23, b - 30, 4, 1.5, sh(JADE, -1)); disc(x + 25, b - 31, 1, sh(JADE, -1));
    arcS(x + 30, b - 25, 2.4, -Math.PI / 2, Math.PI / 2, sh(JADE, -1), 1);
    cyl(x + 18, b - 22, 3, 3, JADE);
  } },
  // a red pailou gate: green tiled roof, a blue plaque, three lanterns hung from its crossbeam
  { id: 'lanternarch', name: 'Lantern archway', w: 2, h: 1, price: 1200, glow: [LRED], draw(x, b, vw) {
    floorShadow(x, b, vw);
    for (const px of [1, 53]) panel(x + px, b - 6, 10, 6, STONE);
    for (const px of [3.5, 55.5]) wood(x + px, b - 74, 5, 68, RUBY, 'y');
    for (const [i, j, rx, ry] of [[18, -58, 4.5, 5.5], [32, -58, 5.5, 6.5], [46, -58, 4.5, 5.5]]) { line(x + i, b - 60, x + i, b + j + 1, INK, 0.5); lantern(x + i, b + j, rx, ry, LRED); }
    wood(x + 2, b - 62, 60, 4, RUBY);
    panel(x + 25, b - 71, 14, 8, '#2a4a6a'); arcS(x + 32, b - 67, 2, 0, Math.PI * 2, GOLD, 0.8); R(x + 25, b - 71, 14, 0.8, GOLD); R(x + 25, b - 63.8, 14, 0.8, GOLD);
    wood(x, b - 76, 64, 4, RUBY);
    poly([[x, b - 81], [x + 4, b - 77], [x + 60, b - 77], [x + 64, b - 81], [x + 56, b - 88], [x + 8, b - 88]], TILE);
    for (let i = 8; i < 58; i += 4) line(x + i, b - 87, x + i + (i - 32) * 0.12, b - 78, sh(TILE, -1), 0.6);
    R(x + 6, b - 90, 52, 2, sh(TILE, -1)); for (const px of [5, 57]) disc(x + px + 1, b - 90, 1.6, GOLD);
  } },
  // a white plaster screen with a round moon gate through it, grey tiles on top, plum blossom along it
  { id: 'moongate', name: 'Moon gate screen', w: 2, h: 1, price: 1000, draw(x, b, vw) {
    floorShadow(x, b, vw);
    panel(x, b - 4, 64, 4, sh(STONE, -1));
    panel(x + 1, b - 79, 62, 75, PLASTER);
    const g = ctx(); g.save(); g.globalCompositeOperation = 'destination-out'; disc(x + 32, b - 41, 24, '#000'); g.restore();
    arcS(x + 32, b - 41, 25, 0, Math.PI * 2, DARKW, 2.5);
    for (const px of [1, 60]) R(x + px, b - 79, 3, 75, DARKW);
    poly([[x, b - 79], [x + 64, b - 79], [x + 60, b - 86], [x + 4, b - 86]], '#5a6070'); R(x + 2, b - 88, 60, 2, sh('#5a6070', -1));
    path([[x + 4, b - 72], [x + 14, b - 70], [x + 22, b - 74], [x + 30, b - 69]], '#4a3020', 1.2);
    for (const [i, j] of [[8, -72], [13, -69], [18, -72], [24, -74], [28, -70], [21, -75]]) { disc(x + i, b + j, 1.8, BLOSSOM); P(x + i, b + j, '#ffffff'); }
  } },
  // a floor lantern shaped like a lotus in bloom, glowing pink on its lily pad
  { id: 'lotuslantern', name: 'Lotus lantern', w: 1, h: 1, price: 400, glow: [PINK, PALEPINK, '#fff0b0'], draw(x, b) {
    floorShadow(x, b, 32);
    oval(x + 16, b - 3, 15, 3, '#3a8a3a'); oval(x + 16, b - 4, 14, 2, '#5aaa4a');
    disc(x + 16, b - 22, 4, '#fff0b0');
    [[5, -11, 3.5, 7, -0.9], [27, -11, 3.5, 7, 0.9], [9.5, -14, 3.5, 8, -0.5], [22.5, -14, 3.5, 8, 0.5], [16, -15, 3.8, 8.5, 0]].forEach(([i, j, rx, ry, t]) => leaf(x + i, b + j, rx, ry, PINK, t));
    [[11.5, -21, 3, 8, -0.35], [20.5, -21, 3, 8, 0.35], [16, -24, 3.4, 9, 0]].forEach(([i, j, rx, ry, t]) => leaf(x + i, b + j, rx, ry, PALEPINK, t));
  } },
  // a dark three-step stand crowded with Litwick, each burning violet
  { id: 'litwicktiers', name: 'Litwick candle tiers', w: 1, h: 1, price: 550, glow: [PURPLE, LILAC], draw(x, b) {
    floorShadow(x, b, 32);
    wood(x + 1, b - 6, 30, 6, DARKW); wood(x + 5, b - 13, 22, 7, DARKW); wood(x + 10, b - 20, 12, 7, DARKW);
    for (const [cx, base, h, w] of [[16, 20, 13, 6], [11, 13, 11, 5], [21, 13, 10, 5], [6, 6, 10, 5], [26, 6, 9, 5]]) {
      const top = b - base - h;
      cyl(x + cx - w / 2, top, w, h, WAX); oval(x + cx, top, w / 2, 1.2, '#ffffff');
      R(x + cx - w / 2, top, 1, 3, '#ffffff'); R(x + cx + w / 2 - 1.5, top, 1, 4.5, '#ffffff');
      for (const sx of [-1, 1]) P(x + cx + sx * 1.2 - 0.5, top + h * 0.45, '#f8d030');
      flame(x + cx, top - 4, w * 0.35, 3.6, PURPLE, LILAC);
    }
  } },
];

const LANTERN_WALL = [
  // three big round silk lanterns and two gold coin knots on a sagging red cord
  { id: 'silklanterns', name: 'Silk lantern string', w: 2, h: 1, layer: 'wall', price: 280, glow: [LRED], wall(x) {
    const j = (i) => 12 + Math.sin(Math.max(0, Math.min(58, i - 3)) / 58 * Math.PI) * 8;
    path(Array.from({ length: 30 }, (_, n) => [x + 3 + n * 2, j(3 + n * 2)]), '#8a2020', 0.9);
    for (const i of [23, 41]) { disc(x + i, j(i) + 3, 2, GOLD); R(x + i - 0.6, j(i) + 2.4, 1.2, 1.2, sh(GOLD, -2)); R(x + i - 0.6, j(i) + 5, 1.2, 5, LRED); }
    for (const i of [14, 32, 50]) { const t = j(i) + 3; line(x + i, j(i), x + i, t, '#8a2020', 0.8); lantern(x + i, t, 8, 9, LRED, 0); disc(x + i, t + 22.5, 1.5, GOLD); poly([[x + i - 1, t + 24], [x + i + 1, t + 24], [x + i + 2.5, t + 34], [x + i - 2.5, t + 34]], LRED); }
    for (const i of [3, 61]) disc(x + i, j(i), 1, IRON);
  } },
];

/** The cushion on the wedding chair (the paint kit's cushion() in ivory). */
function cushion0(x, y, w, h) { panel(x, y, w, h, IVORY); R(x + 1, y, w - 2, 1, '#ffffff'); }

export const SEASON_KINDS_2 = [
  ...[...WEDDING, ...WEDDING_WALL].map(k => ({ ...k, group: 'Wedding', holiday: 'wedding', solo: true })),
  ...[...SUMMER, ...SUMMER_WALL].map(k => ({ ...k, group: 'Summer festival', holiday: 'summer', solo: true })),
  ...[...LANTERN, ...LANTERN_WALL].map(k => ({ ...k, group: 'Lantern Festival', holiday: 'lantern', solo: true })),
];
