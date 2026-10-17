/* base-furniture-eevee.js  -  the Eevee room (furniture expansion session a, 2026-10-17): 25 pieces, each shaped after
   Eevee, like the Pokémon-themed rooms in the games: its big ears with their dark insides, its cream collar of fluff, its
   bushy cream-tipped tail and its round brown head, plus what only Eevee has (the eight evolution stones, the Soothe Bell,
   Poké Puffs, an Eeveelution poster). One colour each, Eevee's own (`solo`). These paintings are the store's and the
   tray's pictures; the room builds each as a 3D model from the same numbers (js/base-models-eevee.js), so the shared
   shapes (the ear's profile, the tails' paths) live here. */

import { R, disc, oval, ovalShade, cyl, panel, inset, wood, cushion, floorShadow, ctx, sh } from './base-paint.js';

export const EV = {
  brown: '#c8884a', dark: '#94602e', cream: '#f6e4bc', ear: '#5e3c22', ink: '#2a1c1a', honey: '#e2b878', back: '#7a4e2a',
  lamp: '#fff0c4', white: '#ffffff', glass: '#cfe6f2', screen: '#16203a', bell: '#e8c860', bow: '#f080a8', pillow: '#fffaf0',
};
/** The eight Eeveelutions on the poster: body, ears, and the mark that tells each apart. */
export const EVOS = [
  { body: '#58a8e0', ears: '#f6e4bc', mark: 'frill' }, { body: '#f8d040', ears: '#f8d040', mark: 'spikes' },
  { body: '#f07838', ears: '#f07838', mark: 'tuft' }, { body: '#d8a0d8', ears: '#d8a0d8', mark: 'gem' },
  { body: '#34343e', ears: '#34343e', mark: 'ring' }, { body: '#f0e0a8', ears: '#68b048', mark: 'leaf' },
  { body: '#90d4ec', ears: '#3a6ab0', mark: 'diamond' }, { body: '#fbeef2', ears: '#f088b0', mark: 'bow' },
];
/** The evolution stones, each a colour and its glint: Water, Thunder, Fire, Leaf, Ice, Sun, Moon, Shiny. */
export const STONES = [['#3a86e0', '#a8d8ff'], ['#8ac838', '#f8f070'], ['#f05a2a', '#f8d040'], ['#4a9a34', '#a8e070'],
  ['#9ad8ec', '#ffffff'], ['#f89a28', '#f8e070'], ['#5a5a78', '#c8c8e0'], ['#e8e4f4', '#f8b8d8']];

/* ----- shapes the models share ----- */
/** An ear's outline, from base to tip: [half-width as a share of its base's, height as a share of its length]. */
export const EAR = [[1, 0], [1, 0.3], [0.86, 0.58], [0.52, 0.84], [0, 1]];
/** The dark inside of an ear: how far up it starts, and its length and width as shares of the ear's. */
export const INNER = { at: 0.14, len: 0.72, rb: 0.56 };
/** Where a head of radius r wears its ears: base out and up from its middle, length, base half-width, outward lean. */
export const HEAD_EAR = { dx: 0.6, dy: 0.55, len: 1.55, rb: 0.42, a: 0.55 };
/** A head's face: eyes out and down from its middle, their size, the nose and the smile. */
export const FACE = { ex: 0.4, ey: -0.02, erx: 0.16, ery: 0.22, ny: -0.3, sy: -0.4, sw: 0.07 };

/** Points round an oval [dx, dh] (h up), n of them from angle a0 to a1 (the whole way round when it's a full turn). */
export function around(rx, ry, n, a0 = 0, a1 = Math.PI * 2) {
  const full = a1 - a0 >= Math.PI * 2 - 1e-6;
  return Array.from({ length: n }, (_, i) => { const a = a0 + (a1 - a0) * (full ? i / n : n > 1 ? i / (n - 1) : 0.5); return [Math.cos(a) * rx, Math.sin(a) * ry]; });
}
/** The front half of a ring of n tufts of radius r round a round thing, as they're seen from the front: [dx] each. */
export const frontRing = (r, n) => Array.from({ length: n / 2 + 1 }, (_, i) => Math.cos(i / n * Math.PI * 2) * r);

/** A tail's path: a Catmull-Rom curve through `ctrl` ([x, h] painted units), `n` + 1 points evenly along it, [x, h, t]. */
export function tailPath(ctrl, n = 48) {
  const dense = [];
  for (let i = 0; i < ctrl.length - 1; i++) {
    const p0 = ctrl[Math.max(0, i - 1)], p1 = ctrl[i], p2 = ctrl[i + 1], p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
    for (let k = 0; k < 16; k++) {
      const t = k / 16, t2 = t * t, t3 = t2 * t;
      dense.push([0, 1].map(c => 0.5 * (2 * p1[c] + (p2[c] - p0[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (3 * p1[c] - p0[c] - 3 * p2[c] + p3[c]) * t3)));
    }
  }
  dense.push(ctrl[ctrl.length - 1]);
  const len = [0];
  for (let i = 1; i < dense.length; i++) len.push(len[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]));
  const total = len[len.length - 1], out = [];
  let j = 0;
  for (let i = 0; i <= n; i++) {
    const s = i / n * total;
    while (j < len.length - 2 && len[j + 1] < s) j++;
    const f = Math.min(1, (s - len[j]) / ((len[j + 1] - len[j]) || 1));
    out.push([dense[j][0] + (dense[j + 1][0] - dense[j][0]) * f, dense[j][1] + (dense[j + 1][1] - dense[j][1]) * f, i / n]);
  }
  return out;
}
/** A bushy tail's thickness along it: `r0` at its root swelling to `r1` by `tip`, where the cream tip puffs to `rt`
    and rounds off to a point. */
const bushy = (r0, r1, tip, rt) => (t) => t < tip ? r0 + (r1 - r0) * Math.sin(t / tip * Math.PI / 2) : rt * Math.sqrt(Math.max(0, 1 - ((t - tip) / (1 - tip)) ** 2));
export const TAILS = {
  sofa: { ctrl: [[8, 28], [22, 32], [38, 32], [48, 36], [52, 46], [47, 55], [40, 57]], r: bushy(6.5, 9.5, 0.7, 9.5), tip: 0.7 },
  lamp: { ctrl: [[16, 3], [12, 18], [17, 34], [20, 50], [17, 62], [13, 72], [15, 82]], r: bushy(3, 7.5, 0.64, 9.5), tip: 0.64 },
  bell: { ctrl: [[9, 4], [9, 30], [10, 50], [14, 62], [21, 64], [25, 58]], r: bushy(2.4, 3.6, 0.78, 4.6), tip: 0.78 },
};
/** The Soothe Bell's profile from its rim up, [radius, height] painted units. */
export const BELL = [[6, 0], [6.2, 0.8], [5, 3], [4.2, 7], [3.6, 10], [2, 11.6], [0, 12]];

/* ----- painting ----- */
function poly(pts, c) {
  const g = ctx();
  g.fillStyle = c; g.beginPath();
  pts.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py)));
  g.closePath(); g.fill();
}
/** An ear's outline in canvas units: its base's middle at bx, by, `len` long, `rb` half as wide at its base, leaning
    out by `a` (radians, + to the right). */
function earOutline(bx, by, len, rb, a) {
  const dx = Math.sin(a), dy = -Math.cos(a), px = Math.cos(a), py = Math.sin(a);
  const side = (s) => EAR.map(([r, y]) => [bx + dx * y * len + px * r * rb * s, by + dy * y * len + py * r * rb * s]);
  return [...side(1), ...side(-1).reverse()];
}
/** One of Eevee's ears: brown, its inside dark brown. */
function ear(bx, by, len, rb, a) {
  poly(earOutline(bx, by, len, rb, a), EV.brown);
  const s = INNER.at * len;
  poly(earOutline(bx + Math.sin(a) * s, by - Math.cos(a) * s, len * INNER.len, rb * INNER.rb, a), EV.ear);
}
/** A pair of ears at bx ± dx, by: canvas units. */
function ears(cx, by, dx, len, rb, a) { for (const s of [-1, 1]) ear(cx + s * dx, by, len, rb, s * a); }
/** A smile: two little arcs, w each half. */
function smile(cx, cy, w) {
  const g = ctx();
  g.strokeStyle = EV.ink; g.lineWidth = Math.max(0.45, w * 0.45);
  g.beginPath(); g.moveTo(cx - 2 * w, cy); g.quadraticCurveTo(cx - w, cy + w * 1.3, cx, cy); g.quadraticCurveTo(cx + w, cy + w * 1.3, cx + 2 * w, cy); g.stroke();
}
/** Eevee's eyes, nose and smile on a head of radius r round cx, cy. */
function features(cx, cy, r) {
  const F = FACE;
  for (const s of [-1, 1]) {
    oval(cx + s * F.ex * r, cy - F.ey * r, F.erx * r, F.ery * r, EV.ink);
    disc(cx + s * F.ex * r - 0.05 * r, cy - F.ey * r - 0.08 * r, Math.max(0.4, 0.065 * r), EV.white);
  }
  oval(cx, cy - F.ny * r, 0.075 * r, 0.05 * r, EV.ink);
  smile(cx, cy - F.sy * r, F.sw * r);
}
/** Eevee's head, radius r round cx, cy (canvas units), its ears up and out. */
function face(cx, cy, r, withEars = true) {
  const E = HEAD_EAR;
  if (withEars) ears(cx, cy - E.dy * r, E.dx * r, E.len * r, E.rb * r, E.a);
  ovalShade(cx, cy, 1.12 * r, r, EV.brown);
  features(cx, cy, r);
}
/** A puff of cream fluff: an oval with tufts round it at `pts` ([dx, dh] from its middle), each radius rt. */
function fluff(cx, cy, rx, ry, pts, rt, c = EV.cream) {
  for (const [dx, dh] of pts) ovalShade(cx + dx, cy - dh, rt, rt, c);
  if (rx > 0) ovalShade(cx, cy, rx, ry, c);
}
/** A row of tufts along a line at height cy, x from x0, every `step`, n of them. */
function tuftRow(x0, cy, n, step, rt, c = EV.cream) { for (let i = 0; i < n; i++) ovalShade(x0 + i * step, cy, rt, rt, c); }
/** A bushy tail along TAILS[name], its cream tip `tipColour`, painted at x, b. */
function tail(x, b, { ctrl, r, tip }, tipColour = EV.cream, flat = false) {
  const pts = tailPath(ctrl);
  for (const [want, col] of [[false, EV.brown], [true, tipColour]]) {
    const run = pts.filter(([, , t]) => (t >= tip) === want);
    for (const [px, ph, t] of run) disc(x + px, b - ph, r(t), flat && want ? col : sh(col, -1));
    for (const [px, ph, t] of run) disc(x + px - r(t) * 0.12, b - ph - r(t) * 0.15, r(t) * 0.84, col);
  }
}
/** A rounded box, corners r round, lit from the top. */
function pad(x, y, w, h, r, c) {
  const g = ctx(), lg = g.createLinearGradient(x, y, x, y + h);
  lg.addColorStop(0, sh(c, 1)); lg.addColorStop(0.3, c); lg.addColorStop(1, sh(c, -1));
  g.fillStyle = lg; g.beginPath(); g.roundRect(x, y, w, h, r); g.fill();
}
/** A paw: a dark brown oval at the foot of a piece. */
const paw = (cx, cy) => oval(cx, cy, 4, 2.2, EV.dark);

/** One of the eight stones on the shelf, sitting on y. */
function stone(cx, y, [c, glint], i) {
  ovalShade(cx, y - 4.5, 3.4, 4.5, c);
  oval(cx - 1, y - 6, 1, 1.6, glint);
  if (i === 1) poly([[cx + 0.6, y - 7.5], [cx - 1, y - 4.2], [cx + 0.2, y - 4.2], [cx - 0.6, y - 1.6], [cx + 1.2, y - 5], [cx, y - 5]], '#f8f070');
  if (i === 2) ovalShade(cx, y - 3.6, 1.4, 2, '#f8d040');
  if (i === 6) disc(cx + 0.8, y - 3.4, 0.8, sh(c, -1));
}

/** A little Eeveelution's head on the poster. */
function evoHead(cx, cy, r, { body, ears: ec, mark }) {
  for (const s of [-1, 1]) poly([[cx + s * r * 0.3, cy - r * 0.6], [cx + s * r * 1.15, cy - r * 1.55], [cx + s * r * 0.95, cy - r * 0.15]], ec);
  if (mark === 'spikes') for (const s of [-1, 0, 1]) poly([[cx + s * r * 0.6 - r * 0.35, cy + r * 0.6], [cx + s * r * 0.6, cy + r * 1.3], [cx + s * r * 0.6 + r * 0.35, cy + r * 0.6]], '#f6f6f0');
  disc(cx, cy, r, body);
  if (mark === 'frill') { disc(cx - r * 0.95, cy, r * 0.35, '#f6e4bc'); disc(cx + r * 0.95, cy, r * 0.35, '#f6e4bc'); }
  if (mark === 'tuft') disc(cx, cy - r * 0.9, r * 0.45, '#f8e098');
  if (mark === 'gem') disc(cx, cy - r * 0.5, r * 0.18, '#d83040');
  if (mark === 'ring') disc(cx, cy - r * 0.55, r * 0.2, '#f8d040');
  if (mark === 'diamond') poly([[cx, cy - r], [cx + r * 0.25, cy - r * 0.7], [cx, cy - r * 0.4], [cx - r * 0.25, cy - r * 0.7]], '#3a6ab0');
  if (mark === 'bow') { disc(cx + r * 0.75, cy - r * 0.6, r * 0.32, '#f088b0'); disc(cx + r * 1.05, cy - r * 0.35, r * 0.25, '#68b8e8'); }
  const eye = mark === 'ring' ? '#e83a3a' : '#2a1c1a';
  for (const s of [-1, 1]) disc(cx + s * r * 0.38, cy, r * 0.17, eye);
}

/** A Poké Puff on a plate at y: a little cake, cream piped on it, a berry on top. */
function puff(cx, y, c) {
  cyl(cx - 3.5, y - 4, 7, 4, c);
  ovalShade(cx, y - 4.6, 3.8, 1.8, EV.cream); ovalShade(cx, y - 6.4, 2.8, 1.6, EV.cream); ovalShade(cx, y - 7.9, 1.6, 1.2, EV.cream);
  disc(cx, y - 9.4, 1, '#e04050');
}
export const PUFFS = ['#f4a0c0', '#a8d878', '#f8d860', '#a87048', '#f0a050'];

const G = 'Eevee room';
export const EEVEE_KINDS = [
  // the bed: a headboard of Eevee's head on its cream collar, a brown quilt folded back under a fluffy collar, a footboard
  // that's a roll of fluff, two paws peeking under it
  { id: 'eeveebed', name: 'Eevee bed', w: 2, h: 2, price: 1400, seat: 'bed', draw(x, b, vw) {
    floorShadow(x, b, vw);
    fluff(x + 32, b - 40, 27, 12, around(27, 12, 12), 4.5);
    face(x + 32, b - 56, 17);
    tuftRow(x + 6, b - 27, 9, 6.5, 4);
    cushion(x + 12, b - 34, 40, 10, EV.pillow, 4);
    cushion(x + 1, b - 27, 62, 15, EV.brown, 4);
    cushion(x + 1, b - 16, 62, 15, EV.cream, 6);
    tuftRow(x + 4, b - 16, 8, 8, 4);
    paw(x + 7, b - 2.2); paw(x + 57, b - 2.2);
  } },
  // a dining chair: Eevee's head and collar for its back, a cream cushion on a brown seat
  { id: 'eeveechair', name: 'Eevee chair', w: 1, h: 1, price: 220, draw(x, b, vw) {
    floorShadow(x, b, vw);
    for (const lx of [5, 23]) cyl(x + lx, b - 15, 4, 15, EV.dark);
    fluff(x + 16, b - 29, 11, 6, around(11, 6, 8), 3);
    face(x + 16, b - 40, 11);
    cushion(x + 3, b - 20, 26, 6, EV.brown, 2);
    cushion(x + 4, b - 24, 24, 5, EV.cream, 2);
  } },
  // a tub armchair whose back and arms are Eevee's collar, its two big ears rising behind
  { id: 'eeveearmchair', name: 'Eevee collar armchair', w: 1, h: 1, price: 520, draw(x, b, vw) {
    floorShadow(x, b, vw);
    ears(x + 16, b - 42, 7, 19, 5.5, 0.42);
    fluff(x + 16, b - 32, 13, 13, around(12.4, 12.4, 9, 0, Math.PI), 3.6);
    cushion(x + 3, b - 12, 26, 10, EV.brown, 3);
    paw(x + 7, b - 2.2); paw(x + 25, b - 2.2);
    cushion(x + 6, b - 20, 20, 8, EV.brown, 3);
    cushion(x, b - 28, 8, 22, EV.cream, 3); cushion(x + 24, b - 28, 8, 22, EV.cream, 3);
  } },
  // a sofa with Eevee's bushy tail for its back, curling up over the end in its cream tip
  { id: 'eeveesofa', name: 'Eevee tail sofa', w: 2, h: 1, price: 950, draw(x, b, vw) {
    floorShadow(x, b, vw);
    tail(x, b, TAILS.sofa);
    paw(x + 7, b - 2.2); paw(x + 57, b - 2.2);
    cushion(x + 2, b - 16, 60, 13, EV.brown, 4);
    cushion(x + 9, b - 22, 23, 8, EV.cream, 3); cushion(x + 32, b - 22, 23, 8, EV.cream, 3);
    cushion(x, b - 28, 10, 25, EV.brown, 4); cushion(x + 54, b - 28, 10, 25, EV.cream, 4);
  } },
  // a round pouf of collar fluff, a brown pad on top
  { id: 'eeveepouf', name: 'Eevee collar pouf', w: 1, h: 1, price: 240, draw(x, b) {
    floorShadow(x + 2, b, 28);
    cushion(x + 3, b - 16, 26, 16, EV.cream, 6);
    for (const dx of frontRing(13, 12)) ovalShade(x + 16 + dx, b - 8, 3.2, 3.2, EV.cream);
    cushion(x + 5, b - 20, 22, 6, EV.brown, 3);
  } },
  // a coffee table on four brown paws, a skirt of cream fluff under its honey top
  { id: 'eeveetable', name: 'Eevee paw table', w: 2, h: 1, price: 420, draw(x, b, vw) {
    floorShadow(x, b, vw);
    for (const lx of [10.5, 53.5]) { cyl(x + lx - 2.5, b - 12, 5, 9, EV.brown); paw(x + lx, b - 2.2); }
    tuftRow(x + 5, b - 10, 10, 6, 3);
    wood(x + 1, b - 14, 62, 4, EV.honey);
  } },
  // a desk: a pedestal of drawers with paw knobs, a collar of fluff along its back, Eevee's ears at its corners
  { id: 'eeveedesk', name: 'Eevee desk', w: 2, h: 1, price: 600, draw(x, b, vw) {
    floorShadow(x, b, vw);
    ear(x + 10, b - 28, 24, 6.5, -0.35); ear(x + 54, b - 28, 24, 6.5, 0.35);
    cushion(x + 4, b - 31, 56, 7, EV.cream, 3);
    tuftRow(x + 8, b - 31, 9, 6, 3);
    wood(x + 40, b - 22, 22, 22, EV.brown);
    for (const dy of [20, 11]) { inset(x + 42, b - dy, 18, 8, sh(EV.cream, -1)); panel(x + 42.5, b - dy + 0.5, 17, 7, EV.cream); oval(x + 51, b - dy + 4, 1.8, 1.3, EV.dark); }
    cyl(x + 4, b - 21, 5, 19, EV.brown); paw(x + 6.5, b - 2.2);
    wood(x, b - 25, 64, 4, EV.honey);
  } },
  // a round nightstand: a brown drum, a cream drawer, a fluffy top, two little ears behind it
  { id: 'eeveenightstand', name: 'Eevee nightstand', w: 1, h: 1, price: 300, draw(x, b) {
    floorShadow(x + 3, b, 26);
    ear(x + 9, b - 21, 10, 3.2, -0.35); ear(x + 23, b - 21, 10, 3.2, 0.35);
    paw(x + 9, b - 2.2); paw(x + 23, b - 2.2);
    cyl(x + 4, b - 19, 24, 17, EV.brown);
    panel(x + 9, b - 16, 14, 7, EV.cream); oval(x + 16, b - 12.5, 1.6, 1.2, EV.dark);
    ovalShade(x + 16, b - 20.5, 14, 1.6, EV.cream);
    for (const dx of frontRing(14, 12)) ovalShade(x + 16 + dx, b - 19, 2.6, 2.6, EV.cream);
  } },
  // a chest of drawers: cream fronts with paw knobs, a fluffy skirt, little ears on its back corners
  { id: 'eeveedresser', name: 'Eevee dresser', w: 2, h: 1, price: 650, draw(x, b, vw) {
    floorShadow(x, b, vw);
    ear(x + 7, b - 36, 12, 4, -0.3); ear(x + 57, b - 36, 12, 4, 0.3);
    wood(x + 2, b - 34, 60, 28, EV.brown);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
      const dx = x + 5 + c * 28, dy = b - 32 + r * 13;
      inset(dx, dy, 26, 11, sh(EV.cream, -1)); panel(dx + 1, dy + 1, 24, 9, EV.cream); oval(dx + 13, dy + 5.5, 2, 1.5, EV.dark);
    }
    wood(x, b - 37, 64, 3.5, EV.honey);
    tuftRow(x + 4, b - 6, 9, 7, 3.5);
    paw(x + 8, b - 2.2); paw(x + 56, b - 2.2);
  } },
  // a tall wardrobe: Eevee's ears over a crown of fluff, a band of collar across its doors
  { id: 'eeveewardrobe', name: 'Eevee ear wardrobe', w: 2, h: 1, price: 900, draw(x, b, vw) {
    floorShadow(x, b, vw);
    ear(x + 14, b - 76, 16, 5.5, -0.3); ear(x + 50, b - 76, 16, 5.5, 0.3);
    wood(x + 2, b - 76, 60, 72, EV.brown, 'y');
    for (const dx of [5, 33]) { inset(x + dx, b - 72, 26, 64, sh(EV.brown, -1)); wood(x + dx + 1, b - 71, 24, 62, EV.brown, 'y'); }
    oval(x + 29.5, b - 36, 1.6, 2.4, EV.cream); oval(x + 34.5, b - 36, 1.6, 2.4, EV.cream);
    tuftRow(x + 4, b - 44, 9, 7, 3.6);
    cushion(x + 1, b - 80, 62, 6, EV.cream, 3);
    tuftRow(x + 4, b - 80, 9, 7, 3);
    paw(x + 8, b - 2.2); paw(x + 56, b - 2.2);
  } },
  // the eight evolution stones on four shelves, Eevee's ears over a fluffy crown
  { id: 'eeveeshelf', name: 'Evolution stone shelf', w: 1, h: 1, price: 700, draw(x, b) {
    floorShadow(x + 1, b, 30);
    ears(x + 16, b - 64, 7, 19, 5, 0.35);
    wood(x + 2, b - 64, 28, 64, EV.brown, 'y');
    inset(x + 5, b - 61, 22, 57, EV.back);
    [4, 18, 32, 46].forEach((h, r) => {
      wood(x + 4, b - h - 2.5, 24, 2.5, EV.cream);
      for (let c = 0; c < 2; c++) stone(x + 11 + c * 10, b - h - 2.5, STONES[r * 2 + c], r * 2 + c);
    });
    cushion(x + 1, b - 68, 30, 6, EV.cream, 3);
    tuftRow(x + 4, b - 68, 6, 4.8, 2.6);
  } },
  // a floor lamp that's Eevee's bushy tail, curling up to its cream tip, lit
  { id: 'eeveelamp', name: 'Eevee tail lamp', w: 1, h: 1, price: 380, glow: [EV.lamp], draw(x, b) {
    floorShadow(x + 4, b, 24);
    ovalShade(x + 16, b - 2.5, 10, 2.5, EV.dark);
    tail(x, b, TAILS.lamp, EV.lamp, true);
  } },
  // a wall clock: Eevee's head over a dial ringed in collar fluff
  { id: 'eeveeclock', name: 'Eevee face clock', w: 1, h: 1, layer: 'wall', price: 320, wall(x) {
    const cx = x + 16, cy = 54;
    fluff(cx, cy, 12.5, 12.5, around(12.5, 12.5, 12), 3.2);
    disc(cx, cy, 9, EV.white);
    for (let h = 0; h < 12; h += 3) disc(cx + Math.sin(h * Math.PI / 6) * 7, cy - Math.cos(h * Math.PI / 6) * 7, 0.8, EV.dark);
    R(cx - 0.6, cy - 6, 1.2, 6, EV.ink); R(cx, cy - 0.6, 4.5, 1.2, EV.ink); disc(cx, cy, 1, EV.brown);
    face(cx, 33, 10);
  } },
  // an oval mirror framed in brown, Eevee's ears on top, collar fluff round its foot
  { id: 'eeveemirror', name: 'Eevee mirror', w: 1, h: 1, layer: 'wall', price: 340, wall(x) {
    const cx = x + 16, cy = 46;
    ears(cx, 31, 5.5, 15, 5, 0.42);
    ovalShade(cx, cy, 11, 16.5, EV.brown);
    oval(cx, cy, 8.5, 12.75, EV.glass); oval(cx - 1, cy - 4, 6, 7, '#dcf0f8');
    const g = ctx(); g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(cx - 5, cy + 2); g.lineTo(cx - 1, cy - 8); g.stroke();
    fluff(cx, cy, 0, 0, around(11, 16.5, 7, -Math.PI + 0.35, -0.35), 3.4);
  } },
  // a framed poster: Eevee in the middle, the eight Eeveelutions round it
  { id: 'eeveeposter', name: 'Eeveelution poster', w: 2, h: 1, layer: 'wall', price: 260, wall(x) {
    R(x + 7, 15, 52, 52, 'rgba(0,0,0,0.18)');
    wood(x + 6, 14, 52, 52, EV.honey);
    R(x + 9, 17, 46, 46, '#fff4dc');
    const g = ctx(), rg = g.createRadialGradient(x + 32, 40, 2, x + 32, 40, 24);
    rg.addColorStop(0, '#fffbe8'); rg.addColorStop(1, '#f8dcb0'); g.fillStyle = rg; g.fillRect(x + 9, 17, 46, 46);
    EVOS.forEach((e, i) => { const a = i / 8 * Math.PI * 2 - Math.PI / 2; evoHead(x + 32 + Math.cos(a) * 17, 41 + Math.sin(a) * 14, 3.6, e); });
    face(x + 32, 41, 6);
  } },
  // a TV in a brown cabinet with Eevee's ears, standing on a collar of fluff
  { id: 'eeveetv', name: 'Eevee TV', w: 2, h: 1, price: 1000, draw(x, b, vw) {
    floorShadow(x, b, vw);
    ear(x + 14, b - 46, 22, 7, -0.38); ear(x + 50, b - 46, 22, 7, 0.38);
    fluff(x + 32, b - 7, 16, 7, around(16, 7, 9, -0.3, Math.PI + 0.3), 3);
    panel(x + 26, b - 14, 12, 4, EV.cream);
    pad(x + 3, b - 50, 58, 38, 5.5, EV.brown);
    inset(x + 8, b - 45, 48, 28, EV.screen);
    const g = ctx(), sg = g.createLinearGradient(x + 8, b - 45, x + 30, b - 17);
    sg.addColorStop(0, '#3a5a8a'); sg.addColorStop(1, EV.screen); g.fillStyle = sg; g.fillRect(x + 9, b - 44, 46, 26);
    disc(x + 55, b - 14.5, 1.2, '#e85a5a');
  } },
  // a little house for a Pokémon that's Eevee's head, its door a round mouth ringed in fluff
  { id: 'eeveehouse', name: 'Eevee pet house', w: 1, h: 1, price: 650, draw(x, b) {
    floorShadow(x, b, 32);
    ears(x + 16, b - 26, 7, 21, 6.5, 0.4);
    cushion(x + 1, b - 30, 30, 30, EV.brown, 2);
    for (const s of [-1, 1]) { oval(x + 16 + s * 6, b - 23.5, 2, 2.8, EV.ink); disc(x + 16 + s * 6 - 0.6, b - 24.5, 0.7, EV.white); }
    fluff(x + 16, b - 10.5, 8.5, 7, around(8.5, 7, 10), 2.6);
    oval(x + 16, b - 10, 6, 5.5, '#3a2418');
  } },
  // a cat tree: a fluffy pad, a brown post, a ledge of fluff, a basket with ears up top, a pom-pom on a string
  { id: 'eeveetower', name: 'Eevee cat tree', w: 1, h: 1, price: 560, draw(x, b) {
    floorShadow(x, b, 32);
    ears(x + 16, b - 46, 7, 14, 4.5, 0.35);
    cushion(x + 2, b - 6, 28, 6, EV.cream, 3);
    cyl(x + 13, b - 42, 6, 36, EV.brown);
    for (let h = 9; h < 40; h += 3) R(x + 13, b - h, 6, 0.6, sh(EV.brown, -1));
    R(x + 5.7, b - 26, 0.6, 10, EV.dark); ovalShade(x + 6, b - 14, 2.5, 2.5, EV.cream);
    ovalShade(x + 16, b - 27, 11, 1.6, EV.cream);
    for (const dx of frontRing(11, 12)) ovalShade(x + 16 + dx, b - 26, 2.2, 2.2, EV.cream);
    ovalShade(x + 16, b - 44.5, 11, 4.5, EV.brown);
    ovalShade(x + 16, b - 48.5, 9, 2.5, EV.cream);
  } },
  // a food bowl that's Eevee's face, ears on its rim, heaped with Poké Puffs
  { id: 'eeveebowl', name: 'Eevee food bowl', w: 1, h: 1, price: 160, draw(x, b) {
    floorShadow(x + 4, b, 24);
    ears(x + 16, b - 8, 6, 10, 3.5, 0.4);
    [[-5, 10.5, PUFFS[0]], [5, 10.5, PUFFS[2]], [0, 12, PUFFS[3]]].forEach(([dx, h, c]) => ovalShade(x + 16 + dx, b - h, 3.4, 2.6, c));
    poly([[x + 5, b - 9], [x + 27, b - 9], [x + 24, b], [x + 8, b]], EV.brown);
    oval(x + 16, b - 9, 11, 1.6, EV.cream);
    for (const s of [-1, 1]) oval(x + 16 + s * 4, b - 5, 1, 1.4, EV.ink);
    oval(x + 16, b - 3.2, 0.8, 0.55, EV.ink);
  } },
  // the Soothe Bell, hung from the cream tip of a bushy tail on a fluffy base
  { id: 'eeveebell', name: 'Soothe Bell stand', w: 1, h: 1, price: 420, draw(x, b) {
    floorShadow(x + 3, b, 26);
    fluff(x + 16, b - 3, 12, 3, around(12, 3, 6, 0, Math.PI), 2.4);
    tail(x, b, TAILS.bell);
    R(x + 24.6, b - 57, 0.8, 11, EV.ink);
    const bx = x + 25, by = b - 34;
    poly([...BELL.map(([r, h]) => [bx + r, by - h]), ...BELL.slice().reverse().map(([r, h]) => [bx - r, by - h])], EV.bell);
    oval(bx - 1.8, by - 6, 1.2, 3, '#fff4c0');
    oval(bx, by, 5.4, 1, sh(EV.bell, -1)); disc(bx, by + 0.8, 1.4, sh(EV.bell, -2));
    ovalShade(bx - 2.4, by - 12.2, 2, 1.4, EV.bow); ovalShade(bx + 2.4, by - 12.2, 2, 1.4, EV.bow); disc(bx, by - 12.2, 1, sh(EV.bow, -1));
  } },
  // a two-tier stand of Poké Puffs, a little Eevee on top
  { id: 'eeveepuffs', name: 'Poké Puff stand', w: 1, h: 1, price: 300, draw(x, b) {
    floorShadow(x + 4, b, 24);
    cyl(x + 12, b - 2, 8, 2, EV.honey);
    cyl(x + 15, b - 38, 2, 36, EV.honey);
    ovalShade(x + 16, b - 14, 13, 1.8, EV.cream);
    [-8, 0, 8].forEach((dx, i) => puff(x + 16 + dx, b - 15.5, PUFFS[i]));
    ovalShade(x + 16, b - 30, 9, 1.6, EV.cream);
    [-4.5, 4.5].forEach((dx, i) => puff(x + 16 + dx, b - 31.5, PUFFS[3 + i]));
    face(x + 16, b - 42, 4.5);
  } },
  // a toy box: a brown chest, a fluffy rim under its lid, ears on the lid, a cream paw print on the front
  { id: 'eeveetoybox', name: 'Eevee toy box', w: 1, h: 1, price: 420, draw(x, b) {
    floorShadow(x, b, 32);
    ears(x + 16, b - 26, 6, 15, 4.5, 0.35);
    paw(x + 7, b - 2.2); paw(x + 25, b - 2.2);
    wood(x + 3, b - 21, 26, 18, EV.brown);
    ovalShade(x + 16, b - 10, 3.2, 2.6, EV.cream);
    for (const [dx, h] of [[-3.5, 14], [0, 15.2], [3.5, 14]]) disc(x + 16 + dx, b - h, 1.3, EV.cream);
    cushion(x + 2, b - 27, 28, 7, EV.brown, 3);
    tuftRow(x + 4.5, b - 20.5, 6, 4.6, 2.6);
  } },
  // a beanbag in Eevee's brown, its ears up and its collar round the bottom
  { id: 'eeveebeanbag', name: 'Eevee beanbag', w: 1, h: 1, price: 380, draw(x, b) {
    floorShadow(x, b, 32);
    ears(x + 16, b - 21, 7, 17, 5.5, 0.45);
    ovalShade(x + 16, b - 12.5, 15, 12.5, EV.brown);
    for (const dx of frontRing(13.5, 12)) ovalShade(x + 16 + dx, b - 5, 3.6, 3.6, EV.cream);
  } },
  // a rug of Eevee's face over its collar, seen from above
  { id: 'eeveerug', name: 'Eevee face rug', w: 2, h: 2, layer: 'rug', price: 480, high: 0.04, side: 'w', flat(w) {
    fluff(w / 2, 50, 22, 9, around(22, 9, 9, -Math.PI, 0), 4);
    face(w / 2, 32, 16);
  } },
  // an oval rug of cream fluff, a trail of brown paw prints across it
  { id: 'eeveepawrug', name: 'Eevee paw-print rug', w: 2, h: 1, layer: 'rug', price: 300, high: 0.04, side: 'p', flat(w, h) {
    for (const [dx, dh] of around(28.5, 12.5, 22)) disc(w / 2 + dx, h / 2 - dh, 2.8, sh(EV.cream, -1));
    oval(w / 2, h / 2, 29, 13.5, EV.cream);
    const g = ctx(); g.strokeStyle = sh(EV.cream, -1); g.lineWidth = 0.8; g.setLineDash([2, 1.5]);
    g.beginPath(); g.ellipse(w / 2, h / 2, 25, 10.5, 0, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
    for (const [px, py] of [[12, 19], [22, 12], [33, 20], [43, 12], [53, 19]]) {
      oval(px, py, 2.8, 2.4, EV.brown);
      for (const [tx, ty] of [[-2.6, -2.8], [0, -3.8], [2.6, -2.8]]) disc(px + tx, py + ty, 1.1, EV.brown);
    }
  } },
].map(f => ({ group: G, solo: true, ...f }));
