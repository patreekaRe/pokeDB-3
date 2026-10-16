/* base-models-p.js  -  the frontboxes of the School, Toys, Music, Library, Space and Farm shelves built from parts like the
   stove and the arcade cabinets (the user's ask, 2026-10-16: "3D detailed CLEAN models ... optimise them"): they were
   plain boxes with their painting stuck on the front. Now a science bench with its glassware, the toy shelves with
   their toys on real shelves, speakers with cones, card catalogue and map chest drawers with brass pulls and label
   plates, a book return's slot, a navigation console's sloped deck and lit screens, a space food dispenser behind
   glass, and slatted produce crates heaped with their crop.
   js/base-models-f.js's head says how a batch works. Each builder follows its painting (js/base-furniture-rooms2.js,
   -rooms3.js, -rooms4.js) pixel for pixel: `u(n)` is n of its 32 pixels a tile, `X(n, W)` a pixel across the painting as
   x from the middle. Small parts are plain boxes and low cylinders, and plain colours, so the room bakes them into one
   draw (js/hd2d.js's bakeColours()). */

const u = (n) => n / 32;
const X = (n, W = 1) => n / 32 - W / 2;
const INK = '#303038', SILVER = '#d8dce4', BRASS = '#d8a838', GOLD = '#f0c040', PARCH = '#f0e0b0', SKYB = '#a8d8f8',
  SCREEN = '#14243a', PANEL = '#1a2a3a';
const RAINBOW = ['#e04848', '#f08030', '#f8d030', '#58b848', '#4a98d8', '#5a58c8', '#a858d8'];
const TAU = Math.PI * 2;

const sheet = (w, h, draw) => { const c = new OffscreenCanvas(w, h); draw(c.getContext('2d'), w, h); return c; };
const pics = {};
const once = (key, make) => pics[key] || (pics[key] = make());

const box = (L, w, h, d) => new L.THREE.BoxGeometry(w, h, d);
/** A front outline ([x, y] points) extruded `d` deep, centred on z 0. */
function flat(L, pts, d) {
  const g = new L.THREE.ExtrudeGeometry(new L.THREE.Shape(pts.map(([x, y]) => new L.THREE.Vector2(x, y))), { depth: d, bevelEnabled: false });
  return g.translate(0, 0, -d / 2);
}

/* the navigation console's two screens side by side, the left one's sweep green, the right one's blue round a ring */
const navScreens = () => once('nav', () => sheet(256, 116, (g, w, h) => {
  for (const [x0, c] of [[0, '#68e8a8'], [128, '#68b8f0']]) {
    g.fillStyle = SCREEN; g.fillRect(x0, 0, 128, h);
    g.strokeStyle = 'rgba(104,184,240,0.2)'; g.lineWidth = 1;
    for (let i = 16; i < 128; i += 16) { g.beginPath(); g.moveTo(x0 + i, 0); g.lineTo(x0 + i, h); g.stroke(); }
    for (let j = 14; j < h; j += 16) { g.beginPath(); g.moveTo(x0, j); g.lineTo(x0 + 128, j); g.stroke(); }
    g.strokeStyle = c; g.lineWidth = 4; g.beginPath();
    for (let i = 8; i <= 120; i += 2) { const y = h * 0.5 + Math.sin(i / 11 + x0) * h * 0.23; i === 8 ? g.moveTo(x0 + i, y) : g.lineTo(x0 + i, y); }
    g.stroke();
  }
  g.strokeStyle = '#68b8f0'; g.lineWidth = 4; g.beginPath(); g.arc(128 + 42, 52, 30, 0, TAU); g.stroke();
  g.fillStyle = '#e8f8ff'; g.beginPath(); g.arc(128 + 54, 40, 5, 0, TAU); g.fill();
}));

/* ----- the toys on a toy shelf, one row each: `f` the shelf's floor, `n` 0 the upper row, 1 the lower ----- */
const TOYS_P = {
  block(K, L, f, n) {
    const { rbox } = L, s = u(7);
    for (let i = 0; i < 3; i++) K.put(rbox(s, s, s, 0.012, 1), K.gloss(RAINBOW[(i + n * 3) % 7]), X(8.5 + i * 8), f + s / 2, 0.02, (i - 1) * (n ? -0.2 : 0.16));
    K.put(rbox(s, s, s, 0.012, 1), K.gloss(RAINBOW[n + 4]), X(12.5), f + s * 1.5, 0.02, 0.4);
  },
  car(K, L, f, n) {
    const { rbox, cyl } = L, tyre = K.gloss(INK), pane = K.gloss(SKYB);
    for (let i = 0; i < 2; i++) {
      const paint = K.gloss(i ? K.pal.c : RAINBOW[n * 4]), x = X(10.5 + i * 12), z = 0.03;
      K.put(rbox(u(11), u(4.4), 0.15, 0.018, 1), paint, x, f + u(5.6), z);
      K.put(rbox(u(6.4), u(3.4), 0.13, 0.016, 1), paint, x - u(0.5), f + u(9.3), z);
      // the windscreens and the side windows
      K.put(box(L, u(6.8), u(1.6), 0.1), pane, x - u(0.5), f + u(9.5), z);
      K.put(box(L, u(5.2), u(1.6), 0.134), pane, x - u(0.5), f + u(9.5), z);
      for (const wx of [-3.5, 3.5]) for (const wz of [-1, 1]) K.put(cyl(u(1.9), 0.03, u(1.9), 10).rotateX(Math.PI / 2), tyre, x + u(wx), f + u(1.9), z + wz * 0.068);
    }
  },
  robot(K, L, f, n) {
    const { rbox, cyl, ball } = L, eye = K.gloss('#68e8f8'), red = K.gloss('#e04848');
    for (let i = 0; i < 2; i++) {
      const m = K.gloss(i ? K.pal.m : K.pal.c), x = X(9.5 + i * 12), z = 0.02, turn = (i ? -0.3 : 0.3) * (n ? -1 : 1);
      const at = (geo, mat, dx, dy, dz = 0) => K.put(geo.translate(dx, dy, dz), mat, x, f, z, turn);
      for (const sx of [-1, 1]) {
        at(box(L, u(2.2), u(3), u(2.6)), m, sx * u(1.6), u(1.5));
        at(cyl(u(1), u(5), u(1), 6).rotateZ(sx * 0.18), m, sx * u(4.4), u(6.6));
        at(box(L, u(1.2), u(1.2), 0.008), eye, sx * u(1.2), u(14), u(2.3) + 0.004);
      }
      at(rbox(u(7), u(7), u(5), 0.016, 1), m, 0, u(6.5));
      at(box(L, u(2.4), u(1.6), 0.008), eye, 0, u(7.6), u(2.5) + 0.004);
      at(cyl(u(1), u(1.4), u(1), 6), m, 0, u(10.6));
      at(rbox(u(5.4), u(5), u(4.6), 0.014, 1), m, 0, u(13.5));
      at(cyl(u(0.4), u(2.4), u(0.4), 5), m, 0, u(17));
      at(ball(u(0.9), 8, 6), red, 0, u(18.4));
    }
  },
  ball(K, L, f, n) {
    const cols = [0, 1, 2].map(i => K.gloss(RAINBOW[(i * 2 + n) % 7]));
    for (let i = 0; i < 3; i++) {
      const r = u(3 + (i % 2)), x = X(9 + i * 7), y = f + r, z = i % 2 ? 0 : 0.04;
      // the big one a beach ball, its gores in the other two's colours
      if (i === 1) for (let k = 0; k < 6; k++) K.put(new L.THREE.SphereGeometry(r, 2, 8, k * TAU / 6, TAU / 6), cols[k % 3], x, y, z, 0.5);
      else K.put(L.ball(r, 12, 8), cols[i], x, y, z);
    }
  },
  boat(K, L, f, n) {
    const { cyl } = L, wood = K.wood(), sail = K.gloss(K.pal.p);
    for (let i = 0; i < 2; i++) {
      const paint = K.gloss(i ? K.pal.c : '#e04848'), x = X(10 + i * 12), z = 0.02;
      // the hull, its bow pinched to a point, a pale rubbing strake and the deck
      const hull = flat(L, [[-u(5), u(4)], [-u(3.6), u(1.4)], [-u(2), 0], [u(2), 0], [u(4), u(1.5)], [u(5.4), u(4.4)]], 0.12), p = hull.attributes.position;
      for (let k = 0; k < p.count; k++) { const t = Math.max(0, p.getX(k) / u(5.4)); p.setZ(k, p.getZ(k) * (1 - 0.75 * t * t)); }
      hull.computeVertexNormals();
      K.put(hull, paint, x, f, z);
      K.put(box(L, u(9.4), u(0.6), 0.11), sail, x - u(0.2), f + u(3.3), z);
      K.put(box(L, u(9), u(0.4), 0.09), wood, x - u(0.2), f + u(4), z);
      // the mast, its sail and a pennant
      K.put(cyl(u(0.5), u(11), u(0.5), 6), wood, x, f + u(9.5), z);
      K.put(flat(L, [[u(0.6), u(5.4)], [u(0.6), u(14.4)], [u(5.6), u(5.4)]], 0.01), sail, x, f, z);
      K.put(box(L, u(2.2), u(1.2), 0.008), paint, x - u(1.2), f + u(14.4), z);
    }
  },
  top(K, L, f, n) {
    const { lathe, cyl } = L, wood = K.wood(), band = K.gloss('#f4f0e8');
    for (let i = 0; i < 3; i++) {
      const x = X(9.5 + i * 7), z = 0.03 - (i % 2) * 0.04, tilt = i === 1 ? 0 : (i ? -0.14 : 0.1) * (n ? -1 : 1);
      K.put(lathe([[0, 0], [u(1.2), u(1.2)], [u(4.4), u(4.3)], [u(4.6), u(5)], [u(4.2), u(5.8)], [u(1.6), u(8.6)], [0, u(9)]], 12), K.gloss(RAINBOW[(i * 3 + n) % 7]), x, f, z, 0, 0, tilt);
      K.put(cyl(u(4.75), u(0.7), u(4.75), 12).translate(0, u(5), 0), band, x, f, z, 0, 0, tilt);
      K.put(cyl(u(0.6), u(3.4), u(0.6), 6).translate(0, u(10.4), 0), wood, x, f, z, 0, 0, tilt);
    }
  },
};

/* ----- what heaps a produce crate: `z` its label's face ----- */
const HEAPS_P = {
  apple(K, L, z) {
    const red = K.gloss('#d83030'), stem = K.plain('#6a4a2a'), leaf = K.gloss('#58a838'), r = u(3.5), R = K.r;
    const rows = [[[-9, -3, 3, 9], 21.5, 0.17], [[-9, -3, 3, 9], 23, -0.15], [[-6, 0, 6], 26.5, 0.02]];
    let n = 0;
    for (const [xs, y, rz] of rows) for (const i of xs) {
      const tx = (R() - 0.5) * 0.5, tz = (R() - 0.5) * 0.5, put = (geo, m) => K.put(geo, m, u(i) + (R() - 0.5) * 0.02, u(y), rz, 0, tx, tz);
      put(L.lathe([[0, r * 0.12], [r * 0.55, 0], [r * 0.95, r * 0.55], [r * 0.9, r * 1.35], [r * 0.45, r * 1.75], [0, r * 1.55]], 10), red);
      put(L.cyl(u(0.35), u(2), u(0.25), 5).translate(0, r * 1.75, 0), stem);
      if (n++ % 3 === 0) put(L.ball(u(1), 6, 4).scale(1.6, 0.3, 0.8).translate(u(1.2), r * 1.78, 0), leaf);
    }
    K.put(L.ball(u(2), 8, 6).scale(1, 1, 0.35), red, 0, u(12), z + 0.004);
  },
  carrot(K, L, z) {
    const orange = K.gloss('#f08030'), green = K.gloss('#58b848'), R = K.r;
    const rows = [[[-10, -6, -2, 2, 6, 10], 0.16], [[-8, -4, 0, 4, 8], 0], [[-6, -2, 2, 6], -0.16]];
    rows.forEach(([xs, rz], row) => xs.forEach((i, n) => {
      const y = u(19.5 + ((n + row) % 2) * 3 + row * 1.5), tx = (R() - 0.5) * 0.3, tz = (R() - 0.5) * 0.3 + i * 0.012;
      K.put(L.lathe([[0, 0], [u(0.7), u(2)], [u(1.3), u(5.5)], [u(1.6), u(8)], [u(1.3), u(8.6)], [0, u(8.8)]], 8), orange, u(i), y, rz, 0, tx, tz);
      for (let k = -1; k <= 1; k++) K.put(L.cyl(u(0.35), u(8), u(0.15), 4).translate(0, u(4), 0).rotateZ(k * 0.4).rotateX((R() - 0.5) * 0.5).translate(0, u(8.6), 0), green, u(i), y, rz, 0, tx, tz);
    }));
    K.put(L.cyl(u(1), u(5), u(0.3), 6).rotateZ(Math.PI / 2).scale(1, 1, 0.5), orange, 0, u(12), z + 0.006);
  },
  corn(K, L, z) {
    const yellow = K.gloss('#f0c830'), husk = K.gloss('#78b848'), R = K.r;
    for (const [xs, y, rz] of [[[-9, -3, 3, 9], 21, 0.14], [[-6, 0, 6], 23, -0.1]]) for (const i of xs) {
      const lean = -0.12 + (R() - 0.5) * 0.12, tx = (R() - 0.5) * 0.2;
      K.put(L.lathe([[0, 0], [u(1.4), u(1.2)], [u(2), u(4)], [u(2), u(10)], [u(1.5), u(14)], [u(0.6), u(15.6)], [0, u(16)]], 10), yellow, u(i), u(y), rz, 0, tx, lean);
      for (const sx of [-1, 1]) K.put(L.ball(1, 6, 4).scale(u(1.6), u(6), u(0.6)).rotateZ(sx * -0.35).translate(sx * u(1.7), u(4.5), 0), husk, u(i), u(y), rz, 0, tx, lean);
    }
    K.put(L.ball(u(1.8), 8, 6).scale(1.3, 0.9, 0.35), yellow, 0, u(12), z + 0.004);
  },
  potato(K, L, z) {
    const skin = K.gloss('#c8a068'), eye = K.plain('#8a6a3a'), R = K.r;
    const lump = () => {
      const g = L.ball(1, 10, 7), p = g.attributes.position, a = R() * 9;
      for (let k = 0; k < p.count; k++) { const x = p.getX(k), y = p.getY(k), zz = p.getZ(k), f = 1 + 0.09 * Math.sin(x * 3 + a) * Math.cos(y * 4 + zz * 2 + a); p.setXYZ(k, x * f, y * f, zz * f); }
      return g.scale(u(4) * (0.9 + R() * 0.2), u(3), u(3.4));
    };
    for (const [xs, y, rz] of [[[-9, -3, 3, 9], 24, 0.16], [[-9, -3, 3, 9], 26, -0.14], [[-6, 0, 6], 28.5, 0.02]]) for (const i of xs) {
      K.put(lump(), skin, u(i), u(y), rz, R() * TAU, 0, (R() - 0.5) * 0.4);
      if (rz > 0.1) K.put(L.ball(u(0.5), 6, 4), eye, u(i - 1), u(y + 1), rz + u(3.2));
    }
    K.put(L.ball(u(2.2), 8, 6).scale(1.3, 0.8, 0.35), skin, 0, u(12), z + 0.004);
  },
  cabbage(K, L, z) {
    const head = K.gloss('#78c058'), heart = K.gloss('#b8e098'), outer = K.gloss('#5aa040'), R = K.r;
    for (const [xs, y, rz] of [[[-7, 0, 7], 28.5, 0.1], [[-3.5, 3.5], 31, -0.13]]) for (const i of xs) {
      const turn = R() * TAU, x = u(i), r = u(4.6);
      K.put(L.ball(r, 12, 8), head, x, u(y), rz);
      K.put(L.ball(u(2.2), 8, 6).scale(1, 1, 0.5), heart, x, u(y + 0.6), rz + r * 0.82);
      // three outer leaves cupped round its lower half
      for (let k = 0; k < 3; k++) K.put(new L.THREE.SphereGeometry(r * 1.13, 6, 4, 0, 1.9, 0.95, 1.5), outer, x, u(y), rz, turn + k * 2.1);
    }
    K.put(L.ball(u(2), 8, 6).scale(1, 1, 0.35), head, 0, u(12), z + 0.004);
  },
};

export const SHAPES = {
  sciencebench: { make: 'sciencebench' },
  blocktoyshelf: { make: 'toyshelfP', toy: 'block', top: 1.69 },
  cartoyshelf: { make: 'toyshelfP', toy: 'car', top: 1.69 },
  robottoyshelf: { make: 'toyshelfP', toy: 'robot', top: 1.69 },
  balltoyshelf: { make: 'toyshelfP', toy: 'ball', top: 1.69 },
  boattoyshelf: { make: 'toyshelfP', toy: 'boat', top: 1.69 },
  toptoyshelf: { make: 'toyshelfP', toy: 'top', top: 1.69 },
  speakerstack: { make: 'speakerstack' },
  amplifier: { make: 'amplifier' },
  cardcatalogue: { make: 'cardcatalogue', top: 1.97 },
  mapcase: { make: 'mapcase' },
  returnbox: { make: 'returnbox' },
  navdesk: { make: 'navdesk' },
  foodpods: { make: 'foodpods' },
  applecrate: { make: 'crateP', crop: 'apple' },
  carrotcrate: { make: 'crateP', crop: 'carrot' },
  corncrate: { make: 'crateP', crop: 'corn' },
  potatocrate: { make: 'crateP', crop: 'potato' },
  cabbagecrate: { make: 'crateP', crop: 'cabbage' },
};

export const MAKES = {
  /* ----- School ----- */

  sciencebench(K, s, W, D, L) {
    const { rbox, cyl, lathe } = L, x = (n) => X(n, W), wood = K.wood(), ink = K.gloss(INK), glass = K.glass(), steel = K.metal();
    const d = 0.66, fz = d / 2, top = u(34);
    // the cupboard on a dark toe kick, three panelled doors with their handles, the dark worktop
    K.put(rbox(u(62), u(25), d, 0.02), wood, 0, u(16.5), 0);
    K.put(rbox(u(60), u(4.2), d - 0.08, 0.01, 1), ink, 0, u(2.1), -0.03);
    for (const i of [3, 23, 43]) {
      K.put(rbox(u(15.4), u(21.4), 0.03, 0.008, 1), wood, x(i + 8), u(16), fz + 0.006);
      K.put(rbox(u(10), u(16.5), 0.02, 0.006, 1), wood, x(i + 7.5), u(16), fz + 0.02);
      K.put(rbox(u(1.3), u(4.4), 0.05, 0.006, 1), K.metal(K.pal.a), x(i + 13.4), u(15), fz + 0.03);
    }
    K.put(rbox(u(64), u(5), d + 0.04, 0.012), ink, 0, u(31.5), 0);
    // a conical flask of green
    K.put(lathe([[0, 0], [u(6), 0], [u(6), u(0.6)], [u(1.3), u(8.4)], [u(1.1), u(11.4)], [u(1.6), u(12)]], 14), glass, x(11), top, 0.02);
    K.put(lathe([[0, u(0.4)], [u(5.6), u(0.4)], [u(5.6), u(0.9)], [u(1.9), u(7)], [0, u(7)]], 14), K.gloss('#68e8a8'), x(11), top, 0.02);
    // four test tubes in a rack
    K.put(box(L, u(16), u(1), 0.13), steel, x(30), top + u(0.5), 0);
    K.put(box(L, u(16), u(0.8), 0.1), steel, x(30), top + u(3.6), 0);
    for (const i of [22.4, 37.6]) K.put(box(L, u(0.8), u(3.2), 0.1), steel, x(i), top + u(2.2), 0);
    ['#e04848', '#4a98d8', '#f8d030', '#a858d8'].forEach((c, i) => {
      K.put(cyl(u(1), u(10), u(1), 8), glass, x(24 + i * 4), top + u(7), 0);
      K.put(cyl(u(0.8), u(5), u(0.8), 8), K.gloss(c), x(24 + i * 4), top + u(4.5), 0);
    });
    // a beaker of pink, and a little burner
    K.put(lathe([[0, 0], [u(5), 0], [u(5), u(10)], [u(5.5), u(10.4)]], 14), glass, x(51), top, 0.03);
    K.put(cyl(u(4.6), u(5), u(4.6), 14), K.gloss('#f890b8'), x(51), top + u(2.6), 0.03);
    K.put(cyl(u(2.1), u(0.8), u(2.4), 10), steel, x(60), top + u(0.4), -0.02);
    K.put(cyl(u(0.9), u(1.2), u(0.9), 8), steel, x(60), top + u(1.6), -0.02);
    K.put(cyl(u(0.6), u(7), u(0.6), 8), steel, x(60), top + u(4.5), -0.02);
  },

  /* ----- Toys: a low cube shelf, its toys in two rows ----- */

  toyshelfP(K, s, W, D, L) {
    const { rbox } = L, wood = K.wood(), d = 0.4;
    // the two sides, the dark back, the plinth, the middle shelf, the rail under the top and the overhanging top
    for (const i of [2.5, 29.5]) K.put(rbox(u(3), u(51), d, 0.012, 1), wood, X(i), u(25.5), 0);
    K.put(box(L, u(25), u(47), 0.02), K.plain(L.tone(K.pal.w, 0.5)), 0, u(27.5), -d / 2 + 0.012);
    for (const [y0, y1] of [[0, 4], [24, 27], [46, 51]]) K.put(rbox(u(24.6), u(y1 - y0), d - 0.02, 0.008, 1), wood, 0, u((y0 + y1) / 2), -0.01);
    K.put(rbox(u(32), u(3), d + 0.03, 0.012, 1), wood, 0, u(52.5), 0.005);
    TOYS_P[s.toy](K, L, u(27), 0);
    TOYS_P[s.toy](K, L, u(4), 1);
  },

  /* ----- Music ----- */

  speakerstack(K, s, W, D, L) {
    const { rbox, cyl, lathe, torus, THREE } = L, cab = K.plain(K.pal.m), ink = K.gloss(INK), chrome = K.metal(SILVER), d = 0.5, fz = d / 2;
    const cone = K.plain(L.tone(K.pal.m, 0.5)), cap = K.gloss(L.tone(K.pal.m, 1.3)), dome = (r) => new THREE.SphereGeometry(r, 10, 4, 0, TAU, 0, Math.PI / 2).rotateX(Math.PI / 2);
    // the plinth in the theme's colour, the top cabinet on four rubber feet
    K.put(rbox(u(22), u(2), d - 0.06, 0.006, 1), K.gloss(K.pal.c), 0, u(1), 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.put(cyl(u(1.2), u(2), u(1.2), 8), ink, sx * u(10), u(39), sz * (fz - 0.06));
    for (const [y0, y1, cy, r, ty] of [[2, 38, 15, 10, 33], [40, 74, 52, 7, 69]]) {
      K.put(rbox(u(26), u(y1 - y0), d, 0.025), cab, 0, u((y0 + y1) / 2), 0);
      // the woofer: its surround, the cone dished in, the dust cap; the tweeter's dome
      K.put(torus(u(r - 1), u(1.1), TAU, 20), ink, 0, u(cy), fz);
      K.put(lathe([[u(r - 1.4), 0], [u(r * 0.38), -0.045]], 16).rotateX(Math.PI / 2), cone, 0, u(cy), fz + 0.002);
      K.put(dome(u(r * 0.38)).scale(1, 1, 0.6), cap, 0, u(cy), fz - 0.043);
      K.put(dome(u(2.5)).scale(1, 1, 0.5), ink, 0, u(ty), fz);
      // chrome corners and a handle either side
      for (const sx of [-1, 1]) {
        for (const yy of [y0 + 1.2, y1 - 1.2]) K.put(rbox(u(2.8), u(2.8), u(2.8), 0.006, 1), chrome, sx * u(12), u(yy), fz - u(1.2));
        K.put(box(L, 0.016, u(1.6), u(9)), chrome, sx * (u(13) + 0.004), u((y0 + y1) / 2 + 4), 0);
      }
    }
  },

  amplifier(K, s, W, D, L) {
    const { rbox, cyl } = L, tolex = K.plain(K.pal.m), ink = K.gloss(INK), chrome = K.metal(SILVER), d = 0.4, fz = d / 2;
    // the cabinet on four rubber feet, chrome corners
    K.put(rbox(u(28), u(35), d, 0.025), tolex, 0, u(18.5), 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      K.put(cyl(u(1.5), u(1.2), u(1.5), 8), ink, sx * u(11), u(0.6), sz * (fz - 0.05));
      for (const yy of [2.2, 34.8]) K.put(rbox(u(2.4), u(2.4), u(2.4), 0.005, 1), chrome, sx * u(13.2), u(yy), sz * (fz - u(1)));
    }
    // the grille cloth behind its slats, piped in chrome
    K.put(rbox(u(22), u(24), 0.012, 0.004, 1), K.cloth(L.tone(K.pal.c, 0.8)), 0, u(16), fz + 0.002);
    const slat = K.plain(L.tone(K.pal.c, 0.55));
    for (let j = 0; j < 11; j++) K.put(box(L, u(21), u(0.7), 0.01), slat, 0, u(6.5 + j * 2), fz + 0.01);
    for (const yy of [3.7, 28.3]) K.put(box(L, u(22.6), u(0.6), 0.018), chrome, 0, u(yy), fz + 0.008);
    for (const sx of [-1, 1]) K.put(box(L, u(0.6), u(25.2), 0.018), chrome, sx * u(11.3), u(16), fz + 0.008);
    // the control panel: five knobs, a gold badge
    K.put(rbox(u(24), u(5), 0.02, 0.005, 1), ink, 0, u(31.5), fz + 0.004);
    for (let n = 0; n < 5; n++) {
      K.put(cyl(u(1.4), 0.03, u(1.2), 10).rotateX(Math.PI / 2), chrome, X(7 + n * 4.5), u(31.6), fz + 0.025);
      K.put(box(L, u(0.4), u(1), 0.004), ink, X(7 + n * 4.5), u(32.2), fz + 0.041);
    }
    K.put(box(L, u(4), u(0.9), 0.01), K.metal(GOLD), X(24), u(33.6), fz + 0.016);
    // the carrying strap and its chrome ends
    for (const i of [12.5, 19.5]) K.put(rbox(u(1.8), u(2.2), u(3), 0.005, 1), chrome, X(i), u(37), 0);
    K.put(rbox(u(8.6), u(1.4), u(2.4), 0.008, 1), K.plain(L.tone(K.pal.m, 0.7)), 0, u(38.6), 0);
  },

  /* ----- Library ----- */

  cardcatalogue(K, s, W, D, L) {
    const { rbox, cyl, lathe } = L, dark = K.wood(L.tone(K.pal.w, 0.85)), face = K.wood(L.tone(K.pal.w, 1.12)), brass = K.metal(BRASS), card = K.plain(PARCH);
    const d = 0.5, fz = d / 2;
    // the cabinet, its top, an apron rail and four turned legs
    K.put(rbox(u(28), u(53), d, 0.015), dark, 0, u(33), 0);
    K.put(rbox(u(30), u(4), d + 0.03, 0.012, 1), dark, 0, u(61), 0);
    K.put(rbox(u(28.6), u(1.6), d + 0.01, 0.006, 1), dark, 0, u(6.6), 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.put(lathe([[0, 0], [u(1.2), 0], [u(1), u(1.5)], [u(1.6), u(3.6)], [u(1.5), u(5.6)], [u(1.8), u(6.4)], [0, u(6.4)]], 10), dark, sx * u(11.5), 0, sz * (fz - 0.05));
    // eighteen drawers, each with its brass label plate and pull
    for (let r = 0; r < 6; r++) for (let c = 0; c < 3; c++) {
      const x = X(7.5 + c * 8), y = u(54.5 - r * 8.5);
      K.put(rbox(u(7), u(7), 0.03, 0.006, 1), face, x, y, fz + 0.008);
      K.put(box(L, u(4), u(2.2), 0.006), brass, x, y + u(1), fz + 0.025);
      K.put(box(L, u(3.2), u(1.4), 0.006), card, x, y + u(1), fz + 0.027);
      K.put(cyl(u(0.7), u(2.4), u(0.7), 6).rotateZ(Math.PI / 2), brass, x, y - u(1.4), fz + 0.03);
    }
  },

  mapcase(K, s, W, D, L) {
    const { rbox, cyl } = L, x = (n) => X(n, W), wood = K.wood(), lid = K.wood(L.tone(K.pal.w, 1.12)), brass = K.metal(BRASS), card = K.plain(PARCH);
    const d = 0.62, fz = d / 2;
    // the chest on its dark plinth, the lighter top overhanging
    K.put(rbox(u(60), u(26), d, 0.02), wood, 0, u(17), 0);
    K.put(rbox(u(58), u(4.2), d - 0.06, 0.01, 1), K.plain(L.tone(K.pal.w, 0.4)), 0, u(2.1), -0.02);
    K.put(rbox(u(64), u(3), d + 0.04, 0.012), lid, 0, u(30.5), 0);
    // four wide flat drawers: a brass bar pull, a label plate either side
    for (let n = 0; n < 4; n++) {
      const y = u(25.5 - n * 6);
      K.put(rbox(u(54), u(5), 0.03, 0.008, 1), wood, 0, y, fz + 0.006);
      K.put(box(L, u(8), u(1), 0.012), brass, 0, y, fz + 0.04);
      for (const sx of [-1, 1]) {
        K.put(box(L, u(0.8), u(0.8), 0.022), brass, sx * u(3.4), y, fz + 0.028);
        K.put(box(L, u(5), u(2.6), 0.006), brass, sx * u(17), y, fz + 0.024);
        K.put(box(L, u(4.2), u(1.8), 0.006), card, sx * u(17), y, fz + 0.026);
      }
    }
    // two rolled maps on the top, the long one tied with a ribbon
    const ty = u(32), end = K.plain(L.tone(PARCH, 0.75));
    K.put(cyl(u(3), u(30), u(3), 12).rotateZ(Math.PI / 2), card, x(25), ty + u(3), 0.08);
    K.put(cyl(u(1.2), u(30.3), u(1.2), 8).rotateZ(Math.PI / 2), end, x(25), ty + u(3), 0.08);
    K.put(cyl(u(3.3), u(2), u(3.3), 12).rotateZ(Math.PI / 2), K.gloss(K.pal.c), x(25), ty + u(3), 0.08);
    K.put(cyl(u(2.5), u(14), u(2.5), 12).rotateZ(Math.PI / 2), K.plain(L.tone(PARCH, 0.9)), x(49), ty + u(2.5), -0.1, 0.3);
    K.put(cyl(u(1), u(14.3), u(1), 8).rotateZ(Math.PI / 2), end, x(49), ty + u(2.5), -0.1, 0.3);
  },

  returnbox(K, s, W, D, L) {
    const { THREE, rbox, cyl } = L, body = K.gloss(K.pal.m), hood = K.gloss(L.tone(K.pal.m, 1.18)), ink = K.gloss(INK), white = K.gloss('#ffffff');
    const d = 0.5, fz = d / 2;
    // the box, a rim and its rounded hood
    K.put(rbox(u(24), u(42), d, 0.02), body, 0, u(21), 0);
    K.put(rbox(u(24.8), u(2), d + 0.02, 0.006, 1), hood, 0, u(43), 0);
    K.put(new THREE.CylinderGeometry(u(12.4), u(12.4), d + 0.02, 16, 1, false, Math.PI / 2, Math.PI).rotateX(Math.PI / 2).scale(1, 0.5, 1), hood, 0, u(44), 0);
    // the slot under its flap
    K.put(box(L, u(16), u(4), 0.01), ink, 0, u(36), fz + 0.002);
    K.put(rbox(u(17), u(2.4), 0.016, 0.005, 1), hood, 0, u(37.8), fz + 0.012, 0, -0.6);
    // the sign: a white arrow down to the slot
    K.put(rbox(u(18), u(8), 0.014, 0.004, 1), K.gloss(K.pal.c), 0, u(26), fz + 0.004);
    K.put(box(L, u(2), u(4), 0.006), white, 0, u(27), fz + 0.013);
    K.put(flat(L, [[-u(3), 0], [u(3), 0], [0, -u(3.2)]], 0.006), white, 0, u(25.1), fz + 0.013);
    // the door the books come out of, its lock, the kick plate
    K.put(rbox(u(18), u(15), 0.012, 0.004, 1), body, 0, u(12.5), fz + 0.003);
    K.put(cyl(u(1.2), 0.012, u(1.2), 10).rotateX(Math.PI / 2), K.metal(SILVER), X(22), u(17), fz + 0.012);
    K.put(box(L, u(20), u(2), 0.01), K.gloss(L.tone(K.pal.m, 0.55)), 0, u(3), fz + 0.004);
  },

  /* ----- Space ----- */

  navdesk(K, s, W, D, L) {
    const { rbox, cyl, profileSlab } = L, x = (n) => X(n, W), body = K.gloss(K.pal.m), deck = K.gloss(L.tone(K.pal.m, 0.8));
    const d = 0.62, fz = d / 2;
    // the cabinet, its accent strip, two service panels with vents
    K.put(rbox(u(60), u(30), d, 0.02), body, 0, u(15), 0);
    K.put(rbox(u(56), u(2), 0.012, 0.004, 1), K.gloss(K.pal.a), 0, u(5), fz + 0.004);
    for (const i of [18, 46]) {
      K.put(rbox(u(24), u(18), 0.012, 0.004, 1), body, x(i), u(17), fz + 0.004);
      for (let j = 0; j < 4; j++) K.put(box(L, u(14), u(0.8), 0.008), deck, x(i), u(22 - j * 2.4), fz + 0.012);
    }
    // the sloped deck up to the screens' shelf, a row of buttons and a row of switches on it
    K.put(profileSlab([[0.34, u(30)], [0.34, u(31.4)], [0, u(40)], [-fz, u(40)], [-fz, u(30)]], u(59), -u(29.5)), deck, 0, 0, 0);
    const lean = Math.atan2(u(8.6), 0.34), on = (py) => [0.34 - (py - 31.4) / 8.6 * 0.34 + 0.006 * Math.sin(lean), u(py) + 0.006 * Math.cos(lean)];
    const keys = ['#e04848', '#f8d030', '#58b848', '#4a98d8'].map(c => K.gloss(c));
    for (let n = 0; n < 11; n++) { const [z, y] = on(35.5); K.put(cyl(u(1.5), 0.016, u(1.5), 10), keys[n % 4], x(7 + n * 5), y, z, 0, lean); }
    for (let n = 0; n < 6; n++) { const [z, y] = on(32.6); K.put(box(L, u(1.2), 0.02, u(2)), body, x(17 + n * 6), y, z, 0, lean); }
    // two monitors on the shelf, lit
    const screens = L.litPic(navScreens(), 0.7);
    [6, 34].forEach((i, half) => {
      const mx = x(i + 12), mz = -0.17, g = new L.THREE.PlaneGeometry(u(22), u(21)), uv = g.attributes.uv;
      for (let k = 0; k < uv.count; k++) uv.setX(k, (uv.getX(k) + half) / 2);
      K.put(rbox(u(25), u(27), 0.08, 0.015), body, mx, u(53.5), mz);
      K.put(g, screens, mx, u(55), mz + 0.041);
    });
  },

  foodpods(K, s, W, D, L) {
    const { rbox, cyl } = L, body = K.gloss(K.pal.m), dark = K.gloss(PANEL), chrome = K.metal(SILVER), d = 0.5, fz = d / 2;
    // the cabinet, the frame round its window, the accent cap on top
    K.put(rbox(u(28), u(70), d - 0.2, 0.02), body, 0, u(35), -0.1);
    K.put(rbox(u(28), u(34), 0.24, 0.02, 1), body, 0, u(17), fz - 0.12);
    K.put(rbox(u(28), u(6), 0.24, 0.015, 1), body, 0, u(67), fz - 0.12);
    for (const sx of [-1, 1]) K.put(rbox(u(3), u(31), 0.24, 0.01, 1), body, sx * u(12.5), u(49), fz - 0.12);
    K.put(rbox(u(24), u(2), d - 0.1, 0.006, 1), K.gloss(K.pal.a), 0, u(71), -0.02);
    // behind the glass: three chrome shelves of pods, their foil lids
    K.put(box(L, u(22), u(30), 0.01), dark, 0, u(49), 0.056);
    for (const yy of [34.35, 43.65, 53.65]) K.put(box(L, u(22), u(0.7), 0.18), chrome, 0, u(yy), 0.15);
    const pods = [0, 2, 3, 4].map(i => K.gloss(RAINBOW[i]));
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const px = X(9.5 + c * 7), py = u(54 - r * 10) + (r ? u(0.6) : 0);
      K.put(cyl(u(2.4), u(6), u(2.4), 10), pods[(r * 3 + c) % 4], px, py + u(3), 0.14);
      K.put(cyl(u(2.5), u(2), u(2.5), 10), chrome, px, py + u(7), 0.14);
    }
    K.put(box(L, u(22.4), u(30.4), 0.006), K.glass(), 0, u(49), fz - 0.008);
    // the readout and its buttons
    K.put(rbox(u(18), u(4), 0.012, 0.004, 1), dark, 0, u(28), fz + 0.004);
    K.put(box(L, u(10), u(2), 0.006), K.glow('#68e8a8'), X(13), u(28), fz + 0.012);
    for (const i of [20.5, 23.5]) K.put(cyl(u(0.9), 0.012, u(0.9), 8).rotateX(Math.PI / 2), chrome, X(i), u(28), fz + 0.014);
    // the tray a pod drops into, behind its flap
    K.put(box(L, u(16), u(10), 0.01), dark, 0, u(15), fz + 0.002);
    K.put(rbox(u(14), u(6), 0.012, 0.004, 1), body, 0, u(16.6), fz + 0.014, 0, -0.15);
    K.put(box(L, u(16.4), u(1), 0.05), chrome, 0, u(10.3), fz + 0.022);
  },

  /* ----- Farm: a slatted crate heaped with its crop ----- */

  crateP(K, s, W, D, L) {
    const { rbox } = L, wood = K.wood(), post = K.wood(L.tone(K.pal.w, 0.8)), w = u(28), d = 0.6, hx = w / 2, hz = d / 2;
    // four corner posts, three boards round each side with a gap between, a false floor to heap on
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.put(rbox(u(3), u(24), u(3), 0.008, 1), post, sx * (hx - u(1.5)), u(12), sz * (hz - u(1.5)));
    for (const [y0, y1] of [[0, 7], [8, 15], [16, 24]]) {
      const y = u((y0 + y1) / 2), h = u(y1 - y0);
      for (const sz of [-1, 1]) K.put(rbox(w - u(5.6), h, u(1.2), 0.004, 1), wood, 0, y, sz * (hz - u(1)));
      for (const sx of [-1, 1]) K.put(rbox(u(1.2), h, d - u(5.6), 0.004, 1), wood, sx * (hx - u(1)), y, 0);
    }
    K.put(box(L, w - u(2.4), u(1), d - u(2.4)), K.plain(L.tone(K.pal.w, 0.45)), 0, u(19.5), 0);
    // the label, its crop on it
    const lz = hz - u(0.4) + 0.006;
    K.put(rbox(u(12), u(6), 0.012, 0.004, 1), K.gloss(K.pal.p), 0, u(12), lz);
    HEAPS_P[s.crop](K, L, lz + 0.006);
  },
};
