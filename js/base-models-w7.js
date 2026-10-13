/* base-models-w7.js  -  wall pieces, batch 7: mounted things (the dartboard, wooden and carnival masks, medal, boxing
   gloves, climbing wall, starfish, fishing net, life ring, anchor, ship's wheel, piñata, prize wheel, round shield,
   crossed cutlasses, figurehead, rope ladder, folding fan, kite, lucky horseshoe, fish wall, trident, gear wall, vine,
   honeycomb and living walls, garden thermometer). Same frame and helpers as js/base-models-w.js (its head says how a
   wall piece is built) and the batches after it.

   These are things, not pictures, so most are built whole: a rod or tube between two painted points (`between()`),
   a geometry built up +Y laid along a painted line (`along()`), a puffed star (`puff()`), a tube through painted points
   flattened against the wall (`flat()`). Where the painting is the thing's own surface (the dartboard's rings, the
   prize wheel's segments, a mask's carving, the fan's paper, the kite's cloth) it is cut and laid on, bent to shape. */

import { X, Y, u, cut, bar, pic, ring, round } from './base-models-w.js';
import { drape, cord, nail } from './base-models-w2.js';
import { bezel } from './base-models-w3.js';
import { flower, leaf } from './base-models-w5.js';
import { MOTIFS } from './base-furniture-kinds.js';
import { hash } from './base-paint.js';

const GOLD = '#f0c040', SILVER = '#d8dce4', INK = '#303038', ROPE = '#c8a868', HONEY = '#f8c840';
const RAINBOW = ['#e04848', '#f08030', '#f8d030', '#58b848', '#4a98d8', '#5a58c8', '#a858d8'];

/** A geometry built up +Y from 0 laid from painted (i0, j0) towards (i1, j1) at depth z. */
function along(K, g, m, i0, j0, i1, j1, z) {
  const W = K.p.w, dx = X(i1, W) - X(i0, W), dy = Y(j1) - Y(j0);
  g.rotateZ(Math.atan2(dy, dx) - Math.PI / 2);
  return K.put(g, m, X(i0, W), Y(j0), z);
}

/** A rod r units round from painted (i0, j0) to (i1, j1) at depth z. */
function between(K, L, m, i0, j0, i1, j1, r, z, r1 = r) {
  const len = Math.hypot(u(i1 - i0), u(j1 - j0)), g = L.cyl(u(r1), len, u(r), 14);
  g.translate(0, len / 2, 0);
  return along(K, g, m, i0, j0, i1, j1, z);
}

/** A cone from painted (i0, j0) pointing on to (i1, j1), r units round at its base. */
function spike(K, L, m, i0, j0, i1, j1, r, z, seg = 14) {
  const len = Math.hypot(u(i1 - i0), u(j1 - j0)), g = L.cyl(0.0005, len, u(r), seg);
  g.translate(0, len / 2, 0);
  return along(K, g, m, i0, j0, i1, j1, z);
}

/** A five-point star round painted (i, j), r units to its points, `d` deep and puffed round its edges, from z out. */
function puff(K, L, m, i, j, r, z, d = 0.03, inner = 0.48) {
  const sh = new L.THREE.Shape();
  for (let n = 0; n < 10; n++) {
    const a = Math.PI / 2 + n * Math.PI / 5, rr = u(r) * (n % 2 ? inner : 0.86);
    n ? sh.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : sh.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  const b = u(r) * 0.14;
  const g = new L.THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 4 });
  return K.put(g, m, X(i, K.p.w), Y(j), z + b);
}

/** A tube through painted points [i, j], r units round, its depth squashed by `sz`, its middle at depth z. */
function flat(K, L, m, pts, r, z, sz = 0.6, closed = false) {
  const W = K.p.w, curve = new L.THREE.CatmullRomCurve3(pts.map(([i, j]) => new L.THREE.Vector3(X(i, W), Y(j), 0)), closed);
  const g = new L.THREE.TubeGeometry(curve, pts.length * 3, u(r), 10, closed);
  g.scale(1, 1, sz);
  return K.put(g, m, 0, 0, z);
}

/** A hexagon (a point up) R units round, or a ring of one with a hole `hole` units round, `d` deep. */
function hex(L, R, d, hole = 0) {
  const { THREE } = L, pts = (r) => Array.from({ length: 6 }, (_, n) => new THREE.Vector2(Math.cos(Math.PI / 2 + n * Math.PI / 3) * u(r), Math.sin(Math.PI / 2 + n * Math.PI / 3) * u(r)));
  const sh = new THREE.Shape(pts(R));
  if (hole) sh.holes.push(new THREE.Path(pts(hole).reverse()));
  return new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false });
}

/** A gear r units round to its roots, `teeth` teeth 2.5 units long, `d` deep, turned `a`, a hole of r·0.3 in it. */
function gear(L, r, teeth, d, a = 0) {
  const { THREE } = L, sh = new THREE.Shape(), half = 2.5 / (r + 1.2) * 0.5;
  for (let n = 0; n < teeth; n++) {
    const t = a + n / teeth * Math.PI * 2;
    for (const [da, rr] of [[-half * 1.5, r], [-half, r + 2.5], [half, r + 2.5], [half * 1.5, r]]) {
      const x = Math.cos(t + da) * u(rr), y = Math.sin(t + da) * u(rr);
      n || da !== -half * 1.5 ? sh.lineTo(x, y) : sh.moveTo(x, y);
    }
  }
  const hole = new THREE.Path();
  hole.absarc(0, 0, u(r * 0.3), 0, Math.PI * 2, true);
  sh.holes.push(hole);
  return new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2, curveSegments: 20 });
}

export const SHAPES = {
  dartboard: { make: 'dartboard' },
  mask: { make: 'woodmask' },
  medal: { make: 'medal' },
  climbwall: { make: 'climbwall' },
  gloves: { make: 'boxgloves' },
  starfish: { make: 'starfishwall' },
  fishnet: { make: 'fishnet' },
  lifering: { make: 'lifering' },
  anchor: { make: 'anchorwall' },
  shipwheel: { make: 'shipwheel' },
  pinata: { make: 'pinata' },
  carnivalmask: { make: 'carnivalmask' },
  prizewheel: { make: 'prizewheel' },
  shieldwall: { make: 'roundshield' },
  wallfan: { make: 'foldingfan' },
  kite: { make: 'kitewall' },
  vinewall: { make: 'vinewall' },
  gearwall: { make: 'gearwall' },
  honeycomb: { make: 'honeycomb' },
  figurehead: { make: 'figurehead' },
  ropeladder: { make: 'ropeladder' },
  cutlasses: { make: 'cutlasses' },
  horseshoe: { make: 'horseshoe' },
  fishschool: { make: 'fishschool' },
  trident: { make: 'trident' },
  thermometer: { make: 'gardenthermo' },
  mosswall: { make: 'mosswall' },
};

export const MAKES = {
  dartboard(K, s, W, D, L) {
    const z = 0.06, wire = K.metal(SILVER);
    K.put(L.cyl(u(14), z, u(14), 48).rotateX(Math.PI / 2), K.gloss('#202028'), X(16, W), Y(38), z / 2);
    round(K, L, K.pic(cut(K, L, [3, 25, 29, 51])), 16, 38, 13, z + 0.002);
    for (const r of [12.5, 11.5, 7.5, 6.5, 2.2]) K.put(L.torus(u(r), u(0.18), Math.PI * 2, 56), wire, X(16, W), Y(38), z + 0.006);
    for (let a = 0; a < 20; a++) {
      const t = (a + 0.5) / 20 * Math.PI * 2, g = L.rbox(u(0.3), u(10.6), u(0.3), 0.001);
      g.translate(0, u(2.2) + u(5.3), 0);
      g.rotateZ(t);
      K.put(g, wire, X(16, W), Y(38), z + 0.006);
    }
    // a dart in the treble, tilted up and out: its point in the board, the barrel, the shaft, the flights
    const dart = [[L.cyl(u(0.2), u(2), 0.0005, 8), K.metal(SILVER), 0], [L.cyl(u(0.8), u(4), u(0.6), 12), K.metal('#8a8a98'), u(2)],
      [L.cyl(u(0.35), u(4), u(0.35), 8), K.gloss(K.pal.m), u(6)]];
    for (const [g, m, y0] of dart) { g.translate(0, y0 + g.parameters.height / 2, 0); g.rotateX(Math.PI / 2 - 0.35); g.rotateY(0.4); K.put(g, m, X(20, W), Y(33), z); }
    for (const t of [0, Math.PI / 2]) {
      const g = L.rbox(u(3), u(3.4), 0.003, 0.001);
      g.translate(0, u(8.6), 0); g.rotateY(t); g.rotateX(Math.PI / 2 - 0.35); g.rotateY(0.4);
      K.put(g, K.gloss(K.pal.a), X(20, W), Y(33), z);
    }
  },

  woodmask(K, s, W, D, L) {
    const inside = (i, j) => ((i - 16) / 10.4) ** 2 + ((j - 38) / 18.4) ** 2 <= 1;
    // the face is the carving bent into a dome, its nose standing out of it; the wall shows nothing through its back
    drape(K, L, [4, 18, 28, 58], (fx, fy) => {
      const i = 4 + fx * 24, j = 18 + fy * 40, f = 1 - ((i - 16) / 10.4) ** 2 - ((j - 38) / 18.4) ** 2;
      const nose = Math.exp(-(((i - 16.5) / 2.2) ** 2) - (((j - 40) / 5) ** 2));
      return 0.025 + Math.sqrt(Math.max(0, f)) * 0.08 + nose * 0.035;
    }, 0, [26, 44], inside);
    K.put(new L.THREE.CircleGeometry(u(10), 32).scale(1, 1.8, 1), K.plain(L.tone(K.pal.w, 0.45)), X(16, W), Y(38), 0.02);
    const gold = K.gloss(K.pal.a);
    for (const [i, j, rz] of [[6, 18, 0.5], [26, 18, -0.5], [16, 12, 0]]) spike(K, L, gold, i - rz * 4, j + 6, i, j, 3, 0.04 + (rz ? 0 : 0.02));
    K.put(L.ball(u(1.2), 10, 8), K.gloss(K.pal.a), X(16, W), Y(52), 0.06);
  },

  medal(K, s, W, D, L) {
    const gold = K.metal(K.pal.a);
    drape(K, L, [7, 19, 25, 42], (fx, fy) => 0.012 + Math.sin(fy * Math.PI) * 0.01 + Math.abs(fx - 0.5) * 0.01, 0, [10, 12], (i, j) => j < 41);
    for (const i of [10.5, 21.5]) nail(K, L, i, 20.5);
    K.put(L.torus(u(1.6), u(0.5), Math.PI * 2, 14), gold, X(16, W), Y(37), 0.03);
    K.put(L.cyl(u(9), 0.04, u(9), 48).rotateX(Math.PI / 2), K.metal(L.tone(K.pal.a, 0.75)), X(16, W), Y(46), 0.05);
    round(K, L, K.pic(cut(K, L, [7, 37, 25, 55])), 16, 46, 8, 0.0705);
    ring(K, L, gold, 16, 46, 9.2, 7.8, 0.08);
    K.put(new L.THREE.ExtrudeGeometry((() => {
      const sh = new L.THREE.Shape();
      for (let n = 0; n < 10; n++) { const a = Math.PI / 2 + n * Math.PI / 5, r = u(5.6) * (n % 2 ? 0.45 : 1); n ? sh.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
      return sh;
    })(), { depth: 0.006, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.005, bevelSegments: 2 }), gold, X(16.5, W), Y(46.5), 0.074);
  },

  climbwall(K, s, W, D, L) {
    const box = [2, 8, 62, 78], d = 0.06;
    bar(K, L, K.plain(K.pal.p), box, d, 0, 0.012);
    pic(K, L, box, d + 0.001);
    const hole = K.plain('#5a5a62');
    for (let i = 9; i < 60; i += 7) for (let j = 12; j < 76; j += 7) K.put(new L.THREE.CircleGeometry(u(0.5), 10), hole, X(i, W), Y(j), d + 0.002);
    // the holds, where they were painted: lumpy resin knobs, each bolted through its middle
    for (let n = 0; n < 16; n++) {
      const c = [K.pal.c, K.pal.a, '#68c868', '#4a88d8'][n % 4], rx = 2 + (n % 2), i = 8 + Math.floor(hash(n, 2) * 48), j = 14 + Math.floor(hash(n, 7) * 58);
      K.put(L.blob(u(rx * 2.6), u(4.6), u(3.2), 0.65, 0.6), K.gloss(c), X(i, W), Y(j), d + u(1.1), 0, 0, hash(n, 5) * Math.PI);
      K.put(L.cyl(u(0.6), u(0.5), u(0.6), 10).rotateX(Math.PI / 2), K.metal(SILVER), X(i, W), Y(j), d + u(2.6));
    }
  },

  boxgloves(K, s, W, D, L) {
    nail(K, L, 16, 20);
    const lace = K.cloth('#f4f4f0');
    for (const sg of [-1, 1]) cord(K, L, lace, [[16, 20.5, 0.03], [16 + sg * 2.5, 26, 0.05], [16 + sg * 5, 33, 0.08]], 0.45);
    for (const [cx, sg] of [[9, -1], [23, 1]]) {
      const red = K.gloss(K.pal.c);
      K.put(L.blob(u(13.5), u(18), u(11), 0.7, 0.65), red, X(cx, W), Y(43), u(6.5), 0, 0, sg * 0.08);
      K.put(L.blob(u(6), u(9), u(7), 0.8, 0.7), red, X(cx - sg * 5.6, W), Y(42), u(8), 0, 0, -sg * 0.35);
      K.put(L.cyl(u(6.2), u(5), u(6.6), 24).scale(1, 1, 0.8), K.gloss('#fbfbf6'), X(cx, W), Y(54.5), u(6.5));
      K.put(L.torus(u(6.2), u(0.5), Math.PI * 2, 24).rotateX(Math.PI / 2).scale(1, 1, 0.8), red, X(cx, W), Y(52.2), u(6.5));
    }
  },

  starfishwall(K, s, W, D, L) {
    const big = K.gloss('#f08850'), dot = K.gloss('#fff4e8');
    puff(K, L, big, 13, 35.5, 10, 0.015, 0.025);
    puff(K, L, K.gloss(K.pal.c), 19.5, 51, 5.2, 0.01, 0.015);
    // the bumps down its arms
    for (let a = 0; a < 5; a++) for (let r = 2.5; r < 8; r += 2) {
      const t = Math.PI / 2 + a * Math.PI * 2 / 5;
      K.put(L.ball(u(0.55), 8, 6), dot, X(13 + Math.cos(t) * r, W), Y(35.5 - Math.sin(t) * r), 0.015 + 0.025 + u(1.4) * 2 - r * 0.004);
    }
  },

  fishnet(K, s, W, D, L) {
    const rope = K.cloth(K.pal.w), belly = (i, j) => 0.025 + Math.sin(Math.max(0, Math.min(1, (j - 18) / 44)) * Math.PI) * 0.05 * (0.6 + 0.4 * Math.sin(Math.max(0, Math.min(1, (i - 4) / 56)) * Math.PI));
    for (let n = 0; n < 9; n++) {
      const pts = [];
      for (let j = 18; j <= 62; j += 2.5) { const i = 6 + n * 7 + Math.sin(j / 4 + n) * 2, jj = j + Math.sin(n / 2) * 4; pts.push([i, jj, belly(i, jj)]); }
      cord(K, L, rope, pts, 0.5);
    }
    for (let n = 0; n < 6; n++) {
      const pts = [];
      for (let i = 0; i <= 56; i += 3) { const jj = 22 + n * 8 + Math.sin(i / 9) * 3 + (i - 28) ** 2 / 200; pts.push([4 + i, jj, belly(4 + i, jj)]); }
      cord(K, L, rope, pts, 0.5);
    }
    cord(K, L, rope, [[4, 21, 0.03], [8, 20, 0.04], [20, 19.5, 0.035], [32, 18, 0.04], [44, 19.5, 0.035], [56, 20, 0.04], [60, 21, 0.03]], 0.7);
    for (const [i, j] of [[8, 20], [32, 18], [56, 20]]) {
      K.put(L.ball(u(3.2), 18, 12), K.gloss(K.pal.c), X(i, W), Y(j), 0.06);
      K.put(L.torus(u(3.1), u(0.35), Math.PI * 2, 20).rotateY(Math.PI / 2), K.gloss('#fbfbf6'), X(i, W), Y(j), 0.06);
    }
    puff(K, L, K.gloss('#f08850'), 26.5, 44.5, 5, belly(26.5, 44.5) + 0.005, 0.012);
    // a scallop shell caught in it: a fan of ribs
    K.put(L.ball(u(3.4), 16, 10).scale(1, 0.9, 0.4), K.gloss('#f0a898'), X(44, W), Y(48), belly(44, 48) + 0.02);
    for (let n = 0; n < 7; n++) {
      const t = Math.PI * (0.15 + n / 6 * 0.7), g = L.rbox(u(0.5), u(3.2), u(0.6), 0.002);
      g.translate(0, u(1.6), 0); g.rotateZ(t - Math.PI / 2);
      K.put(g, K.gloss('#f8c8b8'), X(44, W), Y(49.5), belly(44, 48) + 0.03);
    }
  },

  lifering(K, s, W, D, L) {
    const z = u(3) + 0.012, R = u(9), red = K.gloss(K.pal.c), white = K.gloss('#fbfbf6');
    for (let k = 0; k < 4; k++) {
      const a0 = -(k + 1) * Math.PI / 2 + Math.PI + 0.39;
      K.put(L.torus(R, u(3), Math.PI / 2, 16).rotateZ(a0), k % 2 ? red : white, X(16, W), Y(40), z);
    }
    const rope = K.cloth('#e8d8b0');
    K.put(L.torus(u(12.6), u(0.5), Math.PI * 2, 48), rope, X(16, W), Y(40), z);
    for (let k = 0; k < 4; k++) {
      const t = Math.PI / 4 + k * Math.PI / 2;
      K.put(L.torus(u(3.4), u(0.45), Math.PI * 2, 14).rotateX(Math.PI / 2).rotateZ(t), rope, X(16, W) + Math.cos(t) * R, Y(40) + Math.sin(t) * R, z);
    }
    K.put(L.cyl(u(0.8), z + u(3), u(0.8), 10).rotateX(Math.PI / 2), K.metal(K.pal.m), X(16, W), Y(26), (z + u(3)) / 2);
    K.put(L.ball(u(1.5), 12, 8), K.metal(K.pal.m), X(16, W), Y(26), z + u(3));
  },

  anchorwall(K, s, W, D, L) {
    const m = K.metal(K.pal.m), z = 0.07;
    nail(K, L, 16.5, 19.4);
    K.put(L.torus(u(3), u(1.1), Math.PI * 2, 24), m, X(16.5, W), Y(22.4), z);
    K.put(L.rbox(u(3), u(30), u(3), 0.01), m, X(16.5, W), Y(41.5), z);
    K.put(L.cyl(u(1.4), u(16), u(1.4), 14).rotateZ(Math.PI / 2), m, X(16.5, W), Y(31.5), z);
    for (const i of [8.5, 24.5]) K.put(L.ball(u(1.9), 12, 8), m, X(i, W), Y(31.5), z);
    const arc = [];
    for (let a = 0; a <= 16; a++) { const t = a / 16 * Math.PI; arc.push([16.5 - Math.cos(t) * 11, 52 + Math.sin(t) * 8 + 1.5, z]); }
    cord(K, L, m, arc, 1.7);
    K.put(L.ball(u(2.2), 12, 8), m, X(16.5, W), Y(60.5), z);
    // the flukes: barbed points up off each arm's end
    for (const [i, sg] of [[5.5, -1], [27.5, 1]]) {
      const sh = new L.THREE.Shape([[0, u(5.5)], [u(3.2), -u(1)], [0, u(0.6)], [-u(3.2), -u(1)]].map(([a, b]) => new L.THREE.Vector2(a, b)));
      const g = new L.THREE.ExtrudeGeometry(sh, { depth: u(1.6), bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 1 });
      g.translate(0, 0, -u(0.8)); g.rotateZ(-sg * 0.35);
      K.put(g, m, X(i, W), Y(50), z);
    }
    const rope = [];
    for (let j = 24; j <= 54; j += 1) rope.push([18 + Math.sin(j / 3) * 3, j, z + Math.cos(j / 3) * u(2.4)]);
    cord(K, L, K.cloth('#d8c8a0'), rope, 0.6);
  },

  shipwheel(K, s, W, D, L) {
    const wood = K.wood(), light = K.wood(L.tone(K.pal.w, 1.18)), z = 0.08, cx = 16.5, cy = 40.5;
    K.put(L.torus(u(10.5), u(1.4), Math.PI * 2, 56), wood, X(cx, W), Y(cy), z);
    K.put(L.torus(u(10.5), u(0.5), Math.PI * 2, 56), K.metal(K.pal.a), X(cx, W), Y(cy), z + u(1.3));
    for (let a = 0; a < 8; a++) {
      const t = a / 8 * Math.PI * 2, c = Math.cos(t), sn = Math.sin(t);
      between(K, L, wood, cx + c * 4, cy + sn * 4, cx + c * 10.5, cy + sn * 10.5, 1, z);
      const h = L.lathe([[u(1.1), 0], [u(1.4), u(0.8)], [u(0.9), u(1.6)], [u(1.5), u(2.6)], [u(1.6), u(3.6)], [u(0.8), u(4.6)], [u(0.0005), u(4.9)]], 14);
      along(K, h.translate(0, u(0.2), 0), light, cx + c * 11.8, cy + sn * 11.8, cx + c * 16, cy + sn * 16, z);
    }
    K.put(L.cyl(u(5), 0.05, u(5), 32).rotateX(Math.PI / 2), wood, X(cx, W), Y(cy), z);
    K.put(L.cyl(u(3.2), 0.07, u(3.2), 28).rotateX(Math.PI / 2), K.metal(K.pal.a), X(cx, W), Y(cy), z + 0.012);
    K.put(L.cyl(u(1.4), z, u(1.4), 14).rotateX(Math.PI / 2), K.metal(K.pal.m), X(cx, W), Y(cy), z / 2);
  },

  pinata(K, s, W, D, L) {
    cord(K, L, K.cloth('#d8c8a0'), [[16.5, 6, 0.015], [16.5, 14, 0.04], [16.5, 23, 0.08]], 0.4);
    K.put(L.torus(u(0.9), u(0.3), Math.PI * 2, 12), K.metal(SILVER), X(16.5, W), Y(6), 0.012);
    // the star built of the very crepe tufts it was painted with: one puffed square each, the middle fuller
    MOTIFS.star.forEach((row, j) => [...row].forEach((ch, i) => {
      if (ch === '.') return;
      const c = [K.pal.c, '#f8d030', '#58b848', '#e04848', K.pal.a][(j + i) % 5], fat = 1 - Math.hypot(i - 4, j - 4) / 6;
      K.put(L.blob(u(3.5), u(3.5), u(3.4 + fat * 3), 0.55, 0.55), K.cloth(c), X(4.5 + i * 3, W), Y(23.5 + j * 3), 0.06 + fat * 0.02);
    }));
    for (let n = 0; n < 5; n++) {
      const pts = [];
      for (let j = 47; j <= 57 + (n % 2) * 4; j += 2) pts.push([6.5 + n * 5 + Math.sin(j / 3 + n) * 0.7, j, 0.06 + Math.sin(j / 4 + n) * 0.01]);
      cord(K, L, K.cloth(RAINBOW[n]), pts, 0.55);
    }
  },

  carnivalmask(K, s, W, D, L) {
    const eye = (i, j) => ((i - 10) / 4) ** 2 + ((j - 37) / 2.2) ** 2 < 1 || ((i - 22) / 4) ** 2 + ((j - 37) / 2.2) ** 2 < 1;
    const bend = (fx) => 0.03 + Math.cos((fx - 0.5) * Math.PI * 0.95) * 0.05;
    // feathers fanned up behind it, a quill down each
    for (let n = 0; n < 5; n++) {
      const i = 8 + n * 4, j = 22 - (n === 2 ? 4 : n % 2 * 2), rz = -(n - 2) * 0.3, c = n % 2 ? K.pal.a : K.pal.c;
      K.put(L.ball(u(2.4), 14, 10).scale(1, 3.8, 0.3), K.gloss(c), X(i, W), Y(j), 0.03 + (n === 2 ? 0.01 : 0), 0, -0.15, rz);
      between(K, L, K.gloss('#fbfbf6'), i - Math.sin(rz) * 2, j + 11, i + Math.sin(rz) * 7, j - 7, 0.25, 0.042 + (n === 2 ? 0.01 : 0));
    }
    drape(K, L, [3, 29, 29, 45], (fx, fy) => bend(fx) + Math.exp(-(((fx - 0.5) / 0.07) ** 2)) * Math.max(0, fy - 0.3) * 0.02, 0, [28, 12],
      (i, j) => ((i - 16) / 12.4) ** 2 + ((j - 37) / 7.4) ** 2 <= 1 && !eye(i, j));
    for (let i = 0; i < 24; i += 3) K.put(L.ball(u(0.7), 10, 8), K.gloss(K.pal.a), X(4 + i, W), Y(43.5 - Math.sin(i / 23 * Math.PI) * 3), bend(i / 24 + 0.02) + 0.01);
    for (const i of [10, 22]) K.put(L.torus(u(4), u(0.35), Math.PI * 2, 24).scale(1, 0.55, 1), K.gloss(K.pal.a), X(i, W), Y(37), bend((i - 3) / 26) + 0.004);
    between(K, L, K.wood(), 26.5, 64, 26.5, 41, 0.7, 0.03);
    cord(K, L, K.cloth(K.pal.a), [[26.5, 42, 0.035], [25, 46, 0.045], [27, 50, 0.04]], 0.5);
  },

  prizewheel(K, s, W, D, L) {
    const wood = K.wood(), z = 0.1;
    bar(K, L, wood, [14.5, 44, 18, 68], 0.045, 0, 0.01);
    K.put(L.cyl(u(1.6), z, u(1.6), 14).rotateX(Math.PI / 2), K.metal(K.pal.m), X(16, W), Y(33), z / 2);
    K.put(L.cyl(u(14), 0.04, u(14), 56).rotateX(Math.PI / 2), wood, X(16, W), Y(33), z - 0.02);
    round(K, L, K.pic(cut(K, L, [4, 21, 28, 45])), 16, 33, 12, z + 0.0005);
    ring(K, L, K.metal(K.pal.a), 16, 33, 14.3, 12, 0.018).translate(0, 0, z - 0.012);
    for (let a = 0; a < 12; a++) { const t = a / 12 * Math.PI * 2; K.put(L.ball(u(0.85), 10, 8), K.glow('#fff4c0'), X(16 + Math.cos(t) * 13.1, W), Y(33 + Math.sin(t) * 13.1), z + 0.008); }
    for (let a = 0; a < 8; a++) { const t = a / 8 * Math.PI * 2; K.put(L.cyl(u(0.4), u(2), u(0.4), 8).rotateX(Math.PI / 2), K.metal(SILVER), X(16 + Math.cos(t) * 11, W), Y(33 + Math.sin(t) * 11), z + u(1)); }
    K.put(L.ball(u(2.5), 16, 12).scale(1, 1, 0.6), K.gloss(K.pal.a), X(16, W), Y(33), z + 0.01);
    // the clapper at the top, pointing down into the segments
    spike(K, L, K.gloss(K.pal.a), 16, 16, 16, 22.5, 2.6, z + 0.02, 3);
  },

  roundshield(K, s, W, D, L) {
    const wood = K.wood(), steel = K.metal(K.pal.m);
    for (const [i0, j0, i1, j1, z] of [[3, 14, 29, 64, 0.03], [29, 14, 3, 64, 0.045]]) {
      between(K, L, wood, i0, j0, i1, j1, 1, z);
      const dx = (i0 - i1) / Math.hypot(i0 - i1, j0 - j1), dy = (j0 - j1) / Math.hypot(i0 - i1, j0 - j1);
      spike(K, L, steel, i0, j0, i0 + dx * 7, j0 + dy * 7, 2, z, 4);
      K.put(L.ball(u(1.4), 10, 8), steel, X(i1, W), Y(j1), z);
    }
    // the shield: a shallow dome of red boards, a steel rim, a gold boss and rivets
    const R = 13.2, h = u(2.6), z0 = 0.06;
    const dome = L.lathe([[0.0005, h], [u(4), h * 0.92], [u(8), h * 0.68], [u(11), h * 0.38], [u(R), 0.004], [0.0005, 0]], 48);
    K.put(dome.rotateX(Math.PI / 2), K.wood(K.pal.c), X(16, W), Y(38), z0);
    const top = (r) => h * Math.max(0, 1 - (r / R) ** 2);
    for (let i = -10; i <= 10; i += 5) {
      const half = Math.sqrt(R * R - i * i) - 0.6;
      for (let j = -half; j < half; j += 1.5) K.put(L.rbox(u(0.35), u(1.6), u(0.3), 0.001), K.plain(L.tone(K.pal.c, 0.55)), X(16 + i, W), Y(38 + j + 0.75), z0 + top(Math.hypot(i, j + 0.75)) + 0.001);
    }
    K.put(L.torus(u(R), u(1), Math.PI * 2, 56), steel, X(16, W), Y(38), z0 + 0.008);
    K.put(new L.THREE.SphereGeometry(u(4), 24, 12, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2), K.metal(K.pal.a), X(16, W), Y(38), z0 + h - 0.01);
    for (let a = 0; a < 8; a++) K.put(L.ball(u(0.8), 10, 8), K.metal(K.pal.a), X(16 + Math.cos(a * 0.8) * 12.2, W), Y(38 + Math.sin(a * 0.8) * 12.2), z0 + 0.03);
  },

  foldingfan(K, s, W, D, L) {
    const wood = K.wood();
    // the paper pleated: mountain and valley turn about by the angle round the rivet
    drape(K, L, [0, 34, 32, 51], (fx, fy) => {
      const i = fx * 32, j = 34 + fy * 17, t = Math.atan2(50 - j, i - 16) / (Math.PI / 12);
      return 0.03 + Math.abs((((t % 2) + 2) % 2) - 1) * 0.02 + Math.hypot(i - 16, 50 - j) * 0.001;
    }, 0, [48, 24]);
    for (let a = 0; a <= 12; a++) {
      const t = a / 12 * Math.PI, last = a === 0 || a === 12, r = last ? 15.6 : 4.6;
      between(K, L, wood, 16, 50, 16 + Math.cos(t) * r, 50 - Math.sin(t) * r, last ? 0.7 : 0.45, last ? 0.04 : 0.027);
    }
    K.put(L.cyl(u(1.4), u(1.6), u(1.4), 14).rotateX(Math.PI / 2), K.metal(K.pal.m), X(16, W), Y(50), 0.04);
    cord(K, L, K.cloth(K.pal.a), [[16, 51, 0.04], [16.5, 55, 0.035], [16.5, 58, 0.03]], 0.4);
    K.put(L.lathe([[u(0.6), 0], [u(1.4), -u(1)], [u(1.6), -u(4)], [u(0.0005), -u(4.2)]], 14), K.cloth(K.pal.a), X(16.5, W), Y(58), 0.03);
  },

  kitewall(K, s, W, D, L) {
    nail(K, L, 16, 9);
    const at = (i, j) => 0.05 - ((i - 16) / 12) ** 2 * 0.02 + 0.016 * Math.sin(Math.min(1, Math.abs(i - 16) / 12) * Math.PI) * Math.sin(Math.min(1, Math.abs(j - 20) / (j < 20 ? 12 : 24)) * Math.PI);
    drape(K, L, [3, 7, 29, 45], (fx, fy) => at(3 + fx * 26, 7 + fy * 38), 0, [24, 32]);
    const wood = K.wood();
    between(K, L, wood, 16, 8, 16, 44, 0.45, 0.042);
    cord(K, L, wood, [[4, 20, 0.022], [10, 20, 0.04], [16, 20, 0.045], [22, 20, 0.04], [28, 20, 0.022]], 0.45);
    const tail = [];
    for (let j = 44; j <= 76; j += 2) tail.push([16 + Math.sin((j - 44) / 4) * 3, j, 0.05 - (j - 44) * 0.0006]);
    cord(K, L, K.cloth('#d8d8d8'), tail, 0.3);
    for (const j of [8, 16, 24]) {
      const cx = 16 + Math.sin(j / 4) * 3, m = K.cloth(RAINBOW[j / 8]);
      for (const sg of [-1, 1]) K.put(L.cyl(u(0.4), u(3), u(1.6), 3).rotateZ(sg * Math.PI / 2).scale(1, 1, 0.4), m, X(cx + sg * 1.5, W), Y(44 + j), 0.05 - j * 0.0006);
    }
  },

  vinewall(K, s, W, D, L) {
    const stem = K.plain('#3a6a2a'), green = K.gloss(K.pal.leaf), dark = K.gloss(L.tone(K.pal.leaf, 0.8));
    for (let sv = 0; sv < 5; sv++) {
      let px = 4 + sv * 13;
      const pts = [];
      for (let j = 4; j < 76; j++) {
        px += Math.round(Math.sin(j / 6 + sv) * 0.6);
        const z = 0.025 + Math.sin(j / 9 + sv) * 0.012;
        if (j % 3 === 0 || j === 75) pts.push([px + 0.5, j, z]);
        if (j % 6 === sv % 6) { const side = j % 12 < 6 ? 1 : -1; leaf(K, L, (j + sv) % 2 ? green : dark, px + 0.5 + side * 3, j, z + 0.02, -side * 0.6, 1.25); }
      }
      cord(K, L, stem, pts, 0.55);
    }
    for (let n = 0; n < 9; n++) flower(K, L, [K.pal.c, '#f8f0a0', '#ffffff'][n % 3], 4 + hash(n, 1) * 56, 10 + hash(n, 2) * 60, 0.06);
  },

  gearwall(K, s, W, D, L) {
    [[18, 32, 13, K.pal.m], [42, 48, 10, K.pal.a], [48, 22, 7, L.tone(K.pal.m, 1.2)], [14, 60, 6, K.pal.a]].forEach(([cx, cy, r, c], n) => {
      const z = 0.05 + n % 2 * 0.012, d = 0.035;
      K.put(L.cyl(u(r * 0.3), z, u(r * 0.3), 16).rotateX(Math.PI / 2), K.metal(L.tone(K.pal.m, 0.6)), X(cx, W), Y(cy), z / 2);
      K.put(gear(L, r, 10, d, hash(n, 4) * Math.PI), K.metal(c), X(cx, W), Y(cy), z);
      ring(K, L, K.metal(L.tone(c, 1.18)), cx, cy, r - 0.4, r - 2.4, 0.012).translate(0, 0, z + d + 0.004);
      ring(K, L, K.metal(L.tone(c, 0.7)), cx, cy, r * 0.48, r * 0.3, 0.02).translate(0, 0, z + d);
      K.put(L.ball(u(r * 0.2), 14, 10).scale(1, 1, 0.5), K.metal(SILVER), X(cx, W), Y(cy), z + d + 0.01);
    });
  },

  honeycomb(K, s, W, D, L) {
    const wax = K.gloss('#d89820'), honey = K.gloss(HONEY), cap = K.gloss('#fde890');
    for (let r = 0; r < 6; r++) for (let c = 0; c < 4; c++) {
      const cx = 6 + c * 7 + (r % 2) * 3.5, cy = 18 + r * 7, d = 0.05 + hash(r, c, 3) * 0.02;
      K.put(hex(L, 4.05, d, 3.2), wax, X(cx, W), Y(cy), 0);
      if ((r + c) % 3) K.put(hex(L, 3.25, d * 0.55), honey, X(cx, W), Y(cy), 0);
      else K.put(L.ball(u(3.2), 6, 6).rotateZ(Math.PI / 2 + Math.PI / 6).scale(1, 1, 0.25), cap, X(cx, W), Y(cy), d * 0.85);
    }
    // a drip running off the bottom
    K.put(L.lathe([[u(1.1), 0], [u(0.8), -u(4)], [u(1.6), -u(5.5)], [u(1.7), -u(6.6)], [u(1), -u(7.8)], [0.0005, -u(8)]], 14).scale(1, 1, 0.7), honey, X(13, W), Y(60.5), 0.035);
    // and its bee, wings up
    const bx = 26, by = 12, bz = 0.1;
    K.put(L.ball(u(2.8), 16, 12).scale(1.3, 0.85, 0.85), K.gloss('#f8d030'), X(bx, W), Y(by), bz);
    for (const dx of [-0.8, 1]) K.put(L.cyl(u(2.45), u(0.7), u(2.45), 16).rotateZ(Math.PI / 2).scale(1, 0.92, 0.92), K.gloss(INK), X(bx + dx, W), Y(by), bz);
    K.put(L.ball(u(1.5), 12, 8), K.gloss(INK), X(bx + 3.6, W), Y(by - 0.4), bz);
    for (const dz of [-0.025, 0.025]) K.put(L.ball(u(2), 12, 8).scale(0.7, 1.3, 0.15), K.glass(), X(bx - 0.4, W), Y(by - 3.2), bz + dz, 0, 0, 0.3);
    spike(K, L, K.gloss(INK), bx - 3.4, by, bx - 5, by + 0.3, 0.6, bz);
  },

  figurehead(K, s, W, D, L) {
    const wood = K.wood(), dark = K.wood(L.tone(K.pal.w, 0.7)), z = 0.17;
    bar(K, L, wood, [12, 40, 24, 72], 0.2, 0, 0.03);
    for (let j = 46; j < 70; j += 5) bar(K, L, dark, [11.6, j, 24.4, j + 1.2], 0.205, 0, 0.004);
    // the neck curving up out of the post, the head bowed forward over it: a sea horse's
    const neck = [];
    for (let j = 44; j >= 14; j -= 2) neck.push([18 - Math.sin((j - 14) / 30 * Math.PI) * 6, j, z]);
    cord(K, L, wood, neck, 4.6);
    K.put(L.blob(u(11), u(10), u(10), 0.85, 0.85), wood, X(15, W), Y(18), z);
    K.put(L.blob(u(12), u(7.5), u(8), 0.8, 0.8), wood, X(9, W), Y(22.5), z, 0, 0, 0.25);
    K.put(L.ball(u(1.5), 12, 8), K.metal(GOLD), X(10, W), Y(20), z + u(3.6));
    K.put(L.rbox(u(5), u(0.6), u(8.2), 0.002), K.plain('#3a2418'), X(5.5, W), Y(24.6), z, 0, 0, 0.25);
    for (let n = 0; n < 4; n++) {
      const g = L.cyl(0.0005, u(6), u(2.6), 10);
      g.scale(1, 1, 0.45); g.translate(0, u(3), 0);
      along(K, g, dark, 20 + n * 2, 17 + n * 5, 25 + n * 2, 10 + n * 5, z - 0.02);
    }
  },

  ropeladder(K, s, W, D, L) {
    const wood = K.wood(), rope = K.cloth(ROPE), twist = K.cloth(L.tone(ROPE, 0.78));
    bar(K, L, wood, [4, 4, 28, 7.5], 0.1, 0, 0.012);
    for (const i of [6, 26]) nail(K, L, i, 5.7);
    const z = (j) => 0.07 - j / 90 * 0.035;
    for (const i of [8.5, 23.5]) {
      const a = [], b = [];
      for (let j = 6; j <= 90; j += 2) {
        a.push([i + Math.sin(j / 9), j, z(j)]);
        b.push([i + Math.sin(j / 9) + Math.cos(j * 1.3) * 0.7, j, z(j) + Math.sin(j * 1.3) * u(0.7)]);
      }
      cord(K, L, rope, a, 0.8);
      cord(K, L, twist, b, 0.4);
    }
    for (let j = 14; j < 88; j += 10) {
      const i0 = 8.5 + Math.sin((j + 1.5) / 9), i1 = 23.5 + Math.sin((j + 1.5) / 9);
      between(K, L, wood, i0, j + 1.5, i1, j + 1.5, 1.5, z(j));
      for (const i of [i0, i1]) K.put(L.ball(u(1.6), 12, 8), rope, X(i, W), Y(j + 1.5), z(j));
    }
  },

  cutlasses(K, s, W, D, L) {
    bar(K, L, K.wood(), [4, 26, 28, 48], 0.035, 0, 0.012);
    for (const j of [33, 40.5]) bar(K, L, K.plain(L.tone(K.pal.w, 0.6)), [4.5, j, 27.5, j + 0.4], 0.036);
    const steel = K.metal(SILVER), gold = K.metal(GOLD);
    for (const sg of [-1, 1]) {
      const z = sg < 0 ? 0.05 : 0.066;
      const at = (f) => [17 - sg * 13 + sg * 26 * f, 59 - f * 40 - Math.sin(f * Math.PI) * 4];
      // the blade: its back along the curve, its edge out from it, narrowing to the point
      const back = [], edge = [];
      for (let n = 0; n <= 24; n++) {
        const f = 0.15 + n / 24 * 0.85, [i, j] = at(f), [i2, j2] = at(Math.min(1, f + 0.01)), [i1, j1] = at(f - 0.01);
        const tx = i2 - i1, ty = j2 - j1, l = Math.hypot(tx, ty), w = n === 24 ? 0 : 2.4 * (1 - (n / 24) ** 3 * 0.85);
        back.push(new L.THREE.Vector2(X(i, W), Y(j)));
        edge.push(new L.THREE.Vector2(X(i - ty / l * w * sg, W), Y(j + tx / l * w * sg)));
      }
      const g = new L.THREE.ExtrudeGeometry(new L.THREE.Shape([...back, ...edge.reverse()]), { depth: 0.006, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.002, bevelSegments: 1 });
      K.put(g, steel, 0, 0, z);
      const [hi, hj] = at(0.15), [pi, pj] = at(0);
      between(K, L, K.plain('#4a2c20'), pi, pj, hi, hj, 0.9, z + 0.006);
      K.put(L.ball(u(1.3), 12, 8), gold, X(pi + sg * 0.6, W), Y(pj + 1.4), z + 0.006);
      along(K, L.rbox(u(1.4), u(7), u(1.4), 0.004).translate(0, 0, 0), gold, hi, hj, hi + (hj - pj), hj - (hi - pi), z + 0.006);
      K.put(L.torus(u(3.2), u(0.4), Math.PI * 0.85, 18).rotateZ(-0.95 * Math.PI), gold, X((hi + pi) / 2 - sg * 1.2, W), Y((hj + pj) / 2 + 0.6), z + 0.006, 0, 0, sg * 0.4);
    }
  },

  horseshoe(K, s, W, D, L) {
    bar(K, L, K.wood(), [6, 22, 26, 52], 0.035, 0, 0.012);
    nail(K, L, 16, 24);
    const pts = [];
    for (let a = 0; a <= 30; a++) { const t = Math.PI * 0.05 + a / 30 * Math.PI * 1.9; pts.push([16.5 + Math.sin(t) * 6, 38.5 - Math.cos(t) * 7]); }
    const z = 0.035 + u(1.9) * 0.6;
    flat(K, L, K.metal(SILVER), pts, 1.9, z, 0.6);
    for (const end of [pts[0], pts[30]]) K.put(L.ball(u(1.9), 12, 8).scale(1, 1, 0.6), K.metal(SILVER), X(end[0], K.p.w), Y(end[1]), z);
    for (let a = 2; a < 30; a += 6) { const [i, j] = pts[a]; K.put(L.ball(u(0.55), 8, 6), K.plain(INK), X(i, W), Y(j), z + u(1.9) * 0.55); }
  },

  fishschool(K, s, W, D, L) {
    [[12, 24, 1], [26, 18, 0.8], [40, 28, 1.2], [20, 42, 0.9], [36, 50, 1], [52, 40, 0.8], [50, 16, 0.7]].forEach(([i, j, sc], n) => {
      const c = n % 2 ? K.pal.c : K.pal.a, m = K.gloss(c), z = 0.07 + (n % 3) * 0.015, x = X(i, W), y = Y(j);
      K.put(L.cyl(u(0.5), z, u(0.5), 8).rotateX(Math.PI / 2), K.metal(SILVER), x, y, z / 2);
      K.put(L.ball(u(5 * sc), 24, 16).scale(1, 0.62, 0.42), m, x, y, z);
      const tail = new L.THREE.Shape([[0, 0], [-u(5.5 * sc), u(3.4 * sc)], [-u(4.4 * sc), 0], [-u(5.5 * sc), -u(3.4 * sc)]].map(([a, b]) => new L.THREE.Vector2(a, b)));
      K.put(new L.THREE.ExtrudeGeometry(tail, { depth: u(0.8 * sc), bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 1 }), K.gloss(L.tone(c, 0.85)), x - u(3.6 * sc), y, z - u(0.4 * sc));
      K.put(L.cyl(0.0005, u(3 * sc), u(2.4 * sc), 3).scale(1, 1, 0.25), K.gloss(L.tone(c, 0.85)), x - u(0.6 * sc), y + u(3.6 * sc), z, 0, 0, 0.5);
      for (const sz of [1, -1]) K.put(L.ball(u(0.8 * sc), 10, 8), K.gloss(INK), X(i + 3 * sc, W), Y(j - 1), z + sz * u(5 * sc) * 0.32);
    });
    for (const [i, j] of [[30, 34], [58, 26], [8, 50]]) {
      K.put(L.ball(u(1.7), 14, 10), K.glass(), X(i, W), Y(j), 0.06);
      K.put(L.ball(u(0.45), 8, 6), K.gloss('#ffffff'), X(i - 0.6, W), Y(j - 0.6), 0.06 + u(1.4));
    }
  },

  trident(K, s, W, D, L) {
    const gold = K.metal(GOLD), z = 0.05, onShaft = (j) => 6.5 + (84 - j) * 20 / 72;
    for (const j of [32, 66]) {
      K.put(L.cyl(u(0.8), z, u(0.8), 10).rotateX(Math.PI / 2), K.metal(K.pal.m), X(onShaft(j), W), Y(j + 1.5), z / 2);
      K.put(L.torus(u(1.6), u(0.5), Math.PI, 14).rotateZ(Math.PI), K.metal(K.pal.m), X(onShaft(j), W), Y(j), z);
    }
    between(K, L, gold, 6.5, 85, 24.5, 20, 1.1, z);
    between(K, L, gold, 18, 15.5, 31, 21.5, 1.1, z);
    for (const [dx, dy] of [[-6, -2], [0, 0], [6, 2]]) {
      const i0 = 24.5 + dx, j0 = 18 + dy, i1 = 28.5 + dx, j1 = 4 + dy;
      between(K, L, gold, i0, j0, i1, j1, 0.8, z);
      spike(K, L, K.metal(L.tone(GOLD, 1.1)), i1, j1, i1 + (i1 - i0) * 0.36, j1 + (j1 - j0) * 0.36, 1.7, z, 4);
    }
    K.put(L.ball(u(2.5), 6, 4).scale(1, 1.2, 0.7), K.gloss('#58c8e8'), X(20, W), Y(30), z + 0.012);
    K.put(L.torus(u(2.6), u(0.45), Math.PI * 2, 18).scale(1, 1.2, 1), gold, X(20, W), Y(30), z + 0.01);
    for (const j of [70, 74]) {
      const i = onShaft(j);
      between(K, L, K.cloth(K.pal.c), i + 0.4, j + 1.5, i - 0.4, j - 1.5, 1.5, z);
    }
  },

  gardenthermo(K, s, W, D, L) {
    const box = [8, 10, 24, 80], d = 0.035;
    bar(K, L, K.wood(), box, d, 0, 0.02);
    pic(K, L, [9, 24, 23, 79], d + 0.001);
    // the sun: a little dome with its face, rays round it
    const sun = K.gloss('#f8d030');
    K.put(new L.THREE.SphereGeometry(u(5), 24, 12, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2).scale(1, 1, 0.45), sun, X(16, W), Y(18), d);
    for (let a = 0; a < 8; a++) { const t = a / 8 * Math.PI * 2 + Math.PI / 8; spike(K, L, sun, 16 + Math.cos(t) * 5.4, 18 + Math.sin(t) * 5.4, 16 + Math.cos(t) * 7.4, 18 + Math.sin(t) * 7.4, 0.9, d + 0.004, 8); }
    for (const i of [14.5, 17.5]) K.put(L.ball(u(0.6), 8, 6), K.gloss(INK), X(i, W), Y(17.2), d + u(2.1));
    K.put(L.torus(u(1.4), u(0.3), Math.PI * 0.8, 12).rotateZ(-Math.PI * 0.9), K.gloss(INK), X(16, W), Y(19), d + u(2));
    // the glass tube, its red line and bulb, held by two clips
    K.put(L.cyl(u(1.8), u(46), u(1.8), 16), K.glass(), X(16.5, W), Y(48), d + u(1.8));
    K.put(L.cyl(u(0.7), u(26), u(0.7), 10), K.gloss('#e04838'), X(16.5, W), Y(57), d + u(1.8));
    K.put(L.ball(u(3), 16, 12), K.gloss('#e04838'), X(16.5, W), Y(72), d + u(2.2));
    for (const j of [27, 66]) K.put(L.rbox(u(5), u(1.4), u(3.4), 0.003), K.metal(SILVER), X(16.5, W), Y(j), d + u(1.6));
  },

  mosswall(K, s, W, D, L) {
    const d = 0.03, green = K.pal.leaf;
    bezel(K, L, K.wood(), [2, 8, 62, 88], [5, 11, 59, 85], 0.09, 0.012);
    bar(K, L, K.plain('#3a2a1a'), [5, 11, 59, 85], d);
    // a carpet of moss over the soil, then what was planted in it where it was painted
    for (let n = 0; n < 90; n++) K.put(L.ball(u(2.2 + hash(n, 9) * 1.6), 10, 8).scale(1, 1, 0.45), K.gloss(L.tone('#5a8a32', 0.85 + hash(n, 8) * 0.3)), X(7 + hash(n, 6) * 50, W), Y(13 + hash(n, 7) * 70), d);
    for (let n = 0; n < 60; n++) {
      const cx = 8 + hash(n, 1) * 48, cy = 14 + hash(n, 2) * 68, s4 = n % 4;
      if (s4 === 0) for (let k = 0; k < 6; k++) {
        const a = k / 6 * Math.PI * 2 + n, r = k ? 2.6 : 0;
        K.put(L.ball(u(2.4), 12, 8).scale(1, 0.9, 0.7), K.gloss(L.tone(green, 0.85 + (k % 3) * 0.12)), X(cx + Math.cos(a) * r, W), Y(cy + Math.sin(a) * r), d + 0.03 + (k ? 0 : 0.015));
      }
      else if (s4 === 1) leaf(K, L, K.gloss(L.tone(green, 1.15)), cx, cy, d + 0.04, -(hash(n, 3) - 0.5) * 1.5, 1.5);
      else if (s4 === 2) K.put(L.ball(u(3), 14, 10).scale(1, 1, 0.5), K.cloth('#6a9a3a'), X(cx, W), Y(cy), d + 0.02);
      else flower(K, L, K.pal.c, cx, cy, d + 0.05);
    }
  },
};
