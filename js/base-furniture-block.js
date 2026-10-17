/* base-furniture-block.js  -  the Wooden block set (furniture expansion session g, 2026-10-17): Animal Crossing's
   wooden-block series, a toddler's room built from chunky toy blocks. Bright red, blue, yellow and green painted wood on
   pale beech, rounded cubes with letters and numbers on their faces (A B C, 1 2 3), round pegs and dowels, arches,
   triangles and cylinders stacked into furniture; the specials are toys (a stacking tower, rings, a shape sorter, an
   abacus, an alphabet train, a play kitchen), with Psyduck pulled along on wheels, a rocking Ponyta and Ditto popping out
   of a jack-in-the-box for the Pokémon touches. All solo, fixed colours, sold all year.
   An upright piece is a list of parts in painted units (32 a tile), as in js/base-furniture-acorn.js: `x` across from
   the left of its front, `h` up from the floor (a wall piece's from the foot of its strip), `z` out to the front from its
   middle (a wall piece's from the wall). They're painted here from any side, and js/base-models-block.js builds the same
   list as 3D parts (BUILT), so picture and model agree. A `pic` part (a block's letter, the clock's dial, the screen's
   panels) is painted on the front only, and the model wears that crop of the painting. Letters are drawn from a 5 x 5
   pixel font (GLYPH), so they stay crisp at 32 pixels a tile. The wardrobe's doors swing (`doors`, `inside`). The rug is
   a rounded play mat, painted from above (RUG). */

import { sh, oval, ovalShade, floorShadow, ctx, hash, glass as glassPane } from './base-paint.js';

export const BK = {
  red: '#e2453c', redD: '#ad2e28', blue: '#3d78d6', blueD: '#2a54a0', yellow: '#f6c430', yellowD: '#cf9a1a',
  green: '#4fb04a', greenD: '#357f36', orange: '#f28a2e', purple: '#9a6ad0',
  beech: '#ead09c', beechL: '#f6e4bc', beechD: '#c9a46a', cream: '#fff6e2', ink: '#2e2a26', white: '#fbfbf6',
  steel: '#c8ccd8', mirror: '#cfe1ea', glow: '#ffe79a', water: '#9cc8e8', window: '#3c4256',
  psy: '#f2c84a', beak: '#f7e6b2', ditto: '#b48ad8', pony: '#f6ead0', ponyD: '#d8c4a0', hoof: '#8a6a4a',
  flame: '#ff8a2a', flameY: '#ffcf40', flameR: '#e8502e',
};
const GROUP = 'Wooden block';
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

const CL = { m: 'cloth' }, PL = { m: 'plain' }, GL = { m: 'gloss' }, WD = { m: 'wood' };

/** The letter or number on a block in each colour: cream on the dark ones, red on yellow. */
const INK = { [BK.red]: BK.yellow, [BK.blue]: BK.yellow, [BK.green]: BK.cream, [BK.yellow]: BK.red, [BK.orange]: BK.blueD, [BK.purple]: BK.cream, [BK.beech]: BK.red };

/** A toy block s across standing on h: a rounded painted cube. Corners kept under the model's one-step bevel. */
const cube = (x, h, z, s, c, o) => B(x, h + s / 2, z, s, s, s, c, { m: 'wood', r: Math.min(1.4, s * 0.16), ...o });
/** A letter block: the cube, and its letter on the front face. */
const lcube = (x, h, z, s, c, ch, fg) => [cube(x, h, z, s, c), PC(x, h + s / 2, z + s / 2 + 0.1, s * 0.8, s * 0.8, face(ch, c, fg))];
/** An arch block's front, w across and hh high, the arch a round (a across its half). */
const archBlock = (w, hh, a, n = 8) => [[-w / 2, 0], [-w / 2, hh], [w / 2, hh], [w / 2, 0], [a, 0], ...Array.from({ length: n - 1 }, (_, i) => { const t = Math.PI * (i + 1) / n; return [a * Math.cos(t), a * Math.sin(t)]; }), [-a, 0]];
/** A five-pointed star, R to its points and r to its notches, resting on its two lower points. */
function starPts(R, r) {
  const pts = Array.from({ length: 10 }, (_, i) => { const a = Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r : R; return [q * Math.cos(a), q * Math.sin(a)]; });
  const low = Math.min(...pts.map(p => p[1]));
  return pts.map(([x, y]) => [x, y - low]);
}
/** A wooden flame, s tall, its tip leaning `lean` across (Ponyta's mane and tail). */
const flame = (s, lean = -0.3) => [[-0.24 * s, 0], [0.24 * s, 0], [0.28 * s, 0.3 * s], [0.12 * s + lean * s * 0.5, 0.64 * s], [lean * s, s], [-0.14 * s + lean * s * 0.5, 0.6 * s], [-0.28 * s, 0.28 * s]];
/** A Poké Ball r round sitting on h: a white ball, a red dome over it, a black band and a white button. */
const hemi = (r) => [[r, 0], [r * 0.95, r * 0.31], [r * 0.81, r * 0.59], [r * 0.59, r * 0.81], [r * 0.31, r * 0.95], [0, r]];
const pball = (x, h, z, r) => [
  S(x, h + r, z, r, r, r, BK.white, { m: 'gloss', seg: 12 }),
  LA(x, h + r, z, hemi(r * 1.04), BK.red, { m: 'gloss', seg: 12 }),
  C(x, h + r, z, r * 1.06, r * 0.2, BK.ink, PL),
  DS(x, h + r, z + r * 0.92, r * 0.42, r * 0.24, BK.ink, PL), DS(x, h + r, z + r * 1.06, r * 0.26, r * 0.12, BK.white, PL),
];

/* ---------- painting the parts ---------- */

const alphaOf = (hex, a) => { const v = parseInt(hex.slice(1), 16); return `rgba(${v >> 16},${(v >> 8) & 255},${v & 255},${a})`; };
function grad(g, x0, y0, x1, y1, c, m) {
  const l = g.createLinearGradient(x0, y0, x1, y1);
  if (m === 'glow') [[0, sh(c, 2)], [0.5, sh(c, 1)], [1, c]].forEach(s => l.addColorStop(...s));
  else [[0, sh(c, 1)], [0.35, c], [1, sh(c, -1)]].forEach(s => l.addColorStop(...s));
  return l;
}
function rbx(x, y, w, h, r, c, m) {
  if (w <= 0 || h <= 0) return;
  const g = ctx();
  if (m === 'glass') { g.save(); g.globalAlpha *= 0.4; glassPane(x, y, w, h, '#cfe8f4'); g.restore(); return; }
  if (m === 'plain') { g.fillStyle = c; g.beginPath(); g.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); g.fill(); return; }
  g.fillStyle = grad(g, x, y, x + w * 0.3, y + h, c, m); g.beginPath(); g.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); g.fill();
  if (h > 3 && w > 3) { g.save(); g.globalAlpha *= 0.45; g.fillStyle = sh(c, 2); g.fillRect(x + Math.min(r, w / 2) * 0.6, y + 0.3, w - Math.min(r, w / 2) * 1.2, 0.5); g.restore(); }
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
  if (m === 'glow') { const t = g.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry)); t.addColorStop(0, '#ffffff'); t.addColorStop(0.4, sh(c, 1)); t.addColorStop(1, c); g.fillStyle = t; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, TAU); g.fill(); return; }
  if (m === 'plain') { oval(cx, cy, rx, ry, c); return; }
  ovalShade(cx, cy, rx, ry, c);
  if (m === 'gloss') { g.save(); g.globalAlpha *= 0.55; oval(cx - rx * 0.38, cy - ry * 0.42, rx * 0.22, ry * 0.14, '#ffffff'); g.restore(); }
}

/** Paints parts seen from `dir` (0 front, 2 back, 1 / 3 the sides), on a view vw wide standing on line b; Wd is the
    piece's front width in units. */
function paintParts(parts, x0, b, vw, dir, Wd) {
  const side = dir % 2 === 1, sg = dir === 3 ? -1 : 1, flip = dir === 2 ? -1 : 1, g = ctx();
  const U = (px, pz) => (dir === 0 ? x0 + px : dir === 2 ? x0 + Wd - px : x0 + vw / 2 + sg * pz);
  const key = (q) => q.k ?? (dir === 0 ? q.z : dir === 2 ? -q.z : sg * (Wd / 2 - q.x));
  const list = parts.map((q, i) => [key(q), i, q]).sort((a, c) => a[0] - c[0] || a[1] - c[1]).map(e => e[2]);
  for (const q of list) {
    if (q.t === 'pic' && dir !== 0) continue;
    const m = q.m || 'wood', cx = U(q.x, q.z), cy = b - q.h;
    switch (q.t) {
      case 'box': { const w = side ? q.d : q.w; rbx(cx - w / 2, cy - q.hh / 2, w, q.hh, q.r, q.c, m); break; }
      case 'cyl': {
        const rb = q.rb ?? q.r, top = cy - q.hh / 2, bot = cy + q.hh / 2;
        poly([[cx - q.r, top], [cx + q.r, top], [cx + rb, bot], [cx - rb, bot]], q.c, m, m !== 'glow');
        oval(cx, top, q.r, Math.min(q.r * 0.22, Math.max(0.3, q.hh / 2)), sh(q.c, m === 'glow' ? 2 : 1));
        break;
      }
      case 'ball': ball(cx, cy, side ? q.rz : q.rx, q.ry, q.c, m); break;
      case 'disc': if (side) rbx(cx - q.th / 2, cy - (q.ry ?? q.r), q.th, (q.ry ?? q.r) * 2, q.th / 2, q.c, m); else ball(cx, cy, q.r, q.ry ?? q.r, q.c, m); break;
      case 'lathe': {
        const rmax = Math.max(...q.pts.map(p => p[0])), len = Math.max(...q.pts.map(p => p[1]));
        const P = (dx, up) => [cx + flip * dx, cy - up];
        poly([...q.pts.map(([r, up]) => P(-r, up)), ...q.pts.slice().reverse().map(([r, up]) => P(r, up))], q.c, m, true);
        if (m === 'gloss' && rmax > 1.2) {
          const at = q.pts.find(p => p[0] === rmax), [hx, hy] = P(-rmax * 0.48, Math.max(at[1], len * 0.5));
          g.save(); g.globalAlpha *= 0.5; oval(hx, hy, rmax * 0.14, Math.max(0.4, len * 0.1), '#ffffff'); g.restore();
        }
        break;
      }
      case 'ring': {
        const ry = q.ry ?? q.r;
        if (side && !q.flat) { if (q.arc) break; rbx(cx - q.tr, cy - ry - q.tr, q.tr * 2, (ry + q.tr) * 2, q.tr, q.c, m); break; }
        const a0 = q.arc ? -(q.a0 + q.arc) : 0, a1 = q.arc ? -q.a0 : TAU;
        const path = (dy = 0) => { g.beginPath(); if (q.flat) g.ellipse(cx, cy + dy, q.r, q.r * 0.22, 0, 0, TAU); else g.ellipse(cx, cy + dy, q.r, ry, 0, a0, a1); };
        g.strokeStyle = q.c; g.lineWidth = q.tr * 2; path(); g.stroke();
        if (m !== 'plain') {
          g.save(); g.globalAlpha *= 0.45; g.strokeStyle = sh(q.c, 2); g.lineWidth = q.tr * 0.6;
          if (q.flat) { g.beginPath(); g.ellipse(cx, cy - q.tr * 0.4, q.r, q.r * 0.22, 0, Math.PI, TAU); } else path(-q.tr * 0.4);
          g.stroke(); g.restore();
        }
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
      case 'pic': g.save(); g.beginPath(); g.rect(cx - q.w / 2, cy - q.hh / 2, q.w, q.hh); g.clip(); q.fn(g, cx - q.w / 2, cy - q.hh / 2, q.w, q.hh); g.restore(); break;
    }
  }
}

/* ---------- pictures ---------- */

/** A 5 x 5 pixel font for the blocks' letters and numbers. */
const GLYPH = {
  A: ['01110', '10001', '11111', '10001', '10001'], B: ['11110', '10001', '11110', '10001', '11110'],
  C: ['01111', '10000', '10000', '10000', '01111'], D: ['11110', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '11110', '10000', '11111'], F: ['11111', '10000', '11110', '10000', '10000'],
  O: ['01110', '10001', '10001', '10001', '01110'], T: ['11111', '00100', '00100', '00100', '00100'],
  Y: ['10001', '01010', '00100', '00100', '00100'],
  1: ['00100', '01100', '00100', '00100', '01110'], 2: ['11110', '00001', '01110', '10000', '11111'],
  3: ['11110', '00001', '01110', '00001', '11110'], 6: ['01110', '10000', '11110', '10001', '01110'],
  9: ['01110', '10001', '01111', '00001', '01110'],
};
/** A glyph `cell` a pixel, centred on cx, cy. */
function glyph(g, ch, cx, cy, cell, c) {
  g.fillStyle = c;
  GLYPH[ch].forEach((row, i) => { for (let j = 0; j < 5; j++) if (row[j] === '1') g.fillRect(cx + (j - 2.5) * cell, cy + (i - 2.5) * cell, cell * 1.04, cell * 1.04); });
}
/** A line of glyphs centred on cx, cy. */
function text(g, s, cx, cy, cell, c) { [...s].forEach((ch, i) => glyph(g, ch, cx + (i - (s.length - 1) / 2) * cell * 6, cy, cell, c)); }
/** A block's face: its colour, a lighter rounded inset with a darker edge, the letter on it. */
function face(ch, bg, fg = INK[bg] || BK.ink) {
  return (g, x, y, w, h) => {
    g.fillStyle = bg; g.fillRect(x, y, w, h);
    g.fillStyle = sh(bg, 1); g.strokeStyle = sh(bg, -1); g.lineWidth = w * 0.05;
    g.beginPath(); g.roundRect(x + w * 0.07, y + h * 0.07, w * 0.86, h * 0.86, w * 0.14); g.fill(); g.stroke();
    glyph(g, ch, x + w / 2, y + h / 2, w * 0.13, fg);
  };
}
/** The wall clock's dial: cream on the yellow block, 12 3 6 9 in block letters, dots between, a red and a blue hand. */
function dial(g, x, y, w, h) {
  const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2;
  g.fillStyle = BK.yellow; g.fillRect(x, y, w, h);
  g.fillStyle = BK.cream; g.beginPath(); g.arc(cx, cy, r * 0.94, 0, TAU); g.fill();
  g.strokeStyle = BK.blue; g.lineWidth = r * 0.08; g.stroke();
  const cell = r * 0.07;
  text(g, '12', cx, cy - r * 0.64, cell, BK.red); text(g, '3', cx + r * 0.66, cy, cell, BK.blue);
  text(g, '6', cx, cy + r * 0.64, cell, BK.green); text(g, '9', cx - r * 0.66, cy, cell, BK.blue);
  for (let i = 0; i < 12; i++) if (i % 3) { const a = i / 12 * TAU - Math.PI / 2; g.fillStyle = [BK.red, BK.green, BK.orange][i % 3]; g.beginPath(); g.arc(cx + Math.cos(a) * r * 0.68, cy + Math.sin(a) * r * 0.68, r * 0.06, 0, TAU); g.fill(); }
  g.lineCap = 'round';
  for (const [a, len, lw, c] of [[-150, 0.4, 0.1, BK.red], [-30, 0.56, 0.07, BK.blue]]) { const t = a * Math.PI / 180; g.strokeStyle = c; g.lineWidth = r * lw; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(t) * r * len, cy + Math.sin(t) * r * len); g.stroke(); }
  g.fillStyle = BK.ink; g.beginPath(); g.arc(cx, cy, r * 0.08, 0, TAU); g.fill();
}
/** A shape filled on a canvas: 'circle', 'square', 'triangle' or 'star', s across, centred on cx, cy. */
function shapeOn(g, kind, cx, cy, s, c) {
  g.fillStyle = c; g.beginPath();
  if (kind === 'circle') g.arc(cx, cy, s / 2, 0, TAU);
  else if (kind === 'square') g.roundRect(cx - s * 0.44, cy - s * 0.44, s * 0.88, s * 0.88, s * 0.1);
  else if (kind === 'triangle') { g.moveTo(cx - s / 2, cy + s * 0.42); g.lineTo(cx + s / 2, cy + s * 0.42); g.lineTo(cx, cy - s * 0.48); }
  else for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = (i % 2 ? 0.21 : 0.5) * s; g.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q + s * 0.06); }
  g.closePath(); g.fill();
}
/** A screen panel: cream with a scatter of coloured dots, a big block letter and a shape under it. */
function panel(i) {
  const [ch, c, kind, c2] = [['A', BK.red, 'circle', BK.blue], ['B', BK.blue, 'square', BK.green], ['C', BK.green, 'triangle', BK.red]][i];
  return (g, x, y, w, h) => {
    g.fillStyle = BK.cream; g.fillRect(x, y, w, h);
    for (let k = 0; k < 18; k++) { g.fillStyle = [BK.red, BK.yellow, BK.blue, BK.green][k % 4]; g.globalAlpha = 0.35; g.beginPath(); g.arc(x + hash(k, i, 1) * w, y + hash(k, i, 2) * h, 0.7, 0, TAU); g.fill(); }
    g.globalAlpha = 1;
    g.fillStyle = sh(c, 2); g.beginPath(); g.roundRect(x + w * 0.12, y + h * 0.1, w * 0.76, w * 0.76, w * 0.12); g.fill();
    glyph(g, ch, x + w / 2, y + h * 0.1 + w * 0.38, w * 0.11, c);
    shapeOn(g, kind, x + w / 2, y + h * 0.66, w * 0.56, c2);
    glyph(g, String(i + 1), x + w / 2, y + h * 0.88, w * 0.06, BK.ink);
  };
}
/** The shape sorter's top face: blue, four dark holes. */
function sorterHoles(g, x, y, w, h) {
  g.fillStyle = BK.blue; g.fillRect(x, y, w, h);
  ['circle', 'square', 'triangle', 'star'].forEach((k, i) => shapeOn(g, k, x + w * (0.14 + i * 0.24), y + h / 2, Math.min(w * 0.2, h * 0.8), '#1c2a48'));
}

/* ---------- the kinds ---------- */

/** What js/base-models-block.js builds for each upright and wall kind: its parts, doors and default material. */
export const BUILT = {};
/** The rug's outline: a rounded play mat, in painted units across its 3 x 2 tiles. */
export const RUG = (() => {
  const pts = [], r = 8, [x0, y0, x1, y1] = [2, 2, 94, 62];
  for (const [cx, cy, a] of [[x1 - r, y1 - r, 0], [x0 + r, y1 - r, Math.PI / 2], [x0 + r, y0 + r, Math.PI], [x1 - r, y0 + r, Math.PI * 1.5]])
    for (let i = 0; i <= 4; i++) { const t = a + i * Math.PI / 8; pts.push([cx + Math.cos(t) * r, cy + Math.sin(t) * r]); }
  return pts;
})();

function piece(id, name, w, h, price, mat, parts, { doors = [], inside, ...rest } = {}) {
  BUILT[id] = { parts, doors, inside, mat };
  const all = [...parts, ...doors.flatMap(d => d.parts)];
  return { id, name, group: GROUP, solo: true, w, h, price, ...rest, draw(x, b, vw, dir) { floorShadow(x, b, vw); paintParts(all, x, b, vw, dir, w * 32); } };
}
function wallPiece(id, name, w, price, mat, parts, rest = {}) {
  BUILT[id] = { parts, doors: [], mat };
  return { id, name, group: GROUP, solo: true, w, h: 1, layer: 'wall', price, ...rest, wall(x) { paintParts(parts, x, 96, w * 32, 0, w * 32); } };
}

const RAINBOW = [BK.red, BK.orange, BK.yellow, BK.green, BK.blue];

export const BLOCK_KINDS = [
  // a red bed on yellow peg feet: blue posts with red ball tops, a beech headboard crowned with A B C blocks, a blue
  // quilt, a beech footboard painted 1 2 3 between green posts
  piece('blkbed', 'Wooden block bed', 2, 2, 1200, 'wood', [
    ...[[6, -26], [58, -26], [6, 26], [58, 26]].map(([x, z]) => C(x, 1.5, z, 3, 3, BK.yellow, WD)),
    ...[5, 59].flatMap(x => [C(x, 22, -27, 3.4, 44, BK.blue, WD), S(x, 47.4, -27, 3.6, 3.6, 3.6, BK.red, GL)]),
    B(32, 21, -27.5, 50, 22, 4, BK.beech, WD),
    ...lcube(20, 32, -27.5, 11, BK.red, 'A'), ...lcube(32, 32, -27.5, 11, BK.yellow, 'B'), ...lcube(44, 32, -27.5, 11, BK.green, 'C'),
    B(32, 7, 0, 60, 8, 58, BK.red, WD),
    B(32, 13.5, 0, 58, 5, 54, BK.cream, { m: 'cloth', r: 2 }),
    B(32, 17.2, 6, 59, 3, 42, BK.blue, { m: 'cloth', r: 1.4 }), B(32, 17.6, -14.5, 59, 3.2, 5, BK.yellow, { m: 'cloth', r: 1.4 }),
    ...[20, 44].map(x => S(x, 19, -21, 9, 3.4, 4.8, BK.cream, CL)),
    ...[5, 59].flatMap(x => [C(x, 12, 28, 3, 24, BK.green, WD), S(x, 26.6, 28, 3, 3, 3, BK.yellow, GL)]),
    B(32, 12, 28.5, 52, 14, 3.4, BK.beech, WD),
    ...[['1', BK.red, 22], ['2', BK.blue, 32], ['3', BK.green, 42]].map(([ch, c, x]) => PC(x, 12, 30.3, 8, 8, face(ch, c))),
  ]),

  // a green seat on red peg legs, blue posts with yellow ball tops, a yellow back block painted A
  piece('blkchair', 'Wooden block chair', 1, 1, 380, 'wood', [
    ...[6, 26].map(x => C(x, 6.5, 8, 2.2, 13, BK.red, WD)),
    ...[6, 26].flatMap(x => [C(x, 17, -9, 2.2, 34, BK.blue, WD), S(x, 36.4, -9, 2.6, 2.6, 2.6, BK.yellow, GL)]),
    B(16, 26, -9, 17.6, 12, 2.4, BK.yellow, WD),
    PC(16, 26, -7.7, 9, 9, face('A', BK.yellow)),
    B(16, 15, 0, 26, 4, 22, BK.green, { m: 'wood', r: 1.4 }),
  ], {}),

  // a red block base on yellow pegs, blue seat blocks, green arms under blue rolls, a yellow back crowned with A B C
  piece('blksofa', 'Wooden block sofa', 2, 1, 1100, 'wood', [
    ...[[8, -9], [56, -9], [8, 9], [56, 9]].map(([x, z]) => C(x, 1.2, z, 2.4, 2.4, BK.yellow, WD)),
    B(32, 7, 1, 58, 10, 24, BK.red, { m: 'wood', r: 1.4 }),
    ...[20, 44].map(x => B(x, 14.4, 3.5, 23, 5, 19, BK.blue, { m: 'cloth', r: 1.5 })),
    B(32, 21, -8.5, 46, 18, 6, BK.yellow, { m: 'wood', r: 1.4 }),
    ...[5.5, 58.5].flatMap(x => [B(x, 11, 1, 9, 18, 24, BK.green, { m: 'wood', r: 1.4 }), DS(x, 22.5, 1, 4.5, 24, BK.blue, WD)]),
    ...lcube(20, 30, -8.5, 8, BK.red, 'A'), ...lcube(32, 30, -8.5, 8, BK.green, 'B'), ...lcube(44, 30, -8.5, 8, BK.blue, 'C'),
  ]),

  // a beech top on four peg legs, one of each colour, a red apron dotted with yellow pegs
  piece('blktable', 'Wooden block table', 1, 1, 520, 'wood', [
    ...[[5, 10, BK.red], [27, 10, BK.blue], [5, -10, BK.yellow], [27, -10, BK.green]].map(([x, z, c]) => C(x, 10, z, 3, 20, c, WD)),
    B(16, 18.4, 12, 20, 3.2, 1.6, BK.red, WD),
    ...[10, 16, 22].map(x => DS(x, 18.4, 13, 0.9, 0.6, BK.yellow, WD)),
    B(16, 22, 0, 32, 4, 30, BK.beech, { m: 'wood', r: 1.4 }),
  ]),

  // a pedestal of red, yellow and blue drawer blocks with peg knobs, a green arch block for the other leg, a crayon pot
  // and an A block on the beech top
  piece('blkdesk', 'Wooden block desk', 2, 1, 980, 'wood', [
    ...[[4, BK.red], [12, BK.yellow], [20, BK.blue]].flatMap(([h, c]) => [B(11, h, 0, 18, 8, 24, c, { m: 'wood', r: 1.2 }), DS(11, h, 12.6, 1.8, 1.4, BK.beechL, WD)]),
    PR(54, 0, 0, archBlock(16, 24, 5), 24, BK.green),
    B(33, 16, -10.5, 26, 14, 2, BK.yellow, WD),
    B(32, 25.5, 0, 64, 3, 28, BK.beech, { m: 'wood', r: 1.2 }),
    C(8, 31, -8, 3, 8, BK.blue, WD),
    RD([7, 33, -8], [6.2, 39, -8.4], 0.7, BK.red, WD), RD([8.8, 33, -7.6], [9.6, 38, -7.4], 0.7, BK.yellow, WD), RD([8, 33, -9], [8, 40, -9], 0.7, BK.green, WD),
    ...lcube(55, 27, -6, 7, BK.red, 'A'),
  ]),

  // a beech cupboard under a red triangle roof with a yellow ball on top, a red door with a yellow star and a blue door
  // with a yellow circle, on a blue block plinth
  piece('blkwardrobe', 'Wooden block wardrobe', 2, 1, 1350, 'wood', [
    B(32, 2, 0, 58, 4, 27, BK.blue, WD),
    B(32, 32, 0, 56, 56, 26, BK.beech, { m: 'wood', r: 1.4 }),
    PR(32, 60, 0, [[-31, 0], [31, 0], [0, 15]], 28, BK.red),
    S(32, 77, 0, 2.8, 2.8, 2.8, BK.yellow, GL),
  ], {
    doors: [[18.5, 5.5, 1, BK.red, 28.5], [45.5, 58.5, -1, BK.blue, 35.5]].map(([x, hx, side, c, knob], i) => ({
      hinge: [hx, 14.4], side, parts: [
        B(x, 32, 13.7, 26, 52, 1.4, c, { m: 'wood', r: 1.4 }),
        DS(knob, 32, 15, 2, 1.6, BK.yellow, WD),
        i ? DS(x, 42, 14.8, 5.4, 0.8, BK.yellow, WD) : PR(x, 36, 14.8, starPts(6.4, 2.7), 0.8, BK.yellow),
        i ? B(x, 20, 14.8, 8, 8, 0.8, BK.green, WD) : PR(x, 15, 14.8, [[-4.4, 0], [4.4, 0], [0, 8]], 0.8, BK.green),
      ],
    })),
    inside: { x: 32, h: 32, w: 52, hh: 52, z: 13 },
  }),

  // a beech chest on red ball feet, six drawers painted red, blue, yellow and green with cream peg knobs, an A block on
  // a B block and a green ball on top
  piece('blkdresser', 'Wooden block chest of drawers', 2, 1, 850, 'wood', [
    ...[[7, -8], [57, -8], [7, 8], [57, 8]].map(([x, z]) => S(x, 1.6, z, 2.6, 1.6, 2.6, BK.red, WD)),
    B(32, 15.5, 0, 58, 25, 24, BK.beech, { m: 'wood', r: 1.4 }),
    ...[[7.4, BK.red, BK.blue], [15.4, BK.yellow, BK.green], [23.4, BK.blue, BK.red]].flatMap(([h, a, c]) => [[18, a], [46, c]].flatMap(([x, col]) => [
      B(x, h, 12.4, 25.5, 7, 0.9, col, { m: 'wood', r: 1.2 }), DS(x, h, 13.4, 1.6, 1.2, BK.cream, WD)])),
    B(32, 29.2, 0, 61, 2.4, 25, BK.beechL, WD),
    ...lcube(10, 30.4, -3, 7, BK.red, 'A'), ...lcube(10.4, 37.4, -3, 6, BK.blue, 'B'),
    S(54, 33.4, -3, 3, 3, 3, BK.green, GL),
  ]),

  // red and blue uprights, beech shelves under a yellow top with ball finials: books, letter blocks, a little ring stack
  piece('blkshelf', 'Wooden block bookcase', 1, 1, 640, 'wood', [
    B(3, 30.5, 0, 5, 61, 16, BK.red, WD), B(29, 30.5, 0, 5, 61, 16, BK.blue, WD),
    B(16, 30, -7.2, 22, 58, 1.4, BK.beechD, WD),
    ...[1.2, 20, 39].map(h => B(16, h, 0, 22, 2.4, 15, BK.beech, WD)),
    B(16, 60, 0, 31, 2.4, 17, BK.yellow, WD),
    ...[3, 29].map(x => S(x, 63.6, 0, 2.4, 2.4, 2.4, x < 16 ? BK.green : BK.orange, GL)),
    ...[[8, 14, BK.red], [11, 12, BK.green], [14, 15, BK.blue], [17, 13, BK.yellow]].map(([x, hh, c]) => B(x, 2.4 + hh / 2, 0, 2.8, hh, 11, c, { m: 'wood', r: 0.6 })),
    S(23, 6.2, 1, 3.8, 3.8, 3.8, BK.orange, GL),
    ...lcube(10.5, 21.2, 1, 8, BK.blue, 'A'), ...lcube(20.5, 21.2, 1, 8, BK.green, 'B'), ...lcube(15.5, 29.2, 1, 7, BK.red, 'C'),
    ...[[41.6, 4, BK.red], [44.4, 3.2, BK.yellow], [47, 2.4, BK.green]].map(([h, r, c]) => S(9, h, 0, r, 1.4, r, c, WD)), S(9, 49.4, 0, 1.6, 1.6, 1.6, BK.blue, GL),
    ...[[17, 13, BK.yellow], [20, 14, BK.red], [23, 12, BK.blue]].map(([x, hh, c]) => B(x, 40.2 + hh / 2, 0, 2.8, hh, 11, c, { m: 'wood', r: 0.6 })),
  ], {}),

  // a blue A block for a foot, a red cylinder, a beech dowel, a glowing yellow drum shade with a red ball on top
  piece('blklamp', 'Wooden block lamp', 1, 1, 420, 'wood', [
    ...lcube(16, 0, 0, 13, BK.blue, 'A'),
    C(16, 15.5, 0, 5, 5, BK.red, WD),
    C(16, 34, 0, 1.4, 32, BK.beech, WD),
    S(16, 50.6, 0, 2.4, 2.4, 2.4, BK.yellow, GL),
    C(16, 59, 0, 7, 14, BK.glow, { m: 'glow', rb: 11.5, seg: 16 }),
    S(16, 67.6, 0, 2.6, 2.6, 2.6, BK.red, GL),
  ], { glow: [BK.glow] }),

  // a yellow block with a cream dial, a red triangle roof, a blue ball on top, a green pendulum swinging below
  wallPiece('blkclock', 'Wooden block wall clock', 1, 520, 'wood', [
    B(16, 56, 3.5, 24, 24, 7, BK.yellow, { m: 'wood', r: 1.4 }),
    PC(16, 56, 7.1, 19, 19, dial),
    PR(16, 68, 3.5, [[-14.5, 0], [14.5, 0], [0, 12]], 7, BK.red),
    S(16, 82.4, 3.5, 2.4, 2.4, 2.4, BK.blue, GL),
    RD([16, 44, 2.4], [16, 33, 2.4], 0.45, BK.beechD, WD),
    DS(16, 30.5, 2.4, 3.6, 1.4, BK.green, WD),
  ]),

  // three panels framed in red, yellow and blue, A B C painted on cream with a shape under each, on green block feet
  piece('blkscreen', 'Wooden block screen', 2, 1, 680, 'wood', [
    ...[[11, 3, 0, BK.red, BK.blue], [32, -3, 1, BK.yellow, BK.red], [53, 3, 2, BK.blue, BK.green]].flatMap(([x, z, i, c, top]) => [
      ...[-6, 6].map(dx => B(x + dx, 2, z, 4.4, 4, 4.4, BK.green, WD)),
      B(x, 31, z, 20.4, 54, 2.2, c, { m: 'wood', r: 1.4 }),
      PC(x, 31.5, z + 1.2, 16, 47, panel(i)),
      S(x, 60.4, z, 2.4, 2.4, 2.4, top, GL),
    ]),
    ...[21.5, 42.5].flatMap(x => [16, 46].map(h => B(x, h, 0, 1.4, 3, 7, BK.beechD, WD))),
  ]),

  // a mirror framed in red, blue, yellow and green bars, a green arch block on top
  wallPiece('blkmirror', 'Wooden block mirror', 1, 480, 'wood', [
    B(16, 60, 1.4, 18, 24, 1, BK.mirror, GL),
    B(5, 60, 2, 4, 23.2, 4, BK.yellow, WD), B(27, 60, 2, 4, 23.2, 4, BK.green, WD),
    B(16, 73.6, 2, 26, 4, 4, BK.red, WD), B(16, 46.4, 2, 26, 4, 4, BK.blue, WD),
    PR(16, 75.6, 2, archBlock(14, 6, 3.6), 4, BK.green),
  ]),

  // a beech rail of A to F blocks in six colours, a row of pennants under it
  wallPiece('blkfrieze', 'Wooden block ABC frieze', 2, 360, 'wood', [
    B(32, 50, 4, 62, 3, 8, BK.beech, WD),
    ...'ABCDEF'.split('').flatMap((ch, i) => lcube(6 + i * 10.4, 51.5, 4.2, 8.4, [BK.red, BK.yellow, BK.blue, BK.green, BK.orange, BK.purple][i], ch)),
    ...Array.from({ length: 7 }, (_, i) => PR(4.6 + i * 9.13, 48.5, 2, [[-3.6, 0], [3.6, 0], [0, -7]], 0.8, [BK.green, BK.red, BK.blue, BK.yellow][i % 4])),
  ]),

  // a beech plank on red and blue brackets: a row of coloured pegs under it with a ring and a ball on a string hung up,
  // an A block, a Poké Ball, an arch, a cylinder and a 1 block on top
  wallPiece('blkpegshelf', 'Wooden block peg shelf', 2, 400, 'wood', [
    B(32, 64, 4, 60, 3, 8, BK.beech, WD),
    B(8, 59, 2.5, 4, 7, 5, BK.red, WD), B(56, 59, 2.5, 4, 7, 5, BK.blue, WD),
    ...[[16, BK.yellow], [24, BK.green], [32, BK.red], [40, BK.blue], [48, BK.orange]].map(([x, c]) => DS(x, 52, 3.5, 2, 7, c, WD)),
    RG(24, 49.4, 6, 3.6, 1, BK.purple, WD),
    RD([40, 51, 6], [40, 44.6, 6], 0.25, BK.ink, PL), S(40, 42.2, 6, 2.6, 2.6, 2.6, BK.red, GL),
    ...lcube(12, 65.5, 4, 7, BK.red, 'A'), ...pball(24, 65.5, 4, 3.4),
    PR(36, 65.5, 4, archBlock(10, 6, 2.6), 6, BK.green), C(46, 69, 4, 3, 7, BK.yellow, WD), ...lcube(54.5, 65.5, 4, 6, BK.blue, '1'),
  ]),

  // a red toy chest on yellow peg feet, T O Y painted on its front, a blue lid with a yellow knob
  piece('blkchest', 'Wooden block toy chest', 1, 1, 560, 'wood', [
    ...[[5, -8], [27, -8], [5, 8], [27, 8]].map(([x, z]) => C(x, 1, z, 2, 2, BK.yellow, WD)),
    B(16, 11, 0, 28, 18, 24, BK.red, { m: 'wood', r: 1.4 }),
    ...[['T', 7.6, BK.yellow], ['O', 16, BK.blue], ['Y', 24.4, BK.green]].map(([ch, x, c]) => PC(x, 11, 12.1, 7.4, 7.4, face(ch, c))),
    B(16, 21.6, 0, 30, 3.2, 26, BK.blue, { m: 'wood', r: 1.4 }),
    DS(16, 21.6, 13.2, 2, 0.8, BK.yellow, WD),
  ]),

  // A on B on a green cylinder, C, an orange arch and a green triangle on top; a 1 block and a purple cylinder fallen
  piece('blktower', 'Wooden block tower', 1, 1, 300, 'wood', [
    ...lcube(16, 0, 0, 14, BK.red, 'A'), ...lcube(15.4, 14, 0.6, 12, BK.blue, 'B'),
    C(16.4, 30, 0, 5.6, 8, BK.green, WD),
    ...lcube(16, 34, 0, 10, BK.yellow, 'C'),
    PR(16, 44, 0, archBlock(14, 7, 3.4), 9, BK.orange),
    PR(16, 51, 0, [[-7, 0], [7, 0], [0, 9]], 9, BK.green),
    ...lcube(5, 0, 8, 6.4, BK.green, '1'),
    DS(27, 3, 7, 3, 8, BK.purple, WD),
  ]),

  // five rings red to blue on a beech peg, a Poké Ball on top
  piece('blkrings', 'Wooden block stacking rings', 1, 1, 220, 'wood', [
    C(16, 2, 0, 10, 4, BK.beech, WD),
    C(16, 18, 0, 1.6, 28, BK.beechD, WD),
    ...RAINBOW.map((c, i) => S(16, 6.6 + i * 5.2, 0, 10.5 - i * 1.3, 2.6, 10.5 - i * 1.3, c, GL)),
    ...pball(16, 30, 0, 3.4),
  ]),

  // a blue box under a red lid, four holes along its face, a cylinder, a cube, a triangle and a star waiting in front
  piece('blksorter', 'Wooden block shape sorter', 1, 1, 340, 'wood', [
    B(16, 9, -2, 22, 18, 18, BK.blue, { m: 'wood', r: 1.4 }),
    PC(16, 12.6, 7.1, 19, 8.4, sorterHoles),
    B(16, 18.8, -2, 24, 2, 20, BK.red, WD),
    C(6, 2.6, 11.5, 3, 5.2, BK.red, WD),
    cube(13.4, 0, 12, 5.4, BK.yellow),
    PR(20.6, 0, 11.5, [[-3.2, 0], [3.2, 0], [0, 5.6]], 5, BK.green),
    PR(28, 0, 11, starPts(3.6, 1.6), 3, BK.orange),
  ]),

  // Psyduck holding its head on a red cart, yellow wheels, a string to pull it by
  piece('blkpsyduck', 'Wooden block pull-along Psyduck', 1, 1, 480, 'gloss', [
    B(16, 6, 0, 26, 5, 16, BK.red, { m: 'wood', r: 1.4 }),
    ...[7, 25].flatMap(x => [-1, 1].flatMap(s => [DS(x, 4, s * 8.8, 4, 1.6, BK.yellow, WD), DS(x, 4, s * 9.9, 1.2, 0.6, BK.beechD, WD)])),
    RD([29, 6, 4], [30.6, 1.4, 12], 0.25, BK.ink, PL), S(30.4, 1.4, 12.6, 1.3, 1.3, 1.3, BK.blue, GL),
    ...[12, 20].map(x => S(x, 9.4, 4, 2.6, 1.2, 3.4, BK.beak, GL)),
    S(16, 15, 0, 8, 7, 7, BK.psy, GL),
    ...[-1, 1].flatMap(s => [RD([16 + s * 5.6, 18, 1], [16 + s * 6.8, 26, 1.5], 1.6, BK.psy, GL), S(16 + s * 6.8, 28, 1.5, 2.2, 2.6, 2.2, BK.psy, GL)]),
    S(16, 27, 0, 7, 6.4, 6.4, BK.psy, GL),
    S(16, 25.4, 5.6, 3.8, 1.8, 2.6, BK.beak, GL),
    ...[-1, 1].flatMap(s => [DS(16 + s * 2.8, 28.8, 5.6, 1.9, 0.5, BK.white, { m: 'plain', ry: 2.2, seg: 10 }), DS(16 + s * 2.5, 28.6, 6, 0.7, 0.4, BK.ink, { m: 'plain', seg: 6 })]),
    ...[[15, 14], [16, 16], [17, 18]].map(([a, b]) => RD([a, 33, 0], [b, 37.6, 0], 0.45, BK.ink, PL)),
  ]),

  // a cream Ponyta on beech rockers, a red saddle, a mane and tail of red, orange and yellow wooden flames, a peg for
  // a handle
  piece('blkponyta', 'Wooden block rocking Ponyta', 2, 1, 900, 'wood', [
    ...[-6, 6].map(z => RG(32, 71.6, z, 70, 1.6, BK.beech, { m: 'wood', a0: Math.PI * 1.5 - 0.42, arc: 0.84 })),
    ...[-1, 1].flatMap(s => [RD([14, 4, s * 6], [20, 20, s * 4], 1.8, BK.pony, WD), RD([50, 4, s * 6], [44, 20, s * 4], 1.8, BK.pony, WD),
      S(14.4, 5, s * 6, 2.4, 1.6, 2.4, BK.hoof, WD), S(49.6, 5, s * 6, 2.4, 1.6, 2.4, BK.hoof, WD)]),
    S(32, 24, 0, 16, 7.5, 7, BK.pony, WD),
    ...[[15, 23, 9, -0.9, BK.flameR], [16, 25.4, 7, -0.7, BK.flame], [17, 27, 5.4, -0.5, BK.flameY]].map(([x, h, s, l, c]) => PR(x, h, 0, flame(s, l), 2.4, c)),
    B(31, 31.2, 0, 13, 2.6, 14.4, BK.red, { m: 'wood', r: 1.2 }),
    RD([43, 27, 0], [50, 37, 0], 4.2, BK.pony, WD),
    ...[[43.4, 30.6, 7, BK.flameR], [46, 34.6, 7.4, BK.flame], [48.6, 38.8, 6.8, BK.flameY], [50.6, 43, 5.4, BK.flame]].map(([x, h, s, c]) => PR(x, h, -0.6, flame(s, -0.45), 2.8, c)),
    S(53, 40, 0, 6.6, 4.8, 4.6, BK.pony, WD),
    S(58.4, 38.2, 0, 3.2, 3, 3.6, BK.ponyD, WD),
    PR(52, 43.6, 0, [[-1.6, 0], [1.6, 0], [0.2, 4.4]], 2, BK.pony),
    DS(54.4, 41.4, 4.3, 1, 0.4, BK.ink, { m: 'plain', ry: 1.3, seg: 8 }),
    DS(51.5, 41, 0, 1, 14, BK.red, WD),
  ]),

  // Ditto popped up on a spring from a blue D block, its red lid flipped back, a crank on its side
  piece('blkditto', 'Ditto block jack-in-the-box', 1, 1, 520, 'wood', [
    B(16, 9, 0, 22, 18, 22, BK.blue, { m: 'wood', r: 1.4 }),
    PC(16, 9, 11.1, 14, 14, face('D', BK.blue)),
    B(16, 18.6, 0, 23, 1.6, 23, BK.yellow, WD),
    B(16, 29, -12.4, 23, 20, 1.6, BK.red, WD),
    RD([27, 10, 0], [30, 10, 0], 0.7, BK.beechD, WD), RD([30, 10, 0], [30, 15, 2], 0.6, BK.beechD, WD), S(30, 15.5, 2.4, 1.3, 1.3, 1.3, BK.yellow, GL),
    ...[20.4, 22.2, 24].map(h => RG(16, h, 0, 3.4, 0.7, BK.steel, { m: 'gloss', flat: true })),
    S(16, 31, 0, 9.6, 6.2, 7.4, BK.ditto, GL),
    S(11.5, 36, -1, 4.2, 2.8, 4.2, BK.ditto, GL), S(20.4, 36.4, -1, 3.8, 2.6, 3.8, BK.ditto, GL),
    S(6.6, 30, 1, 2.6, 2.2, 2.4, BK.ditto, GL), S(25.4, 30.6, 1, 2.6, 2.2, 2.4, BK.ditto, GL),
    ...[13.5, 18.5].map(x => DS(x, 32, 7.3, 0.55, 0.4, BK.ink, { m: 'plain', ry: 0.9, seg: 6 })),
    RG(16, 31.2, 7.1, 2.4, 0.3, BK.ink, { m: 'plain', a0: Math.PI + 0.5, arc: Math.PI - 1 }),
  ]),

  // a beech play kitchen: a red oven door, a blue cupboard, a green counter with two hobs, a yellow kettle and a blue
  // pan, a sink and tap, a yellow back with a little clock
  piece('blkkitchen', 'Wooden block play kitchen', 2, 1, 1150, 'wood', [
    B(32, 14, 0, 60, 28, 22, BK.beech, { m: 'wood', r: 1.4 }),
    B(17, 13, 11.5, 24, 18, 1, BK.red, { m: 'wood', r: 1.2 }),
    B(17, 12, 12.2, 15, 9, 0.4, BK.window, { m: 'gloss', r: 1 }),
    RD([9, 19.4, 13.2], [25, 19.4, 13.2], 0.7, BK.yellow, WD),
    B(47, 13, 11.5, 24, 18, 1, BK.blue, { m: 'wood', r: 1.2 }), DS(56, 13, 12.6, 1.6, 1.2, BK.yellow, WD),
    ...[[8, BK.green], [13, BK.yellow], [18, BK.blue]].map(([x, c]) => DS(x, 25, 11.6, 1.3, 1, c, WD)),
    B(32, 29.2, 0, 62, 2.4, 24, BK.green, WD),
    ...[12, 24].map(x => C(x, 30.8, 1, 4.6, 0.8, BK.ink, PL)),
    LA(12, 31.2, 1, [[0, 0], [4.4, 0], [5, 1.6], [5, 4], [3.6, 6.2], [1.6, 7], [0, 7.2]], BK.yellow, { m: 'gloss', seg: 12 }),
    S(12, 39, 1, 1.3, 1.1, 1.3, BK.red, GL), RD([16, 33, 1], [19, 36.4, 1], 0.8, BK.yellow, GL),
    RG(12, 37.4, 1, 3.4, 0.6, BK.red, { m: 'gloss', a0: 0.25, arc: Math.PI - 0.5 }),
    C(24, 32.4, 1, 4, 2.4, BK.blue, GL), RD([28, 33.2, 1], [33, 34, 1], 0.7, BK.blue, GL),
    C(48, 30.7, 1, 7, 0.6, BK.water, PL),
    RD([48, 30.4, -8], [48, 38, -8], 0.9, BK.steel, GL), RD([48, 38, -8], [48, 38, -3], 0.9, BK.steel, GL),
    S(44, 31.6, -8, 1.2, 1.2, 1.2, BK.red, GL), S(52, 31.6, -8, 1.2, 1.2, 1.2, BK.blue, GL),
    B(32, 38, -10.5, 60, 15, 2, BK.yellow, WD),
    PC(36, 40, -9.4, 7, 7, dial),
  ]),

  // a red engine with a blue cab, a green boiler and a red funnel, pulling two beech wagons of letter blocks
  piece('blktrain', 'Wooden block alphabet train', 2, 1, 760, 'wood', [
    B(52, 6, 0, 20, 4, 12, BK.red, WD),
    B(46.5, 15, 0, 9, 14, 12, BK.blue, { m: 'wood', r: 1.2 }), B(46.5, 17, 6.2, 5, 5, 0.4, BK.beechL, PL),
    B(46.5, 23.2, 0, 12, 2.4, 14, BK.yellow, WD),
    B(56.5, 12.5, 0, 11, 9, 10, BK.green, { m: 'wood', r: 1.4 }),
    C(58, 20, 0, 2.2, 6, BK.red, WD), C(58, 23.6, 0, 3, 1.4, BK.ink, WD),
    ...[-1, 1].flatMap(s => [DS(46, 3.8, s * 6.6, 3.8, 1.2, BK.yellow, WD), DS(57, 3.2, s * 6.6, 3.2, 1.2, BK.yellow, WD)]),
    ...[[31, BK.blue], [11, BK.green]].flatMap(([x, c]) => [B(x, 6, 0, 18, 3, 11, BK.beech, WD), ...[-1, 1].flatMap(s => [-5.5, 5.5].map(dx => DS(x + dx, 3, s * 6, 3, 1.2, c, WD)))]),
    RD([40, 6, 0], [42, 6, 0], 0.6, BK.ink, PL), RD([20, 6, 0], [22, 6, 0], 0.6, BK.ink, PL),
    ...lcube(26.5, 7.5, 0, 8, BK.red, 'A'), ...lcube(35.5, 7.5, 0, 8, BK.yellow, 'B'),
    ...lcube(6.5, 7.5, 0, 8, BK.green, 'C'),
    C(15.5, 11.5, 0, 3.8, 8, BK.blue, WD), S(15.5, 17.6, 0, 2.2, 2.2, 2.2, BK.red, GL),
  ]),

  // a red and a blue post on a green base, a yellow top bar, five rods of beads red to blue
  piece('blkabacus', 'Wooden block abacus', 1, 1, 360, 'wood', [
    B(16, 2, 0, 30, 4, 14, BK.green, { m: 'wood', r: 1.4 }),
    B(4, 22, 0, 5, 36, 7, BK.red, WD), B(28, 22, 0, 5, 36, 7, BK.blue, WD),
    B(16, 42, 0, 30, 4, 8, BK.yellow, { m: 'wood', r: 1.4 }),
    ...[10, 16, 22, 28, 34].flatMap((h, row) => {
      const left = [3, 1, 4, 2, 0][row];
      return [RD([6.5, h, 0], [25.5, h, 0], 0.5, BK.beechD, WD),
        ...Array.from({ length: 5 }, (_, k) => S(k < left ? 8.2 + k * 3.4 : 23.8 - (4 - k) * 3.4, h, 0, 1.7, 2.5, 2.5, RAINBOW[4 - row], { m: 'gloss', seg: 8 }))];
    }),
  ]),

  // a rounded play mat: a border of coloured squares round a cream field, a circle, a square, a triangle and a star over
  // A B C D
  { id: 'blkrug', name: 'Wooden block shapes rug', group: GROUP, solo: true, w: 3, h: 2, layer: 'rug', price: 720, high: 0.04, side: 'c', flat() {
    const g = ctx(), path = () => { g.beginPath(); RUG.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
    g.fillStyle = BK.beech; path(); g.fill();
    g.save(); path(); g.clip();
    const cols = [BK.red, BK.yellow, BK.blue, BK.green];
    for (let i = 0; i < 12; i++) for (const y of [3.4, 54.2]) { g.fillStyle = cols[(i + (y > 30 ? 2 : 0)) % 4]; g.beginPath(); g.roundRect(4 + i * 7.5, y, 6.4, 6.4, 1.2); g.fill(); }
    for (let j = 0; j < 5; j++) for (const x of [3.4, 86.2]) { g.fillStyle = cols[(j + (x > 40 ? 3 : 1)) % 4]; g.beginPath(); g.roundRect(x, 12 + j * 8, 6.4, 6.4, 1.2); g.fill(); }
    g.fillStyle = BK.cream; g.beginPath(); g.roundRect(12, 12, 72, 40, 4); g.fill();
    for (let x = 12; x < 84; x += 2) for (let y = 12; y < 52; y += 2) if (hash(x, y, 7) < 0.1) { g.fillStyle = 'rgba(0,0,0,0.05)'; g.fillRect(x, y, 1, 1); }
    [['circle', BK.red, 'A'], ['square', BK.blue, 'B'], ['triangle', BK.yellow, 'C'], ['star', BK.green, 'D']].forEach(([k, c, ch], i) => {
      const cx = 21 + i * 18;
      shapeOn(g, k, cx, 24, 12, c);
      glyph(g, ch, cx, 42, 1.8, i === 2 ? BK.yellowD : c);
    });
    g.restore();
    g.strokeStyle = BK.beechD; g.lineWidth = 1; path(); g.stroke();
  } },
];
