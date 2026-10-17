/* base-furniture-cute.js  -  the Cute set (furniture expansion session e, 2026-10-17): a sweet pastel bedroom like
   Animal Crossing's Cute series. Pink and white lacquer with lilac and mint accents, hearts and bows everywhere, puffy
   rounded cushions, scalloped trims, ribbon bands and little gold heart knobs. All solo, fixed colours.
   An upright piece is a list of parts in painted units (32 a tile), as in js/base-furniture-antique.js: `x` across from
   the left of its front, `h` up from the floor (a wall piece's from the foot of its strip), `z` out to the front from its
   middle (a wall piece's from the wall). They're painted here from any side, and js/base-models-cute.js builds the same
   list as 3D parts (BUILT), so picture and model agree. A heart is a flat outline (`prism`) with a soft bevel in 3D
   (`bev`); `m: 'sheer'` is see-through cloth (the canopy's tent). A `pic` part (a clock's dial) is painted on the front
   only, and the model wears that crop of the painting. The wardrobe's and the fridge's doors swing (`doors`, `inside`).
   The rug is painted from above; its scalloped outline is RUG. */

import { sh, oval, ovalShade, floorShadow, ctx } from './base-paint.js';

export const CU = {
  pink: '#f6a6c1', pinkL: '#fbd0de', pinkD: '#e07ea2', rose: '#ee6f96', white: '#fff8f4', cream: '#fbeee4',
  lilac: '#c8aee8', lilacL: '#e6dafa', mint: '#9fe0c8', mintL: '#d2f3e6', gold: '#f2cc6a', mirror: '#dcebf5',
  ink: '#7a4660', straw: '#f05470', tea: '#d89a6a', glowP: '#ffd6e6', glowW: '#fff2cf', fairy: '#f6b8c8',
};
const GROUP = 'Cute';
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

const M = { m: 'metal' }, CL = { m: 'cloth' }, PL = { m: 'plain' };

/** A heart's outline s across (0.9 s tall), centred on 0, its point down. */
const HEART = (() => {
  const raw = [];
  for (let i = 0; i < 20; i++) { const t = i / 20 * TAU; raw.push([16 * Math.sin(t) ** 3, 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)]); }
  const ys = raw.map(p => p[1]), mid = (Math.max(...ys) + Math.min(...ys)) / 2;
  return raw.map(([x, y]) => [x / 32, (y - mid) / 32]);
})();
/** A heart s across centred at x, h, d thick. */
const HT = (x, h, z, s, d, c, o) => PR(x, h, z, HEART.map(([a, b]) => [a * s, b * s]), d, c, o);
/** A gold heart knob. */
const knob = (x, h, z, s = 2.8) => HT(x, h, z, s, 0.8, CU.gold, M);
/** A bow s across each loop, its knot at x, h. */
const bow = (x, h, z, s, c, d = s * 0.5) => [
  ...[-1, 1].flatMap(k => [
    PR(x, h, z, [[0, 0], [k * 0.5 * s, 0.55 * s], [k * 1.05 * s, 0.62 * s], [k * 1.15 * s, 0.1 * s], [k * 0.9 * s, -0.42 * s], [k * 0.4 * s, -0.3 * s]], d, c),
    PR(x, h, z - d * 0.1, [[k * 0.1 * s, -0.1 * s], [k * 0.65 * s, -1.05 * s], [k * 0.35 * s, -1.2 * s], [k * -0.05 * s, -0.25 * s]], d * 0.8, c),
  ]),
  S(x, h, z + d * 0.15, 0.32 * s, 0.3 * s, d * 0.55, sh(c, -1)),
];
/** A row of n scallop discs r round from x0 to x1. */
const scallops = (x0, x1, h, z, r, c, n) => Array.from({ length: n }, (_, i) => DS(x0 + (x1 - x0) * i / (n - 1), h, z, r, 0.8, c, { m: 'plain', seg: 10 }));
const bun = (x, z, r = 2.2, hh = 1.8) => S(x, hh, z, r, hh, r, CU.gold, { m: 'metal', seg: 8 });
const leg = (x, z, top, r = 1.5) => C(x, top / 2, z, r, top, CU.white, { rb: r * 0.72, seg: 10 });

/* ---------- painting the parts ---------- */

function grad(g, x0, y0, x1, y1, c, m) {
  const l = g.createLinearGradient(x0, y0, x1, y1);
  if (m === 'metal') [[0, sh(c, 2)], [0.25, c], [0.55, sh(c, -1)], [0.8, sh(c, 1)], [1, sh(c, -1)]].forEach(s => l.addColorStop(...s));
  else if (m === 'glow') [[0, sh(c, 2)], [0.5, sh(c, 1)], [1, c]].forEach(s => l.addColorStop(...s));
  else [[0, sh(c, 1)], [0.35, c], [1, sh(c, -1)]].forEach(s => l.addColorStop(...s));
  return l;
}
const seeThrough = (m) => m === 'glass' || m === 'sheer';
function rbx(x, y, w, h, r, c, m) {
  if (w <= 0 || h <= 0) return;
  const g = ctx();
  if (seeThrough(m)) { g.save(); g.globalAlpha *= 0.4; g.fillStyle = m === 'glass' ? '#cfe8f4' : c; g.beginPath(); g.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); g.fill(); g.restore(); return; }
  if (m === 'plain') { g.fillStyle = c; g.beginPath(); g.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); g.fill(); return; }
  g.fillStyle = grad(g, x, y, x + w * 0.3, y + h, c, m); g.beginPath(); g.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); g.fill();
  if (h > 3 && w > 3) { g.save(); g.globalAlpha *= 0.45; g.fillStyle = sh(c, 2); g.fillRect(x + Math.min(r, w / 2) * 0.6, y + 0.3, w - Math.min(r, w / 2) * 1.2, 0.5); g.restore(); }
}
function poly(pts, c, m, horiz) {
  const g = ctx(), xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  if (seeThrough(m)) { g.save(); g.globalAlpha *= 0.38; g.fillStyle = m === 'glass' ? '#cfe8f4' : c; }
  else if (m === 'plain') g.fillStyle = c;
  else if (horiz) {
    const l = g.createLinearGradient(x0, 0, x1, 0);
    l.addColorStop(0, sh(c, -1)); l.addColorStop(0.3, sh(c, 1)); l.addColorStop(0.55, c); l.addColorStop(1, sh(c, -1));
    g.fillStyle = l;
  } else g.fillStyle = grad(g, x0, y0, x1, y1, c, m);
  g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill();
  if (seeThrough(m)) g.restore();
}
function ball(cx, cy, rx, ry, c, m) {
  const g = ctx();
  if (m === 'glow') { const t = g.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry)); t.addColorStop(0, '#ffffff'); t.addColorStop(0.4, sh(c, 1)); t.addColorStop(1, c); g.fillStyle = t; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, TAU); g.fill(); return; }
  if (seeThrough(m)) { g.save(); g.globalAlpha *= 0.4; oval(cx, cy, rx, ry, m === 'glass' ? '#dff0f8' : c); g.restore(); return; }
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
        if (!seeThrough(m)) oval(cx, top, q.r, Math.min(q.r * 0.22, Math.max(0.3, q.hh / 2)), sh(q.c, m === 'glow' ? 2 : 1));
        break;
      }
      case 'ball': ball(cx, cy, side ? q.rz : q.rx, q.ry, q.c, m); break;
      case 'disc': if (side) rbx(cx - q.th / 2, cy - (q.ry ?? q.r), q.th, (q.ry ?? q.r) * 2, q.th / 2, q.c, m); else ball(cx, cy, q.r, q.ry ?? q.r, q.c, m); break;
      case 'lathe': {
        const pts = q.pts.map(([r, up]) => [r, cy - up]);
        poly([...pts.map(([r, y]) => [cx - r, y]), ...pts.slice().reverse().map(([r, y]) => [cx + r, y])], q.c, m, true);
        if (q.pts[q.pts.length - 1][0] < 0.01 && q.pts.length > 2) break;
        const [rt, ut] = q.pts[q.pts.length - 1];
        if (!seeThrough(m)) oval(cx, cy - ut, rt, rt * 0.22, sh(q.c, -1));
        break;
      }
      case 'ring': {
        g.strokeStyle = q.c; g.lineWidth = q.tr * 2; g.beginPath();
        if (q.flat) g.ellipse(cx, cy, q.r, q.r * 0.22, 0, 0, TAU);
        else if (side) { rbx(cx - q.tr, cy - q.r - q.tr, q.tr * 2, (q.r + q.tr) * 2, q.tr, q.c, m); break; }
        else g.arc(cx, cy, q.r, 0, TAU);
        g.stroke();
        break;
      }
      case 'rod': {
        const p0 = [U(q.a[0], q.a[2]), b - q.a[1]], p1 = [U(q.b[0], q.b[2]), b - q.b[1]];
        if (Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) < 0.05) { ball(p0[0], p0[1], q.r, q.r, q.c, m); break; }
        g.lineCap = 'round'; g.strokeStyle = q.c; g.lineWidth = q.r * 2;
        g.beginPath(); g.moveTo(...p0); g.lineTo(...p1); g.stroke();
        if (q.r > 0.6 && m !== 'plain') {
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

/** A little heart path at cx, cy, s across. */
function heartPath(g, cx, cy, s) {
  g.beginPath();
  HEART.forEach(([a, b], i) => (i ? g.lineTo(cx + a * s, cy - b * s) : g.moveTo(cx + a * s, cy - b * s)));
  g.closePath();
}
/** A pastel clock dial on `bg`: a pink face, hearts at the quarters, dots between, plum hands at ten past ten. */
function dial(bg) {
  return (g, x, y, w, h) => {
    const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2;
    g.fillStyle = bg; g.fillRect(x, y, w, h);
    g.fillStyle = CU.white; g.beginPath(); g.arc(cx, cy, r * 0.96, 0, TAU); g.fill();
    g.fillStyle = CU.pinkL; g.beginPath(); g.arc(cx, cy, r * 0.84, 0, TAU); g.fill();
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU - Math.PI / 2, px = cx + Math.cos(a) * r * 0.66, py = cy + Math.sin(a) * r * 0.66;
      if (i % 3 === 0) { g.fillStyle = CU.rose; heartPath(g, px, py, r * 0.26); g.fill(); }
      else { g.fillStyle = CU.lilac; g.beginPath(); g.arc(px, py, r * 0.055, 0, TAU); g.fill(); }
    }
    g.strokeStyle = CU.ink; g.lineCap = 'round';
    for (const [a, len, lw] of [[-150, 0.4, 0.08], [-30, 0.58, 0.055]]) { const t = a * Math.PI / 180; g.lineWidth = r * lw; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(t) * r * len, cy + Math.sin(t) * r * len); g.stroke(); }
    g.fillStyle = CU.gold; g.beginPath(); g.arc(cx, cy, r * 0.08, 0, TAU); g.fill();
  };
}

/* ---------- the kinds ---------- */

/** What js/base-models-cute.js builds for each upright and wall kind: its parts, doors and default material. */
export const BUILT = {};

function piece(id, name, w, h, price, mat, parts, { doors = [], inside, ...rest } = {}) {
  BUILT[id] = { parts, doors, inside, mat };
  const all = [...parts, ...doors.flatMap(d => d.parts)];
  return { id, name, w, h, price, ...rest, draw(x, b, vw, dir) { floorShadow(x, b, vw); paintParts(all, x, b, vw, dir, w * 32); } };
}
function wallPiece(id, name, w, price, mat, parts, rest = {}) {
  BUILT[id] = { parts, doors: [], mat };
  return { id, name, w, h: 1, layer: 'wall', price, ...rest, wall(x) { paintParts(parts, x, 96, w * 32, 0, w * 32); } };
}

/** The rug's outline from above, in painted units of its 96 x 64: an oval with 22 scallops round its edge. */
export const RUG = (() => {
  const pts = [], n = 22, steps = 8;
  for (let i = 0; i < n * steps; i++) {
    const t = i / (n * steps) * TAU, f = 0.93 + 0.07 * Math.sqrt(Math.abs(Math.sin(t * n / 2)));
    pts.push([48 + Math.cos(t) * 47 * f, 32 + Math.sin(t) * 31 * f]);
  }
  return pts;
})();

/** A curve of the garland's string: its height at x across its 64. */
const sag = (x) => 82 - 8 * (1 - ((x - 32) / 29) ** 2);
const HUES = [CU.pink, CU.lilac, CU.mint, CU.rose];

const KINDS = [
  // a heart-headboard bed: a pink heart with a lilac bow, a white frame on gold buns, a scalloped pink quilt
  piece('cutebed', 'Cute heart bed', 2, 2, 1400, 'gloss', [
    ...[[5, -28], [59, -28], [5, 28], [59, 28]].map(([x, z]) => bun(x, z, 2.6, 2)),
    B(32, 8.5, 0, 62, 9, 60, CU.white, { r: 1.5 }),
    B(32, 5.5, 30.25, 60, 1.2, 0.5, CU.rose, PL),
    HT(32, 9, 30.4, 7, 1, CU.rose),
    B(32, 16, 1, 60, 6, 58, CU.white, { m: 'cloth', r: 2 }),
    B(32, 19.8, 7, 61, 3.2, 46, CU.pink, { m: 'cloth', r: 1.5 }),
    ...scallops(4, 60, 17.4, 30.6, 2.2, CU.pinkL, 13),
    B(32, 21.2, -15, 61, 3, 5, CU.white, { m: 'cloth', r: 1.2 }),
    ...[19, 45].map(x => B(x, 24.5, -23, 20, 7, 10, CU.white, { m: 'cloth', r: 3 })),
    HT(32, 26, -17.5, 11, 3.2, CU.rose, { m: 'cloth', bev: 1 }),
    HT(32, 36, -30, 58, 3, CU.pink, { bev: 1 }),
    HT(32, 37, -28.2, 46, 0.6, CU.pinkL, PL),
    ...bow(32, 48, -27.4, 6, CU.lilac),
  ]),

  // a white chair with a pink cushion and a heart for a back, a lilac bow at its dip
  piece('cutechair', 'Cute heart-back chair', 1, 1, 320, 'gloss', [
    ...[[6, -9], [26, -9], [6, 9], [26, 9]].map(([x, z]) => leg(x, z, 13)),
    B(16, 14, 0.5, 24, 3, 21, CU.white),
    B(16, 17, 1, 23, 3.4, 20, CU.pink, { m: 'cloth', r: 1.6 }),
    ...scallops(6, 26, 15, 11.6, 2, CU.pinkL, 5),
    RD([7, 16, -9], [7, 28, -9.5], 1.1, CU.white), RD([25, 16, -9], [25, 28, -9.5], 1.1, CU.white),
    HT(16, 32, -9.5, 26, 2.6, CU.pink, { bev: 0.8 }),
    HT(16, 32.6, -7.8, 20, 0.5, CU.pinkL, PL),
    ...bow(16, 37, -7.4, 3.5, CU.lilac),
  ]),

  // a puffy pink loveseat: a cloud of a back, round arms, heart cushions, a ribbon band on its white base
  piece('cutesofa', 'Cute puffy loveseat', 2, 1, 1100, 'cloth', [
    ...[[6, -11], [58, -11], [6, 11], [58, 11]].map(([x, z]) => bun(x, z, 2.4, 2)),
    B(32, 7.5, 0.5, 60, 8, 28, CU.white, { m: 'gloss', r: 2 }),
    B(32, 7.5, 14.8, 60, 1.4, 0.6, CU.rose, PL),
    HT(32, 7.5, 15.2, 5, 0.8, CU.gold, M),
    ...[19.5, 44.5].map(x => B(x, 14, 3, 25, 6, 23, CU.pink, { r: 3 })),
    B(32, 23, -10, 56, 24, 8, CU.pink, { r: 4 }),
    ...[8, 17.6, 27.2, 36.8, 46.4, 56].map(x => S(x, 34, -10, 5.4, 4, 4.4, CU.pink, { seg: 12 })),
    ...[4.5, 59.5].flatMap(x => [B(x, 15, 1, 8, 17, 27, CU.pink, { r: 4 }), S(x, 23, 1, 4.2, 2.6, 13.5, CU.pinkL, { seg: 12 })]),
    HT(15, 22, -4.5, 11, 3, CU.rose, { bev: 1 }), HT(49, 22, -4.5, 11, 3, CU.lilac, { bev: 1 }),
  ]),

  // a round white pedestal table, a pink cloth with a scalloped skirt and a lace doily
  piece('cutetable', 'Cute scalloped table', 1, 1, 450, 'gloss', [
    LA(16, 0, 0, [[9, 0], [9, 1.2], [6, 2.4], [2.4, 4], [2, 8], [2.8, 12], [1.8, 16], [2.2, 19], [4.5, 21]], CU.white, { seg: 16 }),
    C(16, 22.2, 0, 14.6, 2.4, CU.pink, CL),
    ...Array.from({ length: 12 }, (_, i) => { const a = i / 12 * TAU; return S(16 + Math.cos(a) * 13, 20.6, Math.sin(a) * 13, 2.6, 2, 2.6, i % 2 ? CU.pinkL : CU.white, { m: 'cloth', seg: 8 }); }),
    C(16, 23.55, 0, 7, 0.3, CU.white, PL),
  ]),

  // a white writing desk: a drawer pedestal with heart knobs, a scalloped apron, a little hutch crowned with a heart
  piece('cutedesk', 'Cute ribbon desk', 2, 1, 950, 'gloss', [
    ...[[4, -10], [18, -10], [4, 10], [18, 10]].map(([x, z]) => bun(x, z, 1.6, 1)),
    B(11, 13.5, 0, 18, 23, 26, CU.white),
    ...[19, 10].flatMap(h => [B(11, h, 13.4, 15, 7.5, 0.8, CU.pink, { r: 1 }), knob(11, h, 14.1)]),
    ...[[58, -11], [58, 11]].map(([x, z]) => leg(x, z, 24, 1.6)),
    B(39, 26, 0, 50, 4, 27, CU.white),
    B(41, 26, 13.7, 26, 3, 0.6, CU.pink, { r: 0.8 }), knob(41, 26, 14.3),
    ...scallops(24, 58, 23.6, 13.2, 1.8, CU.pinkL, 8),
    B(32, 29, 0, 64, 2.2, 30, CU.pinkL, { r: 0.8 }),
    B(32, 36, -12.5, 58, 12, 3, CU.white),
    B(32, 41.6, -12.5, 60, 1.2, 4, CU.pink, PL),
    HT(32, 46, -12.5, 12, 2.4, CU.pink, { bev: 0.6 }),
    C(52, 32.5, 4, 2, 5, CU.lilac),
    RD([51.4, 34, 4], [50.6, 39, 3.6], 0.4, CU.mint, PL), RD([52.6, 34, 4], [53.4, 38.4, 4.4], 0.4, CU.rose, PL),
    B(14, 31, 4, 10, 1.6, 7, CU.mint, { m: 'cloth', r: 0.4 }), B(14.5, 32.6, 3.6, 9, 1.6, 6.4, CU.lilacL, { m: 'cloth', r: 0.4 }),
  ]),

  // a tall white wardrobe: a scalloped pink crown with a bow and a gold heart, panelled doors with heart knobs
  piece('cutewardrobe', 'Cute bow wardrobe', 1, 1, 1100, 'gloss', [
    ...[[4, -10], [28, -10], [4, 10], [28, 10]].map(([x, z]) => bun(x, z, 2, 1.5)),
    B(16, 36, -1, 30, 64, 26, CU.white, { r: 1.5 }),
    B(16, 7.2, 12.4, 26, 5.4, 0.8, CU.pink, { r: 1 }), knob(16, 7.2, 13.1),
    B(16, 66.6, 12.2, 30, 1.2, 0.5, CU.rose, PL),
    B(16, 69, 0, 32, 2.6, 29, CU.pink),
    PR(16, 70.3, -1, [[-15, 0], [15, 0], [14, 2.6], [9, 5.5], [3, 7.2], [0, 7.4], [-3, 7.2], [-9, 5.5], [-14, 2.6]], 24, CU.pink),
    ...bow(16, 73.4, 11.6, 4.4, CU.rose),
    HT(16, 80.6, -1, 7, 2, CU.gold, M),
  ], {
    doors: [2, 30].map((hx, i) => {
      const x = i ? 23 : 9, hand = i ? 18 : 14;
      return { hinge: [hx, 12], side: i ? -1 : 1, parts: [
        B(x, 37, 12.75, 13.6, 56, 1.5, CU.white, { r: 0.8 }),
        B(x, 38, 13.6, 10.4, 44, 0.5, CU.pinkL, { r: 1.2 }),
        HT(x, 48, 14, 7, 0.5, CU.pink),
        knob(hand, 36, 14.1, 2.6),
      ] };
    }),
    inside: { x: 16, h: 37, w: 26, hh: 54, z: 12 },
  }),

  // a low white dresser on gold buns: pink, lilac and mint drawers with heart knobs, a scalloped apron
  piece('cutedresser', 'Cute pastel dresser', 2, 1, 850, 'gloss', [
    ...[[5, -10], [59, -10], [5, 10], [59, 10]].map(([x, z]) => bun(x, z, 2.2, 1.8)),
    B(32, 17, 0, 60, 26, 26, CU.white, { r: 1.5 }),
    ...[17.5, 46.5].flatMap(x => [B(x, 25.3, 13.4, 26, 5, 0.8, CU.pink, { r: 1 }), knob(x, 25.3, 14.1)]),
    ...[[18.5, CU.lilacL], [11, CU.mintL]].flatMap(([h, c]) => [B(32, h, 13.4, 55, 6, 0.8, c, { r: 1 }), knob(18, h, 14.1), knob(46, h, 14.1)]),
    ...scallops(6, 58, 5, 13.6, 1.8, CU.pink, 12),
    B(32, 29.3, 13.3, 60, 0.9, 0.5, CU.rose, PL),
    B(32, 31, 0, 62, 2, 28, CU.pinkL, { r: 0.8 }),
  ]),

  // a vanity: a white table on slim legs, a heart mirror with a bow, a perfume bottle, a powder puff and a lipstick
  piece('cutevanity', 'Cute heart vanity', 1, 1, 900, 'gloss', [
    ...[[4, -8], [28, -8], [4, 8], [28, 8]].map(([x, z]) => leg(x, z, 19, 1.4)),
    B(16, 21, 0, 30, 4.4, 20, CU.white),
    B(16, 21, 10.4, 16, 3, 0.6, CU.pink, { r: 0.8 }), knob(16, 21, 11, 2.6),
    ...scallops(4, 28, 18.4, 10.3, 1.6, CU.pinkL, 6),
    B(16, 24, 0, 31, 1.8, 21, CU.pinkL, { r: 0.8 }),
    RD([6, 25, -7], [6, 36, -7], 1, CU.white), RD([26, 25, -7], [26, 36, -7], 1, CU.white),
    HT(16, 42, -7, 28, 2.4, CU.pink, { bev: 0.6 }),
    HT(16, 42.4, -5.6, 22, 0.4, CU.mirror, { m: 'gloss' }),
    ...bow(16, 48, -5.2, 3.6, CU.lilac),
    LA(5, 24.9, 4, [[2, 0], [2.2, 1.5], [2, 4], [0.8, 4.6], [0.8, 5.6]], CU.lilac, { seg: 10 }), S(5, 31.2, 4, 1.2, 1, 1.2, CU.gold, { m: 'metal', seg: 8 }),
    S(25, 26, 4, 2.6, 1.2, 2.6, CU.pinkL, { m: 'cloth', seg: 10 }),
    C(20.5, 26.8, 6, 0.7, 3.8, CU.rose),
  ]),

  // a cloud-shaped white shelf: puffy cloud edges, mint shelves, books, a candy jar, a heart plush, a teacup, a pom-pom
  piece('cuteshelf', 'Cute cloud shelf', 1, 1, 600, 'gloss', [
    ...[[6, -5], [26, -5], [6, 5], [26, 5]].map(([x, z]) => bun(x, z, 1.6, 1)),
    B(16, 3.5, -1, 28, 3, 16, CU.white),
    B(16, 28, -7.5, 26, 46, 3, CU.white, { r: 4 }),
    ...[4, 28].flatMap(x => [12, 24, 36].map(h => S(x, h, -1, 4, 6.5, 8, CU.white, { seg: 12 }))),
    S(8, 48, -2, 7, 6, 7, CU.white, { seg: 12 }), S(16, 52, -2, 8, 7, 7.5, CU.white, { seg: 12 }), S(24, 48, -2, 7, 6, 7, CU.white, { seg: 12 }),
    ...[18, 32].map(h => B(16, h, -1, 24, 1.6, 13, CU.mintL, { r: 0.6 })),
    B(8, 9.5, -1, 2.4, 9, 10, CU.lilac, { m: 'cloth', r: 0.3 }), B(10.6, 9, -1, 2.4, 8, 10, CU.pink, { m: 'cloth', r: 0.3 }), B(13.2, 9.8, -1, 2.4, 9.6, 10, CU.mint, { m: 'cloth', r: 0.3 }),
    ...[[20.8, 7, CU.pink], [23, 6.6, CU.mint], [22, 9.2, CU.lilac], [21, 11.2, CU.gold]].map(([x, h, c]) => S(x, h, 0, 1.4, 1.4, 1.4, c, { seg: 8 })),
    C(22, 9, 0, 3.4, 8, CU.mirror, { m: 'glass' }), C(22, 13.5, 0, 2.6, 1, CU.pink),
    HT(11, 23.6, 0, 9, 3.2, CU.rose, { m: 'cloth', bev: 1 }),
    C(22, 19.1, 0, 3.6, 0.5, CU.white), LA(22, 19.3, 0, [[1.4, 0], [2.6, 1], [3, 3.5]], CU.white, { seg: 12 }),
    S(16, 37, 0, 4, 4, 3.6, CU.pinkL, { m: 'cloth', seg: 12 }),
    ...bow(16, 40.4, 3.2, 2, CU.lilac),
  ]),

  // a gold floor lamp whose shade is a glowing pink heart, a lilac bow at its point
  piece('cutelamp', 'Heart-glow floor lamp', 1, 1, 450, 'metal', [
    LA(16, 0, 0, [[8, 0], [8, 1], [6.5, 2.4], [3, 3.4], [1.4, 4.5]], CU.white, { m: 'gloss', seg: 16 }),
    RD([16, 4, 0], [16, 38, 0], 0.8, CU.gold),
    S(16, 38.5, 0, 1.4, 1, 1.4, CU.gold, { seg: 8 }),
    HT(16, 46, 0, 24, 7, CU.glowP, { m: 'glow', bev: 1.2 }),
    ...bow(16, 37, 4.6, 3.4, CU.lilac, 1.6).map(q => ({ ...q, m: 'gloss' })),
  ], { glow: [CU.glowP] }),

  // a pastel longcase clock: a pink hood with a heart dial, a gold heart for a pendulum, a gold heart on top
  piece('cuteclock', 'Cute ribbon longcase clock', 1, 1, 800, 'gloss', [
    ...[[8, -5], [24, -5], [8, 5], [24, 5]].map(([x, z]) => bun(x, z, 1.8, 1.2)),
    B(16, 7, 0, 22, 10, 15, CU.pink, { r: 1.5 }),
    B(16, 28, 0, 16, 32, 11, CU.white),
    B(16, 28, 5.7, 10, 22, 0.4, CU.lilacL, PL),
    RD([16, 38, 5.95], [16, 22, 5.95], 0.35, CU.gold, M), HT(16, 20.5, 6.1, 6, 0.6, CU.gold, M),
    B(16, 28, 6.5, 10, 22, 0.3, CU.mirror, { m: 'glass', r: 0.2 }),
    B(16, 51, 0, 24, 14, 15, CU.pink, { r: 2 }),
    DS(16, 51, 7.6, 6.6, 0.4, CU.white),
    PC(16, 51, 7.9, 12, 12, dial(CU.pink)),
    PR(16, 58, 0, [[-12, 0], [12, 0], [10, 3], [5, 5], [0, 6], [-5, 5], [-10, 3]], 14, CU.pink),
    HT(16, 67, 0, 7, 2, CU.gold, M),
    ...bow(16, 44, 8.2, 3.4, CU.rose),
  ]),

  // a three-panel screen: white frames with arched, scalloped tops, pink, lilac and mint panels, each with a heart
  piece('cutescreen', 'Cute scalloped screen', 2, 1, 600, 'gloss', [
    ...[[11, 4, CU.pinkL, CU.rose], [32, -4, CU.lilacL, CU.lilac], [53, 4, CU.mintL, CU.mint]].flatMap(([x, z, c, hc]) => [
      bun(x - 7, z, 1.6, 1.5), bun(x + 7, z, 1.6, 1.5),
      PR(x, 3, z, [[-10, 0], [10, 0], [10, 40], [9.2, 44], [6.8, 47.4], [3.4, 49.4], [0, 50], [-3.4, 49.4], [-6.8, 47.4], [-9.2, 44], [-10, 40]], 2, CU.white),
      PR(x, 5.5, z, [[-8, 0], [8, 0], [8, 36], [7.3, 39.4], [5.4, 42.2], [2.7, 43.8], [0, 44.4], [-2.7, 43.8], [-5.4, 42.2], [-7.3, 39.4], [-8, 36]], 2.6, c, PL),
      HT(x, 28, z + 1.6, 9, 0.6, hc, PL),
      ...[-60, -30, 0, 30, 60].map(a => S(x + Math.sin(a * Math.PI / 180) * 10.2, 43 + Math.cos(a * Math.PI / 180) * 10.2, z, 1.5, 1.5, 1.2, CU.white, { seg: 8 })),
    ]),
    ...[21.5, 42.5].flatMap(x => [16, 40].map(h => B(x, h, 0, 1, 3, 8.4, CU.gold, { m: 'metal', r: 0.3 }))),
  ]),

  // a standing heart mirror between white posts, gold finials, a lilac bow
  piece('cutemirror', 'Cute heart stand mirror', 1, 1, 520, 'gloss', [
    ...[5, 27].map(x => B(x, 1.5, 0, 4, 3, 16, CU.white, { r: 1.4 })),
    ...[5, 27].flatMap(x => [RD([x, 3, 0], [x, 40, 0], 1.2, CU.white), S(x, 41, 0, 1.8, 1.8, 1.8, CU.gold, { m: 'metal', seg: 8 })]),
    RD([5, 8, 0], [27, 8, 0], 0.8, CU.white),
    HT(16, 32, 0, 26, 2.6, CU.pink, { bev: 0.6 }),
    HT(16, 32.5, 1.5, 20, 0.4, CU.mirror),
    ...bow(16, 37.4, 1.9, 3.4, CU.lilac),
  ]),

  // a round wall clock in a ring of white scallops, a rose bow on top, a little gold heart below
  wallPiece('cutewallclock', 'Cute bow wall clock', 1, 420, 'gloss', [
    DS(16, 62, 1, 11, 2, CU.pink),
    ...Array.from({ length: 14 }, (_, i) => { const a = i / 14 * TAU; return DS(16 + Math.cos(a) * 11.5, 62 + Math.sin(a) * 11.5, 0.8, 2.6, 1.6, CU.white, { seg: 10 }); }),
    PC(16, 62, 2.15, 15, 15, dial(CU.pink)),
    ...bow(16, 75, 2.8, 4.4, CU.rose),
    RD([16, 50, 1.2], [16, 46.5, 1.2], 0.3, CU.gold, M), HT(16, 44.5, 1.4, 5, 1, CU.gold, M),
  ]),

  // a heart-shaped wall shelf: a white rim, a pink back, a perfume bottle, a strawberry cake and a little heart
  wallPiece('cuteheartshelf', 'Cute heart wall shelf', 1, 380, 'gloss', [
    HT(16, 60, 0.5, 31, 1, CU.white),
    HT(16, 60.4, 1.4, 26, 0.8, CU.pinkL, PL),
    B(16, 55, 4, 22, 1.4, 6, CU.white, { r: 0.6 }),
    LA(9.5, 55.7, 4.5, [[1.6, 0], [1.8, 1.2], [1.6, 3.4], [0.6, 3.9], [0.6, 4.8]], CU.lilac, { seg: 10 }), S(9.5, 61, 4.5, 1, 0.8, 1, CU.gold, { m: 'metal', seg: 8 }),
    C(16, 57.5, 4.5, 2.6, 3.6, CU.pinkL), S(16, 60, 4.5, 1, 1, 1, CU.straw, { seg: 8 }),
    HT(22.5, 58.4, 4.5, 5, 1.2, CU.rose),
    ...bow(16, 66.6, 2.6, 3.2, CU.lilac),
  ]),

  // a heart garland: a white string sagging between two rose bows, pink, lilac, mint and rose hearts hanging from it
  wallPiece('cutegarland', 'Cute heart garland', 2, 260, 'gloss', [
    ...Array.from({ length: 8 }, (_, i) => { const x0 = 4 + i * 7, x1 = x0 + 7; return RD([x0, sag(x0), 1], [x1, sag(x1), 1], 0.35, CU.white, PL); }),
    ...[8, 16, 24, 32, 40, 48, 56].map((x, i) => HT(x, sag(x) - 4.2, 1.2, 7, 1.2, HUES[i % 4])),
    ...bow(5, 82, 1.8, 3, CU.rose), ...bow(59, 82, 1.8, 3, CU.rose),
  ]),

  // a reading nook: a sheer pink tent under a gold crown, drapes tied back with bows and lit with fairy lights, a cushion
  piece('cutecanopy', 'Cute canopy nook', 1, 1, 1200, 'cloth', [
    B(16, 4.5, 1, 26, 9, 24, CU.pink, { r: 4 }),
    HT(16, 13, -5, 10, 3, CU.rose, { bev: 1 }),
    LA(16, 0, 0, [[14.5, 0], [13.5, 10], [10, 38], [5, 70], [3.5, 80]], CU.pinkL, { m: 'sheer', seg: 16 }),
    ...[-1, 1].map(k => PR(16, 0, 11, [[k * 2.5, 81], [k * 0.6, 81], [k * 8, 30], [k * 6, 0], [k * 15, 0], [k * 13, 30]], 1.2, CU.pinkL)),
    ...bow(5.5, 30, 12.4, 2.6, CU.rose, 1.2).map(q => ({ ...q, m: 'gloss' })), ...bow(26.5, 30, 12.4, 2.6, CU.rose, 1.2).map(q => ({ ...q, m: 'gloss' })),
    ...[-1, 1].flatMap(k => [0.15, 0.35, 0.55, 0.75].map(f => S(16 + k * (0.6 + 7.4 * f), 81 - 51 * f, 12, 0.9, 0.9, 0.9, CU.glowW, { m: 'glow', seg: 6 }))),
    ...[-1, 1].flatMap(k => [0.35, 0.75].map(f => S(16 + k * (8 - 2 * f), 30 - 30 * f, 12, 0.9, 0.9, 0.9, CU.glowW, { m: 'glow', seg: 6 }))),
    LA(16, 79.5, 0, [[4.5, 0], [5, 2], [4, 4], [4.4, 5.5]], CU.gold, { m: 'metal', seg: 12 }),
    S(16, 85.4, 0, 4, 2.4, 4, CU.pink, { seg: 12 }),
    HT(16, 90.6, 0, 6, 1.6, CU.gold, M),
  ], { glow: [CU.glowW] }),

  // a tea set on a white tray: a pink teapot with a gold heart knob, two cups of tea on saucers, three macarons
  piece('cuteteaset', 'Cute tea set', 1, 1, 340, 'gloss', [
    B(16, 1.2, 2, 28, 2.4, 20, CU.white, { r: 1 }),
    LA(11, 2.4, -1, [[3, 0], [5.4, 1.5], [6, 4], [5.4, 7], [3.4, 8.6], [2.4, 9]], CU.pinkL, { seg: 16 }),
    LA(11, 11.4, -1, [[2.8, 0], [2.6, 1], [1.2, 1.8], [0, 1.9]], CU.white, { seg: 12 }),
    knob(11, 14.4, -1, 3),
    RD([16.4, 5, -1], [19.6, 10, -1], 0.9, CU.pinkL),
    RG(5, 7, -1, 2.6, 0.7, CU.pinkL),
    HT(11, 6.2, 5.1, 3.4, 0.5, CU.rose, PL),
    ...[[22, -5, CU.mint], [25, 6, CU.lilac]].flatMap(([x, z, c]) => [
      C(x, 2.7, z, 3.6, 0.6, CU.white),
      LA(x, 3, z, [[1.4, 0], [2.4, 0.8], [2.9, 3.6]], c, { seg: 12 }),
      C(x, 6.3, z, 2.6, 0.2, CU.tea, PL),
      RG(x + 3.1, 4.8, z, 1.1, 0.4, c),
    ]),
    ...[[6, 9, CU.pink], [9.4, 9.6, CU.mint], [12.8, 9, CU.lilac]].map(([x, z, c]) => S(x, 3.4, z, 1.6, 1, 1.6, c, { seg: 8 })),
  ], { }),

  // a three-tier cake stand table: white plates rimmed in pink on a gold rod, mini cakes, cupcakes and a strawberry cake
  piece('cutecakestand', 'Cute cake-stand table', 1, 1, 480, 'gloss', [
    LA(16, 0, 0, [[8, 0], [8, 1], [5, 2.2], [2, 3.5], [1.6, 4]], CU.white, { seg: 16 }),
    RD([16, 3, 0], [16, 37, 0], 0.9, CU.gold, M),
    ...[[10, 14], [24, 10.5], [36, 7]].flatMap(([h, r]) => [C(16, h, 0, r, 1.2, CU.white, { seg: 20 }), RG(16, h + 0.5, 0, r, 0.6, CU.pinkL, { flat: true })]),
    ...Array.from({ length: 5 }, (_, i) => { const a = (i / 5 + 0.05) * TAU, x = 16 + Math.cos(a) * 9, z = Math.sin(a) * 9; return [C(x, 13, z, 2.6, 4.6, [CU.pinkL, CU.mintL, CU.lilacL, CU.cream, CU.pinkL][i], { seg: 10 }), S(x, 16, z, 1.2, 1, 1.2, CU.straw, { seg: 8 })]; }).flat(),
    ...Array.from({ length: 4 }, (_, i) => { const a = (i / 4 + 0.125) * TAU, x = 16 + Math.cos(a) * 6, z = Math.sin(a) * 6; return [LA(x, 24.6, z, [[1.8, 0], [2.4, 2.6]], [CU.lilac, CU.mint, CU.pink, CU.lilac][i], { seg: 10 }), S(x, 28, z, 2.6, 1.8, 2.6, i % 2 ? CU.white : CU.pinkL, { m: 'cloth', seg: 8 })]; }).flat(),
    C(16, 39, 0, 4.6, 4.6, CU.pinkL, { seg: 12 }), C(16, 41.4, 0, 4.8, 0.6, CU.white, PL),
    S(16, 42.6, 0, 1.4, 1.4, 1.4, CU.straw, { seg: 8 }),
  ]),

  // a pink music box on gold buns: its lid up on a mirror, a little Clefairy dancing on a gold turntable
  piece('cutemusicbox', 'Cute Clefairy music box', 1, 1, 620, 'gloss', [
    ...[[5, -5], [27, -5], [5, 5], [27, 5]].map(([x, z]) => bun(x, z, 1.6, 1)),
    B(16, 7.5, 0, 26, 11, 16, CU.pink, { r: 1.5 }),
    ...[3.6, 11.6].map(h => B(16, h, 8.1, 26, 1, 0.5, CU.white, PL)),
    knob(16, 7.6, 8.4, 4),
    B(16, 13.2, 0, 24, 0.4, 14, CU.lilacL, PL),
    C(16, 13.9, 1, 4.5, 1.2, CU.gold, M),
    SL(16, 13, -8, 26, [[0, 0], [1.4, 0.4], [-2.6, 16], [-4, 15.6]], CU.pink),
    SL(16, 13, -7.6, 20, [[1.5, 2], [1.9, 2.1], [-1.6, 14.6], [-2, 14.5]], CU.mirror),
    S(16, 18.4, 1, 3.6, 3.6, 3.2, CU.fairy, { seg: 12 }),
    S(16, 23.6, 1, 3.8, 3.4, 3.4, CU.fairy, { seg: 12 }),
    PR(16, 25.6, 1, [[-3.4, 0], [-1.2, 0.6], [-3.6, 4.6]], 1.2, CU.fairy), PR(16, 25.6, 1, [[3.4, 0], [1.2, 0.6], [3.6, 4.6]], 1.2, CU.fairy),
    ...[-2.4, 2.4].map(dx => PR(16 + dx, 28.6, 1.2, [[dx * 0.1, 0], [dx * 0.3, 0.5], [dx * 0.12, 1.6]], 0.8, '#6a4a3a', PL)),
    ...[-1, 1].map(k => S(16 + k * 1.3, 24, 4.3, 0.5, 0.6, 0.3, CU.ink, { m: 'plain', seg: 6 })),
    ...[-1, 1].map(k => PR(16, 18.4, -2.2, [[0, 1], [k * 4.6, 3.6], [k * 3.8, -0.6]], 0.6, CU.white, PL)),
    RD([29, 8, 0], [30.6, 8, 0], 0.5, CU.gold, M), S(30.8, 8, 0, 0.6, 1.8, 1.2, CU.gold, { m: 'metal', seg: 8 }),
  ]),

  // a rounded pastel pink fridge: a gold handle, a white stripe and a rose heart on its door
  piece('cutefridge', 'Cute pastel fridge', 1, 1, 1000, 'gloss', [
    ...[[5, -9], [27, -9], [5, 9], [27, 9]].map(([x, z]) => S(x, 1, z, 1.4, 1, 1.4, CU.white, { seg: 8 })),
    B(16, 31, -1.5, 28, 58, 25, CU.pink, { r: 4 }),
  ], {
    doors: [{ hinge: [2, 11], side: 1, parts: [
      B(16, 31, 11.9, 28, 56, 1.8, CU.pink, { r: 2 }),
      B(16, 44, 12.95, 26, 0.8, 0.4, CU.pinkD, PL),
      B(16, 47, 12.95, 28, 1.6, 0.4, CU.white, PL),
      RD([24.5, 24, 13.6], [24.5, 40, 13.6], 0.9, CU.gold, M),
      ...[25, 39].map(h => RD([24.5, h, 12.8], [24.5, h, 13.6], 0.5, CU.gold, M)),
      HT(16, 53, 13.2, 6, 0.6, CU.rose, PL),
      ...bow(16, 33, 13.2, 3, CU.white, 0.8),
    ] }],
    inside: { x: 16, h: 31, w: 24, hh: 50, z: 11 },
  }),

  // a round pink pouf banded in rose ribbon, a lilac bow on its front
  piece('cutepouf', 'Cute bow pouf', 1, 1, 240, 'cloth', [
    S(16, 8, 0, 12, 8, 12, CU.pink, { seg: 16 }),
    C(16, 8, 0, 12.2, 3, CU.rose, { seg: 20 }),
    S(16, 15.8, 0, 1.6, 0.8, 1.6, CU.lilac, { seg: 8 }),
    ...bow(16, 8.5, 12.6, 3.6, CU.lilac, 1.6),
  ]),

  // a white dollhouse with a scalloped pink roof, glowing windows, a heart window in its gable, a lilac door
  piece('cutedollhouse', 'Cute pastel dollhouse', 2, 1, 1500, 'gloss', [
    B(32, 1.5, 0, 62, 3, 28, CU.mintL, { r: 1 }),
    B(32, 17, -2, 52, 28, 22, CU.white, { r: 1 }),
    B(32, 31, -2, 54, 1.4, 23, CU.pinkL, PL),
    PR(32, 31.6, -2, [[-30, 0], [30, 0], [0, 20]], 24, CU.pink),
    ...[-1, 1].flatMap(k => [0.1, 0.27, 0.44, 0.61, 0.78].map(t => DS(32 + k * 30 * (1 - t), 31.6 + 20 * t - 1.2, 10.4, 1.8, 0.8, CU.white, { m: 'plain', seg: 10 }))),
    B(48, 46, -6, 5, 10, 5, CU.mint, { r: 0.6 }),
    B(32, 10.5, 9.4, 8, 13, 0.8, CU.lilac, { r: 3 }), S(34.6, 10.5, 10, 0.6, 0.6, 0.5, CU.gold, { m: 'metal', seg: 6 }),
    HT(32, 20, 9.5, 4, 0.6, CU.rose, PL),
    ...[[16, 12], [48, 12], [16, 24], [48, 24]].flatMap(([x, h]) => [
      B(x, h, 9.2, 9.6, 8.6, 0.4, CU.pinkL, { r: 0.6 }),
      B(x, h, 9.5, 8, 7, 0.4, CU.glowW, { m: 'glow', r: 0.2 }),
      B(x, h, 9.8, 0.6, 7, 0.2, CU.white, { m: 'plain', r: 0.05 }), B(x, h, 9.8, 8, 0.6, 0.2, CU.white, { m: 'plain', r: 0.05 }),
    ]),
    ...[16, 48].flatMap(x => [B(x, 7, 10.4, 9.6, 1.6, 2, CU.pink, { r: 0.5 }), ...[-3, 0, 3].map((dx, i) => S(x + dx, 8.6, 10.4, 1.2, 1.2, 1.2, [CU.rose, CU.lilac, CU.straw][i], { seg: 6 }))]),
    HT(32, 40, 10.3, 7, 0.6, CU.glowP, { m: 'glow' }),
  ], { glow: [CU.glowW, CU.glowP] }),

  // a white rocking chair: curved runners, a pink cushion, a puffy scalloped back with a lilac bow
  piece('cuterocker', 'Cute bow rocking chair', 1, 1, 560, 'gloss', [
    ...[6, 26].map(x => SL(x, 0, 0, 2, [[-14, 5], [-7, 2.8], [0, 2.2], [7, 2.8], [14, 5], [14, 3.2], [7, 0.7], [0, 0], [-7, 0.7], [-14, 3.2]], CU.white)),
    ...[[6, -8], [26, -8], [6, 8], [26, 8]].map(([x, z]) => RD([x, 2.2, z], [x, 13, z], 1.1, CU.white)),
    B(16, 14, 0.5, 24, 3, 20, CU.white),
    B(16, 17, 1, 23, 3.4, 19, CU.pink, { m: 'cloth', r: 1.6 }),
    ...[6, 26].flatMap(x => [RD([x, 15, -9], [x, 40, -10.5], 1.1, CU.white), S(x, 41.4, -10.5, 1.6, 1.6, 1.6, CU.gold, { m: 'metal', seg: 8 })]),
    B(16, 30, -10, 18, 20, 2.4, CU.pink, { m: 'cloth', r: 3 }),
    ...[10.5, 16, 21.5].map(x => S(x, 40.4, -10, 3, 2.6, 1.6, CU.pinkL, { m: 'cloth', seg: 10 })),
    ...bow(16, 33, -8.4, 4, CU.lilac),
    ...[4.5, 27.5].flatMap(x => [RD([x, 22, -8], [x, 22, 8], 1, CU.white), RD([x, 15, 8], [x, 22, 8], 0.9, CU.white)]),
  ]),

  // a scalloped oval rug: a white frilled edge, pink with a ring of lilac and mint hearts, a big rose heart at its middle
  { id: 'cuterug', name: 'Cute scalloped heart rug', w: 3, h: 2, layer: 'rug', price: 650, high: 0.04, side: 'c', flat(w, h) {
    const g = ctx(), path = (f) => { g.beginPath(); RUG.forEach(([x, y], i) => { const px = 48 + (x - 48) * f, py = 32 + (y - 32) * f; i ? g.lineTo(px, py) : g.moveTo(px, py); }); g.closePath(); };
    g.fillStyle = CU.white; path(1); g.fill();
    g.fillStyle = CU.pinkL; path(0.9); g.fill();
    g.fillStyle = CU.pink; path(0.82); g.fill();
    g.strokeStyle = CU.white; g.lineWidth = 0.8; g.setLineDash([1.6, 1.4]); path(0.86); g.stroke(); g.setLineDash([]);
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU;
      g.fillStyle = [CU.lilac, CU.mint, CU.white][i % 3];
      heartPath(g, 48 + Math.cos(a) * 30, 32 + Math.sin(a) * 18, 6); g.fill();
    }
    g.fillStyle = CU.white; heartPath(g, 48, 32, 26); g.fill();
    g.fillStyle = CU.rose; heartPath(g, 48, 32, 22); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(42, 27, 3.4, 2, -0.5, 0, TAU); g.fill();
    g.fillStyle = CU.gold; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2; g.beginPath(); g.arc(48 + Math.cos(a) * 20, 32 + Math.sin(a) * 11.5, 0.9, 0, TAU); g.fill(); }
  } },
];

export const CUTE_KINDS = KINDS.map(f => ({ group: 'Cute', solo: true, ...f }));
