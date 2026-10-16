/* base-furniture-yard3.js  -  the backyard's Sports and Buildings shelves (the user's ask, 2026-10-16: a catalogue as big
   as Animal Crossing's, every piece a "3D detailed CLEAN" model, optimised): thirty outdoor kinds for Smeargle's garden
   catalogue (js/garden-shop.js's Sports and Buildings tabs), each modelled from parts in js/base-models-x.js. Painted
   from the front like js/base-furniture-yard.js's, in the theme's palette, but the putting green and the agility ladder,
   flat ones painted from above. A net is a pale veil under its mesh, as the model's net reads from the front. */

import { k, sh, R, panel, wood, cushion, disc, oval, ovalShade, cyl, leaf, foliage, speckle, floorShadow, glass, sphere, ctx } from './base-paint.js';

export const YARD_KINDS_3 = [];
const add = (yard, list) => list.forEach(f => YARD_KINDS_3.push({ group: 'Yard', outdoor: true, yard, ...f }));

const TAU = Math.PI * 2;
const INK = '#2c2c34', WHITE = '#f6f6f2', ORANGE = '#e87a30', STRAW = '#d8b868', BAMBOO = '#c8b060', STONE = '#9a9488',
  LOG = '#d8b07a', BARK = '#7a5232', TURF = '#58b848', FRINGE = '#3e8a36', SAND = '#ecd6a2', HANDLE = '#b88a50',
  STEEL = '#a8acb4', LIT = '#ffcc40', HOLE = '#2a2430', BALL = '#d8e858', PIDGEY = '#b8844a';
const BOTTLES = ['#5aa848', '#c85a3a', '#e8c040', '#5a8ad8'];

const line = (x0, y0, x1, y1, c, w = 2) => { const g = ctx(); g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
const curve = (pts, c, w = 2) => { const g = ctx(); g.strokeStyle = c; g.lineWidth = w; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); };
const poly = (pts, c) => { const g = ctx(); g.fillStyle = c; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill(); };
/** A half disc hanging down from y: a valance's scallop. */
const scallop = (cx, y, r, c) => { const g = ctx(); g.fillStyle = c; g.beginPath(); g.arc(cx, y, r, 0, Math.PI); g.fill(); };
/** A net: a pale veil, its mesh `cell` apart over it. */
function net(x, y, w, h, ink = INK, cell = 3) {
  R(x, y, w, h, 'rgba(240,244,248,0.6)');
  const g = ctx();
  g.save(); g.strokeStyle = ink; g.globalAlpha *= 0.7; g.lineWidth = 0.5; g.beginPath();
  for (let i = x; i <= x + w + 0.01; i += cell) { g.moveTo(i, y); g.lineTo(i, y + h); }
  for (let j = y + h; j >= y - 0.01; j -= cell) { g.moveTo(x, j); g.lineTo(x + w, j); }
  g.stroke(); g.restore();
}
/** A Poké Ball's top colour in the theme, as js/base-furniture-rooms.js's ballTop(). */
const ballTop = () => (k.c === '#f4f4f0' ? k.w : k.c);
/* a scoreboard digit, 10 x 18, as seven segments */
const SEGS = { a: [1, 0, 8, 2], b: [8, 1, 2, 8], c: [8, 9, 2, 8], d: [1, 16, 8, 2], e: [0, 9, 2, 8], f: [0, 1, 2, 8], g: [1, 8, 8, 2] };
const DIGITS = ['abcdef', 'bc', 'abged', 'abgcd', 'fgbc', 'afgcd', 'afgedc', 'abc', 'abcdefg', 'abcdfg'];
const digit = (paint, x, y, n, c) => { for (const s of DIGITS[n]) { const [a, b, w, h] = SEGS[s]; paint(x + a, y + b, w, h, c); } };
/** A bowling pin `s` big standing on `base`. */
function pin(cx, base, s = 1, tone = 0) {
  const w = sh(WHITE, tone);
  ovalShade(cx, base - 5 * s, 3 * s, 5 * s, w);
  R(cx - 1.2 * s, base - 12 * s, 2.4 * s, 4.5 * s, w);
  ovalShade(cx, base - 13.5 * s, 1.9 * s, 2.4 * s, w);
  for (const y of [11.2, 9.8]) R(cx - 1.4 * s, base - y * s, 2.8 * s, 0.8 * s, sh(k.c, tone));
}

add('Sports', [
  { id: 'basketballhoop', name: 'Basketball hoop', w: 1, h: 2, price: 700, draw(x, b) {
    floorShadow(x + 2, b, 28);
    panel(x + 6, b - 10, 20, 10, k.m, 2); R(x + 6, b - 3, 20, 3, sh(k.m, -1));
    cyl(x + 14, b - 94, 4, 84, sh(k.m, -1));
    // the backboard, its border and the shooter's square, the rim and its net
    panel(x + 2, b - 106, 28, 24, WHITE, 2);
    for (const [a, c, w, h] of [[2, 106, 28, 2], [2, 84, 28, 2], [2, 106, 2, 24], [28, 106, 2, 24], [11, 96, 10, 1.5], [11, 96, 1.5, 10], [19.5, 96, 1.5, 10]]) R(x + a, b - c, w, h, k.c);
    R(x + 9, b - 86, 14, 2, ORANGE);
    poly([[x + 9, b - 84], [x + 23, b - 84], [x + 21, b - 73], [x + 11, b - 73]], 'rgba(240,244,248,0.6)');
    for (let i = 0; i <= 4; i++) line(x + 9 + i * 3.5, b - 84, x + 11 + i * 2.5, b - 73, '#d8dce4', 0.6);
    for (const y of [80, 76]) line(x + 10, b - y, x + 22, b - y, '#d8dce4', 0.6);
    sphere(x + 26, b - 5, 5, ORANGE); curve([[x + 21.5, b - 6], [x + 26, b - 4.5], [x + 30.5, b - 6]], INK, 0.5); line(x + 26, b - 10, x + 26, b, INK, 0.5);
  } },
  { id: 'footballgoal', name: 'Football goal', w: 2, h: 1, price: 650, draw(x, b, vw) {
    floorShadow(x, b, vw);
    net(x + 5, b - 42, 54, 42, '#a8acb8', 4);
    for (const px of [x + 2, x + 58.5]) { cyl(px, b - 45, 3.5, 45, k.p); R(px, b - 6, 3.5, 6, k.c); }
    R(x + 2, b - 45, 60, 3.5, k.p); R(x + 2, b - 45, 60, 1, sh(k.p, 1));
    sphere(x + 22, b - 6, 6, WHITE);
    for (const [px, py, r] of [[22, 6, 1.8], [18, 9, 1.2], [26, 9, 1.2], [19, 2.5, 1.2], [25.5, 2.5, 1.2]]) disc(x + px, b - py, r, INK);
  } },
  { id: 'tennisnet', name: 'Tennis net', w: 2, h: 1, price: 450, draw(x, b, vw) {
    floorShadow(x, b, vw);
    net(x + 6, b - 30, 52, 27, INK, 3);
    R(x + 6, b - 32, 52, 3, WHITE); R(x + 31, b - 30, 2, 27, WHITE); R(x + 6, b - 3.5, 52, 1, sh(WHITE, -1));
    for (const px of [x + 2, x + 58]) { cyl(px, b - 35, 4, 35, k.c); R(px - 1, b - 2, 6, 2, sh(k.c, -1)); disc(px + 2, b - 35, 2, sh(k.c, 1)); }
    R(x, b - 25, 2, 2, k.m); R(x, b - 27, 1, 4, k.m);
    sphere(x + 46, b - 3, 3, BALL);
    ctx().strokeStyle = k.a; ctx().lineWidth = 1.2; ctx().beginPath(); ctx().ellipse(x + 20, b - 1.5, 6, 1.5, 0, 0, TAU); ctx().stroke();
    line(x + 26, b - 1.5, x + 33, b - 1.5, INK, 1.4);
  } },
  { id: 'battingcage', name: 'Batting cage', w: 2, h: 2, price: 1100, draw(x, b, vw) {
    floorShadow(x, b, vw);
    net(x + 4, b - 78, 56, 78, INK, 4);
    R(x + 4, b - 3, 56, 3, '#4a8a4a');
    // the tee and its ball, a bat leaning, a bucket of balls
    oval(x + 32, b - 2, 6, 2, INK); cyl(x + 31, b - 26, 2, 24, INK); disc(x + 32, b - 28.5, 3, WHITE);
    line(x + 52, b - 2, x + 55.5, b - 24, k.w, 2.2); line(x + 55.5, b - 24, x + 58, b - 37, k.w, 4.2);
    poly([[x + 10, b - 14], [x + 22, b - 14], [x + 21, b], [x + 11, b]], k.c); R(x + 10, b - 14, 12, 1.5, sh(k.c, 1));
    for (let i = 0; i < 3; i++) disc(x + 12.5 + i * 3.5, b - 15, 2, WHITE);
    for (const px of [x + 2, x + 59]) cyl(px, b - 80, 3, 80, k.m);
    R(x + 2, b - 80, 60, 3, k.m); R(x + 2, b - 80, 60, 1, sh(k.m, 1));
  } },
  { id: 'croquetset', name: 'Croquet set', w: 1, h: 1, price: 280, draw(x, b) {
    floorShadow(x + 2, b, 28);
    for (const px of [x + 3, x + 26]) wood(px, b - 30, 3, 30, k.w, 'y');
    const heads = [k.c, k.a, '#3a6ac8', INK];
    heads.forEach((c, i) => { const px = x + 8.8 + i * 5.3; cyl(px - 0.8, b - 40, 1.6, 30, sh(k.w, 1)); disc(px, b - 40, 1, sh(k.w, 1)); });
    wood(x + 3, b - 31, 26, 3, sh(k.w, 1));
    wood(x + 3, b - 6, 26, 6, k.w);
    heads.forEach((c, i) => panel(x + 5.3 + i * 5.3, b - 11, 7, 5, c, 1));
    sphere(x + 6, b - 3, 3, k.c); sphere(x + 13, b - 3, 3, '#3a6ac8');
    ctx().strokeStyle = WHITE; ctx().lineWidth = 0.9; ctx().beginPath(); ctx().arc(x + 26, b, 4, Math.PI, TAU); ctx().stroke();
  } },
  { id: 'badmintonnet', name: 'Badminton net', w: 2, h: 1, price: 420, draw(x, b, vw) {
    floorShadow(x, b, vw);
    net(x + 5, b - 58, 54, 16, INK, 3);
    R(x + 5, b - 60, 54, 2.5, WHITE);
    for (const px of [x + 2.5, x + 58.5]) { cyl(px, b - 62, 3, 62, k.m); R(px - 2.5, b - 2.5, 8, 2.5, sh(k.m, -1)); disc(px + 1.5, b - 62, 1.8, k.c); }
    // a racket leaning on the post, a shuttlecock on the grass
    const g = ctx();
    g.fillStyle = 'rgba(240,244,248,0.6)'; g.beginPath(); g.ellipse(x + 53.5, b - 21, 4, 6, 0.3, 0, TAU); g.fill();
    g.strokeStyle = k.c; g.lineWidth = 1.4; g.beginPath(); g.ellipse(x + 53.5, b - 21, 4, 6, 0.3, 0, TAU); g.stroke();
    line(x + 51.6, b - 15.3, x + 48.5, b - 2, k.c, 1.2); line(x + 49.8, b - 7.5, x + 48.5, b - 2, k.a, 1.8);
    poly([[x + 19.5, b - 3], [x + 22.5, b - 3], [x + 24.5, b - 10], [x + 17.5, b - 10]], WHITE); disc(x + 21, b - 2, 2, k.a);
  } },
  { id: 'volleyballnet', name: 'Volleyball net', w: 2, h: 1, price: 520, draw(x, b, vw) {
    floorShadow(x, b, vw);
    net(x + 5, b - 78, 54, 20, INK, 3);
    R(x + 5, b - 80, 54, 2.5, WHITE); R(x + 5, b - 59, 54, 1.5, WHITE);
    for (const ax of [x + 7, x + 56]) for (let i = 0; i < 5; i++) R(ax, b - 92 + i * 2.4, 1.2, 2.4, i % 2 ? WHITE : '#e04040');
    for (const px of [x + 2, x + 59]) { cyl(px, b - 82, 3, 82, k.c); cushion(px - 1.5, b - 30, 6, 28, k.a, 2); R(px - 2, b - 2, 7, 2, sh(k.m, -1)); }
    sphere(x + 42, b - 6, 6, WHITE);
    curve([[x + 37, b - 9], [x + 42, b - 7], [x + 47, b - 9]], k.c, 1.6); curve([[x + 38, b - 3], [x + 42, b - 5], [x + 46, b - 2.5]], k.a, 1.6);
  } },
  { id: 'puttinggreen', name: 'Putting green', w: 2, h: 2, price: 600, high: 0.06, side: 'leaf', flat(w, h) {
    const ring = (f) => Array.from({ length: 20 }, (_, i) => { const a = i / 20 * TAU, r = (0.86 + Math.sin(a * 2 + 0.6) * 0.07 + Math.cos(a * 3) * 0.04) * f; return [w / 2 + Math.cos(a) * r * w / 2, h / 2 + Math.sin(a) * r * h / 2]; });
    poly(ring(1), FRINGE); poly(ring(0.9), TURF);
    for (let i = 0; i < 5; i++) R(8 + i * 10, 10, 5, h - 20, 'rgba(255,255,255,0.07)');
    speckle(6, 6, w - 12, h - 12, sh(TURF, 1), 3, 0.05);
    oval(17, 20, 8, 5, SAND); speckle(10, 16, 14, 8, sh(SAND, -1), 4, 0.1);
    disc(44, 22, 3, '#1e2a1e'); R(43.5, 12, 1, 10, WHITE); poly([[44.5, 12], [53, 14.5], [44.5, 17]], k.c);
    disc(22, 46, 2.2, '#ffffff');
    line(31, 49, 45, 40, k.m, 1.4); R(27, 48, 6, 3, k.m); line(41, 42.5, 45, 40, k.a, 2.2);
  } },
  { id: 'bowlingpins', name: 'Bowling pins', w: 1, h: 1, price: 240, draw(x, b) {
    floorShadow(x + 2, b, 28);
    for (const [row, tone] of [[3, -1], [2, 0], [1, 0], [0, 0]]) for (let i = 0; i <= row; i++) pin(x + 17 + (i - row / 2) * 6.5, b, 1, tone);
    sphere(x + 5, b - 4, 4, k.c); for (const [px, py] of [[4, 6], [6.2, 6], [5, 4]]) disc(x + px, b - py, 0.7, INK);
  } },
  { id: 'pitchingmachine', name: 'Pitching machine', w: 1, h: 1, price: 750, draw(x, b) {
    floorShadow(x + 2, b, 28);
    line(x + 16, b - 1, x + 16, b - 30, sh(k.m, -1), 2);
    line(x + 5, b - 1, x + 14, b - 30, k.m, 2.4); line(x + 27, b - 1, x + 18, b - 30, k.m, 2.4);
    for (const px of [x + 3, x + 24]) R(px, b - 2, 5, 2, INK);
    poly([[x + 9, b - 58], [x + 23, b - 58], [x + 20, b - 46], [x + 12, b - 46]], WHITE); R(x + 9, b - 58, 14, 1.5, sh(WHITE, -1));
    for (let i = 0; i < 4; i++) { disc(x + 11 + i * 3.3, b - 59.5, 1.8, WHITE); P2(x + 11 + i * 3.3, b - 59.5); }
    panel(x + 7, b - 46, 18, 16, k.c, 2);
    disc(x + 16, b - 38, 7, INK); disc(x + 16, b - 38, 4.5, '#5a5a62'); disc(x + 16, b - 38, 1.6, '#c8ccd4');
    R(x + 13, b - 31, 6, 2.5, k.a);
  } },
  { id: 'sportsrack', name: 'Sports rack', w: 1, h: 1, price: 380, draw(x, b) {
    floorShadow(x, b, 32);
    line(x + 2, b, x + 4.5, b - 34, HANDLE, 2.4);
    for (const px of [x + 2, x + 27]) cyl(px, b - 52, 3, 52, k.m);
    panel(x + 5, b - 56, 22, 6, k.c, 2);
    // the top shelf: a basketball and a football; the bottom: a volleyball and tennis balls
    sphere(x + 11, b - 36.5, 5.5, ORANGE); line(x + 5.5, b - 36.5, x + 16.5, b - 36.5, INK, 0.5); line(x + 11, b - 42, x + 11, b - 31, INK, 0.5);
    sphere(x + 22, b - 36, 5, WHITE); for (const [px, py, r] of [[22, 36, 1.6], [18.6, 38.6, 1], [25.4, 38.6, 1], [20, 32.4, 1], [24, 32.4, 1]]) disc(x + px, b - py, r, INK);
    sphere(x + 11, b - 12, 5, WHITE); curve([[x + 6.5, b - 14], [x + 11, b - 12.5], [x + 15.5, b - 14]], k.c, 1.4); curve([[x + 7, b - 9], [x + 11, b - 10.5], [x + 15, b - 8.5]], k.a, 1.4);
    for (let i = 0; i < 3; i++) sphere(x + 19 + i * 3.5, b - 9.5, 2.5, BALL);
    for (const y of [b - 31, b - 7]) wood(x + 2, y, 28, 3, k.w);
  } },
  { id: 'fieldscoreboard', name: 'Field scoreboard', w: 2, h: 1, price: 900, glow: [LIT], draw(x, b, vw) {
    floorShadow(x + 4, b, vw - 8);
    for (const px of [x + 9, x + 51]) { cyl(px, b - 42, 4, 42, k.m); R(px - 2, b - 2, 8, 2, sh(k.m, -1)); }
    R(x + 31.5, b - 92, 1, 10, k.m); poly([[x + 32.5, b - 92], [x + 40, b - 89.5], [x + 32.5, b - 87]], k.a);
    panel(x + 2, b - 82, 60, 42, k.c, 2);
    R(x + 5, b - 76, 54, 33, '#22262c');
    for (const px of [x + 10, x + 40]) R(px, b - 79.5, 14, 1.6, k.p);
    for (const [px, n] of [[x + 10, 3], [x + 38, 2]]) { R(px, b - 70, 16, 22, '#101216'); digit(R, px + 3, b - 68, n, LIT); }
    disc(x + 32, b - 63, 1.2, LIT); disc(x + 32, b - 55, 1.2, LIT);
  } },
  { id: 'sidelinebench', name: 'Sideline bench', w: 2, h: 1, price: 400, draw(x, b, vw) {
    floorShadow(x, b, vw);
    for (const px of [x + 6, x + 54]) { R(px, b - 13, 4, 13, k.m); R(px - 2, b - 2, 8, 2, sh(k.m, -1)); }
    cushion(x + 30, b - 10, 18, 10, k.c, 3); R(x + 33, b - 11.5, 12, 1.4, sh(k.c, -1));
    wood(x + 2, b - 16, 60, 4, k.w); R(x + 2, b - 12, 60, 1.5, sh(k.w, -1));
    panel(x + 12, b - 17, 13, 11, k.p); R(x + 12, b - 10, 13, 1.5, k.c); R(x + 12, b - 8, 13, 1, k.c);
    cyl(x + 40, b - 29, 5, 13, k.a); R(x + 40, b - 24, 5, 2, sh(k.a, 1)); R(x + 41, b - 32, 3, 3, WHITE);
  } },
  { id: 'agilityladder', name: 'Agility ladder', w: 2, h: 1, price: 220, high: 0.04, side: 'c', flat(w, h) {
    for (const y of [8, 22]) R(9, y, 47, 2, k.c);
    for (let i = 0; i < 7; i++) R(9 + i * 7.5, 8, 2, 16, k.a);
    for (const cx of [4, 60]) { disc(cx, 16, 3.4, ORANGE); disc(cx, 16, 2.2, WHITE); disc(cx, 16, 1.2, ORANGE); }
  } },
  { id: 'balltarget', name: 'Poké Ball target', w: 1, h: 1, price: 450, draw(x, b) {
    floorShadow(x + 4, b, 24);
    line(x + 16, b - 1, x + 16, b - 40, sh(k.w, -1), 2.2);
    line(x + 8, b - 1, x + 13, b - 50, k.w, 2.6); line(x + 24, b - 1, x + 19, b - 50, k.w, 2.6);
    R(x + 7, b - 26, 18, 2.5, sh(k.w, -1));
    disc(x + 16, b - 40, 14, STRAW); speckle(x + 2, b - 54, 28, 28, sh(STRAW, -1), 6, 0.12);
    const g = ctx();
    g.save(); g.beginPath(); g.arc(x + 16, b - 40, 11.5, 0, TAU); g.clip();
    R(x + 4, b - 52, 24, 12, ballTop()); R(x + 4, b - 40, 24, 12, WHITE); R(x + 4, b - 41.5, 24, 3, INK);
    g.restore();
    disc(x + 16, b - 40, 4, INK); disc(x + 16, b - 40, 2.6, WHITE); disc(x + 16, b - 40, 1.1, k.a);
    for (const [ax, ay] of [[x + 12, b - 45], [x + 20.5, b - 36]]) { line(ax, ay, ax + 2, ay + 1.4, HANDLE, 1.2); line(ax + 0.8, ay - 1.6, ax + 3.2, ay + 3.2, k.a, 1); line(ax - 0.6, ay + 2.6, ax + 4.2, ay - 0.6, k.a, 1); }
  } },
]);

/** A two-tone stud at (cx, cy): a ball's red seam. */
function P2(cx, cy) { line(cx - 1, cy - 0.6, cx + 1, cy + 0.6, '#d84848', 0.5); }

add('Buildings', [
  { id: 'gazebo', name: 'Gazebo', w: 2, h: 2, price: 1500, glow: ['g', 'gl'], draw(x, b, vw) {
    floorShadow(x, b, vw);
    wood(x + 2, b - 7, 60, 7, k.w); wood(x + 24, b - 4, 16, 4, sh(k.w, 1));
    // the railing seen at the back through the doorway, then the side railings and the posts
    R(x + 20.4, b - 26, 23.2, 2.5, sh(k.p, -1)); for (let px = x + 22; px < x + 43; px += 3.2) R(px, b - 24, 1.2, 17, sh(k.p, -2));
    for (const [x0, x1] of [[x + 7, x + 16.4], [x + 47.6, x + 57]]) { R(x0, b - 26, x1 - x0, 2.5, k.p); for (let px = x0 + 1.5; px < x1 - 1; px += 3) R(px, b - 24, 1.2, 17, sh(k.p, -1)); }
    for (const px of [x + 2.8, x + 57.2, x + 16.4, x + 43.6]) cyl(px, b - 68, 4, 61, k.p);
    // the lantern hanging in the middle
    R(x + 31.5, b - 66, 1, 8, INK); R(x + 28.5, b - 59, 7, 1.5, INK); panel(x + 29, b - 58, 6, 8, k.g); R(x + 30, b - 57, 2, 6, k.gl); R(x + 28.5, b - 50.5, 7, 1.2, INK);
    // the roof: its slopes up to a finial, the fascia, a scalloped trim
    poly([[x, b - 66], [x + 64, b - 66], [x + 33, b - 100], [x + 31, b - 100]], k.c);
    poly([[x + 32, b - 100], [x + 33, b - 100], [x + 64, b - 66], [x + 48, b - 66]], sh(k.c, -1));
    poly([[x + 31, b - 100], [x + 32, b - 100], [x + 16, b - 66], [x, b - 66]], sh(k.c, 1));
    R(x, b - 68, 64, 3, sh(k.c, -1));
    for (let i = 0; i < 8; i++) scallop(x + 4 + i * 8, b - 65.2, 3.4, k.p);
    disc(x + 32, b - 102, 2.5, k.a);
  } },
  { id: 'pergola', name: 'Vine pergola', w: 2, h: 2, price: 1100, draw(x, b, vw) {
    floorShadow(x, b, vw);
    for (const px of [x + 4, x + 55]) wood(px, b - 72, 5, 72, k.w, 'y');
    for (const px of [x + 6.5, x + 57.5]) for (let i = 0; i < 6; i++) leaf(px + (i % 2 ? 2.5 : -2.5), b - 12 - i * 10, 2.2, 3, k.leaf, i % 2 ? 0.5 : -0.5);
    for (let i = 0; i < 8; i++) R(x + 2 + i * 8.2, b - 81, 4, 5, sh(k.w, 1));
    wood(x, b - 76, 64, 6, k.w);
    for (let i = 0; i < 9; i++) foliage(x + 5 + i * 6.75, b - 78 + (i % 2) * 3, 5, k.leaf, i + 2);
    for (let i = 0; i < 7; i++) for (let j = 0; j < 3; j++) disc(x + 8 + i * 8, b - 68 + j * 3, 2.2 - j * 0.5, j % 2 ? k.p : k.c);
  } },
  { id: 'pottingshed', name: 'Potting shed', w: 2, h: 2, price: 1300, draw(x, b, vw) {
    floorShadow(x, b, vw);
    poly([[x + 4, b - 58], [x + 60, b - 58], [x + 32, b - 84]], sh(k.w, -1));
    for (let i = 0; i < 7; i++) wood(x + 4 + i * 8, b - 58, 8, 58, k.w, 'y');
    R(x + 4, b - 3, 56, 3, sh(k.w, -2));
    poly([[x, b - 54], [x + 32, b - 86], [x + 64, b - 54], [x + 60, b - 54], [x + 32, b - 82], [x + 4, b - 54]], k.c);
    // the door and its knob; the window and its flower box
    panel(x + 9, b - 46, 18, 46, sh(k.w, -1)); R(x + 11, b - 25, 14, 1.5, sh(k.w, -2)); disc(x + 24, b - 23, 1.4, k.a);
    R(x + 35, b - 46, 20, 18, sh(k.w, 1)); glass(x + 37, b - 44, 16, 14); R(x + 44.5, b - 44, 1.2, 14, sh(k.w, 1)); R(x + 37, b - 37.5, 16, 1.2, sh(k.w, 1));
    for (let i = 0; i < 5; i++) { leaf(x + 36 + i * 4.5, b - 29, 1.6, 2.4, k.leaf); disc(x + 36 + i * 4.5, b - 31, 1.8, [k.c, k.a, k.p][i % 3]); }
    panel(x + 33, b - 28, 24, 6, k.c);
    // pots by the wall
    for (const px of [x + 47, x + 54]) { poly([[px, b - 8], [px + 6, b - 8], [px + 5, b], [px + 1, b]], k.pot); foliage(px + 3, b - 10, 3.4, k.leaf, px); }
  } },
  { id: 'kennel', name: 'Growlithe kennel', w: 1, h: 1, price: 480, draw(x, b) {
    floorShadow(x + 1, b, 30);
    poly([[x + 4, b - 24], [x + 28, b - 24], [x + 16, b - 35]], sh(k.w, -1));
    for (let i = 0; i < 3; i++) wood(x + 4 + i * 8, b - 24, 8, 24, k.w, 'y');
    poly([[x + 1, b - 22], [x + 16, b - 38], [x + 31, b - 22], [x + 27, b - 22], [x + 16, b - 33.5], [x + 5, b - 22]], k.c);
    R(x + 11, b - 13, 10, 13, '#2a1e18'); disc(x + 16, b - 13, 5, '#2a1e18');
    panel(x + 12, b - 23, 8, 4, k.a, 1); disc(x + 16, b - 20.6, 1, '#e06030'); for (const dx of [-1.6, 0, 1.6]) disc(x + 16 + dx, b - 22.2, 0.5, '#e06030');
    poly([[x + 21, b - 5], [x + 30, b - 5], [x + 29, b], [x + 22, b]], '#e06030'); oval(x + 25.5, b - 5, 4.5, 1.2, sh('#e06030', 1)); oval(x + 25.5, b - 5.3, 3.4, 0.8, BARK);
  } },
  { id: 'glasshouse', name: 'Glasshouse', w: 2, h: 2, price: 1400, draw(x, b, vw) {
    floorShadow(x, b, vw);
    glass(x + 4, b - 54, 56, 42, '#cfe8f4');
    poly([[x + 4, b - 54], [x + 60, b - 54], [x + 32, b - 78]], '#bfdcec');
    const g = ctx();
    g.save(); g.globalAlpha *= 0.75;
    for (let i = 0; i < 4; i++) foliage(x + 12 + i * 13, b - 24, 7, k.leaf, i + 5);
    for (const [px, py] of [[12, 28], [27, 22], [41, 27], [52, 21]]) disc(x + px, b - py, 1.6, '#e04838');
    g.restore();
    for (let i = 0; i < 7; i++) R(x + 3 + i * 9.33, b - 54, 2, 42, k.p);
    R(x + 3, b - 55, 58, 2, k.p); R(x + 3, b - 34, 58, 1.5, k.p);
    line(x + 4, b - 54, x + 32, b - 78, k.p, 2); line(x + 60, b - 54, x + 32, b - 78, k.p, 2); R(x + 31, b - 78, 2, 24, k.p);
    wood(x + 2, b - 12, 60, 12, k.w); R(x + 2, b - 12, 60, 1.5, sh(k.w, 1));
    disc(x + 34.5, b - 26, 1, k.a);
  } },
  { id: 'arbourbench', name: 'Arbour bench', w: 2, h: 1, price: 750, draw(x, b, vw) {
    floorShadow(x, b, vw);
    const g = ctx();
    g.strokeStyle = k.p; g.lineWidth = 3.4; g.beginPath(); g.arc(x + 32, b - 62, 27, Math.PI, TAU); g.stroke();
    for (const px of [x + 3, x + 57]) cyl(px, b - 62, 4, 62, k.p);
    for (const px of [x + 12, x + 49]) R(px, b - 14, 3, 14, sh(k.w, -1));
    for (let i = 0; i < 6; i++) wood(x + 11 + i * 7.3, b - 34, 5, 18, k.w, 'y');
    wood(x + 10, b - 36, 44, 3, sh(k.w, 1));
    wood(x + 9, b - 17, 46, 4, sh(k.w, 1));
    // roses over the arch and up the posts
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI + i / 10 * Math.PI, fx = x + 32 + Math.cos(a) * 27, fy = b - 62 + Math.sin(a) * 27;
      foliage(fx, fy, 3.6, k.leaf, i);
      if (i % 2 === 0) disc(fx, fy - 1, 2, k.c);
    }
    for (const px of [x + 5, x + 59]) for (let j = 0; j < 5; j++) { leaf(px + (j % 2 ? 2 : -2), b - 10 - j * 10, 1.8, 2.6, k.leaf, j % 2 ? 0.5 : -0.5); if (j % 2) disc(px, b - 15 - j * 10, 1.6, k.c); }
  } },
  { id: 'toolshed', name: 'Tool shed', w: 2, h: 1, price: 1000, draw(x, b, vw) {
    floorShadow(x, b, vw);
    poly([[x + 5, b], [x + 59, b], [x + 59, b - 52], [x + 5, b - 58]], k.w);
    for (let px = x + 10; px < x + 59; px += 6) R(px, b - 57 + (px - x - 5) / 9, 0.8, 57 - (px - x - 5) / 9, sh(k.w, -1));
    poly([[x + 1, b - 57], [x + 63, b - 50], [x + 63, b - 54], [x + 1, b - 62]], k.m);
    for (let i = 0; i < 12; i++) disc(x + 3 + i * 5.2, b - 56.6 + i * 0.6, 1, sh(k.m, 1));
    for (const dx of [x + 16, x + 32]) {
      panel(dx, b - 44, 16, 44, k.c, 1);
      for (const y of [42, 23, 4]) R(dx + 1, b - y, 14, 2, k.p);
      line(dx + 2.5, b - 5, dx + 13.5, b - 22, k.p, 1.8); line(dx + 2.5, b - 24, dx + 13.5, b - 41, k.p, 1.8);
    }
    R(x + 31.5, b - 44, 1, 44, INK); R(x + 30, b - 26, 4, 4, k.a); for (const y of [40, 8]) { R(x + 15, b - y, 3, 2, INK); R(x + 46, b - y, 3, 2, INK); }
    line(x + 3, b - 1, x + 6, b - 42, HANDLE, 2); R(x + 1, b - 46, 10, 2, STEEL); for (let i = 0; i < 5; i++) R(x + 1.5 + i * 2, b - 49, 0.8, 3, STEEL);
    line(x + 60, b - 9, x + 58, b - 40, HANDLE, 2); poly([[x + 58.5, b], [x + 63, b], [x + 62.5, b - 9], [x + 59, b - 9]], STEEL);
  } },
  { id: 'dovecote', name: 'Pidgey dovecote', w: 1, h: 1, price: 650, draw(x, b) {
    floorShadow(x + 6, b, 20);
    panel(x + 10, b - 4, 12, 4, sh(k.w, -1));
    wood(x + 14, b - 52, 4, 48, k.w, 'y');
    line(x + 15, b - 40, x + 9, b - 52, k.w, 1.6); line(x + 17, b - 40, x + 23, b - 52, k.w, 1.6);
    R(x + 4, b - 54, 24, 2.5, sh(k.w, 1));
    panel(x + 7, b - 78, 18, 24, k.p); R(x + 7, b - 66.5, 18, 1.5, sh(k.p, -1));
    for (const [hx, hy] of [[x + 9, b - 76], [x + 18, b - 76], [x + 9, b - 64], [x + 18, b - 64]]) { R(hx, hy + 2, 5, 5, HOLE); disc(hx + 2.5, hy + 2, 2.5, HOLE); R(hx - 0.5, hy + 7, 6, 1.2, k.w); }
    poly([[x + 4, b - 77], [x + 28, b - 77], [x + 16, b - 92]], k.c); R(x + 4, b - 78, 24, 2, sh(k.c, -1)); disc(x + 16, b - 93, 1.6, k.a);
    // a Pidgey on the ledge
    oval(x + 22, b - 58, 3.5, 3, PIDGEY); oval(x + 22.5, b - 57.5, 2, 2, '#f0dcb0'); disc(x + 24, b - 61.5, 2.2, PIDGEY);
    R(x + 25.5, b - 61.8, 2, 1, INK); R(x + 23, b - 65, 1.2, 2, '#c85a3a'); disc(x + 24.6, b - 62.3, 0.5, INK);
  } },
  { id: 'pavilion', name: 'Garden pavilion', w: 2, h: 2, price: 1200, draw(x, b, vw) {
    floorShadow(x, b, vw);
    R(x + 5, b - 58, 54, 58, sh(k.p, -1)); for (let i = 0; i < 6; i++) R(x + 5 + i * 9, b - 58, 1, 58, sh(k.p, -2));
    for (const px of [x + 2, x + 59]) cyl(px, b - 60, 3, 60, k.m);
    for (const [px, s] of [[x + 5, 1], [x + 59, -1]]) { poly([[px, b - 58], [px + s * 12, b - 58], [px + s * 2, b - 34], [px + s * 4, b - 2], [px, b - 2]], k.p); R(s > 0 ? px : px - 5, b - 36, 5, 2.5, k.a); }
    for (let i = 0; i < 8; i++) poly([[x + i * 8, b - 62], [x + (i + 1) * 8, b - 62], [x + 32, b - 90]], i % 2 ? k.p : k.c);
    for (let i = 0; i < 8; i++) { R(x + i * 8, b - 62, 8, 5, i % 2 ? k.c : k.p); scallop(x + 4 + i * 8, b - 57.2, 4, i % 2 ? k.c : k.p); }
    R(x + 31.5, b - 98, 1, 9, k.m); poly([[x + 32.5, b - 98], [x + 40, b - 95.5], [x + 32.5, b - 93]], k.a);
  } },
  { id: 'woodshed', name: 'Woodshed', w: 2, h: 1, price: 600, draw(x, b, vw) {
    floorShadow(x, b, vw);
    R(x + 5, b - 54, 54, 54, sh(k.w, -2));
    for (let row = 0; row < 7; row++) for (let i = 0; i < 8; i++) {
      const lx = x + 9 + i * 6.6 + (row % 2) * 3.3, ly = b - 6 - row * 5.8;
      if (lx > x + 56) continue;
      disc(lx, ly, 3.2, BARK); disc(lx, ly, 2.4, LOG); disc(lx, ly, 0.9, sh(LOG, -1));
    }
    wood(x + 5, b - 3, 54, 3, sh(k.w, -1));
    for (const px of [x + 2, x + 58]) wood(px, b - 56, 4, 56, k.w, 'y');
    panel(x, b - 61, 64, 6, k.c); for (let i = 0; i < 11; i++) R(x + 3 + i * 6, b - 57, 1, 2, sh(k.c, -1));
    cyl(x + 44, b - 9, 11, 9, '#8a6038'); oval(x + 49.5, b - 9, 5.5, 1.6, LOG);
    line(x + 48, b - 10, x + 54, b - 22, HANDLE, 1.8); poly([[x + 45, b - 12.5], [x + 49.5, b - 13], [x + 49.5, b - 9.5], [x + 45, b - 9]], STEEL);
  } },
  { id: 'tikibar', name: 'Tiki bar', w: 2, h: 2, price: 1400, glow: ['g'], draw(x, b, vw) {
    floorShadow(x, b, vw);
    R(x + 8, b - 64, 48, 34, sh(k.w, -2));
    wood(x + 8, b - 50, 48, 2.5, k.w);
    for (let i = 0; i < 7; i++) { const bx = x + 11 + i * 6.5, c = BOTTLES[i % 4]; R(bx, b - 59, 3.5, 9, c); R(bx + 1, b - 62, 1.5, 3, c); }
    for (let i = 0; i < 13; i++) { const px = x + 4 + i * 4.3; cyl(px, b - 30, 4.3, 30, i % 2 ? BAMBOO : sh(BAMBOO, -1)); for (const y of [20, 10]) R(px, b - y, 4.3, 1, sh(BAMBOO, -2)); }
    wood(x + 2, b - 34, 60, 4, k.w);
    panel(x + 26, b - 27, 12, 20, k.c, 2);
    for (const px of [x + 28, x + 33]) { R(px, b - 23, 3, 3, INK); R(px - 0.5, b - 25, 4, 1.2, k.a); }
    R(x + 31, b - 20, 2, 4, sh(k.c, -1)); R(x + 28.5, b - 14, 7, 3, INK); R(x + 29.5, b - 14, 5, 1, WHITE);
    sphere(x + 48, b - 37.5, 3.5, BARK); line(x + 49, b - 40, x + 51, b - 46, WHITE, 0.8); poly([[x + 47, b - 46], [x + 55, b - 46], [x + 51, b - 49]], k.a);
    for (const px of [x + 3, x + 57]) { cyl(px, b - 66, 4, 32, BAMBOO); for (const y of [52, 40]) R(px, b - y, 4, 1, sh(BAMBOO, -2)); }
    for (const lx of [x + 16, x + 32, x + 48]) { R(lx - 0.4, b - 62, 0.8, 3, INK); oval(lx, b - 57, 2.4, 3, k.g); }
    poly([[x, b - 62], [x + 64, b - 62], [x + 34, b - 92], [x + 30, b - 92]], STRAW);
    for (let j = 1; j < 4; j++) { line(x + j * 8, b - 62, x + 30 + j * 0.5, b - 92, sh(STRAW, -1), 0.6); line(x + 64 - j * 8, b - 62, x + 34 - j * 0.5, b - 92, sh(STRAW, -1), 0.6); }
    for (let i = 0; i < 32; i++) R(x + i * 2, b - 64, 1.4, 4 + (i % 3), sh(STRAW, i % 2 ? -1 : 0));
  } },
  { id: 'cabana', name: 'Cabana', w: 2, h: 2, price: 1300, draw(x, b, vw) {
    floorShadow(x, b, vw);
    R(x + 6, b - 72, 52, 56, sh(k.p, -1)); for (let i = 0; i < 6; i++) R(x + 6 + i * 8.6, b - 72, 1, 56, sh(k.p, -2));
    for (const px of [x + 8, x + 53]) R(px, b - 8, 3, 8, sh(k.w, -1));
    wood(x + 6, b - 12, 52, 5, k.w);
    cushion(x + 7, b - 17, 50, 6, k.p, 2);
    cushion(x + 10, b - 28, 14, 12, k.c, 3); cushion(x + 25, b - 27, 14, 11, k.a, 3); cushion(x + 40, b - 28, 14, 12, k.c, 3);
    for (const px of [x + 2, x + 58]) cyl(px, b - 72, 4, 72, k.w);
    for (const [px, s] of [[x + 6, 1], [x + 58, -1]]) { poly([[px, b - 72], [px + s * 10, b - 72], [px + s * 2, b - 40], [px + s * 5, b - 2], [px, b - 2]], k.p); R(s > 0 ? px : px - 5, b - 42, 5, 2.5, k.a); }
    panel(x, b - 80, 64, 8, k.c, 2);
    for (let i = 0; i < 8; i++) scallop(x + 4 + i * 8, b - 72.2, 4, i % 2 ? k.p : k.c);
  } },
  { id: 'marketstall', name: 'Market stall', w: 2, h: 1, price: 900, draw(x, b, vw) {
    floorShadow(x, b, vw);
    for (const px of [x + 4, x + 57]) wood(px, b - 72, 3, 72, k.w, 'y');
    for (let i = 0; i < 4; i++) wood(x + 2, b - 28 + i * 7, 60, 7, i % 2 ? k.w : sh(k.w, -1));
    wood(x + 1, b - 31, 62, 3, sh(k.w, 1));
    for (const [cx, fruit] of [[x + 6, '#d83a3a'], [x + 24, '#f09030'], [x + 42, '#78b848']]) { for (let i = 0; i < 4; i++) sphere(cx + 2.5 + i * 3.7, b - 38.5, 2.2, fruit); wood(cx, b - 38, 16, 7, sh(k.w, -1)); }
    line(x + 28, b - 66, x + 28, b - 56, INK, 0.6); line(x + 36, b - 66, x + 36, b - 56, INK, 0.6);
    panel(x + 26, b - 56, 12, 7, '#2e3a34'); R(x + 28, b - 53.5, 8, 0.8, WHITE); R(x + 28, b - 51, 6, 0.8, WHITE);
    for (let i = 0; i < 8; i++) { R(x + i * 8, b - 78, 8, 12, i % 2 ? k.p : k.c); scallop(x + 4 + i * 8, b - 66.2, 4, i % 2 ? k.p : k.c); }
  } },
  { id: 'lighthouse', name: 'Lighthouse model', w: 1, h: 1, price: 800, glow: ['g', 'gl'], draw(x, b) {
    floorShadow(x + 4, b, 24);
    for (let i = 0; i < 4; i++) {
      const ya = b - 6 - i * 13, wa = 18 - i * 1.5, wb = wa - 1.5;
      poly([[x + 16 - wa / 2, ya], [x + 16 + wa / 2, ya], [x + 16 + wb / 2, ya - 13], [x + 16 - wb / 2, ya - 13]], i % 2 ? k.p : k.c);
    }
    R(x + 11, b - 58, 1.4, 52, 'rgba(255,255,255,0.25)'); R(x + 19, b - 58, 2, 52, 'rgba(0,0,0,0.12)');
    R(x + 14, b - 14, 4, 8, INK); disc(x + 16, b - 14, 2, INK); R(x + 15, b - 30, 2, 3, INK); R(x + 15, b - 44, 2, 3, INK);
    ovalShade(x + 10, b - 3, 7, 4, STONE); ovalShade(x + 22, b - 3, 8, 4, sh(STONE, -1)); ovalShade(x + 16, b - 4, 6, 3.5, sh(STONE, 1));
    R(x + 8, b - 60, 16, 2.5, k.m); for (let i = 0; i < 5; i++) R(x + 8.5 + i * 3.6, b - 66, 0.8, 6, k.m); R(x + 8, b - 66.5, 16, 1, k.m);
    R(x + 11, b - 72, 10, 12, k.g); R(x + 12, b - 71, 3, 10, k.gl); for (const px of [x + 11, x + 15.5, x + 20]) R(px, b - 72, 1, 12, k.m);
    const g = ctx(); g.fillStyle = k.c; g.beginPath(); g.ellipse(x + 16, b - 72, 7, 6, 0, Math.PI, TAU); g.fill();
    R(x + 15.5, b - 81, 1, 3, k.m); disc(x + 16, b - 82, 1.2, k.m);
  } },
  { id: 'windmill', name: 'Garden windmill', w: 1, h: 1, price: 750, draw(x, b) {
    floorShadow(x + 4, b, 24);
    panel(x + 7, b - 4, 18, 4, STONE);
    poly([[x + 8, b - 4], [x + 24, b - 4], [x + 21, b - 48], [x + 11, b - 48]], k.p);
    for (let y = 10; y < 48; y += 6) { const f = y / 48; R(x + 8 + f * 3, b - y, 16 - f * 6, 0.6, sh(k.p, -1)); }
    line(x + 8.5, b - 4, x + 11.5, b - 48, k.w, 1.2); line(x + 23.5, b - 4, x + 20.5, b - 48, k.w, 1.2);
    R(x + 14, b - 13, 4, 9, k.w); disc(x + 16, b - 13, 2, k.w); R(x + 15, b - 30, 2.5, 3.5, INK);
    const g = ctx();
    g.fillStyle = k.c; g.beginPath(); g.ellipse(x + 16, b - 48, 7, 7, 0, Math.PI, TAU); g.fill(); R(x + 8.5, b - 49, 15, 2, sh(k.c, -1));
    for (let i = 0; i < 4; i++) {
      g.save(); g.translate(x + 16, b - 46); g.rotate(Math.PI / 4 + i * Math.PI / 2);
      R(-0.7, 0, 1.4, 16, k.w); R(0.8, 3, 4.5, 13, k.p);
      for (let j = 0; j < 4; j++) R(0.8, 3.5 + j * 3.5, 4.5, 0.6, k.w);
      R(5.3, 3, 0.6, 13, k.w);
      g.restore();
    }
    disc(x + 16, b - 46, 2, k.m);
  } },
]);
