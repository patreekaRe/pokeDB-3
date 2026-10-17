/* base-models-u.js  -  the Harvest, Winter holidays and Party sets (js/base-furniture-season3.js), built from parts like
   the arcade cabinets (the user's ask, 2026-10-16: "3D detailed CLEAN models ... optimise them"; js/base-models-f.js's
   head says how a batch works). Each follows its painting part by part: `u(n)` is n of its 32 pixels a tile, `X(n, W)`
   a pixel across as x from the middle; a wall piece's `WX(i, W)` / `WY(j)` place painted units on the wall strip. Every
   piece is one fixed colour (solo), so colours are the painting's own. Pictures are small canvases drawn once: wicker,
   straw, candy-cane stripes, the moon, wrapping paper. */

import { tube, rod } from './base-models-kit.js';
import { X as WX, Y as WY, whole, boxUV } from './base-models-w.js';

const u = (n) => n / 32;
const X = (n, W = 1) => n / 32 - W / 2;
const TAU = Math.PI * 2;

const OAK = '#a0703e', DARKWOOD = '#5e3c20', WICKER = '#c89a58', RUST = '#b4502a', PUMPKIN = '#e8822a', SQUASH = '#e8b440',
  GOURD = '#6a9a3a', CREAM = '#ece2bc', HAY = '#e2c46a', APPLE = '#c8382a', APPLEG = '#9ac040', LEAFR = '#c8402a',
  LEAFO = '#e8862a', LEAFY = '#e8c040', WHEAT = '#e8c878', STEM = '#5a6a2a', ACORN = '#a8682e', CAP = '#6a4a2a',
  IRON = '#3a3a40', TIN = '#b8bcc4', MOON = '#f8a848', HUSK = '#e8d8a0';
const FIR = '#2f7a4a', RED = '#d03030', GREEN = '#2f8a4a', GOLD = '#f0c040', SNOW = '#f4f8fc', GINGER = '#b8783a',
  ICING = '#fbfbf4', BLACK = '#2a2a30', SKIN = '#f4d0b0', STAG = '#a07048', STAGL = '#e8d8b0', ANTLER = '#cbbca0',
  BULB = '#fff0a0', BLUEB = '#4a7ad8';
const PINK = '#f47aa8', BLUE = '#58a8f0', YELLOW = '#f8d048', MINT = '#6ad8b0', PURPLE = '#a878e8', WHITE = '#fbfbf8',
  CAKE = '#fbf0dc', FLAME = '#ffd060', LILAC = '#e8d8f0';
const PARTY = [PINK, BLUE, YELLOW, MINT, PURPLE];

/* ---------- pictures, each drawn once ---------- */

const sheet = (w, h, draw) => { const c = new OffscreenCanvas(w, h); draw(c.getContext('2d'), w, h); return c; };
const pics = {};
const once = (key, make) => pics[key] || (pics[key] = make());
/** A fixed scatter of numbers 0-1, so a picture is the same every time. */
const scatter = (seed) => { let h = seed >>> 0; return () => { h = Math.imul(h ^ (h >>> 15), 2246822507) + 0x9e3779b9 >>> 0; return (h >>> 8) / 16777216; }; };

/* wicker: rows of woven strands over upright stakes */
const wicker = () => once('wicker', () => sheet(256, 128, (g, w, h) => {
  g.fillStyle = WICKER; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 8) for (let x = ((y / 8) % 2) * 8 - 8; x < w; x += 16) {
    g.fillStyle = '#d8ae70'; g.beginPath(); g.roundRect(x + 1, y + 1, 14, 6, 3); g.fill();
    g.fillStyle = 'rgba(90,60,30,0.35)'; g.fillRect(x + 1, y + 6, 14, 1.5);
  }
}));
/* straw: a bale's ends and sides, pale stalks over gold */
const straw = () => once('straw', () => sheet(128, 128, (g, w, h) => {
  g.fillStyle = HAY; g.fillRect(0, 0, w, h);
  const r = scatter(7);
  for (let i = 0; i < 260; i++) {
    const x = r() * w, y = r() * h, l = 6 + r() * 14, a = (r() - 0.5) * 0.5;
    g.strokeStyle = r() < 0.5 ? 'rgba(255,240,180,0.7)' : 'rgba(150,110,40,0.45)'; g.lineWidth = 1 + r() * 1.4;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
}));
/* a candy cane's stripes, `n` along its length, each wound once round as it goes */
const stripes = (n) => once('cane' + n, () => sheet(512, 64, (g, w, h) => {
  g.fillStyle = ICING; g.fillRect(0, 0, w, h);
  const p = w / n;
  g.fillStyle = RED;
  for (let k = -1; k <= n; k++) { const x0 = k * p; g.beginPath(); g.moveTo(x0, 0); g.lineTo(x0 + p * 0.42, 0); g.lineTo(x0 + p * 1.42, h); g.lineTo(x0 + p, h); g.fill(); }
}));
/* the harvest moon: amber, paler on one side, its seas and craters */
const moonPic = () => once('moon', () => sheet(256, 128, (g, w, h) => {
  const l = g.createLinearGradient(0, 0, w, 0);
  l.addColorStop(0, '#ffd890'); l.addColorStop(0.5, MOON); l.addColorStop(1, '#f8b860');
  g.fillStyle = l; g.fillRect(0, 0, w, h);
  for (const [x, y, rx, ry, c] of [[40, 50, 22, 14, '#e8903a'], [120, 70, 30, 18, '#e8943c'], [190, 40, 18, 12, '#ec9a40'], [80, 90, 12, 8, '#f0c070'], [220, 85, 14, 10, '#e8903a'], [160, 100, 10, 7, '#f4c880']]) {
    g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill();
  }
}));
/* three rolls of wrapping paper side by side: pink dots, blue with stars, gold striped red */
const papers = () => once('papers', () => sheet(256, 192, (g, w) => {
  g.fillStyle = PINK; g.fillRect(0, 0, w, 64); g.fillStyle = WHITE;
  for (let y = 8; y < 64; y += 16) for (let x = (y % 32) / 2; x < w; x += 16) { g.beginPath(); g.arc(x, y, 3, 0, TAU); g.fill(); }
  g.fillStyle = BLUE; g.fillRect(0, 64, w, 64); g.fillStyle = YELLOW;
  for (let y = 74; y < 128; y += 18) for (let x = 6 + (y % 36) / 2; x < w; x += 18) {
    g.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU - Math.PI / 2, r = i % 2 ? 2 : 5; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.fill();
  }
  g.fillStyle = GOLD; g.fillRect(0, 128, w, 64); g.fillStyle = RED;
  for (let x = -64; x < w; x += 20) { g.beginPath(); g.moveTo(x, 128); g.lineTo(x + 8, 128); g.lineTo(x + 72, 192); g.lineTo(x + 64, 192); g.fill(); }
}));

/* ---------- parts the sets share ---------- */

const tubeG = (L, pts, r, seg = 32, rad = 8) => new L.THREE.TubeGeometry(new L.THREE.CatmullRomCurve3(pts.map(p => new L.THREE.Vector3(...p))), seg, r, rad, false);
const lerp = (arr, t) => { const f = t * (arr.length - 1), i = Math.min(arr.length - 2, Math.floor(f)); return arr[i] + (arr[i + 1] - arr[i]) * (f - i); };

/** A tube along `pts` whose radius runs through `radii` from end to end: a horn. */
function taper(L, pts, radii, seg = 28, rad = 12) {
  const { THREE } = L, path = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)));
  const g = new THREE.TubeGeometry(path, seg, 1, rad, false), pos = g.attributes.position, c = new THREE.Vector3();
  for (let i = 0; i <= seg; i++) {
    path.getPointAt(i / seg, c);
    const r = lerp(radii, i / seg);
    for (let j = 0; j <= rad; j++) { const k = i * (rad + 1) + j; pos.setXYZ(k, c.x + (pos.getX(k) - c.x) * r, c.y + (pos.getY(k) - c.y) * r, c.z + (pos.getZ(k) - c.z) * r); }
  }
  g.computeVertexNormals();
  return g;
}

/** A flat strip `w` wide and `t` thick along `pts`, twisted `turns` times: a crêpe streamer. */
function ribbon(L, pts, w, t, turns, seg = 64, rad = 6) {
  const { THREE } = L, path = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)));
  const g = new THREE.TubeGeometry(path, seg, 1, rad, false), pos = g.attributes.position, fr = path.computeFrenetFrames(seg, false);
  const c = new THREE.Vector3(), d = new THREE.Vector3();
  for (let i = 0; i <= seg; i++) {
    path.getPointAt(i / seg, c);
    const th = turns * TAU * i / seg, co = Math.cos(th), si = Math.sin(th), N = fr.normals[i], B = fr.binormals[i];
    for (let j = 0; j <= rad; j++) {
      const k = i * (rad + 1) + j;
      d.set(pos.getX(k), pos.getY(k), pos.getZ(k)).sub(c);
      const p = d.dot(B) * w / 2, q = d.dot(N) * t / 2, a = p * co - q * si, b = p * si + q * co;
      pos.setXYZ(k, c.x + B.x * a + N.x * b, c.y + B.y * a + N.y * b, c.z + B.z * a + N.z * b);
    }
  }
  g.computeVertexNormals();
  return g;
}

/** A pumpkin's shape, r round and h tall from y 0: a ball pinched into `lobes`, dimpled at the stem. */
function pumpkinGeo(L, r, h, lobes = 8, deep = 0.09) {
  const g = r < 0.1 ? L.ball(1, 11, 8) : L.ball(1, 16, 10), pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), a = Math.atan2(z, x);
    const f = 1 - deep * (0.5 - 0.5 * Math.cos(lobes * a)) * Math.sqrt(Math.max(0, 1 - y * y));
    const dip = y > 0.75 ? (y - 0.75) * 0.6 : y < -0.8 ? (y + 0.8) * 0.5 : 0;
    pos.setXYZ(i, x * f * r, (y - dip + 0.9) / 1.75 * h, z * f * r);
  }
  g.computeVertexNormals();
  return g;
}
function pumpkin(K, L, x, y, z, r, h, col, stem = STEM, lobes = 8, deep = 0.09) {
  K.put(pumpkinGeo(L, r, h, lobes, deep), K.gloss(col), x, y, z);
  K.put(L.cyl(r * 0.09, h * 0.28, r * 0.13, 8), K.plain(stem), x, y + h * 0.98, z, 0, 0.18, 0.12);
}
/** A leaf flat in x-y (facing +z): an oval `len` x `wid`. */
const leafGeo = (L, len, wid, th = u(0.5)) => L.ball(1, 8, 6).scale(len, wid, th);
/** A bow facing +z: two loops, a knot and two tails `tail` x its size long. */
function bow(K, L, m, x, y, z, s, turn = 0, tail = 0.8) {
  for (const f of [-1, 1]) {
    K.put(L.torus(s * 0.4, s * 0.14, TAU, 10).scale(1, 0.72, 0.8).rotateZ(f * 0.45).translate(f * s * 0.46, s * 0.04, 0), m, x, y, z, turn);
    if (tail) K.put(L.rbox(s * 0.24, s * tail, s * 0.06, 0.002).translate(0, -s * tail / 2, 0).rotateZ(f * 0.38), m, x, y - s * 0.1, z, turn);
  }
  K.put(L.ball(s * 0.2, 8, 6), m, x, y, z);
}
/** A wrapped present w x h x d, standing at x, y, z turned `turn`: the box, its lid, a ribbon round each way, a bow. */
function gift(K, L, x, y, z, w, h, d, box, rib, { bow: tied = true, turn = 0 } = {}) {
  const put = (geo, m, dx, dy, dz) => K.put(geo.translate(dx, dy, dz), m, x, y, z, turn);
  const rb = K.gloss(rib), rw = Math.min(w, d) * 0.16, lid = Math.min(h * 0.25, u(3));
  put(L.rbox(w, h - lid, d, 0.008), K.gloss(box), 0, (h - lid) / 2, 0);
  put(L.rbox(w + 0.012, lid, d + 0.012, 0.008), K.gloss(L.tone(box, 1.12)), 0, h - lid / 2, 0);
  put(L.rbox(rw, h + 0.004, d + 0.02, 0.002), rb, 0, h / 2, 0);
  put(L.rbox(w + 0.02, h + 0.004, rw, 0.002), rb, 0, h / 2, 0);
  if (tied) bow(K, L, rb, x, y + h + Math.min(w, d) * 0.12, z, Math.min(w, d) * 0.42, turn, 0);
}
/** An acorn about x, y, z, `r` its size, tipped `tip` over: the nut, its cap, a stalk. */
function acorn(K, L, x, y, z, r, tip = 0) {
  const { THREE } = L, at = (g) => g.rotateZ(tip).translate(x, y, z);
  K.put(at(L.ball(r * 0.78, 8, 6).scale(1, 1.25, 1).translate(0, -r * 0.2, 0)), K.gloss(ACORN));
  K.put(at(new THREE.SphereGeometry(r * 0.9, 8, 3, 0, TAU, 0, Math.PI / 2).scale(1, 0.75, 1).translate(0, r * 0.12, 0)), K.plain(CAP));
  K.put(at(L.cyl(r * 0.1, r * 0.4, r * 0.12, 6).translate(0, r * 0.9, 0)), K.plain(CAP));
}
/** A spoked wheel facing z: its rim, three spokes across, the hub. */
function wheel(K, L, x, y, z, r, m, hub, spokes = 6) {
  K.put(L.torus(r - u(1), u(1.1), TAU, 24), m, x, y, z);
  for (let i = 0; i < spokes; i++) K.put(L.rbox(u(1), r * 2 - u(2), u(0.8), 0.002).rotateZ(i / spokes * Math.PI), m, x, y, z);
  K.put(L.cyl(u(2), u(2.6), u(2), 10).rotateX(Math.PI / 2), hub, x, y, z);
}
/** A cloth skirt to the floor from a round top `r0` at `top` to `r1` at the hem, pleated: a party table's. */
function skirt(K, L, m, r0, r1, top, pleats = 16) {
  const g = L.lathe([[0.001, top], [r0, top], [r0 + u(0.4), top - u(0.6)], [r1, u(0.4)], [r1 - u(0.2), 0]], pleats * 2, true), pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), y = pos.getY(i);
    if (y > top - u(0.8)) continue;
    const f = 1 + 0.035 * Math.cos(pleats * Math.atan2(x, z)) * (1 - y / top);
    pos.setX(i, x * f); pos.setZ(i, z * f);
  }
  g.computeVertexNormals();
  K.put(g, m);
}

/* the spinning part of a music box: one material on a strip of colours, each part's uvs on its own cell */
const CELLS = [FIR, GOLD, RED, BLUEB, SNOW];
const cells = () => once('cells', () => sheet(CELLS.length * 8, 8, (g) => CELLS.forEach((c, i) => { g.fillStyle = c; g.fillRect(i * 8, 0, 8, 8); })));
const cell = (g, c) => { const i = CELLS.indexOf(c), uv = g.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, (i + 0.5) / CELLS.length, 0.5); return g; };

export const SHAPES = {
  harvesthorn: { make: 'harvesthorn' },
  haystack: { make: 'haystack' },
  gourdstand: { make: 'gourdstand' },
  ciderpress: { make: 'ciderpress', play: { does: 'whirr' } },
  harvestwreath: { make: 'harvestwreath' },
  huskdoll: { make: 'huskdoll' },
  pierack: { make: 'pierack' },
  leafpile: { make: 'leafpile' },
  harvestmoon: { make: 'harvestmoon', play: { does: 'light' } },
  squashwagon: { make: 'squashwagon' },
  syrupbucket: { make: 'syrupbucket' },
  harvesttable: { make: 'harvesttable', top: 0.98 },
  acornbasket: { make: 'acornbasket' },
  holidaytree: { make: 'holidaytree', play: { does: 'light' } },
  giftpile: { make: 'giftpile', play: { does: 'treasure' } },
  gift: { make: 'present' },
  holidayexpress: { make: 'holidayexpress', play: { does: 'steam' } },
  stockinggarland: { make: 'stockinggarland', play: { does: 'light' } },
  delibirdsack: { make: 'delibirdsack', play: { does: 'treasure' } },
  nutcracker: { make: 'nutcracker' },
  gingerhouse: { make: 'gingerhouse' },
  candyarch: { make: 'candyarch' },
  holidaywreath: { make: 'holidaywreath', play: { does: 'light' } },
  stantlerfig: { make: 'stantlerfig' },
  snowlamp: { make: 'snowlamp', play: { does: 'light' } },
  cookietable: { make: 'cookietable' },
  holidaymusicbox: { make: 'holidaymusicbox', play: { does: 'player', voice: 'musicbox' } },
  bdaycake: { make: 'bdaycake', play: { does: 'light', flicker: true } },
  balloonarch: { make: 'balloonarch', play: { does: 'give', gives: 'balloon' } },
  partyhats: { make: 'partyhats' },
  presenttower: { make: 'presenttower', play: { does: 'treasure' } },
  streamers: { make: 'streamers' },
  bdaybanner: { make: 'bdaybanner' },
  candybuffet: { make: 'candybuffet' },
  partypopper: { make: 'partypopper', play: { does: 'boing' } },
  bubblemachine: { make: 'bubblemachine', play: { does: 'bubbles' } },
  confetticannon: { make: 'confetticannon', play: { does: 'firework' } },
  wraptable: { make: 'wraptable' },
  numbercake: { make: 'numbercake', play: { does: 'light', flicker: true } },
  punchbowl: { make: 'punchbowl', play: { does: 'water', bubbles: true } },
};

export const MAKES = {
  // a new room's present (js/base-3d.js wobbles and opens it): its painting's red box under a wider lid, a gold ribbon
  // down the front and over the top, a belt round its middle and a bow
  present(K, s, W, D, L) {
    const box = K.gloss('#d84848'), lid = K.gloss('#e85858'), rib = K.gloss('#f8d030');
    K.put(L.rbox(u(26), u(25), u(26), 0.01), box, 0, u(12.5), 0);
    K.put(L.rbox(u(30), u(7), u(30), 0.012), lid, 0, u(28.5), 0);
    K.put(L.rbox(u(4), u(25.2), u(26.4), 0.003), rib, 0, u(12.6), 0);
    K.put(L.rbox(u(26.4), u(4), u(26.4), 0.003), rib, 0, u(14), 0);
    K.put(L.rbox(u(4), u(7.3), u(30.4), 0.003), rib, 0, u(28.6), 0);
    K.put(L.rbox(u(30.4), u(7.3), u(4), 0.003), rib, 0, u(28.6), 0);
    bow(K, L, rib, 0, u(36.5), 0, u(13), 0, 0);
  },
  /* ---------- Harvest ---------- */

  /** A side table, its runner across it, a wicker horn of plenty spilling fruit. */
  harvesthorn(K, s, W, D, L) {
    const { rbox, lathe, ball, cyl } = L, dark = K.wood(DARKWOOD), cloth = K.cloth(RUST);
    K.put(rbox(u(58), u(5), 0.74, 0.02), K.wood(OAK), 0, u(28.5), 0);
    const legP = [[u(3.2), 0], [u(3.2), u(4)], [u(2.3), u(5.5)], [u(3), u(10)], [u(2.1), u(17)], [u(3), u(24)], [u(3), u(26)]];
    for (const lx of [10, 54]) for (const z of [-0.27, 0.27]) K.put(lathe(legP, 12), dark, X(lx, 2), 0, z);
    for (const lx of [10, 54]) K.put(rbox(u(2), u(2), 0.5, 0.006), dark, X(lx, 2), u(12), 0);
    K.put(rbox(u(44), u(2), u(2), 0.006), dark, 0, u(12), 0);
    K.put(rbox(u(20), u(0.6), 0.76, 0.002), cloth, 0, u(31.3), 0);
    for (const sz of [-1, 1]) K.put(rbox(u(20), u(10), u(0.6), 0.002), cloth, 0, u(26), sz * 0.385);
    // the horn, its rim and dark mouth
    const hp = [[42, 41], [33, 40], [25, 41], [18, 43.5], [13, 47], [10.5, 51.5], [11, 55]];
    K.put(taper(L, hp.map(([a, h]) => [X(a, 2), u(h), 0]), [9, 7.4, 5.8, 4.3, 3, 2, 1.2].map(u)), K.pic(wicker()));
    K.put(L.torus(u(8.6), u(0.9), TAU, 20).rotateY(Math.PI / 2), K.wood(WICKER), X(42.2, 2), u(41), 0);
    K.put(cyl(u(8.4), u(0.4), u(8.4), 16).rotateZ(Math.PI / 2), K.plain('#4a2a14'), X(41.2, 2), u(41), 0);
    // the fruit
    pumpkin(K, L, X(52, 2), u(31.6), 0.04, u(6.5), u(11), PUMPKIN);
    for (const [a, c, z] of [[58.5, APPLE, 0.1], [45, APPLEG, 0.17]]) {
      K.put(ball(u(3.4), 12, 8), K.gloss(c), X(a, 2), u(34.6), z);
      K.put(cyl(u(0.3), u(1.6), u(0.3), 6), K.plain(STEM), X(a, 2), u(38.4), z);
    }
    for (const [a, h, z] of [[47, 48, 0.02], [50, 48, -0.03], [48.5, 45, 0.05], [51.5, 45, 0], [50, 42, 0.03], [49, 46, -0.07]]) K.put(ball(u(1.9), 8, 6), K.gloss('#7a3a8a'), X(a, 2), u(h), z);
    for (const [a, h] of [[40, 52], [43, 53]]) {
      rod(K, L, K.plain(L.tone(WHEAT, 0.8)), [X(a + 2, 2), u(44), 0], [X(a, 2), u(h), 0], u(0.35));
      K.put(ball(1, 8, 6).scale(u(1.2), u(2.6), u(1.2)), K.plain(WHEAT), X(a, 2), u(h + 2), 0);
    }
    K.put(leafGeo(L, u(3), u(1.6)).rotateZ(0.5), K.gloss(LEAFO), X(44, 2), u(51), 0.04);
    K.put(leafGeo(L, u(2.6), u(1.4)).rotateZ(-0.4), K.gloss(LEAFR), X(55, 2), u(44), 0.12);
  },

  /** Three bales stacked two and one, twine round each, a pumpkin and a bottle gourd on top. */
  haystack(K, s, W, D, L) {
    const bale = K.pic(straw()), twine = K.plain('#9a5a2a');
    for (const [bx, by, z] of [[2, 0, 0.03], [33, 0, -0.03], [17, 18, 0]]) {
      const cx = X(bx + 14.5, 2), cy = u(by + 9);
      K.put(L.rbox(u(29), u(18), 0.54, 0.05), bale, cx, cy, z);
      for (const f of [0.3, 0.7]) K.put(L.rbox(u(1.4), u(18) + 0.008, 0.548, 0.01), twine, cx + (f - 0.5) * u(29), cy, z);
    }
    pumpkin(K, L, X(38, 2), u(36), 0.02, u(6), u(10), PUMPKIN);
    K.put(L.ball(u(4), 12, 8).scale(1, 0.76, 1), K.gloss(GOURD), X(25.5, 2), u(39), 0.1);
    K.put(L.ball(u(2.4), 10, 8).scale(1, 1.5, 1), K.gloss(L.tone(GOURD, 1.15)), X(22, 2), u(41.5), 0.1);
    K.put(L.cyl(u(0.4), u(2), u(0.5), 6), K.plain(STEM), X(21.4, 2), u(46), 0.1, 0, 0, 0.3);
  },

  /** A two-step crate stand: pumpkins orange and white below, a green gourd, a crookneck and a pumpkin above. */
  gourdstand(K, s, W, D, L) {
    const { rbox } = L, oak = K.wood(OAK), dark = K.wood(L.tone(OAK, 0.74));
    K.put(rbox(u(28), u(26), 0.42, 0.012), dark, 0, u(13), -0.25);
    K.put(rbox(u(30), u(12), 0.5, 0.012), oak, 0, u(6), 0.2);
    for (const sx of [-1, 1]) K.put(rbox(u(2), u(12.2), u(2), 0.002), dark, sx * u(13.6), u(6.1), 0.43);
    for (const h of [4, 8]) K.put(rbox(u(29), u(0.5), u(0.4), 0.001), K.plain(L.tone(OAK, 0.55)), 0, u(h), 0.452);
    pumpkin(K, L, X(22), u(26), -0.22, u(5), u(8.4), PUMPKIN);
    K.put(L.ball(u(3.6), 12, 8).scale(1, 0.84, 1), K.gloss(GOURD), X(9), u(29), -0.2);
    for (const a of [0, 1, 2, 3]) K.put(L.torus(u(3.5), u(0.4), Math.PI, 10).rotateY(a * Math.PI / 4).scale(1, 0.84, 1), K.gloss(L.tone(GOURD, 0.75)), X(9), u(29), -0.2);
    K.put(L.ball(u(2.4), 10, 8).scale(1, 1.3, 1), K.gloss(SQUASH), X(14.5), u(29.4), -0.12);
    K.put(tubeG(L, [[X(14.5), u(30), -0.12], [X(13.2), u(34), -0.12], [X(13.8), u(37), -0.12]], u(1.2), 10, 8), K.gloss(SQUASH));
    pumpkin(K, L, X(10), u(12), 0.2, u(7), u(11.6), PUMPKIN);
    pumpkin(K, L, X(23.5), u(12), 0.22, u(5), u(8.8), CREAM, '#7a8a4a');
  },

  /** A cider press: a slatted basket of pulp under an iron screw, the crank on top, the frame round it, two apples. */
  ciderpress(K, s, W, D, L) {
    const { rbox, cyl, torus, ball } = L, oak = K.wood(OAK), dark = K.wood(DARKWOOD), iron = K.metal(IRON);
    K.put(rbox(u(30), u(7), 0.8, 0.015), dark, 0, u(3.5), 0);
    K.put(rbox(u(6), u(2), 0.14, 0.002), K.plain(L.tone(DARKWOOD, 0.5)), 0, u(5.6), 0.35);
    for (const px of [4, 28]) K.put(rbox(u(4), u(53), u(6), 0.01), oak, X(px), u(33.5), 0);
    K.put(rbox(u(30), u(6), u(8), 0.012), oak, 0, u(57), 0);
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; K.put(rbox(u(3.4), u(21), u(1.2), 0.002), oak, Math.sin(a) * u(7.4), u(17.5), Math.cos(a) * u(7.4), a); }
    K.put(cyl(u(7), u(19), u(7), 16), K.plain('#c89048'), 0, u(16.5), 0);
    for (const h of [11.5, 24.5]) K.put(torus(u(8.1), u(0.8), TAU, 24), iron, 0, u(h), 0, 0, Math.PI / 2);
    K.put(cyl(u(8), u(3), u(8), 16), oak, 0, u(29.5), 0);
    // the screw through the beam, its thread, the crank
    K.put(cyl(u(1.2), u(36), u(1.2), 10), iron, 0, u(49), 0);
    for (let h = 33; h < 53; h += 3) K.put(torus(u(1.3), u(0.5), TAU, 12), iron, 0, u(h), 0, 0, Math.PI / 2);
    K.put(cyl(u(0.9), u(16), u(0.9), 8).rotateZ(Math.PI / 2), iron, 0, u(65), 0);
    for (const kx of [8, 24]) K.put(ball(u(1.8), 10, 8), dark, X(kx), u(65), 0);
    for (const [a, c] of [[5.5, APPLE], [26.5, APPLEG]]) K.put(ball(u(2.6), 12, 8), K.gloss(c), X(a), u(9.6), 0.3);
  },

  /** A wreath on the wall: a twig ring under autumn leaves, wheat, acorns and two little pumpkins, an orange bow. */
  harvestwreath(K, s, W, D, L) {
    const cy = WY(38), at = (t, r) => [Math.cos(t) * u(r), cy - Math.sin(t) * u(r)];
    K.put(L.rbox(u(1), u(14), u(0.4), 0.002), K.cloth(L.tone(RUST, 0.74)), 0, WY(21), u(0.6));
    K.put(L.ball(u(1.3), 8, 6), K.metal(TIN), 0, WY(14), u(0.8));
    K.put(L.torus(u(10), u(1.8), TAU, 28), K.wood('#6a4a2a'), 0, cy, u(2));
    const cols = [LEAFR, LEAFO, LEAFY, RUST];
    for (let a = 0; a < 18; a++) {
      const t = a / 18 * TAU, [x, y] = at(t, 10.5);
      K.put(leafGeo(L, u(3.4), u(1.9)).rotateX(a % 2 ? 0.35 : -0.25).rotateZ(-t + Math.PI / 2), K.gloss(cols[a % 4]), x, y, u(3.2));
    }
    for (const t of [0.6, 2.5, 4.3]) { const [x, y] = at(t, 9); K.put(L.ball(1, 8, 6).scale(u(1.4), u(2.8), u(1)), K.plain(WHEAT), x, y, u(4.4)); }
    for (const t of [1.6, 3.6, 5.4]) { const [x, y] = at(t, 10); acorn(K, L, x, y, u(4.6), u(1.9)); }
    pumpkin(K, L, -u(7.5), cy + u(7) - u(2.2), u(4.2), u(2.6), u(4.4), PUMPKIN);
    pumpkin(K, L, u(8), cy + u(6.5) - u(2), u(4.2), u(2.4), u(4), CREAM);
    bow(K, L, K.cloth('#f89a48'), 0, cy - u(10.5), u(5), u(6.6), 0, 1.4);
  },

  /** A corn-husk doll on a round stand: a husk skirt in strips, stiff arms, a bonnet, red twine at waist and neck. */
  huskdoll(K, s, W, D, L) {
    const { cyl, lathe, ball, torus } = L, husk = K.plain(HUSK), dark = K.plain(L.tone(HUSK, 0.82)), twine = K.plain(RED);
    K.put(cyl(u(10), u(4), u(10.4), 20), K.wood(OAK), 0, u(2), 0);
    K.put(lathe([[0.001, u(4)], [u(9.2), u(4)], [u(8.6), u(6)], [u(6), u(16)], [u(4), u(26)], [0.001, u(26.5)]], 10, true), husk);
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; rod(K, L, dark, [Math.sin(a) * u(9), u(4.4), Math.cos(a) * u(9)], [Math.sin(a) * u(4), u(25.6), Math.cos(a) * u(4)], u(0.35)); }
    K.put(cyl(u(3.6), u(10), u(4.2), 12), dark, 0, u(31), 0);
    K.put(cyl(u(1.5), u(18), u(1.5), 10).rotateZ(Math.PI / 2), husk, 0, u(33.5), 0);
    for (const sx of [-1, 1]) K.put(cyl(u(1.3), u(3), u(2.2), 10).rotateZ(sx * Math.PI / 2), dark, sx * u(9.6), u(33.5), 0);
    K.put(torus(u(4.3), u(0.7), TAU, 16), twine, 0, u(26.6), 0, 0, Math.PI / 2);
    K.put(torus(u(1.9), u(0.7), TAU, 12), twine, 0, u(37.2), 0, 0, Math.PI / 2);
    K.put(cyl(u(1.6), u(2), u(1.6), 10), husk, 0, u(37), 0);
    K.put(ball(u(4.6), 12, 10), husk, 0, u(41.4), 0.03);
    K.put(ball(u(5.3), 12, 10).scale(1, 1.1, 1), dark, 0, u(41.6), -0.035);
    K.put(cyl(0.002, u(3.4), u(2.8), 8), dark, 0, u(46.6), -0.04);
  },

  /** An iron rack of three pies cooling: a cherry lattice, a pumpkin pie and a domed apple crust. */
  pierack(K, s, W, D, L) {
    const { cyl, ball, rbox, lathe, torus } = L, iron = K.metal(IRON), tin = K.metal(TIN), crust = K.plain('#d8a058');
    for (const px of [4, 28]) for (const z of [-0.2, 0.2]) {
      K.put(cyl(u(1), u(58), u(1), 8), iron, X(px), u(29), z);
      K.put(ball(u(1.8), 8, 6), iron, X(px), u(59), z);
      K.put(ball(u(1.5), 8, 6).scale(1.3, 0.6, 1.3), iron, X(px), u(0.9), z);
    }
    [6, 24, 42].forEach((h, i) => {
      for (const z of [-0.2, 0.2]) K.put(rbox(u(25), u(1.2), u(1.2), 0.002), iron, 0, u(h), z);
      for (const px of [4, 28]) K.put(rbox(u(1.2), u(1.2), 0.4, 0.002), iron, X(px), u(h), 0);
      for (let k = 1; k < 5; k++) K.put(cyl(u(0.4), u(24), u(0.4), 6).rotateZ(Math.PI / 2), iron, 0, u(h + 0.5), -0.2 + k * 0.08);
      const y = u(h + 0.9);
      K.put(lathe([[0.001, 0], [u(9), 0], [u(11), u(4)], [u(10.4), u(4)], [u(8.6), u(0.6)], [0.001, u(0.6)]], 20), tin, 0, y, 0);
      K.put(torus(u(10.2), u(1.3), TAU, 24), crust, 0, y + u(4), 0, 0, Math.PI / 2);
      if (i === 0) {
        K.put(cyl(u(9.6), u(0.6), u(9.6), 20), K.plain('#b02838'), 0, y + u(3.5), 0);
        for (const o of [-5, 0, 5]) {
          const len = 2 * Math.sqrt(9.6 * 9.6 - o * o);
          K.put(rbox(u(len), u(0.7), u(1.6), 0.002), crust, 0, y + u(4.1), u(o));
          K.put(rbox(u(1.6), u(0.7), u(len), 0.002), crust, u(o), y + u(4.3), 0);
        }
      } else if (i === 1) K.put(cyl(u(9.6), u(0.6), u(9.6), 20), K.gloss(PUMPKIN), 0, y + u(3.6), 0);
      else {
        K.put(lathe([[u(10), 0], [u(9), u(1.6)], [u(6), u(2.8)], [0.001, u(3.2)]], 20), K.plain('#e0b070'), 0, y + u(3.6), 0);
        for (const o of [-4, 0, 4]) K.put(rbox(u(1), u(0.4), u(3), 0.001), K.plain('#8a5a2a'), u(o), y + u(6.6), 0.02, 0.4);
      }
    });
  },

  /** A heap of fallen leaves in red, orange and gold, a big Leafeon-tail leaf standing out of it. */
  leafpile(K, s, W, D, L) {
    const { THREE } = L, rx = u(15.2), ry = u(16), rz = 0.42;
    K.put(new THREE.SphereGeometry(1, 16, 6, 0, TAU, 0, Math.PI / 2).scale(rx, ry, rz), K.plain(L.tone(LEAFO, 0.85)));
    const cols = [LEAFR, LEAFO, LEAFY, RUST], up = new THREE.Vector3(0, 1, 0), n = new THREE.Vector3(), q = new THREE.Quaternion();
    for (let i = 0; i < 34; i++) {
      const a = i * 2.39996, e = Math.asin(Math.min(0.97, (i + 4) / 38)), c = Math.cos(e);
      n.set(c * Math.cos(a) / rx, Math.sin(e) / ry + 2, c * Math.sin(a) / rz).normalize();
      const g = L.ball(1, 8, 6).scale(u(3.3), u(0.45), u(1.9)).rotateY(i * 1.7).applyQuaternion(q.setFromUnitVectors(up, n));
      K.put(g, K.gloss(cols[i % 4]), c * Math.cos(a) * rx * 0.86, Math.max(u(2.6), Math.sin(e) * ry * 1.01), c * Math.sin(a) * rz * 0.86);
    }
    // the Leafeon leaf: its outline extruded, a midrib up it
    const sh = new THREE.Shape();
    sh.moveTo(X(24), u(10)); sh.quadraticCurveTo(X(19), u(27), X(23), u(40)); sh.quadraticCurveTo(X(30), u(27), X(27.5), u(10)); sh.closePath();
    K.put(new THREE.ExtrudeGeometry(sh, { depth: u(1), bevelEnabled: true, bevelThickness: u(0.3), bevelSize: u(0.3), bevelSegments: 1, curveSegments: 8 }).translate(0, 0, -u(0.5)), K.gloss('#a8c858'));
    rod(K, L, K.plain(L.tone('#a8c858', 0.7)), [X(25.6), u(12), u(0.9)], [X(23.4), u(37), u(0.9)], u(0.35));
    for (const [a, c] of [[2.5, LEAFR], [29.5, LEAFY]]) K.put(L.ball(1, 8, 6).scale(u(2.8), u(0.4), u(1.4)), K.gloss(c), X(a), u(0.5), 0.34, a);
  },

  /** A harvest moon lit amber on a log stand, a twig of autumn leaves curling up beside it. */
  harvestmoon(K, s, W, D, L) {
    const { cyl, torus, ball } = L;
    K.put(cyl(u(11), u(6), u(11.4), 20), K.wood(L.tone(OAK, 0.8)), 0, u(3), 0);
    K.put(cyl(u(10.4), u(0.5), u(10.4), 20), K.plain('#d8b080'), 0, u(6.1), 0);
    for (const r of [4, 7.5]) K.put(torus(u(r), u(0.25), TAU, 20), K.plain('#b8905a'), 0, u(6.4), 0, 0, Math.PI / 2);
    K.put(cyl(u(4), u(4.5), u(4.6), 16), K.wood(DARKWOOD), 0, u(8.4), 0);
    K.put(ball(u(12.5), 20, 14), L.litPic(moonPic(), 0.7), 0, u(23), 0);
    K.put(tubeG(L, [[X(6), u(6), -0.12], [X(3.5), u(22), -0.17], [X(5), u(38), -0.12], [X(10), u(44), -0.04]], u(0.8), 20, 6), K.wood(DARKWOOD));
    for (const [a, h, c, t, z] of [[3, 30, LEAFR, 0.6, -0.12], [8, 42, LEAFO, -0.6, -0.08], [12, 45, LEAFY, 0.3, -0.03]]) K.put(leafGeo(L, u(2.8), u(1.5)).rotateZ(t), K.gloss(c), X(a), u(h), z);
  },

  /** A wooden wagon on spoked wheels, straw in its bed under a heap of squash, its tongue out front. */
  squashwagon(K, s, W, D, L) {
    const { rbox, cyl, lathe } = L, oak = K.wood(OAK), dark = K.wood(DARKWOOD), seam = K.plain(L.tone(OAK, 0.6)), iron = K.metal(IRON);
    K.put(rbox(u(50), u(2), 0.6, 0.006), oak, X(32, 2), u(13), 0);
    for (const z of [-0.3, 0.3]) {
      K.put(rbox(u(50), u(11), u(1.6), 0.008), oak, X(32, 2), u(18.5), z);
      for (const h of [17, 21]) K.put(rbox(u(50), u(0.5), u(1.7), 0.002), seam, X(32, 2), u(h), z);
    }
    for (const ex of [7, 57]) K.put(rbox(u(1.6), u(11), 0.6, 0.006), oak, X(ex, 2), u(18.5), 0);
    for (const ex of [7, 57]) for (const z of [-0.3, 0.3]) K.put(rbox(u(2.2), u(14), u(2.2), 0.006), dark, X(ex, 2), u(19), z);
    K.put(rbox(u(48), u(9), 0.56, 0.02), K.plain(HAY), X(32, 2), u(19.5), 0);
    for (const wx of [16, 48]) {
      K.put(cyl(u(1), 0.82, u(1), 8).rotateX(Math.PI / 2), iron, X(wx, 2), u(9), 0);
      for (const z of [-0.38, 0.38]) wheel(K, L, X(wx, 2), u(9), z, u(8), dark, iron);
    }
    rod(K, L, dark, [X(7, 2), u(15), 0], [X(1.4, 2), u(10), 0], u(0.9));
    K.put(cyl(u(1), 0.3, u(1), 8).rotateX(Math.PI / 2), dark, X(1, 2), u(9.6), 0);
    // the squash
    K.put(lathe([[0.001, 0], [u(3.4), u(0.6)], [u(4.4), u(3.5)], [u(3.8), u(7)], [u(2.7), u(9.5)], [u(2.8), u(15.5)], [u(1.8), u(17.6)], [0.001, u(18.2)]], 14).rotateZ(-Math.PI / 2), K.gloss('#e8c890'), X(7.2, 2), u(29), 0.12);
    pumpkin(K, L, X(33, 2), u(25.6), -0.02, u(7.5), u(13), PUMPKIN);
    pumpkin(K, L, X(48, 2), u(25.6), -0.05, u(5), u(9), '#3a5a2a', STEM, 10, 0.16);
    K.put(L.ball(u(3), 10, 8).scale(1, 0.8, 1), K.gloss(SQUASH), X(24, 2), u(35.6), 0.14);
    K.put(tubeG(L, [[X(23.4, 2), u(36), 0.14], [X(21.2, 2), u(38.6), 0.14], [X(21.6, 2), u(41), 0.14]], u(1.1), 8, 8), K.gloss(SQUASH));
    pumpkin(K, L, X(43, 2), u(34.5), 0.15, u(3.6), u(6), CREAM, '#7a8a4a');
  },

  /** A maple log, a tin spile and a lidded sap bucket hung off it, a red leaf on the cut top. */
  syrupbucket(K, s, W, D, L) {
    const { cyl, lathe, torus } = L, zc = -0.11, tin = K.metal(TIN);
    const log = cyl(u(11), u(54), u(11.6), 24, false, true), pos = log.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      if (Math.hypot(x, z) < 1e-4) continue;
      const f = 1 + 0.045 * Math.cos(12 * Math.atan2(z, x));
      pos.setX(i, x * f); pos.setZ(i, z * f);
    }
    log.computeVertexNormals();
    K.put(log, K.wood('#7a5a3a'), 0, u(27), zc);
    K.put(cyl(u(10.6), u(0.6), u(10.6), 20), K.plain('#e0c08a'), 0, u(54.3), zc);
    for (const r of [3, 6.5]) K.put(torus(u(r), u(0.3), TAU, 20), K.plain('#c09a68'), 0, u(54.65), zc, 0, Math.PI / 2);
    K.put(L.ball(1, 8, 6).scale(u(3), u(0.4), u(1.6)), K.gloss(LEAFR), X(19), u(55), zc + 0.05, 0.6);
    K.put(cyl(u(0.8), 0.16, u(0.8), 8).rotateX(Math.PI / 2), tin, 0, u(38.5), 0.26);
    // the bucket, oval to hang flat on the log: its hoops and a peaked lid
    K.put(lathe([[0.001, 0], [u(6), 0], [u(7), u(18)], [u(6.6), u(18)], [u(5.6), u(0.6)], [0.001, u(0.6)]], 20).scale(1, 1, 0.72), tin, 0, u(18), 0.33);
    for (const [h, r] of [[21, 6.2], [33, 6.85]]) K.put(torus(u(r), u(0.45), TAU, 20).rotateX(Math.PI / 2).scale(1, 1, 0.72), K.metal(L.tone(TIN, 0.75)), 0, u(h), 0.33);
    K.put(cyl(u(0.6), u(5), u(8.4) * Math.SQRT2, 4).rotateY(Math.PI / 4).scale(1, 1, 0.72), K.metal(L.tone(TIN, 1.12)), 0, u(38.5), 0.33);
  },

  /** A long table of three planks on two trestles, a stretcher wedged through them, a burlap runner across it. */
  harvesttable(K, s, W, D, L) {
    const { rbox } = L, oak = K.wood(OAK), dark = K.wood(DARKWOOD), burlap = K.cloth('#c8b080');
    for (const z of [-0.31, 0, 0.31]) K.put(rbox(u(62), u(5), 0.3, 0.012), oak, 0, u(28.5), z);
    for (const lx of [11, 53]) {
      K.put(rbox(u(6), u(23), u(6), 0.01), dark, X(lx, 2), u(14.5), 0);
      K.put(rbox(u(12), u(3), 0.82, 0.012), dark, X(lx, 2), u(1.5), 0);
      K.put(rbox(u(10), u(2), 0.84, 0.008), dark, X(lx, 2), u(25), 0);
    }
    K.put(rbox(u(50), u(3), u(3), 0.008), dark, 0, u(12.5), 0);
    for (const lx of [6.4, 57.6]) K.put(rbox(u(1.4), u(5), u(3.8), 0.002), K.wood(L.tone(DARKWOOD, 1.3)), X(lx, 2), u(12.5), 0);
    K.put(rbox(u(16), u(0.5), 0.94, 0.002), burlap, 0, u(31.25), 0);
    for (const z of [-0.47, 0.47]) K.put(rbox(u(16), u(3.5), u(0.5), 0.002), burlap, 0, u(29.5), z);
  },

  /** A wicker basket heaped with acorns, its handle up, two acorns fallen by it. */
  acornbasket(K, s, W, D, L) {
    const { lathe, torus, cyl } = L;
    K.put(lathe([[0.001, 0], [u(8), 0], [u(11), u(14.5)], [u(10.2), u(14.5)], [u(7.4), u(1)], [0.001, u(1)]], 20), K.pic(wicker()));
    K.put(torus(u(11), u(1), TAU, 24), K.wood(WICKER), 0, u(14.8), 0, 0, Math.PI / 2);
    K.put(torus(u(9.6), u(0.9), Math.PI, 16).scale(1, 14 / 9.6, 1), K.wood(L.tone(WICKER, 0.85)), 0, u(15), 0);
    K.put(cyl(u(10), u(0.5), u(10), 16), K.plain('#5a3a20'), 0, u(13.8), 0);
    for (const [a, h, z] of [[10, 17, 0.14], [14, 18.5, 0.16], [18, 18.5, 0.15], [22, 17, 0.13], [12, 20.5, 0.02], [16, 21.5, 0], [20, 20.5, 0.03], [11, 17.5, -0.12], [16, 18.5, -0.18], [21, 17.5, -0.13], [16, 17.5, 0.24]])
      acorn(K, L, X(a), u(h), z, u(2.4), (a - 16) * 0.05);
    acorn(K, L, X(3), u(2.4), 0.3, u(2), Math.PI / 2);
    acorn(K, L, X(29), u(2.4), 0.26, u(2), -Math.PI / 2);
  },

  /* ---------- Winter holidays ---------- */

  /** The tree: three tiers of fir in a red stand, gold garlands, baubles and warm lights all round, a lit star. */
  holidaytree(K, s, W, D, L) {
    const { lathe, cyl, ball, THREE } = L, fir = K.plain(FIR), tip = K.plain(L.tone(FIR, 0.74)), glow = K.glow(BULB), gold = K.metal(GOLD);
    K.put(lathe([[0.001, 0], [u(5.2), 0], [u(7), u(11)], [0.001, u(11)]], 20), K.gloss(RED));
    K.put(cyl(u(6.5), u(2), u(6.2), 20), gold, 0, u(8), 0);
    K.put(cyl(u(2), u(5), u(2.2), 10), K.wood(DARKWOOD), 0, u(13), 0);
    const tiers = [[14, 42, 15.5], [36, 60, 12], [56, 76, 8]];
    const rAt = (h) => Math.max(0, ...tiers.filter(([b0, a0]) => h >= b0 && h <= a0).map(([b0, a0, half]) => u(half) * (a0 - h) / (a0 - b0)));
    for (const [b0, a0, half] of tiers) {
      K.put(lathe([[0.001, u(b0 + 3)], [u(half * 0.7), u(b0 + 0.8)], [u(half), u(b0)], [u(half * 0.45), u((b0 + a0) / 2)], [0.001, u(a0)]], 20), fir);
      for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; K.put(ball(u(1.5), 6, 4), tip, Math.sin(a) * u(half - 1.1), u(b0 + 0.3), Math.cos(a) * u(half - 1.1)); }
    }
    // a garland round each of the two lower tiers
    for (const [h0, h1] of [[34, 20], [54, 42]]) {
      const pts = [];
      for (let k = 0; k <= 16; k++) { const a = -Math.PI / 2 + k / 16 * TAU, h = h0 + (h1 - h0) * k / 16, r = rAt(h) + u(0.5); pts.push([Math.sin(a) * r, u(h), Math.cos(a) * r]); }
      K.put(tubeG(L, pts, u(0.6), 36, 5), gold);
    }
    const onTree = (a, h, back) => { const x = X(a), r = rAt(h), z = Math.sqrt(Math.max(0, r * r - x * x)) + u(0.6); return back ? [-x, u(h), -z] : [x, u(h), z]; };
    for (const [a, h, c] of [[10, 20, RED], [22, 22, BLUEB], [16, 30, GOLD], [12, 42, BLUEB], [21, 45, RED], [16, 61, GOLD], [5, 18, GOLD], [27, 19, RED]])
      for (const back of [false, true]) K.put(ball(u(1.9), 8, 6), K.gloss(back && c === RED ? BLUEB : c), ...onTree(a, h, back));
    for (const [a, h] of [[7, 18], [25, 18], [13, 26], [19, 36], [9, 39], [23, 40], [14, 52], [19, 57], [16, 70], [4, 15.5], [28, 15.5]])
      for (const back of [false, true]) K.put(ball(u(1), 6, 4), glow, ...onTree(a, h, back));
    // the star
    const star = new THREE.Shape();
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + Math.PI / 2, r = u(i % 2 ? 2.6 : 6); i ? star.lineTo(Math.cos(a) * r, Math.sin(a) * r) : star.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    K.put(new THREE.ExtrudeGeometry(star, { depth: u(1.4), bevelEnabled: true, bevelThickness: u(0.4), bevelSize: u(0.4), bevelSegments: 1 }).translate(0, 0, -u(0.7)), K.glow(GOLD), 0, u(81), 0);
  },

  /** A pile of presents: a big red one and a green, a blue on the red, a little gold box on the green. */
  giftpile(K, s, W, D, L) {
    gift(K, L, X(10), 0, -0.06, u(16), u(14), 0.5, RED, GOLD, { bow: false });
    gift(K, L, X(23.5), 0, 0.17, u(13), u(10), 0.4, GREEN, ICING, { bow: false, turn: 0.3 });
    gift(K, L, X(23), u(10), 0.17, u(8), u(7), u(8), GOLD, RED, { turn: 0.3 });
    gift(K, L, X(10.5), u(14), -0.06, u(11), u(10), 0.32, BLUEB, ICING, { turn: -0.2 });
  },

  /** A little steam engine and a wagon of presents on a length of track along a snowy plinth. */
  holidayexpress(K, s, W, D, L) {
    const { rbox, cyl, torus, lathe, THREE } = L, black = K.gloss(BLACK), gold = K.metal(GOLD), red = K.gloss(RED), green = K.gloss(GREEN);
    K.put(rbox(u(62), u(5), 0.72, 0.02), K.plain(SNOW), 0, u(3.5), 0);
    K.put(rbox(u(62.4), u(1.5), 0.73, 0.006), K.plain('#a8b8c8'), 0, u(0.75), 0);
    for (let i = 3; i < 62; i += 4) K.put(rbox(u(2), u(1), 0.3, 0.002), K.wood(DARKWOOD), X(i + 1, 2), u(6.5), 0);
    for (const z of [-0.08, 0.08]) K.put(rbox(u(62), u(1), u(0.8), 0.002), K.metal(TIN), 0, u(7.2), z);
    for (const wx of [9, 23, 36, 46, 55]) for (const z of [-0.1, 0.1]) {
      K.put(cyl(u(3.6), u(1.4), u(3.6), 12).rotateX(Math.PI / 2), black, X(wx, 2), u(11.2), z);
      K.put(cyl(u(1.4), u(1.6), u(1.4), 8).rotateX(Math.PI / 2), gold, X(wx, 2), u(11.2), z * 1.08);
    }
    // the wagon and its presents, the coupling
    K.put(rbox(u(24), u(4), 0.3, 0.008), green, X(16, 2), u(13), 0);
    gift(K, L, X(10.5, 2), u(15), 0, u(9), u(10), 0.2, RED, GOLD);
    gift(K, L, X(21, 2), u(15), 0.01, u(10), u(7), 0.22, BLUEB, ICING);
    K.put(cyl(u(0.7), u(4), u(0.7), 8).rotateZ(Math.PI / 2), black, X(30, 2), u(12), 0);
    // the engine: cab, boiler and its bands, smokebox, chimney, cowcatcher
    K.put(rbox(u(13), u(22), 0.32, 0.01), green, X(36.5, 2), u(21), 0);
    for (const z of [-0.162, 0.162]) K.put(rbox(u(7), u(6), u(0.4), 0.002), K.gloss(BULB), X(36.5, 2), u(26), z);
    K.put(rbox(u(15), u(3), 0.38, 0.01), black, X(36.5, 2), u(32.5), 0);
    K.put(cyl(u(7), u(15), u(7), 16).rotateZ(Math.PI / 2), red, X(49.5, 2), u(19), 0);
    for (const bx of [45, 51]) K.put(torus(u(7.1), u(0.6), TAU, 24).rotateY(Math.PI / 2), gold, X(bx, 2), u(19), 0);
    K.put(cyl(u(6.8), u(1.6), u(6.8), 16).rotateZ(Math.PI / 2), K.gloss(L.tone(RED, 0.74)), X(57.6, 2), u(19), 0);
    K.put(cyl(u(3), u(0.6), u(3), 12).rotateZ(Math.PI / 2), gold, X(58.6, 2), u(19), 0);
    K.put(lathe([[u(2.2), 0], [u(2.6), u(5.5)], [u(3.2), u(7.5)], [u(2.4), u(8)], [0.001, u(8)]], 12), black, X(53.5, 2), u(25.5), 0);
    K.put(torus(u(3), u(0.6), TAU, 12), gold, X(53.5, 2), u(33), 0, 0, Math.PI / 2);
    const cc = new THREE.Shape([[57, 12], [63.4, 7.6], [57, 7.6]].map(([a, h]) => new THREE.Vector2(X(a, 2), u(h))));
    K.put(new THREE.ExtrudeGeometry(cc, { depth: 0.26, bevelEnabled: false }).translate(0, 0, -0.13), black);
  },

  /** A fir garland swagged along the wall, warm lights in it, three stockings hung from it, a bow at each end. */
  stockinggarland(K, s, W, D, L) {
    const { THREE, ball } = L, sag = (i) => 22 + Math.sin(i / 64 * Math.PI) * 6, P = (px, py) => [WX(px, 2), WY(py)];
    for (const [sx, c, cuff] of [[12, RED, ICING], [32, GREEN, ICING], [52, RED, GREEN]]) {
      const y0 = sag(sx) + 2, sh = new THREE.Shape(), v = (a, b) => P(sx + a, y0 + b);
      sh.moveTo(...v(-5, 2)); sh.lineTo(...v(3, 2)); sh.lineTo(...v(3, 17)); sh.quadraticCurveTo(...v(9, 19), ...v(8, 24));
      sh.quadraticCurveTo(...v(7, 27.5), ...v(2, 27)); sh.lineTo(...v(-1, 27)); sh.quadraticCurveTo(...v(-5.5, 27), ...v(-5, 22)); sh.closePath();
      K.put(new THREE.ExtrudeGeometry(sh, { depth: u(2.6), bevelEnabled: true, bevelThickness: u(0.6), bevelSize: u(0.6), bevelSegments: 2, curveSegments: 6 }), K.cloth(c), 0, 0, u(1.2));
      for (const h of [10, 15, 20]) K.put(L.rbox(u(8), u(1.5), u(0.4), 0.002), K.cloth(L.tone(c, 1.25)), ...P(sx - 1, y0 + h + 0.75), u(4.5));
      K.put(L.blob(u(10), u(6), u(4.6), 0.4, 0.5, 14), K.cloth(cuff), ...P(sx - 1, y0 + 3), u(3));
      K.put(L.torus(u(1), u(0.3), TAU, 12), K.metal(GOLD), ...P(sx, y0 - 1), u(2.4));
    }
    const pts = []; for (let i = 0; i <= 12; i++) { const px = 5 + i * 4.5; pts.push([...P(px, sag(px)), u(3)]); }
    K.put(tubeG(L, pts, u(2.4), 40, 8), K.plain(L.tone(FIR, 0.74)));
    for (let i = 0, px = 5; px <= 59; px += 2.4, i++) K.put(ball(u(2.9), 8, 6), K.plain(i % 2 ? FIR : L.tone(FIR, 0.82)), ...P(px, sag(px) + (i % 3 - 1) * 0.6), u(3) + (i % 2 ? u(0.9) : -u(0.4)));
    for (let px = 7; px < 58; px += 6) K.put(ball(u(1.1), 6, 4), K.glow(BULB), ...P(px, sag(px) + 1.5), u(5.8));
    for (const ex of [6, 58]) bow(K, L, K.cloth(RED), ...P(ex, 22), u(5.6), u(4.6), 0, 1);
  },

  /** Delibird's sack: red, lumpy with presents, tied at the neck under a white fluffy cuff, gifts and a cane poking out. */
  delibirdsack(K, s, W, D, L) {
    const { lathe, torus } = L;
    const g = lathe([[0.001, 0], [u(8), u(0.4)], [u(12.4), u(6)], [u(13.5), u(15)], [u(12), u(25)], [u(7.5), u(31)], [u(4.6), u(35)], [u(4.6), u(37.5)], [u(6), u(39.5)], [0.001, u(39.5)]], 24), pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), f = 1 + 0.05 * Math.sin(3 * Math.atan2(z, x) + 1) * Math.sin(y * 9);
      pos.setXYZ(i, x * f, y, z * f * 0.88);
    }
    g.computeVertexNormals();
    K.put(g, K.cloth(RED));
    K.put(torus(u(4.9), u(0.8), TAU, 16), K.cloth(ICING), 0, u(36.6), 0, 0, Math.PI / 2);
    K.put(torus(u(6.9), u(2.8), TAU, 20), K.cloth(ICING), 0, u(41.6), 0, 0, Math.PI / 2);
    gift(K, L, X(10.5), u(41), -0.03, u(9), u(10), u(8), GREEN, GOLD, { bow: false, turn: 0.25 });
    gift(K, L, X(20.5), u(41), 0.04, u(9), u(8), u(8), BLUEB, ICING, { bow: false, turn: -0.3 });
    K.put(tubeG(L, [[X(23), u(41), 0.12], [X(23.6), u(52), 0.12], [X(24.6), u(57.5), 0.12], [X(26.6), u(59.4), 0.12], [X(28.6), u(57.4), 0.12], [X(29), u(55.5), 0.12]], u(1.3), 28, 8), K.pic(stripes(6)));
  },

  /** A nutcracker soldier on a plinth: boots and white trousers, a red coat with gold buttons and epaulettes, a white
      beard, a tall black hat with gold bands and a red plume, a sceptre at his side. */
  nutcracker(K, s, W, D, L) {
    const { cyl, lathe, torus, ball, rbox, THREE } = L, black = K.gloss(BLACK), red = K.gloss(RED), white = K.gloss(ICING), gold = K.metal(GOLD), skin = K.plain(SKIN);
    K.put(cyl(u(9), u(5), u(9.4), 20), black, 0, u(2.5), 0);
    K.put(torus(u(9.2), u(0.5), TAU, 24), gold, 0, u(2.6), 0, 0, Math.PI / 2);
    for (const lx of [13, 19]) {
      K.put(cyl(u(2), u(13), u(2), 12), white, X(lx), u(19.5), 0);
      K.put(cyl(u(2.4), u(8), u(2.4), 12), black, X(lx), u(9), 0);
      K.put(ball(u(2.4), 10, 6).scale(1, 0.6, 1.4), black, X(lx), u(5.8), u(1.2));
    }
    K.put(lathe([[0.001, u(25)], [u(6.6), u(25)], [u(7), u(28)], [u(6.6), u(38)], [u(7), u(45)], [u(5), u(46.5)], [0.001, u(46.5)]], 20), red);
    K.put(cyl(u(7.2), u(2.4), u(7.2), 20), white, 0, u(29.2), 0);
    K.put(rbox(u(2.4), u(3.2), u(1), 0.002), gold, 0, u(29.2), u(7.1));
    for (const h of [34, 38, 42]) K.put(ball(u(0.9), 8, 6), gold, 0, u(h), u(6.8));
    for (const sx of [-1, 1]) {
      K.put(cyl(u(1.6), u(15), u(1.6), 10), red, sx * u(8.5), u(37.5), 0);
      K.put(ball(u(1.8), 10, 8), white, sx * u(8.5), u(29.5), 0);
      K.put(cyl(u(2.8), u(1.4), u(2.8), 12), gold, sx * u(8.5), u(45.6), 0);
    }
    K.put(cyl(u(0.5), u(16), u(0.5), 8), gold, u(10), u(36), u(1.6));
    K.put(ball(u(1.6), 10, 8), gold, u(10), u(45), u(1.6));
    // the head: face, beard, moustache and mouth, eyes and rosy cheeks
    K.put(cyl(u(5), u(10), u(5), 16), skin, 0, u(51), 0);
    K.put(new THREE.CylinderGeometry(u(5.3), u(5.3), u(3), 12, 1, false, -Math.PI / 2, Math.PI), white, 0, u(47.6), 0);
    K.put(rbox(u(6), u(1), u(1), 0.002), white, 0, u(50.2), u(5));
    K.put(rbox(u(5), u(0.8), u(0.6), 0.002), K.plain('#a83a3a'), 0, u(49.3), u(5.2));
    K.put(ball(u(1), 8, 6), skin, 0, u(52), u(5.2));
    for (const sx of [-1, 1]) {
      K.put(ball(u(0.8), 8, 6), black, sx * u(2.5), u(53), u(4.7));
      K.put(ball(u(1.1), 8, 6).scale(1, 0.7, 0.4), K.plain('#f4a0a0'), sx * u(3.5), u(51.5), u(4.6));
    }
    // the hat
    K.put(cyl(u(6), u(16), u(6), 16), black, 0, u(64), 0);
    for (const h of [57.8, 70.6]) K.put(cyl(u(6.15), u(1.4), u(6.15), 16), gold, 0, u(h), 0);
    K.put(rbox(u(8), u(1), u(2.6), 0.002), black, 0, u(56.6), u(5.6));
    K.put(ball(u(2.2), 10, 8).scale(1, 1.6, 1), red, 0, u(75), 0);
  },

  /** A gingerbread house on a cake board: iced roof, gumdrops on its eaves, a red door, windows, candy-cane posts. */
  gingerhouse(K, s, W, D, L) {
    const { THREE, rbox, cyl, ball, lathe } = L, icing = K.plain(ICING), yellow = K.gloss(YELLOW);
    K.put(cyl(u(15), u(3), u(15), 24), K.plain('#d8dce4'), 0, u(1.5), 0);
    const wall = new THREE.Shape([[5, 3], [27, 3], [27, 21], [16, 33], [5, 21]].map(([a, h]) => new THREE.Vector2(X(a), u(h))));
    K.put(new THREE.ExtrudeGeometry(wall, { depth: 0.48, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 1 }).translate(0, 0, -0.24), K.plain(GINGER));
    for (const sx of [-1, 1]) {
      const len = Math.hypot(14, 16), ox = sx * 16 / len, oy = 14 / len;
      K.put(rbox(u(len + 1), u(3), 0.64, 0.012).rotateZ(Math.atan2(-16, sx * 14)), icing, X(16 + sx * 7) - ox * u(1.5), u(29) - oy * u(1.5), 0);
      for (let i = 0; i < 6; i++) {
        const f = (i + 0.5) / 6;
        K.put(lathe([[0.001, 0], [u(1.4), 0], [u(1.1), u(1.1)], [0.001, u(1.7)]], 10), K.gloss(PARTY[(i + (sx > 0 ? 2 : 0)) % 5]), X(16 + sx * (13 - f * 13)), u(22 + f * 14) + u(0.2), 0.3);
      }
    }
    K.put(rbox(u(6), u(10), u(1), 0.002), K.gloss(RED), 0, u(8), 0.25);
    K.put(ball(u(0.6), 8, 6), K.metal(GOLD), X(17.5), u(8), 0.27);
    for (const wx of [9, 23]) { K.put(rbox(u(4), u(4), u(0.8), 0.002), yellow, X(wx), u(15), 0.245); K.put(rbox(u(5), u(1), u(1.6), 0.002), icing, X(wx), u(13), 0.25); }
    for (const sx of [-1, 1]) K.put(rbox(u(0.8), u(4), u(4), 0.002), yellow, sx * (u(11) + 0.008), u(14), 0);
    K.put(rbox(u(5), u(5), u(0.8), 0.002), yellow, 0, u(24.5), 0.245);
    for (let i = 0; i < 11; i++) K.put(ball(u(0.8), 8, 6), icing, X(5.5 + i * 2), u(3.6), 0.25);
    for (const sx of [-1, 1]) K.put(tubeG(L, [[sx * u(13), u(3), 0.3], [sx * u(13), u(13), 0.3], [sx * u(12), u(15.6), 0.3], [sx * u(10.4), u(14.6), 0.3]], u(0.9), 14, 6), K.pic(stripes(4)));
  },

  /** Two great candy canes leaning in to an arch on mounds of snow, holly at their feet, a red bow where they meet. */
  candyarch(K, s, W, D, L) {
    const { THREE, ball } = L, cane = K.pic(stripes(14));
    for (const sx of [-1, 1]) {
      const fx = (a) => X(32 + sx * a, 2);
      K.put(tubeG(L, [[fx(23), 0, 0], [fx(23), u(22), 0], [fx(23), u(44), 0], [fx(21.2), u(54), 0], [fx(14), u(61), 0], [fx(4), u(63.6), 0]], u(3), 48, 10), cane);
      K.put(new THREE.SphereGeometry(1, 14, 5, 0, TAU, 0, Math.PI / 2).scale(u(6.5), u(3), u(6.5)), K.plain(SNOW), fx(23), 0, 0);
      for (const [a, t] of [[20, 0.5], [26, -0.5]]) K.put(leafGeo(L, u(2.8), u(1.4)).rotateZ(t * sx), K.gloss(GREEN), fx(a), u(4.6), 0.17);
      for (const a of [22, 24]) K.put(ball(u(1), 8, 6), K.gloss(RED), fx(a), u(5.6), 0.19);
    }
    bow(K, L, K.cloth(RED), 0, u(64), 0.03, u(7.6), 0, 1.6);
  },

  /** A fir wreath: pine cones, holly berries, gold baubles, warm lights twined round, a red velvet bow on top. */
  holidaywreath(K, s, W, D, L) {
    const { ball, torus } = L, cy = WY(40), at = (t, r) => [Math.cos(t) * u(r), cy - Math.sin(t) * u(r)];
    K.put(L.ball(u(1.2), 8, 6), K.metal(TIN), 0, WY(27), u(0.8));
    K.put(torus(u(10), u(2.8), TAU, 28), K.plain(L.tone(FIR, 0.8)), 0, cy, u(3));
    for (let a = 0; a < 20; a++) { const t = a / 20 * TAU, [x, y] = at(t, 10 + (a % 3) - 1); K.put(ball(u(3), 8, 6), K.plain(a % 2 ? FIR : L.tone(FIR, 0.78)), x, y, u(4) + (a % 2) * u(0.8)); }
    for (const t of [0.4, 2.0, 3.3, 4.6]) { const [x, y] = at(t, 10); K.put(L.lathe([[0.001, -u(2.6)], [u(1.4), -u(1.6)], [u(1.9), u(0.4)], [u(1.2), u(2)], [0.001, u(2.6)]], 8, true), K.plain('#7a5232'), x, y, u(6), 0, 0, t); }
    for (const t of [1.2, 2.7, 5.4]) for (const d of [-1, 1]) { const [x, y] = at(t, 10); K.put(ball(u(1.2), 6, 4), K.gloss(RED), x + d * u(1), y, u(6.6)); }
    for (const t of [0.9, 3.9, 6.0]) { const [x, y] = at(t, 10.5); K.put(ball(u(1.8), 10, 8), K.gloss(GOLD), x, y, u(6.2)); }
    for (let a = 0; a < 10; a++) { const [x, y] = at(a / 10 * TAU + 0.3, 12.5); K.put(ball(u(0.9), 6, 4), K.glow(BULB), x, y, u(4.4)); }
    bow(K, L, K.cloth(RED), 0, cy + u(11), u(6.6), u(7), 0, 1.4);
  },

  /** Stantler carved in wood, side on, on a snowy base: its legs and hooves, a pale ruff and muzzle, great curled
      antlers with their dark orbs. */
  stantlerfig(K, s, W, D, L) {
    const { blob, cyl, ball, rbox } = L, stag = K.wood(STAG), pale = K.wood(STAGL), orb = K.gloss('#2a2a3a'), hoof = K.gloss(BLACK);
    K.put(rbox(u(26), u(4), 0.7, 0.03), K.plain(SNOW), 0, u(2), 0);
    for (const [lx, z] of [[8.2, 1], [11.7, -1], [19.7, 1], [23.2, -1]]) {
      K.put(cyl(u(1.4), u(15), u(1.1), 10), K.wood(L.tone(STAG, z > 0 ? 1 : 0.8)), X(lx), u(13), z * u(2.6));
      K.put(cyl(u(1.3), u(2), u(1.5), 10), hoof, X(lx), u(5), z * u(2.6));
    }
    K.put(blob(u(20), u(13), u(10), 0.6, 0.6, 16), stag, X(15), u(24), 0);
    K.put(blob(u(14), u(5), u(8.6), 0.6, 0.6, 12), pale, X(15), u(20.6), 0);
    K.put(ball(u(2.6), 10, 8), pale, X(4.8), u(27), 0);
    K.put(tubeG(L, [[X(21), u(29), 0], [X(23.5), u(34), 0], [X(25), u(38.5), 0]], u(2.8), 10, 10), stag);
    K.put(blob(u(7.6), u(10), u(8), 0.6, 0.6, 12), pale, X(22.5), u(29.5), 0, 0, 0, -0.3);
    K.put(blob(u(8), u(6.4), u(6), 0.6, 0.6, 14), stag, X(25.2), u(40), 0, 0, 0, 0.15);
    K.put(blob(u(5), u(4), u(4), 0.6, 0.6, 12), pale, X(28.4), u(39), 0);
    K.put(ball(u(0.9), 8, 6), hoof, X(30.6), u(39.4), 0);
    for (const sz of [-1, 1]) {
      K.put(ball(u(0.8), 8, 6), hoof, X(25.8), u(41), sz * u(2.7));
      K.put(L.ball(1, 8, 6).scale(u(1.1), u(2.2), u(0.6)).rotateX(sz * 0.4).rotateZ(0.5), stag, X(22.4), u(43.4), sz * u(2.4));
    }
    for (const [sx, sz] of [[0, 1], [-3, -1]]) {
      const pts = [[24, 43], [21, 52], [22, 60], [27, 63], [29, 58]].map(([a, h], i) => [X(a + sx), u(h), sz * u(1.6 + i * 0.9)]);
      K.put(tubeG(L, pts, u(0.85), 24, 6), K.wood(ANTLER));
      K.put(tubeG(L, [[X(22 + sx), u(52), sz * u(2.5)], [X(19.5 + sx), u(54.4), sz * u(3)], [X(17 + sx), u(56), sz * u(3.4)]], u(0.65), 8, 6), K.wood(ANTLER));
      K.put(ball(u(1.8), 10, 8), orb, ...pts[4]);
      K.put(ball(u(1.6), 10, 8), orb, X(17 + sx), u(56), sz * u(3.4));
    }
  },

  /** A green iron lamp post dusted with snow, a red bow and holly tied on, its lantern lit warm. */
  snowlamp(K, s, W, D, L) {
    const { rbox, cyl, ball, blob } = L, iron = K.metal('#2a4a3a'), snow = K.plain(SNOW);
    K.put(rbox(u(12), u(8), u(12), 0.015), iron, 0, u(4), 0);
    K.put(blob(u(13), u(3), u(13), 0.5, 0.5, 14), snow, 0, u(8.2), 0);
    K.put(cyl(u(2), u(57), u(2.2), 12), iron, 0, u(36.5), 0);
    for (const h of [15, 61]) K.put(cyl(u(4), u(2), u(4), 12), iron, 0, u(h), 0);
    bow(K, L, K.cloth(RED), 0, u(40), u(2.4), u(4.8), 0, 1.2);
    for (const sx of [-1, 1]) K.put(leafGeo(L, u(2.8), u(1.4)).rotateZ(sx * 0.6), K.gloss(GREEN), sx * u(4), u(44), u(2.2));
    K.put(ball(u(1), 8, 6), K.gloss(RED), 0, u(44.5), u(2.8));
    // the lantern: its lit glass, iron corners, the roof under a cap of snow
    K.put(rbox(u(12), u(3), u(12), 0.008), iron, 0, u(65.5), 0);
    K.put(rbox(u(9.6), u(12), u(9.6), 0.006), K.glow(BULB), 0, u(73), 0);
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + Math.PI / 4; K.put(rbox(u(1.6), u(12.4), u(1.6), 0.002), iron, Math.sin(a) * u(7.07), u(73), Math.cos(a) * u(7.07)); }
    K.put(cyl(u(1), u(5.5), u(9.2), 4).rotateY(Math.PI / 4), iron, 0, u(81.8), 0);
    K.put(blob(u(14), u(4), u(14), 0.4, 0.6, 14), snow, 0, u(83), 0);
    K.put(ball(u(1.6), 8, 6), iron, 0, u(86.6), 0);
  },

  /** A round table laid for a visitor in a red cloth with a green band: cookies on a plate, a glass of milk, a carrot. */
  cookietable(K, s, W, D, L) {
    const { lathe, cyl, ball } = L, dark = K.wood(DARKWOOD);
    K.put(cyl(u(8), u(2), u(8.4), 16), dark, 0, u(1), 0);
    K.put(lathe([[u(2.4), u(2)], [u(1.8), u(6)], [u(2.6), u(10)], [u(1.6), u(14)], [u(2), u(28)], [0.001, u(28)]], 12), dark);
    const cl = lathe([[0.001, u(29.4)], [u(14.2), u(29.4)], [u(14.7), u(28.6)], [u(15.4), u(18.5)]], 30, true), pos = cl.attributes.position;
    for (let i = 0; i < pos.count; i++) if (pos.getY(i) < u(19)) pos.setY(i, pos.getY(i) - u(2.6) * Math.max(0, Math.cos(10 * Math.atan2(pos.getX(i), pos.getZ(i)))));
    cl.computeVertexNormals();
    K.put(cl, K.cloth(RED));
    K.put(cyl(u(15.4), u(1.6), u(15.45), 30, true), K.cloth(GREEN), 0, u(20.2), 0);
    K.put(lathe([[0.001, 0], [u(6), 0], [u(9), u(1.2)], [u(8.6), u(1.4)], [u(5.8), u(0.4)], [0.001, u(0.4)]], 20), K.gloss(ICING), X(12), u(29.4), -0.04);
    for (let i = 0; i < 4; i++) {
      const y = u(30.6 + i * 1.6), dx = u((i % 2) * 0.6 - 0.3);
      K.put(cyl(u(5.4), u(1.2), u(5.4), 14), K.plain('#c88a48'), X(12) + dx, y, -0.04);
      for (const t of [0.4, 1.4, 2.6]) K.put(ball(u(0.5), 8, 6), K.plain('#4a2a18'), X(12) + dx + Math.sin(t + i) * u(4.6), y + u(0.6), -0.04 + Math.cos(t + i) * u(4.6));
    }
    K.put(lathe([[0.001, 0], [u(2.5), 0], [u(2.7), u(12)], [u(2.4), u(12)], [u(2.2), u(0.6)], [0.001, u(0.6)]], 14), K.glass(), X(24.5), u(29.4), 0.06);
    K.put(cyl(u(2.2), u(8.5), u(2.3), 12), K.gloss(WHITE), X(24.5), u(34.3), 0.06);
    K.put(cyl(u(1.3), u(6), u(0.2), 8).rotateZ(Math.PI / 2 + 0.35), K.gloss('#f89a48'), X(5.4), u(31.6), 0.12);
    for (const t of [-0.3, 0.4]) K.put(leafGeo(L, u(1.8), u(0.6)).rotateZ(t), K.gloss(GREEN), X(9.4), u(33.4), 0.12);
  },

  /** A red lacquered music box with gold trim and a holly plaque, its crank at the side; a little fir on top turns as
      it plays (one spinning part, js/base-play.js). */
  holidaymusicbox(K, s, W, D, L) {
    const { THREE, rbox, cyl, ball, lathe } = L, gold = K.metal(GOLD);
    for (const fx of [7.5, 25.5]) for (const z of [-0.22, 0.22]) K.put(cyl(u(1.5), u(2), u(1.2), 10), gold, X(fx), u(1), z);
    K.put(rbox(u(22), u(14), 0.56, 0.012), K.gloss(RED), 0, u(9), 0);
    K.put(rbox(u(24), u(3), 0.62, 0.012), K.gloss(L.tone(RED, 0.74)), 0, u(16.5), 0);
    for (const h of [3.6, 14.6]) K.put(rbox(u(22.4), u(0.8), 0.565, 0.002), gold, 0, u(h), 0);
    K.put(rbox(u(12), u(7), u(0.6), 0.002), K.gloss(ICING), 0, u(9.5), 0.283);
    for (const f of [-1, 1]) K.put(leafGeo(L, u(2.4), u(1.2)).rotateZ(f * 0.6), K.gloss(GREEN), f * u(2.4), u(9.5), 0.3);
    K.put(ball(u(1.1), 8, 6), K.gloss(RED), 0, u(10), 0.31);
    K.put(cyl(u(0.6), u(3), u(0.6), 8).rotateZ(Math.PI / 2), gold, X(28.5), u(9.4), 0);
    K.put(rbox(u(1.2), u(4.4), u(1.2), 0.002), gold, X(29.6), u(11), 0);
    K.put(ball(u(1.2), 8, 6), K.wood(DARKWOOD), X(29.6), u(13.6), u(1));
    // the turning part: a gold dais, three tiers of fir, baubles and a star
    const m = new THREE.MeshStandardMaterial({ map: L.canvasTex(cells(), false), roughness: 0.4, metalness: 0.15 });
    m.userData.kind = 'pic'; m.userData.pivot = { y: u(18), tilt: 0 };
    K.put(cell(cyl(u(8), u(1), u(8), 20), GOLD), m, 0, u(18.5), 0);
    for (const [b0, a0, half] of [[20, 30, 7], [27, 37, 5.2], [34, 42, 3.4]]) K.put(cell(lathe([[0.001, u(b0 + 1.4)], [u(half), u(b0)], [u(half * 0.45), u((b0 + a0) / 2)], [0.001, u(a0)]], 16), FIR), m);
    for (const [a, h, c, z] of [[12, 22.5, RED, 0.08], [20, 23.5, GOLD, 0.1], [16, 29, BLUEB, 0.14], [16, 24, BLUEB, -0.17], [12.5, 31, RED, -0.06]]) K.put(cell(ball(u(1), 8, 6), c), m, X(a), u(h), z);
    K.put(cell(ball(u(1.6), 8, 6), GOLD), m, 0, u(43.4), 0);
  },

  /* ---------- the birthday party ---------- */

  /** A round table in a pleated pink cloth, a two-tier cake on it piped with drips, five candles lit. */
  bdaycake(K, s, W, D, L) {
    const { cyl, ball, torus, rbox } = L, cake = K.plain(CAKE);
    skirt(K, L, K.cloth(PINK), u(13), u(15), u(26));
    K.put(torus(u(13.2), u(1.6), TAU, 32), K.cloth(L.tone(PINK, 1.2)), 0, u(25.4), 0, 0, Math.PI / 2);
    K.put(cyl(u(10), u(9.4), u(10), 24), cake, 0, u(30.7), 0);
    K.put(cyl(u(10.1), u(1), u(10.1), 24), K.gloss(PINK), 0, u(35.5), 0);
    for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; K.put(ball(u(1.2), 8, 6).scale(1, 1.6, 0.8), K.gloss(PINK), Math.sin(a) * u(10), u(34.4), Math.cos(a) * u(10), a); }
    K.put(cyl(u(6), u(7.4), u(6), 20), cake, 0, u(39.7), 0);
    K.put(cyl(u(6.1), u(0.8), u(6.1), 20), K.gloss(BLUE), 0, u(43.6), 0);
    for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; K.put(ball(u(1), 8, 6).scale(1, 1.5, 0.8), K.gloss(BLUE), Math.sin(a) * u(6), u(42.8), Math.cos(a) * u(6), a); }
    for (let i = 0; i < 5; i++) {
      const a = (i / 4 - 0.5) * 2.2, x = Math.sin(a) * u(4.6), z = Math.cos(a) * u(2.6);
      K.put(cyl(u(0.55), u(6), u(0.55), 8), K.gloss(PARTY[i]), x, u(47), z);
      K.put(ball(u(0.9), 8, 6).scale(1, 1.8, 1), K.glow(FLAME), x, u(51.8), z);
    }
    for (const [a, h, c] of [[9, 30, YELLOW], [15, 32, BLUE], [21, 29, MINT], [13, 40, PURPLE], [18, 39, YELLOW]]) {
      const x = X(a), r = h > 36 ? u(6.05) : u(10.05);
      K.put(rbox(u(1.4), u(0.6), u(0.4), 0.001), K.plain(c), x, u(h), Math.sqrt(Math.max(0, r * r - x * x)));
    }
  },

  /** An arch of balloons in five colours, three to a cluster, each foot weighted by a little present. */
  balloonarch(K, s, W, D, L) {
    const { ball } = L;
    for (let i = 0; i < 15; i++) {
      const t = i / 14 * Math.PI, cx = 32 - Math.cos(t) * 25, ch = 10 + Math.sin(t) * 54;
      for (const [dx, dy, j, z] of [[-2.4, 0, 0, -u(2.6)], [2.4, 0, 2, u(1.6)], [0, -2.4, 4, u(3.4)]]) {
        const px = cx + dx * Math.sin(t) + dy * Math.cos(t) * 0.4, ph = ch - (dy * Math.sin(t) + dx * Math.cos(t) * 0.4);
        K.put(ball(u(4), 10, 7).scale(1, 1.08, 1), K.gloss(PARTY[(i + j) % 5]), X(px, 2), u(ph), z);
      }
    }
    for (const [gx, c] of [[7, PINK], [57, BLUE]]) gift(K, L, X(gx, 2), 0, 0.02, u(10), u(9), u(10), c, ICING, { bow: false });
  },

  /** A stand of cone party hats on three round shelves, each hat striped round with a pompom on its point. */
  partyhats(K, s, W, D, L) {
    const { cyl, torus, lathe, ball } = L, stand = K.gloss(LILAC), rim = K.gloss('#c8b0e0');
    K.put(cyl(u(10), u(2), u(10.4), 20), stand, 0, u(1), 0);
    K.put(cyl(u(1), u(46), u(1), 10), K.gloss('#d8c8e8'), 0, u(25), 0);
    for (const [h, r] of [[6, 13], [26, 10], [44, 7]]) { K.put(cyl(u(r), u(1.2), u(r), 20), stand, 0, u(h), 0); K.put(torus(u(r), u(0.5), TAU, 20), rim, 0, u(h), 0, 0, Math.PI / 2); }
    const hat = (x, base, z, h, w, c, d) => {
      K.put(lathe([[0.001, 0], [u(w), 0], [0.001, u(h)]], 14), K.gloss(c), x, u(base), z);
      for (const f of [0.15, 0.45]) { const r0 = u(w) * (1 - f), r1 = u(w) * (1 - f - 1.2 / h); K.put(cyl(r1 + 0.003, u(1.2), r0 + 0.003, 14, true), K.gloss(d), x, u(base + h * f + 0.6), z); }
      K.put(ball(u(1.8), 8, 6), K.gloss(d), x, u(base + h), z);
    };
    hat(X(9), 6.6, 0, 15, 4.6, PINK, ICING); hat(X(23), 6.6, 0, 15, 4.6, BLUE, YELLOW); hat(0, 6.6, -0.24, 14, 4.4, MINT, PINK);
    hat(X(10.5), 26.6, 0.03, 12, 3.8, YELLOW, PINK); hat(X(21.5), 26.6, 0.03, 12, 3.8, MINT, ICING);
    hat(0, 44.6, 0, 12, 4, PURPLE, YELLOW);
  },

  /** Four presents stacked, each smaller and turned a little, a big bow on the top one. */
  presenttower(K, s, W, D, L) {
    gift(K, L, 0, 0, 0, u(28), u(16), 0.84, BLUE, YELLOW, { bow: false });
    gift(K, L, 0, u(16), 0, u(22), u(13), 0.66, PINK, ICING, { bow: false, turn: 0.14 });
    gift(K, L, 0, u(29), 0, u(16), u(10), 0.48, YELLOW, PINK, { bow: false, turn: -0.1 });
    gift(K, L, 0, u(39), 0, u(10), u(8), u(10), MINT, RED, { bow: false, turn: 0.18 });
    bow(K, L, K.gloss(RED), 0, u(49.5), 0, u(7.6), 0.18, 0);
  },

  /** Two twisted crêpe streamers swagged across the wall, tissue pompoms at the ends and the middle, two tassels. */
  streamers(K, s, W, D, L) {
    const { ball } = L;
    for (const [c, ph, z] of [[PINK, 0, u(2.2)], [BLUE, Math.PI, u(3.2)]]) {
      const pts = [];
      for (let i = 7; i <= 57; i += 3.125) pts.push([WX(i, 2), WY(19 + Math.sin((i - 7) / 50 * Math.PI) * 17 + Math.sin(i * 0.9 + ph) * 1.2), z]);
      K.put(ribbon(L, pts, u(3.6), u(0.5), 9, 96, 6), K.plain(c));
    }
    for (const [px, py, r, c] of [[7, 19, 5.5, YELLOW], [57, 19, 5.5, PURPLE], [32, 37, 6, MINT]]) {
      K.put(ball(u(r * 0.8), 12, 8), K.plain(c), WX(px, 2), WY(py), u(5));
      for (let a = 0; a < 10; a++) {
        const t = a / 10 * TAU, o = u(r * 0.55);
        K.put(ball(u(r * 0.42), 8, 6).scale(1, 1, 0.7), K.plain(L.tone(c, a % 2 ? 1.15 : 0.85)), WX(px, 2) + Math.cos(t) * o, WY(py) + Math.sin(t) * o, u(5) + u(r * 0.25));
      }
    }
    for (const [tx, c] of [[26, PINK], [38, BLUE]]) rod(K, L, K.plain(c), [WX(tx, 2), WY(38), u(4)], [WX(tx, 2), WY(50), u(4.4)], u(0.6));
  },

  /** Bunting on two strings across the wall: HAPPY above, BIRTHDAY below, a letter to a pennant. */
  bdaybanner(K, s, W, D, L) {
    const { THREE } = L;
    const row = (text, y0, sag, w) => {
      const n = text.length, x0 = 32 - n * w / 2, pts = [];
      for (let i = 0; i <= 16; i++) pts.push([WX(2 + i * 3.75, 2), WY(y0 + Math.sin(i / 16 * Math.PI) * sag), u(1.6)]);
      K.put(tubeG(L, pts, u(0.4), 32, 5), K.plain('#7a6a5a'));
      for (const e of [pts[0], pts[16]]) K.put(L.ball(u(1), 8, 6), K.metal(TIN), e[0], e[1], u(1.2));
      for (let i = 0; i < n; i++) {
        const cx = x0 + (i + 0.5) * w, y = y0 + Math.sin((cx - 2) / 60 * Math.PI) * sag, box = [cx - w / 2 + 0.4, y, cx + w / 2 - 0.4, y + 11];
        const sh = new THREE.Shape([[box[0], y], [box[2], y], [cx, y + 11]].map(([a, b]) => new THREE.Vector2(WX(a, 2), WY(b))));
        const g = new THREE.ExtrudeGeometry(sh, { depth: u(0.5), bevelEnabled: false });
        boxUV(g, box, 2);
        K.put(g, whole(K, L, g, box), 0, 0, u(1.1));
      }
    };
    row('HAPPY', 16, 3, 8);
    row('BIRTHDAY', 42, 4, 7);
  },

  /** A long table in a striped skirt: two jars of sweets, a cupcake stand and a jar of lollipops. */
  candybuffet(K, s, W, D, L) {
    const { rbox, cyl, lathe, ball, torus } = L, glass = K.glass(), white = K.gloss(WHITE);
    K.put(rbox(u(60), u(24), 0.8, 0.01), K.cloth(WHITE), 0, u(12), 0);
    for (let i = 4; i < 62; i += 6) K.put(rbox(u(3), u(23.4), u(0.3), 0.001), K.plain(PINK), X(i + 1.5, 2), u(12), 0.402);
    for (const sx of [-1, 1]) for (let z = -0.3; z < 0.35; z += 0.2) K.put(rbox(u(0.3), u(23.4), u(3), 0.001), K.plain(PINK), sx * u(30.05), u(12), z);
    K.put(rbox(u(62), u(1.5), 0.84, 0.002), K.cloth(L.tone(PINK, 0.74)), 0, u(26.2), 0);
    K.put(rbox(u(62), u(3), u(0.6), 0.002), K.cloth(L.tone(PINK, 0.74)), 0, u(24.5), 0.42);
    const jar = (cx, r, h, lid, sweets) => {
      K.put(lathe([[0.001, 0], [u(r), 0], [u(r), u(h - 1)], [u(r - 1), u(h)], [0.001, u(h)]], 16), glass, X(cx, 2), u(27), 0.05);
      K.put(cyl(u(r - 0.6), u(h * 0.62), u(r - 0.6), 16), K.plain(L.tone(sweets[0][3], 1.25)), X(cx, 2), u(27 + h * 0.31), 0.05);
      for (const [a, hh, z, c] of sweets) K.put(ball(u(1.8), 8, 6), K.gloss(c), X(a, 2), u(hh), 0.05 + z);
      K.put(cyl(u(r + 1), u(2.4), u(r + 1), 16), K.gloss(lid), X(cx, 2), u(27 + h + 1.2), 0.05);
    };
    jar(12, 6, 19, PINK, [[9, 30, 0.13, PINK], [13, 31, 0.15, YELLOW], [16, 30, 0.1, PINK], [11, 34, 0.14, MINT], [15, 35, 0.13, PINK], [9, 38, 0.1, YELLOW], [13, 39, 0.14, PINK]]);
    K.put(ball(u(1.6), 8, 6), K.gloss(PINK), X(12, 2), u(49.2), 0.05);
    jar(27, 5, 13, BLUE, [[25, 30, 0.11, BLUE], [29, 30, 0.1, PURPLE], [27, 34, 0.12, BLUE], [24.5, 36, 0.08, PURPLE]]);
    // the cupcake stand
    K.put(cyl(u(1), u(14), u(1), 8), K.gloss(LILAC), X(42, 2), u(34), 0);
    for (const [h, r] of [[28, 7], [40.4, 5]]) K.put(cyl(u(r), u(0.8), u(r), 20), K.gloss(LILAC), X(42, 2), u(h), 0);
    const cupcake = (a, h, z, c) => {
      K.put(cyl(u(2.4), u(3), u(1.8), 12), K.plain('#c8a0d0'), X(a, 2), u(h + 1.5), z);
      K.put(lathe([[u(2.7), 0], [u(2.2), u(1.4)], [u(1.2), u(2.6)], [0.001, u(3.4)]], 12), K.gloss(c), X(a, 2), u(h + 3), z);
    };
    cupcake(37.5, 28.4, 0, PINK); cupcake(46.5, 28.4, 0, MINT); cupcake(42, 28.4, -0.13, YELLOW); cupcake(42, 28.4, 0.13, BLUE); cupcake(42, 40.8, 0, YELLOW);
    // the lollipop jar
    K.put(lathe([[0.001, 0], [u(4.5), 0], [u(4.5), u(11)], [0.001, u(11)]], 14), glass, X(55.5, 2), u(27), 0.05);
    for (const [a, h, c, t] of [[52, 52, PINK, 0.2], [56, 55, YELLOW, 0], [59, 50, BLUE, -0.25], [55, 47, MINT, 0.1]]) {
      rod(K, L, white, [X(55.5, 2), u(28), 0.05], [X(a + 0.6, 2), u(h), 0.05], u(0.45));
      K.put(cyl(u(3), u(0.8), u(3), 16).rotateX(Math.PI / 2), K.gloss(c), X(a + 0.6, 2), u(h), 0.05, 0, 0, t);
      K.put(torus(u(1.6), u(0.3), TAU, 12), white, X(a + 0.6, 2), u(h), 0.05 + u(0.45));
    }
  },

  /** A giant party popper on a stand, tipped up: a gold cone striped pink, its pull string, streamers and confetti
      bursting from its mouth. */
  partypopper(K, s, W, D, L) {
    const { cyl, lathe, rbox, torus } = L, tilt = (g) => g.rotateZ(-0.132).translate(X(15), u(14), 0);
    K.put(cyl(u(9), u(4), u(9.4), 20), K.gloss(PURPLE), 0, u(2), 0);
    K.put(cyl(u(1.1), u(10), u(1.1), 10), K.gloss(L.tone(PURPLE, 0.74)), X(16), u(9), 0);
    K.put(tilt(lathe([[u(1.6), 0], [u(2.2), u(1)], [u(7.2), u(30.5)], [u(6.6), u(30.5)], [u(1.2), u(1.6)]], 16)), K.gloss(GOLD));
    K.put(tilt(cyl(u(6.5), u(0.4), u(6.5), 16).translate(0, u(29.6), 0)), K.plain(L.tone(GOLD, 0.6)));
    for (const f of [0.35, 0.65]) { const r = u(2.2 + 5 * f); K.put(tilt(torus(r + u(0.15), u(0.5), TAU, 16).rotateX(Math.PI / 2).translate(0, u(1 + 29.5 * f), 0)), K.gloss(PINK)); }
    K.put(tilt(L.ball(u(1.8), 10, 6).translate(0, u(0.4), 0)), K.gloss(GOLD));
    K.put(tubeG(L, [[X(14.2), u(13.4), 0], [X(11.5), u(10), 0.03], [X(9.5), u(8.4), 0.06], [X(8), u(9), 0.06]], u(0.35), 10, 5), K.plain(WHITE));
    for (const [c, pts] of [[PINK, [[17, 45, 0], [14, 54, 0.05], [17, 60, 0.02], [13, 66, -0.03]]], [BLUE, [[21, 46, 0], [24, 56, -0.04], [21, 62, 0], [25, 68, 0.04]]], [MINT, [[19, 46, 0.02], [19, 58, 0.08], [22, 64, 0.06]]]])
      K.put(tubeG(L, pts.map(([a, h, z]) => [X(a), u(h), z]), u(0.7), 20, 5), K.plain(c));
    for (const [a, h, c, z] of [[11, 53, YELLOW, 0.05], [28, 53, PINK, -0.04], [13, 61, BLUE, -0.06], [27, 62, MINT, 0.07], [19, 71, PURPLE, 0]])
      K.put(rbox(u(1.8), u(1.8), u(0.3), 0.001), K.plain(c), X(a + 0.9), u(h - 0.9), z, a * 0.7, h * 0.3);
  },

  /** A bubble machine on four feet: a fan grille, a wand wheel turning through its dish of soap, bubbles rising. */
  bubblemachine(K, s, W, D, L) {
    const { rbox, cyl, torus, ball } = L, yellow = K.gloss(YELLOW), z0 = 0.275;
    for (const fx of [7.5, 24.5]) for (const z of [-0.18, 0.18]) K.put(cyl(u(1.5), u(4), u(1.8), 10), K.gloss(BLACK), X(fx), u(2), z);
    K.put(rbox(u(24), u(20), 0.55, 0.04), K.gloss(BLUE), 0, u(14), 0);
    K.put(rbox(u(24.4), u(2), 0.56, 0.008), yellow, 0, u(23), 0);
    K.put(cyl(u(5.5), u(0.6), u(5.5), 20).rotateX(Math.PI / 2), K.plain(L.tone(BLUE, 0.6)), X(11), u(15), z0);
    for (let i = -4; i <= 4; i += 2) K.put(rbox(u(0.7), u(2 * Math.sqrt(30 - i * i)), u(0.6), 0.001), K.gloss(L.tone(BLUE, 0.45)), X(11 + i), u(15), z0 + 0.012);
    K.put(torus(u(5.5), u(0.5), TAU, 20), K.gloss(L.tone(BLUE, 0.8)), X(11), u(15), z0 + 0.01);
    K.put(ball(u(1.4), 8, 6), yellow, X(11), u(15), z0 + 0.02);
    K.put(rbox(u(9), u(3), u(5), 0.008), K.gloss(PINK), X(22.5), u(7.5), z0 + 0.06);
    K.put(torus(u(4.6), u(0.6), TAU, 20), yellow, X(22.5), u(15), z0 + 0.1);
    for (let a = 0; a < 6; a++) K.put(torus(u(1), u(0.35), TAU, 10), yellow, X(22.5) + Math.cos(a) * u(3), u(15) + Math.sin(a) * u(3), z0 + 0.1);
    K.put(cyl(u(1), 0.1, u(1), 8).rotateX(Math.PI / 2), yellow, X(22.5), u(15), z0 + 0.05);
    for (const [a, h, r, z] of [[20, 32, 3, 0.15], [26, 40, 2.4, 0.05], [14, 44, 3.4, -0.05], [22, 52, 2, 0.1], [9, 34, 2.2, 0.08], [17, 58, 2.6, -0.02]])
      K.put(ball(u(r), 12, 8), K.glass(), X(a), u(h), z);
  },

  /** A stubby cannon on a four-wheeled carriage, aimed high: its barrel striped gold, confetti in its mouth. */
  confetticannon(K, s, W, D, L) {
    const { THREE, lathe, cyl, torus, rbox, ball } = L, gold = K.metal(GOLD), aim = (g) => g.rotateZ(-0.72).translate(X(13), u(16), 0);
    const car = new THREE.Shape([[4, 6], [26, 6], [22, 16], [8, 16]].map(([a, h]) => new THREE.Vector2(X(a), u(h))));
    K.put(new THREE.ExtrudeGeometry(car, { depth: 0.34, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 1 }).translate(0, 0, -0.17), K.gloss(PINK));
    for (const wx of [7, 25]) {
      K.put(cyl(u(1), 0.56, u(1), 8).rotateX(Math.PI / 2), gold, X(wx), u(7), 0);
      for (const z of [-0.24, 0.24]) {
        K.put(torus(u(5.5), u(1), TAU, 20), gold, X(wx), u(7), z);
        K.put(cyl(u(4.6), u(1), u(4.6), 16).rotateX(Math.PI / 2), K.metal(L.tone(GOLD, 0.74)), X(wx), u(7), z);
        K.put(cyl(u(1.6), u(1.6), u(1.6), 10).rotateX(Math.PI / 2), K.gloss(PINK), X(wx), u(7), z * 1.05);
      }
    }
    K.put(aim(lathe([[0.001, -u(5)], [u(3.6), -u(4.4)], [u(5), -u(2.4)], [u(5), u(17)], [0.001, u(17)]], 16)), K.gloss(PURPLE));
    for (const t of [1, 8, 14]) K.put(aim(cyl(u(5.3), u(2.4), u(5.3), 16).translate(0, u(t + 1.2), 0)), gold);
    K.put(aim(lathe([[u(5.2), 0], [u(6), u(0.6)], [u(6), u(3)], [u(5), u(3)], [u(4.4), u(1)]], 16).translate(0, u(17), 0)), K.gloss(L.tone(PURPLE, 0.74)));
    K.put(aim(cyl(u(4.6), u(0.4), u(4.6), 14).translate(0, u(18.6), 0)), K.plain('#3a2a4a'));
    for (const [dx, dz, c] of [[-2, 1, PINK], [1.5, -1.5, YELLOW], [0, 2.4, MINT], [2.4, 1, BLUE]]) K.put(aim(rbox(u(1.6), u(0.3), u(1.6), 0.001).rotateY(dx).translate(u(dx), u(19), u(dz))), K.plain(c));
    for (const [a, h, c, z] of [[27, 37, PINK, 0.05], [22, 41, YELLOW, -0.05], [29, 43, MINT, 0], [25, 47, BLUE, 0.08], [19, 38, MINT, -0.08]])
      K.put(rbox(u(2), u(2), u(0.3), 0.001), K.plain(c), X(a), u(h - 1), z, a, h * 0.4);
  },

  /** A wrapping table: three rolls of paper on a rack behind, a box half wrapped, its sheet folding off, ribbon spools
      and scissors. */
  wraptable(K, s, W, D, L) {
    const { rbox, cyl, torus, THREE } = L, tin = K.metal(TIN), post = K.gloss('#d8d0c8');
    K.put(rbox(u(60), u(4), 0.8, 0.012), K.wood('#d8b080'), 0, u(28), 0);
    for (const lx of [7, 57]) for (const z of [-0.3, 0.3]) K.put(cyl(u(2), u(26), u(1.7), 12), K.wood(OAK), X(lx, 2), u(13), z);
    for (const lx of [7, 57]) K.put(rbox(u(1.6), u(1.6), 0.6, 0.002), K.wood(OAK), X(lx, 2), u(8), 0);
    // the rack and its rolls (one picture, a band of it each)
    for (const px of [5.2, 59.2]) K.put(rbox(u(2.4), u(30), u(2.4), 0.006), post, X(px, 2), u(44), -0.32);
    K.put(cyl(u(0.8), u(56), u(0.8), 8).rotateZ(Math.PI / 2), tin, 0, u(52.2), -0.32);
    [16, 32, 48].forEach((cx, i) => {
      const g = new THREE.CylinderGeometry(u(4.5), u(4.5), u(14), 16, 1), uv = g.attributes.uv;
      for (let k = 0; k < uv.count; k++) uv.setY(k, (2 - i + uv.getY(k)) / 3);
      K.put(g.rotateZ(Math.PI / 2), K.pic(papers()), X(cx, 2), u(52.5), -0.32);
    });
    gift(K, L, X(29, 2), u(30), 0.05, u(14), u(11), 0.34, MINT, PINK, { bow: false });
    K.put(rbox(u(12.8), u(0.3), 0.36, 0.001).rotateZ(-0.896), K.plain('#f8a8c8'), X(40, 2), u(35.6), 0.05);
    for (const [cx, c] of [[10, RED], [16, PURPLE]]) {
      K.put(cyl(u(2.4), u(3.4), u(2.4), 12), K.gloss(c), X(cx, 2), u(32), 0.2);
      for (const h of [30.3, 33.7]) K.put(cyl(u(2.8), u(0.5), u(2.8), 12), K.gloss(WHITE), X(cx, 2), u(h), 0.2);
    }
    for (const t of [0.2, -0.2]) K.put(rbox(u(8), u(0.4), u(1), 0.001).rotateY(t), tin, X(52, 2), u(30.3), 0.22);
    for (const dz of [-0.03, 0.03]) K.put(torus(u(1.4), u(0.4), TAU, 10).rotateX(Math.PI / 2), K.gloss(RED), X(47, 2), u(30.4), 0.22 + dz);
  },

  /** A porcelain cake stand, a blue cake piped white round its top and foot, a big pink number one candle lit on it. */
  numbercake(K, s, W, D, L) {
    const { THREE, lathe, cyl, ball, rbox } = L, white = K.gloss(WHITE);
    K.put(lathe([[0.001, 0], [u(8), 0], [u(7.4), u(1.4)], [u(2.2), u(3)], [u(2), u(17)], [u(5), u(18)], [u(13), u(18.4)], [u(13), u(19.4)], [0.001, u(19.4)]], 24), K.gloss('#eceaf4'));
    K.put(cyl(u(10), u(14), u(10), 24), K.plain(BLUE), 0, u(26.4), 0);
    for (const h of [20.4, 32.6]) for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; K.put(ball(u(1.1), 8, 6), white, Math.sin(a) * u(10), u(h), Math.cos(a) * u(10)); }
    const one = new THREE.Shape([[14, 33], [19, 33], [19, 50], [16.5, 50], [12.5, 46], [13.5, 44.5], [14, 45]].map(([a, h]) => new THREE.Vector2(X(a), u(h))));
    K.put(new THREE.ExtrudeGeometry(one, { depth: u(2.4), bevelEnabled: true, bevelThickness: u(0.4), bevelSize: u(0.4), bevelSegments: 1 }).translate(0, 0, -u(1.2)), K.gloss(PINK));
    K.put(rbox(u(8), u(1.6), u(3.4), 0.002), K.gloss(PINK), X(16.5), u(33.6), 0);
    for (const h of [37, 41, 45]) K.put(rbox(u(5.6), u(0.8), u(3.6), 0.002), white, X(16.5), u(h), 0);
    K.put(cyl(u(0.3), u(2), u(0.3), 6), K.plain(BLACK), X(17.3), u(51), 0);
    K.put(ball(u(1.2), 8, 6).scale(1, 1.8, 1), K.glow(FLAME), X(17.3), u(54), 0);
  },

  /** A glass punch bowl of pink punch on a pedestal, on a mint-clothed table: fruit floating, a ladle, two cups. */
  punchbowl(K, s, W, D, L) {
    const { lathe, cyl, torus, ball } = L, glass = K.glass(), punch = K.gloss('#f87aa0');
    skirt(K, L, K.cloth(MINT), u(13), u(15), u(24));
    K.put(torus(u(13.2), u(1.6), TAU, 32), K.cloth(L.tone(MINT, 1.2)), 0, u(23.4), 0, 0, Math.PI / 2);
    K.put(lathe([[u(4), 0], [u(2), u(1.5)], [u(1.6), u(3)], [u(3), u(4)]], 16), glass, 0, u(24), 0);
    const bowl = [], fill = [[0.001, 0]];
    for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI / 2; bowl.push([u(12) * Math.sin(a) + 0.001, u(10) * (1 - Math.cos(a))]); }
    for (let i = 1; i <= 5; i++) { const a = i / 6 * Math.PI / 2; fill.push([u(11) * Math.sin(a), u(1) + u(9) * (1 - Math.cos(a))]); }
    fill.push([0.001, u(1) + u(9) * (1 - Math.cos(5 / 12 * Math.PI))]);
    K.put(lathe(bowl, 20), glass, 0, u(28), 0);
    K.put(lathe(fill, 20), punch, 0, u(28), 0);
    K.put(torus(u(12), u(0.6), TAU, 24), glass, 0, u(38), 0, 0, Math.PI / 2);
    for (const [a, c, z] of [[11, '#f89a48', 0.08], [19, YELLOW, -0.06]]) K.put(cyl(u(1.6), u(0.4), u(1.6), 12), K.gloss(c), X(a), u(36.9), z);
    rod(K, L, K.metal(TIN), [X(21), u(36), 0.04], [X(25), u(52), -0.04], u(0.5));
    K.put(cyl(u(1.4), u(1.6), u(1.4), 8).rotateZ(Math.PI / 2), K.metal(TIN), X(25.6), u(52.6), -0.04);
    for (const cx of [4.5, 27.5]) {
      K.put(lathe([[0.001, 0], [u(1.6), 0], [u(2), u(4)], [u(1.7), u(4)], [u(1.4), u(0.4)], [0.001, u(0.4)]], 12), glass, X(cx), u(37), 0.14);
      K.put(cyl(u(1.5), u(2.6), u(1.7), 12), punch, X(cx), u(38.6), 0.14);
      K.put(torus(u(1.2), u(0.3), Math.PI, 8).rotateZ(cx < 16 ? Math.PI / 2 : -Math.PI / 2), glass, X(cx) + (cx < 16 ? -u(1.9) : u(1.9)), u(39), 0.14);
    }
  },
};
