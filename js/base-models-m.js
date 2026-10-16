/* base-models-m.js  -  the round pieces js/base-mesh.js still turned on a lathe or puffed up from their paintings: the
   snow globe, Poké Ball statue and crystal ball (Things), the Poké Ball stand, item ball and Poké Ball lamp (Pokémon
   Center), the gym statue, the beach ball, palm tree and coral (Beach), the ice Poké Ball (Winter), the plasma globe and
   ant farm (Types), the model planets (Space) and the gumball machine (Arcade), built from parts (the user's ask,
   2026-10-16: "3D detailed CLEAN models ... optimise them"; a sphere is a real sphere on a real stand).
   js/base-models-f.js's head says how a batch works. The builders follow their paintings (js/base-furniture-kinds.js,
   -rooms.js, -rooms2.js, -rooms3.js, -rooms4.js, -rooms5.js) pixel for pixel: `u(n)` is n of its 32 pixels a tile, `X(n)` a
   pixel across the painting as x from the middle. */

import { pokeBall, ballTop, rod } from './base-models-kit.js';

const u = (n) => n / 32;
const X = (n, W = 1) => n / 32 - W / 2;
const TAU = Math.PI * 2;
const STONE = '#9a9aa6', INK = '#303038', CHROME = '#c8ccd8', ICE = '#bfe6f8', BALL_INK = '#26262e';
const RAINBOW = ['#e04848', '#f08030', '#f8d030', '#58b848', '#4a98d8', '#5a58c8', '#a858d8'];

const sheet = (w, h, draw) => { const c = new OffscreenCanvas(w, h); draw(c.getContext('2d'), w, h); return c; };
const pics = {};
const once = (key, make) => pics[key] || (pics[key] = make());
const hash = (i, j = 0) => { const h = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return h - Math.floor(h); };

/** A Poké Ball of radius r at x, y, z, its button facing +z, in the materials given (the lamp's lit half, the ice's). */
function orb(K, L, x, y, z, r, top, bottom, band, eye) {
  const { THREE, cyl } = L;
  K.put(new THREE.SphereGeometry(r, 24, 10, 0, TAU, 0, Math.PI / 2), top, x, y, z);
  K.put(new THREE.SphereGeometry(r, 24, 10, 0, TAU, Math.PI / 2, Math.PI / 2), bottom, x, y, z);
  K.put(cyl(r * 1.01, r * 0.16, r * 1.01, 24), band, x, y, z);
  K.put(cyl(r * 0.34, r * 0.2, r * 0.34, 18).rotateX(Math.PI / 2), band, x, y, z + r * 0.92);
  K.put(cyl(r * 0.22, r * 0.12, r * 0.22, 18).rotateX(Math.PI / 2), eye, x, y, z + r * 1.02);
}

/* the model planets' surfaces, wrapped round the globe (its front, facing you, a quarter of the way across) */
const PLANET = {
  red: (g, w, h, px) => {
    px((i, j) => hash(Math.floor(i / 10) + 3, Math.floor(j / 10)) < 0.22 ? '#a84828' : '#d86838');
    g.strokeStyle = '#a84828'; g.lineWidth = 3;
    for (const [i, j, r] of [[0.22, 0.4, 7], [0.3, 0.6, 6], [0.27, 0.24, 6], [0.7, 0.5, 8], [0.55, 0.35, 5]]) { g.beginPath(); g.ellipse(i * w, j * h, r, r * 1.2, 0, 0, TAU); g.stroke(); }
  },
  banded: (g, w, h, px) => {
    const cols = ['#e8c8a0', '#c88858', '#f0dcc0', '#b87848'];
    px((i, j) => cols[Math.max(0, Math.floor(j / h * 9 + Math.sin(i / w * TAU * 3) * 0.12)) % 4]);
    g.fillStyle = '#c84838'; g.beginPath(); g.ellipse(w * 0.29, h * 0.64, 12, 6, 0, 0, TAU); g.fill();
    g.fillStyle = '#e07058'; g.beginPath(); g.ellipse(w * 0.285, h * 0.635, 6, 3, 0, 0, TAU); g.fill();
  },
  blue: (g, w, h, px) => px((i, j) => Math.abs(Math.sin(j / h * 26 + Math.sin(i / w * TAU * 2) * 1.6 + i / w * 6)) < 0.25 ? '#a8d8f8' : '#4a78d8'),
  green: (g, w, h, px) => {
    px((i, j) => hash(Math.floor(i / 18), Math.floor(j / 16)) < 0.45 ? '#58a848' : '#3a88d0');
    g.fillStyle = '#ffffff';
    for (const [i, j, a, b] of [[0.18, 0.3, 14, 4], [0.31, 0.55, 12, 3.5], [0.6, 0.4, 16, 4], [0.85, 0.65, 12, 3]]) { g.beginPath(); g.ellipse(i * w, j * h, a, b, 0, 0, TAU); g.fill(); }
  },
  moon: (g, w, h, px) => {
    px((i, j) => hash(Math.floor(i / 6), Math.floor(j / 6)) < 0.12 ? '#bcbcbc' : '#c8c8c8');
    for (const [i, j, r] of [[0.2, 0.36, 9], [0.32, 0.55, 6], [0.24, 0.7, 6], [0.34, 0.27, 4.5], [0.62, 0.45, 8], [0.8, 0.3, 5], [0.9, 0.62, 7]]) {
      g.fillStyle = '#909090'; g.beginPath(); g.ellipse(i * w - 1, j * h - 1, r, r * 1.1, 0, 0, TAU); g.fill();
      g.fillStyle = '#a8a8a8'; g.beginPath(); g.ellipse(i * w + 0.5, j * h + 0.5, r * 0.85, r * 0.95, 0, 0, TAU); g.fill();
    }
  },
};
const planetPic = (id) => once('planet' + id, () => sheet(256, 128, (g, w, h) => {
  const px = (col) => {
    const img = g.createImageData(w, h), d = img.data;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const c = col(i, j), k = (j * w + i) * 4;
      d[k] = parseInt(c.slice(1, 3), 16); d[k + 1] = parseInt(c.slice(3, 5), 16); d[k + 2] = parseInt(c.slice(5, 7), 16); d[k + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  };
  PLANET[id](g, w, h, px);
}));

/* the ant farm's soil behind the glass: speckled earth, two tunnels, ants (the painting's x 5-27, y b-44 to b-24, 8x) */
const soilPic = () => once('soil', () => sheet(176, 160, (g, w, h) => {
  g.fillStyle = '#c89858'; g.fillRect(0, 0, w, h);
  for (let n = 0; n < 90; n++) { g.fillStyle = n % 3 ? '#a87838' : '#d8a868'; g.fillRect(Math.floor(hash(n, 1) * 44) * 4, Math.floor(hash(n, 2) * 40) * 4, 4, 4); }
  const at = ([i, j]) => [(i - 5) * 8, (j + 44) * 8];
  g.strokeStyle = '#7a5028'; g.lineWidth = 12; g.lineCap = 'round'; g.lineJoin = 'round';
  for (const pts of [[[8, -44], [10, -38], [16, -36], [20, -30], [24, -28]], [[18, -44], [16, -40], [12, -32], [9, -27]]]) {
    g.beginPath(); pts.map(at).forEach(([x, y], n) => (n ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
  }
  g.fillStyle = INK;
  for (const [i, j] of [[12, -37], [21, -30], [10, -29]]) { const [x, y] = at([i, j]); for (const dx of [0, 5, 10]) { g.beginPath(); g.ellipse(x + dx + 2, y + 4, 2.6, 2.2, 0, 0, TAU); g.fill(); } }
}));

/** A palm frond along +x, `len` long and `wid` half across, rising `rise` a unit out and drooping: a strip folded at its
    midrib, its edges notched into leaflets, a skin above and below. */
function frond(L, len, wid, rise = 0.3, n = 12) {
  const { THREE } = L, pos = [], idx = [], t0 = 0.006;
  for (let i = 0; i <= n; i++) {
    const t = i / n, d = t * len, y = rise * d - d * d / (len * 1.3), w = wid * Math.sin(Math.PI * (0.12 + 0.88 * t)) * (i % 2 ? 1 : 0.6), f = w * 0.8;
    pos.push(d, y, -w, d, y + f, 0, d, y, w, d, y - t0, -w, d, y + f - t0, 0, d, y - t0, w);
  }
  for (let i = 0; i < n; i++) {
    const a = i * 6, b = a + 6;
    idx.push(a, a + 1, b, a + 1, b + 1, b, a + 1, a + 2, b + 1, a + 2, b + 2, b + 1);
    idx.push(a + 3, b + 3, a + 4, a + 4, b + 3, b + 4, a + 4, b + 4, a + 5, a + 5, b + 4, b + 5);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export const SHAPES = {
  snowglobe: { make: 'snowglobe' },
  ballstatue: { make: 'ballstatue' },
  crystalball: { make: 'crystalball' },
  balldisplay: { make: 'balldisplay' },
  itemball: { make: 'itemball' },
  balllamp: { make: 'balllamp' },
  gymstatue: { make: 'gymstatue' },
  beachball: { make: 'beachball' },
  palmtree: { make: 'palmtree' },
  coral: { make: 'reefcoralM' },
  iceball: { make: 'iceball' },
  plasmaglobe: { make: 'plasmaglobe' },
  antfarm: { make: 'antfarm' },
  redplanet: { make: 'planetM', planet: 'red' },
  bandedplanet: { make: 'planetM', planet: 'banded' },
  blueplanet: { make: 'planetM', planet: 'blue' },
  greenplanet: { make: 'planetM', planet: 'green' },
  moonplanet: { make: 'planetM', planet: 'moon' },
  gumball: { make: 'gumball' },
};

export const MAKES = {
  /* ----- Things ----- */

  snowglobe(K, s, W, D, L) {
    const { lathe, cyl } = L, wood = K.wood(), snow = K.plain('#ffffff'), leaf = K.plain(K.pal.leaf), R = K.r, c = u(21);
    // a turned wooden base with its accent band, the glass globe, a drift of snow inside, a little fir and flakes
    K.put(lathe([[u(11), 0], [u(11), u(3.5)], [u(10.2), u(4)], [u(10.2), u(6)], [u(10.6), u(6.5)], [u(10), u(9)], [u(8), u(9.4)], [0, u(9.4)]], 16), wood, 0, 0, 0);
    K.put(cyl(u(10.45), u(2), u(10.45), 16), K.gloss(K.pal.a), 0, u(5), 0);
    K.put(L.ball(u(11), 24, 16), K.glass(), 0, c, 0);
    K.put(lathe([[0, u(10.3)], [u(4), u(10.9)], [u(6.5), u(12.2)], [u(7.5), u(13.2)], [u(5.5), u(14.3)], [u(2.5), u(14.9)], [0, u(15)]], 16), snow, 0, 0, 0);
    K.put(cyl(u(1), u(3), u(1), 8), wood, 0, u(16), 0);
    K.put(cyl(0, u(8), u(6.6), 12), leaf, 0, u(21), 0);
    K.put(cyl(0, u(7), u(5), 12), leaf, 0, u(25.5), 0);
    for (let n = 0; n < 14; n++) {
      const a = R() * TAU, d = Math.sqrt(R()) * u(8.5), y = u(16) + R() * u(12);
      if (Math.hypot(d, y - c) > u(10)) continue;
      K.put(new L.THREE.IcosahedronGeometry(u(0.55), 0), snow, Math.cos(a) * d, y, Math.sin(a) * d);
    }
  },

  ballstatue(K, s, W, D, L) {
    const { rbox, lathe } = L, stone = K.gloss(K.pal.p), dark = K.gloss(L.tone(K.pal.p, 0.86));
    // a stone plinth with a groove, its overhanging cap, a cradle, the Poké Ball on top in the theme's colour
    K.put(rbox(u(24), u(18), 0.68, 0.02), stone, 0, u(9), 0);
    K.put(rbox(u(20), u(0.7), 0.01, 0.002, 1), dark, 0, u(16.5), 0.341);
    K.put(rbox(u(28), u(4), 0.8, 0.02), dark, 0, u(20), 0);
    K.put(rbox(u(27), u(0.6), 0.78, 0.004, 1), K.gloss(L.tone(K.pal.p, 1.08)), 0, u(21.8), 0);
    K.put(lathe([[u(8), 0], [u(8), u(0.8)], [u(6.5), u(2.6)], [0, u(2.6)]], 16), dark, 0, u(22), 0);
    pokeBall(K, L, 0, u(38), 0, u(14), K.pal.c);
  },

  crystalball(K, s, W, D, L) {
    const { lathe, cyl, ball } = L, prong = K.gloss(K.pal.a), c = u(24);
    // a turned wooden base, a collar and four claws holding the tinted crystal, a lit mist inside it and a bright heart
    K.put(lathe([[u(10), 0], [u(10), u(1)], [u(9.2), u(3.5)], [u(8.6), u(5.5)], [u(7), u(7)], [0, u(7)]], 16), K.wood(), 0, 0, 0);
    K.put(cyl(u(4.5), u(2), u(5.5), 14), prong, 0, u(8), 0);
    for (const a of [0.35, 1.92, 3.49, 5.06]) {
      K.put(cyl(u(0.5), u(9), u(2.2), 8).translate(0, u(4.5), 0).rotateZ(-0.34).rotateY(-a), prong, Math.cos(a) * u(4.4), u(7.4), Math.sin(a) * u(4.4));
    }
    K.put(ball(u(11), 24, 16), K.M('glass', '#b090f0', { key: 'crystal' }), 0, c, 0);
    K.put(ball(u(9.2), 16, 12), K.glow('#c8a0f8'), 0, c, 0);
    K.put(ball(u(5.5), 12, 8), K.glow('#f0e0ff'), u(1), c - u(2), 0.03);
    K.put(ball(u(2.5), 10, 8), K.glow('#ffffff'), u(2), c - u(3), 0.08);
    K.put(ball(u(1.4), 8, 6).scale(1, 1, 0.5), K.gloss('#ffffff'), X(11.5), u(28.5), u(8.5));
  },

  /* ----- Pokémon Center ----- */

  balldisplay(K, s, W, D, L) {
    const { rbox, cyl, blob } = L, wood = K.wood();
    // a wooden foot, a pale column with an accent band, a wooden top, its cushion, a red Poké Ball resting on it
    K.put(rbox(u(24), u(8), 0.6, 0.02), wood, 0, u(4), 0);
    K.put(cyl(u(6), u(20), u(6), 16), K.gloss(K.pal.p), 0, u(18), 0);
    K.put(cyl(u(6.2), u(2), u(6.2), 16), K.gloss(K.pal.a), 0, u(21), 0);
    K.put(rbox(u(20), u(4), 0.5, 0.015), wood, 0, u(30), 0);
    K.put(blob(u(16), u(5), 0.4, 0.3, 0.5), K.cloth(K.pal.c), 0, u(33.4), 0);
    pokeBall(K, L, 0, u(43), 0, u(7.6), '#e04848');
  },

  itemball(K, s, W, D, L) {
    pokeBall(K, L, 0, u(9), 0, u(9), ballTop(K));
  },

  balllamp(K, s, W, D, L) {
    const { lathe, cyl } = L, metal = K.metal(), lit = K.glow(K.pal.gl), dark = K.gloss(BALL_INK);
    // a domed metal foot, its stem and socket, a Poké Ball whose white half is the lit shade
    K.put(lathe([[u(9), 0], [u(9), u(1.5)], [u(8), u(3.5)], [u(5), u(5)], [u(2), u(6)], [0, u(6)]], 16), metal, 0, 0, 0);
    K.put(cyl(u(1.5), u(25), u(1.5), 10), metal, 0, u(17.5), 0);
    K.put(cyl(u(3), u(2), u(2), 12), metal, 0, u(29.6), 0);
    orb(K, L, 0, u(42), 0, u(13), K.gloss(ballTop(K)), lit, dark, lit);
  },

  /* ----- Gym ----- */

  gymstatue(K, s, W, D, L) {
    const { rbox, cyl, ball, THREE } = L, rock = K.plain(STONE), p = K.pal.p, P = (x, y, z = 0) => [X(x), u(y), z];
    // the plinth with its plaque and overhanging cap, the gym's stone Rhydon on it, facing left as in the painting
    K.put(rbox(u(28), u(22), 0.72, 0.02), K.gloss(p), 0, u(11), 0);
    K.put(rbox(u(24), u(0.7), 0.01, 0.002, 1), K.gloss(L.tone(p, 1.1)), 0, u(19.5), 0.361);
    K.put(rbox(u(14), u(7), 0.02, 0.006, 1), K.gloss(K.pal.a), 0, u(12.5), 0.365);
    K.put(rbox(u(10), u(0.8), 0.006, 0.002, 1), K.gloss(L.tone(K.pal.a, 0.7)), 0, u(12.8), 0.376);
    K.put(rbox(W - 0.01, u(4), 0.86, 0.02), K.gloss(L.tone(p, 0.88)), 0, u(24), 0);
    // legs and feet, the body, chest, head and snout, the horn, a curling tail, little arms, eyes
    for (const [x, z] of [[10, u(2.6)], [18, -u(2.6)]]) {
      K.put(cyl(u(2.2), u(4), u(2.6), 10), rock, X(x), u(28), z);
      K.put(ball(u(2.6), 10, 6).scale(1.35, 0.6, 1), rock, X(x - 0.8), u(26.9), z);
    }
    K.put(ball(1, 14, 10).scale(u(8.5), u(5.6), u(6)), rock, X(14), u(32.5), 0);
    K.put(ball(1, 12, 8).scale(u(6), u(4), u(5)), rock, X(13), u(37), 0);
    K.put(ball(1, 12, 8).scale(u(6.4), u(4.2), u(4.8)), rock, X(14), u(41.4), 0);
    K.put(ball(1, 10, 8).scale(u(3.2), u(2.6), u(3.4)), rock, X(8.6), u(40), 0);
    K.put(cyl(0, u(6.5), u(2.6), 10).translate(0, u(3.25), 0), rock, X(13.4), u(44.4), 0, 0, 0, -0.32);
    const tail = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([P(20, 31), P(23.2, 33), P(24.4, 36.5), P(23.4, 40.5)].map(v => new THREE.Vector3(...v))), 12, u(1.4), 6);
    K.put(tail, rock, 0, 0, 0);
    K.put(ball(u(1.4), 8, 6), rock, X(23.4), u(40.5), 0);
    for (const sg of [-1, 1]) {
      rod(K, L, rock, P(10.5, 35, sg * u(3.6)), P(7, 33, sg * u(4.4)), u(1.1));
      K.put(ball(u(1.3), 8, 6), rock, X(7), u(33), sg * u(4.4));
      K.put(ball(u(0.9), 8, 6), K.gloss('#3a3a48'), X(11), u(41.4), sg * u(3.9));
    }
  },

  /* ----- Beach ----- */

  beachball(K, s, W, D, L) {
    const { THREE, cyl } = L, r = u(11.5), cols = [K.pal.c, '#f8d030', '#4a88d8', '#ffffff', '#58c868', K.pal.c];
    // six gores round an axis pointing at you, a white cap at each pole
    cols.forEach((c, i) => K.put(new THREE.SphereGeometry(r, 4, 14, i * Math.PI / 3, Math.PI / 3).rotateX(Math.PI / 2), K.gloss(c), 0, r, 0));
    for (const sg of [-1, 1]) K.put(cyl(u(2.2), u(0.6), u(2.2), 14).rotateX(Math.PI / 2), K.gloss('#ffffff'), 0, r, sg * (r - u(0.1)));
  },

  palmtree(K, s, W, D, L) {
    const { lathe, cyl, ball } = L, bark = K.wood(), ring = K.plain(L.tone(K.pal.w, 0.72)), leaf = K.gloss(K.pal.leaf), nut = K.gloss('#6a4426');
    // a trunk of flared segments curving to the right as in the painting, a ring at each joint
    const at = (j) => [X(16 + (j / 70) ** 2 * 8), u(j)], rad = (j) => u(3 - j / 70 * 1.1);
    for (let j = 0; j < 70; j += 7) {
      const [x0, y0] = at(j), [x1, y1] = at(j + 7), len = Math.hypot(x1 - x0, y1 - y0), r0 = rad(j), r1 = rad(j + 7), tilt = -Math.atan2(x1 - x0, y1 - y0);
      K.put(lathe([[r0 * 0.9, 0], [r1 * 1.02, len * 0.8], [r1 * 1.16, len], [0, len]], 10), bark, x0, y0, 0, 0, 0, tilt);
      K.put(cyl(r1 * 1.18, u(0.6), r1 * 1.18, 10), ring, x1, y1 - u(0.3), 0, 0, 0, tilt);
    }
    // fronds all round the crown, the long ones out to the left as painted
    const cx = X(22), cy = u(71);
    // (each rolled so its face tips towards you, as the painting shows them)
    for (const [a, len, wid, dy, rise] of [[180, 18, 2.8, 0, 0], [0, 11, 2.6, 0, 0], [160, 13, 2.6, 3, 0.3], [20, 10, 2.4, 3, 0.3], [200, 10, 2.4, -1, 0],
      [95, 11, 2.4, 0.5, 0.2], [270, 12, 2.4, 0.5, 0.25], [130, 12, 2.4, 0, 0.15], [55, 10, 2.4, 0, 0.15], [320, 10, 2.2, 0.5, 0.2], [235, 11, 2.2, 0, 0.2]]) {
      const t = a * Math.PI / 180;
      K.put(frond(L, u(len), u(wid * 1.15), rise), leaf, cx, cy + u(dy), 0, -t, 0.55 * Math.cos(t));
    }
    K.put(ball(u(2.2), 10, 8), leaf, cx, cy + u(0.5), 0);
    for (const [i, j, z] of [[19, 68, 0.04], [23, 67, 0.03], [21, 64.5, 0.06], [21.5, 67.5, -0.05]]) K.put(ball(u(2.5), 10, 8), nut, X(i), u(j), z);
  },

  reefcoralM(K, s, W, D, L) {
    const { THREE, lathe, ball } = L, c = K.pal.c, m = K.gloss(c), tip = K.gloss(L.tone(c, 1.35));
    // a rounded stone, three coral stems forking twice as painted, each fork turned a little in or out for depth
    K.put(lathe([[u(12), 0], [u(11.6), u(2)], [u(9.5), u(5)], [u(6), u(8.5)], [u(2), u(10)], [0, u(10.2)]], 14).scale(1, 1, 0.75), K.plain(STONE), X(16), 0, 0);
    const branch = (p, ang, yaw, len, d) => {
      const dir = new THREE.Vector3(Math.sin(ang), Math.cos(ang), 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw), q = p.clone().addScaledVector(dir, u(len)), r = u(d ? 1 : 1.5);
      rod(K, L, m, p.toArray(), q.toArray(), r);
      if (d < 2) {
        K.put(ball(r, 8, 6), m, q.x, q.y, q.z);
        branch(q, ang - 0.5, yaw + (d ? 0.3 : -0.35), Math.floor(len * 0.6), d + 1);
        branch(q, ang + 0.5, yaw - (d ? 0.3 : -0.35), Math.floor(len * 0.6), d + 1);
      } else K.put(ball(u(1.5), 8, 6), tip, q.x, q.y, q.z);
    };
    const V = (x, y, z) => new THREE.Vector3(X(x), u(y), z);
    branch(V(16.5, 7), -0.15, 0, 14, 0);
    branch(V(10.5, 6), -0.6, 0.5, 9, 1);
    branch(V(22.5, 6), 0.6, -0.5, 9, 1);
    branch(V(14, 6, 0.1), 0.25, 1.4, 8, 1);
    branch(V(18, 6, -0.1), -0.3, -1.6, 8, 1);
  },

  /* ----- Winter ----- */

  iceball(K, s, W, D, L) {
    const { rbox, cyl } = L, ice = K.gloss(ICE), r = u(13.5), c = u(24.5), R = K.r;
    // a wooden plinth with its groove, an ice foot, the Poké Ball carved in ice, a few glints on it
    K.put(rbox(u(22), u(10), 0.48, 0.02), K.wood(), 0, u(5), 0);
    K.put(rbox(u(18), u(0.6), 0.01, 0.002, 1), K.wood(L.tone(K.pal.w, 0.75)), 0, u(5.5), 0.241);
    K.put(cyl(u(4.5), u(1.6), u(5.5), 14), ice, X(16.5), u(10.8), 0);
    orb(K, L, X(16.5), c, 0, r, ice, K.gloss('#eaf6fc'), K.gloss('#7ab8d8'), K.gloss('#ffffff'));
    for (const [i, j] of [[8, 34], [24, 20], [12, 16]]) {
      const x = X(i) - X(16.5), y = u(j) - c, z = Math.sqrt(Math.max(0, r * r - x * x - y * y)) + u(0.3);
      K.put(new L.THREE.OctahedronGeometry(u(0.9), 0).scale(1, 1.6, 0.5), K.plain('#ffffff'), X(i), u(j), z, R() * 0.5);
    }
  },

  /* ----- Types ----- */

  plasmaglobe(K, s, W, D, L) {
    const { THREE, lathe, cyl, ball } = L, metal = K.metal(), c = u(28), core = K.glow('#f8e8ff'), arc = K.glow('#d088f8'), R = K.r;
    // a turned metal base with a dark band, its collar and electrode, the smoky glass globe, the core and its tendrils
    K.put(lathe([[u(8), 0], [u(8), u(1)], [u(7.6), u(10)], [u(6.5), u(12)], [u(4), u(12.5)], [0, u(12.5)]], 16), metal, 0, 0, 0);
    K.put(cyl(u(7.9), u(2), u(7.85), 16), K.gloss(L.tone(K.pal.m, 0.4)), 0, u(7), 0);
    K.put(cyl(u(4.5), u(3.5), u(5.5), 14), metal, 0, u(14), 0);
    K.put(cyl(u(0.8), u(10), u(1.2), 8), K.gloss('#2a1a3a'), 0, u(20.5), 0);
    K.put(ball(u(13), 24, 16), K.M('glass', '#7a4aa8', { key: 'plasma' }), 0, c, 0);
    K.put(ball(u(3), 12, 8), core, 0, c, 0);
    for (let a = 0; a < 7; a++) {
      const t = a / 7 * TAU, e = (R() - 0.5) * 1.6, pts = [];
      for (let k = 0; k <= 5; k++) {
        const d = u(2.5 + k * 1.9), w = t + Math.sin(k + a) * 0.3, el = e + Math.sin(k * 1.7 + a) * 0.15;
        pts.push(new THREE.Vector3(Math.cos(w) * Math.cos(el) * d, c + Math.sin(w) * Math.cos(el) * d, Math.sin(el) * d));
      }
      K.put(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, u(0.4), 4), arc, 0, 0, 0);
      const end = pts[5];
      K.put(ball(u(0.9), 6, 4), core, end.x, end.y, end.z);
    }
  },

  antfarm(K, s, W, D, L) {
    const { rbox } = L, wood = K.wood(), frame = K.gloss(K.pal.c), glass = K.glass();
    // a wooden stand: two legs on feet and a rail; on it the thin frame, glass front and back, the soil and its tunnels
    for (const x of [6.5, 25.5]) {
      K.put(rbox(u(3), u(18), 0.12, 0.01), wood, X(x), u(9), 0);
      K.put(rbox(u(5), u(1.5), 0.3, 0.008, 1), wood, X(x), u(0.75), 0);
    }
    K.put(rbox(u(28), u(4), 0.2, 0.015), wood, 0, u(20), 0);
    K.put(rbox(u(26), u(2), 0.16, 0.008), frame, 0, u(23), 0);
    K.put(rbox(u(26), u(2), 0.16, 0.008), frame, 0, u(55), 0);
    for (const x of [4, 28]) K.put(rbox(u(2), u(34), 0.16, 0.008), frame, X(x), u(39), 0);
    for (const z of [-0.055, 0.055]) K.put(new L.THREE.PlaneGeometry(u(22), u(30)), glass, 0, u(39), z, z < 0 ? Math.PI : 0);
    K.put(rbox(u(22), u(20), 0.1, 0.004, 1), K.plain('#c89858'), 0, u(34), 0);
    for (const z of [-0.0505, 0.0505]) K.put(new L.THREE.PlaneGeometry(u(22), u(20)), K.pic(soilPic()), 0, u(34), z, z < 0 ? Math.PI : 0);
    // an ant out on the surface
    const ant = K.gloss(INK);
    for (const dx of [0, 0.014, 0.028]) K.put(L.ball(0.008, 6, 4), ant, X(14) + dx, u(44) + 0.008, 0.01);
  },

  /* ----- Space ----- */

  planetM(K, s, W, D, L) {
    const { rbox, cyl, torus, ball } = L, metal = K.metal(), pin = K.gloss(K.pal.a), c = u(50);
    // the stand, its post, the half meridian round the left, the planet, a pin on top
    K.put(rbox(u(16), u(6), 0.4, 0.015), metal, 0, u(3), 0);
    K.put(cyl(u(1), u(29), u(1.2), 10), metal, 0, u(20.5), 0);
    K.put(torus(u(15), u(1), Math.PI, 28).rotateZ(Math.PI / 2), metal, 0, c, 0);
    for (const sg of [-1, 1]) K.put(ball(0.024, 8, 6), metal, 0, c + sg * u(14.4), 0);
    K.put(ball(u(13), 24, 16), K.pic(planetPic(s.planet)), 0, c, 0);
    K.put(cyl(0.012, u(3), 0.012, 8), pin, 0, c + u(15), 0);
    K.put(ball(0.018, 8, 6), pin, 0, c + u(16.6), 0);
  },

  /* ----- Arcade ----- */

  gumball(K, s, W, D, L) {
    const { rbox, cyl, ball, lathe } = L, body = K.gloss(K.pal.c), chrome = K.metal(CHROME), ink = K.gloss(INK), R = K.r, c = u(55), r = u(13);
    // the foot, post and coin box with its chrome crank, coin slot and chute
    K.put(rbox(u(16), u(6), u(16), 0.02), body, 0, u(3), 0);
    K.put(cyl(u(2), u(22), u(2.2), 12), body, 0, u(17), 0);
    K.put(rbox(u(16), u(12), u(14), 0.03), body, 0, u(34), 0);
    K.put(cyl(u(3), u(1), u(3), 16).rotateX(Math.PI / 2), chrome, 0, u(35), u(7.4));
    K.put(rbox(u(5.4), u(1.2), u(1.2), 0.005, 1), chrome, 0, u(35), u(8.2));
    K.put(rbox(u(0.5), u(1.8), 0.01, 0.002, 1), ink, u(1.8), u(35.2), u(7.95), 0, 0, 0);
    K.put(rbox(u(6), u(2), 0.03, 0.004, 1), ink, 0, u(30), u(6.6));
    K.put(rbox(u(6), u(0.8), u(1.2), 0.003, 1), chrome, 0, u(29), u(7.2), 0, -0.4);
    // the neck, the glass globe, a heap of gumballs in it, the lid and its knob
    K.put(cyl(u(6), u(3), u(7), 16), body, 0, u(41.5), 0);
    K.put(ball(r, 24, 16), K.M('glass', '#e8f4f8', { key: 'gumglobe' }), 0, c, 0);
    // on a grid in the globe's lower half: the ones against the glass and the heap's top only, the rest unseen
    const g = u(3.8);
    let n = 0;
    for (let y = u(44.2); y < c; y += g) for (let x = -r; x <= r; x += g) for (let z = -r; z <= r; z += g) {
      const d = Math.hypot(x, y - c, z);
      if (d > r - u(1.9) || (d < r - u(4.5) && y + g < c)) continue;
      K.put(ball(u(1.75), 6, 5), K.gloss(RAINBOW[n++ % 7]), x + (R() - 0.5) * u(1.2), y + (R() - 0.5) * u(0.8), z + (R() - 0.5) * u(1.2));
    }
    K.put(lathe([[u(5.5), 0], [u(5.5), u(2.5)], [u(4.6), u(4)], [0, u(4.2)]], 16), body, 0, u(66.5), 0);
    K.put(ball(u(2), 10, 8), body, 0, u(72), 0);
  },
};
