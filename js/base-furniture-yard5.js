/* base-furniture-yard5.js  -  the backyard's statues and lights (the user's ask, 2026-10-16: a catalogue as big as Animal
   Crossing's, every piece a "3D detailed CLEAN" model): the Statues and Lights tabs of Smeargle's garden catalogue
   (js/garden-shop.js), every kind `outdoor`, on the Yard shelf, in the 20 themes. Modelled from parts in
   js/base-models-y2.js; a Pokémon statue is its own sprite in stone on its plinth (js/base-figures.js, read by both, so
   the tray's picture and the model agree). The lights' lamps are their `glow`, and a tap switches them (js/base-play.js's `light`). */

import { k, sh, R, panel, wood, disc, oval, ovalShade, cyl, leaf, foliage, glass, tri, floorShadow, ctx } from './base-paint.js';
import { EYE, INK, SOIL, GOLD, WICKER, FLAMES, LANTURN, CHINCHOU, MORELULL, FIREFLY, DIGITS, PODIUM, digitScale,
  OBELISK, UNOWN, unownStone, NEON, CROWN, BULBS, ARCH, SHROOMS, SPOTS } from './base-models-y2.js';
import { FIGURES, figureOf, figureAt } from './base-figures.js';

export const YARD_KINDS_5 = [];
const add = (yard, list) => list.forEach(f => YARD_KINDS_5.push({ group: 'Yard', outdoor: true, yard, ...f }));

const iron = () => sh(k.m, -1);
const poly = (pts, c) => { const g = ctx(); g.fillStyle = c; g.beginPath(); pts.forEach(([px, py], i) => i ? g.lineTo(px, py) : g.moveTo(px, py)); g.closePath(); g.fill(); };
const line = (x0, y0, x1, y1, c, w = 2) => { const g = ctx(); g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
const curve = (pts, c, w = 2) => { const g = ctx(); g.strokeStyle = c; g.lineWidth = w; g.lineCap = g.lineJoin = 'round'; g.beginPath(); pts.forEach(([px, py], i) => i ? g.lineTo(px, py) : g.moveTo(px, py)); g.stroke(); };
const grad = (y0, y1, c) => { const l = ctx().createLinearGradient(0, y0, 0, y1); l.addColorStop(0, sh(c, 1)); l.addColorStop(0.4, c); l.addColorStop(1, sh(c, -1)); return l; };
/** A piece painted from the front at its own width; a narrower facing is the same picture squeezed in. */
const facing = (w, draw) => function (x, b, vw) {
  if (vw === w * 32) return draw(x, b, vw);
  const g = ctx(); g.save(); g.translate(x, 0); g.scale(vw / (w * 32), 1); draw(0, b, w * 32); g.restore();
};

/* ---------- the statues: the plinth, then the figure (js/base-figures.js) ---------- */
function plinthArt(x, b, [x0, x1, h]) {
  const w = x1 - x0, cx = x + (x0 + x1) / 2;
  panel(x + x0 - 1, b - 3, w + 2, 3, sh(k.p, -1));
  panel(x + x0, b - h + 3, w, h - 6, k.p);
  R(x + x0, b - h + 3, w, 1.2, k.c);
  if (h >= 12) panel(cx - w * 0.2, b - 3 - (h - 6) / 2 - (h - 6) * 0.25 + 0.3, w * 0.4, (h - 6) * 0.5, k.a);
  panel(x + x0 - 1, b - h, w + 2, 3, sh(k.p, -1));
}
function bedArt(x, b, [x0, x1, h]) {
  wood(x + x0, b - h, x1 - x0, h, k.w);
  R(x + x0 + 2.5, b - h, x1 - x0 - 5, 1.5, SOIL);
}
function moundArt(x, b, [x0, x1, h]) {
  oval(x + (x0 + x1) / 2, b - h / 2, (x1 - x0) / 2, h / 2 + 1, SOIL);
  oval(x + (x0 + x1) / 2, b - h, (x1 - x0) / 2 - 3, 2.5, '#7a5a3e');
  for (const [dx, r] of [[-10, 2.6], [10, 2.8]]) disc(x + (x0 + x1) / 2 + dx, b - h * 0.6, r, '#9a948a');
}
const figureArt = (id) => (x, b, vw) => {
  const F = FIGURES[id], f = figureOf(id), at = figureAt(id);
  floorShadow(x, b, vw);
  (F.mound ? moundArt : F.bed ? bedArt : plinthArt)(x, b, F.plinth);
  if (!f) return;
  const g = ctx(), w = f.w * at.k, h = f.h * at.k;
  g.imageSmoothingEnabled = false;
  g.drawImage(f.c, x + at.cx - w / 2, b - at.y - h, w, h);
};
const statue = (id, name, w, h, price) => ({ id, name, w, h, price, live: () => (figureOf(id) ? 'figure' : ''), draw: facing(w, figureArt(id)) });

/** A Poké Ball, its top in `top`, its band and button facing you. */
function ballArt(cx, cy, r, top) {
  const g = ctx();
  ovalShade(cx, cy, r, r, '#f6f6f2');
  g.save(); g.beginPath(); g.rect(cx - r, cy - r, r * 2, r); g.clip(); ovalShade(cx, cy, r, r, top); g.restore();
  R(cx - r, cy - 0.8, r * 2, 1.6, '#26262e');
  disc(cx, cy, r * 0.34, '#26262e'); disc(cx, cy, r * 0.22, '#f6f6f2');
}

add('Statues', [
  statue('articunostatue', 'Articuno statue', 2, 1, 1200),
  statue('zapdosstatue', 'Zapdos statue', 2, 1, 1200),
  statue('moltresstatue', 'Moltres statue', 2, 1, 1200),
  statue('lugiastatue', 'Lugia statue', 2, 2, 1500),
  statue('hoohstatue', 'Ho-Oh statue', 2, 2, 1500),
  statue('suicunestatue', 'Suicune statue', 2, 1, 1300),
  statue('pikachustatue', 'Pikachu statue', 1, 1, 650),
  statue('snorlaxstatue', 'Snorlax statue', 2, 1, 1000),
  statue('onixstatue', 'Onix statue', 2, 2, 1100),
  { id: 'ballmonument', name: 'Poké Ball monument', w: 1, h: 1, price: 600, draw(x, b) {
    floorShadow(x + 2, b, 28);
    panel(x + 3, b - 4, 26, 4, '#a8a8b0'); panel(x + 6, b - 8, 20, 4, '#b8b8c0');
    poly([[x + 9.5, b - 8], [x + 22.5, b - 8], [x + 21, b - 11], [x + 11, b - 11]], k.p);
    cyl(x + 11, b - 37, 10, 26, k.p); poly([[x + 11, b - 37], [x + 21, b - 37], [x + 22, b - 40], [x + 10, b - 40]], sh(k.p, 1));
    cyl(x + 9, b - 43, 14, 3, k.a);
    ballArt(x + 16, b - 53, 10, k.c === '#f4f4f0' ? k.w : k.c);
  } },
  statue('bulbatopiary', 'Bulbasaur topiary', 2, 1, 700),
  { id: 'unowncircle', name: 'Unown stone circle', w: 2, h: 2, price: 1100, draw: facing(2, (x, b, vw) => {
    floorShadow(x, b, vw);
    panel(x + 1, b - 1.5, 62, 1.5, sh(k.p, -1));
    cyl(x + 26, b - 4.5, 12, 3, '#9a9488');
    UNOWN.stones.map((s, i) => ({ s, i, ...unownStone(s) })).sort((a, c) => a.z - c.z).forEach(({ s, i, turn, x: sx, half }) => {
      const tone = ['#a8a49a', '#9a9488', '#b0aa9e'][i % 3], nz = Math.cos(turn), nx = Math.sin(turn), tx = Math.cos(turn);
      panel(x + sx - half, b - 1.5 - s.h, half * 2, s.h, tone, 1);
      if (nz < 0.15) return;
      const gx = x + sx + nx * UNOWN.d / 2, gy = b - 1.5 - s.h * 0.6, g = ctx();
      g.strokeStyle = EYE; g.lineWidth = 1.1; g.beginPath(); g.ellipse(gx, gy, 2.4 * Math.abs(tx) + 0.3, 2.4, 0, 0, Math.PI * 2); g.stroke();
      disc(gx, gy, 0.9, EYE);
      for (const [a0, b0, a1, b1] of UNOWN.glyphs[s.g]) line(gx + a0 * tx, gy - b0, gx + a1 * tx, gy - b1, EYE, 1.1);
    });
  }) },
  statue('dugtriorocks', 'Dugtrio rocks', 1, 1, 450),
  { id: 'badgeobelisk', name: 'Badge obelisk', w: 1, h: 1, price: 800, draw(x, b) {
    const O = OBELISK;
    floorShadow(x + 2, b, 28);
    panel(x + 4, b - 6, 24, 6, k.p); R(x + 3.8, b - 5.6, 24.4, 1.2, k.c);
    panel(x + 7, b - 10, 18, 4, '#b4b4bc');
    poly([[x + 16 - O.hw0, b - O.y0], [x + 16 + O.hw0, b - O.y0], [x + 16 + O.hw1, b - O.y1], [x + 16 - O.hw1, b - O.y1]], grad(b - O.y1, b - O.y0, '#a4a4ae'));
    poly([[x + 16 - O.hw1, b - O.y1], [x + 16 + O.hw1, b - O.y1], [x + 16, b - O.top]], '#b8b8c2');
    for (const [y, n, c] of O.badges) {
      const pts = [];
      for (let i = 0; i < n; i++) { const t = i / n * Math.PI * 2; pts.push([x + 16 + Math.sin(t) * 2.6, b - y + Math.cos(t) * 2.6]); }
      poly(pts, k[c]);
      disc(x + 16, b - y - 0.6, 1, '#f6f2e4');
    }
  } },
  { id: 'winnerspodium', name: "Winner's podium", w: 2, h: 1, price: 550, draw: facing(2, (x, b, vw) => {
    floorShadow(x, b, vw);
    for (const [x0, x1, h, n] of PODIUM) {
      panel(x + x0, b - h + 2.5, x1 - x0, h - 2.5, k.p); panel(x + x0, b - h, x1 - x0, 2.5, k.c);
      const s = digitScale(h), bx = (x0 + x1) / 2 - 3.5 * s, by = (h - 2.5) / 2 - 5.5 * s;
      for (const [dx, dy, w, hh] of DIGITS[n]) R(x + bx + dx * s, b - by - (dy + hh) * s, w * s, hh * s, k.c);
    }
    cyl(x + 27.6, b - 32, 8.8, 2, GOLD); R(x + 31, b - 36, 2, 4, GOLD);
    poly([[x + 31, b - 36], [x + 28, b - 38], [x + 27, b - 41.5], [x + 26.8, b - 44], [x + 37.2, b - 44], [x + 37, b - 41.5], [x + 36, b - 38], [x + 33, b - 36]], grad(b - 44, b - 36, GOLD));
    const g = ctx(); g.strokeStyle = sh(GOLD, -1); g.lineWidth = 1.2;
    for (const sx of [-1, 1]) { g.beginPath(); g.arc(x + 32 + sx * 5, b - 41, 2, sx > 0 ? -Math.PI / 2 : Math.PI / 2, sx > 0 ? Math.PI / 2 : Math.PI * 1.5); g.stroke(); }
  }) },
]);

/* ---------- the lights ---------- */
add('Lights', [
  { id: 'solarlights', name: 'Solar path lights', w: 1, h: 1, price: 180, glow: ['g', 'gl'], draw(x, b) {
    floorShadow(x + 1, b, 30);
    for (const sx of [5.5, 16, 26.5]) {
      cyl(x + sx - 0.8, b - 10, 1.6, 10, k.m);
      R(x + sx - 2.5, b - 10.7, 5, 1.2, sh(k.m, -1));
      oval(x + sx, b - 13.5, 3, 3.5, k.g); oval(x + sx - 1, b - 14.5, 1, 1.4, k.gl);
      panel(x + sx - 3.6, b - 19, 7.2, 2.4, k.m); R(x + sx - 2.5, b - 19.4, 5, 0.6, '#2a3a5a');
    }
  } },
  { id: 'gardentorch', name: 'Garden torch', w: 1, h: 1, price: 240, glow: FLAMES, draw(x, b) {
    const ir = iron(), g = ctx();
    floorShadow(x + 8, b, 16);
    cyl(x + 14.8, b - 52, 2.4, 52, ir);
    for (const y of [30, 48]) R(x + 13.4, b - y - 1, 5.2, 2, sh(ir, 1));
    g.strokeStyle = ir; g.lineWidth = 1.2;
    for (const sx of [-1, 1]) { g.beginPath(); g.arc(x + 16 + sx * 3.2, b - 38, 2.5, 0, Math.PI * 2 * 0.75); g.stroke(); }
    poly([[x + 14, b - 50], [x + 18, b - 50], [x + 21, b - 54], [x + 22, b - 58], [x + 10, b - 58], [x + 11, b - 54]], ir);
    R(x + 10.4, b - 55.8, 11.2, 1.6, k.a);
    tri(x + 15.5, b - 76, 20, FLAMES[0], 0.27); tri(x + 15.5, b - 72, 15, FLAMES[1], 0.26); tri(x + 15.5, b - 67, 9, FLAMES[2], 0.26);
  } },
  { id: 'hooklantern', name: 'Hanging lantern post', w: 1, h: 1, price: 450, glow: ['g', 'gl'], draw(x, b) {
    const ir = iron(), g = ctx();
    floorShadow(x + 4, b, 24);
    panel(x + 6, b - 4, 7, 4, ir); cyl(x + 8.1, b - 74, 2.8, 70, ir);
    curve([[9.5, 74], [9.5, 80], [12, 85], [17, 87], [22, 85], [24, 81], [24, 77]].map(([px, py]) => [x + px, b - py]), ir, 2.6);
    g.strokeStyle = ir; g.lineWidth = 1; g.beginPath(); g.arc(x + 24, b - 75.5, 1.4, 0, Math.PI * 2); g.stroke();
    poly([[x + 19.4, b - 66], [x + 28.6, b - 66], [x + 24, b - 72]], ir);
    R(x + 20, b - 66, 8, 12, k.g); R(x + 21.5, b - 64.5, 2, 9, k.gl);
    for (const px of [19.1, 27.7]) R(x + px, b - 66.2, 1.2, 12.4, ir);
    R(x + 19, b - 54, 10, 2, ir); disc(x + 24, b - 51, 1.4, ir);
  } },
  { id: 'lanturnbollard', name: 'Lanturn bollard', w: 1, h: 1, price: 420, glow: [LANTURN.lure, LANTURN.lit], draw(x, b) {
    floorShadow(x + 3, b, 26);
    cyl(x + 5.5, b - 6, 21, 6, k.m); R(x + 6, b - 7, 20, 1, sh(k.m, 1));
    poly([[x + 12, b - 19], [x + 20, b - 19], [x + 16, b - 25.5]], sh(LANTURN.body, -1));
    for (const sx of [-1, 1]) { const g = ctx(); g.save(); g.translate(x + 16 + sx * 10, b - 14); g.rotate(sx * 0.6); ovalShade(0, 0, 2, 4, LANTURN.body); g.restore(); }
    ovalShade(x + 16, b - 15, 10, 9, LANTURN.body);
    ovalShade(x + 16, b - 12, 8, 5, LANTURN.belly);
    for (const sx of [-1, 1]) { oval(x + 16 + sx * 3.5, b - 17, 1.8, 2, CHINCHOU.eye); disc(x + 16 + sx * 3.3, b - 17, 0.8, EYE); }
    curve([[16, 23], [16, 30], [18, 36], [20, 38]].map(([px, py]) => [x + px, b - py]), LANTURN.body, 1.8);
    disc(x + 20, b - 40.5, 4.2, LANTURN.lure); disc(x + 18.8, b - 41.8, 1.6, LANTURN.lit);
  } },
  { id: 'fairytree', name: 'Fairy-light tree', w: 1, h: 1, price: 520, glow: ['g', 'gl'], draw(x, b) {
    floorShadow(x + 4, b, 24);
    cyl(x + 14.6, b - 36, 2.8, 26, k.w);
    poly([[x + 9, b], [x + 23, b], [x + 25, b - 9], [x + 7, b - 9]], grad(b - 10, b, k.pot)); R(x + 6.4, b - 10, 19.2, 1.4, sh(k.pot, 1));
    [...CROWN].map((c, i) => [...c, i]).sort((a, c) => a[2] - c[2]).forEach(([cx, cy, , r, i]) => foliage(x + cx, b - cy, r, i % 2 ? k.leaf : sh(k.leaf, -1), i + 3));
    BULBS.forEach(([bx, by, bz, lit], j) => { if (bz >= CROWN[j >> 2][2]) disc(x + bx, b - by, 1.3, lit ? k.gl : k.g); });
  } },
  { id: 'yardspotlight', name: 'Garden spotlight', w: 1, h: 1, price: 260, glow: ['g', 'gl'], draw(x, b) {
    const dk = sh(k.m, -1);
    floorShadow(x + 8, b, 16);
    R(x + 15, b - 7, 2, 7, dk); R(x + 13, b - 8, 6, 1.2, dk);
    R(x + 9.8, b - 9.2, 12.4, 1.2, dk);
    for (const px of [9.8, 21.2]) R(x + px, b - 15, 1, 7, dk);
    oval(x + 16, b - 11.5, 5, 3.8, sh(k.m, -1)); cyl(x + 11, b - 18, 10, 6.5, k.m);
    oval(x + 16, b - 18.5, 5.2, 4, dk); oval(x + 16, b - 18.7, 4.3, 3.3, k.g); oval(x + 14.8, b - 19.5, 1.6, 1, k.gl);
  } },
  { id: 'litsignpost', name: 'Lit signpost', w: 1, h: 1, price: 380, glow: ['g', 'gl'], draw(x, b) {
    const ir = iron(), boards = [[[[1, 59], [5, 62], [21, 62], [21, 56], [5, 56]], 'c'], [[[11, 46], [11, 52], [27, 52], [31, 49], [27, 46]], 'a'], [[[2, 39], [6, 42], [20, 42], [20, 36], [6, 36]], 'p']];
    floorShadow(x + 8, b, 16);
    wood(x + 14, b - 70, 4, 70, k.w, 'y'); R(x + 13, b - 72, 6, 2, sh(k.w, -1));
    boards.forEach(([pts, c], i) => {
      poly(pts.map(([px, py]) => [x + px, b - py]), grad(b - pts[1][1], b - pts[3][1], k[c]));
      const y = pts[1][1] - 3, x0 = Math.min(...pts.map(q => q[0])) + 5, x1 = Math.max(...pts.map(q => q[0])) - 5;
      R(x + x0, b - y - (i === 1 ? 0.6 : 1) - 0.4, x1 - x0, 0.8, INK); R(x + x0, b - y + 1.2 - 0.4, (x1 - x0) * 0.6, 0.8, INK);
    });
    R(x + 13.2, b - 73, 5.6, 1, ir);
    R(x + 13.7, b - 80, 4.6, 7, k.g); R(x + 14.5, b - 79, 1, 5, k.gl);
    for (const px of [13.1, 18.1]) R(x + px, b - 80, 0.8, 7, ir);
    poly([[x + 12.9, b - 80], [x + 19.1, b - 80], [x + 16, b - 84]], ir);
  } },
  { id: 'basesign', name: 'BASE neon sign', w: 2, h: 1, price: 700, glow: ['c', 'a', 'gl'], draw: facing(2, (x, b, vw) => {
    const ir = sh(k.m, -1), g = ctx();
    floorShadow(x, b, vw);
    for (const px of [5, 56]) R(x + px, b - 40, 3, 40, ir);
    panel(x + 3, b - 72, 58, 34, ir); R(x + 5, b - 70, 54, 30, INK);
    const neon = (pts, c) => { curve(pts, c, 2); g.save(); g.globalAlpha = 0.8; curve(pts, k.gl, 0.7); g.restore(); };
    NEON.letters.forEach((strokes, i) => strokes.forEach(st => neon(st.map(([px, py]) => [x + NEON.at[i] + px, b - NEON.y - py]), k.c)));
    const [bx0, by0, bx1, by1] = NEON.border;
    neon([[bx0, by0], [bx0, by1], [bx1, by1], [bx1, by0], [bx0, by0]].map(([px, py]) => [x + px, b - py]), k.a);
  }) },
  { id: 'fireflyjar', name: 'Firefly jar', w: 1, h: 1, price: 320, glow: FIREFLY, draw(x, b) {
    const g = ctx();
    floorShadow(x + 3, b, 26);
    wood(x + 5, b - 66, 4, 66, k.w, 'y'); R(x + 4, b - 68, 6, 2, sh(k.w, -1));
    wood(x + 6, b - 65, 20, 3, k.w); line(x + 8.5, b - 52, x + 17, b - 62.5, k.w, 2);
    line(x + 23, b - 62, x + 23, b - 56, INK, 0.6);
    g.strokeStyle = INK; g.lineWidth = 0.7; g.beginPath(); g.arc(x + 23, b - 53, 4.2, Math.PI, 0); g.stroke();
    glass(x + 17.5, b - 49, 11, 14.5, '#d8ecd0'); oval(x + 23, b - 34.8, 4.8, 1, '#c0d8b8');
    cyl(x + 18, b - 53, 10, 3, k.m);
    [[20, 38], [25, 41], [22, 45], [26, 37], [21, 47.5], [24, 44]].forEach(([px, py], i) => disc(x + px, b - py, 1.1, FIREFLY[i % 2]));
  } },
  { id: 'chinchoulamp', name: 'Chinchou orb lamp', w: 1, h: 1, price: 480, glow: [CHINCHOU.orb, CHINCHOU.lit], draw(x, b) {
    floorShadow(x + 6, b, 20);
    poly([[x + 8, b], [x + 24, b], [x + 24, b - 1.5], [x + 21, b - 3.5], [x + 19, b - 5], [x + 13, b - 5], [x + 11, b - 3.5], [x + 8, b - 1.5]], k.m);
    cyl(x + 14.9, b - 53, 2.2, 48, k.m); R(x + 13.8, b - 51.3, 4.4, 1.6, k.a);
    for (const sx of [-1, 1]) {
      curve([[3, 63], [5, 66.5], [8.5, 70], [11, 75]].map(([px, py]) => [x + 16 + sx * px, b - py]), CHINCHOU.body, 1.6);
      disc(x + 16 + sx * 11, b - 78.5, 4.2, CHINCHOU.orb); disc(x + 16 + sx * 11 - 1.2, b - 79.8, 1.5, CHINCHOU.lit);
    }
    ovalShade(x + 16, b - 58, 7, 6.5, CHINCHOU.body);
    for (const sx of [-1, 1]) { oval(x + 16 + sx * 2.4, b - 59, 1.6, 2, CHINCHOU.eye); disc(x + 16 + sx * 2.3, b - 59, 0.8, EYE); }
  } },
  { id: 'lightarch', name: 'Light-up arch', w: 2, h: 1, price: 750, glow: ['g', 'gl'], draw: facing(2, (x, b, vw) => {
    const ir = sh(k.m, -1), g = ctx();
    floorShadow(x, b, vw);
    for (const px of ARCH.posts) { cyl(x + px - 1.6, b - ARCH.cy, 3.2, ARCH.cy, ir); R(x + px - 3.2, b - 2, 6.4, 2, ir); }
    g.strokeStyle = ir; g.lineWidth = 3.2; g.beginPath(); g.arc(x + 32, b - ARCH.cy, ARCH.R, Math.PI, Math.PI * 2); g.stroke();
    for (const [px, py] of ARCH.bulbs) { disc(x + px, b - py, 1.8, k.g); disc(x + px - 0.5, b - py - 0.5, 0.7, k.gl); }
  }) },
  { id: 'uplitplanter', name: 'Glowing planter', w: 1, h: 1, price: 360, glow: ['g', 'gl'], draw(x, b) {
    floorShadow(x + 3, b, 26);
    panel(x + 5, b - 20, 22, 20, k.g); R(x + 7, b - 18, 2, 16, k.gl); R(x + 11, b - 18, 1, 16, k.gl);
    panel(x + 4.5, b - 22, 23, 2, k.p);
    foliage(x + 16, b - 31.5, 11, k.leaf, 7);
  } },
  { id: 'housenumber', name: 'House number sign', w: 1, h: 1, price: 240, glow: ['g'], draw(x, b) {
    floorShadow(x + 8, b, 16);
    wood(x + 14.5, b - 36, 3, 36, k.w, 'y');
    R(x + 22, b - 60.5, 3, 6, sh(k.c, -1));
    panel(x + 5, b - 52, 22, 18, sh(k.m, -1)); R(x + 7, b - 50, 18, 14, k.g);
    for (const [dx, dy, w, h] of DIGITS[1]) R(x + 12.5 + dx, b - 37.5 - dy - h, w, h, INK);
    poly([[x + 3, b - 52], [x + 16, b - 62], [x + 29, b - 52]], grad(b - 62, b - 52, k.c));
  } },
  { id: 'basketlamppost', name: 'Flower basket lamp post', w: 1, h: 1, price: 560, glow: ['g', 'gl'], draw(x, b) {
    const ir = iron(), g = ctx();
    floorShadow(x + 4, b, 24);
    poly([[x + 10, b], [x + 22, b], [x + 22, b - 2], [x + 20, b - 5], [x + 18.5, b - 8], [x + 13.5, b - 8], [x + 12, b - 5], [x + 10, b - 2]], ir);
    cyl(x + 14.5, b - 74, 3, 66, ir);
    for (const y of [30, 60]) R(x + 13.6, b - y - 0.8, 4.8, 1.6, sh(ir, 1));
    R(x + 3, b - 63.8, 26, 1.6, ir);
    g.strokeStyle = ir; g.lineWidth = 1;
    for (const sx of [-1, 1]) { g.beginPath(); g.arc(x + 16 + sx * 12.6, b - 64.4, 1.6, 0, Math.PI * 2 * 0.75); g.stroke(); }
    for (const bx of [5, 27]) {
      line(x + bx, b - 62, x + bx - 3.8, b - 55, INK, 0.5); line(x + bx, b - 62, x + bx + 3.8, b - 55, INK, 0.5);
      poly([[x + bx - 4.6, b - 55], [x + bx + 4.6, b - 55], [x + bx + 4, b - 52], [x + bx + 2.4, b - 50], [x + bx - 2.4, b - 50], [x + bx - 4, b - 52]], WICKER);
      for (let i = 0; i < 3; i++) R(x + bx - 4, b - 53.8 + i * 1.4, 8, 0.4, sh(WICKER, -1));
      R(x + bx - 4.9, b - 55.5, 9.8, 1, '#8a5a30');
      [[-2, k.c], [1.5, k.a], [0.5, k.p], [2.5, k.c]].forEach(([dx, c], i) => disc(x + bx + dx, b - 56.2 - (i % 2) * 0.6, 1.7, c));
      for (const [dx, dy] of [[-3.5, 52], [3.6, 51], [-2.2, 48]]) oval(x + bx + dx, b - dy, 1.6, 2.2, k.leaf);
    }
    R(x + 13, b - 76, 6, 2, ir);
    oval(x + 16, b - 81.5, 6, 6.5, k.g); oval(x + 14, b - 83.5, 1.8, 2.4, k.gl);
    R(x + 13, b - 89, 6, 2, ir); disc(x + 16, b - 90, 1.2, ir);
  } },
  { id: 'morelullglow', name: 'Morelull mushrooms', w: 1, h: 1, price: 420, glow: [MORELULL.cap, MORELULL.spot], draw(x, b) {
    const g = ctx();
    floorShadow(x + 1, b, 30);
    g.fillStyle = k.leaf; g.beginPath(); g.ellipse(x + 16, b, 14, 4, 0, Math.PI, 0); g.fill();
    [...SHROOMS].map((s, i) => [...s, i]).sort((a, c) => a[1] - c[1]).forEach(([sx, , h, r, cr, ch, i]) => {
      cyl(x + sx - r, b - 1 - h, r * 2, h, MORELULL.stem);
      g.fillStyle = MORELULL.cap; g.beginPath(); g.ellipse(x + sx, b - h, cr, ch, 0, Math.PI, 0); g.lineTo(x + sx + cr * 0.95, b - h + 0.4); g.lineTo(x + sx - cr * 0.95, b - h + 0.4); g.fill();
      for (const [a, f] of SPOTS.slice(0, i ? 5 : 7)) {
        if (Math.cos(a) < 0.1) continue;
        const t = f * Math.PI / 2;
        disc(x + sx + Math.sin(a) * Math.cos(t) * cr, b - h - Math.sin(t) * ch, cr * 0.16, MORELULL.spot);
      }
      if (!i) for (const s of [-1, 1]) disc(x + sx + s * 1.2, b - 13, 0.7, EYE);
    });
  } },
]);
