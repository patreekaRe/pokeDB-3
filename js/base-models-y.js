/* base-models-y.js  -  the backyard's outdoor furniture (docs/roadmap.md's backyard, part b), modelled from parts like
   the arcade cabinets: js/base-models-f.js's head says how a batch works. Their paintings (js/base-furniture-yard.js)
   are only the tray's and the store's pictures, so these follow the real thing, not the painting: a park bench's
   cast-iron ends, a swing set's A-frames and chains, a pond's stones and lily pads. Sizes in tiles; a seat is at about
   half a tile, as indoors. */

import { tube, rod } from './base-models-kit.js';
import { BERRIES } from './data/berries.js';

const TAU = Math.PI * 2;
const STONES = ['#a8a49a', '#8e8a82', '#bab4a8', '#9a9488'];
const WATER = '#4ea6d8', SAND = '#ecd6a2', SOIL = '#5a3c26', STEM = '#4a9a3a', CHAIN = '#b8bcc6', INK = '#2c2c34';
const BULBS = ['#fff2b0', '#ff9a8a', '#9ad8ff', '#ffe070', '#a8f0a0'];

const pics = {};
const once = (key, make) => pics[key] || (pics[key] = make());

/** A cloth checked in `c`, for a picnic table's runner. */
const gingham = (c) => once(`gingham${c}`, () => {
  const s = new OffscreenCanvas(128, 128), g = s.getContext('2d');
  g.fillStyle = '#fbf8f2'; g.fillRect(0, 0, 128, 128);
  g.globalAlpha = 0.55; g.fillStyle = c;
  for (let i = 0; i < 128; i += 32) { g.fillRect(i, 0, 16, 128); g.fillRect(0, i, 128, 16); }
  return s;
});

/** A side profile ([z, y] points) extruded `t` across x, centred on x. */
function slab(L, pts, t, bevel = 0.008) {
  const { THREE } = L, sh = new THREE.Shape(pts.map(([z, y]) => new THREE.Vector2(z, y)));
  const g = new THREE.ExtrudeGeometry(sh, { depth: Math.max(0.001, t - bevel * 2), bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 16 });
  g.translate(0, 0, -t / 2 + bevel);
  return g.rotateY(-Math.PI / 2);
}

/** A board from a to b ([x, y, z] each), w wide and t thick, its width lying across x. */
function board(K, L, m, a, b, w, t) {
  const { THREE } = L, va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b), len = va.distanceTo(vb);
  const g = L.rbox(w, len, t, Math.min(0.012, t / 3));
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize()));
  K.put(g, m, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
}

/** A flower: a stem, two leaves and a bloom of five petals round a yellow eye, its bloom at y. */
function bloom(K, L, x, y, z, c, r = 0.05, tilt = 0) {
  const { cyl, ball } = L;
  K.put(cyl(0.008, y, 0.01, 6), K.plain(STEM), x, y / 2, z);
  for (const s of [-1, 1]) K.put(ball(0.03, 8, 6).scale(1.6, 0.35, 0.8), K.plain(STEM), x + s * 0.03, y * 0.4 + s * 0.02, z, s * 0.6, 0, s * 0.5);
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * TAU;
    K.put(ball(r * 0.62, 8, 6).scale(1, 0.5, 1), K.gloss(c), x + Math.cos(a) * r * 0.75, y + Math.sin(tilt) * Math.sin(a) * r * 0.5, z + Math.sin(a) * r * 0.75);
  }
  K.put(ball(r * 0.42, 8, 6), K.gloss('#f8d038'), x, y + r * 0.15, z);
}

/** A stone, flattened, `r` round, sat on y. */
function stone(K, L, x, y, z, r, i) {
  const g = L.ball(r, 12, 8), tone = STONES[i % STONES.length];
  g.scale(1 + (i % 3) * 0.15, 0.55 + (i % 2) * 0.15, 0.9);
  K.put(g, K.plain(tone), x, y + r * 0.4, z, i * 1.3);
}

export const SHAPES = {
  parkbench: { make: 'parkbench', seat: 0.46 },
  swingset: { make: 'swingset' },
  picnicbench: { make: 'picnicbench', seat: 0.44 },
  lamppost: { make: 'lamppost' },
  stringlights: { make: 'stringlights' },
  dometent: { make: 'dometent' },
  paddlingpool: { make: 'paddlingpool' },
  rockpond: { make: 'rockpond' },
  flowerbed: { make: 'flowerbed' },
  picketfence: { make: 'picketfence' },
  boxhedge: { make: 'boxhedge' },
  gardenmailbox: { make: 'gardenmailbox' },
  barbecue: { make: 'barbecue' },
  sunlounger: { make: 'sunlounger', seat: 0.36 },
  parasol: { make: 'parasol' },
  sandpit: { make: 'sandpit' },
  berryplot: { make: 'berryplot' },
  ...Object.fromEntries(BERRIES.map(b => [`${b.id}basket`, { make: 'berrybasket', fruit: b.fruit, round: b.round }])),
};

export const MAKES = {
  /** A park bench: two cast-iron ends with scrolled arms, wooden slats for the seat and the sloping back. */
  parkbench(K, s, W, D, L) {
    const { rbox } = L, iron = K.metal(L.tone(K.pal.m, 0.7)), slat = K.wood();
    for (const x of [-W / 2 + 0.1, 0, W / 2 - 0.1]) {
      const end = x !== 0, r = end ? 0.024 : 0.018;
      // the back leg runs up into the back's support, the front leg up into the arm, which scrolls over at its tip
      K.put(tube(L, [[x, 0, -0.26], [x, 0.2, -0.22], [x, 0.44, -0.2], [x, 0.7, -0.27], [x, 0.92, -0.34]], r), iron);
      K.put(tube(L, [[x, 0, 0.3], [x, 0.22, 0.26], [x, 0.44, 0.22]], r), iron);
      K.put(rbox(r * 2, r * 2, 0.5, 0.008), iron, x, 0.42, 0.01);
      if (!end) continue;
      K.put(tube(L, [[x, 0.44, 0.22], [x, 0.58, 0.26], [x, 0.64, 0.18], [x, 0.64, 0.02], [x, 0.66, -0.16], [x, 0.7, -0.24]], r), iron);
      K.put(L.torus(0.035, r * 0.9, Math.PI * 1.6, 16), iron, x, 0.6, 0.28, Math.PI / 2);
      for (const z of [-0.26, 0.3]) K.put(L.cyl(0.04, 0.02, 0.045, 12), iron, x, 0.01, z);
    }
    // the seat's four slats, then the back's three, tipped back
    for (let i = 0; i < 4; i++) K.put(rbox(W - 0.08, 0.035, 0.1, 0.012), slat, 0, 0.46, 0.22 - i * 0.13);
    for (let i = 0; i < 3; i++) K.put(rbox(W - 0.08, 0.1, 0.03, 0.012), slat, 0, 0.6 + i * 0.13, -0.24 - i * 0.04, 0, -0.3);
  },

  /** A swing set: an A-frame each end, a bar across the top, two swings on their chains. */
  swingset(K, s, W, D, L) {
    const frame = K.gloss(K.pal.c), top = 1.72, end = W / 2 - 0.04, chain = K.metal(CHAIN);
    for (const x of [-end, end]) {
      for (const z of [-0.42, 0.42]) rod(K, L, frame, [x, 0, z], [x, top, 0], 0.035);
      K.put(L.ball(0.05, 12, 10), frame, x, top, 0);
      rod(K, L, frame, [x, 0.5, -0.31], [x, 0.5, 0.31], 0.022);
      for (const z of [-0.42, 0.42]) K.put(L.cyl(0.05, 0.03, 0.055, 12), K.gloss(INK), x, 0.015, z);
    }
    rod(K, L, frame, [-end, top, 0], [end, top, 0], 0.04);
    // each swing a part of its own, hung from the bar, so it swings with a Pokémon on it (js/base-3d.js)
    [-0.42, 0.42].forEach((sx, i) => {
      const put = K.part ? K.part(`swing${i}`, [sx, top, 0]) : K.put, S = { ...K, put };
      for (const dx of [-0.14, 0.14]) {
        rod(S, L, chain, [sx + dx, top - 0.02, 0], [sx + dx, 0.46, 0], 0.008);
        put(L.torus(0.02, 0.008, TAU, 10), chain, sx + dx, top - 0.03, 0, Math.PI / 2);
      }
      put(L.rbox(0.36, 0.035, 0.15, 0.015), K.gloss(K.pal.a), sx, 0.44, 0);
    });
  },

  /** A picnic table with its benches: planks on crossed legs, a checked runner down the middle. */
  picnicbench(K, s, W, D, L) {
    const { rbox, THREE } = L, wood = K.wood(), dark = K.wood(L.tone(K.pal.w, 0.82)), t = 0.74;
    for (let i = 0; i < 5; i++) K.put(rbox(W - 0.1, 0.05, 0.15, 0.015), wood, 0, t, -0.34 + i * 0.17);
    for (const x of [-0.72, 0.72]) {
      // the table's legs cross under its top and run out to the benches; a beam holds both benches
      for (const s2 of [-1, 1]) board(K, L, dark, [x, 0, s2 * 0.62], [x, t - 0.03, -s2 * 0.14], 0.08, 0.05);
      K.put(rbox(0.07, 0.06, D - 0.12, 0.015), dark, x, 0.36, 0);
      K.put(rbox(0.06, 0.05, 0.5, 0.015), dark, x, t - 0.05, 0);
    }
    for (const z of [-0.72, 0.72]) for (const dz of [-0.07, 0.07]) K.put(rbox(W - 0.14, 0.045, 0.13, 0.014), wood, 0, 0.42, z + dz);
    const runner = new THREE.PlaneGeometry(W - 0.4, 0.36).rotateX(-Math.PI / 2);
    K.put(runner, K.pic(gingham(K.pal.c)), 0, t + 0.028, 0);
  },

  /** A Victorian lamp post: a stepped base, a fluted post, a crossbar for the ladder and a lantern of four lit panes. */
  lamppost(K, s, W, D, L) {
    const { cyl, lathe, rbox, ball } = L, iron = K.metal(L.tone(K.pal.m, 0.75)), glow = K.glow(K.pal.g);
    K.put(lathe([[0.17, 0], [0.17, 0.05], [0.13, 0.08], [0.13, 0.14], [0.07, 0.24], [0.05, 0.3], [0, 0.3]], 20), iron, 0, 0, 0);
    K.put(cyl(0.04, 1.62, 0.05, 16), iron, 0, 1.1, 0);
    for (const y of [0.42, 1.2, 1.88]) K.put(cyl(0.065, 0.04, 0.065, 16), iron, 0, y, 0);
    K.put(rbox(0.46, 0.035, 0.035, 0.01), iron, 0, 1.72, 0);
    for (const x of [-0.22, 0.22]) K.put(ball(0.03, 10, 8), iron, x, 1.72, 0);
    // the lantern: its panes lit, iron at its corners, a pyramid roof
    const y = 1.94, h = 0.34;
    K.put(lathe([[0.06, 0], [0.14, 0.04], [0.14, 0.06], [0, 0.06]], 4).rotateY(Math.PI / 4), iron, 0, y, 0);
    K.put(rbox(0.22, h, 0.22, 0.01), glow, 0, y + 0.06 + h / 2, 0);
    for (let i = 0; i < 4; i++) {
      const a = i / 4 * TAU + Math.PI / 4;
      K.put(rbox(0.025, h + 0.02, 0.025, 0.006), iron, Math.cos(a) * 0.16, y + 0.06 + h / 2, Math.sin(a) * 0.16);
    }
    K.put(cyl(0.001, 0.16, 0.2, 4).rotateY(Math.PI / 4), iron, 0, y + h + 0.14, 0);
    K.put(ball(0.035, 10, 8), iron, 0, y + h + 0.24, 0);
  },

  /** Two posts with a string of bulbs sagging between them. */
  stringlights(K, s, W, D, L) {
    const { rbox, ball } = L, post = K.wood(), end = W / 2 - 0.08, top = 1.6;
    for (const x of [-end, end]) {
      K.put(rbox(0.08, top, 0.08, 0.015), post, x, top / 2, 0);
      K.put(rbox(0.12, 0.03, 0.12, 0.01), post, x, top + 0.015, 0);
      K.put(rbox(0.16, 0.06, 0.16, 0.015), K.wood(L.tone(K.pal.w, 0.8)), x, 0.03, 0);
    }
    const sag = (f) => top - 0.06 - Math.sin(f * Math.PI) * 0.32, pts = [];
    for (let i = 0; i <= 12; i++) pts.push([-end + i / 12 * end * 2, sag(i / 12), 0.04]);
    K.put(tube(L, pts, 0.007), K.plain(INK));
    for (let i = 1; i < 10; i++) {
      const f = i / 10, x = -end + f * end * 2, y = sag(f);
      K.put(L.cyl(0.012, 0.03, 0.012, 8), K.plain(INK), x, y - 0.02, 0.04);
      K.put(ball(0.034, 12, 10).scale(1, 1.25, 1), K.glow(i % 2 ? K.pal.g : BULBS[(i >> 1) % BULBS.length]), x, y - 0.07, 0.04);
    }
  },

  /** A dome tent: a groundsheet, the dome in the theme's colour, its two poles crossing over it, the door rolled up. */
  dometent(K, s, W, D, L) {
    const { THREE, rbox, cyl } = L, cloth = K.cloth(K.pal.c), R = 0.82, H = 1.0;
    K.put(rbox(W - 0.1, 0.02, D - 0.1, 0.008), K.cloth(L.tone(K.pal.m, 1.2)), 0, 0.01, 0);
    const dome = new THREE.SphereGeometry(1, 40, 18, 0, TAU, 0, Math.PI / 2).scale(R, H, R);
    K.put(dome, cloth, 0, 0.02, 0);
    // the doorway: a dark patch of the dome facing front, its flap rolled up over it, ties hanging
    const door = new THREE.SphereGeometry(1.006, 18, 10, Math.PI / 2 - 0.42, 0.84, 0.72, Math.PI / 2 - 0.72).scale(R, H, R);
    K.put(door, K.cloth(L.tone(K.pal.c, 0.32)), 0, 0.02, 0);
    const rollY = 0.02 + H * Math.cos(0.72), rollZ = R * Math.sin(0.72);
    K.put(cyl(0.05, 0.5, 0.05, 14).rotateZ(Math.PI / 2), K.cloth(K.pal.a), 0, rollY + 0.02, rollZ + 0.03);
    for (const x of [-0.18, 0.18]) K.put(cyl(0.006, 0.14, 0.006, 6), K.plain(INK), x, rollY - 0.05, rollZ + 0.07);
    // the poles, over the dome from corner to corner, and the guy lines to their pegs
    for (const a of [Math.PI / 4, -Math.PI / 4]) {
      const pts = [];
      for (let i = 0; i <= 16; i++) { const t = -Math.PI / 2 + i / 16 * Math.PI; pts.push([Math.sin(t) * (R + 0.012) * Math.cos(a), 0.02 + Math.cos(t) * (H + 0.012), Math.sin(t) * (R + 0.012) * Math.sin(a)]); }
      K.put(tube(L, pts, 0.012, 48), K.gloss(INK));
    }
    for (const a of [Math.PI / 4, 3 * Math.PI / 4, -Math.PI / 4, -3 * Math.PI / 4]) {
      const cx = Math.cos(a), cz = Math.sin(a);
      rod(K, L, K.plain('#e8e0c8'), [cx * R * 0.72, 0.62, cz * R * 0.72], [cx * 0.96, 0.02, cz * 0.96], 0.004);
      K.put(cyl(0.008, 0.06, 0.004, 6), K.metal(CHAIN), cx * 0.96, 0.02, cz * 0.96);
    }
  },

  /** A paddling pool: three blown-up rings, striped, water in it, a beach ball and a rubber duck afloat. */
  paddlingpool(K, s, W, D, L) {
    const { THREE, torus, cyl, ball } = L, R = Math.min(W, D) / 2 - 0.16, rings = [K.pal.c, '#f6f6f2', K.pal.a];
    K.put(cyl(R + 0.06, 0.02, R + 0.06, 40), K.gloss(L.tone(K.pal.c, 0.85)), 0, 0.01, 0);
    rings.forEach((c, i) => K.put(torus(R, 0.1, TAU, 48).rotateX(Math.PI / 2), K.gloss(c), 0, 0.1 + i * 0.17, 0));
    K.put(cyl(R - 0.02, 0.02, R - 0.02, 40), K.gloss(WATER), 0, 0.4, 0);
    // the ball: six segments, alternately coloured, white caps
    const bx = -0.22, bz = 0.14, br = 0.12, segs = ['#e84848', '#f8f8f4', '#3a8ae0', '#f8f8f4', '#f8d030', '#f8f8f4'];
    segs.forEach((c, i) => K.put(new THREE.SphereGeometry(br, 8, 12, i / 6 * TAU, TAU / 6), K.gloss(c), bx, 0.46, bz));
    // the duck: a body, a head, an orange beak
    K.put(ball(0.07, 14, 10).scale(1.3, 0.8, 1), K.gloss('#f8d030'), 0.28, 0.43, -0.1);
    K.put(ball(0.045, 12, 10), K.gloss('#f8d030'), 0.34, 0.51, -0.1);
    K.put(cyl(0.001, 0.04, 0.02, 8).rotateZ(-Math.PI / 2), K.gloss('#f08030'), 0.4, 0.505, -0.1);
  },

  /** A pond: water in a ragged ring of stones, lily pads, one flowering, reeds and bulrushes at the back. */
  rockpond(K, s, W, D, L) {
    const { THREE, cyl, ball } = L, n = 18, edge = [];
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU, r = 0.66 + Math.sin(a * 3 + 1) * 0.08 + Math.cos(a * 2) * 0.05;
      edge.push([Math.cos(a) * r * W / 2, Math.sin(a) * r * D / 2]);
    }
    const shape = new THREE.Shape(edge.map(([x, z]) => new THREE.Vector2(x, z)));
    K.put(new THREE.ShapeGeometry(shape, 12).rotateX(-Math.PI / 2), K.gloss(WATER), 0, 0.05, 0);
    K.put(new THREE.ShapeGeometry(shape, 12).scale(1.08, 1.08, 1).rotateX(-Math.PI / 2), K.plain(L.tone(SOIL, 0.9)), 0, 0.02, 0);
    edge.forEach(([x, z], i) => {
      const out = 1.08 + (i % 2) * 0.05;
      stone(K, L, x * out, 0, z * out, 0.1 + (i % 3) * 0.025, i);
    });
    // the lily pads, a notch cut from each, and a flower on one
    const pads = [[-0.18, 0.12, 0.14], [0.22, -0.05, 0.11], [0.05, 0.3, 0.09], [-0.32, -0.18, 0.08]];
    pads.forEach(([x, z, r], i) => K.put(new THREE.CircleGeometry(r, 20, 0.3, TAU - 0.6).rotateX(-Math.PI / 2), K.gloss(i % 2 ? '#5aa848' : '#4a9a3e'), x, 0.058, z, i * 1.7));
    for (let i = 0; i < 7; i++) {
      const a = i / 7 * TAU;
      K.put(ball(0.04, 10, 8).scale(0.6, 0.5, 1.4), K.gloss(i % 2 ? K.pal.p : L.mix(K.pal.c, '#ffffff', 0.4)), -0.18 + Math.cos(a) * 0.035, 0.085, 0.12 + Math.sin(a) * 0.035, -a);
    }
    K.put(ball(0.022, 10, 8), K.gloss('#f8d038'), -0.18, 0.1, 0.12);
    for (let i = 0; i < 9; i++) {
      const x = -0.5 + i * 0.12 + (i % 2) * 0.03, z = -D / 2 * 0.62 + (i % 3) * 0.04, h = 0.42 + (i % 4) * 0.1;
      K.put(cyl(0.008, h, 0.012, 6), K.plain(i % 2 ? '#5a9a3a' : '#4a8a32'), x, 0.04 + h / 2, z, 0, 0, (i % 3 - 1) * 0.08);
      if (i % 3 === 0) K.put(cyl(0.022, 0.1, 0.022, 10), K.plain('#7a4a28'), x + (i % 3 - 1) * 0.08 * -h, 0.04 + h - 0.04, z);
    }
  },

  /** A raised bed: a plank box of soil, rows of flowers in the theme's colours, leaves at their feet. */
  flowerbed(K, s, W, D, L) {
    const { rbox, ball } = L, wood = K.wood(), h = 0.3, t = 0.06, w = W - 0.08, d = D - 0.2;
    for (const z of [-d / 2 + t / 2, d / 2 - t / 2]) K.put(rbox(w, h, t, 0.012), wood, 0, h / 2, z);
    for (const x of [-w / 2 + t / 2, w / 2 - t / 2]) K.put(rbox(t, h, d - t * 2, 0.012), wood, x, h / 2, 0);
    for (const x of [-w / 2, w / 2]) for (const z of [-d / 2, d / 2]) K.put(rbox(0.08, h + 0.04, 0.08, 0.012), K.wood(L.tone(K.pal.w, 0.8)), x * 0.98, (h + 0.04) / 2, z * 0.98);
    K.put(rbox(w - t * 2, 0.04, d - t * 2, 0.01), K.plain(SOIL), 0, h - 0.04, 0);
    const colours = [K.pal.c, K.pal.a, L.mix(K.pal.c, '#ffffff', 0.45), K.pal.p];
    for (let row = 0; row < 3; row++) for (let i = 0; i < 6; i++) {
      const x = -w / 2 + 0.16 + i * (w - 0.32) / 5 + (row % 2) * 0.06, z = -d / 2 + 0.14 + row * (d - 0.28) / 2;
      K.put(ball(0.07, 10, 8).scale(1.2, 0.55, 1.2), K.plain(L.tone(K.pal.leaf, 0.9 + (i % 2) * 0.15)), x, h - 0.01, z);
      bloom(K, L, x, h + 0.14 + ((i + row) % 3) * 0.05, z, colours[(i + row) % colours.length], 0.05, 0.4);
    }
  },

  /** A length of picket fence a tile long across the tile's middle: pointed pickets on two rails. */
  picketfence(K, s, W, D, L) {
    const { rbox } = L, white = K.wood(K.pal.p);
    for (const y of [0.2, 0.48]) K.put(rbox(W, 0.06, 0.035, 0.01), white, 0, y, -0.03);
    for (let i = 0; i < 4; i++) K.put(slab(L, [[-0.05, 0], [0.05, 0], [0.05, 0.62], [0, 0.72], [-0.05, 0.62]], 0.035).rotateY(Math.PI / 2), white, -W / 2 + 0.125 + i * 0.25, 0, 0.01);
    K.put(rbox(0.1, 0.8, 0.1, 0.015), K.wood(L.tone(K.pal.p, 0.92)), -W / 2 + 0.02, 0.4, -0.03);
    K.put(L.lathe([[0.065, 0], [0.065, 0.02], [0.03, 0.05], [0, 0.07]], 4).rotateY(Math.PI / 4), K.wood(L.tone(K.pal.p, 0.92)), -W / 2 + 0.02, 0.8, -0.03);
  },

  /** A clipped box hedge a tile long, leafy all over. */
  boxhedge(K, s, W, D, L) {
    const { blob, ball } = L, leaf = K.pal.leaf, dark = L.tone(leaf, 0.75), lite = L.tone(leaf, 1.12);
    K.put(blob(W - 0.02, 0.78, 0.62, 0.2, 0.25), K.plain(dark), 0, 0.39, 0);
    for (let i = 0; i < 46; i++) {
      const face = i % 4, f = K.r(), g = K.r(), r = 0.06 + K.r() * 0.04;
      const x = face < 2 ? (f - 0.5) * (W - 0.16) : (face === 2 ? -1 : 1) * (W / 2 - 0.07);
      const z = face === 0 ? 0.3 : face === 1 ? -0.3 : (f - 0.5) * 0.5;
      K.put(ball(r, 8, 6), K.plain(i % 3 ? leaf : lite), x, 0.08 + g * 0.66, z);
    }
    for (let i = 0; i < 12; i++) K.put(ball(0.07, 8, 6), K.plain(i % 2 ? leaf : lite), (K.r() - 0.5) * (W - 0.12), 0.76, (K.r() - 0.5) * 0.48);
  },

  /** A mailbox on a wooden post: a round-topped box in the theme's colour, its red flag up. */
  gardenmailbox(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, post = K.wood(), box = K.gloss(K.pal.c), y = 0.92;
    K.put(rbox(0.08, y, 0.08, 0.012), post, 0, y / 2, -0.06);
    K.put(rbox(0.06, 0.06, 0.26, 0.01), post, 0, y - 0.03, -0.02);
    board(K, L, post, [0, y - 0.3, -0.06], [0, y - 0.05, 0.08], 0.04, 0.04);
    K.put(rbox(0.22, 0.12, 0.42, 0.02), box, 0, y + 0.06, 0.04);
    K.put(cyl(0.11, 0.42, 0.11, 24, false).rotateX(Math.PI / 2), box, 0, y + 0.12, 0.04);
    K.put(cyl(0.112, 0.012, 0.112, 24).rotateX(Math.PI / 2), K.gloss(L.tone(K.pal.c, 0.8)), 0, y + 0.12, 0.255);
    K.put(rbox(0.224, 0.12, 0.012, 0.004), K.gloss(L.tone(K.pal.c, 0.8)), 0, y + 0.06, 0.255);
    K.put(ball(0.016, 8, 6), K.metal('#d8dce4'), 0, y + 0.18, 0.265);
    K.put(rbox(0.012, 0.2, 0.025, 0.004), K.gloss('#e04040'), 0.118, y + 0.2, -0.02);
    K.put(rbox(0.008, 0.07, 0.1, 0.004), K.gloss('#e04040'), 0.118, y + 0.27, 0.03);
  },

  /** A kettle barbecue: a round bowl on three legs and two wheels, its lid lifted, coals glowing under the grill. */
  barbecue(K, s, W, D, L) {
    const { lathe, torus, cyl, ball, rbox } = L, bowl = K.gloss(K.pal.c), steel = K.metal('#c8ccd4'), y = 0.6, R = 0.27;
    const cup = []; for (let i = 0; i <= 10; i++) { const a = i / 10 * Math.PI / 2; cup.push([Math.sin(a) * R, -Math.cos(a) * R * 0.85]); }
    K.put(lathe(cup, 32), bowl, 0, y, 0);
    K.put(torus(R, 0.012, TAU, 32).rotateX(Math.PI / 2), steel, 0, y, 0);
    for (let i = 0; i < 7; i++) K.put(cyl(0.006, R * 1.9 * Math.sqrt(1 - ((i - 3) / 3.6) ** 2), 0.006, 6).rotateZ(Math.PI / 2), steel, 0, y - 0.03, (i - 3) * 0.07);
    for (let i = 0; i < 9; i++) K.put(ball(0.04, 8, 6), K.glow(i % 2 ? '#ff7030' : '#ffb040'), (K.r() - 0.5) * 0.3, y - 0.09, (K.r() - 0.5) * 0.3);
    // the lid, tipped up on its hinge at the back, a handle on top
    const lid = []; for (let i = 0; i <= 10; i++) { const a = i / 10 * Math.PI / 2; lid.push([Math.cos(a) * R, Math.sin(a) * R * 0.8]); }
    K.put(lathe(lid, 32).translate(0, 0, R).rotateX(-1.15).translate(0, 0, -R), bowl, 0, y + 0.01, 0);
    K.put(rbox(0.12, 0.03, 0.03, 0.01).translate(0, R * 0.8 + 0.03, R).rotateX(-1.15).translate(0, 0, -R), K.gloss(INK), 0, y + 0.01, 0);
    for (let i = 0; i < 3; i++) {
      const a = i / 3 * TAU + Math.PI / 2, x = Math.cos(a) * 0.28, z = Math.sin(a) * 0.28;
      rod(K, L, steel, [Math.cos(a) * 0.14, y - 0.16, Math.sin(a) * 0.14], [x, 0.04, z], 0.014);
      if (i) K.put(cyl(0.05, 0.03, 0.05, 16).rotateZ(Math.PI / 2), K.gloss(INK), x, 0.05, z);
    }
    K.put(cyl(0.14, 0.012, 0.14, 24), steel, 0, 0.22, 0);
  },

  /** A sun lounger: a slatted wooden frame on four legs, its back propped up, a long cushion in the theme's colour. */
  sunlounger(K, s, W, D, L) {
    const { rbox, blob, cyl } = L, wood = K.wood(), y = 0.3, len = D - 0.2, back = 0.62, flat = len - back;
    for (const x of [-0.3, 0.3]) K.put(rbox(0.05, 0.07, len, 0.012), wood, x, y, 0);
    for (const [x, z] of [[-0.3, len / 2 - 0.08], [0.3, len / 2 - 0.08]]) K.put(rbox(0.05, y, 0.05, 0.01), wood, x, y / 2, z);
    for (const x of [-0.3, 0.3]) K.put(cyl(0.05, 0.03, 0.05, 14).rotateZ(Math.PI / 2), K.gloss(INK), x + Math.sign(x) * 0.02, 0.05, -len / 2 + 0.06);
    for (const x of [-0.3, 0.3]) K.put(rbox(0.04, 0.24, 0.04, 0.01), wood, x, 0.17, -len / 2 + 0.06);
    const z0 = len / 2 - flat / 2;
    for (let i = 0; i < 8; i++) K.put(rbox(0.6, 0.02, 0.09, 0.008), wood, 0, y + 0.03, len / 2 - 0.08 - i * (flat - 0.1) / 7);
    const tilt = 0.85, zj = -len / 2 + back, bz = zj - back / 2 * Math.cos(tilt), by = y + 0.03 + back / 2 * Math.sin(tilt);
    K.put(rbox(0.62, 0.03, back, 0.01), wood, 0, by, bz, 0, tilt);
    K.put(blob(0.56, 0.08, flat - 0.06, 0.25, 0.35), K.cloth(K.pal.c), 0, y + 0.08, z0);
    K.put(blob(0.56, 0.08, back - 0.04, 0.25, 0.35).rotateX(tilt), K.cloth(K.pal.c), 0, by + 0.05 * Math.cos(tilt), bz + 0.05 * Math.sin(tilt));
    K.put(blob(0.4, 0.09, 0.16, 0.4, 0.5).rotateX(tilt), K.cloth(K.pal.p), 0, by + back * 0.32 * Math.sin(tilt) + 0.08, bz - back * 0.32 * Math.cos(tilt) + 0.04);
  },

  /** A garden parasol: a heavy round base, a pole, a canopy of eight panels in two colours, a finial. */
  parasol(K, s, W, D, L) {
    const { THREE, lathe, cyl, ball } = L, pole = K.wood(), R = 0.86, h = 0.3, y = 1.62;
    K.put(lathe([[0.2, 0], [0.2, 0.05], [0.16, 0.08], [0.06, 0.1], [0, 0.1]], 24), K.gloss(L.tone(K.pal.m, 1.1)), 0, 0, 0);
    K.put(cyl(0.022, y + 0.12, 0.022, 12), pole, 0, (y + 0.12) / 2, 0);
    for (let i = 0; i < 8; i++) {
      const panel = new THREE.CylinderGeometry(0.03, R, h, 1, 1, true, i / 8 * TAU, TAU / 8);
      K.put(panel, K.cloth(i % 2 ? K.pal.p : K.pal.c), 0, y + h / 2, 0);
      const flap = new THREE.CylinderGeometry(R, R, 0.07, 3, 1, true, i / 8 * TAU, TAU / 8);
      K.put(flap, K.cloth(i % 2 ? K.pal.c : K.pal.p), 0, y - 0.035, 0);
      const a = i / 8 * TAU;
      rod(K, L, pole, [0, y - 0.32, 0], [Math.sin(a) * R * 0.55, y + h * 0.4, Math.cos(a) * R * 0.55], 0.008);
    }
    K.put(ball(0.04, 12, 10), pole, 0, y + h + 0.06, 0);
  },

  /** A sandpit: a wooden frame with corner seats, heaped sand, a bucket, a spade and a little sandcastle. */
  sandpit(K, s, W, D, L) {
    const { rbox, blob, cyl, lathe, THREE } = L, wood = K.wood(), h = 0.2, t = 0.08, w = W - 0.12, d = D - 0.12;
    for (const z of [-d / 2 + t / 2, d / 2 - t / 2]) K.put(rbox(w, h, t, 0.015), wood, 0, h / 2, z);
    for (const x of [-w / 2 + t / 2, w / 2 - t / 2]) K.put(rbox(t, h, d - t * 2, 0.015), wood, x, h / 2, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const tri = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(0.3, 0), new THREE.Vector2(0, 0.3)]);
      K.put(new THREE.ExtrudeGeometry(tri, { depth: 0.03, bevelEnabled: false }).rotateX(Math.PI / 2).rotateY(sx > 0 ? (sz > 0 ? Math.PI : -Math.PI / 2) : (sz > 0 ? Math.PI / 2 : 0)), wood, sx * (w / 2 - 0.02), h + 0.015, sz * (d / 2 - 0.02));
    }
    K.put(rbox(w - t * 2, 0.12, d - t * 2, 0.02), K.plain(SAND), 0, 0.1, 0);
    K.put(blob(0.7, 0.16, 0.5, 0.5, 0.8), K.plain(L.tone(SAND, 0.94)), -0.3, 0.16, -0.25);
    // the castle: a keep and four turrets with pointed tops
    const cx = 0.3, cz = -0.2;
    K.put(rbox(0.22, 0.14, 0.22, 0.02), K.plain(L.tone(SAND, 0.9)), cx, 0.23, cz);
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      K.put(cyl(0.045, 0.2, 0.05, 12), K.plain(L.tone(SAND, 0.88)), cx + dx * 0.12, 0.26, cz + dz * 0.12);
      K.put(cyl(0.001, 0.08, 0.05, 12), K.plain(L.tone(SAND, 0.82)), cx + dx * 0.12, 0.4, cz + dz * 0.12);
    }
    K.put(lathe([[0.06, 0], [0.085, 0.14], [0.08, 0.14], [0, 0.005]], 20), K.gloss(K.pal.c), -0.38, 0.16, 0.3);
    K.put(L.torus(0.07, 0.005, Math.PI, 12), K.gloss(K.pal.c), -0.38, 0.3, 0.3);
    K.put(cyl(0.012, 0.3, 0.012, 8), K.gloss(K.pal.a), 0.05, 0.2, 0.32, 0, 0, 1.2);
    K.put(rbox(0.1, 0.012, 0.12, 0.006), K.gloss(K.pal.a), 0.2, 0.17, 0.32, 0.2);
  },

  /** A berry plot: a plank frame round a tilled bed, three furrows ridged across it. What grows in it is the base's
      (js/berry-garden.js), on top at PLOT_TOP. */
  berryplot(K, s, W, D, L) {
    const { rbox, blob } = L, wood = K.wood(), h = 0.14, t = 0.07, w = W - 0.06, d = D - 0.06;
    for (const z of [-d / 2 + t / 2, d / 2 - t / 2]) K.put(rbox(w, h, t, 0.012), wood, 0, h / 2, z);
    for (const x of [-w / 2 + t / 2, w / 2 - t / 2]) K.put(rbox(t, h, d - t * 2, 0.012), wood, x, h / 2, 0);
    K.put(rbox(w - t * 2, 0.08, d - t * 2, 0.01), K.plain(SOIL), 0, 0.06, 0);
    for (let i = 0; i < 3; i++) K.put(blob(w - t * 2 - 0.04, 0.05, 0.14, 0.4, 0.6), K.plain(L.tone(SOIL, 1.12)), 0, 0.105, -0.26 + i * 0.26);
  },

  /** A wicker basket heaped with one berry, a leaf or two tucked in, a handle arching over. */
  berrybasket(K, s, W, D, L) {
    const { lathe, ball, torus, cyl } = L, weave = K.cloth('#c8924a'), rim = K.wood('#b07a38'), fruit = K.gloss(s.fruit);
    K.put(lathe([[0, 0], [0.16, 0], [0.2, 0.04], [0.26, 0.2], [0.27, 0.22], [0.25, 0.22], [0.2, 0.05], [0, 0.04]], 24), weave, 0, 0, 0);
    K.put(torus(0.26, 0.018, Math.PI * 2, 24), rim, 0, 0.215, 0, 0, Math.PI / 2);
    K.put(torus(0.24, 0.014, Math.PI, 20), rim, 0, 0.215, 0, Math.PI / 2);
    const r = 0.055 * s.round;
    for (let i = 0; i < 14; i++) {
      const ring = i < 9 ? 0 : 1, a = (i / (ring ? 5 : 9)) * TAU + ring * 0.4, at = ring ? 0.09 : 0.17;
      K.put(ball(r, 12, 10), fruit, Math.cos(a) * at, 0.22 + ring * 0.06 + K.r() * 0.01, Math.sin(a) * at);
    }
    K.put(ball(r, 12, 10), fruit, 0, 0.32, 0);
    K.put(cyl(0.006, 0.04, 0.006, 6), K.plain(STEM), 0, 0.37, 0);
    for (const sx of [-1, 1]) K.put(ball(0.05, 8, 6).scale(1.5, 0.25, 0.7), K.plain('#58a840'), sx * 0.16, 0.27, 0.1, sx * 0.8, 0, sx * 0.4);
  },
};
