/* base-models-x.js  -  the backyard's Sports and Buildings shelves (js/base-furniture-yard3.js), modelled from parts like
   the arcade cabinets (the user's ask, 2026-10-16: "3D detailed CLEAN models ... optimise them"): js/base-models-f.js's
   head says how a batch works. Each follows its painting part by part: `u(n)` is n of its 32 pixels a tile, `X(n, W)` a
   pixel across it as x from the middle. Nets are one shared mesh tiled at a fixed cell, so a goal's and a cage's read
   alike; thin trim is a plain box (12 triangles) rather than a rounded one. */

import { tube, rod, ballTop } from './base-models-kit.js';

const u = (n) => n / 32;
const X = (n, W = 1) => n / 32 - W / 2;
const TAU = Math.PI * 2, CELL = u(3);
const INK = '#2c2c34', WHITE = '#f6f6f2', ORANGE = '#e87a30', STRAW = '#d8b868', BAMBOO = '#c8b060', STONE = '#9a9488',
  LOG = '#d8b07a', BARK = '#7a5232', TURF = '#58b848', FRINGE = '#3e8a36', SAND = '#ecd6a2', HANDLE = '#b88a50',
  STEEL = '#a8acb4', LIT = '#ffcc40', HOLE = '#2a2430', BALL = '#d8e858', PIDGEY = '#b8844a', BOWL = '#e06030';
const BOTTLES = ['#5aa848', '#c85a3a', '#e8c040', '#5a8ad8'];

const pics = {};
const once = (key, make) => pics[key] || (pics[key] = make());
const sheet = (w, h, draw) => { const c = new OffscreenCanvas(w, h); draw(c.getContext('2d'), w, h); return c; };

/* one cell of net, tiled: white, so a material's colour tints it */
const netCell = () => once('net', () => sheet(32, 32, (g) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, 32, 7); g.fillRect(0, 0, 7, 32); }));
/** A net's material in `hex`: both faces, cut out, and marked glass so its mesh casts no solid shadow. */
function netMat(L, hex) {
  const c = netCell(), { THREE } = L;
  c.mats = c.mats || {};
  if (c.mats[hex]) return c.mats[hex];
  const m = new THREE.MeshStandardMaterial({ map: L.canvasTex(c), color: hex, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 0.9 });
  m.userData.kind = 'glass';
  return (c.mats[hex] = m);
}
/** A geometry's uvs scaled so its net is CELL across: `w` x `h` its size in tiles (a shape's own uvs are already tiles). */
const netted = (geo, w = 1, h = 1) => { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / CELL, uv.getY(i) * h / CELL); return geo; };

/* the field scoreboard's face: HOME 3, AWAY 2 in lit segments, at 8 canvas pixels a painted one */
const SEGS = { a: [1, 0, 8, 2], b: [8, 1, 2, 8], c: [8, 9, 2, 8], d: [1, 16, 8, 2], e: [0, 9, 2, 8], f: [0, 1, 2, 8], g: [1, 8, 8, 2] };
const DIGITS = ['abcdef', 'bc', 'abged', 'abgcd', 'fgbc', 'afgcd', 'afgedc', 'abc', 'abcdefg', 'abcdfg'];
const scoreFace = () => once('score', () => sheet(432, 264, (g) => {
  g.scale(8, 8);
  g.fillStyle = '#22262c'; g.fillRect(0, 0, 54, 33);
  for (const [x, n] of [[5, 3], [33, 2]]) {
    g.fillStyle = '#101216'; g.fillRect(x, 6, 16, 22);
    g.fillStyle = LIT; for (const sgm of DIGITS[n]) { const [a, b, w, h] = SEGS[sgm]; g.fillRect(x + 3 + a, 8 + b, w, h); }
  }
  for (const y of [13, 21]) { g.beginPath(); g.arc(27, y, 1.2, 0, TAU); g.fill(); }
}));

/** A plane w x h facing +z. */
const plane = (L, w, h) => new L.THREE.PlaneGeometry(w, h);
/** A plain box: trim too slim to want rounding. */
const slat = (L, w, h, d) => L.rbox(w, h, d, 0.001);
/** An outline in x-y ([x, y] points) extruded `d` deep, centred on z: a shed's walls and gable in one. */
const prism = (L, pts, d) => new L.THREE.ExtrudeGeometry(new L.THREE.Shape(pts.map(([x, y]) => new L.THREE.Vector2(x, y))), { depth: d, bevelEnabled: false }).translate(0, 0, -d / 2);
/** The same, soft-edged: a curtain drawn back. */
const drape = (L, pts, d) => new L.THREE.ExtrudeGeometry(new L.THREE.Shape(pts.map(([x, y]) => new L.THREE.Vector2(x, y))), { depth: d, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 1 }).translate(0, 0, -d / 2);
/** An arch: a doorway or a nest hole, w wide, its sides h high under a round top, `d` deep, its foot at y 0. */
function arch(L, w, h, d) {
  const { THREE } = L, s = new THREE.Shape(), r = w / 2;
  s.moveTo(-r, 0); s.lineTo(r, 0); s.lineTo(r, h); s.absarc(0, h, r, 0, Math.PI, false); s.lineTo(-r, 0);
  return new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false, curveSegments: 6 }).translate(0, 0, -d / 2);
}
/** A half disc hanging down from its straight edge at y 0, `t` thick: a valance's scallop. */
const scallop = (L, r, t) => new L.THREE.CylinderGeometry(r, r, t, 8, 1, false, -Math.PI / 2, Math.PI).rotateX(Math.PI / 2);
/** A board from a to b ([x, y, z] each), w wide and t thick. */
function board(K, L, m, a, b, w, t, r = 0.001) {
  const { THREE } = L, va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const g = L.rbox(w, va.distanceTo(vb), t, r);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize()));
  K.put(g, m, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
}
/** A painted rect [a, c, w, h] (x + a, b - c, w x h) as [x, y, w, h] in tiles, its middle. */
const rect = ([a, c, w, h], W = 1) => [X(a + w / 2, W), u(c - h / 2), u(w), u(h)];
/** A baseball bat stood on its knob, `len` long. */
const bat = (L, len) => L.lathe([[0, 0], [0.02, 0], [0.02, 0.015], [0.013, 0.03], [0.015, len * 0.3], [0.035, len * 0.7], [0.04, len * 0.92], [0.032, len], [0, len]], 10);

export const SHAPES = {
  basketballhoop: { make: 'basketballhoop' },
  footballgoal: { make: 'footballgoal' },
  tennisnet: { make: 'tennisnet' },
  battingcage: { make: 'battingcage' },
  croquetset: { make: 'croquetset' },
  badmintonnet: { make: 'badmintonnet' },
  volleyballnet: { make: 'volleyballnet' },
  puttinggreen: { make: 'puttinggreen' },
  bowlingpins: { make: 'bowlingpins' },
  pitchingmachine: { make: 'pitchingmachine', play: { does: 'whirr' } },
  sportsrack: { make: 'sportsrack' },
  fieldscoreboard: { make: 'fieldscoreboard', play: { does: 'light' } },
  sidelinebench: { make: 'sidelinebench', seat: 0.5 },
  agilityladder: { make: 'agilityladder' },
  balltarget: { make: 'balltarget' },
  gazebo: { make: 'gazebo', play: { does: 'light' } },
  pergola: { make: 'pergola' },
  pottingshed: { make: 'pottingshed' },
  kennel: { make: 'kennel' },
  glasshouse: { make: 'glasshouse' },
  arbourbench: { make: 'arbourbench', seat: 0.5 },
  toolshed: { make: 'toolshed' },
  dovecote: { make: 'dovecote' },
  pavilion: { make: 'pavilion' },
  woodshed: { make: 'woodshed' },
  tikibar: { make: 'tikibar', play: { does: 'light' } },
  cabana: { make: 'cabana', seat: 0.5 },
  marketstall: { make: 'marketstall', play: { does: 'give', gives: 'coin', sound: 'fx-ding' } },
  lighthouse: { make: 'lighthouse', play: { does: 'light' } },
  windmill: { make: 'windmill' },
};

export const MAKES = {
  /* ---------- Sports ---------- */

  /** A basketball hoop: a weighted base at the back, its pole, two arms out to the backboard, the rim and its net. */
  basketballhoop(K, s, W, D, L) {
    const { rbox, cyl, torus, ball } = L, steel = K.metal(L.tone(K.pal.m, 0.8)), line = K.gloss(K.pal.c), orange = K.gloss(ORANGE);
    K.put(rbox(u(20), u(10), 0.7, 0.03), K.gloss(K.pal.m), 0, u(5), -0.55);
    K.put(cyl(u(2), u(84), u(2.2), 16), steel, 0, u(52), -0.62);
    for (const y of [u(88), u(100)]) rod(K, L, steel, [0, y, -0.62], [0, y - 0.04, 0.03], 0.022);
    const z = 0.05, f = z + 0.024;
    K.put(rbox(u(28), u(24), 0.04, 0.01), K.gloss(WHITE), 0, u(94), z);
    for (const r of [[2, 106, 28, 2], [2, 84, 28, 2], [2, 106, 2, 24], [28, 106, 2, 24], [11, 96, 10, 1.5], [11, 96, 1.5, 10], [19.5, 96, 1.5, 10]]) {
      const [x, y, w, h] = rect(r);
      K.put(slat(L, w, h, 0.008), line, x, y, f);
    }
    // the rim on its bracket, the net hanging from it
    const rz = f + u(6.5) + 0.02;
    K.put(rbox(0.1, 0.04, 0.05, 0.008), orange, 0, u(85), f + 0.025);
    K.put(torus(u(6.5), 0.012, TAU, 16).rotateX(Math.PI / 2), orange, 0, u(85), rz);
    K.put(netted(cyl(u(6.5), u(11), u(5), 12, true), TAU * u(6), u(11)), netMat(L, '#f0f2f6'), 0, u(78.5), rz);
    K.put(ball(u(5), 16, 12), orange, X(26), u(5) + 0.008, 0.6);
    for (const t of [0, Math.PI / 2]) K.put(torus(u(5) + 0.002, 0.004, TAU, 16), K.plain(INK), X(26), u(5) + 0.008, 0.6, t);
  },

  /** A football goal: white posts banded at the foot, the crossbar, stays and a ground frame back to the net. */
  footballgoal(K, s, W, D, L) {
    const { THREE, cyl, ball } = L, frame = K.gloss(K.pal.p), steel = K.metal('#c8ccd4'), px = 1 - u(3.75), r = u(1.75), top = u(43.25), z0 = 0.3, zb = -0.4;
    for (const x of [-px, px]) {
      K.put(cyl(r, top, r, 12), frame, x, top / 2, z0);
      K.put(cyl(r + 0.004, u(6), r + 0.004, 12), K.gloss(K.pal.c), x, u(3), z0);
      rod(K, L, steel, [x, top, z0], [x, 0.02, zb], 0.012);
      rod(K, L, steel, [x, 0.014, z0], [x, 0.014, zb], 0.012);
    }
    K.put(cyl(r, px * 2 + r * 2, r, 12).rotateZ(Math.PI / 2), frame, 0, top, z0);
    rod(K, L, steel, [-px, 0.014, zb], [px, 0.014, zb], 0.012);
    // the net: down the back from the crossbar to the ground frame, and a triangle either side
    const net = netMat(L, '#e8eaf0'), len = Math.hypot(top, z0 - zb);
    K.put(netted(plane(L, px * 2, len), px * 2, len), net, 0, top / 2, (z0 + zb) / 2, 0, Math.atan2(z0 - zb, top));
    const side = new THREE.Shape([new THREE.Vector2(z0, 0), new THREE.Vector2(z0, top), new THREE.Vector2(zb, 0)]);
    for (const x of [-px, px]) K.put(netted(new THREE.ShapeGeometry(side)).rotateY(-Math.PI / 2), net, x, 0, 0);
    // the ball: a white one, its dark patches
    const bx = X(22, W), by = u(6), bz = 0.3, br = u(6);
    K.put(ball(br, 16, 12), K.gloss(WHITE), bx, by, bz);
    for (const [dx, dy, dz] of [[0, 0, 1], [-0.62, 0.45, 0.64], [0.62, 0.45, 0.64], [-0.4, -0.6, 0.69], [0.4, -0.6, 0.69], [0, 0.9, -0.43]]) K.put(ball(u(1.4), 8, 6), K.gloss(INK), bx + dx * br * 0.88, by + dy * br * 0.88, bz + dz * br * 0.88);
  },

  /** A tennis net between two posts, its winder, the white tape and centre strap; a ball and a racket on the court. */
  tennisnet(K, s, W, D, L) {
    const { cyl, ball, rbox, torus, THREE } = L, post = K.gloss(K.pal.c), white = K.gloss(WHITE), metal = K.metal(K.pal.m), px = 1 - u(4);
    for (const x of [-px, px]) {
      K.put(cyl(u(2), u(35), u(2), 12), post, x, u(17.5), 0);
      K.put(ball(u(2), 12, 8), K.gloss(L.tone(K.pal.c, 1.2)), x, u(35), 0);
      K.put(rbox(u(6), u(2), u(6), 0.01), K.gloss(L.tone(K.pal.c, 0.75)), x, u(1), 0);
    }
    K.put(cyl(0.012, 0.05, 0.012, 8).rotateZ(Math.PI / 2), metal, -px - u(2) - 0.02, u(24), 0);
    K.put(rbox(0.02, u(4), 0.02, 0.005), metal, -px - u(2) - 0.045, u(25), 0);
    K.put(netted(plane(L, u(52), u(27)), u(52), u(27)), netMat(L, INK), 0, u(16.5), 0);
    K.put(rbox(u(52), u(3), 0.03, 0.008), white, 0, u(30.5), 0);
    K.put(slat(L, u(2), u(27), 0.026), white, 0, u(16.5), 0);
    rod(K, L, K.plain(INK), [-px, u(3), 0], [px, u(3), 0], 0.005);
    K.put(ball(u(3), 12, 8), K.plain(BALL), X(46, W), u(3), 0.25);
    // the racket lying on the court: its frame, strings and grip
    const rx = X(20, W), rz = 0.3;
    K.put(torus(u(5), 0.012, TAU, 16).rotateX(Math.PI / 2).scale(1, 1, 0.7), K.gloss(K.pal.a), rx, 0.012, rz);
    K.put(netted(new THREE.CircleGeometry(u(5), 16), u(10), u(10)).rotateX(-Math.PI / 2).scale(1, 1, 0.7), netMat(L, '#e8e8ec'), rx, 0.012, rz);
    K.put(cyl(0.014, u(7), 0.014, 8).rotateZ(Math.PI / 2), K.gloss(INK), X(29.5, W), 0.014, rz);
  },

  /** A batting cage: four posts, a frame over them, netted at the back, sides and roof, open at the front to bat from;
      a turf mat, the plate and a tee, a bat leaning on the side and a bucket of balls. */
  battingcage(K, s, W, D, L) {
    const { cyl, rbox, lathe, ball } = L, steel = K.metal(K.pal.m), px = 1 - u(3.5), pz = 0.85, H = u(78.5), net = netMat(L, INK), white = K.gloss(WHITE);
    for (const x of [-px, px]) for (const z of [-pz, pz]) K.put(cyl(u(1.5), H, u(1.5), 12), steel, x, H / 2, z);
    for (const z of [-pz, pz]) K.put(cyl(u(1.5), px * 2, u(1.5), 12).rotateZ(Math.PI / 2), steel, 0, H, z);
    for (const x of [-px, px]) K.put(cyl(u(1.2), pz * 2, u(1.2), 12).rotateX(Math.PI / 2), steel, x, H, 0);
    K.put(netted(plane(L, px * 2, H), px * 2, H), net, 0, H / 2, -pz);
    for (const x of [-px, px]) K.put(netted(plane(L, pz * 2, H), pz * 2, H), net, x, H / 2, 0, Math.PI / 2);
    K.put(netted(plane(L, px * 2, pz * 2), px * 2, pz * 2), net, 0, H, 0, 0, -Math.PI / 2);
    K.put(rbox(u(56), 0.04, pz * 2 - 0.06, 0.01), K.plain('#4a8a4a'), 0, 0.02, 0);
    K.put(prism(L, [[-0.12, 0], [0.12, 0], [0.12, 0.12], [0, 0.24], [-0.12, 0.12]], 0.012).rotateX(-Math.PI / 2), white, 0, 0.046, 0.5);
    // the tee and its ball
    K.put(lathe([[u(6), 0], [u(6), 0.02], [u(1.5), 0.06], [0, 0.06]], 16), K.gloss(INK), 0, 0.04, 0.35);
    K.put(cyl(u(1), u(24), u(1), 8), K.gloss(INK), 0, 0.1 + u(12), 0.35);
    K.put(ball(u(3), 12, 8), white, 0, u(28.5), 0.35);
    const len = Math.hypot(6, 35) / 32;
    K.put(bat(L, len), K.wood(), X(52, W), 0.04, 0.2, 0, 0, -Math.atan2(6, 35));
    K.put(lathe([[0, 0], [u(5), 0], [u(6), u(14)], [u(5.5), u(14)], [u(4.6), u(1)], [0, u(1)]], 16), K.gloss(K.pal.c), X(16, W), 0.04, 0.3);
    for (let i = 0; i < 4; i++) K.put(ball(u(2), 8, 6), white, X(16, W) + Math.cos(i * 1.7) * u(2.8), u(14.5), 0.3 + Math.sin(i * 1.7) * u(2.8));
  },

  /** A croquet stand: a base and two ends under a rail, four mallets stood heads down, two balls and a hoop. */
  croquetset(K, s, W, D, L) {
    const { rbox, cyl, ball, torus } = L, wood = K.wood(), lite = K.wood(L.tone(K.pal.w, 1.2)), z0 = -0.04;
    K.put(rbox(u(26), u(6), 0.34, 0.015), wood, X(16), u(3), z0);
    for (const a of [4.5, 27.5]) K.put(rbox(u(3), u(30), 0.3, 0.012), wood, X(a), u(15), z0);
    K.put(rbox(u(26), u(3), 0.14, 0.01), lite, X(16), u(29.5), z0);
    [K.pal.c, K.pal.a, '#3a6ac8', INK].forEach((c, i) => {
      const x = X(8.8 + i * 5.3), z = z0 + (i % 2 ? -0.07 : 0.07);
      K.put(cyl(u(0.8), u(29), u(0.8), 8), lite, x, u(25.5), z);
      K.put(ball(u(1), 8, 6), lite, x, u(40), z);
      K.put(cyl(u(2.5), u(7), u(2.5), 12).rotateZ(Math.PI / 2), K.gloss(c), x, u(8.5), z);
    });
    K.put(ball(u(3), 12, 8), K.gloss(K.pal.c), X(6), u(3), 0.3);
    K.put(ball(u(3), 12, 8), K.gloss('#3a6ac8'), X(13), u(3), 0.3);
    K.put(torus(u(4), 0.007, Math.PI, 12), K.gloss(WHITE), X(26), 0, 0.3);
  },

  /** A badminton net high on two thin posts with T feet; a racket leaning on a post, a shuttlecock on the grass. */
  badmintonnet(K, s, W, D, L) {
    const { cyl, ball, rbox, torus, lathe, THREE } = L, post = K.metal(K.pal.m), foot = K.metal(L.tone(K.pal.m, 0.75)), px = 1 - u(4);
    for (const x of [-px, px]) {
      K.put(cyl(u(1.5), u(62), u(1.5), 12), post, x, u(31), 0);
      K.put(ball(u(1.8), 12, 8), K.gloss(K.pal.c), x, u(62), 0);
      K.put(rbox(u(8), u(2.5), 0.32, 0.008), foot, x, u(1.25), 0);
    }
    K.put(netted(plane(L, u(54), u(16)), u(54), u(16)), netMat(L, INK), 0, u(50), 0);
    K.put(rbox(u(54), u(2.5), 0.025, 0.008), K.gloss(WHITE), 0, u(58.75), 0);
    rod(K, L, K.plain(INK), [-px, u(42), 0], [px, u(42), 0], 0.004);
    // the racket, built from its butt and leant over onto the post
    const tilt = -Math.atan2(5, 19), at = [X(48.5, W), 0, 0.1], head = u(19.6);
    K.put(cyl(0.016, u(5.5), 0.016, 8).translate(0, u(2.75), 0), K.gloss(K.pal.a), ...at, 0, 0, tilt);
    K.put(cyl(0.008, u(8.5), 0.008, 6).translate(0, u(9.75), 0), K.gloss(K.pal.c), ...at, 0, 0, tilt);
    K.put(new THREE.TorusGeometry(1, 0.1, 6, 20).scale(u(4), u(6), 0.12).translate(0, head, 0), K.gloss(K.pal.c), ...at, 0, 0, tilt);
    K.put(netted(new THREE.CircleGeometry(1, 16), u(8), u(12)).scale(u(4), u(6), 1).translate(0, head, 0), netMat(L, '#e8e8ec'), ...at, 0, 0, tilt);
    K.put(ball(u(2), 8, 6), K.gloss(K.pal.a), X(21, W), u(2), 0.3);
    K.put(lathe([[u(1.5), u(3)], [u(3.5), u(10)], [u(3.2), u(10)], [u(1.2), u(3.2)]], 10), K.plain(WHITE), X(21, W), 0, 0.3);
  },

  /** A volleyball net: tall posts padded at the foot, a net taped top and bottom, striped antennae; a ball by it. */
  volleyballnet(K, s, W, D, L) {
    const { cyl, ball, rbox, torus } = L, post = K.gloss(K.pal.c), white = K.gloss(WHITE), px = 1 - u(3.5);
    for (const x of [-px, px]) {
      K.put(cyl(u(1.5), u(82), u(1.5), 12), post, x, u(41), 0);
      K.put(cyl(u(3), u(26), u(3), 12), K.cloth(K.pal.a), x, u(16), 0);
      for (const y of [u(3), u(29)]) K.put(torus(u(2.6), u(0.5), TAU, 12).rotateX(Math.PI / 2), K.cloth(K.pal.a), x, y, 0);
      K.put(rbox(u(7), u(2), u(7), 0.008), K.metal(L.tone(K.pal.m, 0.75)), x, u(1), 0);
    }
    K.put(netted(plane(L, u(54), u(20)), u(54), u(20)), netMat(L, INK), 0, u(68), 0);
    K.put(rbox(u(54), u(2.5), 0.025, 0.008), white, 0, u(78.75), 0);
    K.put(rbox(u(54), u(1.5), 0.02, 0.006), white, 0, u(58.25), 0);
    for (const a of [7.6, 56.6]) for (let i = 0; i < 5; i++) K.put(cyl(0.008, u(2.4), 0.008, 6), K.gloss(i % 2 ? WHITE : '#e04040'), X(a, W), u(90.8 - i * 2.4), 0.014);
    const bx = X(42, W), by = u(6), bz = 0.25;
    K.put(ball(u(6), 16, 12), white, bx, by, bz);
    K.put(torus(u(6) + 0.002, 0.009, TAU, 16), K.gloss(K.pal.c), bx, by, bz, 0.6, 1.2);
    K.put(torus(u(6) + 0.002, 0.009, TAU, 16), K.gloss(K.pal.a), bx, by, bz, -0.6, 1.9);
  },

  /** A putting green: a rolled lawn on its fringe, a bunker, the cup and its flag, a ball and a putter lying by it. */
  puttinggreen(K, s, W, D, L) {
    const { THREE, cyl, ball, rbox } = L, top = 0.045;
    const ring = (f) => new THREE.Shape(Array.from({ length: 20 }, (_, i) => {
      const a = i / 20 * TAU, r = (0.86 + Math.sin(a * 2 + 0.6) * 0.07 + Math.cos(a * 3) * 0.04) * f;
      return new THREE.Vector2(Math.cos(a) * r * W / 2, Math.sin(a) * r * D / 2);
    }));
    const slab = (f, h) => new THREE.ExtrudeGeometry(ring(f), { depth: h, bevelEnabled: false }).rotateX(Math.PI / 2).translate(0, h, 0);
    K.put(slab(1, 0.03), K.plain(FRINGE), 0, 0, 0);
    K.put(slab(0.9, top), K.plain(TURF), 0, 0, 0);
    const at = (px, py) => [X(px, W), u(py) - D / 2];
    K.put(cyl(1, 0.01, 1, 16).scale(u(8), 1, u(5)), K.plain(SAND), at(17, 20)[0], top + 0.004, at(17, 20)[1]);
    const [cx, cz] = at(44, 22);
    K.put(cyl(u(3), 0.006, u(3), 12), K.plain('#1e2a1e'), cx, top + 0.002, cz);
    K.put(cyl(0.008, 1, 0.008, 6), K.gloss(WHITE), cx, top + 0.5, cz);
    K.put(prism(L, [[0, 0], [u(8.5), -u(2.5)], [0, -u(5)]], 0.008), K.gloss(K.pal.c), cx + 0.008, top + 1, cz);
    const [ox, oz] = at(22, 46), [ax, az] = at(31, 49), [bx, bz] = at(45, 40), [gx, gz] = at(41, 42.5), [hx, hz] = at(30, 49.5);
    K.put(ball(u(2.2), 12, 8), K.gloss('#ffffff'), ox, top + u(2.2), oz);
    rod(K, L, K.metal(K.pal.m), [ax, top + 0.012, az], [bx, top + 0.012, bz], 0.008);
    rod(K, L, K.gloss(K.pal.a), [gx, top + 0.014, gz], [bx, top + 0.014, bz], 0.014);
    K.put(rbox(u(6), 0.03, u(3), 0.008), K.metal(K.pal.m), hx, top + 0.015, hz);
  },

  /** Ten garden bowling pins set up in a triangle, striped at the neck, and a ball. */
  bowlingpins(K, s, W, D, L) {
    const { lathe, cyl, ball } = L, white = K.gloss(WHITE), red = K.gloss(K.pal.c);
    const PIN = [[0, 0], [1.6, 0], [2.7, 1.5], [3, 5], [2.6, 8], [1.4, 9.5], [1.2, 11], [1.2, 12], [1.85, 13.3], [1.8, 14.6], [1.1, 15.6], [0, 15.9]].map(([r, y]) => [u(r), u(y)]);
    for (let row = 0; row < 4; row++) for (let i = 0; i <= row; i++) {
      const x = X(17) + (i - row / 2) * u(6.5), z = 0.28 - row * 0.17;
      K.put(lathe(PIN, 10), white, x, 0, z);
      K.put(cyl(u(1.32), u(0.8), u(1.32), 10, true), red, x, u(10.8), z);
      K.put(cyl(u(1.5), u(0.8), u(1.5), 10, true), red, x, u(9.4), z);
    }
    K.put(ball(u(4), 12, 8), K.gloss(K.pal.c), X(5), u(4), 0.3);
    for (const [px, py] of [[4, 6], [6.2, 6], [5, 4.2]]) K.put(cyl(u(0.7), 0.02, u(0.7), 8).rotateX(Math.PI / 2), K.plain(INK), X(px), u(py), 0.3 + Math.sqrt(Math.max(0, u(4) ** 2 - (X(px) - X(5)) ** 2 - (u(py) - u(4)) ** 2)));
  },

  /** A pitching machine: a tripod, the motor's housing with its throwing wheel out front, a hopper of balls on top. */
  pitchingmachine(K, s, W, D, L) {
    const { rbox, cyl, lathe, ball } = L, leg = K.metal(K.pal.m), dark = K.gloss(INK), white = K.gloss(WHITE);
    for (const [x, z, tx] of [[X(5), 0.14, -0.0625], [X(27), 0.14, 0.0625], [0, -0.34, 0]]) {
      rod(K, L, leg, [tx, u(31), 0], [x, 0.02, z], u(1.2));
      K.put(rbox(u(5), u(2), 0.08, 0.008), dark, x, u(1), z);
    }
    K.put(rbox(u(18), u(16), 0.34, 0.03), K.gloss(K.pal.c), 0, u(38), 0);
    K.put(cyl(u(7), 0.05, u(7), 20).rotateX(Math.PI / 2), dark, 0, u(38), 0.195);
    K.put(cyl(u(4.5), 0.012, u(4.5), 16).rotateX(Math.PI / 2), K.gloss('#5a5a62'), 0, u(38), 0.226);
    K.put(cyl(u(1.6), 0.02, u(1.6), 12).rotateX(Math.PI / 2), K.metal('#c8ccd4'), 0, u(38), 0.232);
    K.put(rbox(u(6), u(2.5), 0.12, 0.008), K.gloss(K.pal.a), 0, u(29.75), 0.18);
    K.put(lathe([[u(4), 0], [u(7), u(12)], [u(6.4), u(12)], [u(3.6), u(0.8)], [0, u(0.8)]], 16), white, 0, u(46), 0);
    for (let i = 0; i < 4; i++) K.put(ball(u(1.8), 8, 6), white, X(11 + i * 3.3), u(59.5), i % 2 ? -0.05 : 0.05);
  },

  /** A sports rack: four posts, two shelves of balls, a sign along the top and a bat leant on its end. */
  sportsrack(K, s, W, D, L) {
    const { rbox, cyl, ball, torus } = L, post = K.metal(K.pal.m), shelf = K.wood(), dark = K.plain(INK);
    for (const a of [3.5, 28.5]) for (const z of [-0.18, 0.18]) K.put(cyl(u(1.5), u(52), u(1.5), 12), post, X(a), u(26), z);
    K.put(rbox(u(22), u(6), 0.04, 0.012), K.gloss(K.pal.c), 0, u(53), 0.18);
    for (const y of [u(29.5), u(5.5)]) { K.put(rbox(u(28), u(3), 0.44, 0.01), shelf, 0, y, 0); K.put(slat(L, u(28), 0.03, 0.02), shelf, 0, y + u(1.5) + 0.03, 0.2); }
    // a basketball and a football on top
    K.put(ball(u(5.5), 16, 12), K.gloss(ORANGE), X(11), u(36.5), 0);
    for (const t of [0, Math.PI / 2]) K.put(torus(u(5.5) + 0.002, 0.004, TAU, 16), dark, X(11), u(36.5), 0, t);
    K.put(ball(u(5), 16, 12), K.gloss(WHITE), X(22), u(36), 0);
    for (const [dx, dy, dz] of [[0, 0, 1], [-0.62, 0.45, 0.64], [0.62, 0.45, 0.64], [-0.4, -0.6, 0.69], [0.4, -0.6, 0.69]]) K.put(ball(u(1.2), 8, 6), K.gloss(INK), X(22) + dx * u(4.4), u(36) + dy * u(4.4), dz * u(4.4));
    // a volleyball and three tennis balls below
    K.put(ball(u(5), 16, 12), K.gloss(WHITE), X(11), u(12), 0);
    K.put(torus(u(5) + 0.002, 0.008, TAU, 16), K.gloss(K.pal.c), X(11), u(12), 0, 0.6, 1.2);
    K.put(torus(u(5) + 0.002, 0.008, TAU, 16), K.gloss(K.pal.a), X(11), u(12), 0, -0.6, 1.9);
    for (let i = 0; i < 3; i++) K.put(ball(u(2.5), 12, 8), K.plain(BALL), X(19 + i * 3.5), u(9.5), 0.06 - i * 0.04);
    K.put(bat(L, Math.hypot(2.5, 34) / 32), K.wood(HANDLE), X(2), 0, 0.26, 0, 0, -Math.atan2(2.5, 34));
  },

  /** A scoreboard on two legs: the frame in the theme's colour, the score lit on its face, a pennant on top. */
  fieldscoreboard(K, s, W, D, L) {
    const { rbox, cyl } = L, leg = K.metal(K.pal.m);
    for (const a of [11, 53]) {
      K.put(cyl(u(2), u(42), u(2), 12), leg, X(a, W), u(21), -0.02);
      K.put(rbox(u(8), u(2), 0.24, 0.008), K.metal(L.tone(K.pal.m, 0.75)), X(a, W), u(1), -0.02);
    }
    K.put(rbox(u(60), u(42), 0.16, 0.025), K.gloss(K.pal.c), 0, u(61), 0);
    K.put(plane(L, u(54), u(33)), L.litPic(scoreFace(), 0.6), 0, u(59.5), 0.082);
    for (const a of [17, 47]) K.put(slat(L, u(14), u(1.6), 0.01), K.gloss(K.pal.p), X(a, W), u(78.7), 0.082);
    rod(K, L, leg, [0, u(82), 0], [0, u(92), 0], 0.008);
    K.put(prism(L, [[0, 0], [u(7.5), -u(2.5)], [0, -u(5)]], 0.008), K.gloss(K.pal.a), 0.008, u(92), 0);
  },

  /** A sideline bench: slats on metal legs, a towel over it, a water bottle on it and a kit bag under it. */
  sidelinebench(K, s, W, D, L) {
    const { rbox, cyl, lathe, blob } = L, leg = K.metal(K.pal.m), towel = K.cloth(K.pal.p);
    for (const a of [8, 56]) {
      for (const z of [-0.16, 0.16]) K.put(rbox(u(4), u(13), u(4), 0.008), leg, X(a, W), u(6.5), z);
      K.put(rbox(u(4), u(2), 0.44, 0.008), leg, X(a, W), u(11), 0);
      K.put(rbox(u(8), u(2), 0.44, 0.008), K.metal(L.tone(K.pal.m, 0.75)), X(a, W), u(1), 0);
    }
    for (let i = 0; i < 3; i++) K.put(rbox(u(60), u(4), 0.13, 0.012), K.wood(), 0, u(14), -0.14 + i * 0.14);
    K.put(blob(u(18), u(10), 0.3, 0.6, 0.6), K.cloth(K.pal.c), X(39, W), u(5), -0.02);
    K.put(slat(L, u(12), 0.02, 0.05), K.cloth(L.tone(K.pal.c, 0.74)), X(39, W), u(10.2), -0.02);
    // the towel: laid on the seat, rolled over its front edge, hanging down, two stripes across its end
    const tx = X(18.5, W);
    K.put(rbox(u(13), 0.02, 0.3, 0.008), towel, tx, u(16) + 0.01, 0.05);
    K.put(cyl(0.02, u(13), 0.02, 8).rotateZ(Math.PI / 2), towel, tx, u(16) - 0.005, 0.212);
    K.put(rbox(u(13), u(10), 0.022, 0.008), towel, tx, u(11), 0.222);
    for (const [y, h] of [[u(9.25), u(1.5)], [u(7.5), u(1)]]) K.put(slat(L, u(13), h, 0.004), K.cloth(K.pal.c), tx, y, 0.234);
    const bx = X(42.5, W), y0 = u(16);
    K.put(lathe([[0, 0], [u(2.5), 0], [u(2.5), u(10)], [u(1.8), u(12)], [u(1.5), u(13)], [0, u(13)]], 16), K.gloss(K.pal.a), bx, y0, 0);
    K.put(cyl(u(2.55), u(2), u(2.55), 16, true), K.gloss(L.tone(K.pal.a, 1.25)), bx, u(23), 0);
    K.put(cyl(u(1.5), u(3), u(1.5), 12), K.gloss(WHITE), bx, u(30.5), 0);
  },

  /** An agility ladder laid on the lawn: two straps, seven flat rungs, a cone at either end. */
  agilityladder(K, s, W, D, L) {
    const { lathe, cyl, rbox } = L, cone = K.gloss(ORANGE);
    for (const z of [u(9) - D / 2, u(23) - D / 2]) K.put(slat(L, u(47), 0.01, u(2)), K.gloss(K.pal.c), X(32.5, W), 0.005, z);
    for (let i = 0; i < 7; i++) K.put(slat(L, u(2), 0.016, u(16)), K.gloss(K.pal.a), X(10 + i * 7.5, W), 0.008, 0);
    for (const a of [4, 60]) {
      K.put(rbox(u(6.6), 0.016, u(6.6), 0.006), cone, X(a, W), 0.008, 0);
      K.put(lathe([[u(2.4), 0], [u(0.5), 0.24], [0, 0.24]], 12), cone, X(a, W), 0.016, 0);
      K.put(cyl(u(1.55), 0.035, u(1.85), 12, true), K.gloss(WHITE), X(a, W), 0.016 + 0.13, 0);
    }
  },

  /** An archery butt on an easel, its face a Poké Ball, two arrows in it. */
  balltarget(K, s, W, D, L) {
    const { THREE, cyl, rbox, torus } = L, leg = K.wood(), straw = K.plain(STRAW), white = K.gloss(WHITE), ink = K.gloss(INK);
    rod(K, L, leg, [X(13), u(50), 0.0], [X(8), 0.01, 0.12], u(1.3));
    rod(K, L, leg, [X(19), u(50), 0.0], [X(24), 0.01, 0.12], u(1.3));
    rod(K, L, K.wood(L.tone(K.pal.w, 0.8)), [0, u(40), -0.03], [0, 0.01, -0.32], u(1.1));
    K.put(rbox(u(18), u(2.5), 0.1, 0.008), K.wood(L.tone(K.pal.w, 0.8)), 0, u(24.75), 0.1);
    const y = u(40), f = 0.152;
    K.put(cyl(u(14), 0.12, u(14), 24).rotateX(Math.PI / 2), straw, 0, y, 0.09);
    K.put(torus(u(14) - 0.012, 0.016, TAU, 24), K.plain(L.tone(STRAW, 0.82)), 0, y, f - 0.01);
    // the face: a Poké Ball, top and bottom halves, the band and the button for a bullseye
    K.put(new THREE.CircleGeometry(u(11.5), 24, 0, Math.PI), K.gloss(ballTop(K)), 0, y, f);
    K.put(new THREE.CircleGeometry(u(11.5), 24, Math.PI, Math.PI), white, 0, y, f);
    K.put(slat(L, u(23), u(3), 0.006), ink, 0, y, f + 0.003);
    K.put(cyl(u(4), 0.012, u(4), 16).rotateX(Math.PI / 2), ink, 0, y, f + 0.006);
    K.put(cyl(u(2.6), 0.012, u(2.6), 16).rotateX(Math.PI / 2), white, 0, y, f + 0.012);
    K.put(cyl(u(1.1), 0.012, u(1.1), 12).rotateX(Math.PI / 2), K.gloss(K.pal.a), 0, y, f + 0.018);
    for (const [px, py] of [[12, 45], [20.5, 36]]) {
      const a = [X(px), u(py), f], b = [X(px) + 0.06, u(py) - 0.04, f + 0.3];
      rod(K, L, K.wood(HANDLE), a, b, 0.006);
      for (const [w, h] of [[0.05, 0.004], [0.004, 0.05]]) K.put(slat(L, w, h, 0.07), K.gloss(K.pal.a), b[0] - 0.008, b[1] + 0.005, b[2] - 0.05);
    }
  },

  /* ---------- Buildings ---------- */

  /** A gazebo: a six-sided deck and its step, six white posts railed round but at the front, a six-sided roof with a
      scalloped fascia and a finial, a lantern hanging inside. */
  gazebo(K, s, W, D, L) {
    const { cyl, rbox, ball } = L, post = K.gloss(K.pal.p), rail = K.gloss(L.tone(K.pal.p, 0.92)), Rp = 0.85, eave = u(66), apex = u(100), deg = Math.PI / 180;
    K.put(cyl(0.94, u(7), 0.94, 6).rotateY(Math.PI / 6), K.wood(), 0, u(3.5), 0);
    K.put(rbox(u(16), u(4), 0.16, 0.01), K.wood(L.tone(K.pal.w, 1.15)), 0, u(2), 0.894);
    for (let i = 0; i < 6; i++) K.put(cyl(u(2), u(61), u(2), 12), post, Math.cos(i * 60 * deg) * Rp, u(37.5), Math.sin(i * 60 * deg) * Rp);
    for (let i = 0; i < 6; i++) {
      const m = (30 + i * 60) * deg, ax = Math.cos(m), az = Math.sin(m), tx = -az, tz = ax, a = Rp * Math.cos(30 * deg);
      K.put(slat(L, Rp, u(3), u(2.5)), post, ax * a, eave - u(1.5), az * a, -(m + Math.PI / 2));
      if (i === 1) continue;
      for (const y of [u(24.75), u(9)]) K.put(slat(L, Rp - u(4), u(2.5), u(2)), rail, ax * a, y, az * a, -(m + Math.PI / 2));
      for (const t of [-0.25, 0, 0.25]) K.put(slat(L, u(1.2), u(15), u(1.2)), rail, ax * a + tx * t * Rp, u(17), az * a + tz * t * Rp);
    }
    // the roof, its fascia and scallops all round, the finial
    K.put(cyl(0.02, apex - eave, 1, 6).rotateY(Math.PI / 6), K.gloss(K.pal.c), 0, (eave + apex) / 2, 0);
    K.put(cyl(1, u(3), 1, 6, true).rotateY(Math.PI / 6), K.gloss(L.tone(K.pal.c, 0.78)), 0, u(66.5), 0);
    for (let i = 0; i < 6; i++) {
      const m = (30 + i * 60) * deg, a = 0.86, tx = -Math.sin(m), tz = Math.cos(m);
      for (const t of [-0.375, -0.125, 0.125, 0.375]) K.put(scallop(L, u(3.4), 0.012), post, Math.cos(m) * a + tx * t, u(65), Math.sin(m) * a + tz * t, Math.PI / 2 - m);
    }
    K.put(cyl(u(1), u(3), u(1.5), 12), K.gloss(K.pal.a), 0, apex + u(0.5), 0);
    K.put(ball(u(2.5), 12, 8), K.gloss(K.pal.a), 0, apex + u(2.5), 0);
    // the lantern on its chain
    K.put(cyl(0.006, apex - u(4) - u(58), 0.006, 6), K.plain(INK), 0, (apex - u(4) + u(58)) / 2, 0);
    K.put(rbox(u(7), u(1.5), u(7), 0.004), K.gloss(INK), 0, u(58.25), 0);
    K.put(rbox(u(6), u(7), u(6), 0.008), K.glow(), 0, u(54), 0);
    K.put(rbox(u(7), u(1.2), u(7), 0.004), K.gloss(INK), 0, u(49.9), 0);
  },

  /** A pergola: four posts, a beam along the front and back, rafters across them, a vine over the top hanging with
      wisteria and climbing the front posts. */
  pergola(K, s, W, D, L) {
    const { rbox, ball, lathe } = L, wood = K.wood(), px = X(57.5, W), pz = 0.75, leaf = (f = 1) => K.plain(L.tone(K.pal.leaf, f));
    for (const x of [-px, px]) for (const z of [-pz, pz]) {
      K.put(rbox(u(5), u(72), u(5), 0.012), wood, x, u(36), z);
      K.put(slat(L, u(7), u(3), u(7)), K.wood(L.tone(K.pal.w, 0.8)), x, u(1.5), z);
    }
    for (const z of [-pz, pz]) K.put(rbox(W, u(6), 0.09, 0.012), wood, 0, u(73), z);
    for (let i = 0; i < 8; i++) K.put(slat(L, u(4), u(5), D - 0.04), K.wood(L.tone(K.pal.w, 1.12)), X(4 + i * 8.2, W), u(78.5), 0);
    for (const z of [-pz, pz]) for (let i = 0; i < 9; i++) K.put(ball(u(4.4), 8, 6).scale(1, 0.8, 1.2), leaf(i % 2 ? 1 : 0.85), X(5 + i * 6.75, W), u(78 - (i % 2) * 3), z + (i % 3 - 1) * 0.05);
    for (const x of [-px, px]) for (let i = 0; i < 6; i++) K.put(ball(u(2.5), 8, 6).scale(1, 1.3, 0.6), leaf(1.1), x + (i % 2 ? u(2.5) : -u(2.5)), u(12 + i * 10), pz + u(2.5), 0, 0, i % 2 ? -0.5 : 0.5);
    const bunch = lathe([[0.001, -u(9)], [u(1.4), -u(6)], [u(2.3), -u(2)], [u(1.8), 0], [0, 0]], 8);
    for (const z of [-pz, pz]) for (let i = 0; i < 7; i++) {
      K.put(bunch.clone(), K.gloss(K.pal.c), X(8 + i * 8, W), u(70), z + 0.06);
      K.put(ball(u(1.2), 8, 6), K.gloss(K.pal.p), X(8 + i * 8, W), u(61.5), z + 0.06);
    }
  },

  /** A potting shed: plank walls under a gabled roof, battens down the front, a door, a window with a flower box, and
      two pots by the wall. */
  pottingshed(K, s, W, D, L) {
    const { rbox, lathe, ball } = L, wood = K.wood(), dark = K.wood(L.tone(K.pal.w, 0.74)), hw = u(28), d = 1.5, z0 = -0.1, front = z0 + d / 2;
    K.put(prism(L, [[-hw, 0], [hw, 0], [hw, u(54)], [0, u(82) - 0.005], [-hw, u(54)]], d), wood, 0, 0, z0);
    K.put(rbox(u(57), u(3), d + 0.02, 0.008), K.wood(L.tone(K.pal.w, 0.52)), 0, u(1.5), z0);
    for (let i = 1; i < 7; i++) { const x = X(4 + i * 8, W), h = u(82) - Math.abs(x) - u(3); K.put(slat(L, u(0.8), h, 0.012), dark, x, u(3) + h / 2, front + 0.006); }
    // the roof: two slopes meeting at the ridge, a cap along it
    const t = 0.088, len = 1.34, mid = u(84) - 0.49;
    for (const sg of [-1, 1]) K.put(rbox(len, t, d + 0.2, 0.012), K.gloss(K.pal.c), sg * 0.49, mid, z0, 0, 0, -sg * Math.PI / 4);
    K.put(L.cyl(0.035, d + 0.2, 0.035, 8).rotateX(Math.PI / 2), K.gloss(L.tone(K.pal.c, 0.8)), 0, u(86) - 0.01, z0);
    // the door and its knob, the window, its flower box and flowers
    K.put(rbox(u(18), u(46), 0.04, 0.01), dark, X(18, W), u(23), front + 0.02);
    K.put(slat(L, u(14), u(1.5), 0.01), K.wood(L.tone(K.pal.w, 0.55)), X(18, W), u(24.25), front + 0.044);
    K.put(ball(u(1.4), 8, 6), K.metal(K.pal.a), X(24, W), u(23), front + 0.05);
    K.put(rbox(u(20), u(18), 0.04, 0.008), K.wood(L.tone(K.pal.w, 1.2)), X(45, W), u(37), front + 0.02);
    K.put(plane(L, u(16), u(14)), K.glass(), X(45, W), u(37), front + 0.042);
    K.put(slat(L, u(1.2), u(14), 0.012), K.wood(L.tone(K.pal.w, 1.2)), X(45, W), u(37), front + 0.044);
    K.put(slat(L, u(16), u(1.2), 0.012), K.wood(L.tone(K.pal.w, 1.2)), X(45, W), u(37), front + 0.044);
    K.put(rbox(u(24), u(6), 0.16, 0.01), K.gloss(K.pal.c), X(45, W), u(25), front + 0.08);
    for (let i = 0; i < 5; i++) {
      const x = X(36 + i * 4.5, W);
      K.put(ball(u(1.8), 8, 6).scale(1, 0.8, 1), K.plain(K.pal.leaf), x, u(28.5), front + 0.08);
      K.put(ball(u(1.8), 8, 6), K.gloss([K.pal.c, K.pal.a, K.pal.p][i % 3]), x, u(31), front + 0.09);
    }
    for (const a of [50, 57]) {
      K.put(lathe([[0, 0], [u(2), 0], [u(3), u(8)], [u(2.6), u(8)], [u(2.2), u(7)], [0, u(7)]], 12), K.gloss(K.pal.pot), X(a, W), 0, front + 0.14);
      K.put(ball(u(3.4), 8, 6), K.plain(K.pal.leaf), X(a, W), u(10), front + 0.14);
    }
  },

  /** A Growlithe's kennel: plank walls under a gabled roof, an arched doorway, a name plate with a paw on it, and an
      orange bowl of kibble out front. */
  kennel(K, s, W, D, L) {
    const { lathe, ball, cyl, rbox } = L, hw = u(12), z0 = -0.08, d = 0.62, front = z0 + d / 2, paw = K.gloss(BOWL);
    K.put(prism(L, [[-hw, 0], [hw, 0], [hw, u(22)], [0, u(33.5)], [-hw, u(22)]], d), K.wood(), 0, 0, z0);
    for (const sg of [-1, 1]) K.put(slat(L, u(0.8), u(22), 0.01), K.wood(L.tone(K.pal.w, 0.74)), sg * u(4), u(11), front + 0.005);
    const th = Math.atan2(16, 15), len = u(15) / Math.cos(th);
    for (const sg of [-1, 1]) K.put(rbox(len, 0.09, d + 0.12, 0.012), K.gloss(K.pal.c), sg * u(7.5), 0.87, z0, 0, 0, -sg * th);
    K.put(arch(L, u(10), u(13), 0.01), K.plain('#2a1e18'), 0, 0, front + 0.004);
    K.put(rbox(u(8), u(4), 0.02, 0.006), K.gloss(K.pal.a), 0, u(21), front + 0.012);
    K.put(ball(u(1), 8, 6).scale(1, 1, 0.4), paw, 0, u(20.6), front + 0.024);
    for (const dx of [-1.6, 0, 1.6]) K.put(ball(u(0.55), 8, 6).scale(1, 1, 0.4), paw, u(dx), u(22.2), front + 0.024);
    const bx = X(25.5), bz = 0.355;
    K.put(lathe([[0, 0], [u(3.5), 0], [u(4.5), u(5)], [u(3.9), u(5)], [u(3.2), u(1)], [0, u(1)]], 16), K.gloss(BOWL), bx, 0, bz);
    K.put(cyl(u(3.7), 0.01, u(3.7), 12), K.plain(BARK), bx, u(4), bz);
    for (let i = 0; i < 4; i++) K.put(ball(u(0.9), 8, 6), K.plain(L.tone(BARK, 1.15)), bx + Math.cos(i * 1.6) * u(1.8), u(4.3), bz + Math.sin(i * 1.6) * u(1.8));
  },

  /** A glasshouse: a wooden base, glass walls and a glass gable roof in a white frame, staging inside either side with
      pots of tomato plants. */
  glasshouse(K, s, W, D, L) {
    const { rbox, lathe, ball } = L, frame = K.gloss(K.pal.p), hw = u(28), d = 1.7, base = u(12), eaveY = u(54), ridge = u(78), f = d / 2 + 0.012;
    K.put(rbox(u(60), base, d + 0.06, 0.015), K.wood(), 0, base / 2, 0);
    K.put(prism(L, [[-hw, base], [hw, base], [hw, eaveY], [0, ridge], [-hw, eaveY]], d), K.glass(), 0, 0, 0);
    // the frame: uprights front and back, rails at the eaves and transom, the gables, ridge and roof bars, the sides
    for (const z of [-f, f]) {
      for (let i = 0; i < 7; i++) K.put(slat(L, u(2), u(42), 0.03), frame, X(4 + i * 9.33, W), u(33), z);
      for (const [y, h] of [[u(54), u(2)], [u(33.25), u(1.5)]]) K.put(slat(L, u(58), h, 0.03), frame, 0, y, z);
      for (const sg of [-1, 1]) board(K, L, frame, [sg * hw, eaveY, z], [0, ridge, z], u(2), 0.03);
      K.put(slat(L, u(2), ridge - eaveY, 0.03), frame, 0, (ridge + eaveY) / 2, z);
    }
    K.put(slat(L, u(2), u(2), d + 0.04), frame, 0, ridge, 0);
    for (const sg of [-1, 1]) {
      K.put(slat(L, 0.04, u(2), d + 0.04), frame, sg * hw, eaveY, 0);
      for (const z of [-d / 4, 0, d / 4]) {
        K.put(slat(L, 0.03, u(42), u(2)), frame, sg * (hw + 0.008), u(33), z);
        board(K, L, frame, [sg * hw, eaveY + 0.01, z], [0, ridge + 0.01, z], u(1.6), 0.02);
      }
    }
    K.put(ball(u(1), 8, 6), K.metal(K.pal.a), X(34.5, W), u(26), f + 0.02);
    // the staging and its plants
    for (const z of [-0.45, 0.45]) {
      K.put(rbox(1.5, u(2.5), 0.4, 0.01), K.wood(L.tone(K.pal.w, 1.15)), 0, u(16), z);
      for (let i = 0; i < 4; i++) {
        const x = X(12 + i * 13, W);
        K.put(lathe([[0, 0], [u(2.2), 0], [u(3), u(5)], [0, u(5)]], 8, true), K.gloss(K.pal.pot), x, u(17.25), z);
        K.put(ball(u(5.5), 8, 6).scale(1, 1.1, 0.8), K.plain(L.tone(K.pal.leaf, i % 2 ? 1 : 0.85)), x, u(26), z);
        K.put(ball(u(1.6), 8, 6), K.gloss('#e04838'), x + u(2), u(27), z + 0.12 * Math.sign(z));
      }
    }
  },

  /** An arbour over a bench: lattice sides between white posts, a round arch front and back joined by slats, roses
      over it all; a slatted bench under it. */
  arbourbench(K, s, W, D, L) {
    const { rbox, torus, ball } = L, white = K.gloss(K.pal.p), wood = K.wood(), dark = K.wood(L.tone(K.pal.w, 0.78)), px = X(59, W), pz = 0.3, R = u(27), y0 = u(62);
    for (const x of [-px, px]) {
      for (const z of [-pz, pz]) K.put(rbox(u(4), y0, u(4), 0.01), white, x, y0 / 2, z);
      for (let j = 0; j < 4; j++) for (const sg of [-1, 1]) board(K, L, white, [x, u(6 + j * 14), -pz * sg], [x, u(20 + j * 14), pz * sg], 0.025, 0.012);
    }
    for (const z of [-pz, pz]) K.put(torus(R, u(1.7), Math.PI, 24), white, 0, y0, z);
    for (let i = 0; i < 7; i++) { const a = (i + 0.5) / 7 * Math.PI; K.put(slat(L, u(3), u(2), pz * 2 + 0.1), white, Math.cos(a) * R, y0 + Math.sin(a) * R, 0, 0, 0, a - Math.PI / 2); }
    // the bench: legs, seat, back slats and their rail
    for (const a of [13.5, 50.5]) {
      K.put(slat(L, u(3), u(13), u(3)), dark, X(a, W), u(6.5), 0.11);
      K.put(slat(L, u(3), u(36), u(3)), dark, X(a, W), u(18), -0.12);
    }
    K.put(rbox(u(46), u(4), 0.3, 0.012), K.wood(L.tone(K.pal.w, 1.15)), 0, u(15), 0);
    for (let i = 0; i < 6; i++) K.put(rbox(u(5), u(18), 0.03, 0.01), wood, X(13.5 + i * 7.3, W), u(25), -0.11);
    K.put(rbox(u(44), u(3), 0.05, 0.01), K.wood(L.tone(K.pal.w, 1.15)), 0, u(34.5), -0.11);
    // roses over the arches and up the front posts
    for (const z of [-pz, pz]) for (let i = 0; i <= 10; i++) {
      const t = i / 10 * Math.PI, x = -Math.cos(t) * R, y = y0 + Math.sin(t) * R, out = z + Math.sign(z) * 0.03;
      K.put(ball(u(3.6), 8, 6), K.plain(L.tone(K.pal.leaf, i % 2 ? 1 : 0.85)), x, y, out);
      if (i % 2 === 0) K.put(ball(u(2), 8, 6), K.gloss(K.pal.c), x, y + u(1), out + Math.sign(z) * 0.05);
    }
    for (const x of [-px, px]) for (let j = 0; j < 5; j++) {
      K.put(ball(u(1.8), 8, 6).scale(1, 1.4, 0.6), K.plain(K.pal.leaf), x + (j % 2 ? u(2) : -u(2)), u(10 + j * 10), pz + u(2.5));
      if (j % 2) K.put(ball(u(1.6), 8, 6), K.gloss(K.pal.c), x, u(15 + j * 10), pz + u(3));
    }
  },

  /** A tool shed: plank walls under a sloping tin roof, braced double doors with a padlock, a rake and a spade leant on
      it. */
  toolshed(K, s, W, D, L) {
    const { rbox, cyl, torus } = L, hw = u(27), d = 0.8, z0 = -0.08, front = z0 + d / 2, door = K.gloss(K.pal.c), brace = K.gloss(K.pal.p), ink = K.gloss(INK);
    K.put(prism(L, [[-hw, 0], [hw, 0], [hw, u(52)], [-hw, u(58)]], d), K.wood(), 0, 0, z0);
    for (let i = 1; i < 9; i++) { const x = -hw + i * u(6), h = u(58) - (x + hw) / (2 * hw) * u(6) - 0.05; K.put(slat(L, u(0.8), h, 0.01), K.wood(L.tone(K.pal.w, 0.74)), x, h / 2, front + 0.004); }
    const tilt = -Math.atan2(u(7.5), u(62));
    K.put(rbox(u(62) / Math.cos(tilt), 0.1, 0.98, 0.012), K.metal(K.pal.m), 0, u(56), 0, 0, 0, tilt);
    for (let i = 0; i < 9; i++) K.put(cyl(0.012, u(62) / Math.cos(tilt), 0.012, 6).rotateZ(Math.PI / 2), K.metal(L.tone(K.pal.m, 1.2)), 0, u(56) + 0.05, -0.47 + i * 0.112, 0, 0, tilt);
    // the doors, their Z braces, hinges and the padlock
    for (const a of [24, 40]) {
      const x = X(a, W);
      K.put(rbox(u(15.6), u(44), 0.035, 0.008), door, x, u(22), front + 0.018);
      for (const y of [41, 22, 3]) K.put(slat(L, u(14), u(2), 0.012), brace, x, u(y), front + 0.04);
      for (const [y0, y1] of [[5, 22], [24, 41]]) board(K, L, brace, [x - u(5.5), u(y0), front + 0.04], [x + u(5.5), u(y1), front + 0.04], u(1.8), 0.012);
    }
    K.put(slat(L, u(1), u(44), 0.02), ink, 0, u(22), front + 0.008);
    for (const sg of [-1, 1]) for (const y of [39, 7]) K.put(slat(L, u(3), u(2), 0.01), ink, sg * X(47.5, W), u(y), front + 0.04);
    K.put(rbox(u(4), u(4), 0.03, 0.006), K.gloss(K.pal.a), 0, u(24), front + 0.05);
    K.put(torus(u(1.3), 0.005, Math.PI, 8), K.metal('#c8ccd4'), 0, u(26), front + 0.05);
    // a rake leant at the left, tines up; a spade at the right
    const handle = K.wood(HANDLE), steel = K.metal(STEEL);
    rod(K, L, handle, [X(3, W), 0.01, front + 0.08], [X(6, W), u(44), front + 0.05], 0.014);
    K.put(rbox(u(10), u(2), 0.03, 0.006), steel, X(6, W), u(45), front + 0.05);
    for (let i = 0; i < 5; i++) K.put(slat(L, u(0.8), u(3), 0.012), steel, X(1.9 + i * 2, W), u(47.5), front + 0.05);
    rod(K, L, handle, [X(60, W), u(9), front + 0.08], [X(58, W), u(40), front + 0.05], 0.014);
    K.put(torus(0.03, 0.008, TAU, 10), handle, X(58, W), u(40) + 0.03, front + 0.05);
    K.put(rbox(u(4.2), u(9), 0.012, 0.004), steel, X(60.75, W), u(4.5), front + 0.085);
  },

  /** A dovecote on a pole: a six-sided house, two tiers of arched holes with perches, a pointed roof and a finial, a
      Pidgey on the ledge. */
  dovecote(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, wood = K.wood(), house = K.gloss(K.pal.p), hole = K.plain(HOLE), r = 0.325, y0 = u(54), y1 = u(78), a = r * Math.cos(Math.PI / 6);
    K.put(rbox(u(12), u(4), u(12), 0.012), K.wood(L.tone(K.pal.w, 0.8)), 0, u(2), 0);
    K.put(rbox(u(4), u(50), u(4), 0.01), wood, 0, u(29), 0);
    for (const [sx, sz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) rod(K, L, wood, [sx * u(1.5), u(40), sz * u(1.5)], [sx * u(7), u(52), sz * u(7)], u(0.9));
    K.put(cyl(0.44, u(2.5), 0.44, 6), K.wood(L.tone(K.pal.w, 1.15)), 0, u(52.75), 0);
    K.put(cyl(r, y1 - y0, r, 6), house, 0, (y0 + y1) / 2, 0);
    K.put(cyl(r + 0.005, u(1.5), r + 0.005, 6), K.gloss(L.tone(K.pal.p, 0.85)), 0, u(65.75), 0);
    // the holes and perches, on the two faces either side of the front and the two at the back
    for (const th of [Math.PI / 6, -Math.PI / 6, Math.PI * 5 / 6, -Math.PI * 5 / 6]) for (const y of [u(69), u(57)]) {
      const sx = Math.sin(th), sz = Math.cos(th);
      K.put(arch(L, u(5), u(5), 0.008), hole, sx * (a + 0.004), y, sz * (a + 0.004), th);
      K.put(cyl(0.008, u(6), 0.008, 6).rotateZ(Math.PI / 2), wood, sx * (a + 0.03), y - u(0.6), sz * (a + 0.03), th);
    }
    K.put(cyl(0.001, u(15), 0.433, 6), K.gloss(K.pal.c), 0, u(84.5), 0);
    K.put(cyl(0.433, u(2), 0.433, 6), K.gloss(L.tone(K.pal.c, 0.75)), 0, u(77), 0);
    K.put(ball(u(1.6), 8, 6), K.gloss(K.pal.a), 0, u(93), 0);
    // a Pidgey: body, belly, tail, head, beak, eye and its crest
    const brown = K.gloss(PIDGEY);
    K.put(ball(u(3.3), 10, 8).scale(1.06, 0.9, 1), brown, X(22), u(58), 0.3);
    K.put(ball(u(2.2), 8, 6), K.gloss('#f0dcb0'), X(22.5), u(57.5), 0.36);
    K.put(ball(u(1.6), 8, 6).scale(1.6, 0.5, 0.8), K.gloss(L.tone(PIDGEY, 0.8)), X(18.5), u(57), 0.29, 0, 0, 0.3);
    K.put(ball(u(2.2), 10, 8), brown, X(24), u(61.5), 0.31);
    K.put(cyl(0.001, u(2), u(0.6), 6).rotateZ(-Math.PI / 2), K.gloss(INK), X(26.5), u(61.3), 0.31);
    K.put(ball(u(0.5), 8, 6), K.gloss(INK), X(24.6), u(62.3), 0.37);
    K.put(cyl(0.001, u(2.5), u(0.8), 6), K.gloss('#c85a3a'), X(23.6), u(64.5), 0.31, 0, 0, 0.4);
  },

  /** A garden pavilion: four poles, a striped eight-sided roof with a valance and scallops, a back wall of canvas, the
      front curtains tied back, a pennant on top. */
  pavilion(K, s, W, D, L) {
    const { THREE, cyl, rbox } = L, pole = K.metal(K.pal.m), c = K.cloth(K.pal.c), p = K.cloth(K.pal.p), px = 1 - u(3.5), pz = 0.85, eave = u(62), peak = u(90), R = 1.08;
    for (const x of [-px, px]) for (const z of [-pz, pz]) K.put(cyl(u(1.5), eave, u(1.5), 12), pole, x, eave / 2, z);
    for (let i = 0; i < 8; i++) {
      const th = -Math.PI / 8 + i * Math.PI / 4;
      K.put(new THREE.CylinderGeometry(0.001, R, peak - eave, 1, 1, true, th, Math.PI / 4), i % 2 ? p : c, 0, (eave + peak) / 2, 0);
      K.put(new THREE.CylinderGeometry(R, R, u(5), 1, 1, true, th, Math.PI / 4), i % 2 ? c : p, 0, eave - u(2.5), 0);
      const m = th + Math.PI / 8, ap = R * Math.cos(Math.PI / 8) - 0.004;
      K.put(scallop(L, u(4), 0.012), i % 2 ? c : p, Math.sin(m) * ap, u(57), Math.cos(m) * ap, m);
    }
    // the back wall and its folds; the front curtains, drawn back and tied
    K.put(rbox(u(54), u(58), 0.03, 0.006), K.cloth(L.tone(K.pal.p, 0.85)), 0, u(29), -pz + 0.03);
    for (let i = 0; i < 6; i++) K.put(slat(L, u(1), u(58), 0.008), K.cloth(L.tone(K.pal.p, 0.62)), X(5.5 + i * 9, W), u(29), -pz + 0.05);
    for (const sg of [1, -1]) {
      const x0 = sg > 0 ? X(5, W) : X(59, W), pts = [[0, 58], [12, 58], [2, 34], [4, 2], [0, 2]].map(([dx, y]) => [x0 + sg * u(dx), u(y)]);
      K.put(drape(L, sg > 0 ? pts : pts.reverse(), 0.05), p, 0, 0, pz - 0.03);
      K.put(rbox(u(5), u(2.5), 0.09, 0.008), K.gloss(K.pal.a), x0 + sg * u(2.5), u(34.75), pz - 0.03);
    }
    rod(K, L, pole, [0, peak - 0.02, 0], [0, u(98), 0], 0.008);
    K.put(prism(L, [[0, 0], [u(7.5), -u(2.5)], [0, -u(5)]], 0.008), K.gloss(K.pal.a), 0.008, u(98), 0);
  },

  /** A woodshed: an open-fronted lean-to of posts and boards under a sloping roof, logs stacked in it, a chopping block
      with its axe out front. */
  woodshed(K, s, W, D, L) {
    const { THREE, rbox, cyl } = L, wood = K.wood(), dark = K.wood(L.tone(K.pal.w, 0.52)), bark = K.plain(BARK), end = K.plain(LOG);
    for (const a of [4, 60]) for (const z of [-0.38, 0.32]) K.put(rbox(u(4), u(56), u(4), 0.01), wood, X(a, W), u(28), z);
    K.put(rbox(u(54), u(54), 0.04, 0.008), dark, 0, u(27), -0.42);
    for (const sg of [-1, 1]) K.put(rbox(0.03, u(44), 0.66, 0.008), dark, sg * X(60, W), u(24), -0.03);
    K.put(rbox(u(54), u(3), 0.78, 0.008), K.wood(L.tone(K.pal.w, 0.74)), 0, u(1.5), -0.04);
    K.put(rbox(W, 0.06, D - 0.02, 0.015), K.gloss(K.pal.c), 0, u(57.5), 0, 0, -Math.atan2(u(5), D - 0.02));
    // the logs, bark round them and their cut ends to the front
    const log = cyl(u(3.2), 0.5, u(3.2), 8, true).rotateX(Math.PI / 2), face = new THREE.CircleGeometry(u(2.7), 8);
    for (let row = 0; row < 7; row++) for (let i = 0; i < 8; i++) {
      const lx = 9 + i * 6.6 + (row % 2) * 3.3;
      if (lx > 56) continue;
      K.put(log.clone(), bark, X(lx, W), u(6 + row * 5.8), -0.13);
      K.put(face.clone(), end, X(lx, W), u(6 + row * 5.8), 0.121);
    }
    K.put(cyl(u(5.5), u(9), u(5.5), 12), K.plain('#8a6038'), X(49.5, W), u(4.5), 0.32);
    K.put(cyl(u(5), 0.004, u(5), 12), end, X(49.5, W), u(9) + 0.002, 0.32);
    rod(K, L, K.wood(HANDLE), [X(48, W), u(9.5), 0.34], [X(54, W), u(22), 0.36], 0.012);
    K.put(rbox(u(4.5), u(3.5), 0.015, 0.004), K.metal(STEEL), X(47.25, W), u(11), 0.34, 0, 0, 0.3);
  },

  /** A tiki bar: a thatched roof on bamboo posts, lanterns under its eaves, a bamboo-clad counter with a tiki mask on its
      front and a coconut drink on top, a shelf of bottles behind. */
  tikibar(K, s, W, D, L) {
    const { rbox, cyl, lathe, ball, torus } = L, bamboo = K.plain(BAMBOO), node = K.plain(L.tone(BAMBOO, 0.6)), straw = K.plain(STRAW), p = 0.84;
    for (const x of [-p, p]) for (const z of [-p, p]) {
      K.put(cyl(u(2), u(64), u(2), 12), bamboo, x, u(32), z);
      for (const y of [40, 52]) K.put(torus(u(2), 0.008, TAU, 12).rotateX(Math.PI / 2), node, x, u(y), z);
    }
    K.put(cyl(0.02, u(30), Math.SQRT2, 4).rotateY(Math.PI / 4), straw, 0, u(77), 0);
    K.put(cyl(1.4, u(6), 1.4, 4, true).rotateY(Math.PI / 4), K.plain(L.tone(STRAW, 0.85)), 0, u(61), 0);
    for (const x of [-0.5, 0, 0.5]) {
      K.put(cyl(0.004, u(3), 0.004, 6), K.plain(INK), x, u(60.5), 0.6);
      K.put(ball(u(2.6), 10, 8).scale(1, 1.2, 1), K.glow(), x, u(57), 0.6);
    }
    // the back shelf of bottles
    K.put(rbox(u(48), u(34), 0.04, 0.008), K.wood(L.tone(K.pal.w, 0.52)), 0, u(47), -0.8);
    K.put(rbox(u(48), u(2.5), 0.2, 0.008), K.wood(), 0, u(48.75), -0.7);
    for (let i = 0; i < 7; i++) K.put(lathe([[0, 0], [u(1.75), 0], [u(1.75), u(9)], [u(0.75), u(10)], [u(0.75), u(12)], [0, u(12)]], 8, true), K.gloss(BOTTLES[i % 4]), X(12.75 + i * 6.5, W), u(50), -0.7);
    // the counter: its body, bamboo cladding with nodes, the top
    K.put(rbox(u(56), u(30), 0.3, 0.01), K.wood(L.tone(K.pal.w, 0.62)), 0, u(15), 0.6);
    for (let i = 0; i < 13; i++) {
      const x = X(6.15 + i * 4.3, W);
      K.put(cyl(u(2.15), u(30), u(2.15), 8, true), i % 2 ? bamboo : K.plain(L.tone(BAMBOO, 0.74)), x, u(15), 0.817);
      for (const y of [u(19.5), u(9.5)]) K.put(cyl(u(2.3), u(1), u(2.3), 8, true), node, x, y, 0.817);
    }
    K.put(rbox(u(60), u(4), 0.5, 0.012), K.wood(), 0, u(32), 0.62);
    // the mask: its face, eyes and brows, nose, mouth and teeth
    const mz = 0.885;
    K.put(rbox(u(12), u(20), 0.04, 0.02), K.gloss(K.pal.c), 0, u(17), mz);
    for (const a of [29.5, 34.5]) { K.put(slat(L, u(3), u(3), 0.01), K.gloss(INK), X(a, W), u(21.5), mz + 0.022); K.put(slat(L, u(4), u(1.2), 0.012), K.gloss(K.pal.a), X(a, W), u(24.4), mz + 0.022); }
    K.put(rbox(u(2), u(4), 0.03, 0.006), K.gloss(L.tone(K.pal.c, 0.74)), 0, u(18), mz + 0.024);
    K.put(slat(L, u(7), u(3), 0.01), K.gloss(INK), 0, u(12.5), mz + 0.022);
    K.put(slat(L, u(5), u(1), 0.012), K.gloss(WHITE), 0, u(13.5), mz + 0.024);
    // a coconut drink with its straw and umbrella
    K.put(ball(u(3.5), 10, 8), K.plain(BARK), X(48, W), u(37.5), 0.6);
    rod(K, L, K.gloss(WHITE), [X(49, W), u(40), 0.6], [X(51, W), u(46), 0.6], 0.005);
    K.put(cyl(0.001, u(3), u(4), 8), K.gloss(K.pal.a), X(51, W), u(47.5), 0.6);
  },

  /** A cabana: four posts under a flat canopy scalloped all round, a back curtain, the front curtains tied back, a
      daybed with its mattress and three cushions. */
  cabana(K, s, W, D, L) {
    const { rbox, blob, cyl } = L, c = K.cloth(K.pal.c), p = K.cloth(K.pal.p), px = 1 - u(4), pz = 0.875;
    for (const x of [-px, px]) for (const z of [-pz, pz]) K.put(cyl(u(2), u(72), u(2), 12), K.wood(), x, u(36), z);
    K.put(rbox(W, u(8), D, 0.03), c, 0, u(76), 0);
    for (const [ry, ox, oz] of [[0, 0, 1], [Math.PI, 0, -1], [Math.PI / 2, 1, 0], [-Math.PI / 2, -1, 0]]) for (let i = 0; i < 8; i++) {
      const t = X(4 + i * 8, W);
      K.put(scallop(L, u(4), 0.012), i % 2 ? p : c, ox * 0.994 + oz * t, u(72), oz * 0.994 - ox * t, ry);
    }
    K.put(rbox(u(52), u(56), 0.03, 0.006), K.cloth(L.tone(K.pal.p, 0.85)), 0, u(44), -0.85);
    for (let i = 0; i < 6; i++) K.put(slat(L, u(1), u(56), 0.008), K.cloth(L.tone(K.pal.p, 0.62)), X(6.5 + i * 8.6, W), u(44), -0.83);
    for (const sg of [1, -1]) {
      const x0 = sg > 0 ? X(6, W) : X(58, W), pts = [[0, 72], [10, 72], [2, 40], [5, 2], [0, 2]].map(([dx, y]) => [x0 + sg * u(dx), u(y)]);
      K.put(drape(L, sg > 0 ? pts : pts.reverse(), 0.05), p, 0, 0, pz - 0.03);
      K.put(rbox(u(5), u(2.5), 0.09, 0.008), K.gloss(K.pal.a), x0 + sg * u(2.5), u(40.75), pz - 0.03);
    }
    // the daybed
    for (const a of [9.5, 54.5]) for (const z of [-0.5, 0.5]) K.put(slat(L, u(3), u(8), u(3)), K.wood(L.tone(K.pal.w, 0.78)), X(a, W), u(4), z);
    K.put(rbox(u(52), u(5), 1.2, 0.015), K.wood(), 0, u(9.5), 0);
    K.put(blob(u(50), u(6), 1.16, 0.25, 0.4), p, 0, u(14), 0);
    [[17, 22, K.pal.c], [32, 21.5, K.pal.a], [47, 22, K.pal.c]].forEach(([a, y, col]) => K.put(blob(u(14), u(12), 0.14, 0.5, 0.6), K.cloth(col), X(a, W), u(y), -0.4, 0, -0.25));
  },

  /** A market stall: a plank counter with its top, three crates of fruit on it, posts up to a striped awning sloping to
      the front with scallops along its edge, a chalkboard hung under it. */
  marketstall(K, s, W, D, L) {
    const { rbox, ball } = L, wood = K.wood(), dark = K.wood(L.tone(K.pal.w, 0.74)), c = K.cloth(K.pal.c), p = K.cloth(K.pal.p);
    for (const a of [5.5, 58.5]) { K.put(rbox(u(3), u(68), u(3), 0.008), wood, X(a, W), u(34), 0.3); K.put(rbox(u(3), u(78), u(3), 0.008), wood, X(a, W), u(39), -0.42); }
    K.put(rbox(u(60), u(28), 0.5, 0.012), dark, 0, u(14), 0);
    for (let i = 0; i < 4; i++) K.put(rbox(u(60), u(6.8), 0.02, 0.006), i % 2 ? dark : wood, 0, u(3.5 + i * 7), 0.255);
    K.put(rbox(u(62), u(3), 0.58, 0.01), K.wood(L.tone(K.pal.w, 1.18)), 0, u(29.5), 0);
    [[14, '#d83a3a'], [32, '#f09030'], [50, '#78b848']].forEach(([a, fruit]) => {
      K.put(rbox(u(16), u(7), 0.36, 0.01), dark, X(a, W), u(34.5), 0);
      for (const z of [-0.08, 0.08]) for (let i = 0; i < 4; i++) K.put(ball(u(2.2), 8, 6), K.gloss(fruit), X(a - 5.5 + i * 3.7, W), u(38.5), z);
    });
    // the awning: stripes from the back posts' tops down to the front, its scalloped edge
    const zb = -0.42, zf = 0.42, yb = u(78), yf = u(66), len = Math.hypot(zf - zb, yb - yf), tilt = Math.atan2(yb - yf, zf - zb);
    for (let i = 0; i < 8; i++) {
      K.put(rbox(u(8), 0.02, len, 0.004), i % 2 ? p : c, X(4 + i * 8, W), (yb + yf) / 2, (zb + zf) / 2, 0, tilt);
      K.put(scallop(L, u(4), 0.012), i % 2 ? p : c, X(4 + i * 8, W), yf, zf);
    }
    const ys = yb - (0.3 - zb) * Math.tan(tilt);
    for (const a of [28, 36]) K.put(L.cyl(0.004, ys - u(56), 0.004, 6), K.plain(INK), X(a, W), (ys + u(56)) / 2, 0.3);
    K.put(rbox(u(12), u(7), 0.02, 0.006), K.plain('#2e3a34'), 0, u(52.5), 0.3);
    K.put(slat(L, u(8), u(0.8), 0.004), K.plain(WHITE), 0, u(53.1), 0.312);
    K.put(slat(L, u(6), u(0.8), 0.004), K.plain(WHITE), X(31, W), u(50.6), 0.312);
  },

  /** A lighthouse for the garden: on a few rocks, a tapering tower in four bands with a door and windows, the gallery
      and its rail, the lit lantern behind mullions, a domed cap and its finial. */
  lighthouse(K, s, W, D, L) {
    const { THREE, lathe, cyl, ball, torus } = L, iron = K.metal(K.pal.m), dark = K.gloss(INK);
    const rock = (x, z, sx, sy, sz, f) => K.put(new THREE.SphereGeometry(1, 10, 4, 0, TAU, 0, Math.PI / 2).scale(sx, sy, sz), K.plain(L.tone(STONE, f)), x, 0, z);
    rock(X(10), 0.05, u(7), u(7), u(7), 1); rock(X(22), -0.02, u(8), u(7), u(7), 0.8); rock(X(16), 0.12, u(6), u(7.5), u(5), 1.15);
    for (let i = 0; i < 4; i++) K.put(lathe([[u(9 - 0.75 * i), 0], [u(8.25 - 0.75 * i), u(13)]], 16), K.gloss(i % 2 ? K.pal.p : K.pal.c), 0, u(6 + 13 * i), 0);
    const rAt = (y) => u(9 - 0.75 * (y - 6) / 13);
    K.put(arch(L, u(4), u(8), 0.012), dark, 0, u(6), rAt(10) + 0.004, 0, -0.05);
    for (const y of [28.5, 42.5]) K.put(slat(L, u(2), u(3), 0.012), dark, 0, u(y), rAt(y) - 0.002);
    K.put(cyl(u(8), u(2.5), u(8), 16), iron, 0, u(58.75), 0);
    for (let i = 0; i < 8; i++) K.put(cyl(0.006, u(6), 0.006, 6), iron, Math.sin(i * TAU / 8) * u(7.6), u(63), Math.cos(i * TAU / 8) * u(7.6));
    K.put(torus(u(7.6), 0.008, TAU, 16).rotateX(Math.PI / 2), iron, 0, u(66), 0);
    K.put(cyl(u(5), u(12), u(5), 12), K.glow(), 0, u(66), 0);
    for (let i = 0; i < 4; i++) K.put(slat(L, u(1), u(12), u(1)), iron, Math.sin(i * Math.PI / 2) * u(5), u(66), Math.cos(i * Math.PI / 2) * u(5));
    K.put(new THREE.SphereGeometry(1, 12, 5, 0, TAU, 0, Math.PI / 2).scale(u(7), u(6), u(7)), K.gloss(K.pal.c), 0, u(72), 0);
    K.put(cyl(0.008, u(3), 0.008, 6), iron, 0, u(79.5), 0);
    K.put(ball(u(1.2), 8, 6), iron, 0, u(82), 0);
  },

  /** A garden windmill: a stone foot, an eight-sided tapering tower with its corner timbers, a door and a window, a
      domed cap, four lattice sails in an X on a hub. */
  windmill(K, s, W, D, L) {
    const { THREE, lathe, cyl, rbox } = L, timber = K.wood(), k8 = Math.cos(Math.PI / 8), y0 = u(4), top = u(48), rb = u(8) / k8, rt = u(5) / k8;
    K.put(rbox(u(18), u(4), u(18), 0.012), K.plain(STONE), 0, u(2), 0);
    K.put(lathe([[rb, 0], [rt, top - y0], [0, top - y0]], 8, true).rotateY(Math.PI / 8), K.gloss(K.pal.p), 0, y0, 0);
    for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + i * Math.PI / 4; rod(K, L, timber, [Math.sin(a) * rb, y0, Math.cos(a) * rb], [Math.sin(a) * rt, top, Math.cos(a) * rt], 0.008); }
    const ap = (y) => u(8 - 3 * (y - 4) / 44), lean = -Math.atan2(u(3), u(44));
    K.put(arch(L, u(4), u(7), 0.012), timber, 0, y0, ap(9) + 0.006, 0, lean);
    K.put(slat(L, u(2.5), u(3.5), 0.012), K.gloss(INK), 0, u(28.25), ap(28.25) + 0.004, 0, lean);
    K.put(new THREE.SphereGeometry(u(7), 12, 5, 0, TAU, 0, Math.PI / 2), K.gloss(K.pal.c), 0, top, 0);
    K.put(cyl(u(7.5), u(2), u(7.5), 12), K.gloss(L.tone(K.pal.c, 0.74)), 0, top, 0);
    // the hub, and four sails: each a spar, its lattice of cloth and bars, built as painted then turned into the X
    const hy = u(46), zs = 0.29, sail = K.cloth(K.pal.p);
    K.put(cyl(u(1.2), 0.14, u(1.2), 12).rotateX(Math.PI / 2), K.metal(K.pal.m), 0, hy, 0.21);
    K.put(cyl(u(2), 0.03, u(2), 12).rotateX(Math.PI / 2), K.metal(K.pal.m), 0, hy, zs + 0.016);
    const part = (r, d) => { const [a, c, w, h] = r; return slat(L, u(w), u(h), d).translate(u(a + w / 2), -u(c + h / 2), 0); };
    for (let i = 0; i < 4; i++) {
      const turn = -(Math.PI / 4 + i * Math.PI / 2);
      K.put(part([-0.7, 0, 1.4, 16], 0.024), timber, 0, hy, zs, 0, 0, turn);
      K.put(part([0.8, 3, 4.5, 13], 0.006), sail, 0, hy, zs, 0, 0, turn);
      for (let j = 0; j < 4; j++) K.put(part([0.8, 3.5 + j * 3.5, 4.5, 0.6], 0.014), timber, 0, hy, zs, 0, 0, turn);
      K.put(part([5.3, 3, 0.6, 13], 0.014), timber, 0, hy, zs, 0, 0, turn);
    }
  },
};
