/* base-models-eevee.js  -  the Eevee room's models (furniture expansion session a, 2026-10-17), built from parts like the
   arcade cabinets (js/base-models-f.js's head says how a batch works) and following their paintings
   (js/base-furniture-eevee.js) unit for unit: `u(n)` is n of a tile's 32 painted units, `X(n, W)` a painted unit across as
   x from the middle, heights painted up from the floor. Eevee's parts are shared: `head()` (a round brown head, its eyes,
   nose and smile, its ears), `ear()` (lathed from the painting's ear outline, flattened, its dark inside laid on its
   front), tufts of cream fluff as little balls, and `tail()`, a tube along the painting's own path that swells and
   tapers as it does, its cream tip a part of its own. Each piece is in Eevee's own colours, so none reads the theme's
   palette. Wall pieces use js/base-models-w.js's frame (back at z 0, heights from the strip's top). */

import { EV, STONES, EAR, INNER, HEAD_EAR, FACE, around, tailPath, TAILS, BELL, PUFFS } from './base-furniture-eevee.js';
import { Y as WY, ring as wallRing, round as wallRound, frame as wallFrame } from './base-models-w.js';

const u = (n) => n / 32;
const X = (n, W = 1) => n / 32 - W / 2;
const TAU = Math.PI * 2;

/** How round the painting's cushion() makes a w x h box's corners, painted units. */
const rr = (w, h, r) => Math.min(Math.max(r * 1.8, Math.min(w, h) * 0.42), w / 2, h / 2);
/** A painted cushion as a rounded box `d` tiles deep (deep enough for its corners, or they'd come out squarer). */
const cush = (L, w, h, d, r) => L.rbox(u(w), u(h), Math.max(d, u(rr(w, h, r)) * 2 + 0.002), u(rr(w, h, r)), 2);
/** A drum with fully rounded edges (a pouf, a pad), `R` round and `h` tall in painted units, its foot at 0. */
const puck = (L, R, h) => {
  const e = h / 2, pts = [[0, 0], [R - e, 0]];
  for (let i = 1; i < 8; i++) { const a = -Math.PI / 2 + i / 8 * Math.PI; pts.push([R - e + Math.cos(a) * e, e + Math.sin(a) * e]); }
  pts.push([R - e, h], [0, h]);
  return L.lathe(pts.map(([r, y]) => [u(r), u(y)]), 32);
};
/** A front-facing oval disc (a dial, a door), `rx` x `ry` painted units, `d` tiles thick. */
const plate = (L, rx, ry, d) => L.cyl(1, d, 1, 32).rotateX(Math.PI / 2).scale(u(rx), u(ry), 1);
/** An ellipsoid the painting's ovalShade(rx, ry) is the front of, `dz` tiles deep each way. */
const egg = (L, rx, ry, dz, seg = 16) => L.ball(1, seg, Math.max(8, seg * 0.6 | 0)).scale(u(rx), u(ry), dz);

/** The materials every piece shares. */
const mats = (K) => ({
  brown: K.cloth(EV.brown), cream: K.cloth(EV.cream), dark: K.cloth(EV.dark), inner: K.cloth(EV.ear),
  ink: K.gloss(EV.ink), white: K.gloss(EV.white), wood: K.wood(EV.brown), honey: K.wood(EV.honey), glaze: K.gloss(EV.cream),
});

/** One of Eevee's ears (tiles): its base's middle at x, y, z, `len` long, `rb` half as wide at the base, leaning out by a. */
function ear(K, L, m, x, y, z, len, rb, a) {
  const prof = (k, l) => EAR.map(([r, h]) => [r * rb * k, h * len * l]);
  K.put(L.lathe(prof(1, 1), 12).scale(1, 1, 0.42), m.brown, x, y, z, 0, 0, -a);
  const s = INNER.at * len;
  K.put(L.lathe(prof(INNER.rb, INNER.len), 12).scale(1, 1, 0.15), m.inner, x + Math.sin(a) * s, y + Math.cos(a) * s, z + rb * 0.38, 0, 0, -a);
}
/** A pair of ears at x ± dx (painted units, as the painting's `ears()`), their bases at height h. */
function ears(K, L, m, cx, h, z, dx, len, rb, a, W = 1) {
  for (const s of [-1, 1]) ear(K, L, m, X(cx + s * dx, W), h, z, u(len), u(rb), s * a);
}
/** Eevee's head (tiles): radius r round x, y, z, `dz` as deep as it's high; its eyes, nose and smile on its front, its ears. */
function head(K, L, m, x, y, z, r, dz = 0.9) {
  const F = FACE, E = HEAD_EAR;
  K.put(L.ball(r, 20, 12).scale(1.12, 1, dz), m.brown, x, y, z);
  const front = (dx, dy) => z + dz * r * Math.sqrt(Math.max(0, 1 - (dx / (1.12 * r)) ** 2 - (dy / r) ** 2));
  for (const s of [-1, 1]) {
    const ex = s * F.ex * r, ey = F.ey * r;
    K.put(L.ball(r * 0.2, 10, 6).scale(F.erx / 0.2, F.ery / 0.2, 0.3), m.ink, x + ex, y + ey, front(ex, ey) - r * 0.02);
    K.put(L.ball(r * 0.065, 8, 6), m.white, x + ex - 0.05 * r, y + ey + 0.08 * r, front(ex, ey) + r * 0.035);
  }
  K.put(L.ball(r * 0.075, 8, 6).scale(1, 0.7, 0.6), m.ink, x, y + F.ny * r, front(0, F.ny * r));
  for (const s of [-1, 1]) K.put(L.torus(F.sw * r, Math.max(0.003, r * 0.02), Math.PI, 8), m.ink, x + s * F.sw * r, y + F.sy * r, front(s * F.sw * r, F.sy * r) - 0.002, 0, 0, Math.PI);
  for (const s of [-1, 1]) ear(K, L, m, x + s * E.dx * r, y + E.dy * r, z, E.len * r, E.rb * r, s * E.a);
}
/** Tufts of fluff, radius rt painted units, at [dx, dh] round (cx, ch), z each (a number, or a function of the point). */
function tufts(K, L, mat, cx, ch, pts, rt, z, W = 1) {
  for (const [dx, dh] of pts) K.put(L.ball(u(rt), 10, 6), mat, X(cx + dx, W), u(ch + dh), typeof z === 'function' ? z(dx, dh) : z);
}
/** A ring of n tufts round a round thing, radius R, at height h (painted units). */
function tuftRing(K, L, mat, R, h, n, rt) {
  for (let i = 0; i < n; i++) { const a = i / n * TAU; K.put(L.ball(u(rt), 10, 6), mat, Math.cos(a) * u(R), u(h), Math.sin(a) * u(R)); }
}
/** A row of n tufts from x0 every `step`, at height h. */
function tuftRow(K, L, mat, x0, h, n, step, rt, z, W = 1) {
  for (let i = 0; i < n; i++) K.put(L.ball(u(rt), 10, 6), mat, X(x0 + i * step, W), u(h), z);
}
/** A paw: a squashed dark ball at painted x, its foot at the floor. */
const paw = (K, L, m, px, z, W = 1) => K.put(L.ball(u(4), 10, 6).scale(1, 0.55, 1.2), m.dark, X(px, W), u(2.2), z);

/** A tube along points [x, y, z, r] (tiles) in the x-y plane, `radial` sides round, its radius following each point's. */
function tubeAlong(L, pts, radial = 10) {
  const { THREE } = L, pos = [], idx = [];
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1];
    const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    for (let j = 0; j <= radial; j++) {
      const f = j / radial * TAU, c = Math.cos(f), s = Math.sin(f);
      pos.push(p[0] - ty * c * p[3], p[1] + tx * c * p[3], p[2] + s * p[3]);
    }
  });
  for (let i = 0; i < pts.length - 1; i++) for (let j = 0; j < radial; j++) {
    const a = i * (radial + 1) + j, b = a + radial + 1;
    idx.push(a, a + 1, b, b, a + 1, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return L.weld(g);
}
/** A bushy tail along TAILS[name] at depth z, its cream tip in `tipMat`. */
function tail(K, L, m, name, W, z, tipMat = m.cream) {
  const T = TAILS[name], pts = tailPath(T.ctrl).map(([x, h, t]) => [X(x, W), u(h), z, u(T.r(t)), t]);
  K.put(tubeAlong(L, pts.filter(p => p[4] <= T.tip + 0.03)), m.brown);
  K.put(tubeAlong(L, pts.filter(p => p[4] >= T.tip - 0.01)), tipMat);
}

export const SHAPES = {
  eeveebed: { make: 'eeveebed', seat: 0.86 },
  eeveechair: { make: 'eeveechair', seat: 0.74 },
  eeveearmchair: { make: 'eeveearmchair', seat: 0.62 },
  eeveesofa: { make: 'eeveesofa', seat: 0.69 },
  eeveepouf: { make: 'eeveepouf', seat: 0.62 },
  eeveetable: { make: 'eeveetable', top: 0.44 },
  eeveedesk: { make: 'eeveedesk', top: 0.78 },
  eeveenightstand: { make: 'eeveenightstand', top: 0.69 },
  eeveedresser: { make: 'eeveedresser', top: 1.16 },
  eeveewardrobe: { make: 'eeveewardrobe', play: { does: 'door', inside: 'clothes', double: true } },
  eeveeshelf: { make: 'eeveeshelf' },
  eeveelamp: { make: 'eeveelamp', play: { does: 'light' } },
  eeveeclock: { make: 'eeveeclock' },
  eeveemirror: { make: 'eeveemirror' },
  eeveeposter: { make: 'eeveeposter' },
  eeveetv: { make: 'eeveetv', screen: { x: 0, y: u(31), w: u(46), h: u(26), z: 0.138 }, play: { does: 'screen', show: ['cartoon', 'battle', 'quiz', 'weather', 'news', 'bars'] } },
  eeveehouse: { make: 'eeveehouse' },
  eeveetower: { make: 'eeveetower', seat: 1.55 },
  eeveebowl: { make: 'eeveebowl' },
  eeveebell: { make: 'eeveebell', play: { does: 'beat', hits: ['fx-ding'], swing: true } },
  eeveepuffs: { make: 'eeveepuffs' },
  eeveetoybox: { make: 'eeveetoybox', play: { does: 'treasure' } },
  eeveebeanbag: { make: 'eeveebeanbag', seat: 0.62 },
};

export const MAKES = {
  eeveebed(K, s, W, D, L) {
    const m = mats(K), { rbox } = L;
    // the headboard: Eevee's collar of fluff, its head in front of it
    K.put(egg(L, 27, 12, 0.1), m.cream, 0, u(40), -0.86);
    tufts(K, L, m.cream, 32, 40, around(27, 12, 12), 4.5, -0.84, W);
    head(K, L, m, 0, u(56), -0.68, u(17), 0.5);
    // the frame under it all, the pillow, the collar folded back along the quilt's head, the quilt
    K.put(rbox(u(60), u(11), 1.5, 0.03), m.wood, 0, u(6.5), -0.2);
    K.put(cush(L, 40, 10, 0.4, 4), K.cloth(EV.pillow), 0, u(29), -0.55);
    tuftRow(K, L, m.cream, 6, 27, 9, 6.5, 4, -0.42, W);
    K.put(cush(L, 62, 15, 1.0, 4), m.brown, 0, u(19.5), 0.05);
    // the footboard, a roll of fluff, two paws under each end
    K.put(cush(L, 62, 15, 0.48, 6), m.cream, 0, u(8.5), 0.74);
    tuftRow(K, L, m.cream, 4, 16, 8, 8, 4, 0.74, W);
    for (const z of [0.84, -0.84]) for (const px of [7, 57]) paw(K, L, m, px, z, W);
  },

  eeveechair(K, s, W, D, L) {
    const m = mats(K), { cyl } = L;
    for (const lx of [7, 25]) for (const z of [-0.24, 0.24]) K.put(cyl(u(2), u(15), u(2), 12), m.dark, X(lx), u(7.5), z);
    K.put(cush(L, 26, 6, 0.72, 2), m.brown, 0, u(17), 0.02);
    K.put(cush(L, 24, 5, 0.66, 2), m.cream, 0, u(21.5), 0.04);
    K.put(egg(L, 11, 6, 0.12), m.cream, 0, u(29), -0.24);
    tufts(K, L, m.cream, 16, 29, around(11, 6, 8), 3, -0.24);
    head(K, L, m, 0, u(40), -0.22, u(11), 0.6);
  },

  eeveearmchair(K, s, W, D, L) {
    const m = mats(K);
    ears(K, L, m, 16, u(42), -0.26, 7, 19, 5.5, 0.42);
    K.put(egg(L, 13, 13, 0.14), m.cream, 0, u(32), -0.26);
    tufts(K, L, m.cream, 16, 32, around(12.4, 12.4, 9, 0, Math.PI), 3.6, -0.26);
    K.put(cush(L, 26, 10, 0.72, 3), m.brown, 0, u(7), 0.02);
    for (const px of [7, 25]) paw(K, L, m, px, 0.28, 1);
    K.put(cush(L, 20, 8, 0.56, 3), m.brown, 0, u(16), 0.08);
    for (const px of [4, 28]) K.put(cush(L, 8, 22, 0.74, 3), m.cream, X(px), u(17), 0.02);
  },

  eeveesofa(K, s, W, D, L) {
    const m = mats(K);
    tail(K, L, m, 'sofa', W, -0.2);
    for (const z of [-0.3, 0.3]) for (const px of [7, 57]) paw(K, L, m, px, z, W);
    K.put(cush(L, 60, 13, 0.76, 4), m.brown, 0, u(9.5), 0.04);
    for (const px of [20.5, 43.5]) K.put(cush(L, 23, 8, 0.6, 3), m.cream, X(px, W), u(18), 0.1);
    K.put(cush(L, 10, 25, 0.8, 4), m.brown, X(5, W), u(15.5), 0.02);
    K.put(cush(L, 10, 25, 0.8, 4), m.cream, X(59, W), u(15.5), 0.02);
  },

  eeveepouf(K, s, W, D, L) {
    const m = mats(K);
    K.put(puck(L, 13, 16), m.cream);
    tuftRing(K, L, m.cream, 13, 8, 12, 3.2);
    K.put(puck(L, 11, 6), m.brown, 0, u(14), 0);
  },

  eeveetable(K, s, W, D, L) {
    const m = mats(K), { cyl, rbox } = L;
    for (const lx of [10.5, 53.5]) for (const z of [-0.26, 0.26]) {
      K.put(cyl(u(2.5), u(9), u(2.5), 14), m.brown, X(lx, W), u(7.5), z);
      paw(K, L, m, lx, z + 0.03, W);
    }
    K.put(rbox(u(62), u(4), 0.8, 0.012), m.honey, 0, u(12), 0);
    for (const z of [0.36, -0.36]) tuftRow(K, L, m.cream, 5, 10, 10, 6, 3, z, W);
    for (const px of [5, 59]) for (const z of [-0.18, 0, 0.18]) K.put(L.ball(u(3), 10, 6), m.cream, X(px, W), u(10), z);
  },

  eeveedesk(K, s, W, D, L) {
    const m = mats(K), { cyl, rbox, ball } = L;
    ear(K, L, m, X(10, W), u(28), -0.34, u(24), u(6.5), -0.35);
    ear(K, L, m, X(54, W), u(28), -0.34, u(24), u(6.5), 0.35);
    K.put(cush(L, 56, 7, 0.22, 3), m.cream, 0, u(27.5), -0.34);
    tuftRow(K, L, m.cream, 8, 31, 9, 6, 3, -0.34, W);
    K.put(rbox(u(22), u(22), 0.8, 0.02), m.wood, X(51, W), u(11), 0);
    for (const dy of [20, 11]) {
      K.put(rbox(u(17), u(7), 0.03, 0.008), m.glaze, X(51, W), u(dy - 4), 0.41);
      K.put(ball(u(1.8), 10, 8).scale(1, 0.72, 0.6), m.dark, X(51, W), u(dy - 4), 0.43);
    }
    for (const z of [-0.32, 0.32]) { K.put(cyl(u(2.5), u(19), u(2.5), 14), m.wood, X(6.5, W), u(11.5), z); paw(K, L, m, 6.5, z, W); }
    K.put(rbox(u(64), u(4), 0.86, 0.012), m.honey, 0, u(23), 0);
  },

  eeveenightstand(K, s, W, D, L) {
    const m = mats(K), { THREE, cyl, ball } = L;
    ear(K, L, m, X(9), u(21), -0.3, u(10), u(3.2), -0.35);
    ear(K, L, m, X(23), u(21), -0.3, u(10), u(3.2), 0.35);
    for (const [px, z] of [[9, 0.18], [23, 0.18], [16, -0.25]]) paw(K, L, m, px, z, 1);
    K.put(cyl(u(12), u(17), u(12), 24), m.wood, 0, u(10.5), 0);
    K.put(new THREE.CylinderGeometry(u(12.3), u(12.3), u(7), 12, 1, false, -0.62, 1.24), m.glaze, 0, u(12.5), 0);
    K.put(ball(u(1.6), 10, 8).scale(1, 0.75, 0.6), m.dark, 0, u(12.5), u(12.4));
    K.put(puck(L, 14, 3), m.cream, 0, u(19), 0);
    tuftRing(K, L, m.cream, 14, 19, 12, 2.6);
  },

  eeveedresser(K, s, W, D, L) {
    const m = mats(K), { rbox, ball } = L;
    ear(K, L, m, X(7, W), u(36), -0.3, u(12), u(4), -0.3);
    ear(K, L, m, X(57, W), u(36), -0.3, u(12), u(4), 0.3);
    K.put(rbox(u(60), u(28), 0.7, 0.02), m.wood, 0, u(20), 0);
    for (const h of [26.5, 13.5]) for (const px of [18, 46]) {
      K.put(rbox(u(24), u(9), 0.03, 0.01), m.glaze, X(px, W), u(h), 0.36);
      K.put(ball(u(2), 10, 8).scale(1, 0.75, 0.6), m.dark, X(px, W), u(h), 0.38);
    }
    K.put(rbox(u(64), u(3.5), 0.76, 0.012), m.honey, 0, u(35.25), 0);
    for (const z of [0.33, -0.33]) tuftRow(K, L, m.cream, 4, 6, 9, 7, 3.5, z, W);
    for (const z of [-0.25, 0.25]) for (const px of [8, 56]) paw(K, L, m, px, z, W);
  },

  eeveewardrobe(K, s, W, D, L) {
    const m = mats(K), { rbox, ball } = L, front = 0.25;
    ear(K, L, m, X(14, W), u(76), -0.05, u(16), u(5.5), -0.3);
    ear(K, L, m, X(50, W), u(76), -0.05, u(16), u(5.5), 0.3);
    K.put(rbox(u(60), u(72), 0.62, 0.02), m.wood, 0, u(40), -0.06);
    K.put(cush(L, 62, 6, 0.7, 3), m.cream, 0, u(77), -0.04);
    tuftRow(K, L, m.cream, 4, 80, 9, 7, 3, 0.2, W);
    for (const z of [-0.2, 0.2]) for (const px of [8, 56]) paw(K, L, m, px, z, W);
    // two doors, each with its half of the collar across it and a cream knob by the middle
    for (const [x0, x1, side] of [[5, 31, 1], [33, 59, -1]]) {
      const door = K.door([X(side > 0 ? x0 : x1, W), front + 0.005], side);
      door(rbox(u(26), u(64), 0.04, 0.01), m.wood, X((x0 + x1) / 2, W), u(40), front + 0.025);
      door(ball(u(1.8), 10, 8).scale(0.9, 1.33, 0.6), m.glaze, X(side > 0 ? 29.5 : 34.5, W), u(36), front + 0.05);
      for (let i = 0; i < 9; i++) {
        const tx = 4 + i * 7;
        if ((tx < 32) === side > 0) door(ball(u(3.6), 10, 6), m.cream, X(tx, W), u(44), front + 0.06);
      }
    }
    K.inside = { x: 0, y: u(40), w: u(54), h: u(62), z: front - 0.004 };
  },

  eeveeshelf(K, s, W, D, L) {
    const m = mats(K), { rbox, ball } = L, creamWood = K.wood(EV.cream);
    ears(K, L, m, 16, u(64), -0.12, 7, 19, 5, 0.35);
    for (const px of [3.5, 28.5]) K.put(rbox(u(3), u(64), 0.5, 0.01), m.wood, X(px), u(32), 0);
    K.put(rbox(u(22), u(62), 0.02, 0.004), K.plain(EV.back), 0, u(32), -0.23);
    K.put(rbox(u(28), u(4), 0.5, 0.01), m.wood, 0, u(2), 0);
    [4, 18, 32, 46].forEach((h, r) => {
      K.put(rbox(u(24), u(2.5), 0.46, 0.006), creamWood, 0, u(h + 1.25), 0);
      for (let c = 0; c < 2; c++) K.put(ball(u(4), 6, 4).scale(0.85, 1.125, 0.7), K.gloss(STONES[r * 2 + c][0]), X(11 + c * 10), u(h + 2.5 + 4.5), 0.02, 0.3 * c);
    });
    K.put(cush(L, 30, 6, 0.56, 3), m.cream, 0, u(65), 0);
    tuftRow(K, L, m.cream, 4, 68, 6, 4.8, 2.6, 0.18);
  },

  eeveelamp(K, s, W, D, L) {
    const m = mats(K);
    K.put(L.lathe([[u(10), 0], [u(10), u(2)], [u(8), u(4.5)], [0, u(5)]], 28), m.dark);
    tail(K, L, m, 'lamp', W, 0, K.glow(EV.lamp));
  },

  eeveeclock(K, s, W, D, L) {
    const m = mats(K), { rbox, ball } = L, cx = 16, cy = 54, wx = X(cx);
    K.put(plate(L, 12.5, 12.5, 0.05), m.cream, wx, WY(cy), 0.025);
    for (const [dx, dh] of around(12.5, 12.5, 12)) K.put(ball(u(3.2), 10, 6), m.cream, X(cx + dx), WY(cy - dh), 0.1);
    K.put(plate(L, 9, 9, 0.02), K.plain(EV.white), wx, WY(cy), 0.06);
    for (let h = 0; h < 12; h += 3) K.put(ball(u(0.8), 6, 4).scale(1, 1, 0.4), m.dark, X(cx + Math.sin(h * Math.PI / 6) * 7), WY(cy - Math.cos(h * Math.PI / 6) * 7), 0.072);
    K.put(rbox(u(1.2), u(6), 0.006, 0.002), m.ink, wx, WY(cy - 3), 0.074);
    K.put(rbox(u(4.5), u(1.2), 0.006, 0.002), m.ink, X(cx + 2.25), WY(cy), 0.076);
    K.put(ball(u(1), 8, 6).scale(1, 1, 0.5), m.brown, wx, WY(cy), 0.08);
    head(K, L, m, wx, WY(33), 0.16, u(10), 0.45);
  },

  eeveemirror(K, s, W, D, L) {
    const m = mats(K), { THREE } = L, cx = 16, cy = 46;
    for (const sx of [-1, 1]) ear(K, L, m, X(cx + sx * 5.5), WY(31), 0.07, u(15), u(5), sx * 0.42);
    wallRing(K, L, m.wood, cx, cy, 11, 8.5, 0.08, 1.5);
    const glass = new THREE.MeshStandardMaterial({ color: EV.glass, roughness: 0.08, metalness: 0.75, emissive: '#5a7488', emissiveIntensity: 0.35 });
    glass.userData.kind = 'plain';
    wallRound(K, L, glass, cx, cy, 8.5, 0.04, 1.5);
    const streak = new THREE.PlaneGeometry(u(1.2), u(11)); streak.rotateZ(-0.38);
    K.put(streak, K.plain(EV.white), X(cx - 3), WY(cy - 3), 0.042);
    for (const [dx, dh] of around(11, 16.5, 7, -Math.PI + 0.35, -0.35)) K.put(L.ball(u(3.4), 10, 6), m.cream, X(cx + dx), WY(cy - dh), 0.11);
  },

  eeveeposter(K, s, W, D, L) {
    wallFrame(K, L, K.wood(EV.honey), [6, 14, 58, 66], [9, 17, 55, 63], 0.06);
  },

  eeveetv(K, s, W, D, L) {
    const m = mats(K), { rbox, ball } = L;
    ear(K, L, m, X(14, W), u(46), -0.06, u(22), u(7), -0.38);
    ear(K, L, m, X(50, W), u(46), -0.06, u(22), u(7), 0.38);
    K.put(egg(L, 16, 7, 0.2), m.cream, 0, u(7), 0);
    tufts(K, L, m.cream, 32, 7, around(16, 7, 9, -0.3, Math.PI + 0.3), 3, 0.04, W);
    K.put(rbox(u(12), u(4), 0.16, 0.01), m.cream, 0, u(12), -0.04);
    K.put(rbox(u(58), u(38), 0.36, u(5.5), 3), K.gloss(EV.brown), 0, u(31), -0.06);
    K.put(rbox(u(48), u(28), 0.02, 0.006), K.gloss(EV.screen), 0, u(31), 0.125);
    K.put(ball(u(1.2), 10, 8), K.gloss('#e85a5a'), X(55, W), u(14.5), 0.12);
  },

  eeveehouse(K, s, W, D, L) {
    const m = mats(K), { rbox, ball } = L, bw = u(30), bd = 0.8, br = u(rr(30, 30, 2));
    ears(K, L, m, 16, u(26), -0.05, 7, 21, 6.5, 0.4);
    K.put(rbox(bw, bw, bd, br, 3), m.brown, 0, u(15), 0);
    // how far forward the body's front is at painted (px, h)
    const front = (px, h) => {
      const dx = Math.max(0, Math.abs(X(px)) - (bw / 2 - br)), dy = Math.max(0, Math.abs(u(h - 15)) - (bw / 2 - br));
      return bd / 2 - br + Math.sqrt(Math.max(0, br * br - dx * dx - dy * dy));
    };
    for (const sx of [-1, 1]) {
      K.put(ball(u(2.2), 12, 8).scale(0.9, 1.27, 0.4), m.ink, X(16 + sx * 6), u(23.5), front(16 + sx * 6, 23.5));
      K.put(ball(u(0.7), 8, 6), m.white, X(16 + sx * 6 - 0.6), u(24.5), front(16 + sx * 6, 23.5) + 0.02);
    }
    K.put(egg(L, 8.5, 7, 0.1), m.cream, 0, u(10.5), front(16, 10.5) - 0.06);
    tufts(K, L, m.cream, 16, 10.5, around(8.5, 7, 10), 2.6, (dx, dh) => front(16 + dx, 10.5 + dh) - 0.01);
    K.put(egg(L, 6, 5.5, 0.03), K.plain('#3a2418'), 0, u(10), front(16, 10) + 0.03);
  },

  eeveetower(K, s, W, D, L) {
    const m = mats(K), { cyl, ball } = L;
    ears(K, L, m, 16, u(46), -0.12, 7, 14, 4.5, 0.35);
    K.put(cush(L, 28, 6, 0.86, 3), m.cream, 0, u(3), 0);
    K.put(cyl(u(3), u(36), u(3), 16), m.wood, 0, u(24), 0);
    for (let h = 9; h < 40; h += 3) K.put(L.torus(u(3), u(0.4), TAU, 16).rotateX(Math.PI / 2), m.dark, 0, u(h), 0);
    K.put(cyl(u(11), u(3), u(11), 28), m.cream, 0, u(27), 0);
    tuftRing(K, L, m.cream, 11, 26, 12, 2.2);
    K.put(cyl(u(0.3), u(10), u(0.3), 6), m.dark, X(6), u(21), 0.05);
    K.put(ball(u(2.5), 12, 8), m.cream, X(6), u(14), 0.05);
    K.put(egg(L, 11, 4.5, u(11)), m.brown, 0, u(44.5), 0);
    K.put(egg(L, 9, 2.5, u(9)), m.cream, 0, u(48.5), 0);
  },

  eeveebowl(K, s, W, D, L) {
    const m = mats(K), { lathe, torus, ball } = L;
    ears(K, L, m, 16, u(8), -0.24, 6, 10, 3.5, 0.4);
    [[-5, 10.5, PUFFS[0], 0.04], [5, 10.5, PUFFS[2], 0.02], [0, 12, PUFFS[3], -0.06]].forEach(([dx, h, c, z]) => K.put(egg(L, 3.4, 2.6, u(3.4)), K.gloss(c), X(16 + dx), u(h), z));
    K.put(lathe([[u(8), 0], [u(9.5), u(4.5)], [u(11), u(9)], [u(10), u(9)], [u(8), u(5)], [0, u(4.5)]], 28), K.gloss(EV.brown));
    K.put(torus(u(10.5), u(1.4), TAU, 28).rotateX(Math.PI / 2), m.glaze, 0, u(9), 0);
    const front = (px, h) => Math.sqrt(Math.max(0, (u(8) + u(1.5) * Math.min(1, h / 4.5)) ** 2 - X(px) ** 2));
    for (const sx of [-1, 1]) K.put(ball(u(1.2), 10, 8).scale(0.83, 1.17, 0.4), m.ink, X(16 + sx * 4), u(5), front(16 + sx * 4, 5) + 0.004);
    K.put(ball(u(0.8), 8, 6).scale(1, 0.7, 0.5), m.ink, 0, u(3.2), front(16, 3.2) + 0.004);
  },

  eeveebell(K, s, W, D, L) {
    const m = mats(K), { cyl, lathe, ball } = L;
    K.put(egg(L, 12, 3, 0.36), m.cream, 0, u(3), 0);
    tufts(K, L, m.cream, 16, 3, around(12, 3, 6, 0, Math.PI), 2.4, 0.1);
    tail(K, L, m, 'bell', W, 0);
    K.put(cyl(u(0.4), u(11), u(0.4), 6), m.ink, X(25), u(51.5), 0);
    K.put(lathe(BELL.map(([r, h]) => [u(r), u(h)]), 24), K.metal(EV.bell), X(25), u(34), 0);
    K.put(ball(u(1.4), 10, 8), K.metal('#b89838'), X(25), u(33.2), 0);
    for (const sx of [-1, 1]) K.put(ball(u(2), 10, 8).scale(1, 0.7, 0.7), K.gloss(EV.bow), X(25 + sx * 2.4), u(46.2), 0);
    K.put(ball(u(1), 8, 6), K.gloss('#d86890'), X(25), u(46.2), 0.02);
  },

  eeveepuffs(K, s, W, D, L) {
    const m = mats(K), { cyl, ball } = L;
    K.put(cyl(u(4), u(2), u(4), 20), m.honey, 0, u(1), 0);
    K.put(cyl(u(1), u(36), u(1), 10), m.honey, 0, u(20), 0);
    const puff = (dx, y, c, z) => {
      K.put(cyl(u(3.5), u(4), u(3.2), 16), K.gloss(c), X(16 + dx), u(y + 2), z);
      for (const [h, rx, ry] of [[4.6, 3.8, 1.8], [6.4, 2.8, 1.6], [7.9, 1.6, 1.2]]) K.put(egg(L, rx, ry, u(rx), 8), m.glaze, X(16 + dx), u(y + h), z);
      K.put(ball(u(1), 6, 4), K.gloss('#e04050'), X(16 + dx), u(y + 9.4), z);
    };
    K.put(cyl(u(13), u(2.4), u(12), 28), m.glaze, 0, u(14), 0);
    [[-8, 0.06], [0, 0.18], [8, 0.06]].forEach(([dx, z], i) => puff(dx, 15.5, PUFFS[i], z));
    K.put(cyl(u(9), u(2.2), u(8.5), 24), m.glaze, 0, u(30), 0);
    [[-4.5, 0.08], [4.5, 0.08]].forEach(([dx, z], i) => puff(dx, 31.5, PUFFS[3 + i], z));
    head(K, L, m, 0, u(42), 0, u(4.5), 0.8);
  },

  eeveetoybox(K, s, W, D, L) {
    const m = mats(K), { rbox, ball } = L;
    ears(K, L, m, 16, u(26), -0.1, 6, 15, 4.5, 0.35);
    for (const z of [-0.22, 0.22]) for (const px of [7, 25]) paw(K, L, m, px, z, 1);
    K.put(rbox(u(26), u(18), 0.6, 0.02), m.wood, 0, u(12), 0);
    K.put(ball(u(3.2), 12, 8).scale(1, 2.6 / 3.2, 0.3), m.glaze, 0, u(10), 0.3);
    for (const [dx, h] of [[-3.5, 14], [0, 15.2], [3.5, 14]]) K.put(ball(u(1.3), 10, 8).scale(1, 1, 0.4), m.glaze, X(16 + dx), u(h), 0.3);
    K.put(cush(L, 28, 7, 0.64, 3), m.brown, 0, u(23.5), 0);
    tuftRow(K, L, m.cream, 4.5, 20.5, 6, 4.6, 2.6, 0.3);
  },

  eeveebeanbag(K, s, W, D, L) {
    const m = mats(K);
    ears(K, L, m, 16, u(21), -0.1, 7, 17, 5.5, 0.45);
    K.put(egg(L, 15, 12.5, 0.4, 24), m.brown, 0, u(12.5), 0);
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; K.put(L.ball(u(3.6), 10, 6), m.cream, Math.cos(a) * u(13.5), u(5), Math.sin(a) * 0.34); }
  },
};
