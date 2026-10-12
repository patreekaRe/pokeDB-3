/* base-models-c.js  -  Pokémon Center, Gym and Beach pieces, modelled from parts like the arcade cabinets (the user's ask, 2026-10-12).
   js/base-models-f.js's head says how a batch works. Most builders here follow their painting (js/base-furniture-rooms.js)
   pixel for pixel: `u(n)` is n of its 32 pixels a tile, `X(n, W)` a pixel across the painting as x from the middle. */

import { pokeBall, rod, tube } from './base-models-kit.js';

const u = (n) => n / 32;
const X = (n, W = 1) => n / 32 - W / 2;
const SAND = '#e8d090';

const sheet = (w, h, draw) => { const c = new OffscreenCanvas(w, h); draw(c.getContext('2d'), w, h); return c; };
const pics = {};
const once = (key, make) => pics[key] || (pics[key] = make());

/* the gym flag's cloth: the theme's colour in folds, a star in its accent */
const flagCloth = (col, star) => once('flag' + col + star, () => sheet(192, 176, (g, w, h) => {
  g.fillStyle = col; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = 24; x < w; x += 48) g.fillRect(x, 0, 24, h);
  g.fillStyle = star; g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 4;
  g.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 26 : 62; g.lineTo(w / 2 + Math.cos(a) * r, h / 2 + 4 + Math.sin(a) * r); }
  g.closePath(); g.fill(); g.stroke();
}));

/* the trade machine's screen: two Poké Balls swapping over an arrow */
const tradeScreen = () => once('trade', () => sheet(96, 72, (g, w, h) => {
  g.fillStyle = '#103a48'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#68e8f8'; g.fillRect(14, 30, 68, 6); g.beginPath(); g.moveTo(82, 22); g.lineTo(94, 33); g.lineTo(82, 44); g.fill();
  g.fillStyle = '#d8faff'; g.fillRect(14, 44, 68, 4);
  for (const x of [22, 70]) { g.fillStyle = '#e04848'; g.beginPath(); g.arc(x, 18, 9, Math.PI, 0); g.fill(); g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x, 18, 9, 0, Math.PI); g.fill(); }
}));

/* the treadmill's console: a speed readout */
const speedScreen = () => once('speed', () => sheet(96, 40, (g, w, h) => {
  g.fillStyle = '#16202a'; g.fillRect(0, 0, w, h);
  g.font = 'bold 26px monospace'; g.textBaseline = 'middle'; g.fillStyle = '#68e868'; g.fillText('8.5', 8, h / 2 + 2);
  g.fillStyle = '#f8a030'; for (let i = 0; i < 4; i++) g.fillRect(64 + i * 7, 28 - i * 5, 5, 6 + i * 5);
}));

/** A glass dome on a base: a capsule r across, from y0 up h, its top a half sphere. */
const dome = (L, r, h) => {
  const pts = [[r, 0]];
  for (let i = 0; i <= 10; i++) { const a = i / 10 * Math.PI / 2; pts.push([Math.cos(a) * r, h - r + Math.sin(a) * r]); }
  return L.lathe(pts, 32);
};

/** A seat and back on a platform at height y, `w` across: the lifeguard's and the referee's. */
function highSeat(K, L, y, w, back, cushion, d = 0.62) {
  const { rbox, blob } = L;
  K.put(rbox(w, 0.08, d, 0.02), back, 0, y + 0.04, 0);
  K.put(rbox(w, 0.62, 0.08, 0.025), back, 0, y + 0.38, -d / 2 + 0.06);
  for (const sg of [-1, 1]) K.put(rbox(0.06, 0.2, d - 0.1, 0.02), back, sg * (w / 2 - 0.03), y + 0.2, 0.02);
  if (cushion) K.put(blob(w - 0.16, 0.08, d - 0.2, 0.4, 0.5), cushion, 0, y + 0.11, 0.04);
}

export const SHAPES = {
  // boxes, the painting on the front only (js/base-models-kit.js)
  'potionshelf ballshelf berryshelf medicineshelf trophyshelf': { make: 'frontbox', d: 0.42 },
  'register': { make: 'frontbox', d: 0.5, top: 0.32 },
  'tmcase': { make: 'frontbox', d: 0.5 },
  'healpod': { make: 'frontbox', d: 0.55 },
  'cooler': { make: 'frontbox', d: 0.5, top: 0.15 },
  // built from parts
  trademachine: { make: 'trademachine' },
  incubator: { make: 'incubator' },
  nursecart: { make: 'nursecart' },
  candyjar: { make: 'candyjar' },
  eggbasket: { make: 'eggbasket' },
  scale: { make: 'centerscale' },
  dummy: { make: 'dummy' },
  punchbag: { make: 'punchbag' },
  dumbbells: { make: 'dumbbells' },
  weightbench: { make: 'weightbench', seat: 0.62 },
  treadmill: { make: 'treadmill' },
  exbike: { make: 'exbike' },
  kettlebells: { make: 'kettlebells' },
  gymflag: { make: 'gymflag' },
  cones: { make: 'cones' },
  beam: { make: 'beam' },
  tires: { make: 'tires' },
  plyobox: { make: 'plyobox' },
  bleachers: { make: 'bleachers', seat: 1.0 },
  hurdle: { make: 'hurdle' },
  pullupbar: { make: 'pullupbar' },
  refstand: { make: 'refstand', seat: 1.78 },
  beachumbrella: { make: 'beachumbrella' },
  sandcastle: { make: 'sandcastle' },
  surfboard: { make: 'surfboard' },
  swimring: { make: 'swimring' },
  tikitorch: { make: 'tikitorch' },
  lifeguard: { make: 'lifeguard', seat: 2.05 },
  seashells: { make: 'seashells' },
  bottlemsg: { make: 'bottlemsg' },
  sandbucket: { make: 'sandbucket' },
  beachhut: { make: 'beachhut' },
  driftwood: { make: 'driftwood' },
  laprasfloat: { make: 'laprasfloat' },
};

export const MAKES = {
  /* ----- Pokémon Center ----- */

  trademachine(K, s, W, D, L) {
    const { rbox, cyl } = L, metal = K.gloss(K.pal.m), col = K.gloss(K.pal.c);
    // two glass pods on metal bases, each with a Poké Ball floating in its glow
    for (const sx of [-1, 1]) {
      const x = sx * 0.62;
      K.put(cyl(0.32, 0.36, 0.34, 32), metal, x, 0.18, 0);
      K.put(cyl(0.325, 0.06, 0.325, 32), col, x, 0.3, 0);
      K.put(cyl(0.27, 0.02, 0.27, 32), K.glow('#68e8f8'), x, 0.37, 0);
      const glass = dome(L, 0.28, 0.95);
      glass.translate(0, 0.36, 0);
      K.put(glass, K.M('glass', '#a8eef8', { key: 'pod' }), x, 0, 0);
      K.put(L.torus(0.28, 0.02, Math.PI * 2, 32), metal, x, 0.37, 0, 0, Math.PI / 2);
      pokeBall(K, L, x, 0.72, 0, 0.12);
    }
    // the console between them, its screen lit, a green button; the cable looping along the floor
    K.put(rbox(0.4, 0.58, 0.36, 0.04), K.gloss(K.pal.p), 0, 0.37 + 0.2, -0.02);
    K.put(rbox(0.42, 0.06, 0.38, 0.02), metal, 0, 0.06, -0.02);
    K.put(new L.THREE.PlaneGeometry(0.28, 0.2), L.litPic(tradeScreen(), 0.7), 0, 0.76, 0.162);
    K.put(L.ball(0.035, 12, 10), K.glow('#68e868'), 0, 0.5, 0.16);
    const cab = [];
    for (let i = 0; i <= 12; i++) { const t = i / 12; cab.push([-0.42 + t * 0.84, 0.05 + Math.sin(t * Math.PI * 3) * 0.02, 0.26 + Math.sin(t * Math.PI * 2) * 0.05]); }
    K.put(tube(L, cab, 0.022), K.gloss(K.pal.a));
  },

  incubator(K, s, W, D, L) {
    const { rbox, ball } = L, metal = K.gloss(K.pal.m);
    // the base, a coloured band, a green light and a readout
    K.put(rbox(0.82, 0.44, 0.72, 0.05), metal, 0, 0.22, 0);
    K.put(rbox(0.83, 0.06, 0.73, 0.02), K.gloss(K.pal.c), 0, 0.36, 0);
    K.put(ball(0.04, 12, 10), K.glow('#68e868'), X(8), 0.19, 0.36);
    K.put(rbox(0.38, 0.1, 0.02, 0.01), K.plain('#3a4a5a'), X(19), 0.19, 0.36);
    K.put(rbox(0.18, 0.03, 0.01, 0.004), K.glow('#f8a030'), X(17), 0.19, 0.372);
    // the warm-lit dome, an egg with green spots inside
    K.put(L.cyl(0.33, 0.02, 0.33, 32), K.glow('#f8d8a0'), 0, 0.45, 0);
    const glass = dome(L, 0.34, 0.68);
    glass.translate(0, 0.44, 0);
    K.put(glass, K.M('glass', '#fff4d8', { key: 'incu' }), 0, 0, 0);
    const egg = ball(1, 24, 18).scale(0.17, 0.22, 0.17);
    K.put(egg, K.gloss('#f8f0e0'), 0, 0.68, 0);
    for (const [a, h] of [[0.3, 0.74], [-0.7, 0.62], [1.4, 0.7], [2.6, 0.64], [3.6, 0.78], [4.6, 0.6]]) {
      const yy = (h - 0.68) / 0.22, rr = Math.sqrt(Math.max(0, 1 - yy * yy));
      K.put(ball(0.035, 10, 8).scale(1, 1, 0.5).rotateY(a), K.gloss('#68b868'), Math.sin(a) * 0.168 * rr, h, Math.cos(a) * 0.168 * rr);
    }
  },

  nursecart(K, s, W, D, L) {
    const { rbox, cyl } = L, body = K.gloss(K.pal.p), col = K.gloss(K.pal.c), metal = K.metal(K.pal.m);
    // four castors under a drawer cabinet
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      K.put(cyl(0.06, 0.045, 0.06, 16).rotateZ(Math.PI / 2), K.gloss('#303038'), sx * 0.3, 0.06, sz * 0.22);
      K.put(rbox(0.04, 0.08, 0.04, 0.01), metal, sx * 0.3, 0.14, sz * 0.22);
    }
    K.put(rbox(0.86, 0.76, 0.6, 0.04), body, 0, 0.18 + 0.38, 0);
    for (const j of [27, 19, 11]) {
      K.put(rbox(0.8, 0.22, 0.02, 0.02), K.gloss(L.tone(K.pal.p, 0.96)), 0, u(j) + 0.02, 0.305);
      K.put(rbox(0.14, 0.05, 0.04, 0.015), col, 0, u(j) + 0.02, 0.32);
    }
    K.put(rbox(0.94, 0.08, 0.66, 0.025), col, 0, 0.98, 0);
    // a pole at the back with a hook; two purple potions and a Poké Ball on top
    K.put(cyl(0.025, 0.42, 0.025, 12), metal, X(29), 1.02 + 0.21, -0.22);
    K.put(rbox(0.22, 0.04, 0.04, 0.012), metal, X(27), 1.42, -0.22);
    for (const [i, z] of [[6, 0.08], [12, -0.06]]) {
      K.put(L.lathe([[0.055, 0], [0.06, 0.02], [0.06, 0.18], [0.03, 0.22], [0.025, 0.26], [0, 0.26]], 16), K.gloss('#a868d8'), X(i), 1.02, z);
      K.put(cyl(0.03, 0.04, 0.03, 12), K.gloss('#ffffff'), X(i), 1.02 + 0.27, z);
    }
    pokeBall(K, L, X(20), 1.02 + 0.1, 0.08, 0.1);
  },

  candyjar(K, s, W, D, L) {
    const { cyl, lathe, ball } = L;
    // a wooden foot, a glass jar of Rare Candy, its lid and knob
    K.put(cyl(0.33, 0.12, 0.34, 28), K.wood(), 0, 0.06, 0);
    K.put(lathe([[0.27, 0], [0.31, 0.04], [0.31, 0.74], [0.27, 0.8], [0.24, 0.82]], 32), K.M('glass', '#e0f0f8', { key: 'jar' }), 0, 0.12, 0);
    const cols = ['#4a78d8', '#f0c8e8', '#68b8f0', '#ffffff'], R = K.r;
    for (let n = 0; n < 34; n++) {
      const a = n * 2.4, rr = 0.06 + (n % 5) * 0.045, y = 0.18 + Math.floor(n / 5) * 0.075;
      K.put(ball(1, 12, 8).scale(0.06, 0.04, 0.04).rotateY(a * 1.7).rotateZ(R() - 0.5), K.gloss(cols[n % 4]), Math.cos(a) * rr, y, Math.sin(a) * rr);
    }
    K.put(cyl(0.27, 0.08, 0.27, 28), K.gloss(K.pal.a), 0, 0.98, 0);
    K.put(cyl(0.24, 0.1, 0.25, 28), K.gloss(K.pal.c), 0, 1.07, 0);
    K.put(ball(0.07, 16, 12), K.gloss(K.pal.a), 0, 1.16, 0);
  },

  eggbasket(K, s, W, D, L) {
    const { lathe, ball, torus } = L, wicker = K.wood(), dark = K.wood(L.tone(K.pal.w, 0.82));
    // a wicker bowl, its rim rolled, a handle over it
    K.put(lathe([[0.27, 0], [0.33, 0.12], [0.4, 0.36], [0.37, 0.37], [0.3, 0.13], [0.24, 0.03], [0, 0.03]], 32), wicker, 0, 0, 0);
    for (let i = 0; i < 3; i++) K.put(torus(0.31 + i * 0.03, 0.012, Math.PI * 2, 32), dark, 0, 0.09 + i * 0.1, 0, 0, Math.PI / 2);
    K.put(torus(0.4, 0.03, Math.PI * 2, 36), wicker, 0, 0.37, 0, 0, Math.PI / 2);
    K.put(torus(0.37, 0.028, Math.PI, 28), wicker, 0, 0.37, 0);
    // three eggs in it, each with its spots
    for (const [x, y, z, c, sp] of [[-0.17, 0.34, 0.06, '#f8f0d8', '#68b868'], [0.17, 0.33, 0.04, '#f8e0f0', '#e868a8'], [0, 0.42, -0.1, '#e0f0f8', '#4a88d8']]) {
      K.put(ball(1, 20, 14).scale(0.14, 0.18, 0.14), K.gloss(c), x, y, z);
      for (const [a, h] of [[0.4, 0.06], [-0.8, -0.03], [1.8, 0.02]]) K.put(ball(0.03, 10, 8).scale(1, 1, 0.5).rotateY(a), K.gloss(sp), x + Math.sin(a) * 0.135, y + h, z + Math.cos(a) * 0.135);
    }
  },

  centerscale(K, s, W, D, L) {
    const { rbox, cyl, torus } = L, metal = K.metal(K.pal.m);
    // the weighing plate on its base, a column up to the dial
    K.put(rbox(0.94, 0.12, 0.8, 0.03), K.gloss(K.pal.m), 0, 0.06, 0);
    K.put(rbox(0.82, 0.05, 0.68, 0.02), K.gloss(K.pal.p), 0, 0.14, 0.02);
    K.put(cyl(0.065, 1.2, 0.07, 18), metal, X(16), 0.15 + 0.6, -0.28);
    // the dial: a drum, a white face with ticks, a needle in the theme's colour
    const y = u(48), z = -0.28;
    K.put(cyl(0.29, 0.12, 0.29, 36).rotateX(Math.PI / 2), K.gloss(L.tone(K.pal.m, 0.8)), 0, y, z);
    K.put(torus(0.28, 0.025, Math.PI * 2, 36), metal, 0, y, z + 0.06);
    K.put(new L.THREE.CircleGeometry(0.255, 36), K.gloss('#ffffff'), 0, y, z + 0.062);
    for (let h = 0; h < 12; h++) { const a = h * Math.PI / 6; K.put(rbox(0.016, h % 3 ? 0.03 : 0.05, 0.006, 0.002), K.plain('#303038'), Math.sin(a) * 0.21, y + Math.cos(a) * 0.21, z + 0.066, 0, 0, -a); }
    K.put(rbox(0.018, 0.2, 0.008, 0.004).translate(0, 0.09, 0), K.gloss(K.pal.c), 0, y, z + 0.07, 0, 0, -0.7);
    K.put(cyl(0.025, 0.02, 0.025, 12).rotateX(Math.PI / 2), K.gloss(K.pal.c), 0, y, z + 0.075);
  },

  /* ----- Gym ----- */

  dummy(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, wood = K.wood(), straw = K.cloth('#e8c860');
    // a post on its foot, a crossbar for arms
    K.put(rbox(0.5, 0.16, 0.5, 0.03), wood, 0, 0.08, 0);
    K.put(cyl(0.065, 1.9, 0.07, 14), wood, 0, 0.16 + 0.95, 0);
    K.put(rbox(0.76, 0.1, 0.1, 0.03), wood, 0, u(48), 0);
    for (const sg of [-1, 1]) K.put(cyl(0.07, 0.16, 0.07, 14).rotateZ(Math.PI / 2), straw, sg * 0.4, u(48), 0);
    // the straw body, bound with rope, a target on its chest; a straw head with a headband
    K.put(L.lathe([[0.26, 0], [0.29, 0.1], [0.29, 0.9], [0.24, 1.0], [0, 1.0]], 28), straw, 0, u(14), 0);
    for (const j of [42, 30, 18]) K.put(cyl(0.3, 0.06, 0.3, 28), K.cloth(K.pal.m), 0, u(j), 0);
    const tz = 0.29;
    for (const [r, c] of [[0.22, K.pal.c], [0.16, '#ffffff'], [0.1, K.pal.c], [0.04, '#ffffff']]) K.put(new L.THREE.CircleGeometry(r, 32), K.gloss(c), 0, u(34), tz + (0.25 - r) * 0.02);
    K.put(ball(0.22, 22, 16), straw, 0, u(56), 0);
    K.put(cyl(0.225, 0.07, 0.225, 28), K.cloth(K.pal.c), 0, u(57.5), 0);
    for (const sg of [-1, 1]) K.put(ball(0.025, 10, 8), K.gloss('#5a3a22'), sg * 0.09, u(54), 0.2);
  },

  punchbag(K, s, W, D, L) {
    const { rbox, cyl } = L, metal = K.metal(K.pal.m), bag = K.gloss(K.pal.c);
    // the stand: a weighted foot, a post, an arm out over the bag, a chain
    K.put(rbox(0.36, 0.1, 0.6, 0.03), K.gloss(L.tone(K.pal.m, 0.7)), X(5), 0.05, 0);
    K.put(rbox(0.09, 2.5, 0.09, 0.02), metal, X(4), 1.3, -0.1);
    K.put(rbox(0.6, 0.09, 0.09, 0.02), metal, X(4) + 0.28, u(81), -0.1);
    for (let j = 0; j < 4; j++) K.put(L.torus(0.022, 0.008, Math.PI * 2, 10), metal, X(17.5), u(79) - j * 0.06, -0.1, j % 2 ? Math.PI / 2 : 0);
    // the bag, rounded top and bottom, two bands
    K.put(L.lathe([[0.001, 0], [0.16, 0.02], [0.23, 0.1], [0.24, 0.2], [0.24, 1.18], [0.22, 1.3], [0.12, 1.37], [0.001, 1.38]], 32), bag, X(17.5), u(26), -0.1);
    for (const j of [62, 34]) K.put(cyl(0.245, 0.09, 0.245, 32), K.gloss(K.pal.a), X(17.5), u(j) - 0.04, -0.1);
  },

  dumbbells(K, s, W, D, L) {
    const { rbox, cyl } = L, metal = K.metal(K.pal.m), frame = K.gloss(K.pal.m);
    // the rack: two side frames, three sloping shelves
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) K.put(rbox(0.07, 1.08, 0.07, 0.02), frame, sx * 0.4, 0.54, sz * 0.2);
      K.put(rbox(0.08, 0.06, 0.6, 0.02), frame, sx * 0.4, 0.03, 0);
    }
    for (let r = 0; r < 3; r++) {
      const y = u(30 - r * 10) - 0.18 + r * 0.02, z = 0.08 - r * 0.08;
      for (const sz of [-1, 1]) K.put(rbox(0.86, 0.04, 0.04, 0.012), frame, 0, y + (sz < 0 ? 0.03 : 0), z + sz * 0.11);
      // a pair of dumbbells on each, heavier lower down
      const pr = 0.06 + (2 - r) * 0.018;
      for (const x of [-0.19, 0.19]) {
        K.put(cyl(0.022, 0.28, 0.022, 12).rotateZ(Math.PI / 2), metal, x, y + pr + 0.02, z);
        for (const sg of [-1, 1]) {
          K.put(cyl(pr, 0.05, pr, 8).rotateZ(Math.PI / 2), K.gloss(K.pal.c), x + sg * 0.11, y + pr + 0.02, z);
          K.put(cyl(pr * 0.8, 0.03, pr * 0.8, 8).rotateZ(Math.PI / 2), K.gloss(L.tone(K.pal.c, 0.8)), x + sg * 0.15, y + pr + 0.02, z);
        }
      }
    }
  },

  weightbench(K, s, W, D, L) {
    const { rbox, cyl, blob } = L, metal = K.metal(K.pal.m), plate = K.gloss('#303038');
    // the padded bench on two legs
    for (const x of [-0.55, 0.55]) {
      K.put(rbox(0.08, 0.46, 0.08, 0.02), metal, x, 0.27, 0.08);
      K.put(rbox(0.1, 0.05, 0.44, 0.02), metal, x, 0.025, 0.08);
    }
    K.put(rbox(1.5, 0.06, 0.34, 0.02), metal, 0, 0.5, 0.08);
    K.put(blob(1.66, 0.16, 0.38, 0.35, 0.4), K.cloth(K.pal.c), 0, 0.6, 0.08);
    // two uprights at the back, the barbell racked across them, plates on its ends
    for (const sx of [-1, 1]) {
      K.put(cyl(0.045, 1.5, 0.045, 14), metal, sx * (1 - u(3.5)), 0.75, -0.24);
      K.put(rbox(0.12, 0.05, 0.4, 0.02), metal, sx * (1 - u(3.5)), 0.025, -0.24);
      K.put(rbox(0.08, 0.06, 0.12, 0.015), metal, sx * (1 - u(3.5)), 1.36, -0.2);
    }
    K.put(cyl(0.025, 2.2, 0.025, 12).rotateZ(Math.PI / 2), K.metal('#d8dce4'), 0, 1.42, -0.18);
    for (const sx of [-1, 1]) for (const [dx, r] of [[0.0, 0.28], [0.08, 0.22]]) {
      K.put(cyl(r, 0.06, r, 28).rotateZ(Math.PI / 2), plate, sx * (0.92 + dx), 1.42, -0.18);
      K.put(cyl(0.05, 0.065, 0.05, 14).rotateZ(Math.PI / 2), K.metal('#8a8e9a'), sx * (0.92 + dx), 1.42, -0.18);
    }
  },

  treadmill(K, s, W, D, L) {
    const { rbox, cyl } = L, metal = K.metal(K.pal.m), body = K.gloss(K.pal.m), belt = K.plain('#303038');
    // the deck, its belt, rollers at each end
    K.put(rbox(1.86, 0.24, 0.72, 0.05), body, -0.02, 0.14, 0);
    K.put(rbox(1.62, 0.05, 0.56, 0.02), belt, -0.12, 0.28, 0);
    for (let i = 0; i < 18; i++) K.put(rbox(0.012, 0.004, 0.54, 0.001), K.plain('#4a4a58'), -0.9 + i * 0.09, 0.307, 0);
    for (const x of [-0.94, 0.7]) K.put(cyl(0.08, 0.6, 0.08, 16).rotateX(Math.PI / 2), K.gloss(L.tone(K.pal.m, 0.7)), x, 0.18, 0);
    // two uprights at the front end, handrails back along both sides, the console between them
    for (const sz of [-1, 1]) {
      rod(K, L, metal, [0.78, 0.25, sz * 0.32], [0.62, 1.55, sz * 0.3], 0.045);
      K.put(cyl(0.03, 0.6, 0.03, 12).rotateZ(Math.PI / 2), metal, 0.38, 1.24, sz * 0.31);
      K.put(cyl(0.04, 0.2, 0.04, 12).rotateZ(Math.PI / 2), K.gloss('#303038'), 0.2, 1.24, sz * 0.31);
    }
    K.put(rbox(0.3, 0.38, 0.74, 0.04).rotateZ(0.5), K.gloss(K.pal.c), 0.56, 1.66, 0);
    K.put(new L.THREE.PlaneGeometry(0.46, 0.2).rotateY(-Math.PI / 2).rotateZ(0.5), L.litPic(speedScreen(), 0.7), 0.47, 1.62, 0);
    K.put(L.ball(0.03, 10, 8), K.glow(K.pal.a), 0.44, 1.52, 0.27);
  },

  exbike(K, s, W, D, L) {
    const { rbox, cyl, blob, torus } = L, metal = K.metal(K.pal.m), frame = K.gloss(K.pal.c), dark = K.gloss('#303038');
    // two floor bars, the frame from the seat down to the flywheel's hub, the post up to the bars
    for (const x of [X(5), X(26)]) K.put(rbox(0.12, 0.08, 0.6, 0.03), metal, x, 0.04, 0);
    K.put(rbox(0.86, 0.06, 0.1, 0.02), metal, 0, 0.08, 0);
    rod(K, L, frame, [X(9), u(34), 0], [X(17), u(4), 0], 0.05);
    rod(K, L, frame, [X(17), u(5), 0], [X(22), u(16), 0], 0.045);
    rod(K, L, frame, [X(25), u(46), 0], [X(28), u(4), 0], 0.05);
    // the flywheel and its hub, pedals on cranks
    K.put(cyl(0.28, 0.08, 0.28, 32).rotateX(Math.PI / 2), K.gloss(K.pal.m), X(22), u(16), 0);
    K.put(torus(0.25, 0.03, Math.PI * 2, 32), dark, X(22), u(16), 0.05);
    K.put(cyl(0.06, 0.1, 0.06, 16).rotateX(Math.PI / 2), K.gloss(K.pal.a), X(22), u(16), 0);
    for (const sz of [-1, 1]) {
      K.put(rbox(0.04, 0.2, 0.03, 0.01), metal, X(17), u(16) - sz * 0.07, sz * 0.09);
      K.put(rbox(0.14, 0.03, 0.08, 0.01), dark, X(17), u(16) - sz * 0.15, sz * 0.14);
    }
    // the saddle and the handlebar with its little screen
    K.put(rbox(0.04, 0.16, 0.04, 0.01), metal, X(9), u(34) + 0.06, 0);
    K.put(blob(0.36, 0.1, 0.22, 0.4, 0.5), dark, X(9), u(37), 0);
    K.put(cyl(0.025, 0.4, 0.025, 12).rotateX(Math.PI / 2), dark, X(26.5), u(47), 0);
    for (const sz of [-1, 1]) K.put(cyl(0.03, 0.12, 0.03, 12).rotateZ(Math.PI / 2), dark, X(26.5) + 0.04, u(47), sz * 0.2);
    K.put(rbox(0.16, 0.12, 0.05, 0.015).rotateZ(-0.4), K.gloss('#3a4a5a'), X(27.5), u(43), 0);
    K.put(new L.THREE.PlaneGeometry(0.1, 0.06).rotateY(Math.PI / 2).rotateZ(-0.4), K.glow('#68e868'), X(27.5) - 0.085, u(43), 0);
  },

  kettlebells(K, s, W, D, L) {
    const { ball, torus } = L;
    // three kettlebells, small to big, each a ball on a flat foot with a handle
    for (const [cx, r, c, z] of [[8, 6, K.pal.m, -0.12], [22, 8, K.pal.c, 0.02], [15, 4, K.pal.a, 0.22]]) {
      const R = u(r), m = K.gloss(c);
      const body = ball(R, 24, 18);
      body.scale(1, 0.92, 1);
      K.put(body, m, X(cx), R * 0.85, z);
      K.put(L.cyl(R * 0.6, 0.02, R * 0.6, 20), m, X(cx), 0.01, z);
      K.put(torus(R * 0.62, R * 0.15, Math.PI, 20), m, X(cx), R * 1.55, z, 0.4);
      for (const sg of [-1, 1]) K.put(L.cyl(R * 0.15, R * 0.3, R * 0.15, 10), m, X(cx) + sg * R * 0.62 * Math.cos(0.4), R * 1.45, z - sg * R * 0.62 * Math.sin(0.4));
    }
  },

  gymflag(K, s, W, D, L) {
    const { THREE, rbox, cyl, ball } = L, metal = K.metal(K.pal.m);
    // a weighted foot, the pole, a gold finial
    K.put(rbox(0.44, 0.14, 0.44, 0.03), K.gloss(K.pal.m), X(16), 0.07, 0);
    K.put(cyl(0.045, 2.55, 0.05, 14), metal, X(5.5), 0.1 + 1.27, 0);
    K.put(rbox(0.36, 0.05, 0.05, 0.01), metal, X(5.5) + 0.15, 0.13, 0);
    K.put(ball(0.07, 16, 12), K.metal(K.pal.a), X(5.5), u(88), 0);
    // the cloth, rippling out from the pole, the star on both faces
    const fw = u(24), fh = u(22), geo = new THREE.PlaneGeometry(fw, fh, 24, 4), pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) { const t = (pos.getX(i) + fw / 2) / fw; pos.setZ(i, Math.sin(t * Math.PI * 2.2) * 0.06 * t); }
    geo.computeVertexNormals();
    const cloth = flagCloth(K.pal.c, K.pal.a), at = [X(5.5) + 0.04 + fw / 2, u(71), 0];
    const back = geo.clone().rotateY(Math.PI).translate(0, 0, -0.004);
    K.put(geo, K.pic(cloth), ...at);
    K.put(back, K.pic(cloth), ...at);
  },

  cones(K, s, W, D, L) {
    const { rbox, lathe } = L, col = K.gloss(K.pal.c), white = K.gloss('#ffffff');
    // three training cones on square feet, a white band round each
    for (const [cx, hh, z] of [[8, 14, 0.12], [24, 14, 0.06], [16, 20, -0.16]]) {
      const H = u(hh), x = X(cx);
      K.put(rbox(0.4, 0.04, 0.4, 0.015), K.gloss(L.tone(K.pal.c, 0.8)), x, 0.02, z);
      K.put(lathe([[0.16, 0], [0.025, H], [0.001, H + 0.01]], 24), col, x, 0.04, z);
      const r0 = 0.16 - 0.135 * 0.45, r1 = 0.16 - 0.135 * 0.62;
      K.put(lathe([[r0 + 0.004, 0], [r1 + 0.004, H * 0.17]], 24), white, x, 0.04 + H * 0.45, z);
    }
  },

  beam(K, s, W, D, L) {
    const { rbox, cyl } = L, metal = K.metal(K.pal.m);
    // two posts on T feet, the padded beam on top
    for (const x of [X(10, 2), X(54, 2)]) {
      K.put(cyl(0.06, 0.75, 0.065, 14), metal, x, 0.375, 0);
      K.put(rbox(0.12, 0.08, 0.7, 0.03), K.gloss(K.pal.m), x, 0.04, 0);
      K.put(rbox(0.16, 0.05, 0.16, 0.015), K.gloss(K.pal.m), x, 0.73, 0);
    }
    K.put(rbox(2, 0.19, 0.16, 0.04), K.wood(), 0, u(27), 0);
  },

  tires(K, s, W, D, L) {
    const { lathe, cyl } = L, rubber = K.plain('#2a2a34'), tread = K.plain('#1a1a22');
    // three tyres stacked, a tyre a closed profile turned round, its tread in grooves
    const ring = lathe([[0.2, 0.02], [0.22, 0], [0.38, 0], [0.41, 0.04], [0.41, 0.24], [0.38, 0.28], [0.22, 0.28], [0.2, 0.26], [0.2, 0.02]], 40);
    for (let n = 0; n < 3; n++) {
      const y = n * 0.281;
      K.put(ring.clone(), rubber, 0, y, 0, n * 0.7);
      for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2 + n; K.put(L.rbox(0.02, 0.18, 0.04, 0.005), tread, Math.cos(a) * 0.412, y + 0.14, Math.sin(a) * 0.412, -a); }
    }
    K.put(cyl(0.415, 0.03, 0.415, 40, true), K.gloss(K.pal.c), 0, u(18) - 0.04, 0);
    K.put(cyl(0.2, 0.02, 0.2, 30), K.plain('#101018'), 0, 0.03, 0);
  },

  plyobox(K, s, W, D, L) {
    const { rbox } = L, wood = K.wood(), light = K.wood(L.tone(K.pal.w, 1.12)), mark = K.gloss(K.pal.c);
    // a big box, a smaller one on top, the theme's marks on their fronts and top
    K.put(rbox(0.875, 0.625, 0.8, 0.03), wood, 0, 0.3125, 0);
    K.put(rbox(0.625, 0.5, 0.56, 0.03), light, 0, 0.625 + 0.25, -0.06);
    const f = 0.401;
    for (const [x, y, w, h] of [[0, 0.42, 0.18, 0.06], [0, 0.18, 0.18, 0.06], [-0.06, 0.3, 0.06, 0.24], [0.06, 0.3, 0.06, 0.24]]) K.put(rbox(w, h, 0.012, 0.004), mark, x, y, f);
    K.put(rbox(0.31, 0.19, 0.012, 0.004), mark, 0, 0.9, -0.06 + 0.281);
    K.put(rbox(0.3, 0.01, 0.3, 0.004), mark, 0, 1.126, -0.06);
  },

  bleachers(K, s, W, D, L) {
    const { THREE, rbox, cyl } = L, metal = K.metal(K.pal.m), frame = K.gloss(L.tone(K.pal.m, 0.75));
    // three tiers rising to the back, each a coloured bench over a dark riser
    const tiers = [0, 1, 2].map(i => ({ y: u(14 + i * 14), z: 0.32 - i * 0.31 }));
    tiers.forEach(({ y, z }, i) => {
      K.put(rbox(1.96, 0.1, 0.32, 0.03), K.gloss(i % 2 ? K.pal.c : L.tone(K.pal.c, 1.12)), 0, y + 0.05, z);
      K.put(rbox(1.9, y, 0.03, 0.01), frame, 0, y / 2, z + 0.13);
    });
    // a stepped steel frame at each end, a back rail on two posts
    const steps = [[0.48, 0], [0.48, tiers[0].y], [0.17, tiers[0].y], [0.17, tiers[1].y], [-0.14, tiers[1].y], [-0.14, tiers[2].y], [-0.48, tiers[2].y], [-0.48, 0]];
    for (const sx of [-1, 1]) K.put(L.profileSlab(steps, 0.05, sx * 0.97 - 0.025), metal, 0, 0, 0);
    for (const sx of [-1, 1]) K.put(cyl(0.04, 1.7 - tiers[2].y, 0.04, 12), metal, sx * 0.94, tiers[2].y + (1.7 - tiers[2].y) / 2, -0.45);
    K.put(cyl(0.035, 1.9, 0.035, 12).rotateZ(Math.PI / 2), metal, 0, 1.69, -0.45);
    for (const x of [-0.55, 0, 0.55]) K.put(cyl(0.02, 0.4, 0.02, 10), metal, x, 1.5, -0.45);
  },

  hurdle(K, s, W, D, L) {
    const { rbox, cyl } = L, metal = K.metal(K.pal.m);
    // two posts on long feet, the striped bar across their tops
    for (const x of [X(3.5), X(27.5)]) {
      K.put(cyl(0.045, 0.95, 0.045, 12), metal, x, 0.475, 0);
      K.put(rbox(0.06, 0.05, 0.62, 0.02), metal, x, 0.025, 0.08);
    }
    for (let i = 0; i < 7; i++) K.put(rbox(0.125, 0.16, 0.05, i === 0 || i === 6 ? 0.02 : 0.004), K.gloss(i % 2 ? K.pal.p : K.pal.c), X(4 + i * 4), u(29.5), 0);
  },

  pullupbar(K, s, W, D, L) {
    const { rbox, cyl } = L, metal = K.metal(K.pal.m);
    // two tall posts on feet with braces, a bar over the top with grips, a step bar low down
    for (const x of [X(3.5), X(28.5)]) {
      K.put(cyl(0.05, 2.6, 0.05, 14), metal, x, 1.3, 0);
      K.put(rbox(0.08, 0.06, 0.8, 0.02), K.gloss(K.pal.m), x, 0.03, 0);
      for (const sz of [-1, 1]) rod(K, L, metal, [x, 0.05, sz * 0.36], [x, 0.7, 0], 0.025);
    }
    K.put(cyl(0.035, 0.95, 0.035, 12).rotateZ(Math.PI / 2), metal, 0, u(79), 0);
    for (const i of [8, 24]) K.put(cyl(0.048, 0.14, 0.048, 14).rotateZ(Math.PI / 2), K.gloss(K.pal.c), X(i), u(79), 0);
    K.put(cyl(0.03, 0.82, 0.03, 12).rotateZ(Math.PI / 2), metal, 0, u(29), 0);
  },

  refstand(K, s, W, D, L) {
    const { rbox, cyl } = L, wood = K.wood();
    // four legs, rungs up the front, a platform
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.put(cyl(0.055, 1.56, 0.06, 12), wood, sx * 0.38, 0.78, sz * 0.32);
    for (let j = 8; j < 50; j += 9) {
      K.put(cyl(0.025, 0.76, 0.025, 10).rotateZ(Math.PI / 2), K.wood(L.tone(K.pal.w, 0.85)), 0, u(j), 0.32);
      if (j < 30) for (const sx of [-1, 1]) K.put(cyl(0.022, 0.64, 0.022, 10).rotateX(Math.PI / 2), wood, sx * 0.38, u(j + 4), 0);
    }
    K.put(rbox(0.94, 0.15, 0.84, 0.03), wood, 0, u(51.5), 0);
    // the seat with its cushion, a little flag on a pole
    highSeat(K, L, u(54), 0.82, wood, K.cloth(K.pal.c), 0.66);
    K.put(rbox(0.6, 0.38, 0.04, 0.03), K.cloth(K.pal.c), 0, u(54) + 0.42, -0.21);
    K.put(cyl(0.022, 0.95, 0.022, 10), K.metal(K.pal.m), X(29), u(58) + 0.47, -0.2);
    K.put(rbox(0.3, 0.125, 0.012, 0.004), K.gloss(K.pal.a), X(29) - 0.16, u(83.5), -0.2);
    K.put(rbox(0.3, 0.125, 0.012, 0.004), K.gloss('#ffffff'), X(29) - 0.16, u(79.5), -0.2);
  },

  /* ----- Beach ----- */

  beachumbrella(K, s, W, D, L) {
    const { THREE, cyl, ball, blob } = L;
    // a mound of sand, the pole leaning a little, the striped canopy with a scalloped rim
    K.put(blob(0.4, 0.08, 0.36, 0.5, 0.5), K.plain(SAND), 0, 0.02, 0);
    K.put(cyl(0.03, 2.2, 0.03, 12), K.metal(K.pal.m), 0, 1.1, 0);
    const prof = [];
    for (let i = 0; i <= 12; i++) { const t = i / 12; prof.push(new THREE.Vector2(Math.max(0.001, (1 - t) * 0.52), Math.sin(t * Math.PI / 2) * 0.42)); }
    const n = 10;
    for (let i = 0; i < n; i++) {
      const g = new THREE.LatheGeometry(prof, 6, i / n * Math.PI * 2, Math.PI * 2 / n);
      const under = new THREE.LatheGeometry([...prof].reverse(), 6, i / n * Math.PI * 2, Math.PI * 2 / n);
      K.put(g, K.cloth(i % 2 ? K.pal.c : K.pal.p), 0, u(68) - 0.02, 0);
      K.put(under, K.cloth(i % 2 ? K.pal.c : K.pal.p), 0, u(68) - 0.03, 0);
      const a = (i + 0.5) / n * Math.PI * 2;
      K.put(ball(0.075, 12, 8).scale(1, 0.6, 0.4).rotateY(-a + Math.PI / 2), K.cloth(i % 2 ? K.pal.c : K.pal.p), Math.sin(a) * 0.5, u(68) - 0.05, Math.cos(a) * 0.5);
    }
    K.put(ball(0.05, 12, 10), K.gloss(K.pal.a), 0, u(68) + 0.42, 0);
  },

  sandcastle(K, s, W, D, L) {
    const { rbox, cyl, blob, ball } = L, sand = K.plain(SAND), wet = K.plain(L.tone(SAND, 0.82));
    // a mound, a wall round the front, two round towers and the keep, each crenellated
    K.put(blob(0.96, 0.1, 0.86, 0.5, 0.5), wet, 0, 0.03, 0);
    K.put(rbox(0.86, 0.36, 0.5, 0.03), sand, 0, 0.18, 0.08);
    const battle = (x, y, z, r, n) => { for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; K.put(rbox(0.06, 0.07, 0.06, 0.01), sand, x + Math.cos(a) * r, y + 0.035, z + Math.sin(a) * r, -a); } };
    for (const x of [X(6), X(26)]) { K.put(cyl(0.12, 0.56, 0.135, 20), sand, x, 0.28, 0.12); battle(x, 0.56, 0.12, 0.1, 6); }
    K.put(cyl(0.21, 0.88, 0.24, 24), sand, 0, 0.44, -0.08);
    battle(0, 0.88, -0.08, 0.18, 8);
    for (let i = 0; i < 5; i++) K.put(rbox(0.06, 0.06, 0.06, 0.01), sand, -0.24 + i * 0.12, 0.39, 0.32);
    // a dark arch for the door, a shell by it, a stick flag on top
    K.put(rbox(0.18, 0.2, 0.02, 0.02), K.plain(L.tone(SAND, 0.6)), 0, 0.1, 0.335);
    K.put(cyl(0.09, 0.02, 0.09, 20, false).rotateX(Math.PI / 2), K.plain(L.tone(SAND, 0.6)), 0, 0.2, 0.335);
    K.put(ball(0.05, 12, 8).scale(1, 0.5, 1), K.gloss('#f8b8c8'), X(6), 0.03, 0.4);
    K.put(cyl(0.012, 0.32, 0.012, 8), K.wood(), 0, 0.88 + 0.16, -0.08);
    K.put(rbox(0.18, 0.12, 0.01, 0.003), K.gloss(K.pal.c), 0.09, 1.12, -0.08);
  },

  surfboard(K, s, W, D, L) {
    const { rbox, ball } = L;
    // a wooden stand, the board stood up in it: a long flat oval, a stripe down it, a wax band
    K.put(rbox(0.5, 0.19, 0.3, 0.03), K.wood(), 0, 0.095, 0);
    K.put(rbox(0.4, 0.02, 0.06, 0.006), K.wood(L.tone(K.pal.w, 0.7)), 0, 0.19, 0);
    const board = ball(1, 32, 24);
    board.scale(0.27, 1.22, 0.05);
    K.put(board, K.gloss(K.pal.c), 0, u(44), -0.02);
    const stripe = ball(1, 16, 24);
    stripe.scale(0.035, 1.18, 0.052);
    K.put(stripe, K.gloss(K.pal.a), 0, u(44), -0.02);
    K.put(ball(0.08, 12, 10).scale(1.2, 1, 0.3), K.gloss(L.tone(K.pal.a, 0.8)), 0, u(14), -0.07);
    for (let i = 0; i < 5; i++) K.put(rbox(0.06, 0.025, 0.01, 0.004), K.gloss(K.pal.p), X(10 + i * 3), u(28), 0.031);
  },

  swimring(K, s, W, D, L) {
    const { torus } = L;
    // the ring stood on its edge, leaning back a little, in eight stripes
    const R = 0.31, r = 0.13, n = 8;
    for (let i = 0; i < n; i++) K.put(torus(R, r, Math.PI * 2 / n, 8).rotateZ(i * Math.PI * 2 / n), K.gloss(i % 2 ? K.pal.c : K.pal.p), 0, R + r, 0, 0, -0.18);
    K.put(L.cyl(0.03, 0.05, 0.03, 10), K.gloss(K.pal.p), 0.28, R + r + 0.3, 0.06, 0, -0.18);
  },

  tikitorch(K, s, W, D, L) {
    const { cyl, lathe } = L;
    // the bamboo pole in joints, the cup, a flame in three layers (lit, so it flickers)
    K.put(cyl(0.065, 1.75, 0.07, 14), K.wood(), 0, 0.875, 0);
    for (let j = 8; j < 56; j += 8) K.put(cyl(0.075, 0.025, 0.075, 14), K.wood(L.tone(K.pal.w, 0.75)), 0, u(j), 0);
    K.put(lathe([[0.07, 0], [0.16, 0.22], [0.17, 0.3], [0.14, 0.31]], 20), K.cloth(K.pal.a), 0, u(56), 0);
    const flame = (r, h, y) => lathe([[r, 0], [r * 1.1, h * 0.2], [r * 0.7, h * 0.55], [r * 0.2, h * 0.9], [0.001, h]], 20).translate(0, y, 0);
    K.put(flame(0.16, 0.5, u(65)), K.glow('#f86030'), 0, 0, 0);
    K.put(flame(0.12, 0.38, u(66)), K.glow('#f8a030'), 0, 0, 0.02);
    K.put(flame(0.07, 0.22, u(67)), K.glow('#f8e070'), 0, 0, 0.04);
  },

  lifeguard(K, s, W, D, L) {
    const { rbox, cyl } = L, white = K.gloss(K.pal.p);
    // four legs splaying out to the floor, rungs up the front, the platform
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) rod(K, L, white, [sx * 0.43, 0, sz * 0.36], [sx * 0.33, u(58), sz * 0.28], 0.05);
    for (let j = 10; j < 54; j += 10) {
      const t = j / 58, hw = 0.43 - t * 0.1;
      K.put(rbox(hw * 2, 0.06, 0.07, 0.02), K.gloss(L.tone(K.pal.p, 0.9)), 0, u(j), 0.36 - t * 0.08);
    }
    K.put(rbox(0.86, 0.15, 0.72, 0.03), white, 0, u(59.5), 0);
    // the chair in the theme's colour, a white cross on its back
    highSeat(K, L, u(62), 0.76, K.gloss(K.pal.c), null, 0.6);
    K.put(rbox(0.12, 0.42, 0.012, 0.004), K.gloss('#ffffff'), 0, u(62) + 0.4, -0.192);
    K.put(rbox(0.42, 0.14, 0.012, 0.004), K.gloss('#ffffff'), 0, u(62) + 0.42, -0.192);
    K.put(cyl(0.06, 0.04, 0.06, 12), K.gloss('#ffffff'), 0.3, u(62) + 0.12, 0.2);
  },

  seashells(K, s, W, D, L) {
    const { blob, ball, lathe } = L, shellPink = K.gloss('#f8c8b8');
    // a patch of sand
    K.put(blob(0.84, 0.06, 0.7, 0.5, 0.5), K.plain(SAND), 0, 0.01, 0);
    // a scallop: ribs fanned out from its hinge
    for (let i = 0; i < 9; i++) {
      const a = (i - 4) * 0.22;
      K.put(ball(1, 12, 8).scale(0.035, 0.03, 0.18).translate(0, 0, 0.12).rotateY(a), K.gloss(i % 2 ? '#f8c8b8' : '#f0a898'), X(10), 0.06, -0.06, 0, -0.35);
    }
    K.put(ball(0.04, 10, 8), shellPink, X(10), 0.05, -0.08);
    // a spiral shell in the theme's colour, its whorls stacked
    for (let w = 0; w < 5; w++) K.put(ball(0.11 - w * 0.02, 16, 12).scale(1, 0.75, 1), K.gloss(w % 2 ? K.pal.c : L.tone(K.pal.c, 1.15)), X(21) + w * 0.012, 0.08 + w * 0.05, 0.02 - w * 0.01);
    K.put(lathe([[0.03, 0], [0.001, 0.06]], 12), K.gloss(K.pal.c), X(21) + 0.06, 0.32, -0.03);
    // a starfish
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * Math.PI * 2;
      K.put(ball(1, 10, 8).scale(0.035, 0.022, 0.09).translate(0, 0, 0.08).rotateY(a), K.gloss('#f08850'), X(14), 0.045, 0.2);
    }
    K.put(ball(0.045, 10, 8).scale(1, 0.5, 1), K.gloss('#f8b080'), X(14), 0.05, 0.2);
  },

  bottlemsg(K, s, W, D, L) {
    const { blob, lathe, cyl, rbox } = L;
    // a patch of sand, the bottle lying in it, corked, the rolled note inside
    K.put(blob(0.86, 0.05, 0.6, 0.5, 0.5), K.plain(L.tone(SAND, 0.95)), 0, 0.01, 0);
    const bottle = lathe([[0.15, 0], [0.16, 0.02], [0.16, 0.4], [0.12, 0.48], [0.06, 0.54], [0.055, 0.64], [0.065, 0.66], [0.065, 0.68]], 28);
    bottle.translate(0, -0.34, 0).rotateZ(-Math.PI / 2);
    K.put(bottle, K.M('glass', '#5aa878', { key: 'bottle' }), 0, 0.17, 0.02, -0.25);
    K.put(cyl(0.05, 0.08, 0.055, 12).rotateZ(Math.PI / 2), K.wood('#a87a48'), 0.33 * Math.cos(0.25), 0.17, 0.02 + 0.33 * Math.sin(0.25), -0.25);
    K.put(cyl(0.07, 0.26, 0.07, 18).rotateZ(Math.PI / 2), K.plain('#f4e8c8'), -0.08, 0.13, 0.04, -0.25);
    K.put(cyl(0.073, 0.04, 0.073, 18).rotateZ(Math.PI / 2), K.gloss(K.pal.c), -0.08, 0.13, 0.04, -0.25);
    K.put(rbox(0.28, 0.02, 0.12, 0.008), K.plain('#4a9868'), 0, 0.015, 0.02, -0.25);
  },

  sandbucket(K, s, W, D, L) {
    const { lathe, cyl, torus, rbox } = L, col = K.gloss(K.pal.c);
    // the bucket, a rolled rim, full of sand, a wire handle
    K.put(lathe([[0.2, 0], [0.27, 0.5], [0.29, 0.52], [0.29, 0.54], [0.26, 0.54], [0.24, 0.51], [0.18, 0.04], [0.001, 0.04]], 28), col, X(15), 0, 0);
    K.put(torus(0.28, 0.02, Math.PI * 2, 28), K.gloss(L.tone(K.pal.c, 1.15)), X(15), 0.54, 0, 0, Math.PI / 2);
    K.put(L.blob(0.5, 0.1, 0.5, 0.6, 0.5), K.plain(SAND), X(15), 0.5, 0);
    K.put(torus(0.27, 0.012, Math.PI, 24), K.metal(K.pal.m), X(15), 0.52, 0, 0.4);
    // the spade stood up beside it, its blade in the sand
    K.put(cyl(0.025, 0.72, 0.025, 10), K.gloss(K.pal.a), X(26), 0.42, 0.18, 0, 0, -0.08);
    K.put(rbox(0.12, 0.05, 0.04, 0.015), K.gloss(K.pal.a), X(26) + 0.03, 0.8, 0.18);
    K.put(rbox(0.18, 0.2, 0.025, 0.02), K.gloss(K.pal.a), X(26) - 0.02, 0.08, 0.18, 0, 0, -0.08);
  },

  beachhut(K, s, W, D, L) {
    const { THREE, rbox } = L, wall = K.wood(K.pal.p), stripe = K.wood(K.pal.c), frame = K.wood(), dark = K.wood(L.tone(K.pal.w, 0.7));
    const w = u(56), h = u(64), d = 1.6, f = d / 2, y0 = u(4);
    // a plank floor raised on a sill, the walls striped all round
    K.put(rbox(w + 0.12, y0, d + 0.12, 0.02), dark, 0, y0 / 2, 0);
    K.put(rbox(w, h, d, 0.02), wall, 0, y0 + h / 2, 0);
    const sw = u(6);
    for (let x = -w / 2 + sw; x < w / 2 - 0.01; x += sw * 2) for (const sz of [-1, 1]) K.put(rbox(sw, h - 0.02, 0.012, 0.003), stripe, x + sw / 2, y0 + h / 2, sz * (f + 0.004));
    for (let z = -f + sw; z < f - 0.01; z += sw * 2) for (const sx of [-1, 1]) K.put(rbox(0.012, h - 0.02, sw, 0.003), stripe, sx * (w / 2 + 0.004), y0 + h / 2, z + sw / 2);
    // the door, its knob; two windows either side
    K.put(rbox(u(18), u(41), 0.04, 0.01), dark, 0, y0 + u(20), f + 0.01);
    K.put(rbox(u(16), u(39), 0.05, 0.01), frame, 0, y0 + u(19.5), f + 0.015);
    for (let i = 1; i < 4; i++) K.put(rbox(0.008, u(37), 0.004, 0.002), dark, -u(8) + i * u(4), y0 + u(19.5), f + 0.042);
    K.put(L.ball(0.035, 12, 10), K.metal(K.pal.a), u(5), u(24), f + 0.06);
    for (const sx of [-1, 1]) {
      const x = sx * (w / 2 - u(9));
      K.put(rbox(u(10), u(10), 0.04, 0.008), K.gloss(K.pal.m), x, u(51), f + 0.01);
      K.put(new THREE.PlaneGeometry(u(8), u(8)), K.gloss('#b8e0f4'), x, u(51), f + 0.032);
      K.put(rbox(u(1), u(8), 0.01, 0.002), K.gloss(K.pal.m), x, u(51), f + 0.035);
    }
    // the gable roof, its two slopes overhanging, the gables filled in
    const top = y0 + h, rise = u(18), half = w / 2 + 0.14, slope = Math.hypot(half, rise), tilt = Math.atan2(rise, half);
    for (const sx of [-1, 1]) K.put(rbox(slope + 0.04, 0.07, d + 0.22, 0.02), frame, sx * half / 2, top + rise / 2 + 0.03, 0, 0, 0, -sx * tilt);
    const tri = new THREE.Shape([new THREE.Vector2(-w / 2, 0), new THREE.Vector2(w / 2, 0), new THREE.Vector2(0, rise * (w / 2) / half)]);
    const gable = new THREE.ExtrudeGeometry(tri, { depth: d - 0.02, bevelEnabled: false });
    gable.translate(0, 0, -(d - 0.02) / 2);
    K.put(gable, wall, 0, top, 0);
    K.put(rbox(w + 0.04, 0.06, d + 0.04, 0.015), dark, 0, top, 0);
  },

  driftwood(K, s, W, D, L) {
    const { lathe } = L, grey = K.wood('#b8a890'), dark = K.wood('#9a8a74');
    // a weathered log lying on the sand, knotted and thinning to one end, a broken branch reaching up
    const prof = [];
    for (let i = 0; i <= 14; i++) { const t = i / 14; prof.push([0.04 + 0.11 * Math.sin(Math.min(1, t * 1.6) * Math.PI / 2) * (1 - t * 0.55) + Math.sin(t * 19) * 0.01, t * 0.9]); }
    prof.unshift([0.001, 0]); prof.push([0.001, 0.9]);
    const log = lathe(prof, 18);
    log.translate(0, -0.45, 0).rotateZ(Math.PI / 2);
    K.put(log, grey, 0, 0.13, 0.02, 0.3);
    const stub = lathe([[0.001, 0], [0.05, 0.01], [0.045, 0.2], [0.03, 0.28], [0.001, 0.3]], 12);
    K.put(stub, grey, X(20), 0.15, -0.02, 0, 0, -0.45);
    const twig = lathe([[0.001, 0], [0.028, 0.01], [0.02, 0.14], [0.001, 0.16]], 10);
    K.put(twig, dark, X(10), 0.2, 0.06, 0, 0.6, 0.5);
    K.put(L.blob(0.9, 0.04, 0.5, 0.5, 0.5), K.plain(L.tone(SAND, 0.9)), 0, 0.01, 0);
  },

  laprasfloat(K, s, W, D, L) {
    const { blob, ball, lathe, torus } = L, blue = K.gloss('#68a8e8'), shell = K.gloss('#a8a8b8');
    // the puffy body, a cream rim round its foot, three knobs on its shell
    K.put(blob(0.86, 0.4, 0.72, 0.6, 0.5), blue, -0.03, 0.22, 0);
    K.put(torus(0.33, 0.06, Math.PI * 2, 32).scale(1.25, 1, 1), K.gloss('#f0e8d0'), -0.03, 0.07, 0, 0, Math.PI / 2);
    for (const [x, z] of [[-0.22, 0.05], [-0.02, -0.12], [0.12, 0.12]]) {
      K.put(ball(0.09, 14, 10).scale(1, 0.8, 1), shell, x, 0.4, z);
      K.put(lathe([[0.04, 0], [0.001, 0.07]], 10), K.gloss('#e8e8f0'), x, 0.46, z);
    }
    // the neck rising at the front end, the head with its eye and horn
    const neck = tube(L, [[0.3, 0.3, 0], [0.38, 0.6, 0], [0.4, 0.84, 0], [0.38, 0.98, 0]], 0.08, 24);
    K.put(neck, blue);
    K.put(ball(1, 20, 14).scale(0.13, 0.1, 0.11), blue, 0.4, 1.02, 0);
    K.put(ball(1, 14, 10).scale(0.09, 0.07, 0.08), K.gloss('#88c0f0'), 0.5, 1.0, 0);
    for (const sz of [-1, 1]) K.put(ball(0.02, 8, 6), K.gloss('#202028'), 0.46, 1.06, sz * 0.085);
    K.put(lathe([[0.03, 0], [0.001, 0.09]], 10), blue, 0.36, 1.1, 0, 0, 0, 0.3);
  },
};
