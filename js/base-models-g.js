/* base-models-g.js  -  Festival, Lab and Castle pieces, modelled from parts like the arcade cabinets (the user's ask, 2026-10-12).
   js/base-models-f.js's head says how a batch works. Most builders here follow their painting (js/base-furniture-rooms3.js)
   pixel for pixel: `u(n)` is n of its 32 pixels a tile, `X(n, W)` a pixel across the painting as x from the middle.
   Left as they were: the rugs and wall pieces, and the starter and banquet tables (already shaped). */

import { rod, tube, pokeBall } from './base-models-kit.js';

const u = (n) => n / 32;
const X = (n, W = 1) => n / 32 - W / 2;
const TAU = Math.PI * 2;
const RAINBOW = ['#e04848', '#f08030', '#f8d030', '#58b848', '#4a98d8', '#5a58c8', '#a858d8'];
const PINK = '#f8a8c8', SKYB = '#a8d8f8', GOLD = '#f0c040', INK = '#303038', ICE = '#bfe6f8', STRAW = '#e0c070', STONE = '#9a9aa6';

const sheet = (w, h, draw) => { const c = new OffscreenCanvas(w, h); draw(c.getContext('2d'), w, h); return c; };
const pics = {};
const once = (key, make) => pics[key] || (pics[key] = make());

/* stripes across a face or round a lathe (its u runs round it) */
const stripes = (a, b, n = 16) => once('stripe' + a + b + n, () => sheet(256, 16, (g, w, h) => {
  for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? a : b; g.fillRect(i * w / n, 0, w / n + 1, h); }
}));
/* the hay bale's straw: streaks on gold */
const straw = () => once('straw', () => sheet(128, 128, (g, w, h) => {
  g.fillStyle = STRAW; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 260; i++) { g.fillStyle = i % 2 ? '#c8a858' : '#f0d890'; g.fillRect((i * 37) % w, (i * 71) % h, 10 + (i % 3) * 4, 2); }
}));
/* the Tesla coil's copper winding */
const winding = () => once('winding', () => sheet(32, 128, (g, w, h) => {
  g.fillStyle = '#e8d8b8'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 6) { g.fillStyle = '#c87838'; g.fillRect(0, y, w, 4); g.fillStyle = '#e09858'; g.fillRect(0, y, w, 1); }
}));
/* a wall of grey blocks, courses offset */
const blocks = (cols, rows) => once('blocks' + cols + rows, () => sheet(256, 256, (g, w, h) => {
  g.fillStyle = '#6e6e7a'; g.fillRect(0, 0, w, h);
  for (let r = 0; r < rows; r++) for (let c = -1; c <= cols; c++) {
    const x = (c + (r % 2) * 0.5) * w / cols, y = r * h / rows, t = (r * 7 + c * 3) % 5;
    g.fillStyle = ['#9a9aa6', '#a4a4b0', '#9090a0', '#a8a8b2', '#94949e'][t];
    g.fillRect(x + 2, y + 2, w / cols - 4, h / rows - 4);
    g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x + 2, y + 2, w / cols - 4, 3);
  }
}));
/* the column's flutes */
const flutes = () => once('flutes', () => sheet(128, 32, (g, w, h) => {
  g.fillStyle = STONE; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 16; i++) { g.fillStyle = '#80808c'; g.fillRect(i * 8 + 2, 0, 3, h); g.fillStyle = '#b0b0ba'; g.fillRect(i * 8 + 5, 0, 1, h); }
}));
/* the archery target's face: rings round a gold bull */
const targetFace = (c, p) => once('target' + c + p, () => sheet(128, 128, (g) => {
  for (const [r, col] of [[64, STRAW], [55, p], [42, c], [29, p], [15, GOLD]]) { g.fillStyle = col; g.beginPath(); g.arc(64, 64, r, 0, TAU); g.fill(); }
}));
/* the monitor on the robot's chest and the panels' screens: lines on dark green */
const readout = (c) => once('readout' + c, () => sheet(64, 48, (g, w, h) => {
  g.fillStyle = '#1a2a2a'; g.fillRect(0, 0, w, h);
  g.strokeStyle = c; g.lineWidth = 3; g.beginPath();
  for (let x = 0; x <= w; x += 2) g.lineTo(x, h / 2 + Math.sin(x / 5) * 12);
  g.stroke();
}));

/** A rounded beam from a to b ([x, y, z] each), `w` x `d` across. */
function beam(K, L, m, a, b, w, d = w) {
  const { THREE } = L, va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b), g = L.rbox(w, va.distanceTo(vb), d, Math.min(w, d) * 0.3);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize()));
  K.put(g, m, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
}
/** A half disc hanging down, facing +z (an awning's scallop). */
const scallop = (L, r, t) => new L.THREE.CylinderGeometry(r, r, t, 16, 1, false, -Math.PI / 2, Math.PI).rotateX(Math.PI / 2);
/** A see-through material that glows a little (a tank's liquid, a beam of light). */
function tint(K, hex, opacity = 0.45, glow = 0.45) {
  const m = K.M('glass', hex, { key: 'tint' + opacity });
  m.opacity = opacity; m.emissive?.set(hex); m.emissiveIntensity = glow;
  return m;
}
/** A leaf (a flattened ball), `len` long, pointing along +x turned `a` about y, tipped up by `tilt`. */
function leaf(K, L, m, x, y, z, len, wid, a = 0, tilt = 0.3) {
  const g = L.ball(1, 10, 8).scale(len / 2, 0.012, wid / 2);
  g.translate(len / 2, 0, 0); g.rotateZ(tilt); g.rotateY(a);
  K.put(g, m, x, y, z);
}
/** A candle flame, `h` tall, its foot at (x, y, z). */
function flame(K, L, x, y, z, h, col = '#f8b040', inner = '#fff4c0') {
  const prof = (k) => [[0, 0], [h * 0.22 * k, h * 0.2], [h * 0.26 * k, h * 0.42], [h * 0.14 * k, h * 0.75], [0, h]];
  K.put(L.lathe(prof(1), 14), K.glow(col), x, y, z);
  K.put(L.lathe(prof(0.55).map(([r, yy]) => [r, yy * 0.6]), 10), K.glow(inner), x, y + 0.004, z + h * 0.05);
}
/** A spoked wheel facing ±z (its axle along z). */
function spoked(K, L, wood, hub, x, y, z, r, t = 0.05, n = 6) {
  K.put(L.torus(r - t * 0.4, t * 0.45, TAU, 28), wood, x, y, z);
  for (let i = 0; i < n; i++) K.put(L.cyl(t * 0.22, r * 1.7, t * 0.22, 6).rotateZ(i / n * Math.PI), wood, x, y, z);
  K.put(L.cyl(r * 0.22, t * 1.6, r * 0.22, 12).rotateX(Math.PI / 2), hub, x, y, z);
}
/** A little plush (the prize stall's): body, head, ears, two bead eyes. */
function plush(K, L, x, y, z, s, col) {
  const fur = K.cloth(col), { ball } = L;
  K.put(ball(0.07 * s, 14, 10).scale(1.1, 0.9, 0.9), fur, x, y + 0.06 * s, z);
  K.put(ball(0.075 * s, 14, 10), fur, x, y + 0.17 * s, z);
  for (const sg of [-1, 1]) {
    K.put(ball(0.028 * s, 8, 6).scale(1, 1.4, 0.8), fur, x + sg * 0.05 * s, y + 0.24 * s, z);
    K.put(ball(0.012 * s, 8, 6), K.gloss(INK), x + sg * 0.028 * s, y + 0.18 * s, z + 0.068 * s);
  }
}
/** A balloon on a lathe, `r` across, its knot at (x, y, z). */
function balloon(K, L, x, y, z, r, col) {
  K.put(L.lathe([[0.001, 0], [r * 0.18, 0.02], [r * 0.18, 0.035], [r * 0.7, r * 0.5], [r, r * 1.15], [r * 0.85, r * 1.7], [r * 0.4, r * 2.05], [0.001, r * 2.15]], 20), K.gloss(col), x, y, z);
}

export const SHAPES = {
  popcornstall: { make: 'stall', goods: 'popcorn' },
  flossstall: { make: 'stall', goods: 'floss' },
  lemonstall: { make: 'stall', goods: 'lemon' },
  balloonstall: { make: 'stall', goods: 'balloon' },
  prizestall: { make: 'stall', goods: 'prize' },
  applestall: { make: 'stall', goods: 'apple' },
  carouselhorse: { make: 'carouselhorse' },
  ferriswheel: { make: 'ferriswheel' },
  balloons: { make: 'balloons' },
  highstriker: { make: 'highstriker' },
  ringtoss: { make: 'ringtoss' },
  ticketbooth: { make: 'ticketbooth' },
  fireworkrack: { make: 'fireworkrack' },
  maypole: { make: 'maypole' },
  festivalstage: { make: 'festivalstage' },
  haybale: { make: 'haybale', seat: 0.69 },
  hookaduck: { make: 'hookaduck' },
  teacupride: { make: 'teacupride', seat: 0.42 },
  eggtank: { make: 'tank', inside: 'egg' },
  helixtank: { make: 'tank', inside: 'helix' },
  dometank: { make: 'tank', inside: 'dome' },
  sprouttank: { make: 'tank', inside: 'sprout' },
  crystaltank: { make: 'tank', inside: 'crystal' },
  orbtank: { make: 'tank', inside: 'orb' },
  labrobot: { make: 'labrobot' },
  robotarm: { make: 'robotarm' },
  hologram: { make: 'hologram' },
  teslacoil: { make: 'teslacoil' },
  cryopod: { make: 'cryopod' },
  tuberack: { make: 'tuberack' },
  centrifuge: { make: 'centrifuge' },
  dnamodel: { make: 'dnamodel' },
  satdish: { make: 'satdish' },
  rocketmodel: { make: 'rocketmodel' },
  labcoat: { make: 'labcoat' },
  armour: { make: 'armour' },
  hoard: { make: 'hoard' },
  swordrack: { make: 'swordrack' },
  cannon: { make: 'cannon' },
  catapult: { make: 'catapult' },
  castlecolumn: { make: 'castlecolumn' },
  crowncushion: { make: 'crowncushion' },
  spinwheel: { make: 'spinwheel' },
  candlestand: { make: 'candlestand' },
  dragonnest: { make: 'dragonnest' },
  battlement: { make: 'battlement' },
  archerytarget: { make: 'archerytarget' },
};

export const MAKES = {
  /* ----- Festival ----- */

  stall(K, s, W, D, L) {
    const { rbox, cyl, ball, lathe } = L, pal = K.pal, wood = K.wood(), post = K.metal(), d = 0.62, w = W - u(4), top = u(32);
    // a wooden counter of panels, a pale top, posts at the four corners up to a striped awning
    K.put(rbox(w, u(26), d, 0.02), wood, 0, u(16), 0);
    K.put(rbox(w - 0.04, u(3), d - 0.04, 0.01), K.wood(L.tone(pal.w, 0.7)), 0, u(1.5), 0.01);
    const panels = Math.round(w / u(14));
    for (let i = 0; i < panels; i++) K.put(rbox(w / panels - 0.06, u(16), 0.02, 0.006), K.wood(L.tone(pal.w, 0.85)), -w / 2 + (i + 0.5) * w / panels, u(14), d / 2);
    K.put(rbox(W - 0.02, u(5), d + 0.08, 0.015), K.gloss(pal.p), 0, top - u(2.5), 0.02);
    const px = W / 2 - u(4.5), back = -d / 2 + 0.03, fr = d / 2 + 0.02;
    for (const x of [-px, px]) for (const z of [back, fr]) K.put(cyl(u(1.5), u(78) - top, u(1.5), 10), post, x, (top + u(78)) / 2, z);
    const aw = K.pic(stripes(pal.c, pal.p, Math.round(W * 8))), lo = u(78), hi = u(86), run = fr - back + 0.16, slope = Math.atan2(hi - lo, run);
    K.put(new L.THREE.BoxGeometry(W + 0.04, 0.02, run / Math.cos(slope)).rotateX(slope), aw, 0, (lo + hi) / 2 + 0.01, (back + fr) / 2 + 0.04);
    K.put(rbox(W + 0.04, u(3), 0.03, 0.01), K.gloss(L.tone(pal.c, 0.8)), 0, lo - u(1), fr + 0.12);
    const n = Math.round(W * 4);
    for (let i = 0; i < n; i++) K.put(scallop(L, (W + 0.04) / n / 2, 0.025), K.gloss(i % 2 ? pal.p : pal.c), -W / 2 - 0.02 + (i + 0.5) * (W + 0.04) / n, lo - u(2.5), fr + 0.12);
    K.put(rbox(W + 0.04, u(2), 0.04, 0.01), K.gloss(L.tone(pal.c, 0.75)), 0, hi + 0.02, back - 0.06);
    // what it sells, on the counter
    const goods = STALL_GOODS[s.goods];
    if (goods) goods(K, L, top, W);
  },

  carouselhorse(K, s, W, D, L) {
    const { rbox, cyl, ball, blob, lathe } = L, pal = K.pal, body = K.gloss(pal.p), gold = K.metal(pal.a), mane = K.gloss(pal.c);
    // a round wooden step, the brass pole through the horse, bands of colour wound round it, a crown at the top
    K.put(lathe([[0.001, 0], [0.46, 0], [0.46, u(4)], [0.44, u(6)], [0.001, u(6)]], 36), K.wood(), 0, 0, 0);
    K.put(cyl(u(2), u(88), u(2), 14), gold, 0, u(6) + u(44), 0);
    for (let y = u(10); y < u(88); y += u(6)) K.put(L.torus(u(2.1), 0.008, TAU, 14).rotateX(Math.PI / 2), mane, 0, y, 0);
    K.put(lathe([[0.001, 0], [u(6), 0], [u(7), u(2)], [u(4), u(4)], [0.001, u(5)]], 20), gold, 0, u(91), 0);
    // the horse side-on, galloping to the right, its back at about a tile and a half; built at 1 and grown by S about
    // its middle, the pole through it
    const y = u(50), S = 1.45;
    const H = (g, m, x, yy, z, ry = 0, rx = 0, rz = 0) => { if (rx) g.rotateX(rx); if (rz) g.rotateZ(rz); if (ry) g.rotateY(ry); g.scale(S, S, S); K.put(g, m, x * S, y + (yy - y) * S, z * S); };
    const at = ([x, yy, z]) => [x * S, y + (yy - y) * S, z * S];
    const limb = (m, a, b, w) => beam(K, L, m, at(a), at(b), w * S);
    H(blob(0.42, 0.17, 0.17, 0.75, 0.75), body, 0, y, 0);
    limb(body, [0.15, y + 0.03, 0], [0.23, y + 0.21, 0], 0.11);
    H(blob(0.19, 0.1, 0.095, 0.7, 0.7), body, 0.27, y + 0.24, 0, 0, 0, -0.5);
    for (const sg of [-1, 1]) H(ball(0.013, 8, 6), K.gloss(INK), 0.3, y + 0.27, sg * 0.042);
    for (const sg of [-1, 1]) H(cyl(0.001, 0.05, 0.02, 6), body, 0.2, y + 0.31, sg * 0.03, 0, 0, 0.3);
    for (let i = 0; i < 6; i++) H(ball(0.036, 10, 8).scale(1, 1.4, 0.6), mane, 0.1 + i * 0.025, y + 0.08 + i * 0.037, 0, 0, 0, 0.6);
    // legs: the front pair tucked up, the back pair reaching down
    for (const z of [-0.05, 0.05]) {
      limb(body, [0.15, y - 0.06, z], [0.25, y - 0.11, z], 0.05);
      limb(body, [0.25, y - 0.11, z], [0.2, y - 0.2, z], 0.042);
      limb(body, [-0.15, y - 0.06, z], [-0.21, y - 0.24, z], 0.05);
      limb(body, [-0.21, y - 0.24, z], [-0.17, y - 0.37, z], 0.042);
    }
    for (const [x, yy] of [[0.2, y - 0.22], [-0.17, y - 0.39]]) H(cyl(0.03, 0.035, 0.03, 10), gold, x, yy, 0);
    for (let i = 0; i < 5; i++) H(ball(0.033, 10, 8).scale(1.4, 1, 0.6), mane, -0.22 - i * 0.02, y + 0.02 - i * 0.04, 0);
    // the saddle, its gold trim
    H(blob(0.15, 0.05, 0.2, 0.6, 0.6), mane, -0.02, y + 0.09, 0);
    H(rbox(0.035, 0.13, 0.18, 0.01), gold, -0.02, y + 0.02, 0);
  },

  ferriswheel(K, s, W, D, L) {
    const { rbox, cyl, ball, torus } = L, pal = K.pal, steel = K.metal(), arm = K.metal(L.tone(pal.m, 1.25)), r = u(30), cy = r + u(22), zw = 0.14;
    K.put(rbox(W - u(4), u(4), 0.7, 0.02), K.wood(), 0, u(2), 0);
    // an A-frame each side up to the hub
    for (const z of [-zw - 0.06, zw + 0.06]) for (const x of [-0.72, 0.68]) beam(K, L, steel, [x, u(4), z], [0, cy, z * 0.85], 0.04);
    K.put(cyl(0.04, 2 * zw + 0.2, 0.04, 12).rotateX(Math.PI / 2), steel, 0, cy, 0);
    // two rims of spokes, lights round them, a gondola hanging from each pair of spokes
    for (const z of [-zw, zw]) {
      K.put(torus(r, 0.016, TAU, 64), K.metal(pal.a), 0, cy, z);
      for (let i = 0; i < 8; i++) K.put(cyl(0.008, r * 2, 0.008, 6).rotateZ(i / 8 * Math.PI), arm, 0, cy, z);
      for (let i = 0; i < 16; i++) { const a = (i + 0.5) / 16 * TAU; K.put(ball(0.018, 8, 6), K.glow(), Math.cos(a) * r, cy + Math.sin(a) * r, z + Math.sign(z) * 0.02); }
    }
    K.put(ball(0.07, 16, 12), K.metal(pal.a), 0, cy, zw + 0.03);
    K.put(ball(0.07, 16, 12), K.metal(pal.a), 0, cy, -zw - 0.03);
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU, gx = Math.cos(a) * r, gy = cy + Math.sin(a) * r, col = i % 2 ? pal.c : RAINBOW[i % 7];
      K.put(cyl(0.008, 2 * zw, 0.008, 6).rotateX(Math.PI / 2), arm, gx, gy, 0);
      K.put(cyl(0.006, 0.06, 0.006, 6), arm, gx, gy - 0.03, 0);
      K.put(rbox(0.13, 0.1, 0.2, 0.03), K.gloss(col), gx, gy - 0.11, 0);
      K.put(rbox(0.15, 0.025, 0.22, 0.01), K.gloss(L.tone(col, 0.8)), gx, gy - 0.05, 0);
    }
  },

  balloons(K, s, W, D, L) {
    const { rbox } = L, pal = K.pal, at = [X(16), u(6), 0.04];
    K.put(rbox(u(8), u(6), u(8), 0.02), K.gloss(pal.a), at[0], u(3), at[2]);
    const string = K.plain('#e8e8e8');
    [[8, 80, 0, -0.05], [22, 82, 4, -0.04], [15, 88, 2, -0.12], [5, 66, 5, 0.08], [25, 68, 6, 0.1]].forEach(([i, j, n, z]) => {
      const top = [X(i), u(j) - u(6), z];
      K.put(tube(L, [at, [(at[0] + top[0]) / 2 + 0.02, (at[1] + top[1]) / 2, (at[2] + top[2]) / 2], top], 0.004, 16), string, 0, 0, 0);
      balloon(K, L, top[0], top[1], top[2], u(5.5), n === 0 ? pal.c : RAINBOW[n]);
    });
  },

  highstriker(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, pal = K.pal, z = -0.1;
    // a tall wooden tower with rainbow marks up its face, a gold bell on top and a red puck on its rail
    K.put(rbox(u(12), u(80), 0.16, 0.02), K.wood(), 0, u(6) + u(40), z);
    K.put(rbox(u(2), u(76), 0.02, 0.004), K.metal(L.tone(pal.w, 0.6)), 0, u(46), z + 0.085);
    for (let n = 0; n < 6; n++) K.put(rbox(u(10), u(2), 0.02, 0.004), K.gloss(RAINBOW[n]), 0, u(19) + n * u(12), z + 0.083);
    K.put(ball(u(4.5), 18, 14), K.metal(GOLD), 0, u(91), z);
    K.put(cyl(0.012, u(4), 0.012, 8), K.metal(GOLD), 0, u(87), z);
    K.put(cyl(u(2), 0.04, u(2), 14).rotateX(Math.PI / 2), K.gloss('#e04848'), 0, u(60), z + 0.1);
    // the base and its red target pad
    K.put(rbox(u(20), u(8), 0.5, 0.02), K.gloss(pal.c), 0, u(4), 0.04);
    K.put(cyl(u(4), u(3), u(4.5), 18), K.gloss('#e04848'), 0, u(9.5), 0.14);
    // the mallet leaning on its right
    beam(K, L, K.wood(), [X(27), 0.01, 0.2], [X(22), u(32), 0.06], 0.035);
    K.put(rbox(u(9), u(6), 0.12, 0.02), K.metal(), X(22.5), u(35), 0.05, 0, 0, -0.16);
  },

  ringtoss(K, s, W, D, L) {
    const { rbox, lathe, torus } = L, pal = K.pal, top = u(22);
    K.put(rbox(u(28), top - u(2), 0.62, 0.02), K.wood(), 0, (top - u(2)) / 2, 0);
    K.put(rbox(u(29), u(2.5), 0.66, 0.01), K.gloss(pal.c), 0, top - u(1.25), 0);
    const bottle = lathe([[0.001, 0], [0.05, 0], [0.052, 0.02], [0.05, 0.14], [0.02, 0.2], [0.016, 0.28], [0.019, 0.29], [0.001, 0.29]], 18).scale(1.25, 1.25, 1.25);
    const cols = ['#a8e098', '#f8a8a8', SKYB];
    for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) {
      const x = X(7 + i * 7 + r * 3), z = 0.12 - r * 0.22, col = cols[(i + r) % 3];
      K.put(bottle.clone(), K.M('glass', col, { key: 'bottle' }), x, top, z);
      K.put(L.cyl(0.052, 0.12, 0.056, 14), K.gloss(L.tone(col, 0.9)), x, top + 0.07, z);
      if ((i + r) % 3 === 0) K.put(torus(0.055, 0.012, TAU, 20).rotateX(Math.PI / 2 - 0.15), K.gloss(pal.c), x, top + 0.22, z);
    }
  },

  ticketbooth(K, s, W, D, L) {
    const { rbox, cyl, lathe } = L, pal = K.pal, d = 0.66, h = u(60);
    // a wooden booth, a window with its pale sill, a ticket sign, a striped dome and a pennant on a pole
    K.put(rbox(u(26), h, d, 0.03), K.wood(), 0, h / 2, 0);
    K.put(rbox(u(18), u(16), 0.04, 0.008), K.plain('#3a3a4a'), 0, u(44), d / 2);
    K.put(new L.THREE.PlaneGeometry(u(16), u(14)), K.M('glass', '#cfe8f4', { key: 'win' }), 0, u(44), d / 2 + 0.022);
    K.put(rbox(u(22), u(3), 0.12, 0.01), K.gloss(pal.p), 0, u(34.5), d / 2 + 0.04);
    K.put(rbox(u(16), u(10), 0.02, 0.006), K.gloss(pal.a), 0, u(25), d / 2 + 0.01);
    K.put(rbox(u(8), u(4), 0.012, 0.004), K.gloss(pal.c), 0, u(25), d / 2 + 0.022);
    const dome = [];
    for (let i = 0; i <= 10; i++) { const a = i / 10 * Math.PI / 2; dome.push([Math.cos(a) * u(17.5), Math.sin(a) * u(14)]); }
    K.put(lathe([[u(18), -0.01], ...dome], 32).scale(1, 1, d / u(26)), K.pic(stripes(pal.p, pal.c, 16)), 0, h, 0);
    K.put(cyl(0.012, u(10), 0.012, 8), K.metal(), 0, h + u(18), 0);
    K.put(L.profileSlab([[0, 0], [0, u(4)], [u(6), u(2)]], 0.01, -0.005).rotateY(Math.PI / 2), K.gloss(pal.c), 0, h + u(18.5), 0);
  },

  fireworkrack(K, s, W, D, L) {
    const { rbox, cyl, lathe } = L, pal = K.pal, top = u(14);
    K.put(rbox(u(26), top, 0.5, 0.02), K.wood(), 0, top / 2, 0);
    K.put(rbox(u(22), u(1.5), 0.42, 0.005), K.wood(L.tone(pal.w, 0.6)), 0, top + 0.001, 0);
    [[8.5, 30, 0, 0.08], [14.5, 40, 1, -0.08], [20.5, 34, 4, 0.06], [26.5, 26, 6, -0.05]].forEach(([i, h, n, z]) => {
      const x = X(i) - u(3), col = n ? RAINBOW[n] : pal.c, len = u(h - 6), y0 = top + u(4);
      K.put(cyl(0.006, u(8), 0.006, 6), K.wood(), x, top + u(4), z);
      K.put(cyl(u(2.5), len, u(2.5), 14), K.gloss(col), x, y0 + len / 2, z);
      K.put(cyl(u(2.6), u(2), u(2.6), 14), K.gloss('#ffffff'), x, y0 + len * 0.5, z);
      K.put(lathe([[u(3), 0], [0.001, u(7)]], 14), K.gloss(pal.a), x, y0 + len, z);
      K.put(cyl(0.004, 0.05, 0.004, 5), K.plain(INK), x, y0 - 0.02, z);
    });
  },

  maypole(K, s, W, D, L) {
    const { lathe, cyl, ball } = L, pal = K.pal, topY = u(86);
    K.put(lathe([[0.001, 0], [u(9), 0], [u(8), u(5)], [0.001, u(5)]], 24), K.wood(), 0, 0, 0);
    K.put(cyl(u(2), topY - u(4), u(2.2), 14), K.gloss(pal.p), 0, (topY + u(4)) / 2, 0);
    // six ribbons from the crown out to the ground, a ring of flowers and a ball on top
    for (let n = 0; n < 6; n++) {
      const a = n / 6 * TAU + 0.3, end = [Math.cos(a) * 0.44, 0.01, Math.sin(a) * 0.4], col = n % 2 ? pal.c : RAINBOW[n];
      K.put(tube(L, [[Math.cos(a) * 0.04, topY - 0.02, Math.sin(a) * 0.04], [Math.cos(a) * 0.26, topY * 0.45, Math.sin(a) * 0.24], end], 0.006, 24).scale(1, 1, 1), K.cloth(col), 0, 0, 0);
      K.put(tube(L, [[Math.cos(a) * 0.04, topY - 0.02, Math.sin(a) * 0.04], [Math.cos(a) * 0.26, topY * 0.45, Math.sin(a) * 0.24], end], 0.006, 24), K.cloth(col), 0, -0.012, 0);
    }
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * TAU, x = Math.cos(a) * 0.09, z = Math.sin(a) * 0.09;
      K.put(ball(0.03, 10, 8).scale(1, 0.6, 1), K.gloss(i % 2 ? '#f890b8' : '#ffffff'), x, topY - 0.01, z);
      K.put(ball(0.012, 8, 6), K.gloss('#f8d030'), x, topY + 0.008, z);
    }
    K.put(ball(u(3), 16, 12), K.metal(pal.a), 0, topY + u(3.5), 0);
  },

  festivalstage(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, pal = K.pal, d = 0.86, deck = u(18), red = K.cloth(pal.c);
    // the deck on a striped skirt, footlights along its front
    K.put(rbox(W - u(2), u(4), d, 0.015), K.wood(), 0, deck - u(2), 0);
    K.put(rbox(W - u(2), deck - u(4), d - 0.04, 0.01), K.gloss(pal.a), 0, (deck - u(4)) / 2, 0);
    for (let x = -W / 2 + u(4); x < W / 2 - u(2); x += u(6)) K.put(rbox(u(2), deck - u(4), 0.01, 0.002), K.gloss(L.tone(pal.a, 0.8)), x, (deck - u(4)) / 2, d / 2 - 0.015);
    for (const x of [X(16, W), -X(16, W)]) { K.put(rbox(u(7), u(4), 0.1, 0.01), K.metal(), x, deck + u(2), d / 2 - 0.08); K.put(ball(u(2.6), 12, 10).scale(1, 1, 0.5), K.glow('#f8f0c0'), x, deck + u(2), d / 2 - 0.03); }
    // pleated curtains each side, a scalloped valance over the top
    for (const sg of [-1, 1]) {
      const x0 = sg * (W / 2 - u(5));
      for (let i = 0; i < 4; i++) K.put(cyl(0.035, u(70), 0.045, 10), red, x0 + sg * (i - 1.5) * 0.04 * -1, deck + u(35), -d / 2 + 0.08 + i * 0.07);
      K.put(cyl(0.05, 0.04, 0.05, 10), K.metal(pal.a), x0, deck + u(26), -d / 2 + 0.2);
    }
    K.put(rbox(W, u(6), 0.1, 0.02), red, 0, u(87), -d / 2 + 0.25);
    K.put(rbox(W, u(2), 0.11, 0.008), K.metal(pal.a), 0, u(89.5), -d / 2 + 0.25);
    for (let i = 0; i < W * 6; i++) K.put(scallop(L, W / (W * 6) / 2, 0.04), red, -W / 2 + (i + 0.5) / 6, u(84), -d / 2 + 0.25);
    for (const sg of [-1, 1]) K.put(rbox(0.06, u(90), 0.06, 0.015), K.wood(L.tone(pal.w, 0.75)), sg * (W / 2 - 0.03), u(45), -d / 2 + 0.25);
    // a microphone on its stand in the middle
    K.put(cyl(0.05, 0.015, 0.06, 14), K.metal(), 0, deck + 0.008, 0.06);
    K.put(cyl(0.008, u(14), 0.008, 8), K.metal(), 0, deck + u(7), 0.06);
    K.put(ball(0.03, 12, 10).scale(1, 1.3, 1), K.metal(L.tone(pal.m, 0.6)), 0, deck + u(15), 0.06);
  },

  haybale(K, s, W, D, L) {
    const { rbox } = L, pal = K.pal, h = u(22);
    K.put(rbox(u(28), h, 0.62, 0.05, 3), K.pic(straw()), 0, h / 2, 0);
    for (const x of [X(9), X(23)]) K.put(rbox(u(2), h + 0.01, 0.63, 0.01), K.cloth(pal.c), x, h / 2, 0);
  },

  hookaduck(K, s, W, D, L) {
    const { lathe, cyl, ball, blob } = L, pal = K.pal, R = W / 2 - 0.06, h = 0.3;
    // a round paddling pool: its puffed rim with pale spots, the water a little below it
    K.put(L.torus(R - 0.08, 0.09, TAU, 48).rotateX(Math.PI / 2), K.gloss(pal.c), 0, h - 0.09, 0);
    K.put(cyl(R - 0.08, h - 0.08, R - 0.08, 48), K.gloss(pal.c), 0, (h - 0.08) / 2, 0);
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; K.put(ball(0.05, 10, 8).scale(1, 0.4, 1), K.gloss(pal.p), Math.cos(a) * (R - 0.08), h - 0.01, Math.sin(a) * (R - 0.08)); }
    K.put(cyl(R - 0.16, 0.01, R - 0.16, 48), K.gloss('#4a98d8'), 0, h - 0.06, 0);
    K.put(cyl(R - 0.3, 0.012, R - 0.3, 48), K.gloss('#68b8f0'), 0, h - 0.058, 0);
    // six rubber ducks bobbing round it
    for (let n = 0; n < 6; n++) {
      const a = n / 6 * TAU, x = Math.cos(a) * 0.44, z = Math.sin(a) * 0.44, y = h - 0.06, turn = -a + Math.PI / 2;
      const g = new L.THREE.Group();
      K.put(blob(0.16, 0.09, 0.11, 0.8, 0.75).rotateY(turn), K.gloss('#f8d030'), x, y + 0.03, z);
      const hx = x + Math.cos(-turn) * 0.05, hz = z - Math.sin(-turn) * 0.05;
      K.put(ball(0.045, 14, 10), K.gloss('#f8d030'), hx, y + 0.1, hz);
      K.put(ball(0.025, 10, 8).scale(1.4, 0.5, 1).rotateY(turn), K.gloss('#f08030'), hx + Math.cos(-turn) * 0.045, y + 0.095, hz - Math.sin(-turn) * 0.045);
      void g;
    }
  },

  teacupride(K, s, W, D, L) {
    const { lathe, cyl, ball, torus } = L, pal = K.pal, cup = K.gloss(pal.c), cream = K.gloss(pal.p);
    // a round turntable, the cup on it: spotted outside, cream inside, a handle, the wheel in the middle
    K.put(lathe([[0.001, 0], [0.47, 0], [0.48, u(2)], [0.46, u(4)], [0.001, u(4)]], 40), K.metal(pal.a), 0, 0, 0);
    const out = [[0.001, u(4)], [0.22, u(4)], [0.3, u(7)], [0.37, u(14)], [0.41, u(24)], [0.42, u(30)]];
    K.put(lathe(out, 40), cup, 0, 0, 0);
    K.put(lathe([[0.4, u(30)], [0.39, u(24)], [0.35, u(14)], [0.2, u(10)], [0.001, u(10)]], 40), cream, 0, 0, 0);
    K.put(torus(0.41, 0.018, TAU, 48).rotateX(Math.PI / 2), cream, 0, u(30), 0);
    for (const [a, y] of [[0.5, 12], [1.3, 18], [2.2, 12], [2.9, 20], [3.8, 13], [4.6, 19], [5.5, 14], [-0.3, 21]]) {
      const r = (y < 14 ? 0.3 + (y - 7) / 7 * 0.07 : 0.37 + (y - 14) / 10 * 0.04) + 0.004;
      K.put(ball(0.035, 10, 8).scale(1, 1, 0.3).rotateY(-a + Math.PI / 2), cream, Math.cos(a) * r, u(y), Math.sin(a) * r);
    }
    K.put(torus(0.1, 0.028, Math.PI * 1.3, 20).rotateZ(-Math.PI * 0.65), cup, 0.47, u(20), 0);
    K.put(cyl(0.02, u(14), 0.02, 8), K.metal(), 0, u(10) + u(7), 0);
    K.put(torus(0.1, 0.014, TAU, 24).rotateX(Math.PI / 2 - 0.25), K.metal(), 0, u(24), 0.02);
  },
  /* ----- Lab ----- */

  tank(K, s, W, D, L) {
    const { cyl, rbox, ball } = L, pal = K.pal, steel = K.metal(L.tone(pal.m, 1.2)), r = u(9.5), y0 = u(12), y1 = u(73);
    // a metal base with its lights, a glass cylinder of glowing liquid, a cap and a pipe out of the top
    K.put(cyl(u(13), y0, u(13.5), 32), steel, 0, y0 / 2, 0);
    K.put(rbox(u(4), u(2), 0.02, 0.004), K.glow('#68e868'), X(8), u(7), u(13));
    K.put(rbox(u(4), u(2), 0.02, 0.004), K.glow(pal.a), X(14), u(7), u(13));
    K.put(cyl(r - 0.012, y1 - y0 - 0.02, r - 0.012, 32), tint(K, pal.g, 0.5, 0.5), 0, (y0 + y1) / 2, 0);
    K.put(cyl(r, y1 - y0, r, 32, true), K.glass(), 0, (y0 + y1) / 2, 0);
    K.put(cyl(u(13), u(7), u(13), 32), steel, 0, y1 + u(3.5), 0);
    K.put(L.torus(u(13), 0.012, TAU, 32).rotateX(Math.PI / 2), K.metal(L.tone(pal.m, 1.6)), 0, y1 + u(6.5), 0);
    K.put(cyl(u(2), u(8), u(2), 12), K.metal(L.tone(pal.m, 0.8)), 0, y1 + u(11), 0);
    const R = K.r;
    for (let i = 0; i < 12; i++) K.put(ball(0.008 + R() * 0.01, 8, 6), K.gloss('#ffffff'), (R() - 0.5) * r * 1.4, y0 + 0.05 + R() * (y1 - y0 - 0.1), (R() - 0.5) * r * 1.4);
    TANK_HOLDS[s.inside]?.(K, L, u(42));
  },

  labrobot(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, pal = K.pal, shell = K.gloss(L.tone(pal.m, 1.35)), dark = K.gloss(L.tone(pal.m, 0.8));
    // two ribbed feet, a chest with a screen, arms with coloured cuffs, a boxy head with glowing eyes and an aerial
    for (const x of [X(8), X(24)]) {
      K.put(rbox(u(8), u(10), 0.34, 0.025), dark, x, u(5), 0.02);
      for (let j = 0; j < 3; j++) K.put(rbox(u(8.2), 0.01, 0.345, 0.003), K.gloss(L.tone(pal.m, 0.6)), x, u(1.5) + j * u(3), 0.02);
    }
    K.put(rbox(u(20), u(30), 0.34, 0.05), shell, 0, u(25), 0);
    K.put(rbox(u(12), u(10), 0.02, 0.008), K.plain('#1a2a2a'), 0, u(29), 0.17);
    for (let n = 0; n < 3; n++) K.put(rbox(u(2), u(2), 0.01, 0.003), K.glow(RAINBOW[n * 2]), X(13 + n * 3), u(31 - n * 2), 0.182);
    for (const sg of [-1, 1]) {
      K.put(ball(u(3.5), 14, 10), dark, sg * u(11.5), u(36), 0);
      K.put(cyl(u(2.5), u(16), u(2.5), 14), shell, sg * u(13.5), u(28), 0, 0, 0, sg * 0.12);
      K.put(cyl(u(3.2), u(3), u(3.2), 14), K.gloss(pal.a), sg * u(14.5), u(19.5), 0);
      for (const dz of [-0.03, 0.03]) K.put(rbox(0.02, 0.06, 0.02, 0.006), dark, sg * u(14.8), u(16), dz);
    }
    K.put(cyl(u(3), u(3), u(3), 12), dark, 0, u(41), 0);
    K.put(rbox(u(16), u(16), 0.3, 0.05), K.gloss(pal.c), 0, u(50), 0);
    K.put(rbox(u(11), u(5.5), 0.02, 0.01), K.plain('#1a2a2a'), 0, u(50.5), 0.15);
    for (const x of [X(13.5), X(18.5)]) K.put(rbox(u(3), u(3), 0.012, 0.004), K.glow(), x, u(50.5), 0.162);
    for (const sg of [-1, 1]) K.put(cyl(u(1.5), 0.04, u(1.5), 12).rotateZ(Math.PI / 2), dark, sg * u(8.5), u(50), 0);
    K.put(cyl(0.008, u(8), 0.008, 6), dark, 0, u(62), 0);
    K.put(ball(u(2.5), 12, 10), K.glow('#e04848'), 0, u(67.5), 0);
  },

  robotarm(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, pal = K.pal, steel = K.metal(L.tone(pal.m, 1.25)), arm = K.gloss(pal.c), joint = K.metal(L.tone(pal.m, 0.9));
    // a base and turntable, two arm sections bent at the elbow, a two-fingered gripper, a cable down the side
    K.put(rbox(u(24), u(10), 0.6, 0.03), steel, 0, u(5), 0);
    K.put(cyl(u(7), u(4), u(7.5), 24), joint, 0, u(12), 0);
    const sh = [0, u(16), 0], el = [X(10), u(48), 0], wr = [X(25), u(64), 0];
    K.put(ball(u(4), 16, 12), joint, ...sh);
    beam(K, L, arm, sh, el, u(5), 0.15);
    K.put(cyl(u(4), 0.2, u(4), 18).rotateX(Math.PI / 2), joint, ...el);
    beam(K, L, arm, el, wr, u(4), 0.12);
    K.put(ball(u(3), 14, 10), joint, ...wr);
    for (const sg of [-1, 1]) {
      beam(K, L, K.metal(pal.a), wr, [wr[0] + sg * u(4), wr[1] - u(6), 0], 0.025, 0.06);
      beam(K, L, K.metal(pal.a), [wr[0] + sg * u(4), wr[1] - u(6), 0], [wr[0] + sg * u(2), wr[1] - u(10), 0], 0.022, 0.06);
    }
    K.put(tube(L, [[u(3), u(10), -0.1], [X(13), u(30), -0.09], [X(9), u(44), -0.09]], 0.012, 20), K.plain(pal.a), 0, 0, 0);
  },

  hologram(K, s, W, D, L) {
    const { rbox, cyl, lathe, torus } = L, pal = K.pal, beamCol = '#88f0ff';
    // a projector on the floor, a faint cone of light rising out of it (the picture floats over it: js/base-play.js)
    K.put(rbox(u(20), u(8), 0.5, 0.04), K.metal(L.tone(pal.m, 1.2)), 0, u(4), 0);
    K.put(cyl(u(6.5), u(1.5), u(7), 24), K.metal(L.tone(pal.m, 0.7)), 0, u(8.5), 0);
    K.put(cyl(u(5.5), u(1), u(5.5), 24), K.glow(beamCol), 0, u(9.5), 0);
    for (let i = 0; i < 4; i++) K.put(rbox(u(2), u(1), 0.01, 0.003), K.glow(i % 2 ? '#68e868' : beamCol), X(9 + i * 4.5), u(4), 0.252);
    K.put(lathe([[u(5), 0], [u(13), u(30)]], 32, true), tint(K, beamCol, 0.18, 0.9), 0, u(10), 0);
    K.put(torus(u(13), 0.006, TAU, 40).rotateX(Math.PI / 2), K.glow(beamCol), 0, u(40), 0);
  },

  teslacoil(K, s, W, D, L) {
    const { rbox, cyl, torus } = L, pal = K.pal, steel = K.metal(L.tone(pal.m, 1.2));
    // a metal base, a pale column wound with copper, a doughnut on top, bolts arcing off it
    K.put(rbox(u(22), u(10), 0.6, 0.03), steel, 0, u(5), 0);
    K.put(cyl(u(6), u(3), u(7), 20), K.metal(L.tone(pal.m, 0.8)), 0, u(11.5), 0);
    K.put(cyl(u(5), u(46), u(5), 24), K.pic(winding()), 0, u(13) + u(23), 0);
    K.put(cyl(u(1.5), u(4), u(1.5), 10), steel, 0, u(60), 0);
    K.put(torus(u(7.5), u(3), TAU, 32).rotateX(Math.PI / 2), K.metal('#d8dce4'), 0, u(62), 0);
    const bolt = K.glow('#c8f0ff');
    for (const [pts, z] of [[[[16, 64], [12, 74], [16, 78], [10, 88]], 0.04], [[[20, 64], [26, 72], [24, 78], [30, 86]], -0.05], [[[6, 62], [2, 70], [5, 76]], 0.02]]) {
      for (let n = 1; n < pts.length; n++) rod(K, L, bolt, [X(pts[n - 1][0]), u(pts[n - 1][1]), z], [X(pts[n][0]), u(pts[n][1]), z], 0.008);
    }
  },

  cryopod(K, s, W, D, L) {
    const { rbox, ball, cyl } = L, pal = K.pal, shell = K.gloss(L.tone(pal.m, 1.35)), d = 0.5;
    // an upright capsule, an icy glowing window in its front behind glass, a panel at its foot, a handle
    K.put(rbox(u(26), u(84), d, 0.13, 3), shell, 0, u(43), 0);
    K.put(rbox(u(17), u(60), 0.04, 0.07, 3), K.gloss(L.tone(pal.m, 0.8)), 0, u(48), d / 2 - 0.01);
    K.put(rbox(u(15), u(57), 0.03, 0.06, 3), K.glow(ICE), 0, u(48), d / 2 + 0.005);
    const R = K.r;
    for (let i = 0; i < 18; i++) K.put(ball(0.008 + R() * 0.012, 8, 6).scale(1, 1, 0.3), K.glow('#ffffff'), (R() - 0.5) * u(13), u(22) + R() * u(52), d / 2 + 0.022);
    K.put(rbox(u(16), u(57), 0.02, 0.06, 3), K.glass(), 0, u(48), d / 2 + 0.03);
    K.put(rbox(u(14), u(6), 0.02, 0.008), K.plain('#1a2a2a'), 0, u(11), d / 2 + 0.005);
    K.put(rbox(u(6), u(2), 0.01, 0.003), K.glow('#68b8f0'), X(13), u(11), d / 2 + 0.017);
    K.put(ball(u(1), 8, 6), K.glow('#68e868'), X(19.5), u(11), d / 2 + 0.017);
    K.put(rbox(u(3), u(14), 0.06, 0.012), K.gloss(pal.a), X(4.5), u(43), d / 2 - 0.02);
    for (const sg of [-1, 1]) K.put(cyl(0.03, 0.04, 0.03, 12).rotateX(Math.PI / 2), K.metal(L.tone(pal.m, 0.7)), sg * u(10), u(80), d / 2 - 0.03);
  },

  tuberack(K, s, W, D, L) {
    const { rbox, cyl, ball, lathe } = L, pal = K.pal, steel = K.metal(L.tone(pal.m, 1.2)), top = u(30);
    // a small pale-topped stand on metal legs, a wooden rack of coloured tubes on it and a round flask
    for (const x of [X(7), X(25)]) for (const z of [-0.16, 0.16]) K.put(cyl(u(1), top - u(2), u(1), 10), steel, x, (top - u(2)) / 2, z);
    K.put(rbox(u(26), u(3), 0.44, 0.012), K.gloss(pal.p), 0, top - u(1.5), 0);
    for (const y of [top + u(1.5), top + u(5.5)]) K.put(rbox(u(24), u(2), 0.14, 0.006), K.wood(), X(15), y, 0);
    for (const sg of [-1, 1]) K.put(rbox(u(2), u(8), 0.12, 0.006), K.wood(), X(15) + sg * u(11), top + u(4), 0);
    ['#e04848', '#58b848', '#4a98d8', pal.c, '#f8d030'].forEach((c, n) => {
      const x = X(7.5 + n * 4);
      K.put(lathe([[0.001, 0], [u(1.3), u(1)], [u(1.5), u(2)], [u(1.5), u(14)], [0.001, u(14)]], 12), K.M('glass', '#e8f4f8', { key: 'tube' }), x, top, 0);
      K.put(cyl(u(1.3), u(7), u(1.3), 12), K.gloss(c), x, top + u(9), 0);
    });
    K.put(lathe([[0.001, 0], [u(3.5), u(0.5)], [u(4), u(3)], [u(1.2), u(7)], [u(1.2), u(9)], [0.001, u(9)]], 18), K.M('glass', '#e8f4f8', { key: 'flask' }), X(26), top, 0.04);
    K.put(ball(u(3.2), 14, 10).scale(1, 0.8, 1), K.gloss(pal.a), X(26), top + u(2.6), 0.04);
  },

  centrifuge(K, s, W, D, L) {
    const { rbox, cyl, torus, ball } = L, pal = K.pal, h = u(30);
    // a pale box, a round lid on top, a readout and two buttons on its front
    K.put(rbox(u(26), h, 0.62, 0.05), K.gloss(pal.p), 0, h / 2, 0);
    K.put(rbox(u(24), u(2), 0.6, 0.01), K.gloss(L.tone(pal.p, 0.7)), 0, u(1), 0.01);
    K.put(cyl(u(11), u(2), u(11.5), 32), K.metal(L.tone(pal.m, 1.2)), 0, h + u(1), -0.02);
    K.put(L.lathe([[0.001, 0], [u(9), 0], [u(8.5), u(1.5)], [u(5), u(3)], [0.001, u(3.2)]], 32), K.gloss(pal.c), 0, h + u(2), -0.02);
    K.put(torus(u(3), 0.01, TAU, 20).rotateX(Math.PI / 2), K.gloss(L.tone(pal.c, 0.7)), 0, h + u(4.6), -0.02);
    K.put(rbox(u(12), u(6), 0.02, 0.006), K.plain('#1a2a2a'), X(12), u(9), 0.31);
    K.put(rbox(u(8), u(2), 0.01, 0.003), K.glow('#68e868'), X(11), u(9), 0.322);
    K.put(cyl(u(2), 0.02, u(2), 14).rotateX(Math.PI / 2), K.gloss('#e04848'), X(23), u(9), 0.315);
    K.put(cyl(u(2), 0.02, u(2), 14).rotateX(Math.PI / 2), K.gloss(pal.a), X(23), u(16), 0.315);
  },

  dnamodel(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, pal = K.pal, r = u(10);
    // a wooden foot, a metal rod, the double helix wound round it: two strands of beads joined by white rungs
    K.put(rbox(u(20), u(6), 0.4, 0.02), K.wood(), 0, u(3), 0);
    K.put(cyl(u(1), u(80), u(1), 10), K.metal(L.tone(pal.m, 1.2)), 0, u(46), 0);
    const a = [], b = [];
    for (let n = 0; n < 14; n++) {
      const y = u(12) + n * u(5.5), t = n * 0.7, p = [Math.sin(t) * r, y, Math.cos(t) * r], q = [-p[0], y, -p[2]];
      a.push(p); b.push(q);
      K.put(ball(u(2.4), 14, 10), K.gloss(pal.c), ...p);
      K.put(ball(u(2.4), 14, 10), K.gloss(pal.a), ...q);
      rod(K, L, K.gloss('#e8e8e8'), p, q, 0.009);
    }
    K.put(tube(L, a, 0.01, 80), K.gloss(L.tone(pal.c, 0.85)), 0, 0, 0);
    K.put(tube(L, b, 0.01, 80), K.gloss(L.tone(pal.a, 0.85)), 0, 0, 0);
  },

  satdish(K, s, W, D, L) {
    const { lathe, ball, cyl } = L, pal = K.pal, steel = K.metal(L.tone(pal.m, 1.2)), hub = [0, u(34), 0];
    // a tripod, the dish tipped up to the sky on it, the feed on its arm
    for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + Math.PI / 2; rod(K, L, steel, hub, [Math.cos(a) * 0.36, 0, Math.sin(a) * 0.32], 0.018); }
    K.put(ball(0.04, 12, 10), steel, ...hub);
    const dish = [];
    for (let i = 0; i <= 12; i++) { const rr = i / 12 * 0.42; dish.push([rr, rr * rr * 0.9]); }
    const g = new L.THREE.Group();
    void g;
    const tilt = -0.75, cy = u(46);
    K.put(lathe(dish, 36), K.gloss(pal.p), 0, cy, 0.04, 0, tilt);
    K.put(lathe(dish.map(([rr, y]) => [rr, y - 0.012]).reverse(), 36), K.gloss(L.tone(pal.p, 0.8)), 0, cy, 0.04, 0, tilt);
    rod(K, L, steel, hub, [0, cy, 0.04], 0.02);
    const tip = [0, cy + Math.cos(tilt) * 0.34, 0.04 - Math.sin(tilt) * 0.34];
    rod(K, L, steel, [0, cy, 0.04], tip, 0.008);
    for (const sg of [-1, 1]) rod(K, L, steel, [sg * 0.3, cy + Math.cos(tilt) * 0.08, 0.04 - Math.sin(tilt) * 0.08 + 0.0], tip, 0.005);
    K.put(ball(u(2), 12, 10), K.gloss(pal.c), ...tip);
  },

  rocketmodel(K, s, W, D, L) {
    const { rbox, cyl, lathe, torus } = L, pal = K.pal, fin = K.gloss(pal.c), y0 = u(14);
    // a metal stand, the rocket on its fins: a pale body, a red nose, a porthole and a band
    K.put(rbox(u(28), u(6), 0.6, 0.02), K.metal(L.tone(pal.m, 1.2)), 0, u(3), 0);
    K.put(lathe([[u(3), 0], [u(5), u(6)], [0.001, u(6)]], 20), K.metal(L.tone(pal.m, 0.8)), 0, u(6), 0);
    K.put(cyl(u(7), u(58), u(7), 28), K.gloss(pal.p), 0, y0 + u(29), 0);
    const nose = [];
    for (let i = 0; i <= 10; i++) nose.push([u(7) * Math.sqrt(1 - i / 10), i / 10 * u(18)]);
    K.put(lathe(nose, 28), fin, 0, y0 + u(58), 0);
    K.put(cyl(u(7.15), u(2), u(7.15), 28), fin, 0, y0 + u(24), 0);
    K.put(torus(u(3.5), 0.012, TAU, 20), K.metal(L.tone(pal.m, 1.3)), 0, u(54), u(7));
    K.put(cyl(u(3.2), 0.01, u(3.2), 20).rotateX(Math.PI / 2), K.gloss(SKYB), 0, u(54), u(7) - 0.002);
    for (let i = 0; i < 4; i++) {
      const g = L.profileSlab([[u(6.5), y0 + u(22)], [u(16), y0 - u(8)], [u(16), y0 - u(14) + u(6)], [u(6.5), y0 - u(2)]], 0.025, -0.0125);
      K.put(g.rotateY(Math.PI / 4 + i * Math.PI / 2), fin, 0, 0, 0);
    }
  },

  labcoat(K, s, W, D, L) {
    const { rbox, cyl, lathe, ball } = L, pal = K.pal, steel = K.metal(L.tone(pal.m, 1.2)), coat = K.cloth('#f4f4f0'), seam = K.cloth('#d8d8e0');
    // a tripod stand with a hanger bar, a white coat hung on it: lapels, sleeves, a pocket of pens
    for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + Math.PI / 2; rod(K, L, steel, [0, u(5), 0], [Math.cos(a) * 0.24, 0.005, Math.sin(a) * 0.22], 0.012); }
    K.put(cyl(u(1), u(84), u(1), 10), steel, 0, u(46), -0.04);
    K.put(rbox(u(16), u(2), 0.04, 0.01), steel, 0, u(83), -0.04);
    const body = [[0.001, u(28)], [u(12.5), u(28)], [u(10.5), u(46)], [u(9), u(62)], [u(7.5), u(76)], [u(5), u(81)], [0.001, u(82)]];
    K.put(lathe(body, 28).scale(1, 1, 0.5), coat, 0, 0, -0.03);
    const zf = (r) => r * 0.5 - 0.03 + 0.006;
    for (const sg of [-1, 1]) {
      beam(K, L, seam, [sg * u(1), u(54), zf(u(10))], [sg * u(5), u(78), zf(u(7.8))], 0.012, 0.006);
      beam(K, L, coat, [sg * u(8), u(77), -0.02], [sg * u(11), u(46), 0], u(5), 0.11);
      K.put(cyl(u(2.4), u(2), u(2.4), 12), K.cloth('#e8e8ee'), sg * u(11.1), u(45), 0);
    }
    K.put(rbox(u(1), u(26), 0.006, 0.002), seam, 0, u(41), zf(u(11)));
    K.put(rbox(u(6), u(6), 0.02, 0.006), K.cloth('#e8e8ee'), X(20), u(60), zf(u(9)) + 0.006);
    for (const [x, c] of [[19, pal.c], [21, '#4a78d8']]) K.put(cyl(0.007, u(5), 0.007, 6), K.gloss(c), X(x), u(63.5), zf(u(9)) + 0.01);
    for (let i = 0; i < 3; i++) K.put(ball(0.012, 8, 6), K.gloss('#c8c8d0'), 0.03, u(52) - i * u(7), zf(u(10.5 - i * 0.5)) + 0.004);
  },

  /* ----- Castle ----- */

  armour(K, s, W, D, L) {
    const { rbox, cyl, ball, blob, lathe } = L, pal = K.pal, steel = K.metal(L.tone(pal.m, 1.5)), dark = K.metal(L.tone(pal.m, 1.1)), gold = K.metal(pal.a);
    // a stone plinth, legs, a breastplate with a gold belt, round pauldrons, a helm with its visor and a plume
    K.put(rbox(u(20), u(6), 0.5, 0.02), K.plain(STONE), 0, u(3), 0);
    for (const sg of [-1, 1]) {
      K.put(lathe([[u(3), 0], [u(3.2), u(8)], [u(2.4), u(12)], [u(2.8), u(16)], [u(3.2), u(26)], [0.001, u(26)]], 16), steel, sg * u(3.5), u(6), 0);
      K.put(rbox(u(7), u(4), 0.2, 0.02), dark, sg * u(3.5), u(8), 0.03);
      K.put(ball(u(2.6), 12, 10), dark, sg * u(3.5), u(20), 0.06);
    }
    K.put(blob(u(16), u(26), 0.24, 0.55, 0.7), steel, 0, u(45), 0);
    K.put(rbox(u(1), u(20), 0.02, 0.004), K.metal(L.tone(pal.m, 2)), 0, u(47), 0.118);
    K.put(cyl(u(8.3), u(3), u(8.3), 24).scale(1, 1, 0.75), gold, 0, u(34), 0);
    for (const sg of [-1, 1]) {
      K.put(ball(u(4.5), 16, 12).scale(1, 0.85, 1), steel, sg * u(10), u(56), 0);
      K.put(cyl(u(2.4), u(20), u(2.2), 14), dark, sg * u(11), u(43), 0, 0, 0, sg * -0.08);
      K.put(ball(u(2.6), 12, 10), steel, sg * u(11.8), u(32), 0.02);
    }
    K.put(cyl(u(3), u(4), u(4), 14), dark, 0, u(60), 0);
    K.put(ball(u(7), 22, 16).scale(1, 1.1, 1), steel, 0, u(67), 0);
    for (let i = 0; i < 3; i++) K.put(rbox(u(9), u(0.8), 0.02, 0.003), K.plain(INK), 0, u(68) - i * u(3), u(6.6));
    K.put(rbox(u(1), u(14), 0.02, 0.003), K.metal(L.tone(pal.m, 2)), 0, u(69), u(6.9));
    for (let n = 0; n < 5; n++) K.put(ball(u(2.4), 10, 8).scale(0.7, 1.6, 1), K.cloth(pal.c), 0, u(76) + n * u(1.2), -0.04 - n * 0.03, 0, -0.5 - n * 0.2);
    // a halberd in its right hand
    K.put(cyl(u(1), u(90), u(1), 8), K.wood(), X(30), u(47), 0.04);
    K.put(L.lathe([[0.001, 0], [u(2.4), u(1)], [0.001, u(8)]], 10), steel, X(30), u(92), 0.04);
    K.put(L.profileSlab([[0, 0], [u(5), u(2)], [u(5), u(6)], [0, u(8)]], 0.012, -0.006).rotateY(Math.PI / 2), steel, X(30), u(82), 0.04);
  },

  hoard(K, s, W, D, L) {
    const { rbox, cyl, ball, lathe, THREE } = L, pal = K.pal, R = K.r, wood = K.wood(), inner = K.wood(L.tone(pal.w, 0.7)), band = K.metal(pal.a);
    const golds = [K.metal(GOLD), K.metal(L.tone(GOLD, 1.12)), K.metal(L.tone(GOLD, 0.88))];
    const coin = (x, y, z, ry = R() * 3, rx = (R() - 0.5) * 0.9, rz = (R() - 0.5) * 0.9) => K.put(cyl(0.034, 0.009, 0.034, 14), golds[(R() * 3) | 0], x, y, z, ry, rx, rz);
    // a big chest at the back, standing on the floor, its lid thrown open against its hinges
    const cx = 0.1, cz = -0.16, w = 0.62, d = 0.4, h = 0.34;
    K.put(rbox(w, h, d, 0.02), wood, cx, h / 2, cz);
    for (const x of [-w / 2 + 0.05, 0, w / 2 - 0.05]) K.put(rbox(0.035, h + 0.004, d + 0.012, 0.006), band, cx + x, h / 2, cz);
    K.put(rbox(w + 0.012, 0.035, d + 0.012, 0.006), band, cx, h - 0.02, cz);
    K.put(rbox(0.07, 0.08, 0.02, 0.008), K.metal(GOLD), cx, h - 0.06, cz + d / 2 + 0.008);
    const open = 1.95, hinge = [cx, h, cz - d / 2];
    const lid = (g) => g.translate(0, 0, d / 2).rotateX(-open);
    K.put(lid(rbox(w, 0.04, d, 0.015).translate(0, 0.02, 0)), inner, ...hinge);
    K.put(lid(new THREE.CylinderGeometry(d / 2, d / 2, w, 24, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).scale(1, 0.55, 1).translate(0, 0.04, 0)), wood, ...hinge);
    for (const x of [-w / 2 + 0.05, w / 2 - 0.05]) K.put(lid(rbox(0.035, 0.05, d + 0.01, 0.006).translate(x, 0.02, 0)), band, ...hinge);
    // the chest full to the brim, a mound of coins over its top
    K.put(lathe([[w * 0.47, 0], [w * 0.4, 0.05], [w * 0.2, 0.09], [0.001, 0.1]], 28).scale(1, 1, d / w), golds[2], cx, h - 0.03, cz);
    for (let i = 0; i < 40; i++) {
      const a = R() * TAU, rr = Math.sqrt(R()) * w * 0.44;
      coin(cx + Math.cos(a) * rr, h - 0.025 + 0.1 * (1 - (rr / (w * 0.47)) ** 2) + 0.004, cz + Math.sin(a) * rr * d / w);
    }
    // a pearl string hanging over its front edge
    const pearls = [];
    for (let i = 0; i <= 12; i++) { const t = i / 12; pearls.push([cx - 0.18 + t * 0.2, h + 0.02 - Math.sin(t * Math.PI) * 0.12, cz + d / 2 + 0.02]); }
    for (const p of pearls) K.put(ball(0.014, 8, 6), K.gloss('#f8f4ec'), ...p);
    // the spill before it: a low heap of coins, every coin its own, gems, a crown and a goblet in it
    const hx = -0.12, hz = 0.2, hr = 0.34, hh = 0.13, heapY = (rr) => hh * Math.max(0, 1 - (rr / hr) ** 2);
    K.put(lathe([[hr, 0], ...[1, 2, 3, 4, 5, 6].map(i => { const rr = hr * (1 - i / 6); return [Math.max(0.001, rr), heapY(rr) - 0.012]; })], 32).scale(1, 1, 0.8), golds[2], hx, 0, hz);
    for (let i = 0; i < 150; i++) {
      const a = R() * TAU, rr = Math.sqrt(R()) * hr * 1.05;
      coin(hx + Math.cos(a) * rr, Math.max(0.005, heapY(rr)) + 0.002, hz + Math.sin(a) * rr * 0.8);
    }
    for (let i = 0; i < 10; i++) { const a = R() * TAU, rr = hr + 0.03 + R() * 0.12; coin(hx + Math.cos(a) * rr, 0.005, hz + Math.sin(a) * rr * 0.8, R() * 3, 0, 0); }
    for (const [x, z, c] of [[-0.2, 0.12, '#e04848'], [0.0, 0.3, '#58b848'], [-0.02, 0.1, '#4a98d8'], [-0.3, 0.3, '#a858d8'], [0.12, 0.2, '#e04848']]) {
      const rr = Math.hypot(x - hx, (z - hz) / 0.8);
      K.put(new THREE.OctahedronGeometry(0.035).scale(1, 1.3, 1), K.gloss(c), x, heapY(rr) + 0.03, z, R() * 3, 0.3);
    }
    K.put(lathe([[0.001, 0], [0.04, 0], [0.012, 0.015], [0.01, 0.07], [0.05, 0.1], [0.055, 0.16], [0.045, 0.16], [0.001, 0.105]], 20), K.metal(GOLD), -0.3, heapY(0.15) - 0.01, 0.1, 0, -0.1, 0.12);
    // a crown sat tilted on the heap: a band and its points, a red gem at each
    const crown = [hx + 0.02, hh - 0.005, hz - 0.02];
    K.put(cyl(0.08, 0.05, 0.075, 24, true), K.metal(GOLD), crown[0], crown[1] + 0.025, crown[2], 0, 0.12, -0.18);
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * TAU, x = Math.cos(a) * 0.08, z = Math.sin(a) * 0.08;
      const g = new THREE.ConeGeometry(0.022, 0.06, 8).translate(x, 0.08, z).rotateZ(-0.18).rotateX(0.12);
      K.put(g, K.metal(GOLD), ...crown);
      K.put(ball(0.012, 8, 6).translate(x * 1.02, 0.03, z * 1.02).rotateZ(-0.18).rotateX(0.12), K.gloss('#e04848'), ...crown);
    }
  },

  swordrack(K, s, W, D, L) {
    const { rbox, cyl, lathe } = L, pal = K.pal, wood = K.wood(), steel = K.metal(L.tone(pal.m, 1.6)), z = -0.08;
    // a wooden frame: a foot, a top rail, two posts
    K.put(rbox(u(28), u(8), 0.42, 0.015), wood, 0, u(4), 0);
    for (const x of [X(3.5), X(28.5)]) K.put(rbox(u(3), u(58), 0.1, 0.01), wood, x, u(29), z);
    K.put(rbox(u(28), u(5), 0.12, 0.01), wood, 0, u(51.5), z);
    // a spear, a sword and an axe standing in it
    K.put(cyl(u(1), u(78), u(1), 8), wood, X(9), u(47), z + 0.08);
    K.put(lathe([[0.001, 0], [u(2.4), u(2)], [0.001, u(10)]], 10), steel, X(9), u(85), z + 0.08);
    K.put(rbox(u(3), u(56), 0.016, 0.006), steel, X(16.5), u(42), z + 0.08);
    K.put(lathe([[0.001, 0], [u(1.5), 0], [0.001, u(4)]], 4).scale(1, 1, 0.3), steel, X(16.5), u(70), z + 0.08);
    K.put(rbox(u(9), u(2), 0.04, 0.008), K.metal(pal.a), X(16.5), u(13), z + 0.08);
    K.put(cyl(u(1.4), u(6), u(1.4), 10), K.cloth(L.tone(pal.w, 0.7)), X(16.5), u(9), z + 0.08);
    K.put(L.ball(u(1.8), 10, 8), K.metal(pal.a), X(16.5), u(5.5), z + 0.08);
    K.put(cyl(u(1), u(72), u(1), 8), wood, X(24), u(44), z + 0.08);
    K.put(L.profileSlab([[0, 0], [u(4), -u(2)], [u(5), u(6)], [u(4), u(14)], [0, u(12)]], 0.014, -0.007).rotateY(-Math.PI / 2), steel, X(23), u(68), z + 0.08);
  },

  cannon(K, s, W, D, L) {
    const { rbox, lathe, ball } = L, pal = K.pal, wood = K.wood(), iron = K.metal(L.tone(pal.m, 1.1)), band = K.metal(pal.a), len = 1.5, tilt = 0.12;
    // a wooden carriage on two big wheels
    K.put(rbox(1.2, u(10), 0.36, 0.02), wood, -0.05, u(13), 0);
    for (const z of [-0.26, 0.26]) spoked(K, L, K.wood(L.tone(pal.w, 0.8)), iron, 0.3, u(8), z, u(8), 0.05, 6);
    for (const z of [-0.26, 0.26]) spoked(K, L, K.wood(L.tone(pal.w, 0.8)), iron, -0.38, u(8), z, u(8), 0.05, 6);
    K.put(L.cyl(0.03, 0.62, 0.03, 10).rotateX(Math.PI / 2), iron, 0.3, u(8), 0);
    K.put(L.cyl(0.03, 0.62, 0.03, 10).rotateX(Math.PI / 2), iron, -0.38, u(8), 0);
    // the barrel along x, its muzzle to the right, tipped up a little; bands, a dark bore and the knob at its back
    const prof = [[0.001, 0], [u(5.6), 0], [u(7.2), u(3)], [u(6.8), len * 0.3], [u(5.6), len * 0.85], [u(6.1), len * 0.9], [u(6.1), len], [u(3.2), len], [0.001, len]];
    K.put(lathe(prof, 28).rotateZ(-Math.PI / 2 + tilt), iron, -len / 2, u(24), 0);
    for (const f of [0.08, 0.5]) K.put(L.torus(u(6.9) - f * u(1.3), 0.012, TAU, 28).rotateY(Math.PI / 2).rotateZ(tilt), band, -len / 2 + f * len * Math.cos(tilt), u(24) + f * len * Math.sin(tilt), 0);
    K.put(L.cyl(u(3.2), 0.02, u(3.2), 20).rotateZ(-Math.PI / 2 + tilt), K.plain(INK), -len / 2 + len * Math.cos(tilt) + 0.002, u(24) + len * Math.sin(tilt), 0);
    K.put(ball(u(2.5), 14, 10), iron, -len / 2 - 0.06, u(24), 0);
    // three cannonballs stacked in front
    for (const [x, y, z] of [[-0.06, u(3), 0.36], [0.14, u(3), 0.36], [0.04, u(3) + 0.08, 0.36]]) K.put(ball(u(3), 14, 10), K.metal(INK), x, y, z);
  },

  catapult(K, s, W, D, L) {
    const { rbox, cyl, ball, lathe } = L, pal = K.pal, wood = K.wood(), dark = K.wood(L.tone(pal.w, 0.8)), iron = K.metal(L.tone(pal.m, 1.1)), cy = u(44);
    // a frame on four wheels, an A-frame each side holding the axle, the throwing arm with a stone in its cup
    for (const z of [-0.24, 0.24]) K.put(rbox(W - u(8), u(6), 0.08, 0.015), wood, 0, u(9), z);
    for (const x of [-0.6, 0, 0.6]) K.put(rbox(0.08, u(5), 0.56, 0.01), wood, x, u(9), 0);
    for (const x of [-0.62, 0.62]) for (const z of [-0.3, 0.3]) spoked(K, L, dark, iron, x, u(6), z, u(6), 0.04, 5);
    for (const z of [-0.2, 0.2]) {
      beam(K, L, wood, [-0.28, u(12), z], [0, cy, z], 0.06);
      beam(K, L, wood, [0.28, u(12), z], [0, cy, z], 0.06);
    }
    K.put(cyl(u(4), 0.46, u(4), 14).rotateX(Math.PI / 2), iron, 0, cy, 0);
    const back = [-0.78, u(16), 0], cup = [0.82, u(62), 0];
    beam(K, L, K.wood(L.tone(pal.w, 1.1)), back, cup, 0.07, 0.07);
    K.put(lathe([[0.001, 0], [0.12, 0.02], [0.14, 0.07], [0.12, 0.08], [0.1, 0.03], [0.001, 0.02]], 18), dark, cup[0], cup[1] - 0.02, 0);
    K.put(ball(u(5), 16, 12), K.plain(STONE), cup[0], cup[1] + u(4), 0);
    K.put(rbox(u(8), u(8), 0.2, 0.02), K.gloss(pal.c), -0.72, u(16), 0);
    K.put(tube(L, [[-0.3, u(12), 0], [-0.45, u(20), 0], back], 0.008, 12), K.cloth('#c8a870'), 0, 0, 0);
  },

  castlecolumn(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, pal = K.pal, stone = K.plain(STONE), lit = K.plain(L.tone(STONE, 1.12));
    // a stepped square base, a fluted shaft, a stepped capital, ivy climbing round it
    K.put(rbox(u(26), u(8), u(26), 0.02), stone, 0, u(4), 0);
    K.put(rbox(u(22), u(4), u(22), 0.015), lit, 0, u(10), 0);
    K.put(cyl(u(9), u(70), u(9.5), 32), K.pic(flutes()), 0, u(12) + u(35), 0);
    K.put(rbox(u(24), u(6), u(24), 0.015), lit, 0, u(85), 0);
    K.put(rbox(u(28), u(4), u(28), 0.015), stone, 0, u(90), 0);
    const leafM = K.cloth(pal.leaf), R = K.r, pts = [];
    for (let n = 0; n < 20; n++) {
      const a = n * 0.55, y = u(14) + n * u(3.4), r = u(9.6);
      pts.push([Math.cos(a) * r, y, Math.sin(a) * r]);
      for (const sg of [-1, 1]) K.put(ball(0.035, 8, 6).scale(1, 0.7, 0.4).rotateY(-a + Math.PI / 2), leafM, Math.cos(a + sg * 0.12) * (r + 0.01), y + R() * 0.03, Math.sin(a + sg * 0.12) * (r + 0.01));
    }
    K.put(tube(L, pts, 0.006, 80), K.cloth(L.tone(pal.leaf, 0.7)), 0, 0, 0);
  },

  crowncushion(K, s, W, D, L) {
    const { rbox, cyl, ball, blob, lathe } = L, pal = K.pal, gold = K.metal(GOLD);
    // a wooden pedestal, a plump cushion with tassels, the crown on it
    K.put(rbox(u(22), u(4), u(22), 0.015), K.wood(L.tone(pal.w, 0.85)), 0, u(2), 0);
    K.put(rbox(u(16), u(28), u(16), 0.02), K.wood(), 0, u(18), 0);
    K.put(rbox(u(22), u(5), u(22), 0.02), K.wood(L.tone(pal.w, 1.1)), 0, u(34.5), 0);
    K.put(blob(u(26), u(9), u(26), 0.3, 0.55), K.cloth(pal.c), 0, u(41), 0);
    for (const x of [-1, 1]) for (const z of [-1, 1]) {
      K.put(ball(0.02, 8, 6), K.metal(pal.a), x * u(12.5), u(41), z * u(12.5));
      K.put(L.lathe([[0.001, 0], [0.018, 0.005], [0.022, 0.06], [0.001, 0.065]], 8), K.cloth(pal.a), x * u(12.8), u(41) - 0.08, z * u(12.8));
    }
    const y = u(44.5), r = u(7);
    K.put(cyl(r, u(6), r, 32, true), gold, 0, y + u(3), 0);
    K.put(cyl(r - 0.01, u(6), r - 0.01, 32, true).scale(-1, 1, 1), gold, 0, y + u(3), 0);
    K.put(L.torus(r, 0.014, TAU, 32).rotateX(Math.PI / 2), gold, 0, y + u(1), 0);
    K.put(new L.THREE.SphereGeometry(r * 0.85, 20, 10, 0, TAU, 0, Math.PI / 2), K.cloth(pal.c), 0, y + u(2), 0);
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * TAU, x = Math.cos(a) * r, z = Math.sin(a) * r;
      K.put(lathe([[u(2), 0], [0.001, u(6)]], 8), gold, x, y + u(6), z);
      K.put(ball(0.018, 8, 6), K.gloss('#fff4c0'), x, y + u(12.3), z);
      K.put(ball(0.02, 10, 8).scale(1, 1, 0.5).rotateY(-a + Math.PI / 2), K.gloss(['#e04848', '#4a98d8', '#58b848'][i % 3]), Math.cos(a) * (r + 0.006), y + u(3), Math.sin(a) * (r + 0.006));
    }
  },

  spinwheel(K, s, W, D, L) {
    const { rbox, cyl, ball, blob } = L, pal = K.pal, wood = K.wood(), lit = K.wood(L.tone(pal.w, 1.15)), cy = u(44);
    // splayed legs under a slanting bench, the big wheel upright on two posts, the wool on its distaff, a treadle
    for (const [x0, x1] of [[X(4), X(10)], [X(28), X(22)]]) for (const z of [-0.14, 0.14]) beam(K, L, wood, [x0, 0, z], [x1, u(22), z * 0.8], 0.035);
    K.put(rbox(u(24), u(4), 0.3, 0.012), wood, 0, u(22), 0, 0, 0, 0.05);
    for (const z of [-0.06, 0.06]) beam(K, L, wood, [0, u(24), z], [0, cy, z], 0.03);
    K.put(L.torus(u(13), 0.016, TAU, 40), lit, 0, cy, 0);
    for (let i = 0; i < 8; i++) K.put(cyl(0.006, u(24), 0.006, 6).rotateZ(i / 8 * Math.PI), lit, 0, cy, 0);
    K.put(cyl(u(2), 0.16, u(2), 12).rotateX(Math.PI / 2), K.metal(), 0, cy, 0);
    K.put(cyl(u(1), u(20), u(1), 8), wood, X(27), u(32), 0);
    K.put(blob(u(7), u(9), u(7), 0.6, 0.7), K.cloth(pal.c), X(27), u(44), 0);
    K.put(tube(L, [[X(27), u(48), 0], [X(22), u(54), 0.02], [0, cy + u(13), 0]], 0.003, 16), K.cloth(pal.c), 0, 0, 0);
    K.put(rbox(u(10), u(1.5), 0.16, 0.006), wood, X(7), u(2), 0.12, 0, 0, -0.15);
  },

  candlestand(K, s, W, D, L) {
    const { cyl, ball, torus } = L, pal = K.pal, iron = K.metal(L.tone(pal.m, 0.9)), wax = K.gloss('#f4f0e0');
    // three iron feet, a tall stem, a round tray of five candles
    for (let i = 0; i < 3; i++) {
      const a = i / 3 * TAU + Math.PI / 2;
      K.put(tube(L, [[0, u(12), 0], [Math.cos(a) * 0.12, u(5), Math.sin(a) * 0.12], [Math.cos(a) * 0.22, 0.01, Math.sin(a) * 0.22]], 0.012, 12), iron, 0, 0, 0);
    }
    K.put(cyl(u(1), u(58), u(1), 10), iron, 0, u(41), 0);
    for (const y of [u(30), u(52)]) K.put(ball(u(1.8), 10, 8), iron, 0, y, 0);
    K.put(cyl(u(13), u(1.5), u(12), 32), iron, 0, u(70), 0);
    K.put(torus(u(13), 0.01, TAU, 32).rotateX(Math.PI / 2), iron, 0, u(71), 0);
    [[-10, 9], [-5, 11], [0, 12], [5, 11], [10, 9]].forEach(([i, h], n) => {
      const x = u(i) * 0.95, z = (n % 2 ? -1 : 1) * 0.06;
      K.put(cyl(u(1.5), u(h), u(1.5), 12), wax, x, u(70.75) + u(h) / 2, z);
      flame(K, L, x, u(70.75) + u(h) + 0.004, z, u(5));
    });
  },

  dragonnest(K, s, W, D, L) {
    const { ball, lathe } = L, pal = K.pal, R = K.r, twig = [K.wood('#8a6038'), K.wood('#a87848')];
    // a nest of twigs, the egg upright in it, scales of the accent, a glowing crack
    for (let i = 0; i < 56; i++) {
      const a = R() * TAU, y = 0.02 + R() * u(9), r = 0.26 + R() * 0.12, len = 0.22 + R() * 0.15;
      const g = L.cyl(0.012, len, 0.012, 6).rotateZ(Math.PI / 2 + (R() - 0.5) * 0.4).rotateY(-a + Math.PI / 2 + (R() - 0.5) * 0.6);
      K.put(g, twig[i % 2], Math.cos(a) * r, y, Math.sin(a) * r * 0.85);
    }
    K.put(new L.THREE.SphereGeometry(0.3, 24, 10, 0, TAU, Math.PI / 2, Math.PI / 2).scale(1, 0.3, 0.85), twig[0], 0, u(10), 0);
    const rx = u(9), ry = u(13), cy = u(24);
    K.put(ball(1, 28, 20).scale(rx, ry, rx), K.gloss(pal.c), 0, cy, 0);
    for (const [i, j, a] of [[-4, -6, 0.2], [3, -2, -0.5], [-2, 4, 0.4], [4, 6, -0.2], [0, -9, 2.8], [3, 1, 3.6], [-3, 5, 2.4], [0, 2, 4.8], [2, -6, 5.6]]) {
      const yy = u(-j), r = rx * Math.sqrt(Math.max(0.05, 1 - (yy / ry) ** 2));
      K.put(ball(u(1.8), 10, 8).scale(1, 0.8, 0.35).rotateY(a), K.gloss(pal.a), Math.sin(a) * r, cy + yy, Math.cos(a) * r);
    }
    const crack = [[-6, -4], [-2, 4], [-4, 10]].map(([i, j]) => { const yy = u(-j), x = u(i); return [x, cy + yy, rx * Math.sqrt(Math.max(0.05, 1 - (x / rx) ** 2 - (yy / ry) ** 2)) + 0.004]; });
    K.put(tube(L, crack, 0.007, 16), K.glow('#ffb060'), 0, 0, 0);
  },

  battlement(K, s, W, D, L) {
    const { rbox, cyl } = L, pal = K.pal, wall = K.pic(blocks(5, 4)), cap = K.plain(L.tone(STONE, 1.1)), d = 0.4, h = u(40);
    // a stone wall of blocks, merlons along its top, a banner hanging on its front
    K.put(new L.THREE.BoxGeometry(W - 0.02, h, d), wall, 0, h / 2, 0);
    K.put(rbox(W, u(2), d + 0.04, 0.01), cap, 0, h, 0);
    for (let i = 0; i + 10 <= W * 32; i += 16) { K.put(rbox(u(10), u(12), d, 0.02), K.plain(STONE), X(i + 5, W), h + u(7), 0); K.put(rbox(u(11), u(1.5), d + 0.02, 0.006), cap, X(i + 5, W), h + u(13), 0); }
    const bx = X(9, W);
    K.put(cyl(0.01, u(12), 0.01, 8).rotateZ(Math.PI / 2), K.metal(pal.a), bx, u(35), d / 2 + 0.02);
    K.put(L.profileSlab([[0, 0], [u(10), 0], [u(10), -u(16)], [u(5), -u(12)], [0, -u(16)]], 0.012, -0.006).rotateY(-Math.PI / 2), K.cloth(pal.c), bx + u(5), u(35), d / 2 + 0.02);
    K.put(rbox(u(6), u(2), 0.014, 0.003), K.cloth(pal.a), bx, u(31), d / 2 + 0.024);
  },

  archerytarget(K, s, W, D, L) {
    const { cyl, rbox } = L, pal = K.pal, wood = K.wood(), cy = u(46), z0 = 0.04;
    // a tripod easel, the straw boss on it, its painted face, three arrows stuck in it
    beam(K, L, wood, [X(3), 0, 0.12], [X(9), cy + u(4), z0 - 0.04], 0.04);
    beam(K, L, wood, [X(29), 0, 0.12], [X(23), cy + u(4), z0 - 0.04], 0.04);
    beam(K, L, wood, [0, 0, -0.3], [0, cy, z0 - 0.06], 0.04);
    K.put(rbox(u(26), u(2), 0.06, 0.008), wood, 0, cy - u(14), z0);
    K.put(cyl(u(14), 0.12, u(14), 40).rotateX(Math.PI / 2), K.plain(STRAW), 0, cy, z0);
    K.put(new L.THREE.CircleGeometry(u(14), 40), K.pic(targetFace(pal.c, pal.p)), 0, cy, z0 + 0.061);
    for (const [i, j, a] of [[18, 47, 0.3], [11, 52, -0.4], [22, 40, 0.1]]) {
      const tip = [X(i), u(j), z0 + 0.06], back = [tip[0] + Math.sin(a) * 0.1, tip[1] + 0.06, tip[2] + 0.22];
      rod(K, L, wood, [tip[0], tip[1], tip[2] - 0.03], back, 0.006);
      for (const sg of [-1, 1]) K.put(rbox(0.005, 0.04, 0.06, 0.002), K.cloth(pal.a), back[0] + sg * 0.008, back[1], back[2] - 0.02, 0, 0, sg * 0.3);
    }
  },

};

/* what each stall sells, stood on its counter (top `t`) */
const STALL_GOODS = {
  popcorn(K, L, t, W) {
    const { rbox, cyl, ball } = L, red = K.gloss('#d84040');
    // a popcorn machine: a red box, a glass case full of popcorn, a yellow lid
    const x = -0.5;
    K.put(rbox(u(24), u(7), 0.36, 0.015), red, x, t + u(3.5), 0);
    K.put(rbox(u(24), u(20), 0.36, 0.01), K.M('glass', '#fff4d0', { key: 'case' }), x, t + u(17), 0);
    K.put(rbox(u(24), u(5), 0.36, 0.015), K.gloss('#f8d030'), x, t + u(29.5), 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.put(rbox(0.015, u(20), 0.015, 0.004), red, x + sx * u(11.5), t + u(17), sz * 0.17);
    const R = K.r;
    for (let i = 0; i < 40; i++) K.put(ball(0.022, 8, 6), K.gloss(R() < 0.3 ? '#f8e070' : '#fffaf0'), x + (R() - 0.5) * u(21), t + u(8) + R() * R() * u(10), (R() - 0.5) * 0.3);
    // two striped bags of it
    for (const bx of [0.2, 0.52]) {
      K.put(cyl(u(4.2), u(12), u(3.5), 16), K.pic(stripes('#ffffff', '#e04848', 8)), bx, t + u(6), 0.06);
      for (let i = 0; i < 6; i++) K.put(ball(0.03, 8, 6), K.gloss('#fffaf0'), bx + (R() - 0.5) * 0.1, t + u(12) + R() * 0.04, 0.06 + (R() - 0.5) * 0.1);
    }
  },
  floss(K, L, t, W) {
    const { cyl, ball, rbox } = L, pal = K.pal;
    // the spinning tub, a pink cloud rising out of it
    K.put(cyl(u(12), u(12), u(10), 24), K.metal('#c8ccd4'), -0.46, t + u(6), 0);
    K.put(cyl(u(11), 0.01, u(11), 24), K.metal('#8a8e98'), -0.46, t + u(12), 0);
    for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; K.put(ball(0.09, 14, 10), K.cloth(PINK), -0.46 + Math.cos(a) * 0.08, t + u(16) + (i % 2) * 0.04, Math.sin(a) * 0.08); }
    K.put(ball(0.11, 14, 10), K.cloth('#fcc8dc'), -0.46, t + u(20), 0);
    // three cones of it standing in a block
    K.put(rbox(u(22), u(9), 0.18, 0.015), K.gloss(pal.a), 0.3, t + u(4.5), 0.05);
    for (const [i, c] of [[-1, PINK], [0, SKYB], [1, PINK]]) {
      const x = 0.3 + i * u(7);
      K.put(cyl(0.008, u(16), 0.008, 6), K.plain('#f4e8d0'), x, t + u(12), 0.05);
      K.put(ball(0.08, 14, 10).scale(1, 1.2, 1), K.cloth(c), x, t + u(25), 0.05);
    }
  },
  lemon(K, L, t, W) {
    const { cyl, lathe, ball } = L, pal = K.pal, lemonade = K.gloss('#f8e060');
    // a big glass jug of lemonade, lemon slices floating in it, a tap at its foot
    const x = -0.48, r = u(9);
    K.put(cyl(r, u(24), r, 24), K.M('glass', '#fff0a0', { key: 'jug' }), x, t + u(13), 0);
    K.put(cyl(r - 0.01, u(18), r - 0.01, 24), lemonade, x, t + u(10), 0);
    K.put(cyl(r + 0.01, u(3), r + 0.01, 24), K.metal('#c8ccd4'), x, t + u(25.5), 0);
    K.put(cyl(r + 0.01, u(1.5), r + 0.01, 24), K.metal('#c8ccd4'), x, t + u(0.75), 0);
    for (const [i, j] of [[-0.05, 9], [0.06, 13], [0, 16]]) K.put(cyl(0.05, 0.01, 0.05, 16).rotateX(1.2), K.gloss('#f0d020'), x + i, t + u(j), 0.1);
    K.put(cyl(0.012, 0.06, 0.012, 8).rotateX(Math.PI / 2), K.metal(), x + 0.08, t + u(3), r + 0.02);
    // three cups of it and a lemon
    for (let i = 0; i < 3; i++) {
      const cx = 0.04 + i * u(8);
      K.put(cyl(u(3.2), u(10), u(2.8), 16), K.M('glass', '#f4f8ff', { key: 'cup' }), cx, t + u(5), 0.08);
      K.put(cyl(u(3), u(7), u(2.7), 16), lemonade, cx, t + u(3.5), 0.08);
    }
    K.put(ball(u(4), 16, 12).scale(1.25, 1, 1), K.gloss('#f0d020'), 0.52, t + u(4), 0.04);
  },
  balloon(K, L, t, W) {
    const { rbox } = L, pal = K.pal, at = [0, t + u(6), 0.06];
    K.put(rbox(u(12), u(6), 0.14, 0.015), K.gloss(pal.a), 0, t + u(3), 0.06);
    const string = K.plain('#e8e8e8');
    for (let n = 0; n < 6; n++) {
      const top = [X(9 + n * 9, W) * 0.85, t + u(30 - (n % 2) * 7), (n % 3 - 1) * 0.1];
      K.put(tube(L, [at, top], 0.004, 8), string, 0, 0, 0);
      balloon(K, L, top[0], top[1], top[2], u(4.5), RAINBOW[n]);
    }
  },
  prize(K, L, t, W) {
    [[10, PINK], [20, '#f8d030'], [30, SKYB], [40, '#a8e098'], [50, '#d8a8f0']].forEach(([i, c], n) => plush(K, L, X(i, W), t, n % 2 ? -0.08 : 0.08, 1.3, c));
    for (const [i, c] of [[14, '#f8b070'], [32, '#f8f0a0'], [48, '#f8a8a8']]) {
      rod(K, L, K.plain('#d8d8d8'), [X(i, W), u(78), 0.2], [X(i, W), u(64), 0.2], 0.004);
      plush(K, L, X(i, W), u(46), 0.2, 1.2, c);
    }
  },
  apple(K, L, t, W) {
    const { cyl, ball } = L, pal = K.pal;
    // a pot of toffee, an apple dipping in it
    K.put(cyl(u(8), u(14), u(7), 20), K.metal('#c8ccd4'), -0.5, t + u(7), 0);
    K.put(cyl(u(7), 0.01, u(7), 20), K.gloss('#c87830'), -0.5, t + u(13.5), 0);
    K.put(cyl(0.006, u(12), 0.006, 6), K.plain('#f4e8d0'), -0.5, t + u(18), 0);
    // two rows of toffee apples on sticks
    for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) {
      const x = -0.04 + i * u(7) + r * u(3), y = t + u(4) + r * u(6), z = 0.1 - r * 0.18;
      K.put(ball(u(3.8), 16, 12), K.gloss('#d02828'), x, y, z);
      K.put(cyl(u(3.9), u(1.5), u(3.6), 16), K.gloss('#a85818'), x, y - u(2), z);
      K.put(cyl(0.006, u(6), 0.006, 6), K.plain('#f4e8d0'), x, y + u(5), z);
    }
  },
};

/* what each specimen tank holds, its middle at y */
const TANK_HOLDS = {
  egg(K, L, y) {
    const rx = u(7), ry = u(9), pal = K.pal;
    K.put(L.ball(1, 24, 18).scale(rx, ry, rx), K.gloss('#f8f0d8'), 0, y, 0);
    for (const [i, j, a] of [[-3, -4, 0.3], [2, 1, -0.4], [-2, 4, 2.6], [3, -6, 3.4], [0, 2, 1.6], [-1, -1, 4.6]]) {
      const yy = u(-j), f = Math.sqrt(Math.max(0.05, 1 - (yy / ry) ** 2)), r = rx * f;
      K.put(L.ball(u(1.6), 10, 8).scale(1, 1, 0.4).rotateY(a + u(i)), K.gloss(pal.c), Math.sin(a + u(i)) * r, y + yy, Math.cos(a + u(i)) * r);
    }
  },
  helix(K, L, y) {
    const R = u(8), t = 0.07, shell = K.gloss('#c8a878'), groove = K.gloss('#7a5a38');
    K.put(L.cyl(R, t, R, 32).rotateX(Math.PI / 2), shell, 0, y, 0);
    K.put(L.torus(R, t / 2, TAU, 32), K.gloss('#a08058'), 0, y, 0);
    for (const sg of [-1, 1]) {
      const pts = [];
      for (let a = 0; a <= 50; a++) { const th = a / 50 * Math.PI * 5, r = R * 0.9 - a / 50 * R * 0.8; pts.push([Math.cos(th) * r * sg, y + Math.sin(th) * r, sg * (t / 2 + 0.004)]); }
      K.put(tube(L, pts, 0.008, 120), groove, 0, 0, 0);
    }
  },
  dome(K, L, y) {
    const tan = K.gloss('#a08058'), { THREE } = L;
    K.put(new THREE.SphereGeometry(1, 28, 12, 0, TAU, 0, Math.PI / 2).scale(u(9.5), u(8), u(8)), tan, 0, y - u(4), 0);
    K.put(new THREE.SphereGeometry(1, 28, 12, 0, TAU, 0, Math.PI / 2).scale(u(8), u(6), u(6.5)), K.gloss('#c8a878'), 0, y - u(3.6), 0.01);
    for (const x of [-4, 0, 4]) K.put(L.rbox(u(1), u(6), u(12), 0.004), K.gloss('#7a5a38'), u(x), y - u(1.5), 0);
    K.put(L.torus(u(9), 0.014, TAU, 28).rotateX(Math.PI / 2).scale(1, 1, 0.84), K.gloss('#5a4028'), 0, y - u(4), 0);
  },
  sprout(K, L, y) {
    const leafM = K.gloss('#58b848');
    K.put(L.ball(u(5), 18, 12).scale(1, 0.45, 1), K.plain('#7a5a38'), 0, y - u(10), 0);
    K.put(L.cyl(0.008, u(13), 0.01, 8), K.gloss('#3a8a2a'), 0, y - u(3.5), 0);
    leaf(K, L, leafM, 0, y - u(2), 0, u(8), u(4), 2.6, 0.4);
    leaf(K, L, leafM, 0, y + u(1), 0, u(8), u(4), -0.4, 0.5);
    leaf(K, L, K.gloss('#78d060'), 0, y + u(3), 0, u(6), u(3), 1.2, 1.1);
  },
  crystal(K, L, y) {
    const pal = K.pal;
    for (const [i, h, z, tip] of [[-5, 10, 0.03, 0.3], [0, 16, -0.02, 0], [5, 12, 0.02, -0.3]]) {
      const m = K.gloss(i ? pal.a : L.tone(pal.a, 1.2)), r = u(2.5), hh = u(h);
      const g = L.cyl(r, hh, r, 6);
      g.translate(0, hh / 2, 0); g.rotateZ(tip);
      K.put(g, m, u(i), y - u(8), z);
      const cone = L.cyl(0.001, u(4), r, 6); cone.translate(0, hh + u(2), 0); cone.rotateZ(tip);
      K.put(cone, m, u(i), y - u(8), z);
    }
  },
  orb(K, L, y) {
    const pal = K.pal;
    K.put(L.ball(u(7), 24, 18), K.gloss(pal.a), 0, y, 0);
    K.put(L.ball(u(8.5), 24, 18), tint(K, L.tone(pal.a, 1.3), 0.25, 0.6), 0, y, 0);
    K.put(L.torus(u(10), 0.01, TAU, 40).rotateX(1.2), K.glow('#ffffff'), 0, y, 0);
  },
};
