/* base-models-w5.js  -  wall pieces, batch 5: shelves, racks and hooks (the spice, pot, plate, tool and towel racks, the
   utensil rail, the mug, syrup, tea and jam shelves, the first-aid kit, hat hooks, coat pegs, bookends, the record wall,
   window box and ivy trellis, the control panel, monitor wall and solar panel). Same frame and helpers as
   js/base-models-w.js (its head says how a wall piece is built) and the batches after it.

   What stood or hung on a painted shelf is built and stood or hung there: jars, bottles and tins on planks deep enough
   to hold them, pans and utensils hooked over their rail, towels folded over theirs. Screens stay crops of the
   painting, so js/base-3d.js lights them in the piece's `glow`. */

import { X, Y, u, cut, bar, pic, ring, round } from './base-models-w.js';
import { drape, rod, cord } from './base-models-w2.js';
import { glass, bezel } from './base-models-w3.js';
import { BOOKS } from './base-paint-scenes.js';

const BRASS = '#d8a838', SILVER = '#d8dce4', INK = '#303038', CREAM = '#fffbe8';
const RAINBOW = ['#e04848', '#f08030', '#f8d030', '#58b848', '#4a98d8', '#5a58c8', '#a858d8'];

/** A shelf plank over painted [x0, j, x1] (4 units thick), `d` deep, with a bracket under it at each of `under`. */
function plank(K, L, [x0, j, x1], d = 0.22, under = []) {
  const wood = K.wood();
  bar(K, L, wood, [x0, j, x1, j + 4], d, 0, 0.01);
  for (const i of under) brace(K, L, K.wood(L.tone(K.pal.w, 0.8)), i, j + 4, 8, d * 0.85);
}

/** A triangular bracket at painted (i, j) hanging `n` units down the wall, `d` deep at its top. */
function brace(K, L, m, i, j, n, d) {
  const { THREE } = L, sh = new THREE.Shape([[0, 0], [d, 0], [d, -u(1.5)], [0.012, -u(n)], [0, -u(n)]].map(([a, b]) => new THREE.Vector2(a, b)));
  const g = new THREE.ExtrudeGeometry(sh, { depth: u(2.4), bevelEnabled: false });
  g.rotateY(-Math.PI / 2);
  K.put(g, m, X(i + 1.2, K.p.w), Y(j), 0);
}

/** An S-hook over a rail running along x at painted (i, j), `z` out, for something to hang from at j + 2·r. */
function hook(K, L, m, i, j, z, r = 2) {
  K.put(L.torus(u(r), u(0.45), Math.PI * 1.5, 18).rotateZ(-Math.PI * 0.25).rotateY(Math.PI / 2), m, X(i, K.p.w), Y(j), z);
}

/** A Poké Ball of radius r units at painted (i, j), its button facing out at depth z. */
export function pokeball(K, L, i, j, r, z) {
  const W = K.p.w, { THREE } = L;
  K.put(new THREE.SphereGeometry(u(r), 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), K.gloss('#e04848'), X(i, W), Y(j), z);
  K.put(new THREE.SphereGeometry(u(r), 28, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), K.gloss('#f4f4f0'), X(i, W), Y(j), z);
  K.put(L.cyl(u(r * 1.015), u(r * 0.2), u(r * 1.015), 28), K.gloss(INK), X(i, W), Y(j), z);
  K.put(L.cyl(u(r * 0.38), u(r * 0.3), u(r * 0.38), 20).rotateX(Math.PI / 2), K.gloss(INK), X(i, W), Y(j), z + u(r * 0.92));
  K.put(L.cyl(u(r * 0.25), u(r * 0.3), u(r * 0.25), 20).rotateX(Math.PI / 2), K.gloss('#f4f4f0'), X(i, W), Y(j), z + u(r * 1.0));
}

/** A five-petalled flower facing out at painted (i, j), depth z. */
export function flower(K, L, c, i, j, z, s = 1) {
  const W = K.p.w;
  for (let n = 0; n < 5; n++) {
    const a = n / 5 * Math.PI * 2 + 0.3;
    K.put(L.ball(u(1.1 * s), 10, 8).scale(1, 1, 0.45), K.gloss(c), X(i + Math.cos(a) * 1.3 * s, W), Y(j + Math.sin(a) * 1.3 * s), z);
  }
  K.put(L.ball(u(0.8 * s), 10, 8).scale(1, 1, 0.6), K.gloss('#f8d030'), X(i, W), Y(j), z + u(0.4));
}

/** A leaf facing out at painted (i, j), its tip turned by `a`. */
export function leaf(K, L, m, i, j, z, a = 0, s = 1) {
  K.put(L.ball(u(1.6 * s), 12, 8).scale(0.62, 1.15, 0.28), m, X(i, K.p.w), Y(j), z, 0, 0.35, a);
}

/** Parts tilted about the painted line j (top leaning out by `a`): put(g, m, i, j, z) like K.put. */
function leaning(K, j0, a) {
  const py = Y(j0), W = K.p.w;
  return (g, m, i, j, z, rx = 0) => {
    if (rx) g.rotateX(rx);
    g.translate(X(i, W), Y(j) - py, z);
    g.rotateX(a);
    g.translate(0, py, 0);
    return K.put(g, m);
  };
}

export const SHAPES = {
  spicerack: { make: 'spicerack' },
  potrack: { make: 'potrack' },
  platerack: { make: 'platerack' },
  utensils: { make: 'utensilrail' },
  mugshelf: { make: 'mugshelf' },
  gardentools: { make: 'toolrack' },
  syrupshelf: { make: 'syrupshelf' },
  teatins: { make: 'teatins' },
  preserves: { make: 'jamshelf' },
  firstaid: { make: 'firstaidkit' },
  towelrail: { make: 'towelrail' },
  hathooks: { make: 'hathooks' },
  coatpegs: { make: 'coatpegs' },
  bookends: { make: 'bookends' },
  vinylwall: { make: 'recordwall' },
  windowbox: { make: 'windowbox' },
  trellis: { make: 'ivytrellis' },
  controlpanel: { make: 'controlpanel' },
  monitorwall: { make: 'monitorwall' },
  solarpanel: { make: 'solarpanel' },
};

export const MAKES = {
  spicerack(K, s, W, D, L) {
    const d = 0.2, wood = K.wood(L.tone(K.pal.w, 0.9));
    for (const box of [[2, 22, 5, 58], [27, 22, 30, 58]]) bar(K, L, wood, box, d, 0, 0.01);
    bar(K, L, K.wood(L.tone(K.pal.w, 0.7)), [5, 22, 27, 58], 0.015);
    const lid = K.metal(K.pal.a), top = K.gloss('#e8f4f8');
    for (const j of [36, 54]) {
      bar(K, L, K.wood(), [5, j, 27, j + 4], d, 0, 0.008);
      ['#c84830', '#e8b030', '#6a9a3a', '#8a4a2a', '#f4f0e0'].forEach((c, n) => {
        const x = X(7 + n * 5, W);
        K.put(L.cyl(u(1.9), u(8), u(1.9), 16), K.gloss(c), x, Y(j - 4), 0.1);
        K.put(L.cyl(u(1.9), u(2), u(1.9), 16), top, x, Y(j - 9), 0.1);
        K.put(L.cyl(u(2.05), u(2), u(2.05), 16), lid, x, Y(j - 11), 0.1);
        K.put(L.rbox(u(3), u(3), 0.004, 0.001), K.plain(CREAM), x, Y(j - 4.5), 0.1 + u(1.9));
      });
      // the dowel across the front that keeps the jars on
      rod(K, L, K.wood(L.tone(K.pal.w, 1.1)), 3.5, 28.5, j - 4, 0.6, d - 0.02, null);
    }
  },

  potrack(K, s, W, D, L) {
    const iron = K.metal(K.pal.m), z = 0.13;
    rod(K, L, iron, 4, 60, 18, 2, z, K.metal(K.pal.a), 3);
    for (const i of [10, 54]) K.put(L.rbox(u(2.4), u(2.4), z, 0.004), iron, X(i, W), Y(18), z / 2);
    for (const [cx, r, c] of [[13, 9, K.pal.m], [32, 11, K.pal.c], [51, 8, L.tone(K.pal.m, 1.15)]]) {
      const pan = K.metal(c), cy = 33 + r;
      hook(K, L, iron, cx, 18, z, 2.2);
      // the handle from the hook down to the rim, then the pan hung flat, its cooking side out
      K.put(L.rbox(u(2.4), u(14), u(1.2), 0.004), pan, X(cx, W), Y(28), z);
      K.put(L.torus(u(0.9), u(0.35), Math.PI * 2, 12), K.metal(L.tone(c, 0.7)), X(cx, W), Y(22.5), z + u(0.7));
      K.put(L.cyl(u(r + 1), u(3.4), u(r + 0.4), 36).rotateX(Math.PI / 2), pan, X(cx, W), Y(cy), z);
      K.put(L.cyl(u(r - 0.4), 0.004, u(r - 0.4), 36).rotateX(Math.PI / 2), K.metal(L.tone(c, 0.72)), X(cx, W), Y(cy), z + u(1.72));
      K.put(L.torus(u(r + 0.7), u(0.55), Math.PI * 2, 40), K.metal(L.tone(c, 1.2)), X(cx, W), Y(cy), z + u(1.7));
      K.put(L.ball(u(r * 0.18), 12, 8).scale(1, 1, 0.08), K.metal(L.tone(c, 1.35)), X(cx - r * 0.4, W), Y(cy - r * 0.35), z + u(1.75));
    }
  },

  platerack(K, s, W, D, L) {
    const wood = K.wood(), d = 0.22;
    bar(K, L, K.wood(L.tone(K.pal.w, 0.45)), [4, 24, 60, 62], 0.015);
    bar(K, L, wood, [4, 24, 60, 28], d, 0, 0.01);
    bar(K, L, wood, [4, 56, 60, 62], d, 0, 0.01);
    for (const box of [[4, 28, 6, 56], [58, 28, 60, 56]]) bar(K, L, wood, box, d, 0, 0.008);
    for (let n = 0; n < 7; n++) K.put(L.cyl(u(0.6), u(28), u(0.6), 10), K.wood(L.tone(K.pal.w, 0.85)), X(6.5 + n * 9, W), Y(42), 0.04);
    // the plates stood in their slots leaning back, each a step in front of the last
    for (let n = 0; n < 6; n++) {
      const x = X(12 + n * 8, W), z = 0.09 + n * 0.014, rim = n % 2 ? K.pal.c : K.pal.a;
      K.put(L.cyl(u(6.8), u(1), u(5), 40).rotateX(Math.PI / 2), K.gloss('#ffffff'), x, Y(42), z, 0, -0.12);
      K.put(L.cyl(u(4.2), 0.002, u(4.2), 40).rotateX(Math.PI / 2), K.gloss('#f0eee8'), x, Y(42), z + u(0.5), 0, -0.12);
      K.put(L.torus(u(5.2), u(0.42), Math.PI * 2, 40), K.gloss(rim), x, Y(42), z + u(0.85), 0, -0.12);
    }
    rod(K, L, wood, 4, 60, 51, 0.8, d - 0.03, null);
  },

  utensilrail(K, s, W, D, L) {
    const steel = K.metal(K.pal.m), z = 0.12;
    rod(K, L, steel, 3, 29, 19.5, 1.5, z, K.metal(K.pal.a), 2);
    for (const i of [6, 26]) K.put(L.rbox(u(1.6), u(1.6), z, 0.003), steel, X(i, W), Y(19.5), z / 2);
    // the ladle
    hook(K, L, steel, 8, 19.5, z, 1.7);
    K.put(L.rbox(u(1.6), u(17), u(0.6), 0.003), steel, X(8, W), Y(30.5), z);
    K.put(L.ball(u(4), 24, 16).scale(1, 1, 0.45), steel, X(8, W), Y(42), z);
    K.put(L.ball(u(3.3), 24, 16).scale(1, 1, 0.2), K.metal(L.tone(K.pal.m, 0.6)), X(8, W), Y(42), z + u(1.2));
    // the spatula, a wooden handle and a slotted blade
    hook(K, L, steel, 16, 19.5, z, 1.7);
    K.put(L.cyl(u(0.9), u(14), u(0.9), 10), K.wood(), X(16, W), Y(29), z);
    K.put(L.rbox(u(6), u(9), u(0.6), 0.004), K.gloss(K.pal.c), X(16, W), Y(39.5), z);
    for (let n = 0; n < 3; n++) K.put(L.rbox(u(3.4), u(0.8), 0.004, 0.001), K.plain(L.tone(K.pal.c, 0.6)), X(16, W), Y(37.5 + n * 2), z + u(0.31));
    // the whisk, its wires in loops round the handle's line
    hook(K, L, steel, 24, 19.5, z, 1.7);
    K.put(L.cyl(u(1), u(11), u(1), 10), steel, X(24, W), Y(28), z);
    const wire = K.metal(L.tone(K.pal.m, 1.25));
    for (let w = 0; w < 4; w++) {
      const a = w / 4 * Math.PI, pts = [];
      for (let t = 0; t <= 24; t++) {
        const th = t / 24 * Math.PI * 2, h = Math.sin(th) * 4;
        pts.push([24 + Math.cos(a) * h, 33 + (1 - Math.cos(th)) * 7, z + Math.sin(a) * u(h) * 0.6]);
      }
      cord(K, L, wire, pts, 0.25);
    }
  },

  mugshelf(K, s, W, D, L) {
    const d = 0.22;
    plank(K, L, [2, 41, 62], d);
    for (const i of [8, 53]) brace(K, L, K.wood(L.tone(K.pal.w, 0.8)), i, 45, 9, d * 0.8);
    [K.pal.c, K.pal.a, '#ffffff', '#4a78d8', K.pal.c].forEach((c, n) => {
      const i = 9.5 + n * 11, m = K.gloss(c);
      K.put(L.cyl(u(3.5), u(9), u(3.3), 24), m, X(i, W), Y(36.5), 0.11);
      K.put(L.cyl(u(3), 0.003, u(3), 24), K.plain(L.tone(c, 0.55)), X(i, W), Y(32), 0.11);
      K.put(L.torus(u(1.9), u(0.6), Math.PI * 1.2, 14).rotateZ(-Math.PI * 0.6), m, X(i + 3.4, W), Y(36), 0.11);
      // a cup hook under the shelf
      K.put(L.torus(u(1), u(0.3), Math.PI * 1.3, 12).rotateZ(Math.PI * 0.8), K.metal(K.pal.m), X(i, W), Y(47), 0.15);
    });
  },

  toolrack(K, s, W, D, L) {
    const steel = K.metal(K.pal.m), handle = K.wood(L.tone(K.pal.w, 1.15)), z = 0.07;
    bar(K, L, K.wood(), [4, 18, 60, 24], 0.12, 0, 0.012);
    for (const i of [12, 32, 52]) K.put(L.ball(u(1.5), 12, 8).scale(1, 1, 0.6), K.metal(K.pal.a), X(i, W), Y(21), 0.12);
    // the rake
    K.put(L.cyl(u(1), u(34), u(1), 10), handle, X(12, W), Y(39), z);
    K.put(L.rbox(u(12), u(2), u(1.6), 0.004), steel, X(11.5, W), Y(56), z);
    for (let n = 0; n < 6; n++) K.put(L.cyl(u(0.45), u(6), u(0.3), 8), steel, X(6.5 + n * 2, W), Y(60), z, 0, -0.25);
    // the spade, its blade tapering to the edge and dished a little
    K.put(L.cyl(u(1), u(32), u(1), 10), handle, X(32, W), Y(37), z);
    K.put(L.rbox(u(5), u(2.4), u(1.6), 0.004), handle, X(32, W), Y(22.6), z);
    const { THREE } = L, blade = new THREE.Shape([[-4, 0], [4, 0], [3.4, -9], [0, -12], [-3.4, -9]].map(([a, b]) => new THREE.Vector2(u(a), u(b))));
    const bg = new THREE.ExtrudeGeometry(blade, { depth: u(0.6), bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2 });
    K.put(bg, steel, X(32, W), Y(52), z - u(0.3));
    K.put(L.rbox(u(2.4), u(4), u(2), 0.004), steel, X(32, W), Y(51.5), z);
    // the fork
    K.put(L.cyl(u(1), u(32), u(1), 10), handle, X(52, W), Y(37), z);
    K.put(L.rbox(u(11), u(2), u(1.6), 0.004), steel, X(52, W), Y(53), z);
    for (let n = 0; n < 4; n++) K.put(L.cyl(u(0.55), u(9), u(0.25), 8), steel, X(47.5 + n * 3, W), Y(58.5), z);
  },

  syrupshelf(K, s, W, D, L) {
    const cs = ['#8a3018', '#e8a030', K.pal.c, '#5a8a3a', '#c84878', '#f0d8a0', K.pal.a];
    for (const j of [36, 58]) {
      plank(K, L, [2, j, 62], 0.22, [6, 56]);
      cs.forEach((c, n) => {
        const x = X(8 + n * 8, W), m = K.gloss(c), z = 0.1;
        K.put(L.lathe([[u(2.1), 0], [u(2.1), u(12)], [u(1.9), u(13)], [u(1), u(15)], [u(0.95), u(18.5)], [u(1.1), u(19)], [0.0005, u(19)]], 24), m, x, Y(j), z);
        K.put(L.cyl(u(1.15), u(1.4), u(1.15), 14), K.gloss(INK), x, Y(j - 19.6), z);
        K.put(L.cyl(u(2.15), u(4.5), u(2.15), 24, true), K.plain(CREAM), x, Y(j - 8), z);
        K.put(L.ball(u(0.7), 8, 6).scale(0.5, 2.2, 0.3), K.plain('#ffffff'), X(7 + n * 8, W), Y(j - 13.5), z + u(1.95));
      });
    }
  },

  teatins(K, s, W, D, L) {
    [38, 58].forEach((j, r) => {
      plank(K, L, [2, j, 30], 0.2, [5, 25]);
      for (let n = 0; n < 3; n++) {
        const c = [K.pal.c, K.pal.a, '#4a8a5a'][(n + r) % 3], x = X(8.5 + n * 8, W), z = 0.1, tin = K.metal(c);
        K.put(L.cyl(u(3.3), u(11), u(3.3), 24), tin, x, Y(j - 5.5), z);
        K.put(L.cyl(u(3.6), u(2.4), u(3.6), 24), K.metal(L.tone(c, 1.15)), x, Y(j - 12), z);
        K.put(L.ball(u(0.8), 10, 8), K.metal(L.tone(c, 1.15)), x, Y(j - 13.4), z);
        K.put(L.cyl(u(3.32), u(3.4), u(3.32), 24, true), K.plain(CREAM), x, Y(j - 6.5), z);
        K.put(L.rbox(u(3), u(0.6), 0.004, 0.001), K.plain(L.tone(c, 0.7)), x, Y(j - 6.6), z + u(3.32));
      }
    });
  },

  jamshelf(K, s, W, D, L) {
    for (const j of [36, 60]) plank(K, L, [2, j, 30], 0.2, [5, 25]);
    for (let r = 0; r < 2; r++) for (let n = 0; n < 3; n++) {
      const c = ['#c82838', '#f0a020', '#7a3aa8', '#e85868', '#58a048', '#f8d040'][r * 3 + n], top = 24 + r * 24, x = X(8.5 + n * 8, W), z = 0.1;
      // the jam inside, the glass round it, then a gingham cover tied on with a ribbon
      K.put(L.cyl(u(3), u(9), u(3), 20), K.gloss(c), x, Y(top + 7.5), z);
      K.put(L.cyl(u(3.5), u(11), u(3.5), 20), K.glass(), x, Y(top + 6.5), z);
      K.put(L.cyl(u(3.7), u(1), u(3.7), 20), K.metal(K.pal.m), x, Y(top + 0.6), z);
      K.put(L.lathe([[u(4.6), u(-2.6)], [u(4.9), u(-2.4)], [u(4.6), u(-0.6)], [u(4), u(0.6)], [u(2.6), u(1.3)], [0.0005, u(1.4)]], 28), K.cloth(K.pal.p), x, Y(top), z);
      K.put(L.torus(u(3.9), u(0.45), Math.PI * 2, 24).rotateX(Math.PI / 2), K.cloth(K.pal.c), x, Y(top + 0.4), z);
      K.put(L.ball(u(0.8), 10, 8).scale(1.6, 1, 0.6), K.cloth(K.pal.c), x, Y(top + 0.4), z + u(4));
    }
  },

  firstaidkit(K, s, W, D, L) {
    const red = K.gloss(K.pal.c), d = 0.16;
    bar(K, L, K.gloss('#ffffff'), [6, 28, 26, 46], d, 0, 0.02);
    bar(K, L, red, [5.6, 28, 26.4, 31], d + 0.008, -0.004, 0.012);
    bar(K, L, red, [14, 33, 18, 44], 0.01, d - 0.002, 0.003);
    bar(K, L, red, [10, 37, 22, 41], 0.01, d - 0.002, 0.003);
    K.put(L.torus(u(3), u(0.8), Math.PI, 18), K.metal(K.pal.m), X(16, W), Y(28), d / 2);
    for (const i of [9, 23]) K.put(L.rbox(u(2.2), u(2.6), u(0.8), 0.003), K.metal('#c8ccd4'), X(i, W), Y(30.5), d + 0.012);
  },

  towelrail(K, s, W, D, L) {
    const steel = K.metal(K.pal.m), z = 0.12;
    rod(K, L, steel, 3, 29, 24.5, 1.4, z, K.metal(K.pal.a), 2);
    for (const i of [4, 28]) K.put(L.rbox(u(1.6), u(1.6), z, 0.003), steel, X(i, W), Y(24.5), z / 2);
    // each towel folded over the rail: the back fall, the roll over the top, the front fall in soft folds
    for (const [x0, x1, y1, c] of [[5, 16, 56, K.pal.c], [17, 27, 50, K.pal.p]]) {
      const cloth = K.cloth(c), mid = (x0 + x1) / 2;
      K.put(L.rbox(u(x1 - x0 - 0.4), u(y1 - 30), u(0.8), 0.01), K.cloth(L.tone(c, 0.82)), X(mid, W), Y(24 + (y1 - 30) / 2), z - u(2.2));
      K.put(L.cyl(u(2.3), u(x1 - x0), u(2.3), 18).rotateZ(Math.PI / 2), cloth, X(mid, W), Y(24.5), z);
      drape(K, L, [x0, 26.5, x1, y1], (fx, fy) => z + u(2.1) + Math.sin(fx * Math.PI * 3) * 0.004 + fy * 0.012, 0, [10, 16]);
    }
  },

  hathooks(K, s, W, D, L) {
    bar(K, L, K.wood(), [1, 24, 31, 29], 0.08, 0, 0.01);
    for (const i of [7, 18, 28]) {
      K.put(L.cyl(u(0.8), 0.1, u(0.8), 10).rotateX(Math.PI / 2 - 0.35), K.metal(K.pal.m), X(i, W), Y(29.5), 0.11);
      K.put(L.ball(u(1.2), 10, 8), K.metal(K.pal.a), X(i, W), Y(28.3), 0.17);
    }
    // the cap, its crown and its peak
    const cap = K.cloth(K.pal.c);
    K.put(new L.THREE.SphereGeometry(u(5.5), 24, 12, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.95, 0.8), cap, X(7, W), Y(39), 0.13);
    K.put(L.ball(u(1), 10, 8), cap, X(7, W), Y(33.8), 0.13);
    K.put(L.cyl(u(4.6), u(0.6), u(4.6), 24).scale(1, 1, 0.7), K.cloth(L.tone(K.pal.c, 0.82)), X(11, W), Y(39), 0.17, 0, 0.2);
    // the straw hat, hung by its crown, its brim tipped out
    const straw = K.cloth(K.pal.a);
    K.put(L.ball(u(4), 22, 14).scale(1, 0.9, 1), straw, X(18, W), Y(39), 0.16);
    K.put(L.cyl(u(7), u(0.6), u(7.4), 32), straw, X(18, W), Y(42), 0.16, 0, 0.55);
    K.put(L.cyl(u(4.08), u(1.4), u(4.08), 24, true), K.cloth(K.pal.c), X(18, W), Y(41.2), 0.16, 0, 0.55);
    // the scarf over the last hook, its two ends hanging, striped
    const scarf = K.cloth(K.pal.p), band = K.cloth(K.pal.c);
    K.put(L.torus(u(1.8), u(1.3), Math.PI, 14), scarf, X(28.5, W), Y(32.5), 0.14);
    K.put(L.rbox(u(3), u(22), u(1.4), 0.006), scarf, X(27.5, W), Y(44), 0.13, 0, 0, 0.03);
    K.put(L.rbox(u(2.4), u(16), u(1.4), 0.006), scarf, X(30.2, W), Y(41), 0.15, 0, 0, -0.03);
    for (const j of [46.5, 51]) K.put(L.rbox(u(3.1), u(1.4), u(1.5), 0.004), band, X(27.5 + (j - 44) * 0.03, W), Y(j), 0.13, 0, 0, 0.03);
  },

  coatpegs(K, s, W, D, L) {
    bar(K, L, K.wood(), [2, 24, 62, 30], 0.07, 0, 0.012);
    for (let n = 0; n < 5; n++) {
      const x = X(9 + n * 12, W);
      K.put(L.cyl(u(1), 0.13, u(0.8), 12).rotateX(Math.PI / 2 - 0.3), K.wood(L.tone(K.pal.w, 1.1)), x, Y(29), 0.11);
      K.put(L.ball(u(1.7), 12, 10), K.metal(K.pal.a), x, Y(27.3), 0.17);
    }
    // two bags on their straps
    for (const [n, c] of [[1, K.pal.c], [3, '#4a78d8']]) {
      const i = 21 + (n - 1) * 24 - 0.5, bag = K.cloth(c);
      cord(K, L, K.cloth(L.tone(c, 0.75)), [[i - 3, 38], [i - 1.5, 30.5], [i, 28.8], [i + 1.5, 30.5], [i + 3, 38]].map(([a, b]) => [a, b, 0.15]), 0.5);
      K.put(L.blob(u(11), u(14), u(6), 0.45, 0.55), bag, X(i, W), Y(43), 0.13);
      K.put(L.blob(u(8), u(4), u(1.6), 0.4, 0.5), K.cloth(L.tone(c, 1.12)), X(i, W), Y(44.5), 0.13 + u(2.9));
      K.put(L.ball(u(0.7), 8, 6), K.metal(K.pal.a), X(i, W), Y(42.5), 0.13 + u(3.2));
    }
    // the raincoat on the last peg, shoulders and hood, falling in folds
    const coat = K.cloth(K.pal.c);
    K.put(L.blob(u(9), u(5), u(5), 0.5, 0.6), coat, X(57, W), Y(31.5), 0.12);
    K.put(L.blob(u(13), u(5), u(6), 0.5, 0.6), coat, X(56, W), Y(36), 0.1);
    drape(K, L, [50, 37, 62, 58], (fx, fy) => 0.1 + Math.sin(fx * Math.PI) * 0.06 + Math.sin(fx * Math.PI * 4) * 0.006 * fy, 0, [12, 14]);
  },

  bookends(K, s, W, D, L) {
    plank(K, L, [2, 46, 30], 0.22, [6, 24]);
    // books stood between the two ends, each its own height and colour
    let i = 9, n = 0;
    while (i < 23.5) {
      const bw = 2.4 + ((n * 2) % 3) * 0.6, bh = 14 + ((n * 5) % 5), c = BOOKS[(n * 5 + 1) % BOOKS.length];
      K.put(L.rbox(u(bw), u(bh), 0.15, 0.006), K.gloss(c), X(i + bw / 2, W), Y(46 - bh / 2), 0.11);
      K.put(L.rbox(u(bw) + 0.002, u(1), 0.152, 0.002), K.gloss(L.tone(c, 1.3)), X(i + bw / 2, W), Y(46 - bh + 2.5), 0.11);
      i += bw + 0.15; n++;
    }
    for (const x of [5.5, 26.5]) {
      K.put(L.rbox(u(7), u(2), u(5), 0.006), K.metal(L.tone(K.pal.m, 0.85)), X(x, W), Y(45), 0.11);
      pokeball(K, L, x, 40, 3.8, 0.11);
    }
  },

  recordwall(K, s, W, D, L) {
    const wood = K.wood();
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
      const fx = 4 + c * 19, fy = 14 + r * 26, cx = fx + 9, cy = fy + 12, col = RAINBOW[(r * 3 + c * 2) % 7];
      bar(K, L, K.plain(L.tone(K.pal.w, 0.45)), [fx + 1.5, fy + 1.5, fx + 16.5, fy + 22.5], 0.012);
      bezel(K, L, wood, [fx, fy, fx + 18, fy + 24], [fx + 1.5, fy + 1.5, fx + 16.5, fy + 22.5], 0.07, 0.008);
      // the record held off the back by its spindle, grooves catching the light
      K.put(L.cyl(u(7), u(0.5), u(7), 48).rotateX(Math.PI / 2), K.gloss(INK), X(cx, W), Y(cy), 0.04);
      for (const rr of [3.6, 4.6, 5.6, 6.4]) K.put(L.torus(u(rr), u(0.12), Math.PI * 2, 48), K.gloss('#4a4a54'), X(cx, W), Y(cy), 0.048);
      K.put(L.cyl(u(2.6), u(0.6), u(2.6), 28).rotateX(Math.PI / 2), K.plain(col), X(cx, W), Y(cy), 0.042);
      K.put(L.cyl(u(0.45), u(1.6), u(0.45), 10).rotateX(Math.PI / 2), K.metal(SILVER), X(cx, W), Y(cy), 0.045);
      glass(K, L, [fx + 1.5, fy + 1.5, fx + 16.5, fy + 22.5], 0.066);
    }
  },

  windowbox(K, s, W, D, L) {
    const wood = K.wood(), d = 0.26;
    bar(K, L, wood, [4, 57, 60, 70], d, 0, 0.012);
    bar(K, L, K.wood(L.tone(K.pal.w, 1.15)), [3, 56, 61, 58.5], d + 0.02, 0, 0.008);
    bar(K, L, K.plain('#5a3a24'), [5, 56, 59, 57], d - 0.04, 0.02, 0.004);
    for (const i of [11, 51]) brace(K, L, K.wood(L.tone(K.pal.w, 0.8)), i, 70, 6, d * 0.7);
    const stem = K.gloss(L.tone(K.pal.leaf, 0.75)), lf = [K.gloss(K.pal.leaf), K.gloss(L.tone(K.pal.leaf, 1.15))];
    for (let n = 0; n < 9; n++) {
      const i = 8.5 + n * 6, h = 8 + (n % 3) * 4, z = 0.1 + (n % 2) * 0.06 + K.r() * 0.02;
      K.put(L.cyl(u(0.45), u(h + 2), u(0.5), 8), stem, X(i, W), Y(57 - h / 2), z);
      leaf(K, L, lf[n % 2], i - 2, 54 - h / 2, z, 0.7);
      leaf(K, L, lf[(n + 1) % 2], i + 2, 52 - h / 2, z, -0.7);
      flower(K, L, [K.pal.c, K.pal.a, '#ffffff'][n % 3], i, 56 - h, z + u(0.6), 1.1);
    }
  },

  ivytrellis(K, s, W, D, L) {
    const wood = K.wood(), R = K.r;
    for (let n = 0; n < 4; n++) bar(K, L, wood, [4 + n * 8, 14, 6 + n * 8, 76], 0.035, 0.005, 0.006);
    for (let n = 0; n < 4; n++) bar(K, L, wood, [2, 18 + n * 16, 30, 20 + n * 16], 0.03, 0.04, 0.006);
    // two vines climbing it, leaves along them turned every way, a few flowers
    const vine = K.gloss(L.tone(K.pal.leaf, 0.6)), lf = [K.gloss(K.pal.leaf), K.gloss(L.tone(K.pal.leaf, 0.85)), K.gloss(L.tone(K.pal.leaf, 1.12))];
    for (const [i0, ph] of [[9, 0], [22, 2.2]]) {
      const pts = [];
      for (let j = 76; j >= 20; j -= 4) pts.push([i0 + Math.sin(j / 9 + ph) * 5, j, 0.08 + Math.sin(j / 5 + ph) * 0.012]);
      cord(K, L, vine, pts, 0.45);
      pts.forEach(([i, j, z], n) => {
        if (n === 0) return;
        const side = n % 2 ? 1 : -1;
        leaf(K, L, lf[Math.floor(R() * 3)], i + side * 2.2, j - 1, z + 0.01, side * (0.6 + R() * 0.5), 1.1 + R() * 0.4);
        if (R() < 0.5) leaf(K, L, lf[Math.floor(R() * 3)], i - side * 1.6, j + 1.5, z + 0.015, -side * (0.4 + R() * 0.5), 0.9 + R() * 0.3);
      });
    }
    for (const [i, j] of [[8, 26], [21, 40], [12, 55], [24, 66]]) flower(K, L, K.pal.c, i, j, 0.11, 1);
  },

  controlpanel(K, s, W, D, L) {
    const metal = K.metal(K.pal.m), dark = K.metal(L.tone(K.pal.m, 0.7));
    // the upright with its three screens, then the desk below it sloping out to the buttons
    bar(K, L, metal, [3, 20, 61, 42], 0.1, 0, 0.012);
    for (const [x0, x1] of [[7, 23], [25, 41], [43, 57]]) {
      const inner = [x0 + 1, 25, x1 - 1, 35];
      bar(K, L, K.plain('#1a2a2a'), [x0, 24, x1, 36], 0.004, 0.1);
      pic(K, L, inner, 0.106);
      bezel(K, L, dark, [x0, 24, x1, 36], inner, 0.012, 0.003);
      glass(K, L, inner, 0.11 + 0.002);
    }
    const { THREE } = L, a = Math.atan2(0.14, u(18)), zf = (j) => 0.1 + (j - 42) / 18 * 0.14;
    const side = new THREE.Shape([[0, Y(42)], [0.1, Y(42)], [0.24, Y(60)], [0, Y(60)]].map(([p, q]) => new THREE.Vector2(p, q)));
    const wedge = new THREE.ExtrudeGeometry(side, { depth: u(58), bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2 });
    wedge.rotateY(-Math.PI / 2);
    K.put(wedge, metal, X(61, W), 0, 0);
    const on = (g, m, i, j, lift) => K.put(g, m, X(i, W), Y(j) + Math.sin(a) * lift, zf(j) + Math.cos(a) * lift, 0, -a);
    for (let n = 0; n < 8; n++) {
      on(L.cyl(u(2.2), u(0.6), u(2.2), 18).rotateX(Math.PI / 2), dark, 9 + n * 6, 45, 0.004);
      on(new THREE.SphereGeometry(u(1.8), 16, 8, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2).scale(1, 1, 0.6), K.glow(RAINBOW[n % 7]), 9 + n * 6, 45, 0.008);
    }
    for (let n = 0; n < 3; n++) {
      on(L.rbox(u(4), u(4.5), u(1), 0.004), dark, 12 + n * 8, 53, 0.006);
      on(L.cyl(u(0.5), u(4), u(0.5), 8).rotateX(Math.PI / 2 - 0.5 + n * 0.35), K.metal(SILVER), 12 + n * 8, 53, 0.03);
      on(L.ball(u(1.1), 10, 8), K.gloss(K.pal.a), 12 + n * 8, 53 - (2 - n * 0.6), 0.055);
    }
    on(L.rbox(u(18), u(5), u(0.6), 0.004), K.plain('#1a1e24'), 49, 53, 0.006);
    for (let n = 0; n < 6; n++) on(L.ball(u(0.75), 10, 8), K.glow(n % 2 ? '#e04848' : '#68e868'), 42.5 + n * 3, 53, 0.016);
  },

  monitorwall(K, s, W, D, L) {
    const metal = K.metal(K.pal.m), dark = K.metal(L.tone(K.pal.m, 0.72));
    bar(K, L, metal, [4, 12, 60, 64], 0.03, 0, 0.01);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
      const sx = 6 + c * 27, sy = 14 + r * 25, inner = [sx + 2, sy + 2, sx + 23, sy + 19];
      // the arm off the board, then the monitor: its case, the screen set in, a stand-by light
      K.put(L.cyl(u(1.6), 0.05, u(1.6), 14).rotateX(Math.PI / 2), dark, X(sx + 12.5, W), Y(sy + 11.5), 0.055);
      bar(K, L, dark, [sx + 1, sy + 1, sx + 24, sy + 22], 0.03, 0.06, 0.01);
      bar(K, L, K.plain('#14243a'), inner, 0.002, 0.09);
      pic(K, L, inner, 0.0935);
      bezel(K, L, K.metal(L.tone(K.pal.m, 0.9)), [sx, sy, sx + 25, sy + 23], inner, 0.012, 0.004);
      glass(K, L, inner, 0.097);
      K.put(L.ball(u(0.7), 10, 8), K.glow('#68e868'), X(sx + 21.5, W), Y(sy + 20.8), 0.105);
    }
  },

  solarpanel(K, s, W, D, L) {
    const frame = K.metal(SILVER), steel = K.metal(K.pal.m), a = 0.24;
    // the bracket and the post it stands on, then the panel tipped up to the sky from its foot
    K.put(L.cyl(u(1.8), u(16), u(1.8), 14), steel, X(32, W), Y(61), u(2.4));
    K.put(L.rbox(u(8), u(3), u(1), 0.004), steel, X(32, W), Y(67.5), u(0.5));
    const put = leaning(K, 54, a);
    put(L.rbox(u(60), u(36), 0.045, 0.01), frame, 32, 36, 0.025);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) {
      const i = 9 + c * 9.5, j = 25.5 + r * 10.5;
      put(L.rbox(u(8.6), u(9.4), 0.01, 0.002), K.gloss('#2a4a8a'), i, j, 0.05);
      for (let n = 1; n < 3; n++) put(L.rbox(u(8.2), u(0.25), 0.002, 0.0005), K.metal(SILVER), i, j - 4.7 + n * 3.13, 0.056);
      put(L.rbox(u(0.25), u(9), 0.002, 0.0005), K.metal(SILVER), i, j, 0.056);
    }
    // the struts holding the top out from the wall
    const reach = Math.sin(a) * (Y(24) - Y(54)), rise = Y(24) - Y(46), b = Math.atan2(reach, rise);
    for (const i of [8, 56]) K.put(L.rbox(u(1.4), Math.hypot(reach, rise), u(1.2), 0.003), steel, X(i, W), (Y(24) + Y(46)) / 2, reach / 2, 0, b);
  },
};
