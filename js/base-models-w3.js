/* base-models-w3.js  -  wall pieces, batch 3: boards and plaques (the region map, notice board, whiteboard, chalkboard,
   menu board, donut board, constellation map, the haunted and scholar's portraits, jigsaw picture, photo wall, brass
   plaque, quiet and hazard signs, projector screen, scoreboard, high score and departures boards, badge case, the six
   tablets, the winged sun and the golden wings). Same frame and helpers as js/base-models-w.js (its head says how a wall
   piece is built) and js/base-models-w2.js (cloth and paper).

   A board is a frame round a crop of its painting; what stood on the painting stands off it here: the notes and
   photos are paper with pins, the donuts are rings on pegs, the scoreboard's digits are lit segments, the badges are
   metal, a tablet's glyph is inlaid (`inlay()`: the crop with everything but its coloured pixels cleared, stacked a
   little proud of the stone). */

import { X, Y, u, cut, bar, pic, ring, round, frame, boxUV } from './base-models-w.js';
import { drape, rod, cord, nail, star } from './base-models-w2.js';

const keyed = new WeakMap();
/** A crop with every pixel `test(r, g, b)` turns down cleared. */
export function keep(c, test) {
  if (!keyed.has(c)) keyed.set(c, new Map());
  const got = keyed.get(c);
  if (got.has(test)) return got.get(test);
  const out = new OffscreenCanvas(c.width, c.height), g = out.getContext('2d');
  g.drawImage(c, 0, 0);
  const img = g.getImageData(0, 0, c.width, c.height), d = img.data;
  for (let n = 0; n < d.length; n += 4) if (!test(d[n], d[n + 1], d[n + 2])) d[n + 3] = 0;
  g.putImageData(img, 0, 0);
  out.hd = c.hd;
  got.set(test, out);
  return out;
}

/** What `test` keeps of painted `box`, laid in `layers` sheets from z out, so it stands proud like a carving. */
function inlay(K, L, box, test, z, layers = 3) {
  const [x0, y0, x1, y1] = box, m = K.pic(keep(cut(K, L, box), test));
  m.alphaTest = 0.5;
  for (let n = 0; n < layers; n++) K.put(new L.THREE.PlaneGeometry(u(x1 - x0), u(y1 - y0)), m, X((x0 + x1) / 2, K.p.w), Y((y0 + y1) / 2), z + n * 0.003);
}

/** A push pin at painted (i, j): a round head on a short needle, standing z out. */
function pin(K, L, i, j, c, z = 0.03) {
  K.put(L.ball(u(1.3), 12, 8), K.gloss(c), X(i, K.p.w), Y(j), z);
  K.put(L.cyl(0.004, z, 0.004, 6).rotateX(Math.PI / 2), K.metal('#c8ccd8'), X(i, K.p.w), Y(j), z / 2);
}

/** A pane of glass over painted `box` at depth z. */
export function glass(K, L, [x0, y0, x1, y1], z) {
  K.put(new L.THREE.PlaneGeometry(u(x1 - x0), u(y1 - y0)), K.glass(), X((x0 + x1) / 2, K.p.w), Y((y0 + y1) / 2), z);
}

/** A bezel over the band between painted boxes `outer` and `inner`, `d` deep. */
export function bezel(K, L, m, outer, inner, d, r = 0.008) {
  const [ox0, oy0, ox1, oy1] = outer, [ix0, iy0, ix1, iy1] = inner;
  for (const box of [[ox0, oy0, ox1, iy0], [ox0, iy1, ox1, oy1], [ox0, iy0, ix0, iy1], [ix1, iy0, ox1, iy1]]) bar(K, L, m, box, d, 0, r);
}

const strong = (r, g, b) => Math.max(r, g, b) - Math.min(r, g, b) > 125;
const TABLETS = ['eye', 'ankh', 'scarab', 'falcon', 'sun', 'lotus'].map(id => `${id}tablet`).join(' ');

export const SHAPES = {
  worldmap: { make: 'regionmap' },
  corkboard: { make: 'noticeboard' },
  whiteboard: { make: 'markerboard' },
  chalkboard: { make: 'slateboard' },
  menuboard: { make: 'cafemenu' },
  donutwall: { make: 'donutpegs' },
  constellation: { make: 'starmap' },
  hauntportrait: { make: 'ovalportrait' },
  scholarportrait: { make: 'gildedportrait' },
  jigsaw: { make: 'jigsawframe' },
  photowall: { make: 'photowall' },
  plaque: { make: 'brassplaque' },
  quietsign: { make: 'hangsign' },
  hazardsign: { make: 'warnsign' },
  projscreen: { make: 'pullscreen' },
  scoreboard: { make: 'segboard' },
  highscore: { make: 'screenbox', box: [3, 14, 29, 60], screen: [5, 16, 27, 58], d: 0.1 },
  departures: { make: 'screenbox', box: [2, 16, 62, 62], screen: [4, 18, 60, 60], d: 0.13, header: [5, 19, 59, 25], rods: [13, 51] },
  badgecase: { make: 'badgecase' },
  [TABLETS]: { make: 'glyphtablet' },
  sundisc: { make: 'wingedsun' },
  wingcrest: { make: 'goldwings' },
};

export const MAKES = {
  regionmap(K, s, W, D, L) {
    frame(K, L, K.wood('#e8d8b0'), [4, 20, 60, 60], [6, 22, 58, 58], 0.05);
    // the two islands raised off the sea, a hill on each, a pin in the town and the route painted between
    for (const [cx, cy, rx, ry] of [[20, 38, 11, 9], [42, 34, 9, 7]]) round(K, L, K.pic(cut(K, L, [cx - rx, cy - ry, cx + rx, cy + ry])), cx, cy, rx, 0.027, ry / rx);
    for (const [cx, cy, rx, ry] of [[20, 38, 11, 9], [42, 34, 9, 7]]) round(K, L, K.plain('#c8b070'), cx, cy, rx, 0.024, ry / rx);
    for (const [i, j, h] of [[18, 32, 5], [44, 30, 4]]) K.put(L.cyl(0.002, u(h), u(h * 0.8), 14).scale(1, 1, 0.5), K.plain('#8a7a6a'), X(i, W), Y(j + h / 2 - 1.5), 0.03);
    pin(K, L, 23, 41, '#e04848', 0.05);
    bar(K, L, K.plain('#e8e0c8'), [52, 24, 56, 28], 0.004, 0.022, 0.001);
  },

  noticeboard(K, s, W, D, L) {
    frame(K, L, K.wood(), [4, 18, 60, 62], [7, 21, 57, 59], 0.06);
    // each note pinned at its top, its foot lifting off the cork
    for (const [i, j, w, h] of [[10, 25, 14, 12], [27, 27, 11, 11], [41, 24, 12, 14], [12, 41, 13, 13], [30, 43, 14, 11], [46, 42, 9, 10]]) {
      const lift = 0.012 + K.r() * 0.016;
      drape(K, L, [i, j, i + w, j + h], (fx, fy) => 0.026 + fy * fy * lift, 0, [3, 6]);
      pin(K, L, i + w / 2, j + 1, K.pal.c, 0.04);
    }
  },

  markerboard(K, s, W, D, L) {
    frame(K, L, K.metal('#c8ccd4'), [3, 14, 61, 54], [5, 16, 59, 52], 0.04);
    // the tray along its foot with two markers and the eraser on it
    bar(K, L, K.metal(K.pal.m), [8, 54, 56, 57], 0.12, 0, 0.01);
    bar(K, L, K.metal(K.pal.m), [8, 52.5, 56, 54], 0.012, 0.11, 0.004);
    for (const [i, c] of [[14.5, '#e04848'], [21.5, '#4a78d8']]) {
      K.put(L.cyl(u(1), u(5), u(1), 12).rotateZ(Math.PI / 2), K.gloss('#f4f4f0'), X(i, W), Y(53), 0.06);
      K.put(L.cyl(u(1.05), u(1.8), u(1.05), 12).rotateZ(Math.PI / 2), K.gloss(c), X(i - 2.4, W), Y(53), 0.06);
    }
    K.put(L.rbox(u(7), u(2), u(3), 0.006), K.gloss(K.pal.c), X(43.5, W), Y(53), 0.06);
    K.put(L.rbox(u(7), u(0.6), u(3), 0.003), K.cloth('#5a5a60'), X(43.5, W), Y(54), 0.06);
  },

  slateboard(K, s, W, D, L) {
    frame(K, L, K.wood(), [2, 14, 62, 56], [5, 17, 59, 51], 0.06);
    // the ledge, a stick of chalk and the felt eraser on it
    bar(K, L, K.wood(L.tone(K.pal.w, 1.1)), [3, 51, 61, 55], 0.13, 0, 0.012);
    K.put(L.cyl(u(0.8), u(4), u(0.8), 10).rotateZ(Math.PI / 2), K.plain('#f8f8f4'), X(14, W), Y(50.2), 0.07);
    K.put(L.rbox(u(8), u(2), u(3.5), 0.006), K.wood(K.pal.c), X(44, W), Y(49.8), 0.08);
    K.put(L.rbox(u(8), u(0.8), u(3.5), 0.003), K.cloth('#d8d8d8'), X(44, W), Y(50.6), 0.08);
  },

  cafemenu(K, s, W, D, L) {
    // hung from a nail on a cord, a chalk ledge under it
    nail(K, L, 16, 9);
    const rope = K.plain(L.tone(K.pal.m, 0.9));
    for (const i of [7, 25]) cord(K, L, rope, [[16, 9.5, 0.03], [(16 + i) / 2, 13.5, 0.032], [i, 18.5, 0.04]]);
    frame(K, L, K.wood(), [4, 18, 28, 58], [6, 20, 26, 56], 0.05);
    bar(K, L, K.wood(L.tone(K.pal.w, 1.1)), [4, 57, 28, 59.5], 0.1, 0, 0.008);
    K.put(L.cyl(u(0.7), u(4), u(0.7), 10).rotateZ(Math.PI / 2), K.plain('#f8f8f4'), X(11, W), Y(56.4), 0.06);
  },

  donutpegs(K, s, W, D, L) {
    bar(K, L, K.wood(), [3, 14, 29, 62], 0.05, 0, 0.012);
    pic(K, L, [3, 14, 29, 62], 0.0505);
    // a donut on a peg in each spot, icing over the front half, sprinkles on the icing
    const icing = [K.pal.c, '#f890b8', '#5a3018', K.pal.a], bits = ['#f84848', '#f8d030', '#58c8f0', '#78d058', '#f8f8f8', '#b878f0'];
    const dough = K.plain('#d8a058');
    for (let r = 0; r < 3; r++) for (let i = 0; i < 2; i++) {
      const cx = 10 + i * 12, cy = 25 + r * 14, z = 0.05 + u(1.8);
      K.put(L.cyl(u(1.1), 0.1, u(1.1), 12).rotateX(Math.PI / 2), K.wood(L.tone(K.pal.w, 1.2)), X(cx, W), Y(cy), 0.1);
      K.put(L.torus(u(3.2), u(1.8), Math.PI * 2, 28), dough, X(cx, W), Y(cy), z);
      K.put(L.torus(u(3.2), u(1.7), Math.PI * 2, 28).scale(1, 1, 0.55), K.gloss(icing[(r + i) % 4]), X(cx, W), Y(cy), z + u(0.9));
      for (let n = 0; n < 5; n++) {
        const a = K.r() * Math.PI * 2, rr = u(2.4 + K.r() * 1.6);
        K.put(L.rbox(u(1.1), u(0.35), u(0.35), 0.002), K.gloss(bits[(n + r + i) % bits.length]), X(cx, W) + Math.cos(a) * rr, Y(cy) + Math.sin(a) * rr, z + u(1.9), 0, 0, K.r() * Math.PI);
      }
    }
  },

  starmap(K, s, W, D, L) {
    frame(K, L, K.metal(K.pal.m), [4, 14, 60, 60], [7, 17, 57, 57], 0.05);
    // the constellation stands off the night: brass wire between the stars, each star lit
    const S = [[14, 46], [20, 34], [30, 28], [40, 32], [46, 22], [50, 44], [36, 46]];
    cord(K, L, K.metal('#c8a858'), S.map(([i, j]) => [i, j, 0.03]), 0.3);
    for (const [i, j] of S) star(K, L, K.glow('#fff4c0'), i, j, 1.9, 0.032);
  },

  ovalportrait(K, s, W, D, L) {
    const gold = K.metal(K.pal.a), sy = 23 / 13;
    nail(K, L, 16, 9);
    for (const i of [8, 24]) cord(K, L, K.metal('#8a8e98'), [[16, 9.5, 0.03], [(16 + i) / 2, 15, 0.035], [i, 21, 0.04]], 0.25);
    round(K, L, K.plain('#2a2438'), 16, 39, 9.6, 0.012, 2);
    round(K, L, K.pic(cut(K, L, [7, 21, 25, 57])), 16, 39, 9, 0.022, 2);
    ring(K, L, gold, 16, 39, 13, 9.3, 0.07, sy);
    ring(K, L, K.metal(L.tone(K.pal.a, 1.25)), 16, 39, 10.6, 9.1, 0.08, 20 / 10.6);
    for (let i = 0; i < 6; i++) K.put(L.ball(u(1.2), 10, 8), gold, X(6 + i * 4, W), Y(18 + (i % 2) * 2), 0.06);
    // its eyes follow you
    for (const i of [14, 19]) K.put(L.ball(u(1.1), 12, 8).scale(1, 1, 0.5), K.glow('#f84848'), X(i, W), Y(36), 0.026);
  },

  gildedportrait(K, s, W, D, L) {
    frame(K, L, K.metal('#f0c040'), [3, 12, 29, 64], [6, 15, 26, 61], 0.07);
    bar(K, L, K.metal('#c89830'), [10, 62, 22, 65.5], 0.085, 0, 0.006);
    bar(K, L, K.plain('#6a4a18'), [12, 63.4, 20, 64], 0.002, 0.085, 0.001);
  },

  jigsawframe(K, s, W, D, L) {
    frame(K, L, K.wood(), [4, 16, 60, 56], [7, 19, 57, 53], 0.05);
    // the puzzle's pieces, each a little proud of the next, one still missing
    const cols = [7, 17, 27, 37, 47, 57], rows = [19, 30, 42, 53], card = K.plain('#d8c8a8');
    for (let c = 0; c < 5; c++) for (let r = 0; r < 3; r++) {
      if (c === 3 && r === 1) continue;
      const box = [cols[c] + 0.15, rows[r] + 0.15, cols[c + 1] - 0.15, rows[r + 1] - 0.15], z = 0.024 + K.r() * 0.004;
      bar(K, L, card, box, z - 0.02, 0.02, 0.002);
      pic(K, L, box, z + 0.0005);
    }
  },

  photowall(K, s, W, D, L) {
    // five prints pinned up, each curling a little off the wall at its foot
    [[4, 16], [24, 12], [44, 18], [12, 40], [34, 38]].forEach(([px, py], i) => {
      const lift = 0.014 + K.r() * 0.014;
      drape(K, L, [px, py, px + 16, py + 18], (fx, fy) => 0.008 + fy * fy * lift + Math.sin(fx * Math.PI) * 0.002, 0, [6, 8]);
      pin(K, L, px + 8, py + 0.5, i % 2 ? K.pal.c : K.pal.a, 0.024);
    });
  },

  brassplaque(K, s, W, D, L) {
    const brass = K.metal(K.pal.a), ink = K.plain(L.tone(K.pal.a, 0.5));
    bar(K, L, K.wood(), [4, 26, 28, 42], 0.04, 0, 0.012);
    bar(K, L, brass, [6, 28, 26, 40], 0.012, 0.04, 0.004);
    bar(K, L, ink, [9, 31, 23, 32], 0.002, 0.052, 0.0005);
    bar(K, L, ink, [11, 35, 21, 36], 0.002, 0.052, 0.0005);
    for (const [i, j] of [[7.5, 29.5], [24.5, 29.5], [7.5, 38.5], [24.5, 38.5]]) K.put(L.ball(u(0.8), 10, 6).scale(1, 1, 0.5), K.metal(L.tone(K.pal.a, 0.8)), X(i, W), Y(j), 0.052);
  },

  hangsign(K, s, W, D, L) {
    // a hook in the wall, a rod down to the sign
    K.put(L.ball(u(1.5), 12, 8), K.metal(K.pal.m), X(16, W), Y(21), 0.03);
    K.put(L.cyl(u(0.5), u(7), u(0.5), 8), K.metal(K.pal.m), X(16, W), Y(24.5), 0.03);
    bar(K, L, K.wood(), [3, 28, 29, 42], 0.035, 0.005, 0.01);
    pic(K, L, [5, 30, 27, 40], 0.0405);
    K.put(L.ball(u(2.5), 16, 10).scale(1, 1, 0.4), K.gloss(K.pal.c), X(24, W), Y(35), 0.042);
  },

  warnsign(K, s, W, D, L) {
    const { THREE } = L, tri = () => new THREE.Shape([[16, 23], [3.6, 46], [28.4, 46]].map(([i, j]) => new THREE.Vector2(X(i, W), Y(j))));
    const g = new THREE.ExtrudeGeometry(tri(), { depth: 0.016, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.012, bevelSegments: 3 });
    K.put(g, K.gloss(K.pal.c), 0, 0, 0.012);
    const face = new THREE.ShapeGeometry(tri());
    boxUV(face, [3, 23, 29, 47], W);
    K.put(face, K.pic(cut(K, L, [3, 23, 29, 47])), 0, 0, 0.035);
    K.put(L.cyl(u(1), 0.012, u(1), 12).rotateX(Math.PI / 2), K.metal('#c8ccd8'), X(16, W), Y(28.2), 0.04);
  },

  pullscreen(K, s, W, D, L) {
    const case_ = K.metal(K.pal.m), z = u(2.5) + 0.02;
    // the case it rolls down out of, on two brackets
    K.put(L.cyl(u(2.5), u(60), u(2.5), 20).rotateZ(Math.PI / 2), case_, X(32, W), Y(14.5), z);
    for (const i of [2, 62]) K.put(L.cyl(u(2.7), u(1), u(2.7), 20).rotateZ(Math.PI / 2), K.metal(L.tone(K.pal.m, 0.7)), X(i, W), Y(14.5), z);
    for (const i of [8, 56]) K.put(L.rbox(u(3), u(4), z, 0.004), K.metal('#8a8e98'), X(i, W), Y(14.5), z / 2);
    // the screen hanging a touch off the wall, its weighted bar and pull cord
    drape(K, L, [6, 17, 58, 59], (fx, fy) => z - fy * 0.02 + Math.sin(fx * Math.PI) * 0.003, 0, [12, 12]);
    rod(K, L, case_, 6, 58, 60, 1, z - 0.02, null);
    cord(K, L, K.plain('#8a8a90'), [[32, 61, z - 0.02], [32, 64, z - 0.022], [32, 66.5, z - 0.024]], 0.3);
    K.put(L.ball(u(1.6), 12, 8), K.gloss(K.pal.a), X(32, W), Y(68), z - 0.024);
  },

  segboard(K, s, W, D, L) {
    const d = 0.12;
    bar(K, L, K.plain('#2a2a34'), [4, 18, 60, 58], d, 0, 0.02);
    pic(K, L, [6, 20, 58, 56], d + 0.0004);
    bar(K, L, K.gloss(K.pal.c), [6, 20, 58, 28], 0.01, d, 0.003);
    // the score in seven-segment digits, the lit ones standing out and glowing
    const lit = K.glow(K.pal.a), dark = K.plain('#3a3a48');
    const SEG = { a: [1, 0, 6, 2], b: [7, 1, 2, 7], c: [7, 9, 2, 7], d: [1, 16, 6, 2], e: [0, 9, 2, 7], f: [0, 1, 2, 7], g: [1, 8, 6, 2] };
    const ON = ['abcdef', 'bc', 'abged', 'abgcd', 'fgbc', 'afgcd', 'afgedc', 'abc', 'abcdefg', 'abfgcd'];
    for (const [ox, n] of [[10, 2], [21, 4], [35, 1], [46, 8]]) for (const sg of 'abcdefg') {
      const [i, j, w, h] = SEG[sg], on = ON[n].includes(sg);
      bar(K, L, on ? lit : dark, [ox + i + 0.15, 32 + j + 0.15, ox + i + w - 0.15, 32 + j + h - 0.15], on ? 0.012 : 0.004, d, 0.003);
    }
    for (const j of [38, 44]) bar(K, L, lit, [31, j, 33, j + 2], 0.012, d, 0.003);
    for (const i of [10, 54]) bar(K, L, K.metal('#8a8e98'), [i - 2, 13, i + 2, 18.5], 0.04, 0.04, 0.004);
  },

  screenbox(K, s, W, D, L) {
    const { box, screen, d } = s, metal = K.metal(K.pal.m);
    if (s.rods) for (const i of s.rods) {
      K.put(L.cyl(u(0.9), u(16), u(0.9), 10), metal, X(i, W), Y(8), d / 2);
      K.put(L.rbox(u(4), u(1), d * 0.8, 0.003), metal, X(i, W), Y(0.5), d / 2);
    }
    bar(K, L, metal, box, d * 0.8, 0, 0.014);
    pic(K, L, screen, d * 0.8 + 0.0005);
    if (s.header) bar(K, L, K.gloss(K.pal.c), s.header, 0.005, d * 0.8, 0.002);
    bezel(K, L, metal, box, screen, d);
    glass(K, L, screen, d * 0.92);
  },

  badgecase(K, s, W, D, L) {
    const { THREE } = L, wood = K.wood();
    bar(K, L, wood, [4, 24, 60, 56], 0.03, 0, 0.01);
    bar(K, L, K.cloth(L.tone(K.pal.c, 0.55)), [7, 27, 57, 53], 0.004, 0.03, 0.001);
    bezel(K, L, wood, [4, 24, 60, 56], [7, 27, 57, 53], 0.09, 0.01);
    // the eight badges, metal, pinned to the felt
    const looks = [['#a8a8b0', 'o'], ['#68b8f0', 'd'], ['#f08030', 's'], ['#78c858', 'f'], ['#e868a8', 'h'], ['#f0d030', 'o'], ['#e04848', 'd'], ['#68c868', 's']];
    looks.forEach(([c, sh], i) => {
      const x = X(13 + (i % 4) * 12, W), y = Y(34 + Math.floor(i / 4) * 11), z = 0.04, m = K.metal(c);
      if (sh === 'o') { K.put(L.cyl(u(3.5), 0.012, u(3.5), 24).rotateX(Math.PI / 2), m, x, y, z); K.put(L.cyl(u(2.4), 0.016, u(2.4), 24).rotateX(Math.PI / 2), K.metal(L.tone(c, 1.2)), x, y, z); }
      else if (sh === 'd') K.put(new THREE.OctahedronGeometry(u(3.6)).scale(0.85, 1, 0.3), m, x, y, z);
      else if (sh === 's') { K.put(L.rbox(u(6), u(2), 0.014, 0.003), m, x, y, z); K.put(L.rbox(u(2), u(6), 0.014, 0.003), m, x, y, z); }
      else if (sh === 'f') { for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2]]) K.put(L.ball(u(1.6), 12, 8).scale(1, 1, 0.45), m, x + u(dx), y + u(dy), z); K.put(L.ball(u(1), 10, 6).scale(1, 1, 0.5), K.gloss('#f8f0a0'), x, y, z + 0.006); }
      else K.put(L.heart(u(8), 0.008), m, x, y, z);
    });
    glass(K, L, [7, 27, 57, 53], 0.086);
  },

  glyphtablet(K, s, W, D, L) {
    // a sandstone slab, its border bands and glyph inlaid in lapis and gold
    bar(K, L, K.plain('#d8b878'), [3, 12, 29, 58], 0.07, 0, 0.02);
    pic(K, L, [3, 12, 29, 58], 0.0705);
    inlay(K, L, [6, 15, 26, 55], strong, 0.072);
  },

  wingedsun(K, s, W, D, L) {
    // the wings sweep back towards the wall from the disc, two layers of feathers thick
    for (const [box, inner] of [[[2, 22, 32, 50], 1], [[32, 22, 62, 50], 0]]) {
      for (const dz of [0, -0.012]) drape(K, L, box, (fx) => 0.025 + dz + (1 - Math.abs(fx - inner)) * 0.035, 0, [16, 8]);
    }
    const gold = K.metal('#f0c040');
    K.put(L.ball(u(9), 32, 20).scale(1, 1, 0.45), gold, X(32, W), Y(30), 0.07);
    // a cobra rearing either side of it
    for (const sd of [-1, 1]) {
      K.put(L.cyl(u(1), u(12), u(1.1), 10), gold, X(32 + sd * 10, W), Y(32), 0.1);
      K.put(L.ball(u(2), 12, 8).scale(1, 1.1, 0.7), gold, X(32 + sd * 10, W), Y(25), 0.1);
      K.put(L.ball(u(0.5), 6, 4), K.plain('#303038'), X(32 + sd * 10 - 0.5, W), Y(24.5), 0.1 + u(1.4));
    }
  },

  goldwings(K, s, W, D, L) {
    for (const [box, inner] of [[[4, 24, 32, 60], 1], [[32, 24, 60, 60], 0]]) {
      for (const dz of [0, -0.012]) drape(K, L, box, (fx, fy) => 0.03 + dz + (1 - Math.abs(fx - inner)) * 0.04 - fy * 0.01, 0, [16, 12]);
    }
    // the gem in its gold setting where the wings meet
    round(K, L, K.metal('#c89830'), 32, 41, 6.2, 0.06);
    ring(K, L, K.metal('#f0c040'), 32, 41, 6.4, 4, 0.1);
    K.put(L.ball(u(4), 24, 16).scale(1, 1, 0.6), K.gloss(K.pal.c), X(32, W), Y(41), 0.08);
    K.put(L.ball(u(0.9), 8, 6), K.plain('#ffffff'), X(30.6, W), Y(39.4), 0.08 + u(2.2));
  },
};
