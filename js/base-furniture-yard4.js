/* base-furniture-yard4.js  -  the backyard's Water and Camping pieces (the user's ask, 2026-10-16: a catalogue as big
   as Animal Crossing's, every piece a "3D detailed CLEAN" model): fountains, a waterfall, streams and bridges, ponds a
   Lotad and a Psyduck float in, pumps, a rain barrel, a water wheel, a hot tub and a shower; a campfire, camp seats, a
   hammock, a lean-to, a camp kitchen and stove, a canoe, a signpost, an outdoor movie screen and a bell tent. Every kind
   is `outdoor` (only out on the lawn, fits() in js/secret-base.js), on Smeargle's Water or Camping tab
   (js/garden-shop.js), and themed. Each is modelled from parts in js/base-models-z.js, which follows these paintings
   (the front view, 32 pixels a tile); the stream and the stream crossing are flat, painted from above, and line up end
   to end. */

import { k, sh, R, panel, wood, cushion, disc, oval, ovalShade, cyl, leaf, speckle, floorShadow, ctx } from './base-paint.js';

export const YARD_KINDS_4 = [];
const add = (yard, list) => list.forEach(f => YARD_KINDS_4.push({ group: 'Yard', outdoor: true, yard, ...f }));

const WATER = '#4ea6d8', SPRAY = '#a8dcf4', FOAM = '#eef8fc', INK = '#2c2c34', STONE = '#a8a49a', STONE2 = '#8e8a82',
  FLAME = '#ff8030', EMBER = '#ffc040', BRASS = '#d8b048', REED = '#5a9a3a', CATTAIL = '#7a4a28';
const WAILMER = '#3c7cc8', BELLY = '#e8e0b8', LOTAD = '#4a8ad0', PAD = '#58b848', DUCK = '#f8d030', BEAK = '#f0d8a0';
const g = () => ctx();
const line = (x0, y0, x1, y1, c, w = 2) => { const x = g(); x.strokeStyle = c; x.lineWidth = w; x.lineCap = 'round'; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke(); };
const curve = (pts, c, w = 2) => { const x = g(); x.strokeStyle = c; x.lineWidth = w; x.lineCap = 'round'; x.beginPath(); pts.forEach(([px, py], i) => i ? x.lineTo(px, py) : x.moveTo(px, py)); x.stroke(); };
const poly = (pts, c) => { const x = g(); x.fillStyle = c; x.beginPath(); pts.forEach(([px, py], i) => i ? x.lineTo(px, py) : x.moveTo(px, py)); x.closePath(); x.fill(); };
const flower = (x, y, c, r = 2.4) => { for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; disc(x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8, r * 0.7, c); } disc(x, y, r * 0.5, '#f8d038'); };
/** Falling water: see-through stripes of spray over what's behind. */
const fall = (x, y, w, h) => { const c = g(); c.save(); c.globalAlpha = 0.62; R(x, y, w, h, SPRAY); c.globalAlpha = 0.9; for (let i = x + 1; i < x + w - 1; i += 3) R(i, y, 1, h, FOAM); c.restore(); };
/** Mortar lines across a stone face, in courses `row` high. */
const courses = (x, y, w, h, row = 6) => { for (let j = y + row; j < y + h; j += row) R(x, j, w, 0.8, sh(STONE, -1)); for (let j = y, n = 0; j < y + h; j += row, n++) for (let i = x + (n % 2 ? 4 : 9); i < x + w; i += 11) R(i, j, 0.8, Math.min(row, y + h - j), sh(STONE, -1)); };
/** A rock seen from the front. */
const rock = (cx, cy, rx, ry, i) => ovalShade(cx, cy, rx, ry, [STONE, STONE2, '#bab4a8', '#9a9488'][i % 4]);
/** The canoe's sheer (its top edge) and keel, in pixels up from the floor at t (-1 to 1 along it). */
export const CANOE = { top: (t) => 27 + 7 * t ** 4, keel: (t) => 15 + 16 * t ** 4 };
/** The bell tent's roof, [half width, height] in pixels from its eave to its peak. */
export const BELL = [[46, 22], [32, 40], [19.2, 59], [3.8, 86]];
/** The footbridge's deck, its top in pixels up at x (0 to 64). */
export const ARCH = (x) => 6 + 14 * Math.sin(Math.PI * Math.min(1, Math.max(0, (x - 2) / 60)));

/** A strip of stream running across the piece, from above: grassy banks front and back, pebbles at the water's edge. */
function stream(w, h, stones) {
  R(0, 0, w, 8, k.leaf); R(0, h - 8, w, 8, k.leaf);
  speckle(0, 0, w, 8, sh(k.leaf, 1), 1, 0.12); speckle(0, h - 8, w, 8, sh(k.leaf, -1), 1, 0.12);
  R(0, 8, w, h - 16, WATER); R(0, 8, w, 2, sh(WATER, -1));
  for (let i = 0; i < w; i += 16) { R(i + 3, 13, 7, 1, sh(WATER, 1)); R(i + 10, 19, 6, 1, sh(WATER, 1)); }
  for (let i = 0; i < w; i += 8) { ovalShade(i + 3, 8, 2.6, 1.8, i % 16 ? STONE : STONE2); ovalShade(i + 7, h - 8, 2.4, 1.6, i % 16 ? STONE2 : STONE); }
  if (stones) {
    for (const [x, y, r] of [[w / 2 - 2, 12, 4.4], [w / 2 + 3, 17, 4.6], [w / 2 - 2, 22, 4.2]]) { oval(x + 0.6, y + 0.8, r, r * 0.8, sh(WATER, -1)); ovalShade(x, y, r, r * 0.8, STONE); }
    for (const y of [3, h - 4]) ovalShade(w / 2, y, 4.6, 2.8, '#bab4a8');
  } else {
    for (let i = 0; i < 3; i++) leaf(10 + i * 20, 4, 1.4, 3, REED, 0.4);
    flower(w - 14, h - 4, k.c, 2);
    disc(18, 16, 2.6, PAD); R(18, 15.4, 2.6, 1.2, WATER);
  }
}

add('Water', [
  { id: 'tierfountain', name: 'Tiered fountain', w: 2, h: 2, price: 1400, draw(x, b) {
    floorShadow(x, b, 64);
    const st = k.p, rim = sh(k.p, 1), dk = sh(k.p, -1);
    panel(x + 4, b - 15, 56, 15, st); R(x + 4, b - 9, 56, 2, k.a); R(x + 4, b - 2, 56, 2, dk);
    panel(x + 2, b - 18, 60, 4, rim);
    cyl(x + 28, b - 40, 8, 22, st);
    fall(x + 14, b - 38, 36, 20);
    poly([[x + 14, b - 46], [x + 50, b - 46], [x + 44, b - 38], [x + 20, b - 38]], st); R(x + 20, b - 39, 24, 1, dk);
    panel(x + 13, b - 48, 38, 3, rim);
    cyl(x + 29, b - 62, 6, 14, st);
    fall(x + 22, b - 58, 20, 10);
    poly([[x + 22, b - 64], [x + 42, b - 64], [x + 38, b - 58], [x + 26, b - 58]], st);
    panel(x + 21, b - 66, 22, 2, rim);
    cyl(x + 30, b - 72, 4, 6, k.a); disc(x + 32, b - 74, 3, k.a);
    for (const [dx, dy, r] of [[0, -79, 2.4], [-4, -77, 1.6], [4, -77, 1.6]]) disc(x + 32 + dx, b + dy, r, SPRAY);
  } },
  { id: 'wailmerfountain', name: 'Wailmer fountain', w: 2, h: 2, price: 1500, draw(x, b) {
    floorShadow(x, b, 64);
    // the Wailmer, rising from the pool, spouting
    fall(x + 30, b - 70, 4, 30);
    for (const [dx, dy, r] of [[-6, -70, 3], [0, -73, 3.4], [6, -70, 3], [-10, -64, 1.6], [10, -64, 1.6]]) disc(x + 32 + dx, b + dy, r, SPRAY);
    oval(x + 13, b - 20, 4, 2.5, sh(WAILMER, -1)); oval(x + 51, b - 20, 4, 2.5, sh(WAILMER, -1));
    ovalShade(x + 32, b - 26, 18, 15, WAILMER);
    oval(x + 32, b - 18, 14, 6.5, BELLY);
    curve([[x + 21, b - 23], [x + 32, b - 21], [x + 43, b - 23]], sh(WAILMER, -2), 1.2);
    for (const ex of [25, 39]) { disc(x + ex, b - 30, 2, INK); disc(x + ex - 0.6, b - 30.8, 0.7, '#ffffff'); }
    disc(x + 32, b - 40, 1.6, sh(WAILMER, -2));
    // the pool's round stone wall, its coping in the theme
    panel(x + 3, b - 12, 58, 12, STONE); courses(x + 3, b - 12, 58, 12, 6); R(x + 3, b - 6, 58, 1.5, k.a);
    panel(x + 1, b - 14, 62, 3, k.p);
  } },
  { id: 'rockwaterfall', name: 'Rock waterfall', w: 2, h: 1, price: 1200, draw(x, b) {
    floorShadow(x, b, 64);
    [[44, 64, 11, 8], [14, 58, 8, 6], [30, 58, 9, 5], [18, 42, 10, 12], [48, 46, 11, 14], [12, 22, 10, 12], [52, 24, 10, 14]].forEach(([cx, cy, rx, ry], i) => rock(x + cx, b - cy, rx, ry, i));
    for (const [lx, ly] of [[10, 63], [16, 64], [40, 71], [47, 72], [54, 60]]) leaf(x + lx, b - ly, 2, 3.2, k.leaf, 0.3);
    flower(x + 44, b - 72, k.c, 2.2); flower(x + 13, b - 64, k.a, 1.8);
    R(x + 24, b - 56, 14, 2, sh(WATER, 1));
    fall(x + 25, b - 55, 12, 46); R(x + 25, b - 55, 12, 46, 'rgba(78,166,216,0.35)');
    R(x + 6, b - 12, 52, 4, WATER);
    for (let i = 0; i < 5; i++) disc(x + 24 + i * 3.6, b - 10, 2.2, FOAM);
    [[8, 6, 8, 6], [22, 5, 9, 5], [42, 5, 9, 5], [56, 6, 8, 6]].forEach(([cx, cy, rx, ry], i) => rock(x + cx, b - cy, rx, ry, i + 1));
  } },
  { id: 'gardenstream', name: 'Garden stream', w: 2, h: 1, price: 260, high: 0.1, side: 'leaf', flat(w, h) { stream(w, h, false); } },
  { id: 'streamstones', name: 'Stream crossing', w: 1, h: 1, price: 220, high: 0.1, side: 'leaf', flat(w, h) { stream(w, h, true); } },
  { id: 'footbridge', name: 'Wooden footbridge', w: 2, h: 1, price: 700, draw(x, b) {
    floorShadow(x, b, 64);
    const dk = sh(k.w, -1), top = (px) => b - ARCH(px);
    for (const fx of [0, 56]) { panel(x + fx, b - 4, 8, 4, STONE); }
    // the rails, their posts, the deck's edge
    const rail = (dy) => { const pts = []; for (let i = 0; i <= 16; i++) { const px = 4 + i * 3.5; pts.push([x + px, top(px) - dy]); } return pts; };
    curve(rail(12), dk, 2); curve(rail(23), k.w, 3);
    for (const px of [4, 18, 32, 46, 60]) R(x + px - 1.5, top(px) - 24, 3, 24, dk);
    const deck = []; for (let i = 0; i <= 20; i++) { const px = 2 + i * 3; deck.push([x + px, top(px)]); }
    for (let i = 20; i >= 0; i--) { const px = 2 + i * 3; deck.push([x + px, top(px) + 5]); }
    poly(deck, k.w);
    curve(deck.slice(0, 21), sh(k.w, 1), 1.2);
    for (let i = 0; i < 20; i++) { const px = 4 + i * 3; R(x + px, top(px) + 0.5, 0.6, 1.6, dk); }
  } },
  { id: 'stonebridge', name: 'Stone bridge', w: 2, h: 1, price: 1100, draw(x, b) {
    floorShadow(x, b, 64);
    const c = g();
    c.fillStyle = STONE; c.beginPath(); c.moveTo(x + 2, b); c.lineTo(x + 16, b); c.ellipse(x + 32, b, 16, 15, 0, Math.PI, 0); c.lineTo(x + 62, b); c.lineTo(x + 62, b - 32); c.lineTo(x + 2, b - 32); c.closePath(); c.fill();
    c.save(); c.clip(); courses(x + 2, b - 32, 60, 32, 5); c.restore();
    for (let i = 0; i <= 8; i++) { const a = Math.PI + i / 8 * Math.PI; ovalShade(x + 32 + Math.cos(a) * 17.5, b + Math.sin(a) * 16.5, 2.6, 2.2, i % 2 ? '#bab4a8' : STONE2); }
    R(x + 2, b - 23, 60, 1.2, sh(STONE, -1));
    panel(x + 1, b - 35, 62, 3, k.p);
    for (const px of [0, 58]) { panel(x + px, b - 40, 6, 40, sh(STONE, 1)); panel(x + px - 0.5, b - 41, 7, 2, k.p); disc(x + px + 3, b - 43, 3, k.a); }
  } },
  { id: 'lotadpond', name: 'Lotad pond', w: 2, h: 2, price: 950, draw(x, b) {
    floorShadow(x, b, 64);
    for (let i = 0; i < 3; i++) { R(x + 50 + i * 3, b - 42 + i * 3, 1, 28 - i * 3, REED); oval(x + 50.5 + i * 3, b - 40 + i * 3, 1.6, 4, CATTAIL); }
    leaf(x + 47, b - 22, 2, 5, REED, -0.4);
    // the Lotad: its blue body in the water, the big lily pad on its head
    ovalShade(x + 32, b - 19, 7, 6, LOTAD);
    oval(x + 32, b - 17, 3, 1.4, '#f0c040');
    for (const ex of [29, 35]) disc(x + ex, b - 21, 1, INK);
    oval(x + 32, b - 26, 13, 3.4, sh(PAD, -1)); oval(x + 32, b - 26.6, 12.4, 2.6, PAD); R(x + 31, b - 29, 2, 2.4, sh(PAD, -1));
    for (let i = 0; i < 5; i++) oval(x + 11 + (i - 2) * 2.2, b - 18 - (i % 2), 1.4, 3, i % 2 ? sh(k.c, 1) : '#f8f0f4');
    disc(x + 11, b - 17, 1.2, '#f8d038');
    panel(x + 3, b - 14, 58, 14, STONE); courses(x + 3, b - 14, 58, 14, 7);
    panel(x + 1, b - 16, 62, 3, k.p);
  } },
  { id: 'gardenpump', name: 'Garden pump', w: 1, h: 1, price: 420, draw(x, b) {
    floorShadow(x, b, 32);
    const iron = sh(k.m, -1);
    panel(x + 2, b - 5, 28, 5, STONE);
    // the bucket under the spout
    poly([[x + 19, b - 17], [x + 31, b - 17], [x + 30, b - 5], [x + 20, b - 5]], k.c); R(x + 19, b - 18, 12, 2, sh(k.c, 1)); R(x + 20, b - 11, 10, 1, sh(k.c, -1));
    curve([[x + 19.5, b - 17], [x + 25, b - 24], [x + 30.5, b - 17]], k.m, 0.8);
    panel(x + 7, b - 8, 12, 3, iron);
    cyl(x + 9, b - 40, 8, 32, k.m);
    for (const y of [b - 30, b - 16]) R(x + 8, y, 10, 2, iron);
    R(x + 17, b - 33, 8, 3, k.m); R(x + 22, b - 33, 3, 6, k.m);
    disc(x + 23.5, b - 25, 1.2, WATER);
    panel(x + 7, b - 44, 12, 4, iron); disc(x + 13, b - 47, 2, iron);
    line(x + 10, b - 43, x + 4, b - 58, iron, 2.4); disc(x + 4, b - 59, 2, iron);
  } },
  { id: 'rainbarrel', name: 'Rain barrel', w: 1, h: 1, price: 300, draw(x, b) {
    floorShadow(x, b, 32);
    const dk = sh(k.w, -1);
    for (const px of [6, 20]) panel(x + px, b - 8, 6, 8, dk);
    R(x + 4, b - 10, 24, 2, sh(k.w, -2));
    const c = g(); c.fillStyle = k.w; c.beginPath(); c.moveTo(x + 6, b - 10); c.quadraticCurveTo(x + 3, b - 28, x + 6, b - 46); c.lineTo(x + 26, b - 46); c.quadraticCurveTo(x + 29, b - 28, x + 26, b - 10); c.closePath(); c.fill();
    c.save(); c.clip(); for (let i = x + 7; i < x + 26; i += 3.5) R(i, b - 46, 0.7, 36, dk); R(x + 4, b - 46, 7, 36, 'rgba(255,255,255,0.12)'); c.restore();
    for (const y of [b - 15, b - 28, b - 41]) R(x + 4, y, 24, 2, k.m);
    poly([[x + 7, b - 56], [x + 25, b - 56], [x + 19, b - 47], [x + 13, b - 47]], k.m); R(x + 7, b - 57, 18, 2, sh(k.m, 1));
    R(x + 5, b - 47, 22, 1.5, sh(k.w, 1));
    R(x + 14, b - 19, 4, 3, BRASS); R(x + 15, b - 17, 2, 4, BRASS); disc(x + 16, b - 20, 1.4, sh(BRASS, -1));
  } },
  { id: 'waterwheel', name: 'Water wheel', w: 2, h: 1, price: 1300, draw(x, b) {
    floorShadow(x, b, 64);
    const dk = sh(k.w, -1), c = g(), cx = x + 30, cy = b - 38;
    R(x + 57, b - 67, 3, 55, dk);
    c.strokeStyle = k.w; c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, 24, 0, Math.PI * 2); c.stroke();
    c.lineWidth = 1.4; c.strokeStyle = dk; c.beginPath(); c.arc(cx, cy, 20, 0, Math.PI * 2); c.stroke();
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; line(cx, cy, cx + Math.cos(a) * 23, cy + Math.sin(a) * 23, dk, 1.6); }
    for (let i = 0; i < 12; i++) { const a = (i + 0.5) / 12 * Math.PI * 2; c.save(); c.translate(cx + Math.cos(a) * 24.5, cy + Math.sin(a) * 24.5); c.rotate(a); R(-2, -2, 5, 4, sh(k.w, 1)); c.restore(); }
    disc(cx, cy, 4, k.m); disc(cx, cy, 1.6, sh(k.m, -1));
    R(x + 28, cy, 4, b - 12 - cy, dk);
    fall(x + 41, b - 66, 6, 54);
    wood(x + 38, b - 72, 26, 5, k.w); R(x + 38, b - 67, 26, 1, dk);
    wood(x + 2, b - 12, 60, 12, dk); R(x + 2, b - 12, 60, 2, sh(k.w, 1)); R(x + 4, b - 13, 56, 1.5, WATER);
  } },
  { id: 'psyduckpond', name: 'Psyduck pond', w: 2, h: 2, price: 900, draw(x, b) {
    floorShadow(x, b, 64);
    for (let i = 0; i < 4; i++) { R(x + 5 + i * 2.5, b - 30 + (i % 2) * 4, 1, 24, REED); }
    oval(x + 6, b - 28, 1.6, 4, CATTAIL); oval(x + 11, b - 28, 1.6, 4, CATTAIL);
    // the duck house on its post
    R(x + 48, b - 32, 3, 26, sh(k.w, -1));
    R(x + 41, b - 33, 18, 2, sh(k.w, -1));
    wood(x + 43, b - 44, 14, 11, k.w, 'y'); R(x + 48, b - 40, 4, 7, INK); disc(x + 50, b - 40, 2, INK);
    poly([[x + 40, b - 43], [x + 50, b - 54], [x + 60, b - 43]], k.c); R(x + 40, b - 44, 20, 1.5, sh(k.c, -1));
    // the Psyduck float: a yellow ring, its head
    oval(x + 24, b - 11, 13, 4, sh(DUCK, -1)); oval(x + 24, b - 12, 12, 3.2, DUCK);
    ovalShade(x + 24, b - 23, 8, 8, DUCK);
    oval(x + 24, b - 19.5, 5, 2.4, BEAK);
    for (const ex of [21, 27]) { disc(x + ex, b - 25, 1.8, '#ffffff'); disc(x + ex, b - 25, 0.8, INK); }
    for (const dx of [-2, 0, 2]) line(x + 24 + dx * 0.4, b - 31, x + 24 + dx * 1.4, b - 35, INK, 0.8);
    // the grassy bank
    panel(x + 2, b - 8, 60, 8, sh(k.leaf, -1)); R(x + 2, b - 8, 60, 2, k.leaf);
    for (let i = 0; i < 10; i++) ovalShade(x + 5 + i * 6, b - 7, 2.6, 1.6, i % 2 ? STONE : STONE2);
  } },
  { id: 'cedartub', name: 'Cedar hot tub', w: 2, h: 2, price: 1300, draw(x, b) {
    floorShadow(x, b, 64);
    wood(x + 4, b - 30, 56, 30, k.w, 'y');
    for (let i = x + 7; i < x + 60; i += 4.6) R(i, b - 30, 0.7, 30, sh(k.w, -1));
    for (const y of [b - 7, b - 25]) R(x + 3, y, 58, 2, k.m);
    panel(x + 3, b - 32, 58, 3, sh(k.w, 1));
    cushion(x + 46, b - 36, 12, 4, k.c, 1.5); R(x + 46, b - 34.5, 12, 1, k.p);
    wood(x + 22, b - 20, 20, 10, sh(k.w, 1)); wood(x + 18, b - 10, 28, 10, sh(k.w, 1));
    R(x + 22, b - 11, 20, 1, sh(k.w, -1)); R(x + 18, b - 1, 28, 1, sh(k.w, -1));
  } },
  { id: 'outdoorshower', name: 'Outdoor shower', w: 1, h: 1, price: 520, draw(x, b) {
    floorShadow(x, b, 32);
    for (let i = 0; i < 5; i++) wood(x + 3 + i * 5.4, b - 4, 4.4, 4, k.w);
    wood(x + 4, b - 84, 4, 80, k.w, 'y');
    cyl(x + 8, b - 80, 2, 70, k.m);
    R(x + 6, b - 81, 17, 2, k.m); R(x + 21, b - 81, 2, 4, k.m);
    oval(x + 22, b - 76, 6, 2.4, sh(k.m, 1)); R(x + 16, b - 76, 12, 1, sh(k.m, -1));
    disc(x + 11, b - 44, 3, k.c); R(x + 10, b - 45, 2, 2, sh(k.c, -1));
    R(x + 8, b - 58, 4, 1.5, k.m); cushion(x + 9, b - 58, 7, 18, k.a, 1.5); for (const y of [b - 52, b - 46]) R(x + 9, y, 7, 1.2, k.p);
    panel(x + 8, b - 33, 6, 2, k.p);
  } },
  { id: 'pumptrough', name: 'Pump trough', w: 2, h: 1, price: 650, draw(x, b) {
    floorShadow(x, b, 64);
    fall(x + 20, b - 34, 3, 15);
    panel(x + 16, b - 18, 46, 18, STONE); courses(x + 16, b - 18, 46, 18, 6);
    panel(x + 15, b - 20, 48, 3, sh(STONE, 1)); R(x + 17, b - 21, 44, 1, WATER);
    wood(x + 4, b - 56, 8, 56, k.w, 'y');
    poly([[x + 3, b - 56], [x + 8, b - 62], [x + 13, b - 56]], k.c);
    R(x + 12, b - 41, 10, 3, k.m); R(x + 19, b - 41, 3, 7, k.m);
    disc(x + 12, b - 48, 2, k.m); line(x + 12, b - 48, x + 28, b - 60, k.m, 2.2); disc(x + 28.5, b - 60.5, 1.8, k.m);
  } },
]);

add('Camping', [
  { id: 'campfire', name: 'Campfire', w: 1, h: 1, price: 400, glow: [FLAME], draw(x, b) {
    floorShadow(x, b, 32);
    // the flames, then the logs leant over them
    const c = g();
    c.fillStyle = FLAME; c.beginPath(); c.moveTo(x + 9, b - 7); c.quadraticCurveTo(x + 8, b - 18, x + 13, b - 22); c.quadraticCurveTo(x + 14, b - 16, x + 16, b - 29); c.quadraticCurveTo(x + 19, b - 20, x + 20, b - 23); c.quadraticCurveTo(x + 25, b - 16, x + 23, b - 7); c.closePath(); c.fill();
    c.fillStyle = EMBER; c.beginPath(); c.moveTo(x + 12, b - 7); c.quadraticCurveTo(x + 12, b - 15, x + 16, b - 21); c.quadraticCurveTo(x + 20, b - 15, x + 20, b - 7); c.closePath(); c.fill();
    oval(x + 16, b - 10, 2.4, 3.6, '#fff0a0');
    line(x + 8, b - 4, x + 15, b - 19, k.w, 3); line(x + 24, b - 4, x + 17, b - 19, k.w, 3);
    line(x + 13, b - 3, x + 16, b - 18, sh(k.w, -1), 2.6);
    [[5, 4, 4, 3.6], [11.5, 3, 3.6, 3], [17.5, 3, 3.6, 3], [23.5, 3.2, 3.6, 3.2], [28, 4, 3.4, 3.6]].forEach(([cx, cy, rx, ry], i) => rock(x + cx, b - cy, rx, ry, i));
  } },
  { id: 'logbench', name: 'Split-log bench', w: 2, h: 1, price: 320, draw(x, b) {
    floorShadow(x, b, 64);
    const bark = sh(k.w, -1);
    for (const px of [8, 44]) { cyl(x + px, b - 8, 12, 8, bark); R(x + px, b - 8, 12, 1, sh(k.w, 1)); }
    const c = g(); c.fillStyle = bark; c.beginPath(); c.moveTo(x + 2, b - 14); c.lineTo(x + 62, b - 14); c.lineTo(x + 62, b - 10); c.quadraticCurveTo(x + 61, b - 7, x + 58, b - 7); c.lineTo(x + 6, b - 7); c.quadraticCurveTo(x + 3, b - 7, x + 2, b - 10); c.closePath(); c.fill();
    for (let i = x + 5; i < x + 60; i += 6) R(i, b - 12, 3, 0.8, sh(bark, -1));
    R(x + 2, b - 15, 60, 2, sh(k.w, 1));
  } },
  { id: 'hammockstand', name: 'Hammock stand', w: 2, h: 1, price: 750, draw(x, b) {
    floorShadow(x, b, 64);
    const arm = (s) => { const pts = []; for (let i = 0; i <= 12; i++) { const t = i / 12, px = 32 + s * (28 * t), py = b - 2 - 46 * t ** 2.2; pts.push([x + px, py]); } return pts; };
    curve(arm(-1), k.w, 4); curve(arm(1), k.w, 4);
    wood(x + 6, b - 4, 52, 4, sh(k.w, -1));
    for (const s of [-1, 1]) { const ex = 32 + s * 28, sx = 32 + s * 20; line(x + ex, b - 47, x + sx, b - 34, '#e8e0c8', 0.8); disc(x + ex, b - 47, 1.6, k.m); disc(x + sx, b - 34, 1.6, sh(k.w, -1)); }
    // the cloth, sagging between its spreader bars, striped
    const c = g(), sag = (px, dy) => [x + px, b - 34 + 16 * Math.sin(Math.PI * (px - 12) / 40) + dy];
    c.save(); c.beginPath();
    for (let i = 0; i <= 20; i++) { const [px, py] = sag(12 + i * 2, 0); i ? c.lineTo(px, py) : c.moveTo(px, py); }
    for (let i = 20; i >= 0; i--) { const [px, py] = sag(12 + i * 2, 5); c.lineTo(px, py); }
    c.closePath(); c.fillStyle = k.c; c.fill(); c.clip();
    for (let i = 0; i < 6; i++) if (i % 2) R(x + 12 + i * 6.7, b - 40, 6.7, 30, k.p);
    c.restore();
    curve(Array.from({ length: 21 }, (_, i) => sag(12 + i * 2, 5)), sh(k.c, -1), 1);
  } },
  { id: 'leanto', name: 'Lean-to', w: 2, h: 2, price: 900, draw(x, b) {
    floorShadow(x, b, 64);
    const c = g(), grad = c.createLinearGradient(0, b - 64, 0, b);
    grad.addColorStop(0, sh(k.c, 0)); grad.addColorStop(1, sh(k.c, -2));
    c.fillStyle = grad; c.fillRect(x + 7, b - 64, 50, 64);
    for (const px of [19, 32, 45]) R(x + px, b - 64, 1.5, 62, sh(k.w, -1));
    wood(x + 7, b - 5, 50, 5, sh(k.w, -1));
    cushion(x + 16, b - 12, 26, 8, k.a, 3); R(x + 22, b - 12, 2, 8, sh(k.a, -1)); R(x + 35, b - 12, 2, 8, sh(k.a, -1));
    for (const px of [3, 57]) cyl(x + px, b - 66, 4, 66, k.w);
    cyl(x + 1, b - 68, 62, 5, sh(k.w, 1)); R(x + 1, b - 68, 62, 5, k.w); R(x + 1, b - 64, 62, 1, sh(k.w, -1));
  } },
  { id: 'campkitchen', name: 'Camp kitchen', w: 2, h: 1, price: 680, draw(x, b) {
    floorShadow(x, b, 64);
    // the windscreen behind, its rail of hanging things
    panel(x + 5, b - 46, 54, 21, k.c); R(x + 5, b - 46, 54, 2, k.m); for (const px of [5, 57]) R(x + px, b - 46, 2, 21, k.m);
    R(x + 8, b - 43, 48, 1, sh(k.m, 1));
    line(x + 14, b - 42, x + 14, b - 32, k.m, 1.2); oval(x + 14, b - 31, 2.4, 1.6, k.m);
    line(x + 22, b - 42, x + 22, b - 33, sh(k.w, -1), 1.4); R(x + 20, b - 34, 4, 5, sh(k.w, -1));
    line(x + 48, b - 42, x + 48, b - 36, k.m, 0.8); panel(x + 45, b - 37, 6, 5, k.p);
    // the table, its X legs and shelf, and what's on it
    for (const [a, c] of [[6, 26], [38, 58]]) { line(x + a, b, x + c, b - 22, k.m, 1.8); line(x + c, b, x + a, b - 22, k.m, 1.8); }
    wood(x + 6, b - 11, 52, 2, sh(k.w, -1));
    panel(x + 40, b - 20, 10, 9, k.a); R(x + 43, b - 15, 3, 2, k.m);
    wood(x + 2, b - 25, 60, 3, k.w); R(x + 2, b - 22, 60, 1, sh(k.w, -2));
    ovalShade(x + 14, b - 29, 6, 4.5, k.c); R(x + 8, b - 27, 12, 2, k.c); R(x + 12.5, b - 35, 3, 2, INK); line(x + 20, b - 30, x + 24, b - 33, k.c, 1.6);
    cyl(x + 27, b - 32, 12, 7, k.m); R(x + 26, b - 33, 14, 1.5, sh(k.m, 1)); disc(x + 33, b - 34, 1.2, INK);
    wood(x + 44, b - 27, 14, 2, sh(k.w, 1)); disc(x + 48, b - 28.5, 1.8, '#e85040'); disc(x + 53, b - 28.5, 1.6, '#f0a030');
  } },
  { id: 'lanternpost', name: 'Lantern post', w: 1, h: 1, price: 280, glow: ['g', 'gl'], draw(x, b) {
    floorShadow(x + 6, b, 20);
    panel(x + 9, b - 4, 10, 4, sh(k.w, -1));
    wood(x + 11, b - 76, 4, 72, k.w, 'y');
    curve([[x + 13, b - 76], [x + 13, b - 80], [x + 17, b - 83], [x + 22, b - 82], [x + 24, b - 78], [x + 24, b - 73]], k.m, 1.8);
    curve([[x + 21.5, b - 66], [x + 24, b - 72], [x + 26.5, b - 66]], k.m, 0.9);
    panel(x + 19, b - 66, 10, 3, k.m);
    R(x + 20, b - 63, 8, 11, k.g); R(x + 21, b - 62, 3, 9, k.gl);
    for (const px of [19.5, 27]) R(x + px, b - 63, 1.5, 11, k.m);
    panel(x + 19, b - 52, 10, 3, k.m);
  } },
  { id: 'campchair', name: 'Camping chair', w: 1, h: 1, price: 260, draw(x, b) {
    floorShadow(x, b, 32);
    for (const px of [5, 26]) R(x + px - 1, b - 36, 2, 22, k.m);
    cushion(x + 6, b - 35, 20, 21, k.c, 2); R(x + 6, b - 35, 20, 2, k.a); R(x + 6, b - 16, 20, 2, k.a);
    line(x + 6, b, x + 26, b - 14, k.m, 1.6); line(x + 26, b, x + 6, b - 14, k.m, 1.6);
    const c = g(); c.fillStyle = k.c; c.beginPath(); c.moveTo(x + 5, b - 16); c.quadraticCurveTo(x + 16, b - 11, x + 27, b - 16); c.lineTo(x + 27, b - 13); c.quadraticCurveTo(x + 16, b - 8, x + 5, b - 13); c.closePath(); c.fill();
    for (const px of [1, 23]) panel(x + px, b - 23, 8, 3, k.a);
    disc(x + 29, b - 23, 2, k.m); disc(x + 29, b - 23, 1, sh(k.m, -2));
  } },
  { id: 'campstove', name: 'Camp stove', w: 1, h: 1, price: 420, glow: [FLAME], draw(x, b) {
    floorShadow(x, b, 32);
    panel(x + 4, b - 42, 24, 17, sh(k.c, -1)); R(x + 4, b - 42, 24, 2, k.m);
    for (const px of [1, 29]) poly([[x + px, b - 25], [x + px + 2, b - 25], [x + px + 2, b - 38], [x + px, b - 34]], sh(k.c, -1));
    disc(x + 10, b - 28, 3, FLAME); disc(x + 10, b - 27, 1.6, EMBER);
    cyl(x + 17, b - 33, 10, 7, k.m); R(x + 16, b - 34, 12, 1.5, sh(k.m, 1)); line(x + 27, b - 31, x + 30, b - 31, INK, 1.2);
    R(x + 5, b - 26, 22, 1.5, INK);
    panel(x + 3, b - 25, 26, 8, k.c); for (const px of [10, 22]) disc(x + px, b - 21, 1.6, k.m);
    for (const [a, c] of [[5, 7], [27, 25]]) line(x + a, b, x + c, b - 17, k.m, 1.4);
    R(x + 5, b - 9, 22, 1.2, k.m);
  } },
  { id: 'firewoodrack', name: 'Firewood rack', w: 2, h: 1, price: 450, draw(x, b) {
    floorShadow(x, b, 64);
    for (let row = 0; row < 5; row++) for (let i = 0; i < 6 - (row % 2); i++) {
      const cx = x + 11.5 + i * 8.2 + (row % 2) * 4.1, cy = b - 8.5 - row * 8.4;
      disc(cx, cy, 4.4, sh(k.w, -1)); disc(cx, cy, 3.2, sh(k.w, 1)); disc(cx, cy, 1.4, k.w);
    }
    for (const px of [3, 58]) R(x + px, b - 52, 3, 52, k.m);
    R(x + 3, b - 4, 58, 3, k.m); R(x + 3, b - 52, 58, 2, k.m);
    poly([[x, b - 51], [x + 32, b - 63], [x + 64, b - 51], [x + 64, b - 49], [x + 32, b - 60], [x, b - 49]], k.c);
    R(x + 30, b - 63, 4, 2, sh(k.c, -1));
  } },
  { id: 'canoestand', name: 'Canoe on stands', w: 2, h: 1, price: 1000, draw(x, b) {
    floorShadow(x, b, 64);
    const dk = sh(k.w, -1);
    for (const cx of [12, 52]) { line(x + cx - 6, b, x + cx, b - 16, dk, 2.4); line(x + cx + 6, b, x + cx, b - 16, dk, 2.4); R(x + cx - 2, b - 18, 4, 3, dk); }
    const top = [], keel = [];
    for (let i = 0; i <= 24; i++) { const t = i / 12 - 1, px = x + 32 + t * 30; top.push([px, b - CANOE.top(t)]); keel.push([px, b - CANOE.keel(t)]); }
    poly([...top, ...keel.reverse()], k.c);
    const c = g(); c.save(); c.beginPath(); [...top].forEach(([px, py], i) => i ? c.lineTo(px, py) : c.moveTo(px, py)); c.lineTo(x + 62, b); c.lineTo(x + 2, b); c.closePath(); c.clip();
    R(x, b - 25, 64, 1.4, sh(k.c, 1)); c.restore();
    curve(top, k.w, 2.2);
    curve(keel, sh(k.c, -1), 1);
  } },
  { id: 'packbedroll', name: 'Pack and bedroll', w: 1, h: 1, price: 300, draw(x, b) {
    floorShadow(x, b, 32);
    cushion(x + 8, b - 38, 16, 38, k.c, 3);
    cushion(x + 10, b - 22, 12, 11, sh(k.c, -1), 2); R(x + 10, b - 22, 12, 1.4, k.m);
    for (const px of [11, 20]) R(x + px, b - 38, 1.4, 16, k.m);
    R(x + 8, b - 40, 16, 5, sh(k.c, -1)); R(x + 15, b - 37, 2, 3, BRASS);
    cushion(x + 3, b - 47, 26, 9, k.p, 3); for (const px of [8, 22]) R(x + px, b - 47, 1.6, 9, k.m);
    R(x + 4, b - 43, 24, 1, sh(k.p, -1));
    cushion(x + 2, b - 8, 28, 8, k.a, 3); for (const px of [9, 21]) R(x + px, b - 8, 1.4, 8, sh(k.a, -1));
  } },
  { id: 'rodrack', name: 'Rod rack', w: 1, h: 1, price: 380, draw(x, b) {
    floorShadow(x, b, 32);
    for (const [px, i] of [[9, 0], [16, 1], [23, 2]]) {
      line(x + px, b - 6, x + px + (i - 1) * 0.6, b - 88 + i * 3, INK, 1);
      R(x + px - 1.2, b - 18, 2.4, 12, '#b07a48');
      disc(x + px + 2.4, b - 16, 2.2, k.c); disc(x + px + 2.4, b - 16, 1, sh(k.c, -1));
    }
    for (const px of [3, 26]) wood(x + px, b - 56, 3, 56, k.w, 'y');
    wood(x + 3, b - 56, 26, 4, k.w);
    wood(x + 3, b - 6, 26, 6, sh(k.w, -1));
    panel(x + 7, b - 11, 18, 11, k.a); R(x + 7, b - 8, 18, 1.2, sh(k.a, -1)); R(x + 15, b - 9, 2, 2, k.m);
    curve([[x + 12, b - 11], [x + 16, b - 14], [x + 20, b - 11]], k.m, 1);
  } },
  { id: 'campsign', name: 'Camp signpost', w: 1, h: 1, price: 240, draw(x, b) {
    floorShadow(x + 2, b, 28);
    wood(x + 13, b - 80, 6, 80, k.w, 'y');
    poly([[x + 12.5, b - 80], [x + 16, b - 85], [x + 19.5, b - 80]], sh(k.w, -1));
    const arrow = (x0, x1, y, h, dir, c) => {
      const tip = dir > 0 ? [[x + x1 - 4, y], [x + x1, y + h / 2], [x + x1 - 4, y + h]] : [[x + x0 + 4, y + h], [x + x0, y + h / 2], [x + x0 + 4, y]];
      poly(dir > 0 ? [[x + x0, y], ...tip, [x + x0, y + h]] : [[x + x1, y], [x + x1, y + h], ...tip], c);
      for (let i = 0; i < 4; i++) R(x + x0 + (dir > 0 ? 3 : 6) + i * 3.6, y + h / 2 - 1, 2.4, 2, sh(c, -2));
    };
    arrow(8, 30, b - 74, 8, 1, k.c); arrow(2, 24, b - 62, 8, -1, k.a); arrow(8, 28, b - 50, 7, 1, k.p);
    for (const [cx, rx] of [[9, 4], [16, 4.4], [23, 4]]) rock(x + cx, b - 3, rx, 3, cx);
  } },
  { id: 'moviescreen', name: 'Movie screen', w: 2, h: 1, price: 1200, draw(x, b) {
    floorShadow(x, b, 64);
    for (const [a, c] of [[4, 12], [60, 52]]) line(x + a, b - 30, x + c, b, sh(k.w, -1), 2);
    for (const px of [2, 58]) cyl(x + px, b - 88, 4, 88, k.w);
    R(x + 6, b - 86, 52, 40, INK); R(x + 8, b - 84, 48, 36, k.p); R(x + 8, b - 84, 48, 2, sh(k.p, -1));
    panel(x + 4, b - 92, 56, 6, k.c);
    for (let i = 0; i < 7; i++) { const c = g(); c.fillStyle = k.a; c.beginPath(); c.arc(x + 8 + i * 8, b - 86, 3.4, 0, Math.PI); c.fill(); }
  } },
  { id: 'belltent', name: 'Bell tent', w: 3, h: 2, price: 1500, draw(x, b) {
    floorShadow(x, b, 96);
    const c = g(), cx = x + 48;
    R(cx + 1, b - 98, 1.6, 12, k.m); poly([[cx + 2.6, b - 98], [cx + 11, b - 95], [cx + 2.6, b - 92]], k.c);
    c.fillStyle = sh(k.p, 1); c.beginPath(); c.moveTo(cx - BELL[0][0], b - BELL[0][1]);
    BELL.forEach(([hw, y]) => c.lineTo(cx - hw, b - y)); [...BELL].reverse().forEach(([hw, y]) => c.lineTo(cx + hw, b - y)); c.closePath(); c.fill();
    c.save(); c.clip(); R(cx, b - 90, 48, 70, 'rgba(0,0,0,0.06)'); c.restore();
    R(x + 6, b - 22, 84, 22, k.p); R(x + 6, b - 4, 84, 4, sh(k.p, -1)); R(x + 70, b - 22, 20, 22, 'rgba(0,0,0,0.06)');
    R(x + 2, b - 24, 92, 3, k.c);
    for (const [a, c2] of [[8, 1], [88, 95]]) line(x + a, b - 23, x + c2, b, '#d8d0b8', 0.8);
    // the door, its flaps tied back
    poly([[cx, b - 60], [cx + 12, b], [cx - 12, b]], sh(k.p, -3));
    poly([[cx, b - 60], [cx - 12, b], [cx - 17, b], [cx - 5, b - 54]], sh(k.p, -1)); poly([[cx, b - 60], [cx + 12, b], [cx + 17, b], [cx + 5, b - 54]], sh(k.p, -1));
    for (const s of [-1, 1]) R(cx + s * 10 - 1.5, b - 22, 3, 2, k.c);
  } },
]);
