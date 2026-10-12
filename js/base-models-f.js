/* base-models-f.js  -  Hot Spring, Arcade and Greenhouse pieces, modelled from parts like the arcade
   cabinets (the user's ask, 2026-10-12: "I want my furniture as clean as these cabinets"; a table tennis table, a milk
   cooler and a potting bench looked nothing like themselves, carved from their paintings).

   How a batch works (js/base-models-a.js to -k.js, one per run of shelves):
   - `SHAPES` maps a line of kind ids ('a b c') to a shape `{ make, ...options }`, read by js/base-shapes.js. A kind with
     a shape is built by its `make` instead of being carved from its painting. `seat` (the height in tiles a Pokémon sits
     at) and `top` (the height of a top small pieces can stand on) matter to the room's rules; leave them out otherwise.
   - `MAKES` holds the builders: `make(K, s, W, D, L)`, the piece W x D tiles, its feet at y 0, its middle at x, z 0, its
     front facing +z, sizes in tiles. `K.put(geometry, material, x, y, z, turnY, tiltX, tiltZ)` places a part (parts
     sharing a material are merged). Materials come in the piece's theme: `K.wood()`, `K.cloth()`, `K.metal()` default to
     the palette (`K.pal`: w wood, c colour, a accent, p pale, m metal, g glow, leaf, pot), and `K.wood(hex)`,
     `K.cloth(hex)`, `K.plain(hex)`, `K.gloss(hex)`, `K.metal(hex)`, `K.glow(hex)` (lit, switched by a lamp's tap) and
     `K.glass()` take a colour. `K.pic(canvas)` wears a picture; `L.litPic(canvas, k)` a lit one (a screen), `L.decal(c)`
     a cut-out sticker. `L` is js/base-mesh.js's kit: `L.THREE`, `rbox(w, h, d, r)` (a rounded box), `blob(w, h, d, e,
     ev)` (a cushion-like superellipsoid), `cyl(rTop, h, rBottom, seg)`, `ball(r)`, `lathe([[r, y]...])`, `torus(R, r,
     arc)`, `heart`, `profileSlab([[z, y]...], t, x0)` (a side profile extruded across x), `tone(hex, f)` (darker under 1,
     lighter over), `mix(a, b, f)`, `leg`, `legsAt`, `pot(K, r, h)`, `leafAt(K, m, y, a, tilt, len, wid)`, `canvasTex`,
     `rng`. `K.r()` is the piece's own seeded random.
   - Palette colours keep every theme and reskin working: use them for what the painting paints in them.
   Most builders past the pilot follow their painting (js/base-furniture-rooms5.js) pixel for pixel: `u(n)` is n of its
   32 pixels a tile, `X(n, W)` a pixel across the painting as x from the middle. Left as they were: the rugs, the wall
   pieces, the frontboxes, the seats and tables already shaped, the gumball machine (a true sphere) and the Game Corner's
   games (modelled in js/base-mesh.js). */

import { tube, rod, crop, outline, pokeBall } from './base-models-kit.js';
import { bush, flower, potOf, leaf, column } from './base-models-b.js';

const u = (n) => n / 32;
const X = (n, W = 1) => n / 32 - W / 2;
const BAMBOO = '#a8c060', HINOKI = '#e0b880', STONE = '#9a9aa6', SPRING = '#58b8b0', WATER = '#58b0e0', CHROME = '#c8ccd8',
  INK = '#303038', GOLD = '#f0c040', MARQUEE = '#fff4c0', MARBLE = '#ece8e0', SOIL = '#4a3020';

/** A canvas `w` x `h`, drawn by `draw(g)`; its materials are cached on it. */
const sheet = (w, h, draw) => { const c = new OffscreenCanvas(w, h); draw(c.getContext('2d'), w, h); return c; };
const pics = {};
const once = (key, make) => pics[key] || (pics[key] = make());

/* the milk cooler's header: a milk bottle and MILK on the theme's colour */
const milkSign = (col) => once('milk' + col, () => sheet(256, 72, (g, w, h) => {
  g.fillStyle = col; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(0, 0, w, 10);
  g.fillStyle = '#ffffff';
  g.beginPath(); g.roundRect(30, 18, 22, 44, 6); g.fill(); g.fillRect(36, 10, 10, 10);
  g.fillStyle = col; g.fillRect(34, 30, 14, 4);
  g.font = 'bold 40px system-ui, sans-serif'; g.textBaseline = 'middle'; g.fillStyle = '#ffffff';
  g.fillText('MILK', 70, h / 2 + 2);
}));

/* the table tennis top: green, white edges and a centre line */
const tennisTop = () => once('tt', () => sheet(512, 256, (g, w, h) => {
  g.fillStyle = '#2f7d5e'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#f6f6f2'; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10);
  g.lineWidth = 4; g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();
}));
const netMesh = () => once('net', () => sheet(256, 32, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  g.strokeStyle = 'rgba(30,30,36,0.9)'; g.lineWidth = 1.2;
  for (let x = 0; x <= w; x += 6) { g.beginPath(); g.moveTo(x, 6); g.lineTo(x, h); g.stroke(); }
  for (let y = 6; y <= h; y += 6) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, 6);
}));

/* the air hockey table's top: white, a field of air holes, red and blue halves' lines and a centre circle */
const hockeyTop = () => once('hockey', () => sheet(512, 256, (g, w, h) => {
  g.fillStyle = '#f4f8fc'; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(80,120,170,0.35)';
  for (let y = 8; y < h; y += 12) for (let x = 8 + ((y / 12) % 2) * 6; x < w; x += 12) { g.beginPath(); g.arc(x, y, 1.6, 0, Math.PI * 2); g.fill(); }
  g.lineWidth = 5;
  g.strokeStyle = '#d83a3a'; g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.stroke();
  g.beginPath(); g.arc(w / 2, h / 2, 34, 0, Math.PI * 2); g.stroke();
  g.strokeStyle = '#3a6ad8'; for (const x of [w * 0.2, w * 0.8]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
  for (const [x, a0, a1] of [[0, -Math.PI / 2, Math.PI / 2], [w, Math.PI / 2, Math.PI * 1.5]]) { g.strokeStyle = '#d83a3a'; g.beginPath(); g.arc(x, h / 2, 46, a0, a1); g.stroke(); }
}));
const scoreBoard = () => once('score', () => sheet(256, 72, (g, w, h) => {
  g.fillStyle = '#16161c'; g.fillRect(0, 0, w, h);
  g.font = 'bold 50px monospace'; g.textBaseline = 'middle'; g.textAlign = 'center';
  g.fillStyle = '#ff4a3a'; g.fillText('07', 64, h / 2 + 3);
  g.fillStyle = '#4a8aff'; g.fillText('05', 192, h / 2 + 3);
  g.fillStyle = '#ffd84a'; g.fillRect(124, 22, 8, 8); g.fillRect(124, 42, 8, 8);
}));

/** A milk bottle on a shelf: milk, a glass shoulder, a cap. */
function bottle(K, L, x, y, z, milk, cap) {
  K.put(L.lathe([[0.03, 0], [0.034, 0.01], [0.034, 0.09], [0.022, 0.12], [0.016, 0.135], [0, 0.135]], 14), K.gloss(milk), x, y, z);
  K.put(L.cyl(0.018, 0.014, 0.018, 12), K.gloss(cap), x, y + 0.14, z);
}

/** A crop of the front painting by its own pixels: x0 to x1 across, `top` to `bot` up from the floor. */
function pcrop(K, L, x0, top, x1, bot) {
  const o = outline(K), fx = (x) => (x - o.x0) / (o.x1 - o.x0), fy = (n) => (o.h - n - o.y0) / (o.y1 - o.y0);
  return crop(K, L, [fx(x0), fy(top), fx(x1), fy(bot)]);
}

/** A stone `w` x `h` x `d` across, lumpy but whole: a ball pushed in and out by a few waves of its own. */
function rock(L, R, w, h, d) {
  const g = L.ball(1, 16, 12), pos = g.attributes.position, ph = [R() * 6, R() * 6, R() * 6, R() * 6];
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const f = 1 + 0.1 * Math.sin(x * 3.1 + ph[0]) * Math.sin(z * 2.7 + ph[1]) + 0.07 * Math.sin(y * 4.3 + ph[2]) + 0.05 * Math.sin((x + z) * 5 + ph[3]);
    pos.setXYZ(i, x * f * w, Math.max(y * f, -0.55) * h, z * f * d);
  }
  g.computeVertexNormals();
  return g;
}

/** An upright bamboo cane from y0 up h, r across, a darker node ring every so often. */
function cane(K, L, x, y0, z, h, r) {
  const node = K.gloss(L.tone(BAMBOO, 0.78));
  K.put(L.cyl(r, h, r, 14), K.gloss(BAMBOO), x, y0 + h / 2, z);
  for (let y = 0.17; y < h - 0.05; y += 0.21) K.put(L.torus(r * 1.02, r * 0.2, Math.PI * 2, 14), node, x, y0 + y, z, 0, Math.PI / 2);
}

/** A hinoki tub r across and h tall, standing at x, y, z: staves, two metal bands, its inside showing. */
function tub(K, L, x, y, z, r, h, band = K.metal()) {
  const { lathe, torus, rbox } = L, wood = K.wood(HINOKI), seam = K.plain(L.tone(HINOKI, 0.78));
  K.put(lathe([[0.001, 0], [r * 0.9, 0], [r, h], [r * 0.9, h], [r * 0.82, h * 0.15], [0.001, h * 0.15]], 28), wood, x, y, z);
  for (let i = 0; i < 14; i++) {
    const a = i / 14 * Math.PI * 2;
    K.put(rbox(0.006, h * 0.96, 0.004, 0.002).rotateZ(Math.atan2(r * 0.1, h)).translate(r * 0.95, h / 2, 0).rotateY(a), seam, x, y, z);
  }
  for (const f of [0.25, 0.75]) K.put(torus(r * (0.92 + f * 0.1) + 0.006, 0.008, Math.PI * 2, 28), band, x, y + h * f, z, 0, Math.PI / 2);
}


/* the store pinball's playfield: a dark field, three pop bumpers, lanes and two flippers in neon */
const pinField = (col) => once('pinf' + col, () => sheet(256, 384, (g, w, h) => {
  g.fillStyle = '#2a1840'; g.fillRect(0, 0, w, h);
  g.strokeStyle = col; g.lineWidth = 6; g.strokeRect(6, 6, w - 12, h - 12);
  g.strokeStyle = '#58f0f8'; g.lineWidth = 4;
  for (const x of [70, 128, 186]) { g.beginPath(); g.moveTo(x, 20); g.lineTo(x, 70); g.stroke(); }
  for (const [x, y, c] of [[80, 120, '#f858c8'], [176, 120, '#f8f058'], [128, 175, '#58f0f8']]) {
    g.fillStyle = c; g.beginPath(); g.arc(x, y, 24, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x, y, 9, 0, Math.PI * 2); g.fill();
  }
  g.fillStyle = '#f8a030';
  for (const [x, y] of [[40, 250], [216, 250], [60, 290], [196, 290]]) { g.beginPath(); g.arc(x, y, 7, 0, Math.PI * 2); g.fill(); }
  g.strokeStyle = '#ffffff'; g.lineWidth = 12; g.lineCap = 'round';
  g.beginPath(); g.moveTo(70, 330); g.lineTo(112, 352); g.stroke();
  g.beginPath(); g.moveTo(186, 330); g.lineTo(144, 352); g.stroke();
  g.fillStyle = '#d8dce4'; g.beginPath(); g.arc(150, 230, 8, 0, Math.PI * 2); g.fill();
}));

/* a hoop's or cage's netting: white cord in diamonds, see-through between */
const cageNet = () => once('cagenet', () => sheet(128, 256, (g, w, h) => {
  g.clearRect(0, 0, w, h); g.strokeStyle = 'rgba(236,240,246,0.95)'; g.lineWidth = 2;
  for (let k = -h; k < w + h; k += 16) {
    g.beginPath(); g.moveTo(k, 0); g.lineTo(k + h, h); g.stroke();
    g.beginPath(); g.moveTo(k, 0); g.lineTo(k - h, h); g.stroke();
  }
}));

/* the racer's livery on the cabinet's side: the theme's colour, a chequered band and a stripe */
const racerSide = (col) => once('racer' + col, () => sheet(256, 512, (g, w, h) => {
  g.fillStyle = col; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,0.85)'; g.fillRect(0, h * 0.62, w, 26);
  for (let i = 0; i < w / 16; i++) for (let j = 0; j < 3; j++) { g.fillStyle = (i + j) % 2 ? '#ffffff' : '#202028'; g.fillRect(i * 16, h * 0.72 + j * 16, 16, 16); }
  g.font = 'bold italic 64px system-ui, sans-serif'; g.textAlign = 'center'; g.fillStyle = '#fff4c0'; g.fillText('TURBO', w / 2, h * 0.3);
}));

/** A plush prize: a round body in `c`, two dark eyes on its front, a little turned. */
function prize(K, L, x, y, z, r, c, turn) {
  K.put(L.ball(r, 14, 10).scale(1, 0.92, 1), K.cloth(c), x, y + r * 0.9, z);
  for (const sg of [-1, 1]) K.put(L.ball(r * 0.14, 8, 6), K.gloss(INK), x + Math.sin(turn) * r * 0.9 + Math.cos(turn) * sg * r * 0.35, y + r * 1.05, z + Math.cos(turn) * r * 0.9 - Math.sin(turn) * sg * r * 0.35);
}

/** A seven, `s` tall, as a flat shape (its foot at 0, centred across), for extruding. */
function sevenShape(L, s) {
  const { THREE } = L, w = s * 0.62, t = s * 0.2;
  return new THREE.Shape([[-w / 2, s], [w / 2, s], [w / 2, s - t * 0.9], [-w * 0.05, 0], [-w * 0.42, 0], [w * 0.16, s - t], [-w / 2, s - t]].map(([x, y]) => new THREE.Vector2(x, y)));
}

/** A monstera leaf `len` long and `wid` wide, its base at 0 and its tip up y, facing +z: a heart cut by slits running in from
    its edges, extruded thin so both faces show. */
function monsteraLeaf(L, len, wid) {
  const { THREE } = L, cuts = [0.3, 0.47, 0.64, 0.8], gap = 0.035, side = [];
  for (let k = 0; k <= 50; k++) {
    const f = k / 50, edge = Math.sin(Math.PI * Math.min(1, 0.12 + f * 0.95)) * wid / 2;
    const near = Math.min(...cuts.map(c => Math.abs(f - c)));
    side.push([edge * (near < gap ? 0.3 + 0.7 * near / gap : 1), len * f]);
  }
  side[0] = [wid * 0.12, 0];
  const pts = [[0, len * 0.07], ...side, ...side.slice(0, -1).reverse().map(([x, y]) => [-x, y])];
  const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y))), { depth: 0.008, bevelEnabled: false });
  g.translate(0, 0, -0.004);
  return g;
}

/** A flytrap's trap at x, y, z facing `turn`: two jaws open on a hinge, green without and red within, pale teeth on their rims. */
function trap(K, L, x, y, z, turn, r) {
  const { ball, cyl } = L, green = K.gloss(K.pal.leaf), red = K.gloss('#d84848'), tooth = K.gloss('#e8f0a0');
  for (const [open, up] of [[-0.5, 1], [0.35, -1]]) {
    const jaw = ball(1, 18, 10).scale(r, r * 0.3, r).translate(0, up * r * 0.05, r).rotateX(open);
    K.put(jaw, green, x, y, z, turn);
    K.put(ball(1, 16, 8).scale(r * 0.86, r * 0.18, r * 0.86).translate(0, up * r * 0.2, r).rotateX(open), red, x, y, z, turn);
    for (let t = 0; t < 7; t++) {
      const a = (t / 6 - 0.5) * Math.PI * 0.9;
      K.put(cyl(0.001, r * 0.45, r * 0.07, 5).translate(0, up * r * 0.22, 0).translate(Math.sin(a) * r * 0.98, 0, r + Math.cos(a) * r * 0.98).rotateX(open), tooth, x, y, z, turn);
    }
  }
}

/** A flowerpot `r` across and `h` tall in the theme's terracotta, soil in it; returns the soil's height above y. */
function littlePot(K, L, x, y, z, r, h) {
  K.put(L.lathe([[0.001, 0], [r * 0.78, 0], [r * 0.95, h * 0.85], [r * 1.05, h * 0.85], [r * 1.05, h], [r * 0.9, h], [r * 0.85, h * 0.9], [0.001, h * 0.9]], 20), K.gloss(K.pal.pot), x, y, z);
  K.put(L.cyl(r * 0.86, 0.008, r * 0.86, 16), K.plain(SOIL), x, y + h * 0.9, z);
  return y + h * 0.9;
}

/** A mushroom: a pale stem, a round cap in `c` with white spots. */
function mushroom(K, L, x, y, z, h, r, c) {
  const { THREE, cyl, ball } = L;
  K.put(cyl(r * 0.32, h, r * 0.4, 12), K.gloss('#f4ecd8'), x, y + h / 2, z);
  K.put(new THREE.SphereGeometry(r, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.8, 1), K.gloss(c), x, y + h - r * 0.1, z);
  for (let i = 0; i < 5; i++) {
    const a = i * 2.4, e = 0.5 + (i % 2) * 0.4;
    K.put(ball(r * 0.13, 8, 6), K.gloss('#ffffff'), x + Math.cos(a) * Math.cos(e) * r, y + h - r * 0.1 + Math.sin(e) * r * 0.8, z + Math.sin(a) * Math.cos(e) * r);
  }
}

/* what grows in each terrarium, on its soil at y (the dome's middle at x, z 0) */
const GARDENS = {
  moss(K, L, y) {
    const R = K.r, { ball } = L;
    for (let i = 0; i < 12; i++) { const a = i * 2.4, d = Math.sqrt((i + 0.5) / 12) * u(10); K.put(ball(u(3.2) + R() * u(1), 12, 8).scale(1, 0.55, 1), K.cloth(i % 3 ? '#5a9a3a' : '#7aba4a'), Math.cos(a) * d, y + u(0.6), Math.sin(a) * d); }
    K.put(rock(L, R, u(4), u(3), u(3.5)), K.plain(STONE), u(5), y + u(2), -u(2));
    mushroom(K, L, -u(6), y + u(1), u(3), u(4), u(2), '#e04848');
    mushroom(K, L, -u(2), y + u(1), u(5), u(3), u(1.6), '#e04848');
  },
  fern(K, L, y) {
    const m = [K.gloss(K.pal.leaf), K.gloss(L.tone(K.pal.leaf, 1.12))];
    for (let i = 0; i < 9; i++) leaf(K, L, m[i % 2], 0, y, 0, i / 9 * Math.PI * 2, 1.0 - (i % 3) * 0.2, u(14) + (i % 2) * u(3), u(2.6), 0.4);
    for (let i = 0; i < 4; i++) leaf(K, L, m[1], 0, y, 0, i * 1.6 + 0.4, 0.4, u(16), u(2.2), 0.25);
  },
  cactus(K, L, y) {
    const body = K.gloss('#5a9a4a'), spine = K.gloss('#f0f0d0');
    column(K, L, 0, y, 0, u(3), u(20), body, spine);
    column(K, L, -u(6), y, u(2), u(2), u(8), body, spine);
    column(K, L, u(6), y, -u(1), u(2), u(10), body, spine);
    flower(K, L, 0, y + u(21), 0, '#f878a8', 0.04, 0, 1.4);
    K.put(rock(L, K.r, u(3), u(2), u(2.6)), K.plain(STONE), u(8), y + u(1), u(5));
  },
  pitcher(K, L, y) {
    const { lathe, torus, ball } = L, green = K.gloss('#8ab848'), red = K.gloss('#c84848');
    for (const [x, h, r] of [[-u(6), u(15), u(2.6)], [u(1), u(21), u(2.8)], [u(7), u(12), u(2.4)]]) {
      K.put(lathe([[0.001, 0], [r * 0.5, 0], [r, h * 0.55], [r * 0.85, h], [r * 0.72, h], [r * 0.78, h * 0.55], [r * 0.4, h * 0.06], [0.001, h * 0.06]], 16), green, x, y, 0);
      K.put(torus(r * 0.8, r * 0.18, Math.PI * 2, 16), red, x, y + h, 0, 0, Math.PI / 2);
      K.put(ball(r, 12, 8).scale(1, 0.2, 0.9), red, x, y + h + r * 0.9, -r * 0.6, 0, 0.9);
    }
    leaf(K, L, K.gloss(K.pal.leaf), 0, y, 0, -1.2, 0.3, u(10), u(3), 0.2);
  },
  mushroom(K, L, y) {
    for (const [x, h, r, c] of [[-u(5), u(9), u(5), '#e04848'], [u(4), u(6), u(4), '#f0a040'], [u(9), u(3.5), u(3), '#58c8f0']]) mushroom(K, L, x, y, (x > 0 ? 1 : -1) * u(1), h, r, c);
  },
  orchid(K, L, y) {
    const m = K.gloss(K.pal.leaf);
    leaf(K, L, m, 0, y + 0.02, 0, -1.4, 1.25, u(9), u(3), 0.1);
    leaf(K, L, K.gloss(L.tone(K.pal.leaf, 1.1)), 0, y + 0.02, 0, 1.6, 1.3, u(9), u(3), 0.1);
    rod(K, L, K.gloss(L.tone(K.pal.leaf, 0.7)), [0, y, 0], [0, y + u(16), 0], 0.006);
    rod(K, L, K.gloss(L.tone(K.pal.leaf, 0.7)), [0, y + u(16), 0], [u(6), y + u(24), 0.02], 0.006);
    for (let n = 0; n < 3; n++) flower(K, L, u(3 + n * 2), y + u(24 - n * 4), u(2), K.pal.c, 0.045, 0, 0.2);
  },
};

export const SHAPES = {
  airhockey: { make: 'airhockey' },
  prizecounter: { make: 'frontbox', d: 0.62, top: 0.36 },
  // boxes, the painting on the front only (js/base-models-kit.js)
  'tokenmachine capsuletoy': { make: 'frontbox', d: 0.5 },
  'photobooth coinpusher': { make: 'frontbox', d: 0.7 },
  'racercabinet shootercabinet puzzlecabinet fightercabinet mazecabinet rhythmcabinet': { make: 'frontbox', d: 0.6 },
  milkfridge: { make: 'milkcooler' },
  pingpong: { make: 'pingpong' },
  pottingbench: { make: 'pottingbench' },
  // Hot Spring, built from parts
  'wavebyobu cranebyobu plumbyobu mountainbyobu moonbyobu fanbyobu': { make: 'byobu' },
  onsenpool: { make: 'onsenpool' },
  shishiodoshi: { make: 'shishiodoshi' },
  okebucket: { make: 'okebucket' },
  yukatarack: { make: 'yukatarack' },
  futonstack: { make: 'futonstack' },
  washbasin: { make: 'washbasin' },
  andon: { make: 'andon' },
  steamrocks: { make: 'steamrocks' },
  mossrock: { make: 'mossrock' },
  monkeystatue: { make: 'monkeystatue' },
  towelbasket: { make: 'towelbasket' },
  getarack: { make: 'getarack' },
  footbath: { make: 'footbath' },
  // Arcade, built from parts
  pinball: { make: 'pinmachine' },
  clawmachine: { make: 'clawcab' },
  slowpokeclaw: { make: 'clawcab', slowpoke: true },
  skeeball: { make: 'skeelane' },
  pokeskeeball: { make: 'skeelane', poke: true },
  hoopshot: { make: 'hoopshot' },
  whackamole: { make: 'molecab' },
  racingseat: { make: 'cockpit', seat: 0.62 },
  luckyseven: { make: 'sevenblock' },
  // Greenhouse, built from parts
  mossterrarium: { make: 'terrarium', jar: 'moss' },
  fernterrarium: { make: 'terrarium', jar: 'fern' },
  cactusterrarium: { make: 'terrarium', jar: 'cactus' },
  pitcherterrarium: { make: 'terrarium', jar: 'pitcher' },
  mushroomterrarium: { make: 'terrarium', jar: 'mushroom' },
  orchidterrarium: { make: 'terrarium', jar: 'orchid' },
  seedrack: { make: 'seedrack' },
  sprinkler: { make: 'sprinkler' },
  growlamp: { make: 'growlamp' },
  flytrap: { make: 'flytrap' },
  monstera: { make: 'monstera' },
  orchidstand: { make: 'orchidstand' },
  compostbin: { make: 'compostbin' },
  tomatovine: { make: 'tomatovine' },
  citrustree: { make: 'citrustree' },
  lilytub: { make: 'lilytub' },
  seedtrays: { make: 'seedtrays' },
  beanpole: { make: 'beanpole' },
  plantstair: { make: 'plantstair' },
  gourdarch: { make: 'gourdarch' },
};

export const MAKES = {
  milkcooler(K, s, W, D, L) {
    const { THREE, rbox } = L;
    const body = K.gloss(K.pal.p), trim = K.metal('#c8ccd8'), col = K.pal.c;
    const w = 0.84, d = 0.7, h = 2.04, f = d / 2, t = 0.06;
    // the cabinet: sides, back, a coloured header with its sign, a dark plinth with vents
    for (const sg of [-1, 1]) K.put(rbox(t, h - 0.1, d, 0.025), body, sg * (w / 2 - t / 2), 0.1 + (h - 0.1) / 2, 0);
    K.put(rbox(w, h - 0.1, 0.04, 0.015), body, 0, 0.1 + (h - 0.1) / 2, -f + 0.02);
    K.put(rbox(w, 0.1, d, 0.03), K.gloss('#2a2a32'), 0, 0.05, 0);
    for (let i = 0; i < 7; i++) K.put(rbox(0.07, 0.03, 0.01, 0.006), K.plain('#101014'), -0.27 + i * 0.09, 0.05, f + 0.002);
    K.put(rbox(w, 0.3, d, 0.03), K.gloss(col), 0, h - 0.15, 0);
    K.put(new THREE.PlaneGeometry(w - 0.1, 0.24), L.litPic(milkSign(col), 0.35), 0, h - 0.15, f + 0.004);
    K.put(rbox(w - 2 * t, 0.06, d - 0.06, 0.01), body, 0, 0.13, 0.01);
    // inside: a pale lit lining, three wire shelves of bottles (milk, chocolate, strawberry)
    const inTop = h - 0.3, inBot = 0.16;
    K.put(new THREE.PlaneGeometry(w - 2 * t, inTop - inBot), K.glow('#e8f6ff'), 0, (inTop + inBot) / 2, -f + 0.045);
    const rows = [['#fbfbf6', '#3a8ae0'], ['#c8946a', '#7a4a2a'], ['#f8b8cc', '#e05888']];
    rows.forEach(([milk, cap], r) => {
      const y = inBot + 0.06 + r * 0.5;
      K.put(rbox(w - 2 * t - 0.01, 0.015, d - 0.14, 0.005), trim, 0, y, -0.02);
      for (let n = 0; n < 5; n++) for (const z of [-0.15, 0.03]) bottle(K, L, -0.28 + n * 0.14, y + 0.008, z, milk, cap);
    });
    // the glass door, hinged on its left, a chrome handle on its right
    const door = K.door([-w / 2 + t / 2, f + 0.02], 1), fw = w - 0.02, fh = inTop - inBot + 0.04, fy = (inTop + inBot) / 2, rail = 0.05, frame = K.gloss(L.tone(K.pal.m, 1.1));
    for (const sg of [-1, 1]) {
      door(rbox(rail, fh, 0.04, 0.012), frame, sg * (fw / 2 - rail / 2), fy, f + 0.02);
      door(rbox(fw, rail, 0.04, 0.012), frame, 0, fy + sg * (fh / 2 - rail / 2), f + 0.02);
    }
    door(new THREE.PlaneGeometry(fw - rail * 2, fh - rail * 2), K.glass(), 0, fy, f + 0.02);
    door(rbox(0.025, 0.5, 0.03, 0.01), trim, fw / 2 - 0.09, fy, f + 0.06);
    for (const sg of [-1, 1]) door(rbox(0.02, 0.02, 0.04, 0.006), trim, fw / 2 - 0.09, fy + sg * 0.22, f + 0.045);
    K.inside = { x: 0, y: fy, w: fw - rail * 2, h: fh - rail * 2, z: f - 0.02, bare: true };
  },

  pingpong(K, s, W, D, L) {
    const { THREE, rbox, cyl } = L;
    const metal = K.metal(K.pal.m), dark = K.gloss('#22262c'), top = 0.76, tw = W - 0.1, td = D - 0.06;
    // the top: green, white lines, a dark edge band under it
    const board = rbox(tw, 0.035, td, 0.008);
    board.translate(0, top - 0.0175, 0);
    K.put(board, dark);
    const face = new THREE.PlaneGeometry(tw - 0.006, td - 0.006).rotateX(-Math.PI / 2);
    face.translate(0, top + 0.0005, 0);
    K.put(face, K.pic(tennisTop()));
    // the undercarriage: two folding frames of legs on castors, an apron, a cross brace
    for (const sx of [-1, 1]) {
      const x = sx * tw * 0.3;
      K.put(rbox(0.05, 0.05, td - 0.18, 0.012), metal, x, top - 0.07, 0);
      for (const sz of [-1, 1]) {
        const z = sz * (td / 2 - 0.12);
        K.put(rbox(0.045, top - 0.12, 0.045, 0.012), metal, x, (top - 0.12) / 2 + 0.04, z);
        K.put(cyl(0.035, 0.03, 0.035, 14).rotateX(Math.PI / 2), dark, x, 0.035, z);
      }
      K.put(rbox(0.035, 0.035, td - 0.26, 0.01), metal, x, 0.22, 0);
    }
    K.put(rbox(tw * 0.6, 0.035, 0.035, 0.01), metal, 0, 0.3, 0);
    // the net across the middle on its two posts
    const netH = 0.15;
    for (const sz of [-1, 1]) {
      K.put(rbox(0.025, netH + 0.03, 0.025, 0.008), metal, 0, top + netH / 2 - 0.01, sz * (td / 2 + 0.03));
      K.put(rbox(0.05, 0.03, 0.06, 0.008), metal, 0, top - 0.015, sz * (td / 2 + 0.01));
    }
    for (const turn of [Math.PI / 2, -Math.PI / 2]) K.put(new THREE.PlaneGeometry(td + 0.06, netH), L.decal(netMesh()), 0, top + netH / 2, 0, turn);
    // two bats and a ball lying on the table
    const bat = (x, z, turn, col) => {
      K.put(cyl(0.075, 0.012, 0.075, 24).scale(1, 1, 1.1), K.gloss(col), x, top + 0.008, z);
      K.put(rbox(0.03, 0.02, 0.1, 0.008).translate(0, 0, 0.11).rotateY(turn), K.wood('#c89a60'), x, top + 0.012, z);
    };
    bat(-tw * 0.3, 0.05, 0.6, K.pal.c);
    bat(tw * 0.26, -0.1, -2.4, '#2a2a30');
    K.put(L.ball(0.02, 14, 10), K.gloss('#fff6e8'), tw * 0.12, top + 0.02, 0.18);
  },

  airhockey(K, s, W, D, L) {
    const { THREE, rbox, cyl } = L;
    const red = K.gloss(K.pal.c), chrome = K.metal('#d8dce4'), dark = K.gloss('#22242a'), tw = W - 0.16, td = D - 0.14, top = 0.8;
    // the table: a coloured body, chrome legs on feet, the white field inside raised rails
    K.put(rbox(tw, 0.2, td, 0.03), red, 0, top - 0.1, 0);
    K.put(rbox(tw - 0.06, 0.05, td - 0.06, 0.01), K.plain(L.tone(K.pal.c, 0.7)), 0, top - 0.22, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      K.put(rbox(0.06, top - 0.2, 0.06, 0.015), chrome, sx * (tw / 2 - 0.1), (top - 0.2) / 2, sz * (td / 2 - 0.1));
      K.put(cyl(0.05, 0.03, 0.055, 14), dark, sx * (tw / 2 - 0.1), 0.015, sz * (td / 2 - 0.1));
    }
    const field = new THREE.PlaneGeometry(tw - 0.12, td - 0.12).rotateX(-Math.PI / 2);
    K.put(field, K.pic(hockeyTop()), 0, top + 0.002, 0);
    for (const sz of [-1, 1]) K.put(rbox(tw, 0.06, 0.06, 0.02), K.gloss(L.tone(K.pal.c, 1.15)), 0, top + 0.02, sz * (td / 2 - 0.03));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.put(rbox(0.06, 0.06, td / 2 - 0.18, 0.02), K.gloss(L.tone(K.pal.c, 1.15)), sx * (tw / 2 - 0.03), top + 0.02, sz * (td / 4 + 0.09));
    for (const sx of [-1, 1]) K.put(rbox(0.04, 0.03, 0.26, 0.01), dark, sx * (tw / 2 - 0.03), top + 0.005, 0);
    // a coin slot on each end, the scoreboard over the back on two posts
    for (const sx of [-1, 1]) {
      K.put(rbox(0.02, 0.1, 0.16, 0.008), K.metal('#8a8e9a'), sx * (tw / 2 + 0.005), top - 0.12, 0);
      K.put(rbox(0.012, 0.04, 0.03, 0.004), K.glow('#ff5a2a'), sx * (tw / 2 + 0.016), top - 0.1, 0);
      K.put(rbox(0.04, 0.42, 0.04, 0.012), chrome, sx * 0.22, top + 0.21, -td / 2 + 0.03);
    }
    K.put(rbox(0.62, 0.2, 0.08, 0.02), dark, 0, top + 0.48, -td / 2 + 0.03);
    K.put(new THREE.PlaneGeometry(0.56, 0.15), L.litPic(scoreBoard(), 0.8), 0, top + 0.48, -td / 2 + 0.072);
    // two mallets and the puck
    for (const [x, col] of [[-tw * 0.32, '#e83a3a'], [tw * 0.32, '#3a7ae8']]) {
      K.put(cyl(0.07, 0.035, 0.075, 24), K.gloss(col), x, top + 0.02, 0.04);
      K.put(cyl(0.03, 0.06, 0.035, 16), K.gloss(col), x, top + 0.065, 0.04);
      K.put(L.ball(0.035, 14, 10), K.gloss(col), x, top + 0.1, 0.04);
    }
    K.put(cyl(0.045, 0.015, 0.045, 20), K.gloss('#202028'), tw * 0.08, top + 0.01, -0.08);
  },

  pottingbench(K, s, W, D, L) {
    const { rbox, cyl, lathe, pot, leafAt } = L;
    const wood = K.wood(), metal = K.metal(K.pal.m), terra = K.gloss(K.pal.pot), soil = K.plain('#4a3020');
    const top = 0.88, bw = W - 0.12, bd = D - 0.2, back = -bd / 2 + 0.04;
    // four legs, the two back ones running up to carry a shelf over the work top
    for (const sx of [-1, 1]) {
      K.put(rbox(0.07, top, 0.07, 0.015), wood, sx * (bw / 2 - 0.04), top / 2, bd / 2 - 0.04);
      K.put(rbox(0.07, 1.72, 0.07, 0.015), wood, sx * (bw / 2 - 0.04), 0.86, back);
    }
    // the slatted work top and its front rail, a slatted shelf near the floor
    for (let i = 0; i < 5; i++) K.put(rbox(bw, 0.045, bd / 5 - 0.012, 0.01), wood, 0, top - 0.022, -bd / 2 + (i + 0.5) * bd / 5);
    K.put(rbox(bw - 0.1, 0.09, 0.03, 0.01), wood, 0, top - 0.09, bd / 2 - 0.02);
    for (let i = 0; i < 4; i++) K.put(rbox(bw - 0.06, 0.03, bd / 4 - 0.02, 0.008), wood, 0, 0.18, -bd / 2 + (i + 0.5) * bd / 4);
    // the back board between the top and the shelf, a high shelf, a rail of hanging tools
    K.put(rbox(bw - 0.08, 0.62, 0.025, 0.008), K.wood(L.tone(K.pal.w, 1.15)), 0, top + 0.36, back - 0.01);
    K.put(rbox(bw, 0.04, 0.26, 0.01), wood, 0, 1.54, back + 0.1);
    K.put(rbox(bw - 0.1, 0.06, 0.03, 0.01), wood, 0, 1.5, back + 0.21);
    K.put(cyl(0.012, bw - 0.16, 0.012, 8).rotateZ(Math.PI / 2), metal, 0, 1.3, back + 0.03);
    const hang = (x, head) => {
      K.put(cyl(0.012, 0.22, 0.012, 8), K.wood('#c89a60'), x, 1.17, back + 0.05);
      head(x, 1.03, back + 0.05);
    };
    hang(-0.5, (x, y, z) => K.put(L.blob(0.08, 0.13, 0.016, 0.7, 0.6), metal, x, y - 0.02, z));
    hang(-0.3, (x, y, z) => { K.put(rbox(0.09, 0.02, 0.016, 0.005), metal, x, y + 0.03, z); for (const dx of [-0.035, 0, 0.035]) K.put(rbox(0.012, 0.1, 0.012, 0.004), metal, x + dx, y - 0.03, z); });
    hang(-0.1, (x, y, z) => K.put(L.blob(0.07, 0.11, 0.016, 0.9, 0.6), metal, x, y - 0.01, z));
    // on the high shelf a row of little pots; on the top a potted plant, a sack of soil, a seed packet, a trowel
    for (let n = 0; n < 4; n++) {
      const x = 0.15 + n * 0.17;
      K.put(lathe([[0.045, 0], [0.06, 0.09], [0.064, 0.1], [0.064, 0.115], [0, 0.115]], 18), terra, x, 1.56, back + 0.1);
      K.put(L.blob(0.07, 0.06, 0.07, 0.8, 0.8), K.gloss(K.pal.leaf), x, 1.69, back + 0.1);
    }
    const plantAt = (x, z) => {
      K.put(lathe([[0.09, 0], [0.12, 0.17], [0.13, 0.18], [0.13, 0.21], [0.115, 0.21], [0.11, 0.19], [0, 0.19]], 24), terra, x, top, z);
      K.put(cyl(0.11, 0.015, 0.11, 20), soil, x, top + 0.19, z);
      const leaf = K.gloss(K.pal.leaf);
      for (let i = 0; i < 7; i++) {
        const g = L.ball(1, 10, 8).scale(0.035, 0.008, 0.08);
        g.translate(0, 0, 0.08); g.rotateX(-(Math.PI / 2 - 0.7 - (i % 2) * 0.3)); g.rotateY(i / 7 * Math.PI * 2);
        K.put(g, leaf, x, top + 0.2, z);
      }
      K.put(L.ball(0.03, 12, 8), K.gloss(K.pal.c), x + 0.03, top + 0.3, z + 0.02);
    };
    plantAt(0.4, 0.02);
    K.put(L.blob(0.3, 0.24, 0.18, 0.4, 0.5), K.cloth('#c8a878'), -0.45, top + 0.12, 0.0, 0.2);
    K.put(L.blob(0.24, 0.05, 0.12, 0.5, 0.4), soil, -0.45, top + 0.23, 0.0, 0.2);
    K.put(rbox(0.1, 0.012, 0.14, 0.004), K.plain('#f4f0e0'), 0.0, top + 0.006, 0.12, -0.3);
    K.put(L.ball(0.025, 10, 8), K.gloss(K.pal.c), 0.0, top + 0.015, 0.11);
    K.put(cyl(0.012, 0.12, 0.012, 8).rotateZ(Math.PI / 2), K.wood('#c89a60'), -0.1, top + 0.015, 0.18, 0.4);
    K.put(L.blob(0.1, 0.012, 0.06, 0.7, 0.6), metal, -0.2, top + 0.012, 0.22, 0.4);
    // stacked pots under the bench
    for (let n = 0; n < 3; n++) for (let k = 0; k < 2; k++)
      K.put(lathe([[0.06, 0], [0.08, 0.12], [0.086, 0.13], [0.086, 0.15], [0.074, 0.15], [0.06, 0.02], [0, 0.02]], 18), terra, -0.5 + n * 0.25, 0.2 + k * 0.06, 0.02);
  },
  /* ----- Hot Spring ----- */

  byobu(K, s, W, D, L) {
    const { THREE, rbox } = L, n = 4, pw = W / n, fold = 0.38, frame = K.wood(), h = u(69), back = K.gloss(L.tone(GOLD, 0.92));
    // four gold-leaf panels hinged in a zigzag, each a lacquered frame round its part of the picture, gold behind
    let x = -W / 2 * Math.cos(fold), z = 0;
    for (let i = 0; i < n; i++) {
      const a = i % 2 ? -fold : fold, dx = Math.cos(a) * pw, dz = -Math.sin(a) * pw, cx = x + dx / 2, cz = z + dz / 2;
      K.put(rbox(pw - 0.01, h, 0.045, 0.01), frame, cx, u(3) + h / 2, cz, a);
      const c = pcrop(K, L, 2.5 + i * 15, 70, 1.5 + (i + 1) * 15, 6), face = new THREE.PlaneGeometry(pw - u(2), u(64));
      K.put(face.clone().translate(0, 0, 0.0235).rotateY(a), K.pic(c.canvas), cx, u(38), cz);
      K.put(face.rotateY(Math.PI).translate(0, 0, -0.0235).rotateY(a), back, cx, u(38), cz);
      for (const sg of [-1, 1]) K.put(rbox(u(4), u(3), 0.07, 0.008), K.wood(L.tone(K.pal.w, 0.7)), cx + sg * Math.cos(a) * (pw / 2 - u(3)), u(1.5), cz - sg * Math.sin(a) * (pw / 2 - u(3)), a);
      x += dx; z += dz;
    }
  },

  onsenpool(K, s, W, D, L) {
    const { cyl, torus } = L, R = K.r, rx = W / 2 - 0.2, rz = D / 2 - 0.2;
    // the spring's dark bed, its water a little under the rim, ripples off one side
    K.put(cyl(1, 0.04, 1, 40).scale(rx, 1, rz), K.plain(L.tone(SPRING, 0.45)), 0, 0.02, 0);
    K.put(cyl(1, 0.02, 1, 40).scale(rx + 0.04, 1, rz + 0.04), K.gloss(SPRING), 0, 0.13, 0);
    for (const r of [0.14, 0.26, 0.38]) K.put(torus(r, 0.006, 2.1, 30).rotateZ(0.3).scale(1, 1, 0.7), K.gloss(L.tone(SPRING, 1.25)), 0.1, 0.142, -0.06, 0, Math.PI / 2);
    // big rocks all round, smaller ones on them, one sunk in the water
    for (let i = 0; i < 24; i++) {
      const a = i / 24 * Math.PI * 2 + R() * 0.08, sz = 0.13 + R() * 0.06;
      K.put(rock(L, R, sz * 1.35, sz, sz * 1.1), K.plain(i % 3 ? STONE : L.tone(STONE, 1.12)), Math.cos(a) * (rx + 0.03), sz * 0.5, Math.sin(a) * (rz + 0.03), -a);
      if (i % 4 === 1) K.put(rock(L, R, sz * 0.8, sz * 0.6, sz * 0.7), K.plain(L.tone(STONE, 0.9)), Math.cos(a) * (rx + 0.08), sz * 1.25, Math.sin(a) * (rz + 0.08), a);
    }
    K.put(rock(L, R, 0.16, 0.1, 0.14), K.plain(L.tone(STONE, 0.85)), -rx * 0.45, 0.12, rz * 0.3);
    // a hinoki bucket afloat by the far corner
    tub(K, L, rx * 0.55, 0.11, rz * 0.5, 0.11, 0.12);
  },

  shishiodoshi(K, s, W, D, L) {
    const { cyl, ball } = L, R = K.r;
    // a row of stones under it all, a stone basin of water at the right
    for (let n = 0; n < 5; n++) K.put(rock(L, R, 0.09, 0.08, 0.1), K.plain(n % 2 ? STONE : L.tone(STONE, 1.1)), X(5 + n * 5.5), 0.05, 0.28 - (n % 2) * 0.06);
    K.put(L.lathe([[0.001, 0], [u(6), 0], [u(7.5), u(7)], [u(6), u(8)], [u(5), u(5)], [0.001, u(5)]], 24), K.plain(L.tone(STONE, 0.9)), X(23), 0, 0.05);
    K.put(cyl(u(5.4), 0.01, u(5.4), 20), K.gloss(WATER), X(23), u(7), 0.05);
    // the rocker's two posts, its pin, and the cane itself tipped down to the basin, cut open at its mouth
    for (const z of [-0.09, 0.09]) cane(K, L, X(11.5), 0, z, u(30), u(1.5));
    K.put(cyl(0.012, 0.22, 0.012, 8).rotateX(Math.PI / 2), K.wood(L.tone(BAMBOO, 0.6)), X(11.5), u(27), 0);
    const a = Math.atan2(36 - 22, 26 - 3), len = Math.hypot(23, 14) / 32;
    K.put(cyl(u(1.8), len, u(1.8), 14).rotateZ(Math.PI / 2 - a), K.gloss(BAMBOO), X(14.5), u(29), 0);
    K.put(cyl(u(1.4), 0.01, u(1.4), 12).rotateZ(Math.PI / 2 - a), K.plain(L.tone(BAMBOO, 0.5)), X(14.5) + Math.cos(a) * len / 2, u(29) - Math.sin(a) * len / 2, 0);
    // the feed: a tall cane at the back left, a short spout bent over the rocker's top end, a thread of water falling
    cane(K, L, X(3.5), 0, -0.12, u(58), u(1.6));
    rod(K, L, K.gloss(BAMBOO), [X(3.5), u(55), -0.12], [X(10), u(51), -0.02], u(1));
    K.put(cyl(0.008, u(8), 0.008, 6), K.M('glass', WATER, { key: 'trickle' }), X(10.5), u(47), -0.01);
    K.put(ball(0.016, 8, 6), K.gloss(L.tone(WATER, 1.2)), X(10.5), u(43), -0.01);
  },

  okebucket(K, s, W, D, L) {
    const { rbox } = L, r = u(8), h = u(12);
    // two hinoki tubs side by side, a third stacked on them, a folded towel over its rim
    tub(K, L, X(9), 0, 0.06, r, h);
    tub(K, L, X(23), 0, 0.02, r, h);
    tub(K, L, X(16), h - 0.012, 0.04, r, h);
    K.put(rbox(u(15), 0.035, 0.26, 0.015), K.cloth(K.pal.c), X(16) - 0.03, h * 2 + 0.005, 0.04, 0.2);
    K.put(rbox(u(15), 0.12, 0.035, 0.015), K.cloth(K.pal.c), X(16) - 0.03, h * 2 - 0.05, 0.04 + 0.135, 0.2);
    K.put(rbox(u(15), 0.008, 0.036, 0.003), K.cloth(K.pal.p), X(16) - 0.03, h * 2 - 0.02, 0.04 + 0.136, 0.2);
  },

  yukatarack(K, s, W, D, L) {
    const { THREE, rbox, cyl } = L, robe = K.cloth(K.pal.c);
    // a bamboo frame: two posts on feet, a top rail and a low one
    for (const x of [X(3.5), X(28.5)]) {
      cane(K, L, x, 0, -0.06, u(76), u(1.6));
      K.put(rbox(u(2.5), u(3), 0.3, 0.012), K.gloss(L.tone(BAMBOO, 0.8)), x, u(1.5), -0.06);
    }
    K.put(cyl(u(1.5), u(30), u(1.5), 14).rotateZ(Math.PI / 2), K.gloss(BAMBOO), 0, u(74), -0.06);
    K.put(cyl(u(1), u(24), u(1), 12).rotateZ(Math.PI / 2), K.gloss(L.tone(BAMBOO, 0.85)), 0, u(29), -0.06);
    // the yukata over the top rail, its sleeves out wide, its pattern and obi off the painting
    const sleeves = pcrop(K, L, 4, 72, 28, 60), body = pcrop(K, L, 9, 60, 23, 28);
    K.put(rbox(u(24), u(12), 0.06, 0.012), robe, 0, u(66), -0.04);
    K.put(rbox(u(14), u(32), 0.07, 0.012), robe, 0, u(44), -0.04);
    K.put(new THREE.PlaneGeometry(u(24), u(12)), K.pic(sleeves.canvas), 0, u(66), -0.009);
    K.put(new THREE.PlaneGeometry(u(14), u(32)), K.pic(body.canvas), 0, u(44), -0.004);
    K.put(rbox(u(14.6), u(6), 0.08, 0.01), K.cloth(K.pal.a), 0, u(47), -0.04);
    K.put(rbox(u(4), u(8), 0.09, 0.01), K.cloth(L.tone(K.pal.a, 0.85)), 0, u(46.5), -0.035);
  },

  futonstack(K, s, W, D, L) {
    const { rbox, blob } = L, R = K.r, cols = [K.pal.c, K.pal.p, L.tone(K.pal.c, 1.15), K.pal.a, K.pal.p, K.pal.c];
    // six folded futons stacked a little askew, a tuft stitched here and there, a pillow on top
    cols.forEach((c, n) => {
      const y = n * u(9) + u(5), x = (n % 2 ? 0.02 : -0.01), turn = (R() - 0.5) * 0.08;
      K.put(rbox(u(29), u(9.6), 0.74, 0.045), K.cloth(c), x, y, 0, turn);
      K.put(rbox(u(28), u(1), 0.04, 0.004), K.cloth(L.tone(c, 0.85)), x, y, 0.37, turn);
      if (n % 3 === 0) for (let i = 0; i < 4; i++) K.put(L.ball(0.012, 8, 6), K.cloth(K.pal.p), x - 0.33 + i * 0.22, y + u(4.8), 0.1, turn);
    });
    K.put(blob(u(16), u(7), 0.3, 0.6, 0.5), K.cloth('#f8f6f0'), 0.02, u(58), -0.08);
  },

  washbasin(K, s, W, D, L) {
    const { THREE, rbox, cyl, ball, blob, lathe } = L, wood = K.wood(), steel = K.metal(CHROME);
    // the stand: two front legs, two back posts running up to the mirror, a shelf for the basin
    for (const x of [X(9.5), X(23.5)]) {
      K.put(rbox(u(3), u(34), u(3), 0.01), wood, x, u(17), 0.12);
      K.put(rbox(u(3), u(84), u(3), 0.01), wood, x, u(42), -0.2);
    }
    K.put(rbox(u(22), u(2), 0.4, 0.01), wood, X(16.5), u(33), -0.03);
    // the mirror in its frame, the tap over the basin, its red knob
    K.put(rbox(u(20), u(24), 0.04, 0.012), wood, X(16), u(72), -0.2);
    K.put(new THREE.PlaneGeometry(u(16), u(20)), K.gloss('#cfe6ee'), X(16), u(72), -0.178);
    K.put(new THREE.PlaneGeometry(u(3), u(14)).rotateZ(-0.5), K.gloss('#f4fbff'), X(12), u(74), -0.177);
    K.put(cyl(0.014, u(8), 0.014, 10), steel, X(15), u(56), -0.17);
    K.put(cyl(0.012, 0.18, 0.012, 10).rotateX(Math.PI / 2), steel, X(15), u(59), -0.09);
    K.put(cyl(0.014, 0.03, 0.012, 10), steel, X(15), u(57.5), -0.005);
    K.put(ball(u(2), 12, 10), K.gloss('#e04848'), X(13), u(60), -0.17);
    // the hinoki basin, water in it, a cake of soap on its rim; a bath stool in front
    K.put(lathe([[0.001, 0], [u(7), 0], [u(10), u(12)], [u(9), u(12)], [u(6.5), u(2)], [0.001, u(2)]], 28), K.wood(HINOKI), X(16), u(34), -0.02);
    K.put(L.cyl(u(8.6), 0.01, u(8.6), 24), K.gloss(SPRING), X(16), u(44), -0.02);
    K.put(blob(0.07, 0.035, 0.05, 0.6, 0.6), K.gloss('#f8f0f8'), X(24.5), u(46.5), 0.05);
    K.put(rbox(u(12), u(2), 0.24, 0.01), K.wood(HINOKI), X(9), u(11), 0.3);
    for (const dx of [-u(4), u(4)]) K.put(rbox(u(2), u(10), 0.2, 0.008), K.wood(L.tone(HINOKI, 0.85)), X(9) + dx, u(5), 0.3);
  },

  andon(K, s, W, D, L) {
    const { rbox } = L, wood = K.wood(), w = u(12), d = u(12);
    // a paper box lit from inside, a wooden post at each corner, rails round it, a square foot
    K.put(rbox(w, u(41), d, 0.004), K.glow('#fff0c0'), 0, u(34.5), 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.put(rbox(u(3), u(58), u(3), 0.008), wood, sx * (w / 2 + u(1)), u(29), sz * (d / 2 + u(1)));
    for (const [y, t] of [[u(56.5), u(3)], [u(13), u(2)], [u(28), u(1)], [u(42), u(1)]]) {
      for (const sz of [-1, 1]) K.put(rbox(w + u(4), t, u(1.4), 0.004), wood, 0, y, sz * (d / 2 + u(0.4)));
      for (const sx of [-1, 1]) K.put(rbox(u(1.4), t, d + u(4), 0.004), wood, sx * (w / 2 + u(0.4)), y, 0);
    }
    K.put(rbox(u(22), u(4), u(22), 0.012), wood, 0, u(2), 0);
    K.put(rbox(u(14), u(1.2), u(14), 0.004), K.wood(L.tone(K.pal.w, 0.85)), 0, u(58.6), 0);
  },

  steamrocks(K, s, W, D, L) {
    const { rbox, cyl } = L, R = K.r, body = K.metal(K.pal.m), dark = K.plain(INK);
    // the stove: a metal box with grooves, its fire glowing behind a little window, short feet
    K.put(rbox(u(26), u(26), 0.6, 0.03), body, 0, u(15), 0);
    for (let j = 0; j < 5; j++) K.put(rbox(u(22), 0.008, 0.004, 0.002), K.plain(L.tone(K.pal.m, 0.75)), 0, u(8 + j * 4), 0.301);
    K.put(rbox(u(14), u(7), 0.02, 0.006), dark, 0, u(10.5), 0.3);
    K.put(new L.THREE.PlaneGeometry(u(12), u(5)), K.glow('#f8a040'), 0, u(10.5), 0.312);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.put(cyl(0.02, u(2), 0.02, 8), dark, sx * u(11), u(1), sz * 0.24);
    // its stone basket on top: a rail round a heap of dark stones
    K.put(rbox(u(27), u(2), 0.62, 0.008), K.metal(L.tone(K.pal.m, 0.7)), 0, u(29), 0);
    for (let i = 0; i < 16; i++) {
      const ring = i < 10, a = i * 2.39, r = ring ? 0.2 : 0.08;
      K.put(rock(L, R, 0.08, 0.06, 0.07), K.plain(i % 3 ? L.tone(STONE, 0.75) : STONE), Math.cos(a) * r * 1.2, u(31) + (ring ? 0 : 0.07) + R() * 0.02, Math.sin(a) * r, a);
    }
  },

  mossrock(K, s, W, D, L) {
    const R = K.r, moss = K.cloth('#6a9a3a');
    // a big boulder and a smaller one, moss heaped on the big one's top, a sprig and a flower in it
    K.put(rock(L, R, u(15), u(15), 0.36), K.plain(STONE), X(16), u(15), -0.02);
    K.put(rock(L, R, u(7), u(7), 0.18), K.plain(L.tone(STONE, 0.85)), X(8), u(6), 0.22);
    const cap = rock(L, R, u(13), u(5), 0.3);
    K.put(cap, moss, X(16), u(27), -0.02);
    K.put(rock(L, R, u(6), u(2.5), 0.12), K.cloth('#7aaa4a'), X(10), u(28), 0.1);
    leaf(K, L, K.gloss(K.pal.leaf), X(25), u(29), 0, -0.6, 1.0, 0.2, 0.05, 0.1);
    leaf(K, L, K.gloss(L.tone(K.pal.leaf, 1.1)), X(22), u(30), -0.05, 0.4, 1.1, 0.16, 0.045, 0.1);
    flower(K, L, X(9), u(31), 0.08, K.pal.c, 0.05, 0.3, 0.9);
  },

  monkeystatue(K, s, W, D, L) {
    const { rbox, ball, blob } = L, stone = K.plain(STONE), pale = K.plain(L.tone(STONE, 1.15)), dark = K.plain(INK);
    // a plinth, the monkey sat on it hugging its knees, a towel folded on its head
    K.put(rbox(u(24), u(8), 0.56, 0.02), K.plain(L.tone(STONE, 0.85)), 0, u(4), 0);
    K.put(blob(u(20), u(26), 0.42, 0.7, 0.8), stone, 0, u(21), 0);
    for (const sg of [-1, 1]) {
      K.put(blob(u(7), u(15), 0.16, 0.8, 0.8), K.plain(L.tone(STONE, 0.92)), sg * u(8), u(20), 0.1, sg * 0.2, 0, sg * 0.25);
      K.put(ball(u(4), 14, 10).scale(1.1, 0.8, 1), stone, sg * u(5), u(11), 0.2);
    }
    K.put(ball(u(8), 22, 16), stone, 0, u(42), 0.04);
    K.put(blob(u(10), u(8), 0.12, 0.6, 0.7), pale, 0, u(40.5), 0.24);
    for (const sg of [-1, 1]) {
      K.put(ball(u(0.9), 8, 6), dark, sg * u(2), u(42), 0.297);
      K.put(ball(u(2.6), 12, 10).scale(0.6, 1, 1), stone, sg * u(8.5), u(42), 0.02);
    }
    K.put(rbox(u(3), u(0.7), 0.01, 0.002), K.plain(L.tone(STONE, 0.6)), 0, u(38), 0.296);
    K.put(rbox(u(12), u(3), 0.2, 0.015), K.cloth(K.pal.c), 0, u(50.5), 0.04, 0.1);
    K.put(rbox(u(12.2), u(0.8), 0.202, 0.004), K.cloth(K.pal.p), 0, u(51), 0.04, 0.1);
  },

  towelbasket(K, s, W, D, L) {
    const { rbox, cyl, torus } = L, wicker = K.wood(), dark = K.wood(L.tone(K.pal.w, 0.82));
    // a woven basket: bands of wicker, a thick rim
    K.put(rbox(u(26), u(20), 0.62, 0.04), wicker, 0, u(10), 0);
    for (let j = 0; j < 6; j++) K.put(rbox(u(26.4), u(1.4), 0.624, 0.006), j % 2 ? dark : wicker, 0, u(2 + j * 3.2), 0);
    K.put(rbox(u(28), u(2), 0.66, 0.02), dark, 0, u(20), 0);
    // rolled towels in it, three down and two on top, their spirals out front
    const roll = (x, y, c) => {
      K.put(cyl(u(4), 0.56, u(4), 22).rotateX(Math.PI / 2), K.cloth(c), x, y, 0);
      for (const r of [u(2), u(3.2)]) K.put(torus(r, 0.005, Math.PI * 2, 20), K.cloth(L.tone(c, 0.8)), x, y, 0.281);
    };
    [X(8), X(16), X(24)].forEach((x, i) => roll(x, u(21.5), i % 2 ? K.pal.c : K.pal.p));
    [X(12), X(20)].forEach((x, i) => roll(x, u(28.5), i % 2 ? K.pal.p : K.pal.c));
  },

  getarack(K, s, W, D, L) {
    const { rbox } = L, wood = K.wood(), dark = K.wood(L.tone(K.pal.w, 0.7)), d = 0.5;
    // an open shelf: sides, a back, a top and three shelves
    for (const sg of [-1, 1]) K.put(rbox(u(2), u(54), d, 0.01), wood, sg * u(14), u(27), 0);
    K.put(rbox(u(28), u(54), 0.03, 0.01), dark, 0, u(27), -d / 2 + 0.015);
    K.put(rbox(u(30), u(2), d + 0.02, 0.01), wood, 0, u(53), 0);
    // on each shelf two pairs of geta: a hinoki sole on two teeth, the thong a V in the theme's colour
    for (let r = 0; r < 3; r++) {
      const y = u(6 + r * 16);
      K.put(rbox(u(26), u(2), d, 0.008), wood, 0, y - u(1), 0);
      for (const px of [X(9.5), X(22.5)]) for (const sx of [-0.065, 0.065]) {
        const x = px + sx;
        K.put(rbox(0.11, 0.035, 0.3, 0.014), K.wood(HINOKI), x, y + 0.048, 0.04);
        for (const z of [-0.08, 0.08]) K.put(rbox(0.1, 0.03, 0.03, 0.004), K.wood(L.tone(HINOKI, 0.8)), x, y + 0.017, 0.04 + z);
        rod(K, L, K.cloth(K.pal.c), [x - 0.045, y + 0.066, 0.05], [x, y + 0.11, 0.11], 0.009);
        rod(K, L, K.cloth(K.pal.c), [x + 0.045, y + 0.066, 0.05], [x, y + 0.11, 0.11], 0.009);
        rod(K, L, K.cloth(K.pal.c), [x, y + 0.11, 0.11], [x, y + 0.066, 0.14], 0.009);
      }
    }
  },

  footbath(K, s, W, D, L) {
    const { rbox } = L, R = K.r, h = 0.18, t = 0.09, wood = K.wood();
    // a wooden trough: its four sides and a rim, warm water over a bed of pebbles
    const sides = [[0, -D / 2 + t / 2, W, t], [0, D / 2 - t / 2, W, t], [-W / 2 + t / 2, 0, t, D - 0.02], [W / 2 - t / 2, 0, t, D - 0.02]];
    for (const [x, z, w, d] of sides) {
      K.put(rbox(w, h, d, 0.015), wood, x, h / 2, z);
      K.put(rbox(w + 0.01, 0.025, d + 0.01, 0.008), K.wood(L.tone(K.pal.w, 1.15)), x, h + 0.008, z);
    }
    K.put(rbox(W - t * 2, 0.03, D - t * 2, 0.006), K.plain(L.tone(SPRING, 0.5)), 0, 0.03, 0);
    for (let n = 0; n < 9; n++) K.put(rock(L, R, 0.07, 0.035, 0.05), K.plain(n % 2 ? STONE : L.tone(STONE, 1.1)), -W / 2 + 0.28 + n * 0.18, 0.06, (n % 2 ? 0.08 : -0.08) + (R() - 0.5) * 0.06, R() * 3);
    K.put(rbox(W - t * 2, 0.01, D - t * 2, 0.004), K.M('glass', SPRING, { key: 'footbath' }), 0, h - 0.04, 0);
  },
  /* ----- Arcade ----- */

  pinmachine(K, s, W, D, L) {
    const { THREE, rbox, cyl, ball } = L, col = K.gloss(K.pal.c), chrome = K.metal(CHROME), tilt = 0.08, d = 0.86;
    // chrome legs, the back pair a little longer so the table leans towards you
    for (const [x, z, h] of [[X(4.5), d / 2 - 0.06, u(28)], [X(27.5), d / 2 - 0.06, u(28)], [X(4.5), -d / 2 + 0.1, u(31)], [X(27.5), -d / 2 + 0.1, u(31)]]) {
      K.put(cyl(0.025, h, 0.03, 12), chrome, x, h / 2, z);
      K.put(cyl(0.045, 0.03, 0.045, 14), chrome, x, 0.015, z);
    }
    // the table: its body in the theme's colour, the playfield lit under its glass, chrome side rails
    const table = (geo, m, x, up, z) => { geo.translate(x, up, z); K.put(geo, m, 0, u(34), 0, 0, tilt); };
    table(rbox(u(30), u(12), d, 0.03), col, 0, 0, 0);
    table(new THREE.PlaneGeometry(u(26), d - 0.1).rotateX(-Math.PI / 2), L.litPic(pinField(K.pal.a), 0.55), 0, u(6) + 0.002, 0);
    table(new THREE.PlaneGeometry(u(28), d - 0.06).rotateX(-Math.PI / 2), K.glass(), 0, u(6) + 0.02, 0);
    for (const sg of [-1, 1]) table(rbox(0.03, 0.04, d, 0.01), chrome, sg * u(14.5), u(6), 0);
    table(rbox(u(30), 0.03, 0.06, 0.012), chrome, 0, u(6), d / 2 - 0.03);
    // flipper buttons on the sides, the plunger at the front right, the coin door
    for (const sg of [-1, 1]) table(rbox(0.03, u(4), u(4), 0.008), K.gloss('#f8d030'), sg * u(15.4), 0, d / 2 - 0.16);
    table(cyl(0.012, 0.1, 0.012, 10).rotateX(Math.PI / 2), chrome, X(25), 0, d / 2 + 0.05);
    table(ball(0.024, 14, 10), K.gloss('#e83838'), X(25), 0, d / 2 + 0.1);
    table(rbox(u(10), u(7), 0.012, 0.005), K.metal('#8a8e9a'), 0, -u(1), d / 2 + 0.004);
    // the backbox at the back: its backglass and score lit off the painting, neon tubes up its sides
    K.put(rbox(u(28), u(44), 0.16, 0.025), col, 0, u(68), -d / 2 + 0.06);
    K.put(new THREE.PlaneGeometry(u(25), u(41)), L.litPic(pcrop(K, L, 3.5, 88.5, 28.5, 47.5).canvas, 0.6), 0, u(68), -d / 2 + 0.142);
    for (const sg of [-1, 1]) K.put(cyl(0.012, u(40), 0.012, 8), K.glow('#f858c8'), sg * u(14.4), u(68), -d / 2 + 0.13);
    K.put(rbox(u(26), 0.03, 0.12, 0.01), K.gloss(L.tone(K.pal.c, 0.7)), 0, u(46), -d / 2 + 0.07);
  },

  clawcab(K, s, W, D, L) {
    const { THREE, rbox, cyl, ball, blob } = L, slow = s.slowpoke, c = slow ? '#e870a8' : K.pal.c, body = K.gloss(c), d = 0.8;
    const chrome = K.metal(CHROME), dark = K.gloss(INK);
    // the cabinet: its prize chute, the control panel out front with a stick and a button
    K.put(rbox(u(30), u(36), d, 0.03), body, 0, u(18), 0);
    K.put(rbox(u(10), u(10), 0.03, 0.008), dark, X(9), u(21), d / 2);
    K.put(rbox(u(13), u(6), 0.16, 0.015), slow ? K.gloss('#c85088') : K.metal(K.pal.m), X(22.5), u(29), d / 2 + 0.06);
    K.put(cyl(0.008, 0.08, 0.008, 8), chrome, X(20), u(32) + 0.04, d / 2 + 0.06);
    K.put(ball(0.03, 14, 10), K.gloss(slow ? '#f8d030' : '#e04848'), X(20), u(32) + 0.09, d / 2 + 0.06);
    K.put(cyl(0.024, 0.02, 0.024, 14), K.glow('#f8d030'), X(26), u(32) + 0.01, d / 2 + 0.08);
    // the glass case: four posts, panes all round, a heap of plush prizes on its floor
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.put(rbox(u(2), u(44), u(2), 0.006), body, sx * u(14), u(58), sz * (d / 2 - u(1)));
    for (const sz of [-1, 1]) K.put(new THREE.PlaneGeometry(u(26), u(44)).rotateY(sz < 0 ? Math.PI : 0), K.glass(), 0, u(58), sz * (d / 2 - u(1)));
    for (const sx of [-1, 1]) K.put(new THREE.PlaneGeometry(d - u(2), u(44)).rotateY(sx * Math.PI / 2), K.glass(), sx * u(14), u(58), 0);
    K.put(rbox(u(26), 0.02, d - u(4), 0.005), K.plain(L.tone(c, 0.6)), 0, u(36.2), 0);
    const cols = slow ? ['#f8d030', '#f8a8c8', '#f0a0b8', '#58b8f8', '#f8f0e8', '#f0c040', '#a8683a'] : ['#f8d030', '#f8a8c8', '#58b8f8', '#a8e078', '#f8a030', '#c8a0f0', '#f8f0e8', '#e04848', '#58d8b8'];
    const R = K.r;
    cols.forEach((col, i) => prize(K, L, -0.3 + (i % 4) * 0.2 + (R() - 0.5) * 0.04, u(36.5) + (i > 3 ? 0.07 : 0), 0.2 - Math.floor(i / 4) * 0.2 + (i > 3 ? 0.1 : 0), 0.085, col, (R() - 0.5) * 0.8));
    // the claw on its chrome rod from the gantry, three prongs open
    const cx = slow ? X(12.5) : X(18.5);
    K.put(rbox(u(26), 0.03, 0.04, 0.008), chrome, 0, u(78), 0);
    K.put(cyl(0.01, u(14), 0.01, 8), chrome, cx, u(71), 0);
    K.put(cyl(0.05, 0.05, 0.035, 14), chrome, cx, u(63.5), 0);
    for (let i = 0; i < 3; i++) {
      const a = i / 3 * Math.PI * 2, ox = Math.cos(a), oz = Math.sin(a);
      K.put(tube(L, [[cx + ox * 0.03, u(62.5), oz * 0.03], [cx + ox * 0.08, u(59), oz * 0.08], [cx + ox * 0.06, u(55.5), oz * 0.06]], 0.008, 12), chrome);
    }
    // the top box: a lit marquee, or for Slowpoke's its head poking out of the front
    K.put(rbox(u(30), u(slow ? 12 : 10), d, 0.03), body, 0, u(slow ? 86 : 85), 0);
    if (!slow) K.put(new THREE.PlaneGeometry(u(24), u(4)), K.glow(MARQUEE), 0, u(85), d / 2 + 0.003);
    else {
      const pink = K.gloss('#f0a0b8');
      K.put(ball(u(5.5), 22, 16), pink, 0, u(86), d / 2 + 0.02);
      K.put(blob(u(6), u(3), 0.08, 0.7, 0.7), K.gloss('#f8e8e0'), 0, u(84), d / 2 + 0.17);
      for (const sg of [-1, 1]) K.put(ball(u(0.9), 8, 6), K.gloss(INK), sg * u(2.2), u(87.5), d / 2 + 0.185);
      for (const sg of [-1, 1]) K.put(ball(u(1.6), 10, 8).scale(1, 0.7, 1), pink, sg * u(4.5), u(90.5), d / 2 + 0.02);
      for (let i = 0; i < 6; i++) K.put(ball(0.018, 8, 6), K.glow(MARQUEE), -u(13) + i * u(5.2), u(81.2), d / 2 + 0.002);
    }
  },

  skeelane(K, s, W, D, L) {
    const { rbox, cyl, torus, ball } = L, poke = s.poke, rail = K.gloss(poke ? '#3aa86a' : K.pal.c), back = K.gloss(poke ? '#2a6a4a' : K.pal.c);
    const lane = poke ? '#c89a60' : HINOKI, lw = u(20), z0 = 0.46, z1 = -0.2, y0 = 0.22, y1 = 0.46;
    // the lane rising away from you between two rails, a tray of balls at its foot
    const len = Math.hypot(z0 - z1, y1 - y0), a = Math.atan2(y1 - y0, z0 - z1);
    for (let i = 0; i < 6; i++) K.put(rbox(lw, 0.03, len / 6 - 0.004, 0.004), K.wood(i % 2 ? L.tone(lane, 0.86) : lane), 0, y0 + (y1 - y0) * (i + 0.5) / 6, z0 - (z0 - z1) * (i + 0.5) / 6, 0, a);
    for (const sg of [-1, 1]) K.put(L.profileSlab([[z0 + 0.04, 0], [z0 + 0.04, y0 + 0.1], [z1, y1 + 0.12], [z1, 0]], 0.06, sg * (lw / 2 + 0.03) - 0.03), rail);
    K.put(rbox(lw, y0 - 0.02, z0 - z1, 0.01), K.plain(L.tone(poke ? '#2a6a4a' : K.pal.c, 0.5)), 0, (y0 - 0.02) / 2, (z0 + z1) / 2);
    K.put(rbox(lw + 0.12, 0.06, 0.12, 0.015), rail, 0, y0 - 0.02, z0 + 0.02);
    [[-0.1, poke ? null : '#d84848'], [0, poke ? null : '#4a88d8'], [0.1, poke ? null : '#f8d030']].forEach(([x, c]) => {
      if (poke) pokeBall(K, L, x, y0 + 0.07, z0 - 0.02, 0.045);
      else K.put(ball(0.045, 16, 12), K.gloss(c), x, y0 + 0.07, z0 - 0.02);
    });
    // the target leaning back at the lane's end: rings round a cup, two small pockets above
    K.put(rbox(u(22), y1 + u(44), 0.12, 0.02), back, 0, (y1 + u(44)) / 2, z1 - 0.12);
    const ring = (r, t, c, y) => K.put(torus(r, t, Math.PI * 2, 30), K.gloss(c), 0, y, z1 - 0.04);
    const ry = y1 + u(17);
    K.put(cyl(u(9), 0.04, u(9), 30).rotateX(Math.PI / 2), K.plain(poke ? '#1e4a34' : INK), 0, ry, z1 - 0.06);
    ring(u(8.5), 0.014, poke ? '#f8f0d8' : '#f8d030', ry); ring(u(5.6), 0.014, poke ? '#3aa86a' : '#58f0f8', ry); ring(u(2.8), 0.012, poke ? '#f8f0d8' : '#f858c8', ry);
    K.put(cyl(u(1.6), 0.02, u(1.6), 14).rotateX(Math.PI / 2), K.plain(poke ? '#f8d030' : '#101014'), 0, ry, z1 - 0.035);
    for (const sg of [-1, 1]) K.put(cyl(u(2), 0.02, u(2), 14).rotateX(Math.PI / 2), K.plain(poke ? '#e04848' : '#101014'), sg * u(8), ry + u(15), z1 - 0.055);
    // the score on top, lit
    K.put(rbox(u(16), u(7), 0.1, 0.012), K.gloss(INK), 0, y1 + u(47.5), z1 - 0.1);
    for (let n = 0; n < 4; n++) K.put(rbox(u(2), u(3), 0.01, 0.002), K.glow(poke ? '#f8d030' : '#f85050'), -u(4.5) + n * u(3), y1 + u(47.5), z1 - 0.048);
  },

  hoopshot(K, s, W, D, L) {
    const { THREE, rbox, cyl, torus, ball } = L, body = K.gloss(K.pal.c), chrome = K.metal(CHROME), d = 0.9, top = u(30), net = L.decal(cageNet());
    // the cabinet: a dark tray along its front with four basketballs in it, a coin slot
    K.put(rbox(u(30), top, d, 0.03), body, 0, top / 2, 0);
    K.put(rbox(u(24), 0.05, 0.22, 0.01), K.gloss('#2a2a38'), 0, top - 0.02, d / 2 - 0.13);
    for (let n = 0; n < 4; n++) K.put(ball(u(2.6), 16, 12), K.gloss('#e87830'), X(8 + n * 5), top + u(2), d / 2 - 0.13);
    K.put(rbox(u(6), u(8), 0.012, 0.004), K.metal('#8a8e9a'), 0, u(12), d / 2 + 0.006);
    // the ramp from the hoop down to the tray, posts and netting round the cage
    const rl = Math.hypot(d - 0.26, 0.3);
    K.put(rbox(u(26), 0.02, rl, 0.006), K.plain('#3a3a48'), 0, top + 0.15, -0.13, 0, -Math.atan2(0.3, d - 0.26));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.put(cyl(u(1.4), u(62), u(1.4), 10), chrome, sx * u(14), top + u(31), sz * (d / 2 - 0.03));
    for (const sx of [-1, 1]) for (const turn of [0, Math.PI]) K.put(new THREE.PlaneGeometry(d - 0.06, u(60)).rotateY(sx * Math.PI / 2 + turn), net, sx * u(14), top + u(31), 0);
    // the backboard with its square, the hoop out front of it, its net; the score lit under it
    K.put(rbox(u(22), u(16), 0.04, 0.01), K.gloss('#f4f4f0'), 0, u(80), -d / 2 + 0.06);
    for (const [w, h, x, y] of [[u(8), u(0.8), 0, u(82)], [u(0.8), u(6), -u(3.6), u(79)], [u(0.8), u(6), u(3.6), u(79)]]) K.put(rbox(w, h, 0.01, 0.002), K.plain('#e04848'), x, y, -d / 2 + 0.082);
    K.put(torus(u(5), 0.012, Math.PI * 2, 24), K.gloss('#e04848'), 0, u(72), -d / 2 + 0.24, 0, Math.PI / 2);
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * Math.PI * 2;
      K.put(tube(L, [[Math.cos(a) * u(5), u(72), Math.sin(a) * u(5)], [Math.cos(a + 0.3) * u(4), u(69), Math.sin(a + 0.3) * u(4)], [Math.cos(a) * u(3.2), u(66), Math.sin(a) * u(3.2)]], 0.004, 8), K.plain('#f4f4f4'), 0, 0, -d / 2 + 0.24);
    }
    K.put(rbox(u(16), u(7), 0.06, 0.01), K.gloss(INK), 0, u(56.5), -d / 2 + 0.06);
    for (let n = 0; n < 4; n++) K.put(rbox(u(2), u(3), 0.01, 0.002), K.glow('#f85050'), -u(4.5) + n * u(3), u(56.5), -d / 2 + 0.092);
  },

  molecab(K, s, W, D, L) {
    const { THREE, rbox, cyl, ball, torus } = L, body = K.gloss(K.pal.c), d = 0.84, top = u(40);
    // the cabinet and its play top, six holes with two moles up
    K.put(rbox(u(28), u(30), d, 0.03), body, 0, u(15), 0);
    K.put(rbox(u(30), u(10), d + 0.04, 0.03), K.gloss(L.tone(K.pal.m, 1.15)), 0, u(35), 0);
    const holes = [];
    for (const z of [-0.18, 0.14]) for (const x of [X(7), X(16), X(25)]) holes.push([x, z]);
    for (const [x, z] of holes) {
      K.put(cyl(u(3.2), 0.01, u(3.2), 20), K.plain('#1a0e06'), x, top + 0.001, z);
      K.put(torus(u(3.2), 0.01, Math.PI * 2, 20), K.gloss(INK), x, top + 0.004, z, 0, Math.PI / 2);
    }
    const mole = K.gloss('#a8784a');
    for (const [i, up] of [[1, u(7)], [3, u(5)]]) {
      const [x, z] = holes[i];
      K.put(cyl(u(2.8), up, u(3), 18), mole, x, top + up / 2, z);
      K.put(ball(u(2.8), 18, 12), mole, x, top + up, z);
      K.put(ball(u(1.1), 10, 8), K.gloss('#f8a0a8'), x, top + up - u(0.5), z + u(2.6));
      for (const sg of [-1, 1]) K.put(ball(u(0.5), 8, 6), K.gloss(INK), x + sg * u(1), top + up + u(0.9), z + u(2.4));
    }
    // two posts up the back to a sign of flowers, painted
    for (const sg of [-1, 1]) K.put(rbox(u(2), u(38), u(2), 0.006), K.metal(K.pal.m), sg * u(11), top + u(18), -d / 2 + 0.06);
    K.put(rbox(u(26), u(14), 0.06, 0.02), body, 0, u(81), -d / 2 + 0.06);
    K.put(new THREE.PlaneGeometry(u(24), u(12)), K.pic(pcrop(K, L, 4, 87, 28, 75).canvas), 0, u(81), -d / 2 + 0.092);
    // the mallet lying on the front edge
    K.put(cyl(0.014, 0.34, 0.014, 10).rotateZ(Math.PI / 2), K.wood(K.pal.w), 0.06, top + 0.02, d / 2 - 0.06, 0.5);
    K.put(rbox(0.1, 0.1, 0.16, 0.03).rotateY(0.5), K.gloss('#e04848'), 0.22, top + 0.05, d / 2 - 0.15);
  },

  cockpit(K, s, W, D, L) {
    const { THREE, rbox, cyl, torus, blob } = L, col = K.cloth(K.pal.c), body = K.gloss(K.pal.c), dark = K.gloss(INK);
    // a low platform under it all
    K.put(rbox(W - 0.06, u(8), 0.86, 0.03), K.metal(K.pal.m), 0, u(4), 0);
    // the bucket seat on the left facing the cabinet, a white racing stripe down it
    K.put(rbox(0.82, u(6), 0.56, 0.06), col, -0.4, u(8) + u(3), 0);
    K.put(blob(0.62, 0.12, 0.5, 0.5, 0.5), col, -0.4, u(16) + 0.02, 0);
    K.put(blob(0.16, u(32), 0.52, 0.5, 0.6), col, -0.84, u(28), 0, 0, 0, 0.2);
    for (const sz of [-1, 1]) K.put(blob(0.5, 0.14, 0.1, 0.5, 0.5), K.cloth(L.tone(K.pal.c, 0.85)), -0.45, u(18), sz * 0.27);
    K.put(rbox(0.04, u(26), u(4), 0.01), K.cloth('#ffffff'), -0.75, u(29), 0, 0, 0, 0.2);
    // the cabinet on the right, its screen turned to the seat, the wheel and pedals before it
    const cx = 0.6, cw = 0.66;
    K.put(rbox(cw, u(74), 0.78, 0.03), body, cx, u(8) + u(37), 0);
    K.put(new THREE.PlaneGeometry(0.76, u(60)), L.decal(racerSide(K.pal.c)), cx, u(42), 0.392);
    K.put(new THREE.PlaneGeometry(0.76, u(60)).rotateY(Math.PI), L.decal(racerSide(K.pal.c)), cx, u(42), -0.392);
    K.put(rbox(0.04, u(22), 0.62, 0.01), dark, cx - cw / 2 - 0.01, u(58), 0);
    K.put(new THREE.PlaneGeometry(u(26) * 0.9, u(20)).rotateY(-Math.PI / 2), L.litPic(pcrop(K, L, 34, 67, 58, 49).canvas, 0.8), cx - cw / 2 - 0.032, u(58), 0);
    K.put(rbox(0.05, u(8), 0.66, 0.01), K.gloss(MARQUEE), cx - cw / 2 - 0.01, u(76), 0);
    K.put(new THREE.PlaneGeometry(0.6, u(6)).rotateY(-Math.PI / 2), K.glow(MARQUEE), cx - cw / 2 - 0.037, u(76), 0);
    K.put(rbox(0.22, 0.08, 0.3, 0.02), dark, cx - cw / 2 - 0.1, u(34), 0, 0, 0, 0.3);
    K.put(torus(u(6), 0.018, Math.PI * 2, 24), dark, cx - cw / 2 - 0.2, u(40), 0, Math.PI / 2, 0, -0.35);
    K.put(cyl(0.015, u(12), 0.015, 8).rotateX(Math.PI / 2), dark, cx - cw / 2 - 0.2, u(40), 0, Math.PI / 2, 0, -0.35);
    for (const sz of [-0.08, 0.08]) K.put(rbox(0.06, 0.02, 0.07, 0.006), K.metal(CHROME), cx - cw / 2 - 0.08, u(8) + 0.04, sz, 0, 0, 0.4);
  },

  sevenblock(K, s, W, D, L) {
    const { THREE, rbox } = L, gold = K.metal(GOLD), red = K.gloss('#d83a3a');
    // a marble plinth, a gold block on it, a cream panel each side with a red seven standing out of it
    K.put(rbox(u(22), u(12), 0.62, 0.02), K.gloss(MARBLE), 0, u(6), 0);
    K.put(rbox(u(24), u(28), 0.7, 0.05), gold, 0, u(26), 0);
    for (const turn of [0, Math.PI]) {
      K.put(rbox(u(18), u(22), 0.02, 0.008).translate(0, 0, 0.35), K.gloss('#fff8e8'), 0, u(26), 0, turn);
      const g = new THREE.ExtrudeGeometry(sevenShape(L, u(16)), { depth: 0.03, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.006, bevelSegments: 2 });
      g.translate(0, u(18), 0.36);
      K.put(g, red, 0, 0, 0, turn);
    }
  },
  /* ----- Greenhouse ----- */

  terrarium(K, s, W, D, L) {
    const { lathe, cyl, rbox, ball } = L, wood = K.wood(), brass = K.metal('#d8a838'), r = u(13), y0 = u(26);
    // a little table: four legs and a top
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.put(cyl(u(1.5), u(20), u(1.3), 12), wood, sx * u(9.5), u(10), sz * 0.2);
    K.put(rbox(u(28), u(5), 0.6, 0.015), wood, 0, u(21.5), 0);
    // the brass foot, soil over a band of stones, the garden, the glass dome over it all and its knob
    K.put(cyl(r + u(1), u(2), r + u(1), 32), brass, 0, u(25), 0);
    K.put(cyl(r - u(0.5), u(2), r - u(0.5), 28), K.plain(STONE), 0, y0 + u(1), 0);
    K.put(cyl(r - u(0.5), u(4), r - u(0.5), 28), K.plain('#5a3a24'), 0, y0 + u(4), 0);
    GARDENS[s.jar](K, L, y0 + u(6));
    const dome = [[r, 0], [r, u(26)]];
    for (let i = 1; i <= 10; i++) { const a = i / 10 * Math.PI / 2; dome.push([Math.cos(a) * r, u(26) + Math.sin(a) * u(14)]); }
    dome[dome.length - 1][0] = 0.001;
    K.put(lathe(dome, 32), K.glass(), 0, y0, 0);
    K.put(ball(u(2), 14, 10), brass, 0, y0 + u(41), 0);
  },

  seedrack(K, s, W, D, L) {
    const { THREE, rbox } = L, metal = K.metal(K.pal.m);
    // four posts, a header in the theme's colour, a mesh back
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.put(rbox(u(2), u(84), u(2), 0.006), metal, sx * u(13), u(42), sz * 0.14);
    K.put(rbox(u(28), u(7), 0.34, 0.02), K.gloss(K.pal.c), 0, u(86.5), 0);
    K.put(rbox(u(26), u(80), 0.01, 0.003), K.plain(L.tone(K.pal.m, 0.7)), 0, u(42), -0.14);
    // five wire shelves, each a row of seed packets leaning back, their faces off the painting
    for (let r = 0; r < 5; r++) {
      const top = 80 - r * 15, y = u(top - 12);
      K.put(rbox(u(26), 0.012, 0.26, 0.004), metal, 0, y, 0);
      K.put(rbox(u(26), u(2), 0.01, 0.003), metal, 0, y + u(1), 0.13);
      const c = pcrop(K, L, 4, top, 30, top - 11);
      K.put(rbox(u(26), u(11), 0.02, 0.004).translate(0, u(5.5), 0).rotateX(-0.2), K.plain('#f4f0e0'), 0, y + 0.006, 0.04);
      K.put(new THREE.PlaneGeometry(u(26), u(11)).translate(0, u(5.5), 0.011).rotateX(-0.2), K.pic(c.canvas), 0, y + 0.006, 0.04);
    }
  },

  sprinkler(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, metal = K.metal(K.pal.m), spray = K.M('glass', WATER, { key: 'spray' }), drop = K.gloss(L.tone(WATER, 1.25));
    // a spike in the ground, its pipe, the spinning head with a coloured cap
    K.put(cyl(0.012, 0.08, 0.002, 8), metal, 0, 0.04, 0);
    K.put(rbox(0.16, 0.012, 0.03, 0.004), metal, 0, 0.09, 0);
    K.put(cyl(u(1), u(28), u(1), 10), metal, 0, u(2) + u(14), 0);
    K.put(rbox(u(8), u(3), u(3), 0.008), metal, 0, u(31.5), 0, 0.5);
    K.put(ball(u(2), 12, 10), K.gloss(K.pal.c), 0, u(34), 0);
    // four arcs of spray out of it, drops along them
    for (let k = 0; k < 4; k++) {
      const a = 0.5 + k * Math.PI / 2, reach = k % 2 ? 0.34 : 0.44, rise = k % 2 ? u(14) : u(22), pts = [];
      for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push([Math.cos(a) * t * reach, u(34) + Math.sin(t * Math.PI) * rise - t * u(30), Math.sin(a) * t * reach]); }
      K.put(tube(L, pts, 0.014, 24), spray);
      for (let i = 2; i <= 8; i += 2) K.put(ball(0.022, 8, 6), drop, ...pts[i].map((v, j) => v + (j === 1 ? 0.012 : 0)));
    }
  },

  growlamp(K, s, W, D, L) {
    const { THREE, rbox, cyl, ball } = L, metal = K.metal(K.pal.m), green = K.gloss(K.pal.leaf);
    // a long planter of soil with two rows of seedlings
    K.put(rbox(u(28), u(8), 0.5, 0.02), metal, 0, u(4), 0.04);
    K.put(rbox(u(26), 0.01, 0.46, 0.004), K.plain('#5a3a24'), 0, u(8), 0.04);
    for (let n = 0; n < 6; n++) for (const z of [-0.08, 0.14]) {
      const x = X(5.5 + n * 4.4);
      K.put(cyl(0.005, u(4), 0.006, 6), K.gloss(L.tone(K.pal.leaf, 0.8)), x, u(10), z);
      for (const sg of [-1, 1]) K.put(ball(0.022, 10, 6).scale(1.4, 0.3, 0.8), green, x + sg * 0.02, u(12), z, 0, 0, -sg * 0.4);
    }
    // the stand at the back, its arm and the lamp hanging over the planter, lit underneath
    K.put(cyl(u(1.5), u(62), u(1.5), 12), metal, X(29.5), u(39), -0.2);
    K.put(rbox(u(26), u(2), u(2), 0.006), metal, X(17), u(68.5), -0.2);
    K.put(rbox(u(22), u(5), 0.42, 0.02), metal, X(15), u(64.5), 0.02);
    K.put(rbox(u(22), u(1), 0.04, 0.004), metal, X(15), u(67.5), -0.18);
    K.put(new THREE.PlaneGeometry(u(20), 0.36).rotateX(Math.PI / 2), K.glow('#e878f0'), X(15), u(62) - 0.002, 0.02);
  },

  flytrap(K, s, W, D, L) {
    const top = potOf(K, L), stem = K.gloss(L.tone(K.pal.leaf, 0.82));
    // three traps on stems out of the pot, opening outwards
    for (const [i, j, turn] of [[8, 14, -0.9], [16, 28, 0.1], [24, 16, 1.0]]) {
      const x = X(i), y = top + u(j) - u(2), z = 0.06;
      K.put(tube(L, [[0, top, 0], [x * 0.4, top + u(j) * 0.6, z * 0.4], [x, y, z]], 0.01, 12), stem);
      trap(K, L, x, y, z, turn, u(3.6));
    }
    for (let i = 0; i < 5; i++) leaf(K, L, K.gloss(K.pal.leaf), 0, top, 0, i * 1.26, 1.35, u(7), u(2), 0.05);
  },

  monstera(K, s, W, D, L) {
    const top = potOf(K, L, 'basket'), stem = K.gloss(L.tone(K.pal.leaf, 0.8)), leafM = [K.gloss(K.pal.leaf), K.gloss(L.tone(K.pal.leaf, 1.08))];
    // five big split leaves on long stems, leaning out every way
    [[9, 38, -1, 0.1], [24, 46, 1, -0.12], [15, 62, 0, -0.05], [23, 26, 1, 0.22], [8, 24, -1, 0.2]].forEach(([i, j, d, z], n) => {
      const x = X(i), y = u(j) - u(6);
      K.put(tube(L, [[0, top, 0], [x * 0.3, top + (y - top) * 0.7, z * 0.3], [x * 0.85, y, z]], 0.012, 14), stem);
      const g = monsteraLeaf(L, 0.56, 0.5);
      g.rotateX(-0.5 - (y < u(30) ? 0.4 : 0)); g.rotateZ(-d * 0.6); g.rotateY(d * 0.5 + (z < 0 ? Math.PI * 0.15 : 0));
      K.put(g, leafM[n % 2], x * 0.85, y, z);
    });
  },

  orchidstand(K, s, W, D, L) {
    const { rbox, cyl } = L, wood = K.wood();
    // a little stand, a pot on it, two broad leaves, a cane and an arching spray of flowers
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.put(cyl(u(1), u(16), u(1), 10), wood, sx * u(6), u(8), sz * 0.12);
    K.put(rbox(u(18), u(4), 0.36, 0.012), wood, 0, u(18), 0);
    const soil = littlePot(K, L, 0, u(20), 0, u(6), u(10));
    leaf(K, L, K.gloss(K.pal.leaf), 0, soil, 0, -1.5, 1.3, u(11), u(3.4), 0.1);
    leaf(K, L, K.gloss(L.tone(K.pal.leaf, 1.1)), 0, soil, 0, 1.6, 1.35, u(11), u(3.4), 0.1);
    leaf(K, L, K.gloss(K.pal.leaf), 0, soil, 0, 0.2, 1.2, u(8), u(3), 0.1);
    K.put(cyl(0.008, u(38), 0.008, 6), K.gloss(BAMBOO), X(15.5), soil + u(19), -0.02);
    K.put(tube(L, [[X(16), soil, 0], [X(16), u(54), 0], [X(19), u(66), 0.02], [X(25), u(70), 0.04]], 0.007, 16), K.gloss(L.tone(K.pal.leaf, 0.7)));
    for (let n = 0; n < 4; n++) flower(K, L, X(18.5 + n * 2.5), u(68 - n * 7), 0.05, K.pal.c, 0.075, 0, 0.15);
  },

  compostbin(K, s, W, D, L) {
    const { rbox, ball, blob } = L, R = K.r, wood = K.wood(), post = K.wood(L.tone(K.pal.w, 0.8)), d = 0.68;
    // a bin of slats nailed to four posts, gaps between them, full of compost
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.put(rbox(u(3), u(46), u(3), 0.008), post, sx * u(13), u(23), sz * (d / 2 - u(1.5)));
    for (let r = 0; r < 5; r++) {
      const y = u(5 + r * 9);
      for (const sz of [-1, 1]) K.put(rbox(u(28), u(6), 0.03, 0.006), wood, 0, y, sz * (d / 2 - 0.015));
      for (const sx of [-1, 1]) K.put(rbox(0.03, u(6), d - 0.02, 0.006), wood, sx * u(13.5), y, 0);
    }
    K.put(rbox(u(24), u(42), d - 0.08, 0.01), K.plain(SOIL), 0, u(21), 0);
    K.put(blob(u(24), u(6), d - 0.1, 0.8, 0.6), K.cloth('#5a3a24'), 0, u(43), 0);
    for (let i = 0; i < 10; i++) K.put(ball(0.02 + R() * 0.02, 8, 6), K.cloth('#7a5a3a'), (R() - 0.5) * 0.6, u(45), (R() - 0.5) * 0.5);
    K.put(blob(0.1, 0.02, 0.05, 0.6, 0.6), K.gloss('#f8d030'), -0.13, u(46), 0.08, 0.6);
    K.put(ball(0.04, 10, 8).scale(1.4, 0.3, 0.8), K.gloss(K.pal.leaf), 0.13, u(46.5), -0.04, -0.4);
    K.put(ball(0.03, 10, 8).scale(1, 0.6, 1), K.gloss('#f8f6f0'), 0.02, u(46), 0.12);
  },

  tomatovine(K, s, W, D, L) {
    const { ball, cyl } = L, top = potOf(K, L), stem = K.gloss(L.tone(K.pal.leaf, 0.8));
    // two canes and two crossbars, the vine winding up between them, leaves and tomatoes on it
    for (const x of [X(9.5), X(23.5)]) cane(K, L, x, top - 0.1, -0.04, u(84) - top + 0.1, u(1));
    for (const y of [u(40), u(64)]) K.put(cyl(u(0.8), u(15), u(0.8), 8).rotateZ(Math.PI / 2), K.gloss(BAMBOO), 0, y, -0.04);
    const pts = [];
    for (let j = 0; j <= 60; j += 6) pts.push([u(Math.sin(j / 8) * 4), top + u(j), Math.cos(j / 8) * 0.04]);
    K.put(tube(L, pts, 0.012, 30), stem);
    for (const [i, j, r] of [[12, 20, 6.5], [20, 36, 6.5], [13, 52, 5.5]]) bush(K, L, X(i), top + u(j), -0.02, u(r), 8);
    for (const [i, j, c] of [[18, 15, '#e04838'], [9, 30, '#e04838'], [23, 46, '#f08a38'], [15, 60, '#78c048'], [21, 24, '#e04838']]) {
      const x = X(i), y = top + u(j), z = 0.17;
      K.put(ball(u(3), 16, 12).scale(1, 0.88, 1), K.gloss(c), x, y, z);
      for (let k = 0; k < 5; k++) K.put(ball(0.012, 6, 4).scale(2, 0.5, 0.8).translate(0.018, 0, 0).rotateY(k * 1.26), K.gloss(K.pal.leaf), x, y + u(2.6), z);
    }
  },

  citrustree(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, R = K.r, pot = K.gloss(K.pal.pot);
    // a square planter, a short trunk, a round crown dotted with lemons
    K.put(rbox(u(20), u(18), u(20), 0.03), pot, 0, u(9), 0);
    K.put(rbox(u(21), u(1), u(21), 0.006), K.gloss(L.tone(K.pal.pot, 0.82)), 0, u(6), 0);
    K.put(rbox(u(21), u(2), u(21), 0.015), K.gloss(L.tone(K.pal.pot, 1.1)), 0, u(17.5), 0);
    K.put(rbox(u(18), 0.01, u(18), 0.004), K.plain(SOIL), 0, u(18.5), 0);
    K.put(cyl(u(1.3), u(30), u(2), 12), K.wood(K.pal.w), 0, u(33), 0);
    bush(K, L, X(10), u(52), 0.04, u(7.5), 10);
    bush(K, L, X(23), u(52), 0.0, u(7.5), 10);
    bush(K, L, X(16), u(61), -0.02, u(11), 14);
    for (let n = 0; n < 10; n++) {
      const a = (R() - 0.5) * Math.PI * 1.4 + Math.PI / 2, e = (R() - 0.3) * 1.1, r = u(11.5);
      K.put(ball(u(2.1), 12, 10).scale(1, 1.25, 1), K.gloss('#f8e040'), Math.cos(a) * Math.cos(e) * r * 1.2, u(58) + Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r);
    }
  },

  lilytub(K, s, W, D, L) {
    const { THREE, cyl, ball, blob } = L, pad = [K.gloss(K.pal.leaf), K.gloss(L.tone(K.pal.leaf, 1.12))], h = u(18);
    // a half barrel of water, lily pads on it, a lotus open on one, cattails standing up at the back
    tub(K, L, 0, 0, 0, u(14), h, K.metal(K.pal.m));
    K.put(cyl(u(13), 0.01, u(13), 28), K.gloss(WATER), 0, h - 0.04, 0);
    for (const [x, z, r, n] of [[-u(7), 0.08, u(4.4), 0], [u(4), 0.12, u(3.4), 1], [u(2), -0.16, u(4), 0], [-u(4), -0.12, u(2.6), 1]])
      K.put(new THREE.CylinderGeometry(r, r, 0.008, 22, 1, false, 0.4, Math.PI * 2 - 0.5), pad[n], x, h - 0.03, z, x + z * 7);
    const lx = -u(4), lz = 0.06, ly = h - 0.02;
    for (let i = 0; i < 10; i++) {
      const a = i / 5 * Math.PI, ring = i < 5, open = ring ? 1.0 : 0.5, len = ring ? 0.07 : 0.055;
      K.put(blob(0.035, len, 0.02, 0.6, 0.5).translate(0, len / 2, 0).rotateX(open).rotateY(a + (ring ? 0 : 0.6)), K.gloss(ring ? K.pal.c : L.tone(K.pal.c, 1.2)), lx, ly, lz);
    }
    K.put(ball(0.02, 10, 8), K.gloss('#f8d030'), lx, ly + 0.03, lz);
    for (const [x, z, hh] of [[X(24.5), -0.14, u(50)], [X(27.5), -0.06, u(44)]]) {
      K.put(cyl(0.007, hh - h, 0.008, 6), K.gloss(K.pal.leaf), x, h + (hh - h) / 2, z);
      K.put(cyl(u(1.4), u(7), u(1.4), 10), K.cloth('#7a4a2a'), x, hh - u(5), z);
    }
    leaf(K, L, K.gloss(L.tone(K.pal.leaf, 1.1)), X(26), h - 0.03, -0.1, 0.4, 0.15, u(30), u(1.2), 0.05);
  },

  seedtrays(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, R = K.r, tray = K.gloss(K.pal.m), plug = K.plain('#5a3a24'), green = K.gloss(K.pal.leaf);
    // two black trays of sixteen cells each, a seedling up in most cells
    for (const tx of [-W / 4, W / 4]) {
      K.put(rbox(W / 2 - 0.06, 0.12, D - 0.1, 0.02), tray, tx, 0.06, 0);
      const cw = (W / 2 - 0.16) / 4, cd = (D - 0.2) / 4;
      for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
        const x = tx - (W / 2 - 0.16) / 2 + (c + 0.5) * cw, z = -(D - 0.2) / 2 + (r + 0.5) * cd;
        K.put(rbox(cw - 0.02, 0.01, cd - 0.02, 0.004), plug, x, 0.115, z);
        if (R() < 0.82) {
          const h = 0.05 + R() * 0.06;
          K.put(cyl(0.004, h, 0.005, 5), K.gloss(L.tone(K.pal.leaf, 0.8)), x, 0.12 + h / 2, z);
          for (const sg of [-1, 1]) K.put(ball(0.024, 8, 6).scale(1.5, 0.35, 0.8), green, x + sg * 0.024, 0.12 + h, z, R() * 3, 0, -sg * 0.4);
        }
      }
    }
  },

  beanpole(K, s, W, D, L) {
    const { THREE, torus, ball, blob } = L, cane = K.gloss(BAMBOO), vine = K.gloss(L.tone(K.pal.leaf, 0.8)), leafM = K.gloss(K.pal.leaf);
    // a mound of soil, three canes tied in a tepee, a vine climbing each with leaves, red flowers and pods
    K.put(blob(0.82, 0.1, 0.78, 0.7, 0.6), K.plain('#5a3a24'), 0, 0.02, 0);
    const tip = [0, u(86), 0];
    [0.6, 2.7, 4.6].forEach((a, p) => {
      const base = [Math.sin(a) * 0.36, 0.02, Math.cos(a) * 0.36];
      rod(K, L, cane, base, tip, 0.016);
      const along = new THREE.Vector3(...tip).sub(new THREE.Vector3(...base)), n1 = new THREE.Vector3(0, 0, 1).cross(along).normalize(), n2 = along.clone().cross(n1).normalize(), pts = [];
      for (let t = 0.02; t <= 0.9; t += 0.03) {
        const w = t * 34 + p, c = new THREE.Vector3(...base).addScaledVector(along, t).addScaledVector(n1, Math.cos(w) * 0.028).addScaledVector(n2, Math.sin(w) * 0.028);
        pts.push([c.x, c.y, c.z]);
      }
      K.put(tube(L, pts, 0.009, 60), vine);
      pts.forEach((q, i) => {
        if (i % 2 === 1) leaf(K, L, leafM, q[0], q[1], q[2], i * 2.1 + p, 1.1, 0.13, 0.065, 0.03);
        if (i % 7 === 3) K.put(ball(0.024, 8, 6), K.gloss(K.pal.c), q[0] + 0.02, q[1], q[2] + 0.02);
        if (i % 9 === 5) K.put(ball(0.012, 8, 6).scale(1, 5, 1).translate(0, -0.05, 0), K.gloss(L.tone(K.pal.leaf, 1.15)), q[0], q[1], q[2] + 0.03, 0, 0.1);
      });
    });
    K.put(torus(0.03, 0.012, Math.PI * 2, 14), K.cloth(K.pal.c), 0, u(83), 0, 0, Math.PI / 2);
  },

  plantstair(K, s, W, D, L) {
    const { rbox } = L, wood = K.wood(), H = u(68);
    // an A-frame each side, three shelves stepping back and up, pots on each
    for (const sg of [-1, 1]) {
      rod(K, L, wood, [sg * u(12.5), 0, 0.34], [sg * u(3.5), H, -0.16], 0.022);
      rod(K, L, wood, [sg * u(12.5), 0, -0.34], [sg * u(3.5), H, -0.24], 0.022);
    }
    for (let s2 = 0; s2 < 3; s2++) {
      const y = u(20 + s2 * 22), f = y / H, zf = 0.34 - f * 0.5, zb = -0.34 + f * 0.1, w = u(28 - 8 * s2), z = (zf + zb) / 2;
      K.put(rbox(w, u(3), zf - zb + 0.04, 0.008), wood, 0, y - u(1.5), z);
      for (let n = 0; n < 3 - s2; n++) {
        const x = -w / 2 + u(5) + n * u(8), soil = littlePot(K, L, x, y, z + 0.02, u(3.2), u(7));
        if ((n + s2) % 2) for (const a of [-0.6, 0.6, 2.4]) leaf(K, L, K.gloss(K.pal.leaf), x, soil, z + 0.02, a, 0.7, u(6), u(1.8), 0.06);
        else { rod(K, L, K.gloss(L.tone(K.pal.leaf, 0.8)), [x, soil, z + 0.02], [x, soil + u(6), z + 0.02], 0.005); flower(K, L, x, soil + u(6), z + 0.03, n ? K.pal.c : K.pal.a, 0.04, 0, 0.5); }
      }
    }
  },

  gourdarch(K, s, W, D, L) {
    const { lathe, rbox, ball, cyl } = L, R = K.r, wood = K.wood(), rx = u(27), ry = u(24), y0 = u(58), greens = [K.gloss(K.pal.leaf), K.gloss(L.tone(K.pal.leaf, 1.12))];
    // two arches of posts and hoops, slats across their tops, leaves all along
    const arch = (t) => [Math.cos(Math.PI * (1 - t)) * rx, y0 + Math.sin(Math.PI * (1 - t)) * ry];
    for (const z of [-0.22, 0.22]) {
      for (const sg of [-1, 1]) K.put(rbox(u(4), y0, u(4), 0.01), wood, sg * rx, y0 / 2, z);
      const pts = [];
      for (let i = 0; i <= 24; i++) { const [x, y] = arch(i / 24); pts.push([x, y, z]); }
      K.put(tube(L, pts, u(1.5), 48), wood);
      for (let n = 0; n < 22; n++) { const [x, y] = arch((n + 0.5) / 22); K.put(ball(u(3), 10, 8).scale(1, 0.7, 0.9), greens[n % 2], x + (R() - 0.5) * 0.04, y + 0.02, z + (R() - 0.5) * 0.08); }
    }
    for (let n = 1; n < 8; n++) {
      const [x, y] = arch(n / 8);
      K.put(rbox(u(2), u(2), 0.56, 0.006), wood, x, y + u(1.5), 0);
      K.put(ball(u(3.4), 10, 8).scale(1, 0.6, 1.6), greens[n % 2], x, y + u(3), 0);
    }
    // gourds hanging from it on short stems
    for (const [i, c] of [[14, '#e8c048'], [26, '#7aa848'], [40, '#e8c048'], [50, '#f09838']]) {
      const x = X(i, 2), ya = y0 + Math.sqrt(Math.max(0, 1 - (x / rx) ** 2)) * ry, len = u(6);
      K.put(cyl(0.006, len, 0.006, 6), K.gloss(L.tone(K.pal.leaf, 0.8)), x, ya - len / 2, 0);
      K.put(lathe([[0.001, 0], [u(3.4), u(1)], [u(4), u(5)], [u(2.6), u(9)], [u(1.6), u(10)], [u(2.4), u(12.5)], [u(1.4), u(15)], [0.001, u(15.5)]], 18), K.gloss(c), x, ya - len - u(15.5), 0);
    }
  },
};
