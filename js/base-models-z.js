/* base-models-z.js  -  the backyard's Water and Camping pieces (js/base-furniture-yard4.js), modelled from parts like
   the arcade cabinets (the user's ask, 2026-10-16: "3D detailed CLEAN models ... optimise them"): js/base-models-f.js's
   head says how a batch works. Each builder follows its painting part by part: `u(n)` is n of its 32 pixels a tile,
   `X(n, W)` a pixel across the painting as x from the middle. Water is a glossy colour (a falling sheet see-through
   glass), so the room bakes most of a piece into one draw; the canoe's hull, the hammock's cloth and the bell tent's
   door are bent grids (`grid()`). */

import { tube, rod } from './base-models-kit.js';
import { CANOE, BELL, ARCH } from './base-furniture-yard4.js';

const TAU = Math.PI * 2;
const u = (n) => n / 32;
const X = (n, W = 1) => n / 32 - W / 2;
const WATER = '#4ea6d8', SPRAY = '#a8dcf4', FOAM = '#eef8fc', INK = '#2c2c34', STONE = '#a8a49a', STONE2 = '#8e8a82',
  FLAME = '#ff8030', EMBER = '#ffc040', BRASS = '#d8b048', REED = '#5a9a3a', CATTAIL = '#7a4a28', ROPE = '#e8e0c8';
const WAILMER = '#3c7cc8', BELLY = '#e8e0b8', LOTAD = '#4a8ad0', PAD = '#58b848', DUCK = '#f8d030', BEAK = '#f0d8a0';
const STONES = [STONE, STONE2, '#bab4a8', '#9a9488'];

const pics = {};
const once = (key, make) => pics[key] || (pics[key] = make());

/** A bent sheet: f(u, v) gives each point of an nu x nv grid; `side` 1 faces du x dv, -1 the other way, 2 both. */
function grid(L, nu, nv, f, side = 1) {
  const { THREE } = L, sets = side === 2 ? [1, -1] : [side], pos = [], uv = [], idx = [];
  for (const s of sets) {
    const o = pos.length / 3;
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { pos.push(...f(i / nu, j / nv)); uv.push(i / nu, j / nv); }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const a = o + j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
      if (s > 0) idx.push(a, b, c, b, d, c); else idx.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

/** A shape drawn in x, y ([x, y] points) extruded `t` along z, centred on z 0. */
function slabXY(L, pts, t, bevel = 0.008, holes = []) {
  const { THREE } = L, sh = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(sh, { depth: Math.max(0.001, t - bevel * 2), bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1, curveSegments: 12 });
  return g.translate(0, 0, -t / 2 + bevel);
}

/** A rock: a flattened ball rx x ry x rz at x, y, z. */
function rock(K, L, x, y, z, rx, ry, rz, i) {
  K.put(L.ball(1, 12, 8).scale(rx, ry, rz), K.plain(STONES[i % STONES.length]), x, y, z, i * 1.1);
}

/** A little five-petalled flower facing up, its eye yellow. */
function flower(K, L, x, y, z, c, r = 0.05) {
  for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; K.put(L.ball(r * 0.6, 8, 4).scale(1, 0.45, 1), K.gloss(c), x + Math.cos(a) * r * 0.75, y, z + Math.sin(a) * r * 0.75); }
  K.put(L.ball(r * 0.4, 8, 4), K.gloss('#f8d038'), x, y + r * 0.15, z);
}

/** A reed with a bulrush head, from y0 up h, leaning `lean` across x. */
function reed(K, L, x, y0, z, h, head = true, lean = 0) {
  K.put(L.cyl(0.008, h, 0.012, 6), K.plain(REED), x, y0 + h / 2, z, 0, 0, lean);
  if (head) K.put(L.cyl(0.03, u(8), 0.03, 8), K.plain(CATTAIL), x - Math.sin(lean) * h, y0 + h - u(3), z, 0, 0, lean);
}

/** A falling sheet of water, w wide, from y0 to y1, at x, z: see-through, a few streaks of foam down it. */
function waterfall(K, L, x, y0, y1, z, w, d = 0.03) {
  K.put(L.rbox(w, y1 - y0, d, 0.008), K.glass(), x, (y0 + y1) / 2, z);
  for (let i = 0; i < 3; i++) K.put(L.rbox(0.012, (y1 - y0) * (0.7 + (i % 2) * 0.25), 0.006, 0.002), K.gloss(FOAM), x - w / 3 + i * w / 3, y0 + (y1 - y0) * (i % 2 ? 0.45 : 0.55), z + d / 2 + 0.004);
}

/** A see-through curtain of water round a bowl's rim, falling from y1 to y0. */
const curtain = (K, L, r0, r1, y0, y1) => K.put(L.cyl(r1, y1 - y0, r0, 24, true), K.glass(), 0, (y0 + y1) / 2, 0);

/** The camp sign's three words, each on its board's colour: one canvas, a row a board. */
const signWords = (cols) => once('signs' + cols, () => {
  const c = new OffscreenCanvas(128, 171), g = c.getContext('2d');
  ['CAMP', 'LAKE', 'TRAIL'].forEach((w, i) => {
    g.fillStyle = cols[i]; g.fillRect(0, i * 57, 128, 57);
    g.fillStyle = 'rgba(0,0,0,0.62)'; g.font = 'bold 38px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(w, 64, i * 57 + 31);
  });
  return c;
});

export const SHAPES = {
  tierfountain: { make: 'tierfountain', play: { does: 'water', fountain: true } },
  wailmerfountain: { make: 'wailmerfountain', play: { does: 'water', fountain: true } },
  rockwaterfall: { make: 'rockwaterfall', play: { does: 'water' } },
  gardenstream: { make: 'streamZ', play: { does: 'water' } },
  streamstones: { make: 'streamZ', stones: true, play: { does: 'water' } },
  footbridge: { make: 'footbridge' },
  stonebridge: { make: 'stonebridge' },
  lotadpond: { make: 'lotadpond', play: { does: 'water' } },
  gardenpump: { make: 'gardenpump', play: { does: 'water' } },
  rainbarrel: { make: 'rainbarrel', play: { does: 'water' } },
  waterwheel: { make: 'waterwheel', play: { does: 'water' } },
  psyduckpond: { make: 'psyduckpond', play: { does: 'squeak' } },
  cedartub: { make: 'cedartub', play: { does: 'bubbles', foam: true } },
  outdoorshower: { make: 'outdoorshower', play: { does: 'water' } },
  pumptrough: { make: 'pumptrough', play: { does: 'water' } },
  campfire: { make: 'campfire', play: { does: 'fire' } },
  logbench: { make: 'logbench', seat: 0.45 },
  hammockstand: { make: 'hammockstand', seat: 0.5, play: { does: 'rock' } },
  leanto: { make: 'leanto' },
  campkitchen: { make: 'campkitchen', top: 0.79 },
  lanternpost: { make: 'lanternpost', play: { does: 'light' } },
  campchair: { make: 'campchair', seat: 0.44 },
  campstove: { make: 'campstove', play: { does: 'fire' } },
  firewoodrack: { make: 'firewoodrack' },
  canoestand: { make: 'canoestand' },
  packbedroll: { make: 'packbedroll' },
  rodrack: { make: 'rodrack' },
  campsign: { make: 'campsign' },
  moviescreen: { make: 'moviescreen', screen: { x: 0, y: u(66), w: u(48), h: u(36), z: 0.045 }, play: { does: 'screen', show: ['cartoon', 'battle', 'weather'] } },
  belltent: { make: 'belltent' },
};

export const MAKES = {
  /** A tiered fountain: a wide basin, a pedestal, two bowls above it, each spilling a curtain of water, a finial
      spraying on top. */
  tierfountain(K, s, W, D, L) {
    const { lathe, cyl, ball } = L, st = K.plain(K.pal.p), rim = K.plain(L.tone(K.pal.p, 1.12)), acc = K.gloss(K.pal.a), water = K.gloss(WATER);
    K.put(lathe([[0.82, 0], [0.875, 0.03], [0.875, 0.44], [0, 0.44]], 32), st, 0, 0, 0);
    K.put(lathe([[0.86, 0.44], [0.94, 0.44], [0.94, 0.56], [0.86, 0.56], [0.86, 0.48]], 32), rim, 0, 0, 0);
    K.put(cyl(0.88, u(2), 0.88, 32, true), acc, 0, u(8), 0);
    K.put(cyl(0.86, 0.02, 0.86, 32), water, 0, 0.49, 0);
    K.put(lathe([[0.16, 0.48], [0.125, 0.54], [0.125, 1.2], [0, 1.2]], 16), st, 0, 0, 0);
    // the middle bowl, then the column and the top bowl
    K.put(lathe([[0, 1.19], [0.375, 1.19], [0.5625, 1.41], [0, 1.41]], 24), st, 0, 0, 0);
    K.put(lathe([[0.53, 1.41], [0.594, 1.41], [0.594, 1.5], [0.53, 1.5], [0.53, 1.44]], 24), rim, 0, 0, 0);
    K.put(cyl(0.53, 0.02, 0.53, 24), water, 0, 1.46, 0);
    curtain(K, L, 0.62, 0.6, 0.56, 1.44);
    K.put(cyl(u(3), 0.46, u(3), 12), st, 0, 1.72, 0);
    K.put(lathe([[0, 1.81], [0.1875, 1.81], [0.3125, 2.0], [0, 2.0]], 16), st, 0, 0, 0);
    K.put(lathe([[0.29, 2.0], [0.344, 2.0], [0.344, 2.06], [0.29, 2.06], [0.29, 2.02]], 16), rim, 0, 0, 0);
    K.put(cyl(0.29, 0.02, 0.29, 16), water, 0, 2.03, 0);
    curtain(K, L, 0.37, 0.34, 1.44, 2.02);
    K.put(cyl(u(2), u(6), u(2), 10), acc, 0, u(69), 0);
    K.put(ball(u(3), 12, 8), acc, 0, u(74), 0);
    for (const [x, y, z, r] of [[0, 79, 0, 2.4], [-4, 77, 0, 1.6], [4, 77, 0, 1.6], [0, 77, 4, 1.6], [0, 77, -4, 1.6]]) K.put(ball(u(r), 8, 6), K.gloss(SPRAY), u(x), u(y), u(z));
  },

  /** A round pool with a Wailmer statue rising from it, spouting water from its blowhole. */
  wailmerfountain(K, s, W, D, L) {
    const { lathe, cyl, ball, torus } = L, blue = K.gloss(WAILMER), ink = K.gloss(INK), spray = K.gloss(SPRAY);
    K.put(lathe([[0.89, 0], [0.906, 0.02], [0.906, 0.35], [0, 0.35]], 32), K.plain(STONE), 0, 0, 0);
    K.put(lathe([[0.84, 0.34], [0.97, 0.34], [0.97, 0.44], [0.84, 0.44], [0.84, 0.38]], 32), K.plain(K.pal.p), 0, 0, 0);
    K.put(cyl(0.91, u(1.5), 0.91, 32, true), K.gloss(K.pal.a), 0, u(5.2), 0);
    K.put(cyl(0.84, 0.02, 0.84, 32), K.gloss(WATER), 0, 0.37, 0);
    // the Wailmer: its round body, cream belly, side fins, a tail at the back
    const cy = u(26), rx = u(18), ry = u(15), rz = 0.5, zAt = (x, y) => rz * Math.sqrt(Math.max(0, 1 - (x / rx) ** 2 - ((y - cy) / ry) ** 2));
    K.put(ball(1, 20, 14).scale(rx, ry, rz), blue, 0, cy, 0);
    K.put(ball(1, 16, 10).scale(u(14), u(6.5), 0.42), K.gloss(BELLY), 0, u(18), 0.1);
    for (const sx of [-1, 1]) K.put(ball(1, 10, 6).scale(u(4.5), u(2), 0.12), K.gloss(L.tone(WAILMER, 0.8)), sx * u(18.5), u(20), 0.08, sx * 0.3, 0, sx * -0.35);
    for (const sx of [-1, 1]) K.put(ball(1, 10, 6).scale(0.16, 0.04, 0.12), blue, sx * 0.12, 0.92, -0.5, sx * 0.5, 0, sx * 0.3);
    for (const sx of [-1, 1]) {
      const ex = sx * u(7), ey = u(30), ez = zAt(ex, ey);
      K.put(ball(u(2), 10, 8), ink, ex, ey, ez - 0.01);
      K.put(ball(u(0.7), 8, 6), K.gloss('#ffffff'), ex - u(0.6), ey + u(0.8), ez + u(1.4));
    }
    const smile = []; for (let i = 0; i <= 8; i++) { const t = i / 4 - 1, x = t * u(11), y = u(23) - u(2) * (1 - t * t); smile.push([x, y, zAt(x, y) + 0.004]); }
    K.put(tube(L, smile, 0.008, 12), ink);
    K.put(ball(u(1.8), 8, 6).scale(1, 0.4, 1), K.gloss(L.tone(WAILMER, 0.5)), 0, cy + ry - 0.005, 0);
    // the spout and its crown of spray
    K.put(cyl(u(1.4), u(29), u(2), 10, true), K.glass(), 0, u(55.5), 0);
    K.put(cyl(u(0.8), u(28), u(1.2), 8), spray, 0, u(55), 0);
    for (const [x, y, r] of [[-6, 70, 3], [0, 73, 3.4], [6, 70, 3], [-10, 64, 1.6], [10, 64, 1.6]]) K.put(ball(u(r), 10, 8), spray, u(x), u(y), 0);
    for (const z of [-5, 5]) K.put(ball(u(2.4), 8, 6), spray, 0, u(70), u(z));
    K.put(torus(u(5), u(0.8), TAU, 16).rotateX(Math.PI / 2), spray, 0, 0.375, 0.42);
  },

  /** A rock waterfall: stones heaped up behind, a sheet of water tumbling from a lip into a pool, foam at its foot. */
  rockwaterfall(K, s, W, D, L) {
    const { ball, rbox, cyl } = L;
    [[44, 64, 11, 8], [14, 58, 8, 6], [30, 58, 9, 5], [18, 42, 10, 12], [48, 46, 11, 14], [12, 22, 10, 12], [52, 24, 10, 14]].forEach(([cx, cy, rx, ry], i) =>
      rock(K, L, X(cx, W), u(cy), i < 3 ? -0.22 : -0.12, u(rx), u(ry), i < 3 ? 0.2 : 0.28, i));
    K.put(ball(1, 12, 8).scale(0.42, 0.8, 0.16), K.plain(STONE2), 0, 0.9, -0.3);
    for (const [lx, ly] of [[10, 63], [16, 64], [40, 71], [47, 72], [54, 60]]) K.put(ball(u(3), 8, 4).scale(1, 0.5, 1.4), K.plain(K.pal.leaf), X(lx, W), u(ly), -0.18, lx);
    flower(K, L, X(44, W), u(72), -0.18, K.pal.c, 0.06); flower(K, L, X(13, W), u(64), -0.2, K.pal.a, 0.05);
    K.put(rbox(u(14), u(2), 0.22, 0.008), K.gloss(L.tone(WATER, 1.2)), X(31, W), u(55), -0.08);
    waterfall(K, L, X(31, W), u(9), u(55), 0.04, u(12));
    K.put(cyl(1, 0.02, 1, 20).scale(u(26), 1, 0.24), K.gloss(WATER), 0, u(10), 0.06);
    for (let i = 0; i < 5; i++) K.put(ball(u(2.2), 8, 6), K.gloss(FOAM), X(24 + i * 3.6, W), u(10), 0.1);
    [[8, 6, 8, 6], [22, 5, 9, 5], [42, 5, 9, 5], [56, 6, 8, 6]].forEach(([cx, cy, rx, ry], i) => rock(K, L, X(cx, W), u(cy), 0.26, u(rx), u(ry), 0.18, i + 1));
  },

  /** A strip of stream from bank to bank across the piece, end to end with the next: grassy banks, pebbles at the
      water's edge, reeds, a lily pad and a flower (or, the crossing, three flat stones across it). */
  streamZ(K, s, W, D, L) {
    const { rbox, ball, cyl, THREE } = L, bank = K.plain(L.tone(K.pal.leaf, 0.92)), z0 = -D / 2;
    for (const z of [-0.375, 0.375]) K.put(rbox(W, 0.08, 0.25, 0.02), bank, 0, 0.04, z * D);
    K.put(rbox(W, 0.03, 0.52, 0.006), K.gloss(WATER), 0, 0.03, 0);
    for (let x = 0; x < W * 32; x += 16) for (const [dx, y, w] of [[3, 13, 7], [10, 19, 6]]) K.put(rbox(u(w), 0.004, u(1), 0.001), K.gloss(L.tone(WATER, 1.25)), X(x + dx + w / 2, W), 0.047, z0 + u(y));
    for (let x = 0; x < W * 32; x += 8) {
      rock(K, L, Math.max(-W / 2 + u(2.6), X(x + 3, W)), 0.06, z0 + u(8.5), u(2.6), 0.04, u(1.8), x / 8);
      rock(K, L, Math.min(W / 2 - u(2.4), X(x + 7, W)), 0.06, z0 + u(23.5), u(2.4), 0.04, u(1.6), x / 8 + 1);
    }
    if (s.stones) {
      for (const [x, y, r] of [[W * 16 - 2, 12, 4.4], [W * 16 + 3, 17, 4.6], [W * 16 - 2, 22, 4.2]]) rock(K, L, X(x, W), 0.045, z0 + u(y), u(r), 0.035, u(r * 0.8), x + y);
      for (const y of [3, 28]) K.put(cyl(1, 0.03, 1, 12).scale(u(4.6), 1, u(2.8)), K.plain('#bab4a8'), 0, 0.095, z0 + u(y));
      return;
    }
    for (let i = 0; i < 3; i++) reed(K, L, X(10 + i * 20, W), 0.08, z0 + u(4), 0.3 + (i % 2) * 0.12, i !== 1, (i - 1) * 0.08);
    flower(K, L, X(W * 32 - 14, W), 0.12, z0 + u(28), K.pal.c, 0.045);
    K.put(cyl(0.02, 0.04, 0.02, 6), K.plain(REED), X(W * 32 - 14, W), 0.1, z0 + u(28));
    K.put(new THREE.CircleGeometry(u(2.8), 14, 0.3, TAU - 0.6).rotateX(-Math.PI / 2), K.gloss(PAD), X(18, W), 0.05, z0 + u(16));
  },

  /** A wooden footbridge: an arched deck of planks on two curved stringers, railings either side, stone footings. */
  footbridge(K, s, W, D, L) {
    const { rbox, THREE } = L, wood = K.wood(), dark = K.wood(L.tone(K.pal.w, 0.74)), top = (px) => u(ARCH(px));
    for (const px of [4, 60]) K.put(rbox(u(8), u(4), 0.9, 0.012), K.plain(STONE), X(px, W), u(2), 0);
    const curveOf = (dy) => { const pts = []; for (let i = 0; i <= 20; i++) pts.push([X(2 + i * 3, W), top(2 + i * 3) + dy]); return pts; };
    const string = [...curveOf(0), ...curveOf(-u(5)).reverse()];
    for (const z of [-0.42, 0.42]) K.put(slabXY(L, string, 0.05), wood, 0, 0, z);
    for (let i = 0; i < 20; i++) {
      const px = 3.5 + i * 3, a = Math.atan(14 * Math.PI / 60 * Math.cos(Math.PI * (px - 2) / 60));
      K.put(rbox(u(2.8), 0.03, 0.82, 0.008), i % 2 ? wood : K.wood(L.tone(K.pal.w, 0.9)), X(px, W), top(px) - 0.016, 0, 0, 0, a);
    }
    // the posts, the mid rail and the top rail, both sides
    for (const z of [-0.43, 0.43]) {
      for (const px of [4, 18, 32, 46, 60]) K.put(rbox(u(3), u(24), u(3), 0.01), dark, X(px, W), top(px) + u(12), z);
      const rail = (dy) => { const pts = []; for (let i = 0; i <= 8; i++) { const px = 4 + i * 7; pts.push(new THREE.Vector3(X(px, W), top(px) + u(dy), z)); } return pts; };
      K.put(tube(L, rail(12).map(v => v.toArray()), u(1), 16), dark);
      K.put(tube(L, rail(22.5).map(v => v.toArray()), u(1.5), 16), wood);
    }
  },

  /** A stone bridge: one arch, voussoirs ringing it, a gravel deck between parapets with pale coping, piers capped
      with balls at the ends. */
  stonebridge(K, s, W, D, L) {
    const { rbox, ball, THREE } = L, stone = K.plain(STONE), pale = K.plain(K.pal.p), deck = 0.72;
    const sh = new THREE.Shape();
    sh.moveTo(X(2, W), 0); sh.lineTo(-0.5, 0); sh.absellipse(0, 0, 0.5, u(15), Math.PI, 0, true); sh.lineTo(X(62, W), 0); sh.lineTo(X(62, W), deck); sh.lineTo(X(2, W), deck); sh.closePath();
    K.put(new THREE.ExtrudeGeometry(sh, { depth: 0.78, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 1, curveSegments: 14 }).translate(0, 0, -0.39), stone, 0, 0, 0);
    for (let i = 1; i < 8; i++) {
      const a = Math.PI + i / 8 * Math.PI, x = Math.cos(a) * u(17.5), y = -Math.sin(a) * u(16.5);
      for (const z of [-0.405, 0.405]) K.put(rbox(u(5), u(4.4), 0.04, 0.002), K.plain(i % 2 ? '#bab4a8' : STONE2), x, y, z, 0, 0, a + Math.PI / 2);
    }
    K.put(rbox(u(60), 0.02, 0.6, 0.006), K.plain('#c8bca0'), 0, deck + 0.01, 0);
    for (const z of [-0.34, 0.34]) {
      K.put(rbox(u(60), 1 - deck, 0.1, 0.012), stone, 0, (1 + deck) / 2, z);
      K.put(rbox(u(62), u(3), 0.16, 0.012), pale, 0, u(33.5), z);
    }
    for (const sx of [-1, 1]) {
      K.put(rbox(u(6), u(39), 0.88, 0.015), K.plain(L.tone(STONE, 1.08)), sx * (W / 2 - u(3)), u(19.5), 0);
      K.put(rbox(u(6), u(2), 0.92, 0.008), pale, sx * (W / 2 - u(3)), u(40), 0);
      for (const z of [-0.3, 0.3]) K.put(ball(u(3), 12, 8), K.gloss(K.pal.a), sx * (W / 2 - u(3)), u(43), z);
    }
  },

  /** A raised stone pond, its coping in the theme: lily pads, a lotus, cattails at the back and a Lotad in the
      middle wearing its lily pad. */
  lotadpond(K, s, W, D, L) {
    const { lathe, cyl, ball, THREE } = L, pad = K.gloss(PAD);
    K.put(lathe([[0.89, 0], [0.906, 0.02], [0.906, 0.42], [0, 0.42]], 32), K.plain(STONE), 0, 0, 0);
    K.put(lathe([[0.85, 0.4], [0.97, 0.4], [0.97, 0.5], [0.85, 0.5], [0.85, 0.44]], 32), K.plain(K.pal.p), 0, 0, 0);
    K.put(cyl(0.85, 0.02, 0.85, 32), K.gloss(WATER), 0, 0.43, 0);
    for (const [x, z, r, a] of [[-0.42, 0.42, 0.16, 0], [0.42, -0.3, 0.14, 2], [0.5, 0.4, 0.12, 4], [-0.2, -0.5, 0.13, 1]]) K.put(new THREE.CircleGeometry(r, 16, 0.3, TAU - 0.6).rotateX(-Math.PI / 2), pad, x, 0.445, z, a);
    // the Lotad: its body, beak and eyes, the big pad on its head
    const lz = 0.12;
    K.put(ball(1, 16, 10).scale(u(7), u(6.5), u(7)), K.gloss(LOTAD), 0, u(18), lz);
    K.put(ball(1, 10, 6).scale(u(3), u(1.4), u(2.4)), K.gloss('#f0c040'), 0, u(16.5), lz + u(6.6));
    for (const sx of [-1, 1]) K.put(ball(u(1), 8, 6), K.gloss(INK), sx * u(3), u(21), lz + u(6));
    K.put(cyl(u(12.4), u(1.4), u(12.4), 20).scale(1, 1, 0.9), pad, 0, u(26.4), lz);
    K.put(cyl(u(13), u(1.2), u(12.6), 20).scale(1, 1, 0.9), K.gloss(L.tone(PAD, 0.74)), 0, u(25.2), lz);
    K.put(cyl(u(1), u(2.4), u(1), 6), K.gloss(L.tone(PAD, 0.74)), 0, u(28.2), lz);
    // the lotus, on its own pad
    const fx = X(11, W), fz = 0.5;
    K.put(new THREE.CircleGeometry(0.12, 14, 0.3, TAU - 0.6).rotateX(-Math.PI / 2), pad, fx, 0.446, fz, 1);
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; K.put(ball(1, 8, 6).scale(u(1.4), u(3), u(1)), K.gloss(i % 2 ? L.tone(K.pal.c, 1.2) : '#f8f0f4'), fx + Math.cos(a) * 0.03, u(18), fz + Math.sin(a) * 0.03, -a, 0, 0); }
    K.put(ball(u(1.2), 8, 6), K.gloss('#f8d038'), fx, u(18.5), fz);
    for (let i = 0; i < 3; i++) reed(K, L, X(50.5 + i * 3, W), 0.43, -0.5 + i * 0.06, u(42 - i * 3) - 0.43, true, -0.03 + i * 0.03);
    K.put(ball(1, 8, 4).scale(u(2), u(5), 0.02), K.plain(REED), X(47, W), u(22), -0.42, 0, 0, 0.3);
  },

  /** A cast-iron garden pump on a flagstone, its handle up, its spout over a bucket. */
  gardenpump(K, s, W, D, L) {
    const { rbox, cyl, lathe, ball, torus } = L, iron = K.metal(K.pal.m), dark = K.metal(L.tone(K.pal.m, 0.74)), px = X(13, W);
    K.put(rbox(u(28), u(5), 0.72, 0.015), K.plain(STONE), 0, u(2.5), 0);
    // the bucket
    const bx = X(25, W), bz = 0.12, pail = K.gloss(K.pal.c);
    K.put(lathe([[0, u(5)], [u(5), u(5)], [u(6), u(17)], [u(5.4), u(17)], [u(4.5), u(5.6)], [0, u(5.6)]], 16), pail, bx, 0, bz);
    K.put(torus(u(6), u(0.5), TAU, 16).rotateX(Math.PI / 2), K.gloss(L.tone(K.pal.c, 1.2)), bx, u(17), bz);
    K.put(torus(u(5.55), u(0.35), TAU, 16).rotateX(Math.PI / 2), K.gloss(L.tone(K.pal.c, 0.74)), bx, u(11), bz);
    K.put(torus(u(5.5), u(0.3), Math.PI, 12), iron, bx, u(17.5), bz);
    K.put(cyl(u(5.2), 0.01, u(5.2), 14), K.gloss(WATER), bx, u(14), bz);
    // the pump: its flange, body and bands, spout, cap, handle
    K.put(cyl(u(6), u(3), u(6), 16), dark, px, u(6.5), 0);
    K.put(cyl(u(4), u(32), u(4), 16), iron, px, u(24), 0);
    for (const y of [11, 31]) K.put(cyl(u(5), u(2), u(5), 16), dark, px, u(y), 0);
    K.put(cyl(u(1.5), u(8), u(1.5), 10).rotateZ(Math.PI / 2), iron, X(21, W), u(31.5), 0);
    K.put(cyl(u(1.5), u(6), u(1.5), 10), iron, X(23.5, W), u(30), 0);
    K.put(ball(u(1.2), 8, 6), K.gloss(WATER), X(23.5, W), u(25), 0);
    K.put(cyl(u(5.4), u(4), u(6), 16), dark, px, u(42), 0);
    K.put(ball(u(2), 10, 8), dark, px, u(47), 0);
    rod(K, L, dark, [X(10, W), u(43), 0], [X(4, W), u(58), 0], u(1.2));
    K.put(ball(u(2), 10, 8), dark, X(4, W), u(59), 0);
    K.put(rbox(u(4), u(3), u(2), 0.004), dark, X(10, W), u(43), 0);
  },

  /** A rain barrel: a hooped wooden barrel on a low stand, a funnel lid to catch the rain, a brass tap at its foot. */
  rainbarrel(K, s, W, D, L) {
    const { rbox, lathe, torus, cyl } = L, wood = K.wood(), dark = K.wood(L.tone(K.pal.w, 0.74)), hoop = K.metal(K.pal.m);
    for (const px of [9, 23]) K.put(rbox(u(6), u(8), 0.56, 0.012), dark, X(px, W), u(4), 0);
    K.put(rbox(u(24), u(2), 0.66, 0.008), K.wood(L.tone(K.pal.w, 0.55)), 0, u(9), 0);
    const prof = [[0, u(10)], [u(10), u(10)], [u(11.1), u(19)], [u(11.5), u(28)], [u(11.1), u(37)], [u(10), u(46)], [0, u(46)]];
    K.put(lathe(prof, 20), wood, 0, 0, 0);
    const rAt = (y) => { for (let i = 1; i < prof.length - 1; i++) if (y <= prof[i + 1][1]) { const [r0, y0] = prof[i], [r1, y1] = prof[i + 1]; return r0 + (r1 - r0) * (y - y0) / (y1 - y0); } return u(10); };
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * TAU, pts = [10.5, 19, 28, 37, 45.5].map(py => { const r = rAt(u(py)) + 0.002; return [Math.sin(a) * r, u(py), Math.cos(a) * r]; });
      K.put(tube(L, pts, 0.005, 8), K.plain(L.tone(K.pal.w, 0.6)));
    }
    for (const py of [14, 27, 40]) K.put(torus(rAt(u(py)) + 0.008, u(1), TAU, 20).rotateX(Math.PI / 2), hoop, 0, u(py), 0);
    K.put(cyl(u(10.5), u(1.5), u(10.5), 20), K.wood(L.tone(K.pal.w, 1.2)), 0, u(46.6), 0);
    K.put(lathe([[u(3), u(47)], [u(9), u(56)], [u(8.4), u(56)], [u(2.6), u(47.6)]], 16), hoop, 0, 0, 0);
    K.put(torus(u(9), u(0.8), TAU, 16).rotateX(Math.PI / 2), K.metal(L.tone(K.pal.m, 1.2)), 0, u(56), 0);
    K.put(cyl(u(2.6), 0.01, u(2.6), 10), K.plain(INK), 0, u(47.4), 0);
    // the tap
    const brass = K.metal(BRASS), tz = rAt(u(17));
    K.put(cyl(u(1.5), u(3), u(1.5), 10).rotateX(Math.PI / 2), brass, 0, u(17.5), tz + u(1.2));
    K.put(cyl(u(1), u(4), u(1), 8), brass, 0, u(15), tz + u(2.4));
    K.put(rbox(u(4), u(1), u(1.4), 0.003), brass, 0, u(20), tz + u(1.4));
  },

  /** A water wheel turning in its millrace: twin rims, spokes, paddles round it, posts at the axle, the flume
      pouring onto it from the right. */
  waterwheel(K, s, W, D, L) {
    const { rbox, cyl, torus } = L, wood = K.wood(), dark = K.wood(L.tone(K.pal.w, 0.74)), lite = K.wood(L.tone(K.pal.w, 1.15)), iron = K.metal(K.pal.m);
    const cx = X(30, W), cy = u(38), R = u(24);
    for (const z of [-0.13, 0.13]) {
      K.put(torus(R, u(1.5), TAU, 32), wood, cx, cy, z);
      K.put(torus(u(20), u(0.7), TAU, 28), dark, cx, cy, z);
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; rod(K, L, dark, [cx, cy, z], [cx + Math.cos(a) * u(23), cy + Math.sin(a) * u(23), z], u(0.8)); }
    }
    for (let i = 0; i < 12; i++) { const a = (i + 0.5) / 12 * TAU; K.put(rbox(u(5), u(1.4), 0.34, 0.008), lite, cx + Math.cos(a) * u(24.5), cy + Math.sin(a) * u(24.5), 0, 0, 0, a); }
    K.put(cyl(u(4), 0.34, u(4), 14).rotateX(Math.PI / 2), iron, cx, cy, 0);
    K.put(cyl(u(1.4), 0.7, u(1.4), 10).rotateX(Math.PI / 2), iron, cx, cy, 0);
    for (const z of [-0.3, 0.3]) K.put(rbox(u(4), cy - u(12), 0.07, 0.01), dark, cx, (cy + u(12)) / 2, z);
    // the millrace below, the flume above and the water falling between
    K.put(rbox(u(60), u(12), 0.72, 0.015), dark, 0, u(6), 0);
    K.put(rbox(u(56), 0.02, 0.6, 0.006), K.gloss(WATER), 0, u(12) + 0.005, 0);
    K.put(rbox(u(26), u(5), 0.3, 0.012), wood, X(51, W), u(69.5), 0);
    K.put(rbox(u(24), 0.012, 0.22, 0.004), K.gloss(WATER), X(51, W), u(72) + 0.004, 0);
    K.put(rbox(u(3), u(55), u(3), 0.008), dark, X(58.5, W), u(39.5), 0);
    waterfall(K, L, X(44, W), u(12), u(67), 0, u(6), 0.18);
  },

  /** A pond in a grassy bank: a Psyduck float bobbing on it, reeds and cattails, a duck house on a post. */
  psyduckpond(K, s, W, D, L) {
    const { lathe, cyl, ball, torus, rbox } = L, duck = K.gloss(DUCK), ink = K.gloss(INK);
    K.put(lathe([[0.94, 0], [0.94, u(6)], [0.9, u(8)], [0.8, u(8)], [0.78, u(6)], [0, u(6)]], 32), K.plain(L.tone(K.pal.leaf, 0.8)), 0, 0, 0);
    K.put(cyl(0.8, 0.02, 0.8, 32), K.gloss(WATER), 0, u(6.2), 0);
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; rock(K, L, Math.sin(a) * 0.86, u(7.6), Math.cos(a) * 0.86, u(2.6), u(1.4), u(2), i); }
    // the float: a ring and Psyduck's head, beak, eyes and three hairs
    const fx = X(24, W), fz = 0.2;
    K.put(torus(u(9), u(3.2), TAU, 24).rotateX(Math.PI / 2), duck, fx, u(11), fz);
    const hz = fz + 0.22;
    K.put(ball(u(8), 16, 12), duck, fx, u(23), hz);
    K.put(ball(1, 12, 8).scale(u(5), u(2.4), u(3.4)), K.gloss(BEAK), fx, u(19.5), hz + u(7));
    for (const sx of [-1, 1]) { K.put(ball(u(1.8), 10, 8), K.gloss('#ffffff'), fx + sx * u(3), u(25), hz + u(6.6)); K.put(ball(u(0.8), 8, 6), ink, fx + sx * u(3), u(25), hz + u(8.2)); }
    for (const dx of [-2, 0, 2]) rod(K, L, ink, [fx + u(dx * 0.4), u(30.5), hz], [fx + u(dx * 1.4), u(35), hz], 0.008);
    // the duck house
    const hx = X(50, W), hz2 = -0.38, roof = K.wood(K.pal.c);
    K.put(rbox(u(3), u(26), u(3), 0.008), K.wood(L.tone(K.pal.w, 0.74)), X(49.5, W), u(19), hz2);
    K.put(rbox(u(18), u(2), 0.42, 0.008), K.wood(L.tone(K.pal.w, 0.74)), hx, u(32), hz2);
    K.put(rbox(u(14), u(11), 0.34, 0.012), K.wood(), hx, u(38.5), hz2);
    K.put(rbox(u(4), u(5), 0.01, 0.002), ink, hx, u(35.5), hz2 + 0.172);
    K.put(cyl(u(2), 0.01, u(2), 10).rotateX(Math.PI / 2), ink, hx, u(38), hz2 + 0.172);
    const run = u(10), rise = u(11), len = Math.hypot(run, rise), tilt = Math.atan2(rise, run);
    for (const sx of [-1, 1]) K.put(rbox(len + 0.02, 0.035, 0.42, 0.008), roof, hx + sx * run / 2, u(43) + rise / 2, hz2, 0, 0, -sx * tilt);
    K.put(slabXY(L, [[-u(7), 0], [u(7), 0], [0, u(7.7)]], 0.34, 0.004), K.wood(), hx, u(44), hz2);
    for (let i = 0; i < 4; i++) reed(K, L, X(5.5 + i * 2.5, W), u(6), -0.42 + (i % 2) * 0.06, u(i % 2 ? 20 : 24), i === 0 || i === 2, (i - 1.5) * 0.05);
  },

  /** A round cedar hot tub: staves, two hoops, a rim to sit on, steaming water, steps up the front and a towel. */
  cedartub(K, s, W, D, L) {
    const { lathe, cyl, ball, torus, rbox } = L, wood = K.wood(), lite = K.wood(L.tone(K.pal.w, 1.18)), hoop = K.metal(K.pal.m), R = u(28);
    K.put(lathe([[R - 0.015, 0], [R, 0.02], [R, u(29)], [0.8, u(29)], [0.8, 0.8], [0, 0.8]], 32), wood, 0, 0, 0);
    for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; K.put(rbox(0.012, u(28), 0.01, 0.001), K.plain(L.tone(K.pal.w, 0.6)), Math.sin(a) * (R + 0.002), u(14.5), Math.cos(a) * (R + 0.002), a); }
    for (const y of [6, 24]) K.put(torus(R + 0.01, u(1), TAU, 32).rotateX(Math.PI / 2), hoop, 0, u(y), 0);
    K.put(lathe([[u(29), u(29)], [u(29), u(32)], [0.79, u(32)], [0.79, u(29)]], 32), lite, 0, 0, 0);
    K.put(cyl(0.79, 0.02, 0.79, 32), K.gloss(WATER), 0, 0.86, 0);
    for (let i = 0; i < 7; i++) { const a = i * 2.4, r = 0.2 + (i % 3) * 0.18; K.put(ball(0.025 + (i % 2) * 0.015, 8, 6), K.gloss(FOAM), Math.cos(a) * r, 0.875, Math.sin(a) * r); }
    // the towel on the rim, the steps up
    const ta = Math.atan2(u(20), 0.58);
    K.put(rbox(u(12), u(3.4), 0.2, 0.02), K.cloth(K.pal.c), X(52, W), u(33.5), 0.6, ta);
    K.put(rbox(u(12.2), u(1), 0.204, 0.004), K.cloth(K.pal.p), X(52, W), u(33.8), 0.6, ta);
    K.put(rbox(u(28), u(10), 0.3, 0.015), lite, 0, u(5), 0.82);
    K.put(rbox(u(20), u(10), 0.22, 0.015), lite, 0, u(15), 0.77);
  },

  /** An outdoor shower: a slatted pallet to stand on, a post with its pipe up to an arm and a round rose, a tap
      wheel, a towel on a hook and a soap dish. */
  outdoorshower(K, s, W, D, L) {
    const { rbox, cyl } = L, pipe = K.metal(K.pal.m), pz = -0.3;
    for (let i = 0; i < 5; i++) K.put(rbox(u(4.4), u(3), 0.8, 0.008), K.wood(), X(5.2 + i * 5.4, W), u(2.5), 0);
    for (const z of [-0.3, 0.3]) K.put(rbox(u(26), u(1.2), 0.06, 0.004), K.wood(L.tone(K.pal.w, 0.74)), 0, u(0.6), z);
    K.put(rbox(u(4), u(80), u(4), 0.01), K.wood(), X(6, W), u(44), pz);
    K.put(cyl(u(1), u(70), u(1), 8), pipe, X(9, W), u(45), pz);
    rod(K, L, pipe, [X(9, W), u(80), pz], [X(22, W), u(80), 0], u(1));
    K.put(cyl(u(1), u(4), u(1), 8), pipe, X(22, W), u(78), 0);
    K.put(cyl(u(4), u(1.4), u(6), 16), K.metal(L.tone(K.pal.m, 1.25)), X(22, W), u(76), 0);
    K.put(cyl(u(5.6), 0.004, u(5.6), 16), K.plain(L.tone(K.pal.m, 0.6)), X(22, W), u(75.2), 0);
    K.put(cyl(u(3), u(1.4), u(3), 14).rotateX(Math.PI / 2), K.gloss(K.pal.c), X(11, W), u(44), pz + 0.07);
    K.put(rbox(u(4), u(1.5), 0.06, 0.004), pipe, X(10, W), u(57.5), pz + 0.06);
    K.put(rbox(u(7), u(18), 0.04, 0.012), K.cloth(K.pal.a), X(12.5, W), u(49), pz + 0.1);
    for (const y of [52, 46]) K.put(rbox(u(7.1), u(1.2), 0.044, 0.003), K.cloth(K.pal.p), X(12.5, W), u(y - 0.6) + u(1.2), pz + 0.1);
    K.put(rbox(u(6), u(2), 0.12, 0.006), K.gloss(K.pal.p), X(11, W), u(32), pz + 0.12);
  },

  /** A hewn stone trough of water, a wooden pump post at its end, its spout pouring and its lever raised. */
  pumptrough(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, stone = K.plain(STONE), lite = K.plain(L.tone(STONE, 1.12)), iron = K.metal(K.pal.m), tx = X(39, W);
    K.put(rbox(u(46), u(17), 0.6, 0.015), stone, tx, u(8.5), 0);
    for (const z of [-0.29, 0.29]) K.put(rbox(u(48), u(3), 0.08, 0.01), lite, tx, u(18.5), z);
    for (const sx of [-1, 1]) K.put(rbox(0.08, u(3), 0.5, 0.01), lite, tx + sx * (u(24) - 0.04), u(18.5), 0);
    K.put(rbox(u(44), 0.02, 0.5, 0.004), K.gloss(WATER), tx, u(19), 0);
    K.put(rbox(u(8), u(56), u(8), 0.015), K.wood(), X(8, W), u(28), 0);
    K.put(L.cyl(0.001, u(6), u(7), 4).rotateY(Math.PI / 4), K.wood(K.pal.c), X(8, W), u(59), 0);
    K.put(cyl(u(1.5), u(10), u(1.5), 10).rotateZ(Math.PI / 2), iron, X(17, W), u(39.5), 0);
    K.put(cyl(u(1.5), u(7), u(1.5), 10), iron, X(20.5, W), u(37.5), 0);
    K.put(cyl(u(1), u(15), u(1.2), 8, true), K.glass(), X(21.5, W), u(26.5), 0);
    K.put(ball(u(2), 10, 8), iron, X(12, W), u(48), u(4.2));
    rod(K, L, iron, [X(12, W), u(48), u(4.6)], [X(28, W), u(60), u(4.6)], u(1.1));
    K.put(ball(u(1.8), 10, 8), iron, X(28.5, W), u(60.5), u(4.6));
  },

  /** A campfire: a ring of stones, logs leant together over the flames, embers glowing at their feet. */
  campfire(K, s, W, D, L) {
    const { lathe, cyl, ball } = L;
    K.put(cyl(0.3, 0.012, 0.3, 16), K.plain('#3a3430'), 0, 0.006, 0);
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + 0.2; rock(K, L, Math.sin(a) * 0.36, u(3.4), Math.cos(a) * 0.36, u(3.8), u(3.4), u(3.2), i); }
    // the flames: a tall orange one, an amber one in front of it, a pale core, tongues either side
    const flame = (h, r) => lathe([[0, 0], [r * 0.8, h * 0.1], [r, h * 0.3], [r * 0.7, h * 0.6], [r * 0.25, h * 0.88], [0, h]], 12);
    K.put(flame(u(23), u(7)), K.glow(FLAME), 0, u(6), -0.02);
    for (const sx of [-1, 1]) K.put(flame(u(16), u(3.4)), K.glow(FLAME), sx * u(5), u(6), 0, 0, 0, -sx * 0.2);
    K.put(flame(u(15), u(4.2)), K.glow(EMBER), 0, u(6), 0.08);
    K.put(flame(u(7), u(2.4)), K.glow('#fff0a0'), 0, u(6.5), 0.13);
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; K.put(ball(0.03, 8, 6), K.glow(i % 2 ? FLAME : EMBER), Math.sin(a) * 0.14, 0.03, Math.cos(a) * 0.14); }
    for (let i = 0; i < 4; i++) {
      const a = i / 4 * TAU + Math.PI / 4, foot = [Math.sin(a) * 0.24, 0.04, Math.cos(a) * 0.24], top = [Math.sin(a) * 0.03, u(19), Math.cos(a) * 0.03];
      rod(K, L, i % 2 ? K.wood() : K.wood(L.tone(K.pal.w, 0.8)), foot, top, u(1.5));
      K.put(cyl(u(1.4), 0.01, u(1.4), 8), K.wood(L.tone(K.pal.w, 1.25)), ...foot.map((v, j) => j === 1 ? 0.03 : v * 1.06));
    }
  },

  /** A split-log bench: half a log, cut face up, resting on two sawn stumps. */
  logbench(K, s, W, D, L) {
    const { cyl, rbox, THREE } = L, bark = K.wood(L.tone(K.pal.w, 0.74)), cut = K.wood(L.tone(K.pal.w, 1.2)), r = u(7.5), y = u(14), len = u(60);
    for (const px of [14, 50]) {
      K.put(cyl(u(5.6), u(8), u(6), 14), bark, X(px, W), u(4), 0);
      K.put(cyl(u(5.4), 0.01, u(5.4), 14), cut, X(px, W), u(8), 0);
    }
    K.put(new THREE.CylinderGeometry(r, r, len, 16, 1, true, Math.PI, Math.PI).rotateZ(Math.PI / 2), bark, 0, y, 0);
    K.put(rbox(len, 0.02, r * 2, 0.006), cut, 0, y - 0.008, 0);
    for (const sx of [-1, 1]) K.put(new THREE.CircleGeometry(r, 12, Math.PI, Math.PI).rotateY(sx * Math.PI / 2), cut, sx * len / 2, y, 0);
  },

  /** A free-standing hammock: a laminated arc of wood from end to end on a base beam, ropes to spreader bars, a
      striped cloth sagging between. */
  hammockstand(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, arc = K.wood(), dark = K.wood(L.tone(K.pal.w, 0.74)), rope = K.plain(ROPE);
    const pts = []; for (let i = -12; i <= 12; i++) { const t = Math.abs(i) / 12; pts.push([Math.sign(i) * u(28) * t, u(2 + 46 * t ** 2.2), 0]); }
    K.put(tube(L, pts, u(1.8), 40), arc);
    K.put(rbox(u(52), u(4), 0.12, 0.012), dark, 0, u(2), 0);
    for (const x of [-0.8, 0, 0.8]) K.put(rbox(0.1, u(2.5), 0.7, 0.01), dark, x, u(1.25), 0);
    for (const sx of [-1, 1]) {
      const tip = [sx * u(28), u(47), 0], bar = sx * u(20);
      K.put(ball(u(1.8), 8, 6), K.metal(K.pal.m), ...tip);
      K.put(cyl(u(0.8), 0.52, u(0.8), 8).rotateX(Math.PI / 2), dark, bar, u(34), 0);
      for (const z of [-0.24, 0.24]) rod(K, L, rope, tip, [bar, u(34), z], 0.006);
    }
    // the cloth: stripes of the theme's colour and its pale, cradled across as well as sagging along
    const sag = (f) => u(34 - 16 * Math.sin(Math.PI * f)), x0 = u(12) - W / 2, x1 = u(52) - W / 2;
    for (let i = 0; i < 6; i++) {
      const f0 = i / 6, f1 = (i + 1) / 6;
      K.put(grid(L, 3, 6, (a, b) => {
        const f = f0 + (f1 - f0) * a, wide = 0.25 + 0.04 * Math.sin(Math.PI * f), c = 2 * b - 1;
        return [x0 + (x1 - x0) * f, sag(f) - u(5) * Math.sin(Math.PI * f) * (1 - c * c), c * wide];
      }, 2), K.cloth(i % 2 ? K.pal.p : K.pal.c));
    }
  },

  /** A lean-to: two log posts and a beam at the front, a tarp sloping from it to a log on the ground at the back, its
      poles under it, a bedroll inside. */
  leanto(K, s, W, D, L) {
    const { cyl, rbox } = L, log = K.wood(), dark = K.wood(L.tone(K.pal.w, 0.74)), zf = 0.8, zb = -0.88, yt = u(64);
    for (const sx of [-1, 1]) K.put(cyl(u(2), u(66), u(2.2), 10), log, sx * u(27), u(33), zf);
    K.put(cyl(u(2.5), u(62), u(2.5), 12).rotateZ(Math.PI / 2), log, 0, u(65.5), zf);
    const dz = zf - zb, dy = yt - 0.06, len = Math.hypot(dz, dy), tilt = -Math.atan2(dy, dz), nz = dy / len * 0.03, ny = -dz / len * 0.03;
    K.put(rbox(u(52), 0.02, len, 0.006), K.cloth(K.pal.c), 0, (yt + 0.06) / 2, (zf + zb) / 2, 0, tilt);
    for (const px of [19, 32, 45]) rod(K, L, dark, [X(px, W), yt + ny, zf + nz], [X(px, W), 0.06 + ny, zb + nz], u(0.9));
    K.put(cyl(u(2.5), u(50), u(2.5), 10).rotateZ(Math.PI / 2), dark, 0, u(2.5), zb);
    K.put(cyl(u(4), u(26), u(4), 14).rotateZ(Math.PI / 2), K.cloth(K.pal.a), X(29, W), u(4), 0.05);
    for (const px of [23, 36]) K.put(cyl(u(4.2), u(1.6), u(4.2), 14).rotateZ(Math.PI / 2), K.cloth(L.tone(K.pal.a, 0.74)), X(px, W), u(4), 0.05);
  },

  /** A camp kitchen: a folding table on X legs with a shelf and a water jug, a windscreen behind with a rail of
      hanging things, a kettle, a pot and a board of vegetables on top. */
  campkitchen(K, s, W, D, L) {
    const { rbox, cyl, ball, lathe, torus } = L, steel = K.metal(K.pal.m), wood = K.wood(), ty = u(25);
    K.put(rbox(u(60), u(3), 0.62, 0.01), wood, 0, u(23.5), 0);
    for (const z of [-0.26, 0.26]) for (const [a, c] of [[6, 26], [38, 58]]) { rod(K, L, steel, [X(a, W), u(0.9), z], [X(c, W), u(22), z], u(0.9)); rod(K, L, steel, [X(c, W), u(0.9), z], [X(a, W), u(22), z], u(0.9)); }
    for (const px of [6, 26, 38, 58]) rod(K, L, steel, [X(px, W), u(0.8), -0.26], [X(px, W), u(0.8), 0.26], u(0.8));
    K.put(rbox(u(52), u(2), 0.5, 0.008), K.wood(L.tone(K.pal.w, 0.74)), 0, u(10), 0);
    K.put(rbox(u(10), u(9), 0.22, 0.02), K.gloss(K.pal.a), X(45, W), u(15.5), 0.05);
    K.put(cyl(u(1), u(3), u(1), 8).rotateX(Math.PI / 2), steel, X(44.5, W), u(14), 0.17);
    // the windscreen, its frame and rail, what hangs there
    const bz = -0.27;
    K.put(rbox(u(54), u(19), 0.02, 0.006), K.cloth(K.pal.c), 0, ty + u(10.5), bz);
    rod(K, L, steel, [X(5, W), u(45), bz], [X(59, W), u(45), bz], u(1));
    for (const px of [6, 58]) rod(K, L, steel, [X(px, W), ty, bz], [X(px, W), u(45), bz], u(1));
    rod(K, L, K.metal(L.tone(K.pal.m, 1.2)), [X(8, W), u(42.5), bz + 0.04], [X(56, W), u(42.5), bz + 0.04], u(0.5));
    const hz = bz + 0.05;
    rod(K, L, steel, [X(14, W), u(42), hz], [X(14, W), u(32), hz], u(0.5));
    K.put(new L.THREE.SphereGeometry(u(2.4), 10, 4, 0, TAU, Math.PI / 2, Math.PI / 2), steel, X(14, W), u(32), hz);
    rod(K, L, K.wood(L.tone(K.pal.w, 0.74)), [X(22, W), u(42), hz], [X(22, W), u(33), hz], u(0.7));
    K.put(rbox(u(4), u(5), 0.01, 0.003), K.wood(L.tone(K.pal.w, 0.74)), X(22, W), u(31.5), hz);
    rod(K, L, steel, [X(48, W), u(42), hz], [X(48, W), u(37), hz], 0.004);
    K.put(rbox(u(6), u(5), 0.02, 0.006), K.cloth(K.pal.p), X(48, W), u(34.5), hz);
    // the kettle, the pot, the board
    const kx = X(14, W), kz = -0.05, ket = K.gloss(K.pal.c);
    K.put(lathe([[0, 0], [u(6), 0], [u(6.2), u(2)], [u(5), u(6.5)], [u(2.4), u(9)], [0, u(9)]], 16), ket, kx, ty, kz);
    K.put(cyl(u(1.5), u(2), u(1.5), 8), K.gloss(INK), kx, ty + u(10), kz);
    rod(K, L, ket, [kx + u(5.5), ty + u(3.5), kz], [kx + u(10), ty + u(8), kz], u(1));
    K.put(torus(u(4), u(0.6), Math.PI, 12), K.gloss(INK), kx, ty + u(8.5), kz, Math.PI / 2);
    const px = X(33, W), pz = -0.02;
    K.put(cyl(u(6), u(7), u(6), 16), steel, px, ty + u(3.5), pz);
    K.put(cyl(u(6.6), u(1.4), u(6.6), 16), K.metal(L.tone(K.pal.m, 1.2)), px, ty + u(7.6), pz);
    K.put(ball(u(1.2), 8, 6), K.gloss(INK), px, ty + u(9), pz);
    for (const sx of [-1, 1]) K.put(rbox(u(2), u(1), u(2.6), 0.003), steel, px + sx * u(7), ty + u(6), pz);
    K.put(rbox(u(14), u(2), 0.24, 0.006), K.wood(L.tone(K.pal.w, 1.2)), X(51, W), ty + u(1), 0.08);
    K.put(ball(u(1.8), 10, 8), K.gloss('#e85040'), X(48, W), ty + u(3.6), 0.08);
    K.put(ball(u(1.6), 10, 8).scale(1, 0.8, 1.6), K.gloss('#f0a030'), X(53, W), ty + u(3.3), 0.1);
  },

  /** A shepherd's-crook lantern post: a wooden post, an iron crook, a camp lantern hung from it, lit. */
  lanternpost(K, s, W, D, L) {
    const { rbox, cyl, lathe, torus } = L, iron = K.metal(K.pal.m), x0 = X(13, W), lx = X(24, W);
    K.put(rbox(u(10), u(4), u(10), 0.01), K.wood(L.tone(K.pal.w, 0.74)), x0, u(2), 0);
    K.put(rbox(u(4), u(72), u(4), 0.01), K.wood(), x0, u(40), 0);
    K.put(tube(L, [[x0, u(76), 0], [x0, u(80), 0], [X(17, W), u(83), 0], [X(22, W), u(82), 0], [lx, u(78), 0], [lx, u(73), 0]], u(0.9), 20), iron);
    K.put(torus(u(2.5), u(0.4), Math.PI, 10), iron, lx, u(66), 0);
    K.put(lathe([[u(5), 0], [u(5), u(1)], [u(2), u(3)], [0, u(3)]], 12), iron, lx, u(63), 0);
    K.put(cyl(u(4), u(11), u(4), 12), K.glow(K.pal.g), lx, u(57.5), 0);
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + Math.PI / 4; K.put(cyl(u(0.6), u(11), u(0.6), 6), iron, lx + Math.sin(a) * u(4.4), u(57.5), Math.cos(a) * u(4.4)); }
    K.put(lathe([[0, 0], [u(4.6), 0], [u(5), u(2)], [u(4.2), u(3)], [0, u(3)]], 12), iron, lx, u(49), 0);
  },

  /** A folding camp chair: an aluminium frame of crossed legs, a slung seat and back in the theme's cloth, armrests, a
      cup holder. */
  campchair(K, s, W, D, L) {
    const { rbox, torus } = L, steel = K.metal(K.pal.m), cloth = K.cloth(K.pal.c), trim = K.cloth(K.pal.a), y = u(14), xs = u(10.5);
    for (const z of [-0.18, 0.18]) { rod(K, L, steel, [-xs, u(0.8), z], [xs, y, z], u(0.8)); rod(K, L, steel, [xs, u(0.8), z], [-xs, y, z], u(0.8)); }
    for (const sx of [-1, 1]) {
      rod(K, L, steel, [sx * xs, y, -0.2], [sx * xs, y, 0.2], u(0.8));
      rod(K, L, steel, [sx * xs, y, -0.18], [sx * u(10.5), u(36), -0.26], u(0.9));
      rod(K, L, steel, [sx * xs, y, 0.16], [sx * xs, u(21), 0.16], u(0.8));
      K.put(rbox(u(8), u(3), 0.38, 0.012), trim, sx * u(11), u(21.5), -0.02);
    }
    // the seat sags between the side rails, the back leans on its posts
    for (let i = 0; i < 6; i++) {
      const f0 = i / 6, f1 = (i + 1) / 6, at = (f) => [-xs + f * xs * 2, u(14.5) - u(2.5) * Math.sin(Math.PI * f)];
      const [ax, ay] = at(f0), [bx, by] = at(f1);
      K.put(rbox(Math.hypot(bx - ax, by - ay) + 0.01, u(3), 0.4, 0.004), cloth, (ax + bx) / 2, (ay + by) / 2, 0, 0, 0, Math.atan2(by - ay, bx - ax));
    }
    K.put(rbox(u(20), u(17), 0.02, 0.006), cloth, 0, u(25.5), -0.235, 0, -0.12);
    for (const yy of [34, 15.5]) K.put(rbox(u(20.4), u(2), 0.03, 0.006), trim, 0, u(yy), -0.235 - (u(yy) - u(25.5)) * Math.tan(0.12), 0, -0.12);
    K.put(torus(u(1.8), u(0.4), TAU, 12).rotateX(Math.PI / 2), steel, X(29, W), u(23), 0.1);
  },

  /** A two-burner camp stove on its folding stand: the case, its lid and wind flaps up, a flame on one burner and a
      pot on the other. */
  campstove(K, s, W, D, L) {
    const { rbox, cyl, torus, lathe } = L, steel = K.metal(K.pal.m), body = K.gloss(K.pal.c), dk = K.gloss(L.tone(K.pal.c, 0.74));
    for (const z of [-0.15, 0.15]) for (const sx of [-1, 1]) rod(K, L, steel, [sx * u(11), 0, z * 1.1], [sx * u(9), u(17), z], u(0.7));
    for (const z of [-0.15, 0.15]) rod(K, L, steel, [-u(10.5), u(8.5), z], [u(10.5), u(8.5), z], u(0.6));
    K.put(rbox(u(26), u(8), 0.42, 0.015), body, 0, u(21), 0);
    for (const px of [10, 22]) K.put(cyl(u(1.6), 0.03, u(1.6), 10).rotateX(Math.PI / 2), steel, X(px, W), u(21), 0.22);
    K.put(rbox(u(22), 0.02, 0.34, 0.004), K.plain(INK), 0, u(25) + 0.01, 0);
    K.put(rbox(u(24), u(17), 0.025, 0.008), dk, 0, u(33.5), -0.2, 0, -0.08);
    K.put(rbox(u(24.2), u(2), 0.03, 0.006), steel, 0, u(41), -0.2 - u(8) * Math.tan(0.08), 0, -0.08);
    for (const sx of [-1, 1]) K.put(rbox(0.025, u(11), 0.3, 0.006), dk, sx * u(14), u(30.5), -0.05);
    // the burners: a flame on the left, a pot on the right
    for (const px of [10, 22]) K.put(torus(u(3), u(0.5), TAU, 12).rotateX(Math.PI / 2), steel, X(px, W), u(25.5), 0);
    K.put(lathe([[0, 0], [u(2.6), u(1)], [u(2.2), u(3)], [0, u(6)]], 10), K.glow(FLAME), X(10, W), u(25), 0);
    K.put(lathe([[0, 0], [u(1.6), u(1)], [u(1.2), u(2)], [0, u(4)]], 8), K.glow(EMBER), X(10, W), u(25), 0.04);
    K.put(cyl(u(5), u(7), u(5), 14), steel, X(22, W), u(29.5), 0);
    K.put(cyl(u(6), u(1.5), u(6), 14), K.metal(L.tone(K.pal.m, 1.2)), X(22, W), u(33.2), 0);
    rod(K, L, K.gloss(INK), [X(27, W), u(31), 0], [X(30, W), u(31), 0], u(0.6));
  },

  /** A firewood rack: an iron frame stacked with split logs, their cut ends out, a little roof over them. */
  firewoodrack(K, s, W, D, L) {
    const { rbox, cyl, THREE } = L, iron = K.metal(K.pal.m), bark = K.wood(L.tone(K.pal.w, 0.74)), face = K.wood(L.tone(K.pal.w, 1.2)), heart = K.wood(), d = 0.66;
    for (const px of [4.5, 59.5]) for (const z of [-0.3, 0.3]) K.put(rbox(u(3), u(52), u(3), 0.006), iron, X(px, W), u(26), z);
    for (const y of [2.5, 51]) for (const z of [-0.3, 0.3]) K.put(rbox(u(58), u(y > 10 ? 2 : 3), u(2.4), 0.006), iron, 0, u(y), z);
    for (let row = 0; row < 5; row++) for (let i = 0; i < 6 - (row % 2); i++) {
      const x = X(11.5 + i * 8.2 + (row % 2) * 4.1, W), y = u(8.5 + row * 8.4), a = (i * 3 + row) * 0.7;
      K.put(cyl(u(4.4), d, u(4.4), 8).rotateY(a).rotateX(Math.PI / 2), bark, x, y, 0);
      for (const sz of [-1, 1]) {
        K.put(new THREE.CircleGeometry(u(3.4), 8).rotateY(sz < 0 ? Math.PI : 0), face, x, y, sz * d / 2);
        K.put(new THREE.CircleGeometry(u(1.4), 6).rotateY(sz < 0 ? Math.PI : 0), heart, x, y, sz * (d / 2 + 0.002));
      }
    }
    const run = W / 2, rise = u(11), len = Math.hypot(run, rise) - 0.02, tilt = Math.atan2(rise, run);
    for (const sx of [-1, 1]) K.put(rbox(len, u(2), 0.84, 0.008), K.wood(K.pal.c), sx * run / 2, u(51) + rise / 2, 0, 0, 0, -sx * tilt);
    K.put(cyl(u(1.4), 0.86, u(1.4), 8).rotateX(Math.PI / 2), K.wood(L.tone(K.pal.c, 0.74)), 0, u(62), 0);
  },

  /** A canoe resting on two sawhorses: its hull in the theme's colour, wooden gunwales, thwarts and a paddle inside. */
  canoestand(K, s, W, D, L) {
    const { rbox } = L, dark = K.wood(L.tone(K.pal.w, 0.74)), wood = K.wood();
    for (const px of [12, 52]) {
      const x = X(px, W);
      for (const z of [-0.26, 0.26]) for (const sx of [-1, 1]) rod(K, L, dark, [x + sx * u(6), u(1.2), z * 1.15], [x, u(15), z], u(1.2));
      K.put(rbox(u(4), u(3), 0.72, 0.01), dark, x, u(16.5), 0);
    }
    // the hull: a grid bent through the canoe's sheer and keel, inside and out
    const half = u(30), hw = (t) => 0.3 * Math.pow(Math.max(0, 1 - t * t), 0.55) + 0.006;
    const at = (t, a, k = 1, lift = 0) => { const top = u(CANOE.top(t)), keel = u(CANOE.keel(t)) + lift; return [t * half, top - (top - keel) * Math.cos(a), hw(t) * k * Math.sin(a)]; };
    K.put(grid(L, 24, 10, (a, b) => at(a * 2 - 1, (b - 0.5) * Math.PI)), K.gloss(K.pal.c));
    K.put(grid(L, 24, 8, (a, b) => at((a * 2 - 1) * 0.985, (b - 0.5) * Math.PI, 0.9, 0.025), -1), K.plain(L.tone(K.pal.c, 0.85)));
    for (const sz of [-1, 1]) { const pts = []; for (let i = 0; i <= 16; i++) pts.push(at(i / 8 - 1, sz * Math.PI / 2)); K.put(tube(L, pts, 0.02, 32), wood); }
    for (const t of [-0.45, 0, 0.45]) { const [x, y] = at(t, Math.PI / 2); K.put(rbox(t ? 0.12 : 0.06, 0.025, hw(t) * 1.9, 0.006), wood, x, y - (t ? 0.07 : 0.02), 0); }
    rod(K, L, wood, [-0.55, u(19), 0.04], [0.25, u(20), -0.03], 0.016);
    K.put(rbox(0.3, 0.02, 0.12, 0.01), wood, 0.4, u(20.2), -0.04, 0.09);
  },

  /** A hiking pack standing up, a bedroll strapped on top of it and a foam mat rolled up in front. */
  packbedroll(K, s, W, D, L) {
    const { blob, cyl, torus, rbox } = L, pack = K.cloth(K.pal.c), dk = K.cloth(L.tone(K.pal.c, 0.74)), strap = K.plain(L.tone(K.pal.m, 0.8));
    K.put(blob(u(16), u(37), 0.32, 0.3, 0.45), pack, 0, u(18.5), -0.06);
    K.put(blob(u(12), u(11), 0.1, 0.35, 0.5), dk, 0, u(16.5), 0.1);
    K.put(rbox(u(12), u(1.4), 0.012, 0.004), strap, 0, u(21.5), 0.15);
    for (const px of [11.7, 20.7]) K.put(rbox(u(1.4), u(16), 0.012, 0.004), strap, X(px, W), u(30), 0.1);
    K.put(blob(u(16.4), u(5), 0.34, 0.3, 0.45), dk, 0, u(37.5), -0.06);
    K.put(rbox(u(2), u(3), 0.02, 0.004), K.metal(BRASS), 0, u(35.5), 0.11);
    for (const sx of [-1, 1]) K.put(tube(L, [[sx * 0.1, u(36), -0.2], [sx * 0.12, u(24), -0.26], [sx * 0.1, u(8), -0.22]], 0.02, 10), strap);
    // the bedroll on top, the mat in front, each strapped
    K.put(cyl(u(4.5), u(26), u(4.5), 14).rotateZ(Math.PI / 2), K.cloth(K.pal.p), 0, u(42.5), -0.04);
    for (const px of [8.8, 22.8]) K.put(torus(u(4.6), u(0.7), TAU, 14).rotateY(Math.PI / 2), strap, X(px, W), u(42.5), -0.04);
    K.put(cyl(u(4), u(28), u(4), 14).rotateZ(Math.PI / 2), K.cloth(K.pal.a), 0, u(4.7), 0.27);
    for (const px of [9.7, 21.7]) K.put(torus(u(4.1), u(0.6), TAU, 14).rotateY(Math.PI / 2), K.plain(L.tone(K.pal.a, 0.74)), X(px, W), u(4.7), 0.27);
  },

  /** A rod rack: a wooden stand holding three fishing rods up, cork handles and reels at their feet, a tackle box in
      front. */
  rodrack(K, s, W, D, L) {
    const { rbox, cyl, torus } = L, wood = K.wood(), dark = K.wood(L.tone(K.pal.w, 0.74));
    for (const sx of [-1, 1]) K.put(rbox(u(3), u(56), 0.2, 0.008), wood, sx * u(11.5), u(28), -0.08);
    K.put(rbox(u(26), u(4), 0.2, 0.01), wood, 0, u(54), -0.08);
    K.put(rbox(u(26), u(6), 0.4, 0.012), dark, 0, u(3), -0.04);
    [[9, 0], [16, 1], [23, 2]].forEach(([px, i]) => {
      const x = X(px, W), h = u(82 - i * 3);
      K.put(cyl(0.005, h, u(0.8), 6), K.gloss(INK), x + u((i - 1) * 0.3), u(6) + h / 2, -0.08, 0, 0, -(i - 1) * 0.004);
      K.put(cyl(u(1.2), u(12), u(1.2), 8), K.plain('#b07a48'), x, u(12), -0.08);
      K.put(cyl(u(2.2), 0.04, u(2.2), 12).rotateX(Math.PI / 2), K.gloss(K.pal.c), x + u(2.4), u(16), -0.02);
      K.put(cyl(u(1), 0.05, u(1), 8).rotateX(Math.PI / 2), K.gloss(L.tone(K.pal.c, 0.74)), x + u(2.4), u(16), 0.0);
    });
    K.put(rbox(u(18), u(11), 0.24, 0.015), K.gloss(K.pal.a), 0, u(5.5), 0.26);
    K.put(rbox(u(18.2), u(1.2), 0.244, 0.004), K.gloss(L.tone(K.pal.a, 0.74)), 0, u(7.4), 0.26);
    K.put(rbox(u(2), u(2), 0.02, 0.004), K.metal(K.pal.m), 0, u(8), 0.385);
    K.put(torus(u(4), u(0.5), Math.PI, 10), K.metal(K.pal.m), 0, u(11), 0.26);
  },

  /** A camp signpost: a post with a pointed cap, three arrow boards pointing off to the camp, the lake and the trail,
      stones round its foot. */
  campsign(K, s, W, D, L) {
    const { rbox, THREE } = L, cols = [K.pal.c, K.pal.a, K.pal.p];
    K.put(rbox(u(6), u(80), u(6), 0.012), K.wood(), 0, u(40), 0);
    K.put(L.cyl(0.001, u(5), u(5), 4).rotateY(Math.PI / 4), K.wood(L.tone(K.pal.w, 0.74)), 0, u(82.5), 0);
    const words = K.pic(signWords(cols));
    [[8, 30, 66, 8, 1], [2, 24, 54, 8, -1], [8, 28, 43, 7, 1]].forEach(([x0, x1, y, h, dir], i) => {
      const a = X(x0, W), b = X(x1, W), y0 = u(y), y1 = u(y + h), mid = (y0 + y1) / 2, tip = u(4);
      const pts = dir > 0 ? [[a, y0], [b - tip, y0], [b, mid], [b - tip, y1], [a, y1]] : [[b, y0], [b, y1], [a + tip, y1], [a, mid], [a + tip, y0]];
      const z = 0.06 + i * 0.012;
      K.put(slabXY(L, pts, 0.04, 0.006), K.wood(cols[i]), 0, 0, z);
      // the word, cropped from its row of the one canvas
      const w = b - a - tip, plane = new THREE.PlaneGeometry(w * 0.92, (y1 - y0) * 0.8), uv = plane.attributes.uv;
      for (let k = 0; k < uv.count; k++) uv.setY(k, 1 - (i + 1 - uv.getY(k)) / 3);
      K.put(plane, words, dir > 0 ? a + w / 2 : b - w / 2, mid, z + 0.021);
    });
    for (const [px, rx, z] of [[9, 4, 0.08], [16, 4.4, -0.1], [23, 4, 0.06]]) rock(K, L, X(px, W), u(3), z, u(rx), u(3), u(3.4), px);
  },

  /** An outdoor movie screen: two poles with braces behind, a black-bordered screen, a scalloped valance on top. */
  moviescreen(K, s, W, D, L) {
    const { rbox, cyl, THREE } = L, pole = K.wood(), dark = K.wood(L.tone(K.pal.w, 0.74));
    for (const sx of [-1, 1]) {
      K.put(cyl(u(2), u(88), u(2.2), 10), pole, sx * u(28), u(44), 0);
      rod(K, L, dark, [sx * u(28), u(30), -0.02], [sx * u(20), 0, -0.36], u(1));
    }
    K.put(rbox(u(52), u(40), 0.05, 0.01), K.gloss(INK), 0, u(66), 0);
    K.put(rbox(u(48), u(36), 0.01, 0.002), K.plain(K.pal.p), 0, u(66), 0.03);
    K.put(cyl(u(1), u(56), u(1), 8).rotateZ(Math.PI / 2), dark, 0, u(87), -0.02);
    K.put(rbox(u(56), u(6), 0.08, 0.012), K.cloth(K.pal.c), 0, u(89), 0.01);
    for (let i = 0; i < 7; i++) K.put(new THREE.CircleGeometry(u(3.4), 8, Math.PI, Math.PI), K.cloth(K.pal.a), X(8 + i * 8, W), u(86), 0.052);
  },

  /** A bell tent: a round canvas wall and a sweeping roof up to its pole, the door's flaps tied back, guy ropes to
      pegs either side, a pennant on top. */
  belltent(K, s, W, D, L) {
    const { lathe, cyl, THREE } = L, canvas = K.cloth(K.pal.p), zf = 0.68, wall = u(42);
    const prof = [[wall, 0], [wall, u(21)], [u(46), u(21)], ...BELL.map(([r, y]) => [u(r), u(y)]), [0, u(87)]];
    K.put(lathe(prof, 40).scale(1, 1, zf), canvas, 0, 0, 0);
    K.put(cyl(wall + 0.006, u(4), wall + 0.006, 40, true).scale(1, 1, zf), K.cloth(L.tone(K.pal.p, 0.74)), 0, u(2), 0);
    K.put(cyl(u(46.2), u(3), u(46.4), 40, true).scale(1, 1, zf), K.cloth(K.pal.c), 0, u(22.5), 0);
    // the door: a dark patch on the canvas narrowing to its top, a flap tied back either side of it
    const rAt = (y) => { for (let i = 0; i < prof.length - 1; i++) { const [r0, y0] = prof[i], [r1, y1] = prof[i + 1]; if (y <= y1 && y1 > y0) return r0 + (r1 - r0) * (y - y0) / (y1 - y0); } return 0; };
    const onCanvas = (hw, y, out) => { const r = rAt(y) + out, a = Math.asin(Math.max(-1, Math.min(1, hw / r))); return [r * Math.sin(a), y, r * Math.cos(a) * zf]; };
    const doorW = (y) => u(12) * (1 - y / u(60));
    K.put(grid(L, 6, 12, (a, b) => onCanvas((a * 2 - 1) * doorW(b * u(60)), b * u(60), 0.008)), K.cloth(L.tone(K.pal.p, 0.32)));
    const flapW = (y) => y < u(54) ? u(17 - 12 * y / u(54)) : u(5) * (1 - (y - u(54)) / u(6));
    for (const sx of [-1, 1]) K.put(grid(L, 3, 12, (a, b) => { const y = b * u(60), f = sx > 0 ? a : 1 - a; return onCanvas(sx * (doorW(y) + (flapW(y) - doorW(y)) * f), y, 0.014); }), K.cloth(L.tone(K.pal.p, 0.82)));
    for (const sx of [-1, 1]) K.put(L.rbox(u(3), u(2), 0.03, 0.006), K.cloth(K.pal.c), ...onCanvas(sx * u(11.5), u(21), 0.03));
    // the pole and pennant, the guy ropes and pegs
    K.put(cyl(u(0.8), u(12), u(0.8), 8), K.metal(K.pal.m), 0, u(92), 0);
    K.put(slabXY(L, [[u(0.8), u(92)], [u(9), u(95)], [u(0.8), u(98)]], 0.012, 0.003), K.cloth(K.pal.c), 0, 0, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const a = Math.PI / 3, top = [sx * u(46) * Math.sin(a), u(22), sz * u(46) * Math.cos(a) * zf], peg = [sx * (W / 2 - 0.03), 0.02, sz * 0.62];
      rod(K, L, K.plain(ROPE), top, peg, 0.005);
      K.put(cyl(0.012, 0.06, 0.006, 6), K.metal(K.pal.m), peg[0], 0.03, peg[2]);
    }
  },
};
