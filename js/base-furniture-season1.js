/* base-furniture-season1.js  -  three seasonal sets (2026-10-16, the user's ask: a catalogue as big as Animal Crossing's,
   its holiday sets sold only in their windows, js/data/holidays.js): New Year, Valentine's and Egg Day, 13 kinds each,
   each in its own fixed festive colours (`solo`). Every kind carries its `holiday`, so the Furniture store deals it only
   while that holiday is on. Modelled from parts in js/base-models-r.js, which reads the colours here.
   The shapes the models share are drawn by the same curves as theirs: `heartPath()` is js/base-mesh.js's `heart`, and
   `eggPts()` the models' egg profile, so paint and model agree. */

import { R, P, disc, oval, ovalShade, cyl, panel, wood, cushion, glass, leaf, floorShadow, ctx, sh, hash } from './base-paint.js';

export const NY = { gold: '#e8b830', pale: '#f8dc70', navy: '#1e2a5a', red: '#d83838', white: '#f6f4ee', ink: '#26262c',
  silver: '#c8ccd8', wood: '#a8723f', dark: '#6a4426', champ: '#f4dc90', paper: '#ffe2a0', flame: '#fff4b0', hinoki: '#e0b880',
  stone: '#9a9aa6', roof: '#3a4a40', bronze: '#8a6a3a', bamboo: '#a8c060', mochi: '#fbf8f0', mikan: '#f08a20' };
export const VAL = { pink: '#f490b0', rose: '#d8304a', deep: '#a01e3a', blush: '#fcd0dc', choc: '#5a3420', milk: '#8a5a3a',
  white: '#f8f2f0', lace: '#fbd8e4', marble: '#ece8e0', gold: '#e8b830', leaf: '#4a8a3a', flame: '#ffd860', glow: '#ffb0c8',
  seat: '#f6a0bc', lips: '#e8487a', silver: '#c8ccd8', alo: '#f48aa8', belly: '#fcc8d4', foil: '#d8dce8' };
export const EGG = { pink: '#f8b8d0', mint: '#a8e4c8', sky: '#a8d0f4', lilac: '#cdb4f0', butter: '#f8e490', peach: '#f8c0a0',
  grass: '#7cc860', straw: '#e0c070', shell: '#fbf6ea', red: '#e05050', blue: '#4a80d8', brown: '#a0704a', cream: '#f4e0b0',
  fluff: '#fff4dc', glow: '#fff4d8', toge: '#f8f0c8', chansey: '#f8a8b8', exe: '#f8d8cc', twig: '#7a5638', ink: '#303038' };
const PASTEL = [EGG.pink, EGG.mint, EGG.sky, EGG.butter, EGG.lilac, EGG.peach];
const TAU = Math.PI * 2;

/* ---------- paths ---------- */

const fillPath = (c, make) => { const g = ctx(); g.fillStyle = c; g.beginPath(); make(g); g.fill(); };
const poly = (pts, c) => fillPath(c, g => { pts.forEach(([a, b], i) => (i ? g.lineTo(a, b) : g.moveTo(a, b))); g.closePath(); });
function line(pts, c, w = 1) {
  const g = ctx();
  g.strokeStyle = c; g.lineWidth = w; g.beginPath();
  pts.forEach(([a, b], i) => (i ? g.lineTo(a, b) : g.moveTo(a, b)));
  g.stroke();
}
function inside(make, fn) { const g = ctx(); g.save(); g.beginPath(); make(g); g.clip(); try { fn(); } finally { g.restore(); } }
const words = (text, x, y, size, col, w) => {
  const g = ctx();
  g.font = `bold ${size}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = col; g.fillText(text, x, y, w);
};

/** A heart s across, its middle at cx, cy, point down: js/base-mesh.js's `heart` curve, y flipped. */
function heartPath(g, cx, cy, s) {
  const k = s / 2, p = (x, y) => [cx + x * k, cy - y * k];
  g.moveTo(...p(0, -0.9));
  g.bezierCurveTo(...p(-0.2, -0.6), ...p(-1, -0.2), ...p(-1, 0.25));
  g.bezierCurveTo(...p(-1, 0.75), ...p(-0.35, 0.95), ...p(0, 0.55));
  g.bezierCurveTo(...p(0.35, 0.95), ...p(1, 0.75), ...p(1, 0.25));
  g.bezierCurveTo(...p(1, -0.2), ...p(0.2, -0.6), ...p(0, -0.9));
}
const heart = (cx, cy, s, c) => fillPath(c, g => heartPath(g, cx, cy, s));
/** A plump heart: a darker rim, lit up and left, a glint. */
function heartShade(cx, cy, s, c) {
  heart(cx, cy, s, sh(c, -1));
  heart(cx - s * 0.02, cy - s * 0.03, s * 0.9, c);
  oval(cx - s * 0.24, cy - s * 0.2, s * 0.09, s * 0.05, sh(c, 2));
}
function heartLine(cx, cy, s, c, w) { const g = ctx(); g.strokeStyle = c; g.lineWidth = w; g.beginPath(); heartPath(g, cx, cy, s); g.closePath(); g.stroke(); }
const BEZ = [[[0, -0.9], [-0.2, -0.6], [-1, -0.2], [-1, 0.25]], [[-1, 0.25], [-1, 0.75], [-0.35, 0.95], [0, 0.55]],
  [[0, 0.55], [0.35, 0.95], [1, 0.75], [1, 0.25]], [[1, 0.25], [1, -0.2], [0.2, -0.6], [0, -0.9]]];
/** n points round a heart s across at cx, cy (canvas, y down). */
function heartRing(cx, cy, s, n) {
  const out = [], k = s / 2;
  for (let i = 0; i < n; i++) {
    const f = i / n * 4, [a, b, c, d] = BEZ[Math.floor(f)], t = f % 1, m = 1 - t;
    const at = (j) => m * m * m * a[j] + 3 * m * m * t * b[j] + 3 * m * t * t * c[j] + t * t * t * d[j];
    out.push([cx + at(0) * k, cy - at(1) * k]);
  }
  return out;
}

/** An egg's outline, its foot at (cx, foot), R round and H tall, rounder at the bottom (the models' egg profile). */
function eggPts(cx, foot, rad, H, n = 24) {
  const right = [], left = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n * Math.PI, r = rad * Math.sin(t) * (1 + 0.12 * Math.cos(t)), y = foot - H / 2 * (1 - Math.cos(t));
    right.push([cx + r, y]); left.unshift([cx - r, y]);
  }
  return right.concat(left);
}
const eggClip = (pts) => (g) => pts.forEach(([a, b], i) => (i ? g.lineTo(a, b) : g.moveTo(a, b)));
/** A shaded egg; `band` paints a stripe round its middle. */
function egg(cx, foot, r, H, c, band) {
  const pts = eggPts(cx, foot, r, H);
  poly(pts, c);
  inside(eggClip(pts), () => {
    if (band) R(cx - r, foot - H * 0.56, r * 2, H * 0.14, band);
    oval(cx + r * 0.55, foot - H * 0.45, r * 0.7, H * 0.55, 'rgba(60,30,70,0.13)');
  });
  oval(cx - r * 0.35, foot - H * 0.68, r * 0.22, H * 0.1, 'rgba(255,255,255,0.6)');
}
/** A zigzag edge across x0..x1 at y, everything above it filled in c (inside a clip). */
function zigFill(x0, x1, y, top, c, amp = 1.5, period = 4) {
  const pts = [[x0, top]];
  for (let x = x0, i = 0; x <= x1 + period; x += period / 2, i++) pts.push([x, y + (i % 2 ? -amp : amp)]);
  pts.push([x1 + period, top]);
  poly(pts, c);
}
/** A five-point star. */
function star(cx, cy, ro, ri, c) {
  const pts = [];
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? ri : ro; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  poly(pts, c);
}
/** A 2x1 painter seen side on (a narrower view): squeezed to fit. */
const wide = (paint) => function (x, b, vw) {
  if (vw === 64) return paint(x, b);
  const g = ctx();
  g.save(); g.translate(x, 0); g.scale(vw / 64, 1);
  try { paint(0, b); } finally { g.restore(); }
};

/* ---------- New Year ---------- */

/** A coupe of champagne standing at (cx, y). */
function coupe(cx, y) {
  oval(cx, y - 0.5, 2.5, 0.8, '#e8f0f4');
  R(cx - 0.5, y - 4, 1, 3.5, '#dce8f0');
  fillPath(NY.champ, g => g.ellipse(cx, y - 7, 4.5, 3, 0, 0, Math.PI));
  R(cx - 4.5, y - 7.5, 9, 1, '#fffbe8');
  P(cx - 1.5, y - 6, '#fffbe8');
}
/** A party popper from its tip at (tx, ty), leaning `a` from upright. */
function popper(tx, ty, a, c) {
  const ex = tx + Math.sin(a) * 18, ey = ty - Math.cos(a) * 18, px = Math.cos(a) * 4, py = Math.sin(a) * 4;
  poly([[tx, ty], [ex + px, ey + py], [ex - px, ey - py]], c);
  const mx = tx + Math.sin(a) * 11, my = ty - Math.cos(a) * 11, qx = Math.cos(a) * 2.6, qy = Math.sin(a) * 2.6;
  line([[mx - qx, my - qy], [mx + qx, my + qy]], '#ffffff', 1.4);
  fillPath(NY.gold, g => g.ellipse(ex, ey, 4, 1.3, a, 0, TAU));
}
/** A lucky bag: rope handles, a folded top, a lucky coin on it. */
function bag(x0, y0, w, h, c, trim) {
  for (const s of [0.3, 0.7]) { const g = ctx(); g.strokeStyle = sh(trim, -1); g.lineWidth = 1; g.beginPath(); g.arc(x0 + w / 2, y0 - h, w * 0.2, Math.PI, 0); g.stroke(); }
  panel(x0, y0 - h, w, h, c);
  R(x0, y0 - h, w, 3, trim); R(x0, y0 - h + 3, w, 0.6, sh(trim, -1));
  disc(x0 + w / 2, y0 - h / 2 + 1, 4, trim); disc(x0 + w / 2, y0 - h / 2 + 1, 2.8, '#ffffff'); R(x0 + w / 2 - 1, y0 - h / 2, 2, 2, trim);
}
/** The temple bell's profile: [r, y] in painted units from its lip up. */
export const BELL = [[13, 0], [12.5, 1.5], [11, 4], [10, 14], [9.5, 26], [9, 34], [7, 38.5], [3.5, 40], [0, 40]];

const NEWYEAR = [
  // a gold post clock, its hands a minute to midnight, a star on top
  { id: 'nyclock', name: 'Countdown clock', w: 1, h: 1, price: 450, draw(x, b) {
    floorShadow(x + 4, b, 24);
    panel(x + 8, b - 6, 16, 6, NY.navy); R(x + 8, b - 7, 16, 1.5, NY.gold);
    cyl(x + 14, b - 42, 4, 36, NY.gold);
    R(x + 11, b - 45, 10, 3, sh(NY.gold, -1));
    disc(x + 16, b - 58, 14, sh(NY.gold, -1)); disc(x + 16, b - 58, 13, NY.gold); disc(x + 16, b - 58, 11, NY.navy); disc(x + 16, b - 58, 10, NY.white);
    for (let h = 0; h < 12; h++) { const a = h * Math.PI / 6; disc(x + 16 + Math.sin(a) * 8, b - 58 - Math.cos(a) * 8, h % 3 ? 0.6 : 1, NY.ink); }
    line([[x + 16, b - 58], [x + 16, b - 66]], NY.ink, 1.2);
    line([[x + 16, b - 58], [x + 14, b - 63.5]], NY.ink, 1.6);
    disc(x + 16, b - 58, 1.2, NY.red);
    R(x + 15, b - 73, 2, 2, NY.gold);
    star(x + 16, b - 76, 4.5, 2, NY.gold);
  } },
  // a tower of coupes on a pedestal table, three, two and one across
  { id: 'nychampagne', name: 'Champagne tower', w: 1, h: 1, price: 700, draw(x, b) {
    floorShadow(x + 2, b, 28);
    ovalShade(x + 16, b - 2, 7, 2, NY.gold);
    cyl(x + 14, b - 22, 4, 20, NY.gold);
    panel(x + 2, b - 26, 28, 4, NY.white); R(x + 2, b - 23, 28, 1, NY.gold);
    for (let i = 0; i < 3; i++) { const n = 3 - i, y = b - 26 - i * 7; for (let j = 0; j < n; j++) coupe(x + 16 + (j - (n - 1) / 2) * 9, y); }
    for (const [dx, dy] of [[-4, -50], [3, -53], [0, -56], [6, -49], [-6, -54]]) disc(x + 16 + dx, b + dy, 0.7, '#fff8d8');
  } },
  // five party poppers fanned out of a starry bucket, two of them popped
  { id: 'nypopper', name: 'Party-popper stand', w: 1, h: 1, price: 250, draw(x, b) {
    floorShadow(x + 4, b, 24);
    line([[x + 16, b - 28], [x + 13, b - 35], [x + 17, b - 41], [x + 13, b - 48]], '#f478b0', 1.1);
    line([[x + 25, b - 25], [x + 28, b - 32], [x + 24, b - 38], [x + 27, b - 45]], NY.pale, 1.1);
    for (const [dx, dy, c] of [[-8, -44, '#58c8e8'], [-3, -52, NY.gold], [6, -50, '#78d058'], [9, -40, '#a878e0'], [-10, -36, '#f478b0'], [2, -45, '#ffffff']]) R(x + 16 + dx, b + dy, 1.8, 1.2, c);
    [[-0.55, '#f478b0'], [-0.27, '#58c8e8'], [0, NY.gold], [0.27, '#78d058'], [0.55, '#a878e0']].forEach(([a, c], i) => popper(x + 16 + (i - 2) * 1.5, b - 10, a, c));
    poly([[x + 8, b], [x + 24, b], [x + 26, b - 15], [x + 6, b - 15]], NY.navy);
    for (const [sx, sy] of [[11, -6], [21, -9], [16, -11], [13, -12]]) star(x + sx, b + sy, 1.8, 0.8, NY.gold);
    R(x + 5, b - 17, 22, 3, NY.gold); R(x + 5, b - 17, 22, 1, NY.pale);
  } },
  // a paper sky lantern lit on a bamboo tripod, a wish tied to it
  { id: 'nywishlantern', name: 'Lantern of wishes', w: 1, h: 1, price: 380, glow: [NY.paper, '#fff2c8', NY.flame], draw(x, b) {
    floorShadow(x + 4, b, 24);
    line([[x + 6, b], [x + 14, b - 26]], NY.bamboo, 2.2); line([[x + 26, b], [x + 18, b - 26]], NY.bamboo, 2.2);
    cyl(x + 15, b - 26, 2, 26, sh(NY.bamboo, -1));
    R(x + 10, b - 28, 12, 2.5, NY.dark);
    poly([[x + 9, b - 30], [x + 23, b - 30], [x + 26, b - 60], [x + 24, b - 64], [x + 8, b - 64], [x + 6, b - 60]], NY.paper);
    poly([[x + 11, b - 44], [x + 21, b - 44], [x + 23, b - 60], [x + 21, b - 63], [x + 11, b - 63], [x + 9, b - 60]], '#fff2c8');
    for (const f of [0.2, 0.4, 0.6, 0.8]) line([[x + 9 + f * 14, b - 30], [x + 6 + f * 20, b - 62]], sh(NY.paper, -1), 0.5);
    R(x + 7, b - 56, 18, 1.5, NY.red);
    oval(x + 16, b - 31, 4, 1.5, NY.flame);
    line([[x + 24, b - 48], [x + 27.5, b - 41]], NY.ink, 0.5);
    R(x + 26, b - 41, 3.5, 9, NY.red); R(x + 26.6, b - 39, 2.2, 0.5, NY.pale); R(x + 26.6, b - 37, 2.2, 0.5, NY.pale);
  } },
  // a daruma that is a Poké Ball, one eye filled in for a wish
  { id: 'balldaruma', name: 'Lucky Poké Ball daruma', w: 1, h: 1, price: 300, draw(x, b) {
    floorShadow(x + 3, b, 26);
    const cx = x + 16, cy = b - 14;
    ovalShade(cx, cy, 13, 14, NY.white);
    inside(g => g.ellipse(cx, cy, 13, 14, 0, Math.PI, TAU), () => ovalShade(cx, cy, 13, 14, NY.red));
    R(cx - 13, cy - 1.2, 26, 2.4, NY.ink); disc(cx, cy, 3.5, NY.ink); disc(cx, cy, 2.2, NY.white);
    oval(cx, cy - 7.5, 8, 4.8, '#f8ecd8');
    disc(cx - 3.5, cy - 7.5, 2.2, NY.ink); disc(cx - 3.5, cy - 7.5, 1.2, '#ffffff');
    disc(cx + 3.5, cy - 7.5, 2.2, NY.ink); disc(cx + 3.5, cy - 7.5, 1.6, '#ffffff');
    for (const s of [-1, 1]) line([[cx + s * 1.5, cy - 11], [cx + s * 3.5, cy - 12.2], [cx + s * 5.6, cy - 11]], NY.gold, 1.1);
    line([[cx - 2.5, cy - 4], [cx, cy - 3.2], [cx + 2.5, cy - 4]], NY.gold, 0.9);
    P(cx - 8, cy - 9, sh(NY.red, 2));
  } },
  // a log usu with a mound of mochi in it, the kine stood up behind
  { id: 'mochipound', name: 'Mochi pounding set', w: 1, h: 1, price: 550, draw(x, b) {
    floorShadow(x + 2, b, 28);
    cyl(x + 21, b - 56, 3, 38, NY.wood);
    wood(x + 12, b - 65, 20, 9, sh(NY.wood, -1)); R(x + 12, b - 65, 2, 9, NY.dark); R(x + 30, b - 65, 2, 9, NY.dark);
    cyl(x + 5, b - 20, 22, 20, NY.wood);
    R(x + 5, b - 6, 22, 1.8, NY.dark); R(x + 5, b - 17.5, 22, 1.8, NY.dark);
    oval(x + 16, b - 20, 11, 2.6, sh(NY.wood, 1)); oval(x + 16, b - 20, 8.5, 1.8, NY.dark);
    ovalShade(x + 16, b - 22, 7, 3.2, NY.mochi);
  } },
  // three lucky bags stacked, rope handles, a lucky coin on each
  { id: 'luckybags', name: 'Lucky-bag stack', w: 1, h: 1, price: 350, draw(x, b) {
    floorShadow(x, b, 32);
    bag(x + 1, b, 15, 18, NY.red, NY.gold); bag(x + 16, b, 15, 18, NY.gold, NY.red); bag(x + 8, b - 18, 16, 18, NY.red, NY.gold);
  } },
  // a bronze temple bell hung in a roofed frame, the striking log beside it
  { id: 'nybell', name: 'New Year bell', w: 2, h: 1, price: 1300, draw: wide((x, b) => {
    floorShadow(x, b, 64);
    for (const px of [x + 1, x + 54]) { panel(px, b - 5, 9, 5, NY.stone); wood(px + 2, b - 82, 5, 77, NY.dark, 'y'); }
    wood(x, b - 86, 64, 5, NY.dark);
    poly([[x, b - 86], [x + 64, b - 86], [x + 56, b - 95], [x + 8, b - 95]], NY.roof); R(x, b - 87, 64, 1.5, sh(NY.roof, -1));
    R(x + 25, b - 81, 4, 5, NY.ink);
    const pts = BELL.map(([r, y]) => [x + 27 + r, b - 36 - y]).concat(BELL.slice().reverse().map(([r, y]) => [x + 27 - r, b - 36 - y]));
    poly(pts, NY.bronze);
    inside(eggClip(pts), () => {
      R(x + 27 - 6, b - 76, 12, 40, 'rgba(255,230,170,0.18)'); R(x + 31, b - 76, 10, 40, 'rgba(30,20,10,0.2)');
      for (const y of [b - 58, b - 44, b - 39]) R(x + 13, y, 28, 1.2, sh(NY.bronze, -1));
      for (let r = 0; r < 2; r++) for (let i = 0; i < 5; i++) disc(x + 21 + i * 3, b - 70 + r * 5, 0.9, sh(NY.bronze, 1));
    });
    line([[x + 43, b - 81], [x + 43, b - 52]], NY.paper, 0.8); line([[x + 52, b - 81], [x + 52, b - 52]], NY.paper, 0.8);
    wood(x + 41, b - 52, 13, 6, NY.wood); oval(x + 41, b - 49, 1.2, 3, sh(NY.wood, 1));
  }) },
  // a navy banner on a gold rod: HAPPY NEW YEAR in glitter
  { id: 'nybanner', name: 'Happy New Year banner', w: 2, h: 1, layer: 'wall', price: 400, wall(x) {
    line([[x + 4, 14], [x + 32, 5], [x + 60, 14]], NY.gold, 0.8); disc(x + 32, 5, 1.6, NY.silver);
    const pts = [[x + 6, 15], [x + 58, 15], [x + 58, 50], [x + 32, 58], [x + 6, 50]];
    poly(pts, NY.navy);
    line([[x + 8, 17], [x + 56, 17], [x + 56, 48.6], [x + 32, 55.8], [x + 8, 48.6], [x + 8, 17]], NY.gold, 0.8);
    for (let i = 0; i < 70; i++) {
      const gx = x + 9 + hash(i, 3) * 46, gy = 18 + hash(i, 7) * 32;
      if (gy < 48) P(gx, gy, hash(i, 11) < 0.5 ? NY.pale : '#ffffff');
    }
    words('HAPPY', x + 32, 27, 10, NY.gold, 44); words('NEW YEAR', x + 32, 40, 8.5, NY.pale, 46);
    for (const tx of [x + 5, x + 57]) { R(tx, 50, 2, 6, NY.gold); disc(tx + 1, 57.5, 1.6, NY.gold); }
    R(x + 3, 13, 58, 2.6, NY.gold); R(x + 3, 13, 58, 0.8, NY.pale);
    disc(x + 3, 14.3, 2.2, NY.gold); disc(x + 61, 14.3, 2.2, NY.gold);
  } },
  // swags of pennants and tinsel, stars hung under them, confetti between
  { id: 'confettigarland', name: 'Confetti garland', w: 2, h: 1, layer: 'wall', price: 260, wall(x) {
    const sag = (a, c, d, t) => [a + (c - a) * t, 13 + d * Math.sin(Math.PI * t)], COLS = [NY.gold, '#f478b0', '#58c8e8', NY.silver, '#a878e0'];
    for (const [a, c] of [[x + 4, x + 32], [x + 32, x + 60]]) {
      line(Array.from({ length: 13 }, (_, i) => sag(a, c, 24, i / 12)), NY.silver, 2.4);
      for (let i = 1; i < 12; i++) { const [px, py] = sag(a, c, 24, i / 12); P(px - 0.5, py - 1, '#ffffff'); }
      line(Array.from({ length: 13 }, (_, i) => sag(a, c, 12, i / 12)), NY.ink, 0.6);
      for (let i = 1; i < 6; i++) { const [px, py] = sag(a, c, 12, i / 6); poly([[px - 2.2, py], [px + 2.2, py], [px, py + 7]], COLS[(i + (a > x + 20 ? 2 : 0)) % 5]); }
    }
    for (const sx of [x + 18, x + 46]) { line([[sx, 37], [sx, 43]], NY.ink, 0.4); star(sx, 47, 4, 1.8, NY.gold); }
    for (const [cx, cy, c] of [[11, 30, '#58c8e8'], [24, 27, NY.gold], [40, 30, '#f478b0'], [53, 27, '#78d058'], [32, 40, '#a878e0'], [8, 44, NY.gold], [56, 44, '#58c8e8']]) R(x + cx, cy, 1.8, 1.2, c);
    for (const rx of [x + 4, x + 32, x + 60]) { disc(rx, 13, 3.5, sh(NY.gold, -1)); disc(rx, 13, 2.8, NY.gold); disc(rx, 13, 1.2, NY.pale); }
  } },
  // a round table under a white cloth: a top hat, two noisemakers, confetti
  { id: 'tophattable', name: 'Top hat table', w: 1, h: 1, price: 400, draw(x, b) {
    floorShadow(x + 2, b, 28);
    ovalShade(x + 16, b - 2, 7, 2, NY.ink);
    cyl(x + 14.5, b - 15, 3, 13, NY.ink);
    R(x + 2, b - 23, 28, 8, sh(NY.white, -1));
    for (let i = 0; i < 7; i++) disc(x + 4 + i * 4, b - 15, 2, sh(NY.white, -1));
    R(x + 2, b - 15.5, 28, 0.8, NY.gold);
    panel(x + 2, b - 26, 28, 3, NY.white);
    for (const [cx, c] of [[20, '#f478b0'], [26, '#58c8e8'], [6, NY.gold]]) R(x + cx, b - 25.6, 1.6, 0.8, c);
    oval(x + 11, b - 26, 8, 1.8, NY.ink);
    cyl(x + 5.5, b - 41, 11, 15, NY.ink); R(x + 5.5, b - 31, 11, 3, NY.gold);
    oval(x + 11, b - 41, 5.5, 1.2, sh(NY.ink, 1));
    poly([[x + 18, b - 27.6], [x + 18, b - 26.4], [x + 30, b - 25], [x + 30, b - 30]], NY.pale);
    for (let i = 0; i < 4; i++) R(x + 29.5, b - 30 + i * 1.3, 1.5, 0.8, NY.gold);
    poly([[x + 18, b - 30.2], [x + 18.4, b - 29], [x + 28.5, b - 32], [x + 27, b - 36]], NY.silver);
  } },
  // a silver vase of lit sparklers
  { id: 'sparklervase', name: 'Sparkler vase', w: 1, h: 1, price: 280, glow: [NY.flame], draw(x, b) {
    floorShadow(x + 6, b, 20);
    const tips = [[5, -60], [10, -67], [16, -70], [22, -67], [27, -60]];
    for (const [tx, ty] of tips) line([[x + 16, b - 22], [x + tx, b + ty]], '#8a8a94', 0.9);
    for (const [tx, ty] of tips) {
      disc(x + tx, b + ty, 3.6, 'rgba(255,240,170,0.35)');
      for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; line([[x + tx + Math.cos(a) * 1.2, b + ty + Math.sin(a) * 1.2], [x + tx + Math.cos(a) * 3.6, b + ty + Math.sin(a) * 3.6]], NY.flame, 0.7); }
      disc(x + tx, b + ty, 1.6, NY.flame); disc(x + tx, b + ty, 0.8, '#ffffff');
    }
    ovalShade(x + 16, b - 9, 8, 9, NY.silver);
    cyl(x + 12, b - 24, 8, 8, NY.silver); R(x + 11, b - 25, 10, 2, sh(NY.silver, 1));
    R(x + 8.4, b - 11, 15.2, 2, NY.gold);
  } },
  // kagami mochi: two rounds of mochi and a mikan on a sanbo stand
  { id: 'kagamimochi', name: 'Kagami mochi', w: 1, h: 1, price: 220, draw(x, b) {
    floorShadow(x + 4, b, 24);
    wood(x + 8, b - 10, 16, 10, NY.hinoki); oval(x + 16, b - 5, 3.5, 2.5, sh(NY.hinoki, -2));
    wood(x + 4, b - 14, 24, 4, sh(NY.hinoki, 1)); R(x + 4, b - 14, 24, 1, sh(NY.hinoki, 2));
    poly([[x + 9, b - 14], [x + 23, b - 14], [x + 16, b - 9.5]], '#ffffff'); line([[x + 9.5, b - 13.6], [x + 16, b - 10], [x + 22.5, b - 13.6]], NY.red, 0.7);
    ovalShade(x + 16, b - 18.5, 10, 4.5, NY.mochi);
    ovalShade(x + 16, b - 25, 7.5, 3.8, NY.mochi);
    ovalShade(x + 16, b - 31.5, 4.5, 4, NY.mikan);
    leaf(x + 19.5, b - 36, 2.8, 1.3, '#4a9a3a', 0.4);
  } },
].map(f => ({ ...f, group: 'New Year', holiday: 'newyear', solo: true }));

/* ---------- Valentine's ---------- */

/** A rose seen from the front, r round. */
function rose(cx, cy, r, c) {
  disc(cx, cy, r, sh(c, -1)); disc(cx - r * 0.1, cy - r * 0.12, r * 0.82, c);
  const g = ctx(); g.strokeStyle = sh(c, -2); g.lineWidth = 0.4;
  g.beginPath(); g.arc(cx, cy, r * 0.45, 0.3, 4.6); g.stroke();
  g.beginPath(); g.arc(cx + r * 0.1, cy, r * 0.2, 2, 6.6); g.stroke();
  P(cx - r * 0.5, cy - r * 0.55, sh(c, 2));
}
/** A lace panel w across at px: a white frame with an arched top, pink lace with hearts cut through it. */
function lacePanel(px, b, w) {
  const top = b - 70, cx = px + w / 2, arch = (inset) => (g) => { g.moveTo(px + inset, b - 3); g.lineTo(px + inset, top + 10); g.arc(cx, top + 10, w / 2 - inset, Math.PI, 0); g.lineTo(px + w - inset, b - 3); g.closePath(); };
  R(px + 1, b - 3, 3, 3, VAL.gold); R(px + w - 4, b - 3, 3, 3, VAL.gold);
  fillPath(VAL.white, arch(0));
  fillPath(VAL.lace, arch(1.6));
  inside(arch(1.6), () => {
    for (let j = 0; j < 30; j++) for (let i = 0; i < 6; i++) disc(px + 3 + i * 3 + (j % 2) * 1.5, top + 3 + j * 2.2, 0.55, '#fff4f8');
    for (let j = 0; j < 4; j++) { const g = ctx(); g.strokeStyle = sh(VAL.lace, -1); g.lineWidth = 0.5; g.beginPath(); for (let i = 0; i < 5; i++) g.arc(px + 3.6 + i * 3.4, top + 20 + j * 13, 1.7, 0, Math.PI); g.stroke(); }
  });
  const g = ctx();
  g.save(); g.globalCompositeOperation = 'destination-out';
  for (const [hy, hs] of [[b - 40, 9], [b - 56, 5], [b - 22, 5]]) { g.beginPath(); heartPath(g, cx, hy, hs); g.fill(); }
  g.restore();
  R(px, b - 12, w, 1.6, VAL.white);
  disc(cx, top - 0.4, 1.4, VAL.gold);
}

const VALENTINE = [
  // two white lattice posts under a big heart wound with roses
  { id: 'heartarch', name: 'Heart arch', w: 2, h: 1, price: 1100, draw: wide((x, b) => {
    floorShadow(x, b, 64);
    for (const px of [x + 3, x + 55]) {
      panel(px - 1, b - 4, 8, 4, VAL.marble); panel(px, b - 74, 6, 70, VAL.white);
      for (let j = 0; j < 11; j++) R(px + 1, b - 70 + j * 6, 4, 0.8, sh(VAL.white, -1));
    }
    heartLine(x + 32, b - 70, 56, VAL.leaf, 5.5);
    heartRing(x + 32, b - 70, 56, 22).forEach(([rx, ry], i) => {
      leaf(rx + (i % 2 ? 2 : -2), ry + 1.5, 1.6, 1, sh(VAL.leaf, 1), i % 2 ? 0.6 : -0.6);
      rose(rx, ry, 3, i % 2 ? VAL.pink : VAL.rose);
    });
  }) },
  // a silver fountain, chocolate running off three tiers, strawberries round its foot
  { id: 'chocfountain', name: 'Chocolate fountain', w: 1, h: 1, price: 650, draw(x, b) {
    floorShadow(x + 1, b, 30);
    oval(x + 16, b - 3, 15, 3, '#ffffff'); oval(x + 16, b - 3.5, 13, 2.2, sh('#ffffff', -1));
    cyl(x + 8, b - 12, 16, 9, VAL.silver);
    for (let i = 0; i < 7; i++) { const sx = x + 4 + i * 4; disc(sx, b - 4.5, 1.8, VAL.rose); R(sx - 1, b - 6.6, 2, 0.8, VAL.leaf); P(sx - 0.5, b - 4.6, '#ffe0a0'); }
    oval(x + 16, b - 12, 8, 2, VAL.choc);
    cyl(x + 14.5, b - 50, 3, 38, VAL.silver);
    for (const [y, r] of [[b - 23, 8], [b - 34, 6], [b - 45, 4]]) {
      R(x + 16 - r, y, r * 2, 10, VAL.choc); R(x + 16 - r, y, 1.2, 10, sh(VAL.choc, 1));
      for (let d = 0; d < r; d += 2) disc(x + 16 - r + 1 + d * 2, y + 10, 0.9, VAL.choc);
      oval(x + 16, y, r + 1.2, 1.6, VAL.silver); oval(x + 16, y - 0.6, r, 1, VAL.milk);
    }
    ovalShade(x + 16, b - 52, 2.6, 3.2, VAL.silver);
  } },
  // a dozen red roses in a glass vase, a pink bow on it
  { id: 'rosevase', name: 'Rose bouquet vase', w: 1, h: 1, price: 300, draw(x, b) {
    floorShadow(x + 6, b, 20);
    for (const sx of [13, 15, 17, 19]) R(x + sx, b - 30, 0.8, 28, '#3a7a3a');
    glass(x + 10, b - 26, 12, 26, '#d8eef4'); R(x + 10.5, b - 14, 11, 12, 'rgba(160,210,230,0.35)');
    R(x + 10, b - 19, 12, 3, VAL.pink);
    oval(x + 13, b - 17.5, 2.4, 1.6, VAL.pink); oval(x + 19, b - 17.5, 2.4, 1.6, VAL.pink); disc(x + 16, b - 17.5, 1.2, sh(VAL.pink, -1));
    for (const [lx, ly, t] of [[5, -33, -0.6], [27, -33, 0.6], [9, -27, -0.4], [23, -27, 0.4], [16, -28, 0]]) leaf(x + lx, b + ly, 3, 1.6, VAL.leaf, t);
    for (const [rx, ry] of [[16, -45], [11, -42], [21, -42], [7, -37], [16, -39], [25, -37], [11, -33], [21, -33], [16, -31]]) rose(x + rx, b + ry, 3.6, VAL.rose);
  } },
  // five foil heart balloons tied to a little gift box
  { id: 'heartballoons', name: 'Heart balloons', w: 1, h: 1, price: 280, draw(x, b) {
    floorShadow(x + 8, b, 16);
    const BAL = [[16, -72, 14, VAL.rose], [8, -60, 12, VAL.pink], [24, -60, 12, '#e8485e'], [11, -46, 10, VAL.foil], [22, -48, 10, VAL.gold]];
    for (const [cx, cy, s] of BAL) line([[x + 16, b - 8], [x + cx, b + cy + 0.45 * s + 1]], '#e8e8ee', 0.6);
    for (const [cx, cy, s, c] of BAL) { heartShade(x + cx, b + cy, s, c); disc(x + cx, b + cy + 0.45 * s + 0.4, 0.8, sh(c, -1)); }
    panel(x + 11, b - 8, 10, 8, VAL.pink); R(x + 15, b - 8, 2, 8, VAL.rose); R(x + 11, b - 5, 10, 1.6, VAL.rose);
    oval(x + 14, b - 9, 2, 1.3, VAL.rose); oval(x + 18, b - 9, 2, 1.3, VAL.rose);
  } },
  // a Luvdisc plush as the back of a pink pouf, a heart cushion to sit on
  { id: 'luvdiscseat', name: 'Luvdisc pillow seat', w: 1, h: 1, price: 450, draw(x, b) {
    floorShadow(x + 2, b, 28);
    leaf(x + 3, b - 29, 2.6, 4.2, sh(VAL.pink, -1), 0.6); leaf(x + 29, b - 29, 2.6, 4.2, sh(VAL.pink, -1), -0.6);
    heartShade(x + 16, b - 30, 26, VAL.pink);
    for (const ex of [11.5, 20.5]) { disc(x + ex, b - 31, 2.4, '#ffffff'); disc(x + ex + 0.3, b - 30.8, 1.5, '#303048'); P(x + ex - 0.6, b - 32, '#ffffff'); }
    oval(x + 16, b - 25.5, 2.4, 1.4, VAL.lips); R(x + 13.8, b - 25.7, 4.4, 0.4, sh(VAL.lips, -1));
    cushion(x + 4, b - 12, 24, 12, VAL.blush, 4);
    cushion(x + 2, b - 18, 28, 7, VAL.seat, 3);
  } },
  // a pink mailbox on a post: a heart on its door, a love letter slipped in, its flag up
  { id: 'lovemailbox', name: 'Love-letter mailbox', w: 1, h: 1, price: 320, draw(x, b) {
    floorShadow(x + 6, b, 20);
    panel(x + 10, b - 3, 12, 3, VAL.white); panel(x + 14, b - 30, 4, 28, VAL.white);
    R(x + 25.5, b - 52, 1.6, 18, VAL.rose); heartShade(x + 28.5, b - 52, 7, VAL.rose);
    const arch = (i) => (g) => { g.moveTo(x + 6 + i, b - 30 - i); g.lineTo(x + 6 + i, b - 42); g.arc(x + 16, b - 42, 10 - i, Math.PI, 0); g.lineTo(x + 26 - i, b - 30 - i); g.closePath(); };
    fillPath(VAL.pink, arch(0)); R(x + 6, b - 31.2, 20, 1.2, sh(VAL.pink, -1));
    fillPath(sh(VAL.pink, 1), arch(2));
    panel(x + 11, b - 50, 10, 5, '#fffaf4'); heart(x + 16, b - 47.4, 3.4, VAL.rose);
    heartShade(x + 16, b - 38, 9, VAL.rose);
    R(x + 15, b - 33.6, 2, 1.4, VAL.gold);
  } },
  // a table for two: a white cloth and a pink runner, plates, wine and a candle, a chair either side
  { id: 'dinnerfortwo', name: 'Candlelit dinner for two', w: 2, h: 1, price: 1200, glow: [VAL.flame], draw: wide((x, b) => {
    floorShadow(x, b, 64);
    for (const [bx, sx, fx] of [[x + 3, x + 3, x + 16], [x + 57, x + 46, x + 46]]) {
      cyl(bx, b - 20, 2.2, 20, VAL.gold); cyl(fx, b - 20, 2.2, 20, VAL.gold);
      panel(bx, b - 48, 4, 28, VAL.white); disc(bx + 2, b - 48.5, 2.2, VAL.gold);
      panel(sx, b - 21, 15, 3, VAL.white);
      cushion(sx + 1, b - 24, 13, 3.5, VAL.pink, 1.5);
    }
    ovalShade(x + 32, b - 2, 7, 2, VAL.gold); cyl(x + 30.5, b - 14, 3, 12, VAL.gold);
    R(x + 17, b - 26, 30, 12, sh('#ffffff', -1));
    for (let i = 0; i < 8; i++) disc(x + 19 + i * 3.7, b - 14, 1.9, sh('#ffffff', -1));
    panel(x + 17, b - 29, 30, 3, '#ffffff');
    R(x + 28, b - 29, 8, 15, VAL.pink); poly([[x + 28, b - 14], [x + 36, b - 14], [x + 32, b - 11]], VAL.pink);
    oval(x + 21.5, b - 29.5, 4, 1.1, '#ffffff'); oval(x + 42.5, b - 29.5, 4, 1.1, '#ffffff');
    for (const gx of [x + 25.5, x + 38.5]) {
      oval(gx, b - 29.3, 1.6, 0.5, '#dce8f0'); R(gx - 0.4, b - 33, 0.8, 3.6, '#dce8f0');
      fillPath(VAL.deep, g => g.ellipse(gx, b - 35, 2, 2.4, 0, 0, Math.PI)); R(gx - 2, b - 36.6, 4, 1.6, 'rgba(220,235,240,0.6)');
    }
    ovalShade(x + 32, b - 29.5, 2.5, 1, VAL.gold); cyl(x + 30.8, b - 34, 2.4, 4, VAL.gold);
    cyl(x + 31, b - 43, 2, 9, '#fff8ec');
    disc(x + 32, b - 46, 3, 'rgba(255,220,120,0.3)'); oval(x + 32, b - 46, 1.3, 2.4, VAL.flame);
  }) },
  // a heart-shaped wreath of leaves and roses, a satin bow in its notch
  { id: 'heartwreath', name: 'Heart wreath', w: 1, h: 1, layer: 'wall', price: 260, wall(x) {
    disc(x + 16, 9, 1.4, VAL.silver);
    line([[x + 16, 9], [x + 13, 31]], VAL.rose, 1.1); line([[x + 16, 9], [x + 19, 31]], VAL.rose, 1.1);
    heartLine(x + 16, 42, 26, VAL.leaf, 5);
    heartRing(x + 16, 42, 26, 16).forEach(([lx, ly], i) => leaf(lx, ly, 1.6, 1, sh(VAL.leaf, i % 2 ? 1 : -1), i % 2 ? 0.7 : -0.7));
    heartRing(x + 16, 42, 26, 8).forEach(([rx, ry], i) => { if (i !== 0) rose(rx, ry, 2.4, i % 2 ? VAL.pink : VAL.rose); });
    oval(x + 12.5, 34, 3.4, 2.2, VAL.rose); oval(x + 19.5, 34, 3.4, 2.2, VAL.rose);
    poly([[x + 15, 35], [x + 12.5, 41], [x + 14.5, 40.5]], VAL.deep); poly([[x + 17, 35], [x + 19.5, 41], [x + 17.5, 40.5]], VAL.deep);
    disc(x + 16, 34.5, 1.6, sh(VAL.rose, -1));
  } },
  // a marble cherub on a fluted pedestal, a bow and a heart-tipped arrow
  { id: 'cupidstatue', name: 'Cupid statue', w: 1, h: 1, price: 900, draw(x, b) {
    floorShadow(x + 4, b, 24);
    panel(x + 6, b - 6, 20, 6, VAL.marble);
    panel(x + 9, b - 30, 14, 24, sh(VAL.marble, 1)); for (let i = 0; i < 4; i++) R(x + 11 + i * 3, b - 28, 1, 20, sh(VAL.marble, -1));
    panel(x + 6, b - 34, 20, 4, VAL.marble);
    leaf(x + 9, b - 48, 3.6, 6.5, '#ffffff', -0.7); leaf(x + 23, b - 48, 3.6, 6.5, '#ffffff', 0.7);
    ovalShade(x + 13.5, b - 36.5, 2.6, 2.6, VAL.marble); ovalShade(x + 18.5, b - 36.5, 2.6, 2.6, VAL.marble);
    ovalShade(x + 16, b - 43, 5.5, 6.5, VAL.marble);
    line([[x + 12, b - 47], [x + 20, b - 39]], VAL.pink, 1.4);
    ovalShade(x + 16, b - 53.5, 4.8, 4.8, VAL.marble);
    for (const [cx, cy] of [[12.5, -56.5], [14.5, -58.5], [17, -59], [19.5, -57.5], [20.5, -55]]) disc(x + cx, b + cy, 1.3, sh(VAL.marble, -1));
    P(x + 14, b - 54, '#5a5060'); P(x + 17.5, b - 54, '#5a5060'); disc(x + 13, b - 52, 0.8, VAL.blush); disc(x + 19, b - 52, 0.8, VAL.blush);
    R(x + 20, b - 45, 5, 1.6, VAL.marble);
    const g = ctx(); g.strokeStyle = VAL.gold; g.lineWidth = 1.1; g.beginPath(); g.arc(x + 25, b - 44, 6, -1.1, 1.1); g.stroke();
    line([[x + 25 + Math.cos(1.1) * 6, b - 44 - Math.sin(1.1) * 6], [x + 25 + Math.cos(1.1) * 6, b - 44 + Math.sin(1.1) * 6]], '#e8e8ee', 0.4);
    line([[x + 17, b - 44], [x + 28, b - 44]], VAL.gold, 0.7); heart(x + 29.5, b - 44.3, 3.6, VAL.rose);
  } },
  // a glowing pink heart on a gold stand
  { id: 'heartlamp', name: 'Heart lamp', w: 1, h: 1, price: 320, glow: [VAL.glow, '#ffe0ea'], draw(x, b) {
    floorShadow(x + 6, b, 20);
    ovalShade(x + 16, b - 2.5, 8, 2.5, VAL.gold); cyl(x + 15, b - 15, 2, 13, VAL.gold); R(x + 13.5, b - 16.5, 5, 2, sh(VAL.gold, 1));
    heart(x + 16, b - 29, 26, sh(VAL.glow, -1)); heart(x + 16, b - 29.5, 23, VAL.glow); heart(x + 15, b - 31, 12, '#ffe0ea');
  } },
  // a side table, a heart box of chocolates open on it, its lid stood up behind
  { id: 'choctable', name: 'Box of chocolates', w: 1, h: 1, price: 380, draw(x, b) {
    floorShadow(x + 3, b, 26);
    cyl(x + 14.8, b - 21, 2.4, 21, sh(NY.wood, -2)); cyl(x + 7, b - 22, 2.4, 22, sh(NY.wood, -1)); cyl(x + 22.6, b - 22, 2.4, 22, sh(NY.wood, -1));
    wood(x + 3, b - 25, 26, 3.5, NY.wood); R(x + 3, b - 21.5, 26, 1, sh(NY.wood, -2));
    heartShade(x + 16, b - 37, 22, VAL.rose);
    inside(g => heartPath(g, x + 16, b - 37, 22), () => line([[x + 6, b - 46], [x + 26, b - 28]], VAL.gold, 1.6));
    oval(x + 19.5, b - 41, 2.4, 1.6, VAL.gold); oval(x + 23.5, b - 39.5, 2.4, 1.6, VAL.gold); disc(x + 21.5, b - 40, 1, sh(VAL.gold, -1));
    panel(x + 6, b - 29, 20, 4, VAL.deep);
    for (let i = 0; i < 6; i++) { disc(x + 8.5 + i * 3, b - 29.5, 1.5, i % 2 ? VAL.choc : VAL.milk); P(x + 8 + i * 3, b - 30.4, sh(VAL.milk, 2)); }
  } },
  // Alomomola laid out as a rug: a big pink heart of a fish, its fins and its smile
  { id: 'alomomolarug', name: 'Alomomola heart rug', w: 2, h: 2, layer: 'rug', price: 420, high: 0.04, side: 'c', flat() {
    oval(7, 36, 6, 4, sh(VAL.alo, -1)); oval(57, 36, 6, 4, sh(VAL.alo, -1));
    oval(28, 17, 4, 3, sh(VAL.alo, -1)); oval(36, 17, 4, 3, sh(VAL.alo, -1));
    heartShade(32, 34, 54, VAL.alo);
    heart(32, 38, 32, VAL.belly);
    for (const ex of [24, 40]) { disc(ex, 31, 3.4, '#ffffff'); disc(ex + 0.5, 31.5, 2.2, '#303048'); P(ex - 0.5, 30.2, '#ffffff'); }
    oval(32, 39, 3, 2, '#e8607a'); R(29.4, 38.8, 5.2, 0.5, sh('#e8607a', -1));
    heartLine(32, 34, 50, sh(VAL.alo, 1), 0.5);
  } },
  // a three-panel folding screen: white frames, pink lace, hearts cut through it
  { id: 'pinklace', name: 'Pink lace screen', w: 2, h: 1, price: 700, draw: wide((x, b) => {
    floorShadow(x, b, 64);
    for (let i = 0; i < 3; i++) lacePanel(x + 1 + i * 21, b, 20);
  }) },
].map(f => ({ ...f, group: 'Valentine\'s', holiday: 'valentine', solo: true }));

/* ---------- Egg Day ---------- */

/** The giant egg's bands, from its foot up: [height fraction, colour]. */
export const EGG_BANDS = [[0, EGG.lilac], [0.21, EGG.mint], [0.37, EGG.butter], [0.52, EGG.sky], [0.68, EGG.pink], [0.83, EGG.butter]];
/** An egg banded in pastels, zigzags between, dots on its sky band. */
function bandedEgg(cx, foot, r, H) {
  const pts = eggPts(cx, foot, r, H);
  inside(eggClip(pts), () => {
    R(cx - r - 1, foot - H - 1, r * 2 + 2, H + 2, EGG_BANDS[0][1]);
    for (const [f, c] of EGG_BANDS.slice(1)) zigFill(cx - r - 2, cx + r + 2, foot - f * H, foot - H - 2, c, 1.4, 4.4);
    for (let i = 0; i < 5; i++) disc(cx - r * 0.7 + i * r * 0.35, foot - H * 0.6, 0.9, '#ffffff');
    oval(cx + r * 0.55, foot - H * 0.45, r * 0.7, H * 0.55, 'rgba(60,30,70,0.13)');
  });
  oval(cx - r * 0.38, foot - H * 0.7, r * 0.2, H * 0.09, 'rgba(255,255,255,0.6)');
}
/** One of Exeggcute's eggs: pale pink, eyes and a mouth, a crack in its top. */
function exeggcute(cx, foot, i) {
  egg(cx, foot, 4.6, 11, EGG.exe);
  for (const s of [-1, 1]) { disc(cx + s * 1.6, foot - 6.4, 1, EGG.ink); P(cx + s * 1.6 - 0.6, foot - 7.2, '#ffffff'); }
  R(cx - 0.8, foot - 4, 1.6, 0.5, '#a05050');
  if (i % 2 === 0) line([[cx - 2.4, foot - 9.2], [cx - 1, foot - 8.4], [cx, foot - 9.6], [cx + 1.2, foot - 8.6]], sh(EGG.exe, -2), 0.5);
}

const EGGDAY = [
  // a big egg banded in pastels, in a gold ring stand
  { id: 'giantegg', name: 'Giant painted egg', w: 1, h: 1, price: 500, draw(x, b) {
    floorShadow(x + 4, b, 24);
    for (const fx of [9, 16, 23]) R(x + fx - 0.8, b - 5, 1.6, 5, sh(NY.gold, -1));
    bandedEgg(x + 16, b - 3, 12.5, 42);
    R(x + 8, b - 7, 16, 3, NY.gold); R(x + 8, b - 7, 16, 0.8, NY.pale);
  } },
  // a wicker basket of pastel eggs in paper grass, a bow on its handle
  { id: 'egghuntbasket', name: 'Egg hunt basket', w: 1, h: 1, price: 300, draw(x, b) {
    floorShadow(x + 4, b, 24);
    const g = ctx(); g.strokeStyle = sh(EGG.straw, -1); g.lineWidth = 2.4; g.beginPath(); g.arc(x + 16, b - 20, 10.5, Math.PI, 0); g.stroke();
    oval(x + 13, b - 31, 2.6, 1.8, EGG.lilac); oval(x + 19, b - 31, 2.6, 1.8, EGG.lilac); disc(x + 16, b - 31, 1.3, sh(EGG.lilac, -1));
    [[10, -20, EGG.pink], [21.5, -20, EGG.sky], [15.5, -21, EGG.mint], [13, -19, EGG.butter], [19, -19.5, EGG.lilac]].forEach(([ex, ey, c]) => egg(x + ex, b + ey, 3.2, 8.5, c));
    zigFill(x + 5, x + 27, b - 21, b - 18, EGG.grass, 1.6, 2.4);
    poly([[x + 5, b - 19], [x + 27, b - 19], [x + 24, b - 1], [x + 8, b - 1]], EGG.straw);
    for (let j = 0; j < 5; j++) for (let i = 0; i < 6; i++) R(x + 8 + i * 3 + (j % 2) * 1.5, b - 17 + j * 3.4, 2, 1.2, sh(EGG.straw, -1));
    cushion(x + 4, b - 21, 24, 3.5, sh(EGG.straw, 1), 1.5);
  } },
  // a wooden signpost: EGG HUNT one way, eggs the other, an egg on top
  { id: 'eggsign', name: 'Egg hunt signpost', w: 1, h: 1, price: 260, draw(x, b) {
    floorShadow(x + 2, b, 28);
    wood(x + 14, b - 58, 4, 58, NY.wood, 'y');
    egg(x + 16, b - 57.5, 3.6, 9, EGG.mint, EGG.pink);
    poly([[x + 2, b - 50], [x + 26, b - 50], [x + 31, b - 45], [x + 26, b - 40], [x + 2, b - 40]], '#f0d8a8');
    R(x + 2, b - 41, 24, 1, sh('#f0d8a8', -1));
    words('EGG HUNT', x + 14.5, b - 45, 5.2, NY.dark, 22);
    poly([[x + 6, b - 36], [x + 30, b - 36], [x + 30, b - 26], [x + 6, b - 26], [x + 1, b - 31]], '#e8c890');
    R(x + 6, b - 27, 24, 1, sh('#e8c890', -1));
    [[12, EGG.pink], [18, EGG.sky], [24, EGG.butter]].forEach(([ex, c]) => egg(x + ex, b - 27.5, 2.2, 6, c));
    for (const [gx, h, t] of [[9, 7, -2], [12, 9, -1], [20, 8, 1], [23, 6, 2], [11, 5, 1.5], [21, 6, -1.5]]) poly([[x + gx - 1.2, b], [x + gx + 1.2, b], [x + gx + t, b - h]], EGG.grass);
    for (const [fx, fy, c] of [[8, -7, EGG.pink], [24, -6.5, EGG.butter]]) { disc(x + fx, b + fy, 1.6, c); disc(x + fx, b + fy, 0.6, '#ffffff'); }
  } },
  // Togepi's eggshell as a lamp, lit inside, Togepi peeking over its rim
  { id: 'togepilamp', name: 'Togepi egg lamp', w: 1, h: 1, price: 380, glow: [EGG.glow], draw(x, b) {
    floorShadow(x + 5, b, 22);
    ovalShade(x + 16, b - 3, 9, 3, NY.wood);
    const cx = x + 16, hy = b - 30;
    for (const a of [-1, -0.5, 0, 0.5, 1]) {
      const px = Math.sin(a), py = -Math.cos(a), qx = Math.cos(a) * 1.8, qy = Math.sin(a) * 1.8;
      poly([[cx + px * 6.5 - qx, hy + py * 6.5 - qy], [cx + px * 6.5 + qx, hy + py * 6.5 + qy], [cx + px * 11, hy + py * 11]], EGG.toge);
    }
    ovalShade(cx, hy, 7.5, 7.5, EGG.toge);
    oval(cx - 3, hy - 1, 1, 1.6, EGG.ink); oval(cx + 3, hy - 1, 1, 1.6, EGG.ink);
    line([[cx - 1.5, hy + 2.5], [cx, hy + 3.4], [cx + 1.5, hy + 2.5]], EGG.ink, 0.6);
    disc(cx - 5, hy + 1.6, 1, '#f8b8b8'); disc(cx + 5, hy + 1.6, 1, '#f8b8b8');
    const full = eggPts(cx, b - 4, 12, 40), cut = b - 26;
    const right = full.slice(0, 25).filter(([, y]) => y >= cut), left = full.slice(25).filter(([, y]) => y >= cut);
    const shell = (g) => {
      right.forEach(([a, c], i) => (i ? g.lineTo(a, c) : g.moveTo(a, c)));
      for (let i = 0; i <= 8; i++) g.lineTo(cx + 11.8 - i * 23.6 / 8, cut + (i % 2 ? -2.5 : 0));
      left.forEach(([a, c]) => g.lineTo(a, c));
      g.closePath();
    };
    fillPath(EGG.glow, shell);
    inside(shell, () => {
      for (const [tx, c] of [[11, EGG.red], [21, EGG.blue], [5.5, EGG.blue], [27, EGG.red]]) poly([[x + tx - 3.4, b - 9], [x + tx + 3.4, b - 9], [x + tx, b - 16]], c);
      oval(cx + 7, b - 14, 7, 11, 'rgba(120,90,40,0.12)');
    });
    disc(cx - 8, b - 25, 2, EGG.toge); disc(cx + 8, b - 25, 2, EGG.toge);
  } },
  // a round wreath of spring leaves and pastel flowers, three little eggs in it
  { id: 'springwreath', name: 'Spring flower wreath', w: 1, h: 1, layer: 'wall', price: 240, wall(x) {
    disc(x + 16, 10, 1.4, VAL.silver);
    R(x + 15.3, 10, 1.4, 18, EGG.mint);
    const g = ctx(); g.strokeStyle = '#5a9a48'; g.lineWidth = 5.5; g.beginPath(); g.arc(x + 16, 40, 10.5, 0, TAU); g.stroke();
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; leaf(x + 16 + Math.cos(a) * 10.5, 40 + Math.sin(a) * 10.5, 1.8, 1.1, i % 2 ? '#7ab858' : '#4a8a3a', Math.cos(a)); }
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU + 0.3, fx = x + 16 + Math.cos(a) * 10.5, fy = 40 + Math.sin(a) * 10.5, c = [EGG.pink, EGG.butter, EGG.lilac, '#ffffff'][i % 4];
      for (let p = 0; p < 5; p++) disc(fx + Math.cos(p * 1.26) * 1.5, fy + Math.sin(p * 1.26) * 1.5, 1.1, c);
      disc(fx, fy, 0.8, i % 4 === 1 ? '#f0a030' : '#f8d040');
    }
    egg(x + 7, 46, 2, 5, EGG.sky); egg(x + 25.5, 46, 2, 5, EGG.peach); egg(x + 25, 34, 2, 5, EGG.mint);
    oval(x + 13, 51.5, 3, 2, EGG.mint); oval(x + 19, 51.5, 3, 2, EGG.mint);
    poly([[x + 15, 52], [x + 13, 58], [x + 15, 57.5]], sh(EGG.mint, -1)); poly([[x + 17, 52], [x + 19, 58], [x + 17, 57.5]], sh(EGG.mint, -1));
    disc(x + 16, 51.8, 1.4, sh(EGG.mint, -1));
  } },
  // bare branches in a white pot, pastel eggs hung on them, a few blossoms
  { id: 'eggtree', name: 'Egg tree', w: 1, h: 1, price: 450, draw(x, b) {
    floorShadow(x + 6, b, 20);
    for (const br of EGG_TREE.branches) line(br.map(([px, py]) => [x + px, b + py]), EGG.twig, 1.6);
    EGG_TREE.eggs.forEach(([ex, ey], i) => { line([[x + ex, b + ey], [x + ex, b + ey + 3]], '#f4f0ec', 0.4); egg(x + ex, b + ey + 9.5, 2.6, 6.5, PASTEL[i % 6], i % 3 ? null : '#ffffff'); });
    for (const [bx, by] of [[4, -62], [10, -74], [17, -79], [24, -72], [29, -58], [9, -46]]) { disc(x + bx, b + by, 1.4, EGG.pink); P(x + bx - 0.4, b + by - 0.4, '#ffffff'); }
    cyl(x + 10, b - 14, 12, 14, '#f4f0ec'); R(x + 10, b - 9, 12, 2.5, EGG.pink);
    R(x + 9, b - 15.5, 14, 2.5, sh('#f4f0ec', 1)); R(x + 10, b - 14.5, 12, 1, '#4a3020');
  } },
  // an arch under Buneary's ears, wound with eggs and flowers
  { id: 'bunearyarch', name: 'Buneary arch', w: 2, h: 1, price: 1000, draw: wide((x, b) => {
    floorShadow(x, b, 64);
    leaf(x + 23, b - 83, 5.5, 12, EGG.brown, 1); leaf(x + 23.4, b - 82, 2.6, 8.5, '#f4b0b8', 1);
    leaf(x + 41, b - 83, 5.5, 12, EGG.brown, -1); leaf(x + 40.6, b - 82, 2.6, 8.5, '#f4b0b8', -1);
    for (const px of [x + 3, x + 55]) { panel(px - 1, b - 4, 8, 4, sh(EGG.cream, -1)); panel(px, b - 46, 6, 42, EGG.cream); R(px + 1, b - 46, 1, 42, sh(EGG.cream, 1)); }
    const g = ctx(); g.strokeStyle = EGG.cream; g.lineWidth = 6; g.beginPath(); g.arc(x + 32, b - 46, 26, Math.PI, TAU); g.stroke();
    g.strokeStyle = sh(EGG.cream, -1); g.lineWidth = 0.8; g.beginPath(); g.arc(x + 32, b - 46, 23.4, Math.PI, TAU); g.stroke();
    BUN_EGGS.forEach((a, i) => egg(x + 32 + Math.cos(a) * 26, b - 46 - Math.sin(a) * 26 + 3.5, 2.6, 7, PASTEL[i % 6], i % 2 ? '#ffffff' : null));
    for (const a of [2.9, 2.35, 1.85, 1.3, 0.8, 0.25]) { const fx = x + 32 + Math.cos(a) * 26, fy = b - 46 - Math.sin(a) * 26; disc(fx, fy, 1.6, '#ffffff'); disc(fx, fy, 0.7, EGG.butter); }
    for (const fx of [x + 24, x + 40]) { disc(fx, b - 72, 4.5, EGG.fluff); disc(fx - 3, b - 70, 2.6, EGG.fluff); disc(fx + 3, b - 70, 2.6, EGG.fluff); }
  }) },
  // a small table under a mint cloth, three egg cups with painted eggs
  { id: 'eggcuptable', name: 'Egg cup table', w: 1, h: 1, price: 360, draw(x, b) {
    floorShadow(x + 2, b, 28);
    for (const lx of [x + 4, x + 25]) cyl(lx, b - 18, 3, 18, NY.wood);
    R(x + 2, b - 26, 28, 9, EGG.mint);
    for (let i = 0; i < 7; i++) R(x + 3 + i * 4, b - 26, 2, 9, 'rgba(255,255,255,0.35)');
    for (let j = 0; j < 2; j++) R(x + 2, b - 23 + j * 4, 28, 2, 'rgba(255,255,255,0.3)');
    R(x + 2, b - 26, 28, 1.5, sh(EGG.mint, 1)); R(x + 2, b - 17.8, 28, 0.8, sh(EGG.mint, -1));
    for (const [cx, cup, eg, band] of EGG_CUPS) {
      oval(x + cx, b - 26.5, 2.6, 0.8, sh(cup, -1)); R(x + cx - 0.8, b - 29.5, 1.6, 3, cup);
      egg(x + cx, b - 30, 2.9, 7.5, eg, band);
      fillPath(cup, g => g.ellipse(x + cx, b - 32, 3.2, 3, 0, 0, Math.PI)); R(x + cx - 3.2, b - 32.5, 6.4, 1, sh(cup, 1));
    }
  } },
  // an egg-shaped rug in pastel bands
  { id: 'eggrug', name: 'Pastel egg rug', w: 2, h: 2, layer: 'rug', price: 320, high: 0.04, side: 'c', flat() {
    const pts = eggPts(32, 62, 26, 60);
    inside(eggClip(pts), () => {
      R(0, 0, 64, 64, EGG_BANDS[0][1]);
      for (const [f, c] of EGG_BANDS.slice(1)) zigFill(2, 62, 62 - f * 60, 0, c, 2, 6);
      for (let i = 0; i < 7; i++) disc(14 + i * 6, 62 - 0.6 * 60, 1.4, '#ffffff');
      for (let i = 0; i < 5; i++) disc(20 + i * 6, 62 - 0.3 * 60, 1.2, '#ffffff');
    });
    const g = ctx(); g.setLineDash([1.5, 1.5]); g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 0.6;
    g.beginPath(); eggPts(32, 60, 23.5, 56).forEach(([a, c], i) => (i ? g.lineTo(a, c) : g.moveTo(a, c))); g.closePath(); g.stroke(); g.setLineDash([]);
  } },
  // a cracked half eggshell to sit in, a pink cushion inside, on a gold foot
  { id: 'eggshellchair', name: 'Egg-shell chair', w: 1, h: 1, price: 550, draw(x, b) {
    floorShadow(x + 3, b, 26);
    ovalShade(x + 16, b - 1.5, 7, 1.5, NY.gold); cyl(x + 14.5, b - 4.5, 3, 3.5, NY.gold);
    egg(x + 16, b - 4, 14, 46, EGG.shell);
    const hole = (g) => { for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, k = i % 2 ? 1.08 : 0.94; const px = x + 16 + Math.cos(a) * 10 * k, py = b - 28 + Math.sin(a) * 15 * k; i ? g.lineTo(px, py) : g.moveTo(px, py); } g.closePath(); };
    fillPath('#ece2cc', hole);
    inside(hole, () => R(x + 4, b - 46, 24, 6, 'rgba(90,70,40,0.2)'));
    cushion(x + 9, b - 41, 14, 20, EGG.pink, 5);
    cushion(x + 6, b - 19, 20, 7, sh(EGG.pink, 1), 3);
  } },
  // Chansey's round pink body as a nest, its pouch in front, its lucky egg in it
  { id: 'chanseynest', name: 'Chansey nest', w: 1, h: 1, price: 480, draw(x, b) {
    floorShadow(x + 1, b, 30);
    for (const [cx, cy, t] of [[4, -24, 0.8], [3, -19, 1], [28, -24, -0.8], [29, -19, -1]]) leaf(x + cx, b + cy, 1.8, 4, EGG.chansey, t);
    egg(x + 9, b - 17, 3.4, 8, EGG.sky); egg(x + 23, b - 17, 3.4, 8, EGG.butter);
    egg(x + 16, b - 15, 6.5, 17, '#fffaf2');
    for (let i = 0; i < 9; i++) line([[x + 3 + i * 3, b - 16], [x + 5 + i * 3, b - 18.5]], i % 2 ? EGG.straw : sh(EGG.straw, -1), 0.8);
    fillPath(EGG.chansey, g => g.ellipse(x + 16, b - 16, 15, 15.5, 0, 0, Math.PI));
    cushion(x + 1, b - 19, 30, 6, sh(EGG.chansey, 1), 3);
    oval(x + 16, b - 8.5, 9, 5, '#fff8f4'); R(x + 8, b - 12.6, 16, 0.8, sh('#fff8f4', -1));
    oval(x + 8, b - 5, 2.2, 1.2, sh(EGG.chansey, -1)); oval(x + 24, b - 5, 2.2, 1.2, sh(EGG.chansey, -1));
  } },
  // a planter box of Exeggcute, six eggs with faces among sprouts
  { id: 'exeggcuteplanter', name: 'Exeggcute planter', w: 1, h: 1, price: 400, draw(x, b) {
    floorShadow(x + 2, b, 28);
    leaf(x + 12, b - 31, 2.2, 4.5, '#5aa848', -0.5); leaf(x + 20, b - 32, 2.2, 4.5, '#5aa848', 0.5); leaf(x + 16, b - 34, 2, 4.5, '#6ab858', 0);
    [[9, -18], [16, -20], [23, -18], [8, -11], [16, -12], [24, -11]].forEach(([ex, ey], i) => exeggcute(x + ex, b + ey, i));
    wood(x + 3, b - 14, 26, 14, NY.wood); for (const y of [b - 9.5, b - 5]) R(x + 3, y, 26, 0.8, sh(NY.wood, -2));
    R(x + 3, b - 14, 2, 14, sh(NY.wood, -1)); R(x + 27, b - 14, 2, 14, sh(NY.wood, -1));
  } },
  // a table for dyeing eggs: cups of dye, a wire dipper, a drying rack, a carton of eggs below
  { id: 'eggdyestation', name: 'Egg-dyeing station', w: 2, h: 1, price: 750, draw: wide((x, b) => {
    floorShadow(x, b, 64);
    for (const lx of [x + 3, x + 58]) cyl(lx, b - 28, 3, 28, NY.wood);
    wood(x + 2, b - 10, 60, 2.5, sh(NY.wood, -1));
    panel(x + 8, b - 15, 22, 5, '#d8c8a8'); for (let i = 0; i < 5; i++) ovalShade(x + 10.5 + i * 4.3, b - 15.5, 1.8, 2.2, EGG.shell);
    wood(x + 1, b - 31, 62, 4, NY.wood);
    [EGG.pink, EGG.mint, EGG.sky, EGG.butter].forEach((c, i) => {
      const cx = x + 5 + i * 9;
      R(cx + 0.6, b - 37, 5.8, 5.6, sh(c, -1)); glass(cx, b - 41, 7, 10, 'rgba(228,242,246,0.55)'); R(cx, b - 41, 7, 0.8, '#ffffff');
    });
    line([[x + 17.5, b - 35], [x + 20, b - 48]], NY.silver, 0.7); const g = ctx(); g.strokeStyle = NY.silver; g.lineWidth = 0.7; g.beginPath(); g.arc(x + 17.5, b - 34, 1.8, 0, TAU); g.stroke();
    wood(x + 41, b - 34, 20, 3, sh(NY.wood, 1));
    [EGG.lilac, EGG.peach, EGG.mint, EGG.pink].forEach((c, i) => { R(x + 43.5 + i * 4.5, b - 36, 1, 2, NY.dark); egg(x + 44 + i * 4.5, b - 35, 2, 5.6, c, '#ffffff'); });
  }) },
].map(f => ({ ...f, group: 'Egg Day', holiday: 'eggday', solo: true }));

/* where the models find what the paintings placed */
/** The egg tree's branches ([x, y] up from the floor line) and the points its eggs hang from. */
export const EGG_TREE = {
  branches: [[[16, -14], [15, -30], [9, -46], [4, -62]], [[15, -30], [12, -55], [10, -74]], [[16, -14], [17, -36], [16, -58], [17, -79]],
    [[17, -36], [22, -52], [24, -72]], [[16, -22], [23, -38], [29, -58]]],
  eggs: [[7, -52.4], [12, -38], [11, -64.5], [16.5, -47], [16.6, -70], [21, -48.8], [23.4, -66], [21, -33.4], [27, -51.3]],
};
/** Where the eggs sit round the Buneary arch, as angles from its right foot. */
export const BUN_EGGS = [2.65, 2.1, 1.57, 1.05, 0.5];
/** The egg cups: [x, cup, egg, band]. */
export const EGG_CUPS = [[9, EGG.butter, EGG.pink, EGG.sky], [16, EGG.sky, EGG.lilac, EGG.butter], [23, EGG.pink, EGG.mint, '#ffffff']];

export const SEASON_KINDS_1 = [...NEWYEAR, ...VALENTINE, ...EGGDAY];
