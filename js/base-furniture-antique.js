/* base-furniture-antique.js  -  the Antique set (furniture expansion session d, 2026-10-17): a Victorian collector's
   parlour. Dark carved walnut and mahogany, brass fittings, deep green and oxblood velvet and leather, cabriole legs on
   ball-and-claw feet, turned spindles, bevelled glass. All solo, fixed colours.
   An upright piece is a list of parts in painted units (32 a tile), as in js/base-furniture-partner.js: `x` across from
   the left of its front, `h` up from the floor (a wall piece's from the foot of its strip), `z` out to the front from its
   middle (a wall piece's from the wall). They're painted here from any side, and js/base-models-antique.js builds the
   same list as 3D parts (BUILT), so picture and model agree. A `pic` part (a dial, a landscape) is painted on the front
   only, and the model wears that crop of the painting. A `slab` is a side profile run across x (the roll-top's sweep),
   a `horn` a lathe tipped forward by `tilt` (the gramophone's). The armoire's doors swing (`doors`, `inside`). The rug is
   painted from above. */

import { sh, oval, ovalShade, floorShadow, ctx, hash, glass as glassPane } from './base-paint.js';

export const AQ = {
  walnut: '#6e4528', walnutD: '#4c2d19', walnutL: '#8c5c37', mahog: '#7c3324', mahogD: '#5a2218', mahogL: '#9a4a34',
  brass: '#c9a24c', brassD: '#97742e', gold: '#d9b24e', green: '#2f5e43', greenD: '#1f4030', ox: '#742329', oxD: '#521820',
  leather: '#7c4a2c', leatherD: '#4a2a18', linen: '#f2e9d6', lace: '#faf6ee', marble: '#e9e4da', ink: '#2a2320',
  paper: '#efe3c4', parch: '#dcc89a', land: '#9c7f4a', mirror: '#c4d6de', china: '#f4f1ea', blue: '#2f4f86', navy: '#28324e',
  tan: '#b08850', plum: '#4a2c4a', rose: '#c0384a', leaf: '#4a7a3a', silk: '#e8b46a', flame: '#ffd98a', tulip: '#f6dca0',
  black: '#262224', amber: '#e09a2a', red: '#b8302c',
};
const GROUP = 'Antique';
const TAU = Math.PI * 2;

/* ---------- parts ---------- */
const B = (x, h, z, w, hh, d, c, o) => ({ t: 'box', x, h, z, w, hh, d, c, r: 1, ...o });
const C = (x, h, z, r, hh, c, o) => ({ t: 'cyl', x, h, z, r, hh, c, ...o });
const S = (x, h, z, rx, ry, rz, c, o) => ({ t: 'ball', x, h, z, rx, ry, rz, c, ...o });
const RD = (a, b, r, c, o) => ({ t: 'rod', a, b, r, c, x: (a[0] + b[0]) / 2, h: (a[1] + b[1]) / 2, z: (a[2] + b[2]) / 2, ...o });
const PR = (x, h, z, pts, d, c, o) => ({ t: 'prism', x, h, z, pts, d, c, ...o });
const LA = (x, h, z, pts, c, o) => ({ t: 'lathe', x, h, z, pts, c, ...o });
const DS = (x, h, z, r, th, c, o) => ({ t: 'disc', x, h, z, r, th, c, ...o });
const RG = (x, h, z, r, tr, c, o) => ({ t: 'ring', x, h, z, r, tr, c, ...o });
const PC = (x, h, z, w, hh, fn, o) => ({ t: 'pic', x, h, z, w, hh, fn, ...o });
/** A side profile [[dz, dh]...] about z, h, run w across x. */
const SL = (x, h, z, w, pts, c, o) => ({ t: 'slab', x, h, z, w, pts, c, ...o });
/** A lathe [[r, up]...] standing on h, tipped forward (towards +z) by `tilt`; its mouth open. */
const HN = (x, h, z, pts, tilt, c, inner, o) => ({ t: 'horn', x, h, z, pts, tilt, c, inner, ...o });

const W = { m: 'wood' }, M = { m: 'metal' }, CL = { m: 'cloth' }, PL = { m: 'plain' };
/** A cabriole leg from under a rail at `top` down to a brass ball-and-claw, its knee pushed out along sx, sz. */
const cab = (x, z, top, sx, sz, c = AQ.walnut, foot = AQ.brass) => {
  const k = [x + sx * 1.7, top * 0.62, z + sz * 1.7], a = [x - sx * 0.2, 2.4, z - sz * 0.2];
  return [RD([x, top, z], k, 1.5, c, W), RD(k, a, 1, c, W), S(a[0] + sx * 0.3, 1.5, a[2] + sz * 0.3, 1.8, 1.5, 1.8, foot, { m: 'metal', seg: 8 })];
};
/** A turned spindle hh tall, r round at its widest. */
const turned = (x, h, z, hh, r, c = AQ.walnut) => LA(x, h, z, [[r * 0.9, 0], [r, hh * 0.06], [r * 0.55, hh * 0.14], [r * 1.15, hh * 0.3], [r * 0.6, hh * 0.46], [r * 0.65, hh * 0.82], [r * 1.05, hh * 0.9], [r * 0.75, hh]], c, { seg: 10, m: 'wood' });
/** A brass bail handle w across on a face at z. */
const bail = (x, h, z, w = 5) => [
  RD([x - w / 2, h - 0.6, z + 0.7], [x + w / 2, h - 0.6, z + 0.7], 0.45, AQ.brass, M),
  ...[-1, 1].map(s => S(x + s * w / 2, h, z + 0.3, 0.75, 0.75, 0.5, AQ.brass, { m: 'metal', seg: 6 })),
];
const knob = (x, h, z, r = 0.9) => S(x, h, z + 0.5, r, r, r * 0.7, AQ.brass, { m: 'metal', seg: 8 });
/** Three legs splayed from a centre post: back, front left, front right. */
const tripod = (x, top, reach, c = AQ.walnut) => [-90, 30, 150].flatMap(deg => {
  const a = deg * Math.PI / 180, cx = Math.cos(a), cz = Math.sin(a);
  const p0 = [x + cx * 1.6, top, cz * 1.6], p1 = [x + cx * reach * 0.62, top * 0.45, cz * reach * 0.62], p2 = [x + cx * reach, 1.4, cz * reach];
  return [RD(p0, p1, 1.3, c, W), RD(p1, p2, 0.9, c, W), S(p2[0], 1.3, p2[2], 1.4, 1.3, 1.4, AQ.brass, { m: 'metal', seg: 8 })];
});

/* ---------- painting the parts ---------- */

const alphaOf = (hex, a) => { const v = parseInt(hex.slice(1), 16); return `rgba(${v >> 16},${(v >> 8) & 255},${v & 255},${a})`; };
function grad(g, x0, y0, x1, y1, c, m) {
  const l = g.createLinearGradient(x0, y0, x1, y1);
  if (m === 'metal') [[0, sh(c, 2)], [0.25, c], [0.55, sh(c, -1)], [0.8, sh(c, 1)], [1, sh(c, -1)]].forEach(s => l.addColorStop(...s));
  else if (m === 'glow') [[0, sh(c, 2)], [0.5, sh(c, 1)], [1, c]].forEach(s => l.addColorStop(...s));
  else [[0, sh(c, 1)], [0.35, c], [1, sh(c, -1)]].forEach(s => l.addColorStop(...s));
  return l;
}
function rbx(x, y, w, h, r, c, m) {
  if (w <= 0 || h <= 0) return;
  const g = ctx();
  if (m === 'glass') { g.save(); g.globalAlpha *= 0.4; glassPane(x, y, w, h, '#cfe8f4'); g.restore(); return; }
  if (m === 'plain') { g.fillStyle = c; g.beginPath(); g.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); g.fill(); return; }
  g.fillStyle = grad(g, x, y, x + w * 0.3, y + h, c, m); g.beginPath(); g.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); g.fill();
  if (h > 3 && w > 3) { g.save(); g.globalAlpha *= 0.4; g.fillStyle = sh(c, 2); g.fillRect(x + Math.min(r, w / 2) * 0.6, y + 0.3, w - Math.min(r, w / 2) * 1.2, 0.5); g.restore(); }
}
function poly(pts, c, m, horiz) {
  const g = ctx(), xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  if (m === 'glass') { g.save(); g.globalAlpha *= 0.35; }
  if (m === 'plain') g.fillStyle = c;
  else if (horiz) {
    const l = g.createLinearGradient(x0, 0, x1, 0);
    l.addColorStop(0, sh(c, -1)); l.addColorStop(0.3, sh(c, 1)); l.addColorStop(0.55, c); l.addColorStop(1, sh(c, -2));
    g.fillStyle = m === 'glass' ? '#cfe8f4' : l;
  } else g.fillStyle = m === 'glass' ? '#cfe8f4' : grad(g, x0, y0, x1, y1, c, m);
  g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill();
  if (m === 'glass') g.restore();
}
function ball(cx, cy, rx, ry, c, m) {
  const g = ctx();
  if (m === 'glow') { const t = g.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry)); t.addColorStop(0, '#ffffff'); t.addColorStop(0.4, sh(c, 1)); t.addColorStop(1, c); g.fillStyle = t; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, TAU); g.fill(); return; }
  if (m === 'glass') { g.save(); g.globalAlpha *= 0.4; oval(cx, cy, rx, ry, '#dff0f8'); g.restore(); return; }
  if (m === 'plain') { oval(cx, cy, rx, ry, c); return; }
  ovalShade(cx, cy, rx, ry, c);
  if (m === 'gloss' || m === 'metal') { g.save(); g.globalAlpha *= 0.55; oval(cx - rx * 0.38, cy - ry * 0.42, rx * 0.22, ry * 0.14, '#ffffff'); g.restore(); }
}

/** Paints parts seen from `dir` (0 front, 2 back, 1 / 3 the sides), on a view vw wide standing on line b; Wd is the
    piece's front width in units. */
function paintParts(parts, x0, b, vw, dir, Wd) {
  const side = dir % 2 === 1, sg = dir === 3 ? -1 : 1, g = ctx();
  const U = (px, pz) => (dir === 0 ? x0 + px : dir === 2 ? x0 + Wd - px : x0 + vw / 2 + sg * pz);
  const key = (q) => q.k ?? (dir === 0 ? q.z : dir === 2 ? -q.z : sg * (Wd / 2 - q.x));
  const list = parts.map((q, i) => [key(q), i, q]).sort((a, c) => a[0] - c[0] || a[1] - c[1]).map(e => e[2]);
  for (const q of list) {
    if (q.t === 'pic' && dir !== 0) continue;
    const m = q.m || 'gloss', cx = U(q.x, q.z), cy = b - q.h;
    switch (q.t) {
      case 'box': { const w = side ? q.d : q.w; rbx(cx - w / 2, cy - q.hh / 2, w, q.hh, q.r, q.c, m); break; }
      case 'cyl': {
        const rb = q.rb ?? q.r, top = cy - q.hh / 2, bot = cy + q.hh / 2;
        poly([[cx - q.r, top], [cx + q.r, top], [cx + rb, bot], [cx - rb, bot]], q.c, m, m !== 'glow');
        if (m !== 'glass') oval(cx, top, q.r, Math.min(q.r * 0.22, Math.max(0.3, q.hh / 2)), sh(q.c, m === 'glow' ? 2 : 1));
        break;
      }
      case 'ball': ball(cx, cy, side ? q.rz : q.rx, q.ry, q.c, m); break;
      case 'disc': if (side) rbx(cx - q.th / 2, cy - (q.ry ?? q.r), q.th, (q.ry ?? q.r) * 2, q.th / 2, q.c, m); else ball(cx, cy, q.r, q.ry ?? q.r, q.c, m); break;
      case 'lathe': {
        const pts = q.pts.map(([r, up]) => [r, cy - up]);
        poly([...pts.map(([r, y]) => [cx - r, y]), ...pts.slice().reverse().map(([r, y]) => [cx + r, y])], q.c, m, true);
        if (q.pts[q.pts.length - 1][0] < 0.01 && q.pts.length > 2) break;
        const [rt, ut] = q.pts[q.pts.length - 1];
        oval(cx, cy - ut, rt, rt * 0.22, sh(q.c, -2));
        break;
      }
      case 'horn': {
        const ct = Math.cos(q.tilt), st = Math.sin(q.tilt);
        if (side) {
          const ring = q.pts.map(([r, up]) => { const zc = q.z + up * st, hc = q.h + up * ct; return [[U(0, zc + r * ct), b - hc + r * st], [U(0, zc - r * ct), b - hc - r * st]]; });
          poly([...ring.map(e => e[0]), ...ring.slice().reverse().map(e => e[1])], q.c, m);
          break;
        }
        const ys = q.pts.map(([r, up]) => [r, cy - up * ct]);
        for (let i = 1; i < ys.length; i++) {
          const [r0, y0] = ys[i - 1], [r1, y1] = ys[i];
          poly([[cx - r0, y0], [cx + r0, y0], [cx + r1, y1], [cx - r1, y1]], q.c, m, true);
          ball(cx, y1, r1, r1 * st, q.c, m);
        }
        if (dir === 0) {
          const [r, y] = ys[ys.length - 1];
          oval(cx, y, r * 0.92, r * st * 0.92, q.inner);
          oval(cx, y + r * st * 0.12, r * 0.45, r * st * 0.45, sh(q.inner, -2));
        }
        break;
      }
      case 'ring': {
        g.strokeStyle = q.c; g.lineWidth = q.tr * 2; g.beginPath();
        if (q.flat) g.ellipse(cx, cy, q.r, q.r * 0.22, 0, 0, TAU);
        else if (side) { rbx(cx - q.tr, cy - q.r - q.tr, q.tr * 2, (q.r + q.tr) * 2, q.tr, q.c, m); break; }
        else g.arc(cx, cy, q.r, 0, TAU);
        g.stroke();
        g.save(); g.globalAlpha *= 0.45; g.strokeStyle = sh(q.c, 2); g.lineWidth = q.tr * 0.6; g.beginPath();
        if (q.flat) g.ellipse(cx, cy - q.tr * 0.4, q.r, q.r * 0.22, 0, Math.PI, TAU); else g.arc(cx, cy, q.r, Math.PI * 1.1, Math.PI * 1.6);
        g.stroke(); g.restore();
        break;
      }
      case 'rod': {
        const p0 = [U(q.a[0], q.a[2]), b - q.a[1]], p1 = [U(q.b[0], q.b[2]), b - q.b[1]];
        if (Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) < 0.05) { ball(p0[0], p0[1], q.r, q.r, q.c, m); break; }
        g.lineCap = 'round'; g.strokeStyle = m === 'glass' ? alphaOf('#cfe8f4', 0.4) : q.c; g.lineWidth = q.r * 2;
        g.beginPath(); g.moveTo(...p0); g.lineTo(...p1); g.stroke();
        if (q.r > 0.6 && m !== 'glass' && m !== 'plain') {
          g.save(); g.globalAlpha *= 0.5; g.strokeStyle = sh(q.c, 2); g.lineWidth = q.r * 0.6;
          g.beginPath(); g.moveTo(p0[0] - q.r * 0.35, p0[1] - q.r * 0.35); g.lineTo(p1[0] - q.r * 0.35, p1[1] - q.r * 0.35); g.stroke(); g.restore();
        }
        break;
      }
      case 'prism': {
        if (side) {
          const hs = q.pts.map(p => p[1]), top = Math.max(...hs), bot = Math.min(...hs);
          rbx(cx - q.d / 2, b - q.h - top, q.d, top - bot, Math.min(1, q.d / 2), q.c, m);
          break;
        }
        poly(q.pts.map(([px, ph]) => [U(q.x + px), b - q.h - ph]), q.c, m);
        break;
      }
      case 'slab': {
        if (side) { poly(q.pts.map(([dz, dh]) => [U(0, q.z + dz), b - q.h - dh]), q.c, m); break; }
        const hs = q.pts.map(p => p[1]), top = Math.max(...hs), bot = Math.min(...hs);
        rbx(cx - q.w / 2, b - q.h - top, q.w, top - bot, 0.5, q.c, m);
        break;
      }
      case 'pic': g.save(); g.beginPath(); g.rect(cx - q.w / 2, cy - q.hh / 2, q.w, q.hh); g.clip(); q.fn(g, cx - q.w / 2, cy - q.hh / 2, q.w, q.hh); g.restore(); break;
    }
  }
}

/* ---------- pictures ---------- */

const ROMAN = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
/** A clock dial: brass corners, an enamel face, Roman hours, two blued hands at ten past ten. */
function dial(g, x, y, w, h, roman = true) {
  const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2;
  const br = g.createLinearGradient(x, y, x + w, y + h); br.addColorStop(0, sh(AQ.brass, 1)); br.addColorStop(0.5, AQ.brass); br.addColorStop(1, AQ.brassD);
  g.fillStyle = br; g.fillRect(x, y, w, h);
  g.fillStyle = AQ.brassD; for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { g.beginPath(); g.arc(cx + sx * r * 0.78, cy + sy * r * 0.78, r * 0.12, 0, TAU); g.fill(); }
  g.fillStyle = AQ.china; g.beginPath(); g.arc(cx, cy, r * 0.9, 0, TAU); g.fill();
  g.strokeStyle = AQ.ink; g.lineWidth = r * 0.03; g.beginPath(); g.arc(cx, cy, r * 0.84, 0, TAU); g.stroke();
  g.fillStyle = AQ.ink; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `bold ${r * 0.2}px Georgia, serif`;
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * TAU - Math.PI / 2;
    if (roman) g.fillText(ROMAN[i], cx + Math.cos(a) * r * 0.66, cy + Math.sin(a) * r * 0.66);
    else { g.beginPath(); g.arc(cx + Math.cos(a) * r * 0.7, cy + Math.sin(a) * r * 0.7, r * 0.05, 0, TAU); g.fill(); }
  }
  g.strokeStyle = '#1e2a48'; g.lineCap = 'round';
  for (const [a, len, lw] of [[-150, 0.42, 0.07], [-30, 0.6, 0.05]]) { const t = a * Math.PI / 180; g.lineWidth = r * lw; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(t) * r * len, cy + Math.sin(t) * r * len); g.stroke(); }
  g.fillStyle = AQ.brass; g.beginPath(); g.arc(cx, cy, r * 0.06, 0, TAU); g.fill();
}
/** The painting in the gilt frame: dusk over the hills, a lake, pines, and a Lapras far out on the water. */
function landscape(g, x, y, w, h) {
  const sky = g.createLinearGradient(0, y, 0, y + h * 0.55);
  sky.addColorStop(0, '#5a6e96'); sky.addColorStop(0.6, '#d8a07a'); sky.addColorStop(1, '#f2d39a');
  g.fillStyle = sky; g.fillRect(x, y, w, h);
  g.fillStyle = 'rgba(255,240,200,0.8)'; g.beginPath(); g.arc(x + w * 0.68, y + h * 0.42, h * 0.08, 0, TAU); g.fill();
  const hills = (pts, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(x, y + h); pts.forEach(([fx, fy]) => g.lineTo(x + fx * w, y + fy * h)); g.lineTo(x + w, y + h); g.fill(); };
  hills([[0, 0.5], [0.18, 0.3], [0.32, 0.42], [0.5, 0.22], [0.66, 0.4], [0.82, 0.28], [1, 0.46]], '#7a7e9a');
  hills([[0, 0.56], [0.22, 0.44], [0.42, 0.52], [0.6, 0.46], [0.8, 0.54], [1, 0.5]], '#5e6a58');
  const lake = g.createLinearGradient(0, y + h * 0.56, 0, y + h * 0.8); lake.addColorStop(0, '#e8c898'); lake.addColorStop(1, '#5a7a98');
  g.fillStyle = lake; g.fillRect(x, y + h * 0.56, w, h * 0.24);
  g.fillStyle = '#4a5a3a'; g.fillRect(x, y + h * 0.8, w, h * 0.2);
  g.fillStyle = '#3a4a2c'; g.beginPath(); g.moveTo(x, y + h * 0.8); g.quadraticCurveTo(x + w * 0.5, y + h * 0.74, x + w, y + h * 0.82); g.lineTo(x + w, y + h); g.lineTo(x, y + h); g.fill();
  for (const [fx, s] of [[0.06, 1], [0.12, 0.8], [0.88, 1.1], [0.94, 0.85]]) {
    const tx = x + fx * w, by = y + h * 0.86;
    g.fillStyle = '#26361e'; g.beginPath(); g.moveTo(tx, by - h * 0.4 * s); g.lineTo(tx + h * 0.09 * s, by); g.lineTo(tx - h * 0.09 * s, by); g.fill();
  }
  const lx = x + w * 0.42, ly = y + h * 0.66;
  g.fillStyle = '#4a7ab0'; g.beginPath(); g.ellipse(lx, ly, w * 0.035, h * 0.025, 0, 0, TAU); g.fill();
  g.strokeStyle = '#4a7ab0'; g.lineWidth = h * 0.02; g.beginPath(); g.moveTo(lx + w * 0.02, ly); g.quadraticCurveTo(lx + w * 0.045, ly - h * 0.06, lx + w * 0.035, ly - h * 0.1); g.stroke();
  g.fillStyle = '#c8b890'; g.beginPath(); g.ellipse(lx - w * 0.004, ly - h * 0.018, w * 0.022, h * 0.012, 0, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(255,240,210,0.6)'; g.lineWidth = h * 0.008;
  for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(x + w * (0.2 + i * 0.16), y + h * (0.62 + (i % 2) * 0.06)); g.lineTo(x + w * (0.28 + i * 0.16), y + h * (0.62 + (i % 2) * 0.06)); g.stroke(); }
}

/* ---------- the kinds ---------- */

/** What js/base-models-antique.js builds for each upright and wall kind: its parts, doors and default material. */
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

const POST = [[2.8, 0], [2.8, 10], [1.8, 12], [2.4, 20], [1.5, 24], [1.4, 86], [2.1, 90], [1.3, 95], [1.6, 98], [0, 99]];
const BOOKS = [AQ.ox, AQ.green, AQ.navy, AQ.tan, AQ.mahog, AQ.plum, AQ.greenD, AQ.leather];
/** A row of leather-bound books on a shelf top at h0, from x0 to x1, gilt bands on their spines; `gap` leaves room. */
function books(h0, x0, x1, seed, gap) {
  const out = [];
  let x = x0, i = 0;
  while (x < x1 - 2) {
    if (gap && x >= gap[0] && x < gap[1]) { x = gap[1]; continue; }
    const bw = Math.min(x1 - x, 2.4 + hash(i, seed) * 1.6), bh = 10 + hash(i, seed, 1) * 4.5, c = BOOKS[Math.floor(hash(i, seed, 2) * BOOKS.length)];
    out.push(B(x + bw / 2, h0 + bh / 2, -1, bw - 0.2, bh, 15, c, { r: 0.05, m: 'cloth' }));
    out.push(B(x + bw / 2, h0 + bh * 0.82, 6.6, bw - 0.4, 0.6, 0.2, AQ.gold, { r: 0.05, m: 'metal' }));
    x += bw; i++;
  }
  return out;
}

export const ANTIQUE_KINDS = [
  // a four-poster: turned walnut posts, a green velvet canopy fringed in gold, drapes at the head, an oxblood quilt
  piece('antqbed', 'Canopy four-poster', 2, 2, 1500, 'wood', [
    ...[[4, -28], [60, -28], [4, 28], [60, 28]].map(([x, z]) => LA(x, 0, z, POST, AQ.walnut, { seg: 10 })),
    B(32, 97, -28, 58, 3, 3, AQ.walnut), B(32, 97, 28, 58, 3, 3, AQ.walnut), B(4, 97, 0, 3, 3, 53, AQ.walnut), B(60, 97, 0, 3, 3, 53, AQ.walnut),
    B(32, 100, 0, 62, 1.4, 62, AQ.green, { m: 'cloth', r: 0.6 }),
    B(32, 93, 29.8, 60, 8, 1, AQ.green, { m: 'cloth', r: 0.4 }), B(32, 88.4, 29.9, 60, 1.4, 1.2, AQ.gold, { m: 'cloth', r: 0.3 }),
    B(32, 93, -29.8, 60, 8, 1, AQ.green, { m: 'cloth', r: 0.4 }),
    ...[1.8, 62.2].flatMap(x => [B(x, 93, 0, 1, 8, 58, AQ.green, { m: 'cloth', r: 0.4 }), B(x, 88.4, 0, 1.2, 1.4, 58, AQ.gold, { m: 'cloth', r: 0.3 })]),
    ...[8.5, 55.5].flatMap(x => [B(x, 58, -26, 7, 66, 3, AQ.green, { m: 'cloth', r: 1.4 }), B(x, 50, -26, 7.6, 1.6, 3.6, AQ.gold, { m: 'cloth', r: 0.5 })]),
    B(32, 40, -28.5, 52, 34, 3, AQ.walnut, { r: 1.2 }),
    PR(32, 57, -28.5, [[-26, 0], [26, 0], [22, 4], [10, 8], [0, 9.5], [-10, 8], [-22, 4]], 3, AQ.walnut),
    B(32, 42, -26.8, 44, 22, 0.6, AQ.walnutL, { r: 0.5 }),
    S(32, 60, -27, 2.4, 2.4, 0.8, AQ.brass, { m: 'metal', seg: 8 }),
    B(32, 18, 28.5, 52, 16, 3, AQ.walnut, { r: 1.2 }), B(32, 18, 30.2, 44, 10, 0.6, AQ.walnutL, { r: 0.5 }),
    B(32, 26.6, 28.5, 54, 1.6, 3.8, AQ.walnutD, { r: 0.6 }),
    B(32, 12, 0, 56, 7, 54, AQ.walnut),
    B(32, 19, 0, 54, 7, 54, AQ.linen, { m: 'cloth', r: 1.5 }),
    B(32, 23.2, 5, 55, 2.4, 44, AQ.ox, { m: 'cloth' }), B(32, 23.4, -18, 55, 2.6, 5, AQ.linen, { m: 'cloth' }),
    ...[20, 44].map(x => S(x, 25.5, -22, 9, 3.2, 4.6, AQ.linen, { m: 'cloth' })),
  ]),

  // a carved side chair: cabriole legs, an oval velvet back in a walnut ring, a carved crest
  piece('antqchair', 'Carved parlour chair', 1, 1, 320, 'wood', [
    ...cab(7, 8, 13, 0, 1), ...cab(25, 8, 13, 0, 1),
    ...[7, 25].map(x => RD([x, 0, -10.5], [x, 14, -9], 1.2, AQ.walnut)),
    B(16, 14, 0, 24, 3, 20, AQ.walnut),
    B(16, 16.6, 0.8, 23, 2.4, 19.5, AQ.green, { m: 'cloth', r: 1.2 }),
    RD([7.5, 15, -9], [9, 41, -10.5], 1.1, AQ.walnut), RD([24.5, 15, -9], [23, 41, -10.5], 1.1, AQ.walnut),
    RD([16, 15.5, -9.5], [16, 23.5, -10], 0.9, AQ.walnut),
    DS(16, 31, -10, 7, 1.2, AQ.green, { m: 'cloth' }),
    RG(16, 31, -10, 7.4, 1.1, AQ.walnut, { m: 'wood' }),
    B(16, 41.6, -10.5, 18, 2.6, 2.4, AQ.walnut),
    S(16, 43.6, -10.5, 3, 1.8, 1.4, AQ.walnut, { seg: 8, m: 'wood' }),
  ]),

  // a wingback armchair in oxblood leather: wings, rolled arms, brass nailheads
  piece('antqwingback', 'Oxblood wingback', 1, 1, 650, 'cloth', [
    ...cab(6, 9, 6, -0.4, 1), ...cab(26, 9, 6, 0.4, 1),
    ...[6, 26].map(x => RD([x, 0, -11.5], [x, 6, -10.5], 1.1, AQ.walnut, W)),
    B(16, 9.5, 1, 29, 7, 26, AQ.ox, { r: 1.5 }),
    B(16, 14.6, 4, 21, 3.2, 19, AQ.ox, { r: 1.4 }),
    B(16, 30, -9.5, 25, 34, 6, AQ.ox, { r: 1.5 }),
    RD([4.5, 46.5, -9.5], [27.5, 46.5, -9.5], 3, AQ.ox),
    ...[3.2, 28.8].flatMap(x => [B(x, 33, -5, 3.4, 24, 13, AQ.ox, { r: 1.4 }), B(x, 15.5, 2, 5, 11, 22, AQ.ox, { r: 1.4 }), DS(x, 21, 2.5, 3, 21, AQ.ox)]),
    ...Array.from({ length: 7 }, (_, i) => S(5 + i * 3.67, 12.2, 14.1, 0.55, 0.55, 0.4, AQ.brass, { m: 'metal', seg: 6 })),
    ...[[11, 26], [21, 26], [16, 34], [11, 41], [21, 41]].map(([x, h]) => DS(x, h, -6.3, 0.7, 0.5, AQ.oxD, { m: 'plain', seg: 6 })),
  ]),

  // a tufted settee in green velvet: arms as high as its back, rolled, buttoned, an oxblood cushion
  piece('antqsofa', 'Tufted velvet settee', 2, 1, 1200, 'cloth', [
    ...[[5, -10], [59, -10], [5, 10], [59, 10]].map(([x, z]) => S(x, 2.2, z, 2.4, 2.2, 2.4, AQ.walnut, { m: 'wood', seg: 8 })),
    B(32, 9.5, 1, 60, 11, 26, AQ.green, { r: 1.5 }),
    ...[19.5, 44.5].map(x => B(x, 16.5, 3, 25, 3.6, 21, AQ.green, { r: 1.5 })),
    B(32, 24.5, -9.5, 60, 26, 7, AQ.green, { r: 1.5 }),
    RD([3, 37, -9.5], [61, 37, -9.5], 3.2, AQ.green),
    ...[3.6, 60.4].flatMap(x => [B(x, 20, 2, 6, 24, 22, AQ.green, { r: 1.5 }), DS(x, 32, 2.5, 3.6, 22, AQ.green)]),
    ...[24, 31].flatMap((h, row) => Array.from({ length: 7 - row }, (_, i) => DS(12 + i * 6.67 + row * 3.33, h, -5.8, 0.75, 0.5, AQ.greenD, { m: 'plain', seg: 6 }))),
    ...Array.from({ length: 12 }, (_, i) => S(4.5 + i * 5, 4.8, 14.1, 0.55, 0.55, 0.4, AQ.brass, { m: 'metal', seg: 6 })),
    S(10.5, 23, -3.5, 5, 4.6, 2.4, AQ.ox),
  ]),

  // a round pedestal table on three cabriole feet, a lace runner on its top
  piece('antqtable', 'Pedestal tea table', 1, 1, 480, 'wood', [
    ...tripod(16, 7, 12.5, AQ.mahog),
    LA(16, 6, 0, [[3, 0], [3.2, 2], [2, 4], [2.8, 7], [1.6, 10], [1.6, 15], [2.4, 17], [1.8, 19]], AQ.mahog, { seg: 12 }),
    C(16, 25, 0, 13.6, 1, AQ.mahogD),
    C(16, 26.3, 0, 14.5, 1.8, AQ.mahog),
    C(16, 27.35, 0, 8, 0.3, AQ.lace, PL),
  ]),

  // a little square table, turned legs and a shelf, a lace doily over its edge, a vase of roses
  piece('antqsidetable', 'Lace doily side table', 1, 1, 280, 'wood', [
    ...[[4.5, -9.5], [27.5, -9.5], [4.5, 9.5], [27.5, 9.5]].map(([x, z]) => turned(x, 0, z, 17.2, 1.6)),
    B(16, 6, 0, 22, 1.4, 20, AQ.walnutL, { r: 0.5 }),
    B(16, 19, 0, 23, 4, 21, AQ.walnut, { r: 0.8 }),
    B(16, 22, 0, 26, 2, 24, AQ.walnut),
    C(16, 23.15, 0, 9, 0.3, AQ.lace, PL),
    PR(16, 23, 12.2, [[-6, 0], [6, 0], [0, -5]], 0.3, AQ.lace, PL),
    LA(16, 23.3, -2, [[2, 0], [3.2, 2.5], [3.4, 4.5], [2, 7.5], [1.3, 9], [1.9, 10.2]], AQ.blue, { seg: 12 }),
    ...[[14.4, 34.6, -2], [17.4, 35.2, -1], [16, 36.6, -3]].map(([x, h, z]) => S(x, h, z, 1.9, 1.7, 1.9, AQ.rose, { m: 'cloth', seg: 8 })),
    ...[[12.6, 32.8, -2], [19.6, 33, -2]].map(([x, h, z]) => S(x, h, z, 1.8, 0.8, 1.2, AQ.leaf, { m: 'cloth', seg: 8 })),
  ]),

  // a mahogany roll-top: drawer pedestals with brass bails, the tambour half up on its pigeonholes, ink and a quill
  piece('antqdesk', 'Roll-top writing desk', 2, 1, 1300, 'wood', [
    ...[9, 55].flatMap(x => [
      B(x, 1, 0, 17, 2, 29, AQ.mahogD, { r: 0.5 }),
      B(x, 15, 0, 16, 26, 28, AQ.mahog),
      ...[6, 14.5, 23].flatMap(h => [B(x, h, 14.4, 14, 7.2, 0.8, AQ.mahogL, { r: 0.5 }), ...bail(x, h, 14.8)]),
    ]),
    B(32, 15, -12, 30, 26, 2, AQ.mahogD),
    B(32, 25.6, 0, 30, 4, 28, AQ.mahog),
    B(32, 25.6, 14.4, 26, 3.2, 0.8, AQ.mahogL, { r: 0.5 }), knob(32, 25.6, 14.8),
    B(32, 29, 0.5, 64, 2, 29.5, AQ.mahog, { r: 0.8 }),
    B(32, 30.15, 4, 40, 0.4, 14, AQ.green, { m: 'cloth', r: 0.2 }),
    B(32, 42, -13.5, 60, 24, 2.5, AQ.mahog),
    ...[3, 61].map(x => SL(x, 30, 0, 3, [[-15, 0], [-1, 0], [-1, 2], [-3, 9], [-7, 16], [-11, 21], [-15, 23]], AQ.mahog)),
    SL(32, 30, 0, 56, [[-5, 13.4], [-7.4, 17], [-11, 21.6], [-15, 23.6], [-15, 21.4], [-11.4, 19.4], [-8.2, 15.6], [-6.3, 12.4]], AQ.mahogL),
    B(32, 37, -10.5, 54, 14, 6, AQ.mahogD),
    ...[12, 22, 32, 42, 52].map(x => B(x, 37, -7.3, 0.8, 13, 0.8, AQ.mahogL, { r: 0.2 })),
    B(32, 37, -7.3, 54, 0.8, 0.8, AQ.mahogL, { r: 0.2 }),
    ...[[17, 40.6], [37, 40.4], [47, 33.6], [27, 33.8]].map(([x, h], i) => B(x, h, -8.4, 5 + (i % 2), 4.4, 1.6, i % 3 ? AQ.paper : AQ.linen, { r: 0.05, m: 'plain' })),
    B(32, 54, -13.5, 62, 2, 3.5, AQ.mahogD, { r: 0.6 }),
    C(48, 31.6, 6, 1.8, 2.6, AQ.ink),
    RD([48, 33, 6], [51, 40, 4], 0.4, AQ.lace, PL),
    B(24, 30.5, 6, 9, 0.3, 11, AQ.paper, { r: 0.05, m: 'plain' }),
  ]),

  // a carved walnut armoire: pilasters, a crowned cornice, panelled doors with brass pulls, a drawer below
  piece('antqarmoire', 'Carved walnut armoire', 2, 1, 1400, 'wood', [
    ...[[6, -10], [58, -10], [6, 10], [58, 10]].map(([x, z]) => S(x, 2.1, z, 2.6, 2.1, 2.6, AQ.walnutD, { m: 'wood', seg: 8 })),
    B(32, 6.5, 0, 62, 5, 30, AQ.walnutD),
    B(32, 46, -1, 58, 74, 26, AQ.walnut, { r: 1.2 }),
    ...[4.5, 59.5].map(x => B(x, 46, 11.5, 3.5, 74, 2, AQ.walnutD, { r: 0.6 })),
    B(32, 84.5, 0, 63, 3, 31, AQ.walnutD),
    PR(32, 86, 0, [[-30, 0], [30, 0], [26, 2.5], [8, 4], [0, 7], [-8, 4], [-26, 2.5]], 26, AQ.walnut),
    S(32, 91.6, 0, 1.6, 1.6, 1.6, AQ.brass, { m: 'metal', seg: 8 }),
    B(32, 14.5, 12.4, 52, 9, 0.8, AQ.walnutL, { r: 0.5 }), ...bail(20, 14.5, 12.8), ...bail(44, 14.5, 12.8),
  ], {
    doors: [6, 58].map((hx, i) => {
      const x = i ? 45 : 19, hand = i ? 34 : 30;
      return { hinge: [hx, 12], side: i ? -1 : 1, parts: [
        B(x, 50, 12.75, 25.6, 60, 1.5, AQ.walnut, { r: 0.8 }),
        B(x, 58, 13.6, 20, 34, 0.5, AQ.walnutL, { r: 0.6 }),
        B(x, 30, 13.6, 20, 12, 0.5, AQ.walnutL, { r: 0.6 }),
        RD([hand, 46, 14.1], [hand, 54, 14.1], 0.5, AQ.brass, M),
        DS(hand, 43.6, 13.7, 0.9, 0.3, AQ.brass, M),
      ] };
    }),
    inside: { x: 32, h: 50, w: 50, hh: 58, z: 12 },
  }),

  // a walnut dresser on short cabriole legs: brass bails, a marble top, an oval mirror tilting between turned posts
  piece('antqdresser', 'Walnut mirror dresser', 2, 1, 950, 'wood', [
    ...cab(5, 8, 7, -0.5, 1), ...cab(59, 8, 7, 0.5, 1),
    ...[5, 59].map(x => RD([x, 0, -10.5], [x, 7, -9.5], 1.2, AQ.walnut)),
    B(32, 18.5, 0, 60, 23, 24, AQ.walnut, { r: 1.2 }),
    PR(32, 7, 11.5, [[-28, 0], [28, 0], [24, -2], [6, -2.4], [0, -3.6], [-6, -2.4], [-24, -2]], 1, AQ.walnut),
    ...[17.5, 46.5].flatMap(x => [B(x, 26, 12.4, 26, 5.4, 0.8, AQ.walnutL, { r: 0.5 }), ...bail(x, 26, 12.8, 4)]),
    ...[19.5, 12].flatMap((h, i) => [B(32, h, 12.4, 55, i ? 7 : 6, 0.8, AQ.walnutL, { r: 0.5 }), ...bail(18, h, 12.8), ...bail(46, h, 12.8)]),
    B(32, 31, 0, 62, 2, 26, AQ.marble, { m: 'gloss', r: 0.6 }),
    ...[8, 56].map(x => LA(x, 32, -8, [[1.4, 0], [1.7, 2], [1, 4], [1, 26], [1.5, 28], [0, 30]], AQ.walnut, { seg: 10 })),
    ...[[9.2, 17.4], [46.6, 54.8]].map(([a, b]) => RD([a, 50, -8], [b, 50, -8], 0.8, AQ.brass, M)),
    DS(32, 50, -8, 15, 1.6, AQ.walnut, { ry: 12, m: 'wood' }),
    DS(32, 50, -7.1, 13.4, 0.4, AQ.mirror, { ry: 10.6, m: 'gloss' }),
    S(32, 63, -8, 3, 1.8, 1.4, AQ.walnut, { seg: 8, m: 'wood' }),
  ]),

  // a glass curio cabinet on cabriole legs: velvet-lined, an Apricorn ball, a gold egg, a teacup, Old Amber, a fossil
  piece('antqcurio', 'Glass curio cabinet', 1, 1, 980, 'wood', [
    ...cab(4, 8, 10, -0.4, 1), ...cab(28, 8, 10, 0.4, 1),
    ...[4, 28].map(x => RD([x, 0, -9.5], [x, 10, -9], 1.1, AQ.walnut)),
    B(16, 12.5, 0, 30, 5, 22, AQ.walnut),
    ...[[2.8, 9], [29.2, 9], [2.8, -9], [29.2, -9]].map(([x, z]) => B(x, 46, z, 3, 62, 3, AQ.walnut, { r: 0.8 })),
    B(16, 46, -9.6, 24, 62, 1, AQ.greenD, { m: 'cloth', r: 0.3 }),
    ...[32, 49, 64].map(h => B(16, h, -0.5, 24, 0.8, 18, AQ.walnutL, { r: 0.3 })),
    B(16, 78.5, 0, 32, 3, 23, AQ.walnut),
    PR(16, 80, 0, [[-12, 0], [12, 0], [8, 2.5], [0, 6], [-8, 2.5]], 4, AQ.walnut),
    S(16, 87, 0, 1.4, 1.4, 1.4, AQ.brass, { m: 'metal', seg: 8 }),
    S(10, 18.6, -1, 3.4, 3.4, 3.4, AQ.red, { seg: 12 }), DS(10, 18.6, 2.5, 1, 0.5, AQ.lace, PL),
    B(21.5, 16.5, -1, 8, 3, 6, AQ.green, { m: 'cloth', r: 0.05 }), B(21.5, 19.3, -1, 7, 2.6, 5.5, AQ.ox, { m: 'cloth', r: 0.05 }),
    LA(10.5, 32.4, -1, [[1.6, 0], [2.8, 2], [3, 4], [1.6, 7], [1.2, 8], [1.8, 9]], AQ.china, { seg: 12 }),
    C(10.5, 36.4, -1, 3.05, 0.8, AQ.blue, { rb: 2.9 }),
    S(21, 36, -1, 2.6, 3.4, 2.6, AQ.gold, { m: 'metal', seg: 12 }),
    C(11, 49.6, 0, 3.6, 0.4, AQ.china),
    LA(11, 49.8, 0, [[1.2, 0], [2.4, 1], [3, 3.2]], AQ.china, { seg: 12 }),
    DS(21, 52.4, -2, 2.6, 0.8, AQ.brass, M),
    S(12, 67, -1, 2.6, 2.4, 2.4, AQ.amber, { seg: 10 }),
    DS(20.5, 67.6, -2, 3, 1.2, '#b8a888', PL), RG(20.5, 67.6, -1.3, 1.6, 0.4, '#8a7a5a', PL),
    B(16, 46, 10.6, 23.4, 61.6, 0.4, AQ.mirror, { m: 'glass', r: 0.05 }),
    ...[2.8, 29.2].map(x => B(x, 46, 0, 0.4, 61.6, 15, AQ.mirror, { m: 'glass', r: 0.05 })),
    knob(26.5, 46, 10.8, 0.7),
  ]),

  // a tall bookcase of leather-bound books, gilt on their spines, a brass gallery rail along its top
  piece('antqbookcase', "Collector's bookcase", 2, 1, 850, 'wood', [
    ...[[5, -9], [59, -9], [5, 9], [59, 9]].map(([x, z]) => S(x, 1.6, z, 2.2, 1.6, 2.2, AQ.walnutD, { m: 'wood', seg: 8 })),
    B(32, 4.5, 0, 63, 6, 26, AQ.walnutD),
    ...[2.5, 61.5].map(x => B(x, 41, -0.5, 4, 70, 25, AQ.walnut, { r: 0.8 })),
    B(32, 41, -11.5, 56, 70, 1.5, AQ.walnutD),
    ...[8, 25.5, 43, 60].map(h => B(32, h, 0, 56, 1.6, 23, AQ.walnut, { r: 0.5 })),
    B(32, 77, 0, 64, 2.4, 26, AQ.walnutD),
    RD([2, 82, 11], [62, 82, 11], 0.4, AQ.brass, M),
    ...[2, 22, 42, 62].map(x => RD([x, 78.2, 11], [x, 82, 11], 0.35, AQ.brass, M)),
    ...books(8.8, 4.6, 59.4, 1),
    ...books(26.3, 4.6, 59.4, 2, [40, 52]),
    B(46, 27.3, -1, 12, 2, 13, AQ.navy, { m: 'cloth', r: 0.05 }), B(46, 29.3, -1, 11, 2, 12, AQ.ox, { m: 'cloth', r: 0.05 }),
    LA(46, 30.3, -1, [[1.6, 0], [2.6, 2], [2.8, 4], [1.4, 6.5], [1.8, 7.5]], AQ.brass, { m: 'metal', seg: 10 }),
    ...books(43.8, 4.6, 59.4, 3, [12, 22]),
    S(17, 47.2, -1, 3.4, 3.4, 3.4, AQ.parch, { seg: 12 }),
    ...books(60.8, 4.6, 59.4, 4),
  ]),

  // a tall brass floor lamp: a turned column with a little tray, a fringed silk shade
  piece('antqlamp', 'Fringed brass floor lamp', 1, 1, 420, 'metal', [
    LA(16, 0, 0, [[7, 0], [7, 1.2], [5, 2.4], [2.2, 4], [1.4, 6], [0, 6]], AQ.brass, { seg: 16 }),
    LA(16, 5, 0, [[1.4, 0], [1.1, 10], [1.8, 13], [1, 16], [1, 44], [1.6, 46], [1.2, 48]], AQ.brass, { seg: 10 }),
    C(16, 30, 0, 6, 0.8, AQ.brass),
    S(16, 51, 0, 2.4, 2, 2.4, AQ.flame, { m: 'glow', seg: 8 }),
    C(16, 49, 0, 10.2, 2.6, AQ.brassD, { rb: 10.6, m: 'cloth' }),
    LA(16, 50, 0, [[10, 0], [9.6, 1.4], [7.4, 6], [4, 10], [2.4, 11.4], [0, 11.6]], AQ.silk, { m: 'glow', seg: 16 }),
    S(16, 62.2, 0, 1.2, 1.4, 1.2, AQ.brass, { seg: 8 }),
  ], { glow: [AQ.silk, AQ.flame] }),

  // a walnut longcase clock: a brass dial with gilt corners, the pendulum swinging behind its window, an arched bonnet
  piece('antqclock', 'Walnut longcase clock', 1, 1, 1050, 'wood', [
    B(16, 1, 0, 26, 2, 17, AQ.walnutD, { r: 0.5 }),
    B(16, 8, 0, 24, 12, 15, AQ.walnut),
    B(16, 8, 7.7, 18, 8, 0.5, AQ.walnutL, { r: 0.5 }),
    B(16, 14.6, 0, 22, 1.4, 14, AQ.walnutD, { r: 0.5 }),
    B(16, 34, 0, 18, 38, 12, AQ.walnut),
    B(16, 34, 6.25, 14, 34, 0.5, AQ.walnutL, { r: 0.5 }),
    B(16, 38, 6.6, 8.4, 22.4, 0.2, AQ.ink, { m: 'plain', r: 0.05 }),
    RD([16, 48.5, 6.85], [16, 31, 6.85], 0.3, AQ.brass, M),
    DS(16, 30.5, 6.85, 2.6, 0.5, AQ.brass, M),
    B(16, 38, 7.3, 8, 22, 0.3, AQ.mirror, { m: 'glass', r: 0.05 }),
    B(16, 53.6, 0, 22, 1.6, 14, AQ.walnutD, { r: 0.5 }),
    B(16, 64.5, 0, 24, 21, 15, AQ.walnut),
    ...[5.5, 26.5].map(x => LA(x, 54, 7.4, [[1.2, 0], [0.8, 1.5], [0.8, 19.5], [1.2, 21]], AQ.brass, { m: 'metal', seg: 8 })),
    B(16, 65, 7.7, 16, 16, 0.5, AQ.brass, { m: 'metal', r: 0.05 }),
    PC(16, 65, 8.0, 15, 15, (g, x, y, w, h) => dial(g, x, y, w, h)),
    PR(16, 75, 0, [[-12.5, 0], [12.5, 0], [11, 3], [6, 6.5], [0, 7.5], [-6, 6.5], [-11, 3]], 14, AQ.walnut),
    S(16, 84, 0, 1.6, 2.2, 1.6, AQ.brass, { m: 'metal', seg: 8 }),
    ...[4.5, 27.5].map(x => S(x, 76.4, 0, 1.2, 1.6, 1.2, AQ.brass, { m: 'metal', seg: 8 })),
  ]),

  // a three-panel screen: walnut frames arched on top, green velvet in gilt borders, brass rosettes
  piece('antqscreen', 'Three-panel parlour screen', 2, 1, 650, 'wood', [
    ...[[11, 4], [32, -4], [53, 4]].flatMap(([x, z], i) => [
      ...[-8, 8].map(dx => LA(x + dx, 0, z, [[1.6, 0], [1.8, 1.5], [1, 3], [1.4, 6]], AQ.walnut, { seg: 8 })),
      B(x, 36, z, 20.4, 60, 2, AQ.walnut, { r: 0.8 }),
      PR(x, 66, z, [[-10.2, 0], [10.2, 0], [8, 2.6], [0, 4.4], [-8, 2.6]], 2, AQ.walnut),
      B(x, 37, z + 1.05, 17.4, 51.4, 0.3, AQ.gold, { m: 'metal', r: 0.3 }),
      B(x, 37, z + 1.2, 16, 50, 0.4, i === 1 ? AQ.ox : AQ.green, { m: 'cloth', r: 0.4 }),
      DS(x, 52, z + 1.5, 2.6, 0.4, AQ.gold, M), DS(x, 22, z + 1.5, 1.8, 0.4, AQ.gold, M),
    ]),
    ...[21.5, 42.5].flatMap(x => [18, 54].map(h => B(x, h, 0, 1, 3, 8.4, AQ.brass, { m: 'metal', r: 0.3 }))),
  ]),

  // a cheval mirror: a tall walnut frame tilting between turned uprights on sledge feet
  piece('antqmirror', 'Walnut cheval mirror', 1, 1, 580, 'wood', [
    ...[4, 28].flatMap(x => [B(x, 1.5, 0, 3.4, 3, 26, AQ.walnut), ...[-12, 12].map(z => S(x, 1.4, z, 1.6, 1.4, 1.6, AQ.brass, { m: 'metal', seg: 8 }))]),
    ...[4, 28].map(x => LA(x, 3, 0, [[1.8, 0], [2.2, 2], [1.3, 4], [1.6, 8], [1.1, 10], [1.1, 62], [1.6, 64], [1, 66], [0, 67]], AQ.walnut, { seg: 10 })),
    RD([4, 8, 0], [28, 8, 0], 0.9, AQ.walnut),
    B(16, 40, 0, 20, 52, 2.4, AQ.walnut, { r: 1.4 }),
    PR(16, 66, 0, [[-8, 0], [8, 0], [0, 4]], 2.4, AQ.walnut),
    B(16, 40, 1.3, 16.6, 48, 0.4, AQ.mirror, { r: 0.5 }),
    ...[5.2, 26.8].map(x => S(x, 42, 0, 1.4, 1.4, 1.4, AQ.brass, { m: 'metal', seg: 8 })),
  ]),

  // a gramophone on a little walnut stand: the record, its crank, a great brass horn
  piece('antqgramo', 'Brass-horn gramophone', 1, 1, 900, 'wood', [
    ...[[6, -8], [26, -8], [6, 8], [26, 8]].map(([x, z]) => turned(x, 0, z, 10, 1.4)),
    B(16, 4, 0, 22, 1, 18, AQ.walnutL, { r: 0.4 }),
    B(16, 11, 0, 26, 2, 22, AQ.walnut),
    B(16, 18, 0, 22, 12, 20, AQ.mahog),
    B(16, 18, 10.2, 17, 8, 0.5, AQ.mahogL, { r: 0.5 }),
    RD([27, 19, 2], [30, 19, 2], 0.5, AQ.brass, M), RD([30, 19, 2], [30, 15, 4], 0.5, AQ.brass, M), S(30, 15, 4.8, 0.8, 0.8, 0.8, AQ.black, { seg: 6 }),
    C(16, 24.6, 1, 9, 1.2, AQ.walnutD),
    C(16, 25.5, 1, 8.4, 0.6, AQ.black),
    C(16, 25.9, 1, 2.8, 0.2, AQ.ox, PL),
    RD([16, 25, -7.5], [16, 30, -8.5], 1.2, AQ.brass, M), RD([16, 30, -8.5], [16, 47, -11], 1.3, AQ.brass, M),
    RD([16, 26.6, -6.5], [19, 27, 1.5], 0.5, AQ.brass, M), DS(19.5, 26.8, 2.2, 1.8, 1.2, AQ.brass, M),
    HN(16, 47, -11, [[1.4, 0], [1.9, 5], [3.2, 10], [6, 14.5], [10, 17.5], [13, 19]], 1.25, AQ.brass, AQ.brassD, M),
  ]),

  // a parchment globe in a walnut horizon ring and a brass meridian, on a tripod stand
  piece('antqglobe', 'Parchment floor globe', 1, 1, 680, 'wood', [
    ...tripod(16, 8, 12),
    LA(16, 6, 0, [[2.4, 0], [2.8, 2], [1.6, 4], [2, 8], [1.2, 12], [1.6, 16], [1.2, 18]], AQ.walnut, { seg: 10 }),
    RD([16, 24, 0], [4.5, 39.4, 0], 0.9, AQ.walnut), RD([16, 24, 0], [27.5, 39.4, 0], 0.9, AQ.walnut),
    S(16, 40, 0, 10, 10, 10, AQ.parch, { m: 'gloss', seg: 16 }),
    ...[[12, 44, 3.6, 3.2], [19.5, 37, 3, 4.4], [21, 46, 2.6, 2], [10, 35, 2, 2.2]].map(([x, h, rx, ry]) => {
      const dx = x - 16, dh = h - 40, z = Math.sqrt(100 - dx * dx - dh * dh) - 1.3;
      return S(x, h, z, rx, ry, 1.6, AQ.land, { m: 'plain', seg: 8 });
    }),
    ...[[14, 45, 3.4, 3], [20, 36, 2.6, 3]].map(([x, h, rx, ry]) => {
      const dx = x - 16, dh = h - 40, z = -(Math.sqrt(100 - dx * dx - dh * dh) - 1.3);
      return S(x, h, z, rx, ry, 1.6, AQ.land, { m: 'plain', seg: 8 });
    }),
    RG(16, 40, 0, 11, 0.55, AQ.brass, M),
    RG(16, 40, 0, 12.5, 1, AQ.walnut, { flat: true, m: 'wood' }),
    S(16, 51.6, 0, 0.9, 0.9, 0.9, AQ.brass, { m: 'metal', seg: 6 }),
  ]),

  // a steamer trunk: leather over walnut slats, brass corners, a brass lock, travel labels
  piece('antqtrunk', 'Brass-bound steamer trunk', 2, 1, 520, 'cloth', [
    B(32, 11.5, 0, 58, 21, 26, AQ.leather),
    ...[5, 17.5].map(h => B(32, h, 13.2, 58.4, 2.4, 0.8, AQ.walnut, { m: 'wood', r: 0.3 })),
    ...[14, 50].map(x => B(x, 11.5, 13.2, 2.4, 21, 0.8, AQ.walnut, { m: 'wood', r: 0.3 })),
    B(32, 25, 0, 59, 6, 27, AQ.leather, { r: 1.5 }),
    B(32, 25, 13.7, 59.4, 2.2, 0.8, AQ.walnut, { m: 'wood', r: 0.3 }),
    ...[[3.2, 2.8], [60.8, 2.8], [3.2, 20.6], [60.8, 20.6], [3.6, 26], [60.4, 26]].map(([x, h]) => B(x, h, 13.4, 3.6, 3.6, 1, AQ.brass, { m: 'metal', r: 0.3 })),
    B(32, 21, 13.8, 5, 7, 0.8, AQ.brass, { m: 'metal', r: 0.4 }), B(32, 20, 14.3, 0.8, 1.6, 0.2, AQ.ink, { m: 'plain', r: 0.05 }),
    ...[18, 46].map(x => B(x, 22, 13.8, 3, 5, 0.6, AQ.brass, { m: 'metal', r: 0.3 })),
    ...[2.2, 61.8].map(x => RD([x, 17, -4], [x, 17, 4], 0.7, AQ.leatherD)),
    B(24, 11.4, 13.1, 7, 5, 0.3, '#e8c060', { m: 'plain', r: 0.05 }),
    B(40, 9.6, 13.1, 6, 4, 0.3, '#c85040', { m: 'plain', r: 0.05 }),
    DS(56.5, 11.5, 13.15, 2.4, 0.3, '#5a8ac0', PL),
  ]),

  // a bentwood coat stand: turned pole, splayed feet, a bowler on one hook and an oxblood scarf on another
  piece('antqhatstand', 'Bentwood coat stand', 1, 1, 260, 'wood', [
    ...tripod(16, 12, 12),
    LA(16, 2, 0, [[2.2, 0], [2.4, 3], [1.6, 6], [2, 10], [1.3, 13], [1.3, 66], [1.8, 68], [1.4, 70], [1.8, 72], [0, 74]], AQ.walnut, { seg: 10 }),
    ...[30, 150, -30, -150].flatMap(deg => {
      const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), e = [16 + c * 6.5, 71, s * 6.5];
      return [RD([16, 66, 0], e, 0.7, AQ.walnut), S(e[0], e[1], e[2], 1, 1, 1, AQ.brass, { m: 'metal', seg: 6 })];
    }),
    ...[90, 210, 330].flatMap(deg => {
      const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), e = [16 + c * 5, 59, s * 5];
      return [RD([16, 55, 0], e, 0.6, AQ.walnut), S(e[0], e[1], e[2], 0.9, 0.9, 0.9, AQ.brass, { m: 'metal', seg: 6 })];
    }),
    LA(21.6, 71.6, 3.2, [[4.6, 0], [4.6, 0.6], [2.8, 1], [2.9, 4], [2.2, 5.6], [0, 6]], AQ.black, { seg: 12 }),
    B(10.4, 59, 3.6, 3.4, 22, 1.4, AQ.ox, { m: 'cloth', r: 0.6 }),
    B(10.4, 47.4, 3.6, 3.6, 1.4, 1.4, AQ.gold, { m: 'cloth', r: 0.3 }),
  ]),

  // a brass-framed tea trolley: two mahogany trays, a gallery rail, spoked wheels, a china tea set
  piece('antqtrolley', 'Brass tea trolley', 1, 1, 480, 'metal', [
    ...[[4, -10], [28, -10], [4, 10], [28, 10]].flatMap(([x, z]) => [RD([x, 4, z], [x, 26, z], 0.55, AQ.brass), S(x, 26.6, z, 0.9, 0.9, 0.9, AQ.brass, { seg: 6 })]),
    ...[[5, -10.8], [27, -10.8], [5, 10.8], [27, 10.8]].flatMap(([x, z]) => [RG(x, 3.6, z, 3, 0.45, AQ.brassD), DS(x, 3.6, z, 0.9, 0.8, AQ.brass)]),
    ...[[5, 10.8], [27, 10.8]].flatMap(([x, z]) => [RD([x - 2.8, 3.6, z], [x + 2.8, 3.6, z], 0.25, AQ.brassD), RD([x, 0.8, z], [x, 6.4, z], 0.25, AQ.brassD)]),
    B(16, 12, 0, 26, 1.4, 22, AQ.mahog, { m: 'wood', r: 0.5 }),
    B(16, 24, 0, 26, 1.4, 22, AQ.mahog, { m: 'wood', r: 0.5 }),
    ...[-10, 10].map(z => RD([4, 26, z], [28, 26, z], 0.35, AQ.brass)),
    ...[4, 28].map(x => RD([x, 26, -10], [x, 26, 10], 0.35, AQ.brass)),
    RD([28, 26, -8], [31, 30, -8], 0.5, AQ.brass), RD([28, 26, 8], [31, 30, 8], 0.5, AQ.brass), RD([31, 30, -8], [31, 30, 8], 0.6, AQ.walnut, W),
    LA(12, 24.7, 0, [[2.4, 0], [4, 1.5], [4.4, 3.5], [3.6, 5.6], [2, 6.6], [1.4, 6.8]], AQ.china, { m: 'gloss', seg: 12 }),
    C(12, 27.6, 0, 4.45, 1, AQ.blue, { rb: 4.4, m: 'gloss' }),
    S(12, 32, 0, 1.6, 1.2, 1.6, AQ.china, { m: 'gloss', seg: 8 }),
    RD([16, 27.6, 0.6], [19, 30.4, 1.6], 0.7, AQ.china, { m: 'gloss' }),
    RG(7.4, 28.4, 0, 1.8, 0.5, AQ.china, { m: 'gloss' }),
    ...[[21.5, 6], [22, -5]].flatMap(([x, z]) => [C(x, 24.9, z, 3.2, 0.4, AQ.china, { m: 'gloss' }), LA(x, 25.1, z, [[1, 0], [2, 0.8], [2.4, 2.6]], AQ.china, { m: 'gloss', seg: 10 })]),
    C(16, 13.6, 0, 5, 1.8, AQ.china, { m: 'gloss' }),
    LA(16, 14.5, 0, [[1.4, 0], [1.6, 2], [0.8, 3.6], [2.4, 5], [0, 5.2]], AQ.china, { m: 'gloss', seg: 10 }),
  ]),

  // a tufted oxblood footstool on short cabriole legs, its top buttoned
  piece('antqfootstool', 'Tufted velvet footstool', 1, 1, 220, 'wood', [
    ...cab(6, 8, 7, -0.4, 0.4), ...cab(26, 8, 7, 0.4, 0.4), ...cab(6, -8, 7, -0.4, -0.4), ...cab(26, -8, 7, 0.4, -0.4),
    B(16, 8, 0, 26, 3, 20, AQ.walnut),
    B(16, 11, 0, 25, 4.4, 19, AQ.ox, { m: 'cloth', r: 1.8 }),
    ...[[10, -4], [16, -4], [22, -4], [10, 4], [16, 4], [22, 4]].map(([x, z]) => S(x, 13.1, z, 0.6, 0.35, 0.6, AQ.oxD, { m: 'plain', seg: 6 })),
    ...Array.from({ length: 6 }, (_, i) => S(5.5 + i * 4.2, 7.9, 10.2, 0.5, 0.5, 0.35, AQ.brass, { m: 'metal', seg: 6 })),
  ]),

  // a Vienna wall clock: a long walnut case, a brass dial, its pendulum behind glass
  wallPiece('antqwallclock', 'Pendulum wall clock', 1, 600, 'wood', [
    B(16, 58, 2, 18, 44, 4, AQ.walnut),
    PR(16, 80, 2, [[-10, 0], [10, 0], [7, 3], [0, 6], [-7, 3]], 4, AQ.walnut),
    S(16, 86.6, 2, 1.2, 1.4, 1.2, AQ.brass, { m: 'metal', seg: 8 }),
    ...[6.5, 25.5].map(x => S(x, 81, 2, 1, 1.2, 1, AQ.brass, { m: 'metal', seg: 6 })),
    PR(16, 36, 2, [[-9, 0], [9, 0], [4, -3], [0, -5], [-4, -3]], 4, AQ.walnut),
    S(16, 30.6, 2, 1, 1.2, 1, AQ.brass, { m: 'metal', seg: 6 }),
    ...[7.5, 24.5].map(x => LA(x, 38, 4, [[0.9, 0], [0.7, 2], [0.7, 38], [0.9, 40]], AQ.walnutD, { seg: 8 })),
    B(16, 50, 4.15, 12, 24, 0.3, AQ.walnutL, { r: 0.5 }),
    B(16, 50, 4.4, 10, 22, 0.2, AQ.ink, { m: 'plain', r: 0.05 }),
    RD([16, 61, 4.65], [16, 44, 4.65], 0.3, AQ.brass, M),
    DS(16, 43.5, 4.65, 2.6, 0.4, AQ.brass, M),
    B(16, 50, 5.0, 10, 22, 0.3, AQ.mirror, { m: 'glass', r: 0.05 }),
    B(16, 71, 4.2, 14, 14, 0.4, AQ.brass, { m: 'metal', r: 0.05 }),
    PC(16, 71, 4.45, 13, 13, (g, x, y, w, h) => dial(g, x, y, w, h)),
  ]),

  // a landscape at dusk in a gilt frame: hills, a lake, pines, and a Lapras far out on the water
  wallPiece('antqpainting', 'Gilt-framed landscape', 2, 800, 'metal', [
    B(32, 60, 0.6, 50, 30, 1.2, AQ.brassD, { r: 0.3 }),
    PC(32, 60, 1.25, 48, 28, landscape),
    B(32, 76, 1.2, 56, 4, 2.4, AQ.gold), B(32, 44, 1.2, 56, 4, 2.4, AQ.gold),
    B(6, 60, 1.2, 4, 36, 2.4, AQ.gold), B(58, 60, 1.2, 4, 36, 2.4, AQ.gold),
    ...[[5.5, 76.5], [58.5, 76.5], [5.5, 43.5], [58.5, 43.5]].map(([x, h]) => S(x, h, 2.2, 2, 2, 1.2, AQ.gold, { seg: 8 })),
    S(32, 78.6, 2.2, 4, 2.4, 1.2, AQ.gold, { seg: 10 }),
    B(32, 44, 2.6, 8, 1.6, 0.3, sh(AQ.brass, 1), { m: 'plain', r: 0.05 }),
  ]),

  // a brass sconce: an oval back plate, two curling arms, tulip glass shades
  wallPiece('antqsconce', 'Brass wall sconce', 1, 320, 'metal', [
    DS(16, 58, 0.5, 4, 1, AQ.brass, { ry: 7 }),
    ...[-1, 1].flatMap(s => [
      RD([16, 56, 1], [16 + s * 6, 54, 4], 0.6, AQ.brass), RD([16 + s * 6, 54, 4], [16 + s * 8, 58, 5], 0.6, AQ.brass),
      LA(16 + s * 8, 58, 5, [[1, 0], [2, 1], [2.4, 2]], AQ.brass, { seg: 10 }),
      S(16 + s * 8, 61.6, 5, 1.4, 1.8, 1.4, AQ.flame, { m: 'glow', seg: 8 }),
      LA(16 + s * 8, 59.6, 5, [[1.2, 0], [2.6, 2], [3.4, 5], [3.6, 7]], AQ.tulip, { m: 'glow', seg: 12 }),
    ]),
    S(16, 66, 1, 1.2, 1.6, 1, AQ.brass, { seg: 8 }), S(16, 50.2, 1, 1, 1.4, 1, AQ.brass, { seg: 8 }),
  ], { glow: [AQ.tulip, AQ.flame] }),

  // a Persian rug: a navy medallion on madder red, ivory spandrels, a flowered border, fringed ends
  { id: 'antqrug', name: 'Persian parlour rug', group: GROUP, solo: true, w: 3, h: 2, layer: 'rug', price: 750, high: 0.04, side: 'c', flat(w, h) {
    const g = ctx(), RED = '#8a2a28', NAVY = '#24305a', IVORY = '#efe2c2', GOLD = '#d6a84a', TEAL = '#3a6a6a';
    const rect = (x, y, rw, rh, c) => { g.fillStyle = c; g.fillRect(x, y, rw, rh); };
    rect(0, 0, w, h, IVORY);
    for (let y = 1; y < h - 1; y += 1.4) { rect(0, y, 3, 0.6, '#e8dcc0'); rect(w - 3, y, 3, 0.6, '#e8dcc0'); }
    rect(3, 0, w - 6, h, NAVY);
    rect(4.2, 1.2, w - 8.4, h - 2.4, GOLD);
    rect(5, 2, w - 10, h - 4, NAVY);
    for (let i = 0; i < 14; i++) { g.fillStyle = i % 2 ? RED : IVORY; g.beginPath(); g.arc(9 + i * (w - 18) / 13, 3.6, 0.9, 0, TAU); g.fill(); g.beginPath(); g.arc(9 + i * (w - 18) / 13, h - 3.6, 0.9, 0, TAU); g.fill(); }
    for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? IVORY : RED; g.beginPath(); g.arc(6.6, 9 + i * (h - 18) / 7, 0.9, 0, TAU); g.fill(); g.beginPath(); g.arc(w - 6.6, 9 + i * (h - 18) / 7, 0.9, 0, TAU); g.fill(); }
    rect(8.2, 5.2, w - 16.4, h - 10.4, GOLD);
    rect(9, 6, w - 18, h - 12, RED);
    g.fillStyle = IVORY;
    for (const [sx, sy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      const cx = sx ? w - 9 : 9, cy = sy ? h - 6 : 6, dx = sx ? -1 : 1, dy = sy ? -1 : 1;
      g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + dx * 16, cy); g.quadraticCurveTo(cx + dx * 8, cy + dy * 4, cx, cy + dy * 12); g.closePath(); g.fill();
    }
    const cx = w / 2, cy = h / 2, lozenge = (rx, ry, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(cx - rx, cy); g.lineTo(cx, cy - ry); g.lineTo(cx + rx, cy); g.lineTo(cx, cy + ry); g.closePath(); g.fill(); };
    lozenge(24, 18, GOLD); lozenge(22.4, 16.6, NAVY); lozenge(14, 10.4, IVORY); lozenge(12.6, 9.2, RED);
    g.fillStyle = GOLD; g.beginPath(); g.ellipse(cx, cy, 4.4, 3.4, 0, 0, TAU); g.fill();
    g.fillStyle = NAVY; g.beginPath(); g.ellipse(cx, cy, 2, 1.6, 0, 0, TAU); g.fill();
    for (const s of [-1, 1]) { g.fillStyle = TEAL; g.beginPath(); g.ellipse(cx + s * 26.5, cy, 2.4, 1.8, 0, 0, TAU); g.fill(); g.fillStyle = GOLD; g.beginPath(); g.ellipse(cx + s * 26.5, cy, 1, 0.8, 0, 0, TAU); g.fill(); }
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; g.fillStyle = i % 2 ? TEAL : GOLD; g.beginPath(); g.ellipse(cx + Math.cos(a) * 18, cy + Math.sin(a) * 13.4, 1.2, 0.9, a, 0, TAU); g.fill(); }
    g.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = 9; x < w - 9; x += 4) for (let y = 6; y < h - 6; y += 4) if (hash(x, y) < 0.18) g.fillRect(x + 1, y + 1, 1, 1);
  } },
];
