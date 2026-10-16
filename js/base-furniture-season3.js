/* base-furniture-season3.js  -  three sets for the catalogue (2026-10-16, the user's ask: a catalogue as big as Animal
   Crossing's, seasonal sets its way, every piece a "3D detailed CLEAN" model, optimised). Each is one fixed colour
   (`solo`), modelled from parts in js/base-models-u.js:
   - Harvest (`holiday: 'harvest'`, js/data/holidays.js): a cornucopia, hay, gourds, a cider press, pies, leaves, squash.
     No jack-o'-lanterns (Spooky has them) and no scarecrow (Garden has one).
   - Winter holidays (`holiday: 'holidays'`): the tree, presents, stockings, a nutcracker, a gingerbread house, Stantler.
     Not the Winter shelf's snow and ice.
   - Party: a birthday party, no holiday, sold all year. No piñata (Festival has one). */

import { R, P, disc, oval, ovalShade, sphere, cyl, panel, wood, cushion, leaf, glass, floorShadow, ctx, sh } from './base-paint.js';

const OAK = '#a0703e', DARKWOOD = '#5e3c20', WICKER = '#c89a58', RUST = '#b4502a', PUMPKIN = '#e8822a', SQUASH = '#e8b440',
  GOURD = '#6a9a3a', CREAM = '#ece2bc', HAY = '#e2c46a', APPLE = '#c8382a', APPLEG = '#9ac040', LEAFR = '#c8402a',
  LEAFO = '#e8862a', LEAFY = '#e8c040', WHEAT = '#e8c878', STEM = '#5a6a2a', ACORN = '#a8682e', CAP = '#6a4a2a',
  IRON = '#3a3a40', TIN = '#b8bcc4', MOON = '#f8a848', HUSK = '#e8d8a0';
const FIR = '#2f7a4a', RED = '#d03030', GREEN = '#2f8a4a', GOLD = '#f0c040', SNOW = '#f4f8fc', GINGER = '#b8783a',
  ICING = '#fbfbf4', BLACK = '#2a2a30', SKIN = '#f4d0b0', STAG = '#a07048', STAGL = '#e8d8b0', ANTLER = '#cbbca0',
  BULB = '#fff0a0', BLUEB = '#4a7ad8';
const PINK = '#f47aa8', BLUE = '#58a8f0', YELLOW = '#f8d048', MINT = '#6ad8b0', PURPLE = '#a878e8', ORANGE = '#f89a48',
  WHITE = '#fbfbf8', CAKE = '#fbf0dc', FLAME = '#ffd060';
const PARTY = [PINK, BLUE, YELLOW, MINT, PURPLE];

const words = (text, x, y, size, col, w) => {
  const g = ctx();
  g.font = `bold ${size}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = col; g.fillText(text, x, y, w);
};
const poly = (pts, c) => { const g = ctx(); g.fillStyle = c; g.beginPath(); pts.forEach(([a, b], i) => (i ? g.lineTo(a, b) : g.moveTo(a, b))); g.closePath(); g.fill(); };
const line = (pts, c, w) => { const g = ctx(); g.strokeStyle = c; g.lineWidth = w; g.beginPath(); pts.forEach(([a, b], i) => (i ? g.lineTo(a, b) : g.moveTo(a, b))); g.stroke(); };
const ring = (cx, cy, rx, ry, c, w) => { const g = ctx(); g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); g.stroke(); };
/** A two-tile piece painted 64 wide, squeezed into a side view's narrower `vw`. */
const wide = (x, vw, fn) => { if (vw === 64) return fn(); const g = ctx(); g.save(); g.translate(x, 0); g.scale(vw / 64, 1); g.translate(-x, 0); fn(); g.restore(); };

/** A pumpkin: lobes side by side, a stem. */
function pumpkin(cx, cy, rx, ry, c, stem = STEM) {
  ovalShade(cx, cy, rx, ry, c);
  for (const f of [-0.5, 0.5]) ovalShade(cx + f * rx, cy, rx * 0.52, ry * 0.96, c);
  ovalShade(cx, cy, rx * 0.46, ry, sh(c, 1));
  R(cx - 0.8, cy - ry - 2.6, 1.8, 3.4, stem);
}
/** A bow: two loops and a knot. */
function bow(cx, cy, s, c) {
  for (const f of [-1, 1]) { ovalShade(cx + f * s * 0.55, cy, s * 0.6, s * 0.42, c); poly([[cx, cy], [cx + f * s * 0.5, cy + s * 0.9], [cx + f * s * 0.15, cy + s * 0.9]], sh(c, -1)); }
  disc(cx, cy, s * 0.26, sh(c, -1));
}
/** A wrapped present seen from the front: the box, its lid, the ribbon down the front, a bow on top. */
function present(x, y, w, h, c, rib, bowAt = true) {
  panel(x, y, w, h, c);
  R(x - 0.5, y, w + 1, Math.min(3, h * 0.25), sh(c, 1)); R(x - 0.5, y + Math.min(3, h * 0.25), w + 1, 0.6, sh(c, -1));
  R(x + w / 2 - 1.2, y, 2.4, h, rib); R(x + w / 2 - 1.2, y, 0.7, h, sh(rib, 1));
  if (bowAt) bow(x + w / 2, y - 1.5, Math.min(5, w * 0.3), rib);
}
/** An acorn: the nut, its cap, a stalk. */
function acorn(cx, cy, r) {
  ovalShade(cx, cy + r * 0.25, r * 0.8, r, ACORN);
  ovalShade(cx, cy - r * 0.45, r * 0.95, r * 0.55, CAP); R(cx - 0.4, cy - r * 1.2, 0.9, r * 0.5, CAP);
}
/** A candy cane's stripes along a painted path of [x, y] points, `r` thick. */
function cane(pts, r) {
  line(pts, ICING, r * 2);
  const g = ctx();
  g.save(); g.setLineDash([r * 0.9, r * 1.1]); line(pts, RED, r * 2); g.restore();
}
/** A tapered horn along [x, y, r] points: wicker, a ring of weave every step. */
function horn(pts, c) {
  for (let i = 0; i < pts.length - 1; i++) for (let t = 0; t <= 1; t += 0.125) {
    const [x0, y0, r0] = pts[i], [x1, y1, r1] = pts[i + 1];
    disc(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r0 + (r1 - r0) * t, t < 0.5 ? c : sh(c, -1));
  }
  for (let i = 0; i < pts.length - 1; i++) { const [cx, cy, r] = pts[i]; ring(cx, cy, r * 0.3, r, sh(c, -1), 0.6); }
}

/* ---------- Harvest ---------- */
const harvest = (o) => ({ group: 'Harvest', holiday: 'harvest', solo: true, ...o });
/* ---------- Winter holidays ---------- */
const holidays = (o) => ({ group: 'Winter holidays', holiday: 'holidays', solo: true, ...o });
/* ---------- the birthday party, all year ---------- */
const party = (o) => ({ group: 'Party', solo: true, ...o });

export const SEASON_KINDS_3 = [
  // a side table, a wicker horn of plenty spilling a pumpkin, apples and grapes on its runner
  harvest({ id: 'harvesthorn', name: 'Cornucopia table', w: 2, h: 1, price: 700, draw(x, b, vw) { wide(x, vw, () => {
    floorShadow(x, b, 64);
    for (const lx of [x + 7, x + 51]) { cyl(lx, b - 27, 6, 25, DARKWOOD); R(lx - 1, b - 4, 8, 4, sh(DARKWOOD, -1)); }
    R(x + 13, b - 13, 38, 2, sh(DARKWOOD, -1));
    wood(x + 3, b - 31, 58, 5, OAK);
    panel(x + 22, b - 30, 20, 10, RUST); for (let i = 23; i < 42; i += 2) R(x + i, b - 20, 1, 2, sh(RUST, -1));
    horn([[42, 41, 9], [33, 40, 7.4], [25, 41, 5.8], [18, 43.5, 4.3], [13, 47, 3], [10.5, 51.5, 2], [11, 55, 1.2]].map(([a, h, r]) => [x + a, b - h, r]), WICKER);
    oval(x + 43, b - 41, 2.6, 8.4, '#4a2a14');
    for (const [a, h, c] of [[40, 52, WHEAT], [43, 53, WHEAT]]) { line([[x + a + 2, b - 44], [x + a, b - h]], sh(c, -1), 0.7); oval(x + a, b - h - 2, 1.2, 2.6, c); }
    for (const [a, h] of [[47, 48], [50, 48], [48.5, 45], [51.5, 45], [50, 42]]) sphere(x + a, b - h, 1.9, '#7a3a8a');
    pumpkin(x + 52, b - 37.5, 6.5, 5.5, PUMPKIN);
    sphere(x + 58.5, b - 34.5, 3.4, APPLE); sphere(x + 45, b - 34.5, 3.4, APPLEG);
    leaf(x + 44, b - 51, 3, 1.6, LEAFO, 0.5); leaf(x + 55, b - 44, 2.6, 1.4, LEAFR, -0.4);
  }); } }),
  // three hay bales stacked two and one, twine round each, a pumpkin and a gourd on top
  harvest({ id: 'haystack', name: 'Hay bale stack', w: 2, h: 1, price: 450, draw(x, b, vw) { wide(x, vw, () => {
    floorShadow(x - 1, b, 66);
    for (const [bx, by] of [[2, 0], [33, 0], [17, 18]]) {
      cushion(x + bx, b - by - 18, 29, 18, HAY, 2);
      for (let j = 3; j < 17; j += 2.5) for (let i = 2; i < 28; i += 4) R(x + bx + i + ((j * 3) % 3), b - by - 18 + j, 2.5, 0.6, sh(HAY, (i + j) % 2 ? -1 : 1));
      for (const f of [0.3, 0.7]) R(x + bx + f * 29 - 0.7, b - by - 18, 1.4, 18, '#9a5a2a');
    }
    pumpkin(x + 38, b - 41.5, 6, 5, PUMPKIN);
    ovalShade(x + 26, b - 39, 4, 3, GOURD); ovalShade(x + 22, b - 41, 2.4, 3.6, sh(GOURD, 1)); R(x + 21, b - 45.5, 1, 2, STEM);
    for (const [a, h] of [[6, 1], [60, 2], [30, 1]]) line([[x + a, b - h], [x + a + 4, b - h - 1.5]], sh(HAY, -1), 0.6);
  }); } }),
  // a two-step crate stand of pumpkins and gourds: orange, white, green and a yellow crookneck
  harvest({ id: 'gourdstand', name: 'Pumpkin and gourd display', w: 1, h: 1, price: 400, draw(x, b) {
    floorShadow(x, b, 32);
    wood(x + 2, b - 26, 28, 14, sh(OAK, -1)); wood(x + 1, b - 12, 30, 12, OAK);
    for (const fx of [x + 2, x + 28]) R(fx, b - 12, 2, 12, sh(OAK, -1));
    pumpkin(x + 22, b - 32, 5, 4.2, PUMPKIN);
    ovalShade(x + 9, b - 29, 3.6, 3, GOURD); for (let i = -2; i <= 2; i += 2) R(x + 9 + i, b - 31.5, 0.6, 5, sh(GOURD, -1));
    ovalShade(x + 14.5, b - 29.5, 2.4, 3.2, SQUASH); ovalShade(x + 13, b - 34, 1.2, 2.6, SQUASH);
    pumpkin(x + 10, b - 18, 7, 5.8, PUMPKIN);
    pumpkin(x + 23.5, b - 16.5, 5, 4.4, CREAM, '#7a8a4a');
  } }),
  // a wooden cider press: a slatted basket under a screw, the crank on top, a spout and a few apples
  harvest({ id: 'ciderpress', name: 'Apple cider press', w: 1, h: 1, price: 650, draw(x, b) {
    floorShadow(x, b, 32);
    wood(x + 1, b - 7, 30, 7, DARKWOOD); R(x + 13, b - 5, 6, 3, sh(DARKWOOD, -2));
    for (const px of [x + 2, x + 26]) wood(px, b - 60, 4, 53, OAK, 'y');
    wood(x + 1, b - 60, 30, 6, OAK);
    for (let i = 0; i < 6; i++) R(x + 9 + i * 2.6, b - 28, 2, 21, i % 2 ? sh(OAK, 1) : OAK);
    for (const h of [11, 24]) R(x + 8, b - h, 16, 1.6, IRON);
    panel(x + 8, b - 31, 16, 3, sh(OAK, -1));
    cyl(x + 15, b - 54, 2.4, 23, IRON); for (let h = 33; h < 53; h += 3) R(x + 14.6, b - h, 3.2, 0.8, sh(IRON, 1));
    cyl(x + 15, b - 66, 2.4, 6, IRON); R(x + 8, b - 66, 16, 2, IRON); for (const kx of [x + 8, x + 24]) disc(kx, b - 65, 1.8, DARKWOOD);
    sphere(x + 5.5, b - 9.5, 2.6, APPLE); sphere(x + 26.5, b - 9.5, 2.6, APPLEG);
  } }),
  // a wreath of autumn leaves, wheat ears, acorns and little gourds, an orange bow at its foot
  harvest({ id: 'harvestwreath', name: 'Harvest wreath', w: 1, h: 1, layer: 'wall', price: 300, wall(x) {
    const cx = x + 16, cy = 38;
    R(cx - 0.5, 14, 1, 14, sh(RUST, -1)); disc(cx, 14, 1.3, TIN);
    ring(cx, cy, 10, 10, '#6a4a2a', 3.4);
    const cols = [LEAFR, LEAFO, LEAFY, RUST];
    for (let a = 0; a < 18; a++) { const t = a / 18 * Math.PI * 2; leaf(cx + Math.cos(t) * 10.5, cy + Math.sin(t) * 10.5, 3.2, 1.8, cols[a % 4], Math.cos(t) * 0.6); }
    for (const t of [0.6, 2.5, 4.3]) { const ax = cx + Math.cos(t) * 9, ay = cy + Math.sin(t) * 9; oval(ax, ay, 1.4, 2.8, WHEAT); }
    for (const t of [1.6, 3.6, 5.4]) acorn(cx + Math.cos(t) * 10, cy + Math.sin(t) * 10, 1.8);
    pumpkin(cx - 7.5, cy - 7, 2.6, 2.2, PUMPKIN); pumpkin(cx + 8, cy - 6.5, 2.4, 2, CREAM);
    bow(cx, cy + 10.5, 6, ORANGE);
    for (const f of [-1, 1]) poly([[cx + f, cy + 11], [cx + f * 4, cy + 21], [cx + f * 2, cy + 20]], sh(ORANGE, -1));
  } }),
  // a corn-husk doll on a round stand: a husk skirt, stiff arms, a husk bonnet, tied with red twine
  harvest({ id: 'huskdoll', name: 'Corn-husk doll stand', w: 1, h: 1, price: 250, draw(x, b) {
    floorShadow(x + 4, b, 24);
    panel(x + 6, b - 4, 20, 4, OAK);
    poly([[x + 12, b - 26], [x + 20, b - 26], [x + 25, b - 4], [x + 7, b - 4]], HUSK);
    for (let i = 0; i < 5; i++) line([[x + 14 + i, b - 25], [x + 9 + i * 3.5, b - 5]], sh(HUSK, -1), 0.5);
    panel(x + 12, b - 36, 8, 10, sh(HUSK, -1));
    R(x + 5, b - 35, 22, 3, HUSK); for (const ex of [x + 5, x + 25]) R(ex, b - 35.5, 2, 4, sh(HUSK, -1));
    R(x + 11.5, b - 27, 9, 1.5, RED);
    disc(x + 16, b - 41, 4.6, HUSK); R(x + 14.5, b - 37.4, 3, 1.4, RED);
    poly([[x + 11, b - 40], [x + 16, b - 47], [x + 21, b - 40], [x + 22, b - 36], [x + 10, b - 36]], sh(HUSK, -1));
    disc(x + 16, b - 40, 3.2, HUSK);
  } }),
  // an iron rack of three cooling pies: cherry lattice, pumpkin and an apple crust
  harvest({ id: 'pierack', name: 'Pie cooling rack', w: 1, h: 1, price: 450, draw(x, b) {
    floorShadow(x, b, 32);
    for (const px of [x + 3, x + 27]) { cyl(px, b - 58, 2, 58, IRON); disc(px + 1, b - 59, 1.8, IRON); }
    const fill = ['#b02838', PUMPKIN, '#d8a858'];
    [6, 24, 42].forEach((h, i) => {
      R(x + 3, b - h - 1, 26, 1.4, IRON);
      panel(x + 5, b - h - 5, 22, 4, TIN);
      ovalShade(x + 16, b - h - 5.5, 10.5, 2.2, '#d8a058');
      if (i === 0) for (let j = 0; j < 4; j++) R(x + 8 + j * 5, b - h - 7, 2, 2, fill[0]);
      if (i === 1) oval(x + 16, b - h - 6, 8.4, 1.4, fill[1]);
      if (i === 2) { ovalShade(x + 16, b - h - 7, 9.5, 2.6, '#e0b070'); for (const sx of [-4, 0, 4]) R(x + 15.5 + sx, b - h - 8.5, 1, 1.6, sh('#e0b070', -2)); }
    });
  } }),
  // a heap of fallen leaves, red, orange and gold, a big Leafeon-tail leaf standing out of it
  harvest({ id: 'leafpile', name: 'Fallen leaf pile', w: 1, h: 1, price: 200, draw(x, b) {
    floorShadow(x - 1, b, 34);
    poly([[x + 24, b - 12], [x + 21, b - 30], [x + 23, b - 40], [x + 28, b - 30], [x + 27, b - 14]], '#a8c858');
    line([[x + 25, b - 12], [x + 24, b - 37]], sh('#a8c858', -1), 0.7);
    const g = ctx(); g.fillStyle = LEAFO; g.beginPath(); g.ellipse(x + 16, b, 15.5, 17, 0, Math.PI, 0); g.fill();
    const cols = [LEAFR, LEAFO, LEAFY, RUST];
    for (let i = 0; i < 26; i++) {
      const a = Math.PI + (i * 0.618 % 1) * Math.PI, d = 0.35 + ((i * 0.37) % 0.6);
      leaf(x + 16 + Math.cos(a) * 14 * d, b - 1 + Math.sin(a) * 15 * d, 2.8, 1.5, cols[i % 4], ((i * 7) % 5 - 2) * 0.3);
    }
    for (const [a, c] of [[2, LEAFR], [30, LEAFY]]) leaf(x + a, b - 1.5, 2.6, 1.2, c, 0.6);
  } }),
  // a harvest moon on a log stand, lit amber, a twig of autumn leaves curling up beside it
  harvest({ id: 'harvestmoon', name: 'Harvest moon lamp', w: 1, h: 1, price: 500, glow: [MOON, '#ffd890'], draw(x, b) {
    floorShadow(x + 3, b, 26);
    wood(x + 5, b - 6, 22, 6, OAK); oval(x + 16, b - 6, 11, 1.4, sh(OAK, 1));
    R(x + 12, b - 10, 8, 4, DARKWOOD);
    disc(x + 16, b - 23, 12.5, MOON); disc(x + 13, b - 26, 8, '#ffd890');
    for (const [a, h, r] of [[20, 28, 2.2], [11, 18, 1.8], [21, 17, 1.4], [14, 30, 1.2]]) disc(x + a, b - h, r, sh(MOON, -1));
    line([[x + 6, b - 6], [x + 3.5, b - 22], [x + 5, b - 38], [x + 10, b - 44]], DARKWOOD, 1.6);
    leaf(x + 3, b - 30, 2.6, 1.4, LEAFR, 0.6); leaf(x + 8, b - 42, 2.6, 1.4, LEAFO, -0.6); leaf(x + 12, b - 45, 2.4, 1.2, LEAFY, 0.3);
  } }),
  // a wooden wagon on spoked wheels, heaped with squash: butternut, acorn, pumpkin, crookneck
  harvest({ id: 'squashwagon', name: 'Wagon of squash', w: 2, h: 1, price: 900, draw(x, b, vw) { wide(x, vw, () => {
    floorShadow(x, b, 64);
    line([[x + 7, b - 16], [x + 1, b - 10]], DARKWOOD, 1.6); R(x, b - 12, 2, 5, DARKWOOD);
    wood(x + 6, b - 25, 52, 13, OAK);
    for (let i = 0; i < 3; i++) R(x + 6, b - 24 + i * 4.3, 52, 0.6, sh(OAK, -1));
    for (const px of [x + 6, x + 56]) R(px, b - 26, 2, 14, DARKWOOD);
    ovalShade(x + 18, b - 29, 8, 4.5, '#e8c890'); ovalShade(x + 11, b - 29, 4, 4, '#e8c890');
    pumpkin(x + 33, b - 32, 7.5, 6.5, PUMPKIN);
    ovalShade(x + 48, b - 30, 5, 4.5, '#3a5a2a'); for (const sx of [-2, 0, 2]) R(x + 48 + sx, b - 34, 0.6, 8, sh('#3a5a2a', 1));
    ovalShade(x + 24, b - 36, 3, 2.4, SQUASH); ovalShade(x + 21, b - 38.5, 1.4, 2.6, SQUASH);
    ovalShade(x + 43, b - 37.5, 3.6, 3, CREAM);
    for (const wx of [x + 16, x + 48]) {
      ring(wx, b - 9, 8, 8, DARKWOOD, 2);
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI; line([[wx - Math.cos(a) * 7.5, b - 9 - Math.sin(a) * 7.5], [wx + Math.cos(a) * 7.5, b - 9 + Math.sin(a) * 7.5]], sh(OAK, -1), 0.9); }
      disc(wx, b - 9, 2, IRON);
    }
  }); } }),
  // a maple log, a tin spile and a lidded sap bucket hung from it, a red leaf on top
  harvest({ id: 'syrupbucket', name: 'Maple syrup bucket', w: 1, h: 1, price: 350, draw(x, b) {
    floorShadow(x + 2, b, 28);
    cyl(x + 5, b - 54, 22, 54, '#7a5a3a');
    for (let i = 0; i < 6; i++) R(x + 7 + i * 3.4, b - 54, 0.8, 54, sh('#7a5a3a', -1));
    oval(x + 16, b - 54, 11, 2.2, '#e0c08a'); ring(x + 16, b - 54, 6, 1.2, '#c09a68', 0.6);
    leaf(x + 19, b - 56, 3, 1.6, LEAFR, 0.4);
    R(x + 15, b - 40, 2, 3, TIN);
    poly([[x + 9, b - 36], [x + 23, b - 36], [x + 22, b - 18], [x + 10, b - 18]], TIN);
    for (const h of [21, 33]) R(x + 9.6, b - h, 12.8, 1, sh(TIN, -1));
    poly([[x + 8, b - 36], [x + 16, b - 41], [x + 24, b - 36]], sh(TIN, 1));
  } }),
  // a long table of three planks on trestles, a burlap runner down it
  harvest({ id: 'harvesttable', name: 'Rustic harvest table', w: 2, h: 1, price: 800, draw(x, b, vw) { wide(x, vw, () => {
    floorShadow(x, b, 64);
    for (const lx of [x + 8, x + 50]) { wood(lx, b - 26, 6, 24, DARKWOOD, 'y'); R(lx - 3, b - 3, 12, 3, sh(DARKWOOD, -1)); R(lx - 2, b - 27, 10, 2, sh(DARKWOOD, 1)); }
    R(x + 14, b - 14, 36, 3, sh(DARKWOOD, -1));
    wood(x + 1, b - 31, 62, 5, OAK);
    R(x + 1, b - 31, 62, 0.6, sh(OAK, 1));
    panel(x + 24, b - 31, 16, 2, '#c8b080');
  }); } }),
  // a woven basket heaped with acorns, its handle up, two acorns fallen by it
  harvest({ id: 'acornbasket', name: 'Acorn basket', w: 1, h: 1, price: 200, draw(x, b) {
    floorShadow(x + 3, b, 26);
    ring(x + 16, b - 15, 9.5, 14, sh(WICKER, -1), 1.6);
    for (const [a, h] of [[10, 17], [14, 18.5], [18, 18.5], [22, 17], [12, 20.5], [16, 21.5], [20, 20.5]]) acorn(x + a, b - h, 2.4);
    poly([[x + 5, b - 15], [x + 27, b - 15], [x + 24, b], [x + 8, b]], WICKER);
    for (let h = 2; h < 15; h += 3) R(x + 7, b - h, 18, 1, sh(WICKER, -1));
    for (let i = 0; i < 6; i++) R(x + 9 + i * 3, b - 15, 0.7, 15, sh(WICKER, 1));
    R(x + 4, b - 16, 24, 2, sh(WICKER, 1));
    acorn(x + 3, b - 2.5, 2); acorn(x + 29, b - 2.5, 2);
  } }),

  // the tree: three tiers of fir, baubles and warm lights, a gold star, in a red stand
  holidays({ id: 'holidaytree', name: 'Holiday tree', w: 1, h: 1, price: 1200, glow: [BULB, GOLD], draw(x, b) {
    floorShadow(x, b, 32);
    poly([[x + 9, b - 11], [x + 23, b - 11], [x + 21, b], [x + 11, b]], RED); R(x + 9.5, b - 9, 13, 2, GOLD);
    R(x + 14, b - 15, 4, 4, DARKWOOD);
    for (const [top, bot, half] of [[56, 76, 8], [36, 60, 12], [14, 42, 15.5]]) poly([[x + 16, b - bot], [x + 16 + half, b - top], [x + 16 - half, b - top]], FIR);
    for (const [top, half] of [[56, 8], [36, 12], [14, 15.5]]) for (let i = -half + 1; i < half; i += 3) disc(x + 16 + i, b - top, 1.4, sh(FIR, -1));
    line([[x + 6, b - 24], [x + 26, b - 31]], GOLD, 0.9); line([[x + 8, b - 46], [x + 24, b - 51]], GOLD, 0.9);
    for (const [a, h, c] of [[10, 20, RED], [22, 22, BLUEB], [16, 30, GOLD], [12, 42, BLUEB], [21, 45, RED], [16, 61, GOLD]]) sphere(x + a, b - h, 1.9, c);
    for (const [a, h] of [[7, 18], [25, 18], [13, 26], [19, 36], [9, 39], [23, 40], [14, 52], [19, 57], [16, 70]]) disc(x + a, b - h, 1, BULB);
    const g = ctx(); g.fillStyle = GOLD; g.beginPath();
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 2.6 : 6; g.lineTo(x + 16 + Math.cos(a) * r, b - 81 + Math.sin(a) * r); }
    g.fill();
  } }),
  // a pile of presents: a big red one, a green, a blue on top and a little gold box
  holidays({ id: 'giftpile', name: 'Gift pile', w: 1, h: 1, price: 350, draw(x, b) {
    floorShadow(x, b, 32);
    present(x + 2, b - 14, 16, 14, RED, GOLD, false);
    present(x + 17, b - 10, 13, 10, GREEN, ICING, false);
    present(x + 19, b - 17, 8, 7, GOLD, RED);
    present(x + 5, b - 24, 11, 10, BLUEB, ICING);
  } }),
  // a little steam engine pulling a wagon of presents along a snowy plinth's track
  holidays({ id: 'holidayexpress', name: 'Holiday express', w: 2, h: 1, price: 700, draw(x, b, vw) { wide(x, vw, () => {
    floorShadow(x, b, 64);
    panel(x + 1, b - 6, 62, 6, SNOW); R(x + 1, b - 1.5, 62, 1.5, '#a8b8c8');
    for (let i = 3; i < 62; i += 4) R(x + i, b - 6.5, 2, 1, DARKWOOD);
    R(x + 1, b - 7.5, 62, 1, TIN);
    panel(x + 4, b - 14, 24, 4, GREEN); R(x + 28, b - 12, 4, 1.4, IRON);
    present(x + 6, b - 24, 9, 10, RED, GOLD); present(x + 16, b - 21, 10, 7, BLUEB, ICING);
    cyl(x + 42, b - 26, 15, 14, RED); disc(x + 57, b - 19, 6.8, sh(RED, -1)); disc(x + 57.5, b - 19, 3, GOLD);
    for (const h of [16, 22]) R(x + 44, b - h, 13, 1, GOLD);
    panel(x + 30, b - 32, 13, 22, GREEN); R(x + 29, b - 34, 15, 3, BLACK); panel(x + 33, b - 29, 7, 6, BULB);
    cyl(x + 51, b - 34, 5, 8, BLACK); R(x + 50, b - 35, 7, 2, GOLD);
    poly([[x + 57, b - 12], [x + 63, b - 7.5], [x + 57, b - 7.5]], BLACK);
    for (const wx of [x + 9, x + 23, x + 36, x + 46, x + 55]) { disc(wx, b - 10, 3.6, BLACK); disc(wx, b - 10, 1.4, GOLD); }
  }); } }),
  // a fir garland along the mantel's wall, warm lights in it, three stockings hung from it
  holidays({ id: 'stockinggarland', name: 'Stocking garland', w: 2, h: 1, layer: 'wall', price: 450, glow: [BULB], wall(x) {
    const sag = (i) => 22 + Math.sin(i / 64 * Math.PI) * 6;
    const st = [[12, RED, ICING], [32, GREEN, ICING], [52, RED, GREEN]];
    for (const [sx, c, cuff] of st) {
      const y0 = sag(sx) + 2;
      R(x + sx - 0.4, y0 - 2, 0.8, 3, GOLD);
      poly([[x + sx - 5, y0 + 2], [x + sx + 3, y0 + 2], [x + sx + 3, y0 + 18], [x + sx + 8, y0 + 21], [x + sx + 7, y0 + 27], [x + sx - 3, y0 + 27], [x + sx - 5, y0 + 22]], c);
      cushion(x + sx - 6, y0, 10, 6, cuff, 2);
      for (let h = 10; h < 22; h += 5) R(x + sx - 5, y0 + h, 8, 1.5, sh(c, 1));
    }
    for (let i = 5; i < 60; i += 1.5) disc(x + i, sag(i), 3.4, (i * 3) % 2 < 1 ? FIR : sh(FIR, -1));
    for (let i = 7; i < 58; i += 6) disc(x + i, sag(i) + 1.5, 1.2, BULB);
    for (const ex of [6, 58]) { bow(x + ex, 22, 4, RED); }
  } }),
  // Delibird's red sack of presents: tied at the neck, a white fluffy cuff, gifts and a candy cane poking out
  holidays({ id: 'delibirdsack', name: 'Delibird present sack', w: 1, h: 1, price: 500, draw(x, b) {
    floorShadow(x, b, 32);
    present(x + 6, b - 52, 9, 10, GREEN, GOLD, false); present(x + 16, b - 50, 9, 8, BLUEB, ICING, false);
    cane([[x + 23, b - 42], [x + 24, b - 56], [x + 26.5, b - 59], [x + 29, b - 56]], 1.3);
    const g = ctx(); g.fillStyle = RED; g.beginPath(); g.ellipse(x + 16, b - 17, 13.5, 17, 0, 0, Math.PI * 2); g.fill();
    ovalShade(x + 16, b - 18, 13, 17, RED); oval(x + 11, b - 24, 4, 8, sh(RED, 1));
    poly([[x + 11, b - 33], [x + 21, b - 33], [x + 19, b - 38], [x + 13, b - 38]], sh(RED, -1));
    R(x + 11.5, b - 38, 9, 2, ICING);
    cushion(x + 7, b - 45, 18, 7, ICING, 3);
  } }),
  // a nutcracker soldier: a tall black hat and plume, a red coat with gold buttons, white trousers and boots
  holidays({ id: 'nutcracker', name: 'Nutcracker soldier', w: 1, h: 1, price: 450, draw(x, b) {
    floorShadow(x + 4, b, 24);
    panel(x + 7, b - 5, 18, 5, BLACK); R(x + 7, b - 3, 18, 1, GOLD);
    for (const lx of [x + 11, x + 17]) { cyl(lx, b - 26, 4, 21, ICING); cyl(lx - 0.3, b - 13, 4.6, 8, BLACK); }
    panel(x + 9, b - 46, 14, 21, RED); R(x + 9, b - 30, 14, 2.4, ICING); R(x + 15, b - 30.5, 2, 3.4, GOLD);
    for (const h of [34, 38, 42]) disc(x + 16, b - h, 0.9, GOLD);
    for (const ax of [x + 6, x + 23]) { cyl(ax, b - 45, 3, 15, RED); disc(ax + 1.5, b - 29.5, 1.8, ICING); }
    for (const ex of [x + 7.5, x + 24.5]) oval(ex, b - 45.5, 3, 1.6, GOLD);
    R(x + 25.5, b - 44, 1, 16, GOLD); disc(x + 26, b - 45, 1.6, GOLD);
    panel(x + 11, b - 56, 10, 10, SKIN); R(x + 11, b - 49, 10, 3, ICING);
    for (const ex of [x + 13.5, x + 18.5]) disc(ex, b - 53, 0.8, BLACK);
    R(x + 13, b - 50.5, 6, 1, '#f8f0e0'); R(x + 13.5, b - 49.5, 5, 0.8, '#a83a3a');
    for (const cx of [x + 12.5, x + 19.5]) disc(cx, b - 51.5, 1, '#f4a0a0');
    cyl(x + 10, b - 72, 12, 16, BLACK); R(x + 10, b - 59, 12, 1.6, GOLD); R(x + 10, b - 71, 12, 1.2, GOLD);
    oval(x + 16, b - 75, 2.2, 3.6, RED);
  } }),
  // a gingerbread house on a cake board: iced eaves, gumdrops, a candy door and candy-cane posts
  holidays({ id: 'gingerhouse', name: 'Gingerbread house', w: 1, h: 1, price: 550, draw(x, b) {
    floorShadow(x, b, 32);
    panel(x + 1, b - 3, 30, 3, '#d8dce4');
    poly([[x + 5, b - 3], [x + 27, b - 3], [x + 27, b - 21], [x + 16, b - 33], [x + 5, b - 21]], GINGER);
    poly([[x + 2, b - 21], [x + 16, b - 37], [x + 30, b - 21], [x + 27, b - 20], [x + 16, b - 33], [x + 5, b - 20]], ICING);
    for (let i = 0; i < 6; i++) { const f = (i + 0.5) / 6; disc(x + 3 + f * 13, b - 22 - f * 14, 1.3, PARTY[i % 5]); disc(x + 29 - f * 13, b - 22 - f * 14, 1.3, PARTY[(i + 2) % 5]); }
    panel(x + 13, b - 13, 6, 10, RED); disc(x + 17.5, b - 8, 0.6, GOLD);
    for (const wx of [x + 7, x + 21]) { panel(wx, b - 17, 4, 4, YELLOW); R(wx - 0.5, b - 13.4, 5, 1, ICING); }
    panel(x + 13.5, b - 27, 5, 5, YELLOW);
    for (let i = 5; i < 27; i += 2) disc(x + i + 0.5, b - 3.5, 0.8, ICING);
    cane([[x + 3, b - 3], [x + 3, b - 14], [x + 4.5, b - 16], [x + 6, b - 14.5]], 0.9);
    cane([[x + 29, b - 3], [x + 29, b - 14], [x + 27.5, b - 16], [x + 26, b - 14.5]], 0.9);
  } }),
  // two great candy canes leaning in to an arch, a red bow where they meet, holly at their feet
  holidays({ id: 'candyarch', name: 'Candy cane arch', w: 2, h: 1, price: 650, draw(x, b, vw) { wide(x, vw, () => {
    floorShadow(x, b, 64);
    for (const s of [-1, 1]) {
      const fx = (a) => x + 32 + s * a;
      cane([[fx(23), b], [fx(23), b - 44], [fx(21), b - 54], [fx(14), b - 61], [fx(4), b - 64]], 3);
      ovalShade(fx(23), b - 2, 6, 2.6, SNOW);
      for (const [a, t] of [[20, 0.5], [26, -0.5]]) leaf(fx(a), b - 5, 2.6, 1.3, GREEN, t);
      for (const a of [22, 24]) disc(fx(a), b - 6, 1, RED);
    }
    bow(x + 32, b - 64, 7, RED);
    for (const f of [-1, 1]) poly([[x + 32 + f, b - 63], [x + 32 + f * 5, b - 52], [x + 32 + f * 3, b - 51]], sh(RED, -1));
  }); } }),
  // a fir wreath: pine cones, holly berries, gold baubles, warm lights twined in, a red velvet bow on top
  holidays({ id: 'holidaywreath', name: 'Holiday wreath', w: 1, h: 1, layer: 'wall', price: 300, glow: [BULB], wall(x) {
    const cx = x + 16, cy = 40;
    for (let a = 0; a < 30; a++) { const t = a / 30 * Math.PI * 2, r = 10 + (a % 3) - 1; disc(cx + Math.cos(t) * r, cy + Math.sin(t) * r, 3.4, a % 2 ? FIR : sh(FIR, -1)); }
    for (const t of [0.4, 2.0, 3.3, 4.6]) { const px = cx + Math.cos(t) * 10, py = cy + Math.sin(t) * 10; ovalShade(px, py, 1.8, 2.6, '#7a5232'); }
    for (const t of [1.2, 2.7, 5.4]) for (const d of [-1, 1]) disc(cx + Math.cos(t) * 10 + d, cy + Math.sin(t) * 10, 1.2, RED);
    for (const t of [0.9, 3.9, 6.0]) sphere(cx + Math.cos(t) * 10.5, cy + Math.sin(t) * 10.5, 1.8, GOLD);
    for (let a = 0; a < 10; a++) { const t = a / 10 * Math.PI * 2 + 0.3; disc(cx + Math.cos(t) * 12.5, cy + Math.sin(t) * 12.5, 0.9, BULB); }
    bow(cx, cy - 11, 6.5, RED);
    for (const f of [-1, 1]) poly([[cx + f, cy - 10], [cx + f * 5, cy - 1], [cx + f * 3, cy]], sh(RED, -1));
  } }),
  // Stantler carved in wood, side on: its great curled antlers and their dark orbs, on a snowy base
  holidays({ id: 'stantlerfig', name: 'Stantler figure', w: 1, h: 1, price: 600, draw(x, b) {
    floorShadow(x + 2, b, 28);
    panel(x + 3, b - 4, 26, 4, SNOW);
    for (const [lx, d] of [[7, -1], [10.5, 0], [18.5, -1], [22, 0]]) { cyl(x + lx, b - 20, 2.4, 16, sh(STAG, d)); R(x + lx - 0.2, b - 6, 2.8, 2, BLACK); }
    ovalShade(x + 15, b - 24, 10, 6.5, STAG); oval(x + 15, b - 20.5, 7, 2.4, STAGL);
    ovalShade(x + 4.6, b - 27, 2.4, 2.8, STAGL);
    poly([[x + 19, b - 28], [x + 23.5, b - 39], [x + 27, b - 37], [x + 25, b - 25]], STAG);
    ovalShade(x + 22.5, b - 29, 4, 5, STAGL);
    ovalShade(x + 25, b - 40, 3.8, 3.2, STAG); ovalShade(x + 28.5, b - 39, 2.4, 2, STAGL); disc(x + 30.4, b - 39.4, 0.8, BLACK);
    disc(x + 25.5, b - 41, 0.8, BLACK); oval(x + 22.6, b - 43, 1.2, 2, STAG);
    for (const [s, d] of [[0, 0], [-3, -1]]) {
      line([[x + 24 + s, b - 43], [x + 21 + s, b - 52], [x + 22 + s, b - 60], [x + 27 + s, b - 63], [x + 29 + s, b - 58]], sh(ANTLER, d), 1.6);
      line([[x + 22 + s, b - 52], [x + 17 + s, b - 56]], sh(ANTLER, d), 1.2);
      disc(x + 29 + s, b - 58, 1.8, '#2a2a3a'); disc(x + 17 + s, b - 56, 1.6, '#2a2a3a');
    }
  } }),
  // a green iron lamp post dusted with snow, a holly sprig and a red bow tied on, its lantern lit warm
  holidays({ id: 'snowlamp', name: 'Snowy lamp post', w: 1, h: 1, price: 450, glow: [BULB, '#fff8d8'], draw(x, b) {
    const post = '#2a4a3a';
    floorShadow(x + 6, b, 20);
    panel(x + 10, b - 8, 12, 8, post); ovalShade(x + 16, b - 8, 6.5, 1.6, SNOW);
    cyl(x + 14, b - 64, 4, 56, post);
    for (const h of [16, 62]) R(x + 12, b - h, 8, 2, sh(post, 1));
    bow(x + 16, b - 40, 4.5, RED); for (const f of [-1, 1]) leaf(x + 16 + f * 4, b - 44, 2.6, 1.3, GREEN, f * 0.6);
    disc(x + 16, b - 44.5, 1, RED);
    panel(x + 10, b - 67, 12, 3, post);
    R(x + 11, b - 79, 10, 12, BULB); R(x + 12, b - 78, 3, 10, '#fff8d8');
    for (const px of [x + 10, x + 20]) R(px, b - 79, 2, 12, post);
    for (let i = 0; i < 6; i++) R(x + 10 + i, b - 80 - i, 12 - i * 2, 1, post);
    oval(x + 16, b - 82, 7, 3, SNOW); disc(x + 16, b - 87, 1.6, post);
  } }),
  // a little round table laid for a visitor: a plate of cookies, a glass of milk and a carrot
  holidays({ id: 'cookietable', name: 'Cookies and milk table', w: 1, h: 1, price: 350, draw(x, b) {
    floorShadow(x + 2, b, 28);
    R(x + 8, b - 2, 16, 2, DARKWOOD); cyl(x + 14, b - 20, 4, 18, DARKWOOD);
    poly([[x + 2, b - 29], [x + 30, b - 29], [x + 31, b - 18], [x + 1, b - 18]], RED);
    for (let i = 1; i < 31; i += 5) poly([[x + i, b - 18], [x + i + 2.5, b - 15.5], [x + i + 5, b - 18]], RED);
    R(x + 1, b - 21, 30, 1.6, GREEN);
    oval(x + 12, b - 29.5, 9, 1.6, ICING);
    for (let i = 0; i < 4; i++) { oval(x + 12, b - 31 - i * 1.6, 5.6, 1.1, '#c88a48'); P(x + 10 + i, b - 31.2 - i * 1.6, '#4a2a18'); }
    glass(x + 22, b - 41, 5, 12, '#e8f0f8'); R(x + 22.5, b - 38, 4, 8.5, '#fbfbf8');
    poly([[x + 4, b - 30], [x + 8, b - 31], [x + 3, b - 34]], ORANGE);
  } }),
  // a music box: a red lacquered box with gold corners, its crank, a little fir turning on top as it plays
  holidays({ id: 'holidaymusicbox', name: 'Festive music box', w: 1, h: 1, price: 400, draw(x, b) {
    floorShadow(x + 2, b, 28);
    for (const fx of [x + 6, x + 24]) R(fx, b - 2, 3, 2, GOLD);
    panel(x + 5, b - 16, 22, 14, RED); R(x + 4, b - 18, 24, 3, sh(RED, -1)); R(x + 4, b - 15, 24, 0.8, GOLD); R(x + 5, b - 4, 22, 0.8, GOLD);
    panel(x + 10, b - 13, 12, 7, ICING);
    for (const f of [-1, 1]) leaf(x + 16 + f * 2.4, b - 9.5, 2.4, 1.2, GREEN, f * 0.6); disc(x + 16, b - 10, 1.1, RED);
    R(x + 27, b - 10, 3, 1.2, GOLD); R(x + 29, b - 13, 1.2, 4, GOLD); disc(x + 29.6, b - 13.5, 1.2, DARKWOOD);
    oval(x + 16, b - 19, 8, 1.6, GOLD);
    for (const [top, bot, half] of [[34, 42, 3.4], [27, 37, 5.2], [20, 30, 7]]) poly([[x + 16, b - bot], [x + 16 + half, b - top], [x + 16 - half, b - top]], FIR);
    for (const [a, h, c] of [[12, 22, RED], [20, 23, GOLD], [16, 29, BLUEB]]) disc(x + a, b - h, 1, c);
    disc(x + 16, b - 43.5, 1.6, GOLD);
  } }),

  // a round table in a pink cloth, a two-tier birthday cake on it, five candles lit
  party({ id: 'bdaycake', name: 'Birthday cake table', w: 1, h: 1, price: 550, glow: [FLAME], draw(x, b) {
    floorShadow(x, b, 32);
    poly([[x + 3, b - 26], [x + 29, b - 26], [x + 31, b], [x + 1, b]], PINK);
    for (let i = 3; i < 30; i += 4.5) R(x + i, b - 24, 1, 24, sh(PINK, 1));
    for (let i = 1; i < 31; i += 5) disc(x + i + 2.5, b - 26, 2.6, sh(PINK, 1));
    panel(x + 6, b - 36, 20, 10, CAKE); for (let i = 7; i < 26; i += 3) oval(x + i, b - 35, 1.2, 2, PINK);
    panel(x + 10, b - 44, 12, 8, CAKE); for (let i = 11; i < 22; i += 3) oval(x + i, b - 43, 1, 1.6, BLUE);
    for (let i = 0; i < 5; i++) { const cx = x + 11.5 + i * 2.25; R(cx - 0.5, b - 50, 1.1, 6, PARTY[i]); oval(cx, b - 52, 0.9, 1.6, FLAME); }
    for (const [a, h, c] of [[9, 30, YELLOW], [15, 32, BLUE], [21, 29, MINT], [13, 40, PURPLE], [18, 39, YELLOW]]) R(x + a, b - h, 1.4, 0.6, c);
  } }),
  // an arch of balloons in five colours, each foot weighted by a little present
  party({ id: 'balloonarch', name: 'Balloon arch', w: 2, h: 1, price: 700, draw(x, b, vw) { wide(x, vw, () => {
    floorShadow(x, b, 64);
    for (let i = 0; i < 15; i++) {
      const t = i / 14 * Math.PI, cx = x + 32 - Math.cos(t) * 25, cy = b - 10 - Math.sin(t) * 54;
      for (const [dx, dy, j] of [[-2.4, 0, 0], [2.4, 0, 2], [0, -2.4, 4]]) sphere(cx + dx * Math.sin(t) + dy * Math.cos(t) * 0.4, cy + dy * Math.sin(t) + dx * Math.cos(t) * 0.4, 4, PARTY[(i + j) % 5]);
    }
    present(x + 2, b - 9, 10, 9, PINK, ICING, false); present(x + 52, b - 9, 10, 9, BLUE, ICING, false);
  }); } }),
  // a stand of cone party hats on three round shelves, striped, a pompom on each
  party({ id: 'partyhats', name: 'Party hat stand', w: 1, h: 1, price: 250, draw(x, b) {
    floorShadow(x + 3, b, 26);
    oval(x + 16, b - 2, 10, 2, '#e8d8f0'); R(x + 15, b - 50, 2, 48, '#d8c8e8');
    const hat = (cx, base, h, w, c, d) => { poly([[cx, base - h], [cx + w, base], [cx - w, base]], c); R(cx - w * 0.55, base - h * 0.45, w * 1.1, 1.2, d); R(cx - w * 0.8, base - h * 0.15, w * 1.6, 1.2, d); disc(cx, base - h, 1.8, d); };
    for (const [h, rx] of [[6, 13], [26, 10], [44, 7]]) { oval(x + 16, b - h, rx, 1.8, '#f0e4f8'); R(x + 16 - rx, b - h - 0.5, rx * 2, 1, '#c8b0e0'); }
    hat(x + 9, b - 7, 15, 4.6, PINK, ICING); hat(x + 23, b - 7, 15, 4.6, BLUE, YELLOW);
    hat(x + 10.5, b - 27, 12, 3.8, YELLOW, PINK); hat(x + 21.5, b - 27, 12, 3.8, MINT, ICING);
    hat(x + 16, b - 45, 12, 4, PURPLE, YELLOW);
  } }),
  // four presents stacked, each smaller, a big bow on the top one
  party({ id: 'presenttower', name: 'Present tower', w: 1, h: 1, price: 450, draw(x, b) {
    floorShadow(x, b, 32);
    present(x + 2, b - 16, 28, 16, BLUE, YELLOW, false);
    present(x + 5, b - 29, 22, 13, PINK, ICING, false);
    present(x + 8, b - 39, 16, 10, YELLOW, PINK, false);
    present(x + 11, b - 47, 10, 8, MINT, RED, false);
    bow(x + 16, b - 49, 6, RED);
  } }),
  // two twisted crêpe streamers swagged across the wall, tissue pompoms at the ends and the middle
  party({ id: 'streamers', name: 'Streamer garland', w: 2, h: 1, layer: 'wall', price: 250, wall(x) {
    for (const [c, ph] of [[PINK, 0], [BLUE, Math.PI]]) {
      const g = ctx(); g.strokeStyle = c; g.lineWidth = 2.6; g.beginPath();
      for (let i = 7; i <= 57; i += 1) { const y = 19 + Math.sin((i - 7) / 50 * Math.PI) * 17 + Math.sin(i * 0.9 + ph) * 1.2; i === 7 ? g.moveTo(x + i, y) : g.lineTo(x + i, y); }
      g.stroke();
      for (let i = 9; i < 56; i += 3.5) { const y = 19 + Math.sin((i - 7) / 50 * Math.PI) * 17 + Math.sin(i * 0.9 + ph) * 1.2; R(x + i, y - 0.4, 1, 0.8, sh(c, -1)); }
    }
    for (const [px, py, r, c] of [[7, 19, 5.5, YELLOW], [57, 19, 5.5, PURPLE], [32, 37, 6, MINT]]) {
      disc(x + px, py, r, c);
      for (let a = 0; a < 8; a++) disc(x + px + Math.cos(a * 0.785) * r * 0.6, py + Math.sin(a * 0.785) * r * 0.6, r * 0.42, sh(c, a % 2 ? 1 : -1));
    }
    for (const tx of [26, 38]) line([[x + tx, 38], [x + tx, 50]], tx < 32 ? PINK : BLUE, 1.2);
  } }),
  // bunting on two strings: HAPPY above, BIRTHDAY below, a letter to a pennant
  party({ id: 'bdaybanner', name: 'Happy birthday banner', w: 2, h: 1, layer: 'wall', price: 300, wall(x) {
    const row = (text, y0, sag, w) => {
      const n = text.length, x0 = 32 - n * w / 2;
      line(Array.from({ length: 17 }, (_, i) => [x + 2 + i * 3.75, y0 + Math.sin(i / 16 * Math.PI) * sag]), '#7a6a5a', 0.7);
      [...text].forEach((ch, i) => {
        const cx = x0 + (i + 0.5) * w, y = y0 + Math.sin((cx - 2) / 60 * Math.PI) * sag;
        poly([[x + cx - w / 2 + 0.4, y], [x + cx + w / 2 - 0.4, y], [x + cx, y + 11]], PARTY[i % 5]);
        words(ch, x + cx, y + 3.8, 5.4, WHITE, w - 1.2);
      });
    };
    row('HAPPY', 16, 3, 8);
    row('BIRTHDAY', 42, 4, 7);
  } }),
  // a long table in a striped skirt: jars of sweets, a stand of cupcakes and a jar of lollipops
  party({ id: 'candybuffet', name: 'Candy buffet', w: 2, h: 1, price: 800, draw(x, b, vw) { wide(x, vw, () => {
    floorShadow(x, b, 64);
    panel(x + 2, b - 26, 60, 26, WHITE); for (let i = 4; i < 62; i += 6) R(x + i, b - 24, 3, 24, PINK);
    R(x + 1, b - 27, 62, 3, sh(PINK, -1));
    glass(x + 6, b - 46, 12, 19, '#e8f4fc'); for (const [a, h, c] of [[9, 30, PINK], [13, 31, YELLOW], [16, 30, PINK], [11, 34, MINT], [15, 35, PINK], [9, 38, YELLOW], [13, 39, PINK]]) disc(x + a, b - h, 1.8, c);
    R(x + 5, b - 48, 14, 2.5, PINK); disc(x + 12, b - 49, 1.6, PINK);
    glass(x + 22, b - 40, 10, 13, '#e8f4fc'); for (const [a, h, c] of [[25, 30, BLUE], [29, 30, PURPLE], [27, 34, BLUE], [24.5, 36, PURPLE]]) disc(x + a, b - h, 1.6, c);
    R(x + 21, b - 42, 12, 2.4, BLUE);
    R(x + 41, b - 41, 2, 14, '#e0d0e8'); for (const [h, rx] of [[28, 7], [40, 5]]) oval(x + 42, b - h, rx, 1.2, '#e0d0e8');
    for (const [a, h, c] of [[37.5, 29, PINK], [46.5, 29, MINT], [42, 41, YELLOW]]) { poly([[x + a - 2.4, b - h], [x + a + 2.4, b - h], [x + a + 1.8, b - h - 3], [x + a - 1.8, b - h - 3]], '#c8a0d0'); disc(x + a, b - h - 4, 2.6, c); }
    glass(x + 51, b - 38, 9, 11, '#e8f4fc');
    for (const [a, h, c] of [[52, 52, PINK], [56, 55, YELLOW], [59, 50, BLUE], [55, 47, MINT]]) { R(x + a + 0.2, b - h, 0.8, h - 28, WHITE); disc(x + a + 0.6, b - h, 3, c); ring(x + a + 0.6, b - h, 1.6, 1.6, WHITE, 0.6); }
  }); } }),
  // a giant party popper on a little stand, tipped up, streamers and confetti bursting from its mouth
  party({ id: 'partypopper', name: 'Party popper cannon', w: 1, h: 1, price: 300, draw(x, b) {
    floorShadow(x + 4, b, 24);
    panel(x + 7, b - 4, 18, 4, PURPLE); R(x + 15, b - 14, 2, 10, sh(PURPLE, -1));
    poly([[x + 11, b - 12], [x + 19, b - 16], [x + 26, b - 42], [x + 12, b - 46]], GOLD);
    for (const f of [0.35, 0.65]) line([[x + 11 + f * 1, b - 12 - f * 34], [x + 19 + f * 7, b - 16 - f * 26]], PINK, 1.6);
    oval(x + 19, b - 44, 7.2, 2.6, sh(GOLD, -1));
    line([[x + 14, b - 13], [x + 10, b - 8], [x + 8, b - 9]], WHITE, 0.6);
    for (const [c, pts] of [[PINK, [[17, 45], [14, 54], [17, 60], [13, 66]]], [BLUE, [[21, 46], [24, 56], [21, 62], [25, 68]]], [MINT, [[19, 46], [19, 58], [22, 64]]]]) line(pts.map(([a, h]) => [x + a, b - h]), c, 1.2);
    for (const [a, h, c] of [[10, 52, YELLOW], [27, 52, PINK], [12, 60, BLUE], [26, 61, MINT], [18, 70, PURPLE]]) R(x + a, b - h, 1.8, 1.8, c);
  } }),
  // a bubble machine on its feet: a fan grille, a wand wheel turning through the dish, bubbles rising
  party({ id: 'bubblemachine', name: 'Bubble machine', w: 1, h: 1, price: 450, draw(x, b) {
    floorShadow(x + 2, b, 28);
    for (const fx of [x + 6, x + 23]) R(fx, b - 4, 3, 4, BLACK);
    panel(x + 4, b - 24, 24, 20, BLUE); R(x + 4, b - 24, 24, 2, YELLOW);
    disc(x + 11, b - 15, 5.5, sh(BLUE, -1)); for (let i = -4; i <= 4; i += 2) R(x + 11 + i - 0.3, b - 19.5, 0.6, 9, sh(BLUE, -2)); disc(x + 11, b - 15, 1.4, YELLOW);
    R(x + 18, b - 9, 9, 3, PINK);
    ring(x + 22.5, b - 15, 4.6, 4.6, YELLOW, 1.2); for (let a = 0; a < 6; a++) ring(x + 22.5 + Math.cos(a) * 3, b - 15 + Math.sin(a) * 3, 1, 1, YELLOW, 0.5);
    for (const [a, h, r] of [[20, 32, 3], [26, 40, 2.4], [14, 44, 3.4], [22, 52, 2], [9, 34, 2.2], [17, 58, 2.6]]) { disc(x + a, b - h, r, 'rgba(200,236,255,0.7)'); ring(x + a, b - h, r, r, '#e8f8ff', 0.6); }
  } }),
  // a stubby cannon on a wheeled carriage, aimed high, its barrel striped, confetti in its mouth
  party({ id: 'confetticannon', name: 'Confetti cannon', w: 1, h: 1, price: 500, draw(x, b) {
    floorShadow(x, b, 32);
    poly([[x + 4, b - 6], [x + 26, b - 6], [x + 22, b - 16], [x + 8, b - 16]], PINK);
    const g = ctx(); g.save(); g.translate(x + 13, b - 16); g.rotate(-0.85);
    g.fillStyle = PURPLE; g.beginPath(); g.roundRect(-5, -5, 22, 10, 3); g.fill();
    g.fillStyle = GOLD; for (const t of [1, 8, 14]) g.fillRect(t, -5.5, 2.4, 11);
    g.fillStyle = sh(PURPLE, -1); g.fillRect(17, -6, 3, 12);
    g.restore();
    for (const wx of [x + 7, x + 25]) { disc(wx, b - 7, 6.5, GOLD); disc(wx, b - 7, 4.6, sh(GOLD, -1)); disc(wx, b - 7, 1.6, PINK); }
    for (const [a, h, c] of [[27, 37, PINK], [22, 41, YELLOW], [29, 43, MINT], [25, 47, BLUE], [19, 38, MINT]]) R(x + a - 1, b - h, 2, 2, c);
  } }),
  // a wrapping table: three rolls of paper on a rack behind, a box half wrapped, ribbon spools, scissors
  party({ id: 'wraptable', name: 'Gift wrapping table', w: 2, h: 1, price: 650, draw(x, b, vw) { wide(x, vw, () => {
    floorShadow(x, b, 64);
    for (const px of [x + 4, x + 58]) R(px, b - 58, 2.4, 30, '#d8d0c8');
    R(x + 4, b - 53, 56, 1.6, TIN);
    for (const [cx, c, d] of [[16, PINK, WHITE], [32, BLUE, YELLOW], [48, GOLD, RED]]) { cyl(x + cx - 7, b - 57, 14, 9, c); for (let i = -5; i <= 5; i += 3) disc(x + cx + i, b - 52.5, 0.8, d); }
    for (const lx of [x + 5, x + 55]) cyl(lx, b - 26, 4, 26, OAK);
    wood(x + 2, b - 30, 60, 4, '#d8b080');
    present(x + 22, b - 41, 14, 11, MINT, PINK, false);
    poly([[x + 36, b - 41], [x + 44, b - 31], [x + 36, b - 30]], sh(PINK, 1));
    for (const [cx, c] of [[10, RED], [16, PURPLE]]) { cyl(x + cx - 2.5, b - 34, 5, 4, c); disc(x + cx, b - 34, 0.8, WHITE); }
    line([[x + 48, b - 30.5], [x + 56, b - 32]], TIN, 0.8); ring(x + 47, b - 30.5, 1.4, 1, RED, 0.8); ring(x + 47, b - 32, 1.4, 1, RED, 0.8);
  }); } }),
  // a cake stand on its foot, a cake piped in blue and white, a big pink number one candle lit on it
  party({ id: 'numbercake', name: 'Number candle cake', w: 1, h: 1, price: 400, glow: [FLAME], draw(x, b) {
    floorShadow(x + 4, b, 24);
    oval(x + 16, b - 1, 8, 1.5, '#e8e8f0'); cyl(x + 14, b - 18, 4, 17, '#e8e8f0');
    oval(x + 16, b - 19, 13, 1.8, '#f0f0f8');
    panel(x + 6, b - 33, 20, 14, BLUE); for (let i = 7; i < 26; i += 2.6) disc(x + i, b - 32.5, 1.2, WHITE);
    for (let i = 7; i < 26; i += 2.6) disc(x + i, b - 20.5, 1, WHITE);
    poly([[x + 14, b - 33], [x + 19, b - 33], [x + 19, b - 50], [x + 16.5, b - 50], [x + 12.5, b - 46], [x + 13.5, b - 44.5], [x + 14, b - 45]], PINK);
    R(x + 12.5, b - 34, 8, 1.6, PINK);
    for (const h of [37, 41, 45]) R(x + 14, b - h, 5, 0.8, WHITE);
    R(x + 17, b - 52, 0.6, 2, BLACK); oval(x + 17.3, b - 54, 1.2, 2.2, FLAME);
  } }),
  // a glass punch bowl of pink punch on a clothed table, a ladle in it and two cups on the rim
  party({ id: 'punchbowl', name: 'Party punch bowl', w: 1, h: 1, price: 350, draw(x, b) {
    floorShadow(x, b, 32);
    poly([[x + 3, b - 24], [x + 29, b - 24], [x + 31, b], [x + 1, b]], MINT);
    for (let i = 1; i < 31; i += 5) disc(x + i + 2.5, b - 24, 2.6, sh(MINT, 1));
    R(x + 13, b - 28, 6, 4, '#d8eef8'); oval(x + 16, b - 28, 4, 1, '#d8eef8');
    const g = ctx(); g.fillStyle = '#d8eef8'; g.beginPath(); g.ellipse(x + 16, b - 38, 12, 10, 0, 0, Math.PI); g.fill();
    g.fillStyle = '#f87aa0'; g.beginPath(); g.ellipse(x + 16, b - 38.5, 11, 8.5, 0, 0, Math.PI); g.fill();
    oval(x + 16, b - 38.5, 11.5, 1.6, '#f8a0bc');
    for (const [a, c] of [[11, ORANGE], [19, YELLOW]]) disc(x + a, b - 38.6, 1.6, c);
    line([[x + 21, b - 37], [x + 25, b - 52]], TIN, 1); oval(x + 21, b - 37, 2, 1, TIN);
    for (const cx of [x + 4.5, x + 27.5]) { R(cx - 2, b - 41, 4, 4, '#e8f4fc'); R(cx - 1.6, b - 39.6, 3.2, 2.4, '#f87aa0'); }
  } }),
];
