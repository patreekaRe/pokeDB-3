/* base-models-friends.js  -  each friend's second and third signature pieces (docs/roadmap.md step 8, session d,
   2026-10-15), modelled from parts like the arcade cabinets, in the style of their first piece (js/base-models-f.js's
   head says how a batch works). Their store pictures are js/base-furniture-friends.js. Each is in its friend's own
   colours, so none reads the theme's palette. */

import { rod, tube, pokeBall } from './base-models-kit.js';
import { BABY, BABYP, CREAM, PIKA, LACQUER, INK, NAVY, GOLD, PEACH, BOA, TEAL, RACK, LEMON, LAV, VIOLET, IRON, BROWN, MOON, SAND,
  BLOOD, NEON, AQUA, STEEL } from './base-furniture-friends.js';

const u = (n) => n / 32;
const TAU = Math.PI * 2;

const sheet = (w, h, draw) => { const c = new OffscreenCanvas(w, h); draw(c.getContext('2d'), w, h); return c; };
const pics = {};
const once = (key, make) => pics[key] || (pics[key] = make());
const text = (g, s, x, y, size, col, font = 'sans-serif') => {
  g.font = `bold ${size}px ${font}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = col; g.fillText(s, x, y);
};

/* ----- the pictures on them ----- */
/* Linc's granny-square blanket */
const granny = () => once('granny', () => sheet(64, 64, (g) => {
  const cols = [PIKA, CREAM, BABY, '#f4a0c0'];
  for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) for (let r = 0; r < 3; r++) {
    g.fillStyle = cols[(i + j + r) % 4]; g.fillRect(i * 16 + r * 2.5, j * 16 + r * 2.5, 16 - r * 5, 16 - r * 5);
  }
}));
/* Fire Emblem on a handheld: a green map, blue and red units, the cursor */
const fe = () => once('fe', () => sheet(128, 72, (g, w, h) => {
  g.fillStyle = '#5aa848'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#4a9840'; for (let i = 0; i < w; i += 16) for (let j = (i / 16) % 2 * 8; j < h; j += 16) g.fillRect(i, j, 8, 8);
  g.fillStyle = '#3a78d8'; for (const [i, j] of [[1, 3], [2, 3], [2, 2]]) g.fillRect(i * 16 + 2, j * 16 + 2, 12, 12);
  g.fillStyle = '#d84040'; for (const [i, j] of [[5, 1], [6, 2], [5, 3]]) g.fillRect(i * 16 + 2, j * 16 + 2, 12, 12);
  g.strokeStyle = '#f8e070'; g.lineWidth = 3; g.strokeRect(48, 32, 16, 16);
}));
/* a yellow note with a big ? on it */
const noteQ = () => once('noteq', () => sheet(64, 64, (g, w, h) => {
  g.fillStyle = '#f8e070'; g.fillRect(0, 0, w, h); text(g, '?', w / 2, h / 2 + 3, 52, '#4a78d0');
}));
/* the omikuji box's label */
const kujiLabel = () => once('kuji', () => sheet(48, 96, (g, w, h) => {
  g.fillStyle = '#fbf6e8'; g.fillRect(0, 0, w, h);
  g.strokeStyle = LACQUER; g.lineWidth = 3; g.strokeRect(3, 3, w - 6, h - 6);
  ['お', 'み', 'く', 'じ'].forEach((c, i) => text(g, c, w / 2, 16 + i * 21, 20, INK));
}));
/* Jahmes's clock face, stopped at eleven */
const clockFace = () => once('clock', () => sheet(128, 128, (g, w) => {
  const c = w / 2;
  g.fillStyle = '#fbf6e8'; g.beginPath(); g.arc(c, c, c - 2, 0, TAU); g.fill();
  g.fillStyle = NAVY;
  for (let n = 0; n < 12; n++) { const a = n / 12 * TAU; g.beginPath(); g.arc(c + Math.sin(a) * 50, c - Math.cos(a) * 50, n % 3 ? 3 : 5, 0, TAU); g.fill(); }
  g.strokeStyle = INK; g.lineCap = 'round';
  g.lineWidth = 7; g.beginPath(); g.moveTo(c, c); g.lineTo(c + Math.sin(-TAU / 12) * 30, c - Math.cos(-TAU / 12) * 30); g.stroke();
  g.lineWidth = 5; g.beginPath(); g.moveTo(c, c); g.lineTo(c, c - 44); g.stroke();
  text(g, 'BED', c, c + 28, 16, '#d84040');
}));
/* the phone on Clarence's ring light: LIVE at nine */
const camScreen = () => once('cam', () => sheet(64, 112, (g, w, h) => {
  const s = g.createLinearGradient(0, 0, 0, h); s.addColorStop(0, '#f8b890'); s.addColorStop(1, '#e86a8a');
  g.fillStyle = s; g.fillRect(0, 0, w, h);
  g.fillStyle = '#e83040'; g.beginPath(); g.roundRect(6, 8, 30, 14, 4); g.fill(); text(g, 'LIVE', 21, 15.5, 11, '#ffffff');
  text(g, '9PM', w / 2, h / 2, 22, '#ffffff'); text(g, '♥', w / 2, h / 2 + 30, 26, '#ffffff');
}));
/* Shaun's screens: a paused VOD, his stats, a ticket */
const vod = () => once('vod', () => sheet(160, 96, (g, w, h) => {
  g.fillStyle = '#2a3448'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#5a6a88'; for (const [x, y, a, b] of [[10, 10, 50, 30], [70, 20, 40, 60], [120, 10, 30, 40], [20, 55, 40, 30]]) g.fillRect(x, y, a, b);
  g.strokeStyle = '#e84848'; g.lineWidth = 4; g.beginPath(); g.moveTo(30, 40); g.lineTo(90, 50); g.lineTo(130, 30); g.stroke();
  g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(70, 34); g.lineTo(94, 48); g.lineTo(70, 62); g.fill();
  text(g, 'VOD', 26, 86, 14, TEAL);
}));
const stats = () => once('stats', () => sheet(160, 96, (g, w, h) => {
  g.fillStyle = '#3a2430'; g.fillRect(0, 0, w, h);
  text(g, 'DEFEAT', w / 2, 24, 26, '#e84848'); text(g, '34 / 12 / 4', w / 2, 58, 22, '#ffffff'); text(g, 'MVP', w / 2, 82, 16, PIKA);
}));
const ticket = () => once('ticket', () => sheet(160, 96, (g, w) => {
  g.fillStyle = '#e8f4f4'; g.fillRect(0, 0, w, 96); g.fillStyle = TEAL; g.fillRect(0, 0, w, 22);
  text(g, 'TICKET #4410', w / 2, 12, 15, '#ffffff'); text(g, 'Turn it off', w / 2, 44, 16, INK); text(g, 'and on again', w / 2, 66, 16, INK);
}));
const fixedTag = () => once('fixed', () => sheet(64, 32, (g, w, h) => {
  g.fillStyle = PIKA; g.beginPath(); g.moveTo(0, 0); g.lineTo(w - 10, 0); g.lineTo(w, h / 2); g.lineTo(w - 10, h); g.lineTo(0, h); g.fill();
  text(g, 'FIXED', w / 2 - 4, h / 2 + 1, 15, INK);
}));
/* the lemonade stand's stripes, its awning's, and its sign */
const stripes = (a, b, n) => once('stripes' + a + b + n, () => sheet(128, 32, (g, w, h) => {
  for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? a : b; g.fillRect(i * w / n, 0, w / n + 1, h); }
}));
const lemonSign = () => once('lemonsign', () => sheet(256, 64, (g, w, h) => {
  g.fillStyle = '#fbf6e8'; g.beginPath(); g.roundRect(2, 2, w - 4, h - 4, 14); g.fill();
  g.strokeStyle = '#d89a20'; g.lineWidth = 4; g.stroke();
  text(g, 'LEMONADE', w / 2 + 14, h / 2 + 2, 36, '#d89a20');
  g.fillStyle = LEMON; g.beginPath(); g.ellipse(26, h / 2, 16, 13, 0, 0, TAU); g.fill();
}));
/* Currents, roughly: a psychedelic swirl on its label */
const currents = () => once('currents', () => sheet(64, 64, (g, w) => {
  g.fillStyle = '#f06a40'; g.fillRect(0, 0, w, w);
  g.lineWidth = 3;
  for (let n = 0; n < 9; n++) { g.strokeStyle = ['#2a2a6a', '#f8d040', '#a858d8'][n % 3]; g.beginPath(); g.arc(w / 2, w / 2, 4 + n * 3.4, n * 0.7, n * 0.7 + Math.PI * 1.4); g.stroke(); }
}));
const doNotSit = () => once('nosit', () => sheet(96, 48, (g, w, h) => {
  g.fillStyle = '#fbf6e8'; g.fillRect(0, 0, w, h); g.strokeStyle = '#6a3a8a'; g.lineWidth = 3; g.strokeRect(3, 3, w - 6, h - 6);
  text(g, 'DO NOT', w / 2, 16, 15, INK); text(g, 'SIT', w / 2, 34, 17, '#c03030');
}));
/* Vice City's sunset, and VI in neon */
const sunset = () => once('sunset', () => sheet(128, 128, (g, w, h) => {
  const s = g.createLinearGradient(0, 0, 0, h); s.addColorStop(0, '#ffd060'); s.addColorStop(0.5, '#ff6a8a'); s.addColorStop(1, '#a03ad0');
  g.fillStyle = s; g.fillRect(0, 0, w, h);
  g.fillStyle = '#2a1830'; for (let n = 0; n < 6; n++) g.fillRect(0, 64 + n * 11, w, 2 + n * 1.2);
}));
const viSign = () => once('vi', () => sheet(96, 32, (g, w, h) => {
  g.shadowColor = NEON; g.shadowBlur = 8; text(g, 'VI', w / 2, h / 2 + 2, 28, '#ffd0ec');
}));
const viSticker = () => once('visticker', () => sheet(64, 64, (g, w) => {
  g.fillStyle = '#e86aa0'; g.beginPath(); g.roundRect(2, 2, w - 4, w - 4, 10); g.fill(); text(g, 'VI', w / 2, w / 2 + 3, 34, '#fbf6e8');
}));
const dialFace = () => once('dial', () => sheet(96, 96, (g, w) => {
  const c = w / 2;
  g.fillStyle = '#d0d8d8'; g.beginPath(); g.arc(c, c, c - 1, 0, TAU); g.fill();
  g.strokeStyle = INK; g.lineWidth = 2;
  for (let n = 0; n < 40; n++) { const a = n / 40 * TAU, r = n % 5 ? 40 : 34; g.beginPath(); g.moveTo(c + Math.cos(a) * r, c + Math.sin(a) * r); g.lineTo(c + Math.cos(a) * 46, c + Math.sin(a) * 46); g.stroke(); }
  g.fillStyle = '#9aa8a8'; g.beginPath(); g.arc(c, c, 22, 0, TAU); g.fill();
}));
const priceTag = () => once('price', () => sheet(64, 32, (g, w, h) => {
  g.fillStyle = '#fbf6e8'; g.fillRect(0, 0, w, h); text(g, '¥980', w / 2, h / 2 + 1, 18, '#c03030');
}));

/* ----- parts ----- */
const plane = (L, w, h) => new L.THREE.PlaneGeometry(w, h);
/** A put for the parts of something standing at (x, y, z): each part placed in its own frame, then tipped `rx`, leant
    `rz` and turned `ry` about that point. */
const posed = (K, x, y, z, ry = 0, rx = 0, rz = 0) => (geo, m, lx = 0, ly = 0, lz = 0) => {
  geo.translate(lx, ly, lz);
  if (rx) geo.rotateX(rx);
  if (rz) geo.rotateZ(rz);
  if (ry) geo.rotateY(ry);
  return K.put(geo, m, x, y, z);
};
/** A rod's geometry from a to b ([x, y, z] each), not yet placed (for a posed put). */
function stick(L, a, b, r, seg = 8) {
  const { THREE } = L, va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b), g = L.cyl(r, va.distanceTo(vb), r, seg);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize()));
  return g.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
}
/** A flat shape from [[x, y]...] points facing +z, `t` thick, its edges rounded a little. */
function slab(L, pts, t) {
  const { THREE } = L, sh = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2, curveSegments: 12 });
  return g.translate(0, 0, -t / 2);
}
/** A five-pointed star, `r` to its points, `t` thick, facing +z. */
function starGeo(L, r, t) {
  const pts = [];
  for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * 0.45 : r; pts.push([Math.cos(a) * q, Math.sin(a) * q]); }
  return slab(L, pts, t);
}
/** Balls strung along a curve through `pts`, `r` across, puffed out at random: a feather boa, a horn tapering when `taper`. */
function beads(K, L, put, m, pts, r, n, { puff = 0, taper = false, alt, seg = 10 } = {}) {
  const { THREE } = L, curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)));
  for (let i = 0; i <= n; i++) {
    const p = curve.getPoint(i / n), q = taper ? r * (1 - i / n * 0.85) : r;
    for (let k = 0; k < (puff ? 3 : 1); k++) {
      const o = puff ? [(K.r() - 0.5) * puff, (K.r() - 0.5) * puff, (K.r() - 0.5) * puff] : [0, 0, 0];
      put(L.ball(q * (puff ? 0.7 + K.r() * 0.5 : 1), seg, Math.round(seg * 0.75)), alt && (i + k) % 2 ? alt : m, p.x + o[0], p.y + o[1], p.z + o[2]);
    }
  }
}
const at = (K) => (geo, m, x = 0, y = 0, z = 0) => K.put(geo, m, x, y, z);

/** A Pikachu plush sitting at (x, y, z), `s` its size, turned `ry`. */
function pika(K, L, x, y, z, s = 1, ry = 0) {
  const { ball, blob, cyl } = L, P = posed(K, x, y, z, ry), fur = K.cloth(PIKA), ink = K.gloss(INK), red = K.gloss('#e84848');
  const S = (n) => u(n) * s;
  P(blob(S(12), S(11), S(10), 0.8, 0.8), fur, 0, S(5.5), 0);
  P(ball(S(5.5), 18, 14).scale(1.1, 0.95, 1), fur, 0, S(14), S(0.5));
  for (const sx of [-1, 1]) {
    P(cyl(0.002, S(7), S(1.8), 12).translate(0, S(3.5), 0).rotateZ(-sx * 0.45), fur, sx * S(3), S(17.5), 0);
    P(cyl(0.002, S(2.6), S(0.75), 12).translate(0, S(5.8), 0).rotateZ(-sx * 0.45), ink, sx * S(3), S(17.5), 0);
    P(ball(S(1), 10, 8).scale(1, 1.1, 0.5), ink, sx * S(2.2), S(15), S(5.4));
    P(ball(S(1.4), 10, 8).scale(1, 1, 0.4), red, sx * S(4), S(12.8), S(4.5));
    P(ball(S(2), 10, 8).scale(1, 0.7, 1.2), fur, sx * S(3.5), S(1.2), S(4));
  }
  P(ball(S(0.5), 8, 6), ink, 0, S(13.6), S(6));
  P(slab(L, [[0, 0], [S(3), S(3)], [S(1.5), S(4)], [S(5), S(8)], [S(2), S(8.5)], [S(-1), S(3.5)], [S(0.8), S(2.6)]], S(1.2)), fur, S(2), S(2), -S(5));
}
/** A cat sitting at (x, y, z) facing +z (turned `ry`), its coat `coat`; `fluffy` gives it Spooky's tail. */
function cat(K, L, x, y, z, coat, ry = 0, fluffy = false) {
  const { ball, blob, cyl } = L, P = posed(K, x, y, z, ry), fur = K.gloss(coat), eye = K.gloss('#e8d040'), ink = K.gloss(INK), pink = K.gloss('#f0a0b0');
  P(blob(u(11), u(12), u(12), 0.8, 0.8), fur, 0, u(6), -u(1));
  P(ball(u(5), 18, 14).scale(1.12, 0.95, 1), fur, 0, u(14.5), u(3));
  for (const sx of [-1, 1]) {
    P(cyl(0.002, u(4.2), u(2), 12).scale(1, 1, 0.55).rotateZ(-sx * 0.3), fur, sx * u(3), u(19), u(3));
    P(cyl(0.002, u(2.6), u(1.1), 10).scale(1, 1, 0.3).rotateZ(-sx * 0.3), pink, sx * u(3), u(18.8), u(3.5));
    P(ball(u(1), 12, 8).scale(1, 1.25, 0.5), eye, sx * u(2), u(15.5), u(7.4));
    P(ball(u(0.5), 8, 6).scale(0.6, 1.8, 0.5), ink, sx * u(2), u(15.5), u(7.8));
    P(ball(u(2), 12, 8).scale(1, 0.7, 1.2), fur, sx * u(2.4), u(1.2), u(4.6));
  }
  P(ball(u(0.6), 8, 6), pink, 0, u(14), u(8));
  P(tube(L, [[0, u(2), -u(7)], [u(6), u(1.6), -u(5)], [u(8), u(1.4), u(1)], [u(5), u(1.2), u(6)]], u(fluffy ? 2.6 : 1.3), 24), fur);
}
/** A gamepad lying at (x, y, z), turned `ry`. */
function pad(K, L, col, x, y, z, ry = 0) {
  const P = posed(K, x, y, z, ry), m = K.gloss(col), ink = K.gloss(INK);
  P(L.blob(u(8), u(1.8), u(4), 0.5, 0.6), m, 0, 0, 0);
  for (const sx of [-1, 1]) P(L.ball(u(2.2), 12, 10).scale(1, 0.6, 1.25), m, sx * u(3.4), -u(0.2), u(1.6));
  for (const [dx, dz] of [[-u(2), -u(0.4)], [u(1), u(0.9)]]) P(L.cyl(u(0.8), u(1.2), u(0.8), 10), ink, dx, u(0.8), dz);
  for (const [dx, dz, c] of [[u(2.6), -u(1), '#e84848'], [u(3.4), -u(0.2), '#58b848'], [u(1.8), -u(0.2), '#4a78d0']]) P(L.ball(u(0.5), 8, 6), K.gloss(c), dx, u(0.8), dz);
}
/** A mug at (x, y, z), its handle turned `ry`, `col` its glaze. */
function mug(K, L, x, y, z, col, ry = 0, full = true) {
  const P = posed(K, x, y, z, ry), m = K.gloss(col);
  P(L.cyl(u(1.8), u(3.6), u(1.7), 20), m, 0, u(1.8), 0);
  P(L.torus(u(1.1), u(0.35), TAU, 16), m, u(2), u(1.9), 0);
  if (full) P(L.cyl(u(1.55), u(0.2), u(1.55), 18), K.gloss('#4a2210'), 0, u(3.2), 0);
}

export const SHAPES = {
  linccrib: { make: 'linccrib' },
  tiredcouch: { make: 'tiredcouch', seat: 0.52 },
  omikuji: { make: 'omikuji' },
  handheldtansu: { make: 'handheldtansu' },
  curfewclock: { make: 'curfewclock' },
  curfewfuton: { make: 'curfewfuton' },
  ringlight: { make: 'ringlight' },
  showvanity: { make: 'showvanity' },
  helpdeskrack: { make: 'helpdeskrack' },
  tripledesk: { make: 'tripledesk' },
  serenadeguitar: { make: 'serenadeguitar' },
  lemonadestand: { make: 'lemonadestand' },
  bassamp: { make: 'bassamp' },
  vinylconsole: { make: 'vinylconsole' },
  saltcandelabra: { make: 'saltcandelabra' },
  nobodychair: { make: 'nobodychair' },   // no `seat`: nobody sits in it, visitors and your Pokémon included
  coffeecart: { make: 'coffeecart' },
  allnightmoon: { make: 'allnightmoon' },
  katanastand: { make: 'katanastand' },
  broodpillar: { make: 'broodpillar' },
  neonpalm: { make: 'neonpalm' },
  heistsafe: { make: 'heistsafe' },
};

export const MAKES = {
  // ----- the Nietos -----
  linccrib(K, s, W, D, L) {
    const { rbox, cyl, ball, blob, torus } = L, frame = K.gloss(BABY), pale = K.gloss(BABYP), hw = W / 2 - u(3), hd = u(13);
    // four posts with round knobs, rails top and bottom all round, slats between them
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      K.put(cyl(u(1.4), u(40), u(1.6), 14), frame, sx * hw, u(20), sz * hd);
      K.put(ball(u(2), 14, 10), pale, sx * hw, u(41), sz * hd);
    }
    for (const y of [u(10), u(36)]) {
      for (const sz of [-1, 1]) K.put(rbox(hw * 2, u(2), u(2), 0.006), frame, 0, y, sz * hd);
      for (const sx of [-1, 1]) K.put(rbox(u(2), u(2), hd * 2, 0.006), frame, sx * hw, y, 0);
    }
    for (let i = 1; i < 12; i++) for (const sz of [-1, 1]) K.put(cyl(u(0.6), u(24), u(0.6), 8), pale, -hw + i * hw * 2 / 12, u(23), sz * hd);
    for (let i = 1; i < 5; i++) for (const sx of [-1, 1]) K.put(cyl(u(0.6), u(24), u(0.6), 8), pale, sx * hw, u(23), -hd + i * hd * 2 / 5);
    // the mattress, a blue blanket rucked over the foot, a pillow, and Linc's Pikachu
    K.put(rbox(hw * 2 - u(2), u(4), hd * 2 - u(2), 0.02), K.cloth(CREAM), 0, u(13), 0);
    K.put(blob(hw * 1.05, u(4), hd * 1.8, 0.4, 0.6), K.cloth(BABY), u(10), u(16), 0, 0.05);
    K.put(blob(u(11), u(4), u(16), 0.5, 0.5), K.cloth(BABYP), -hw + u(8), u(16.5), 0);
    pika(K, L, -u(6), u(15), u(2), 0.85, 0.3);
    // the mobile: an arm up off the back corner, a ring over the middle, a Poké Ball, a Pikachu, a cloud and a star on strings
    const top = [u(4), u(66), 0];
    K.put(tube(L, [[hw, u(42), -hd], [hw, u(58), -hd], [hw * 0.7, u(66), -hd * 0.5], top], u(0.7), 24), frame);
    K.put(torus(u(7), u(0.5), TAU, 32), pale, top[0], u(63), 0, 0, Math.PI / 2);
    K.put(cyl(u(0.3), u(3), u(0.3), 6), pale, top[0], u(64.5), 0);
    const white = K.gloss('#f4f4f0');
    [0, 1, 2, 3].forEach(n => {
      const a = n / 4 * TAU + 0.4, hx = top[0] + Math.cos(a) * u(7), hz = Math.sin(a) * u(7), y = u(53 + (n % 2) * 2);
      K.put(cyl(0.002, u(63) - y, 0.002, 4), white, hx, (u(63) + y) / 2, hz);
      if (n === 0) pokeBall(K, L, hx, y - u(2), hz, u(2.2));
      if (n === 1) {
        K.put(ball(u(2.4), 14, 10), K.gloss(PIKA), hx, y - u(2.2), hz);
        for (const sx of [-1, 1]) K.put(cyl(0.002, u(3), u(0.9), 10).rotateZ(-sx * 0.5), K.gloss(PIKA), hx + sx * u(1.6), y, hz);
      }
      if (n === 2) K.put(blob(u(5), u(3), u(2.4), 0.6, 0.6), white, hx, y - u(1.6), hz);
      if (n === 3) K.put(starGeo(L, u(2.6), u(0.8)), K.gloss(PIKA), hx, y - u(2.4), hz);
    });
  },

  tiredcouch(K, s, W, D, L) {
    const { rbox, blob, cyl, ball, torus } = L, C = '#9cc8e8', frame = K.cloth(L.tone(C, 0.85)), cush = K.cloth(C), arm = K.cloth(L.tone(C, 1.08));
    // stubby legs, the frame, its low back and rolled arms
    for (const [lx, lz] of L.legsAt(W - u(6), u(24), u(2))) L.leg(K, K.wood(BROWN), lx, lz, u(4), u(1.2));
    K.put(rbox(W - u(6), u(9), u(26), 0.03), frame, 0, u(8.5), 0);
    K.put(rbox(W - u(6), u(16), u(7), 0.03), frame, 0, u(18), -u(9.5));
    for (const sx of [-1, 1]) {
      K.put(rbox(u(6), u(14), u(26), 0.03), arm, sx * (W / 2 - u(5)), u(12), 0);
      K.put(cyl(u(3.4), u(26), u(3.4), 20), arm, sx * (W / 2 - u(5)), u(19), 0, 0, Math.PI / 2);
    }
    // the cushions, sagged into the middle where everyone sits, the back ones slumped against each other
    const cw = (W - u(18)) / 2;
    for (const sx of [-1, 1]) {
      K.put(blob(cw, u(6), u(20), 0.35, 0.5), cush, sx * (cw / 2 + u(0.4)), u(14.5), u(2), 0, 0, sx * 0.07);
      K.put(blob(cw, u(14), u(7), 0.4, 0.5), cush, sx * (cw / 2 + u(0.4)), u(25), -u(6), 0, -0.3, sx * 0.12);
    }
    // Linc's granny-square blanket over the back, two controllers on the seat and his dummy
    K.put(blob(u(20), u(3), u(13), 0.3, 0.5), K.pic(granny()), -u(14), u(31), -u(8), 0, -0.6);
    pad(K, L, '#e86aa0', u(9), u(18), u(5), 0.4);
    pad(K, L, '#4a78d0', u(21), u(17.6), u(7), -0.3);
    const dummy = posed(K, -u(16), u(18), u(6), 0.5, -1.2);
    dummy(blob(u(4.5), u(3), u(1), 0.6, 0.6), K.gloss('#f4a0c0'), 0, 0, 0);
    dummy(torus(u(1.4), u(0.4), TAU, 16), K.gloss('#f4a0c0'), 0, 0, u(0.8));
    dummy(ball(u(1), 10, 8).scale(1, 1, 1.3), K.gloss('#fbe8d8'), 0, 0, -u(1));
  },

  // ----- John -----
  omikuji(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, lac = K.gloss(LACQUER), ink = K.gloss(INK), wood = K.wood('#8a5a34'), paper = K.cloth('#fbf6e8'), rope = K.cloth('#e0c070');
    // the lacquered stand, black-topped, its label on the front
    K.put(rbox(u(22), u(20), u(13), 0.012), lac, 0, u(11), u(4));
    K.put(rbox(u(23), u(1.6), u(14), 0.006), ink, 0, u(21.6), u(4));
    K.put(rbox(u(23), u(2), u(14), 0.006), ink, 0, u(1), u(4));
    K.put(plane(L, u(6), u(12)), L.decal(kujiLabel()), 0, u(11), u(10.56));
    // the six-sided box to shake, its stick poking out, and a blue fortune drawn: a ? (John's, of course)
    K.put(cyl(u(4.2), u(13), u(4.2), 6), K.wood('#c89a5a'), -u(4), u(29), u(4));
    K.put(cyl(u(4.3), u(3.5), u(4.3), 6), paper, -u(4), u(30), u(4));
    K.put(cyl(u(0.6), u(4), u(0.6), 6), K.wood('#e0c090'), -u(4), u(37), u(4));
    K.put(rbox(u(5), u(0.4), u(2.4), 0.001), K.gloss('#4a78d0'), u(5), u(22.6), u(6), 0.4);
    // the rack behind: two posts, a beam, three ropes with fortunes tied all along them, under a little gabled roof
    for (const sx of [-1, 1]) K.put(cyl(u(1.2), u(58), u(1.4), 12), wood, sx * u(13), u(29), -u(8));
    K.put(rbox(u(30), u(2), u(2.5), 0.006), wood, 0, u(56), -u(8));
    [u(34), u(41), u(48)].forEach((y, row) => {
      K.put(cyl(u(0.45), u(26), u(0.45), 8), rope, 0, y, -u(8), 0, 0, Math.PI / 2);
      for (let n = 0; n < 7; n++) {
        const fx = -u(11) + n * u(3.6) + K.r() * u(0.8), blue = row === 1 && n === 3;
        K.put(ball(u(0.8), 8, 6), blue ? K.gloss('#4a78d0') : paper, fx, y, -u(8) + u(0.4));
        K.put(rbox(u(1.6), u(3.6), u(0.5), 0.002), blue ? K.gloss('#4a78d0') : paper, fx, y - u(2.6), -u(8) + u(0.5), 0, 0, (K.r() - 0.5) * 0.3);
      }
    });
    const roof = K.gloss('#3a4a58');
    for (const sz of [-1, 1]) K.put(rbox(u(31), u(1.2), u(8), 0.006), roof, 0, u(60), -u(8) + sz * u(3.2), 0, sz * 0.5);
    K.put(cyl(u(1), u(32), u(1), 12), roof, 0, u(61.8), -u(8), 0, 0, Math.PI / 2);
  },

  handheldtansu(K, s, W, D, L) {
    const { rbox, cyl, torus, ball, blob } = L, T = '#6a3e22', wood = K.wood(T), front = K.wood(L.tone(T, 0.82)), iron = K.metal('#2a2a30');
    const grey = K.gloss('#3a3a44'), dark = K.gloss('#2a2a30');
    // the step chest: a long low block and a tall narrow one on its left, drawers with iron pulls
    K.put(rbox(u(28), u(22), u(17), 0.01), wood, 0, u(11), 0);
    K.put(rbox(u(15), u(22), u(17), 0.01), wood, -u(6.5), u(33), 0);
    const drawer = (cx, cy, w) => {
      K.put(rbox(w, u(8.4), u(1), 0.006), front, cx, cy, u(8.6));
      K.put(rbox(u(4.4), u(2), u(0.4), 0.002), iron, cx, cy + u(0.6), u(9.2));
      K.put(torus(u(1.6), u(0.35), Math.PI, 12), iron, cx, cy + u(0.4), u(9.6), 0, 0, Math.PI);
    };
    drawer(0, u(5.5), u(26)); drawer(-u(6.7), u(15.5), u(12.6)); drawer(u(6.7), u(15.5), u(12.6));
    drawer(-u(6.5), u(28), u(13)); drawer(-u(6.5), u(38.5), u(13));
    for (const [cx, cy] of [[-u(13.5), u(21)], [u(13.5), u(21)], [-u(13.5), u(43)], [u(0.5), u(43)]]) K.put(rbox(u(1.6), u(1.6), u(17.4), 0.003), iron, cx, cy, 0);
    // his Switch 2 docked on top, joy-cons on
    K.put(rbox(u(8), u(5), u(3), 0.006), dark, -u(6.5), u(46.5), -u(1));
    K.put(rbox(u(9), u(5.4), u(0.8), 0.004), dark, -u(6.5), u(50), u(0.8));
    K.put(plane(L, u(8.2), u(4.6)), L.litPic(fe(), 0.6), -u(6.5), u(50), u(1.22));
    K.put(rbox(u(2), u(5.4), u(1.1), 0.006), K.gloss('#3ab0e8'), -u(12), u(50), u(0.8));
    K.put(rbox(u(2), u(5.4), u(1.1), 0.006), K.gloss('#e84848'), -u(1), u(50), u(0.8));
    // his AYN Thor open on the lower step, both screens on
    K.put(rbox(u(7), u(0.8), u(4.4), 0.004), grey, u(7.5), u(22.4), u(4.5));
    K.put(plane(L, u(6), u(3.6)), L.litPic(fe(), 0.5), u(7.5), u(22.85), u(4.6), 0, -Math.PI / 2);
    const lid = posed(K, u(7.5), u(22.8), u(2.4), 0, -0.35);
    lid(rbox(u(7), u(4.4), u(0.6), 0.004), grey, 0, u(2.2), 0);
    lid(plane(L, u(6), u(3.6)), L.litPic(fe(), 0.6), 0, u(2.2), u(0.32));
    // his Steam Deck in its dock behind, leant back
    K.put(rbox(u(9), u(2), u(4), 0.006), dark, u(7.5), u(23), -u(4.5));
    const deck = posed(K, u(7.5), u(27.2), -u(4.2), 0, -0.4);
    deck(rbox(u(12.5), u(5.4), u(1.3), 0.012), grey, 0, 0, 0);
    deck(plane(L, u(6.6), u(3.8)), L.litPic(fe(), 0.6), 0, u(0.2), u(0.67));
    for (const sx of [-1, 1]) {
      deck(cyl(u(0.6), u(0.6), u(0.6), 10).rotateX(Math.PI / 2), dark, sx * u(4.8), u(1.2), u(0.8));
      deck(rbox(u(1.6), u(1.6), u(0.2), 0.002), K.gloss('#4a4a54'), sx * u(4.8), -u(1.3), u(0.7));
    }
    // charging lights, their cables down the back, and a note: ?
    for (const [x, y, z, c] of [[-u(2.6), u(47), u(0.6), '#58e858'], [u(11.6), u(23.6), -u(2.4), '#f0a040'], [u(10.8), u(22.9), u(6.8), '#58e858']]) K.put(ball(u(0.4), 8, 6), K.glow(c), x, y, z);
    K.put(tube(L, [[-u(6.5), u(46), -u(2.5)], [-u(6.5), u(44.6), -u(8)], [-u(4), u(30), -u(9)], [-u(2), u(2), -u(9)]], u(0.35), 20), dark);
    K.put(plane(L, u(4.4), u(4.4)), L.decal(noteQ()), u(1) + 0.004, u(37), u(3), Math.PI / 2, 0, 0.1);
  },

  // ----- Jahmes -----
  curfewclock(K, s, W, D, L) {
    const { rbox, cyl, ball, torus, THREE } = L, navy = K.gloss(NAVY), lite = K.gloss(L.tone(NAVY, 1.25)), gold = K.metal(GOLD);
    // a plinth, the long trunk with its window and pendulum, the hood with the face, an arched crown
    K.put(rbox(u(19), u(14), u(13), 0.012), navy, 0, u(7), 0);
    K.put(rbox(u(20), u(1.6), u(14), 0.006), lite, 0, u(14.6), 0);
    K.put(rbox(u(14), u(34), u(10), 0.012), navy, 0, u(32), 0);
    K.put(rbox(u(9), u(26), u(0.4), 0.004), K.gloss('#1a2448'), 0, u(32), u(4.9));
    rod(K, L, gold, [0, u(45), u(5.2)], [u(1.6), u(26), u(5.2)], u(0.35));
    K.put(cyl(u(2.6), u(0.6), u(2.6), 24), gold, u(1.8), u(24.5), u(5.3), 0, Math.PI / 2);
    K.put(rbox(u(9), u(26), u(0.3), 0.002), K.glass(), 0, u(32), u(5.6));
    for (const [w, h, x, y] of [[u(10.4), u(0.8), 0, u(45.3)], [u(10.4), u(0.8), 0, u(18.7)], [u(0.8), u(27.4), -u(4.8), u(32)], [u(0.8), u(27.4), u(4.8), u(32)]]) K.put(rbox(w, h, u(0.6), 0.002), gold, x, y, u(5.5));
    K.put(rbox(u(20), u(1.6), u(13), 0.006), lite, 0, u(49.8), 0);
    K.put(rbox(u(18), u(18), u(12), 0.012), navy, 0, u(59.5), 0);
    K.put(new THREE.CylinderGeometry(u(9), u(9), u(12), 32, 1, false, -Math.PI / 2, Math.PI).rotateX(-Math.PI / 2), navy, 0, u(68.5), 0);
    K.put(plane(L, u(13), u(13)), L.decal(clockFace()), 0, u(59.5), u(6.06));
    K.put(torus(u(6.6), u(0.6), TAU, 40), gold, 0, u(59.5), u(6.1));
    // gold finials and a crescent moon on top: bedtime
    for (const sx of [-1, 1]) K.put(ball(u(1.4), 12, 10), gold, sx * u(8.5), u(70), 0);
    K.put(torus(u(3), u(1), Math.PI * 1.3, 20), gold, 0, u(81), 0, 0, 0, -0.9);
  },

  curfewfuton(K, s, W, D, L) {
    const { rbox, blob, cyl, ball } = L, quilt = K.cloth(NAVY), gold = K.gloss(GOLD);
    // a tatami mat edged in black, the mattress, a starry navy quilt pulled up, its corner turned back
    K.put(rbox(W - u(2), u(1.2), u(30), 0.004), K.cloth('#d4ca84'), 0, u(0.6), 0);
    for (const sz of [-1, 1]) K.put(rbox(W - u(2), u(1.3), u(1.5), 0.004), K.cloth(INK), 0, u(0.65), sz * u(14.2));
    K.put(rbox(W - u(6), u(4), u(24), 0.03), K.cloth(CREAM), 0, u(3), 0);
    K.put(blob(W * 0.62, u(5), u(25), 0.3, 0.6), quilt, u(9), u(6), 0);
    K.put(blob(u(12), u(3), u(14), 0.5, 0.6), K.cloth(L.tone(NAVY, 1.35)), -u(8), u(7), u(3), 0.3);
    for (let n = 0; n < 9; n++) K.put(starGeo(L, u(1.5), u(0.4)), gold, -u(1) + (n % 5) * u(6.4) + K.r() * u(1.5), u(8.7), -u(8) + Math.floor(n / 5) * u(9) + (n % 2) * u(3), K.r(), -Math.PI / 2);
    // the pillow with his sleep mask on it
    K.put(blob(u(10), u(5), u(17), 0.4, 0.5), K.cloth('#e8e0f0'), -W / 2 + u(9), u(7), 0);
    K.put(blob(u(6), u(1.2), u(2.6), 0.5, 0.5), K.gloss(INK), -W / 2 + u(9), u(9.8), u(1));
    // his three alarms lined up by his head: BATTLE, VALORANT, SLEEP. NOW.
    ['#e84848', PIKA, '#4a78d0'].forEach((col, i) => {
      const cx = -W / 2 + u(5) + i * u(6), y = u(8.6), z = u(9.6), m = K.gloss(col);
      K.put(cyl(u(2.6), u(2), u(2.6), 22), m, cx, y, z, 0, Math.PI / 2);
      K.put(cyl(u(2.1), u(0.2), u(2.1), 22), K.gloss('#fbf6e8'), cx, y, z + u(1.05), 0, Math.PI / 2);
      K.put(rbox(u(0.4), u(1.6), u(0.2), 0.001), K.gloss(INK), cx, y + u(0.7), z + u(1.2));
      K.put(rbox(u(1.2), u(0.4), u(0.2), 0.001), K.gloss(INK), cx - u(0.5), y, z + u(1.2));
      for (const sx of [-1, 1]) {
        K.put(ball(u(1.1), 12, 8), m, cx + sx * u(1.6), y + u(2.5), z);
        K.put(ball(u(0.5), 8, 6), K.gloss(INK), cx + sx * u(1.6), y - u(2.6), z);
      }
    });
  },

  // ----- Clarence -----
  ringlight(K, s, W, D, L) {
    const { rbox, cyl, ball, torus, THREE } = L, black = K.metal('#2a2a30');
    // a tripod and a pole up to the ring, lit inside its peach housing, his phone clamped in the middle
    for (let n = 0; n < 3; n++) {
      const a = n / 3 * TAU + 0.5;
      rod(K, L, black, [Math.cos(a) * u(11), u(0.6), Math.sin(a) * u(11)], [0, u(24), 0], u(0.6));
      K.put(ball(u(1), 10, 8), black, Math.cos(a) * u(11), u(0.8), Math.sin(a) * u(11));
    }
    K.put(cyl(u(1.2), u(4), u(1.2), 12), black, 0, u(24), 0);
    K.put(cyl(u(0.7), u(28), u(0.7), 12), black, 0, u(39), 0);
    K.put(torus(u(9), u(1.7), TAU, 48), K.gloss(PEACH), 0, u(62), 0);
    K.put(torus(u(9), u(1.1), TAU, 48), K.glow('#fff4e8'), 0, u(62), u(0.9));
    K.put(rbox(u(1), u(8), u(1), 0.002), black, 0, u(57), 0);
    K.put(rbox(u(5.4), u(10), u(0.7), 0.01), K.gloss(INK), 0, u(62), u(0.4));
    K.put(plane(L, u(4.6), u(8.8)), L.litPic(camScreen(), 0.6), 0, u(62), u(0.8));
    // his feather boa thrown over the top, trailing down one side to the floor
    const boa = [[-u(13), u(55), u(2.5)], [-u(9.5), u(70), u(1.5)], [0, u(74), u(0.5)], [u(9.5), u(70), u(1.5)], [u(11.5), u(58), u(2.5)],
      [u(10.5), u(44), u(4)], [u(8), u(30), u(5)], [u(10), u(14), u(6)], [u(13), u(3), u(5)]];
    beads(K, L, at(K), K.cloth(BOA), boa, u(2), 48, { puff: u(2.4), alt: K.cloth(L.tone(BOA, 1.18)), seg: 8 });
  },

  showvanity(K, s, W, D, L) {
    const { rbox, cyl, ball, blob, lathe, THREE } = L, peach = K.gloss(PEACH), deep = K.gloss(L.tone(PEACH, 0.86)), gold = K.metal(GOLD), bulb = K.glow('#fff4d0');
    // gold turned legs, the top, a drawer under each end
    for (const [lx, lz] of L.legsAt(W - u(8), u(16), u(2))) L.leg(K, gold, lx, lz, u(22), u(1.3), 'turned');
    K.put(rbox(W - u(6), u(2.4), u(18), 0.01), peach, 0, u(27), 0);
    for (const sx of [-1, 1]) {
      K.put(rbox(u(22), u(7), u(16), 0.01), deep, sx * (W / 2 - u(15)), u(22.4), 0);
      K.put(ball(u(1), 10, 8), gold, sx * (W / 2 - u(15)), u(22.4), u(8.3));
    }
    // the mirror: a peach frame, a scallop crest like his screen's waves, bulbs all round
    const my = u(47);
    K.put(rbox(u(40), u(36), u(2.4), 0.04), peach, 0, my, -u(6));
    K.put(rbox(u(35), u(31), u(0.4), 0.01), K.metal('#e0ecf4'), 0, my, -u(4.7));
    K.put(new THREE.CylinderGeometry(u(9), u(9), u(2.4), 32, 1, false, -Math.PI / 2, Math.PI).rotateX(-Math.PI / 2), peach, 0, my + u(18), -u(6));
    for (let n = 0; n < 7; n++) { const a = Math.PI * (0.1 + n * 0.8 / 6); rod(K, L, gold, [0, my + u(18), -u(4.7)], [Math.cos(a) * u(8), my + u(18) + Math.sin(a) * u(8), -u(4.7)], u(0.35)); }
    for (let i = 0; i < 5; i++) for (const sx of [-1, 1]) K.put(ball(u(1.3), 12, 10), bulb, sx * u(18.4), my - u(14) + i * u(7), -u(4.5));
    for (let i = 0; i < 5; i++) K.put(ball(u(1.3), 12, 10), bulb, -u(13) + i * u(6.5), my + u(16.4), -u(4.5));
    // on the top: a feather fan spread, his lipstick, a perfume bottle
    for (let n = 0; n < 7; n++) {
      const fan = posed(K, -u(20), u(28.6), u(4), 0.3, -1.25, (n - 3) * 0.28);
      fan(blob(u(2.6), u(12), u(0.6), 0.6, 0.6), K.cloth(n % 2 ? BOA : '#fbe0e8'), 0, u(6), 0);
    }
    K.put(ball(u(1.2), 10, 8), gold, -u(20), u(28.8), u(4));
    K.put(cyl(u(1), u(3), u(1), 14), gold, u(17), u(29.7), u(4));
    K.put(cyl(u(0.8), u(2), u(0.8), 14), K.gloss('#d82848'), u(17), u(32), u(4));
    K.put(lathe([[u(2.5), 0], [u(3), u(2)], [u(2.5), u(5)], [u(0.8), u(5.6)], [u(0.8), u(7)], [0.001, u(7)]], 24), K.gloss('#f8c8d8'), u(24), u(28.2), -u(1));
    K.put(ball(u(1.4), 12, 10), K.gloss('#e86a90'), u(24), u(36), -u(1));
  },

  // ----- Shaun -----
  helpdeskrack(K, s, W, D, L) {
    const { rbox, ball, cyl } = L, body = K.metal(RACK), unit = K.gloss('#3a404a');
    // on casters, the cabinet, eight servers blinking teal, a glass door over them
    for (const [lx, lz] of L.legsAt(u(18), u(16), 0)) K.put(ball(u(1.4), 10, 8), K.gloss(INK), lx, u(1.4), lz);
    K.put(rbox(u(22), u(62), u(19), 0.015), body, 0, u(33), 0);
    for (let n = 0; n < 8; n++) {
      const y = u(8) + n * u(7);
      K.put(rbox(u(18), u(5.6), u(0.8), 0.006), unit, 0, y, u(9.6));
      for (let i = 0; i < 4; i++) K.put(ball(u(0.55), 8, 6), K.glow((n + i) % 3 ? TEAL : '#f0a040'), -u(6.5) + i * u(2.2), y + u(1), u(10.1));
      for (let i = 0; i < 4; i++) K.put(rbox(u(0.4), u(3.4), u(0.2), 0.001), K.gloss('#22262c'), u(2) + i * u(1.6), y, u(10.05));
    }
    K.put(rbox(u(20), u(58), u(0.4), 0.004), K.glass(), 0, u(33), u(10.6));
    K.put(rbox(u(0.8), u(10), u(1.2), 0.003), K.metal('#c0c4cc'), u(8.6), u(33), u(11.2));
    // cables looping out of the side
    K.put(tube(L, [[u(11), u(50), u(4)], [u(14), u(40), u(5)], [u(13.4), u(24), u(3)], [u(11.2), u(16), u(2)]], u(0.6), 24), K.gloss(TEAL));
    K.put(tube(L, [[u(11), u(46), -u(2)], [u(14.6), u(34), -u(1)], [u(14), u(12), -u(3)], [u(11.2), u(6), -u(4)]], u(0.6), 24), K.gloss('#f08030'));
    // a laptop on top, open on a ticket, its tag: FIXED
    const silver = K.metal('#c0c4cc');
    K.put(rbox(u(14), u(0.8), u(10), 0.004), silver, -u(1), u(64.4), u(1));
    const lid = posed(K, -u(1), u(64.8), -u(4), 0, -0.25);
    lid(rbox(u(14), u(9.5), u(0.6), 0.004), silver, 0, u(4.75), 0);
    lid(plane(L, u(12.5), u(7.6)), L.litPic(ticket(), 0.6), 0, u(4.9), u(0.33));
    K.put(cyl(0.002, u(3), 0.002, 4), K.gloss('#f4f4f0'), u(6), u(63.4), u(6));
    K.put(plane(L, u(6), u(3)), L.decal(fixedTag()), u(6), u(60.8), u(6.1), 0, 0, -0.15);
  },

  tripledesk(K, s, W, D, L) {
    const { rbox, cyl, ball, blob, torus } = L, bezel = K.gloss('#1a1a20');
    // two panel legs, the top, a teal strip of light along its front edge
    for (const sx of [-1, 1]) K.put(rbox(u(2.4), u(23), u(20), 0.01), K.metal('#4a4e58'), sx * (W / 2 - u(4)), u(11.5), 0);
    K.put(rbox(W - u(4), u(1.8), u(22), 0.008), K.gloss(RACK), 0, u(23.9), 0);
    K.put(rbox(W - u(5), u(0.5), u(0.4), 0.002), K.glow(TEAL), 0, u(23.4), u(11.1));
    // three monitors: the VOD he's reviewing in the middle, his stats (34 kills, still lost) and a ticket turned in either side
    for (const [x, z, ry, pic] of [[0, -u(5), 0, vod()], [-u(20), -u(3), 0.45, stats()], [u(20), -u(3), -0.45, ticket()]]) {
      const P = posed(K, x, u(24.8), z, ry);
      P(rbox(u(6), u(0.6), u(4), 0.003), bezel, 0, u(0.3), 0);
      P(rbox(u(1.4), u(6), u(1), 0.003), bezel, 0, u(3.4), -u(0.6));
      P(rbox(u(19), u(11.5), u(1), 0.006), bezel, 0, u(12), 0);
      P(plane(L, u(17.6), u(10.2)), L.litPic(pic, 0.7), 0, u(12), u(0.52));
    }
    // the keyboard with its rainbow strip, a mouse on a teal pad, his headset on its stand, a mug
    K.put(rbox(u(14), u(0.9), u(4.5), 0.006), K.gloss('#2a2a30'), 0, u(25.3), u(5));
    K.put(rbox(u(13), u(0.3), u(3.6), 0.002), K.gloss('#3a3a44'), 0, u(25.9), u(4.9));
    K.put(rbox(u(13.6), u(0.3), u(0.3), 0.001), K.glow(AQUA), 0, u(25.2), u(7.3));
    K.put(rbox(u(8), u(0.3), u(6), 0.002), K.cloth(TEAL), u(12), u(25), u(5));
    K.put(blob(u(2.2), u(1.2), u(3.4), 0.6, 0.6), K.gloss('#2a2a30'), u(12), u(25.7), u(5));
    const hs = posed(K, -u(25), u(24.8), u(6), 0.3);
    hs(cyl(u(1.6), u(0.6), u(1.6), 16), bezel, 0, u(0.3), 0);
    hs(cyl(u(0.4), u(7), u(0.4), 8), bezel, 0, u(4), 0);
    hs(torus(u(3.2), u(0.6), Math.PI, 20), K.gloss(TEAL), 0, u(7.4), 0);
    for (const sx of [-1, 1]) hs(cyl(u(1.8), u(1.4), u(1.8), 16).rotateZ(Math.PI / 2), K.gloss('#2a2a30'), sx * u(3.4), u(6.2), 0);
    mug(K, L, u(27), u(24.8), u(6), TEAL, -0.8);
  },

  // ----- Pat -----
  serenadeguitar(K, s, W, D, L) {
    const { rbox, cyl, ball, torus, heart } = L, body = K.wood('#e0a050'), neck = K.wood('#5a3a20'), steel = K.metal('#d8d8e0'), black = K.metal('#2a2a30');
    const bind = K.gloss('#fbf6e8');
    // the A-frame stand, its cradle and the yoke the neck rests in
    for (const sx of [-1, 1]) rod(K, L, black, [sx * u(7), u(0.5), u(6)], [0, u(8), u(3.5)], u(0.6));
    rod(K, L, black, [0, u(0.5), -u(10)], [0, u(41), -u(4.5)], u(0.6));
    rod(K, L, black, [0, u(8), u(3.5)], [0, u(2), -u(9)], u(0.5));
    K.put(rbox(u(14), u(1.2), u(3), 0.004), K.gloss('#3a3a44'), 0, u(8.2), u(3.8));
    for (const sx of [-1, 1]) K.put(ball(u(1), 10, 8), K.gloss('#3a3a44'), sx * u(6.5), u(9.4), u(4.6));
    K.put(torus(u(1.6), u(0.4), Math.PI, 14), black, 0, u(41.5), -u(4.2), 0, 0, Math.PI);
    // the guitar, leant back in it: two bouts and a waist, its sound hole, bridge, neck, headstock and strings
    const G = posed(K, 0, u(16), u(3), 0, -0.22);
    for (const [r, y] of [[u(7.6), 0], [u(5.8), u(9)]]) {
      G(cyl(r, u(3.6), r, 40).rotateX(Math.PI / 2), body, 0, y, 0);
      for (const z of [u(1.8), -u(1.8)]) G(torus(r, u(0.3), TAU, 48), bind, 0, y, z);
    }
    G(rbox(u(8), u(6), u(3.6), 0.01), body, 0, u(5), 0);
    G(cyl(u(2.2), u(0.2), u(2.2), 24).rotateX(Math.PI / 2), K.gloss('#2a1810'), 0, u(5.5), u(1.75));
    G(torus(u(2.6), u(0.25), TAU, 32), K.gloss('#3a2a18'), 0, u(5.5), u(1.85));
    G(rbox(u(5), u(1), u(0.6), 0.002), neck, 0, -u(3.2), u(2));
    G(rbox(u(2.2), u(19), u(1.4), 0.006), neck, 0, u(23), u(0.6));
    G(rbox(u(3.4), u(5.5), u(1), 0.006), neck, 0, u(35), u(0.4));
    for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) G(ball(u(0.6), 8, 6), steel, sx * u(2.3), u(33.5) + i * u(1.6), u(0.4));
    for (let i = 0; i < 6; i++) G(stick(L, [-u(0.8) + i * u(0.32), -u(3.2), u(2.35)], [-u(0.7) + i * u(0.28), u(33), u(1.4)], 0.0025, 4), steel);
    // his lemon sticker, and a lemon-heart pick dropped on the floor
    G(ball(u(2.2), 16, 10).scale(1.25, 1, 0.22), K.gloss(LEMON), u(4.5), -u(2.5), u(1.85));
    G(ball(u(1), 8, 6).scale(1.6, 0.7, 0.2), K.gloss('#58a838'), u(6.6), -u(0.5), u(1.9));
    K.put(heart(u(3), u(0.4)), K.gloss(LEMON), u(9), u(0.2), u(9), 0.4, -Math.PI / 2);
  },

  lemonadestand(K, s, W, D, L) {
    const { rbox, cyl, ball, lathe, blob } = L, wood = K.wood('#c8a070'), lemon = K.gloss(LEMON), white = K.gloss('#fbf6e8');
    // the counter, striped, LEMONADE on its front, a wooden top
    K.put(rbox(W - u(10), u(26), u(14), 0.012), K.pic(stripes(LEMON, '#fbf6e8', 12)), 0, u(13), u(2));
    K.put(rbox(W - u(6), u(2), u(17), 0.008), wood, 0, u(27), u(2));
    K.put(plane(L, u(36), u(9)), L.decal(lemonSign()), 0, u(16), u(9.05));
    // four posts and the striped awning, scalloped along its front
    const hw = W / 2 - u(4);
    for (const sx of [-1, 1]) for (const [z, h] of [[-u(6), u(70)], [u(9), u(65)]]) K.put(cyl(u(1.1), h, u(1.1), 12), wood, sx * hw, h / 2, z);
    K.put(rbox(W - u(2), u(1), u(20), 0.006), K.pic(stripes(LEMON, '#fbf6e8', 10)), 0, u(68), u(1), 0, 0.28);
    for (let i = 0; i < 14; i++) K.put(ball(u(1.9), 12, 8).scale(1, 1, 0.35), i % 2 ? white : lemon, -W / 2 + u(3) + i * (W - u(6)) / 13, u(64.4), u(10.7));
    // fairy lights strung post to post along the front
    const pts = [];
    for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push([-hw + t * hw * 2, u(61) - Math.sin(t * Math.PI) * u(5), u(9.6)]); }
    K.put(tube(L, pts, u(0.2), 48), K.gloss('#4a6a3a'));
    pts.slice(1, -1).forEach((p, i) => K.put(ball(u(0.9), 10, 8), K.glow(i % 2 ? '#fff0a0' : '#ffd0e0'), p[0], p[1] - u(1), p[2]));
    // on the counter: a pitcher of lemonade, three glasses with a slice on each, a bowl of lemons, the rose in its bottle
    const top = u(28), glass = K.glass(), juice = K.gloss('#f8e878');
    K.put(lathe([[u(3.4), 0], [u(3.8), u(5)], [u(3.2), u(9)], [u(3.8), u(10)]], 28), glass, -u(22), top, u(2));
    K.put(cyl(u(3.2), u(6), u(3.4), 24), juice, -u(22), top + u(3.1), u(2));
    K.put(L.torus(u(2.4), u(0.4), Math.PI, 12), glass, -u(18.6), top + u(5.5), u(2), 0, 0, -Math.PI / 2);
    for (let i = 0; i < 3; i++) {
      const gx = -u(12) + i * u(4.6);
      K.put(cyl(u(1.5), u(4.6), u(1.3), 16), glass, gx, top + u(2.3), u(5));
      K.put(cyl(u(1.3), u(3.2), u(1.15), 16), juice, gx, top + u(1.7), u(5));
      K.put(cyl(u(1.2), u(0.3), u(1.2), 16), lemon, gx + u(1.2), top + u(4.6), u(5), 0, Math.PI / 2, 0.4);
    }
    K.put(lathe([[u(1.5), 0], [u(4), u(1)], [u(5), u(3.5)]], 24), white, u(8), top, u(1));
    for (const [dx, dz] of [[-u(1.5), 0], [u(1.5), u(0.6)], [0, -u(1.6)], [u(0.4), u(1.6)]]) K.put(ball(u(1.6), 12, 10).scale(1.3, 1, 1), lemon, u(8) + dx, top + u(3.2), u(1) + dz);
    K.put(lathe([[u(2.2), 0], [u(2.4), u(5)], [u(1), u(7)], [u(0.7), u(10)]], 20), K.glass(), u(22), top, 0);
    K.put(cyl(u(0.3), u(9), u(0.3), 6), K.gloss('#58a838'), u(22), top + u(5.5), 0);
    K.put(blob(u(2.4), u(2.2), u(2.4), 0.7, 0.7), K.gloss('#d83040'), u(22), top + u(10.6), 0);
    for (let n = 0; n < 5; n++) { const a = n / 5 * TAU; K.put(ball(u(1), 10, 8).scale(1, 1.2, 0.5), K.gloss('#c02838'), u(22) + Math.cos(a) * u(1.1), top + u(10.2), Math.sin(a) * u(1.1), -a); }
  },

  // ----- Kayl -----
  bassamp(K, s, W, D, L) {
    const { rbox, cyl, ball, blob } = L, tolex = K.cloth(LAV), chrome = K.metal('#d8d8e0');
    // the amp: lavender, a dark grille, a control strip with chrome knobs, a strap handle
    K.put(rbox(u(22), u(26), u(16), 0.02), tolex, -u(4), u(13), 0);
    K.put(rbox(u(19), u(17), u(0.5), 0.01), K.cloth('#3a3448'), -u(4), u(10.5), u(8));
    K.put(rbox(u(5), u(1.4), u(0.3), 0.002), chrome, -u(4), u(4), u(8.4));
    K.put(rbox(u(20), u(3), u(0.5), 0.004), K.gloss('#2a2430'), -u(4), u(22.5), u(8));
    for (let i = 0; i < 5; i++) K.put(cyl(u(0.8), u(0.8), u(0.8), 12), chrome, -u(11) + i * u(3.4), u(22.5), u(8.5), 0, Math.PI / 2);
    for (const sx of [-1, 1]) for (const y of [u(1), u(25)]) K.put(ball(u(1.1), 10, 8), chrome, -u(4) + sx * u(10.6), y, u(7.6));
    K.put(rbox(u(8), u(1), u(2), 0.004), K.gloss('#2a2430'), -u(4), u(26.4), -u(3));
    // Reya sat on top, as always
    cat(K, L, -u(4), u(26), u(1), '#9a98a8', 0.25);
    // her bass leant on its side: a purple body, a white guard, the long neck and four strings
    const B = posed(K, u(11), u(6.8), u(4.5), -0.2, 0, 0.12);
    B(blob(u(10), u(13), u(2.6), 0.7, 0.7), K.gloss('#7a58b0'), 0, 0, 0);
    for (const sx of [-1, 1]) B(ball(u(2.4), 14, 10).scale(1, 1.7, 0.5), K.gloss('#7a58b0'), sx * u(3.2), u(7.4), 0);
    B(blob(u(6.6), u(9), u(0.4), 0.7, 0.7), K.gloss('#f4f0f8'), -u(0.5), u(1), u(1.3));
    B(rbox(u(2), u(30), u(1.2), 0.006), K.wood('#5a3a2a'), 0, u(21), u(0.4));
    B(rbox(u(3), u(6), u(0.9), 0.006), K.wood('#5a3a2a'), 0, u(38.5), u(0.3));
    for (let i = 0; i < 4; i++) B(ball(u(0.6), 8, 6), chrome, (i < 2 ? -1 : 1) * u(2), u(37) + (i % 2) * u(2.4), u(0.3));
    for (let i = 0; i < 4; i++) B(stick(L, [-u(0.6) + i * u(0.4), -u(3), u(1.5)], [-u(0.5) + i * u(0.33), u(36), u(1.1)], 0.003, 4), chrome);
    // the mug Spooky knocked off, on its side in its puddle
    K.put(cyl(u(4), u(0.1), u(4), 24), K.gloss('#6a4428'), -u(10), u(0.1), u(12));
    K.put(cyl(u(1.8), u(3.6), u(1.7), 20), K.gloss('#f4f0f8'), -u(11), u(1.8), u(11), 0.6, 0, Math.PI / 2);
  },

  vinylconsole(K, s, W, D, L) {
    const { rbox, cyl, ball, blob, lathe } = L, T = '#9a6a42', wood = K.wood(T), metal = K.metal('#c8ccd8');
    // splayed legs, the cabinet: a lavender speaker grille on the left, records stood in their cubby on the right
    for (const [lx, lz] of L.legsAt(W - u(10), u(10), 0)) rod(K, L, wood, [lx * 1.06, 0, lz * 1.3], [lx, u(9.5), lz], u(0.9));
    K.put(rbox(W - u(6), u(18), u(17), 0.02), wood, 0, u(18), 0);
    K.put(rbox(W / 2 - u(5), u(14), u(0.5), 0.01), K.cloth(LAV), -W / 4 + u(1.5), u(18), u(8.6));
    K.put(rbox(W / 2 - u(5), u(14), u(1), 0.01), K.wood(L.tone(T, 0.55)), W / 4 - u(1.5), u(18), u(8.1));
    ['#e84848', '#f0a040', '#4a78d0', '#a858d8', '#58b848', '#f4f0e8', '#2a2a30', '#f06a40', '#58c8c0'].forEach((c, i) =>
      K.put(rbox(u(1), u(12.5), u(1.4), 0.002), K.gloss(c), W / 4 - u(12) + i * u(2.6), u(17.8), u(8.9), (K.r() - 0.5) * 0.08, 0, (i - 4) * 0.03));
    // the turntable on top, Currents on it, the tonearm over
    K.put(rbox(u(20), u(3), u(15), 0.01), K.gloss('#3a3440'), -u(9), u(28.5), 0);
    K.put(cyl(u(6.2), u(0.8), u(6.2), 32), metal, -u(11), u(30.4), 0);
    K.put(cyl(u(6), u(0.3), u(6), 40), K.gloss('#1a1a20'), -u(11), u(31), 0);
    K.put(cyl(u(2.3), u(0.34), u(2.3), 28), K.pic(currents()), -u(11), u(31), 0);
    K.put(cyl(u(1), u(2), u(1.2), 14), metal, -u(2.5), u(31), -u(4.5));
    rod(K, L, metal, [-u(2.5), u(32.2), -u(4.5)], [-u(8), u(31.8), u(2.5)], u(0.35));
    K.put(rbox(u(1.2), u(0.6), u(2), 0.002), K.gloss('#2a2a30'), -u(8.4), u(31.6), u(3.2), 0.5);
    // a vase of lavender
    K.put(lathe([[u(1.6), 0], [u(2.6), u(3)], [u(1.4), u(7)], [u(1.8), u(8)]], 24), K.gloss('#f4f0f8'), u(6), u(27), -u(3));
    for (let n = 0; n < 7; n++) {
      const a = n / 7 * TAU, tip = [u(6) + Math.cos(a) * u(3), u(27) + u(17) + (n % 3) * u(1.5), -u(3) + Math.sin(a) * u(2.4)];
      rod(K, L, K.gloss('#58884a'), [u(6), u(33), -u(3)], tip, u(0.2));
      for (let j = 0; j < 4; j++) K.put(ball(u(0.7 - j * 0.08), 8, 6), K.gloss(j % 2 ? VIOLET : L.tone(VIOLET, 1.2)), tip[0], tip[1] - j * u(1), tip[2]);
    }
    // Spooky asleep on the right end, curled up, his big fluffy tail hanging over the front
    const fur = K.gloss('#2a2830'), C = posed(K, u(20), u(27), u(1), -0.3);
    C(blob(u(13), u(7), u(10), 0.8, 0.8), fur, 0, u(3.5), 0);
    C(ball(u(4), 16, 12).scale(1.1, 0.9, 1), fur, -u(6), u(4.6), u(3));
    for (const sx of [-1, 1]) {
      C(L.cyl(0.002, u(3.4), u(1.7), 12).scale(1, 1, 0.55).rotateZ(-sx * 0.3), fur, -u(6) + sx * u(2.4), u(8), u(3));
      C(L.torus(u(0.8), u(0.18), Math.PI, 10).rotateZ(Math.PI), K.gloss('#e8d040'), -u(6) + sx * u(1.7), u(5.2), u(6.4));
    }
    C(tube(L, [[u(4), u(3), u(2)], [u(5), u(2), u(7)], [u(5.5), -u(2), u(10)], [u(5), -u(8), u(10.5)]], u(2.4), 24), fur);
  },

  // ----- Phil -----
  saltcandelabra(K, s, W, D, L) {
    const { lathe, cyl, ball, torus } = L, iron = K.metal(IRON), wax = K.gloss('#f4ecd8'), flame = K.glow('#c890ff'), salt = K.gloss('#f4f4f0');
    // a ring of salt on the floor round it, a few grains strayed
    K.put(torus(u(13), u(0.7), TAU, 64), salt, 0, u(0.3), 0, 0, Math.PI / 2);
    for (let n = 0; n < 10; n++) { const a = K.r() * TAU, r = u(11 + K.r() * 4); K.put(ball(u(0.3), 6, 4), salt, Math.cos(a) * r, u(0.2), Math.sin(a) * r); }
    // three scrolled feet, the turned stem, four arms curving up to cups, a candle in each and one on top, all burning violet
    for (let n = 0; n < 3; n++) {
      const a = n / 3 * TAU + 0.3, c = Math.cos(a), sn = Math.sin(a);
      K.put(tube(L, [[0, u(6), 0], [c * u(5), u(2), sn * u(5)], [c * u(8), u(0.8), sn * u(8)], [c * u(9.4), u(2.4), sn * u(9.4)]], u(0.8), 20), iron);
    }
    K.put(lathe([[u(2.6), u(4)], [u(1.4), u(6)], [u(1), u(14)], [u(2), u(16)], [u(1), u(18)], [u(0.8), u(46)], [u(1.8), u(47)], [0.001, u(47.5)]], 20), iron, 0, 0, 0);
    const cups = [[0, u(47.5)]];
    for (const r of [-u(12), -u(6), u(6), u(12)]) {
      const sx = Math.sign(r);
      K.put(tube(L, [[0, u(34), 0], [r * 0.5, u(31), 0], [r, u(35), 0], [r, u(42), 0]], u(0.7), 24), iron);
      K.put(torus(Math.abs(r) * 0.25, u(0.4), Math.PI, 12), iron, r * 0.6, u(34), 0, 0, 0, sx > 0 ? 0 : Math.PI);
      cups.push([r, u(42)]);
    }
    cups.forEach(([x, y], i) => {
      K.put(lathe([[u(0.6), 0], [u(2.2), u(0.6)], [u(2.4), u(1.6)]], 18), iron, x, y, 0);
      const h = u(i ? 7 + (i % 3) : 9);
      K.put(cyl(u(1.2), h, u(1.25), 14), wax, x, y + u(1) + h / 2, 0);
      K.put(ball(u(0.5), 8, 6).scale(1, 1.6, 1), wax, x + u(1.1), y + u(1) + h * 0.7, u(0.3));
      K.put(cyl(u(0.15), u(1), u(0.15), 4), K.gloss(INK), x, y + u(1.5) + h, 0);
      K.put(lathe([[0.001, 0], [u(1), u(1)], [u(1.2), u(2.2)], [u(0.8), u(3.6)], [u(0.3), u(4.8)], [0.001, u(5.6)]], 16), flame, x, y + u(1.6) + h, 0);
      K.put(ball(u(0.5), 8, 6), K.glow('#f4e8ff'), x, y + u(2.8) + h, 0);
    });
  },

  nobodychair(K, s, W, D, L) {
    const { rbox, blob, ball, cyl } = L, wood = K.wood('#2a1e2e'), velvet = K.cloth('#6a3a8a'), button = K.gloss('#4a2060');
    // turned legs, the seat and its velvet cushion, two tall posts and a tufted back
    for (const [lx, lz] of L.legsAt(u(22), u(20), u(2))) L.leg(K, wood, lx, lz, u(14), u(1.4), 'turned');
    K.put(rbox(u(24), u(3), u(22), 0.01), wood, 0, u(15.5), 0);
    K.put(blob(u(21), u(4), u(19), 0.35, 0.5), velvet, 0, u(18.5), u(0.5));
    for (const sx of [-1, 1]) {
      K.put(rbox(u(2.4), u(54), u(2.4), 0.008), wood, sx * u(10.5), u(41), -u(9.5));
      K.put(ball(u(1.6), 12, 10), wood, sx * u(10.5), u(68.6), -u(9.5));
    }
    K.put(rbox(u(17), u(40), u(1.6), 0.03), velvet, 0, u(42), -u(9.4));
    for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) K.put(ball(u(0.6), 8, 6), button, -u(5) + i * u(5), u(28) + j * u(8), -u(8.5));
    // a pointed arch over it, JONA's horns curling off its corners and her eye in the middle, open
    K.put(slab(L, [[-u(10), 0], [u(10), 0], [u(10), u(3)], [u(4), u(8)], [0, u(14)], [-u(4), u(8)], [-u(10), u(3)]], u(2.4)), wood, 0, u(62), -u(9.5));
    for (const sx of [-1, 1]) beads(K, L, at(K), K.gloss('#1a1020'), [[sx * u(8), u(65), -u(9.5)], [sx * u(12.5), u(69), -u(9)], [sx * u(14), u(75), -u(8.5)], [sx * u(12), u(80), -u(8)]], u(1.6), 14, { taper: true });
    K.put(blob(u(6), u(3.6), u(1.4), 0.6, 0.6), K.gloss('#f4e8ff'), 0, u(68), -u(8.2));
    K.put(ball(u(1.5), 14, 10).scale(1, 1, 0.4), K.glow('#c060ff'), 0, u(68), -u(7.5));
    K.put(ball(u(0.5), 8, 6).scale(0.5, 1.8, 0.4), K.gloss(INK), 0, u(68), -u(7));
    // a card on the seat: DO NOT SIT
    K.put(plane(L, u(8), u(4)), L.decal(doNotSit()), u(2), u(20.7), u(3), 0.2, -Math.PI / 2);
  },

  // ----- Ricky -----
  coffeecart(K, s, W, D, L) {
    const { rbox, cyl, ball, blob, lathe } = L, brown = K.wood(BROWN), frame = K.metal('#3a3440'), black = K.gloss('#2a2a30');
    // four posts on casters, two shelves, a push handle
    for (const [lx, lz] of L.legsAt(u(24), u(18), u(1.5))) {
      K.put(cyl(u(0.7), u(34), u(0.7), 10), frame, lx, u(19), lz);
      K.put(ball(u(1.6), 10, 8), black, lx, u(1.6), lz);
    }
    for (const y of [u(13), u(35.5)]) K.put(rbox(u(25), u(1.6), u(19), 0.006), brown, 0, y, 0);
    K.put(tube(L, [[u(10.5), u(35), -u(7.5)], [u(14), u(39), -u(6.5)], [u(14), u(39), u(6.5)], [u(10.5), u(35), u(7.5)]], u(0.6), 24), frame);
    // the coffee maker, its pot half full, its red light on
    K.put(rbox(u(10), u(1.6), u(9), 0.006), black, -u(5.5), u(37.1), -u(1));
    K.put(rbox(u(10), u(16), u(4), 0.01), black, -u(5.5), u(44.3), -u(4));
    K.put(rbox(u(10), u(3), u(9), 0.01), black, -u(5.5), u(51), -u(1));
    K.put(lathe([[u(3), 0], [u(3.4), u(4)], [u(2.4), u(8)], [u(2.6), u(8.6)]], 24), K.glass(), -u(5.5), u(37.9), u(1));
    K.put(cyl(u(2.9), u(4), u(3), 24), K.gloss('#4a2210'), -u(5.5), u(40), u(1));
    K.put(ball(u(0.6), 8, 6), K.glow('#ff4040'), -u(1.4), u(38.6), u(3.6));
    // three mugs: one white, one with a moon on it, one brown
    mug(K, L, u(3.5), u(36.3), u(4), '#fbf6e8', 0.4);
    mug(K, L, u(8.5), u(36.3), u(1), NAVY, -0.5);
    K.put(ball(u(1), 12, 8).scale(1, 1, 0.3), K.glow(MOON), u(8.5), u(38.2), u(2.75));
    mug(K, L, u(5), u(36.3), -u(5), '#c08050', 2);
    // below: a bag of beans and a stack of mugs
    K.put(blob(u(7), u(10), u(5), 0.5, 0.4), K.cloth('#8a5a34'), -u(6), u(18.8), 0);
    K.put(rbox(u(4), u(3), u(0.2), 0.002), K.gloss('#f4ecd8'), -u(6), u(19), u(2.5));
    for (let i = 0; i < 3; i++) mug(K, L, u(6), u(13.8) + i * u(3.3), u(1), ['#fbf6e8', '#c08050', NAVY][i], i, false);
  },

  allnightmoon(K, s, W, D, L) {
    const { THREE, ball, torus } = L, wood = K.wood(BROWN), moon = K.glow(MOON), crater = K.glow(L.tone(MOON, 0.86));
    // a wooden tripod, a cradle at its top, the moon in it
    for (let n = 0; n < 3; n++) {
      const a = n / 3 * TAU + 0.4;
      rod(K, L, wood, [Math.cos(a) * u(11), 0, Math.sin(a) * u(11)], [0, u(31), 0], u(0.9));
      rod(K, L, wood, [Math.cos(a) * u(4), u(31), Math.sin(a) * u(4)], [Math.cos(a) * u(8), u(38), Math.sin(a) * u(8)], u(0.6));
    }
    K.put(torus(u(5), u(0.9), TAU, 32), wood, 0, u(31.5), 0, 0, Math.PI / 2);
    K.put(ball(u(12), 40, 28), moon, 0, u(46), 0);
    const z = new THREE.Vector3(0, 0, 1);
    for (let n = 0; n < 10; n++) {
      const d = new THREE.Vector3(K.r() - 0.5, K.r() - 0.3, K.r() * 0.9 + 0.1).normalize(), r = u(1.4 + K.r() * 2);
      const g = ball(r, 14, 10).scale(1, 1, 0.25);
      g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(z, d));
      K.put(g, crater, d.x * u(11.8), u(46) + d.y * u(11.8), d.z * u(11.8));
    }
    // his mug on the floor under it, like his badge
    mug(K, L, u(9), 0, u(9), '#c08050', -0.6);
  },

  // ----- Machew -----
  katanastand(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, lac = K.gloss(INK), gold = K.metal(GOLD), saya = K.gloss('#1a1418'), wrap = K.cloth(BLOOD), cream = K.gloss('#f4ecd8');
    // a black lacquer base trimmed in red, two uprights with a pair of hooks each
    K.put(rbox(u(30), u(3), u(10), 0.012), lac, 0, u(1.5), 0);
    K.put(rbox(u(30.2), u(0.8), u(10.2), 0.002), K.gloss(BLOOD), 0, u(2.4), 0);
    for (const sx of [-1, 1]) {
      K.put(rbox(u(2.4), u(22), u(7), 0.01), lac, sx * u(9), u(14), 0);
      for (const y of [u(12), u(20)]) {
        K.put(rbox(u(2.4), u(1.6), u(5), 0.004), lac, sx * u(9), y, u(4.5));
        K.put(rbox(u(2.4), u(2.4), u(1.2), 0.004), lac, sx * u(9), y + u(1.2), u(6.4));
      }
    }
    // the katana on the top hooks and the short sword under it: black scabbards, gold guards, red-wrapped hilts
    const sword = (y, len, hilt) => {
      const end = len / 2 - hilt;
      K.put(tube(L, [[-len / 2, y, u(5)], [0, y + u(0.8), u(5)], [end, y + u(0.3), u(5)]], u(0.9), 24), saya);
      K.put(ball(u(0.95), 10, 8), gold, -len / 2, y, u(5));
      K.put(cyl(u(1.9), u(0.5), u(1.9), 20), gold, end + u(0.2), y + u(0.3), u(5), 0, 0, Math.PI / 2);
      K.put(cyl(u(0.85), hilt, u(0.85), 14), wrap, end + hilt / 2 + u(0.4), y + u(0.3), u(5), 0, 0, Math.PI / 2);
      for (let i = 0; i < Math.round(hilt / u(1.6)); i++) K.put(ball(u(0.45), 8, 6).scale(1, 1, 0.5), cream, end + u(1.4) + i * u(1.6), y + u(0.3), u(5.85));
      K.put(cyl(u(1), u(0.8), u(1), 14), gold, len / 2 + u(0.4), y + u(0.3), u(5), 0, 0, Math.PI / 2);
    };
    sword(u(21.7), u(30), u(8));
    sword(u(13.7), u(22), u(6));
    // the price tag still on: it's plastic
    K.put(cyl(0.002, u(3), 0.002, 4), K.gloss('#f4f4f0'), u(10.5), u(20.2), u(5.6));
    K.put(plane(L, u(4.4), u(2.2)), L.decal(priceTag()), u(10.5), u(17.8), u(5.7), 0, 0, 0.12);
  },

  broodpillar(K, s, W, D, L) {
    const { rbox, cyl, lathe, ball, blob } = L, sand = K.plain(SAND), deep = K.plain(L.tone(SAND, 0.84)), gold = K.metal(GOLD);
    // a sandstone plinth, a fluted shaft, its capital
    K.put(rbox(u(26), u(5), u(26), 0.01), deep, 0, u(2.5), 0);
    K.put(lathe([[u(11), 0], [u(11), u(1.5)], [u(9.6), u(3)]], 32), sand, 0, u(5), 0);
    K.put(cyl(u(8.4), u(62), u(9), 20), sand, 0, u(39), 0);
    for (let n = 0; n < 20; n++) { const a = (n + 0.5) / 20 * TAU; K.put(rbox(u(0.8), u(60), u(0.8), 0.002), deep, Math.cos(a) * u(8.6), u(39), Math.sin(a) * u(8.6), -a); }
    K.put(lathe([[u(8.2), 0], [u(9.5), u(2)], [u(11), u(4)]], 32), sand, 0, u(70), 0);
    K.put(rbox(u(24), u(4), u(24), 0.01), deep, 0, u(76), 0);
    // a blood-red banner down its front, swallow-tailed, crossed blades on it
    K.put(cyl(u(0.5), u(14), u(0.5), 10), gold, 0, u(68.5), u(9.8), 0, 0, Math.PI / 2);
    for (const sx of [-1, 1]) K.put(ball(u(0.9), 10, 8), gold, sx * u(7), u(68.5), u(9.8));
    K.put(slab(L, [[-u(5.5), 0], [u(5.5), 0], [u(5.5), -u(36)], [0, -u(31)], [-u(5.5), -u(36)]], u(0.4)), K.cloth(BLOOD), 0, u(68), u(9.6));
    for (const sx of [-1, 1]) K.put(rbox(u(0.7), u(14), u(0.2), 0.001), K.metal('#e0e0e8'), 0, u(50), u(9.9), 0, 0, sx * 0.6);
    K.put(rbox(u(5), u(0.8), u(0.25), 0.001), gold, 0, u(46), u(9.95));
    // his hood hung on a hook on the side, where he broods
    K.put(rbox(u(2.4), u(0.8), u(0.8), 0.002), K.metal(IRON), u(9.6), u(58), 0);
    K.put(blob(u(5), u(12), u(8), 0.6, 0.6), K.cloth('#2a2228'), u(11.8), u(51), 0, 0, 0, 0.08);
    K.put(blob(u(1.2), u(7), u(5), 0.6, 0.6), K.cloth('#141014'), u(14), u(52), 0);
    // sand drifted round its foot
    for (let n = 0; n < 6; n++) { const a = n / 6 * TAU + 0.3; K.put(blob(u(6), u(1.6), u(4), 0.7, 0.7), deep, Math.cos(a) * u(13.5), u(0.4), Math.sin(a) * u(13.5), -a); }
  },

  // ----- Jerome -----
  neonpalm(K, s, W, D, L) {
    const { THREE, rbox, cyl, ball, torus } = L, pink = K.glow(NEON), aqua = K.glow(AQUA);
    // a black base, VI on its front
    K.put(rbox(u(22), u(5), u(12), 0.015), K.gloss('#1a1418'), 0, u(2.5), 0);
    K.put(plane(L, u(12), u(4)), L.decal(viSign()), 0, u(2.6), u(6.06));
    // the sunset on a black disc behind, ringed in aqua
    K.put(rbox(u(1.4), u(20), u(1.4), 0.003), K.gloss('#1a1418'), 0, u(14), -u(3));
    K.put(cyl(u(12.5), u(1.2), u(12.5), 48), K.gloss('#2a1830'), 0, u(32), -u(3), 0, Math.PI / 2);
    K.put(new THREE.CircleGeometry(u(11), 48), L.litPic(sunset(), 0.5), 0, u(32), -u(2.36));
    K.put(torus(u(11.6), u(0.5), TAU, 64), aqua, 0, u(32), -u(2.2));
    // the palm in neon tube: a curving pink trunk, aqua fronds, pink coconuts
    const crown = [u(4), u(46), u(2)];
    K.put(tube(L, [[u(1), u(5), u(2)], [-u(1), u(18), u(2.5)], [u(1), u(32), u(2.5)], crown], u(0.7), 32), pink);
    for (const [dx, dy] of [[-1, 0.3], [-0.6, 0.8], [0.1, 1], [0.7, 0.7], [1, 0.25]]) {
      const p = (k, drop) => [crown[0] + dx * u(k), crown[1] + dy * u(k) - drop, crown[2] + u(k * 0.08)];
      K.put(tube(L, [crown, p(5, -u(1)), p(10, 0), p(13, u(4))], u(0.55), 24), aqua);
    }
    for (const [dx, dy] of [[-u(1.4), -u(1.4)], [u(1.2), -u(1.8)], [0, -u(0.4)]]) K.put(ball(u(1.1), 12, 8), pink, crown[0] + dx, crown[1] + dy, crown[2] + u(1));
  },

  heistsafe(K, s, W, D, L) {
    const { rbox, cyl, ball, blob, torus } = L, steel = K.metal(STEEL), dark = K.metal('#2a3030'), chrome = K.metal('#c8d0d0'), gold = K.metal(GOLD);
    const cz = -u(6.5), hd = u(9);
    // stubby feet, the walls, a dark inside with a shelf
    for (const [lx, lz] of L.legsAt(u(22), u(16), 0)) K.put(rbox(u(3), u(2), u(3), 0.004), K.gloss(INK), lx, u(1), cz + lz);
    K.put(rbox(u(24), u(32), u(2.5), 0.008), steel, 0, u(18), cz - hd + u(1.25));
    for (const sx of [-1, 1]) K.put(rbox(u(2.5), u(32), hd * 2, 0.008), steel, sx * u(10.75), u(18), cz);
    for (const y of [u(3.25), u(32.75)]) K.put(rbox(u(24), u(2.5), hd * 2, 0.008), steel, 0, y, cz);
    K.put(rbox(u(19), u(27), u(0.4), 0.002), dark, 0, u(18), cz - hd + u(2.7));
    K.put(rbox(u(19), u(1), hd * 2 - u(3), 0.003), steel, 0, u(18), cz + u(1));
    // gold bars stacked below, cash bundles above
    const bar = (x, y, z, ry = 0) => K.put(cyl(u(1.4), u(1.6), u(2.2), 4).rotateY(Math.PI / 4).scale(2, 1, 1), gold, x, y, z, ry);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) bar(-u(5.5) + i * u(5.5), u(5.3), cz - u(2) + j * u(4));
    for (let i = 0; i < 2; i++) bar(-u(2.75) + i * u(5.5), u(6.9), cz);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 1 + (i % 2); j++) {
      K.put(rbox(u(5), u(2), u(3.2), 0.004), K.cloth('#58a858'), -u(5.5) + i * u(5.5), u(19.5) + j * u(2.1), cz);
      K.put(rbox(u(1.2), u(2.1), u(3.3), 0.002), K.gloss('#f4f4f0'), -u(5.5) + i * u(5.5), u(19.5) + j * u(2.1), cz);
    }
    bar(-u(6), u(0.8), u(10), 0.5);
    bar(-u(1), u(0.8), u(12), -0.3);
    // the door swung wide on its hinge: a big dial, a three-spoke handle, the bolts out
    const door = posed(K, u(12), u(18), cz + hd, 0.75);
    door(rbox(u(23), u(31), u(4), 0.015), steel, -u(11.5), 0, u(2));
    door(rbox(u(19), u(26), u(0.5), 0.004), dark, -u(11.5), 0, -u(0.1));
    door(cyl(u(4), u(1), u(4), 32).rotateX(Math.PI / 2), chrome, -u(11.5), u(5), u(4.5));
    door(plane(L, u(7.6), u(7.6)), L.decal(dialFace()), -u(11.5), u(5), u(5.02));
    door(cyl(u(1.2), u(1.4), u(1.2), 16).rotateX(Math.PI / 2), chrome, -u(11.5), -u(6), u(4.7));
    for (let n = 0; n < 3; n++) { const a = n / 3 * TAU + 0.3; door(stick(L, [-u(11.5), -u(6), u(5.2)], [-u(11.5) + Math.cos(a) * u(5), -u(6) + Math.sin(a) * u(5), u(5.2)], u(0.5)), chrome); }
    for (const y of [-u(9), 0, u(9)]) door(cyl(u(1), u(3), u(1), 14).rotateZ(Math.PI / 2), chrome, -u(24), y, u(2));
    for (const y of [-u(10), u(10)]) door(cyl(u(1), u(5), u(1), 14), dark, 0, y, u(2));
    // a GTA VI sticker on its side, his duffel on top
    K.put(plane(L, u(7), u(7)), L.decal(viSticker()), -u(12) - 0.004, u(25), cz, -Math.PI / 2);
    K.put(blob(u(17), u(8), u(9), 0.6, 0.6), K.cloth('#2a2a30'), -u(1), u(38), cz);
    K.put(torus(u(4), u(0.6), Math.PI, 16), K.cloth('#2a2a30'), -u(1), u(41.5), cz);
    K.put(rbox(u(14), u(0.6), u(0.6), 0.002), K.metal('#c8c8c8'), -u(1), u(42), cz + u(1));
  },
};
