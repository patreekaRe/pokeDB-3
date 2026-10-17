/* base-furniture-maple.js  -  the Maple leaf set (furniture expansion session f, 2026-10-17): Animal Crossing's maple-leaf
   series, an autumn room. Warm dark-amber wood, seven-pointed maple leaves in scarlet, crimson, orange and gold (carved
   into backs, cut out of headboards, as a mirror, a clock, a rug, a giant leaf umbrella), rust and mustard wool and
   tweed, a pumpkin-spice tea set. Pokémon touches: a Sawsbuck (autumn form) antler mount, a Deerling cushion with its
   autumn flower, a Leavanny-sewn dress of leaves with a Sewaddle hooded in a maple leaf. All solo, fixed colours, and
   every kind is sold only in October (`holiday: 'maple'`, js/data/holidays.js). Kept apart from the Acorn set (nuts,
   brown wood): here it's leaves and reds.
   An upright piece is a list of parts in painted units (32 a tile), as in js/base-furniture-elegant.js: `x` across from
   the left of its front, `h` up from the floor (a wall piece's from the foot of its strip), `z` out to the front from its
   middle (a wall piece's from the wall). They're painted here from any side, and js/base-models-maple.js builds the
   same list as 3D parts (BUILT), so picture and model agree. Every leaf is one outline (`leafPts`), extruded; a `lie`
   prism lies flat, its tip to the back (a leaf floating on the pond, one pressed in a book). A `pic` part (a dial, the
   screen's red maple, the pressed leaves) is painted on the front only, and the model wears that crop of the painting.
   The wardrobe's doors swing (`doors`, `inside`). The rug is a big leaf, painted from above and cut to its outline. */

import { sh, oval, ovalShade, floorShadow, ctx, hash, glass as glassPane } from './base-paint.js';

export const MP = {
  wood: '#7a4524', woodD: '#55301a', woodL: '#9c6038', amber: '#c27a34', bark: '#5a3826',
  scarlet: '#d6372b', crimson: '#a51f2c', crimsonD: '#7a1622', orange: '#e8742c', gold: '#e9b23c',
  rust: '#a9502c', rustL: '#c8693e', rustD: '#7e3820', mustard: '#d4a33a', mustardD: '#a87d24',
  wool: '#efe1c6', woolD: '#d6c4a2', tweed: '#8b6b4c', pumpkin: '#e88a2e', pumpkinD: '#b8621c', latte: '#c48a52',
  china: '#f6efe2', cream: '#f6ead2', ink: '#2a2018', brass: '#c9a24c', shade: '#f8b45a', paper: '#efe0bc',
  stone: '#8e8a84', water: '#5c8fa8', moss: '#6f8a4a', bamboo: '#b8a060', bambooD: '#8e7a44', pot: '#3f566a',
  mirror: '#d6dee0', stem: '#7e4a2a', green: '#86c24a', sew: '#ecd24a',
  fawn: '#c98a4e', fur: '#f1dcb4', deer: '#8a5634', antler: '#4e3020', bloom: '#e05a2a',
};
const GROUP = 'Maple leaf';
const TAU = Math.PI * 2;

/* ---------- the leaf ---------- */

/** The seven lobes (angle from the right, counter-clockwise; reach), and the notches between them. */
const LOBES = [[-30, 0.48], [10, 0.72], [50, 0.82], [90, 1], [130, 0.82], [170, 0.72], [210, 0.48]];
const NOTCH = [0.3, 0.4, 0.44, 0.44, 0.4, 0.3];
/** A maple leaf's outline, [x, up] about its heart, s from the heart to the top tip, turned `rot` degrees
    counter-clockwise; `stem` (in s) runs a stalk down from the heart. */
export function leafPts(s, rot = 0, stem = 0) {
  const c = Math.cos(rot * Math.PI / 180), si = Math.sin(rot * Math.PI / 180);
  const xy = (px, py) => [(px * c - py * si) * s, (px * si + py * c) * s];
  const pol = (deg, r) => xy(Math.cos(deg * Math.PI / 180) * r, Math.sin(deg * Math.PI / 180) * r);
  const P = [];
  LOBES.forEach(([a, r], i) => {
    const gl = i ? a - LOBES[i - 1][0] : 40, gr = i < 6 ? LOBES[i + 1][0] - a : 40, sr = Math.max(r * 0.68, 0.36);
    P.push(pol(a - gl * 0.26, sr), pol(a, r), pol(a + gr * 0.26, sr));
    if (i < 6) P.push(pol(a + gr / 2, NOTCH[i]));
  });
  P.push(pol(250, 0.2));
  if (stem) P.push(xy(-0.035, -0.15), xy(-0.035, -stem), xy(0.035, -stem), xy(0.035, -0.15));
  else P.push(pol(270, 0.12));
  P.push(pol(290, 0.2));
  return P;
}
/** A leaf drawn on a canvas, its heart at cx, cy (y down). */
function leafPath(g, cx, cy, s, rot = 0, stem = 0) {
  g.beginPath(); leafPts(s, rot, stem).forEach(([x, y], i) => (i ? g.lineTo(cx + x, cy - y) : g.moveTo(cx + x, cy - y))); g.closePath();
}

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

const M = { m: 'metal' }, CL = { m: 'cloth' }, PL = { m: 'plain' }, GL = { m: 'gloss' }, WD = { m: 'wood' };
/** A maple leaf standing up, its heart at x, h, s tall from the heart; `lie` lays it flat, its tip to the back. */
const leaf = (x, h, z, s, c, { rot = 0, d = 1, m = 'cloth', lie = false, stem = 0 } = {}) => PR(x, h, z, leafPts(s, rot, stem), d, c, { m, lie });
/** A leaf's veins: the midrib and four side veins from the heart, and a stalk below. */
const veins = (x, h, z, s, c, { rot = 0, r = 0.3, stem = 0.45 } = {}) => {
  const at = (deg, k) => { const a = (deg + rot) * Math.PI / 180; return [x + Math.cos(a) * s * k, h + Math.sin(a) * s * k, z]; };
  const v = [[90, 0.85], [50, 0.68], [130, 0.68], [10, 0.56], [170, 0.56]].map(([d, k]) => RD([x, h, z], at(d, k), r, c, PL));
  return stem ? [...v, RD([x, h, z], at(270, stem), r * 1.5, c, PL)] : v;
};
const knob = (x, h, z, r = 0.8) => S(x, h, z + 0.4, r, r, r * 0.7, MP.brass, { m: 'metal', seg: 8 });
/** A small brass leaf pull. */
const pull = (x, h, z, s = 1.6) => leaf(x, h, z + 0.3, s, MP.brass, { d: 0.5, m: 'metal' });
const LEAFC = [MP.scarlet, MP.orange, MP.crimson, MP.gold];

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
  if (m === 'wood' && w > 3 && h > 3) {
    g.save(); g.clip(); g.globalAlpha *= 0.22; g.strokeStyle = sh(c, -2); g.lineWidth = 0.35;
    const along = w >= h, n = Math.min(9, Math.floor((along ? h : w) / 2.2));
    for (let i = 0; i < n; i++) {
      const f = (i + 0.5 + (hash(i, Math.round(x * 3), Math.round(y * 3)) - 0.5) * 0.6) / n, wob = (hash(i, 7, Math.round(w)) - 0.5) * 1.2;
      g.beginPath();
      if (along) { g.moveTo(x, y + h * f); g.quadraticCurveTo(x + w / 2, y + h * f + wob, x + w, y + h * f); }
      else { g.moveTo(x + w * f, y); g.quadraticCurveTo(x + w * f + wob, y + h / 2, x + w * f, y + h); }
      g.stroke();
    }
    g.restore();
  }
  if (h > 3 && w > 3) { g.save(); g.globalAlpha *= 0.35; g.fillStyle = sh(c, 2); g.fillRect(x + Math.min(r, w / 2) * 0.6, y + 0.3, w - Math.min(r, w / 2) * 1.2, 0.5); g.restore(); }
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
      case 'ring': {
        const ry = q.ry ?? q.r;
        if (side && !q.flat) { if (q.arc) break; rbx(cx - q.tr, cy - ry - q.tr, q.tr * 2, (ry + q.tr) * 2, q.tr, q.c, m); break; }
        const a0 = q.arc ? -(q.a0 + q.arc) : 0, a1 = q.arc ? -q.a0 : TAU;
        const path = (dy = 0) => { g.beginPath(); if (q.flat) g.ellipse(cx, cy + dy, q.r, q.r * 0.22, 0, 0, TAU); else g.ellipse(cx, cy + dy, q.r, ry, 0, a0, a1); };
        g.strokeStyle = m === 'metal' ? grad(g, cx - q.r, cy - ry, cx + q.r, cy + ry, q.c, m) : q.c; g.lineWidth = q.tr * 2; path(); g.stroke();
        g.save(); g.globalAlpha *= 0.45; g.strokeStyle = sh(q.c, 2); g.lineWidth = q.tr * 0.6;
        if (q.flat) { g.beginPath(); g.ellipse(cx, cy - q.tr * 0.4, q.r, q.r * 0.22, 0, Math.PI, TAU); } else path(-q.tr * 0.4);
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
        const xs = q.pts.map(p => p[0]), hs = q.pts.map(p => p[1]);
        if (q.lie) {
          const ends = side ? [U(0, q.z - Math.max(...hs)), U(0, q.z - Math.min(...hs))] : [U(q.x + Math.min(...xs)), U(q.x + Math.max(...xs))];
          rbx(Math.min(...ends), cy - q.d / 2, Math.abs(ends[1] - ends[0]), q.d, q.d / 2, q.c, m);
          break;
        }
        if (side) {
          const top = Math.max(...hs), bot = Math.min(...hs);
          rbx(cx - q.d / 2, b - q.h - top, q.d, top - bot, Math.min(1, q.d / 2), q.c, m);
          break;
        }
        poly(q.pts.map(([px, ph]) => [U(q.x + px), b - q.h - ph]), q.c, m);
        break;
      }
      case 'pic': g.save(); g.beginPath(); g.rect(cx - q.w / 2, cy - q.hh / 2, q.w, q.hh); g.clip(); q.fn(g, cx - q.w / 2, cy - q.hh / 2, q.w, q.hh); g.restore(); break;
    }
  }
}

/* ---------- pictures ---------- */

/** A round cream dial, a red leaf at twelve, fine marks, hands at ten past ten. Only the circle: the leaf shows round it. */
function dial(g, x, y, w, h) {
  const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2;
  g.fillStyle = MP.cream; g.beginPath(); g.arc(cx, cy, r * 0.98, 0, TAU); g.fill();
  g.strokeStyle = MP.woolD; g.lineWidth = r * 0.05; g.beginPath(); g.arc(cx, cy, r * 0.84, 0, TAU); g.stroke();
  g.fillStyle = MP.ink;
  for (let i = 1; i < 12; i++) { const a = i / 12 * TAU - Math.PI / 2, k = i % 3 ? 0.05 : 0.08; g.beginPath(); g.arc(cx + Math.cos(a) * r * 0.68, cy + Math.sin(a) * r * 0.68, r * k, 0, TAU); g.fill(); }
  g.fillStyle = MP.scarlet; leafPath(g, cx, cy - r * 0.64, r * 0.2); g.fill();
  g.strokeStyle = MP.ink; g.lineCap = 'round';
  for (const [a, len, lw] of [[-150, 0.4, 0.09], [-30, 0.58, 0.06]]) { const t = a * Math.PI / 180; g.lineWidth = r * lw; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(t) * r * len, cy + Math.sin(t) * r * len); g.stroke(); }
  g.fillStyle = MP.brass; g.beginPath(); g.arc(cx, cy, r * 0.08, 0, TAU); g.fill();
}
/** The folding screen's painting, one scene across the three panels (17 wide, 21 apart): a red maple on gold silk. */
function screenArt(i) {
  return (g, x, y, w, h) => {
    const s = w / 17;
    g.save(); g.translate(x - i * 21 * s, y); g.scale(s, s);
    const W = 59, H = h / s;
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#f7e8c6'); bg.addColorStop(0.65, '#f1d29c'); bg.addColorStop(1, '#e8bb78');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(214,150,90,0.35)'; g.beginPath(); g.moveTo(0, H * 0.72);
    [[10, 0.64], [22, 0.7], [36, 0.6], [48, 0.68], [59, 0.62]].forEach(([px, f]) => g.lineTo(px, H * f)); g.lineTo(W, H); g.lineTo(0, H); g.fill();
    g.fillStyle = 'rgba(190,110,60,0.45)'; g.fillRect(0, H * 0.9, W, H * 0.1);
    g.strokeStyle = MP.bark; g.lineCap = 'round';
    const branch = (pts, lw) => { g.lineWidth = lw; g.beginPath(); g.moveTo(...pts[0]); for (let k = 1; k < pts.length; k += 2) g.quadraticCurveTo(...pts[k], ...pts[k + 1]); g.stroke(); };
    branch([[16, H], [14, H * 0.7], [22, H * 0.5], [30, H * 0.32], [27, H * 0.18]], 3.2);
    branch([[22, H * 0.5], [12, H * 0.42], [6, H * 0.3]], 1.6);
    branch([[24, H * 0.44], [38, H * 0.36], [46, H * 0.22]], 1.6);
    branch([[38, H * 0.36], [50, H * 0.4], [56, H * 0.34]], 1);
    branch([[28, H * 0.26], [20, H * 0.14], [16, H * 0.08]], 1);
    const clumps = [[7, 0.28, 7], [17, 0.1, 7], [28, 0.16, 8], [44, 0.2, 8], [55, 0.32, 6], [34, 0.33, 7], [14, 0.4, 6]];
    clumps.forEach(([cx, fy, r], ci) => {
      for (let k = 0; k < 26; k++) {
        const a = hash(k, ci, 1) * TAU, d = Math.sqrt(hash(k, ci, 2)) * r;
        g.fillStyle = LEAFC[Math.floor(hash(k, ci, 3) * 4)];
        leafPath(g, cx + Math.cos(a) * d, H * fy + Math.sin(a) * d * 0.7, 1.3 + hash(k, ci, 4) * 0.8, hash(k, ci, 5) * 360); g.fill();
      }
    });
    for (let k = 0; k < 12; k++) { g.fillStyle = LEAFC[k % 4]; leafPath(g, 4 + hash(k, 9) * 52, H * (0.5 + hash(k, 8) * 0.45), 1.1, hash(k, 7) * 360); g.fill(); }
    g.restore();
  };
}
/** A pressed-leaf collection: six leaves on parchment, each with its label line. */
function pressed(g, x, y, w, h) {
  g.fillStyle = MP.paper; g.fillRect(x, y, w, h);
  g.fillStyle = 'rgba(160,120,70,0.12)'; for (let i = 0; i < 40; i++) g.fillRect(x + hash(i, 1) * w, y + hash(i, 2) * h, 0.6, 0.6);
  const cols = [MP.scarlet, MP.orange, MP.gold, MP.crimson, MP.rust, MP.mustard];
  for (let i = 0; i < 6; i++) {
    const cx = x + w * (0.22 + (i % 3) * 0.28), cy = y + h * (i < 3 ? 0.3 : 0.72), s = w * 0.11;
    g.fillStyle = cols[i]; leafPath(g, cx, cy, s, (hash(i, 3) - 0.5) * 30, 0.4); g.fill();
    g.strokeStyle = sh(cols[i], -2); g.lineWidth = s * 0.06; g.beginPath(); g.moveTo(cx, cy + s * 0.2); g.lineTo(cx, cy - s * 0.8); g.stroke();
    g.fillStyle = 'rgba(80,60,40,0.45)'; g.fillRect(cx - s * 0.7, cy + s * 0.65, s * 1.4, s * 0.12);
  }
}

/* ---------- the kinds ---------- */

/** What js/base-models-maple.js builds for each upright and wall kind: its parts, doors and default material. */
export const BUILT = {};
/** The rug's outline, a big leaf from above, in painted units (3 x 3 tiles, its stalk to the front). */
export const RUG = leafPts(60, 0, 0.42).map(([x, up]) => [48 + x, 64 - up]);

function piece(id, name, w, h, price, mat, parts, { doors = [], inside, ...rest } = {}) {
  BUILT[id] = { parts, doors, inside, mat };
  const all = [...parts, ...doors.flatMap(d => d.parts)];
  return { id, name, group: GROUP, holiday: 'maple', solo: true, w, h, price, ...rest, draw(x, b, vw, dir) { floorShadow(x, b, vw); paintParts(all, x, b, vw, dir, w * 32); } };
}
function wallPiece(id, name, w, price, mat, parts, rest = {}) {
  BUILT[id] = { parts, doors: [], mat };
  return { id, name, group: GROUP, holiday: 'maple', solo: true, w, h: 1, layer: 'wall', price, ...rest, wall(x) { paintParts(parts, x, 96, w * 32, 0, w * 32); } };
}

/** A Sawsbuck antler, s -1 the left one and 1 the right, its autumn leaves at the tips. */
const antler = (s) => {
  const X = (x) => 16 + s * (x - 16), c = s < 0 ? [MP.orange, MP.scarlet, MP.crimson, MP.gold] : [MP.scarlet, MP.orange, MP.gold, MP.crimson];
  return [
    RD([X(14), 59, 5], [X(11), 66, 4.5], 0.9, MP.antler), RD([X(11), 66, 4.5], [X(7), 74, 4], 0.75, MP.antler),
    RD([X(11), 66, 4.5], [X(5.5), 67, 4], 0.6, MP.antler), RD([X(7), 74, 4], [X(4.5), 79, 3.5], 0.55, MP.antler),
    RD([X(7), 74, 4], [X(10), 80, 4], 0.55, MP.antler),
    S(X(5.4), 67.4, 4.4, 3, 2.4, 2.4, c[0], { m: 'cloth', seg: 8 }), S(X(4.4), 79.6, 4, 3.2, 2.6, 2.4, c[1], { m: 'cloth', seg: 8 }),
    S(X(10), 80.6, 4.4, 3, 2.4, 2.4, c[2], { m: 'cloth', seg: 8 }), S(X(7.4), 76, 5.4, 2.6, 2, 2, c[3], { m: 'cloth', seg: 8 }),
    leaf(X(3.4), 72, 4.8, 2.6, c[1], { rot: s * -40, d: 0.5 }), leaf(X(12.6), 83.4, 4.8, 2.4, c[0], { rot: s * 20, d: 0.5 }),
  ];
};

export const MAPLE_KINDS = [
  // a bed in dark amber wood: a big scarlet leaf cut into the headboard, a rust quilt, a mustard knitted throw
  piece('mplbed', 'Maple leaf bed', 2, 2, 1450, 'wood', [
    ...[4, 60].flatMap(x => [
      B(x, 27, -29, 4.4, 54, 4.4, MP.wood), S(x, 55.6, -29, 2.6, 2.2, 2.6, MP.woodD, { seg: 8 }),
      B(x, 15, 29, 4.4, 30, 4.4, MP.wood), S(x, 31.4, 29, 2.4, 2, 2.4, MP.woodD, { seg: 8 }),
    ]),
    B(32, 31, -29, 52, 34, 3, MP.wood),
    B(32, 49.2, -29, 57, 3, 4.6, MP.woodD),
    leaf(32, 31.5, -27.3, 13.6, MP.woodD, { m: 'plain', d: 0.6 }),
    leaf(32, 32, -26.8, 12, MP.scarlet, { m: 'gloss', d: 1 }),
    ...veins(32, 32, -26.2, 12, MP.crimson),
    leaf(13, 40, -27, 5, MP.orange, { rot: 24, d: 0.8, m: 'gloss' }), leaf(51, 40, -27, 5, MP.gold, { rot: -24, d: 0.8, m: 'gloss' }),
    ...[4, 60].map(x => B(x, 12, 0, 3, 6, 54, MP.wood)),
    B(32, 17, 0, 54, 8, 54, MP.wool, { m: 'cloth', r: 1.5 }),
    B(32, 22.2, 5, 56, 2.6, 46, MP.rust, { m: 'cloth' }), B(32, 18, 28.4, 56, 9, 1.2, MP.rust, { m: 'cloth', r: 0.5 }),
    B(32, 23.8, 17, 57, 1.2, 12, MP.mustard, { m: 'cloth', r: 0.5 }), B(61.4, 18.6, 17, 1.2, 10, 12, MP.mustard, { m: 'cloth', r: 0.5 }),
    ...[13, 15, 19, 21].map(z => B(32, 24.45, z, 57, 0.2, 0.7, MP.mustardD, { m: 'plain', r: 0.05 })),
    ...[20, 44].map(x => S(x, 25, -21, 9, 3.4, 5, MP.wool, { m: 'cloth', seg: 12 })),
    leaf(32, 26.4, -16.5, 5, MP.orange, { d: 2.4 }),
    B(32, 14, 29.4, 52, 16, 3, MP.wood), B(32, 23, 29.4, 57, 2.4, 4, MP.woodD),
    leaf(32, 12.4, 31.2, 5.4, MP.scarlet, { d: 0.8, m: 'gloss' }),
    leaf(16, 13, 31.1, 3, MP.gold, { rot: 30, d: 0.6, m: 'gloss' }), leaf(48, 13, 31.1, 3, MP.orange, { rot: -30, d: 0.6, m: 'gloss' }),
  ]),

  // a side chair: turned legs, a scarlet leaf set in its back under a carved rail, a rust wool cushion
  piece('mplchair', 'Maple leaf chair', 1, 1, 320, 'wood', [
    ...[7, 25].flatMap(x => [B(x, 7, 8, 2.4, 14, 2.4, MP.wood), B(x, 22, -8, 2.6, 44, 2.6, MP.wood), S(x, 44.8, -8, 1.8, 1.4, 1.8, MP.woodD, { seg: 8 })]),
    B(16, 4, 8, 16, 1.4, 1.4, MP.woodD), ...[7, 25].map(x => B(x, 4, 0, 1.4, 1.4, 14, MP.woodD)),
    B(16, 14.6, 0, 24, 2.4, 20, MP.wood),
    B(16, 16.8, 1, 22, 2.4, 18, MP.rust, { m: 'cloth', r: 1.2 }),
    B(16, 20.4, -8, 18, 2.4, 2, MP.wood), B(16, 41, -8, 21, 4, 2.6, MP.wood),
    RD([16, 22, -8], [16, 29, -8], 0.7, MP.crimson, PL),
    leaf(16, 28.4, -8, 10, MP.scarlet, { d: 1.6, m: 'gloss' }),
    ...veins(16, 28.4, -7.1, 10, MP.crimson, { stem: 0 }),
    leaf(16, 43.2, -6.6, 2.4, MP.gold, { d: 0.6, m: 'gloss' }),
  ]),

  // a cosy armchair in rust wool, rolled arms, a mustard knitted throw over its back and an orange leaf pillow
  piece('mplarmchair', 'Maple leaf armchair', 1, 1, 640, 'cloth', [
    ...[[5, -10], [27, -10], [5, 10], [27, 10]].map(([x, z]) => C(x, 2, z, 1.4, 4, MP.woodD, { m: 'wood', rb: 1, seg: 8 })),
    B(16, 8, 0, 30, 8, 26, MP.rust, { r: 2 }),
    B(16, 13.6, 3, 22, 4, 20, MP.rustL, { r: 2 }),
    B(16, 24, -10, 28, 28, 6, MP.rust, { r: 3 }),
    ...[3, 29].flatMap(x => [B(x, 16, 0, 5, 12, 24, MP.rust, { r: 2 }), DS(x, 22, 0, 2.8, 24, MP.rust)]),
    leaf(11, 21, -5.6, 6, MP.orange, { d: 3 }),
    B(21, 31, -6.4, 12, 15, 1.2, MP.mustard, { r: 0.6 }), B(21, 38.4, -10, 12, 1.6, 8, MP.mustard, { r: 0.6 }),
    ...[17.5, 21, 24.5].map(x => B(x, 31, -5.7, 0.5, 14, 0.4, MP.mustardD, { m: 'plain', r: 0.1 })),
    ...[16.2, 18.6, 21, 23.4, 25.8].map(x => RD([x, 23.4, -5.8], [x, 21, -5.6], 0.35, MP.mustardD, PL)),
  ]),

  // a tweed sofa in rust: a carved wood crest with a scarlet leaf, wooden arm caps, a leaf pillow and a mustard one
  piece('mplsofa', 'Maple leaf sofa', 2, 1, 1250, 'cloth', [
    ...[[5, -10], [59, -10], [5, 10], [59, 10]].map(([x, z]) => S(x, 2, z, 2, 2, 2, MP.woodD, { m: 'wood', seg: 8 })),
    B(32, 8, 0, 60, 8, 26, MP.rust, { r: 2 }),
    ...[19, 45].map(x => B(x, 13.8, 3, 25, 4, 20, MP.rustL, { r: 2 })),
    B(32, 24, -10, 56, 26, 6, MP.rust, { r: 3 }),
    ...[19, 45].map(x => S(x, 24, -6.6, 11, 8, 3, MP.rustL, { seg: 12 })),
    B(32, 38, -11, 54, 3, 4, MP.wood, { m: 'wood' }),
    leaf(32, 37.4, -9.4, 7, MP.scarlet, { d: 1.5, m: 'gloss' }), ...veins(32, 37.4, -8.6, 7, MP.crimson, { r: 0.25, stem: 0 }),
    ...[3.5, 60.5].flatMap(x => [B(x, 14.5, 0, 6, 13, 25, MP.rust, { r: 2 }), B(x, 21.6, 0, 7, 1.6, 26, MP.wood, { m: 'wood', r: 0.6 })]),
    leaf(11, 18.6, -4.4, 5.6, MP.orange, { rot: 14, d: 3 }),
    S(53, 19, -4.4, 5, 4.8, 2.2, MP.mustard, { seg: 12 }), leaf(53, 19, -2.1, 2.4, MP.crimson, { d: 0.4, m: 'plain' }),
  ]),

  // a round tea table: a pumpkin teapot, two latte cups on saucers, a little pumpkin, a fallen leaf
  piece('mpltea', 'Maple leaf tea table', 1, 1, 520, 'wood', [
    ...[45, 135, 225, 315].map(deg => { const a = deg * Math.PI / 180; return C(16 + Math.cos(a) * 9.5, 8.5, Math.sin(a) * 9.5, 1.3, 17, MP.wood, { rb: 1, seg: 8 }); }),
    C(16, 16.2, 0, 11, 2.4, MP.woodD),
    C(16, 18.6, 0, 14, 2, MP.wood),
    leaf(16, 15.6, 11.1, 2.4, MP.scarlet, { d: 0.5, m: 'gloss' }),
    S(11.5, 23.2, -1, 4.6, 3.6, 4.6, MP.pumpkin, { m: 'gloss', seg: 12 }),
    ...[-2.4, 0, 2.4].map(dx => RD([11.5 + dx, 20, 3.4], [11.5 + dx * 1.2, 26.4, 3], 0.25, MP.pumpkinD, PL)),
    C(11.5, 27, -1, 1.6, 0.8, MP.pumpkinD, GL), RD([11.5, 27.4, -1], [12.4, 29.4, -1], 0.5, MP.stem, PL),
    RD([15.6, 23, -1], [18.6, 26.4, 0], 0.7, MP.pumpkin, GL), RG(6.6, 24, -1, 2.2, 0.55, MP.pumpkinD, GL),
    ...[[21.5, 5], [22.5, -5]].flatMap(([x, z]) => [
      C(x, 19.75, z, 3.2, 0.3, MP.china, GL), LA(x, 19.9, z, [[1.3, 0], [2.2, 0.5], [2.5, 3.4]], MP.china, { m: 'gloss', seg: 10 }),
      C(x, 23, z, 2.2, 0.2, MP.latte, PL), RG(x + 2.8, 21.6, z, 1, 0.35, MP.china, GL),
    ]),
    S(17, 21.1, 7, 2, 1.5, 2, MP.orange, { m: 'gloss', seg: 8 }), RD([17, 22.4, 7], [17.4, 23.6, 7], 0.35, MP.stem, PL),
    leaf(8, 19.75, 7, 2.6, MP.scarlet, { lie: true, d: 0.3, rot: 30 }),
  ]),

  // a writing desk: tapered legs, three drawers with brass leaf pulls, a hutch crowned with a leaf, an open book
  piece('mpldesk', 'Maple leaf desk', 2, 1, 1150, 'wood', [
    ...[[4, -11], [60, -11], [4, 11], [60, 11]].map(([x, z]) => C(x, 12.5, z, 1.6, 25, MP.wood, { rb: 1.1, seg: 8 })),
    B(32, 22.5, 0, 58, 5, 24, MP.wood),
    ...[14, 32, 50].flatMap(x => [B(x, 22.5, 12.3, 15, 3.8, 0.6, MP.woodL, { r: 0.4 }), pull(x, 22.6, 12.5, 1.4)]),
    B(32, 26.6, 0, 62, 2.2, 27, MP.woodD),
    B(32, 35.5, -11.5, 58, 15, 3, MP.wood),
    ...[4, 60].map(x => B(x, 35.5, -9.5, 2.4, 15, 6, MP.wood)),
    B(32, 35.6, -9.5, 54, 1, 6, MP.woodD), B(32, 43.6, -10, 60, 1.6, 7, MP.woodD),
    leaf(32, 45.2, -10.4, 5, MP.scarlet, { d: 1.4, m: 'gloss' }),
    ...[[8, MP.rust, 6], [10.6, MP.mustard, 5.4], [13, MP.crimson, 6.4], [15.4, MP.tweed, 5]].map(([x, c, hh]) => B(x, 36.1 + hh / 2, -9.6, 2.2, hh, 4.6, c, { m: 'gloss', r: 0.3 })),
    ...[[44, 30.2], [50, 30.4], [56, 30]].map(([x, h]) => B(x, h, -9.4, 4.6, 3.6, 0.8, MP.paper, { m: 'plain', r: 0.1 })),
    leaf(50, 38.4, -9.4, 2.4, MP.orange, { d: 0.4, m: 'plain', rot: 15 }),
    ...[20.5, 27.5].map(x => B(x, 28.1, 4, 7, 0.8, 10, MP.cream, { m: 'plain', r: 0.2 })),
    leaf(24, 28.6, 6, 3, MP.scarlet, { lie: true, d: 0.2, rot: -20 }),
    C(50, 28.7, 4, 1.8, 2, MP.ink, GL), RD([50, 29.5, 4], [53, 37, 2], 0.3, MP.cream, PL), S(52.2, 34.8, 2.6, 0.9, 3.4, 0.5, MP.rust, { m: 'cloth', seg: 8 }),
  ]),

  // a tall wardrobe: two doors with a carved scarlet leaf each, a drawer below, a leaf crest on the cornice
  piece('mplwardrobe', 'Maple leaf wardrobe', 2, 1, 1350, 'wood', [
    B(32, 3, 0, 62, 6, 30, MP.woodD),
    B(32, 46, -1, 58, 76, 26, MP.wood),
    B(32, 86, 0, 63, 4, 31, MP.woodD),
    leaf(32, 88.6, 12, 6, MP.scarlet, { d: 2, m: 'gloss' }),
    ...[17, 47].map((x, i) => leaf(x, 88.4, 13, 2.6, i ? MP.gold : MP.orange, { d: 1, m: 'gloss', rot: i ? -30 : 30 })),
    B(32, 13, 12.4, 54, 8, 0.8, MP.woodL, { r: 0.5 }), pull(20, 13, 12.8), pull(44, 13, 12.8),
  ], {
    doors: [6, 58].map((hx, i) => {
      const x = i ? 45 : 19, hand = i ? 34.2 : 29.8;
      return { hinge: [hx, 12], side: i ? -1 : 1, parts: [
        B(x, 50.5, 12.75, 25.6, 63, 1.5, MP.wood),
        B(x, 50.5, 13.6, 20, 54, 0.4, MP.woodD, { m: 'wood', r: 0.6 }),
        B(x, 50.5, 13.85, 18.6, 52.6, 0.3, MP.woodL, { m: 'wood', r: 0.6 }),
        leaf(x, 52, 14.3, 7.4, i ? MP.crimson : MP.scarlet, { d: 0.8, m: 'gloss', rot: i ? -12 : 12 }),
        leaf(x + (i ? 4 : -4), 33, 14.2, 3, i ? MP.orange : MP.gold, { d: 0.6, m: 'gloss', rot: i ? 30 : -30 }),
        RD([hand, 46, 14.3], [hand, 56, 14.3], 0.5, MP.brass, GL),
      ] };
    }),
    inside: { x: 32, h: 50, w: 50, hh: 60, z: 12 },
  }),

  // a chest of drawers on bun feet: four drawers with brass leaf pulls, a wool doily on top
  piece('mpldresser', 'Maple leaf dresser', 2, 1, 920, 'wood', [
    ...[[6, -10], [58, -10], [6, 10], [58, 10]].map(([x, z]) => S(x, 2.2, z, 2.4, 2.2, 2.4, MP.woodD, { seg: 8 })),
    B(32, 19, 0, 60, 30, 24, MP.wood),
    B(32, 35, 0.5, 63, 2, 26, MP.woodD),
    ...[[18.5, 28.2], [45.5, 28.2]].flatMap(([x, h]) => [B(x, h, 12.3, 25, 7, 0.8, MP.woodL, { r: 0.5 }), pull(x, h, 12.7)]),
    ...[18.6, 9].flatMap(h => [B(32, h, 12.3, 52, 7.6, 0.8, MP.woodL, { r: 0.5 }), pull(20, h, 12.7), pull(44, h, 12.7)]),
    leaf(32, 3.6, 12.2, 2.6, MP.scarlet, { d: 0.5, m: 'gloss' }),
    B(32, 36.2, 0, 22, 0.4, 14, MP.wool, { m: 'plain', r: 0.2 }),
  ]),

  // an open bookshelf: rust, mustard and crimson books, a jar of fallen leaves, a framed leaf, a candle, a pumpkin
  piece('mplshelf', 'Maple leaf bookshelf', 1, 1, 680, 'wood', [
    ...[3, 29].map(x => B(x, 34, 0, 3, 68, 22, MP.wood)),
    B(16, 34, -10.2, 26, 66, 1.4, MP.woodD),
    ...[2, 22, 42, 62].map(h => B(16, h, 0, 26, 2, 21, MP.wood)),
    B(16, 69, 0, 31, 2, 23, MP.woodD),
    leaf(16, 70, -8, 5.4, MP.scarlet, { d: 2, m: 'gloss' }),
    ...[[7, MP.rust, 15], [9.6, MP.mustard, 13], [12.2, MP.crimson, 16], [14.6, MP.tweed, 12]].map(([x, c, hh]) => B(x, 3 + hh / 2, -1, 2.4, hh, 14, c, { m: 'gloss', r: 0.3 })),
    S(22.5, 6.2, 1, 4, 3.2, 4, MP.pumpkin, { m: 'gloss', seg: 10 }), RD([22.5, 9, 1], [23, 10.6, 1], 0.4, MP.stem, PL),
    ...[[9.6, 27.5, 0, 2.4, MP.scarlet], [11.4, 29.4, 1, 2.2, MP.orange], [8.4, 30.6, -1, 2, MP.gold], [10.4, 25.4, 2, 2, MP.crimson]].map(([x, h, z, r, c]) => S(x, h, z, r, r * 0.7, r, c, { m: 'cloth', seg: 6 })),
    C(10, 28.5, 0, 3.8, 11, MP.china, { m: 'glass' }), C(10, 34.4, 0, 3.4, 1, MP.woodL, { m: 'wood' }),
    B(21.5, 30, -7, 8, 12, 1, MP.wood), B(21.5, 30, -6.4, 6.4, 10.4, 0.3, MP.paper, { m: 'plain', r: 0.1 }),
    leaf(21.5, 29.4, -6.1, 3.2, MP.scarlet, { d: 0.2, m: 'plain', stem: 0.4 }),
    ...[[11, 44.3, MP.crimson, 12, 2.6], [11, 46.7, MP.mustard, 11, 2.2]].map(([x, h, c, w, hh]) => B(x, h, 0, w, hh, 11, c, { m: 'gloss', r: 0.3 })),
    C(22, 47, 0, 2.6, 7, MP.amber, GL), C(22, 50.6, 0, 0.3, 0.8, MP.ink, PL),
    leaf(13, 48.6, 1, 2.6, MP.orange, { lie: true, d: 0.2, rot: 40 }),
  ]),

  // a floor lamp: a turned amber column, an amber drum shade with leaves showing dark against its glow
  piece('mpllamp', 'Maple leaf lamp', 1, 1, 460, 'wood', [
    LA(16, 0, 0, [[7.5, 0], [7.5, 1.4], [6, 2.4], [3, 3.6], [1.8, 4.4], [0, 4.4]], MP.woodD, { seg: 16 }),
    LA(16, 4, 0, [[1.8, 0], [2.6, 2], [1.4, 4], [1.3, 20], [2.4, 22], [1.4, 24], [1.3, 44], [2, 46], [1.2, 48]], MP.wood, { seg: 10 }),
    C(16, 52.6, 0, 1.4, 1.6, MP.brass, M),
    C(16, 58.5, 0, 7, 13, MP.shade, { m: 'glow', rb: 10.5 }),
    C(16, 65.2, 0, 7.3, 0.6, MP.rust, CL), C(16, 52, 0, 10.7, 0.8, MP.rust, CL),
    leaf(16, 56.4, 9.6, 3.6, MP.crimson, { d: 0.3, m: 'plain' }),
    ...[-1, 1].map(s => leaf(16 + s * 5.2, 60.6, 6.4, 2.3, MP.rust, { rot: -s * 25, d: 0.3, m: 'plain' })),
    S(16, 66.4, 0, 1, 1, 1, MP.brass, { m: 'metal', seg: 8 }),
  ], { glow: [MP.shade] }),

  // a three-panel folding screen: amber frames, one red maple painted across all three on gold silk
  piece('mplscreen', 'Maple leaf folding screen', 2, 1, 760, 'wood', [
    ...[[11, 4], [32, -4], [53, 4]].flatMap(([x, z], i) => [
      ...[-8, 8].map(dx => B(x + dx, 1.4, z, 2.4, 2.8, 3, MP.woodD, { r: 0.6 })),
      B(x, 34, z, 20.4, 60, 2, MP.wood),
      B(x, 65, z, 21.6, 2, 2.8, MP.woodD, { r: 0.6 }),
      leaf(x, 66, z + 1, 2.8, LEAFC[i], { d: 0.8, m: 'gloss' }),
      PC(x, 35, z + 1.05, 17, 52, screenArt(i)),
    ]),
    ...[21.5, 42.5].flatMap(x => [16, 52].map(h => B(x, h, 0, 1, 3, 8.4, MP.brass, { m: 'metal', r: 0.3 }))),
  ]),

  // a red maple bonsai in a slate pot on a low amber stand
  piece('mplbonsai', 'Maple leaf bonsai', 1, 1, 560, 'wood', [
    ...[[5, -7], [27, -7], [5, 7], [27, 7]].map(([x, z]) => B(x, 3.5, z, 2, 7, 2, MP.woodD)),
    B(16, 8, 0, 25, 2, 18, MP.woodD),
    B(16, 11.5, 0, 18, 5, 12, MP.pot, { m: 'gloss', r: 1.5 }), B(16, 14.2, 0, 19, 1, 13, MP.pot, { m: 'gloss', r: 0.4 }),
    B(16, 14.7, 0, 16.4, 0.6, 10.4, MP.moss, { m: 'cloth', r: 0.3 }),
    RD([15, 15, 0], [12, 22, 0], 1.6, MP.bark), RD([12, 22, 0], [16, 28, 0], 1.3, MP.bark), RD([16, 28, 0], [19, 33, 0], 1, MP.bark),
    RD([12, 22, 0], [7, 26, 0], 0.8, MP.bark), RD([16, 28, 0], [23, 29.4, 0], 0.8, MP.bark),
    S(7, 28, 0, 5, 3, 4.6, MP.scarlet, { m: 'cloth', seg: 10 }), S(24, 31, 1, 5.4, 3.2, 5, MP.crimson, { m: 'cloth', seg: 10 }),
    S(18, 36.5, 0, 6.6, 3.8, 5.6, MP.scarlet, { m: 'cloth', seg: 10 }), S(12, 33, -1, 5, 3, 4.4, MP.orange, { m: 'cloth', seg: 10 }),
    S(21, 38.6, 1.6, 3, 2, 3, MP.orange, { m: 'cloth', seg: 8 }), S(4.6, 29.6, 2, 2.4, 1.6, 2.4, MP.gold, { m: 'cloth', seg: 8 }),
    leaf(9, 9.3, 5, 1.8, MP.scarlet, { lie: true, d: 0.2, rot: 40 }), leaf(24, 9.3, -4, 1.6, MP.orange, { lie: true, d: 0.2, rot: -60 }),
  ]),

  // a heap of fallen maple leaves, scarlet to gold, a few loose ones on the floor
  piece('mplheap', 'Maple leaf heap', 1, 1, 220, 'cloth', [
    LA(16, 0, 0, [[14, 0], [13.5, 3], [11, 7], [6.5, 10], [0, 11.5]], MP.scarlet, { seg: 14 }),
    S(9, 6, 4, 6, 4, 5, MP.orange, { seg: 10 }), S(22, 7, -2, 6, 4.4, 5, MP.gold, { seg: 10 }), S(15, 9.6, 2, 5, 3.6, 4, MP.crimson, { seg: 10 }),
    leaf(8, 11.6, 3, 3.4, MP.gold, { rot: 30, d: 0.5 }), leaf(20, 13.4, 1, 3.8, MP.scarlet, { rot: -20, d: 0.5 }),
    leaf(14, 14.6, -2, 3, MP.orange, { rot: 10, d: 0.5 }), leaf(25, 9, 5, 2.6, MP.crimson, { rot: -50, d: 0.5 }),
    leaf(5, 6.4, 8, 2.4, MP.gold, { rot: 60, d: 0.5 }), leaf(17, 8, 8.6, 2.6, MP.orange, { rot: -10, d: 0.5 }),
    leaf(4, 0.2, 12, 2.4, MP.scarlet, { lie: true, d: 0.3, rot: 20 }), leaf(27, 0.2, 11, 2.2, MP.gold, { lie: true, d: 0.3, rot: -70 }),
    leaf(28, 0.2, -11, 2, MP.orange, { lie: true, d: 0.3, rot: 150 }),
  ]),

  // a round stone basin of still water, maple leaves floating on it, a bamboo spout and ladle, moss at its foot
  piece('mplpond', 'Maple leaf pond stone', 1, 1, 480, 'plain', [
    LA(16, 0, 0, [[12.5, 0], [13.4, 2.6], [13, 7], [11.6, 9.6], [9.8, 10], [9.4, 9], [0, 9]], MP.stone, { m: 'gloss', seg: 16 }),
    C(16, 9.1, 0, 9.5, 0.3, MP.water, GL),
    leaf(13, 9.4, 2, 2.6, MP.scarlet, { lie: true, d: 0.2, rot: 30 }), leaf(19.5, 9.4, -2, 2.2, MP.orange, { lie: true, d: 0.2, rot: -50 }),
    leaf(16.5, 9.4, 5.5, 2, MP.gold, { lie: true, d: 0.2, rot: 100 }), leaf(11, 9.4, -3.6, 1.8, MP.crimson, { lie: true, d: 0.2, rot: 200 }),
    S(6, 6, 7.6, 3, 2.2, 2.4, MP.moss, { m: 'cloth', seg: 8 }), S(25, 4, 9, 2.6, 2, 2, MP.moss, { m: 'cloth', seg: 8 }),
    RD([27, 0, -10], [27, 17, -10], 1.3, MP.bamboo, GL), C(27, 9, -10, 1.5, 0.5, MP.bambooD, GL), RD([27, 16, -10], [21, 13.4, -5.5], 0.9, MP.bamboo, GL),
    RD([7, 10.6, -7], [21, 10.6, -9], 0.4, MP.bamboo, GL), C(7.6, 11, -7, 1.4, 1.6, MP.bamboo, GL),
    leaf(4, 0.2, 12, 2.4, MP.scarlet, { lie: true, d: 0.3, rot: 20 }), leaf(28, 0.2, 13, 2, MP.gold, { lie: true, d: 0.3, rot: -70 }),
  ]),

  // a giant scarlet maple leaf held up on its stalk like an umbrella, stood in an amber umbrella stand
  piece('mplumbrella', 'Maple leaf umbrella', 1, 1, 380, 'wood', [
    C(16, 7.5, 0, 6, 15, MP.woodL, { rb: 5.2, seg: 16 }), C(16, 13.6, 0, 6.15, 1, MP.brass, M), C(16, 2.6, 0, 5.4, 1, MP.brass, M),
    leaf(16, 7.4, 5.9, 2.6, MP.scarlet, { d: 0.5, m: 'gloss' }),
    RD([15.2, 14.6, 0], [16, 58, 0], 0.9, MP.stem, GL),
    leaf(16, 60, 0, 21, MP.scarlet, { d: 1.4, m: 'gloss' }),
    ...veins(16, 60, 0.9, 21, MP.crimson, { r: 0.45, stem: 0 }),
    leaf(6, 0.2, 10, 2.6, MP.orange, { lie: true, d: 0.3, rot: 30 }), leaf(26, 0.2, 9, 2.2, MP.gold, { lie: true, d: 0.3, rot: -40 }),
  ]),

  // a tall honey-glazed vase of red maple branches
  piece('mplbranches', 'Maple leaf branch vase', 1, 1, 420, 'gloss', [
    LA(16, 0, 0, [[4, 0], [6.5, 3], [7, 10], [5, 17], [2.8, 21], [3.2, 24], [3.8, 25]], MP.amber, { seg: 14 }),
    C(16, 9, 0, 7.05, 1.2, MP.crimson, GL),
    ...[[[16, 24, 0], [9, 48, 1]], [[16, 24, 0], [23, 52, -1]], [[16, 24, 0], [15, 62, 0]], [[11.6, 40, 0.6], [5, 46, 0]], [[21, 41, -0.5], [27, 44, 0]], [[15.4, 48, 0], [20, 58, 1]]].map(([a, b], i) => RD(a, b, i < 3 ? 0.7 : 0.5, MP.bark, WD)),
    ...[[9, 48, 2, 3.2, 20], [6, 45, 1, 2.6, 60], [23, 52, 0, 3.4, -20], [27, 44.6, 1, 2.6, -60], [15, 62, 1, 3.4, 0], [20, 58.4, 2, 3, -25],
      [12, 43, 2, 2.4, 40], [19.6, 46.6, 1.6, 2.6, -40], [13, 55, 2, 2.6, 25], [10.4, 36, 1.6, 2.2, 50], [22.4, 38.6, 1.4, 2.2, -50], [17.6, 51, -1.4, 2.4, 10]]
      .map(([x, h, z, s, rot], i) => leaf(x, h, z, s, LEAFC[i % 4], { rot, d: 0.4 })),
  ]),

  // a Deerling floor cushion, autumn form: a fawn head with cream muzzle and its orange flower crowned with leaves
  piece('mpldeerling', 'Deerling maple cushion', 1, 1, 380, 'cloth', [
    S(16, 7.6, 0, 12.6, 7.6, 11.6, MP.fawn, { seg: 16 }),
    DS(16, 6.2, 11, 4.6, 0.6, MP.fur, { ry: 3, m: 'cloth' }),
    ...[11.6, 20.4].flatMap(x => [DS(x, 9.6, 10.4, 1.5, 0.6, MP.ink, { ry: 1.9, m: 'gloss' }), DS(x - 0.5, 10.4, 10.8, 0.5, 0.3, '#ffffff', PL)]),
    S(16, 7.4, 11.6, 1.1, 0.8, 0.6, MP.ink, { m: 'gloss', seg: 8 }),
    ...[[9, 13.6, -4], [22, 13.8, -5], [16, 14.6, -7], [6, 11.6, -7], [26, 11.4, -2]].map(([x, h, z]) => S(x, h, z, 2, 0.8, 1.6, MP.fur, { seg: 6 })),
    ...[-1, 1].flatMap(s => {
      const X = (x) => 16 + s * (x - 16), pts = [[0, 0], [-4.5, 1.8], [-6, 4.4], [-3.4, 5], [-0.6, 3.4]].map(([x, h]) => [x * s, h]);
      return [PR(X(6.5), 11.4, -1, pts, 2, MP.fawn), PR(X(6.5), 11.8, 0.2, pts.map(([x, h]) => [x * 0.7, h * 0.7 + 0.4]), 0.4, MP.fur)];
    }),
    ...[0, 1, 2, 3, 4].map(i => { const a = Math.PI / 2 + i / 5 * TAU; return S(16 + Math.cos(a) * 2.4, 17.6 + Math.sin(a) * 2.4, -1, 1.9, 1.9, 1.4, MP.bloom, { seg: 8 }); }),
    S(16, 17.6, 0, 1.2, 1.2, 1, MP.gold, { m: 'gloss', seg: 8 }),
    leaf(12.2, 16, -2.2, 2.2, MP.scarlet, { rot: 40, d: 0.5 }), leaf(19.8, 16, -2.2, 2.2, MP.scarlet, { rot: -40, d: 0.5 }),
  ]),

  // a dress form wearing a dress Leavanny sewed from maple leaves, a green leaf sash; Sewaddle at its foot in a leaf hood
  piece('mplleavanny', 'Leavanny maple dress form', 1, 1, 680, 'wood', [
    ...[-90, 30, 150].flatMap(deg => {
      const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
      return [RD([16 + c * 1.4, 10, s * 1.4], [16 + c * 10, 0.8, s * 10], 0.9, MP.woodD), S(16 + c * 10, 0.9, s * 10, 1.2, 0.9, 1.2, MP.woodD, { seg: 8 })];
    }),
    RD([16, 8, 0], [16, 14, 0], 1, MP.wood),
    LA(16, 13, 0, [[11, 0], [10, 3], [8.4, 8], [6.8, 13], [6.2, 14]], MP.scarlet, { m: 'cloth', seg: 14 }),
    LA(16, 26.5, 0, [[6.4, 0], [5.4, 4], [5, 7], [6.2, 11.5], [6.4, 14], [5, 16.5], [2.6, 18], [1.2, 18.6], [0, 18.6]], MP.wool, { m: 'cloth', seg: 14 }),
    C(16, 46.4, 0, 1, 3, MP.wood), S(16, 48.6, 0, 1.6, 1.4, 1.6, MP.woodD, { seg: 8 }),
    C(16, 31.6, 0, 5.5, 1.6, MP.green, CL), leaf(16, 31.2, 5.8, 2.2, MP.green, { d: 0.6 }),
    ...[[7, 14.6, 7.6, MP.orange], [11.5, 13.8, 9.6, MP.gold], [16, 13.4, 10.6, MP.crimson], [20.5, 13.8, 9.6, MP.orange], [25, 14.6, 7.6, MP.gold]]
      .map(([x, h, z, c], i) => leaf(x, h, z, 3.2, c, { rot: 180 + (i - 2) * 8, d: 0.5 })),
    ...[[10.4, 21, 6.6, MP.gold], [16, 20.6, 9, MP.orange], [21.6, 21, 6.6, MP.crimson]].map(([x, h, z, c], i) => leaf(x, h, z, 2.8, c, { rot: 180 + (i - 1) * 10, d: 0.5 })),
    leaf(13.4, 38, 6.1, 2.4, MP.scarlet, { rot: 30, d: 0.5 }), leaf(18.6, 38, 6.1, 2.4, MP.orange, { rot: -30, d: 0.5 }),
    S(25.5, 3.2, 10, 3, 3.2, 2.8, MP.sew, { m: 'cloth', seg: 10 }),
    ...[24.4, 26.6].map(x => DS(x, 3.8, 12.6, 0.5, 0.3, MP.ink, PL)),
    leaf(25.5, 5.4, 9.2, 3.6, MP.scarlet, { d: 0.8 }),
  ]),

  // a small night table: a drawer with a brass leaf pull and a cupboard door carved with a leaf
  piece('mplnight', 'Maple leaf night table', 1, 1, 340, 'wood', [
    ...[[5, -7], [27, -7], [5, 7], [27, 7]].map(([x, z]) => C(x, 2.5, z, 1.4, 5, MP.woodD, { rb: 1, seg: 8 })),
    B(16, 14, 0, 24, 18, 20, MP.wood),
    B(16, 24, 0, 27, 1.6, 22, MP.woodD),
    B(16, 19.4, 10.4, 20, 5.2, 0.6, MP.woodL, { r: 0.4 }), pull(16, 19.4, 10.6, 1.4),
    B(16, 10.6, 10.4, 20, 10, 0.6, MP.woodL, { r: 0.4 }),
    leaf(16, 9.6, 10.9, 3.4, MP.scarlet, { d: 0.5, m: 'gloss' }), knob(23.4, 10.6, 10.6, 0.6),
  ]),

  // a leaf-shaped wall mirror: a crimson frame round a mirror leaf, two little leaves on its stalk
  wallPiece('mplmirror', 'Maple leaf mirror', 1, 520, 'gloss', [
    leaf(16, 52, 0.8, 17, MP.crimson, { d: 1.6, m: 'gloss' }),
    leaf(16, 52.8, 1.8, 14, MP.mirror, { d: 0.4, m: 'gloss' }),
    RD([16, 49, 0.9], [16, 41.6, 0.9], 1, MP.crimsonD, GL),
    leaf(12.6, 44.6, 1.9, 3, MP.orange, { rot: 40, d: 0.6 }), leaf(19.4, 44.6, 1.9, 3, MP.gold, { rot: -40, d: 0.6 }),
  ]),

  // a leaf-shaped wall clock: a scarlet leaf, a round cream dial in a brass ring, a brass pendulum below
  wallPiece('mplclock', 'Maple leaf wall clock', 1, 460, 'gloss', [
    RD([16, 50, 0.9], [16, 39.4, 0.9], 0.3, MP.brass, M), DS(16, 38.6, 1, 2, 0.5, MP.brass, M),
    leaf(16, 54, 1.4, 16.5, MP.scarlet, { d: 2.2, m: 'gloss' }),
    ...veins(16, 54, 2.6, 16.5, MP.crimson, { r: 0.3, stem: 0 }),
    PC(16, 56.6, 2.75, 9.2, 9.2, dial),
    RG(16, 56.6, 2.7, 4.75, 0.45, MP.brass, M),
  ]),

  // a garland of maple leaves on a twine swag, tied with rust bows
  wallPiece('mplgarland', 'Maple leaf garland', 2, 340, 'cloth', [
    RG(32, 82, 1, 28, 0.4, MP.tweed, { a0: Math.PI + 0.1, arc: Math.PI - 0.2, ry: 14 }),
    ...Array.from({ length: 9 }, (_, i) => {
      const a = Math.PI + 0.32 + i * (Math.PI - 0.64) / 8, x = 32 + Math.cos(a) * 28, h = 82 + Math.sin(a) * 14;
      return leaf(x, h - 0.6, 1.4 + (i % 2) * 0.4, 4.4 + (i % 2) * 0.6, LEAFC[i % 4], { rot: 180 + (hash(i, 2) - 0.5) * 30, d: 0.5 });
    }),
    ...[4.4, 59.6].flatMap(x => [S(x, 81, 1.6, 2.6, 1.6, 1.2, MP.rust, { seg: 8 }), RD([x, 80.4, 1.6], [x + (x < 32 ? -1 : 1), 75.6, 1.6], 0.5, MP.rust)]),
  ]),

  // a framed collection of pressed maple leaves on parchment
  wallPiece('mplpressed', 'Pressed maple leaf frame', 1, 400, 'wood', [
    B(16, 58, 0.6, 26, 30, 1.2, MP.wood),
    B(16, 58, 1.3, 22.6, 26.6, 0.3, MP.woodD, { r: 0.3 }),
    PC(16, 58, 1.5, 21, 25, pressed),
    leaf(16, 72.6, 1.4, 2.6, MP.scarlet, { d: 0.6, m: 'gloss' }),
  ]),

  // a Sawsbuck head mount, autumn form: antlers hung with red and gold leaves, on an amber shield
  wallPiece('mplsawsbuck', 'Sawsbuck maple mount', 1, 950, 'cloth', [
    PR(16, 40, 0.8, [[-5, 0], [0, -2], [5, 0], [9, 4], [10, 18], [7, 24], [0, 26], [-7, 24], [-10, 18], [-9, 4]], 1.6, MP.woodL, WD),
    leaf(16, 41.4, 1.8, 2.6, MP.scarlet, { d: 0.4, m: 'gloss' }),
    S(16, 48, 4, 6, 4, 4, MP.fur, { seg: 10 }),
    ...[-1, 1].map(s => PR(16 + s * 4.6, 57, 5, [[0, 0], [6, 2.6], [7, 4.2], [3.6, 3.6]].map(([x, h]) => [x * s, h]), 1.4, MP.deer)),
    S(16, 54, 5.4, 4.6, 5.6, 4.6, MP.deer, { seg: 12 }),
    S(16, 50.2, 8.6, 2.8, 2.6, 2.8, MP.fur, { seg: 10 }),
    S(16, 50.4, 11.2, 1, 0.8, 0.7, MP.ink, { m: 'gloss', seg: 6 }),
    ...[13.6, 18.4].flatMap(x => [DS(x, 55.4, 8.8, 1, 0.4, MP.ink, { ry: 1.2, m: 'gloss' }), DS(x - 0.3, 55.8, 9.1, 0.35, 0.2, '#ffffff', PL)]),
    ...antler(-1), ...antler(1),
  ]),

  // a big maple leaf rug: scarlet warming to gold at its heart, crimson veins, a stitched edge
  { id: 'mplrug', name: 'Maple leaf rug', group: GROUP, holiday: 'maple', solo: true, w: 3, h: 3, layer: 'rug', price: 780, high: 0.04, side: 'c', flat() {
    const g = ctx(), cx = 48, cy = 64, s = 60;
    const path = (k) => { g.beginPath(); RUG.forEach(([x, y], i) => { const px = cx + (x - cx) * k, py = cy + (y - cy) * k; i ? g.lineTo(px, py) : g.moveTo(px, py); }); g.closePath(); };
    path(1); g.fillStyle = MP.crimsonD; g.fill();
    const t = g.createRadialGradient(cx, cy - 6, 2, cx, cy - 6, s);
    t.addColorStop(0, MP.gold); t.addColorStop(0.25, MP.orange); t.addColorStop(0.6, MP.scarlet); t.addColorStop(1, MP.crimson);
    path(0.95); g.fillStyle = t; g.fill();
    g.save(); path(0.95); g.clip();
    g.fillStyle = 'rgba(255,240,220,0.14)'; for (let x = 0; x < 96; x += 2) for (let y = 0; y < 96; y += 2) if (hash(x, y) < 0.18) g.fillRect(x, y, 1, 1);
    g.strokeStyle = MP.crimsonD; g.lineCap = 'round';
    for (const [deg, k] of [[90, 0.86], [50, 0.7], [130, 0.7], [10, 0.6], [170, 0.6], [-30, 0.4], [210, 0.4]]) {
      const a = deg * Math.PI / 180, ex = cx + Math.cos(a) * s * k, ey = cy - Math.sin(a) * s * k;
      g.lineWidth = 1.6; g.beginPath(); g.moveTo(cx, cy); g.lineTo(ex, ey); g.stroke();
      g.lineWidth = 0.7;
      for (const f of [0.4, 0.65]) for (const sd of [-1, 1]) {
        const bx = cx + (ex - cx) * f, by = cy + (ey - cy) * f, b = a + sd * 0.7;
        g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + Math.cos(b) * s * 0.1, by - Math.sin(b) * s * 0.1); g.stroke();
      }
    }
    g.restore();
    g.setLineDash([1.6, 1.2]); g.strokeStyle = MP.gold; g.lineWidth = 0.6; path(0.88); g.stroke(); g.setLineDash([]);
    oval(cx, cy, 2.4, 2, MP.crimsonD);
  } },
];
