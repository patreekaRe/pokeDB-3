/* base-furniture-craft.js  -  the Craft and sewing room set (furniture expansion session k, 2026-10-17): a whole room of a
   cosy maker's studio, as Animal Crossing's Happy Home Paradise does a room type. Warm pine and cork, kraft paper,
   pastel thread spools and yarn, bright bolts of fabric. A sewing machine on its pine table and an overlocker on its
   cart (they whirr when tapped), a floor loom, a quilting frame, an ironing station (it steams), a cutting table with
   its green mat and rotary cutter, an embroidery hoop on its stand, a dress form with a half-made outfit (it turns), a
   kraft paper roll that hands out a sheet, a magnifier lamp that lights, a craft desk whose cupboard opens, a drawer
   cart, a cubby of yarn, a basket of it, a rail of finished clothes, a sewing chair, a pincushion stool, a knitted
   pouf, a spool rack, a pegboard of scissors and ribbons, a mood board and a patchwork rug. Leavanny tailoring a leaf
   dress on its form, Smeargle painting at the easel with its tail, Sewaddle curled on the fabric bolt rack and a
   Furret quilt on the frame for the Pokémon touches. All solo, fixed colours, sold all year.
   An upright piece is a list of parts in painted units (32 a tile), as in js/base-furniture-ramen.js: `x` across from
   the left of its front, `h` up from the floor (a wall piece's from the foot of its strip), `z` out to the front from
   its middle (a wall piece's from the wall). They're painted here from any side, and js/base-models-craft.js builds the
   same list as 3D parts (BUILT), so picture and model agree. A ring or disc with `ax: 'x'` stands side-on (the sewing
   machine's handwheel, the rotary cutter's blade, the ribbon spools, the kraft roll). `tex` is painted only (the model
   stays plain colour): `grain` a pine board's streaks, `cork` cork's speckle, `perf` a pegboard's holes, `knit` knitted
   stitches, `weave` a wicker basket's weave, `warp` a loom's threads, `grid` a cutting mat's lines. A `pic` part (the
   quilt, the hoop's embroidery, Smeargle's canvas, the sketch, the labels) is painted on the front only, and the model
   wears that crop of the painting. The craft desk's cupboard door swings (`doors`, `inside`). The rug is painted from
   above (RUG). */

import { sh, oval, ovalShade, floorShadow, ctx, hash, glass as glassPane } from './base-paint.js';

export const CR = {
  pine: '#d9a66a', pineL: '#e8c48e', pineD: '#b07c44', pineK: '#7a5230', cork: '#c49a62', kraft: '#c8a066', kraftD: '#a07a40',
  wicker: '#c8a060', paper: '#f6f1e4', cream: '#f3e9d2', creamD: '#dccfb2', white: '#faf7f0', board: '#dcc8a0',
  steel: '#b9bec4', steelL: '#e2e6ea', steelD: '#7d848c', black: '#2a2628', blackL: '#4a4448',
  mat: '#3f8f6e', matL: '#a8dcc4', tomato: '#d8443c', red: '#c8303a', leaf: '#5a9a3a', leafL: '#86c058', leafD: '#3f7428',
  pink: '#f4b6c2', mint: '#a8dcc4', sky: '#a8ccec', lemon: '#f6e08a', lilac: '#c8b0e4', peach: '#f8c4a0', coral: '#ec7a6a',
  teal: '#2a9aa0', mustard: '#e0a830', fuchsia: '#d04a8a', cobalt: '#3a62c0', grass: '#6ab04a', orange: '#ec8a3a',
  bulb: '#fff4cc', yellow: '#f0d040', yellowD: '#c8a828', furret: '#8a5a3c', furretC: '#f2dcb4', smear: '#f2ecdc', smearB: '#8a6440',
};
const T = CR;
const GROUP = 'Craft room';
const TAU = Math.PI * 2;
const PASTEL = [T.pink, T.mint, T.sky, T.lemon, T.lilac, T.peach];
const BRIGHT = [T.teal, T.mustard, T.fuchsia, T.cobalt, T.grass, T.orange, T.coral];

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

const CL = { m: 'cloth' }, PL = { m: 'plain' }, GL = { m: 'gloss' }, WD = { m: 'wood' }, MT = { m: 'metal' };
const GR = { m: 'wood', tex: 'grain' };

/** A little castor at x, z: its stem and a ball for a wheel. */
const caster = (x, z) => [RD([x, 2.4, z], [x, 4, z], 0.5, T.steelD, MT), S(x, 1.3, z, 1.3, 1.3, 1.3, T.black, { m: 'gloss', seg: 6 })];
/** A pair of scissors hanging point down from x, h (z from the wall): two coloured finger loops and steel blades. */
const hangScissors = (x, h, z, c, len = 9) => [
  RG(x - 1.5, h, z, 1.3, 0.45, c, { m: 'gloss' }), RG(x + 1.5, h, z, 1.3, 0.45, c, { m: 'gloss' }),
  RD([x - 0.8, h - 1.2, z], [x + 0.3, h - len, z], 0.4, T.steelL, MT), RD([x + 0.8, h - 1.2, z], [x - 0.3, h - len, z], 0.4, T.steelL, MT),
];
/** A pair of scissors lying open on a top at h, from x, z pointing right. */
const flatScissors = (x, h, z, c, len = 7) => [
  RG(x, h + 0.4, z, 1.1, 0.35, c, { m: 'gloss', flat: true }), RG(x, h + 0.4, z + 2.6, 1.1, 0.35, c, { m: 'gloss', flat: true }),
  RD([x + 1, h + 0.4, z + 0.4], [x + len, h + 0.4, z + 1.8], 0.35, T.steelL, MT), RD([x + 1, h + 0.4, z + 2.2], [x + len, h + 0.4, z + 0.8], 0.35, T.steelL, MT),
];
/** A thread spool standing at x, h, z: its thread in c between two pine flanges. */
const spool = (x, h, z, c, k = 1) => [
  C(x, h, z, 1.5 * k, 3.6 * k, c, { m: 'cloth', seg: 8 }),
  C(x, h - 2 * k, z, 1.9 * k, 0.6 * k, T.pineL, { m: 'wood', seg: 8 }), C(x, h + 2 * k, z, 1.9 * k, 0.6 * k, T.pineL, { m: 'wood', seg: 8 }),
];

/** Sewaddle lying with its head to the front at x, h (its belly), z: a yellow grub of three segments under its leaf hood,
    the leaf standing on top, black eyes and its orange mandibles. */
const sewaddle = (x, h, z) => [
  S(x + 3, h + 2.6, z - 6, 2.8, 2.6, 2.8, T.yellow, { m: 'cloth', seg: 8 }),
  S(x + 1.2, h + 3, z - 2.6, 3.4, 3, 3.2, T.yellow, { m: 'cloth', seg: 8 }),
  S(x, h + 5.6, z + 0.6, 5.6, 5.4, 4.6, T.leaf, { m: 'cloth', seg: 10 }),
  S(x, h + 4.8, z + 2.4, 4.2, 4, 3.4, T.yellow, { m: 'cloth', seg: 10 }),
  PR(x, h + 10, z, [[-1.4, 0], [1.4, 0], [2.6, 3.4], [0, 7], [-2.6, 3.4]], 0.8, T.leafL, GL),
  ...[-1, 1].map(sg => DS(x + sg * 1.7, h + 5.4, z + 5.6, 0.8, 0.4, T.black, { m: 'gloss', seg: 6 })),
  ...[-1, 1].map(sg => S(x + sg * 1.2, h + 2.2, z + 5.2, 0.8, 0.9, 0.8, T.orange, { m: 'gloss', seg: 6 })),
];

/** Leavanny standing at x (its feet on the floor), z: thin yellow legs, a skirt and collar of leaves, a yellow head under
    its pointed leaf hood, one blade arm reaching left with a needle, the other at its side. */
const leavanny = (x, z) => [
  ...[-1, 1].flatMap(sg => [RD([x + sg * 3, 1, z + 1], [x + sg * 1.6, 15, z], 0.8, T.yellow, PL), S(x + sg * 3.2, 1, z + 2, 1.4, 1, 2, T.yellowD, { m: 'gloss', seg: 6 })]),
  PR(x, 12, z, [[-5.4, 3], [0, 0], [5.4, 3], [4.4, 14], [0, 17], [-4.4, 14]], 5, T.leaf, CL),
  S(x, 27, z, 3, 6, 2.8, T.yellow, { m: 'cloth', seg: 8 }),
  PR(x, 27.6, z + 2.6, [[-5.6, 4], [0, 0], [5.6, 4], [0, 6.4]], 1, T.leafD, CL),
  PR(x, 33, z - 1.8, [[-6, 0], [6, 0], [6.4, 6], [3, 11], [0, 15.4], [-3, 11], [-6.4, 6]], 2.4, T.leaf, CL),
  S(x, 37.4, z + 0.6, 4.2, 4.6, 3.8, T.yellow, { m: 'cloth', seg: 10 }),
  ...[-1, 1].map(sg => DS(x + sg * 1.6, 38, z + 4.3, 0.9, 0.4, T.red, { m: 'gloss', seg: 6 })),
  RD([x - 2.6, 31, z + 1], [x - 7, 30, z + 3], 0.7, T.yellow, PL),
  PR(x - 7, 30, z + 3, [[0, -1], [0, 1], [-5, 1.8], [-9, 0], [-5, -1.8]], 0.8, T.leafL, GL),
  RD([x - 15.6, 30.6, z + 3], [x - 20, 31.4, z + 3], 0.25, T.steelL, MT),
  RD([x + 2.6, 31, z + 1], [x + 5, 25, z + 2], 0.7, T.yellow, PL),
  PR(x + 5, 25, z + 2, [[-1, 0], [1, 0], [1.6, -5], [0, -9], [-1.6, -5]], 0.8, T.leafL, GL),
];

/** Smeargle standing at x, z, painting with its tail: a cream body, its brown beret, an arm out holding the palette, its
    tail curling up past its shoulder with a green-dipped tip to the canvas at tip [x, h, z]. */
const smeargle = (x, z, tip) => [
  ...[-1, 1].map(sg => S(x + sg * 4, 1.8, z + 2, 2.6, 1.8, 3, T.smear, { m: 'cloth', seg: 8 })),
  S(x, 13, z, 6.6, 9, 6, T.smear, { m: 'cloth', seg: 12 }),
  ...[[3.4, 9, -5], [-2.6, 15, -5.2]].map(([dx, dh, dz]) => S(x + dx, dh, z + dz, 1.8, 1.8, 1, T.smearB, { m: 'cloth', seg: 6 })),
  S(x, 27, z + 1, 5.8, 5.2, 5.2, T.smear, { m: 'cloth', seg: 10 }),
  S(x, 30.6, z, 6.2, 3, 5.6, T.smearB, { m: 'cloth', seg: 10 }),
  S(x - 5.6, 28, z - 1, 1.6, 3.4, 1.6, T.smearB, { m: 'cloth', seg: 6 }),
  ...[-1, 1].map(sg => DS(x + sg * 2, 27.4, z + 6, 0.8, 0.4, T.black, { m: 'gloss', seg: 6 })),
  DS(x, 25, z + 6, 1, 0.3, T.smearB, { m: 'plain', ry: 0.5, seg: 6 }),
  RD([x - 5, 17, z + 2], [x - 9, 19, z + 4], 1.2, T.smear, CL),
  DS(x - 10.6, 19.6, z + 4.6, 4, 0.6, T.pineL, { m: 'wood', ry: 3, seg: 12 }),
  ...[[-12.6, 21, T.cobalt], [-10, 22, T.fuchsia], [-8.4, 20, T.lemon], [-12, 18, T.grass]].map(([dx, dh, c]) => S(x + dx, dh, z + 5.2, 0.9, 0.8, 0.5, c, { m: 'gloss', seg: 6 })),
  RD([x + 4, 9, z - 4], [x + 10, 13, z - 2], 1.4, T.smear, CL),
  RD([x + 10, 13, z - 2], [tip[0] - 2, tip[1] - 8, tip[2] - 2], 1.2, T.smear, CL),
  RD([tip[0] - 2, tip[1] - 8, tip[2] - 2], tip, 1, T.smear, CL),
  S(tip[0] + 0.6, tip[1] + 1, tip[2], 2, 2.6, 2, T.grass, { m: 'gloss', seg: 8 }),
];

/** A dress form on a pine tripod at x, z: its cream torso on a pole, a knob for a neck, wearing `dress`. */
const dressForm = (x, z, dress = []) => [
  ...[[-10, -6], [10, -6], [0, 11]].flatMap(([dx, dz]) => [RD([x, 5, z], [x + dx, 1.4, z + dz], 0.9, T.pineD, WD), S(x + dx, 1, z + dz, 1.1, 1, 1.1, T.pineK, { m: 'wood', seg: 6 })]),
  C(x, 13, z, 1, 18, T.pineD, { m: 'wood', seg: 8 }),
  LA(x, 22, z, [[6.4, 0], [7.6, 3], [6.6, 9], [5.4, 13], [6.6, 18], [7.2, 21], [5.8, 24], [2.2, 25.6], [2.2, 27.6], [0, 28]], T.cream, { m: 'cloth', seg: 14 }),
  S(x, 51, z, 1.8, 1.6, 1.8, T.pineD, { m: 'wood', seg: 8 }),
  ...dress,
];

/* ---------- painting the parts ---------- */

function grad(g, x0, y0, x1, y1, c, m) {
  const l = g.createLinearGradient(x0, y0, x1, y1);
  if (m === 'metal') [[0, sh(c, 2)], [0.25, c], [0.55, sh(c, -1)], [0.8, sh(c, 1)], [1, sh(c, -1)]].forEach(s => l.addColorStop(...s));
  else [[0, sh(c, 1)], [0.35, c], [1, sh(c, -1)]].forEach(s => l.addColorStop(...s));
  return l;
}
function rbx(x, y, w, h, r, c, m) {
  if (w <= 0 || h <= 0) return;
  const g = ctx();
  if (m === 'glass') { g.save(); g.globalAlpha *= 0.4; glassPane(x, y, w, h, '#cfe8f4'); g.restore(); return; }
  if (m === 'plain' || m === 'glow') { g.fillStyle = c; g.beginPath(); g.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); g.fill(); return; }
  g.fillStyle = grad(g, x, y, x + w * 0.3, y + h, c, m); g.beginPath(); g.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); g.fill();
  if (h > 3 && w > 3) { g.save(); g.globalAlpha *= 0.4; g.fillStyle = sh(c, 2); g.fillRect(x + Math.min(r, w / 2) * 0.6, y + 0.3, w - Math.min(r, w / 2) * 1.2, 0.5); g.restore(); }
}
function poly(pts, c, m, horiz) {
  const g = ctx(), xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  if (m === 'glass') { g.save(); g.globalAlpha *= 0.35; }
  if (m === 'plain' || m === 'glow') g.fillStyle = c;
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
  if (m === 'glow' || m === 'plain') { oval(cx, cy, rx, ry, c); return; }
  if (m === 'glass') { g.save(); g.globalAlpha *= 0.4; oval(cx, cy, rx, ry, '#dff0f8'); g.restore(); return; }
  ovalShade(cx, cy, rx, ry, c);
  if (m === 'gloss' || m === 'metal') { g.save(); g.globalAlpha *= 0.55; oval(cx - rx * 0.38, cy - ry * 0.42, rx * 0.22, ry * 0.14, '#ffffff'); g.restore(); }
}
const polyPath = (pts) => { const p = new Path2D(); pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); p.closePath(); return p; };
const bounds = (pts) => { const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; };


/** The painted-only surface of a part (`tex`), inside its outline `path` over bounds bb. */
function texture(q, path, bb) {
  const g = ctx(), [x0, y0, x1, y1] = bb, c = q.c, seed = Math.round(q.x * 7 + q.h * 13 + q.z * 3);
  g.save(); g.clip(path);
  if (q.tex === 'grain') {
    g.lineWidth = 0.3;
    for (let y = y0 + 0.7, i = 0; y < y1; y += 0.9, i++) {
      const a = x0 + hash(i, seed, 1) * (x1 - x0) * 0.5, l = (x1 - x0) * (0.3 + hash(i, seed, 2) * 0.6);
      g.globalAlpha = 0.3; g.strokeStyle = hash(i, seed, 3) < 0.5 ? sh(c, -2) : sh(c, 1);
      g.beginPath(); g.moveTo(a, y); g.bezierCurveTo(a + l * 0.3, y + 0.3, a + l * 0.6, y - 0.3, a + l, y); g.stroke();
    }
  } else if (q.tex === 'cork') {
    for (let i = 0; i < (x1 - x0) * (y1 - y0) * 0.6; i++) {
      g.globalAlpha = 0.5; g.fillStyle = hash(i, seed, 4) < 0.5 ? sh(c, -2) : sh(c, 1);
      g.fillRect(x0 + hash(i, seed, 5) * (x1 - x0), y0 + hash(i, seed, 6) * (y1 - y0), 0.35, 0.35);
    }
  } else if (q.tex === 'perf') {
    g.fillStyle = sh(c, -3); g.globalAlpha = 0.7;
    for (let y = y0 + 1.6; y < y1 - 0.5; y += 2.4) for (let x = x0 + 1.6; x < x1 - 0.5; x += 2.4) { g.beginPath(); g.arc(x, y, 0.35, 0, TAU); g.fill(); }
  } else if (q.tex === 'knit') {
    g.lineWidth = 0.35; g.globalAlpha = 0.55;
    for (let y = y0 + 0.6, r = 0; y < y1; y += 1.4, r++) for (let x = x0 + (r % 2) * 0.6; x < x1; x += 1.2) {
      g.strokeStyle = sh(c, -2); g.beginPath(); g.moveTo(x, y); g.lineTo(x + 0.6, y + 1.1); g.lineTo(x + 1.2, y); g.stroke();
    }
  } else if (q.tex === 'weave') {
    for (let y = y0, r = 0; y < y1; y += 1.4, r++) for (let x = x0 + (r % 2) * 1.3; x < x1; x += 2.6) {
      g.globalAlpha = 0.45; g.fillStyle = sh(c, -2); g.fillRect(x, y, 1.3, 1.4);
      g.globalAlpha = 0.35; g.fillStyle = sh(c, 2); g.fillRect(x + 1.3, y + 0.2, 1.3, 0.4);
    }
  } else if (q.tex === 'warp') {
    g.lineWidth = 0.25;
    for (let x = x0 + 0.4, i = 0; x < x1; x += 0.8, i++) { g.globalAlpha = 0.6; g.strokeStyle = i % 2 ? sh(c, -2) : sh(c, 1); g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y1); g.stroke(); }
  } else if (q.tex === 'grid') {
    g.strokeStyle = T.matL;
    for (let x = x0 + 1, i = 0; x < x1; x += 2, i++) { g.globalAlpha = i % 4 ? 0.3 : 0.7; g.lineWidth = i % 4 ? 0.12 : 0.25; g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y1); g.stroke(); }
    for (let y = y0 + 1, i = 0; y < y1; y += 2, i++) { g.globalAlpha = i % 4 ? 0.3 : 0.7; g.lineWidth = i % 4 ? 0.12 : 0.25; g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke(); }
  }
  g.restore();
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
    const m = q.m || 'gloss', cx = U(q.x, q.z), cy = b - q.h, edge = q.ax === 'x' ? !side : side;
    switch (q.t) {
      case 'box': {
        const w = side ? q.d : q.w; rbx(cx - w / 2, cy - q.hh / 2, w, q.hh, q.r, q.c, m);
        if (q.tex) { const p = new Path2D(); p.roundRect(cx - w / 2, cy - q.hh / 2, w, q.hh, Math.min(q.r, w / 2, q.hh / 2)); texture(q, p, [cx - w / 2, cy - q.hh / 2, cx + w / 2, cy + q.hh / 2]); }
        break;
      }
      case 'cyl': {
        const rb = q.rb ?? q.r, top = cy - q.hh / 2, bot = cy + q.hh / 2, pts = [[cx - q.r, top], [cx + q.r, top], [cx + rb, bot], [cx - rb, bot]];
        poly(pts, q.c, m, m !== 'glow');
        if (q.tex) texture(q, polyPath(pts), bounds(pts));
        if (m !== 'glass') oval(cx, top, q.r, Math.min(q.r * 0.22, Math.max(0.3, q.hh / 2)), sh(q.c, m === 'glow' ? 0 : 1));
        break;
      }
      case 'ball': {
        const rx = side ? q.rz : q.rx; ball(cx, cy, rx, q.ry, q.c, m);
        if (q.tex) { const p = new Path2D(); p.ellipse(cx, cy, rx, q.ry, 0, 0, TAU); texture(q, p, [cx - rx, cy - q.ry, cx + rx, cy + q.ry]); }
        break;
      }
      case 'disc': if (edge) rbx(cx - q.th / 2, cy - (q.ry ?? q.r), q.th, (q.ry ?? q.r) * 2, q.th / 2, q.c, m); else ball(cx, cy, q.r, q.ry ?? q.r, q.c, m); break;
      case 'lathe': {
        const P = (dx, up) => [cx + flip * dx, cy - up];
        const rmax = Math.max(...q.pts.map(p => p[0]));
        const pts = [...q.pts.map(([r, up]) => P(-r, up)), ...q.pts.slice().reverse().map(([r, up]) => P(r, up))];
        poly(pts, q.c, m, m !== 'glow');
        if (q.tex) texture(q, polyPath(pts), bounds(pts));
        if (m === 'gloss' && rmax > 1.2) {
          const at = q.pts.find(p => p[0] === rmax), [hx, hy] = P(-rmax * 0.48, at[1] * 0.92);
          g.save(); g.globalAlpha *= 0.5; oval(hx, hy, rmax * 0.14, Math.max(0.4, at[1] * 0.1), '#ffffff'); g.restore();
        }
        if (q.pts[q.pts.length - 1][0] < 0.01 && q.pts.length > 2) break;
        const [rt, ut] = q.pts[q.pts.length - 1];
        oval(cx, cy - ut, rt, rt * 0.22, sh(q.c, -2));
        break;
      }
      case 'ring': {
        if (q.flat) {
          g.lineCap = 'butt'; g.strokeStyle = q.c; g.lineWidth = q.tr * 2;
          g.beginPath(); g.ellipse(cx, cy, q.r, q.r * 0.22, 0, 0, TAU); g.stroke();
          break;
        }
        const ry = q.ry ?? q.r, a0 = q.a0 ?? 0, arc = q.arc ?? TAU, n = Math.max(8, Math.round(arc / TAU * 32));
        const at = (a, dy = 0) => {
          const px = q.ax === 'x' ? q.x : q.x + Math.cos(a) * q.r, pz = q.ax === 'x' ? q.z - Math.cos(a) * q.r : q.z;
          return [U(px, pz), b - q.h - Math.sin(a) * ry + dy];
        };
        const path = (dy) => { g.beginPath(); for (let i = 0; i <= n; i++) { const [px, py] = at(a0 + arc * i / n, dy); i ? g.lineTo(px, py) : g.moveTo(px, py); } if (arc >= TAU - 0.01) g.closePath(); };
        g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = q.c; g.lineWidth = q.tr * 2; path(0); g.stroke();
        if (m !== 'plain' && m !== 'glow') { g.save(); g.globalAlpha *= 0.45; g.strokeStyle = sh(q.c, 2); g.lineWidth = q.tr * 0.6; path(-q.tr * 0.4); g.stroke(); g.restore(); }
        break;
      }
      case 'rod': {
        const p0 = [U(q.a[0], q.a[2]), b - q.a[1]], p1 = [U(q.b[0], q.b[2]), b - q.b[1]];
        if (Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) < 0.05) { ball(p0[0], p0[1], q.r, q.r, q.c, m); break; }
        g.lineCap = 'round'; g.strokeStyle = m === 'glass' ? 'rgba(207,232,244,0.4)' : q.c; g.lineWidth = q.r * 2;
        g.beginPath(); g.moveTo(...p0); g.lineTo(...p1); g.stroke();
        if (q.r > 0.6 && m !== 'glass' && m !== 'plain' && m !== 'glow') {
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
      case 'wedge': {
        const ups = q.pts.map(p => p[1]), top = Math.max(...ups), bot = Math.min(...ups);
        if (!side) { rbx(cx - q.w / 2, cy - top, q.w, top - bot, 0.6, q.c, m); break; }
        poly(q.pts.map(([pz, up]) => [U(q.x, q.z + pz), cy - up]), q.c, m);
        break;
      }
      case 'pic': g.save(); g.beginPath(); g.rect(cx - q.w / 2, cy - q.hh / 2, q.w, q.hh); g.clip(); q.fn(g, cx - q.w / 2, cy - q.hh / 2, q.w, q.hh); g.restore(); break;
    }
  }
}

/* ---------- pictures ---------- */

/* ---------- pictures ---------- */

const SANS = 'Arial Black, Arial, sans-serif', HAND = 'Georgia, "Times New Roman", serif';
/** A word across a painted box: bold letters in fg over bg (none for clear), or an italic serif for handwriting. */
const word = (text, fg, bg, k = 0.78, font = SANS) => (g, x, y, w, h) => {
  if (bg) { g.fillStyle = bg; g.fillRect(x, y, w, h); }
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = font === HAND ? `italic bold ${h * k}px ${HAND}` : `bold ${h * k}px ${SANS}`; g.fillText(text, x + w / 2, y + h * 0.54, w * 0.92);
};
/** Dashed running stitches round a box, in c. */
function stitches(g, x, y, w, h, c, lw = 0.3) {
  g.save(); g.strokeStyle = c; g.lineWidth = lw; g.setLineDash([lw * 3, lw * 2.4]); g.strokeRect(x, y, w, h); g.restore();
}

/** The Furret quilt: patchwork squares in pastels and prints round a cream middle panel, a striped Furret curling across
    it in brown and cream, its little ears and black eyes, a border of coral binding. */
function furretQuilt(g, x, y, w, h) {
  g.fillStyle = T.coral; g.fillRect(x, y, w, h);
  const cols = 8, rows = 5, bw = (w - 2) / cols, bh = (h - 2) / rows, pal = [...PASTEL, T.coral, T.teal, T.mustard];
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const px = x + 1 + i * bw, py = y + 1 + j * bh, k = (i * 3 + j * 5) % pal.length;
    g.fillStyle = pal[k]; g.fillRect(px, py, bw, bh);
    if ((i + j) % 3 === 0) { g.fillStyle = 'rgba(255,255,255,0.55)'; for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) { g.beginPath(); g.arc(px + bw * (a + 0.5) / 3, py + bh * (b + 0.5) / 3, bw * 0.06, 0, TAU); g.fill(); } }
    else if ((i + j) % 3 === 1) { g.fillStyle = 'rgba(0,0,0,0.1)'; for (let a = 0; a < 4; a++) g.fillRect(px, py + bh * (a + 0.3) / 4, bw, bh * 0.08); }
    stitches(g, px + 0.4, py + 0.4, bw - 0.8, bh - 0.8, 'rgba(255,255,255,0.8)', 0.18);
  }
  const mx = x + 1 + bw * 2, my = y + 1 + bh, mw = bw * 4, mh = bh * 3;
  g.fillStyle = T.cream; g.fillRect(mx, my, mw, mh);
  stitches(g, mx + 0.6, my + 0.6, mw - 1.2, mh - 1.2, T.furret, 0.2);
  const n = 11, r = mh * 0.1;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), px = mx + mw * (0.14 + t * 0.62), py = my + mh * (0.58 + Math.sin(t * TAU * 1.1) * 0.16);
    g.fillStyle = i % 2 ? T.furretC : T.furret; g.beginPath(); g.arc(px, py, r * (0.75 + t * 0.35), 0, TAU); g.fill();
  }
  const hx = mx + mw * 0.82, hy = my + mh * 0.4, hr = r * 1.35;
  g.fillStyle = T.furret;
  for (const sg of [-1, 1]) { g.beginPath(); g.arc(hx + sg * hr * 0.7, hy - hr * 0.8, hr * 0.35, 0, TAU); g.fill(); }
  g.beginPath(); g.arc(hx, hy, hr, 0, TAU); g.fill();
  g.fillStyle = T.furretC; g.beginPath(); g.ellipse(hx, hy + hr * 0.3, hr * 0.62, hr * 0.5, 0, 0, TAU); g.fill();
  g.fillStyle = T.black; for (const sg of [-1, 1]) { g.beginPath(); g.arc(hx + sg * hr * 0.38, hy - hr * 0.12, hr * 0.13, 0, TAU); g.fill(); }
  g.fillStyle = T.pink; g.beginPath(); g.arc(hx, hy + hr * 0.15, hr * 0.1, 0, TAU); g.fill();
}

/** The hoop's embroidery: cream linen, a stitched flower spray (three blooms, leaves, a curling stem) inside a circle. */
function embroidery(g, x, y, w, h) {
  const cx = x + w / 2, cy = y + h / 2, R = w / 2;
  g.fillStyle = T.cream; g.fillRect(x, y, w, h);
  g.strokeStyle = T.leafD; g.lineWidth = R * 0.05; g.beginPath(); g.moveTo(cx - R * 0.1, cy + R * 0.7); g.quadraticCurveTo(cx - R * 0.4, cy, cx + R * 0.05, cy - R * 0.3); g.stroke();
  g.beginPath(); g.moveTo(cx - R * 0.2, cy + R * 0.3); g.quadraticCurveTo(cx + R * 0.2, cy + R * 0.2, cx + R * 0.4, cy - R * 0.05); g.stroke();
  for (const [dx, dy, a] of [[-0.42, 0.25, -0.6], [0.05, 0.45, 0.6], [-0.25, -0.1, -0.9]]) { g.fillStyle = T.leaf; g.beginPath(); g.ellipse(cx + dx * R, cy + dy * R, R * 0.16, R * 0.07, a, 0, TAU); g.fill(); }
  for (const [dx, dy, c] of [[0.05, -0.38, T.fuchsia], [0.45, -0.1, T.sky], [-0.5, -0.35, T.peach]]) {
    g.fillStyle = c;
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; g.beginPath(); g.ellipse(cx + dx * R + Math.cos(a) * R * 0.11, cy + dy * R + Math.sin(a) * R * 0.11, R * 0.09, R * 0.06, a, 0, TAU); g.fill(); }
    g.fillStyle = T.mustard; g.beginPath(); g.arc(cx + dx * R, cy + dy * R, R * 0.06, 0, TAU); g.fill();
  }
}

/** Smeargle's canvas: a bright meadow under a sunny sky, a round tree, a Poké Ball sun, a few loose green splashes. */
function canvasArt(g, x, y, w, h) {
  const l = g.createLinearGradient(0, y, 0, y + h * 0.6); l.addColorStop(0, '#7ab8ec'); l.addColorStop(1, '#cfe8f8');
  g.fillStyle = l; g.fillRect(x, y, w, h);
  g.fillStyle = T.grass; g.beginPath(); g.moveTo(x, y + h * 0.62); g.quadraticCurveTo(x + w * 0.35, y + h * 0.45, x + w * 0.6, y + h * 0.6); g.quadraticCurveTo(x + w * 0.8, y + h * 0.7, x + w, y + h * 0.55); g.lineTo(x + w, y + h); g.lineTo(x, y + h); g.fill();
  g.fillStyle = T.leafD; g.beginPath(); g.moveTo(x, y + h * 0.8); g.quadraticCurveTo(x + w * 0.5, y + h * 0.68, x + w, y + h * 0.82); g.lineTo(x + w, y + h); g.lineTo(x, y + h); g.fill();
  g.fillStyle = T.pineK; g.fillRect(x + w * 0.24, y + h * 0.42, w * 0.05, h * 0.2);
  g.fillStyle = T.leaf; g.beginPath(); g.arc(x + w * 0.265, y + h * 0.36, w * 0.13, 0, TAU); g.fill();
  const sx = x + w * 0.74, sy = y + h * 0.2, sr = w * 0.1;
  g.fillStyle = T.red; g.beginPath(); g.arc(sx, sy, sr, Math.PI, TAU); g.fill();
  g.fillStyle = T.white; g.beginPath(); g.arc(sx, sy, sr, 0, Math.PI); g.fill();
  g.fillStyle = T.black; g.fillRect(sx - sr, sy - sr * 0.1, sr * 2, sr * 0.2); g.beginPath(); g.arc(sx, sy, sr * 0.3, 0, TAU); g.fill();
  g.fillStyle = T.white; g.beginPath(); g.arc(sx, sy, sr * 0.17, 0, TAU); g.fill();
  for (const [a, b, r, c] of [[0.1, 0.12, 0.05, T.fuchsia], [0.5, 0.88, 0.04, T.lemon], [0.86, 0.66, 0.05, T.fuchsia], [0.42, 0.3, 0.03, T.lemon]]) { g.fillStyle = c; g.beginPath(); g.arc(x + w * a, y + h * b, w * r, 0, TAU); g.fill(); }
  g.strokeStyle = T.grass; g.lineWidth = w * 0.03; g.lineCap = 'round'; g.beginPath(); g.moveTo(x + w * 0.06, y + h * 0.95); g.quadraticCurveTo(x + w * 0.2, y + h * 0.86, x + w * 0.34, y + h * 0.94); g.stroke();
}

/** A fashion sketch on white paper: a pencil figure in a full-skirted dress, a swatch pinned beside it, a note under. */
function sketch(g, x, y, w, h) {
  g.fillStyle = T.white; g.fillRect(x, y, w, h);
  const cx = x + w * 0.44;
  g.strokeStyle = T.blackL; g.lineWidth = w * 0.025;
  g.beginPath(); g.arc(cx, y + h * 0.13, w * 0.07, 0, TAU); g.stroke();
  g.beginPath(); g.moveTo(cx, y + h * 0.19); g.lineTo(cx, y + h * 0.25); g.stroke();
  g.fillStyle = T.fuchsia; g.beginPath(); g.moveTo(cx - w * 0.1, y + h * 0.25); g.lineTo(cx + w * 0.1, y + h * 0.25); g.lineTo(cx + w * 0.06, y + h * 0.42); g.lineTo(cx + w * 0.3, y + h * 0.78); g.lineTo(cx - w * 0.3, y + h * 0.78); g.lineTo(cx - w * 0.06, y + h * 0.42); g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(cx - w * 0.06, y + h * 0.78); g.lineTo(cx - w * 0.07, y + h * 0.92); g.moveTo(cx + w * 0.06, y + h * 0.78); g.lineTo(cx + w * 0.07, y + h * 0.92); g.stroke();
  g.fillStyle = T.lemon; g.fillRect(x + w * 0.74, y + h * 0.3, w * 0.2, h * 0.12);
  g.fillStyle = T.blackL; g.fillRect(x + w * 0.1, y + h * 0.95, w * 0.5, h * 0.012);
}

/* ---------- the kinds ---------- */

/** What js/base-models-craft.js builds for each upright and wall kind: its parts, doors and default material. */
export const BUILT = {};
/** The rug's outline from above, in painted units across its 3 x 2 tiles, corners rounded off. */
export const RUG = [[6, 2], [90, 2], [94, 6], [94, 58], [90, 62], [6, 62], [2, 58], [2, 6]];

function piece(id, name, w, h, price, mat, parts, { doors = [], inside, ...rest } = {}) {
  BUILT[id] = { parts, doors, inside, mat };
  const all = [...parts, ...doors.flatMap(d => d.parts)];
  return { id, name, group: GROUP, solo: true, w, h, price, ...rest, draw(x, b, vw, dir) { floorShadow(x, b, vw); paintParts(all, x, b, vw, dir, w * 32); } };
}
function wallPiece(id, name, w, price, mat, parts, rest = {}) {
  BUILT[id] = { parts, doors: [], mat };
  return { id, name, group: GROUP, solo: true, w, h: 1, layer: 'wall', price, ...rest, wall(x) { paintParts(parts, x, 96, w * 32, 0, w * 32); } };
}
const legs4 = (xs, zs, s, hh, c = T.pineD) => xs.flatMap(x => zs.map(z => B(x, hh / 2, z, s, hh, s, c, { m: 'wood', r: 0.6 })));

export const CRAFT_KINDS = [
  // the sewing machine on its pine table: a cream machine with its arm, pillar and head, a mint handwheel, two spools of
  // thread on top, fuchsia fabric under the needle, a tomato pincushion and shears beside it, a drawer, a basket of
  // fabric on the shelf below and the foot pedal on the floor
  piece('crfsewing', 'Craft sewing machine table', 2, 1, 1250, 'wood', [
    ...legs4([3, 61], [-10, 10], 2.6, 25),
    B(32, 6, 0, 58, 1.6, 22, T.pine, WD),
    B(14, 9.4, 0, 18, 5.4, 14, T.wicker, { m: 'cloth', tex: 'weave' }), B(12, 12.6, -1, 12, 1.6, 10, T.teal, CL), B(16, 13.4, 0, 9, 1.4, 8, T.lemon, CL),
    B(32, 23.4, 0, 60, 4, 24, T.pine, GR),
    B(50, 22.4, 12.3, 18, 4.6, 0.8, T.pineL, WD), B(50, 22.4, 12.9, 4, 1, 0.6, T.pineK, WD),
    B(32, 26.2, 0, 64, 1.8, 26, T.pineL, GR),
    B(44, 1, 8, 8, 2, 7, T.black, GL),
    B(26, 28.6, 1, 28, 3, 13, T.cream, GL),
    B(37, 35.6, 0, 8, 11, 10, T.cream, GL),
    B(26, 43.4, 0, 30, 5, 9, T.cream, GL),
    B(14, 37, 0, 6, 10, 9, T.cream, GL),
    PC(27, 43.4, 4.6, 16, 3, word('STITCH', T.coral, T.cream, 0.8)),
    DS(37, 36, 5.2, 2.2, 0.6, T.coral, { m: 'gloss', seg: 10 }),
    DS(41.8, 39.6, 0, 4, 1.6, T.mint, { m: 'gloss', ax: 'x', seg: 14 }),
    RD([13, 32, 3], [13, 29.6, 3], 0.35, T.steelL, MT), B(13, 30.4, 3, 3.4, 0.8, 3, T.steel, { m: 'metal', r: 0.3 }),
    B(19, 30.4, 4, 18, 0.6, 9, T.fuchsia, { m: 'cloth', r: 0.3 }),
    ...spool(24, 48, -1, T.pink, 0.9), ...spool(32, 48, -1, T.sky, 0.9),
    RD([24, 49.4, 0], [14.8, 42, 3], 0.15, T.pink, PL),
    S(54, 29.2, 4, 3, 2.2, 3, T.tomato, { m: 'cloth', seg: 10 }), S(54, 31.4, 4, 1.2, 0.5, 1.2, T.leaf, { m: 'cloth', seg: 6 }),
    ...[[52, 32.4, 5], [55.6, 32, 3], [54.4, 32.6, 6]].flatMap(([px, ph, pz], i) => [RD([px, ph - 2, pz - 0.6], [px, ph, pz], 0.15, T.steelL, MT), S(px, ph, pz, 0.6, 0.6, 0.6, [T.lemon, T.cobalt, T.mint][i], { m: 'gloss', seg: 6 })]),
    ...flatScissors(46, 27.1, -6, T.coral),
  ]),

  // an overlocker on a little pine cart on castors: four cones of pastel thread on its back, their threads up to the
  // steel guide bar, a handwheel at its side, folded fabric on the shelf below
  piece('crfoverlock', 'Sewing overlocker cart', 1, 1, 880, 'wood', [
    ...[4, 28].flatMap(x => [-9, 9].flatMap(z => [...caster(x, z), RD([x, 4, z], [x, 22, z], 0.8, T.pineD, WD)])),
    B(16, 6, 0, 26, 1.4, 20, T.pine, WD),
    B(10, 8.6, 0, 10, 3.4, 14, T.teal, CL), B(10, 11.6, 0, 9, 2.6, 13, T.mustard, CL), B(22, 8.6, 0, 10, 3.4, 14, T.lilac, CL),
    B(16, 23, 0, 30, 2, 22, T.pineL, GR),
    B(16, 26, 1, 22, 4, 15, T.cream, GL),
    B(14, 32, 0, 18, 8, 12, T.cream, GL), B(25, 31, 1, 6, 6, 12, T.cream, GL),
    B(13, 31, 6.2, 12, 5, 0.6, T.creamD, GL), PC(13, 31, 6.55, 11, 2.4, word('OVERLOCK', T.teal, null, 0.8)),
    DS(28.2, 31, 1, 3, 1.4, T.coral, { m: 'gloss', ax: 'x', seg: 12 }),
    ...[7, 11.6, 16.2, 20.8].flatMap((x, i) => [
      LA(x, 36, -3, [[2.2, 0], [2.2, 0.6], [1.4, 6], [0.6, 8]], PASTEL[i], { m: 'cloth', seg: 8 }),
      RD([x, 44, -3], [x, 48, -5], 0.15, PASTEL[i], PL),
    ]),
    RD([4, 36, -5], [4, 48, -5], 0.4, T.steel, MT), RD([24, 36, -5], [24, 48, -5], 0.4, T.steel, MT), RD([4, 48, -5], [24, 48, -5], 0.4, T.steel, MT),
  ]),

  // a pine floor loom: its two side frames and top bar, the warp threads running down through the shafts, teal cloth
  // woven on the front, the beater, a shuttle left on the breast beam and the treadles on the floor
  piece('crfloom', 'Craft floor loom', 2, 1, 1400, 'wood', [
    ...[4, 60].flatMap(x => [...[-10, 10].map(z => B(x, 23, z, 3, 46, 3, T.pineD, WD)), B(x, 8, 0, 3, 3, 22, T.pine, WD), B(x, 44, 0, 3, 3, 24, T.pine, WD)]),
    B(32, 46, 0, 60, 3, 4, T.pine, GR),
    B(32, 27, -10, 54, 3, 3, T.pine, WD), B(32, 12, -10, 54, 3, 3, T.pine, WD),
    B(32, 33, -3, 50, 14, 0.5, T.cream, { m: 'cloth', tex: 'warp' }),
    B(32, 40, -1, 52, 2, 1.4, T.pineL, WD), B(32, 27, -1, 52, 2, 1.4, T.pineL, WD),
    ...[6, 58].map(x => RD([x, 46, -1], [x, 26, -1], 0.4, T.steelD, MT)),
    B(32, 30.6, 4, 54, 2.4, 2, T.pineL, WD), ...[6, 58].map(x => RD([x, 30.6, 4], [x, 9, 2], 0.6, T.pineD, WD)),
    B(32, 27, 10, 56, 3, 3, T.pine, GR),
    B(32, 21, 11.4, 50, 9, 0.8, T.teal, { m: 'cloth', tex: 'weave' }),
    B(32, 14, 10, 56, 3, 3, T.pine, WD),
    B(22, 29.3, 10, 10, 1.6, 2.4, T.pineK, { m: 'wood', r: 0.8 }),
    ...[24, 29, 35, 40].map(x => B(x, 1.4, 2, 3, 1.6, 18, T.pineD, WD)),
  ]),

  // a quilting frame on pine A-legs: the quilt stretched between its rollers, patchwork round Furret curling across the
  // middle panel, its tail end hanging below the bottom roller, a threaded needle stuck in a corner
  piece('crfquilt', 'Furret quilt frame', 2, 1, 1300, 'wood', [
    ...[5, 59].flatMap(x => [B(x, 1, 0, 4, 2, 24, T.pineD, WD), RD([x, 2, -10], [x, 47, 0], 1, T.pine, WD), RD([x, 2, 10], [x, 47, 0], 1, T.pine, WD)]),
    DS(32, 47, 0, 2, 58, T.pineL, { m: 'wood', ax: 'x', seg: 10 }),
    DS(32, 15, 1, 2, 58, T.pineL, { m: 'wood', ax: 'x', seg: 10 }),
    B(32, 31, 0.6, 52, 30, 0.8, T.cream, CL), PC(32, 31, 1.05, 52, 30, furretQuilt),
    B(32, 10, 2, 52, 7, 0.8, T.coral, CL),
    RD([52, 42, 1.4], [55, 45, 1.6], 0.2, T.steelL, MT), RD([52, 42, 1.4], [46, 37, 1.6], 0.12, T.fuchsia, PL),
  ]),

  // an ironing station: a sky blue board on its steel X legs, a steam iron standing on it, its cord, and a pine rack
  // beside it with folded fabric, a spray bottle on top
  piece('crfironing', 'Craft ironing station', 2, 1, 760, 'cloth', [
    ...[-5, 5].flatMap(z => [RD([10, 0.6, z], [36, 27, z * 0.5], 0.6, T.steelD, MT), RD([36, 0.6, z], [10, 27, z * 0.5], 0.6, T.steelD, MT)]),
    ...[10, 36].flatMap(x => [-5, 5].map(z => S(x, 0.6, z, 1, 0.6, 1, T.black, { m: 'gloss', seg: 6 }))),
    B(27, 28.2, 0, 46, 2, 13, T.sky, { m: 'cloth', r: 1 }), B(27, 27.2, 0, 44, 0.8, 12, T.steel, { m: 'metal', r: 0.3 }),
    B(34, 29.8, 0, 12, 1, 7, T.steelL, { m: 'metal', r: 0.4 }),
    PR(34, 30.3, 0, [[-6, 0], [6.4, 0], [5.6, 2], [3, 4.2], [-4.4, 4.2]], 6.4, T.coral, GL),
    RD([30.4, 34.3, 0], [30.2, 37.4, 0], 0.8, T.white, GL), RD([37, 34.3, 0], [37.4, 37.4, 0], 0.8, T.white, GL), RD([30, 37.6, 0], [37.8, 37.6, 0], 0.9, T.white, GL),
    RD([38, 36.4, 0], [44, 30, -3], 0.3, T.white, PL),
    ...[53, 61].map(x => B(x, 18, 0, 2, 36, 14, T.pineD, WD)),
    ...[6, 18, 30].map(h => B(57, h, 0, 10, 1.4, 14, T.pine, WD)),
    B(57, 9, 0, 8, 4, 12, T.fuchsia, CL), B(57, 21, 0, 8, 3, 12, T.mint, CL), B(57, 24, 0, 7.4, 2.4, 11, T.lemon, CL),
    LA(57, 30.7, 0, [[2.2, 0], [2.4, 0.4], [2.4, 6], [1.2, 7.2], [1.2, 8]], T.white, { m: 'gloss', seg: 10 }), B(57.8, 39.6, 0, 3, 2, 1.6, T.teal, { m: 'gloss', r: 0.4 }),
  ]),

  // a tall pine cutting table: the green self-healing mat ruled in a grid, lemon fabric spread on it under a clear ruler,
  // a coral rotary cutter and shears, and stacks of folded fabric in two cubbies below
  piece('crfcutting', 'Craft cutting table', 2, 1, 1150, 'wood', [
    ...legs4([3, 61], [-12, 12], 3, 30),
    B(32, 6, 0, 60, 1.6, 26, T.pine, WD),
    B(32, 18.3, 0, 1.6, 23, 24, T.pine, WD),
    ...[[16, [T.teal, T.fuchsia, T.mustard]], [48, [T.cobalt, T.coral, T.mint]]].flatMap(([x, cs]) => cs.map((c, i) => B(x, 9 + i * 3.8, 0, 22 - i, 3.6, 18 - i, c, { m: 'cloth', r: 0.6 }))),
    B(32, 31, 0, 64, 2.4, 28, T.pineL, GR),
    B(32, 32.6, 0, 56, 0.8, 22, T.mat, { m: 'plain', r: 0.3, tex: 'grid' }),
    B(22, 33.2, 1, 22, 0.4, 14, T.lemon, { m: 'cloth', r: 0.2 }),
    B(36, 33.6, 2, 30, 0.4, 4, '#cfe8f4', { m: 'glass', r: 0.2 }),
    RD([47, 34, 6], [53, 35.4, 7], 0.9, T.coral, GL), DS(46, 34.4, 6, 2.2, 0.4, T.steelL, { m: 'metal', ax: 'x', seg: 12 }),
    ...flatScissors(8, 33, -7, T.teal),
  ], { }),

  // an embroidery hoop on its floor stand: a pine hoop round cream linen stitched with a flower spray, a clamp screw on
  // top, two skeins of floss hanging from the arm
  piece('crfhoop', 'Embroidery hoop stand', 1, 1, 480, 'wood', [
    C(16, 0.8, 0, 8, 1.6, T.pineD, { m: 'wood', seg: 14 }),
    C(16, 15, 0, 0.9, 27, T.pine, { m: 'wood', seg: 8 }),
    B(16, 28.6, 0, 3, 3, 2, T.pineD, WD),
    DS(16, 38.6, 0, 9.2, 0.4, T.cream, { m: 'cloth', seg: 18 }),
    PC(16, 38.6, 0.25, 12.4, 12.4, embroidery),
    RG(16, 38.6, 0, 9.6, 1, T.pineL, WD),
    B(16, 48.8, 0, 2, 2.4, 2, T.steel, { m: 'metal', r: 0.4 }),
    RD([16, 20, 0], [25, 20, 0], 0.4, T.pineD, WD),
    B(21, 17, 0, 1.4, 6, 1.4, T.pink, { m: 'cloth', r: 0.4 }), B(23.6, 17.4, 0, 1.4, 5, 1.4, T.sky, { m: 'cloth', r: 0.4 }),
  ]),

  // a dress form on its pine tripod wearing a half-made outfit: a fuchsia skirt, one side of the bodice pinned on, a
  // lemon tape measure round its neck and pins along the hem
  piece('crfdressform', 'Sewing dress form', 1, 1, 820, 'cloth', dressForm(16, 0, [
    LA(16, 12, 0, [[10.4, 0], [9.6, 4], [8, 9], [7.4, 11.6]], T.fuchsia, { m: 'cloth', seg: 14 }),
    B(13.2, 36, 5, 6, 11, 1.4, T.fuchsia, { m: 'cloth', r: 2 }),
    RD([11.4, 47, 2.4], [12.6, 31, 6.4], 0.5, T.lemon, PL), RD([20.6, 47, 2.4], [19.6, 33, 6.2], 0.5, T.lemon, PL),
    ...[[11, 14, 9.4], [16, 13, 10.2], [21, 14, 9.4]].map(([x, h, z], i) => S(x, h, z, 0.6, 0.6, 0.6, [T.cobalt, T.lemon, T.mint][i], { m: 'gloss', seg: 6 })),
  ])),

  // Leavanny's tailoring: a dress form in a gown of stitched leaves, and Leavanny beside it sewing on another with its
  // blade arm and a needle
  piece('crfleavanny', 'Leavanny leaf tailoring form', 2, 1, 1250, 'cloth', [
    ...dressForm(18, 0, [
      LA(18, 12, 0, [[11, 0], [10, 4], [8, 9], [7.4, 11.6]], T.leaf, { m: 'cloth', seg: 14 }),
      LA(18, 30, 0, [[5.8, 0], [6.8, 6], [7.4, 9], [6.2, 12]], T.leafL, { m: 'cloth', seg: 14 }),
      ...[[11, 14, 10, 0.4], [18, 13, 11.4, 0], [25, 14, 10, -0.4]].map(([x, h, z]) => PR(x, h, z, [[-2, 0], [0, -3], [2, 0], [0, 6]], 0.6, T.leafD, CL)),
    ]),
    ...leavanny(46, 0),
  ]),

  // Smeargle at a pine easel, painting a meadow and a Poké Ball sun with the green tip of its tail, its palette in hand
  piece('crfeasel', 'Smeargle painting easel', 2, 1, 1300, 'wood', [
    RD([34, 0.6, 4], [44, 54, -2], 1, T.pine, WD), RD([54, 0.6, 4], [44, 54, -2], 1, T.pine, WD), RD([44, 0.6, -12], [44, 48, -3], 1, T.pineD, WD),
    B(44, 18, 4, 24, 2, 4, T.pineD, WD),
    ...[[38, T.cobalt], [41, T.fuchsia], [49, T.grass]].map(([x, c]) => B(x, 19.6, 5, 2, 1.2, 1.4, c, { m: 'gloss', r: 0.4 })),
    B(44, 33, 3, 22, 26, 1.4, T.white, PL), PC(44, 33, 3.75, 21, 25, canvasArt),
    B(44, 47, 2, 3, 3, 2.4, T.pineD, WD),
    ...smeargle(16, 0, [31.4, 32, 5]),
  ]),

  // a sewing chair on a five-legged castor foot: a round pine seat with a mint cushion, a little pine back cushioned too
  piece('crfchair', 'Craft sewing chair', 1, 1, 520, 'wood', [
    ...[0, 1, 2, 3, 4].flatMap(i => { const a = i / 5 * TAU + 0.3, x = 16 + Math.cos(a) * 11, z = Math.sin(a) * 11; return [RD([16, 3, 0], [x, 2.4, z], 1, T.steelD, MT), S(x, 1.2, z, 1.3, 1.2, 1.3, T.black, { m: 'gloss', seg: 6 })]; }),
    C(16, 9, 0, 1.4, 12, T.steel, { m: 'metal', seg: 10 }),
    C(16, 16, 0, 10, 2.4, T.pine, { m: 'wood', seg: 18 }),
    C(16, 18, 0, 9.4, 1.6, T.mint, { m: 'cloth', seg: 18 }),
    RD([16, 17, -8], [16, 28, -9.4], 1, T.pineD, WD),
    B(16, 32, -9.4, 18, 8, 2.4, T.pine, GR), B(16, 32, -7.8, 16, 6.4, 1, T.mint, { m: 'cloth', r: 1.4 }),
  ]),

  // a stool whose seat is a big tomato pincushion: pine legs, its green leaf cap and stem, pins with coloured heads
  // stuck in it and a little strawberry hanging off its side
  piece('crfstool', 'Pincushion stool', 1, 1, 420, 'cloth', [
    ...[[-10, -6], [10, -6], [0, 11]].map(([dx, dz]) => RD([16 + dx * 0.4, 14, dz * 0.4], [16 + dx, 0.6, dz], 1, T.pineD, WD)),
    C(16, 14.6, 0, 9.6, 2, T.pine, { m: 'wood', seg: 16 }),
    S(16, 20.6, 0, 12, 5.6, 11, T.tomato, { m: 'cloth', seg: 16 }),
    S(16, 26, 0, 4, 0.9, 4, T.leaf, { m: 'cloth', seg: 8 }), C(16, 27.4, 0, 0.7, 2.2, T.leafD, { m: 'cloth', seg: 6 }),
    ...[[8, 0.8, 2], [12, 1.4, 6], [21, -0.4, 5], [24, 0.6, -2], [10, 0.2, -5]].flatMap(([x, lean, z], i) => [RD([x, 23.6, z], [x + lean, 27.4, z * 1.1], 0.15, T.steelL, MT), S(x + lean, 27.6, z * 1.1, 0.7, 0.7, 0.7, [T.lemon, T.cobalt, T.white, T.mint, T.fuchsia][i], { m: 'gloss', seg: 6 })]),
    RD([26, 20, 7], [27, 15, 8], 0.25, T.leafD, PL), S(27, 13.4, 8, 1.6, 2.2, 1.6, T.red, { m: 'cloth', seg: 8 }),
  ]),

  // a pouf knitted like a huge ball of lilac yarn, two knitting needles stuck in its top, a loose end trailing off
  piece('crfpouf', 'Knitted yarn ball pouf', 1, 1, 380, 'cloth', [
    S(16, 11.4, 0, 12.6, 11.4, 12.6, T.lilac, { m: 'cloth', seg: 16, tex: 'knit' }),
    RG(16, 11.4, 0, 12.4, 0.5, sh(T.lilac, -1), { m: 'cloth', ry: 10.8 }), RG(16, 11.4, 0, 12.6, 0.5, sh(T.lilac, -1), { m: 'cloth', flat: true }),
    RD([27, 5, 6], [31, 0.6, 9], 0.6, T.lilac, CL),
    RD([13, 20, 1], [6, 31, -2], 0.5, T.steel, MT), S(6, 31, -2, 1, 1, 1, T.coral, { m: 'gloss', seg: 6 }),
    RD([19, 20, 1], [26, 30, -1], 0.5, T.steel, MT), S(26, 30, -1, 1, 1, 1, T.coral, { m: 'gloss', seg: 6 }),
  ]),

  // a pine craft desk: a drawer, a cupboard that opens, jars of buttons, a glue gun on its wire stand, a cup of glue
  // sticks, rolls of washi tape and sheets of felt
  piece('crfdesk', 'Button jar and glue gun desk', 2, 1, 980, 'wood', [
    ...legs4([3], [-10, 10], 2.6, 26),
    B(52, 13, 0, 22, 26, 24, T.pine, GR),
    B(22, 23.6, 0, 38, 4.4, 22, T.pine, WD), B(22, 23.6, 11.3, 30, 3.6, 0.8, T.pineL, WD), B(22, 23.6, 11.9, 4, 1, 0.6, T.pineK, WD),
    B(32, 27, 0, 64, 2, 26, T.pineL, GR),
    ...[[8, T.coral, T.fuchsia], [14.6, T.mint, T.lemon]].flatMap(([x, lid, fill]) => [
      C(x, 31.4, -4, 2.6, 6.4, fill, { m: 'plain', seg: 10 }), C(x, 32, -4, 3, 8, '#cfe8f4', { m: 'glass', seg: 10 }), C(x, 36.6, -4, 3.2, 1.2, lid, { m: 'gloss', seg: 10 }),
    ]),
    ...[[6, 3, T.cobalt], [10, 5, T.lemon], [17, 4, T.coral]].map(([x, z, c]) => C(x, 28.2, z, 1, 0.4, c, { m: 'gloss', seg: 8 })),
    B(30, 28.4, 3, 10, 0.8, 5, T.steel, { m: 'metal', r: 0.3 }),
    RD([34, 28.8, 3], [33, 33, 3], 1.3, T.mustard, GL), RD([24, 33.6, 3], [36, 33.6, 3], 1.8, T.mustard, GL),
    RD([24, 33.6, 3], [21.6, 32, 3], 0.5, T.steelD, MT), RD([36, 33.6, 3], [40, 33.6, 3], 0.6, T.white, PL),
    C(45, 31, -6, 2, 6, T.pink, { m: 'gloss', seg: 10 }), ...[-0.8, 0.6].map(d => RD([45 + d, 33, -6], [45 + d * 2, 37, -6], 0.4, T.white, PL)),
    RG(53, 28.6, 5, 1.8, 0.6, T.mint, { m: 'cloth', flat: true }), RG(53, 29.8, 5, 1.8, 0.6, T.peach, { m: 'cloth', flat: true }),
    B(57, 28.4, -4, 12, 0.6, 10, T.lemon, CL), B(58, 29, -4.4, 11, 0.6, 9, T.coral, CL),
  ], {
    doors: [{ hinge: [42, 12], side: 1, parts: [
      B(52, 12.6, 12.4, 19, 22, 0.8, T.pineL, WD),
      B(60, 13, 13.2, 1.2, 4, 0.8, T.pineK, WD),
    ] }],
    inside: { x: 52, h: 12.6, w: 18, hh: 20, z: 12 },
  }),

  // a pine rack of fabric bolts on two tiers, every print and colour standing on end, and Sewaddle curled up asleep on top
  piece('crfboltrack', 'Sewaddle fabric bolt rack', 2, 1, 1150, 'wood', [
    ...[2, 62].map(x => B(x, 26, 0, 3, 52, 20, T.pine, WD)),
    B(32, 26, -9.4, 58, 50, 1, T.pineL, WD),
    B(32, 1, 0, 62, 2, 20, T.pineD, WD), B(32, 27, 0, 62, 2, 20, T.pine, GR), B(32, 51, 0, 64, 2, 22, T.pine, GR),
    ...[0, 1].flatMap(t => Array.from({ length: 12 }, (_, i) => B(6.6 + i * 4.6, 13 + t * 26, 1, 4.2, 22, 14, (t ? PASTEL : BRIGHT)[(i * 5 + t) % (t ? 6 : 7)], { m: 'cloth', r: 0.8 }))),
    ...sewaddle(22, 52, 3),
  ]),

  // a pine cubby shelf of nine squares, a ball of yarn or two in each
  piece('crfcubby', 'Yarn cubby shelf', 1, 1, 640, 'wood', [
    ...[1.6, 30.4].map(x => B(x, 24, 0, 3.2, 48, 18, T.pine, GR)),
    ...[11.2, 20.8].map(x => B(x, 24, 0, 1.6, 46, 17, T.pine, WD)),
    ...[1, 16.4, 31.6, 47].map(h => B(16, h, 0, 30, 2, 18, T.pine, WD)),
    B(16, 24, -8.4, 26, 46, 1, T.pineL, WD),
    ...[6.4, 16, 25.6].flatMap((x, i) => [5.8, 21.2, 36.4].map((h, j) => S(x, h, 1, 3.6, 3.6, 3.6, [...PASTEL, T.coral, T.teal, T.mustard][(i * 3 + j * 2) % 9], { m: 'cloth', seg: 8 }))),
    ...[[8.4, 0], [24, 1]].map(([x, j]) => S(x, 5.8 + j * 15.4 + 0.4, -3, 3, 3, 3, [T.fuchsia, T.sky][j], { m: 'cloth', seg: 8 })),
  ]),

  // a steel rolling cart of six pastel drawers, a tray on top with a cup of markers, a spool and shears
  piece('crfcart', 'Craft rolling drawer cart', 1, 1, 560, 'gloss', [
    ...[5, 27].flatMap(x => [-8, 8].flatMap(z => [...caster(x, z), RD([x, 4, z], [x, 34, z], 0.6, T.steel, MT)])),
    ...[0, 1, 2, 3, 4, 5].flatMap(i => [B(16, 6.4 + i * 4.8, 0, 20, 4.4, 16, PASTEL[i], { m: 'gloss', r: 0.6 }), B(16, 6.4 + i * 4.8, 8.2, 5, 0.8, 0.6, T.white, { m: 'gloss', r: 0.3 })]),
    B(16, 34.4, 0, 24, 1.4, 19, T.steelL, { m: 'metal', r: 0.4 }),
    C(10, 38, -2, 2.4, 6, T.white, { m: 'gloss', seg: 10 }),
    ...[T.coral, T.cobalt, T.grass].map((c, i) => RD([9 + i, 40, -2], [8.4 + i * 1.6, 44, -2 + i * 0.4], 0.45, c, PL)),
    ...spool(20, 37.4, -2, T.peach),
    ...flatScissors(14, 35.1, 4, T.fuchsia, 6),
  ]),

  // a pine board of thread spools on the wall: four rows of five, every pastel and bright
  wallPiece('crfspoolrack', 'Thread spool wall rack', 1, 420, 'wood', [
    B(16, 62, 0.8, 28, 36, 1.6, T.pine, GR),
    ...[50, 58.4, 66.8, 75.2].flatMap((h, r) => [B(16, h - 2.8, 2.4, 26, 0.8, 1.8, T.pineD, WD), ...[5.4, 10.7, 16, 21.3, 26.6].flatMap((x, i) => spool(x, h, 3.4, [...PASTEL, ...BRIGHT][(r * 5 + i) % 13], 0.95))]),
  ]),

  // a pegboard in a pine frame: three pairs of scissors, a tape measure and a ruler, a rod of ribbon spools with their
  // ribbons hanging down
  wallPiece('crfpegboard', 'Scissor and ribbon pegboard', 2, 520, 'wood', [
    B(32, 62, 0.6, 58, 32, 1.2, T.board, { m: 'plain', tex: 'perf' }),
    B(32, 78.4, 1, 60, 1.6, 2, T.pine, WD), B(32, 45.6, 1, 60, 1.6, 2, T.pine, WD), ...[2.4, 61.6].map(x => B(x, 62, 1, 1.6, 34, 2, T.pine, WD)),
    ...hangScissors(9, 73, 1.8, T.coral), ...hangScissors(16, 73, 1.8, T.teal, 8), ...hangScissors(23, 73, 1.8, T.mustard, 7),
    DS(11, 53, 1.8, 3.2, 1.4, T.lemon, { m: 'gloss', seg: 14 }), DS(11, 53, 2.6, 1, 0.4, T.coral, { m: 'gloss', seg: 8 }), B(15.4, 51.6, 1.8, 6, 1, 0.4, T.lemon, PL),
    B(23, 53, 1.6, 12, 2, 0.6, T.pineL, WD),
    ...[31, 58].map(x => B(x, 72, 1.6, 1.4, 3, 2.6, T.steelD, MT)), RD([31, 72, 2.8], [58, 72, 2.8], 0.4, T.steel, MT),
    ...[34, 39, 44, 49, 54].flatMap((x, i) => [DS(x, 72, 2.8, 2.4, 2.6, [T.fuchsia, T.sky, T.lemon, T.mint, T.coral][i], { m: 'cloth', ax: 'x', seg: 12 }), B(x, 62.6 - (i % 2) * 2, 4.9, 1.8, 15 - (i % 2) * 4, 0.3, [T.fuchsia, T.sky, T.lemon, T.mint, T.coral][i], { m: 'cloth', r: 0.1 })]),
  ]),

  // a cork mood board in a pine frame: a fashion sketch, fabric swatches, kraft pattern pieces and a spring palette
  // card, all pinned up
  wallPiece('crfmoodboard', 'Pattern mood board', 2, 460, 'wood', [
    B(32, 62, 0.6, 60, 34, 1.2, T.pine, GR),
    B(32, 62, 1.4, 55, 29, 0.6, T.cork, { m: 'cloth', tex: 'cork' }),
    B(15, 62, 1.9, 13, 22, 0.3, T.white, PL), PC(15, 62, 2.1, 13, 22, sketch),
    ...[[28, 70, T.fuchsia], [35, 70, T.teal], [28, 63, T.lemon], [35, 63, T.lilac]].map(([x, h, c]) => B(x, h, 1.9, 6, 6, 0.3, c, { m: 'cloth', r: 0.2 })),
    PR(46, 54, 1.9, [[-6, 0], [6, 0], [4, 10], [5, 14], [-5, 14], [-4, 10]], 0.3, T.kraft, PL),
    PR(53, 64, 2.2, [[-3, 0], [3, 0], [3.6, 10], [-3.6, 10]], 0.3, T.kraftD, PL),
    B(31, 52.6, 1.9, 13, 4, 0.3, T.white, PL), PC(31, 52.6, 2.1, 13, 4, word('SPRING', T.coral, T.white, 0.8, HAND)),
    ...[[15, 72.4, T.coral], [28, 72.6, T.cobalt], [35, 72.6, T.mint], [46, 67.6, T.lemon], [53, 73.6, T.fuchsia], [31, 54.4, T.teal]].map(([x, h, c]) => S(x, h, 2.6, 0.8, 0.8, 0.8, c, { m: 'gloss', seg: 6 })),
  ]),

  // a patchwork rug of pastel and bright squares, stitched round each, bound in coral
  { id: 'crfrug', name: 'Patchwork craft rug', group: GROUP, solo: true, w: 3, h: 2, layer: 'rug', price: 560, high: 0.03, side: 'c', flat() {
    const g = ctx(), path = () => { g.beginPath(); RUG.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
    g.fillStyle = T.coral; path(); g.fill();
    g.save(); path(); g.clip();
    const pal = [...PASTEL, T.teal, T.mustard, T.fuchsia, T.cobalt], s = 10;
    for (let i = 0; i < 9; i++) for (let j = 0; j < 6; j++) {
      const x = 3 + i * s, y = 2 + j * s, k = (i * 5 + j * 7 + (i * j) % 3) % pal.length;
      g.fillStyle = pal[k]; g.fillRect(x, y, s, s);
      if ((i + j) % 4 === 0) { g.fillStyle = 'rgba(255,255,255,0.5)'; for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) { g.beginPath(); g.arc(x + 1.7 + a * 3.3, y + 1.7 + b * 3.3, 0.7, 0, TAU); g.fill(); } }
      else if ((i + j) % 4 === 2) { g.fillStyle = 'rgba(0,0,0,0.1)'; g.beginPath(); g.moveTo(x, y + s); g.lineTo(x + s, y); g.lineTo(x + s, y + s); g.closePath(); g.fill(); }
      stitches(g, x + 0.8, y + 0.8, s - 1.6, s - 1.6, 'rgba(255,255,255,0.85)', 0.3);
    }
    g.restore();
    g.strokeStyle = sh(T.coral, -1); g.lineWidth = 2.2; path(); g.stroke();
    g.strokeStyle = T.white; g.lineWidth = 0.4; g.setLineDash([1.2, 1]); path(); g.stroke(); g.setLineDash([]);
  } },

  // a wicker basket heaped with balls of yarn, two needles crossed through them and a strand hanging over the rim
  piece('crfbasket', 'Yarn basket and needles', 1, 1, 320, 'cloth', [
    LA(16, 0, 0, [[9, 0], [10.4, 1.6], [11.6, 10], [12, 12]], T.wicker, { m: 'cloth', seg: 14, tex: 'weave' }),
    RG(16, 12, 0, 12, 0.9, T.kraftD, { m: 'cloth', flat: true }),
    S(10.6, 13, -2, 5, 4.6, 5, T.coral, { m: 'cloth', seg: 10 }), S(21, 13.4, 1, 5, 4.6, 5, T.mint, { m: 'cloth', seg: 10 }),
    S(15.6, 16.6, -4, 4.6, 4.4, 4.6, T.lemon, { m: 'cloth', seg: 10 }), S(16, 13.4, 5, 4.2, 4, 4.2, T.lilac, { m: 'cloth', seg: 10 }),
    RD([8, 14, 3], [24, 28, -3], 0.45, T.steel, MT), RD([24, 14, 3], [9, 27, -4], 0.45, T.steel, MT),
    ...[[24, 28, -3], [9, 27, -4]].map(([x, h, z]) => S(x, h, z, 0.9, 0.9, 0.9, T.teal, { m: 'gloss', seg: 6 })),
    RD([4.6, 12.4, 4], [4.2, 5, 7], 0.5, T.coral, CL),
  ]),

  // a daylight magnifier lamp on a weighted foot: a white pole and arm, a round lens ringed with a lit white tube
  piece('crflamp', 'Craft magnifier lamp', 1, 1, 540, 'gloss', [
    C(16, 1, 0, 7, 2, T.steelD, { m: 'metal', seg: 14 }),
    C(16, 18, 0, 0.8, 32, T.white, { m: 'gloss', seg: 8 }),
    S(16, 34.4, 0, 1.2, 1.2, 1.2, T.steel, { m: 'metal', seg: 6 }),
    RD([16, 34.4, 0], [19, 40, 2], 0.6, T.white, GL),
    RG(19, 46.4, 3, 6.4, 1.4, T.white, GL),
    DS(19, 46.4, 3, 5.2, 0.4, '#cfe8f4', { m: 'glass', seg: 16 }),
    RG(19, 46.4, 4.2, 5.4, 0.5, T.bulb, { m: 'glow' }),
  ], { glow: [T.bulb] }),

  // a pine stand holding a big roll of kraft paper, a sheet pulled down the front past the steel cutting edge
  piece('crfkraft', 'Kraft paper roll stand', 1, 1, 460, 'wood', [
    ...[3, 29].flatMap(x => [B(x, 1, 0, 4, 2, 18, T.pineD, WD), B(x, 19, 0, 3, 36, 4, T.pine, GR)]),
    RD([1.6, 31, 0], [30.4, 31, 0], 0.5, T.steelD, MT),
    DS(16, 31, 0, 6, 24, T.kraft, { m: 'cloth', ax: 'x', seg: 16 }),
    B(16, 18, 6, 22, 26, 0.4, T.kraft, { m: 'cloth', r: 0.1 }),
    B(16, 25, 6.6, 26, 1.4, 1.4, T.steelD, { m: 'metal', r: 0.3 }),
  ]),

  // a pine clothes rail on its feet, a shelf below, finished pieces hanging on it: two sundresses and two shirts
  piece('crfrail', 'Finished clothes rail', 2, 1, 680, 'wood', [
    ...[4, 60].flatMap(x => [B(x, 1, 0, 6, 2, 20, T.pineD, WD), RD([x, 2, 0], [x, 51, 0], 1.2, T.pine, WD)]),
    RD([4, 50, 0], [60, 50, 0], 0.9, T.pineD, WD),
    B(32, 7, 0, 56, 1.4, 18, T.pine, WD), B(18, 9.6, 0, 10, 3.6, 8, T.kraft, { m: 'cloth', r: 0.4 }), B(44, 9.4, 1, 8, 3.2, 6, T.sky, { m: 'cloth', r: 0.4 }),
    ...[[14, T.fuchsia, 0], [26, T.mint, 1], [38, T.lemon, 0], [50, T.cobalt, 1]].flatMap(([x, c, shirt], i) => {
      const z = -3 + i * 2;
      return [
        RD([x, 50, z], [x, 47.6, z], 0.3, T.steel, MT), RD([x - 6, 45.4, z], [x, 47.6, z], 0.35, T.pineD, WD), RD([x, 47.6, z], [x + 6, 45.4, z], 0.35, T.pineD, WD),
        shirt
          ? PR(x, 28, z, [[-5, 0], [5, 0], [5, 11], [8, 9], [9.4, 12.6], [5.4, 17], [1, 17], [0, 15.6], [-1, 17], [-5.4, 17], [-9.4, 12.6], [-8, 9], [-5, 11]], 1.6, c, CL)
          : PR(x, 18, z, [[-7.4, 0], [7.4, 0], [4, 14], [5, 26], [2, 27], [0, 25], [-2, 27], [-5, 26], [-4, 14]], 1.6, c, CL),
      ];
    }),
  ]),
];
