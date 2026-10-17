/* base-furniture-snorlax.js  -  the Snorlax room (furniture expansion session a, 2026-10-17): 25 pieces each shaped after
   Snorlax, like Pokémon Center merch: its round teal body, cream belly and face, little pointed ears, closed sleepy eyes,
   two fangs, clawed feet, and what it lives for (berries, naps, the Poké Flute). One colour each, Snorlax's own.
   An upright piece is a list of parts in painted units (32 a tile): `x` across from the left of its front, `h` up from
   the floor (a wall piece's from the foot of its strip), `z` out to the front from its middle (a wall piece's from the
   wall). They're painted here from any side, and js/base-models-snorlax.js builds the same list as 3D parts (BUILT), so
   picture and model agree. The two rugs are painted from above (RUGS: their outline, for the model). */

import { R, oval, ovalShade, floorShadow, ctx, sh } from './base-paint.js';

export const LAX = {
  body: '#3a6878', deep: '#2c5262', soft: '#4a7c8c', cream: '#f0e0c0', claw: '#fbf7ec', pad: '#a8805a', ink: '#1e2a30',
  mint: '#88d0c0', wood: '#c89a60', leaf: '#5aa040', leaf2: '#4a8a38', oran: '#3a78d8', pecha: '#f48ab0', cheri: '#e0403a',
  sitrus: '#f0c838', water: '#78c8e8', dark: '#1c2632', glow: '#fff0c0', mirror: '#d8e8f2', soil: '#5a3a24', foam: '#ffffff',
};
const { body: BODY, cream: CREAM, claw: CLAW, pad: PAD, ink: INK } = LAX;
const GROUP = 'Snorlax room';
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
const TX = (s, x, h, z, size, w, c) => ({ t: 'text', s, x, h, z, size, w, c });
/** A lathe from h up, its profile [[r, up]...]. */
const LA = (x, h, z, pts, c, o) => ({ t: 'lathe', x, h, z, pts, c, ...o });
/** A rod lying across, x0 to x1. */
const RD = (x0, x1, h, z, r, c, o) => ({ t: 'rod', x: (x0 + x1) / 2, x0, x1, h, z, r, c, ...o });
/** A letter Z, s tall, d deep, an `edge` round it. */
const ZE = (x, h, z, s, d, c, edge) => ({ t: 'zee', x, h, z, s, d, c, edge });
/** A painting-only touch, front view only (a TV's picture, a dial's ticks). */
const FN = (z, fn) => ({ t: 'fn', x: 0, h: 0, z, fn, paintOnly: true });

/** Where a point lands on an ellipsoid's front, for drawing on a rounded face. */
const ellOn = (cx, ch, cz, rx, ry, rz) => (px, ph) => cz + rz * Math.sqrt(Math.max(0, 1 - ((px - cx) / rx) ** 2 - ((ph - ch) / ry) ** 2)) + 0.3;

/** Closed sleepy eyes, the wide mouth and its two fangs, on a face r across centred at x, h; `on` gives a point's z. */
function faceMarks(x, h, r, on) {
  const w = Math.max(0.8, r * 0.085), out = [], my = h - r * 0.36;
  for (const s of [-1, 1]) {
    const a = x + s * r * 0.14, c = x + s * r * 0.46, e = h + r * 0.06;
    out.push(LN(Math.min(a, c), e, Math.max(a, c), e, on((a + c) / 2, e), w, INK, { bend: -r * 0.05 }));
  }
  out.push(LN(x - r * 0.3, my, x + r * 0.3, my, on(x, my), w, INK, { bend: -r * 0.05 }));
  for (const s of [-1, 1]) out.push(CN(x + s * r * 0.17, my - r * 0.04, on(x + s * r * 0.17, my) - 0.2, r * 0.075, r * 0.16, CLAW, { m: 'gloss' }));
  return out;
}

/** Snorlax's head r across (ry its height), rz deep: little pointed ears, the cream face, asleep. */
function head(x, h, z, r, rz, { m, glow } = {}) {
  const fz = z + rz * 0.7, frx = r * 0.76, fry = r * 0.6, frz = rz * 0.42, fh = h - r * 0.16;
  const out = [];
  for (const s of [-1, 1]) out.push(CN(x + s * r * 0.56, h + r * 0.48, z, r * 0.24, r * 0.52, BODY, { tilt: s * 0.45, m }));
  out.push(B(x, h, z, r, r * 0.82, rz, BODY, { m }));
  out.push(B(x, fh, fz, frx, fry, frz, glow ? LAX.glow : CREAM, { m: glow ? 'glow' : m }));
  // the teal dips into the top of its face
  out.push(CN(x, fh + fry + 0.4, fz + frz * 0.5, r * 0.17, r * 0.26, BODY, { tilt: Math.PI, paintOnly: true }));
  return out.concat(faceMarks(x, fh + r * 0.05, r, ellOn(x, fh, fz, frx, fry, frz)));
}

/** A foot's sole facing out front: cream, a tan pad, three claws over its top. */
function foot(x, h, z, r, m) {
  return [B(x, h, z, r, r * 1.1, r * 0.35, CREAM, { m }), B(x, h - r * 0.18, z + r * 0.3, r * 0.55, r * 0.5, r * 0.1, PAD, { m: 'plain' }),
    ...[-1, 0, 1].map(i => CN(x + i * r * 0.5, h + r * 0.72, z + r * 0.12, r * 0.17, r * 0.45, CLAW, { tilt: i * 0.25, m: 'gloss' }))];
}

/** A berry and its leaf. */
const berry = (x, h, z, r, c) => [B(x, h, z, r, r, r, c, { m: 'gloss' }), B(x + r * 0.3, h + r * 0.95, z, r * 0.45, r * 0.18, r * 0.3, LAX.leaf, { m: 'gloss', tilt: 0.4 })];

/* ---------- painting the parts ---------- */

const ZEE = [[0, 0], [1, 0], [1, 0.22], [0.36, 0.78], [1, 0.78], [1, 1], [0, 1], [0, 0.78], [0.64, 0.22], [0, 0.22]];
/** A letter Z s tall about its middle (y down), grown by `d` all round (mitred, the sharp corners clipped). */
export function zee(s, d = 0) {
  const P = ZEE.map(([x, y]) => [(x - 0.5) * s * 0.8, (y - 0.5) * s]), n = P.length;
  if (!d) return P;
  const area = P.reduce((a, [x, y], i) => a + x * P[(i + 1) % n][1] - P[(i + 1) % n][0] * y, 0), o = Math.sign(area);
  const nrm = ([ax, ay], [bx, by]) => { const l = Math.hypot(bx - ax, by - ay); return [o * (by - ay) / l, -o * (bx - ax) / l]; };
  return P.map((p, i) => {
    const a = nrm(P[(i + n - 1) % n], p), b = nrm(p, P[(i + 1) % n]), k = Math.min(2.5, 1 / Math.max(0.16, (1 + a[0] * b[0] + a[1] * b[1]) / 2));
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, l = Math.hypot(mx, my) || 1;
    return [p[0] + mx / l * d * Math.sqrt(k), p[1] + my / l * d * Math.sqrt(k)];
  });
}

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

/** Paints parts seen from `dir` (0 front, 2 back, 1 / 3 the sides), on a view vw wide standing on line b; W is the
    piece's front width in units. */
function paintParts(parts, x0, b, vw, dir, W) {
  const side = dir % 2 === 1, sg = dir === 3 ? -1 : 1, g = ctx();
  const U = (px, pz) => dir === 0 ? x0 + px : dir === 2 ? x0 + W - px : x0 + vw / 2 + sg * pz;
  const key = (q) => q.k ?? (dir === 0 ? q.z : dir === 2 ? -q.z : sg * (W / 2 - q.x));
  const list = parts.map((q, i) => [key(q), i, q]).sort((a, c) => a[0] - c[0] || a[1] - c[1]).map(e => e[2]);
  for (const q of list) {
    const front = q.paintOnly || ['line', 'text', 'zee'].includes(q.t);
    if (front && dir !== 0) continue;
    const cx = U(q.x, q.z), cy = b - q.h, tilt = side ? 0 : dir === 2 ? -(q.tilt || 0) : q.tilt || 0, a = q.m === 'glass' ? 0.6 : 1;
    switch (q.t) {
      case 'blob': supr(cx, cy, side ? q.rz : q.rx, q.ry, q.ev ?? 1, q.c, tilt, a); break;
      case 'box': { const w = side ? q.d : q.w; rbx(cx - w / 2, cy - q.hh / 2, w, q.hh, q.r, q.c, a); break; }
      case 'cyl': {
        poly([[cx - q.r, cy - q.hh / 2], [cx + q.r, cy - q.hh / 2], [cx + (q.rb ?? q.r), cy + q.hh / 2], [cx - (q.rb ?? q.r), cy + q.hh / 2]], q.c, true);
        oval(cx, cy - q.hh / 2, q.r, Math.min(q.r * 0.25, q.hh / 2), sh(q.c, 1));
        break;
      }
      case 'disc': if (side) rbx(cx - q.th / 2, cy - (q.ry ?? q.r), q.th, (q.ry ?? q.r) * 2, q.th / 2, q.c); else ovalShade(cx, cy, q.r, q.ry ?? q.r, q.c); break;
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
        if (q.m === 'glass') { g.save(); g.globalAlpha = 0.7; g.fillStyle = '#ffffff'; const t = pts[pts.length - 1][1], f = pts[0][1]; g.fillRect(cx - pts[1][0] * 0.62, t + (f - t) * 0.2, Math.max(0.8, pts[1][0] * 0.14), (f - t) * 0.6); g.restore(); }
        break;
      }
      case 'rod': {
        if (side) { ovalShade(cx, cy, q.r, q.r, q.c); break; }
        const w = q.x1 - q.x0, l = g.createLinearGradient(0, cy - q.r, 0, cy + q.r);
        l.addColorStop(0, sh(q.c, 1)); l.addColorStop(0.35, sh(q.c, 2)); l.addColorStop(0.6, q.c); l.addColorStop(1, sh(q.c, -1));
        g.fillStyle = l; g.beginPath(); g.roundRect(cx - w / 2, cy - q.r, w, q.r * 2, q.r * 0.6); g.fill();
        break;
      }
      case 'line': {
        const p0 = [U(q.x0), b - q.h0], p1 = [U(q.x1), b - q.h1], mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2 - q.bend * 2;
        g.strokeStyle = q.c; g.lineWidth = q.w; g.lineCap = 'round';
        g.beginPath(); g.moveTo(...p0); g.quadraticCurveTo(mx, my, ...p1); g.stroke();
        break;
      }
      case 'text':
        g.font = `bold ${q.size}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillStyle = q.c; g.fillText(q.s, cx, cy, q.w);
        break;
      case 'zee': {
        poly(zee(q.s, q.s * 0.08).map(([px, py]) => [cx + px, cy + py]), q.edge);
        poly(zee(q.s).map(([px, py]) => [cx + px, cy + py]), q.c);
        break;
      }
      case 'fn': q.fn(g, (px) => x0 + px, (h) => b - h); break;
    }
  }
}

/* ---------- the kinds ---------- */

/** What js/base-models-snorlax.js builds for each upright and wall kind: its parts, doors and default material. */
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

/* the rugs, seen from above: their outline as ovals [cx, cy, rx, ry] and triangles, in painted units */
export const RUGS = {
  laxfootrug: { ovals: [[32, 38, 27, 24]], tris: [[[9, 22], [14, 2], [22, 17]], [[26, 15], [32, 0], [38, 15]], [[42, 17], [50, 2], [55, 22]]] },
  laxfacerug: { ovals: [[32, 36, 29, 26]], tris: [[[6, 26], [10, 2], [24, 13]], [[40, 13], [54, 2], [58, 26]]] },
};
const rugTri = (pts, c, edge) => {
  const g = ctx();
  g.fillStyle = edge; g.beginPath(); pts.forEach(p => g.lineTo(...p)); g.closePath(); g.fill();
  const cx = pts.reduce((s, p) => s + p[0], 0) / 3, cy = pts.reduce((s, p) => s + p[1], 0) / 3;
  poly(pts.map(([x, y]) => [cx + (x - cx) * 0.72, cy + (y - cy) * 0.72]), c);
};

const BOOKS = ['#d85848', '#e8c050', '#5888d0', '#68a858', '#a868c8', '#e88848', '#f0ece0'];
/** A row of books standing on a shelf at h, from x0 to x1. */
const books = (x0, x1, h, z, n) => {
  const out = [];
  for (let x = x0, i = n; x < x1 - 2; i++) {
    const w = 2.4 + (i * 7 % 5) * 0.4, hh = 11 + (i * 5 % 4) * 1.2;
    out.push(BX(x + w / 2, h + hh / 2, z, w, hh, 7, BOOKS[i % BOOKS.length], { r: 0.05, m: 'gloss' }));
    x += w + 0.3;
  }
  return out;
};

/** The TV's picture: Snorlax asleep on a hill under a night sky. */
const tvPicture = (g, X, Y) => {
  const x = X(10), y = Y(45), w = 44, h = 30;
  const s = g.createLinearGradient(0, y, 0, y + h); s.addColorStop(0, '#2a3a78'); s.addColorStop(1, '#5a78b8');
  g.fillStyle = s; g.beginPath(); g.roundRect(x, y, w, h, 3); g.fill();
  g.fillStyle = '#6ab050'; g.beginPath(); g.ellipse(x + w / 2, y + h + 4, w * 0.6, 12, 0, Math.PI, TAU); g.fill();
  g.fillStyle = BODY; g.beginPath(); g.ellipse(x + w / 2, y + h - 9, 9, 7, 0, 0, TAU); g.fill();
  g.fillStyle = CREAM; g.beginPath(); g.ellipse(x + w / 2, y + h - 8, 6, 4.5, 0, 0, TAU); g.fill();
  g.fillStyle = '#fff6c0'; g.beginPath(); g.arc(x + 8, y + 7, 3.2, 0, TAU); g.fill();
  g.fillStyle = '#ffffff'; for (const [sx, sy] of [[20, 5], [30, 9], [38, 4], [14, 13]]) g.fillRect(x + sx, y + sy, 0.9, 0.9);
  g.font = 'bold 6px system-ui, sans-serif'; g.textAlign = 'center'; g.fillStyle = '#ffffff'; g.fillText('z Z', x + w / 2 + 11, y + h - 17);
};
/** A dial's hour ticks. */
const dialTicks = (cx, ch, r) => (g, X, Y) => {
  g.fillStyle = INK;
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, d = r * 0.8; g.beginPath(); g.arc(X(cx) + Math.sin(a) * d, Y(ch) - Math.cos(a) * d, i % 3 ? 0.45 : 0.75, 0, TAU); g.fill(); }
};

export const SNORLAX_KINDS = [
  // its belly, a mattress: Snorlax lying back with its head for a headboard and its feet at the foot of the bed
  piece('laxbed', 'Snorlax belly bed', 2, 2, 1200, 'cloth', [
    ...head(32, 40, -17, 17, 12),
    B(32, 12, 0, 31, 12, 30, BODY, { ev: 0.7, e: 0.75 }),
    B(6.5, 16, 4, 5, 6, 13, BODY), B(57.5, 16, 4, 5, 6, 13, BODY),
    ...[4.5, 6.5, 8.5, 55.5, 57.5, 59.5].map(x => CN(x, 19, 16.5, 1.1, 2.4, CLAW, { fwd: true, m: 'gloss' })),
    B(32, 18, 3, 25, 9, 23, CREAM, { ev: 0.6, e: 0.7 }),
    ...foot(15, 10, 28.5, 8), ...foot(49, 10, 28.5, 8),
  ], { seat: 'bed' }),

  // a squashy beanbag Snorlax, sat on its belly
  piece('laxbeanbag', 'Snorlax beanbag', 1, 1, 350, 'cloth', [
    ...head(16, 29, -7, 9, 7),
    B(16, 12, -1, 15.5, 12, 14.5, BODY, { ev: 0.75, e: 0.8 }),
    B(3.5, 13, 2, 3, 4.5, 4.5, BODY), B(28.5, 13, 2, 3, 4.5, 4.5, BODY),
    B(16, 12, 5, 11, 9, 9.5, CREAM, { ev: 0.8 }),
    ...foot(9, 4.6, 12.5, 3.6), ...foot(23, 4.6, 12.5, 3.6),
  ]),

  // its head the back, its feet the front legs, a cream belly cushion
  piece('laxchair', 'Snorlax chair', 1, 1, 250, 'cloth', [
    CY(7, 5, -9, 2.5, 10, BODY), CY(25, 5, -9, 2.5, 10, BODY),
    B(16, 22, -10.5, 9, 9, 4.5, BODY, { ev: 0.7 }),
    ...head(16, 32, -9.5, 13, 5.5),
    B(16, 11.5, 0, 15, 3.5, 14, BODY, { ev: 0.5, e: 0.6 }),
    B(3.5, 19, -1, 3, 3.5, 10, BODY), B(28.5, 19, -1, 3, 3.5, 10, BODY),
    B(16, 15.5, 1.5, 13.5, 3, 12, CREAM, { ev: 0.5, e: 0.6 }),
    ...foot(8, 4.4, 11.5, 4), ...foot(24, 4.4, 11.5, 4),
  ]),

  // its body the back, its belly the cushion behind you, its arms the armrests, claws and all
  piece('laxsofa', 'Snorlax sofa', 2, 1, 900, 'cloth', [
    ...head(32, 45, -10, 12, 5.5),
    B(32, 26, -9.5, 30, 18, 6.5, BODY, { ev: 0.8 }),
    B(32, 24, -5.5, 20, 12, 4, CREAM, { ev: 0.8 }),
    B(32, 7.5, 1.5, 31, 7.5, 14, BODY, { ev: 0.55, e: 0.6 }),
    B(32, 14.5, 4, 24, 3.5, 10.5, CREAM, { ev: 0.55, e: 0.65 }),
    B(5.5, 16, 1, 5, 6.5, 13, BODY, { ev: 0.8 }), B(58.5, 16, 1, 5, 6.5, 13, BODY, { ev: 0.8 }),
    ...[3.5, 5.5, 7.5, 56.5, 58.5, 60.5].map(x => CN(x, 19, 12.5, 1, 2.6, CLAW, { fwd: true, m: 'gloss' })),
    ...foot(17, 5.5, 14, 4.5), ...foot(47, 5.5, 14, 4.5),
  ]),

  // its head for a tabletop, sleepy face on the apron, paws for legs, a bowl of berries in the middle
  piece('laxtable', 'Snorlax berry table', 2, 1, 700, 'gloss', [
    ...[[9, -8], [55, -8]].flatMap(([x, z]) => [CY(x, 7.5, z, 3.2, 15, BODY), B(x, 2.2, z + 1, 4.2, 2.2, 4.2, CREAM)]),
    CN(6, 25, -9, 3.2, 6.5, BODY, { tilt: -0.35 }), CN(58, 25, -9, 3.2, 6.5, BODY, { tilt: 0.35 }),
    BX(32, 20, 0, 62, 12, 30, BODY, { r: 4 }),
    BX(32, 20, 14.6, 42, 9, 1.2, CREAM, { r: 3 }),
    ...faceMarks(32, 20.4, 22, () => 15.5),
    ...[[9, 8], [55, 8]].flatMap(([x, z]) => [CY(x, 7.5, z, 3.2, 15, BODY), B(x, 2.2, z + 1, 4.2, 2.2, 4.2, CREAM)]),
    LA(32, 26, 0, [[6, 0], [9.5, 2.5], [11, 5.5], [10, 5.8], [0, 4]], CREAM),
    ...berry(28, 33, -2, 3.2, LAX.oran), ...berry(35.5, 33, 1, 3.2, LAX.pecha), ...berry(31.5, 37, -1, 3, LAX.sitrus),
    ...berry(13, 28.6, 4, 2.6, LAX.cheri), ...berry(51, 28.6, -2, 2.6, LAX.oran),
  ]),

  // a pedestal that's Snorlax's face over its belly drawer, a clawed paw for the other leg
  piece('laxdesk', 'Snorlax desk', 2, 1, 600, 'gloss', [
    CN(4, 29, -12, 2.8, 5.5, BODY, { tilt: -0.35 }), CN(60, 29, -12, 2.8, 5.5, BODY, { tilt: 0.35 }),
    BX(13, 12.5, 0, 22, 25, 26, BODY, { r: 4 }),
    BX(13, 18.5, 13.4, 18, 9, 1, CREAM, { r: 3 }), ...faceMarks(13, 19, 15, () => 14),
    BX(13, 7, 13.4, 18, 8.5, 1, CREAM, { r: 3 }), B(13, 7, 14.2, 2.4, 1.4, 0.9, PAD, { m: 'plain' }),
    CY(54, 12.5, 0, 4, 25, BODY), ...foot(54, 5.2, 4.6, 4.6),
    BX(32, 27, 0, 62, 4, 30, LAX.deep, { r: 1.5 }), BX(32, 29.2, 0, 56, 0.6, 24, CREAM, { r: 0.25 }),
  ]),

  // standing tall, its belly the doors, its head on top
  piece('laxwardrobe', 'Snorlax wardrobe', 2, 1, 900, 'gloss', [
    ...head(32, 76, -2, 15, 11),
    BX(32, 40, -2, 60, 74, 26, BODY, { r: 9 }),
    B(3, 40, 2, 3, 7, 5, BODY), B(61, 40, 2, 3, 7, 5, BODY),
    ...foot(16, 5.6, 12, 5), ...foot(48, 5.6, 12, 5),
  ], {
    doors: [
      { hinge: [14.25, 11.75], side: 1, parts: [BX(23, 35, 11.75, 17.5, 46, 1.5, CREAM, { r: 6 }), B(29.6, 35, 12.8, 1.4, 1.4, 1, PAD, { m: 'plain' })] },
      { hinge: [49.75, 11.75], side: -1, parts: [BX(41, 35, 11.75, 17.5, 46, 1.5, CREAM, { r: 6 }), B(34.4, 35, 12.8, 1.4, 1.4, 1, PAD, { m: 'plain' })] },
    ],
    inside: { x: 32, h: 35, w: 34, hh: 44, z: 11 },
  }),

  // a low chest of drawers, its face on the top drawer, its ears at the back
  piece('laxdresser', 'Snorlax dresser', 2, 1, 600, 'gloss', [
    CN(6, 26, -9, 3, 6, BODY, { tilt: -0.35 }), CN(58, 26, -9, 3, 6, BODY, { tilt: 0.35 }),
    BX(32, 16.5, 0, 60, 21, 28, BODY, { r: 6 }),
    BX(32, 22, 14.3, 40, 7, 1, CREAM, { r: 3 }), ...faceMarks(32, 22.6, 17, () => 14.9),
    ...[18, 46].flatMap(x => [BX(x, 12.25, 14.3, 25, 8.5, 1, CREAM, { r: 2.5 }), B(x, 12.25, 15.1, 1.8, 1.3, 0.9, PAD, { m: 'plain' })]),
    ...foot(9, 4, 13.5, 3.5), ...foot(55, 4, 13.5, 3.5),
  ]),

  // a bookshelf in its outline: its arms the sides, its belly-cream shelves, its head on top
  piece('laxshelf', 'Snorlax bookshelf', 2, 1, 700, 'gloss', [
    ...head(32, 76, -7, 15, 9),
    BX(32, 37, -7, 60, 70, 18, BODY, { r: 9 }),
    BX(32, 36, 2.2, 46, 50, 0.6, LAX.deep, { r: 2 }),
    ...[11, 30, 49].map(h => BX(32, h, 7.5, 48, 2, 11, CREAM, { r: 0.8 })),
    ...books(10, 30, 12, 6, 0), ...berry(38, 15, 6, 2.8, LAX.oran), ...berry(45, 15, 6, 2.8, LAX.pecha), ...berry(51, 15, 4, 2.6, LAX.sitrus),
    ...books(34, 54, 31, 6, 3), ...berry(16, 34, 6, 3, LAX.cheri), ...berry(23, 34, 5, 2.8, LAX.oran),
    ...books(10, 28, 50, 6, 5), ...books(40, 54, 50, 6, 2),
    B(6, 36, 6, 4.5, 26, 7, BODY, { ev: 0.85 }), B(58, 36, 6, 4.5, 26, 7, BODY, { ev: 0.85 }),
    ...foot(16, 4.5, 11, 4), ...foot(48, 4.5, 11, 4),
  ]),

  // a floor lamp, its sleepy face the lit shade
  piece('laxlamp', 'Snorlax lamp', 1, 1, 400, 'gloss', [
    LA(16, 0, 0, [[9, 0], [9, 1.5], [7, 3], [2, 4], [0, 4]], BODY),
    CY(16, 22, 0, 2, 36, CREAM),
    ...head(16, 52, 0, 12, 10, { glow: true }),
  ], { glow: [LAX.glow] }),

  // a wall clock: its belly the dial, its head on top asleep, Zz
  wallPiece('laxclock', 'Snorlax clock', 1, 300, 'gloss', [
    B(16, 46, 4, 12.5, 14, 4, BODY),
    DZ(16, 45, 8, 9.5, 1, CREAM), FN(9, dialTicks(16, 45, 9.5)),
    LN(16, 45, 16, 51.5, 9, 1.2, INK), LN(16, 45, 20.5, 45, 9, 1.4, INK), B(16, 45, 9.2, 1, 1, 0.5, LAX.cheri, { m: 'gloss' }),
    ...head(16, 67, 4.5, 11, 4),
    TX('Zz', 27, 80, 1, 7, 9, BODY),
  ]),

  // a TV it hugs: the screen on its belly
  piece('laxtv', 'Snorlax TV', 2, 1, 1000, 'gloss', [
    ...head(32, 60, -4, 13, 8),
    BX(32, 30, -4, 62, 50, 22, BODY, { r: 11 }),
    BX(32, 30, 7.2, 52, 38, 1, CREAM, { r: 8 }),
    BX(32, 30, 7.9, 44, 30, 0.8, LAX.dark, { r: 3 }), FN(9, tvPicture),
    ...foot(14, 5, 8, 4.5), ...foot(50, 5, 8, 4.5),
  ]),

  // a long mirror on its belly
  piece('laxmirror', 'Snorlax mirror', 1, 1, 450, 'gloss', [
    B(16, 31, -2, 14, 27, 8, BODY, { ev: 0.9 }),
    ...head(16, 63, -2, 11, 7),
    B(2.6, 34, 0, 2.6, 5, 4, BODY), B(29.4, 34, 0, 2.6, 5, 4, BODY),
    B(16, 30, 4.6, 9.5, 18, 1.4, LAX.mirror, { m: 'metal' }),
    LN(11.5, 36, 14.5, 41, 6.2, 1, '#ffffff', { m: 'gloss' }), LN(11.5, 31, 13, 33.5, 6.2, 0.8, '#ffffff', { m: 'gloss' }),
    ...foot(9.5, 4.4, 5, 4), ...foot(22.5, 4.4, 5, 4),
  ]),

  // its footprint, claws and pad
  { id: 'laxfootrug', name: 'Snorlax footprint rug', group: GROUP, solo: true, w: 2, h: 2, layer: 'rug', price: 350, high: 0.04, side: 'c', flat() {
    const r = RUGS.laxfootrug;
    for (const t of r.tris) rugTri(t, CLAW, LAX.deep);
    const [cx, cy, rx, ry] = r.ovals[0];
    oval(cx, cy, rx, ry, LAX.deep); oval(cx, cy, rx - 2.5, ry - 2.5, CREAM);
    ovalShade(cx, cy + 5, 14, 11, PAD); oval(cx, cy + 5, 9, 6.5, sh(PAD, 1));
    for (const [px, py] of [[18, 28], [46, 28], [32, 22]]) { oval(px, py, 3.2, 2.4, PAD); oval(px - 0.6, py - 0.5, 1.4, 1, sh(PAD, 1)); }
    for (let a = 0; a < 40; a++) { const t = a / 40 * TAU; R(cx + Math.cos(t) * (rx - 4.5), cy + Math.sin(t) * (ry - 4.5), 0.8, 0.8, sh(CREAM, -1)); }
  } },

  // its face, asleep, ears and all
  { id: 'laxfacerug', name: 'Snorlax face rug', group: GROUP, solo: true, w: 2, h: 2, layer: 'rug', price: 400, high: 0.04, side: 'c', flat() {
    const r = RUGS.laxfacerug, g = ctx();
    for (const t of r.tris) { const [a, b, c] = t; g.fillStyle = LAX.deep; g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.lineTo(...c); g.closePath(); g.fill(); poly([[a[0] + 2, a[1]], [b[0], b[1] + 3], [c[0] - (c[0] > a[0] ? 2 : -2), c[1] + 1]], BODY); }
    const [cx, cy, rx, ry] = r.ovals[0];
    oval(cx, cy, rx, ry, LAX.deep); ovalShade(cx, cy, rx - 2, ry - 2, BODY);
    ovalShade(cx, cy + 6, 21, 16, CREAM);
    g.fillStyle = BODY; g.beginPath(); g.moveTo(cx - 6, cy - 10.5); g.lineTo(cx, cy - 4); g.lineTo(cx + 6, cy - 10.5); g.closePath(); g.fill();
    g.strokeStyle = INK; g.lineWidth = 1.6; g.lineCap = 'round';
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 4, cy + 2); g.quadraticCurveTo(cx + s * 8.5, cy + 4, cx + s * 13, cy + 2); g.stroke(); }
    g.beginPath(); g.moveTo(cx - 9, cy + 13); g.quadraticCurveTo(cx, cy + 16, cx + 9, cy + 13); g.stroke();
    g.fillStyle = CLAW; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 6.5, cy + 13.6); g.lineTo(cx + s * 4.6, cy + 14); g.lineTo(cx + s * 5.4, cy + 10.4); g.closePath(); g.fill(); }
    for (let a = 0; a < 48; a++) { const t = a / 48 * TAU; R(cx + Math.cos(t) * (rx - 3.5), cy + Math.sin(t) * (ry - 3.5), 0.8, 0.8, sh(BODY, -1)); }
  } },

  // a fridge stuffed with snacks: the belly's the door
  piece('laxfridge', 'Snorlax snack fridge', 1, 1, 800, 'gloss', [
    ...head(16, 77, -2, 13, 9),
    BX(16, 38, -2, 30, 72, 26, BODY, { r: 7 }),
    ...foot(8.5, 4, 12.3, 3.6), ...foot(23.5, 4, 12.3, 3.6),
  ], {
    doors: [{ hinge: [3, 11.5], side: 1, parts: [BX(16, 37, 11.75, 26, 54, 1.5, CREAM, { r: 7 }), ...[40, 37, 34].map(h => CN(26.5, h, 12.2, 0.9, 2.2, CLAW, { fwd: true }))] }],
    inside: { x: 16, h: 37, w: 24, hh: 52, z: 11 },
  }),

  // a heap of cushions, one of them its head
  piece('laxpillows', 'Snorlax pillow pile', 2, 1, 450, 'cloth', [
    ...head(44, 28, -9, 12, 5.5),
    B(12, 22, -6, 7, 5, 7, CREAM),
    B(16, 9, -1, 15, 9, 14.5, BODY, { ev: 0.75 }),
    B(43, 8, 3, 16, 8, 12, CREAM, { ev: 0.75 }),
    B(29, 19, 1, 13, 5.5, 11, LAX.soft, { ev: 0.8 }),
  ], { seat: 'cushion' }),

  // one big foot, sole out front, a cushion on top
  piece('laxfootstool', 'Snorlax footstool', 1, 1, 200, 'cloth', [
    B(16, 10, -3, 15, 10, 12.5, BODY, { ev: 0.6, e: 0.7 }),
    B(16, 21, -3, 12, 2.6, 10, CREAM, { ev: 0.5, e: 0.6 }),
    ...foot(16, 10, 10.2, 9),
  ]),

  // Belly Drum: a drum with its face on the front and its belly for the drumhead
  piece('laxbellydrum', 'Snorlax Belly Drum', 1, 1, 450, 'gloss', [
    CN(6, 21, 0, 2.6, 5.5, BODY, { tilt: -0.35 }), CN(26, 21, 0, 2.6, 5.5, BODY, { tilt: 0.35 }),
    LA(16, 0, 0, [[12, 0], [14, 6], [14.5, 12], [14, 18], [12.5, 22], [0, 22]], BODY),
    CY(16, 22.5, 0, 13, 1.6, LAX.wood, { m: 'wood' }), CY(16, 23.6, 0, 12, 1, CREAM, { m: 'cloth' }),
    B(2.4, 12, 0, 2.2, 4, 4, BODY), B(29.6, 12, 0, 2.2, 4, 4, BODY),
    B(16, 11.5, 10.5, 8, 6.5, 4.5, CREAM), ...faceMarks(16, 12, 15, ellOn(16, 11.5, 10.5, 8, 6.5, 4.5)),
  ]),

  // the Poké Flute that wakes it, on a plaque with its ears
  wallPiece('laxflute', 'Poké Flute plaque', 2, 500, 'gloss', [
    CN(12, 65, 1, 3, 6, BODY, { tilt: -0.35 }), CN(52, 65, 1, 3, 6, BODY, { tilt: 0.35 }),
    BX(32, 54, 1, 56, 28, 2, BODY, { r: 6 }),
    BX(32, 54, 2.3, 50, 22, 0.6, CREAM, { r: 4 }),
    B(20, 53.4, 3.4, 1.5, 1.5, 1.4, LAX.wood, { m: 'wood' }), B(44, 53.4, 3.4, 1.5, 1.5, 1.4, LAX.wood, { m: 'wood' }),
    B(10.5, 57, 5.6, 2.2, 2.2, 2.2, sh(LAX.mint, -1)), RD(11, 50, 57, 5.6, 2.6, LAX.mint), B(51.5, 57, 5.6, 3.4, 3.4, 3.4, LAX.mint),
    ...[19, 25, 31, 37, 43].map(x => DZ(x, 57.8, 8, 0.85, 0.5, INK, { m: 'plain', k: 9 })),
    TX('POKÉ FLUTE', 32, 47, 2.9, 5, 32, BODY),
  ]),

  // Zzz, rising off it as it dozes
  wallPiece('laxzzz', 'Snorlax Zzz sign', 2, 200, 'gloss', [
    ...head(14, 44, 3, 10, 3),
    ZE(32, 58, 1.6, 14, 2, BODY, CREAM), ZE(46, 69, 1.6, 10, 2, BODY, CREAM), ZE(56, 78, 1.6, 7, 2, BODY, CREAM),
  ]),

  // a chest for snacks: its belly the lid
  piece('laxchest', 'Snorlax snack chest', 1, 1, 450, 'gloss', [
    CN(6, 24, -6, 2.5, 5, BODY, { tilt: -0.4 }), CN(26, 24, -6, 2.5, 5, BODY, { tilt: 0.4 }),
    BX(16, 11.5, 0, 28, 19, 24, BODY, { r: 5 }),
    B(16, 21, 0, 13.5, 6, 11.5, CREAM, { ev: 0.55, e: 0.6 }),
    BX(16, 18, 0, 28.6, 2, 24.6, LAX.deep, { r: 1 }),
    BX(16, 10.5, 12.2, 18, 9, 0.8, CREAM, { r: 4 }), ...faceMarks(16, 11, 13, () => 12.9),
    B(2.4, 11, 0, 2.2, 4, 4, BODY), B(29.6, 11, 0, 2.2, 4, 4, BODY),
    ...foot(9, 3.4, 11.5, 3), ...foot(23, 3.4, 11.5, 3),
  ]),

  // a glass jar of berries, its head the lid
  piece('laxsnackjar', 'Snorlax berry jar', 1, 1, 300, 'gloss', [
    CY(16, 1.5, 0, 12, 3, BODY),
    ...berry(11, 7, -2, 3.2, LAX.oran), ...berry(18, 7, -3, 3.2, LAX.pecha), ...berry(22, 8, 2, 3, LAX.sitrus),
    ...berry(14, 13, 3, 3, LAX.cheri), ...berry(20, 14, -1, 3.1, LAX.oran), ...berry(10, 15, -2, 3, LAX.sitrus), ...berry(16, 19, 1, 3, LAX.pecha),
    LA(16, 3, 0, [[11, 0], [12, 2], [12, 20], [10.5, 23], [0, 23]], '#d8eef4', { m: 'glass', k: 20 }),
    ...head(16, 33, 0, 11, 10),
  ]),

  // its head for a pot, an Oran Berry bush growing out
  piece('laxplanter', 'Snorlax berry planter', 1, 1, 300, 'gloss', [
    B(16, 29, 0, 10.5, 8.5, 9.5, LAX.leaf, { m: 'plain' }), B(10, 33, -2, 6, 5, 6, LAX.leaf2, { m: 'plain' }),
    B(22, 34, 1, 6.5, 5.5, 6, LAX.leaf2, { m: 'plain' }), B(16, 39, -1, 6, 4.5, 6, LAX.leaf, { m: 'plain' }),
    CN(5.5, 19, 0, 2.6, 5.5, BODY, { tilt: -0.4 }), CN(26.5, 19, 0, 2.6, 5.5, BODY, { tilt: 0.4 }),
    LA(16, 0, 0, [[10, 0], [12.5, 3], [14, 10], [13.5, 17], [14.5, 19], [14.5, 21], [0, 21]], BODY),
    CY(16, 21, 0, 13, 0.8, LAX.soil, { m: 'plain' }),
    B(16, 10, 10.4, 8.5, 6.5, 4.4, CREAM), ...faceMarks(16, 10.6, 14, ellOn(16, 10, 10.4, 8.5, 6.5, 4.4)),
    ...berry(10, 30, 8, 2.6, LAX.oran), ...berry(21, 28, 8.5, 2.6, LAX.oran), ...berry(16, 36, 6.5, 2.4, LAX.oran), ...berry(24, 36, 4, 2.4, LAX.oran),
  ]),

  // lying on its back, its belly a bubble bath
  piece('laxbath', 'Snorlax belly bath', 2, 1, 1100, 'gloss', [
    B(28, 11, 0, 26, 11, 15, BODY, { ev: 0.75, e: 0.8 }),
    B(28, 19, 0, 21, 5, 12, CREAM, { ev: 0.55, e: 0.7 }),
    B(28, 23.5, 0, 18, 1.4, 10, LAX.water, { ev: 0.4, e: 0.6 }),
    ...[[22, 26, 2, 3], [27, 27, -2, 3.6], [33, 26, 3, 2.6], [30, 28.5, 1, 2.2], [20, 25.5, -4, 2], [36, 25.8, -3, 2.2]].map(([x, h, z, r]) => B(x, h, z, r, r * 0.85, r, LAX.foam)),
    ...foot(6.5, 21, 5, 4.2), ...foot(14, 24, -5, 4.2),
    ...head(54, 22, 0, 9.5, 8.5),
  ]),
];
