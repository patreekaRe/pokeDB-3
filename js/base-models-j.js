/* base-models-j.js  -  Farm, Underwater and Desert pieces, modelled from parts like the arcade cabinets (the user's ask, 2026-10-12).
   js/base-models-f.js's head says how a batch works. Most builders here follow their painting (js/base-furniture-rooms4.js
   and -rooms5.js) pixel for pixel: `u(n)` is n of its 32 pixels a tile, `X(n, W)` a pixel across the painting as x from
   the middle. */

import { rod, tube } from './base-models-kit.js';
import { gableRoof, leaf, potOf } from './base-models-b.js';

const u = (n) => n / 32;
const X = (n, W = 1) => n / 32 - W / 2;
const TAU = Math.PI * 2;
const INK = '#303038', SILVER = '#d8dce4', SEA = '#3a78b8', STONE = '#9a9aa6', STRAW = '#e0c070', BURLAP = '#d8c8a0',
  BASKET = '#c89858', TYRE = '#3a3a44', SOIL = '#5a3a22', SAND = '#e0cc98', BRASS = '#d8a838', GOLD = '#f0c040',
  MARBLE = '#d8d4c8', KELP = '#4a8a3a', SANDST = '#d8b878', LAPIS = '#2a58b8', TURQ = '#38b8a8', CLAY = '#c8784a',
  FACE = '#d8a058';

const sheet = (w, h, draw) => { const c = new OffscreenCanvas(w, h); draw(c.getContext('2d'), w, h); return c; };
const pics = {};
const once = (key, make) => pics[key] || (pics[key] = make());

/* a basket's weave: rows of light and dark reeds crossing */
const weave = (col, dark) => once('weave' + col, () => sheet(128, 64, (g, w, h) => {
  g.fillStyle = col; g.fillRect(0, 0, w, h);
  g.fillStyle = dark;
  for (let j = 0; j < h; j += 8) for (let i = (j / 8) % 2 * 8; i < w; i += 16) g.fillRect(i, j, 8, 4);
  for (let i = 0; i < w; i += 8) g.fillRect(i, 0, 1, h);
}));
/* yarn wound round a ball: stripes of the colour and its shade */
const yarn = (col, dark) => once('yarn' + col, () => sheet(64, 64, (g, w, h) => {
  g.fillStyle = col; g.fillRect(0, 0, w, h);
  g.strokeStyle = dark; g.lineWidth = 2;
  for (let i = -h; i < w; i += 7) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h * 0.7, h); g.stroke(); }
}));

/* stripes across (horizontal bands, `n` of them, alternating `a` and `b`), or down when `down` */
const bands = (a, b, n, down = false) => once('bands' + a + b + n + down, () => sheet(down ? 256 : 16, down ? 16 : 256, (g, w, h) => {
  for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? b : a; if (down) g.fillRect(i * w / n, 0, w / n + 1, h); else g.fillRect(0, i * h / n, w, h / n + 1); }
}));

/** A wheel whose axle runs along z, `r` round, `t` thick, a hub `hub` across. */
function wheel(K, L, x, y, z, r, t, hubCol) {
  K.put(L.cyl(r, t, r, 32).rotateX(Math.PI / 2), K.plain(TYRE), x, y, z);
  K.put(L.torus(r * 0.98, t * 0.32, TAU, 32), K.plain(L.tone(TYRE, 1.25)), x, y, z + t * 0.2 * Math.sign(z || 1));
  K.put(L.cyl(r * 0.5, t * 1.08, r * 0.5, 24).rotateX(Math.PI / 2), K.gloss(hubCol), x, y, z);
  K.put(L.cyl(r * 0.14, t * 1.2, r * 0.14, 12).rotateX(Math.PI / 2), K.metal(), x, y, z);
}

/** A sandy mound a tile across, a pebble on it; returns its top. */
function seabed(K, L) {
  K.put(L.blob(u(28), u(9), u(24), 0.6, 0.6), K.plain(SAND), 0, u(1.5), 0);
  K.put(L.ball(u(1.6), 10, 8).scale(1, 0.7, 1), K.plain(STONE), X(24), u(5), u(5));
  return u(6);
}
/** Little white barnacles dotted over a surface at `pts` ([x, y, z, nx, nz]: where and which way out). */
function barnacles(K, L, pts) {
  for (const [x, y, z, nx, nz] of pts) K.put(L.lathe([[0.001, 0], [u(1.4), 0], [u(1), u(1)], [u(0.4), u(1.1)], [0.001, u(0.8)]], 10).rotateX(Math.PI / 2).rotateY(Math.atan2(nx, nz)), K.plain('#e8e4d8'), x, y, z);
}
/** A chain of balls along points [[x, y, z, r]...], `n` between each pair: a body made of rings (the seahorse's). */
function beads(K, L, m, pts, n = 3) {
  for (let i = 0; i < pts.length - 1; i++) for (let k = 0; k < n; k++) {
    const t = k / n, a = pts[i], b = pts[i + 1], r = a[3] + (b[3] - a[3]) * t;
    K.put(L.ball(r, 14, 10), m, a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t);
  }
  const e = pts[pts.length - 1];
  K.put(L.ball(e[3], 14, 10), m, e[0], e[1], e[2]);
}

export const SHAPES = {
  // boxes, the painting on the front only (js/base-models-kit.js)
  'applecrate carrotcrate corncrate potatocrate cabbagecrate': { make: 'frontbox', d: 0.5, top: 0.3 },
  tomatocrate: { make: 'tomatocrate' },
  silo: { make: 'silo' },
  trough: { make: 'trough' },
  coop: { make: 'coop' },
  tractor: { make: 'tractor' },
  windpump: { make: 'windpump' },
  pitchfork: { make: 'pitchfork' },
  cornrow: { make: 'cornrow' },
  milkbottles: { make: 'milkbottles' },
  fencegate: { make: 'fencegate' },
  mailbox: { make: 'mailbox' },
  feedsack: { make: 'feedsack' },
  handpump: { make: 'handpump' },
  woolbasket: { make: 'woolbasket' },
  plough: { make: 'plough' },
  // underwater
  braincoral: { make: 'coral', kind: 'brain' },
  fancoral: { make: 'coral', kind: 'fan' },
  tubecoral: { make: 'coral', kind: 'tube' },
  stagcoral: { make: 'coral', kind: 'stag' },
  tablecoral: { make: 'coral', kind: 'table' },
  bubblecoral: { make: 'coral', kind: 'bubble' },
  kelp: { make: 'kelp' },
  sunkenpillar: { make: 'sunkenpillar' },
  shipwreck: { make: 'shipwreck' },
  amphora: { make: 'amphora' },
  divinghelmet: { make: 'divinghelmet' },
  jellylamp: { make: 'jellylamp' },
  bubblecolumn: { make: 'bubblecolumn' },
  pearlstand: { make: 'pearlstand' },
  seaurchin: { make: 'seaurchin' },
  anemone: { make: 'anemone' },
  seahorse: { make: 'seahorse' },
  lanternfish: { make: 'lanternfish' },
  sunkenarch: { make: 'sunkenarch' },
  // desert
  obelisk: { make: 'obelisk' },
  sphinx: { make: 'sphinx' },
  sarcophagus: { make: 'sarcophagus' },
  canopicjars: { make: 'canopicjars' },
  papyrus: { make: 'papyrus' },
  datepalm: { make: 'datepalm' },
  scarablamp: { make: 'scarablamp' },
  bedouintent: { make: 'bedouintent' },
  waterjar: { make: 'waterjar' },
  featherfan: { make: 'featherfan' },
  cobrastatue: { make: 'cobrastatue' },
  lotuscolumn: { make: 'lotuscolumn' },
  goldurn: { make: 'goldurn' },
};

export const MAKES = {
  /* ----- Farm ----- */

  tomatocrate(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, wood = K.wood(), dark = K.wood(L.tone(K.pal.w, 0.75)), d = 0.5;
    // the slatted produce crate, its label, full of soil
    K.put(rbox(u(28), u(24), d, 0.02), wood, 0, u(12), 0);
    for (const j of [8, 16]) K.put(rbox(u(28.4), u(0.8), d + 0.006, 0.003), dark, 0, u(j), 0);
    for (const sx of [-1, 1]) K.put(rbox(u(3), u(24.2), d + 0.008, 0.006), K.wood(L.tone(K.pal.w, 0.88)), sx * u(12.5), u(12), 0);
    K.put(rbox(u(12), u(6), 0.01, 0.003), K.gloss(K.pal.p), 0, u(12), d / 2 + 0.004);
    K.put(rbox(u(25), 0.01, d - 0.05, 0.004), K.plain(SOIL), 0, u(23.5), 0);
    // two canes and a crossbar, the vine climbing them, tomatoes hanging off it
    const top = u(24), cane = K.wood('#a8824a');
    for (const x of [X(10), X(23)]) K.put(cyl(u(1), u(42), u(1), 8), cane, x, top + u(21), 0);
    K.put(cyl(u(0.6), u(14), u(0.6), 6).rotateZ(Math.PI / 2), K.wood('#8a6a3a'), X(16.5), top + u(30), 0);
    const greens = [K.gloss('#4a9a3a'), K.gloss('#3a8a2a')];
    for (let j = 4; j < 40; j += 6) for (const [i, x] of [[0, X(10)], [1, X(23)]]) {
      const n = Math.floor(j / 6) + i, sx = n % 2 ? 1 : -1;
      leaf(K, L, greens[n % 2], x, top + u(j), 0, sx * Math.PI / 2 + (n % 3 - 1) * 0.5, 1.1, u(7), u(2.5), 0.2);
    }
    const red = K.gloss('#e83828'), calyx = K.gloss('#3a8a2a');
    for (const [i, j, z] of [[6, -14, 0.04], [14, -22, 0.06], [26, -12, 0.03], [19, -34, 0.05], [12, -38, -0.04], [27, -26, -0.03], [16, -6, 0.07]]) {
      K.put(ball(u(2.6), 14, 10).scale(1, 0.88, 1), red, X(i), top - u(j), z);
      K.put(ball(u(1.2), 8, 6).scale(1, 0.4, 1), calyx, X(i), top - u(j) + u(2.2), z);
    }
  },

  silo(K, s, W, D, L) {
    const { cyl, lathe, torus, rbox } = L, walls = K.plain(K.pal.c), metal = K.metal();
    // a tall round tower banded every few feet, a domed metal cap, its vent, a ladder up the front
    K.put(cyl(u(12), u(74), u(12), 40), walls, 0, u(37), 0);
    for (const j of [8, 26, 44, 62]) K.put(torus(u(12.1), u(0.7), TAU, 40).rotateX(Math.PI / 2), K.plain(L.tone(K.pal.c, 0.72)), 0, u(j), 0);
    const dome = [];
    for (let i = 0; i <= 10; i++) { const a = i / 10 * Math.PI / 2; dome.push([Math.cos(a) * u(13), u(74) + Math.sin(a) * u(16)]); }
    K.put(lathe(dome, 40), metal, 0, 0, 0);
    K.put(cyl(u(2), u(4), u(2.4), 14), K.metal(L.tone(K.pal.m, 0.8)), 0, u(91), 0);
    K.put(cyl(u(3), u(1), u(3), 14), metal, 0, u(93.5), 0);
    const lx = -u(3.5), lz = Math.sqrt(u(12) ** 2 - lx * lx) + u(1.2), steel = K.metal(L.tone(K.pal.m, 0.75));
    for (const dx of [-u(1.5), u(1.5)]) K.put(cyl(u(0.4), u(66), u(0.4), 6), steel, lx + dx, u(37), lz);
    for (let j = 6; j < 70; j += 4) K.put(cyl(u(0.3), u(3), u(0.3), 6).rotateZ(Math.PI / 2), steel, lx, u(j), lz);
  },

  trough(K, s, W, D, L) {
    const { rbox, profileSlab } = L, wood = K.wood(), dark = K.wood(L.tone(K.pal.w, 0.72)), len = W - u(6), d = u(18), b = u(10);
    // a wooden trough on two trestles, wider at the brim, full to near the top
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.put(rbox(u(4), u(10), u(4), 0.01), dark, sx * (len / 2 - u(4)), u(5), sz * u(5));
    for (const sx of [-1, 1]) K.put(rbox(u(4), u(3), u(14), 0.01), dark, sx * (len / 2 - u(4)), u(9), 0);
    const y0 = u(8), y1 = u(24), w = u(2);
    const prof = [[-d / 2, y1], [-b / 2, y0], [b / 2, y0], [d / 2, y1], [d / 2 - w, y1], [b / 2 - w * 0.6, y0 + w], [-b / 2 + w * 0.6, y0 + w], [-d / 2 + w, y1]];
    K.put(profileSlab(prof, len, -len / 2), wood, 0, 0, 0);
    for (const sx of [-1, 1]) K.put(profileSlab([[-d / 2, y1], [-b / 2, y0], [b / 2, y0], [d / 2, y1]], u(2), 0), wood, sx > 0 ? len / 2 - u(2) : -len / 2, 0, 0);
    for (const j of [12, 18]) { const f = (u(j) - y0) / (y1 - y0), zf = b / 2 + (d - b) / 2 * f; for (const sz of [-1, 1]) K.put(rbox(len - 0.02, u(0.8), 0.006, 0.002), dark, 0, u(j), sz * (zf + 0.004), sz * 0, sz * Math.atan2((d - b) / 2, y1 - y0)); }
    K.put(rbox(len - u(4), 0.01, d - u(4), 0.004), K.gloss(SEA), 0, u(21.5), 0);
  },

  coop(K, s, W, D, L) {
    const { rbox, ball, blob, cyl, torus } = L, wood = K.wood(), roof = K.wood(K.pal.c), dark = K.plain('#2a2028'), d = u(20);
    // a hen house on four legs, a gable roof in the theme's colour, a dark doorway, a ramp down to the floor
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.put(rbox(u(3), u(18), u(3), 0.008), wood, sx * u(10.5), u(9), sz * u(7));
    K.put(rbox(u(26), u(34), d, 0.02), wood, 0, u(35), 0);
    for (let j = 22; j < 52; j += 5) K.put(rbox(u(26.2), u(0.5), d + 0.004, 0.002), K.wood(L.tone(K.pal.w, 0.8)), 0, u(j), 0);
    gableRoof(K, L, u(52), u(26), d, u(12), u(2), roof, wood);
    K.put(rbox(u(10), u(12), 0.02, 0.004), dark, 0, u(34), d / 2);
    const ramp = L.rbox(u(28), u(1.2), u(6), 0.005);
    K.put(ramp, K.wood(L.tone(K.pal.w, 1.1)), u(8), u(14), d / 2 + 0.02, 0, 0, -Math.atan2(u(26), u(9)));
    // a hen looking out of a round window over the door
    K.put(torus(u(4.4), u(0.8), TAU, 24), K.wood(L.tone(K.pal.w, 0.75)), 0, u(46), d / 2);
    K.put(cyl(u(4), 0.01, u(4), 24).rotateX(Math.PI / 2), dark, 0, u(46), d / 2 - 0.002);
    K.put(blob(u(7), u(6), u(6), 0.6, 0.6), K.gloss('#f4f4f0'), 0, u(46), d / 2 - u(1));
    for (const sx of [-1, 1]) K.put(ball(u(0.6), 8, 6), K.gloss(INK), sx * u(1.6), u(47), d / 2 + u(1.9));
    K.put(L.cyl(0.001, u(2.2), u(0.9), 8).rotateX(Math.PI / 2), K.gloss('#f8b040'), 0, u(45.5), d / 2 + u(2.8));
    for (let i = 0; i < 3; i++) K.put(ball(u(1), 8, 6), K.gloss('#e04848'), (i - 1) * u(1.1), u(49.5 + (i % 2) * 0.6), d / 2 + u(0.5));
  },

  tractor(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, body = K.gloss(K.pal.c), shade = K.gloss(L.tone(K.pal.c, 0.75)), glass = K.gloss('#cfe8f4');
    // side on, its nose to the right: the long hood, its grille, the cab with windows all round, a roof
    K.put(rbox(u(42), u(14), u(14), 0.03), body, X(37, W), u(25), 0);
    K.put(rbox(u(3), u(10), u(12), 0.01), K.metal(SILVER), X(57.5, W), u(25), 0);
    for (let j = 0; j < 4; j++) for (const sz of [-1, 1]) K.put(rbox(u(1.6), u(9), 0.006, 0.002), shade, X(35 + j * 4, W), u(25), sz * u(7.05));
    K.put(rbox(u(18), u(26), u(18), 0.03), body, X(15, W), u(43), 0);
    for (const sz of [-1, 1]) K.put(rbox(u(12), u(11), 0.01, 0.004), glass, X(15, W), u(47), sz * u(9.03));
    K.put(rbox(0.01, u(11), u(12), 0.004), glass, X(24.03, W), u(47), 0);
    K.put(rbox(0.01, u(11), u(12), 0.004), glass, X(5.97, W), u(47), 0);
    K.put(rbox(u(22), u(2.5), u(21), 0.01), shade, X(15, W), u(57), 0);
    K.put(rbox(u(16), u(4), u(16), 0.01), K.plain(TYRE), X(15, W), u(30), 0);
    // the exhaust stack, a cap on it; big wheels behind, small in front
    K.put(cyl(u(1.5), u(14), u(1.5), 12), K.metal(TYRE), X(47, W), u(38), -u(3));
    K.put(cyl(u(2), u(1), u(1.5), 12), K.metal(TYRE), X(47, W), u(45.5), -u(3));
    for (const sz of [-1, 1]) {
      wheel(K, L, X(14, W), u(13), sz * u(11), u(13), u(6), '#f8d030');
      wheel(K, L, X(52, W), u(8), sz * u(8.5), u(8), u(4), '#f8d030');
    }
    K.put(cyl(u(1), u(22), u(1), 8).rotateX(Math.PI / 2), K.metal(), X(14, W), u(13), 0);
    K.put(cyl(u(0.8), u(17), u(0.8), 8).rotateX(Math.PI / 2), K.metal(), X(52, W), u(8), 0);
  },

  windpump(K, s, W, D, L) {
    const { rbox, cyl, ball, torus } = L, steel = K.metal(), light = K.metal(L.tone(K.pal.m, 1.2));
    // a lattice tower tapering up from four splayed feet, ringed and braced on every side
    const at = (j) => u(12 - j / 64 * 9), lv = [0, 10, 20, 30, 40, 50, 64];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) rod(K, L, steel, [sx * u(12), 0, sz * u(12)], [sx * u(3), u(64), sz * u(3)], u(0.8));
    for (let n = 0; n < lv.length - 1; n++) {
      const a = at(lv[n]), b = at(lv[n + 1]), y0 = u(lv[n]), y1 = u(lv[n + 1]);
      for (const [px, pz, qx, qz] of [[-1, 1, 1, 1], [1, 1, 1, -1], [1, -1, -1, -1], [-1, -1, -1, 1]]) {
        if (n) rod(K, L, light, [px * a, y0, pz * a], [qx * a, y0, qz * a], u(0.5));
        rod(K, L, light, [px * a, y0, pz * a], [qx * b, y1, qz * b], u(0.4));
      }
    }
    K.put(rbox(u(8), u(2), u(8), 0.006), steel, 0, u(65), 0);
    // the wind wheel facing you on its hub: twelve tilted sails in a ring, a tail vane swung out behind
    const cy = u(74), z = u(4);
    K.put(cyl(u(1.2), u(10), u(1.2), 10), steel, 0, u(69), 0);
    K.put(torus(u(13.5), u(0.6), TAU, 40), steel, 0, cy, z);
    K.put(torus(u(6), u(0.5), TAU, 32), steel, 0, cy, z);
    for (let n = 0; n < 12; n++) {
      const a = n / 12 * TAU, r = u(9.5);
      K.put(rbox(u(3.4), u(8.5), u(0.4), 0.002), K.gloss(n % 2 ? K.pal.p : L.tone(K.pal.p, 0.85)), Math.cos(a) * r, cy + Math.sin(a) * r, z, 0.35, 0, a - Math.PI / 2);
    }
    K.put(ball(u(3), 16, 12), K.gloss(K.pal.c), 0, cy, z + u(1));
    rod(K, L, steel, [0, cy, 0], [u(10), cy, -u(10)], u(0.7));
    const fin = new L.THREE.Shape([[0, -3], [9, -6], [9, 6], [0, 3]].map(([a, b]) => new L.THREE.Vector2(u(a), u(b))));
    K.put(new L.THREE.ExtrudeGeometry(fin, { depth: u(0.6), bevelEnabled: false }).translate(0, 0, -u(0.3)), K.gloss(K.pal.c), u(9), cy, -u(9), -Math.PI / 4);
  },

  pitchfork(K, s, W, D, L) {
    const { rbox, cyl } = L, wood = K.wood(), handle = K.wood(L.tone(K.pal.w, 1.15)), steel = K.metal(SILVER);
    // a fence post, a pitchfork and a rake leaning on it, their heads up
    K.put(rbox(u(6), u(50), u(6), 0.01), wood, 0, u(25), -u(3));
    K.put(rbox(u(6.6), u(1.2), u(6.6), 0.004), K.wood(L.tone(K.pal.w, 0.7)), 0, u(44), -u(3));
    const fork = [X(8), 0.01, u(4)], forkTop = [X(12), u(84), -u(1)];
    rod(K, L, handle, fork, forkTop, u(1));
    K.put(rbox(u(12), u(1.6), u(1.6), 0.004), steel, forkTop[0], u(86), forkTop[2], 0, 0, -0.05);
    for (let n = 0; n < 4; n++) K.put(cyl(u(0.35), u(9), u(0.5), 6), steel, forkTop[0] - u(5) + n * u(3.4), u(90.5), forkTop[2]);
    const rake = [X(24), 0.01, u(4)], rakeTop = [X(20), u(76), -u(1)];
    rod(K, L, handle, rake, rakeTop, u(1));
    K.put(rbox(u(14), u(1.4), u(1.4), 0.004), steel, rakeTop[0], u(77), rakeTop[2]);
    for (let n = 0; n < 6; n++) K.put(cyl(u(0.3), u(4), u(0.3), 6).rotateX(-0.6), steel, rakeTop[0] - u(6.4) + n * u(2.6), u(75.5), rakeTop[2] + u(1));
  },

  cornrow(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, stalk = K.gloss('#5a9a3a'), leaves = [K.gloss('#78b848'), K.gloss('#9ad070')], cob = K.gloss('#f8d850'), husk = K.gloss('#9ad070'), tassel = K.wood('#d8b858');
    // a ridge of earth, a stalk every third of a tile, staggered, each with its leaves, a cob and a tassel
    K.put(L.blob(W - u(2), u(5), u(14), 0.7, 0.6), K.plain('#7a5a3a'), 0, u(1.5), 0);
    const n = Math.floor(W * 32 / 10) - 0.0;
    for (let i = 0; i < n; i++) {
      const x = X(6 + i * 10 + 3, W), z = (i % 2 ? 1 : -1) * u(3), h = u(70 + (i * 7) % 14);
      K.put(cyl(u(0.9), h, u(1.2), 8), stalk, x, h / 2, z);
      for (let l = 0; l < 4; l++) {
        const sx = (l + i) % 2 ? 1 : -1, y = u(12 + l * 15 + (i % 3) * 5);
        leaf(K, L, leaves[l % 2], x, y, z, sx * Math.PI / 2 + (i % 3 - 1) * 0.4, 0.9, u(14), u(2), 0.5);
      }
      const cy = h - u(26);
      K.put(ball(1, 12, 10).scale(u(1.8), u(6), u(1.8)).rotateZ(-0.25), cob, x + u(2), cy, z + u(1));
      for (const a of [-0.45, -0.05]) K.put(ball(1, 10, 8).scale(u(1.3), u(6.5), u(1.6)).rotateZ(a), husk, x + u(2), cy - u(1), z + u(1));
      for (let t = 0; t < 3; t++) K.put(cyl(u(0.25), u(7), u(0.25), 5).translate(0, u(3.5), 0).rotateZ((t - 1) * 0.45), tassel, x, h, z);
    }
  },

  milkbottles(K, s, W, D, L) {
    const { rbox, lathe, cyl } = L, crate = K.gloss(K.pal.c), d = u(14), milk = K.gloss('#fbfbf6');
    // an open-topped crate holding two rows of four bottles
    K.put(rbox(u(26), u(2), d, 0.006), crate, 0, u(1), 0);
    for (const sz of [-1, 1]) K.put(rbox(u(26), u(14), u(1.2), 0.006), crate, 0, u(7), sz * (d / 2 - u(0.6)));
    for (const sx of [-1, 1]) K.put(rbox(u(1.2), u(14), d, 0.006), crate, sx * u(12.4), u(7), 0);
    for (const x of [-u(6), u(5.5)]) K.put(rbox(u(1), u(12), d - u(2), 0.004), K.gloss(L.tone(K.pal.c, 0.8)), x, u(8), 0);
    const caps = ['#4a98d8', '#e04848', '#58b848', '#f8d030'];
    for (let n = 0; n < 4; n++) for (const z of [-u(3.2), u(3.2)]) {
      const x = X(7.5 + n * 6);
      K.put(lathe([[0.001, 0], [u(2.5), 0], [u(2.6), u(12)], [u(1.6), u(15)], [u(1.5), u(19)], [0.001, u(19)]], 18), milk, x, u(2), z);
      K.put(cyl(u(1.7), u(1.2), u(1.7), 14), K.gloss(caps[(n + (z > 0 ? 0 : 2)) % 4]), x, u(21.4), z);
    }
  },

  fencegate(K, s, W, D, L) {
    const { rbox } = L, post = K.wood(), rail = K.wood(K.pal.p), steel = K.metal();
    // two square posts with caps, three rails between them, a brace across, a hinge and a latch
    for (const x of [X(4, W), X(W * 32 - 4, W)]) {
      K.put(rbox(u(6), u(48), u(6), 0.01), post, x, u(24), 0);
      K.put(rbox(u(7), u(2), u(7), 0.008), K.wood(L.tone(K.pal.w, 1.15)), x, u(49), 0);
    }
    const span = W - u(14);
    for (const j of [16.5, 30.5, 44.5]) K.put(rbox(span, u(5), u(2.5), 0.008), rail, 0, u(j - 2), 0);
    const ax = X(8, W), ay = u(10), bx = X(W * 32 - 9, W), by = u(40), len = Math.hypot(bx - ax, by - ay);
    K.put(rbox(len, u(4), u(2), 0.008), rail, (ax + bx) / 2, (ay + by) / 2, u(1.4), 0, 0, Math.atan2(by - ay, bx - ax));
    for (const j of [12, 38]) K.put(rbox(u(4), u(2), u(3.2), 0.004), steel, X(8, W), u(j), 0);
    K.put(rbox(u(3), u(3), u(3.2), 0.004), steel, X(W * 32 - 8.5, W), u(26.5), 0);
  },

  mailbox(K, s, W, D, L) {
    const { THREE, rbox, cyl } = L, box = K.gloss(K.pal.c);
    // a post with grass at its foot, the round-topped box on it, its door facing you, the red flag up
    K.put(rbox(u(4), u(40), u(4), 0.006), K.wood(), 0, u(20), 0);
    for (let n = 0; n < 7; n++) leaf(K, L, K.gloss(n % 2 ? K.pal.leaf : L.tone(K.pal.leaf, 1.15)), Math.cos(n * 0.9) * u(2.5), 0, Math.sin(n * 0.9) * u(2.5), n * 0.9, 0.5, u(5), u(1.2), 0.1);
    const arch = new THREE.Shape();
    arch.moveTo(-u(10), 0); arch.lineTo(u(10), 0); arch.lineTo(u(10), u(8)); arch.absarc(0, u(8), u(10), 0, Math.PI, false); arch.lineTo(-u(10), 0);
    const len = u(24);
    K.put(new THREE.ExtrudeGeometry(arch, { depth: len, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2, curveSegments: 24 }).translate(0, 0, -len / 2), box, 0, u(40), 0);
    const door = new THREE.Shape();
    door.moveTo(-u(8.5), u(1.5)); door.lineTo(u(8.5), u(1.5)); door.lineTo(u(8.5), u(8)); door.absarc(0, u(8), u(8.5), 0, Math.PI, false); door.lineTo(-u(8.5), u(1.5));
    K.put(new THREE.ExtrudeGeometry(door, { depth: u(0.6), bevelEnabled: false, curveSegments: 24 }), K.gloss(L.tone(K.pal.c, 0.85)), 0, u(40), len / 2 + 0.008);
    K.put(rbox(u(4), u(1), u(1.4), 0.003), K.gloss(K.pal.p), 0, u(52), len / 2 + u(1));
    K.put(rbox(u(1.2), u(14), u(1.2), 0.003), K.gloss('#e04848'), u(10.8), u(53), -u(4));
    K.put(rbox(u(0.8), u(4), u(5), 0.003), K.gloss('#e04848'), u(10.8), u(58), -u(1.6));
  },

  feedsack(K, s, W, D, L) {
    const { blob, ball } = L, sack = K.cloth(BURLAP), band = K.cloth(K.pal.c), dot = K.gloss(K.pal.p);
    // two sacks side by side, a third laid across them, each banded in the theme's colour, grain spilled at their feet
    for (const [i, w, h, y, z, tilt] of [[1, 16, 22, 0, 0.02, 0.05], [14, 17, 26, 0, -0.04, -0.04], [7, 16, 14, 24, 0.0, 0.1]]) {
      const x = X(i + w / 2), cy = u(y + h / 2), d = u(12);
      K.put(blob(u(w), u(h), d, 0.4, 0.45), sack, x, cy, z, 0, 0, tilt);
      K.put(blob(u(w) * 1.03, u(5), d * 1.04, 0.4, 0.6), band, x, cy + u(h / 2 - 9) * (h > 15 ? 1 : 0.4), z, 0, 0, tilt);
      K.put(ball(u(1.2), 10, 8).scale(1, 1, 0.5), dot, x, cy + u(h / 2 - 9) * (h > 15 ? 1 : 0.4), z + d / 2 * 1.04 + 0.002);
    }
    for (let n = 0; n < 10; n++) K.put(ball(u(0.6), 6, 4), K.gloss('#e8c058'), X(2 + K.r() * 8), u(0.4), u(5) + K.r() * u(4));
  },

  handpump(K, s, W, D, L) {
    const { rbox, cyl, ball, torus, lathe } = L, iron = K.metal(), steel = K.metal(SILVER);
    // a stone slab, the iron pump on it, its spout over a pail, the handle raised
    K.put(rbox(u(18), u(6), u(16), 0.015), K.plain(STONE), X(13), u(3), -u(2));
    K.put(cyl(u(4), u(38), u(4.4), 20), iron, X(13), u(25), -u(2));
    K.put(torus(u(4.4), u(0.7), TAU, 20).rotateX(Math.PI / 2), iron, X(13), u(10), -u(2));
    K.put(ball(u(4), 16, 12), iron, X(13), u(45), -u(2));
    K.put(tube(L, [[X(16), u(35), -u(2)], [X(22), u(35), -u(2)], [X(24.5), u(33), -u(2)], [X(24.5), u(29), -u(2)]], u(1.4), 20), iron, 0, 0, 0);
    rod(K, L, iron, [X(12), u(46), -u(2)], [X(2), u(58), -u(2)], u(1));
    K.put(ball(u(1.4), 10, 8), iron, X(2), u(58), -u(2));
    // the pail, water in it, its handle, drops falling
    K.put(lathe([[0.001, u(2)], [u(4.5), u(2)], [u(5.6), u(14)], [u(5.2), u(14)], [u(4.2), u(3)], [0.001, u(3)]], 24), steel, X(24.5), 0, -u(2));
    K.put(cyl(u(5), 0.004, u(5), 24), K.gloss(SEA), X(24.5), u(12), -u(2));
    K.put(torus(u(5.4), u(0.3), Math.PI, 24), steel, X(24.5), u(14), -u(2));
    for (const j of [28, 24]) K.put(ball(u(0.7), 8, 6).scale(1, 1.4, 1), K.gloss('#a8d8f8'), X(24.5), u(j - 2), -u(2));
  },

  woolbasket(K, s, W, D, L) {
    const { lathe, ball, torus } = L;
    // a round woven basket, balls of wool heaped in it, two needles stuck in the top one
    K.put(lathe([[0.001, 0], [u(11.5), 0], [u(12.5), u(2)], [u(14), u(16)], [u(13), u(16)], [u(12), u(4)], [0.001, u(4)]], 36), K.pic(weave(BASKET, L.tone(BASKET, 0.75))), 0, 0, 0);
    K.put(torus(u(13.6), u(1), TAU, 36).rotateX(Math.PI / 2), K.wood(L.tone(BASKET, 0.85)), 0, u(16), 0);
    for (const [i, c, z] of [[9, '#f8f4e0', 0.05], [18, K.pal.c, 0.08], [24, '#f8e070', -0.04], [13, K.pal.p, -0.08], [17, '#a8d0f0', -0.02]]) {
      K.put(ball(u(5.5), 20, 14), K.pic(yarn(c, L.tone(c, 0.8))), X(i), u(19 - (i % 3) * 1.5), z);
    }
    for (const [a, b] of [[[X(20), u(22), 0.05], [X(28), u(42), -0.02]], [[X(23), u(22), 0.04], [X(26), u(44), 0.02]]]) {
      rod(K, L, K.metal(SILVER), a, b, u(0.5));
      K.put(ball(u(1.1), 10, 8), K.gloss(K.pal.c), ...b);
    }
  },

  plough(K, s, W, D, L) {
    const { THREE, rbox, cyl, ball } = L, wood = K.wood(), steel = K.metal(SILVER);
    // a wooden beam, two handles rising back from it, splayed, a bar between; the share and mouldboard at its nose, a little wheel
    K.put(rbox(u(24), u(3), u(3), 0.008), wood, X(16), u(6), 0);
    for (const [x0, x1, top, z] of [[26, 30, 50, -u(4)], [20, 23, 46, u(4)]]) rod(K, L, wood, [X(x0), u(6), 0], [X(x1), u(top), z], u(1.1));
    rod(K, L, wood, [X(28.3), u(31), -u(2.3)], [X(21.9), u(31), u(2.5)], u(0.8));
    const share = new THREE.Shape([[0, 0], [10, 0], [6, 12], [2, 12]].map(([a, b]) => new THREE.Vector2(u(a), u(b))));
    K.put(new THREE.ExtrudeGeometry(share, { depth: u(1), bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 1 }).rotateY(-0.5), steel, X(2), u(3), u(1));
    K.put(cyl(u(4), u(1.6), u(4), 24).rotateX(Math.PI / 2), K.metal(), X(8), u(4), -u(3));
    K.put(cyl(u(1.5), u(2), u(1.5), 12).rotateX(Math.PI / 2), steel, X(8), u(4), -u(3));
  },

  /* ----- Underwater ----- */

  coral(K, s, W, D, L) {
    const { THREE, lathe, cyl, ball, torus } = L, t = seabed(K, L), c = K.pal.c, m = K.gloss(c), light = K.gloss(L.tone(c, 1.2)), dark = K.gloss(L.tone(c, 0.7));
    if (s.kind === 'brain') {
      // a dome ploughed with winding ridges
      const pts = [];
      for (let i = 0; i <= 14; i++) { const a = i / 14 * Math.PI / 2; pts.push([Math.max(0.001, Math.cos(a) * u(13)), t - u(1) + Math.sin(a) * u(19)]); }
      const g = lathe(pts.reverse().map(([r, y]) => [r, y]).reverse(), 64), pos = g.attributes.position;
      for (let k = 0; k < pos.count; k++) {
        const x = pos.getX(k), y = pos.getY(k), z = pos.getZ(k), a = Math.atan2(z, x), f = 1 + 0.045 * Math.sin(y * 70 + Math.sin(a * 5) * 3);
        pos.setX(k, x * f); pos.setZ(k, z * f);
      }
      g.computeVertexNormals();
      K.put(g, m, 0, 0, 0);
    } else if (s.kind === 'fan') {
      // a lacy fan of branching ribs on a stubby trunk, a thin web between them
      K.put(cyl(u(1.5), u(5), u(2), 10), dark, 0, t + u(2), 0);
      const web = new THREE.CircleGeometry(1, 40, 0, Math.PI).scale(u(24), u(38), 1);
      K.put(web, K.gloss(L.tone(c, 0.85)), 0, t + u(3), -0.004);
      K.put(web.clone(), K.gloss(L.tone(c, 0.85)), 0, t + u(3), 0.004, Math.PI);
      for (let n = 0; n < 11; n++) {
        const a = Math.PI - n / 10 * Math.PI, pts = [[0, t + u(3), 0]];
        for (let k = 1; k <= 6; k++) { const q = a + Math.sin(k + n) * 0.1; pts.push([Math.cos(q) * k * u(4.4), t + u(3) + Math.sin(q) * k * u(6.6), Math.sin(k * 0.8 + n) * 0.012]); }
        K.put(tube(L, pts, u(0.7), 18), n % 2 ? m : light, 0, 0, 0);
      }
    } else if (s.kind === 'tube') {
      // a cluster of open tubes of different heights, dark inside
      for (const [i, h, z] of [[5, 22, 0.04], [11, 34, -0.05], [17, 28, 0.06], [23, 38, -0.02], [14, 16, 0.12], [25, 18, 0.1], [20, 24, -0.12]]) {
        const x = X(i + 0.5);
        K.put(lathe([[u(2.2), 0], [u(2.6), u(h)], [u(2), u(h)], [u(1.6), u(h - 3)], [0.001, u(h - 3)]], 18), m, x, t - u(1), z);
        K.put(torus(u(2.4), u(0.5), TAU, 18).rotateX(Math.PI / 2), light, x, t - u(1) + u(h), z);
      }
    } else if (s.kind === 'stag') {
      // antlers: a trunk splitting in two, and again, out in every direction
      const R = K.r;
      const branch = (p, dir, len, d) => {
        const q = p.clone().addScaledVector(dir, len);
        rod(K, L, d ? m : dark, p.toArray(), q.toArray(), u(Math.max(0.8, 2.2 - d * 0.5)));
        K.put(ball(u(Math.max(0.8, 2.2 - d * 0.4)), 10, 8), d > 3 ? light : m, q.x, q.y, q.z);
        if (d >= 4) return;
        for (const s2 of [-1, 1]) {
          const a = s2 * (0.45 + R() * 0.15), turn = d ? R() * TAU : 0;
          const nd = dir.clone().applyAxisAngle(new THREE.Vector3(Math.cos(turn), 0, Math.sin(turn)), a).normalize();
          branch(q, nd, len * 0.74, d + 1);
        }
      };
      branch(new THREE.Vector3(0, t - u(1), 0), new THREE.Vector3(0, 1, 0), u(13), 0);
    } else if (s.kind === 'table') {
      // a stalk holding up three flat plates, the widest lowest
      K.put(cyl(u(2), u(20), u(2.6), 12), dark, 0, t + u(9), 0);
      for (const [y, r] of [[20, 14], [26, 11], [31, 7]]) {
        K.put(lathe([[0.001, 0], [u(r), u(0.4)], [u(r), u(1.6)], [u(r - 1), u(2.2)], [0.001, u(1.8)]], 36), m, 0, t + u(y - 1), 0);
        for (let a = 0; a < 10; a++) K.put(ball(u(0.7), 6, 4), light, Math.cos(a * 0.63 * r) * u(r - 2) * (a / 10), t + u(y + 1), Math.sin(a * 0.63 * r) * u(r - 2) * (a / 10));
      }
    } else {
      // a heap of round bubbles, pale and coloured
      for (let n = 0; n < 18; n++) {
        const a = n * 2.4, q = u(9) * Math.sqrt((n + 0.5) / 18), r = u(2.2 + K.r() * 2.2);
        K.put(ball(r, 14, 10), n % 3 ? K.gloss(K.pal.p) : light, Math.cos(a) * q, t + r * 0.6 + u(24) * (1 - (n + 0.5) / 18) * 0.7, Math.sin(a) * q * 0.8);
      }
    }
  },

  kelp(K, s, W, D, L) {
    const t = seabed(K, L), stalk = K.gloss(KELP), blade = K.gloss(L.tone(KELP, 1.2)), bulb = K.gloss('#8ab858');
    // four long fronds swaying up from the sand, blades off them, a float at each tip
    for (const [i, h, ph, z] of [[9, 84, 0, 0.02], [17, 70, 2, -0.08], [23, 88, 4, 0.06], [13, 50, 1, 0.12]]) {
      const pts = [];
      for (let j = 0; j <= h; j += 6) pts.push([X(i + 1) + u(Math.sin(j / 10 + ph) * 3), t + u(j), z + u(Math.cos(j / 14 + ph) * 2)]);
      K.put(tube(L, pts, u(1), 40), stalk, 0, 0, 0);
      for (let j = 6; j < h - 4; j += 12) {
        const p = pts[Math.round(j / 6)], sx = j % 24 < 12 ? 1 : -1;
        leaf(K, L, blade, p[0], p[1], p[2], sx * Math.PI / 2 + ph, 0.8, u(9), u(2.4), 0.25);
      }
      const e = pts[pts.length - 1];
      K.put(L.ball(u(2), 12, 8), bulb, e[0], e[1] + u(1.5), e[2]);
    }
  },

  sunkenpillar(K, s, W, D, L) {
    const { rbox, lathe, ball } = L, marble = K.plain(MARBLE);
    // a slab, the fluted column on it snapped off at a slant, barnacles on it, a strand of weed up its side
    K.put(rbox(u(26), u(8), u(22), 0.015), marble, 0, u(4), 0);
    const g = L.cyl(u(9), u(54), u(9.4), 48, true).translate(0, u(35), 0), pos = g.attributes.position;
    for (let k = 0; k < pos.count; k++) {
      const x = pos.getX(k), y = pos.getY(k), z = pos.getZ(k), a = Math.atan2(z, x), f = 1 - 0.06 * Math.max(0, Math.cos(a * 12));
      pos.setX(k, x * f); pos.setZ(k, z * f);
      if (y > u(50)) pos.setY(k, u(56) + Math.sin(a) * u(3) + Math.sin(a * 5) * u(1.5));
    }
    g.computeVertexNormals();
    K.put(g, marble, 0, 0, 0);
    const top = [];
    for (let i = 0; i <= 48; i++) { const a = i / 48 * TAU, f = 1 - 0.06 * Math.max(0, Math.cos(a * 12)); top.push(new L.THREE.Vector2(Math.cos(a) * u(9) * f, -Math.sin(a) * u(9) * f)); }
    const cap = new L.THREE.ShapeGeometry(new L.THREE.Shape(top)).rotateX(-Math.PI / 2), cp = cap.attributes.position;
    for (let k = 0; k < cp.count; k++) { const a = Math.atan2(cp.getZ(k), cp.getX(k)); cp.setY(k, u(56) + Math.sin(a) * u(3) + Math.sin(a * 5) * u(1.5)); }
    cap.computeVertexNormals();
    K.put(cap, K.plain(L.tone(MARBLE, 0.9)), 0, 0, 0);
    const b = [];
    for (let n = 0; n < 7; n++) { const a = 0.3 + K.r() * 2.2, y = u(14 + K.r() * 36); b.push([Math.cos(a) * u(9.2), y, Math.sin(a) * u(9.2), Math.cos(a), Math.sin(a)]); }
    barnacles(K, L, b);
    const weed = [];
    for (let j = 0; j <= 40; j += 4) weed.push([u(9.6) * Math.cos(0.6) + u(Math.sin(j / 4) * 0.8), u(8 + j), u(9.6) * Math.sin(0.6)]);
    K.put(tube(L, weed, u(0.6), 30), K.gloss(KELP), 0, 0, 0);
    leaf(K, L, K.gloss('#5a9a4a'), weed[5][0], weed[5][1], weed[5][2], 1.2, 0.9, u(5), u(2), 0.2);
  },

  shipwreck(K, s, W, D, L) {
    const { THREE, rbox, torus, ball, cyl } = L, plank = K.wood(L.tone(K.pal.w, 0.85)), dark = K.wood(L.tone(K.pal.w, 0.6)), len = W - u(6), d = u(22);
    // the hull side on, high at the stern on the left, sinking towards the bow, its end broken away into bare ribs
    const sh = new THREE.Shape(), x0 = -len / 2, n = 30;
    sh.moveTo(x0 + u(2), 0);
    sh.lineTo(x0 + len * 0.76, 0);
    for (let i = n; i >= 0; i--) {
      const f = i / n, jag = f > 0.7 ? [0, u(6), u(2), u(8), u(3), u(7), u(1), u(9), u(4)][i % 9] : 0;
      sh.lineTo(x0 + f * len * 0.76, u(30) - f * f * u(14) - jag);
    }
    sh.lineTo(x0, u(6));
    const hull = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: true, bevelThickness: u(3), bevelSize: u(2), bevelSegments: 3, curveSegments: 4 }).translate(0, 0, -d / 2);
    K.put(hull, plank, 0, 0, 0);
    for (let j = 6; j < 18; j += 5) for (const sz of [-1, 1]) K.put(rbox(len * 0.7, u(0.6), 0.004, 0.002), dark, x0 + len * 0.36, u(j), sz * (d / 2 + u(3) + 0.002));
    for (let k = 0; k < 4; k++) {
      const x = x0 + len * 0.8 + k * u(4);
      K.put(torus(u(11 - k * 1.5), u(1), Math.PI * 0.85, 20).rotateY(Math.PI / 2).rotateX(-Math.PI / 2 + 0.2), K.wood(L.tone(K.pal.w, 1.1)), x, u(1), 0);
    }
    K.put(rbox(u(18), u(2), u(3), 0.006), dark, x0 + len * 0.88, u(1), 0);
    // the broken mast leaning, its yard and the rags of the sail
    rod(K, L, K.wood(), [x0 + u(12), u(28), 0], [x0 + u(20), u(80), u(2)], u(1.5));
    rod(K, L, K.wood(), [x0 + u(8), u(64), u(3)], [x0 + u(28), u(68), u(1)], u(1));
    for (let i = 0; i < 8; i++) {
      const h = u(10 + (i % 3) * 3);
      K.put(rbox(u(2.2), h, 0.006, 0.002), K.cloth(L.tone(K.pal.p, 0.9)), x0 + u(9 + i * 2.3), u(66 - i * 0.4) - h / 2, u(2.4 - i * 0.15), 0, 0, Math.sin(i) * 0.12);
    }
    // treasure spilling out: a chest in the sand, coins
    const cx = len / 2 - u(10);
    K.put(rbox(u(10), u(7), u(8), 0.01), dark, cx, u(3.5), u(8));
    K.put(rbox(u(10.4), u(1.6), u(8.4), 0.004), K.metal(GOLD), cx, u(6.4), u(8));
    for (let k = 0; k < 6; k++) K.put(cyl(u(1.4), u(0.5), u(1.4), 12), K.metal(GOLD), x0 + u(26) + K.r() * u(10), u(0.3) + k * 0.002, u(9) + K.r() * u(5), 0, K.r() * 0.3);
    K.put(ball(u(3), 14, 10), K.metal(GOLD), x0 + u(30), u(3), u(10));
  },

  amphora(K, s, W, D, L) {
    const { lathe, torus, ball } = L, clay = K.gloss(K.pal.pot);
    // a tall jar, narrow neck, round belly, pointed foot; two handles, a band in the accent, barnacles
    const r = (j) => (j < 6 ? 4 : j < 34 ? 4 + Math.sin((j - 6) / 28 * Math.PI) * 8 : 3 - (j - 34) * 0.3);
    const pts = [[0.001, 0]];
    for (let j = 40; j >= 0; j -= 2) pts.push([u(r(j)), u(44 - j)]);
    pts.push([u(4.6), u(44)], [u(4.6), u(45)], [u(3.4), u(45)], [u(3.2), u(40)], [0.001, u(40)]);
    K.put(lathe(pts, 32), clay, 0, 0, 0);
    for (const sx of [-1, 1]) K.put(torus(u(4), u(1), Math.PI * 1.1, 16).rotateZ(sx > 0 ? -Math.PI / 2 : Math.PI / 2 + 0.3), clay, sx * u(5), u(36), 0);
    K.put(torus(u(r(18)) + u(0.2), u(0.9), TAU, 32).rotateX(Math.PI / 2), K.gloss(K.pal.a), 0, u(26), 0);
    const b = [];
    for (let n = 0; n < 5; n++) { const a = 0.6 + K.r() * 2, y = 14 + K.r() * 18, rr = u(r(44 - y)); b.push([Math.cos(a) * rr, u(y), Math.sin(a) * rr, Math.cos(a), Math.sin(a)]); }
    barnacles(K, L, b);
  },

  divinghelmet(K, s, W, D, L) {
    const { cyl, ball, torus } = L, t = seabed(K, L), brass = K.metal(BRASS), dim = K.metal(L.tone(BRASS, 0.75)), glass = K.gloss('#2a4a6a');
    // a brass collar on the sand, the round helmet on it, a big porthole in front and one either side, rivets, the air valve
    K.put(cyl(u(11), u(8), u(11.5), 32), brass, 0, t + u(3), 0);
    K.put(torus(u(11.2), u(0.8), TAU, 32).rotateX(Math.PI / 2), dim, 0, t + u(7), 0);
    for (let a = 0; a < 12; a++) K.put(ball(u(0.7), 6, 4), dim, Math.cos(a / 12 * TAU) * u(11.4), t + u(3), Math.sin(a / 12 * TAU) * u(11.4));
    const cy = t + u(20);
    K.put(ball(u(12), 32, 24), brass, 0, cy, 0);
    for (const [turn, r] of [[0, 6], [Math.PI / 2, 3], [-Math.PI / 2, 3]]) {
      const dx = Math.sin(turn), dz = Math.cos(turn), out = Math.sqrt(u(12) ** 2 - u(r) ** 2) + u(0.6);
      K.put(torus(u(r), u(1), TAU, 28), dim, dx * out, cy - u(1), dz * out, turn);
      K.put(cyl(u(r), u(0.6), u(r), 28).rotateX(Math.PI / 2), glass, dx * (out - u(0.3)), cy - u(1), dz * (out - u(0.3)), turn);
      for (let a = 0; a < 8; a++) { const q = a / 8 * TAU, px = Math.cos(q) * u(r + 1.6); K.put(ball(u(0.5), 6, 4), K.metal(L.tone(BRASS, 1.25)), dx * out + dz * px, cy - u(1) + Math.sin(q) * u(r + 1.6), dz * out - dx * px); }
    }
    K.put(ball(u(1.4), 10, 8).scale(0.7, 0.7, 0.4), K.gloss('#a8d8f8'), -u(2.5), cy + u(1.5), Math.sqrt(u(12) ** 2 - u(6) ** 2) + u(0.8));
    K.put(cyl(u(2), u(4), u(2.4), 14), dim, 0, cy + u(13), 0);
    K.put(cyl(u(1), u(4), u(1), 10).rotateZ(Math.PI / 2), dim, u(2), cy + u(14), 0);
    for (const [i, j, r] of [[24, 48, 1.5], [26, 56, 1.2], [23, 64, 1.6]]) K.put(L.torus(u(r), u(0.35), TAU, 14), K.gloss('#cfe8f4'), X(i), t + u(j - 6), 0.04);
  },

  jellylamp(K, s, W, D, L) {
    const { cyl, lathe, ball } = L, metal = K.metal(), pink = K.glow('#f8b0e0'), pale = K.glow('#ffe0f4');
    // a metal base and cap, a tall glass jar between, a jellyfish floating in it trailing its tentacles
    K.put(cyl(u(8), u(8), u(9), 28), metal, 0, u(4), 0);
    K.put(cyl(u(10), u(56), u(10), 32, true), K.glass(), 0, u(36), 0);
    K.put(cyl(u(10.4), u(3), u(10.4), 28), metal, 0, u(65.5), 0);
    K.put(cyl(u(4), u(1.5), u(5), 20), metal, 0, u(67.5), 0);
    const bell = [];
    for (let i = 0; i <= 10; i++) { const a = i / 10 * Math.PI / 2; bell.push([Math.cos(a) * u(8), u(42) + Math.sin(a) * u(10)]); }
    bell.unshift([u(6.5), u(41.5)]);
    K.put(lathe(bell, 32), pink, 0, 0, 0);
    K.put(ball(u(4), 16, 10).scale(1, 0.6, 1), pale, 0, u(45), 0);
    for (let n = 0; n < 7; n++) {
      const a = n / 7 * TAU, r = u(4.5), pts = [];
      for (let j = 0; j <= 20; j += 4) pts.push([Math.cos(a) * r + u(Math.sin(j / 3 + n)), u(42 - j), Math.sin(a) * r + u(Math.cos(j / 4 + n) * 0.8)]);
      K.put(tube(L, pts, u(0.45), 16), pink, 0, 0, 0);
    }
  },

  bubblecolumn(K, s, W, D, L) {
    const { cyl, ball } = L, metal = K.metal();
    // a metal base and cap, a column of blue water between them, bubbles rising through it, a light at its heart
    K.put(cyl(u(11), u(10), u(11.5), 32), metal, 0, u(5), 0);
    K.put(cyl(u(11), u(6), u(11), 32), metal, 0, u(89), 0);
    K.put(cyl(u(8), u(76), u(8), 32), K.M('glass', '#3a88c8'), 0, u(48), 0);
    K.put(cyl(u(2.4), u(76), u(2.4), 16), K.glow('#5aa8e0'), 0, u(48), 0);
    for (let n = 0; n < 16; n++) {
      const a = n * 2.4, q = u(4 + K.r() * 3);
      K.put(ball(u(1 + K.r() * 1.4), 10, 8), K.gloss('#a8e8ff'), Math.cos(a) * q, u(14 + n * 4.5), Math.sin(a) * q);
    }
  },

  pearlstand(K, s, W, D, L) {
    const { rbox, cyl, blob, ball } = L, gold = K.metal(GOLD);
    // a pale pedestal on a base in the accent, gold-trimmed, a plump cushion with tassels, the great pearl on it
    K.put(rbox(u(20), u(4), u(16), 0.01), K.gloss(K.pal.a), 0, u(2), 0);
    K.put(rbox(u(16), u(16), u(12), 0.015), K.gloss(K.pal.p), 0, u(12), 0);
    K.put(rbox(u(16.6), u(2), u(12.6), 0.005), gold, 0, u(19), 0);
    K.put(blob(u(22), u(8), u(18), 0.35, 0.5), K.cloth(K.pal.c), 0, u(24), 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      K.put(cyl(u(0.6), u(5), u(1), 8), gold, sx * u(10.5), u(20), sz * u(8.5));
      K.put(ball(u(0.9), 8, 6), gold, sx * u(10.5), u(22.6), sz * u(8.5));
    }
    K.put(ball(u(10), 32, 24), K.M('glow', '#f4ecf0'), 0, u(36), 0);
  },

  seaurchin(K, s, W, D, L) {
    const { THREE, ball, cyl } = L, t = seabed(K, L), body = K.gloss('#5a3a7a'), spine = K.gloss(L.tone('#5a3a7a', 1.3));
    // a round purple body half sunk in the sand, long spines bristling out of it
    K.put(ball(u(9), 24, 16).scale(1, 0.9, 1), body, 0, t + u(1), 0);
    const up = new THREE.Vector3(0, 1, 0), n = 60;
    for (let i = 0; i < n; i++) {
      const y = 1 - (i + 0.5) / n * 1.15, r = Math.sqrt(Math.max(0, 1 - y * y)), a = i * 2.4;
      const dir = new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r).normalize();
      const len = u(9 + (i % 3) * 2), g = cyl(0.001, len, u(0.55), 6).translate(0, len / 2, 0);
      g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up, dir));
      K.put(g, i % 2 ? body : spine, dir.x * u(8), t + u(1) + dir.y * u(7), dir.z * u(8));
    }
  },

  anemone(K, s, W, D, L) {
    const { cyl, ball, blob, torus } = L, t = seabed(K, L), c = K.pal.c, tip = K.gloss(L.tone(c, 1.35)), arm = K.gloss(c);
    // a squat column, a ring of waving tentacles on its top, a clownfish darting over them
    K.put(cyl(u(6.5), u(12), u(7.5), 24), K.gloss(L.tone(c, 0.75)), 0, t + u(6), 0);
    for (let ring = 0; ring < 2; ring++) for (let n = 0; n < 12; n++) {
      const a = (n + ring * 0.5) / 12 * TAU, r = u(ring ? 3 : 5.5), pts = [];
      for (let j = 0; j <= 16; j += 4) pts.push([Math.cos(a) * (r + u(j * 0.25)) + u(Math.sin(j / 3 + n) * 1.2), t + u(12 + j), Math.sin(a) * (r + u(j * 0.25))]);
      K.put(tube(L, pts, u(0.8), 12), arm, 0, 0, 0);
      const e = pts[pts.length - 1];
      K.put(ball(u(1.1), 8, 6), tip, e[0], e[1], e[2]);
    }
    const fy = t + u(34), fx = X(24), F = K.gloss('#f08030'), white = K.gloss('#ffffff');
    K.put(blob(u(10), u(6), u(4.5), 0.7, 0.7), F, fx, fy, 0.05);
    for (const dx of [-1, 3]) K.put(blob(u(1.6), u(6.2), u(4.7), 0.8, 0.8), white, fx + u(dx), fy, 0.05);
    const tail = new L.THREE.Shape([[0, 0], [-5, 3], [-5, -3]].map(([a, b]) => new L.THREE.Vector2(u(a), u(b))));
    K.put(new L.THREE.ExtrudeGeometry(tail, { depth: u(1), bevelEnabled: false }).translate(0, 0, -u(0.5)), F, fx - u(4), fy, 0.05);
    for (const sz of [-1, 1]) K.put(ball(u(0.7), 8, 6), K.gloss(INK), fx + u(3.2), fy + u(0.8), 0.05 + sz * u(2));
  },

  seahorse(K, s, W, D, L) {
    const { rbox, ball, cyl, torus } = L, c = K.pal.c, m = K.gloss(c), fin = K.gloss(L.tone(c, 1.2));
    // a stone plinth, the seahorse upright on it: a body of rings bowed in an S, its tail curled, its snout out to the right
    K.put(rbox(u(20), u(8), u(16), 0.015), K.plain(STONE), 0, u(4), 0);
    const pts = [];
    for (let j = 40; j >= 0; j -= 4) { const w = j < 6 ? 3 : j < 30 ? 5 : 3.2; pts.push([X(16) + u(Math.sin(j / 12) * 4), u(50 - j), 0, u(w)]); }
    beads(K, L, m, pts, 2);
    K.put(torus(u(4), u(1.6), Math.PI * 1.5, 20).rotateZ(Math.PI / 2), m, X(13), u(13), 0);
    K.put(ball(u(6), 20, 14), m, 0, u(56), 0);
    K.put(cyl(u(1.6), u(8), u(1.6), 12).rotateZ(Math.PI / 2), m, u(7), u(55), 0);
    K.put(cyl(u(1.9), u(1), u(1.9), 12).rotateZ(Math.PI / 2), m, u(11), u(55), 0);
    for (const sz of [-1, 1]) K.put(ball(u(1), 8, 6), K.gloss(INK), u(2), u(58), sz * u(5.3));
    K.put(L.cyl(0.001, u(7), u(2.2), 8), fin, -u(1.5), u(64), 0, 0, 0, 0.35);
    for (let j = 0; j < 7; j++) K.put(L.cyl(0.001, u(3), u(1.2), 6).rotateZ(Math.PI / 2 + 0.3), fin, X(10) + u(Math.sin((46 - j * 3) / 12) * 4), u(46 - j * 3), 0);
  },

  lanternfish(K, s, W, D, L) {
    const { THREE, cyl, ball, blob } = L, F = '#3a6ab8', body = K.gloss(F), metal = K.metal();
    // a metal foot and stem, the round fish on it facing right, its pale belly, fanged grin, and the glowing lure it dangles
    K.put(cyl(u(8), u(8), u(9), 24), metal, 0, u(4), 0);
    K.put(cyl(u(1), u(14), u(1), 10), metal, 0, u(15), 0);
    K.put(blob(u(24), u(20), u(16), 0.7, 0.75), body, 0, u(32), 0);
    K.put(blob(u(18), u(8), u(13), 0.7, 0.7), K.gloss('#f8e8a0'), u(1), u(26), u(1.5));
    const tail = new THREE.Shape([[0, 0], [-8, 8], [-6, 0], [-8, -8]].map(([a, b]) => new THREE.Vector2(u(a), u(b))));
    K.put(new THREE.ExtrudeGeometry(tail, { depth: u(1.2), bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 1 }).translate(0, 0, -u(0.6)), K.gloss(L.tone(F, 1.2)), -u(11), u(34), 0);
    for (const sz of [-1, 1]) {
      K.put(ball(u(3), 14, 10), K.gloss('#ffffff'), u(5), u(36), sz * u(6));
      K.put(ball(u(1.6), 10, 8), K.gloss(INK), u(6), u(36), sz * u(7.6));
    }
    for (let i = 0; i < 5; i++) K.put(cyl(0.001, u(2.2), u(0.8), 6).rotateX(Math.PI), K.gloss('#ffffff'), u(4 + i * 1.6), u(28), u(5.6) - i * u(0.6));
    K.put(tube(L, [[u(4), u(41), 0], [u(6), u(47), 0], [u(10), u(50), 0], [u(12), u(48), 0]], u(0.6), 16), K.gloss(L.tone(F, 1.2)), 0, 0, 0);
    K.put(ball(u(3), 16, 12), K.glow('#fff4a0'), u(12), u(46), 0);
  },

  sunkenarch(K, s, W, D, L) {
    const { THREE, cyl, torus } = L, stone = K.plain('#c8c4b8'), half = W / 2, d = u(14);
    // two banded columns and an arch of stone across them, weed hanging from it, barnacles here and there
    for (const sx of [-1, 1]) {
      const x = sx * (half - u(9));
      K.put(cyl(u(7), u(66), u(7.4), 28), stone, x, u(33), 0);
      for (let j = 6; j < 66; j += 12) K.put(torus(u(7.1), u(0.4), TAU, 28).rotateX(Math.PI / 2), K.plain(L.tone('#c8c4b8', 0.85)), x, u(j), 0);
    }
    const sh = new THREE.Shape(), inner = half - u(16), n = 24;
    sh.moveTo(-half, u(66));
    sh.lineTo(-half, u(80));
    for (let i = 0; i <= n; i++) { const f = i / n * 2 - 1; sh.lineTo(f * half, u(86) - f * f * u(6)); }
    sh.lineTo(half, u(66));
    sh.lineTo(inner, u(66));
    for (let i = 0; i <= n; i++) { const a = i / n * Math.PI; sh.lineTo(Math.cos(a) * inner, u(66) + Math.sin(a) * u(14)); }
    sh.lineTo(-half, u(66));
    K.put(new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2 }).translate(0, 0, -d / 2), stone, 0, 0, 0);
    K.put(L.rbox(u(6), u(10), d + 0.03, 0.01), K.plain(L.tone('#c8c4b8', 1.12)), 0, u(82), 0);
    for (let k = 0; k < 3; k++) {
      const x = X(10 + k * 20, W) * 0.8, top = u(66) + Math.sin(Math.acos(Math.min(1, Math.abs(x) / inner))) * u(14) - u(1), pts = [];
      for (let j = 0; j <= 28; j += 4) pts.push([x + u(Math.sin(j / 4 + k) * 2), top - u(j), u(4) * (k - 1)]);
      K.put(tube(L, pts, u(0.6), 20), K.gloss(KELP), 0, 0, 0);
    }
    const b = [];
    for (let k = 0; k < 6; k++) { const sx = k % 2 ? 1 : -1, a = 0.6 + K.r() * 1.8; b.push([sx * (half - u(9)) + Math.cos(a) * u(7.2), u(10 + K.r() * 50), Math.sin(a) * u(7.2), Math.cos(a), Math.sin(a)]); }
    barnacles(K, L, b);
  },

  /* ----- Desert ----- */

  obelisk(K, s, W, D, L) {
    const { rbox, cyl } = L, stone = K.plain(SANDST), sq = (w) => w * Math.SQRT2, slope = 0.035;
    // a plinth, a four-sided shaft narrowing to a gilded tip, glyphs cut down its face
    K.put(rbox(u(22), u(9), u(20), 0.015), K.plain(L.tone(SANDST, 0.85)), 0, u(4.5), 0);
    K.put(cyl(sq(u(7 - 72 * slope)), u(72), sq(u(7)), 4).rotateY(Math.PI / 4), stone, 0, u(45), 0);
    K.put(cyl(0.001, u(8), sq(u(7 - 72 * slope)), 4).rotateY(Math.PI / 4), K.metal(GOLD), 0, u(85), 0);
    for (let n = 0; n < 7; n++) {
      const y = 76 - n * 9, z = u(7 - (y - 9) * slope);
      K.put(rbox(u(3), u(3), 0.008, 0.002), K.gloss(n % 2 ? K.pal.c : LAPIS), -u(2.5), u(y - 1.5), z, 0, Math.atan(slope));
      K.put(rbox(u(3), u(2), 0.008, 0.002), K.gloss(n % 2 ? LAPIS : K.pal.c), u(2.5), u(y - 5), z - u(0.15), 0, Math.atan(slope));
      K.put(rbox(u(1), u(1), 0.01, 0.002), K.gloss(INK), -u(2.5), u(y - 5), z - u(0.15), 0, Math.atan(slope));
    }
  },

  sphinx(K, s, W, D, L) {
    const { rbox, blob, cyl, ball, torus } = L, stone = K.plain(SANDST), shade = K.plain(L.tone(SANDST, 0.85)), stripe = K.pic(bands(GOLD, LAPIS, 9));
    // a long plinth; the lion's body lying along it, its paws stretched out to the left, its tail curled up behind
    K.put(rbox(W - u(2), u(10), u(22), 0.015), shade, 0, u(5), 0);
    K.put(rbox(W - u(6), u(1), u(20), 0.004), stone, 0, u(9.5), 0);
    K.put(blob(u(40), u(22), u(16), 0.55, 0.6), stone, X(40, W), u(21), 0);
    K.put(blob(u(16), u(14), u(13), 0.6, 0.6), stone, X(51, W), u(17), 0);
    for (const sz of [-1, 1]) {
      K.put(rbox(u(24), u(7), u(5.5), 0.025), stone, X(15, W), u(13.5), sz * u(4));
      for (const i of [4, 8, 12]) K.put(cyl(u(0.3), u(4), u(0.3), 6), shade, X(i, W), u(15), sz * u(4) + u(2.8));
    }
    K.put(tube(L, [[X(58, W), u(14), -u(6)], [X(61, W), u(18), -u(7)], [X(61, W), u(25), -u(6)]], u(1), 14), stone, 0, 0, 0);
    K.put(ball(u(2), 10, 8), shade, X(61, W), u(27), -u(6));
    // the chest rising to the head, which looks out at you: its face, the striped nemes over it, the cobra on its brow, a beard
    K.put(blob(u(14), u(22), u(14), 0.6, 0.6), stone, X(19, W), u(24), 0);
    const hx = X(18, W);
    K.put(blob(u(16), u(12), u(13), 0.5, 0.6), stripe, hx, u(52), -u(1));
    for (const sx of [-1, 1]) K.put(rbox(u(5), u(20), u(5), 0.02), stripe, hx + sx * u(7.5), u(42), u(1), 0, 0, -sx * 0.12);
    K.put(rbox(u(10), u(15), u(9), 0.03), stone, hx, u(46.5), u(1));
    K.put(rbox(u(12), u(2), u(10), 0.006), K.metal(GOLD), hx, u(54.5), u(1));
    K.put(ball(u(1.5), 10, 8), K.gloss(K.pal.c), hx, u(56), u(6));
    for (const sx of [-1, 1]) {
      K.put(rbox(u(2), u(0.8), 0.006, 0.002), K.gloss(INK), hx + sx * u(2.2), u(49), u(5.6));
      K.put(rbox(u(2), u(0.6), 0.006, 0.002), K.gloss(LAPIS), hx + sx * u(2.2), u(50.2), u(5.6));
    }
    K.put(rbox(u(2), u(2.4), u(1.2), 0.004), shade, hx, u(46), u(5.8));
    K.put(cyl(u(1.6), u(6), u(1.8), 12), shade, hx, u(37), u(3.5));
  },

  sarcophagus(K, s, W, D, L) {
    const { THREE, rbox, blob, ball, cyl } = L, d = u(10), z = -u(2);
    // a stone foot, the gilded mummy case standing on it, its lid the king's likeness, which swings open (js/base-play.js's door)
    K.put(rbox(u(24), u(6), u(16), 0.015), K.plain(L.tone(SANDST, 0.85)), 0, u(3), 0);
    const shape = (k) => new THREE.Shape([[-9, 6], [9, 6], [10, 40], [10, 62], [11.5, 70], [11.5, 84], [8, 88], [-8, 88], [-11.5, 84], [-11.5, 70], [-10, 62], [-10, 40]]
      .map(([x, y]) => new THREE.Vector2(u(x * k), u(6 + (y - 6) * (k > 0.95 ? 1 : 0.985)))));
    const ext = (sh, depth) => new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2 }).translate(0, 0, -depth / 2);
    K.put(ext(shape(1), d), K.metal(L.tone(GOLD, 0.7)), 0, 0, z);
    K.put(ext(shape(0.9), 0.01), K.plain('#2a1a24'), 0, 0, z + d / 2 + 0.01);
    const front = z + d / 2 + 0.03, door = K.door([-u(11.5), front], 1), gold = K.metal(GOLD);
    door(ext(shape(0.98), u(1.6)), gold, 0, 0, front);
    const on = front + u(1.2);
    for (let n = 0; n < 6; n++) door(rbox(u(17 - n * 0.3), u(2), u(1), 0.004), K.gloss(n % 2 ? LAPIS : K.pal.c), 0, u(27 + n * 6), on);
    door(rbox(u(18), u(6), u(1.2), 0.006), K.gloss(LAPIS), 0, u(47), on);
    for (const [a, b] of [[[-u(8), u(56)], [u(8), u(46)]], [[u(8), u(56)], [-u(8), u(46)]]]) {
      const g = cyl(u(1), Math.hypot(b[0] - a[0], b[1] - a[1]), u(1), 8).rotateZ(Math.atan2(b[0] - a[0], -(b[1] - a[1])) + Math.PI);
      door(g, a[0] < 0 ? gold : K.metal(L.tone(GOLD, 1.15)), (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, on + u(1.2));
    }
    door(blob(u(22), u(20), u(3), 0.5, 0.6), K.pic(bands(GOLD, LAPIS, 7)), 0, u(77), on);
    door(blob(u(12), u(16), u(4), 0.6, 0.6), K.gloss(FACE), 0, u(76), on + u(1));
    door(rbox(u(12), u(3), u(3), 0.006), gold, 0, u(84.5), on + u(1.4));
    for (const sx of [-1, 1]) {
      door(rbox(u(3), u(0.8), 0.006, 0.002), K.gloss(INK), sx * u(2.5), u(78), on + u(3));
      door(rbox(u(3), u(0.7), 0.006, 0.002), K.gloss(LAPIS), sx * u(2.5), u(79.2), on + u(2.9));
    }
    door(cyl(u(1.8), u(6), u(2), 12), K.gloss(LAPIS), 0, u(65), on + u(1.6));
    K.inside = { x: 0, y: u(46), w: u(17), h: u(74), z: z + d / 2 + 0.022 };
  },

  canopicjars(K, s, W, D, L) {
    const { rbox, lathe, torus, ball, cyl, blob } = L, alab = K.gloss('#e8dcc0');
    // a wooden tray, four alabaster jars on it, each its god's head for a lid
    K.put(rbox(u(30), u(7), u(12), 0.015), K.wood(), 0, u(3.5), 0);
    const body = [[0.001, u(7)], [u(2.6), u(7)], [u(3.5), u(12)], [u(3.6), u(16)], [u(3.2), u(20)], [u(2.6), u(22)], [0.001, u(22)]];
    [[5, GOLD, 'man'], [12, '#a8784a', 'ape'], [19, INK, 'jackal'], [26, K.pal.c, 'falcon']].forEach(([i, c, kind]) => {
      const x = X(i), m = K.gloss(c);
      K.put(lathe(body, 20), alab, x, 0, 0);
      K.put(torus(u(3.6), u(0.4), TAU, 20).rotateX(Math.PI / 2), K.gloss(LAPIS), x, u(13), 0);
      K.put(torus(u(3.65), u(0.4), TAU, 20).rotateX(Math.PI / 2), K.gloss(K.pal.c), x, u(16), 0);
      K.put(cyl(u(3), u(1.6), u(3), 18), K.gloss('#d8ccb0'), x, u(22.8), 0);
      K.put(ball(u(3), 16, 12), m, x, u(26.5), 0);
      if (kind === 'man') { K.put(blob(u(7), u(6), u(6.4), 0.6, 0.6), K.gloss(LAPIS), x, u(27.5), -u(0.6)); K.put(ball(u(2.4), 12, 10), m, x, u(26), u(1)); }
      if (kind === 'ape') K.put(ball(u(1.6), 10, 8).scale(1.2, 0.9, 1), K.gloss(L.tone(c, 1.3)), x, u(25.5), u(2.4));
      if (kind === 'jackal') {
        for (const sx of [-1, 1]) K.put(cyl(0.001, u(5), u(1.2), 4), m, x + sx * u(1.6), u(31), 0);
        K.put(cyl(u(0.8), u(3), u(1.4), 8).rotateX(Math.PI / 2), m, x, u(25.8), u(3.2));
      }
      if (kind === 'falcon') K.put(cyl(0.001, u(2.2), u(1), 8).rotateX(Math.PI / 2 + 0.5), K.metal(GOLD), x, u(25.8), u(3.2));
      for (const sx of [-1, 1]) K.put(ball(u(0.5), 6, 4), K.gloss(kind === 'jackal' ? GOLD : INK), x + sx * u(1.2), u(27.2), u(2.7));
    });
  },

  papyrus(K, s, W, D, L) {
    const { THREE, cyl, ball } = L, top = potOf(K, L, 'square'), stem = K.gloss(L.tone(K.pal.leaf, 0.85));
    // tall stems out of a square pot, each topped with a starburst of fine rays
    const rays = [K.gloss(K.pal.leaf), K.gloss(L.tone(K.pal.leaf, 1.15))], up = new THREE.Vector3(0, 1, 0);
    [[8, 30, 0.06], [16, 0, -0.04], [24, 30, -0.06], [11, 14, -0.1], [21, 12, 0.1]].forEach(([i, drop, z], n) => {
      const tx = X(i), ty = u(80 - drop - n * 2), bx = (tx) * 0.3;
      K.put(tube(L, [[bx, top, z * 0.3], [(bx + tx) / 2, (top + ty) / 2, z * 0.7], [tx, ty, z]], u(0.6), 16), stem, 0, 0, 0);
      for (let r = 0; r < 16; r++) {
        const a = r * 2.4, e = 0.35 + (r % 4) * 0.18, dir = new THREE.Vector3(Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e));
        const g = cyl(u(0.2), u(7), u(0.35), 5).translate(0, u(3.5), 0);
        g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up, dir));
        K.put(g, rays[r % 2], tx, ty, z);
      }
      K.put(ball(u(1), 8, 6), K.gloss(L.tone(K.pal.leaf, 0.6)), tx, ty, z);
    });
  },

  datepalm(K, s, W, D, L) {
    const { cyl, ball } = L, top = potOf(K, L);
    // a ringed trunk swaying up out of the pot, a crown of arching fronds all round, bunches of dates under it
    const bark = [K.wood(K.pal.w), K.wood(L.tone(K.pal.w, 0.8))];
    for (let y = top, n = 0; y < u(70); y += u(4), n++) {
      const x = u(Math.sin(y * 32 / 11) * 1.5) + u(0.5);
      K.put(cyl(u(2.2), u(4.4), u(2.8), 12), bark[n % 2], x, y + u(2.2), 0);
    }
    const cx = u(Math.sin(70 / 11) * 1.5) + u(0.5), cy = u(72), greens = [K.gloss(K.pal.leaf), K.gloss(L.tone(K.pal.leaf, 1.15))];
    for (let n = 0; n < 11; n++) leaf(K, L, greens[n % 2], cx, cy, 0, n / 11 * TAU, 1.0 + (n % 3) * 0.15, u(17), u(3.2), 0.55);
    for (let n = 0; n < 4; n++) leaf(K, L, greens[1], cx, cy + u(1), 0, n * 1.6, 0.35, u(10), u(2.2), 0.2);
    for (const a of [0.5, 2.6, 4.4]) for (let d = 0; d < 7; d++) {
      K.put(ball(u(1.3), 8, 6).scale(1, 1.3, 1), K.gloss(d % 2 ? '#a85a20' : '#c87a30'), cx + Math.cos(a) * u(3) + u((d % 3) - 1), cy - u(4 + Math.floor(d / 3) * 2.2), Math.sin(a) * u(3) + u(((d * 7) % 3) - 1) * 0.6);
    }
  },

  scarablamp(K, s, W, D, L) {
    const { cyl, blob, ball, torus } = L, gold = K.metal(GOLD), shell = K.gloss(TURQ), ink = K.gloss(INK);
    // a gold foot, the scarab on it holding up the glowing sun, its legs gripping, its antennae reaching up
    K.put(cyl(u(7), u(6), u(8), 24), gold, 0, u(3), 0);
    K.put(blob(u(18), u(13), u(16), 0.85, 0.85), shell, 0, u(15), 0);
    K.put(L.rbox(u(0.8), u(12), u(15), 0.003), K.gloss(L.tone(TURQ, 0.6)), 0, u(16), 0);
    K.put(blob(u(10), u(5), u(7), 0.6, 0.6), K.gloss(L.tone(TURQ, 0.8)), 0, u(23), u(2));
    for (const sx of [-1, 1]) {
      for (let n = 0; n < 3; n++) rod(K, L, ink, [sx * u(7), u(12), u(-4 + n * 4)], [sx * u(12), u(7 - n * 2), u(-6 + n * 6)], u(0.6));
      rod(K, L, ink, [sx * u(2), u(25), u(3)], [sx * u(7), u(33), u(1)], u(0.5));
    }
    K.put(ball(u(10), 32, 24), K.glow('#ffe490'), 0, u(42), 0);
    K.put(torus(u(10.3), u(0.8), TAU, 40).rotateX(Math.PI / 2 - 0.3), gold, 0, u(42), 0);
  },

  bedouintent(K, s, W, D, L) {
    const { THREE, rbox, cyl, blob, lathe, ball } = L, d = u(28), back = -d / 2, front = d / 2, pole = K.wood();
    const stripes = K.pic(bands(K.pal.c, L.tone(K.pal.p, 0.85), Math.round(W * 32 / 6), true));
    // a dark back wall, poles, the striped roof sagging between them, a valance along its front, curtains tied back
    K.put(rbox(W - u(12), u(50), 0.02, 0.006), K.cloth(L.tone(K.pal.c, 0.55)), 0, u(25), back + 0.02);
    for (const x of [-W / 2 + u(2.5), 0, W / 2 - u(2.5)]) for (const z of [back + 0.03, front - 0.02]) K.put(cyl(u(1.5), u(62), u(1.5), 10), pole, x, u(31), z);
    const sag = (x) => { const f = ((x + W / 2) % (W / 2)) / (W / 2) * 2 - 1; return u(62) - u(6) * (1 - f * f); };
    const roof = new THREE.BoxGeometry(W, 0.012, d + 0.06, 48, 1, 1), rp = roof.attributes.position;
    for (let k = 0; k < rp.count; k++) rp.setY(k, rp.getY(k) + sag(rp.getX(k)) + 0.006);
    roof.computeVertexNormals();
    K.put(roof, stripes, 0, 0, 0);
    const val = new THREE.BoxGeometry(W, u(10), 0.012, 48, 1, 1), vp = val.attributes.position;
    for (let k = 0; k < vp.count; k++) vp.setY(k, vp.getY(k) + sag(vp.getX(k)) - u(5));
    val.computeVertexNormals();
    K.put(val, stripes, 0, 0, front + 0.03);
    for (let i = 0; i < Math.round(W * 8); i++) { const x = -W / 2 + (i + 0.5) / (W * 8); K.put(ball(u(0.8), 6, 4), K.gloss(K.pal.a), x, sag(x) - u(10.5), front + 0.035); }
    for (const sx of [-1, 1]) {
      const sh = new THREE.Shape([[0, 0], [12, 0], [3, -40], [0, -40]].map(([a, b]) => new THREE.Vector2(u(a), u(b))));
      const g = new THREE.ShapeGeometry(sh);
      if (sx > 0) g.scale(-1, 1, 1);
      K.put(new THREE.ExtrudeGeometry(sh, { depth: 0.01, bevelEnabled: false }).scale(sx < 0 ? 1 : -1, 1, 1), stripes, sx * (W / 2 - u(2)), u(52), front - 0.01);
    }
    // a rug inside, two cushions, a brass teapot, a lantern hanging from the roof
    K.put(rbox(W - u(28), u(1), d - u(6), 0.004), K.cloth(K.pal.a), 0, u(0.5), 0);
    K.put(blob(u(12), u(8), u(10), 0.4, 0.5), K.cloth(K.pal.c), -u(12), u(5), -u(3));
    K.put(blob(u(12), u(8), u(10), 0.4, 0.5), K.cloth(L.tone(K.pal.p, 0.85)), u(12), u(5), -u(3));
    K.put(lathe([[0.001, 0], [u(3), 0], [u(3.5), u(2)], [u(2.5), u(4.5)], [u(1), u(5.5)], [0.001, u(6.5)]], 18), K.metal(BRASS), 0, u(1), u(3));
    K.put(cyl(u(0.4), u(4), u(0.6), 6).rotateZ(-1), K.metal(BRASS), u(3.6), u(3.5), u(3));
    K.put(cyl(u(0.3), u(10), u(0.3), 6), K.metal(BRASS), u(4), u(49), 0);
    K.put(ball(u(3), 14, 10), K.glow('#ffd070'), u(4), u(41), 0);
  },

  waterjar(K, s, W, D, L) {
    const { lathe, torus, ball, cyl } = L, clay = K.gloss(CLAY), wood = K.wood();
    // a three-legged wooden stand, the round clay jar in it, its painted band, water at its mouth, a dipper leaning in it
    for (let n = 0; n < 3; n++) { const a = Math.PI / 2 + n * TAU / 3; rod(K, L, wood, [Math.cos(a) * u(13), 0.01, Math.sin(a) * u(13)], [Math.cos(a) * u(7), u(22), Math.sin(a) * u(7)], u(1)); }
    K.put(torus(u(7.5), u(1), TAU, 24).rotateX(Math.PI / 2), wood, 0, u(22), 0);
    const pts = [[0.001, u(18)]];
    for (let i = 0; i <= 16; i++) { const a = -Math.PI / 2 + i / 16 * Math.PI; pts.push([Math.max(u(5), Math.cos(a) * u(12)), u(32) + Math.sin(a) * u(14)]); }
    pts.push([u(5), u(50)], [u(6), u(51)], [u(4.6), u(51)], [u(4.4), u(48)], [0.001, u(48)]);
    K.put(lathe(pts, 32), clay, 0, 0, 0);
    K.put(torus(u(11.9), u(1), TAU, 36).rotateX(Math.PI / 2), K.gloss(K.pal.c), 0, u(33), 0);
    for (let n = 0; n < 12; n++) { const a = n / 12 * TAU; K.put(ball(u(0.6), 6, 4), K.gloss(K.pal.a), Math.cos(a) * u(11.4), u(37), Math.sin(a) * u(11.4)); }
    K.put(cyl(u(4.5), 0.004, u(4.5), 20), K.gloss('#3a6aa8'), 0, u(49.5), 0);
    rod(K, L, wood, [u(1), u(46), 0], [u(10), u(62), u(1)], u(0.8));
    K.put(lathe([[0.001, 0], [u(2), u(0.4)], [u(2.3), u(1.8)], [u(1.8), u(1.8)], [0.001, u(0.8)]], 14), wood, u(10.4), u(62.5), u(1));
  },

  featherfan(K, s, W, D, L) {
    const { cyl, ball, torus } = L, gold = K.metal(GOLD);
    // a gold foot and pole ringed in lapis, a fan of long feathers spread at its top
    K.put(cyl(u(6), u(5), u(7), 20), gold, 0, u(2.5), 0);
    K.put(cyl(u(1.5), u(56), u(1.5), 12), gold, 0, u(32), 0);
    for (let j = 6; j < 54; j += 8) K.put(torus(u(1.6), u(0.6), TAU, 12).rotateX(Math.PI / 2), K.gloss(LAPIS), 0, u(j + 1), 0);
    for (let n = 0; n < 7; n++) {
      const a = -0.65 + n / 6 * 1.3, c = n % 2 ? K.pal.c : K.pal.p, len = u(24);
      const g = ball(1, 16, 10).scale(u(4.2), len / 2, u(0.6)).translate(0, len / 2 + u(3), 0);
      const pos = g.attributes.position;
      for (let k = 0; k < pos.count; k++) { const t = pos.getY(k) / (len + u(6)); pos.setX(k, pos.getX(k) * (0.35 + t)); }
      g.computeVertexNormals();
      K.put(g.rotateZ(-a), K.gloss(c), 0, u(60), -u(0.5) + Math.abs(a) * 0.01);
      K.put(cyl(u(0.3), len, u(0.3), 5).translate(0, len / 2 + u(1), 0).rotateZ(-a), K.gloss(L.tone(c, 0.7)), 0, u(60), u(0.3));
    }
    K.put(ball(u(3), 14, 10), gold, 0, u(60), u(0.6));
  },

  cobrastatue(K, s, W, D, L) {
    const { rbox, torus, blob, ball, cyl } = L, gold = K.metal(GOLD), body = K.pic(bands(GOLD, L.tone(GOLD, 0.8), 12));
    // a plinth, the snake's coils on it, its body rising in an S to the spread hood, lapis down its front, ruby eyes
    K.put(rbox(u(24), u(10), u(20), 0.015), K.plain(L.tone(SANDST, 0.85)), 0, u(5), 0);
    K.put(rbox(u(22), u(1), u(18), 0.004), K.plain(SANDST), 0, u(9.5), 0);
    for (const [r, y] of [[8, 12], [5.5, 14.5], [3, 16.5]]) K.put(torus(u(r), u(2.2), TAU, 32).rotateX(Math.PI / 2), gold, 0, u(y), 0);
    const pts = [];
    for (let j = 0; j <= 30; j += 5) pts.push([u(Math.sin(j / 7) * 3), u(18 + j), u(1.5) * Math.cos(j / 9)]);
    K.put(tube(L, pts, u(2.8), 24), body, 0, 0, 0);
    K.put(blob(u(22), u(22), u(4), 0.65, 0.65), gold, 0, u(55), -u(0.5));
    K.put(blob(u(11), u(19), u(1.5), 0.65, 0.65), K.gloss(LAPIS), 0, u(54), u(1.6));
    for (const y of [48, 54, 60]) K.put(rbox(u(9), u(1), u(0.5), 0.002), K.gloss(K.pal.c), 0, u(y), u(2.2));
    K.put(blob(u(10), u(7), u(9), 0.6, 0.6), gold, 0, u(68.5), u(1.5));
    for (const sx of [-1, 1]) K.put(ball(u(0.9), 8, 6), K.gloss('#e04848'), sx * u(2.2), u(69.5), u(5.4));
    K.put(cyl(u(0.3), u(3), u(0.3), 5).rotateX(Math.PI / 2 + 0.4), K.gloss('#e04848'), 0, u(66.5), u(6.2));
  },

  lotuscolumn(K, s, W, D, L) {
    const { rbox, cyl, lathe, torus } = L, stone = K.plain(SANDST);
    // a plinth, a fluted shaft painted in bands, a square abacus, and the closed lotus bud for a capital, petals in green and lapis
    K.put(rbox(u(26), u(6), u(22), 0.015), K.plain(L.tone(SANDST, 0.85)), 0, u(3), 0);
    const g = cyl(u(9), u(66), u(9), 48, true).translate(0, u(39), 0), pos = g.attributes.position;
    for (let k = 0; k < pos.count; k++) { const a = Math.atan2(pos.getZ(k), pos.getX(k)), f = 1 - 0.05 * Math.max(0, Math.cos(a * 10)); pos.setX(k, pos.getX(k) * f); pos.setZ(k, pos.getZ(k) * f); }
    g.computeVertexNormals();
    K.put(g, stone, 0, 0, 0);
    for (let j = 66; j > 8; j -= 12) {
      K.put(torus(u(9), u(1), TAU, 40).rotateX(Math.PI / 2), K.gloss(K.pal.c), 0, u(j - 1), 0);
      K.put(torus(u(9), u(0.5), TAU, 40).rotateX(Math.PI / 2), K.gloss(LAPIS), 0, u(j - 3.5), 0);
    }
    K.put(rbox(u(22), u(3), u(22), 0.008), stone, 0, u(71.5), 0);
    const bud = [[0.001, u(73)]];
    for (let j = 17; j >= 0; j--) bud.push([u(9 + Math.sin(j / 17 * Math.PI) * 4 - (j < 4 ? 4 - j : 0) - (j > 15 ? (j - 15) * 2 : 0)), u(90 - j)]);
    bud.push([0.001, u(90)]);
    K.put(lathe(bud, 32), K.pic(bands(K.pal.leaf, LAPIS, 16, true)), 0, 0, 0);
  },

  goldurn(K, s, W, D, L) {
    const { lathe, torus, cyl, ball } = L, gold = K.metal(GOLD);
    // coins spilled round its foot, the gold urn, a lapis band studded in the theme's colour, ring handles, coins heaped in its mouth and a gem
    for (let n = 0; n < 14; n++) K.put(cyl(u(2.4), u(0.6), u(2.4), 14), K.metal(n % 3 ? GOLD : L.tone(GOLD, 0.8)), X(4 + K.r() * 24), u(0.3 + (n % 3) * 0.6), u(-4 + K.r() * 12), 0, K.r() * 0.3, K.r() * 0.3);
    const pts = [[0.001, u(6)], [u(5), u(6)]];
    for (let i = 0; i <= 14; i++) { const a = -Math.PI / 2 + 0.3 + i / 14 * (Math.PI - 0.6); pts.push([Math.cos(a) * u(11), u(20) + Math.sin(a) * u(13)]); }
    pts.push([u(5), u(32)], [u(5), u(40)], [u(7), u(41)], [u(6.2), u(41)], [u(4.4), u(39)], [0.001, u(39)]);
    K.put(lathe(pts, 32), gold, 0, 0, 0);
    K.put(cyl(u(5), u(6), u(6), 20), gold, 0, u(3), 0);
    K.put(torus(u(11.1), u(1.4), TAU, 36).rotateX(Math.PI / 2), K.gloss(LAPIS), 0, u(21), 0);
    for (let n = 0; n < 10; n++) { const a = n / 10 * TAU; K.put(ball(u(0.7), 8, 6), K.gloss(K.pal.c), Math.cos(a) * u(12.2), u(21), Math.sin(a) * u(12.2)); }
    for (const sx of [-1, 1]) K.put(torus(u(3), u(0.8), TAU, 18), K.metal(L.tone(GOLD, 0.85)), sx * u(11), u(30), 0);
    for (let n = 0; n < 8; n++) K.put(cyl(u(1.5), u(0.5), u(1.5), 12), gold, u(-3 + (n % 3) * 3), u(39.5 + Math.floor(n / 3) * 1.1), u(-2 + ((n * 5) % 4) * 1.3), 0, (n % 3 - 1) * 0.3, (n % 2) * 0.3);
    K.put(ball(u(2), 6, 4), K.gloss(K.pal.c), u(4), u(42), u(1));
  },
};
