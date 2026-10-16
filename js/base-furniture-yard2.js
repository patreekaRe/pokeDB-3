/* base-furniture-yard2.js  -  the backyard's fences and playground (2026-10-16, the user's ask: a catalogue as big as
   Animal Crossing's, every piece "3D detailed CLEAN" and optimised): two tabs of Smeargle's garden catalogue
   (js/garden-shop.js's `yard`), Fences and Playground. Outdoor and themed like js/base-furniture-yard.js, painted from
   the front, and each modelled from parts in js/base-models-v.js, which follows these paintings pixel for pixel. A fence
   is a 1x1 length spanning its whole tile, so a row of them lines up edge to edge; side on it shows its end. A piece
   wider than deep (or deeper than wide) is painted again from the side; the rest look the same from every side. */

import { k, sh, R, panel, wood, cushion, disc, oval, ovalShade, cyl, leaf, foliage, speckle, floorShadow, ctx, clipped } from './base-paint.js';

export const YARD_KINDS_2 = [];
const add = (yard, list) => list.forEach(f => YARD_KINDS_2.push({ group: 'Yard', outdoor: true, yard, ...f }));

const STONES = ['#a8a49a', '#8e8a82', '#bab4a8', '#9a9488'], STONE = '#b0aca2', MORTAR = '#6e6a62';
const BAMBOO = '#c4c070', INK = '#2c2c34', CHAIN = '#b8bcc6', TYRE = '#34343c', CREAM = '#f8eac0', FLAME = '#f89038',
  FLAME2 = '#f8d038', SKY = '#a8d8f0', PATH = '#c8c4bc';
const TAU = Math.PI * 2;
const line = (x0, y0, x1, y1, c, w = 2) => { const g = ctx(); g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
const curve = (pts, c, w = 2) => { const g = ctx(); g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); };
const poly = (pts, c) => { const g = ctx(); g.fillStyle = c; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill(); };
const ring = (cx, cy, r, c, w = 1) => { const g = ctx(); g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.stroke(); };
const flower = (x, y, c, r = 2.4) => { for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; disc(x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8, r * 0.7, c); } disc(x, y, r * 0.5, '#f8d038'); };
/** A Poké Ball's top in the theme (white themes take their wood), as js/base-models-kit.js's ballTop(). */
const ballTop = () => (k.c === '#f4f4f0' ? k.w : k.c);
/** A fence seen side on: its end, a post or a slab `t` thick, `h` tall. */
const end = (x, b, vw, h, c, t = 4) => { floorShadow(x + vw / 2 - 5, b, 10); wood(x + vw / 2 - t / 2, b - h, t, h, c, 'y'); };

/* ---------- Fences: each a tile's length across its middle ---------- */

add('Fences', [
  { id: 'cottagepicket', name: 'Cottage picket', w: 1, h: 1, price: 140, draw(x, b, vw, dir) {
    if (dir % 2) return end(x, b, vw, 24, k.p);
    floorShadow(x, b, vw);
    for (const y of [b - 9, b - 19]) wood(x, y, vw, 3, sh(k.p, -1));
    // five round-topped pickets dipping to the middle, so a row of them scallops
    for (let i = 0; i < 5; i++) {
      const cx = x + 3.2 + i * 6.4, h = 26 - 5 * Math.sin(Math.PI * (i + 0.5) / 5);
      wood(cx - 2, b - h + 2, 4, h - 2, k.p, 'y'); disc(cx, b - h + 2, 2, k.p);
    }
  } },
  { id: 'ranchrail', name: 'Split-rail fence', w: 1, h: 1, price: 160, draw(x, b, vw, dir) {
    if (dir % 2) { end(x, b, vw, 30, k.w, 6); for (const y of [b - 26, b - 17, b - 8]) disc(x + vw / 2, y, 2.4, sh(k.w, 1)); return; }
    floorShadow(x, b, vw);
    for (const y of [b - 27, b - 18, b - 9]) { wood(x, y, vw, 4, sh(k.w, 1)); R(x, y + 3, vw, 1, sh(k.w, -1)); }
    wood(x + 13, b - 30, 6, 30, k.w, 'y'); R(x + 13, b - 31, 6, 1, sh(k.w, 1));
  } },
  { id: 'ironrailing', name: 'Iron railing', w: 1, h: 1, price: 260, draw(x, b, vw, dir) {
    const iron = sh(k.m, -1);
    if (dir % 2) { floorShadow(x + 10, b, 12); R(x + 15, b - 28, 2, 28, iron); poly([[x + 14.2, b - 28], [x + 16, b - 32], [x + 17.8, b - 28]], k.a); return; }
    floorShadow(x, b, vw);
    R(x, b - 5, vw, 2, iron); R(x, b - 26, vw, 2, iron); R(x, b - 21, vw, 1.5, iron);
    for (let i = 1; i < 5; i++) ring(x + i * 6.4, b - 23.4, 1.6, iron, 0.8);
    for (let i = 0; i < 5; i++) {
      const cx = x + 3.2 + i * 6.4;
      cyl(cx - 1, b - 28, 2, 28, iron);
      disc(cx, b - 25, 1.3, k.a);
      poly([[cx - 1.6, b - 28], [cx, b - 32], [cx + 1.6, b - 28]], k.a);
    }
  } },
  { id: 'bambooscreen', name: 'Bamboo screen', w: 1, h: 1, price: 200, draw(x, b, vw, dir) {
    if (dir % 2) { end(x, b, vw, 36, BAMBOO, 4); for (const y of [b - 28, b - 10]) R(x + vw / 2 - 4, y, 8, 3, k.w); return; }
    floorShadow(x, b, vw);
    for (let i = 0; i < 8; i++) {
      const px = x + i * 4, top = b - (i % 2 ? 34 : 36), c = i % 2 ? sh(BAMBOO, -1) : BAMBOO;
      cyl(px, top, 4, b - top, c);
      oval(px + 2, top + 0.6, 1.6, 0.7, sh(BAMBOO, -2));
      for (let y = top + 7 + (i % 3) * 2; y < b - 2; y += 9) R(px, y, 4, 1, sh(c, -2));
    }
    for (const y of [b - 28, b - 10]) {
      wood(x, y, vw, 3, k.w);
      for (let i = 0; i < 4; i++) R(x + 3 + i * 8, y - 1, 2, 5, k.c);
    }
  } },
  { id: 'drystonewall', name: 'Dry stone wall', w: 1, h: 1, price: 300, draw(x, b, vw, dir) {
    if (dir % 2) {
      floorShadow(x + 6, b, 20);
      panel(x + 11, b - 24, 10, 24, MORTAR);
      for (let r = 0; r < 3; r++) panel(x + 11.5, b - 8 * (r + 1) + 0.5, 9, 7, STONES[(r + 1) % 4]);
      R(x + 11, b - 28, 10, 4, k.p);
      return;
    }
    floorShadow(x, b, vw);
    panel(x, b - 24, vw, 24, MORTAR);
    // three courses of stones laid broken-jointed, then a row of flat coping stones, moss in the cracks
    [[8, 8, 9, 7], [5, 9, 8, 10], [9, 7, 8, 8]].forEach((row, r) => {
      let sx = x;
      row.forEach((w, i) => { panel(sx + 0.5, b - 8 * (r + 1) + 0.5, w - 1, 7, STONES[(i + r * 2) % 4]); sx += w; });
    });
    for (let i = 0; i < 4; i++) panel(x + i * 8 + 0.5, b - 28, 7, 4, k.p);
    for (const [px, py] of [[6, -1], [21, -9], [13, -17], [28, -24]]) leaf(x + px, b + py, 2.2, 1.2, k.leaf);
  } },
  { id: 'copingwall', name: 'Brick garden wall', w: 1, h: 1, price: 320, draw(x, b, vw, dir) {
    if (dir % 2) {
      floorShadow(x + 6, b, 20);
      panel(x + 12, b - 22, 8, 22, sh(k.p, -1));
      for (let r = 0; r < 5; r++) R(x + 11.5, b - 4.4 * (r + 1) + 0.4, 9, 3.6, r % 2 ? sh(k.w, -1) : k.w);
      panel(x + 10.5, b - 26, 11, 4, k.p);
      return;
    }
    floorShadow(x, b, vw);
    R(x, b - 22, vw, 22, sh(k.p, -1));
    // five courses of bricks in a stretcher bond (half bricks at the ends of every other course), a stone coping
    for (let r = 0; r < 5; r++) {
      const y = b - 4.4 * (r + 1) + 0.4, joints = r % 2 ? [0, 4, 12, 20, 28, 32] : [0, 8, 16, 24, 32];
      for (let i = 0; i < joints.length - 1; i++) R(x + joints[i] + 0.3, y, joints[i + 1] - joints[i] - 0.6, 3.6, (i + r) % 3 ? k.w : sh(k.w, -1));
    }
    panel(x, b - 26, vw, 4, k.p);
  } },
  { id: 'archgate', name: 'Arched garden gate', w: 1, h: 1, price: 380, draw(x, b, vw, dir) {
    if (dir % 2) { end(x, b, vw, 44, k.w, 4); return; }
    floorShadow(x, b, vw);
    for (const px of [x, x + 28]) wood(px, b - 40, 4, 40, k.w, 'y');
    const g = ctx();
    g.strokeStyle = sh(k.w, -1); g.lineWidth = 4; g.beginPath(); g.arc(x + 16, b - 40, 14, Math.PI, 0); g.stroke();
    // the gate: four boards rising to an arch, two rails and a brace, black straps and a ring latch
    for (let i = 0; i < 4; i++) {
      const f = (i + 0.5) / 4, top = b - 26 - 3 * Math.sin(Math.PI * f);
      wood(x + 4.2 + i * 6, top, 5.6, b - 2 - top, sh(k.w, 1), 'y');
    }
    for (const y of [b - 9, b - 23]) R(x + 4, y, 24, 2.5, k.w);
    line(x + 6, b - 9, x + 26, b - 21, k.w, 2);
    for (const y of [b - 9, b - 23]) R(x + 4, y + 0.5, 8, 1.5, INK);
    ring(x + 24, b - 15, 1.6, INK, 0.9);
    // a climbing rose over the arch
    for (const [a, c] of [[0.5, k.c], [1.3, k.a], [2.2, k.c], [2.8, k.a]]) {
      const lx = x + 16 - Math.cos(a) * 14, ly = b - 40 - Math.sin(a) * 14;
      leaf(lx - 2, ly + 1, 2, 1.3, k.leaf, -0.4); leaf(lx + 2, ly - 1, 2, 1.3, k.leaf, 0.4); flower(lx, ly, c, 1.8);
    }
  } },
  { id: 'vinelattice', name: 'Vine lattice', w: 1, h: 1, price: 260, draw(x, b, vw, dir) {
    if (dir % 2) { end(x, b, vw, 46, k.w, 3); for (let i = 0; i < 4; i++) leaf(x + vw / 2 + (i % 2 ? 2 : -2), b - 10 - i * 10, 2, 1.3, k.leaf); return; }
    floorShadow(x, b, vw);
    // the trellis: diagonal slats crossing inside a frame
    clipped(x + 3, b - 43, 26, 37, () => {
      for (let c = -40; c < 40; c += 6.5) { line(x + 3 + c, b - 6, x + 40 + c, b - 43, k.p, 1.4); }
      for (let c = -40; c < 40; c += 6.5) { line(x + 3 + c, b - 43, x + 40 + c, b - 6, sh(k.p, -1), 1.4); }
    });
    for (const px of [x, x + 29]) wood(px, b - 46, 3, 46, k.w, 'y');
    wood(x, b - 46, vw, 3, k.w); wood(x, b - 6, vw, 3, k.w);
    // a vine climbing it, leaves and flowers along it
    const pts = [[x + 6, b - 3], [x + 10, b - 14], [x + 20, b - 20], [x + 22, b - 30], [x + 13, b - 38], [x + 24, b - 44]];
    curve(pts, sh(k.leaf, -1), 1.2);
    pts.forEach(([px, py], i) => { leaf(px - 2.5, py + 1, 2.2, 1.3, k.leaf, -0.4); leaf(px + 2.5, py - 1, 2.2, 1.3, sh(k.leaf, 1), 0.4); });
    for (const [px, py, c] of [[11, -16, k.c], [23, -28, k.a], [14, -38, k.c]]) flower(x + px, b + py, c, 2);
  } },
  { id: 'willowhurdle', name: 'Willow hurdle', w: 1, h: 1, price: 220, draw(x, b, vw, dir) {
    if (dir % 2) { end(x, b, vw, 30, sh(k.w, -1), 6); return; }
    floorShadow(x, b, vw);
    const stake = sh(k.w, -1);
    // stakes, then the withies woven over and under them, the stakes drawn again where they're in front
    const stakes = [4, 12, 20, 28];
    for (const cx of stakes) { cyl(x + cx - 1.5, b - 29, 3, 29, stake); poly([[x + cx - 1.5, b - 29], [x + cx, b - 32], [x + cx + 1.5, b - 29]], stake); }
    for (let r = 0; r < 7; r++) {
      const y = b - 6.6 - r * 3.4;
      cushion(x, y - 1.6, vw, 3.2, r % 2 ? sh(k.w, 1) : k.w, 1.4);
      stakes.forEach((cx, i) => { if ((i + r) % 2 === 0) cyl(x + cx - 1.5, y - 1.7, 3, 3.4, stake); });
    }
  } },
  { id: 'logpalisade', name: 'Log palisade', w: 1, h: 1, price: 300, draw(x, b, vw, dir) {
    if (dir % 2) { end(x, b, vw, 40, k.w, 8); poly([[x + 12, b - 40], [x + 16, b - 45], [x + 20, b - 40]], sh(k.w, 1)); return; }
    floorShadow(x, b, vw);
    for (let i = 0; i < 4; i++) {
      const px = x + i * 8, top = b - (i % 2 ? 37 : 40);
      cyl(px, top, 8, b - top, i % 2 ? sh(k.w, -1) : k.w);
      for (let y = top + 4; y < b - 3; y += 6) R(px + 2 + (y % 3), y, 1, 3, sh(k.w, -2));
      poly([[px, top], [px + 4, top - 5], [px + 8, top]], sh(k.w, 1));
    }
    for (const y of [b - 31, b - 11]) panel(x, y, vw, 2.5, k.c);
  } },
  { id: 'ballpostfence', name: 'Poké Ball post fence', w: 1, h: 1, price: 240, draw(x, b, vw, dir) {
    if (dir % 2) { end(x, b, vw, 26, k.p, 6); } else {
      floorShadow(x, b, vw);
      for (const y of [b - 10, b - 20]) wood(x, y, vw, 3, sh(k.p, -1));
      for (const px of [x + 5, x + 25]) wood(px, b - 22, 4, 22, k.p, 'y');
      panel(x + 13, b - 26, 6, 26, k.p); R(x + 12.25, b - 27, 7.5, 1, sh(k.p, -1));
    }
    const cx = x + vw / 2, cy = b - 31.5, r = 4.5, g = ctx();
    g.fillStyle = '#f6f6f2'; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI); g.fill();
    g.fillStyle = ballTop(); g.beginPath(); g.arc(cx, cy, r, Math.PI, 0); g.fill();
    R(cx - r, cy - 0.5, r * 2, 1, INK); disc(cx, cy, 1.5, INK); disc(cx, cy, 0.9, '#f6f6f2');
  } },
  { id: 'ropebarrier', name: 'Rope barrier', w: 1, h: 1, price: 180, draw(x, b, vw, dir) {
    const sag = (dx) => b - 24 + 6 * Math.sin(Math.PI * Math.abs(dx) / 32) ** 2;
    if (dir % 2) { floorShadow(x + 8, b, 16); cyl(x + 14, b - 27, 4, 27, k.w); disc(x + 16, b - 28, 2.5, k.m); disc(x + 16, b - 24, 1.8, k.c); return; }
    floorShadow(x, b, vw);
    ovalShade(x + 16, b - 1.5, 6, 1.5, k.m);
    cyl(x + 14, b - 27, 4, 26, k.w);
    R(x + 13.5, b - 22, 5, 1.5, k.a);
    disc(x + 16, b - 28.5, 2.5, k.m);
    const pts = []; for (let i = 0; i <= 16; i++) pts.push([x + i * 2, sag(i * 2 - 16)]);
    curve(pts, sh(k.c, -1), 2.6); curve(pts.map(([px, py]) => [px, py - 0.5]), k.c, 1.2);
  } },
  { id: 'wirefence', name: 'Farm wire fence', w: 1, h: 1, price: 160, draw(x, b, vw, dir) {
    const wire = sh(k.m, 2);
    if (dir % 2) { floorShadow(x + 10, b, 12); cyl(x + 14, b - 30, 4, 30, k.w); for (const y of [b - 6, b - 12, b - 19, b - 26]) disc(x + 18.5, y, 0.8, wire); return; }
    floorShadow(x, b, vw);
    cyl(x + 14, b - 30, 4, 30, k.w); poly([[x + 14, b - 30], [x + 16, b - 32], [x + 18, b - 30]], sh(k.w, -1));
    for (const px of [4, 12, 20, 28]) line(x + px, b - 26, x + px, b - 6, wire, 0.7);
    for (const y of [b - 6, b - 12, b - 19, b - 26]) line(x, y, x + vw, y, wire, 0.9);
  } },
  { id: 'cornerpost', name: 'Capped corner post', w: 1, h: 1, price: 150, draw(x, b) {
    floorShadow(x + 6, b, 20);
    panel(x + 9, b - 4, 14, 4, sh(k.p, -1));
    panel(x + 11, b - 32, 10, 28, k.p);
    R(x + 13, b - 28, 6, 20, sh(k.p, -1)); R(x + 13, b - 28, 6, 1, sh(k.p, -2));
    panel(x + 10, b - 35, 12, 3, k.a);
    panel(x + 9.5, b - 36.5, 13, 1.5, k.p);
    R(x + 15, b - 38.5, 2, 2, k.p);
    ovalShade(x + 16, b - 43, 5, 5, k.c);
  } },
  { id: 'lanternpier', name: 'Lantern pier', w: 1, h: 1, price: 420, glow: ['g'], draw(x, b) {
    floorShadow(x + 4, b, 24);
    panel(x + 6, b - 6, 20, 6, sh(STONE, -1));
    // the pier: four courses of dressed stone, a cap stone, the lantern on top
    for (let i = 0; i < 4; i++) panel(x + 8, b - 6 - 10.5 * (i + 1) + 0.3, 16, 10.2, i % 2 ? sh(STONE, -1) : STONE);
    panel(x + 6, b - 52, 20, 4, sh(STONE, 1));
    panel(x + 10, b - 55, 12, 3, k.m);
    R(x + 11, b - 66, 10, 11, k.g); R(x + 12, b - 65, 3, 9, sh(k.g, 2));
    for (const px of [x + 10, x + 20]) R(px, b - 66, 2, 11, k.m);
    R(x + 10, b - 61, 12, 1, k.m);
    poly([[x + 8, b - 66], [x + 16, b - 73], [x + 24, b - 66]], k.m);
    disc(x + 16, b - 74, 1.5, k.m);
  } },
]);

/* ---------- Playground ---------- */

add('Playground', [
  { id: 'lidsandbox', name: 'Lidded sandbox', w: 1, h: 1, price: 360, draw(x, b) {
    floorShadow(x, b, 32);
    // the lid propped open at the back, its painted face to the front, a pale border round it
    panel(x + 3, b - 31, 26, 22, k.c); R(x + 5, b - 29, 22, 1, k.p); R(x + 5, b - 13, 22, 1, k.p); R(x + 5, b - 29, 1, 17, k.p); R(x + 26, b - 29, 1, 17, k.p);
    ovalShade(x + 12, b - 11, 7, 2.5, '#ecd6a2');
    // a bucket on the sand, a spade stuck in it
    const g = ctx();
    g.fillStyle = k.a; g.beginPath(); g.moveTo(x + 18, b - 17); g.lineTo(x + 26, b - 17); g.lineTo(x + 25, b - 9); g.lineTo(x + 19, b - 9); g.closePath(); g.fill();
    R(x + 18, b - 17.5, 8, 1, sh(k.a, 1));
    g.strokeStyle = sh(k.a, -1); g.lineWidth = 0.8; g.beginPath(); g.arc(x + 22, b - 17, 4, Math.PI, 0); g.stroke();
    line(x + 8, b - 20, x + 10, b - 11, k.p, 1.4); R(x + 6.5, b - 21.5, 3, 1.5, k.p);
    for (let i = 0; i < 2; i++) wood(x + 2, b - 10 + i * 5, 28, 5, k.w);
    for (const px of [x + 1, x + 28]) R(px, b - 11, 3, 11, sh(k.w, -1));
  } },
  { id: 'seesaw', name: 'Seesaw', w: 2, h: 1, price: 520, draw(x, b, vw, dir) {
    floorShadow(x, b, vw);
    if (dir % 2) {
      poly([[x + 8, b], [x + 14, b - 14], [x + 18, b - 14], [x + 24, b], [x + 21, b], [x + 16, b - 11], [x + 11, b]], k.m);
      R(x + 9, b - 18, 14, 4, k.w); cushion(x + 9, b - 22, 14, 4, k.c, 1.5);
      R(x + 15, b - 30, 2, 8, k.a); R(x + 9, b - 31, 14, 2, k.a);
      return;
    }
    // the stand, the plank on its pivot, a seat and a handle at each end, rubber stops under them
    poly([[x + 25, b], [x + 30, b - 14], [x + 34, b - 14], [x + 39, b], [x + 36, b], [x + 32, b - 10], [x + 28, b]], k.m);
    for (const px of [x + 10, x + 54]) disc(px, b - 3, 3, TYRE);
    wood(x + 2, b - 18, 60, 4, k.w);
    disc(x + 32, b - 15, 2.5, k.a); disc(x + 32, b - 15, 1, sh(k.a, -2));
    for (const px of [x + 4, x + 48]) cushion(px, b - 22, 12, 4, k.c, 1.5);
    for (const px of [x + 18, x + 44]) { R(px, b - 30, 2, 12, k.a); R(px - 1, b - 31, 4, 2, sh(k.a, -1)); }
  } },
  { id: 'slidetower', name: 'Slide tower', w: 2, h: 2, price: 1300, draw(x, b, vw) {
    floorShadow(x, b, vw);
    // the back panel seen through the tower, its posts, the ladder up the front, the platform and its rail
    R(x + 10, b - 42, 20, 10, sh(k.c, -1));
    for (const px of [x + 6, x + 30]) wood(px, b - 62, 4, 62, k.w, 'y');
    for (let i = 0; i < 4; i++) R(x + 10, b - 7 - i * 6, 20, 2, sh(k.w, 1));
    wood(x + 6, b - 31, 28, 3, k.w);
    R(x + 10, b - 42, 20, 2, k.c);
    poly([[x + 3, b - 62], [x + 20, b - 74], [x + 37, b - 62]], k.c);
    for (let i = 1; i < 4; i++) line(x + 3 + i * 4.25, b - 62 - i * 3, x + 37 - i * 4.25, b - 62 - i * 3, sh(k.c, -1), 0.6);
    // the slide down to the right, its leg
    cyl(x + 49, b - 14, 3, 14, k.w);
    const top = [], bot = [];
    for (let i = 0; i <= 12; i++) {
      const f = i / 12, px = x + 34 + f * 30, py = b - 4 - 25 * (1 - f) ** 1.6;
      top.push([px, py - 2]); bot.push([px, py + 2.2]);
    }
    poly([...top, ...bot.reverse()], k.a);
    curve(top, sh(k.a, 2), 1);
  } },
  { id: 'merrygoround', name: 'Merry-go-round', w: 2, h: 2, price: 1100, draw(x, b, vw) {
    floorShadow(x, b, vw);
    oval(x + 32, b - 2, 9, 2, sh(k.m, -1)); R(x + 23, b - 4, 18, 2, k.m);
    // the bars from the hub out to the rim, behind and in front
    for (const px of [8, 20, 44, 56]) { line(x + px, b - 9, x + px, b - 19, k.m, 2); line(x + px, b - 19.5, x + 32, b - 21.5, k.m, 2); }
    cyl(x + 30, b - 25, 4, 18, k.m); disc(x + 32, b - 25, 3, k.a);
    // the platform's edge: wedges in turn
    for (let i = 0; i < 6; i++) R(x + 4 + i * 56 / 6, b - 9, 56 / 6, 5, i % 2 ? k.a : k.c);
    R(x + 4, b - 9.5, 56, 1, sh(k.c, 1)); R(x + 4, b - 4.5, 56, 0.8, sh(k.m, -1));
  } },
  { id: 'junglegym', name: 'Jungle gym', w: 2, h: 2, price: 900, draw(x, b, vw) {
    floorShadow(x, b, vw);
    for (const y of [b - 16, b - 32, b - 48]) R(x + 5, y - 1.5, 54, 3, k.a);
    for (const px of [x + 5, x + 32, x + 59]) { cyl(px - 1.5, b - 49, 3, 49, k.c); for (const y of [b - 16, b - 32, b - 48]) disc(px, y, 2.2, sh(k.c, 1)); }
  } },
  { id: 'ponytarider', name: 'Ponyta spring rider', w: 1, h: 1, price: 480, draw(x, b) {
    floorShadow(x + 2, b, 28);
    ovalShade(x + 16, b - 1.5, 10, 2, k.m);
    // the coil spring, the Ponyta on it facing right: body, folded legs, neck and head, a flame mane and tail
    for (let i = 0; i < 5; i++) line(x + 12, b - 3 - i * 2.4, x + 20, b - 4.2 - i * 2.4, sh(k.m, 2), 1.4);
    for (const px of [x + 10, x + 14, x + 18, x + 22]) { R(px, b - 18, 2.4, 4, CREAM); R(px, b - 15, 2.4, 1.4, '#8a8a92'); }
    ovalShade(x + 16, b - 21, 9, 5.5, CREAM);
    poly([[x + 21, b - 24], [x + 25, b - 33], [x + 28, b - 31], [x + 24, b - 20]], CREAM);
    ovalShade(x + 26, b - 32, 4.5, 3.2, CREAM); oval(x + 29.5, b - 31, 2, 1.8, CREAM);
    disc(x + 26.5, b - 33, 0.8, INK);
    poly([[x + 24, b - 35], [x + 24.6, b - 38.5], [x + 26, b - 35]], CREAM);
    for (const [px, py, h, c] of [[21, -27, 6, FLAME], [23, -32, 6, FLAME2], [25, -35, 5, FLAME], [19, -25, 5, FLAME2]]) poly([[x + px - 2, b + py + 2], [x + px - 1, b + py - h], [x + px + 2, b + py + 1]], c);
    for (const [py, h, c] of [[-24, 7, FLAME], [-21, 6, FLAME2], [-19, 5, FLAME]]) poly([[x + 8, b + py], [x + 8 - h, b + py - 3], [x + 7, b + py + 3]], c);
    cushion(x + 12, b - 28, 9, 3, k.c, 1.2);
    R(x + 25, b - 37, 2, 4, k.a);
    R(x + 18, b - 16, 6, 1.5, k.a);
  } },
  { id: 'monkeybars', name: 'Monkey bars', w: 2, h: 1, price: 700, draw(x, b, vw, dir) {
    floorShadow(x, b, vw);
    if (dir % 2) {
      for (const px of [x + 7, x + 22]) cyl(px, b - 52, 3, 52, k.c);
      for (const y of [b - 12, b - 24, b - 36]) R(x + 10, y, 12, 2, k.a);
      R(x + 7, b - 52, 18, 3, k.c);
      return;
    }
    for (let i = 0; i < 9; i++) disc(x + 7.2 + i * 6.2, b - 50.5, 1.5, k.a);
    for (const px of [x + 3, x + 58]) { cyl(px, b - 52, 3, 52, k.c); for (const y of [b - 12, b - 24, b - 36]) disc(px + 1.5, y, 1.5, k.a); disc(px + 1.5, b - 52, 2, sh(k.c, 1)); }
    R(x + 3, b - 52, 58, 3, k.c);
  } },
  { id: 'tyreswing', name: 'Tyre swing', w: 1, h: 1, price: 520, draw(x, b) {
    floorShadow(x, b, 32);
    for (const px of [x + 1.5, x + 27.5]) cyl(px, b - 56, 3, 56, k.c);
    cyl(x + 1, b - 58, 30, 4, k.w); R(x + 1, b - 58, 30, 1, sh(k.w, 1));
    R(x + 15, b - 54, 2, 2, CHAIN);
    for (const px of [x + 9.5, x + 16, x + 22.5]) line(x + 16, b - 52, px, b - 18, CHAIN, 0.8);
    cushion(x + 6.7, b - 18, 18.6, 5, TYRE, 2.4);
    for (let i = 0; i < 6; i++) R(x + 9 + i * 2.6, b - 17, 1, 3, sh(TYRE, 1));
  } },
  { id: 'playhouse', name: 'Playhouse', w: 2, h: 2, price: 1400, draw(x, b, vw) {
    floorShadow(x, b, vw);
    // plank walls, a corner trim each side, a skirting board
    wood(x + 6, b - 36, 52, 36, k.p);
    for (let y = b - 33; y < b; y += 4.5) R(x + 6, y, 52, 0.6, sh(k.p, -1));
    for (const px of [x + 6, x + 55]) R(px, b - 36, 3, 36, k.w);
    R(x + 6, b - 3, 52, 3, k.w);
    // the gable roof, its round window
    poly([[x + 2, b - 35], [x + 32, b - 60], [x + 62, b - 35], [x + 58, b - 35], [x + 32, b - 56], [x + 6, b - 35]], k.c);
    poly([[x + 6, b - 35], [x + 32, b - 56], [x + 58, b - 35]], k.p);
    disc(x + 32, b - 44, 4, k.a); disc(x + 32, b - 44, 3, SKY);
    // the door with a porthole and a knob
    panel(x + 12, b - 26, 14, 26, k.a); disc(x + 19, b - 20, 2.5, SKY); disc(x + 23.5, b - 12, 1, INK);
    // the window, shutters, a box of flowers
    panel(x + 36, b - 28, 16, 14, SKY); R(x + 43.5, b - 28, 1, 14, k.w); R(x + 36, b - 21.5, 16, 1, k.w);
    for (const px of [x + 32, x + 52]) panel(px, b - 28, 4, 14, k.c);
    for (let i = 0; i < 4; i++) { leaf(x + 38 + i * 4, b - 15, 1.6, 1.2, k.leaf); flower(x + 38 + i * 4, b - 16, i % 2 ? k.c : k.a, 1.5); }
    wood(x + 35, b - 14, 18, 4, k.w);
  } },
  { id: 'logbeam', name: 'Log balance beam', w: 2, h: 1, price: 340, draw(x, b, vw, dir) {
    floorShadow(x, b, vw);
    if (dir % 2) { panel(x + 8, b - 7, 16, 7, sh(k.w, -1)); disc(x + 16, b - 11, 4, sh(k.w, 1)); ring(x + 16, b - 11, 2, k.w, 0.6); return; }
    for (const px of [x + 10, x + 46]) panel(px, b - 7, 8, 7, sh(k.w, -1));
    cyl(x + 2, b - 15, 60, 8, k.w);
    for (let i = 0; i < 9; i++) R(x + 5 + i * 6.5, b - 13 + (i % 3), 3, 0.8, sh(k.w, -1));
    for (const px of [x + 2, x + 62]) oval(px, b - 11, 1.2, 4, sh(k.w, 2));
    ovalShade(x + 26, b - 12, 1.6, 1.2, sh(k.w, -1));
  } },
  { id: 'climbdome', name: 'Climbing dome', w: 2, h: 2, price: 1000, draw(x, b, vw) {
    floorShadow(x, b, vw);
    const g = ctx(), cx = x + 32, R0 = 28;
    // the meridians seen front on (ellipses narrowing to the sides), then the rings across them
    g.strokeStyle = k.c; g.lineWidth = 2;
    for (const a of [0, Math.PI / 4, Math.PI / 2, Math.PI * 3 / 4]) { g.beginPath(); g.ellipse(cx, b, Math.max(0.5, R0 * Math.abs(Math.cos(a))), R0, 0, Math.PI, TAU); g.stroke(); }
    for (const lat of [Math.PI / 8, Math.PI / 4, Math.PI * 3 / 8]) line(cx - R0 * Math.cos(lat), b - R0 * Math.sin(lat), cx + R0 * Math.cos(lat), b - R0 * Math.sin(lat), k.a, 2);
    line(cx - R0, b - 1, cx + R0, b - 1, k.a, 2);
    disc(cx, b - R0, 2.5, k.c);
  } },
  { id: 'hopscotch', name: 'Hopscotch', w: 1, h: 3, price: 220, layer: 'rug', high: 0.02, side: 'p', flat(w, h) {
    R(0, 0, w, h, PATH); speckle(0, 0, w, h, sh(PATH, -1), 1, 0.08);
    const g = ctx(), sq = (x0, y0, w0, n) => {
      R(x0 + 1, y0 + 1, w0 - 2, 14, sh(k.p, 0));
      g.strokeStyle = k.c; g.lineWidth = 1.2; g.strokeRect(x0 + 1, y0 + 1, w0 - 2, 14);
      g.fillStyle = k.c; g.font = 'bold 9px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n), x0 + w0 / 2, y0 + 8.5);
    };
    // 1 nearest (the bottom of the picture), pairs and singles in turn, 8 a round home at the far end
    [[[8, 16, 1]], [[0, 16, 2], [16, 16, 3]], [[8, 16, 4]], [[0, 16, 5], [16, 16, 6]], [[8, 16, 7]]].forEach((row, r) => row.forEach(([x0, w0, n]) => sq(x0, h - 16 * (r + 1), w0, n)));
    g.fillStyle = k.p; g.beginPath(); g.arc(16, 16, 13, Math.PI, 0); g.lineTo(29, 16); g.lineTo(3, 16); g.fill();
    g.strokeStyle = k.c; g.lineWidth = 1.2; g.beginPath(); g.arc(16, 16, 13, Math.PI, 0); g.closePath(); g.stroke();
    g.fillStyle = k.c; g.fillText('8', 16, 10);
    panel(18, h - 45, 6, 5, k.a);
  } },
  { id: 'tetherpole', name: 'Tetherball pole', w: 1, h: 1, price: 300, draw(x, b) {
    floorShadow(x + 4, b, 24);
    ovalShade(x + 16, b - 2.5, 8, 2.5, k.m); R(x + 9, b - 4, 14, 2, k.m);
    cyl(x + 15, b - 80, 2.4, 77, k.p);
    for (const y of [b - 20, b - 44, b - 68]) R(x + 14.8, y, 2.8, 3, k.a);
    disc(x + 16.2, b - 80.5, 1.8, k.a);
    line(x + 17, b - 77, x + 25.5, b - 54, '#f4f4f0', 0.9);
    ovalShade(x + 26, b - 50, 4, 4, k.c); line(x + 22.2, b - 51, x + 29.8, b - 49, sh(k.c, -2), 0.6);
  } },
  { id: 'playtunnel', name: 'Crawl tunnel', w: 1, h: 2, price: 450, draw(x, b, vw, dir) {
    floorShadow(x, b, vw);
    if (dir % 2) {
      // side on: the tube's length, banded, a rim at each end
      for (let i = 0; i < 6; i++) cyl(x + 3 + i * (vw - 6) / 6, b - 26, (vw - 6) / 6, 26, i % 2 ? k.a : k.c);
      for (const px of [x + 2, x + vw - 4]) R(px, b - 26, 2, 26, sh(k.a, -1));
      for (const px of [x + 6, x + vw - 12]) R(px, b - 3, 6, 3, k.w);
      return;
    }
    const g = ctx(), cx = x + 16, cy = b - 13;
    for (const px of [x + 3, x + 23]) R(px, b - 3, 6, 3, k.w);
    // the opening: the tube's lip in its colour, a rim, the floor of the tube inside, see-through above it
    g.fillStyle = k.c; g.beginPath(); g.arc(cx, cy, 13, 0, TAU); g.arc(cx, cy, 9.5, 0, TAU, true); g.fill('evenodd');
    ring(cx, cy, 12.3, k.a, 1.6);
    g.fillStyle = sh(k.c, -3); g.beginPath(); g.arc(cx, cy, 9.5, 0.35, Math.PI - 0.35); g.closePath(); g.fill();
  } },
  { id: 'minitrampoline', name: 'Mini trampoline', w: 1, h: 1, price: 420, draw(x, b) {
    floorShadow(x, b, 32);
    for (const [px, dx] of [[4, -2], [10, -1], [22, 1], [28, 2]]) { line(x + px, b - 8, x + px + dx, b - 1, k.m, 1.6); disc(x + px + dx, b - 1, 1.2, INK); }
    // the handlebar from the back of the frame, foam on its grips
    cyl(x + 15, b - 37, 2, 27, k.a);
    R(x + 9, b - 38, 14, 2, k.a);
    for (const px of [x + 7, x + 21]) cushion(px, b - 38.5, 4, 3, k.c, 1);
    R(x + 3, b - 10, 26, 1.2, INK);
    cushion(x + 1, b - 11.5, 30, 4, k.c, 1.6);
  } },
]);
