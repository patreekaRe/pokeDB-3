/* base-models-l.js  -  the newest earned sets, modelled from parts (the user's ask, 2026-10-16: "3D detailed CLEAN
   models ... optimise them"): Kenmatta's dojo pieces (js/base-furniture-dojo.js), the Safari set
   (js/base-furniture-safari.js), the Trainer set (js/base-furniture-trainer.js) and the Gym Leaders' signed posters
   (js/base-furniture-gym.js). Until now the floor ones were puffed up from their paintings and the wall ones hung flat.
   js/base-models-f.js's head says how a batch works; the wall pieces use js/base-models-w.js's frame (back at z 0).

   The Trainer set's live pieces read what they show from the piece's own `live()` (the trophies won, the Sky Pillar's
   lit floors, the leaders beaten) when the model is built, and js/base-3d.js builds a piece afresh with its room, so
   they keep up. Poké Balls and trophies are cheap shared shapes: nine balls on the rack, twelve cups in the case. */

import { rod, tube } from './base-models-kit.js';
import { X as WX, Y as WY, cut, bar, pic, round } from './base-models-w.js';
import { drape, rod as wallRod, cord, nail, star } from './base-models-w2.js';
import { GYM_LEADERS, posterKind } from './data/gym.js';

const u = (n) => n / 32;
const X = (n, W = 1) => n / 32 - W / 2;
const TAU = Math.PI * 2;
// Kenmatta's colours (js/base-furniture-dojo.js), the lodge's (-safari.js) and the Trainer set's
const OAK = '#6a4224', RED = '#c8382a', GOLD = '#e0b04a', INK = '#2a1a10';
const CANE = '#c8a058', KHAKI = '#d8c08a', GREEN = '#4a7a3a', DARK = '#5a3a1e', OLIVE = '#6a7a3a', TYRE = '#26262c';

const sheet = (w, h, draw) => { const c = new OffscreenCanvas(w, h); draw(c.getContext('2d'), w, h); return c; };
const pics = {};
const once = (key, make) => pics[key] || (pics[key] = make());

/* stitched or painted words, a clear canvas with only the letters */
const letters = (key, text, w, h, size, col, font = 'bold') => once(key, () => sheet(w, h, (g) => {
  g.font = `${font} ${size}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = col; g.fillText(text, w / 2, h / 2 + 2, w - 8);
}));

/* the expedition table's map: parchment, three lands, a river and a dotted route to an X */
const mapArt = () => once('map', () => sheet(256, 160, (g, w, h) => {
  g.fillStyle = '#f0e0b4'; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(138,90,48,0.18)'; g.fillRect(0, 0, w, 6); g.fillRect(0, h - 6, w, 6);
  for (const [x, y, rx, ry, c] of [[60, 70, 44, 34, '#9cc878'], [150, 96, 50, 30, '#d8b878'], [208, 50, 36, 28, '#9cc878'], [120, 40, 30, 18, '#7ab0d8']]) {
    g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, 0.3, 0, TAU); g.fill();
  }
  g.strokeStyle = '#5a98c8'; g.lineWidth = 4; g.beginPath(); g.moveTo(120, 50); g.bezierCurveTo(100, 90, 150, 110, 130, 160); g.stroke();
  g.strokeStyle = '#8a4a28'; g.lineWidth = 3; g.setLineDash([7, 6]);
  g.beginPath(); g.moveTo(40, 120); g.bezierCurveTo(80, 60, 170, 130, 200, 54); g.stroke(); g.setLineDash([]);
  g.strokeStyle = '#c83a2a'; g.lineWidth = 5; g.beginPath(); g.moveTo(192, 46); g.lineTo(208, 62); g.moveTo(208, 46); g.lineTo(192, 62); g.stroke();
}));

/* the jeep's door: the Safari Ball's outline and SAFARI, on a clear sticker */
const jeepDoor = () => once('jeep', () => sheet(340, 100, (g, w, h) => {
  g.fillStyle = '#f4f0e0'; g.beginPath(); g.arc(60, 50, 38, 0, TAU); g.fill();
  g.fillStyle = TYRE; g.fillRect(22, 45, 76, 10); g.beginPath(); g.arc(60, 50, 13, 0, TAU); g.fill();
  g.fillStyle = '#f4f0e0'; g.beginPath(); g.arc(60, 50, 7, 0, TAU); g.fill();
  g.font = 'bold 60px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#f4e8c4'; g.fillText('SAFARI', 220, 54, 220);
}));

/** A Poké Ball of radius r, cheap enough for nine on a rack: two 12x4 halves, its band and button. */
function ballL(K, L, x, y, z, r, top) {
  const { THREE, cyl } = L, dark = K.gloss(TYRE), white = K.gloss('#f4f4f0');
  K.put(new THREE.SphereGeometry(r, 12, 4, 0, TAU, 0, Math.PI / 2), K.gloss(top), x, y, z);
  K.put(new THREE.SphereGeometry(r, 12, 4, 0, TAU, Math.PI / 2, Math.PI / 2), white, x, y, z);
  K.put(cyl(r * 1.01, r * 0.14, r * 1.01, 12, true), dark, x, y, z);
  K.put(cyl(r * 0.34, r * 0.16, r * 0.34, 8).rotateX(Math.PI / 2), dark, x, y, z + r * 0.92);
  K.put(cyl(r * 0.2, r * 0.1, r * 0.2, 8).rotateX(Math.PI / 2), white, x, y, z + r);
}

/** A hurricane lantern, its tray's foot at (x, y, z), `s` its size (1 the Safari lantern's): tray, glass globe round a
    lit flame, four guard wires, the hood and the bail. */
function hurricane(K, L, x, y, z, s = 1) {
  const { lathe, cyl, ball, THREE } = L, k = (n) => u(n) * s, dark = K.gloss('#3a3a40');
  K.put(cyl(k(5), k(2), k(5.4), 12), dark, x, y + k(1), z);
  K.put(cyl(k(1.2), k(1.2), k(1.4), 8), dark, x, y + k(2.6), z);
  K.put(lathe([[1.4, 0], [1.2, 1], [1.5, 2.4], [0.9, 4], [0, 5.2]].map(([r, h]) => [k(r), k(h)]), 10), K.glow('#ffb040'), x, y + k(3.2), z);
  const globe = K.M('glass', '#ffe9a0', { key: 'globe' });
  globe.opacity = 0.42;
  K.put(lathe([[2.4, 0], [4, 1.5], [4.5, 4.5], [4.2, 7.5], [2.6, 10], [2.2, 10]].map(([r, h]) => [k(r), k(h)]), 12), globe, x, y + k(2), z);
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + i * Math.PI / 2;
    K.put(cyl(k(0.3), k(10), k(0.3), 4), dark, x + Math.cos(a) * k(4.8), y + k(7), z + Math.sin(a) * k(4.8));
  }
  K.put(lathe([[5, 0], [4.2, 1.6], [1.8, 2.4], [1.6, 3.2], [0, 3.2]].map(([r, h]) => [k(r), k(h)]), 12), dark, x, y + k(12), z);
  K.put(new THREE.TorusGeometry(k(2.2), k(0.4), 4, 8, Math.PI), dark, x, y + k(15.6), z);
  K.put(ball(k(0.9), 6, 4), dark, x, y + k(18), z);
}

/** A wall piece's round rim at painted (cx, cy): its cross-section [[r, z]...] (r in painted units) turned on a lathe. */
function rim(K, L, m, cx, cy, pts, seg = 32) {
  K.put(L.lathe(pts.map(([r, z]) => [u(r), z]), seg).rotateX(Math.PI / 2), m, WX(cx, K.p.w), WY(cy), 0);
}

/** A trophy cup's shapes, shared by the trophy case's twelve: the lathed cup on its stem and one handle. */
const cupParts = (L) => ({
  body: L.lathe([[0, 2], [1.2, 2.2], [0.9, 3], [0.9, 5.6], [1.8, 6.4], [3, 7], [5, 13], [4.3, 13], [2.6, 8.6], [0, 8.4]].map(([r, y]) => [u(r), u(y)]), 8),
  handle: new L.THREE.TorusGeometry(u(1.8), u(0.45), 4, 5, Math.PI),
  base: new L.THREE.BoxGeometry(u(8), u(2), u(6)),
});

const GYM_POSTERS = GYM_LEADERS.map(l => posterKind(l.id)).join(' ');

export const SHAPES = {
  // the dojo
  wingchun: { make: 'wingchun' },
  kensandbag: { make: 'kensandbag' },
  dojogong: { make: 'dojogong' },
  blackbelttrophy: { make: 'blackbelttrophy' },
  // the posters are painted alike: paper at X=x+3, Y=10, 26 x 54, a red pin at each top corner
  [`${GYM_POSTERS} kenposter`]: { make: 'poster', box: [3, 10, 29, 64], pins: [[6, 13, '#d84848'], [26, 13, '#d84848']] },
  dragonitemedal: { make: 'dragonitemedal' },
  // the Safari set
  safarilantern: { make: 'safarilantern' },
  acacia: { make: 'acacia' },
  ballrack: { make: 'ballrack' },
  expeditiontable: { make: 'expeditiontable' },
  rangertent: { make: 'rangertent' },
  safarijeep: { make: 'safarijeep' },
  rangerflag: { make: 'pennantL', rod: [3, 29, 11.5, 1.5], cloth: [4, 12, 28, 52], notch: 8, pole: DARK, knob: '#e0b040' },
  // the Trainer set
  trophycase: { make: 'trophycase', top: 2.69 },
  pillarmodel: { make: 'pillarmodel' },
  goldpokedex: { make: 'goldpokedex' },
  gymcase: { make: 'gymcase' },
  fameplaque: { make: 'fameplaque' },
  dojobanner: { make: 'pennantL', rod: [3, 29, 9.5, 1.5], cloth: [5, 10, 27, 70], notch: 7, pole: INK, knob: GOLD },
};

export const MAKES = {
  /* ---------- the dojo ---------- */
  wingchun(K, s, W, D, L) {
    const { rbox, cyl, lathe, ball } = L, oak = K.wood(OAK), post = K.wood('#9a6a3a'), arm = K.wood('#b0804a'), ink = K.plain('#4a3018');
    const zp = -0.12, zr = -0.3;
    // the frame: a skid on the floor each side, an upright on it, a rail across their feet and their tops
    for (const i of [5.5, 26.5]) {
      K.put(rbox(u(4), u(4), 0.86, 0.012, 1), oak, X(i), u(2), -0.04);
      K.put(cyl(u(1.5), u(26), u(1.5), 10), oak, X(i), u(17), zr);
    }
    K.put(rbox(u(26), u(4), u(3), 0.01, 1), oak, X(16), u(6), zr);
    K.put(rbox(u(26), u(3), u(3), 0.01, 1), oak, X(16), u(30.5), zr);
    // the dummy's post, its foot and neck pegged to the rails, three dark bands round it
    K.put(lathe([[0, 8], [4.6, 8], [5, 9], [5, 72], [4.2, 73.6], [0, 74]].map(([r, y]) => [u(r), u(y)]), 14), post, X(16), 0, zp);
    for (const y of [6, 30.5]) K.put(rbox(u(3), u(2.4), zp - zr + 0.04, 0.006, 1), oak, X(16), u(y), (zp + zr) / 2);
    for (const y of [65.5, 49.5, 29.5]) K.put(cyl(u(5.2), u(1), u(5.2), 14), ink, X(16), u(y), zp);
    // two upper arms out in a V, their ends capped; the middle arm low and forward; the bent leg
    for (const sg of [-1, 1]) {
      rod(K, L, arm, [X(16 + sg * 3), u(58.5), zp + 0.08], [X(16 + sg * 12.5), u(58.5), 0.32], u(1.5));
      K.put(rbox(u(2.4), u(4.4), u(3), 0.01, 1), arm, X(16 + sg * 13.6), u(58.5), 0.33, sg * 0.5);
    }
    rod(K, L, arm, [X(16), u(46), zp + 0.1], [X(16), u(37), 0.34], u(2));
    K.put(rbox(u(7), u(3), u(3), 0.012, 1), arm, X(16), u(35.5), 0.35);
    rod(K, L, arm, [X(17), u(24.5), zp + 0.1], [X(27.5), u(24.5), 0.16], u(1.5));
    K.put(ball(u(1.8), 10, 8), arm, X(27.5), u(24.5), 0.16);
    rod(K, L, arm, [X(27.5), u(24.5), 0.16], [X(27.5), u(14), 0.22], u(1.5));
    K.put(rbox(u(3.4), u(2), u(4), 0.008, 1), arm, X(27.5), u(13.6), 0.23);
  },

  kensandbag(K, s, W, D, L) {
    const { rbox, cyl, lathe, torus, THREE } = L, oak = K.wood(OAK), chain = K.metal('#9a9aa8'), band = K.gloss('#2a2a30');
    // the A-frame: a pair of legs splayed front and back each side, braced, under the beam
    for (const i of [2.5, 29.5]) {
      for (const z of [-0.4, 0.4]) rod(K, L, oak, [X(i), u(84), 0], [X(i + (i < 16 ? 2 : -2)), 0.03, z], u(1.6));
      K.put(rbox(u(2), u(2), 0.42, 0.006, 1), oak, X(i), u(30), 0);
      for (const z of [-0.4, 0.4]) K.put(rbox(u(4), u(2), u(5), 0.006, 1), K.plain('#3a2414'), X(i + (i < 16 ? 2 : -2)), u(1), z);
    }
    K.put(rbox(1, u(5), u(5), 0.014, 1), K.wood(L.tone(OAK, 1.15)), 0, u(85.5), 0);
    // the hook, the chain's links, a ring and four straps down to the bag
    K.put(cyl(u(1), u(2), u(1), 8), chain, 0, u(82.5), 0);
    for (let i = 0; i < 4; i++) K.put(new THREE.TorusGeometry(u(1.1), u(0.32), 4, 8).scale(1, 1.5, 1), chain, 0, u(80.5 - i * 1.9), 0, i % 2 ? Math.PI / 2 : 0);
    K.put(torus(u(1.6), u(0.4), TAU, 10).rotateX(Math.PI / 2), chain, 0, u(73.6), 0);
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 4 + i * Math.PI / 2;
      rod(K, L, band, [0, u(73.6), 0], [Math.cos(a) * u(5.6), u(72.4), Math.sin(a) * u(5.6)], u(0.35));
    }
    // the bag: red leather, rounded at both ends, two black bands, FYM stitched on its front
    K.put(lathe([[0, 25], [6.6, 25.3], [7.7, 26.5], [8, 28], [8, 70], [7.6, 72], [6.5, 72.8], [0, 73]].map(([r, y]) => [u(r), u(y)]), 16), K.gloss(RED), 0, 0, 0);
    for (const y of [64.5, 30.5]) K.put(cyl(u(8.15), u(3), u(8.15), 16, true), band, 0, u(y), 0);
    const label = new THREE.CylinderGeometry(u(8.05), u(8.05), u(8), 8, 1, true, -0.95, 1.9);
    K.put(label, L.decal(letters('fym', 'FYM', 150, 80, 64, '#ffe070', '900')), 0, u(49), 0);
  },

  dojogong(K, s, W, D, L) {
    const { rbox, cyl, lathe, ball, THREE } = L, red = K.gloss(RED), ink = K.plain(INK), gold = K.metal(GOLD);
    // the frame: two lacquered posts on black feet, the beam across them capped in gold
    for (const i of [3, 29]) {
      K.put(cyl(u(2), u(72), u(2.2), 12), red, X(i), u(36), 0);
      K.put(rbox(u(6), u(4), 0.6, 0.012, 1), ink, X(i), u(2), 0);
      K.put(rbox(u(5), u(1.2), u(5), 0.004, 1), gold, X(i), u(71.4), 0);
    }
    K.put(rbox(1, u(6), u(6), 0.016, 1), K.gloss(L.tone(RED, 0.78)), 0, u(75), 0);
    for (const sg of [-1, 1]) K.put(rbox(u(1.4), u(6.4), u(6.4), 0.004, 1), gold, sg * (0.5 - u(0.7)), u(75), 0);
    // the cords, and the gong hung on them: a hammered dish with a rolled rim and a raised ring, 力 at its heart
    for (const i of [10.5, 21.5]) rod(K, L, ink, [X(i), u(72), 0], [X(i), u(60.8), 0], u(0.5));
    const gong = lathe([[0, 0.055], [2.6, 0.05], [3.2, 0.036], [9, 0.032], [9.5, 0.042], [10.2, 0.032], [13.4, 0.034], [14, 0.02], [14, -0.04], [0, -0.04]].map(([r, z]) => [u(r), z]), 24);
    K.put(gong.rotateX(Math.PI / 2), gold, X(16), u(48), 0);
    K.put(new THREE.PlaneGeometry(u(9), u(9)), L.decal(letters('li', '力', 128, 128, 104, '#8a5a18')), X(16), u(48), 0.058);
    // the striker stood by the left post
    rod(K, L, K.wood(OAK), [X(5), 0.01, 0.2], [X(6), u(10), 0.16], u(0.8));
    K.put(ball(u(3), 12, 8), K.cloth('#f4f0e0'), X(6.2), u(12), 0.155);
  },

  blackbelttrophy(K, s, W, D, L) {
    const { rbox, lathe, THREE } = L, gold = K.metal(GOLD), belt = K.gloss('#22222a');
    // the plinth, lacquered black, a gold plate on its front
    K.put(rbox(u(20), u(11), 0.48, 0.02, 1), K.gloss(INK), X(16), u(5.5), 0);
    K.put(rbox(u(17), u(1.4), 0.4, 0.006, 1), K.gloss(L.tone(INK, 1.3)), X(16), u(11.6), 0);
    K.put(rbox(u(14), u(3), 0.012, 0.004, 1), gold, X(16), u(6.5), 0.244);
    // the cup: a stem with a knop, the bowl, two handles
    K.put(lathe([[0, 12], [4.5, 12.2], [4.5, 13], [2.6, 13.8], [2, 15], [2, 21], [4, 22.2], [6, 23], [5, 24.2], [2.4, 25], [4, 27], [6, 29], [8, 32],
      [9.6, 35], [10.6, 38], [11, 41], [11, 44], [10.2, 44.3], [10.2, 43], [9.2, 37], [5, 31.5], [0, 30.5]].map(([r, y]) => [u(r), u(y)]), 16), gold, X(16), 0, 0);
    for (const sg of [-1, 1]) K.put(tube(L, [[10.6, 42], [13.6, 41.4], [15, 38], [14, 34.6], [10.4, 33]].map(([x, y]) => [X(16 + sg * x), u(y), 0]), u(0.9), 12), gold, 0, 0, 0);
    // the black belt tied round the stem: the wrap, its knot, two bows and the tails
    K.put(new THREE.TorusGeometry(u(2.6), u(1), 6, 12).rotateX(Math.PI / 2).scale(1, 1.4, 1), belt, X(16), u(18.5), 0);
    K.put(rbox(u(4), u(4.4), u(2.6), 0.006, 1), K.gloss('#0c0c10'), X(16), u(18.6), u(3));
    for (const sg of [-1, 1]) {
      K.put(new THREE.TorusGeometry(u(2), u(0.8), 4, 8).scale(1.3, 0.7, 0.6), belt, X(16 + sg * 4.6), u(19), u(3), 0, 0, sg * 0.2);
      K.put(rbox(u(2), u(7), u(0.8), 0.003, 1), belt, X(16 + sg * 1.4), u(13.6), u(3.6), 0, -0.15, sg * 0.18);
    }
  },

  dragonitemedal(K, s, W, D, L) {
    const gold = K.metal(GOLD), cx = 16, cy = 34;
    // hung on a cord from a nail: the gold rim, a darker step inside it, the medallion's face (its picture) set in
    nail(K, L, cx, 14);
    cord(K, L, K.plain(INK), [[cx, 14.6, 0.03], [cx, 17, 0.032], [cx, 19.6, 0.04]], 0.5);
    round(K, L, K.plain('#5a3a10'), cx, cy, 14.6, 0.006);
    rim(K, L, gold, cx, cy, [[11.6, 0], [11.6, 0.05], [12.3, 0.068], [14.2, 0.076], [15, 0.05], [15, 0]]);
    rim(K, L, K.metal('#a86a18'), cx, cy, [[11.4, 0.044], [11.4, 0.054], [12.4, 0.06], [12.4, 0.05]]);
    round(K, L, K.pic(cut(K, L, [4.5, 22.5, 27.5, 45.5])), cx, cy, 11.5, 0.048);
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * TAU;
      K.put(L.ball(u(0.6), 6, 4), K.metal('#fff0b0'), WX(cx + Math.cos(a) * 13.3, W), WY(cy + Math.sin(a) * 13.3), 0.074);
    }
  },

  /* ---------- the Safari set ---------- */
  safarilantern(K, s, W, D, L) {
    const { rbox, cyl } = L, cane = K.wood(CANE), node = K.gloss(L.tone(CANE, 0.72));
    // a cross foot, the bamboo post with its nodes, the lantern on top
    K.put(rbox(u(12), u(3), u(5), 0.01, 1), K.gloss(DARK), X(16), u(1.5), 0);
    K.put(rbox(u(5), u(3), u(12), 0.01, 1), K.gloss(DARK), X(16), u(1.5), 0);
    K.put(cyl(u(2), u(41), u(2.2), 10), cane, X(16), u(3 + 20.5), 0);
    for (const y of [40, 26, 12]) K.put(cyl(u(2.3), u(1.1), u(2.3), 10), node, X(16), u(y), 0);
    hurricane(K, L, X(16), u(43), 0, 1);
  },

  acacia(K, s, W, D, L) {
    const { lathe, cyl, ball } = L, bark = K.plain('#6a4a28');
    // a wooden tub, two hoops round it, soil on top
    K.put(lathe([[0, 0], [8.2, 0], [8.8, 0.8], [9, 16], [8.4, 17], [7.6, 17], [7.6, 15.6], [0, 15.6]].map(([r, y]) => [u(r), u(y)]), 14), K.wood('#a8743e'), X(16), 0, 0);
    for (const y of [2.5, 13]) K.put(cyl(u(9.1), u(1.2), u(9.1), 14, true), K.plain(L.tone('#a8743e', 0.6)), X(16), u(y), 0);
    K.put(cyl(u(7.6), u(0.6), u(7.6), 12), K.plain('#4a3020'), X(16), u(15.6), 0);
    // the trunk, forking into two boughs that spread under the crown
    K.put(tube(L, [[16.5, 14], [16, 26], [15.6, 38]].map(([x, y]) => [X(x), u(y), 0]), u(2), 8), bark, 0, 0, 0);
    K.put(tube(L, [[15.6, 37], [14.4, 46], [12, 54], [9, 60]].map(([x, y], i) => [X(x), u(y), -i * 0.03]), u(1.4), 10), bark, 0, 0, 0);
    K.put(tube(L, [[15.8, 38], [18.6, 47], [21.2, 54], [23.5, 60]].map(([x, y], i) => [X(x), u(y), i * 0.03]), u(1.2), 10), bark, 0, 0, 0);
    // the wide flat crown: dark puffs underneath, lighter ones on top
    const dark = K.plain('#4a7a30'), lit = K.plain('#5e9440');
    for (const [x, z, rx, rz] of [[7, -0.1, 7, 0.22], [24.5, -0.08, 7, 0.24], [16, 0.12, 9, 0.3], [11, 0.24, 6, 0.2], [21, 0.24, 6, 0.2], [16, -0.26, 8, 0.2]]) K.put(ball(1, 12, 8).scale(u(rx), u(4.2), rz), dark, X(x), u(63), z);
    for (const [x, z, rx, rz] of [[9, 0, 6.5, 0.24], [23, 0, 6.5, 0.24], [16, 0.08, 8, 0.28], [16, -0.2, 6, 0.18]]) K.put(ball(1, 12, 8).scale(u(rx), u(3.4), rz), lit, X(x), u(66), z);
    for (let i = 0; i < 6; i++) K.put(ball(u(1.4), 8, 6), K.plain('#7ab050'), X(5 + i * 4.4), u(68.6 + (i % 3) * 0.5), -0.12 + (i % 3) * 0.12);
  },

  ballrack(K, s, W, D, L) {
    const { cyl, ball } = L, cane = K.wood(CANE), node = K.plain(L.tone(CANE, 0.72));
    // four bamboo posts, knobbed, three shelves of bamboo slats lashed between them
    for (const i of [4.5, 27.5]) for (const z of [-0.16, 0.16]) {
      K.put(cyl(u(1.5), u(56), u(1.6), 10), cane, X(i), u(28), z);
      for (const y of [22, 39]) K.put(cyl(u(1.9), u(0.9), u(1.9), 10), node, X(i), u(y), z);
      K.put(ball(u(1.8), 10, 6), node, X(i), u(56.2), z);
    }
    const tops = [['#e84838', '#3a74e0', '#2c2c34'], ['#58a848', '#f8d040', '#3aa8c8'], ['#7a3ac0', '#e84838', '#2a2a30']];
    tops.forEach((row, i) => {
      const y = u(12.5 + i * 17);
      for (const z of [-0.12, 0, 0.12]) K.put(cyl(u(1.5), u(26), u(1.5), 8).rotateZ(Math.PI / 2), K.wood(L.tone(CANE, 0.86)), X(16), y, z);
      for (const sx of [4.5, 27.5]) K.put(cyl(u(1.7), 0.38, u(1.7), 8).rotateX(Math.PI / 2), node, X(sx), y, 0);
      row.forEach((top, j) => ballL(K, L, X(9 + j * 7), y + u(1.5) + u(3.6), 0.02, u(3.6), top));
    });
  },

  expeditiontable(K, s, W, D, L) {
    const { rbox, cyl, THREE } = L, legs = K.wood(DARK), top = K.wood('#8a5a30');
    // two trestles, their legs splayed front and back on feet, a stretcher between them
    for (const lx of [8, 56]) {
      for (const z of [-1, 1]) rod(K, L, legs, [X(lx, W), u(25), z * 0.1], [X(lx, W), u(1.5), z * 0.3], u(2));
      K.put(rbox(u(5), u(3), 0.78, 0.01, 1), legs, X(lx, W), u(1.5), 0);
      K.put(rbox(u(8), u(2), 0.42, 0.006, 1), legs, X(lx, W), u(13), 0);
      K.put(rbox(u(6), u(2), 0.3, 0.006, 1), legs, X(lx, W), u(24), 0);
    }
    K.put(rbox(u(60), u(5), 0.8, 0.02, 1), top, 0, u(27.5), 0);
    // the map spread on it from a roll at the back, a stone on each front corner
    K.put(new THREE.PlaneGeometry(u(50), 0.5).rotateX(-Math.PI / 2), K.pic(mapArt()), 0, u(30) + 0.003, 0.03);
    K.put(cyl(u(3), u(51), u(3), 12).rotateZ(Math.PI / 2), K.plain('#e4d0a0'), 0, u(33), -0.25);
    for (const sg of [-1, 1]) K.put(cyl(u(3.05), u(0.8), u(3.05), 12).rotateZ(Math.PI / 2), K.plain('#c8b080'), sg * u(25.2), u(33), -0.25);
    for (const sg of [-1, 1]) K.put(L.ball(u(2), 8, 6).scale(1.3, 0.7, 1), K.plain('#8a8a90'), sg * u(22), u(30.8), 0.24);
    // the compass lying open, its lid stood up behind it
    const brass = K.metal('#e0b040');
    K.put(cyl(u(3.5), u(1.4), u(3.5), 14), brass, X(52, W), u(30.7), 0.12);
    K.put(cyl(u(2.6), u(0.3), u(2.6), 14), K.gloss('#f4f0e0'), X(52, W), u(31.5), 0.12);
    K.put(rbox(u(0.8), u(0.3), u(4.2), 0.002, 1), K.gloss('#c83a2a'), X(52, W), u(31.7), 0.12, 0.5);
    K.put(cyl(u(3.5), u(1), u(3.5), 14).rotateX(Math.PI / 2 - 0.2), brass, X(52, W), u(34.6), 0.12 - u(3.6));
    // the lantern
    hurricane(K, L, X(13, W), u(30), -0.1, 0.8);
  },

  rangertent(K, s, W, D, L) {
    const { THREE, rbox, cyl } = L, bev = 0.012, deep = 0.84, z0 = deep / 2 + bev;
    const tri = (pts) => new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
    // the canvas: a ridge tent, solid, on a ground sheet
    K.put(rbox(1.96, 0.012, 0.96, 0.004, 1), K.plain(L.tone(KHAKI, 0.62)), 0, 0.006, 0);
    const body = new THREE.ExtrudeGeometry(tri([[-u(31) + bev, bev * 1.8], [u(31) - bev, bev * 1.8], [0, u(62) - bev * 1.6]]), { depth: deep, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 1 });
    K.put(body.translate(0, 0, -deep / 2), K.cloth(KHAKI), 0, 0, 0);
    // the doorway, its left flap tied back in a roll
    K.put(new THREE.ShapeGeometry(tri([[0, u(46)], [-u(12), 0.004], [u(12), 0.004]])), K.plain('#3a2a18'), 0, 0, z0 + 0.002);
    const flap = new THREE.ExtrudeGeometry(tri([[0, u(46)], [-u(12), 0.004], [-u(18), 0.004], [-u(4), u(42)]]), { depth: 0.012, bevelEnabled: false });
    K.put(flap, K.cloth('#e6d4a6'), 0, 0, z0);
    K.put(tube(L, [[-u(4.6), u(41.4), z0 + 0.02], [-u(10), u(22), z0 + 0.03], [-u(16.4), u(1.6), z0 + 0.02]], u(1.5), 12), K.cloth('#e6d4a6'), 0, 0, 0);
    K.put(rbox(u(5), u(1.4), u(4), 0.003, 1).rotateZ(-1.2), K.plain(DARK), -u(10.2), u(22), z0 + 0.03);
    // the ridge pole along its top, the front pole up through it with a pennant, pegs at its corners
    const pole = K.wood(DARK);
    K.put(cyl(u(1), deep + 0.08, u(1), 8).rotateX(Math.PI / 2), pole, 0, u(62) - 0.01, 0);
    K.put(cyl(u(0.8), u(14), u(0.8), 8), pole, 0, u(67), z0 - 0.02);
    K.put(new THREE.ExtrudeGeometry(tri([[u(1), u(74)], [u(11), u(71)], [u(1), u(68)]]), { depth: 0.01, bevelEnabled: false }), K.plain(GREEN), 0, 0, z0 - 0.025);
    for (const sx of [-1, 1]) for (const z of [-1, 1]) K.put(rbox(u(2), u(2.6), u(2), 0.004, 1), pole, sx * u(30), u(1.6), z * (z0 - 0.02), 0, 0, -sx * 0.25);
  },

  safarijeep(K, s, W, D, L) {
    const { rbox, cyl, torus, THREE } = L, olive = K.gloss(OLIVE), tyre = K.gloss(TYRE), hub = K.metal('#c8c8c0'), bar = K.metal(L.tone(OLIVE, 0.55));
    // the wheels and the chassis between them
    for (const wx of [14, 50]) for (const sz of [-1, 1]) {
      K.put(cyl(u(8), 0.13, u(8), 16).rotateX(Math.PI / 2), tyre, X(wx, W), u(8), sz * 0.33);
      K.put(cyl(u(4), 0.14, u(4), 12).rotateX(Math.PI / 2), hub, X(wx, W), u(8), sz * 0.33);
      K.put(cyl(u(1.4), 0.15, u(1.4), 8).rotateX(Math.PI / 2), tyre, X(wx, W), u(8), sz * 0.33);
    }
    for (const wx of [14, 50]) K.put(cyl(u(1.2), 0.6, u(1.2), 8).rotateX(Math.PI / 2), tyre, X(wx, W), u(8), 0);
    // the tub: olive, its rim a shade lighter, the bonnet raised at the front, bumpers, a grille and headlights
    K.put(rbox(u(58), u(15), 0.62, 0.03, 1), olive, X(32, W), u(21.5), 0);
    K.put(rbox(u(58.4), u(1.6), 0.64, 0.008, 1), K.gloss(L.tone(OLIVE, 1.12)), X(32, W), u(29.2), 0);
    K.put(rbox(u(20), u(5), 0.58, 0.02, 1), K.gloss(L.tone(OLIVE, 0.82)), X(51, W), u(31.5), 0);
    for (const bx of [62.2, 1.8]) K.put(rbox(u(2.4), u(3), 0.66, 0.006, 1), tyre, X(bx, W), u(15.5), 0);
    K.put(rbox(u(0.8), u(9), 0.34, 0.004, 1), tyre, X(61.2, W), u(23.5), 0);
    for (const sz of [-1, 1]) K.put(cyl(u(2), u(1), u(2), 10).rotateZ(Math.PI / 2), K.glow('#ffe890'), X(61.4, W), u(26), sz * 0.22);
    // the door's SAFARI, both sides
    const door = L.decal(jeepDoor());
    K.put(new THREE.PlaneGeometry(u(34), u(10)), door, X(33, W), u(23), 0.312);
    K.put(new THREE.PlaneGeometry(u(34), u(10)).rotateY(Math.PI), door, X(33, W), u(23), -0.312);
    // seats and the wheel, the windscreen in its frame
    const seat = K.plain(DARK);
    for (const [sx, wide] of [[30, 0.5], [17, 0.56]]) {
      K.put(rbox(u(7), u(2.4), wide, 0.01, 1), seat, X(sx, W), u(31), 0);
      K.put(rbox(u(2), u(6), wide, 0.01, 1), seat, X(sx - 3.4, W), u(34), 0, 0, 0, 0.12);
    }
    K.put(torus(u(2.6), u(0.45), TAU, 12).rotateY(Math.PI / 2), tyre, X(36, W), u(36), 0.12, 0, 0, -0.5);
    rod(K, L, tyre, [X(37.6, W), u(31), 0.12], [X(36, W), u(36), 0.12], u(0.5));
    for (const sz of [-1, 1]) K.put(rbox(u(1.6), u(14), u(1.6), 0.004, 1), bar, X(39, W), u(37), sz * 0.29);
    K.put(rbox(u(1.6), u(1.6), 0.6, 0.004, 1), bar, X(39, W), u(43.2), 0);
    for (const sz of [-1, 1]) K.put(rbox(u(9), u(1.4), u(1.4), 0.004, 1), bar, X(43.5, W), u(43.2), sz * 0.29);
    K.put(new THREE.PlaneGeometry(0.56, u(12)).rotateY(Math.PI / 2), K.glass(), X(39, W), u(37), 0);
    // the roll bar: two hoops, rails between them, the khaki top over it
    for (const px of [9, 33]) {
      for (const sz of [-1, 1]) K.put(cyl(u(1), u(16), u(1), 8), bar, X(px, W), u(38), sz * 0.28);
      K.put(cyl(u(1), 0.56, u(1), 8).rotateX(Math.PI / 2), bar, X(px, W), u(45.6), 0);
    }
    for (const sz of [-1, 1]) K.put(cyl(u(0.9), u(24), u(0.9), 8).rotateZ(Math.PI / 2), bar, X(21, W), u(45.6), sz * 0.28);
    K.put(rbox(u(31), u(3), 0.68, 0.014, 1), K.cloth(KHAKI), X(21, W), u(47), 0);
    K.put(rbox(u(31.4), u(1), 0.69, 0.004, 1), K.plain(L.tone(KHAKI, 0.8)), X(21, W), u(45.4), 0);
    // the spare on its back
    K.put(cyl(u(6), u(3.4), u(6), 14).rotateZ(Math.PI / 2), tyre, X(2.4, W), u(24), 0);
    K.put(cyl(u(3), u(3.6), u(3), 10).rotateZ(Math.PI / 2), hub, X(2.3, W), u(24), 0);
  },

  /* ---------- the Trainer set ---------- */
  trophycase(K, s, W, D, L) {
    const { rbox, cyl, THREE } = L, oak = K.wood(OAK), dim = K.plain('#5e4c40'), gold = K.metal(GOLD), back = K.plain('#3a2416');
    const got = (K.p.live?.() || '').split('');
    // the case: a dark plinth, the sides, a top under a cornice, the dark back and three shelves
    K.put(rbox(1.98, u(8), 0.66, 0.02, 1), K.plain(L.tone(OAK, 0.72)), 0, u(4), 0);
    for (const i of [3.5, 60.5]) K.put(rbox(u(3), u(74), 0.62, 0.012, 1), oak, X(i, W), u(45), 0);
    K.put(rbox(u(60), u(4), 0.62, 0.012, 1), oak, 0, u(83), 0);
    K.put(rbox(u(62), u(1.6), 0.66, 0.008, 1), oak, 0, u(85.2), 0);
    K.put(rbox(u(54), u(74), 0.03, 0.004, 1), back, 0, u(45), -0.29);
    for (const y of [9, 33, 57]) K.put(rbox(u(54), u(2), 0.56, 0.006, 1), oak, 0, u(y), -0.01);
    // twelve trophies, gold for each milestone reached, a faint grey cup for each still to come
    const cup = cupParts(L);
    for (let i = 0; i < 12; i++) {
      const x = X(12 + (i % 4) * (40 / 3), W), y = u(58 - Math.floor(i / 4) * 24), m = got[i] === '1' ? gold : dim;
      K.put(cup.base.clone(), got[i] === '1' ? K.plain(L.tone(OAK, 0.55)) : dim, x, y + u(1), 0);
      K.put(cup.body.clone(), m, x, y, 0);
      for (const sg of [-1, 1]) K.put(cup.handle.clone(), m, x + sg * u(4.6), y + u(10.6), 0, 0, 0, -sg * Math.PI / 2);
    }
    // the glass doors: a mullion where they meet, a thin frame round each, two brass knobs
    K.put(rbox(u(2), u(72), 0.04, 0.004, 1), oak, 0, u(44), 0.29);
    for (const sx of [-1, 1]) {
      const cx = sx * u(14.5);
      for (const y of [8, 80.2]) K.put(rbox(u(27), u(1.4), 0.03, 0.003, 1), oak, cx, u(y), 0.295);
      K.put(new THREE.PlaneGeometry(u(26), u(71)), K.glass(), cx, u(44), 0.3);
      K.put(cyl(u(0.9), 0.03, u(0.9), 8).rotateX(Math.PI / 2), K.metal('#d8b048'), sx * u(2.4), u(44), 0.315);
    }
  },

  pillarmodel(K, s, W, D, L) {
    const { rbox, lathe, cyl, ball, THREE } = L, stone = K.plain('#9a9a8a'), neck = K.plain('#7a7a6c'), slit = K.plain('#3a3a34');
    const lit = Math.min(10, +(K.p.live?.() || 0) || 0);
    K.put(rbox(u(24), u(8), u(24), 0.02, 1), K.wood(L.tone(OAK, 0.8)), 0, u(4), 0);
    K.put(rbox(u(20), u(1), u(20), 0.004, 1), K.metal(GOLD), 0, u(8.3), 0);
    // ten drums narrowing as they climb, a band round each lit jade for every ten floors climbed, a window or three
    for (let i = 0; i < 10; i++) {
      const y = u(8 + i * 7), r = 8 - Math.floor(i / 3), rr = u(r);
      K.put(lathe([[0, 0], [r - 0.5, 0], [r, 0.5], [r, 5.5], [r - 0.5, 6], [0, 6]].map(([a, b]) => [u(a), u(b)]), 12), stone, 0, y + u(0.5), 0);
      K.put(cyl(u(r - 1.2), u(1.2), u(r - 1.2), 12, true), neck, 0, y + u(6.8), 0);
      K.put(cyl(rr + u(0.3), u(2), rr + u(0.3), 12, true), i < lit ? K.glow('#58e0a8') : K.plain('#5a5a50'), 0, y + u(3.5), 0);
      for (const a of [0, Math.PI / 2, -Math.PI / 2]) K.put(new THREE.BoxGeometry(u(1.4), u(1.4), u(0.6)), slit, Math.sin(a) * (rr - u(0.1)), y + u(5.2), Math.cos(a) * (rr - u(0.1)), a);
    }
    // the spire and the crown orb, glowing at the summit
    K.put(lathe([[4, 0], [3.4, 1], [1.4, 6], [1, 8], [0, 8]].map(([a, b]) => [u(a), u(b)]), 12), stone, 0, u(77.4), 0);
    K.put(ball(u(3.5), 12, 8), lit >= 10 ? K.glow('#7affd0') : K.gloss('#6a6a60'), 0, u(88), 0);
  },

  goldpokedex(K, s, W, D, L) {
    const { rbox, lathe, cyl, THREE } = L, gold = K.metal(GOLD), deep = K.metal(L.tone(GOLD, 0.84)), open = 0.42;
    // the dark pedestal and its cap, a ledge the Pokédex stands against
    K.put(lathe([[0, 0], [7, 0], [7, 1.4], [5.6, 3], [5, 4.2], [5, 27], [5.8, 28.6], [0, 28.6]].map(([r, y]) => [u(r), u(y)]), 14), K.gloss('#2a2a34'), 0, 0, 0);
    K.put(rbox(u(16), u(3), u(12), 0.01, 1), K.gloss('#3a3a46'), 0, u(30.4), 0);
    K.put(rbox(u(14), u(1.6), u(1.4), 0.004, 1), K.gloss('#3a3a46'), 0, u(32.6), u(3.4));
    // the open Pokédex: two gold halves on a hinge, the screen and the red lens on the left, the right embossed
    const half = (sg, m) => K.put(rbox(u(12), u(18), u(2.4), 0.01, 1).translate(sg * u(6), 0, 0), m, 0, u(41), 0, -sg * open);
    half(-1, gold); half(1, deep);
    K.put(cyl(u(1.2), u(18.4), u(1.2), 8), gold, 0, u(41), u(0.4));
    const face = (sg, geo, m, x, y) => K.put(geo.translate(sg * x, y, u(1.25)), m, 0, u(41), 0, -sg * open);
    face(-1, new THREE.PlaneGeometry(u(8), u(6)), K.gloss('#a8e0f0'), u(6), u(3));
    face(-1, cyl(u(1.6), u(0.6), u(1.6), 10).rotateX(Math.PI / 2), K.gloss('#e84838'), u(9), u(7.3));
    for (const [w, y] of [[8, 4], [6, 0]]) face(1, rbox(u(w), u(2), u(0.5), 0.003, 1), K.metal(L.tone(GOLD, 0.62)), u(2 + w / 2), u(y));
  },

  gymcase(K, s, W, D, L) {
    const live = K.p.live?.() || '', all = live.length > 0 && !live.includes('0');
    const frame = all ? K.metal(GOLD) : K.wood(OAK), d = 0.07;
    // the frame (gold once every leader is beaten), the dark backing, the leaders' photos set into it under glass
    for (const box of [[1, 18, 63, 21], [1, 79, 63, 82], [1, 21, 4, 79], [60, 21, 63, 79]]) bar(K, L, frame, box, d, 0, 0.016);
    bar(K, L, K.plain('#1e161e'), [4, 21, 60, 79], 0.014);
    pic(K, L, [4, 21, 60, 79], 0.016);
    for (const j of [52.4, 76.4]) bar(K, L, all ? frame : K.wood(L.tone(OAK, 1.2)), [4.5, j, 59.5, j + 1.2], 0.035, 0.016, 0.004);
    K.put(new L.THREE.PlaneGeometry(u(56), u(58)), K.glass(), WX(32, W), WY(50), d - 0.012);
    if (all) for (const i of [4.6, 59.4]) K.put(L.ball(u(1.2), 8, 6), K.metal('#fff4c0'), WX(i, W), WY(21.6), d - 0.02);
  },

  fameplaque(K, s, W, D, L) {
    const gold = K.metal(GOLD);
    // an oak board, the gold plate on it engraved (its picture), the star raised, four brass screws
    bar(K, L, K.wood(OAK), [3, 22, 29, 56], 0.05, 0, 0.014);
    bar(K, L, gold, [5, 24, 27, 54], 0.01, 0.05, 0.004);
    pic(K, L, [5, 24, 27, 54], 0.0605);
    star(K, L, K.metal('#fff4c0'), 16, 43, 5.2, 0.061, 0.01);
    for (const [i, j] of [[4.1, 23.1], [27.9, 23.1], [4.1, 54.9], [27.9, 54.9]]) K.put(L.ball(u(0.7), 8, 6), K.metal('#d8b048'), WX(i, W), WY(j), 0.05);
  },

  /** A pennant hung from its rod: the cloth's foot cut in a swallowtail `notch` units deep (the painting filled the cut
      with its shadow), on two hooks. The Ranger pennant and the dojo banner. */
  pennantL(K, s, W, D, L) {
    const [x0, x1, j, r] = s.rod, [c0, , c1, foot] = s.cloth, mid = (c0 + c1) / 2, half = (c1 - c0) / 2, z = u(r) + 0.03;
    wallRod(K, L, K.wood(s.pole), x0, x1, j, r, z, K.metal(s.knob), r * 1.4);
    for (const i of [x0 + 3, x1 - 3]) K.put(L.rbox(u(1.4), u(2.4), z, 0.003, 1), K.metal('#8a8e98'), WX(i, W), WY(j + 0.6), z / 2);
    const keep = (i, jj) => jj <= foot - s.notch * (1 - Math.min(1, Math.abs(i - mid) / half));
    drape(K, L, s.cloth, (fx, fy) => z - u(r) * 0.4 - fy * z * 0.5 + Math.sin(fx * Math.PI * 2) * 0.006 * (0.4 + fy), 0, [10, 14], keep);
  },
};
