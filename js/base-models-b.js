/* base-models-b.js  -  Plants, Kitchen and Garden pieces, modelled from parts like the arcade cabinets (the user's ask, 2026-10-12).
   js/base-models-f.js's head says how a batch works. Most builders here follow their painting (js/base-furniture-rooms.js)
   pixel for pixel: `u(n)` is n of its 32 pixels a tile, `X(n, W)` a pixel across the painting as x from the middle.
   Left as they were: the flat beds, patches, paths and wall pieces. */

import { rod, tube } from './base-models-kit.js';

const u = (n) => n / 32;
const X = (n, W = 1) => n / 32 - W / 2;
const STONE = '#9a9aa6';
const STRAW = '#e8c860';

/** A clump of leaves round x, y, z, about `r` across: a round core puffed out all over with smaller balls in three greens. */
export function bush(K, L, x, y, z, r, n = 12) {
  const R = K.r, greens = [K.gloss(K.pal.leaf), K.gloss(L.tone(K.pal.leaf, 1.08)), K.gloss(L.tone(K.pal.leaf, 0.9))];
  K.put(L.ball(r * 0.8, 20, 14), greens[2], x, y, z);
  for (let i = 0; i < n; i++) {
    const e = Math.asin(1 - 1.7 * (i + 0.5) / n), a = i * 2.4 + R() * 0.4, q = r * 0.62, s = r * (0.36 + R() * 0.12);
    K.put(L.ball(s, 14, 10), greens[i % 2], x + Math.cos(a) * Math.cos(e) * q, y + Math.sin(e) * q * 0.9, z + Math.sin(a) * Math.cos(e) * q);
  }
}

/** A five-petalled flower facing `turn` round and `tip` up, its middle in the accent. */
export function flower(K, L, x, y, z, col, r = 0.04, turn = 0, tip = 0.6) {
  const petal = K.gloss(col);
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2;
    K.put(L.ball(r * 0.6, 10, 8).scale(1, 1, 0.45).translate(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7, 0).rotateX(-tip).rotateY(turn), petal, x, y, z);
  }
  K.put(L.ball(r * 0.4, 10, 8), K.gloss('#f8d030'), x, y, z);
}

/** A gable roof over a box `w` wide, `d` deep, its eaves at `y`, rising `rise`; the gables filled in `gable`. */
function gableRoof(K, L, y, w, d, rise, over, roof, gable) {
  const { THREE, rbox } = L, half = w / 2 + over, slope = Math.hypot(half, rise), tilt = Math.atan2(rise, half);
  for (const sx of [-1, 1]) K.put(rbox(slope + 0.04, 0.06, d + over * 2, 0.02), roof, sx * half / 2, y + rise / 2 + 0.03, 0, 0, 0, -sx * tilt);
  if (!gable) return;
  const tri = new THREE.Shape([new THREE.Vector2(-w / 2, 0), new THREE.Vector2(w / 2, 0), new THREE.Vector2(0, rise * (w / 2) / half)]);
  const g = new THREE.ExtrudeGeometry(tri, { depth: d - 0.02, bevelEnabled: false });
  g.translate(0, 0, -(d - 0.02) / 2);
  K.put(g, gable, 0, y, 0);
}

/** A plant's pot as js/base-furniture-kinds.js's `potAt()` paints it (round, square, tray or basket); returns its soil's height. */
export function potOf(K, L, kind = 'round') {
  const { lathe, rbox, cyl, torus } = L, pot = K.gloss(K.pal.pot), rim = K.gloss(L.tone(K.pal.pot, 1.12)), soil = K.plain('#3a2416');
  if (kind === 'square') {
    K.put(rbox(u(16), u(13), u(16), 0.03), pot, 0, u(6.5), 0);
    K.put(rbox(u(18), u(3), u(18), 0.025), rim, 0, u(14.5), 0);
    K.put(rbox(u(14), 0.01, u(14), 0.004), soil, 0, u(16), 0);
    return u(16);
  }
  if (kind === 'tray') {
    K.put(rbox(u(26), u(8), u(20), 0.04), pot, 0, u(4), 0);
    K.put(rbox(u(23), 0.012, u(17), 0.006), K.plain('#4a3020'), 0, u(8), 0);
    const R = K.r;
    for (let i = 0; i < 6; i++) K.put(L.blob(0.06, 0.03, 0.05, 0.6, 0.6), K.gloss('#78a858'), -0.3 + i * 0.12, u(8) + 0.01, (R() - 0.5) * 0.3);
    return u(8);
  }
  if (kind === 'basket') {
    const wicker = K.wood(), dark = K.wood(L.tone(K.pal.w, 0.8));
    K.put(lathe([[u(9), 0], [u(10), u(14)], [u(10), u(16)], [0.001, u(16)]], 28), wicker, 0, 0, 0);
    for (let j = 1; j < 5; j++) K.put(torus(u(9.2) + j * u(0.2), 0.01, Math.PI * 2, 28), dark, 0, j * u(3.2), 0, 0, Math.PI / 2);
    K.put(torus(u(10.5), 0.035, Math.PI * 2, 28), wicker, 0, u(16.5), 0, 0, Math.PI / 2);
    K.put(cyl(u(9.8), 0.01, u(9.8), 24), soil, 0, u(16.4), 0);
    return u(16.5);
  }
  K.put(lathe([[u(6), 0], [u(6.4), u(1)], [u(7), u(15)], [u(9), u(15)], [u(9), u(19)], [u(8), u(19)], [u(7.6), u(18)], [0.001, u(18)]], 28), pot, 0, 0, 0);
  K.put(cyl(u(7.8), 0.01, u(7.8), 24), soil, 0, u(18.4), 0);
  K.put(torus(u(8.6), 0.012, Math.PI * 2, 28), rim, 0, u(19), 0, 0, Math.PI / 2);
  return u(18.4);
}

/** A leaf `len` long and `wid` wide from x, y, z, `turn` round, its tip `tip` from upright, curling down by `curl`. */
export function leaf(K, L, m, x, y, z, turn, tip, len, wid, curl = 0) {
  const g = L.ball(1, 12, 8).scale(wid, 0.012 + wid * 0.08, len / 2);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) { const t = (pos.getZ(i) / len + 0.5); pos.setY(i, pos.getY(i) - curl * t * t * len); }
  g.computeVertexNormals();
  g.translate(0, 0, len / 2); g.rotateX(-(Math.PI / 2 - tip)); g.rotateY(turn);
  K.put(g, m, x, y, z);
}

/** A ribbed column of a cactus from y0 up h, r across, its top rounded, its spines dotted on. */
export function column(K, L, x, y0, z, r, h, m, spine) {
  const pts = [[r * 0.9, 0], [r, 0.03]];
  for (let i = 0; i <= 8; i++) { const a = i / 8 * Math.PI / 2; pts.push([Math.cos(a) * r, h - r + Math.sin(a) * r]); }
  const g = L.lathe(pts, 24), pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) { const a = Math.atan2(pos.getZ(i), pos.getX(i)), f = 1 + 0.07 * Math.cos(a * 8); pos.setX(i, pos.getX(i) * f); pos.setZ(i, pos.getZ(i) * f); }
  g.computeVertexNormals();
  K.put(g, m, x, y0, z);
  for (let j = 0.08; j < h - r * 0.5; j += 0.1) for (let k = 0; k < 8; k++) {
    if ((k + Math.round(j * 10)) % 2) continue;
    const a = k / 8 * Math.PI * 2 + 0.2;
    K.put(L.ball(0.008, 6, 4), spine, x + Math.cos(a) * r * 1.06, y0 + j, z + Math.sin(a) * r * 1.06);
  }
}

/** A cactus arm: out sideways from the trunk at y, then up `h`. */
export function cactusArm(K, L, x, y, z, side, out, r, h, m, spine) {
  K.put(L.cyl(r, out, r, 18).rotateZ(Math.PI / 2), m, x + side * out / 2, y, z);
  K.put(L.ball(r, 18, 12), m, x + side * out, y, z);
  column(K, L, x + side * out, y, z, r, h, m, spine);
}

const BERRY_BUSH = {
  oran: ['#4a78d8', 'round'], pecha: ['#f890b8', 'wide'], cheri: ['#e03838', 'wide'], chesto: ['#7a4ab8', 'tall'],
  rawst: ['#58b8a8', 'round'], aspear: ['#f0d848', 'tall'], leppa: ['#e86a38', 'round'], sitrus: ['#f0e070', 'wide'],
};
// each bush's clumps as [x, y above the basket, size] in painting pixels, after js/base-furniture-kinds.js's BUSHES
const BUSH_FORM = {
  round: [[10, 10, 9], [22, 12, 9], [16, 22, 10], [16, 12, 9]],
  tall: [[12, 9, 8], [20, 11, 8], [16, 23, 8], [16, 36, 7], [16, 14, 8]],
  wide: [[6, 8, 8], [26, 8, 8], [16, 15, 10], [16, 8, 9]],
};

export const SHAPES = {
  // boxes, the painting on the front only (js/base-models-kit.js)
  'pantry': { make: 'frontbox', d: 0.45 },
  'watercooler': { make: 'frontbox', d: 0.45, top: 0.35 },
  'milkcrate': { make: 'frontbox', d: 0.5, top: 0.45 },
  // built from parts
  fern: { make: 'fern' },
  cactus: { make: 'cactus' },
  tulips: { make: 'tulips' },
  sunflower: { make: 'sunflower' },
  rosebush: { make: 'rosebush' },
  bonsai: { make: 'bonsai' },
  bamboo: { make: 'bamboo' },
  succulent: { make: 'succulent' },
  mushpot: { make: 'mushpot' },
  saguaro: { make: 'saguaro' },
  pine: { make: 'pine' },
  'oranbush pechabush cheribush chestobush rawstbush aspearbush leppabush sitrusbush': { make: 'berrybush' },
  topiary: { make: 'topiary' },
  appletree: { make: 'appletree' },
  teacart: { make: 'teacart' },
  wateringcan: { make: 'wateringcan' },
  wheelbarrow: { make: 'wheelbarrow' },
  gnome: { make: 'gnome' },
  birdbath: { make: 'birdbath' },
  birdhouse: { make: 'birdhouse' },
  gardenlamp: { make: 'gardenlamp' },
  picket: { make: 'picket' },
  rosearch: { make: 'rosearch' },
  hedge: { make: 'hedge' },
  sundial: { make: 'sundial' },
  stonelantern: { make: 'stonelantern' },
  scarecrow: { make: 'scarecrow' },
  swingseat: { make: 'swingseat', seat: 0.74 },
  hammock: { make: 'hammock', seat: 0.92 },
  planter: { make: 'planter' },
  beehive: { make: 'beehive' },
  well: { make: 'well' },
  hosereel: { make: 'hosereel' },
};

export const MAKES = {
  /* ----- Plants ----- */

  fern(K, s, W, D, L) {
    const t = potOf(K, L), R = K.r, greens = [K.gloss(K.pal.leaf), K.gloss(L.tone(K.pal.leaf, 1.12)), K.gloss(L.tone(K.pal.leaf, 0.88))];
    // fronds arching out all round, each a stem with leaflets in pairs, shorter toward its tip
    for (let f = 0; f < 11; f++) {
      const a = f * 2.4 + R() * 0.3, len = 0.42 + R() * 0.2, up = 0.55 + (f % 3) * 0.25, ca = Math.sin(a), co = Math.cos(a), pts = [];
      for (let i = 0; i <= 8; i++) { const q = i / 8, r = q * len, y = t + 0.02 + Math.sin(q * Math.PI * 0.9) * len * up * 0.6 - q * q * 0.08; pts.push([ca * r, y, co * r]); }
      K.put(tube(L, pts, 0.007, 12), greens[2]);
      for (let i = 1; i < 8; i++) {
        const [x, y, z] = pts[i], q = i / 8, l = 0.1 * (1 - q * 0.7);
        for (const sd of [-1, 1]) leaf(K, L, greens[(i + f) % 2], x, y, z, a + sd * 1.2, 0.9 + q * 0.6, l, 0.022, 0.15);
      }
    }
  },

  cactus(K, s, W, D, L) {
    const t = potOf(K, L, 'square'), m = K.gloss(K.pal.leaf), spine = K.gloss('#f4f0d0');
    // the trunk, a low arm on the left, a higher one on the right, a flower on top
    column(K, L, X(16.5), t, 0, u(4.5), u(30), m, spine);
    cactusArm(K, L, X(16.5), t + u(12), 0.02, -1, u(7), u(2.6), u(10), m, spine);
    cactusArm(K, L, X(16.5), t + u(16), -0.02, 1, u(6.5), u(2.6), u(10), m, spine);
    flower(K, L, X(16.5), t + u(30.5), 0, K.pal.c, 0.05, 0, 1.45);
  },

  tulips(K, s, W, D, L) {
    const { lathe, cyl } = L, t = potOf(K, L), stem = K.gloss(L.tone(K.pal.leaf, 0.85));
    // three stems, each a cupped bloom of three petals; two long leaves
    for (const [i, h, c, z] of [[9, 22, K.pal.c, 0.03], [16, 28, L.tone(K.pal.c, 1.15), -0.04], [23, 20, K.pal.a, 0.05]]) {
      const x = X(i + 1), top = t + u(h);
      K.put(cyl(0.012, u(h), 0.014, 8), stem, x, t + u(h) / 2, z);
      K.put(lathe([[0.001, 0], [0.05, 0.02], [0.07, 0.07], [0.065, 0.13], [0.05, 0.15], [0.001, 0.1]], 18), K.gloss(c), x, top, z);
      for (let p = 0; p < 3; p++) { const a = p / 3 * Math.PI * 2; K.put(L.ball(1, 10, 8).scale(0.03, 0.06, 0.012), K.gloss(c), x + Math.cos(a) * 0.05, top + 0.15, z + Math.sin(a) * 0.05, -a + Math.PI / 2); }
    }
    for (const [x, a, tip] of [[X(9), -1.3, 0.35], [X(24), 1.4, 0.3], [X(16), 0.2, 0.4]]) leaf(K, L, K.gloss(K.pal.leaf), x, t, 0, a, tip, 0.34, 0.05, 0.12);
  },

  sunflower(K, s, W, D, L) {
    const { cyl, ball } = L, t = potOf(K, L), hy = t + u(54), stem = K.gloss(L.tone(K.pal.leaf, 0.85));
    // a tall stem with two broad leaves, the head turned to the front: a ring of petals round a seed disc
    K.put(cyl(0.025, u(54), 0.032, 10), stem, 0, t + u(27), 0);
    leaf(K, L, K.gloss(K.pal.leaf), 0, t + u(18), 0, -1.4, 0.8, 0.22, 0.07, 0.1);
    leaf(K, L, K.gloss(K.pal.leaf), 0, t + u(28), 0, 1.5, 0.85, 0.22, 0.07, 0.1);
    for (let a = 0; a < 16; a++) {
      const ang = a / 16 * Math.PI * 2, g = ball(1, 10, 8).scale(0.04, 0.1, 0.015).translate(0, 0.19, 0).rotateZ(ang).rotateX(-0.25);
      K.put(g, K.gloss(a % 2 ? '#f8c830' : '#f0b020'), 0, hy, 0.04 + (a % 2) * 0.006);
    }
    K.put(cyl(0.15, 0.06, 0.15, 28).rotateX(Math.PI / 2 - 0.25), K.gloss('#6a3a18'), 0, hy, 0.04);
    K.put(ball(0.13, 24, 12).scale(1, 1, 0.3).rotateX(-0.25), K.gloss('#4a2810'), 0, hy, 0.06);
    K.put(cyl(0.12, 0.1, 0.05, 20).rotateX(Math.PI / 2 - 0.25), K.gloss(L.tone(K.pal.leaf, 0.85)), 0, hy - 0.01, -0.02);
  },

  rosebush(K, s, W, D, L) {
    const t = potOf(K, L, 'square');
    // a round bush of leaves, roses dotted over it: a bloom, a darker wrap, a bright heart
    bush(K, L, 0, t + u(13), 0, 0.4, 20);
    const R = K.r;
    for (let n = 0; n < 11; n++) {
      const a = n * 2.4, e = (R() - 0.3) * 1.2, x = Math.cos(a) * Math.cos(e) * 0.4, y = t + u(13) + Math.sin(e) * 0.36, z = Math.sin(a) * Math.cos(e) * 0.4;
      K.put(L.ball(0.055, 14, 10), K.gloss(L.tone(K.pal.c, 0.85)), x, y, z);
      K.put(L.ball(0.04, 12, 8), K.gloss(K.pal.c), x * 1.08, y + 0.015, z * 1.08);
      K.put(L.torus(0.025, 0.01, Math.PI * 1.6, 12), K.gloss(L.tone(K.pal.c, 1.2)), x * 1.14, y + 0.02, z * 1.14, a, Math.PI / 2 - 0.3);
    }
  },

  bonsai(K, s, W, D, L) {
    const t = potOf(K, L, 'tray'), bark = K.wood();
    // a twisting trunk, two branches out, three flat pads of leaves
    K.put(tube(L, [[0, t - 0.02, 0], [0.06, t + 0.15, 0.02], [-0.04, t + 0.35, -0.02], [0.02, t + 0.55, 0], [-0.01, t + 0.78, 0]], 0.05, 24), bark);
    K.put(tube(L, [[0.03, t + 0.22, 0.01], [-0.12, t + 0.32, 0.04], [-0.26, t + 0.38, 0.06]], 0.025, 12), bark);
    K.put(tube(L, [[-0.02, t + 0.4, 0], [0.12, t + 0.5, -0.02], [0.26, t + 0.58, -0.04]], 0.025, 12), bark);
    for (const [x, y, z, w] of [[-0.26, t + 0.43, 0.06, 0.22], [0.26, t + 0.63, -0.04, 0.25], [-0.01, t + 0.84, 0, 0.22]]) {
      bush(K, L, x, y, z, w, 8);
      K.put(L.blob(w * 1.6, w * 0.4, w * 1.3, 0.5, 0.5), K.gloss(L.tone(K.pal.leaf, 0.9)), x, y - 0.02, z);
    }
  },

  bamboo(K, s, W, D, L) {
    const { cyl, torus } = L, t = potOf(K, L, 'square'), cane = K.gloss(K.pal.leaf), node = K.gloss(L.tone(K.pal.leaf, 0.75));
    // three canes in joints, a spray of thin leaves near each top
    for (const [i, h, z] of [[11, 52, 0.05], [17, 62, -0.04], [23, 46, 0.06]]) {
      const x = X(i + 1), H = u(h);
      K.put(cyl(0.035, H, 0.04, 14), cane, x, t + H / 2, z);
      for (let j = 0.3; j < H; j += 0.34) K.put(torus(0.04, 0.01, Math.PI * 2, 16), node, x, t + j, z, 0, Math.PI / 2);
      for (let n = 0; n < 5; n++) leaf(K, L, K.gloss(L.tone(K.pal.leaf, 1.1 - n * 0.05)), x, t + H - 0.1 - (n % 3) * 0.12, z, n * 2.2 + i, 1.1, 0.2, 0.025, 0.2);
    }
  },

  succulent(K, s, W, D, L) {
    const t = potOf(K, L, 'square'), R = K.r;
    // a rosette of plump pointed leaves in rings, tipped in the theme's colour, a bud in the middle
    const tip = K.gloss(L.tone(K.pal.c, 1.1));
    for (const [n, r, len, up, y] of [[9, 0.06, 0.28, 0.4, 0.02], [7, 0.04, 0.22, 0.75, 0.06], [5, 0.015, 0.15, 1.05, 0.1]]) {
      for (let i = 0; i < n; i++) {
        const a = i / n * Math.PI * 2 + n, g = L.ball(1, 14, 10).scale(0.07, 0.035, len / 2);
        g.translate(0, 0, len / 2 + r); g.rotateX(-up); g.rotateY(a);
        K.put(g, K.gloss(L.tone(K.pal.leaf, 1.15)), 0, t + y, 0);
        K.put(L.ball(0.02, 8, 6), tip, Math.sin(a) * (r + len * Math.cos(up)), t + y + len * Math.sin(up), Math.cos(a) * (r + len * Math.cos(up)));
      }
    }
    K.put(L.ball(0.05, 12, 10), K.gloss(K.pal.c), 0, t + 0.24, 0);
  },

  mushpot(K, s, W, D, L) {
    const { cyl, lathe, ball } = L, t = potOf(K, L), cap = K.gloss('#d84848'), stalk = K.gloss('#f4f0e0'), dot = K.gloss('#ffffff');
    // three toadstools, the tallest at the back
    for (const [i, h, r, z] of [[11, 10, 5, 0.06], [21, 15, 7, -0.05], [16, 6, 3, 0.1]]) {
      const x = X(i), H = u(h), R = u(r);
      K.put(cyl(R * 0.35, H, R * 0.42, 14), stalk, x, t + H / 2, z);
      K.put(lathe([[R * 0.4, 0], [R, 0.01], [R * 1.02, R * 0.25], [R * 0.75, R * 0.62], [0.001, R * 0.72]], 24), cap, x, t + H - 0.01, z);
      for (let k = 0; k < 5; k++) { const a = k * 2.4 + i, e = 0.4 + (k % 2) * 0.4; K.put(ball(R * 0.13, 8, 6).scale(1, 0.5, 1), dot, x + Math.cos(a) * R * Math.cos(e) * 0.95, t + H + Math.sin(e) * R * 0.62, z + Math.sin(a) * R * Math.cos(e) * 0.95); }
    }
  },

  saguaro(K, s, W, D, L) {
    const t = potOf(K, L, 'square'), m = K.gloss(K.pal.leaf), spine = K.gloss('#f4f0d0');
    // a tall trunk, a long arm left and a shorter one right
    column(K, L, X(16.5), t, 0, u(4.5), u(62), m, spine);
    cactusArm(K, L, X(16.5), t + u(25), 0, -1, u(10.5), u(3), u(18), m, spine);
    cactusArm(K, L, X(16.5), t + u(35), 0, 1, u(10.5), u(3), u(16), m, spine);
  },

  pine(K, s, W, D, L) {
    const { cyl, lathe, ball } = L, t = potOf(K, L), R = K.r;
    // a short trunk, three tiers of needles, a star on top and a few baubles
    K.put(cyl(0.05, u(12), 0.06, 12), K.wood(), 0, t + u(6), 0);
    for (const [y, h, r, f] of [[t + u(8), u(22), 0.36, 0.85], [t + u(24), u(20), 0.28, 1], [t + u(39), u(18), 0.2, 1.15]]) {
      const g = lathe([[0.001, 0], [r, 0.03], [r * 0.92, 0.07], [r * 0.5, h * 0.55], [0.001, h]], 24), pos = g.attributes.position;
      for (let i = 0; i < pos.count; i++) { const a = Math.atan2(pos.getZ(i), pos.getX(i)), q = 1 + 0.08 * Math.cos(a * 9); pos.setX(i, pos.getX(i) * q); pos.setZ(i, pos.getZ(i) * q); }
      g.computeVertexNormals();
      K.put(g, K.gloss(L.tone(K.pal.leaf, f * 0.9)), 0, y, 0);
    }
    const star = new L.THREE.Shape();
    for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.035 : 0.08; i ? star.lineTo(Math.cos(a) * r, Math.sin(a) * r) : star.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    const sg = new L.THREE.ExtrudeGeometry(star, { depth: 0.03, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 2 });
    sg.translate(0, 0, -0.015);
    K.put(sg, K.gloss(K.pal.a), 0, t + u(58) + 0.06, 0);
    for (const [y, r, c] of [[t + u(14), 0.3, K.pal.c], [t + u(22), 0.22, '#4a7ac8'], [t + u(30), 0.22, K.pal.a], [t + u(18), 0.27, K.pal.p], [t + u(42), 0.14, K.pal.c]]) {
      const a = R() * Math.PI * 2;
      K.put(ball(0.035, 12, 10), K.gloss(c), Math.sin(a) * r, y, Math.cos(a) * r);
    }
  },

  berrybush(K, s, W, D, L) {
    const [col, form] = BERRY_BUSH[K.p.fam.replace(/bush$/, '')] || ['#4a78d8', 'round'], t = potOf(K, L, 'basket'), R = K.r;
    // clumps of leaves in the bush's outline, Berries hanging all over it
    const clumps = BUSH_FORM[form];
    for (const [i, j, r] of clumps) bush(K, L, X(i) * 0.8, t + u(j) - 0.04, 0, u(r) * 1.15, 9);
    const berry = K.gloss(col), stalk = K.gloss('#4a7a2a');
    for (let n = 0; n < 12; n++) {
      const [i, j, r] = clumps[n % clumps.length], a = n * 2.4, e = (R() - 0.3) * 1.1, rr = u(r) * 1.15 * 0.98;
      const x = X(i) * 0.8 + Math.cos(a) * Math.cos(e) * rr, y = t + u(j) - 0.04 + Math.sin(e) * rr * 0.9, z = Math.sin(a) * Math.cos(e) * rr;
      if (form === 'wide') for (const d of [-1, 1]) K.put(L.ball(0.048, 12, 10), berry, x + d * 0.042, y, z);
      else if (form === 'tall') K.put(L.ball(1, 12, 10).scale(0.055, 0.075, 0.055), berry, x, y, z);
      else K.put(L.ball(0.068, 14, 10), berry, x, y, z);
      K.put(L.cyl(0.007, 0.05, 0.007, 6), stalk, x, y + 0.08, z);
    }
  },

  /* ----- Garden ----- */

  topiary(K, s, W, D, L) {
    const t = potOf(K, L, 'square'), R = K.r;
    // a straight stem, two clipped balls of leaves, a few flowers tucked in
    K.put(L.cyl(0.028, u(36), 0.034, 12), K.wood(), 0, t + u(18), 0);
    for (const [y, r] of [[u(30), u(7)], [u(54), u(11)]]) {
      K.put(L.ball(r * 0.95, 28, 20), K.gloss(L.tone(K.pal.leaf, 0.9)), 0, y, 0);
      for (let n = 0; n < 40; n++) {
        const a = n * 2.4, e = Math.asin(1 - 2 * (n + 0.5) / 40), q = r * 0.92;
        K.put(L.ball(r * 0.17, 10, 8), K.gloss(L.tone(K.pal.leaf, 0.95 + R() * 0.15)), Math.cos(a) * Math.cos(e) * q, y + Math.sin(e) * q, Math.sin(a) * Math.cos(e) * q);
      }
    }
    for (const [y, a, r] of [[u(60), 0.5, u(11)], [u(50), 2.6, u(11)], [u(30), 4.2, u(7)], [u(56), 5.2, u(11)]]) flower(K, L, Math.sin(a) * r, y, Math.cos(a) * r, K.pal.c, 0.035, a, 0.2);
  },

  appletree(K, s, W, D, L) {
    const bark = K.wood(), apple = K.gloss('#e04040'), R = K.r;
    // a trunk flaring into roots, two boughs, a crown of three big clumps, apples in it and one fallen
    K.put(L.lathe([[0.16, 0], [0.1, 0.06], [0.085, 0.3], [0.075, u(40)], [0.001, u(40)]], 16), bark, 0, 0, 0);
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.4; K.put(L.ball(1, 10, 8).scale(0.04, 0.035, 0.12).translate(0, 0, 0.12), bark, 0, 0.02, 0, a); }
    K.put(tube(L, [[0, u(30), 0], [-0.12, u(42), 0.02], [-0.22, u(50), 0.04]], 0.04, 10), bark);
    K.put(tube(L, [[0, u(34), 0], [0.12, u(44), -0.02], [0.22, u(52), -0.04]], 0.04, 10), bark);
    for (const [x, y, r] of [[X(9), u(52), 0.32], [X(23), u(54), 0.32], [X(16), u(66), 0.36], [0, u(56), 0.3]]) bush(K, L, x, y, 0, r, 12);
    for (let n = 0; n < 9; n++) {
      const [cx, cy, r] = [[X(9), u(52), 0.31], [X(23), u(54), 0.31], [X(16), u(66), 0.35]][n % 3], a = n * 2.4, e = (R() - 0.4) * 1.2;
      const x = cx + Math.cos(a) * Math.cos(e) * r, y = cy + Math.sin(e) * r * 0.9, z = Math.sin(a) * Math.cos(e) * r;
      K.put(L.ball(0.062, 14, 10), apple, x, y, z);
      K.put(L.cyl(0.007, 0.04, 0.007, 6), K.wood('#5a3a22'), x, y + 0.07, z);
    }
    K.put(L.ball(0.05, 14, 10), apple, X(24), 0.05, 0.22);
  },

  /* ----- Kitchen ----- */

  teacart(K, s, W, D, L) {
    const { rbox, cyl, lathe, ball, torus } = L, metal = K.metal(K.pal.m), wood = K.wood(), dark = K.gloss('#303038');
    // four castors, a post at each corner, two trays with a lip; the push handle off the right end
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      K.put(cyl(0.05, 0.04, 0.05, 16).rotateX(Math.PI / 2), dark, sx * 0.36, 0.05, sz * 0.24);
      K.put(cyl(0.02, u(34) - 0.08, 0.02, 12), metal, sx * 0.4, 0.08 + (u(34) - 0.08) / 2, sz * 0.28);
    }
    for (const y of [u(10.5), u(28.5)]) {
      K.put(rbox(0.88, 0.04, 0.64, 0.012), wood, 0, y, 0);
      for (const sz of [-1, 1]) K.put(rbox(0.88, 0.05, 0.02, 0.008), wood, 0, y + 0.04, sz * 0.31);
      for (const sx of [-1, 1]) K.put(rbox(0.02, 0.05, 0.62, 0.008), wood, sx * 0.43, y + 0.04, 0);
    }
    for (const sz of [-1, 1]) rod(K, L, metal, [0.4, u(34), sz * 0.28], [0.5, u(40), sz * 0.24], 0.018);
    K.put(cyl(0.022, 0.5, 0.022, 12).rotateX(Math.PI / 2), K.gloss(K.pal.a), 0.5, u(40), 0);
    // on the top tray a teapot and two cups on saucers
    const top = u(28.5) + 0.02, pot = K.gloss(K.pal.c);
    K.put(lathe([[0.1, 0], [0.14, 0.04], [0.16, 0.1], [0.14, 0.17], [0.09, 0.2], [0.001, 0.2]], 24), pot, X(10), top, 0.02);
    K.put(tube(L, [[X(10) + 0.13, top + 0.07, 0.02], [X(10) + 0.2, top + 0.12, 0.02], [X(10) + 0.24, top + 0.2, 0.02]], 0.022, 12), pot);
    K.put(torus(0.07, 0.018, Math.PI * 1.3, 16).rotateZ(Math.PI * 0.35), pot, X(10) - 0.15, top + 0.1, 0.02);
    K.put(cyl(0.07, 0.03, 0.08, 18), pot, X(10), top + 0.21, 0.02);
    K.put(ball(0.03, 12, 8), K.gloss(K.pal.a), X(10), top + 0.25, 0.02);
    for (const [i, z] of [[21, 0.12], [26, -0.1]]) {
      K.put(cyl(0.07, 0.012, 0.07, 18), K.gloss('#ffffff'), X(i), top + 0.006, z);
      K.put(lathe([[0.035, 0], [0.05, 0.02], [0.055, 0.08], [0.05, 0.08], [0.045, 0.025], [0.001, 0.02]], 18), K.gloss('#ffffff'), X(i), top + 0.012, z);
      K.put(cyl(0.046, 0.004, 0.046, 16), K.plain('#a8603a'), X(i), top + 0.08, z);
      K.put(torus(0.022, 0.008, Math.PI * 2, 12), K.gloss('#ffffff'), X(i) + 0.06, top + 0.06, z);
    }
    // on the bottom tray three plates of biscuits
    const low = u(10.5) + 0.02;
    for (const [i, z] of [[8, 0.08], [16, -0.08], [23, 0.06]]) {
      K.put(cyl(0.1, 0.014, 0.08, 20), K.gloss('#f8e8c8'), X(i), low + 0.007, z);
      for (let n = 0; n < 3; n++) K.put(cyl(0.035, 0.018, 0.035, 14), K.plain('#c89058'), X(i) + (n - 1) * 0.045, low + 0.024 + (n % 2) * 0.012, z + (n === 1 ? 0.02 : 0));
    }
  },

  /* ----- Garden ----- */

  wateringcan(K, s, W, D, L) {
    const { cyl, lathe, torus } = L, can = K.gloss(K.pal.c), band = K.gloss(K.pal.a);
    const x = X(13.5), r = u(7.5), h = u(17);
    // the can, a rolled rim round its opening, a band round its foot
    K.put(cyl(r, h, r, 32), can, x, h / 2, 0);
    K.put(torus(r - 0.008, 0.016, Math.PI * 2, 32), K.gloss(L.tone(K.pal.c, 1.15)), x, h, 0, 0, Math.PI / 2);
    K.put(cyl(r * 0.65, 0.01, r * 0.65, 24), K.plain('#2a3a5a'), x, h - 0.012, 0.0);
    K.put(cyl(r + 0.006, u(2), r + 0.006, 32), band, x, u(9), 0);
    // the handle over the top, the spout reaching up from the foot to its rose
    K.put(torus(u(5.5), 0.022, Math.PI, 20), K.gloss(L.tone(K.pal.c, 0.85)), x, h + u(1), 0);
    K.put(tube(L, [[x + r - 0.02, u(4), 0], [X(24), u(10), 0], [X(28), u(16.5), 0]], 0.026, 16), can);
    const rose = lathe([[0.03, 0], [0.07, 0.05], [0.075, 0.06], [0.001, 0.065]], 20);
    rose.rotateZ(-Math.PI / 4);
    K.put(rose, band, X(28), u(16.5), 0);
  },

  wheelbarrow(K, s, W, D, L) {
    const { THREE, cyl, torus, blob } = L, tray = K.gloss(K.pal.c), wood = K.wood(L.tone(K.pal.w, 0.85)), metal = K.metal(K.pal.m);
    // the tray: a square bowl, wider at the rim, sloping up toward the wheel
    const g = new THREE.CylinderGeometry(0.62, 0.36, u(11), 4, 1);
    g.rotateY(Math.PI / 4); g.scale(1, 1, 0.66);
    K.put(g, tray, X(13), u(18.5), 0, 0, 0, -0.12);
    K.put(blob(0.62, 0.12, 0.44, 0.6, 0.6), K.plain('#5a3a22'), X(13), u(24), 0, 0, 0, -0.12);
    bush(K, L, X(10), u(27.5), -0.02, 0.18, 8);
    for (const [dx, dz, c] of [[0.05, 0.08, K.pal.a], [-0.08, 0.06, K.pal.p], [0.12, -0.06, K.pal.a]]) flower(K, L, X(15) + dx, u(29.5), dz, c, 0.045, 0, 1.1);
    // the wheel out front on its forks
    K.put(torus(u(5), 0.05, Math.PI * 2, 28), K.gloss('#303038'), X(8), u(6), 0);
    K.put(cyl(u(3), 0.08, u(3), 20).rotateX(Math.PI / 2), metal, X(8), u(6), 0);
    for (const sz of [-1, 1]) rod(K, L, metal, [X(8), u(6), sz * 0.06], [X(13), u(14), sz * 0.14], 0.014);
    // two handles back from under the tray, a leg under each
    for (const sz of [-1, 1]) {
      rod(K, L, wood, [X(6), u(13), sz * 0.16], [X(31), u(21), sz * 0.2], 0.022);
      K.put(cyl(0.028, 0.14, 0.028, 12).rotateZ(Math.PI / 2 - 0.3), K.gloss('#303038'), X(30), u(20.6), sz * 0.2);
      rod(K, L, wood, [X(26.5), u(18.5), sz * 0.19], [X(26.5), 0.02, sz * 0.19], 0.022);
    }
  },

  gnome(K, s, W, D, L) {
    const { lathe, ball, blob, cyl, torus } = L, x = X(16), skin = K.gloss('#f8d0b0'), boot = K.gloss('#5a3a22');
    // two boots, a round coat in the accent, a belt and its buckle
    for (const sx of [-1, 1]) K.put(blob(0.12, 0.1, 0.18, 0.5, 0.5), boot, x + sx * 0.07, 0.05, 0.03);
    K.put(lathe([[0.17, 0], [0.24, 0.08], [0.26, 0.25], [0.22, 0.45], [0.13, 0.58], [0.001, 0.62]], 28), K.gloss(K.pal.a), x, 0.08, 0);
    K.put(cyl(0.255, 0.06, 0.258, 28), K.gloss(L.tone(K.pal.w, 0.7)), x, u(12), 0);
    K.put(L.rbox(0.09, 0.07, 0.03, 0.01), K.metal('#f8d050'), x, u(12), 0.255);
    for (const sx of [-1, 1]) {
      K.put(ball(1, 14, 10).scale(0.06, 0.15, 0.06), K.gloss(K.pal.a), x + sx * 0.22, u(15), 0.06, 0, 0, sx * 0.35);
      K.put(ball(0.05, 12, 8), skin, x + sx * 0.26, u(10.5), 0.1);
    }
    // the head, rosy cheeks and a round nose, a white beard down over the coat
    const hy = u(26);
    K.put(ball(0.16, 22, 16), skin, x, hy, 0);
    K.put(ball(0.05, 12, 10), K.gloss('#f8a090'), x, hy - 0.02, 0.16);
    for (const sx of [-1, 1]) {
      K.put(ball(0.022, 10, 8), K.gloss('#202028'), x + sx * 0.06, hy + 0.035, 0.145);
      K.put(ball(0.035, 10, 8).scale(1, 0.6, 0.4), K.gloss('#f8b0a0'), x + sx * 0.1, hy - 0.03, 0.12);
    }
    K.put(blob(0.3, 0.32, 0.12, 0.7, 0.45), K.gloss('#ffffff'), x, hy - 0.16, 0.12);
    K.put(blob(0.3, 0.1, 0.24, 0.6, 0.6), K.gloss('#f0f0f6'), x, hy - 0.03, 0.04);
    // the tall pointed hat, a rolled brim, its tip leaning back
    K.put(torus(0.15, 0.03, Math.PI * 2, 24), K.gloss(L.tone(K.pal.c, 0.85)), x, hy + 0.1, 0, 0, Math.PI / 2);
    const hat = lathe([[0.16, 0], [0.13, 0.15], [0.08, 0.32], [0.03, 0.45], [0.001, 0.5]], 24);
    hat.rotateX(-0.12);
    K.put(hat, K.gloss(K.pal.c), x, hy + 0.1, 0);
  },

  birdbath(K, s, W, D, L) {
    const { lathe, ball, blob, cyl } = L, stone = K.gloss(K.pal.p);
    // a square foot, a turned pedestal with a collar, a wide shallow bowl of water
    K.put(L.rbox(0.5, u(5), 0.5, 0.03), stone, 0, u(2.5), 0);
    K.put(lathe([[0.12, 0], [0.09, 0.08], [0.085, 0.2], [0.11, 0.24], [0.11, 0.28], [0.085, 0.31], [0.09, 0.46], [0.14, 0.56], [0.001, 0.56]], 28), stone, 0, u(5), 0);
    K.put(lathe([[0.12, 0], [0.38, 0.1], [0.42, 0.18], [0.4, 0.2], [0.34, 0.14], [0.001, 0.12]], 36), stone, 0, u(24), 0);
    K.put(cyl(0.355, 0.01, 0.355, 36), K.gloss('#7ab8e0'), 0, u(24) + 0.155, 0);
    // a little bird on the rim, dipping its head
    const bx = X(22), by = u(24) + 0.24;
    K.put(blob(0.16, 0.12, 0.11, 0.6, 0.6), K.gloss('#b8885a'), bx, by, 0.02, 0, 0, -0.2);
    K.put(ball(0.06, 14, 10), K.gloss('#b8885a'), bx - 0.09, by + 0.07, 0.02);
    K.put(lathe([[0.016, 0], [0.001, 0.05]], 10).rotateZ(Math.PI / 2), K.gloss('#f0b040'), bx - 0.14, by + 0.07, 0.02);
    K.put(blob(0.1, 0.03, 0.06, 0.6, 0.6), K.gloss('#8a6040'), bx + 0.11, by + 0.04, 0.02, 0, 0, 0.5);
    for (const sz of [-1, 1]) K.put(ball(0.012, 8, 6), K.gloss('#202028'), bx - 0.12, by + 0.09, 0.02 + sz * 0.04);
  },

  birdhouse(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, wood = K.wood();
    // a post on its foot, the house on top: a box in the theme's colour, a round door and a perch, a pitched roof
    K.put(rbox(0.3, 0.06, 0.3, 0.02), wood, 0, 0.03, 0);
    K.put(cyl(u(2), u(46), u(2.2), 14), wood, 0, u(23), 0);
    const y0 = u(46), h = u(18);
    K.put(rbox(u(16), h, u(16), 0.02), K.wood(K.pal.c), 0, y0 + h / 2, 0);
    K.put(rbox(u(18), 0.04, u(18), 0.012), wood, 0, y0, 0);
    K.put(cyl(u(3), 0.02, u(3), 20).rotateX(Math.PI / 2), K.plain('#2a1a10'), 0, u(57), u(8) + 0.005);
    K.put(cyl(0.012, 0.1, 0.012, 8).rotateX(Math.PI / 2), wood, 0, u(51.5), u(8) + 0.05);
    K.put(ball(0.016, 8, 6), wood, 0, u(51.5), u(8) + 0.1);
    gableRoof(K, L, y0 + h, u(16), u(16), u(8), 0.06, K.wood(K.pal.a), K.wood(K.pal.c));
  },

  gardenlamp(K, s, W, D, L) {
    const { THREE, rbox, cyl, ball } = L, metal = K.metal(K.pal.m);
    // a square foot, a post with a collar, a lantern of four glowing panes, a pyramid cap and finial
    K.put(rbox(u(12), u(6), u(12), 0.02), metal, 0, u(3), 0);
    K.put(cyl(u(2), u(54), u(2.4), 16), metal, 0, u(33), 0);
    K.put(cyl(u(4), u(2), u(4), 16), metal, 0, u(29), 0);
    K.put(rbox(u(18), u(2), u(18), 0.01), metal, 0, u(60), 0);
    const ly = u(69), lh = u(18), lw = u(16);
    K.put(rbox(lw - 0.06, lh - 0.04, lw - 0.06, 0.01), K.glow(K.pal.g), 0, ly, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.put(rbox(0.035, lh, 0.035, 0.008), metal, sx * lw / 2, ly, sz * lw / 2);
    for (let a = 0; a < 4; a++) K.put(rbox(0.02, lh - 0.04, 0.012, 0.004).translate(0, 0, lw / 2 - 0.025), metal, 0, ly, 0, a * Math.PI / 2);
    for (const y of [ly - lh / 2, ly + lh / 2]) K.put(rbox(lw + 0.04, 0.03, lw + 0.04, 0.008), metal, 0, y, 0);
    const cap = new THREE.ConeGeometry(u(12), u(8), 4);
    cap.rotateY(Math.PI / 4);
    K.put(cap, metal, 0, ly + lh / 2 + u(4), 0);
    K.put(ball(u(1.6), 12, 10), K.gloss(K.pal.a), 0, ly + lh / 2 + u(8.6), 0);
  },

  picket(K, s, W, D, L) {
    const { THREE, rbox } = L, white = K.wood(K.pal.p), rail = K.wood(L.tone(K.pal.p, 0.9));
    // three pointed pickets on two rails behind them, the rails running the tile's width
    const tip = new THREE.ConeGeometry(u(4) * Math.SQRT2, u(5), 4);
    tip.rotateY(Math.PI / 4); tip.scale(1, 1, 0.25);
    for (const i of [5, 16, 27]) {
      K.put(rbox(u(8), u(32), u(2), 0.01), white, X(i), u(16), 0.02);
      K.put(tip.clone(), white, X(i), u(34.5), 0.02);
    }
    for (const j of [24.5, 10.5]) K.put(rbox(1, u(3), u(2), 0.01), rail, 0, u(j), -u(2) + 0.02);
  },

  rosearch(K, s, W, D, L) {
    const { THREE, rbox, ball } = L, wood = K.wood(), rose = K.gloss(K.pal.c), cx = 0, ry = u(56), rx = u(27), rv = u(24);
    // two posts each side, two arcs over the path, slats across between them
    const arc = (z) => { const pts = []; for (let i = 0; i <= 24; i++) { const a = Math.PI - i / 24 * Math.PI; pts.push([cx + Math.cos(a) * rx, ry + Math.sin(a) * rv, z]); } return pts; };
    for (const z of [-0.18, 0.18]) {
      for (const sx of [-1, 1]) K.put(rbox(u(4), ry, u(4), 0.012), wood, sx * rx, ry / 2, z);
      K.put(tube(L, arc(z), u(2), 40), wood);
    }
    for (let i = 1; i < 12; i++) {
      const a = Math.PI - i / 12 * Math.PI, x = Math.cos(a) * rx, y = ry + Math.sin(a) * rv;
      K.put(rbox(0.03, 0.03, 0.44, 0.006), wood, x, y, 0);
    }
    for (const sx of [-1, 1]) for (let j = 1; j < 5; j++) K.put(rbox(0.03, 0.03, 0.4, 0.006), wood, sx * rx, u(j * 11), 0);
    // leaves all over the arch and climbing the posts, roses among them
    for (let n = 0; n < 16; n++) {
      const a = Math.PI - (n + 0.5) / 16 * Math.PI, x = Math.cos(a) * rx, y = ry + Math.sin(a) * rv;
      bush(K, L, x, y + 0.02, 0, 0.2, 5);
      if (n % 2) for (const z of [-0.2, 0.2]) K.put(ball(0.05, 12, 10), rose, x, y + 0.05, z);
    }
    for (const [sx, j] of [[-1, 40], [1, 34], [-1, 20], [1, 14]]) {
      bush(K, L, sx * rx, u(j), 0, 0.18, 5);
      for (const z of [-0.2, 0.2]) K.put(ball(0.045, 12, 10), rose, sx * rx + 0.04, u(j) + 0.03, z);
    }
  },

  hedge(K, s, W, D, L) {
    const R = K.r, greens = [K.gloss(K.pal.leaf), K.gloss(L.tone(K.pal.leaf, 1.12)), K.gloss(L.tone(K.pal.leaf, 0.88))];
    // a clipped block of leaves, darker at its foot, its faces tufted with little clumps
    K.put(L.rbox(0.92, u(30) - 0.04, 0.92, 0.12), K.gloss(L.tone(K.pal.leaf, 0.78)), 0, (u(30) - 0.04) / 2, 0);
    const tuft = (x, y, z) => { const t = 0.12 + R() * 0.06; K.put(L.blob(t, t * 0.8, t, 0.6, 0.6), greens[Math.floor(R() * 3)], x, y, z); };
    for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) tuft(-0.38 + i * 0.19 + (R() - 0.5) * 0.04, u(30) - 0.06, -0.38 + j * 0.19 + (R() - 0.5) * 0.04);
    for (let a = 0; a < 4; a++) for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) {
      const t = -0.38 + i * 0.19 + (R() - 0.5) * 0.04, y = 0.14 + j * 0.2, n = 0.45;
      const [x, z] = [[t, n], [n, -t], [-t, -n], [-n, t]][a];
      tuft(x, y, z);
    }
  },

  sundial(K, s, W, D, L) {
    const { THREE, lathe, rbox, cyl } = L, stone = K.gloss(K.pal.p), face = K.gloss(K.pal.a), mark = K.plain(L.tone(K.pal.a, 0.6));
    // a square foot, a fluted column, a wide round top with the dial set in it
    K.put(rbox(u(18), u(6), u(18), 0.02), stone, 0, u(3), 0);
    K.put(lathe([[0.17, 0], [0.15, 0.04], [0.15, u(20) - 0.04], [0.18, u(20)], [0.001, u(20)]], 32), stone, 0, u(6), 0);
    for (let i = 0; i < 12; i++) K.put(rbox(0.02, u(15), 0.02, 0.008).translate(0, 0, 0.15), K.gloss(L.tone(K.pal.p, 0.88)), 0, u(16), 0, i * Math.PI / 6);
    K.put(cyl(u(13), u(3), u(12), 36), stone, 0, u(27.5), 0);
    K.put(cyl(u(10), 0.012, u(10), 36), face, 0, u(29), 0);
    for (let h = 0; h < 12; h++) K.put(rbox(0.012, 0.006, h % 3 ? 0.04 : 0.07, 0.002).translate(0, 0, u(8.5)), mark, 0, u(29) + 0.008, 0, h * Math.PI / 6);
    // the gnomon, a metal triangle standing on the dial
    const tri = new THREE.Shape([new THREE.Vector2(-u(7), 0), new THREE.Vector2(u(3), 0), new THREE.Vector2(u(3), u(7))]);
    const g = new THREE.ExtrudeGeometry(tri, { depth: 0.02, bevelEnabled: false });
    g.translate(0, 0, -0.01); g.rotateY(Math.PI / 2);
    K.put(g, K.metal(K.pal.m), 0, u(29), 0);
  },

  stonelantern(K, s, W, D, L) {
    const { THREE, rbox, cyl, lathe, ball } = L, stone = K.gloss(STONE), moss = K.plain(K.pal.leaf);
    // a stone foot, a round pillar, a platform, the fire box with a glowing window each side, a flared roof, a jewel on top
    K.put(rbox(u(20), u(6), u(20), 0.03), stone, 0, u(3), 0);
    K.put(cyl(u(4), u(20), u(4.6), 20), stone, 0, u(16), 0);
    K.put(rbox(u(22), u(4), u(22), 0.03), stone, 0, u(28), 0);
    const fy = u(38), fw = u(16);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.put(rbox(u(3), u(16), u(3), 0.01), stone, sx * (fw / 2 - u(1.5)), fy, sz * (fw / 2 - u(1.5)));
    K.put(rbox(fw - 0.08, u(14), fw - 0.08, 0.01), K.glow(K.pal.g), 0, fy, 0);
    for (let a = 0; a < 4; a++) K.put(rbox(u(2), u(14), 0.02, 0.004).translate(0, 0, fw / 2 - 0.04), stone, 0, fy, 0, a * Math.PI / 2);
    K.put(rbox(fw + 0.02, u(1.5), fw + 0.02, 0.01), stone, 0, u(46), 0);
    const roof = new THREE.LatheGeometry([[u(14), 0], [u(14.5), u(1)], [u(11), u(3)], [u(5), u(6.5)], [u(2), u(8)], [0.001, u(8)]].map(([r, y]) => new THREE.Vector2(r, y)), 4);
    roof.rotateY(Math.PI / 4);
    K.put(roof, stone, 0, u(46.5), 0);
    K.put(lathe([[u(2), 0], [u(4), u(2.5)], [u(3), u(6)], [u(1), u(7.5)], [0.001, u(8)]], 18), stone, 0, u(54), 0);
    // moss in the joints
    const R = K.r;
    for (let n = 0; n < 7; n++) { const a = R() * Math.PI * 2, y = [u(6), u(26), u(30), u(46.5)][n % 4]; K.put(ball(0.03 + R() * 0.02, 8, 6).scale(1, 0.5, 1), moss, Math.cos(a) * 0.3, y, Math.sin(a) * 0.3); }
  },

  scarecrow(K, s, W, D, L) {
    const { rbox, cyl, lathe, ball, blob, torus } = L, wood = K.wood(), straw = K.cloth(STRAW), shirt = K.cloth(K.pal.c);
    // the post and crossbar, a straw tuft out of each sleeve
    K.put(cyl(u(1.5), u(70), u(1.6), 12), wood, 0, u(35), -0.04);
    K.put(rbox(u(28), u(3), u(3), 0.01), wood, 0, u(52.5), -0.04);
    for (const sx of [-1, 1]) for (let n = 0; n < 5; n++) K.put(cyl(0.008, 0.12, 0.004, 6), straw, sx * (u(13) + 0.03), u(51) - n * 0.01, -0.04 + (n - 2) * 0.02, 0, 0, sx * (0.7 + n * 0.15));
    // the shirt: a body flaring to its hem, sleeves along the bar, a patch, a rope belt, straw out under the hem
    K.put(lathe([[u(11), 0], [u(10), 0.08], [u(8.5), u(22)], [u(5), u(24)], [0.001, u(24)]], 24).scale(1, 1, 0.55), shirt, 0, u(30), 0);
    for (const sx of [-1, 1]) K.put(cyl(0.08, u(9), 0.1, 16).rotateZ(Math.PI / 2), shirt, sx * u(9), u(51), -0.03);
    K.put(rbox(u(5), u(5), 0.02, 0.008), K.cloth(K.pal.a), -u(4.5), u(41.5), u(5.5) * 0.9);
    K.put(torus(u(9.2), 0.018, Math.PI * 2, 24).scale(1, 0.55, 1), K.cloth('#8a5a30'), 0, u(31), 0, 0, Math.PI / 2);
    for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; K.put(cyl(0.01, 0.12, 0.005, 6), straw, Math.cos(a) * u(9.5), u(28), Math.sin(a) * u(9.5) * 0.55, 0, Math.sin(a) * 0.4, -Math.cos(a) * 0.4); }
    // a sack head with stitched eyes and mouth, a straw hat with a band
    const hy = u(62);
    K.put(ball(u(7.5), 22, 16), K.cloth('#e8d8a8'), 0, hy, 0);
    for (const sx of [-1, 1]) K.put(ball(0.02, 8, 6).scale(1, 1, 0.4), K.plain('#202028'), sx * 0.08, hy + 0.02, u(7.2));
    K.put(rbox(0.16, 0.012, 0.01, 0.004), K.plain('#8a5a30'), 0, hy - 0.08, u(6.9));
    K.put(cyl(u(11), 0.03, u(11), 32), straw, 0, u(69.5), 0);
    K.put(lathe([[u(7), 0], [u(6.5), u(7)], [u(5), u(8)], [0.001, u(8)]], 24), straw, 0, u(70), 0);
    K.put(cyl(u(7) + 0.004, u(2), u(6.9) + 0.004, 24), K.cloth(K.pal.c), 0, u(71), 0);
    K.put(blob(0.08, 0.06, 0.05, 0.6, 0.6), K.gloss('#303038'), 0.14, u(73), 0.1);
  },

  swingseat(K, s, W, D, L) {
    const { rbox, cyl, blob, torus } = L, wood = K.wood(), top = K.wood(L.tone(K.pal.w, 1.1)), metal = K.metal(K.pal.m);
    const H = u(72), seatY = s.seat - 0.06, hx = W / 2 - u(4);
    // an A-frame each end, the beam across their tops
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) rod(K, L, wood, [sx * hx, 0, sz * 0.42], [sx * hx, H, sz * 0.02], 0.045);
      K.put(rbox(0.08, 0.06, 0.6, 0.02), wood, sx * hx, H * 0.38, 0);
    }
    K.put(rbox(W - 0.06, u(5), 0.14, 0.02), top, 0, H + 0.02, 0);
    // the bench hung on chains: a slatted seat, a back, plump cushions and a pillow
    const bw = W - u(16), sy = seatY;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const x = sx * (bw / 2 - 0.05), z = sz < 0 ? -0.16 : 0.12;
      for (let y = sy + 0.04; y < H - 0.04; y += 0.06) K.put(torus(0.018, 0.006, Math.PI * 2, 8), metal, x, y, z, Math.round(y * 20) % 2 ? Math.PI / 2 : 0);
    }
    K.put(rbox(bw, 0.06, 0.4, 0.02), wood, 0, sy - 0.03, -0.02);
    K.put(rbox(bw, 0.56, 0.05, 0.02), wood, 0, sy + 0.28, -0.2, 0, -0.12);
    for (const sx of [-1, 1]) K.put(rbox(0.05, 0.22, 0.38, 0.015), wood, sx * bw / 2, sy + 0.1, -0.02);
    K.put(blob(bw - 0.1, 0.12, 0.36, 0.35, 0.45), K.cloth(K.pal.c), 0, sy + 0.05, 0);
    K.put(blob(bw - 0.12, 0.44, 0.12, 0.35, 0.45), K.cloth(K.pal.c), 0, sy + 0.32, -0.15, 0, -0.12);
    K.put(blob(0.3, 0.26, 0.12, 0.4, 0.5), K.cloth(K.pal.a), -0.45, sy + 0.2, -0.04, 0.2, -0.3);
  },

  hammock(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, wood = K.wood(), rope = K.cloth('#e8d8b0'), A = K.cloth(K.pal.c), B = K.cloth(K.pal.a);
    const px = W / 2 - u(3), py = u(56), ends = u(49), low = s.seat - 0.06, half = px - u(5);
    // a post each end with a knob on top
    for (const sx of [-1, 1]) {
      K.put(cyl(u(2), py, u(2.3), 16), wood, sx * px, py / 2, 0);
      K.put(ball(u(2.6), 14, 10), K.wood(L.tone(K.pal.w, 1.1)), sx * px, py + 0.02, 0);
      K.put(rbox(0.3, 0.05, 0.3, 0.02), wood, sx * px, 0.025, 0);
    }
    // the cloth in stripes, sagging between its spreader bars, its edges rolled
    const n = 30, sag = (t) => ends - (ends - low) * Math.sin(t * Math.PI);
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 1) / n, x0 = -half + t0 * half * 2, x1 = -half + t1 * half * 2;
      const y0 = sag(t0), y1 = sag(t1), len = Math.hypot(x1 - x0, y1 - y0) + 0.004;
      K.put(rbox(len, 0.025, 0.5, 0.008), Math.floor(i / 3) % 2 ? A : B, (x0 + x1) / 2, (y0 + y1) / 2, 0, 0, 0, Math.atan2(y1 - y0, x1 - x0));
    }
    for (const sz of [-1, 1]) {
      const pts = [];
      for (let i = 0; i <= 16; i++) { const t = i / 16; pts.push([-half + t * half * 2, sag(t) + 0.02, sz * 0.25]); }
      K.put(tube(L, pts, 0.018, 40), K.cloth(L.tone(K.pal.c, 0.8)));
    }
    // a spreader bar at each end, ropes fanning from it to the post
    for (const sx of [-1, 1]) {
      K.put(cyl(0.02, 0.56, 0.02, 10).rotateX(Math.PI / 2), wood, sx * half, ends + 0.02, 0);
      for (const z of [-0.25, -0.08, 0.08, 0.25]) rod(K, L, rope, [sx * half, ends + 0.02, z], [sx * (px - 0.04), py - 0.06, 0], 0.008);
    }
  },

  planter(K, s, W, D, L) {
    const { rbox, cyl, blob } = L, wood = K.wood(), soil = K.plain('#4a3020');
    // a plank box, its rim a shade lighter, soil in it
    K.put(rbox(u(28), u(14), 0.4, 0.02), wood, 0, u(7) + 0.02, 0);
    for (const y of [u(4.5), u(9.5)]) for (const sz of [-1, 1]) K.put(rbox(u(28) + 0.004, 0.01, 0.004, 0.002), K.wood(L.tone(K.pal.w, 0.8)), 0, y, sz * 0.2);
    K.put(rbox(u(29), u(2), 0.44, 0.01), K.wood(L.tone(K.pal.w, 1.15)), 0, u(16), 0);
    for (const sx of [-1, 1]) K.put(rbox(0.06, 0.04, 0.36, 0.01), K.wood(L.tone(K.pal.w, 0.7)), sx * u(12), 0.02, 0);
    K.put(blob(u(26), 0.06, 0.36, 0.6, 0.6), soil, 0, u(16), 0);
    // a row of flowers in three colours, stems and leaves under each, two rows deep
    const cols = [K.pal.c, K.pal.a, K.pal.p], R = K.r;
    for (let n = 0; n < 9; n++) {
      const x = X(5 + (n % 6) * 4.5), z = n < 6 ? 0.07 : -0.09, h = u(6 + (n % 3) * 3) + 0.04;
      const xx = n < 6 ? x : x + u(2.2);
      K.put(cyl(0.008, h, 0.01, 6), K.plain(L.tone(K.pal.leaf, 0.8)), xx, u(16) + h / 2, z);
      const leaf = L.ball(1, 10, 8).scale(0.03, 0.008, 0.05).translate(0, 0, 0.05).rotateX(-0.6).rotateY(R() * Math.PI * 2);
      K.put(leaf, K.gloss(K.pal.leaf), xx, u(16) + h * 0.35, z);
      flower(K, L, xx, u(16) + h + 0.02, z, cols[n % 3], 0.05, (R() - 0.5) * 0.6, 0.9);
    }
  },

  beehive(K, s, W, D, L) {
    const { lathe, torus, ball, blob, rbox, cyl } = L, a = K.cloth('#e8b848'), b = K.cloth('#d8a038');
    // a wooden stand, the straw skep in coils narrowing to its top, a dark doorway at its foot
    K.put(rbox(u(22), u(6), u(22), 0.02), K.wood(), 0, u(3), 0);
    const prof = [[0.3, 0], [0.35, 0.12], [0.37, 0.36], [0.35, 0.6], [0.3, 0.84], [0.22, 1.04], [0.12, 1.2], [0.001, 1.26]];
    K.put(lathe(prof, 32), a, 0, u(6), 0);
    for (let i = 0; i < 12; i++) {
      const t = (i + 0.5) / 12, y = t * 1.22, r = (() => { for (let k = 1; k < prof.length; k++) if (prof[k][1] >= y) { const f = (y - prof[k - 1][1]) / (prof[k][1] - prof[k - 1][1]); return prof[k - 1][0] + (prof[k][0] - prof[k - 1][0]) * f; } return 0.05; })();
      K.put(torus(r, 0.03, Math.PI * 2, 32), i % 2 ? a : b, 0, u(6) + y, 0, 0, Math.PI / 2);
    }
    K.put(blob(0.16, 0.12, 0.05, 0.6, 0.4), K.plain('#3a2a10'), 0, u(6) + 0.09, 0.335);
    // bees about it: striped bodies, white wings
    for (const [x, y, z, t] of [[0.36, 0.95, 0.26, 0.4], [-0.42, 1.25, 0.12, -0.6], [0.3, 1.55, -0.12, 2.2]]) {
      K.put(ball(1, 12, 8).scale(0.06, 0.045, 0.045), K.gloss('#f8d030'), x, y, z, t);
      for (const dx of [-0.015, 0.02]) K.put(cyl(0.046, 0.014, 0.046, 12).rotateZ(Math.PI / 2), K.gloss('#303038'), x + dx * Math.cos(t), y, z - dx * Math.sin(t), t);
      for (const sz of [-1, 1]) K.put(ball(1, 8, 6).scale(0.03, 0.008, 0.026).translate(0, 0, sz * 0.03), K.gloss('#ffffff'), x, y + 0.045, z, t, sz * 0.5);
    }
  },

  well(K, s, W, D, L) {
    const { rbox, cyl, lathe, torus } = L, wood = K.wood(), R = K.r;
    // a round wall of stones in staggered courses, a rim of capstones, dark water in it
    const r = 0.42;
    for (let j = 0; j < 4; j++) for (let i = 0; i < 12; i++) {
      const a = (i + (j % 2) * 0.5) / 12 * Math.PI * 2, c = R() < 0.4 ? L.tone(STONE, 0.88) : STONE;
      K.put(rbox(0.21, u(6) - 0.012, 0.13, 0.03), K.gloss(c), Math.sin(a) * r, u(3) + j * u(6), Math.cos(a) * r, a);
    }
    K.put(cyl(r - 0.04, u(22), r - 0.04, 28), K.gloss(L.tone(STONE, 0.7)), 0, u(11), 0);
    K.put(torus(r + 0.01, 0.07, Math.PI * 2, 28).scale(1, 1, 0.6), K.gloss(L.tone(STONE, 1.1)), 0, u(24.5), 0, 0, Math.PI / 2);
    K.put(cyl(r - 0.07, 0.01, r - 0.07, 28), K.gloss('#1a2a3a'), 0, u(20), 0);
    // two posts, the roller and its crank, a rope down to a bucket
    for (const sx of [-1, 1]) K.put(rbox(u(3), u(66) - u(22), u(3), 0.01), wood, sx * u(12.5), u(22) + (u(66) - u(22)) / 2, 0);
    K.put(cyl(u(1.6), u(23), u(1.6), 16).rotateZ(Math.PI / 2), K.wood(L.tone(K.pal.w, 1.1)), 0, u(54.5), 0);
    K.put(rbox(0.03, 0.12, 0.03, 0.008), K.metal(K.pal.m), u(15), u(52.5), 0.04);
    K.put(cyl(0.016, 0.1, 0.016, 8).rotateX(Math.PI / 2), K.wood(), u(15), u(50.5), 0.08);
    K.put(cyl(0.006, u(12), 0.006, 6), K.cloth('#c8a878'), u(0.5), u(47), 0);
    K.put(lathe([[0.06, 0], [0.08, u(6)], [0.07, u(6)], [0.055, 0.01], [0.001, 0.01]], 18), K.wood(), u(0.5), u(35), 0);
    K.put(torus(0.075, 0.006, Math.PI * 2, 18), K.metal(K.pal.m), u(0.5), u(39), 0, 0, Math.PI / 2);
    K.put(torus(0.075, 0.006, Math.PI, 14), K.metal(K.pal.m), u(0.5), u(41), 0);
    // the pitched roof in the theme's colour
    gableRoof(K, L, u(64), u(26), 0.5, u(12), 0.08, K.wood(K.pal.c), null);
    K.put(rbox(u(28), 0.05, 0.08, 0.01), wood, 0, u(64), 0);
  },

  hosereel(K, s, W, D, L) {
    const { rbox, cyl, torus, ball } = L, metal = K.metal(K.pal.m), hose = K.gloss(K.pal.c), cy = u(18);
    // a frame each side, the drum between them, wound with the hose; a crank on its hub
    for (const sz of [-1, 1]) {
      for (const sx of [-1, 1]) rod(K, L, metal, [sx * u(10), 0, sz * 0.2], [0, cy + 0.03, sz * 0.2], 0.025);
      K.put(rbox(u(24), 0.04, 0.05, 0.01), metal, 0, 0.02, sz * 0.2);
      K.put(cyl(u(12), 0.02, u(12), 32).rotateX(Math.PI / 2), K.gloss(L.tone(K.pal.c, 0.75)), 0, cy, sz * 0.17);
    }
    K.put(cyl(u(4), 0.32, u(4), 20).rotateX(Math.PI / 2), metal, 0, cy, 0);
    for (let l = 0; l < 3; l++) for (let i = 0; i < 6; i++) K.put(torus(u(5.5) + l * 0.06, 0.03, Math.PI * 2, 28), l % 2 ? K.gloss(L.tone(K.pal.c, 1.12)) : hose, 0, cy, -0.13 + i * 0.052);
    K.put(cyl(0.03, 0.46, 0.03, 12).rotateX(Math.PI / 2), metal, 0, cy, 0.03);
    K.put(rbox(0.03, 0.16, 0.03, 0.008), K.gloss(K.pal.a), 0, cy - 0.08, 0.26);
    K.put(cyl(0.025, 0.1, 0.025, 10).rotateX(Math.PI / 2), K.gloss(K.pal.a), 0, cy - 0.16, 0.3);
    // the free end trailing off down to the floor, its nozzle in the accent
    K.put(tube(L, [[-u(4), cy - u(10), 0.08], [-0.38, 0.06, 0.18], [-0.3, 0.03, 0.36], [-0.12, 0.03, 0.42]], 0.028, 24), hose);
    K.put(cyl(0.035, 0.1, 0.03, 12).rotateZ(Math.PI / 2), K.gloss(K.pal.a), -0.06, 0.035, 0.42);
    K.put(ball(0.03, 10, 8), K.gloss(K.pal.a), 0, 0.035, 0.42);
  },
};
