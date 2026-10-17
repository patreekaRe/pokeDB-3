/* base-furniture-jigglypuff.js  -  the Jigglypuff room (furniture expansion session a, 2026-10-17): 25 pieces shaped after
   Jigglypuff, like Pokémon Center merch: its round pink body, big blue-green eyes, pointed ears with dark insides and the
   curl on its forehead, plus what only it has (its marker-pen microphone, the stage, its lullabies, the faces it scribbles
   on when everyone falls asleep, the Moon Stone it evolves by). One colour each, its own. Their models are
   js/base-models-jigglypuff.js, which reads the shared parts below (the ear, the curl, the eyes) so the two agree. */

import { R, disc, oval, ovalShade, cushion, floorShadow, ctx, sh } from './base-paint.js';

export const PINK = '#f8b8c8', ROSE = '#e890ae', DEEP = '#d0628a', TEAL = '#3aaebe', TEALD = '#1e6a80', INK = '#3a2838',
  CREAM = '#fff4f6', MIC = '#44424e', GLOW = '#ffdce8', BULB = '#fff0b0', MOON = '#f4ecb8', STONE = '#5e5870', SCREEN = '#2a2a3a';

/* Jigglypuff's parts as fractions of its head's radius, y up from its middle: an ear (two base points and its tip, the
   right one; the left is mirrored), the curl on its forehead, an eye (the right one's middle and size). */
export const EAR = { b1: [0.24, 0.89], b2: [0.81, 0.43], tip: [0.86, 1.23] };
export const TUFT = [[0.18, 0.92], [0.05, 1.02], [-0.15, 1.04], [-0.34, 0.92], [-0.38, 0.72], [-0.26, 0.56], [-0.08, 0.56], [0, 0.68], [-0.08, 0.78], [-0.18, 0.72]];
export const EYE = { x: 0.36, y: 0.05, rx: 0.24, ry: 0.28 };

/** An ear's dark inside: [base1, base2, tip] from its outer [b1, b2, tip], any units: a narrower triangle up its middle. */
export function earInner(b1, b2, tip) {
  const mx = (b1[0] + b2[0]) / 2, my = (b1[1] + b2[1]) / 2, half = Math.hypot(b2[0] - b1[0], b2[1] - b1[1]) / 2;
  const ux = (b2[0] - b1[0]) / (2 * half), uy = (b2[1] - b1[1]) / (2 * half);
  const at = (t) => [mx + (tip[0] - mx) * t, my + (tip[1] - my) * t], [bx, by] = at(0.12), w = half * 0.6;
  return [[bx - ux * w, by - uy * w], [bx + ux * w, by + uy * w], at(0.95)];
}

/* the notes on the wall: [kind, head x, head y (painted units down the wall), colour]; a pair's second head follows */
export const NOTES = [['eighth', 12, 46, PINK], ['pair', 29, 40, TEAL, 45, 34], ['quarter', 54, 62, DEEP], ['eighth', 36, 66, ROSE]];
export const NOTE = { rx: 4.2, ry: 3.2, tilt: -0.35, stem: 17, sw: 1.8 };

/* ---------- painting kit ---------- */

function poly(pts, c) {
  const g = ctx();
  g.fillStyle = c; g.beginPath();
  pts.forEach(([a, b], i) => (i ? g.lineTo(a, b) : g.moveTo(a, b)));
  g.closePath(); g.fill();
}
/** Points through `pts` on a Catmull-Rom curve, `n` a span. */
export function catmull(pts, n = 8) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map(j => 0.5 * (2 * p1[j] + (p2[j] - p0[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (3 * p1[j] - p0[j] - 3 * p2[j] + p3[j]) * t3)));
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
function stroke(pts, c, w, smooth = true) {
  const g = ctx(), q = smooth ? catmull(pts) : pts;
  g.strokeStyle = c; g.lineWidth = w; g.lineCap = g.lineJoin = 'round';
  g.beginPath(); q.forEach(([a, b], i) => (i ? g.lineTo(a, b) : g.moveTo(a, b))); g.stroke();
}
/** A smile (or a shut eye): the lower half of a circle `w` across, its middle at (cx, cy). */
function smile(cx, cy, w, c, lw) {
  const g = ctx(), r = w / 2;
  g.strokeStyle = c; g.lineWidth = lw; g.lineCap = 'round';
  g.beginPath(); g.arc(cx, cy - r * 0.5, r, 0.05, Math.PI - 0.05); g.stroke();
}
/** A rounded box, lit from the top left. */
function rr(x, y, w, h, r, c) {
  const g = ctx(), l = g.createLinearGradient(x, y, x + w * 0.3, y + h);
  l.addColorStop(0, sh(c, 1)); l.addColorStop(0.3, c); l.addColorStop(1, sh(c, -1));
  g.fillStyle = l; g.beginPath(); g.roundRect(x, y, w, h, r); g.fill();
}
/** An ear from its base points to its tip, the inside dark. */
function earP(b1, b2, tip, c = PINK) {
  poly([b1, tip, b2], c);
  poly(earInner(b1, b2, tip), INK);
}
/** The curl, its points `pts` (canvas units). */
function curlP(pts, w, c = PINK) {
  stroke(pts, sh(c, -1), w * 1.25);
  stroke(pts, c, w);
  stroke(pts.slice(1, 6), sh(c, 1), w * 0.3);
}
/** The curl on a head of radius r at (cx, cy), raised `off` radii (a crest standing on a top). */
const tuftPts = (cx, cy, r, off = 0) => TUFT.map(([fx, fy]) => [cx + fx * r, cy - (fy + off) * r]);
/** An open eye at (cx, cy), rx by ry. */
function eyeP(cx, cy, rx, ry, rim = true) {
  if (rim) oval(cx, cy, rx * 1.1, ry * 1.08, INK);
  oval(cx, cy, rx, ry, '#ffffff');
  oval(cx, cy + ry * 0.06, rx * 0.78, ry * 0.8, TEAL);
  oval(cx, cy + ry * 0.2, rx * 0.5, ry * 0.4, sh(TEAL, -1));
  disc(cx - rx * 0.22, cy - ry * 0.3, rx * 0.28, '#ffffff');
}
/** Jigglypuff's head at (cx, cy), r round: ears, curl, and eyes `open` or `shut` (or none), a smile with `mouth`.
    `behind` paints between the ears and the head (what sticks out of its top). */
function headP(cx, cy, r, o = {}) {
  const F = ([fx, fy], s = 1) => [cx + fx * s * r, cy - fy * r], c = o.c || PINK;
  if (o.ears !== false) for (const s of [-1, 1]) earP(F(EAR.b1, s), F(EAR.b2, s), F(EAR.tip, s), c);
  if (o.behind) o.behind();
  ovalShade(cx, cy, r, r, c);
  if (o.tuft !== false) curlP(tuftPts(cx, cy, r), r * 0.15, c);
  faceP(cx, cy, r, o);
}
function faceP(cx, cy, r, o) {
  for (const s of [-1, 1]) {
    const ex = cx + s * EYE.x * r, ey = cy - EYE.y * r;
    if (o.eyes === 'open') eyeP(ex, ey, EYE.rx * r, EYE.ry * r, r > 8);
    if (o.eyes === 'shut') smile(ex, ey, EYE.rx * r * 1.5, INK, Math.max(0.6, r * 0.06));
  }
  if (o.mouth) smile(cx, cy + 0.38 * r, r * 0.2, INK, Math.max(0.5, r * 0.045));
}
/** A marker pen standing on its cap: its foot at canvas y `y`, `len` long. */
function markerP(cx, y, len, r, cap) {
  rr(cx - r, y - len, r * 2, len - 4, r * 0.8, CREAM);
  R(cx - r, y - len * 0.6, r * 2, len * 0.14, ROSE);
  rr(cx - r * 1.08, y - 5, r * 2.16, 5, r * 0.5, cap);
}

/** Scribbles in marker on a sheet: what Jigglypuff leaves on everyone who falls asleep. Drawn on any context. */
export function scribble(g, x, y, w, h) {
  g.fillStyle = '#fbf6ee'; g.fillRect(x, y, w, h);
  g.lineCap = g.lineJoin = 'round';
  const line = (pts, c, lw) => { g.strokeStyle = c; g.lineWidth = lw; g.beginPath(); catmull(pts.map(([a, b]) => [x + a * w, y + b * h]), 6).forEach(([a, b], i) => (i ? g.lineTo(a, b) : g.moveTo(a, b))); g.stroke(); };
  line([[0.12, 0.3], [0.3, 0.12], [0.45, 0.32], [0.3, 0.5], [0.2, 0.36], [0.32, 0.28]], '#2a2a34', w * 0.04);
  line([[0.55, 0.2], [0.68, 0.38], [0.8, 0.18], [0.9, 0.4]], DEEP, w * 0.04);
  line([[0.12, 0.72], [0.3, 0.62], [0.5, 0.78], [0.7, 0.62], [0.88, 0.76]], TEALD, w * 0.035);
  line([[0.55, 0.52], [0.6, 0.6], [0.66, 0.5]], '#2a2a34', w * 0.03);
}
/** The scribbled portrait: someone fast asleep, a marker moustache and glasses drawn on them. */
export function portrait(g, x, y, w, h) {
  g.fillStyle = '#e8f0f8'; g.fillRect(x, y, w, h);
  const cx = x + w / 2, cy = y + h * 0.55, r = w * 0.36;
  g.fillStyle = '#6a4a3a'; g.beginPath(); g.ellipse(cx, cy - r * 0.35, r * 1.05, r * 0.85, 0, Math.PI, 0); g.fill();
  g.fillStyle = '#f4d4b8'; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#4a7ac0'; g.fillRect(x, y + h * 0.88, w, h * 0.12);
  g.lineCap = 'round';
  g.strokeStyle = '#5a3a30'; g.lineWidth = w * 0.035;
  for (const s of [-1, 1]) { g.beginPath(); g.arc(cx + s * r * 0.38, cy - r * 0.12, r * 0.16, 0.2, Math.PI - 0.2); g.stroke(); }
  g.fillStyle = '#c86a6a'; g.beginPath(); g.ellipse(cx, cy + r * 0.48, r * 0.12, r * 0.16, 0, 0, Math.PI * 2); g.fill();
  // the marker: glasses, a curly moustache, swirls on the cheeks
  g.strokeStyle = '#1e1e26'; g.lineWidth = w * 0.03;
  for (const s of [-1, 1]) { g.beginPath(); g.arc(cx + s * r * 0.38, cy - r * 0.1, r * 0.27, 0, Math.PI * 2); g.stroke(); }
  g.beginPath(); g.moveTo(cx - r * 0.12, cy - r * 0.1); g.lineTo(cx + r * 0.12, cy - r * 0.1); g.stroke();
  for (const s of [-1, 1]) {
    g.beginPath(); g.moveTo(cx, cy + r * 0.28);
    g.bezierCurveTo(cx + s * r * 0.3, cy + r * 0.12, cx + s * r * 0.6, cy + r * 0.42, cx + s * r * 0.62, cy + r * 0.18);
    g.bezierCurveTo(cx + s * r * 0.62, cy + r * 0.05, cx + s * r * 0.48, cy + r * 0.1, cx + s * r * 0.52, cy + r * 0.2); g.stroke();
    g.strokeStyle = DEEP; g.beginPath(); g.arc(cx + s * r * 0.66, cy + r * 0.5, r * 0.1, 0, Math.PI * 1.6); g.stroke(); g.strokeStyle = '#1e1e26';
  }
  g.fillStyle = '#5a6a90'; g.font = `bold ${w * 0.16}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('zZ', x + w * 0.8, y + h * 0.14);
}

/** An upright painter `fn(x, Y, w)` for a piece W tiles wide, Y(h) the canvas y h units above the floor; a side view
    (narrower) gets the front squeezed into it. */
const up = (W, fn) => (x, b, vw) => {
  const full = W * 32, Y = (h) => b - h;
  if (vw === full) { fn(x, Y, full); return; }
  const g = ctx();
  g.save(); g.translate(x + vw / 2, 0); g.scale(vw / full, 1); g.translate(-full / 2, 0);
  try { fn(0, Y, full); } finally { g.restore(); }
};
const feetP = (x, Y, xs, rx = 4, ry = 2) => xs.forEach(f => ovalShade(x + f, Y(ry * 0.8), rx, ry, sh(PINK, -1)));

const ROOM = { group: 'Jigglypuff room', solo: true };

export const JIGGLYPUFF_KINDS = [
  // a bed: its headboard Jigglypuff's head, fast asleep, a pink duvet scattered with notes
  { ...ROOM, id: 'puffbed', name: 'Jigglypuff bed', w: 2, h: 2, price: 1300, seat: 'bed', draw: up(2, (x, Y) => {
    floorShadow(x, Y(0), 64);
    headP(x + 32, Y(46), 22, { eyes: 'shut', mouth: true });
    cushion(x + 12, Y(29), 40, 8, CREAM, 3);
    feetP(x, Y, [9, 55], 5, 2.5);
    cushion(x + 3, Y(15), 58, 12, ROSE, 3);
    cushion(x + 2, Y(24), 60, 11, PINK, 4);
    R(x + 4, Y(24), 56, 3, CREAM); R(x + 4, Y(21.4), 56, 0.6, sh(CREAM, -1));
    for (const [nx, nh] of [[12, 16], [26, 18], [40, 15.5], [52, 18]]) { oval(x + nx, Y(nh), 1.6, 1.2, DEEP); R(x + nx + 1, Y(nh + 5), 0.7, 5, DEEP); }
  }) },
  // an armchair: its back Jigglypuff's head, its arms Jigglypuff's stubby ones, its two feet in front
  { ...ROOM, id: 'puffchair', name: 'Jigglypuff chair', w: 1, h: 1, price: 480, seat: 'cushion', draw: up(1, (x, Y) => {
    floorShadow(x + 1, Y(0), 30);
    headP(x + 16, Y(42), 12.5, { eyes: 'open', mouth: true });
    cushion(x + 4, Y(18), 24, 14, PINK, 5);
    for (const s of [4, 28]) ovalShade(x + s, Y(22), 4, 5, PINK);
    cushion(x + 3, Y(22), 26, 7, ROSE, 3);
    feetP(x, Y, [10, 22], 5, 2.5);
  }) },
  // a sofa: one long pink puff, its ears up at the ends, its eyes peeping over the cushions
  { ...ROOM, id: 'puffsofa', name: 'Jigglypuff sofa', w: 2, h: 1, price: 950, seat: 'cushion', draw: up(2, (x, Y) => {
    floorShadow(x, Y(0), 64);
    earP([x + 8, Y(40)], [x + 22, Y(44)], [x + 5, Y(60)]); earP([x + 56, Y(40)], [x + 42, Y(44)], [x + 59, Y(60)]);
    cushion(x + 5, Y(44), 54, 30, PINK, 8);
    curlP(tuftPts(x + 32, Y(31), 13), 2, PINK);
    for (const s of [-1, 1]) eyeP(x + 32 + s * 7, Y(29), 3.6, 4.2);
    feetP(x, Y, [10, 54], 4, 2);
    cushion(x + 3, Y(12), 58, 9, PINK, 3);
    for (const cx of [6, 32]) cushion(x + cx, Y(20), 26, 10, ROSE, 4);
    for (const s of [7, 57]) ovalShade(x + s, Y(19), 7, 9, PINK);
  }) },
  // a round tea table held up on Jigglypuff's head, a curl inlaid in its top
  { ...ROOM, id: 'pufftable', name: 'Jigglypuff table', w: 2, h: 2, price: 520, draw: up(2, (x, Y) => {
    floorShadow(x + 2, Y(0), 60);
    feetP(x, Y, [27, 37], 3.5, 1.8);
    headP(x + 32, Y(10), 9, { eyes: 'open', mouth: true, tuft: false });
    rr(x + 3, Y(22), 58, 4, 2, ROSE);
    oval(x + 32, Y(22), 29, 1.4, sh(PINK, 1));
    for (let i = 0; i < 7; i++) disc(x + 8 + i * 8, Y(20), 0.8, CREAM);
  }) },
  // a desk on four marker pens, a scribbled sheet pinned to the round pink board behind it
  { ...ROOM, id: 'puffdesk', name: 'Jigglypuff scribble desk', w: 2, h: 1, price: 640, draw: up(2, (x, Y) => {
    floorShadow(x, Y(0), 64);
    headP(x + 32, Y(37), 12, { eyes: false });
    const g = ctx(); g.save(); g.translate(x + 26, Y(45)); scribble(g, 0, 0, 12, 12); g.restore();
    disc(x + 32, Y(44), 1, DEEP);
    for (const cx of [9, 55]) markerP(x + cx, Y(0), 21, 3, DEEP);
    rr(x + 14, Y(20), 22, 7, 1.5, PINK); disc(x + 25, Y(16.5), 1.2, DEEP);
    rr(x + 2, Y(24), 60, 4, 1.2, ROSE); R(x + 2, Y(24), 60, 0.8, sh(ROSE, 1));
    rr(x + 37, Y(27), 16, 3, 1.5, CREAM); rr(x + 50, Y(27.2), 4, 3.4, 1.2, TEAL);
  }) },
  // a tall wardrobe, Jigglypuff from ears to toes: its eyes on the doors, its curl standing on top
  { ...ROOM, id: 'puffwardrobe', name: 'Jigglypuff wardrobe', w: 1, h: 1, price: 820, draw: up(1, (x, Y) => {
    floorShadow(x, Y(0), 32);
    earP([x + 5, Y(64)], [x + 14, Y(70)], [x + 5, Y(84)]); earP([x + 27, Y(64)], [x + 18, Y(70)], [x + 27, Y(84)]);
    curlP(tuftPts(x + 16, Y(70), 10, -0.5), 1.6);
    feetP(x, Y, [10, 22], 4, 2);
    rr(x + 3, Y(70), 26, 67, 4, PINK);
    R(x + 15.6, Y(67), 0.8, 62, sh(PINK, -2));
    for (const s of [-1, 1]) eyeP(x + 16 + s * 6.5, Y(52), 4.4, 5.2);
    smile(x + 16, Y(43), 4, INK, 0.7);
    for (const s of [-1, 1]) disc(x + 16 + s * 2.2, Y(34), 1.1, DEEP);
  }) },
  // a chest of drawers with a face: its eyes the top drawers' knobs, a smile for the bottom one's handle
  { ...ROOM, id: 'puffdresser', name: 'Jigglypuff dresser', w: 2, h: 1, price: 700, draw: up(2, (x, Y) => {
    floorShadow(x, Y(0), 64);
    earP([x + 6, Y(32)], [x + 16, Y(32)], [x + 6, Y(46)]); earP([x + 58, Y(32)], [x + 48, Y(32)], [x + 58, Y(46)]);
    curlP(tuftPts(x + 32, Y(27), 12, -0.5), 1.8);
    feetP(x, Y, [8, 56], 4, 1.8);
    rr(x + 3, Y(30), 58, 27, 4, PINK);
    for (const dx of [6, 33]) rr(x + dx, Y(27), 25, 7, 1.5, sh(PINK, 1));
    rr(x + 6, Y(18), 52, 12, 1.5, sh(PINK, 1));
    for (const s of [-1, 1]) eyeP(x + 32 + s * 13.5, Y(23.5), 3.2, 3.6, false);
    smile(x + 32, Y(13), 10, DEEP, 1.4);
    rr(x + 2, Y(33), 60, 4, 1.5, ROSE);
  }) },
  // a shelf shaped like a pair of notes, its round heads cubbies, a ledge between the stems, the curl on the beam
  { ...ROOM, id: 'puffshelf', name: 'Jigglypuff note shelf', w: 2, h: 1, price: 620, draw: up(2, (x, Y) => {
    floorShadow(x + 2, Y(0), 60);
    rr(x + 5, Y(3), 54, 3, 1, ROSE);
    curlP(tuftPts(x + 56, Y(72), 9, -0.2), 1.5);
    for (const sx of [23, 53]) rr(x + sx, Y(sx === 23 ? 80 : 76), 5, sx === 23 ? 67 : 63, 1.5, PINK);
    poly([[x + 23, Y(80)], [x + 58, Y(76)], [x + 58, Y(67)], [x + 23, Y(71)]], PINK);
    rr(x + 25.5, Y(45), 30, 3, 1, ROSE);
    ['#7ac0e0', DEEP, '#f0c860', TEAL, '#b090e0'].forEach((c, i) => rr(x + 30 + i * 4.2, Y(45 + 8 + (i % 2) * 2), 3.6, 8 + (i % 2) * 2, 0.6, c));
    const g = ctx();
    for (const hx of [15, 45]) {
      g.save(); g.translate(x + hx, Y(13)); g.rotate(-0.3);
      ovalShade(0, 0, 13, 10, PINK); oval(0, 0, 9, 6.5, sh(PINK, -2));
      g.restore();
    }
    for (const [i, c] of [[0, DEEP], [1, TEAL], [2, '#f0c860']]) rr(x + 10 + i * 3.6, Y(19), 3, 9, 1, c);
    for (let i = 0; i < 3; i++) R(x + 39, Y(10 + i * 2.2), 12, 1.6, i % 2 ? CREAM : sh(CREAM, -1));
  }) },
  // a floor lamp: a curling pink stem, and for its shade Jigglypuff's head, glowing, fast asleep
  { ...ROOM, id: 'pufflamp', name: 'Jigglypuff lamp', w: 1, h: 1, price: 400, glow: [GLOW], draw: up(1, (x, Y) => {
    floorShadow(x + 4, Y(0), 24);
    ovalShade(x + 16, Y(2.5), 9, 3, ROSE);
    stroke([[x + 16, Y(4)], [x + 18, Y(18)], [x + 14, Y(30)], [x + 18, Y(40)], [x + 16, Y(50)]], ROSE, 3.4);
    headP(x + 16, Y(60), 11, { c: GLOW, eyes: 'shut', mouth: true });
  }) },
  // an alarm clock: Jigglypuff round, its ears the bells, the dial for its face
  { ...ROOM, id: 'puffclock', name: 'Jigglypuff alarm clock', w: 1, h: 1, price: 300, draw: up(1, (x, Y) => {
    floorShadow(x + 6, Y(0), 20);
    feetP(x, Y, [12, 20], 3, 1.5);
    headP(x + 16, Y(12), 9.5, { eyes: false });
    for (const s of [-1, 1]) eyeP(x + 16 + s * 4.2, Y(16.4), 2.2, 2.6, false);
    disc(x + 16, Y(8.6), 4.8, CREAM); disc(x + 16, Y(8.6), 4.2, '#ffffff');
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; disc(x + 16 + Math.sin(a) * 3.3, Y(8.6) - Math.cos(a) * 3.3, 0.45, INK); }
    stroke([[x + 16, Y(8.6)], [x + 16, Y(11.6)]], INK, 0.7, false); stroke([[x + 16, Y(8.6)], [x + 18, Y(8)]], INK, 0.7, false);
  }) },
  // a television in Jigglypuff's round head, its two dials its eyes, its curl standing on top
  { ...ROOM, id: 'pufftv', name: 'Jigglypuff TV', w: 2, h: 1, price: 980, draw: up(2, (x, Y) => {
    floorShadow(x, Y(0), 64);
    earP([x + 8, Y(46)], [x + 22, Y(56)], [x + 6, Y(70)]); earP([x + 56, Y(46)], [x + 42, Y(56)], [x + 58, Y(70)]);
    curlP(tuftPts(x + 32, Y(54), 11, -0.5), 1.8);
    feetP(x, Y, [20, 44], 6, 3);
    rr(x + 5, Y(56), 54, 51, 10, PINK);
    rr(x + 11, Y(50), 42, 30, 4, ROSE);
    rr(x + 13, Y(48), 38, 26, 3, SCREEN);
    poly([[x + 16, Y(46)], [x + 24, Y(46)], [x + 17, Y(30)], [x + 15, Y(30)]], 'rgba(255,255,255,0.12)');
    for (const s of [-1, 1]) eyeP(x + 32 + s * 7, Y(13), 3.4, 3.8, false);
    smile(x + 32, Y(8.5), 3, INK, 0.7);
  }) },
  // a round mirror framed as Jigglypuff's head, ears, curl and all
  { ...ROOM, id: 'puffmirror', name: 'Jigglypuff mirror', w: 1, h: 1, layer: 'wall', price: 360, wall(x) {
    headP(x + 16, 44, 12, { eyes: false });
    disc(x + 16, 45, 9, '#d8eef6');
    const g = ctx(); g.save(); g.beginPath(); g.arc(x + 16, 45, 9, 0, Math.PI * 2); g.clip();
    g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x + 10, 46); g.lineTo(x + 16, 38); g.stroke();
    g.lineWidth = 0.9; g.beginPath(); g.moveTo(x + 13, 48); g.lineTo(x + 18.5, 41); g.stroke();
    g.restore();
  } },
  // a round rug: Jigglypuff's face from above, ears and curl
  { ...ROOM, id: 'puffrug', name: 'Jigglypuff face rug', w: 2, h: 2, layer: 'rug', price: 380, high: 0.04, side: 'p', flat(w, h) {
    const cx = w / 2, cy = h / 2 + 4;
    for (const s of [-1, 1]) {
      const F = ([fx, fy]) => [cx + fx * s * 22, cy - fy * 22];
      poly([F(EAR.b1), F(EAR.tip), F(EAR.b2)], ROSE);
      earP(F(EAR.b1).map((v, i) => v + (i ? 1.2 : -s * 1)), F(EAR.b2).map((v, i) => v + (i ? 1 : -s * 1.2)), F(EAR.tip).map((v, i) => v + (i ? 2 : -s * 1)));
    }
    disc(cx, cy, 23, ROSE);
    headP(cx, cy, 21, { ears: false, eyes: 'open', mouth: true });
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; disc(cx + Math.cos(a) * 22.2, cy + Math.sin(a) * 22.2, 0.7, CREAM); }
  } },
  // an oval rug: Jigglypuff's curl swirled big across it, notes round about
  { ...ROOM, id: 'puffcurlrug', name: 'Jigglypuff curl rug', w: 3, h: 2, layer: 'rug', price: 320, high: 0.04, side: 'p', flat(w, h) {
    oval(w / 2, h / 2, w / 2 - 1, h / 2 - 1, ROSE);
    oval(w / 2, h / 2, w / 2 - 3.5, h / 2 - 3.5, PINK);
    const pts = [];
    for (let i = 0; i <= 40; i++) { const t = i / 40, a = -Math.PI / 2 + t * Math.PI * 3.6, r = 22 * (1 - t * 0.82); pts.push([w / 2 + Math.cos(a) * r * 1.25, h / 2 + 2 + Math.sin(a) * r]); }
    stroke(pts, DEEP, 4.2, false); stroke(pts, sh(PINK, 1), 1.4, false);
    for (const [nx, ny, c] of [[14, 20, TEAL], [80, 18, TEAL], [18, 46, CREAM], [78, 44, CREAM], [48, 8, CREAM]]) {
      oval(nx, ny, 2.6, 2, c); R(nx + 1.8, ny - 8, 1, 8, c); stroke([[nx + 2.3, ny - 8], [nx + 5, ny - 5]], c, 1, false);
    }
    for (let i = 0; i < 36; i++) { const a = i / 36 * Math.PI * 2; disc(w / 2 + Math.cos(a) * (w / 2 - 2.2), h / 2 + Math.sin(a) * (h / 2 - 2.2), 0.6, CREAM); }
  } },
  // notes on the wall: Jigglypuff's song, an eighth, a beamed pair, a quarter
  { ...ROOM, id: 'puffnotes', name: 'Jigglypuff song notes', w: 2, h: 1, layer: 'wall', price: 220, wall(x) {
    const g = ctx(), head = (hx, hy, c) => { g.save(); g.translate(x + hx, hy); g.rotate(NOTE.tilt); ovalShade(0, 0, NOTE.rx, NOTE.ry, c); g.restore(); };
    const stem = (hx, hy, c) => R(x + hx + 3.4 - NOTE.sw / 2, hy - NOTE.stem, NOTE.sw, NOTE.stem - 0.5, c);
    for (const [kind, hx, hy, c, hx2, hy2] of NOTES) {
      stem(hx, hy, c); head(hx, hy, c);
      if (kind === 'eighth') stroke([[x + hx + 3.4, hy - NOTE.stem], [x + hx + 8, hy - NOTE.stem + 6], [x + hx + 7, hy - NOTE.stem + 11]], c, 1.8);
      if (kind === 'pair') {
        stem(hx2, hy2, c); head(hx2, hy2, c);
        poly([[x + hx + 2.5, hy - NOTE.stem - 1], [x + hx2 + 4.3, hy2 - NOTE.stem - 1], [x + hx2 + 4.3, hy2 - NOTE.stem + 3], [x + hx + 2.5, hy - NOTE.stem + 3]], c);
      }
    }
  } },
  // a portrait someone fell asleep for, scribbled over in marker, in a pink frame with Jigglypuff's ears and curl
  { ...ROOM, id: 'puffportrait', name: 'Jigglypuff scribbled portrait', w: 1, h: 1, layer: 'wall', price: 340, wall(x) {
    earP([x + 5, 26], [x + 12, 22], [x + 4, 13]); earP([x + 27, 26], [x + 20, 22], [x + 28, 13]);
    curlP(tuftPts(x + 16, 26, 8, -0.4), 1.3);
    rr(x + 4, 22, 24, 30, 2, ROSE);
    const g = ctx(); g.save(); g.translate(x + 7, 25); portrait(g, 0, 0, 18, 24); g.restore();
  } },
  // a microphone stand: Jigglypuff's marker-pen microphone on a pink stand with its ears and curl
  { ...ROOM, id: 'puffmic', name: 'Jigglypuff microphone', w: 1, h: 1, price: 420, draw: up(1, (x, Y) => {
    floorShadow(x + 5, Y(0), 22);
    earP([x + 10, Y(4)], [x + 13.5, Y(5.6)], [x + 8.5, Y(11)]); earP([x + 22, Y(4)], [x + 18.5, Y(5.6)], [x + 23.5, Y(11)]);
    ovalShade(x + 16, Y(2), 9, 5, PINK); R(x + 7, Y(2), 18, 2, PINK);
    curlP(tuftPts(x + 16, Y(-1), 6), 1);
    R(x + 15.2, Y(57), 1.6, 52, MIC);
    rr(x + 14, Y(60), 4, 4, 1, MIC);
    rr(x + 13.6, Y(73), 4.8, 15, 2, CREAM); R(x + 13.6, Y(66), 4.8, 2, ROSE);
    disc(x + 16, Y(75.5), 3.6, sh(MIC, -1)); disc(x + 16, Y(75.5), 3, MIC);
    for (const [dx, dy] of [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]]) disc(x + 16 + dx * 1.3, Y(75.5) + dy * 1.3, 0.4, sh(MIC, 1));
  }) },
  // a round pink stage with footlights, Jigglypuff's curl swirled up behind it
  { ...ROOM, id: 'puffstage', name: 'Jigglypuff stage', w: 2, h: 2, price: 1100, seat: 'cushion', glow: [BULB], draw: up(2, (x, Y) => {
    floorShadow(x, Y(0), 64);
    stroke(STAGE_CURL.map(([a, h]) => [x + a, Y(h)]), sh(PINK, -1), 7.4);
    stroke(STAGE_CURL.map(([a, h]) => [x + a, Y(h)]), PINK, 6);
    rr(x + 2, Y(10), 60, 10, 3, PINK);
    oval(x + 32, Y(10), 29, 1.6, sh(PINK, 1));
    R(x + 2.5, Y(8), 59, 2, ROSE);
    for (let i = 0; i < 5; i++) { disc(x + 10 + i * 11, Y(3.5), 2.2, sh(ROSE, -1)); disc(x + 10 + i * 11, Y(3.5), 1.8, BULB); }
  }) },
  // a karaoke machine: a squat pink Jigglypuff, the lyrics on its forehead, its speakers its eyes
  { ...ROOM, id: 'puffkaraoke', name: 'Jigglypuff karaoke machine', w: 1, h: 1, price: 1150, draw: up(1, (x, Y) => {
    floorShadow(x + 2, Y(0), 28);
    earP([x + 6, Y(35)], [x + 13, Y(40)], [x + 4, Y(50)]); earP([x + 26, Y(35)], [x + 19, Y(40)], [x + 28, Y(50)]);
    curlP(tuftPts(x + 16, Y(39), 8, -0.5), 1.3);
    feetP(x, Y, [10, 22], 3.5, 1.6);
    rr(x + 4, Y(40), 24, 37, 6, PINK);
    rr(x + 7, Y(36), 18, 11, 2, SCREEN);
    for (let i = 0; i < 5; i++) R(x + 9 + i * 3, Y(27 + (i * 7 % 5) + 1.5), 2, (i * 7 % 5) + 1.5, i % 2 ? TEAL : DEEP);
    for (const s of [-1, 1]) {
      const cx = x + 16 + s * 5.2;
      disc(cx, Y(16), 4.4, INK); disc(cx, Y(16), 4, TEAL); disc(cx, Y(16), 2.4, TEALD);
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) disc(cx + dx * 1.2, Y(16) + dy * 1.2, 0.35, TEAL);
      disc(cx - 1.4, Y(17.6), 1, '#ffffff');
    }
    smile(x + 16, Y(9), 3, INK, 0.7);
  }) },
  // a pouf: Jigglypuff squashed round and asleep, ears and curl on top
  { ...ROOM, id: 'puffpouf', name: 'Jigglypuff pouf', w: 1, h: 1, price: 260, seat: 'cushion', draw: up(1, (x, Y) => {
    floorShadow(x + 2, Y(0), 28);
    earP([x + 9, Y(18)], [x + 4, Y(14.5)], [x + 3, Y(26)]); earP([x + 23, Y(18)], [x + 28, Y(14.5)], [x + 29, Y(26)]);
    ovalShade(x + 16, Y(10), 13.5, 10, PINK);
    curlP(tuftPts(x + 16, Y(10.5), 9), 1.3);
    for (const s of [-1, 1]) smile(x + 16 + s * 5, Y(9.5), 3.4, INK, 0.7);
    smile(x + 16, Y(5.6), 1.8, INK, 0.6);
  }) },
  // a music box that plays Jigglypuff's lullaby: a round pink box with its face, the curl turning on top
  { ...ROOM, id: 'puffmusicbox', name: 'Jigglypuff music box', w: 1, h: 1, price: 460, draw: up(1, (x, Y) => {
    floorShadow(x + 5, Y(0), 22);
    for (const fx of [9, 16, 23]) disc(x + fx, Y(1.2), 1.4, ROSE);
    rr(x + 6, Y(14), 20, 12, 3, PINK);
    R(x + 6, Y(4), 20, 1.6, ROSE);
    rr(x + 26, Y(10), 3, 2, 0.6, DEEP); rr(x + 28, Y(12), 1.2, 6, 0.5, DEEP);
    for (const s of [-1, 1]) eyeP(x + 16 + s * 4.2, Y(9.2), 2.2, 2.6, false);
    smile(x + 16, Y(6.4), 1.6, INK, 0.5);
    oval(x + 16, Y(14.5), 10.6, 1.8, ROSE);
    curlP(tuftPts(x + 17, Y(8.4), 14), 2);
    rr(x + 11.6, Y(16.2), 6, 1, 0.4, CREAM);
  }) },
  // a pot of marker pens: Jigglypuff, its head full of the markers it draws on sleepers with
  { ...ROOM, id: 'puffmarkers', name: 'Jigglypuff marker pot', w: 1, h: 1, price: 180, draw: up(1, (x, Y) => {
    floorShadow(x + 6, Y(0), 20);
    headP(x + 16, Y(9.5), 9.5, { eyes: 'open', mouth: true, behind() {
      [[11, 25, DEEP], [14.5, 27, TEAL], [18, 26, '#f0c040'], [21.5, 23, '#9a70d8']].forEach(([mx, top, c]) => {
        rr(x + mx - 1.4, Y(top - 3), 2.8, top - 10, 0.8, CREAM); rr(x + mx - 1.5, Y(top), 3, 4, 1, c);
      });
    } });
  }) },
  // a bunch of balloons, each a Jigglypuff: it is the Balloon Pokémon
  { ...ROOM, id: 'puffballoons', name: 'Jigglypuff balloons', w: 1, h: 1, price: 280, draw: up(1, (x, Y) => {
    floorShadow(x + 8, Y(0), 16);
    for (const [bx, bh] of BALLOONS) stroke([[x + 16, Y(6)], [x + bx, Y(bh - 7.5)]], '#c8b8c0', 0.5, false);
    rr(x + 12, Y(6), 8, 6, 2, ROSE);
    for (const i of [0, 2, 1]) {
      const [bx, bh] = BALLOONS[i];
      headP(x + bx, Y(bh), 7, { eyes: 'open', mouth: true });
    }
  }) },
  // the Moon Stone Jigglypuff evolves by, glowing on a pink cushion on a little pedestal
  { ...ROOM, id: 'puffmoonstone', name: 'Jigglypuff Moon Stone', w: 1, h: 1, price: 720, glow: [MOON], draw: up(1, (x, Y) => {
    floorShadow(x + 7, Y(0), 18);
    rr(x + 8, Y(2), 16, 2, 1, ROSE);
    rr(x + 9, Y(10), 14, 9, 2, PINK);
    curlP(tuftPts(x + 16.5, Y(-1), 6), 0.9, DEEP);
    cushion(x + 7, Y(14), 18, 5, ROSE, 2);
    ovalShade(x + 16, Y(20.5), 6, 6.5, STONE);
    const g = ctx(); g.strokeStyle = MOON; g.lineWidth = 1.8; g.lineCap = 'round';
    g.beginPath(); g.arc(x + 16, Y(20.5), 3, Math.PI * 0.55, Math.PI * 1.6); g.stroke();
  }) },
  // a stage spotlight on its tripod: its lamp Jigglypuff's head, the barn doors its ears, its face the glowing lens
  { ...ROOM, id: 'puffspotlight', name: 'Jigglypuff spotlight', w: 1, h: 1, price: 460, glow: [BULB], draw: up(1, (x, Y) => {
    floorShadow(x + 2, Y(0), 28);
    for (const fx of [4, 28]) stroke([[x + 16, Y(36)], [x + fx, Y(0.5)]], MIC, 1.6, false);
    R(x + 15.2, Y(36), 1.6, 36, sh(MIC, -1));
    stroke([[x + 6, Y(46)], [x + 6, Y(38)], [x + 26, Y(38)], [x + 26, Y(46)]], MIC, 1.4, false);
    headP(x + 16, Y(46), 9.5, { eyes: false });
    disc(x + 16, Y(46), 6.6, sh(BULB, -1)); disc(x + 16, Y(46), 5.8, BULB); disc(x + 14, Y(48), 1.6, '#ffffff');
  }) },
];

/* the stage's big curl, from the stage's back up and round: [x, height] in painted units */
export const STAGE_CURL = (() => {
  const pts = [[34, 10]];
  for (let i = 0; i <= 12; i++) { const t = i / 12, a = -Math.PI / 2 + t * Math.PI * 2.1, r = 18 * (1 - t * 0.72); pts.push([32 + Math.cos(a) * r * 1.1, 46 + Math.sin(a) * r]); }
  return pts;
})();
/* the balloons' middles: [x, height] */
export const BALLOONS = [[8.5, 60], [16, 74], [23.5, 62]];
