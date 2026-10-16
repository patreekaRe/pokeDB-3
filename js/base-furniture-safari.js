/* base-furniture-safari.js  -  the Safari set (2026-10-16, the user's ask: furniture locked behind the Safari
   Outfitter's Ranger Task Board): eight pieces never sold, each earned by one task (js/data/ranger.js's
   RANGER_FURNITURE, js/data/furniture.js's `ranger` source). One colour each, the lodge's: bamboo, khaki canvas,
   jungle green. */

import { R, P, disc, oval, ovalShade, cyl, panel, wood, floorShadow, ctx, sh } from './base-paint.js';

const CANE = '#c8a058', KHAKI = '#d8c08a', GREEN = '#4a7a3a', DARK = '#5a3a1e', OLIVE = '#6a7a3a';

const words = (text, x, y, size, col, w) => {
  const g = ctx();
  g.font = `bold ${size}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = col; g.fillText(text, x, y, w);
};

/** A Poké Ball, `top` its upper half. */
function ball(cx, cy, r, top) {
  disc(cx, cy, r, '#f4f4f4');
  const g = ctx();
  g.fillStyle = top; g.beginPath(); g.arc(cx, cy, r, Math.PI, 0); g.fill();
  R(cx - r, cy - 0.5, r * 2, 1, '#26262c');
  disc(cx, cy, r * 0.32, '#26262c'); disc(cx, cy, r * 0.2, '#ffffff');
  P(cx - r * 0.5, cy - r * 0.6, sh(top, 2));
}

export const SAFARI_KINDS = [
  // a green pennant on the wall: a Safari Ball and RANGER on a swallowtail flag
  { id: 'rangerflag', name: 'Ranger pennant', group: 'Safari', solo: true, w: 1, h: 1, layer: 'wall', price: 200, wall(x) {
    const g = ctx(), X = x + 4, Y = 12;
    R(X - 1, Y - 2, 26, 3, DARK); disc(X - 1, Y - 0.5, 2, '#e0b040'); disc(X + 25, Y - 0.5, 2, '#e0b040');
    g.fillStyle = GREEN;
    g.beginPath(); g.moveTo(X, Y); g.lineTo(X + 24, Y); g.lineTo(X + 24, Y + 40); g.lineTo(X + 12, Y + 32); g.lineTo(X, Y + 40); g.closePath(); g.fill();
    g.fillStyle = sh(GREEN, -1); g.fillRect(X, Y, 2, 38);
    R(X + 2, Y + 3, 20, 1, KHAKI);
    ball(X + 12, Y + 13, 6, '#58a848');
    words('RANGER', X + 12, Y + 25, 5.4, KHAKI, 22);
  } },
  // a hurricane lantern on a bamboo post, its flame lit
  { id: 'safarilantern', name: 'Safari lantern', group: 'Safari', solo: true, w: 1, h: 1, price: 250, draw(x, b) {
    floorShadow(x + 8, b, 16);
    R(x + 10, b - 3, 12, 3, DARK);
    cyl(x + 14, b - 52, 4, 50, CANE);
    for (const j of [-40, -26, -12]) R(x + 14, b + j, 4, 1, sh(CANE, -2));
    R(x + 12, b - 58, 8, 2, '#3a3a40'); R(x + 15, b - 63, 2, 5, '#3a3a40');
    disc(x + 16, b - 52, 6, 'rgba(255,220,120,0.35)');
    oval(x + 16, b - 50, 4.5, 5, '#ffe9a0'); oval(x + 16, b - 51, 2, 3, '#ffb040'); oval(x + 16, b - 52, 1, 1.6, '#fff6d0');
    R(x + 11, b - 45, 10, 2, '#3a3a40');
  } },
  // an acacia: a forked trunk under a wide flat crown
  { id: 'acacia', name: 'Acacia tree', group: 'Safari', solo: true, w: 1, h: 1, price: 450, draw(x, b) {
    floorShadow(x - 2, b, 36);
    cyl(x + 7, b - 18, 18, 17, '#a8743e'); R(x + 8, b - 2, 16, 2, sh('#a8743e', -1));
    for (let y = b - 60; y < b - 18; y++) { const k = (b - 18 - y) / 42; R(x + 15 - Math.round(k * k * 6), y, 3, 1, '#6a4a28'); if (y < b - 40) R(x + 15 + Math.round(k * 7), y, 2, 1, '#6a4a28'); }
    for (const [cx, rx] of [[x + 9, 14], [x + 23, 13], [x + 16, 17]]) { oval(cx, b - 64, rx, 6, '#4a7a30'); oval(cx, b - 66, rx - 2, 4, '#5e9440'); }
    for (let i = 0; i < 14; i++) P(x + 2 + i * 2.2, b - 68 + (i % 3), '#7ab050');
  } },
  // a bamboo rack of Poké Balls, three shelves
  { id: 'ballrack', name: 'Poké Ball rack', group: 'Safari', solo: true, w: 1, h: 1, price: 400, draw(x, b) {
    floorShadow(x + 2, b, 28);
    cyl(x + 3, b - 56, 3, 56, CANE); cyl(x + 26, b - 56, 3, 56, CANE);
    const tops = [['#e84838', '#3a74e0', '#2c2c34'], ['#58a848', '#f8d040', '#3aa8c8'], ['#7a3ac0', '#e84838', '#2a2a30']];
    tops.forEach((row, i) => {
      const y = b - 14 - i * 17;
      wood(x + 2, y, 28, 3, sh(CANE, -1));
      row.forEach((top, j) => ball(x + 9 + j * 7, y - 4, 3.6, top));
    });
  } },
  // a woven sisal rug, a green border and a Safari Ball woven in the middle
  { id: 'safarirug', name: 'Woven safari rug', group: 'Safari', solo: true, w: 2, h: 2, layer: 'rug', price: 350, high: 0.04, side: 'c', flat(w, h) {
    R(0, 0, w, h, GREEN);
    R(3, 3, w - 6, h - 6, KHAKI);
    for (let j = 3; j < h - 3; j++) for (let i = 3; i < w - 3; i++) if ((i + j) % 4 === 0) P(i, j, sh(KHAKI, -1));
    for (let i = 6; i < w - 6; i += 6) { R(i, 6, 3, 2, '#c8642e'); R(i, h - 8, 3, 2, '#c8642e'); }
    disc(w / 2, h / 2, 13, sh(GREEN, -1)); disc(w / 2, h / 2, 11.5, '#f4f0e0');
    const g = ctx(); g.fillStyle = '#58a848'; g.beginPath(); g.arc(w / 2, h / 2, 11.5, Math.PI, 0); g.fill();
    R(w / 2 - 11.5, h / 2 - 1, 23, 2, '#26262c'); disc(w / 2, h / 2, 4, '#26262c'); disc(w / 2, h / 2, 2.5, '#f4f0e0');
  } },
  // the expedition table: a map spread on a trestle, a compass and a lantern on it
  { id: 'expeditiontable', name: 'Expedition map table', group: 'Safari', solo: true, w: 2, h: 1, price: 500, draw(x, b, vw) {
    floorShadow(x, b, vw);
    for (const lx of [x + 6, x + vw - 10]) { cyl(lx, b - 26, 4, 26, DARK); R(lx - 2, b - 14, 8, 2, sh(DARK, -1)); }
    wood(x + 2, b - 30, vw - 4, 5, '#8a5a30');
    panel(x + 6, b - 36, vw - 12, 7, '#f0e0b4');
    for (const [cx, rx, c] of [[x + 18, 6, '#9cc878'], [x + 34, 7, '#7ab0d8'], [x + 48, 5, '#d8b878']]) oval(cx, b - 33, rx, 2, c);
    R(x + 12, b - 33, vw - 24, 1, 'rgba(138,74,40,0.5)');
    disc(x + 52, b - 37, 3.5, '#e0b040'); disc(x + 52, b - 37, 2.4, '#f4f0e0'); R(x + 51.5, b - 39, 1, 2.5, '#c83a2a');
    R(x + 10, b - 44, 6, 8, '#3a3a40'); oval(x + 13, b - 40, 2.2, 2.6, '#ffd870');
  } },
  // a ranger's canvas tent, its flap tied back, a pennant on the pole
  { id: 'rangertent', name: 'Ranger tent', group: 'Safari', solo: true, w: 2, h: 1, price: 900, draw(x, b, vw) {
    floorShadow(x - 2, b, vw + 4);
    const g = ctx(), mid = x + vw / 2, top = b - 62;
    g.fillStyle = KHAKI; g.beginPath(); g.moveTo(mid, top); g.lineTo(x + vw - 1, b); g.lineTo(x + 1, b); g.closePath(); g.fill();
    g.fillStyle = sh(KHAKI, -1); g.beginPath(); g.moveTo(mid, top); g.lineTo(x + vw - 1, b); g.lineTo(mid + 4, b); g.closePath(); g.fill();
    g.fillStyle = '#3a2a18'; g.beginPath(); g.moveTo(mid, top + 16); g.lineTo(mid + 12, b); g.lineTo(mid - 12, b); g.closePath(); g.fill();
    g.fillStyle = sh(KHAKI, 1); g.beginPath(); g.moveTo(mid, top + 16); g.lineTo(mid - 12, b); g.lineTo(mid - 18, b); g.lineTo(mid - 4, top + 20); g.closePath(); g.fill();
    R(mid - 0.5, top - 12, 1.5, 14, DARK);
    g.fillStyle = GREEN; g.beginPath(); g.moveTo(mid + 1, top - 12); g.lineTo(mid + 11, top - 9); g.lineTo(mid + 1, top - 6); g.closePath(); g.fill();
    for (const s of [-1, 1]) { R(mid + s * (vw / 2 - 2), b - 2, 2, 2, DARK); }
    R(x + 4, b - 1, vw - 8, 1, sh(KHAKI, -2));
  } },
  // the Safari jeep in miniature: olive, a khaki top, SAFARI on its door
  { id: 'safarijeep', name: 'Safari jeep', group: 'Safari', solo: true, w: 2, h: 1, price: 1500, draw(x, b, vw) {
    floorShadow(x, b, vw);
    for (const wx of [x + 14, x + vw - 14]) { disc(wx, b - 8, 8, '#26262c'); disc(wx, b - 8, 4, '#c8c8c0'); }
    R(x + 3, b - 30, vw - 6, 16, OLIVE); R(x + 3, b - 30, vw - 6, 2, sh(OLIVE, 1)); R(x + 3, b - 16, vw - 6, 2, sh(OLIVE, -1));
    R(x + vw - 22, b - 34, 19, 5, sh(OLIVE, -1));
    R(x + vw - 4, b - 28, 2, 4, '#ffe890');
    for (const px of [x + 8, x + 32]) R(px, b - 46, 2, 16, sh(OLIVE, -2));
    R(x + 6, b - 48, 30, 4, KHAKI); R(x + 6, b - 45, 30, 1, sh(KHAKI, -1));
    R(x + vw - 26, b - 44, 2, 14, sh(OLIVE, -2)); R(x + vw - 26, b - 44, 10, 2, sh(OLIVE, -2));
    disc(x + 2, b - 24, 6, '#26262c'); disc(x + 2, b - 24, 3, '#c8c8c0');
    ovalShade(x + 22, b - 23, 4, 4, '#f4f0e0'); R(x + 18, b - 23.5, 8, 1, '#26262c');
    words('SAFARI', x + 38, b - 23, 6, '#f4e8c4', 22);
  } },
];
