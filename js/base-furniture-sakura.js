/* base-furniture-sakura.js  -  the Cherry blossom series (furniture expansion session f, 2026-10-17): Animal Crossing's
   cherry-blossom DIY set, a spring room for hanami. Pale cherry wood (a soft reddish-brown), dark twisty twigs wrapped
   round frames, headboards and posts, clusters of five-petal blossoms in pale and deep pinks with white centres, cream
   and blush cushions, washi paper, petals fallen on every top. Pokémon touches: a Cherrim (Sunshine Form) planter, a
   Hoppip and Skiploom mobile, a Cherubi lamp. All solo, fixed colours, and every kind is sold only in Cherry blossom
   season (`holiday: 'sakura'`, js/data/holidays.js). Not the Japanese group's `sakura` (a whole Cherry tree).
   Built as js/base-furniture-elegant.js's set is: an upright piece is a list of parts in painted units (32 a tile), `x`
   across from the left of its front, `h` up from the floor (a wall piece's from the foot of its strip), `z` out to the
   front from its middle (a wall piece's from the wall), painted here from any side and built as the same parts by
   js/base-models-sakura.js (BUILT), so picture and model agree. A `flower` part is a five-petal blossom facing the front,
   its outline flowerPts() in both files, a white centre on it. A `pic` part (the clock's dial, the screen's tree, the
   scroll's branch) is painted on the front only, and the model wears that crop. The wardrobe's doors swing. The rug is
   a hanami picnic mat with a bento, painted from above. */

import { sh, oval, ovalShade, floorShadow, ctx, hash, glass as glassPane } from './base-paint.js';

export const BL = {
  wood: '#c98a72', woodL: '#e2b29b', woodD: '#9c6050', twig: '#5b3b35', twigL: '#77514a',
  pink: '#f8c3d3', pinkL: '#fde3ec', pinkD: '#ee8fae', rose: '#e2729a', white: '#fffafb',
  cream: '#fbf1e3', blush: '#f2cbc4', blushD: '#e0a9a2', washi: '#f8efe0', washiD: '#e6d6bd',
  red: '#d6434f', redD: '#a6323d', gold: '#d9b45a', stone: '#b4aea7', stoneL: '#cdc8c1', stoneD: '#8a847e',
  water: '#8cc6da', leaf: '#86bb63', leafD: '#5c934a', moss: '#7da35a', soil: '#5a4035', ink: '#3a2e33',
  bamboo: '#b8c46c', bambooD: '#8e9a4c', glaze: '#5f7196', mirror: '#d3e4ec', light: '#ffe6c2',
  lamp: '#fbd0dc', lampL: '#fff0f3', mochi: '#f6b4c6', egg: '#f5d66a', cherrim: '#f27fa8', cherrimF: '#fcd6e0',
  cherrimB: '#b8406a', cherubi: '#e2486c', cherubiL: '#ee7088', hoppip: '#f5a3bf', skiploom: '#8fcf6c', sun: '#f6d14a',
};
const GROUP = 'Cherry blossom', HOLIDAY = 'sakura';
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
/** A five-petal blossom facing the front, r across from its middle, `cc` its centre (`cr` of r), `rot` its turn. */
const FL = (x, h, z, r, c, o) => ({ t: 'flower', x, h, z, r, c, cc: BL.white, cr: 0.3, d: Math.max(0.4, r * 0.22), rot: 0, m: 'plain', ...o });

const CL = { m: 'cloth' }, PL = { m: 'plain' }, GL = { m: 'gloss' }, WD = { m: 'wood' }, GW = { m: 'glow' };
const PINKS = [BL.pink, BL.pinkD, BL.pinkL, BL.rose, BL.pink];

/** The blossom's outline about its middle, r across, petal tips notched, in units up (y up). */
export function flowerPts(r, rot = 0) {
  const pts = [];
  for (let i = 0; i < 5; i++) {
    const a = Math.PI / 2 + rot + i * TAU / 5, s = TAU / 20;
    for (const [da, k] of [[-2 * s, 0.4], [-s, 0.96], [0, 0.78], [s, 0.96]]) pts.push([Math.cos(a + da) * r * k, Math.sin(a + da) * r * k]);
  }
  return pts;
}
/** A dark twig through the points, thinning from r0 to r1; knots at its thick bends. */
const twig = (pts, r0, r1 = r0 * 0.55, c = BL.twig) => pts.slice(1).flatMap((p, i) => {
  const r = r0 + (r1 - r0) * i / Math.max(1, pts.length - 2), out = [RD(pts[i], p, r, c, WD)];
  if (i && r >= 1) out.push(S(...pts[i], r, r, r, c, { m: 'wood', seg: 6 }));
  return out;
});
/** n blossoms scattered in a disc rad across about x, h, a little in front of z; seeded, so the same every time. */
const cluster = (x, h, z, rad, n, seed, r = 1.8) => Array.from({ length: n }, (_, i) => {
  const a = hash(i, seed) * TAU, d = Math.sqrt(hash(i, seed, 1)) * rad;
  return FL(x + Math.cos(a) * d, h + Math.sin(a) * d * 0.8, z + hash(i, seed, 2) * 1.2, r * (0.8 + hash(i, seed, 3) * 0.4), PINKS[(i + seed) % PINKS.length], { rot: hash(i, seed, 4) * 1.2 });
});
/** A soft mass of blossom behind the flowers. */
const puff = (x, h, z, rx, ry, rz, c = BL.pinkL) => S(x, h, z, rx, ry, rz, c, { m: 'cloth', seg: 6 });
/** A fallen petal lying flat. */
const petal = (x, h, z, c = BL.pinkD, r = 1) => ({ t: 'petal', x, h, z, r, hh: 0.25, c, m: 'plain' });
/** n petals strewn over a top at h, x0..x1 across and z0..z1 deep. */
const strew = (x0, x1, z0, z1, h, n, seed) => Array.from({ length: n }, (_, i) => petal(x0 + hash(i, seed) * (x1 - x0), h, z0 + hash(i, seed, 1) * (z1 - z0), i % 3 ? BL.pinkD : BL.pink, 0.9 + hash(i, seed, 2) * 0.4));
/** A crest arched over a top, `rise` high. */
const crest = (half, rise) => [[-half, 0], [half, 0], [half * 0.85, rise * 0.45], [half * 0.5, rise * 0.8], [0, rise], [-half * 0.5, rise * 0.8], [-half * 0.85, rise * 0.45]];
/** A bud vase on a top at h, a twig sprig rising from it with blossoms. */
const sprig = (x, h, z, seed, tall = 14) => [
  LA(x, h, z, [[1.6, 0], [2.4, 1.6], [2.4, 3.4], [1.2, 5.6], [0.9, 7], [1.3, 7.6]], BL.cream, { m: 'gloss', seg: 10 }),
  C(x, h + 3, z, 2.45, 1, BL.pinkD, PL),
  ...twig([[x, h + 7, z], [x - 1.5, h + tall * 0.6, z], [x - 3.5, h + tall, z + 0.4]], 0.5, 0.3),
  ...twig([[x - 0.8, h + tall * 0.45, z], [x + 3, h + tall * 0.75, z + 0.4]], 0.4, 0.25),
  ...cluster(x - 1.5, h + tall * 0.82, z + 0.8, 3.2, 5, seed, 1.4),
];

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
  if (m === 'plain') g.fillStyle = c;
  else if (horiz) {
    const l = g.createLinearGradient(x0, 0, x1, 0);
    l.addColorStop(0, sh(c, -1)); l.addColorStop(0.3, sh(c, 1)); l.addColorStop(0.55, c); l.addColorStop(1, sh(c, -2));
    g.fillStyle = l;
  } else g.fillStyle = grad(g, x0, y0, x1, y1, c, m);
  g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill();
}
function ball(cx, cy, rx, ry, c, m) {
  const g = ctx();
  if (m === 'glow') { const t = g.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry)); t.addColorStop(0, '#ffffff'); t.addColorStop(0.45, sh(c, 1)); t.addColorStop(1, c); g.fillStyle = t; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, TAU); g.fill(); return; }
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
    const m = q.m || 'wood', cx = U(q.x, q.z), cy = b - q.h;
    switch (q.t) {
      case 'box': { const w = side ? q.d : q.w; rbx(cx - w / 2, cy - q.hh / 2, w, q.hh, q.r, q.c, m); break; }
      case 'cyl': case 'petal': {
        const rb = q.rb ?? q.r, top = cy - q.hh / 2, bot = cy + q.hh / 2;
        poly([[cx - q.r, top], [cx + q.r, top], [cx + rb, bot], [cx - rb, bot]], q.c, m, m !== 'glow' && m !== 'plain');
        oval(cx, top, q.r, Math.min(q.r * 0.22, Math.max(0.3, q.hh / 2)), sh(q.c, m === 'glow' ? 2 : 1));
        break;
      }
      case 'ball': ball(cx, cy, side ? q.rz : q.rx, q.ry, q.c, m); break;
      case 'disc': if (side) rbx(cx - q.th / 2, cy - (q.ry ?? q.r), q.th, (q.ry ?? q.r) * 2, q.th / 2, q.c, m); else ball(cx, cy, q.r, q.ry ?? q.r, q.c, m); break;
      case 'lathe': {
        const pts = q.pts.map(([r, up]) => [r, cy - up]);
        poly([...pts.map(([r, y]) => [cx - r, y]), ...pts.slice().reverse().map(([r, y]) => [cx + r, y])], q.c, m, m !== 'plain');
        if (q.pts[q.pts.length - 1][0] < 0.01 && q.pts.length > 2) break;
        const [rt, ut] = q.pts[q.pts.length - 1];
        oval(cx, cy - ut, rt, rt * 0.22, sh(q.c, -2));
        break;
      }
      case 'ring': {
        const ry = q.ry ?? q.r;
        if (side && !q.flat) { if (q.arc) break; rbx(cx - q.tr, cy - ry - q.tr, q.tr * 2, (ry + q.tr) * 2, q.tr, q.c, m); break; }
        const a0 = q.arc ? -(q.a0 + q.arc) : 0, a1 = q.arc ? -q.a0 : TAU;
        const path = (dy = 0) => { g.beginPath(); if (q.flat) g.ellipse(cx, cy + dy, q.r, q.r * 0.22, 0, 0, TAU); else g.ellipse(cx, cy + dy, q.r, ry, 0, a0, a1); };
        g.strokeStyle = q.c; g.lineWidth = q.tr * 2; path(); g.stroke();
        g.save(); g.globalAlpha *= 0.4; g.strokeStyle = sh(q.c, 2); g.lineWidth = q.tr * 0.6; path(-q.tr * 0.4); g.stroke(); g.restore();
        break;
      }
      case 'rod': {
        const p0 = [U(q.a[0], q.a[2]), b - q.a[1]], p1 = [U(q.b[0], q.b[2]), b - q.b[1]];
        if (Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) < 0.05) { ball(p0[0], p0[1], q.r, q.r, q.c, m); break; }
        g.lineCap = 'round'; g.strokeStyle = q.c; g.lineWidth = q.r * 2;
        g.beginPath(); g.moveTo(...p0); g.lineTo(...p1); g.stroke();
        if (q.r > 0.6 && m !== 'plain') {
          g.save(); g.globalAlpha *= 0.45; g.strokeStyle = sh(q.c, 2); g.lineWidth = q.r * 0.6;
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
      case 'flower': {
        if (side) { rbx(cx - q.d / 2, cy - q.r * 0.9, q.d, q.r * 1.8, q.d / 2, q.c, 'plain'); break; }
        poly(flowerPts(q.r, q.rot).map(([px, py]) => [cx + px, cy - py]), q.c, m === 'glow' ? 'glow' : 'plain');
        if (m !== 'glow') { g.save(); g.globalAlpha *= 0.35; oval(cx, cy, q.r * 0.62, q.r * 0.62, sh(q.c, -1)); g.restore(); }
        oval(cx, cy, q.r * q.cr, q.r * q.cr, q.cc);
        if (q.cr < 0.4) { g.fillStyle = BL.rose; for (let i = 0; i < 5; i++) { const a = Math.PI / 2 + q.rot + i * TAU / 5; g.beginPath(); g.arc(cx + Math.cos(a) * q.r * 0.2, cy - Math.sin(a) * q.r * 0.2, Math.max(0.15, q.r * 0.06), 0, TAU); g.fill(); } }
        break;
      }
      case 'pic': g.save(); g.beginPath(); g.rect(cx - q.w / 2, cy - q.hh / 2, q.w, q.hh); g.clip(); q.fn(g, cx - q.w / 2, cy - q.hh / 2, q.w, q.hh); g.restore(); break;
    }
  }
}

/* ---------- pictures ---------- */

/** A painted five-petal blossom on a picture, r across. */
function bloomAt(g, cx, cy, r, c, rot = 0) {
  g.fillStyle = c; g.beginPath();
  flowerPts(r, rot).forEach(([px, py], i) => (i ? g.lineTo(cx + px, cy - py) : g.moveTo(cx + px, cy - py))); g.closePath(); g.fill();
  g.fillStyle = BL.white; g.beginPath(); g.arc(cx, cy, r * 0.28, 0, TAU); g.fill();
}
/** A painted twig through the points, thinning. */
function inkTwig(g, pts, w0, w1, c = BL.twig) {
  g.strokeStyle = c; g.lineCap = 'round'; g.lineJoin = 'round';
  for (let i = 1; i < pts.length; i++) { g.lineWidth = w0 + (w1 - w0) * (i - 1) / Math.max(1, pts.length - 2); g.beginPath(); g.moveTo(...pts[i - 1]); g.lineTo(...pts[i]); g.stroke(); }
}
/** Petals drifting over a picture. */
function drift(g, x, y, w, h, n, seed, c = BL.pinkD) {
  g.fillStyle = c;
  for (let i = 0; i < n; i++) { g.beginPath(); g.ellipse(x + hash(i, seed) * w, y + hash(i, seed, 1) * h, Math.max(0.3, w * 0.018), Math.max(0.2, w * 0.011), hash(i, seed, 2) * TAU, 0, TAU); g.fill(); }
}

/** The clock's face: washi paper in a cherry rim, a blossom at each hour, hands at ten past ten. */
function dial(g, x, y, w, h) {
  const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2;
  g.fillStyle = BL.wood; g.fillRect(x, y, w, h);
  g.fillStyle = BL.washi; g.beginPath(); g.arc(cx, cy, r * 0.98, 0, TAU); g.fill();
  g.strokeStyle = BL.woodD; g.lineWidth = r * 0.05; g.beginPath(); g.arc(cx, cy, r * 0.84, 0, TAU); g.stroke();
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU - Math.PI / 2; bloomAt(g, cx + Math.cos(a) * r * 0.68, cy + Math.sin(a) * r * 0.68, r * (i % 3 ? 0.08 : 0.13), i % 3 ? BL.pink : BL.pinkD, a); }
  g.strokeStyle = BL.ink; g.lineCap = 'round';
  for (const [a, len, lw] of [[-150, 0.36, 0.08], [-30, 0.52, 0.05]]) { const t = a * Math.PI / 180; g.lineWidth = r * lw; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(t) * r * len, cy + Math.sin(t) * r * len); g.stroke(); }
  bloomAt(g, cx, cy, r * 0.1, BL.rose);
}
/** The folding screen's blossom tree across its three panels (panel i of them): mist, a gnarled trunk, clouds of bloom. */
function treePanel(i) {
  return (g, x, y, w, h) => {
    const X = x - i * w, Wt = w * 3, px = (f) => X + f * Wt, py = (f) => y + f * h;
    const bg = g.createLinearGradient(0, y, 0, y + h); bg.addColorStop(0, '#fbf3e6'); bg.addColorStop(0.75, BL.washi); bg.addColorStop(1, '#efe0c8');
    g.fillStyle = bg; g.fillRect(x, y, w, h);
    g.fillStyle = 'rgba(217,180,90,0.22)'; for (const [fx, fy, r] of [[0.15, 0.25, 0.1], [0.8, 0.2, 0.12], [0.55, 0.5, 0.08]]) { g.beginPath(); g.ellipse(px(fx), py(fy), Wt * r, h * r * 0.5, 0, 0, TAU); g.fill(); }
    g.fillStyle = '#d9e6c4'; g.beginPath(); g.moveTo(px(0), py(1)); g.quadraticCurveTo(px(0.35), py(0.84), px(0.7), py(0.93)); g.quadraticCurveTo(px(0.9), py(0.88), px(1), py(0.9)); g.lineTo(px(1), py(1)); g.fill();
    inkTwig(g, [[px(0.3), py(1)], [px(0.33), py(0.78)], [px(0.28), py(0.6)], [px(0.36), py(0.42)], [px(0.5), py(0.3)], [px(0.7), py(0.24)], [px(0.92), py(0.3)]], Wt * 0.03, Wt * 0.006);
    inkTwig(g, [[px(0.28), py(0.6)], [px(0.16), py(0.45)], [px(0.06), py(0.42)]], Wt * 0.014, Wt * 0.005);
    inkTwig(g, [[px(0.36), py(0.42)], [px(0.4), py(0.22)], [px(0.34), py(0.1)]], Wt * 0.012, Wt * 0.004);
    inkTwig(g, [[px(0.7), py(0.24)], [px(0.78), py(0.45)], [px(0.86), py(0.55)]], Wt * 0.01, Wt * 0.004);
    for (const [fx, fy, rx, ry, seed] of [[0.12, 0.42, 0.09, 0.12, 1], [0.37, 0.16, 0.1, 0.12, 2], [0.5, 0.3, 0.1, 0.1, 3], [0.72, 0.22, 0.12, 0.12, 4], [0.9, 0.3, 0.08, 0.1, 5], [0.82, 0.5, 0.07, 0.09, 6]]) {
      g.fillStyle = 'rgba(248,195,211,0.75)'; g.beginPath(); g.ellipse(px(fx), py(fy), Wt * rx, h * ry, 0, 0, TAU); g.fill();
      for (let k = 0; k < 14; k++) {
        const a = hash(k, seed) * TAU, d = Math.sqrt(hash(k, seed, 1));
        bloomAt(g, px(fx) + Math.cos(a) * d * Wt * rx, py(fy) + Math.sin(a) * d * h * ry, Wt * (0.009 + hash(k, seed, 2) * 0.006), PINKS[k % 5], a);
      }
    }
    drift(g, x, y, w, h, 14, 30 + i);
    if (i === 2) { g.fillStyle = BL.red; g.fillRect(x + w * 0.78, y + h * 0.82, w * 0.1, w * 0.1); }
  };
}
/** The hanging scroll's picture: a branch reaching down from the top corner, blossoms, falling petals, a red seal. */
function scrollArt(g, x, y, w, h) {
  g.fillStyle = BL.washi; g.fillRect(x, y, w, h);
  g.fillStyle = 'rgba(230,214,189,0.5)'; g.fillRect(x, y + h * 0.85, w, h * 0.15);
  inkTwig(g, [[x + w * 1.05, y + h * 0.04], [x + w * 0.7, y + h * 0.16], [x + w * 0.5, y + h * 0.3], [x + w * 0.38, y + h * 0.48], [x + w * 0.24, y + h * 0.56]], w * 0.08, w * 0.025);
  inkTwig(g, [[x + w * 0.5, y + h * 0.3], [x + w * 0.26, y + h * 0.26], [x + w * 0.12, y + h * 0.3]], w * 0.04, w * 0.015);
  inkTwig(g, [[x + w * 0.62, y + h * 0.2], [x + w * 0.72, y + h * 0.36]], w * 0.035, w * 0.015);
  for (const [fx, fy, s] of [[0.66, 0.15, 1], [0.48, 0.28, 1.1], [0.3, 0.26, 0.9], [0.14, 0.31, 0.8], [0.4, 0.45, 1], [0.27, 0.55, 0.9], [0.72, 0.36, 0.8], [0.56, 0.22, 0.7], [0.2, 0.22, 0.6], [0.34, 0.37, 0.7]]) bloomAt(g, x + w * fx, y + h * fy, w * 0.07 * s, PINKS[Math.round(fx * 10) % 5], fx * 3);
  drift(g, x + w * 0.1, y + h * 0.55, w * 0.8, h * 0.3, 8, 7);
  g.fillStyle = BL.red; g.fillRect(x + w * 0.72, y + h * 0.8, w * 0.14, w * 0.14);
}

/* ---------- the kinds ---------- */

/** What js/base-models-sakura.js builds for each upright and wall kind: its parts, doors and default material. */
export const BUILT = {};

function piece(id, name, w, h, price, mat, parts, { doors = [], inside, ...rest } = {}) {
  BUILT[id] = { parts, doors, inside, mat };
  const all = [...parts, ...doors.flatMap(d => d.parts)];
  return { id, name, group: GROUP, holiday: HOLIDAY, solo: true, w, h, price, ...rest, draw(x, b, vw, dir) { floorShadow(x, b, vw); paintParts(all, x, b, vw, dir, w * 32); } };
}
function wallPiece(id, name, w, price, mat, parts, rest = {}) {
  BUILT[id] = { parts, doors: [], mat };
  return { id, name, group: GROUP, holiday: HOLIDAY, solo: true, w, h: 1, layer: 'wall', price, ...rest, wall(x) { paintParts(parts, x, 96, w * 32, 0, w * 32); } };
}

const POST = [[2.4, 0], [2.4, 3], [1.7, 5], [1.7, 77], [2.3, 79], [1.6, 81], [0, 82]];
const HEADB = [[-28, 0], [28, 0], [28, 26], [24, 32], [16, 36], [8, 38], [0, 39], [-8, 38], [-16, 36], [-24, 32], [-28, 26]];
const ARC = (cx, ch, r, n, from = 0.08, to = 0.92) => Array.from({ length: n }, (_, i) => { const a = Math.PI * (from + (to - from) * i / (n - 1)); return [cx + Math.cos(a) * r, ch + Math.sin(a) * r]; });

export const SAKURA_KINDS = [
  // a canopy bed: four cherry posts, a roof of blossom, a branch wrapped over the arched headboard, petals on the quilt
  piece('blsmbed', 'Cherry blossom bed', 2, 2, 1500, 'wood', [
    ...[[4, -28], [60, -28], [4, 28], [60, 28]].map(([x, z]) => LA(x, 0, z, POST, BL.wood, { seg: 8 })),
    B(32, 78, -28, 58, 2.4, 2.4, BL.wood), B(32, 78, 28, 58, 2.4, 2.4, BL.wood), B(4, 78, 0, 2.4, 2.4, 54, BL.wood), B(60, 78, 0, 2.4, 2.4, 54, BL.wood),
    ...[[12, -18], [32, -20], [52, -18], [14, 2], [32, 0], [50, 2], [20, 20], [44, 20]].map(([x, z], i) => puff(x, 84 + (i % 3) * 1.2, z, 11, 5.5, 11, i % 2 ? BL.pink : BL.pinkL)),
    ...twig([[2, 79, 30], [14, 85, 29.5], [26, 82, 30], [40, 87, 29.5], [52, 83, 30], [62, 79, 29.5]], 1.2, 0.7),
    ...twig([[4, 79, 29], [3.5, 70, 30.2], [6, 63, 30.4]], 0.8, 0.5),
    ...twig([[60, 79, 29], [61, 69, 30.2], [58, 62, 30.4]], 0.8, 0.5),
    ...cluster(14, 85, 30.4, 6, 5, 1, 2), ...cluster(32, 86, 30.4, 7, 6, 2, 2), ...cluster(50, 85, 30.4, 6, 5, 3, 2),
    ...cluster(6, 65, 31, 3, 3, 4, 1.5), ...cluster(58, 64, 31, 3, 3, 5, 1.5),
    PR(32, 8, -29, HEADB, 3, BL.wood),
    PR(32, 12, -27.4, HEADB.map(([x, h]) => [x * 0.84, h * 0.8]), 0.6, BL.woodL),
    ...twig([[6, 34, -26.6], [14, 40, -26.6], [24, 42.5, -26.6], [34, 45, -26.6], [44, 42, -26.6], [56, 36, -26.6]], 1, 0.6),
    ...cluster(14, 41, -26.2, 4, 3, 6, 1.8), ...cluster(34, 45, -26.2, 5, 4, 7, 1.9), ...cluster(52, 38, -26.2, 4, 3, 8, 1.8),
    B(32, 9, 0, 58, 6, 56, BL.wood),
    B(32, 15.5, 0, 55, 7, 54, BL.cream, CL),
    B(32, 20.4, 6, 56.4, 2.6, 44, BL.blush, CL), B(32, 20.6, -17, 56.4, 2.8, 6, BL.cream, CL),
    ...strew(8, 56, -8, 26, 21.8, 12, 9),
    ...[20, 44].map(x => S(x, 23.2, -22, 9, 3.2, 4.6, BL.cream, CL)), S(32, 23, -16, 5, 2.8, 2.2, BL.pink, CL),
    B(32, 11, 29, 56, 14, 3, BL.wood), PR(32, 18, 29, crest(28, 3.5), 3, BL.wood),
    ...twig([[8, 16, 30.8], [18, 20, 30.8], [30, 18, 30.8], [42, 21, 30.8], [56, 16, 30.8]], 0.6, 0.4),
    ...cluster(18, 19.5, 31, 3, 3, 10, 1.4), ...cluster(42, 20.5, 31, 3, 3, 11, 1.4),
  ]),

  // a side chair: cherry legs, a blush cushion, a washi back panel with a blossom branch across it, an arched top rail
  piece('blsmchair', 'Cherry blossom chair', 1, 1, 360, 'wood', [
    ...[[7, -9], [25, -9], [7, 9], [25, 9]].map(([x, z]) => B(x, 7.5, z, 2.4, 15, 2.4, BL.wood, { r: 0.8 })),
    B(16, 5, 9, 18, 1.4, 1.4, BL.wood, { r: 0.5 }), B(16, 5, -9, 18, 1.4, 1.4, BL.wood, { r: 0.5 }),
    B(16, 15.5, 0, 25, 3, 21, BL.wood),
    B(16, 18.2, 1, 22.5, 2.6, 18.5, BL.blush, { m: 'cloth', r: 1.2 }),
    FL(16, 18.2, 10.4, 1.4, BL.pinkD),
    ...[6, 26].map(x => B(x, 28.5, -9.5, 2.6, 27, 2.6, BL.wood, { r: 0.8 })),
    PR(16, 39, -9.5, crest(11.5, 3.5), 2.6, BL.wood),
    B(16, 37.6, -9.5, 23, 2.6, 2.6, BL.wood, { r: 0.6 }),
    B(16, 27.5, -9.6, 17.6, 15, 1, BL.washi, PL), B(16, 19.6, -9.5, 18, 1.6, 2, BL.wood, { r: 0.5 }),
    ...twig([[6.5, 22, -8.6], [11, 26, -8.6], [16, 25, -8.6], [21, 30, -8.6], [25.5, 35, -8.6]], 0.7, 0.4),
    ...cluster(11, 27, -8.3, 3, 3, 12, 1.5), ...cluster(21, 31, -8.3, 3.5, 4, 13, 1.6),
  ]),

  // a sofa: a cherry frame, cream cushions and a blush back, a carved branch blooming along its top, petal pillows
  piece('blsmsofa', 'Cherry blossom sofa', 2, 1, 1250, 'wood', [
    ...[[6, -10], [58, -10], [6, 10], [58, 10]].map(([x, z]) => C(x, 2, z, 1.8, 4, BL.woodD, { rb: 1.3 })),
    B(32, 8, 1, 60, 8, 26, BL.wood),
    B(20.5, 14, 3, 25, 4.4, 21, BL.cream, { m: 'cloth', r: 1.6 }), B(43.5, 14, 3, 25, 4.4, 21, BL.cream, { m: 'cloth', r: 1.6 }),
    B(32, 21, -10.5, 58, 26, 5, BL.wood, { r: 1.6 }), PR(32, 34, -10.5, crest(29, 3), 5, BL.wood),
    B(32, 23, -7.2, 50, 14, 2.6, BL.blush, { m: 'cloth', r: 1.4 }),
    ...[4, 60].flatMap(x => [B(x, 14, 1, 6, 14, 26, BL.wood, { r: 1.6 }), B(x, 21.6, 1, 6.6, 1.8, 24, BL.cream, { m: 'cloth', r: 0.8 })]),
    ...[[13, -3], [51, -3]].flatMap(([x, z]) => [S(x, 20.5, z, 5.2, 5, 2.2, BL.pinkL, CL), FL(x, 20.5, z + 2, 2.2, BL.pinkD)]),
    ...twig([[3, 33, -7.6], [14, 36.5, -7.6], [26, 34.5, -7.6], [38, 37.5, -7.6], [50, 34.5, -7.6], [61, 32, -7.6]], 0.8, 0.5),
    ...cluster(14, 36, -7.2, 3.5, 4, 14, 1.6), ...cluster(32, 36, -7.2, 4, 5, 15, 1.7), ...cluster(50, 35, -7.2, 3.5, 4, 16, 1.6),
  ]),

  // a dining table: a cherry top on tapered legs, a pink runner strewn with petals, a vase of blossom, two teacups
  piece('blsmtable', 'Cherry blossom table', 2, 1, 680, 'wood', [
    ...[[5, -11], [59, -11], [5, 11], [59, 11]].map(([x, z]) => C(x, 12.5, z, 1.6, 25, BL.wood, { rb: 1.1, seg: 8 })),
    B(32, 23.5, 0, 56, 4, 24, BL.wood),
    B(32, 27, 0, 63, 2.4, 29, BL.wood, { r: 0.8 }),
    B(32, 28.4, 0, 14, 0.4, 29.4, BL.pinkL, { m: 'cloth', r: 0.1 }), B(32, 26.6, 14.8, 14, 3.4, 0.4, BL.pinkL, { m: 'cloth', r: 0.1 }),
    ...strew(26, 38, -12, 12, 28.7, 6, 17), ...strew(8, 56, -10, 10, 28.3, 5, 18),
    ...sprig(32, 28.6, -3, 19, 18),
    ...[[13, 4], [51, 4]].flatMap(([x, z]) => [C(x, 28.6, z, 3.4, 0.5, BL.white, GL), C(x, 30.2, z, 2, 2.8, BL.cream, { rb: 1.5, m: 'gloss' }), FL(x, 30.2, z + 2, 0.8, BL.pinkD)]),
  ]),

  // a writing desk: a drawer pedestal, a gallery carved with a blossom branch, washi paper, an ink stone and a sprig
  piece('blsmdesk', 'Cherry blossom desk', 2, 1, 1100, 'wood', [
    B(50, 13, 0, 22, 26, 26, BL.wood),
    ...[19.5, 8].flatMap(h => [B(50, h, 13.2, 18.6, 9.4, 0.8, BL.woodL, { r: 0.5 }), FL(50, h, 13.9, 1.4, BL.pinkD)]),
    ...[[6, -10], [6, 10]].map(([x, z]) => B(x, 13, z, 2.6, 26, 2.6, BL.wood, { r: 0.8 })),
    B(23, 23.6, 0, 30, 4, 24, BL.wood), B(23, 23.6, 12.3, 24, 2.8, 0.6, BL.woodL, { r: 0.4 }), FL(23, 23.6, 12.9, 1.2, BL.pinkD),
    B(32, 27.4, 0, 64, 2.6, 28, BL.wood, { r: 0.8 }),
    B(32, 32.6, -12.4, 60, 8, 2.4, BL.wood, { r: 0.8 }), PR(32, 36.4, -12.4, crest(30, 2.4), 2.4, BL.wood),
    ...twig([[4, 30.5, -11], [14, 34, -11], [26, 32.5, -11], [38, 35, -11], [50, 32, -11], [60, 34, -11]], 0.6, 0.4),
    ...cluster(14, 34, -10.8, 3, 3, 20, 1.4), ...cluster(38, 35, -10.8, 3, 4, 21, 1.4), ...cluster(58, 34, -10.8, 2.5, 3, 22, 1.3),
    B(26, 28.9, 3, 13, 0.3, 9, BL.washi, { m: 'plain', r: 0.05 }), ...strew(21, 31, -1, 7, 29.1, 3, 23),
    B(13, 29.2, 2, 6, 1, 4.4, BL.ink, { m: 'gloss', r: 0.4 }),
    RD([31, 29.3, 6], [38, 29.6, 4], 0.4, BL.woodD), RD([31, 29.3, 6], [29.6, 29.2, 6.5], 0.5, BL.ink, PL),
    ...sprig(52, 28.7, -2, 24, 16),
  ]),

  // a wardrobe: cherry wood, a blossom branch painted across both doors, a crest, a branch blooming over the cornice
  piece('blsmwardrobe', 'Cherry blossom wardrobe', 2, 1, 1400, 'wood', [
    B(32, 3, 0, 62, 6, 30, BL.woodD, { r: 0.8 }),
    B(32, 44, -1, 58, 76, 26, BL.wood, { r: 1.2 }),
    ...[4.5, 59.5].map(x => B(x, 44, 11.6, 3.4, 76, 2, BL.wood, { r: 0.6 })),
    B(32, 83, 0, 62, 3, 30, BL.woodD, { r: 0.8 }),
    PR(32, 84.5, -2, crest(28, 4), 24, BL.wood),
    ...twig([[2, 86, 13.5], [14, 89, 13.5], [28, 87.5, 13.5], [42, 90, 13.5], [56, 87, 13.5], [62, 85, 13.5]], 0.9, 0.5),
    ...cluster(12, 89, 14, 3.5, 4, 25, 1.7), ...cluster(32, 89, 14, 4, 5, 26, 1.8), ...cluster(52, 89, 14, 3.5, 4, 27, 1.7),
  ], {
    doors: [6, 58].map((hx, i) => {
      const x = i ? 45 : 19, hand = i ? 34.5 : 29.5;
      const branch = i ? [[32, 58, 14.3], [40, 64, 14.3], [48, 70, 14.3], [55, 76, 14.3]] : [[9, 14, 14.3], [12, 30, 14.3], [18, 44, 14.3], [26, 54, 14.3], [32, 58, 14.3]];
      return { hinge: [hx, 12], side: i ? -1 : 1, parts: [
        B(x, 45, 12.75, 25.6, 70, 1.5, BL.wood, { r: 0.8 }),
        B(x, 45, 13.5, 21.6, 64, 0.4, BL.woodL, { r: 0.6 }),
        ...twig(branch.map(p => [Math.min(x + 12, Math.max(x - 12, p[0])), p[1], p[2]]), i ? 0.8 : 1.2, i ? 0.4 : 0.8),
        ...(i ? [...cluster(44, 66, 14.5, 4, 5, 28), ...cluster(54, 76, 14.5, 3, 3, 29, 1.5)] : [...cluster(14, 34, 14.5, 3.5, 4, 30), ...cluster(24, 52, 14.5, 4, 5, 31)]),
        RD([hand, 41, 14.2], [hand, 49, 14.2], 0.5, BL.woodD),
      ] };
    }),
    inside: { x: 32, h: 45, w: 50, hh: 66, z: 12 },
  }),

  // a chest of drawers: six drawers with blossom pulls, a petal dish and a bud vase on top
  piece('blsmdresser', 'Cherry blossom dresser', 2, 1, 920, 'wood', [
    ...[[5, -10], [59, -10], [5, 10], [59, 10]].map(([x, z]) => B(x, 2, z, 3, 4, 3, BL.woodD, { r: 0.6 })),
    B(32, 17, 0, 60, 26, 24, BL.wood, { r: 1 }),
    ...[9.5, 17.5, 25.5].flatMap(h => [17, 47].flatMap(x => [B(x, h, 12.3, 27, 6.6, 0.8, BL.woodL, { r: 0.5 }), FL(x, h, 12.9, 1.3, BL.pinkD)])),
    B(32, 30.8, 0, 62, 1.8, 26, BL.woodD, { r: 0.6 }),
    ...twig([[3, 4.8, 12.6], [16, 5.6, 12.6], [32, 4.6, 12.6], [48, 5.6, 12.6], [61, 4.8, 12.6]], 0.45, 0.3),
    ...cluster(32, 5, 12.9, 3, 3, 32, 1.1),
    C(16, 32.1, 0, 4.4, 0.8, BL.white, GL), ...strew(13, 19, -2.5, 2.5, 32.6, 4, 33),
    ...sprig(50, 31.7, -2, 34, 15),
  ]),

  // an open shelf: three cherry shelves on a washi back, folded paper, teacups, a jar and a pot of bloom, a branch climbing it
  piece('blsmshelf', 'Cherry blossom shelf', 1, 1, 680, 'wood', [
    ...[3, 29].map(x => B(x, 34, 0, 2.6, 68, 20, BL.wood, { r: 0.8 })),
    B(16, 35, -9.4, 24, 64, 0.8, BL.washi, PL),
    ...[3, 21, 39, 55].map(h => B(16, h, 0, 25.4, 1.6, 19, BL.wood, { r: 0.5 })),
    B(16, 68.6, 0, 30, 1.8, 21, BL.woodD, { r: 0.6 }),
    ...[[11, 5.2, BL.pink], [11, 6.8, BL.cream], [11, 8.4, BL.pinkD]].map(([x, h, c]) => B(x, h, 0, 9, 1.6, 9, c, { m: 'cloth', r: 0.3 })),
    LA(21, 3.8, 0, [[2.6, 0], [3.4, 2], [3.4, 6], [2, 8], [2.2, 9]], BL.glaze, { m: 'gloss', seg: 10 }),
    ...[[10, 1], [16, -1]].map(([x, z]) => C(x, 23.4, z, 2, 3.2, BL.cream, { rb: 1.5, m: 'gloss' })),
    LA(23, 21.8, 0, [[2, 0], [3, 1.5], [3, 4]], BL.blushD, { m: 'gloss', seg: 10 }), puff(23, 27.6, 0, 3.6, 2.6, 3.4, BL.pink), ...cluster(23, 28, 2.6, 2.5, 3, 35, 1.2),
    LA(10, 39.8, 0, [[2.2, 0], [3.2, 2], [3.2, 7], [2.2, 8], [2.4, 9.2]], BL.pinkL, { m: 'gloss', seg: 10 }), C(10, 49.4, 0, 2.6, 0.8, BL.woodD, PL),
    B(21, 40.4, 0, 7, 1.2, 6, BL.white, { m: 'gloss', r: 0.4 }), ...[[19, -1], [22.6, 1]].map(([x, z]) => S(x, 42.2, z, 1.8, 1.4, 1.6, BL.mochi, { m: 'cloth', seg: 8 })),
    LA(16, 55.8, 0, [[3, 0], [4, 2], [4, 4.6]], BL.cream, { m: 'gloss', seg: 10 }), puff(16, 63.6, 0, 6, 4, 5, BL.pinkL), ...cluster(16, 64, 4.6, 4.4, 6, 36, 1.4),
    ...twig([[3, 4, 10.6], [5, 22, 10.6], [2.6, 40, 10.6], [5, 58, 10.6], [12, 70.5, 10.6], [24, 72, 10.2], [29.5, 69, 10.2]], 0.9, 0.5),
    ...cluster(4, 30, 11, 2.6, 3, 37, 1.5), ...cluster(4, 50, 11, 2.6, 3, 38, 1.5), ...cluster(14, 72, 11, 3.5, 4, 39, 1.6), ...cluster(26, 72, 10.6, 3, 3, 40, 1.5),
  ]),

  // a branch lamp: a twisted cherry branch in a glazed pot, three paper-bloom shades that glow pink
  piece('blsmlamp', 'Cherry blossom branch lamp', 1, 1, 540, 'wood', [
    LA(16, 0, 0, [[5, 0], [6.6, 2], [7, 6], [6, 9], [6.4, 10]], BL.cream, { m: 'gloss', seg: 12 }),
    C(16, 6.5, 0, 6.95, 1.2, BL.pinkD, PL), C(16, 9.6, 0, 5.8, 0.6, BL.moss, PL),
    ...twig([[16, 9, 0], [14.6, 20, 0], [17.6, 31, 0], [15, 43, 0], [16, 55, 0]], 1.5, 0.8),
    ...twig([[17.4, 29, 0], [23, 37, 0], [25.5, 45, 1]], 0.8, 0.5), ...twig([[15.4, 40, 0], [10, 46, 0], [7.5, 53, 0]], 0.8, 0.5),
    ...[[25.5, 49, 1, 1], [7.5, 57, 0, 2], [16, 61, 0, 3]].flatMap(([x, h, z, s]) => [
      S(x, h, z, 4.2, 3.8, 4.2, BL.lampL, GW),
      FL(x, h, z + 2.4, 5.6, BL.lamp, { m: 'glow', cc: BL.lampL, cr: 0.32, d: 1.6, rot: s * 0.4 }),
      C(x, h + 4, z, 0.8, 1.4, BL.twig, WD),
    ]),
    ...cluster(20, 34, 1, 2.6, 3, 41, 1.2), ...cluster(11, 45, 1, 2.6, 3, 42, 1.2), ...cluster(15.6, 24, 1.2, 2, 2, 43, 1.1),
  ], { glow: [BL.lamp, BL.lampL] }),

  // a branch clock: a round cherry clock on a turned column, a blossom on every hour, a flowering branch curled over it
  piece('blsmclock', 'Cherry blossom clock', 1, 1, 880, 'wood', [
    B(16, 1.6, 0, 20, 3.2, 14, BL.woodD, { r: 0.8 }),
    LA(16, 3, 0, [[4, 0], [3, 3], [2.4, 6], [2.4, 22], [3.4, 25], [4.4, 26]], BL.wood, { seg: 10 }),
    DS(16, 40, 0, 11.6, 4, BL.wood),
    RG(16, 40, 2, 11.2, 0.8, BL.woodD),
    PC(16, 40, 2.15, 15, 15, dial),
    ...twig([[3, 35, 2.8], [4.6, 45, 3], [9.6, 51.5, 3], [17, 54, 3], [24, 51.6, 3], [28, 45, 2.8]], 1, 0.5),
    ...twig([[28.4, 45, 2.8], [29, 37, 2.8]], 0.5, 0.3),
    ...cluster(6, 47, 3.4, 3.5, 4, 44, 1.6), ...cluster(16, 54, 3.4, 4, 5, 45, 1.7), ...cluster(26, 49, 3.4, 3, 4, 46, 1.5), ...cluster(29, 37, 3.2, 1.6, 2, 47, 1.2),
  ]),

  // a three-panel folding screen: cherry frames, a blossom tree painted across its washi
  piece('blsmscreen', 'Cherry blossom folding screen', 2, 1, 780, 'wood', [
    ...[[11, 3, 0], [32, -3, 1], [53, 3, 2]].flatMap(([x, z, i]) => [
      ...[-7, 7].map(dx => B(x + dx, 1.5, z, 3, 3, 5, BL.woodD, { r: 0.6 })),
      B(x, 31, z, 20.4, 56, 1.8, BL.wood, { r: 0.6 }),
      B(x, 59.6, z, 21, 2, 2.4, BL.woodD, { r: 0.6 }),
      PC(x, 31, z + 0.95, 17.4, 51, treePanel(i)),
    ]),
    ...[21.5, 42.5].flatMap(x => [14, 48].map(h => B(x, h, 0, 1, 3, 7.4, BL.gold, { m: 'metal', r: 0.3 }))),
  ]),

  // a standing mirror: an oval glass in a cherry frame between two posts, a flowering branch wrapped over its top
  piece('blsmmirror', 'Cherry blossom mirror', 1, 1, 620, 'wood', [
    ...[4, 28].flatMap(x => [B(x, 1.2, 0, 3.4, 2.4, 13, BL.woodD, { r: 0.8 }), B(x, 24, 0, 2.4, 44, 2.4, BL.wood, { r: 0.8 }), S(x, 46.6, 0, 1.6, 1.6, 1.6, BL.woodD, { seg: 8 })]),
    RD([4, 34, 0], [28, 34, 0], 0.6, BL.woodD),
    DS(16, 35, 0, 10.6, 1.6, BL.wood, { ry: 16 }),
    RG(16, 35, 0.9, 10.1, 0.7, BL.woodD, { ry: 15.5 }),
    DS(16, 35, 0.9, 9, 0.4, BL.mirror, { ry: 14.4, m: 'gloss' }),
    ...twig([[7, 44, 1.8], [10.4, 50, 2], [17, 52.4, 2], [23, 49.6, 2], [26.2, 42, 1.8]], 0.8, 0.5), ...twig([[6.2, 42, 1.8], [5.8, 30, 1.8], [7.4, 24, 1.8]], 0.6, 0.35),
    ...cluster(10, 49, 2.4, 3, 4, 48, 1.5), ...cluster(19, 52, 2.4, 3.5, 5, 49, 1.6), ...cluster(25.4, 45, 2.4, 2.4, 3, 50, 1.4), ...cluster(6.4, 31, 2.2, 2.4, 3, 51, 1.3),
  ]),

  // a hanami picnic rug: pink gingham, an open bento of rice balls and rolled egg, sakura mochi, tea, fallen petals
  { id: 'blsmrug', name: 'Cherry blossom picnic rug', group: GROUP, holiday: HOLIDAY, solo: true, w: 3, h: 2, layer: 'rug', price: 720, high: 0.04, side: 'c', flat(w, h) {
    const g = ctx(), rect = (x, y, rw, rh, c) => { g.fillStyle = c; g.fillRect(x, y, rw, rh); };
    rect(0, 0, w, h, BL.pinkD); rect(1.4, 1.4, w - 2.8, h - 2.8, BL.white);
    g.save(); g.beginPath(); g.rect(1.4, 1.4, w - 2.8, h - 2.8); g.clip();
    g.fillStyle = 'rgba(238,143,174,0.5)';
    for (let x = 1.4; x < w; x += 8) g.fillRect(x, 0, 4, h);
    for (let y = 1.4; y < h; y += 8) g.fillRect(0, y, w, 4);
    g.restore();
    for (let i = 0; i < 26; i++) { const px = 4 + hash(i, 61) * (w - 8), py = 4 + hash(i, 62) * (h - 8); g.fillStyle = i % 3 ? BL.pinkD : BL.pink; g.beginPath(); g.ellipse(px, py, 1, 0.6, hash(i, 63) * TAU, 0, TAU); g.fill(); }
    const bx = w * 0.56, by = h * 0.22, bw = 24, bh = 20;
    g.fillStyle = 'rgba(60,30,30,0.25)'; g.fillRect(bx + 1, by + 1.2, bw, bh);
    rect(bx, by, bw, bh, BL.redD); rect(bx + 1, by + 1, bw - 2, bh - 2, '#2a1f22');
    rect(bx + bw / 2 - 0.3, by + 1, 0.6, bh - 2, BL.redD); rect(bx + 1, by + bh / 2 - 0.3, bw - 2, 0.6, BL.redD);
    for (const [ox, oy] of [[3, 2.6], [7.6, 2.6], [5.2, 6.4]]) { g.fillStyle = BL.white; g.beginPath(); g.moveTo(bx + ox, by + oy - 1.8); g.lineTo(bx + ox + 2.2, by + oy + 1.6); g.lineTo(bx + ox - 2.2, by + oy + 1.6); g.closePath(); g.fill(); rect(bx + ox - 1.2, by + oy + 0.6, 2.4, 1, '#20302a'); }
    for (let i = 0; i < 3; i++) { rect(bx + 13.4 + i * 3.1, by + 2, 2.6, 6.4, BL.egg); rect(bx + 13.4 + i * 3.1, by + 2, 2.6, 0.6, '#e8b840'); }
    for (let i = 0; i < 7; i++) oval(bx + 3 + hash(i, 64) * 6, by + 12 + hash(i, 65) * 5, 1, 0.9, i % 2 ? BL.pinkD : BL.pink);
    oval(bx + 16, by + 14.6, 2.4, 2.4, '#7aa84e'); oval(bx + 20.2, by + 13.6, 1.4, 1.4, '#c43a3a'); oval(bx + 20.4, by + 17, 1.6, 1.4, '#f2a24a');
    const lx = w * 0.3, ly = h * 0.16;
    rect(lx, ly, 20, 17, BL.red); rect(lx + 1, ly + 1, 18, 15, BL.redD); rect(lx + 1.6, ly + 1.6, 16.8, 13.8, BL.red);
    g.save(); g.translate(lx + 10, ly + 8.5); g.scale(1, -1); g.fillStyle = BL.gold; g.beginPath(); flowerPts(4.4).forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py))); g.closePath(); g.fill(); g.restore();
    oval(lx + 10, ly + 8.5, 1.2, 1.2, BL.red);
    const px = w * 0.22, py = h * 0.66;
    oval(px, py, 7, 5, BL.white); oval(px, py, 6, 4.2, '#f4ece6');
    for (const [dx, c] of [[-2.4, BL.mochi], [2.4, BL.pinkL]]) { oval(px + dx + 0.6, py + 0.4, 2.4, 1.8, '#5c934a'); oval(px + dx, py - 0.2, 2.2, 1.7, c); }
    for (const [cx, cy] of [[w * 0.5, h * 0.7], [w * 0.62, h * 0.78]]) { oval(cx, cy, 3, 3, BL.cream); oval(cx, cy, 2.2, 2.2, '#9fbf5a'); oval(cx - 0.6, cy - 0.6, 0.8, 0.6, '#c6dc8c'); }
    g.strokeStyle = BL.woodD; g.lineWidth = 0.7; g.lineCap = 'round';
    for (const d of [0, 1.4]) { g.beginPath(); g.moveTo(w * 0.78 + d, h * 0.62); g.lineTo(w * 0.86 + d, h * 0.86); g.stroke(); }
    inkTwig(g, [[w * 0.06, h * 0.2], [w * 0.12, h * 0.26], [w * 0.2, h * 0.24]], 1, 0.5);
    for (const [fx, fy, r] of [[0.1, 0.22, 2], [0.15, 0.28, 1.6], [0.2, 0.22, 1.8], [0.07, 0.17, 1.4]]) bloomAt(g, w * fx, h * fy, r, PINKS[Math.round(fx * 50) % 5], fx * 9);
  } },

  // a blossom-branch wall hanging: a long flowering branch slung on red cords from two pegs
  wallPiece('blsmhanging', 'Cherry blossom branch hanging', 2, 440, 'wood', [
    ...[12, 52].map(x => S(x, 84, 1.3, 1.3, 1.3, 1.2, BL.woodD, { seg: 8 })),
    RD([12, 84, 1.3], [10, 67.5, 2], 0.3, BL.red, PL), RD([52, 84, 1.3], [54, 65.5, 2], 0.3, BL.red, PL),
    ...twig([[2, 61, 2], [12, 67, 2.2], [24, 63.5, 2.4], [34, 68, 2.4], [46, 63.5, 2.4], [56, 66, 2.2], [62.5, 60, 2]], 1.4, 0.6),
    ...twig([[24, 63.5, 2.4], [28, 56, 2.6], [26, 50, 2.6]], 0.6, 0.35), ...twig([[46, 63.5, 2.4], [43, 57, 2.6]], 0.5, 0.3), ...twig([[34, 68, 2.4], [37, 74, 2.6]], 0.5, 0.3),
    ...[[6, 63, 4], [18, 67, 5], [27, 54, 4.4], [36, 70, 5], [44, 59, 4], [54, 66, 5]].map(([x, h, r], i) => puff(x, h, 2.4, r, r * 0.75, 1.6, i % 2 ? BL.pink : BL.pinkL)),
    ...cluster(6, 63, 3.6, 3.5, 4, 52, 2.2), ...cluster(18, 66, 3.6, 4.4, 5, 53, 2.4), ...cluster(27, 54, 3.8, 3.6, 4, 54, 2.2), ...cluster(36, 70, 3.6, 4.4, 5, 55, 2.4),
    ...cluster(44, 59, 3.8, 3.4, 4, 56, 2.2), ...cluster(54, 66, 3.6, 4.4, 5, 57, 2.4), ...cluster(61, 60, 3.6, 2.4, 3, 58, 1.9),
  ]),

  // a hanging scroll: a blossom branch inked on washi, a blush silk mount, cherry rollers, a red seal
  wallPiece('blsmscroll', 'Cherry blossom scroll', 1, 380, 'wood', [
    RD([10, 86, 0.6], [16, 90, 0.6], 0.25, BL.red, PL), RD([22, 86, 0.6], [16, 90, 0.6], 0.25, BL.red, PL), S(16, 90, 0.4, 0.9, 0.9, 0.6, BL.woodD, { seg: 6 }),
    B(16, 58.5, 0.4, 20, 51, 0.5, BL.blush, { m: 'cloth', r: 0.1 }),
    B(16, 77, 0.7, 20, 1.2, 0.3, BL.blushD, { m: 'plain', r: 0.05 }),
    PC(16, 56, 0.75, 16, 38, scrollArt),
    RD([5, 85, 0.9], [27, 85, 0.9], 0.9, BL.woodD), RD([3.6, 32, 1.2], [28.4, 32, 1.2], 1.2, BL.woodD),
    ...[3, 29].map(x => S(x, 32, 1.2, 1.3, 1.5, 1.3, BL.wood, { seg: 8 })),
  ]),

  // a blossom wreath: a ring of woven twigs thick with bloom, a pink ribbon bow at its foot
  wallPiece('blsmwreath', 'Cherry blossom wreath', 1, 360, 'wood', [
    S(16, 75, 0.4, 0.8, 0.8, 0.6, BL.woodD, { seg: 6 }),
    RG(16, 62, 2, 10, 1.8, BL.twig), RG(16, 62, 2.6, 10.6, 0.7, BL.twigL),
    ...Array.from({ length: 18 }, (_, i) => {
      const a = i / 18 * TAU + hash(i, 59) * 0.2, rr = 10 + (hash(i, 60) - 0.5) * 3;
      return FL(16 + Math.cos(a) * rr, 62 + Math.sin(a) * rr, 3.2 + hash(i, 61), 1.9 + hash(i, 62) * 0.8, PINKS[i % 5], { rot: a });
    }).filter((_, i) => i < 12 || i > 14),
    ...[[-3, 0.9], [3, -0.9]].map(([dx]) => S(16 + dx, 51.5, 3.6, 2.8, 1.8, 1.2, BL.pinkD, { m: 'cloth', seg: 8 })), S(16, 51.5, 4, 1.2, 1.3, 1, BL.rose, { m: 'cloth', seg: 6 }),
    RD([15, 50.5, 3.6], [12.6, 44, 3.4], 0.7, BL.pinkD, CL), RD([17, 50.5, 3.6], [19.6, 44, 3.4], 0.7, BL.pinkD, CL),
  ]),

  // a blossom bonsai: a gnarled trunk in an indigo-glazed tray on a low cherry stand, clouds of bloom
  piece('blsmbonsai', 'Cherry blossom bonsai', 1, 1, 640, 'wood', [
    ...[[5, -7], [27, -7], [5, 7], [27, 7]].map(([x, z]) => B(x, 4.5, z, 2.4, 9, 2.4, BL.woodD, { r: 0.6 })),
    B(16, 10, 0, 29, 2, 20, BL.woodD, { r: 0.6 }), B(16, 7.6, 9, 24, 2, 1, BL.woodD, { r: 0.4 }),
    ...[[8, -4], [24, -4], [8, 4], [24, 4]].map(([x, z]) => B(x, 11.6, z, 2, 1.2, 2, BL.glaze, { m: 'gloss', r: 0.4 })),
    B(16, 14.6, 0, 22, 5, 14, BL.glaze, { m: 'gloss', r: 1 }),
    B(16, 17.2, 0, 20.4, 0.6, 12.4, BL.moss, { m: 'cloth', r: 0.2 }),
    S(21, 17.8, 3, 2, 1.2, 1.6, BL.stone, { m: 'plain', seg: 6 }),
    ...twig([[12, 17, 0], [10, 24, 0], [14, 30, 0], [19, 34, 0], [17, 40, 0]], 2.2, 1.1),
    ...twig([[14, 30, 0], [8, 36, 0], [5.5, 41, 1]], 1, 0.5), ...twig([[19, 34, 0], [25, 38, 0], [27, 42, 1]], 1, 0.5),
    puff(7, 43, 0, 6, 4.2, 6, BL.pink), puff(16.5, 47, 0, 7.6, 5, 7, BL.pinkL), puff(26, 44, 0, 5.8, 4, 6),
    ...cluster(7, 43.5, 4.6, 4, 5, 63, 1.5), ...cluster(16.5, 48, 5.4, 5, 7, 64, 1.6), ...cluster(26, 44.5, 4.6, 3.6, 5, 65, 1.5),
    ...strew(6, 26, -6, 8, 11.1, 4, 66),
  ]),

  // a stone lantern (tōrō): a hexagonal roof scattered with petals, washi windows that glow, on a stone column
  piece('blsmlantern', 'Cherry blossom stone lantern', 1, 1, 740, 'plain', [
    LA(16, 0, 0, [[9.6, 0], [9.6, 2], [7.4, 4], [4.6, 5.4], [0, 5.4]], BL.stone, { seg: 6 }),
    C(16, 12, 0, 3, 14, BL.stone, { seg: 8 }), C(16, 10, 0, 3.4, 1.2, BL.stoneD, { seg: 8 }),
    LA(16, 18.5, 0, [[3.4, 0], [8, 2.4], [8.4, 4.4], [0, 4.4]], BL.stone, { seg: 6 }),
    B(16, 29, 0, 12.6, 12, 12.6, BL.stoneL, { r: 0.6 }),
    ...[[16, 6.5, 6.6, 0.4], [9.6, 0, 0.4, 6.6], [22.4, 0, 0.4, 6.6]].map(([x, z, w, d]) => B(x, 29.5, z, w, 7, d, BL.light, { m: 'glow', r: 0.2 })),
    DS(16, 29.5, 6.9, 1.6, 0.3, BL.stoneL),
    LA(16, 35, 0, [[12.4, 0.2], [14, 1.4], [10.6, 3.6], [4.4, 7], [1.6, 8], [0, 8]], BL.stoneD, { seg: 6 }),
    LA(16, 43, 0, [[1.6, 0], [2.6, 1.6], [2.2, 3.4], [0.8, 4.6], [0.4, 5.2], [0, 5.6]], BL.stone, { seg: 8 }),
    ...[[11, 39.6, 3], [20, 39, -2], [15, 41.6, -1]].map(([x, h, z]) => S(x, h, z, 2.4, 0.7, 1.6, BL.moss, { m: 'cloth', seg: 6 })),
    ...strew(7, 25, -6, 6, 37.6, 6, 67), ...strew(10, 22, -5, 5, 23, 4, 68), ...strew(3, 29, -8, 8, 5.6, 6, 69),
    FL(9, 2, 10, 1.6, BL.pink, { rot: 0.4 }), FL(23, 1.6, 9.5, 1.4, BL.pinkD, { rot: 1 }),
  ], { glow: [BL.light] }),

  // a wagasa stand: a cream crock painted with blossom holding two closed paper umbrellas, red and pink
  piece('blsmumbrella', 'Cherry blossom wagasa stand', 1, 1, 400, 'gloss', [
    ...[[12, -1, BL.red, 26, 62], [21, 1.5, BL.pinkD, 22, 55]].flatMap(([x, z, c, h0, h1]) => [
      C(x, (4 + h0) / 2, z, 0.6, h0 - 4, BL.woodL, WD),
      LA(x, h0, z, [[1, 0], [3, 5], [3.5, (h1 - h0) * 0.55], [2.4, (h1 - h0) * 0.85], [0.6, h1 - h0], [0, h1 - h0 + 0.4]], c, { m: 'cloth', seg: 8 }),
      C(x, h0 + (h1 - h0) * 0.4, z, 3.5, 1, BL.white, { m: 'plain', seg: 8 }),
      C(x, h1 + 1.4, z, 0.45, 2.4, BL.woodD, WD),
    ]),
    LA(16, 0, 0, [[6.4, 0], [7.2, 2], [7.2, 15], [7.8, 18], [7.4, 19]], BL.cream, { seg: 12 }),
    C(16, 16.6, 0, 7.5, 1.4, BL.pinkD, PL), C(16, 2.4, 0, 7.25, 1, BL.pinkD, PL),
    ...twig([[10.6, 5, 7.2], [13.6, 9, 7.6], [18, 11.4, 7.6], [21.4, 9.6, 7.4]], 0.4, 0.25),
    FL(13, 9.4, 7.8, 2.1, BL.pink), FL(18, 12, 7.8, 1.8, BL.pinkD, { rot: 0.6 }), FL(21, 8.4, 7.6, 1.5, BL.pink, { rot: 1.2 }), FL(10.6, 6.4, 7.4, 1.3, BL.pinkD),
  ]),

  // a tea table: a low round cherry table, a kyusu teapot, cups of green tea, sakura mochi on a plate, a sprig of bloom
  piece('blsmtea', 'Cherry blossom tea table', 1, 1, 580, 'wood', [
    ...[[8, -7], [24, -7], [8, 7], [24, 7]].map(([x, z]) => B(x, 6.5, z, 2.4, 13, 2.4, BL.woodD, { r: 0.8 })),
    C(16, 12.2, 0, 11, 2, BL.woodD, { seg: 16 }),
    C(16, 14.6, 0, 14, 2.4, BL.wood, { seg: 24 }),
    S(11, 19.4, -3, 3.6, 3.4, 3.6, BL.cream, { m: 'gloss', seg: 10 }), C(11, 22.9, -3, 1.9, 0.8, BL.cream, GL), S(11, 23.6, -3, 0.7, 0.6, 0.7, BL.pinkD, { m: 'gloss', seg: 6 }),
    RD([14.2, 19, -2.4], [17.4, 21.4, -1.2], 0.7, BL.cream, GL), RD([8, 20, -3], [4, 21.4, -3.4], 0.9, BL.woodD),
    FL(11, 19.6, 0.5, 1.4, BL.pinkD),
    ...[[21, 2.5], [23.5, -4]].flatMap(([x, z]) => [C(x, 17.4, z, 1.9, 3, BL.cream, { rb: 1.4, m: 'gloss' }), C(x, 18.85, z, 1.6, 0.1, BL.leaf, PL)]),
    C(13.5, 16.1, 6.6, 3.8, 0.6, BL.white, GL),
    S(12.2, 17.4, 6.4, 1.8, 1.2, 1.5, BL.mochi, { m: 'cloth', seg: 8 }), S(15.2, 17.3, 7, 1.7, 1.1, 1.4, BL.pinkL, { m: 'cloth', seg: 8 }),
    S(13.8, 16.9, 5.4, 2, 0.5, 1.2, BL.leafD, { m: 'plain', seg: 6 }),
    ...strew(5, 27, -8, 10, 15.9, 6, 70),
    FL(24, 16, 9.6, 1.5, BL.pink, { rot: 0.5 }),
  ], {}),

  // a blossom arch: a cherry trellis arch, its lattice sides and curve heavy with bloom, sprigs hanging down
  piece('blsmarch', 'Cherry blossom arch', 2, 1, 1000, 'wood', [
    ...[5, 59].flatMap(x => [
      B(x, 1, 0, 6, 2, 20, BL.woodD, { r: 0.6 }),
      ...[-8, 8].map(z => B(x, 31, z, 2.4, 60, 2.4, BL.wood, { r: 0.6 })),
      ...[10, 22, 34, 46].map(h => B(x, h, 0, 1.6, 1.2, 17, BL.woodL, { r: 0.05 })),
      B(x, 28, 0, 1.2, 52, 1.2, BL.woodL, { r: 0.05 }),
    ]),
    ...[-8, 8].map(z => RG(32, 60, z, 27, 1.3, BL.wood, { a0: 0, arc: Math.PI })),
    ...ARC(32, 60, 27, 7, 0.06, 0.94).map(([x, h]) => RD([x, h, -8], [x, h, 8], 0.8, BL.woodL)),
    ...ARC(32, 60, 27.6, 7, 0.12, 0.88).map(([x, h], i) => puff(x, h + 1.4, 0, 5.4, 4, 9, i % 2 ? BL.pink : BL.pinkL)),
    ...ARC(32, 60, 27.4, 9, 0.04, 0.96).flatMap(([x, h], i) => cluster(x, h + 0.6, 9.4, 4, 3, 71 + i, 1.7)),
    ...[[14, 79], [32, 87], [50, 79]].flatMap(([x, h], i) => [...twig([[x, h - 1, 10], [x + (i - 1) * 2, h - 9, 10.4], [x + (i - 1) * 3, h - 15, 10.4]], 0.5, 0.3), ...cluster(x + (i - 1) * 2.6, h - 13, 10.8, 2.4, 3, 80 + i, 1.4)]),
    ...cluster(5, 50, 9.6, 3, 3, 83, 1.5), ...cluster(59, 46, 9.6, 3, 3, 84, 1.5), ...cluster(5, 26, 9.6, 2.4, 2, 85, 1.4), ...cluster(59, 22, 9.6, 2.4, 2, 86, 1.4),
  ]),

  // a stone basin (tsukubai): water and floating petals in a round stone bowl, a bamboo spout and ladle, river stones
  piece('blsmbasin', 'Cherry blossom stone basin', 1, 1, 660, 'plain', [
    S(6, 3, 7, 5, 3, 5, BL.stoneD, { seg: 8 }), S(27, 2.6, 5, 4.2, 2.6, 4.2, BL.stone, { seg: 8 }), S(8, 2, -9, 4, 2, 4, BL.stone, { seg: 8 }),
    LA(16, 0, -1, [[8, 0], [10, 3], [10.4, 8], [9.6, 12], [8.4, 13], [6, 13], [6, 10.6], [0, 10.6]], BL.stone, { seg: 12 }),
    C(16, 11.9, -1, 6.1, 0.3, BL.water, GL),
    ...strew(12, 20, -4, 2, 12.1, 5, 87),
    C(26, 12, -9, 1.6, 24, BL.bamboo, GL), C(26, 8, -9, 1.75, 0.8, BL.bambooD, PL), C(26, 17, -9, 1.75, 0.8, BL.bambooD, PL),
    RD([26, 22, -9], [18.5, 20, -3.4], 1, BL.bamboo, GL), RD([18.5, 20, -3.4], [18, 12.2, -3], 0.35, BL.water, PL),
    RD([8.6, 13.7, -5], [23, 13.7, 3], 0.4, BL.bambooD, GL), C(8.6, 14.4, -5, 1.6, 2, BL.bamboo, GL),
    FL(6, 5.4, 11.4, 1.6, BL.pink, { rot: 0.4 }), FL(9, 4.8, 10.8, 1.3, BL.pinkD, { rot: 1.1 }), FL(26, 4.4, 8.6, 1.4, BL.pink, { rot: 0.8 }),
  ]),

  // a Cherrim planter: Cherrim in its Sunshine Form, petals open and smiling, in a cherry planter with blossoms
  piece('blsmcherrim', 'Cherrim blossom planter', 1, 1, 560, 'wood', [
    ...[[5, -6], [27, -6], [5, 6], [27, 6]].map(([x, z]) => B(x, 1, z, 3, 2, 3, BL.woodD, { r: 0.5 })),
    B(16, 7, 0, 27, 10, 18, BL.woodL, { r: 1 }),
    ...[3.8, 10.2].map(h => B(16, h, 9.2, 27.4, 1, 0.6, BL.wood, { m: 'plain', r: 0.2 })),
    B(16, 12.4, 0, 25, 0.6, 16, BL.soil, { m: 'plain', r: 0.2 }),
    S(9.6, 14.6, 1, 4.4, 1.4, 2.6, BL.leaf, { m: 'gloss', seg: 8 }), S(22.4, 14.6, 1, 4.4, 1.4, 2.6, BL.leaf, { m: 'gloss', seg: 8 }),
    ...[13.6, 18.4].map(x => S(x, 14, 2, 1.4, 1.6, 1.4, BL.cherrimB, { m: 'gloss', seg: 8 })),
    S(16, 18.4, 1.4, 3.8, 4.2, 3.4, BL.cherrimB, { m: 'gloss', seg: 10 }),
    S(16, 31, -0.2, 7, 7, 3, BL.cherrimF, { m: 'gloss', seg: 10 }),
    FL(16, 31, -1.2, 13, BL.cherrim, { cc: BL.cherrimF, cr: 0.48, d: 2.4, m: 'gloss' }),
    ...[13.4, 18.6].flatMap(x => [S(x, 32.4, 2.6, 0.9, 1.4, 0.5, BL.ink, { m: 'plain', seg: 6 }), S(x - 0.25, 32.9, 3, 0.3, 0.4, 0.2, BL.white, { m: 'plain', seg: 4 })]),
    ...[11.2, 20.8].map(x => DS(x, 29.6, 2.4, 1.1, 0.2, BL.pinkD, { ry: 0.7, m: 'plain' })),
    RG(16, 30, 2.6, 1.4, 0.3, BL.ink, { a0: Math.PI * 1.15, arc: Math.PI * 0.7, m: 'plain' }),
    FL(4.6, 14.6, 8, 2, BL.pink, { rot: 0.5 }), FL(27.6, 14.4, 8, 1.8, BL.pinkD, { rot: 1.2 }), FL(25, 14, 6, 1.4, BL.pinkL),
  ]),

  // a Hoppip mobile: a cherry stand, a crossbar hung with Hoppip, Skiploom and blossoms drifting on cords
  piece('blsmhoppip', 'Hoppip blossom mobile', 1, 1, 500, 'wood', [
    LA(16, 0, 0, [[8, 0], [8, 1.4], [6, 2.6], [1.6, 3.4], [0, 3.4]], BL.woodD, { seg: 12 }),
    C(16, 40.5, 0, 0.9, 75, BL.wood, { seg: 8 }),
    RD([3, 78, 0], [29, 78, 0], 0.8, BL.wood), ...[3, 29].map(x => S(x, 78, 0, 1.1, 1.1, 1.1, BL.woodD, { seg: 6 })),
    FL(16, 81, 0.6, 2.6, BL.pinkD), S(16, 78, 0, 1.4, 1.4, 1.4, BL.woodD, { seg: 6 }),
    RD([5, 78, 0], [5, 61, 0], 0.15, BL.white, PL), RD([27, 78, 0], [27, 67.6, 0], 0.15, BL.white, PL),
    RD([10, 78, 0], [10, 64, 0], 0.15, BL.white, PL), RD([22, 78, 0], [22, 70, 0], 0.15, BL.white, PL),
    S(5, 55.4, 0, 4.6, 4.4, 4.2, BL.hoppip, { m: 'gloss', seg: 10 }),
    ...[[2.8, 61, -0.6], [7.2, 61, -0.6], [5, 62, 0.6]].map(([x, h, z], i) => S(x, h, z, 2.4, 0.8, 1.6, BL.leaf, { m: 'gloss', seg: 6, rz: i === 2 ? 1.2 : 1.6 })),
    ...[3.4, 6.6].map(x => S(x, 56.4, 3.8, 0.6, 0.9, 0.4, BL.ink, { m: 'plain', seg: 6 })), ...[2.4, 7.6].map(x => S(x, 51.6, 1, 1.4, 1, 1.4, BL.hoppip, { m: 'gloss', seg: 6 })),
    S(27, 62, 0, 4, 3.8, 3.6, BL.skiploom, { m: 'gloss', seg: 10 }),
    FL(27, 67.2, 0.4, 4, BL.sun, { cc: '#f29a3a', cr: 0.34, d: 1.2, m: 'gloss' }),
    ...[25.6, 28.4].map(x => S(x, 62.8, 3.4, 0.5, 0.8, 0.4, BL.ink, { m: 'plain', seg: 6 })),
    ...[[10, 70, 1.8], [10, 64.6, 1.6], [22, 74, 1.8], [22, 70.6, 1.4]].map(([x, h, r], i) => FL(x, h, 0.4, r, PINKS[i], { rot: i * 0.5 })),
  ]),

  // a Cherubi lamp: two glowing cherries on a green stem under a pair of leaves, the big one Cherubi's smiling face
  piece('blsmcherubi', 'Cherubi blossom lamp', 1, 1, 460, 'wood', [
    LA(16, 0, 0, [[7, 0], [7, 1.6], [5.5, 3], [2, 4], [0, 4]], BL.woodD, { seg: 12 }),
    FL(16, 2.4, 7.2, 1.4, BL.pinkD), FL(11, 2, 5.6, 1.1, BL.pink, { rot: 0.7 }),
    ...twig([[16, 4, 0], [17, 22, 0], [15, 38, 0], [16, 52, 0]], 1, 0.7, BL.leafD),
    S(11.4, 54, 0, 5.4, 1.6, 3, BL.leaf, { m: 'gloss', seg: 8 }), S(20.6, 55, 0, 5.4, 1.6, 3, BL.leaf, { m: 'gloss', seg: 8 }),
    ...twig([[16, 52, 0], [12, 48, 0.6], [9.6, 42, 1], [10, 36, 1]], 0.6, 0.45, BL.leafD),
    ...twig([[16, 52, 0], [21, 48, 0.6], [23, 43, 1], [23, 39.4, 1]], 0.55, 0.4, BL.leafD),
    S(10, 28.4, 1, 8, 7.6, 7.6, BL.cherubi, GW),
    S(23, 34.4, 1, 5.4, 5.2, 5.2, BL.cherubiL, GW),
    ...[7.6, 12.4].flatMap(x => [S(x, 29.8, 8.2, 0.9, 1.3, 0.5, BL.ink, { m: 'plain', seg: 6 }), S(x - 0.25, 30.3, 8.6, 0.3, 0.4, 0.2, BL.white, { m: 'plain', seg: 4 })]),
    RG(10, 27.4, 8.2, 1.4, 0.3, BL.ink, { a0: Math.PI * 1.15, arc: Math.PI * 0.7, m: 'plain' }),
  ], { glow: [BL.cherubi, BL.cherubiL] }),
];
