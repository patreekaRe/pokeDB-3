/* base-furniture-elegant.js  -  the Elegant set (furniture expansion session e, 2026-10-17): a rococo salon, Animal
   Crossing's Elegant series. Glossy white lacquer edged in gold, cabriole legs on gilt scroll toes, pale blue tufted
   upholstery with rose accents, shells and C-scrolls carved in the gold. All solo, fixed colours. Kept apart from the
   Antique set (dark carved walnut): here everything is white and gold.
   An upright piece is a list of parts in painted units (32 a tile), as in js/base-furniture-antique.js: `x` across from
   the left of its front, `h` up from the floor (a wall piece's from the foot of its strip), `z` out to the front from its
   middle (a wall piece's from the wall). They're painted here from any side, and js/base-models-elegant.js builds the
   same list as 3D parts (BUILT), so picture and model agree. A `ring` can be oval (`ry`) or a part arc (`a0`, `arc`,
   counter-clockwise from the right) for the C-scrolls and the swag. A `pic` part (a dial, the spinet's pastoral, the
   screen's silk) is painted on the front only, and the model wears that crop of the painting. The wardrobe's doors
   swing (`doors`, `inside`). The rug is an oval, painted from above. */

import { sh, oval, ovalShade, floorShadow, ctx, hash, glass as glassPane } from './base-paint.js';

export const EL = {
  white: '#f3eee3', whiteL: '#fbf8f1', whiteD: '#ddd3c0', gold: '#d6ae48', goldD: '#a8822c', goldL: '#f0d688',
  blue: '#a7c5de', blueD: '#7d9fc0', blueL: '#cfe0ee', rose: '#e8afbd', roseD: '#c78596', roseL: '#f7dbe1',
  cream: '#fbf4e6', mirror: '#cfe1ea', ink: '#2c2a38', flame: '#ffe29a', shade: '#fde8e6', leaf: '#6f9a62',
  leafD: '#4f7c48', bloom: '#e07a92', bloomL: '#f4a9ba', china: '#fbf8f3', black: '#2a2630', marble: '#f1ece6',
  string: '#f4e8c8', bird: '#86c6ee', sky: '#bcd8ee', grass: '#a8c890', hill: '#8fb27e', paper: '#f5ecd8',
};
const GROUP = 'Elegant';
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

const M = { m: 'metal' }, CL = { m: 'cloth' }, PL = { m: 'plain' }, GL = { m: 'gloss' };
/** A thin gold bead along a face. */
const trim = (x, h, z, w, hh = 0.8, d = 0.4) => B(x, h, z, w, hh, d, EL.gold, { m: 'metal', r: 0.05 });
/** A white cabriole leg from under a rail at `top` down to a gilt scroll toe, its knee out along sx, sz, a gold shell on it. */
const cab = (x, z, top, sx, sz, c = EL.white) => {
  const k = [x + sx * 1.8, top * 0.66, z + sz * 1.8], a = [x - sx * 0.3, top * 0.18 + 0.6, z - sz * 0.3], f = [x + sx * 0.7, 1.1, z + sz * 0.7];
  return [
    RD([x, top, z], k, 1.3, c, GL), RD(k, a, 0.85, c, GL), RD(a, f, 0.75, c, GL),
    S(f[0], 1.1, f[2], 1.3, 1.1, 1.3, EL.gold, { m: 'metal', seg: 8 }),
    S(k[0] + sx * 0.8, k[1] + 0.6, k[2] + sz * 0.8, 1, 1.1, 1, EL.gold, { m: 'metal', seg: 6 }),
  ];
};
/** A gilt scallop shell s across, standing on h, d deep. */
const shell = (x, h, z, s, d = 1, c = EL.gold) => PR(x, h, z, Array.from({ length: 11 }, (_, i) => {
  const a = Math.PI * i / 10, r = i % 2 ? s * 0.8 : s;
  return [Math.cos(a) * r, Math.sin(a) * r * 0.9];
}), d, c, M);
/** A pair of gold C-scrolls curling away from x, the crest's flourish. */
const scrolls = (x, h, z, spread, r = 2.2, tr = 0.45) => [-1, 1].map(s => RG(x + s * spread, h, z, r, tr, EL.gold, { m: 'metal', a0: s < 0 ? Math.PI * 0.3 : Math.PI * 1.3, arc: Math.PI * 1.4 }));
const knob = (x, h, z, r = 0.8) => S(x, h, z + 0.4, r, r, r * 0.7, EL.gold, { m: 'metal', seg: 8 });
/** Three white cabriole legs splayed from a centre post: back, front left, front right. */
const tripod = (x, top, reach) => [-90, 30, 150].flatMap(deg => {
  const a = deg * Math.PI / 180, cx = Math.cos(a), cz = Math.sin(a);
  const p0 = [x + cx * 1.6, top, cz * 1.6], p1 = [x + cx * reach * 0.62, top * 0.5, cz * reach * 0.62], p2 = [x + cx * reach, 1.3, cz * reach];
  return [RD(p0, p1, 1.2, EL.white, GL), RD(p1, p2, 0.8, EL.white, GL), S(p2[0], 1.2, p2[2], 1.3, 1.2, 1.3, EL.gold, { m: 'metal', seg: 8 })];
});
/** A pink rose bloom with a leaf beside it. */
const rose = (x, h, z, r = 1.8, c = EL.bloom) => S(x, h, z, r, r * 0.9, r, c, { m: 'cloth', seg: 8 });
const leafy = (x, h, z, r = 1.6) => S(x, h, z, r, r * 0.45, r * 0.7, EL.leaf, { m: 'cloth', seg: 6 });
/** A row of tufting buttons on a face at z. */
const tufts = (rows, z, c = EL.blueD) => rows.flatMap(([x0, x1, h, n]) => Array.from({ length: n }, (_, i) => DS(x0 + (n > 1 ? i * (x1 - x0) / (n - 1) : 0), h, z, 0.7, 0.5, c, { m: 'plain', seg: 6 })));

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
        if (side) {
          const hs = q.pts.map(p => p[1]), top = Math.max(...hs), bot = Math.min(...hs);
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

/** A round enamel dial on the white case, gilt numerals at the quarters and fine marks between, hands at ten past ten. */
function dial(g, x, y, w, h) {
  const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2;
  g.fillStyle = EL.white; g.fillRect(x, y, w, h);
  g.fillStyle = EL.whiteL; g.beginPath(); g.arc(cx, cy, r * 0.96, 0, TAU); g.fill();
  g.strokeStyle = EL.goldD; g.lineWidth = r * 0.04; g.beginPath(); g.arc(cx, cy, r * 0.82, 0, TAU); g.stroke();
  g.fillStyle = EL.ink; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `bold ${r * 0.26}px Georgia, serif`;
  ['XII', 'III', 'VI', 'IX'].forEach((t, i) => { const a = i / 4 * TAU - Math.PI / 2; g.fillText(t, cx + Math.cos(a) * r * 0.62, cy + Math.sin(a) * r * 0.62); });
  g.fillStyle = EL.goldD;
  for (let i = 0; i < 12; i++) if (i % 3) { const a = i / 12 * TAU - Math.PI / 2; g.beginPath(); g.arc(cx + Math.cos(a) * r * 0.66, cy + Math.sin(a) * r * 0.66, r * 0.05, 0, TAU); g.fill(); }
  g.strokeStyle = EL.ink; g.lineCap = 'round';
  for (const [a, len, lw] of [[-150, 0.4, 0.08], [-30, 0.58, 0.05]]) { const t = a * Math.PI / 180; g.lineWidth = r * lw; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(t) * r * len, cy + Math.sin(t) * r * len); g.stroke(); }
  g.fillStyle = EL.gold; g.beginPath(); g.arc(cx, cy, r * 0.07, 0, TAU); g.fill();
}
/** The spinet's painted panel: a pastel pastoral, a blossom tree, a little Mareep on the hill. */
function pastoral(g, x, y, w, h) {
  const sky = g.createLinearGradient(0, y, 0, y + h); sky.addColorStop(0, '#a9cbe8'); sky.addColorStop(0.7, '#f4dbe0'); sky.addColorStop(1, '#f8ecd8');
  g.fillStyle = sky; g.fillRect(x, y, w, h);
  g.fillStyle = 'rgba(255,255,255,0.85)';
  for (const [fx, fy, s] of [[0.2, 0.25, 1], [0.62, 0.18, 0.8], [0.84, 0.32, 0.7]]) for (const dx of [-1, 0, 1]) { g.beginPath(); g.ellipse(x + w * fx + dx * w * 0.025 * s, y + h * fy - (dx ? 0 : h * 0.03), w * 0.04 * s, h * 0.07 * s, 0, 0, TAU); g.fill(); }
  const hill = (pts, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(x, y + h); pts.forEach(([fx, fy]) => g.lineTo(x + fx * w, y + fy * h)); g.lineTo(x + w, y + h); g.fill(); };
  hill([[0, 0.66], [0.25, 0.56], [0.5, 0.64], [0.78, 0.52], [1, 0.6]], EL.hill);
  hill([[0, 0.8], [0.3, 0.72], [0.6, 0.78], [1, 0.7]], EL.grass);
  g.fillStyle = '#9a7a5a'; g.fillRect(x + w * 0.2, y + h * 0.5, w * 0.018, h * 0.3);
  for (const [fx, fy, r] of [[0.21, 0.42, 0.11], [0.16, 0.5, 0.08], [0.27, 0.5, 0.08]]) { g.fillStyle = EL.bloomL; g.beginPath(); g.ellipse(x + w * fx, y + h * fy, w * r * 0.5, h * r * 1.4, 0, 0, TAU); g.fill(); }
  g.fillStyle = '#ffffff'; for (let i = 0; i < 7; i++) { g.beginPath(); g.arc(x + w * (0.16 + hash(i, 3) * 0.12), y + h * (0.36 + hash(i, 4) * 0.18), w * 0.008, 0, TAU); g.fill(); }
  const mx = x + w * 0.66, my = y + h * 0.66;
  g.fillStyle = '#fff8ea'; for (const [dx, dy] of [[-1, 0], [1, 0], [0, -0.8], [0, 0.4]]) { g.beginPath(); g.arc(mx + dx * w * 0.022, my + dy * h * 0.05, w * 0.03, 0, TAU); g.fill(); }
  g.fillStyle = '#f2c84a'; g.beginPath(); g.ellipse(mx + w * 0.05, my - h * 0.02, w * 0.02, h * 0.06, 0, 0, TAU); g.fill();
  g.fillStyle = '#3a3a48'; g.fillRect(mx - w * 0.03, my + h * 0.06, w * 0.008, h * 0.08); g.fillRect(mx + w * 0.022, my + h * 0.06, w * 0.008, h * 0.08);
  g.fillStyle = '#7ab0e0'; g.beginPath(); g.arc(mx + w * 0.072, my - h * 0.06, w * 0.008, 0, TAU); g.fill();
}
/** Rose silk for the screen: gold-thread vines, white and pink blossoms. */
function silk(seed) {
  return (g, x, y, w, h) => {
    const bg = g.createLinearGradient(x, y, x + w, y + h); bg.addColorStop(0, EL.roseL); bg.addColorStop(1, EL.rose);
    g.fillStyle = bg; g.fillRect(x, y, w, h);
    g.strokeStyle = EL.goldD; g.lineWidth = w * 0.025;
    g.beginPath(); g.moveTo(x + w * 0.5, y + h);
    for (let i = 1; i <= 6; i++) g.quadraticCurveTo(x + w * (i % 2 ? 0.2 : 0.8), y + h * (1 - (i - 0.5) / 6), x + w * 0.5, y + h * (1 - i / 6));
    g.stroke();
    for (let i = 0; i < 9; i++) {
      const fx = x + w * (0.18 + hash(i, seed) * 0.64), fy = y + h * (0.06 + i * 0.105), r = w * (0.06 + hash(i, seed, 1) * 0.04), c = i % 3 ? EL.whiteL : EL.bloom;
      g.fillStyle = EL.leaf; g.beginPath(); g.ellipse(fx + r * 1.2, fy + r * 0.3, r * 0.9, r * 0.4, 0.5, 0, TAU); g.fill();
      g.fillStyle = c; for (let p = 0; p < 5; p++) { const a = p / 5 * TAU; g.beginPath(); g.arc(fx + Math.cos(a) * r * 0.6, fy + Math.sin(a) * r * 0.6, r * 0.55, 0, TAU); g.fill(); }
      g.fillStyle = EL.gold; g.beginPath(); g.arc(fx, fy, r * 0.35, 0, TAU); g.fill();
    }
  };
}

/* ---------- the kinds ---------- */

/** What js/base-models-elegant.js builds for each upright and wall kind: its parts, doors and default material. */
export const BUILT = {};
/** The rug's outline: ellipses [cx, cy, rx, ry] in painted units, from above. */
export const RUGS = { elgrug: [[48, 32, 46, 30]] };

function piece(id, name, w, h, price, mat, parts, { doors = [], inside, ...rest } = {}) {
  BUILT[id] = { parts, doors, inside, mat };
  const all = [...parts, ...doors.flatMap(d => d.parts)];
  return { id, name, group: GROUP, solo: true, w, h, price, ...rest, draw(x, b, vw, dir) { floorShadow(x, b, vw); paintParts(all, x, b, vw, dir, w * 32); } };
}
function wallPiece(id, name, w, price, mat, parts, rest = {}) {
  BUILT[id] = { parts, doors: [], mat };
  return { id, name, group: GROUP, solo: true, w, h: 1, layer: 'wall', price, ...rest, wall(x) { paintParts(parts, x, 96, w * 32, 0, w * 32); } };
}

const POST = [[2.4, 0], [2.4, 3], [1.6, 5], [2.2, 8], [1.3, 11], [1.2, 84], [1.8, 86], [1.2, 89], [1.5, 91], [0, 92]];
/** The bed's arched headboard, about its foot, and its tufted inset. */
const HEAD_ARCH = [[-27, 0], [27, 0], [27, 36], [22, 44], [12, 48], [0, 50], [-12, 48], [-22, 44], [-27, 36]];
const HEAD_PAD = [[-22, 12], [22, 12], [22, 34], [18, 40], [10, 43.5], [0, 45], [-10, 43.5], [-18, 40], [-22, 34]];
/** The sofa's camelback, about its foot. */
const CAMEL = [[-30, 0], [30, 0], [30, 16], [26, 20], [18, 22], [10, 25], [0, 28], [-10, 25], [-18, 22], [-26, 20], [-30, 16]];
const CAMEL_PAD = CAMEL.map(([x, h]) => [x * 0.92, h ? h - 2 : 1.5]);
/** The bergère's rounded back. */
const BERGERE = [[-14, 0], [14, 0], [14, 20], [11.5, 27], [6, 31], [0, 32], [-6, 31], [-11.5, 27], [-14, 20]];
const BERGERE_PAD = [[-12, 2], [12, 2], [12, 19.5], [9.8, 25.5], [5, 28.8], [0, 29.8], [-5, 28.8], [-9.8, 25.5], [-12, 19.5]];
/** A scalloped apron, hanging from 0 down to `dip` at the middle. */
const apron = (half, dip) => [[-half, 0], [half, 0], [half * 0.85, -dip * 0.5], [half * 0.3, -dip * 0.6], [0, -dip], [-half * 0.3, -dip * 0.6], [-half * 0.85, -dip * 0.5]];
/** A crest arched over a top, `rise` high. */
const crest = (half, rise) => [[-half, 0], [half, 0], [half * 0.8, rise * 0.35], [half * 0.4, rise * 0.55], [half * 0.15, rise * 0.8], [0, rise], [-half * 0.15, rise * 0.8], [-half * 0.4, rise * 0.55], [-half * 0.8, rise * 0.35]];

/** The harp's neck, column top to soundbox top. */
const NECK = [[8, 84], [13, 79], [18, 77.5], [23, 73], [26.5, 65]];
const neckAt = (x) => { for (let i = 1; i < NECK.length; i++) { const [x0, h0] = NECK[i - 1], [x1, h1] = NECK[i]; if (x <= x1) return h0 + (h1 - h0) * (x - x0) / (x1 - x0); } return NECK[NECK.length - 1][1]; };

export const ELEGANT_KINDS = [
  // a canopy bed: slender white posts banded in gold, pale rose drapes, an arched tufted headboard, a blue coverlet
  piece('elgbed', 'Rococo canopy bed', 2, 2, 1600, 'gloss', [
    ...[[4, -28], [60, -28], [4, 28], [60, 28]].flatMap(([x, z]) => [LA(x, 0, z, POST, EL.white, { seg: 10 }), C(x, 8, z, 2.3, 1, EL.gold, M), C(x, 86, z, 1.9, 1, EL.gold, M)]),
    B(32, 93, -28, 58, 3, 3, EL.white), B(32, 93, 28, 58, 3, 3, EL.white), B(4, 93, 0, 3, 3, 53, EL.white), B(60, 93, 0, 3, 3, 53, EL.white),
    B(32, 95.6, 0, 62, 1.4, 62, EL.roseL, { m: 'cloth', r: 0.6 }),
    B(32, 89.5, 29.8, 60, 7, 1, EL.roseL, { m: 'cloth', r: 0.4 }), trim(32, 93.2, 30.4, 61, 1.2, 0.8), trim(32, 86.2, 30.4, 60, 0.8, 0.6),
    B(32, 89.5, -29.8, 60, 7, 1, EL.roseL, { m: 'cloth', r: 0.4 }),
    ...[1.8, 62.2].map(x => B(x, 89.5, 0, 1, 7, 58, EL.roseL, { m: 'cloth', r: 0.4 })),
    PR(32, 94.5, 30, crest(13, 7), 1.6, EL.white), shell(32, 96.6, 31, 3.2, 1), ...scrolls(32, 97.6, 31, 7.5, 2),
    ...[8.5, 55.5].flatMap(x => [B(x, 54, -26, 7, 66, 3, EL.roseL, { m: 'cloth', r: 1.4 }), B(x, 44, -26, 7.6, 1.6, 3.6, EL.gold, { m: 'metal', r: 0.5 })]),
    ...[7.5, 56.5].flatMap(x => [B(x, 70, 26.5, 5, 32, 2.6, EL.roseL, { m: 'cloth', r: 1.2 }), B(x, 54, 26.5, 5.4, 1.4, 3.2, EL.gold, { m: 'metal', r: 0.4 }), B(x, 46, 26.5, 3.6, 15, 2.4, EL.roseL, { m: 'cloth', r: 1.2 })]),
    PR(32, 10, -28.5, HEAD_ARCH, 3, EL.white),
    PR(32, 10, -26.8, HEAD_PAD, 0.8, EL.blue, CL),
    ...tufts([[17, 47, 32, 4], [22, 42, 40, 3], [12, 52, 26.4, 5]], -26.2),
    trim(32, 21.6, -26.8, 46, 0.8, 0.4),
    shell(32, 59, -28, 4, 1.2), ...scrolls(32, 57.5, -27.6, 8, 2.4),
    B(32, 17, 28.5, 52, 14, 3, EL.white, { r: 1.2 }), PR(32, 24, 28.5, crest(26, 5.5), 3, EL.white),
    B(32, 17, 30.2, 44, 9, 0.6, EL.blue, { m: 'cloth', r: 0.5 }), trim(32, 23.6, 30.2, 52, 0.8, 0.5),
    shell(32, 26.5, 30.2, 2.6, 0.8),
    B(32, 10, 0, 56, 6, 54, EL.white),
    trim(32, 7.4, 27.2, 56, 0.8, 0.4),
    B(32, 17, 0, 54, 8, 54, EL.cream, { m: 'cloth', r: 1.5 }),
    B(32, 22, 5, 55, 2.4, 44, EL.blue, { m: 'cloth' }), B(32, 22.2, -18, 55, 2.6, 5, EL.cream, { m: 'cloth' }),
    ...[20, 44].map(x => S(x, 24.4, -22, 9, 3.2, 4.6, EL.roseL, { m: 'cloth' })),
    S(32, 24.6, -16, 4.6, 2.6, 2, EL.rose, { m: 'cloth', seg: 12 }),
  ]),

  // a medallion-back side chair: cabriole legs, an oval tufted blue back in a white ring, a gilt shell crest
  piece('elgchair', 'Medallion side chair', 1, 1, 340, 'gloss', [
    ...cab(7, 8, 13, 0, 1), ...cab(25, 8, 13, 0, 1),
    ...[7, 25].map(x => RD([x, 0, -10], [x + (x < 16 ? 0.5 : -0.5), 14, -9], 1.1, EL.white)),
    B(16, 14, 0, 24, 3, 20, EL.white), trim(16, 13.4, 10.1, 22),
    B(16, 16.6, 0.8, 23, 2.6, 19.5, EL.blue, { m: 'cloth', r: 1.2 }),
    RD([9, 15.5, -9.5], [10.2, 23, -10], 1, EL.white), RD([23, 15.5, -9.5], [21.8, 23, -10], 1, EL.white),
    DS(16, 30, -10, 7, 1.2, EL.blue, { ry: 9.4, m: 'cloth' }),
    RG(16, 30, -10, 7.6, 1, EL.white, { ry: 10, m: 'gloss' }),
    RG(16, 30, -9.3, 6.3, 0.35, EL.gold, { ry: 8.6, m: 'metal' }),
    ...tufts([[13, 19, 34, 2], [16, 16, 30, 1], [13, 19, 26, 2]], -9.3),
    shell(16, 39.4, -10, 3.2, 1.2), ...scrolls(16, 38.6, -9.6, 5, 1.8, 0.4),
  ]),

  // a bergère: an upholstered armchair, white frame and gilt beading, open padded arms, a rounded tufted back
  piece('elgarmchair', 'Bergère armchair', 1, 1, 640, 'gloss', [
    ...cab(5, 9, 7, -0.4, 1), ...cab(27, 9, 7, 0.4, 1),
    ...[5, 27].map(x => RD([x, 0, -10.5], [x, 7, -10], 1.1, EL.white)),
    B(16, 9.5, 1, 28, 6, 25, EL.white), trim(16, 9.5, 13.6, 28), shell(16, 5.8, 13.4, 2.2, 0.6),
    B(16, 14.2, 3, 24, 3.4, 20, EL.blue, { m: 'cloth', r: 1.4 }),
    PR(16, 12, -10.6, BERGERE, 2, EL.white), PR(16, 12, -8.6, BERGERE_PAD, 2.4, EL.blue, CL),
    ...tufts([[11, 21, 36, 3], [8.5, 23.5, 29, 4], [11, 21, 22, 3]], -7.3),
    shell(16, 43.2, -10.2, 3.2, 1.2),
    ...[2.6, 29.4].flatMap(x => [
      B(x, 19.6, -1, 3, 1.2, 21, EL.white, { r: 0.5 }), B(x, 21, -1, 3.4, 1.8, 18, EL.blue, { m: 'cloth', r: 0.8 }),
      RD([x, 12, 10], [x, 19.6, 9.5], 1.1, EL.white), S(x, 19.8, 10.2, 1.3, 1.3, 1.1, EL.gold, { m: 'metal', seg: 8 }),
      B(x, 15.5, -6, 2.6, 8, 8, EL.blue, { m: 'cloth', r: 1 }),
    ]),
  ]),

  // a camelback sofa: tufted blue, a white frame with a gilt crest, rolled arms, two rose cushions
  piece('elgsofa', 'Tufted camelback sofa', 2, 1, 1350, 'gloss', [
    ...cab(6, 9, 7, -0.4, 1), ...cab(58, 9, 7, 0.4, 1),
    ...[6, 58].map(x => RD([x, 0, -10.5], [x, 7, -10], 1.1, EL.white)),
    B(32, 9.5, 1, 60, 6, 25, EL.white), trim(32, 9.5, 13.6, 60), PR(32, 6.6, 13.2, apron(12, 3), 0.8, EL.white), shell(32, 5.6, 13.7, 2.2, 0.5),
    B(32, 14.4, 3, 52, 3.6, 21, EL.blue, { m: 'cloth', r: 1.4 }),
    PR(32, 12, -10.6, CAMEL, 2, EL.white), PR(32, 12, -8.6, CAMEL_PAD, 2.4, EL.blue, CL),
    ...tufts([[14, 50, 30, 6], [17, 47, 23.5, 5], [24, 40, 34.5, 3]], -7.3),
    shell(32, 40, -10.2, 3.4, 1.2), ...scrolls(32, 39, -9.6, 6.5, 2),
    ...[3.4, 60.6].flatMap(x => [
      B(x, 15.5, 1, 4.4, 8, 23, EL.white, { r: 1 }), DS(x, 20.6, 0, 2.6, 23, EL.blue, CL),
      S(x, 20.6, 11.8, 1.5, 1.5, 0.9, EL.gold, { m: 'metal', seg: 8 }),
    ]),
    S(12, 21, -4, 5, 4.6, 2.2, EL.rose, { m: 'cloth', seg: 12 }), S(52, 21, -4, 5, 4.6, 2.2, EL.rose, { m: 'cloth', seg: 12 }),
  ]),

  // a chaise longue: a scrolled high end, a sloping half back, a rose bolster, all tufted blue on gilt-toed legs
  piece('elgchaise', 'Rococo chaise longue', 2, 1, 1150, 'gloss', [
    ...cab(6, 8, 6, -0.4, 1), ...cab(58, 8, 6, 0.4, 1),
    ...[6, 58].map(x => RD([x, 0, -10], [x, 6, -9.5], 1.1, EL.white)),
    B(32, 8.5, 0, 60, 5, 24, EL.white), trim(32, 8.5, 12.1, 60), shell(32, 5.4, 12, 2.2, 0.5),
    B(35, 13, 1, 52, 3.6, 21, EL.blue, { m: 'cloth', r: 1.4 }),
    PR(6, 11, 0, [[-4.5, 0], [6, 0], [5, 4], [2.5, 9], [0.5, 15], [0, 20], [-1.5, 23], [-4.5, 23.5], [-5.5, 20], [-4.5, 14]], 22, EL.blue, CL),
    PR(6, 11, 11.6, [[-5, 0], [6.6, 0], [5.6, 4], [3, 9], [1, 15], [0.5, 20], [-1.2, 23.6], [-4.6, 24.2], [-6, 20], [-5, 14]], 1.2, EL.white),
    RG(3.5, 32, 12.4, 2.4, 0.5, EL.gold, { m: 'metal', a0: -0.6, arc: Math.PI * 1.5 }),
    PR(26, 11, -10.6, [[-20, 0], [20, 0], [20, 4], [14, 6], [4, 9], [-6, 12.5], [-14, 16], [-20, 19]], 2, EL.white),
    PR(26, 12, -9.2, [[-18, 0], [18, 0], [18, 2.5], [12, 4.5], [3, 7], [-6, 10], [-13, 13], [-18, 15.5]], 1, EL.blue, CL),
    ...tufts([[14, 22, 20, 2], [26, 34, 17, 2]], -8.5),
    trim(26, 11.2, -9, 40),
    DS(14, 17.2, 1, 3, 19, EL.rose, CL), ...[-8.7, 10.7].map(z => DS(14, 17.2, z, 1.2, 0.6, EL.gold, M)),
  ]),

  // a round pedestal table: a white top edged in gold on a turned column and three cabriole feet
  piece('elgtable', 'Gilded pedestal table', 1, 1, 540, 'gloss', [
    ...tripod(16, 7, 12),
    LA(16, 6, 0, [[3.2, 0], [3.4, 2], [2.2, 4], [2.6, 7], [1.7, 9], [1.7, 15], [2.6, 17], [2, 19]], EL.white, { seg: 12 }),
    C(16, 13.2, 0, 2.3, 0.8, EL.gold, M), C(16, 6.4, 0, 3.4, 0.8, EL.gold, M),
    C(16, 24.4, 0, 9, 1.4, EL.white), C(16, 24.2, 0, 13.4, 1.6, EL.white),
    C(16, 25.7, 0, 14.5, 1.6, EL.white),
    RG(16, 25.5, 0, 14.5, 0.5, EL.gold, { flat: true, m: 'metal' }),
    C(16, 26.55, 0, 6, 0.15, EL.goldL, PL),
  ]),

  // a writing bureau: cabriole legs, gilt-trimmed drawers, a blue leather top, a pigeonhole gallery under a scroll crest
  piece('elgdesk', 'Rococo writing bureau', 2, 1, 1250, 'gloss', [
    ...cab(5, 10, 22, -0.4, 1), ...cab(59, 10, 22, 0.4, 1), ...cab(5, -10, 22, -0.4, -0.4), ...cab(59, -10, 22, 0.4, -0.4),
    B(32, 24.5, 0, 58, 6, 26, EL.white),
    PR(32, 21.5, 13.1, apron(26, 3), 0.8, EL.white),
    ...[[14, 16], [32, 16], [50, 16]].flatMap(([x, w], i) => [B(x, 24.5, 13.3, w, 4.4, 0.8, EL.whiteL, { r: 0.5 }), knob(x, 24.5, 13.7, i === 1 ? 0.9 : 0.75)]),
    shell(32, 19, 13.4, 2.4, 0.5),
    B(32, 28.4, 0.5, 62, 1.8, 29, EL.white, { r: 0.6 }), trim(32, 27.6, 15, 62),
    B(32, 29.4, 3, 46, 0.3, 18, EL.blue, { m: 'cloth', r: 0.2 }),
    B(32, 36.5, -11, 54, 12, 6, EL.white),
    ...[[12, 5], [22, 5], [32, 5], [42, 5], [52, 5]].map(([x, w]) => B(x, 37, -7.9, w + 3, 9, 0.3, EL.blueL, { m: 'plain', r: 0.05 })),
    ...[17, 27, 37, 47].map(x => B(x, 37, -7.7, 0.8, 10, 0.6, EL.white, { r: 0.2 })),
    trim(32, 42.8, -7.8, 54), trim(32, 30.6, -7.8, 54),
    ...[[12, 38], [27, 37.4], [42, 38.2]].map(([x, h], i) => B(x, h, -8.4, 4.8, 4.2 + i % 2, 1.4, EL.paper, { r: 0.05, m: 'plain' })),
    PR(32, 42.5, -11, crest(27, 6), 6, EL.white), shell(32, 46.5, -7.8, 3, 0.8), ...scrolls(32, 45.6, -7.8, 7, 2),
    C(48, 30.8, 6, 1.8, 2.4, EL.gold, M), C(48, 32.2, 6, 1, 0.5, EL.ink, PL),
    RD([48, 32, 6], [51.5, 40, 4], 0.45, EL.whiteL, PL), RD([50.5, 37.5, 4.5], [52.2, 41.5, 3.6], 0.9, EL.whiteL, PL),
    B(24, 29.8, 6, 10, 0.3, 12, EL.paper, { r: 0.05, m: 'plain' }),
  ]),

  // a white wardrobe: gilt pilasters and cornice, a crested pediment, doors with gold-framed panels, a drawer below
  piece('elgwardrobe', 'Rococo wardrobe', 2, 1, 1450, 'gloss', [
    ...[[6, -10], [58, -10], [6, 10], [58, 10]].map(([x, z]) => S(x, 2, z, 2.4, 2, 2.4, EL.gold, { m: 'metal', seg: 8 })),
    B(32, 6.5, 0, 62, 5, 30, EL.white), trim(32, 8.6, 15.2, 62),
    B(32, 46, -1, 58, 74, 26, EL.white, { r: 1.2 }),
    ...[4.5, 59.5].flatMap(x => [B(x, 46, 11.5, 3.5, 74, 2, EL.white, { r: 0.6 }), B(x, 46, 12.6, 1, 66, 0.4, EL.gold, { m: 'metal', r: 0.05 })]),
    B(32, 84.5, 0, 63, 3, 31, EL.white), trim(32, 83, 15.6, 63),
    PR(32, 86, 0, crest(30, 7), 26, EL.white),
    shell(32, 88, 13.2, 3.6, 1), ...scrolls(32, 87.6, 13.2, 9, 2.4),
    B(32, 14.5, 12.4, 52, 9, 0.8, EL.whiteL, { r: 0.5 }), trim(32, 14.5, 12.9, 46, 7, 0.2), B(32, 14.5, 13, 45, 6.2, 0.4, EL.whiteL, { r: 0.4 }),
    knob(20, 14.5, 13.2), knob(44, 14.5, 13.2),
  ], {
    doors: [6, 58].map((hx, i) => {
      const x = i ? 45 : 19, hand = i ? 34 : 30;
      return { hinge: [hx, 12], side: i ? -1 : 1, parts: [
        B(x, 50, 12.75, 25.6, 60, 1.5, EL.white, { r: 0.8 }),
        B(x, 54, 13.5, 20, 44, 0.3, EL.gold, { m: 'metal', r: 0.6 }),
        B(x, 54, 13.75, 18.6, 42.6, 0.4, EL.whiteL, { r: 0.6 }),
        DS(x, 54, 14, 3.6, 0.3, EL.blueL, { ry: 5 }), RG(x, 54, 14, 3.6, 0.3, EL.gold, { ry: 5, m: 'metal' }),
        B(x, 27, 13.6, 18, 8, 0.4, EL.gold, { m: 'metal', r: 0.4 }), B(x, 27, 13.85, 16.8, 6.8, 0.4, EL.whiteL, { r: 0.4 }),
        RD([hand, 46, 14.1], [hand, 54, 14.1], 0.5, EL.gold, M),
      ] };
    }),
    inside: { x: 32, h: 50, w: 50, hh: 58, z: 12 },
  }),

  // a serpentine commode on cabriole legs: two gilt-trimmed drawers, scroll pulls, a shell on the apron, a marble top
  piece('elgdresser', 'Gilded commode', 2, 1, 950, 'gloss', [
    ...cab(5, 8, 8, -0.5, 1), ...cab(59, 8, 8, 0.5, 1),
    ...[5, 59].map(x => RD([x, 0, -10.5], [x, 8, -9.5], 1.2, EL.white)),
    B(32, 18.5, 0, 60, 21, 24, EL.white, { r: 1.2 }),
    PR(32, 8, 11.6, apron(28, 3.4), 1, EL.white), shell(32, 6.6, 12.2, 2.6, 0.6),
    ...[[23.5, 6.4], [14, 6.4]].flatMap(([h, hh]) => [
      B(32, h, 12.3, 54, hh + 1, 0.4, EL.gold, { m: 'metal', r: 0.4 }), B(32, h, 12.6, 52.6, hh, 0.6, EL.whiteL, { r: 0.5 }),
      ...[18, 46].map(x => RG(x, h - 0.6, 13.1, 2, 0.4, EL.gold, { m: 'metal', a0: Math.PI, arc: Math.PI })), DS(32, h, 13, 1, 0.3, EL.gold, M),
    ]),
    ...[3, 61].map(x => B(x, 18.5, 12, 1, 18, 0.4, EL.gold, { m: 'metal', r: 0.05 })),
    B(32, 30, 0, 62, 2, 26, EL.marble, { m: 'gloss', r: 0.6 }), trim(32, 29, 13.1, 62),
  ]),

  // a vanity: a little table on cabriole legs, an oval mirror in a gilt frame between gold uprights, scent and powder
  piece('elgvanity', 'Oval-mirror vanity', 1, 1, 880, 'gloss', [
    ...cab(4, 8, 18, -0.4, 1), ...cab(28, 8, 18, 0.4, 1), ...cab(4, -8, 18, -0.4, -0.4), ...cab(28, -8, 18, 0.4, -0.4),
    B(16, 20, 0, 28, 5, 20, EL.white), PR(16, 17.5, 10.1, apron(12, 2.4), 0.6, EL.white),
    B(16, 20, 10.2, 14, 3.4, 0.6, EL.whiteL, { r: 0.4 }), knob(16, 20, 10.5, 0.7),
    B(16, 23.2, 0, 30, 1.6, 22, EL.white, { r: 0.6 }), trim(16, 22.5, 11.1, 30),
    ...[5, 27].map(x => RD([x, 24, -8], [x, 40, -8], 0.7, EL.gold, M)),
    DS(16, 40, -8, 10.4, 1.4, EL.white, { ry: 13 }),
    RG(16, 40, -7.2, 10, 0.5, EL.gold, { ry: 12.6, m: 'metal' }),
    DS(16, 40, -7.1, 9, 0.4, EL.mirror, { ry: 11.6, m: 'gloss' }),
    shell(16, 52.4, -7.4, 3, 1), ...scrolls(16, 52, -7.2, 4.6, 1.6, 0.4),
    LA(8, 24, 2, [[1.8, 0], [2.2, 1.5], [1.6, 3.4], [0.6, 4], [0.6, 5], [1, 5.4], [0, 6]], EL.roseL, { m: 'gloss', seg: 12 }),
    C(22.5, 25, 3, 3, 2, EL.rose, GL), S(22.5, 26.4, 3, 1.4, 0.7, 1.4, EL.gold, { m: 'metal', seg: 8 }),
  ]),

  // an étagère: three white shelves edged in gold, a blue back, a crest; teacups, a gilt plate and a rose vase
  piece('elgshelf', 'Gilded étagère', 1, 1, 700, 'gloss', [
    ...[[3, -8], [29, -8], [3, 8], [29, 8]].flatMap(([x, z]) => [B(x, 35, z, 2.6, 66, 2.6, EL.white, { r: 0.8 }), S(x, 1.2, z, 1.5, 1.2, 1.5, EL.gold, { m: 'metal', seg: 8 })]),
    B(16, 36, -8.6, 24, 60, 0.6, EL.blueL, { m: 'cloth', r: 0.2 }),
    ...[6, 24, 42, 60].flatMap(h => [B(16, h, 0, 28, 1.4, 18, EL.white, { r: 0.5 }), trim(16, h, 9.2, 28, 0.8, 0.3)]),
    PR(16, 68, -8, crest(13, 6), 2, EL.white), shell(16, 69.6, -6.8, 2.6, 0.8), ...scrolls(16, 69, -6.8, 5.6, 1.6, 0.4),
    PR(16, 23.3, 8.4, apron(13, 2.2), 0.6, EL.white), PR(16, 5.3, 8.4, apron(13, 2.2), 0.6, EL.white),
    DS(10, 12, -6, 4.6, 0.6, EL.china, GL), RG(10, 12, -5.6, 4.2, 0.35, EL.gold, M), DS(10, 12, -5.5, 1.8, 0.2, EL.bloom, PL),
    C(21, 9, 0, 3.4, 4.4, EL.blue, { rb: 2.6, m: 'gloss' }), C(21, 11.4, 0, 2.4, 0.5, EL.gold, M),
    ...[[9, 0], [16, 2], [23, -1]].flatMap(([x, z]) => [LA(x, 24.7, z, [[1.2, 0], [2.2, 1], [2.7, 3]], EL.china, { m: 'gloss', seg: 10 }), C(x, 24.8, z, 3, 0.3, EL.gold, M)]),
    LA(16, 42.7, -1, [[1.6, 0], [3, 2], [3.2, 4.5], [1.6, 7.5], [1.3, 8.6], [2, 9.6]], EL.white, { m: 'gloss', seg: 12 }), C(16, 46, -1, 3.2, 0.6, EL.gold, M),
    ...[[14.2, 53.6, -1], [17.6, 54.2, 0], [16, 55.8, -2]].map(([x, h, z]) => rose(x, h, z, 1.8)), ...[[12.4, 52, -1], [19.8, 52.2, -1]].map(([x, h, z]) => leafy(x, h, z)),
    S(9, 45, 0, 2.4, 2.4, 2.4, EL.goldL, { m: 'metal', seg: 10 }), S(23, 44.4, 0, 2, 1.8, 2, EL.bloomL, { m: 'gloss', seg: 10 }),
  ]),

  // a candelabra floor lamp: a gilt column on a white foot, three curling arms, candles under little pale shades
  piece('elglamp', 'Gilded candelabra lamp', 1, 1, 460, 'metal', [
    LA(16, 0, 0, [[7, 0], [7, 1.2], [5.4, 2.4], [2.6, 4.4], [1.6, 6.5], [0, 6.5]], EL.white, { m: 'gloss', seg: 16 }),
    C(16, 1, 0, 7.1, 0.8, EL.gold, M),
    LA(16, 6, 0, [[1.5, 0], [2.4, 4], [1.2, 8], [1.1, 45], [2, 47], [1.3, 49]], EL.gold, { seg: 10 }),
    LA(16, 22, 0, [[1.2, 0], [2.8, 2], [2.6, 4.4], [1.2, 6.4]], EL.white, { m: 'gloss', seg: 12 }),
    S(16, 44, 0, 2, 1.6, 2, EL.white, { m: 'gloss', seg: 10 }),
    ...[-1, 1].flatMap(s => [
      RD([16, 44, 0], [16 + s * 6, 45.5, 0], 0.65, EL.gold), RD([16 + s * 6, 45.5, 0], [16 + s * 8.5, 50.5, 0], 0.65, EL.gold),
      RG(16 + s * 5.4, 42.2, 0, 1.6, 0.35, EL.gold, { a0: s < 0 ? 0 : Math.PI, arc: Math.PI }),
      C(16 + s * 8.5, 51.4, 0, 1.8, 1.2, EL.gold), C(16 + s * 8.5, 54.4, 0, 0.9, 5, EL.cream, GL),
      S(16 + s * 8.5, 57.6, 0, 0.8, 1.3, 0.8, EL.flame, { m: 'glow', seg: 8 }),
      LA(16 + s * 8.5, 56, 0, [[3.4, 0], [2.6, 3.4], [1.4, 5.4]], EL.shade, { m: 'glow', seg: 12 }),
      S(16 + s * 8.5, 49.4, 0, 0.6, 1, 0.6, EL.goldL, { seg: 6 }),
    ]),
    C(16, 55.6, 0, 1.8, 1.2, EL.gold), C(16, 58.6, 0, 0.9, 5, EL.cream, GL),
    S(16, 61.8, 0, 0.8, 1.3, 0.8, EL.flame, { m: 'glow', seg: 8 }),
    LA(16, 60.2, 0, [[3.6, 0], [2.8, 3.6], [1.4, 5.8]], EL.shade, { m: 'glow', seg: 12 }),
    S(16, 66.6, 0, 0.8, 1, 0.8, EL.gold, { seg: 6 }),
  ], { glow: [EL.shade, EL.flame] }),

  // a gilt mantel clock on a white column: a waisted case, a round enamel dial, scrolls and an urn finial
  piece('elgclock', 'Gilded pedestal clock', 1, 1, 980, 'gloss', [
    B(16, 2, 0, 22, 4, 18, EL.white), trim(16, 4, 9.2, 22),
    B(16, 18, 0, 16, 28, 13, EL.white),
    B(16, 18, 6.6, 11, 22, 0.4, EL.gold, { m: 'metal', r: 0.5 }), B(16, 18, 6.9, 10, 21, 0.4, EL.blueL, { m: 'cloth', r: 0.5 }),
    shell(16, 13, 7.2, 2.4, 0.4), C(16, 22, 7.2, 1.4, 0.4, EL.gold, M),
    B(16, 33, 0, 22, 2.4, 18, EL.white), trim(16, 32, 9.2, 22),
    B(16, 35.6, 0, 19, 2.8, 12, EL.gold, { m: 'metal', r: 0.6 }),
    ...[[8, -4.5], [24, -4.5], [8, 4.5], [24, 4.5]].map(([x, z]) => S(x, 35.6, z, 1.4, 1.6, 1.4, EL.gold, { m: 'metal', seg: 8 })),
    PR(16, 37, 0, [[-8.5, 0], [8.5, 0], [7.4, 4], [9.2, 10], [8.2, 16], [5, 19.5], [0, 21], [-5, 19.5], [-8.2, 16], [-9.2, 10], [-7.4, 4]], 10, EL.white),
    RG(16, 48, 5.3, 5.4, 0.55, EL.gold, M),
    PC(16, 48, 5.2, 10.4, 10.4, dial),
    ...[-1, 1].map(s => RG(16 + s * 8.6, 43, 3.6, 2.2, 0.45, EL.gold, { m: 'metal', a0: s < 0 ? Math.PI * 0.4 : Math.PI * 1.4, arc: Math.PI * 1.2 })),
    shell(16, 41, 5.2, 2.2, 0.4),
    LA(16, 58, 0, [[1.2, 0], [2, 1.2], [1.6, 2.8], [0.7, 3.6], [1, 4.4], [0, 5.2]], EL.gold, { m: 'metal', seg: 10 }),
  ]),

  // a three-panel folding screen: white frames arched on top with gilt beading, rose silk sprigged with blossoms
  piece('elgscreen', 'Rose silk folding screen', 2, 1, 720, 'gloss', [
    ...[[11, 4, 1], [32, -4, 2], [53, 4, 3]].flatMap(([x, z, seed]) => [
      ...[-8, 8].map(dx => S(x + dx, 1.4, z, 1.6, 1.4, 1.6, EL.gold, { m: 'metal', seg: 8 })),
      B(x, 34, z, 20.4, 60, 2, EL.white, { r: 0.8 }),
      PR(x, 64, z, crest(10.2, 5), 2, EL.white),
      B(x, 35, z + 1.05, 17.4, 51.4, 0.3, EL.gold, { m: 'metal', r: 0.3 }),
      PC(x, 35, z + 1.25, 16, 50, silk(seed)),
      shell(x, 65.6, z + 1.2, 2.2, 0.4),
    ]),
    ...[21.5, 42.5].flatMap(x => [16, 52].map(h => B(x, h, 0, 1, 3, 8.4, EL.gold, { m: 'metal', r: 0.3 }))),
  ]),

  // a spinet piano: a white case on cabriole legs, a pastoral painted in a gilt frame, a lyre of pedals, a crest
  piece('elgspinet', 'Gilded spinet piano', 2, 1, 1500, 'gloss', [
    ...cab(6, 9, 25, -0.4, 1), ...cab(58, 9, 25, 0.4, 1),
    ...[6, 58].map(x => RD([x, 0, -11], [x, 29, -11], 1.3, EL.white)),
    B(32, 26.5, 0, 58, 3.4, 26, EL.white), trim(32, 25, 13.1, 58),
    B(32, 44.5, -5, 58, 30, 16, EL.white),
    B(32, 60.5, -5, 61, 2, 17.5, EL.white, { r: 0.6 }), trim(32, 59.4, 3.8, 61),
    PR(32, 61.5, -5, crest(24, 6), 14, EL.white), shell(32, 63.4, 2.4, 3.2, 0.8), ...scrolls(32, 63, 2.4, 7.5, 2.2),
    B(32, 46, 3.2, 40, 18, 0.6, EL.gold, { m: 'metal', r: 0.4 }),
    PC(32, 46, 3.6, 38, 16, pastoral),
    ...[[7, 36], [57, 36]].map(([x, h]) => RG(x, h, 3.4, 2.4, 0.5, EL.gold, { m: 'metal', a0: x < 32 ? -Math.PI * 0.5 : Math.PI * 0.5, arc: Math.PI * 1.3 })),
    ...[6, 58].map(x => B(x, 30.4, 6.5, 4, 4.4, 13, EL.white, { r: 0.8 })),
    B(32, 30.6, 3.4, 48, 4.2, 1, EL.white, { r: 0.4 }),
    B(32, 28.6, 8.2, 47, 0.8, 9.6, EL.whiteL, { m: 'plain', r: 0.05 }),
    ...[1, 2, 4, 5, 6, 8, 9, 11, 12, 13, 15, 16, 18, 19, 20].map(i => B(8.5 + i * 2.24, 29.3, 6.6, 1.2, 0.7, 5.6, EL.black, { m: 'plain', r: 0.05 })),
    ...[-1, 1].map(s => RD([32 + s * 1.6, 1.6, -2], [32 + s * 2.6, 23, -2], 0.5, EL.gold, M)),
    RG(32, 15, -2, 3, 0.45, EL.gold, { m: 'metal', ry: 6 }),
    ...[-1, 0, 1].map(s => B(32 + s * 2.6, 1, 1, 1.4, 0.8, 4.4, EL.gold, { m: 'metal', r: 0.3 })),
  ]),

  // a concert harp: a gilt fluted column, a curving gold neck, a white soundbox edged in gold, cream strings
  piece('elgharp', 'Gilded concert harp', 1, 1, 1100, 'metal', [
    B(15, 3, 0, 18, 5, 12, EL.white, { m: 'gloss' }), trim(15, 5.4, 6.2, 18),
    ...[[7.5, -4.5], [22.5, -4.5], [7.5, 4.5], [22.5, 4.5]].map(([x, z]) => S(x, 1, z, 1.3, 1, 1.3, EL.gold, { seg: 8 })),
    LA(8, 5, 0, [[2.4, 0], [2, 4], [1.4, 8], [1.4, 68], [2.2, 72], [3, 76], [2.4, 79]], EL.gold, { seg: 10 }),
    S(8, 85.5, 0, 2.6, 2.2, 2.6, EL.gold, { seg: 10 }), shell(8, 86.6, 1, 2.4, 1),
    ...NECK.slice(1).map((p, i) => RD([NECK[i][0], NECK[i][1], 0], [p[0], p[1], 0], 1.3, EL.gold)),
    PR(0, 5, 0, [[10, 0], [20, 0], [28.5, 61], [25.5, 64.5]], 7, EL.white, { m: 'gloss' }),
    RD([10.4, 5.6, 0], [25.5, 64, 0], 0.6, EL.gold),
    ...Array.from({ length: 12 }, (_, i) => { const x = 11.2 + i * 1.25; return RD([x, neckAt(x) - 1, 0], [x, 5 + (x - 10) / 15.5 * 59, 0], 0.18, EL.string, PL); }),
  ]),

  // a birdcage on a stand: a domed gilt cage, a Swablu on its swing, on a white column and three cabriole feet
  piece('elgbirdcage', 'Gilded birdcage stand', 1, 1, 620, 'metal', [
    ...tripod(16, 8, 11),
    LA(16, 6, 0, [[2.4, 0], [2.8, 2], [1.6, 4], [1.6, 30], [2.4, 32], [1.8, 34]], EL.white, { m: 'gloss', seg: 10 }),
    C(16, 20, 0, 2, 0.8, EL.gold),
    C(16, 40.5, 0, 9, 1.8, EL.white, GL), RG(16, 40.4, 0, 9, 0.45, EL.gold, { flat: true }),
    ...Array.from({ length: 8 }, (_, i) => {
      const a = i / 8 * TAU, c = Math.cos(a), s = Math.sin(a), p0 = [16 + c * 8.4, 41.4, s * 8.4], p1 = [16 + c * 8.4, 56, s * 8.4], p2 = [16 + c * 5.6, 63, s * 5.6];
      return [RD(p0, p1, 0.32, EL.gold), RD(p1, p2, 0.32, EL.gold), RD(p2, [16, 66, 0], 0.32, EL.gold)];
    }).flat(),
    RG(16, 49, 0, 8.4, 0.35, EL.gold, { flat: true }), RG(16, 56, 0, 8.4, 0.45, EL.gold, { flat: true }),
    S(16, 66.4, 0, 1.2, 1, 1.2, EL.gold, { seg: 8 }), RG(16, 69, 0, 1.6, 0.35, EL.gold),
    RD([12, 47, 0], [20, 47, 0], 0.35, EL.white, GL),
    S(16, 49.6, 0, 2.4, 2.2, 2.2, EL.bird, { m: 'gloss', seg: 10 }), S(16, 46.9, 0.8, 3.2, 1.6, 2.4, EL.whiteL, { m: 'cloth', seg: 10 }),
    S(16, 49.6, 2.3, 0.7, 0.4, 0.6, '#f2c84a', { m: 'plain', seg: 6 }),
  ]),

  // a tea cart: two white trays with gold galleries on curving gold legs and wheels, a rose-sprigged china tea set
  piece('elgtea', 'Gilded tea cart', 1, 1, 540, 'metal', [
    ...[[4, -9.5], [28, -9.5], [4, 9.5], [28, 9.5]].flatMap(([x, z]) => [RD([x, 4, z], [x + (x < 16 ? -0.6 : 0.6), 15, z], 0.6, EL.gold), RD([x + (x < 16 ? -0.6 : 0.6), 15, z], [x, 26, z], 0.6, EL.gold), S(x, 26.6, z, 0.9, 0.9, 0.9, EL.gold, { seg: 6 })]),
    ...[[5, -10.5], [27, -10.5], [5, 10.5], [27, 10.5]].flatMap(([x, z]) => [RG(x, 3.3, z, 2.8, 0.45, EL.white, GL), DS(x, 3.3, z, 0.9, 0.8, EL.gold)]),
    B(16, 12, 0, 26, 1.4, 21, EL.white, { m: 'gloss', r: 0.5 }), trim(16, 12, 10.6, 26),
    B(16, 24, 0, 26, 1.4, 21, EL.white, { m: 'gloss', r: 0.5 }), trim(16, 24, 10.6, 26),
    ...[-9.5, 9.5].map(z => RD([4, 27, z], [28, 27, z], 0.35, EL.gold)),
    ...[4, 28].map(x => RD([x, 27, -9.5], [x, 27, 9.5], 0.35, EL.gold)),
    RD([28, 26, -7.5], [31, 30, -7.5], 0.5, EL.gold), RD([28, 26, 7.5], [31, 30, 7.5], 0.5, EL.gold), RD([31, 30, -7.5], [31, 30, 7.5], 0.6, EL.white, GL),
    LA(12, 24.7, 0, [[2.4, 0], [4, 1.5], [4.4, 3.5], [3.6, 5.6], [2, 6.6], [1.4, 6.8]], EL.china, { m: 'gloss', seg: 12 }),
    C(12, 27.6, 0, 4.45, 0.8, EL.gold, { rb: 4.4, m: 'metal' }),
    ...[[10.4, 26.8], [13.6, 27.2]].map(([x, h]) => DS(x, h, 4.1, 0.9, 0.4, EL.bloom, PL)),
    S(12, 32, 0, 1.6, 1.2, 1.6, EL.china, { m: 'gloss', seg: 8 }), S(12, 33.3, 0, 0.6, 0.6, 0.6, EL.gold, { m: 'metal', seg: 6 }),
    RD([16, 27.6, 0.6], [19, 30.4, 1.6], 0.7, EL.china, GL),
    RG(7.4, 28.4, 0, 1.8, 0.5, EL.gold, M),
    ...[[21.5, 6], [22, -5]].flatMap(([x, z]) => [C(x, 24.9, z, 3.2, 0.4, EL.china, GL), LA(x, 25.1, z, [[1, 0], [2, 0.8], [2.4, 2.6]], EL.china, { m: 'gloss', seg: 10 }), C(x, 27.6, z, 2.45, 0.3, EL.gold, M)]),
    C(16, 13.4, 0, 5, 1.2, EL.china, GL),
    ...[[11, -3], [16, -4.5], [21, -3], [13.5, 2], [18.5, 2]].map(([x, z]) => S(x, 14.8, z, 1.5, 1, 1.5, EL.bloomL, { m: 'cloth', seg: 8 })),
  ]),

  // a round tufted pouf: buttoned blue on a white drum banded in gold, on four little cabriole legs
  piece('elgpouf', 'Tufted round pouf', 1, 1, 280, 'gloss', [
    ...[45, 135, 225, 315].flatMap(deg => { const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return cab(16 + c * 8.5, s * 8.5, 5.2, c * 0.6, s * 0.6); }),
    C(16, 7.4, 0, 11.5, 4.6, EL.white),
    C(16, 9.9, 0, 11.7, 0.8, EL.gold, M), C(16, 5.2, 0, 11.6, 0.6, EL.gold, M),
    S(16, 12.6, 0, 12.2, 2.6, 12.2, EL.blue, { m: 'cloth', seg: 20 }),
    ...[[0, 0], [5.6, 0], [-5.6, 0], [0, 5.6], [0, -5.6], [4, 4], [-4, 4], [4, -4], [-4, -4]].map(([x, z]) => S(16 + x, 14.9 - (x * x + z * z) * 0.012, z, 0.7, 0.35, 0.7, EL.blueD, { m: 'plain', seg: 6 })),
  ]),

  // a little night table: a drawer with a gold pull, a scalloped apron, gilt beading, on cabriole legs
  piece('elgnight', 'Rococo night table', 1, 1, 360, 'gloss', [
    ...cab(5, 7, 11, -0.4, 1), ...cab(27, 7, 11, 0.4, 1), ...cab(5, -7, 11, -0.4, -0.4), ...cab(27, -7, 11, 0.4, -0.4),
    B(16, 16.5, 0, 25, 11, 18, EL.white, { r: 1 }),
    PR(16, 11, 9.1, apron(11.5, 2.4), 0.6, EL.white), shell(16, 9.4, 9.4, 1.8, 0.4),
    B(16, 18.3, 9.2, 21.4, 5.6, 0.3, EL.gold, { m: 'metal', r: 0.4 }), B(16, 18.3, 9.45, 20.4, 4.8, 0.4, EL.whiteL, { r: 0.4 }), knob(16, 18.3, 9.7, 0.8),
    B(16, 22.8, 0, 28, 1.6, 21, EL.white, { r: 0.6 }), trim(16, 22, 10.6, 28),
  ]),

  // a rose urn on a column: a white fluted pedestal banded in gold, a gilt urn spilling pink roses
  piece('elgurn', 'Gilded rose urn', 1, 1, 420, 'gloss', [
    B(16, 1.5, 0, 18, 3, 18, EL.white), trim(16, 3, 9.2, 18),
    LA(16, 3, 0, [[6, 0], [6, 1], [4.4, 2], [4, 3], [4, 25], [4.8, 26], [6.4, 28], [6.4, 29.4]], EL.white, { seg: 16 }),
    C(16, 7, 0, 4.2, 0.8, EL.gold, M), C(16, 26.4, 0, 4.9, 0.8, EL.gold, M),
    LA(16, 32.4, 0, [[2.4, 0], [3.6, 1], [2, 2.4], [2.6, 4], [5.6, 7], [6.6, 10], [6, 13], [6.8, 14]], EL.gold, { m: 'metal', seg: 14 }),
    ...[-1, 1].map(s => RG(16 + s * 7, 42, 0, 2, 0.45, EL.gold, { m: 'metal', a0: s < 0 ? Math.PI * 0.5 : -Math.PI * 0.5, arc: Math.PI })),
    ...[[11, 47.6, 2], [16, 48.6, 3], [21, 47.6, 2], [13.4, 50.6, -1], [18.6, 50.8, 0], [16, 53, -2], [9.6, 45.4, -2], [22.4, 45.6, -2]].map(([x, h, z], i) => rose(x, h, z, i % 3 ? 2.2 : 2.5, i % 2 ? EL.bloom : EL.bloomL)),
    ...[[8, 46.4, 2], [24, 46.6, 1], [12, 52.4, 1], [20.4, 53, -1], [16, 45.6, 5]].map(([x, h, z]) => leafy(x, h, z, 2.2)),
  ]),

  // an oval wall mirror in a gilt frame: a beaded edge, a shell crest with scrolls, a bow at its foot
  wallPiece('elgmirror', 'Gilded oval mirror', 1, 560, 'metal', [
    DS(16, 60, 0.6, 10, 1.2, EL.goldD, { ry: 15 }),
    RG(16, 60, 1.3, 9.6, 0.9, EL.gold, { ry: 14.6 }),
    DS(16, 60, 1.4, 8.6, 0.4, EL.mirror, { ry: 13.6, m: 'gloss' }),
    RG(16, 60, 1.9, 8.4, 0.3, EL.goldL, { ry: 13.4 }),
    shell(16, 74, 1.5, 4, 1.4), ...scrolls(16, 73.6, 1.8, 6, 2.2, 0.55),
    S(16, 45, 1.8, 2, 1.2, 1, EL.gold, { seg: 8 }), ...[-1, 1].map(s => S(16 + s * 2.6, 44.6, 1.6, 2, 1.2, 0.8, EL.gold, { seg: 8 })),
  ]),

  // a wall sconce: a gilt shell back plate, two curling arms, white candles under pale shades
  wallPiece('elgsconce', 'Gilded candle sconce', 1, 340, 'metal', [
    DS(16, 58, 0.5, 3.6, 1, EL.gold, { ry: 7 }), shell(16, 63.5, 1, 3, 0.8),
    ...[-1, 1].flatMap(s => [
      RD([16, 56, 1], [16 + s * 6, 54, 4], 0.6, EL.gold), RD([16 + s * 6, 54, 4], [16 + s * 8, 58, 5], 0.6, EL.gold),
      C(16 + s * 8, 58.6, 5, 1.8, 1.2, EL.gold),
      C(16 + s * 8, 61.6, 5, 0.85, 4.8, EL.cream, GL),
      S(16 + s * 8, 64.8, 5, 0.8, 1.3, 0.8, EL.flame, { m: 'glow', seg: 8 }),
      LA(16 + s * 8, 63.2, 5, [[3.2, 0], [2.4, 3.4], [1.3, 5.2]], EL.shade, { m: 'glow', seg: 12 }),
      S(16 + s * 6, 52.6, 4, 0.6, 1, 0.6, EL.goldL, { seg: 6 }),
    ]),
    S(16, 50.2, 1, 1, 1.4, 1, EL.gold, { seg: 8 }),
  ], { glow: [EL.shade, EL.flame] }),

  // a curtain swag: a gilt pelmet with scroll ends, a rose drape looped across, tasselled tails at the sides
  wallPiece('elgswag', 'Rose curtain swag', 2, 520, 'cloth', [
    B(32, 88, 1.5, 60, 4, 3, EL.white, { m: 'gloss', r: 0.6 }), trim(32, 86.2, 3.1, 60), trim(32, 89.8, 3.1, 60),
    shell(32, 90, 2.4, 3.6, 1), ...[3, 61].map(x => S(x, 88, 2.5, 2.4, 2.4, 1.6, EL.gold, { m: 'metal', seg: 8 })),
    RG(32, 88, 3.4, 24, 3, EL.rose, { a0: Math.PI + 0.12, arc: Math.PI - 0.24, ry: 14 }),
    RG(32, 88, 4.6, 22, 0.6, EL.gold, { m: 'metal', a0: Math.PI + 0.18, arc: Math.PI - 0.36, ry: 12.4 }),
    RG(32, 88, 2.4, 18, 2.4, EL.roseL, { a0: Math.PI + 0.14, arc: Math.PI - 0.28, ry: 9 }),
    ...[5.5, 58.5].flatMap(x => [
      B(x, 66, 3, 6, 40, 2.4, EL.rose, { r: 1.2 }), B(x, 46, 3, 7, 3, 2.6, EL.roseD, { r: 1 }),
      S(x, 42.6, 3.6, 1.3, 1.2, 1.3, EL.gold, { m: 'metal', seg: 8 }), C(x, 39, 3.6, 0.9, 5, EL.gold, { m: 'metal', rb: 1.8 }),
    ]),
  ]),

  // an oval rug: a pale blue field, a cream border with a gold scroll band, a rose medallion of blossoms
  { id: 'elgrug', name: 'Oval medallion rug', group: GROUP, solo: true, w: 3, h: 2, layer: 'rug', price: 820, high: 0.04, side: 'c', flat() {
    const g = ctx(), [[cx, cy, rx, ry]] = RUGS.elgrug;
    const el = (dx, dy, c) => oval(cx, cy, rx - dx, ry - dy, c);
    el(0, 0, EL.goldD); el(1, 1, EL.cream); el(5, 4, EL.gold); el(6, 5, EL.blue);
    g.strokeStyle = EL.goldD; g.lineWidth = 0.6;
    for (let i = 0; i < 40; i++) { const a = i / 40 * TAU; g.beginPath(); g.arc(cx + Math.cos(a) * (rx - 3), cy + Math.sin(a) * (ry - 2.5), 1.1, a, a + Math.PI * 1.3); g.stroke(); }
    g.strokeStyle = EL.whiteL; g.lineWidth = 0.5; g.beginPath(); g.ellipse(cx, cy, rx - 9, ry - 8, 0, 0, TAU); g.stroke();
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU + Math.PI / 8, px = cx + Math.cos(a) * (rx - 16), py = cy + Math.sin(a) * (ry - 12);
      g.fillStyle = EL.leaf; g.beginPath(); g.ellipse(px + 1.6, py, 1.8, 0.8, a, 0, TAU); g.fill(); g.beginPath(); g.ellipse(px - 1.6, py, 1.8, 0.8, -a, 0, TAU); g.fill();
      oval(px, py, 1.6, 1.4, i % 2 ? EL.roseL : EL.bloom); oval(px, py, 0.6, 0.6, EL.goldL);
    }
    oval(cx, cy, 16, 12, EL.gold); oval(cx, cy, 15, 11, EL.cream); oval(cx, cy, 12.6, 9, EL.rose);
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; oval(cx + Math.cos(a) * 13.8, cy + Math.sin(a) * 10, 1, 0.9, i % 2 ? EL.goldL : EL.bloom); }
    for (let p = 0; p < 8; p++) { const a = p / 8 * TAU; g.fillStyle = EL.roseL; g.beginPath(); g.ellipse(cx + Math.cos(a) * 4.4, cy + Math.sin(a) * 3.3, 3, 1.6, a, 0, TAU); g.fill(); }
    oval(cx, cy, 3, 2.4, EL.bloom); oval(cx, cy, 1.4, 1.1, EL.gold);
    g.fillStyle = 'rgba(255,255,255,0.12)'; for (let x = cx - rx; x < cx + rx; x += 3) for (let y = cy - ry; y < cy + ry; y += 3) if (hash(x, y) < 0.15 && ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 0.8) g.fillRect(x, y, 1, 1);
  } },
];
