/* base-models-gengar.js  -  the Gengar room's models (furniture expansion session a, 2026-10-17). Each piece follows its
   painting in js/base-furniture-gengar.js, read in the same units up from the floor (`u(n)` n of 32 a tile, `X(n, W)` a
   unit across as x from the middle): the heads, ears, spikes, eyes and grins come from that file's `headSpec()` /
   `faceSpec()`, so the two agree. A head is a squashed ball, its ears and spikes cones, its eyes and grin thin parts
   laid onto the ball's front (`bend()`), one gloss draw with the rest. Wall pieces (the clock, the BOO! sign, the
   portrait) stand out from the wall at z 0 as js/base-models-w.js's do. */

import { headSpec, faceSpec, grinTop, grinBot, graveFingers, LEAVES, GENG as C, GENG_PARTS as G } from './base-furniture-gengar.js';
import { whole } from './base-models-w.js';
import { tube } from './base-models-kit.js';

const u = (n) => n / 32;
const X = (n, W = 1) => n / 32 - W / 2;

/** A cone len long and bw round at its base, its base at the origin pointing up; zs squashes it front to back. */
function cone(L, len, bw, zs = 1) {
  const g = L.cyl(0, len, bw, 8);
  g.translate(0, len / 2, 0);
  if (zs !== 1) g.scale(1, 1, zs);
  return g;
}
/** Cones from a painting's list (see headSpec), at depth z; spikes in deep purple, ears in m. */
function cones(K, L, list, W, z, m, zs = 0.6, sz = z) {
  const deep = K.gloss(C.deep);
  for (const c of list) K.put(cone(L, u(c.len), u(c.bw), c.spike ? 1 : zs).rotateZ(-c.d), c.spike ? deep : m, X(c.x, W), u(c.y), c.spike ? sz : z);
}
/** Lays a flat part (in the x-y plane, about a ball's middle) onto the front of that ball e = [rx, ry, rz], off in front
    of it; with no ball, just off forward. */
function bend(g, e, off) {
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const q = e ? 1 - (p.getX(i) / e[0]) ** 2 - (p.getY(i) / e[1]) ** 2 : 0;
    p.setZ(i, p.getZ(i) + (e ? e[2] * Math.sqrt(Math.max(0, q)) : 0) + off);
  }
  g.computeVertexNormals();
  return g;
}
/** The grin G as a sheet (a0 to a1 of its width), about the painting point cx, cy. */
function grinGeo(L, Gr, cx, cy, a0 = -0.5, a1 = 0.5) {
  const n = Math.max(4, Math.round(14 * (a1 - a0))), g = new L.THREE.PlaneGeometry(1, 1, n, 3), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = (a0 + (p.getX(i) + 0.5) * (a1 - a0)) * Gr.w, t = p.getY(i) + 0.5, b = grinBot(Gr, x);
    p.setXYZ(i, u(Gr.x + x - cx), u(Gr.y + b + t * (grinTop(Gr, x) - b) - cy), 0);
  }
  return g;
}
/** A face (faceSpec) about painting point cx, cy at depth z, laid on ball e (or flat). */
function face(K, L, F, W, cx, cy, z, e, put = K.put) {
  const red = K.gloss(C.red), white = K.gloss(C.white), { THREE } = L;
  const place = (g, off, m) => put(bend(g, e, off), m, X(cx, W), u(cy), z);
  for (const ey of F.eyes) {
    place(new THREE.CircleGeometry(1, 16).scale(u(ey.rx), u(ey.ry), 1).rotateZ(ey.rot).translate(u(ey.x - cx), u(ey.y - cy), 0), 0.005, red);
    const gx = -0.32 * ey.rx, gy = 0.3 * ey.ry, c = Math.cos(ey.rot), s = Math.sin(ey.rot);
    place(new THREE.CircleGeometry(u(ey.ry * 0.36), 8).translate(u(ey.x - cx + gx * c - gy * s), u(ey.y - cy + gx * s + gy * c), 0), 0.008, white);
  }
  if (F.grin) place(grinGeo(L, F.grin, cx, cy), 0.005, white);
}
/** A Gengar head (headSpec's numbers) in m, its middle at painting point cx, cy and depth z, rz deep: a squashed ball
    (cut `o.cut` units below its middle, for one sunk into something), ears, spikes on top and down its back, its face. */
function head(K, L, m, W, cx, cy, r, ry, z, rz, o = {}) {
  const { THREE } = L, S = headSpec(cx, cy, r, ry, o), deep = K.gloss(C.deep), R = u(r), n = L.sides(R, 20);
  const ball = o.cut == null ? L.ball(R, 20, 14) : new THREE.SphereGeometry(R, n, 10, 0, Math.PI * 2, 0, Math.acos(Math.max(-1, Math.min(1, -o.cut / ry))));
  K.put(ball.scale(1, ry / r, rz / R), m, X(cx, W), u(cy), z);
  // a wall piece's (o.wall) ears and spikes stop at the wall
  const at = (c) => (c.spike ? z - rz * 0.45 : z), atWall = (c) => Math.max(at(c), u(c.bw) * (c.spike ? 1 : 0.6) + 0.004);
  for (const c of S.cones) K.put(cone(L, u(c.len), u(c.bw), c.spike ? 1 : 0.6).rotateZ(-c.d), c.spike ? deep : m, X(c.x, W), u(c.y), o.wall ? atWall(c) : at(c));
  if (o.back !== false && !o.wall && S.cones.some(c => c.spike)) {
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0.35, -1).normalize());
    for (const [e, k] of [[0.5, 1], [0.05, 0.9], [-0.4, 0.75]]) {
      K.put(cone(L, u(S.sLen) * k * (o.bk ?? 1), u(S.sBw) * 1.1).applyQuaternion(q), deep, X(cx, W), u(cy) + Math.sin(e) * u(ry) * 0.85, z - Math.cos(e) * rz * 0.85);
    }
  }
  if (S.face) face(K, L, S.face, W, cx, cy, z, [R, u(ry), rz]);
  return S;
}
/** A plane over the painting's units [i0, j0] to [i1, j1] (up from the floor) wearing that part of it, at depth z. */
function paintPlane(K, L, W, i0, j0, i1, j1, z, foot) {
  const g = new L.THREE.PlaneGeometry(u(i1 - i0), u(j1 - j0)), H = foot ?? K.p.art(0, 1, true).height;
  K.put(g, whole(K, L, g, [i0, H - j1, i1, H - j0]), X((i0 + i1) / 2, W), u((j0 + j1) / 2), z);
}
/** A pot turned from an ellipse rx x ry about height cy, from the floor up to height top, a rim rolled over it. */
function ellPot(K, L, m, rim, cy, rx, ry, top) {
  const pts = [], a1 = Math.asin((top - cy) / ry);
  for (let k = 0; k <= 12; k++) { const a = -Math.PI / 2 + (a1 + Math.PI / 2) * k / 12; pts.push([u(rx * Math.cos(a)), u(cy + ry * Math.sin(a))]); }
  const rr = rx * Math.cos(a1);
  pts.push([u(rr - 1.2), u(top)], [u(rr - 1.2), u(top - 2)]);
  K.put(L.lathe(pts, 28), m);
  K.put(L.torus(u(rr), u(0.9), Math.PI * 2, 28).rotateX(Math.PI / 2), rim, 0, u(top), 0);
  return rr;
}

export const SHAPES = {
  gengbed: { make: 'gengbed', seat: 0.62 },
  gengchair: { make: 'gengchair', seat: 0.56 },
  gengsofa: { make: 'gengsofa', seat: 0.56 },
  gengtable: { make: 'gengtable', top: 0.66 },
  gengdesk: { make: 'gengdesk', top: 0.78 },
  gengwardrobe: { make: 'gengwardrobe', play: { does: 'door', inside: 'ghost' } },
  gengdresser: { make: 'gengdresser', top: 1.0 },
  gengshelf: { make: 'gengshelf' },
  genglamp: { make: 'genglamp', play: { does: 'light' } },
  gengclock: { make: 'gengclock', play: { does: 'ring' } },
  gengtv: { make: 'gengtv', screen: { x: 0, y: u(23), w: u(42), h: u(24), z: 0.262 }, play: { does: 'screen', show: ['cartoon', 'battle', 'quiz', 'bars'] } },
  gengmirror: { make: 'gengmirror' },
  gengboo: { make: 'gengboo' },
  gengportrait: { make: 'gengportrait' },
  gengcandles: { make: 'gengcandles', play: { does: 'light', flicker: true } },
  gengtower: { make: 'gengtower' },
  gengpouf: { make: 'gengpouf', seat: 0.56 },
  gengchest: { make: 'gengchest', play: { does: 'treasure' } },
  gengjack: { make: 'gengjack', play: { does: 'boing' } },
  gengsidetable: { make: 'gengsidetable', top: 0.75 },
  gengcauldron: { make: 'gengcauldron', play: { does: 'brew' } },
  genggrave: { make: 'genggrave' },
  gengplanter: { make: 'gengplanter' },
};

export const MAKES = {
  gengbed(K, s, W, D, L) {
    const { rbox, blob, ball } = L, deep = K.gloss(C.deep);
    // stubby feet, the frame and mattress, the duvet with its sheet folded back, two pillows
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.put(ball(u(3), 12, 8).scale(1, 0.8, 1), deep, sx * u(28), u(2.4), sz * 0.84);
    K.put(rbox(u(62), u(8), 1.86, 0.04), deep, 0, u(7), 0.04);
    K.put(rbox(u(58), u(6), 1.62, 0.05), K.cloth(C.pale), 0, u(14), 0.1);
    K.put(rbox(u(62), u(8), 1.24, 0.06), K.cloth(C.body), 0, u(16), 0.33);
    K.put(rbox(u(62.6), u(8.6), 0.14, 0.05), K.cloth(C.pale), 0, u(16.1), -0.24);
    for (const sx of [-1, 1]) K.put(blob(u(23), u(6), 0.32, 0.5, 0.5), K.cloth(C.white), sx * u(12.5), u(19.5), -0.55);
    // the headboard: a board, Gengar's head grinning over it
    K.put(rbox(u(58), u(30), 0.1, 0.03), deep, 0, u(15), -0.92);
    head(K, L, K.gloss(C.body), W, 32, 44, 26, 22, -0.78, 0.2, { back: false });
  },

  gengchair(K, s, W, D, L) {
    const { rbox, blob, cyl } = L, deep = K.gloss(C.deep), fur = K.cloth(C.body);
    for (const i of [5.5, 26.5]) for (const z of [-0.27, 0.27]) K.put(cyl(u(1.5), u(5), u(1.5), 12), deep, X(i), u(2.5), z);
    K.put(rbox(u(22), u(10), 0.1, 0.02), deep, 0, u(19), -0.28);
    head(K, L, fur, W, 16, 32, 13, 12, -0.22, 0.18, { bk: 0.6 });
    K.put(rbox(u(26), u(10), 0.72, 0.03), fur, 0, u(9), 0.02);
    K.put(blob(u(22), u(5), 0.6, 0.45, 0.5), K.cloth(C.lite), 0, u(15.5), 0.06);
    for (const i of [4.5, 27.5]) K.put(rbox(u(7), u(18), 0.74, u(3)), fur, X(i), u(13), 0.02);
  },

  gengsofa(K, s, W, D, L) {
    const { rbox, blob, cyl, ball } = L, deep = K.gloss(C.deep), fur = K.cloth(C.body);
    for (const i of [7.5, 56.5]) for (const z of [-0.3, 0.3]) K.put(cyl(u(1.5), u(4), u(1.5), 12), deep, X(i, W), u(2), z);
    K.put(rbox(u(50), u(12), 0.1, 0.02), deep, 0, u(20), -0.3);
    head(K, L, fur, W, 32, 28, 30, 15, -0.26, 0.15, { ...G.SOFA, bk: 0.45 });
    K.put(rbox(u(56), u(11), 0.74, 0.03), fur, 0, u(9.5), 0.03);
    for (const i of [21.25, 42.75]) K.put(blob(u(21.5), u(5.5), 0.58, 0.45, 0.5), K.cloth(C.lite), X(i, W), u(16.25), 0.08);
    // the arms, Gengar's own: round, three fingers at the front of each
    for (const i of [1, 53]) {
      K.put(rbox(u(10), u(20), 0.76, u(4)), fur, X(i + 5, W), u(14), 0.02);
      for (const d of [2.5, 5, 7.5]) K.put(ball(u(1.7), 12, 8), K.cloth(L.tone(C.body, 1.15)), X(i + d, W), u(21.5), 0.38);
    }
  },

  gengtable(K, s, W, D, L) {
    head(K, L, K.gloss(C.body), W, 32, 9.5, 22, 9.5, 0, 0.34, G.TABLE);
    K.put(L.rbox(u(60), u(3), 0.86, 0.03), K.wood(C.wood), 0, u(19.5), 0);
  },

  gengdesk(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, body = K.gloss(C.body);
    head(K, L, body, W, 32, 34, 24, 11, -0.36, 0.07, { ...G.DESK, back: false });
    for (const z of [-0.32, 0.32]) K.put(cyl(u(2), u(22), u(2), 12), K.gloss(C.deep), X(56.5, W), u(11), z);
    K.put(rbox(u(20), u(22), 0.8, 0.03), body, X(13, W), u(11), 0);
    for (const j of [3, 12]) {
      K.put(rbox(u(16), u(7.5), 0.03, 0.01), K.gloss(C.lite), X(13, W), u(j + 3.75), 0.415);
      K.put(ball(u(1.4), 12, 8), K.gloss(C.red), X(13, W), u(j + 3.75), 0.43);
    }
    K.put(rbox(u(62), u(3), 0.86, 0.02), K.wood(C.wood), 0, u(23.5), 0);
  },

  gengwardrobe(K, s, W, D, L) {
    const { rbox, ball } = L, body = K.gloss(C.body), lite = K.gloss(C.lite), white = K.gloss(C.white), deep = K.gloss(C.deep), f = 0.29;
    for (const i of [13, 51]) K.put(ball(u(4), 14, 8).scale(1, 0.6, 0.8), deep, X(i, W), u(2.4), 0.05);
    K.put(rbox(u(52), u(50), 0.66, 0.05), body, 0, u(29), -0.04);
    head(K, L, body, W, 32, 54, 26, 16, -0.04, 0.33, { ...G.WARD, cut: 0, bk: 0.75 });
    // two doors, the grin split across them, that swing open on whatever's haunting it
    for (const [i0, i1, a0, a1, knob, side] of [[9, 31.6, -0.5, 0, 29, 1], [32.4, 55, 0, 0.5, 35, -1]]) {
      const door = K.door([X(side > 0 ? i0 : i1, W), f], side);
      door(rbox(u(i1 - i0), u(43), 0.035, 0.012), lite, X((i0 + i1) / 2, W), u(28.5), f + 0.0175);
      door(bend(grinGeo(L, G.WARD_GRIN, 32, 36, a0, a1), null, 0.004), white, X(32, W), u(36), f + 0.035);
      door(ball(u(1.3), 10, 8), deep, X(knob, W), u(22), f + 0.04);
    }
    K.inside = { x: 0, y: u(28.5), w: u(45), h: u(42), z: f + 0.002 };
  },

  gengdresser(K, s, W, D, L) {
    const { rbox, ball } = L, body = K.gloss(C.body);
    cones(K, L, G.DRESSER_CONES, W, -0.2, body);
    for (const i of [8.5, 55.5]) K.put(ball(u(3.5), 12, 8).scale(1, 0.63, 0.8), K.gloss(C.deep), X(i, W), u(2.2), 0.05);
    K.put(rbox(u(58), u(29), 0.62, 0.05), body, 0, u(17.5), 0);
    for (const j of [5, 14, 23]) K.put(rbox(u(52), u(7), 0.03, 0.01), K.gloss(C.lite), 0, u(j + 3.5), 0.325);
    face(K, L, G.DRESSER_FACE, W, 32, 20, 0.34, null);
    for (const i of [24, 40]) K.put(ball(u(1.3), 10, 8), K.gloss(C.deep), X(i, W), u(8.5), 0.345);
  },

  gengshelf(K, s, W, D, L) {
    const { rbox, ball } = L, body = K.gloss(C.body);
    head(K, L, body, W, 16, 60, 15, 12, -0.02, 0.2, { ...G.SHELF, cut: 2 });
    for (const i of [3.5, 28.5]) K.put(rbox(u(3), u(58), 0.5, 0.012), body, X(i), u(29), 0);
    K.put(rbox(u(22), u(53), 0.03, 0.006), K.gloss(C.deep), 0, u(29.5), -0.235);
    for (const j of [0, 18.75, 35.75, 55.5]) K.put(rbox(u(28), u(2.5), 0.5, 0.01), body, 0, u(j + 1.25), 0);
    for (const [i, j, w, h, c] of G.BOOKS) K.put(rbox(u(w), u(h), 0.34, 0.002), K.gloss(c), X(i + w / 2), u(j + h / 2), -0.04);
    const [bi, bj, br] = G.BALL_AT;
    K.put(ball(u(br), 16, 12), K.gloss(C.shade), X(bi), u(bj), 0);
    K.put(ball(u(2), 10, 8), K.glow(C.ball), X(bi - 1), u(bj + 1), u(br) - 0.035);
  },

  genglamp(K, s, W, D, L) {
    const { ball, cyl, torus } = L;
    head(K, L, K.gloss(C.body), W, 16, 11, 13, 11, 0, 0.3, G.LAMP);
    K.put(cyl(u(1), u(12), u(1), 12), K.gloss(C.deep), 0, u(25), 0);
    // the Shadow Ball: a glowing core in a dark shell, a dark swirl round it
    K.put(ball(u(7.5), 20, 14), K.glow(C.ball), 0, u(40), 0);
    K.put(ball(u(10), 24, 16), K.M('glass', '#4a2a70', { key: 'shadowball' }), 0, u(40), 0);
    K.put(torus(u(8.8), u(0.8), Math.PI * 2, 32).rotateX(1.25).rotateZ(0.4), K.gloss(C.shade), 0, u(40), 0);
  },

  gengclock(K, s, W, D, L) {
    const { cyl, rbox, ball } = L, deep = K.gloss(C.deep), z = 0.12;
    head(K, L, K.gloss(C.body), W, 16, 60, 13, 13, z, 0.12, { ...G.CLOCK, wall: true });
    const dy = u(54.5);
    K.put(cyl(u(6.4), 0.07, u(6.4), 28).rotateX(Math.PI / 2), K.gloss(C.pale), X(16), dy, 0.2);
    K.put(cyl(u(6), 0.004, u(6), 28).rotateX(Math.PI / 2), K.gloss(C.white), X(16), dy, 0.237);
    for (let n = 0; n < 12; n++) { const a = n * Math.PI / 6; K.put(ball(u(n % 3 ? 0.35 : 0.6), 8, 6), deep, X(16 + Math.sin(a) * 4.8), dy + u(Math.cos(a) * 4.8), 0.24); }
    for (const [dx, dyy] of [[0, 4], [2.6, -1.5]]) {
      const len = Math.hypot(dx, dyy), hand = rbox(u(0.9), u(len), 0.004, 0.002);
      K.put(hand.translate(0, u(len) / 2, 0).rotateZ(-Math.atan2(dx, dyy)), deep, X(16), dy, 0.242);
    }
    K.put(cyl(u(0.8), 0.01, u(0.8), 12).rotateX(Math.PI / 2), K.gloss(C.red), X(16), dy, 0.246);
  },

  gengtv(K, s, W, D, L) {
    const { rbox, ball } = L, body = K.gloss(C.body), f = 0.23;
    for (const i of [18, 46]) K.put(ball(u(5), 14, 8).scale(1, 0.52, 0.7), K.gloss(C.deep), X(i, W), u(2.6), 0.02);
    cones(K, L, G.TV_CONES, W, -0.04, body);
    K.put(rbox(u(56), u(44), 0.5, u(4)), body, 0, u(25), -0.02);
    // the screen set in a white bezel of teeth, Gengar's eyes over it
    K.put(rbox(u(48), u(30), 0.03, 0.02), K.gloss(C.white), 0, u(23), f + 0.005);
    const tooth = K.gloss(L.tone(C.pale, 0.8));
    for (let i = 14; i < 52; i += 6) for (const j of [36.5, 12.5]) K.put(rbox(u(0.7), u(3), 0.004, 0.001), tooth, X(i + 0.35, W), u(j), f + 0.021);
    K.put(rbox(u(42), u(24), 0.01, 0.004), K.gloss(C.screen), 0, u(23), f + 0.024);
    face(K, L, G.TV_FACE, W, 32, 39.5, f, null);
  },

  gengmirror(K, s, W, D, L) {
    const { ball, THREE } = L, z = -0.04, e = [u(14), u(26), 0.12];
    for (const i of [10, 22]) K.put(ball(u(3.5), 12, 8).scale(1, 0.7, 0.9), K.gloss(C.deep), X(i), u(2.5), 0);
    head(K, L, K.gloss(C.body), W, 16, 30, 14, 26, z, 0.12, G.MIRROR);
    K.put(bend(new THREE.CircleGeometry(1, 28).scale(u(10), u(17.5), 1).translate(0, u(-2), 0), e, 0.003), K.gloss(L.tone(C.body, 0.74)), X(16), u(30), z);
    K.put(bend(new THREE.CircleGeometry(1, 28).scale(u(9.5), u(17), 1).translate(0, u(-2), 0), e, 0.006), K.metal(C.mirror), X(16), u(30), z);
  },

  gengboo(K, s, W, D, L) {
    const { rbox, ball } = L, body = K.gloss(C.body);
    // Gengar behind the board, only its eyes and ears over the top, its fingers hooked on the edge
    head(K, L, body, W, 32, 62, 15, 13, 0.08, 0.08, { ...G.BOO, wall: true, cut: 0 });
    K.put(rbox(u(52), u(24), 0.06, 0.02), K.wood(C.wood), 0, u(50), 0.17);
    paintPlane(K, L, W, 8, 40, 56, 60, 0.2015, 96);
    for (const i of [17, 47]) for (const d of [-2.4, 0, 2.4]) K.put(ball(u(1.6), 10, 8).scale(1, 1.25, 1), body, X(i + d, W), u(61.5), 0.2);
  },

  gengportrait(K, s, W, D, L) {
    const { rbox } = L, frame = K.gloss(C.wood);
    cones(K, L, G.PORTRAIT_CONES, W, 0.06, K.gloss(C.body));
    for (const [i, j, w, h] of [[16, 80.5, 26, 3], [16, 41.5, 26, 3], [4.5, 61, 3, 36], [27.5, 61, 3, 36]]) K.put(rbox(u(w), u(h), 0.06, 0.012), frame, X(i), u(j), 0.03);
    paintPlane(K, L, W, 6, 43, 26, 79, 0.012, 96);
  },

  gengcandles(K, s, W, D, L) {
    const { cyl, rbox, ball } = L, deep = K.gloss(C.deep), body = K.gloss(C.body);
    K.put(cyl(u(8), u(3), u(8), 20), deep, 0, u(1.5), 0);
    for (const sg of [-1, 1]) K.put(tube(L, [[X(16 + sg * 8), u(13), 0], [X(16 + sg * 11.75), u(16.5), 0], [X(16 + sg * 13), u(23), 0]], u(2.1), 12), body);
    K.put(cyl(u(1.4), u(6), u(1.4), 10), deep, 0, u(23), 0);
    head(K, L, body, W, 16, 12, 10, 9, 0, 0.26, G.CANDLES);
    for (const [i, j, h] of G.CANDLE_AT) {
      K.put(rbox(u(5), u(2), u(5), 0.01), deep, X(i), u(j - 1), 0);
      K.put(cyl(u(1.9), u(h), u(1.9), 12), K.gloss(C.pale), X(i), u(j + h / 2), 0);
      K.put(ball(u(2.2), 10, 8).scale(1, 3.4 / 2.2, 1), K.glow(C.flame), X(i), u(j + h + 2.6), 0);
    }
  },

  gengtower(K, s, W, D, L) {
    const { rbox, cyl } = L, T = K.gloss(C.tower), deep = K.gloss(C.deep), ink = K.plain(C.ink), lit = K.glow('#f8d870'), r2 = Math.SQRT2;
    // three tiers under stepped roofs and a spire: Lavender Town's tower
    for (const [j, w] of [[0, 24], [28, 18], [50, 12]]) K.put(rbox(u(w), u(w), u(w), 0.01), T, 0, u(j + w / 2), 0);
    for (const [j, h, b0, b1] of [[24, 4, 14, 11], [46, 4, 11, 8], [62, 14, 8, 0.02]]) K.put(cyl(u(b1 * r2), u(h), u(b0 * r2), 4).rotateY(Math.PI / 4), deep, 0, u(j + h / 2), 0);
    K.put(rbox(u(6), u(9), 0.01, 0.004), ink, 0, u(4.5), u(12) + 0.005);
    for (const i of [8.5, 23.5]) K.put(rbox(u(3), u(5), 0.01, 0.004), lit, X(i), u(15.5), u(12) + 0.005);
    K.put(rbox(u(4), u(5), 0.01, 0.004), lit, 0, u(55.5), u(6) + 0.005);
    // the big window, Gengar's eyes and grin in the dark of it
    K.put(rbox(u(10), u(12), 0.01, 0.004), ink, 0, u(37), u(9) + 0.005);
    face(K, L, G.TOWER_FACE, W, 16, 37, u(9) + 0.008, null);
  },

  gengpouf(K, s, W, D, L) {
    head(K, L, K.cloth(C.body), W, 16, 9, 14, 9, 0, 0.42, G.POUF);
  },

  gengchest(K, s, W, D, L) {
    const { rbox, ball } = L, body = K.gloss(C.body);
    for (const i of [15, 49]) K.put(ball(u(4), 12, 8).scale(1, 0.5, 0.8), K.gloss(C.deep), X(i, W), u(2), 0.05);
    K.put(rbox(u(52), u(18), 0.72, 0.05), body, 0, u(11), 0);
    K.put(rbox(u(50.4), u(0.8), 0.73, 0.002), K.gloss(L.tone(C.body, 0.45)), 0, u(20), 0);
    head(K, L, body, W, 32, 20, 26, 13, 0, 0.36, { ...G.CHEST, cut: 0 });
    face(K, L, { eyes: [], grin: G.CHEST_GRIN }, W, 32, 15, 0.36, null);
  },

  gengjack(K, s, W, D, L) {
    const { rbox, ball, THREE } = L, lite = K.gloss(C.lite), steel = K.metal('#c8c8d8');
    K.put(rbox(u(22), u(20), 0.04, 0.02), lite, 0, u(30), -0.33);
    // the spring, four turns, and Gengar on top of it
    const coil = [];
    for (let k = 0; k <= 32; k++) { const t = k / 32 * Math.PI * 8; coil.push([Math.sin(t) * u(3.6), u(20.6 + k / 32 * 9), Math.cos(t) * u(3.6)]); }
    K.put(tube(L, coil, u(0.7), 72), steel);
    head(K, L, K.gloss(C.body), W, 16, 39, 11, 10, 0, 0.3, G.JACK);
    K.put(rbox(u(22), u(20), 0.68, 0.02), lite, 0, u(10), 0);
    K.put(rbox(u(18), u(16), 0.01, 0.004), K.gloss(C.body), 0, u(10), 0.343);
    K.put(new THREE.CircleGeometry(u(5), 4), lite, 0, u(10), 0.35);
    K.put(rbox(u(3), u(2), u(2), 0.005), steel, X(28.5), u(11), 0);
    K.put(rbox(u(1.5), u(4), u(1.5), 0.005), steel, X(29.75), u(13), 0.03);
    K.put(ball(u(1.6), 10, 8), K.gloss(C.red), X(30), u(15), 0.03);
  },

  gengsidetable(K, s, W, D, L) {
    head(K, L, K.gloss(C.body), W, 16, 9.5, 11, 9.5, 0, 0.3, G.SIDE);
    K.put(L.cyl(u(14), u(3), u(14), 28), K.wood(C.wood), 0, u(22.5), 0);
  },

  gengcauldron(K, s, W, D, L) {
    const { cyl, ball } = L, body = K.gloss(C.body), ink = K.gloss(C.ink);
    for (const [i, z] of [[7.5, 0.12], [24.5, 0.12], [16, -0.24]]) K.put(cyl(u(1.5), u(4), u(1.5), 10), ink, X(i), u(2), z);
    const rr = ellPot(K, L, body, K.gloss(C.deep), 12, 14, 10, 19);
    K.put(cyl(u(rr - 1), u(0.5), u(rr - 1), 24), K.gloss(C.brew), 0, u(18.6), 0);
    for (const [[i, j, r], z] of G.BUBBLES.map((b, n) => [b, [0.04, -0.05, 0.02][n]])) K.put(ball(u(r), 12, 8), K.gloss(L.tone(C.brew, 1.2)), X(i), u(j), z);
    cones(K, L, G.CAULDRON_CONES, W, 0, body, 0.6, -0.24);
    face(K, L, G.CAULDRON_FACE, W, 16, 12, 0, [u(14), u(10), u(14)]);
  },

  genggrave(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, stone = K.gloss(C.stone), body = K.gloss(C.body);
    head(K, L, body, W, 16, 38, 12, 10, -0.17, 0.12, { ...G.GRAVE, cut: 0 });
    K.put(rbox(u(26), u(4), 0.4, 0.01), K.gloss(L.tone(C.stone, 0.8)), 0, u(2), 0);
    K.put(rbox(u(20), u(24), 0.22, 0.01), stone, 0, u(16), 0);
    K.put(cyl(u(10), 0.22, u(10), 28).rotateX(Math.PI / 2), stone, 0, u(28), 0);
    paintPlane(K, L, W, 8, 13, 24, 21, 0.112);
    for (const [i, j] of graveFingers()) K.put(ball(u(1.6), 10, 8).scale(1, 1.25, 1.4), body, X(i), u(j), 0.03);
  },

  gengplanter(K, s, W, D, L) {
    const { ball, cyl } = L, body = K.gloss(C.body), leaf = K.gloss(C.leaf);
    for (const [a, len] of LEAVES) K.put(ball(1, 14, 10).scale(u(3.4), u(len / 2), u(1.2)).rotateZ(-a), leaf, X(16 + Math.sin(a) * len / 2), u(17 + Math.cos(a) * len / 2), 0);
    cones(K, L, G.PLANTER_CONES, W, 0, body);
    const rr = ellPot(K, L, body, K.gloss(L.tone(C.body, 0.74)), 10, 12, 10, 17);
    K.put(cyl(u(rr - 1), u(0.6), u(rr - 1), 20), K.plain('#3a2a24'), 0, u(16.8), 0);
    face(K, L, faceSpec(16, 9, 8), W, 16, 10, 0, [u(12), u(10), u(12)]);
  },
};
