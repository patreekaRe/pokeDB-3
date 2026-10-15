/* base-furniture-yard.js  -  the backyard's outdoor furniture (docs/roadmap.md's backyard, part b): the Yard shelf, every
   kind `outdoor`, so it stands only out on the lawn and nothing from indoors goes out there (fits() in
   js/secret-base.js). Sold by Smeargle's garden catalogue in the Poké Mall (js/garden-shop.js), never in the daily
   stock. Painted with js/base-paint.js's kit like every kind, but the paintings are only the tray's and the store's
   pictures: each is modelled from parts in js/base-models-y.js. A flat kind (the pool, the pond, the sandpit) is painted
   from above, the rest from the front. */

import { k, sh, R, panel, wood, cushion, disc, oval, ovalShade, cyl, leaf, foliage, speckle, floorShadow, ctx } from './base-paint.js';

export const YARD_KINDS = [];
const add = (list) => list.forEach(f => YARD_KINDS.push({ group: 'Yard', outdoor: true, ...f }));

const WATER = '#4ea6d8', SAND = '#ecd6a2', SOIL = '#5a3c26', INK = '#2c2c34';
const line = (x0, y0, x1, y1, c, w = 2) => { const g = ctx(); g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
const curve = (pts, c, w = 2) => { const g = ctx(); g.strokeStyle = c; g.lineWidth = w; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); };
const flower = (x, y, c, r = 2.6) => { for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; disc(x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8, r * 0.7, c); } disc(x, y, r * 0.5, '#f8d038'); };

add([
  { id: 'parkbench', name: 'Park bench', w: 2, h: 1, price: 380, draw(x, b, vw, dir) {
    const iron = sh(k.m, -1);
    if (dir % 2) {
      floorShadow(x, b, vw);
      curve([[x + 6, b], [x + 8, b - 14], [x + 9, b - 30], [x + 5, b - 46]], iron, 3);
      curve([[x + 26, b], [x + 24, b - 14], [x + 25, b - 20], [x + 26, b - 24], [x + 12, b - 24]], iron, 3);
      for (let i = 0; i < 4; i++) R(x + 9 + i * 4, b - 17, 3, 3, k.w);
      for (let i = 0; i < 3; i++) R(x + 6 - i, b - 26 - i * 6, 3, 4, k.w);
      return;
    }
    floorShadow(x, b, vw);
    for (const ex of [x + 4, x + vw - 8]) { cyl(ex, b - 46, 4, 46, iron); R(ex - 2, b - 2, 8, 2, sh(iron, -1)); }
    cyl(x + vw / 2 - 1.5, b - 44, 3, 44, iron);
    for (let i = 0; i < 3; i++) wood(x + 2, b - 46 + i * 7, vw - 4, 5, k.w);
    wood(x + 1, b - 20, vw - 2, 5, sh(k.w, 1)); wood(x + 1, b - 15, vw - 2, 3, k.w);
    for (const ex of [x + 1, x + vw - 11]) { R(ex, b - 28, 10, 3, iron); disc(ex + (ex === x + 1 ? 1 : 9), b - 26, 2.5, iron); }
  } },
  { id: 'swingset', name: 'Swing set', w: 2, h: 1, price: 900, draw(x, b, vw, dir) {
    const frame = k.c, chain = '#b8bcc6';
    if (dir % 2) {
      floorShadow(x, b, vw);
      line(x + 3, b, x + vw / 2, b - 88, frame, 3.5); line(x + vw - 3, b, x + vw / 2, b - 88, frame, 3.5);
      line(x + vw / 2, b - 86, x + vw / 2, b - 22, chain, 1); R(x + vw / 2 - 7, b - 23, 14, 3, k.a);
      return;
    }
    floorShadow(x, b, vw);
    for (const px of [x + 4, x + vw - 7]) cyl(px, b - 88, 3.5, 88, frame);
    cyl(x + 2, b - 90, vw - 4, 4, sh(frame, 1)); R(x + 2, b - 90, vw - 4, 4, frame);
    for (const sx of [x + 16, x + vw - 16]) {
      for (const dx of [-7, 7]) line(sx + dx, b - 86, sx + dx, b - 22, chain, 1);
      panel(sx - 9, b - 24, 18, 3, k.a);
    }
  } },
  { id: 'picnicbench', name: 'Picnic bench', w: 2, h: 2, price: 500, draw(x, b, vw, dir) {
    floorShadow(x, b, vw);
    const w0 = sh(k.w, -1);
    line(x + 12, b, x + 24, b - 34, w0, 4); line(x + 24, b, x + 12, b - 34, w0, 4);
    line(x + vw - 12, b, x + vw - 24, b - 34, w0, 4); line(x + vw - 24, b, x + vw - 12, b - 34, w0, 4);
    wood(x + 2, b - 20, vw - 4, 5, k.w);
    wood(x + 2, b - 40, vw - 4, 7, sh(k.w, 1));
    R(x + 10, b - 40, vw - 20, 3, '#fbf8f2'); for (let i = 0; i < vw - 20; i += 6) R(x + 10 + i, b - 40, 3, 3, k.c);
  } },
  { id: 'lamppost', name: 'Lamp post', w: 1, h: 1, price: 420, glow: ['g', 'gl'], draw(x, b) {
    const iron = sh(k.m, -1);
    floorShadow(x + 6, b, 20);
    panel(x + 10, b - 8, 12, 8, iron); cyl(x + 14, b - 64, 4, 58, iron);
    for (const y of [b - 16, b - 40, b - 62]) R(x + 12, y, 8, 2, sh(iron, 1));
    R(x + 8, b - 56, 16, 2, iron);
    panel(x + 10, b - 68, 12, 3, iron);
    R(x + 11, b - 80, 10, 12, k.g); R(x + 12, b - 79, 3, 10, k.gl);
    for (const px of [x + 10, x + 20]) R(px, b - 80, 2, 12, iron);
    for (let i = 0; i < 6; i++) R(x + 10 + i, b - 81 - i, 12 - i * 2, 1, iron);
    disc(x + 16, b - 88, 1.6, iron);
  } },
  { id: 'stringlights', name: 'String lights', w: 2, h: 1, price: 380, glow: ['g', 'gl'], draw(x, b, vw, dir) {
    floorShadow(x, b, vw);
    if (dir % 2) { wood(x + vw / 2 - 2, b - 52, 4, 52, k.w, 'y'); disc(x + vw / 2, b - 40, 2.5, k.g); return; }
    for (const px of [x + 3, x + vw - 7]) wood(px, b - 52, 4, 52, k.w, 'y');
    const pts = [];
    for (let i = 0; i <= 12; i++) pts.push([x + 5 + i * (vw - 10) / 12, b - 50 + Math.sin(i / 12 * Math.PI) * 10]);
    curve(pts, INK, 0.8);
    ['g', '#ff9a8a', 'g', '#9ad8ff', 'g', '#ffe070', 'g', '#a8f0a0', 'g'].forEach((c, i) => {
      const [px, py] = pts[i + 2] || pts[pts.length - 1];
      oval(px, py + 3, 1.8, 2.4, c === 'g' ? k.g : c);
    });
  } },
  { id: 'dometent', name: 'Dome tent', w: 2, h: 2, price: 1200, draw(x, b, vw) {
    floorShadow(x, b, vw);
    const g = ctx(), cx = x + vw / 2;
    g.fillStyle = k.c; g.beginPath(); g.ellipse(cx, b - 1, vw / 2 - 4, 34, 0, Math.PI, 0); g.fill();
    g.fillStyle = sh(k.c, 1); g.beginPath(); g.ellipse(cx - 6, b - 1, vw / 2 - 16, 30, 0, Math.PI, Math.PI * 1.5); g.lineTo(cx - 6, b - 1); g.fill();
    g.fillStyle = sh(k.c, -3); g.beginPath(); g.ellipse(cx, b - 1, 10, 20, 0, Math.PI, 0); g.fill();
    cushion(cx - 12, b - 24, 24, 5, k.a, 2);
    curve([[x + 6, b - 1], [x + 14, b - 26], [cx, b - 35], [x + vw - 14, b - 26], [x + vw - 6, b - 1]], INK, 1);
    line(x + 4, b - 1, x + 12, b - 16, '#e8e0c8', 0.6); line(x + vw - 4, b - 1, x + vw - 12, b - 16, '#e8e0c8', 0.6);
  } },
  { id: 'paddlingpool', name: 'Inflatable pool', w: 2, h: 2, price: 520, high: 0.5, side: 'c', flat(w, h) {
    const cx = w / 2, cy = h / 2;
    disc(cx, cy + 1, 29, 'rgba(30,18,10,0.25)');
    disc(cx, cy, 29, k.c); disc(cx, cy, 25, '#f6f6f2'); disc(cx, cy, 22, k.a);
    disc(cx, cy, 19, WATER); oval(cx - 6, cy - 7, 8, 3, sh(WATER, 2));
    disc(cx - 7, cy + 4, 5, '#f8f8f4'); R(cx - 12, cy + 3, 10, 2, '#e84848'); R(cx - 8, cy - 1, 2, 10, '#3a8ae0');
    ovalShade(cx + 8, cy - 3, 4, 3, '#f8d030'); disc(cx + 11, cy - 5, 2, '#f8d030'); R(cx + 13, cy - 5, 2, 1, '#f08030');
  } },
  { id: 'rockpond', name: 'Rock pond', w: 2, h: 2, price: 900, high: 0.12, side: 'p', flat(w, h) {
    const g = ctx(), cx = w / 2, cy = h / 2, ring = [];
    for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2, r = 0.66 + Math.sin(a * 3 + 1) * 0.08 + Math.cos(a * 2) * 0.05; ring.push([cx + Math.cos(a) * r * w / 2, cy + Math.sin(a) * r * h / 2]); }
    g.fillStyle = WATER; g.beginPath(); ring.forEach(([px, py], i) => i ? g.lineTo(px, py) : g.moveTo(px, py)); g.closePath(); g.fill();
    oval(cx - 5, cy - 6, 9, 4, sh(WATER, 1));
    ring.forEach(([px, py], i) => ovalShade(cx + (px - cx) * 1.08, cy + (py - cy) * 1.08, 4 + (i % 3), 3 + (i % 2), ['#a8a49a', '#8e8a82', '#bab4a8'][i % 3]));
    for (const [px, py, r] of [[-6, 4, 5], [7, -2, 4], [2, 10, 3]]) { disc(cx + px, cy + py, r, '#4a9a3e'); R(cx + px, cy + py - 1, r, 1, WATER); }
    flower(cx - 6, cy + 4, k.c, 2.2);
    for (let i = 0; i < 6; i++) leaf(cx - 14 + i * 5, cy - 18 + (i % 2) * 2, 1.2, 4, '#4a8a32');
  } },
  { id: 'flowerbed', name: 'Flower bed', w: 2, h: 1, price: 300, draw(x, b, vw, dir) {
    floorShadow(x, b, vw);
    if (dir % 2) {
      wood(x + 4, b - 12, vw - 8, 12, k.w);
      for (let i = 0; i < 3; i++) { leaf(x + 9 + i * 7, b - 15, 2, 3, k.leaf); flower(x + 9 + i * 7, b - 21 - (i % 2) * 2, [k.c, k.a, k.p][i]); }
      return;
    }
    wood(x + 1, b - 12, vw - 2, 12, k.w);
    for (const px of [x, x + vw - 4]) R(px, b - 14, 4, 14, sh(k.w, -1));
    R(x + 4, b - 13, vw - 8, 2, SOIL);
    const cols = [k.c, k.a, k.p, k.c, k.a, k.p];
    for (let i = 0; i < 6; i++) {
      const fx = x + 8 + i * 9.6;
      R(fx - 0.5, b - 22 - (i % 3) * 3, 1, 10, '#4a9a3a');
      leaf(fx - 2, b - 15, 2, 3, k.leaf, -0.5); leaf(fx + 2, b - 16, 2, 3, k.leaf, 0.5);
      flower(fx, b - 23 - (i % 3) * 3, cols[i]);
    }
  } },
  { id: 'picketfence', name: 'Garden fence', w: 1, h: 1, price: 120, draw(x, b, vw, dir) {
    if (dir % 2) { floorShadow(x + 12, b, 8); wood(x + 14, b - 24, 4, 24, k.p, 'y'); return; }
    floorShadow(x, b, vw);
    for (const y of [b - 8, b - 18]) wood(x, y, vw, 3, sh(k.p, -1));
    for (let i = 0; i < 4; i++) {
      const px = x + 2 + i * 8;
      wood(px, b - 22, 4, 22, k.p, 'y');
      ctx().fillStyle = k.p; ctx().beginPath(); ctx().moveTo(px, b - 22); ctx().lineTo(px + 2, b - 25); ctx().lineTo(px + 4, b - 22); ctx().fill();
    }
  } },
  { id: 'boxhedge', name: 'Box hedge', w: 1, h: 1, price: 140, draw(x, b) {
    floorShadow(x, b, 32);
    panel(x + 1, b - 26, 30, 26, sh(k.leaf, -1), 2);
    for (let i = 0; i < 4; i++) foliage(x + 5 + i * 7.5, b - 22 + (i % 2) * 3, 6, k.leaf, i + 3);
    for (let i = 0; i < 3; i++) foliage(x + 8 + i * 8, b - 10, 6, sh(k.leaf, -1), i + 11);
    speckle(x + 2, b - 26, 28, 24, sh(k.leaf, 1), 1, 0.08);
  } },
  { id: 'gardenmailbox', name: 'Garden mailbox', w: 1, h: 1, price: 160, draw(x, b) {
    floorShadow(x + 8, b, 16);
    wood(x + 14, b - 30, 4, 30, k.w, 'y');
    for (let n = 0; n < 4; n++) leaf(x + 12 + n * 3, b - 3, 2, 3, k.leaf);
    panel(x + 7, b - 40, 18, 10, k.c);
    disc(x + 16, b - 40, 9, k.c); R(x + 7, b - 40, 18, 2, sh(k.c, 1));
    R(x + 9, b - 37, 14, 1, sh(k.c, -1));
    R(x + 25, b - 48, 2, 12, '#e04040'); R(x + 25, b - 48, 5, 4, '#e04040');
  } },
  { id: 'barbecue', name: 'Barbecue', w: 1, h: 1, price: 450, glow: ['#ff7030'], draw(x, b) {
    floorShadow(x + 3, b, 26);
    line(x + 10, b - 2, x + 14, b - 14, '#a8acb4', 1.6); line(x + 22, b - 2, x + 18, b - 14, '#a8acb4', 1.6);
    disc(x + 22, b - 3, 3, INK);
    const g = ctx();
    g.fillStyle = k.c; g.beginPath(); g.ellipse(x + 16, b - 22, 12, 10, 0, 0, Math.PI); g.fill();
    R(x + 4, b - 23, 24, 2, '#c8ccd4');
    for (let i = 0; i < 5; i++) disc(x + 8 + i * 4, b - 25, 1.8, i % 2 ? '#ff7030' : '#ffb040');
    g.fillStyle = sh(k.c, -1); g.beginPath(); g.ellipse(x + 16, b - 30, 12, 9, 0, Math.PI, 0); g.fill();
    R(x + 13, b - 41, 6, 2, INK);
  } },
  { id: 'sunlounger', name: 'Garden lounger', w: 1, h: 2, price: 420, draw(x, b, vw, dir) {
    floorShadow(x, b, vw);
    if (dir % 2) {
      R(x + 4, b - 12, vw - 22, 3, k.w); for (const px of [x + 6, x + vw - 24]) R(px, b - 10, 3, 10, sh(k.w, -1));
      line(x + vw - 20, b - 12, x + vw - 6, b - 32, k.w, 3);
      cushion(x + 4, b - 16, vw - 22, 4, k.c, 2); line(x + vw - 19, b - 16, x + vw - 7, b - 33, k.c, 4);
      return;
    }
    for (const px of [x + 4, x + vw - 7]) R(px, b - 12, 3, 12, sh(k.w, -1));
    wood(x + 2, b - 14, vw - 4, 4, k.w);
    wood(x + 4, b - 34, vw - 8, 20, sh(k.w, 1), 'y');
    cushion(x + 5, b - 32, vw - 10, 18, k.c, 3);
    cushion(x + 8, b - 32, vw - 16, 5, k.p, 2);
  } },
  { id: 'parasol', name: 'Garden parasol', w: 1, h: 1, price: 300, draw(x, b) {
    floorShadow(x + 4, b, 24);
    oval(x + 16, b - 2, 7, 2.5, sh(k.m, 1));
    cyl(x + 15, b - 62, 2, 60, k.w);
    const g = ctx();
    for (let i = 0; i < 6; i++) {
      g.fillStyle = i % 2 ? k.p : k.c;
      g.beginPath(); g.moveTo(x + 16, b - 74); g.lineTo(x + 1 + i * 5, b - 60); g.lineTo(x + 6 + i * 5, b - 60); g.closePath(); g.fill();
    }
    for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? k.c : k.p; g.beginPath(); g.arc(x + 3.5 + i * 5, b - 60, 2.5, 0, Math.PI); g.fill(); }
    disc(x + 16, b - 75, 1.5, k.w);
  } },
  { id: 'sandpit', name: 'Sandpit', w: 2, h: 2, price: 600, high: 0.2, side: 'w', flat(w, h) {
    wood(2, 2, w - 4, 5, k.w); wood(2, h - 7, w - 4, 5, k.w);
    wood(2, 7, 5, h - 14, k.w, 'y'); wood(w - 7, 7, 5, h - 14, k.w, 'y');
    R(7, 7, w - 14, h - 14, SAND); speckle(7, 7, w - 14, h - 14, sh(SAND, -1), 1, 0.1);
    oval(22, 22, 10, 6, sh(SAND, 1));
    for (const [px, py] of [[38, 18], [46, 18], [38, 26], [46, 26]]) disc(px, py, 3, sh(SAND, -1));
    R(39, 19, 7, 7, sh(SAND, -1));
    disc(18, 44, 5, k.c); disc(18, 44, 3.5, sh(k.c, -1));
    line(30, 44, 42, 40, k.a, 2); R(41, 37, 5, 5, k.a);
  } },
]);
