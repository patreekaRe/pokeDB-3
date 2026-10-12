/* base-models-i.js  -  Music, Library, Pirate and Space pieces, modelled from parts like the arcade cabinets (the user's ask, 2026-10-12).
   js/base-models-f.js's head says how a batch works. Most builders here follow their painting (js/base-furniture-rooms4.js)
   pixel for pixel: `u(n)` is n of its 32 pixels a tile, `X(n, W)` a pixel across the painting as x from the middle.
   Left as they were: the rugs and wall pieces, the reading pillow (a cushion), the drum kit, bookcases and the seats,
   desks and chart table (already shaped), and the model planets but the ringed one (true spheres on their meridian). */

import { rod, tube } from './base-models-kit.js';

const u = (n) => n / 32;
const X = (n, W = 1) => n / 32 - W / 2;
const TAU = Math.PI * 2;
const GOLD = '#f0c040', BRASS = '#d8a838', INK = '#303038', SILVER = '#d8dce4', PARCH = '#f0e0b0', SEA = '#3a78b8',
  ROPE = '#c8a868', MARBLE = '#ece8e0', SUIT = '#eef0f4', IRON = '#3a3a44', BANKER = '#3a8a4a', STRING = '#ece8dc';
const RAINBOW = ['#e04848', '#f08030', '#f8d030', '#58b848', '#4a98d8', '#5a58c8', '#a858d8'];
const BOOKS = ['#d0485a', '#4a7ac8', '#e0b04a', '#4f9a42', '#8a5ab8', '#e8e4d8'];

const sheet = (w, h, draw) => { const c = new OffscreenCanvas(w, h); draw(c.getContext('2d'), w, h); return c; };
const pics = {};
const once = (key, make) => pics[key] || (pics[key] = make());

/** A flat outline ([x, y] points) extruded `d` deep, centred on z 0. */
function slab(L, pts, d, bevel = 0.012) {
  const { THREE } = L, sh = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(sh, { depth: Math.max(0.001, d - bevel * 2), bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 24 });
  g.translate(0, 0, -d / 2 + bevel);
  return g;
}

/** A violin-like body: the outline of ellipses [cy, rx, ry] run together, never narrower than `waist` between them, `d` deep. */
function fiddle(L, eggs, d, waist = 0) {
  const lo = Math.min(...eggs.map(([c, , ry]) => c - ry)), hi = Math.max(...eggs.map(([c, , ry]) => c + ry)), n = 40, side = [];
  for (let i = 0; i <= n; i++) {
    const y = lo + (hi - lo) * i / n;
    let w = 0;
    for (const [c, rx, ry] of eggs) { const t = (y - c) / ry; if (Math.abs(t) < 1) w = Math.max(w, rx * Math.sqrt(1 - t * t)); }
    side.push([i && i < n ? Math.max(w, waist) : 0, y]);
  }
  const pts = [...side, ...side.slice(1, -1).reverse().map(([w, y]) => [-w, y])];
  return slab(L, pts, d, Math.min(0.012, d / 4));
}

/** A tube along points [[x, y, z]...] whose radius runs from r0 to r1 (a horn, a sax, a stem). */
function taper(L, pts, r0, r1, seg = 40) {
  const { THREE } = L, curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)));
  const g = new THREE.TubeGeometry(curve, seg, 1, 12, false), pos = g.attributes.position, ring = 13;
  for (let i = 0; i < pos.count; i++) {
    const t = Math.floor(i / ring) / seg, c = curve.getPointAt(t), r = r0 + (r1 - r0) * t * t;
    pos.setXYZ(i, c.x + (pos.getX(i) - c.x) * r, c.y + (pos.getY(i) - c.y) * r, c.z + (pos.getZ(i) - c.z) * r);
  }
  return g;
}

/** A bell flaring from radius r0 to R over `len`, a thin shell (seen inside too), its mouth along +y. */
const bell = (L, r0, R, len, seg = 28) => L.lathe([[r0, 0], [r0 * 1.3, len * 0.45], [R * 0.45, len * 0.8], [R * 0.85, len * 0.96], [R, len],
  [R * 0.93, len * 0.985], [R * 0.4, len * 0.82], [r0 * 1.15, len * 0.45], [r0 * 0.85, 0]], seg);

/** Turns a geometry made along +y to point along `dir` ([x, y, z]). */
function aim(L, g, dir) {
  const { THREE } = L;
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...dir).normalize()));
  return g;
}

/** A put that tips everything back by `a` about the floor line at depth z0 (an instrument resting in its stand). */
const tipped = (K, a, y0 = 0, z0 = 0) => (geo, m, x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0) => {
  if (rx) geo.rotateX(rx); if (rz) geo.rotateZ(rz); if (ry) geo.rotateY(ry);
  geo.translate(x, y - y0, z - z0); geo.rotateX(-a);
  return K.put(geo, m, 0, y0, z0);
};

/** A rod from a to b through any put. */
function bar(put, L, m, a, b, r, seg = 12) {
  const { THREE } = L, va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const g = L.cyl(r, va.distanceTo(vb), r, seg);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize()));
  put(g, m, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
}

/** Puts every vertex's uv on one cell of a palette strip (one material for parts of many colours: the orrery's arms). */
function cell(g, i, n) {
  const uv = g.attributes.uv;
  for (let k = 0; k < uv.count; k++) uv.setXY(k, (i + 0.5) / n, 0.5);
  return g;
}

/* ---------- pictures ---------- */

/* a page of sheet music: two staves and a run of notes */
const music = () => once('music', () => sheet(128, 96, (g, w, h) => {
  g.fillStyle = PARCH; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#8a7a5a'; g.lineWidth = 1.5;
  for (let s = 0; s < 2; s++) for (let l = 0; l < 5; l++) { const y = 18 + s * 42 + l * 5; g.beginPath(); g.moveTo(8, y); g.lineTo(w - 8, y); g.stroke(); }
  g.fillStyle = INK; g.strokeStyle = INK;
  for (let s = 0; s < 2; s++) for (let n = 0; n < 7; n++) {
    const x = 20 + n * 14, y = 20 + s * 42 + ((n * 3 + s) % 5) * 2.5;
    g.beginPath(); g.ellipse(x, y, 3.4, 2.6, -0.4, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(x + 3, y); g.lineTo(x + 3, y - 12); g.stroke();
  }
}));
/* a ringed planet's bands */
const bands = (cols) => once('bands' + cols, () => sheet(64, 64, (g, w, h) => {
  cols.forEach((c, i) => { g.fillStyle = c; g.fillRect(0, i * h / cols.length, w, h / cols.length + 1); });
}));
/* the orrery's spinning parts: brass and its planets' colours, a cell each */
const ORRERY = [BRASS, '#4a88d0', '#d06838', '#d8b878', '#8a5ab8'];
const orreryStrip = () => once('orrery', () => sheet(ORRERY.length * 4, 4, (g) => ORRERY.forEach((c, i) => { g.fillStyle = c; g.fillRect(i * 4, 0, 4, 4); })));
/* the grand piano's white keys from above */
const keysTop = () => once('keys', () => sheet(512, 32, (g, w, h) => {
  g.fillStyle = '#f8f8f0'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#c8c8c0'; for (let x = 0; x < w; x += 11.4) g.fillRect(Math.round(x), 0, 1, h);
}));

/* ---------- Music: the instruments on their stands ---------- */

/** What rests in an instrument stand, built standing at its cradle's height t, front +z. */
const PLAYS = {
  violin(put, K, L, t) {
    const { rbox, cyl, ball, torus } = L, wood = K.gloss(K.pal.w), dark = K.wood(L.tone(K.pal.w, 0.7)), d = u(3.5), f = d / 2 + 0.012;
    put(fiddle(L, [[t + u(8), u(8), u(7)], [t + u(22), u(7), u(6)]], d, u(4.5)), wood);
    put(rbox(u(2.4), u(30), 0.05, 0.012), dark, 0, t + u(31), 0);
    put(rbox(u(2), u(30), 0.02, 0.006), K.gloss(INK), 0, t + u(28), f + 0.006);
    put(ball(u(2.5), 14, 10), dark, 0, t + u(47.5), 0);
    put(torus(u(1.6), 0.01, Math.PI * 1.5, 16).rotateY(Math.PI / 2), dark, u(0.6), t + u(48.5), 0);
    for (const sg of [-1, 1]) for (const j of [42, 45]) put(cyl(0.008, 0.06, 0.008, 6).rotateZ(Math.PI / 2), K.gloss(INK), sg * 0.035, t + u(j), 0);
    put(rbox(u(3), u(6), 0.015, 0.005), K.gloss(INK), 0, t + u(3.5), f + 0.004);
    put(rbox(u(7), 0.03, 0.012, 0.004), K.gloss('#e8d8b0'), 0, t + u(9.5), f + 0.015);
    for (const sg of [-1, 1]) put(rbox(0.008, u(4), 0.006, 0.003), K.plain(INK), sg * u(4), t + u(11), f + 0.002);
    for (const x of [-0.018, -0.006, 0.006, 0.018]) put(rbox(0.003, u(34), 0.003), K.metal('#e8e8e8'), x * 0.7, t + u(27), f + 0.03);
    // the bow leaning on the right
    bar(put, L, K.wood(L.tone(K.pal.w, 0.8)), [u(11), t, 0.06], [u(4), t + u(50), 0.02], 0.007);
    bar(put, L, K.plain('#e8e0c8'), [u(12), t + u(1), 0.07], [u(5), t + u(48), 0.03], 0.004);
  },
  trumpet(put, K, L, t) {
    const { cyl, torus, lathe } = L, brass = K.metal(BRASS);
    put(bell(L, u(1.5), u(9), u(11)), brass, 0, t + u(40), 0);
    put(cyl(u(1.5), u(34), u(1.5), 14), brass, 0, t + u(23), 0);
    put(torus(u(5), u(1), TAU, 28), brass, u(7), t + u(20), 0);
    for (let n = 0; n < 3; n++) {
      put(cyl(u(1.8), u(5), u(1.8), 14).rotateZ(Math.PI / 2), K.metal(L.tone(BRASS, 0.85)), u(5), t + u(32.5 - n * 5), 0);
      put(cyl(u(1.4), 0.02, u(1.4), 14).rotateZ(Math.PI / 2), K.gloss('#fff4d0'), u(8), t + u(32.5 - n * 5), 0);
    }
    put(lathe([[0.01, 0], [u(1.4), u(3)], [u(1.1), u(5)], [u(1.6), u(6)], [0, u(6)]], 14), K.metal(L.tone(BRASS, 0.8)), 0, t, 0);
  },
  banjo(put, K, L, t) {
    const { rbox, cyl, ball } = L, steel = K.metal(SILVER), f = u(1.5) + 0.01;
    put(cyl(u(11), u(3), u(11), 32).rotateX(Math.PI / 2), K.metal(), 0, t + u(12), 0);
    put(cyl(u(9.5), 0.01, u(9.5), 32).rotateX(Math.PI / 2), K.plain('#f4f0e0'), 0, t + u(12), u(1.5) + 0.002);
    for (let a = 0; a < 12; a++) put(ball(0.012, 8, 6), steel, Math.cos(a / 12 * TAU) * u(10.3), t + u(12) + Math.sin(a / 12 * TAU) * u(10.3), f);
    put(rbox(u(3), u(36), 0.04, 0.01), K.wood(), 0, t + u(39), 0);
    put(rbox(u(7), u(7), 0.04, 0.012), K.wood(L.tone(K.pal.w, 0.8)), 0, t + u(56.5), 0);
    for (const sg of [-1, 1]) for (const j of [55, 58]) put(cyl(0.01, 0.05, 0.01, 6).rotateZ(Math.PI / 2), steel, sg * u(4.5), t + u(j), 0);
    put(rbox(u(5), u(2), 0.02, 0.006), steel, 0, t + u(3), f);
    put(rbox(u(7), 0.025, 0.012, 0.004), K.wood(), 0, t + u(9.5), f + 0.012);
    for (const x of [-0.016, -0.005, 0.005, 0.016]) put(rbox(0.003, u(48), 0.003), K.metal('#e8e8e8'), x, t + u(28), f + 0.022);
  },
  ukulele(put, K, L, t) {
    const { rbox, cyl, ball } = L, d = u(3.5), f = d / 2 + 0.012;
    put(fiddle(L, [[t + u(8), u(8), u(7)], [t + u(20), u(6), u(6)]], d, u(5)), K.gloss(K.pal.c));
    put(cyl(u(2.5), 0.01, u(2.5), 24).rotateX(Math.PI / 2), K.plain('#201810'), 0, t + u(16), f);
    put(rbox(u(3), u(26), 0.04, 0.01), K.wood(), 0, t + u(31), 0);
    put(rbox(u(7), u(7), 0.04, 0.012), K.wood(L.tone(K.pal.w, 0.8)), 0, t + u(46.5), 0);
    for (const sg of [-1, 1]) put(ball(0.014, 8, 6), K.metal(SILVER), sg * u(4.5), t + u(48), 0.02);
    put(rbox(u(7), u(2), 0.02, 0.006), K.wood(L.tone(K.pal.w, 0.7)), 0, t + u(7), f + 0.008);
    for (const x of [-0.015, -0.005, 0.005, 0.015]) put(rbox(0.003, u(38), 0.003), K.metal('#e8e8e8'), x, t + u(26), f + 0.025);
  },
  sax(put, K, L, t) {
    const { ball, lathe } = L, brass = K.metal(BRASS);
    const path = [[-u(5), t + u(46), 0], [-u(4), t + u(30), 0], [-u(2.5), t + u(12), 0], [0, t + u(5), 0], [u(3), t + u(4.5), 0], [u(5.5), t + u(8), 0], [u(7), t + u(18), 0], [u(7), t + u(24), 0]];
    put(taper(L, path, u(1.8), u(3.2), 48), brass);
    put(bell(L, u(3.2), u(6), u(7)), brass, u(7), t + u(24), 0);
    for (let n = 0; n < 6; n++) put(ball(0.014, 8, 6), K.gloss('#fff4d0'), -u(4.4) + n * u(0.35), t + u(42 - n * 5), u(2));
    put(taper(L, [[-u(5), t + u(46), 0], [-u(3), t + u(51), 0], [u(2), t + u(54), 0]], u(1.6), u(1), 16), brass);
    put(lathe([[0.012, 0], [0.016, u(2)], [0.01, u(4)], [0, u(4)]], 12).rotateZ(-Math.PI / 2), K.gloss(INK), u(2), t + u(54), 0);
  },
  flute(put, K, L, t) {
    const { cyl, ball } = L, silver = K.metal(SILVER), a = [-u(6), t, 0], b = [u(7), t + u(56), 0];
    bar(put, L, silver, a, b, u(1.5), 16);
    for (let n = 0; n < 7; n++) {
      const f = 0.15 + n * 0.1;
      put(ball(0.016, 10, 8).scale(1, 1, 0.5), K.metal(L.tone(SILVER, 0.85)), a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, u(1.5));
    }
    put(cyl(u(1.2), u(3), u(1.2), 12).rotateZ(-0.23), K.gloss(INK), a[0] + (b[0] - a[0]) * 0.9, a[1] + (b[1] - a[1]) * 0.9, u(1.4));
  },
};

/* ---------- Space: the ringed planet's bands ---------- */
const RINGED = ['#e0c898', '#d8b880', '#e8d8a8', '#d8b880', '#e0c898', '#c8a870', '#e8d8a8'];

export const SHAPES = {
  // boxes, the painting on the front only (js/base-models-kit.js)
  'speakerstack foodpods cardcatalogue': { make: 'frontbox', d: 0.5 },
  'amplifier': { make: 'frontbox', d: 0.4 },
  'mapcase': { make: 'frontbox', d: 0.6 },
  'returnbox': { make: 'frontbox', d: 0.5 },
  'navdesk': { make: 'frontbox', d: 0.6, top: 0.4 },
  // Music
  violinstand: { make: 'inststand', plays: 'violin', neck: 0.96 },
  trumpetstand: { make: 'inststand', plays: 'trumpet' },
  banjostand: { make: 'inststand', plays: 'banjo', neck: 1.0 },
  ukulelestand: { make: 'inststand', plays: 'ukulele', neck: 0.88 },
  saxstand: { make: 'inststand', plays: 'sax' },
  flutestand: { make: 'inststand', plays: 'flute' },
  grandpiano: { make: 'grandpiano' },
  harp: { make: 'harp' },
  cello: { make: 'cello' },
  podium: { make: 'podium' },
  gramophone: { make: 'gramophone' },
  metronome: { make: 'metronome' },
  micstand: { make: 'micstand' },
  mixingdesk: { make: 'mixingdesk' },
  tuba: { make: 'tuba' },
  chimes: { make: 'chimes' },
  musicstand: { make: 'musicstand' },
  // Library
  libraryladder: { make: 'libraryladder' },
  bankerslamp: { make: 'bankerslamp' },
  orrery: { make: 'orrery' },
  scrollrack: { make: 'scrollrack' },
  bookarch: { make: 'bookarch' },
  magnifier: { make: 'magnifier' },
  bust: { make: 'bust' },
  // Pirate
  mast: { make: 'mast' },
  cannonballs: { make: 'cannonballs' },
  shipbell: { make: 'shipbell' },
  ropecoil: { make: 'ropecoil' },
  coinsack: { make: 'coinsack' },
  parrotperch: { make: 'parrotperch' },
  spyglass: { make: 'spyglass' },
  shipbottle: { make: 'shipbottle' },
  // Space
  ringedplanet: { make: 'ringedplanet' },
  spacesuit: { make: 'spacesuit' },
  spacehelmet: { make: 'spacehelmet' },
  meteorite: { make: 'meteorite' },
  ufolamp: { make: 'ufolamp' },
  alienplant: { make: 'alienplant' },
  oxygentanks: { make: 'oxygentanks' },
  moonrock: { make: 'moonrock' },
  moonrover: { make: 'moonrover' },
  lander: { make: 'lander' },
  beacon: { make: 'beacon' },
};

export const MAKES = {
  /* ----- Music ----- */

  inststand(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, steel = K.metal(), pad = K.gloss('#2a2a30'), t = u(42);
    // a tripod under a post, a cradle bar with padded prongs, a back brace up to the neck for the tall ones
    for (let i = 0; i < 3; i++) {
      const a = Math.PI / 2 + i * TAU / 3, e = [Math.cos(a) * 0.28, 0.015, -Math.sin(a) * 0.28 + 0.02];
      rod(K, L, steel, [0, u(26), -0.02], e, 0.012);
      K.put(ball(0.02, 10, 8), pad, ...e);
    }
    K.put(cyl(0.016, u(16), 0.016, 12), steel, 0, u(34), -0.02);
    K.put(rbox(u(16), 0.03, 0.09, 0.01), steel, 0, t - 0.015, 0.02);
    for (const sg of [-1, 1]) K.put(rbox(u(2), u(5), 0.05, 0.012), pad, sg * u(7), t + u(2), 0.06);
    if (s.neck) {
      rod(K, L, steel, [0, u(40), -0.03], [0, s.neck, -0.09], 0.012);
      K.put(rbox(0.12, 0.03, 0.05, 0.012), pad, 0, s.neck, -0.07);
    }
    PLAYS[s.plays](tipped(K, 0.07, t, 0.06), K, L, t);
  },

  grandpiano(K, s, W, D, L) {
    const { THREE, rbox, cyl, lathe } = L, lacquer = K.gloss(L.tone(K.pal.w, 0.7)), lid = K.gloss(K.pal.w), gold = K.metal(GOLD);
    const y0 = u(24), y1 = u(40);
    // the case's outline from above: a straight spine on the left, the bentside sweeping in to the tail
    const bend = new THREE.SplineCurve([[0.92, 0.08], [0.8, -0.06], [0.48, -0.15], [0.2, -0.26], [0.0, -0.4], [-0.35, -0.46], [-0.92, -0.44]].map(([x, z]) => new THREE.Vector2(x, z)));
    const outline = [[-0.92, 0.28], [0.92, 0.28], ...bend.getPoints(30).map(v => [v.x, v.y])];
    const flat = (pts, h) => { const g = slab(L, pts.map(([x, z]) => [x, -z]), h, 0.01); g.translate(0, 0, h / 2); g.rotateX(-Math.PI / 2); return g; };
    K.put(flat(outline, y1 - y0), lacquer, 0, y0, 0);
    // the gold frame and strings inside, the lid hinged on the spine and propped open
    const inner = outline.map(([x, z]) => [x * 0.9 - 0.01, z * 0.88 - 0.01]);
    K.put(flat(inner, 0.01), K.metal('#d8b060'), 0, y1 + 0.002, 0);
    for (let i = 0; i < 9; i++) K.put(rbox(0.004, 0.004, 0.5 - i * 0.03), K.metal('#e8e8e0'), -0.75 + i * 0.16, y1 + 0.016, -0.08 - i * 0.012);
    const lidPts = outline.map(([x, z]) => [x, Math.min(z, 0.1)]);
    const top = flat(lidPts, 0.025), open = 0.42;
    top.translate(0.92, 0, 0); top.rotateZ(open); top.translate(-0.92, 0, 0);
    K.put(top, lid, 0, y1 + 0.01, 0);
    rod(K, L, K.wood(K.pal.w), [0.5, y1, -0.05], [0.5, y1 + Math.sin(open) * 1.42 - 0.03, -0.05], 0.012);
    K.put(rbox(1.84, 0.02, 0.18, 0.008), lid, 0, y1 + 0.01, 0.19);
    // the music desk with its page
    K.put(rbox(0.56, 0.24, 0.025, 0.008), lacquer, -0.1, y1 + 0.14, 0.17, 0, -0.25);
    K.put(new THREE.PlaneGeometry(0.48, 0.18).rotateX(-0.25), K.pic(music()), -0.1, y1 + 0.145, 0.186);
    // the keybed: cheeks, white keys, black keys in their twos and threes
    K.put(rbox(1.84, u(6), 0.18, 0.012), lacquer, 0, y0 + u(3), 0.36);
    for (const sg of [-1, 1]) K.put(rbox(0.07, u(9), 0.2, 0.012), lacquer, sg * 0.885, y0 + u(4.5), 0.36);
    const kw = 1.68 / 46;
    K.put(rbox(1.68, 0.025, 0.15, 0.004), K.gloss('#f8f8f0'), 0, y0 + u(6) + 0.012, 0.36);
    K.put(new THREE.PlaneGeometry(1.68, 0.15).rotateX(-Math.PI / 2), K.pic(keysTop()), 0, y0 + u(6) + 0.026, 0.36);
    for (let n = 0; n < 45; n++) if ([0, 1, 3, 4, 5].includes(n % 7)) K.put(rbox(kw * 0.55, 0.02, 0.09, 0.003), K.gloss('#1c1c22'), -0.84 + (n + 1) * kw, y0 + u(6) + 0.034, 0.33);
    // three turned legs on brass castors, the pedal lyre
    for (const [x, z] of [[-0.8, 0.18], [0.78, 0.16], [-0.55, -0.34]]) {
      K.put(lathe([[0.04, 0], [0.055, 0.06], [0.04, 0.2], [0.065, 0.42], [0.06, y0 - 0.02], [0.08, y0], [0, y0]], 16), lacquer, x, 0, z);
      K.put(cyl(0.045, 0.03, 0.045, 14), gold, x, 0.015, z);
    }
    for (const sg of [-1, 1]) rod(K, L, lacquer, [sg * 0.08, 0.06, 0.3], [sg * 0.05, y0, 0.32], 0.016);
    K.put(rbox(0.26, 0.05, 0.08, 0.015), lacquer, 0, 0.07, 0.3);
    for (const x of [-0.07, 0, 0.07]) K.put(rbox(0.035, 0.012, 0.08, 0.005), gold, x, 0.08, 0.36);
  },

  harp(K, s, W, D, L) {
    const { cyl, ball, rbox, lathe } = L, gold = K.metal(GOLD), wood = K.gloss(K.pal.w);
    const sb = (i) => 6 + (i - 9) * 64 / 17, nk = (i) => 84 - (i - 5) * 10 / 22 - Math.sin((i - 5) / 22 * TAU) * 3;
    K.put(rbox(u(26), u(6), 0.3, 0.02), gold, 0, u(3), 0);
    K.put(cyl(u(2), u(80), u(2.3), 16), gold, X(5), u(46), 0);
    K.put(lathe([[u(2.4), 0], [u(3), u(2)], [u(2.2), u(3.5)], [u(3.2), u(5)], [0, u(5)]], 16), gold, X(5), u(84), 0);
    K.put(ball(u(3), 14, 10), gold, X(5), u(90.5), 0);
    const neck = [];
    for (let i = 5; i <= 27; i += 2) neck.push([X(i), u(nk(i) + 0.5), 0]);
    K.put(taper(L, neck, u(2.4), u(1.6), 36), gold);
    K.put(ball(u(2.5), 12, 10), K.metal(L.tone(GOLD, 0.8)), X(27), u(76), 0);
    K.put(taper(L, [[X(9), u(6), 0], [X(17.5), u(38), 0], [X(26), u(70), 0]], u(3.6), u(1.4), 24), wood);
    for (let i = 9; i <= 25; i += 2) {
      const top = nk(i) - 1, bottom = sb(i);
      if (bottom >= top) continue;
      K.put(cyl(0.0035, u(top - bottom), 0.0035, 6), K.gloss(i === 15 ? '#d84040' : '#f4f0d8'), X(i), u((top + bottom) / 2), 0);
    }
  },

  cello(K, s, W, D, L) {
    const { rbox, cyl, ball, torus } = L, put = tipped(K, 0.05), d = u(5), f = d / 2 + 0.012, dark = K.wood(L.tone(K.pal.w, 0.7));
    put(cyl(0.008, u(9), 0.008, 8), K.metal(SILVER), 0, u(4.5), 0);
    put(fiddle(L, [[u(20), u(12), u(11)], [u(42), u(10), u(9)]], d, u(8)), K.gloss(K.pal.w));
    put(rbox(u(3), u(46), 0.06, 0.014), dark, 0, u(61), 0);
    put(rbox(u(2.4), u(50), 0.02, 0.006), K.gloss(INK), 0, u(58), f + 0.006);
    put(ball(u(3), 14, 10), dark, 0, u(86), 0);
    put(torus(u(2), 0.012, Math.PI * 1.5, 16).rotateY(Math.PI / 2), dark, u(0.8), u(87), 0);
    for (const sg of [-1, 1]) for (const j of [78, 82]) put(cyl(0.01, 0.07, 0.01, 6).rotateZ(Math.PI / 2), K.gloss(INK), sg * 0.045, u(j), 0);
    for (const sg of [-1, 1]) put(rbox(0.01, u(7), 0.006, 0.003), K.plain(INK), sg * u(6), u(26.5), f + 0.002);
    put(rbox(u(9), 0.04, 0.012, 0.004), K.gloss('#e8d8b0'), 0, u(24.5), f + 0.02);
    put(rbox(u(4), u(8), 0.015, 0.005), K.gloss(INK), 0, u(13), f + 0.004);
    for (const x of [-0.024, -0.008, 0.008, 0.024]) put(rbox(0.003, u(64), 0.003), K.metal('#e8e8e8'), x, u(48), f + 0.04);
    rod(K, L, K.wood(L.tone(K.pal.w, 0.8)), [X(28), u(1), 0.14], [X(20.5), u(76), 0.02], 0.008);
    rod(K, L, K.plain('#e8e0c8'), [X(29), u(2), 0.15], [X(21.5), u(74), 0.03], 0.005);
  },

  podium(K, s, W, D, L) {
    const { THREE, rbox, cyl } = L, steel = K.metal(), gold = K.metal(GOLD);
    // a carpeted box with gold edging, a stand at its back holding the score
    K.put(rbox(u(30), u(14), 0.8, 0.03), K.cloth(K.pal.c), 0, u(7), 0);
    for (const sg of [-1, 1]) {
      K.put(rbox(u(30) + 0.01, 0.025, 0.03, 0.01), gold, 0, u(14) - 0.01, sg * 0.395);
      K.put(rbox(0.03, 0.025, 0.81, 0.01), gold, sg * (u(15) - 0.01), u(14) - 0.01, 0);
    }
    K.put(rbox(u(30) + 0.01, 0.02, 0.81, 0.008), gold, 0, 0.01, 0);
    K.put(cyl(0.05, 0.02, 0.06, 16), steel, 0, u(14) + 0.01, -0.22);
    K.put(cyl(0.012, u(42), 0.012, 10), steel, 0, u(35), -0.22);
    for (const sg of [-1, 1]) rod(K, L, steel, [0, u(56), -0.22], [sg * u(7), u(62), -0.2], 0.008);
    K.put(rbox(u(20), u(12), 0.02, 0.006), steel, 0, u(66), -0.2, 0, -0.3);
    K.put(new THREE.PlaneGeometry(u(17), u(10)).rotateX(-0.3), K.pic(music()), 0, u(66), -0.188);
    K.put(rbox(u(20), 0.02, 0.04, 0.006), steel, 0, u(60.5), -0.165);
    rod(K, L, K.gloss('#f4f4f0'), [-u(6), u(61.5), -0.15], [u(8), u(62.5), -0.14], 0.005);
  },

  gramophone(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, brass = K.metal(BRASS), wood = K.wood(), h = u(18);
    // the cabinet, its turntable and record, the tone arm, the crank
    K.put(rbox(u(26), h - u(2), 0.6, 0.02), wood, 0, u(2) + (h - u(2)) / 2, 0);
    K.put(rbox(u(26) + 0.02, u(2.5), 0.62, 0.012), K.wood(L.tone(K.pal.w, 0.6)), 0, u(1.25), 0);
    K.put(rbox(u(26) + 0.02, 0.02, 0.62, 0.008), K.wood(L.tone(K.pal.w, 1.15)), 0, h, 0);
    K.put(ball(u(2), 10, 8), K.metal(GOLD), X(26), u(10), 0.31);
    K.put(cyl(u(11), 0.012, u(11), 32), K.gloss('#1c1c22'), -0.06, h + 0.016, 0.05);
    K.put(cyl(u(3), 0.014, u(3), 20), K.gloss(K.pal.c), -0.06, h + 0.018, 0.05);
    rod(K, L, K.metal(SILVER), [0.22, h + 0.06, -0.18], [0.02, h + 0.04, 0.1], 0.007);
    K.put(cyl(0.025, 0.06, 0.025, 12), K.metal(SILVER), 0.22, h + 0.03, -0.18);
    rod(K, L, K.metal(SILVER), [u(13) + 0.02, u(10), 0], [u(13) + 0.09, u(10), 0], 0.008);
    rod(K, L, K.metal(SILVER), [u(13) + 0.09, u(10), 0], [u(13) + 0.09, u(4), 0.04], 0.008);
    K.put(cyl(0.012, 0.05, 0.012, 8).rotateZ(Math.PI / 2), K.wood(L.tone(K.pal.w, 0.6)), u(13) + 0.12, u(4), 0.04);
    // the horn, rising from the back and flaring forward
    const path = [[0.2, h + 0.03, -0.2], [0.18, h + 0.2, -0.2], [0.12, u(40), -0.12], [0.06, u(55), -0.02], [0.03, u(64), 0.06]];
    K.put(taper(L, path, u(1.1), u(3.2), 32), brass);
    K.put(aim(L, bell(L, u(3.2), u(10), u(12)), [0.0, 0.55, 0.8]), brass, 0.03, u(64), 0.06);
  },

  metronome(K, s, W, D, L) {
    const { rbox, lathe, cyl } = L, wood = K.gloss(K.pal.w), H = u(46);
    // a wooden pyramid, a pale face with its scale, the pendulum and its weight
    const body = lathe([[u(13), 0], [u(4), H], [0, H]], 4).rotateY(Math.PI / 4);
    body.scale(1, 1, 0.62);
    K.put(rbox(u(24), u(4), 0.4, 0.012), K.wood(L.tone(K.pal.w, 0.7)), 0, u(2), 0);
    K.put(body, wood, 0, u(4), 0);
    const slope = Math.atan((u(13) - u(4)) * 0.62 * Math.SQRT1_2 * 2 / H) * 0.5, zf = (y) => (u(13) - (u(13) - u(4)) * (y / H)) * 0.62 * Math.SQRT1_2 * 1.0;
    const face = slab(L, [[-u(7), 0], [u(7), 0], [u(3), u(28)], [-u(3), u(28)]], 0.012, 0.003);
    K.put(face.rotateX(-slope), K.gloss(K.pal.p), 0, u(10), zf(u(8)) + 0.004);
    for (let j = 0; j < 6; j++) K.put(rbox(u(4), 0.008, 0.006, 0.002), K.plain(L.tone(K.pal.p, 0.6)), 0, u(14 + j * 4), zf(u(10 + j * 4)) + 0.01);
    rod(K, L, K.metal(INK), [0, u(12), zf(u(8)) + 0.02], [u(5), u(44), zf(u(40)) + 0.025], 0.006);
    K.put(rbox(u(4), u(3), 0.025, 0.006), K.metal(GOLD), u(3.5), u(34), zf(u(30)) + 0.03, 0, 0, -0.16);
    K.put(rbox(u(12), u(4), 0.03, 0.008), K.wood(L.tone(K.pal.w, 0.8)), 0, u(8), zf(u(4)) + 0.01);
    K.put(cyl(0.012, 0.04, 0.012, 8).rotateZ(Math.PI / 2), K.metal(SILVER), u(8), u(6), 0);
  },

  micstand(K, s, W, D, L) {
    const { cyl, ball, lathe } = L, steel = K.metal(), cable = K.gloss(K.pal.c);
    K.put(cyl(u(9), 0.03, u(9.5), 24), steel, 0, 0.015, 0);
    K.put(cyl(0.012, u(58), 0.014, 10), steel, 0, u(31), 0);
    K.put(cyl(0.02, 0.04, 0.02, 10), steel, 0, u(60), 0);
    rod(K, L, steel, [0, u(60), 0], [u(6), u(70), 0.03], 0.01);
    // the mic tipped towards you: handle, black ring, mesh head
    const dir = [0.25, 1, 0.6];
    K.put(aim(L, lathe([[0.01, 0], [u(1.6), 0.01], [u(2.4), u(7)], [0, u(7)]], 16), dir), K.gloss(INK), u(6), u(70), 0.03);
    K.put(ball(u(3.6), 18, 14).scale(1, 1.15, 1), K.metal(SILVER), u(6) + 0.04, u(70) + u(9.5), 0.08);
    K.put(cyl(u(3.7), u(1.2), u(3.7), 18).rotateX(0.5).rotateZ(-0.2), K.gloss(INK), u(6) + 0.03, u(70) + u(7.2), 0.065);
    // its cable down the pole and away over the floor
    K.put(tube(L, [[u(6), u(70), 0.0], [0.04, u(52), -0.02], [0.03, u(20), -0.03], [0.06, 0.03, 0.02], [0.24, 0.01, 0.2], [0.42, 0.01, 0.12]], 0.007, 40), cable);
  },

  mixingdesk(K, s, W, D, L) {
    const { rbox, cyl } = L, metal = K.metal(), dark = K.gloss(L.tone(K.pal.m, 0.55)), wood = K.wood();
    for (const x of [X(6, W), X(58, W)]) for (const z of [-0.26, 0.24]) K.put(cyl(0.035, u(22), 0.03, 12), metal, x, u(11), z);
    K.put(rbox(W - 0.06, u(10), 0.7, 0.02), wood, 0, u(27), 0);
    for (const x of [X(14, W), X(50, W)]) K.put(rbox(u(16), u(6), 0.02, 0.008), K.wood(L.tone(K.pal.w, 0.8)), x, u(27), 0.351);
    // the sloping control surface: a fader per channel, two rows of knobs
    const slope = 0.22, y = u(34.5);
    K.put(rbox(W - 0.08, 0.06, 0.66, 0.02).rotateX(slope), dark, 0, y, 0);
    const n = Math.floor((64 - 10) / 5), along = (z) => [y + 0.035 - z * Math.sin(slope), z * Math.cos(slope)];
    for (let i = 0; i < n; i++) {
      const x = X(7 + i * 5, W);
      const [ys, zs] = along(0.05);
      K.put(rbox(0.012, 0.004, 0.2, 0.002).rotateX(slope), K.plain('#141418'), x, ys, zs);
      const [yf, zf] = along(0.05 + ((i * 3) % 5 - 2) * 0.03);
      K.put(rbox(0.04, 0.025, 0.03, 0.008).rotateX(slope), K.gloss(RAINBOW[i % 7]), x, yf + 0.01, zf);
      for (const [r, c] of [[-0.12, i % 3 ? SILVER : GOLD], [-0.19, SILVER]]) {
        const [yk, zk] = along(r);
        K.put(cyl(0.015, 0.025, 0.017, 12).rotateX(slope), K.metal(c), x, yk + 0.012, zk);
      }
      const [yb, zb] = along(0.24);
      K.put(rbox(0.03, 0.012, 0.02, 0.004).rotateX(slope), K.glow(i % 4 ? '#58e080' : '#e85a4a'), x, yb + 0.006, zb);
    }
    // the meter bridge at the back, where its EQ plays
    K.put(rbox(0.04, u(8), 0.04, 0.01), metal, 0, u(39), -0.27);
    K.put(rbox(u(22), u(14), 0.08, 0.015), dark, 0, u(48), -0.27);
    K.put(rbox(u(20), u(12), 0.01, 0.004), K.plain('#1a2a2a'), 0, u(48), -0.226);
  },

  tuba(K, s, W, D, L) {
    const { rbox, cyl, torus } = L, brass = K.metal(BRASS), wood = K.wood();
    // on a little wooden cradle: the big coil, the body rising to an upturned bell, four rotary valves
    K.put(rbox(u(16), u(4), 0.36, 0.012), wood, 0, u(2), 0);
    for (const sg of [-1, 1]) K.put(rbox(u(2), u(10), 0.06, 0.01), wood, sg * u(6), u(8), 0);
    K.put(torus(u(9), u(2.2), TAU, 36), brass, 0, u(26), 0);
    K.put(torus(u(5.5), u(1.6), TAU, 30), K.metal(L.tone(BRASS, 0.9)), 0, u(26), 0.03);
    K.put(cyl(u(3.5), u(36), u(3.2), 20), brass, X(21.5), u(48), 0);
    K.put(bell(L, u(3.5), u(12.5), u(15), 36), brass, X(21.5), u(65.5), 0);
    K.put(torus(u(12.4), 0.01, TAU, 36).rotateX(Math.PI / 2), K.metal(L.tone(BRASS, 1.2)), X(21.5), u(80.4), 0);
    for (let n = 0; n < 4; n++) {
      K.put(cyl(u(2.6), u(6), u(2.6), 14).rotateZ(Math.PI / 2), K.metal(L.tone(BRASS, 0.85)), X(11), u(50.5 - n * 5), 0);
      K.put(cyl(u(1.6), 0.02, u(1.6), 14).rotateZ(Math.PI / 2), K.gloss('#fff4d0'), X(7.5), u(50.5 - n * 5), 0);
    }
    K.put(taper(L, [[X(13), u(52), 0], [X(16), u(44), 0], [X(18.5), u(34), 0]], u(1.5), u(2), 16), brass);
    K.put(taper(L, [[X(9), u(54), 0], [X(6), u(60), 0], [X(4), u(63), 0.02]], u(1.4), u(0.9), 12), brass);
  },

  chimes(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, wood = K.wood(), silver = K.metal(SILVER);
    for (const x of [X(3.5), X(28.5)]) {
      K.put(cyl(u(1.6), u(84), u(1.8), 12), wood, x, u(42), 0);
      K.put(rbox(u(5), u(3), 0.5, 0.012), wood, x, u(1.5), 0);
    }
    K.put(rbox(u(31), u(5), 0.12, 0.015), wood, 0, u(85.5), 0);
    for (let n = 0; n < 6; n++) {
      const x = X(8.5 + n * 3.4), h = u(62 - n * 7);
      K.put(cyl(0.003, u(3), 0.003, 6), K.plain(INK), x, u(81.5), 0);
      K.put(cyl(u(1.3), h, u(1.3), 14), silver, x, u(80) - h / 2, 0);
      K.put(cyl(u(1.5), 0.02, u(1.5), 14), K.metal(GOLD), x, u(80), 0);
    }
    K.put(rbox(u(24), 0.03, 0.04, 0.01), K.cloth(K.pal.c), 0, u(76), 0.05);
    rod(K, L, wood, [X(28.5), u(34), 0.04], [X(22), u(20), 0.1], 0.008);
    K.put(ball(u(2), 12, 10), K.gloss(K.pal.c), X(21.5), u(19), 0.105);
  },

  musicstand(K, s, W, D, L) {
    const { THREE, rbox, cyl, ball } = L, steel = K.metal();
    for (let i = 0; i < 3; i++) {
      const a = Math.PI / 2 + i * TAU / 3, e = [Math.cos(a) * 0.24, 0.012, -Math.sin(a) * 0.24];
      rod(K, L, steel, [0, u(12), 0], e, 0.009);
      K.put(ball(0.016, 8, 6), K.gloss(INK), ...e);
    }
    K.put(cyl(0.012, u(46), 0.013, 10), steel, 0, u(35), 0);
    K.put(cyl(0.018, 0.04, 0.018, 10), steel, 0, u(36), 0);
    K.put(rbox(u(24), u(18), 0.015, 0.005), steel, 0, u(65), -0.01, 0, -0.28);
    K.put(new THREE.PlaneGeometry(u(20), u(15)).rotateX(-0.28), K.pic(music()), 0, u(65.3), 0.0);
    K.put(rbox(u(24), 0.016, 0.05, 0.005), steel, 0, u(57), 0.025);
  },

  /* ----- Library ----- */

  libraryladder(K, s, W, D, L) {
    const { rbox, cyl } = L, wood = K.wood(), brass = K.metal(BRASS), top = u(90);
    // leaning back against its brass rail, wheels at its foot
    const at = (y) => 0.3 - (y / top) * 0.68;
    for (const x of [-u(7), u(7)]) {
      rod(K, L, wood, [x, 0.06, at(0.06)], [x, top, at(top)], 0.022);
      K.put(cyl(u(3), 0.03, u(3), 18).rotateZ(Math.PI / 2), K.metal(), x, u(3), at(u(3)) + 0.01);
      K.put(rbox(0.03, 0.06, 0.05, 0.008), brass, x, top + 0.01, at(top) - 0.03);
    }
    for (let n = 0; n < 9; n++) { const y = u(10 + n * 9); K.put(rbox(u(17), 0.03, 0.09, 0.01), K.wood(L.tone(K.pal.w, 1.1)), 0, y, at(y)); }
    K.put(cyl(0.014, u(28), 0.014, 12).rotateZ(Math.PI / 2), brass, 0, top + 0.02, at(top) - 0.06);
    for (const x of [-u(13), u(13)]) K.put(rbox(0.03, 0.03, 0.06, 0.008), brass, x, top + 0.02, at(top) - 0.09);
  },

  bankerslamp(K, s, W, D, L) {
    const { THREE, rbox, cyl, ball } = L, wood = K.wood(), brass = K.metal(BRASS), y0 = u(32);
    // a little side table, the lamp on it: brass foot and stem, the green glass shade lit from inside
    for (const x of [X(6.5), X(25.5)]) for (const z of [-0.18, 0.18]) K.put(cyl(u(1.5), u(28), u(1.2), 12), wood, x, u(14), z);
    K.put(rbox(u(26), u(5), 0.52, 0.015), wood, 0, u(29.5), 0);
    K.put(cyl(u(8), 0.03, u(8.5), 24).scale(1, 1, 0.6), brass, 0, y0 + 0.015, 0);
    K.put(cyl(0.012, u(13), 0.012, 10), brass, 0, y0 + u(6.5), 0);
    const shade = new THREE.CylinderGeometry(u(5), u(5), u(22), 28, 1, false, 0, Math.PI).rotateZ(Math.PI / 2);
    K.put(shade, K.gloss(BANKER), 0, u(47), 0);
    K.put(rbox(u(21), 0.004, u(7), 0.002), K.glow('#fff0b0'), 0, u(47.5), 0);
    K.put(ball(0.022, 10, 8), K.glow('#fff4d0'), 0, u(48.5), 0);
    K.put(ball(0.02, 10, 8), brass, 0, u(52.5), 0);
    K.put(cyl(0.003, u(6), 0.003, 6), brass, X(23.5), u(43.5), 0.04);
    K.put(ball(0.01, 8, 6), brass, X(23.5), u(40.5), 0.04);
  },

  orrery(K, s, W, D, L) {
    const { THREE, rbox, cyl, ball, torus } = L, brass = K.metal(BRASS), c = u(44);
    K.put(rbox(u(16), u(8), 0.42, 0.02), K.wood(), 0, u(4), 0);
    K.put(cyl(u(2), u(20), u(2.4), 14), brass, 0, u(18), 0);
    K.put(torus(u(16), 0.01, TAU, 48), K.metal(L.tone(BRASS, 0.85)), 0, c, 0);
    K.put(torus(u(9), 0.006, TAU, 40).rotateX(Math.PI / 2), brass, 0, c, 0);
    K.put(cyl(0.008, u(14), 0.008, 8), brass, 0, u(35), 0);
    K.put(ball(u(4), 20, 14), K.gloss('#f8c040'), 0, c, 0);
    // the arms and their planets turn about the sun as one part (js/base-play.js's spin)
    const m = new THREE.MeshStandardMaterial({ map: L.canvasTex(orreryStrip(), false), roughness: 0.35, metalness: 0.3 });
    m.userData.kind = 'pic'; m.userData.pivot = { y: c, tilt: 0 };
    [[0.4, 9, 1, 2], [2.6, 9, 2, 2], [4.2, 14, 3, 3], [5.6, 14, 4, 2]].forEach(([a, r, col, sz]) => {
      const px = Math.cos(a) * u(r), pz = Math.sin(a) * u(r), arm = L.cyl(0.005, u(r), 0.005, 6).rotateZ(Math.PI / 2).rotateY(-a);
      K.put(cell(arm, 0, ORRERY.length), m, px / 2, c - 0.01, pz / 2);
      K.put(cell(L.cyl(0.005, 0.03, 0.005, 6), 0, ORRERY.length), m, px, c - 0.005, pz);
      K.put(cell(ball(u(sz), 16, 12), col, ORRERY.length), m, px, c + 0.03, pz);
      if (col === 3) K.put(cell(torus(u(sz) * 1.6, 0.006, TAU, 24).rotateX(Math.PI / 2 - 0.3), 0, ORRERY.length), m, px, c + 0.03, pz);
    });
  },

  scrollrack(K, s, W, D, L) {
    const { rbox, cyl } = L, wood = K.wood(), dark = K.wood(L.tone(K.pal.w, 0.7)), paper = K.gloss(PARCH);
    // an X-frame at the back, pegs out of it, scrolls lying across them
    for (const [a, b] of [[[X(4), 0, -0.12], [X(28), u(56), -0.12]], [[X(28), 0, -0.12], [X(4), u(56), -0.12]]]) rod(K, L, wood, a, b, 0.022);
    for (const x of [X(5), X(27)]) K.put(rbox(0.06, 0.04, 0.4, 0.012), wood, x, 0.02, 0.02);
    for (const [i, j, c] of [[10, 14, K.pal.c], [16, 24, '#4a7ac8'], [10, 34, K.pal.a], [22, 34, K.pal.c], [16, 44, '#4f9a42']]) {
      const x = X(i + 1), y = u(j);
      for (const dx of [-u(5), u(5)]) K.put(cyl(0.01, 0.2, 0.01, 8).rotateX(Math.PI / 2), dark, x + dx, y - u(3) - 0.01, -0.03);
      K.put(cyl(u(3), u(14), u(3), 18).rotateZ(Math.PI / 2), paper, x, y, 0.04);
      for (const sg of [-1, 1]) {
        K.put(cyl(u(2.4), 0.006, u(2.4), 18).rotateZ(Math.PI / 2), K.gloss(L.tone(PARCH, 0.8)), x + sg * (u(7) + 0.003), y, 0.04);
        K.put(cyl(0.012, 0.04, 0.012, 8).rotateZ(Math.PI / 2), dark, x + sg * (u(7) + 0.02), y, 0.04);
      }
      K.put(cyl(u(3.15), u(2), u(3.15), 18).rotateZ(Math.PI / 2), K.cloth(c), x - u(1), y, 0.04);
    }
  },

  bookarch(K, s, W, D, L) {
    const { rbox } = L, R = K.r, gold = K.metal(GOLD), d = 0.42;
    const book = (c, w, h, x, y, rz, ry = 0) => {
      K.put(rbox(w, h, d - R() * 0.06, 0.008), K.gloss(c), x, y, 0, ry, 0, rz);
    };
    // two pillars of books lying flat, then the arch of books standing on end round a half ellipse
    for (const i of [2, 50]) for (let n = 0; n < 10; n++) {
      const c = BOOKS[(n + i) % 5];
      book(c, u(12) - R() * 0.03, u(4) - 0.004, X(i + 6, W) + (R() - 0.5) * 0.03, u(2 + n * 4), 0, (R() - 0.5) * 0.12);
    }
    const ro = u(30), ri = u(18), rm = (ro + ri) / 2, sy = 1.3, n = 40;
    for (let k = 0; k < n; k++) {
      const a = (k + 0.5) / n * Math.PI, nx = Math.cos(a) * sy, ny = Math.sin(a), len = Math.hypot(nx, ny);
      const x = Math.cos(a) * rm, y = u(40) + Math.sin(a) * rm * sy, w = Math.PI * rm * Math.hypot(Math.sin(a), Math.cos(a) * sy) / n * 0.92;
      const rz = Math.atan2(ny / len, nx / len) - Math.PI / 2, c = BOOKS[k % 6];
      book(c, w, (ro - ri) * (0.94 + R() * 0.12) * Math.hypot(Math.cos(a), Math.sin(a) * sy) / 1.0, x, y, rz);
      K.put(rbox(w * 0.8, 0.012, 0.005, 0.002), gold, x - Math.sin(rz) * -0.02, y + Math.cos(rz) * 0.02, d / 2 + 0.002, 0, 0, rz);
    }
  },

  magnifier(K, s, W, D, L) {
    const { cyl, torus, ball } = L, brass = K.metal(BRASS);
    K.put(cyl(u(9.5), u(3), u(10.5), 28).scale(1, 1, 0.75), K.wood(), 0, u(1.5), 0);
    K.put(cyl(u(1.5), u(38), u(1.8), 12), brass, 0, u(22), 0);
    K.put(ball(u(2.2), 12, 10), brass, 0, u(3.5), 0);
    const tilt = -0.18;
    K.put(torus(u(13), u(1.6), TAU, 48).rotateX(tilt), brass, 0, u(54), 0);
    K.put(cyl(u(12.2), 0.02, u(12.2), 40).rotateX(Math.PI / 2 + tilt), K.glass(), 0, u(54), 0);
    K.put(ball(u(2), 12, 10), K.metal(L.tone(BRASS, 1.15)), 0, u(40.5), 0);
  },

  bust(K, s, W, D, L) {
    const { rbox, cyl, ball, lathe, blob } = L, stone = K.gloss(MARBLE), shade = K.gloss(L.tone(MARBLE, 0.9));
    // a fluted pedestal, then the bust: shoulders, neck, head and its curls
    K.put(rbox(u(16), u(6), 0.5, 0.015), stone, 0, u(3), 0);
    K.put(lathe([[u(6.5), 0], [u(6), u(2)], [u(6), u(36)], [u(6.6), u(38)], [0, u(38)]], 24), stone, 0, u(6), 0);
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; K.put(cyl(0.007, u(32), 0.007, 6), shade, Math.cos(a) * u(6), u(25), Math.sin(a) * u(6)); }
    K.put(rbox(u(18), u(5), 0.52, 0.015), stone, 0, u(45.5), 0);
    K.put(blob(u(21), u(13), 0.36, 0.5, 0.7), stone, 0, u(52), 0);
    K.put(cyl(u(2.6), u(10), u(3), 16), stone, 0, u(59), 0);
    K.put(ball(u(7), 24, 18).scale(0.95, 1.12, 1.05), stone, 0, u(69), 0.01);
    K.put(ball(u(1.4), 10, 8).scale(0.8, 1.2, 1), stone, 0, u(68), u(7.2));
    for (const sg of [-1, 1]) {
      K.put(ball(u(1.6), 10, 8).scale(0.5, 1, 0.8), stone, sg * u(6.6), u(69), 0);
      K.put(ball(u(0.9), 8, 6), shade, sg * u(2.4), u(70.5), u(6.2));
    }
    for (let i = 0; i < 11; i++) {
      const a = Math.PI * (0.05 + i * 0.09);
      K.put(ball(u(2.2), 10, 8), shade, Math.cos(a) * u(6.2), u(73) + Math.sin(a) * u(3.5), Math.sin(a) * u(1) - u(1.5));
    }
    for (let i = 0; i < 7; i++) { const a = Math.PI * (0.15 + i * 0.12); K.put(ball(u(2), 10, 8), shade, Math.cos(a) * u(5.6), u(75.5), u(2) + Math.sin(a) * u(2)); }
  },

  /* ----- Pirate ----- */

  mast(K, s, W, D, L) {
    const { rbox, cyl, lathe } = L, wood = K.wood(), rope = K.cloth(ROPE);
    K.put(rbox(0.62, u(6), 0.62, 0.02), K.wood(L.tone(K.pal.w, 0.8)), 0, u(3), 0);
    K.put(cyl(u(2.6), u(90), u(3.2), 16), wood, 0, u(51), 0);
    for (const [x, z] of [[-0.29, -0.29], [0.29, -0.29], [-0.29, 0.29], [0.29, 0.29]]) rod(K, L, rope, [0, u(70), 0], [x, u(6), z], 0.006);
    // the yard with its sail furled under it, tied off
    K.put(cyl(0.02, u(30), 0.02, 10).rotateZ(Math.PI / 2), wood, 0, u(56.5), 0.06);
    K.put(cyl(u(3), u(26), u(3), 16).rotateZ(Math.PI / 2), K.cloth(K.pal.p), 0, u(53), 0.08);
    for (let i = 0; i < 5; i++) K.put(cyl(u(3.2), 0.015, u(3.2), 16).rotateZ(Math.PI / 2), rope, X(5 + i * 6) + u(1), u(53), 0.08);
    // the crow's nest, a slatted tub on the mast
    K.put(lathe([[u(8), 0], [u(9), u(8)], [u(8.6), u(8)], [u(7.6), 0.012], [0, 0.012]], 24), wood, 0, u(76), 0);
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; K.put(rbox(0.008, u(8), 0.012, 0.003), K.wood(L.tone(K.pal.w, 0.7)), Math.cos(a) * u(8.6), u(80), Math.sin(a) * u(8.6), -a); }
    // a pennant flying from the top
    const flag = K.cloth(K.pal.c);
    for (let i = 0; i < 8; i++) K.put(rbox(u(1.2), u(5) - i * 0.012, 0.012, 0.004), flag, u(2.5) + i * u(1.1), u(92) + Math.sin(i) * 0.012, Math.sin(i * 0.9) * 0.025);
    K.put(L.ball(0.03, 10, 8), K.metal(GOLD), 0, u(96.5), 0);
  },

  cannonballs(K, s, W, D, L) {
    const { rbox, ball } = L, iron = K.gloss(IRON), r = u(5);
    K.put(rbox(u(30), u(6), 0.95, 0.02), K.wood(), 0, u(3), 0);
    K.put(rbox(u(26), u(1), 0.8, 0.01), K.wood(L.tone(K.pal.w, 0.6)), 0, u(6), 0);
    // a square pyramid: nine, four, one
    for (let l = 0; l < 3; l++) {
      const n = 3 - l, y = u(6) + r + l * r * Math.SQRT2;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) K.put(ball(r, 18, 14), iron, (i - (n - 1) / 2) * r * 2.02, y, (j - (n - 1) / 2) * r * 2.02);
    }
  },

  shipbell(K, s, W, D, L) {
    const { rbox, cyl, lathe, ball, torus } = L, wood = K.wood(), brass = K.metal(BRASS);
    for (const x of [X(6), X(27)]) {
      K.put(rbox(u(4), u(70), 0.08, 0.012), wood, x, u(35), 0);
      K.put(rbox(u(6), u(4), 0.45, 0.012), wood, x, u(2), 0);
    }
    K.put(rbox(u(29), u(5), 0.12, 0.015), wood, 0, u(71.5), 0);
    K.put(cyl(0.012, u(5), 0.012, 8), K.metal(), 0, u(66.5), 0);
    K.put(torus(0.03, 0.008, TAU, 16), K.metal(), 0, u(64), 0);
    K.put(lathe([[u(11), 0], [u(11.3), u(1)], [u(10), u(3)], [u(7), u(9)], [u(5.4), u(17)], [u(5), u(21)], [u(2), u(22)], [0, u(22)]], 32), brass, 0, u(42), 0);
    K.put(torus(u(10.6), 0.012, TAU, 32).rotateX(Math.PI / 2), K.metal(L.tone(BRASS, 0.8)), 0, u(44.5), 0);
    K.put(ball(u(2.5), 12, 10), K.metal(L.tone(BRASS, 0.7)), 0, u(43), 0);
    K.put(cyl(0.008, u(19), 0.008, 8), K.cloth(ROPE), 0, u(33), 0);
    K.put(ball(u(2.2), 12, 10), K.cloth(ROPE), 0, u(23), 0);
  },

  ropecoil(K, s, W, D, L) {
    const r = u(1.4), turns = [], m = K.cloth(ROPE);
    // a flat spiral round a hollow middle, a second half-turn on top, the end trailing off to a corner
    for (let t = 0; t <= 1; t += 1 / 160) { const a = t * TAU * 4.2, R = u(13) - t * u(9); turns.push([Math.cos(a) * R, r, Math.sin(a) * R]); }
    for (let t = 0; t <= 1; t += 1 / 40) { const a = TAU * 4.2 + t * TAU * 1.1, R = u(4.5) + t * u(6); turns.push([Math.cos(a) * R, r * 2.8, Math.sin(a) * R]); }
    K.put(tube(L, turns, r, 360), m);
    const a0 = 0, R0 = u(13);
    K.put(tube(L, [[Math.cos(a0) * R0, r, Math.sin(a0) * R0], [u(15), r, u(4)], [u(14), r, u(12)], [u(12), r, u(15)]], r, 24), m);
  },

  coinsack(K, s, W, D, L) {
    const { lathe, ball, cyl, torus } = L, sack = K.cloth('#b89868'), gold = K.metal(GOLD), R = K.r;
    // a bulging sack tied at the neck, its mouth spilling gold, coins on the floor and a gem on top
    K.put(lathe([[0, 0], [u(10), 0.01], [u(13.5), u(9)], [u(13), u(19)], [u(9), u(26)], [u(7.5), u(29)], [u(9.5), u(32)], [u(8.5), u(33)], [u(6.5), u(30.5)], [0, u(30.5)]], 32), sack, 0, 0, 0);
    K.put(torus(u(7.6), 0.012, TAU, 28).rotateX(Math.PI / 2), K.cloth(L.tone('#b89868', 0.6)), 0, u(28.5), 0);
    K.put(new L.THREE.SphereGeometry(u(7), 18, 10, 0, TAU, 0, Math.PI / 2).scale(1, 0.55, 1), gold, 0, u(30.4), 0);
    for (let n = 0; n < 9; n++) { const a = n * 2.4, r = u(2 + (n % 3) * 1.8); K.put(cyl(u(2), 0.01, u(2), 16).rotateX(0.3 * (R() - 0.5)).rotateZ(0.4 * (R() - 0.5)), gold, Math.cos(a) * r, u(32.5) + (n % 3) * 0.006, Math.sin(a) * r); }
    for (const [x, z, t] of [[0.36, 0.22, 0.1], [0.42, 0.06, -0.2], [0.3, 0.32, 0.3], [-0.36, 0.26, 0], [0.22, 0.4, 0.15]]) K.put(cyl(u(2.4), 0.012, u(2.4), 18).rotateX(t), gold, x, 0.012, z);
    K.put(new L.THREE.OctahedronGeometry(u(2.2)).scale(1, 1.3, 1), K.gloss('#58c8e8'), u(2), u(35), 0.02);
  },

  parrotperch(K, s, W, D, L) {
    const { cyl, ball, lathe, rbox } = L, wood = K.wood(), red = K.gloss('#e04040'), green = K.gloss('#58b848'), blue = K.gloss('#4a98d8');
    K.put(cyl(u(9), u(3), u(9.5), 24).scale(1, 1, 0.75), K.wood(L.tone(K.pal.w, 0.8)), 0, u(1.5), 0);
    K.put(cyl(u(1.5), u(50), u(1.8), 12), wood, 0, u(27), 0);
    K.put(cyl(u(1.4), u(24), u(1.4), 12).rotateZ(Math.PI / 2), wood, 0, u(50.5), 0);
    K.put(lathe([[u(1.6), 0], [u(2.4), u(4)], [u(2.2), u(4)], [0, 0.004]], 16), K.metal(SILVER), X(6), u(51.5), 0);
    K.put(cyl(u(2), 0.01, u(2), 14), K.plain('#c8a050'), X(6), u(55), 0);
    // the parrot on the right of the bar, turned a little to you
    const px = X(21), py = u(52), a = 0.5, fw = (dx, dz) => [px + dx * Math.cos(a) + dz * Math.sin(a), dz * Math.cos(a) - dx * Math.sin(a)];
    K.put(ball(u(5.5), 18, 14).scale(1, 1.45, 1), red, px, py + u(8), 0);
    K.put(ball(u(4.2), 18, 14), red, ...((p) => [p[0], py + u(19), p[1]])(fw(u(0.5), u(0.5))));
    const [bx, bz] = fw(u(1), u(4.4));
    K.put(lathe([[u(1.8), 0], [u(0.5), u(3)], [0, u(3)]], 12).rotateX(Math.PI / 2 + 0.5).rotateY(a), K.gloss('#f8d030'), bx, py + u(18), bz);
    for (const sg of [-1, 1]) {
      const [ex, ez] = fw(sg * u(2.4), u(3.2));
      K.put(ball(u(1.1), 10, 8), K.gloss('#ffffff'), ex, py + u(20.5), ez);
      K.put(ball(u(0.6), 8, 6), K.gloss('#141418'), ...((q) => [q[0], py + u(20.6), q[1]])(fw(sg * u(2.6), u(3.9))));
      const [wx, wz] = fw(sg * u(4.6), -u(0.5));
      K.put(ball(u(4.5), 14, 10).scale(0.35, 1.3, 0.8), green, wx, py + u(8), wz, a, 0, sg * 0.15);
    }
    const [tx, tz] = fw(0, -u(3));
    K.put(rbox(u(4), u(12), 0.03, 0.015), blue, tx, py - u(3), tz, a, -0.35);
    K.put(rbox(u(3), u(7), 0.032, 0.012), red, tx, py - u(1), tz + 0.004, a, -0.35);
    for (const sg of [-1, 1]) K.put(ball(u(1), 8, 6).scale(1, 0.6, 1.4), K.gloss('#8a8a92'), px + sg * u(2), py - u(1.3), 0.02);
  },

  spyglass(K, s, W, D, L) {
    const { cyl, ball, torus } = L, wood = K.wood(), brass = K.metal(BRASS), head = [0, u(34), 0];
    for (let i = 0; i < 3; i++) { const a = Math.PI / 2 + i * TAU / 3; rod(K, L, wood, head, [Math.cos(a) * 0.3, 0.01, -Math.sin(a) * 0.3], 0.014); }
    K.put(cyl(0.03, 0.04, 0.03, 12), K.metal(L.tone(BRASS, 0.8)), 0, u(34) + 0.02, 0);
    // three brass draws, narrowest at the eyepiece, pointing up and out
    const dir = [0.74, 0.62, 0.26], g = (n) => { const l = Math.hypot(...dir); return dir.map(v => v / l * n); };
    const at = (t) => g(t).map((v, i) => v + [0, u(37), 0][i]);
    [[-0.32, -0.16, u(2)], [-0.16, 0.04, u(2.6)], [0.04, 0.28, u(3.4)]].forEach(([a, b, r], i) => {
      const geo = aim(L, cyl(r, b - a, r, 18), dir), mid = at((a + b) / 2);
      K.put(geo, i === 1 ? K.metal(L.tone(BRASS, 0.9)) : brass, ...mid);
      const ring = aim(L, cyl(r + 0.006, 0.02, r + 0.006, 18), dir);
      K.put(ring, K.metal(L.tone(BRASS, 0.7)), ...at(b - 0.01));
    });
    K.put(aim(L, cyl(u(3.2), 0.006, u(3.2), 18), dir), K.glass(), ...at(0.285));
    K.put(aim(L, cyl(u(1.2), 0.04, u(1.4), 12), dir), K.gloss(INK), ...at(-0.34));
    K.put(ball(0.02, 10, 8), brass, 0, u(37), 0);
  },

  shipbottle(K, s, W, D, L) {
    const { rbox, cyl, lathe } = L, wood = K.wood();
    // a stand with two cradles, the bottle lying in them, a ship sailing a painted sea inside
    K.put(rbox(u(24), u(6), 0.32, 0.015), wood, 0, u(3), 0);
    for (const x of [X(8.5), X(24.5)]) K.put(rbox(u(3), u(4), 0.22, 0.01), wood, x, u(8), 0);
    const y = u(18), bottle = lathe([[0.01, 0], [u(7.6), 0.004], [u(8), u(2)], [u(8), u(20)], [u(6), u(22.5)], [u(3), u(24)], [u(3), u(27)], [u(3.4), u(27.5)], [u(3), u(28)]], 32);
    bottle.rotateZ(-Math.PI / 2);
    K.put(bottle, K.glass(), X(2.5), y, 0);
    K.put(cyl(u(2.8), u(4), u(2.6), 14).rotateZ(Math.PI / 2), K.plain('#a87838'), X(30), y, 0);
    K.put(rbox(u(20), u(3), 0.2, 0.02), K.gloss(SEA), X(14), y - u(5.5), 0);
    K.put(rbox(u(12), u(3), 0.07, 0.015), K.wood(L.tone(K.pal.w, 0.85)), X(14), y - u(2.6), 0);
    K.put(cyl(0.005, u(9), 0.005, 6), wood, X(14), y + u(2.5), 0);
    K.put(slab(L, [[0, 0], [u(5.5), 0], [0, u(7)]], 0.008, 0.002), K.cloth(K.pal.p), X(14) + 0.008, y - u(1), 0);
    K.put(rbox(u(3), u(1.2), 0.006, 0.002), K.cloth(K.pal.c), X(15.5), y + u(6.5), 0);
  },

  /* ----- Space ----- */

  ringedplanet(K, s, W, D, L) {
    const { rbox, cyl, torus, ball } = L, metal = K.metal(), c = u(50);
    // the stand and its half meridian, the banded planet, its tilted ring, a pin on top
    K.put(rbox(u(16), u(6), 0.4, 0.015), metal, 0, u(3), 0);
    K.put(cyl(u(1), u(28), u(1.2), 10), metal, 0, u(20), 0);
    K.put(torus(u(15), 0.012, Math.PI, 32).rotateZ(Math.PI / 2), metal, 0, c, 0);
    const globe = ball(u(11), 32, 20);
    K.put(globe, K.pic(bands(RINGED)), 0, c, 0);
    for (const [R, t, col] of [[u(15), u(1.5), '#c8b080'], [u(18), u(1.3), '#e8d8a8']]) K.put(torus(R, t, TAU, 48).scale(1, 1, 0.12).rotateX(Math.PI / 2 - 0.35).rotateZ(0.12), K.gloss(col), 0, c, 0);
    K.put(cyl(0.008, u(3), 0.008, 8), K.gloss(K.pal.a), 0, c + u(12), 0);
    K.put(ball(0.016, 8, 6), K.gloss(K.pal.a), 0, c + u(13.6), 0);
  },

  spacesuit(K, s, W, D, L) {
    const { THREE, rbox, cyl, ball, blob } = L, suit = K.gloss(SUIT), trim = K.gloss(K.pal.c), metal = K.metal();
    // on a display stand: boots, legs, the torso with its chest pack, arms, the backpack, the helmet
    K.put(rbox(u(20), u(6), 0.5, 0.015), metal, 0, u(3), 0);
    for (const sg of [-1, 1]) {
      K.put(rbox(u(7), u(5), 0.2, 0.03), trim, sg * u(4), u(8.5), 0.02);
      K.put(cyl(u(3.4), u(22), u(3.6), 16), suit, sg * u(4), u(21), 0);
      K.put(torus0(L, u(3.6), 0.012), trim, sg * u(4), u(13), 0);
    }
    K.put(blob(u(24), u(32), 0.3, 0.35, 0.5), suit, 0, u(46), 0);
    K.put(rbox(u(16), u(10), 0.05, 0.012), K.gloss(L.tone(SUIT, 0.88)), 0, u(47), 0.15);
    for (let n = 0; n < 3; n++) K.put(cyl(0.014, 0.02, 0.014, 10).rotateX(Math.PI / 2), K.gloss(RAINBOW[n * 2]), -u(4) + n * u(4), u(48.5), 0.178);
    K.put(rbox(u(24), u(2), 0.32, 0.01), trim, 0, u(44), 0);
    K.put(rbox(u(18), u(26), 0.16, 0.03), K.gloss(L.tone(SUIT, 0.9)), 0, u(47), -0.21);
    rod(K, L, metal, [0, u(6), -0.12], [0, u(34), -0.12], 0.014);
    for (const sg of [-1, 1]) {
      K.put(ball(u(4), 14, 10), suit, sg * u(13), u(58), 0);
      rod(K, L, suit, [sg * u(13.5), u(58), 0], [sg * u(15), u(40), 0.02], u(3));
      K.put(ball(u(3.2), 12, 10), trim, sg * u(15.2), u(37), 0.02);
    }
    K.put(cyl(u(6), u(3), u(7), 20), K.metal(SILVER), 0, u(62.5), 0);
    K.put(ball(u(11), 28, 20), suit, 0, u(72), 0);
    K.put(new THREE.SphereGeometry(u(11.3), 28, 20, Math.PI / 2 - 0.85, 1.7, Math.PI / 2 - 0.65, 1.15), K.gloss('#2a3a5a'), 0, u(72), 0);
    K.put(new THREE.SphereGeometry(u(11.35), 28, 20, Math.PI / 2 - 0.85, 1.7, Math.PI / 2 - 0.65, 1.15), K.M('glass', GOLD, { key: 'visor' }), 0, u(72), 0);
  },

  spacehelmet(K, s, W, D, L) {
    const { THREE, rbox, cyl, ball } = L, suit = K.gloss(SUIT);
    K.put(rbox(u(20), u(30), 0.5, 0.02), K.gloss(K.pal.p), 0, u(15), 0);
    K.put(rbox(u(20) + 0.01, u(2), 0.51, 0.008), K.gloss(K.pal.a), 0, u(29), 0);
    K.put(rbox(u(16), u(3), 0.01, 0.004), K.gloss(K.pal.a), 0, u(16.5), 0.251);
    K.put(cyl(u(11), u(5), u(12), 28), K.gloss(L.tone(SUIT, 0.85)), 0, u(32.5), 0);
    K.put(ball(u(14), 32, 22), suit, 0, u(47), 0);
    K.put(new THREE.SphereGeometry(u(14.3), 32, 22, Math.PI / 2 - 0.8, 1.6, Math.PI / 2 - 0.62, 1.1), K.metal(GOLD), 0, u(47), 0);
    for (const sg of [-1, 1]) {
      K.put(cyl(u(2.4), u(2), u(2.4), 16).rotateZ(Math.PI / 2), K.gloss(K.pal.c), sg * u(14), u(47), 0);
      K.put(rbox(u(2), u(6), u(2), 0.008), K.gloss(L.tone(SUIT, 0.85)), sg * u(10), u(58), -0.05);
    }
  },

  meteorite(K, s, W, D, L) {
    const { THREE, rbox } = L, R = K.r, ph = [R() * 9, R() * 9, R() * 9, R() * 9];
    K.put(rbox(u(20), u(10), 0.45, 0.015), K.metal(), 0, u(5), 0);
    K.put(rbox(u(12), u(2), 0.01, 0.004), K.metal(K.pal.a), 0, u(6), 0.226);
    // a lumpy rock, its surface pitted by the same few waves all round, glowing cracks pressed into its front
    const k = (x, y, z) => 1 + 0.12 * Math.sin(x * 3.1 + ph[0]) * Math.cos(y * 2.7 + ph[1]) + 0.08 * Math.sin(z * 4.3 + ph[2] + y * 2) + 0.05 * Math.sin((x + z) * 7 + ph[3]);
    const sx = u(14), sy = u(12), sz = u(12), cy = u(22);
    const g = new THREE.IcosahedronGeometry(1, 4), pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), f = k(x, y, z);
      pos.setXYZ(i, x * f * sx, y * f * sy, z * f * sz);
    }
    g.computeVertexNormals();
    K.put(L.weld(g), K.plain('#4a3e40'), 0, cy, 0);
    const onFront = ([px, py]) => {
      let a = u(px) / sx, b = (u(py) - cy) / sy;
      for (let it = 0; it < 4; it++) { const c = Math.sqrt(Math.max(0.05, 1 - a * a - b * b)), f = k(a, b, c); a = u(px) / (sx * f); b = (u(py) - cy) / (sy * f); }
      const c = Math.sqrt(Math.max(0.05, 1 - a * a - b * b));
      return [u(px), u(py), c * k(a, b, c) * sz + 0.002];
    };
    for (const line of [[[-6, 30], [-3, 26], [0, 22]], [[0, 22], [-1, 18], [-2, 14]], [[0, 22], [4, 24], [7, 26]]]) {
      const pts = [];
      for (let i = 0; i < line.length - 1; i++) for (let t = 0; t < 1; t += 0.25) pts.push(onFront([line[i][0] + (line[i + 1][0] - line[i][0]) * t, line[i][1] + (line[i + 1][1] - line[i][1]) * t]));
      pts.push(onFront(line[line.length - 1]));
      K.put(tube(L, pts, 0.008, 16), K.glow());
    }
  },

  ufolamp(K, s, W, D, L) {
    const { THREE, cyl, ball, lathe } = L, metal = K.metal();
    K.put(cyl(u(8), 0.03, u(9), 24), metal, 0, 0.015, 0);
    K.put(lathe([[u(7.5), 0], [u(3), u(40)], [0, u(40)]], 28), K.M('glass', '#c8f8d8', { key: 'beam' }), 0, 0.03, 0);
    // the saucer: a lens of metal, a ring of lights round its rim, a glass dome, its lit underside
    K.put(lathe([[0, 0], [u(9), u(0.6)], [u(14), u(2.6)], [u(14), u(3.4)], [u(9), u(5)], [0, u(5.2)]], 40), metal, 0, u(44), 0);
    K.put(cyl(u(6), 0.006, u(6), 24), K.glow('#c8f8d8'), 0, u(44) - 0.002, 0);
    for (let n = 0; n < 10; n++) { const a = n / 10 * TAU; K.put(ball(0.02, 10, 8), K.glow(n % 2 ? '#c8f8d8' : K.pal.a), Math.cos(a) * u(13.6), u(47), Math.sin(a) * u(13.6)); }
    K.put(new THREE.SphereGeometry(u(6), 24, 12, 0, TAU, 0, Math.PI / 2), K.M('glass', '#a8e8f8', { key: 'dome' }), 0, u(48.8), 0);
    K.put(ball(u(3), 16, 10).scale(1, 0.8, 1), K.glow('#a8e8f8'), 0, u(49.5), 0);
  },

  alienplant(K, s, W, D, L) {
    const { lathe, cyl, ball } = L;
    K.put(lathe([[u(6), 0], [u(6.2), 0.01], [u(8), u(13)], [u(8.6), u(13.4)], [u(8.6), u(14)], [u(7.6), u(14)], [0, u(13)]], 28), K.metal(), 0, 0, 0);
    K.put(cyl(u(7.4), 0.01, u(7.4), 24), K.plain('#3a2a4a'), 0, u(13.5), 0);
    // five swaying stems, each ending in a glowing bulb
    [[-6, 40, 0, -0.1], [0, 58, 1, 0], [6, 46, 2, 0.12], [-3, 26, 3, 0.18], [4, 30, 4, -0.16]].forEach(([dx, h, n, dz]) => {
      const pts = [];
      for (let k = 0; k <= 6; k++) { const f = k / 6, sy = f * h; pts.push([u(dx * f + Math.sin(sy / 6 + n) * 2), u(13.5 + sy), dz * f]); }
      K.put(taper(L, pts, u(1.4), u(0.8), 24), K.gloss('#6a3a9a'));
      const top = pts[6];
      K.put(ball(u(3.4), 16, 12), K.glow('#f0a0ff'), top[0], top[1] + u(2.5), top[2]);
    });
  },

  oxygentanks(K, s, W, D, L) {
    const { rbox, cyl, lathe, torus } = L, metal = K.metal();
    // a rack: base, two posts, a top bar, a strap round both tanks
    K.put(rbox(u(28), u(2), 0.42, 0.01), metal, 0, u(1), 0);
    for (const x of [X(5), X(27)]) K.put(rbox(u(2), u(49), 0.05, 0.008), metal, x, u(26), -0.16);
    K.put(rbox(u(27), u(3), 0.08, 0.01), metal, 0, u(50.5), -0.14);
    [[X(11.5), '#e8ecf0'], [X(21.5), K.pal.c]].forEach(([x, c]) => {
      K.put(lathe([[u(4.5), 0], [u(4.5), u(38)], [u(3.6), u(42)], [u(1.6), u(44)], [0, u(44)]], 28), K.gloss(c), x, u(2), 0);
      K.put(cyl(u(1.2), u(5), u(1.2), 12), K.metal(SILVER), x, u(48), 0);
      K.put(torus(u(2), 0.006, TAU, 16).rotateX(Math.PI / 2), K.metal(SILVER), x, u(50), 0);
      K.put(cyl(u(2.5), 0.02, u(2.5), 18).rotateX(Math.PI / 2), K.gloss('#ffffff'), x, u(30), u(4.5));
      K.put(rbox(0.006, u(2), 0.004, 0.002), K.plain('#e04848'), x, u(30.5), u(4.5) + 0.012, 0, 0, 0.6);
    });
    K.put(rbox(u(24), u(2), 0.32, 0.008), K.gloss(K.pal.a), 0, u(25), 0);
  },

  moonrock(K, s, W, D, L) {
    const { THREE, rbox, cyl, ball } = L, R = K.r, metal = K.metal();
    K.put(rbox(u(24), u(34), 0.5, 0.02), K.gloss(K.pal.p), 0, u(17), 0);
    K.put(rbox(u(24) + 0.01, u(2), 0.51, 0.008), K.gloss(K.pal.a), 0, u(33), 0);
    K.put(rbox(u(16), u(4), 0.01, 0.004), K.gloss(K.pal.a), 0, u(18), 0.251);
    // the rock on a little stand under a glass case with a metal frame
    K.put(cyl(0.03, u(4), 0.04, 12), metal, 0, u(36), 0);
    const g = new THREE.IcosahedronGeometry(1, 3), pos = g.attributes.position, ph = [R() * 6, R() * 6];
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), k = 1 + 0.1 * Math.sin(x * 4 + ph[0]) * Math.cos(z * 3 + y * 2 + ph[1]);
      pos.setXYZ(i, x * k * u(8), y * k * u(6), z * k * u(7));
    }
    g.computeVertexNormals();
    K.put(L.weld(g), K.plain('#a8a8a8'), 0, u(44), 0);
    for (const [x, y] of [[-3, 46], [3, 43], [0, 48.5]]) K.put(ball(u(1.4), 10, 8).scale(1, 1, 0.4), K.plain('#7a7a7a'), u(x), u(y), u(6.4));
    K.put(rbox(u(22), u(30), 0.42, 0.01), K.glass(), 0, u(49), 0);
    for (const x of [-1, 1]) for (const z of [-1, 1]) K.put(rbox(0.012, u(30), 0.012, 0.004), metal, x * u(11), u(49), z * 0.21);
    K.put(rbox(u(22) + 0.02, 0.025, 0.44, 0.008), metal, 0, u(64), 0);
  },

  moonrover(K, s, W, D, L) {
    const { rbox, cyl, ball, lathe } = L, silver = K.metal(SILVER), metal = K.metal();
    // six wire wheels, the chassis, two seats facing the way it drives, a gold dish and a little flag
    for (const x of [X(10, W), 0, X(54, W)]) for (const sg of [-1, 1]) {
      K.put(cyl(u(7), 0.07, u(7), 24).rotateX(Math.PI / 2), K.gloss('#3a3a44'), x, u(7), sg * 0.38);
      K.put(cyl(u(4.2), 0.075, u(4.2), 20).rotateX(Math.PI / 2), silver, x, u(7), sg * 0.38);
      K.put(cyl(u(1.5), 0.09, u(1.5), 12).rotateX(Math.PI / 2), metal, x, u(7), sg * 0.38);
    }
    K.put(rbox(W - 0.14, u(8), 0.62, 0.02), silver, 0, u(18), 0);
    K.put(rbox(W - 0.13, u(2), 0.63, 0.008), K.gloss(K.pal.c), 0, u(15), 0);
    for (const x of [X(17, W), X(29, W)]) {
      K.put(rbox(u(10), u(3), 0.26, 0.02), K.cloth(K.pal.p), x, u(23.5), 0);
      K.put(rbox(u(3), u(9), 0.26, 0.02), K.cloth(K.pal.p), x - u(5), u(28), 0);
    }
    K.put(cyl(0.012, u(18), 0.012, 8), metal, X(47, W), u(31), -0.12);
    K.put(aim(L, lathe([[0.01, 0], [u(6), u(2)], [u(6.2), u(2.2)], [u(5.6), u(2.2)], [0, u(0.4)]], 24), [0.25, 1, 0.5]), K.metal(GOLD), X(47, W), u(41), -0.12);
    K.put(cyl(0.008, u(12), 0.008, 8), metal, X(7, W), u(28), 0.2);
    K.put(rbox(u(6), u(4), 0.006, 0.002), K.cloth(K.pal.c), X(7, W) + u(3), u(32), 0.2);
  },

  lander(K, s, W, D, L) {
    const { rbox, cyl, ball, lathe } = L, silver = K.metal(SILVER), gold = K.metal(GOLD);
    // four splayed legs on round pads, the gold-foil descent stage, the cabin, its windows, hatch and antenna
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 4 + i * Math.PI / 2, c = Math.cos(a), sn = Math.sin(a);
      rod(K, L, silver, [c * u(8), u(30), sn * u(8)], [c * u(14), u(2), sn * u(14)], 0.012);
      rod(K, L, silver, [c * u(11), u(26), sn * u(11)], [c * u(14), u(2), sn * u(14)], 0.008);
      K.put(cyl(u(3), 0.02, u(3.4), 16), silver, c * u(14), 0.012, sn * u(14));
    }
    K.put(cyl(u(11.5), u(14), u(11.5), 8), gold, 0, u(33), 0, Math.PI / 8);
    K.put(lathe([[u(2), 0], [u(4), u(4)], [u(3.6), u(4)], [u(1.6), 0.004]], 18).rotateX(Math.PI), K.metal(), 0, u(26), 0);
    K.put(cyl(u(9), u(18), u(9.5), 6), K.gloss('#d8dce4'), 0, u(49), 0, Math.PI / 6);
    K.put(cyl(u(7), 0.02, u(9), 6), K.gloss('#f4f4f8'), 0, u(58), 0, Math.PI / 6);
    for (const sg of [-1, 1]) K.put(rbox(u(4), u(3), 0.01, 0.004), K.gloss(INK), sg * u(3.5), u(53), u(7.9), sg * 0.25);
    K.put(rbox(u(5), u(6), 0.015, 0.004), K.gloss(K.pal.c), 0, u(45), u(8.4));
    K.put(cyl(0.008, u(10), 0.008, 6), silver, -u(1), u(63), 0);
    K.put(ball(u(2.5), 12, 10), silver, -u(1), u(68.5), 0);
  },

  beacon(K, s, W, D, L) {
    const { rbox, ball, torus } = L, metal = K.metal(), light = K.metal(L.tone(K.pal.m, 1.2));
    K.put(rbox(u(16), u(10), 0.5, 0.015), metal, 0, u(5), 0);
    // a lattice mast tapering up, its red lamp in a cage, signal arcs either side
    const w = (y) => u(7) - (y - u(10)) / (u(80) - u(10)) * u(6);
    const leg = (y, i) => [Math.cos(Math.PI / 4 + i * Math.PI / 2) * w(y) * Math.SQRT2, y, Math.sin(Math.PI / 4 + i * Math.PI / 2) * w(y) * Math.SQRT2];
    for (let i = 0; i < 4; i++) rod(K, L, metal, leg(u(10), i), leg(u(80), i), 0.009);
    for (let y = u(16); y < u(76); y += u(9)) for (let i = 0; i < 4; i++) {
      rod(K, L, light, leg(y, i), leg(y + u(9), (i + 1) % 4), 0.005);
      rod(K, L, light, leg(y, i), leg(y, (i + 1) % 4), 0.005);
    }
    K.put(rbox(u(6), 0.02, u(6), 0.006), metal, 0, u(80), 0);
    K.put(ball(u(4), 18, 14), K.glow('#ff6060'), 0, u(84), 0);
    for (const y of [u(82), u(86)]) K.put(torus(u(4.4), 0.005, TAU, 20).rotateX(Math.PI / 2), metal, 0, y, 0);
    for (const sg of [-1, 1]) K.put(torus(u(8), 0.007, 1.2, 20).rotateZ(sg > 0 ? -0.6 : Math.PI - 0.6), K.gloss(L.tone(K.pal.a, 1.2)), 0, u(84), 0);
  },
};

/** A thin ring lying flat (a band round a leg). */
function torus0(L, r, t) { return L.torus(r, t, TAU, 24).rotateX(Math.PI / 2); }
