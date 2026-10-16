/* base-models-s.js  -  the Wedding, Summer festival and Lantern Festival sets (js/base-furniture-season2.js), modelled
   from parts like the arcade cabinets (the user's ask, 2026-10-16: "3D detailed CLEAN models ... optimise them";
   js/base-models-f.js's head says how a batch works). Each builder follows its painting part by part: `u(n)` is n of
   its 32 pixels a tile, `X(n, W)` a painted pixel across as x from the middle, a painted height b - n is `u(n)`. Wall
   pieces use js/base-models-w.js's frame (`WX`, `WY`: back at z 0). Every piece is in its set's own colours, so none
   reads the theme's palette. Lanterns, candles and the neon heart are `K.glow()`, lit and switched by a tap
   (`play: { does: 'light' }`); the bell rings, the drum beats, the furin chime, the mortar fires. */

import { rod } from './base-models-kit.js';
import { X as WX, Y as WY, pic, bar, whole } from './base-models-w.js';
import { cord } from './base-models-w2.js';
import { WHITE, IVORY, BLUSH, ROSE, GOLD, SAGE, SILVER, CHAPEL, BOTTLE, GOWNG, GOWNR, FORM, CEDAR, VERMIL, INDIGO, BAMBOO, KARP,
  TUB, WATER, IRON, MELON, MELOND, PIG, TEAL, SPARK, LRED, LACQ, RUBY, PAPER, LGLOW, PURPLE, LILAC, STONE, HINOKI, JADE, TILE,
  PLASTER, DARKW, WAX, CRUST, PINK, PALEPINK, BLOSSOM, HEARTS, DRAGON } from './base-furniture-season2.js';

const u = (n) => n / 32;
const X = (n, W = 1) => n / 32 - W / 2;
const TAU = Math.PI * 2;
const INK = '#2a2430';

const sheet = (w, h, draw) => { const c = new OffscreenCanvas(w, h); draw(c.getContext('2d'), w, h); return c; };
const pics = {};
const once = (key, make) => pics[key] || (pics[key] = make());

/* the shaved-ice flag: ICE in red over blue waves */
const iceFlag = () => once('ice', () => sheet(96, 80, (g, w, h) => {
  g.fillStyle = '#f8f8f4'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#3a7ad8'; g.lineWidth = 5;
  for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(16 + i * 32, h, 16, Math.PI, Math.PI * 2); g.stroke(); }
  g.font = 'bold 40px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#d83a4a';
  g.fillText('ICE', w / 2, 30);
}));
/* a riddle slip's question mark */
const riddle = () => once('riddle', () => sheet(32, 64, (g, w, h) => {
  g.clearRect(0, 0, w, h); g.font = 'bold 40px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = INK; g.fillText('?', w / 2, h / 2);
}));

/* ----- parts ----- */
/** The painting's heart (js/base-furniture-season2.js's heartPath), `s` across, `t` thick, facing +z. */
function heartGeo(L, s, t) {
  const sh = new L.THREE.Shape();
  sh.moveTo(0, -0.45 * s);
  sh.bezierCurveTo(-0.1 * s, -0.3 * s, -0.5 * s, -0.1 * s, -0.5 * s, 0.12 * s);
  sh.bezierCurveTo(-0.5 * s, 0.4 * s, -0.15 * s, 0.5 * s, 0, 0.25 * s);
  sh.bezierCurveTo(0.15 * s, 0.5 * s, 0.5 * s, 0.4 * s, 0.5 * s, 0.12 * s);
  sh.bezierCurveTo(0.5 * s, -0.1 * s, 0.1 * s, -0.3 * s, 0, -0.45 * s);
  return sh;
}
const heart = (L, s, t) => new L.THREE.ExtrudeGeometry(heartGeo(L, s, t), { depth: t * 0.5, bevelEnabled: true, bevelThickness: t * 0.25, bevelSize: Math.min(t * 0.25, s * 0.05), bevelSegments: 1, curveSegments: 4 }).translate(0, 0, -t * 0.25);

/** A roof w0 x d0 at its eaves rising h to a top w1 x d1 (0 for a ridge or a point), faces flat. */
function hipRoof(L, w0, d0, w1, d1, h) {
  const a = w0 / 2, b = d0 / 2, c = w1 / 2, d = d1 / 2;
  const v = [[-a, 0, -b], [a, 0, -b], [a, 0, b], [-a, 0, b], [-c, h, -d], [c, h, -d], [c, h, d], [-c, h, d]];
  const f = [0, 1, 2, 0, 2, 3, 3, 2, 6, 3, 6, 7, 2, 1, 5, 2, 5, 6, 1, 0, 4, 1, 4, 5, 0, 3, 7, 0, 7, 4, 7, 6, 5, 7, 5, 4];
  const g = new L.THREE.BufferGeometry();
  g.setAttribute('position', new L.THREE.Float32BufferAttribute(f.flatMap(i => v[i]), 3));
  g.setAttribute('uv', new L.THREE.Float32BufferAttribute(new Array(f.length * 2).fill(0), 2));
  g.computeVertexNormals();
  return g;
}

/** A rose: a bloom and its swirled heart. */
function rose(K, L, c, x, y, z, r) {
  K.put(L.ball(r, 8, 6).scale(1, 0.9, 0.75), K.cloth(c), x, y, z);
  K.put(L.torus(r * 0.45, r * 0.18, TAU, 8), K.cloth(L.tone(c, 1.15)), x - r * 0.1, y + r * 0.08, z + r * 0.62);
}
/** A leaf, `len` long, tipped `rz`. */
const leaf = (K, L, m, x, y, z, len, wid, rz = 0, ry = 0) => K.put(L.ball(1, 6, 4).scale(wid, len, wid * 0.3), m, x, y, z, ry, 0, rz);
/** A ribbon bow: two loops, a knot and two tails, `s` its size. */
function bow(K, L, m, x, y, z, s = 1) {
  for (const sx of [-1, 1]) {
    K.put(L.torus(u(2.2) * s, u(0.8) * s, TAU, 10).scale(1.35, 0.85, 0.7), m, x + sx * u(3) * s, y, z, sx * 0.3);
    K.put(L.rbox(u(1.4) * s, u(7) * s, u(0.4) * s, 0), m, x + sx * u(1.5) * s, y - u(3.6) * s, z, 0, 0, sx * 0.3);
  }
  K.put(L.ball(u(1.5) * s, 8, 6), m, x, y, z + u(0.3));
}
/** A candle's or a Litwick's flame, its foot at y, `h` tall, `w` round, a paler core in it. */
function flame(K, L, x, y, z, h, w, c, core) {
  K.put(L.lathe([[0.001, 0], [w * 0.8, h * 0.18], [w, h * 0.38], [w * 0.6, h * 0.7], [0.001, h]], 10), K.glow(c), x, y, z);
  K.put(L.ball(w * 0.45, 8, 6), K.glow(core), x, y + h * 0.3, z + w * 0.3);
}
/** A round silk lantern as js/base-furniture-season2.js's lantern(): its top cap at height `top`, rx x ry painted. */
function lantern(K, L, x, top, z, rx, ry, c, tassel = true) {
  const gold = K.metal(GOLD);
  K.put(L.cyl(u(rx * 0.55), u(2), u(rx * 0.55), 12), gold, x, top - u(1), z);
  K.put(L.ball(u(rx), 16, 12).scale(1, ry / rx, 0.9), K.glow(c), x, top - u(1.5 + ry), z);
  K.put(L.cyl(u(rx * 0.55), u(2), u(rx * 0.55), 12), gold, x, top - u(2 + ry * 2), z);
  if (tassel) K.put(L.cyl(u(0.5), u(ry * 0.9), u(0.9), 6), K.cloth(L.tone(c, 0.75)), x, top - u(3 + ry * 2.45), z);
}
/** A Magikarp, head to -x, `s` its size, turned `ry` and tipped `rz`. */
function karp(K, L, x, y, z, s = 1, ry = 0, rz = 0) {
  const { ball, cyl } = L, put = (g, m, lx, ly, lz) => { g.translate(lx * s, ly * s, lz * s); g.rotateZ(rz); g.rotateY(ry); K.put(g, m, x, y, z); };
  put(ball(1, 14, 10).scale(u(7) * s, u(4.5) * s, u(3.2) * s), K.gloss(KARP), 0, 0, 0);
  put(ball(1, 10, 6).scale(u(5) * s, u(1.8) * s, u(2.8) * s), K.gloss('#f8e8d8'), -u(1), -u(2.4), 0);
  put(cyl(0.001, u(6) * s, u(5) * s, 8).rotateZ(Math.PI / 2).scale(1, 1, 0.25), K.gloss('#f4f0ec'), u(9), 0, 0);
  put(cyl(0.001, u(5) * s, u(2.5) * s, 6).scale(1, 1, 0.3), K.gloss('#f8d030'), -u(1), u(6.5), 0);
  for (const sz of [-1, 1]) {
    put(ball(u(1.6) * s, 8, 6), K.gloss('#ffffff'), -u(3.5), u(1), sz * u(2.4));
    put(ball(u(0.7) * s, 6, 4), K.gloss(INK), -u(3.9), u(1), sz * u(3.6));
  }
  put(cyl(u(0.4) * s, u(5) * s, u(0.3) * s, 6).rotateZ(0.6), K.gloss('#f8d030'), -u(7.2), -u(2.5), u(1.5));
}

export const SHAPES = {
  weddingarch: { make: 'weddingarch' },
  weddingcake: { make: 'weddingcake' },
  bowchair: { make: 'bowchair', seat: 0.78 },
  bouquetstand: { make: 'bouquetstand' },
  gardevoirgown: { make: 'gardevoirgown' },
  chapelbell: { make: 'chapelbell', play: { does: 'beat', hits: ['fx-ding'], swing: true } },
  guestbook: { make: 'guestbook' },
  weddingcandles: { make: 'weddingcandles', play: { does: 'light', flicker: true } },
  heartballoons: { make: 'heartballoons', play: { does: 'give', gives: 'balloon' } },
  champagnetable: { make: 'champagnetable' },
  petalgarland: { make: 'petalgarland' },
  photobackdrop: { make: 'photobackdrop', play: { does: 'light' } },
  shavedice: { make: 'shavedice', play: { does: 'whirr' } },
  karpscoop: { make: 'karpscoop', play: { does: 'water' } },
  windchimestand: { make: 'windchimestand', play: { does: 'note', voice: 'bell', high: true } },
  fireworkmortar: { make: 'fireworkmortar', play: { does: 'firework' } },
  festivaldrum: { make: 'festivaldrum', play: { does: 'beat', hits: ['fx-taiko'] } },
  fanrack: { make: 'fanrack' },
  watermelonstand: { make: 'watermelonstand' },
  mosquitopig: { make: 'mosquitopig', play: { does: 'steam' } },
  ramunetub: { make: 'ramunetub', play: { does: 'give', gives: 'can', sound: 'fx-pop' } },
  mikoshi: { make: 'mikoshi' },
  sparklerbucket: { make: 'sparklerbucket', play: { does: 'light', flicker: true } },
  summerbanner: { make: 'summerbanner' },
  sudare: { make: 'sudare' },
  skylantern: { make: 'skylantern', play: { does: 'light' } },
  lanterntree: { make: 'lanterntree', play: { does: 'light' } },
  moonviewing: { make: 'moonviewing' },
  chandelurestand: { make: 'chandelurestand', play: { does: 'light', flicker: true } },
  lanternpond: { make: 'lanternpond', play: { does: 'light' } },
  riddlerack: { make: 'riddlerack', play: { does: 'light' } },
  dragonlantern: { make: 'dragonlantern', play: { does: 'light' } },
  mooncaketable: { make: 'mooncaketable' },
  lanternarch: { make: 'lanternarch', play: { does: 'light' } },
  moongate: { make: 'moongate' },
  lotuslantern: { make: 'lotuslantern', play: { does: 'light' } },
  litwicktiers: { make: 'litwicktiers', play: { does: 'light', flicker: true } },
  silklanterns: { make: 'silklanterns', play: { does: 'light' } },
};

export const MAKES = {
  /* ----- wedding ----- */
  weddingarch(K, s, W, D, L) {
    const { rbox, cyl, torus } = L, white = K.gloss(WHITE), sage = K.cloth(SAGE);
    // two posts on their bases, a bow and a cascade of roses on each
    for (const px of [6, 58]) {
      K.put(rbox(u(10), u(5), u(10), 0.01), K.gloss(IVORY), X(px, W), u(2.5), 0);
      K.put(cyl(u(2), u(57), u(2), 12), white, X(px, W), u(33.5), 0);
      bow(K, L, K.cloth(BLUSH), X(px, W), u(34), u(2.4));
      for (const [j, c] of [[56, BLUSH], [49, WHITE], [43, ROSE]]) { leaf(K, L, sage, X(px - 2, W), u(j - 2), u(1.2), u(2.4), u(1.6), 0.4); rose(K, L, c, X(px, W), u(j), u(1.6), u(2.2)); }
    }
    // the arch, leaves along it, roses round its crown
    K.put(torus(u(26), u(2), Math.PI, 28), white, 0, u(62), 0);
    const at = (a, r = 26) => [X(32 + Math.cos(a) * r, W), u(62 - Math.sin(a) * r)];
    for (let i = 0; i <= 12; i++) { const a = Math.PI + i / 12 * Math.PI, [x, y] = at(a); leaf(K, L, sage, x, y + u(1), (i % 2 ? 1 : -1) * u(1.8), u(2.6), u(1.6), a + Math.PI / 2); }
    [[1.08, 3, ROSE], [1.2, 2.5, BLUSH], [1.32, 3, WHITE], [1.42, 2.5, BLUSH], [1.5, 3.5, ROSE], [1.58, 2.5, WHITE], [1.68, 3, BLUSH], [1.8, 2.5, ROSE], [1.92, 3, WHITE]]
      .forEach(([a, r, c], n) => { const [x, y] = at(a * Math.PI); rose(K, L, c, x, y, (n % 2 ? 1 : 0.4) * u(1.8), u(r)); });
  },

  weddingcake(K, s, W, D, L) {
    const { lathe, cyl, torus } = L, white = K.gloss(WHITE), ivory = K.gloss(IVORY), blush = K.gloss(BLUSH);
    // the cake table's cloth, blush swags round its top
    K.put(lathe([[u(13), 0], [u(12.6), u(8)], [u(11.4), u(26)], [u(11), u(29)], [u(11.6), u(29.6)], [u(11.6), u(31)], [0.001, u(31)]], 24), K.cloth(IVORY), 0, 0, 0);
    for (let i = 0; i < 8; i++) { const a = (i + 0.5) / 8 * TAU; K.put(torus(u(3), u(0.5), Math.PI, 8), blush, Math.sin(a) * u(11.4), u(30), Math.cos(a) * u(11.4), a, 0, Math.PI); }
    // three tiers, piped at the foot, a blush ribbon round each
    for (const [r, y0, h] of [[9, 31, 11], [6, 42, 10], [3.5, 52, 8]]) {
      K.put(cyl(u(r), u(h), u(r), 24), white, 0, u(y0 + h / 2), 0);
      K.put(torus(u(r), u(0.7), TAU, 24).rotateX(Math.PI / 2), ivory, 0, u(y0 + 1), 0);
      K.put(cyl(u(r + 0.15), u(1.5), u(r + 0.15), 24), blush, 0, u(y0 + h - 4.75), 0);
    }
    // roses climbing the tiers, a leaf or two, the gold heart topper
    const on = (r, px) => Math.sqrt(Math.max(0, r * r - (px - 16) ** 2));
    for (const [px, j, r, R, c] of [[21, 45, 2, 6, ROSE], [11, 38, 1.8, 9, ROSE], [18, 55, 1.5, 3.5, BLUSH], [14, 36, 1.4, 9, BLUSH]]) rose(K, L, c, X(px), u(j), u(on(R, px) + 0.6), u(r));
    leaf(K, L, K.cloth(SAGE), X(23), u(43), u(on(6, 21.5) + 0.4), u(1.8), u(1.2), -0.6);
    leaf(K, L, K.cloth(SAGE), X(9), u(36), u(on(9, 9) + 0.6), u(1.8), u(1.2), 0.6);
    K.put(cyl(u(0.5), u(3), u(0.5), 6), K.metal(GOLD), 0, u(61.5), 0);
    K.put(heart(L, u(7), u(1.4)), K.metal(GOLD), 0, u(65), 0);
  },

  bowchair(K, s, W, D, L) {
    const { rbox, cyl, blob } = L, white = K.gloss(WHITE), blush = K.cloth(BLUSH);
    // the back posts run to the floor, the front legs stop at the seat, stretchers between
    for (const px of [8.25, 23.75]) K.put(cyl(u(1.25), u(52), u(1.25), 10), white, X(px), u(26), -u(8));
    for (const px of [6.5, 25.5]) K.put(cyl(u(1.5), u(18), u(1.3), 10), white, X(px), u(9), u(8));
    for (const z of [-u(8), u(8)]) K.put(rbox(u(18), u(1.5), u(1.5), 0), white, 0, u(8.25), z);
    for (const px of [7.5, 24.5]) K.put(rbox(u(1.5), u(1.5), u(16), 0), white, X(px), u(8.25), 0);
    // the seat and its ivory cushion
    K.put(rbox(u(24), u(4), u(20), 0.012), white, 0, u(20), 0);
    K.put(blob(u(22), u(4), u(18), 0.3, 0.45, 16), K.cloth(IVORY), 0, u(23), u(0.5));
    // the back: its rails and spindles, a blush sash and bow round it
    K.put(rbox(u(18), u(3), u(2), 0.008), white, 0, u(50.5), -u(8));
    K.put(rbox(u(18), u(1.6), u(1.6), 0), white, 0, u(43.2), -u(8));
    for (const px of [12.75, 16.25, 19.75]) K.put(rbox(u(1.5), u(24), u(1.2), 0), white, X(px), u(37), -u(8));
    K.put(rbox(u(18.6), u(3.5), u(2.8), 0.006), blush, 0, u(34.25), -u(8));
    bow(K, L, blush, 0, u(34), -u(6.2), 1.2);
  },

  bouquetstand(K, s, W, D, L) {
    const { lathe, cyl, ball } = L, gold = K.metal(GOLD), blush = K.cloth(BLUSH), sage = K.cloth(SAGE);
    // the foot, the slim stem and its knop, the cup
    K.put(lathe([[u(7), 0], [u(7), u(1.5)], [u(5), u(2.5)], [u(1.5), u(3.5)], [u(1), u(4)]], 20), gold, 0, 0, 0);
    K.put(cyl(u(1), u(46), u(1), 10), gold, 0, u(25), 0);
    K.put(ball(u(2.2), 12, 8).scale(1, 0.7, 1), gold, 0, u(24), 0);
    K.put(lathe([[u(3), 0], [u(6), u(6)], [u(6.5), u(7)], [u(0.5), u(7)]], 16), gold, 0, u(48), 0);
    // the bouquet: a round of greenery, roses over its front and crown, ribbons trailing from the cup
    K.put(ball(u(9.5), 16, 12).scale(1, 1, 0.9), sage, 0, u(63), 0);
    for (const [i, j] of [[8, 57], [24, 57], [10, 66], [22, 66]]) leaf(K, L, sage, X(i), u(j), u(3), u(3), u(2), (16 - i) / 8);
    for (const [i, j, c] of [[12, 59, ROSE], [16, 57, WHITE], [20, 60, BLUSH], [13, 65, BLUSH], [19, 66, ROSE], [16, 70, WHITE], [16, 63, ROSE]]) {
      const dz = Math.sqrt(Math.max(0, 81 - (i - 16) ** 2 - (j - 63) ** 2)) * 0.9;
      rose(K, L, c, X(i), u(j), u(dz), u(3));
    }
    for (const [i, j] of [[12, 64], [20, 64], [16, 71]]) rose(K, L, [WHITE, BLUSH, ROSE][i % 3], X(i), u(j), -u(5.5), u(3));
    for (const sx of [-1, 1]) rod(K, L, blush, [sx * u(1), u(50), u(4)], [sx * u(4), u(37), u(4.6)], u(0.6));
    bow(K, L, blush, 0, u(51), u(5.8), 0.8);
  },

  gardevoirgown(K, s, W, D, L) {
    const { THREE, lathe, cyl } = L, white = K.cloth(WHITE);
    // the skirt, open down its front on the green lining: the gap closes towards the waist
    const pts = [[0.001, 0], [u(13), 0], [u(13), u(2)], [u(12), u(10)], [u(8), u(26)], [u(5), u(40)], [0.001, u(40.5)]];
    const g0 = 0.42, top = u(40), skirt = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), 24, g0, TAU - g0 * 2), pos = skirt.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), r = Math.hypot(x, z);
      let a = Math.atan2(x, z); if (a < 0) a += TAU;
      const gy = g0 * (1 - Math.min(1, Math.max(0, y / top))), a2 = gy + (a - g0) * (TAU - gy * 2) / (TAU - g0 * 2);
      pos.setXYZ(i, Math.sin(a2) * r, y, Math.cos(a2) * r);
    }
    skirt.computeVertexNormals();
    K.put(skirt, white, 0, 0, 0);
    K.put(lathe(pts.map(([r, y]) => [r * 0.95, y]), 20), K.cloth(GOWNG), 0, 0, 0);
    // the bodice, its green sash and the red fin at the chest
    K.put(lathe([[u(5), 0], [u(5.5), u(5)], [u(5.8), u(11)], [u(6.5), u(15)], [u(7), u(17)], [u(3), u(18.5)], [u(1.5), u(19)]], 20).scale(1, 1, 0.75), white, 0, u(40), 0);
    K.put(cyl(u(5.4), u(3), u(5.4), 20).scale(1, 1, 0.8), K.cloth(GOWNG), 0, u(40.5), 0);
    K.put(new THREE.OctahedronGeometry(1).scale(u(3), u(6), u(1.5)), K.gloss(GOWNR), 0, u(51), u(4.4));
    // the dress form's neck and cap
    K.put(cyl(u(1.5), u(8), u(1.5), 10), K.wood(FORM), 0, u(61), 0);
    K.put(cyl(u(3.5), u(1.5), u(3.5), 16).scale(1, 1, 0.8), K.wood(L.tone(FORM, 0.75)), 0, u(65.25), 0);
  },

  chapelbell(K, s, W, D, L) {
    const { rbox, lathe, ball, cyl } = L, white = K.wood(WHITE), gold = K.metal(GOLD);
    // the step, two posts, the beam and a blue gable roof
    K.put(rbox(u(30), u(5), u(26), 0.012), K.gloss(IVORY), 0, u(2.5), 0);
    for (const px of [5, 27]) K.put(rbox(u(4), u(77), u(4), 0.006), white, X(px), u(43.5), 0);
    K.put(rbox(u(30), u(4), u(6), 0.006), white, 0, u(82), 0);
    K.put(rbox(u(32), u(1.5), u(13), 0), K.gloss(L.tone(CHAPEL, 0.75)), 0, u(84.25), 0);
    K.put(hipRoof(L, u(32), u(13), 0, u(13), u(9)), K.gloss(CHAPEL), 0, u(85), 0);
    // the bell on its hanger, its clapper, a blush bow on its crown
    K.put(cyl(u(1), u(4), u(1), 8), K.metal(IRON), 0, u(78), 0);
    K.put(lathe([[0.001, u(77.5)], [u(3), u(77)], [u(5), u(72)], [u(6), u(60)], [u(9), u(52)], [u(9), u(50)], [u(8.2), u(50)], [u(5), u(57)], [0.001, u(61)]].map(([r, y]) => [r, y - u(50)]).reverse(), 16), gold, 0, u(50), 0);
    K.put(ball(u(2), 10, 8), K.metal(L.tone(GOLD, 0.75)), 0, u(48), 0);
    bow(K, L, K.cloth(BLUSH), 0, u(76), u(3.4), 0.9);
    // the bell rope down beside the post, a blush tassel on its end
    K.put(cyl(u(0.5), u(56), u(0.5), 6), K.cloth(IVORY), X(23.5), u(52), u(2.5));
    K.put(cyl(u(0.8), u(5), u(1.2), 8), K.cloth(BLUSH), X(23.5), u(22.5), u(2.5));
  },

  guestbook(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, white = K.gloss(WHITE), gold = K.metal(GOLD), t = 0.35;
    // the plinth, the column and its gold panel, a heart on its front
    K.put(rbox(u(20), u(4), u(16), 0.01), white, 0, u(2), 0);
    K.put(rbox(u(12), u(34), u(10), 0.012), white, 0, u(21), 0);
    for (const j of [33.5, 8.5]) K.put(rbox(u(8), u(1), u(0.6), 0), gold, 0, u(j), u(5.2));
    for (const px of [12.5, 19.5]) K.put(rbox(u(1), u(26), u(0.6), 0), gold, X(px), u(21), u(5.2));
    K.put(heart(L, u(6), u(1)), K.gloss(BLUSH), 0, u(22), u(5.4));
    // the sloped top, its gold lip, the open book on it and a quill
    K.put(rbox(u(26), u(2.2), u(14), 0.008), white, 0, u(41.5), 0, 0, t);
    K.put(rbox(u(26), u(1.5), u(1.5), 0), gold, 0, u(39.1), u(6.6));
    K.put(rbox(u(22), u(0.8), u(12), 0), K.gloss(ROSE), 0, u(42.9), 0, 0, t);
    for (const sx of [-1, 1]) K.put(rbox(u(10), u(1.2), u(11), 0), K.gloss('#fffef8'), sx * u(5.2), u(43.8), 0, 0, t, -sx * 0.06);
    rod(K, L, K.gloss(L.tone(WHITE, 0.85)), [X(24), u(45), u(2)], [X(28), u(60), -u(1)], u(0.35));
    K.put(ball(1, 8, 6).scale(u(1.6), u(6), u(0.5)), K.cloth(WHITE), X(28.3), u(56), -u(0.3), 0, 0, -0.3);
    K.put(cyl(u(1.2), u(2), u(1.4), 8), gold, X(24), u(44.5), u(2));
  },

  weddingcandles(K, s, W, D, L) {
    const { lathe, cyl, ball } = L, gold = K.metal(GOLD), wax = K.gloss(WHITE), blush = K.cloth(BLUSH);
    // the foot, the stem and its knop, two arms curving up to cups
    K.put(lathe([[u(8), 0], [u(8), u(1.5)], [u(6), u(3)], [u(4), u(4)], [u(4), u(9)], [u(1.5), u(9.2)]], 20), gold, 0, 0, 0);
    K.put(cyl(u(1), u(42), u(1), 10), gold, 0, u(30), 0);
    K.put(ball(u(2.4), 12, 8).scale(1, 0.67, 1), gold, 0, u(26), 0);
    for (const cx of [11, 21]) {
      const pts = Array.from({ length: 7 }, (_, n) => { const a = n / 6 * Math.PI; return new L.THREE.Vector3(X(cx + Math.cos(a) * 5), u(44 - Math.sin(a) * 5), 0); });
      K.put(new L.THREE.TubeGeometry(new L.THREE.CatmullRomCurve3(pts), 12, u(0.8), 6), gold, 0, 0, 0);
    }
    // three white tapers, the middle one tallest, each lit
    for (const [px, y0, h] of [[6, 47, 13], [26, 47, 13], [16, 51, 17]]) {
      K.put(lathe([[u(1), 0], [u(2.5), u(1)], [u(2.5), u(2)], [0.001, u(2)]], 12), gold, X(px), u(y0 - 2), 0);
      K.put(cyl(u(1.5), u(h), u(1.5), 12), wax, X(px), u(y0 + h / 2), 0);
      flame(K, L, X(px), u(y0 + h + 0.4), 0, u(5.4), u(1.5), '#ffcf60', '#fff4d0');
    }
    // roses and leaves where the arms meet, ribbon tails below
    rose(K, L, BLUSH, 0, u(42), u(1.6), u(2.4));
    for (const sx of [-1, 1]) {
      leaf(K, L, K.cloth(SAGE), sx * u(4), u(41), u(1), u(2.2), u(1.4), sx * 0.6);
      rod(K, L, blush, [sx * u(1), u(40), u(1.4)], [sx * u(3), u(30.5), u(1.6)], u(0.5));
    }
  },

  heartballoons(K, s, W, D, L) {
    const { rbox, cyl } = L, white = K.gloss(WHITE), rose_ = K.gloss(ROSE);
    // two gift-box weights, their ribbons, strings up to the arch
    for (const px of [6.5, 57.5]) {
      K.put(rbox(u(9), u(9), u(9), 0.01), white, X(px, W), u(4.5), 0);
      K.put(rbox(u(2), u(9.2), u(9.2), 0), rose_, X(px, W), u(4.5), 0);
      K.put(rbox(u(9.2), u(2), u(9.2), 0), rose_, X(px, W), u(4.5), 0);
      K.put(cyl(u(0.25), u(4), u(0.25), 4), K.gloss('#e8e8ec'), X(px, W), u(10), 0);
    }
    // the frame the balloons are tied to, then the hearts, turned a little this way and that
    const pts = HEARTS.map(([i, j]) => new L.THREE.Vector3(X(i, W), u(j), -u(1.5)));
    K.put(new L.THREE.TubeGeometry(new L.THREE.CatmullRomCurve3(pts), 40, u(0.5), 6), white, 0, 0, 0);
    HEARTS.forEach(([i, j, c], n) => K.put(heart(L, u(9), u(3.2)), K.gloss(c), X(i, W), u(j), (n % 2 ? 1 : -0.4) * u(1.6), (n % 3 - 1) * 0.25, 0, ((n * 7) % 5 - 2) * 0.06));
  },

  champagnetable(K, s, W, D, L) {
    const { lathe, cyl, rbox } = L, white = K.gloss(WHITE);
    // the clothed table, a blush runner over it and down its front
    K.put(lathe([[u(12), 0], [u(11.5), u(10)], [u(10.5), u(26)], [u(10.5), u(28)], [u(11), u(29)], [0.001, u(29)]], 24), K.cloth(WHITE), 0, 0, 0);
    K.put(cyl(u(11), u(2), u(11), 24), white, 0, u(28), 0);
    K.put(rbox(u(6), u(0.4), u(22), 0), K.cloth(BLUSH), 0, u(29.2), 0);
    const sh = new L.THREE.Shape([[-3, 0], [3, 0], [3, -14], [0, -17], [-3, -14]].map(([a, b]) => new L.THREE.Vector2(u(a), u(b))));
    K.put(new L.THREE.ExtrudeGeometry(sh, { depth: u(0.4), bevelEnabled: false }), K.cloth(BLUSH), 0, u(29), u(11), 0, -0.04);
    // the silver bucket of ice, the bottle in it, its gold foil
    K.put(lathe([[u(5), 0], [u(5.5), 0], [u(6), u(15)], [u(6.3), u(15.5)], [u(5.6), u(15.5)], [u(5.2), u(2)], [0.001, u(2)]], 20), K.metal(SILVER), X(12.5), u(29), -u(1));
    for (let n = 0; n < 6; n++) K.put(rbox(u(2.2), u(2), u(2.2), 0), K.gloss('#e8f8ff'), X(12.5) + Math.cos(n * 1.1) * u(3.6), u(43.6), -u(1) + Math.sin(n * 1.1) * u(3.6), n);
    K.put(lathe([[u(3), 0], [u(3), u(17)], [u(2), u(19)], [u(1), u(21)], [u(1), u(27)], [0.001, u(27)]], 14), K.gloss(BOTTLE), X(12.5), u(33), -u(1), 0, 0, -0.08);
    K.put(cyl(u(1.5), u(4), u(1.5), 10), K.metal(GOLD), X(12.5) + u(2.2), u(59), -u(1), 0, 0, -0.08);
    // two flutes of champagne
    for (const px of [23, 26.5]) {
      K.put(lathe([[u(1.5), 0], [u(1.5), u(0.6)], [u(0.4), u(1)], [u(0.4), u(7)], [u(1.5), u(8)], [u(1.6), u(15)], [u(1.4), u(15)]], 12), K.glass(), X(px), u(29), u(3));
      K.put(lathe([[0.001, u(9)], [u(1.3), u(9.2)], [u(1.4), u(13.5)], [0.001, u(13.5)]], 12), K.gloss('#f0dca0'), X(px), u(29), u(3));
    }
  },

  petalgarland(K, s, W, D, L) {
    const j = (i) => 14 + Math.sin(Math.max(0, Math.min(58, i - 3)) / 58 * Math.PI) * 10;
    const zf = (i) => 0.02 + Math.sin(Math.max(0, Math.min(58, i - 3)) / 58 * Math.PI) * 0.06, sage = K.cloth(SAGE);
    // the garland's green rope, strands of petals hanging from it
    cord(K, L, sage, Array.from({ length: 15 }, (_, n) => { const i = 3 + n * 58 / 14; return [i, j(i), zf(i)]; }), 1.2);
    for (const i of [16, 32, 48]) {
      cord(K, L, K.cloth(L.tone(SAGE, 0.75)), [[i, j(i) + 2, zf(i)], [i, j(i) + 14, zf(i) * 0.8], [i, j(i) + 26, zf(i) * 0.6]], 0.3);
      for (let k = 0; k < 4; k++) K.put(L.ball(u(1.6), 8, 6).scale(1, 0.75, 0.4), K.cloth([ROSE, BLUSH][k % 2]), WX(i + (k % 2 ? 1 : -1), W), WY(j(i) + 7 + k * 5), zf(i) * 0.7 + u(0.6));
    }
    // leaves and roses along it, a blush bow at each hook
    for (let i = 5; i <= 59; i += 3) leaf(K, L, sage, WX(i, W), WY(j(i) + 1), zf(i) + u(1.2), u(2), u(1.3), -0.9 + (i % 2) * 1.8);
    for (let i = 7, n = 0; i <= 57; i += 5, n++) rose(K, L, [ROSE, WHITE, BLUSH][n % 3], WX(i, W), WY(j(i)), zf(i) + u(1.6), u(n % 3 ? 2.2 : 2.8));
    for (const i of [4, 60]) bow(K, L, K.cloth(BLUSH), WX(i, W), WY(14), u(1.6));
  },

  photobackdrop(K, s, W, D, L) {
    const { THREE } = L, gold = K.metal(GOLD);
    // the board of roses: its painting behind, the nearest blooms raised off it
    K.put(L.rbox(u(54), u(68), u(1.6), 0), K.plain(L.tone(BLUSH, 0.75)), 0, WY(44), u(0.8));
    pic(K, L, [5, 10, 59, 78], u(1.62));
    for (let r = 0; r < 8; r++) for (let c = 0; c < 10; c++) {
      const i = 7 + c * 5.6 + (r % 2) * 2.8, jj = 13 + r * 9.2;
      if (i > 57 || (r + c) % 2) continue;
      K.put(L.ball(u(2.7), 8, 6).scale(1, 1, 0.6), K.cloth([WHITE, BLUSH, ROSE, IVORY][(r * 3 + c) % 4]), WX(i, W), WY(jj), u(2.4));
    }
    // the warm neon heart
    const pts = heartGeo(L, u(30), 0).getPoints(12).slice(0, -1).map(p => new THREE.Vector3(WX(32, W) + p.x, WY(46) + p.y, u(3.6)));
    K.put(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 64, u(1), 6, true), K.glow('#ffd890'), 0, 0, 0);
    // the gold frame
    for (const box of [[1, 6, 63, 10], [1, 78, 63, 82], [1, 10, 5, 78], [59, 10, 63, 78]]) bar(K, L, gold, box, u(3.2));
  },

  /* ----- summer festival ----- */
  shavedice(K, s, W, D, L) {
    const { rbox, cyl, lathe, blob, torus } = L, cedar = K.wood(CEDAR), red = K.gloss(VERMIL), iron = K.metal(IRON);
    // the little table, its ICE flag hung on the front
    for (const [lx, lz] of L.legsAt(u(21), u(20), 0)) K.put(cyl(u(1.5), u(24), u(1.5), 10), cedar, lx, u(12), lz);
    for (const z of [-u(10), u(10)]) K.put(rbox(u(21), u(2), u(1.5), 0), K.wood(L.tone(CEDAR, 0.75)), 0, u(7), z);
    K.put(rbox(u(30), u(3), u(24), 0.008), cedar, 0, u(25.5), 0);
    K.put(rbox(u(12), u(10), u(0.4), 0), K.cloth('#f8f8f4'), 0, u(18), u(12.2));
    K.put(new L.THREE.PlaneGeometry(u(12), u(10)), K.pic(iceFlag()), 0, u(18), u(12.42));
    // the red frame: its base, posts and housing, a gold band on it
    K.put(rbox(u(22), u(2), u(14), 0.006), red, 0, u(28), 0);
    for (const px of [7.5, 24.5]) K.put(cyl(u(1.5), u(33), u(1.5), 10), red, X(px), u(45.5), 0);
    K.put(rbox(u(22), u(5), u(12), 0.01), red, 0, u(63.5), 0);
    K.put(rbox(u(18), u(1), u(0.4), 0), K.metal(GOLD), 0, u(63.5), u(6.1));
    // the bowl of strawberry ice, the blade plate, the block of ice and its presser
    K.put(lathe([[u(3.6), 0], [u(6), u(6)], [u(5.6), u(6)], [u(3.4), u(0.4)], [0.001, u(0.4)]], 16), K.glass(), 0, u(30), u(1));
    K.put(blob(u(11), u(8.4), u(10), 0.6, 0.6, 14), K.gloss('#f8fcff'), 0, u(38.6), u(1));
    K.put(blob(u(9.2), u(5), u(8.6), 0.6, 0.6, 12), K.gloss('#e83a4a'), 0, u(41.6), u(1.2));
    K.put(rbox(u(14), u(2), u(12), 0.004), iron, 0, u(48), 0);
    K.put(rbox(u(10.5), u(8), u(8.5), 0.01), K.gloss('#d8f4ff'), 0, u(53.5), 0);
    K.put(rbox(u(12), u(9), u(10), 0.012), K.glass(), 0, u(53.5), 0);
    K.put(rbox(u(12), u(2), u(10), 0.004), iron, 0, u(60), 0);
    // the crank: its shaft, wheel and spokes, the wooden handle
    K.put(cyl(u(1), u(6), u(1), 8), iron, 0, u(69), 0);
    K.put(torus(u(6), u(0.75), TAU, 20), iron, 0, u(76), 0);
    K.put(rbox(u(12), u(1), u(1), 0), iron, 0, u(76), 0);
    K.put(rbox(u(1), u(12), u(1), 0), iron, 0, u(76), 0);
    K.put(cyl(u(1), u(5), u(1), 8), cedar, X(22), u(80.5), u(1.2));
  },

  karpscoop(K, s, W, D, L) {
    const { rbox, torus, cyl } = L, tub = K.gloss(TUB), rim = K.gloss(L.tone(TUB, 1.2));
    // the tub: its floor, walls, a rolled rim, white waves along its front
    K.put(rbox(u(58), u(1), u(24), 0), K.gloss(L.tone(WATER, 0.8)), 0, u(0.5), 0);
    for (const z of [-u(13), u(13)]) K.put(rbox(u(60), u(20), u(2), 0.006), tub, 0, u(10), z);
    for (const px of [3, 61]) K.put(rbox(u(2), u(20), u(24), 0.006), tub, X(px, W), u(10), 0);
    for (const z of [-u(13), u(13)]) K.put(rbox(u(62), u(3), u(3), 0.012), rim, 0, u(20.5), z);
    for (const px of [2.5, 61.5]) K.put(rbox(u(3), u(3), u(26), 0.012), rim, X(px, W), u(20.5), 0);
    for (let i = 0; i < 10; i++) K.put(torus(u(3), u(0.4), Math.PI, 8), K.gloss(L.tone(TUB, 1.5)), X(5 + i * 6, W), u(9), u(14.05));
    // the water, two Magikarp under it showing their fins, one leaping out
    K.put(new L.THREE.PlaneGeometry(u(56), u(22)).rotateX(-Math.PI / 2), K.M('glass', WATER, { key: 'tub' }), 0, u(18.6), 0);
    karp(K, L, X(16, W), u(15.5), -u(4), 1, 0.4);
    karp(K, L, X(28, W), u(15), u(5), 1, -0.3);
    karp(K, L, X(40, W), u(33), 0, 1, 0, -0.18);
    // paper scoops resting on the rim
    for (const [px, sg] of [[9, 1], [55, -1]]) {
      K.put(torus(u(4), u(0.6), TAU, 16), K.gloss('#f4f4f0'), X(px, W), u(30), u(12), 0, -0.3);
      K.put(cyl(u(3.4), u(0.2), u(3.4), 16).rotateX(Math.PI / 2), K.gloss('#fbfbf6'), X(px, W), u(30), u(12), 0, -0.3);
      rod(K, L, K.gloss(VERMIL), [X(px + sg * 3, W), u(27), u(12.6)], [X(px + sg * 9, W), u(22), u(13.5)], u(0.6));
    }
  },

  windchimestand(K, s, W, D, L) {
    const { rbox, cyl, torus, lathe, ball } = L, cane = K.gloss(BAMBOO), dark = K.gloss(L.tone(BAMBOO, 0.75)), ink = K.gloss(INK);
    // two bamboo uprights on their feet, nodes along them, the top bar
    for (const px of [6, 26]) K.put(rbox(u(10), u(3), u(14), 0.006), dark, X(px), u(1.5), 0);
    for (const px of [5.5, 26.5]) {
      K.put(cyl(u(1.5), u(79), u(1.5), 10), cane, X(px), u(42.5), 0);
      for (const j of [30, 56]) K.put(torus(u(1.6), u(0.4), TAU, 10).rotateX(Math.PI / 2), dark, X(px), u(j), 0);
    }
    K.put(cyl(u(1.5), u(30), u(1.5), 10).rotateZ(Math.PI / 2), cane, 0, u(83.5), 0);
    // three furin: a string, the glass bell, its painted rim and goldfish, the clapper and a paper strip
    for (const [i, top, tint, strip] of [[10, 74, '#bfe6f8', VERMIL], [16, 70, '#f8c8d8', INDIGO], [22, 74, '#d8f0c0', '#e8b830']]) {
      K.put(cyl(u(0.25), u(82 - top), u(0.25), 4), ink, X(i), u((82 + top) / 2), 0);
      K.put(lathe([[0.001, 0], [u(2.5), -u(0.6)], [u(4), -u(2.2)], [u(4.5), -u(4.5)], [u(4.5), -u(9)], [u(4.1), -u(9)], [u(4.1), -u(4.6)], [u(3.6), -u(2.6)], [0.001, -u(1.2)]].reverse(), 16), K.gloss(tint), X(i), u(top), 0);
      K.put(torus(u(4.5), u(0.45), TAU, 16).rotateX(Math.PI / 2), K.gloss(L.tone(tint, 0.8)), X(i), u(top - 9), 0);
      K.put(ball(u(0.9), 6, 4), K.gloss(VERMIL), X(i + 1), u(top - 5), u(4.4));
      K.put(cyl(u(0.2), u(6), u(0.2), 4), ink, X(i), u(top - 11), 0);
      K.put(ball(u(0.8), 6, 4), ink, X(i), u(top - 8.5), 0);
      K.put(rbox(u(3), u(14), u(0.3), 0), K.cloth(strip), X(i), u(top - 21), 0);
    }
  },

  fireworkmortar(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, cedar = K.wood(CEDAR);
    // three mortar tubes, their mouths dark, a paper band round each
    for (const [cx, top, c, z] of [[9.5, 40, VERMIL, u(2)], [23.5, 42, '#e8b830', u(2)], [16.5, 48, INDIGO, -u(3)]]) {
      K.put(cyl(u(3.5), u(top - 14), u(3.5), 16), K.gloss(c), X(cx), u((top + 14) / 2), z);
      K.put(cyl(u(2.9), u(0.4), u(2.9), 14), K.plain('#2a2020'), X(cx), u(top) + 0.001, z);
      K.put(cyl(u(3.6), u(2), u(3.6), 16), K.gloss('#f4f0e0'), X(cx), u(top - 5), z);
    }
    // the crate they stand in, its slats
    K.put(rbox(u(26), u(16), u(22), 0.008), cedar, 0, u(8), 0);
    for (const j of [11, 6]) K.put(rbox(u(24.5), u(0.8), u(0.3), 0), K.wood(L.tone(CEDAR, 0.6)), 0, u(j), u(11.05));
    // the fuse, lit
    K.put(new L.THREE.TubeGeometry(new L.THREE.CatmullRomCurve3([[18, 16, 4], [24, 19, 9], [28, 22, 10.5], [29.5, 27, 10.5]].map(([i, j, z]) => new L.THREE.Vector3(X(i), u(j), u(z)))), 16, u(0.5), 5), K.plain('#5a4a30'), 0, 0, 0);
    K.put(ball(u(1.6), 10, 8), K.glow(SPARK), X(29.5), u(28), u(10.5));
    for (let a = 0; a < 6; a++) K.put(cyl(u(0.25), u(2), u(0.1), 4).translate(0, u(2.6), 0), K.glow('#fff4c0'), X(29.5), u(28), u(10.5), 0, 0, a * Math.PI / 3);
  },

  festivaldrum(K, s, W, D, L) {
    const { THREE, rbox, cyl, lathe, ball } = L, dark = K.wood(L.tone(CEDAR, 0.75));
    // two X-frame stands, a stretcher between them, cradles on top
    for (const cx of [16, 48]) for (const z of [-u(8), u(8)]) {
      rod(K, L, dark, [X(cx - 6, W), 0, z], [X(cx + 6, W), u(27), z], u(1.4));
      rod(K, L, dark, [X(cx + 6, W), 0, z], [X(cx - 6, W), u(27), z], u(1.4));
    }
    for (const z of [-u(8), u(8)]) K.put(rbox(u(40), u(2.5), u(2.5), 0.004), dark, 0, u(12.75), z);
    for (const cx of [16, 48]) K.put(rbox(u(14), u(2), u(18), 0.004), dark, X(cx, W), u(26), 0);
    // the barrel lying along x, its heads at the ends tacked round
    K.put(lathe(Array.from({ length: 9 }, (_, n) => { const y = (n / 8 - 0.5) * 46; return [u(13 + 2 * Math.cos(y / 23 * Math.PI / 2)), u(y)]; }), 28).rotateZ(Math.PI / 2), K.wood(CEDAR), 0, u(41), 0);
    for (const px of [8, 56]) K.put(cyl(u(13), u(2), u(13), 28).rotateZ(Math.PI / 2), K.gloss('#f4ecd8'), X(px, W), u(41), 0);
    for (const px of [9.5, 54.5]) for (let n = 0; n < 16; n++) { const a = n / 16 * TAU; K.put(ball(u(0.6), 6, 4), K.metal(IRON), X(px, W), u(41) + Math.cos(a) * u(13.2), Math.sin(a) * u(13.2)); }
    // its red rope laced end to end round it
    const pts = [];
    for (let k = 0; k < 10; k++) {
      const a = k / 10 * TAU, b = (k + 1) / 10 * TAU, from = k % 2 ? 54 : 10, to = k % 2 ? 10 : 54;
      pts.push(new THREE.Vector3(X(from, W), u(41) + Math.cos(a) * u(13.4), Math.sin(a) * u(13.4)));
      pts.push(new THREE.Vector3(X((from + to) / 2, W), u(41) + Math.cos((a + b) / 2) * u(15.3), Math.sin((a + b) / 2) * u(15.3)));
    }
    K.put(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 100, u(0.7), 5, true), K.cloth(VERMIL), 0, 0, 0);
    // two sticks across its top
    for (const [a, z] of [[0.18, -u(2)], [-0.25, u(2)]]) K.put(cyl(u(1), u(17), u(0.9), 8).rotateZ(Math.PI / 2 + a), K.wood(L.tone(CEDAR, 1.25)), X(33, W), u(58.5), z);
  },

  fanrack(K, s, W, D, L) {
    const { rbox, cyl, torus, ball } = L, handle = K.wood(L.tone(CEDAR, 1.25)), white = K.gloss('#ffffff');
    K.put(rbox(u(20), u(10), u(10), 0.01), K.wood(CEDAR), 0, u(5), 0);
    // the five fans splayed from the rack, each on its handle, its paper and rim
    const FANS = [[6, 44, '#f4f4f0', u(1.5)], [26, 44, '#7ac8f0', u(1.5)], [11, 54, INDIGO, 0], [21, 54, '#f8b8c8', 0], [16, 58, '#283058', -u(1.5)]];
    for (const [i, j, c, z] of FANS) {
      rod(K, L, handle, [X(16), u(9), 0], [X(i), u(j), z], u(0.7));
      K.put(cyl(u(6.2), u(0.5), u(6.2), 16).rotateX(Math.PI / 2), K.gloss(c), X(i), u(j), z + u(0.3));
      K.put(torus(u(6.2), u(0.45), TAU, 16), K.gloss(L.tone(c, 0.75)), X(i), u(j), z + u(0.3));
    }
    const f = (i, j, z) => [X(i), u(j), z + u(0.75)];
    // a red sun; three white waves; a sakura; a Magikarp; a firework burst
    K.put(cyl(u(3), u(0.3), u(3), 14).rotateX(Math.PI / 2), K.gloss(VERMIL), ...f(6, 44, u(1.5)));
    for (const k of [2, 0, -2]) K.put(torus(u(3), u(0.4), Math.PI * 0.8, 8), white, ...f(11, 52 + k, 0), 0, 0, Math.PI * 0.1);
    for (let a = 0; a < 5; a++) K.put(ball(u(1.4), 6, 4).scale(1, 1, 0.3), white, X(21 + Math.cos(a * 1.26) * 1.8), u(54 - Math.sin(a * 1.26) * 1.8), u(0.75));
    K.put(ball(1, 8, 6).scale(u(3), u(1.8), u(0.6)), K.gloss(KARP), ...f(26, 44, u(1.5)));
    K.put(cyl(0.001, u(3), u(2), 6).rotateZ(Math.PI / 2).scale(1, 1, 0.3), K.gloss(KARP), ...f(29.5, 44, u(1.5)));
    for (let a = 0; a < 8; a++) K.put(rbox(u(3), u(0.8), u(0.3), 0).translate(u(2.4), 0, 0), K.gloss(a % 2 ? '#e8b830' : VERMIL), ...f(16, 58, -u(1.5)), 0, 0, a * Math.PI / 4);
  },

  watermelonstand(K, s, W, D, L) {
    const { THREE, rbox, cyl, ball, torus } = L, cedar = K.wood(CEDAR);
    // the low stand
    for (const [lx, lz] of L.legsAt(u(21), u(18), 0)) K.put(cyl(u(1.5), u(14), u(1.5), 10), cedar, lx, u(7), lz);
    K.put(rbox(u(28), u(3), u(22), 0.008), cedar, 0, u(15.5), 0);
    // the whole melon, its dark stripes and stem
    K.put(ball(u(10), 20, 14), K.gloss(MELON), X(12), u(27), -u(1));
    for (const a of [-1.24, -0.49, 0.49, 1.24]) K.put(torus(u(10.05), u(0.7), TAU, 20), K.gloss(MELOND), X(12), u(27), -u(1), a);
    K.put(cyl(u(0.5), u(2), u(0.5), 6), K.wood('#6a5a2a'), X(12), u(37.5), -u(1));
    // a slice stood up: rind, white and red, a few seeds on its face
    for (const [r, t, c] of [[7, 4, MELOND], [6.4, 4.3, '#f4f0d0'], [5.8, 4.6, '#e8484a']]) {
      K.put(new THREE.CylinderGeometry(u(r), u(r), u(t), 16, 1, false, Math.PI / 2, Math.PI).rotateX(Math.PI / 2), K.gloss(c), X(25), u(17), u(2));
    }
    for (const [i, j] of [[22, 19], [25, 21], [28, 19], [24, 18.5], [26.5, 18]]) K.put(ball(u(0.5), 6, 4).scale(1, 1.4, 0.5), K.gloss(INK), X(i + 0.5), u(j - 0.5), u(4.35));
  },

  mosquitopig(K, s, W, D, L) {
    const { THREE, lathe, cyl, ball } = L, pig = K.gloss(PIG);
    // four stubby feet, the barrel body lying with its snout open to the front
    for (const [lx, lz] of L.legsAt(u(11), u(8), 0)) K.put(cyl(u(1.5), u(4), u(1.5), 8), K.gloss(L.tone(PIG, 0.75)), lx, u(2), lz);
    K.put(lathe([[0.001, -u(10)], [u(5), -u(9.6)], [u(8.5), -u(7)], [u(10), -u(3)], [u(10), u(3)], [u(8.5), u(7)], [u(6.6), u(9)], [u(6.2), u(9.3)], [u(5.4), u(8.6)]], 20).rotateX(Math.PI / 2).scale(1.1, 1, 1), pig, 0, u(13), 0);
    K.put(cyl(u(5.6), u(0.4), u(5.6), 18).rotateX(Math.PI / 2), K.plain('#2a1a14'), 0, u(13), u(7.6));
    // the coil smouldering inside, its ember
    const spiral = []; for (let a = 0; a < 14; a += 0.5) { const r = 0.6 + a * 0.28; spiral.push(new THREE.Vector3(X(16 + Math.cos(a) * r), u(13 - Math.sin(a) * r), u(8))); }
    K.put(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spiral), 40, u(0.4), 4), K.plain('#5a7a4a'), 0, 0, 0);
    K.put(ball(u(1.2), 8, 6), K.glow('#ff8030'), X(19.5), u(11), u(8.2));
    // its ears, eyes and curly tail
    for (const sx of [-1, 1]) {
      K.put(cyl(0.001, u(4.5), u(2.4), 8).scale(1, 1, 0.6), K.gloss(L.tone(PIG, 0.75)), sx * u(7), u(23.5), u(3), 0, 0, -sx * 0.35);
      K.put(ball(u(0.8), 6, 4), K.gloss(INK), sx * u(7), u(19), u(6.4));
    }
    K.put(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[0, 14, -10], [1.5, 16, -11.5], [0, 18, -12.2], [-1.2, 16.5, -11.8]].map(([a, b, c]) => new THREE.Vector3(u(a), u(b), u(c)))), 12, u(0.5), 5), pig, 0, 0, 0);
  },

  ramunetub(K, s, W, D, L) {
    const { lathe, cyl, rbox, ball } = L, iron = K.metal(IRON);
    // the wooden tub, its iron bands, heaped with ice
    K.put(lathe([[u(12), 0], [u(12), u(20)], [u(11), u(20)], [u(11), u(1)], [0.001, u(1)]], 24), K.wood(CEDAR), 0, 0, 0);
    for (const j of [16, 5]) K.put(cyl(u(12.25), u(2), u(12.25), 24, true), iron, 0, u(j), 0);
    K.put(cyl(u(11), u(0.6), u(11), 20), K.gloss('#d8f0ff'), 0, u(20.6), 0);
    for (let n = 0; n < 8; n++) { const a = n * 0.8, r = u(3 + (n % 3) * 2.6); K.put(rbox(u(3), u(2), u(3), 0), K.gloss('#f4fcff'), Math.cos(a) * r, u(21.8 + (n % 2)), Math.sin(a) * r, a); }
    // four bottles of ramune chilling, a marble in each neck, blue and pink caps
    for (const [i, top, cap, z] of [[9, 36, '#3a7ad8', u(3)], [21, 35, '#f06a9a', u(3)], [13, 40, '#f06a9a', -u(2)], [17.5, 38, '#3a7ad8', -u(4)]]) {
      K.put(lathe([[u(2), u(10)], [u(2), u(top - 7)], [u(1.2), u(top - 5)], [u(1.5), u(top - 3.5)], [u(1.3), u(top - 3)], [0.001, u(top - 3)]], 12), K.gloss(TEAL), X(i), 0, z);
      K.put(ball(u(1.2), 8, 6), K.gloss('#e8fcff'), X(i), u(top - 5.5), z + u(0.4));
      K.put(cyl(u(1.5), u(3), u(1.5), 10), K.gloss(cap), X(i), u(top - 1.5), z);
    }
    // a towel over the front rim, a blue stripe on it
    K.put(rbox(u(6), u(0.8), u(4), 0.003), K.cloth('#f8f8f4'), X(6), u(20.6), u(5));
    K.put(rbox(u(6), u(11), u(0.8), 0.003), K.cloth('#f8f8f4'), X(6), u(16.5), u(7.4));
    K.put(rbox(u(6.1), u(1.5), u(0.9), 0), K.gloss('#3a7ad8'), X(6), u(17.25), u(7.4));
  },

  mikoshi(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, lacq = K.gloss(LACQ), gold = K.metal(GOLD), red = K.gloss(VERMIL);
    // two trestles, the carrying poles along them
    for (const px of [10, 54]) K.put(rbox(u(8), u(10), u(20), 0.006), K.wood(L.tone(CEDAR, 0.75)), X(px, W), u(5), 0);
    for (const z of [-u(7), u(7)]) K.put(cyl(u(2), u(64), u(2), 12).rotateZ(Math.PI / 2), K.wood(CEDAR), 0, u(12), z);
    // the black platform banded in gold, a red railing round it
    K.put(rbox(u(44), u(8), u(22), 0.008), lacq, 0, u(18), 0);
    for (const j of [21.25, 15.25]) K.put(rbox(u(44.4), u(1.5), u(22.4), 0), gold, 0, u(j), 0);
    for (const z of [-u(9.5), u(9.5)]) {
      K.put(rbox(u(40), u(1.5), u(1.2), 0), red, 0, u(26.25), z);
      for (let i = 13.75; i < 52; i += 6) K.put(rbox(u(1.5), u(4), u(1.2), 0), red, X(i, W), u(24), z);
    }
    for (const px of [12.6, 51.4]) K.put(rbox(u(1.2), u(1.5), u(19), 0), red, X(px, W), u(26.25), 0);
    // the shrine: red walls, black corner pillars, gold lattice doors
    K.put(rbox(u(32), u(21), u(16), 0.006), red, 0, u(36.5), 0);
    for (const px of [17, 47]) for (const z of [-u(7.6), u(7.6)]) K.put(rbox(u(2), u(21), u(2), 0), K.gloss('#1e1414'), X(px, W), u(36.5), z);
    K.put(rbox(u(18), u(18), u(0.8), 0.004), gold, 0, u(36), u(8.2));
    for (const j of [42, 38, 34, 30]) K.put(rbox(u(16), u(0.6), u(0.4), 0), K.metal(L.tone(GOLD, 0.75)), 0, u(j), u(8.7));
    K.put(rbox(u(1), u(18), u(0.4), 0), K.metal(L.tone(GOLD, 0.75)), 0, u(36), u(8.7));
    // the roof, flared at its eaves, gold along them, a crest on its front, the phoenix on top
    K.put(hipRoof(L, u(54), u(28), u(40), u(19), u(4)), lacq, 0, u(48), 0);
    K.put(hipRoof(L, u(40), u(19), u(4), u(2), u(14)), lacq, 0, u(52), 0);
    K.put(rbox(u(46), u(1.5), u(0.6), 0), gold, 0, u(48.75), u(13.6));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.put(cyl(0.001, u(4), u(1.2), 6), gold, sx * u(26), u(50.5), sz * u(13.5), 0, sz * 0.5, -sx * 0.6);
    K.put(cyl(u(3), u(0.6), u(3), 16).rotateX(Math.PI / 2), gold, 0, u(56), u(7.1), 0, -0.52);
    K.put(ball(1, 10, 8).scale(u(2.5), u(4), u(2.5)), gold, 0, u(71), 0);
    for (const sx of [-1, 1]) {
      const wing = new L.THREE.Shape([[0, 0], [sx * 7, 6], [sx * 2, -1]].map(([a, b]) => new L.THREE.Vector2(u(a), u(b))));
      K.put(new L.THREE.ExtrudeGeometry(wing, { depth: u(0.8), bevelEnabled: false }), gold, sx * u(1), u(71), -u(0.4));
    }
    K.put(cyl(0.001, u(3), u(1.5), 8), gold, 0, u(76.5), 0);
    // purple tassels from the eaves' front corners
    for (const px of [7, 57]) {
      K.put(cyl(u(0.4), u(10), u(0.4), 4), K.cloth('#9a3ac8'), X(px, W), u(46), u(12));
      K.put(cyl(u(0.8), u(4), u(1.2), 8), K.cloth('#9a3ac8'), X(px, W), u(39), u(12));
    }
  },

  sparklerbucket(K, s, W, D, L) {
    const { lathe, torus, rbox, cyl, ball } = L, zinc = K.metal('#b8c0c8'), grey = K.metal('#8a8a90');
    // the tin pail, its ribs and handle
    K.put(lathe([[u(5), 0], [u(5), u(0.5)], [u(7), u(18)], [u(7.4), u(18.5)], [u(6.6), u(18.5)], [u(4.6), u(1)], [0.001, u(1)]], 20), zinc, 0, 0, 0);
    for (const j of [12, 5]) K.put(torus(u(5 + 2 * j / 18 + 0.1), u(0.4), TAU, 20).rotateX(Math.PI / 2), K.metal(L.tone('#b8c0c8', 0.8)), 0, u(j), 0);
    K.put(torus(u(7), u(0.4), Math.PI, 12), K.metal(IRON), 0, u(18), 0);
    // senko sparklers standing in it, their paper ends coloured, one lit
    for (const [i, j, c, z] of [[11, 40, VERMIL, u(1)], [14, 44, '#3a7ad8', -u(1)], [17, 46, '#e8b830', 0], [20, 42, '#f06a9a', u(1.5)]]) {
      const a = [X(15 + (i - 15) * 0.3), u(17), 0], b = [X(i), u(j), z];
      rod(K, L, grey, a, b, u(0.3));
      const t = 6 / Math.hypot(i - (15 + (i - 15) * 0.3), j - 17);
      rod(K, L, K.cloth(c), [b[0] + (a[0] - b[0]) * t, b[1] + (a[1] - b[1]) * t, b[2] + (a[2] - b[2]) * t], b, u(0.6));
    }
    rod(K, L, grey, [X(20), u(17), u(1)], [X(26.5), u(44), u(2)], u(0.3));
    K.put(ball(u(1.6), 10, 8), K.glow(SPARK), X(26.5), u(45), u(2));
    for (let a = 0; a < 6; a++) K.put(cyl(u(0.25), u(2), u(0.1), 4).translate(0, u(3), 0), K.glow('#ffe080'), X(26.5), u(45), u(2), 0, 0, a * Math.PI / 3 + 0.3);
    // the candle on its iron dish, burning
    K.put(rbox(u(6), u(2), u(6), 0.004), K.metal(IRON), X(5), u(1), u(2));
    K.put(cyl(u(1.5), u(7), u(1.5), 10), K.gloss(WHITE), X(5), u(5.5), u(2));
    flame(K, L, X(5), u(9.6), u(2), u(4.8), u(1.4), SPARK, '#fff4c0');
  },

  summerbanner(K, s, W, D, L) {
    const { THREE, cyl, ball } = L;
    // its hook and hanging string, the bamboo rod
    K.put(ball(u(1), 8, 6), K.metal(IRON), WX(16, W), WY(4), 0.012);
    cord(K, L, K.gloss(INK), [[4, 11, u(2)], [16, 4, 0.02], [28, 11, u(2)]], 0.3);
    K.put(cyl(u(1.5), u(28), u(1.5), 10).rotateZ(Math.PI / 2), K.gloss(BAMBOO), WX(16, W), WY(11.5), u(2));
    // the banner itself, swaying a little off the wall, its painting on it, red tassels at its foot
    const g = new THREE.PlaneGeometry(u(20), u(60), 1, 8), pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin((pos.getY(i) / u(60) + 0.5) * Math.PI * 1.5) * u(0.6));
    g.computeVertexNormals();
    K.put(g, whole(K, L, g, [6, 13, 26, 73]), WX(16, W), WY(43), u(2));
    for (const px of [7, 25]) K.put(cyl(u(0.8), u(6), u(1.1), 8), K.cloth(VERMIL), WX(px, W), WY(76), u(2));
  },

  sudare(K, s, W, D, L) {
    const { cyl, rbox, lathe, ball } = L, cane = K.gloss(BAMBOO), dark = K.gloss(L.tone(BAMBOO, 0.75));
    // the top and bottom bars, the slats between, leaning off the wall to the foot
    K.put(cyl(u(1.5), u(60), u(1.5), 10).rotateZ(Math.PI / 2), dark, 0, WY(9.5), u(1.8));
    K.put(cyl(u(1.5), u(58), u(1.5), 10).rotateZ(Math.PI / 2), dark, 0, WY(71.5), u(2.6));
    for (let j = 11, n = 0; j < 70; j += 2, n++) K.put(cyl(u(0.8), u(56), u(0.8), 6).rotateZ(Math.PI / 2), n % 2 ? dark : cane, 0, WY(j + 0.8), u(1.5 + (j - 11) / 59 * 1.1));
    // the cords binding them, two red ties with tassels
    for (const i of [14.5, 32.5, 50.5]) K.put(rbox(u(1), u(59), u(0.5), 0), K.cloth('#6a4a2a'), WX(i, W), WY(40.5), u(2.9), 0, 0.019);
    for (const i of [20.5, 44.5]) {
      K.put(rbox(u(1), u(30), u(0.5), 0), K.cloth(VERMIL), WX(i, W), WY(26), u(2.9));
      K.put(cyl(u(1.2), u(6), u(1.8), 8), K.cloth(VERMIL), WX(i, W), WY(44), u(3));
    }
    // morning glories climbing the corner
    cord(K, L, K.cloth('#4a8a3a'), [[58, 70, u(3.2)], [55, 61, u(3.4)], [52, 52, u(3.2)]], 0.4);
    for (const [i, j] of [[57, 64], [53, 56]]) {
      leaf(K, L, K.cloth('#4a8a3a'), WX(i - 2, W), WY(j + 2), u(3.4), u(2.2), u(1.6), 0.4);
      K.put(lathe([[u(2.4), u(2.1)], [u(2.6), u(2)], [u(0.6), u(1)], [0.001, 0]], 12).rotateX(Math.PI / 2), K.gloss('#5a6ad8'), WX(i, W), WY(j), u(3.4));
      K.put(ball(u(0.9), 6, 4), K.gloss('#ffffff'), WX(i, W), WY(j), u(4.4));
    }
  },

  /* ----- the Lantern Festival ----- */
  skylantern(K, s, W, D, L) {
    const { cyl, lathe, torus, rbox, ball } = L, paper = K.glow(PAPER), wire = K.metal('#8a6a40');
    // the red stool it stands on
    K.put(cyl(u(7), u(8), u(7), 20), K.gloss(RUBY), 0, u(4), 0);
    // the paper lantern, a red wish-mark on it, its wire ring, cross and lit fuel cell
    K.put(lathe([[u(8), 0], [u(10), u(44)], [u(9.6), u(48)], [u(7), u(50)], [0.001, u(50.2)]], 20).scale(1, 1, 0.9), paper, 0, u(12), 0);
    K.put(cyl(u(4), u(0.4), u(4), 16).rotateX(Math.PI / 2), K.glow(LRED), 0, u(40), u(8.6), 0, -0.04);
    K.put(torus(u(4), u(0.4), TAU, 16), K.metal(GOLD), 0, u(40), u(8.7), 0, -0.04);
    K.put(torus(u(8), u(0.5), TAU, 20).rotateX(Math.PI / 2).scale(1, 1, 0.9), wire, 0, u(12.5), 0);
    for (const a of [0, Math.PI / 2]) K.put(rbox(u(15), u(0.4), u(0.4), 0), wire, 0, u(12.5), 0, a);
    K.put(ball(u(2.4), 10, 8), K.glow(LGLOW), 0, u(14), 0);
    // the wish tied to it
    rod(K, L, K.cloth(LRED), [X(22), u(12), u(4)], [X(24.5), u(6), u(4.5)], u(0.4));
    K.put(rbox(u(4), u(5), u(0.4), 0), K.gloss(LRED), X(25), u(3.5), u(4.5));
  },

  lanterntree(K, s, W, D, L) {
    const { THREE, lathe, cyl, ball } = L, bark = K.wood('#5a3a2a'), bloom = K.cloth(BLOSSOM), ink = K.gloss(INK);
    // the celadon pot and its soil
    K.put(lathe([[u(4), 0], [u(6), u(11)], [u(6.5), u(11.5)], [u(6.5), u(13)], [u(5.6), u(13)], [u(5.6), u(11.5)], [0.001, u(11)]], 16), K.gloss('#2a6a6a'), 0, 0, 0);
    K.put(cyl(u(5.5), u(0.5), u(5.5), 14), K.plain('#3a2a1a'), 0, u(11.6), 0);
    // the trunk and its branches
    const limb = (pts, r) => K.put(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(([i, j, z]) => new THREE.Vector3(X(i), u(j), u(z)))), 10, u(r), 6), bark, 0, 0, 0);
    limb([[16, 11, 0], [15.6, 26, 0.5], [15, 40, 0]], 1.5);
    limb([[15, 40, 0], [10, 52, -1], [6, 62, -2]], 1);
    limb([[15, 40, 0], [21, 54, 1], [26, 66, 2]], 1);
    limb([[15, 46, 0], [16.5, 64, -1], [16, 82, 0]], 0.9);
    limb([[8, 58, -1.5], [4, 66, -2]], 0.6);
    limb([[24, 62, 1.6], [29, 70, 2.5]], 0.6);
    // blossom along them
    for (const [i, j, z] of [[5, 64, -2], [9, 60, -1], [25, 67, 2], [28, 70, 2.5], [16, 80, 0], [14, 72, -0.5], [18, 66, -0.8], [22, 63, 1.5], [4, 67, -2], [12, 56, 1], [20, 58, -1.5]]) K.put(ball(u(2), 8, 6), bloom, X(i), u(j), u(z));
    // red lanterns hung from them
    for (const [i, j, z] of [[6, 56, -2], [26, 60, 2.5], [12, 66, 1], [20, 74, -1], [16, 46, 2]]) {
      K.put(cyl(u(0.2), u(3), u(0.2), 4), ink, X(i), u(j + 1.5), u(z));
      lantern(K, L, X(i), u(j), u(z), 3, 3.6, LRED);
    }
  },

  moonviewing(K, s, W, D, L) {
    const { THREE, rbox, cyl, lathe, ball } = L, hinoki = K.wood(HINOKI);
    // pampas grass in an indigo vase, its plumes
    K.put(lathe([[u(2), 0], [u(3), u(4)], [u(4), u(8)], [u(3), u(12)], [u(1.5), u(13)], [u(1.5), u(15)], [u(1.8), u(15.3)]], 14), K.gloss('#4a5a8a'), X(26), 0, -u(3));
    for (const [x1, y1, z] of [[20, 70, -5], [25, 80, -3], [29, 74, -1], [31, 62, -4]]) {
      const pts = [[26, 15, -3], [(26 + x1) / 2 + 0.6, (15 + y1) / 2, (z - 3) / 2], [x1, y1, z]].map(([i, j, k]) => new THREE.Vector3(X(i), u(j), u(k)));
      K.put(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, u(0.4), 4), K.gloss('#b8a878'), 0, 0, 0);
      for (let k = 0; k < 4; k++) K.put(ball(1, 8, 6).scale(u(1.4), u(2.2), u(1.2)), K.gloss('#ece0c4'), X(x1 - (x1 - 26) * k * 0.04), u(y1 - 2 - k * 2.4), u(z));
    }
    // the sanbo: its pierced stand, the rimmed tray
    K.put(rbox(u(16), u(14), u(14), 0.008), hinoki, X(12), u(7), u(1));
    K.put(cyl(u(4), u(0.3), u(4), 16).rotateX(Math.PI / 2), K.plain(L.tone(HINOKI, 0.5)), X(12), u(7), u(8.1));
    K.put(rbox(u(20), u(2), u(18), 0.006), hinoki, X(12), u(15), u(1));
    for (const z of [-u(7.5), u(9.5)]) K.put(rbox(u(20), u(2), u(1), 0), hinoki, X(12), u(17), z);
    for (const px of [2.5, 21.5]) K.put(rbox(u(1), u(2), u(18), 0), hinoki, X(px), u(17), u(1));
    // the dango piled three, two, one
    const dango = K.gloss('#f8f6ee');
    for (const i of [7, 12, 17]) for (const z of [-4, 1, 6]) K.put(ball(u(2.5), 10, 8), dango, X(i), u(20.4), u(z));
    for (const i of [9.5, 14.5]) for (const z of [-1.5, 3.5]) K.put(ball(u(2.5), 10, 8), dango, X(i), u(24.6), u(z));
    K.put(ball(u(2.5), 10, 8), dango, X(12), u(28.8), u(1));
  },

  chandelurestand(K, s, W, D, L) {
    const { THREE, lathe, cyl, ball } = L, iron = K.metal(IRON), black = K.gloss(INK);
    // the tripod and pole
    for (let n = 0; n < 3; n++) { const a = n / 3 * TAU + Math.PI / 2; rod(K, L, iron, [0, u(8), 0], [Math.cos(a) * u(10), 0, Math.sin(a) * u(8)], u(0.8)); }
    K.put(cyl(u(1), u(46), u(1), 8), iron, 0, u(29), 0);
    // Chandelure: its glass body, the violet flame inside, yellow eyes, the black cap and its flame
    K.put(ball(u(7.5), 20, 14), K.M('glass', '#c8b0e8', { key: 'globe' }), 0, u(58), 0);
    flame(K, L, 0, u(53.5), 0, u(8), u(3), PURPLE, LILAC);
    for (const sx of [-1, 1]) {
      K.put(ball(u(1.6), 8, 6).scale(1, 0.75, 0.4), K.gloss('#f8d030'), sx * u(3), u(59), u(6.8));
      K.put(ball(u(0.6), 6, 4), black, sx * u(3), u(59), u(7.4));
    }
    K.put(lathe([[u(6), 0], [u(5), u(2)], [u(3), u(5)], [u(1), u(7)], [0.001, u(7.2)]], 16), black, 0, u(64), 0);
    flame(K, L, 0, u(71.2), 0, u(7), u(2), PURPLE, LILAC);
    // four arms curling up, a cup and a flame on each
    for (const sx of [-1, 1]) for (const [pts, z] of [[[[6, 60], [11, 61], [13, 67]], u(2)], [[[4, 64], [7, 68], [8, 74]], -u(2)]]) {
      const path = pts.map(([i, j], n) => new THREE.Vector3(sx * u(i), u(j), n ? z : z * 0.3));
      K.put(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(path), 10, u(0.7), 5), black, 0, 0, 0);
      const [ti, tj] = pts[2];
      K.put(lathe([[u(0.6), 0], [u(1.5), u(1)], [u(1.6), u(1.5)]], 10), black, sx * u(ti), u(tj), z);
      flame(K, L, sx * u(ti), u(tj + 1), z, u(6), u(1.6), PURPLE, LILAC);
    }
  },

  lanternpond(K, s, W, D, L) {
    const { lathe, cyl, rbox, ball } = L, lacq = K.gloss(LACQ), sz = 0.46;
    // the stone basin and its water, lily pads and a lotus bud on it
    K.put(lathe([[u(30), 0], [u(31), u(18)], [u(31.5), u(21)], [u(28.5), u(21)], [u(28), u(19)], [u(28), u(6)], [0.001, u(6)]], 36).scale(1, 1, sz), K.gloss(STONE), 0, 0, 0);
    K.put(cyl(u(28.4), u(0.5), u(28.4), 36).scale(1, 1, sz), K.gloss(WATER), 0, u(19.5), 0);
    for (const [px, z] of [[8, 0], [56, -u(3)]]) K.put(cyl(u(5), u(0.4), u(5), 14).scale(1, 1, 0.8), K.gloss('#4a9a4a'), X(px, W), u(20), z);
    K.put(ball(u(1.8), 8, 6).scale(1, 1.2, 1), K.gloss(PINK), X(9, W), u(22), 0);
    // three floating lanterns: a wooden base, the lit paper box, its corner posts and roof, a red mark
    for (const [cx, w0, h0, z] of [[18, 8, 9, u(2)], [46, 8, 9, -u(2)], [32, 9, 11, 0]]) {
      const x = X(cx, W), y = u(22);
      K.put(rbox(u(w0 + 2), u(2), u(w0 + 2), 0.004), lacq, x, u(21), z);
      K.put(rbox(u(w0 - 0.4), u(h0), u(w0 - 0.4), 0.003), K.glow(PAPER), x, y + u(h0 / 2), z);
      for (const [dx, dz] of L.legsAt(u(w0), u(w0), u(0.5))) K.put(rbox(u(1), u(h0), u(1), 0), lacq, x + dx, y + u(h0 / 2), z + dz);
      K.put(rbox(u(w0 + 2), u(2), u(w0 + 2), 0.004), lacq, x, y + u(h0 + 1), z);
      K.put(ball(u(0.8), 6, 4).scale(1, 1, 0.4), K.glow(LRED), x, y + u(h0 / 2), z + u(w0 / 2 - 0.1));
    }
  },

  riddlerack(K, s, W, D, L) {
    const { rbox, cyl } = L, ruby = K.wood(RUBY), lacq = K.gloss(LACQ), ink = K.gloss(INK);
    // the frame: feet, posts, a low rail and the beam, gold-capped
    for (const px of [5, 59]) {
      K.put(rbox(u(10), u(3), u(16), 0.006), lacq, X(px, W), u(1.5), 0);
      K.put(rbox(u(3), u(83), u(3), 0.004), ruby, X(px, W), u(44.5), 0);
    }
    K.put(rbox(u(54), u(2), u(2), 0), ruby, 0, u(11), 0);
    K.put(rbox(u(64), u(4), u(5), 0.006), ruby, 0, u(86), 0);
    for (const px of [1.5, 62.5]) K.put(rbox(u(3), u(2), u(5.2), 0.004), K.metal(GOLD), X(px, W), u(89), 0);
    // four lanterns hung from it, a riddle slip on a thread under each
    for (const [i, slip] of [[15, '#ffffff'], [26, '#f8e070'], [38, '#f8c0c8'], [49, '#c8e8f8']]) {
      K.put(cyl(u(0.25), u(4), u(0.25), 4), ink, X(i, W), u(82), 0);
      lantern(K, L, X(i, W), u(80), 0, 6, 7, LRED, false);
      K.put(cyl(u(0.7), u(4), u(0.9), 6), K.cloth(L.tone(LRED, 0.75)), X(i, W), u(60), 0);
      K.put(cyl(u(0.2), u(2), u(0.2), 4), ink, X(i, W), u(57), 0);
      K.put(rbox(u(5), u(14), u(0.4), 0), K.gloss(slip), X(i, W), u(49), 0);
      K.put(new L.THREE.PlaneGeometry(u(5), u(10)), L.decal(riddle()), X(i, W), u(49), u(0.22));
    }
  },

  dragonlantern(K, s, W, D, L) {
    const { rbox, cyl, ball, blob, torus } = L, red = K.glow(LRED), gold = K.metal(GOLD);
    // three poles in their bases holding it up
    for (const px of [16, 36, 56]) {
      K.put(rbox(u(6), u(4), u(8), 0.004), K.gloss(LACQ), X(px, W), u(2), 0);
      K.put(cyl(u(1), u(46), u(1), 8), K.wood(CEDAR), X(px, W), u(27), 0);
    }
    // the body: lit red segments weaving, gold bands between them, gold spines along its back, the tail fin
    const zOf = (n) => Math.sin(n * 1.3) * u(3);
    DRAGON.forEach(([i, j, r], n) => {
      K.put(ball(u(r), 14, 10).scale(1, 1, 0.9), red, X(i, W), u(j), zOf(n));
      K.put(cyl(0.001, u(3), u(1.2), 6), gold, X(i, W), u(j + r + 1.5), zOf(n));
      const nx = DRAGON[n + 1];
      if (nx) K.put(torus(u(Math.min(r, nx[2]) * 0.85), u(0.5), TAU, 14).rotateY(Math.PI / 2), gold, X((i + nx[0]) / 2, W), u((j + nx[1]) / 2), (zOf(n) + zOf(n + 1)) / 2);
    });
    const tail = new L.THREE.Shape([[0, 2], [4, -4], [3.5, 7]].map(([a, b]) => new L.THREE.Vector2(u(a), u(b))));
    K.put(new L.THREE.ExtrudeGeometry(tail, { depth: u(1), bevelEnabled: false }), gold, X(60, W), u(52), zOf(7) - u(0.5));
    // the head: its lit skull, snout and jaw, teeth, eyes, gold horns, mane and whiskers
    for (const [i, j, r] of [[14, 62, 3], [17, 58, 3], [16, 54, 2.6]]) K.put(ball(u(r), 10, 8), gold, X(i, W), u(j), -u(1));
    K.put(blob(u(16), u(12), u(12), 0.6, 0.6, 16), red, X(10, W), u(58), 0);
    K.put(rbox(u(9), u(4), u(8), 0.02), red, X(5.5, W), u(57), u(0.5));
    K.put(rbox(u(7), u(2.5), u(7), 0.01), K.glow('#f8a040'), X(5.5, W), u(53.75), u(0.5));
    for (const i of [3, 5, 7]) K.put(ball(u(0.6), 6, 4), K.gloss('#ffffff'), X(i, W), u(55.5), u(4.1));
    for (const sz of [-1, 1]) {
      K.put(ball(u(2), 10, 8), K.gloss('#ffffff'), X(11, W), u(61), sz * u(4.6));
      K.put(ball(u(0.9), 6, 4), K.gloss(INK), X(10.5, W), u(61), sz * u(6.2));
      rod(K, L, gold, [X(11, W), u(64), sz * u(2)], [X(sz > 0 ? 18 : 14, W), u(sz > 0 ? 74 : 76), sz * u(3)], u(0.7));
      rod(K, L, gold, [X(2, W), u(sz > 0 ? 58 : 56), u(2)], [X(0.4, W), u(sz > 0 ? 63 : 52), u(2.4)], u(0.3));
    }
  },

  mooncaketable(K, s, W, D, L) {
    const { rbox, cyl, torus, lathe, ball } = L, lacq = K.gloss(LACQ), jade = K.gloss(JADE), crust = K.gloss(CRUST);
    // the low round table: legs, apron, its red top edged in gold
    for (const [lx, lz] of L.legsAt(u(21), u(18), 0)) K.put(rbox(u(3), u(14), u(3), 0.004), lacq, lx, u(7), lz);
    K.put(rbox(u(26), u(3), u(22), 0.004), lacq, 0, u(13.5), 0);
    K.put(cyl(u(15.8), u(4), u(15.8), 32).scale(1, 1, 0.9), K.gloss(RUBY), 0, u(17), 0);
    K.put(torus(u(15.8), u(0.4), TAU, 32).rotateX(Math.PI / 2).scale(1, 1, 0.9), K.metal(GOLD), 0, u(16), 0);
    // a plate of three mooncakes, their tops pressed with a pattern
    K.put(cyl(u(9), u(0.6), u(8), 24), K.gloss('#f4f4f0'), X(12), u(19.3), u(1));
    for (const [cx, y0, z] of [[8.5, 19.6, 2], [15.5, 19.6, 1], [12, 24.6, 1.5]]) {
      K.put(cyl(u(3.5), u(5), u(3.5), 16), crust, X(cx), u(y0 + 2.5), u(z));
      K.put(cyl(u(2.5), u(0.4), u(2.5), 14), K.gloss(L.tone(CRUST, 1.2)), X(cx), u(y0 + 5.1), u(z));
    }
    // the celadon teapot, its lid, spout and handle, and a cup
    K.put(lathe([[u(3), 0], [u(4.6), u(2)], [u(5), u(4.5)], [u(4.2), u(7.5)], [u(2), u(9)], [0.001, u(9)]], 16), jade, X(25), u(20), -u(2));
    K.put(cyl(u(2), u(1.5), u(2), 12), K.gloss(L.tone(JADE, 0.75)), X(25), u(29.75), -u(2));
    K.put(ball(u(1), 8, 6), K.gloss(L.tone(JADE, 0.75)), X(25), u(31), -u(2));
    K.put(new L.THREE.TubeGeometry(new L.THREE.CatmullRomCurve3([[21, 24.5], [19, 27], [17.5, 29.5]].map(([i, j]) => new L.THREE.Vector3(X(i), u(j), -u(2)))), 8, u(0.8), 6), jade, 0, 0, 0);
    K.put(torus(u(2.4), u(0.5), Math.PI, 10), K.gloss(L.tone(JADE, 0.75)), X(29.5), u(25), -u(2), 0, 0, -Math.PI / 2);
    K.put(lathe([[u(1.2), 0], [u(1.5), u(3)], [u(1.3), u(3)], [0.001, u(0.4)]], 12), jade, X(19.5), u(19.2), u(5));
  },

  lanternarch(K, s, W, D, L) {
    const { rbox, cyl, ball, torus } = L, ruby = K.gloss(RUBY), gold = K.metal(GOLD);
    // stone plinths, round red pillars, the crossbeam
    for (const px of [6, 58]) {
      K.put(rbox(u(10), u(6), u(12), 0.008), K.gloss(STONE), X(px, W), u(3), 0);
      K.put(cyl(u(2.5), u(68), u(2.5), 16), ruby, X(px, W), u(40), 0);
    }
    K.put(rbox(u(60), u(4), u(5), 0.006), K.wood(RUBY), 0, u(60), 0);
    // the blue plaque framed in gold, a gold ring on it
    K.put(rbox(u(14), u(8), u(1.5), 0.004), K.gloss('#2a4a6a'), 0, u(67), 0);
    for (const j of [70.6, 63.4]) K.put(rbox(u(14), u(0.8), u(1.7), 0), gold, 0, u(j), 0);
    K.put(torus(u(2), u(0.4), TAU, 12), gold, 0, u(67), u(0.8));
    // the lintel and the green tiled roof, its ridge and gold end-knobs, the eaves turned up at the corners
    K.put(rbox(u(64), u(4), u(7), 0.006), K.wood(RUBY), 0, u(74), 0);
    K.put(hipRoof(L, u(64), u(18), u(48), u(6), u(11)), K.gloss(TILE), 0, u(76.5), 0);
    K.put(rbox(u(52), u(2), u(2.5), 0.004), K.gloss(L.tone(TILE, 0.75)), 0, u(88.5), 0);
    for (const px of [6, 58]) K.put(ball(u(1.6), 8, 6), gold, X(px, W), u(90), 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.put(cyl(0.001, u(4), u(1), 6), K.gloss(TILE), sx * u(31), u(79), sz * u(8.5), 0, sz * 0.4, -sx * 0.7);
    // three red lanterns hung from the crossbeam, the middle one biggest
    for (const [i, rx, ry] of [[18, 4.5, 5.5], [32, 5.5, 6.5], [46, 4.5, 5.5]]) {
      K.put(cyl(u(0.25), u(2), u(0.25), 4), K.gloss(INK), X(i, W), u(59), 0);
      lantern(K, L, X(i, W), u(58), 0, rx, ry, LRED);
    }
  },

  moongate(K, s, W, D, L) {
    const { THREE, rbox, torus, ball } = L, dark = K.wood(DARKW);
    // the plastered wall, the round gate through it lined in dark wood
    const wall = new THREE.Shape([[-31, 4], [31, 4], [31, 79], [-31, 79]].map(([a, b]) => new THREE.Vector2(u(a), u(b))));
    wall.holes.push(new THREE.Path().absarc(0, u(41), u(24), 0, TAU, true));
    K.put(new THREE.ExtrudeGeometry(wall, { depth: u(6), bevelEnabled: false, curveSegments: 20 }).translate(0, 0, -u(3)), K.plain(PLASTER), 0, 0, 0);
    K.put(new THREE.CylinderGeometry(u(24), u(24), u(6.2), 40, 1, true).rotateX(Math.PI / 2), dark, 0, u(41), 0);
    for (const z of [-u(3.2), u(3.2)]) K.put(torus(u(25), u(1.25), TAU, 40), dark, 0, u(41), z);
    // its end posts, the stone footing, a grey tiled cap
    for (const px of [2.5, 61.5]) K.put(rbox(u(3), u(75), u(7), 0.004), dark, X(px, W), u(41.5), 0);
    K.put(rbox(u(64), u(4), u(10), 0.008), K.gloss(L.tone(STONE, 0.75)), 0, u(2), 0);
    K.put(hipRoof(L, u(64), u(12), u(56), u(3), u(7)), K.gloss('#5a6070'), 0, u(79), 0);
    K.put(rbox(u(60), u(2), u(3), 0.004), K.gloss(L.tone('#5a6070', 0.75)), 0, u(87), 0);
    // a plum branch along it in blossom
    cordS(K, L, K.wood('#4a3020'), [[4, 72], [14, 70], [22, 74], [30, 69]], u(3.8), 0.7);
    for (const [i, j] of [[8, 72], [13, 69], [18, 72], [24, 74], [28, 70], [21, 75]]) K.put(ball(u(1.8), 8, 6), K.cloth(BLOSSOM), X(i, W), u(j), u(4.2));
  },

  lotuslantern(K, s, W, D, L) {
    const { cyl, ball } = L;
    // the lily pad, the glow at the heart of the flower
    K.put(cyl(u(15), u(1.5), u(15), 32).scale(1, 1, 0.95), K.gloss('#3a8a3a'), 0, u(0.75), 0);
    K.put(cyl(u(14), u(0.5), u(14), 32).scale(1, 1, 0.95), K.gloss('#5aaa4a'), 0, u(1.7), 0);
    K.put(ball(u(4), 12, 8), K.glow('#fff0b0'), 0, u(20), 0);
    // three rings of lit petals, opening outwards
    for (const [n, r0, y0, tilt, w, l, c, off] of [[9, 5, 2.5, 1.0, 3.5, 8, PINK, 0], [6, 3, 6, 0.55, 3.2, 9, PALEPINK, 0.5], [3, 1, 9, 0.2, 3.2, 10, PALEPINK, 0.2]]) {
      for (let k = 0; k < n; k++) {
        const a = (k + off) / n * TAU, g = ball(1, 10, 8).scale(u(w), u(l), u(1.3)).translate(0, u(l), 0);
        K.put(g, K.glow(c), Math.sin(a) * u(r0), u(y0), Math.cos(a) * u(r0), a, tilt);
      }
    }
  },

  litwicktiers(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, dark = K.wood(DARKW), wax = K.gloss(WAX), eye = K.gloss('#f8d030');
    // the three steps
    K.put(rbox(u(30), u(6), u(22), 0.008), dark, 0, u(3), 0);
    K.put(rbox(u(22), u(7), u(15), 0.008), dark, 0, u(9.5), -u(2.5));
    K.put(rbox(u(12), u(7), u(9), 0.008), dark, 0, u(16.5), -u(5));
    // a Litwick on each: its waxy body, drips, two yellow eyes and a violet flame
    for (const [cx, base, h, w, z] of [[16, 20, 13, 6, -5], [11, 13, 11, 5, 2], [21, 13, 10, 5, 2], [6, 6, 10, 5, 7], [26, 6, 9, 5, 7]]) {
      const x = X(cx), y = u(base), r = u(w / 2);
      K.put(cyl(r, u(h), r, 12), wax, x, y + u(h / 2), u(z));
      K.put(ball(r, 12, 6).scale(1, 0.4, 1), wax, x, y + u(h), u(z));
      for (const [dx, len] of [[-0.6, 3], [0.55, 4.5]]) K.put(ball(1, 6, 4).scale(u(0.6), u(len / 2), u(0.6)), wax, x + dx * r * 1.6, y + u(h - len / 2), u(z) + r * 0.8);
      for (const sx of [-1, 1]) K.put(ball(u(0.7), 6, 4).scale(1, 1, 0.5), eye, x + sx * u(1.2), y + u(h * 0.55), u(z) + r);
      flame(K, L, x, y + u(h + 0.4), u(z), u(7.2), u(w * 0.35), PURPLE, LILAC);
    }
  },

  silklanterns(K, s, W, D, L) {
    const { cyl, ball, torus, lathe } = L, gold = K.metal(GOLD), cordm = K.cloth('#8a2020');
    const j = (i) => 12 + Math.sin(Math.max(0, Math.min(58, i - 3)) / 58 * Math.PI) * 8;
    const zf = (i) => 0.02 + Math.sin(Math.max(0, Math.min(58, i - 3)) / 58 * Math.PI) * 0.08;
    // the red cord between two eyes in the wall
    cord(K, L, cordm, Array.from({ length: 15 }, (_, n) => { const i = 3 + n * 58 / 14; return [i, j(i), zf(i)]; }), 0.45);
    for (const i of [3, 61]) K.put(torus(u(0.9), u(0.3), TAU, 10), K.metal('#d8dce4'), WX(i, W), WY(j(i)), 0.012);
    // two gold coin knots with tassels
    for (const i of [23, 41]) {
      K.put(cyl(u(2), u(0.5), u(2), 12).rotateX(Math.PI / 2), gold, WX(i, W), WY(j(i) + 3), zf(i) + u(0.4));
      K.put(cyl(u(0.6), u(5), u(0.8), 6), K.cloth(LRED), WX(i, W), WY(j(i) + 7.5), zf(i) + u(0.4));
    }
    // three big silk lanterns: caps, the lit body, its ribs, a knot and a tassel
    for (const i of [14, 32, 50]) {
      const t = j(i) + 3, x = WX(i, W), z = zf(i) + u(7.2);
      cord(K, L, cordm, [[i, j(i), zf(i)], [i, t, z]], 0.4);
      for (const jj of [t + 1, t + 20]) K.put(cyl(u(4.4), u(2), u(4.4), 14), gold, x, WY(jj), z);
      K.put(ball(u(8), 18, 12).scale(1, 9 / 8, 0.85), K.glow(LRED), x, WY(t + 10.5), z);
      for (const a of [Math.PI / 4, -Math.PI / 4]) K.put(torus(u(8.05), u(0.3), TAU, 24).scale(1, 9 / 8, 1).rotateY(a).scale(1, 1, 0.85), K.glow(L.tone(LRED, 0.75)), x, WY(t + 10.5), z);
      K.put(ball(u(1.5), 8, 6), gold, x, WY(t + 22.5), z);
      K.put(lathe([[0.001, -u(10)], [u(2.5), -u(10)], [u(1), 0]], 10), K.cloth(LRED), x, WY(t + 24), z);
    }
  },
};

/** A branch along painted points, at depth z, `r` units round (a floor piece's cord). */
function cordS(K, L, m, pts, z, r) {
  const W = K.p.w, curve = new L.THREE.CatmullRomCurve3(pts.map(([i, j]) => new L.THREE.Vector3(X(i, W), u(j), z)));
  K.put(new L.THREE.TubeGeometry(curve, 16, u(r), 5, false), m, 0, 0, 0);
}

