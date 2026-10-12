/* base-models-h.js  -  Japanese and Toys pieces, modelled from parts like the arcade cabinets (the user's ask, 2026-10-12).
   js/base-models-f.js's head says how a batch works. Most builders here follow their painting (js/base-furniture-rooms3.js)
   pixel for pixel: `u(n)` is n of its 32 pixels a tile, `X(n, W)` a pixel across the painting as x from the middle.
   Left as they were: the rugs (tatami, koi pond, zen garden, train set, puzzle mat), the wall pieces, the low table, floor
   cushion and race car bed (already shaped) and the Types shelf (its own batch). */

import { rod, tube } from './base-models-kit.js';
import { gableRoof } from './base-models-b.js';

const u = (n) => n / 32;
const X = (n, W = 1) => n / 32 - W / 2;
const TAU = Math.PI * 2;
const RAINBOW = ['#e04848', '#f08030', '#f8d030', '#58b848', '#4a98d8', '#5a58c8', '#a858d8'];
const SKYB = '#a8d8f8', GOLD = '#f0c040', INK = '#303038', STRAW = '#e0c070', PAPER = '#fbf6e8', SKIN = '#fbe8d8';

const sheet = (w, h, draw) => { const c = new OffscreenCanvas(w, h); draw(c.getContext('2d'), w, h); return c; };
const pics = {};
const once = (key, make) => pics[key] || (pics[key] = make());

/* stripes running round a cone or lathe (its u runs round it) */
const stripes = (a, b, n) => once('stripe' + a + b + n, () => sheet(256, 16, (g, w, h) => {
  for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? a : b; g.fillRect(i * w / n, 0, w / n + 1, h); }
}));
/* a toy block's face: its colour, a pale raised edge, a white letter */
const blockFace = (col, letter) => once('block' + col + letter, () => sheet(64, 64, (g, w, h) => {
  g.fillStyle = col; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 4; g.strokeRect(6, 6, w - 12, h - 12);
  g.fillStyle = '#ffffff'; g.font = 'bold 40px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(letter, w / 2, h / 2 + 2);
}));
/* the kadomatsu's straw wrap */
const strawWrap = () => once('strawwrap', () => sheet(128, 64, (g, w, h) => {
  g.fillStyle = STRAW; g.fillRect(0, 0, w, h);
  for (let i = 0; i < w; i += 4) { g.fillStyle = i % 8 ? '#c8a858' : '#f0d890'; g.fillRect(i, 0, 2, h); }
}));

/** A puff of round balls in the given colours round x, y, z, about `r` across (blossom, pine needles). */
function clump(K, L, x, y, z, r, cols, n = 10) {
  const R = K.r, mats = cols.map(c => K.gloss(c));
  K.put(L.ball(r * 0.78, 18, 12), mats[0], x, y, z);
  for (let i = 0; i < n; i++) {
    const e = Math.asin(1 - 1.7 * (i + 0.5) / n), a = i * 2.4 + R() * 0.5, q = r * 0.6, s = r * (0.34 + R() * 0.14);
    K.put(L.ball(s, 12, 9), mats[i % mats.length], x + Math.cos(a) * Math.cos(e) * q, y + Math.sin(e) * q * 0.9, z + Math.sin(a) * Math.cos(e) * q);
  }
}
/** A five-pointed star, `r` to its points, `t` thick, facing +z. */
function star(L, r, t) {
  const { THREE } = L, sh = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * 0.45 : r; sh[i ? 'lineTo' : 'moveTo'](Math.cos(a) * q, Math.sin(a) * q); }
  const g = new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: true, bevelThickness: t * 0.3, bevelSize: t * 0.3, bevelSegments: 2 });
  return g.translate(0, 0, -t / 2);
}
/** A flat shape from [[x, y]...] points facing +z, `t` thick, its edges rounded a little. */
function slab(L, pts, t) {
  const { THREE } = L, sh = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2, curveSegments: 12 });
  return g.translate(0, 0, -t / 2);
}
/** A put for parts of something turned `ry` about its own middle at (x, z): each part placed in its own frame first. */
const turned = (K, x, z, ry) => (geo, m, lx = 0, ly = 0, lz = 0, rx = 0, rz = 0) => {
  if (rx) geo.rotateX(rx); if (rz) geo.rotateZ(rz);
  geo.translate(lx, ly, lz);
  return K.put(geo, m, x, 0, z, ry);
};

export const SHAPES = {
  // boxes, the painting on the front only (js/base-models-kit.js)
  'blocktoyshelf cartoyshelf robottoyshelf balltoyshelf boattoyshelf toptoyshelf': { make: 'frontbox', d: 0.4 },
  shoji: { make: 'shoji' },
  torii: { make: 'torii' },
  sakura: { make: 'sakura' },
  luckycat: { make: 'luckycat' },
  daruma: { make: 'daruma' },
  taiko: { make: 'taiko' },
  kimonostand: { make: 'kimonostand' },
  teaset: { make: 'teaset' },
  kadomatsu: { make: 'kadomatsu' },
  bamboofence: { make: 'bamboofence' },
  rockinghorse: { make: 'rockinghorse', seat: u(39) },
  jackbox: { make: 'jackbox' },
  dollhouse: { make: 'dollhouse' },
  teepee: { make: 'teepee' },
  ballpit: { make: 'ballpit' },
  blocktower: { make: 'blocktower' },
  bigtop: { make: 'bigtop' },
  toyrobot: { make: 'toyrobot' },
  spacehopper: { make: 'spacehopper' },
  marblerun: { make: 'marblerun' },
  toytrain: { make: 'toytrain' },
  stackrings: { make: 'stackrings' },
  puzzlecube: { make: 'puzzlecube' },
  toysoldier: { make: 'toysoldier' },
};

export const MAKES = {
  /* ----- Japanese ----- */

  shoji(K, s, W, D, L) {
    const { rbox } = L, frame = K.wood(), dark = K.wood(L.tone(K.pal.w, 0.8)), paper = K.plain(PAPER);
    // four panels folded a little, like a screen standing on its own: each a wooden frame, rice paper, a lattice
    const n = 4, span = W - 0.1, zs = [0.06, -0.06, 0.06, -0.06, 0.06], pw = span / n;
    for (let i = 0; i < n; i++) {
      const x0 = -span / 2 + i * pw, z0 = zs[i], z1 = zs[i + 1], len = Math.hypot(pw, z1 - z0);
      const put = turned(K, x0 + pw / 2, (z0 + z1) / 2, Math.atan2(-(z1 - z0), pw));
      const w = len - 0.01, inner = w - u(4);
      for (const sx of [-1, 1]) put(rbox(u(2), u(84), 0.05, 0.008), frame, sx * (w / 2 - u(1)), u(44), 0);
      put(rbox(w, u(3), 0.05, 0.008), frame, 0, u(84.5), 0);
      put(rbox(inner, u(12), 0.045, 0.006), dark, 0, u(9), 0);
      put(rbox(inner, u(2), 0.05, 0.006), frame, 0, u(16), 0);
      put(rbox(inner, u(66), 0.012, 0.004), paper, 0, u(49), 0);
      for (let y = 72; y > 20; y -= 11) put(rbox(inner, u(1), 0.03, 0.003), frame, 0, u(y), 0);
      put(rbox(u(1), u(66), 0.03, 0.003), frame, 0, u(49), 0);
      put(rbox(w + 0.004, u(1.5), 0.054, 0.004), K.wood(L.tone(K.pal.w, 1.15)), 0, u(86), 0);
    }
  },

  torii(K, s, W, D, L) {
    const { cyl, rbox } = L, red = K.gloss(K.pal.c), ink = K.gloss(INK), xs = [X(9, 2), X(55, 2)];
    // two red pillars on black feet
    for (const x of xs) {
      K.put(cyl(u(3), u(80), u(3.3), 20), red, x, u(40), 0);
      K.put(cyl(u(4), u(6), u(4.2), 20), ink, x, u(3), 0);
    }
    // the black top beam sweeping up at its ends, the red one under it
    const curve = (y0, y1) => {
      const pts = [], N = 24, up = (f) => f ** 4 * u(4);
      for (let i = 0; i <= N; i++) { const f = -1 + 2 * i / N; pts.push([f * W / 2, y0 + up(f)]); }
      for (let i = N; i >= 0; i--) { const f = -1 + 2 * i / N; pts.push([f * W / 2 * (1 + (y1 - y0) * 0.15), y1 + up(f) * 1.15]); }
      return pts;
    };
    K.put(slab(L, curve(u(87), u(92)), 0.16), ink, 0, 0, 0);
    K.put(slab(L, curve(u(83), u(87)).map(([x, y]) => [x * 0.94, y]), 0.12), red, 0, 0, 0);
    // the tie beam through the pillars, the black plaque between the beams with its gold board
    K.put(rbox(W - u(4), u(5), 0.1, 0.015), red, 0, u(67.5), 0);
    K.put(rbox(u(10), u(13), 0.08, 0.01), ink, 0, u(76.5), 0);
    K.put(rbox(u(6), u(8), 0.02, 0.004), K.metal(K.pal.a), 0, u(76.5), 0.045);
  },

  sakura(K, s, W, D, L) {
    const { lathe, cyl, torus } = L, bark = K.wood('#5a3a2a'), pot = K.gloss(K.pal.pot || '#b86a3a');
    // a wide glazed pot, then the trunk and two branches, blossom in round pink clumps
    K.put(lathe([[u(8), 0], [u(9), u(2)], [u(10), u(12)], [u(10.6), u(14)], [u(9.4), u(14)], [0.001, u(13)]], 28), pot, 0, 0, 0);
    K.put(torus(u(10.2), 0.012, TAU, 28), K.gloss(L.tone(K.pal.pot || '#b86a3a', 1.15)), 0, u(14), 0, 0, Math.PI / 2);
    K.put(cyl(u(9.4), 0.01, u(9.4), 24), K.plain('#3a2416'), 0, u(13.5), 0);
    K.put(tube(L, [[0, u(13), 0], [X(15.5), u(28), 0.01], [X(14), u(46), 0]], u(2.2), 20), bark, 0, 0, 0);
    K.put(tube(L, [[X(15), u(40), 0], [X(10), u(48), 0.04], [X(6), u(56), 0.02]], u(1.2), 12), bark, 0, 0, 0);
    K.put(tube(L, [[X(15), u(42), 0], [X(21), u(50), -0.04], [X(25), u(58), -0.02]], u(1.2), 12), bark, 0, 0, 0);
    K.put(tube(L, [[X(15), u(44), 0], [X(16), u(52), 0.1], [X(17), u(58), 0.12]], u(1), 10), bark, 0, 0, 0);
    const pinks = ['#f8b0c8', '#fbc8d8', '#f098b8'];
    for (const [x, y, r, z] of [[8, 62, 8, 0.02], [24, 64, 8, -0.02], [16, 72, 10, 0], [16, 56, 7, 0.12], [14, 62, 7, -0.16], [20, 60, 6, 0.14]]) clump(K, L, X(x), u(y), z, u(r), pinks, 9);
    // a few petals fallen on the soil
    for (let i = 0; i < 5; i++) { const a = i * 1.3; K.put(L.ball(0.016, 8, 6).scale(1, 0.3, 0.7), K.gloss('#f8c8d8'), Math.cos(a) * u(6), u(13.7), Math.sin(a) * u(6)); }
  },

  luckycat(K, s, W, D, L) {
    const { rbox, ball, cyl, torus, blob } = L, fur = K.gloss('#fbf6ee'), gold = K.metal(GOLD), ink = K.gloss(INK), pink = K.gloss('#f8a8b8');
    // a red cushion-plinth, the cat sitting on it: round body, big head, ears with pink insides
    K.put(rbox(u(24), u(6), u(18), 0.03), K.gloss(K.pal.c), 0, u(3), 0);
    K.put(blob(u(22), u(24), u(17), 0.9, 0.85), fur, 0, u(18), 0);
    K.put(blob(u(21), u(18), u(16), 0.9, 0.9), fur, 0, u(38), 0.01);
    for (const sx of [-1, 1]) {
      K.put(cyl(0.002, u(7), u(3.6), 14).scale(1, 1, 0.6), fur, sx * u(6.5), u(48.5), 0, 0, 0, -sx * 0.25);
      K.put(cyl(0.002, u(4.5), u(2), 12).scale(1, 1, 0.3), pink, sx * u(6.4), u(48.2), 0.035, 0, 0, -sx * 0.25);
      // the happy shut eyes and pink cheeks
      K.put(torus(u(1.6), 0.006, Math.PI, 12), ink, sx * u(4), u(39.5), u(8) - 0.005, 0, -0.2);
      K.put(ball(u(1.4), 10, 8).scale(1, 0.7, 0.4), pink, sx * u(6.5), u(36), u(7.4));
    }
    K.put(ball(u(1.1), 10, 8), K.gloss('#f88898'), 0, u(36.5), u(8.2));
    K.put(torus(u(1.6), 0.005, Math.PI, 12), ink, 0, u(35), u(8.1), 0, 0.2, Math.PI);
    for (const sx of [-1, 1]) for (const dy of [-0.012, 0.012]) K.put(L.cyl(0.003, u(6), 0.003, 5).rotateZ(Math.PI / 2 + sx * dy * 8), ink, sx * u(7.5), u(36) + dy, u(7.2));
    // the red collar and its gold bell
    K.put(torus(u(8.2), u(1.5), TAU, 32).scale(1, 1, 0.78), K.gloss(K.pal.c), 0, u(28.5), 0, 0, Math.PI / 2);
    K.put(ball(u(2.5), 14, 10), gold, 0, u(26), u(7.5));
    // the beckoning paw up by its ear, the gold koban held to its belly
    rod(K, L, fur, [u(8), u(28), 0.02], [u(10), u(42), 0.04], u(2.6));
    K.put(ball(u(4), 16, 12).scale(1, 1.15, 0.85), fur, u(10), u(46), 0.04);
    K.put(cyl(u(5), u(1.5), u(5), 24).scale(1, 1.25, 1).rotateX(Math.PI / 2), gold, X(12), u(16), u(8.6), 0, 0, 0.1);
    K.put(rbox(u(4), u(0.8), 0.01, 0.002), K.gloss(L.tone(GOLD, 0.7)), X(12), u(18), u(9.3));
    K.put(ball(u(3.2), 14, 10).scale(1, 0.9, 0.8), fur, X(14), u(21), u(8));
  },

  daruma(K, s, W, D, L) {
    const { lathe, ball, cyl, torus } = L, red = K.gloss(K.pal.c), white = K.gloss('#fbf6ee'), ink = K.gloss(INK), gold = K.metal(K.pal.a);
    // an egg cut flat underneath, widest a third of the way up
    const cy = u(13), rx = u(13), ry = u(18), at = (y) => rx * Math.sqrt(Math.max(0, 1 - ((y - cy) / ry) ** 2));
    const pts = [[0.001, 0]];
    for (let i = 0; i <= 20; i++) { const y = (cy + ry) * i / 20; pts.push([at(y), y]); }
    K.put(lathe(pts, 40), red, 0, 0, 0);
    const onIt = (x, y, out = 0) => Math.sqrt(Math.max(0, at(y) ** 2 - x * x)) + out;
    // its white face, one eye filled in, the other still empty, brows and a moustache in gold
    const fz = onIt(0, u(21)) - u(1.6), onFace = (x, y) => fz + u(2.4) * Math.sqrt(Math.max(0, 1 - (x / u(7.5)) ** 2 - ((y - u(21)) / u(6.5)) ** 2)) + 0.004;
    K.put(ball(1, 24, 16).scale(u(7.5), u(6.5), u(2.4)), white, 0, u(21), fz);
    K.put(ball(u(2.1), 16, 10).scale(1, 1, 0.35), ink, -u(3.4), u(22), onFace(u(3.4), u(22)));
    K.put(torus(u(1.8), 0.008, TAU, 18), ink, u(3.4), u(22), onFace(u(3.4), u(22)));
    for (const sx of [-1, 1]) K.put(L.rbox(u(5), u(1.2), 0.01, 0.003), ink, sx * u(4), u(26.5), onIt(u(4), u(26.5), u(0.5)), sx * 0.4, 0, -sx * 0.35);
    K.put(L.rbox(u(5), u(1), 0.01, 0.003), ink, 0, u(17.5), onIt(0, u(17.5), u(0.4)));
    for (const sx of [-1, 1]) K.put(ball(1, 12, 8).scale(u(1.6), u(3.2), u(0.8)), gold, sx * u(7.5), u(10), onIt(u(7.5), u(10), -u(0.3)), sx * 0.6);
    K.put(ball(1, 14, 8).scale(u(5), u(1.2), u(0.8)), gold, 0, u(7), onIt(0, u(7), -u(0.2)));
  },

  taiko(K, s, W, D, L) {
    const { lathe, cyl, ball, torus, rbox } = L, wood = K.wood(), head = K.plain('#f4ecd8'), ink = K.gloss(INK);
    // an A-frame stand of four splayed legs, the drum laid in it, its top head tipped towards you
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) rod(K, L, wood, [sx * u(13), u(20), sz * u(6)], [sx * u(15), 0.01, sz * u(10)], u(1.6));
    for (const sx of [-1, 1]) K.put(rbox(u(3), u(3), u(22), 0.01), wood, sx * u(13.5), u(13), 0);
    K.put(rbox(u(26), u(2.5), u(3), 0.01), wood, 0, u(13), 0);
    const tilt = 0.6, cy = u(35), len = u(26), body = [];
    for (let i = 0; i <= 12; i++) { const t = i / 12; body.push([u(12.5) + Math.sin(t * Math.PI) * u(2.6), -len / 2 + t * len]); }
    const at = (ly) => [0, cy + ly * Math.cos(tilt), ly * Math.sin(tilt)];
    K.put(lathe(body, 36), wood, 0, cy, 0, 0, tilt);
    for (const e of [-1, 1]) {
      const [, y, z] = at(e * len / 2);
      K.put(cyl(u(12.6), u(0.8), u(12.6), 36), head, 0, y, z, 0, tilt);
      K.put(torus(u(12.4), u(0.7), TAU, 36).rotateX(Math.PI / 2), ink, 0, y, z, 0, tilt);
      for (let i = 0; i < 18; i++) {
        const a = i / 18 * TAU, p = at(e * (len / 2 - u(2)));
        const g = ball(u(0.7), 6, 4).translate(Math.cos(a) * u(13), 0, Math.sin(a) * u(13));
        K.put(g, K.metal('#c8a858'), 0, p[1], p[2], 0, tilt);
      }
    }
    // the three-comma crest on the top head, the two sticks resting on it
    const [, ty, tz] = at(len / 2 + u(0.5));
    K.put(cyl(u(5), 0.006, u(5), 24), K.gloss(K.pal.c), 0, ty, tz, 0, tilt);
    for (let a = 0; a < 3; a++) K.put(cyl(u(1.6), 0.008, u(1.6), 12).translate(Math.cos(a * 2.1) * u(2.4), 0, Math.sin(a * 2.1) * u(2.4)), K.gloss(K.pal.a), 0, ty, tz, 0, tilt);
    for (const sx of [-1, 1]) rod(K, L, K.wood(L.tone(K.pal.w, 1.2)), [sx * u(9), ty + 0.06, tz - 0.05], [-sx * u(3), ty + 0.03, tz + 0.2], u(1));
  },

  kimonostand(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, wood = K.wood(), silk = K.cloth(K.pal.c), obi = K.gloss(K.pal.a);
    // the ikō: two posts on feet, a bar across the top the sleeves are spread on, a low rail
    for (const x of [X(4), X(28)]) {
      K.put(rbox(u(4), u(4), u(16), 0.01), wood, x, u(2), 0);
      K.put(rbox(u(2.4), u(78), u(2.4), 0.006), wood, x, u(43), -0.06);
    }
    K.put(rbox(u(34), u(3), u(3), 0.01), wood, 0, u(80.5), -0.06);
    K.put(cyl(u(2), u(4), u(2), 10).rotateZ(Math.PI / 2), wood, X(-1), u(80.5), -0.06);
    K.put(cyl(u(2), u(4), u(2), 10).rotateZ(Math.PI / 2), wood, X(33), u(80.5), -0.06);
    K.put(rbox(u(28), u(2), u(2), 0.006), wood, 0, u(7), -0.06);
    // the kimono hung from the bar: sleeves out, the long body, the obi, a pale collar crossing in a V
    K.put(rbox(u(30), u(20), 0.06, 0.02), silk, 0, u(68), -0.02);
    K.put(rbox(u(20), u(44), 0.08, 0.02), silk, 0, u(37), -0.02);
    K.put(rbox(u(20), u(1), 0.07, 0.004), K.cloth(L.tone(K.pal.c, 0.8)), 0, u(15.5), -0.02);
    K.put(rbox(u(21), u(7), 0.1, 0.012), obi, 0, u(46.5), -0.02);
    K.put(rbox(u(6), u(5), 0.03, 0.01), K.gloss(L.tone(K.pal.a, 0.8)), 0, u(46.5), 0.04);
    for (const sx of [-1, 1]) rod(K, L, K.cloth(K.pal.p), [sx * u(4), u(77), 0.025], [0, u(65), 0.03], u(1));
    K.put(rbox(u(1.5), u(14), 0.01, 0.003), K.cloth(L.tone(K.pal.c, 0.8)), 0, u(57), 0.022);
    // little flowers all over it
    const R = K.r;
    for (let n = 0; n < 12; n++) {
      const x = X(6 + R() * 20), y = u(20 + R() * 58), wide = y > u(58);
      if (!wide && Math.abs(x) > u(9)) continue;
      if (Math.abs(y - u(46.5)) < u(5)) continue;
      const z = (wide ? 0.012 : 0.022) + 0.002, col = n % 2 ? '#ffffff' : K.pal.a;
      for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; K.put(ball(u(0.9), 8, 6).scale(1, 1, 0.4), K.gloss(col), x + Math.cos(a) * u(1), y + Math.sin(a) * u(1), z); }
      K.put(ball(u(0.6), 8, 6).scale(1, 1, 0.5), K.gloss('#f8d030'), x, y, z + 0.003);
    }
  },

  teaset(K, s, W, D, L) {
    const { rbox, lathe, cyl, ball, torus } = L, pot = K.gloss(K.pal.c), cream = K.gloss('#f4ecd8'), tea = K.gloss('#88b858');
    // a low lacquered stand on four legs
    for (const x of [X(6), X(26)]) for (const z of [-0.2, 0.2]) K.put(rbox(u(3.5), u(12), u(3.5), 0.008), K.wood(), x, u(6), z);
    K.put(rbox(u(28), u(5), 0.56, 0.02), K.wood(), 0, u(13.5), 0);
    K.put(rbox(u(28.4), u(1), 0.57, 0.004), K.gloss(K.pal.a), 0, u(16.2), 0);
    const top = u(16.7);
    // the teapot: a round body, its lid and knob, a spout and a side handle
    const px = X(12), pz = -0.04;
    K.put(lathe([[0.001, 0], [u(4.5), 0], [u(6.5), u(2.5)], [u(7.2), u(5.5)], [u(6.2), u(9)], [u(4), u(11)], [0.001, u(11)]], 32), pot, px, top, pz);
    K.put(lathe([[u(4.2), 0], [u(4), u(1.2)], [u(2.2), u(2.2)], [0.001, u(2.4)]], 24), K.gloss(L.tone(K.pal.c, 0.8)), px, top + u(10.8), pz);
    K.put(ball(u(1.5), 12, 8), K.gloss(K.pal.a), px, top + u(13.6), pz);
    K.put(tube(L, [[px + u(5.5), top + u(5), pz], [px + u(8.5), top + u(7), pz], [px + u(11), top + u(10.5), pz]], u(1.1), 12), pot, 0, 0, 0);
    K.put(torus(u(3), u(1), Math.PI * 1.3, 16), pot, px - u(7), top + u(7), pz, Math.PI / 2, 0, Math.PI * 0.85);
    // two cups of green tea and a third behind
    for (const [x, z] of [[X(22), 0.13], [X(27.5), 0.03], [X(21), -0.17]]) {
      K.put(lathe([[0.001, 0], [u(2), 0], [u(2.6), u(4.5)], [u(2.3), u(4.5)], [u(1.9), u(0.8)], [0.001, u(0.8)]], 20), cream, x, top, z);
      K.put(cyl(u(2.25), 0.004, u(2.25), 18), tea, x, top + u(3.8), z);
    }
  },

  kadomatsu(K, s, W, D, L) {
    const { cyl, lathe, torus, rbox, THREE } = L, green = K.gloss('#88b048'), cut = K.gloss('#e8f0c8'), band = K.gloss(K.pal.c);
    // the straw-wrapped stand tied with two red cords and its knot
    K.put(lathe([[u(12), 0], [u(13), u(1)], [u(13), u(19)], [u(12.4), u(20)], [0.001, u(20)]], 32), K.pic(strawWrap()), 0, 0, 0);
    for (const y of [u(15), u(7)]) K.put(torus(u(13.1), u(1.1), TAU, 32), band, 0, y, 0, 0, Math.PI / 2);
    K.put(rbox(u(4), u(12), 0.03, 0.01), K.gloss(L.tone(STRAW, 0.85)), 0, u(11), u(13));
    // three bamboo cut on a slant, facing you, the tallest at the back
    for (const [x, z, h] of [[X(14.5), -0.07, 62], [X(8.5), 0.08, 50], [X(21.5), 0.08, 46]]) {
      const r = u(3.5), top = u(h), drop = u(6), g = cyl(r, top - u(16), r, 20), pos = g.attributes.position;
      for (let i = 0; i < pos.count; i++) if (pos.getY(i) > (top - u(16)) / 2 - 1e-4) pos.setY(i, pos.getY(i) - (pos.getZ(i) + r) / (2 * r) * drop);
      g.computeVertexNormals();
      K.put(g, green, x, (top + u(16)) / 2, z);
      const tilt = Math.atan2(drop, 2 * r), face = new THREE.CircleGeometry(r * 0.88, 20).scale(1, 1 / Math.cos(tilt), 1).rotateX(-Math.PI / 2 + tilt);
      K.put(face, cut, x, top - drop / 2 + 0.003, z);
      for (let y = u(26); y < top - drop; y += u(14)) K.put(torus(r, 0.008, TAU, 20), K.gloss(L.tone('#88b048', 0.85)), x, y, z, 0, Math.PI / 2);
    }
    // pine sprigs round their feet
    for (const [x, y, z, r] of [[5, 30, 0.05, 5.5], [27, 30, 0.05, 5.5], [16, 31, 0.12, 5], [10, 30, -0.12, 5], [22, 30, -0.12, 5]]) clump(K, L, X(x), u(y), z, u(r), ['#3a7a3a', '#2e6a32', '#4a8a42'], 9);
  },

  bamboofence(K, s, W, D, L) {
    const { cyl, rbox, torus } = L, rail = K.wood('#7a6a38'), tie = K.gloss(K.pal.c);
    // a row of bamboo poles, nodes every half tile, pale cut tops
    for (let i = 0; i + 5 <= 64; i += 5) {
      const h = u(56 + (i % 3) * 2), col = (i / 5) % 2 ? '#a8b858' : '#98a848', x = X(i + 2.5, 2);
      K.put(cyl(u(2.4), h, u(2.5), 16), K.gloss(col), x, h / 2, 0);
      K.put(cyl(u(2), 0.004, u(2), 14), K.gloss('#e8ecc0'), x, h + 0.002, 0);
      for (let j = 12; j < h * 32; j += 16) K.put(torus(u(2.45), 0.006, TAU, 16), K.gloss(L.tone(col, 0.8)), x, u(j), 0, 0, Math.PI / 2);
    }
    // two rails each side, tied to every other pole
    for (const y of [u(17), u(43)]) for (const z of [u(3.6), -u(3.6)]) K.put(rbox(W - 0.02, u(3), u(2.2), 0.008), rail, 0, y, z);
    for (const y of [u(17), u(43)]) for (let i = 4; i < 64; i += 10) K.put(rbox(u(2), u(5), u(9.6), 0.005), tie, X(i + 1, 2), y, 0);
  },

  /* ----- Toys ----- */

  rockinghorse(K, s, W, D, L) {
    const { blob, ball, cyl, rbox } = L, wood = K.wood(), coat = K.gloss(K.pal.c), mane = K.cloth(K.pal.a), ink = K.gloss(INK);
    // two curved rockers joined by dowels, the stand's legs up to the hooves
    const rock = (x) => u(1.5) + ((x - 0) / 0.5) ** 2 * u(6);
    for (const z of [-0.13, 0.13]) {
      const pts = [];
      for (let i = 0; i <= 16; i++) { const x = -0.5 + i / 16; pts.push([x, rock(x), z]); }
      K.put(tube(L, pts, u(1.6), 32), wood, 0, 0, 0);
    }
    for (const x of [-0.36, 0.36]) K.put(cyl(u(1), 0.28, u(1), 8).rotateX(Math.PI / 2), wood, x, rock(x), 0);
    for (const [x0, x1] of [[X(7), X(8.5)], [X(23), X(21.5)]]) for (const z of [-0.12, 0.12]) rod(K, L, wood, [x0, rock(x0), z], [x1, u(22), z * 0.55], u(1.2));
    // the horse side-on, galloping to the right: body, neck, head, ears, legs, hooves
    K.put(blob(u(22), u(10), 0.17, 0.8, 0.8), coat, X(13), u(34), 0);
    rod(K, L, coat, [X(18), u(35), 0], [X(22.5), u(42), 0], u(3.4));
    K.put(blob(u(10), u(6.5), 0.11, 0.8, 0.8), coat, X(24.5), u(42.5), 0, 0, 0, -0.35);
    K.put(ball(u(2.6), 14, 10).scale(1.2, 1, 1.1), K.gloss(L.tone(K.pal.c, 0.9)), X(28.2), u(40.5), 0);
    for (const sz of [-1, 1]) {
      K.put(ball(u(0.9), 8, 6), ink, X(25.2), u(44), sz * 0.05);
      K.put(cyl(0.002, u(3.5), u(1.2), 8), coat, X(22.5), u(47.5), sz * 0.03, 0, 0, 0.3);
    }
    for (const x of [8, 12, 18, 22]) {
      const z = x === 8 || x === 18 ? -0.05 : 0.05;
      rod(K, L, coat, [X(x), u(32), z], [X(x), u(25), z], u(1.5));
      K.put(cyl(u(1.7), u(2), u(1.8), 10), wood, X(x), u(24), z);
    }
    // the yarn mane, the tail, the saddle and the handle through its head
    for (let i = 0; i < 6; i++) K.put(ball(u(1.7), 10, 8).scale(1, 1.2, 0.7), mane, X(19.5) + i * u(0.9), u(37) + i * u(1.6), 0);
    for (let i = 0; i < 4; i++) K.put(ball(u(1.8), 10, 8).scale(1.3, 1, 0.7), mane, X(3) - i * u(0.8), u(35) - i * u(2.2), 0);
    K.put(blob(u(9), u(3), 0.2, 0.6, 0.6), K.gloss(K.pal.a), X(14.5), u(38.5), 0);
    K.put(rbox(u(2), u(6), 0.2, 0.006), K.gloss(L.tone(K.pal.a, 0.8)), X(14.5), u(35.5), 0);
    K.put(cyl(u(0.8), 0.2, u(0.8), 8).rotateX(Math.PI / 2), wood, X(24), u(44.5), 0);
    for (const sz of [-1, 1]) K.put(ball(u(1.2), 8, 6), wood, X(24), u(44.5), sz * 0.1);
  },

  jackbox(K, s, W, D, L) {
    const { rbox, ball, cyl, torus } = L, box = K.gloss(K.pal.c), metal = K.metal();
    // the box, a star on every side, its lid swung open behind, the crank on the right
    const bx = X(16), h = u(20), w = u(22);
    K.put(rbox(w, h, w, 0.02), box, bx, h / 2, 0);
    for (const ry of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      const g = star(L, u(6.5), 0.012).translate(0, 0, w / 2 + 0.004);
      K.put(g, K.gloss(K.pal.a), bx, h / 2, 0, ry);
    }
    K.put(rbox(w + u(1), u(2), w + u(1), 0.008), K.gloss(L.tone(K.pal.c, 0.8)), bx, h, 0);
    K.put(rbox(w, u(1.8), w, 0.01).translate(0, 0, w / 2), K.gloss(L.tone(K.pal.c, 0.85)), bx, h + u(1), -w / 2, 0, -1.9);
    K.put(cyl(u(1), u(4), u(1), 8).rotateZ(Math.PI / 2), metal, bx + w / 2 + u(2), u(11), 0);
    K.put(rbox(u(1.6), u(7), u(1.6), 0.004), metal, bx + w / 2 + u(4), u(13.5), 0);
    K.put(cyl(u(1.2), u(3), u(1.2), 8).rotateZ(Math.PI / 2), K.gloss(K.pal.a), bx + w / 2 + u(5.5), u(16.5), 0);
    // the coiled spring, a ruff, the clown's head with its orange hair and pointed hat
    const coil = [];
    for (let i = 0; i <= 60; i++) { const a = i / 60 * TAU * 5; coil.push([bx + Math.cos(a) * u(3), h + u(1) + i / 60 * u(13), Math.sin(a) * u(3)]); }
    K.put(tube(L, coil, u(0.6), 120), metal, 0, 0, 0);
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; K.put(ball(u(2), 10, 8).scale(1, 0.55, 1), K.gloss(i % 2 ? K.pal.p : '#ffffff'), bx + Math.cos(a) * u(4), u(35), Math.sin(a) * u(4)); }
    K.put(ball(u(7), 22, 16), K.gloss(SKIN), bx, u(42), 0);
    K.put(ball(u(2), 12, 10), K.gloss('#e04848'), bx, u(41), u(7));
    for (const sx of [-1, 1]) {
      K.put(ball(u(0.9), 8, 6), K.gloss(INK), bx + sx * u(3), u(44), u(6.2));
      for (let i = 0; i < 3; i++) K.put(ball(u(2.3), 10, 8), K.cloth('#f08030'), bx + sx * u(6.8), u(41 + i * 2.4), -u(1.5) + i * u(0.6));
    }
    K.put(torus(u(3), u(0.6), Math.PI, 14), K.gloss('#e04848'), bx, u(39.2), u(6.4), 0, 0.3, Math.PI);
    K.put(cyl(0.002, u(12), u(6), 20), K.gloss(K.pal.a), bx, u(54), -u(0.5), 0, -0.1);
    K.put(ball(u(2.2), 12, 10), K.cloth(K.pal.p), bx, u(60), -u(1.1));
  },

  dollhouse(K, s, W, D, L) {
    const { rbox, cyl, blob, ball } = L, wood = K.wood(), d = 0.5, w = u(56), z0 = -d / 2;
    // an open-fronted house: back, sides, three floors and the wall between the rooms
    K.put(rbox(w, u(54), 0.04, 0.01), wood, 0, u(27), z0 + 0.02);
    for (const sx of [-1, 1]) K.put(rbox(u(3), u(54), d, 0.01), wood, sx * (w / 2 - u(1.5)), u(27), 0);
    for (const [y, t] of [[u(2), u(4)], [u(27), u(6)], [u(52), u(4)]]) K.put(rbox(w, t, d, 0.01), wood, 0, y, 0);
    K.put(rbox(u(4), u(54), d, 0.01), wood, 0, u(27), 0);
    // each room's wallpaper and floorboards
    const walls = ['#f8e0c8', '#d8e8f8', '#f8d8e8', '#e8f0d0'];
    [[X(19, 2), u(40)], [X(45, 2), u(40)], [X(19, 2), u(14)], [X(45, 2), u(14)]].forEach(([x, y], i) => {
      K.put(rbox(u(22), u(20), 0.01, 0.003), K.plain(walls[i]), x, y, z0 + 0.045);
      K.put(rbox(u(22), 0.006, d - 0.05, 0.002), K.wood(L.tone(K.pal.w, 1.2)), x, y - u(10) + 0.003, 0.02);
    });
    // a little bed, a wardrobe and a plant upstairs; a cupboard and a sofa downstairs
    K.put(rbox(u(10), u(3), 0.2, 0.01), K.wood(), X(17, 2), u(31.5), -0.06);
    K.put(blob(u(9), u(2.5), 0.18, 0.5, 0.5), K.cloth(K.pal.c), X(17, 2), u(33.6), -0.05);
    K.put(blob(u(3), u(2), 0.08, 0.6, 0.6), K.cloth('#ffffff'), X(13.5, 2), u(35), -0.12);
    K.put(rbox(u(8), u(10), 0.12, 0.01), K.gloss(K.pal.a), X(42, 2), u(35), -0.15);
    K.put(cyl(u(1.6), u(3), u(1.3), 12), K.gloss('#b86a3a'), X(50, 2), u(31.5), -0.08);
    K.put(ball(u(2.4), 10, 8), K.gloss('#58b848'), X(50, 2), u(35), -0.08);
    K.put(rbox(u(6), u(7), 0.12, 0.008), K.gloss(K.pal.a), X(15, 2), u(7.5), -0.12);
    K.put(blob(u(16), u(6), 0.16, 0.5, 0.5), K.cloth(K.pal.c), X(44, 2), u(7), -0.1);
    // the pitched roof, a round window in its gable
    gableRoof(K, L, u(54), w, d, u(20), u(3), K.gloss(K.pal.c), wood);
    K.put(cyl(u(3), 0.02, u(3), 20).rotateX(Math.PI / 2), K.gloss(SKYB), X(26, 2) + u(6), u(62), d / 2 - 0.005);
    K.put(L.torus(u(3), u(0.6), TAU, 20), K.wood(L.tone(K.pal.w, 1.2)), X(26, 2) + u(6), u(62), d / 2);
  },

  teepee(K, s, W, D, L) {
    const { THREE, cyl } = L, r = u(18), h = u(72), side = Math.PI / 6;
    // a six-sided canvas cone in stripes, one face turned to you with its dark doorway
    K.put(cyl(0.002, h, r, 6, true).rotateY(side), K.pic(stripes(K.pal.c, K.pal.p, 12)), 0, h / 2, 0);
    const a = r * Math.cos(side), tilt = Math.atan2(a, h), slope = (y) => y / Math.cos(tilt);
    const door = new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(-u(7), 0), new THREE.Vector2(u(7), 0), new THREE.Vector2(0, slope(u(32)))]));
    K.put(door.rotateX(-tilt), K.plain('#3a2a3a'), 0, 0.002, a + 0.004);
    const flap = new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(u(6), 0), new THREE.Vector2(0, slope(u(30)))]));
    K.put(flap.rotateX(-tilt).rotateY(0.5), K.gloss(L.tone(K.pal.c, 0.85)), u(5.5), 0.002, a + 0.02);
    // its poles crossing out of the top, a pennant on one
    const top = [0, h - u(4), 0];
    for (const [dx, dz] of [[-1, 0.4], [1, 0.4], [0, -1]]) rod(K, L, K.wood(), top, [dx * u(6), h + u(14), dz * u(5)], u(0.9));
    K.put(L.rbox(u(5), u(4), 0.008, 0.002), K.gloss(K.pal.a), u(6) + u(2.5), h + u(12), u(2));
  },

  ballpit(K, s, W, D, L) {
    const { blob, rbox, ball } = L, pad = K.gloss(K.pal.c), h = 0.3, t = 0.18;
    // padded walls round a soft floor
    for (const sz of [-1, 1]) K.put(blob(W - 0.02, h, t, 0.35, 0.45), pad, 0, h / 2, sz * (D / 2 - t / 2 - 0.01));
    for (const sx of [-1, 1]) K.put(blob(t, h, D - 0.02, 0.35, 0.45), pad, sx * (W / 2 - t / 2 - 0.01), h / 2, 0);
    K.put(rbox(W - 0.1, 0.03, D - 0.1, 0.01), K.gloss(L.tone(K.pal.c, 0.6)), 0, 0.015, 0);
    // two layers of balls, the top one heaped in the middle
    const R = K.r, r = u(3), cols = [K.pal.a, '#e04848', '#f8d030', '#4a98d8', '#58b848'], inner = W / 2 - t - r * 0.6;
    let n = 0;
    for (let layer = 0; layer < 3; layer++) for (let x = -inner; x <= inner + 1e-6; x += r * 1.9) for (let z = -inner; z <= inner + 1e-6; z += r * 1.9) {
      const off = layer % 2 ? r * 0.95 : 0, px = x + off + (R() - 0.5) * r * 0.5, pz = z + off + (R() - 0.5) * r * 0.5;
      if (Math.abs(px) > inner || Math.abs(pz) > inner) continue;
      if (layer === 2 && Math.hypot(px, pz) > inner * 0.75 + R() * 0.2) continue;
      K.put(ball(r, 12, 8), K.gloss(cols[n++ % cols.length]), px, 0.03 + r + layer * r * 1.5 + R() * 0.01, pz);
    }
  },

  blocktower(K, s, W, D, L) {
    const { rbox, THREE } = L, letters = ['A', 'B', 'F', 'I', 'L', 'R'], R = K.r;
    // six letter blocks stacked a little crooked, smaller going up
    let y = 0;
    for (let n = 0; n < 6; n++) {
      const col = n % 2 ? K.pal.c : RAINBOW[n], sz = u(14 - Math.floor(n / 2)), hh = u(13), cx = u(Math.round(Math.sin(n * 1.7) * 2));
      const put = turned(K, cx, (R() - 0.5) * 0.04, (R() - 0.5) * 0.5);
      put(rbox(sz, hh, sz, 0.015), K.gloss(col), 0, y + hh / 2, 0);
      for (let f = 0; f < 4; f++) {
        const g = new THREE.PlaneGeometry(sz - 0.012, hh - 0.012).translate(0, 0, sz / 2 + 0.001).rotateY(f * Math.PI / 2);
        put(g, K.pic(blockFace(col, letters[(n + f) % 6])), 0, y + hh / 2, 0);
      }
      y += hh;
    }
  },

  bigtop(K, s, W, D, L) {
    const { lathe, cyl, ball } = L;
    // a spinning top in bands: wide at a third of its height, down to its metal tip; its handle on top
    const at = (j) => u(j < 12 ? j * 1.1 : 13 - (j - 12) * 0.7), y = (j) => u(34 - j);
    K.put(cyl(u(0.8), u(4), u(0.2), 10), K.metal(), 0, u(2), 0);
    for (let b = 0; b < 30; b += 4) {
      const pts = [];
      for (let j = Math.min(30, b + 4); j >= b; j--) pts.push([Math.max(0.002, at(j)), y(j)]);
      K.put(lathe(pts, 36), K.gloss((b / 4) % 2 ? K.pal.a : K.pal.c), 0, 0, 0);
    }
    K.put(cyl(u(1.2), u(10), u(1.2), 12), K.wood(), 0, u(39), 0);
    K.put(ball(u(2.2), 14, 10), K.wood(), 0, u(45), 0);
  },

  toyrobot(K, s, W, D, L) {
    const { rbox, lathe, ball, cyl, torus } = L, tin = K.metal(K.pal.m), body = K.gloss(K.pal.c), trim = K.gloss(K.pal.a);
    // stubby legs, a boxy tin body with rivets and a screen of lights, arms with claws
    for (const x of [X(12), X(21)]) {
      K.put(rbox(u(6), u(12), u(8), 0.015), K.metal(L.tone(K.pal.m, 0.8)), x, u(6), 0);
      K.put(rbox(u(7), u(2.5), u(10), 0.01), trim, x, u(1.25), 0.02);
    }
    K.put(rbox(u(20), u(28), u(16), 0.03), body, 0, u(26), 0);
    for (const [x, y] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) K.put(ball(u(0.8), 8, 6), trim, x * u(8.5), u(26) + y * u(12), u(8));
    K.put(rbox(u(12), u(8), 0.01, 0.004), K.plain('#1a2a2a'), 0, u(30), u(8));
    for (let n = 0; n < 3; n++) K.put(ball(u(1.2), 10, 8), K.glow(RAINBOW[n * 2 + 1]), X(12 + n * 4), u(30), u(8.1));
    for (const sx of [-1, 1]) {
      K.put(rbox(u(5), u(14), u(6), 0.015), tin, sx * u(12.5), u(31), 0);
      K.put(rbox(u(5), u(3), u(6), 0.01), trim, sx * u(12.5), u(22.5), 0);
      for (const sz of [-1, 1]) K.put(rbox(u(1.5), u(3), u(1.5), 0.004), trim, sx * u(12.5), u(19.5), sz * u(1.6));
    }
    // a domed head with glowing eyes, the antenna, and the wind-up key in its back
    const dome = [];
    for (let i = 0; i <= 10; i++) { const a = i / 10 * Math.PI / 2; dome.push([Math.cos(a) * u(9), Math.sin(a) * u(12)]); }
    K.put(lathe([[0.001, 0], ...dome], 28), tin, 0, u(40), 0);
    for (const sx of [-1, 1]) K.put(rbox(u(4), u(3), 0.01, 0.004), K.glow('#f8d030'), sx * u(3.5), u(46.5), u(7.2), sx * 0.35);
    K.put(cyl(u(1), u(6), u(1), 8), trim, 0, u(55), 0);
    K.put(ball(u(2), 12, 10), K.glow('#e04848'), 0, u(59), 0);
    K.put(cyl(u(1), u(5), u(1), 8).rotateX(Math.PI / 2), trim, 0, u(28), -u(10.5));
    for (const sx of [-1, 1]) K.put(torus(u(2.4), u(0.9), TAU, 16), trim, sx * u(2.4), u(28), -u(13));
  },

  spacehopper(K, s, W, D, L) {
    const { ball } = L, rubber = K.gloss(K.pal.c), R = u(13), cy = u(13);
    // a big squashy ball, two horn handles, a cheeky face
    K.put(ball(R, 32, 24).scale(1.04, 0.98, 1.04), rubber, 0, cy, 0);
    for (const sx of [-1, 1]) {
      rod(K, L, rubber, [sx * u(4.5), cy + u(10), 0], [sx * u(5.5), u(34), 0], u(1.7));
      K.put(ball(u(3), 14, 10), rubber, sx * u(5.5), u(36), 0);
    }
    const onIt = (x, y) => Math.sqrt(Math.max(0, (R * 1.04) ** 2 - x * x - ((y - cy) / 0.98) ** 2));
    for (const sx of [-1, 1]) {
      K.put(ball(u(2.4), 14, 10).scale(1, 1, 0.5), K.gloss('#ffffff'), sx * u(4), u(18), onIt(u(4), u(18)));
      K.put(ball(u(1.1), 10, 8), K.gloss(INK), sx * u(4), u(18), onIt(u(4), u(18)) + u(1));
    }
    for (let i = 0; i <= 12; i++) {
      const a = Math.PI * (0.15 + 0.7 * i / 12), x = Math.cos(a) * u(5), y = u(13) - Math.sin(a) * u(3.5);
      K.put(ball(u(0.7), 8, 6), K.gloss(INK), x, y, onIt(x, y));
    }
  },

  marblerun(K, s, W, D, L) {
    const { rbox, ball } = L, wood = K.wood(), zb = u(6);
    // a wooden base and four posts, a cross bar on top
    K.put(rbox(u(28), u(6), u(20), 0.02), wood, 0, u(3), 0);
    for (const x of [X(4.5), X(27.5)]) for (const z of [-zb, zb]) K.put(rbox(u(3), u(82), u(3), 0.008), wood, x, u(47), z);
    for (const x of [X(4.5), X(27.5)]) K.put(rbox(u(3), u(3), zb * 2 + u(3), 0.008), wood, x, u(89), 0);
    // five rainbow chutes zigzagging down between them, marbles rolling, two in the tray at the bottom
    const left = X(6), right = X(26);
    for (let n = 0; n < 5; n++) {
      const yTop = u(80 - n * 15), dir = n % 2 ? -1 : 1, x0 = dir > 0 ? left : right, x1 = dir > 0 ? right : left, y1 = yTop - u(10);
      const len = Math.hypot(x1 - x0, y1 - yTop), ang = Math.atan2(y1 - yTop, x1 - x0), mx = (x0 + x1) / 2, my = (yTop + y1) / 2;
      const col = K.gloss(RAINBOW[n]);
      K.put(rbox(len, u(1), u(5), 0.004), col, mx, my, 0, 0, 0, ang);
      for (const sz of [-1, 1]) K.put(rbox(len, u(2.5), u(0.8), 0.003), col, mx, my + u(1.2), sz * u(2.6), 0, 0, ang);
    }
    for (const [x, y, c] of [[10, 78, K.pal.c], [22, 60, '#4a98d8'], [12, 34, '#f8d030']]) K.put(ball(u(2), 14, 10), K.gloss(c), X(x), u(y) - u(2.5), 0);
    K.put(rbox(u(14), u(2), u(10), 0.01), K.wood(L.tone(K.pal.w, 0.8)), X(16), u(7), 0.04);
    K.put(ball(u(2), 14, 10), K.gloss('#58b848'), X(14), u(10), 0.04);
    K.put(ball(u(2), 14, 10), K.gloss(K.pal.a), X(18), u(10), 0.06);
  },

  toytrain(K, s, W, D, L) {
    const { rbox, cyl, ball, torus } = L, paint = K.gloss(K.pal.c), cargo = K.gloss(K.pal.a), d = 0.36;
    // the engine, facing left: a round boiler on its chassis, the cab with windows, a chimney and a lamp
    K.put(rbox(u(28), u(6), d, 0.015), K.gloss(L.tone(K.pal.c, 0.75)), X(17, 2), u(11), 0);
    K.put(cyl(u(8), u(16), u(8), 28).rotateZ(Math.PI / 2), paint, X(12, 2), u(22), 0);
    K.put(cyl(u(8.4), u(1.5), u(8.4), 28).rotateZ(Math.PI / 2), K.gloss(K.pal.a), X(4.5, 2), u(22), 0);
    for (const x of [8, 15]) K.put(torus(u(8.1), u(0.5), TAU, 28), K.gloss(K.pal.a), X(x, 2), u(22), 0, Math.PI / 2);
    K.put(cyl(u(2.6), u(2), u(2.6), 18).rotateZ(Math.PI / 2), K.glow('#f8f0c0'), X(3.2, 2), u(22), 0);
    K.put(cyl(u(3), u(10), u(2.6), 16), K.gloss(INK), X(9, 2), u(34), 0);
    K.put(cyl(u(4), u(2), u(3), 16), K.gloss(INK), X(9, 2), u(40), 0);
    K.put(rbox(u(14), u(30), d, 0.02), paint, X(25, 2), u(29), 0);
    for (const z of [-1, 1]) K.put(rbox(u(10), u(8), 0.01, 0.004), K.gloss(SKYB), X(25, 2), u(38), z * (d / 2 + 0.002));
    K.put(rbox(u(18), u(3), d + 0.08, 0.01), cargo, X(25, 2), u(45.5), 0);
    // the coupling and the wagon of coloured blocks
    K.put(rbox(u(6), u(2), u(3), 0.004), K.metal(), X(33, 2), u(12), 0);
    K.put(rbox(u(24), u(18), d - 0.04, 0.02), cargo, X(48, 2), u(17), 0);
    for (let n = 0; n < 3; n++) K.put(rbox(u(6), u(6), u(6), 0.01), K.gloss(RAINBOW[n * 2]), X(41 + n * 7, 2), u(29), (n - 1) * 0.04);
    // round wooden wheels both sides
    for (const x of [10, 24, 42, 54]) for (const z of [-1, 1]) {
      K.put(cyl(u(5), u(2.5), u(5), 22).rotateX(Math.PI / 2), K.wood(L.tone(K.pal.w, 0.75)), X(x, 2), u(5), z * (d / 2 + u(1)));
      K.put(cyl(u(2.5), u(3), u(2.5), 16).rotateX(Math.PI / 2), K.wood(), X(x, 2), u(5), z * (d / 2 + u(1.3)));
      K.put(ball(u(0.9), 8, 6), K.metal(), X(x, 2), u(5), z * (d / 2 + u(2.8)));
    }
  },

  stackrings(K, s, W, D, L) {
    const { lathe, cyl, torus, ball } = L;
    // a rounded wooden base, the peg, six rings from big to small and a ball on top
    K.put(lathe([[0.001, 0], [u(11), 0], [u(12), u(2)], [u(11.5), u(5)], [u(10), u(6)], [0.001, u(6)]], 32), K.wood(), 0, 0, 0);
    K.put(cyl(u(1.5), u(46), u(1.5), 12), K.wood(), 0, u(29), 0);
    for (let n = 0; n < 6; n++) {
      const r = u(12 - n * 1.6), tr = u(3.4);
      K.put(torus(r - tr, tr, TAU, 32).scale(1, 1, 0.95), K.gloss(n === 0 ? K.pal.c : RAINBOW[n]), 0, u(9.5 + n * 7), 0, 0, Math.PI / 2);
    }
    K.put(ball(u(4), 18, 14), K.gloss(K.pal.c), 0, u(55), 0);
  },

  puzzlecube(K, s, W, D, L) {
    const { rbox } = L, F = ['#e04848', '#f8d030', '#58b848', '#4a98d8', '#f4f4f0', '#f08030'], c = u(7), R = K.r;
    // 27 black cubies, coloured stickers on the outside, the top layer turned part way
    const core = K.gloss('#26262e'), sticker = (i) => K.gloss(F[i]);
    for (let j = 0; j < 3; j++) for (let i = -1; i <= 1; i++) for (let k = -1; k <= 1; k++) {
      const put = turned(K, 0, 0, j === 2 ? 0.3 : 0), y = c * (j + 0.5);
      put(rbox(c * 0.97, c * 0.97, c * 0.97, c * 0.12), core, i * c, y, k * c);
      const faces = [];
      if (k === 1) faces.push([0, 0, 1, F.indexOf(F[(i + 1 + (2 - j) * 2) % 6])]);
      if (k === -1) faces.push([0, 0, -1, Math.floor(R() * 6)]);
      if (i === 1) faces.push([1, 0, 0, (2 - j) + 2]);
      if (i === -1) faces.push([-1, 0, 0, Math.floor(R() * 6)]);
      if (j === 2) faces.push([0, 1, 0, Math.floor(R() * 6)]);
      for (const [fx, fy, fz, ci] of faces) {
        const g = rbox(fx ? 0.008 : c * 0.78, fy ? 0.008 : c * 0.78, fz ? 0.008 : c * 0.78, 0.004);
        put(g, sticker(ci), i * c + fx * c * 0.49, y + fy * c * 0.49, k * c + fz * c * 0.49);
      }
    }
  },

  toysoldier(K, s, W, D, L) {
    const { rbox, ball, cyl } = L, coat = K.gloss(K.pal.c), gold = K.metal(GOLD), ink = K.gloss(INK), white = K.gloss('#f4f4f0');
    // a green stand, white trousers and black boots, the red coat with its belt and buttons, epaulettes
    K.put(rbox(u(16), u(5), u(14), 0.02), K.gloss('#58b848'), 0, u(2.5), 0);
    for (const x of [X(13.5), X(18.5)]) {
      K.put(cyl(u(2.4), u(20), u(2.4), 14), white, x, u(18), 0);
      K.put(cyl(u(2.6), u(4), u(2.8), 14), ink, x, u(7), 0.005);
    }
    K.put(rbox(u(14), u(22), u(9), 0.03), coat, 0, u(39), 0);
    K.put(rbox(u(14.4), u(3), u(9.4), 0.01), ink, 0, u(28.5), 0);
    K.put(rbox(u(2.5), u(2.5), 0.01, 0.003), gold, 0, u(28.5), u(4.8));
    for (let j = 0; j < 4; j++) K.put(ball(u(0.9), 8, 6), gold, 0, u(46 - j * 4), u(4.6));
    for (const sx of [-1, 1]) {
      K.put(rbox(u(4), u(17), u(4.5), 0.015), coat, sx * u(9), u(39.5), 0);
      K.put(rbox(u(5), u(2.5), u(5.5), 0.01), gold, sx * u(9), u(49), 0);
      for (let i = 0; i < 3; i++) K.put(cyl(u(0.4), u(2), u(0.4), 5), gold, sx * u(9) + (i - 1) * u(1.4), u(47), u(2.6));
      K.put(ball(u(2.2), 12, 10), K.gloss(SKIN), sx * u(9), u(30), 0);
    }
    // the round painted face, rosy cheeks, the tall black shako with its gold band and badge
    K.put(ball(u(6), 22, 16), K.gloss('#fbe0c8'), 0, u(56), 0);
    for (const sx of [-1, 1]) {
      K.put(ball(u(0.8), 8, 6), ink, sx * u(2), u(57), u(5.6));
      K.put(ball(u(1.2), 10, 8).scale(1, 1, 0.4), K.gloss('#f8a8a8'), sx * u(3.2), u(54.5), u(5.1));
    }
    K.put(cyl(u(6), u(16), u(6), 24), ink, 0, u(69), -u(0.5));
    K.put(cyl(u(6.2), u(2), u(6.2), 24), gold, 0, u(62), -u(0.5));
    K.put(rbox(u(2.5), u(4), 0.01, 0.003), gold, 0, u(71), u(5.6));
    K.put(cyl(u(1.2), u(3), u(1.6), 12), K.gloss('#e04848'), 0, u(78.5), -u(0.5));
  },
};
