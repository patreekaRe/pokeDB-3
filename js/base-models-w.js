/* base-models-w.js  -  wall pieces, batch 1 (the user's ask, 2026-10-12: wall pieces stood in the store and hung in the
   room as flat paintings). Windows, posters, framed pictures, the wall shelf, the clock and the mirror, built from parts
   like the floor batches (js/base-models-f.js's head says how a batch works).

   A wall piece's frame differs from a floor piece's: its back is at z 0 (the wall's face), its front +z, and its height
   is where it hangs. Its painting is a strip WALL_PX (96) units tall from the top of the wall, so `X(i, W)` is painted
   unit i across as x from the middle and `Y(j)` painted unit j down as a height: what's built sits where it was painted.
   A window's pane and a picture's canvas are crops of the painting itself (`cut()`), read fresh each time, so a window
   still shows the hour's sky; js/base-3d.js lights a crop in the piece's `glow` colours as it lit the flat one. */

import { BOOKS } from './base-paint-scenes.js';
import { MOTIFS } from './base-furniture-kinds.js';

export const X = (i, W = 1) => i / 32 - W / 2;
export const Y = (j) => (96 - j) / 32;
export const u = (n) => n / 32;

const cuts = new WeakMap();
/** The painting's units [x0, y0, x1, y1] as a canvas, cut from its HD painting (the hour's, for a window). */
export function cut(K, L, [x0, y0, x1, y1]) {
  const art = K.p.art(0, L.HD, true);
  let got = cuts.get(art);
  if (!got) cuts.set(art, got = new Map());
  const key = `${x0},${y0},${x1},${y1}`;
  if (!got.has(key)) {
    const hd = L.HD, c = new OffscreenCanvas(Math.max(1, Math.round((x1 - x0) * hd)), Math.max(1, Math.round((y1 - y0) * hd)));
    c.getContext('2d').drawImage(art, x0 * hd, y0 * hd, (x1 - x0) * hd, (y1 - y0) * hd, 0, 0, c.width, c.height);
    c.hd = hd;
    got.set(key, c);
  }
  return got.get(key);
}

/** A box over painted units [x0, y0, x1, y1], `d` deep from z0 out. */
export function bar(K, L, m, [x0, y0, x1, y1], d, z0 = 0, r = 0.012) {
  const W = K.p.w, w = u(x1 - x0), h = u(y1 - y0);
  return K.put(L.rbox(w, h, d, Math.min(r, w / 2.2, h / 2.2, d / 2.2)), m, X((x0 + x1) / 2, W), Y((y0 + y1) / 2), z0 + d / 2);
}

/** A crop of the painting laid flat over painted units `box` at depth z. */
export function pic(K, L, box, z) {
  const [x0, y0, x1, y1] = box, W = K.p.w;
  return K.put(new L.THREE.PlaneGeometry(u(x1 - x0), u(y1 - y0)), K.pic(cut(K, L, box)), X((x0 + x1) / 2, W), Y((y0 + y1) / 2), z);
}

/** A sheet of paper over `box`: the painting on it, its bottom corners curling off the wall, pinned at `pins`. */
export function paper(K, L, box, pins = []) {
  const [x0, y0, x1, y1] = box, W = K.p.w, w = u(x1 - x0), h = u(y1 - y0);
  const g = new L.THREE.PlaneGeometry(w, h, 8, 12), pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const fx = pos.getX(i) / w + 0.5, fy = pos.getY(i) / h + 0.5;
    const low = Math.max(0, 1 - fy * 3.2), side = Math.abs(fx - 0.5) * 2;
    pos.setZ(i, 0.006 + low * low * side * side * 0.05 + Math.sin(fx * Math.PI) * 0.004);
  }
  g.computeVertexNormals();
  K.put(g, K.pic(cut(K, L, box)), X((x0 + x1) / 2, W), Y((y0 + y1) / 2), 0);
  K.put(new L.THREE.PlaneGeometry(w, h).rotateY(Math.PI), K.plain(L.tone(K.pal.p, 0.92)), X((x0 + x1) / 2, W), Y((y0 + y1) / 2), 0.004);
  for (const [i, j, c] of pins) {
    K.put(L.ball(0.022, 12, 8), K.gloss(c || K.pal.m), X(i, W), Y(j), 0.022);
    K.put(L.cyl(0.005, 0.02, 0.005, 6).rotateX(Math.PI / 2), K.metal('#c8ccd8'), X(i, W), Y(j), 0.01);
  }
}

/** A picture frame: moulding over the outer box, the canvas over the inner one set back a little. */
export function frame(K, L, m, outer, inner, d = 0.06) {
  const [ox0, oy0, ox1, oy1] = outer, [ix0, iy0, ix1, iy1] = inner;
  for (const box of [[ox0, oy0, ox1, iy0], [ox0, iy1, ox1, oy1], [ox0, iy0, ix0, iy1], [ix1, iy0, ox1, iy1]]) bar(K, L, m, box, d, 0, 0.018);
  // a lip inside the moulding, darker, so the canvas sits in a recess
  const lip = K.gloss(L.tone(K.pal.w, 0.6));
  for (const box of [[ix0 - 1, iy0 - 1, ix1 + 1, iy0], [ix0 - 1, iy1, ix1 + 1, iy1 + 1], [ix0 - 1, iy0, ix0, iy1], [ix1, iy0, ix1 + 1, iy1]]) bar(K, L, lip, box, d * 0.6, 0, 0.004);
  bar(K, L, K.plain(L.tone(K.pal.w, 0.5)), inner, 0.012);
  pic(K, L, inner, 0.02);
}

/** A rectangular window: the frame over `outer`, the pane over `glass` set back, bars over `bars`, a sill over `sill`. */
export function sash(K, L, { outer, glass, bars = [], sill, wood = K.wood() }) {
  const [ox0, oy0, ox1, oy1] = outer, [gx0, gy0, gx1, gy1] = glass, d = 0.08;
  for (const box of [[ox0, oy0, ox1, gy0], [ox0, gy1, ox1, oy1], [ox0, gy0, gx0, gy1], [gx1, gy0, ox1, gy1]]) bar(K, L, wood, box, d);
  bar(K, L, K.plain('#1a2030'), glass, 0.01);
  pic(K, L, glass, 0.03);
  for (const box of bars) bar(K, L, wood, box, 0.05, 0.02, 0.008);
  K.put(new L.THREE.PlaneGeometry(u(gx1 - gx0), u(gy1 - gy0)), K.glass(), X((gx0 + gx1) / 2, K.p.w), Y((gy0 + gy1) / 2), 0.075);
  if (sill) bar(K, L, K.wood(L.tone(K.pal.w, 1.1)), sill, 0.17, 0, 0.015);
}

/** A ring frame (outer and inner radius in units) round (cx, cy), `d` deep: a flat annulus, its edges rounded. */
export function ring(K, L, m, cx, cy, ro, ri, d, sy = 1) {
  const { THREE } = L, sh = new THREE.Shape(), hole = new THREE.Path();
  sh.absellipse(0, 0, u(ro), u(ro) * sy, 0, Math.PI * 2, false);
  hole.absellipse(0, 0, u(ri), u(ri) * sy, 0, Math.PI * 2, true);
  sh.holes.push(hole);
  const bev = Math.min(0.012, d / 3), g = new THREE.ExtrudeGeometry(sh, { depth: d - bev * 2, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 2, curveSegments: 40 });
  g.translate(0, 0, bev);
  return K.put(g, m, X(cx, K.p.w), Y(cy), 0);
}

/** A disc or oval of the painting (a window's view, a clock face) cut from its box round (cx, cy), at depth z. */
export function round(K, L, m, cx, cy, r, z, sy = 1) {
  const g = new L.THREE.CircleGeometry(u(r), 40);
  g.scale(1, sy, 1);
  return K.put(g, m, X(cx, K.p.w), Y(cy), z);
}

/** An arch's outline, x0..x1 wide, its straight sides from `spring` down to `foot`, in painted units round (cx, ·). */
export function archShape(L, cx, x0, x1, spring, foot, W) {
  const { THREE } = L, r = (x1 - x0) / 2, sh = new THREE.Shape();
  sh.moveTo(X(x0, W), Y(foot)); sh.lineTo(X(x1, W), Y(foot)); sh.lineTo(X(x1, W), Y(spring));
  sh.absarc(X(cx, W), Y(spring), u(r), 0, Math.PI, false);
  sh.lineTo(X(x0, W), Y(foot));
  return sh;
}

/** Uvs for a flat shape over painted box [x0, y0, x1, y1], so its crop lands where it was painted. */
export function boxUV(g, box, W) {
  const [x0, y0, x1, y1] = box, pos = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) - X(x0, W)) / u(x1 - x0), (pos.getY(i) - Y(y1)) / u(y1 - y0));
}

const POSTERS = Object.keys(MOTIFS).map(m => `${m}poster`).join(' ');
const PICS = ['mountain', 'sea', 'forest', 'night', 'volcano', 'desert', 'city', 'sunset'].map(id => `${id}pic`).join(' ');

export const SHAPES = {
  window: { make: 'sashwindow', outer: [3, 14, 61, 70], glass: [7, 18, 57, 66], bars: [[30, 18, 34, 66], [7, 40, 57, 44]], sill: [1, 70, 63, 76] },
  smallwindow: { make: 'sashwindow', outer: [3, 18, 29, 64], glass: [6, 21, 26, 61], bars: [[15, 21, 17, 61], [6, 40, 26, 43]], sill: [1, 64, 31, 69], potted: true },
  curtains: { make: 'curtainwindow' },
  roundwindow: { make: 'porthole' },
  archwindow: { make: 'archwindow' },
  poster: { make: 'poster', box: [4, 20, 28, 56], pins: [[16, 21]] },
  [POSTERS]: { make: 'poster', box: [4, 18, 28, 58], pins: [[16, 19]] },
  painting: { make: 'picture', outer: [6, 18, 58, 62], inner: [10, 22, 54, 58], gilt: true },
  [PICS]: { make: 'picture', outer: [4, 16, 60, 68], inner: [9, 21, 55, 63] },
  wallshelf: { make: 'wallshelf' },
  clock: { make: 'wallclock' },
  mirror: { make: 'ovalmirror' },
};

export const MAKES = {
  sashwindow(K, s, W, D, L) {
    sash(K, L, s);
    if (s.potted) {   // the small window's pot of herbs on its sill
      const { cyl, blob } = L;
      K.put(cyl(u(5), u(6), u(4), 18), K.plain(K.pal.pot), X(16, W), Y(61), 0.08);
      for (const [dx, dy, r] of [[0, 0, 4], [-3, 1, 3], [3, 1.5, 3]]) K.put(blob(u(r * 2), u(r * 1.8), u(r * 2), 0.8, 0.7), K.gloss(K.pal.leaf), X(16 + dx, W), Y(55 + dy), 0.08);
    }
  },

  curtainwindow(K, s, W, D, L) {
    const { cyl, ball } = L;
    sash(K, L, { outer: [8, 18, 56, 70], glass: [11, 21, 53, 67], bars: [[30, 21, 34, 67], [11, 42, 53, 45]], sill: [6, 70, 58, 76] });
    // the rod with its finials, then a curtain either side hanging in folds, caught back by a tie
    K.put(cyl(u(1.6), u(60), u(1.6), 14).rotateZ(Math.PI / 2), K.metal(), X(32, W), Y(14), 0.2);
    for (const i of [2, 62]) K.put(ball(u(2.8), 14, 10), K.gloss(K.pal.a), X(i, W), Y(14), 0.2);
    const cloth = K.cloth(), tie = K.cloth(K.pal.a);
    for (const [x0, toward] of [[2, 1], [48, -1]]) {
      for (let f = 0; f < 5; f++) {
        // each fold a tube hanging from the rod, drawn in towards the window at the tie
        const x = x0 + 1.4 + f * 2.8, pinch = (x0 + 7 - x) * 0.55, len = u(58 - f * 0.8);
        const pts = [[X(x, W), Y(16), 0.19], [X(x + pinch * 0.5, W), Y(36), 0.2], [X(x0 + 7 + (f - 2) * 0.6, W), Y(51), 0.21], [X(x - toward * 0.8, W), Y(16) - len, 0.19]];
        const curve = new L.THREE.CatmullRomCurve3(pts.map(p => new L.THREE.Vector3(...p)));
        K.put(new L.THREE.TubeGeometry(curve, 24, u(1.9), 10, false), cloth, 0, 0, 0);
      }
      K.put(L.rbox(u(13), u(3), 0.05, 0.012), tie, X(x0 + 7, W), Y(51.5), 0.22);
    }
  },

  porthole(K, s, W, D, L) {
    const { rbox, ball } = L, wood = K.wood();
    bar(K, L, K.plain('#1a2030'), [5, 27, 28, 50], 0.01);
    round(K, L, K.pic(cut(K, L, [3, 25, 30, 52])), 16.5, 38.5, 13.5, 0.03).scale(1, 1, 1);
    ring(K, L, wood, 16.5, 38.5, 14.2, 10.5, 0.09);
    K.put(rbox(u(3), u(21), 0.05, 0.008), wood, X(16.5, W), Y(38.5), 0.045);
    K.put(rbox(u(21), u(3), 0.05, 0.008), wood, X(16.5, W), Y(38.5), 0.045);
    round(K, L, K.glass(), 16.5, 38.5, 10.5, 0.08);
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; K.put(ball(u(1.7), 12, 8), K.metal(K.pal.a), X(16.5 + Math.cos(a) * 12.2, W), Y(38.5 + Math.sin(a) * 12.2), 0.09); }
  },

  archwindow(K, s, W, D, L) {
    const { THREE, rbox, ball } = L, wood = K.wood();
    // the frame: the outer arch with the inner one cut out, the pane in the hole set back
    const outer = archShape(L, 32, 10, 54, 32, 71, W), hole = archShape(L, 32, 14, 50, 32, 68, W);
    outer.holes.push(hole);
    const fg = new THREE.ExtrudeGeometry(outer, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2, curveSegments: 32 });
    K.put(fg, wood, 0, 0, 0.01);
    const pg = new THREE.ShapeGeometry(archShape(L, 32, 14, 50, 32, 68, W), 32);
    boxUV(pg, [13, 13, 51, 69], W);
    K.put(pg.clone(), K.plain('#1a2030'), 0, 0, 0.005);
    K.put(pg, K.pic(cut(K, L, [13, 13, 51, 69])), 0, 0, 0.03);
    K.put(rbox(u(3), u(54), 0.05, 0.008), wood, X(32.5, W), Y(41), 0.045);
    K.put(rbox(u(36), u(3), 0.05, 0.008), wood, X(32, W), Y(41.5), 0.045);
    K.put(L.torus(u(10), u(1.3), Math.PI, 28), wood, X(32, W), Y(32), 0.05);
    const glass = new THREE.ShapeGeometry(archShape(L, 32, 14, 50, 32, 68, W), 32);
    K.put(glass, K.glass(), 0, 0, 0.076);
    bar(K, L, K.wood(L.tone(K.pal.w, 1.1)), [8, 70, 56, 75], 0.17, 0, 0.015);
    K.put(ball(u(3), 14, 10), K.gloss(K.pal.a), X(32, W), Y(10.5), 0.05);
  },

  poster(K, s, W, D, L) {
    paper(K, L, s.box, s.pins);
  },

  picture(K, s, W, D, L) {
    frame(K, L, s.gilt ? K.metal(K.pal.a) : K.wood(), s.outer, s.inner, s.gilt ? 0.07 : 0.055);
  },

  wallshelf(K, s, W, D, L) {
    const { rbox, cyl, blob, ball } = L, wood = K.wood(), r = K.r;
    // the plank and two brackets under it
    bar(K, L, wood, [2, 48, 62, 53], 0.24, 0, 0.012);
    for (const bx of [8, 52]) {
      const g = new L.THREE.Shape([[0, 0], [u(4), 0], [u(4), -u(2)], [0.012, -0.2], [0, -0.2]].map(([a, b]) => new L.THREE.Vector2(a, b)));
      const geo = new L.THREE.ExtrudeGeometry(g, { depth: u(4), bevelEnabled: false });
      geo.rotateY(-Math.PI / 2);
      K.put(geo, K.wood(L.tone(K.pal.w, 0.8)), X(bx + 4, W), Y(53), 0);
    }
    // books stood on the plank, leaning the last one
    let bx = 5, i = 0;
    while (bx < 23) {
      const bw = 2.6 + ((i * 2) % 3) * 0.8, bh = 13 + ((i * 5) % 5), c = BOOKS[(i * 5) % BOOKS.length];
      K.put(rbox(u(bw), u(bh), 0.15, 0.006), K.gloss(c), X(bx + bw / 2, W), Y(48 - bh / 2), 0.12);
      K.put(rbox(u(bw) + 0.002, u(1), 0.152, 0.002), K.gloss(L.tone(c, 1.25)), X(bx + bw / 2, W), Y(48 - bh + 2), 0.12);
      bx += bw + 0.2; i++;
    }
    // a pot of leaves and a round vase
    K.put(cyl(u(5.5), u(10), u(4.5), 20), K.plain(K.pal.pot), X(35, W), Y(43), 0.12);
    for (const [dx, dy, rr] of [[0, 0, 6], [-4, 2, 4.5], [4, 2, 4.5], [0, -3, 4]]) K.put(blob(u(rr * 2), u(rr * 1.7), u(rr * 2), 0.8, 0.7), K.gloss(K.pal.leaf), X(35 + dx, W), Y(34 + dy), 0.12 + r() * 0.02);
    K.put(ball(u(5), 20, 14), K.gloss(K.pal.a), X(50, W), Y(43), 0.12);
    K.put(cyl(u(2), u(3), u(2.6), 14), K.gloss(L.tone(K.pal.a, 0.8)), X(50, W), Y(37.5), 0.12);
  },

  wallclock(K, s, W, D, L) {
    const { cyl, rbox, ball } = L, wood = K.wood(), ink = K.plain('#303038'), cx = 16, cy = 32;
    // the case: a wooden drum, the face set into it under a glass dome, hands at ten past ten
    K.put(cyl(u(12), 0.08, u(12), 40).rotateX(Math.PI / 2), wood, X(cx, W), Y(cy), 0.04);
    ring(K, L, K.wood(L.tone(K.pal.w, 1.15)), cx, cy, 12.4, 9.6, 0.1);
    round(K, L, K.plain(K.pal.p), cx, cy, 9.6, 0.081);
    for (let h = 0; h < 12; h++) {
      const a = h * Math.PI / 6, big = h % 3 === 0;
      K.put(rbox(u(big ? 1.2 : 0.7), u(big ? 2.4 : 1.5), 0.006), ink, X(cx + Math.sin(a) * 7.6, W), Y(cy - Math.cos(a) * 7.6), 0.085, 0, 0, -a);
    }
    for (const [len, a, wd] of [[5, -Math.PI / 3 * 1, 1.3], [7.5, Math.PI / 3, 0.9]]) {
      const hand = rbox(u(wd), u(len), 0.006, 0.002);
      hand.translate(0, u(len) / 2, 0); hand.rotateZ(-a);
      K.put(hand, ink, X(cx, W), Y(cy), 0.09);
    }
    K.put(cyl(u(1.2), 0.012, u(1.2), 12).rotateX(Math.PI / 2), K.gloss(K.pal.c), X(cx, W), Y(cy), 0.096);
    const dome = new L.THREE.SphereGeometry(u(9.6), 32, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    dome.scale(1, 0.25, 1); dome.rotateX(Math.PI / 2);
    K.put(dome, K.glass(), X(cx, W), Y(cy), 0.082);
    // the pendulum on its rod
    K.put(rbox(u(1.4), u(12), 0.012, 0.004), K.metal(), X(cx, W), Y(50), 0.03);
    K.put(cyl(u(3.4), 0.03, u(3.4), 24).rotateX(Math.PI / 2), K.metal(K.pal.a), X(cx, W), Y(58), 0.035);
    K.put(ball(u(1.2), 10, 8), K.metal('#e8ecf4'), X(cx - 1, W), Y(57), 0.05);
  },

  ovalmirror(K, s, W, D, L) {
    const { ball } = L, cx = 16, cy = 40, sy = 22 / 12;
    ring(K, L, K.wood(), cx, cy, 12, 8.4, 0.07, sy);
    ring(K, L, K.wood(L.tone(K.pal.w, 1.18)), cx, cy, 9.4, 8.2, 0.08, sy);
    // the glass: a pale silvered oval, a streak of light across it
    const m = new L.THREE.MeshStandardMaterial({ color: '#cfe6f2', roughness: 0.08, metalness: 0.75, emissive: '#5a7488', emissiveIntensity: 0.35 });
    m.userData.kind = 'plain';
    round(K, L, m, cx, cy, 8.4, 0.04, sy);
    for (const [dx, dy, len, wd] of [[-3, -6, 12, 1.4], [0.5, -5, 7, 0.9]]) {
      const g = new L.THREE.PlaneGeometry(u(wd), u(len)); g.rotateZ(-0.35);
      K.put(g, K.plain('#ffffff'), X(cx + dx, W), Y(cy + dy), 0.042);
    }
    K.put(ball(u(2.6), 14, 10), K.gloss(K.pal.a), X(cx, W), Y(18), 0.05);
  },
};
