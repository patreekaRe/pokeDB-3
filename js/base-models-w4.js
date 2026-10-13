/* base-models-w4.js  -  wall pieces, batch 4: windows, mirrors and doors (the moonlit, frosted, stained glass, space,
   carriage and sky arch windows, the porthole, arrow slit and greenhouse glass, the vanity, haunted and shell mirrors,
   the medicine cabinet, portcullis, barn doors, airlock door and the tile and bamboo panels). Same frame and helpers as
   js/base-models-w.js (its head says how a wall piece is built), js/base-models-w2.js and js/base-models-w3.js.

   A window's view stays a crop of its painting, so it still shows the hour's sky; what was painted round it is built:
   frames, bars, lead came, sills with what stands on them. Masonry is laid block by block round its openings
   (`masonry()`), so an arrow slit or a portcullis is a real hole in real stone. */

import { X, Y, u, cut, bar, pic, ring, round, archShape, boxUV, sash } from './base-models-w.js';
import { drape, rod, cord } from './base-models-w2.js';
import { keep, glass, bezel } from './base-models-w3.js';

const STONE = '#9a9aa6', BRASS = '#d8a838', GOLD = '#f0c040', MARBLE = '#ece8e0', BAMBOO = '#a8c060';

/** An arched frame: the outer arch [x0, x1, spring, foot] less the inner one, the inner holding the painting's view. */
function archPane(K, L, m, cx, [ox0, ox1, os, of], [ix0, ix1, is, foot], d = 0.06) {
  const { THREE } = L, W = K.p.w;
  const outer = archShape(L, cx, ox0, ox1, os, of, W);
  outer.holes.push(archShape(L, cx, ix0, ix1, is, foot, W));
  K.put(new THREE.ExtrudeGeometry(outer, { depth: d, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2, curveSegments: 32 }), m, 0, 0, 0.01);
  const box = [ix0, is - (ix1 - ix0) / 2, ix1, foot];
  const pane = () => { const g = new THREE.ShapeGeometry(archShape(L, cx, ix0, ix1, is, foot, W), 32); boxUV(g, box, W); return g; };
  K.put(pane(), K.plain('#1a2030'), 0, 0, 0.005);
  K.put(pane(), K.pic(cut(K, L, box)), 0, 0, 0.03);
  K.put(pane(), K.glass(), 0, 0, d + 0.015);
}

/** A silvered pane: pale, bright, a streak or two of light across it. */
function silver(L, tint = '#cfe6f2') {
  const m = new L.THREE.MeshStandardMaterial({ color: tint, roughness: 0.08, metalness: 0.75, emissive: '#5a7488', emissiveIntensity: 0.35 });
  m.userData.kind = 'plain';
  return m;
}
function streaks(K, L, cx, cy, z, s = 1) {
  for (const [dx, dy, len, wd] of [[-2.5, -5, 11, 1.2], [1, -4, 6, 0.8]]) {
    const g = new L.THREE.PlaneGeometry(u(wd * s), u(len * s)); g.rotateZ(-0.35);
    K.put(g, K.plain('#ffffff'), X(cx + dx * s, K.p.w), Y(cy + dy * s), z);
  }
}

/** Painted boxes [x0, y0, x1, y1] less `hole`: what's left of a block once a slit is cut through it. */
function less(box, hole) {
  const [x0, y0, x1, y1] = box, [hx0, hy0, hx1, hy1] = hole;
  if (hx1 <= x0 || hx0 >= x1 || hy1 <= y0 || hy0 >= y1) return [box];
  const out = [];
  if (hy0 > y0) out.push([x0, y0, x1, hy0]);
  if (hy1 < y1) out.push([x0, hy1, x1, y1]);
  const my0 = Math.max(y0, hy0), my1 = Math.min(y1, hy1);
  if (hx0 > x0) out.push([x0, my0, hx0, my1]);
  if (hx1 < x1) out.push([hx1, my0, x1, my1]);
  return out;
}

/** Stone blocks over `blocks`, each a touch apart on a mortar bed, cut round `holes`, their faces at slightly
    different depths so the wall reads as laid by hand. */
function masonry(K, L, blocks, holes, d = 0.07, clip = null) {
  const tones = [0.86, 0.96, 1.06].map(f => K.plain(L.tone(STONE, f)));
  for (let [x0, y0, x1, y1] of blocks) {
    if (clip) { x0 = Math.max(x0, clip[0]); x1 = Math.min(x1, clip[2]); }
    if (x1 - x0 < 0.5) continue;
    let parts = [[x0, y0, x1, y1]];
    for (const h of holes) parts = parts.flatMap(b => less(b, h));
    const m = tones[Math.floor(K.r() * 3)], dd = d + K.r() * 0.03;
    for (const [a, b, c, e] of parts) if (c - a > 0.4 && e - b > 0.4) bar(K, L, m, [a + 0.25, b + 0.25, c - 0.25, e - 0.25], dd, 0, 0.01);
  }
}

/** A brass candle stick on a sill at painted (i, j), lit. */
function candle(K, L, i, j, z) {
  const W = K.p.w;
  K.put(L.cyl(u(2.6), u(0.8), u(2.8), 18), K.metal(BRASS), X(i, W), Y(j - 0.4), z);
  K.put(L.cyl(u(1.4), u(7), u(1.4), 14), K.plain('#f4f0e4'), X(i, W), Y(j - 4.3), z);
  K.put(L.ball(u(1), 10, 8).scale(1, 1.8, 1), K.glow('#ffd890'), X(i, W), Y(j - 9.6), z);
}

/** An icicle hanging from painted (i, j), `n` units long. */
function icicle(K, L, i, j, n, z) {
  K.put(L.cyl(u(0.9), u(n), u(0.05), 8), K.gloss('#e4f6ff'), X(i, K.p.w), Y(j + n / 2), z);
}

export const SHAPES = {
  moonwindow: { make: 'moonarch' },
  skywindow: { make: 'skyarch' },
  frostwindow: { make: 'frostsash' },
  stainedglass: { make: 'leadedglass' },
  spacewindow: { make: 'viewport' },
  trainwindow: { make: 'carriagewindow' },
  porthole: { make: 'brassporthole' },
  arrowslit: { make: 'arrowslit' },
  glasspanel: { make: 'greenhouse' },
  bathmirror: { make: 'vanitymirror' },
  hauntmirror: { make: 'ghostmirror' },
  shellmirror: { make: 'shellmirror' },
  medcabinet: { make: 'medcabinet' },
  portcullis: { make: 'portcullis' },
  barndoor: { make: 'barndoors' },
  airlock: { make: 'airlock' },
  tilewall: { make: 'tilepanel' },
  bamboowall: { make: 'bamboopanel' },
};

export const MAKES = {
  moonarch(K, s, W, D, L) {
    const wood = K.wood();
    archPane(K, L, wood, 32, [11, 53, 30, 71], [15, 49, 30, 68]);
    bar(K, L, wood, [31, 13, 33, 68], 0.05, 0.02, 0.008);
    bar(K, L, wood, [15, 44, 49, 46], 0.05, 0.02, 0.008);
    bar(K, L, K.wood(L.tone(K.pal.w, 1.1)), [8, 70, 56, 74], 0.17, 0, 0.015);
    candle(K, L, 47, 70, 0.1);
  },

  skyarch(K, s, W, D, L) {
    const marble = K.gloss(MARBLE);
    archPane(K, L, K.metal(GOLD), 32, [6, 58, 30, 78], [10, 54, 30, 78], 0.07);
    bar(K, L, marble, [31, 8, 33, 78], 0.05, 0.02, 0.008);
    bar(K, L, marble, [10, 46, 54, 48], 0.05, 0.02, 0.008);
    K.put(L.ball(u(3), 14, 10), K.metal(GOLD), X(32, W), Y(4), 0.06);
    // the cloud it floats on, puffs along its foot
    const cloud = K.plain('#ffffff');
    for (let n = -5; n <= 5; n++) {
      const r = 4.5 - Math.abs(n) * 0.25 + K.r();
      K.put(L.ball(u(r), 16, 12).scale(1, 0.85, 0.7), cloud, X(32 + n * 4.6, W), Y(84 + K.r() * 1.5), 0.08 + K.r() * 0.03);
    }
  },

  frostsash(K, s, W, D, L) {
    sash(K, L, { outer: [7, 13, 57, 65], glass: [10, 16, 54, 64], bars: [[31, 16, 33, 64], [10, 39, 54, 41]], sill: [5, 64, 59, 68] });
    // frost on the glass, the painting's white specks a layer in front of the view
    const frost = K.pic(keep(cut(K, L, [10, 16, 54, 64]), (r, g, b) => r > 230 && g > 238 && b > 245));
    frost.alphaTest = 0.5;
    K.put(new L.THREE.PlaneGeometry(u(44), u(48)), frost, X(32, W), Y(40), 0.074);
    // snow drifted on the sill and icicles under it
    const snow = K.plain('#ffffff');
    K.put(L.ball(u(10), 22, 12).scale(1, 0.3, 0.55), snow, X(24, W), Y(64.2), 0.1);
    K.put(L.ball(u(8), 22, 12).scale(1, 0.38, 0.55), snow, X(45, W), Y(64.2), 0.1);
    for (const [i, n] of [[9, 4], [14, 2.5], [21, 5], [34, 3], [40, 4.5], [52, 3.5], [56, 2]]) icicle(K, L, i, 68, n, 0.15);
  },

  leadedglass(K, s, W, D, L) {
    archPane(K, L, K.plain(STONE), 16, [5, 27, 23, 72], [7, 25, 23, 70], 0.06);
    // the lead came over the coloured panes, following the arch
    const lead = K.gloss('#303038'), top = (x) => 23 - Math.sqrt(Math.max(0, 81 - (x - 16) ** 2));
    for (const x of [12, 18]) bar(K, L, lead, [x - 0.4, top(x), x + 0.4, 70], 0.008, 0.03, 0.002);
    for (let y = 21; y < 69; y += 8) {
      const half = y < 23 ? Math.sqrt(81 - (23 - y) ** 2) : 9;
      bar(K, L, lead, [16 - half, y - 0.4, 16 + half, y + 0.4], 0.008, 0.03, 0.002);
    }
    const wave = [];
    for (let y = 15; y <= 70; y += 2) wave.push([16 + Math.sin((y - 12) / 4) * 3, y, 0.034]);
    cord(K, L, lead, wave, 0.4);
    bar(K, L, K.plain(L.tone(STONE, 1.08)), [3, 72, 29, 75.5], 0.13, 0, 0.012);
  },

  viewport(K, s, W, D, L) {
    const metal = K.metal(K.pal.m), outer = [3, 10, 61, 66], inner = [8, 15, 56, 61];
    bar(K, L, K.plain('#0a0e1c'), inner, 0.01);
    pic(K, L, inner, 0.03);
    bezel(K, L, metal, outer, inner, 0.1, 0.012);
    bezel(K, L, K.metal(L.tone(K.pal.m, 0.7)), [7, 14, 57, 62], inner, 0.11, 0.004);
    bar(K, L, metal, [31, 15, 33, 61], 0.06, 0.03, 0.008);
    bar(K, L, metal, [6, 58, 58, 61], 0.08, 0.04, 0.01);
    glass(K, L, inner, 0.09);
    for (let i = 6; i <= 58; i += 6.5) for (const j of [12.5, 63.5]) K.put(L.ball(u(0.9), 10, 6).scale(1, 1, 0.5), K.metal(L.tone(K.pal.m, 1.3)), X(i, W), Y(j), 0.1);
    // a lit strip under the top of the frame
    bar(K, L, K.glow('#a8c8ff'), [10, 15, 54, 16], 0.008, 0.1, 0.002);
  },

  carriagewindow(K, s, W, D, L) {
    const view = [8, 18, 56, 58];
    bar(K, L, K.plain('#1a2030'), view, 0.01);
    pic(K, L, view, 0.03);
    bezel(K, L, K.gloss(K.pal.c), [2, 12, 62, 72], view, 0.06, 0.012);
    bar(K, L, K.metal(K.pal.m), [8, 36, 56, 38], 0.04, 0.02, 0.006);
    glass(K, L, view, 0.05);
    // the brass rail and the curtains gathered either side of the glass, cut to their painted edge
    rod(K, L, K.metal(BRASS), 4, 60, 15, 1, 0.1, K.metal(BRASS));
    const width = (y) => 8 - Math.round(Math.sin((y - 16) / 43 * Math.PI) * 3);
    const folds = (fx) => 0.08 + (1 - Math.cos(fx * Math.PI * 4)) * 0.006;
    drape(K, L, [8, 16, 16, 60], folds, 0, [16, 20], (i, j) => i < 8 + width(j));
    drape(K, L, [48, 16, 56, 60], folds, 0, [16, 20], (i, j) => i >= 56 - width(j));
    // the sill with a cup of tea on it
    bar(K, L, K.wood(), [4, 60, 60, 65], 0.16, 0, 0.012);
    const cup = K.gloss('#f4f4f0');
    K.put(L.cyl(u(2.6), u(5.5), u(2.1), 18), cup, X(42.5, W), Y(57.25), 0.1);
    K.put(L.torus(u(1.4), u(0.45), Math.PI * 2, 16), cup, X(45.3, W), Y(57.2), 0.1);
    K.put(L.cyl(u(4), u(0.5), u(4), 20), cup, X(42.5, W), Y(59.75), 0.1);
    K.put(L.cyl(u(2.3), u(0.2), u(2.3), 18), K.plain('#a86838'), X(42.5, W), Y(55), 0.1);
  },

  brassporthole(K, s, W, D, L) {
    const brass = K.metal(BRASS);
    round(K, L, K.plain('#1a2030'), 16, 34, 12, 0.006);
    round(K, L, K.pic(cut(K, L, [4.4, 22.4, 27.6, 45.6])), 16, 34, 11.6, 0.012);
    ring(K, L, brass, 16, 34, 15, 11.3, 0.07);
    ring(K, L, K.metal(L.tone(BRASS, 0.75)), 16, 34, 11.9, 10.6, 0.09);
    round(K, L, K.glass(), 16, 34, 10.8, 0.06);
    for (let a = 0; a < 8; a++) {
      const t = (a + 0.5) / 8 * Math.PI * 2;
      K.put(L.ball(u(1.1), 10, 8).scale(1, 1, 0.6), K.metal(L.tone(BRASS, 1.2)), X(16 + Math.cos(t) * 13.2, W), Y(34 + Math.sin(t) * 13.2), 0.072);
    }
    // the hinge on the left and the dog that clamps it shut on the right
    K.put(L.cyl(u(1.4), u(6), u(1.4), 12), brass, X(1.5, W), Y(34), 0.05);
    K.put(L.rbox(u(4), u(2.4), 0.03, 0.006), brass, X(30, W), Y(34), 0.09);
    K.put(L.ball(u(1.6), 12, 8), brass, X(31.5, W), Y(34), 0.1);
  },

  arrowslit(K, s, W, D, L) {
    const slit = [[14, 22, 19, 62], [9, 38, 24, 43]], blocks = [];
    for (let j = 0; j < 7; j++) for (let i = -1; i < 3; i++) { const x = 2 + i * 10 + (j % 2) * 5; blocks.push([x, 12 + j * 9, x + 10, 21 + j * 9]); }
    for (const [x0, y0, x1, y1] of [[0, 12, 32, 75]]) {
      const mortar = K.plain(L.tone(STONE, 0.62));
      for (const b of slit.reduce((parts, h) => parts.flatMap(p => less(p, h)), [[x0, y0, x1, y1]])) bar(K, L, mortar, b, 0.03, 0, 0.002);
    }
    masonry(K, L, blocks, slit, 0.08, [0, 12, 32, 75]);
    for (const box of slit) pic(K, L, box, 0.004);
  },

  greenhouse(K, s, W, D, L) {
    const frame = K.gloss('#f0f2ee'), view = [2, 4, 62, 92];
    bar(K, L, K.plain('#1a2030'), view, 0.01);
    pic(K, L, view, 0.02);
    for (const i of [0, 21, 42, 60]) bar(K, L, frame, [i, 2, i + 4, 94], 0.07, 0, 0.008);
    for (const j of [2, 33, 64, 90]) bar(K, L, frame, [0, j, 64, j + 3], 0.06, 0, 0.008);
    glass(K, L, view, 0.05);
    // a vine trained along the lower bar of the top panes, its leaves hanging off it
    const vine = [];
    for (let i = 3; i <= 61; i += 3) vine.push([i, 36.5 + Math.sin(i / 5) * 1.6, 0.075]);
    cord(K, L, K.plain(L.tone(K.pal.leaf, 0.6)), vine, 0.4);
    for (let i = 4; i < 60; i += 3) {
      const j = 35 + Math.sin(i / 5) * 2 + 4;
      K.put(L.ball(u(1.4), 10, 8).scale(0.75, 1.35, 0.45), K.gloss(i % 2 ? K.pal.leaf : L.tone(K.pal.leaf, 1.15)), X(i, W), Y(j), 0.08, 0, 0, (i % 2 ? 1 : -1) * 0.35);
    }
    K.put(L.rbox(u(1.5), u(4), 0.02, 0.004), K.metal('#a8acb4'), X(40, W), Y(48), 0.07);
  },

  vanitymirror(K, s, W, D, L) {
    const gold = K.metal(K.pal.a), inner = [8, 17, 24, 53];
    bar(K, L, K.plain('#2a3038'), inner, 0.02);
    K.put(new L.THREE.PlaneGeometry(u(16), u(36)), silver(L), X(16, W), Y(35), 0.03);
    streaks(K, L, 16, 35, 0.032, 1.4);
    bezel(K, L, gold, [5, 14, 27, 56], inner, 0.06, 0.01);
    // the dressing-room bulbs down each side
    for (const j of [18, 28, 38, 48]) for (const i of [5, 27]) {
      K.put(L.cyl(u(1.4), 0.03, u(1.4), 12).rotateX(Math.PI / 2), K.metal('#c8ccd4'), X(i, W), Y(j), 0.07);
      K.put(L.ball(u(2), 14, 10), K.glow('#fff4c0'), X(i, W), Y(j), 0.1);
    }
    // the glass shelf under it, a pump bottle, a pot of cream and a bar of soap
    bar(K, L, K.wood(), [3, 58, 29, 61], 0.15, 0, 0.01);
    K.put(L.cyl(u(1.6), u(6.5), u(1.6), 14), K.gloss(K.pal.c), X(8.5, W), Y(54.75), 0.08);
    K.put(L.cyl(u(0.5), u(2), u(0.5), 8), K.gloss('#f4f4f0'), X(8.5, W), Y(50.5), 0.08);
    K.put(L.rbox(u(2.2), u(0.8), u(0.8), 0.002), K.gloss('#f4f4f0'), X(9.3, W), Y(49.6), 0.08);
    K.put(L.cyl(u(2.2), u(4.5), u(2.2), 18), K.gloss('#f890b8'), X(24, W), Y(55.75), 0.08);
    K.put(L.cyl(u(2.4), u(1.2), u(2.4), 18), K.gloss('#f4f4f0'), X(24, W), Y(53), 0.08);
    K.put(L.rbox(u(6), u(2.8), u(3.4), 0.01), K.gloss('#ffffff'), X(16, W), Y(56.6), 0.08);
  },

  ghostmirror(K, s, W, D, L) {
    const gold = K.metal(K.pal.a), sy = 1.9;
    round(K, L, silver(L, '#a8b8c8'), 16, 40, 8.6, 0.03, sy);
    ring(K, L, gold, 16, 40, 12, 8.3, 0.07, sy);
    ring(K, L, K.metal(L.tone(K.pal.a, 0.7)), 16, 40, 9.2, 8.1, 0.08, sy);
    // the face looking out of the glass, half out of it, and the wisps trailing under it
    const ghost = K.glow('#eef0ff'), ink = K.plain('#303048');
    K.put(L.ball(u(5), 22, 16).scale(1, 1.55, 0.5), ghost, X(16, W), Y(42), 0.035);
    for (const i of [14, 19]) K.put(L.ball(u(1.1), 10, 8).scale(1, 1.5, 0.4), ink, X(i, W), Y(41.5), 0.035 + u(2.3));
    K.put(L.ball(u(1.4), 10, 8).scale(1.4, 0.7, 0.4), ink, X(16, W), Y(46.5), 0.035 + u(2));
    for (let n = 0; n < 5; n++) K.put(L.ball(u(0.9 - n * 0.08), 8, 6), ghost, X(12.5 + n * 2, W), Y(51 + (n % 2)), 0.05);
    // the crest on top, a point and a bead
    K.put(L.cyl(u(0.2), u(6), u(3.6), 4).scale(1, 1, 0.45), gold, X(16, W), Y(15.5), 0.04, Math.PI / 4);
    K.put(L.ball(u(1.2), 12, 8), gold, X(16, W), Y(12.2), 0.04);
  },

  shellmirror(K, s, W, D, L) {
    const sy = 1.7;
    round(K, L, silver(L), 16, 36, 8.6, 0.03, sy);
    streaks(K, L, 16, 36, 0.032);
    ring(K, L, K.gloss(K.pal.p), 16, 36, 11.5, 8.3, 0.05, 18 / 11.5);
    // shells round the rim, then the big scallop crowning it
    for (let a = 0; a < 14; a++) {
      const t = a / 14 * Math.PI * 2, x = X(16 + Math.cos(t) * 11, W), y = Y(36 + Math.sin(t) * 18), c = a % 2 ? K.pal.c : '#f4e0d8';
      K.put(L.ball(u(2.6), 14, 10).scale(1, 1, 0.5), K.gloss(c), x, y, 0.07);
      K.put(L.ball(u(0.9), 8, 6).scale(1, 1, 0.5), K.gloss(L.tone(c, 0.8)), x, y, 0.07 + u(1.2));
    }
    for (let n = -3; n <= 3; n++) {
      const g = L.rbox(u(2.4), u(8), u(1.6), 0.006);
      g.translate(0, u(4), 0); g.rotateZ(n * 0.24);
      K.put(g, K.gloss(n % 2 ? K.pal.c : L.tone(K.pal.c, 1.12)), X(16, W), Y(19.5), 0.05);
    }
    K.put(L.ball(u(1.6), 12, 8).scale(1.3, 1, 0.8), K.gloss(L.tone(K.pal.c, 0.8)), X(16, W), Y(19.5), 0.055);
  },

  medcabinet(K, s, W, D, L) {
    const wood = K.wood(), d = 0.14;
    // the open shelves on the left, the mirrored door on the right
    bar(K, L, K.wood(L.tone(K.pal.w, 0.55)), [6, 20, 22, 52], 0.015);
    for (const box of [[4, 18, 6, 54], [4, 18, 22, 20], [4, 52, 22, 54]]) bar(K, L, wood, box, d, 0, 0.006);
    for (const j of [30, 41]) bar(K, L, K.wood(L.tone(K.pal.w, 1.1)), [6, j, 22, j + 1], d - 0.01, 0, 0.003);
    const z = 0.065;
    [['#e04848', 9], ['#f4f4f0', 14], ['#4a78d8', 19]].forEach(([c, i]) => {
      K.put(L.cyl(u(1.9), u(6.5), u(1.9), 14), K.gloss(c), X(i, W), Y(26.75), z);
      K.put(L.cyl(u(1.1), u(1.2), u(1.1), 12), K.metal(K.pal.m), X(i, W), Y(22.9), z);
    });
    K.put(L.rbox(u(6), u(6), u(5), 0.008), K.gloss('#f4f4f0'), X(11, W), Y(38), z);
    K.put(L.rbox(u(1.6), u(4), 0.006, 0.002), K.plain('#e04848'), X(11, W), Y(38), z + u(2.5));
    K.put(L.rbox(u(4), u(1.6), 0.006, 0.002), K.plain('#e04848'), X(11, W), Y(38), z + u(2.5));
    K.put(L.rbox(u(6), u(7), u(4), 0.008), K.gloss('#f8d030'), X(18, W), Y(37.5), z);
    K.put(L.rbox(u(10), u(3), u(4.5), 0.012), K.cloth('#ffffff'), X(13, W), Y(49.5), z);
    K.put(L.cyl(u(1.5), u(6), u(1.5), 14), K.gloss('#a8d8f0'), X(19.5, W), Y(49), z);
    bar(K, L, wood, [22, 18, 29, 54], d + 0.01, 0, 0.008);
    K.put(new L.THREE.PlaneGeometry(u(5), u(32)), silver(L), X(25.5, W), Y(36), d + 0.0105);
    K.put(L.ball(u(0.9), 10, 8), K.metal(K.pal.a), X(23.6, W), Y(36), d + 0.02);
  },

  portcullis(K, s, W, D, L) {
    // the gateway's stones, then the iron grate let down in it
    const blocks = [];
    for (let j = 0; j < 76; j += 8) for (const [i, w] of [[0, 10], [54, 10]]) blocks.push([i, j, i + w, j + 8]);
    for (let i = 0; i < 44; i += 11) blocks.push([10 + i, 10, 21 + i, 20]);
    bar(K, L, K.plain(L.tone(STONE, 0.62)), [0, 0, 10, 76], 0.04, 0, 0.002);
    bar(K, L, K.plain(L.tone(STONE, 0.62)), [54, 0, 64, 76], 0.04, 0, 0.002);
    bar(K, L, K.plain(L.tone(STONE, 0.62)), [10, 10, 54, 20], 0.04, 0, 0.002);
    masonry(K, L, blocks, [], 0.13);
    bar(K, L, K.plain('#1a1420'), [10, 20, 54, 76], 0.004);
    const iron = K.metal(K.pal.m);
    for (let j = 24; j <= 64; j += 8) bar(K, L, iron, [10, j, 54, j + 2], 0.04, 0.04, 0.006);
    for (const i of [10, 18, 26, 34, 42, 50]) {
      const x = X(i + 2, W);
      K.put(L.rbox(u(2.2), u(48), u(2.4), 0.006), iron, x, Y(43), 0.09);
      K.put(L.cyl(u(1.5), u(6), u(0.05), 8), iron, x, Y(70), 0.09);
      for (let j = 24; j <= 64; j += 8) K.put(L.ball(u(1), 8, 6).scale(1, 1, 0.6), K.metal(L.tone(K.pal.m, 1.3)), x, Y(j + 1), 0.09 + u(1.3));
    }
  },

  barndoors(K, s, W, D, L) {
    const plank = K.wood(K.pal.c), trim = K.wood('#f4f0e8'), iron = K.metal(K.pal.m);
    bar(K, L, K.plain('#2a1a14'), [30, 6, 34, 78], 0.01);
    for (const [x0, x1] of [[4, 31], [33, 60]]) {
      const pw = (x1 - x0) / 5;
      for (let n = 0; n < 5; n++) bar(K, L, plank, [x0 + n * pw + 0.15, 6, x0 + (n + 1) * pw - 0.15, 78], 0.045 + K.r() * 0.01, 0.01, 0.006);
      for (const box of [[x0, 6, x1, 9], [x0, 75, x1, 78], [x0, 9, x0 + 3, 75], [x1 - 3, 9, x1, 75]]) bar(K, L, trim, box, 0.025, 0.055, 0.006);
      // the X brace, corner to corner inside the trim
      const a = [x0 + 3, 9], b = [x1 - 3, 75], len = Math.hypot(b[0] - a[0], b[1] - a[1]), ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
      for (const sd of [1, -1]) K.put(L.rbox(u(len), u(3), 0.022, 0.005), trim, X((x0 + x1) / 2, W), Y(42), 0.068, 0, 0, sd * ang);
      // the hangers rolling on the rail
      for (const i of [x0 + 5, x1 - 5]) {
        K.put(L.rbox(u(2.4), u(8), 0.012, 0.003), iron, X(i, W), Y(6.5), 0.085);
        K.put(L.cyl(u(2), 0.025, u(2), 16).rotateX(Math.PI / 2), iron, X(i, W), Y(3.5), 0.1);
      }
    }
    bar(K, L, iron, [2, 2.5, 62, 5.5], 0.03, 0.06, 0.006);
    for (const i of [6, 32, 58]) bar(K, L, iron, [i - 1, 2.5, i + 1, 5.5], 0.06, 0, 0.004);
    for (const i of [29, 36]) {
      K.put(L.cyl(u(0.7), u(7), u(0.7), 10), iron, X(i, W), Y(43), 0.11);
      for (const j of [40, 46]) K.put(L.cyl(u(0.5), 0.04, u(0.5), 8).rotateX(Math.PI / 2), iron, X(i, W), Y(j), 0.09);
    }
  },

  airlock(K, s, W, D, L) {
    const metal = K.metal(K.pal.m), outer = [2, 6, 30, 76], inner = [7, 12, 25, 70];
    bar(K, L, K.metal(L.tone(K.pal.m, 1.15)), inner, 0.05, 0, 0.01);
    bezel(K, L, metal, outer, inner, 0.1, 0.012);
    for (const box of [[2, 6, 4, 76], [28, 6, 30, 76]]) pic(K, L, box, 0.1005);
    // the porthole, the wheel that seals it and the red warning light
    ring(K, L, K.metal(L.tone(K.pal.m, 0.7)), 16, 26, 6.4, 4.8, 0.08);
    round(K, L, K.pic(cut(K, L, [11, 21, 21, 31])), 16, 26, 5, 0.052);
    round(K, L, K.glass(), 16, 26, 4.8, 0.07);
    const gold = K.metal(K.pal.a);
    K.put(L.torus(u(5.6), u(0.8), Math.PI * 2, 32), gold, X(16, W), Y(48), 0.11);
    for (const r of [0, Math.PI / 2]) K.put(L.rbox(u(11), u(1.3), u(1.3), 0.004), gold, X(16, W), Y(48), 0.11, 0, 0, r);
    K.put(L.cyl(u(1.6), 0.06, u(1.6), 14).rotateX(Math.PI / 2), gold, X(16, W), Y(48), 0.085);
    bar(K, L, K.glow('#f84848'), [9, 62, 23, 65], 0.012, 0.05, 0.004);
    for (const [i, j] of [[8.5, 13.5], [23.5, 13.5], [8.5, 68.5], [23.5, 68.5]]) K.put(L.ball(u(0.8), 8, 6).scale(1, 1, 0.5), K.metal(L.tone(K.pal.m, 1.3)), X(i, W), Y(j), 0.05);
  },

  tilepanel(K, s, W, D, L) {
    bar(K, L, K.plain(L.tone(K.pal.p, 0.75)), [2, 14, 62, 74], 0.02, 0, 0.004);
    const glaze = [K.gloss(K.pal.p), K.gloss(K.pal.c)];
    for (let j = 0; j < 6; j++) for (let i = 0; i < 6; i++) bar(K, L, glaze[(i + j) % 2], [3 + i * 10, 15 + j * 10, 12 + i * 10, 24 + j * 10], 0.022, 0.015, 0.007);
    bar(K, L, K.metal(K.pal.a), [2, 44, 62, 46], 0.012, 0.035, 0.004);
  },

  bamboopanel(K, s, W, D, L) {
    const cane = K.gloss(BAMBOO), node = K.gloss(L.tone(BAMBOO, 0.82)), r = 2.4;
    for (let i = 2; i < 60; i += 5) {
      const x = X(i + 2.5, W);
      K.put(L.cyl(u(r), u(80), u(r), 14), cane, x, Y(48), u(r));
      for (let j = 16 + (i * 7) % 11; j < 86; j += 18) K.put(L.torus(u(r), u(0.45), Math.PI * 2, 18).rotateX(Math.PI / 2), node, x, Y(j + 1), u(r));
    }
    // the two poles across it, lashed to the canes with red cord
    const pole = K.gloss(L.tone(BAMBOO, 0.9)), lash = K.cloth(K.pal.c), z = u(r * 2 + 1.6);
    for (const j of [27.5, 67.5]) {
      K.put(L.cyl(u(1.6), u(62), u(1.6), 14).rotateZ(Math.PI / 2), pole, X(32, W), Y(j), z);
      for (let i = 4; i < 60; i += 10) K.put(L.cyl(u(1.95), u(3), u(1.95), 14).rotateZ(Math.PI / 2), lash, X(i + 1.5, W), Y(j), z);
    }
  },
};
