/* base-models-y2.js  -  the backyard's statues and lights (the Statues and Lights tabs of Smeargle's garden catalogue,
   js/garden-shop.js), painted in js/base-furniture-yard5.js; js/base-models-f.js's head says how a batch works. The user's
   ask of 2026-10-16: "3D detailed CLEAN models ... optimise them", a catalogue as big as Animal Crossing's.
   - A Pokémon statue is its own sprite in stone (the topiary in hedge greens) on a plinth in the theme's colours, like
     the gyms' statues (js/base-figures.js; the user's ask, 2026-10-16: the sculpted ones read oddly). Sizes are painted
     pixels (32 a tile): x from the painting's left, y up from the floor, z out of the front.
   - The rest (the Poké Ball monument, the stone circle, the obelisk, the podium) and the lights are built part by part,
     every lamp lit (`K.glow`) for js/base-play.js's `light`. */

import { tube, rod, pokeBall, ballTop } from './base-models-kit.js';
import { FIGURES, figureOf, figureAt } from './base-figures.js';

const u = (n) => n / 32;
const X = (n, W = 1) => n / 32 - W / 2;
const TAU = Math.PI * 2;
export const EYE = '#34343e', INK = '#2c2c34', SOIL = '#5a3c26', GOLD = '#e8c040', WICKER = '#b08048';
export const FLAMES = ['#f86030', '#f8a030', '#f8e070'];
export const LANTURN = { body: '#4a78c8', belly: '#f0d878', lure: '#fff070', lit: '#fffbc0' };
export const CHINCHOU = { body: '#4a80d8', eye: '#f8e070', orb: '#f8e860', lit: '#fff8c0' };
export const MORELULL = { cap: '#c8a0f0', spot: '#f4ecff', stem: '#f0e8d8' };
export const FIREFLY = ['#d8f860', '#f8ffc0'];

/* ---------- the parts built by hand (their paintings read these too) ---------- */
/** The podium's numbers, bars [x, y, w, h] in a 7 x 11 box. */
export const DIGITS = {
  1: [[2.5, 0, 2, 11], [0.5, 8.5, 2.5, 2], [0.5, 0, 6, 2]],
  2: [[0, 9, 7, 2], [5, 5.5, 2, 4.5], [0, 4.5, 7, 2], [0, 0.5, 2, 4.5], [0, 0, 7, 2]],
  3: [[0, 9, 7, 2], [5, 0, 2, 11], [1.5, 4.5, 5.5, 2], [0, 0, 7, 2]],
};
/** The podium's steps: [x0, x1, height, place]. */
export const PODIUM = [[3, 22, 20, 2], [22, 42, 30, 1], [42, 61, 14, 3]];
/** A step's number shrunk to fit a low step. */
export const digitScale = (h) => Math.min(1, (h - 6) / 11);
/** The badge obelisk: its shaft's half-width at y, and its eight badges [y, sides, palette key]. */
export const OBELISK = { y0: 10, y1: 76, top: 86, hw0: 7, hw1: 4.5, badges: [[16, 12, 'c'], [23.5, 4, 'a'], [31, 6, 'g'], [38.5, 8, 'leaf'], [46, 12, 'pot'], [53.5, 4, 'c'], [61, 6, 'a'], [68.5, 8, 'w']] };
export const obeliskHw = (y) => OBELISK.hw0 + (OBELISK.hw1 - OBELISK.hw0) * (y - OBELISK.y0) / (OBELISK.y1 - OBELISK.y0);
/** The Unown stone circle: six stones round a ring (angle, height), each carved with a glyph: an eye and its strokes. */
export const UNOWN = { R: 22, w: 10, d: 5, stones: [[30, 26, 0], [90, 30, 1], [150, 24, 2], [210, 28, 3], [270, 32, 4], [330, 22, 5]].map(([a, h, g]) => ({ a: a * Math.PI / 180, h, g })),
  glyphs: [[[-1.8, -1.8, -3.5, -7], [1.8, -1.8, 3.5, -7]], [[0, 3, 0, 7], [0, -3, 0, -7]], [[-2.6, 0, -2.6, 6], [2.6, 0, 2.6, 6]],
    [[-3, 0, -6, 0], [3, 0, 6, 0], [0, -3, 0, -6]], [[0, 3, 3, 6], [0, -3, -3, -6]], [[2, -2, 4, -6], [4, -6, 1, -8]]] };
/** A stone's turn (its carved face out of the ring), centre and front-view half-width. */
export function unownStone(s) {
  const turn = Math.PI / 2 - s.a, x = 32 + Math.cos(s.a) * UNOWN.R, z = Math.sin(s.a) * UNOWN.R;
  return { turn, x, z, half: (Math.abs(UNOWN.w * Math.cos(turn)) + Math.abs(UNOWN.d * Math.sin(turn))) / 2 };
}
/** The BASE sign's neon: letters 9 x 18 from x0 at y 46, each a list of strokes. */
export const NEON = { y: 46, at: [9.5, 21.5, 33.5, 45.5], letters: [
  [[[0, 0], [0, 18], [5.5, 18], [8, 15.5], [8, 12], [5.5, 9.5], [0, 9.5]], [[5.5, 9.5], [9, 7], [9, 2.5], [6.5, 0], [0, 0]]],
  [[[0, 0], [4.5, 18], [9, 0]], [[1.8, 7], [7.2, 7]]],
  [[[9, 16], [7, 18], [2, 18], [0, 16], [0, 11], [2, 9.5], [7, 8.5], [9, 7], [9, 2], [7, 0], [2, 0], [0, 2]]],
  [[[9, 18], [0, 18], [0, 0], [9, 0]], [[0, 9], [6.5, 9]]],
], border: [6.5, 42.5, 57.5, 67.5] };
/** The fairy-light tree's crown (x, y, z, r) and the bulbs dotted over it (x, y, z, lit second colour). */
export const CROWN = [[16, 54, 0, 11], [8, 46, 1, 7.5], [24, 46, 1, 7.5], [10, 60, -1, 7], [22, 60, -1, 7], [16, 66, 0, 6.5], [16, 43, 3, 8]];
export const BULBS = (() => {
  const out = [];
  CROWN.forEach(([x, y, z, r], i) => {
    for (let n = 0; n < 4; n++) {
      const a = i * 1.3 + n * 2.4, v = Math.sin(i * 2.1 + n * 1.7) * 0.75;
      out.push([x + Math.cos(a) * r * Math.sqrt(1 - v * v), y + v * r, z + Math.sin(a) * r * Math.sqrt(1 - v * v), (i + n) % 3 === 0]);
    }
  });
  return out;
})();
/** The light-up arch: posts at x, the arch's middle and radius, its bulbs [x, y]. */
export const ARCH = { posts: [7, 57], cy: 50, R: 25, bulbs: [...[8, 18, 28, 38].flatMap(y => [[7, y], [57, y]]), ...Array.from({ length: 9 }, (_, i) => { const a = Math.PI * (0.06 + i * 0.11); return [32 - Math.cos(a) * 25, 50 + Math.sin(a) * 25]; })] };
/** The Morelull: [x, z, stem height, stem radius, cap radius, cap height]. */
export const SHROOMS = [[16, -2, 20, 2.8, 10, 9], [7, 3, 12, 1.9, 6, 5.5], [25.5, 2, 15, 2.1, 6.5, 6]];
/** Spots on a cap: [angle round, height up it 0-1]. */
export const SPOTS = [[0.2, 0.35], [1.4, 0.55], [2.6, 0.3], [3.8, 0.6], [5, 0.4], [-0.9, 0.7], [0.9, 0.85]];

export const SHAPES = {
  [Object.keys(FIGURES).join(' ')]: { make: 'figureY2' },
  ballmonument: { make: 'ballmonument' },
  unowncircle: { make: 'unowncircle' },
  badgeobelisk: { make: 'badgeobelisk' },
  winnerspodium: { make: 'winnerspodium' },
  solarlights: { make: 'solarlights', play: { does: 'light' } },
  gardentorch: { make: 'gardentorch', play: { does: 'light', flicker: true } },
  hooklantern: { make: 'hooklantern', play: { does: 'light' } },
  lanturnbollard: { make: 'lanturnbollard', play: { does: 'light' } },
  fairytree: { make: 'fairytree', play: { does: 'light' } },
  yardspotlight: { make: 'yardspotlight', play: { does: 'light' } },
  litsignpost: { make: 'litsignpost', play: { does: 'light' } },
  basesign: { make: 'basesign', play: { does: 'light' } },
  fireflyjar: { make: 'fireflyjar', play: { does: 'light', flicker: true } },
  chinchoulamp: { make: 'chinchoulamp', play: { does: 'light' } },
  lightarch: { make: 'lightarch', play: { does: 'light' } },
  uplitplanter: { make: 'uplitplanter', play: { does: 'light' } },
  housenumber: { make: 'housenumber', play: { does: 'light' } },
  basketlamppost: { make: 'basketlamppost', play: { does: 'light' } },
  morelullglow: { make: 'morelullglow', play: { does: 'light' } },
};

/* ---------- builders' parts ---------- */
/** A rod from a to b ([x, y, z] in tiles) tapering from r0 to r1. */
function cone(K, L, m, a, b, r0, r1, seg = 10) {
  const { THREE } = L, va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b), len = Math.max(1e-4, va.distanceTo(vb));
  const g = L.cyl(r1, len, r0, seg);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize()));
  K.put(g, m, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
}
/** An outline ([[x, y]...] in tiles, about 0, 0) cut from a slab t thick, centred on z 0. */
function cut(L, pts, t) {
  const { THREE } = L, bev = Math.min(t * 0.25, 0.006);
  const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y))), { depth: Math.max(1e-4, t - bev * 2), bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 1 });
  return g.translate(0, 0, -t / 2 + bev);
}
/** Flat-shaded, for a faceted part (a square shaft). */
const facets = (g) => { const n = g.toNonIndexed(); n.computeVertexNormals(); return n; };

/** A plinth: a base course, the block with a band under its cap and a plaque on its front; or a planter of soil. */
function plinth(K, L, W, [x0, x1, h, d], bed) {
  const { rbox } = L, w = u(x1 - x0), cx = X((x0 + x1) / 2, W), dd = u(d), lip = u(1), p = K.pal.p, rim = K.gloss(L.tone(p, 0.86));
  if (bed) {
    const wood = K.wood(), t = u(2.5);
    for (const z of [-dd / 2 + t / 2, dd / 2 - t / 2]) K.put(rbox(w, u(h), t, 0.01), wood, cx, u(h) / 2, z);
    for (const x of [-w / 2 + t / 2, w / 2 - t / 2]) K.put(rbox(t, u(h), dd - t * 2, 0.01), wood, cx + x, u(h) / 2, 0);
    K.put(rbox(w - t * 2, u(h - 1.5), dd - t * 2, 0.006), K.plain(SOIL), cx, u(h - 1.5) / 2, 0);
    return;
  }
  K.put(rbox(w + lip * 2, u(3), dd + lip * 2, 0.012), rim, cx, u(1.5), 0);
  K.put(rbox(w, u(h - 6), dd, 0.01), K.gloss(p), cx, u(3 + (h - 6) / 2), 0);
  K.put(rbox(w + lip * 2, u(3), dd + lip * 2, 0.012), rim, cx, u(h - 1.5), 0);
  K.put(rbox(w + 0.004, u(1.2), dd + 0.004, 0.003), K.gloss(K.pal.c), cx, u(h - 3.6), 0);
  if (h >= 12) K.put(rbox(u((x1 - x0) * 0.4), u((h - 6) * 0.5), u(0.8), 0.004), K.gloss(K.pal.a), cx, u(3 + (h - 6) / 2 - 0.3), dd / 2 + u(0.3));
}

export const MAKES = {
  /** A statue (js/base-figures.js): its plinth, planter or mound built here, its Pokémon's sprite standing on it. */
  figureY2(K, s, W, D, L) {
    const F = FIGURES[K.p.fam], [x0, x1, h, d] = F.plinth;
    if (F.mound) {
      const { cyl, ball } = L, cx = X((x0 + x1) / 2, W);
      K.put(cyl(u((x1 - x0) / 2 - 1), u(h), u((x1 - x0) / 2), 20), K.plain(SOIL), cx, u(h / 2), 0);
      K.put(ball(1, 12, 8).scale(u(10), u(3), u(9)), K.plain('#7a5a3e'), cx, u(h), 0);
      for (const [x, z, r] of [[-10, 8, 2.6], [10, 7, 2.8], [-6, -9, 2.2], [9, -8, 2.4]]) K.put(ball(u(r), 8, 6), K.plain('#9a948a'), cx + u(x), u(h * 0.6), u(z));
    } else plinth(K, L, W, F.plinth, F.bed);
    const f = figureOf(K.p.fam), at = figureAt(K.p.fam);
    if (f) K.figure = { c: f.c, w: u(f.w * at.k), h: u(f.h * at.k), x: X(at.cx, W), y: u(at.y), z: F.bed || F.mound ? 0 : u(Math.min(4, d / 4)) };
  },

  /** A Poké Ball on a column: two stone steps, the column in the theme's pale, a collar, the ball in the theme. */
  ballmonument(K, s, W, D, L) {
    const { rbox, cyl, lathe } = L, stone = K.plain('#a8a8b0');
    K.put(rbox(u(26), u(4), u(26), 0.015), stone, 0, u(2), 0);
    K.put(rbox(u(20), u(4), u(20), 0.015), K.plain('#b8b8c0'), 0, u(6), 0);
    K.put(lathe([[u(6.5), 0], [u(5), u(3)], [u(5), u(29)], [u(6), u(32)], [0, u(32)]], 16), K.gloss(K.pal.p), 0, u(8), 0);
    K.put(cyl(u(7), u(3), u(7), 16), K.gloss(K.pal.a), 0, u(41.5), 0);
    pokeBall(K, L, 0, u(53), 0, u(10), ballTop(K));
  },

  /** Six standing stones in a ring on a paved round, each carved outward with an Unown: an eye and its strokes. */
  unowncircle(K, s, W, D, L) {
    const { rbox, cyl, torus, ball } = L, carve = K.gloss(EYE);
    K.put(cyl(u(31), u(1.5), u(31), 32), K.plain(L.tone(K.pal.p, 0.9)), 0, u(0.75), 0);
    K.put(cyl(u(24.5), u(0.4), u(24.5), 32), K.plain(L.tone(K.pal.m, 1.3)), 0, u(1.6), 0);
    K.put(cyl(u(6), u(3), u(6.5), 8), K.plain('#9a9488'), 0, u(3), 0);
    UNOWN.stones.forEach((st, i) => {
      const { turn, x, z } = unownStone(st), tone = ['#a8a49a', '#9a9488', '#b0aa9e'][i % 3];
      K.put(rbox(u(UNOWN.w), u(st.h), u(UNOWN.d), u(1.5)), K.plain(tone), X(x, W), u(1.5 + st.h / 2), u(z), turn);
      // the glyph on the face out of the ring: its tangent along the face, its normal out of it
      const nx = Math.sin(turn), nz = Math.cos(turn), tx = Math.cos(turn), tz = -Math.sin(turn), off = UNOWN.d / 2 + 0.25, gy = 1.5 + st.h * 0.6;
      const at = (gx, y, out = off) => [X(x + nx * out + tx * gx, W), u(y), u(z + nz * out + tz * gx)];
      const [ex, ey, ez] = at(0, gy);
      K.put(torus(u(2.4), u(0.55), TAU, 12), carve, ex, ey, ez, turn);
      K.put(ball(u(0.9), 8, 6), carve, ...at(0, gy, off + 0.2));
      for (const [a0, b0, a1, b1] of UNOWN.glyphs[st.g]) cone(K, L, carve, at(a0, gy + b0), at(a1, gy + b1), u(0.55), u(0.55), 6);
    });
  },

  /** A stone obelisk tapering up to its point, eight badges set down its face, on a plinth in the theme's pale. */
  badgeobelisk(K, s, W, D, L) {
    const { rbox, cyl } = L, O = OBELISK, stone = K.plain('#a4a4ae'), sq = Math.SQRT2;
    K.put(rbox(u(24), u(6), u(24), 0.015), K.gloss(K.pal.p), 0, u(3), 0);
    K.put(rbox(u(24.4), u(1.2), u(24.4), 0.004), K.gloss(K.pal.c), 0, u(5), 0);
    K.put(rbox(u(18), u(4), u(18), 0.012), K.plain('#b4b4bc'), 0, u(8), 0);
    K.put(facets(cyl(u(O.hw1 * sq), u(O.y1 - O.y0), u(O.hw0 * sq), 4).rotateY(Math.PI / 4)), stone, 0, u((O.y0 + O.y1) / 2), 0);
    K.put(facets(cyl(0.0005, u(O.top - O.y1), u(O.hw1 * sq), 4).rotateY(Math.PI / 4)), K.plain('#b8b8c2'), 0, u((O.y1 + O.top) / 2), 0);
    const lean = Math.atan((O.hw0 - O.hw1) / (O.y1 - O.y0));
    for (const [y, n, c] of O.badges) {
      const z = u(obeliskHw(y) + 0.45);
      K.put(cyl(u(2.6), u(0.9), u(2.6), n).rotateX(Math.PI / 2 - lean), K.gloss(K.pal[c]), 0, u(y), z);
      K.put(cyl(u(1), u(0.5), u(1), 8).rotateX(Math.PI / 2 - lean), K.gloss('#f6f2e4'), 0, u(y + 0.6), z + u(0.55));
    }
  },

  /** Three steps, first in the middle, their numbers on their fronts and a gold cup on the top step. */
  winnerspodium(K, s, W, D, L) {
    const { rbox, cyl, lathe, torus } = L, d = u(24), gold = K.metal(GOLD);
    for (const [x0, x1, h, n] of PODIUM) {
      const cx = X((x0 + x1) / 2, W), w = u(x1 - x0) - 0.004;
      K.put(rbox(w, u(h - 2.5), d, 0.012), K.gloss(K.pal.p), cx, u(h - 2.5) / 2, 0);
      K.put(rbox(w + 0.006, u(2.5), d + 0.006, 0.008), K.gloss(K.pal.c), cx, u(h - 1.25), 0);
      const k = digitScale(h), bx = (x0 + x1) / 2 - 3.5 * k, by = (h - 2.5) / 2 - 5.5 * k;
      for (const [x, y, bw, bh] of DIGITS[n]) K.put(rbox(u(bw * k), u(bh * k), u(0.8), 0.003), K.gloss(K.pal.c), X(bx + (x + bw / 2) * k, W), u(by + (y + bh / 2) * k), d / 2 + u(0.3));
    }
    K.put(cyl(u(4), u(2), u(4.5), 16), gold, 0, u(31), 0);
    K.put(cyl(u(1), u(4), u(1.2), 8), gold, 0, u(34), 0);
    K.put(lathe([[u(1), 0], [u(4), u(2)], [u(5), u(5.5)], [u(5.2), u(8)], [u(4.6), u(8)], [0, u(1.5)]], 16), gold, 0, u(36), 0);
    for (const sx of [-1, 1]) K.put(torus(u(2), u(0.6), Math.PI, 8), gold, sx * u(5), u(41), 0, 0, 0, -sx * Math.PI / 2);
  },

  /* ----- lights ----- */

  /** Three little solar lights on stakes in a row: a frosted globe lit, a cap with its cell on top. */
  solarlights(K, s, W, D, L) {
    const { cyl, ball, rbox } = L, metal = K.metal(), glow = K.glow(K.pal.g), cell = K.gloss('#2a3a5a');
    for (const x of [5.5, 16, 26.5]) {
      K.put(cyl(u(0.8), u(10), u(0.8), 8), metal, X(x), u(5), 0);
      K.put(cyl(u(2.5), u(1.2), u(2.5), 12), K.metal(L.tone(K.pal.m, 0.75)), X(x), u(10.1), 0);
      K.put(ball(u(3), 12, 8).scale(1, 3.5 / 3, 1), glow, X(x), u(13.5), 0);
      K.put(cyl(u(3.6), u(2.4), u(3.6), 12), metal, X(x), u(17.8), 0);
      K.put(rbox(u(5), u(0.5), u(5), 0.002), cell, X(x), u(19.1), 0);
    }
  },

  /** A garden torch: an iron stake with two scrolls, a cage cup with a band in the accent, a lit flame (it flickers). */
  gardentorch(K, s, W, D, L) {
    const { cyl, lathe, torus } = L, iron = K.metal(L.tone(K.pal.m, 0.8));
    K.put(cyl(u(1.3), u(52), u(1), 8), iron, 0, u(26), 0);
    for (const y of [30, 48]) K.put(cyl(u(2.6), u(2), u(2.6), 10), iron, 0, u(y), 0);
    for (const sx of [-1, 1]) K.put(torus(u(2.5), u(0.6), Math.PI * 1.5, 12), iron, sx * u(3.2), u(38), 0, 0, 0, sx > 0 ? 0 : Math.PI);
    K.put(lathe([[u(2), 0], [u(5), u(4)], [u(6), u(8)], [u(5.2), u(8)], [0, u(2)]], 12), iron, 0, u(50), 0);
    K.put(cyl(u(5.6), u(1.6), u(5.1), 12), K.gloss(K.pal.a), 0, u(55), 0);
    const flame = (r, h, y, c, z) => K.put(lathe([[r, 0], [r * 1.1, h * 0.2], [r * 0.7, h * 0.55], [r * 0.2, h * 0.9], [0.001, h]], 12), K.glow(c), 0, y, z);
    flame(u(5), u(20), u(56), FLAMES[0], 0);
    flame(u(3.7), u(15), u(57), FLAMES[1], u(0.8));
    flame(u(2.2), u(9), u(58), FLAMES[2], u(1.6));
  },

  /** A shepherd's-hook post, a lantern hanging from its crook: lit panes in an iron frame, a pointed cap. */
  hooklantern(K, s, W, D, L) {
    const { rbox, cyl, ball, torus } = L, iron = K.metal(L.tone(K.pal.m, 0.8)), x = 9.5, lx = 24;
    K.put(rbox(u(7), u(4), u(7), 0.01), iron, X(x), u(2), 0);
    K.put(cyl(u(1.4), u(74), u(1.5), 10), iron, X(x), u(39), 0);
    K.put(tube(L, [[X(x), u(74), 0], [X(x), u(80), 0], [X(12), u(85), 0], [X(17), u(87), 0], [X(22), u(85), 0], [X(lx), u(81), 0], [X(lx), u(77), 0]], u(1.3), 16), iron);
    K.put(torus(u(1.4), u(0.5), TAU, 8), iron, X(lx), u(75.5), 0);
    K.put(cyl(0.0005, u(6), u(6.5), 4).rotateY(Math.PI / 4), iron, X(lx), u(69), 0);
    K.put(rbox(u(8), u(12), u(8), 0.006), K.glow(K.pal.g), X(lx), u(60), 0);
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) K.put(rbox(u(1.2), u(12.4), u(1.2), 0.002), iron, X(lx + dx * 4.3), u(60), u(dz * 4.3));
    K.put(rbox(u(10), u(2), u(10), 0.006), iron, X(lx), u(53), 0);
    K.put(ball(u(1.4), 8, 6), iron, X(lx), u(51), 0);
  },

  /** A Lanturn on a short iron bollard, its lure lit on the stalk curling up from its head. */
  lanturnbollard(K, s, W, D, L) {
    const { cyl, ball } = L, metal = K.metal(), blue = K.gloss(LANTURN.body), yel = K.gloss(LANTURN.belly);
    K.put(cyl(u(10), u(6), u(10.5), 20), metal, 0, u(3), 0);
    K.put(cyl(u(9), u(1), u(10), 20), K.metal(L.tone(K.pal.m, 1.2)), 0, u(6.5), 0);
    K.put(ball(1, 12, 8).scale(u(10), u(9), u(9)), blue, 0, u(15), 0);
    K.put(ball(1, 12, 8).scale(u(8), u(5), u(5)), yel, 0, u(12), u(4));
    for (const sx of [-1, 1]) {
      K.put(ball(u(1.8), 8, 6).scale(1, 1.1, 0.45), K.gloss(CHINCHOU.eye), sx * u(3.5), u(17), u(7.8));
      K.put(ball(u(0.8), 8, 6), K.gloss(EYE), sx * u(3.3), u(17), u(8.5));
      K.put(ball(1, 8, 6).scale(u(2), u(4), u(1.2)), blue, sx * u(10), u(14), 0, 0, 0, -sx * 0.6);
    }
    K.put(cut(L, [[-u(4), 0], [0, u(8)], [u(4), 0]], u(1.4)), blue, 0, u(19), -u(8.5), 0, -0.5);
    K.put(tube(L, [[0, u(23), 0], [0, u(30), u(1)], [u(2), u(36), u(2)], [u(4), u(38), u(3)]], u(0.9), 12), blue);
    K.put(ball(u(4.2), 12, 8), K.glow(LANTURN.lure), u(4), u(40.5), u(3));
  },

  /** A little tree in a pot, its crown dotted with lit bulbs. */
  fairytree(K, s, W, D, L) {
    const { cyl, lathe, ball } = L;
    K.put(lathe([[u(7), 0], [u(9), u(9)], [u(9.6), u(10)], [0, u(10)]], 16), K.plain(K.pal.pot), 0, 0, 0);
    K.put(cyl(u(8.6), u(0.6), u(8.6), 16), K.plain(SOIL), 0, u(9.9), 0);
    K.put(cyl(u(1.4), u(26), u(2), 8), K.wood(), 0, u(23), 0);
    CROWN.forEach(([x, y, z, r], i) => K.put(ball(u(r), 12, 8), K.plain(i % 2 ? K.pal.leaf : L.tone(K.pal.leaf, 0.86)), X(x), u(y), u(z)));
    for (const [x, y, z, lit] of BULBS) K.put(ball(u(1.2), 8, 6), K.glow(lit ? K.pal.gl : K.pal.g), X(x), u(y), u(z));
  },

  /** A garden spotlight: a ground spike, a yoke, its lamp tipped up towards you, the lens lit. */
  yardspotlight(K, s, W, D, L) {
    const { cyl, rbox } = L, dark = K.metal(L.tone(K.pal.m, 0.7)), tilt = 50 * Math.PI / 180;
    K.put(cyl(u(1), u(7), u(0.3), 6), dark, 0, u(3.5), 0);
    K.put(cyl(u(3), u(1.2), u(3), 12), dark, 0, u(7.4), 0);
    K.put(rbox(u(12.4), u(1.2), u(2), 0.003), dark, 0, u(8.6), 0);
    for (const sx of [-1, 1]) K.put(rbox(u(1), u(7), u(2), 0.003), dark, sx * u(5.7), u(11.5), 0);
    const ax = [0, Math.cos(tilt), Math.sin(tilt)], c = [0, 15, 0], at = (k) => c.map((v, i) => u(v + ax[i] * k));
    cone(K, L, K.metal(), at(-5.5), at(4.6), u(5), u(5), 16);
    cone(K, L, dark, at(4.6), at(5.5), u(5.2), u(5.2), 16);
    cone(K, L, K.glow(K.pal.g), at(5), at(5.7), u(4.3), u(4.3), 16);
  },

  /** A wooden signpost, three arrow boards pointing off, a lantern lit on its top. */
  litsignpost(K, s, W, D, L) {
    const { rbox, cyl } = L, wood = K.wood(), iron = K.metal(L.tone(K.pal.m, 0.8));
    K.put(rbox(u(4), u(70), u(4), 0.01), wood, 0, u(35), 0);
    K.put(rbox(u(6), u(2), u(6), 0.006), K.wood(L.tone(K.pal.w, 0.8)), 0, u(71), 0);
    const boards = [[[[1, 59], [5, 62], [21, 62], [21, 56], [5, 56]], 'c'], [[[11, 46], [11, 52], [27, 52], [31, 49], [27, 46]], 'a'], [[[2, 39], [6, 42], [20, 42], [20, 36], [6, 36]], 'p']];
    boards.forEach(([pts, c], i) => {
      K.put(cut(L, pts.map(([x, y]) => [X(x), u(y)]), u(1.6)), K.wood(K.pal[c]), 0, 0, u(2.8));
      const y = pts[1][1] - 3, x0 = Math.min(...pts.map(p => p[0])) + 5, x1 = Math.max(...pts.map(p => p[0])) - 5;
      K.put(rbox(u(x1 - x0), u(0.8), u(0.4), 0.001), K.plain(INK), X((x0 + x1) / 2), u(y + (i === 1 ? 0.6 : 1)), u(3.8));
      K.put(rbox(u((x1 - x0) * 0.6), u(0.8), u(0.4), 0.001), K.plain(INK), X(x0 + (x1 - x0) * 0.3), u(y - 1.2), u(3.8));
    });
    K.put(rbox(u(5.6), u(1), u(5.6), 0.003), iron, 0, u(72.5), 0);
    K.put(rbox(u(4.6), u(7), u(4.6), 0.006), K.glow(K.pal.g), 0, u(76.5), 0);
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) K.put(rbox(u(0.8), u(7), u(0.8), 0.002), iron, u(dx * 2.5), u(76.5), u(dz * 2.5));
    K.put(cyl(0.0005, u(4), u(4.4), 4).rotateY(Math.PI / 4), iron, 0, u(82), 0);
  },

  /** BASE in neon on a dark board in an iron frame on two legs, a neon border round it. */
  basesign(K, s, W, D, L) {
    const { rbox, ball } = L, iron = K.metal(L.tone(K.pal.m, 0.85)), z = u(2.6);
    for (const x of [6.5, 57.5]) K.put(rbox(u(3), u(40), u(3), 0.006), iron, X(x, W), u(20), -u(1));
    K.put(rbox(u(58), u(34), u(4), 0.012), iron, 0, u(55), -u(1));
    K.put(rbox(u(54), u(30), u(0.8), 0.003), K.gloss(INK), 0, u(55), u(1.3));
    const stroke = (pts, m) => {
      for (let i = 1; i < pts.length; i++) cone(K, L, m, [...pts[i - 1], z], [...pts[i], z], u(1), u(1), 8);
      for (let i = 1; i < pts.length - 1; i++) K.put(ball(u(1), 8, 6), m, pts[i][0], pts[i][1], z);
    };
    const neon = K.glow(K.pal.c);
    NEON.letters.forEach((strokes, i) => strokes.forEach(st => stroke(st.map(([x, y]) => [X(NEON.at[i] + x, W), u(NEON.y + y)]), neon)));
    const [bx0, by0, bx1, by1] = NEON.border;
    stroke([[bx0, by0], [bx0, by1], [bx1, by1], [bx1, by0], [bx0, by0]].map(([x, y]) => [X(x, W), u(y)]), K.glow(K.pal.a));
  },

  /** A jar of fireflies hung from a post's arm: glass, a lid, a wire handle, the fireflies lit inside (they flicker). */
  fireflyjar(K, s, W, D, L) {
    const { rbox, cyl, lathe, ball, torus } = L, wood = K.wood(), jx = X(23);
    K.put(rbox(u(4), u(66), u(4), 0.01), wood, X(7), u(33), 0);
    K.put(rbox(u(6), u(2), u(6), 0.006), K.wood(L.tone(K.pal.w, 0.8)), X(7), u(67), 0);
    K.put(rbox(u(20), u(3), u(3), 0.008), wood, X(16), u(63.5), 0);
    rod(K, L, wood, [X(8.5), u(52), 0], [X(17), u(62.5), 0], u(1));
    K.put(cyl(u(0.3), u(6), u(0.3), 6), K.metal(INK), jx, u(59), 0);
    K.put(torus(u(4.2), u(0.35), Math.PI, 10), K.metal(INK), jx, u(53), 0);
    K.put(cyl(u(5), u(3), u(5), 16), K.metal(), jx, u(51.5), 0);
    K.put(lathe([[0.0005, 0], [u(4.6), u(0.4)], [u(5.5), u(2)], [u(5.5), u(13)], [u(4.8), u(15)], [u(4.6), u(16)]], 16), K.glass(), jx, u(34), 0);
    [[20, 38, 1], [25, 41, -2], [22, 45, 2], [26, 37, 1.5], [21, 47.5, -1], [24, 44, -2.5]].forEach(([x, y, z], i) => K.put(ball(u(1.1), 8, 6), K.glow(FIREFLY[i % 2]), X(x), u(y), u(z)));
  },

  /** A Chinchou on an iron pole: a blue ball with yellow eyes, its two antennae curling out to lit orbs. */
  chinchoulamp(K, s, W, D, L) {
    const { lathe, cyl, ball } = L, metal = K.metal(), blue = K.gloss(CHINCHOU.body);
    K.put(lathe([[u(8), 0], [u(8), u(1.5)], [u(5), u(3.5)], [u(3), u(5)], [0, u(5)]], 16), metal, 0, 0, 0);
    K.put(cyl(u(1.1), u(48), u(1.3), 8), metal, 0, u(29), 0);
    K.put(cyl(u(2.2), u(1.6), u(2.2), 10), K.gloss(K.pal.a), 0, u(50.5), 0);
    K.put(ball(1, 12, 8).scale(u(7), u(6.5), u(7)), blue, 0, u(58), 0);
    for (const sx of [-1, 1]) {
      K.put(ball(1, 8, 6).scale(u(1.6), u(2), u(0.9)), K.gloss(CHINCHOU.eye), sx * u(2.4), u(59), u(6.1));
      K.put(ball(u(0.8), 8, 6), K.gloss(EYE), sx * u(2.3), u(59), u(6.8));
      K.put(tube(L, [[sx * u(3), u(63), 0], [sx * u(5), u(66.5), 0], [sx * u(8.5), u(70), 0], [sx * u(11), u(75), 0]], u(0.8), 12), blue);
      K.put(ball(u(4.2), 12, 8), K.glow(CHINCHOU.orb), sx * u(11), u(78.5), 0);
    }
  },

  /** An iron arch, two hoops joined by rungs, bulbs lit all the way round its front. */
  lightarch(K, s, W, D, L) {
    const { cyl, torus, ball } = L, iron = K.metal(L.tone(K.pal.m, 0.85)), glow = K.glow(K.pal.g), r = u(1.6);
    for (const z of [-5, 5]) {
      for (const x of ARCH.posts) K.put(cyl(r, u(ARCH.cy), r, 8), iron, X(x, W), u(ARCH.cy / 2), u(z));
      K.put(torus(u(ARCH.R), r, Math.PI, 24), iron, 0, u(ARCH.cy), u(z));
    }
    for (let i = 0; i <= 6; i++) {
      const a = Math.PI * i / 6, x = 32 - Math.cos(a) * ARCH.R, y = ARCH.cy + Math.sin(a) * ARCH.R;
      K.put(cyl(u(0.8), u(10), u(0.8), 6).rotateX(Math.PI / 2), iron, X(x, W), u(y), 0);
    }
    for (const x of ARCH.posts) for (const y of [4, 26]) K.put(cyl(u(0.8), u(10), u(0.8), 6).rotateX(Math.PI / 2), iron, X(x, W), u(y), 0);
    for (const x of ARCH.posts) K.put(cyl(u(3), u(2), u(3.4), 10), iron, X(x, W), u(1), 0);
    for (const [x, y] of ARCH.bulbs) K.put(ball(u(1.8), 8, 6), glow, X(x, W), u(y), u(5 + 2.2));
  },

  /** A frosted cube that glows, a rim in the theme's pale, a clipped round shrub planted in it. */
  uplitplanter(K, s, W, D, L) {
    const { rbox, ball, cyl } = L, leaf = K.plain(K.pal.leaf), dark = K.plain(L.tone(K.pal.leaf, 0.8));
    K.put(rbox(u(22), u(20), u(22), u(1.2)), K.glow(K.pal.g), 0, u(10), 0);
    K.put(rbox(u(23), u(2), u(23), u(0.8)), K.gloss(K.pal.p), 0, u(21), 0);
    K.put(cyl(u(9.5), u(0.5), u(9.5), 16), K.plain(SOIL), 0, u(22), 0);
    K.put(ball(u(9.5), 12, 8), dark, 0, u(31.5), 0);
    for (let i = 0; i < 9; i++) {
      const a = i * 2.4, v = Math.sin(i * 1.9) * 0.7, cv = Math.sqrt(1 - v * v);
      K.put(ball(u(3.6), 8, 6), leaf, Math.cos(a) * u(8.4) * cv, u(31.5 + v * 8.4), Math.sin(a) * u(8.4) * cv);
    }
  },

  /** A house-shaped number sign on a stake: an iron box, its face lit with the number, a roof in the theme's colour. */
  housenumber(K, s, W, D, L) {
    const { rbox } = L, ink = K.gloss(INK);
    K.put(rbox(u(3), u(36), u(3), 0.008), K.wood(), 0, u(18), 0);
    K.put(rbox(u(22), u(18), u(5), 0.01), K.metal(L.tone(K.pal.m, 0.85)), 0, u(43), 0);
    K.put(rbox(u(18), u(14), u(0.6), 0.003), K.glow(K.pal.g), 0, u(43), u(2.6));
    for (const [x, y, w, h] of DIGITS[1]) K.put(rbox(u(w), u(h), u(0.5), 0.002), ink, X(12.5 + x + w / 2), u(37.5 + y + h / 2), u(3.1));
    K.put(cut(L, [[X(3), u(52)], [0, u(62)], [X(29), u(52)]], u(7)), K.gloss(K.pal.c), 0, 0, 0);
    K.put(rbox(u(3), u(6), u(3), 0.006), K.gloss(L.tone(K.pal.c, 0.8)), X(23.5), u(57.5), 0);
  },

  /** A lamp post with a globe lit on top and an arm either side, a basket of flowers hanging from each. */
  basketlamppost(K, s, W, D, L) {
    const { lathe, cyl, ball, torus, rbox } = L, iron = K.metal(L.tone(K.pal.m, 0.8)), weave = K.cloth(WICKER);
    K.put(lathe([[u(6), 0], [u(6), u(2)], [u(4), u(5)], [u(2.5), u(8)], [0, u(8)]], 12), iron, 0, 0, 0);
    K.put(cyl(u(1.5), u(66), u(1.5), 10), iron, 0, u(41), 0);
    for (const y of [30, 60]) K.put(cyl(u(2.4), u(1.6), u(2.4), 10), iron, 0, u(y), 0);
    K.put(rbox(u(26), u(1.6), u(1.6), 0.004), iron, 0, u(63), 0);
    for (const sx of [-1, 1]) {
      const x = sx * u(11);
      K.put(torus(u(1.6), u(0.5), Math.PI * 1.5, 8), iron, sx * u(12.6), u(64.4), 0, 0, 0, sx > 0 ? -Math.PI / 2 : Math.PI);
      for (const dx of [-1, 1]) rod(K, L, K.metal(INK), [x, u(62), 0], [x + u(3.8) * dx, u(55), 0], u(0.25));
      K.put(lathe([[0.0005, 0], [u(2.4), u(0.4)], [u(4), u(2.4)], [u(4.6), u(5.5)], [u(4.1), u(5.5)], [0.0005, u(1.4)]], 12), weave, x, u(49.5), 0);
      K.put(torus(u(4.4), u(0.5), TAU, 12).rotateX(Math.PI / 2), K.cloth('#8a5a30'), x, u(55), 0);
      [[-2, 0, K.pal.c], [1.5, 1.5, K.pal.a], [0.5, -2, K.pal.p], [2.5, -1, K.pal.c]].forEach(([dx, dz, c]) => K.put(ball(u(1.7), 8, 6), K.gloss(c), x + u(dx), u(56.2), u(dz)));
      for (const [dx, dy] of [[-3.5, 52], [3.6, 51], [-2.2, 48]]) K.put(ball(u(1.6), 8, 6).scale(1, 1.4, 0.8), K.gloss(K.pal.leaf), x + u(dx), u(dy), u(2.6));
    }
    K.put(cyl(u(3), u(2), u(2.4), 10), iron, 0, u(75), 0);
    K.put(ball(u(6), 12, 8).scale(1, 6.5 / 6, 1), K.glow(K.pal.g), 0, u(81.5), 0);
    K.put(cyl(u(2), u(2), u(3), 10), iron, 0, u(88), 0);
    K.put(ball(u(1.2), 8, 6), iron, 0, u(90), 0);
  },

  /** Three Morelull, caps lit and spotted, on a mound of moss; the big one's eyes peep from its stalk. */
  morelullglow(K, s, W, D, L) {
    const { lathe, ball } = L, cap = K.glow(MORELULL.cap), spot = K.glow(MORELULL.spot), stem = K.plain(MORELULL.stem);
    K.put(lathe([[u(14), 0], [u(12), u(2)], [u(7), u(3.6)], [0.0005, u(4)]], 16).scale(1, 1, 12 / 14), K.plain(K.pal.leaf), 0, 0, 0);
    SHROOMS.forEach(([x, z, h, r, cr, ch], i) => {
      K.put(lathe([[r * 1.15 / 32, 0], [r / 32, u(h * 0.5)], [r * 0.85 / 32, u(h)], [0.0005, u(h)]], 10), stem, X(x), u(1), u(z));
      const dome = []; for (let k = 0; k <= 6; k++) { const a = k / 6 * Math.PI / 2; dome.push([u(cr) * Math.cos(a), u(ch) * Math.sin(a)]); }
      K.put(lathe([[u(cr * 0.3), u(-ch * 0.12)], [u(cr * 0.95), -u(0.4)], ...dome], 14), cap, X(x), u(1 + h - 1), u(z));
      for (const [a, f] of SPOTS.slice(0, i ? 5 : 7)) {
        const t = f * Math.PI / 2, sr = Math.cos(t) * cr, sy = Math.sin(t) * ch;
        K.put(ball(u(cr * 0.16), 8, 6).scale(1, 0.55, 1), spot, X(x + Math.sin(a) * sr), u(h + sy), u(z + Math.cos(a) * sr));
      }
      if (!i) for (const sx of [-1, 1]) K.put(ball(u(0.7), 8, 6), K.gloss(EYE), X(x + sx * 1.2), u(13), u(z + r * 0.92));
    });
  },
};
