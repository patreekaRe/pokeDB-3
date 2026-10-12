/* base-models-a.js  -  Things, Classics and Seats pieces, modelled from parts like the arcade cabinets (the user's ask, 2026-10-12).
   js/base-models-f.js's head says how a batch works. Most builders here follow their painting (js/base-furniture-kinds.js)
   pixel for pixel: `u(n)` is n of its 32 pixels a tile, `X(n, W)` a pixel across the painting as x from the middle.
   Left as they were: the snow globe, crystal ball and Poké Ball statue (true spheres) and the ball cushion. */

import { frontbox, pokeBall, rod, tube } from './base-models-kit.js';

const u = (n) => n / 32;
const X = (n, W = 1) => n / 32 - W / 2;
const BOOKS = ['#d0485a', '#4a7ac8', '#e0b04a', '#4f9a42', '#8a5ab8', '#e8e4d8'];
const COAL = '#26262e';

const sheet = (w, h, draw) => { const c = new OffscreenCanvas(w, h); draw(c.getContext('2d'), w, h); return c; };
const pics = {};
const once = (key, make) => pics[key] || (pics[key] = make());

/* the easel's picture: hills under a sunny sky */
const landscape = () => once('land', () => sheet(128, 136, (g, w, h) => {
  const sky = g.createLinearGradient(0, 0, 0, h * 0.6);
  sky.addColorStop(0, '#7ab8ec'); sky.addColorStop(1, '#b8dcf8');
  g.fillStyle = sky; g.fillRect(0, 0, w, h);
  g.fillStyle = '#f8d070'; g.beginPath(); g.arc(98, 34, 14, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(36, 30, 18, 7, 0, 0, Math.PI * 2); g.ellipse(50, 26, 12, 7, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#5aa048'; g.beginPath(); g.ellipse(104, 104, 64, 34, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#6cbf58'; g.beginPath(); g.ellipse(34, 112, 66, 36, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#4f9a42'; g.fillRect(0, 120, w, 16);
  g.fillStyle = '#f0f0e8'; g.fillRect(0, 0, w, 5); g.fillRect(0, h - 5, w, 5); g.fillRect(0, 0, 5, h); g.fillRect(w - 5, 0, 5, h);
}));

/* the record sleeve: a note on the theme's colour */
const sleeve = (col, ink) => once('sleeve' + col + ink, () => sheet(96, 96, (g, w, h) => {
  g.fillStyle = ink; g.fillRect(0, 0, w, h);
  g.fillStyle = col; g.fillRect(8, 8, w - 16, h - 16);
  g.fillStyle = ink; g.beginPath(); g.ellipse(38, 66, 12, 9, -0.4, 0, Math.PI * 2); g.fill(); g.fillRect(46, 22, 6, 46);
  g.beginPath(); g.moveTo(46, 22); g.lineTo(72, 32); g.lineTo(72, 42); g.lineTo(52, 34); g.fill();
}));

/* the arcade machine's marquee: lit, a band of the theme's colour, five lights */
const marquee = (col) => once('marq' + col, () => sheet(192, 64, (g, w, h) => {
  g.fillStyle = '#f8f0a0'; g.fillRect(0, 0, w, h);
  g.fillStyle = col; g.fillRect(14, 14, w - 28, h - 28);
  g.fillStyle = '#f8f0a0'; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(34 + i * 31, h / 2, 6, 0, Math.PI * 2); g.fill(); }
}));

/* a toy block's face: a letter on its colour */
const blockFace = (col, letter) => once('blk' + col + letter, () => sheet(64, 64, (g, w, h) => {
  g.fillStyle = col; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, h - 6, w, 6); g.fillRect(w - 6, 0, 6, h);
  g.font = 'bold 44px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffffff';
  g.fillText(letter, w / 2, h / 2 + 2);
}));

/** A flat shape (THREE.Shape) extruded `d` deep, centred on z 0, its edges rounded by `b`. */
function slab(L, shape, d, b = 0.008) {
  const g = new L.THREE.ExtrudeGeometry(shape, { depth: Math.max(0.001, d - b * 2), bevelEnabled: b > 0, bevelThickness: b, bevelSize: b, bevelSegments: 2, curveSegments: 32 });
  g.translate(0, 0, -(d - b * 2) / 2);
  return g;
}
/** A shape through [[x, y]...]. */
const poly = (L, pts) => new L.THREE.Shape(pts.map(([x, y]) => new L.THREE.Vector2(x, y)));
/** A five-pointed star r across, facing +z. */
const star = (L, r, d) => slab(L, poly(L, Array.from({ length: 10 }, (_, i) => { const a = Math.PI / 2 + i * Math.PI / 5, k = i % 2 ? r * 0.45 : r; return [Math.cos(a) * k, Math.sin(a) * k]; })), d, 0.004);
/** A teardrop flame h tall, facing +z, its foot at 0. */
const flame = (L, w, h, d) => {
  const s = new L.THREE.Shape();
  s.moveTo(0, 0); s.bezierCurveTo(w, 0, w * 0.7, h * 0.55, 0, h); s.bezierCurveTo(-w * 0.7, h * 0.55, -w, 0, 0, 0);
  return slab(L, s, d, 0.003);
};
/** A lathe through a sphere of radius R centred at cy, from height y0 to y1 (a fishbowl, a lamp's glass). */
const sphereBand = (R, cy, y0, y1, n = 18) => Array.from({ length: n + 1 }, (_, i) => { const y = y0 + (y1 - y0) * i / n, dy = y - cy; return [Math.sqrt(Math.max(0, R * R - dy * dy)), y]; });

export const SHAPES = {
  stove: { make: 'stove' },
  // boxes, the painting on the front only (js/base-models-kit.js)
  'vending fridge': { make: 'frontbox' },
  'washer': { make: 'frontbox', d: 0.6 },
  'pc': { make: 'frontbox', d: 0.5 },
  'piano': { make: 'frontbox', d: 0.55 },
  'aquarium': { make: 'frontbox', d: 0.5 },
  'fireplace': { make: 'frontbox', d: 0.5, top: 0.2 },
  'sink': { make: 'frontbox', d: 0.55, top: 0.2 },
  'heater': { make: 'frontbox', d: 0.22 },
  'grandclock': { make: 'frontbox', d: 0.4, top: 0.12 },
  // built from parts
  trophy: { make: 'trophy' },
  fishbowl: { make: 'fishbowl' },
  candle: { make: 'candle' },
  lavalamp: { make: 'lavalamp' },
  hourglass: { make: 'hourglass' },
  musicbox: { make: 'musicbox' },
  telescope: { make: 'telescope' },
  recordplayer: { make: 'recordplayer' },
  radio: { make: 'radio' },
  computer: { make: 'computer' },
  console: { make: 'console' },
  fan: { make: 'fan' },
  drum: { make: 'drum' },
  guitar: { make: 'guitar' },
  bin: { make: 'bin' },
  umbrellas: { make: 'umbrellas' },
  coatrack: { make: 'coatrack' },
  lantern: { make: 'paperlantern' },
  birdcage: { make: 'birdcage' },
  cauldron: { make: 'cauldron' },
  easel: { make: 'easel' },
  pillar: { make: 'pillar' },
  arcade: { make: 'arcadecabinet' },
  jukebox: { make: 'jukebox' },
  snowman: { make: 'snowman' },
  standmirror: { make: 'standmirror' },
  gong: { make: 'gong' },
  toybox: { make: 'toybox' },
  bookstack: { make: 'bookstack' },
  tent: { make: 'tent' },
  slide: { make: 'slide' },
  pokecenter: { make: 'healer' },
};

export const MAKES = {
  frontbox,

  stove(K, s, W, D, L) {
    const { THREE, rbox, cyl, lathe, torus } = L;
    const body = K.gloss('#3a3c44'), dark = K.plain('#1c1d22'), steel = K.metal('#c8ccd4'), brass = K.metal('#d8b048');
    const w = 0.84, d = 0.62, h = 0.84, f = d / 2;
    // the body on a dark plinth, a steel top
    K.put(rbox(w, h - 0.06, d, 0.03), body, 0, 0.06 + (h - 0.06) / 2, 0);
    K.put(rbox(w - 0.04, 0.06, d - 0.04, 0.015), dark, 0, 0.03, 0);
    K.put(rbox(w + 0.02, 0.03, d + 0.02, 0.01), steel, 0, h + 0.015, 0);
    // the oven door: a handle bar, a window glowing warm, a frame
    K.put(rbox(w - 0.1, 0.46, 0.03, 0.015), K.gloss('#2c2e34'), 0, 0.36, f + 0.01);
    K.put(new THREE.PlaneGeometry(w - 0.3, 0.2), K.glow('#ff9a3a'), 0, 0.36, f + 0.027);
    K.put(new THREE.PlaneGeometry(w - 0.28, 0.22), K.glass(), 0, 0.36, f + 0.03);
    K.put(L.cyl(0.015, w - 0.24, 0.015, 10).rotateZ(Math.PI / 2), steel, 0, 0.62, f + 0.06);
    for (const sg of [-1, 1]) K.put(rbox(0.03, 0.03, 0.05, 0.008), steel, sg * (w / 2 - 0.13), 0.62, f + 0.035);
    // the control strip: four brass knobs
    K.put(rbox(w - 0.04, 0.1, 0.03, 0.01), K.gloss('#2c2e34'), 0, h - 0.07, f + 0.01);
    for (let i = 0; i < 4; i++) K.put(cyl(0.025, 0.03, 0.028, 16).rotateX(Math.PI / 2), brass, -0.27 + i * 0.18, h - 0.07, f + 0.035);
    // four burners, two glowing, and a backsplash
    for (const [x, z, on] of [[-0.18, -0.1, 1], [0.18, -0.1, 0], [-0.18, 0.12, 0], [0.18, 0.12, 1]]) {
      K.put(cyl(0.11, 0.012, 0.11, 24), dark, x, h + 0.036, z);
      K.put(torus(0.07, 0.008, Math.PI * 2, 24), on ? K.glow('#ff5a2a') : K.plain('#3a3a40'), x, h + 0.044, z, 0, Math.PI / 2);
      K.put(torus(0.035, 0.007, Math.PI * 2, 18), on ? K.glow('#ff5a2a') : K.plain('#3a3a40'), x, h + 0.044, z, 0, Math.PI / 2);
    }
    K.put(rbox(w, 0.16, 0.04, 0.012), body, 0, h + 0.1, -f + 0.02);
    for (let i = 0; i < 3; i++) K.put(rbox(0.06, 0.02, 0.01, 0.005), K.glow('#7ad0ff'), -0.1 + i * 0.1, h + 0.12, -f + 0.045);
    // a little pot on the back burner and a pan at the front
    K.put(lathe([[0.085, 0], [0.09, 0.01], [0.09, 0.12], [0.094, 0.13], [0, 0.13]], 24), steel, 0.18, h + 0.042, -0.1);
    K.put(cyl(0.08, 0.012, 0.08, 20), steel, 0.18, h + 0.18, -0.1);
    K.put(L.ball(0.016, 10, 8), K.gloss('#1c1d22'), 0.18, h + 0.2, -0.1);
    K.put(lathe([[0.08, 0], [0.095, 0.035], [0.1, 0.04], [0, 0.04]], 24), K.gloss('#2a2a30'), -0.18, h + 0.042, 0.12);
    K.put(rbox(0.16, 0.02, 0.03, 0.008).translate(0.09, 0, 0).rotateY(-0.5), K.gloss('#2a2a30'), -0.08, h + 0.07, 0.12);
  },

  /* ----- Things ----- */

  trophy(K, s, W, D, L) {
    const { rbox, lathe, torus } = L, gold = K.metal(K.pal.a);
    // a wooden block with a gold plaque, the stem, a cup with two handles and a star on its front
    K.put(rbox(u(20), u(10), 0.46, 0.03), K.wood(), 0, u(5), 0);
    K.put(rbox(u(12), u(3), 0.012, 0.004), gold, 0, u(5.5), 0.236);
    K.put(lathe([[0.13, 0], [0.13, 0.025], [0.05, 0.06], [0.035, 0.1], [0.035, 0.18], [0.065, 0.21], [0.065, 0.24], [0.03, 0.27], [0, 0.27]], 32), gold, 0, u(10), 0);
    K.put(lathe([[0, 0.58], [0.06, 0.6], [0.1, 0.66], [0.19, 0.75], [0.25, 0.87], [0.29, 1.0], [0.31, 1.12], [0.31, 1.19], [0.33, 1.2], [0.31, 1.215], [0.29, 1.18], [0.27, 1.05], [0.2, 0.86], [0, 0.78]], 40), gold, 0, 0, 0);
    for (const sg of [-1, 1]) K.put(torus(0.12, 0.022, Math.PI, 24).rotateZ(-sg * Math.PI / 2), gold, sg * 0.27, 0.98, 0);
    K.put(star(L, 0.1, 0.02), K.gloss(K.pal.c), 0, 0.97, 0.3, 0, -0.25);
  },

  fishbowl(K, s, W, D, L) {
    const { rbox, lathe, ball, cyl, leg, legsAt } = L, wood = K.wood();
    // a little wooden stand
    K.put(rbox(u(26), 0.06, 0.6, 0.02), wood, 0, u(19), 0);
    K.put(rbox(u(24), 0.1, 0.54, 0.015), wood, 0, u(17), 0);
    for (const [x, z] of legsAt(u(26), 0.6, 0.06)) leg(K, K.wood(L.tone(K.pal.w, 0.85)), x, z, u(15), 0.03);
    // the bowl's glass, its water, gravel and weed, a goldfish
    const y0 = u(20), R = 0.35, cy = y0 + 0.33;
    K.put(lathe([[0, y0], ...sphereBand(R, cy, y0, cy + 0.25)], 36), K.M('glass', '#d8f0f8', { key: 'bowl' }));
    K.put(L.torus(Math.sqrt(R * R - 0.25 * 0.25), 0.012, Math.PI * 2, 36), K.M('glass', '#c8e8f4', { key: 'rim' }), 0, cy + 0.25, 0, 0, Math.PI / 2);
    K.put(lathe([[0, y0 + 0.01], ...sphereBand(R - 0.015, cy, y0 + 0.01, cy + 0.15), [0, cy + 0.15]], 32), K.M('glass', '#7ac0e8', { key: 'water' }));
    K.put(cyl(0.11, 0.03, 0.12, 20), K.plain('#c8b890'), 0, y0 + 0.025, 0);
    for (let i = 0; i < 3; i++) K.put(ball(1, 10, 8).scale(0.016, 0.1, 0.03), K.gloss(K.pal.leaf), -0.12 + i * 0.04, y0 + 0.12, -0.05 + i * 0.02, 0, 0, (i - 1) * 0.2);
    const fish = K.gloss('#f08030');
    K.put(ball(1, 16, 12).scale(0.075, 0.055, 0.04), fish, -0.02, cy, 0.04);
    K.put(cyl(0.001, 0.07, 0.05, 12).scale(1, 1, 0.35).rotateZ(Math.PI / 2), fish, 0.08, cy, 0.04);
    K.put(ball(1, 10, 8).scale(0.03, 0.03, 0.008), K.gloss('#f8a050'), -0.02, cy + 0.05, 0.04);
    for (const sg of [-1, 1]) K.put(ball(0.012, 8, 6), K.gloss(COAL), -0.07, cy + 0.01, 0.04 + sg * 0.035);
  },

  candle(K, s, W, D, L) {
    const { lathe, cyl, ball, torus } = L, brass = K.metal(K.pal.m), wax = K.gloss(K.pal.p);
    // a brass dish with a finger ring, the candle, its drips and wick, a two-tone flame
    K.put(lathe([[0, 0], [0.28, 0], [0.31, 0.035], [0.31, 0.05], [0.28, 0.05], [0.12, 0.04], [0, 0.04]], 32), brass);
    K.put(torus(0.05, 0.012, Math.PI * 2, 18), brass, 0.33, 0.06, 0, Math.PI / 2, Math.PI / 2);
    K.put(lathe([[0.17, 0.04], [0.16, 0.05], [0.156, 0.78], [0.15, 0.8], [0.12, 0.79], [0, 0.77]], 32), wax);
    for (const [a, l] of [[0.4, 0.12], [1.9, 0.2], [3.3, 0.08], [4.6, 0.15]]) K.put(ball(1, 10, 8).scale(0.025, l, 0.025), wax, Math.sin(a) * 0.155, 0.8 - l * 0.6, Math.cos(a) * 0.155);
    K.put(cyl(0.008, 0.06, 0.008, 6), K.plain('#303038'), 0, 0.81, 0);
    K.put(lathe([[0, 0.84], [0.055, 0.88], [0.07, 0.95], [0.066, 1.0], [0, 1.0]], 20), K.glow(K.pal.g));
    K.put(lathe([[0.066, 1.0], [0.05, 1.08], [0.02, 1.18], [0, 1.24]], 20), K.glow(K.pal.gl));
  },

  lavalamp(K, s, W, D, L) {
    const { lathe, ball } = L, metal = K.metal(K.pal.m);
    // a metal cone foot, the glass full of lit wax, its cap
    K.put(lathe([[0, 0], [0.26, 0], [0.26, 0.03], [0.16, u(12)], [0, u(12)]], 32), metal);
    const y0 = u(12), y1 = u(42), r = (y) => 0.1 + Math.sin((y - y0) / (y1 - y0) * Math.PI) * 0.12;
    const prof = (k) => Array.from({ length: 17 }, (_, i) => { const y = y0 + (y1 - y0) * i / 16; return [r(y) - k, y]; });
    K.put(lathe([[0, y0], ...prof(0.025), [0, y1]], 32), K.glow(K.pal.c));
    for (const [a, y, b] of [[0.3, 0.98, 0.09], [2.4, 0.72, 0.08], [4.2, 1.12, 0.06], [5.4, 0.55, 0.07], [1.5, 0.84, 0.05]]) {
      const rr = r(y) - 0.025 - b * 0.4;
      K.put(ball(1, 16, 12).scale(b, b * 1.3, b), K.glow(K.pal.a), Math.sin(a) * rr, y, Math.cos(a) * rr);
    }
    K.put(lathe([[0, y0], ...prof(-0.005), [0, y1]], 32), K.M('glass', '#ffffff', { key: 'lava' }));
    K.put(lathe([[0, y1 - 0.01], [0.11, y1 - 0.01], [0.11, y1 + 0.02], [0.06, u(48)], [0, u(48)]], 32), metal);
  },

  hourglass(K, s, W, D, L) {
    const { cyl, lathe } = L, wood = K.wood(), sand = K.plain(K.pal.a);
    // two wooden discs on three turned posts, the glass between, sand running through
    for (const y of [0, u(35)]) {
      K.put(cyl(0.33, u(5), 0.33, 32), wood, 0, y + u(2.5), 0);
      K.put(cyl(0.3, 0.012, 0.3, 32), K.wood(L.tone(K.pal.w, 1.15)), 0, y ? y : u(5), 0);
    }
    for (const a of [Math.PI / 3, Math.PI, Math.PI * 5 / 3]) {
      K.put(lathe([[0.025, 0], [0.03, 0.05], [0.02, 0.25], [0.035, 0.465], [0.02, 0.68], [0.03, 0.88], [0.025, u(30)]], 12), K.wood(L.tone(K.pal.w, 0.85)), Math.sin(a) * 0.26, u(5), Math.cos(a) * 0.26);
    }
    const prof = [[0.17, 0.16], [0.19, 0.22], [0.19, 0.32], [0.14, 0.45], [0.05, 0.57], [0.022, 0.625], [0.05, 0.68], [0.14, 0.8], [0.19, 0.93], [0.19, 1.03], [0.17, 1.09]];
    K.put(lathe(prof, 32), K.M('glass', '#e8f4fc', { key: 'hour' }));
    K.put(lathe([[0, 0.69], [0.05, 0.69], [0.13, 0.8], [0.175, 0.9], [0, 0.9]], 28), sand);
    K.put(lathe([[0.175, 0.16], [0.18, 0.24], [0.11, 0.33], [0, 0.4]], 28), sand);
    K.put(cyl(0.008, 0.3, 0.008, 6), sand, 0, 0.53, 0);
  },

  musicbox(K, s, W, D, L) {
    const { rbox, cyl, lathe, ball, torus } = L, wood = K.wood(), cloth = K.cloth(K.pal.c), gold = K.metal(K.pal.a);
    // the box, a gold band, the red-lined inside, the lid propped open behind
    const w = u(26), h = u(16), d = 0.56;
    K.put(rbox(w, h - 0.02, d, 0.03), wood, 0, (h - 0.02) / 2, 0);
    K.put(rbox(w - 0.08, 0.012, d - 0.08, 0.004), cloth, 0, h - 0.025, 0);
    for (const [x, z, ww, dd] of [[0, d / 2 - 0.02, w, 0.04], [0, -d / 2 + 0.02, w, 0.04], [-w / 2 + 0.02, 0, 0.04, d], [w / 2 - 0.02, 0, 0.04, d]]) K.put(rbox(ww, 0.04, dd, 0.012), wood, x, h - 0.01, z);
    K.put(rbox(u(22), u(2), 0.012, 0.004), gold, 0, u(8), d / 2 + 0.004);
    K.put(rbox(0.06, 0.06, 0.012, 0.01), gold, 0, u(12), d / 2 + 0.005);
    K.put(rbox(w, d, 0.035, 0.015), wood, 0, h + d / 2 * Math.cos(0.25), -d / 2 - d / 2 * Math.sin(0.25), 0, -0.25);
    K.put(rbox(w - 0.1, d - 0.1, 0.01, 0.006), cloth, 0, h + d / 2 * Math.cos(0.25), -d / 2 - d / 2 * Math.sin(0.25) + 0.02, 0, -0.25);
    // a ballerina turning on her stand
    const y = h;
    K.put(cyl(0.05, 0.04, 0.06, 18), gold, 0, y + 0.02, 0.02);
    K.put(cyl(0.022, 0.16, 0.026, 12), K.gloss(K.pal.p), 0, y + 0.12, 0.02);
    K.put(lathe([[0, 0.02], [0.1, 0], [0.11, -0.012], [0.05, -0.02], [0, -0.02]], 24), K.gloss(K.pal.c), 0, y + 0.13, 0.02);
    K.put(ball(0.04, 14, 10), K.gloss('#f8d8c0'), 0, y + 0.25, 0.02);
    K.put(torus(0.06, 0.008, Math.PI, 12), K.gloss('#f8d8c0'), 0, y + 0.23, 0.02);
    // the crank on its right side
    K.put(cyl(0.012, 0.08, 0.012, 8).rotateZ(Math.PI / 2), K.metal(), w / 2 + 0.04, u(7), 0);
    K.put(rbox(0.02, 0.1, 0.02, 0.006), K.metal(), w / 2 + 0.08, u(7) + 0.04, 0);
    K.put(ball(0.022, 10, 8), K.gloss(K.pal.a), w / 2 + 0.1, u(7) + 0.09, 0);
  },

  telescope(K, s, W, D, L) {
    const { cyl, ball, rbox } = L, wood = K.wood();
    // a tripod, a pier, the tube tipped up at the sky: eyepiece, body, the big end in the accent colour
    const top = u(24);
    for (const a of [0, Math.PI * 2 / 3, Math.PI * 4 / 3]) rod(K, L, wood, [0, top, 0], [Math.sin(a + 0.4) * 0.36, 0, Math.cos(a + 0.4) * 0.36], 0.026);
    K.put(cyl(0.05, 0.28, 0.05, 14), K.wood(L.tone(K.pal.w, 0.85)), 0, top + 0.1, 0);
    K.put(rbox(0.1, 0.08, 0.16, 0.02), K.metal(), 0, top + 0.27, 0);
    const a = Math.atan(0.75), O = [0, u(33)], along = (geo, t, m) => K.put(geo.translate(0, t, 0).rotateZ(a - Math.PI / 2), m, O[0], O[1], 0);
    along(cyl(0.09, 0.62, 0.08, 28), 0, K.metal());
    along(cyl(0.125, 0.26, 0.11, 28), 0.4, K.gloss(K.pal.a));
    along(cyl(0.13, 0.03, 0.13, 28), 0.53, K.gloss(L.tone(K.pal.a, 0.8)));
    along(cyl(0.11, 0.004, 0.11, 28), 0.546, K.gloss('#a8d0f0'));
    along(cyl(0.05, 0.16, 0.06, 18), -0.38, K.metal(L.tone(K.pal.m, 0.7)));
    along(cyl(0.03, 0.06, 0.03, 14), -0.47, K.gloss(COAL));
    for (const t of [-0.2, 0.15]) along(cyl(0.095, 0.03, 0.095, 28), t, K.metal(L.tone(K.pal.m, 1.4)));
    K.put(ball(0.05, 14, 10), K.gloss(K.pal.a), 0, O[1], 0.1);
  },

  recordplayer(K, s, W, D, L) {
    const { rbox, cyl, ball, torus, legsAt, leg } = L, wood = K.wood();
    // a cabinet on four legs, a gold strip, the turntable, its record and arm, a sleeve propped at the back
    for (const [x, z] of legsAt(u(30), 0.6, 0.07)) leg(K, K.wood(L.tone(K.pal.w, 0.85)), x, z, u(16) + 0.01, 0.032);
    K.put(rbox(u(30), u(10), 0.62, 0.03), wood, 0, u(21), 0);
    K.put(rbox(u(26), u(2), 0.012, 0.004), K.metal(K.pal.a), 0, u(19), 0.312);
    const y = u(26), x = X(14);
    K.put(cyl(0.29, 0.025, 0.29, 40), K.metal(), x, y + 0.0125, 0.03);
    K.put(cyl(0.27, 0.008, 0.27, 40), K.gloss('#202028'), x, y + 0.03, 0.03);
    for (const r of [0.14, 0.19, 0.24]) K.put(torus(r, 0.003, Math.PI * 2, 40), K.gloss('#3a3a48'), x, y + 0.035, 0.03, 0, Math.PI / 2);
    K.put(cyl(0.075, 0.01, 0.075, 24), K.gloss(K.pal.c), x, y + 0.036, 0.03);
    K.put(cyl(0.008, 0.04, 0.008, 8), K.metal(), x, y + 0.05, 0.03);
    K.put(cyl(0.035, 0.05, 0.04, 16), K.metal(), 0.37, y + 0.025, -0.2);
    rod(K, L, K.metal(), [0.37, y + 0.06, -0.2], [0.16, y + 0.06, 0.12], 0.009);
    K.put(rbox(0.04, 0.02, 0.06, 0.006), K.gloss(COAL), 0.15, y + 0.05, 0.14, -0.6);
    K.put(rbox(0.38, 0.38, 0.012, 0.006), K.pic(sleeve(K.pal.c, K.pal.p)), -0.24, y + 0.19, -0.27, 0, -0.22);
  },

  radio(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, body = K.gloss(K.pal.c), f = 0.17;
    // the case, the speaker's grille, a lit dial and two knobs, a carry handle, the aerial
    K.put(rbox(u(28), u(24), 0.34, 0.06), body, 0, u(12), 0);
    K.put(rbox(u(13), u(14), 0.012, 0.01), K.plain(L.tone(K.pal.c, 0.5)), X(11.5), u(11), f);
    for (let i = 0; i < 6; i++) K.put(rbox(u(12), 0.014, 0.014, 0.005), K.metal(L.tone(K.pal.c, 1.25)), X(11.5), u(5.5) + i * u(2), f + 0.01);
    K.put(rbox(u(8), u(3), 0.012, 0.006), K.glow('#f8e8b0'), X(24), u(20.5), f);
    K.put(rbox(0.008, u(3), 0.016), K.plain('#e04848'), X(23.5), u(20.5), f + 0.002);
    K.put(cyl(u(3), 0.05, u(3), 24).rotateX(Math.PI / 2), K.gloss(K.pal.a), X(24), u(15), f + 0.02);
    K.put(cyl(u(2), 0.04, u(2), 20).rotateX(Math.PI / 2), K.gloss(K.pal.p), X(24), u(7), f + 0.015);
    K.put(tube(L, [[-0.24, u(23.5), 0], [-0.22, u(27.5), 0], [0, u(28.5), 0], [0.22, u(27.5), 0], [0.24, u(23.5), 0]], 0.028, 24), K.gloss(L.tone(K.pal.c, 0.7)));
    rod(K, L, K.metal(), [X(14.5), u(24), -0.1], [X(8), u(44), -0.1], 0.01);
    K.put(ball(0.022, 10, 8), K.metal(), X(8), u(44.5), -0.1);
  },

  computer(K, s, W, D, L) {
    const { rbox, cyl, blob, legsAt, leg } = L, wood = K.wood(L.tone(K.pal.w, 1.08)), case_ = K.gloss(K.pal.m);
    // a little desk, the monitor's screen where the painting's is, a keyboard and mouse
    for (const [x, z] of legsAt(0.96, 0.6, 0.05)) leg(K, K.wood(L.tone(K.pal.w, 0.85)), x, z, u(22), 0.03);
    K.put(rbox(0.98, 0.05, 0.62, 0.015), wood, 0, u(23), 0);
    K.put(rbox(0.9, 0.1, 0.54, 0.01), wood, 0, u(19.5), 0);
    K.put(rbox(u(26), u(20), 0.07, 0.03), case_, 0, u(40), -0.12);
    K.put(rbox(u(20), u(15), 0.16, 0.05), case_, 0, u(40), -0.22);
    K.put(rbox(u(20), u(14), 0.01, 0.006), K.glow('#68c8f8'), 0, u(40), -0.081);
    K.put(cyl(0.05, u(6), 0.06, 16), K.gloss(L.tone(K.pal.m, 0.8)), 0, u(27), -0.15);
    K.put(rbox(0.26, 0.02, 0.16, 0.01), K.gloss(L.tone(K.pal.m, 0.8)), 0, u(24) + 0.01, -0.15);
    K.put(rbox(u(18), 0.03, 0.17, 0.012), K.gloss(K.pal.p), X(13), u(24) + 0.015, 0.14, 0, 0.06);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) K.put(rbox(0.05, 0.012, 0.035, 0.004), K.plain(L.tone(K.pal.p, 0.82)), X(13) - 0.245 + c * 0.07, u(24) + 0.034 - r * 0.003, 0.09 + r * 0.05);
    K.put(blob(0.07, 0.04, 0.1, 0.5, 0.6), K.gloss(K.pal.p), X(26), u(24) + 0.02, 0.15);
  },

  console(K, s, W, D, L) {
    const { rbox, ball } = L, body = K.gloss(K.pal.m), pad = K.gloss(K.pal.p);
    // the console, its cartridge in the theme's colour, a light; two controllers on their cords in front
    K.put(rbox(u(24), 0.26, 0.46, 0.04), body, 0, 0.13, -0.12);
    K.put(rbox(u(22), 0.02, 0.42, 0.01), K.gloss(L.tone(K.pal.m, 1.3)), 0, 0.26, -0.12);
    K.put(rbox(u(8), u(4), 0.012, 0.005), K.gloss(K.pal.c), X(11), u(5), 0.112);
    K.put(rbox(0.26, 0.1, 0.12, 0.01), K.gloss(K.pal.c), 0, 0.3, -0.18);
    K.put(rbox(u(3), u(2), 0.012, 0.004), K.gloss(K.pal.a), X(21.5), u(6), 0.112);
    K.put(ball(0.016, 10, 8), K.glow('#68e868'), X(24.5), u(6), 0.112);
    for (const [x, turn] of [[X(9), 0.25], [X(24), -0.2]]) {
      const z = 0.32;
      K.put(rbox(u(12), 0.05, 0.16, 0.035), pad, x, 0.03, z, turn);
      const at = (dx, dz) => [x + dx * Math.cos(turn) + dz * Math.sin(turn), z - dx * Math.sin(turn) + dz * Math.cos(turn)];
      for (const [w, d] of [[0.08, 0.025], [0.025, 0.08]]) { const [px, pz] = at(-0.09, 0); K.put(rbox(w, 0.012, d, 0.004), K.gloss(COAL), px, 0.058, pz, turn); }
      for (const [dx, dz, c] of [[0.09, -0.02, K.pal.c], [0.12, 0.02, '#4a7ac8']]) { const [px, pz] = at(dx, dz); K.put(ball(0.016, 10, 8), K.gloss(c), px, 0.058, pz); }
      const [cx, cz] = at(0, -0.08);
      K.put(tube(L, [[cx, 0.03, cz], [cx * 0.8, 0.02, 0.18], [x * 0.5, 0.06, 0.12], [x * 0.4, 0.08, 0.11]], 0.008, 16), K.plain(COAL));
    }
  },

  fan(K, s, W, D, L) {
    const { lathe, cyl, ball, torus, rbox } = L, metal = K.metal(), wire = K.metal(L.tone(K.pal.m, 1.7)), y = u(42), z0 = 0.02;
    // a round foot, the pole and its collar, the motor, three blades in a wire cage
    K.put(lathe([[0, 0], [0.28, 0], [0.28, 0.025], [0.22, 0.06], [0, 0.07]], 32), metal);
    K.put(cyl(u(1.5), u(30) - 0.06, u(1.5), 14), metal, 0, 0.06 + (u(30) - 0.06) / 2, -0.06);
    K.put(cyl(0.065, u(2), 0.065, 18), K.metal(L.tone(K.pal.m, 1.3)), 0, u(13), -0.06);
    K.put(rbox(0.07, 0.14, 0.07, 0.02), metal, 0, u(30) + 0.04, -0.06);
    K.put(ball(1, 20, 16).scale(0.11, 0.11, 0.15), metal, 0, y, -0.12);
    for (let i = 0; i < 3; i++) {
      const a = i / 3 * Math.PI * 2 + 0.4;
      K.put(ball(1, 18, 10).scale(0.17, 0.08, 0.012).translate(0.2, 0, 0).rotateX(0.25).rotateZ(a), K.gloss(K.pal.c), 0, y, z0);
    }
    K.put(ball(0.05, 14, 10), metal, 0, y, z0 + 0.04);
    K.put(torus(0.41, 0.012, Math.PI * 2, 48), wire, 0, y, -0.05);
    K.put(torus(0.41, 0.012, Math.PI * 2, 48), wire, 0, y, 0.09);
    for (const r of [0.13, 0.27]) K.put(torus(r, 0.007, Math.PI * 2, 40), wire, 0, y, 0.1);
    K.put(cyl(0.05, 0.012, 0.05, 18).rotateX(Math.PI / 2), wire, 0, y, 0.1);
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a);
      rod(K, L, wire, [c * 0.05, y + sn * 0.05, 0.1], [c * 0.41, y + sn * 0.41, 0.09], 0.005);
      rod(K, L, wire, [c * 0.41, y + sn * 0.41, -0.05], [c * 0.41, y + sn * 0.41, 0.09], 0.005);
    }
  },

  drum(K, s, W, D, L) {
    const { cyl, ball } = L, rim = K.gloss(K.pal.a), cord = K.plain(L.tone(K.pal.a, 0.75)), r = u(12);
    // the shell between two gold rims, the cords laced in a zigzag, its head, two sticks across it
    K.put(cyl(r, u(19), r, 40), K.gloss(K.pal.c), 0, u(2) + u(19) / 2, 0);
    for (const y of [u(1), u(21)]) K.put(cyl(r + 0.015, u(2), r + 0.015, 40), rim, 0, y, 0);
    K.put(cyl(r - 0.01, 0.012, r - 0.01, 40), K.gloss(K.pal.p), 0, u(22) + 0.006, 0);
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2, b = (i + 0.5) / 12 * Math.PI * 2, R = r + 0.006;
      rod(K, L, cord, [Math.sin(a) * R, u(20), Math.cos(a) * R], [Math.sin(b) * R, u(3), Math.cos(b) * R], 0.007);
      rod(K, L, cord, [Math.sin(b) * R, u(3), Math.cos(b) * R], [Math.sin(a + Math.PI / 6) * R, u(20), Math.cos(a + Math.PI / 6) * R], 0.007);
    }
    for (const [a, b] of [[[-0.28, u(22) + 0.02, 0.16], [0.22, u(22) + 0.08, -0.2]], [[0.26, u(22) + 0.02, 0.18], [-0.2, u(22) + 0.09, -0.18]]]) {
      rod(K, L, K.wood(), a, b, 0.014);
      K.put(ball(0.022, 10, 8), K.wood(), ...b);
    }
  },

  guitar(K, s, W, D, L) {
    const { THREE, rbox, cyl, ball, torus } = L;
    // leaning back a little in its stand: everything is built upright, then tipped about the floor
    const lean = (geo, m, x, y, z) => { geo.translate(x, y, z); geo.rotateX(-0.1); K.put(geo, m, 0, 0, 0.06); };
    const half = (y) => {
      const e = (cy, rx, ry) => { const t = (y - cy) / ry; return Math.abs(t) < 1 ? rx * Math.sqrt(1 - t * t) : 0; };
      return Math.max(e(u(14), u(9.5), u(8.5)), e(u(26), u(7.5), u(6.5)), y > u(10) && y < u(29) ? 0.17 : 0);
    };
    const pts = [];
    for (let i = 0; i <= 40; i++) { const y = u(5.5) + (u(32.5) - u(5.5)) * i / 40; pts.push([half(y), y]); }
    for (let i = 40; i >= 0; i--) { const [hx, y] = pts[i]; pts.push([-hx, y]); }
    lean(slab(L, poly(L, pts), 0.13, 0.02), K.gloss(K.pal.c), 0, 0, 0);
    lean(cyl(u(3), 0.01, u(3), 28).rotateX(Math.PI / 2), K.plain('#2a1a10'), 0, u(20), 0.066);
    lean(torus(u(3) + 0.012, 0.008, Math.PI * 2, 28), K.gloss(K.pal.p), 0, u(20), 0.068);
    lean(rbox(u(7), u(2), 0.03, 0.008), K.wood(L.tone(K.pal.w, 0.7)), 0, u(10), 0.075);
    lean(rbox(u(4), u(36), 0.05, 0.012), K.wood(L.tone(K.pal.w, 0.85)), 0, u(44), 0.03);
    for (let j = u(29); j < u(61); j += u(4)) lean(rbox(u(4), 0.006, 0.006), K.metal(K.pal.p), 0, j, 0.057);
    lean(rbox(u(8), u(9), 0.04, 0.015), K.wood(L.tone(K.pal.w, 0.85)), 0, u(65.5), 0.02);
    for (let j = 0; j < 3; j++) for (const sg of [-1, 1]) lean(ball(0.022, 10, 8), K.gloss(K.pal.a), sg * u(4.5), u(67.5) - j * u(3), 0.02);
    for (const x of [-0.03, -0.01, 0.01, 0.03]) lean(rbox(0.004, u(53), 0.004), K.metal('#e8e8e8'), x, u(10) + u(26.5), 0.07);
    // the stand: a foot, two cradle arms, a back brace up to the neck
    const steel = K.metal();
    K.put(rbox(u(16), 0.04, 0.36, 0.015), steel, 0, 0.02, 0.02);
    for (const sg of [-1, 1]) {
      K.put(cyl(0.015, u(10), 0.015, 10), steel, sg * u(5), u(5) + 0.02, 0.1);
      K.put(rbox(0.04, 0.03, 0.12, 0.01), K.gloss(COAL), sg * u(5), u(10) + 0.02, 0.12);
    }
    rod(K, L, steel, [0, 0.04, -0.14], [0, 1.25, -0.08], 0.014);
    K.put(rbox(0.12, 0.04, 0.05, 0.015), K.gloss(COAL), 0, 1.25, -0.06);
  },

  bin(K, s, W, D, L) {
    const { lathe, cyl, torus, rbox } = L, metal = K.metal();
    // a tapered can, ribbed, an accent band, its domed lid and handle, a pedal
    K.put(lathe([[0, 0], [0.25, 0], [0.26, 0.02], [u(10), u(26)], [0, u(26)]], 36), metal);
    for (const y of [0.12, 0.7]) K.put(torus(0.25 + y * 0.075, 0.008, Math.PI * 2, 36), K.metal(L.tone(K.pal.m, 1.2)), 0, y, 0, 0, Math.PI / 2);
    K.put(lathe([[0.28, u(14.5)], [0.29, u(14.5)], [0.3, u(17.5)], [0.29, u(17.5)]], 36), K.gloss(K.pal.a));
    K.put(lathe([[0, u(26)], [0.34, u(26)], [0.34, u(26) + 0.03], [0.26, u(27.5)], [0, u(28)]], 36), K.metal(L.tone(K.pal.m, 1.25)));
    K.put(torus(0.08, 0.016, Math.PI, 18), K.metal(L.tone(K.pal.m, 0.8)), 0, u(28), 0);
    K.put(rbox(0.16, 0.03, 0.08, 0.01), K.metal(L.tone(K.pal.m, 0.7)), 0, 0.04, 0.29);
    K.put(cyl(0.012, 0.06, 0.012, 8), K.metal(L.tone(K.pal.m, 0.7)), 0, 0.06, 0.25);
  },

  umbrellas(K, s, W, D, L) {
    const { lathe, cyl, torus } = L, wood = K.wood();
    // a round wooden stand, two closed umbrellas leaning in it, their hooked handles up
    K.put(lathe([[0, 0.04], [0.27, 0.04], [0.29, 0], [0.31, 0], [0.31, u(24)], [0.29, u(24)], [0.28, 0.06]], 36), wood);
    K.put(lathe([[0.314, u(12)], [0.318, u(12)], [0.318, u(14)], [0.314, u(14)]], 36), K.gloss(K.pal.a));
    K.put(torus(0.3, 0.014, Math.PI * 2, 36), K.wood(L.tone(K.pal.w, 1.15)), 0, u(24), 0, 0, Math.PI / 2);
    for (const [x, z, h, col, tilt] of [[X(12), 0.04, u(48), K.pal.c, 0.08], [X(21), -0.05, u(52), K.pal.a, -0.07]]) {
      const lean = (geo, m) => { geo.rotateZ(tilt); geo.translate(x, 0, z); K.put(geo, m); };
      lean(lathe([[0, 0.12], [0.06, 0.4], [0.105, 0.72], [0.12, 0.92], [0.1, h - 0.36], [0.03, h - 0.22], [0, h - 0.2]], 8), K.gloss(col));
      lean(torus(0.115, 0.012, Math.PI * 2, 12).rotateX(Math.PI / 2).translate(0, 0.86, 0), K.gloss(L.tone(col, 0.7)));
      lean(cyl(0.012, 0.18, 0.012, 8).translate(0, h - 0.13, 0), K.metal());
      lean(torus(0.045, 0.016, Math.PI, 14).translate(0.045, h - 0.04, 0), K.plain(L.tone(col, 0.45)));
    }
  },

  coatrack(K, s, W, D, L) {
    const { lathe, ball, cyl, rbox, torus } = L, wood = K.wood();
    // a turned pole on four splayed feet, two rings of pegs, a hat on one and a striped scarf on another
    K.put(lathe([[0.06, 0.06], [0.07, 0.12], [0.045, 0.2], [0.04, 1.2], [0.04, 2.28], [0.05, 2.3], [0, 2.3]], 18), wood);
    K.put(ball(0.05, 14, 10), wood, 0, u(76), 0);
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + Math.PI / 4;
      rod(K, L, wood, [0, 0.3, 0], [Math.sin(a) * 0.32, 0.03, Math.cos(a) * 0.32], 0.025);
      K.put(ball(0.03, 10, 8), wood, Math.sin(a) * 0.33, 0.03, Math.cos(a) * 0.33);
    }
    const peg = (a, y) => { const c = Math.cos(a), sn = Math.sin(a); rod(K, L, wood, [c * 0.03, y, sn * 0.03], [c * 0.16, y + 0.07, sn * 0.16], 0.014); K.put(ball(0.022, 10, 8), wood, c * 0.16, y + 0.07, sn * 0.16); };
    for (let i = 0; i < 4; i++) { peg(i * Math.PI / 2, u(70)); peg(i * Math.PI / 2 + Math.PI / 4, u(58)); }
    const hat = (geo, m) => { geo.rotateZ(0.35); geo.translate(-0.2, u(72.5), 0); K.put(geo, m); };
    hat(cyl(0.17, 0.016, 0.17, 28), K.cloth(K.pal.c));
    hat(lathe([[0.11, 0], [0.105, 0.11], [0.09, 0.13], [0, 0.135]], 24), K.cloth(K.pal.c));
    hat(cyl(0.112, 0.03, 0.112, 24).translate(0, 0.02, 0), K.cloth(K.pal.a));
    // the scarf over the right peg, its two tails hanging, striped
    const sx = 0.17, sy = u(70) + 0.08, stripe = [K.cloth(K.pal.a), K.cloth(L.tone(K.pal.a, 0.75))];
    K.put(cyl(0.035, 0.12, 0.035, 14).rotateX(Math.PI / 2), stripe[0], sx, sy, 0);
    for (const [z, n] of [[0.035, 10], [-0.035, 6]]) for (let i = 0; i < n; i++) {
      K.put(rbox(0.13, 0.09, 0.025, 0.01), stripe[i % 2], sx + 0.02 + Math.sin(i / 1.6) * 0.025, sy - 0.05 - i * 0.088, z, 0, 0, Math.sin(i / 1.6) * 0.15);
    }
    for (let i = 0; i < 4; i++) K.put(cyl(0.005, 0.05, 0.005, 6), stripe[1], sx - 0.03 + i * 0.03 + Math.sin(9 / 1.6) * 0.025, sy - 0.05 - 9.5 * 0.088 - 0.03, 0.035);
    K.put(torus(0.03, 0.006, Math.PI * 2, 12), wood, 0, u(76) + 0.06, 0);
  },

  paperlantern(K, s, W, D, L) {
    const { rbox, cyl, lathe, torus } = L, cap = K.wood(L.tone(K.pal.w, 0.85));
    // a block foot, a post, the paper lantern between two wooden caps, its ribs, a flame painted on its front
    K.put(rbox(u(14), u(6), u(14), 0.02), K.wood(), 0, u(3), 0);
    K.put(cyl(0.04, u(21), 0.04, 12), cap, 0, u(6) + u(10.5), 0);
    const y0 = u(29), y1 = u(59), r = (y) => (Math.sin((y - y0) / (y1 - y0) * 0.94 * Math.PI + 0.1) * 10 + 3) / 32;
    const prof = Array.from({ length: 21 }, (_, i) => { const y = y0 + (y1 - y0) * i / 20; return [r(y), y]; });
    K.put(lathe([[0, y0], ...prof, [0, y1]], 36), K.glow(K.pal.g));
    for (let i = 1; i < 5; i++) { const y = y0 + (y1 - y0) * i / 5; K.put(torus(r(y) + 0.004, 0.006, Math.PI * 2, 36), K.glow(L.tone(K.pal.g, 0.72)), 0, y, 0, 0, Math.PI / 2); }
    for (const y of [u(27.5), u(60.5)]) K.put(cyl(u(8), u(3), u(8), 28), cap, 0, y, 0);
    K.put(flame(L, 0.12, 0.2, 0.006), K.gloss(K.pal.c), 0, u(41), r(u(45)) + 0.005);
    K.put(torus(0.04, 0.008, Math.PI, 12), cap, 0, u(62), 0);
  },

  birdcage(K, s, W, D, L) {
    const { lathe, cyl, torus, ball } = L, metal = K.metal(), R = 0.36, y0 = u(28) + 0.04, ys = u(42);
    // a stand, a tray, sixteen bars up into a dome, a perch with a little bird on it
    K.put(lathe([[0, 0], [0.22, 0], [0.22, 0.025], [0.06, 0.08], [0, 0.08]], 32), metal);
    K.put(cyl(0.028, u(26) - 0.08, 0.028, 12), metal, 0, 0.08 + (u(26) - 0.08) / 2, 0);
    K.put(lathe([[0, u(26)], [0.38, u(26) + 0.01], [0.41, y0 - 0.01], [0.39, y0], [0, y0]], 36), metal);
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a);
      const at = (k, y) => [c * R * k, y, sn * R * k];
      K.put(tube(L, [at(1, y0), at(1, ys), at(0.9, ys + 0.12), at(0.62, ys + 0.24), at(0.25, u(51.5)), at(0.02, u(52))], 0.007, 24), metal);
    }
    for (const y of [y0 + 0.02, ys]) K.put(torus(R, 0.01, Math.PI * 2, 48), metal, 0, y, 0, 0, Math.PI / 2);
    K.put(ball(0.05, 14, 10), K.gloss(K.pal.a), 0, u(54), 0);
    K.put(torus(0.04, 0.008, Math.PI * 2, 16), metal, 0, u(54) + 0.08, 0);
    rod(K, L, K.wood(), [-0.33, u(38), 0], [0.33, u(38), 0], 0.014);
    const brown = K.gloss('#b8885a');
    K.put(ball(1, 16, 12).scale(0.11, 0.085, 0.085), brown, -0.03, u(42), 0);
    K.put(ball(1, 12, 10).scale(0.06, 0.05, 0.05), K.gloss('#f0e0c0'), -0.05, u(41), 0.04);
    K.put(ball(0.07, 14, 10), brown, -0.13, u(45), 0);
    K.put(L.cyl(0.001, 0.05, 0.022, 10).rotateZ(Math.PI / 2), K.gloss('#f0b040'), -0.22, u(45), 0);
    for (const sg of [-1, 1]) K.put(ball(0.012, 8, 6), K.gloss(COAL), -0.17, u(46), sg * 0.05);
    K.put(L.rbox(0.1, 0.02, 0.06, 0.008), K.gloss('#8a6040'), 0.1, u(41.5), 0, 0, 0, -0.35);
  },

  cauldron(K, s, W, D, L) {
    const { lathe, cyl, torus, ball } = L, iron = K.gloss('#3a3a48');
    // three stubby legs, the pot, a thick rim, two ear handles, the bubbling brew
    for (const a of [0.5, 0.5 + Math.PI * 2 / 3, 0.5 + Math.PI * 4 / 3]) K.put(cyl(0.05, 0.16, 0.04, 12), K.gloss('#202028'), Math.sin(a) * 0.27, 0.08, Math.cos(a) * 0.27);
    K.put(lathe([[0, 0.1], [0.2, 0.11], [0.35, 0.2], [0.44, 0.36], [0.45, 0.5], [0.42, 0.66], [0.37, 0.76], [0.36, 0.8], [0.34, 0.8], [0.35, 0.72], [0, 0.72]], 40), iron);
    K.put(torus(0.38, 0.035, Math.PI * 2, 40), K.gloss('#4a4a58'), 0, 0.81, 0, 0, Math.PI / 2);
    K.put(cyl(0.355, 0.02, 0.355, 40), K.glow(K.pal.c), 0, 0.78, 0);
    for (const [x, z, r] of [[-0.18, 0.08, 0.06], [0.1, 0.16, 0.08], [-0.02, -0.12, 0.045], [0.18, -0.06, 0.035]]) K.put(ball(r, 14, 10).scale(1, 0.7, 1), K.glow(L.tone(K.pal.c, 1.25)), x, 0.79, z);
    for (const sg of [-1, 1]) K.put(torus(0.06, 0.014, Math.PI * 2, 16), K.gloss('#202028'), sg * 0.43, 0.66, 0, Math.PI / 2);
  },

  easel(K, s, W, D, L) {
    const { rbox, cyl, ball, THREE } = L, wood = K.wood(), dark = K.wood(L.tone(K.pal.w, 0.85)), lean = 0.09;
    // two front legs and a back one meeting at the top, a ledge with paints, the canvas leaning on it
    const zAt = (y) => 0.18 - lean * y;
    for (const sg of [-1, 1]) rod(K, L, wood, [sg * u(9), 0, zAt(0)], [sg * u(1.5), u(68), zAt(u(68))], 0.026);
    rod(K, L, dark, [0, u(70), zAt(u(70)) - 0.03], [0, 0, -0.42], 0.024);
    rod(K, L, wood, [-u(8), u(16), zAt(u(16))], [u(8), u(16), zAt(u(16))], 0.018);
    K.put(rbox(0.12, 0.08, 0.06, 0.015), wood, 0, u(70), zAt(u(70)) - 0.01);
    const ly = u(34), lz = zAt(ly) + 0.06;
    K.put(rbox(u(28), 0.04, 0.14, 0.01), wood, 0, ly, lz);
    K.put(rbox(u(28), 0.04, 0.015, 0.006), wood, 0, ly + 0.03, lz + 0.065);
    K.put(cyl(0.025, 0.12, 0.025, 12).rotateZ(Math.PI / 2), K.gloss(K.pal.c), X(8), ly + 0.045, lz - 0.01, 0.3);
    K.put(cyl(0.022, 0.1, 0.022, 12).rotateZ(Math.PI / 2), K.gloss('#4a7ac8'), X(13.5), ly + 0.043, lz + 0.02, -0.2);
    K.put(cyl(0.008, 0.24, 0.008, 8).rotateZ(Math.PI / 2), K.wood('#c89a60'), X(23), ly + 0.03, lz + 0.03, 0.1);
    K.put(cyl(0.012, 0.05, 0.006, 8).rotateZ(Math.PI / 2), K.gloss(K.pal.m), X(23) - 0.14, ly + 0.03, lz + 0.016, 0.1);
    const cy = u(50), cz = zAt(cy) + 0.05;
    K.put(rbox(u(26), u(28), 0.04, 0.006), K.plain(K.pal.p), 0, cy, cz, 0, -lean);
    K.put(new THREE.PlaneGeometry(u(26) - 0.02, u(28) - 0.02), K.pic(landscape()), 0, cy, cz + 0.021, 0, -lean);
    K.put(ball(0.02, 8, 6), wood, 0, cy + u(14) + 0.03, cz - 0.01);
  },

  pillar(K, s, W, D, L) {
    const { THREE, rbox, lathe, cyl, torus } = L, stone = K.gloss(K.pal.p), shade = K.gloss(L.tone(K.pal.p, 0.9));
    // an Ionic column: a square plinth, mouldings, a fluted shaft narrowing a little, scrolled capital, the abacus
    K.put(rbox(u(28), u(8), u(28), 0.02), stone, 0, u(4), 0);
    K.put(rbox(u(24), u(2), u(24), 0.01), shade, 0, u(9), 0);
    K.put(lathe([[0.36, u(10)], [0.37, u(10) + 0.03], [0.34, u(10) + 0.06], [0.33, u(10) + 0.07]], 40), stone);
    const y0 = u(10) + 0.07, y1 = u(69), shaft = new THREE.CylinderGeometry(0.31, 0.31, y1 - y0, 96, 12, true), pos = shaft.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i), y = pos.getY(i), a = Math.atan2(z, x), t = (y + (y1 - y0) / 2) / (y1 - y0);
      const k = (1 - 0.08 * t) * (1 - 0.06 * Math.max(0, Math.cos(a * 20)) ** 0.6);
      pos.setXYZ(i, Math.cos(a) * 0.31 * k, y, Math.sin(a) * 0.31 * k);
    }
    shaft.computeVertexNormals();
    K.put(shaft, stone, 0, (y0 + y1) / 2, 0);
    K.put(torus(0.295, 0.02, Math.PI * 2, 40), stone, 0, y1, 0, 0, Math.PI / 2);
    K.put(lathe([[0.27, y1], [0.33, y1 + 0.05], [0.36, u(72)], [0, u(72)]], 40), stone);
    K.put(rbox(u(26), u(4), u(22), 0.012), stone, 0, u(74), 0);
    for (const sg of [-1, 1]) {
      K.put(cyl(0.1, u(22), 0.1, 28).rotateX(Math.PI / 2), stone, sg * u(13.5), u(76), 0);
      for (const z of [-1, 1]) for (const [r, t] of [[0.07, 0.012], [0.035, 0.01]]) K.put(torus(r, t, Math.PI * 2, 24), K.gloss(L.tone(K.pal.p, 0.82)), sg * u(13.5), u(76), z * u(11.2));
    }
    K.put(rbox(u(30), u(3), u(30), 0.012), stone, 0, u(78.5), 0);
    K.put(rbox(u(30) + 0.004, u(1), u(30) + 0.004, 0.003), K.gloss(K.pal.a), 0, u(78), 0);
  },

  arcadecabinet(K, s, W, D, L) {
    const { THREE, rbox, cyl, ball, profileSlab } = L, col = K.pal.c, side = K.gloss(col), body = K.gloss(L.tone(col, 0.82)), black = K.gloss('#202028');
    // an upright cabinet in the theme's colour: its sides cut to the classic profile, a lit marquee, the screen in its
    // bezel where the painting's is, a control deck with a stick and two buttons, the coin door
    const P = [[-0.36, 0], [0.24, 0], [0.24, 1.08], [0.4, 1.16], [0.4, 1.3], [0.22, 1.36], [0.13, u(66)], [0.28, u(68)], [0.28, u(80)], [-0.36, u(80)]];
    const half = u(14), T = 0.06;
    for (const x of [-half, half - T]) K.put(profileSlab(P, T, x), side);
    K.put(profileSlab(P, half * 2 - T * 2, -half + T, 0.004), body);
    for (const sg of [-1, 1]) K.put(rbox(0.014, 1.06, 0.014, 0.005), black, sg * (half - 0.004), 0.54, 0.242);
    K.put(new THREE.PlaneGeometry(half * 2 - T * 2, u(8)), L.litPic(marquee(col), 0.8), 0, u(74), 0.283);
    const lean = (geo, m, out) => { geo.translate(0, 0, out); K.put(geo, m, 0, u(55), 0.175, 0, -0.13); };
    lean(rbox(half * 2 - T * 2, u(22), 0.02, 0.01), black, 0);
    lean(new THREE.PlaneGeometry(u(20), u(18)), K.glow('#68f0c8'), 0.012);
    lean(new THREE.PlaneGeometry(u(21), u(19)), K.glass(), 0.02);
    const deck = (geo, m, x, up, along) => { geo.translate(x, up, along); K.put(geo, m, 0, 1.31, 0.31, 0, 0.12); };
    deck(rbox(half * 2 - T * 2, 0.015, 0.16, 0.005), K.gloss(L.tone(col, 1.15)), 0, 0, 0);
    deck(cyl(0.035, 0.012, 0.035, 18), black, X(9), 0.012, 0);
    deck(cyl(0.008, 0.07, 0.008, 10), K.metal('#c8ccd8'), X(9), 0.045, 0);
    deck(ball(0.03, 16, 12), K.gloss('#e04848'), X(9), 0.09, 0);
    for (const [x, c] of [[X(18), K.pal.a], [X(23), '#4a7ac8']]) deck(cyl(0.024, 0.024, 0.026, 18), K.gloss(c), x, 0.018, 0.01);
    K.put(rbox(u(8), u(6), 0.02, 0.008), black, 0, u(21), 0.245);
    K.put(rbox(u(6), 0.012, 0.012, 0.004), K.glow('#f8c040'), 0, u(22), 0.258);
    K.put(rbox(half * 2 - T * 2, 0.06, 0.02, 0.008), black, 0, 0.03, 0.245);
  },

  jukebox(K, s, W, D, L) {
    const { THREE, rbox, cyl, torus } = L, wood = K.wood(), r = u(14), cy = u(54);
    // an arch-topped cabinet: the glowing arch with its bubble tubes, records in a window, the speaker grille
    const body = new THREE.Shape();
    body.moveTo(-r, 0); body.lineTo(r, 0); body.lineTo(r, cy); body.absarc(0, cy, r, 0, Math.PI, false); body.lineTo(-r, 0);
    K.put(slab(L, body, 0.52, 0.02), wood, 0, 0, -0.02);
    const arch = (rr, y0) => { const a = new THREE.Shape(); a.moveTo(-rr, y0); a.lineTo(rr, y0); a.lineTo(rr, cy); a.absarc(0, cy, rr, 0, Math.PI, false); a.lineTo(-rr, y0); return a; };
    K.put(slab(L, arch(u(11.5), u(42)), 0.03, 0.006), K.glow(K.pal.g), 0, 0, 0.25);
    K.put(slab(L, arch(u(7), u(42)), 0.03, 0.006), K.glow(K.pal.gl), 0, 0, 0.262);
    for (let i = 0; i < 5; i++) {
      const x = X(8 + i * 4), top = cy + Math.sqrt(Math.max(0, u(11) ** 2 - x * x)) - 0.03, bot = u(43);
      K.put(cyl(0.022, top - bot, 0.022, 12), K.glow(L.tone(K.pal.g, 0.85)), x, (top + bot) / 2, 0.285);
    }
    K.put(torus(r - 0.01, 0.016, Math.PI, 36), K.metal(K.pal.a), 0, cy, 0.245);
    for (const sg of [-1, 1]) K.put(cyl(0.016, cy - u(6), 0.016, 10), K.metal(K.pal.a), sg * (r - 0.01), u(6) + (cy - u(6)) / 2, 0.245);
    K.put(rbox(u(20), u(12), 0.02, 0.01), K.plain(K.pal.p), 0, u(34), 0.24);
    for (let i = 0; i < 4; i++) K.put(cyl(0.1, 0.012, 0.1, 24).rotateZ(Math.PI / 2), K.gloss(BOOKS[i]), X(9 + i * 4), u(33), 0.26);
    K.put(new THREE.PlaneGeometry(u(20), u(12)), K.glass(), 0, u(34), 0.258);
    K.put(rbox(u(20), u(16), 0.02, 0.01), K.plain(L.tone(K.pal.w, 0.45)), 0, u(18), 0.24);
    for (let j = 0; j < 5; j++) K.put(cyl(0.01, u(18), 0.01, 8).rotateZ(Math.PI / 2), K.metal(L.tone(K.pal.m, 1.4)), 0, u(12) + j * u(3), 0.255);
    K.put(rbox(u(28), u(2), 0.02, 0.006), K.gloss(K.pal.a), 0, u(5), 0.245);
  },

  snowman(K, s, W, D, L) {
    const { ball, cyl, torus, rbox } = L, snow = K.plain('#f4f8fc'), coal = K.gloss(COAL);
    // two snowballs, a scarf with a tail, coal eyes and buttons, a carrot nose, a top hat, stick arms
    K.put(ball(1, 32, 24).scale(u(12), u(11.5), u(12)), snow, 0, u(11.5), 0);
    K.put(ball(u(9), 28, 20), snow, 0, u(31), 0);
    K.put(torus(0.2, 0.05, Math.PI * 2, 28), K.cloth(K.pal.c), 0, u(22.5), 0, 0, Math.PI / 2);
    K.put(rbox(0.12, 0.3, 0.04, 0.015), K.cloth(K.pal.c), X(22), u(17), 0.24, 0, 0.35, 0.12);
    for (const sg of [-1, 1]) K.put(ball(0.025, 10, 8), coal, sg * 0.09, u(34), 0.25);
    K.put(cyl(0.001, 0.2, 0.04, 14).rotateX(Math.PI / 2), K.gloss('#f08030'), 0.02, u(31.5), 0.37, 0.2);
    for (const y of [u(8), u(14)]) K.put(ball(0.03, 10, 8), coal, 0, y, Math.sqrt(u(12) ** 2 - (y - u(11.5)) ** 2) - 0.005);
    const hat = (geo, m) => { geo.rotateZ(-0.12); geo.translate(0, u(39), 0); K.put(geo, m); };
    hat(cyl(0.25, 0.03, 0.25, 32), coal);
    hat(cyl(0.16, 0.36, 0.16, 32).translate(0, 0.18, 0), coal);
    hat(cyl(0.165, 0.06, 0.165, 32).translate(0, 0.05, 0), K.cloth(K.pal.c));
    const stick = K.wood(L.tone(K.pal.w, 0.8));
    for (const sg of [-1, 1]) {
      rod(K, L, stick, [sg * 0.3, u(22), 0], [sg * 0.58, u(26), 0.04], 0.018);
      rod(K, L, stick, [sg * 0.48, u(24.5), 0.03], [sg * 0.54, u(29), 0.05], 0.012);
    }
  },

  standmirror(K, s, W, D, L) {
    const { THREE, rbox, cyl, ball } = L, wood = K.wood(), cy = u(46);
    // two posts on splayed feet, the oval mirror swung between them on gold knobs, tipped back a little
    for (const sg of [-1, 1]) {
      const x = sg * u(8.5);
      K.put(cyl(0.045, cy - u(8), 0.05, 14), wood, x, u(8) + (cy - u(8)) / 2, 0);
      rod(K, L, wood, [x, u(10), 0], [sg * u(15), 0.02, 0], 0.03);
      K.put(rbox(0.08, 0.05, 0.46, 0.02), wood, x, 0.025, 0);
      K.put(ball(0.05, 14, 10), K.gloss(K.pal.a), sg * u(10.5), cy, 0);
    }
    rod(K, L, wood, [-u(8.5), u(12), 0], [u(8.5), u(12), 0], 0.02);
    const ellipse = (rx, ry) => { const e = new THREE.Shape(); e.absellipse(0, 0, rx, ry, 0, Math.PI * 2, false); return e; };
    const ring = ellipse(u(11), u(28)); ring.holes.push(ellipse(u(8.5), u(25.5)));
    K.put(slab(L, ring, 0.05, 0.012), wood, 0, cy, 0, 0, -0.08);
    K.put(slab(L, ellipse(u(9), u(26)), 0.02, 0.004), K.wood(L.tone(K.pal.w, 0.8)), 0, cy, -0.01, 0, -0.08);
    K.put(new THREE.ShapeGeometry(ellipse(u(8.6), u(25.6)), 48), K.M('gloss', '#c8e4f0', { key: 'mirror' }), 0, cy, 0.002, 0, -0.08);
    K.put(new THREE.ShapeGeometry(ellipse(0.03, 0.42), 24).rotateZ(-0.25), K.plain('#eef8fc'), -0.09, cy + 0.05, 0.006, 0, -0.08);
  },

  gong(K, s, W, D, L) {
    const { rbox, lathe, torus, cyl, ball } = L, wood = K.wood(), gold = K.metal(K.pal.a);
    // a wooden frame with upturned ends, the gong hung on two cords, a mallet leaning on the left post
    for (const sg of [-1, 1]) {
      K.put(rbox(u(4), u(72), 0.14, 0.02), wood, sg * u(13), u(36), 0);
      K.put(rbox(0.16, 0.08, 0.5, 0.02), wood, sg * u(13), 0.04, 0);
      K.put(L.cyl(0.001, 0.2, 0.08, 4).rotateZ(-sg * 0.5), K.gloss(K.pal.c), sg * u(14.5), u(80), 0, Math.PI / 4);
    }
    K.put(rbox(u(32), u(6), 0.18, 0.02), K.wood(L.tone(K.pal.w, 1.1)), 0, u(75), 0);
    K.put(rbox(u(24), 0.06, 0.1, 0.015), wood, 0, u(68), 0);
    for (const sg of [-1, 1]) rod(K, L, K.metal(), [sg * u(5.5), u(67), 0], [sg * u(4), u(61.5), 0.01], 0.006);
    const g = lathe([[0, 0.05], [0.06, 0.045], [0.11, 0.022], [0.14, 0.012], [0.38, 0.012], [0.42, 0.004], [0.44, -0.04], [0.43, -0.06], [0.41, -0.035], [0, -0.03]], 48);
    K.put(g.rotateX(Math.PI / 2), gold, 0, u(48), 0.02);
    for (const r of [0.28, 0.17]) K.put(torus(r, 0.006, Math.PI * 2, 40), K.metal(L.tone(K.pal.a, 0.8)), 0, u(48), 0.034);
    rod(K, L, wood, [X(5), 0.01, 0.22], [X(5) + 0.03, u(12), 0.12], 0.016);
    K.put(ball(1, 14, 10).scale(0.08, 0.07, 0.07), K.cloth(K.pal.c), X(5) + 0.03, u(12) + 0.04, 0.11);
  },

  toybox(K, s, W, D, L) {
    const { THREE, rbox, ball, cyl } = L, box = K.gloss(K.pal.c), rim = K.gloss(L.tone(K.pal.c, 1.15));
    // an open box, letter blocks on its front, its lid propped open behind, toys spilling out of the top
    const w = u(30), h = u(22), d = 0.62;
    K.put(rbox(w, h - 0.04, d, 0.04), box, 0, (h - 0.04) / 2, 0);
    K.put(rbox(w - 0.1, 0.01, d - 0.1, 0.004), K.plain(L.tone(K.pal.c, 0.45)), 0, h - 0.045, 0);
    for (const [x, z, ww, dd] of [[0, d / 2 - 0.03, w, 0.06], [0, -d / 2 + 0.03, w, 0.06], [-w / 2 + 0.03, 0, 0.06, d], [w / 2 - 0.03, 0, 0.06, d]]) K.put(rbox(ww, 0.06, dd, 0.02), rim, x, h - 0.04, z);
    ['A', 'B', 'C'].forEach((l, i) => {
      const c = [K.pal.a, K.pal.p, '#68b8f0'][i];
      K.put(rbox(u(7), u(7), 0.03, 0.01), K.gloss(c), X(7.5 + i * 9), u(12.5), d / 2 + 0.01);
      K.put(new THREE.PlaneGeometry(u(6), u(6)), K.pic(blockFace(c, l)), X(7.5 + i * 9), u(12.5), d / 2 + 0.026);
    });
    K.put(rbox(w, 0.05, d, 0.02), rim, 0, h + d / 2 - 0.02, -d / 2 - 0.03, 0, -Math.PI / 2 + 0.25);
    pokeBall(K, L, X(9), h + 0.08, 0.06, u(6), '#e04848');
    K.put(cyl(0.04, 0.42, 0.04, 14), K.gloss(K.pal.a), X(20), h + 0.12, -0.05, 0, 0, -0.18);
    K.put(ball(0.1, 16, 12), K.gloss(K.pal.a), X(20) + 0.05, h + 0.36, -0.05);
    K.put(rbox(u(6), u(6), u(6), 0.02), K.gloss('#68b8f0'), X(26), h + 0.06, 0.08, 0.5, 0, 0.3);
  },

  bookstack(K, s, W, D, L) {
    const { rbox, lathe, ball } = L, R = K.r, pages = K.plain('#f4f0e0');
    // six books lying flat, spines to the left, page edges showing; an inkpot and quill on top
    const t = u(5);
    [[3, 26], [5, 22], [2, 27], [6, 19], [4, 23], [8, 16]].forEach(([dx, bw], i) => {
      const cover = K.gloss(BOOKS[(i + 2) % BOOKS.length]), w = u(bw), d = 0.4 + (bw / 27) * 0.14, x = X(dx + bw / 2), y = i * t, turn = (R() - 0.5) * 0.3;
      const at = (geo, m, dx2, dy, dz = 0) => { geo.translate(dx2, dy, dz); geo.rotateY(turn); K.put(geo, m, x, y, 0); };
      at(rbox(w, 0.022, d, 0.008), cover, 0, 0.011);
      at(rbox(w, 0.022, d, 0.008), cover, 0, t - 0.011);
      at(rbox(0.03, t, d, 0.012), cover, -w / 2 + 0.015, t / 2);
      at(rbox(w - 0.04, t - 0.03, d - 0.03, 0.004), pages, 0.005, t / 2);
    });
    const y = 6 * t;
    K.put(lathe([[0, 0], [0.09, 0], [0.1, 0.03], [0.1, 0.13], [0.06, 0.16], [0.06, 0.2], [0.07, 0.21], [0, 0.21]], 24), K.gloss(K.pal.c), 0, y, 0);
    K.put(ball(1, 12, 10).scale(0.025, 0.16, 0.012), K.plain('#f0e8d0'), -0.04, y + 0.3, 0, 0, 0, 0.35);
    rod(K, L, K.plain('#c8b890'), [0.0, y + 0.12, 0], [-0.07, y + 0.42, 0], 0.005);
  },

  tent(K, s, W, D, L) {
    const { THREE, rbox, cyl, ball } = L, H = u(60), B = W / 2 - 0.02, Z = D / 2 - 0.08, col = K.pal.c;
    // an A-frame tent, its sides in stripes running down them, a back wall, a door open to the dark in front,
    // a pole and pennant on top, pegs at the corners, a lamp glowing in the doorway
    const slope = Math.atan2(H, B), len = Math.hypot(H, B), n = 8;
    for (const sg of [-1, 1]) for (let i = 0; i < n; i++) {
      const z = -Z + (i + 0.5) * (2 * Z / n);
      K.put(rbox(len, 0.025, 2 * Z / n + 0.002, 0.004).rotateZ(-sg * slope), K.cloth(i % 2 ? col : L.tone(col, sg < 0 ? 1.12 : 0.88)), sg * B / 2, H / 2, z);
    }
    K.put(slab(L, poly(L, [[-B, 0], [B, 0], [0, H]]), 0.02, 0.004), K.cloth(L.tone(col, 0.8)), 0, 0, -Z);
    const door = [[-0.42, 0], [0, u(30)], [0.42, 0]];
    for (const sg of [-1, 1]) K.put(slab(L, poly(L, sg < 0 ? [[-B, 0], [-0.42, 0], [0, u(30)], [0, H]] : [[0.42, 0], [B, 0], [0, H], [0, u(30)]]), 0.02, 0.004), K.cloth(L.tone(col, 1.05)), 0, 0, Z);
    K.put(new THREE.ShapeGeometry(poly(L, door)), K.plain('#2a2030'), 0, 0.002, Z - 0.03);
    for (const sg of [-1, 1]) rod(K, L, K.gloss(K.pal.a), [sg * 0.43, 0.01, Z + 0.015], [0, u(30) + 0.01, Z + 0.015], 0.012);
    K.put(cyl(0.025, 2 * Z, 0.025, 10).rotateX(Math.PI / 2), K.wood(), 0, H + 0.01, 0);
    K.put(cyl(0.022, u(9), 0.022, 10), K.wood(), 0, H + u(4.5), Z);
    K.put(slab(L, poly(L, [[0, 0], [0.24, -0.06], [0, -0.13]]), 0.008, 0.002), K.gloss(K.pal.a), 0.02, H + u(9), Z);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.put(rbox(0.04, 0.12, 0.04, 0.01), K.wood(L.tone(K.pal.w, 0.8)), sx * (B + 0.04), 0.06, sz * (Z + 0.02));
    K.put(ball(1, 16, 10).scale(0.07, 0.05, 0.07), K.glow('#ffd890'), 0.06, 0.05, Z - 0.12);
  },

  slide(K, s, W, D, L) {
    const { THREE, rbox, cyl } = L, metal = K.metal(), x2 = (n) => X(n, 2), py = u(50), zr = 0.26;
    // a ladder up the front of the platform at the left, rails round it, the chute curving down to the right
    for (const x of [x2(5.5), x2(19.5)]) for (const z of [zr, -zr]) K.put(cyl(0.04, py + 0.34, 0.04, 14), metal, x, (py + 0.34) / 2, z);
    for (let j = 6; j < 48; j += 7) K.put(cyl(0.02, x2(19.5) - x2(5.5), 0.02, 10).rotateZ(Math.PI / 2), K.metal(L.tone(K.pal.m, 1.3)), (x2(5.5) + x2(19.5)) / 2, u(j), zr);
    K.put(rbox(u(20), u(5), 0.62, 0.02), K.gloss(K.pal.c), (x2(2) + x2(22)) / 2, py - u(1), 0);
    for (const z of [zr, -zr]) if (z < 0) K.put(cyl(0.02, x2(19.5) - x2(5.5), 0.02, 10).rotateZ(Math.PI / 2), metal, (x2(5.5) + x2(19.5)) / 2, py + 0.3, z);
    K.put(cyl(0.02, 2 * zr, 0.02, 10).rotateX(Math.PI / 2), metal, x2(5.5), py + 0.3, 0);
    const x0 = x2(21), x1 = W / 2 - 0.04, top = [], bottom = [], walls = [];
    for (let i = 0; i <= 32; i++) {
      const t = i / 32, x = x0 + (x1 - x0) * t, y = 0.07 + (py - 0.07) * (1 - t) ** 1.5 * (t < 0.06 ? 1 : 1);
      top.push([x, y]); bottom.unshift([x, y - 0.04]); walls.push([x, y + 0.12]);
    }
    const chute = K.gloss(K.pal.a);
    K.put(slab(L, poly(L, [...top, ...bottom]), 0.42, 0.01), chute, 0, 0, 0);
    for (const z of [-0.2, 0.2]) K.put(slab(L, poly(L, [...walls, ...top.slice().reverse()]), 0.035, 0.012), K.gloss(L.tone(K.pal.a, 1.12)), 0, 0, z);
    for (const z of [-0.18, 0.18]) K.put(cyl(0.025, 0.12, 0.025, 10), metal, x1 - 0.08, 0.04, z);
    K.put(rbox(0.04, 0.6, 0.04, 0.01), metal, x0 + 0.42, 0.3, 0);
  },

  healer(K, s, W, D, L) {
    const { rbox, ball, cyl } = L, body = K.gloss(K.pal.p);
    // the Center's healing machine: a long white body, a band in the theme's colour, four lights, the tray up top with
    // six cups js/base-play.js's Poké Balls sit in (its `heal`), so nothing may stand over the tray
    K.put(rbox(W - 0.02, u(31), 0.62, 0.06), body, 0, u(15.5), 0);
    K.put(rbox(W - 0.18, u(6), 0.012, 0.006), K.gloss(K.pal.c), 0, u(17), 0.312);
    K.put(rbox(W - 0.18, 0.012, 0.014, 0.004), K.gloss(L.tone(K.pal.c, 1.3)), 0, u(19.8), 0.314);
    for (let i = 0; i < 4; i++) K.put(ball(u(2), 14, 10), K.glow(i % 2 ? '#68e868' : '#f8d030'), X(10 + i * 14, 2), u(8), 0.3);
    K.put(rbox(W + 0.02, 0.04, 0.66, 0.015), K.gloss(L.tone(K.pal.p, 0.9)), 0, u(31) + 0.02, 0);
    K.put(rbox(u(58), u(9), 0.5, 0.04), K.gloss(L.tone(K.pal.m, 0.85)), 0, u(32) + u(4.5), -0.02);
    for (let i = 0; i < 6; i++) K.put(cyl(0.065, 0.006, 0.065, 20), K.plain(L.tone(K.pal.m, 0.5)), -0.32 + (i % 3) * 0.16 + (i > 2 ? 0.08 : 0), u(41) + 0.003, 0.02 + (i > 2 ? 0.1 : -0.06));
  },
};
