/* base-furniture-lapras.js  -  the Lapras room (furniture expansion session a, 2026-10-17): 25 pieces each shaped after
   Lapras, like Pokémon Center merch: its sky-blue body and cream throat, the grey knobbly shell on its back, its long neck,
   the curled horn and little ear-flaps on its head, gentle dark eyes, its flippers, and what it lives for (the sea,
   ferrying people across it, singing). One colour each, Lapras's own.
   An upright piece is a list of parts in painted units (32 a tile): `x` across from the left of its front, `h` up from
   the floor (a wall piece's from the foot of its strip), `z` out to the front from its middle (a wall piece's from the
   wall). They're painted here from any side, and js/base-models-lapras.js builds the same list as 3D parts (BUILT), so
   picture and model agree. The neck is a tube along a curve (`tube`), sampled the same way by both. The two rugs are
   painted from above (RUGS: their outline, for the model). */

import { R, oval, ovalShade, floorShadow, ctx, sh } from './base-paint.js';

export const LAP = {
  body: '#58a8e0', deep: '#3a84c0', soft: '#84c4ee', horn: '#4a96d4', cream: '#f4ecd2', shell: '#9aa0b0', shellIn: '#80869a',
  knob: '#6a7084', ink: '#1a2636', white: '#ffffff', glow: '#b4e2fc', sea: '#3a88d0', water: '#7cc8ec', foam: '#ffffff',
  mirror: '#d8e8f2', dark: '#1c2632', kelp: '#4aa058', kelp2: '#3a8448', soil: '#5a3a24', fish: '#f08038', pillow: '#fbf8ee',
  string: '#e8d8a0', ice: '#d8f2ff',
};
const { body: BODY, cream: CREAM, shell: SHELL, knob: KNOB, ink: INK } = LAP;
const GROUP = 'Lapras room';
const TAU = Math.PI * 2;

/* ---------- parts ---------- */
const B = (x, h, z, rx, ry, rz, c, o) => ({ t: 'blob', x, h, z, rx, ry, rz, c, ...o });
const BX = (x, h, z, w, hh, d, c, o) => ({ t: 'box', x, h, z, w, hh, d, c, r: 2, ...o });
const CY = (x, h, z, r, hh, c, o) => ({ t: 'cyl', x, h, z, r, hh, c, ...o });
const DZ = (x, h, z, r, th, c, o) => ({ t: 'disc', x, h, z, r, th, c, ...o });
/** A cone standing on its base at x, h, z: `tilt` leans it right, `fwd` points it out to the front. */
const CN = (x, h, z, r, hh, c, o) => ({ t: 'cone', x, h, z, r, hh, c, tilt: 0, ...o });
/** A drawn line on a surface at z, `bend` lifting its middle. */
const LN = (x0, h0, x1, h1, z, w, c, o) => ({ t: 'line', x: (x0 + x1) / 2, h: (h0 + h1) / 2, x0, h0, x1, h1, z, w, c, m: 'plain', bend: 0, ...o });
/** A lathe from h up, its profile [[r, up]...]. */
const LA = (x, h, z, pts, c, o) => ({ t: 'lathe', x, h, z, pts, c, ...o });
/** A ring facing the front, R round, r thick. */
const TO = (x, h, z, R0, r, c, o) => ({ t: 'ring', x, h, z, R: R0, r, c, ...o });
/** A tube along a smooth curve through [[x, h, z, r]...]. */
const TB = (pts, c, o) => ({ t: 'tube', pts, c, x: avg(pts, 0), h: avg(pts, 1), z: avg(pts, 2), ...o });
/** A painting-only touch, front view only (a TV's picture, a dial's ticks). */
const FN = (z, fn) => ({ t: 'fn', x: 0, h: 0, z, fn, paintOnly: true });
const avg = (pts, i) => pts.reduce((s, p) => s + p[i], 0) / pts.length;

/** Points along a Catmull-Rom curve through [[x, h, z, r]...], `n` a span. */
export function curve(pts, n = 6) {
  const P = [pts[0].map((v, i) => 2 * v - pts[1][i]), ...pts, pts[pts.length - 1].map((v, i) => 2 * v - pts[pts.length - 2][i])], out = [];
  for (let s = 1; s < P.length - 2; s++) {
    for (let k = 0; k < n || (s === P.length - 3 && k === n); k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push(P[s].map((_, i) => 0.5 * (2 * P[s][i] + (-P[s - 1][i] + P[s + 1][i]) * t + (2 * P[s - 1][i] - 5 * P[s][i] + 4 * P[s + 1][i] - P[s + 2][i]) * t2 + (-P[s - 1][i] + 3 * P[s][i] - 3 * P[s + 1][i] + P[s + 2][i]) * t3)));
    }
  }
  return out;
}

/** Where a point lands on an ellipsoid's front, for drawing on a rounded face. */
const ellOn = (cx, ch, cz, rx, ry, rz) => (px, ph) => cz + rz * Math.sqrt(Math.max(0, 1 - ((px - cx) / rx) ** 2 - ((ph - ch) / ry) ** 2));

/** Lapras's head r across, rz deep, looking out front: the curled horn, the ear-flaps, its snout, gentle eyes, a smile. */
function head(x, h, z, r, rz, { m, glow } = {}) {
  const c = glow ? LAP.glow : BODY, mm = glow ? 'glow' : m, out = [];
  for (const s of [-1, 1]) out.push(CN(x + s * r * 0.7, h + r * 0.22, z - rz * 0.25, r * 0.24, r * 0.55, c, { tilt: s * 1.05, m: mm }));
  out.push(CN(x, h + r * 0.6, z - rz * 0.1, r * 0.22, r * 0.5, glow ? c : LAP.horn, { tilt: 0.12, m: mm }));
  out.push(CN(x + r * 0.1, h + r * 1.02, z - rz * 0.1, r * 0.12, r * 0.32, glow ? c : LAP.horn, { tilt: 1.15, m: mm }));
  out.push(B(x, h, z, r, r * 0.84, rz, c, { m: mm }));
  const sh0 = h - r * 0.36, sz = z + rz * 0.42, srx = r * 0.7, sry = r * 0.44, srz = rz * 0.6;
  out.push(B(x, sh0, sz, srx, sry, srz, c, { m: mm }));
  const on = ellOn(x, h, z, r, r * 0.84, rz), onS = ellOn(x, sh0, sz, srx, sry, srz);
  for (const s of [-1, 1]) {
    const ex = x + s * r * 0.42, eh = h + r * 0.12;
    out.push(B(ex, eh, on(ex, eh) - r * 0.05, r * 0.14, r * 0.2, r * 0.1, INK, { m: 'gloss' }));
    out.push(B(ex - r * 0.04, eh + r * 0.08, on(ex, eh) + r * 0.03, r * 0.05, r * 0.06, r * 0.04, LAP.white, { m: 'gloss' }));
  }
  const mh = sh0 - r * 0.06;
  out.push(LN(x - r * 0.32, mh, x + r * 0.32, mh, onS(x, mh) + 0.3, Math.max(0.7, r * 0.08), INK, { bend: -r * 0.08 }));
  return out;
}

/** Its long neck, blue with the cream throat down its front. */
const neck = (pts) => [TB(pts, BODY), TB(pts.map(([x, h, z, r]) => [x, h, z + r * 0.42, r * 0.62]), CREAM)];

/** A flipper reaching out to side s, r long. */
const flipper = (x, h, z, r, s, o) => B(x, h, z, r * 1.25, r * 0.42, r * 0.85, BODY, { tilt: s * 0.35, ...o });

/** Knobs round the top of a shell's outline at angles from straight up (positive to the right). */
const rimKnobs = (cx, ch, z, rx, ry, angles, kr, kh) => angles.map(a => CN(cx + Math.sin(a) * rx * 0.86, ch + Math.cos(a) * ry * 0.86, z, kr, kh, KNOB, { tilt: a, m: 'gloss' }));
/** Knobs pointing out of a face at z (`back` out of the back). */
const faceKnobs = (spots, z, kr, kh, o) => spots.map(([x, h]) => CN(x, h, z, kr, kh, KNOB, { fwd: true, m: 'gloss', ...o }));
/** A shell's knob pattern over an oval rx by ry centred at cx, ch, on its surface `on`. */
const KNOBS = [[0, 0.52], [-0.5, 0.24], [0.5, 0.24], [-0.2, 0.02], [0.24, -0.04], [-0.5, -0.3], [0.48, -0.32], [0, -0.5]];
const shellKnobs = (cx, ch, rx, ry, on, kr, kh, spots = KNOBS) => spots.map(([a, b]) => { const x = cx + a * rx, h = ch + b * ry; return CN(x, h, on(x, h) - kh * 0.25, kr, kh, KNOB, { fwd: true, m: 'gloss' }); });

/* ---------- painting the parts ---------- */

const shine = (g, x0, y0, x1, y1, c) => {
  const l = g.createLinearGradient(x0, y0, x1, y1);
  l.addColorStop(0, sh(c, 1)); l.addColorStop(0.35, c); l.addColorStop(1, sh(c, -1));
  return l;
};
/** A superellipse k (1 an oval, under 1 boxier) lit from the top left, leaning `tilt`. */
function supr(cx, cy, rx, ry, k, c, tilt = 0, alpha = 1) {
  if (rx <= 0 || ry <= 0) return;
  const g = ctx();
  g.save(); g.globalAlpha *= alpha; g.translate(cx, cy); if (tilt) g.rotate(tilt); g.scale(1, ry / rx);
  const t = g.createRadialGradient(-rx * 0.35, -rx * 0.42, 0, 0, 0, rx * 1.05);
  t.addColorStop(0, sh(c, 1)); t.addColorStop(0.55, c); t.addColorStop(1, sh(c, -1));
  g.fillStyle = t; g.beginPath();
  if (k === 1) g.arc(0, 0, rx, 0, TAU);
  else for (let i = 0; i < 64; i++) { const a = i / 64 * TAU, co = Math.cos(a), si = Math.sin(a); g.lineTo(rx * Math.sign(co) * Math.abs(co) ** k, rx * Math.sign(si) * Math.abs(si) ** k); }
  g.fill(); g.restore();
}
function rbx(x, y, w, h, r, c, alpha = 1) {
  if (w <= 0 || h <= 0) return;
  const g = ctx();
  g.save(); g.globalAlpha *= alpha;
  g.fillStyle = shine(g, x, y, x + w * 0.3, y + h, c); g.beginPath(); g.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); g.fill();
  if (h > 3 && w > 3) { g.fillStyle = sh(c, 1); g.globalAlpha *= 0.6; g.beginPath(); g.roundRect(x + Math.min(r, w / 2) * 0.6, y + 0.4, w - Math.min(r, w / 2) * 1.2, 0.7, 0.35); g.fill(); }
  g.restore();
}
function poly(pts, c, horiz) {
  const g = ctx(), xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  g.fillStyle = horiz ? (() => { const l = g.createLinearGradient(x0, 0, x1, 0); l.addColorStop(0, sh(c, -1)); l.addColorStop(0.3, sh(c, 1)); l.addColorStop(0.55, c); l.addColorStop(1, sh(c, -1)); return l; })() : shine(g, x0, y0, x1, y1, c);
  g.beginPath(); pts.forEach(([x, y]) => g.lineTo(x, y)); g.closePath(); g.fill();
}
/** A tube's outline seen flat: its samples [[px, py, r]...] widened either side, round at both ends. */
function tubeShape(S, c) {
  const g = ctx(), L = [], Rr = [];
  S.forEach(([x, y, r], i) => {
    const a = S[Math.max(0, i - 1)], b = S[Math.min(S.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    const nx = -dy / l, ny = dx / l;
    L.push([x + nx * r, y + ny * r]); Rr.push([x - nx * r, y - ny * r]);
  });
  const xs = S.map(p => p[0]), x0 = Math.min(...xs) - 4, x1 = Math.max(...xs) + 4, l = g.createLinearGradient(x0, 0, x1, 0);
  l.addColorStop(0, sh(c, -1)); l.addColorStop(0.35, sh(c, 1)); l.addColorStop(0.6, c); l.addColorStop(1, sh(c, -1));
  g.fillStyle = l; g.beginPath();
  [...L, ...Rr.reverse()].forEach(p => g.lineTo(...p)); g.closePath();
  for (const [x, y, r] of [S[0], S[S.length - 1]]) { g.moveTo(x + r, y); g.arc(x, y, r, 0, TAU); }
  g.fill('nonzero');
}

/** Paints parts seen from `dir` (0 front, 2 back, 1 / 3 the sides), on a view vw wide standing on line b; W is the
    piece's front width in units. */
function paintParts(parts, x0, b, vw, dir, W) {
  const side = dir % 2 === 1, sg = dir === 3 ? -1 : 1, g = ctx();
  const U = (px, pz) => dir === 0 ? x0 + px : dir === 2 ? x0 + W - px : x0 + vw / 2 + sg * pz;
  const key = (q) => q.k ?? (dir === 0 ? q.z : dir === 2 ? -q.z : sg * (W / 2 - q.x));
  const list = parts.map((q, i) => [key(q), i, q]).sort((a, c) => a[0] - c[0] || a[1] - c[1]).map(e => e[2]);
  for (const q of list) {
    const front = q.paintOnly || q.t === 'line';
    if (front && dir !== 0) continue;
    const cx = U(q.x, q.z), cy = b - q.h, tilt = side ? 0 : dir === 2 ? -(q.tilt || 0) : q.tilt || 0, a = q.m === 'glass' ? 0.55 : 1;
    switch (q.t) {
      case 'blob': supr(cx, cy, side ? q.rz : q.rx, q.ry, q.ev ?? 1, q.c, tilt, a); break;
      case 'box': { const w = side ? q.d : q.w; rbx(cx - w / 2, cy - q.hh / 2, w, q.hh, q.r, q.c, a); break; }
      case 'cyl': {
        poly([[cx - q.r, cy - q.hh / 2], [cx + q.r, cy - q.hh / 2], [cx + q.r, cy + q.hh / 2], [cx - q.r, cy + q.hh / 2]], q.c, true);
        oval(cx, cy - q.hh / 2, q.r, Math.min(q.r * 0.25, q.hh / 2), sh(q.c, 1));
        break;
      }
      case 'disc': if (side) rbx(cx - q.th / 2, cy - q.r, q.th, q.r * 2, q.th / 2, q.c); else ovalShade(cx, cy, q.r, q.r, q.c); break;
      case 'cone': {
        if (q.fwd) { ovalShade(cx, cy, q.r, q.r, q.c); break; }
        const s = Math.sin(tilt), c = Math.cos(tilt);
        poly([[cx + s * q.hh, cy - c * q.hh], [cx + c * q.r, cy + s * q.r], [cx - c * q.r, cy - s * q.r]], q.c);
        break;
      }
      case 'lathe': {
        const pts = q.pts.map(([r, up]) => [r, cy - up]);
        g.save(); g.globalAlpha *= a;
        poly([...pts.map(([r, y]) => [cx - r, y]), ...pts.slice().reverse().map(([r, y]) => [cx + r, y])], q.c, true);
        g.restore();
        if (q.m === 'glass') { g.save(); g.globalAlpha = 0.7; g.fillStyle = '#ffffff'; const t = pts[pts.length - 1][1], f = pts[0][1]; g.fillRect(cx - pts[2][0] * 0.66, t + (f - t) * 0.25, Math.max(0.8, pts[2][0] * 0.14), (f - t) * 0.5); g.restore(); }
        break;
      }
      case 'ring': {
        if (side) { rbx(cx - q.r, cy - q.R - q.r, q.r * 2, (q.R + q.r) * 2, q.r, q.c); break; }
        g.strokeStyle = shine(g, cx - q.R, cy - q.R, cx + q.R * 0.3, cy + q.R, q.c); g.lineWidth = q.r * 2;
        g.beginPath(); g.arc(cx, cy, q.R, 0, TAU); g.stroke();
        break;
      }
      case 'tube': tubeShape(curve(q.pts).map(([x, h, z, r]) => [U(x, z), b - h, r]), q.c); break;
      case 'line': {
        const p0 = [U(q.x0), b - q.h0], p1 = [U(q.x1), b - q.h1], mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2 - q.bend * 2;
        g.strokeStyle = q.c; g.lineWidth = q.w; g.lineCap = 'round';
        g.beginPath(); g.moveTo(...p0); g.quadraticCurveTo(mx, my, ...p1); g.stroke();
        break;
      }
      case 'fn': q.fn(g, (px) => x0 + px, (h) => b - h); break;
    }
  }
}

/* ---------- the kinds ---------- */

/** What js/base-models-lapras.js builds for each upright and wall kind: its parts, doors and default material. */
export const BUILT = {};

function piece(id, name, w, h, price, mat, parts, { doors = [], inside, ...rest } = {}) {
  BUILT[id] = { parts, doors, inside, mat };
  const all = [...parts, ...doors.flatMap(d => d.parts)];
  return { id, name, group: GROUP, solo: true, w, h, price, ...rest, draw(x, b, vw, dir) { floorShadow(x, b, vw); paintParts(all, x, b, vw, dir, w * 32); } };
}
function wallPiece(id, name, w, price, mat, parts, rest = {}) {
  BUILT[id] = { parts, doors: [], mat };
  return { id, name, group: GROUP, solo: true, w, h: 1, layer: 'wall', price, ...rest, wall(x) { paintParts(parts, x, 96, w * 32, 0, w * 32); } };
}

/* the rugs, seen from above: their outline as ovals [cx, cy, rx, ry], in painted units (the top of the picture is the back) */
export const RUGS = {
  laprswimrug: { ovals: [[32, 38, 21, 22], [32, 15, 4.5, 8], [32, 7, 7.5, 6.5], [12, 29, 9.5, 5], [52, 29, 9.5, 5], [15, 55, 7.5, 4.5], [49, 55, 7.5, 4.5]] },
  laprwaverug: { ovals: [[32, 32, 31, 29]] },
};

const BOOKS = ['#d85848', '#e8c050', '#5888d0', '#68a858', '#a868c8', '#e88848', '#f0ece0'];
/** A row of books standing on a shelf at h, from x0 to x1. */
const books = (x0, x1, h, z, n) => {
  const out = [];
  for (let x = x0, i = n; x < x1 - 2; i++) {
    const w = 2.4 + (i * 7 % 5) * 0.4, hh = 10 + (i * 5 % 4) * 1.2;
    out.push(BX(x + w / 2, h + hh / 2, z, w, hh, 7, BOOKS[i % BOOKS.length], { r: 0.05, m: 'gloss' }));
    x += w + 0.3;
  }
  return out;
};

/** The TV's picture: Lapras ferrying across a sunset sea. */
const tvPicture = (g, X, Y) => {
  const x = X(10), y = Y(45), w = 44, h = 30;
  const s = g.createLinearGradient(0, y, 0, y + h); s.addColorStop(0, '#f8a868'); s.addColorStop(0.55, '#fcd890'); s.addColorStop(0.56, '#3a88d0'); s.addColorStop(1, '#2a68b0');
  g.fillStyle = s; g.beginPath(); g.roundRect(x, y, w, h, 3); g.fill();
  g.fillStyle = '#fff2b0'; g.beginPath(); g.arc(x + 34, y + 16.5, 5, Math.PI, TAU); g.fill();
  g.fillStyle = '#ffffff'; for (const [wx, wy] of [[6, 21], [26, 24], [36, 20], [14, 26]]) g.fillRect(x + wx, y + wy, 5, 0.8);
  g.fillStyle = SHELL; g.beginPath(); g.ellipse(x + 16, y + 17, 7, 3.4, 0, Math.PI, TAU); g.fill();
  g.fillStyle = BODY; g.beginPath(); g.ellipse(x + 16, y + 17.5, 9, 2, 0, 0, TAU); g.fill();
  g.strokeStyle = BODY; g.lineWidth = 2.2; g.lineCap = 'round'; g.beginPath(); g.moveTo(x + 23, y + 17); g.quadraticCurveTo(x + 27, y + 12, x + 25, y + 8); g.stroke();
  g.fillStyle = BODY; g.beginPath(); g.ellipse(x + 26, y + 7.5, 2.8, 2.1, 0, 0, TAU); g.fill();
  g.fillStyle = INK; g.fillRect(x + 26.6, y + 6.8, 0.9, 0.9);
  g.fillStyle = '#e85848'; g.fillRect(x + 14, y + 11, 2, 3); g.fillStyle = '#f4d0a0'; g.beginPath(); g.arc(x + 15, y + 10.2, 1.1, 0, TAU); g.fill();
};
/** A dial's hour ticks. */
const dialTicks = (cx, ch, r) => (g, X, Y) => {
  g.fillStyle = LAP.knob;
  for (let i = 0; i < 12; i++) { if (i % 3 === 0) continue; const a = i / 12 * TAU; g.beginPath(); g.arc(X(cx) + Math.sin(a) * r, Y(ch) - Math.cos(a) * r, 0.7, 0, TAU); g.fill(); }
};
/** A snowflake of three crossing lines. */
const flake = (x, h, z, r, c) => [0, 1, 2].map(i => { const a = i * Math.PI / 3; return LN(x - Math.cos(a) * r, h - Math.sin(a) * r, x + Math.cos(a) * r, h + Math.sin(a) * r, z, 1.1, c, { m: 'gloss' }); });

export const LAPRAS_KINDS = [
  // a bed on its back: its grey shell the headboard, knobs and all, its head peeking over, flippers at the corners
  piece('laprbed', 'Lapras shell bed', 2, 2, 1200, 'cloth', [
    ...neck([[32, 40, -28, 5], [31, 56, -27, 4.6], [33, 66, -24, 4.2]]),
    ...head(33, 72, -21, 10, 8),
    B(32, 32, -25, 29, 22, 6, SHELL, { m: 'gloss' }),
    B(32, 31, -20.5, 22, 15, 1.5, LAP.shellIn, { m: 'gloss' }),
    ...rimKnobs(32, 32, -25, 29, 22, [-1.2, -0.75, -0.3, 0.3, 0.75, 1.2], 2.6, 5.5),
    ...faceKnobs([[18, 38], [32, 42], [46, 38], [24, 28], [40, 28]], -19.5, 1.8, 2.6),
    flipper(7, 7, -20, 5.2, -1), flipper(57, 7, -20, 5.2, 1),
    B(32, 9, 0, 31, 9, 30, BODY, { ev: 0.6, e: 0.7, m: 'gloss' }),
    B(32, 17, 3, 27, 6, 26, CREAM, { ev: 0.5, e: 0.6 }),
    B(32, 22.5, -18, 15, 3.5, 6, LAP.pillow),
    B(32, 21, 11, 27.5, 3.5, 17, LAP.soft, { ev: 0.5, e: 0.6 }),
    flipper(7, 7, 24, 5.6, -1), flipper(57, 7, 24, 5.6, 1),
  ], { seat: 'bed' }),

  // its long neck the lamp's stem, rising from its shell, its head the glowing light
  piece('laprlamp', 'Lapras long-neck lamp', 1, 1, 450, 'gloss', [
    B(16, 3.5, 0, 14.5, 3.5, 14.5, BODY, { ev: 0.5, e: 0.6 }),
    B(16, 7, -1, 12.5, 7, 11.5, SHELL, { ev: 0.75 }),
    ...rimKnobs(16, 3, -1, 12, 9, [-1.05, -0.5, 0.05, 0.6], 1.8, 3.6),
    ...neck([[16, 10, 3, 3.4], [18, 28, 4, 3], [15, 44, 3, 2.8], [16, 54, 2, 2.6]]),
    ...head(16, 61, 3, 9, 7.5, { glow: true }),
  ], { glow: [LAP.glow] }),

  // its shell the back, its body the seat, flippers for feet, its head peeking over the top
  piece('laprchair', 'Lapras shell chair', 1, 1, 300, 'cloth', [
    ...neck([[16, 36, -12, 3.6], [16, 43, -11, 3.2]]),
    ...head(16, 48, -9, 7.5, 6),
    B(16, 26, -10, 15, 14, 5, SHELL, { m: 'gloss', ev: 0.85 }),
    B(16, 25, -6, 11, 9.5, 1.2, LAP.shellIn, { m: 'gloss' }),
    ...rimKnobs(16, 26, -10, 15, 14, [-1.25, -0.7, 0.7, 1.25], 1.9, 3.6),
    B(16, 9, 1, 15, 6, 14, BODY, { ev: 0.55, e: 0.6, m: 'gloss' }),
    B(16, 15, 3, 13, 2.6, 11, CREAM, { ev: 0.5, e: 0.6 }),
    flipper(5.5, 3, 10, 4, -1), flipper(26.5, 3, 10, 4, 1),
  ]),

  // its shell the back, its flippers the arms, its neck rising off one end
  piece('laprsofa', 'Lapras sofa', 2, 1, 900, 'cloth', [
    ...neck([[8, 22, -5, 4.2], [6, 38, -7, 3.8], [9, 50, -6, 3.4]]),
    ...head(13, 55, -4, 8, 6.5),
    B(34, 27, -10, 28, 16, 6, SHELL, { m: 'gloss', ev: 0.85 }),
    B(34, 26, -5.5, 21, 10, 1.2, LAP.shellIn, { m: 'gloss' }),
    ...rimKnobs(34, 27, -10, 28, 16, [-1.1, -0.55, 0, 0.55, 1.1], 2.2, 4.5),
    B(32, 8, 2, 31, 8, 14, BODY, { ev: 0.55, e: 0.6, m: 'gloss' }),
    B(32, 15, 4, 23, 3.5, 11, CREAM, { ev: 0.55, e: 0.65 }),
    B(5.5, 17, 1, 5, 6.5, 13, BODY, { ev: 0.8 }), B(58.5, 17, 1, 5, 6.5, 13, BODY, { ev: 0.8 }),
    flipper(11, 3, 12, 4, -1), flipper(53, 3, 12, 4, 1),
  ]),

  // its shell for a tabletop, flippers for legs, and Lapras peeking out from underneath
  piece('laprtable', 'Lapras table', 2, 1, 700, 'gloss', [
    ...[[8, -9], [56, -9], [8, 9], [56, 9]].flatMap(([x, z]) => [B(x, 11, z, 4, 11, 4, BODY, { ev: 0.85 }), flipper(x, 1.8, z + 1, 4.4, x < 32 ? -1 : 1)]),
    BX(32, 20.5, -1, 58, 5, 26, BODY, { r: 2.5 }),
    ...neck([[32, 4, -4, 3.6], [32, 9, 2, 3.2]]),
    ...head(32, 13, 6, 7.5, 6),
    BX(32, 24, 0, 62, 4, 30, SHELL, { r: 2 }),
    BX(32, 26.1, 0, 52, 0.6, 22, LAP.shellIn, { r: 0.25 }),
    ...faceKnobs([10, 21, 32, 43, 54].map(x => [x, 24]), 15, 1.4, 2.4),
  ]),

  // a pedestal its blue body with a cream belly drawer, a flipper for the other leg, its neck rising behind
  piece('laprdesk', 'Lapras desk', 2, 1, 650, 'gloss', [
    ...neck([[55, 28, -11, 3.2], [58, 40, -11, 3], [56, 50, -10, 2.8]]),
    ...head(52, 55, -8, 7, 5.5),
    BX(13, 12.5, 0, 22, 25, 26, BODY, { r: 4 }),
    BX(13, 17.5, 13.4, 18, 8, 1, CREAM, { r: 3 }), BX(13, 7, 13.4, 18, 8, 1, CREAM, { r: 3 }),
    ...faceKnobs([[13, 17.5], [13, 7]], 13.6, 1.4, 2),
    B(54, 13, 0, 4.5, 13, 9, BODY, { ev: 0.8 }), flipper(54, 2, 3, 4.5, 1),
    BX(32, 27, 0, 62, 4, 30, SHELL, { r: 1.5 }), BX(32, 29.2, 0, 54, 0.6, 22, LAP.shellIn, { r: 0.25 }),
    ...faceKnobs([28, 38, 48].map(x => [x, 27]), 15, 1.3, 2.2),
  ]),

  // standing tall, its knobbly shell the doors, its head on top
  piece('laprwardrobe', 'Lapras shell wardrobe', 2, 1, 900, 'gloss', [
    ...neck([[32, 74, -3, 5], [32, 82, -1, 4.4]]),
    ...head(32, 88, 1, 10, 8),
    BX(32, 40, -2, 60, 74, 26, SHELL, { r: 12 }),
    ...[-0.9, -0.35, 0.35, 0.9].map(a => CN(32 + a * 26, 76, -2, 2.6, 5, LAP.knob, { tilt: a * 0.7, m: 'gloss' })),
    B(2.5, 42, 2, 2.5, 9, 6, BODY), B(61.5, 42, 2, 2.5, 9, 6, BODY),
    flipper(14, 2.5, 8, 5, -1), flipper(50, 2.5, 8, 5, 1),
  ], {
    doors: [
      { hinge: [6.25, 11.75], side: 1, parts: [BX(18.5, 40, 11.75, 25, 60, 1.5, LAP.shellIn, { r: 7 }), ...faceKnobs([[27.5, 40], [15, 58], [15, 22], [21, 48], [12, 32]], 12.3, 1.6, 2.6)] },
      { hinge: [57.75, 11.75], side: -1, parts: [BX(45.5, 40, 11.75, 25, 60, 1.5, LAP.shellIn, { r: 7 }), ...faceKnobs([[36.5, 40], [49, 58], [49, 22], [43, 32], [52, 48]], 12.3, 1.6, 2.6)] },
    ],
    inside: { x: 32, h: 40, w: 48, hh: 56, z: 11 },
  }),

  // a low chest of drawers in its blue, knobs from its shell for handles, its shell the top, its head behind
  piece('laprdresser', 'Lapras dresser', 2, 1, 600, 'gloss', [
    ...neck([[32, 26, -11, 3.4], [32, 34, -11, 3]]),
    ...head(32, 39, -9, 7, 5.5),
    BX(32, 15, 0, 60, 22, 28, BODY, { r: 6 }),
    ...[18, 46].map(x => BX(x, 20, 14.3, 25, 8, 1, CREAM, { r: 2.5 })),
    BX(32, 10, 14.3, 53, 8, 1, CREAM, { r: 2.5 }),
    ...faceKnobs([[18, 20], [46, 20], [24, 10], [40, 10]], 14.6, 1.4, 2.2),
    BX(32, 27.5, 0, 62, 3, 30, SHELL, { r: 1.5 }),
    flipper(9, 2.5, 10, 4, -1), flipper(55, 2.5, 10, 4, 1),
  ]),

  // the ferry: its shell the case, cream shelves of books, its neck and head over one corner like a figurehead
  piece('laprshelf', 'Lapras ferry bookshelf', 2, 1, 750, 'gloss', [
    ...neck([[52, 66, -7, 4.2], [57, 78, -6, 3.8], [55, 88, -4, 3.4]]),
    ...head(51, 93, -2, 8.5, 7),
    BX(32, 38, -7, 58, 68, 18, SHELL, { r: 10 }),
    ...[-0.85, -0.35, 0.15].map(a => CN(32 + a * 26, 71, -7, 2.4, 4.6, LAP.knob, { tilt: a * 0.7, m: 'gloss' })),
    BX(32, 38, 2.2, 46, 56, 0.6, LAP.shellIn, { r: 2 }),
    ...[9, 27, 45, 63].map(h => BX(32, h, 7.5, 48, 2, 11, CREAM, { r: 0.8 })),
    ...books(10, 54, 10, 6, 0), ...books(10, 30, 28, 6, 3), ...books(38, 54, 28, 6, 5), ...books(14, 46, 46, 6, 2),
    B(5, 36, 3, 4, 26, 8, BODY, { ev: 0.85 }), B(59, 36, 3, 4, 26, 8, BODY, { ev: 0.85 }),
    flipper(14, 2.5, 9, 4.5, -1), flipper(50, 2.5, 9, 4.5, 1),
  ]),

  // its shell the dial, four big knobs for the quarters, its head on top
  wallPiece('laprclock', 'Lapras shell clock', 1, 300, 'gloss', [
    ...neck([[16, 54, 3, 3.2], [16, 60, 3.5, 2.9]]),
    ...head(16, 65, 4, 8, 4.5),
    flipper(4, 36, 3, 3.2, -1), flipper(28, 36, 3, 3.2, 1),
    B(16, 42, 3, 13, 13, 3.5, SHELL),
    DZ(16, 42, 6.6, 10, 1, CREAM), FN(8, dialTicks(16, 42, 8)),
    ...faceKnobs([[16, 50.5], [24.5, 42], [16, 33.5], [7.5, 42]], 7, 1.3, 1.8),
    LN(16, 42, 16, 49, 7.8, 1.2, INK), LN(16, 42, 20.5, 42, 7.8, 1.4, INK), B(16, 42, 8, 1, 1, 0.5, LAP.horn, { m: 'gloss' }),
  ]),

  // a TV in its shell, the knobs round the top, its head looking round the side
  piece('laprtv', 'Lapras TV', 2, 1, 1000, 'gloss', [
    ...neck([[10, 50, -5, 4], [6, 60, -4, 3.6], [9, 68, -2, 3.2]]),
    ...head(13, 72, 0, 8, 6.5),
    BX(32, 30, -4, 62, 48, 22, SHELL, { r: 12 }),
    ...[-0.25, 0.25, 0.75].map(a => CN(32 + a * 28, 53, -4, 2.6, 4.6, LAP.knob, { tilt: a * 0.6, m: 'gloss' })),
    BX(32, 30, 7.2, 52, 38, 1, BODY, { r: 8 }),
    BX(32, 30, 7.9, 44, 30, 0.8, LAP.dark, { r: 3 }), FN(9, tvPicture),
    flipper(13, 3, 7, 4.5, -1), flipper(51, 3, 7, 4.5, 1),
  ]),

  // a tall oval mirror framed in its knobbly shell, its head on top, flippers at its foot
  piece('laprmirror', 'Lapras mirror', 1, 1, 450, 'gloss', [
    ...neck([[16, 57, -2, 3.2], [16, 63, -1, 3]]),
    ...head(16, 68, 0, 7.5, 6),
    B(16, 5, 0, 14, 5, 12, BODY, { ev: 0.6, e: 0.7 }),
    B(16, 33, -2, 13.5, 25, 6, SHELL, { ev: 0.9 }),
    ...rimKnobs(16, 33, -2, 13.5, 25, [-2.2, -1.5, -0.8, 0.8, 1.5, 2.2], 1.7, 3.2),
    B(16, 33, 3.5, 9.5, 20, 1.4, LAP.mirror, { m: 'metal' }),
    LN(11.5, 38, 14, 44, 5.1, 1, '#ffffff', { m: 'gloss' }), LN(11.5, 32, 12.8, 35, 5.1, 0.8, '#ffffff', { m: 'gloss' }),
    flipper(6, 3, 9, 4, -1), flipper(26, 3, 9, 4, 1),
  ]),

  // Lapras swimming, seen from above: shell, knobs, flippers and all
  { id: 'laprswimrug', name: 'Lapras swimming rug', group: GROUP, solo: true, w: 2, h: 2, layer: 'rug', price: 400, high: 0.04, side: 'c', flat() {
    const r = RUGS.laprswimrug.ovals, g = ctx(), D = LAP.deep;
    for (const [cx, cy, rx, ry] of r.slice(3)) { oval(cx, cy, rx, ry, D); ovalShade(cx, cy, rx - 1.5, ry - 1.5, BODY); }
    const [n, hd] = [r[1], r[2]];
    oval(n[0], n[1], n[2], n[3], D); ovalShade(n[0], n[1], n[2] - 1.3, n[3], BODY); oval(n[0], n[1] + 1, n[2] - 2.4, n[3] - 2, CREAM);
    oval(hd[0], hd[1], hd[2], hd[3], D); ovalShade(hd[0], hd[1], hd[2] - 1.3, hd[3] - 1.3, BODY);
    for (const s of [-1, 1]) {
      g.fillStyle = BODY; g.beginPath(); g.moveTo(hd[0] + s * 4.5, hd[1] + 2); g.lineTo(hd[0] + s * 7.2, hd[1] + 5.5); g.lineTo(hd[0] + s * 2.5, hd[1] + 4); g.closePath(); g.fill();
      oval(hd[0] + s * 4, hd[1] - 0.5, 1.2, 1.6, INK); R(hd[0] + s * 4 - 0.6, hd[1] - 1.6, 0.6, 0.6, '#ffffff');
    }
    g.strokeStyle = LAP.horn; g.lineWidth = 1.6; g.lineCap = 'round'; g.beginPath(); g.moveTo(hd[0], hd[1] + 1); g.quadraticCurveTo(hd[0] + 0.5, hd[1] + 5, hd[0] + 3, hd[1] + 6.5); g.stroke();
    const [cx, cy, rx, ry] = r[0];
    oval(cx, cy, rx, ry, D); ovalShade(cx, cy, rx - 1.5, ry - 1.5, BODY);
    oval(cx, cy + 2, rx - 4.5, ry - 4, sh(SHELL, -1)); ovalShade(cx, cy + 2, rx - 6, ry - 5.5, SHELL);
    for (const [kx, ky] of [[0, -9], [-8, -3], [8, -3], [0, 3], [-9, 7], [9, 7], [-4, 12], [4, 12]]) { oval(cx + kx, cy + ky + 2, 2.6, 2.6, sh(KNOB, -1)); ovalShade(cx + kx, cy + ky + 2, 1.9, 1.9, KNOB); }
  } },

  // the sea it ferries people across, waves curling round in rings
  { id: 'laprwaverug', name: 'Lapras wave rug', group: GROUP, solo: true, w: 2, h: 2, layer: 'rug', price: 350, high: 0.04, side: 'c', flat() {
    const [cx, cy, rx, ry] = RUGS.laprwaverug.ovals[0], g = ctx();
    oval(cx, cy, rx, ry, CREAM); oval(cx, cy, rx - 2, ry - 2, LAP.deep);
    for (const [k, c] of [[0, LAP.sea], [7, BODY], [14, LAP.soft]]) oval(cx, cy, rx - 3 - k, ry - 3 - k, c);
    g.strokeStyle = LAP.foam; g.lineWidth = 1.4; g.lineCap = 'round';
    for (const [k, n] of [[5, 9], [12, 7], [19, 5]]) for (let i = 0; i < n; i++) {
      const a = i / n * TAU + k * 0.3, x = cx + Math.cos(a) * (rx - k), y = cy + Math.sin(a) * (ry - k);
      g.beginPath(); g.arc(x, y, 2.2, a + Math.PI * 0.2, a + Math.PI * 1.4); g.stroke();
    }
    oval(cx, cy + 1, 7, 4, SHELL); for (const s of [-3, 0, 3]) oval(cx + s, cy, 1.1, 1.1, KNOB);
    oval(cx, cy + 3.5, 9, 2.4, BODY);
    g.strokeStyle = BODY; g.lineWidth = 2.6; g.beginPath(); g.moveTo(cx + 6, cy + 2); g.quadraticCurveTo(cx + 10, cy - 3, cx + 8, cy - 7); g.stroke();
    oval(cx + 8.5, cy - 8, 3.2, 2.5, BODY); R(cx + 9.4, cy - 8.8, 0.9, 0.9, INK);
  } },

  // a ship's wheel: its blue rim, cream spokes, its shell's knobs the handles, its shell the hub
  wallPiece('laprwheel', "Lapras ship's wheel", 1, 400, 'gloss', [
    ...[0, 1, 2, 3].map(i => { const a = i * Math.PI / 4, c = Math.cos(a) * 14.5, s = Math.sin(a) * 14.5; return LN(16 - c, 46 - s, 16 + c, 46 + s, 3.5, 2.6, CREAM, { m: 'gloss' }); }),
    ...[0, 1, 2, 3, 4, 5, 6, 7].map(i => { const a = i * Math.PI / 4; return B(16 + Math.cos(a) * 13.8, 46 + Math.sin(a) * 13.8, 3.5, 2.2, 2.2, 2.2, KNOB); }),
    TO(16, 46, 3.5, 10, 2.6, BODY),
    B(16, 46, 4, 5.2, 5.2, 2.8, SHELL),
    ...faceKnobs([[16, 46]], 6, 1.3, 1.8),
  ]),

  // Lapras out at sea: rolling waves, its shell riding them, its neck and head up out of the water
  wallPiece('laprwaves', 'Lapras wave mural', 2, 300, 'gloss', [
    ...neck([[46, 38, 3, 3.6], [51, 50, 3.5, 3.2], [49, 60, 4, 3]]),
    ...head(46, 65, 5, 7, 4.5),
    B(32, 41, 2.5, 12, 7.5, 3, SHELL),
    ...rimKnobs(32, 41, 2.5, 12, 7.5, [-0.9, -0.3, 0.3, 0.9], 1.7, 3.2),
    ...[[8, 36, 8, 7], [24, 37, 9, 6.5], [42, 36, 9, 7], [57, 37, 7, 6]].flatMap(([x, h, rx, ry]) => [
      B(x, h, 3.5, rx, ry, 3, LAP.sea), B(x + rx * 0.25, h + ry * 0.75, 5, rx * 0.55, 2, 1.6, LAP.foam),
    ]),
    BX(32, 31, 2.5, 62, 8, 4, LAP.deep, { r: 3 }),
  ]),

  // a round seat on four flippers
  piece('laprstool', 'Lapras flipper stool', 1, 1, 200, 'cloth', [
    ...[[7, -6, -1], [25, -6, 1], [7, 6, -1], [25, 6, 1]].map(([x, z, s]) => B(x, 7, z, 4.6, 8, 5, BODY, { tilt: s * 0.3, m: 'gloss' })),
    B(16, 15, 0, 14, 5, 13, BODY, { ev: 0.5, e: 0.6, m: 'gloss' }),
    ...faceKnobs([[9, 16], [16, 15.5], [23, 16]], 12.5, 1.2, 1.8),
    B(16, 20, 0, 11.5, 2.4, 11, CREAM, { ev: 0.5, e: 0.6 }),
  ]),

  // a ride across the sea: sit on its shell, it rocks you along
  piece('laprrocker', 'Lapras rocker', 2, 1, 550, 'gloss', [
    B(32, 2.5, -8, 30, 2.5, 2.2, CREAM, { ev: 0.5 }), B(32, 2.5, 8, 30, 2.5, 2.2, CREAM, { ev: 0.5 }),
    flipper(13, 6, -9, 5, -1), flipper(47, 8, -9, 5, 1),
    B(30, 14, 0, 24, 10, 13, BODY, { ev: 0.75 }),
    B(30, 10, 6, 19, 6, 8, CREAM, { ev: 0.8 }),
    B(28, 22, -1, 17, 7.5, 11, SHELL, { ev: 0.8 }),
    ...rimKnobs(28, 22, -1, 17, 7.5, [-1.15, -0.7, 0.7, 1.15], 2, 3.6),
    B(28, 28, 0, 9, 2.6, 8, CREAM, { ev: 0.6, e: 0.7, m: 'cloth' }),
    ...neck([[49, 16, 2, 4.6], [55, 28, 3, 4], [54, 40, 3, 3.6]]),
    ...head(51, 46, 5, 8, 6),
    flipper(13, 6, 9, 5, -1), flipper(47, 8, 9, 5, 1),
  ], { seat: 'cushion' }),

  // its neck the pole, curled horns for hooks, its head on top, its shell the foot
  piece('laprcoatstand', 'Lapras horn coat stand', 1, 1, 300, 'gloss', [
    B(16, 3, 0, 14, 3, 14, BODY, { ev: 0.5, e: 0.6 }),
    B(16, 6, 0, 11.5, 6, 11.5, SHELL, { ev: 0.75 }),
    ...rimKnobs(16, 2, 0, 11, 9, [-1, -0.35, 0.35, 1], 1.8, 3.4),
    CY(16, 36, 0, 3.2, 58, BODY), CY(16, 36, 1.8, 2, 56, CREAM),
    ...[[52, 1], [42, -1], [52, -1], [42, 1]].flatMap(([h, s]) => [CN(16 + s * 2, h, 0, 1.4, 6, LAP.horn, { tilt: s * 1.1 }), CN(16 + s * 7, h + 2.6, 0, 0.9, 3, LAP.horn, { tilt: s * 0.2 })]),
    ...head(16, 70, 1, 8, 6.5),
  ]),

  // a sea chest: its blue body the box, its shell the lid, a little Lapras face on the front
  piece('laprchest', 'Lapras sea chest', 1, 1, 450, 'gloss', [
    BX(16, 10, 0, 28, 16, 24, BODY, { r: 4 }),
    B(16, 18, 0, 14.5, 7, 12.5, SHELL, { ev: 0.6, e: 0.65 }),
    ...rimKnobs(16, 18, 0, 14.5, 7, [-0.9, -0.3, 0.3, 0.9], 1.8, 3.2),
    BX(16, 18, 0, 29, 1.6, 24.6, LAP.deep, { r: 0.8 }),
    ...head(16, 9.5, 11, 6.2, 3.5),
    flipper(4.5, 2, 9, 3.2, -1), flipper(27.5, 2, 9, 3.2, 1),
  ]),

  // its shell swapped for a glass bowl of water and fish, its head looking in
  piece('laprfishbowl', 'Lapras fishbowl', 1, 1, 600, 'gloss', [
    B(16, 6, -1, 14, 6, 12.5, BODY, { ev: 0.6, e: 0.7 }),
    flipper(4.5, 3, 6, 3.6, -1), flipper(27.5, 3, 6, 3.6, 1),
    B(16, 21, -1, 10.5, 8.5, 10, LAP.water, { m: 'gloss' }),
    B(13, 21, 6, 2.6, 1.7, 1.2, LAP.fish, { m: 'gloss' }), CN(10, 21, 6, 1.4, 2, LAP.fish, { tilt: -Math.PI / 2 }),
    B(19, 25, 4, 2, 1.3, 1, LAP.fish, { m: 'gloss' }), CN(21.5, 25, 4, 1.1, 1.6, LAP.fish, { tilt: Math.PI / 2 }),
    LA(16, 9, -1, [[5, 0], [10, 2.5], [12.5, 8], [12, 14], [9, 19], [9.5, 20.5], [0, 20.5]], '#d8eef4', { m: 'glass', k: 20 }),
    ...neck([[25, 8, 7, 3.2], [28, 18, 7.5, 2.8], [27, 28, 7, 2.6]]),
    ...head(25, 33, 8, 6.5, 5),
  ]),

  // Lapras sings: its neck the harp's pillar, curving over to its head, strings down to its shell
  piece('laprharp', 'Lapras harp', 1, 1, 800, 'gloss', [
    B(16, 3, 0, 14, 3, 11, BODY, { ev: 0.5, e: 0.6 }),
    B(16, 7, 0, 12, 6, 9, SHELL, { ev: 0.75 }),
    ...rimKnobs(16, 3, 0, 11, 9, [-0.6, 0.6, 1.1], 1.6, 3),
    TB([[24, 9, -1, 4], [25, 28, -1, 3.4], [25, 47, -1, 2.8]], SHELL),
    ...faceKnobs([[24.2, 17], [25, 29], [25, 40]], 2, 1.3, 2.2),
    ...[[10, 50.5], [14.5, 53], [19, 54.5]].map(([x, top]) => CY(x, (11 + top) / 2, 0, 0.6, top - 11, LAP.string, { m: 'metal' })),
    ...neck([[5, 8, 0, 3.2], [4, 30, 0, 2.9], [8, 50, 0, 2.7], [19, 56, 0, 2.5]]),
    ...head(25, 57, 1.5, 6.5, 5),
  ]),

  // its shell turned over for a tub, bubbles on top, its head resting on the end
  piece('laprtub', 'Lapras shell bath', 2, 1, 1100, 'gloss', [
    flipper(10, 3, 9, 5, -1), flipper(46, 3, 9, 5, 1),
    B(29, 11, 0, 26, 11, 14.5, SHELL, { ev: 0.75, e: 0.8 }),
    ...shellKnobs(29, 10, 26, 11, ellOn(29, 11, 0, 26, 11, 14.5), 1.8, 2.8, [[-0.7, -0.05], [-0.35, 0.25], [0, -0.1], [0.35, 0.25], [0.7, -0.05], [-0.2, -0.45], [0.2, -0.45]]),
    B(29, 20, 0, 22, 4, 12, CREAM, { ev: 0.55, e: 0.7 }),
    B(29, 23, 0, 19, 1.4, 10, LAP.water, { ev: 0.4, e: 0.6 }),
    ...[[22, 25.5, 2, 3], [27, 26.5, -2, 3.4], [33, 25.5, 3, 2.6], [30, 28, 1, 2.2], [17, 25, -4, 2], [37, 25.4, -3, 2.2]].map(([x, h, z, r]) => B(x, h, z, r, r * 0.85, r, LAP.foam)),
    ...neck([[54, 14, 0, 4.6], [58, 26, 0, 4], [57, 36, 1, 3.5]]),
    ...head(54, 42, 3, 8, 6.5),
  ]),

  // seaweed growing from its blue body, a band of its shell round the rim, its face on the front
  piece('laprplanter', 'Lapras kelp planter', 1, 1, 300, 'gloss', [
    ...[[10, -2, -0.15, 30], [16, 1, 0.1, 36], [22, -1, 0.2, 28], [13, 3, 0.25, 24], [19, -3, -0.2, 26]].flatMap(([x, z, t, top]) => [
      B(x, 22, z, 2.6, 6, 2.2, LAP.kelp, { m: 'plain', tilt: t }), B(x + t * 10, 22 + (top - 22) * 0.7, z, 2.2, (top - 22) * 0.45, 2, LAP.kelp2, { m: 'plain', tilt: -t }),
    ]),
    LA(16, 0, 0, [[10, 0], [12.5, 3], [14, 10], [13.5, 15], [0, 15]], BODY),
    CY(16, 17, 0, 14.2, 4, SHELL),
    ...[-1.1, -0.55, 0, 0.55, 1.1].map(a => CN(16 + Math.sin(a) * 14.5, 17, Math.cos(a) * 14.5, 1.4, 2.4, KNOB, { fwd: true, m: 'gloss' })),
    CY(16, 19.4, 0, 13, 0.8, LAP.soil, { m: 'plain' }),
    ...head(16, 8, 9.5, 6, 4),
  ]),

  // Ice Beam keeps the drinks cold: its shell's the door
  piece('laprfridge', 'Lapras ice box', 1, 1, 800, 'gloss', [
    ...neck([[16, 68, -3, 4.2], [16, 75, -1, 3.8]]),
    ...head(16, 80, 1, 9, 7),
    BX(16, 37, -2, 30, 66, 26, BODY, { r: 7 }),
    flipper(6, 2.5, 6, 3.6, -1), flipper(26, 2.5, 6, 3.6, 1),
  ], {
    doors: [{ hinge: [3, 11.5], side: 1, parts: [
      BX(16, 37, 11.75, 26, 56, 1.5, SHELL, { r: 7 }),
      ...faceKnobs([[26, 40], [26, 34], [9, 58], [9, 16]], 12.3, 1.4, 2.4),
      ...flake(15, 50, 12.6, 5, LAP.ice), ...flake(17, 26, 12.6, 3.5, LAP.ice),
    ] }],
    inside: { x: 16, h: 37, w: 24, hh: 54, z: 11 },
  }),
];
