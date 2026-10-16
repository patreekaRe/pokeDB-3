/* base-models-n.js  -  the frontboxes hand-built: the radiator, upright piano, aquarium, fireplace, fridge, sink, washing
   machine, vending machine, grandfather clock, Storage PC, water cooler, Moomoo Milk crate, pantry shelf, mini fridge,
   cool box and espresso bar (the user's ask, 2026-10-16: "3D detailed CLEAN models ... optimise them"; they were plain
   boxes wearing their painting on the front, js/base-models-kit.js's `frontbox`).
   js/base-models-f.js's head says how a batch works. Each builder follows its painting (js/base-furniture-kinds.js,
   -rooms.js, -rooms2.js) part for part: `u(n)` is n of its 32 pixels a tile, `X(n, W)` a pixel across the painting as x
   from the middle. Real doors (`K.door`) where js/base-play.js opens them (the fridges, the pantry's glazed pair); the
   rest of the doors and drawers are panels. Small parts are plain boxes; coloured trinkets on a piece with doors are
   cloth, which js/base-mesh.js draws as one (a piece with doors isn't baked). */

import { TOPS, crop, tube, colourAt } from './base-models-kit.js';

const u = (n) => n / 32;
const X = (n, W = 1) => n / 32 - W / 2;
const INK = '#303038', STEEL = '#c8ccd4', TAU = Math.PI * 2;
const BERRY = ['#e03838', '#4a78d8', '#f890b8', '#f0d848', '#7a4ab8', '#58b8a8'];

const bx = (L, w, h, d) => new L.THREE.BoxGeometry(w, h, d);
const rb = (L, w, h, d, r = 0.008) => L.rbox(w, h, d, r, 1);
/** A disc of radius r, t thick, facing +z. */
const disc = (L, r, t, seg = 14) => L.cyl(r, t, r, seg).rotateX(Math.PI / 2);
/** An outline ([x, y] points, or a THREE.Shape) extruded `d` deep along z, centred on z 0. */
function slab(L, shape, d, bevel = 0) {
  const { THREE } = L, sh = Array.isArray(shape) ? new THREE.Shape(shape.map(([x, y]) => new THREE.Vector2(x, y))) : shape;
  const g = new THREE.ExtrudeGeometry(sh, { depth: Math.max(0.001, d - bevel * 2), bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1, curveSegments: 12 });
  g.translate(0, 0, -d / 2 + bevel);
  return g;
}

/**
 * A fridge on the painting's px x0..x1, h px tall: a hollow shell on a vented plinth `kick` px high, a shelf `gap` px
 * thick at `cut` between its two rooms, a door on each hinged at the left, their handles at px `hx` ([y0, y1] each, top
 * door first). `dress(top, bottom, z)` puts the magnets and notes on the doors' fronts at z.
 */
function fridgeN(K, L, o, dress) {
  const body = K.gloss(K.pal.p), trim = K.metal(), w = u(o.x1 - o.x0), cx = X((o.x0 + o.x1) / 2), H = u(o.h), d = o.d, f = d / 2;
  const t = 0.035, kick = u(o.kick), dz = 0.055;
  K.put(rb(L, w, H, t, 0.015), body, cx, H / 2, -f + t / 2);
  for (const sg of [-1, 1]) K.put(rb(L, t, H, d, 0.015), body, cx + sg * (w / 2 - t / 2), H / 2, 0);
  K.put(rb(L, w, t, d, 0.015), body, cx, H - t / 2, 0);
  K.put(rb(L, w, kick, d, 0.01), body, cx, kick / 2, 0);
  for (let i = 0; i < o.vents; i++) K.put(bx(L, u(2), kick * 0.45, 0.006), trim, cx + (i - (o.vents - 1) / 2) * u(3.4), kick / 2, f + 0.002);
  K.put(rb(L, w - 2 * t, u(o.gap), d - t, 0.004), body, cx, u(o.cut + o.gap / 2), t / 2);
  K.inside = { x: cx, y: (kick + H - t) / 2, w: w - 2 * t - 0.004, h: H - t - kick, z: -f + t + 0.003 };
  const doors = [[o.cut + o.gap, o.h], [o.kick, o.cut]].map(([y0, y1], k) => {
    const door = K.door([cx - w / 2, f + dz / 2], 1), [h0, h1] = o.handles[k], hx = X(o.hx);
    door(L.rbox(w, u(y1 - y0) - 0.008, dz, 0.02), body, cx, u((y0 + y1) / 2), f + dz / 2);
    door(rb(L, u(2.2), u(h1 - h0), 0.025, 0.008), trim, hx, u((h0 + h1) / 2), f + dz + 0.038);
    for (const y of [h0 + 1.2, h1 - 1.2]) door(bx(L, u(1.4), u(1.4), 0.03), trim, hx, u(y), f + dz + 0.014);
    return door;
  });
  dress(doors[0], doors[1], f + dz);
}

export const SHAPES = {
  heater: { make: 'heater', top: u(32.5) },
  piano: { make: 'piano', top: u(60) },
  aquarium: { make: 'aquarium' },
  fireplace: { make: 'fireplace' },
  fridge: { make: 'fridge', top: u(80) },
  sink: { make: 'sink', top: u(36) },
  washer: { make: 'washer', top: u(42) },
  vending: { make: 'vending' },
  grandclock: { make: 'grandclock' },
  pc: { make: 'pc' },
  watercooler: { make: 'watercooler' },
  milkcrate: { make: 'milkcrate' },
  pantry: { make: 'pantry', top: u(78) },
  minifridge: { make: 'minifridge', top: u(32) },
  cooler: { make: 'cooler' },   // no top: its handle stands up in the middle of the lid
  espresso: { make: 'espresso' },
};

export const MAKES = {
  heater(K, s, W, D, L) {
    const iron = K.metal(), dark = K.metal(L.tone(K.pal.m, 0.62));
    // six cast columns, each a front and a back fin, threaded on two hubs, standing on two feet
    for (let i = 0; i < 6; i++) for (const z of [-0.048, 0.048]) K.put(rb(L, u(4.3), u(28.5), 0.07, 0.025), iron, X(3.5 + i * 5), u(4) + u(14.25), z);
    for (const y of [8.5, 25.5]) K.put(L.cyl(u(1.4), u(30), u(1.4), 10).rotateZ(Math.PI / 2), dark, X(16), u(y), 0);
    for (const x of [5.5, 26.5]) K.put(rb(L, u(3), u(4.5), 0.17, 0.008), dark, X(x), u(2.25), 0);
    // the valve on top at the right: a stem and its wheel
    K.put(L.cyl(u(0.9), u(3), u(0.9), 8), dark, X(29), u(33), 0.02);
    K.put(L.cyl(u(2.5), u(1.4), u(2.5), 12), K.gloss(K.pal.a), X(29), u(34.6), 0.02);
  },

  piano(K, s, W, D, L) {
    const wood = K.wood(), dark = K.wood(L.tone(K.pal.w, 0.74)), lid = K.wood(L.tone(K.pal.w, 1.2));
    const ivory = K.gloss('#f8f8f4'), ebony = K.gloss('#202028'), brass = K.metal(K.pal.a), pale = K.plain(K.pal.p);
    const bz = -0.12, bd = 0.32, cf = bz + bd / 2, kf = 0.3;
    // the tall case and its lid, a dark music panel with a ledge, a score leaning on it, a candle in a brass sconce
    K.put(L.rbox(2, u(52), bd, 0.025), wood, 0, u(32), bz);
    K.put(rb(L, 2, u(4), bd + 0.04, 0.012), lid, 0, u(58), bz);
    K.put(rb(L, u(48), u(14), 0.012, 0.004), dark, 0, u(45), cf + 0.006);
    K.put(rb(L, u(48), u(1.2), 0.05, 0.004), lid, 0, u(38.6), cf + 0.025);
    K.put(bx(L, u(10), u(10), 0.006), pale, X(15, 2), u(44.5), cf + 0.026, 0, -0.12);
    for (let i = 0; i < 4; i++) K.put(bx(L, u(6), u(0.5), 0.002), ebony, X(15, 2), u(48 - i * 2), cf + 0.031 - i * 0.0005, 0, -0.12);
    K.put(rb(L, u(4), u(1), 0.05, 0.003), brass, X(49.5, 2), u(41.5), cf + 0.025);
    K.put(L.cyl(u(1.5), u(8), u(1.5), 10), pale, X(49.5, 2), u(46), cf + 0.035);
    K.put(L.ball(u(1.3), 8, 6).scale(1, 1.8, 1), K.glow('#f8c040'), X(49.5, 2), u(51.5), cf + 0.035);
    // the keyboard: cheeks, the key bed, nineteen white keys and the black ones in their twos and threes, the fallboard
    for (const x of [1.5, 62.5]) K.put(rb(L, u(3), u(12), kf - cf, 0.008), wood, X(x, 2), u(26), (cf + kf) / 2);
    K.put(rb(L, u(58), u(5), kf - cf, 0.006), dark, 0, u(22.5), (cf + kf) / 2);
    for (let i = 0; i < 19; i++) K.put(bx(L, u(2.8), u(3), 0.2), ivory, X(4.5 + i * 3.05, 2), u(26.5), kf - 0.1);
    for (let i = 4; i < 56; i += 3) if (![2, 6].includes(Math.floor(i / 3) % 7)) K.put(bx(L, u(1.8), u(1.6), 0.12), ebony, X(i + 4, 2), u(28.6), kf - 0.15);
    K.put(rb(L, u(58), u(4), 0.07, 0.008), dark, 0, u(31), cf + 0.035);
    // two turned legs on toe blocks under the key bed, two brass pedals
    for (const x of [6, 58]) {
      K.put(rb(L, u(4), u(3), kf - cf + 0.03, 0.008), dark, X(x, 2), u(1.5), (cf + kf) / 2 + 0.015);
      K.put(L.lathe([[u(1.6), 0], [u(2), u(2)], [u(1.3), u(6)], [u(2.3), u(9)], [u(1.4), u(13)], [u(2.1), u(17)], [u(2.1), u(20)]], 12), wood, X(x, 2), 0, kf - 0.04);
    }
    for (const x of [21.5, 29.5]) K.put(rb(L, u(3), u(1.2), 0.1, 0.004), brass, X(x, 2), u(9), cf + 0.05);
  },

  aquarium(K, s, W, D, L) {
    const wood = K.wood(), groove = K.wood(L.tone(K.pal.w, 0.74)), frame = K.metal(), lid = K.metal(L.tone(K.pal.m, 0.74));
    const leaf = K.plain(K.pal.leaf), d = 0.5, f = d / 2, td = 0.44;
    // the stand: a cabinet, two panelled doors with knobs, a lip under the tank
    K.put(L.rbox(2, u(19), d, 0.025), wood, 0, u(9.5), 0);
    for (const x of [17, 47]) {
      K.put(rb(L, u(26), u(12), 0.012, 0.004), groove, X(x, 2), u(10), f + 0.004);
      K.put(rb(L, u(22), u(8.5), 0.02, 0.006), wood, X(x, 2), u(10), f + 0.01);
    }
    for (const x of [28, 36]) K.put(L.ball(u(1.3), 8, 6), K.metal(K.pal.a), X(x, 2), u(10), f + 0.03);
    K.put(rb(L, 2, u(1.5), d + 0.02, 0.006), wood, 0, u(19.25), 0);
    // the tank: a metal foot rail, corner posts and a lid, glass all round, a blue back
    K.put(rb(L, u(62), u(2), td, 0.006), frame, 0, u(21), 0);
    for (const x of [-1, 1]) for (const z of [-1, 1]) K.put(bx(L, u(1.6), u(31), u(1.6)), frame, x * (u(31) - u(0.8)), u(37.5), z * (td / 2 - u(0.8)));
    K.put(rb(L, u(62), u(4), td + 0.01, 0.008), lid, 0, u(54), 0);
    K.put(bx(L, u(60.5), u(30), td - 0.01), K.glass(), 0, u(37), 0);
    K.put(bx(L, u(59), u(27), td - 0.03), K.M('glass', '#5a9ad0', { key: 'water' }), 0, u(35.5), 0);
    K.put(new L.THREE.PlaneGeometry(u(59), u(30)), K.plain('#3a7ab8'), 0, u(37), -td / 2 + 0.012);
    // gravel and pebbles, four waving weeds, a shell, two fish
    K.put(rb(L, u(59), u(4), td - 0.03, 0.006), K.plain('#e8d8a0'), 0, u(24), 0);
    const R = L.rng('aquarium');
    for (let i = 0; i < 9; i++) K.put(L.ball(u(1.1), 8, 6).scale(1, 0.6, 1), K.plain('#c8a868'), X(4 + R() * 56, 2), u(26), -0.17 + R() * 0.34);
    for (const [px, h, z] of [[8, 16, -0.1], [11, 12, 0.04], [52, 20, -0.12], [56, 14, 0.02]]) {
      const pts = [0, 0.25, 0.5, 0.75, 1].map(t => [X(px + Math.sin(t * h / 2) * 1.5, 2), u(26 + t * h), z]);
      K.put(tube(L, pts, 0.012, 10), leaf, 0, 0, 0);
      for (const t of [0.45, 0.8]) K.put(L.ball(1, 8, 6).scale(u(2.2), u(0.6), u(0.9)), leaf, pts[Math.round(t * 4)][0] + (t > 0.5 ? -1 : 1) * u(1.6), u(26 + t * h), z, 0, 0, (t > 0.5 ? 0.6 : -0.6));
    }
    K.put(L.ball(u(3), 12, 8).scale(1, 0.8, 1), K.gloss('#c8a0e8'), X(32, 2), u(27.5), 0.04);
    for (const [x, y, rx, ry, col] of [[22, 40, 5, 3, '#f08030'], [40, 32, 4, 2.2, '#f8d030']]) {
      K.put(L.ball(1, 10, 8).scale(u(rx), u(ry), u(ry * 0.6)), K.gloss(col), X(x, 2), u(y), 0.03);
      K.put(L.ball(1, 8, 6).scale(u(rx * 0.45), u(ry * 0.9), u(0.5)), K.gloss(col), X(x + rx * 1.15, 2), u(y), 0.03);
    }
  },

  fireplace(K, s, W, D, L) {
    const { THREE } = L, brick = K.plain(K.pal.w), dim = K.plain(L.tone(K.pal.w, 0.8)), mortar = K.plain(L.tone(K.pal.w, 0.55));
    const stone = K.plain(L.tone(K.pal.w, 1.25)), soot = K.plain('#2a1a1a'), bd = 0.44, zf = bd / 2, sd = 0.2;
    const cx = 32.5, cy = 30, ri = 16.5, ro = 19.5;
    // the chimney breast behind, the brick surround round an arched firebox, a mortar face under the bricks
    K.put(L.rbox(2, u(52), bd - sd, 0.02), brick, 0, u(26), -zf + (bd - sd) / 2);
    const around = () => {
      const sh = new THREE.Shape();
      sh.moveTo(-1, 0); sh.lineTo(X(cx - ri, 2), 0); sh.lineTo(X(cx - ri, 2), u(cy));
      sh.absarc(X(cx, 2), u(cy), u(ri), Math.PI, 0, true);
      sh.lineTo(X(cx + ri, 2), 0); sh.lineTo(1, 0); sh.lineTo(1, u(52)); sh.lineTo(-1, u(52)); sh.closePath();
      return sh;
    };
    K.put(slab(L, around(), sd), brick, 0, 0, zf - sd / 2);
    K.put(slab(L, around(), 0.008), mortar, 0, 0, zf + 0.004);
    const back = new THREE.Shape();
    back.moveTo(X(cx - ri, 2), 0); back.lineTo(X(cx - ri, 2), u(cy)); back.absarc(X(cx, 2), u(cy), u(ri), Math.PI, 0, true); back.lineTo(X(cx + ri, 2), 0); back.closePath();
    K.put(new THREE.ShapeGeometry(back, 12), soot, 0, 0, zf - sd + 0.002);
    for (let j = 0; j < 6; j++) { const y = 18 + j * 4.5, hw = y <= cy ? ri : Math.sqrt(ri * ri - (y - cy) ** 2); K.put(bx(L, u(hw * 2 - 1), u(0.6), 0.004), K.plain('#3a2420'), X(cx, 2), u(y), zf - sd + 0.005); }
    // the bricks, course by course, cut round the arch; a stone ring with a keystone and two jambs over the cuts
    const hwIn = (y) => (y <= cy ? ri : y < cy + ri ? Math.sqrt(ri * ri - (y - cy) ** 2) : 0);
    const hwOut = (y) => (y <= cy ? ro : y < cy + ro ? Math.sqrt(ro * ro - (y - cy) ** 2) : 0);
    const R = L.rng('fireplace');
    for (let j = 0; j < 52; j += 6) {
      const h1 = 52 - j, h0 = Math.max(0, h1 - 6), c = Math.max(hwIn(h0), hwOut(h1));
      for (let i = (j % 12 ? 0 : -6); i < 64; i += 12) {
        const a = Math.max(0, i), b = Math.min(64, i + 12);
        for (const [p, q] of [[a, Math.min(b, cx - c)], [Math.max(a, cx + c), b]]) {
          if (q - p < 1) continue;
          K.put(bx(L, u(q - p - 0.7), u(h1 - h0 - 0.7), 0.02), R() < 0.3 ? dim : brick, X((p + q) / 2, 2), u((h0 + h1) / 2), zf + 0.018);
        }
      }
    }
    const ring = new THREE.Shape();
    ring.moveTo(X(cx - ro, 2), u(cy)); ring.absarc(X(cx, 2), u(cy), u(ro), Math.PI, 0, true);
    ring.lineTo(X(cx + ri, 2), u(cy)); ring.absarc(X(cx, 2), u(cy), u(ri), 0, Math.PI, false); ring.closePath();
    K.put(slab(L, ring, 0.035), stone, 0, 0, zf + 0.024);
    for (const x of [cx - (ri + ro) / 2, cx + (ri + ro) / 2]) K.put(bx(L, u(ro - ri), u(cy), 0.035), stone, X(x, 2), u(cy / 2), zf + 0.024);
    K.put(rb(L, u(8), u(6.5), 0.045, 0.006), stone, X(cx, 2), u(48.5), zf + 0.03);
    K.put(rb(L, u(46), u(1.2), 0.3, 0.004), stone, X(cx, 2), u(0.6), zf - 0.06);
    // the fire: two logs on a pair of firedogs, three flames each with a bright heart
    K.put(L.cyl(u(2), u(28), u(2), 10).rotateZ(Math.PI / 2), K.plain('#6a4426'), X(32, 2), u(4), zf - 0.1);
    K.put(L.cyl(u(2), u(22), u(2), 10).rotateZ(Math.PI / 2), K.plain('#5a3a20'), X(33, 2), u(8), zf - 0.12, 0.25);
    for (const x of [20, 45]) { K.put(bx(L, u(1.4), u(6), u(1.4)), soot, X(x, 2), u(3), zf - 0.03); K.put(L.ball(u(1.1), 8, 6), K.metal(K.pal.a), X(x, 2), u(6.6), zf - 0.03); }
    const flame = (h, w) => L.lathe([[0.0005, 0], [w * 0.75, h * 0.12], [w, h * 0.32], [w * 0.7, h * 0.62], [w * 0.25, h * 0.88], [0.0005, h]], 10).scale(1, 1, 0.55);
    for (const [x, h, w] of [[25, 16, 5], [32, 22, 7], [39, 15, 5]]) {
      K.put(flame(u(h), u(w)), K.glow('#f86030'), X(x, 2), u(9), zf - 0.11);
      K.put(flame(u(h * 0.7), u(w * 0.6)), K.glow('#f8e070'), X(x, 2), u(9), zf - 0.11 + u(w) * 0.3);
    }
    // the mantel beam, and on it (js/base-models-kit.js's TOPS) its shelf, a gold ornament, a photo and a vase
    K.put(L.rbox(u(66), u(6), bd + 0.06, 0.012), K.wood(colourAt(K, 0.5, 0.17)), 0, u(55), 0.02);
    TOPS.fireplace(K, L, { x: (f) => X(-1 + f * 66, 2), y: (f) => u(72 * (1 - f)), top: u(58), w: u(66) - 0.06, d: bd, side: K.pal.w });
  },

  fridge(K, s, W, D, L) {
    fridgeN(K, L, { x0: 2, x1: 30, h: 80, cut: 50, gap: 2, kick: 3, d: 0.62, hx: 25.5, handles: [[58, 74], [24, 46]], vents: 5 }, (top, bottom, z) => {
      // three magnets on the freezer, a shopping list held by a fourth below
      for (const [x, y, c] of [[6, 74, K.pal.c], [12, 70, K.pal.a], [6, 64, '#4a7ac8']]) top(disc(L, u(2.2), 0.012, 12), K.cloth(c), X(x), u(y), z + 0.006);
      bottom(bx(L, u(12), u(14), 0.004), K.cloth('#ffffff'), X(13), u(37), z + 0.002);
      for (const [y, w] of [[40.5, 8], [37.5, 6], [34.5, 7]]) bottom(bx(L, u(w), u(0.7), 0.002), K.cloth(L.tone(K.pal.p, 0.52)), X(9 + w / 2), u(y), z + 0.005);
      bottom(disc(L, u(1.6), 0.01, 10), K.cloth(K.pal.c), X(13), u(43), z + 0.009);
    });
  },

  minifridge(K, s, W, D, L) {
    fridgeN(K, L, { x0: 5, x1: 27, h: 32, cut: 21, gap: 1, kick: 1.5, d: 0.5, hx: 23, handles: [[24, 30], [9, 19]], vents: 0 }, (top, bottom, z) => {
      top(disc(L, u(1.6), 0.01, 10), K.cloth(K.pal.c), X(10), u(27), z + 0.005);
      bottom(bx(L, u(6), u(7), 0.004), K.cloth('#fffbe8'), X(12), u(12.5), z + 0.002);
      bottom(disc(L, u(1.1), 0.01, 8), K.cloth(K.pal.a), X(12), u(15.5), z + 0.007);
    });
    // a potted plant on top at the left
    const pot = K.cloth(K.pal.pot), leaf = K.cloth(K.pal.leaf);
    K.put(L.lathe([[u(2.8), 0], [u(3.5), u(4.2)], [u(3.9), u(4.4)], [u(3.9), u(5)], [u(3.4), u(5)], [u(3.3), u(4.4)], [0.0005, u(4.4)]], 12), pot, X(12.5), u(32), 0);
    for (let i = 0; i < 7; i++) {
      const a = i * 2.4, r = i ? u(2.6) : 0;
      K.put(L.ball(u(i ? 2.4 : 2.8), 10, 8), leaf, X(12.5) + Math.cos(a) * r, u(i ? 39 + (i % 3) * 1.2 : 42), Math.sin(a) * r * 0.9);
    }
  },

  sink(K, s, W, D, L) {
    const { THREE } = L, wood = K.wood(), inset = K.wood(L.tone(K.pal.w, 0.85)), pale = K.gloss(K.pal.p), tap = K.metal(), d = 0.56, f = d / 2;
    // the cabinet on a recessed toe kick, two shaker doors with knobs
    K.put(L.rbox(u(30), u(27), d - 0.02, 0.02), wood, 0, u(16.5), -0.01);
    K.put(rb(L, u(28), u(3), d - 0.08, 0.006), K.wood(L.tone(K.pal.w, 0.45)), 0, u(1.5), -0.04);
    for (const x of [9.5, 22.5]) {
      K.put(rb(L, u(11), u(22), 0.02, 0.006), wood, X(x), u(15), f - 0.01 + 0.01);
      K.put(rb(L, u(7), u(17), 0.008, 0.003), inset, X(x), u(15), f + 0.012);
    }
    for (const x of [13, 19]) K.put(L.ball(u(1.5), 8, 6), K.metal(K.pal.a), X(x), u(15), f + 0.03);
    // the counter with the basin let into it, a steel bowl, a drain and a little water
    const top = new THREE.Shape([[-0.5, -f - 0.03], [0.5, -f - 0.03], [0.5, f + 0.01], [-0.5, f + 0.01]].map(([x, y]) => new THREE.Vector2(x, y)));
    const rx = u(9), rz = 0.17, bzc = 0.03;
    top.holes.push(new THREE.Path().absellipse(0, -bzc, rx, rz, 0, TAU, true));
    const counter = new THREE.ExtrudeGeometry(top, { depth: u(6), bevelEnabled: false, curveSegments: 16 }).rotateX(-Math.PI / 2);
    K.put(counter, pale, 0, u(30), 0);
    K.put(L.lathe([[rx, 0], [rx * 0.96, -0.05], [rx * 0.8, -0.1], [rx * 0.45, -0.13], [0.0005, -0.135]], 16).scale(1, 1, rz / rx), K.metal(STEEL), 0, u(36) - 0.002, bzc);
    K.put(L.torus(rx, 0.008, TAU, 20).scale(1, rz / rx, 1), K.metal(STEEL), 0, u(36), bzc, 0, Math.PI / 2);
    K.put(L.cyl(0.025, 0.004, 0.025, 10), K.plain('#3a3a44'), 0, u(36) - 0.133, bzc);
    K.put(new THREE.CircleGeometry(1, 16).rotateX(-Math.PI / 2).scale(rx * 0.85, 1, rz * 0.85), K.M('glass', '#a8d0e8', { key: 'water' }), 0, u(36) - 0.06, bzc);
    // the tap: a swan neck over the basin from the back, a handle either side
    const zb = -f + 0.1;
    K.put(L.cyl(0.04, 0.025, 0.048, 12), tap, X(16.5), u(36) + 0.012, zb);
    K.put(tube(L, [[X(16.5), u(36), zb], [X(16.5), u(43), zb], [X(17.2), u(46.5), zb + 0.04], [X(20), u(47.4), zb + 0.12], [X(22.4), u(46), zb + 0.18], [X(23), u(43.5), zb + 0.2]], u(1.2), 18), tap, 0, 0, 0);
    for (const x of [11, 22]) { K.put(L.cyl(u(0.9), u(3), u(1.1), 8), tap, X(x), u(37.5), zb); K.put(L.ball(u(2), 10, 8), tap, X(x), u(40), zb); }
  },

  washer(K, s, W, D, L) {
    const { THREE } = L, body = K.gloss(K.pal.p), ring = K.metal(), dark = K.plain('#2a3440'), d = 0.6, f = d / 2;
    // the cabinet on four feet
    K.put(L.rbox(u(28), u(41), d, 0.03), body, 0, u(21.5), 0);
    for (const x of [-1, 1]) for (const z of [-1, 1]) K.put(L.cyl(u(1.2), u(1.2), u(1.5), 8), dark, x * u(11), u(0.6), z * (f - 0.06));
    // the control strip: a dial, a display with a green readout, two buttons
    K.put(rb(L, u(26), u(7), 0.016, 0.005), K.gloss(L.tone(K.pal.p, 0.82)), 0, u(36.5), f + 0.006);
    K.put(L.cyl(u(2.3), 0.03, u(2.6), 14).rotateX(Math.PI / 2), K.metal(K.pal.a), X(7), u(37), f + 0.028);
    K.put(bx(L, u(0.6), u(1.8), 0.006), dark, X(7), u(37.9), f + 0.045);
    K.put(rb(L, u(12), u(3), 0.008, 0.002), K.plain('#3a4a5a'), X(18), u(36.5), f + 0.018);
    K.put(new THREE.PlaneGeometry(u(6), u(1)), K.glow('#68e868'), X(16), u(36.6), f + 0.0225);
    for (const y of [38.2, 35]) K.put(disc(L, u(1), 0.014, 8), K.metal(K.pal.a), X(26.5), u(y), f + 0.02);
    // the porthole: a chrome ring, the drum dark behind a domed window, the washing in its bottom, a latch
    K.put(L.torus(u(10), u(1.4), TAU, 20), ring, X(16), u(18), f + 0.02);
    K.put(new THREE.CircleGeometry(u(9), 16), dark, X(16), u(18), f + 0.002);
    K.put(L.ball(1, 12, 8).scale(u(8.5), u(4.2), u(1)), K.cloth(K.pal.c), X(16), u(13), f + 0.006);
    const th = 0.6, Rg = u(9) / Math.sin(th), dome = new THREE.SphereGeometry(Rg, 16, 4, 0, TAU, 0, th).rotateX(Math.PI / 2);
    dome.translate(0, 0, -Rg * Math.cos(th)); dome.scale(1, 1, 0.55);
    K.put(dome, K.M('glass', '#8ac8f0', { key: 'port' }), X(16), u(18), f + 0.02);
    K.put(rb(L, u(2), u(5), 0.03, 0.006), ring, X(28), u(17.5), f + 0.015);
  },

  vending(K, s, W, D, L) {
    const { THREE } = L, body = K.gloss(K.pal.c), shade = K.plain(L.tone(K.pal.c, 0.7)), ink = K.plain('#202028');
    const H = u(80), d = 0.62, f = d / 2, fd = 0.14;
    // the cabinet, its front door a frame round a deep window lit from behind
    K.put(L.rbox(1, H, d - fd, 0.03), body, 0, H / 2, -fd / 2);
    const door = new THREE.Shape([[-0.5, 0], [0.5, 0], [0.5, H], [-0.5, H]].map(([x, y]) => new THREE.Vector2(x, y)));
    door.holes.push(new THREE.Path([[3, 24], [22, 24], [22, 70], [3, 70]].map(([x, y]) => new THREE.Vector2(X(x), u(y)))));
    K.put(slab(L, door, fd), body, 0, 0, f - fd / 2);
    K.put(new THREE.PlaneGeometry(u(19), u(46)), K.glow(K.pal.gl), X(12.5), u(47), f - fd + 0.002);
    // five shelves of cans, the glass over them
    const cans = [K.pal.a, '#68b8f0', '#f8a0c0', '#78d868'];
    for (let j = 0; j < 5; j++) {
      K.put(bx(L, u(19), u(0.8), fd - 0.01), shade, X(12.5), u(59.6 - j * 9), f - fd / 2);
      for (let i = 0; i < 3; i++) K.put(L.cyl(u(2), u(7), u(2), 10), K.gloss(cans[(i + j) % 4]), X(7 + i * 5), u(63.5 - j * 9), f - fd / 2);
    }
    K.put(new THREE.PlaneGeometry(u(19), u(46)), K.glass(), X(12.5), u(47), f - 0.006);
    // the lit header, the column of buttons, the coin slot and change cup, the flap over the bin, a kick plate
    K.put(rb(L, u(28), u(6), 0.02, 0.006), K.glow(L.tone(K.pal.c, 1.3)), 0, u(75), f + 0.008);
    for (let j = 0; j < 8; j++) K.put(disc(L, u(1.3), 0.02, 10), K.gloss(j === 2 ? '#e04848' : K.pal.p), X(26), u(66 - j * 4), f + 0.01);
    K.put(rb(L, u(4), u(8), 0.02, 0.004), ink, X(26), u(30), f + 0.008);
    K.put(bx(L, u(0.6), u(3), 0.006), K.metal(STEEL), X(26), u(31.5), f + 0.02);
    K.put(rb(L, u(3), u(1.6), 0.02, 0.004), K.metal(STEEL), X(26), u(27.5), f + 0.022);
    K.put(rb(L, u(18), u(10), 0.016, 0.004), ink, X(13), u(13), f + 0.006);
    K.put(rb(L, u(16), u(7), 0.01, 0.003), K.gloss('#404050'), X(13), u(13.6), f + 0.018, 0, -0.18);
    K.put(rb(L, u(30), u(3), 0.012, 0.004), shade, 0, u(1.6), f + 0.004);
  },

  grandclock(K, s, W, D, L) {
    const wood = K.wood(), dark = K.wood(L.tone(K.pal.w, 0.55)), light = K.wood(L.tone(K.pal.w, 1.2)), brass = K.metal(K.pal.a);
    const ink = K.plain(INK), bz = -0.01, td = 0.3, tf = bz + td / 2;
    // the plinth and its moulding
    K.put(L.rbox(u(26), u(7), 0.42, 0.02), wood, 0, u(3.5), 0);
    K.put(rb(L, u(27), u(1.5), 0.44, 0.006), light, 0, u(7.4), 0);
    // the trunk: a glazed door frame, its dark inside, the brass rod and bob of the pendulum
    K.put(L.rbox(u(20), u(48), td, 0.02), wood, 0, u(32), bz);
    for (const x of [8, 24]) K.put(rb(L, u(4), u(48), 0.05, 0.006), wood, X(x), u(32), tf + 0.025);
    for (const [y, h] of [[10.4, 4.8], [52.6, 6.8]]) K.put(rb(L, u(12), u(h), 0.05, 0.006), wood, 0, u(y), tf + 0.025);
    K.put(new L.THREE.PlaneGeometry(u(12.4), u(37)), dark, 0, u(31.4), tf + 0.002);
    K.put(bx(L, u(1.2), u(24), 0.006), brass, 0, u(37), tf + 0.02);
    K.put(L.cyl(u(4), 0.014, u(4), 16).rotateX(Math.PI / 2), brass, 0, u(24), tf + 0.022);
    K.put(new L.THREE.PlaneGeometry(u(12.4), u(37)), K.glass(), 0, u(31.4), tf + 0.045);
    // the hood with two columns, the dial in a brass bezel, its hour marks and hands
    K.put(L.rbox(u(28), u(26), 0.42, 0.02), wood, 0, u(69), 0);
    for (const x of [4, 28]) K.put(L.cyl(u(1.2), u(24), u(1.2), 8), light, X(x), u(69), 0.215);
    const fz = 0.21;
    K.put(L.torus(u(9.5), u(0.9), TAU, 20), brass, 0, u(70), fz + 0.004);
    K.put(disc(L, u(9.2), 0.01, 20), K.gloss(K.pal.p), 0, u(70), fz + 0.004);
    for (let h = 0; h < 12; h++) { const a = h * Math.PI / 6; K.put(bx(L, u(0.7), u(1.4), 0.004), ink, Math.cos(a) * u(7), u(70) + Math.sin(a) * u(7), fz + 0.011, 0, 0, a + Math.PI / 2); }
    K.put(bx(L, u(0.9), u(5.5), 0.004), ink, 0, u(72.6), fz + 0.013);
    K.put(bx(L, u(5.5), u(0.9), 0.004), ink, u(2.6), u(69.6), fz + 0.016);
    K.put(L.ball(u(0.9), 8, 6), brass, 0, u(70), fz + 0.016);
    // the pediment with a cornice and a finial
    K.put(rb(L, u(29), u(1.4), 0.44, 0.005), light, 0, u(82.3), 0);
    K.put(slab(L, [[-u(13), 0], [u(13), 0], [0, u(7.2)]], 0.38, 0.006), light, 0, u(83), 0);
    K.put(L.ball(u(1.2), 8, 6), brass, 0, u(90.6), 0);
  },

  pc(K, s, W, D, L) {
    const body = K.gloss(K.pal.p), slot = K.plain(L.tone(K.pal.p, 0.5)), d = 0.5, f = d / 2;
    // the tower on a dark plinth
    K.put(L.rbox(u(28), u(61), d, 0.03), body, 0, u(31.5), 0);
    K.put(rb(L, u(26), u(1.2), d - 0.04, 0.004), K.plain('#2a2a32'), 0, u(0.6), 0);
    // the screen in its bezel, wearing its own picture
    K.put(rb(L, u(24), u(20), 0.03, 0.008), K.gloss(L.tone(K.pal.m, 0.74)), 0, u(46), f + 0.01);
    const c = crop(K, L, [3 / 28, 7 / 62, 25 / 28, 25 / 62]);
    K.put(new L.THREE.PlaneGeometry(u(22), u(18)), L.litPic(c.canvas, 0.6), 0, u(46), f + 0.026);
    // a coloured band, the drive door with a slot and its green power light, four vents
    K.put(rb(L, u(24), u(3), 0.02, 0.005), K.gloss(K.pal.c), 0, u(30.5), f + 0.006);
    K.put(rb(L, u(10), u(20), 0.02, 0.006), K.gloss(L.tone(K.pal.p, 0.86)), X(9), u(16), f + 0.006);
    K.put(bx(L, u(7), u(0.7), 0.004), slot, X(9), u(22), f + 0.017);
    K.put(L.ball(u(1.6), 8, 6).scale(1, 1, 0.5), K.glow('#68e868'), X(9), u(16), f + 0.017);
    for (let j = 0; j < 4; j++) K.put(rb(L, u(10), u(2), 0.008, 0.003), slot, X(22), u(23 - j * 4), f + 0.002);
  },

  watercooler(K, s, W, D, L) {
    const body = K.gloss(K.pal.p), shade = K.gloss(L.tone(K.pal.p, 0.78)), dark = K.plain('#3a3a48'), d = 0.44, f = d / 2;
    // the stand, a seam round it, red and blue taps over a drip tray, a dark grille below
    K.put(L.rbox(u(20), u(43), d, 0.03), body, 0, u(21.5), 0);
    K.put(bx(L, u(20.2), u(0.6), d + 0.004), K.plain(L.tone(K.pal.p, 0.55)), 0, u(29.5), 0);
    for (const [x, c] of [[11.5, '#e04848'], [20.5, '#4a78d8']]) {
      K.put(rb(L, u(3), u(3), 0.05, 0.008), K.gloss(c), X(x), u(36.5), f + 0.022);
      K.put(L.cyl(u(0.7), u(2), u(0.6), 8), K.metal(STEEL), X(x), u(34.2), f + 0.032);
    }
    K.put(rb(L, u(16), u(2), 0.12, 0.006), shade, 0, u(25), f + 0.04);
    for (let i = 0; i < 3; i++) K.put(bx(L, u(13), u(0.3), 0.012), dark, 0, u(26.05), f + 0.01 + i * 0.03);
    K.put(rb(L, u(6), u(6), 0.01, 0.003), dark, 0, u(19), f + 0.003);
    // the collar, the bottle upside down in it: clear plastic, blue water, two ribs round it
    K.put(L.cyl(u(7), u(2), u(8), 14), body, 0, u(44), 0);
    const jug = [[2.6, 43], [3, 44], [3, 47], [6, 48.5], [9.4, 50], [10, 51.5], [10, 67], [9, 69.3], [6, 70], [0, 70]];
    K.put(L.lathe(jug.map(([r, y]) => [u(r), u(y)]), 16), K.M('glass', '#a8dcf8', { key: 'jug' }), 0, 0, 0);
    const water = [[2.4, 44], [2.4, 47], [5.6, 48.6], [9, 50.1], [9.5, 51.6], [9.5, 64], [0, 64]];
    K.put(L.lathe(water.map(([r, y]) => [u(r), u(y)]), 16), K.gloss('#68b8f0'), 0, 0, 0);
    for (const [y, r] of [[57.5, 10], [49.6, 9.1]]) K.put(L.torus(u(r), u(0.5), TAU, 16), K.gloss('#4a98d8'), 0, u(y), 0, 0, Math.PI / 2);
  },

  milkcrate(K, s, W, D, L) {
    const crate = K.gloss(K.pal.c), lip = K.gloss(L.tone(K.pal.c, 1.2)), milk = K.gloss('#f8f8f0'), blue = K.gloss('#4a78d8');
    const w = u(28), d = 0.46, t = 0.03;
    // the crate: a floor, its walls with a row of hand holes front and back and one each side, a lighter lip, dividers
    K.put(rb(L, w, u(1.5), d, 0.006), crate, 0, u(0.75), 0);
    for (const z of [-1, 1]) {
      const zz = z * (d / 2 - t / 2);
      K.put(rb(L, w, u(9), t, 0.006), crate, 0, u(4.5), zz);
      K.put(rb(L, w, u(3), t, 0.006), crate, 0, u(14.5), zz);
      for (const [a, b] of [[2, 5], [9, 11], [15, 17], [21, 23], [27, 30]]) K.put(bx(L, u(b - a), u(4), t), crate, X((a + b) / 2), u(11), zz);
      K.put(rb(L, w + 0.012, u(2), t + 0.012, 0.005), lip, 0, u(17), zz);
    }
    for (const x of [-1, 1]) {
      const xx = x * (w / 2 - t / 2);
      K.put(rb(L, t, u(9), d, 0.006), crate, xx, u(4.5), 0);
      K.put(rb(L, t, u(3), d, 0.006), crate, xx, u(14.5), 0);
      for (const z of [-1, 1]) K.put(bx(L, t, u(4), d / 2 - 0.1), crate, xx, u(11), z * (0.1 + (d / 2 - 0.1) / 2));
      K.put(rb(L, t + 0.012, u(2), d + 0.012, 0.005), lip, xx, u(17), 0);
    }
    K.put(bx(L, w - 2 * t, u(7), 0.012), crate, 0, u(11.5), 0);
    for (const x of [9.5, 15.5, 21.5]) K.put(bx(L, 0.012, u(7), d - 2 * t), crate, X(x), u(11.5), 0);
    // eight bottles of Moomoo Milk: white glass, a blue band, a blue cap
    const glass = L.lathe([[2.3, 0], [2.5, 0.8], [2.5, 27.5], [2, 29.2], [1.5, 30], [1.5, 32.5], [0, 32.5]].map(([r, y]) => [u(r), u(y)]), 12);
    for (let i = 0; i < 4; i++) for (const z of [-0.1, 0.1]) {
      const x = X(6.5 + i * 6);
      K.put(glass.clone(), milk, x, u(1.5), z);
      K.put(L.cyl(u(2.6), u(3), u(2.6), 12), blue, x, u(24.5), z);
      K.put(L.cyl(u(1.7), u(2), u(1.7), 10), blue, x, u(35), z);
    }
  },

  pantry(K, s, W, D, L) {
    const { THREE } = L, wood = K.wood(), back = K.wood(L.tone(K.pal.w, 0.52)), board = K.wood(L.tone(K.pal.w, 1.2)), glass = K.glass();
    const d = 0.44, f = d / 2;
    // the case: sides, a plinth, a top under a cornice, a dark back, three shelves
    for (const x of [2, 62]) K.put(rb(L, u(4), u(73), d, 0.012), wood, X(x, 2), u(36.5), 0);
    K.put(rb(L, u(56), u(4), d, 0.008), wood, 0, u(2), 0);
    K.put(rb(L, u(56), u(3), d, 0.008), wood, 0, u(71.5), 0);
    K.put(rb(L, 2, u(5), d + 0.03, 0.012), board, 0, u(75.5), 0.005);
    K.put(bx(L, u(56), u(66), 0.02), back, 0, u(37), -f + 0.012);
    const rows = [52, 30, 8];
    for (const fl of rows.slice(0, 2)) K.put(rb(L, u(56), u(4), d - 0.03, 0.006), board, 0, u(fl - 2), -0.005);
    K.put(rb(L, u(56), u(4), d - 0.03, 0.006), board, 0, u(6), -0.005);
    // on each shelf: jars of jam with gingham tops, tins, boxes and flour sacks
    const jar = L.lathe([[2.8, 0], [3, 0.5], [3, 10.5], [2.5, 12], [0, 12]].map(([r, y]) => [u(r), u(y)]), 12);
    rows.forEach((fl, r) => {
      for (let i = 0; i < 7; i++) {
        const x = X(9 + i * 8, 2), y = u(fl), kind = (i + r * 3) % 4, z = 0.02;
        if (kind === 0) {
          K.put(jar.clone(), glass, x, y, z);
          K.put(L.cyl(u(2.7), u(8), u(2.7), 12), K.cloth(BERRY[(i + r) % 6]), x, y + u(4.1), z);
          K.put(L.cyl(u(3.1), u(2), u(3.1), 12), K.cloth(K.pal.a), x, y + u(13), z);
        } else if (kind === 1) {
          K.put(L.cyl(u(3), u(10), u(3), 12), K.metal(), x, y + u(5), z);
          K.put(L.cyl(u(3.05), u(4), u(3.05), 12), K.cloth(K.pal.c), x, y + u(5), z);
        } else if (kind === 2) {
          K.put(rb(L, u(7), u(15), 0.16, 0.005), K.cloth('#e8d8a8'), x + u(0.5), y + u(7.5), z);
          K.put(new THREE.PlaneGeometry(u(5), u(4)), K.cloth(K.pal.c), x + u(0.5), y + u(9), z + 0.081);
        } else {
          K.put(L.ball(1, 12, 8).scale(u(4), u(6), 0.08), K.cloth('#f0e4c8'), x, y + u(5.6), z);
          K.put(L.cyl(u(1.2), u(1.6), u(1.8), 8), K.cloth('#f0e4c8'), x, y + u(12), z);
        }
      }
    });
    // two glazed doors hinged at the outer edges, glazing bars along the shelves, wooden knobs where they meet
    const fz = f + 0.018, dh = u(69), dy = u(38.5);
    for (const sg of [-1, 1]) {
      const door = K.door([sg * 1, fz], -sg), cx = sg * 0.5;
      for (const x of [sg * (1 - u(1.5)), sg * u(1.5)]) door(rb(L, u(3), dh, 0.03, 0.008), wood, x, dy, fz);
      for (const y of [5.5, 71.5, 50, 28]) door(rb(L, 1 - u(6), u(y > 5.5 && y < 71.5 ? 2 : 3), 0.026, 0.006), wood, cx, u(y), fz);
      door(new THREE.PlaneGeometry(1 - u(6), dh - u(6)), glass, cx, dy, fz);
      door(L.ball(u(1.4), 8, 6), wood, sg * u(5), u(38), fz + 0.03);
    }
    K.inside = { x: 0, y: dy, w: u(56), h: u(66), z: f - 0.02, bare: true };
  },

  cooler(K, s, W, D, L) {
    const body = K.gloss(K.pal.c), lid = K.gloss(K.pal.p), grip = K.metal(), w = u(28), d = 0.5, f = d / 2;
    // the tub with a moulded rib round its foot and a white label
    K.put(L.rbox(w, u(19), d, 0.04), body, 0, u(9.5), 0);
    K.put(rb(L, w + 0.008, u(1.4), d + 0.008, 0.01), K.gloss(L.tone(K.pal.c, 0.74)), 0, u(5), 0);
    K.put(rb(L, u(8), u(6), 0.008, 0.003), K.plain('#ffffff'), X(10), u(13), f + 0.002);
    K.put(disc(L, u(1), 0.004, 10), K.plain(K.pal.c), X(8.5), u(14.5), f + 0.007);
    // the lid, overhanging a touch, two latches over the join, the carry handle on top
    K.put(L.rbox(u(30), u(7), d + 0.04, 0.03), lid, 0, u(22.5), 0);
    for (const x of [5, 27]) K.put(rb(L, u(3), u(5), 0.02, 0.005), grip, X(x), u(19.5), f + 0.022);
    for (const x of [11, 21]) K.put(rb(L, u(2), u(3.5), 0.05, 0.006), grip, X(x), u(27.5), 0);
    K.put(rb(L, u(12), u(2), 0.06, 0.008), grip, X(16), u(29), 0);
  },

  espresso(K, s, W, D, L) {
    const wood = K.wood(), front = K.wood(L.tone(K.pal.w, 1.1)), pale = K.gloss(K.pal.p), body = K.metal(), chrome = K.metal(STEEL);
    const brass = K.metal(K.pal.a), ink = K.plain('#202028'), d = 0.52, f = d / 2;
    // the counter: a cabinet on a dark kick, a drawer and a door with pulls, a pale top
    K.put(L.rbox(u(30), u(29), d - 0.02, 0.02), wood, 0, u(17.5), -0.01);
    K.put(rb(L, u(28), u(3), d - 0.08, 0.006), K.wood(L.tone(K.pal.w, 0.32)), 0, u(1.5), -0.04);
    K.put(rb(L, u(26), u(7), 0.02, 0.006), front, 0, u(26.5), f);
    K.put(rb(L, u(4), u(1), 0.02, 0.003), brass, X(16), u(26.5), f + 0.016);
    K.put(rb(L, u(26), u(16), 0.02, 0.006), front, 0, u(13), f);
    K.put(rb(L, u(1), u(6), 0.02, 0.003), brass, X(24.5), u(14), f + 0.016);
    K.put(L.rbox(1, u(5), d + 0.02, 0.012), pale, 0, u(33.5), 0);
    // the machine: its body, a cup-warmer tray with three cups on it, a pressure gauge
    const mz = -0.04, mf = mz + 0.2;
    K.put(L.rbox(u(24), u(20), 0.4, 0.03), body, 0, u(46), mz);
    K.put(rb(L, u(24.4), u(2), 0.41, 0.006), chrome, 0, u(57), mz);
    const cup = L.lathe([[1.6, 0], [2, 4.6], [2.1, 5], [1.8, 5], [0, 4.6]].map(([r, y]) => [u(r), u(y)]), 12);
    for (let i = 0; i < 3; i++) K.put(cup.clone(), K.gloss(K.pal.c), X(9 + i * 6), u(58), mz - 0.04);
    K.put(disc(L, u(2.5), 0.01, 14), K.gloss('#fffbe8'), X(16), u(54), mf + 0.005);
    K.put(L.torus(u(2.5), u(0.4), TAU, 14), chrome, X(16), u(54), mf + 0.008);
    K.put(bx(L, u(0.4), u(1.8), 0.003), K.plain('#e04848'), X(16) + u(0.5), u(54.6), mf + 0.012, 0, 0, -0.6);
    // the dark rail with two group heads and their handles, the drip tray, two cups under them, a steam wand
    K.put(rb(L, u(16), u(1.5), 0.04, 0.004), ink, 0, u(49.5), mf + 0.02);
    for (const x of [11, 21]) {
      K.put(L.cyl(u(1.6), u(3), u(1.2), 12), chrome, X(x), u(47.2), mf + 0.04);
      K.put(L.cyl(u(0.7), 0.13, u(0.7), 8).rotateX(Math.PI / 2 - 0.3), ink, X(x), u(44.6), mf + 0.11);
      K.put(cup.clone(), K.gloss('#ffffff'), X(x), u(37.1), mf + 0.045);
      K.put(L.torus(u(1.1), u(0.35), Math.PI, 8).rotateZ(-Math.PI / 2), K.gloss('#ffffff'), X(x) + u(2.1), u(39.5), mf + 0.045);
      K.put(L.cyl(u(1.75), 0.002, u(1.75), 12), K.plain('#5a3420'), X(x), u(37.1) + u(4.55), mf + 0.045);
    }
    K.put(rb(L, u(20), u(1), 0.14, 0.004), chrome, 0, u(36.6), mf + 0.04);
    K.put(L.cyl(u(0.6), u(8), u(0.6), 8), chrome, X(26.5), u(46), mf + 0.03, 0, 0.12);
    K.put(L.ball(u(1.2), 8, 6), ink, X(26.5), u(50.8), mf + 0.02);
  },
};
