/* base-models-o.js  -  the frontboxes of the Pokémon Center, the Gym, the spooky set, the office and the café, hand-built
   like the stove and the arcade cabinets (the user's ask, 2026-10-16: "3D detailed CLEAN models ... optimise them"; they
   were plain boxes wearing their painting on the front): real shelves with the goods stood on them, glass, doors, drawers,
   handles, keys, pipes, LEDs, panel seams.
   js/base-models-f.js's head says how a batch works. Each builder follows its painting (js/base-furniture-rooms.js and
   -rooms2.js) pixel for pixel: `u(n)` is n of its 32 pixels a tile, `X(n, W)` a pixel across the painting as x from the
   middle; a painting's `b - n` is `u(n)` up from the floor. The goods are low-poly (8-sided balls, boxes, 8-sided
   lathes), since a shelf holds two dozen of them. */

import { pokeBall } from './base-models-kit.js';

const u = (n) => n / 32;
const X = (n, W = 1) => n / 32 - W / 2;
const PI = Math.PI, TAU = PI * 2;
const BERRY = ['#e03838', '#4a78d8', '#f890b8', '#f0d848', '#7a4ab8', '#58b8a8'];
const INK = '#202028';

/* js/base-paint.js's shade steps and hash, so a part comes out the colour its painting paints it */
const STEP = { '-3': 0.32, '-2': 0.52, '-1': 0.74, 1: 1.2, 2: 1.42, 3: 1.7 };
function sh(hex, n) {
  const f = STEP[n], v = parseInt(hex.slice(1), 16), ch = [v >> 16, (v >> 8) & 255, v & 255];
  return '#' + ch.map((c, i) => Math.max(0, Math.min(255, Math.round(f <= 1 ? c * f + (i === 2 ? (1 - f) * 18 : 0) : c + (255 - c) * (f - 1) * (i === 2 ? 0.85 : 1))))).map(c => c.toString(16).padStart(2, '0')).join('');
}
const hash = (a, b = 0, c = 0) => { let h = (a * 374761393 + b * 668265263 + c * 2246822519) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

const bx = (L, w, h, d) => new L.THREE.BoxGeometry(w, h, d);
const sheet = (w, h, draw) => { const c = new OffscreenCanvas(w, h); draw(c.getContext('2d'), w, h); return c; };
const pics = {};
const once = (key, make) => pics[key] || (pics[key] = make());

/* the cash register's readout */
const tillScreen = () => once('till', () => sheet(96, 32, (g, w, h) => {
  g.fillStyle = '#68f0a0'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#e8fff0'; g.fillRect(4, 4, 22, 4);
  g.font = 'bold 22px monospace'; g.textBaseline = 'middle'; g.textAlign = 'right'; g.fillStyle = '#1a4a30';
  g.fillText('₽480', w - 6, h / 2 + 3);
}));

/** A thread from a to b ([x, y] at depth z), thin and four-sided: the witch's cobweb. */
function thread(K, L, m, a, b, z, r = 0.003) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  K.put(L.cyl(r, len, r, 4), m, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, z, 0, 0, -Math.atan2(b[0] - a[0], b[1] - a[1]));
}

/* what the Center's shelves hold, stood at x, y (the board's top), z: `i` picks the colour, `back` for the row behind,
   which leaves out what only shows from the front */
const GOODS = {
  potion(K, L, x, y, z, i, back) {
    const r = u(2), h = u(9), cap = K.gloss('#e8e8f0');
    K.put(L.lathe([[0, 0], [r, 0], [r, h * 0.78], [r * 0.5, h * 0.9], [r * 0.5, h], [0, h]], 8), K.gloss('#a868d8'), x, y, z);
    K.put(L.cyl(r * 1.05, u(3), r * 1.05, 8, true), K.gloss('#ffffff'), x, y + u(4.5), z);
    K.put(L.cyl(u(1), u(2), u(1), 6), cap, x, y + h + u(1), z);
    if (!back) K.put(bx(L, u(0.8), u(0.8), u(1.6)), cap, x, y + h + u(1.4), z + u(1.3));
  },
  ball(K, L, x, y, z, i, back) {
    const { THREE } = L, r = u(3), white = K.gloss('#f6f6f2'), dark = K.gloss('#26262e'), c = y + r;
    K.put(new THREE.SphereGeometry(r, 8, 3, 0, TAU, 0, PI / 2), K.gloss(['#e04848', '#3a6ac8', '#f0c838', '#7a3ab8'][i % 4]), x, c, z);
    K.put(new THREE.SphereGeometry(r, 8, 3, 0, TAU, PI / 2, PI / 2), white, x, c, z);
    if (back) return;
    K.put(L.cyl(r * 1.02, r * 0.16, r * 1.02, 8, true), dark, x, c, z);
    K.put(L.cyl(r * 0.34, r * 0.2, r * 0.34, 8).rotateX(PI / 2), dark, x, c, z + r * 0.92);
    K.put(L.cyl(r * 0.22, r * 0.12, r * 0.22, 8).rotateX(PI / 2), white, x, c, z + r * 1.02);
  },
  berry(K, L, x, y, z, i, back) {
    const r = u(3), leaf = K.gloss('#4f9a42');
    K.put(L.ball(r, 8, 6).scale(1, 0.92, 1), K.gloss(BERRY[i % 6]), x, y + r * 0.92, z);
    K.put(L.cyl(u(0.5), u(2), u(0.4), 5), leaf, x, y + r * 1.84 + u(0.7), z);
    if (!back) K.put(L.ball(u(1.6), 6, 4).scale(1, 0.3, 0.55), leaf, x + u(1.2), y + r * 1.84 + u(0.8), z, 0, 0, -0.5);
  },
  medicine(K, L, x, y, z, i, back) {
    const c = ['#f0d030', '#68c868', '#f08888', '#68b8f0'][i % 4];
    K.put(bx(L, u(4), u(7), u(3.4)), K.gloss(c), x, y + u(3.5), z);
    K.put(bx(L, u(4.3), u(2), u(3.7)), K.gloss('#ffffff'), x, y + u(8), z);
    if (!back) K.put(bx(L, u(2), u(3), 0.004), K.gloss(sh(c, 1)), x, y + u(4.5), z + u(1.7) + 0.002);
  },
};

export const SHAPES = {
  potionshelf: { make: 'shelfO', goods: 'potion', top: u(74) },
  ballshelf: { make: 'shelfO', goods: 'ball', top: u(74) },
  berryshelf: { make: 'shelfO', goods: 'berry', top: u(74) },
  medicineshelf: { make: 'shelfO', goods: 'medicine', top: u(74) },
  register: { make: 'register' },
  tmcase: { make: 'tmcase', top: u(38) },
  healpod: { make: 'healpod' },
  trophyshelf: { make: 'trophyshelf', top: u(78) },
  witchshelf: { make: 'witchshelf', top: u(72) },
  organ: { make: 'organ' },
  copier: { make: 'copier' },
  shredder: { make: 'shredder' },
  safe: { make: 'safe', top: u(30) },
  cubicle: { make: 'cubicle' },
  serverrack: { make: 'serverrack', top: u(78) },
  pastrycase: { make: 'pastrycase', top: u(46) },
};

export const MAKES = {
  shelfO(K, s, W, D, L) {
    const { rbox } = L, w = K.pal.w, wood = K.wood(), lite = K.wood(sh(w, 1)), d = 0.44, f = d / 2, put = GOODS[s.goods];
    // the carcass: two sides, a back (dark inside), a header wearing the theme's band, the top, a kick at the foot
    for (const sg of [-1, 1]) K.put(rbox(u(2), u(72), d, 0.012, 1), wood, sg * u(14), u(36), 0);
    K.put(bx(L, u(26), u(72), 0.02), wood, 0, u(36), -f + 0.01);
    K.put(new L.THREE.PlaneGeometry(u(26), u(62)), K.plain(sh(w, -2)), 0, u(35), -f + 0.021);
    K.put(rbox(u(26), u(6), d - 0.02, 0.006, 1), wood, 0, u(69), 0);
    K.put(rbox(u(28), u(4), 0.02, 0.006, 1), K.gloss(K.pal.c), 0, u(70), f + 0.006);
    K.put(rbox(u(32), u(2.5), d + 0.03, 0.01, 1), lite, 0, u(72.75), 0.005);
    K.put(bx(L, u(26), u(4), d - 0.04), wood, 0, u(2), -0.01);
    // three shelves, a price tag on each lip, four of the goods across and two deep
    const tag = K.plain('#ffffff');
    for (let row = 0; row < 3; row++) {
      const y = u(49 - 21 * row);
      K.put(rbox(u(28), u(3), d - 0.02, 0.008, 1), lite, 0, y - u(1.5), 0.01);
      K.put(bx(L, u(8), u(2), 0.006), tag, 0, y - u(1.6), f + 0.024);
      for (let i = 0; i < 4; i++) { put(K, L, X(7 + i * 6), y, 0.08, i + row, false); put(K, L, X(7 + i * 6), y, -0.1, i + row + 1, true); }
    }
  },

  register(K, s, W, D, L) {
    const { rbox, profileSlab } = L, { w, m, c } = K.pal, d = 0.6, f = d / 2, metal = K.gloss(m), shade = K.plain(sh(w, -2));
    // the counter: its body, the top in the theme's colour, a recessed kick, a panel picked out in grooves
    K.put(rbox(u(30), u(23), d, 0.02, 1), K.wood(), 0, u(14.5), 0);
    K.put(rbox(u(30.6), u(4), d + 0.02, 0.012, 1), K.gloss(c), 0, u(28), 0);
    K.put(bx(L, u(26), u(3), d - 0.06), shade, 0, u(1.5), -0.02);
    for (const [x, y, gw, gh] of [[0, 22, 22, 0.6], [0, 6, 22, 0.6], [-11, 14, 0.6, 16], [11, 14, 0.6, 16]]) K.put(bx(L, u(gw), u(gh), 0.006), shade, u(x), u(y), f + 0.001);
    // the cash drawer under the till, a keyhole in it
    K.put(rbox(u(24), u(3), 0.04, 0.006, 1), K.gloss(sh(m, -1)), 0, u(28.5), f + 0.02);
    K.put(L.cyl(u(0.7), 0.01, u(0.7), 8).rotateX(PI / 2), K.plain(INK), 0, u(28.5), f + 0.042);
    // the till: a wedge, its keys on the slope, the gold total key, the readout on its neck
    const z1 = 0.18, z2 = -0.06, rise = u(7), run = z1 - z2, a = Math.atan2(rise, run), y0 = u(30);
    K.put(profileSlab([[-0.2, 0], [z1, 0], [z1, u(3)], [z2, u(10)], [-0.2, u(10)]], u(24), -u(12), 0.008), metal, 0, y0, 0);
    const key = K.gloss(sh(m, 2)), on = (t) => [y0 + u(3) + t * rise + u(0.5), z1 - t * run + 0.004];
    for (let j = 0; j < 2; j++) for (let i = 0; i < 4; i++) { const [y, z] = on(0.3 + j * 0.38); K.put(bx(L, u(3), u(1), u(2.6)), key, X(8.5 + i * 5), y, z, 0, a); }
    { const [y, z] = on(0.12); K.put(L.ball(u(1.5), 8, 6), K.gloss('#f8d030'), X(26.5), y, z); }
    K.put(bx(L, u(4), u(3), u(3)), metal, 0, u(41.5), -0.12);
    K.put(rbox(u(16), u(8), 0.08, 0.015, 1), K.gloss(sh(m, -1)), 0, u(46), -0.12, 0, -0.12);
    K.put(new L.THREE.PlaneGeometry(u(12), u(4)).translate(0, 0, 0.041), L.litPic(tillScreen(), 0.6), 0, u(46), -0.12, 0, -0.12);
  },

  tmcase(K, s, W, D, L) {
    const { rbox, cyl } = L, { w, m, a } = K.pal, wood = K.wood(), d = 0.5, f = d / 2, steel = K.metal(m), glass = K.glass();
    // the cabinet: a raised door panel in its groove, a pull in the accent
    K.put(rbox(u(30), u(28), d, 0.02, 1), wood, 0, u(14), 0);
    K.put(bx(L, u(24), u(18), 0.006), K.plain(sh(w, -1)), 0, u(15), f + 0.002);
    K.put(rbox(u(22), u(16), 0.024, 0.006, 1), wood, 0, u(15), f + 0.012);
    K.put(rbox(u(4), u(1.2), 0.016, 0.004, 1), K.metal(a), 0, u(15), f + 0.04);
    for (const sg of [-1, 1]) K.put(bx(L, u(0.8), u(0.8), 0.02), K.metal(a), sg * u(1.6), u(15), f + 0.026);
    // the display: a metal tray and frame, glass all round, the discs stood up on velvet in two rows
    K.put(rbox(u(32), u(1.5), d + 0.02, 0.006, 1), steel, 0, u(28.75), 0);
    K.put(bx(L, u(29.6), u(1), d - 0.02), K.plain(sh(K.pal.c, -2)), 0, u(30), 0);
    const hx = u(16) - u(0.6), hz = f + 0.01 - u(0.6);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.put(bx(L, u(1.2), u(8), u(1.2)), steel, sx * hx, u(33.5), sz * hz);
    for (const sz of [-1, 1]) K.put(bx(L, u(32), u(1), u(1.2)), steel, 0, u(37.5), sz * hz);
    for (const sx of [-1, 1]) K.put(bx(L, u(1.2), u(1), d + 0.02), steel, sx * hx, u(37.5), 0);
    for (const sz of [-1, 1]) K.put(bx(L, u(29.6), u(7.5), 0.004), glass, 0, u(33.5), sz * (hz + u(0.3)));
    for (const sx of [-1, 1]) K.put(bx(L, 0.004, u(7.5), d - 0.02), glass, sx * (hx + u(0.3)), u(33.5), 0);
    K.put(bx(L, u(29.6), 0.004, d - 0.02), glass, 0, u(37.6), 0);
    const cols = ['#e04848', '#4a78d8', '#68c868', '#f0d030', '#a868d8'], hub = K.gloss('#ffffff');
    const disc = (x, y, z, c, tilt) => {
      K.put(cyl(u(2.5), 0.01, u(2.5), 14).rotateX(PI / 2), K.gloss(c), x, y, z, 0, tilt);
      K.put(cyl(u(0.8), 0.014, u(0.8), 8).rotateX(PI / 2), hub, x, y, z, 0, tilt);
    };
    for (let i = 0; i < 5; i++) disc(X(5.5 + i * 5.5), u(33), f - 0.08, cols[i], -0.08);
    for (let i = 0; i < 4; i++) disc(X(8.25 + i * 5.5), u(33.2), -0.05, cols[(i + 2) % 5], -0.18);
  },

  healpod(K, s, W, D, L) {
    const { cyl, lathe } = L, { m, c } = K.pal, metal = K.gloss(m), mint = K.glow('#a8f0d8'), band = K.glow('#e8fff8');
    // the base drum in the theme's band, a lit floor under the glass
    K.put(cyl(u(13.5), u(10), u(14), 24), metal, 0, u(5), 0);
    K.put(cyl(u(14.1), u(2), u(14.1), 24, true), K.gloss(c), 0, u(7), 0);
    K.put(cyl(u(12), 0.01, u(12), 24), mint, 0, u(10) + 0.005, 0);
    // the glass capsule, its light rings, the Poké Ball floating in it, two struts behind
    const pts = [[u(12), u(10)], [u(12), u(54)]];
    for (let k = 1; k <= 6; k++) { const t = k / 6 * PI / 2; pts.push([u(4) + u(8) * Math.cos(t), u(54) + u(8) * Math.sin(t)]); }
    pts.push([0, u(62)]);
    K.put(lathe(pts, 20), K.M('glass', '#a8f0d8', { key: 'pod' }), 0, 0, 0);
    for (let y = 14; y <= 54; y += 8) K.put(cyl(u(12.2), u(0.6), u(12.2), 20, true), band, 0, u(y), 0);
    pokeBall(K, L, 0, u(34), 0, u(6));
    for (const sg of [-1, 1]) K.put(cyl(u(0.8), u(50), u(0.8), 8), metal, sg * Math.sin(PI * 0.8) * u(12.6), u(35), Math.cos(PI * 0.8) * u(12.6));
    // the cap: a heavy ring, a bevel on top, lit underneath
    K.put(cyl(u(15), u(5.2), u(15), 24), metal, 0, u(62.6), 0);
    K.put(cyl(u(13), u(0.8), u(14.5), 24), K.gloss(sh(m, 1)), 0, u(65.6), 0);
    K.put(cyl(u(12), 0.01, u(12), 24), mint, 0, u(60) - 0.006, 0);
  },

  trophyshelf(K, s, W, D, L) {
    const { THREE, rbox, cyl, lathe } = L, { w, c, a } = K.pal, wood = K.wood(), lite = K.wood(sh(w, 1)), d = 0.44, f = d / 2;
    const gold = K.metal(a), glass = K.glass();
    // the carcass, its back lined in the theme's colour
    for (const sg of [-1, 1]) K.put(rbox(u(4), u(76), d, 0.014, 1), wood, sg * u(30), u(38), 0);
    K.put(bx(L, u(56), u(76), 0.02), wood, 0, u(38), -f + 0.01);
    K.put(new THREE.PlaneGeometry(u(56), u(66)), K.plain(sh(c, -2)), 0, u(37), -f + 0.021);
    K.put(rbox(u(56), u(3.5), d - 0.02, 0.006, 1), wood, 0, u(71.75), 0);
    K.put(rbox(u(64), u(5), d + 0.03, 0.012, 1), lite, 0, u(75.5), 0.005);
    K.put(bx(L, u(56), u(5), d - 0.04), wood, 0, u(2.5), -0.01);
    // three shelves of cups and medals, turn about
    const cup = [[0, 0], [u(3), 0], [u(3), u(1.2)], [u(2.2), u(1.8)], [u(2.2), u(3)], [u(0.9), u(3.4)], [u(0.8), u(6)], [u(2), u(6.4)], [u(3.6), u(9)], [u(4), u(12)], [u(3.6), u(12)], [0, u(7.6)]];
    for (let row = 0; row < 3; row++) {
      const y = u(52 - 22 * row);
      K.put(rbox(u(60), u(3), d - 0.02, 0.008, 1), lite, 0, y - u(1.5), 0.01);
      for (let i = 0; i < 4; i++) {
        const x = X(11 + i * 14, 2);
        if ((i + row) % 2) {
          K.put(lathe(cup, 12), gold, x, y, 0);
          for (const sg of [-1, 1]) K.put(new THREE.TorusGeometry(u(1.8), u(0.45), 5, 8, PI).rotateZ(-sg * PI / 2), gold, x + sg * u(3.8), y + u(9.5), 0);
        } else {
          const z = -f + 0.06;
          K.put(cyl(u(4), 0.016, u(4), 14).rotateX(PI / 2), K.metal(sh(a, -1)), x, y + u(5), z, 0, -0.1);
          K.put(cyl(u(3), 0.022, u(3), 14).rotateX(PI / 2), gold, x, y + u(5), z, 0, -0.1);
          for (const sg of [-1, 1]) K.put(bx(L, u(1.2), u(6), 0.006), K.gloss(c), x + sg * u(1.5), y + u(11.5), z - 0.014, 0, 0, sg * 0.12);
          K.put(L.ball(u(0.8), 8, 6), gold, x, y + u(14.6), -f + 0.03);
        }
      }
    }
    // two glass doors in thin frames, a knob each by the middle
    for (const sg of [-1, 1]) {
      const cx = sg * u(14), z = f + 0.012;
      for (const ex of [-1, 1]) K.put(bx(L, u(1.5), u(65), 0.02), wood, cx + ex * u(13.25), u(37.5), z);
      for (const ey of [-1, 1]) K.put(bx(L, u(28), u(1.5), 0.02), wood, cx, u(37.5) + ey * u(31.75), z);
      K.put(new THREE.PlaneGeometry(u(25), u(62)), glass, cx, u(37.5), z);
      K.put(L.ball(u(1), 8, 6), gold, sg * u(2), u(38), z + 0.02);
    }
  },

  witchshelf(K, s, W, D, L) {
    const { rbox, cyl, lathe, ball } = L, w = K.pal.w, dark = K.wood(sh(w, -1)), wood = K.wood(), d = 0.42, f = d / 2;
    const glass = K.glass(), bone = K.gloss('#e8e0cc'), hole = K.plain('#1e1a26'), cork = K.plain('#8a6a40');
    // the carcass, old and dark, black inside
    for (const sg of [-1, 1]) K.put(rbox(u(2), u(68), d, 0.012, 1), dark, sg * u(14), u(34), 0);
    K.put(bx(L, u(26), u(68), 0.02), dark, 0, u(34), -f + 0.01);
    K.put(new L.THREE.PlaneGeometry(u(26), u(62)), hole, 0, u(35), -f + 0.021);
    K.put(rbox(u(26), u(2), d - 0.02, 0.006, 1), dark, 0, u(67), 0);
    K.put(rbox(u(32), u(4), d + 0.03, 0.01, 1), wood, 0, u(70), 0.005);
    K.put(bx(L, u(26), u(4), d - 0.04), dark, 0, u(2), -0.01);
    // round flasks of glowing brews, a skull, a candle burning green
    const body = [[0, 0]];
    for (let k = 1; k <= 5; k++) { const t = -PI / 2 + k / 6 * PI; body.push([Math.cos(t) * u(3), u(5) + Math.sin(t) * u(5)]); }
    body.push([u(1), u(9.6)], [u(1), u(12)], [u(1.2), u(12.3)], [0, u(12.3)]);
    const brew = { '#a8f878': K.glow('#a8f878'), '#f878e8': K.glow('#f878e8'), '#78c8f8': K.gloss('#78c8f8'), '#f8b048': K.gloss('#f8b048') };
    const flask = (x, y, z, col) => {
      K.put(lathe(body, 10), glass, x, y, z);
      K.put(ball(u(2.6), 10, 6).scale(1, 1.55, 1), brew[col], x, y + u(4.4), z);
      K.put(cyl(u(1.1), u(1.4), u(0.9), 6), cork, x, y + u(12.7), z);
    };
    const skull = (x, y, z) => {
      K.put(ball(u(3.4), 10, 8).scale(1, 0.95, 1.1), bone, x, y + u(4.6), z);
      K.put(bx(L, u(4), u(2), u(3.4)), bone, x, y + u(1.2), z + u(0.8));
      for (const sg of [-1, 1]) K.put(ball(u(1), 6, 4), hole, x + sg * u(1.3), y + u(4.4), z + u(3));
      K.put(ball(u(0.55), 6, 4), hole, x, y + u(3), z + u(3.4));
    };
    const candle = (x, y, z) => {
      K.put(cyl(u(2.5), u(0.6), u(2.2), 10), cork, x, y + u(0.3), z);
      K.put(cyl(u(1.3), u(7), u(1.4), 8), bone, x, y + u(4.1), z);
      K.put(ball(u(0.6), 6, 4).scale(1, 2, 1), bone, x + u(1.2), y + u(6), z + u(0.4));
      K.put(cyl(0.003, u(1), 0.003, 4), hole, x, y + u(8), z);
      K.put(ball(u(0.9), 8, 6).scale(1, 2, 1), brew['#a8f878'], x, y + u(9.6), z);
    };
    for (let row = 0; row < 3; row++) {
      const y = u(49 - 21 * row);
      K.put(rbox(u(28), u(3), d - 0.02, 0.008, 1), wood, 0, y - u(1.5), 0.01);
      for (let i = 0; i < 3; i++) {
        const x = X(8 + i * 8);
        if (row === 1 && i === 1) skull(x, y, 0.02);
        else if (row === 2 && i === 2) candle(x, y, 0.02);
        else flask(x, y, 0.02, ['#a8f878', '#f878e8', '#78c8f8', '#f8b048'][(i + row) % 4]);
      }
    }
    // a cobweb in the top corner, a thread hanging from it
    const silk = K.plain('#e8e8f0'), zc = f - 0.03, cx = X(3), cy = u(66);
    for (const [ex, ey] of [[X(10), u(66)], [X(3), u(59)], [X(8), u(61)]]) thread(K, L, silk, [cx, cy], [ex, ey], zc);
    for (const t of [0.4, 0.75]) thread(K, L, silk, [cx + (X(10) - cx) * t, cy], [cx + (X(8) - cx) * t, cy + (u(61) - cy) * t], zc), thread(K, L, silk, [cx + (X(8) - cx) * t, cy + (u(61) - cy) * t], [cx, cy + (u(59) - cy) * t], zc);
    thread(K, L, silk, [X(4.5), u(66)], [X(4.5), u(53)], zc + 0.02);
    K.put(ball(u(0.9), 6, 4), K.plain(INK), X(4.5), u(52.4), zc + 0.02);
  },

  organ(K, s, W, D, L) {
    const { rbox, cyl, lathe, ball } = L, w = K.pal.w, wood = K.wood(), lite = K.wood(sh(w, 1)), pipe = K.metal(K.pal.a);
    const ivory = K.gloss('#ffffff'), ebony = K.gloss(INK), seam = K.plain('#c8c8c8'), shade = K.plain(sh(w, -1)), deep = K.plain(sh(w, -2));
    const d = 0.62, zc = -0.06, f = zc + d / 2, back = zc - d / 2;
    // the case: a lower body with a toe recess, two raised panels, the key slip, an upper body set back under the cap
    K.put(rbox(u(64), u(14), d, 0.02, 1), wood, 0, u(17), zc);
    K.put(rbox(u(64), u(10), d - 0.1, 0.02, 1), wood, 0, u(5), zc - 0.05);
    for (const sg of [-1, 1]) K.put(rbox(u(26), u(9), 0.02, 0.006, 1), wood, sg * u(15), u(16.5), f + 0.006);
    K.put(bx(L, u(56), u(2), 0.006), shade, 0, u(23), f + 0.003);
    const fu = 0.07;
    K.put(rbox(u(64), u(10), fu - back, 0.02, 1), wood, 0, u(29), (fu + back) / 2);
    K.put(bx(L, u(40), u(3.5), 0.006), shade, 0, u(32), fu + 0.003);
    K.put(rbox(u(64), u(4), fu - back + 0.04, 0.01, 1), lite, 0, u(36), (fu + back) / 2);
    for (const sg of [-1, 1]) K.put(rbox(u(4), u(9), f - fu, 0.008, 1), wood, sg * u(30), u(28.5), (f + fu) / 2);
    // two manuals, the upper overhanging the lower, white keys seamed, the black ones in the painting's pattern
    const manual = (y, h, z0, z1) => {
      const dz = z1 - z0, zm = (z0 + z1) / 2;
      K.put(bx(L, u(56), h, dz), ivory, 0, y, zm);
      for (let i = 4; i < 60; i += 3) K.put(bx(L, 0.004, h + 0.002, dz + 0.002), seam, X(i + 2, 2), y, zm);
      for (let i = 5; i < 59; i += 3) if (![2, 6].includes(Math.floor(i / 3) % 7)) K.put(bx(L, u(1.8), u(1.2), dz * 0.6), ebony, X(i + 3, 2), y + h / 2 + u(0.6), z0 + dz * 0.3);
    };
    K.put(bx(L, u(56), u(3), 0.05), wood, 0, u(25.5), fu + 0.025);
    manual(u(25), u(2), fu + 0.05, f);
    manual(u(28.25), u(2.5), fu, fu + 0.12);
    // drawstops on the cheeks
    for (const sg of [-1, 1]) for (let k = 0; k < 3; k++) {
      K.put(cyl(u(0.6), 0.03, u(0.6), 6).rotateX(PI / 2), deep, sg * u(30), u(26.5 + k * 2.5), f + 0.012);
      K.put(cyl(u(0.9), 0.012, u(0.9), 8).rotateX(PI / 2), ivory, sg * u(30), u(26.5 + k * 2.5), f + 0.03);
    }
    // the pedals out of the toe recess
    for (let i = 0; i < 6; i++) K.put(bx(L, u(5), u(2), 0.22), deep, X(11 + i * 9, 2), u(6.5), f - 0.07, 0, 0.12);
    // nine pipes on the cap, each on a cone foot with its mouth, a lamp in front of the outer two
    const pz = back + 0.11, mouth = K.plain('#303038');
    for (let i = 0; i < 9; i++) {
      const x = X((4 + i * 6.4 | 0) + 2.5, 2), r = u(2.5), top = u(30 + 30 + Math.round(Math.sin(i / 8 * PI) * 26)), y0 = u(38), y1 = u(39.5);
      K.put(lathe([[r * 0.35, 0], [r, y1 - y0], [0, y1 - y0]], 12), pipe, x, y0, pz);
      K.put(cyl(r, top - y1, r, 12, true), pipe, x, (top + y1) / 2, pz);
      K.put(cyl(r * 1.08, u(0.8), r * 1.08, 12, true), pipe, x, top - u(0.4), pz);
      K.put(bx(L, u(3), u(2), 0.01), mouth, x, u(40.5), pz + r * 0.92);
    }
    for (const sx of [6, 58]) {
      K.put(cyl(u(0.5), u(6), u(0.5), 6), pipe, X(sx, 2), u(41), fu - 0.06);
      K.put(ball(u(2), 10, 8), K.glow('#a868f8'), X(sx, 2), u(46), fu - 0.06);
    }
  },

  copier(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, { p, m, c } = K.pal, body = K.gloss(p), shade = K.gloss(sh(p, -1)), d = 0.56, f = d / 2, steel = K.metal(m), paper = K.plain('#ffffff');
    // the body on a dark base and four castors, two paper drawers with their pulls
    K.put(rbox(u(28), u(30), d, 0.025, 1), body, 0, u(19), 0);
    K.put(rbox(u(27), u(3.2), d - 0.04, 0.01, 1), K.plain(sh(p, -2)), 0, u(2.6), 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.put(cyl(u(1.1), u(1), u(1.1), 8).rotateZ(PI / 2), K.plain('#26262e'), sx * u(11), u(1.1), sz * (f - 0.07));
    for (const y of [22, 12]) {
      K.put(rbox(u(22), u(7.6), 0.03, 0.008, 1), shade, 0, u(y), f + 0.004);
      K.put(bx(L, u(6), u(1), 0.02), steel, 0, u(y + 0.5), f + 0.024);
    }
    // the output tray on its right, paper on it
    K.put(bx(L, u(4), u(0.6), d * 0.6), steel, X(30), u(30), 0, 0, 0, 0.12);
    K.put(bx(L, u(3.4), u(1.4), d * 0.5), paper, X(30), u(31.4), 0, 0, 0, 0.12);
    // the scanner on top, its cover and document feeder, a sheet waiting in it; the control panel, a lit LED
    K.put(rbox(u(30), u(8), d + 0.02, 0.02, 1), body, 0, u(38), 0);
    K.put(rbox(u(20), u(4), d - 0.08, 0.015, 1), shade, X(13), u(44), -0.02);
    K.put(bx(L, u(14), 0.006, 0.22), paper, X(13), u(46) + 0.01, -0.06, 0, -0.08);
    K.put(rbox(u(7), u(4), 0.03, 0.006, 1), K.gloss('#3a3a48'), X(25.5), u(39), f + 0.02);
    K.put(ball(u(0.6), 6, 4), K.glow('#68e868'), X(24.5), u(39.5), f + 0.036);
    K.put(ball(u(0.7), 6, 4), K.gloss(c), X(27.5), u(39.5), f + 0.036);
  },

  shredder(K, s, W, D, L) {
    const { rbox, ball } = L, { m, c } = K.pal, d = 0.4, f = d / 2, bin = K.gloss(m), white = K.plain('#ffffff');
    // the bin, a window in its front onto the shreds inside
    K.put(rbox(u(20), u(26), d, 0.02, 1), bin, 0, u(13), 0);
    K.put(bx(L, u(16), u(16), 0.004), K.plain('#3a4048'), 0, u(12), f + 0.003);
    for (let i = 0; i < 7; i++) K.put(bx(L, u(1), u(6), 0.004), white, X(9.5 + i * 2), u(9 - Math.floor(hash(i) * 4)), f + 0.006);
    K.put(bx(L, u(16), u(3), 0.004), white, 0, u(5.5), f + 0.006);
    K.put(bx(L, u(16), u(16), 0.003), K.glass(), 0, u(12), f + 0.012);
    const rim = K.gloss(sh(m, -1));
    for (const sg of [-1, 1]) { K.put(bx(L, u(1), u(17), 0.016), rim, sg * u(8.5), u(12), f + 0.006); K.put(bx(L, u(18), u(1), 0.016), rim, 0, u(12) + sg * u(8.5), f + 0.006); }
    // the cutting head in the theme's colour, its slot, a sheet going in, the LED
    K.put(rbox(u(24), u(6), d + 0.04, 0.02, 1), K.gloss(c), 0, u(29), 0);
    K.put(bx(L, u(16), 0.01, 0.025), K.plain(INK), 0, u(32) + 0.001, 0);
    K.put(bx(L, u(12), u(9), 0.006), white, 0, u(35.6), 0, 0, -0.08);
    for (let j = 0; j < 3; j++) K.put(bx(L, u(8), u(0.7), 0.004), K.plain('#c8c8d0'), 0, u(37.5 - j * 2), 0.004 + u(37.5 - j * 2 - 35.6) * 0.08, 0, -0.08);
    K.put(ball(u(0.7), 6, 4), K.glow('#68e868'), X(25.5), u(29.5), f + 0.022);
  },

  safe(K, s, W, D, L) {
    const { rbox, cyl } = L, { m, a } = K.pal, zc = -0.02, d = 0.56, fz = zc + d / 2, dark = K.plain(INK), brass = K.metal(a);
    // the body on four feet, the dark seam round the door, two hinges on its left
    K.put(rbox(u(26), u(28), d, 0.03, 1), K.metal(m), 0, u(16), zc);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.put(bx(L, u(4), u(2), u(4)), dark, sx * u(10), u(1), zc + sz * 0.2);
    K.put(bx(L, u(21), u(23), 0.004), dark, X(16), u(16), fz + 0.002);
    for (const y of [9, 23]) K.put(cyl(u(0.9), u(4), u(0.9), 8), K.metal(sh(m, -1)), X(5.6), u(y), fz + 0.03);
    // the door, hinged on its left: the dial with its pointer and ticks, the handle on two standoffs
    const door = K.door([X(6), fz + 0.03], 1), cx = X(14), cy = u(16);
    door(rbox(u(20), u(22), 0.05, 0.01, 1), K.metal(sh(m, 1)), X(16), u(16), fz + 0.03);
    door(cyl(u(5), 0.02, u(5), 16).rotateX(PI / 2), K.metal(sh(m, -1)), cx, cy, fz + 0.065);
    door(cyl(u(4), 0.03, u(4), 16).rotateX(PI / 2), brass, cx, cy, fz + 0.07);
    door(cyl(u(1.5), 0.03, u(1.5), 10).rotateX(PI / 2), brass, cx, cy, fz + 0.095);
    door(bx(L, u(0.6), u(2.4), 0.006), dark, cx, cy + u(2.4), fz + 0.087);
    for (let i = 0; i < 8; i++) { const t = i / 8 * TAU; door(bx(L, u(0.6), u(0.6), 0.004), K.plain(sh(a, -2)), cx + Math.cos(t) * u(3), cy + Math.sin(t) * u(3), fz + 0.087); }
    door(rbox(u(2), u(9), 0.03, 0.008, 1), brass, X(22), u(15.5), fz + 0.105);
    for (const y of [12.5, 18.5]) door(cyl(u(0.7), 0.05, u(0.7), 8).rotateX(PI / 2), brass, X(22), u(y), fz + 0.075);
    K.inside = { x: X(16), y: u(16), w: u(18), h: u(20), z: fz + 0.004 };
  },

  cubicle(K, s, W, D, L) {
    const { rbox, ball } = L, { m, c, a } = K.pal, frame = K.metal(m), pin = K.gloss(a), t = 0.18;
    // the frame: posts, rails, two feet; the fabric panel between, both faces
    for (const sg of [-1, 1]) {
      K.put(rbox(u(3), u(56), t, 0.012, 1), frame, sg * u(29.5), u(28), 0);
      K.put(rbox(u(3), u(1.5), 0.5, 0.008, 1), frame, sg * u(29.5), u(0.75), 0);
    }
    for (const y of [2, 54]) K.put(rbox(u(62), u(4), t, 0.012, 1), frame, 0, u(y), 0);
    K.put(rbox(u(56), u(48), 0.12, 0.01, 1), K.cloth(c), 0, u(28), 0);
    // sticky notes pinned up, two lines on each, and a photo of a sunny field
    const zf = 0.06;
    for (const [i, j, col] of [[8, -46, '#f8e870'], [20, -40, '#a8e8f8'], [34, -48, '#f8b0c8'], [46, -38, '#ffffff']]) {
      K.put(bx(L, u(9), u(9), 0.004), K.plain(col), X(i + 4.5, 2), u(-j - 4.5), zf + 0.002);
      const ink = K.plain(sh(col, -2));
      K.put(bx(L, u(5), u(1), 0.002), ink, X(i + 4.5, 2), u(-j - 3.5), zf + 0.005);
      K.put(bx(L, u(4), u(1), 0.002), ink, X(i + 4, 2), u(-j - 5.5), zf + 0.005);
      K.put(ball(u(1), 8, 6), pin, X(i + 4.5, 2), u(-j - 0.8), zf + 0.01);
    }
    K.put(bx(L, u(12), u(10), 0.004), K.plain('#ffffff'), X(18, 2), u(21), zf + 0.002);
    K.put(bx(L, u(10), u(4), 0.002), K.plain('#88c8f0'), X(18, 2), u(23), zf + 0.005);
    K.put(bx(L, u(10), u(2), 0.002), K.plain('#68b048'), X(18, 2), u(20), zf + 0.005);
    K.put(ball(u(1), 8, 6), pin, X(18, 2), u(25.2), zf + 0.01);
  },

  serverrack(K, s, W, D, L) {
    const { rbox } = L, { m, a } = K.pal, d = 0.64, f = d / 2, body = K.metal(sh(m, -1)), vent = K.plain('#1a1a22');
    // the cabinet: sides with vents, top and plinth, back, the mounting rails, the accent strip on top
    for (const sg of [-1, 1]) {
      K.put(rbox(u(2), u(76), d, 0.01, 1), body, sg * u(11), u(38), 0);
      for (const y0 of [8, 58]) for (let k = 0; k < 5; k++) K.put(bx(L, 0.004, u(0.8), u(12)), vent, sg * (u(12) + 0.002), u(y0 + k * 2.2), 0);
    }
    K.put(rbox(u(20), u(4), d, 0.008, 1), body, 0, u(74), 0);
    K.put(rbox(u(24), u(2), d + 0.004, 0.006, 1), K.gloss(a), 0, u(77), 0);
    K.put(rbox(u(20), u(2), d, 0.008, 1), body, 0, u(1), 0);
    K.put(bx(L, u(20), u(72), 0.02), body, 0, u(37), -f + 0.01);
    for (const x of [6.5, 25.5]) K.put(bx(L, u(1), u(72), 0.02), body, X(x), u(37), f - 0.05);
    // nine servers: a bezel each, a highlight along its top, three LEDs, a grilled vent, two handles
    const bezel = K.gloss('#3a3a48'), hi = K.gloss('#4a4a5a'), ear = K.metal('#c8ccd8'), led = [K.glow('#68e868'), K.glow('#68b8f8')];
    for (let r = 0; r < 9; r++) {
      const top = 72 - r * 8, y = u(top - 3), z = f - 0.03;
      K.put(rbox(u(20), u(6), 0.03, 0.006, 1), bezel, 0, y, z);
      K.put(bx(L, u(20), u(0.8), 0.004), hi, 0, u(top - 0.4), z + 0.016);
      for (let i = 0; i < 3; i++) K.put(bx(L, u(1.2), u(1.2), 0.008), led[hash(r, i) < 0.5 ? 0 : 1], X(8.5 + i * 3), u(top - 3.5), z + 0.017);
      K.put(bx(L, u(6), u(2), 0.004), vent, X(21), y, z + 0.016);
      for (const x of [19.5, 21, 22.5]) K.put(bx(L, u(0.4), u(2), 0.006), bezel, X(x), y, z + 0.018);
      for (const x of [7, 25]) K.put(bx(L, u(0.8), u(4), 0.02), ear, X(x), y, z + 0.024);
    }
  },

  pastrycase(K, s, W, D, L) {
    const { THREE, rbox, ball } = L, { w, m, c } = K.pal, d = 0.6, wood = K.wood(), steel = K.metal(m), glass = K.glass();
    // the counter: three raised panels, a recessed kick, the lip
    K.put(rbox(u(62), u(17), d - 0.04, 0.02, 1), wood, 0, u(10.5), -0.01);
    for (let i = 0; i < 3; i++) K.put(rbox(u(18), u(12), 0.02, 0.006, 1), wood, X(12 + i * 20, 2), u(10.5), 0.27 + 0.008);
    K.put(bx(L, u(58), u(2), d - 0.08), K.plain(sh(w, -2)), 0, u(1), -0.02);
    K.put(rbox(u(64), u(3), d, 0.01, 1), K.wood(sh(w, 1)), 0, u(20.5), 0);
    // the case: a white deck, glass all round and a glass shelf, steel posts and a steel frame on top
    const gz = 0.27, gx = u(30.4);
    K.put(bx(L, u(60), 0.008, 2 * gz - 0.02), K.plain('#f4f0e8'), 0, u(22) + 0.004, 0);
    for (const sz of [-1, 1]) K.put(bx(L, u(60), u(22), 0.004), glass, 0, u(33), sz * gz);
    for (const sx of [-1, 1]) K.put(bx(L, 0.004, u(22), 2 * gz), glass, sx * u(30), u(33), 0);
    K.put(bx(L, u(60), 0.004, 2 * gz), glass, 0, u(45), 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.put(bx(L, u(1.2), u(22), u(1.2)), steel, sx * gx, u(33), sz * gz);
    for (const sz of [-1, 1]) K.put(rbox(u(62), u(2), u(1.6), 0.006, 1), steel, 0, u(45), sz * gz);
    for (const sx of [-1, 1]) K.put(bx(L, u(1.6), u(2), 2 * gz), steel, sx * gx, u(45), 0);
    K.put(bx(L, u(60), 0.012, 2 * gz - 0.04), glass, 0, u(32.5), 0);
    K.put(bx(L, u(60), u(1), 0.006), K.plain('#c8d8e0'), 0, u(32.5), gz - 0.03);
    // buns along the deck, a glaze on each; doughnuts stood up on the shelf; two rows deep
    const bun = K.gloss('#d8a058'), glaze = K.gloss('#f0c880'), icing = [K.gloss(BERRY[2]), K.gloss(c)];
    for (const z of [0.14, -0.08]) {
      for (let i = 6; i < 62; i += 10) {
        K.put(ball(u(4), 10, 6).scale(1, 0.5, 0.85), bun, X(i, 2), u(25), z);
        K.put(ball(u(2.2), 8, 4).scale(1, 0.35, 0.8), glaze, X(i, 2), u(26.4), z);
      }
      for (let i = 8; i < 62; i += 10) K.put(new THREE.TorusGeometry(u(2), u(1), 6, 12), icing[(i / 10 | 0) % 2], X(i, 2), u(36.4), z, 0, -0.35);
    }
  },
};
