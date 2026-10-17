/* base-furniture-pikachu.js  -  the Pikachu room (furniture expansion session a, 2026-10-17): 25 pieces, each shaped
   after Pikachu, like Pokémon Center merch: its round head and long black-tipped ears, red cheeks, brown back stripes and
   lightning-bolt tail, plus what only it could have (ketchup, the Light Ball, a Thunder Stone, a neon Thunderbolt). One
   colour each (`solo`). These paintings are the store's and the tray's pictures; the room builds each as a 3D model
   (js/base-models-pikachu.js), which reads the shapes below so the two agree. A painter here draws in painted units
   round the piece's middle: `C` its centre line, `Y(n)` n units up from the floor. */

import { sh, R, panel, cushion, disc, oval, ovalShade, cyl, floorShadow, ctx } from './base-paint.js';

export const PIKA = '#f8d030', PIKAD = '#e8b828', CHEEK = '#e8483a', INK = '#2a2430', BROWN = '#9a5a2a', CREAM = '#fff4d8',
  KETCHUP = '#d02818', WHITE = '#f6f4ee', GLOW = '#fff4a0', GLOWL = '#fffbe0', NEON = '#ffe24a', NAVY = '#26304a',
  STONE = '#58b868', BOOKS = ['#e84848', '#4a78d0', '#58b848', '#f0a030', '#a060d0', '#38b0b0'];

/** Pikachu's ear, base to tip: [t along it, its half-width as a share of the widest]; black past TIP. */
export const EAR = [[0, 0.72], [0.25, 0.95], [0.5, 1], [0.72, 0.8], [0.86, 0.52], [1, 0.06]];
export const TIP = 0.66;
export function earR(t) {
  for (let i = 1; i < EAR.length; i++) if (t <= EAR[i][0]) { const [t0, r0] = EAR[i - 1], [t1, r1] = EAR[i]; return r0 + (r1 - r0) * (t - t0) / (t1 - t0); }
  return EAR[EAR.length - 1][1];
}
/** Its tail, 40 units tall from its root (y up): the brown root below y 8 (TAIL_ROOT), the yellow zigzag above (TAIL_TOP). */
export const TAIL_ROOT = [[0, 0], [5, 0], [6.6, 8], [0.6, 8]];
export const TAIL_TOP = [[0.6, 8], [6.6, 8], [7.2, 10], [3.5, 11], [11.5, 21], [8, 22], [18, 37], [4, 40], [-1, 25], [3, 24], [-3, 12], [0.2, 11]];
/** A lightning bolt in a unit box, y up. */
export const BOLT = [[0.3, 1], [0.05, 0.45], [0.42, 0.45], [0.25, 0], [0.95, 0.58], [0.58, 0.58], [0.85, 1]];

/* ----- painting the parts ----- */

const g = () => ctx();
function poly(pts, col) {
  const c = g(); c.fillStyle = col; c.beginPath();
  pts.forEach(([a, d], i) => (i ? c.lineTo(a, d) : c.moveTo(a, d)));
  c.closePath(); c.fill();
}
/** Points in units (y up) onto the canvas from (ox, oy), `s` units a unit. */
const place = (pts, ox, oy, s, sy = s) => pts.map(([a, d]) => [ox + a * s, oy - d * sy]);
/** An ear from its base (bx, by), `len` long, `w` its half-width, leant `ang` off upright (+ to the right). */
function ear(bx, by, len, w, ang) {
  const dx = Math.sin(ang), dy = -Math.cos(ang), nx = -dy, ny = dx;
  const part = (t0, t1) => {
    const rs = [], ls = [];
    for (let i = 0; i <= 10; i++) {
      const t = t0 + (t1 - t0) * i / 10, r = earR(t) * w, cx = bx + dx * t * len, cy = by + dy * t * len;
      rs.push([cx + nx * r, cy + ny * r]); ls.push([cx - nx * r, cy - ny * r]);
    }
    return [...rs, ...ls.reverse()];
  };
  poly(part(0, TIP), PIKA); poly(part(TIP, 1), INK);
}
/** A pair of ears, bases `gap` either side of cx. */
const ears = (cx, by, gap, len, w, ang) => { ear(cx - gap, by, len, w, -ang); ear(cx + gap, by, len, w, ang); };
/** Pikachu's face round (cx, cy), `s` its size (1 for a head 12 units round). */
function face(cx, cy, s = 1, { eyes = true, mouth = true, cheeks = true } = {}) {
  const c = g();
  for (const sx of [-1, 1]) {
    if (cheeks) { disc(cx + sx * 8.5 * s, cy + 3 * s, 3 * s, CHEEK); disc(cx + sx * 8.5 * s - 0.8 * s, cy + 2.2 * s, 1 * s, sh(CHEEK, 1)); }
    if (eyes) { disc(cx + sx * 5 * s, cy - 1.5 * s, 2.2 * s, INK); disc(cx + sx * 5 * s - 0.7 * s, cy - 2.3 * s, 0.8 * s, '#ffffff'); }
  }
  if (!mouth) return;
  disc(cx, cy + 0.8 * s, 0.6 * s, INK);
  c.strokeStyle = INK; c.lineWidth = Math.max(0.5, 0.55 * s);
  for (const sx of [-1, 1]) { c.beginPath(); c.arc(cx + sx * 1.2 * s, cy + 2.2 * s, 1.2 * s, 0.15, Math.PI - 0.15); c.stroke(); }
}
/** A head: ears first, the oval, its face. */
function head(cx, cy, rx, ry, earAt, faceOn = true) {
  const [gap, by, len, w, ang] = earAt;
  ears(cx, by, gap, len, w, ang);
  ovalShade(cx, cy, rx, ry, PIKA);
  if (faceOn) face(cx, cy, rx / 12);
}
/** The tail standing on (ox, oy), `s` units a unit, mirrored when `flip`. */
function tail(ox, oy, s, flip = false) {
  const f = flip ? -1 : 1;
  poly(place(TAIL_TOP, ox, oy, s * f, s), PIKA); poly(place(TAIL_ROOT, ox, oy, s * f, s), BROWN);
}
/** A bolt `w` x `h` standing on (cx, by). */
const bolt = (cx, by, w, h, col) => poly(BOLT.map(([a, d]) => [cx + (a - 0.5) * w, by - d * h]), col);
/** A Poké Ball. */
function ball(cx, cy, r) {
  disc(cx, cy, r, '#f4f4f0');
  const c = g(); c.fillStyle = '#e84838'; c.beginPath(); c.arc(cx, cy, r, Math.PI, 0); c.fill();
  R(cx - r, cy - 0.5, r * 2, 1, INK); disc(cx, cy, r * 0.32, INK); disc(cx, cy, r * 0.2, '#ffffff');
}
const legs = (C, b, xs, w = 4, h = 4) => xs.forEach(lx => cyl(C + lx - w / 2, b - h, w, h, BROWN));

/* ----- the pieces ----- */

export const PIKACHU_KINDS = [
  // the bed: Pikachu's head for a headboard, a yellow duvet with its back stripes, cheek-red pillows, the tail at the foot
  { id: 'pikabed', name: 'Pikachu bed', w: 2, h: 2, price: 1200, seat: 'bed', draw(x, b, vw, dir) {
    const C = x + vw / 2, Y = (n) => b - n;
    floorShadow(x, b, vw);
    if (dir % 2) {
      const back = dir === 1 ? 1 : -1;
      legs(C, b, [-28, 28]);
      ear(C + back * 27, Y(60), 28, 2.4, 0);
      panel(C + back * 27 - 4, Y(64), 8, 36, PIKA);
      panel(C - 30, Y(14), 60, 10, PIKAD); R(C - 28, Y(20), 56, 6, CREAM);
      cushion(C - 30 + (back > 0 ? 0 : 19), Y(25), 41, 8, PIKA, 3);
      for (const d of [-2, 6]) R(C - back * d - 2, Y(25), 4, 8, BROWN);
      tail(C - back * 26, Y(14), 0.8, back > 0);
      return;
    }
    legs(C, b, [-28, 28]);
    panel(C - 22, Y(34), 44, 30, PIKAD);
    head(C, Y(46), 22, 18, [9, Y(60), 28, 5, 0.45], dir === 0);
    if (dir === 2) { panel(C - 30, Y(14), 60, 10, PIKAD); cushion(C - 30, Y(25), 60, 8, PIKA, 3); return; }
    for (const sx of [-1, 1]) cushion(C + sx * 12 - 8, Y(29), 16, 10, CHEEK, 4);
    panel(C - 30, Y(14), 60, 10, PIKAD);
    R(C - 28, Y(20), 56, 6, CREAM);
    cushion(C - 30, Y(25), 60, 8, PIKA, 3);
    R(C - 29, Y(25), 58, 1, BROWN);
    tail(C + 14, Y(14), 0.8);
  } },
  // the armchair: a tub chair whose back is Pikachu's head, its arms its paws, its tail peeking out behind
  { id: 'pikaarmchair', name: 'Pikachu armchair', w: 1, h: 1, price: 500, draw(x, b, vw, dir) {
    const C = x + vw / 2, Y = (n) => b - n;
    floorShadow(x, b, vw);
    for (const sx of [-1, 1]) disc(C + sx * 10, Y(2), 2, BROWN);
    tail(C + 6, Y(12), 0.55);
    head(C, Y(30), 13, 12, [5.5, Y(40), 17, 3.6, 0.4], dir === 0);
    cushion(C - 14, Y(16), 28, 13, PIKA, 5);
    cushion(C - 10, Y(18.5), 20, 4, CREAM, 2);
    for (const sx of [-1, 1]) { cushion(C + sx * 12 - 3, Y(23.5), 6, 9, PIKA, 3); oval(C + sx * 12, Y(23.5), 2.6, 2, sh(PIKA, 1)); }
  } },
  // the sofa: its back Pikachu's, two brown stripes across it, ears up at the corners, red cheeks on the rolled arms
  { id: 'pikasofa', name: 'Pikachu sofa', w: 2, h: 1, price: 900, draw(x, b, vw, dir) {
    const C = x + vw / 2, Y = (n) => b - n;
    floorShadow(x, b, vw);
    if (dir % 2) {
      const bk = dir === 1 ? 1 : -1;
      legs(C, b, [-12, 12], 3, 3);
      ear(C + bk * 9, Y(32), 22, 4.5, 0);
      cushion(C + bk * 9 - 4, Y(34), 8, 22, PIKA, 4);
      cushion(C - 13, Y(24), 26, 21, PIKA, 5);
      return;
    }
    legs(C, b, [-25, 25], 3, 3);
    ears(C, Y(32), 21, 22, 4.5, 0.3);
    cushion(C - 27, Y(34), 54, 22, PIKA, 8);
    for (const y of [30, 25]) R(C - 24, Y(y), 48, 3, BROWN);
    if (dir === 2) { cushion(C - 29, Y(13), 58, 10, PIKA, 3); return; }
    panel(C - 27, Y(13), 54, 10, PIKAD);
    for (const sx of [-1, 1]) cushion(C + sx * 12.5 - 12, Y(19.5), 24, 7, PIKA, 3);
    for (const sx of [-1, 1]) {
      cushion(C + sx * 25 - 5, Y(19), 10, 12, PIKA, 3);
      ovalShade(C + sx * 25, Y(19), 5, 5, PIKA); disc(C + sx * 25, Y(19), 4, CHEEK); disc(C + sx * 25 - 1, Y(20), 1.4, sh(CHEEK, 1));
    }
  } },
  // the coffee table: an oval top that is Pikachu's face, its ears laid flat out to the sides, on two lightning bolts
  { id: 'pikatable', name: 'Pikachu coffee table', w: 2, h: 1, price: 450, draw(x, b, vw, dir) {
    const C = x + vw / 2, Y = (n) => b - n;
    floorShadow(x, b, vw);
    if (dir % 2) { panel(C - 5, Y(10), 10, 10, PIKAD); panel(C - 13, Y(15), 26, 5, PIKA); return; }
    for (const sx of [-1, 1]) bolt(C + sx * 12, Y(0), 12, 10, PIKAD);
    ear(C - 17, Y(13), 14.1, 2.1, -Math.PI / 2); ear(C + 17, Y(13), 14.1, 2.1, Math.PI / 2);
    panel(C - 22, Y(15), 44, 5, PIKA);
    for (const sx of [-1, 1]) R(C + sx * 13 - 3.5, Y(15.6), 7, 0.8, CHEEK);
  } },
  // the desk: a pedestal of drawers striped brown with cheek knobs, the tail for its other leg, ears up at the back
  { id: 'pikadesk', name: 'Pikachu desk', w: 2, h: 1, price: 700, draw(x, b, vw, dir) {
    const C = x + vw / 2, Y = (n) => b - n;
    floorShadow(x, b, vw);
    if (dir % 2) { panel(C - 14, Y(22), 28, 22, PIKA); panel(C - 15, Y(26), 30, 4, PIKAD); return; }
    ears(C, Y(26), 24, 18, 4, 0.25);
    const px = dir === 2 ? 20 : -20;
    panel(C + px - 10, Y(22), 20, 22, PIKA);
    if (dir !== 2) {
      for (const y of [16.5, 6]) { panel(C + px - 8.5, Y(y + 4.5), 17, 9, sh(PIKA, 1)); disc(C + px, Y(y), 1.6, CHEEK); }
      R(C + px - 10, Y(12.2), 20, 2.4, BROWN);
    }
    tail(C - px * 0.8, Y(0), 0.58, dir === 2);
    panel(C - 31, Y(26), 62, 4, PIKAD);
  } },
  // the wardrobe: Pikachu's face on its door, its ears on top; the door opens on hanging clothes
  { id: 'pikawardrobe', name: 'Pikachu wardrobe', w: 1, h: 1, price: 800, draw(x, b, vw, dir) {
    const C = x + vw / 2, Y = (n) => b - n;
    floorShadow(x, b, vw);
    for (const sx of [-1, 1]) disc(C + sx * 10, Y(2), 2, BROWN);
    ears(C, Y(54), 7, 18, 4, 0.35);
    panel(C - 14, Y(56), 28, 52, PIKA);
    if (dir !== 0) { for (const y of [30, 22]) R(C - 13, Y(y), 26, 2.5, BROWN); return; }
    panel(C - 12, Y(53), 24, 46, sh(PIKA, 1));
    face(C, Y(41), 1.2);
    disc(C + 9.5, Y(26), 1.5, CHEEK);
  } },
  // the dresser: two brown stripes across its drawers, cheek-red knobs, little ears at the back
  { id: 'pikadresser', name: 'Pikachu dresser', w: 2, h: 1, price: 650, draw(x, b, vw, dir) {
    const C = x + vw / 2, Y = (n) => b - n;
    floorShadow(x, b, vw);
    if (dir % 2) {
      legs(C, b, [-9, 9], 3, 3); ear(C + (dir === 1 ? 9 : -9), Y(30), 15, 3.5, 0);
      panel(C - 13, Y(28), 26, 25, PIKA); panel(C - 14, Y(30), 28, 2, PIKAD);
      for (const y of [10.75, 18.25]) R(C - 13, Y(y + 0.8), 26, 1.6, BROWN);
      return;
    }
    legs(C, b, [-26, 26], 3, 3);
    ears(C, Y(30), 24, 15, 3.5, 0.3);
    panel(C - 30, Y(28), 60, 25, PIKA);
    if (dir !== 2) for (const y of [7, 14.5, 22]) for (const sx of [-1, 1]) { panel(C + sx * 14 - 13, Y(y + 3.2), 26, 6.4, sh(PIKA, 1)); disc(C + sx * 14, Y(y), 1.6, CHEEK); }
    for (const y of [10.75, 18.25]) R(C - 30, Y(y + 0.8), 60, 1.6, BROWN);
    panel(C - 31, Y(30), 62, 2, PIKAD);
  } },
  // the bookcase: a lightning bolt stood on its point, three shelves of books across it
  { id: 'pikabookcase', name: 'Pikachu bolt bookcase', w: 1, h: 1, price: 600, draw(x, b, vw) {
    const C = x + vw / 2, Y = (n) => b - n;
    floorShadow(x + 4, b, 24);
    panel(C - 13.5, Y(2), 12, 2, BROWN);
    poly(place(CASE, C, b, 1), PIKA);
    poly(place(inset(CASE, 2), C, b, 1), sh(PIKAD, -1));
    for (const [y, x0, x1, hgt] of SHELVES) {
      let i = 0;
      for (let bx = x0 + 0.6; bx < x1 - 1.5; bx += 2.2) { R(C + bx, Y(y + hgt - (i % 3) * 0.8), 2, hgt - (i % 3) * 0.8, BOOKS[i % BOOKS.length]); i++; }
      panel(C + x0, Y(y), x1 - x0, 1.6, PIKA);
    }
  } },
  // the floor lamp: the tail for its stand, a glowing bulb on its tip
  { id: 'pikalamp', name: 'Pikachu tail lamp', w: 1, h: 1, price: 450, glow: [GLOW, GLOWL], draw(x, b, vw) {
    const C = x + vw / 2, Y = (n) => b - n;
    floorShadow(x + 4, b, 24);
    panel(C - 12, Y(3), 24, 3, BROWN);
    tail(C - 9, Y(3), 1.3);
    cyl(C, Y(57), 8, 3, PIKAD);
    disc(C + 4, Y(63), 8, GLOW); disc(C + 2, Y(65), 3.5, GLOWL);
  } },
  // the wall clock: Pikachu's head, its ears up, the dial where its mouth would be
  { id: 'pikaclock', name: 'Pikachu clock', w: 1, h: 1, layer: 'wall', price: 300, wall(x) {
    head(x + 16, 40, 13, 11, [6, 31, 17, 3.8, 0.42], false);
    face(x + 16, 39, 13 / 12, { mouth: false, cheeks: false });
    for (const sx of [-1, 1]) disc(x + 16 + sx * 9.5, 44.5, 2.8, CHEEK);
    disc(x + 16, 43.5, 6.5, CREAM);
    for (let h = 0; h < 4; h++) disc(x + 16 + Math.sin(h * Math.PI / 2) * 5, 43.5 - Math.cos(h * Math.PI / 2) * 5, 0.6, INK);
    R(x + 15.6, 39.5, 0.9, 4.2, INK); R(x + 16, 43.1, 3.4, 0.9, INK); disc(x + 16.4, 43.5, 0.9, CHEEK);
  } },
  // the TV: its cabinet Pikachu's head, red cheeks either side of the screen, on a Poké Ball stand
  { id: 'pikatv', name: 'Pikachu TV', w: 2, h: 1, price: 1000, draw(x, b, vw, dir) {
    const C = x + vw / 2, Y = (n) => b - n;
    floorShadow(x, b, vw);
    if (dir % 2) {
      ear(C - 3, Y(46), 22, 5, 0);
      R(C - 13, Y(7), 26, 7, '#f4f4f0'); R(C - 13, Y(14), 26, 7, '#e84838'); R(C - 13, Y(7.8), 26, 1.6, INK);
      panel(C - 10, Y(48), 14, 34, PIKA);
      return;
    }
    ears(C, Y(46), 15, 22, 5, 0.5);
    R(C - 28, Y(7), 56, 7, '#f4f4f0'); R(C - 28, Y(14), 56, 7, '#e84838'); R(C - 28, Y(7.8), 56, 1.6, INK);
    if (dir !== 2) { disc(C, Y(7), 4, INK); disc(C, Y(7), 3.2, '#ffffff'); }
    panel(C - 27, Y(48), 54, 34, PIKA);
    if (dir === 2) { for (const y of [38, 30]) R(C - 26, Y(y), 52, 2.5, BROWN); return; }
    panel(C - 19, Y(44.5), 38, 25, INK);
    for (let j = 0; j < 22; j++) R(C - 17.5, Y(43) + j, 35, 1, j % 2 ? '#2a4a8a' : '#24345a');
    disc(C + 8, Y(32), 4, PIKA); R(C - 14, Y(40), 10, 2, '#a8d8f8');
    for (const sx of [-1, 1]) disc(C + sx * 22, Y(27), 4.2, CHEEK);
    face(C, Y(16.6), 0.7, { eyes: false, cheeks: false });
  } },
  // the standing mirror: an oval glass framed in yellow, its ears on top and red cheeks for its pivots
  { id: 'pikamirror', name: 'Pikachu mirror', w: 1, h: 1, price: 450, draw(x, b, vw, dir) {
    const C = x + vw / 2, Y = (n) => b - n;
    floorShadow(x + 2, b, 28);
    for (const sx of [-1, 1]) { panel(C + sx * 12 - 3.5, Y(3), 7, 3, BROWN); cyl(C + sx * 12 - 2, Y(42), 4, 40, PIKA); }
    ears(C, Y(54), 4.5, 16, 3.4, 0.35);
    oval(C, Y(40), 10, 15, PIKAD); oval(C, Y(40), 9, 14, PIKA);
    if (dir === 0) {
      oval(C, Y(40), 7.6, 12.6, '#cfe6f2');
      const c = g(); c.strokeStyle = '#ffffff'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(C - 4, Y(36)); c.lineTo(C + 1, Y(48)); c.stroke();
    } else { for (const y of [44, 38]) R(C - 8, Y(y), 16, 2, BROWN); }
    for (const sx of [-1, 1]) disc(C + sx * 12, Y(40), 2.4, CHEEK);
  } },
  // the neon sign: Pikachu's head and a Thunderbolt in yellow neon on a dark board
  { id: 'pikaneon', name: 'Pikachu neon sign', w: 2, h: 1, layer: 'wall', price: 400, glow: [NEON], wall(x) {
    panel(x + 4, 21, 56, 38, NAVY);
    const c = g(); c.lineJoin = c.lineCap = 'round';
    const stroke = (path, col) => { for (const [lw, a] of [[3.6, 0.25], [1.8, 1]]) { c.globalAlpha = a; c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); path(); c.stroke(); } c.globalAlpha = 1; };
    for (const pts of NEON_EARS) stroke(() => { pts.forEach(([a, d], i) => (i ? c.lineTo(x + a, d) : c.moveTo(x + a, d))); c.closePath(); }, NEON);
    stroke(() => c.ellipse(x + 22, 44, 9, 7.5, 0, 0, Math.PI * 2), NEON);
    for (const sx of [-1, 1]) { stroke(() => c.arc(x + 22 + sx * 6, 46.5, 2, 0, Math.PI * 2), CHEEK); disc(x + 22 + sx * 4, 42, 1.2, NEON); }
    stroke(() => { BOLT.forEach(([a, d], i) => (i ? c.lineTo(x + 38 + a * 16, 55 - d * 30) : c.moveTo(x + 38 + a * 16, 55 - d * 30))); c.closePath(); }, NEON);
  } },
  // a rug cut in the shape of Pikachu's face
  { id: 'pikarug', name: 'Pikachu face rug', w: 2, h: 2, layer: 'rug', price: 400, high: 0.04, side: 'a', flat(w, h) {
    ears(w / 2, 24, 10, 23, 6, 0.5);
    oval(w / 2, 38, 24, 20, PIKAD); oval(w / 2, 38, 22.5, 18.5, PIKA);
    face(w / 2, 38, 2);
  } },
  // a rug cut in the shape of its tail
  { id: 'pikatailrug', name: 'Pikachu tail rug', w: 2, h: 1, layer: 'rug', price: 300, high: 0.04, side: 'a', flat(w, h) {
    const turn = (pts) => pts.map(([a, d]) => [3 + d * 1.45, h - 2 - (a + 2) * 1.45]);
    poly(turn(TAIL_TOP), PIKA); poly(turn(TAIL_ROOT), BROWN);
    const c = g(); c.strokeStyle = PIKAD; c.lineWidth = 1; c.setLineDash([2, 2]); c.beginPath();
    turn(TAIL_TOP).forEach(([a, d], i) => (i ? c.lineTo(a, d) : c.moveTo(a, d))); c.closePath(); c.stroke(); c.setLineDash([]);
  } },
  // the fridge: a ketchup bottle, Pikachu's favourite, Pikachu on its label
  { id: 'pikafridge', name: 'Pikachu ketchup fridge', w: 1, h: 1, price: 900, draw(x, b, vw, dir) {
    const C = x + vw / 2, Y = (n) => b - n;
    floorShadow(x + 2, b, 28);
    for (const sx of [-1, 1]) disc(C + sx * 9, Y(1.8), 1.8, BROWN);
    cyl(C - 1.2, Y(62), 2.4, 4, WHITE);
    cyl(C - 5.4, Y(58), 10.8, 6, WHITE);
    cyl(C - 4.5, Y(53), 9, 6, KETCHUP);
    oval(C, Y(40), 13, 8, KETCHUP);
    panel(C - 13, Y(43), 26, 40, KETCHUP);
    if (dir !== 0) return;
    panel(C - 11.5, Y(40), 23, 34, sh(KETCHUP, 1));
    oval(C, Y(24), 9, 10.4, CREAM);
    head(C, Y(23), 5.5, 4.6, [2.4, Y(27), 7, 1.6, 0.4], false);
    face(C, Y(23), 0.46);
    panel(C + 8.2, Y(29), 1.6, 10, WHITE);
  } },
  // the Light Ball, Pikachu's own held item, glowing on a striped stand between its ears
  { id: 'pikalightball', name: 'Pikachu Light Ball lamp', w: 1, h: 1, price: 350, glow: [GLOW, GLOWL], draw(x, b, vw) {
    const C = x + vw / 2, Y = (n) => b - n;
    floorShadow(x + 6, b, 20);
    ears(C, Y(10), 6, 17, 3.2, 0.32);
    poly(LIGHTSTAND.flatMap(([r, y]) => [[C + r, Y(y)]]).concat(LIGHTSTAND.slice().reverse().map(([r, y]) => [C - r, Y(y)])), PIKA);
    for (const y of [6, 8.6]) R(C - 6.1, Y(y + 0.8), 12.2, 1.6, BROWN);
    disc(C, Y(21), 8.5, GLOW); disc(C - 2.5, Y(23.5), 3.5, GLOWL);
  } },
  // a Thunder Stone on a cushion, up on a striped pedestal
  { id: 'pikathunderstone', name: 'Pikachu Thunder Stone', w: 1, h: 1, price: 600, draw(x, b, vw) {
    const C = x + vw / 2, Y = (n) => b - n;
    floorShadow(x + 4, b, 24);
    poly(STONESTAND.map(([r, y]) => [C + r, Y(y)]).concat(STONESTAND.slice().reverse().map(([r, y]) => [C - r, Y(y)])), PIKA);
    for (const y of [12, 17]) R(C - 7, Y(y + 1), 14, 2, BROWN);
    cushion(C - 8, Y(32.5), 16, 4, CHEEK, 2);
    poly([[C, Y(51.4)], [C + 6.4, Y(48)], [C + 9, Y(41)], [C + 6.4, Y(34)], [C, Y(30.6)], [C - 6.4, Y(34)], [C - 9, Y(41)], [C - 6.4, Y(48)]], STONE);
    poly([[C, Y(51.4)], [C + 6.4, Y(48)], [C + 3, Y(42)], [C - 3, Y(44)], [C - 6.4, Y(48)]], sh(STONE, 1));
    bolt(C, Y(35), 8, 12, '#f8f0a0');
  } },
  // a round pouf as red as its cheeks, little sparks stitched on it
  { id: 'pikapouf', name: 'Pikachu cheek pouf', w: 1, h: 1, price: 200, draw(x, b, vw) {
    const C = x + vw / 2, Y = (n) => b - n;
    floorShadow(x + 2, b, 28);
    panel(C - 12.5, Y(3), 25, 3, PIKA);
    cushion(C - 13, Y(16), 26, 13, CHEEK, 6);
    for (const [sx, y] of [[-7, 5], [0, 6], [7, 5]]) bolt(C + sx, Y(y), 5, 8, PIKA);
    disc(C, Y(15.5), 1.5, sh(CHEEK, -1));
  } },
  // a toy box with Pikachu's face, its ears on the lid
  { id: 'pikatoybox', name: 'Pikachu toy box', w: 1, h: 1, price: 400, draw(x, b, vw, dir) {
    const C = x + vw / 2, Y = (n) => b - n;
    floorShadow(x + 1, b, 30);
    ears(C, Y(23.5), 8, 15, 3.5, 0.35);
    R(C - 13, Y(1), 26, 1, BROWN);
    panel(C - 14, Y(21), 28, 20, PIKA);
    panel(C - 15, Y(24.5), 30, 4, PIKAD);
    if (dir === 0) face(C, Y(15.5), 1.18);
    else for (const y of [15, 9]) R(C - 13, Y(y), 26, 2.4, BROWN);
  } },
  // a rocking Pikachu to ride, on wooden rockers
  { id: 'pikarocker', name: 'Pikachu rocker', w: 1, h: 1, price: 550, draw(x, b, vw, dir) {
    const C = x + vw / 2, Y = (n) => b - n;
    floorShadow(x + 2, b, 28);
    tail(C + 4, Y(10), 0.6);
    for (const sx of [-1, 1]) panel(C + sx * 9 - 1.6, Y(6.4), 3.2, 6.4, BROWN);
    R(C - 9, Y(4), 18, 2.4, BROWN);
    panel(C - 10, Y(6.25), 20, 2.5, BROWN);
    cushion(C - 9, Y(22), 18, 16, PIKA, 7);
    head(C, Y(29), 10, 9, [4.5, Y(36), 15, 3.2, 0.4], dir === 0);
    for (const sx of [-1, 1]) { oval(C + sx * 5.5, Y(7.5), 3, 2.1, PIKA); disc(C + sx * 5, Y(17), 2.6, sh(PIKA, 1)); }
  } },
  // a pet bed: a round yellow basket, Pikachu's head for its backrest
  { id: 'pikapetbed', name: 'Pikachu pet bed', w: 1, h: 1, price: 300, seat: 'bed', draw(x, b, vw, dir) {
    const C = x + vw / 2, Y = (n) => b - n;
    floorShadow(x, b, vw);
    head(C, Y(13), 11, 9, [4.5, Y(20.5), 14, 3.2, 0.42], dir === 0);
    panel(C - 13.5, Y(2), 27, 2, PIKAD);
    cushion(C - 14.1, Y(8.6), 28.2, 7.2, PIKA, 3.5);
  } },
  // a speaker: its cheeks the woofers, its eyes the tweeters, its ears on top
  { id: 'pikaspeaker', name: 'Pikachu cheek speaker', w: 1, h: 1, price: 500, draw(x, b, vw, dir) {
    const C = x + vw / 2, Y = (n) => b - n;
    floorShadow(x + 2, b, 28);
    R(C - 12, Y(1.5), 24, 1.5, INK);
    ears(C, Y(36), 7, 17, 3.8, 0.35);
    panel(C - 13, Y(37.5), 26, 36, PIKA);
    if (dir !== 0) { for (const y of [30, 24]) R(C - 13, Y(y + 1.3), 26, 2.6, BROWN); return; }
    for (const sx of [-1, 1]) { disc(C + sx * 7.5, Y(12), 4.8, CHEEK); disc(C + sx * 7.5, Y(12), 3, sh(CHEEK, -1)); disc(C + sx * 7.5 - 0.8, Y(12.8), 1, sh(CHEEK, 1)); }
    face(C, Y(25.5), 1.15, { cheeks: false });
  } },
  // a wall shelf on two lightning-bolt brackets: a ketchup bottle, a Poké Ball and an apple on it
  { id: 'pikawallshelf', name: 'Pikachu bolt shelf', w: 2, h: 1, layer: 'wall', price: 250, wall(x) {
    for (const bx of [14, 50]) bolt(x + bx, 66, 13, 16, PIKAD);
    panel(x + 4, 44, 56, 6, PIKA);
    for (const bx of [18, 46]) R(x + bx - 4, 44, 8, 6, BROWN);
    poly(KETCHUP_BOTTLE.map(([r, y]) => [x + 14 + r, 44 - y]).concat(KETCHUP_BOTTLE.slice().reverse().map(([r, y]) => [x + 14 - r, 44 - y])), KETCHUP);
    R(x + 12.6, 32.4, 2.8, 1.6, WHITE);
    ball(x + 28, 40, 4);
    disc(x + 40, 40.4, 3.6, '#d83030'); R(x + 39.7, 35.4, 0.8, 2, BROWN); oval(x + 41.6, 36, 1.6, 0.8, '#58b848');
  } },
  // a nightstand: two drawers with cheek-red knobs, a brown stripe between, ears at the back
  { id: 'pikanightstand', name: 'Pikachu nightstand', w: 1, h: 1, price: 350, draw(x, b, vw, dir) {
    const C = x + vw / 2, Y = (n) => b - n;
    floorShadow(x + 1, b, 30);
    legs(C, b, [-9, 9], 3.2, 4);
    ears(C, Y(28), 8, 14, 3.4, 0.3);
    panel(C - 13, Y(26), 26, 22, PIKA);
    if (dir !== 2) for (const y of [20.5, 10]) { panel(C - 10.5, Y(y + 4.25), 21, 8.5, sh(PIKA, 1)); for (const sx of [-1, 1]) disc(C + sx * 5, Y(y), 1.6, CHEEK); }
    R(C - 13, Y(16.05), 26, 1.6, BROWN);
    panel(C - 13.5, Y(28), 27, 2, PIKAD);
  } },
].map(f => ({ group: 'Pikachu room', solo: true, ...f }));

/* ----- shapes both the paintings and the models read ----- */

/** The bookcase's outline (a bolt 30 x 64 on its plinth), in units round its middle, y up. */
export const CASE = BOLT.map(([a, d]) => [(a - 0.5) * 30, 2 + d * 64]);
/** A polygon `d` units in from its edge. */
export function inset(pts, d) {
  const n = pts.length;
  let area = 0;
  for (let i = 0; i < n; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % n]; area += x0 * y1 - x1 * y0; }
  const lines = pts.map(([x0, y0], i) => {
    const [x1, y1] = pts[(i + 1) % n], l = Math.hypot(x1 - x0, y1 - y0), dx = (x1 - x0) / l, dy = (y1 - y0) / l;
    const nx = area > 0 ? -dy : dy, ny = area > 0 ? dx : -dx;
    return [x0 + nx * d, y0 + ny * d, dx, dy];
  });
  return pts.map((_, i) => {
    const [x1, y1, dx1, dy1] = lines[(i + n - 1) % n], [x2, y2, dx2, dy2] = lines[i], den = dx1 * dy2 - dy1 * dx2;
    const t = ((x2 - x1) * dy2 - (y2 - y1) * dx2) / den;
    return [x1 + dx1 * t, y1 + dy1 * t];
  });
}
/** The bookcase's shelves: [height, left, right, book height], in units round its middle. */
export const SHELVES = [[31, -13, 8.5, 7], [48, -9.8, 5, 8], [16, -4.9, 1.8, 5]];
/** The Light Ball lamp's stand and the Thunder Stone's pedestal, turned: [radius, height]. */
export const LIGHTSTAND = [[9, 0], [9.5, 1.5], [8, 3], [6, 4], [5.5, 10], [7.5, 11], [7.5, 12.5], [0.01, 12.5]];
export const STONESTAND = [[12, 0], [12, 2], [10, 3.5], [7, 4.5], [6.5, 24], [9, 25.5], [10, 27], [10, 29], [0.01, 29]];
/** The ketchup bottle on the wall shelf, turned. */
export const KETCHUP_BOTTLE = [[2.6, 0], [2.8, 1], [2.8, 7], [1.6, 8.5], [1.2, 10], [0.01, 10]];
/** The neon sign's ears, as loops on the wall (units across, down). */
export const NEON_EARS = [-1, 1].map(sx => {
  const bx = 22 + sx * 5, by = 38, len = 14, w = 3, a = sx * 0.45, dx = Math.sin(a), dy = -Math.cos(a), nx = -dy, ny = dx, rs = [], ls = [];
  for (let i = 0; i <= 8; i++) { const t = i / 8, r = earR(t) * w, cx = bx + dx * t * len, cy = by + dy * t * len; rs.push([cx + nx * r, cy + ny * r]); ls.push([cx - nx * r, cy - ny * r]); }
  return [...rs, ...ls.reverse()];
});
