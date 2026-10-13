/* base-models-k.js  -  Station and Sky Palace pieces, modelled from parts like the arcade cabinets (the user's ask, 2026-10-12).
   js/base-models-f.js's head says how a batch works. Most builders here follow their painting (js/base-furniture-rooms5.js)
   pixel for pixel: `u(n)` is n of its 32 pixels a tile, `X(n, W)` a pixel across the painting as x from the middle.
   Left as they were: the rugs and the wall pieces. */

import { rod, tube } from './base-models-kit.js';

const u = (n) => n / 32;
const X = (n, W = 1) => n / 32 - W / 2;
const GOLD = '#f0c040', BRASS = '#d8a838', INK = '#303038', CHROME = '#c8ccd8', STONE = '#9a9aa6', MARBLE = '#ece8e0',
  CLOUD = '#eef2fc', WATER = '#58b0e0';
const RAINBOW = ['#e04848', '#f08030', '#f8d030', '#58b848', '#4a98d8', '#5a58c8', '#a858d8'];
const TAU = Math.PI * 2;

const sheet = (w, h, draw) => { const c = new OffscreenCanvas(w, h); draw(c.getContext('2d'), w, h); return c; };
const pics = {};
const once = (key, make) => pics[key] || (pics[key] = make());

/** A side profile ([x, y] points) extruded `d` deep, centred on z 0. */
function slab(L, pts, d, bevel = 0.015) {
  const { THREE } = L, sh = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(sh, { depth: Math.max(0.001, d - bevel * 2), bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 24 });
  g.translate(0, 0, -d / 2 + bevel);
  return g;
}

/** A wheel of radius r facing along z: a tyre, its face in `m`, a chrome hub. */
function wheel(K, L, m, x, y, z, r, t = 0.035) {
  const { cyl } = L, sg = Math.sign(z) || 1;
  K.put(cyl(r, t, r, 24).rotateX(Math.PI / 2), K.gloss(INK), x, y, z);
  K.put(cyl(r * 0.78, t + 0.01, r * 0.78, 24).rotateX(Math.PI / 2), m, x, y, z);
  K.put(cyl(r * 0.28, t + 0.03, r * 0.28, 14).rotateX(Math.PI / 2), K.metal(CHROME), x, y, z + sg * 0.005);
}

/** A cloud of round puffs, rx x ry x rz, its bottom at y. */
function cloud(K, L, x, y, z, rx, ry, rz = rx * 0.8) {
  const { ball } = L, m = K.gloss(CLOUD), n = Math.max(4, Math.round(rx / 0.07));
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), a = i * 2.4, r = ry * (0.6 + Math.sin(t * Math.PI) * 0.45);
    K.put(ball(r, 18, 12), m, x - rx + r * 0.8 + t * (rx - r * 0.8) * 2, y + r * 0.85, z + Math.sin(a) * (rz - r) * 0.6);
  }
  K.put(ball(1, 22, 14).scale(rx * 0.75, ry * 0.75, rz * 0.8), m, x, y + ry * 0.8, z);
}

/** A track along x at y, `len` long: sleepers and two chrome rails at z +-g. */
function trackX(K, L, len, y, g = 0.11, z = 0) {
  const { rbox } = L;
  for (let x = -len / 2 + 0.06; x < len / 2; x += 0.13) K.put(rbox(0.07, 0.03, g * 2 + 0.14, 0.008), K.wood('#6a4a30'), x, y - 0.015, z);
  for (const s of [-1, 1]) K.put(rbox(len, 0.03, 0.025, 0.006), K.metal(CHROME), 0, y + 0.015, z + s * g);
}

/** The models' display: a wooden plinth with a brass plaque and a length of track on top; returns the rails' top. */
function display(K, L, W) {
  const { rbox } = L, h = u(12);
  K.put(rbox(W - 0.06, h, 0.56, 0.03), K.wood(), 0, h / 2, 0);
  K.put(rbox(W - 0.02, 0.04, 0.6, 0.015), K.wood(L.tone(K.pal.w, 0.85)), 0, h - 0.02, 0);
  K.put(rbox(u(12), u(4), 0.01, 0.004), K.metal(BRASS), 0, u(7), 0.285);
  trackX(K, L, W - 0.1, h + 0.03);
  return u(15);
}

/* the orbs' pictures: the orb's colour all round, its sign on the front and back */
const ORB_ART = {
  sun: ['#f8b830', (g) => { const r = g.createRadialGradient(-10, -10, 4, 0, 0, 60); r.addColorStop(0, '#fff8d0'); r.addColorStop(0.5, '#fff0a0'); r.addColorStop(1, 'rgba(255,240,160,0)'); g.fillStyle = r; g.beginPath(); g.arc(0, 0, 60, 0, Math.PI * 2); g.fill(); }],
  moon: ['#3a4a8a', (g) => {
    g.fillStyle = '#f8f0c0'; g.beginPath(); g.arc(-10, 0, 48, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#3a4a8a'; g.beginPath(); g.arc(12, -18, 44, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffffff'; for (const [x, y, r] of [[36, 30, 4], [44, -46, 3], [-50, -50, 2.5]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
  }],
  star: ['#9a68e8', (g) => {
    const pts = (R, r) => { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, d = i % 2 ? r : R; g.lineTo(Math.cos(a) * d, Math.sin(a) * d); } g.closePath(); };
    g.fillStyle = '#c8a030'; pts(66, 28); g.fill(); g.fillStyle = '#fff4a0'; pts(58, 24); g.fill(); g.fillStyle = '#ffffff'; pts(22, 10); g.fill();
  }],
  rain: ['#4a98e8', (g) => {
    g.fillStyle = '#e8f0f8'; for (const [x, y, r] of [[-26, -16, 22], [4, -26, 28], [30, -12, 20], [0, -6, 26]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#c8e8ff'; for (const x of [-26, 0, 26]) { g.beginPath(); g.moveTo(x, 18); g.quadraticCurveTo(x + 9, 38, x, 44); g.quadraticCurveTo(x - 9, 38, x, 18); g.fill(); }
  }],
  wind: ['#58c8b0', (g) => {
    g.strokeStyle = '#ffffff'; g.lineCap = 'round'; g.lineWidth = 9;
    g.beginPath(); g.arc(0, -6, 34, Math.PI * 0.2, Math.PI * 1.75); g.stroke();
    g.strokeStyle = '#e8fff8'; g.lineWidth = 7; g.beginPath(); g.arc(4, -6, 16, Math.PI * 0.2, Math.PI * 1.75); g.stroke();
    g.strokeStyle = '#ffffff'; g.beginPath(); g.moveTo(-52, 40); g.lineTo(26, 40); g.stroke();
  }],
  thunder: ['#4a4a68', (g) => {
    const bolt = () => { g.beginPath(); for (const [x, y] of [[10, -60], [-26, 6], [-2, 6], [-14, 60], [28, -12], [4, -12], [22, -60]]) g.lineTo(x, y); g.closePath(); };
    g.fillStyle = '#c8a020'; g.save(); g.translate(3, 3); bolt(); g.fill(); g.restore(); g.fillStyle = '#f8e048'; bolt(); g.fill();
    g.fillStyle = '#fff8a0'; g.fillRect(4, -50, 6, 30);
  }],
};
const orbPic = (id) => once('orb' + id, () => sheet(512, 256, (g, w, h) => {
  const [col, sign] = ORB_ART[id];
  g.fillStyle = col; g.fillRect(0, 0, w, h);
  const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, 'rgba(255,255,255,0.22)'); sky.addColorStop(0.5, 'rgba(255,255,255,0)'); sky.addColorStop(1, 'rgba(0,0,0,0.18)');
  g.fillStyle = sky; g.fillRect(0, 0, w, h);
  for (const cx of [w * 0.25, w * 0.75]) { g.save(); g.translate(cx, h / 2); g.scale(0.9, 0.9); sign(g); g.restore(); }
}));

/* the buffer stop's beam: red, white chevrons */
const bufferBeam = () => once('buffer', () => sheet(256, 96, (g, w, h) => {
  g.fillStyle = '#e04040'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#ffffff'; for (let x = -40; x < w; x += 58) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + 26, h); g.lineTo(x + 66, 0); g.lineTo(x + 40, 0); g.fill(); }
  g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, h - 8, w, 8);
}));

/* the hot air balloon's gores in the theme's colour and pale */
const gores = (c, p) => once('gores' + c + p, () => sheet(256, 64, (g, w, h) => {
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? c : p; g.fillRect(i * w / 8, 0, w / 8, h); }
  g.fillStyle = 'rgba(0,0,0,0.12)'; for (let i = 0; i < 8; i++) g.fillRect(i * w / 8, 0, 2, h);
}));

/* the tram's destination sign */
const destSign = () => once('dest', () => sheet(96, 32, (g, w, h) => {
  g.fillStyle = INK; g.fillRect(0, 0, w, h);
  g.fillStyle = '#f8d030'; g.font = 'bold 22px monospace'; g.textBaseline = 'middle'; g.textAlign = 'center'; g.fillText('12', w / 2, h / 2 + 1);
}));

export const SHAPES = {
  // boxes, the painting on the front only (js/base-models-kit.js)
  'ticketmachine': { make: 'frontbox', d: 0.5 },
  'newsstand': { make: 'frontbox', d: 0.5 },
  // built from parts
  steamloco: { make: 'steamloco' },
  dieselloco: { make: 'dieselloco' },
  bulletloco: { make: 'bulletloco' },
  tramloco: { make: 'tramloco' },
  monorailloco: { make: 'monorailloco' },
  minecartloco: { make: 'minecartloco' },
  ticketgate: { make: 'ticketgate' },
  luggagecart: { make: 'luggagecart' },
  suitcases: { make: 'suitcases' },
  railsignal: { make: 'railsignal' },
  crossing: { make: 'crossing' },
  watertower: { make: 'watertower' },
  stationlamp: { make: 'stationlamp' },
  bufferstop: { make: 'bufferstop' },
  coalcart: { make: 'coalcart' },
  handcar: { make: 'handcar' },
  'sunorb moonorb starorb rainorb windorb thunderorb': { make: 'skyorb' },
  rainbowbridge: { make: 'rainbowarch' },
  skyfountain: { make: 'skyfountain' },
  featherlamp: { make: 'featherlamp' },
  floatisland: { make: 'floatisland' },
  cloudcolumn: { make: 'cloudcolumn' },
  airshipmodel: { make: 'airshipmodel' },
  balloonmodel: { make: 'balloonmodel' },
  skybell: { make: 'skybell' },
  wingstatue: { make: 'wingstatue' },
  cloudstair: { make: 'cloudstair' },
};

export const MAKES = {
  /* ----- Station: the train models, each on its display ----- */

  steamloco(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, r = display(K, L, W), y = (n) => r + u(n), x = (n) => X(n, W);
    const iron = K.gloss(K.pal.m), red = K.gloss(K.pal.c), brass = K.metal(BRASS);
    // three driving wheels and two small leading ones a side, a chrome coupling rod
    for (const sz of [-1, 1]) {
      for (const i of [12, 24, 36]) wheel(K, L, red, x(i), y(6), sz * 0.13, u(6));
      for (const i of [46, 53]) wheel(K, L, red, x(i), y(3), sz * 0.13, u(3));
      K.put(rbox(u(24), 0.025, 0.015, 0.006), K.metal(CHROME), x(24), y(6), sz * 0.16);
    }
    // the footplate, the boiler with its brass bands and dome, the chimney
    K.put(rbox(u(52), u(3), 0.36, 0.01), K.gloss(L.tone(K.pal.m, 0.8)), x(32), y(11.5), 0);
    K.put(rbox(u(52), 0.012, 0.37, 0.004), red, x(32), y(10), 0);
    K.put(cyl(u(7), u(46), u(7), 28).rotateZ(Math.PI / 2), iron, x(31), y(20), 0);
    K.put(cyl(u(6.5), 0.02, u(6.5), 28).rotateZ(Math.PI / 2), K.gloss(L.tone(K.pal.m, 0.7)), x(54), y(20), 0);
    for (const i of [22, 32, 42]) K.put(cyl(u(7) + 0.006, 0.025, u(7) + 0.006, 28).rotateZ(Math.PI / 2), brass, x(i), y(20), 0);
    K.put(ball(u(4), 16, 10).scale(1, 0.8, 1), brass, x(33), y(27), 0);
    K.put(cyl(u(3), u(12), u(2.6), 18), iron, x(49), y(33), 0);
    K.put(cyl(u(4.5), u(3), u(3.5), 18), iron, x(49), y(40), 0);
    K.put(ball(u(2), 12, 8), K.glow('#fff4c0'), x(56.5), y(20), 0.02);
    // the cab, its windows lit, its roof overhanging
    K.put(rbox(u(16), u(27), 0.36, 0.02), red, x(10), y(26.5), 0);
    for (const sz of [-1, 1]) K.put(rbox(u(10), u(9), 0.01, 0.004), K.glow('#bfe0f0'), x(10), y(31.5), sz * 0.181);
    K.put(rbox(u(9), u(8), 0.01, 0.004), K.glow('#bfe0f0'), x(18.1), y(31.5), 0, Math.PI / 2);
    K.put(rbox(u(19), u(3), 0.42, 0.012), iron, x(10), y(41.5), 0);
    // the cowcatcher, and two puffs of steam over the chimney
    K.put(slab(L, [[0, 0], [u(8), 0], [0, u(8)]], 0.3, 0.008), iron, x(55), y(1), 0);
    K.put(ball(u(4), 14, 10), K.gloss('#f4f4f8'), x(49), y(46), 0);
    K.put(ball(u(3), 14, 10), K.gloss('#e8ecf4'), x(54), y(51), 0.02);
  },

  dieselloco(K, s, W, D, L) {
    const { rbox } = L, r = display(K, L, W), y = (n) => r + u(n), x = (n) => X(n, W);
    const iron = K.gloss(K.pal.m), body = K.gloss(K.pal.c);
    // two bogies of two wheels a side
    for (const bx of [15, 49]) {
      K.put(rbox(u(18), u(3), 0.3, 0.01), iron, x(bx), y(6.5), 0);
      for (const sz of [-1, 1]) for (const dx of [-4, 4]) wheel(K, L, iron, x(bx + dx), y(3), sz * 0.13, u(3));
    }
    // the hood: the theme's colour, its stripe in the accent, cab windows at both ends, louvres, the roof and horn
    K.put(rbox(u(56), u(24), 0.36, 0.035), body, x(32), y(20), 0);
    K.put(rbox(u(56) + 0.006, u(4), 0.366, 0.01), K.gloss(K.pal.a), x(32), y(16), 0);
    for (const i of [11, 53]) for (const sz of [-1, 1]) K.put(rbox(u(8), u(7), 0.01, 0.004), K.glow('#bfe0f0'), x(i), y(25.5), sz * 0.181);
    for (const sg of [-1, 1]) K.put(rbox(u(6), u(7), 0.01, 0.004), K.glow('#bfe0f0'), x(32) + sg * u(28.1), y(25.5), 0, Math.PI / 2);
    for (let n = 0; n < 8; n++) for (const sz of [-1, 1]) K.put(rbox(u(1), u(8), 0.006, 0.002), K.plain(L.tone(K.pal.c, 0.75)), x(20.5 + n * 3), y(24), sz * 0.181);
    K.put(rbox(u(52), u(2), 0.32, 0.01), iron, x(32), y(33), 0);
    K.put(rbox(u(6), u(3), 0.08, 0.01), K.metal(CHROME), x(32), y(35.5), 0);
    for (const sg of [-1, 1]) K.put(L.ball(u(1.6), 12, 8), K.glow('#fff4c0'), x(32) + sg * u(28.2), y(12), 0);
  },

  bulletloco(K, s, W, D, L) {
    const r = display(K, L, W), y = (n) => r + u(n), x = (n) => X(n, W);
    for (const i of [12, 20, 44, 52]) for (const sz of [-1, 1]) wheel(K, L, K.gloss(K.pal.m), x(i), y(3), sz * 0.12, u(3));
    // the white body in side profile, its nose sloping down, extruded and rounded; a coloured stripe, dark windows
    const pts = [[x(2), y(6)], [x(62), y(6)]];
    for (let i = 60; i >= 0; i -= 2) pts.push([x(2 + i), y(28 - (i > 40 ? ((i - 40) / 20) ** 2 * 16 : 0))]);
    K.put(slab(L, pts, 0.34, 0.05), K.gloss('#f4f4f0'));
    const stripe = [[x(2), y(11)], [x(60), y(11)], [x(61.5), y(14)], [x(2), y(14)]];
    K.put(slab(L, stripe, 0.45, 0.01), K.gloss(K.pal.c));
    for (let i = 6; i < 40; i += 5) for (const sz of [-1, 1]) K.put(L.rbox(u(3), u(4), 0.01, 0.004), K.gloss('#3a4a6a'), x(3.5 + i), y(22), sz * 0.221);
    const shield = [[x(46), y(24.5)], [x(53), y(20)], [x(54), y(21.5)], [x(47.5), y(26)]];
    K.put(slab(L, shield, 0.4, 0.008), K.gloss('#3a4a6a'));
    K.put(L.rbox(u(58), u(2), 0.3, 0.008), K.gloss(K.pal.m), x(31), y(7), 0);
    K.put(L.ball(u(1.4), 12, 8), K.glow('#fff4c0'), x(62.8), y(8.5), 0);
  },

  tramloco(K, s, W, D, L) {
    const { rbox, THREE } = L, r = display(K, L, W), y = (n) => r + u(n), x = (n) => X(n, W);
    const iron = K.gloss(K.pal.m), body = K.gloss(K.pal.c);
    for (const bx of [16, 48]) {
      K.put(rbox(u(14), u(3), 0.28, 0.01), iron, x(bx), y(6.5), 0);
      for (const sz of [-1, 1]) for (const dx of [-4, 4]) wheel(K, L, iron, x(bx + dx), y(3), sz * 0.12, u(3));
    }
    // the car: the colour above, a pale skirt and an accent line, six windows each side, lit
    K.put(rbox(u(52), u(21), 0.38, 0.035), body, x(32), y(25.5), 0);
    K.put(rbox(u(52), u(9), 0.38, 0.03), K.gloss(K.pal.p), x(32), y(10.5), 0);
    K.put(rbox(u(52) + 0.006, u(1), 0.386, 0.003), K.gloss(K.pal.a), x(32), y(15.5), 0);
    for (let n = 0; n < 6; n++) for (const sz of [-1, 1]) K.put(rbox(u(6), u(11), 0.01, 0.004), K.glow('#bfe0f0'), x(12 + n * 8), y(26.5), sz * 0.191);
    for (const sg of [-1, 1]) K.put(rbox(u(9), u(11), 0.01, 0.004), K.glow('#bfe0f0'), x(32) + sg * u(26.1), y(26.5), 0, Math.PI / 2);
    // the roof, its destination sign, the pantograph up to its bar
    K.put(rbox(u(48), u(4), 0.34, 0.02), iron, x(32), y(38), 0);
    K.put(new THREE.PlaneGeometry(u(8), u(3)), L.litPic(destSign(), 0.6), x(32) + u(26.15), y(33.5), 0, Math.PI / 2);
    const top = y(50), base = y(40);
    for (const sz of [-0.08, 0.08]) { rod(K, L, K.gloss(INK), [x(28), base, sz], [x(34), top, sz * 0.5], 0.012); rod(K, L, K.gloss(INK), [x(40), base, sz], [x(34), top, sz * 0.5], 0.012); }
    K.put(rbox(u(16), 0.02, 0.06, 0.006), K.gloss(INK), x(34), top + 0.01, 0);
  },

  monorailloco(K, s, W, D, L) {
    const { rbox } = L, r = display(K, L, W), y = (n) => r + u(n), x = (n) => X(n, W);
    // the concrete beam along the track, then the car rounded over it
    K.put(rbox(u(60), u(8), 0.16, 0.02), K.gloss(STONE), x(32), y(1.5), 0);
    K.put(rbox(u(56), u(1), 0.162, 0.003), K.plain(L.tone(STONE, 0.8)), x(32), y(0), 0);
    K.put(rbox(u(56), u(22), 0.38, u(8)), K.gloss(K.pal.c), x(32), y(19), 0);
    K.put(rbox(u(48), u(6), 0.39, 0.02), K.gloss('#3a4a6a'), x(32), y(23), 0);
    for (let i = 14; i < 56; i += 8) K.put(rbox(u(1), u(6), 0.395, 0.002), K.gloss(K.pal.c), x(i), y(23), 0);
    K.put(rbox(u(52), u(2), 0.39, 0.006), K.gloss(K.pal.a), x(32), y(15), 0);
    K.put(rbox(u(44), u(3), 0.3, 0.01), K.gloss(K.pal.m), x(32), y(7), 0);
    for (const sg of [-1, 1]) K.put(L.ball(u(1.5), 12, 8), K.glow('#fff4c0'), x(32) + sg * u(28.2), y(16), 0);
  },

  minecartloco(K, s, W, D, L) {
    const { cyl, ball, rbox } = L, r = display(K, L, W), y = (n) => r + u(n), x = (n) => X(n, W);
    for (const i of [20, 42]) for (const sz of [-1, 1]) wheel(K, L, K.gloss(K.pal.m), x(i), y(3), sz * 0.12, u(3));
    K.put(rbox(u(30), u(3), 0.24, 0.01), K.gloss(L.tone(K.pal.m, 0.7)), x(31), y(6.5), 0);
    // the tub, wider at its mouth, a lip and its ribs
    const tub = cyl(1, 1, 1, 4, true);
    tub.rotateY(Math.PI / 4);
    tub.scale(1, 1, 1);
    const bin = L.lathe([[0.001, 0], [Math.SQRT2 * 0.5, 0], [Math.SQRT2 * 0.5 * 1.32, 1], [Math.SQRT2 * 0.5 * 1.25, 1.02], [Math.SQRT2 * 0.5 * 0.95, 0.06], [0.001, 0.06]], 4);
    bin.rotateY(Math.PI / 4);
    bin.scale(u(33), u(18), 0.3);
    K.put(bin, K.gloss(K.pal.m), x(31), y(6), 0);
    K.put(rbox(u(45), u(1.5), 0.42, 0.006), K.gloss(L.tone(K.pal.m, 1.2)), x(31), y(24), 0);
    for (const i of [14, 31, 47]) for (const sz of [-1, 1]) K.put(rbox(u(1.4), u(16), 0.01, 0.004), K.gloss(L.tone(K.pal.m, 0.75)), x(i), y(15), sz * (0.17 + (i === 31 ? 0.02 : 0)), 0, sz * 0.32);
    // a heap of ore, grey rock and a few gems
    const R = K.r, gems = ['#a858d8', '#58c8f0', '#f05878'];
    for (let n = 0; n < 22; n++) {
      const a = R() * Math.PI * 2, d = Math.sqrt(R()), px = Math.cos(a) * d * u(18), pz = Math.sin(a) * d * 0.17;
      const h = y(22) + (1 - d) * u(6) + R() * u(2), gem = n % 5 === 0;
      K.put(gem ? L.ball(u(2.4), 6, 4) : ball(u(2.6 + R()), 7, 5), gem ? K.glow(gems[n % 3]) : K.plain(n % 3 ? '#5a5050' : '#6a6262'), x(31) + px, h, pz);
    }
  },

  /* ----- Station ----- */

  ticketgate(K, s, W, D, L) {
    const { rbox, THREE } = L, cab = K.gloss(K.pal.m), col = K.gloss(K.pal.c);
    // two cabinets running front to back, their tops in the colour, the flaps between them
    for (const i of [5.5, 26.5]) {
      K.put(rbox(u(9), u(40), 0.86, 0.03), cab, X(i), u(20), 0);
      K.put(rbox(u(9) + 0.01, u(3), 0.87, 0.015), col, X(i), u(40.5), 0);
    }
    for (const i of [13, 19]) K.put(rbox(u(6), u(10), 0.03, 0.02), col, X(i), u(25), 0.02);
    for (const sg of [-1, 1]) K.put(rbox(u(12), 0.04, 0.03, 0.01), K.plain(INK), sg * u(6), u(30.5), 0.02);
    // the green arrow lit on the entry side, the ticket slot, the blue card reader on the other
    const arrow = once('gatearrow', () => sheet(64, 64, (g) => {
      g.fillStyle = '#1a2a20'; g.fillRect(0, 0, 64, 64);
      g.fillStyle = '#58e878'; g.beginPath(); g.moveTo(14, 20); g.lineTo(34, 20); g.lineTo(34, 10); g.lineTo(54, 32); g.lineTo(34, 54); g.lineTo(34, 44); g.lineTo(14, 44); g.fill();
    }));
    K.put(new THREE.PlaneGeometry(u(6), u(6)), L.litPic(arrow, 0.8), X(5.5), u(32), 0.431);
    K.put(rbox(u(5), u(1), 0.02, 0.004), K.plain(INK), X(5.5), u(37), 0.43);
    K.put(rbox(u(6), 0.02, u(4), 0.006), K.glow('#58b8f8'), X(26.5), u(42) + 0.012, 0.28);
    K.put(rbox(u(4), 0.02, u(3), 0.006), K.plain(INK), X(5.5), u(42) + 0.012, 0.26);
  },

  luggagecart(K, s, W, D, L) {
    const { rbox, cyl } = L, iron = K.metal(K.pal.m), col = K.gloss(K.pal.c);
    // the bed on four wheels, a handle rising at the right
    K.put(rbox(u(28), u(3), 0.62, 0.012), iron, X(16), u(6.5), 0);
    for (const i of [6, 26]) for (const sz of [-0.24, 0.24]) {
      K.put(cyl(u(3), 0.04, u(3), 18).rotateX(Math.PI / 2), K.gloss(INK), X(i), u(3), sz);
      K.put(cyl(u(1), 0.05, u(1), 10).rotateX(Math.PI / 2), K.metal(CHROME), X(i), u(3), sz);
    }
    for (const sz of [-0.22, 0.22]) rod(K, L, iron, [X(28), u(8), sz], [X(30), u(56), sz], 0.022);
    K.put(cyl(0.025, 0.5, 0.025, 12).rotateX(Math.PI / 2), K.gloss(INK), X(30), u(56.5), 0);
    // a crate in the colour, a brown suitcase on it, a pale hatbox on top
    K.put(rbox(u(22), u(18), 0.5, 0.02), col, X(14), u(17), 0);
    for (const i of [8, 18]) K.put(rbox(u(2), u(18) + 0.004, 0.504, 0.004), K.gloss(L.tone(K.pal.c, 0.8)), X(i + 1), u(17), 0);
    K.put(rbox(u(4), u(2), 0.04, 0.008), K.plain(INK), X(14), u(27), 0);
    K.put(rbox(u(16), u(14), 0.36, 0.025), K.gloss('#8a5a3a'), X(13), u(33), 0, 0.12);
    K.put(L.ball(u(2), 12, 8).scale(1, 1, 0.3), K.gloss(K.pal.a), X(15) + 0.02, u(33), 0.18);
    K.put(cyl(u(5), u(8), u(5), 24), K.gloss(K.pal.p), X(13), u(44), 0);
    K.put(cyl(u(5.4), u(1.5), u(5.4), 24), K.gloss(L.tone(K.pal.p, 0.85)), X(13), u(47.6), 0);
  },

  suitcases(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, brass = K.metal(BRASS);
    let y = 0;
    [[28, 16, K.pal.c, 0.62, 0.05], [24, 14, '#8a5a3a', 0.54, -0.1], [20, 12, K.pal.a, 0.46, 0.08], [16, 10, K.pal.p, 0.38, -0.05]].forEach(([w, h, c, d, turn], n) => {
      const cw = u(w), ch = u(h), cy = y + ch / 2, case_ = K.gloss(c), strap = K.gloss(L.tone(c, 0.72));
      K.put(rbox(cw, ch, d, 0.03), case_, 0, cy, 0, turn);
      for (const dx of [-cw / 2 + u(5), cw / 2 - u(5)]) K.put(rbox(u(2), ch + 0.006, d + 0.006, 0.006), strap, Math.cos(turn) * dx, cy, -Math.sin(turn) * dx, turn);
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) K.put(ball(0.018, 8, 6), brass, Math.cos(turn) * sx * (cw / 2 - 0.01) + Math.sin(turn) * (d / 2 - 0.01), cy + sy * (ch / 2 - 0.01), -Math.sin(turn) * sx * (cw / 2 - 0.01) + Math.cos(turn) * (d / 2 - 0.01));
      K.put(cyl(u(2.2), 0.008, u(2.2), 16).rotateX(Math.PI / 2), K.gloss(RAINBOW[(n * 2 + 1) % 7]), Math.cos(turn) * u(2) + Math.sin(turn) * (d / 2 + 0.004), cy, -Math.sin(turn) * u(2) + Math.cos(turn) * (d / 2 + 0.004), turn);
      y += ch;
    });
    // the top case's handle
    K.put(L.torus(u(2.5), 0.012, Math.PI, 16), K.gloss(INK), 0, y, 0, -0.05);
  },

  railsignal(K, s, W, D, L) {
    const { rbox, cyl, ball, THREE } = L, iron = K.metal(K.pal.m);
    // a stone footing, the post, a ladder up its right side
    K.put(rbox(u(10), u(6), u(10), 0.02), K.gloss(STONE), 0, u(3), 0);
    K.put(cyl(u(2), u(54), u(2.2), 16), iron, 0, u(33), 0);
    for (const i of [19, 22]) K.put(rbox(u(1), u(50), u(1), 0.004), iron, X(i + 0.5), u(31), 0.04);
    for (let j = 8; j < 56; j += 5) K.put(rbox(u(4), u(1), u(1), 0.003), iron, X(21), u(j), 0.04);
    // the black head, three lamps under their hoods: red lit, amber and green dark
    K.put(rbox(u(16), u(32), u(10), 0.03), K.gloss(INK), 0, u(74), 0);
    [['#e83838', true], ['#b89020', false], ['#2a9048', false]].forEach(([c, lit], n) => {
      const cy = u(84 - n * 10), f = u(5);
      K.put(cyl(u(3), 0.02, u(3), 20).rotateX(Math.PI / 2), lit ? K.glow(c) : K.gloss(c), 0, cy, f + 0.01);
      K.put(new THREE.CylinderGeometry(u(4.2), u(4.2), u(4), 20, 1, true, -Math.PI / 2, Math.PI).rotateX(Math.PI / 2), K.M('plain', INK, { key: 'hood' }), 0, cy, f + u(2));
    });
    K.put(ball(u(1.5), 10, 8), iron, 0, u(91), 0);
  },

  crossing(K, s, W, D, L) {
    const { rbox, cyl } = L;
    // the striped post on a footing
    K.put(cyl(u(4), u(3), u(4.5), 18), K.gloss(L.tone(STONE, 0.9)), 0, u(1.5), 0);
    for (let j = 0; j < 74; j += 10) {
      K.put(cyl(u(2), u(6), u(2), 14), K.gloss('#f4f4f0'), 0, u(j + 3), 0);
      K.put(cyl(u(2), u(4), u(2), 14), K.gloss(INK), 0, u(j + 8), 0);
    }
    // the crossbuck: two white boards edged red, crossing over the top
    const a = Math.atan2(16, 26), len = Math.hypot(26, 16) / 32;
    for (const sg of [-1, 1]) {
      K.put(rbox(len + 0.02, u(4.2), 0.02, 0.01), K.gloss('#e04848'), 0, u(81), 0.075 + (sg > 0 ? 0.03 : 0), 0, 0, sg * a);
      K.put(rbox(len - 0.02, u(2.6), 0.02, 0.008), K.gloss('#f4f4f0'), 0, u(81), 0.085 + (sg > 0 ? 0.03 : 0), 0, 0, sg * a);
    }
    // the cross arm, two red lamps in black cases with hoods
    K.put(rbox(u(24), u(3), 0.05, 0.01), K.gloss(INK), 0, u(60.5), 0.07);
    for (const i of [6, 26]) {
      K.put(cyl(u(4), 0.06, u(4), 20).rotateX(Math.PI / 2), K.gloss(INK), X(i), u(56), 0.1);
      K.put(cyl(u(3), 0.02, u(3), 20).rotateX(Math.PI / 2), K.glow('#ff4040'), X(i), u(56), 0.135);
      K.put(new L.THREE.CylinderGeometry(u(4.3), u(4.3), u(3), 20, 1, true, -Math.PI / 2, Math.PI).rotateX(Math.PI / 2), K.M('plain', INK, { key: 'hood' }), X(i), u(56), 0.16);
    }
  },

  watertower(K, s, W, D, L) {
    const { cyl, lathe, rbox } = L, iron = K.metal(K.pal.m);
    // four legs splaying out, braced, carrying the tank
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) rod(K, L, iron, [sx * u(12), 0, sz * u(12)], [sx * u(8), u(44), sz * u(8)], 0.025);
    for (const [ya, yb] of [[u(18), u(34)], [u(34), u(18)]]) for (const sg of [-1, 1]) {
      rod(K, L, iron, [-u(10.5), ya, sg * u(10.5)], [u(10.5), yb, sg * u(10.5)], 0.012);
      rod(K, L, iron, [sg * u(10.5), ya, -u(10.5)], [sg * u(10.5), yb, u(10.5)], 0.012);
    }
    // the wooden tank, its hoops, a conical roof in the colour, the spout
    K.put(rbox(u(24), 0.04, u(24), 0.01), K.wood(L.tone(K.pal.w, 0.8)), 0, u(44), 0);
    K.put(cyl(u(12), u(30), u(12), 28), K.wood(), 0, u(59), 0);
    for (const j of [52, 66]) K.put(cyl(u(12.3), 0.03, u(12.3), 28), K.gloss(INK), 0, u(j), 0);
    K.put(lathe([[u(14), 0], [u(13), 0.02], [0.001, u(14)]], 28), K.gloss(K.pal.c), 0, u(74), 0);
    rod(K, L, iron, [u(10), u(56), u(6)], [u(15), u(40), u(9)], 0.025);
  },

  stationlamp(K, s, W, D, L) {
    const { cyl, lathe, ball, rbox } = L, iron = K.metal(K.pal.m);
    // the base, the fluted post with two collars
    K.put(lathe([[u(6), 0], [u(6), u(3)], [u(4.5), u(5)], [u(3), u(8)], [0.001, u(8)]], 20), iron, 0, 0, 0);
    K.put(cyl(u(2), u(62), u(2.2), 16), iron, 0, u(39), 0);
    for (const j of [30, 66]) K.put(cyl(u(4), u(2), u(4), 16), K.metal(L.tone(K.pal.m, 1.3)), 0, u(j + 1), 0);
    // the lantern: a lit bulging glass between iron bands, its roof and finial
    const glass = [];
    for (let j = 0; j <= 12; j++) glass.push([u(5 + Math.sin(j / 12 * Math.PI) * 2), u(j * 15 / 12)]);
    K.put(lathe(glass, 24), K.glow('#fff0b0'), 0, u(70), 0);
    for (const j of [70, 75, 80, 85]) K.put(cyl(u(5 + Math.sin((j - 70) / 15 * Math.PI) * 2) + 0.008, 0.02, u(5 + Math.sin((j - 70) / 15 * Math.PI) * 2) + 0.008, 24), iron, 0, u(j), 0);
    for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + Math.PI / 4; K.put(rbox(0.015, u(15), 0.015, 0.004), iron, Math.cos(a) * u(6.6), u(77.5), Math.sin(a) * u(6.6)); }
    K.put(lathe([[u(7), 0], [u(6.5), 0.015], [0.001, u(6)]], 24), iron, 0, u(85), 0);
    K.put(ball(u(1.5), 10, 8), iron, 0, u(92), 0);
  },

  bufferstop(K, s, W, D, L) {
    const { rbox, cyl, THREE } = L, iron = K.gloss(K.pal.m);
    // the track running into it from the front
    for (let z = -0.42; z < 0.45; z += 0.13) K.put(rbox(0.86, 0.03, 0.07, 0.008), K.wood('#6a4a30'), 0, 0.015, z);
    for (const sx of [-1, 1]) K.put(rbox(0.025, 0.03, 0.94, 0.006), K.metal(CHROME), sx * 0.22, 0.045, 0);
    // the iron frame, braced back to the floor, the striped beam, two chrome buffers and a red lamp on top
    K.put(rbox(u(26), u(21), 0.18, 0.02), iron, 0, u(13.5), -0.12);
    for (const sx of [-1, 1]) rod(K, L, K.gloss(L.tone(K.pal.m, 0.8)), [sx * 0.22, u(22), -0.05], [sx * 0.22, 0.03, -0.42], 0.03);
    K.put(rbox(u(30), u(12), 0.2, 0.02), K.gloss('#e04040'), 0, u(30), -0.1);
    K.put(new THREE.PlaneGeometry(u(30) - 0.02, u(12) - 0.02), K.pic(bufferBeam()), 0, u(30), 0.002);
    for (const i of [7, 25]) {
      K.put(cyl(u(1.5), 0.16, u(1.5), 14).rotateX(Math.PI / 2), K.metal(CHROME), X(i), u(30), 0.08);
      K.put(cyl(u(4), 0.04, u(4), 22).rotateX(Math.PI / 2), K.metal(CHROME), X(i), u(30), 0.17);
    }
    K.put(rbox(u(5), u(3), 0.06, 0.01), iron, 0, u(37.5), -0.1);
    K.put(L.ball(u(2.5), 16, 12), K.glow('#e83838'), 0, u(41), -0.1);
  },

  coalcart(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, iron = K.gloss(K.pal.m);
    trackX(K, L, 1, 0.03, 0.17);
    // the wheels, the wagon's sides with their ribs, a heap of coal and a shovel stuck in it
    for (const i of [8, 24]) for (const sz of [-1, 1]) wheel(K, L, iron, X(i), u(6), sz * 0.2, u(4));
    K.put(rbox(u(28), u(16), 0.42, 0.02), iron, 0, u(18), 0);
    K.put(rbox(u(28) + 0.006, u(1), 0.426, 0.003), K.gloss(L.tone(K.pal.m, 0.75)), 0, u(18), 0);
    for (const sx of [-1, 1]) K.put(rbox(u(2), u(16) + 0.006, 0.43, 0.004), K.gloss(L.tone(K.pal.m, 0.7)), sx * u(12), u(18), 0);
    const R = K.r;
    for (let n = 0; n < 26; n++) {
      const a = R() * Math.PI * 2, d = Math.sqrt(R()), h = u(26) + (1 - d * d) * u(6);
      K.put(ball(u(2.6), 6, 4).rotateY(a), K.plain(n % 4 ? '#2a2a30' : '#4a4a58'), Math.cos(a) * d * u(11), h, Math.sin(a) * d * 0.16);
    }
    rod(K, L, K.wood(), [X(22), u(26), 0], [X(29), u(46), 0.04], 0.018);
    K.put(rbox(u(4), u(2), 0.06, 0.008), K.wood(), X(29.5), u(47), 0.045);
  },

  handcar(K, s, W, D, L) {
    const { rbox, cyl } = L, iron = K.gloss(K.pal.m);
    trackX(K, L, W, 0.03, 0.24);
    // four spoked wheels, the wooden deck, an A-frame either side up to the pivot
    for (const i of [12, 52]) for (const sz of [-1, 1]) {
      wheel(K, L, iron, X(i, W), u(7), sz * 0.24, u(6));
      for (const a of [0, Math.PI / 2]) K.put(rbox(u(9), 0.018, 0.01, 0.004), K.gloss(L.tone(K.pal.m, 0.7)), X(i, W), u(7), sz * 0.262, 0, 0, a);
    }
    K.put(rbox(W - u(4), u(5), 0.62, 0.015), K.wood(), 0, u(13.5), 0);
    K.put(rbox(W - u(4), u(2), 0.58, 0.01), K.wood(L.tone(K.pal.w, 0.75)), 0, u(10), 0);
    for (const sz of [-0.12, 0.12]) for (const sx of [-1, 1]) rod(K, L, iron, [sx * u(8), u(16), sz], [0, u(40), sz * 0.5], 0.022);
    K.put(cyl(u(2.5), 0.2, u(2.5), 16).rotateX(Math.PI / 2), K.metal(BRASS), 0, u(40), 0);
    // the pump lever, tipped, a wooden grip across each end
    const tilt = Math.atan2(12, 48), half = Math.hypot(48, 12) / 2 / 32 + 0.02;
    K.put(rbox(half * 2, u(3), 0.05, 0.012), K.gloss(K.pal.c), 0, u(40), 0, 0, 0, -tilt);
    for (const sg of [-1, 1]) K.put(cyl(0.025, 0.42, 0.025, 12).rotateX(Math.PI / 2), K.wood(), sg * Math.cos(tilt) * half, u(40) - sg * Math.sin(tilt) * half, 0);
  },

  /* ----- Sky Palace ----- */

  skyorb(K, s, W, D, L) {
    const { torus, ball, cyl, lathe } = L, id = K.p.fam.replace('orb', ''), [col] = ORB_ART[id], gold = K.metal(GOLD);
    // a cloud, a gold stem rising out of it to a cup holding the orb; a halo ringing the orb, tilted, held by the cup's
    // three prongs; sparkles round it
    const oy = u(40), or = u(10);
    cloud(K, L, 0, 0, 0, u(14), u(9), 0.36);
    K.put(lathe([[u(4), 0], [u(2.4), u(3)], [u(1.3), u(6)], [u(1.3), u(10)], [u(2), u(12)], [u(1.3), u(13)], [0.001, u(13)]], 20), gold, 0, u(14), 0);
    K.put(lathe([[u(1.3), 0], [u(4), u(1.5)], [u(6.4), u(4)], [u(6.9), u(4.8)], [u(6.4), u(4.8)], [u(3.5), u(2.4)], [0.001, u(2)]], 28), gold, 0, oy - u(12.3), 0);
    K.put(ball(or, 40, 28), L.litPic(orbPic(id), 0.3), 0, oy, 0);
    const tilt = 0.42, hr = or + u(3.2);
    K.put(torus(hr, 0.018, TAU, 48), gold, 0, oy, 0, 0, Math.PI / 2 - tilt, 0.15);
    K.put(torus(hr, 0.007, TAU, 48), K.glow(L.tone(col, 1.4)), 0, oy, 0, 0, Math.PI / 2 - tilt, 0.15);
    for (let n = 0; n < 3; n++) {
      const a = n / 3 * TAU + 0.5, x = Math.cos(a), z = Math.sin(a);
      const pts = [[x * u(6.6), oy - u(7.6), z * u(6.6)], [x * (or + u(1.2)), oy - or * 0.3, z * (or + u(1.2))], [x * (or + u(1)), oy + or * 0.15, z * (or + u(1))]];
      K.put(tube(L, pts, 0.01, 16), gold);
      K.put(ball(0.016, 10, 8), gold, ...pts[2]);
    }
    for (let n = 0; n < 5; n++) { const a = n / 5 * TAU + 0.3; K.put(ball(0.014 + (n % 2) * 0.006, 8, 6), K.glow('#ffffff'), Math.cos(a) * (hr + u(2)), oy + Math.sin(n * 2.1) * u(6), Math.sin(a) * (hr + u(2))); }
    if (id === 'sun') for (let n = 0; n < 12; n++) {
      const a = n / 12 * TAU;
      K.put(cyl(0.001, u(4), u(1.6), 10), K.glow(GOLD), Math.cos(a) * u(13.2), oy + Math.sin(a) * u(13.2), 0, 0, 0, a - Math.PI / 2);
    }
    if (id === 'moon') K.put(ball(u(10.4), 40, 28), K.M('glass', col, { key: 'moonhalo' }), 0, oy, 0);
  },

  rainbowarch(K, s, W, D, L) {
    const { THREE } = L;
    // seven bands of the rainbow, each a half ellipse standing on its feet, a cloud round each foot
    RAINBOW.forEach((c, n) => {
      const rx = u(24 - n * 3), ry = u(56 - n * 3), t = u(3), sh = new THREE.Shape();
      sh.absellipse(0, 0, rx, ry, 0, Math.PI, false);
      sh.absellipse(0, 0, rx - t, ry - t, Math.PI, 0, true);
      const g = new THREE.ExtrudeGeometry(sh, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.008, bevelSegments: 2, curveSegments: 48 });
      g.translate(0, u(10), -0.07);
      K.put(g, K.gloss(c));
    });
    for (const sg of [-1, 1]) cloud(K, L, sg * (W / 2 - u(11)), 0, 0, u(11), u(9), 0.26);
  },

  skyfountain(K, s, W, D, L) {
    const { cyl, lathe, ball, THREE } = L, marble = K.gloss(MARBLE), gold = K.metal(GOLD), water = K.M('glass', WATER, { key: 'water' });
    water.opacity = 0.6;
    cloud(K, L, 0, 0, 0, u(15), u(8), 0.4);
    // the basin on the cloud, a gold band round it, its water; the column up to a small bowl, a gold finial
    K.put(lathe([[u(9), 0], [u(10), u(2)], [u(13), u(7)], [u(13), u(8)], [u(11.5), u(8)], [u(9), u(4)], [0.001, u(4)]], 36), marble, 0, u(14), 0);
    K.put(cyl(u(12.1), 0.025, u(11.8), 36), gold, 0, u(18), 0);
    K.put(cyl(u(11.6), 0.01, u(11.6), 36), K.gloss(WATER), 0, u(21), 0);
    K.put(cyl(u(2), u(24), u(2.4), 16), marble, 0, u(30), 0);
    K.put(lathe([[u(2), 0], [u(6), u(3)], [u(7), u(4)], [u(6), u(4)], [0.001, u(2)]], 28), marble, 0, u(43), 0);
    K.put(cyl(u(5.5), 0.008, u(5.5), 24), K.gloss(WATER), 0, u(46.6), 0);
    K.put(ball(u(2), 14, 10), gold, 0, u(49), 0);
    K.put(cyl(u(0.8), u(3), u(0.8), 8), gold, 0, u(47), 0);
    // six streams arcing from the bowl down into the basin
    for (let n = 0; n < 6; n++) {
      const a = n / 6 * Math.PI * 2 + 0.3, pts = [];
      for (let i = 0; i <= 8; i++) { const t = i / 8, r = u(6) + t * u(5.5), yy = u(47) + Math.sin(t * Math.PI * 0.6) * u(4) - t * t * u(26); pts.push([Math.cos(a) * r, yy, Math.sin(a) * r]); }
      K.put(tube(L, pts, 0.016, 16), water);
    }
    void THREE;
  },

  featherlamp(K, s, W, D, L) {
    const { cyl, lathe } = L;
    cloud(K, L, 0, 0, 0, u(10), u(5), 0.24);
    K.put(cyl(u(1), u(52), u(1), 10), K.metal(GOLD), 0, u(32), 0);
    // the feather: a lit vane swaying as it rises, flattened, its quill down the middle
    const pts = [];
    for (let j = 0; j <= 20; j++) { const t = j / 20; pts.push([Math.max(0.002, Math.sin(t * Math.PI) * u(9) * (1 - t * 0.25)), t * u(34)]); }
    const vane = lathe(pts, 24);
    vane.scale(1, 1, 0.32);
    const pos = vane.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setX(i, pos.getX(i) + Math.sin(pos.getY(i) / u(34) * 2) * u(4));
    vane.computeVertexNormals();
    K.put(vane, K.glow('#fff4d8'), 0, u(58), 0);
    const quill = [];
    for (let j = 0; j <= 10; j++) { const t = j / 10; quill.push([Math.sin(t * 2) * u(4) + 0.004, u(58) + t * u(34), 0.05]); }
    K.put(tube(L, quill, 0.008, 20), K.gloss(L.tone('#fff4d8', 0.7)));
  },

  floatisland(K, s, W, D, L) {
    const { cyl, lathe, ball, rbox } = L;
    cloud(K, L, 0, 0, 0, u(12), u(6), 0.3);
    // the island: an earth cone tipped up, grass on top, floating clear of the cloud
    const earth = [];
    for (let j = 18; j >= 0; j -= 2) earth.push([u(Math.max(0.5, 14 - j * 0.7)), u(18 - j)]);
    earth.push([0.001, u(18)]);
    K.put(lathe(earth, 28), K.plain('#9a7a5a'), 0, u(28), 0);
    for (const j of [6, 12]) K.put(cyl(u(14 - (18 - j) * 0.7) + 0.006, 0.02, u(14 - (18 - j) * 0.7) + 0.006, 28), K.plain('#7a5a3a'), 0, u(28 + j), 0);
    K.put(cyl(u(14.4), u(2.5), u(14), 28), K.gloss(K.pal.leaf), 0, u(46), 0);
    // a tree, a little temple, a waterfall pouring off the edge
    K.put(cyl(u(1.5), u(14), u(1.8), 12), K.wood(), X(11.5), u(53), -0.08);
    for (const [dx, dy, r] of [[0, 0, 6], [-3, -2, 4.5], [3, -1, 4.5], [0, 3, 4]]) K.put(ball(u(r), 16, 12), K.gloss(L.tone(K.pal.leaf, 1 + dy * 0.03)), X(11) + u(dx), u(64 + dy), -0.08);
    K.put(rbox(u(7), u(6), u(7), 0.01), K.gloss(MARBLE), X(21.5), u(50), 0.06);
    K.put(cyl(0.001, u(5), u(5.5), 4).rotateY(Math.PI / 4), K.gloss(K.pal.c), X(21.5), u(55.5), 0.06);
    const fall = K.M('glass', WATER, { key: 'fall' }); fall.opacity = 0.7;
    K.put(rbox(u(2), u(20), 0.02, 0.005), fall, X(25), u(37), u(9.5));
    K.put(cyl(u(1.2), u(18), u(0.6), 8), fall, X(25), u(37), u(10.5));
  },

  cloudcolumn(K, s, W, D, L) {
    const { cyl, ball, rbox } = L, marble = K.gloss(MARBLE), gold = K.metal(GOLD);
    cloud(K, L, 0, 0, 0, u(14), u(8), 0.36);
    // the fluted shaft, its gold capital with two scrolls, a vine winding round it
    K.put(cyl(u(7), u(66), u(7), 32), marble, 0, u(45), 0);
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; K.put(rbox(0.012, u(62), 0.012, 0.004), K.plain(L.tone(MARBLE, 0.82)), Math.cos(a) * u(7), u(45), Math.sin(a) * u(7)); }
    K.put(cyl(u(8.5), u(3), u(8.5), 32), marble, 0, u(13.5), 0);
    K.put(rbox(u(22), u(6), u(16), 0.02), gold, 0, u(81), 0);
    for (const sg of [-1, 1]) K.put(L.torus(u(2.5), u(1), Math.PI * 2, 20), gold, sg * u(10), u(80), 0, Math.PI / 2);
    const vine = [];
    for (let j = 0; j <= 56; j += 2) { const a = j / 5; vine.push([Math.sin(a) * u(7.6), u(20 + j), Math.cos(a) * u(7.6)]); }
    K.put(tube(L, vine, 0.01, 80), K.gloss(K.pal.leaf));
    for (let j = 0; j <= 56; j += 7) { const a = j / 5; K.put(ball(1, 10, 6).scale(0.04, 0.02, 0.06).rotateY(a), K.gloss(L.tone(K.pal.leaf, 1.15)), Math.sin(a) * u(8.4), u(20 + j), Math.cos(a) * u(8.4)); }
  },

  airshipmodel(K, s, W, D, L) {
    const { rbox, cyl, ball } = L;
    // the stand: a wooden base, a brass rod
    K.put(rbox(u(14), u(6), u(14), 0.02), K.wood(), 0, u(3), 0);
    K.put(cyl(u(1), u(38), u(1), 10), K.metal(BRASS), 0, u(25), 0);
    // the envelope with its seams, four fins at its tail, the gondola with lit windows, a propeller
    K.put(ball(1, 36, 24).scale(u(15), u(9), u(9)), K.gloss(K.pal.c), 0, u(60), 0);
    for (const i of [-8, -2, 4, 10]) { const t = i / 15, r = Math.sqrt(1 - t * t); K.put(L.torus(u(9) * r + 0.003, 0.005, Math.PI * 2, 32), K.plain(L.tone(K.pal.c, 0.8)), u(i), u(60), 0, Math.PI / 2); }
    for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) K.put(rbox(u(6), u(6), 0.015, 0.005).translate(0, u(6), 0), K.gloss(K.pal.a), X(3), u(60), 0, 0, a);
    K.put(rbox(u(10), u(5), u(6), 0.015), K.wood(), 0, u(46.5), 0);
    for (const i of [-3, 0, 3]) K.put(rbox(u(1.5), u(1.5), 0.01, 0.003), K.glow('#fff4c0'), u(i), u(47), u(3) + 0.002);
    K.put(cyl(u(0.6), u(2), u(0.6), 8).rotateZ(Math.PI / 2), K.metal(CHROME), u(6), u(46.5), 0);
    K.put(rbox(0.01, u(6), 0.03, 0.004), K.metal(CHROME), u(7), u(46.5), 0);
  },

  balloonmodel(K, s, W, D, L) {
    const { rbox, lathe, cyl } = L, wicker = K.wood('#a87a48');
    // the wicker basket on the floor, its rim, four ropes up to the burner ring
    K.put(rbox(u(12), u(12), u(12), 0.015), wicker, 0, u(6), 0);
    for (let j = 3; j < 12; j += 3) K.put(rbox(u(12) + 0.004, 0.01, u(12) + 0.004, 0.003), K.wood(L.tone('#a87a48', 0.8)), 0, u(j), 0);
    K.put(rbox(u(14), u(2), u(14), 0.01), K.wood(L.tone('#a87a48', 0.85)), 0, u(12), 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) rod(K, L, K.gloss(INK), [sx * u(5), u(12), sz * u(5)], [sx * u(5), u(36), sz * u(5)], 0.006);
    K.put(cyl(u(6), u(2), u(6), 20), K.gloss(K.pal.a), 0, u(36), 0);
    // the envelope in gores, round above and tapering to its mouth
    const pts = [];
    for (let j = 50; j >= 0; j -= 2) { const hw = j < 26 ? Math.sqrt(1 - ((26 - j) / 26) ** 2) * 14 : 14 - (j - 26) * 0.4; pts.push([u(Math.max(0.3, hw)), u(50 - j)]); }
    K.put(lathe(pts, 40), K.pic(gores(K.pal.c, K.pal.p)), 0, u(36), 0);
  },

  skybell(K, s, W, D, L) {
    const { cyl, lathe, ball, rbox } = L, marble = K.gloss(MARBLE), gold = K.metal(GOLD);
    cloud(K, L, 0, 0, 0, u(14), u(7), 0.34);
    // two marble pillars, an arch over them, a gold finial
    for (const i of [5, 27]) { K.put(cyl(u(2.2), u(62), u(2.2), 16), marble, X(i), u(39), 0); K.put(rbox(u(6), u(2), u(6), 0.01), marble, X(i), u(9), 0); }
    K.put(L.torus(u(11), u(2.2), Math.PI, 28), marble, 0, u(70), 0);
    K.put(cyl(u(1.2), u(4), u(1.6), 10), gold, 0, u(83), 0);
    K.put(ball(u(1.8), 12, 8), gold, 0, u(86), 0);
    // the cord and the gold bell, its lip and clapper
    K.put(cyl(u(0.6), u(14), u(0.6), 8), K.gloss(K.pal.c), 0, u(73), 0);
    const bell = [[0.001, u(18)], [u(3.5), u(18)], [u(4.6), u(16.5)], [u(5.2), u(11)], [u(6), u(6)], [u(7.4), u(2.6)], [u(8.4), u(0.9)], [u(8.4), 0], [u(7.4), 0], [u(6.4), u(1.6)], [0.001, u(1.6)]];
    K.put(lathe(bell, 32), gold, 0, u(48), 0);
    K.put(ball(u(2), 12, 8), K.metal(L.tone(GOLD, 0.7)), 0, u(46), 0);
  },

  wingstatue(K, s, W, D, L) {
    const { rbox, ball, blob, cyl } = L, marble = K.gloss(MARBLE), gold = K.metal(GOLD);
    // the plinth, a gold band and a wider foot
    K.put(rbox(u(22), u(4), u(16), 0.02), K.gloss(L.tone(MARBLE, 0.9)), 0, u(2), 0);
    K.put(rbox(u(18), u(20), u(13), 0.02), marble, 0, u(14), 0);
    K.put(rbox(u(22), u(3), u(16), 0.015), gold, 0, u(24.5), 0);
    // the robed figure, its head and gold crest
    K.put(blob(u(12), u(18), u(10), 0.6, 0.55), marble, 0, u(35), 0);
    K.put(cyl(u(3), u(6), u(6.5), 20), marble, 0, u(29), 0);
    K.put(ball(u(4), 18, 14), marble, 0, u(49), 0);
    K.put(cyl(0.001, u(3), u(1.5), 10).rotateX(Math.PI / 2), gold, 0, u(48.5), u(4.5));
    K.put(rbox(u(1.2), u(3), u(5), 0.006), gold, 0, u(53.5), -u(0.5));
    // two wings of feathers fanning up and out behind
    for (const sg of [-1, 1]) for (let f = 0; f < 5; f++) {
      const a = sg * (0.25 + f * 0.24), len = u(22 - f * 2.4);
      const feather = blob(u(3.2), len, 0.03, 0.8, 0.5);
      feather.translate(0, len / 2, 0); feather.rotateZ(-a);
      K.put(feather, f % 2 ? marble : K.gloss(L.tone(MARBLE, 1.04)), sg * u(3), u(40), -u(3) - f * 0.006);
    }
  },

  cloudstair(K, s, W, D, L) {
    const { torus, ball } = L;
    // six cloud steps spiralling up, a gold ring under each, sparkles round them
    for (let n = 0; n < 6; n++) {
      const a = n * 1.1, px = Math.cos(a) * u(7), pz = Math.sin(a) * u(7), py = u(n * 14);
      cloud(K, L, px, py, pz, u(10), u(6), u(8));
      K.put(torus(u(7), 0.008, Math.PI * 2, 24), K.metal(GOLD), px, py + u(0.5), pz, 0, Math.PI / 2);
    }
    for (const [i, j, z] of [[6, 84, 0.1], [26, 70, -0.1], [24, 90, 0.05]]) K.put(ball(0.022, 8, 6), K.glow('#fff4a0'), X(i), u(j), z);
  },
};
