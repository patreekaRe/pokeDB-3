/* base-models-e.js  -  Café, School and Winter pieces, modelled from parts like the arcade cabinets (the user's ask, 2026-10-12).
   js/base-models-f.js's head says how a batch works. Most builders here follow their painting (js/base-furniture-rooms2.js)
   pixel for pixel: `u(n)` is n of its 32 pixels a tile, `X(n, W)` a pixel across the painting as x from the middle. */

import { rod, tube } from './base-models-kit.js';

const u = (n) => n / 32;
const X = (n, W = 1) => n / 32 - W / 2;
const SNOW = '#eef6ff', ICE = '#d2effc', TAU = Math.PI * 2;
const RAINBOW = ['#e04848', '#f08030', '#f8d030', '#58b848', '#4a98d8', '#5a58c8', '#a858d8'];
const BERRY = ['#e03838', '#4a78d8', '#f890b8', '#f0d848', '#7a4ab8', '#58b8a8'];

const sheet = (w, h, draw) => { const c = new OffscreenCanvas(w, h); draw(c.getContext('2d'), w, h); return c; };
const pics = {};
const once = (key, make) => pics[key] || (pics[key] = make());

/* the A-board's chalk menu: a cup, two lines and a yellow one, on slate green (8 px a painted pixel) */
const chalkMenu = (dot) => once('chalk' + dot, () => sheet(128, 256, (g, w, h) => {
  g.fillStyle = '#2a3a34'; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,0.05)'; for (let i = 0; i < 40; i++) g.fillRect((i * 37) % w, (i * 71) % h, 10, 3);
  g.fillStyle = '#f4f4f0'; g.beginPath(); g.roundRect(40, 48, 48, 40, [0, 0, 12, 12]); g.fill();
  g.lineWidth = 7; g.strokeStyle = '#f4f4f0'; g.beginPath(); g.arc(90, 64, 10, -Math.PI / 2, Math.PI / 2); g.stroke();
  g.fillStyle = dot; g.beginPath(); g.arc(64, 32, 8, 0, TAU); g.fill();
  g.lineCap = 'round'; g.lineWidth = 7;
  for (const [x0, x1, y, c] of [[18, 110, 132, '#d8e8d8'], [26, 96, 164, '#d8e8d8'], [34, 82, 204, '#f8e070']]) { g.strokeStyle = c; g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke(); }
}));

/* stripes round a canopy (a lathe's u runs round it) */
const stripes = (a, b, n = 16) => once('stripe' + a + b + n, () => sheet(256, 16, (g, w, h) => {
  for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? a : b; g.fillRect(i * w / n, 0, w / n + 1, h); }
}));

/* the bread oven's dome: courses of brick, a darker mortar */
const bricks = () => once('bricks', () => sheet(256, 128, (g, w, h) => {
  g.fillStyle = '#a85840'; g.fillRect(0, 0, w, h);
  for (let r = 0; r < 8; r++) for (let c = 0; c < 12; c++) {
    g.fillStyle = r < 2 ? '#d8805a' : (r + c) % 3 ? '#c8684a' : '#bc6044';
    g.fillRect(((c + (r % 2) * 0.5) * w / 12) % w + 1.5, r * h / 8 + 1.5, w / 12 - 3, h / 8 - 3);
  }
}));

/* the igloo's blocks, a course of them round the dome */
const iceBlocks = () => once('iceblocks', () => sheet(512, 256, (g, w, h) => {
  g.fillStyle = '#c0d0e4'; g.fillRect(0, 0, w, h);
  const rows = 7, cols = 18;
  for (let r = 0; r < rows; r++) for (let c = 0; c <= cols; c++) {
    const x = (c + (r % 2) * 0.5) * w / cols, y = r * h / rows;
    const l = g.createLinearGradient(x, y, x, y + h / rows); l.addColorStop(0, '#ffffff'); l.addColorStop(1, '#e2ecf8');
    g.fillStyle = l; g.fillRect(x + 2, y + 2, w / cols - 4, h / rows - 4);
  }
}));

/* a sawn log's end: growth rings round the pith */
const logEnd = () => once('logend', () => sheet(64, 64, (g, w, h) => {
  for (const [r, c] of [[32, '#8a5a30'], [28, '#d8b078'], [21, '#c89858'], [14, '#d8b078'], [9, '#c89858'], [4, '#a8784a']]) { g.fillStyle = c; g.beginPath(); g.arc(32, 32, r, 0, TAU); g.fill(); }
}));

/* the ammonite's face: stone flecked darker */
const stone = () => once('stone', () => sheet(128, 128, (g, w, h) => {
  g.fillStyle = '#c8b89c'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 160; i++) { g.fillStyle = i % 2 ? '#b0a084' : '#d8caae'; g.fillRect((i * 53) % w, (i * 97) % h, 3, 3); }
}));

/** A five-pointed star, `R` from its middle to a point, lying in the x-y plane, a point up. */
function starShape(THREE, R, inner = 0.42) {
  const sh = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? R * inner : R; sh[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); }
  return sh;
}
const extrude = (THREE, sh, t, bevel = t * 0.35) => {
  const g = new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 20 });
  g.translate(0, 0, -t / 2);
  return g;
};
/** A low dome of snow on a lathe, `R` across, `H` high. */
const mound = (L, R, H) => {
  const pts = [];
  for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI / 2; pts.push([Math.cos(a) * R, Math.sin(a) * H]); }
  pts.push([0, H]);
  return L.lathe(pts, 32);
};
/** A wheel facing ±x across z: tyre and hub. */
function wheel(K, L, x, y, z, r) {
  K.put(L.cyl(r, 0.05, r, 20).rotateX(Math.PI / 2), K.gloss('#303038'), x, y, z);
  K.put(L.cyl(r * 0.4, 0.06, r * 0.4, 14).rotateX(Math.PI / 2), K.metal(), x, y, z);
}

export const SHAPES = {
  // boxes, the painting on the front only (js/base-models-kit.js)
  'espresso': { make: 'frontbox', d: 0.5, top: 0.33 },
  'pastrycase': { make: 'frontbox', d: 0.6 },
  'sciencebench': { make: 'frontbox', d: 0.6, top: 0.3 },
  // built from parts
  aframe: { make: 'aframe' },
  beansacks: { make: 'beansacks' },
  grinder: { make: 'grinder' },
  icecreamcart: { make: 'icecreamcart' },
  parasoltable: { make: 'parasoltable' },
  breadoven: { make: 'breadoven' },
  breadbasket: { make: 'breadbasket' },
  milkchurn: { make: 'milkchurn' },
  crepestand: { make: 'crepestand' },
  abacus: { make: 'abacus' },
  microscope: { make: 'microscope' },
  fossil: { make: 'fossil' },
  giantcrayons: { make: 'giantcrayons' },
  bookcart: { make: 'bookcart' },
  schoolbag: { make: 'schoolbag' },
  xylophone: { make: 'xylophone' },
  ohp: { make: 'ohp' },
  icestar: { make: 'icesculpt', motif: 'star' },
  iceheart: { make: 'icesculpt', motif: 'heart' },
  icemoon: { make: 'icesculpt', motif: 'moon' },
  iceflower: { make: 'icesculpt', motif: 'flower' },
  snowyfir: { make: 'snowyfir' },
  sled: { make: 'sled', seat: 0.42 },
  skirack: { make: 'skirack' },
  snowdrift: { make: 'snowdrift' },
  igloo: { make: 'igloo' },
  cocoastand: { make: 'cocoastand' },
  woodstove: { make: 'woodstove' },
  snowballs: { make: 'snowballs' },
  skates: { make: 'skates' },
  snowshovel: { make: 'snowshovel' },
  logpile: { make: 'logpile' },
  sleigh: { make: 'sleigh', seat: 0.78 },
  icelantern: { make: 'icelantern' },
  snowfort: { make: 'snowfort' },
};

export const MAKES = {
  /* ----- Café ----- */

  aframe(K, s, W, D, L) {
    const { THREE, rbox, cyl } = L, wood = K.wood(), h = u(44), a = 0.17, lean = Math.sin(a) * h;
    // two boards leaning together, hinged at the top, a chalk menu on each face
    for (const sg of [1, -1]) {
      const g = rbox(u(20), h, 0.04, 0.012);
      g.translate(0, h / 2, 0);
      K.put(g, wood, 0, 0, sg * lean, 0, -sg * a);
      const board = new THREE.PlaneGeometry(u(16), u(32));
      if (sg < 0) board.rotateY(Math.PI);
      board.translate(0, u(26), sg * 0.021);
      K.put(board, K.pic(chalkMenu(K.pal.c)), 0, 0, sg * lean, 0, -sg * a);
      const tray = rbox(u(18), 0.02, 0.05, 0.006);
      tray.translate(0, u(9), sg * 0.035);
      K.put(tray, wood, 0, 0, sg * lean, 0, -sg * a);
    }
    K.put(cyl(0.016, u(21), 0.016, 10).rotateZ(Math.PI / 2), K.metal(), 0, h * Math.cos(a) - 0.01, 0);
  },

  beansacks(K, s, W, D, L) {
    const { lathe, torus, ball, rbox } = L;
    // two burlap sacks tied at the neck, a label on the bigger, beans spilt at their feet
    const sack = (x, z, h, r, col, turn) => {
      const g = lathe([[0, 0], [r * 0.9, 0], [r, h * 0.1], [r * 1.02, h * 0.42], [r * 0.9, h * 0.68], [r * 0.45, h * 0.84], [r * 0.3, h * 0.88], [r * 0.46, h * 0.97], [r * 0.3, h], [0, h]], 28);
      g.scale(1, 1, 0.8);
      K.put(g, K.cloth(col), x, 0, z, turn);
      K.put(torus(r * 0.31, 0.018, TAU, 20), K.cloth(L.tone(col, 0.7)), x, h * 0.87, z, 0, Math.PI / 2);
    };
    sack(X(10), -0.06, u(22), u(10), '#b89868', 0.3);
    sack(X(21), 0.04, u(28), u(10.5), '#c8a878', -0.2);
    K.put(rbox(0.24, 0.15, 0.02, 0.01), K.cloth(K.pal.c), X(21), u(12.5), 0.04 + u(10.5) * 0.8 + 0.005, 0, -0.08);
    K.put(ball(0.022, 10, 8), K.plain('#ffffff'), X(21), u(13), 0.04 + u(10.5) * 0.8 + 0.022);
    const R = K.r;
    for (let n = 0; n < 9; n++) K.put(ball(1, 10, 8).scale(0.035, 0.022, 0.025), K.gloss('#5a3018'), X(4 + n * 3), 0.02, 0.32 + (R() - 0.5) * 0.08, R() * 3);
  },

  grinder(K, s, W, D, L) {
    const { rbox, lathe, cyl, ball } = L, wood = K.wood();
    // a wooden box with its drawer, the burr block, a glass hopper of beans and the crank on top
    K.put(rbox(u(20), u(26), 0.5, 0.025), wood, 0, u(13), 0);
    K.put(rbox(u(12), u(6), 0.02, 0.01), K.wood(L.tone(K.pal.w, 1.15)), 0, u(19), 0.255);
    K.put(ball(0.03, 12, 10), K.metal(K.pal.a), 0, u(19), 0.28);
    K.put(rbox(u(14), u(8), 0.36, 0.025), K.metal(), 0, u(30), 0);
    K.put(lathe([[0.06, 0], [0.08, 0], [0.23, u(10)], [0.22, u(10)]], 28), K.M('glass', '#e8f4f8', { key: 'hopper' }), 0, u(34), 0);
    K.put(lathe([[0, 0], [0.075, 0], [0.16, u(5.5)], [0.1, u(6)], [0, u(6)]], 24), K.gloss('#6a3a1a'), 0, u(34.2), 0);
    K.put(cyl(0.02, u(4), 0.02, 10), K.metal(), 0, u(44), 0);
    rod(K, L, K.metal(), [0, u(46), 0], [X(27), u(46.5), 0], 0.014);
    K.put(cyl(0.025, u(3.5), 0.025, 12), K.gloss(K.pal.a), X(28), u(48), 0);
  },

  icecreamcart(K, s, W, D, L) {
    const { rbox, cyl, ball, lathe } = L, body = K.gloss(K.pal.p), col = K.gloss(K.pal.c), metal = K.metal();
    // the cooler box with its band and rim, two lids on top, a cone and scoop on its front
    K.put(rbox(u(26), u(22), 0.56, 0.04), body, 0, u(19), 0);
    K.put(rbox(u(26) + 0.01, u(3), 0.57, 0.012), col, 0, u(22.5), 0);
    K.put(rbox(u(28), u(3), 0.6, 0.015), metal, 0, u(31.5), 0);
    for (const x of [-0.19, 0.19]) { K.put(rbox(0.36, 0.025, 0.5, 0.01), K.gloss(L.tone(K.pal.p, 0.92)), x, u(33) + 0.012, 0); K.put(rbox(0.12, 0.02, 0.03, 0.008), metal, x, u(33) + 0.03, 0.18); }
    K.put(cyl(0.07, 0.17, 0.005, 16).rotateX(-0.25), K.gloss('#d8a058'), X(16), u(12), 0.3);
    K.put(ball(0.085, 18, 14), K.gloss(BERRY[2]), X(16), u(16) + 0.02, 0.3);
    // a big wheel on the left, a leg on the right, a push bar
    for (const z of [-0.31, 0.31]) { wheel(K, L, X(7), u(5), z, u(5)); K.put(rbox(0.04, u(8), 0.04, 0.01), metal, X(27), u(4), z * 0.8); }
    rod(K, L, metal, [0.42, u(26), -0.2], [0.42, u(26), 0.2], 0.018);
    for (const z of [-0.2, 0.2]) rod(K, L, metal, [u(13), u(24), z], [0.42, u(26), z], 0.012);
    // the striped parasol on its pole
    K.put(cyl(0.02, u(52), 0.02, 10), metal, 0, u(56), 0);
    K.put(lathe([[0.015, u(12)], [0.45, 0], [0.44, -0.025], [0.015, u(12) - 0.03]], 32), K.pic(stripes(K.pal.c, K.pal.p)), 0, u(74), 0);
    K.put(ball(0.03, 12, 10), metal, 0, u(86) + 0.02, 0);
  },

  parasoltable(K, s, W, D, L) {
    const { cyl, lathe, ball } = L, metal = K.metal(), canopy = K.cloth(K.pal.a);
    // a bistro table: a round foot, a stem, a pale round top; a cup of coffee on it
    K.put(cyl(0.2, 0.035, 0.22, 28), metal, 0, 0.018, 0);
    K.put(cyl(0.03, u(28), 0.03, 12), metal, 0, u(14), 0);
    K.put(cyl(u(14), 0.04, u(14), 36), K.gloss(K.pal.p), 0, u(29.5), 0);
    K.put(cyl(u(14) + 0.005, 0.015, u(14) + 0.005, 36), K.gloss(L.tone(K.pal.p, 0.85)), 0, u(29.5) - 0.02, 0);
    K.put(cyl(0.07, 0.012, 0.07, 18), K.gloss('#ffffff'), X(8), u(31) + 0.005, 0.18);
    K.put(cyl(0.045, 0.1, 0.04, 16), K.gloss('#ffffff'), X(8), u(31) + 0.06, 0.18);
    K.put(cyl(0.04, 0.005, 0.04, 16), K.plain('#8a5a30'), X(8), u(31) + 0.108, 0.18);
    // the parasol: its pole, a canopy with a scalloped valance, a finial
    K.put(cyl(0.018, u(56), 0.018, 10), metal, 0, u(60), 0);
    K.put(lathe([[0.015, u(10)], [0.49, 0], [0.48, -0.025], [0.015, u(10) - 0.03]], 32), canopy, 0, u(78), 0);
    for (let i = 0; i < 14; i++) {
      const t = i / 14 * TAU;
      K.put(ball(1, 12, 8, 0).scale(0.065, 0.055, 0.015), canopy, Math.sin(t) * 0.48, u(78) - 0.04, Math.cos(t) * 0.48, t);
    }
    K.put(ball(0.03, 12, 10), metal, 0, u(88) + 0.02, 0);
  },

  breadoven(K, s, W, D, L) {
    const { THREE, rbox, cyl, ball } = L, R = u(14), base = u(18);
    // a wooden plinth, a brick dome on it, a chimney behind
    K.put(rbox(u(28), base, 0.8, 0.03), K.wood(), 0, base / 2, 0);
    K.put(rbox(u(28) + 0.01, 0.04, 0.81, 0.01), K.wood(L.tone(K.pal.w, 1.2)), 0, base - 0.02, 0);
    K.put(new THREE.SphereGeometry(1, 36, 14, 0, TAU, 0, Math.PI / 2).scale(R, R, R * 0.9), K.pic(bricks()), 0, base, -0.02);
    K.put(cyl(u(3), u(12), u(3), 16), K.plain('#8a4a3a'), X(23), u(40), -0.12);
    K.put(cyl(u(4), u(2), u(4), 16), K.plain('#6a3a2a'), X(23), u(46), -0.12);
    // the mouth: a brick arch with an iron door hinged on its left, a glow of coals under it
    const arch = (hw, hh) => { const sh = new THREE.Shape(); sh.moveTo(-hw, 0); sh.lineTo(-hw, hh - hw); sh.absarc(0, hh - hw, hw, Math.PI, 0, true); sh.lineTo(hw, 0); sh.closePath(); return sh; };
    const fz = R * 0.9 * Math.cos(0.5) - 0.02;
    K.put(extrude(THREE, arch(u(8), u(15)), 0.12, 0.01), K.plain('#a85840'), 0, base, fz);
    K.put(new THREE.ShapeGeometry(arch(u(6), u(12)), 16), K.plain('#2a1810'), 0, base, fz + 0.065);
    K.put(rbox(u(10), 0.02, 0.02, 0.006), K.glow('#f86030'), 0, base + 0.03, fz + 0.07);
    const door = K.door([-u(6), fz + 0.085], 1);
    door(extrude(THREE, arch(u(6), u(11)), 0.02, 0.006), K.metal('#3a3a42'), 0, base + u(0.6), fz + 0.085);
    for (const y of [u(4), u(8)]) door(rbox(u(11), 0.012, 0.012, 0.004), K.metal('#55555e'), 0, base + y, fz + 0.1);
    door(ball(0.022, 12, 10), K.metal(K.pal.a), u(4), base + u(6), fz + 0.11);
    K.inside = { x: 0, y: base + u(6), w: u(11), h: u(10), z: fz + 0.07 };
  },

  breadbasket(K, s, W, D, L) {
    const { lathe, torus, ball } = L, wicker = K.wood(), dark = K.wood(L.tone(K.pal.w, 0.8));
    // three baguettes leaning in an oval wicker basket with a cloth rim
    for (const [x, z, tilt, turn] of [[X(12), 0.02, 0.12, 0.1], [X(18), 0.06, 0, 0], [X(24), 0, -0.12, -0.15], [X(16), -0.1, 0.05, 0.4]]) {
      const loaf = ball(1, 16, 12).scale(0.065, 0.42, 0.065);
      loaf.translate(0, 0.4, 0);
      K.put(loaf, K.gloss('#d8a058'), x, 0.04, z, turn, 0, tilt);
      for (let k = 0; k < 3; k++) {
        const nick = ball(1, 8, 6).scale(0.03, 0.012, 0.012);
        nick.translate(0, 0.52 + k * 0.1, 0.06);
        K.put(nick, K.plain('#b8803a'), x, 0.04, z, turn, 0, tilt);
      }
    }
    const g = lathe([[0.3, 0], [0.34, 0.05], [0.4, u(14)], [0.37, u(14)], [0.31, 0.06], [0, 0.04]], 32);
    g.scale(1, 1, 0.7);
    K.put(g, wicker, 0, 0, 0);
    for (let i = 0; i < 3; i++) K.put(torus(0.345 + i * 0.024, 0.01, TAU, 32).rotateX(Math.PI / 2).scale(1, 1, 0.7), dark, 0, 0.1 + i * 0.1, 0);
    K.put(torus(0.39, 0.03, TAU, 32).rotateX(Math.PI / 2).scale(1, 1, 0.7), K.cloth(K.pal.c), 0, u(14), 0);
  },

  milkchurn(K, s, W, D, L) {
    const { lathe, cyl, torus, ball } = L, r = u(9), metal = K.metal(), dark = K.metal(L.tone(K.pal.m, 0.75));
    // a churn turned on a lathe: body, shoulder, neck, a lid with its knob; two loop handles, a coloured band
    K.put(lathe([[0, 0], [r, 0], [r, u(28)], [r * 0.92, u(29.5)], [0.17, u(31.5)], [0.155, u(38)], [0, u(38)]], 36), metal, 0, 0, 0);
    K.put(cyl(r + 0.006, u(4), r + 0.006, 36), dark, 0, u(2), 0);
    K.put(torus(r, 0.012, TAU, 36), K.metal(L.tone(K.pal.m, 1.3)), 0, u(19), 0, 0, Math.PI / 2);
    K.put(cyl(0.19, u(4), 0.19, 32), K.metal(L.tone(K.pal.m, 1.25)), 0, u(40), 0);
    K.put(ball(0.035, 12, 10), dark, 0, u(42) + 0.02, 0);
    for (const sg of [-1, 1]) K.put(torus(0.06, 0.014, Math.PI, 16).rotateZ(-sg * Math.PI / 2), dark, sg * (r - 0.01), u(27.5), 0);
    K.put(cyl(r + 0.008, u(6), r + 0.008, 36), K.gloss(K.pal.c), 0, u(13), 0);
    for (const x of [-0.03, 0.03]) K.put(ball(0.012, 8, 6), K.plain('#ffffff'), x, u(13.5), r + 0.008);
  },

  crepestand(K, s, W, D, L) {
    const { rbox, cyl } = L, col = K.gloss(K.pal.c), pale = K.gloss(K.pal.p), wood = K.wood();
    // the cart on four wheels, a pale band round it
    K.put(rbox(u(28), u(22), 0.6, 0.03), col, 0, u(17), 0);
    K.put(rbox(u(28) + 0.01, u(2), 0.61, 0.01), pale, 0, u(21), 0);
    for (const x of [X(7), X(25)]) for (const z of [-0.3, 0.3]) wheel(K, L, x, u(3), z, u(3));
    // the hotplate: a crêpe cooking, a spatula, a jar of chocolate spread
    K.put(rbox(u(26), u(3), 0.56, 0.015), K.gloss('#303038'), 0, u(29.5), 0);
    K.put(cyl(0.2, 0.012, 0.2, 32), K.gloss('#f0d090'), X(12), u(31) + 0.006, 0.04);
    K.put(rbox(0.13, 0.008, 0.09, 0.004), K.metal('#c8ccd4'), X(21), u(31) + 0.01, 0.1, 0.4);
    K.put(rbox(0.12, 0.02, 0.025, 0.008), K.wood('#8a5a30'), X(21) + 0.1, u(31) + 0.02, 0.1 - 0.04, 0.4);
    K.put(cyl(0.06, u(5), 0.06, 16), K.gloss('#5a3018'), X(26), u(31) + u(2.5), -0.12);
    K.put(cyl(0.062, 0.03, 0.062, 16), K.gloss('#ffffff'), X(26), u(36.5), -0.12);
    // four posts and the sign roof over it
    for (const x of [X(4), X(28)]) for (const z of [-0.26, 0.26]) K.put(rbox(0.05, u(32), 0.05, 0.012), wood, x, u(31) + u(16), z);
    K.put(rbox(u(30), u(8), 0.66, 0.025), pale, 0, u(64), 0);
    K.put(rbox(u(16), u(2), 0.01, 0.004), col, 0, u(64.5), 0.335);
    K.put(rbox(u(30) + 0.02, 0.03, 0.68, 0.01), col, 0, u(68), 0);
  },

  /* ----- School ----- */

  abacus(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, wood = K.wood();
    // a standing frame on two feet, five wire rods of beads slid to either end
    for (const x of [X(4.5), X(27.5)]) {
      K.put(rbox(u(3), u(40), 0.1, 0.012), wood, x, u(21), 0);
      K.put(rbox(u(3) + 0.02, 0.05, 0.36, 0.015), wood, x, 0.025, 0);
    }
    K.put(rbox(u(26), u(3), 0.1, 0.012), wood, 0, u(40.5), 0);
    K.put(rbox(u(26), u(3), 0.1, 0.012), wood, 0, u(4.5), 0);
    const cs = [K.pal.c, K.pal.a, BERRY[1], BERRY[3], BERRY[5]];
    [3, 6, 2, 5, 4].forEach((cnt, r) => {
      const y = u(36 - r * 6) - u(0.5);
      K.put(cyl(0.008, u(22), 0.008, 8).rotateZ(Math.PI / 2), K.metal(), 0, y, 0);
      for (let n = 0; n < 6; n++) K.put(ball(1, 8, 6).scale(0.034, 0.05, 0.05), K.gloss(cs[r]), X(n < cnt ? 8.5 + n * 3 : 24.5 - (5 - n) * 3), y, 0);
    });
  },

  microscope(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, metal = K.metal(), wood = K.wood();
    // a small table on four legs
    K.put(rbox(u(28), u(4), 0.6, 0.015), wood, 0, u(22), 0);
    for (const x of [-0.38, 0.38]) for (const z of [-0.24, 0.24]) K.put(rbox(0.06, u(20), 0.06, 0.012), wood, x, u(10), z);
    // the microscope: base, a coloured arm curving up, the stage with its slide, the tube and eyepiece
    K.put(rbox(u(14), u(4), 0.3, 0.03), metal, 0, u(26), 0);
    K.put(tube(L, [[X(20), u(27), -0.08], [X(20), u(36), -0.09], [X(18), u(45), -0.05]], 0.035, 20), K.gloss(K.pal.c));
    K.put(cyl(0.035, 0.05, 0.035, 14).rotateZ(Math.PI / 2), K.gloss(K.pal.c), X(20) + 0.04, u(32), -0.08);
    K.put(rbox(u(11), u(2), 0.22, 0.008), metal, X(14.5), u(35), 0);
    K.put(rbox(0.16, 0.006, 0.06, 0.002), K.M('glass', '#a8d8f0', { key: 'slide' }), X(14.5), u(36) + 0.004, 0.02);
    K.put(cyl(0.035, u(3), 0.03, 14), metal, X(13.5), u(37.5), 0);
    K.put(cyl(0.075, u(14), 0.075, 20), metal, X(13.5), u(45), 0);
    K.put(cyl(0.1, u(4), 0.1, 20), K.gloss('#303038'), X(13.5), u(54), 0);
    rod(K, L, metal, [X(18), u(45), -0.05], [X(13.5), u(45), -0.02], 0.025);
    K.put(ball(0.016, 8, 6), K.glow('#a8d8f0'), X(14.5), u(33), 0.06);
  },

  fossil(K, s, W, D, L) {
    const { THREE, rbox, cyl } = L;
    // a wooden plinth with a brass plaque, a post, an ammonite standing on its edge
    K.put(rbox(u(22), u(12), 0.45, 0.02), K.wood(), 0, u(6), 0);
    K.put(rbox(u(14), u(3), 0.01, 0.004), K.metal(K.pal.a), 0, u(6.5), 0.228);
    K.put(cyl(0.03, u(3), 0.03, 12), K.metal(), 0, u(13), 0);
    const R = u(10), cy = u(23);
    K.put(cyl(R, 0.1, R, 40).rotateX(Math.PI / 2).scale(1, 0.92, 1), K.plain('#b8a88c'), 0, cy, 0);
    for (const sg of [1, -1]) {
      const face = new THREE.CircleGeometry(R * 0.995, 40).scale(1, 0.92, 1);
      if (sg < 0) face.rotateY(Math.PI);
      K.put(face, K.pic(stone()), 0, cy, sg * 0.051);
      const pts = [];
      for (let a = 0; a <= 40; a++) { const t = a * 0.35, r = u(8 - a * 0.18); pts.push([Math.cos(t) * r * sg, cy + Math.sin(t) * r * 0.9, sg * 0.056]); }
      K.put(tube(L, pts, 0.012, 80), K.plain('#8a7a60'));
    }
    K.put(L.torus(R, 0.02, TAU, 40).scale(1, 0.92, 1), K.plain('#a8987c'), 0, cy, 0);
  },

  giantcrayons(K, s, W, D, L) {
    const { rbox, cyl } = L, col = K.gloss(K.pal.c);
    // a crayon box with a yellow band and a wavy line, two rows of crayons standing in it
    K.put(rbox(u(24), u(22), 0.5, 0.03), col, 0, u(11), 0);
    K.put(rbox(u(24) + 0.01, u(6), 0.51, 0.012), K.gloss('#f8d030'), 0, u(13), 0);
    const wave = [];
    for (let i = 0; i <= 24; i++) wave.push([X(4 + i), u(13 - Math.sin(i / 2)), 0.257]);
    K.put(tube(L, wave, 0.009, 60), col);
    const crayon = (c, x, top, z) => {
      const r = u(2), h = top - u(8);
      K.put(cyl(r, h, r, 18), K.gloss(c), x, u(8) + h / 2, z);
      K.put(cyl(r + 0.004, 0.05, r + 0.004, 18), K.gloss(L.tone(c, 0.75)), x, top - 0.08, z);
      K.put(cyl(0.012, u(4), r, 18), K.gloss(c), x, top + u(2), z);
    };
    const cs = ['#e04848', '#4a78d8', K.pal.a, '#58b848', '#a858d8'];
    cs.forEach((c, i) => crayon(c, X(8 + Math.round(i * 4.4)), u(36 - (i % 2) * 3), 0.1));
    ['#f08030', '#5ac8e8', '#f890b8', '#8a5a30'].forEach((c, i) => crayon(c, X(10 + Math.round(i * 4.4)), u(34 + (i % 2) * 3), -0.1));
  },

  bookcart(K, s, W, D, L) {
    const { rbox } = L, wood = K.wood(), dark = K.wood(L.tone(K.pal.w, 0.7)), metal = K.metal();
    // a two-sided cart of open shelves on castors, books on both sides, a push handle at its end
    for (const x of [X(5), X(25)]) for (const z of [-0.2, 0.2]) wheel(K, L, x, u(3), z, u(3));
    for (const sg of [-1, 1]) K.put(rbox(0.04, u(28), 0.5, 0.01), wood, sg * (u(13) - 0.02), u(20), 0);
    for (const y of [u(6.5), u(19.5), u(33.5)]) K.put(rbox(u(26), 0.04, 0.5, 0.01), wood, 0, y, 0);
    K.put(rbox(u(26) - 0.08, u(27), 0.03, 0.008), dark, 0, u(20), 0);
    [u(8.5), u(21.5)].forEach((y0, row) => {
      for (const side of [-1, 1]) for (let i = 0; i < 6; i++) {
        const h = u(10 - (i % 3)), k = (i + row * 2 + (side > 0 ? 0 : 3)) % 6;
        K.put(rbox(u(3.2), h, 0.19, 0.008), K.gloss(BERRY[k]), X(6.5 + i * 3.6), y0 + h / 2, side * 0.12);
      }
    });
    for (const z of [-0.18, 0.18]) K.put(rbox(0.03, u(13), 0.03, 0.01), metal, X(28.5), u(40.5), z);
    rod(K, L, metal, [X(28.5), u(46.5), -0.2], [X(28.5), u(46.5), 0.2], 0.018);
  },

  schoolbag(K, s, W, D, L) {
    const { blob, rbox, torus, ball } = L, col = K.cloth(K.pal.c), deep = K.cloth(L.tone(K.pal.c, 0.85)), strap = K.cloth(L.tone(K.pal.c, 0.7));
    // a stuffed backpack: its body, a front pocket edged in the accent, a carry loop, straps behind, a zip pull
    K.put(blob(u(22), u(30), 0.34, 0.55, 0.55), col, 0, u(15), 0);
    K.put(blob(u(16), u(12), 0.14, 0.5, 0.5), deep, 0, u(9), 0.15);
    K.put(rbox(u(16), 0.014, 0.03, 0.006), K.gloss(K.pal.a), 0, u(15), 0.18);
    K.put(torus(0.06, 0.016, Math.PI, 14), strap, 0, u(29.5), -0.02);
    for (const sg of [-1, 1]) K.put(tube(L, [[sg * 0.14, u(27), -0.12], [sg * 0.17, u(15), -0.24], [sg * 0.15, u(4), -0.13]], 0.022, 20), strap);
    K.put(rbox(0.035, u(20), 0.07, 0.012), strap, -u(11) + 0.01, u(16), 0);
    K.put(rbox(0.012, u(4), 0.012, 0.004), K.metal(), X(26.5), u(12), 0.08);
    K.put(ball(0.025, 12, 10), K.gloss(K.pal.a), X(26.5), u(9), 0.08);
  },

  xylophone(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, wood = K.wood(), tilt = 0.32;
    // a low stand tilted to the player: two rails, legs, seven rainbow bars from long to short, a mallet on top
    const lift = (z) => 0.25 - z * Math.tan(tilt);
    for (const z of [-0.13, 0.13]) {
      K.put(rbox(u(28), 0.035, 0.035, 0.01), wood, 0, lift(z), z);
      for (const x of [X(4), X(28)]) K.put(rbox(0.03, lift(z), 0.03, 0.008), K.wood(L.tone(K.pal.w, 0.8)), x, lift(z) / 2, z);
    }
    RAINBOW.forEach((c, i) => {
      const len = 0.5 - i * 0.03;
      K.put(rbox(u(3), 0.03, len, 0.008), K.gloss(c), X(5.5 + i * 3.6), 0.285, 0, 0, tilt);
      for (const z of [-0.13, 0.13]) K.put(cyl(0.008, 0.012, 0.008, 6), K.metal(), X(5.5 + i * 3.6), lift(z) + 0.05, z);
    });
    rod(K, L, wood, [X(10), 0.33, 0.12], [X(24), 0.37, -0.06], 0.008);
    K.put(ball(0.035, 14, 10), K.gloss(K.pal.c), X(24), 0.37, -0.06);
  },

  ohp(K, s, W, D, L) {
    const { rbox, cyl } = L, metal = K.metal(), pale = K.gloss(K.pal.p);
    // a metal trolley, the projector on it, a lit glass stage, the arm and its mirror head
    K.put(rbox(u(28), u(4), 0.6, 0.015), metal, 0, u(26), 0);
    for (const x of [-0.4, 0.4]) for (const z of [-0.24, 0.24]) K.put(rbox(0.05, u(24), 0.05, 0.012), metal, x, u(12), z);
    K.put(rbox(u(26), 0.03, 0.5, 0.01), metal, 0, u(6), 0);
    K.put(rbox(u(20), u(10), 0.44, 0.03), pale, 0, u(33), 0);
    for (let i = 0; i < 4; i++) K.put(rbox(u(10), 0.01, 0.01, 0.003), K.gloss('#5a5a68'), 0, u(30) + i * 0.035, 0.222);
    K.put(rbox(u(16), 0.012, 0.34, 0.004), K.glow('#a8d8f0'), 0, u(38) + 0.006, 0);
    K.put(rbox(u(2), u(18), 0.04, 0.008), metal, X(23), u(48), -0.17);
    K.put(rbox(u(12), u(6), 0.14, 0.02), pale, X(18), u(59), -0.12);
    K.put(cyl(0.06, 0.04, 0.06, 18).rotateX(Math.PI / 2), K.gloss('#303038'), X(14), u(59), -0.04);
    K.put(cyl(0.035, 0.01, 0.035, 14).rotateX(Math.PI / 2), K.gloss('#a8d8f0'), X(14), u(59), -0.018);
  },

  /* ----- Winter ----- */

  icesculpt(K, s, W, D, L) {
    const { THREE, rbox, ball, blob, heart } = L, ice = K.gloss(ICE), wood = K.wood();
    // a wooden plinth, a little ice foot, the motif carved in clear ice standing on it
    K.put(rbox(u(22), u(10), 0.48, 0.02), wood, 0, u(5), 0);
    K.put(rbox(u(18), 0.012, 0.01, 0.004), K.wood(L.tone(K.pal.w, 0.75)), 0, u(6), 0.241);
    K.put(rbox(0.2, 0.06, 0.15, 0.02), ice, 0, u(10) + 0.03, 0);
    let g = null;
    if (s.motif === 'star') g = extrude(THREE, starShape(THREE, 0.44), 0.1, 0.035);
    else if (s.motif === 'heart') g = heart(0.84, 0.1);
    else if (s.motif === 'moon') {
      const R = 0.4, a0 = 0.75, ex = Math.cos(a0) * R, ey = Math.sin(a0) * R, cx = 0.21, r = Math.hypot(ex - cx, ey), b = Math.atan2(ey, ex - cx);
      const sh = new THREE.Shape();
      sh.absarc(0, 0, R, a0, TAU - a0, false);
      sh.absarc(cx, 0, r, TAU - b, b, true);
      g = extrude(THREE, sh, 0.1, 0.035);
    }
    if (g) {
      g.computeBoundingBox();
      K.put(g, ice, 0, u(10) + 0.04 - g.boundingBox.min.y, 0);
    } else {
      // the flower: four petals round a frosted heart
      const cy = u(10) + 0.44;
      for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2; K.put(blob(0.4, 0.4, 0.13, 1, 1), ice, Math.cos(a) * 0.21, cy + Math.sin(a) * 0.21, 0); }
      K.put(ball(0.13, 20, 14).scale(1, 1, 0.8), K.gloss('#ffffff'), 0, cy, 0.03);
    }
  },

  snowyfir(K, s, W, D, L) {
    const { THREE, lathe, cyl, torus, ball } = L, snow = K.plain(SNOW), green = K.cloth('#2a6a4a');
    // a trunk on a drift of snow, three tiers of branches each hemmed with snow, baubles, a gold star
    K.put(L.lathe([[0.4, 0], [0.3, 0.05], [0, 0.07]], 28), snow, 0, 0, 0);
    K.put(cyl(0.06, u(9), 0.07, 12), K.wood('#6a4426'), 0, u(4.5), 0);
    const tiers = [[u(8), u(30), u(14)], [u(26), u(48), u(11)], [u(44), u(64), u(8)]];
    for (const [y0, y1, r] of tiers) {
      const h = y1 - y0;
      K.put(lathe([[r, 0], [r * 0.82, h * 0.12], [r * 0.45, h * 0.55], [0, h]], 28), green, 0, y0, 0);
      K.put(torus(r * 0.93, 0.035, TAU, 28).scale(1, 0.6, 1), snow, 0, y0 + 0.03, 0, 0, Math.PI / 2);
      K.put(lathe([[r * 0.22, 0], [0, h * 0.2]], 20), snow, 0, y1 - h * 0.2, 0);
    }
    const coneR = (y) => { for (const [y0, y1, r] of tiers) if (y >= y0 && y <= y1) return r * (1 - (y - y0) / (y1 - y0)) * 0.95; return 0.1; };
    const baubles = [[10, 14, K.pal.c], [21, 18, K.pal.a], [13, 34, K.pal.a], [19, 40, K.pal.c], [15, 52, K.pal.c]];
    baubles.forEach(([i, j, c]) => { const x = X(i), y = u(j), rr = coneR(y); K.put(ball(0.055, 14, 10), K.gloss(c), x, y, Math.sqrt(Math.max(0.0001, rr * rr - x * x))); });
    const R = K.r;
    for (let n = 0; n < 7; n++) {
      const y = u(12 + n * 6.5), rr = coneR(y), a = Math.PI * 0.6 + R() * Math.PI * 0.8 + n;
      K.put(ball(0.05, 12, 10), K.gloss(n % 2 ? K.pal.c : K.pal.a), Math.sin(a) * rr, y, Math.cos(a) * rr);
    }
    K.put(extrude(THREE, starShape(THREE, 0.12), 0.04, 0.015), K.gloss('#f8d030'), 0, u(64) + 0.1, 0);
  },

  sled(K, s, W, D, L) {
    const { rbox, torus } = L, metal = K.metal(), wood = K.wood();
    // two steel runners curling up at the front, struts, a slatted deck with a stripe, a coil of rope
    for (const z of [-0.17, 0.17]) {
      const pts = [[X(3), u(2), z], [X(18), u(2), z]];
      for (let a = 0; a <= 12; a++) pts.push([X(26 + Math.sin(a / 12 * Math.PI) * 3), u(2 + a * 0.95), z]);
      K.put(tube(L, pts, 0.016, 48), metal);
      for (const x of [X(8), X(22)]) K.put(rbox(u(2), u(7), 0.03, 0.008), metal, x, u(6), z);
    }
    for (let i = 0; i < 4; i++) K.put(rbox(u(24), u(4), 0.095, 0.012), wood, X(15), u(11), -0.16 + i * 0.107);
    for (const sg of [-1, 1]) K.put(rbox(u(22), u(1), 0.006, 0.002), K.gloss(K.pal.c), X(15), u(12), sg * 0.211);
    for (const sg of [-1, 1]) K.put(rbox(0.04, 0.025, 0.42, 0.008), wood, X(15) + sg * u(11), u(9) - 0.01, 0);
    K.put(torus(0.065, 0.012, TAU, 20).rotateX(Math.PI / 2), K.cloth('#c8a878'), X(22), u(13) + 0.012, 0);
    K.put(tube(L, [[X(22) + 0.06, u(13) + 0.015, 0], [X(26), u(13.5), 0], [X(28.5), u(14), 0]], 0.01, 16), K.cloth('#c8a878'));
  },

  skirack(K, s, W, D, L) {
    const { rbox, cyl, torus } = L, wood = K.wood(), lean = -0.09;
    // two posts on feet, a slotted top bar and a trough for the tails
    for (const x of [X(4.5), X(27.5)]) {
      K.put(rbox(u(3), u(40), 0.06, 0.012), wood, x, u(20), -0.13);
      K.put(rbox(u(3) + 0.02, 0.05, 0.42, 0.015), wood, x, 0.025, 0);
    }
    K.put(rbox(u(28), u(4), 0.12, 0.012), wood, 0, u(40), -0.13);
    K.put(rbox(u(24), 0.06, 0.12, 0.012), wood, 0, 0.03, 0.08);
    // four skis standing in pairs, their tips bent back; a pole with its basket
    for (const [i, c] of [[7, K.pal.c], [11, K.pal.c], [18, K.pal.a], [22, K.pal.a]]) {
      const x = X(i + 1.5), ski = K.gloss(c), g = rbox(u(3), u(68), 0.022, 0.008);
      g.translate(0, u(34), 0);
      K.put(g, ski, x, u(2), 0.08, 0, lean);
      const tip = rbox(u(3), u(5), 0.022, 0.008);
      tip.translate(0, u(2.5), 0); tip.rotateX(-0.55); tip.translate(0, u(68), 0);
      K.put(tip, ski, x, u(2), 0.08, 0, lean);
      const bind = rbox(u(3) + 0.01, 0.06, 0.035, 0.008);
      bind.translate(0, u(22), 0.02);
      K.put(bind, K.gloss('#303038'), x, u(2), 0.08, 0, lean);
    }
    const pole = cyl(0.012, u(58), 0.012, 10);
    pole.translate(0, u(29), 0);
    K.put(pole, K.metal(), X(15.5), u(2), 0.1, 0, lean);
    K.put(torus(0.04, 0.008, TAU, 16), K.gloss('#303038'), X(15.5), u(8), 0.1 - u(6) * Math.sin(-lean), 0, Math.PI / 2);
    K.put(cyl(0.02, 0.12, 0.02, 10), K.gloss('#303038'), X(15.5), u(58), 0.1 - u(56) * Math.sin(-lean), 0, lean);
  },

  snowdrift(K, s, W, D, L) {
    const { rbox, cyl } = L, snow = K.plain(SNOW);
    // a drift and a smaller one beside it, a marker flag stuck in
    const big = mound(L, u(14.5), u(16));
    big.scale(1, 1, 0.85);
    K.put(big, snow, 0, 0, -0.04);
    const small = mound(L, u(8), u(10));
    small.scale(1, 1, 0.9);
    K.put(small, K.plain('#e8f2fc'), X(9), 0, 0.18);
    K.put(cyl(0.012, u(20), 0.012, 8), K.metal(), X(21.5), u(22), 0);
    K.put(rbox(u(8), u(5), 0.012, 0.004), K.cloth(K.pal.c), X(26), u(29.5), 0);
  },

  igloo(K, s, W, D, L) {
    const { THREE, rbox, cyl } = L, R = u(29), H = u(44), snow = K.plain('#e6eff9');
    // a dome of ice blocks, a tunnel in front with its dark way in, a flag on top
    K.put(new THREE.SphereGeometry(1, 48, 16, 0, TAU, 0, Math.PI / 2).scale(R, H, R), K.pic(iceBlocks()), 0, 0, -0.04);
    const arch = (hw, hh) => { const sh = new THREE.Shape(); sh.moveTo(-hw, 0); sh.lineTo(-hw, hh - hw); sh.absarc(0, hh - hw, hw, Math.PI, 0, true); sh.lineTo(hw, 0); sh.closePath(); return sh; };
    const ring = arch(u(10), u(24));
    ring.holes.push(arch(u(8), u(22)));
    const tunnel = new THREE.ExtrudeGeometry(ring, { depth: 0.42, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2, curveSegments: 16 });
    K.put(tunnel, snow, 0, 0, 0.52);
    for (let k = 1; k < 3; k++) K.put(rbox(u(20) + 0.05, 0.012, 0.01, 0.004), K.plain('#c8d8ec'), 0, u(8 * k), 0.965);
    K.put(new THREE.ShapeGeometry(arch(u(8), u(22)), 16), K.plain('#3a4a6a'), 0, 0, 0.6);
    K.put(cyl(0.015, u(16), 0.015, 8), K.metal(), 0, H - 0.04 + u(8), -0.04);
    K.put(rbox(u(9), u(6), 0.012, 0.004), K.cloth(K.pal.c), u(5), H - 0.04 + u(13), -0.04);
  },

  cocoastand(K, s, W, D, L) {
    const { rbox, cyl, torus, ball } = L, col = K.gloss(K.pal.c), metal = K.metal();
    // a wooden counter, its sign with a mug on it, a pale top
    K.put(rbox(u(28), u(28), 0.56, 0.025), K.wood(), 0, u(14), 0);
    K.put(rbox(u(20), u(9), 0.02, 0.008), col, 0, u(17.5), 0.285);
    K.put(cyl(0.07, 0.13, 0.065, 18), K.gloss('#ffffff'), X(15), u(17.5), 0.31);
    K.put(cyl(0.06, 0.005, 0.06, 16), K.plain('#8a5a30'), X(15), u(17.5) + 0.066, 0.31);
    K.put(torus(0.035, 0.012, TAU, 12), K.gloss('#ffffff'), X(15) + 0.08, u(17.5), 0.31);
    K.put(rbox(u(30), u(4), 0.62, 0.015), K.gloss(K.pal.p), 0, u(29), 0);
    // a steaming pot of cocoa and two mugs topped with marshmallows
    K.put(cyl(u(6), u(10), u(6), 24), metal, X(10), u(31) + u(5), -0.08);
    K.put(cyl(u(7), u(2), u(7), 24), K.metal(L.tone(K.pal.m, 1.25)), X(10), u(42), -0.08);
    K.put(ball(0.03, 12, 10), K.gloss('#303038'), X(10), u(43) + 0.02, -0.08);
    for (const x of [X(21.5), X(27.5)]) {
      K.put(cyl(0.075, 0.19, 0.07, 18), col, x, u(31) + 0.095, 0.1);
      K.put(cyl(0.068, 0.005, 0.068, 16), K.plain('#5a3018'), x, u(31) + 0.188, 0.1);
      K.put(ball(0.025, 10, 8).scale(1.2, 0.9, 1), K.plain('#ffffff'), x + 0.01, u(31) + 0.2, 0.11);
      K.put(torus(0.04, 0.012, TAU, 12), col, x, u(31) + 0.1, 0.1 + 0.075, Math.PI / 2);
    }
  },

  woodstove(K, s, W, D, L) {
    const { rbox, cyl, blob, ball } = L, metal = K.metal(), dark = K.gloss('#1a1a22');
    // four legs, the iron body, a fire behind a grate, the flue up to the ceiling with its collar
    for (const x of [X(8.5), X(23.5)]) for (const z of [-0.17, 0.17]) K.put(rbox(u(3), u(6), 0.05, 0.01), metal, x, u(3), z);
    K.put(rbox(u(22), u(30), 0.5, 0.05), metal, 0, u(21), 0);
    K.put(rbox(u(24), 0.04, 0.54, 0.015), K.metal(L.tone(K.pal.m, 1.25)), 0, u(36), 0);
    K.put(rbox(u(14), u(16), 0.02, 0.008), dark, 0, u(22), 0.255);
    K.put(rbox(u(12), u(7), 0.01, 0.004), K.glow('#f86030'), 0, u(18.5), 0.265);
    K.put(L.lathe([[0.05, 0], [0.04, 0.06], [0, 0.13]], 12).scale(1, 1, 0.3), K.glow('#f8a030'), X(13), u(18), 0.268);
    K.put(L.lathe([[0.04, 0], [0.03, 0.05], [0, 0.1]], 12).scale(1, 1, 0.3), K.glow('#f8e070'), X(19), u(18), 0.268);
    for (let i = 11; i < 23; i += 3) K.put(cyl(0.008, u(14), 0.008, 6), K.gloss('#2a2a30'), X(i + 0.5), u(22), 0.275);
    K.put(cyl(u(3), u(56), u(3), 20), metal, 0, u(36) + u(28), -0.06);
    K.put(cyl(u(4), u(2), u(4), 20), K.metal(L.tone(K.pal.m, 1.25)), 0, u(61), -0.06);
    // a mitten drying on a rod off the flue
    rod(K, L, metal, [0.08, u(45), -0.06], [X(27), u(45), -0.06], 0.008);
    K.put(blob(0.12, 0.13, 0.06, 0.7, 0.7), K.cloth(K.pal.c), X(24.5), u(40), -0.06);
    K.put(ball(0.035, 10, 8), K.cloth(K.pal.c), X(24.5) - 0.07, u(40) + 0.01, -0.06);
    K.put(rbox(0.13, 0.03, 0.065, 0.012), K.cloth('#ffffff'), X(24.5), u(43), -0.06);
  },

  snowballs(K, s, W, D, L) {
    const { ball, torus, THREE } = L, snow = K.plain(SNOW), r = u(6);
    // a pyramid of snowballs and a red beanie dropped beside it
    for (const [x, z] of [[X(9), 0.08], [X(21), 0.08], [X(15), -0.12]]) K.put(ball(r, 20, 16), snow, x, r, z);
    K.put(ball(r, 20, 16), snow, X(15), r + r * 1.5, 0.01);
    K.put(new THREE.SphereGeometry(0.11, 20, 10, 0, TAU, 0, Math.PI / 2), K.cloth(K.pal.c), X(27.5), 0.02, 0.18);
    K.put(torus(0.105, 0.025, TAU, 20), K.cloth(K.pal.p), X(27.5), 0.03, 0.18, 0, Math.PI / 2);
    K.put(ball(0.035, 12, 10), K.cloth(K.pal.p), X(27.5), 0.14, 0.18);
  },

  skates(K, s, W, D, L) {
    const { rbox, ball, blob } = L, col = K.cloth(K.pal.c), pale = K.cloth(K.pal.p), metal = K.metal();
    // two boots side by side, toes to the right: shaft, foot, a pale cuff, laces, a blade on two posts
    [[3, -0.1], [16, 0.1]].forEach(([sx, z]) => {
      K.put(rbox(u(8), u(14), 0.15, 0.03), col, X(sx + 4), u(17), z);
      K.put(blob(u(13), u(7), 0.16, 0.6, 0.6), col, X(sx + 6.5), u(9.5), z);
      K.put(rbox(u(8) + 0.012, u(2), 0.16, 0.01), pale, X(sx + 4), u(23), z);
      for (let j = 0; j < 4; j++) for (const dx of [3, 5]) K.put(ball(0.012, 8, 6), pale, X(sx + dx + 0.5), u(21 - j * 3 + (dx === 5 ? 1 : 0)), z + 0.077);
      K.put(rbox(u(12), u(1), 0.018, 0.005), metal, X(sx + 7), u(3.5), z);
      for (const dx of [2.5, 10.5]) K.put(rbox(0.02, u(3), 0.018, 0.005), metal, X(sx + dx), u(5.5), z);
      K.put(ball(0.015, 8, 6), metal, X(sx + 13.2), u(4), z);
    });
  },

  snowshovel(K, s, W, D, L) {
    const { rbox, cyl } = L;
    // a heap of snow, the shovel's blade dug into it, its handle leaning back to a T-grip
    const heap = mound(L, u(12.5), u(8));
    heap.scale(1, 1, 0.75);
    K.put(heap, K.plain(SNOW), X(14), 0, 0.04);
    K.put(rbox(u(14), u(14), 0.03, 0.02), K.gloss(K.pal.c), X(22), u(8), 0.06, 0, -0.3);
    for (const sg of [-1, 1]) K.put(rbox(0.02, u(12), 0.07, 0.008), K.gloss(L.tone(K.pal.c, 0.85)), X(22) + sg * u(7), u(8), 0.08, 0, -0.3);
    K.put(rbox(u(12), u(2), 0.06, 0.015), K.plain('#ffffff'), X(22), u(14.5), 0.01, 0, -0.3);
    rod(K, L, K.wood(), [X(22), u(14), 0.0], [X(11), u(60), -0.2], 0.02);
    K.put(cyl(0.022, u(7), 0.022, 10).rotateZ(Math.PI / 2), K.gloss('#303038'), X(10.5), u(61), -0.2);
  },

  logpile(K, s, W, D, L) {
    const { THREE, cyl, blob } = L, bark = K.wood(L.tone(K.pal.w, 0.75)), ends = K.pic(logEnd()), snow = K.plain('#ffffff');
    // logs stacked three, two, one, their sawn ends showing rings, snow on the top
    const R = u(5), Rk = K.r;
    for (let r = 0; r < 3; r++) for (let i = 0; i < 3 - r; i++) {
      const x = X(6 + i * 10 + r * 5) + 0.02, y = u(5 + r * 9), len = 0.78 + (Rk() - 0.5) * 0.08, dz = (Rk() - 0.5) * 0.06;
      K.put(cyl(R, len, R, 20).rotateX(Math.PI / 2), bark, x, y, dz);
      K.put(new THREE.CircleGeometry(R * 0.93, 20), ends, x, y, dz + len / 2 + 0.002);
      K.put(new THREE.CircleGeometry(R * 0.93, 20).rotateY(Math.PI), ends, x, y, dz - len / 2 - 0.002);
    }
    K.put(blob(u(9), 0.06, 0.6, 0.6, 0.6), snow, X(16.5), u(23) + R - 0.01, 0);
    for (const x of [X(6), X(26)]) K.put(blob(u(6), 0.04, 0.5, 0.6, 0.6), snow, x, u(5) + R - 0.005, 0);
  },

  sleigh(K, s, W, D, L) {
    const { THREE, rbox, blob, torus } = L, col = K.gloss(K.pal.c), gold = K.metal(K.pal.a);
    const P = (pts) => { const sh = new THREE.Shape(); pts.forEach(([x, y], i) => sh[i ? 'lineTo' : 'moveTo'](X(x, 2), u(y))); return sh; };
    const slab = (sh, t) => { const g = new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2, curveSegments: 12 }); g.translate(0, 0, -t / 2); return g; };
    // gold runners curling up in front, struts
    for (const z of [-0.27, 0.27]) {
      const pts = [[X(4, 2), u(2), z], [X(40, 2), u(2), z]];
      for (let a = 0; a <= 16; a++) pts.push([X(57 + Math.sin(a / 16 * Math.PI) * 5, 2), u(2 + a * 1.5), z]);
      K.put(tube(L, pts, 0.02, 60), gold);
      for (const x of [X(11, 2), X(45, 2)]) K.put(rbox(u(2), u(7), 0.03, 0.008), gold, x, u(6), z);
    }
    // the body: a tub between two curved side panels, a scroll at the front, a high back
    K.put(slab(P([[4, 8], [50, 8], [55, 11], [57, 17], [55, 22], [48, 22], [20, 22], [18, 24], [17, 36], [14, 38], [6, 38], [4, 35]]), 0.44), col, 0, 0, 0);
    const side = P([[4, 8], [50, 8], [55, 10], [58, 16], [58, 24], [55, 28], [49, 30], [44, 28], [20, 28], [18, 32], [17, 40], [14, 42], [6, 42], [4, 39]]);
    for (const z of [-0.24, 0.24]) {
      K.put(slab(side, 0.04), col, 0, 0, z);
      K.put(rbox(u(46), u(2), 0.01, 0.004), gold, X(29, 2), u(11), z + Math.sign(z) * 0.036);
      K.put(torus(u(6), 0.013, TAU, 28), gold, X(51, 2), u(21), z + Math.sign(z) * 0.036);
    }
    // a seat cushion, a backrest cushion, a present on the seat
    K.put(blob(u(28), 0.08, 0.42, 0.5, 0.5), K.cloth(L.tone(K.pal.c, 0.8)), X(33, 2), u(22) + 0.04, 0);
    K.put(blob(u(13), u(15), 0.12, 0.5, 0.5), K.cloth(L.tone(K.pal.c, 0.8)), X(11, 2), u(30), 0.0, 0, -0.12);
    const gy = u(22) + 0.08 + u(4.5);
    K.put(rbox(u(10), u(9), u(10), 0.012), K.gloss('#58b848'), X(26, 2), gy, -0.04);
    K.put(rbox(u(2.2), u(9) + 0.006, u(10) + 0.006, 0.004), K.gloss('#f8d030'), X(26, 2), gy, -0.04);
    K.put(rbox(u(10) + 0.006, u(9) + 0.006, u(2.2), 0.004), K.gloss('#f8d030'), X(26, 2), gy, -0.04);
  },

  icelantern(K, s, W, D, L) {
    const { rbox, cyl, lathe, blob } = L;
    // a block of clear ice lit from within: a candle and its flame on a glowing floor, a cap of snow
    K.put(rbox(u(18), u(24), 0.5, 0.04), K.M('glass', '#bfe6f8', { key: 'ice' }), 0, u(12), 0);
    K.put(rbox(u(14), u(18), 0.012, 0.004), K.glow('#fff0c0'), 0, u(12), -0.18);
    K.put(rbox(u(14), 0.012, 0.36, 0.004), K.glow('#fff0c0'), 0, 0.03, 0);
    K.put(cyl(0.06, u(8), 0.06, 16), K.gloss(K.pal.c), 0, 0.04 + u(4), 0);
    K.put(lathe([[0.03, 0], [0.034, 0.03], [0.015, 0.07], [0, 0.09]], 14), K.glow('#f8a030'), 0, 0.04 + u(8) + 0.005, 0);
    K.put(blob(u(20), u(3) * 2, 0.54, 0.4, 0.5), K.plain('#ffffff'), 0, u(24), 0);
    for (const [x, h] of [[-0.18, 0.08], [0.05, 0.05], [0.2, 0.1]]) K.put(blob(0.04, h, 0.03, 1, 1), K.plain('#ffffff'), x, u(24) - h / 2, 0.25);
  },

  snowfort(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, vw = 64, tones = [K.plain(SNOW), K.plain('#e4eef9')];
    // four courses of snow bricks, crenellations along the top, a flag, a few snowballs ready
    for (let r = 0; r < 4; r++) for (let i = -(r % 2) * 5, n = 0; i < vw; i += 10, n++) {
      const a = Math.max(1, i), b = Math.min(i + 9, vw - 1);
      K.put(rbox(u(b - a), u(7.4), 0.42, 0.03), tones[(n + r) % 2], X((a + b) / 2, 2), u(8 * r + 4), 0);
    }
    for (let i = 2, n = 0; i + 8 < vw; i += 14, n++) K.put(rbox(u(8), u(8), 0.36, 0.03), tones[n % 2], X(i + 4, 2), u(36), 0);
    K.put(cyl(0.012, u(28), 0.012, 8), K.metal(), X(vw - 10, 2), u(46), 0);
    K.put(rbox(u(9), u(6), 0.012, 0.004), K.cloth(K.pal.c), X(vw - 5, 2), u(57), 0);
    for (const [i, j] of [[8, 3], [14, 3], [11, 8]]) K.put(ball(u(3), 14, 10), K.plain('#ffffff'), X(i, 2), u(j), 0.3);
  },
};
