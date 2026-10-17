/* base-models-jigglypuff.js  -  the Jigglypuff room's models (furniture expansion session a, 2026-10-17), built from parts
   like the arcade cabinets (js/base-models-f.js's head says how a batch works). Their paintings are
   js/base-furniture-jigglypuff.js, whose shared parts (the ear, the curl, the eyes, in fractions of a head's radius) both
   files build from, so a piece's model stands where its painting does: `X(n, W)` is painted unit n across as x from the
   middle, `u(h)` h painted units up (a wall piece's `WY(j)` j units down the wall). In Jigglypuff's own colours, so none
   reads the theme's palette. */

import { PINK, ROSE, DEEP, TEAL, TEALD, INK, CREAM, MIC, GLOW, BULB, MOON, STONE, SCREEN, EAR, TUFT, EYE, NOTES, NOTE,
  STAGE_CURL, BALLOONS, earInner, scribble, portrait } from './base-furniture-jigglypuff.js';
import { tube, rod } from './base-models-kit.js';

const u = (n) => n / 32;
const X = (n, W = 1) => n / 32 - W / 2;
const WY = (j) => (96 - j) / 32;
const TAU = Math.PI * 2;

const sheet = (w, h, draw) => { const c = new OffscreenCanvas(w, h); draw(c.getContext('2d'), w, h); return c; };
const pics = {};
const once = (key, make) => pics[key] || (pics[key] = make());
const scribbleSheet = () => once('scribble', () => sheet(128, 128, (g, w, h) => scribble(g, 0, 0, w, h)));
const portraitSheet = () => once('portrait', () => sheet(144, 192, (g, w, h) => portrait(g, 0, 0, w, h)));

/* ----- surfaces a face is put on: where its front is at (x, y), and how it turns there ----- */
const ellipsoid = (x, y, z, a, b, c) => ({
  z: (px, py) => z + c * Math.sqrt(Math.max(0, 1 - ((px - x) / a) ** 2 - ((py - y) / b) ** 2)),
  turn(px, py) {
    const nx = (px - x) / (a * a), ny = (py - y) / (b * b), nz = (this.z(px, py) - z) / (c * c);
    return [Math.atan2(nx, nz), -Math.atan2(ny, Math.hypot(nx, nz))];
  },
});
const plane = (z) => ({ z: () => z, turn: () => [0, 0] });
const drum = (r) => ({ z: (px) => Math.sqrt(Math.max(0, r * r - px * px)), turn: (px) => [Math.asin(Math.max(-1, Math.min(1, px / r))), 0] });
/** Puts a part on surface S at (px, py), turned to face out there, `dz` further out. */
function onS(put, S, geo, m, px, py, dz = 0) {
  const [ry, rx] = S.turn(px, py);
  return put(geo, m, px, py, S.z(px, py) + dz, ry, rx);
}

/* ----- Jigglypuff's parts ----- */
/** An ear from its base points b1, b2 to its tip ([x, y] each), standing at depth z: a flattened cone, its inside dark. */
function ear(K, L, put, m, b1, b2, tip, z, seg = 12) {
  const cone = (p1, p2, t, mat, dz) => {
    const mx = (p1[0] + p2[0]) / 2, my = (p1[1] + p2[1]) / 2, dx = t[0] - mx, dy = t[1] - my, rb = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 2;
    put(L.cyl(rb * 0.05, Math.hypot(dx, dy), rb, seg).scale(1, 1, 0.36), mat, mx + dx / 2, my + dy / 2, z + dz, 0, 0, -Math.atan2(dx, dy));
    return rb;
  };
  const rb = cone(b1, b2, tip, m, 0);
  const [i1, i2, it] = earInner(b1, b2, tip);
  cone(i1, i2, it, K.plain(INK), rb * 0.11);
}
/** The curl on a head of radius r at (cx, cy), lying on surface S, raised `off` radii. */
function tuft(K, L, put, m, S, cx, cy, r, off = 0, lo = false) {
  const tr = r * 0.075;
  const pts = TUFT.map(([fx, fy]) => { const px = cx + fx * r, py = cy + (fy + off) * r; return [px, py, S.z(px, py) + tr * 0.6]; });
  put(tube(L, pts, tr, lo ? 16 : 28), m);
  put(L.ball(tr, lo ? 6 : 8, lo ? 4 : 6), m, ...pts[pts.length - 1]);
}
/** An open eye on S at (px, py), rx by ry: white, the blue-green iris, its darker middle, a shine. */
function eye(K, L, put, S, px, py, rx, ry, rim = true, lo = false) {
  const t = Math.min(rx, ry) * 0.35;
  const lay = (gx, gy, sx, sy, sz, m, dz, seg = lo ? [8, 5] : [10, 6]) => onS(put, S, L.ball(1, ...seg).scale(sx, sy, sz), m, px + gx, py + gy, dz);
  if (rim) lay(0, 0, rx * 1.1, ry * 1.08, t, K.plain(INK), -t * 0.62);
  lay(0, 0, rx, ry, t, K.plain('#ffffff'), -t * 0.45);
  lay(0, -ry * 0.06, rx * 0.78, ry * 0.8, t, K.gloss(TEAL), -t * 0.25);
  if (!lo) lay(0, -ry * 0.2, rx * 0.5, ry * 0.4, t, K.gloss(L.tone(TEAL, 0.74)), -t * 0.12, [8, 5]);
  lay(-rx * 0.22, ry * 0.3, rx * 0.28, rx * 0.28, t * 0.5, K.plain('#ffffff'), t * 0.5, lo ? [6, 4] : [8, 5]);
}
/** A smile, or a shut eye: the lower half of a ring `w` across, its middle at (px, py) on S. */
function smile(K, L, put, S, px, py, w, lw, m = K.plain(INK), seg = 12) {
  onS(put, S, L.torus(w / 2, lw / 2, Math.PI, seg).rotateZ(Math.PI), m, px, py + w / 4, lw * 0.3);
}
/** Jigglypuff's head at (x, y, z), r round, `zs` as deep as wide: ears, curl, eyes `open` or `shut`, a smile with
    `mouth`. Returns its surface. */
function head(K, L, put, x, y, z, r, o = {}) {
  const zs = o.zs ?? 1, m = o.m || K.gloss(PINK), S = ellipsoid(x, y, z, r, r, r * zs), lo = o.lo;
  put(L.ball(r, lo ? 14 : o.seg || 24, lo ? 10 : 16).scale(1, 1, zs), m, x, y, z);
  const P = ([fx, fy], s) => [x + fx * s * r, y + fy * r];
  if (o.ears !== false) for (const s of [-1, 1]) ear(K, L, put, m, P(EAR.b1, s), P(EAR.b2, s), P(EAR.tip, s), z, lo ? 8 : 12);
  if (o.tuft !== false) tuft(K, L, put, m, S, x, y, r, 0, lo);
  for (const s of [-1, 1]) {
    const ex = x + s * EYE.x * r, ey = y + EYE.y * r;
    if (o.eyes === 'open') eye(K, L, put, S, ex, ey, EYE.rx * r, EYE.ry * r, r > u(8), lo);
    if (o.eyes === 'shut') smile(K, L, put, S, ex, ey, EYE.rx * r * 1.5, Math.max(u(0.6), r * 0.06));
  }
  if (o.mouth) smile(K, L, put, S, x, y - 0.38 * r, r * 0.2, Math.max(u(0.5), r * 0.045), K.plain(INK), lo ? 8 : 12);
  return S;
}
/** An ear pair from the left ear's points [x, y] in painted units (W wide, heights), mirrored for the right. */
function earsAt(K, L, put, m, W, b1, b2, tip, z) {
  for (const s of [1, -1]) {
    const P = ([a, h]) => [X(s > 0 ? a : W * 32 - a, W), u(h)];
    ear(K, L, put, m, P(b1), P(b2), P(tip), z);
  }
}
/** Two little feet: ovals rx by ry painted units at painted x's `xs`. */
function feet(K, L, W, xs, rx, ry, z = 0.15, m = K.gloss(L.tone(PINK, 0.86))) {
  for (const f of xs) K.put(L.ball(u(rx), 10, 6).scale(1, ry / rx, 1.2), m, X(f, W), u(ry * 0.8), z);
}
/** An extruded outline [[x, y]...] in tiles, d deep, centred on z 0. */
const slab = (L, pts, d) => {
  const sh = new L.THREE.Shape(pts.map(([a, b]) => new L.THREE.Vector2(a, b)));
  return new L.THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false }).translate(0, 0, -d / 2);
};
/** A put for parts laid out in their own frame, turned (rx, then ry) about and moved to (x, y, z). */
const posed = (put, x, y, z, ry = 0, rx = 0) => (geo, m, lx = 0, ly = 0, lz = 0) => {
  geo.translate(lx, ly, lz);
  if (rx) geo.rotateX(rx);
  if (ry) geo.rotateY(ry);
  return put(geo, m, x, y, z);
};

export const SHAPES = {
  puffbed: { make: 'puffbed', seat: 0.72 },
  puffchair: { make: 'puffchair', seat: 0.66 },
  puffsofa: { make: 'puffsofa', seat: 0.6 },
  pufftable: { make: 'pufftable', top: u(22) },
  puffdesk: { make: 'puffdesk', top: u(24) },
  puffwardrobe: { make: 'puffwardrobe', play: { does: 'door', inside: 'clothes', double: true } },
  puffdresser: { make: 'puffdresser', top: u(33) },
  puffshelf: { make: 'puffshelf' },
  pufflamp: { make: 'pufflamp', play: { does: 'light' } },
  puffclock: { make: 'puffclock', play: { does: 'ring' } },
  pufftv: { make: 'pufftv', screen: { x: 0, y: u(35), w: u(37), h: u(25), z: 0.292 }, play: { does: 'screen', show: ['cartoon', 'quiz', 'battle', 'news', 'weather'] } },
  puffmirror: { make: 'puffmirror' },
  puffnotes: { make: 'puffnotes' },
  puffportrait: { make: 'puffportrait' },
  puffmic: { make: 'puffmic', play: { does: 'note', voice: 'flute', high: true } },
  puffstage: { make: 'puffstage', seat: 0.32, play: { does: 'light' } },
  puffkaraoke: { make: 'puffkaraoke', screen: { x: 0, y: u(30.5), w: u(17), h: u(10), z: 0.257 }, play: { does: 'screen', show: ['eq'], music: 'bass' } },
  puffpouf: { make: 'puffpouf', seat: 0.6 },
  puffmusicbox: { make: 'puffmusicbox', play: { does: 'player', voice: 'musicbox' } },
  puffmarkers: { make: 'puffmarkers' },
  puffballoons: { make: 'puffballoons', play: { does: 'give', gives: 'balloon' } },
  puffmoonstone: { make: 'puffmoonstone', play: { does: 'light' } },
  puffspotlight: { make: 'puffspotlight', play: { does: 'light' } },
};

export const MAKES = {
  puffbed(K, s, W, D, L) {
    const { rbox, blob, ball } = L, cloth = K.cloth(PINK), cream = K.cloth(CREAM);
    for (const z of [-0.75, 0.75]) feet(K, L, W, [9, 55], 5, 2.5, z);
    K.put(rbox(u(58), u(12), 1.84, u(3)), K.gloss(ROSE), 0, u(9), 0.04);
    K.put(blob(u(60), u(11), 1.5, 0.3, 0.45), cloth, 0, u(18.5), 0.2);
    K.put(blob(u(58), u(4), 0.36, 0.5, 0.6), cream, 0, u(22.6), -0.5);
    K.put(blob(u(40), u(8), 0.42, 0.5, 0.5), cream, 0, u(25), -0.66);
    head(K, L, K.put, 0, u(46), -0.74, u(22), { zs: 0.35, eyes: 'shut', mouth: true, m: cloth });
    // notes printed on the duvet's front
    const deep = K.plain(DEEP);
    for (const [nx, nh] of [[12, 16], [26, 18], [40, 15.5], [52, 18]]) {
      K.put(ball(u(1.6), 8, 5).scale(1, 0.75, 0.4), deep, X(nx, W), u(nh), 0.94);
      K.put(rbox(u(0.7), u(5), 0.01, 0.002), deep, X(nx + 1.35, W), u(nh + 2.5), 0.945);
    }
  },

  puffchair(K, s, W, D, L) {
    const { blob, ball } = L, cloth = K.cloth(PINK);
    feet(K, L, W, [10, 22], 5, 2.5, 0.22);
    K.put(blob(u(24), u(14), 0.66, 0.6, 0.6, 16), cloth, 0, u(11), 0);
    for (const ax of [4, 28]) K.put(ball(u(4), 12, 8).scale(1, 1.25, 1.8), cloth, X(ax), u(22), 0.05);
    K.put(blob(u(26), u(7), 0.74, 0.5, 0.5, 16), K.cloth(ROSE), 0, u(18.5), 0.06);
    head(K, L, K.put, 0, u(42), -0.2, u(12.5), { seg: 20, zs: 0.55, eyes: 'open', mouth: true, m: cloth });
  },

  puffsofa(K, s, W, D, L) {
    const { rbox, blob } = L, cloth = K.cloth(PINK);
    for (const z of [-0.3, 0.3]) feet(K, L, W, [10, 54], 4, 2, z);
    K.put(rbox(u(58), u(9), 0.86, u(3)), cloth, 0, u(7.5), 0);
    K.put(blob(u(54), u(30), 0.32, 0.35, 0.4, 24), cloth, 0, u(29), -0.3);
    earsAt(K, L, K.put, cloth, W, [8, 40], [22, 44], [5, 60], -0.3);
    const front = plane(-0.14);
    tuft(K, L, K.put, cloth, front, 0, u(31), u(13));
    for (const sx of [-1, 1]) eye(K, L, K.put, front, X(32 + sx * 7, W), u(29), u(3.6), u(4.2));
    for (const cx of [19, 45]) K.put(blob(u(26), u(10), 0.62, 0.45, 0.5, 20), K.cloth(ROSE), X(cx, W), u(15), 0.1);
    for (const ax of [7, 57]) K.put(blob(u(14), u(18), 0.84, 0.8, 0.8, 20), cloth, X(ax, W), u(19), 0);
  },

  pufftable(K, s, W, D, L) {
    const { cyl, ball } = L, rose = K.gloss(ROSE), R = u(29);
    feet(K, L, W, [27, 37], 3.5, 1.8, 0.16);
    head(K, L, K.put, 0, u(10), 0, u(9), { eyes: 'open', mouth: true, tuft: false });
    K.put(cyl(R, u(4), R, 40), rose, 0, u(20), 0);
    K.put(cyl(u(25), 0.006, u(25), 40), K.gloss(L.tone(PINK, 1.08)), 0, u(22) + 0.003, 0);
    const curl = [];
    for (let i = 0; i <= 24; i++) { const t = i / 24, a = t * TAU * 1.6, r = u(18) * (1 - t * 0.85); curl.push([Math.cos(a) * r, u(22) + 0.012, Math.sin(a) * r]); }
    K.put(tube(L, curl, u(1.2), 40), K.gloss(DEEP));
    for (let i = 0; i < 7; i++) { const px = X(8 + i * 8, W); K.put(ball(u(0.8), 8, 6), K.plain(CREAM), px, u(20), Math.sqrt(R * R - px * px)); }
  },

  puffdesk(K, s, W, D, L) {
    const { rbox, cyl, ball, THREE } = L, cream = K.gloss(CREAM), rose = K.gloss(ROSE);
    // four marker pens for legs, each standing on its cap
    for (const cx of [9, 55]) for (const z of [-0.3, 0.3]) {
      K.put(cyl(u(3.24), u(5), u(3.24), 16), K.gloss(DEEP), X(cx, W), u(2.5), z);
      K.put(cyl(u(3), u(17), u(3), 16), cream, X(cx, W), u(12.5), z);
      K.put(cyl(u(3.05), u(2.94), u(3.05), 16), rose, X(cx, W), u(11.13), z);
    }
    K.put(rbox(u(22), u(7), 0.5, u(1.5)), K.gloss(PINK), X(25, W), u(16.5), 0.12);
    K.put(ball(u(1.2), 10, 8), K.gloss(DEEP), X(25, W), u(16.5), 0.375);
    K.put(rbox(u(60), u(4), 0.92, u(1.2)), rose, 0, u(22), 0);
    // a marker lying on the top by a scribbled sheet
    K.put(cyl(u(1.5), u(14), u(1.5), 12).rotateZ(Math.PI / 2), cream, X(44, W), u(25.5), 0.2);
    K.put(cyl(u(1.7), u(4), u(1.7), 12).rotateZ(Math.PI / 2), K.gloss(TEAL), X(52, W), u(25.5), 0.2);
    const pic = K.pic(scribbleSheet());
    K.put(new THREE.PlaneGeometry(u(14), u(17)).rotateX(-Math.PI / 2), pic, X(20, W), u(24) + 0.004, 0.08, 0.2);
    // the round pink pinboard behind: Jigglypuff's head, a scribbled sheet pinned to it
    head(K, L, K.put, 0, u(37), -0.36, u(12), { zs: 0.2 });
    K.put(new THREE.PlaneGeometry(u(12), u(12)), pic, 0, u(39), -0.28);
    K.put(ball(u(1), 10, 8), K.gloss(DEEP), 0, u(44), -0.272);
  },

  puffwardrobe(K, s, W, D, L) {
    const { rbox, ball, torus } = L, pink = K.gloss(PINK);
    feet(K, L, W, [10, 22], 4, 2, 0.16);
    K.put(rbox(u(26), u(67), 0.56, u(4)), pink, 0, u(36.5), -0.06);
    earsAt(K, L, K.put, pink, W, [5, 64], [14, 70], [5, 84], -0.06);
    tuft(K, L, K.put, pink, plane(0.06), 0, u(70), u(10), -0.5);
    // two doors, an eye on each, the smile split between them
    const doors = [[K.door([X(3), 0.24], 1), 9.4, 9.5, 13.8, Math.PI], [K.door([X(29), 0.24], -1), 22.6, 22.5, 18.2, Math.PI * 1.5]];
    for (const [put, cx, ex, kx, arc] of doors) {
      put(rbox(u(12.4), u(63), 0.035, u(2)), pink, X(cx), u(36.5), 0.2375);
      eye(K, L, put, plane(0.255), X(ex), u(52), u(4.4), u(5.2));
      put(ball(u(1.1), 10, 8), K.gloss(DEEP), X(kx), u(34), 0.262);
      put(torus(u(2), u(0.35), Math.PI / 2, 8).rotateZ(arc), K.plain(INK), 0, u(44), 0.258);
    }
    K.inside = { x: 0, y: u(36.5), w: u(24), h: u(61), z: 0.221 };
  },

  puffdresser(K, s, W, D, L) {
    const { rbox } = L, pink = K.gloss(PINK), pale = K.gloss(L.tone(PINK, 1.12));
    for (const z of [-0.25, 0.25]) feet(K, L, W, [8, 56], 4, 1.8, z);
    K.put(rbox(u(58), u(27), 0.7, u(4)), pink, 0, u(16.5), -0.02);
    for (const dx of [18.5, 45.5]) K.put(rbox(u(25), u(7), 0.03, u(1.5)), pale, X(dx, W), u(23.5), 0.34);
    K.put(rbox(u(52), u(12), 0.03, u(1.5)), pale, 0, u(12), 0.34);
    const front = plane(0.355);
    for (const sx of [-1, 1]) eye(K, L, K.put, front, X(32 + sx * 13.5, W), u(23.5), u(3.2), u(3.6), false);
    smile(K, L, K.put, front, 0, u(13), u(10), u(1.4), K.gloss(DEEP));
    K.put(rbox(u(60), u(4), 0.78, u(1.5)), K.gloss(ROSE), 0, u(31), -0.02);
    earsAt(K, L, K.put, pink, W, [6, 32], [16, 32], [6, 46], -0.28);
    tuft(K, L, K.put, pink, plane(-0.28), 0, u(27), u(12), -0.5);
  },

  puffshelf(K, s, W, D, L) {
    const { rbox, ball, cyl } = L, pink = K.gloss(PINK), rose = K.gloss(ROSE);
    K.put(rbox(u(54), u(3), 0.5, u(1)), rose, 0, u(1.5), 0);
    K.put(rbox(u(5), u(67), 0.3, u(1.5)), pink, X(25.5, W), u(46.5), -0.05);
    K.put(rbox(u(5), u(63), 0.3, u(1.5)), pink, X(55.5, W), u(44.5), -0.05);
    K.put(slab(L, [[X(23, W), u(80)], [X(23, W), u(71)], [X(58, W), u(67)], [X(58, W), u(76)]], 0.3), pink, 0, 0, -0.05);
    tuft(K, L, K.put, pink, plane(0.1), X(56, W), u(72), u(9), -0.2);
    K.put(rbox(u(30), u(3), 0.34, u(1)), rose, X(40.5, W), u(43.5), -0.03);
    ['#7ac0e0', DEEP, '#f0c860', TEAL, '#b090e0'].forEach((c, i) => {
      const h = 8 + (i % 2) * 2;
      K.put(rbox(u(3.6), u(h), 0.22, u(0.5)), K.gloss(c), X(31.8 + i * 4.2, W), u(45 + h / 2), -0.04);
    });
    // the notes' heads: round cubbies, markers in one and sheet music in the other
    for (const hx of [15, 45]) {
      K.put(ball(1, 28, 14).scale(u(13), u(10), 0.2), pink, X(hx, W), u(13), 0, 0, 0, 0.3);
      K.put(ball(1, 20, 6).scale(u(9), u(6.5), 0.04), K.plain(L.tone(PINK, 0.55)), X(hx, W), u(13), 0.19, 0, 0, 0.3);
    }
    [DEEP, TEAL, '#f0c860'].forEach((c, i) => {
      K.put(cyl(u(1.5), u(6), u(1.5), 12), K.gloss(CREAM), X(11.5 + i * 3.6, W), u(13), 0.22);
      K.put(cyl(u(1.55), u(3), u(1.55), 12), K.gloss(c), X(11.5 + i * 3.6, W), u(17.5), 0.22);
    });
    for (let i = 0; i < 3; i++) K.put(rbox(u(12), u(1.6), 0.14, u(0.4)), K.plain(i % 2 ? CREAM : L.tone(CREAM, 0.9)), X(45, W), u(9.2 + i * 2.2), 0.2);
  },

  pufflamp(K, s, W, D, L) {
    const rose = K.gloss(ROSE);
    K.put(L.lathe([[u(9), 0], [u(9), u(1.5)], [u(6), u(4)], [u(1.8), u(5.2)], [0, u(5.2)]], 28), rose);
    K.put(tube(L, [[16, 4], [18, 18], [14, 30], [18, 40], [16, 50]].map(([a, h]) => [X(a), u(h), 0]), u(1.7), 32), rose);
    head(K, L, K.put, 0, u(60), 0, u(11), { m: K.glow(GLOW), eyes: 'shut', mouth: true });
  },

  puffclock(K, s, W, D, L) {
    const { cyl, ball, rbox } = L;
    feet(K, L, W, [12, 20], 3, 1.5, 0.12);
    const S = head(K, L, K.put, 0, u(12), 0, u(9.5));
    for (const sx of [-1, 1]) eye(K, L, K.put, S, X(16 + sx * 4.2), u(16.4), u(2.2), u(2.6), false);
    // the dial for its face, hands at ten past twelve
    const [ry, rx] = S.turn(0, u(8.6)), at = posed(K.put, 0, u(8.6), S.z(0, u(8.6)), ry, rx), ink = K.plain(INK);
    at(cyl(u(4.8), 0.05, u(4.8), 24).rotateX(Math.PI / 2), K.gloss(CREAM), 0, 0, -0.012);
    at(cyl(u(4.2), 0.004, u(4.2), 24).rotateX(Math.PI / 2), K.plain('#ffffff'), 0, 0, 0.015);
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; at(ball(u(0.45), 6, 4), ink, Math.sin(a) * u(3.3), Math.cos(a) * u(3.3), 0.018); }
    at(rbox(u(0.7), u(3), 0.004, 0.001), ink, 0, u(1.5), 0.019);
    at(rbox(u(0.7), u(2.1), 0.004, 0.001).rotateZ(-1.86), ink, u(1), u(-0.3), 0.02);
    at(ball(u(0.6), 6, 4), K.gloss(DEEP), 0, 0, 0.02);
  },

  pufftv(K, s, W, D, L) {
    const { rbox } = L, pink = K.gloss(PINK);
    feet(K, L, W, [20, 44], 6, 3, 0);
    K.put(rbox(u(54), u(51), 0.6, 0.3), pink, 0, u(30.5), -0.05);
    K.put(rbox(u(42), u(30), 0.04, u(4)), K.gloss(ROSE), 0, u(35), 0.26);
    K.put(rbox(u(38), u(26), 0.02, u(3)), K.plain(SCREEN), 0, u(35), 0.28);
    const front = plane(0.25);
    for (const sx of [-1, 1]) eye(K, L, K.put, front, X(32 + sx * 7, W), u(13), u(3.4), u(3.8), false);
    smile(K, L, K.put, front, 0, u(8.5), u(3), u(0.7));
    earsAt(K, L, K.put, pink, W, [8, 46], [22, 56], [6, 70], -0.05);
    tuft(K, L, K.put, pink, plane(0), 0, u(54), u(11), -0.5);
  },

  puffmirror(K, s, W, D, L) {
    const { cyl, THREE } = L, pink = K.gloss(PINK), r = u(12), cx = X(16), cy = WY(44);
    K.put(cyl(r, 0.06, r, 32).rotateX(Math.PI / 2), pink, cx, cy, 0.03);
    for (const sx of [-1, 1]) ear(K, L, K.put, pink, [cx + EAR.b1[0] * sx * r, cy + EAR.b1[1] * r], [cx + EAR.b2[0] * sx * r, cy + EAR.b2[1] * r], [cx + EAR.tip[0] * sx * r, cy + EAR.tip[1] * r], 0.05);
    tuft(K, L, K.put, pink, plane(0.06), cx, cy, r);
    const m = new THREE.MeshStandardMaterial({ color: '#cfe6f2', roughness: 0.08, metalness: 0.75, emissive: '#5a7488', emissiveIntensity: 0.35 });
    m.userData.kind = 'plain';
    K.put(cyl(u(9), 0.01, u(9), 32).rotateX(Math.PI / 2), m, cx, WY(45), 0.065);
    for (const [x0, j0, x1, j1, wd] of [[10, 46, 16, 38, 1.6], [13, 48, 18.5, 41, 0.9]]) {
      const g = new THREE.PlaneGeometry(u(wd), u(Math.hypot(x1 - x0, j1 - j0)));
      K.put(g, K.plain('#ffffff'), X((x0 + x1) / 2), WY((j0 + j1) / 2), 0.071, 0, 0, -Math.atan2(x1 - x0, j0 - j1));
    }
  },

  puffnotes(K, s, W, D, L) {
    const { ball, rbox } = L;
    for (const [kind, hx, hy, c, hx2, hy2] of NOTES) {
      const m = K.gloss(c), note = (x, j) => {
        K.put(ball(1, 16, 10).scale(u(NOTE.rx), u(NOTE.ry), 0.035), m, X(x, W), WY(j), 0.04, 0, 0, -NOTE.tilt);
        K.put(rbox(u(NOTE.sw), u(NOTE.stem - 0.5), 0.04, 0.006), m, X(x + 3.4, W), WY(j - NOTE.stem / 2 - 0.25), 0.035);
      };
      note(hx, hy);
      if (kind === 'eighth') K.put(tube(L, [[hx + 3.4, hy - NOTE.stem], [hx + 8, hy - NOTE.stem + 6], [hx + 7, hy - NOTE.stem + 11]].map(([a, j]) => [X(a, W), WY(j), 0.035]), u(0.9), 16), m);
      if (kind === 'pair') {
        note(hx2, hy2);
        const P = (a, j) => [X(a, W), WY(j)];
        K.put(slab(L, [P(hx + 2.5, hy - NOTE.stem - 1), P(hx + 2.5, hy - NOTE.stem + 3), P(hx2 + 4.3, hy2 - NOTE.stem + 3), P(hx2 + 4.3, hy2 - NOTE.stem - 1)], 0.04), m, 0, 0, 0.035);
      }
    }
  },

  puffportrait(K, s, W, D, L) {
    const { rbox, THREE } = L, rose = K.gloss(ROSE), pink = K.gloss(PINK);
    for (const [x0, j0, x1, j1] of [[4, 22, 28, 25], [4, 49, 28, 52], [4, 25, 7, 49], [25, 25, 28, 49]]) {
      K.put(rbox(u(x1 - x0), u(j1 - j0), 0.06, 0.01), rose, X((x0 + x1) / 2), WY((j0 + j1) / 2), 0.03);
    }
    K.put(rbox(u(18), u(24), 0.02, 0.002), K.plain('#e8f0f8'), X(16), WY(37), 0.01);
    K.put(new THREE.PlaneGeometry(u(18), u(24)), K.pic(portraitSheet()), X(16), WY(37), 0.022);
    earsAt(K, L, K.put, pink, W, [5, 96 - 26], [12, 96 - 22], [4, 96 - 13], 0.03);
    tuft(K, L, K.put, pink, plane(0.03), X(16), WY(26), u(8), -0.4);
  },

  puffmic(K, s, W, D, L) {
    const { cyl, rbox, ball, lathe } = L, pink = K.gloss(PINK), steel = K.metal(MIC);
    K.put(lathe([[u(9), 0], [u(9), u(2)], [u(7.5), u(4.6)], [u(4.5), u(6.4)], [0, u(7)]], 28), pink);
    earsAt(K, L, K.put, pink, W, [10, 4], [13.5, 5.6], [8.5, 11], 0);
    tuft(K, L, K.put, pink, ellipsoid(0, u(2), 0, u(9), u(5), u(9)), 0, u(-1), u(6));
    K.put(cyl(u(0.8), u(52), u(0.8), 12), steel, 0, u(31), 0);
    K.put(rbox(u(4), u(4), u(4), u(1)), steel, 0, u(58), 0);
    // the marker-pen microphone, its round head on top
    K.put(cyl(u(2.4), u(15), u(2.4), 16), K.gloss(CREAM), 0, u(65.5), 0);
    K.put(cyl(u(2.5), u(2), u(2.5), 16), K.gloss(ROSE), 0, u(65), 0);
    K.put(ball(u(3.6), 16, 12), steel, 0, u(75.5), 0);
  },

  puffstage(K, s, W, D, L) {
    const { cyl, ball } = L, R = u(30), pink = K.gloss(PINK);
    K.put(cyl(R, u(10), R, 48), pink, 0, u(5), 0);
    K.put(cyl(u(30.3), u(2), u(30.3), 48), K.gloss(ROSE), 0, u(7), 0);
    for (let i = 0; i < 5; i++) {
      const px = X(10 + i * 11, W), pz = Math.sqrt(R * R - px * px);
      K.put(ball(u(2.2), 12, 8).scale(1, 1, 0.5), K.gloss(L.tone(ROSE, 0.74)), px, u(3.5), pz);
      K.put(ball(u(1.8), 12, 8), K.glow(BULB), px, u(3.5), pz + 0.02);
    }
    K.put(tube(L, STAGE_CURL.map(([a, h]) => [X(a, W), u(h), -0.55]), u(3), 64), pink);
    K.put(ball(u(3), 12, 8), pink, X(STAGE_CURL[STAGE_CURL.length - 1][0], W), u(STAGE_CURL[STAGE_CURL.length - 1][1]), -0.55);
  },

  puffkaraoke(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, pink = K.gloss(PINK);
    feet(K, L, W, [10, 22], 3.5, 1.6, 0.12);
    K.put(rbox(u(24), u(37), 0.55, u(6)), pink, 0, u(21.5), -0.04);
    K.put(rbox(u(18), u(11), 0.02, u(2)), K.plain(SCREEN), 0, u(30.5), 0.245);
    // its speakers for eyes
    for (const sx of [-1, 1]) {
      const cx = X(16 + sx * 5.2);
      K.put(cyl(u(4.4), 0.02, u(4.4), 20).rotateX(Math.PI / 2), K.plain(INK), cx, u(16), 0.238);
      K.put(cyl(u(4), 0.02, u(4), 20).rotateX(Math.PI / 2), K.gloss(TEAL), cx, u(16), 0.243);
      K.put(cyl(u(2.4), 0.02, u(2.4), 16).rotateX(Math.PI / 2), K.gloss(TEALD), cx, u(16), 0.248);
      K.put(ball(u(1), 8, 6).scale(1, 1, 0.5), K.plain('#ffffff'), cx - u(1.4), u(17.6), 0.256);
    }
    smile(K, L, K.put, plane(0.235), 0, u(9), u(3), u(0.7));
    earsAt(K, L, K.put, pink, W, [6, 35], [13, 40], [4, 50], -0.04);
    tuft(K, L, K.put, pink, plane(0.1), 0, u(39), u(8), -0.5);
  },

  puffpouf(K, s, W, D, L) {
    const cloth = K.cloth(PINK), S = ellipsoid(0, u(10), 0, u(13.5), u(10), u(13.5));
    K.put(L.ball(1, 28, 18).scale(u(13.5), u(10), u(13.5)), cloth, 0, u(10), 0);
    earsAt(K, L, K.put, cloth, W, [9, 18], [4, 14.5], [3, 26], 0);
    tuft(K, L, K.put, cloth, S, 0, u(10.5), u(9));
    for (const sx of [-1, 1]) smile(K, L, K.put, S, X(16 + sx * 5), u(9.5), u(3.4), u(0.7));
    smile(K, L, K.put, S, 0, u(5.6), u(1.8), u(0.6));
  },

  puffmusicbox(K, s, W, D, L) {
    const { cyl, ball, rbox } = L, rose = K.gloss(ROSE), deep = K.gloss(DEEP);
    for (const [fx, z] of [[9, 0.12], [23, 0.12], [16, -0.15]]) K.put(ball(u(1.4), 10, 8), rose, X(fx), u(1.2), z);
    K.put(cyl(u(10), u(12), u(10), 28), K.gloss(PINK), 0, u(8), 0);
    K.put(cyl(u(10.2), u(1.6), u(10.2), 28), rose, 0, u(3.2), 0);
    K.put(cyl(u(10.6), u(1.2), u(10.6), 28), rose, 0, u(14.6), 0);
    K.put(rbox(u(3), u(2), u(2), u(0.5)), deep, X(27.5), u(9), 0);
    K.put(rbox(u(1.2), u(6), u(1.2), u(0.4)), deep, X(28.6), u(9), 0);
    const S = drum(u(10));
    for (const sx of [-1, 1]) eye(K, L, K.put, S, X(16 + sx * 4.2), u(9.2), u(2.2), u(2.6), false);
    smile(K, L, K.put, S, 0, u(6.4), u(1.6), u(0.5));
    // the curl turning on top, on its little stand
    K.put(cyl(u(3), u(1), u(3), 16), K.gloss(CREAM), X(14.6), u(15.7), 0);
    tuft(K, L, K.put, K.gloss(PINK), plane(0), X(17), u(8.4), u(14));
  },

  puffmarkers(K, s, W, D, L) {
    const { cyl } = L;
    [[11, 25, DEEP, -0.04], [14.5, 27, TEAL, 0.03], [18, 26, '#f0c040', -0.02], [21.5, 23, '#9a70d8', 0.04]].forEach(([mx, top, c, z]) => {
      K.put(cyl(u(1.4), u(top - 10), u(1.4), 12), K.gloss(CREAM), X(mx), u((top + 4) / 2), z);
      K.put(cyl(u(1.5), u(4), u(1.5), 12), K.gloss(c), X(mx), u(top - 2), z);
    });
    head(K, L, K.put, 0, u(9.5), 0, u(9.5), { eyes: 'open', mouth: true });
  },

  puffballoons(K, s, W, D, L) {
    const string = K.plain('#c8b8c0'), Z = [-0.1, 0.08, -0.03];
    K.put(L.rbox(u(8), u(6), u(6), u(1.5)), K.gloss(ROSE), 0, u(3), 0);
    BALLOONS.forEach(([bx, bh], i) => {
      rod(K, L, string, [0, u(6), 0], [X(bx), u(bh - 7.5), Z[i]], u(0.35));
      head(K, L, K.put, X(bx), u(bh), Z[i], u(7), { eyes: 'open', mouth: true, lo: true });
    });
  },

  puffmoonstone(K, s, W, D, L) {
    const { rbox, blob, ball, torus } = L;
    K.put(rbox(u(16), u(2), u(14), u(1)), K.gloss(ROSE), 0, u(1), 0);
    K.put(rbox(u(14), u(9), u(12), u(2)), K.gloss(PINK), 0, u(5.5), 0);
    tuft(K, L, K.put, K.gloss(DEEP), plane(u(6)), X(16.5), u(-1), u(6));
    K.put(blob(u(18), u(5), u(16), 0.5, 0.5), K.cloth(ROSE), 0, u(11.5), 0);
    // the Moon Stone, its crescent glowing
    K.put(ball(1, 20, 14).scale(u(6), u(6.5), u(5)), K.gloss(STONE), 0, u(20.5), 0);
    K.put(torus(u(3), u(0.9), Math.PI * 1.05, 16).rotateZ(Math.PI * 0.4), K.glow(MOON), 0, u(20.5), 0.136);
  },

  puffspotlight(K, s, W, D, L) {
    const { cyl, ball } = L, steel = K.metal(MIC), pink = K.gloss(PINK), r = u(9.5), cy = u(46);
    for (const [a, z] of [[X(4), 0.12], [X(28), 0.12], [0, -0.36]]) rod(K, L, steel, [0, u(36), 0], [a, u(0.5), z], u(0.8));
    rod(K, L, steel, [0, u(36), 0], [0, u(38), 0], u(0.8));
    for (const [a, b] of [[[6, 46], [6, 38]], [[6, 38], [26, 38]], [[26, 38], [26, 46]]]) rod(K, L, steel, [X(a[0]), u(a[1]), 0], [X(b[0]), u(b[1]), 0], u(0.7));
    // the lamp: Jigglypuff's head, its ears the barn doors, its face the lens
    K.put(cyl(r, 0.34, r, 32).rotateX(Math.PI / 2), pink, 0, cy, -0.02);
    K.put(ball(r, 24, 12).scale(1, 1, 0.4), pink, 0, cy, -0.19);
    for (const sx of [-1, 1]) ear(K, L, K.put, pink, [EAR.b1[0] * sx * r, cy + EAR.b1[1] * r], [EAR.b2[0] * sx * r, cy + EAR.b2[1] * r], [EAR.tip[0] * sx * r, cy + EAR.tip[1] * r], 0.08);
    tuft(K, L, K.put, pink, plane(0.15), 0, cy, r);
    K.put(cyl(u(6.6), 0.02, u(6.6), 24).rotateX(Math.PI / 2), K.plain(L.tone(BULB, 0.8)), 0, cy, 0.155);
    K.put(cyl(u(5.8), 0.02, u(5.8), 24).rotateX(Math.PI / 2), K.glow(BULB), 0, cy, 0.162);
    K.put(ball(u(1.6), 10, 8).scale(1, 1, 0.4), K.plain('#ffffff'), X(14), u(48), 0.172);
  },
};
