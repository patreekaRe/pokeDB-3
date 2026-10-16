/* base-models-d.js  -  Spooky, Bathroom, Bedroom and Office pieces, modelled from parts like the arcade cabinets (the user's ask, 2026-10-12).
   js/base-models-f.js's head says how a batch works. Most builders here follow their painting (js/base-furniture-rooms.js's
   Spooky shelf, js/base-furniture-rooms2.js's others) pixel for pixel: `u(n)` is n of its 32 pixels a tile, `X(n, W)` a
   pixel across the painting as x from the middle. */

import { rod, tube, crop } from './base-models-kit.js';

const u = (n) => n / 32;
const X = (n, W = 1) => n / 32 - W / 2;
const TAU = Math.PI * 2;
const DUCK = '#f8d030', DUCK_PALE = '#fff090', BEAK = '#f08030', INK = '#303038';
const BERRY_BLUE = '#4a78d8';

const sheet = (w, h, draw) => { const c = new OffscreenCanvas(w, h); draw(c.getContext('2d'), w, h); return c; };
const pics = {};
const once = (key, make) => pics[key] || (pics[key] = make());

/* straw for the broom: strands down its length (a lathe's v runs up it) */
const straw = () => once('straw', () => sheet(128, 32, (g, w, h) => {
  g.fillStyle = '#d8b860'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < w; i += 3) { g.fillStyle = i % 4 ? '#c8a848' : '#e8cc78'; g.fillRect(i, 0, 1.5, h); }
}));
/* wicker for the hamper: rows woven over and under, ribs between */
const wicker = (col, lo, hi) => once('wicker' + col, () => sheet(256, 64, (g, w, h) => {
  g.fillStyle = lo; g.fillRect(0, 0, w, h);
  for (let r = 0; r < 8; r++) for (let c = 0; c < 16; c++) {
    g.fillStyle = (r + c) % 2 ? col : hi;
    g.beginPath(); g.roundRect(c * 16 + 1, r * 8 + 1, 14, 6, 3); g.fill();
  }
}));
/* white tiles and grout for the shower's walls, a band of the theme's colour across */
const tiles = (band) => once('tiles' + band, () => sheet(128, 384, (g, w, h) => {
  g.fillStyle = '#c8d4dc'; g.fillRect(0, 0, w, h);
  const row = h / 14;
  for (let j = 0; j < 14; j++) for (let i = -1; i < 5; i++) {
    const x = i * w / 4 + (j % 2) * w / 8, y = j * row;
    const l = g.createLinearGradient(x, y, x, y + row); l.addColorStop(0, '#f4f8fa'); l.addColorStop(1, '#e2eaf0');
    g.fillStyle = l; g.fillRect(x + 1.5, y + 1.5, w / 4 - 3, row - 3);
  }
  g.fillStyle = band; g.fillRect(0, h * 36 / 80, w, h * 4 / 80);
  g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(0, h * 36 / 80, w, 3);
}));
/* the star projector's dome: night blue, stars pricked in it */
const nightDome = () => once('nightdome', () => sheet(256, 128, (g, w, h) => {
  const l = g.createLinearGradient(0, 0, 0, h); l.addColorStop(0, '#3a4a8a'); l.addColorStop(1, '#1e2a58');
  g.fillStyle = l; g.fillRect(0, 0, w, h);
  for (let n = 0; n < 70; n++) {
    const x = (n * 73) % w, y = (n * 41) % (h * 0.8);
    g.fillStyle = n % 3 ? '#fff4c0' : '#a8c8ff'; g.beginPath(); g.arc(x, y, n % 5 ? 1.6 : 2.6, 0, TAU); g.fill();
  }
}));
/* the alarm clock's face: cream, twelve ticks, the hands at ten past ... twelve */
const clockFace = () => once('clockface', () => sheet(128, 128, (g, w, h) => {
  g.fillStyle = '#fffbe8'; g.beginPath(); g.arc(64, 64, 63, 0, TAU); g.fill();
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * TAU;
    g.fillStyle = i % 3 ? '#8a8a98' : '#4a4a58';
    g.beginPath(); g.arc(64 + Math.cos(a) * 50, 64 + Math.sin(a) * 50, i % 3 ? 3 : 5, 0, TAU); g.fill();
  }
  g.strokeStyle = INK; g.lineCap = 'round';
  g.lineWidth = 6; g.beginPath(); g.moveTo(64, 64); g.lineTo(64, 24); g.stroke();
  g.lineWidth = 7; g.beginPath(); g.moveTo(64, 64); g.lineTo(96, 64); g.stroke();
  g.fillStyle = '#d84848'; g.beginPath(); g.arc(64, 64, 5, 0, TAU); g.fill();
}));
/* the grave's carving: three lines, the top longest */
const carving = () => once('carving', () => sheet(64, 64, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  g.fillStyle = 'rgba(20,20,30,0.55)';
  for (const [x0, x1, y] of [[6, 58, 8], [12, 52, 28], [12, 52, 48]]) g.fillRect(x0, y, x1 - x0, 6);
  g.fillStyle = 'rgba(255,255,255,0.25)';
  for (const [x0, x1, y] of [[6, 58, 8], [12, 52, 28], [12, 52, 48]]) g.fillRect(x0, y + 6, x1 - x0, 2);
}));

/** A shape `sh` extruded `t` deep along z, centred on z 0, its edges rounded. */
const extrude = (THREE, sh, t, bevel = t * 0.35) => {
  const g = new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 20 });
  g.translate(0, 0, -t / 2);
  return g;
};
/** A polygon shape through [x, y] points. */
const poly = (THREE, pts) => new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
/** A five-pointed star, `R` to a point, a point up. */
function starShape(THREE, R, inner = 0.42, points = 5) {
  const sh = new THREE.Shape();
  for (let i = 0; i < points * 2; i++) { const a = Math.PI / 2 + i * Math.PI / points, r = i % 2 ? R * inner : R; sh[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); }
  return sh;
}
/** A crescent: the circle of radius R less the circle of radius r at (dx, dy). */
function crescent(THREE, R, r, dx, dy, n = 72) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const a = i / n * TAU, x = Math.cos(a) * R, y = Math.sin(a) * R; if (Math.hypot(x - dx, y - dy) >= r) pts.push([x, y, a]); }
  // start just after the gap so the outer arc runs unbroken, then back along the inner circle
  const gap = pts.findIndex((p, i) => i && p[2] - pts[i - 1][2] > TAU / n * 1.5);
  const outer = gap > 0 ? [...pts.slice(gap), ...pts.slice(0, gap)] : pts;
  const a0 = Math.atan2(outer[outer.length - 1][1] - dy, outer[outer.length - 1][0] - dx), a1 = Math.atan2(outer[0][1] - dy, outer[0][0] - dx);
  let span = a1 - a0; while (span > 0) span -= TAU;
  const inner = [];
  for (let i = 1; i < 24; i++) { const a = a0 + span * i / 24; inner.push([dx + Math.cos(a) * r, dy + Math.sin(a) * r]); }
  return poly(THREE, [...outer.map(([x, y]) => [x, y]), ...inner]);
}
/** A ribbed ball (a pumpkin): `ribs` grooves `deep` into it, squashed to rx x ry x rz, a dimple at the top. */
function ribbed(L, rx, ry, rz, ribs = 8, deep = 0.08) {
  const g = new L.THREE.SphereGeometry(1, ribs * 4, 16), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = Math.atan2(z, x), k = 1 - deep * (0.5 - 0.5 * Math.cos(ribs * a)) * (1 - y * y);
    const dip = y > 0.75 ? (y - 0.75) * 0.7 : y < -0.8 ? (y + 0.8) * 0.5 : 0;
    p.setXYZ(i, x * k * rx, (y - dip) * ry, z * k * rz);
  }
  g.computeVertexNormals();
  return L.weld(g);
}
/** Where a flat thing on the front of an ellipsoid (rx, ry, rz at cy) sits: its z and how far to turn it, at (x, y). */
function onFront(rx, ry, rz, cy, x, y) {
  const f = 1 - (x / rx) ** 2 - ((y - cy) / ry) ** 2;
  return { z: rz * Math.sqrt(Math.max(0.02, f)), turn: Math.asin(Math.max(-0.9, Math.min(0.9, x / rx))) * 0.8, tilt: -Math.asin(Math.max(-0.9, Math.min(0.9, (y - cy) / ry))) * 0.8 };
}
/**
 * A tub-like ring swept round a rounded rectangle (`hw` x `hd` half sizes, its corners as round as `e`, 2 an ellipse,
 * higher squarer): `prof` is [[inset, y]...], each point `inset` in from the outline at height y. Open profiles make walls,
 * a profile that ends at the middle a floor.
 */
function swept(L, hw, hd, prof, e = 4, seg = 64) {
  const { THREE } = L, pos = [], idx = [], n = prof.length;
  for (let s = 0; s <= seg; s++) {
    const a = s / seg * TAU, c = Math.cos(a), sn = Math.sin(a);
    const ux = Math.sign(c) * Math.abs(c) ** (2 / e), uz = Math.sign(sn) * Math.abs(sn) ** (2 / e);
    for (const [ins, y] of prof) { const ix = Math.max(0, hw - ins), iz = Math.max(0, hd - ins); pos.push(ux * ix, y, uz * iz); }
  }
  for (let s = 0; s < seg; s++) for (let i = 0; i < n - 1; i++) {
    const a = s * n + i, b = (s + 1) * n + i;
    idx.push(a, a + 1, b, b, a + 1, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return L.weld(g);
}
/** Moves a geometry's vertices by `f(x, y, z)` -> [x, y, z], then fixes its normals. */
function bend(L, g, f) {
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const [x, y, z] = f(p.getX(i), p.getY(i), p.getZ(i)); p.setXYZ(i, x, y, z); }
  g.computeVertexNormals();
  return g;
}
/** Js/base-furniture-rooms2.js's rubber duck facing +x, its body `s` tiles long (the giant one 1), its feet at (x, y, z). */
function duck(K, L, x, y, z, s) {
  const { blob, ball, lathe } = L, body = K.gloss(DUCK);
  K.put(blob(0.9 * s, 0.5 * s, 0.62 * s, 0.8, 0.75), body, x, y + 0.26 * s, z);
  K.put(lathe([[0.001, 0], [0.12 * s, 0.03 * s], [0.09 * s, 0.14 * s], [0, 0.24 * s]], 20).rotateZ(0.7), body, x - 0.36 * s, y + 0.34 * s, z);
  K.put(ball(0.11 * s, 16, 12).scale(1, 1.3, 1), body, x - 0.03 * s, y + 0.5 * s, z);
  K.put(ball(0.24 * s, 24, 18), body, x - 0.04 * s, y + 0.74 * s, z);
  K.put(ball(0.14 * s, 18, 12).scale(1.2, 0.42, 0.9), K.gloss(BEAK), x + 0.22 * s, y + 0.72 * s, z);
  for (const sg of [-1, 1]) {
    K.put(ball(0.035 * s, 12, 10), K.gloss(INK), x + 0.06 * s, y + 0.82 * s, z + sg * 0.2 * s);
    K.put(blob(0.36 * s, 0.2 * s, 0.08 * s, 0.7, 0.7), K.gloss(DUCK_PALE), x - 0.12 * s, y + 0.3 * s, z + sg * 0.29 * s, 0, 0, 0.25);
  }
}
/** A wheel or caster, its axle along x. */
function wheel(K, L, x, y, z, r, t = 0.04) {
  K.put(L.cyl(r, t, r, 18).rotateZ(Math.PI / 2), K.gloss('#303038'), x, y, z);
  K.put(L.cyl(r * 0.45, t + 0.01, r * 0.45, 12).rotateZ(Math.PI / 2), K.metal('#8a8a98'), x, y, z);
}
/** A candle flame on a lathe, `h` tall, its foot at (x, y, z); `inner` a paler core. */
function flame(K, L, x, y, z, h, col, inner) {
  const prof = (k) => [[0, 0], [h * 0.22 * k, h * 0.2], [h * 0.26 * k, h * 0.42], [h * 0.14 * k, h * 0.75], [0, h]];
  K.put(L.lathe(prof(1), 16), K.glow(col), x, y, z);
  if (inner) K.put(L.lathe(prof(0.55).map(([r, yy]) => [r, yy * 0.6]), 12), K.glow(inner), x, y + 0.004, z + h * 0.05);
}

export const SHAPES = {
  // boxes, the painting on the front only (js/base-models-kit.js)
  'witchshelf': { make: 'frontbox', d: 0.4 },
  'organ': { make: 'frontbox', d: 0.6, top: 0.48 },
  'minifridge': { make: 'frontbox', d: 0.55, top: 0.3 },
  'copier serverrack': { make: 'frontbox' },
  'safe': { make: 'frontbox', d: 0.6 },
  'shredder': { make: 'frontbox', d: 0.45, top: 0.1 },
  'cubicle': { make: 'frontbox', d: 0.15 },
  // built from parts
  roundgrave: { make: 'grave', style: 'round' },
  squaregrave: { make: 'grave', style: 'square' },
  obeliskgrave: { make: 'grave', style: 'obelisk' },
  jackolantern: { make: 'jackolantern' },
  candelabra: { make: 'candelabra' },
  coffin: { make: 'coffin' },
  blackcat: { make: 'blackcat' },
  broom: { make: 'broom' },
  hatstand: { make: 'hatstand' },
  lectern: { make: 'lectern' },
  spookylamp: { make: 'spookylamp' },
  ironfence: { make: 'ironfence' },
  deadtree: { make: 'deadtree' },
  litwick: { make: 'litwick' },
  pumpkins: { make: 'pumpkins' },
  raggeddoll: { make: 'raggeddoll' },
  ghostsheet: { make: 'ghostsheet' },
  clawtub: { make: 'clawtub' },
  bubblebath: { make: 'bubblebath' },
  shower: { make: 'shower' },
  hamper: { make: 'hamper' },
  toiletroll: { make: 'toiletroll' },
  towelladder: { make: 'towelladder' },
  jacuzzi: { make: 'jacuzzi' },
  bigduck: { make: 'bigduck' },
  bunkbed: { make: 'bunkbed' },
  crib: { make: 'crib' },
  jewelbox: { make: 'jewelbox' },
  alarmclock: { make: 'alarmclock' },
  slippers: { make: 'slippers' },
  starprojector: { make: 'starprojector' },
  moonlamp: { make: 'moonlamp' },
  laundrypile: { make: 'laundrypile' },
  divider: { make: 'divider' },
  mailcart: { make: 'mailcart' },
  paperboxes: { make: 'paperboxes' },
  printer: { make: 'printer' },
  briefcase: { make: 'briefcase' },
};

export const MAKES = {
  /* ----- Spooky ----- */

  grave(K, s, W, D, L) {
    const { THREE, rbox, cyl, lathe, ball } = L, st = K.pal.m, stone = K.plain(st), lit = K.plain(L.tone(st, 1.15)), t = 0.18, z = -0.06;
    // a mound of earth with grass round it, the stone standing in it
    K.put(lathe([[0.001, 0.05], [0.3, 0.045], [0.42, 0.02], [0.45, 0], [0, 0]], 32).scale(1, 1, 0.7), K.cloth('#5a4a3a'), 0, 0, 0.02);
    const R = K.r, leaf = K.cloth(K.pal.leaf);
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, r = 0.36 + R() * 0.06; K.put(cyl(0.001, 0.05 + R() * 0.04, 0.018, 5), leaf, Math.cos(a) * r, 0.04, 0.02 + Math.sin(a) * r * 0.7, 0, (R() - 0.5) * 0.5, (R() - 0.5) * 0.5); }
    let face = 0;
    if (s.style === 'round') {
      // a slab rounded over the top, a lighter shoulder where the light catches it
      const sh = new THREE.Shape(); sh.moveTo(-u(10), 0); sh.lineTo(-u(10), u(30)); sh.absarc(0, u(30), u(10), Math.PI, 0, true); sh.lineTo(u(10), 0); sh.closePath();
      K.put(extrude(THREE, sh, t - 0.04, 0.02), stone, 0, u(3), z);
      face = u(14);
    } else if (s.style === 'square') {
      K.put(rbox(u(22), u(32), t, 0.02), stone, 0, u(19), z);
      K.put(rbox(u(26), u(5), t + 0.06, 0.015), lit, 0, u(37.5), z);
      face = u(16);
    } else {
      // a plinth, a square shaft tapering up it, a pyramid on top
      K.put(rbox(u(20), u(8), 0.36, 0.015), stone, 0, u(7), z);
      const sq = (hw) => hw * Math.SQRT2;
      K.put(cyl(sq(u(3)), u(40), sq(u(5)), 4).rotateY(Math.PI / 4), stone, 0, u(31), z);
      K.put(cyl(0.001, u(6), sq(u(3)), 4).rotateY(Math.PI / 4), lit, 0, u(54), z);
      K.put(new THREE.PlaneGeometry(u(1.6), u(40)), lit, -u(3.4), u(31), z + u(4) + 0.002, 0, 0.05);
      face = u(25);
    }
    // the carved lines, moss in the cracks
    const cv = new THREE.PlaneGeometry(u(10), u(9));
    K.put(cv, L.decal(carving()), 0, face + u(4.5), z + (s.style === 'obelisk' ? u(4.2) : t / 2) + 0.004);
    for (let i = 0; i < 7; i++) K.put(ball(0.016 + R() * 0.012, 8, 6), leaf, (R() - 0.5) * u(16), u(6) + R() * u(28) * (s.style === 'obelisk' ? 1.3 : 1), z + (s.style === 'obelisk' ? 0.1 : t / 2));
  },

  jackolantern(K, s, W, D, L) {
    const { THREE, cyl, ball } = L, rx = u(13), ry = u(11), rz = u(12), cy = u(12), glow = K.glow('#f8d050');
    // a pumpkin ribbed round, a crooked stem and a leaf
    K.put(ribbed(L, rx, ry, rz, 9, 0.09), K.gloss('#e8782a'), 0, cy, 0);
    K.put(cyl(0.025, u(5), 0.04, 8).rotateZ(-0.25), K.wood('#5a7a2a'), u(0.5), cy + ry + u(1.5), 0);
    K.put(ball(1, 12, 8).scale(0.09, 0.016, 0.05), K.cloth(K.pal.leaf), u(5), cy + ry + u(1), 0.02, 0.4, 0, -0.3);
    // its carved face, lit from inside: two triangle eyes and a grin
    const lay = (sh, x, y, t = 0.025) => { const f = onFront(rx, ry, rz, cy, x, y); K.put(extrude(THREE, sh, t, 0.006), glow, x, y, f.z - 0.006, f.turn, f.tilt); };
    for (const sg of [-1, 1]) lay(poly(THREE, [[-u(2), u(2)], [u(2), u(2)], [-sg * u(2), -u(2)]]), sg * u(6), cy + u(4.5));
    for (let i = -7; i <= 7; i++) if (i % 3) lay(poly(THREE, [[-u(0.55), u(1.5)], [u(0.55), u(1.5)], [u(0.55), -u(1.5)], [-u(0.55), -u(1.5)]]), u(i), cy - u(4.5) - u(i * i / 18));
  },

  candelabra(K, s, W, D, L) {
    const { cyl, lathe, ball } = L, gold = K.metal(K.pal.a), wax = K.gloss(K.pal.p);
    // a domed foot, a stem with knops, two arms swept up from it, three cups and candles
    K.put(lathe([[u(8), 0], [u(8), u(1)], [u(5), u(3)], [u(2), u(5)], [0, u(5)]], 28), gold, 0, 0, 0);
    K.put(cyl(u(1.5), u(36), u(1.5), 14), gold, 0, u(22), 0);
    for (const y of [u(10), u(22), u(34)]) K.put(ball(u(2.5), 14, 10).scale(1, 0.7, 1), gold, 0, y, 0);
    const arm = [];
    for (let i = 0; i <= 10; i++) arm.push([u(i), u(46) - u(i * i / 14)]);
    for (const sg of [-1, 1]) K.put(tube(L, arm.map(([x, y]) => [sg * x, y, 0]), u(1), 24), gold);
    K.put(tube(L, [[0, u(40), 0], [0, u(44), 0], [0, u(48), 0]], u(1.2), 6), gold);
    for (const i of [6, 16, 26]) {
      const x = X(i), top = i === 16 ? u(56) : u(50);
      K.put(lathe([[0.001, 0], [u(2.6), u(1.2)], [u(2.8), u(2)], [u(1.4), u(2)]], 20), gold, x, top - u(10), 0);
      K.put(cyl(u(1.5), u(8), u(1.5), 14), wax, x, top - u(4), 0);
      K.put(cyl(0.004, u(2), 0.004, 6), K.plain('#303038'), x, top + u(1), 0);
      flame(K, L, x, top + u(1.6), 0, u(7), K.pal.g, K.pal.gl);
    }
  },

  coffin(K, s, W, D, L) {
    const { THREE, ball } = L, wood = K.wood(), d = 0.36, z = -0.04;
    // a coffin stood on end: six-sided, wide at the shoulders, a lid on its front that swings open (js/base-play.js's door)
    const outline = (inset) => poly(THREE, [[-u(8 - inset), u(74 - inset)], [u(8 - inset), u(74 - inset)], [u(14 - inset), u(56)], [u(8 - inset * 0.6), u(2 + inset)], [-u(8 - inset * 0.6), u(2 + inset)], [-u(14 - inset), u(56)]]);
    K.put(extrude(THREE, outline(0), d, 0.02), K.wood(L.tone(K.pal.w, 0.8)), 0, 0, z);
    K.put(extrude(THREE, outline(1.6), 0.02, 0.006), K.plain('#2a1a24'), 0, 0, z + d / 2 + 0.02);
    const front = z + d / 2 + 0.04, door = K.door([-u(14), front], 1);
    door(extrude(THREE, outline(0.6), 0.05, 0.014), wood, 0, 0, front);
    const moon = crescent(THREE, u(7), u(6), u(3.5), u(2));
    door(extrude(THREE, moon, 0.02, 0.006), K.metal(K.pal.a), 0, u(46), front + 0.035);
    for (const y of [u(64), u(12)]) door(ball(u(1.6), 12, 10), K.metal(K.pal.a), 0, y, front + 0.03);
    door(ball(u(1.2), 10, 8), K.metal(K.pal.a), u(11), u(40), front + 0.03);
    K.inside = { x: 0, y: u(38), w: u(18), h: u(56), z: z + d / 2 + 0.032 };
  },

  blackcat(K, s, W, D, L) {
    const { rbox, ball, blob, cyl, torus } = L, fur = K.gloss('#2a2430'), plinth = K.plain(K.pal.p);
    // a plinth, the cat sat on it upright, its tail curled round its feet
    K.put(rbox(u(24), u(10), 0.5, 0.02), plinth, 0, u(5), 0);
    K.put(rbox(u(24) + 0.01, u(1.2), 0.51, 0.005), K.plain(L.tone(K.pal.p, 0.85)), 0, u(8.5), 0);
    const y = u(10);
    K.put(blob(u(15), u(16), 0.32, 0.7, 0.75), fur, 0, y + u(8), 0);
    K.put(blob(u(14), u(6), 0.3, 0.8, 0.8), fur, 0, y + u(3), 0.04);
    for (const sg of [-1, 1]) K.put(blob(u(4), u(10), 0.08, 0.8, 0.8), fur, sg * u(3), y + u(5), 0.14);
    K.put(ball(u(7.5), 20, 16).scale(1.05, 0.9, 0.95), fur, 0, y + u(20), 0.04);
    for (const sg of [-1, 1]) K.put(cyl(0.001, u(5), u(2.6), 4).rotateY(Math.PI / 4), fur, sg * u(4.6), y + u(27), 0.02, 0, 0, -sg * 0.3);
    for (const sg of [-1, 1]) {
      K.put(ball(u(1.5), 14, 10).scale(1, 1.1, 0.5), K.gloss('#f8d030'), sg * u(3), y + u(21), 0.04 + u(6.5));
      K.put(ball(u(0.6), 8, 6).scale(1, 1.6, 0.5), K.gloss('#202020'), sg * u(3), y + u(21), 0.045 + u(7));
    }
    K.put(ball(u(0.8), 8, 6), K.gloss('#e890a8'), 0, y + u(18.5), 0.04 + u(7.2));
    K.put(torus(u(5), u(0.9), TAU, 24).scale(1, 1, 0.75), K.cloth(K.pal.c), 0, y + u(14), 0.04, 0, Math.PI / 2 - 0.15);
    K.put(ball(u(1.2), 10, 8), K.metal('#f0c840'), 0, y + u(13.2), 0.04 + u(4.2));
    K.put(tube(L, [[u(6), y + u(1), -0.05], [u(10), y + u(1.5), 0.04], [u(8), y + u(1.5), 0.17], [u(3), y + u(1.5), 0.21]], u(1.5), 24), fur);
  },

  broom(K, s, W, D, L) {
    const { lathe, cyl, ball } = L, a = Math.atan2(u(10.5), u(64));
    // the straw, tied at the top with a band, the handle leaning from it to the left
    K.put(lathe([[u(9), 0], [u(8.6), u(6)], [u(6), u(14)], [u(4), u(19)], [u(3), u(21)], [0.001, u(21)]], 28).scale(1, 1, 0.55), K.pic(straw()), X(15), 0, 0);
    K.put(cyl(u(3.4), u(3), u(3.6), 20).scale(1, 1, 0.6), K.cloth(K.pal.c), X(15), u(22), 0);
    const h = u(66), g = cyl(u(1), h, u(1.1), 12);
    g.translate(0, h / 2, 0);
    K.put(g, K.wood(), X(16), u(20), 0, 0, 0, a);
    K.put(ball(u(1.4), 12, 10), K.wood(L.tone(K.pal.w, 0.8)), X(16) - Math.sin(a) * h, u(20) + Math.cos(a) * h, 0);
  },

  hatstand(K, s, W, D, L) {
    const { lathe, cyl, ball } = L, wood = K.wood(), hat = K.cloth(K.pal.c);
    // a turned foot and pole, the witch's hat hung on top, its point bent over
    K.put(lathe([[u(9), 0], [u(9), u(1)], [u(6), u(2.5)], [u(2), u(4)], [0, u(4)]], 28), wood, 0, 0, 0);
    K.put(cyl(u(1.5), u(38), u(1.5), 14), wood, 0, u(22), 0);
    K.put(cyl(u(14), u(1), u(14), 40), hat, 0, u(42), 0);
    K.put(lathe([[u(14), 0], [u(14.2), u(0.5)], [u(13.6), u(1)], [0, u(1)]], 40), hat, 0, u(41.5), 0);
    const H = u(30), cone = lathe([[u(8), 0], [u(7.4), H * 0.3], [u(5), H * 0.62], [u(2), H * 0.9], [0.001, H]], 32);
    K.put(bend(L, cone, (x, y, z) => { const f = y / H; return [x + (f * f) * u(7) + (f > 0.8 ? (f - 0.8) * u(6) : 0), y - (f > 0.8 ? (f - 0.8) ** 2 * u(30) : 0), z]; }), hat, 0, u(43), 0);
    K.put(cyl(u(8.2), u(3), u(8.4), 32), K.cloth(K.pal.a), 0, u(44.5), 0);
    K.put(L.rbox(u(4), u(3.4), 0.02, 0.004), K.metal(L.tone(K.pal.a, 1.3)), 0, u(44.5), u(8.3));
  },

  lectern(K, s, W, D, L) {
    const { THREE, rbox, cyl, lathe, blob } = L, wood = K.wood();
    // a foot, a turned column, a slanted desk, the spellbook open on it, a rune glowing over its pages
    K.put(rbox(u(16), u(5), 0.4, 0.02), wood, 0, u(2.5), 0);
    K.put(lathe([[u(3), 0], [u(3.4), u(2)], [u(2.4), u(5)], [u(2.4), u(22)], [u(3.4), u(25)], [u(3), u(27)], [0, u(27)]], 20), wood, 0, u(5), 0);
    const tilt = 0.32, ty = u(36);
    K.put(rbox(u(26), u(2), 0.36, 0.015), wood, 0, ty, 0, 0, tilt);
    K.put(rbox(u(26), u(1.4), 0.03, 0.006), K.wood(L.tone(K.pal.w, 0.8)), 0, ty - 0.02, 0.18, 0, tilt);
    for (const sg of [-1, 1]) {
      K.put(blob(u(11.5), u(1.6), 0.28, 0.35, 0.5), K.cloth(sg < 0 ? '#f0e4c4' : '#e8dcb8'), sg * u(6), ty + u(1.8) + 0.004, -0.005, 0, tilt, sg * 0.08);
      for (let j = 0; j < 4; j++) if (sg < 0) K.put(rbox(u(7), 0.004, 0.008, 0.002), K.plain('#8a7a5a'), -u(6), ty + u(2.6), -0.08 + j * 0.05, 0, tilt);
    }
    K.put(rbox(u(1.2), u(0.5), 0.3, 0.002), K.cloth(K.pal.c), 0, ty + u(2.4), 0.02, 0, tilt);
    K.put(rbox(u(1.2), u(4), 0.01, 0.002), K.cloth(K.pal.c), 0, ty - u(1), 0.19, 0, tilt);
    K.put(extrude(THREE, starShape(THREE, u(3)), 0.012, 0.004), K.glow('#68e8a0'), u(6), ty + u(9), -0.02, 0, -0.2);
    for (const [i, j] of [[22, 54], [12, 56], [26, 60]]) K.put(L.ball(0.012, 8, 6), K.glow('#a8f0c8'), X(i), u(j), -0.04);
  },

  spookylamp(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, iron = K.metal(), z = 0;
    // a base, an iron post that wavers up and leans right, the lantern hung from its crook
    K.put(rbox(u(14), u(6), 0.3, 0.02), iron, 0, u(3), 0);
    const post = [];
    for (let j = 0; j <= 70; j += 7) post.push([X(15.5 + Math.sin(j / 18) * 4 + (j > 50 ? (j - 50) * 0.4 : 0)), u(6 + j), z]);
    post.push([X(22), u(79), z], [X(26), u(80), z]);
    K.put(tube(L, post, u(1.4), 40), iron);
    const lx = X(26.5), ly = u(70);
    K.put(cyl(0.006, u(4), 0.006, 6), iron, lx, ly + u(10), z);
    K.put(rbox(u(9), u(12), u(9), 0.012), K.M('glass', '#c8f8d8', { key: 'lantern' }), lx, ly, z);
    K.put(rbox(u(5), u(8), u(5), 0.01), K.glow('#88f0a8'), lx, ly, z);
    for (const y of [ly - u(6.5), ly + u(6.5)]) K.put(rbox(u(10), u(1.4), u(10), 0.006), iron, lx, y, z);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.put(rbox(u(1), u(12), u(1), 0.003), iron, lx + sx * u(4.5), ly, z + sz * u(4.5));
    K.put(cyl(0.001, u(4), u(5) * Math.SQRT2, 4).rotateY(Math.PI / 4), iron, lx, ly + u(9), z);
    K.put(ball(u(1), 8, 6), iron, lx, ly + u(11.2), z);
    for (const [i, j, a] of [[8, 60, 0.6], [10, 40, -0.4], [14, 22, 0.9], [11, 50, 2.5]]) K.put(ball(1, 10, 8).scale(u(2.4), u(1.2), u(1.6)), K.cloth(K.pal.leaf), X(i) + u(4), u(j), 0.04, a, 0, 0.3);
  },

  ironfence(K, s, W, D, L) {
    const { cyl, rbox, torus } = L, iron = K.metal(), hi = K.metal(L.tone(K.pal.m, 1.25));
    // spear-topped bars, two rails, a ring between each pair
    for (let i = 0; i < 6; i++) {
      const x = X(2 + i * 6);
      K.put(cyl(u(1), u(40), u(1), 8), iron, x, u(20), 0);
      K.put(cyl(0.001, u(6), u(2.2), 4).rotateY(Math.PI / 4), hi, x, u(43), 0);
      K.put(L.ball(u(1.4), 10, 8), iron, x, u(40), 0);
    }
    for (const y of [u(33), u(9)]) K.put(rbox(1, u(2), u(1.6), 0.006), iron, 0, y, 0);
    for (let i = 0; i < 5; i++) K.put(torus(u(2), u(0.55), TAU, 20), iron, X(5 + i * 6), u(22), 0);
  },

  deadtree(K, s, W, D, L) {
    const { cyl, ball, lathe } = L, bark = K.wood(L.tone(K.pal.w, 0.7)), R = K.r;
    // a trunk that wavers up from flared roots, bare branches forking twice, a hollow in it
    const trunk = [];
    for (let j = 0; j <= 56; j += 4) trunk.push([X(16 + Math.sin(j / 9) * 2), u(j), 0]);
    K.put(tube(L, trunk, u(2.6), 40), bark);
    K.put(lathe([[u(7), 0], [u(4.5), u(2)], [u(3), u(6)], [0.001, u(8)]], 18), bark, X(16), 0, 0);
    for (let i = 0; i < 4; i++) { const a = i * 1.6 + 0.4; K.put(cyl(u(0.6), u(9), u(1.8), 8).rotateZ(Math.PI / 2 - 0.25).rotateY(a), bark, X(16) + Math.cos(a) * u(4), u(1.4), -Math.sin(a) * u(4)); }
    const twig = (p, dir, len, r, d) => {
      const e = [p[0] + dir[0] * len, p[1] + dir[1] * len, p[2] + dir[2] * len];
      K.put(tube(L, [p, [(p[0] + e[0]) / 2 + (R() - 0.5) * 0.02, (p[1] + e[1]) / 2, (p[2] + e[2]) / 2], e], r, 8), bark);
      K.put(ball(r, 8, 6), bark, ...e);
      if (d < 2) for (const [turn, k] of [[-0.6, 0.55], [0.5, 0.6]]) {
        const c = Math.cos(turn), sn = Math.sin(turn), nd = [dir[0] * c - dir[1] * sn, dir[0] * sn + dir[1] * c, dir[2] + (R() - 0.5) * 0.8];
        const l = Math.hypot(...nd);
        twig(e, nd.map(v => v / l), len * k, r * 0.6, d + 1);
      }
    };
    const top = [X(16 + Math.sin(56 / 9) * 2), u(54), 0];
    twig(top, [Math.sin(-0.7), Math.cos(0.7), 0.2], u(14), u(1.4), 0);
    twig(top, [Math.sin(0.6), Math.cos(0.6), -0.25], u(15), u(1.4), 0);
    twig(top, [0.05, 1, 0.1], u(12), u(1.1), 1);
    K.put(ball(u(2.4), 12, 10).scale(1, 1.3, 0.4), K.plain('#1a1420'), X(16 + Math.sin(28 / 9) * 2), u(28), u(2.2));
  },

  litwick(K, s, W, D, L) {
    const { cyl, ball, lathe } = L, wax = K.gloss('#f4f4f8');
    // three Litwick, short to tall: wax bodies with drips, yellow eyes, purple flames
    for (const [cx, hh, z] of [[8, 16, 0.06], [24, 12, 0.08], [16, 22, -0.1]]) {
      const x = X(cx), h = u(hh);
      K.put(lathe([[u(4), 0], [u(4), h - u(1)], [u(3.4), h], [0.001, h + u(0.4)]], 24), wax, x, 0, z);
      for (const [a, len] of [[-0.6, 4], [0.5, 6], [2.4, 5]]) K.put(lathe([[u(0.9), 0], [u(1), u(len) * 0.7], [0.001, u(len)]], 10).rotateZ(Math.PI), wax, x + Math.sin(a) * u(3.9), h - u(0.5), z + Math.cos(a) * u(3.9));
      for (const sg of [-1, 1]) K.put(ball(u(0.8), 10, 8).scale(1, 1.5, 0.6), K.gloss('#f8d030'), x + sg * u(1.5), h - u(6), z + u(3.9));
      K.put(cyl(0.004, u(1.5), 0.004, 6), K.plain('#303038'), x, h + u(0.8), z);
      flame(K, L, x, h + u(1), z, u(9), '#a868f8', '#e0c8ff');
    }
  },

  pumpkins(K, s, W, D, L) {
    const { cyl, ball } = L;
    // three pumpkins piled, ribbed, their stems
    for (const [cx, cy, rx, ry, c, z, turn] of [[9, 7, 8, 6, '#f08030', 0.1, 0.3], [23, 8, 8, 7, '#e86a20', 0.02, 1], [16, 18, 7, 6, '#f8a040', -0.1, 2]]) {
      K.put(ribbed(L, u(rx), u(ry), u(rx) * 0.95, 8, 0.1).rotateY(turn), K.gloss(c), X(cx), u(cy), z);
      K.put(cyl(u(0.9), u(3), u(1.3), 8).rotateZ(0.2), K.wood('#5a7a2a'), X(cx), u(cy + ry + 1), z);
    }
    K.put(ball(1, 12, 8).scale(0.07, 0.014, 0.045), K.cloth(K.pal.leaf), X(21), u(26), -0.08, 0.4, 0, -0.3);
  },

  raggeddoll(K, s, W, D, L) {
    const { blob, ball, rbox, cyl } = L, body = K.cloth(K.pal.c), dark = K.cloth(L.tone(K.pal.c, 0.75)), head = K.cloth(K.pal.p), ink = K.gloss(INK);
    // stubby legs, a stuffed body stitched up the front, floppy arms, a big head: one button eye, one stitched X
    for (const sg of [-1, 1]) K.put(blob(u(5), u(7), 0.16, 0.8, 0.8), dark, sg * u(4.5), u(3.5), 0.02);
    K.put(blob(u(18), u(19), 0.42, 0.75, 0.75), body, 0, u(14), 0);
    for (let j = 0; j < 5; j++) K.put(rbox(u(2), 0.008, 0.01, 0.002), K.plain(L.tone(K.pal.c, 0.55)), 0, u(8 + j * 3), 0.205);
    for (const sg of [-1, 1]) K.put(blob(u(9), u(4.5), 0.13, 0.8, 0.8), body, sg * u(11), u(16), 0.02, 0, 0, sg * 0.5);
    K.put(ball(u(9), 22, 18).scale(1, 0.95, 0.85), head, 0, u(32), 0.02);
    const fz = 0.02 + u(9) * 0.85;
    K.put(cyl(u(2.5), 0.02, u(2.5), 16).rotateX(Math.PI / 2), ink, -u(4), u(34), fz - 0.02);
    for (const a of [0.8, -0.8]) K.put(rbox(u(5), u(1), 0.01, 0.003), ink, u(4), u(35), fz - 0.025, 0, 0, a);
    for (let i = 0; i < 7; i++) K.put(rbox(u(1.2), u(i % 2 ? 1.6 : 0.8), 0.01, 0.002), K.plain('#a84848'), X(13.5 + i), u(28.5), fz - 0.05, 0.2 * (i - 3) * 0.2);
    for (let i = 0; i < 9; i++) { const a = (i / 8 - 0.5) * 2.2; K.put(rbox(u(2), u(5), u(2), 0.01), K.cloth(K.pal.a), Math.sin(a) * u(8.4), u(32) + Math.cos(a) * u(8.4), 0.02 + (i % 3 - 1) * 0.06, 0, 0, -a); }
  },

  ghostsheet(K, s, W, D, L) {
    const { lathe, ball } = L, sheetM = K.gloss('#fafbff'), ink = K.gloss(INK);
    // a sheet over something round: a dome, then falling in folds to a wavy hem
    const prof = [[0.001, u(52)]];
    for (let j = 1; j <= 50; j += 2) {
      const half = j < 14 ? Math.sqrt(196 - (14 - j) ** 2) * 0.85 : 12 + (j - 14) / 9;
      prof.push([u(half), u(52 - j)]);
    }
    prof.push([u(15.6), u(0.3)], [u(14.6), 0], [u(13), u(3)], [0.001, u(3)]);
    const g = bend(L, lathe([...prof].reverse(), 64), (x, y, z) => {
      const a = Math.atan2(z, x), f = Math.max(0, 1 - y / u(36));
      const r = 1 + f * 0.09 * Math.sin(a * 7);
      return [x * r, y, z * r * 0.82];
    });
    K.put(g, sheetM, 0, 0, 0);
    const rAt = (y) => { for (let i = 1; i < prof.length; i++) if (prof[i][1] <= y) { const [r0, y0] = prof[i - 1], [r1, y1] = prof[i]; return r1 + (r0 - r1) * (y - y1) / (y0 - y1 || 1); } return u(12); };
    const fz = (y, x = 0) => Math.sqrt(Math.max(0.05, rAt(y) ** 2 - x * x)) * 0.82;
    for (const sg of [-1, 1]) K.put(ball(1, 14, 10).scale(u(2.5), u(3.5), 0.012), ink, sg * u(5), u(40), fz(u(40), u(5)) - 0.004, sg * 0.35);
    K.put(ball(1, 14, 10).scale(u(3), u(2), 0.012), ink, 0, u(32), fz(u(32)) - 0.002);
  },

  /* ----- Bathroom ----- */

  clawtub(K, s, W, D, L) {
    const { cyl, ball, lathe } = L, hw = W / 2 - u(1.5), hd = 0.4, enamel = K.gloss(K.pal.p), gold = K.metal(K.pal.a);
    // a roll-top tub: wider at the rim, rounded under; the inside a step in from the rim, water and foam in it
    const outer = [[hd * 0.999, u(6)], [u(8), u(7)], [u(4), u(10)], [u(1.5), u(16)], [u(0.5), u(24)], [0, u(28)], [-u(1), u(29.5)], [-u(1), u(31)], [u(0.3), u(32)], [u(1.8), u(31)], [u(2.2), u(28)], [u(4), u(14)], [hd * 0.999, u(11)]];
    K.put(swept(L, hw, hd, outer, 5), enamel, 0, 0, 0);
    K.put(swept(L, hw + 0.004, hd + 0.004, [[u(1.3), u(21.5)], [u(1.3), u(22.5)]], 5), K.gloss(K.pal.c), 0, 0, 0);
    K.put(swept(L, hw - u(2.6), hd - u(2.6), [[hd - u(2.6), u(24)], [0, u(24)]], 5), K.M('glass', '#bfe0f0', { key: 'bathwater' }), 0, 0, 0);
    for (const [i, r, z] of [[0.25, 4, -0.05], [0.38, 5, 0.1], [0.52, 4, -0.1], [0.33, 3, 0.18], [0.6, 3.4, 0.08], [0.45, 3, -0.2]]) K.put(ball(u(r), 16, 12), K.gloss('#ffffff'), -W / 2 + W * i, u(26), z);
    // claw feet in the four corners
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const x = sx * (hw - u(5)), z = sz * (hd - u(4));
      K.put(lathe([[u(2.4), 0], [u(2.6), u(1.5)], [u(1.6), u(3)], [u(1.8), u(6)], [u(2.6), u(8)], [0.001, u(8.5)]], 14), gold, x, 0, z);
      for (let c = -1; c <= 1; c++) K.put(ball(u(1), 8, 6), gold, x + c * u(1.4), u(0.8), z + sz * u(1.6));
    }
    // the taps at the right end
    const tx = W / 2 - u(8);
    K.put(cyl(u(1), u(12), u(1), 12), K.metal(), tx, u(36), -0.12);
    K.put(lathe([[u(1), 0], [u(1), u(4)], [u(0.8), u(5)]], 10).rotateZ(Math.PI / 2), K.metal(), tx, u(41), -0.12);
    K.put(cyl(u(1), u(6), u(1), 10).rotateZ(Math.PI / 2), K.metal(), tx - u(3), u(41.5), -0.12);
    for (const sz of [-1, 1]) K.put(ball(u(1.3), 10, 8), K.metal(), tx + u(1.5), u(38), -0.12 + sz * u(2.5));
  },

  bubblebath(K, s, W, D, L) {
    const { rbox, ball } = L, w = W - u(2), d = 0.86, body = K.gloss(K.pal.c), rim = K.gloss(K.pal.p), R = K.r;
    // a panelled bath set in its box: the front's panels, a wide rim round a tub of water, foam heaped up, a duck afloat
    K.put(rbox(w, u(24), d, 0.02), body, 0, u(12), 0);
    for (let i = 0; i < 6; i++) K.put(rbox(w / 6 - 0.04, u(16), 0.02, 0.012), K.gloss(L.tone(K.pal.c, 1.1)), -w / 2 + (i + 0.5) * w / 6, u(11), d / 2 + 0.004);
    const rw = u(4);
    for (const sz of [-1, 1]) K.put(rbox(W, u(3), rw, 0.01), rim, 0, u(25.5), sz * (d / 2 - rw / 2 + 0.01));
    for (const sx of [-1, 1]) K.put(rbox(rw, u(3), d, 0.01), rim, sx * (W / 2 - rw / 2), u(25.5), 0);
    K.put(rbox(W - rw * 2, 0.01, d - rw * 2 + 0.02, 0.002), K.M('glass', '#9ad0f0', { key: 'bathwater' }), 0, u(23), 0);
    for (let n = 0; n < 22; n++) K.put(ball(u(2 + R() * 3), 14, 10), K.gloss('#f4f8ff'), (R() - 0.5) * (W - rw * 3), u(24 + R() * 3), (R() - 0.5) * (d - rw * 3));
    duck(K, L, W / 2 - u(16), u(25), 0.05, 0.3);
  },

  shower(K, s, W, D, L) {
    const { rbox, cyl, ball, lathe, THREE } = L, frame = K.metal(), d = 0.9, H = u(84), wall = K.pic(tiles(K.pal.c));
    // a tray, tiled walls behind and to the left, glass to the front and right on a metal frame, the shower head on the back wall
    K.put(rbox(1, u(4), d, 0.015), K.gloss(K.pal.p), 0, u(2), 0);
    K.put(cyl(u(1.4), 0.006, u(1.4), 14), K.metal('#8a8e98'), 0.08, u(4), 0);
    K.put(rbox(u(28), H - u(4), 0.04, 0.008), K.plain('#e8f0f4'), 0, u(4) + (H - u(4)) / 2, -d / 2 + 0.02);
    K.put(new THREE.PlaneGeometry(u(28), H - u(4)), wall, 0, u(4) + (H - u(4)) / 2, -d / 2 + 0.041);
    K.put(rbox(0.04, H - u(4), d - 0.04, 0.008), K.plain('#e8f0f4'), -0.48, u(4) + (H - u(4)) / 2, 0);
    K.put(new THREE.PlaneGeometry(d - 0.06, H - u(4)), wall, -0.459, u(4) + (H - u(4)) / 2, 0, Math.PI / 2);
    const glass = K.M('glass', '#bee1f5', { key: 'showerglass' });
    K.put(rbox(0.012, H - u(6), d - 0.06, 0.004), glass, 0.48, u(4) + (H - u(4)) / 2, 0);
    K.put(rbox(1 - 0.06, H - u(6), 0.012, 0.004), glass, 0, u(4) + (H - u(4)) / 2, d / 2 - 0.02);
    for (const [x, z] of [[-0.48, d / 2 - 0.02], [0.48, d / 2 - 0.02], [0.48, -d / 2 + 0.02]]) K.put(rbox(u(1.6), H, u(1.6), 0.006), frame, x, H / 2 + u(1), z);
    K.put(rbox(1, u(1.6), u(1.6), 0.006), frame, 0, H + u(1), d / 2 - 0.02);
    K.put(rbox(u(1.6), u(1.6), d, 0.006), frame, 0.48, H + u(1), 0);
    K.put(rbox(u(1), u(6), 0.03, 0.006), frame, 0.42, u(44), d / 2 - 0.005);
    for (let i = 0; i < 6; i++) K.put(rbox(u(1), 0.004, 0.004, 0.001), K.plain('#ffffff'), 0.1 - i * 0.03, u(30 + i * 1.2), d / 2 - 0.01, 0, 0, 0.8);
    // the pipe up the back wall, its arm, the head tipped down
    const bz = -d / 2 + 0.06;
    K.put(cyl(u(1), u(30), u(1), 10), frame, X(23), u(65), bz);
    K.put(cyl(u(1), u(10), u(1), 10).rotateZ(Math.PI / 2), frame, X(19), u(80), bz);
    K.put(cyl(u(0.8), 0.12, u(0.8), 10).rotateX(Math.PI / 2), frame, X(14), u(80), bz + 0.06);
    K.put(lathe([[u(1), 0], [u(4), u(2)], [u(4), u(2.6)], [0.001, u(2.6)]], 24), frame, X(14), u(76), bz + 0.13, 0, -0.5);
    K.put(cyl(u(3.6), 0.004, u(3.6), 24), K.plain('#5a6070'), X(14), u(76) - 0.003, bz + 0.13, 0, -0.5);
    for (const sg of [-1, 1]) K.put(ball(u(1.6), 12, 8), K.metal(K.pal.a), X(23) + sg * u(3), u(46), bz);
  },

  hamper(K, s, W, D, L) {
    const { lathe, ball, blob, rbox } = L, ww = K.pic(wicker(K.pal.w, L.tone(K.pal.w, 0.7), L.tone(K.pal.w, 1.2)));
    // a woven basket wider at the top, a cloth hanging out under the lid, the domed lid and its knob
    K.put(lathe([[u(9), 0], [u(9.6), u(10)], [u(10.4), u(22)], [u(11), u(30)], [0.001, u(30)]], 36), ww, 0, 0, 0);
    K.put(L.torus(u(11), u(1.2), TAU, 36), K.wood(L.tone(K.pal.w, 0.8)), 0, u(30), 0, 0, Math.PI / 2);
    K.put(blob(u(24), u(6), u(24), 0.9, 0.55), K.wood(L.tone(K.pal.w, 0.8)), 0, u(32), 0);
    K.put(lathe([[u(2.4), 0], [u(3), u(1.6)], [u(1.6), u(3)], [0.001, u(3)]], 16), K.wood(), 0, u(34.5), 0);
    K.put(rbox(u(4.5), u(11), 0.03, 0.01), K.cloth(K.pal.c), X(9), u(25), u(10.6), 0, 0.12, 0.08);
    K.put(ball(1, 12, 8).scale(u(3), u(1.6), u(2)), K.cloth(K.pal.c), X(9), u(30.5), u(10));
  },

  toiletroll(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, metal = K.metal(), paper = K.gloss('#f8f8f4');
    // a base, a pole with a ball on top, three rolls stacked on it
    K.put(cyl(u(6), u(2), u(6.5), 28), metal, 0, u(1), 0);
    K.put(cyl(u(1), u(42), u(1), 12), metal, 0, u(23), 0);
    K.put(ball(u(2.5), 16, 12), K.metal(K.pal.a), 0, u(46), 0);
    for (let n = 0; n < 3; n++) {
      const y = u(2.5 + n * 11);
      K.put(cyl(u(6), u(9), u(6), 32), paper, 0, y + u(4.5), 0);
      K.put(L.torus(u(6), 0.006, TAU, 32), K.plain('#e8e4dc'), 0, y + u(9), 0, 0, Math.PI / 2);
      K.put(cyl(u(1.8), 0.004, u(1.8), 16), K.plain('#c8c0b0'), 0, y + u(9) + 0.002, 0);
      if (n === 2) K.put(rbox(u(4), u(7), 0.006, 0.002), paper, u(1.5), y + u(5), u(6) + 0.003, 0.2);
    }
  },

  towelladder(K, s, W, D, L) {
    const { rbox, cyl, blob } = L, wood = K.wood(), lean = 0.22, H = u(72);
    // two rails leant back against the wall, five rungs, a towel over the 1st and 3rd
    const at = (y) => 0.22 - (y / H) * (lean + 0.22);
    for (const x of [X(7.5), X(23.5)]) rod(K, L, wood, [x, 0, at(0)], [x, H, at(H)], u(1.4));
    for (let r = 0; r < 5; r++) { const y = u(12 + r * 14); K.put(cyl(u(1), X(23.5) - X(7.5), u(1), 10).rotateZ(Math.PI / 2), K.wood(L.tone(K.pal.w, 1.15)), X(15.5), y, at(y)); }
    const towel = (r, c) => {
      const y = u(12 + r * 14), z = at(y), col = K.cloth(c);
      K.put(cyl(u(1.6), u(17), u(1.6), 14, false).rotateZ(Math.PI / 2), col, X(15.5), y, z);
      K.put(rbox(u(17), u(11), 0.02, 0.008), col, X(15.5), y - u(5.5), z + u(1.4), 0, -0.05);
      K.put(rbox(u(17), u(9), 0.02, 0.008), col, X(15.5), y - u(4.5), z - u(1.4), 0, 0.05);
      K.put(rbox(u(17), u(1), 0.025, 0.004), K.cloth(L.tone(c, 1.15)), X(15.5), y - u(8), z + u(1.5));
    };
    towel(1, K.pal.c);
    towel(3, K.pal.p);
    for (const x of [X(7.5), X(23.5)]) K.put(blob(u(3), u(1.2), u(3), 0.8, 0.8), K.plain(L.tone(K.pal.w, 0.6)), x, u(0.5), at(0));
  },

  jacuzzi(K, s, W, D, L) {
    const { rbox, ball, blob } = L, h = 0.48, t = 0.1, wood = K.wood(), R = K.r;
    // a wooden tub, slats round its sides, a rim; inside blue tiles, water, bubbles, two headrests; a step at the front
    const sides = [[0, -D / 2 + t / 2, W, t], [0, D / 2 - t / 2, W, t], [-W / 2 + t / 2, 0, t, D - 0.02], [W / 2 - t / 2, 0, t, D - 0.02]];
    for (const [x, z, w, d] of sides) K.put(rbox(w, h, d, 0.02), wood, x, h / 2, z);
    for (let i = 0; i < 14; i++) {
      const f = (i + 0.5) / 14 - 0.5;
      K.put(rbox(0.012, h - 0.04, 0.006, 0.002), K.plain(L.tone(K.pal.w, 0.7)), f * W, h / 2, D / 2 + 0.001);
      K.put(rbox(0.006, h - 0.04, 0.012, 0.002), K.plain(L.tone(K.pal.w, 0.7)), W / 2 + 0.001, h / 2, f * D);
    }
    for (const [x, z, w, d] of sides) K.put(rbox(w + 0.02, 0.04, d + 0.04, 0.012), K.wood(L.tone(K.pal.w, 1.15)), x, h + 0.01, z);
    K.put(rbox(W - t * 2, 0.06, D - t * 2, 0.01), K.plain('#3a9ad8'), 0, 0.06, 0);
    K.put(rbox(W - t * 2, 0.012, D - t * 2, 0.004), K.M('glass', '#5ab8f0', { key: 'tubwater' }), 0, h - 0.08, 0);
    K.put(rbox(W - t * 2 - 0.02, h - 0.2, 0.004, 0.002), K.plain('#3a9ad8'), 0, h / 2, -D / 2 + t + 0.003);
    for (let n = 0; n < 30; n++) K.put(ball(0.012 + R() * 0.02, 8, 6), K.gloss('#d8f4ff'), (R() - 0.5) * (W - t * 2.6), h - 0.075, (R() - 0.5) * (D - t * 2.6));
    for (const sg of [-1, 1]) K.put(blob(0.36, 0.12, 0.16, 0.6, 0.6), K.cloth(K.pal.c), sg * 0.5, h + 0.04, -D / 2 + 0.1, 0, -0.3);
    K.put(rbox(0.5, 0.16, 0.22, 0.02), K.wood(L.tone(K.pal.w, 1.15)), 0, 0.08, D / 2 + 0.06);
  },

  bigduck(K, s, W, D, L) {
    duck(K, L, 0, 0, 0, 1);
  },

  /* ----- Bedroom ----- */

  bunkbed(K, s, W, D, L) {
    const { rbox, blob } = L, wood = K.wood(), post = K.wood(L.tone(K.pal.w, 0.85)), w = W - u(4), d = D - 0.08;
    // four tall posts, two decks of slats and rails, each with a mattress, a pillow and a blanket; a guard rail up top; a ladder at the side
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.put(rbox(u(4), u(86), u(4), 0.012), post, sx * (W / 2 - u(2)), u(43), sz * (D / 2 - u(2)));
    for (const y of [u(12), u(52)]) {
      K.put(rbox(w, u(6), d - u(4), 0.012), wood, 0, y - u(3), 0);
      K.put(blob(w - 0.04, u(8), d - 0.14, 0.4, 0.4), K.cloth(K.pal.p), 0, y + u(3.5), 0);
      K.put(blob(w - 0.02, u(7), (d - 0.14) * 0.66, 0.35, 0.35), K.cloth(K.pal.c), 0, y + u(5.5), (d - 0.14) * 0.17);
      K.put(rbox(w - 0.01, u(2), 0.03, 0.01), K.cloth(L.tone(K.pal.c, 1.2)), 0, y + u(6), (d - 0.14) * 0.17 - (d - 0.14) * 0.33);
      K.put(blob(w * 0.7, u(5), 0.3, 0.6, 0.6), K.cloth('#ffffff'), 0, y + u(9), -d / 2 + 0.26);
    }
    for (const sx of [-1, 1]) K.put(rbox(u(3), u(3), d, 0.01), wood, sx * (W / 2 - u(2)), u(70.5), 0);
    for (const sz of [-1, 1]) K.put(rbox(w, u(3), u(3), 0.01), wood, 0, u(70.5), sz * (D / 2 - u(2)));
    for (const sz of [-1, 1]) K.put(rbox(w, u(10), u(2.4), 0.01), wood, 0, sz < 0 ? u(22) : u(62), sz * (D / 2 - u(2)));
    // the ladder up the right side, near the foot
    const lx = W / 2 + u(1.5), z0 = D / 2 - 0.5;
    for (const z of [z0 - 0.15, z0 + 0.15]) K.put(rbox(u(2), u(56), u(2), 0.006), wood, lx, u(28), z);
    for (let j = 8; j < 56; j += 10) K.put(rbox(u(2), u(1.6), 0.3, 0.005), K.wood(L.tone(K.pal.w, 1.15)), lx, u(j), z0);
  },

  crib(K, s, W, D, L) {
    const { rbox, cyl, ball, blob } = L, wood = K.wood(), slat = K.wood(K.pal.p), w = u(30), d = 0.62;
    // corner posts, top and bottom rails, slats all round, a mattress and pillow inside; a mobile over it
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      K.put(cyl(u(1.5), u(40), u(1.5), 12), wood, sx * (w / 2 - u(1.5)), u(20), sz * (d / 2 - u(1.5)));
      K.put(ball(u(2), 12, 10), wood, sx * (w / 2 - u(1.5)), u(40.5), sz * (d / 2 - u(1.5)));
    }
    for (const y of [u(36.5), u(9.5)]) {
      for (const sz of [-1, 1]) K.put(rbox(w - u(3), u(3), u(2), 0.008), wood, 0, y, sz * (d / 2 - u(1.5)));
      for (const sx of [-1, 1]) K.put(rbox(u(2), u(3), d - u(3), 0.008), wood, sx * (w / 2 - u(1.5)), y, 0);
    }
    for (let i = 0; i < 6; i++) for (const sz of [-1, 1]) K.put(cyl(u(0.9), u(24), u(0.9), 8), slat, X(7 + i * 4), u(23), sz * (d / 2 - u(1.5)));
    for (let i = 0; i < 4; i++) for (const sx of [-1, 1]) K.put(cyl(u(0.9), u(24), u(0.9), 8), slat, sx * (w / 2 - u(1.5)), u(23), -d / 2 + 0.11 + i * 0.13);
    K.put(rbox(w - u(4), u(4), d - u(4), 0.012), K.wood(L.tone(K.pal.w, 0.85)), 0, u(12), 0);
    K.put(blob(w - u(5), u(5), d - u(5), 0.45, 0.45), K.cloth(K.pal.c), 0, u(16), 0);
    K.put(blob(u(9), u(4), 0.2, 0.6, 0.6), K.cloth('#ffffff'), X(8.5), u(19.5), -0.12);
    const mx = w / 2 - u(1.5), mz = -d / 2 + u(1.5);
    K.put(cyl(u(0.5), u(24), u(0.5), 8), K.metal(), mx, u(52), mz);
    rod(K, L, K.metal(), [mx, u(64), mz], [X(14), u(64), mz + 0.18], u(0.5));
    [K.pal.a, K.pal.c, '#f8d030'].forEach((c, n) => {
      const f = (n + 1) / 3.4, x = mx + (X(14) - mx) * f, z = mz + 0.18 * f;
      K.put(cyl(0.003, u(5), 0.003, 4), K.plain('#c8c8d0'), x, u(61), z);
      K.put(ball(u(2), 14, 10), K.gloss(c), x, u(57), z);
    });
  },

  jewelbox(K, s, W, D, L) {
    const { rbox, ball } = L, wood = K.wood(), gold = K.metal(K.pal.a), d = 0.36;
    // the box with a gold band and clasp, a velvet tray, the lid stood open behind with a mirror in it; pearls spilling out
    K.put(rbox(u(20), u(14), d, 0.015), wood, 0, u(7), 0);
    K.put(rbox(u(20) + 0.005, u(1), d + 0.005, 0.003), gold, 0, u(10), 0);
    K.put(rbox(u(2), u(3), 0.012, 0.003), gold, 0, u(8.5), d / 2 + 0.005);
    K.put(rbox(u(18), u(1.4), d - 0.04, 0.006), K.cloth(K.pal.c), 0, u(14.3), 0);
    for (const [x, c] of [[-u(4), '#e04878'], [u(3), '#48c8e8']]) K.put(L.lathe([[0.001, 0], [u(2), u(1)], [u(1.4), u(2.4)], [0.001, u(2.6)]], 6), K.gloss(c), x, u(14.8), 0.02);
    K.put(rbox(u(20), u(13), 0.04, 0.012), K.wood(L.tone(K.pal.w, 1.15)), 0, u(21), -d / 2 + 0.01, 0, -0.12);
    K.put(rbox(u(16), u(9), 0.006, 0.006), K.gloss('#cfe8f4'), 0, u(21), -d / 2 + 0.034, 0, -0.12);
    K.put(rbox(u(4), u(2), 0.003, 0.003), K.plain('#ffffff'), -u(4.5), u(23), -d / 2 + 0.04, 0, -0.12);
    for (let i = 0; i < 9; i++) K.put(ball(u(1.2), 10, 8), K.gloss('#fff8f0'), X(7 + i * 2.2), u(13.5 - Math.sin(i / 8 * Math.PI) * 6), d / 2 + 0.01 + Math.sin(i / 8 * Math.PI) * 0.02);
  },

  alarmclock(K, s, W, D, L) {
    const { THREE, cyl, ball, lathe, rbox } = L, case_ = K.gloss(K.pal.c), bell = K.metal(K.pal.a), metal = K.metal();
    // a round case, its face, two bells on top with the hammer between, splayed feet
    const cy = u(15), r = u(11), d = 0.22;
    K.put(cyl(r, d, r, 40).rotateX(Math.PI / 2), case_, 0, cy, 0);
    K.put(L.torus(r - u(0.5), u(1), TAU, 40), K.gloss(L.tone(K.pal.c, 0.8)), 0, cy, d / 2);
    K.put(new THREE.CircleGeometry(u(9.5), 40), K.pic(clockFace()), 0, cy, d / 2 + 0.003);
    K.put(cyl(u(9.5), 0.01, u(9.5), 40).rotateX(Math.PI / 2), K.M('glass', '#ffffff', { key: 'clockglass' }), 0, cy, d / 2 + 0.012);
    for (const sg of [-1, 1]) {
      K.put(lathe([[u(4.2), 0], [u(4), u(1.6)], [u(3), u(3.6)], [0.001, u(4.4)]], 24), bell, sg * u(7), u(24), -0.02, 0, 0, -sg * 0.45);
      K.put(ball(u(1), 8, 6), bell, sg * u(9.2), u(29.3), -0.02);
      K.put(cyl(u(1), u(5), u(1), 8), metal, sg * u(6), u(1.8), -0.04, 0, 0, sg * 0.35);
      K.put(ball(u(1.3), 10, 8), metal, sg * u(7), u(0.8), -0.04);
    }
    K.put(cyl(u(0.7), u(5), u(0.7), 8), metal, 0, u(27.5), -0.02);
    K.put(rbox(u(5), u(1.4), u(1.4), 0.004), metal, 0, u(29.5), -0.02);
    K.put(cyl(u(1.4), 0.04, u(1.4), 12).rotateX(Math.PI / 2), metal, 0, cy, -d / 2 - 0.02);
  },

  slippers(K, s, W, D, L) {
    const { blob, ball } = L, cloth = K.cloth(K.pal.c), inside = K.cloth(L.tone(K.pal.c, 0.6)), pom = K.cloth(K.pal.p);
    // a pair, toes forward: soft shells, the opening at the heel, a pompom on each toe
    for (const [x, turn] of [[-0.18, 0.12], [0.18, -0.08]]) {
      const z0 = 0.02, c = Math.cos(turn), sn = Math.sin(turn), at = (dz) => [x + sn * dz, z0 + c * dz];
      K.put(blob(u(9), u(7), u(15), 0.75, 0.6), cloth, x, u(3.5), z0, turn);
      const [ox, oz] = at(-u(3));
      K.put(ball(1, 16, 10).scale(u(3.2), u(1), u(5)), inside, ox, u(6.6), oz, turn);
      const [px, pz] = at(u(5));
      K.put(ball(u(2.6), 14, 12), pom, px, u(7), pz);
    }
  },

  starprojector(K, s, W, D, L) {
    const { THREE, cyl, lathe } = L, dome = L.litPic(nightDome(), 0.6);
    // a metal base with a band, a dome of night sky pricked with stars, a few stars thrown up into the air
    K.put(cyl(u(7), u(8), u(7.6), 32), K.metal(), 0, u(4), 0);
    K.put(cyl(u(7.7), u(1), u(7.7), 32), K.metal(K.pal.a), 0, u(3.5), 0);
    K.put(new THREE.SphereGeometry(u(12), 40, 16, 0, TAU, 0, Math.PI / 2).scale(1, 1, 1), dome, 0, u(8), 0);
    K.put(lathe([[u(12.2), 0], [u(12.2), u(0.6)], [u(7), u(0.6)]], 40), K.metal(), 0, u(7.8), 0);
    const R = K.r;
    for (let n = 0; n < 7; n++) {
      const x = (R() - 0.5) * 0.8, y = u(30) + R() * u(28), z = (R() - 0.5) * 0.6;
      K.put(extrude(THREE, starShape(THREE, 0.025 + R() * 0.015, 0.45, n % 2 ? 4 : 5), 0.008, 0.003), K.glow(n % 2 ? '#a8c8ff' : '#fff4c0'), x, y, z, R() * 6);
    }
  },

  moonlamp(K, s, W, D, L) {
    const { THREE, rbox, cyl } = L, moon = K.glow(K.pal.g);
    // a wooden base, a little stem, a crescent moon lit from within, a star twinkling by it
    K.put(rbox(u(16), u(6), 0.32, 0.02), K.wood(), 0, u(3), 0);
    K.put(cyl(u(1), u(8), u(1), 10), K.metal(), 0, u(10), 0);
    K.put(extrude(THREE, crescent(THREE, u(12), u(10), u(6), u(3)), 0.1, 0.04), moon, 0, u(26), 0);
    K.put(extrude(THREE, starShape(THREE, u(2.4), 0.35, 4), 0.02, 0.008), K.glow(K.pal.gl), X(24), u(39), 0.02, 0.2);
  },

  laundrypile(K, s, W, D, L) {
    const { blob, ball } = L, R = K.r;
    // a heap of clothes, each crumpled a little, a sock stood up out of it
    const crumple = (w, h, d, c, x, y, z, turn) => K.put(bend(L, blob(w, h, d, 0.7, 0.5), (px, py, pz) => { const k = 1 + 0.12 * Math.sin(px * 31 + pz * 17) * Math.cos(py * 23 + px * 11); return [px * k, py * (0.9 + 0.2 * Math.sin(pz * 29)), pz * k]; }), K.cloth(c), x, y, z, turn);
    crumple(u(28), u(9), 0.7, K.pal.c, 0, u(4), 0, 0.2);
    crumple(u(6), u(3), 0.22, K.pal.p, X(5), u(2), 0.24, 0.6);
    crumple(u(16), u(9), 0.42, K.pal.p, X(11), u(10), 0.06, -0.3);
    crumple(u(16), u(9), 0.4, K.pal.a, X(21), u(10), -0.08, 0.5);
    crumple(u(14), u(8), 0.34, BERRY_BLUE, X(16), u(15), 0, 1.1);
    const sock = [[X(24), u(15), 0.02], [X(24.5), u(19), 0.03], [X(24.5), u(23), 0.02], [X(23), u(25), 0.05]];
    K.put(tube(L, sock, u(1.6), 12), K.cloth(K.pal.p));
    K.put(L.cyl(u(1.8), u(2), u(1.8), 12), K.cloth(K.pal.c), X(24.5), u(21.5), 0.025);
    for (let i = 0; i < 3; i++) K.put(ball(u(1), 8, 6), K.cloth(K.pal.p), (R() - 0.5) * 0.6, u(1), 0.25 + R() * 0.1);
  },

  divider(K, s, W, D, L) {
    const { THREE, rbox } = L, n = 4, pw = W / n, h = u(66), fold = 0.38, wood = K.wood();
    // four panels hinged edge to edge in a zigzag, each a wooden frame round a painted paper (the painting's own panels)
    let x = -W / 2 * Math.cos(fold), z = 0;
    for (let i = 0; i < n; i++) {
      const a = i % 2 ? -fold : fold, dx = Math.cos(a) * pw, dz = -Math.sin(a) * pw, cx = x + dx / 2, cz = z + dz / 2;
      K.put(rbox(pw - 0.012, h, 0.05, 0.012), wood, cx, u(4) + h / 2, cz, a);
      const c = crop(K, L, [(i * 16 + 2) / 64, 3 / 70, (i * 16 + 13) / 64, 61 / 70]);
      const face = new THREE.PlaneGeometry(pw - u(5), u(58));
      K.put(face.clone().translate(0, 0, 0.0255).rotateY(a), K.pic(c.canvas), cx, u(4) + u(62) - u(29), cz);
      K.put(face.rotateY(Math.PI).translate(0, 0, -0.0255).rotateY(a), K.plain(K.pal.p), cx, u(4) + u(62) - u(29), cz);
      for (const sg of [-1, 1]) K.put(rbox(u(3), u(4), 0.05, 0.01), K.wood(L.tone(K.pal.w, 0.6)), cx + sg * Math.cos(a) * (pw / 2 - u(2.5)), u(2), cz - sg * Math.sin(a) * (pw / 2 - u(2.5)), a);
      x += dx; z += dz;
    }
  },

  /* ----- Office ----- */

  mailcart(K, s, W, D, L) {
    const { rbox, blob, cyl } = L, metal = K.metal(), d = 0.5;
    // a frame on four casters, a canvas sack hung in it, letters and a parcel poking out, a push handle behind
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { K.put(cyl(u(0.7), u(3), u(0.7), 6), metal, sx * u(10), u(6), sz * 0.18); wheel(K, L, sx * u(10), u(3), sz * 0.18, u(3), 0.03); }
    K.put(rbox(u(26), u(2), d, 0.008), metal, 0, u(8), 0);
    K.put(blob(u(22), u(26), d - 0.06, 0.6, 0.35), K.cloth(K.pal.c), 0, u(22), 0);
    K.put(rbox(u(22.5), u(1), d - 0.04, 0.004), K.cloth(L.tone(K.pal.c, 0.8)), 0, u(22), 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.put(rbox(u(1), u(26), u(1), 0.003), metal, sx * u(11.5), u(22), sz * (d / 2 - 0.02));
    for (const sz of [-1, 1]) K.put(rbox(u(24), u(1), u(1), 0.003), metal, 0, u(34.5), sz * (d / 2 - 0.02));
    K.put(rbox(u(10), u(7), 0.01, 0.003), K.plain('#fffbe8'), X(12), u(36.5), 0.06, 0.1, -0.1, 0.12);
    K.put(rbox(u(10), u(8), u(6), 0.008), K.plain('#f8e8c8'), X(20), u(37), -0.04, -0.3, 0, -0.1);
    K.put(rbox(u(3), u(3), 0.004, 0.001), K.plain('#e04848'), X(20) + 0.03, u(38), -0.04 + u(3) + 0.01, -0.3, 0, -0.1);
    for (const sx of [-1, 1]) K.put(cyl(u(1), u(38), u(1), 10), metal, sx * u(11.5), u(27), -d / 2 - 0.04, 0, -0.12);
    K.put(cyl(u(1.2), u(26), u(1.2), 12).rotateZ(Math.PI / 2), K.gloss('#303038'), 0, u(45.5), -d / 2 - 0.1);
  },

  paperboxes(K, s, W, D, L) {
    const { rbox } = L, card = '#d8b888';
    // two archive boxes stacked: a band of the theme's colour, a label, a hand hole; a ream of paper on top
    const box = (w, h, d, y, turn, z) => {
      K.put(rbox(w, h, d, 0.012), K.plain(card), 0, y + h / 2, z, turn);
      K.put(rbox(w + 0.004, u(2), d + 0.004, 0.004), K.plain(K.pal.c), 0, y + h - u(4), z, turn);
      K.put(rbox(w + 0.01, u(1.2), d + 0.01, 0.004), K.plain(L.tone(card, 0.88)), 0, y + h - u(0.6), z, turn);
      const fx = Math.sin(turn) * (d / 2 + 0.003), fz = z + Math.cos(turn) * (d / 2 + 0.003);
      K.put(rbox(u(12) * w / u(28), u(5), 0.004, 0.002), K.plain('#ffffff'), fx, y + h * 0.4, fz, turn);
      K.put(rbox(u(5), u(1.8), 0.004, 0.002), K.plain('#5a4630'), fx, y + h - u(7.5), fz, turn);
    };
    box(u(28), u(16), 0.6, 0, 0, 0);
    box(u(22), u(14), 0.48, u(16), 0.18, -0.02);
    K.put(rbox(u(16), u(3), 0.3, 0.006), K.plain('#ffffff'), 0, u(31.5), -0.02, -0.12);
  },

  printer(K, s, W, D, L) {
    const { rbox, cyl } = L, metal = K.metal(), d = 0.6, body = K.gloss(K.pal.p);
    // a stand: legs, a shelf with a ream on it, a wooden top; on it the printer, its tray up behind, paper coming out the front
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.put(rbox(u(2), u(20), u(2), 0.006), metal, sx * u(11), u(10), sz * (d / 2 - 0.05));
    K.put(rbox(u(24), u(2), d - 0.06, 0.006), metal, 0, u(7), 0);
    K.put(rbox(u(20), u(5), 0.38, 0.008), K.plain('#f8f8f0'), 0, u(10.5), 0);
    K.put(rbox(u(28), u(3), d, 0.01), K.wood(), 0, u(20.5), 0);
    K.put(rbox(u(24), u(12), 0.46, 0.03), body, 0, u(28), -0.02);
    K.put(rbox(u(24) + 0.005, u(4), 0.3, 0.02), K.gloss(L.tone(K.pal.p, 0.88)), 0, u(32.5), -0.07);
    K.put(rbox(u(16), u(2), 0.02, 0.006), K.plain('#303038'), 0, u(26), 0.21);
    K.put(rbox(u(14), 0.006, 0.16, 0.002), K.plain('#ffffff'), 0, u(25.5), 0.28, 0, 0.12);
    K.put(rbox(u(14), u(7), 0.01, 0.002), K.plain('#ffffff'), 0, u(37), -0.2, 0, -0.35);
    K.put(rbox(u(16), u(5), 0.02, 0.006), K.gloss(L.tone(K.pal.p, 0.75)), 0, u(36), -0.24, 0, -0.35);
    K.put(cyl(u(0.8), 0.01, u(0.8), 10).rotateX(Math.PI / 2), K.glow('#68e868'), X(24), u(31), 0.212);
  },

  briefcase(K, s, W, D, L) {
    const { THREE, rbox, torus } = L, leather = K.gloss(K.pal.w), d = 0.2;
    // a leather case stood on end: its seam, two brass clasps, the handle on top
    K.put(rbox(u(24), u(18), d, 0.04), leather, 0, u(9), 0);
    K.put(rbox(u(24) + 0.006, u(0.8), d + 0.006, 0.004), K.gloss(L.tone(K.pal.w, 0.7)), 0, u(12), 0);
    for (const sg of [-1, 1]) { K.put(rbox(u(3), u(3), 0.016, 0.004), K.metal(K.pal.a), sg * u(6.5), u(13.5), d / 2 + 0.004); for (const sz of [-1, 1]) K.put(rbox(u(2), u(2), u(2), 0.006), K.metal(K.pal.a), sg * u(11), u(1), sz * (d / 2 - 0.01)); }
    K.put(torus(u(4), u(1.1), Math.PI, 20), K.gloss(L.tone(K.pal.w, 0.7)), 0, u(18), 0);
    for (const sg of [-1, 1]) K.put(rbox(u(2.4), u(1.2), u(3), 0.004), K.metal(K.pal.a), sg * u(4), u(18.3), 0);
  },
};
