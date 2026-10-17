/* base-furniture-contest.js  -  the Contest Hall set (furniture expansion session b, 2026-10-17): Pokémon Contests as in
   Hoenn and Sinnoh, its stage and curtains, the judges, the Berry Blender and Poffin pot, the dressing room and the five
   conditions (Cool red, Beauty blue, Cute pink, Smart green, Tough yellow). Red velvet, gold trim, stage black; solo.
   As the Snorlax room: an upright piece is a list of parts in painted units (32 a tile): `x` across from the left of its
   front, `h` up from the floor (a wall piece's from the foot of its strip), `z` out to the front from its middle (a wall
   piece's from the wall). They're painted here from any side, and js/base-models-contest.js builds the same list in 3D
   (BUILT), so picture and model agree. The star rug is painted from above (STAR_RUG: its outline, for the model). */

import { R, oval, ovalShade, floorShadow, ctx, sh } from './base-paint.js';

export const CON = {
  velvet: '#b8202e', velvetDk: '#86182a', gold: '#e8b838', black: '#2a2630', board: '#b07a48', boardDk: '#8a5a34',
  cream: '#f8f0dc', white: '#fbfaf6', silver: '#c8ccd8', mirror: '#dce8f2', glass: '#d8eef6', lamp: '#fff2c0',
  stage: '#3a2850', wrap: '#f8e0ec', leaf: '#58a848', slate: '#3a3e58', case: '#6a50c0', batter: '#f8a0c8', flame: '#ffa040',
  heart: '#ff70aa', heartTop: '#ffd860',
  cool: '#e04848', beauty: '#4a80e0', cute: '#f488b8', smart: '#4cb860', tough: '#f0c830',
};
const C = CON;
const FIVE = [C.cool, C.beauty, C.cute, C.smart, C.tough];
const GROUP = 'Contest Hall';
const TAU = Math.PI * 2;

/* ---------- parts ---------- */
const B = (x, h, z, rx, ry, rz, c, o) => ({ t: 'blob', x, h, z, rx, ry, rz, c, ...o });
/** A rounded box; `tilt` leans it right in the front view, `tx` tips its top out to the front. */
const BX = (x, h, z, w, hh, d, c, o) => ({ t: 'box', x, h, z, w, hh, d, c, r: 1, ...o });
const CY = (x, h, z, r, hh, c, o) => ({ t: 'cyl', x, h, z, r, hh, c, ...o });
/** A disc facing the front, th thick (`ax: 'x'` faces it to the side: a wheel). */
const DZ = (x, h, z, r, th, c, o) => ({ t: 'disc', x, h, z, r, th, c, ...o });
/** A cone standing on its base at x, h, z (`tilt` Math.PI hangs it). */
const CN = (x, h, z, r, hh, c, o) => ({ t: 'cone', x, h, z, r, hh, c, tilt: 0, ...o });
/** A lathe from h up, its profile [[r, up]...]. */
const LA = (x, h, z, pts, c, o) => ({ t: 'lathe', x, h, z, pts, c, ...o });
/** A rod lying across, x0 to x1. */
const RD = (x0, x1, h, z, r, c, o) => ({ t: 'rod', x: (x0 + x1) / 2, x0, x1, h, z, r, c, ...o });
/** A round stick from a to b, [x, h, z] each. */
const ST = (a, b, r, c, o) => ({ t: 'stick', a, b, x: (a[0] + b[0]) / 2, h: (a[1] + b[1]) / 2, z: (a[2] + b[2]) / 2, r, c, ...o });
/** A flat cut-out [[x, h]...] facing the front, d thick at z. */
const SH = (pts, z, d, c, o) => ({ t: 'shape', pts, x: pts.reduce((s, p) => s + p[0], 0) / pts.length, h: 0, z, d, c, ...o });
/** A ring facing the front, R round, its tube r. */
const RG = (x, h, z, Rr, r, c, o) => ({ t: 'ring', x, h, z, R: Rr, r, c, ...o });
const TX = (s, x, h, z, size, w, c) => ({ t: 'text', s, x, h, z, size, w, c });
/** A picture w x hh painted by fn(g, w, hh) on the front at z (`cut` for one with gaps). */
const PC = (x, h, z, w, hh, fn, o) => ({ t: 'pic', x, h, z, w, hh, fn, ...o });

/** A star's points, n of them r round, its first straight up. */
export function starPts(cx, ch, r, n = 5, inner = 0.45, spin = 0) {
  const out = [];
  for (let i = 0; i < n * 2; i++) { const a = spin + i * Math.PI / n, rr = i % 2 ? r * inner : r; out.push([cx + rr * Math.sin(a), ch + rr * Math.cos(a)]); }
  return out;
}
/** A heart s across. */
function heartPts(cx, ch, s) {
  const out = [], k = s / 34;
  for (let i = 0; i < 24; i++) {
    const t = i / 24 * TAU;
    out.push([cx + 16 * Math.sin(t) ** 3 * k, ch + (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t) + 2.5) * k]);
  }
  return out;
}
const star = (x, h, z, r, d, c, o) => SH(starPts(x, h, r), z, d, c, { m: 'metal', ...o });
/** A contest ribbon's rosette, pleated, two tails under it. */
const rosette = (x, h, z, r, c) => [
  BX(x - r * 0.4, h - r * 1.25, z - 0.6, r * 0.5, r * 1.8, 0.5, c, { r: 0.2, tilt: 0.25, m: 'plain' }),
  BX(x + r * 0.4, h - r * 1.25, z - 0.6, r * 0.5, r * 1.8, 0.5, c, { r: 0.2, tilt: -0.25, m: 'plain' }),
  SH(starPts(x, h, r, 12, 0.8), z, 1, c, { m: 'plain' }),
  DZ(x, h, z + 0.7, r * 0.45, 0.6, C.gold, { m: 'metal' }),
];

/* ---------- painting the parts ---------- */

const shine = (g, x0, y0, x1, y1, c) => {
  const l = g.createLinearGradient(x0, y0, x1, y1);
  l.addColorStop(0, sh(c, 1)); l.addColorStop(0.35, c); l.addColorStop(1, sh(c, -1));
  return l;
};
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
/** A rounded box face w x h about its middle, turned `rot`. */
function rbx(cx, cy, w, h, r, c, rot = 0, alpha = 1) {
  if (w <= 0 || h <= 0) return;
  const g = ctx(), x = -w / 2, y = -h / 2, rr = Math.min(r, w / 2, h / 2);
  g.save(); g.globalAlpha *= alpha; g.translate(cx, cy); if (rot) g.rotate(rot);
  g.fillStyle = shine(g, x, y, x + w * 0.3, y + h, c); g.beginPath(); g.roundRect(x, y, w, h, rr); g.fill();
  if (h > 3 && w > 3) { g.fillStyle = sh(c, 1); g.globalAlpha *= 0.6; g.beginPath(); g.roundRect(x + rr * 0.6, y + 0.4, w - rr * 1.2, 0.7, 0.35); g.fill(); }
  g.restore();
}
function poly(pts, c, horiz, alpha = 1) {
  const g = ctx(), xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  g.save(); g.globalAlpha *= alpha;
  g.fillStyle = horiz ? (() => { const l = g.createLinearGradient(x0, 0, x1, 0); l.addColorStop(0, sh(c, -1)); l.addColorStop(0.3, sh(c, 1)); l.addColorStop(0.55, c); l.addColorStop(1, sh(c, -1)); return l; })() : shine(g, x0, y0, x1, y1, c);
  g.beginPath(); pts.forEach(([x, y]) => g.lineTo(x, y)); g.closePath(); g.fill();
  g.restore();
}
const glassStreak = (x, y, w, h) => { const g = ctx(); g.save(); g.globalAlpha = 0.55; g.fillStyle = '#ffffff'; g.fillRect(x + w * 0.16, y + h * 0.12, Math.max(0.7, w * 0.06), h * 0.6); g.restore(); };

/** Paints parts seen from `dir` (0 front, 2 back, 1 / 3 the sides), on a view vw wide standing on line b; W is the
    piece's front width in units. */
function paintParts(parts, x0, b, vw, dir, W) {
  const side = dir % 2 === 1, sg = dir === 3 ? -1 : 1, g = ctx();
  const U = (px, pz) => dir === 0 ? x0 + px : dir === 2 ? x0 + W - px : x0 + vw / 2 + sg * pz;
  const key = (q) => q.k ?? (dir === 0 ? q.z : dir === 2 ? -q.z : sg * (W / 2 - q.x));
  const list = parts.map((q, i) => [key(q), i, q]).sort((a, c) => a[0] - c[0] || a[1] - c[1]).map(e => e[2]);
  for (const q of list) {
    if (['text', 'pic'].includes(q.t) && dir !== 0) continue;
    const cx = U(q.x, q.z), cy = b - q.h, tilt = side ? 0 : dir === 2 ? -(q.tilt || 0) : q.tilt || 0, glass = q.m === 'glass', a = glass ? 0.32 : 1;
    switch (q.t) {
      case 'blob': supr(cx, cy, side ? q.rz : q.rx, q.ry, q.ev ?? 1, q.c, tilt, a); if (glass) glassStreak(cx - q.rx, cy - q.ry, q.rx * 2, q.ry * 2); break;
      case 'box': {
        const tx = q.tx || 0;
        if (side) rbx(cx, cy, q.d, q.hh, q.r, q.c, sg * tx, a);
        else rbx(cx, cy, q.w, q.hh * Math.abs(Math.cos(tx)) + q.d * Math.abs(Math.sin(tx)), q.r, q.c, tilt, a);
        if (glass && !side) glassStreak(cx - q.w / 2, cy - q.hh / 2, q.w, q.hh);
        break;
      }
      case 'cyl': {
        const rb = q.rb ?? q.r;
        poly([[cx - q.r, cy - q.hh / 2], [cx + q.r, cy - q.hh / 2], [cx + rb, cy + q.hh / 2], [cx - rb, cy + q.hh / 2]], q.c, true, a);
        oval(cx, cy - q.hh / 2, q.r, Math.min(q.r * 0.25, q.hh / 2), sh(q.c, 1));
        break;
      }
      case 'disc': {
        const flat = q.ax === 'x' ? !side : side;
        if (flat) rbx(cx, cy, q.th, q.r * 2, q.th / 2, q.c); else ovalShade(cx, cy, q.r, q.r, q.c);
        break;
      }
      case 'cone': {
        if (q.fwd) { ovalShade(cx, cy, q.r, q.r, q.c); break; }
        const s = Math.sin(tilt), c = Math.cos(tilt);
        poly([[cx + s * q.hh, cy - c * q.hh], [cx + c * q.r, cy + s * q.r], [cx - c * q.r, cy - s * q.r]], q.c);
        break;
      }
      case 'lathe': {
        const pts = q.pts.map(([r, up]) => [r, cy - up]);
        poly([...pts.map(([r, y]) => [cx - r, y]), ...pts.slice().reverse().map(([r, y]) => [cx + r, y])], q.c, true, a);
        if (glass) { const t = pts[pts.length - 1][1], f = pts[0][1]; glassStreak(cx - pts[1][0], t, pts[1][0] * 2, f - t); }
        break;
      }
      case 'rod': {
        if (side) { ovalShade(cx, cy, q.r, q.r, q.c); break; }
        const w = q.x1 - q.x0, l = g.createLinearGradient(0, cy - q.r, 0, cy + q.r);
        l.addColorStop(0, sh(q.c, 1)); l.addColorStop(0.35, sh(q.c, 2)); l.addColorStop(0.6, q.c); l.addColorStop(1, sh(q.c, -1));
        g.fillStyle = l; g.beginPath(); g.roundRect(cx - w / 2, cy - q.r, w, q.r * 2, q.r * 0.6); g.fill();
        break;
      }
      case 'stick': {
        const p0 = [U(q.a[0], q.a[2]), b - q.a[1]], p1 = [U(q.b[0], q.b[2]), b - q.b[1]];
        g.save(); g.lineCap = 'round';
        g.strokeStyle = sh(q.c, -1); g.lineWidth = q.r * 2; g.beginPath(); g.moveTo(...p0); g.lineTo(...p1); g.stroke();
        g.strokeStyle = sh(q.c, 1); g.lineWidth = q.r * 0.7; g.beginPath(); g.moveTo(p0[0] - q.r * 0.3, p0[1]); g.lineTo(p1[0] - q.r * 0.3, p1[1]); g.stroke();
        g.restore();
        break;
      }
      case 'shape': {
        if (side) {
          const hs = q.pts.map(p => p[1]), lo = Math.min(...hs), hi = Math.max(...hs);
          rbx(cx, b - (lo + hi) / 2, q.d, hi - lo, q.d / 2, q.c);
        } else poly(q.pts.map(([px, ph]) => [U(px, q.z), b - ph]), q.c, false, a);
        break;
      }
      case 'ring': {
        if (side) { rbx(cx, cy, q.r * 2, (q.R + q.r) * 2, q.r, q.c); break; }
        g.save(); g.strokeStyle = sh(q.c, -1); g.lineWidth = q.r * 2; g.beginPath(); g.arc(cx, cy, q.R, 0, TAU); g.stroke();
        g.strokeStyle = sh(q.c, 1); g.lineWidth = q.r * 0.7; g.beginPath(); g.arc(cx, cy, q.R, Math.PI * 0.9, Math.PI * 1.6); g.stroke(); g.restore();
        break;
      }
      case 'text':
        g.font = `bold ${q.size}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillStyle = q.c; g.fillText(q.s, cx, cy, q.w);
        break;
      case 'pic':
        g.save(); g.translate(cx - q.w / 2, cy - q.hh / 2); q.fn(g, q.w, q.hh); g.restore();
        break;
    }
  }
}

/* ---------- the pictures ---------- */

const font = (g, size) => { g.font = `bold ${size}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; };
/** The judges' three name cards' names, on cards 15 wide 20 apart. */
const nameCards = (g, w, h) => {
  font(g, 3.4); g.fillStyle = C.black;
  ['CONTESTA', 'SUKIZO', 'JOY'].forEach((s, i) => g.fillText(s, 8 + i * 20, h / 2 + 0.2, 13));
  g.fillStyle = C.velvet; for (let i = 0; i < 3; i++) g.fillRect(2 + i * 20, h - 1, 12, 0.6);
};
/** A Contest poster: spotlights on a gold star, CONTEST, the five conditions' colours. */
const poster = (g, w, h) => {
  const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, C.stage); bg.addColorStop(1, C.velvet);
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.save(); g.globalAlpha = 0.22; g.fillStyle = '#ffffff';
  for (const [x0, x1] of [[2, 10], [w - 2, w - 10]]) { g.beginPath(); g.moveTo(x0, 0); g.lineTo(w / 2 + (x1 - x0) * 0.8, h * 0.62); g.lineTo(w / 2 - (x1 - x0) * 0.2, h * 0.62); g.closePath(); g.fill(); }
  g.restore();
  g.fillStyle = C.gold; g.beginPath(); starPts(w / 2, -h * 0.4, 7.5).forEach(([x, y]) => g.lineTo(x, -y)); g.closePath(); g.fill();
  g.fillStyle = C.white; g.beginPath(); starPts(w / 2, -h * 0.4, 3.2).forEach(([x, y]) => g.lineTo(x, -y)); g.closePath(); g.fill();
  for (const [x, y, r] of [[4, 4, 1], [w - 5, 6, 1.2], [5, h * 0.55, 0.8], [w - 4, h * 0.5, 0.9]]) { g.beginPath(); starPts(x, -y, r * 1.6, 4, 0.3).forEach(([px, py]) => g.lineTo(px, -py)); g.closePath(); g.fill(); }
  font(g, 2.6); g.fillStyle = C.white; g.fillText('POKéMON', w / 2, h * 0.68, w - 3);
  font(g, 4.6); g.fillStyle = C.gold; g.fillText('CONTEST', w / 2, h * 0.79, w - 2);
  FIVE.forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(w / 2 + (i - 2) * 3.6, h * 0.91, 1.3, 0, TAU); g.fill(); });
};

/* ---------- the kinds ---------- */

/** What js/base-models-contest.js builds for each upright and wall kind: its parts and default material. */
export const BUILT = {};

function piece(id, name, w, h, price, mat, parts, rest = {}) {
  BUILT[id] = { parts, mat };
  return { id, name, group: GROUP, solo: true, w, h, price, ...rest, draw(x, b, vw, dir) { floorShadow(x, b, vw); paintParts(parts, x, b, vw, dir, w * 32); } };
}
function wallPiece(id, name, w, price, mat, parts, rest = {}) {
  BUILT[id] = { parts, mat };
  return { id, name, group: GROUP, solo: true, w, h: 1, layer: 'wall', price, ...rest, wall(x) { paintParts(parts, x, 96, w * 32, 0, w * 32); } };
}

/** The star rug's outline seen from above, in painted units (y down the rug). */
export const STAR_RUG = starPts(32, -33, 31, 5, 0.48).map(([x, y]) => [x, -y]);

/** A bouquet in its paper on a tray at h: four flowers and two leaves. */
const bouquet = (x, h, z, cols, paper) => [
  CN(x, h + 7, z, 3.6, 7, paper, { tilt: Math.PI, m: 'plain' }),
  B(x - 3.4, h + 7.8, z - 0.5, 1.6, 1, 1.2, C.leaf, { m: 'plain', tilt: -0.6 }), B(x + 3.4, h + 7.8, z - 0.5, 1.6, 1, 1.2, C.leaf, { m: 'plain', tilt: 0.6 }),
  B(x - 1.9, h + 8.4, z, 2.1, 2.1, 2.1, cols[0], { m: 'plain' }), B(x + 1.9, h + 8.4, z, 2.1, 2.1, 2.1, cols[1], { m: 'plain' }),
  B(x, h + 10.2, z - 0.6, 2.1, 2.1, 2.1, cols[2], { m: 'plain' }), B(x, h + 7.9, z + 1.8, 2, 2, 2, cols[3], { m: 'plain' }),
];

/** A dress on its hanger, hung from the rail at 72. */
const dress = (x, z, c) => [
  ST([x, 72.5, z], [x, 68.5, z], 0.5, C.gold, { m: 'metal' }), BX(x, 67.6, z, 9, 1, 1, C.gold, { r: 0.4, m: 'metal' }),
  B(x, 64, z, 4.6, 2.8, 3.4, c), CY(x, 50, z, 3.8, 30, c, { rb: 6 }),
  CY(x, 56, z, 4.9, 1.2, C.gold, { rb: 5, m: 'metal' }),
];

export const CONTEST_KINDS = [
  // the stage: raised boards on a star-studded front, footlights, a velvet-curtained arch with a gold star crest
  piece('constage', 'Contest stage', 3, 2, 2400, 'gloss', [
    BX(48, 64, -29, 80, 88, 3, C.stage),
    ...[[22, 90], [40, 98], [58, 86], [76, 96], [30, 72], [66, 70]].map(([x, h]) => star(x, h, -27.2, 2.2, 0.6, C.gold)),
    ...[5, 91].flatMap(x => [BX(x, 64, -26, 10, 88, 10, C.black, { r: 1.5 }), BX(x, 64, -20.8, 4, 84, 0.6, C.gold, { m: 'metal', r: 0.3 })]),
    ...[13, 19, 25, 71, 77, 83].map(x => B(x, 64, -24, 4, 42, 3, C.velvet, { ev: 0.7, e: 0.8, m: 'cloth' })),
    ...[20, 76].flatMap(x => [BX(x, 52, -20.6, 14, 1.6, 1, C.gold, { m: 'metal', r: 0.5, tilt: x < 48 ? 0.15 : -0.15 }),
      B(x < 48 ? 27 : 69, 50, -20.4, 1.6, 1.6, 1.6, C.gold, { m: 'metal' }), CN(x < 48 ? 27 : 69, 49, -20.4, 1.8, 6, C.gold, { tilt: Math.PI, m: 'metal' })]),
    BX(48, 101, -23, 76, 10, 4, C.velvet, { m: 'cloth', r: 2 }),
    ...Array.from({ length: 8 }, (_, i) => B(14.5 + i * 9.6, 96, -21.8, 5, 3.4, 2.4, C.velvet, { m: 'cloth' })),
    BX(48, 106.5, -20.8, 76, 1.5, 0.6, C.gold, { m: 'metal', r: 0.3 }),
    BX(48, 112, -26, 96, 10, 10, C.black, { r: 1.5 }), BX(48, 112, -20.8, 92, 3, 0.6, C.gold, { m: 'metal', r: 0.3 }),
    star(48, 116, -24, 10, 3, C.gold),
    BX(48, 9, 0, 96, 18, 62, C.black, { r: 1.5 }),
    BX(48, 19.5, 0, 96, 3, 62, C.board, { m: 'plain', r: 0.8 }),
    ...[-24, -16, -8, 0, 8, 16, 24].map(z => BX(48, 21.05, z, 95, 0.2, 0.4, C.boardDk, { m: 'plain', r: 0.05 })),
    BX(48, 17.4, 30.6, 96, 2, 1.2, C.gold, { m: 'metal', r: 0.4 }),
    ...Array.from({ length: 7 }, (_, i) => star(9 + i * 13, 8.6, 31.4, 5, 1, C.gold)),
    ...Array.from({ length: 6 }, (_, i) => B(15.5 + i * 13, 22, 27, 1.8, 1.3, 1.8, C.lamp, { m: 'glow' })),
  ], { glow: [C.lamp] }),

  // stage curtains for a wall: a scalloped velvet pelmet with gold fringe, drapes gathered by gold tiebacks and tassels
  wallPiece('concurtains', 'Stage curtains', 2, 650, 'cloth', [
    BX(32, 50, 1, 52, 76, 2, C.stage, { m: 'gloss' }),
    ...[4, 10, 16, 48, 54, 60].map(x => B(x, 58, 4, 4.2, 26, 3, C.velvet, { ev: 0.8, e: 0.8 })),
    ...[4.5, 11, 17.5, 46.5, 53, 59.5].map(x => B(x, 20, 4, 4.8, 14, 3.2, C.velvet, { ev: 0.8, e: 0.8 })),
    ...[11, 53].flatMap(x => [BX(x, 34, 7.4, 18, 2.4, 1, C.gold, { m: 'metal', r: 0.6, tilt: x < 32 ? 0.12 : -0.12 }),
      B(x < 32 ? 20 : 44, 33, 7.6, 1.6, 1.6, 1.6, C.gold, { m: 'metal' }), CN(x < 32 ? 20 : 44, 32, 7.6, 2, 7, C.gold, { tilt: Math.PI, m: 'metal' })]),
    BX(32, 89, 3, 64, 10, 6, C.velvet, { r: 2 }),
    ...Array.from({ length: 8 }, (_, i) => B(4 + i * 8, 83, 5, 4.6, 3.4, 2.4, C.velvet)),
    BX(32, 84.4, 6.4, 62, 1.6, 0.6, C.gold, { m: 'metal', r: 0.3 }),
    ...Array.from({ length: 8 }, (_, i) => CN(4 + i * 8, 80, 6, 1.2, 3.4, C.gold, { tilt: Math.PI, m: 'metal' })),
  ]),

  // a spotlight on a tripod, its gold-rimmed lens lit
  piece('conspotlight', 'Contest spotlight', 1, 1, 450, 'gloss', [
    ...[[4, 0, 9], [28, 0, 9], [16, 0, -13]].map(f => ST([16, 38, 0], f, 1, C.black, { m: 'metal' })),
    B(16, 38, 0, 2.4, 2.4, 2.4, C.black),
    CY(16, 48, 0, 1.2, 20, C.silver, { m: 'metal' }),
    BX(16, 58, 0, 25, 2, 2, C.black, { r: 0.6 }), BX(4.5, 64, 0, 2, 12, 2, C.black, { r: 0.6 }), BX(27.5, 64, 0, 2, 12, 2, C.black, { r: 0.6 }),
    B(3.6, 68, 0, 1.6, 1.6, 1.6, C.gold, { m: 'metal' }), B(28.4, 68, 0, 1.6, 1.6, 1.6, C.gold, { m: 'metal' }),
    DZ(16, 68, -1, 10, 18, C.black),
    DZ(16, 68, -1, 10.4, 2, C.gold, { m: 'metal' }),
    DZ(16, 68, -10.5, 8, 1.2, C.black),
    ...[-6, -2, 2].map(z => BX(16, 78.4, z, 8, 1.6, 1.2, C.black, { r: 0.4 })),
    DZ(16, 68, 8.6, 10.6, 1.4, C.gold, { m: 'metal' }),
    DZ(16, 68, 9.6, 8, 0.8, C.lamp, { m: 'glow' }),
  ], { glow: [C.lamp] }),

  // the five contest ribbons under glass on a velvet plinth
  piece('conribboncase', 'Ribbon case', 1, 1, 900, 'cloth', [
    BX(16, 1.5, 0, 26, 3, 22, C.gold, { m: 'metal', r: 0.8 }),
    BX(16, 16, 0, 24, 26, 20, C.velvet),
    BX(16, 30, 0, 26, 2, 22, C.gold, { m: 'metal', r: 0.6 }),
    star(16, 17, 10.4, 4.5, 0.8, C.gold),
    BX(16, 46, -7, 26, 28, 2, C.velvetDk),
    ...rosette(8.5, 53.5, -5, 3.4, C.cool), ...rosette(16, 53.5, -5, 3.4, C.beauty), ...rosette(23.5, 53.5, -5, 3.4, C.cute),
    ...rosette(12, 42, -5, 3.4, C.smart), ...rosette(20, 42, -5, 3.4, C.tough),
    BX(16, 62, 0, 28, 2, 21, C.gold, { m: 'metal', r: 0.6 }), B(16, 64.4, 0, 2, 2, 2, C.gold, { m: 'metal' }),
    BX(16, 46, 0, 27, 29, 20, C.glass, { m: 'glass', r: 0.6, k: 30 }),
  ]),

  // a Master ribbon in a gold shadow box: a pleated rosette, a tail for each condition
  wallPiece('conribbonbox', 'Master ribbon frame', 1, 550, 'metal', [
    BX(16, 52, 2, 28, 40, 4, C.gold),
    BX(16, 52, 4.2, 24, 36, 0.4, C.velvetDk, { m: 'cloth', r: 0.3 }),
    ...FIVE.map((c, i) => BX(16 + (i - 2) * 3.4, 47, 5, 3, 16, 0.5, c, { r: 0.3, tilt: (i - 2) * -0.12, m: 'plain' })),
    SH(starPts(16, 60, 8.5, 16, 0.85), 5.6, 1, C.gold),
    SH(starPts(16, 60, 6, 12, 0.82), 6.4, 0.8, C.velvet, { m: 'plain' }),
    DZ(16, 60, 7, 3.4, 0.6, C.white, { m: 'plain' }), SH(starPts(16, 60, 2.8), 7.4, 0.4, C.gold),
    BX(16, 36.4, 4.7, 15, 4.4, 0.4, C.gold, { r: 0.4 }), TX('MASTER', 16, 36.4, 5, 3.2, 13, C.black),
    BX(16, 52, 6.4, 24, 36, 0.6, C.glass, { m: 'glass', r: 0.3, k: 30 }),
  ]),

  // the judges' desk: three velvet chairs behind it, three name cards and their mics, a gold star for each judge
  piece('conjudges', "Judges' desk", 2, 1, 1100, 'cloth', [
    ...[12, 32, 52].flatMap(x => [BX(x, 42, -12, 14, 24, 3, C.velvet, { r: 3 }), BX(x, 54.4, -12, 14.4, 1.6, 3.4, C.gold, { m: 'metal', r: 0.7 })]),
    BX(32, 13, 2, 64, 26, 24, C.velvet),
    BX(32, 24, 14.2, 62, 1.6, 0.6, C.gold, { m: 'metal', r: 0.3 }), BX(32, 2, 14.2, 62, 1.6, 0.6, C.gold, { m: 'metal', r: 0.3 }),
    ...[21.3, 42.7].map(x => BX(x, 13, 14.2, 1.4, 21, 0.6, C.gold, { m: 'metal', r: 0.3 })),
    ...[10.7, 32, 53.3].map(x => star(x, 13, 14.6, 5, 0.8, C.gold)),
    BX(32, 27.5, 2, 64, 3, 26, C.black, { m: 'gloss', r: 0.8 }),
    ...[12, 32, 52].flatMap(x => [BX(x, 32.4, 8, 15, 6, 2.4, C.cream, { m: 'plain', r: 0.4 }),
      ST([x + 6, 29, 2], [x + 5, 37, 3.5], 0.5, C.black, { m: 'gloss' }), B(x + 5, 37.6, 3.6, 1.3, 1.3, 1.3, C.silver, { m: 'metal' })]),
    PC(32, 32.4, 9.3, 56, 6, nameCards, { cut: true }),
  ]),

  // an applause meter: five hearts that light as the crowd cheers, a gold star on top
  piece('conapplause', 'Applause meter', 1, 1, 600, 'gloss', [
    BX(16, 4, 0, 26, 8, 14, C.black, { r: 1.5 }), BX(16, 8.4, 0, 26.4, 1, 14.4, C.gold, { m: 'metal', r: 0.4 }),
    BX(16, 46, 0, 22, 72, 6, C.black, { r: 3 }),
    BX(16, 46, 3.2, 20, 70, 0.4, C.gold, { m: 'metal', r: 2.5 }), BX(16, 46, 3.5, 18, 68, 0.4, C.black, { r: 2 }),
    ...[18, 31, 44, 57].map((h, i) => SH(heartPts(16, h, 10 + i * 0.6), 4.1, 1.2, C.heart, { m: 'glow' })),
    SH(heartPts(16, 71, 13), 4.1, 1.2, C.heartTop, { m: 'glow' }),
    star(16, 87, 0, 7.5, 3, C.gold),
  ], { glow: [C.heart, C.heartTop] }),

  // the Berry Blender: four players' handles round its table, berries under the glass dome, the spinner on top
  piece('conblender', 'Berry Blender', 1, 1, 850, 'gloss', [
    LA(16, 0, 0, [[11, 0], [11, 2], [6, 5], [4.5, 8], [4.5, 20], [8, 24], [0, 24]], C.slate),
    CY(16, 24.6, 0, 15.5, 1.2, C.cool), CY(16, 26.2, 0, 15, 3.4, C.white),
    ...[[-1, -1, C.smart], [1, -1, C.tough], [-1, 1, C.cool], [1, 1, C.beauty]].flatMap(([sx, sz, c]) => [
      BX(16 + sx * 10.6, 28.8, sz * 10.6, 4, 2, 4, c, { r: 0.8 }), B(16 + sx * 10.6, 30.8, sz * 10.6, 1.8, 1.8, 1.8, c)]),
    B(13, 30.4, -1, 2.4, 2.4, 2.4, C.cool), B(18.6, 30.4, 1, 2.4, 2.4, 2.4, C.beauty), B(16, 32.8, -2, 2.2, 2.2, 2.2, C.cute),
    B(16, 28, 0, 9, 9, 9, C.glass, { m: 'glass', k: 20 }),
    CY(16, 37.6, 0, 2, 1.4, C.gold, { m: 'metal', k: 21 }), BX(16, 38.6, 1, 1.6, 0.8, 10, C.gold, { m: 'metal', k: 22, r: 0.3 }),
  ]),

  // a Pokéblock case, open on a gold stand: a block of every condition's colour
  piece('conblockcase', 'Pokéblock case stand', 1, 1, 350, 'gloss', [
    LA(16, 0, 0, [[9, 0], [9, 2], [3, 5], [2.2, 10], [2.2, 26], [4, 30], [0, 30]], C.gold, { m: 'metal' }),
    CY(16, 31, 0, 13, 2, C.black),
    BX(16, 46, -6.3, 22, 13, 1.6, C.case, { r: 1.2, tx: -0.2 }),
    BX(16, 36, 2, 22, 8, 14, C.case, { r: 2 }),
    ...[0, 5.5].flatMap(z => FIVE.map((c, i) => BX(7.6 + i * 4.2, 40.4, z, 3.2, 2.4, 3.2, c, { r: 0.5 }))),
    star(16, 36, 9.3, 2.6, 0.6, C.gold),
  ]),

  // a Poffin pot on its burner, batter bubbling, the ladle in it
  piece('conpoffinpot', 'Poffin pot', 1, 1, 500, 'gloss', [
    BX(16, 7, 0, 28, 14, 24, C.black, { r: 2 }), BX(16, 13.6, 0, 28.6, 1, 24.6, C.gold, { m: 'metal', r: 0.4 }),
    BX(16, 7, 12.2, 16, 4, 0.6, C.flame, { m: 'glow', r: 0.6 }),
    ...[11, 16, 21].map(x => CN(x, 14, 0, 2.2, 5, C.flame, { m: 'glow' })),
    LA(16, 15, 0, [[9, 0], [12, 2], [13.5, 8], [13.5, 22], [14.6, 22.6], [14.6, 24], [13.2, 24], [13.2, 21], [0, 21]], C.silver, { m: 'metal' }),
    CY(16, 36.4, 0, 13.1, 0.8, C.batter, { m: 'plain' }),
    BX(1.8, 33, 0, 3, 2, 6, C.black, { r: 0.6 }), BX(30.2, 33, 0, 3, 2, 6, C.black, { r: 0.6 }),
    ST([18, 36, -2], [24, 58, -4], 0.9, C.gold, { m: 'metal' }), B(24.3, 59, -4.1, 1.5, 1.5, 1.5, C.gold, { m: 'metal' }),
  ], { glow: [C.flame] }),

  // the dressing room's vanity: a mirror ringed with bulbs, velvet drawers, a lipstick, perfume and a powder puff
  piece('convanity', 'Dressing room vanity', 2, 1, 950, 'gloss', [
    BX(32, 15, -9, 30, 22, 2, C.black),
    ...[9, 55].flatMap(x => [BX(x, 13, 2, 16, 26, 24, C.velvet, { m: 'cloth' }), BX(x, 13, 14.2, 14, 0.6, 0.4, C.velvetDk, { m: 'plain', r: 0.2 }),
      B(x, 18.5, 14.5, 1.2, 1.2, 1, C.gold, { m: 'metal' }), B(x, 7.5, 14.5, 1.2, 1.2, 1, C.gold, { m: 'metal' })]),
    BX(32, 27.5, 2, 64, 3, 26, C.black, { r: 0.8 }),
    BX(32, 59, -9, 44, 58, 3, C.black, { r: 2 }),
    BX(32, 59, -7.3, 34, 48, 0.4, C.mirror, { m: 'metal', r: 1 }),
    ...[14, 23, 32, 41, 50].map(x => B(x, 86, -7, 1.8, 1.8, 1.4, C.lamp, { m: 'glow' })),
    ...[12, 52].flatMap(x => [40, 52, 64, 76].map(h => B(x, h, -7, 1.8, 1.8, 1.4, C.lamp, { m: 'glow' }))),
    CY(44, 31.5, 8, 1.2, 5, C.cool), CY(44, 34.4, 8, 0.9, 1, C.gold, { m: 'metal' }),
    LA(50, 29, 6, [[2.6, 0], [2.6, 4], [1, 5], [1, 6.4], [0, 6.4]], C.beauty), B(50, 36.4, 6, 1.1, 1.1, 1.1, C.gold, { m: 'metal' }),
    B(17, 30.5, 8, 3.2, 1.5, 3.2, C.cute, { m: 'plain' }), BX(25, 29.6, 9, 6, 1.2, 2.4, C.gold, { m: 'metal', r: 0.4 }),
  ], { glow: [C.lamp] }),

  // a costume rack: a gold rail of five contest dresses, one in each condition's colour
  piece('conrack', 'Costume rack', 2, 1, 650, 'cloth', [
    ...[4, 60].flatMap(x => [ST([x, 3.5, 0], [x, 72, 0], 1.2, C.gold, { m: 'metal' }), BX(x, 2.6, 0, 4, 2, 28, C.black, { m: 'gloss', r: 0.8 }),
      B(x, 1, -12, 1.1, 1.1, 1.1, C.black, { m: 'gloss' }), B(x, 1, 12, 1.1, 1.1, 1.1, C.black, { m: 'gloss' }), B(x, 73.4, 0, 1.8, 1.8, 1.8, C.gold, { m: 'metal' })]),
    RD(3, 61, 72, 0, 1.3, C.gold, { m: 'metal' }),
    ...FIVE.flatMap((c, i) => dress(10 + i * 11, i % 2 ? 1.5 : -1.5, c)),
  ]),

  // the Super Contest Show's accessories behind glass: a top hat and a bow, a crown and star glasses, a flower and pearls
  piece('conaccessory', 'Accessory case', 1, 1, 700, 'cloth', [
    BX(16, 36, -9.5, 28, 68, 3, C.velvet), BX(2.5, 36, -1, 3, 68, 20, C.velvet), BX(29.5, 36, -1, 3, 68, 20, C.velvet),
    BX(16, 4, -1, 28, 8, 20, C.velvet), BX(16, 69, -1, 28, 2, 20, C.velvet), BX(16, 70.6, -1, 29, 1.2, 21, C.gold, { m: 'metal', r: 0.4 }),
    BX(16, 38, -7.8, 24, 60, 0.4, C.black, { m: 'plain' }),
    BX(16, 26.5, -1, 24, 1, 18, C.glass, { m: 'glass', r: 0.3 }), BX(16, 47, -1, 24, 1, 18, C.glass, { m: 'glass', r: 0.3 }),
    CY(10, 9.3, 0, 5.4, 0.8, C.black, { m: 'gloss' }), CY(10, 14, 0, 3.4, 8.6, C.black, { m: 'gloss' }), CY(10, 11, 0, 3.5, 1.4, C.cool, { m: 'plain' }),
    B(18.6, 13, 0, 3, 2.4, 1.6, C.cute, { tilt: 0.3, m: 'plain' }), B(24.4, 13, 0, 3, 2.4, 1.6, C.cute, { tilt: -0.3, m: 'plain' }), B(21.5, 13, 0.8, 1.3, 1.3, 1.3, C.cute, { m: 'plain' }),
    CY(10.5, 30.5, 0, 4, 6, C.gold, { m: 'metal' }), ...[7, 10.5, 14].map(x => CN(x, 33.5, 2.5, 1.2, 3.4, C.gold, { m: 'metal' })), B(10.5, 30.5, 4, 1.2, 1.2, 0.8, C.cool, { m: 'gloss' }),
    SH(starPts(19.4, 32, 3), 1.5, 0.8, C.black, { m: 'gloss' }), SH(starPts(25.6, 32, 3), 1.5, 0.8, C.black, { m: 'gloss' }), BX(22.5, 32.6, 1.5, 3, 0.7, 0.6, C.gold, { m: 'metal', r: 0.2 }),
    SH(starPts(11, 55, 4.6, 6, 0.55), 0, 1, C.cute, { m: 'plain' }), DZ(11, 55, 0.8, 1.6, 0.6, C.tough, { m: 'plain' }),
    ...[0, 1, 2, 3, 4].map(i => B(18 + i * 2, 54 - Math.sin(i / 4 * Math.PI) * 3, 0, 1.1, 1.1, 1.1, C.white, { m: 'gloss' })),
    BX(16, 37, 9.4, 26, 62, 0.6, C.glass, { m: 'glass', r: 0.3, k: 30 }),
  ]),

  // a contest microphone: a gold mic on a stand with a gold base, a pink bow tied on
  piece('conmic', 'Contest microphone', 1, 1, 250, 'metal', [
    CY(16, 1, 0, 8, 2, C.gold, { rb: 9 }),
    CY(16, 28, 0, 1, 52, C.black),
    B(13.4, 40, 0.6, 2.4, 1.6, 1, C.cute, { tilt: 0.4, m: 'plain' }), B(18.6, 40, 0.6, 2.4, 1.6, 1, C.cute, { tilt: -0.4, m: 'plain' }), B(16, 40, 1, 1, 1, 1, C.cute, { m: 'plain' }),
    BX(16, 55, 0, 3, 3, 3, C.black, { m: 'gloss', r: 0.6 }),
    CY(16, 60, 1, 1.8, 8, C.gold, { rb: 1.2 }), CY(16, 64.5, 1, 2.2, 1.2, C.black),
    B(16, 68, 1, 3.6, 3.6, 3.6, C.silver),
  ]),

  // a confetti cannon on wheels, a burst of the five colours caught as it pops
  piece('conconfetti', 'Showtime confetti cannon', 1, 1, 500, 'gloss', [
    BX(16, 7, 0, 22, 8, 24, C.black, { r: 1.5 }), BX(16, 11.3, 0, 22.5, 1, 24.5, C.gold, { m: 'metal', r: 0.4 }),
    ...[3, 29].flatMap(x => [DZ(x, 6, 0, 6, 2.5, C.velvetDk, { ax: 'x' }), DZ(x < 16 ? 1.5 : 30.5, 6, 0, 2, 0.8, C.gold, { ax: 'x', m: 'metal' })]),
    BX(16, 13.5, -3, 10, 5, 10, C.black, { r: 1 }),
    ST([16, 12, -4], [16, 43, 4], 6, C.velvet),
    ST([16, 26, -0.4], [16, 28.4, 0.2], 6.6, C.gold, { m: 'metal' }),
    ST([16, 42, 3.6], [16, 46, 4.6], 6.8, C.gold, { m: 'metal' }),
    ...Array.from({ length: 14 }, (_, i) => BX(16 + Math.sin(i * 2.4) * (3 + i * 0.8), 52 + i * 2.2, 5 + Math.cos(i * 1.7) * 3, 2, 1.6, 0.4, FIVE[i % 5], { r: 0.2, tilt: i * 0.7, m: 'plain' })),
    ...[[8, 64], [24, 72], [14, 84]].map(([x, h], i) => star(x, h, 5, 2.6, 0.6, i === 1 ? C.white : C.gold)),
  ]),

  // a row of two red theatre seats between black standards, gold armrests
  piece('conseats', 'Theatre seats', 2, 1, 700, 'cloth', [
    ...[17, 47].flatMap(x => [BX(x, 12, 1, 24, 4, 16, C.black, { m: 'gloss' }), BX(x, 17, 2, 26, 6, 18, C.velvet, { r: 2.5 }),
      BX(x, 36, -12.6, 26.4, 34.4, 1.4, C.black, { m: 'gloss', r: 3 }), BX(x, 36, -9, 26, 34, 6, C.velvet, { r: 4 }),
      BX(x, 50, -5.8, 6, 2.6, 0.4, C.gold, { m: 'metal', r: 0.3 })]),
    ...[2, 32, 62].flatMap(x => [BX(x, 13, 0, 4, 26, 26, C.black, { m: 'gloss', r: 1.2 }), BX(x, 26.6, 1, 4.6, 1.4, 22, C.gold, { m: 'metal', r: 0.6 })]),
  ]),

  // the box office: a velvet counter with the five conditions' stars, a ticket window, a roll of tickets and a bell
  piece('conticket', 'Contest ticket desk', 2, 1, 800, 'cloth', [
    BX(32, 40, -13, 64, 80, 6, C.black, { m: 'gloss', r: 1.5 }),
    BX(32, 76, -9, 56, 12, 2, C.velvet), TX('TICKETS', 32, 76, -7.8, 8, 42, C.gold),
    star(6, 76, -9.6, 4, 1, C.gold), star(58, 76, -9.6, 4, 1, C.gold),
    BX(32, 50, -9.5, 34, 26, 1, C.gold, { m: 'metal' }), BX(32, 50, -8.8, 30, 22, 0.4, C.stage, { m: 'gloss' }),
    ...[24, 32, 40].map(x => BX(x, 50, -8.4, 0.8, 22, 0.4, C.gold, { m: 'metal', r: 0.2 })),
    BX(32, 17, 3, 64, 34, 22, C.velvet),
    BX(32, 35.5, 3, 64, 3, 24, C.black, { m: 'gloss', r: 0.8 }),
    BX(32, 31, 14.2, 62, 1.6, 0.6, C.gold, { m: 'metal', r: 0.3 }), BX(32, 2, 14.2, 62, 1.6, 0.6, C.gold, { m: 'metal', r: 0.3 }),
    ...FIVE.map((c, i) => SH(starPts(10 + i * 11, 17, 4.5), 14.4, 1, c, { m: 'plain' })),
    DZ(16, 40.4, 6, 3.4, 4, C.cool, { ax: 'x', m: 'gloss' }), BX(16, 37.3, 10, 3.6, 0.4, 6, C.cream, { m: 'plain', r: 0.1 }),
    LA(48, 37, 6, [[3, 0], [3, 0.6], [2.6, 1.2], [2.4, 3], [1.2, 4], [0.5, 4.4], [0.5, 5.2], [0, 5.4]], C.gold, { m: 'metal' }),
  ]),

  // the five conditions' pennants on a gold rod: Cool's star, Beauty's sparkle, Cute's heart, Smart's dot, Tough's peak
  wallPiece('conbanners', 'Condition banners', 2, 450, 'cloth', [
    RD(2, 62, 86, 3, 1.2, C.gold, { m: 'metal' }), B(1.6, 86, 3, 2, 2, 2, C.gold, { m: 'metal' }), B(62.4, 86, 3, 2, 2, 2, C.gold, { m: 'metal' }),
    ...FIVE.flatMap((c, i) => {
      const x = 8 + i * 12;
      return [SH([[x - 5, 84], [x + 5, 84], [x + 5, 50], [x, 55], [x - 5, 50]], 2.6, 1, c), BX(x, 85.6, 3, 8, 2, 2.6, C.gold, { m: 'metal', r: 0.6 }),
        [SH(starPts(x, 71, 3.4), 3.3, 0.4, C.white, { m: 'plain' }), SH(starPts(x, 71, 3.8, 4, 0.35), 3.3, 0.4, C.white, { m: 'plain' }),
          SH(heartPts(x, 71, 7), 3.3, 0.4, C.white, { m: 'plain' }), DZ(x, 71, 3.3, 2.8, 0.4, C.white, { m: 'plain' }),
          SH([[x - 3.4, 68], [x + 3.4, 68], [x, 74.5]], 3.3, 0.4, C.white, { m: 'plain' })][i]];
    }),
  ]),

  // the Master Rank trophy: a gold cup on a black plinth, a rosette on the cup, a star on top
  piece('controphy', 'Master Rank trophy', 1, 1, 1300, 'metal', [
    BX(16, 7, 0, 22, 14, 18, C.black, { m: 'gloss', r: 1.2 }), BX(16, 14.4, 0, 23, 1, 19, C.gold, { r: 0.4 }),
    BX(16, 7, 9.2, 15, 6, 0.4, C.gold, { r: 0.4 }), TX('MASTER', 16, 7, 9.5, 4, 13, C.black),
    LA(16, 15, 0, [[6, 0], [6, 1.5], [3, 3], [1.8, 6], [1.8, 12], [3.5, 14], [8, 18], [10, 24], [10.5, 32], [11.5, 33], [11.5, 34], [0, 34]], C.gold),
    RG(4.6, 39, 0, 4, 1.1, C.gold), RG(27.4, 39, 0, 4, 1.1, C.gold),
    SH(starPts(16, 35, 4.2, 12, 0.8), 8.9, 1, C.velvet, { m: 'plain' }), DZ(16, 35, 9.6, 1.9, 0.6, C.white, { m: 'plain' }),
    CY(16, 50.5, 0, 1.2, 3, C.gold),
    star(16, 57, 0, 7, 2.4, C.gold),
  ]),

  // a Contest poster in a gold frame
  wallPiece('conposter', 'Contest poster', 1, 200, 'metal', [
    BX(16, 54, 1, 26, 36, 2, C.gold, { r: 0.6 }),
    PC(16, 54, 2.2, 23, 33, poster),
  ]),

  // a red carpet runner: gold borders, a star of each condition down it
  { id: 'concarpet', name: 'Red carpet runner', group: GROUP, solo: true, w: 1, h: 3, layer: 'rug', price: 380, high: 0.03, side: 'c', flat(w, h) {
    const g = ctx(), l = g.createLinearGradient(0, 0, w, 0);
    l.addColorStop(0, sh(C.velvet, -1)); l.addColorStop(0.5, C.velvet); l.addColorStop(1, sh(C.velvet, -1));
    g.fillStyle = l; g.fillRect(0, 2, w, h - 4);
    R(2, 2, 2, h - 4, C.gold); R(w - 4, 2, 2, h - 4, C.gold); R(5, 2, 0.6, h - 4, sh(C.gold, -1)); R(w - 5.6, 2, 0.6, h - 4, sh(C.gold, -1));
    for (let x = 0.5; x < w; x += 1.6) { R(x, 0, 0.9, 2.2, C.gold); R(x, h - 2.2, 0.9, 2.2, C.gold); }
    FIVE.forEach((c, i) => {
      const cy = 12 + i * 18;
      g.fillStyle = sh(C.velvet, -1); g.beginPath(); starPts(w / 2 + 0.6, -cy - 0.6, 6.4).forEach(([x, y]) => g.lineTo(x, -y)); g.closePath(); g.fill();
      g.fillStyle = c; g.beginPath(); starPts(w / 2, -cy, 6).forEach(([x, y]) => g.lineTo(x, -y)); g.closePath(); g.fill();
      g.fillStyle = sh(c, 1); g.beginPath(); starPts(w / 2, -cy, 2.6).forEach(([x, y]) => g.lineTo(x, -y)); g.closePath(); g.fill();
      if (i < 4) for (const dx of [-3, 0, 3]) oval(w / 2 + dx, cy + 9, 0.7, 0.7, C.gold);
    });
  } },

  // a star-shaped rug: a point for each condition round a gold middle
  { id: 'constarrug', name: 'Contest star rug', group: GROUP, solo: true, w: 2, h: 2, layer: 'rug', price: 420, high: 0.04, side: 'a', flat() {
    const g = ctx(), P = STAR_RUG, inner = starPts(32, -33, 31 * 0.48 * 0.92, 5, 1, Math.PI / 5).map(([x, y]) => [x, -y]);
    g.fillStyle = sh(C.gold, -1); g.beginPath(); P.forEach(p => g.lineTo(...p)); g.closePath(); g.fill();
    const mid = [32, 33];
    for (let i = 0; i < 5; i++) {
      const tip = P[i * 2], a = P[(i * 2 + 9) % 10], b = P[i * 2 + 1];
      const pull = (p, f) => [mid[0] + (p[0] - mid[0]) * f, mid[1] + (p[1] - mid[1]) * f];
      poly([pull(tip, 0.9), pull(b, 0.9), mid, pull(a, 0.9)], FIVE[i]);
    }
    poly(inner, C.gold);
    g.fillStyle = C.white; g.beginPath(); starPts(32, -33, 6).forEach(([x, y]) => g.lineTo(x, -y)); g.closePath(); g.fill();
    for (let i = 0; i < 5; i++) { const t = P[i * 2]; oval(32 + (t[0] - 32) * 0.62, 33 + (t[1] - 33) * 0.62, 1.4, 1.4, C.white); }
  } },

  // a big gold star on a pole that spins
  piece('constarprop', 'Spinning star', 1, 1, 400, 'metal', [
    LA(16, 0, 0, [[10, 0], [10, 2], [8, 4], [3, 6], [0, 6]], C.black, { m: 'gloss' }),
    CY(16, 28, 0, 1.4, 44, C.gold),
    star(16, 61, 0, 15, 4, C.gold),
    SH(starPts(16, 61, 8.5), 2.4, 0.8, C.cream, { m: 'plain' }), SH(starPts(16, 61, 8.5), -2.4, 0.8, C.cream, { m: 'plain' }),
    B(16, 61, 0, 1.6, 1.6, 3, C.velvet, { m: 'gloss' }),
  ]),

  // a gold stand of three trays of bouquets thrown to the winners
  piece('conflowers', 'Fan bouquet stand', 1, 1, 350, 'metal', [
    CY(16, 1.2, 0, 9, 2.4, C.gold, { rb: 10 }),
    CY(16, 30, 0, 1.2, 56, C.gold),
    CY(16, 18, 0, 14, 1.4, C.gold, { rb: 13 }), CY(16, 36, 0, 11, 1.4, C.gold, { rb: 10 }), CY(16, 54, 0, 8, 1.4, C.gold, { rb: 7 }),
    ...bouquet(16, 18.7, -7, [C.smart, C.tough, C.white, C.smart], C.cream),
    ...bouquet(8.5, 18.7, 3, [C.cool, C.cute, C.white, C.cool], C.wrap), ...bouquet(23.5, 18.7, 3, [C.beauty, C.white, C.beauty, C.cute], C.cream),
    ...bouquet(11, 36.7, 1, [C.tough, C.cool, C.tough, C.white], C.wrap), ...bouquet(21, 36.7, 1, [C.cute, C.cute, C.white, C.tough], C.cream),
    ...bouquet(16, 54.7, 0, [C.cool, C.beauty, C.cute, C.tough], C.wrap),
  ]),

  // a marquee sign ringed with bulbs: CURTAIN CALL, three gold stars over it
  wallPiece('concurtaincall', 'Curtain call sign', 2, 550, 'metal', [
    BX(32, 62, 1, 62, 28, 2, C.gold, { r: 2 }),
    BX(32, 62, 2.4, 54, 20, 1, C.black, { m: 'gloss', r: 1.4 }),
    TX('CURTAIN CALL', 32, 62.4, 3.1, 7, 48, C.heartTop),
    ...Array.from({ length: 10 }, (_, i) => 5.5 + i * 5.9).flatMap(x => [B(x, 74.4, 2.6, 1.4, 1.4, 1.2, C.lamp, { m: 'glow' }), B(x, 49.6, 2.6, 1.4, 1.4, 1.2, C.lamp, { m: 'glow' })]),
    ...[56, 62, 68].flatMap(h => [B(2.4, h, 2.6, 1.4, 1.4, 1.2, C.lamp, { m: 'glow' }), B(61.6, h, 2.6, 1.4, 1.4, 1.2, C.lamp, { m: 'glow' })]),
    star(14, 83, 1.5, 4, 1, C.gold), star(32, 86, 1.5, 5, 1, C.gold), star(50, 83, 1.5, 4, 1, C.gold),
  ], { glow: [C.lamp] }),
].map(f => ({ group: 'Contest Hall', solo: true, ...f }));
