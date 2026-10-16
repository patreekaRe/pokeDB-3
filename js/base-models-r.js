/* base-models-r.js  -  the New Year, Valentine's and Egg Day sets (js/base-furniture-season1.js), 39 kinds built from
   parts (the user's ask, 2026-10-16: "3D detailed CLEAN models ... optimise them", for a catalogue as big as Animal
   Crossing's). js/base-models-f.js's head says how a batch works. Each builder follows its painting part by part: `u(n)`
   is n of its 32 pixels a tile, `X(n, W)` a pixel across the painting as x from the middle, `WY(j)` a wall piece's
   painted unit j down as a height. Hearts and eggs are the paintings' own curves (`heartR`, `eggProfile`), so paint and
   model agree. Pictures are the painting itself laid on a part by where the part stands (`frontPut`: a sign's boards,
   the banner's cloth), the rugs' tops (`L.topUV`), and two small cached sheets wrapped round a lathe (the giant egg's
   bands, Togepi's shell). All solo: each kind's own fixed colours. */

import { tube, rod } from './base-models-kit.js';
import { NY, VAL, EGG, BELL, EGG_BANDS, EGG_TREE, BUN_EGGS, EGG_CUPS } from './base-furniture-season1.js';

const u = (n) => n / 32;
const X = (n, W = 1) => n / 32 - W / 2;
const WY = (j) => (96 - j) / 32;
const TAU = Math.PI * 2;

const sheet = (w, h, draw) => { const c = new OffscreenCanvas(w, h); draw(c.getContext('2d'), w, h); return c; };
const pics = {};
const once = (key, make) => pics[key] || (pics[key] = make());

/* ---------- shared parts ---------- */

/** The paintings' egg: [r, y] from its foot up, r round and h tall, rounder at the bottom. */
const eggProfile = (r, h, n = 9) => Array.from({ length: n }, (_, i) => {
  const t = i / (n - 1) * Math.PI;
  return [r * Math.sin(t) * (1 + 0.12 * Math.cos(t)), h / 2 * (1 - Math.cos(t))];
});
/** An egg standing at x, y, z, leant `tilt` sideways. */
const eggR = (K, L, m, x, y, z, r, h, seg = 12, n = 9, tilt = 0) => K.put(L.lathe(eggProfile(r, h, n), seg), m, x, y, z, 0, 0, tilt);
/** The egg's outline in painted units, as the painting's eggPts(). */
const eggOutline = (cx, foot, r, h, n = 24) => {
  const right = [], left = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n * Math.PI, w = r * Math.sin(t) * (1 + 0.12 * Math.cos(t)), y = foot - h / 2 * (1 - Math.cos(t));
    right.push([cx + w, y]); left.unshift([cx - w, y]);
  }
  return right.concat(left.slice(1, -1));
};

const BEZ = [[[0, -0.9], [-0.2, -0.6], [-1, -0.2], [-1, 0.25]], [[-1, 0.25], [-1, 0.75], [-0.35, 0.95], [0, 0.55]],
  [[0, 0.55], [0.35, 0.95], [1, 0.75], [1, 0.25]], [[1, 0.25], [1, -0.2], [0.2, -0.6], [0, -0.9]]];
/** js/base-mesh.js's heart, k from its middle to a side, as a shape. */
function heartShapeR(L, k) {
  const sh = new L.THREE.Shape(), p = (q) => [q[0] * k, q[1] * k];
  sh.moveTo(...p(BEZ[0][0]));
  for (const [, a, b, c] of BEZ) sh.bezierCurveTo(...p(a), ...p(b), ...p(c));
  return sh;
}
/** A plump heart s across and t thick, upright in x-y, centred on z 0: few curve steps, as it's small. */
function heartR(L, s, t, curve = 6) {
  const bev = Math.min(t * 0.4, s * 0.08);
  const g = new L.THREE.ExtrudeGeometry(heartShapeR(L, s / 2 - bev), { depth: Math.max(0.002, t - bev * 2), bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 2, curveSegments: curve });
  return g.translate(0, 0, -(t / 2 - bev));
}
/** n points round a heart, k from its middle to a side, y up. */
function heartLoop(k, n) {
  return Array.from({ length: n }, (_, i) => {
    const f = i / n * 4, [a, b, c, d] = BEZ[Math.floor(f)], t = f % 1, m = 1 - t;
    const at = (j) => m * m * m * a[j] + 3 * m * m * t * b[j] + 3 * m * t * t * c[j] + t * t * t * d[j];
    return [at(0) * k, at(1) * k];
  });
}
/** A closed tube round a heart's points ([x, y, z] each). */
const heartTube = (L, pts, r, seg = 48) => new L.THREE.TubeGeometry(new L.THREE.CatmullRomCurve3(pts.map(p => new L.THREE.Vector3(...p)), true), seg, r, 6, true);
/** A five-point star ro across its points, t thick, upright in x-y. */
function starR(L, ro, ri, t) {
  const sh = new L.THREE.Shape();
  for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? ri : ro; i ? sh.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  const bev = Math.min(t * 0.3, ri * 0.3);
  return new L.THREE.ExtrudeGeometry(sh, { depth: Math.max(0.002, t - bev * 2), bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 1 }).translate(0, 0, -t / 2 + bev);
}
/** A flat shape (x, y points) cut out `t` thick, its back at z 0. */
const plate = (L, pts, t) => new L.THREE.ExtrudeGeometry(new L.THREE.Shape(pts.map(([a, b]) => new L.THREE.Vector2(a, b))), { depth: t, bevelEnabled: false, curveSegments: 10 });
/** Puts a part wearing the front painting where it stands: its uvs read off its x and height (a sign's board). */
function frontPut(K, L, g, x = 0, y = 0, z = 0) {
  const art = K.p.art(0, L.HD, true), W = K.p.w, H = art.height / L.HD / 32, pos = g.attributes.position, uv = g.attributes.uv;
  g.translate(x, y, z);
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + W / 2) / W, pos.getY(i) / H);
  K.put(g, K.pic(art));
}
/** A flat piece's slab: a shape lying on the floor, the painting over its top. */
function rugPut(K, L, W, D, g) {
  g.rotateX(-Math.PI / 2);
  K.put(g, K.pic(K.p.art(0, L.HD)));
  L.topUV(g, W, D);
}
/** A plane's uvs moved onto painted box [x0, y0, x1, y1] (units from the painting's top left). */
function boxUV(g, [x0, y0, x1, y1], art, hd) {
  const W = art.width / hd, H = art.height / hd, uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (x0 + uv.getX(i) * (x1 - x0)) / W, 1 - (y1 - uv.getY(i) * (y1 - y0)) / H);
  return g;
}
/** A cone from its point at the origin to a wide end `len` up, leant `a` sideways and `lean` forward. */
function cone(L, rWide, len, a, lean, rTip = 0.012) {
  return L.cyl(rWide, len, rTip, 12).translate(0, len / 2, 0).rotateX(lean).rotateZ(-a);
}

/* ---------- pictures ---------- */

/* the giant egg's bands, wrapped round it: zigzags between, white dots on the sky band */
const eggBands = () => once('bands', () => sheet(256, 128, (g, w, h) => {
  g.fillStyle = EGG_BANDS[0][1]; g.fillRect(0, 0, w, h);
  for (const [f, c] of EGG_BANDS.slice(1)) {
    const y = h * (1 - f);
    g.fillStyle = c; g.beginPath(); g.moveTo(0, 0);
    for (let x = 0, i = 0; x <= w; x += 8, i++) g.lineTo(x, y + (i % 2 ? -3 : 3));
    g.lineTo(w, 0); g.closePath(); g.fill();
  }
  g.fillStyle = '#ffffff';
  for (let x = 8; x < w; x += 16) { g.beginPath(); g.arc(x, h * 0.4, 2.6, 0, TAU); g.fill(); }
}));
/* Togepi's shell: the lamp's lit white, red and blue triangles round it (u 0 its front) */
const togeShell = () => once('toge', () => sheet(256, 64, (g, w, h) => {
  g.fillStyle = EGG.glow; g.fillRect(0, 0, w, h);
  [0.07, 0.2, 0.33, 0.46, 0.57, 0.69, 0.8, 0.93].forEach((f, i) => {
    g.fillStyle = i % 2 ? EGG.red : EGG.blue;
    for (const dx of [0, -w, w]) { g.beginPath(); g.moveTo(f * w + dx - 13, h * 0.77); g.lineTo(f * w + dx + 13, h * 0.77); g.lineTo(f * w + dx, h * 0.45); g.closePath(); g.fill(); }
  });
}));

export const SHAPES = {
  nyclock: { make: 'nyclock', play: { does: 'chime' } },
  nychampagne: { make: 'nychampagne', play: { does: 'bubbles' } },
  nypopper: { make: 'nypopper', play: { does: 'boing' } },
  nywishlantern: { make: 'nywishlantern', play: { does: 'light' } },
  balldaruma: { make: 'balldaruma', play: { does: 'wobble' } },
  mochipound: { make: 'mochipound', play: { does: 'beat', hits: ['fx-drum'] } },
  luckybags: { make: 'luckybags', play: { does: 'treasure' } },
  nybell: { make: 'nybell', play: { does: 'beat', hits: ['fx-gong'], swing: true } },
  nybanner: { make: 'nybanner' },
  confettigarland: { make: 'confettigarland' },
  tophattable: { make: 'tophattable', play: { does: 'beat', hits: ['fx-squeak'] } },
  sparklervase: { make: 'sparklervase', play: { does: 'light', flicker: true } },
  kagamimochi: { make: 'kagamimochi' },
  heartarch: { make: 'heartarch' },
  chocfountain: { make: 'chocfountain', play: { does: 'water', fountain: true } },
  rosevase: { make: 'rosevase' },
  heartballoons: { make: 'heartballoons', play: { does: 'give', gives: 'balloon' } },
  luvdiscseat: { make: 'luvdiscseat', seat: 0.56 },
  lovemailbox: { make: 'lovemailbox', play: { does: 'give', gives: 'balloon' } },
  dinnerfortwo: { make: 'dinnerfortwo', play: { does: 'light', flicker: true } },
  heartwreath: { make: 'heartwreath' },
  cupidstatue: { make: 'cupidstatue' },
  heartlamp: { make: 'heartlamp', play: { does: 'light' } },
  choctable: { make: 'choctable' },
  alomomolarug: { make: 'alomomolarug' },
  pinklace: { make: 'pinklace' },
  giantegg: { make: 'giantegg' },
  egghuntbasket: { make: 'egghuntbasket' },
  eggsign: { make: 'eggsign' },
  togepilamp: { make: 'togepilamp', play: { does: 'light' } },
  springwreath: { make: 'springwreath' },
  eggtree: { make: 'eggtree' },
  bunearyarch: { make: 'bunearyarch' },
  eggcuptable: { make: 'eggcuptable' },
  eggrug: { make: 'eggrug' },
  eggshellchair: { make: 'eggshellchair', seat: 0.59 },
  chanseynest: { make: 'chanseynest' },
  exeggcuteplanter: { make: 'exeggcuteplanter' },
  eggdyestation: { make: 'eggdyestation', play: { does: 'bubbles' } },
};

export const MAKES = {
  /* ---------- New Year ---------- */

  nyclock(K, s, W, D, L) {
    const { rbox, cyl } = L, gold = K.metal(NY.gold), ink = K.plain(NY.ink), cy = u(58);
    K.put(rbox(u(16), u(6), 0.36, 0.02), K.gloss(NY.navy), 0, u(3), 0);
    K.put(rbox(u(16.4), u(1.5), 0.37, 0.006), gold, 0, u(6.25), 0);
    K.put(cyl(u(2), u(36), u(2), 12), gold, 0, u(24), 0);
    K.put(cyl(u(5), u(3), u(5), 16), gold, 0, u(43.5), 0);
    // the clock: a gold drum, a navy ring, a white face on both sides, a minute to midnight
    K.put(cyl(u(14), 0.1, u(14), 32).rotateX(Math.PI / 2), gold, 0, cy, 0);
    K.put(cyl(u(11.2), 0.104, u(11.2), 28).rotateX(Math.PI / 2), K.gloss(NY.navy), 0, cy, 0);
    K.put(cyl(u(10), 0.108, u(10), 28).rotateX(Math.PI / 2), K.plain(NY.white), 0, cy, 0);
    for (const side of [1, -1]) {
      const z = side * 0.056;
      for (let h = 0; h < 12; h++) { const a = h * Math.PI / 6, big = h % 3 === 0; K.put(rbox(u(big ? 1.4 : 0.9), u(big ? 2.2 : 1.2), 0.006, 0.002), ink, Math.sin(a) * u(8), cy + Math.cos(a) * u(8), z, 0, 0, -a); }
      for (const [len, a, w] of [[8, 0, 1.2], [5.8, -0.35, 1.6]]) K.put(rbox(u(w), u(len), 0.006, 0.002).translate(0, u(len) / 2, 0).rotateZ(-a * side), ink, 0, cy, z + side * 0.002);
      K.put(cyl(u(1.2), 0.006, u(1.2), 10).rotateX(Math.PI / 2), K.gloss(NY.red), 0, cy, z + side * 0.006);
    }
    // a star on top
    K.put(cyl(u(1), u(2.4), u(1), 8), gold, 0, u(73), 0);
    K.put(starR(L, u(4.5), u(2), 0.04), gold, 0, u(76), 0);
  },

  nychampagne(K, s, W, D, L) {
    const { cyl, lathe } = L, gold = K.metal(NY.gold), glass = K.glass(), fizz = K.gloss(NY.champ);
    K.put(lathe([[u(7), 0], [u(7), u(1)], [u(4), u(2.5)], [u(2), u(3)]], 16), gold);
    K.put(cyl(u(2), u(20), u(2), 12), gold, 0, u(12), 0);
    K.put(cyl(u(14), u(4), u(14), 28), K.gloss(NY.white), 0, u(24), 0);
    K.put(cyl(u(14.15), u(1), u(14.15), 28, true), gold, 0, u(22.5), 0);
    // a pyramid of coupes, 3 x 3, 2 x 2 and one, each on the rims below
    const COUPE = [[u(2.5), 0], [u(2.5), u(0.5)], [u(0.6), u(1)], [u(0.5), u(3.6)], [u(1.5), u(4.3)], [u(4.5), u(7)], [u(4.2), u(7.2)], [u(1.3), u(4.7)], [0, u(4.6)]];
    const WINE = [[0, u(4.8)], [u(1.4), u(4.9)], [u(4), u(6.8)], [0, u(6.8)]];
    for (let i = 0; i < 3; i++) {
      const n = 3 - i, y = u(26 + i * 7);
      for (let a = 0; a < n; a++) for (let c = 0; c < n; c++) {
        const x = (a - (n - 1) / 2) * u(9), z = (c - (n - 1) / 2) * u(9);
        K.put(lathe(COUPE, 10), glass, x, y, z);
        K.put(lathe(WINE, 10), fizz, x, y, z);
      }
    }
  },

  nypopper(K, s, W, D, L) {
    const { lathe, torus, cyl, rbox } = L, gold = K.metal(NY.gold);
    // the bucket, gold stars on it
    K.put(lathe([[u(8), 0], [u(10), u(15)], [u(9.2), u(15)], [u(7.3), u(1)], [0, u(1)]], 16), K.gloss(NY.navy));
    K.put(torus(u(10.2), u(1.4), TAU, 20), gold, 0, u(15.6), 0, 0, Math.PI / 2);
    for (const [sx, sy] of [[11, 6], [21, 9], [16, 11], [13, 12]]) {
      const x = X(sx), r = u(8 + 2 * sy / 15) + 0.004, z = Math.sqrt(Math.max(0, r * r - x * x));
      K.put(starR(L, u(1.8), u(0.8), 0.006), gold, x, u(sy), z, Math.atan2(x, z));
    }
    // five poppers fanned out of it: a striped cone, a foil end
    const COL = ['#f478b0', '#58c8e8', NY.gold, '#78d058', '#a878e0'];
    [-0.55, -0.27, 0, 0.27, 0.55].forEach((a, i) => {
      const tx = X(16 + (i - 2) * 1.5), lean = i % 2 ? -0.25 : 0.2;
      K.put(cone(L, u(4), u(18), a, lean), K.gloss(COL[i]), tx, u(10), 0);
      K.put(cyl(u(2.8), u(1.4), u(2.65), 12).translate(0, u(11), 0).rotateX(lean).rotateZ(-a), K.gloss('#ffffff'), tx, u(10), 0);
      K.put(cyl(u(3.8), u(0.6), u(3.8), 12).translate(0, u(18), 0).rotateX(lean).rotateZ(-a), gold, tx, u(10), 0);
    });
    // two popped: streamers curling up, confetti in the air
    K.put(tube(L, [[X(16), u(28), u(3.6)], [X(13), u(35), u(5)], [X(17), u(41), u(4)], [X(13), u(48), u(5)]], u(0.5), 16), K.gloss('#f478b0'));
    K.put(tube(L, [[X(26), u(26), u(3)], [X(28), u(32), u(4)], [X(24.5), u(38), u(4)], [X(27), u(45), u(3)]], u(0.5), 16), K.gloss(NY.pale));
    [[-8, 44, '#58c8e8'], [-3, 52, NY.gold], [6, 50, '#78d058'], [9, 40, '#a878e0'], [-10, 36, '#f478b0'], [2, 45, '#ffffff']].forEach(([dx, y, c], i) =>
      K.put(rbox(u(1.8), u(1.2), 0.004, 0.001), K.gloss(c), X(16.9 + dx), u(y - 0.6), u(4) - i * 0.03, i * 0.7, 0, i * 0.5));
  },

  nywishlantern(K, s, W, D, L) {
    const { cyl, torus, lathe, rbox } = L, bam = K.gloss(NY.bamboo), y0 = u(30);
    // a bamboo tripod and its ring
    for (const [fx, fz] of [[-0.31, 0.18], [0.31, 0.18], [0, -0.36]]) rod(K, L, bam, [fx, 0, fz], [fx * 0.15, u(26.5), fz * 0.15], u(1.1));
    K.put(torus(u(5), u(1), TAU, 16), K.wood(NY.dark), 0, u(27.2), 0, 0, Math.PI / 2);
    // the paper lantern, lit, ribs down it and a red band
    K.put(lathe([[u(7), 0], [u(10), u(30)], [u(8), u(34)], [0, u(34)]], 16), K.glow(NY.paper), 0, y0, 0);
    const rib = K.plain(L.tone(NY.paper, 0.78));
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2; rod(K, L, rib, [Math.sin(a) * u(7.15), y0, Math.cos(a) * u(7.15)], [Math.sin(a) * u(10.15), y0 + u(30), Math.cos(a) * u(10.15)], u(0.3)); }
    K.put(torus(u(9.65), u(0.6), TAU, 24), K.gloss(NY.red), 0, y0 + u(26), 0, 0, Math.PI / 2);
    K.put(cyl(u(3), u(1.2), u(3), 12), K.glow(NY.flame), 0, y0 + u(0.4), 0);
    // a wish tied to it
    rod(K, L, K.plain(NY.ink), [X(24.5), u(48), u(5)], [X(27.75), u(41), u(6)], u(0.25));
    K.put(rbox(u(3.5), u(9), 0.01, 0.002), K.gloss(NY.red), X(27.75), u(36.5), u(6));
  },

  balldaruma(K, s, W, D, L) {
    const { THREE, cyl, ball } = L, ink = K.gloss(NY.ink), cy = u(14), S = [u(13), u(14), u(12)];
    // a Poké Ball body, red over white, the black band and its button
    const half = (top) => new THREE.SphereGeometry(1, 20, 7, 0, TAU, top ? 0 : Math.PI / 2, Math.PI / 2).scale(...S);
    K.put(half(true), K.gloss(NY.red), 0, cy, 0);
    K.put(half(false), K.gloss(NY.white), 0, cy, 0);
    K.put(cyl(1.012, u(2.4), 1.012, 20).scale(u(13), 1, u(12)), ink, 0, cy, 0);
    K.put(cyl(u(3.5), u(1.6), u(3.5), 16).rotateX(Math.PI / 2), ink, 0, cy, u(12));
    K.put(cyl(u(2.2), u(1.6), u(2.2), 14).rotateX(Math.PI / 2), K.gloss(NY.white), 0, cy, u(12.4));
    // the face, tipped up with the body's curve: one eye filled in for a wish, one left blank, gold brows
    const tip = -0.5, fy = cy + u(7.5);
    K.put(ball(1, 16, 8).scale(u(8), u(4.8), u(1.6)), K.gloss('#f8ecd8'), 0, fy, u(9.4), 0, tip);
    for (const sx of [-1, 1]) {
      K.put(ball(u(2.2), 12, 8).scale(1, 1, 0.3), ink, sx * u(3.5), fy + 0.022, u(10.6), 0, tip);
      K.put(ball(sx < 0 ? u(1.7) : u(0.6), 10, 6).scale(1, 1, 0.3), K.gloss('#ffffff'), sx * u(3.5) - (sx < 0 ? 0 : u(0.6)), fy + 0.028 + (sx < 0 ? 0 : u(0.6)), u(10.8), 0, tip);
      K.put(tube(L, [[sx * u(1.5), cy + u(11), u(7.7)], [sx * u(3.5), cy + u(12.2), u(7)], [sx * u(5.6), cy + u(11), u(6.7)]], u(0.55), 6), K.metal(NY.gold));
    }
    K.put(tube(L, [[-u(2.5), cy + u(4), u(11.5)], [0, cy + u(3.2), u(11.8)], [u(2.5), cy + u(4), u(11.5)]], u(0.45), 6), K.metal(NY.gold));
  },

  mochipound(K, s, W, D, L) {
    const { lathe, torus, cyl, blob } = L, wood = K.wood(NY.wood), dark = K.wood(NY.dark);
    // the usu: a log hollowed to a bowl, two bands, the mochi in it
    K.put(lathe([[u(11), 0], [u(11), u(20)], [u(8.5), u(20)], [u(8.5), u(17.5)], [0, u(17.5)]], 24), wood);
    for (const y of [5, 16.6]) K.put(torus(u(11.1), u(0.9), TAU, 24), dark, 0, u(y), 0, 0, Math.PI / 2);
    K.put(blob(u(14), u(7), u(14), 0.8, 0.6), K.plain(NY.mochi), 0, u(21), 0);
    // the kine stood up behind it, head up
    const kz = -0.36;
    K.put(cyl(u(1.5), u(40), u(1.5), 12), wood, X(22.5), u(38), kz);
    K.put(cyl(u(4.5), u(16), u(4.5), 16).rotateZ(Math.PI / 2), K.wood(L.tone(NY.wood, 0.8)), X(22), u(60.5), kz);
    for (const ex of [13, 31]) K.put(cyl(u(4.6), u(2), u(4.6), 16).rotateZ(Math.PI / 2), dark, X(ex), u(60.5), kz);
  },

  luckybags(K, s, W, D, L) {
    const { rbox, cyl, torus } = L, d = 0.3;
    // three paper bags: a folded top, rope handles, a lucky coin on the front
    const bag = (x0, yb, w, h, c, trim, z) => {
      const cx = X(x0 + w / 2);
      K.put(rbox(u(w), u(h), d, 0.02), K.gloss(c), cx, u(yb + h / 2), z);
      K.put(rbox(u(w) + 0.006, u(3), d + 0.006, 0.006), K.gloss(trim), cx, u(yb + h - 1.5), z);
      for (const sz of [-1, 1]) K.put(torus(u(w * 0.2), u(0.5), Math.PI, 10), K.plain(L.tone(trim, 0.75)), cx, u(yb + h), z + sz * 0.08);
      const ey = u(yb + h / 2 - 1), fz = z + d / 2;
      K.put(cyl(u(4), 0.008, u(4), 16).rotateX(Math.PI / 2), K.gloss(trim), cx, ey, fz + 0.002);
      K.put(cyl(u(2.8), 0.008, u(2.8), 14).rotateX(Math.PI / 2), K.gloss('#ffffff'), cx, ey, fz + 0.006);
      K.put(rbox(u(2), u(2), 0.006, 0.001), K.gloss(trim), cx, ey, fz + 0.009);
    };
    bag(1, 0, 15, 18, NY.red, NY.gold, 0.02);
    bag(16, 0, 15, 18, NY.gold, NY.red, -0.02);
    bag(8, 18, 16, 18, NY.red, NY.gold, 0);
  },

  nybell(K, s, W, D, L) {
    const { rbox, cyl, lathe, torus, ball, THREE } = L, dark = K.wood(NY.dark), bronze = K.metal(NY.bronze);
    // stone footings, two posts, the beam and a hipped roof
    for (const px of [5.5, 58.5]) {
      K.put(rbox(u(9), u(5), u(10), 0.015), K.plain(NY.stone), X(px, 2), u(2.5), 0);
      K.put(rbox(u(5), u(77), u(5), 0.01), dark, X(px, 2), u(43.5), 0);
    }
    K.put(rbox(2, u(5), u(7), 0.01), dark, 0, u(83.5), 0);
    const roof = new THREE.CylinderGeometry(Math.SQRT2 * 0.375, Math.SQRT2 * 0.5, 1, 4, 1).rotateY(Math.PI / 4).toNonIndexed();
    roof.scale(2, u(9), 0.9); roof.computeVertexNormals();
    K.put(roof, K.gloss(NY.roof), 0, u(90.5), 0);
    // the bell on its hook: raised bands, two rows of bosses
    const bx = X(27, 2), by = u(36), at = (y) => { const i = BELL.findIndex(([, by2]) => by2 >= y), [r0, y0] = BELL[Math.max(0, i - 1)], [r1, y1] = BELL[i]; return u(y1 === y0 ? r1 : r0 + (r1 - r0) * (y - y0) / (y1 - y0)); };
    K.put(cyl(u(1.5), u(5), u(1.5), 8), K.metal(NY.ink), bx, u(78.5), 0);
    K.put(lathe(BELL.map(([r, y]) => [u(r), u(y)]), 24), bronze, bx, by, 0);
    for (const y of [3, 8, 22]) K.put(torus(at(y) + u(0.2), u(0.6), TAU, 24), bronze, bx, by + u(y), 0, 0, Math.PI / 2);
    for (const y of [29, 34]) for (let i = 0; i < 10; i++) { const a = (i + (y > 30 ? 0.5 : 0)) / 10 * TAU, r = at(y); K.put(ball(u(0.9), 8, 6), bronze, bx + Math.sin(a) * r, by + u(y), Math.cos(a) * r); }
    // the striking log on its ropes
    for (const rx of [43, 52]) rod(K, L, K.plain(NY.paper), [X(rx, 2), u(81), 0], [X(rx, 2), u(51), 0], u(0.4));
    K.put(cyl(u(3), u(13), u(3), 12).rotateZ(Math.PI / 2), K.wood(NY.wood), X(47.5, 2), u(49), 0);
  },

  nybanner(K, s, W, D, L) {
    const { cyl, ball } = L, gold = K.metal(NY.gold);
    // the cloth, cut to its point, the painting on it (HAPPY NEW YEAR in glitter)
    frontPut(K, L, plate(L, [[6, 15], [58, 15], [58, 50], [32, 58], [6, 50]].map(([i, j]) => [X(i, 2), WY(j)]), 0.012), 0, 0, 0.02);
    // the rod, its finials, the cords up to a nail
    K.put(cyl(u(1.3), u(58), u(1.3), 12).rotateZ(Math.PI / 2), gold, X(32, 2), WY(14.3), 0.04);
    for (const fx of [3, 61]) K.put(ball(u(2.2), 12, 8), gold, X(fx, 2), WY(14.3), 0.04);
    for (const fx of [4, 60]) rod(K, L, gold, [X(fx, 2), WY(14), 0.035], [X(32, 2), WY(5), 0.012], u(0.4));
    K.put(ball(u(1.6), 10, 8), K.metal(NY.silver), X(32, 2), WY(5), 0.012);
    // tassels at its corners
    for (const tx of [6, 58]) { K.put(cyl(u(1), u(6), u(1.2), 8), gold, X(tx, 2), WY(53), 0.034); K.put(ball(u(1.6), 10, 8), gold, X(tx, 2), WY(57.5), 0.034); }
  },

  confettigarland(K, s, W, D, L) {
    const { cyl, rbox } = L, gold = K.metal(NY.gold), COLS = [NY.gold, '#f478b0', '#58c8e8', NY.silver, '#a878e0'];
    const sag = (a, c, d, t) => [X(a + (c - a) * t, 2), WY(13 + d * Math.sin(Math.PI * t))];
    // two swags each of tinsel and of pennants on a string
    for (const [a, c] of [[4, 32], [32, 60]]) {
      K.put(tube(L, Array.from({ length: 9 }, (_, i) => [...sag(a, c, 24, i / 8), 0.05]), u(1.2), 20), K.metal(NY.silver));
      K.put(tube(L, Array.from({ length: 9 }, (_, i) => [...sag(a, c, 12, i / 8), 0.03]), u(0.35), 20), K.plain(NY.ink));
      for (let i = 1; i < 6; i++) {
        const [px, py] = sag(a, c, 12, i / 6);
        K.put(plate(L, [[-u(2.2), 0], [u(2.2), 0], [0, -u(7)]], 0.006), K.gloss(COLS[(i + (a > 20 ? 2 : 0)) % 5]), px, py, 0.027);
      }
    }
    // stars hung under the tinsel, confetti between, rosettes where it's pinned
    for (const sx of [18, 46]) { rod(K, L, K.plain(NY.ink), [X(sx, 2), WY(37), 0.05], [X(sx, 2), WY(43), 0.045], u(0.25)); K.put(starR(L, u(4), u(1.8), 0.02), gold, X(sx, 2), WY(47), 0.045); }
    [[11, 30, '#58c8e8'], [24, 27, NY.gold], [40, 30, '#f478b0'], [53, 27, '#78d058'], [32, 40, '#a878e0'], [8, 44, NY.gold], [56, 44, '#58c8e8']].forEach(([cx, cy, c], i) =>
      K.put(rbox(u(1.8), u(1.2), 0.004, 0.001), K.gloss(c), X(cx + 0.9, 2), WY(cy + 0.6), 0.012, 0, 0, i * 0.6));
    for (const rx of [4, 32, 60]) {
      K.put(cyl(u(3.5), 0.02, u(3.5), 12).rotateX(Math.PI / 2), gold, X(rx, 2), WY(13), 0.05);
      K.put(cyl(u(1.2), 0.026, u(1.2), 10).rotateX(Math.PI / 2), K.gloss(NY.pale), X(rx, 2), WY(13), 0.05);
    }
  },

  tophattable(K, s, W, D, L) {
    const { lathe, cyl, torus, rbox } = L, ink = K.gloss(NY.ink), cloth = K.cloth(NY.white), gold = K.metal(NY.gold);
    // a pedestal table under a white cloth with a gold hem
    K.put(lathe([[u(7), 0], [u(7), u(1)], [u(3), u(2.5)], [u(1.5), u(3)]], 16), ink);
    K.put(cyl(u(1.5), u(13), u(1.5), 12), ink, 0, u(8.5), 0);
    K.put(cyl(u(14), u(3), u(14), 28), cloth, 0, u(24.5), 0);
    K.put(cyl(u(14), u(8), u(14.4), 28, true), cloth, 0, u(19), 0);
    K.put(torus(u(14.3), u(1.4), TAU, 28), cloth, 0, u(15.4), 0, 0, Math.PI / 2);
    K.put(torus(u(14.65), u(0.4), TAU, 28), gold, 0, u(16), 0, 0, Math.PI / 2);
    [[20, 0.2, '#f478b0'], [26, -0.1, '#58c8e8'], [6, 0.25, NY.gold], [14, 0.3, '#78d058']].forEach(([cx, z, c], i) => K.put(rbox(u(1.6), 0.004, u(0.9), 0.001), K.gloss(c), X(cx + 0.8), u(26.01), z, i));
    // a top hat with a gold band
    const hx = X(11), hz = -0.06;
    K.put(cyl(u(8), u(0.8), u(8), 20), ink, hx, u(26.4), hz);
    K.put(cyl(u(5.5), u(15), u(5.2), 20), ink, hx, u(34.3), hz);
    K.put(cyl(u(5.62), u(3), u(5.5), 20), K.gloss(NY.gold), hx, u(29.5), hz);
    // two noisemakers lying crossed, a fringe at each mouth
    for (const [x0, y0, x1, y1, r, c, z, yaw] of [[18, 27, 30, 27.5, 2.5, NY.pale, 0.17, 0.25], [18, 29.6, 28, 34, 2.2, NY.silver, 0.04, -0.3]]) {
      const len = u(Math.hypot(x1 - x0, y1 - y0)), a = Math.atan2(x1 - x0, y1 - y0);
      K.put(cyl(u(r), len, u(0.6), 12).rotateZ(-a), K.gloss(c), X((x0 + x1) / 2), u((y0 + y1) / 2), z, yaw);
      K.put(torus(u(r), u(0.5), TAU, 12).rotateX(Math.PI / 2).translate(0, len / 2, 0).rotateZ(-a), gold, X((x0 + x1) / 2), u((y0 + y1) / 2), z, yaw);
    }
  },

  sparklervase(K, s, W, D, L) {
    const { lathe, torus, ball, rbox } = L, spark = K.glow(NY.flame), wire = K.metal('#8a8a94');
    // a silver vase with a gold band
    K.put(lathe([[u(5), 0], [u(7.6), u(4)], [u(8), u(9)], [u(6.5), u(14)], [u(4.2), u(16.5)], [u(4), u(24)], [u(5), u(25)], [u(4), u(25)], [u(3.4), u(20)]], 20), K.metal(NY.silver));
    K.put(torus(u(7.9), u(1), TAU, 24), K.metal(NY.gold), 0, u(10), 0, 0, Math.PI / 2);
    // five sparklers, each tip a burst of light
    for (const [tx, ty, tz] of [[5, 60, 0.06], [10, 67, -0.08], [16, 70, 0.02], [22, 67, 0.08], [27, 60, -0.05]]) {
      const at = [X(tx), u(ty), tz];
      rod(K, L, wire, [0, u(22), 0], at, u(0.45));
      K.put(ball(u(1.6), 10, 8), spark, ...at);
      for (let k = 0; k < 4; k++) K.put(rbox(u(0.5), u(7.2), u(0.5), 0.001), spark, ...at, k * 0.7, 0, k * Math.PI / 4);
    }
  },

  kagamimochi(K, s, W, D, L) {
    const { rbox, cyl, blob, ball } = L, hinoki = K.wood(NY.hinoki);
    // the sanbo: a pedestal with an eye cut in each side, a rimmed tray
    K.put(rbox(u(16), u(10), u(14), 0.015), hinoki, 0, u(5), 0);
    for (const sz of [1, -1]) K.put(cyl(u(3.5), 0.006, u(3.5), 16).rotateX(Math.PI / 2).scale(1, 2.5 / 3.5, 1), K.plain(L.tone(NY.hinoki, 0.4)), 0, u(5), sz * (u(7) + 0.004));
    K.put(rbox(u(24), u(2), u(24), 0.008), K.wood(L.tone(NY.hinoki, 1.1)), 0, u(11), 0);
    for (const sz of [1, -1]) { K.put(rbox(u(24), u(2), u(1), 0.004), hinoki, 0, u(13), sz * u(11.5)); K.put(rbox(u(1), u(2), u(22), 0.004), hinoki, sz * u(11.5), u(13), 0); }
    // the paper laid corner-on, its red edge, the two mochi and the mikan with its leaf
    K.put(rbox(u(17.8), 0.005, u(17.8), 0.001), K.plain(NY.red), 0, u(12) + 0.003, 0, Math.PI / 4);
    K.put(rbox(u(17), 0.005, u(17), 0.001), K.plain('#ffffff'), 0, u(12) + 0.006, 0, Math.PI / 4);
    K.put(blob(u(20), u(9), u(20), 0.9, 0.55), K.plain(NY.mochi), 0, u(17), 0);
    K.put(blob(u(15), u(7.6), u(15), 0.9, 0.55), K.plain(NY.mochi), 0, u(24.6), 0);
    K.put(ball(u(4.5), 16, 12).scale(1, 0.9, 1), K.gloss(NY.mikan), 0, u(31.5), 0);
    K.put(ball(u(2.8), 10, 6).scale(1, 0.25, 0.5), K.gloss('#4a9a3a'), X(19.5), u(35.6), 0, 0, 0, 0.4);
  },

  /* ---------- Valentine's ---------- */

  heartarch(K, s, W, D, L) {
    const { rbox, ball } = L, white = K.gloss(VAL.white), lat = K.gloss(L.tone(VAL.white, 0.86));
    // two lattice posts on marble footings
    for (const px of [6, 58]) {
      K.put(rbox(u(8), u(4), u(8), 0.012), K.gloss(VAL.marble), X(px, 2), u(2), 0);
      K.put(rbox(u(6), u(70), u(6), 0.015), white, X(px, 2), u(39), 0);
      for (let j = 0; j < 11; j++) for (const sz of [1, -1]) K.put(rbox(u(4), u(0.8), 0.006, 0.001), lat, X(px, 2), u(69.6 - j * 6), sz * (u(3) + 0.002));
    }
    // the heart over them: a vine wound with roses and leaves
    const at = ([hx, hy], z = 0) => [X(32 + hx, 2), u(70 + hy), z];
    K.put(heartTube(L, heartLoop(28, 40).map(p => at(p)), u(2.75), 56), K.plain(VAL.leaf));
    heartLoop(28, 22).forEach((p, i) => {
      K.put(ball(u(3), 10, 7), K.gloss(i % 2 ? VAL.pink : VAL.rose), ...at(p, i % 2 ? 0.04 : -0.03));
      const [lx, ly, lz] = at([p[0] + (i % 2 ? 2 : -2), p[1] - 1.5], 0.06);
      K.put(ball(u(1.8), 8, 4).scale(1, 0.6, 0.35), K.plain(L.tone(VAL.leaf, 1.25)), lx, ly, lz, 0, 0, i % 2 ? -0.6 : 0.6);
    });
  },

  chocfountain(K, s, W, D, L) {
    const { cyl, lathe, ball } = L, silver = K.metal(VAL.silver), choc = K.gloss(VAL.choc);
    // a plate of strawberries round its foot
    K.put(cyl(u(15), u(1.4), u(14), 28), K.gloss('#ffffff'), 0, u(0.7), 0);
    for (let i = 0; i < 10; i++) {
      const a = (i + 0.5) / 10 * TAU, x = Math.sin(a) * u(12), z = Math.cos(a) * u(12);
      K.put(lathe([[0, 0], [u(1.7), u(1.8)], [u(1.5), u(3)], [0, u(3.2)]], 8), K.gloss(VAL.rose), x, u(1.4), z);
      K.put(cyl(u(1.3), u(0.6), u(1.3), 6), K.plain(VAL.leaf), x, u(4.7), z);
    }
    // the silver drum and its pool, the column, three tiers with chocolate curtaining off each
    K.put(cyl(u(8), u(9), u(8), 24), silver, 0, u(7.5), 0);
    K.put(cyl(u(7.5), u(0.6), u(7.5), 24), choc, 0, u(12.2), 0);
    K.put(cyl(u(1.5), u(38), u(1.5), 12), silver, 0, u(31), 0);
    for (const [y, r] of [[23, 8], [34, 6], [45, 4]]) {
      K.put(cyl(u(r + 1.2), u(1.2), u(r * 0.5), 20), silver, 0, u(y), 0);
      K.put(cyl(u(r), u(10), u(r + 0.6), 20, true), choc, 0, u(y - 5), 0);
      K.put(cyl(u(r), u(0.6), u(r), 20), K.gloss(VAL.milk), 0, u(y + 0.9), 0);
    }
    K.put(ball(u(2.6), 12, 10).scale(1, 1.2, 1), silver, 0, u(52), 0);
  },

  rosevase(K, s, W, D, L) {
    const { lathe, cyl, ball } = L, pink = K.gloss(VAL.pink), rose = K.gloss(VAL.rose), leaf = K.plain(VAL.leaf);
    // a glass vase, water and stems in it, a pink ribbon and bow
    K.put(lathe([[u(5.6), 0], [u(6), u(0.5)], [u(6), u(26)], [u(5.4), u(26)], [u(5.4), u(1)], [0, u(1)]], 20), K.glass());
    K.put(cyl(u(5.3), u(12), u(5.3), 16), K.M('glass', '#a0d0e6', { key: 'water' }), 0, u(7), 0);
    for (const [sx, sz] of [[-2.5, 0.03], [-0.8, -0.04], [0.8, 0.04], [2.5, -0.02]]) rod(K, L, K.plain('#3a7a3a'), [u(sx), u(1), sz], [u(sx * 1.6), u(32), sz * 2], u(0.45));
    K.put(cyl(u(6.15), u(3), u(6.15), 20, true), pink, 0, u(17.5), 0);
    for (const sx of [-1, 1]) K.put(ball(u(2.4), 10, 8).scale(1, 0.66, 0.5), pink, sx * u(3), u(17.5), u(6.4));
    K.put(ball(u(1.2), 8, 6), K.gloss(L.tone(VAL.pink, 0.8)), 0, u(17.5), u(6.6));
    // the bouquet: a dome of roses among leaves
    for (const [lx, ly, t] of [[5, 33, -0.6], [27, 33, 0.6], [9, 27, -0.4], [23, 27, 0.4], [16, 28, 0]]) K.put(ball(u(3), 10, 6).scale(1, 0.5, 0.3), leaf, X(lx), u(ly), 0.08, 0, 0, t);
    for (const [rx, ry, z] of [[16, 45, 0], [11, 42, 0.06], [21, 42, 0.06], [7, 37, 0.02], [16, 39, 0.12], [25, 37, 0.02], [11, 33, 0.1], [21, 33, 0.1], [16, 31, 0.14],
      [11, 40, -0.1], [21, 40, -0.1], [16, 36, -0.14], [8, 34, -0.06], [24, 34, -0.06]]) K.put(ball(u(3.6), 10, 7), rose, X(rx), u(ry), z);
  },

  heartballoons(K, s, W, D, L) {
    const { rbox, ball } = L, string = K.plain('#e8e8ee'), pink = K.gloss(VAL.pink), rose = K.gloss(VAL.rose);
    // five foil hearts on strings
    for (const [cx, cy, sz, c, z] of [[16, 72, 14, VAL.rose, 0], [8, 60, 12, VAL.pink, 0.08], [24, 60, 12, '#e8485e', -0.06], [11, 46, 10, VAL.foil, -0.1], [22, 48, 10, VAL.gold, 0.1]]) {
      K.put(heartR(L, u(sz), u(3.4)), K.gloss(c), X(cx), u(cy), z);
      const tip = [X(cx), u(cy - 0.45 * sz - 0.6), z];
      rod(K, L, string, [0, u(8), 0], tip, u(0.25));
      K.put(ball(u(0.8), 8, 6), K.gloss(c), ...tip);
    }
    // tied to a little gift box
    K.put(rbox(u(10), u(8), u(10), 0.012), pink, 0, u(4), 0);
    K.put(rbox(u(2), u(8.1), u(10.2), 0.004), rose, 0, u(4), 0);
    K.put(rbox(u(10.2), u(8.1), u(2), 0.004), rose, 0, u(4), 0);
    K.put(rbox(u(10.2), u(1.6), u(10.2), 0.004), rose, 0, u(6.2), 0);
    for (const sx of [-1, 1]) K.put(ball(u(2), 10, 6).scale(1, 0.65, 0.6), rose, sx * u(2), u(8.6), 0, 0, 0, sx * 0.4);
  },

  luvdiscseat(K, s, W, D, L) {
    const { blob, ball } = L, pink = K.gloss(VAL.pink), fin = K.gloss(L.tone(VAL.pink, 0.8)), bz = -0.26, face = bz + u(4);
    // a round pouf, a heart cushion lying on it, its point to the front
    K.put(blob(u(24), u(12), 0.62, 0.7, 0.6), K.cloth(VAL.blush), 0, u(6), 0);
    K.put(heartR(L, u(28), u(7)).rotateX(-Math.PI / 2), K.cloth(VAL.seat), 0, u(14.5), 0.03);
    // Luvdisc as the back: a plump heart, a fin each side, its eyes and lips
    K.put(heartR(L, u(26), u(8)), pink, 0, u(30), bz);
    for (const sx of [-1, 1]) K.put(ball(u(4.2), 10, 8).scale(0.62, 1, 0.3), fin, X(16 + sx * 13), u(29), bz, 0, 0, sx * 0.6);
    for (const ex of [11.5, 20.5]) {
      K.put(ball(u(2.4), 12, 8).scale(1, 1, 0.35), K.gloss('#ffffff'), X(ex), u(31), face + 0.004);
      K.put(ball(u(1.5), 10, 8).scale(1, 1, 0.4), K.gloss('#303048'), X(ex + 0.3), u(30.8), face + 0.02);
      K.put(ball(u(0.5), 8, 6), K.gloss('#ffffff'), X(ex - 0.6), u(32), face + 0.04);
    }
    K.put(ball(u(2.4), 10, 8).scale(1, 0.6, 0.35), K.gloss(VAL.lips), 0, u(25.5), face + 0.005);
  },

  lovemailbox(K, s, W, D, L) {
    const { rbox, THREE } = L, white = K.gloss(VAL.white), rose = K.gloss(VAL.rose);
    // a post on a foot
    K.put(rbox(u(12), u(3), u(12), 0.01), white, 0, u(1.5), 0);
    K.put(rbox(u(4), u(28), u(4), 0.008), white, 0, u(16), 0);
    // the box: an arched pink tunnel, its door, a heart and a handle on it, a love letter slipped in
    const arch = (r, h) => { const sh = new THREE.Shape(); sh.moveTo(-r, 0); sh.lineTo(r, 0); sh.lineTo(r, h); sh.absarc(0, h, r, 0, Math.PI, false); sh.closePath(); return sh; };
    const box = new THREE.ExtrudeGeometry(arch(u(10) - 0.012, u(12)), { depth: 0.56, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 1, curveSegments: 12 });
    K.put(box.translate(0, 0.012, -0.28), K.gloss(VAL.pink), 0, u(30), 0);
    K.put(new THREE.ExtrudeGeometry(arch(u(8), u(10)), { depth: 0.012, bevelEnabled: false, curveSegments: 12 }), K.gloss(L.tone(VAL.pink, 1.12)), 0, u(32), 0.292);
    K.put(heartR(L, u(9), u(1.4)), rose, 0, u(38), 0.31);
    K.put(rbox(u(2), u(1.4), 0.02, 0.003), K.metal(VAL.gold), 0, u(33), 0.31);
    K.put(rbox(u(10), u(5), 0.008, 0.002), K.gloss('#fffaf4'), 0, u(47.5), 0.308);
    K.put(heartR(L, u(3.4), 0.008), rose, 0, u(47.4), 0.314);
    // its flag, up, a heart on it
    K.put(rbox(u(1.6), u(18), u(1.6), 0.004), rose, X(26.3), u(43), 0.12);
    K.put(heartR(L, u(7), u(1.4)), rose, X(28.5), u(52), 0.12);
  },

  dinnerfortwo(K, s, W, D, L) {
    const { rbox, cyl, blob, lathe, ball, torus } = L, gold = K.metal(VAL.gold), white = K.gloss(VAL.white), cloth = K.cloth('#ffffff');
    // a chair either side, side on, facing across the table
    for (const sd of [-1, 1]) {
      const cx = sd * -X(10.5, 2);
      K.put(rbox(u(15), u(3), u(14), 0.012), white, cx, u(19.5), 0);
      K.put(blob(u(13), u(3.5), u(12), 0.6, 0.5), K.cloth(VAL.pink), cx, u(22.2), 0);
      for (const lx of [-1, 1]) for (const lz of [-1, 1]) K.put(cyl(u(1.1), u(18), u(1.1), 8), gold, cx + lx * u(6.4), u(9), lz * u(5.5));
      K.put(rbox(u(4), u(28), u(13), 0.012), white, cx + sd * u(5.5), u(34), 0);
      K.put(ball(u(2.2), 10, 8), gold, cx + sd * u(5.5), u(48.5), 0);
    }
    // the table: a gold pedestal, a white cloth to a scalloped hem, a pink runner over it
    K.put(lathe([[u(7), 0], [u(7), u(1)], [u(3), u(2.5)], [u(1.5), u(3)]], 16), gold);
    K.put(cyl(u(1.5), u(12), u(1.5), 12), gold, 0, u(8), 0);
    K.put(cyl(u(15), u(3), u(15), 28), cloth, 0, u(27.5), 0);
    K.put(cyl(u(15), u(12), u(15.4), 28, true), cloth, 0, u(20), 0);
    K.put(torus(u(15.3), u(1.4), TAU, 28), cloth, 0, u(14.4), 0, 0, Math.PI / 2);
    K.put(rbox(u(8), 0.006, u(30.6), 0.002), K.cloth(VAL.pink), 0, u(29) + 0.004, 0);
    for (const sz of [1, -1]) K.put(rbox(u(8), u(15), 0.006, 0.002), K.cloth(VAL.pink), 0, u(21.5), sz * u(15.45));
    // two plates, two glasses of wine, the candle between
    for (const px of [21.5, 42.5]) K.put(cyl(u(4), u(0.6), u(3.6), 20), K.gloss('#ffffff'), X(px, 2), u(29.3), 0);
    for (const gx of [25.5, 38.5]) {
      K.put(lathe([[u(1.6), 0], [u(1.6), u(0.4)], [u(0.4), u(0.8)], [u(0.4), u(3.8)], [u(2), u(5.6)], [u(2.2), u(8)], [u(2), u(8)], [u(1.8), u(5.8)], [0, u(5.2)]], 10), K.glass(), X(gx, 2), u(29), 0.06);
      K.put(lathe([[0, u(5.4)], [u(1.8), u(6)], [u(2), u(7)], [0, u(7)]], 10), K.gloss(VAL.deep), X(gx, 2), u(29), 0.06);
    }
    K.put(lathe([[u(2.5), 0], [u(2.5), u(0.6)], [u(1.2), u(1)], [u(1.2), u(4)], [u(1.6), u(5)], [u(1.2), u(5)]], 12), gold, 0, u(29), 0);
    K.put(cyl(u(1), u(9), u(1), 10), K.plain('#fff8ec'), 0, u(38.5), 0);
    K.put(ball(u(1.3), 10, 8).scale(1, 1.8, 1), K.glow(VAL.flame), 0, u(46), 0);
  },

  heartwreath(K, s, W, D, L) {
    const { ball, rbox } = L, rose = K.gloss(VAL.rose), at = ([hx, hy], z) => [X(16 + hx), WY(42 - hy), z];
    // a vine bent to a heart, leaves and roses round it
    K.put(heartTube(L, heartLoop(13, 32).map(p => at(p, u(2.6))), u(2.5), 40), K.plain(VAL.leaf));
    heartLoop(13, 16).forEach((p, i) => K.put(ball(u(1.6), 8, 4).scale(1, 0.62, 0.35), K.plain(L.tone(VAL.leaf, i % 2 ? 1.25 : 0.8)), ...at(p, u(4.8)), 0, 0, i % 2 ? 0.7 : -0.7));
    heartLoop(13, 8).forEach((p, i) => { if (i) K.put(ball(u(2.4), 10, 7), K.gloss(i % 2 ? VAL.pink : VAL.rose), ...at(p, u(4.6))); });
    // the satin bow in its notch, hung by a ribbon from a nail
    for (const sx of [-1, 1]) {
      K.put(ball(u(3.4), 10, 8).scale(1, 0.65, 0.4), rose, X(16 + sx * 3.5), WY(34), u(5.2));
      K.put(rbox(u(1.4), u(6), 0.008, 0.002), K.gloss(VAL.deep), X(16 + sx * 2), WY(38), u(4.8), 0, 0, sx * 0.35);
      rod(K, L, rose, [X(16), WY(9), 0.012], [X(16 + sx * 3), WY(31), u(4)], u(0.5));
    }
    K.put(ball(u(1.6), 8, 6), K.gloss(L.tone(VAL.rose, 0.8)), X(16), WY(34.5), u(5.6));
    K.put(ball(u(1.4), 8, 6), K.metal(VAL.silver), X(16), WY(9), 0.012);
  },

  cupidstatue(K, s, W, D, L) {
    const { rbox, ball, torus } = L, marble = K.gloss(VAL.marble), flute = K.gloss(L.tone(VAL.marble, 0.84));
    // a fluted marble pedestal
    K.put(rbox(u(20), u(6), u(20), 0.015), marble, 0, u(3), 0);
    K.put(rbox(u(14), u(24), u(14), 0.012), K.gloss(L.tone(VAL.marble, 1.06)), 0, u(18), 0);
    for (let turn = 0; turn < 4; turn++) for (let i = 0; i < 4; i++) {
      const o = u(-4.5 + i * 3), d = u(7) + 0.002;
      K.put(rbox(u(1), u(20), 0.006, 0.002), flute, turn % 2 ? (turn === 1 ? d : -d) : o, u(18), turn % 2 ? o : (turn === 0 ? d : -d), turn % 2 ? Math.PI / 2 : 0);
    }
    K.put(rbox(u(20), u(4), u(20), 0.015), marble, 0, u(32), 0);
    // the cherub: wings behind, a round body and head, curls, a pink sash
    for (const sx of [-1, 1]) {
      K.put(ball(u(3.6), 12, 8).scale(1, 6.5 / 3.6, 0.25), K.gloss('#ffffff'), X(16 + sx * 7), u(48), -0.08, sx * -0.4, 0, sx * -0.7);
      K.put(ball(u(2.6), 12, 8), marble, X(16 + sx * 2.5), u(36.6), 0.02);
    }
    K.put(ball(u(5.5), 16, 12).scale(1, 6.5 / 5.5, 0.85), marble, 0, u(43), 0);
    K.put(ball(u(4.8), 16, 12), marble, 0, u(53.5), 0);
    for (const [cx, cy, z] of [[12.5, 56.5, 0.02], [14.5, 58.5, 0.03], [17, 59, 0.03], [19.5, 57.5, 0.02], [20.5, 55, 0], [13, 55, -0.08], [19, 55, -0.08], [16, 57.5, -0.1]]) K.put(ball(u(1.3), 8, 6), flute, X(cx), u(cy), z);
    K.put(tube(L, [[X(12), u(47), u(3.2)], [X(16), u(43.5), u(4.8)], [X(20), u(39), u(3.4)]], u(0.7), 10), K.gloss(VAL.pink));
    for (const ex of [14.5, 18]) K.put(ball(u(0.5), 6, 4), K.gloss('#5a5060'), X(ex), u(53.5), u(4.6));
    for (const ex of [13.5, 19.5]) K.put(ball(u(0.8), 6, 4).scale(1, 1, 0.4), K.gloss(VAL.blush), X(ex), u(52), u(4.2));
    // an arm out to a gold bow, a heart-tipped arrow on its string
    rod(K, L, marble, [X(19), u(44.2), 0.03], [X(25), u(44.2), 0.05], u(0.8));
    K.put(torus(u(6), u(0.5), 2.2, 12).rotateZ(-1.1), K.metal(VAL.gold), X(25), u(44), 0.05);
    rod(K, L, K.plain('#e8e8ee'), [X(25 + Math.cos(1.1) * 6), u(44 + Math.sin(1.1) * 6), 0.05], [X(25 + Math.cos(1.1) * 6), u(44 - Math.sin(1.1) * 6), 0.05], u(0.2));
    rod(K, L, K.metal(VAL.gold), [X(17), u(44), 0.06], [X(28), u(44), 0.06], u(0.35));
    K.put(heartR(L, u(3.6), u(1)), K.gloss(VAL.rose), X(29.5), u(44.3), 0.06);
  },

  heartlamp(K, s, W, D, L) {
    const { lathe, cyl } = L, gold = K.metal(VAL.gold);
    K.put(lathe([[u(8), 0], [u(8), u(1.4)], [u(6), u(2.6)], [u(1.5), u(3.4)], [0, u(3.4)]], 20), gold);
    K.put(cyl(u(1), u(13), u(1), 10), gold, 0, u(9), 0);
    K.put(cyl(u(2.5), u(2), u(2.5), 12), gold, 0, u(15.5), 0);
    // the frosted heart, lit, a brighter heart glowing through its front
    K.put(heartR(L, u(26), u(7)), K.glow(VAL.glow), 0, u(29), 0);
    K.put(heartR(L, u(12), 0.008), K.glow('#ffe0ea'), X(15), u(31), u(3.5) + 0.004);
  },

  choctable(K, s, W, D, L) {
    const { cyl, ball, rbox } = L, gold = K.metal(VAL.gold);
    // a round side table on three legs
    K.put(cyl(u(13), u(3.5), u(13), 28), K.wood(NY.wood), 0, u(23.25), 0);
    for (const [lx, lz] of [[-0.24, 0.14], [0.24, 0.14], [0, -0.28]]) K.put(cyl(u(1.2), u(21.5), u(1.2), 10), K.wood(L.tone(NY.wood, 0.8)), lx, u(10.75), lz);
    // the heart box lying open, its chocolates, the lid stood up behind with a ribbon and a bow
    K.put(heartR(L, u(20), u(4)).rotateX(-Math.PI / 2), K.gloss(VAL.deep), 0, u(27), 0.04);
    [[-0.17, -0.05], [-0.06, 0], [0.06, 0], [0.17, -0.05], [-0.1, 0.1], [0.1, 0.1], [0, 0.17]].forEach(([cx, cz], i) =>
      K.put(ball(u(1.6), 10, 6).scale(1, 0.6, 1), K.gloss(i % 2 ? VAL.choc : VAL.milk), cx, u(29.3), cz + 0.04));
    K.put(heartR(L, u(22), u(1.5)), K.gloss(VAL.rose), 0, u(37), -0.2, 0, -0.2);
    K.put(rbox(u(1.6), u(18), 0.006, 0.002), gold, 0, u(37), -0.2 + u(0.75) + 0.004, 0, -0.2, -0.78);
    for (const [bx, by] of [[19.5, 41], [23.5, 39.5]]) K.put(ball(u(2.4), 10, 6).scale(1, 0.66, 0.4), gold, X(bx), u(by), -0.16);
  },

  alomomolarug(K, s, W, D, L) {
    const { THREE, cyl } = L;
    // the heart of its body, its fins and tail: one slab, the painting on top
    rugPut(K, L, W, D, new THREE.ExtrudeGeometry(heartShapeR(L, u(27)), { depth: 0.03, bevelEnabled: false, curveSegments: 10 }).translate(0, -(u(34) - 1), 0));
    for (const [fx, fz, rx, rz] of [[7, 36, 6, 4], [57, 36, 6, 4], [28, 17, 4, 3], [36, 17, 4, 3]]) {
      const g = cyl(1, 0.028, 1, 16).scale(u(rx), 1, u(rz)).translate(X(fx, 2), 0.014, u(fz) - 1);
      K.put(g, K.pic(K.p.art(0, L.HD)));
      L.topUV(g, W, D);
    }
  },

  pinklace(K, s, W, D, L) {
    const { rbox, torus, ball, THREE } = L, art = K.p.art(0, L.HD, true), frame = K.gloss(VAL.white), gold = K.metal(VAL.gold);
    // the lace is the painting itself, cut out by its alpha, so its hearts show through
    const lace = K.pic(art);
    Object.assign(lace, { alphaTest: 0.5, transparent: false, side: THREE.DoubleSide });
    for (let i = 0; i < 3; i++) {
      const px = 1 + i * 21, w = 20, cx = px + w / 2, th = [0.35, 0, -0.35][i], hinge = [px + w, cx, px][i], hx = X(hinge, 2);
      // each panel built about its hinge and folded there: the two outer ones come forward
      const put = (g, m, lx, y, lz = 0) => K.put(g.translate(X(lx, 2) - hx, y, lz), m, hx, 0, 0, th);
      for (const ex of [px + 0.8, px + w - 0.8]) put(rbox(u(1.6), u(57), u(1.6), 0.004), frame, ex, u(31.5));
      put(torus(u(w / 2 - 0.8), u(0.8), Math.PI, 16), frame, cx, u(60));
      put(rbox(u(w), u(1.6), u(1.6), 0.004), frame, cx, u(11.2));
      for (const fx of [px + 2.5, px + w - 2.5]) put(rbox(u(3), u(3), u(3), 0.006), gold, fx, u(1.5));
      put(ball(u(1.4), 10, 8), gold, cx, u(71.4));
      put(boxUV(new THREE.PlaneGeometry(u(w - 0.4), u(68)), [px + 0.2, 25, px + w - 0.2, 93], art, L.HD), lace, cx, u(37));
    }
  },

  /* ---------- Egg Day ---------- */

  giantegg(K, s, W, D, L) {
    const { lathe, torus, cyl } = L, gold = K.metal(NY.gold);
    // a gold ring on three feet
    for (const a of [0, TAU / 3, -TAU / 3]) K.put(cyl(u(0.8), u(5), u(0.8), 8), K.metal(L.tone(NY.gold, 0.8)), Math.sin(a) * u(7), u(2.5), Math.cos(a) * u(7));
    K.put(torus(u(8), u(1.5), TAU, 24), gold, 0, u(5.5), 0, 0, Math.PI / 2);
    // the egg, its bands wrapped round it by height
    const g = lathe(eggProfile(u(12.5), u(42), 14), 16, true), pos = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setY(i, pos.getY(i) / u(42));
    K.put(g, K.pic(eggBands()), 0, u(3), 0);
  },

  egghuntbasket(K, s, W, D, L) {
    const { lathe, torus, cyl, ball } = L, straw = K.cloth(EGG.straw), dark = K.cloth(L.tone(EGG.straw, 0.8));
    // a wicker basket, a rolled rim, its handle and a bow tied on top
    K.put(lathe([[u(8), 0], [u(11), u(19)], [u(10.2), u(19)], [u(7.3), u(1)], [0, u(1)]], 20), straw);
    K.put(torus(u(11), u(1.7), TAU, 24), K.cloth(L.tone(EGG.straw, 1.12)), 0, u(19.2), 0, 0, Math.PI / 2);
    K.put(torus(u(10.5), u(1.2), Math.PI, 18), dark, 0, u(20), 0);
    for (const sx of [-1, 1]) K.put(ball(u(2.6), 10, 8).scale(1, 0.7, 0.5), K.gloss(EGG.lilac), sx * u(3), u(31), 0);
    K.put(ball(u(1.3), 8, 6), K.gloss(L.tone(EGG.lilac, 0.8)), 0, u(31), 0);
    // paper grass spilling over the rim, five eggs nestled in it
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; K.put(cyl(0.002, u(5), u(1.3), 4).translate(0, u(2.5), 0), K.plain(EGG.grass), Math.sin(a) * u(9), u(18), Math.cos(a) * u(9), a, 0.35); }
    for (const [ex, ey, c, t, z] of [[10, 20, EGG.pink, -0.3, 0.02], [21.5, 20, EGG.sky, 0.3, 0.02], [15.5, 21, EGG.mint, 0, -0.08], [13, 19, EGG.butter, -0.15, 0.13], [19, 19.5, EGG.lilac, 0.2, 0.12]]) eggR(K, L, K.gloss(c), X(ex), u(ey - 1), z, u(3.2), u(8.5), 10, 8, t);
  },

  eggsign(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, wood = K.wood(NY.wood);
    // the post, a painted egg on top
    K.put(rbox(u(4), u(58), u(4), 0.008), wood, 0, u(29), 0);
    eggR(K, L, K.gloss(EGG.mint), 0, u(57.5), 0, u(3.6), u(9));
    K.put(cyl(u(3.68), u(1.3), u(3.68), 12, true), K.gloss(EGG.pink), 0, u(62), 0);
    // the two arrow boards, wearing their painting: EGG HUNT this way, eggs that way
    for (const pts of [[[2, 50], [26, 50], [31, 45], [26, 40], [2, 40]], [[6, 36], [30, 36], [30, 26], [6, 26], [1, 31]]]) frontPut(K, L, plate(L, pts.map(([i, j]) => [X(i), u(j)]), u(1.6)), 0, 0, u(2.2));
    // grass and two flowers at its foot
    for (const [gx, h, t, z] of [[9, 7, -2, 0.1], [12, 9, -1, -0.06], [20, 8, 1, 0.08], [23, 6, 2, -0.1], [11, 5, 1.5, 0.16], [21, 6, -1.5, 0.15]]) K.put(cyl(0.002, u(h), u(1.2), 4), K.plain(EGG.grass), X(gx), u(h / 2), z, 0, 0, -t * 0.1);
    for (const [fx, fy, c, z] of [[8, 7, EGG.pink, 0.15], [24, 6.5, EGG.butter, 0.12]]) {
      rod(K, L, K.plain(EGG.grass), [X(fx), 0, z], [X(fx), u(fy), z], u(0.3));
      K.put(cyl(u(1.8), u(0.6), u(1.8), 5).rotateX(Math.PI / 2), K.gloss(c), X(fx), u(fy), z + 0.01);
      K.put(ball(u(0.7), 6, 4), K.gloss('#ffffff'), X(fx), u(fy), z + 0.02);
    }
  },

  togepilamp(K, s, W, D, L) {
    const { lathe, ball, cyl, rbox, THREE } = L, toge = K.gloss(EGG.toge), ink = K.gloss(EGG.ink), lit = K.glow(EGG.glow);
    K.put(lathe([[u(9), 0], [u(9), u(2.5)], [u(7), u(3.5)], [0, u(3.5)]], 20), K.wood(NY.wood));
    // the shell: the lower half of an egg, its triangles wrapped round it, lit inside, its rim zigzagged
    const H = u(40), cut = Math.acos(1 - 2 * u(22) / H), y0 = u(4);
    const outer = Array.from({ length: 9 }, (_, i) => { const t = i / 8 * cut; return [u(12) * Math.sin(t) * (1 + 0.12 * Math.cos(t)), H / 2 * (1 - Math.cos(t))]; });
    const g = lathe(outer, 20, true), pos = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setY(i, pos.getY(i) / u(22));
    K.put(g, K.pic(togeShell()), 0, y0, 0);
    K.put(new THREE.LatheGeometry(outer.map(([r, y]) => new THREE.Vector2(Math.max(5e-4, r - u(0.7)), Math.max(u(0.7), y))).reverse(), 20), lit, 0, y0, 0);
    const rimR = outer[8][0] - u(0.35);
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; K.put(cyl(0.002, u(2.5), u(1.9), 4).translate(0, u(1.25), 0), lit, Math.sin(a) * rimR, y0 + u(22), Math.cos(a) * rimR, a); }
    // Togepi peeking out: its crown of spikes, eyes, cheeks, a smile, two little hands on the rim
    K.put(ball(u(7.5), 16, 12), toge, 0, u(30), 0);
    for (const a of [-1, -0.5, 0, 0.5, 1]) K.put(cyl(0.002, u(4.5), u(1.8), 6).translate(0, u(8.6), 0).rotateZ(-a), toge, 0, u(30), 0);
    for (const sx of [-1, 1]) {
      K.put(ball(u(1), 8, 6).scale(1, 1.6, 0.5), ink, sx * u(3), u(29), u(6.9));
      K.put(ball(u(1), 8, 6).scale(1, 1, 0.4), K.gloss('#f8b8b8'), sx * u(5), u(28.4), u(5.6));
      K.put(ball(u(2), 10, 8), toge, sx * u(8), u(25), u(3));
    }
    K.put(rbox(u(2.4), u(0.5), 0.006, 0.001), ink, 0, u(26.8), u(7.2));
  },

  springwreath(K, s, W, D, L) {
    const { torus, ball, cyl, rbox } = L, cx = X(16), cy = WY(40), cz = u(2.8), mint = K.gloss(EGG.mint);
    // a ring of leaves
    K.put(torus(u(10.5), u(2.7), TAU, 28), K.plain('#5a9a48'), cx, cy, cz);
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; K.put(ball(u(1.8), 8, 4).scale(1, 0.6, 0.35), K.plain(i % 2 ? '#7ab858' : '#4a8a3a'), cx + Math.cos(a) * u(10.5), cy - Math.sin(a) * u(10.5), cz + u(2.2), 0, 0, -a); }
    // pastel flowers round it, three little eggs among them
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU + 0.3, fx = cx + Math.cos(a) * u(10.5), fy = cy - Math.sin(a) * u(10.5);
      K.put(cyl(u(2.4), u(0.8), u(2.4), 5).rotateX(Math.PI / 2), K.gloss([EGG.pink, EGG.butter, EGG.lilac, '#ffffff'][i % 4]), fx, fy, cz + u(2.8), 0, 0, i);
      K.put(ball(u(0.8), 6, 4), K.gloss(i % 4 === 1 ? '#f0a030' : '#f8d040'), fx, fy, cz + u(3.4));
    }
    for (const [ex, ey, c] of [[7, 46, EGG.sky], [25.5, 46, EGG.peach], [25, 34, EGG.mint]]) eggR(K, L, K.gloss(c), X(ex), WY(ey), cz + u(1.6), u(2), u(5), 10, 7);
    // a mint bow at the bottom, the ribbon up to a nail
    for (const sx of [-1, 1]) {
      K.put(ball(u(3), 10, 8).scale(1, 0.66, 0.4), mint, X(16 + sx * 3), WY(51.5), cz + u(3));
      K.put(rbox(u(1.5), u(6), 0.006, 0.002), K.gloss(L.tone(EGG.mint, 0.8)), X(16 + sx * 2), WY(55), cz + u(2.6), 0, 0, sx * 0.3);
    }
    K.put(ball(u(1.4), 8, 6), K.gloss(L.tone(EGG.mint, 0.8)), X(16), WY(51.8), cz + u(3.4));
    K.put(rbox(u(1.4), u(18), 0.006, 0.002), mint, X(16), WY(19), 0.01);
    K.put(ball(u(1.4), 8, 6), K.metal(VAL.silver), X(16), WY(10), 0.012);
  },

  eggtree(K, s, W, D, L) {
    const { lathe, cyl, ball, THREE } = L;
    // a white pot with a pink band, its soil
    K.put(lathe([[u(5), 0], [u(6), u(1)], [u(6), u(13)], [u(7), u(13.5)], [u(7), u(15.5)], [u(6.2), u(15.5)], [u(5.8), u(14)], [0, u(14)]], 20), K.gloss('#f4f0ec'));
    K.put(cyl(u(6.05), u(2.5), u(6.05), 20, true), K.gloss(EGG.pink), 0, u(7.75), 0);
    K.put(cyl(u(5.8), u(0.6), u(5.8), 16), K.plain('#4a3020'), 0, u(14), 0);
    // bare branches fanning out, a blossom at their tips
    const Z = [0.04, -0.08, 0, 0.1, -0.06], twig = K.wood(EGG.twig);
    EGG_TREE.branches.forEach((br, i) => K.put(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(br.map(([px, py], j) => new THREE.Vector3(X(px), -u(py), Z[i] * j / (br.length - 1)))), 10, u(0.8 - i * 0.05), 5), twig));
    EGG_TREE.branches.forEach((br, i) => { const [px, py] = br[br.length - 1]; K.put(ball(u(1.4), 8, 6), K.gloss(EGG.pink), X(px), -u(py), Z[i]); });
    // eggs hung from them on threads
    const EZ = [0.03, 0.02, -0.07, 0, 0, 0.06, 0.09, -0.03, -0.05], PAST = [EGG.pink, EGG.mint, EGG.sky, EGG.butter, EGG.lilac, EGG.peach];
    EGG_TREE.eggs.forEach(([ex, ey], i) => {
      const x = X(ex), y = -u(ey), z = EZ[i];
      rod(K, L, K.plain('#f4f0ec'), [x, y, z], [x, y - u(3), z], u(0.25));
      eggR(K, L, K.gloss(PAST[i % 6]), x, y - u(9.5), z, u(2.6), u(6.5), 10, 8);
      if (i % 3 === 0) K.put(cyl(u(2.68), u(0.9), u(2.68), 10, true), K.gloss('#ffffff'), x, y - u(9.5) + u(3.25), z);
    });
  },

  bunearyarch(K, s, W, D, L) {
    const { rbox, torus, ball, cyl } = L, cream = K.gloss(EGG.cream), fluff = K.cloth(EGG.fluff);
    // the posts and the arch
    for (const px of [6, 58]) {
      K.put(rbox(u(8), u(4), u(8), 0.012), K.gloss(L.tone(EGG.cream, 0.85)), X(px, 2), u(2), 0);
      K.put(rbox(u(6), u(42), u(6), 0.012), cream, X(px, 2), u(25), 0);
    }
    K.put(torus(u(26), u(3), Math.PI, 32), cream, 0, u(46), 0);
    // eggs and flowers wound round it
    BUN_EGGS.forEach((a, i) => eggR(K, L, K.gloss([EGG.pink, EGG.mint, EGG.sky, EGG.butter, EGG.lilac][i]), X(32 + Math.cos(a) * 26, 2), u(46 + Math.sin(a) * 26 - 3.5), u(3), u(2.6), u(7), 10, 8, a - Math.PI / 2));
    for (const a of [2.9, 2.35, 1.85, 1.3, 0.8, 0.25]) {
      const fx = X(32 + Math.cos(a) * 26, 2), fy = u(46 + Math.sin(a) * 26);
      K.put(cyl(u(1.8), u(0.5), u(1.8), 5).rotateX(Math.PI / 2), K.gloss('#ffffff'), fx, fy, u(3.2), 0, 0, a);
      K.put(ball(u(0.7), 6, 4), K.gloss(EGG.butter), fx, fy, u(3.6));
    }
    // Buneary's ears over it, pink inside, cream fluff at their roots
    for (const sx of [-1, 1]) {
      K.put(ball(1, 16, 10).scale(u(5.5), u(12), u(3)), K.cloth(EGG.brown), X(32 + sx * 9, 2), u(83), 0, 0, 0, -sx * 0.27);
      K.put(ball(1, 12, 8).scale(u(2.6), u(8.5), u(1)), K.cloth('#f4b0b8'), X(32 + sx * 8.6, 2), u(82), u(2.4), 0, 0, -sx * 0.27);
      K.put(ball(u(4.5), 12, 8), fluff, X(32 + sx * 8, 2), u(72), 0);
      for (const dx of [-3, 3]) K.put(ball(u(2.6), 10, 6), fluff, X(32 + sx * 8 + dx, 2), u(70), 0.03);
    }
  },

  eggcuptable(K, s, W, D, L) {
    const { rbox, cyl, lathe } = L, wood = K.wood(NY.wood), light = K.cloth('#e4f8ee');
    // legs under a mint gingham cloth
    for (const lx of [-1, 1]) for (const lz of [-1, 1]) K.put(cyl(u(1.5), u(17.5), u(1.5), 10), wood, lx * u(10.5), u(8.75), lz * u(9.5));
    K.put(rbox(u(28), u(9), u(24), 0.02), K.cloth(EGG.mint), 0, u(21.5), 0);
    for (let i = 0; i < 7; i++) K.put(rbox(u(2), u(9) + 0.004, u(24) + 0.004, 0.004), light, X(4 + i * 4), u(21.5), 0);
    for (let j = 0; j < 2; j++) K.put(rbox(u(28) + 0.004, u(2), u(24) + 0.004, 0.004), light, 0, u(22 - j * 4), 0);
    // three egg cups, a painted egg in each
    const CUP = [[u(2.6), 0], [u(2.6), u(0.8)], [u(0.8), u(1.2)], [u(0.8), u(3.2)], [u(2.2), u(3.6)], [u(3.2), u(6)], [u(2.9), u(6.1)], [u(2), u(4.2)], [0, u(4)]];
    EGG_CUPS.forEach(([cx, cup, eg, band], i) => {
      const x = X(cx), z = [0.06, -0.08, 0.06][i];
      K.put(lathe(CUP, 12), K.gloss(cup), x, u(26), z);
      eggR(K, L, K.gloss(eg), x, u(30), z, u(2.9), u(7.5));
      K.put(cyl(u(2.98), u(1.05), u(2.98), 12, true), K.gloss(band), x, u(33.75), z);
    });
  },

  eggrug(K, s, W, D, L) {
    rugPut(K, L, W, D, new L.THREE.ExtrudeGeometry(new L.THREE.Shape(eggOutline(32, 62, 26, 60).map(([px, py]) => new L.THREE.Vector2(X(px, 2), 1 - py / 32))), { depth: 0.03, bevelEnabled: false }));
  },

  eggshellchair(K, s, W, D, L) {
    const { lathe, blob, THREE } = L, shell = K.gloss(EGG.shell), inner = K.plain('#ece2cc'), R0 = u(14), H0 = u(46), y0 = u(4);
    K.put(lathe([[u(7), 0], [u(7), u(1)], [u(2.5), u(2.2)], [u(1.5), u(2.6)], [u(1.5), u(4.5)], [u(3), u(5)], [0, u(5)]], 20), K.metal(NY.gold));
    // the shell, outside and in: whole below the opening and over it, its front cut away between
    const prof = (t0, t1, n, k) => Array.from({ length: n + 1 }, (_, i) => { const t = t0 + (t1 - t0) * i / n; return new THREE.Vector2(Math.max(5e-4, R0 * k * Math.sin(t) * (1 + 0.12 * Math.cos(t))), H0 / 2 * (1 - Math.cos(t))); });
    const tAt = (y) => Math.acos(1 - 2 * y / H0), t1 = tAt(u(9)), t2 = tAt(u(39));
    for (const [a, b, n, phi, len] of [[0, t1, 3, 0, TAU], [t1, t2, 8, 0.9, TAU - 1.8], [t2, Math.PI, 3, 0, TAU]]) {
      K.put(new THREE.LatheGeometry(prof(a, b, n, 1), 20, phi, len), shell, 0, y0, 0);
      K.put(new THREE.LatheGeometry(prof(a, b, n, 0.93).reverse(), 20, phi, len), inner, 0, y0, 0);
    }
    // a pink cushion to sit on and one to lean back on
    K.put(blob(u(14), u(20), u(6), 0.6, 0.5), K.cloth(EGG.pink), 0, u(31), -0.2);
    K.put(blob(u(20), u(7), u(16), 0.6, 0.5), K.cloth(L.tone(EGG.pink, 1.08)), 0, u(15.5), 0.02);
  },

  chanseynest(K, s, W, D, L) {
    const { lathe, torus, cyl, ball } = L, pink = K.gloss(EGG.chansey);
    // Chansey's round pink body as the bowl, its rim rolled, straw inside
    K.put(lathe([[u(3), 0], [u(9), u(2)], [u(13.5), u(7)], [u(15), u(14)], [u(14.6), u(17.5)], [u(13), u(18.6)], [u(12), u(16)], [u(10.5), u(11)], [0, u(10)]], 20), pink);
    K.put(torus(u(13.8), u(2.4), TAU, 24), K.gloss(L.tone(EGG.chansey, 1.12)), 0, u(16.5), 0, 0, Math.PI / 2);
    K.put(cyl(u(11.5), u(3), u(10.5), 20), K.cloth(EGG.straw), 0, u(12.5), 0);
    // its white pouch and its feet in front, its curls behind
    K.put(ball(1, 16, 10).scale(u(9), u(5), u(3)), K.gloss('#fff8f4'), 0, u(8.5), u(12.3), 0, -0.25);
    for (const sx of [-1, 1]) {
      K.put(ball(u(2.2), 10, 6).scale(1, 0.55, 0.8), K.gloss(L.tone(EGG.chansey, 0.8)), sx * u(8), u(4), 0.21);
      for (const [cx, cy, t] of [[12, 24, 0.8], [13, 19, 1]]) K.put(ball(u(2), 10, 6).scale(1, 2, 0.6), pink, sx * u(cx), u(cy), -0.12, 0, 0, -sx * t);
    }
    // its lucky egg, and two little ones
    eggR(K, L, K.gloss('#fffaf2'), 0, u(14), 0, u(6.5), u(17), 14, 10);
    eggR(K, L, K.gloss(EGG.sky), X(9), u(14), 0.04, u(3.4), u(8), 10, 8, -0.2);
    eggR(K, L, K.gloss(EGG.butter), X(23), u(14), 0.04, u(3.4), u(8), 10, 8, 0.2);
  },

  exeggcuteplanter(K, s, W, D, L) {
    const { rbox, blob, ball } = L, soil = K.plain('#4a3020'), ink = K.gloss(EGG.ink);
    // a plank box of soil, mounded at the back
    K.put(rbox(u(26), u(14), u(22), 0.015), K.wood(NY.wood), 0, u(7), 0);
    for (const y of [4.5, 9]) K.put(rbox(u(26) + 0.004, u(0.8), u(22) + 0.004, 0.002), K.wood(L.tone(NY.wood, 0.55)), 0, u(y), 0);
    for (const sx of [-1, 1]) K.put(rbox(u(2.2), u(14) + 0.004, u(22) + 0.004, 0.004), K.wood(L.tone(NY.wood, 0.85)), sx * u(12), u(7), 0);
    K.put(rbox(u(24), u(1), u(20), 0.004), soil, 0, u(14.2), 0);
    K.put(blob(u(22), u(8), u(9), 0.7, 0.6), soil, 0, u(15), -0.12);
    // sprouts, and Exeggcute: six pale eggs with faces
    for (const [lx, ly, t] of [[12, 31, -0.5], [20, 32, 0.5], [16, 34, 0]]) K.put(ball(u(2.2), 10, 6).scale(1, 2, 0.4), K.gloss('#5aa848'), X(lx), u(ly), -0.06, 0, 0, t);
    [[9, 18, -0.12], [16, 20, -0.14], [23, 18, -0.12], [8, 11, 0.12], [16, 12, 0.12], [24, 11, 0.12]].forEach(([ex, ey, z]) => {
      const x = X(ex), y = u(ey);
      eggR(K, L, K.gloss(EGG.exe), x, y, z, u(4.6), u(11), 10, 8);
      for (const sx of [-1, 1]) K.put(ball(u(1), 8, 6).scale(1, 1, 0.5), ink, x + sx * u(1.6), y + u(6.4), z + u(4.15));
      K.put(rbox(u(1.6), u(0.5), 0.006, 0.001), K.plain('#a05050'), x, y + u(4), z + u(4.55));
    });
  },

  eggdyestation(K, s, W, D, L) {
    const { rbox, cyl, ball, torus } = L, wood = K.wood(NY.wood), glass = K.glass(), silver = K.metal(NY.silver);
    // the table and its shelf, a carton of white eggs on it
    for (const lx of [4.5, 59.5]) for (const lz of [-1, 1]) K.put(cyl(u(1.5), u(27), u(1.5), 10), wood, X(lx, 2), u(13.5), lz * 0.36);
    K.put(rbox(u(62), u(4), 0.86, 0.015), wood, 0, u(29), 0);
    K.put(rbox(u(60), u(2.5), 0.78, 0.01), K.wood(L.tone(NY.wood, 0.85)), 0, u(8.75), 0);
    K.put(rbox(u(22), u(5), u(12), 0.01), K.plain('#d8c8a8'), X(19, 2), u(12.5), 0);
    for (let i = 0; i < 5; i++) for (const z of [-0.09, 0.09]) K.put(ball(u(1.9), 8, 6).scale(1, 1.2, 1), K.gloss(EGG.shell), X(10.5 + i * 4.3, 2), u(15.5), z);
    // four cups of dye, a wire dipper in the second
    [EGG.pink, EGG.mint, EGG.sky, EGG.butter].forEach((c, i) => {
      const x = X(8.5 + i * 9, 2), y = u(31);
      K.put(cyl(u(3.5), u(10), u(3.5), 12, true), glass, x, y + u(5), 0);
      K.put(cyl(u(3.5), u(0.6), u(3.5), 12), glass, x, y + u(0.3), 0);
      K.put(cyl(u(3.1), u(5.6), u(3.1), 12), K.gloss(L.tone(c, 0.8)), x, y + u(3.4), 0);
    });
    rod(K, L, silver, [X(17.5, 2), u(35), 0], [X(20, 2), u(48), -0.02], u(0.35));
    K.put(torus(u(1.8), u(0.35), TAU, 10), silver, X(17.5, 2), u(34), 0, 0, Math.PI / 2);
    // the drying rack, four dyed eggs on its pegs
    K.put(rbox(u(20), u(3), u(8), 0.008), K.wood(L.tone(NY.wood, 1.1)), X(51, 2), u(32.5), 0);
    [EGG.lilac, EGG.peach, EGG.mint, EGG.pink].forEach((c, i) => {
      const x = X(44 + i * 4.5, 2);
      K.put(cyl(u(0.5), u(2), u(0.5), 8), K.wood(NY.dark), x, u(35), 0);
      eggR(K, L, K.gloss(c), x, u(35), 0, u(2), u(5.6), 10, 8);
      K.put(cyl(u(2.07), u(0.8), u(2.07), 10, true), K.gloss('#ffffff'), x, u(37.8), 0);
    });
  },
};
