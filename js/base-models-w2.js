/* base-models-w2.js  -  wall pieces, batch 2: cloth and paper (the 13 motif banners, tapestries, scrolls, flags, the
   sky and alphabet banners, the noren, hot spring and shower curtains, the calendar, treasure map, posters, sticky notes
   and charts). Same frame and helpers as js/base-models-w.js (its head says how a wall piece is built).

   Cloth is `drape()`: a crop of the painting on a finely cut sheet whose depth is a function of where you are on it, so
   folds, ripples and curls are real. Its edge is the painting's own (alphaTest), so a swallowtail or a ragged map keeps
   its outline; rods, rings, poles, cords and pins are modelled around it. */

import { X, Y, u, cut, whole, bar, pic, paper, ring } from './base-models-w.js';
import { MOTIFS } from './base-furniture-kinds.js';

/** A sheet of the painting over painted box `box`, its depth `z(fx, fy)` (0..1 across and down), turned `rz` about its middle. */
export function drape(K, L, box, z, rz = 0, seg = [14, 20], keep = null) {
  const [x0, y0, x1, y1] = box, w = u(x1 - x0), h = u(y1 - y0);
  const g = new L.THREE.PlaneGeometry(w, h, seg[0], seg[1]), pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setZ(i, z(pos.getX(i) / w + 0.5, 0.5 - pos.getY(i) / h));
  g.computeVertexNormals();
  // a plain one shares the whole painting with the piece's other sheets (a copy of it: its material is cut out by alpha)
  const m = keep ? K.pic(clipped(cut(K, L, box), box, keep)) : whole(K, L, g, box, twin(K.p.art(0, L.HD, true)));
  m.alphaTest = 0.5;
  m.side = L.THREE.DoubleSide;
  return K.put(g, m, X((x0 + x1) / 2, K.p.w), Y((y0 + y1) / 2), 0, 0, 0, rz);
}

const twins = new WeakMap();
const twin = (art) => {
  if (!twins.has(art)) { const c = new OffscreenCanvas(art.width, art.height); c.getContext('2d').drawImage(art, 0, 0); c.hd = art.hd; twins.set(art, c); }
  return twins.get(art);
};

const clips = new WeakMap();
/** A crop with every pixel outside `keep(i, j)` (painted units) cleared: a cut the painting filled with its shadow. */
function clipped(c, [x0, y0], keep) {
  if (clips.has(c)) return clips.get(c);
  const out = new OffscreenCanvas(c.width, c.height), g = out.getContext('2d'), hd = c.hd;
  g.drawImage(c, 0, 0);
  const img = g.getImageData(0, 0, c.width, c.height);
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (!keep(x0 + (x + 0.5) / hd, y0 + (y + 0.5) / hd)) img.data[(y * c.width + x) * 4 + 3] = 0;
  g.putImageData(img, 0, 0);
  out.hd = hd;
  clips.set(c, out);
  return out;
}

/** A rod across painted x0..x1 at height j, r units round, `z` out from the wall, a knob at each end. */
export function rod(K, L, m, x0, x1, j, r, z, knob = K.gloss(K.pal.a), kr = r * 1.5) {
  const W = K.p.w;
  K.put(L.cyl(u(r), u(x1 - x0), u(r), 16).rotateZ(Math.PI / 2), m, X((x0 + x1) / 2, W), Y(j), z);
  if (knob) for (const i of [x0, x1]) K.put(L.ball(u(kr), 14, 10), knob, X(i, W), Y(j), z);
}

/** A cord through painted points [i, j, z]. */
export function cord(K, L, m, pts, r = 0.5) {
  const W = K.p.w, curve = new L.THREE.CatmullRomCurve3(pts.map(([i, j, z]) => new L.THREE.Vector3(X(i, W), Y(j), z)));
  K.put(new L.THREE.TubeGeometry(curve, 16, u(r), 6, false), m, 0, 0, 0);
}

/** A nail in the wall at painted (i, j), its head out from it. */
export function nail(K, L, i, j) {
  K.put(L.cyl(u(0.4), 0.03, u(0.4), 6).rotateX(Math.PI / 2), K.metal('#c8ccd8'), X(i, K.p.w), Y(j), 0.015);
  K.put(L.ball(u(0.9), 10, 8), K.metal('#d8dce4'), X(i, K.p.w), Y(j), 0.03);
}

/** A five-point star `r` units round, `d` deep, laid on the wall at painted (i, j). */
export function star(K, L, m, i, j, r, z, d = 0.012) {
  const sh = new L.THREE.Shape();
  for (let n = 0; n < 10; n++) {
    const a = Math.PI / 2 + n * Math.PI / 5, rr = n % 2 ? u(r) * 0.45 : u(r);
    n ? sh.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : sh.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  K.put(new L.THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 1 }), m, X(i, K.p.w), Y(j), z);
}

const wave = (f, n, a) => Math.sin(f * Math.PI * n) * a;

const BANNERS = Object.keys(MOTIFS).map(m => `${m}banner`).join(' ');
const TAPESTRIES = ['crown', 'sword', 'tower', 'key', 'fleur', 'shield'].map(c => `${c}tapestry`).join(' ');
const SCROLLS = ['crane', 'fuji', 'bamboo', 'koi', 'moon', 'wave'].map(c => `${c}scroll`).join(' ');
const FLAGS = ['skull', 'swords', 'anchor', 'kraken', 'ball', 'compass'].map(c => `${c}flag`).join(' ');

export const SHAPES = {
  // a hung cloth: its rod [x0, x1, j, r], the nail its cord hangs from, the cloth's box, how deep its folds go
  [BANNERS]: { make: 'hungcloth', rod: [1, 31, 15, 1.8], nail: [16, 5], cloth: [4, 16, 28, 70], folds: 3, deep: 0.008 },
  [TAPESTRIES]: { make: 'hungcloth', rod: [3, 29, 13, 1.5], nail: [16, 5], cloth: [6, 13, 26, 72], folds: 4, deep: 0.012, notch: true },
  skybanner: { make: 'hungcloth', rod: [3, 29, 7.5, 1.5], nail: [16, 2], cloth: [6, 8, 26, 87], folds: 3, deep: 0.008, gold: true },
  [SCROLLS]: { make: 'hangscroll' },
  [FLAGS]: { make: 'wallflag' },
  alphabet: { make: 'letterline' },
  noren: { make: 'curtain', rod: [2, 62, 13.5, 1.5], panels: [[4, 15, 22, 61], [23, 15, 41, 61], [42, 15, 60, 61]] },
  onsensign: { make: 'curtain', rod: [1, 31, 11.5, 1.5], panels: [[3, 13, 16, 57], [16, 13, 29, 57]] },
  showercurtain: { make: 'showercurtain' },
  calendar: { make: 'calendar' },
  treasuremap: { make: 'parchment' },
  wantedposter: { make: 'poster', box: [3, 14, 29, 54], pins: [[16, 15]] },
  concertposter: { make: 'poster', box: [4, 16, 28, 56], pins: [[16, 17]] },
  coffeeposter: { make: 'poster', box: [5, 14, 27, 46], pins: [[7.5, 16], [24.5, 16]] },
  pixelposter: { make: 'poster', box: [4, 16, 28, 58], pins: [[6.5, 18], [25.5, 18]] },
  saleschart: { make: 'poster', box: [4, 16, 28, 46], pins: [[16, 16.5]] },
  typechart: { make: 'poster', box: [4, 14, 60, 58], pins: [[6.5, 16], [57.5, 16]] },
  starchart: { make: 'starchart' },
  stickywall: { make: 'stickynotes' },
  elementchart: { make: 'wallboard', box: [3, 14, 61, 54] },
  timetable: { make: 'wallboard', box: [4, 14, 28, 58], clock: [24, 17] },
};

export const MAKES = {
  hungcloth(K, s, W, D, L) {
    const [x0, x1, j, r] = s.rod, z = u(r) + 0.02, gold = K.metal(K.pal.a);
    rod(K, L, s.gold ? gold : K.wood(L.tone(K.pal.w, 0.9)), x0, x1, j, r, z, s.gold ? gold : K.gloss(K.pal.a));
    // a cord from the nail to either end of the rod
    nail(K, L, ...s.nail);
    const [ni, nj] = s.nail, rope = K.plain(L.tone(K.pal.m, 0.9));
    cord(K, L, rope, [[ni, nj + 0.5, 0.03], [(ni + x0 + 3) / 2, (nj + j) / 2, z * 0.6], [x0 + 3, j - r, z]]);
    cord(K, L, rope, [[ni, nj + 0.5, 0.03], [(ni + x1 - 3) / 2, (nj + j) / 2, z * 0.6], [x1 - 3, j - r, z]]);
    // the cloth falls from the rod back towards the wall, in soft folds that open out lower down
    // a tapestry's foot is cut in a V, which its painting filled with the shadow behind
    const keep = s.notch ? (i, j) => Math.abs(i - 16) >= j - 62 : null;
    drape(K, L, s.cloth, (fx, fy) => z - u(r) * 0.4 - fy * z * 0.55 + wave(fx, s.folds, s.deep) * (0.4 + fy), 0, [14, 20], keep);
  },

  hangscroll(K, s, W, D, L) {
    const ink = K.gloss('#2a2a30'), wood = K.wood(L.tone(K.pal.w, 0.8));
    nail(K, L, 16, 4.5);
    cord(K, L, K.plain('#3a3038'), [[16, 5, 0.03], [13, 7.5, 0.03], [9.5, 10.5, 0.03]]);
    cord(K, L, K.plain('#3a3038'), [[16, 5, 0.03], [19, 7.5, 0.03], [22.5, 10.5, 0.03]]);
    rod(K, L, wood, 7.5, 24.5, 10.6, 0.9, 0.03, null);
    // the paper hangs flat, curling out a little into the weighted roller at its foot
    drape(K, L, [8, 11, 24, 72], (fx, fy) => 0.018 + Math.sin(fy * Math.PI) * 0.004 + Math.max(0, fy - 0.9) ** 2 * 1.2);
    rod(K, L, K.wood(), 6.5, 25.5, 73.5, 1.6, 0.035, null);
    for (const i of [5.6, 26.4]) K.put(L.cyl(u(2), u(1.8), u(2), 16).rotateZ(Math.PI / 2), ink, X(i, W), Y(73.5), 0.035);
  },

  wallflag(K, s, W, D, L) {
    const z = 0.13, metal = K.metal('#8a8e98');
    // a pole stood off the wall on two brackets, a gold knob on top, the flag rippling out from it
    K.put(L.cyl(u(1.1), u(70), u(1.1), 14), K.wood(), X(5, W), Y(43), z);
    K.put(L.ball(u(2.2), 14, 10), K.metal('#e8c040'), X(5, W), Y(7), z);
    for (const j of [22, 68]) {
      K.put(L.rbox(u(1.6), u(1.6), z, 0.004), metal, X(5, W), Y(j), z / 2);
      K.put(L.torus(u(1.6), u(0.5), Math.PI * 2, 14).rotateX(Math.PI / 2), metal, X(5, W), Y(j), z);
      K.put(L.rbox(u(4), u(4), 0.01, 0.003), metal, X(5, W), Y(j), 0.005);
    }
    drape(K, L, [6, 9, 29.5, 43], (fx, fy) => z + Math.sin(fx * Math.PI * 2.2 + fy * 0.6) * 0.035 * Math.min(1, fx * 3) - fx * 0.03, 0, [20, 12]);
  },

  letterline(K, s, W, D, L) {
    const sag = (i) => 18 + Math.sin(Math.max(0, Math.min(59, i)) / 59 * Math.PI) * 6, r = K.r;
    for (const i of [2, 61]) nail(K, L, i, 18);
    const pts = [];
    for (let i = 0; i <= 59; i += 4) pts.push([2 + i, sag(i) + 0.5, 0.03 + Math.sin(i / 59 * Math.PI) * 0.03]);
    pts.push([61, 18.5, 0.03]);
    cord(K, L, K.plain(K.pal.m), pts, 0.45);
    // a card on a peg every ten units, hanging a little crooked
    for (let n = 0; n < 6; n++) {
      const cx = 3 + n * 10, top = Math.round(sag(5 + n * 10)) + 1, z = 0.035 + Math.sin((5 + n * 10) / 59 * Math.PI) * 0.03;
      const box = [cx, top, cx + 9, top + 11], tilt = (r() - 0.5) * 0.14;
      drape(K, L, box, (fx, fy) => z + fy * 0.006, tilt, [2, 2]);
      K.put(L.rbox(u(8.6), u(10.6), 0.012, 0.003), K.plain(L.tone(K.pal.p, 0.9)), X(cx + 4.5, W), Y(top + 5.5), z - 0.008, 0, 0, tilt);
      K.put(L.rbox(u(1.4), u(3.4), 0.02, 0.004), K.wood(), X(cx + 4.5, W), Y(top + 0.6), z + 0.01);
    }
  },

  curtain(K, s, W, D, L) {
    const [x0, x1, j, r] = s.rod, z = u(r) + 0.02, n = s.panels.length;
    rod(K, L, K.wood(), x0, x1, j, r, z, K.wood(L.tone(K.pal.w, 0.75)), r * 1.2);
    for (const i of [x0 + 2, x1 - 2]) K.put(L.rbox(u(2), u(3), z, 0.004), K.metal('#8a8e98'), X(i, W), Y(j), z / 2);
    // each panel hangs on its own, swaying a little apart at the hem
    s.panels.forEach((box, p) => {
      const lean = n === 1 ? 0 : (p / (n - 1) - 0.5) * 2;
      drape(K, L, box, (fx, fy) => z - u(r) * 0.3 + wave(fx, 1, 0.006) + fy * fy * 0.02 * (1 + lean * (fx - 0.5)), 0, [8, 16]);
    });
  },

  showercurtain(K, s, W, D, L) {
    const z = 0.07, chrome = K.metal('#c8ccd8');
    rod(K, L, chrome, 4, 60, 14.5, 1.3, z, chrome, 1.8);
    for (let i = 0; i < 8; i++) K.put(L.torus(u(2), u(0.45), Math.PI * 2, 16).rotateY(Math.PI / 2), K.gloss(K.pal.a), X(7 + Math.floor(i * 7.4), W), Y(16.5), z);
    // its folds where they were painted: each lighter stripe stands out, each darker one falls back
    drape(K, L, [5, 18, 59, 74], (fx, fy) => z - 0.005 + Math.sin(fx * 54 / 2.2) * 0.022 + fy * 0.012, 0, [54, 14]);
  },

  calendar(K, s, W, D, L) {
    nail(K, L, 16, 15);
    K.put(L.torus(u(2.2), u(0.35), Math.PI * 2, 16), K.metal('#a8acb4'), X(16, W), Y(18), 0.02);
    // a card back, the pages under it peeking at the foot, the month on top lifting at its corners
    bar(K, L, K.plain(L.tone(K.pal.p, 0.75)), [6, 20, 26, 56.6], 0.01);
    for (const [d, dj] of [[0.014, 0.4], [0.018, 0.2]]) bar(K, L, K.plain(L.tone(K.pal.p, 0.97)), [6.3, 21, 25.7, 56 + dj], d, 0, 0.002);
    drape(K, L, [6, 20, 26, 56], (fx, fy) => 0.022 + Math.max(0, fy - 0.75) ** 2 * Math.abs(fx - 0.5) * 0.5, 0, [8, 12]);
    for (let i = 8; i <= 24; i += 2) K.put(L.torus(u(1), u(0.3), Math.PI * 2, 10).rotateY(Math.PI / 2), K.metal('#a8acb4'), X(i, W), Y(20.5), 0.024);
  },

  parchment(K, s, W, D, L) {
    // the map rolled at its top and foot, as if just unrolled and tacked up
    drape(K, L, [3, 18, 29, 50], (fx, fy) => 0.012 + Math.max(0, 1 - fy / 0.14) ** 2 * 0.05 + Math.max(0, (fy - 0.86) / 0.14) ** 2 * 0.05 + wave(fx, 2, 0.004), 0, [14, 24]);
    for (const i of [6, 26]) K.put(L.ball(u(1.3), 12, 8).scale(1, 1, 0.5), K.metal('#d8b048'), X(i, W), Y(21.5), 0.04);
  },

  starchart(K, s, W, D, L) {
    paper(K, L, [4, 14, 28, 52], [[7, 15.5], [25, 15.5]]);
    // the gold stars are stickers stood off the paper
    const gold = K.gloss('#f0c020');
    [3, 2, 4, 1, 3].forEach((n, j) => { for (let i = 0; i < n; i++) star(K, L, gold, 14.5 + i * 3, 24.5 + j * 6, 1.7, 0.012); });
  },

  stickynotes(K, s, W, D, L) {
    const r = K.r;
    for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) {
      const px = 4 + i * 9, py = 16 + j * 10 + (i % 2), lift = 0.02 + r() * 0.02;
      drape(K, L, [px, py, px + 8, py + 8], (fx, fy) => 0.006 + fy * fy * lift, (r() - 0.5) * 0.16, [3, 6]);
    }
  },

  wallboard(K, s, W, D, L) {
    const [x0, y0, x1, y1] = s.box, metal = K.metal('#a8acb4');
    bar(K, L, K.plain(L.tone(K.pal.p, 0.8)), s.box, 0.024);
    pic(K, L, s.box, 0.026);
    for (const box of [[x0 - 1, y0 - 1, x1 + 1, y0], [x0 - 1, y1, x1 + 1, y1 + 1], [x0 - 1, y0, x0, y1], [x1, y0, x1 + 1, y1]]) bar(K, L, metal, box, 0.034, 0, 0.006);
    if (s.clock) ring(K, L, metal, ...s.clock, 2.6, 1.8, 0.04);
  },
};
