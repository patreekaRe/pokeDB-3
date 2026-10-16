/* base-models-w6.js  -  wall pieces, batch 6: lights, clocks and strings (the cuckoo and station clocks, the big
   stopwatch, the wall lamp, wall torch, brass, ship and paper lanterns, the ghost chandelier, disco ball, café bulbs,
   fairy lights, festival lanterns, bunting, the bat and snowflake garlands, the mitten and washing lines, string of
   pearls, icicles, cobweb, star mobile, dreamcatcher, wind chime, hanging plant, wreath, school bell, the neon, jackpot,
   Center, Gym and fair signs and the café awning). Same frame and helpers as js/base-models-w.js (its head says how a
   wall piece is built) and the batches after it.

   What hangs, hangs: a lantern or a disco ball swings from an arm out of the wall (`arm()`), a string sags out from
   its two hooks as well as down (`string()`), and what was painted along it is built and hung there. A lamp's shade,
   a lantern's paper and a bulb are `K.glow()`; a sign's letters are its painting's own pixels lifted proud of its face
   (`lift()`), so the room's glow mask still lights them. */

import { X, Y, u, cut, bar, pic, ring, round } from './base-models-w.js';
import { drape, rod, cord, star } from './base-models-w2.js';
import { keep, bezel } from './base-models-w3.js';
import { pokeball } from './base-models-w5.js';
import { hash } from './base-paint.js';

const BRASS = '#d8a838', SILVER = '#d8dce4', INK = '#303038', CHROME = '#e8ecf4', ICE = '#bfe6f8', WEB = '#e8e8f0';

/** The painters' sag: painted height along a string `len` long hung at `top`, dipping `dip` in the middle. */
const sag = (len, top, dip) => (i) => top + Math.round(Math.sin(Math.max(0, Math.min(len, i)) / len * Math.PI) * dip);

/** A string from painted x0 to x1 along `j(x)`, hooked to the wall at both ends and bellied `out` from it in the
    middle; returns its depth at x, for what hangs from it. */
function string(K, L, m, x0, x1, j, out = 0.07, r = 0.45) {
  const z = (x) => 0.02 + Math.sin(Math.max(0, Math.min(1, (x - x0) / (x1 - x0))) * Math.PI) * out, pts = [];
  for (let x = x0; x < x1; x += 2) pts.push([x, j(x), z(x)]);
  pts.push([x1, j(x1), z(x1)]);
  cord(K, L, m, pts, r);
  for (const x of [x0, x1]) eye(K, L, x, j(x));
  return z;
}

/** A screw eye in the wall at painted (i, j). */
function eye(K, L, i, j) {
  K.put(L.torus(u(0.9), u(0.3), Math.PI * 2, 12), K.metal(SILVER), X(i, K.p.w), Y(j), 0.012);
}

/** A bracket out of the wall at painted (i, j): a round plate, a rod out to depth z and a hook down from its end. */
function arm(K, L, m, i, j, z, r = 0.8) {
  const x = X(i, K.p.w), y = Y(j);
  K.put(L.cyl(u(3), 0.016, u(3), 20).rotateX(Math.PI / 2), m, x, y, 0.008);
  K.put(L.cyl(u(r), z, u(r), 10).rotateX(Math.PI / 2), m, x, y, z / 2);
  K.put(L.ball(u(r * 1.6), 10, 8), m, x, y, 0.016);
  K.put(L.torus(u(1.1), u(r * 0.5), Math.PI * 2, 12).rotateY(Math.PI / 2), m, x, y - u(1.2), z);
}

/** A chain of links from painted (i, j0) down to j1 at depth z. */
function chain(K, L, m, i, j0, j1, z, s = 1) {
  for (let j = j0, n = 0; j < j1; j += 2.4 * s, n++) {
    const g = L.torus(u(1.1 * s), u(0.35 * s), Math.PI * 2, 12);
    g.scale(1, 1.5, 1);
    K.put(n % 2 ? g.rotateY(Math.PI / 2) : g, m, X(i, K.p.w), Y(j + 1.2 * s), z);
  }
}

/** A clock's face round painted (cx, cy), r units, at depth z: the dial, its ticks, `hands` ([length, turn from twelve,
    width, colour]), the pin and a glass dome over it. */
function face(K, L, cx, cy, r, z, hands, dial = '#f8f6ec', dome = true) {
  const W = K.p.w, ink = K.plain(INK);
  round(K, L, K.plain(dial), cx, cy, r, z);
  for (let h = 0; h < 12; h++) {
    const a = h * Math.PI / 6, big = h % 3 === 0;
    K.put(L.rbox(u(big ? r * 0.12 : r * 0.07), u(big ? r * 0.22 : r * 0.12), 0.005), ink, X(cx + Math.sin(a) * r * 0.8, W), Y(cy - Math.cos(a) * r * 0.8), z + 0.004, 0, 0, -a);
  }
  hands.forEach(([len, a, wd, c], n) => {
    const hand = L.rbox(u(wd), u(len), 0.005, 0.002);
    hand.translate(0, u(len) / 2 - u(len * 0.12), 0); hand.rotateZ(-a);
    K.put(hand, c ? K.gloss(c) : ink, X(cx, W), Y(cy), z + 0.008 + n * 0.004);
  });
  K.put(L.cyl(u(r * 0.1), 0.012, u(r * 0.1), 12).rotateX(Math.PI / 2), K.metal(BRASS), X(cx, W), Y(cy), z + 0.02);
  if (!dome) return;
  const g = new L.THREE.SphereGeometry(u(r), 32, 10, 0, Math.PI * 2, 0, Math.PI / 2);
  g.scale(1, 0.22, 1); g.rotateX(Math.PI / 2);
  K.put(g, K.glass(), X(cx, W), Y(cy), z + 0.002);
}

const tests = new Map();
/** A test for keep(): a pixel within `tol` of `hex`. */
function near(hex, tol = 70) {
  const key = hex + tol;
  if (!tests.has(key)) {
    const n = parseInt(hex.slice(1), 16), R = n >> 16, G = (n >> 8) & 255, B = n & 255;
    tests.set(key, (r, g, b) => Math.abs(r - R) + Math.abs(g - G) + Math.abs(b - B) < tol);
  }
  return tests.get(key);
}

/** The painting's pixels in `box` that pass `test`, lifted proud of a face at z in `layers` sheets. */
function lift(K, L, box, test, z, layers = 3, step = 0.007) {
  const [x0, y0, x1, y1] = box, m = K.pic(keep(cut(K, L, box), test));
  m.alphaTest = 0.5;
  m.side = L.THREE.DoubleSide;
  for (let n = 0; n < layers; n++) K.put(new L.THREE.PlaneGeometry(u(x1 - x0), u(y1 - y0)), m, X((x0 + x1) / 2, K.p.w), Y((y0 + y1) / 2), z + n * step);
}

/** A crop of the painting cut to its outline and stacked into a thin card, `d` thick, turned `rz` and `ry`. */
function card(K, L, box, z, d = 0.02, rz = 0, ry = 0) {
  for (let n = 0; n < 4; n++) {
    const g = drape(K, L, box, () => 0, 0, [1, 1]);
    // drape put it in place: bring it back to its middle to turn it, then out again
    const [x0, y0, x1, y1] = box, cx = X((x0 + x1) / 2, K.p.w), cy = Y((y0 + y1) / 2);
    g.translate(-cx, -cy, 0); if (rz) g.rotateZ(rz); if (ry) g.rotateY(ry); g.translate(cx, cy, z + d * n / 3);
  }
}

/** A flat pot hung from three cords: the pot round painted (cx, cy), rx across, its rim at j `rim`, cords up to (cx, top). */
function hungPot(K, L, cx, cy, rx, ry, rim, top, z, colour) {
  const W = K.p.w, pot = K.gloss(colour), m = K.metal(K.pal.m);
  K.put(L.lathe([[0, -u(ry)], [u(rx * 0.55), -u(ry * 0.9)], [u(rx * 0.92), -u(ry * 0.3)], [u(rx), u(ry * 0.4)], [u(rx * 1.04), u(ry * 0.55)], [u(rx * 0.96), u(ry * 0.55)]], 28).scale(1, 1, 0.8), pot, X(cx, W), Y(cy), z);
  K.put(L.torus(u(rx), u(1), Math.PI * 2, 32).rotateX(Math.PI / 2).scale(1, 1, 0.8), K.gloss(L.tone(colour, 1.15)), X(cx, W), Y(rim), z);
  for (const a of [-0.5, 0.5, Math.PI]) cord(K, L, m, [[cx, top, z], [cx + Math.sin(a) * rx * 0.98, rim, z + Math.cos(a) * u(rx) * 0.8]], 0.3);
  arm(K, L, m, cx, top - 1, z);
}

/** A trailing strand from painted (i, j) down `len` units, beads or leaves of `r` every `step`, swaying in x by `sway`. */
function strand(K, L, i, j, len, z, r, step, ms, sway = 1.5, ph = 0, leafy = false) {
  const W = K.p.w, pts = [];
  for (let d = 0; d <= len; d += step) {
    const x = i + Math.sin(d / 6 + ph) * sway, zz = z + Math.sin(d / 9 + ph) * 0.01;
    pts.push([x, j + d, zz]);
    const m = ms[Math.round(d / step) % ms.length];
    if (leafy) K.put(L.ball(u(r), 8, 6).scale(0.7, 1.1, 0.35), m, X(x, W), Y(j + d), zz, 0, 0.3, Math.sin(d) * 0.8);
    else K.put(L.ball(u(r), 6, 6), m, X(x, W), Y(j + d), zz);
  }
  if (pts.length > 1) cord(K, L, ms[0], pts, 0.25);
}

/** A light bulb hanging at painted (i, j) from a socket above it, depth z: a pear of glow. */
function bulb(K, L, i, j, z, c, rx = 2.5, ry = 3.5) {
  const W = K.p.w;
  K.put(L.cyl(u(1.1), u(3), u(1.3), 12), K.metal(K.pal.m), X(i, W), Y(j - ry - 0.5), z);
  K.put(L.ball(u(rx), 16, 12).scale(1, ry / rx, 1), K.glow(c), X(i, W), Y(j), z);
}

export const SHAPES = {
  cuckoo: { make: 'cuckooclock' },
  stationclock: { make: 'stationclock' },
  stopwatch: { make: 'stopwatch' },
  sconce: { make: 'walllamp' },
  walltorch: { make: 'walltorch' },
  brasslantern: { make: 'brasslantern' },
  shiplantern: { make: 'shiplantern' },
  chochin: { make: 'chochin' },
  chandelier: { make: 'ghostchandelier' },
  discoball: { make: 'discoball' },
  cafelights: { make: 'cafebulbs' },
  fairylights: { make: 'fairylights' },
  lanternstring: { make: 'lanternstring' },
  bunting: { make: 'bunting' },
  batgarland: { make: 'batgarland' },
  snowflakes: { make: 'snowgarland' },
  mittenline: { make: 'mittenline' },
  washingline: { make: 'washingline' },
  stringpearls: { make: 'stringpearls' },
  icicles: { make: 'icicles' },
  cobweb: { make: 'cobweb' },
  starmobile: { make: 'starmobile' },
  dreamcatcher: { make: 'dreamcatcher' },
  furin: { make: 'furin' },
  hangplant: { make: 'hangplant' },
  wreath: { make: 'wreath' },
  schoolbell: { make: 'schoolbell' },
  neonsign: { make: 'neonsign' },
  jackpotsign: { make: 'jackpotsign' },
  centersign: { make: 'centersign' },
  gymsign: { make: 'gymsign' },
  fairsign: { make: 'fairsign' },
  awning: { make: 'awning' },
};

export const MAKES = {
  cuckooclock(K, s, W, D, L) {
    const wood = K.wood(), dark = K.wood(L.tone(K.pal.w, 0.7)), d = 0.14;
    // the house, its roof two boards meeting at the ridge, the bird's door open over the face
    bar(K, L, wood, [5, 21, 27, 45], d, 0, 0.01);
    for (const sg of [-1, 1]) {
      const len = Math.hypot(13, 12);
      K.put(L.rbox(u(len), u(2.6), d + 0.05, 0.01), dark, X(16 + sg * 6.2, W), Y(16.2), d / 2 + 0.01, 0, 0, sg * -Math.atan2(12, 13));
    }
    K.put(L.ball(u(1.6), 10, 8), K.gloss(K.pal.a), X(16, W), Y(9.6), d / 2 + 0.01);
    bar(K, L, K.plain('#2a1a10'), [13, 22, 19, 27], 0.012, d - 0.01);
    K.put(L.ball(u(1.8), 12, 8), K.gloss(K.pal.a), X(15.6, W), Y(25), d + 0.02);
    K.put(L.cyl(u(0.2), u(1.6), u(0.6), 8).rotateZ(Math.PI / 2), K.gloss('#f8a030'), X(13.6, W), Y(24.8), d + 0.03);
    ring(K, L, K.wood(L.tone(K.pal.w, 1.15)), 16, 35, 6.4, 5, d + 0.02);
    face(K, L, 16, 35, 5, d + 0.005, [[4, 0, 0.9], [5, Math.PI / 2, 0.7]], K.pal.p, false);
    for (const lx of [7, 23]) for (const a of [-0.6, 0, 0.6]) K.put(L.ball(u(2.4), 10, 8).scale(1.3, 0.55, 0.3), K.gloss(L.tone(K.pal.leaf, 1 + a * 0.2)), X(lx + a * 3, W), Y(44.4 - Math.abs(a) * 2), d + 0.01, 0, 0, a);
    // the chains under the house and their pine cone weights
    for (const [i, j1] of [[11.5, 59], [20.5, 55]]) {
      chain(K, L, K.metal(K.pal.m), i, 45, j1, 0.05, 0.7);
      K.put(L.lathe([[0, -u(4)], [u(2.4), -u(2.6)], [u(2.6), u(2)], [u(1.6), u(3.6)], [0, u(4)]], 14), K.metal(K.pal.a), X(i, W), Y(j1 + 4), 0.05);
    }
  },

  stationclock(K, s, W, D, L) {
    const m = K.metal(K.pal.m), z = 0.03;
    // a bracket down from the wall plate to the clock's drum
    bar(K, L, m, [10, 4, 22, 6], 0.03, 0, 0.006);
    bar(K, L, m, [14, 6, 18, 19], 0.06, 0, 0.01);
    K.put(L.cyl(u(14), 0.1, u(14), 48).rotateX(Math.PI / 2), m, X(16, W), Y(32), z + 0.05);
    ring(K, L, K.metal(BRASS), 16, 32, 14.3, 11.8, 0.15);
    face(K, L, 16, 32, 12, 0.132, [[8, 0, 1.6], [6.7, 2.03, 1.1], [9.4, -2.58, 0.5, '#e04848']]);
  },

  stopwatch(K, s, W, D, L) {
    const m = K.metal(K.pal.m), z = 0.05;
    K.put(L.cyl(u(2), u(6), u(2), 14), m, X(16, W), Y(24), z);
    K.put(L.rbox(u(8), u(3), u(4), 0.01), K.metal(K.pal.a), X(16, W), Y(17.5), z);
    K.put(L.cyl(u(1.6), u(4), u(1.6), 12).rotateZ(-Math.PI / 4), m, X(26, W), Y(26.5), z);
    K.put(L.rbox(u(4), u(2.6), u(3.4), 0.008).rotateZ(-Math.PI / 4), K.metal(K.pal.a), X(27.6, W), Y(24.6), z);
    K.put(L.cyl(u(13), 0.1, u(13), 48).rotateX(Math.PI / 2), m, X(16, W), Y(40), z);
    K.put(L.torus(u(12.6), u(1.4), Math.PI * 2, 48), K.metal(L.tone(K.pal.m, 1.25)), X(16, W), Y(40), z + 0.05);
    face(K, L, 16, 40, 10.5, z + 0.052, [[8, 0.54, 0.7, K.pal.c]], '#ffffff');
  },

  walllamp(K, s, W, D, L) {
    const m = K.metal(K.pal.m), zc = 0.17;
    bar(K, L, m, [12, 46, 20, 60], 0.025, 0, 0.008);
    // the arm out of the plate and up into the shade
    cord(K, L, m, [[16, 52, 0.02], [16, 50, zc * 0.7], [16, 44, zc], [16, 36, zc]], 1.4);
    K.put(L.cyl(u(5), u(2), u(7), 20), K.metal(L.tone(K.pal.a, 0.85)), X(16, W), Y(36), zc);
    K.put(L.ball(u(3.4), 14, 10).scale(1, 1.3, 1), K.glow(K.pal.gl), X(16, W), Y(29), zc);
    const shade = L.cyl(u(6), u(16), u(11.5), 32, true);
    const g = K.glow(K.pal.g);
    g.side = L.THREE.DoubleSide;
    K.put(shade, g, X(16, W), Y(27.5), zc);
    K.put(L.torus(u(6), u(0.5), Math.PI * 2, 32).rotateX(Math.PI / 2), K.metal(K.pal.a), X(16, W), Y(19.6), zc);
    K.put(L.torus(u(11.5), u(0.6), Math.PI * 2, 40).rotateX(Math.PI / 2), K.metal(K.pal.a), X(16, W), Y(35.4), zc);
  },

  walltorch(K, s, W, D, L) {
    const m = K.metal(K.pal.m), zc = 0.12;
    bar(K, L, m, [12, 46, 20, 58], 0.03, 0, 0.008);
    // the ring the stick rests in, the stick leaning out of it, its iron cup, the fire
    K.put(L.torus(u(2.4), u(0.7), Math.PI * 2, 16).rotateX(Math.PI / 2), m, X(16, W), Y(42), 0.07);
    K.put(L.rbox(u(3), u(4), 0.06, 0.006), m, X(16, W), Y(43), 0.03);
    cord(K, L, K.wood(), [[16, 48, 0.04], [16, 38, 0.08], [16, 29, zc]], 1.4);
    K.put(L.cyl(u(3.8), u(6), u(2.2), 16, true), m, X(16, W), Y(29), zc);
    K.put(L.torus(u(3.8), u(0.5), Math.PI * 2, 16).rotateX(Math.PI / 2), m, X(16, W), Y(26), zc);
    [['#f08030', 5, 18, 17], ['#f8d030', 3.6, 13, 19.5], ['#fff4c0', 2, 7, 22.5]].forEach(([c, r, h, j], n) => {
      K.put(L.lathe([[0, -u(h / 2)], [u(r), -u(h / 2) + u(r * 0.6)], [u(r * 0.7), 0], [u(r * 0.25), u(h * 0.3)], [0, u(h / 2)]], 18).scale(1, 1, 0.6), K.glow(c), X(16, W), Y(j), zc + n * u(2.2));
    });
    for (const [i, j] of [[10, 6], [22, 10], [18, 2]]) K.put(L.ball(u(0.7), 8, 6), K.glow('#f8d030'), X(i, W), Y(j), zc + (i - 16) * 0.004);
  },

  brasslantern(K, s, W, D, L) {
    const brass = K.metal(BRASS), dark = K.metal(L.tone(BRASS, 0.7)), zc = 0.36, rx = 11.6, ry = 12;
    arm(K, L, dark, 16, 1, zc);
    chain(K, L, brass, 16, 1, 14, zc);
    K.put(L.cyl(u(2), u(8), u(9), 24), dark, X(16, W), Y(18), zc);
    K.put(L.ball(u(rx), 32, 20).scale(1, ry / rx, 0.82), brass, X(16, W), Y(34), zc);
    K.put(L.cyl(u(9), u(6), u(3), 24), dark, X(16, W), Y(49), zc);
    K.put(L.cyl(u(0.8), u(4), u(0.8), 8), brass, X(16, W), Y(54), zc);
    K.put(L.ball(u(1.6), 12, 8).scale(1, 1.3, 1), brass, X(16, W), Y(57), zc);
    // the piercings: a lit dot on the brass wherever the painting has one
    for (let j = 0; j < 4; j++) for (let i = 0; i < 5; i++) {
      const px = 9.5 + i * 3 + (j % 2), py = 26 + j * 5, dx = (px - 16) / rx, dy = (py - 34) / ry, f = 1 - dx * dx - dy * dy;
      if (f <= 0.05) continue;
      const nz = Math.sqrt(f), z = zc + u(rx) * 0.82 * nz;
      K.put(L.ball(u(0.9), 8, 6).scale(1, 1.4, 0.4), K.glow('#fff0b0'), X(px, W), Y(py), z, Math.asin(dx) * 0.9, -Math.asin(dy) * 0.9);
    }
  },

  shiplantern(K, s, W, D, L) {
    const m = K.metal(K.pal.m), zc = 0.17, cx = 19;
    // a bracket out of the wall, the lantern hung from its end by a ring
    bar(K, L, m, [5, 11, 9, 21], 0.03, 0, 0.008);
    cord(K, L, m, [[7, 15.5, 0.03], [7, 15.5, 0.08], [12, 15.5, zc], [cx, 15.5, zc]], 1.2);
    K.put(L.torus(u(1.4), u(0.5), Math.PI * 2, 12), m, X(cx, W), Y(17.5), zc);
    K.put(L.cyl(u(1.4), u(5), u(6.5), 4).rotateY(Math.PI / 4), m, X(cx, W), Y(21), zc);
    K.put(L.rbox(u(12), u(3), u(12), 0.01), m, X(cx, W), Y(23.5), zc);
    K.put(L.rbox(u(8.6), u(17.6), u(8.6), 0.01), K.glow('#ffd890'), X(cx, W), Y(34), zc);
    K.put(L.ball(u(1.6), 12, 8).scale(1, 2.2, 1), K.glow('#fff4c0'), X(cx, W), Y(33.5), zc);
    K.put(L.rbox(u(10.2), u(18), u(10.2), 0.004), K.glass(), X(cx, W), Y(34), zc);
    for (const [dx, dz] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) K.put(L.rbox(u(1.2), u(18), u(1.2), 0.003), m, X(cx + dx * 4.8, W), Y(34), zc + dz * u(4.8));
    for (const j of [29, 37]) K.put(L.rbox(u(10.6), u(0.8), u(10.6), 0.003), m, X(cx, W), Y(j), zc);
    K.put(L.rbox(u(14), u(3), u(14), 0.01), m, X(cx, W), Y(44.5), zc);
  },

  chochin(K, s, W, D, L) {
    const ink = K.gloss(INK), zc = 0.34, sz = 0.8, rx = 12, ry = 20.5, cy = 36;
    arm(K, L, ink, 16, 2, zc);
    K.put(L.cyl(u(1), u(10), u(1), 8), ink, X(16, W), Y(7), zc);
    K.put(L.cyl(u(6), u(4), u(6), 24).scale(1, 1, sz), ink, X(16, W), Y(14), zc);
    K.put(L.ball(u(rx), 32, 24).scale(1, ry / rx, sz), K.glow(K.pal.c), X(16, W), Y(cy), zc);
    // the bamboo ribs that ring the paper
    for (let j = 18; j < 56; j += 5) {
      const f = 1 - ((j - cy) / ry) ** 2;
      if (f <= 0) continue;
      K.put(L.torus(u(rx * Math.sqrt(f) + 0.15), u(0.35), Math.PI * 2, 36).rotateX(Math.PI / 2).scale(1, 1, sz), K.glow(L.tone(K.pal.c, 0.7)), X(16, W), Y(j), zc);
    }
    // the character painted on it, laid on the paper's curve
    const box = [12, 25, 21, 41], c = keep(cut(K, L, box), near(INK, 120)), m = K.pic(c);
    m.alphaTest = 0.5;
    const g = new L.THREE.PlaneGeometry(u(9), u(16), 8, 12), pos = g.attributes.position;
    for (let n = 0; n < pos.count; n++) {
      const i = 16.5 + pos.getX(n) / u(1), j = 33 - pos.getY(n) / u(1), f = 1 - ((i - 16) / rx) ** 2 - ((j - cy) / ry) ** 2;
      pos.setZ(n, u(rx) * sz * Math.sqrt(Math.max(0, f)) + 0.004);
    }
    g.computeVertexNormals();
    K.put(g, m, X(16.5, W), Y(33), zc);
    K.put(L.cyl(u(6), u(4), u(6), 24).scale(1, 1, sz), ink, X(16, W), Y(58), zc);
    K.put(L.cyl(u(1), u(8), u(1), 8), K.cloth(K.pal.a), X(16, W), Y(64), zc);
    K.put(L.cyl(u(1.2), u(4), u(2.4), 12), K.cloth(K.pal.a), X(16, W), Y(69.5), zc);
  },

  ghostchandelier(K, s, W, D, L) {
    const m = K.metal(K.pal.m), zc = 0.3, sz = 0.42;
    arm(K, L, m, 32, 2, zc);
    K.put(L.cyl(u(1), u(20), u(1), 10), m, X(32, W), Y(13), zc);
    K.put(L.ball(u(9), 28, 16).scale(1, 0.62, 0.9), m, X(32, W), Y(28), zc);
    K.put(L.ball(u(3), 16, 12), m, X(32, W), Y(36), zc);
    for (const i of [29, 35]) K.put(L.ball(u(1.5), 12, 8).scale(1, 1, 0.5), K.glow('#f8d030'), X(i, W), Y(27), zc + u(9) * 0.86);
    // the arms curl out of the bowl to the candles round a ring, the inner pair set forward
    for (const [cx, cy, front] of [[10, 32, 0], [21, 26, 1], [43, 26, 1], [54, 32, 0]]) {
      const dz = front ? u(22) * sz : -u(6) * sz, sg = Math.sign(cx - 32), lift = cx === 21 || cx === 43 ? 14 : 10;
      cord(K, L, m, [[32 + sg * 4, 30, zc], [32 + sg * (Math.abs(cx - 32) * 0.45), 30 - lift, zc + dz * 0.5], [cx, cy - 2, zc + dz], [cx, cy + 1, zc + dz]], 0.9);
      K.put(L.cyl(u(2.6), u(2), u(1.4), 14), m, X(cx, W), Y(cy + 1), zc + dz);
      K.put(L.cyl(u(1.2), u(4), u(1.2), 10), K.plain('#eae4f4'), X(cx, W), Y(cy - 1.5), zc + dz);
      K.put(L.lathe([[0, -u(3)], [u(2.6), -u(1.4)], [u(2), u(1.4)], [u(0.8), u(3.4)], [0, u(5.2)]], 16), K.glow('#a868f8'), X(cx, W), Y(cy - 6.5), zc + dz);
      K.put(L.ball(u(1.2), 10, 8).scale(1, 1.5, 1), K.glow('#e0c8ff'), X(cx, W), Y(cy - 6.4), zc + dz + u(1.4));
    }
  },

  discoball(K, s, W, D, L) {
    const zc = 0.42, r = 12, cy = 31;
    arm(K, L, K.metal(SILVER), 16, 1, zc);
    K.put(L.cyl(u(0.4), u(18), u(0.4), 8), K.metal(SILVER), X(16, W), Y(10), zc);
    K.put(L.cyl(u(1.4), u(2), u(1.4), 10), K.metal(SILVER), X(16, W), Y(19), zc);
    // a ball of flat mirror tiles: every face its own normal, so each catches the light on its own
    const g = new L.THREE.SphereGeometry(u(r), 24, 16).toNonIndexed();
    g.computeVertexNormals();
    K.put(g, K.metal(SILVER), X(16, W), Y(cy), zc);
    for (let n = 0; n < 26; n++) {
      const a = K.r() * Math.PI * 2, e = (K.r() - 0.5) * 2.4, nx = Math.cos(e) * Math.sin(a), ny = Math.sin(e), nz = Math.cos(e) * Math.cos(a);
      if (nz < 0) continue;
      K.put(L.rbox(u(2.4), u(2.4), 0.004, 0.002), K.glow('#f0f8ff'), X(16 + nx * r * 1.01, W), Y(cy - ny * r * 1.01), zc + nz * u(r) * 1.01, Math.atan2(nx, nz), -e);
    }
    // glints thrown about it
    for (const [i, j] of [[3, 50], [28, 46], [6, 12], [27, 14]]) for (const rz of [0, Math.PI / 2]) K.put(L.rbox(u(3), u(0.6), 0.004, 0.002), K.glow('#f0f8ff'), X(i, W), Y(j), 0.03, 0, 0, rz);
  },

  cafebulbs(K, s, W, D, L) {
    const j = sag(59, 16, 16), at = (x) => j(x - 2), z = string(K, L, K.gloss('#3a3a40'), 2, 61, at, 0.1);
    for (let i = 4; i < 60; i += 10) bulb(K, L, 2 + i, at(2 + i) + 6, z(2 + i), '#f8d890');
  },

  fairylights(K, s, W, D, L) {
    const cs = [K.pal.c, '#fff4a0', K.pal.a, '#a0e0f8'];
    for (const [top, dip, out] of [[16, 10, 0.05], [30, 12, 0.09]]) {
      const j = sag(59, top, dip), at = (x) => j(x - 2), z = string(K, L, K.gloss(L.tone(K.pal.m, 1.3)), 2, 61, at, out, 0.35);
      for (let i = 3, n = 0; i < 60; i += 6, n++) {
        const x = 2 + i;
        K.put(L.cyl(u(0.7), u(1.4), u(0.7), 8), K.gloss(K.pal.m), X(x, W), Y(at(x) + 1.2), z(x));
        K.put(L.ball(u(1.5), 12, 8).scale(1, 1.25, 1), K.glow(cs[(n + top) % 4]), X(x, W), Y(at(x) + 3), z(x));
      }
    }
  },

  lanternstring(K, s, W, D, L) {
    const j = sag(60, 14, 6), at = (x) => j(x - 2), ink = K.gloss(INK), z = string(K, L, ink, 2, 62, at, 0.1);
    [8, 22, 36, 50].forEach((i, n) => {
      const t = j(i) + 2, c = [K.pal.c, '#f8d030', K.pal.a, '#f08030'][n], zz = z(i) + u(5) * 0.9;
      cord(K, L, ink, [[i, at(i), z(i)], [i, t + 2, zz]], 0.4);
      K.put(L.cyl(u(3.4), u(2), u(3.4), 18), ink, X(i, W), Y(t + 3), zz);
      K.put(L.ball(u(6), 24, 16).scale(1, 7 / 6, 0.85), K.glow(c), X(i, W), Y(t + 10), zz);
      for (const jj of [6, 10, 14]) {
        const f = 1 - ((jj - 10) / 7) ** 2;
        K.put(L.torus(u(6 * Math.sqrt(f) + 0.1), u(0.3), Math.PI * 2, 28).rotateX(Math.PI / 2).scale(1, 1, 0.85), K.glow(L.tone(c, 0.75)), X(i, W), Y(t + jj), zz);
      }
      K.put(L.cyl(u(3.4), u(2), u(3.4), 18), ink, X(i, W), Y(t + 17.5), zz);
      K.put(L.cyl(u(0.5), u(4), u(1.1), 8), K.cloth(K.pal.c), X(i, W), Y(t + 21), zz);
    });
  },

  bunting(K, s, W, D, L) {
    const j = sag(60, 16, 8), at = (x) => j(x - 2), z = string(K, L, K.gloss(L.tone(K.pal.m, 1.3)), 2, 62, at, 0.08, 0.4);
    for (let n = 0; n < 7; n++) {
      const i = 4 + n * 8, top = j(i) + 1, c = [K.pal.c, K.pal.a, K.pal.p][n % 3];
      // a pennant folded over the string, hanging in a gentle curl
      const sh = new L.THREE.Shape([[-u(3.5), 0], [u(3.5), 0], [0, -u(9)]].map(([a, b]) => new L.THREE.Vector2(a, b)));
      const g = new L.THREE.ExtrudeGeometry(sh, { depth: 0.006, bevelEnabled: false });
      g.rotateX(0.12 * (n % 2 ? 1 : -1));
      K.put(g, K.cloth(c), X(i, W), Y(top - 0.5), z(i + 2) - 0.003);
      K.put(L.rbox(u(7.2), u(1.2), 0.012, 0.004), K.cloth(L.tone(c, 1.15)), X(i, W), Y(top), z(i + 2));
    }
  },

  batgarland(K, s, W, D, L) {
    const at = (x) => 18 + Math.round(Math.sin((x - 2) / 59 * Math.PI) * 14), z = string(K, L, K.gloss(L.tone(K.pal.m, 1.3)), 2, 61, at, 0.08, 0.4);
    [8, 24, 40, 54].forEach((i, n) => {
      const y = 18 + Math.round(Math.sin((i - 2) / 59 * Math.PI) * 14), zz = z(i) + 0.005;
      card(K, L, [i - 6.5, y + 0.5, i + 3.5, y + 6.5], zz, 0.024, (n % 2 ? 1 : -1) * 0.12, (n % 2 ? -1 : 1) * 0.3);
      for (const dx of [-1, 1]) K.put(L.ball(u(0.6), 8, 6), K.glow('#f8d030'), X(i + dx - 0.5, W), Y(y + 3.5), zz + 0.03);
    });
  },

  snowgarland(K, s, W, D, L) {
    const j = sag(59, 18, 10), at = (x) => j(x - 2), m = K.gloss(L.tone(K.pal.m, 1.3)), z = string(K, L, m, 2, 61, at, 0.08, 0.4);
    [8, 22, 38, 52].forEach((i, n) => {
      const t = j(i - 2), cx = i + 0.5, cy = t + 8.5, zz = z(i) + 0.01, c = K.gloss(n % 2 ? K.pal.c : '#ffffff');
      cord(K, L, m, [[i + 0.5, at(i), z(i)], [cx, cy - 4.5, zz]], 0.25);
      // six arms, each with a pair of twigs and a bead at its tip, turned a little each
      for (let a = 0; a < 6; a++) {
        const ang = a * Math.PI / 3 + n * 0.3;
        const arm = L.rbox(u(0.8), u(4.6), 0.012, 0.003); arm.translate(0, u(2.3), 0); arm.rotateZ(ang);
        K.put(arm, c, X(cx, W), Y(cy), zz);
        for (const sg of [-1, 1]) {
          const tw = L.rbox(u(0.6), u(1.8), 0.01, 0.003); tw.translate(0, u(0.9), 0); tw.rotateZ(sg * 0.7); tw.translate(0, u(2.4), 0); tw.rotateZ(ang);
          K.put(tw, c, X(cx, W), Y(cy), zz);
        }
        K.put(L.ball(u(0.7), 8, 6), c, X(cx - Math.sin(ang) * 4.6, W), Y(cy - Math.cos(ang) * 4.6), zz);
      }
      K.put(L.cyl(u(1.2), 0.016, u(1.2), 6).rotateX(Math.PI / 2), c, X(cx, W), Y(cy), zz);
    });
  },

  mittenline(K, s, W, D, L) {
    const j = sag(56, 18, 6), at = (x) => j(x - 4), m = K.metal(K.pal.m);
    for (const i of [3, 61]) bar(K, L, m, [i - 1, 16, i + 1, 22], 0.04, 0, 0.006);
    const z = string(K, L, K.gloss(L.tone(K.pal.m, 1.3)), 3, 61, at, 0.08, 0.4);
    [[4, K.pal.c], [16, K.pal.c], [32, K.pal.a], [44, K.pal.a]].forEach(([i, c], n) => {
      const t = j(i + 4) + 1, cx = 8 + i, zz = z(cx) + 0.025, wool = K.cloth(c), tilt = (n % 2 ? 1 : -1) * 0.08;
      K.put(L.rbox(u(1.4), u(3.6), u(1.8), 0.004), K.wood(), X(cx, W), Y(t + 0.4), zz + 0.01);
      K.put(L.ball(u(4), 18, 12).scale(1, 1.3, 0.42), wool, X(cx, W), Y(t + 5.4), zz, 0, 0, tilt);
      K.put(L.ball(u(1.8), 12, 8).scale(1, 1.4, 0.55), wool, X(cx + 3.6, W), Y(t + 6), zz, 0, 0, -0.4);
      K.put(L.cyl(u(4.2), u(3.2), u(4.2), 20).scale(1, 1, 0.5), K.cloth(K.pal.p), X(cx - Math.sin(tilt) * 6, W), Y(t + 11), zz, 0, 0, tilt);
      K.put(L.ball(u(1.4), 10, 8), K.cloth(K.pal.p), X(cx - 1, W), Y(t + 5.4), zz + u(1.7), 0, 0, 0);
    });
  },

  washingline(K, s, W, D, L) {
    const j = sag(56, 18, 6), at = (x) => j(x - 4), m = K.metal(K.pal.m);
    for (const i of [3, 61]) bar(K, L, m, [i - 1, 16, i + 1, 24], 0.04, 0, 0.006);
    const z = string(K, L, K.gloss(L.tone(K.pal.m, 1.3)), 3, 61, at, 0.08, 0.4);
    const peg = K.wood(K.pal.a);
    // each thing a sheet of its painting hung in folds, pegged where it meets the line
    let t = j(6), zz = z(15) + 0.012;
    drape(K, L, [3.5, t + 0.6, 26.5, t + 16.5], (fx, fy) => zz + Math.sin(fx * Math.PI * 4) * 0.006 + fy * fy * 0.03, 0, [18, 14]);
    for (const i of [9.5, 20.5]) K.put(L.rbox(u(1.4), u(3.6), u(1.6), 0.004), peg, X(i, W), Y(t), zz + 0.008);
    t = j(28); zz = z(34) + 0.012;
    drape(K, L, [30.5, t + 0.6, 39.5, t + 13.5], (fx, fy) => zz + Math.sin(fy * Math.PI) * 0.012 + fx * 0.008, 0, [6, 10]);
    K.put(L.rbox(u(1.4), u(3.6), u(1.6), 0.004), peg, X(33, W), Y(t), zz + 0.008);
    t = j(42); zz = z(50) + 0.012;
    drape(K, L, [44, t + 0.6, 56, t + 18], (fx, fy) => zz + Math.sin(fx * Math.PI * 3) * 0.005 + fy * 0.02, 0, [10, 12]);
    for (const i of [45.5, 54.5]) K.put(L.rbox(u(1.4), u(3.6), u(1.6), 0.004), peg, X(i, W), Y(t), zz + 0.008);
  },

  stringpearls(K, s, W, D, L) {
    const zc = 0.27, pearl = [K.gloss(K.pal.leaf), K.gloss(L.tone(K.pal.leaf, 1.25))];
    hungPot(K, L, 16, 28, 9, 6, 24, 9, zc, K.pal.pot);
    K.put(L.ball(u(8), 18, 10).scale(1, 0.4, 0.8), K.gloss(L.tone(K.pal.leaf, 0.8)), X(16, W), Y(23.5), zc);
    for (let s2 = 0; s2 < 9; s2++) {
      const a = -1.2 + s2 * 0.3, i = 16 + Math.sin(a) * 8, z = zc + Math.cos(a) * u(8) * 0.8, len = 30 + hash(s2 % 7, 3) * 30;
      strand(K, L, i, 30, len, z, 1.3, 3, pearl, 1.6, s2);
    }
  },

  icicles(K, s, W, D, L) {
    bar(K, L, K.wood(), [0, 8, 64, 13], 0.16, 0, 0.012);
    K.put(L.rbox(u(64), u(3.4), 0.15, 0.02), K.gloss('#f4faff'), X(32, W), Y(13.4), 0.085);
    for (let n = 0; n < 16; n++) K.put(L.ball(u(2.2), 10, 8).scale(1.4, 0.7, 1), K.gloss('#f4faff'), X(2 + n * 4, W), Y(14.6 + hash(n, 2) * 1.4), 0.08 + hash(n, 4) * 0.06);
    const ice = K.gloss(ICE);
    for (let n = 0; n < 12; n++) {
      const i = 4 + n * 5, len = 6 + Math.floor(hash(n, 5) * 18), z = 0.06 + hash(n, 9) * 0.07;
      K.put(L.lathe([[u(1.6), 0], [u(1.4), -u(len * 0.3)], [u(0.8), -u(len * 0.7)], [0, -u(len)]], 12), ice, X(i, W), Y(15), z);
    }
  },

  cobweb(K, s, W, D, L) {
    const web = K.gloss(WEB), cx = 1, cy = 12;
    // the spokes fan out of the corner and the web bellies out from the wall between them
    const at = (a, r) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r, 0.006 + Math.sin(Math.min(1, r / 24) * Math.PI) * 0.03 * (0.4 + Math.sin(a * 2))];
    for (let a = 0; a < 6; a++) {
      const ang = a / 5 * Math.PI / 2, pts = [];
      for (let r = 0; r <= 30; r += 5) pts.push(at(ang, r));
      cord(K, L, web, pts, 0.18);
    }
    for (let rr = 6; rr < 30; rr += 6) for (let a = 0; a < 5; a++) {
      const a0 = a / 5 * Math.PI / 2, a1 = (a + 1) / 5 * Math.PI / 2, pts = [];
      for (let s2 = 0; s2 <= 4; s2++) { const t = s2 / 4; pts.push(at(a0 + (a1 - a0) * t, rr - Math.sin(t * Math.PI) * 2)); }
      cord(K, L, web, pts, 0.14);
    }
    // the spider down its thread
    const z0 = at(Math.atan2(30 - cy, 18 - cx), Math.hypot(18 - cx, 30 - cy))[2], zs = 0.05, body = K.gloss(INK);
    cord(K, L, web, [[18, 30, z0], [18, 40, zs]], 0.14);
    K.put(L.ball(u(2.6), 14, 10).scale(1, 1, 0.8), body, X(18, W), Y(43.5), zs);
    K.put(L.ball(u(1.7), 12, 8), body, X(18, W), Y(40.6), zs + 0.01);
    for (const i of [17.2, 18.8]) K.put(L.ball(u(0.45), 8, 6), K.glow('#e04848'), X(i, W), Y(40.4), zs + u(1.7) + 0.008);
    for (const sg of [-1, 1]) for (let n = 0; n < 4; n++) {
      const y = 41 + n * 1.4;
      cord(K, L, body, [[18 + sg * 1.6, y, zs + 0.01], [18 + sg * 3.6, y - 1.6 + n * 0.4, zs + 0.03], [18 + sg * 5, y + 1.2 + n * 0.6, zs]], 0.25);
    }
  },

  starmobile(K, s, W, D, L) {
    const wood = K.wood(), zc = 0.16, thread = K.plain('#c8c8d0');
    arm(K, L, wood, 16, 9, zc);
    K.put(L.cyl(u(0.8), u(4), u(0.8), 8), wood, X(16, W), Y(12), zc);
    K.put(L.cyl(u(0.9), u(22), u(0.9), 10).rotateZ(Math.PI / 2), wood, X(16, W), Y(15), zc);
    for (const i of [5, 27]) K.put(L.ball(u(1.4), 10, 8), K.gloss(K.pal.a), X(i, W), Y(15), zc);
    for (const [i, y, kind, c, rz] of [[7, 26, 'moon', K.pal.a, -0.2], [16, 36, 'star', K.pal.c, 0.15], [25, 24, 'star', K.pal.a, -0.25]]) {
      cord(K, L, thread, [[i, 16, zc], [i, y + 0.5, zc]], 0.15);
      const m = K.gloss(c);
      if (kind === 'star') { star(K, L, m, i, y + 4.5, 5, zc - 0.012, 0.024); continue; }
      const sh = new L.THREE.Shape(), hole = new L.THREE.Path();
      sh.absarc(0, 0, u(4.5), 0, Math.PI * 2, false);
      hole.absarc(u(2.2), u(0.6), u(3.8), 0, Math.PI * 2, true);
      sh.holes.push(hole);
      K.put(new L.THREE.ExtrudeGeometry(sh, { depth: 0.024, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.005, bevelSegments: 2, curveSegments: 28 }), m, X(i, W), Y(y + 4.5), zc - 0.012, 0, 0, rz);
    }
  },

  dreamcatcher(K, s, W, D, L) {
    const cord1 = K.plain(K.pal.p), z = 0.03, cy = 30;
    cord(K, L, cord1, [[16, 12, 0.01], [16, 19.5, z]], 0.6);
    K.put(L.torus(u(10.6), u(1.2), Math.PI * 2, 48), K.wood(), X(16, W), Y(cy), z);
    // the web: spokes to a ring of knots and the bead in the middle
    for (let a = 0; a < 8; a++) {
      const t = a / 8 * Math.PI * 2, t2 = (a + 0.5) / 8 * Math.PI * 2;
      cord(K, L, cord1, [[16 + Math.cos(t) * 10, cy + Math.sin(t) * 10, z], [16 + Math.cos(t2) * 5, cy + Math.sin(t2) * 5, z], [16, cy, z]], 0.18);
      cord(K, L, cord1, [[16 + Math.cos(t2) * 5, cy + Math.sin(t2) * 5, z], [16 + Math.cos(t2 + Math.PI / 4) * 5, cy + Math.sin(t2 + Math.PI / 4) * 5, z]], 0.18);
    }
    K.put(L.ball(u(1.6), 12, 8), K.gloss(K.pal.a), X(16, W), Y(cy), z);
    for (const [i, len] of [[9, 14], [16, 20], [23, 14]]) {
      const zz = z + 0.01;
      cord(K, L, cord1, [[i, 39.5, z], [i, 41 + len, zz]], 0.3);
      K.put(L.ball(u(1.5), 12, 8), K.gloss(K.pal.a), X(i, W), Y(41 + len / 2), zz);
      // a feather: a quill and its vane, curled a little
      const f = L.ball(u(2.2), 16, 10).scale(1, 2.6, 0.22);
      K.put(f, K.cloth(K.pal.c), X(i, W), Y(41 + len + 5), zz, (i - 16) * 0.04, 0.2);
      K.put(L.cyl(u(0.25), u(11), u(0.2), 6), K.plain(L.tone(K.pal.c, 0.7)), X(i, W), Y(41 + len + 5), zz + 0.008);
    }
  },

  furin(K, s, W, D, L) {
    const thread = K.plain('#d8d8d8'), zc = 0.12;
    arm(K, L, thread, 16, 4, zc, 0.6);
    cord(K, L, thread, [[16, 4.5, zc], [16, 18.5, zc]], 0.3);
    // the glass bell, its painted goldfish inside, the clapper and the paper strip the wind catches
    const bell = (k) => L.lathe([[u(0.8), 0], [u(3.4), -u(2)], [u(6.2), -u(6)], [u(8), -u(11.6)], [u(7.6), -u(12)]].map(([r, y]) => [r * k, y]), 32);
    const g = K.glass(); g.side = L.THREE.DoubleSide;
    K.put(bell(0.97), K.gloss('#c8e8f8'), X(16, W), Y(18), zc);
    K.put(bell(1.02), g, X(16, W), Y(18), zc);
    K.put(L.ball(u(1.6), 12, 8).scale(1.5, 0.8, 0.4), K.gloss('#f08030'), X(14, W), Y(26.6), zc + u(6.6));
    K.put(L.cyl(u(0.1), u(1.6), u(1), 8).rotateZ(Math.PI / 2), K.gloss('#f08030'), X(16.4, W), Y(26.6), zc + u(6.3));
    cord(K, L, thread, [[16, 18.5, zc], [16, 36, zc]], 0.25);
    K.put(L.ball(u(1.4), 10, 8), K.gloss('#e8e8f0'), X(16, W), Y(30), zc);
    drape(K, L, [11, 36, 21, 60], (fx, fy) => zc - 0.01 + Math.sin(fy * Math.PI * 0.9) * 0.025 + (fx - 0.5) * fy * 0.03, 0.04, [6, 16]);
  },

  hangplant(K, s, W, D, L) {
    const zc = 0.28, leaves = [K.gloss(K.pal.leaf), K.gloss(L.tone(K.pal.leaf, 0.75))];
    hungPot(K, L, 16, 32, 10, 6, 29, 8, zc, K.pal.pot);
    for (const [i, l] of [[6, 22], [10, 30], [16, 26], [21, 32], [26, 20]]) {
      const a = (i - 16) / 11, z = zc + Math.cos(a) * u(10) * 0.7;
      strand(K, L, 16 + Math.sin(a) * 10, 33, l, z, 2, 3, leaves, 1.2, i, true);
    }
    for (let n = 0; n < 11; n++) {
      const a = n / 11 * Math.PI * 2, rr = 2 + hash(n, 4) * 4;
      K.put(L.ball(u(2.6 + hash(n, 6) * 1.4), 12, 8).scale(1, 0.75, 1), leaves[n % 2], X(16 + Math.cos(a) * rr, W), Y(26 - hash(n, 2) * 4), zc + Math.sin(a) * u(rr) * 0.8);
    }
  },

  wreath(K, s, W, D, L) {
    const cx = 16, cy = 38, z = 0.05;
    K.put(L.torus(u(10), u(3), Math.PI * 2, 40).scale(1, 1, 0.8), K.cloth(L.tone(K.pal.leaf, 0.6)), X(cx, W), Y(cy), z);
    // a crown of leaves round the ring, berries tucked in, a bow at its foot
    for (let a = 0; a < 40; a++) {
      const ang = a / 40 * Math.PI * 2, rr = 10 + (hash(a, 3) - 0.5) * 4, zz = z + 0.03 + hash(a, 5) * 0.04;
      K.put(L.ball(u(2.6), 10, 6).scale(1.4, 0.6, 0.35), K.gloss(L.tone(K.pal.leaf, a % 2 ? 1 : 0.8)), X(cx + Math.cos(ang) * rr, W), Y(cy + Math.sin(ang) * rr), zz, 0, 0.3, -ang + (hash(a, 7) - 0.5));
    }
    for (const a of [0.3, 1.4, 2.4, 3.6, 4.7, 5.6]) K.put(L.ball(u(1.8), 12, 8), K.gloss(K.pal.c), X(cx + Math.cos(a) * 10, W), Y(cy + Math.sin(a) * 10), z + 0.08);
    const bow = K.cloth(K.pal.a);
    for (const sg of [-1, 1]) K.put(L.torus(u(2.6), u(1.3), Math.PI * 2, 18).scale(1.3, 0.9, 0.6), bow, X(cx + sg * 4.6, W), Y(50), z + 0.08, 0, 0, sg * 0.3);
    K.put(L.ball(u(2.2), 12, 8).scale(1, 1.1, 0.7), bow, X(cx, W), Y(50.5), z + 0.09);
    for (const sg of [-1, 1]) K.put(L.rbox(u(2.2), u(8), u(0.8), 0.003), bow, X(cx + sg * 2.4, W), Y(56.5), z + 0.07, 0, 0.15, sg * -0.25);
  },

  schoolbell(K, s, W, D, L) {
    const zc = 0.03, m = K.metal(K.pal.m);
    bar(K, L, K.wood(), [11, 15, 21, 23], 0.05, 0, 0.01);
    K.put(L.rbox(u(2), u(5), u(2), 0.004), m, X(16, W), Y(24.5), 0.025);
    // the gong: a dome of brass facing out from its plate, the striker under it
    K.put(L.cyl(u(10), 0.02, u(10), 32).rotateX(Math.PI / 2), m, X(16, W), Y(36), zc - 0.01);
    const dome = new L.THREE.SphereGeometry(u(11), 40, 16, 0, Math.PI * 2, 0, Math.PI * 0.42);
    dome.scale(1, 0.55, 1); dome.translate(0, -u(11) * 0.55 * Math.cos(Math.PI * 0.42), 0); dome.rotateX(Math.PI / 2);
    K.put(dome, K.metal(K.pal.a), X(16, W), Y(36), zc);
    K.put(L.cyl(u(2), 0.03, u(2), 16).rotateX(Math.PI / 2), K.metal(L.tone(K.pal.a, 0.7)), X(16, W), Y(36), zc + 0.12);
    K.put(L.rbox(u(1.2), u(5), u(1.2), 0.003), m, X(16, W), Y(49), 0.14);
    K.put(L.ball(u(2), 12, 8), m, X(16, W), Y(52), 0.14);
    K.put(L.rbox(u(1.4), u(1.4), 0.13, 0.003), m, X(16, W), Y(51.5), 0.07);
  },

  neonsign(K, s, W, D, L) {
    const d = 0.06;
    bar(K, L, K.gloss('#1a1428'), [2, 20, 62, 62], d, 0, 0.012);
    pic(K, L, [3, 21, 61, 61], d + 0.001);
    lift(K, L, [8, 24, 56, 46], near('#f858c8', 110), d + 0.006, 4);
    K.put(L.cyl(u(1), u(44), u(1), 12).rotateZ(Math.PI / 2), K.glow('#58f0f8'), X(32, W), Y(49), d + 0.02);
    K.put(L.cyl(u(0.2), u(3.6), u(4), 3).rotateY(Math.PI / 3), K.glow('#58f0f8'), X(32, W), Y(54), d + 0.02);
    for (const [i, j] of [[5, 23], [58, 23], [5, 58], [58, 58]]) K.put(L.ball(u(1), 10, 6).scale(1, 1, 0.5), K.metal(CHROME), X(i + 0.5, W), Y(j + 0.5), d);
  },

  jackpotsign(K, s, W, D, L) {
    const d = 0.06;
    bar(K, L, K.gloss('#1a1020'), [2, 16, 62, 62], d, 0, 0.012);
    pic(K, L, [3, 17, 61, 61], d + 0.001);
    lift(K, L, [12, 19, 54, 40], near('#ff6060', 120), d + 0.006, 4);
    lift(K, L, [16, 42, 50, 52], near('#ffd84a', 90), d + 0.004, 3);
    for (let n = 0; n < 14; n++) K.put(L.ball(u(1.3), 12, 8), K.glow(n % 2 ? '#ffd84a' : '#f858c8'), X(6 + n * 4.1, W), Y(55), d + 0.01);
    for (const box of [[2, 16, 62, 18], [2, 60, 62, 62], [2, 18, 4, 60], [60, 18, 62, 60]]) bar(K, L, K.metal(BRASS), box, d + 0.015, 0, 0.006);
  },

  centersign(K, s, W, D, L) {
    const d = 0.07, red = K.gloss(K.pal.c);
    for (const i of [10.5, 54.5]) { eye(K, L, i, 13); cord(K, L, K.metal(K.pal.m), [[i, 13.5, 0.012], [i, 20.5, d / 2]], 0.4); }
    bezel(K, L, red, [4, 20, 60, 56], [7, 26, 57, 52], d, 0.012);
    bar(K, L, K.gloss(L.tone(K.pal.c, 1.25)), [6, 21.5, 58, 24.5], d + 0.012, 0, 0.006);
    bar(K, L, K.gloss(L.tone(K.pal.c, 0.75)), [7, 26, 57, 52], d - 0.025, 0, 0.006);
    pokeball(K, L, 20, 39, 8.6, d - 0.025 + u(4));
    lift(K, L, [32, 31, 58, 48], (r, g, b) => r > 215 && g > 215 && b > 215, d - 0.02, 4, 0.009);
  },

  gymsign(K, s, W, D, L) {
    const d = 0.07, gold = K.metal(K.pal.a);
    bezel(K, L, gold, [4, 20, 60, 56], [8, 24, 56, 52], d, 0.012);
    bar(K, L, K.wood(L.tone(K.pal.w, 0.6)), [8, 24, 56, 52], d - 0.03, 0, 0.006);
    pic(K, L, [9, 25, 55, 51], d - 0.029);
    lift(K, L, [12, 28, 56, 47], near(K.pal.a, 90), d - 0.026, 4, 0.01);
    for (const [i, j] of [[6, 22], [58, 22], [6, 54], [58, 54]]) K.put(L.ball(u(1), 10, 6).scale(1, 1, 0.5), K.metal(L.tone(K.pal.a, 1.2)), X(i, W), Y(j), d);
  },

  fairsign(K, s, W, D, L) {
    const d = 0.06, m = K.metal(K.pal.m);
    for (const i of [11, 53]) bar(K, L, m, [i - 1, 46, i + 1, 70], 0.04, 0, 0.008);
    // the board's arched top, cut to the painting's own outline
    const top = (i) => 22 - Math.sin(i / 55 * Math.PI) * 8, pts = [[4, 48], [60, 48]];
    for (let i = 55; i >= 0; i -= 2.5) pts.push([4 + i, top(i)]);
    const sh = new L.THREE.Shape(pts.map(([i, j]) => new L.THREE.Vector2(X(i, W), Y(j))));
    K.put(new L.THREE.ExtrudeGeometry(sh, { depth: d - 0.016, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2 }), K.gloss(K.pal.c), 0, 0, 0.008);
    drape(K, L, [4, 13, 60, 48], () => d + 0.001, 0, [1, 1]);
    lift(K, L, [8, 24, 56, 46], near(K.pal.p, 60), d + 0.005, 4, 0.008);
    for (let i = 0; i < 56; i += 5) {
      K.put(L.ball(u(1.2), 10, 8), K.glow('#fff4c0'), X(6 + i, W), Y(46), d + 0.01);
      K.put(L.ball(u(1.2), 10, 8), K.glow('#fff4c0'), X(6 + i, W), Y(top(i + 2) + 1.6), d + 0.005);
    }
  },

  awning(K, s, W, D, L) {
    const m = K.metal(K.pal.m), out = 0.34, len = Math.hypot(u(14), out), tilt = -Math.atan2(out, u(14));
    bar(K, L, m, [0, 12, 64, 14], 0.05, 0, 0.01);
    // stripes running out and down from the rod, a scalloped valance hanging off the front
    for (let i = 0; i < 8; i++) {
      const c = K.cloth(i % 2 ? K.pal.c : K.pal.p);
      K.put(L.rbox(u(8), len, 0.012, 0.003), c, X(i * 8 + 4, W), Y(21), 0.04 + out / 2, 0, tilt);
      const v = new L.THREE.Shape();
      v.moveTo(-u(4), u(1)); v.lineTo(u(4), u(1)); v.lineTo(u(4), 0); v.absarc(0, 0, u(4), 0, -Math.PI, true); v.lineTo(-u(4), u(1));
      K.put(new L.THREE.ExtrudeGeometry(v, { depth: 0.01, bevelEnabled: false, curveSegments: 14 }), c, X(i * 8 + 4, W), Y(28.2), 0.04 + out - 0.004);
    }
    for (const i of [3, 61]) cord(K, L, m, [[i, 36, 0.01], [i, 28.6, 0.04 + out - 0.02]], 0.5);
    rod(K, L, m, 0.5, 63.5, 28, 0.6, 0.04 + out - 0.01, null);
  },
};
