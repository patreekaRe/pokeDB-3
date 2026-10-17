/* base-furniture-gengar.js  -  the Gengar room (furniture expansion session a, 2026-10-17): 25 pieces each shaped after
   Gengar, spooky-cute: its round purple body, pointed ears, the spikes down its back, red eyes and wide white grin, a
   Shadow Ball, Lavender Town. One colour each, Gengar's own.
   The uprights are painted in units up from the floor (`at()`, `px()` / `py()`), so js/base-models-gengar.js builds
   every head, ear, spike, eye and grin from the same numbers: `headSpec()` / `faceSpec()` here are shared with it. */

import { R, disc, oval, ovalShade, cyl, panel, inset, cushion, floorShadow, ctx, sh } from './base-paint.js';

export const GENG = {
  body: '#7a58b8', deep: '#5a3e92', lite: '#9c7cd6', pale: '#e6dcf6', red: '#e84848', white: '#fbf8ff', ink: '#2a1a3a',
  shade: '#2c1a40', ball: '#b070ff', flame: '#c890ff', wood: '#4e3466', stone: '#a69cbc', tower: '#8c78b4', brew: '#9ad048',
  leaf: '#4a2e6a', mirror: '#dde6f4', screen: '#1c1428',
};
const { body: BODY, deep: DEEP, lite: LITE, pale: PALE, red: RED, white: WHITE, ink: INK } = GENG;

/* ---------- Gengar's parts, shared with the models (units, y up from the floor) ---------- */

/** A Gengar head (or body) r across and ry up from its middle cx, cy: its ears and back spikes as cones
    `{ x, y, d, len, bw, spike }` (base middle, lean d from upright, length, half-width), and its face. */
export function headSpec(cx, cy, r, ry, o = {}) {
  const m = Math.min(r, ry), ea = o.ea ?? 0.85, eat = o.eat ?? 0.78, ed = o.ed ?? 0.55, eLen = o.eLen ?? 0.75 * m, eBw = o.eBw ?? 0.32 * m;
  const sLen = o.sLen ?? 0.45 * m, sBw = o.sBw ?? 0.17 * m, cones = [];
  for (const a of o.spikes ?? [-0.4, 0, 0.4]) cones.push({ x: cx + Math.sin(a) * r * 0.8, y: cy + Math.cos(a) * ry * 0.8, d: a, len: sLen, bw: sBw, spike: true });
  if (o.ears !== false) for (const s of [-1, 1]) cones.push({ x: cx + s * Math.sin(ea) * r * eat, y: cy + Math.cos(ea) * ry * eat, d: s * ed, len: eLen, bw: eBw });
  const face = o.face === false ? null : faceSpec(cx + (o.fx ?? 0), cy + (o.fy ?? 0), o.f ?? m, o.grin !== false);
  return { cones, face, sLen, sBw };
}
/** Gengar's face, f its size: red eyes slanted down to the middle, the grin below. */
export function faceSpec(cx, cy, f, grin = true) {
  return {
    eyes: [-1, 1].map(s => ({ x: cx + s * 0.36 * f, y: cy + 0.14 * f, rx: 0.2 * f, ry: 0.13 * f, rot: s * 0.38 })),
    grin: grin ? { x: cx, y: cy - 0.3 * f, w: 1.12 * f, h: 0.42 * f } : null,
  };
}
/** The grin's top and bottom edges at x across it, up from its middle. */
export const grinTop = (g, x) => g.h * 0.15 - g.h * 0.2 * (1 - (2 * x / g.w) ** 2);
export const grinBot = (g, x) => g.h * 0.15 - g.h * 0.95 * (1 - (2 * x / g.w) ** 2);
/** The planter's ghost-plant leaves: [lean, length]. */
export const LEAVES = [[-0.95, 15], [-0.48, 19], [0, 22], [0.48, 19], [0.95, 15]];

/* ---------- painting in units up from the floor ---------- */

let OX = 0, OB = 0;
const at = (x, b) => { OX = x; OB = b; };
const px = (i) => OX + i, py = (j) => OB - j;
function poly(pts, c) {
  const g = ctx();
  g.fillStyle = c; g.beginPath();
  pts.forEach(([i, j], n) => (n ? g.lineTo(px(i), py(j)) : g.moveTo(px(i), py(j))));
  g.closePath(); g.fill();
}
/** A box from (i, j) its bottom left, w x h, rounded rad, lit from the top left. */
function box(i, j, w, h, c, rad = 1) {
  const g = ctx(), l = g.createLinearGradient(px(i), py(j + h), px(i + w * 0.3), py(j));
  l.addColorStop(0, sh(c, 1)); l.addColorStop(0.3, c); l.addColorStop(1, sh(c, -1));
  g.fillStyle = l; g.beginPath(); g.roundRect(px(i), py(j + h), w, h, Math.min(rad, w / 2, h / 2)); g.fill();
}
const ell = (i, j, rx, ry, c) => ovalShade(px(i), py(j), rx, ry, c);
const flatEll = (i, j, rx, ry, c) => oval(px(i), py(j), rx, ry, c);
const words = (text, i, j, size, col, w) => {
  const g = ctx();
  g.font = `bold ${size}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = col; g.fillText(text, px(i), py(j), w);
};
function cone2(c, col) {
  const s = Math.sin(c.d), co = Math.cos(c.d), tip = [c.x + s * c.len, c.y + co * c.len];
  const l = [c.x - co * c.bw, c.y + s * c.bw], r = [c.x + co * c.bw, c.y - s * c.bw];
  poly([l, tip, r], col); poly([l, tip, [c.x, c.y]], sh(col, 1));
}
function face2(F) {
  const g = ctx();
  for (const e of F.eyes) {
    g.save(); g.translate(px(e.x), py(e.y)); g.rotate(-e.rot);
    oval(0, 0, e.rx + 0.5, e.ry + 0.5, sh(RED, -2)); oval(0, 0, e.rx, e.ry, RED);
    disc(-0.32 * e.rx, -0.3 * e.ry, e.ry * 0.36, '#ffffff');
    g.restore();
  }
  const G = F.grin;
  if (!G) return;
  const pts = [];
  for (let k = 0; k <= 16; k++) { const x = -G.w / 2 + G.w * k / 16; pts.push([G.x + x, G.y + grinTop(G, x)]); }
  for (let k = 16; k >= 0; k--) { const x = -G.w / 2 + G.w * k / 16; pts.push([G.x + x, G.y + grinBot(G, x)]); }
  g.save(); g.lineWidth = 0.7; g.strokeStyle = sh(INK, 1);
  g.beginPath(); pts.forEach(([i, j], n) => (n ? g.lineTo(px(i), py(j)) : g.moveTo(px(i), py(j)))); g.closePath();
  g.stroke(); g.fillStyle = WHITE; g.fill();
  g.restore();
}
/** A Gengar head (see headSpec), painted: spikes behind, ears, the round of it, its face. */
function head2(cx, cy, r, ry, o = {}) {
  const S = headSpec(cx, cy, r, ry, o), col = o.col ?? BODY;
  for (const c of S.cones) if (c.spike) cone2(c, DEEP);
  for (const c of S.cones) if (!c.spike) cone2(c, col);
  ell(cx, cy, r, ry, col);
  if (S.face) face2(S.face);
  return S;
}
/** An upright piece W tiles wide: its painter in floor units, squeezed into a side view's narrower width. */
const up = (W, fn) => (x, b, vw) => {
  const g = ctx(), k = vw / (W * 32);
  floorShadow(x, b, vw);
  g.save();
  if (k !== 1) { g.translate(x, 0); g.scale(k, 1); x = 0; }
  at(x, b); fn();
  g.restore();
};
/** A wall piece W tiles wide, painted in units up from the strip's foot (96 down from the wall's top). */
const onWall = (fn) => (x) => { at(x, 96); fn(); };
/** Paints only what lies below height j. */
const below = (j, fn) => { const g = ctx(); g.save(); g.beginPath(); g.rect(px(-64), py(j), 256, 256); g.clip(); fn(); g.restore(); };
/** The grave's fingers, hooked over its round top. */
export const graveFingers = () => [9, 23].flatMap(i => [-2.2, 0, 2.2].map(d => [i + d, 28.6 + Math.sqrt(Math.max(0, 100 - (i + d - 16) ** 2))]));
/** Gengar's three-fingered hand gripping an edge at i, j. */
const hand2 = (i, j) => { for (const d of [-2.4, 0, 2.4]) ell(i + d, j, 1.6, 2, BODY); };

const room = (o) => ({ group: 'Gengar room', solo: true, ...o });

export const GENGAR_KINDS = [
  // the bed: its headboard Gengar's head grinning over the pillows, a purple duvet
  room({ id: 'gengbed', name: 'Gengar bed', w: 2, h: 2, price: 850, high: 0.62, side: 'w', seat: 'bed', flat(w, h) {
    panel(1, 2, w - 2, h - 3, DEEP);
    inset(4, 6, w - 8, h - 9, PALE);
    oval(32, 5, 26, 5, sh(BODY, -1)); oval(32, 4.5, 25, 4, BODY); oval(26, 3.5, 9, 1.2, sh(BODY, 1));
    for (const i of [24, 32, 40]) { const g = ctx(); g.fillStyle = DEEP; g.beginPath(); g.moveTo(i - 2, 2); g.lineTo(i, 0); g.lineTo(i + 2, 2); g.fill(); }
    cushion(7, 9, 24, 12, WHITE, 3); cushion(33, 9, 24, 12, WHITE, 3);
    cushion(1.5, 22, w - 3, h - 23, BODY, 4);
    cushion(1.5, 21, w - 3, 6, PALE, 2);
    for (let i = 6; i < w - 4; i += 8) { const g = ctx(); g.fillStyle = sh(BODY, -1); g.beginPath(); g.moveTo(i, h - 3); g.lineTo(i + 4, h - 9); g.lineTo(i + 8, h - 3); g.fill(); }
  } }),

  // an armchair: Gengar's head is its back, rounded purple arms, a lilac cushion
  room({ id: 'gengchair', name: 'Gengar armchair', w: 1, h: 1, price: 320, draw: up(1, () => {
    box(5, 14, 22, 10, DEEP, 1);
    head2(16, 32, 13, 12);
    for (const i of [4, 25]) R(px(i), py(5), 3, 5, DEEP);
    box(3, 4, 26, 10, BODY, 2);
    cushion(px(5), py(18), 22, 5, LITE, 3);
    for (const i of [1, 24]) cushion(px(i), py(22), 7, 18, BODY, 3);
  }) }),

  // a sofa: the back one wide grinning Gengar head, spikes along it, its stubby arms for the sofa's arms
  room({ id: 'gengsofa', name: 'Gengar sofa', w: 2, h: 1, price: 720, draw: up(2, () => {
    box(7, 14, 50, 12, DEEP, 1);
    head2(32, 28, 30, 15, SOFA);
    for (const i of [6, 55]) R(px(i), py(4), 3, 4, DEEP);
    box(4, 4, 56, 11, BODY, 2);
    for (const i of [10.5, 32]) cushion(px(i), py(19), 21.5, 5.5, LITE, 3);
    for (const i of [1, 53]) {
      cushion(px(i), py(24), 10, 20, BODY, 4);
      for (const d of [2.5, 5, 7.5]) ell(i + d, 21.5, 1.6, 1.8, sh(BODY, 1));
    }
  }) }),

  // a coffee table carried on Gengar's head, its ears poking out under the top
  room({ id: 'gengtable', name: 'Gengar coffee table', w: 2, h: 1, price: 480, draw: up(2, () => {
    head2(32, 9.5, 22, 9.5, TABLE);
    box(2, 18, 60, 3, GENG.wood, 1);
    R(px(4), py(21), 56, 0.8, sh(GENG.wood, 1));
  }) }),

  // a desk: drawers on the left, its hutch Gengar's spiky head peering over the desktop
  room({ id: 'gengdesk', name: 'Gengar desk', w: 2, h: 1, price: 620, draw: up(2, () => {
    head2(32, 34, 24, 11, DESK);
    for (const i of [54.5]) cyl(px(i), py(22), 4, 22, DEEP);
    box(3, 0, 20, 22, BODY, 1.5);
    for (const j of [3, 12]) { box(5, j, 16, 7.5, LITE, 1); disc(px(13), py(j + 3.75), 1.4, RED); }
    box(1, 22, 62, 3, GENG.wood, 1);
  }) }),

  // a wardrobe: Gengar's round head on top with its eyes, the grin across both doors, and something ghostly inside
  room({ id: 'gengwardrobe', name: 'Gengar wardrobe', w: 2, h: 1, price: 780, draw: up(2, () => {
    for (const i of [13, 51]) ell(i, 2.4, 4, 2.4, DEEP);
    head2(32, 54, 26, 16, WARD);
    box(6, 4, 52, 50, BODY, 3);
    box(9, 7, 22.6, 43, LITE, 1.5); box(32.4, 7, 22.6, 43, LITE, 1.5);
    R(px(31.6), py(50), 0.8, 43, sh(BODY, -1));
    face2({ eyes: [], grin: WARD_GRIN });
    for (const i of [29, 35]) disc(px(i), py(22), 1.3, DEEP);
  }) }),

  // a chest of drawers: red eye knobs on the top drawer, a grin for the middle one's handle, ears at the back
  room({ id: 'gengdresser', name: 'Gengar dresser', w: 2, h: 1, price: 560, draw: up(2, () => {
    for (const c of DRESSER_CONES) cone2(c, c.spike ? DEEP : BODY);
    for (const i of [8.5, 55.5]) ell(i, 2.2, 3.5, 2.2, DEEP);
    box(3, 3, 58, 29, BODY, 3);
    for (const j of [5, 14, 23]) box(6, j, 52, 7, LITE, 1.2);
    face2(DRESSER_FACE);
    for (const i of [24, 40]) disc(px(i), py(8.5), 1.3, DEEP);
  }) }),

  // a bookshelf, Gengar's head on top keeping watch, a Shadow Ball among the books
  room({ id: 'gengshelf', name: 'Gengar bookshelf', w: 1, h: 1, price: 520, draw: up(1, () => {
    head2(16, 60, 15, 12, SHELF);
    box(2, 0, 28, 58, BODY, 1.5);
    inset(px(5), py(56), 22, 53, DEEP);
    for (const j of [0, 18.75, 35.75, 55.5]) box(2, j, 28, 2.5, BODY, 0.8);
    for (const b of BOOKS) box(b[0], b[1], b[2], b[3], b[4], 0.5);
    disc(px(BALL_AT[0]), py(BALL_AT[1]), BALL_AT[2], GENG.shade); disc(px(BALL_AT[0] - 1), py(BALL_AT[1] + 1), 2, GENG.ball);
  }) }),

  // a lamp: a little Gengar head holding up a glowing Shadow Ball
  room({ id: 'genglamp', name: 'Gengar Shadow Ball lamp', w: 1, h: 1, price: 420, glow: [GENG.ball], draw: up(1, () => {
    cyl(px(15), py(31), 2, 12, DEEP);
    head2(16, 11, 13, 11, LAMP);
    disc(px(16), py(40), 10, GENG.shade);
    disc(px(16), py(40), 7.5, GENG.ball);
    disc(px(14), py(42.5), 2.5, sh(GENG.ball, 2));
    const g = ctx(); g.strokeStyle = sh(GENG.shade, 1); g.lineWidth = 1.4;
    g.beginPath(); g.ellipse(px(16), py(40), 9, 3, -0.4, 0, Math.PI * 2); g.stroke();
  }) }),

  // a wall clock: Gengar's head, its eyes over a white dial
  room({ id: 'gengclock', name: 'Gengar clock', w: 1, h: 1, layer: 'wall', price: 360, wall: onWall(() => {
    head2(16, 60, 13, 13, CLOCK);
    disc(px(16), py(54.5), 6.4, sh(PALE, -1)); disc(px(16), py(54.5), 6, WHITE);
    for (let n = 0; n < 12; n++) { const a = n * Math.PI / 6; disc(px(16 + Math.sin(a) * 4.8), py(54.5 + Math.cos(a) * 4.8), n % 3 ? 0.35 : 0.6, DEEP); }
    const g = ctx(); g.strokeStyle = DEEP; g.lineWidth = 0.9;
    g.beginPath(); g.moveTo(px(16), py(54.5)); g.lineTo(px(16), py(58.5)); g.moveTo(px(16), py(54.5)); g.lineTo(px(18.6), py(53)); g.stroke();
    disc(px(16), py(54.5), 0.8, RED);
  }) }),

  // a television: Gengar's body, its eyes over the screen, the screen set in a white grin of teeth
  room({ id: 'gengtv', name: 'Gengar TV', w: 2, h: 1, price: 950, draw: up(2, () => {
    for (const i of [18, 46]) ell(i, 2.6, 5, 2.6, DEEP);
    for (const c of TV_CONES) cone2(c, c.spike ? DEEP : BODY);
    box(4, 3, 56, 44, BODY, 4);
    box(8, 8, 48, 30, WHITE, 3);
    for (let i = 14; i < 52; i += 6) { R(px(i), py(38), 0.7, 3, sh(PALE, -1)); R(px(i), py(11), 0.7, 3, sh(PALE, -1)); }
    box(11, 11, 42, 24, GENG.screen, 1);
    R(px(13), py(33), 16, 1, 'rgba(255,255,255,0.12)');
    face2(TV_FACE);
  }) }),

  // a standing mirror: Gengar's whole round body is its frame, ears and spikes on top, eyes over the glass
  room({ id: 'gengmirror', name: 'Gengar mirror', w: 1, h: 1, price: 460, draw: up(1, () => {
    for (const i of [10, 22]) ell(i, 2.5, 3.5, 2.5, DEEP);
    head2(16, 30, 14, 26, MIRROR);
    oval(px(16), py(28), 10, 17.5, sh(BODY, -1));
    oval(px(16), py(28), 9.5, 17, GENG.mirror);
    const g = ctx();
    for (const [i, j, l] of [[11, 38, 8], [13, 40, 5]]) { g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 1; g.beginPath(); g.moveTo(px(i), py(j)); g.lineTo(px(i + l * 0.4), py(j - l)); g.stroke(); }
  }) }),

  // a round rug: Gengar's face, ears and spikes, grinning up from the floor
  room({ id: 'gengrug', name: 'Gengar face rug', w: 3, h: 2, layer: 'rug', price: 420, high: 0.04, side: 'c', flat(w, h) {
    at(0, h);
    head2(48, 30, 34, 22, { f: 24, sLen: 9, sBw: 4, spikes: [-0.6, -0.3, 0, 0.3, 0.6], ea: 1.0, eLen: 14, eBw: 7, ed: 0.6 });
  } }),

  // Gengar's shadow, flat on the floor: ears, spikes, arms and feet, red eyes and the grin glowing out of it
  room({ id: 'gengshadowrug', name: 'Gengar shadow rug', w: 2, h: 2, layer: 'rug', price: 360, high: 0.04, side: 'c', flat(w, h) {
    at(0, h);
    const D = GENG.shade;
    for (const s of [-1, 1]) {
      const g = ctx(); g.save(); g.translate(px(32 + s * 24), py(30)); g.rotate(s * 0.5); oval(0, 0, 7, 4.5, D); g.restore();
      for (const d of [-2.6, 0, 2.6]) disc(px(32 + s * 30), py(31 + d), 1.7, D);
      oval(px(32 + s * 11), py(8), 7, 4.5, D);
      for (const d of [-3, 0, 3]) disc(px(32 + s * 11 + d), py(4), 1.6, D);
    }
    const S = headSpec(32, 32, 22, 20, { f: 18 });
    for (const c of S.cones) cone2(c, D);
    oval(px(32), py(32), 22, 20, D);
    oval(px(30), py(38), 12, 7, sh(D, 1));
    face2(S.face);
  } }),

  // a BOO! sign, Gengar peeking over it with its hands on the top
  room({ id: 'gengboo', name: 'Gengar BOO! sign', w: 2, h: 1, layer: 'wall', price: 220, wall: onWall(() => {
    head2(32, 62, 15, 13, BOO);
    box(6, 38, 52, 24, GENG.wood, 2);
    box(8, 40, 48, 20, sh(GENG.wood, 1), 1.5);
    words('BOO!', 32, 49.5, 15, WHITE, 44);
    for (const i of [17, 47]) hand2(i, 61.5);
  }) }),

  // a portrait: Lavender Town's tower by moonlight, Gengar grinning out of the dark; the frame has its ears
  room({ id: 'gengportrait', name: 'Gengar portrait', w: 1, h: 1, layer: 'wall', price: 320, wall: onWall(() => {
    for (const c of PORTRAIT_CONES) cone2(c, c.spike ? DEEP : BODY);
    box(3, 40, 26, 42, GENG.wood, 1.5);
    const g = ctx(), sky = g.createLinearGradient(0, py(79), 0, py(43));
    sky.addColorStop(0, '#1a1030'); sky.addColorStop(1, '#4a3070');
    g.fillStyle = sky; g.fillRect(px(6), py(79), 20, 36);
    disc(px(21), py(73), 3, '#f4ecc8'); disc(px(22.2), py(74), 2.6, '#2a1c44');
    R(px(9), py(66), 6, 23, '#24183a'); R(px(10), py(70), 4, 4, '#24183a'); R(px(11), py(73), 2, 3, '#24183a');
    for (const j of [50, 56, 62]) R(px(11.4), py(j), 1.2, 1.6, '#f8d870');
    face2(faceSpec(19, 53, 8));
  }) }),

  // a candelabra: Gengar holding two candles out in its hands, a third on its head between its ears
  room({ id: 'gengcandles', name: 'Gengar candelabra', w: 1, h: 1, price: 340, glow: [GENG.flame], draw: up(1, () => {
    box(8, 0, 16, 3, DEEP, 1);
    const g = ctx(); g.strokeStyle = BODY; g.lineWidth = 3.4; g.lineCap = 'round';
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(px(16 + s * 8), py(13)); g.quadraticCurveTo(px(16 + s * 13), py(15), px(16 + s * 13), py(23)); g.stroke(); }
    cyl(px(15), py(26), 2, 6, DEEP);
    head2(16, 12, 10, 9, CANDLES);
    for (const [i, j, h] of CANDLE_AT) {
      box(i - 2.5, j - 2, 5, 2, DEEP, 0.8);
      cyl(px(i - 1.5), py(j + h), 3, h, PALE);
      oval(px(i), py(j + h + 2.6), 1.8, 3, GENG.flame); oval(px(i), py(j + h + 2), 0.8, 1.4, '#ffffff');
    }
  }) }),

  // Lavender Town's tower in miniature, Gengar's eyes and grin in its big window
  room({ id: 'gengtower', name: 'Gengar tower model', w: 1, h: 1, price: 680, draw: up(1, () => {
    const T = GENG.tower, roof = (j0, h, b0, b1) => poly([[16 - b0, j0], [16 + b0, j0], [16 + b1, j0 + h], [16 - b1, j0 + h]], DEEP);
    box(4, 0, 24, 24, T, 0.8); roof(24, 4, 14, 11);
    box(7, 28, 18, 18, T, 0.8); roof(46, 4, 11, 8);
    box(10, 50, 12, 12, T, 0.8); roof(62, 14, 8, 0.01);
    box(13, 0, 6, 9, INK, 2.5);
    for (const i of [7, 22]) box(i, 13, 3, 5, '#f8d870', 0.6);
    box(11, 31, 10, 12, INK, 2);
    box(14, 53, 4, 5, '#f8d870', 0.8);
    face2(TOWER_FACE);
  }) }),

  // a pouf: a squashed round Gengar to sit on, ears and spikes and its grin
  room({ id: 'gengpouf', name: 'Gengar pouf', w: 1, h: 1, price: 260, draw: up(1, () => {
    head2(16, 9, 14, 9, POUF);
  }) }),

  // a toy chest: the lid is the top of Gengar's head, the grin runs along under it
  room({ id: 'gengchest', name: 'Gengar toy chest', w: 2, h: 1, price: 520, draw: up(2, () => {
    for (const i of [15, 49]) ell(i, 2, 4, 2, DEEP);
    head2(32, 20, 26, 13, CHEST);
    box(6, 2, 52, 18, BODY, 3);
    R(px(7), py(20.4), 50, 0.8, sh(BODY, -2));
    face2({ eyes: [], grin: CHEST_GRIN });
  }) }),

  // a jack-in-the-box: Gengar sprung out of it, grinning, a crank on the side
  room({ id: 'gengjack', name: 'Gengar jack-in-the-box', w: 1, h: 1, price: 360, draw: up(1, () => {
    box(5, 20, 22, 20, LITE, 1);
    for (let j = 20; j < 30; j += 2.5) oval(px(16), py(j + 1.2), 4, 1.3, sh('#c8c8d8', -1));
    head2(16, 39, 11, 10, JACK);
    box(5, 0, 22, 20, LITE, 1.5);
    inset(px(7), py(18), 18, 16, BODY);
    poly([[16, 15], [21, 10], [16, 5], [11, 10]], LITE);
    R(px(27), py(12), 3, 2, '#c8c8d8'); R(px(29), py(15), 1.5, 4, '#c8c8d8'); disc(px(30), py(15), 1.6, RED);
  }) }),

  // a side table: a small Gengar holds the round top up on its ears
  room({ id: 'gengsidetable', name: 'Gengar side table', w: 1, h: 1, price: 280, draw: up(1, () => {
    head2(16, 9.5, 11, 9.5, SIDE);
    box(2, 21, 28, 3, GENG.wood, 1.5);
  }) }),

  // a cauldron: Gengar's grinning round body bubbling with poison, its ears for handles
  room({ id: 'gengcauldron', name: 'Gengar cauldron', w: 1, h: 1, price: 540, draw: up(1, () => {
    for (const i of [7.5, 24.5]) R(px(i - 1.5), py(4), 3, 4, INK);
    for (const c of CAULDRON_CONES) cone2(c, c.spike ? DEEP : BODY);
    for (const [i, j, r] of BUBBLES) disc(px(i), py(j), r, sh(GENG.brew, 1));
    below(19, () => ell(16, 12, 14, 10, BODY));
    oval(px(16), py(19), 10.6, 2, DEEP); oval(px(16), py(19.2), 9, 1.3, GENG.brew);
    face2(CAULDRON_FACE);
  }) }),

  // a gravestone from Lavender Town, Gengar peeking over the top with its hands on it
  room({ id: 'genggrave', name: 'Gengar peekaboo grave', w: 1, h: 1, price: 300, draw: up(1, () => {
    head2(16, 38, 12, 10, GRAVE);
    box(3, 0, 26, 4, sh(GENG.stone, -1), 1);
    box(6, 4, 20, 24, GENG.stone, 0.5); disc(px(16), py(28), 10, GENG.stone); R(px(6), py(29), 20, 2, GENG.stone);
    words('BOO', 16, 17, 7, sh(GENG.stone, -2), 16);
    for (const [i, j] of graveFingers()) ell(i, j, 1.6, 2, BODY);
  }) }),

  // a planter: a round Gengar pot, ears at its rim, a ghostly purple plant in it
  room({ id: 'gengplanter', name: 'Gengar planter', w: 1, h: 1, price: 260, draw: up(1, () => {
    const g = ctx();
    for (const [a, len] of LEAVES) {
      g.save(); g.translate(px(16 + Math.sin(a) * len / 2), py(17 + Math.cos(a) * len / 2)); g.rotate(a);
      oval(0, 0, 3.4, len / 2, GENG.leaf); R(-0.3, -len / 2 + 1, 0.6, len - 2, sh(GENG.leaf, 1));
      g.restore();
    }
    for (const c of PLANTER_CONES) cone2(c, BODY);
    below(17, () => ell(16, 10, 12, 10, BODY));
    oval(px(16), py(17), 8.8, 1.8, sh(BODY, -1)); oval(px(16), py(17.2), 7.6, 1.2, '#3a2a24');
    face2(faceSpec(16, 9, 8));
  }) }),
];

/* each piece's head and parts, read by its model too */
const SOFA = { spikes: [-0.8, -0.4, 0, 0.4, 0.8], sLen: 6, sBw: 2.6, ea: 1.1, ed: 0.6, eLen: 11, eBw: 4.5, f: 13, fy: 1 };
const TABLE = { spikes: [], ea: 1.25, ed: 1.0, eLen: 7, eBw: 3, f: 9 };
const DESK = { spikes: [-0.7, -0.35, 0, 0.35, 0.7], sLen: 5, sBw: 2.2, ea: 1.1, eLen: 9, eBw: 3.5, f: 10 };
const WARD = { f: 14, fy: 2, grin: false };
const WARD_GRIN = { x: 32, y: 36, w: 34, h: 12 };
const DRESSER_CONES = [
  { x: 8, y: 30, d: -0.4, len: 9, bw: 4 }, { x: 56, y: 30, d: 0.4, len: 9, bw: 4 },
  ...[[20, -0.2], [32, 0], [44, 0.2]].map(([x, d]) => ({ x, y: 30, d, len: 5, bw: 2.5, spike: true })),
];
const DRESSER_FACE = { eyes: [-1, 1].map(s => ({ x: 32 + s * 8, y: 26.5, rx: 3, ry: 1.9, rot: s * 0.38 })), grin: { x: 32, y: 18.6, w: 22, h: 6 } };
const SHELF = { f: 8, fy: 4 };
const BOOKS = [
  [6, 2.5, 3, 13, GENG.red], [9.2, 2.5, 2.6, 15, PALE], [12, 2.5, 3.4, 12, LITE], [15.6, 2.5, 2.4, 14, GENG.ink], [18.2, 2.5, 3, 13, BODY],
  [6, 21.25, 2.8, 12, LITE], [9, 21.25, 3, 14, BODY], [12.2, 21.25, 2.4, 11, GENG.red],
  [6, 38.25, 3.2, 14, PALE], [9.4, 38.25, 2.6, 12, GENG.red], [12.2, 38.25, 3, 15, LITE], [15.4, 38.25, 2.8, 13, BODY], [18.4, 38.25, 2.6, 11, PALE],
];
const BALL_AT = [21, 26.5, 4.8];
const LAMP = { spikes: [-0.45, 0.45], f: 10, fy: -1 };
const CLOCK = { f: 12, grin: false, fy: 1 };
const TV_CONES = [
  { x: 10, y: 43, d: -0.45, len: 12, bw: 5 }, { x: 54, y: 43, d: 0.45, len: 12, bw: 5 },
  ...[[24, -0.25], [32, 0], [40, 0.25]].map(([x, d]) => ({ x, y: 45, d, len: 6, bw: 2.5, spike: true })),
];
const TV_FACE = faceSpec(32, 39.5, 16, false);
const MIRROR = { ea: 0.5, eat: 0.95, ed: 0.35, eLen: 9, eBw: 3.6, spikes: [-0.18, 0.18], sLen: 8, sBw: 2.2, f: 10, fy: 18, grin: false };
const BOO = { f: 11, fy: 2, grin: false };
const PORTRAIT_CONES = [
  { x: 6, y: 80, d: -0.5, len: 7, bw: 3 }, { x: 26, y: 80, d: 0.5, len: 7, bw: 3 },
  ...[[12, -0.2], [16, 0], [20, 0.2]].map(([x, d]) => ({ x, y: 81, d, len: 4, bw: 1.8, spike: true })),
];
const CANDLES = { spikes: [], f: 8, fy: -1 };
const CANDLE_AT = [[3, 25, 10], [29, 25, 10], [16, 28, 11]];
const TOWER_FACE = faceSpec(16, 37, 8);
const POUF = { f: 8 };
const CHEST = { f: 14, fy: 3, grin: false };
const CHEST_GRIN = { x: 32, y: 15, w: 46, h: 9 };
const JACK = { f: 9 };
const SIDE = { spikes: [], ea: 0.7, ed: 0.15, eLen: 6, f: 8, fy: -1 };
const CAULDRON_CONES = [
  { x: 4.5, y: 17, d: -0.6, len: 6, bw: 2.8 }, { x: 27.5, y: 17, d: 0.6, len: 6, bw: 2.8 },
  ...[[10, -0.3], [16, 0], [22, 0.3]].map(([x, d]) => ({ x, y: 20, d, len: 5, bw: 2, spike: true })),
];
const CAULDRON_FACE = faceSpec(16, 11, 9);
const BUBBLES = [[12, 20, 2], [18.5, 20.3, 2.4], [15, 22, 1.4]];
const GRAVE = { f: 9, fy: 2, grin: false };
const PLANTER_CONES = [{ x: 7, y: 16, d: -0.6, len: 6, bw: 2.6 }, { x: 25, y: 16, d: 0.6, len: 6, bw: 2.6 }];

/** What the models read: each piece's head options and parts. */
export const GENG_PARTS = {
  SOFA, TABLE, DESK, WARD, WARD_GRIN, DRESSER_CONES, DRESSER_FACE, SHELF, BOOKS, BALL_AT, LAMP, CLOCK, TV_CONES, TV_FACE,
  MIRROR, BOO, PORTRAIT_CONES, CANDLES, CANDLE_AT, TOWER_FACE, POUF, CHEST, CHEST_GRIN, JACK, SIDE, CAULDRON_CONES,
  CAULDRON_FACE, BUBBLES, GRAVE, PLANTER_CONES,
};
