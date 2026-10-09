/* base-furniture-kinds.js  -  the catalogue's kinds past its first 25 (js/base-furniture.js), painted at 32 pixels a tile
   with the kit in js/base-paint.js. Most come in groups built from one painter and a list: chairs by their back, rugs and
   mats by their pattern or motif (MOTIFS, 9x9 stamps shared with the posters, banners and cushions), plants by species,
   Berry bushes by their berry, Pokémon dolls by a bitmap (shaded and outlined in code). A family with `solo` is one piece
   only, never themed (the dolls keep their Pokémon's colours). `group` is its shelf in the tool page; `seat` lets a
   Pokémon rest on it; `sky` makes a wall piece a window (its view glows, js/base-paint-scenes.js). */

import { plush, k, sh, R, P, clear, hash, panel, inset, wood, cushion, sphere, disc, oval, ovalShade, cyl, glass, leaf, foliage, tri,
  speckle, stamp, floorShadow, clipped } from './base-paint.js';
import { BOOKS, view, books } from './base-paint-scenes.js';
import { PLUSH, plushDoll } from './base-dolls.js';

export const MORE_KINDS = [];
const add = (group, list) => list.forEach(f => MORE_KINDS.push({ group, ...f }));

/* ---------- shared bits ---------- */
export const legs4 = (x, b, vw, h, c) => { cyl(x + 3, b - h, 3, h, c); cyl(x + vw - 6, b - h, 3, h, c); };
export const sideBox = (x, b, vw, h) => { floorShadow(x, b, vw); wood(x + 2, b - h, vw - 4, h, k.w, 'y'); R(x + 4, b - h + 2, vw - 8, 1, sh(k.w, 1)); };
export const potAt = (x, b, shape = 'round') => {
  if (shape === 'square') { panel(x + 8, b - 14, 16, 14, k.pot); R(x + 9, b - 13, 14, 2, sh(k.pot, 1)); R(x + 7, b - 16, 18, 3, sh(k.pot, 1)); R(x + 9, b - 15, 14, 2, '#3a2416'); return b - 15; }
  if (shape === 'tray') { panel(x + 3, b - 8, 26, 8, k.pot); R(x + 4, b - 7, 24, 1, sh(k.pot, 1)); R(x + 5, b - 9, 22, 2, '#4a3020'); return b - 8; }
  if (shape === 'basket') { R(x + 6, b - 16, 20, 16, k.w); for (let j = 0; j < 16; j += 3) for (let i = (j % 6 ? 0 : 2); i < 20; i += 4) R(x + 6 + i, b - 16 + j, 2, 2, sh(k.w, j % 6 ? 1 : -1)); R(x + 5, b - 18, 22, 3, sh(k.w, -1)); R(x + 5, b - 18, 22, 1, sh(k.w, 1)); return b - 17; }
  cyl(x + 9, b - 16, 14, 15, k.pot); R(x + 10, b - 2, 12, 2, sh(k.pot, -1)); cushion(x + 7, b - 20, 18, 5, sh(k.pot, 1), 1); R(x + 9, b - 19, 14, 2, '#3a2416'); return b - 19;
};
export const shadowWall = (x, y, w, h) => R(x + 1, y + 1, w, h, 'rgba(0,0,0,0.18)');
/** A window frame round the view already painted in a box: frame where `frame(i, j)`, glass where `glassAt(i, j)`, clear
    elsewhere, lit on its top-left side. */
function frameAround(x0, y0, w, h, glassAt, frame) {
  for (let j = y0; j < y0 + h; j++) for (let i = x0; i < x0 + w; i++) {
    if (glassAt(i, j)) continue;
    if (frame(i, j)) P(i, j, frame(i - 1, j) && frame(i, j - 1) ? k.w : sh(k.w, 1));
    else clear(i, j, 1, 1);
  }
}

/* ---------- motifs: 9x9 stamps. # main, + light, k dark, o white ---------- */
export const MOTIFS = {
  ball: ['..kkkkk..', '.k##+##k.', 'k#+#####k', 'k###k###k', 'kkkkokkkk', 'koookoook', 'koooooook', '.koooook.', '..kkkkk..'],
  star: ['....#....', '...###...', '...#+#...', '#########', '.##+++##.', '..#####..', '..##.##..', '.##...##.', '##.....##'],
  heart: ['.##...##.', '#+##.####', '#+#######', '#########', '.#######.', '..#####..', '...###...', '....#....'],
  bolt: ['....####.', '...####..', '..####...', '.#######.', '....###..', '...###...', '..##.....', '.#.......'],
  flame: ['...#.....', '..##...#.', '..###.##.', '.####+##.', '.##++++#.', '##++o++##', '#++ooo++#', '.#++o++#.', '..#####..'],
  drop: ['....#....', '...###...', '...#o#...', '..##o##..', '..#o###..', '..#####..', '...###...', '.#.....#.', '..#####..'],
  sprout: ['......##.', '....####.', '..#####+.', '.####+##.', '.##+####.', '.#+####..', '.+####...', '+.##.....'],
  moon: ['...###...', '.###.....', '.##......', '##.......', '##.......', '##.......', '.##......', '.###.....', '...###...'],
  sun: ['#...#...#', '.#..#..#.', '...###...', '..#+++#..', '###+o+###', '..#+++#..', '...###...', '.#..#..#.', '#...#...#'],
  flower: ['..##.##..', '.###.###.', '.##+++##.', '...+o+...', '.##+++##.', '.###.###.', '..##.##..'],
  diamond: ['....#....', '...###...', '..##+##..', '.##+++##.', '###+++###', '.##+++##.', '..##+##..', '...###...', '....#....'],
  note: ['...######', '...######', '...#....#', '...#....#', '...#....#', '.###..###', '####.####', '.##...##.'],
  paw: ['.##...##.', '.##...##.', '.........', '##.###.##', '##.###.##', '..#####..', '.#######.', '..#####..'],
};
const MOTIF_NAME = { ball: 'Poké Ball', star: 'Star', heart: 'Heart', bolt: 'Thunder', flame: 'Flame', drop: 'Water', sprout: 'Sprout',
  moon: 'Moon', sun: 'Sun', flower: 'Flower', diamond: 'Diamond', note: 'Melody', paw: 'Paw' };
const MOTIF_IDS = Object.keys(MOTIFS);
export const ink = (main, light, dark, white) => ({ '#': main, '+': light, k: dark, o: white });
/** A motif stamped centred in a box `size` cells wide at (x, y), each cell `s` pixels. */
export const motif = (id, x, y, colours, s = 2, size = 9) => {
  const rows = MOTIFS[id];
  stamp(rows, x + Math.floor((size - rows[0].length) * s / 2), y + Math.floor((size - rows.length) * s / 2), colours, s);
};

/* ---------- chairs and seats ---------- */
const BACKS = {
  ladder: { name: 'Ladder chair', front(x, b) { cyl(x + 5, b - 50, 4, 30, k.w); cyl(x + 23, b - 50, 4, 30, k.w); for (let r = 0; r < 3; r++) wood(x + 9, b - 48 + r * 8, 14, 4, k.w); } },
  spindle: { name: 'Spindle chair', front(x, b) { wood(x + 4, b - 52, 24, 6, k.w); for (let i = 0; i < 4; i++) cyl(x + 9 + i * 4, b - 46, 2, 22, sh(k.w, -1)); cyl(x + 4, b - 52, 4, 30, k.w); cyl(x + 24, b - 52, 4, 30, k.w); } },
  round: { name: 'Round chair', front(x, b) { disc(x + 16, b - 36, 13, sh(k.w, -1)); disc(x + 16, b - 36, 11, k.c); disc(x + 13, b - 39, 5, sh(k.c, 1)); R(x + 10, b - 43, 3, 2, sh(k.c, 2)); for (let a = 0; a < 8; a++) P(x + 16 + Math.round(Math.cos(a * 0.8) * 7), b - 36 + Math.round(Math.sin(a * 0.8) * 7), sh(k.c, -1)); } },
  heart: { name: 'Heart chair', front(x, b) { stamp(MOTIFS.heart, x + 7, b - 46, { '#': k.c, '+': sh(k.c, 1) }, 2); cyl(x + 15, b - 30, 3, 8, sh(k.w, -1)); } },
  throne: { name: 'Throne', front(x, b) { panel(x + 3, b - 76, 26, 54, k.a, 2); cushion(x + 7, b - 70, 18, 46, k.c, 4); for (let i = 0; i < 3; i++) { tri(x + 7 + i * 9, b - 84, 8, k.a, 0.5); P(x + 7 + i * 9, b - 81, '#e04848'); } sphere(x + 16, b - 64, 3, '#58a8f0'); for (const [cx, cy] of [[12, -56], [20, -56], [16, -48], [12, -40], [20, -40]]) { P(x + cx, b + cy, sh(k.c, -2)); P(x + cx - 1, b + cy - 1, sh(k.c, 1)); } } },
  ball: { name: 'Poké Ball chair', proper: true, front(x, b) { disc(x + 16, b - 37, 14, '#303038'); disc(x + 16, b - 37, 13, k.p); for (let j = -13; j < 0; j++) { const h = Math.sqrt(169 - j * j); R(Math.round(x + 16 - h), b - 37 + j, Math.round(h * 2) + 1, 1, j < -9 ? sh(k.c, 1) : k.c); } R(x + 3, b - 38, 27, 3, '#303038'); disc(x + 16, b - 37, 5, '#303038'); disc(x + 16, b - 37, 3, '#ffffff'); R(x + 9, b - 47, 4, 2, sh(k.c, 3)); } },
  slat: { name: 'Slat chair', front(x, b) { cyl(x + 4, b - 52, 4, 30, k.w); cyl(x + 24, b - 52, 4, 30, k.w); wood(x + 4, b - 52, 24, 5, k.w); for (let i = 0; i < 3; i++) wood(x + 10 + i * 5, b - 47, 3, 24, sh(k.w, i % 2 ? -1 : 0), 'y'); } },
  folding: { name: 'Folding chair', front(x, b) { cyl(x + 6, b - 48, 2, 28, k.m); cyl(x + 24, b - 48, 2, 28, k.m); cushion(x + 5, b - 50, 22, 12, k.c, 2); R(x + 8, b - 46, 16, 1, sh(k.c, -1)); } },
};
add('Seats', Object.entries(BACKS).map(([id, s]) => ({ id: `${id}chair`, name: s.name, proper: s.proper, w: 1, h: 1, price: id === 'throne' ? 900 : 200,
  draw(x, b, vw, dir) {
    floorShadow(x, b, vw);
    if (dir % 2) wood(dir === 1 ? x + 22 : x + 4, b - 48, 6, 28, k.w, 'y');
    if (dir === 0) s.front(x, b);
    cyl(x + 6, b - 16, 3, 16, sh(k.w, -1)); cyl(x + 23, b - 16, 3, 16, sh(k.w, -1)); R(x + 9, b - 8, 14, 2, sh(k.w, -1));
    wood(x + 4, b - 20, 24, 6, k.w); cushion(x + 5, b - 24, 22, 6, k.c, 2);
    if (dir === 2) s.front(x, b);
  } })));
add('Seats', [
  { id: 'barstool', name: 'Bar stool', w: 1, h: 1, price: 160, draw(x, b) {
    floorShadow(x + 4, b, 24); ovalShade(x + 16, b - 3, 9, 3, k.m);
    cyl(x + 14, b - 40, 4, 37, k.m); ovalShade(x + 16, b - 18, 8, 2, sh(k.m, 1)); R(x + 8, b - 18, 16, 1, sh(k.m, -1));
    cushion(x + 4, b - 48, 24, 9, k.c, 4);
  } },
  { id: 'stump', name: 'Log stump', w: 1, h: 1, price: 100, draw(x, b) {
    floorShadow(x, b, 32);
    cyl(x + 4, b - 24, 24, 24, sh(k.w, -1)); for (let i = 0; i < 6; i++) R(x + 6 + i * 4, b - 22 + (i % 2) * 3, 1, 18 - (i % 3) * 4, sh(k.w, -2));
    R(x + 2, b - 4, 5, 4, sh(k.w, -1)); R(x + 25, b - 5, 5, 5, sh(k.w, -1));
    oval(x + 16, b - 25, 12, 4, sh(k.w, 1)); oval(x + 16, b - 25, 9, 3, sh(k.w, 2)); oval(x + 16, b - 25, 6, 2, sh(k.w, 1)); oval(x + 16, b - 25, 3, 1, sh(k.w, 2)); P(x + 16, b - 25, sh(k.w, -1));
  } },
  { id: 'mushstool', name: 'Mushroom stool', w: 1, h: 1, price: 180, draw(x, b) {
    floorShadow(x + 4, b, 24); cyl(x + 10, b - 18, 12, 18, k.p); R(x + 10, b - 18, 12, 2, sh(k.p, -1));
    ovalShade(x + 16, b - 24, 14, 8, k.c); R(x + 2, b - 21, 28, 2, sh(k.c, -1));
    for (const [cx, cy, r] of [[9, -27, 2.5], [18, -29, 3], [24, -24, 2], [13, -22, 1.5]]) disc(x + cx, b + cy, r, k.p);
  } },
  { id: 'beanbag', name: 'Beanbag', w: 1, h: 1, price: 260, draw(x, b) {
    floorShadow(x, b, 32); ovalShade(x + 16, b - 12, 15, 12, k.c); oval(x + 18, b - 16, 7, 4, sh(k.c, -1)); oval(x + 17, b - 17, 6, 3, k.c);
    for (const [i, j] of [[8, -6], [24, -8], [14, -4]]) R(x + i, b + j, 3, 1, sh(k.c, -1));
  } },
  { id: 'pouf', name: 'Pouf', w: 1, h: 1, price: 170, draw(x, b) {
    floorShadow(x + 2, b, 28); cyl(x + 4, b - 18, 24, 17, k.c); ovalShade(x + 16, b - 18, 12, 4, sh(k.c, 1));
    for (let i = 0; i < 6; i++) R(x + 6 + i * 4, b - 11, 2, 1, k.a); R(x + 4, b - 5, 24, 1, sh(k.c, -2)); disc(x + 16, b - 18, 1.5, sh(k.c, -1));
  } },
  { id: 'bench', name: 'Bench', w: 2, h: 1, price: 380, draw(x, b, vw, dir) {
    if (dir % 2) return sideBox(x, b, vw, 22);
    floorShadow(x, b, vw); legs4(x, b, vw, 16, sh(k.w, -1)); R(x + 6, b - 8, vw - 12, 2, sh(k.w, -1));
    for (let i = 0; i < 3; i++) wood(x + 2, b - 44 + i * 7, vw - 4, 5, k.w);
    cyl(x + 3, b - 46, 4, 30, sh(k.w, -1)); cyl(x + vw - 7, b - 46, 4, 30, sh(k.w, -1));
    wood(x, b - 22, vw, 7, sh(k.w, 1));
  } },
  { id: 'rocker', name: 'Rocking chair', w: 1, h: 1, price: 420, draw(x, b) {
    floorShadow(x, b, 32);
    for (let i = 0; i < 32; i++) { const y = b - 3 - Math.round(((i - 16) * (i - 16)) / 60); R(x + i, y, 1, 3, sh(k.w, -1)); P(x + i, y, k.w); }
    cyl(x + 6, b - 18, 3, 14, sh(k.w, -1)); cyl(x + 23, b - 18, 3, 14, sh(k.w, -1));
    wood(x + 5, b - 56, 22, 6, k.w); for (let i = 0; i < 4; i++) cyl(x + 8 + i * 5, b - 50, 2, 28, sh(k.w, -1)); cyl(x + 4, b - 56, 4, 36, k.w); cyl(x + 24, b - 56, 4, 36, k.w);
    wood(x + 3, b - 24, 26, 6, k.w); cushion(x + 4, b - 28, 24, 6, k.c, 2);
  } },
]);

/* ---------- tables (flat) ---------- */
add('Tables', [
  { id: 'roundtable', name: 'Round table', w: 2, h: 2, price: 450, high: 0.55, side: 'w', flat(w, h) {
    disc(w / 2, h / 2, 31, sh(k.w, -1)); disc(w / 2, h / 2, 30, k.w);
    for (let r = 6; r < 28; r += 4) for (let a = 0; a < 60; a++) if (hash(r, a) < 0.35) P(w / 2 + Math.round(Math.cos(a / 9.5) * r), h / 2 + Math.round(Math.sin(a / 9.5) * r), sh(k.w, -1));
    disc(w / 2 - 6, h / 2 - 6, 10, sh(k.w, 1)); disc(w / 2, h / 2, 13, k.w);
    disc(w / 2, h / 2, 12, k.p); for (let a = 0; a < 24; a++) P(w / 2 + Math.round(Math.cos(a / 3.8) * 12), h / 2 + Math.round(Math.sin(a / 3.8) * 12), sh(k.p, -1));
    sphere(w / 2, h / 2, 5, k.c); foliage(w / 2 + 3, h / 2 - 5, 4, k.leaf, 2);
  } },
  { id: 'diningtable', name: 'Dining table', w: 3, h: 2, price: 700, high: 0.55, side: 'w', flat(w, h) {
    wood(0, 2, w, h - 4, k.w);
    R(8, h / 2 - 7, w - 16, 14, k.c); R(8, h / 2 - 7, w - 16, 2, sh(k.c, 1)); R(8, h / 2 + 5, w - 16, 2, sh(k.c, -1)); for (let x = 8; x < w - 8; x += 4) { P(x, h / 2 - 8, k.a); P(x + 2, h / 2 + 7, k.a); }
    for (const px of [18, 48, 78]) for (const py of [12, h - 13]) { disc(px, py, 6, sh(k.p, -1)); disc(px, py, 5, k.p); disc(px, py, 3, '#ffffff'); disc(px + 1, py, 2, py < h / 2 ? '#e88848' : '#78b848'); R(px + 8, py - 4, 1, 8, k.m); }
    cyl(w / 2 - 2, h / 2 - 5, 4, 8, k.p); disc(w / 2, h / 2 - 6, 1.5, '#f8c040');
  } },
  { id: 'coffeetable', name: 'Coffee table', w: 2, h: 1, price: 300, high: 0.35, side: 'w', flat(w, h) {
    wood(0, 2, w, h - 4, k.w); inset(4, 5, w - 8, h - 10, sh(k.w, -1)); wood(5, 6, w - 10, h - 12, k.w);
    panel(10, 9, 13, 11, k.p); R(11, 10, 11, 2, k.c); for (let i = 0; i < 3; i++) R(12, 14 + i * 2, 8, 1, sh(k.p, -2));
    disc(44, 16, 6, '#ffffff'); disc(44, 16, 5, sh(k.c, -1)); disc(44, 16, 4, '#6a3a1a'); P(42, 14, '#c89060'); R(50, 15, 3, 2, '#ffffff');
  } },
  { id: 'teatable', name: 'Tea table', w: 1, h: 1, price: 220, high: 0.5, side: 'w', flat() {
    disc(16, 16, 15, sh(k.w, -1)); disc(16, 16, 14, k.w); disc(13, 13, 7, sh(k.w, 1)); disc(16, 16, 9, k.w);
    disc(15, 15, 6, '#ffffff'); disc(15, 15, 5, sh(k.p, -1)); disc(15, 15, 3, '#a8601a'); R(21, 13, 3, 4, '#ffffff'); disc(24, 22, 3, '#ffffff'); disc(24, 22, 2, k.c);
  } },
  { id: 'glasstable', name: 'Glass table', w: 2, h: 2, price: 600, high: 0.5, side: 'm', flat(w, h) {
    panel(0, 0, w, h, k.m, 2); glass(3, 3, w - 6, h - 6, '#c8e8f4');
    for (const [px, py] of [[8, 8], [w - 12, 8], [8, h - 12], [w - 12, h - 12]]) sphere(px + 2, py + 2, 3, sh(k.m, -1));
    sphere(w / 2, h / 2, 7, k.c); leaf(w / 2 - 3, h / 2 - 9, 2, 4, k.leaf); leaf(w / 2 + 3, h / 2 - 10, 2, 4, k.leaf);
  } },
  { id: 'picnic', name: 'Picnic table', w: 2, h: 2, price: 400, high: 0.5, side: 'w', flat(w, h) {
    wood(0, 0, w, 8, k.w); wood(0, h - 8, w, 8, k.w);
    for (let y = 10; y < h - 10; y += 4) for (let x = 0; x < w; x += 4) { R(x, y, 4, 4, ((x + y) / 4) % 2 ? k.c : k.p); if (((x + y) / 4) % 2) P(x, y, sh(k.c, 1)); }
    R(0, 9, w, 1, sh(k.c, -1)); R(0, h - 10, w, 1, sh(k.c, -1));
    panel(14, 22, 18, 12, '#d8a050'); R(15, 23, 16, 2, '#f0c878'); R(20, 22, 8, 1, '#a87a3a');
    disc(42, 26, 4, '#e04848'); P(41, 24, '#f88888'); R(42, 21, 1, 2, k.leaf); disc(45, 38, 3, '#f8d030');
  } },
  { id: 'kotatsu', name: 'Kotatsu', w: 2, h: 2, price: 650, high: 0.45, side: 'c', flat(w, h) {
    R(0, 0, w, h, sh(k.c, -1)); R(2, 2, w - 4, h - 4, k.c);
    for (let i = 4; i < w - 4; i += 6) for (let j = 4; j < h - 4; j += 6) if ((i + j) % 12 === 8) { P(i, j, sh(k.c, 1)); P(i + 1, j + 1, k.a); }
    wood(10, 10, w - 20, h - 20, k.w); R(11, 11, w - 22, 2, sh(k.w, 1));
    for (const [cx, cy] of [[w / 2 - 6, h / 2 - 2], [w / 2 + 5, h / 2 + 1], [w / 2, h / 2 + 7]]) { sphere(cx, cy, 4, '#f08030'); R(cx, cy - 4, 1, 1, '#4f9a42'); }
    disc(w / 2 + 10, h / 2 - 9, 4, '#ffffff'); disc(w / 2 + 10, h / 2 - 9, 3, '#7ab858');
  } },
]);

/* ---------- beds (flat; a Pokémon naps on them) ---------- */
add('Beds', [
  { id: 'singlebed', name: 'Single bed', w: 1, h: 2, price: 450, high: 0.5, side: 'w', seat: 'bed', flat(w, h) {
    wood(0, 0, w, h, k.w); wood(1, 1, w - 2, 9, sh(k.w, -1)); R(1, 10, w - 2, 1, sh(k.w, -3));
    R(3, 11, w - 6, h - 14, k.p); cushion(5, 13, w - 10, 10, '#ffffff', 3);
    cushion(2, 27, w - 4, h - 30, k.c, 2); R(2, 27, w - 4, 4, sh(k.c, 1)); R(2, 30, w - 4, 1, sh(k.c, -1));
    for (let y = 36; y < h - 4; y += 7) R(4, y, w - 8, 1, sh(k.c, -1));
  } },
  { id: 'futon', name: 'Futon', w: 1, h: 2, price: 300, high: 0.15, side: 'p', seat: 'bed', flat(w, h) {
    cushion(0, 0, w, h, k.p, 3); cushion(4, 3, w - 8, 10, '#ffffff', 3); R(6, 7, w - 12, 1, sh(k.p, -1));
    cushion(1, 19, w - 2, h - 20, k.c, 2);
    for (let y = 24; y < h - 3; y += 8) for (let x = 5 + (y % 16 ? 4 : 0); x < w - 4; x += 8) { disc(x, y, 2, k.a); P(x - 1, y - 1, sh(k.a, 2)); }
  } },
  { id: 'sleepingbag', name: 'Sleeping bag', w: 1, h: 2, price: 200, high: 0.12, side: 'c', seat: 'bed', flat(w, h) {
    cushion(1, 1, w - 2, h - 2, k.c, 6); ovalShade(w / 2, 12, 9, 7, sh(k.c, 1)); oval(w / 2, 13, 6, 4, sh(k.c, -2));
    R(w - 7, 20, 1, h - 26, k.m); for (let y = 21; y < h - 6; y += 2) P(w - 6, y, sh(k.m, 2)); R(w - 8, 20, 3, 3, k.a);
    for (let y = 26; y < h - 6; y += 6) R(4, y, w - 12, 1, sh(k.c, -1));
  } },
  { id: 'petbed', name: 'Pet bed', w: 1, h: 1, price: 180, high: 0.2, side: 'c', seat: 'cushion', flat() {
    disc(16, 16, 15, sh(k.c, -1)); disc(16, 16, 14, k.c); disc(14, 13, 9, sh(k.c, 1)); disc(16, 17, 9, sh(k.c, -1)); disc(16, 17, 8, sh(k.c, 2));
    stamp(MOTIFS.paw, 12, 13, { '#': sh(k.c, 1) }, 1);
  } },
  { id: 'royalbed', name: 'Royal bed', w: 2, h: 3, price: 1400, high: 0.55, side: 'a', seat: 'bed', flat(w, h) {
    panel(0, 0, w, h, k.a, 2); panel(3, 3, w - 6, 12, sh(k.a, -1)); for (let x = 10; x < w - 8; x += 8) sphere(x, 9, 2, k.a);
    R(4, 15, w - 8, h - 19, k.p);
    cushion(7, 17, 23, 14, '#ffffff', 4); cushion(34, 17, 23, 14, '#ffffff', 4); R(10, 20, 6, 1, sh(k.c, 1)); R(37, 20, 6, 1, sh(k.c, 1));
    cushion(4, 36, w - 8, h - 40, k.c, 3); R(4, 36, w - 8, 6, sh(k.c, 1)); R(4, 42, w - 8, 2, k.a); R(4, h - 9, w - 8, 2, k.a);
    for (let y = 50; y < h - 12; y += 10) for (let x = 12; x < w - 8; x += 10) { R(x - 1, y, 3, 1, k.a); R(x, y - 1, 1, 3, k.a); P(x, y, sh(k.a, 2)); }
    for (const [px, py] of [[1, 1], [w - 7, 1], [1, h - 7], [w - 7, h - 7]]) sphere(px + 3, py + 3, 3, sh(k.a, 1));
  } },
]);

/* ---------- cushions and mats with a motif ---------- */
add('Cushions', MOTIF_IDS.filter(m => m !== 'ball').map(m => ({ set: 'cushion', id: `${m}cushion`, name: `${MOTIF_NAME[m]} cushion`, w: 1, h: 1, price: 170,
  high: 0.22, side: 'c', seat: 'cushion', flat() {
    cushion(1, 1, 30, 30, k.c, 6); R(4, 4, 24, 1, sh(k.c, 2));
    for (let i = 4; i < 28; i += 3) { P(i, 2, sh(k.c, -1)); P(i, 29, sh(k.c, -1)); P(2, i, sh(k.c, -1)); P(29, i, sh(k.c, -1)); }
    motif(m, 7, 7, ink(k.a, sh(k.a, 2), sh(k.a, -2), k.p));
  } })));
add('Rugs', MOTIF_IDS.map(m => ({ set: 'mat', id: `${m}mat`, name: `${MOTIF_NAME[m]} mat`, proper: m === 'ball', w: 2, h: 2, layer: 'rug', price: 300, high: 0.04, side: 'c',
  flat(w, h) {
    R(0, 0, w, h, sh(k.c, -1)); R(2, 2, w - 4, h - 4, k.c);
    R(5, 5, w - 10, 2, k.a); R(5, h - 7, w - 10, 2, k.a); R(5, 5, 2, h - 10, k.a); R(w - 7, 5, 2, h - 10, k.a);
    for (let x = 1; x < w; x += 3) { R(x, 0, 1, 2, k.p); R(x, h - 2, 1, 2, k.p); }
    speckle(8, 8, w - 16, h - 16, sh(k.c, -1), 5, 0.07);
    motif(m, 5, 5, ink(k.a, k.p, sh(k.a, -2), k.p), 6, 9);
  } })));

/* ---------- patterned rugs and runners ---------- */
const PATTERNS = {
  stripe: { name: 'Striped', at: (i) => (i >> 3) % 2 },
  check: { name: 'Checked', at: (i, j) => ((i >> 3) + (j >> 3)) % 2 },
  polka: { name: 'Polka-dot', at: (i, j) => (Math.hypot((i % 12) - 6, (j % 12) - 6) < 3 ? 2 : 0) },
  zigzag: { name: 'Zigzag', at: (i, j) => ((j + Math.abs((i % 16) - 8)) >> 3) % 2 },
  plaid: { name: 'Plaid', at: (i, j) => (i % 16 < 4 && j % 16 < 4 ? 3 : i % 16 < 4 || j % 16 < 4 ? 1 : (i % 16 === 9 || j % 16 === 9) ? 2 : 0) },
  wave: { name: 'Wave', at: (i, j) => ((j + Math.round(3 * Math.sin(i / 4)) + 16) >> 3) % 2 },
  argyle: { name: 'Diamond', at: (i, j) => (Math.abs((i % 16) - 8) + Math.abs((j % 16) - 8) < 6 ? 2 : 0) },
  rings: { name: 'Ring', at: (i, j, w, h) => (Math.floor(Math.hypot((i - w / 2) * 0.75, j - h / 2)) >> 3) % 2 },
};
const weave = (w, h, at, round) => {
  const ins = (i, j) => !round || Math.hypot((i + 0.5 - w / 2) / (w / 2), (j + 0.5 - h / 2) / (h / 2)) < 1;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    if (!ins(i, j)) continue;
    const edge = !ins(i - 3, j) || !ins(i + 3, j) || !ins(i, j - 3) || !ins(i, j + 3) || (!round && (i < 3 || j < 3 || i >= w - 3 || j >= h - 3));
    let c = edge ? sh(k.c, -1) : [k.c, sh(k.c, 1), k.a, sh(k.c, -1)][at(i, j, w, h)];
    if (!edge && (i + j * 3) % 7 === 0) c = sh(c, -1);   // the weave
    P(i, j, c);
  }
};
add('Rugs', Object.entries(PATTERNS).map(([id, p]) => ({ set: 'rug', id: `${id}rug`, name: `${p.name} rug`, w: 3, h: 2, layer: 'rug', price: 380, high: 0.04, side: 'c',
  flat(w, h) { weave(w, h, p.at, true); } })));
add('Rugs', ['stripe', 'check', 'zigzag', 'wave'].map(id => ({ set: 'runner', id: `${id}runner`, name: `${PATTERNS[id].name} runner`, w: 3, h: 1, layer: 'rug', price: 220, high: 0.04, side: 'c',
  flat(w, h) { weave(w, h, PATTERNS[id].at, false); for (let y = 2; y < h - 1; y += 3) { R(0, y, 2, 1, k.p); R(w - 2, y, 2, 1, k.p); } } })));

/* ---------- wall: posters, banners, pictures ---------- */
add('Wall', MOTIF_IDS.map(m => ({ set: 'poster', id: `${m}poster`, name: `${MOTIF_NAME[m]} poster`, proper: m === 'ball', w: 1, h: 1, layer: 'wall', price: 120, wall(x) {
  shadowWall(x + 4, 18, 24, 40); panel(x + 4, 18, 24, 40, k.p);
  for (let j = 0; j < 22; j++) R(x + 7, 21 + j, 18, 1, j < 11 ? sh(k.c, 1) : k.c);
  motif(m, x + 7, 23, ink(k.p, '#ffffff', sh(k.c, -2), '#ffffff'));
  R(x + 8, 46, 16, 2, sh(k.p, -2)); R(x + 8, 50, 11, 1, sh(k.p, -1)); R(x + 8, 53, 13, 1, sh(k.p, -1));
  disc(x + 16, 19, 1.5, k.m); P(x + 15, 18, sh(k.m, 2));
} })));
add('Wall', MOTIF_IDS.map(m => ({ set: 'banner', id: `${m}banner`, name: `${MOTIF_NAME[m]} banner`, proper: m === 'ball', w: 1, h: 1, layer: 'wall', price: 140, wall(x) {
  for (let j = 0; j < 54; j++) {
    const half = j < 38 ? 12 : Math.max(0, 12 - Math.round((j - 37) * 0.75));
    if (half <= 0) continue;
    R(x + 16 - half, 16 + j, half * 2, 1, j % 18 === 0 ? sh(k.c, 1) : k.c);
    P(x + 16 - half, 16 + j, sh(k.c, 1)); P(x + 15 + half, 16 + j, sh(k.c, -1));
  }
  R(x + 4, 18, 24, 2, k.a); R(x + 4, 50, 24, 2, k.a);
  motif(m, x + 7, 25, ink(k.a, sh(k.a, 2), sh(k.a, -2), k.p));
  cyl(x + 1, 13, 30, 4, sh(k.w, -1)); sphere(x + 2, 15, 2.5, k.a); sphere(x + 30, 15, 2.5, k.a);
  R(x + 15, 6, 2, 8, sh(k.m, 1)); P(x + 15, 5, k.m);
} })));

const SCENES = {
  mountain: { name: 'Mountain picture', paint(x, y, w, h) {
    for (let j = 0; j < h; j++) R(x, y + j, w, 1, j < h / 3 ? '#78b8f0' : '#a8d8f8');
    for (const [cx, top, c] of [[x + 14, y + 10, '#7a8494'], [x + 34, y + 5, '#8a94a4']]) { tri(cx, top, h - 12, c, 0.9); tri(cx, top, 7, '#ffffff', 0.9); for (let j = 7; j < h - 14; j += 2) P(cx + Math.round(j * 0.4), top + j, sh(c, -1)); }
    R(x, y + h - 9, w, 9, '#5aa048'); R(x, y + h - 9, w, 1, '#78c060'); for (let i = 0; i < w; i += 5) tri(x + i + 2, y + h - 14, 6, '#2f6a32', 0.5);
  } },
  sea: { name: 'Seaside picture', paint(x, y, w, h) {
    R(x, y, w, h, '#a8d8f8'); sphere(x + w - 10, y + 9, 5, '#f8e070'); R(x, y + 20, w, h - 20, '#3a7ac8');
    for (let j = y + 22; j < y + h - 7; j += 4) for (let i = (j % 8) * 2; i < w - 4; i += 10) R(x + i, j, 5, 1, '#8ac8f0');
    R(x, y + h - 7, w, 7, '#f0dca0'); R(x, y + h - 7, w, 1, '#ffffff'); tri(x + 10, y + 12, 8, '#ffffff', 0.4);
  } },
  forest: { name: 'Forest picture', paint(x, y, w, h) {
    R(x, y, w, h, '#b8e0f0'); R(x, y + h - 7, w, 7, '#4a8a3a');
    for (const [cx, t, c] of [[6, 12, '#3a7a3a'], [16, 5, '#2f6a32'], [28, 9, '#3a7a3a'], [40, 4, '#2f6a32'], [48, 14, '#4a8a3a']]) { tri(x + cx, y + t, h - t - 8, c, 0.42); tri(x + cx, y + t, 4, sh(c, 1), 0.42); R(x + cx - 1, y + h - 8, 3, 3, '#6a4426'); }
  } },
  night: { name: 'Night sky picture', paint(x, y, w, h) {
    for (let j = 0; j < h; j++) R(x, y + j, w, 1, j < h / 2 ? '#141c3a' : '#1e2a50');
    disc(x + 36, y + 12, 7, '#f4f0c8'); disc(x + 39, y + 10, 6, '#141c3a');
    for (let i = 0; i < 26; i++) P(x + Math.floor(hash(i, 3) * w), y + Math.floor(hash(i, 7) * (h - 10)), i % 5 ? '#c8d0f8' : '#ffffff');
    R(x, y + h - 7, w, 7, '#0e1428'); tri(x + 14, y + h - 14, 7, '#0e1428', 1);
  } },
  volcano: { name: 'Volcano picture', paint(x, y, w, h) {
    for (let j = 0; j < h; j++) R(x, y + j, w, 1, j < 8 ? '#e07048' : j < 16 ? '#f09058' : '#f0b070');
    tri(x + w / 2, y + 12, h - 12, '#5a3a3a', 1.1); tri(x + w / 2, y + 12, h - 12, '#4a2e2e', 0.5);
    R(x + w / 2 - 4, y + 12, 9, 3, '#f84830'); for (let j = 0; j < 14; j++) P(x + w / 2 + Math.round(Math.sin(j) * 2), y + 15 + j, j % 2 ? '#f88030' : '#f8d030');
    oval(x + w / 2 - 2, y + 6, 8, 4, '#8a7a7a'); oval(x + w / 2 + 4, y + 3, 6, 3, '#9a8a8a');
  } },
  desert: { name: 'Desert picture', paint(x, y, w, h) {
    R(x, y, w, h, '#f8e8b8'); sphere(x + 10, y + 10, 5, '#f8c040');
    oval(x + 14, y + h + 2, 26, 14, '#e8c070'); oval(x + 44, y + h + 3, 22, 12, '#d8a858'); for (let i = 0; i < 12; i++) P(x + Math.floor(hash(i) * w), y + h - 2 - Math.floor(hash(i, 2) * 8), '#c89848');
    cyl(x + 38, y + 14, 4, 16, '#4f9a42'); cyl(x + 33, y + 18, 3, 7, '#4f9a42'); R(x + 33, y + 24, 6, 2, '#4f9a42'); cyl(x + 43, y + 16, 3, 7, '#4f9a42'); R(x + 41, y + 21, 4, 2, '#4f9a42');
  } },
  city: { name: 'City picture', paint(x, y, w, h) {
    for (let j = 0; j < h; j++) R(x, y + j, w, 1, j < h / 2 ? '#3a3a6a' : '#5a4a7a');
    for (const [i, t, bw] of [[2, 16, 10], [13, 7, 12], [27, 20, 8], [36, 11, 12], [49, 18, 6]]) {
      R(x + i, y + t, bw, h - t, '#1a1a30'); R(x + i, y + t, 1, h - t, '#2a2a48');
      for (let j = t + 3; j < h - 2; j += 4) for (let c = 2; c < bw - 1; c += 3) if (hash(i, j, c) < 0.6) R(x + i + c, y + j, 1, 2, '#f8d870');
    }
  } },
  sunset: { name: 'Sunset picture', paint(x, y, w, h) {
    ['#f8c070', '#f8a060', '#f08058', '#e06868', '#c8586a'].forEach((c, i) => R(x, y + i * 4, w, 4, c));
    disc(x + w / 2, y + 20, 8, '#f8e070'); R(x, y + 20, w, h - 20, '#3a3060');
    for (let j = 22; j < h; j += 2) R(x + w / 2 - (j - 18), y + j, (j - 18) * 2, 1, j % 4 ? '#e8a860' : '#c88050');
  } },
};
add('Wall', Object.entries(SCENES).map(([id, s]) => ({ set: 'pic', id: `${id}pic`, name: s.name, w: 2, h: 1, layer: 'wall', price: 380, wall(x) {
  shadowWall(x + 4, 16, 56, 52); panel(x + 4, 16, 56, 52, k.w, 2); R(x + 6, 18, 52, 1, sh(k.w, 2)); inset(x + 8, 20, 48, 44, sh(k.w, -2));
  clipped(x + 9, 21, 46, 42, () => s.paint(x + 9, 21, 46, 42));
  R(x + 9, 21, 46, 1, 'rgba(0,0,0,0.25)');
} })));

/* ---------- wall: clocks, windows and the rest ---------- */
add('Wall', [
  { id: 'cuckoo', name: 'Cuckoo clock', w: 1, h: 1, layer: 'wall', price: 300, wall(x) {
    tri(x + 16, 10, 12, sh(k.w, -1), 1.2); tri(x + 16, 12, 9, k.w, 1.1);
    wood(x + 5, 21, 22, 24, k.w); R(x + 13, 22, 6, 5, '#2a1a10'); R(x + 14, 24, 3, 3, k.a); P(x + 13, 24, '#f8a030');
    disc(x + 16, 35, 6, sh(k.p, -1)); disc(x + 16, 35, 5, k.p); R(x + 16, 31, 1, 5, '#303038'); R(x + 16, 35, 4, 1, '#303038');
    for (const lx of [7, 23]) leaf(x + lx, 44, 3, 2, k.leaf);
    R(x + 11, 45, 1, 14, k.m); R(x + 20, 45, 1, 10, k.m); cyl(x + 9, 59, 5, 8, k.a); cyl(x + 18, 55, 5, 8, k.a);
  } },
  { id: 'wallshelf', name: 'Wall shelf', w: 2, h: 1, layer: 'wall', price: 260, wall(x) {
    wood(x + 2, 48, 60, 5, k.w); R(x + 2, 53, 60, 1, 'rgba(0,0,0,0.25)'); for (const bx of [8, 52]) wood(x + bx, 53, 4, 8, sh(k.w, -1), 'y');
    books(x + 5, x + 24, 48, 2, 18);
    cyl(x + 30, 38, 10, 10, k.pot); foliage(x + 35, 33, 6, k.leaf, 9);
    sphere(x + 50, 43, 5, k.a); R(x + 45, 47, 10, 1, sh(k.a, -2));
  } },
  { id: 'mirror', name: 'Mirror', w: 1, h: 1, layer: 'wall', price: 280, wall(x) {
    oval(x + 16, 40, 12, 22, sh(k.w, -1)); oval(x + 16, 40, 11, 21, k.w); oval(x + 15, 39, 9, 19, sh(k.w, 1));
    oval(x + 16, 40, 8, 18, '#c8e4f0'); oval(x + 15, 34, 6, 10, '#d8eef8');
    for (let i = 0; i < 14; i++) P(x + 11 + Math.floor(i / 3), 30 + i, '#ffffff'); for (let i = 0; i < 8; i++) P(x + 15 + Math.floor(i / 3), 30 + i, '#ffffff');
    sphere(x + 16, 18, 2.5, k.a);
  } },
  { id: 'wreath', name: 'Wreath', w: 1, h: 1, layer: 'wall', price: 200, wall(x) {
    for (let a = 0; a < 26; a++) { const ang = a / 26 * Math.PI * 2; leaf(Math.round(x + 16 + Math.cos(ang) * 10), Math.round(38 + Math.sin(ang) * 10), 3, 2, a % 2 ? k.leaf : sh(k.leaf, -1)); }
    for (const a of [0.3, 1.4, 2.4, 3.6, 4.7, 5.6]) sphere(Math.round(x + 16 + Math.cos(a) * 10), Math.round(38 + Math.sin(a) * 10), 2, k.c);
    ovalShade(x + 11, 50, 4, 3, k.a); ovalShade(x + 21, 50, 4, 3, k.a); R(x + 14, 48, 4, 5, sh(k.a, -1)); R(x + 13, 53, 2, 8, k.a); R(x + 18, 53, 2, 8, k.a);
  } },
  { id: 'sconce', name: 'Wall lamp', w: 1, h: 1, layer: 'wall', price: 260, glow: ['g', 'gl'], wall(x) {
    panel(x + 12, 46, 8, 14, k.m); cyl(x + 15, 36, 3, 10, k.m); R(x + 12, 44, 8, 2, sh(k.m, 1));
    for (let j = 0; j < 16; j++) { const half = 6 + Math.floor(j * 0.35); R(x + 16 - half, 20 + j, half * 2, 1, j < 3 ? k.gl : k.g); }
    R(x + 10, 20, 12, 1, sh(k.g, -1)); R(x + 9, 35, 14, 2, sh(k.a, -1)); R(x + 11, 23, 2, 10, k.gl);
  } },
  { id: 'dartboard', name: 'Dartboard', w: 1, h: 1, layer: 'wall', price: 180, wall(x) {
    disc(x + 16, 38, 14, '#202028'); disc(x + 16, 38, 13, '#e8d8b0');
    for (let a = 0; a < 20; a += 2) for (let r = 3; r < 13; r++) P(Math.round(x + 16 + Math.cos(a / 20 * Math.PI * 2) * r), Math.round(38 + Math.sin(a / 20 * Math.PI * 2) * r), '#202028');
    for (let a = 0; a < 80; a++) for (const r of [12, 7]) P(Math.round(x + 16 + Math.cos(a / 80 * Math.PI * 2) * r), Math.round(38 + Math.sin(a / 80 * Math.PI * 2) * r), a % 8 < 4 ? k.c : '#3a8a4a');
    disc(x + 16, 38, 2, k.c); P(x + 16, 38, '#3a8a4a');
    R(x + 19, 32, 7, 1, k.m); R(x + 25, 30, 2, 2, k.a); R(x + 25, 33, 2, 2, k.a);
  } },
  { id: 'calendar', name: 'Calendar', w: 1, h: 1, layer: 'wall', price: 100, wall(x) {
    disc(x + 16, 15, 1.5, k.m); R(x + 15, 16, 2, 4, sh(k.m, -1));
    shadowWall(x + 6, 20, 20, 36); panel(x + 6, 20, 20, 36, k.p); R(x + 7, 21, 18, 10, k.c); R(x + 7, 21, 18, 2, sh(k.c, 1)); motif('sun', x + 12, 22, ink('#f8d070', '#ffffff', sh(k.c, -1), '#ffffff'), 1);
    for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) R(x + 8 + i * 3, 34 + j * 4, 2, 2, (i + j * 5) === 12 ? k.c : sh(k.p, -2));
    R(x + 7, 33, 18, 1, sh(k.p, -1));
  } },
  { id: 'worldmap', name: 'Region map', w: 2, h: 1, layer: 'wall', price: 340, wall(x) {
    shadowWall(x + 4, 20, 56, 40); panel(x + 4, 20, 56, 40, '#f0e4c0'); inset(x + 6, 22, 52, 36, '#7ab8e8');
    for (let i = 0; i < 40; i++) P(x + 7 + Math.floor(hash(i, 4) * 50), 23 + Math.floor(hash(i, 9) * 34), '#8ac8f0');
    oval(x + 20, 38, 11, 9, '#e0c888'); oval(x + 20, 38, 10, 8, '#7ab860'); oval(x + 42, 34, 9, 7, '#e0c888'); oval(x + 42, 34, 8, 6, '#7ab860'); oval(x + 44, 50, 5, 3, '#c8b070');
    tri(x + 18, 32, 5, '#8a7a6a', 0.8); tri(x + 44, 30, 4, '#8a7a6a', 0.8); disc(x + 23, 41, 2, '#e04848');
    for (let i = 0; i < 10; i++) P(x + 25 + i * 2, 40 - Math.round(i * 0.5) + (i % 2), '#a04030');
    R(x + 52, 24, 4, 4, '#e8e0c8'); P(x + 54, 24, '#e04848');
  } },
  { id: 'mask', name: 'Wooden mask', w: 1, h: 1, layer: 'wall', price: 220, wall(x) {
    ovalShade(x + 16, 38, 10, 18, k.w); for (let j = 22; j < 54; j += 4) R(x + 9, j, 14, 1, sh(k.w, -1));
    oval(x + 11, 33, 3, 2, '#202028'); oval(x + 21, 33, 3, 2, '#202028'); P(x + 10, 32, k.a); P(x + 20, 32, k.a);
    R(x + 15, 36, 3, 8, sh(k.w, 1)); R(x + 15, 44, 3, 1, sh(k.w, -2)); R(x + 11, 48, 10, 3, k.c); for (let i = 0; i < 4; i++) R(x + 12 + i * 2, 48, 1, 3, '#ffffff');
    for (const [cx, cy] of [[6, 24], [26, 24], [16, 18]]) tri(x + cx, cy - 6, 6, k.a, 0.5);
    R(x + 7, 39, 3, 1, k.c); R(x + 22, 39, 3, 1, k.c);
  } },
  { id: 'corkboard', name: 'Notice board', w: 2, h: 1, layer: 'wall', price: 240, wall(x) {
    shadowWall(x + 4, 18, 56, 44); wood(x + 4, 18, 56, 44, k.w); inset(x + 7, 21, 50, 38, '#c8925a'); speckle(x + 8, 22, 48, 36, '#a87440', 6, 0.18);
    for (const [i, j, c, w2, h2] of [[10, 25, k.p, 14, 12], [27, 27, '#f8e078', 11, 11], [41, 24, sh(k.c, 1), 12, 14], [12, 41, '#a8d8f0', 13, 13], [30, 43, k.p, 14, 11], [46, 42, '#c8f0a8', 9, 10]]) {
      R(x + i + 1, j + 1, w2, h2, 'rgba(0,0,0,0.2)'); panel(x + i, j, w2, h2, c); for (let l = 4; l < h2 - 2; l += 3) R(x + i + 2, j + l, w2 - 5, 1, sh(c, -2)); sphere(x + i + w2 / 2, j + 1, 1.5, k.c);
    }
  } },
  { id: 'hangplant', name: 'Hanging plant', w: 1, h: 1, layer: 'wall', price: 210, wall(x) {
    R(x + 15, 6, 2, 3, k.m); for (let j = 0; j < 20; j++) { P(x + 15 - Math.round(j * 0.35), 9 + j, sh(k.m, 1)); P(x + 16 + Math.round(j * 0.35), 9 + j, sh(k.m, 1)); }
    ovalShade(x + 16, 32, 10, 6, k.pot); R(x + 6, 28, 20, 3, sh(k.pot, 1));
    for (const [i, l] of [[6, 22], [10, 30], [16, 26], [21, 32], [26, 20]]) for (let j = 0; j < l; j += 3) leaf(x + i + (j % 6 ? 1 : -1), 34 + j, 2, 2, j % 6 ? k.leaf : sh(k.leaf, -1));
    foliage(x + 16, 26, 7, k.leaf, 11);
  } },
  { id: 'curtains', name: 'Curtained window', w: 2, h: 1, layer: 'wall', price: 600, sky: true, wall(x) {
    wood(x + 8, 18, 48, 52, k.w); view(x + 11, 21, 42, 46); wood(x + 30, 21, 4, 46, k.w, 'y'); wood(x + 11, 42, 42, 3, k.w);
    cyl(x + 2, 12, 60, 4, k.m); sphere(x + 2, 14, 3, k.a); sphere(x + 61, 14, 3, k.a);
    for (const [sx, dir] of [[2, 1], [48, -1]]) {
      for (let i = 0; i < 14; i++) { const sway = dir > 0 ? Math.round((i / 14) * 3) : Math.round(((13 - i) / 14) * 3); R(x + sx + i, 16, 1, 58 - sway * 2, i % 4 === 0 ? sh(k.c, 1) : i % 4 < 2 ? k.c : sh(k.c, -1)); }
      R(x + sx, 50, 14, 3, k.a); R(x + sx, 50, 14, 1, sh(k.a, 2));
    }
    R(x + 6, 72, 52, 4, sh(k.w, 1));
  } },
  { id: 'roundwindow', name: 'Round window', w: 1, h: 1, layer: 'wall', price: 380, sky: true, wall(x) {
    view(x + 3, 25, 27, 27);
    frameAround(x + 2, 24, 29, 29, (i, j) => Math.hypot(i + 0.5 - x - 16.5, j + 0.5 - 38.5) < 10.5, (i, j) => Math.hypot(i + 0.5 - x - 16.5, j + 0.5 - 38.5) < 14);
    R(x + 15, 28, 3, 21, k.w); R(x + 6, 37, 21, 3, k.w); R(x + 15, 28, 1, 21, sh(k.w, 1));
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; sphere(Math.round(x + 16.5 + Math.cos(a) * 12), Math.round(38.5 + Math.sin(a) * 12), 1.5, k.a); }
  } },
  { id: 'smallwindow', name: 'Small window', w: 1, h: 1, layer: 'wall', price: 300, sky: true, wall(x) {
    wood(x + 3, 18, 26, 46, k.w); view(x + 6, 21, 20, 40); wood(x + 15, 21, 2, 40, k.w, 'y'); wood(x + 6, 40, 20, 3, k.w);
    R(x + 6, 21, 20, 1, sh(k.w, -2)); wood(x + 1, 64, 30, 5, sh(k.w, 1)); cyl(x + 11, 58, 10, 6, k.pot); foliage(x + 16, 55, 4, k.leaf, 2);
  } },
  { id: 'archwindow', name: 'Arched window', w: 2, h: 1, layer: 'wall', price: 700, sky: true, wall(x) {
    view(x + 13, 13, 38, 56);
    const inside = (i, j) => j >= 32 ? i >= x + 14 && i < x + 50 && j < 68 : Math.hypot(i + 0.5 - x - 32, j + 0.5 - 32) < 18;
    const outer = (i, j) => j >= 32 ? i >= x + 10 && i < x + 54 && j < 71 : Math.hypot(i + 0.5 - x - 32, j + 0.5 - 32) < 22;
    frameAround(x + 9, 9, 46, 63, inside, outer);
    wood(x + 31, 14, 3, 54, k.w, 'y'); wood(x + 14, 40, 36, 3, k.w);
    for (let a = 0; a <= 12; a++) P(Math.round(x + 32 + Math.cos(Math.PI + a / 12 * Math.PI) * 10), Math.round(32 + Math.sin(Math.PI + a / 12 * Math.PI) * 10), k.w);
    wood(x + 8, 70, 48, 5, sh(k.w, 1)); sphere(x + 32, 11, 3, k.a);
  } },
]);

/* ---------- plants ---------- */
add('Plants', [
  { id: 'fern', name: 'Fern', w: 1, h: 1, price: 180, draw(x, b) {
    floorShadow(x + 4, b, 24); const t = potAt(x, b);
    for (const [ang, len] of [[-1.15, 18], [-0.7, 22], [-0.25, 26], [0.25, 25], [0.7, 22], [1.15, 18], [-0.45, 16], [0.45, 16]]) {
      for (let i = 0; i < len; i++) {
        const px = x + 16 + Math.round(Math.sin(ang) * i + Math.sin(ang) * i * i / 50), py = t - Math.round(Math.cos(ang) * i) + Math.round(i * i / 40);
        P(px, py, sh(k.leaf, -1));
        if (i > 2 && i % 2 === 0) { const s = Math.max(1, 4 - Math.floor(i / 7)); R(px - s, py, s, 1, k.leaf); R(px + 1, py, s, 1, sh(k.leaf, 1)); }
      }
    }
  } },
  { id: 'cactus', name: 'Cactus', w: 1, h: 1, price: 150, draw(x, b) {
    floorShadow(x + 4, b, 24); const t = potAt(x, b, 'square');
    const arm = (ax, ay, w, h) => { cyl(ax, ay, w, h, k.leaf); disc(ax + w / 2, ay, w / 2, k.leaf); for (let j = ay; j < ay + h; j += 3) P(ax + Math.floor(w / 2), j, sh(k.leaf, 2)); };
    arm(x + 12, t - 28, 9, 28); arm(x + 5, t - 20, 5, 9); R(x + 7, t - 12, 6, 4, k.leaf); arm(x + 22, t - 24, 5, 10); R(x + 20, t - 15, 4, 4, k.leaf);
    for (let i = 0; i < 12; i++) P(x + 12 + Math.floor(hash(i) * 9), t - 4 - Math.floor(hash(i, 3) * 26), '#f4f0d0');
    for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2]]) P(x + 16 + dx, t - 33 + dy, k.c); P(x + 16, t - 33, '#f8e070');
  } },
  { id: 'tulips', name: 'Tulips', w: 1, h: 1, price: 170, draw(x, b) {
    floorShadow(x + 4, b, 24); const t = potAt(x, b);
    for (const [dx, h, c] of [[9, 22, k.c], [16, 28, sh(k.c, 1)], [23, 20, k.a]]) {
      R(x + dx, t - h, 2, h, sh(k.leaf, -1));
      ovalShade(x + dx + 1, t - h - 4, 4, 5, c); R(x + dx - 3, t - h - 9, 2, 4, c); R(x + dx + 4, t - h - 9, 2, 4, c); R(x + dx, t - h - 10, 2, 4, sh(c, 1));
    }
    leaf(x + 8, t - 9, 3, 8, k.leaf, -0.4); leaf(x + 25, t - 10, 3, 9, k.leaf, 0.4);
  } },
  { id: 'sunflower', name: 'Sunflower', w: 1, h: 1, price: 200, draw(x, b) {
    floorShadow(x + 4, b, 24); const t = potAt(x, b);
    cyl(x + 15, t - 44, 3, 44, sh(k.leaf, -1)); leaf(x + 9, t - 18, 5, 3, k.leaf, -0.3); leaf(x + 23, t - 28, 5, 3, k.leaf, 0.3);
    for (let a = 0; a < 16; a++) { const ang = a / 16 * Math.PI * 2; leaf(Math.round(x + 16 + Math.cos(ang) * 9), Math.round(t - 54 + Math.sin(ang) * 9), 2, 3, a % 2 ? '#f8c830' : '#f0b020'); }
    disc(x + 16, t - 54, 6, '#6a3a18'); for (let i = 0; i < 18; i++) P(x + 12 + Math.floor(hash(i) * 9), t - 58 + Math.floor(hash(i, 2) * 9), i % 2 ? '#8a5a28' : '#4a2810');
  } },
  { id: 'rosebush', name: 'Rose bush', w: 1, h: 1, price: 260, draw(x, b) {
    floorShadow(x + 2, b, 28); const t = potAt(x, b, 'square'); foliage(x + 16, t - 13, 13, k.leaf, 5);
    for (const [i, j] of [[8, -18], [20, -22], [16, -10], [25, -12], [10, -8], [14, -24]]) { disc(x + i, t + j, 2.5, sh(k.c, -1)); disc(x + i - 0.5, t + j - 0.5, 1.8, k.c); P(x + i - 1, t + j - 1, sh(k.c, 2)); P(x + i, t + j, sh(k.c, -2)); }
  } },
  { id: 'bonsai', name: 'Bonsai', w: 1, h: 1, price: 380, draw(x, b) {
    floorShadow(x + 2, b, 28); const t = potAt(x, b, 'tray');
    for (let j = 0; j < 18; j++) { const off = Math.round(Math.sin(j / 4) * 3); R(x + 14 + off, t - j, 4 - Math.floor(j / 8), 1, j % 3 ? k.w : sh(k.w, -1)); }
    R(x + 8, t - 16, 8, 2, k.w); R(x + 18, t - 20, 7, 2, k.w); R(x + 14, t - 26, 2, 8, k.w);
    foliage(x + 8, t - 20, 6, k.leaf, 1); foliage(x + 24, t - 24, 7, k.leaf, 2); foliage(x + 15, t - 31, 6, k.leaf, 3);
    for (let i = 0; i < 6; i++) P(x + 4 + i * 4, t - 2, '#78a858');
  } },
  { id: 'bamboo', name: 'Bamboo', w: 1, h: 1, price: 240, draw(x, b) {
    floorShadow(x + 4, b, 24); const t = potAt(x, b, 'square');
    for (const [dx, h] of [[10, 52], [16, 62], [22, 46]]) {
      cyl(x + dx, t - h, 4, h, k.leaf); for (let j = 8; j < h; j += 11) { R(x + dx - 1, t - j, 6, 2, sh(k.leaf, -1)); R(x + dx - 1, t - j - 1, 6, 1, sh(k.leaf, 1)); }
      leaf(x + dx + 6, t - h + 6, 4, 2, sh(k.leaf, 1), 0.5); leaf(x + dx - 4, t - h + 14, 4, 2, k.leaf, -0.5);
    }
  } },
  { id: 'succulent', name: 'Succulent', w: 1, h: 1, price: 140, draw(x, b) {
    floorShadow(x + 4, b, 24); const t = potAt(x, b, 'square');
    for (const [dx, dy, rx, ry] of [[-8, -3, 5, 3], [8, -3, 5, 3], [-5, -7, 4, 4], [5, -7, 4, 4], [0, -10, 4, 5], [0, -4, 6, 3]]) {
      ovalShade(x + 16 + dx, t + dy, rx, ry, sh(k.leaf, 1)); P(x + 16 + dx, t + dy - ry + 1, sh(k.c, 1));
    }
    disc(x + 16, t - 13, 2, k.c);
  } },
  { id: 'mushpot', name: 'Mushroom pot', w: 1, h: 1, price: 160, draw(x, b) {
    floorShadow(x + 4, b, 24); const t = potAt(x, b);
    for (const [cx, h, r] of [[11, 10, 5], [21, 15, 7], [16, 6, 3]]) {
      cyl(x + cx - 2, t - h, 4, h, '#f4f0e0'); ovalShade(x + cx, t - h - 1, r, r * 0.7, '#d84848'); R(x + cx - r, t - h, r * 2, 1, '#a82828');
      for (let i = 0; i < r; i++) P(x + cx - r + 2 + Math.floor(hash(i, cx) * (r * 2 - 3)), t - h - 1 - Math.floor(hash(cx, i) * r * 0.6), '#ffffff');
    }
  } },
  { id: 'saguaro', name: 'Tall cactus', w: 1, h: 1, price: 320, draw(x, b) {
    floorShadow(x + 4, b, 24); const t = potAt(x, b, 'square');
    const arm = (ax, ay, w, h) => { cyl(ax, ay, w, h, k.leaf); disc(ax + w / 2 - 0.5, ay, w / 2, k.leaf); for (let j = ay + 1; j < ay + h; j += 2) P(ax + 2, j, sh(k.leaf, 1)); };
    arm(x + 12, t - 62, 9, 62); arm(x + 3, t - 42, 6, 18); R(x + 5, t - 27, 9, 5, k.leaf); arm(x + 24, t - 50, 6, 16); R(x + 19, t - 37, 8, 5, k.leaf);
    for (let i = 0; i < 18; i++) P(x + 12 + Math.floor(hash(i, 5) * 9), t - 4 - Math.floor(hash(i, 6) * 56), '#f4f0d0');
  } },
  { id: 'pine', name: 'Potted pine', w: 1, h: 1, price: 340, draw(x, b) {
    floorShadow(x + 2, b, 28); const t = potAt(x, b); cyl(x + 14, t - 8, 4, 8, k.w);
    for (const [top, h, half] of [[t - 30, 22, 0.62], [t - 46, 20, 0.52], [t - 60, 17, 0.42]]) {
      tri(x + 16, top, h, sh(k.leaf, -2), half); tri(x + 16, top + 1, h - 3, sh(k.leaf, -1), half * 0.9); tri(x + 15, top + 2, h - 8, k.leaf, half * 0.6);
      for (let i = 0; i < h; i += 3) P(x + 16 - Math.floor(i * half * 0.5), top + i, sh(k.leaf, 1));
    }
    tri(x + 16, t - 66, 3, k.a, 1); R(x + 15, t - 64, 3, 1, k.a); P(x + 16, t - 65, sh(k.a, 2));
    for (const [i, j, c] of [[10, -20, k.c], [21, -28, '#4a7ac8'], [13, -40, k.a], [20, -16, k.p]]) sphere(x + i, t + j, 1.5, c);
  } },
]);
/* Each Berry has its own shape and its bush its own outline, so two of a colour (Oran and Chesto, Cheri and Leppa,
   Aspear and Sitrus) are still two designs in the set. */
const BERRIES = [['oran', 'Oran', '#4a78d8', 'round'], ['pecha', 'Pecha', '#f890b8', 'wide'], ['cheri', 'Cheri', '#e03838', 'wide'],
  ['chesto', 'Chesto', '#7a4ab8', 'tall'], ['rawst', 'Rawst', '#58b8a8', 'round'], ['aspear', 'Aspear', '#f0d848', 'tall'],
  ['leppa', 'Leppa', '#e86a38', 'round'], ['sitrus', 'Sitrus', '#f0e070', 'wide']];
const BUSHES = {
  round: { leaves: [[10, -10, 9], [22, -12, 9], [16, -22, 10]], spots: [[6, -12], [13, -26], [22, -18], [18, -8], [10, -30], [26, -10], [20, -30]] },
  tall: { leaves: [[12, -9, 8], [20, -11, 8], [16, -23, 8], [16, -36, 7]], spots: [[9, -11], [22, -13], [13, -23], [20, -28], [15, -40], [18, -18]] },
  wide: { leaves: [[6, -8, 8], [26, -8, 8], [16, -15, 10]], spots: [[3, -9], [29, -9], [10, -17], [22, -18], [16, -24], [15, -8]] },
};
const STALK = '#4a7a2a';
const BERRY = {
  oran: (x, y, c) => { sphere(x, y, 2.5, c); P(x, y - 2, sh(c, -2)); },
  pecha: (x, y, c) => { sphere(x - 1, y, 2, c); sphere(x + 2, y, 2, c); P(x, y - 2, sh(c, -2)); },
  cheri: (x, y, c) => { P(x - 1, y - 2, STALK); P(x + 1, y - 2, STALK); P(x, y - 3, STALK); sphere(x - 2, y, 1.8, c); sphere(x + 2, y, 1.8, c); },
  chesto: (x, y, c) => { ovalShade(x, y, 2, 3, c); for (const [i, j] of [[0, -4], [-3, -1], [3, -1], [-2, 3], [2, 3]]) P(x + i, y + j, sh(c, -2)); },
  rawst: (x, y, c) => { ovalShade(x, y + 1, 2, 3, c); R(x - 2, y - 2, 5, 1, STALK); P(x, y - 3, STALK); P(x - 1, y + 1, sh(c, 2)); P(x + 1, y + 2, sh(c, 2)); },
  aspear: (x, y, c) => { sphere(x, y + 1, 2.5, c); sphere(x, y - 2, 1.5, c); P(x, y - 4, STALK); },
  leppa: (x, y, c) => { sphere(x, y, 3, c); leaf(x + 2, y - 3, 2, 1, STALK, -0.5); },
  sitrus: (x, y, c) => { sphere(x, y, 3.5, c); R(x - 2, y, 5, 1, sh(c, 1)); R(x, y - 2, 1, 5, sh(c, 1)); P(x, y, '#ffffff'); },
};
add('Plants', BERRIES.map(([id, name, c, form], n) => ({ set: 'bush', id: `${id}bush`, name: `${name} Berry bush`, proper: true, w: 1, h: 1, price: 280, draw(x, b) {
  floorShadow(x + 2, b, 28); const t = potAt(x, b, 'basket'), bush = BUSHES[form];
  bush.leaves.forEach(([i, j, r], m) => foliage(x + i, t + j, r, k.leaf, n + m * 9));
  for (const [i, j] of bush.spots) BERRY[id](x + i, t + j, c);
} })));

/* ---------- things: one painter each ---------- */
add('Things', [
  { id: 'trophy', name: 'Trophy', w: 1, h: 1, price: 500, draw(x, b) {
    floorShadow(x + 4, b, 24); wood(x + 6, b - 10, 20, 10, k.w); R(x + 10, b - 7, 12, 3, k.a); R(x + 11, b - 6, 10, 1, sh(k.a, -2));
    cyl(x + 14, b - 18, 4, 8, k.a); ovalShade(x + 16, b - 19, 6, 2, k.a);
    for (let j = 0; j < 18; j++) { const half = 10 - Math.floor(j * j / 40); R(x + 16 - half, b - 38 + j, half * 2, 1, k.a); P(x + 16 - half, b - 38 + j, sh(k.a, -1)); R(x + 16 - half + 3, b - 38 + j, 2, 1, sh(k.a, 2)); P(x + 15 + half, b - 38 + j, sh(k.a, -2)); }
    oval(x + 16, b - 38, 10, 2, sh(k.a, -2));
    for (const s of [-1, 1]) for (let a = 0; a < 10; a++) P(x + 16 + s * (10 + Math.round(Math.sin(a / 3) * 4)), b - 36 + a, sh(k.a, -1));
    motif('star', x + 12, b - 33, ink(k.c, sh(k.c, 2), sh(k.c, -2), '#ffffff'), 1);
  } },
  { id: 'globe', name: 'Globe', w: 1, h: 1, price: 320, draw(x, b) {
    floorShadow(x + 6, b, 20); ovalShade(x + 16, b - 4, 8, 3, k.w); cyl(x + 15, b - 12, 3, 8, sh(k.w, -1));
    sphere(x + 16, b - 26, 12, '#4a88d8');
    for (const [cx, cy, rx, ry] of [[-4, -3, 4, 5], [5, 2, 4, 6], [-2, 7, 3, 2], [4, -8, 3, 2]]) oval(x + 16 + cx, b - 26 + cy, rx, ry, '#5ab048');
    disc(x + 12, b - 31, 3, '#a8d0f8'); P(x + 10, b - 33, '#ffffff');
    for (let a = -1.6; a < 1.7; a += 0.08) P(Math.round(x + 16 - Math.cos(a) * 14), Math.round(b - 26 + Math.sin(a) * 14), k.a);
  } },
  { id: 'fishbowl', name: 'Fishbowl', w: 1, h: 1, price: 260, draw(x, b) {
    floorShadow(x + 2, b, 28); legs4(x + 2, b, 28, 14, sh(k.w, -1)); wood(x + 3, b - 20, 26, 6, k.w);
    disc(x + 16, b - 32, 11, '#d8f0f8'); for (let j = -6; j <= 10; j++) { const h = Math.floor(Math.sqrt(Math.max(0, 100 - j * j))); R(x + 16 - h, b - 32 + j, h * 2 + 1, 1, j < -4 ? '#a8d8f0' : '#7ac0e8'); }
    R(x + 9, b - 43, 15, 2, '#c8e8f4'); for (let i = 0; i < 3; i++) leaf(x + 10 + i * 3, b - 25, 1, 3, k.leaf);
    ovalShade(x + 15, b - 32, 5, 3, '#f08030'); tri(x + 21, b - 34, 4, '#f08030', 0.8); P(x + 12, b - 33, '#202028'); R(x + 13, b - 36, 3, 1, '#f8a050');
    P(x + 9, b - 38, '#ffffff'); R(x + 8, b - 36, 1, 4, '#ffffff'); P(x + 19, b - 39, '#ffffff'); P(x + 20, b - 41, '#ffffff');
  } },
  { id: 'candle', name: 'Candle', w: 1, h: 1, price: 120, glow: ['g', 'gl'], draw(x, b) {
    floorShadow(x + 6, b, 20); ovalShade(x + 16, b - 4, 10, 3, k.m); R(x + 6, b - 4, 20, 2, sh(k.m, -1));
    cyl(x + 11, b - 26, 10, 21, k.p); oval(x + 16, b - 26, 5, 1.5, sh(k.p, -1)); R(x + 13, b - 24, 2, 6, sh(k.p, 1)); R(x + 18, b - 23, 2, 4, '#ffffff');
    R(x + 15, b - 30, 1, 4, '#303038');
    for (let j = 0; j < 10; j++) { const h = Math.floor(Math.sin(j / 10 * Math.PI) * 3); R(x + 16 - h, b - 40 + j, h * 2 + 1, 1, j > 5 ? k.g : k.gl); }
  } },
  { id: 'snowglobe', name: 'Snow globe', w: 1, h: 1, price: 240, draw(x, b) {
    floorShadow(x + 4, b, 24); wood(x + 5, b - 9, 22, 9, k.w); R(x + 7, b - 6, 18, 2, k.a);
    disc(x + 16, b - 21, 11, '#d8eef8'); disc(x + 16, b - 21, 10, '#b8dcf0');
    tri(x + 16, b - 29, 12, k.leaf, 0.55); R(x + 15, b - 17, 2, 3, k.w); oval(x + 16, b - 13, 9, 2, '#ffffff');
    for (let i = 0; i < 14; i++) P(x + 8 + Math.floor(hash(i) * 16), b - 30 + Math.floor(hash(i, 2) * 16), '#ffffff');
    R(x + 9, b - 28, 2, 4, '#ffffff'); P(x + 10, b - 30, '#ffffff');
  } },
  { id: 'lavalamp', name: 'Lava lamp', w: 1, h: 1, price: 280, glow: ['a', 'c'], draw(x, b) {
    floorShadow(x + 6, b, 20);
    for (let j = 0; j < 12; j++) { const half = 5 + Math.floor(j * 0.35); R(x + 16 - half, b - 12 + j, half * 2, 1, j < 2 ? sh(k.m, 1) : k.m); }
    for (let j = 0; j < 30; j++) { const half = 3 + Math.floor(Math.sin((j / 30) * Math.PI) * 4); R(x + 16 - half, b - 42 + j, half * 2, 1, k.c); }
    for (let j = 0; j < 6; j++) { const half = 2 + Math.floor(j * 0.4); R(x + 16 - half, b - 48 + j, half * 2, 1, k.m); }
    ovalShade(x + 15, b - 34, 3, 4, k.a); ovalShade(x + 17, b - 22, 4, 3, k.a); disc(x + 14, b - 17, 2, k.a); R(x + 13, b - 38, 1, 16, sh(k.c, 2));
  } },
  { id: 'hourglass', name: 'Hourglass', w: 1, h: 1, price: 220, draw(x, b) {
    floorShadow(x + 4, b, 24); wood(x + 5, b - 5, 22, 5, k.w); wood(x + 5, b - 40, 22, 5, k.w);
    cyl(x + 7, b - 35, 2, 30, sh(k.w, -1)); cyl(x + 23, b - 35, 2, 30, sh(k.w, -1));
    for (let j = 0; j < 15; j++) { const h = 6 - Math.floor(j / 2.6); R(x + 16 - h, b - 35 + j, h * 2, 1, '#e8f4fc'); R(x + 16 - h, b - 6 - j, h * 2, 1, '#e8f4fc'); }
    for (let j = 5; j < 13; j++) { const h = 6 - Math.floor(j / 2.6); R(x + 16 - h + 1, b - 35 + j, h * 2 - 2, 1, k.a); }
    R(x + 15, b - 22, 2, 14, sh(k.a, 1)); for (let j = 0; j < 5; j++) R(x + 15 - j, b - 11 + j, 2 + j * 2, 1, k.a);
    R(x + 10, b - 33, 1, 6, '#ffffff');
  } },
  { id: 'musicbox', name: 'Music box', w: 1, h: 1, price: 300, draw(x, b) {
    floorShadow(x + 2, b, 28); wood(x + 3, b - 16, 26, 16, k.w); R(x + 5, b - 9, 22, 2, k.a); R(x + 5, b - 9, 22, 1, sh(k.a, 2));
    for (let j = 0; j < 12; j++) R(x + 3 + Math.floor(j * 0.3), b - 32 + j, 26 - Math.floor(j * 0.3), 1, j < 1 ? sh(k.w, 1) : k.w);
    inset(x + 6, b - 30, 20, 10, sh(k.c, -1)); R(x + 7, b - 29, 18, 8, k.c);
    cyl(x + 15, b - 26, 2, 10, k.p); oval(x + 16, b - 27, 4, 1.5, k.c); disc(x + 16, b - 30, 2, '#f8d8c0');
    for (let a = 0; a < 3; a++) R(x + 28, b - 12 + a * 2, 3, 1, k.m);
    stamp(MOTIFS.note, x + 22, b - 46, { '#': sh(k.a, 1) }, 1);
  } },
  { id: 'telescope', name: 'Telescope', w: 1, h: 1, price: 450, draw(x, b) {
    floorShadow(x, b, 32);
    for (let j = 0; j < 24; j++) { P(x + 16 - Math.floor(j * 0.45), b - 24 + j, sh(k.w, -1)); P(x + 16 + Math.floor(j * 0.45), b - 24 + j, sh(k.w, -1)); P(x + 15 - Math.floor(j * 0.45), b - 24 + j, k.w); P(x + 17 + Math.floor(j * 0.45), b - 24 + j, k.w); }
    cyl(x + 15, b - 24, 3, 22, sh(k.w, -1));
    for (let i = 0; i < 26; i++) { const tx = x + 3 + i, ty = b - 26 - Math.floor(i * 0.75); const r = i > 18 ? 4 : i > 8 ? 3 : 2; const c = i > 18 ? k.a : k.m; R(tx, ty - r, 1, r * 2, c); P(tx, ty - r, sh(c, 2)); P(tx, ty + r - 1, sh(c, -2)); }
    sphere(x + 16, b - 33, 3, k.a);
  } },
  { id: 'recordplayer', name: 'Record player', w: 1, h: 1, price: 420, draw(x, b) {
    floorShadow(x, b, 32); legs4(x, b, 32, 16, sh(k.w, -1)); wood(x + 1, b - 26, 30, 10, k.w); R(x + 3, b - 20, 26, 2, k.a);
    oval(x + 14, b - 26, 11, 4, '#202028'); oval(x + 14, b - 26, 8, 3, '#303038'); oval(x + 14, b - 26, 3, 1, k.c); for (let i = 0; i < 6; i++) P(x + 7 + i * 2, b - 28 + (i % 2), '#4a4a58');
    R(x + 27, b - 32, 2, 6, k.m); R(x + 20, b - 32, 8, 2, k.m); P(x + 20, b - 30, sh(k.m, 2));
    panel(x + 2, b - 46, 12, 12, k.p); R(x + 3, b - 45, 10, 10, k.c); motif('note', x + 4, b - 45, ink(k.p, k.p, k.p, k.p), 1);
  } },
  { id: 'radio', name: 'Radio', w: 1, h: 1, price: 260, draw(x, b) {
    floorShadow(x + 1, b, 30); for (let j = 0; j < 22; j++) P(x + 8 + Math.floor(j * 0.3), b - 44 + j, k.m); sphere(x + 8, b - 45, 1.5, k.m);
    panel(x + 2, b - 24, 28, 24, k.c, 2); R(x + 4, b - 22, 24, 2, sh(k.c, 1));
    inset(x + 5, b - 18, 13, 14, sh(k.c, -2)); for (let j = 0; j < 6; j++) R(x + 6, b - 17 + j * 2, 11, 1, sh(k.c, -1));
    sphere(x + 24, b - 15, 3, k.a); sphere(x + 24, b - 7, 2, k.p); R(x + 20, b - 22, 8, 3, '#f8e8b0'); R(x + 23, b - 22, 1, 3, '#e04848');
    R(x + 8, b - 28, 16, 4, sh(k.c, -1)); R(x + 10, b - 30, 12, 2, sh(k.c, -1));
  } },
  { id: 'computer', name: 'Computer', w: 1, h: 1, price: 900, glow: ['#68c8f8'], draw(x, b) {
    floorShadow(x, b, 32); legs4(x, b, 32, 18, sh(k.w, -1)); wood(x, b - 24, 32, 6, sh(k.w, 1));
    panel(x + 3, b - 50, 26, 20, k.m, 2); R(x + 6, b - 47, 20, 14, '#68c8f8'); R(x + 7, b - 46, 8, 2, '#d8f4ff'); R(x + 7, b - 42, 14, 1, '#a8e8ff'); R(x + 7, b - 39, 10, 1, '#a8e8ff');
    cyl(x + 14, b - 30, 4, 6, sh(k.m, -1)); panel(x + 4, b - 28, 18, 4, k.p); for (let i = 0; i < 8; i++) P(x + 5 + i * 2, b - 27, sh(k.p, -2));
    ovalShade(x + 26, b - 27, 3, 2, k.p);
  } },
  { id: 'console', name: 'Game console', w: 1, h: 1, price: 600, draw(x, b) {
    floorShadow(x, b, 32); panel(x + 4, b - 12, 24, 12, k.m, 2); R(x + 6, b - 10, 20, 1, sh(k.m, 2)); R(x + 7, b - 7, 8, 4, k.c); R(x + 20, b - 7, 3, 2, k.a); P(x + 24, b - 7, '#68e868');
    for (const cx of [3, 18]) { panel(x + cx, b - 22, 12, 8, k.p); R(x + cx + 2, b - 19, 3, 1, sh(k.p, -2)); R(x + cx + 3, b - 20, 1, 3, sh(k.p, -2)); P(x + cx + 8, b - 20, k.c); P(x + cx + 9, b - 18, '#4a7ac8'); }
    for (let i = 0; i < 6; i++) { P(x + 9, b - 14 + i, '#202028'); P(x + 24, b - 14 + i, '#202028'); }
  } },
  { id: 'fan', name: 'Fan', w: 1, h: 1, price: 220, draw(x, b) {
    floorShadow(x + 4, b, 24); ovalShade(x + 16, b - 4, 9, 3, k.m); cyl(x + 15, b - 30, 3, 26, k.m); R(x + 13, b - 14, 7, 2, sh(k.m, 1));
    disc(x + 16, b - 42, 13, sh(k.m, -1)); disc(x + 16, b - 42, 12, k.p);
    for (let a = 0; a < 3; a++) { const ang = a / 3 * Math.PI * 2 + 0.4; for (let r = 2; r < 11; r++) { const w = Math.floor(Math.sin(r / 11 * Math.PI) * 3); for (let s = -w; s <= w; s++) P(Math.round(x + 16 + Math.cos(ang) * r - Math.sin(ang) * s), Math.round(b - 42 + Math.sin(ang) * r + Math.cos(ang) * s), s < 0 ? sh(k.c, 1) : k.c); } }
    for (let a = 0; a < 40; a += 4) for (let r = 4; r < 13; r += 3) P(Math.round(x + 16 + Math.cos(a / 40 * Math.PI * 2) * r), Math.round(b - 42 + Math.sin(a / 40 * Math.PI * 2) * r), sh(k.m, 1));
    sphere(x + 16, b - 42, 2.5, k.m);
  } },
  { id: 'heater', name: 'Radiator', w: 1, h: 1, price: 240, draw(x, b) {
    floorShadow(x, b, 32); R(x + 4, b - 4, 3, 4, sh(k.m, -1)); R(x + 25, b - 4, 3, 4, sh(k.m, -1));
    for (let i = 0; i < 6; i++) { cyl(x + 1 + i * 5, b - 30, 5, 26, k.m); disc(x + 3 + i * 5, b - 30, 2.5, sh(k.m, 1)); }
    R(x + 1, b - 26, 30, 1, sh(k.m, -2)); R(x + 1, b - 9, 30, 1, sh(k.m, -2)); sphere(x + 29, b - 34, 2.5, k.a);
  } },
  { id: 'piano', name: 'Piano', w: 2, h: 1, price: 1200, draw(x, b, vw, dir) {
    if (dir % 2) return sideBox(x, b, vw, 52);
    floorShadow(x, b, vw); cyl(x + 4, b - 6, 4, 6, sh(k.w, -1)); cyl(x + vw - 8, b - 6, 4, 6, sh(k.w, -1));
    wood(x, b - 58, vw, 52, k.w, 'y'); wood(x, b - 60, vw, 5, sh(k.w, 1));
    if (dir === 2) return;
    inset(x + 8, b - 52, vw - 16, 14, sh(k.w, -1)); R(x + 10, b - 50, 10, 10, k.p); for (let i = 0; i < 4; i++) R(x + 12, b - 48 + i * 2, 6, 1, sh(k.p, -2));
    cyl(x + vw - 16, b - 50, 3, 8, k.p); disc(x + vw - 15, b - 52, 1.5, '#f8c040');
    wood(x + 2, b - 34, vw - 4, 4, sh(k.w, -1));
    R(x + 3, b - 30, vw - 6, 8, '#ffffff'); for (let i = 3; i < vw - 3; i += 3) R(x + i + 2, b - 30, 1, 8, '#c8c8c8');
    for (let i = 4; i < vw - 5; i += 3) if (![2, 6].includes(Math.floor(i / 3) % 7)) R(x + i + 3, b - 30, 2, 5, '#202028');
    R(x + 3, b - 22, vw - 6, 2, sh(k.w, -1)); R(x + 20, b - 10, 3, 2, k.a); R(x + 28, b - 10, 3, 2, k.a);
  } },
  { id: 'drum', name: 'Drum', w: 1, h: 1, price: 280, draw(x, b) {
    floorShadow(x + 2, b, 28); cyl(x + 4, b - 22, 24, 22, k.c); R(x + 4, b - 22, 24, 2, k.a); R(x + 4, b - 3, 24, 2, k.a);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 16; j++) P(x + 6 + i * 6 + Math.round(j < 8 ? j / 3 : (16 - j) / 3), b - 20 + j, sh(k.a, -1));
    oval(x + 16, b - 23, 12, 3, sh(k.p, -1)); oval(x + 16, b - 24, 11, 2, k.p);
    for (let i = 0; i < 14; i++) { P(x + 5 + Math.floor(i * 0.5), b - 42 + i, k.w); P(x + 26 - Math.floor(i * 0.4), b - 44 + i, k.w); } sphere(x + 5, b - 42, 1.5, k.w); sphere(x + 26, b - 44, 1.5, k.w);
  } },
  { id: 'guitar', name: 'Guitar', w: 1, h: 1, price: 380, draw(x, b) {
    floorShadow(x + 6, b, 20); R(x + 8, b - 3, 16, 3, k.m); R(x + 10, b - 12, 2, 9, k.m); R(x + 20, b - 12, 2, 9, k.m);
    ovalShade(x + 16, b - 14, 9, 8, k.c); ovalShade(x + 16, b - 26, 7, 6, k.c); disc(x + 16, b - 20, 3, '#2a1a10'); R(x + 13, b - 10, 7, 2, sh(k.w, -2));
    cyl(x + 14, b - 62, 4, 36, sh(k.w, -1)); for (let j = b - 60; j < b - 28; j += 4) R(x + 14, j, 4, 1, sh(k.p, -1));
    panel(x + 12, b - 70, 8, 9, sh(k.w, -1)); for (let j = 0; j < 3; j++) { P(x + 11, b - 68 + j * 3, k.a); P(x + 20, b - 68 + j * 3, k.a); }
    R(x + 16, b - 61, 1, 46, '#e8e8e8');
  } },
  { id: 'aquarium', name: 'Aquarium', w: 2, h: 1, price: 900, draw(x, b, vw, dir) {
    if (dir % 2) return sideBox(x, b, vw, 50);
    floorShadow(x, b, vw); wood(x, b - 20, vw, 20, k.w); inset(x + 4, b - 16, vw / 2 - 6, 12, sh(k.w, -1)); inset(x + vw / 2 + 2, b - 16, vw / 2 - 6, 12, sh(k.w, -1));
    panel(x + 1, b - 54, vw - 2, 34, k.m, 2);
    for (let j = 0; j < 30; j++) R(x + 3, b - 52 + j, vw - 6, 1, j < 3 ? '#a8d8f0' : j < 15 ? '#5a9ad0' : '#3a7ab8');
    R(x + 3, b - 26, vw - 6, 4, '#e8d8a0'); for (let i = 0; i < 20; i++) P(x + 4 + Math.floor(hash(i) * (vw - 8)), b - 26 + Math.floor(hash(i, 2) * 4), '#c8a868');
    for (const [px, h] of [[8, 16], [11, 12], [52, 20], [56, 14]]) for (let j = 0; j < h; j++) P(x + px + Math.round(Math.sin(j / 2) * 1.5), b - 26 - j, j % 3 ? k.leaf : sh(k.leaf, 1));
    ovalShade(x + 22, b - 40, 5, 3, '#f08030'); tri(x + 28, b - 42, 4, '#f08030', 0.8); P(x + 19, b - 41, '#202028');
    ovalShade(x + 40, b - 32, 4, 2, '#f8d030'); tri(x + 45, b - 33, 3, '#f8d030', 0.7); P(x + 37, b - 33, '#202028');
    sphere(x + 32, b - 27, 3, '#c8a0e8');
    for (const [i, j] of [[48, -46], [47, -40], [49, -36], [16, -48]]) disc(x + i, b + j, 1, '#ffffff');
    R(x + 4, b - 50, 1, 22, '#ffffff'); R(x + 1, b - 56, vw - 2, 3, sh(k.m, -1));
  } },
  { id: 'fireplace', name: 'Fireplace', w: 2, h: 1, price: 1100, glow: ['#f8a030', '#f8e070', '#f86030'], draw(x, b, vw, dir) {
    if (dir % 2) return sideBox(x, b, vw, 56);
    floorShadow(x, b, vw);
    for (let j = 0; j < 52; j += 6) for (let i = (j % 12 ? 0 : -6); i < vw; i += 12) panel(x + Math.max(0, i), b - 52 + j, Math.min(12, vw - Math.max(0, i), 12 + i), 6, hash(i, j) < 0.3 ? sh(k.w, -1) : k.w);
    wood(x - 1, b - 60, vw + 2, 8, sh(k.w, 1)); R(x, b - 52, vw, 1, 'rgba(0,0,0,0.3)');
    if (dir === 2) return;
    disc(x + vw / 2, b - 30, 16, '#2a1a1a'); R(x + vw / 2 - 16, b - 30, 33, 30, '#2a1a1a'); for (let j = 0; j < 8; j++) R(x + vw / 2 - 15, b - 44 + j * 4, 31, 1, '#3a2420');
    cyl(x + 18, b - 6, 28, 4, '#6a4426'); cyl(x + 22, b - 10, 22, 4, '#5a3a20');
    for (const [cx, h, w2] of [[25, 16, 5], [32, 22, 7], [39, 15, 5]]) { tri(x + cx, b - 10 - h, h, '#f86030', w2 / h); tri(x + cx, b - 10 - h + 4, h - 4, '#f8a030', w2 / h * 0.8); tri(x + cx, b - 10 - h + 9, h - 9, '#f8e070', w2 / h * 0.6); }
    sphere(x + 10, b - 66, 3, k.a); cyl(x + 50, b - 72, 6, 12, k.c); panel(x + 18, b - 68, 12, 8, k.p); R(x + 19, b - 67, 10, 6, '#a8c8e8');
  } },
  { id: 'stove', name: 'Stove', w: 1, h: 1, price: 520, draw(x, b) {
    floorShadow(x, b, 32); panel(x, b - 44, 32, 44, k.m, 2); R(x + 2, b - 42, 28, 2, sh(k.m, 2));
    oval(x + 9, b - 46, 6, 2, '#303038'); oval(x + 23, b - 46, 6, 2, '#303038'); oval(x + 9, b - 46, 3, 1, '#e86030');
    R(x + 3, b - 38, 26, 4, sh(k.m, -1)); for (let i = 0; i < 4; i++) sphere(x + 7 + i * 6, b - 36, 1.5, k.a);
    inset(x + 4, b - 32, 24, 26, sh(k.m, -1)); R(x + 7, b - 26, 18, 14, '#3a2420'); R(x + 8, b - 25, 16, 1, '#5a3a30'); R(x + 9, b - 18, 14, 3, '#e8a050'); R(x + 6, b - 30, 20, 2, sh(k.m, 2));
    cyl(x + 19, b - 58, 10, 12, '#c8c8d0'); R(x + 18, b - 59, 12, 2, '#e0e0e8'); R(x + 14, b - 54, 5, 2, '#303038');
  } },
  { id: 'fridge', name: 'Fridge', w: 1, h: 1, price: 700, draw(x, b) {
    floorShadow(x, b, 32); panel(x + 2, b - 80, 28, 80, k.p, 2); R(x + 3, b - 52, 26, 2, sh(k.p, -2));
    cyl(x + 24, b - 74, 3, 16, k.m); cyl(x + 24, b - 46, 3, 22, k.m);
    for (const [i, j, c] of [[6, -74, k.c], [12, -70, k.a], [6, -64, '#4a7ac8']]) sphere(x + i, b + j, 2.5, c);
    panel(x + 7, b - 44, 12, 14, '#ffffff'); R(x + 9, b - 41, 8, 1, sh(k.p, -2)); R(x + 9, b - 38, 6, 1, sh(k.p, -2));
    R(x + 4, b - 78, 2, 24, '#ffffff');
  } },
  { id: 'sink', name: 'Sink', w: 1, h: 1, price: 420, draw(x, b) {
    floorShadow(x, b, 32); wood(x + 1, b - 30, 30, 30, k.w); inset(x + 4, b - 26, 11, 22, sh(k.w, -1)); inset(x + 17, b - 26, 11, 22, sh(k.w, -1));
    sphere(x + 13, b - 15, 1.5, k.a); sphere(x + 19, b - 15, 1.5, k.a);
    panel(x, b - 36, 32, 6, k.p); oval(x + 16, b - 34, 9, 2, sh(k.p, -2)); oval(x + 16, b - 34, 8, 1, '#a8d0e8');
    R(x + 15, b - 48, 3, 12, k.m); R(x + 15, b - 48, 9, 3, k.m); P(x + 23, b - 45, '#a8d8f0'); sphere(x + 11, b - 40, 2, k.m); sphere(x + 22, b - 40, 2, k.m);
  } },
  { id: 'washer', name: 'Washing machine', w: 1, h: 1, price: 600, draw(x, b) {
    floorShadow(x, b, 32); panel(x + 2, b - 42, 28, 42, k.p, 2); R(x + 3, b - 40, 26, 7, sh(k.p, -1)); sphere(x + 7, b - 37, 2, k.a); R(x + 12, b - 38, 12, 3, '#3a4a5a'); R(x + 13, b - 37, 6, 1, '#68e868');
    disc(x + 16, b - 18, 11, k.m); disc(x + 16, b - 18, 9, '#8ac8f0');
    for (let j = 0; j < 8; j++) { const h = Math.floor(Math.sqrt(Math.max(0, 81 - (j + 1) ** 2))); R(x + 16 - h, b - 17 + j, h * 2 + 1, 1, j % 3 ? sh(k.c, 1) : k.c); }
    R(x + 10, b - 24, 4, 2, '#ffffff'); P(x + 10, b - 22, '#ffffff'); R(x + 27, b - 20, 2, 5, sh(k.m, 1));
  } },
  { id: 'bin', name: 'Trash bin', w: 1, h: 1, price: 80, draw(x, b) {
    floorShadow(x + 4, b, 24); for (let j = 0; j < 26; j++) { const half = 10 - Math.floor(j / 10); cyl(x + 16 - half, b - 26 + j, half * 2, 1, k.m); }
    R(x + 6, b - 18, 20, 3, k.a); R(x + 6, b - 18, 20, 1, sh(k.a, 2));
    ovalShade(x + 16, b - 28, 12, 3, sh(k.m, 1)); cyl(x + 13, b - 34, 6, 4, sh(k.m, -1));
  } },
  { id: 'umbrellas', name: 'Umbrella stand', w: 1, h: 1, price: 180, draw(x, b) {
    floorShadow(x + 4, b, 24);
    for (const [cx, h, c] of [[11, 48, k.c], [20, 52, k.a]]) { R(x + cx, b - h, 2, h - 20, sh(c, -2)); R(x + cx - 2, b - h - 4, 6, 2, sh(c, -1)); R(x + cx + 2, b - h - 2, 2, 3, sh(c, -1)); for (let j = 0; j < 22; j++) { const half = Math.floor(j * 0.18) + 1; R(x + cx + 1 - half, b - h + 6 + j, half * 2, 1, j % 6 < 3 ? c : sh(c, -1)); } }
    cyl(x + 6, b - 24, 20, 24, k.w); R(x + 6, b - 24, 20, 2, sh(k.w, 1)); R(x + 6, b - 14, 20, 2, k.a);
  } },
  { id: 'coatrack', name: 'Coat rack', w: 1, h: 1, price: 220, draw(x, b) {
    floorShadow(x + 4, b, 24); for (const s of [-1, 1]) for (let j = 0; j < 8; j++) P(x + 16 + s * (j + 2), b - 8 + j, sh(k.w, -1)); cyl(x + 15, b - 76, 3, 70, k.w);
    for (const [s, j] of [[-1, -70], [1, -70], [-1, -58], [1, -58]]) { R(x + 16 + s * 3 - (s < 0 ? 3 : 0), b + j, 4, 1, k.w); P(x + 16 + s * 6, b + j - 1, k.w); }
    ovalShade(x + 9, b - 74, 7, 3, k.c); R(x + 5, b - 74, 9, 2, sh(k.c, -1)); disc(x + 9, b - 78, 4, k.c);
    for (let j = 0; j < 30; j++) R(x + 20 + Math.round(Math.sin(j / 5)), b - 68 + j, 4, 1, j % 6 < 3 ? k.a : sh(k.a, -1));
  } },
  { id: 'lantern', name: 'Paper lantern', w: 1, h: 1, price: 260, glow: ['g', 'gl'], draw(x, b) {
    floorShadow(x + 6, b, 20); wood(x + 9, b - 6, 14, 6, k.w); cyl(x + 15, b - 26, 3, 20, sh(k.w, -1));
    wood(x + 8, b - 62, 16, 3, sh(k.w, -1)); wood(x + 8, b - 28, 16, 3, sh(k.w, -1));
    for (let j = 0; j < 30; j++) { const half = Math.floor(Math.sin((j + 1) / 31 * Math.PI) * 10) + 3; R(x + 16 - half, b - 59 + j, half * 2, 1, j % 6 === 0 ? sh(k.g, -1) : j < 12 ? k.gl : k.g); }
    R(x + 15, b - 59, 2, 30, sh(k.g, -1)); motif('flame', x + 12, b - 50, ink(k.c, k.c, k.c, k.c), 1);
  } },
  { id: 'birdcage', name: 'Birdcage', w: 1, h: 1, price: 340, draw(x, b) {
    floorShadow(x + 6, b, 20); ovalShade(x + 16, b - 3, 7, 3, k.m); cyl(x + 15, b - 26, 3, 23, k.m);
    ovalShade(x + 16, b - 28, 13, 3, k.m);
    for (let i = 0; i < 9; i++) { const px = x + 4 + i * 3, top = b - 52 + Math.round((i - 4) ** 2 * 0.6); R(px, top, 1, b - 29 - top, k.m); }
    for (let i = -12; i <= 12; i++) P(x + 16 + i, b - 52 + Math.round((i / 3) ** 2 * 0.6), k.m); sphere(x + 16, b - 55, 2, k.a);
    R(x + 6, b - 38, 20, 1, k.w);
    ovalShade(x + 15, b - 42, 4, 3, '#b8885a'); disc(x + 12, b - 45, 2.5, '#b8885a'); P(x + 11, b - 46, '#202028'); R(x + 9, b - 45, 2, 1, '#f0b040'); R(x + 18, b - 41, 3, 1, '#8a6040'); oval(x + 15, b - 41, 2, 1, '#f0e0c0');
  } },
  { id: 'chest', name: 'Treasure chest', w: 1, h: 1, price: 400, draw(x, b) {
    floorShadow(x, b, 32); wood(x + 2, b - 20, 28, 20, k.w);
    for (let j = 0; j < 10; j++) { const half = Math.min(14, Math.floor(Math.sqrt(100 - (10 - j) ** 2) * 1.4)); R(x + 16 - half, b - 30 + j, half * 2, 1, j < 2 ? sh(k.w, 1) : k.w); }
    R(x + 2, b - 21, 28, 2, sh(k.w, -2));
    for (const sx of [6, 22]) { R(x + sx, b - 30, 4, 30, k.a); R(x + sx, b - 30, 1, 30, sh(k.a, 2)); R(x + sx + 3, b - 30, 1, 30, sh(k.a, -1)); }
    panel(x + 12, b - 22, 8, 8, k.a); R(x + 15, b - 19, 2, 3, '#202028'); for (const [i, j] of [[3, -17], [27, -17], [3, -6], [27, -6]]) P(x + i, b + j, sh(k.a, 1));
  } },
  { id: 'barrel', name: 'Barrel', w: 1, h: 1, price: 180, draw(x, b) {
    floorShadow(x + 2, b, 28);
    for (let j = 0; j < 32; j++) { const half = 10 + Math.round(Math.sin(j / 31 * Math.PI) * 3); for (let i = -half; i < half; i++) { const s = i < -half * 0.6 ? -1 : i < -half * 0.2 ? 1 : i > half * 0.6 ? -1 : 0; P(x + 16 + i, b - 32 + j, (i + 20) % 5 === 0 ? sh(k.w, -2) : sh(k.w, s)); } }
    for (const j of [4, 14, 26]) { const half = 10 + Math.round(Math.sin(j / 31 * Math.PI) * 3); cyl(x + 16 - half, b - 32 + j, half * 2, 2, k.m); }
    oval(x + 16, b - 32, 10, 3, sh(k.w, 1)); oval(x + 16, b - 32, 8, 2, k.w); for (let i = -6; i < 7; i += 3) R(x + 16 + i, b - 33, 1, 3, sh(k.w, -1));
  } },
  { id: 'cauldron', name: 'Cauldron', w: 1, h: 1, price: 360, draw(x, b) {
    floorShadow(x, b, 32); R(x + 6, b - 5, 3, 5, '#202028'); R(x + 23, b - 5, 3, 5, '#202028');
    ovalShade(x + 16, b - 16, 14, 12, '#3a3a48'); oval(x + 16, b - 26, 13, 3, '#202028');
    oval(x + 16, b - 26, 11, 2, k.c); for (const [i, r] of [[10, 2], [19, 3], [14, 1.5]]) { disc(x + i, b - 28, r, sh(k.c, 1)); P(x + i - 1, b - 29, sh(k.c, 3)); }
    for (let i = 0; i < 8; i++) P(x + 9 + i * 2, b - 33 - Math.floor(hash(i) * 10), i % 2 ? sh(k.c, 2) : sh(k.c, 1));
    oval(x + 16, b - 28, 14, 1, '#4a4a58');
  } },
  { id: 'easel', name: 'Easel', w: 1, h: 1, price: 280, draw(x, b) {
    floorShadow(x + 2, b, 28);
    for (let j = 0; j < 64; j++) { R(x + 6 + Math.floor(j / 8), b - j, 2, 1, k.w); R(x + 24 - Math.floor(j / 8), b - j, 2, 1, sh(k.w, -1)); }
    cyl(x + 15, b - 72, 3, 60, sh(k.w, -1));
    panel(x + 3, b - 64, 26, 28, k.p, 2); for (let j = 0; j < 12; j++) R(x + 5, b - 62 + j, 22, 1, sh('#8cc8f4', j < 6 ? 1 : 0));
    oval(x + 12, b - 44, 9, 5, '#6cbf58'); oval(x + 24, b - 42, 7, 4, '#5aa048'); sphere(x + 22, b - 56, 3, '#f8d070'); R(x + 5, b - 41, 22, 3, '#6cbf58');
    wood(x + 2, b - 36, 28, 4, k.w); R(x + 6, b - 38, 4, 2, k.c); R(x + 12, b - 38, 3, 2, '#4a7ac8'); R(x + 20, b - 39, 6, 1, k.m);
  } },
  { id: 'pillar', name: 'Pillar', w: 1, h: 1, price: 450, draw(x, b) {
    floorShadow(x, b, 32); panel(x + 2, b - 8, 28, 8, k.p); R(x + 4, b - 10, 24, 2, sh(k.p, -1));
    cyl(x + 6, b - 70, 20, 60, k.p); for (let i = 9; i < 24; i += 3) R(x + i, b - 68, 1, 56, sh(k.p, -1));
    R(x + 4, b - 72, 24, 3, sh(k.p, -1)); panel(x + 1, b - 80, 30, 8, k.p); R(x + 2, b - 76, 28, 1, k.a);
    for (const s of [3, 27]) { disc(x + s, b - 76, 3, sh(k.p, -1)); disc(x + s, b - 76, 2, k.p); }
  } },
  { id: 'ballstatue', name: 'Poké Ball statue', proper: true, w: 1, h: 1, price: 800, draw(x, b) {
    floorShadow(x, b, 32); panel(x + 4, b - 20, 24, 20, k.p); R(x + 6, b - 17, 20, 1, sh(k.p, -1)); R(x + 2, b - 22, 28, 4, sh(k.p, -1)); R(x + 2, b - 22, 28, 1, sh(k.p, 1));
    disc(x + 16, b - 38, 14, '#303038'); disc(x + 16, b - 38, 13, '#f4f4f0');
    for (let j = -13; j < 0; j++) { const h = Math.sqrt(169 - j * j); R(Math.round(x + 16 - h), b - 38 + j, Math.round(h * 2) + 1, 1, j < -9 ? sh(k.c, 1) : k.c); }
    R(x + 3, b - 39, 27, 3, '#303038'); disc(x + 16, b - 38, 5, '#303038'); disc(x + 16, b - 38, 3, '#ffffff'); R(x + 8, b - 48, 4, 3, sh(k.c, 3)); oval(x + 20, b - 31, 6, 2, '#d8d8d0');
  } },
  { id: 'arcade', name: 'Arcade machine', w: 1, h: 1, price: 1000, glow: ['#68f0c8', '#f8f0a0'], draw(x, b) {
    floorShadow(x, b, 32); panel(x + 2, b - 80, 28, 80, k.c, 2); R(x + 2, b - 80, 3, 80, sh(k.c, -1));
    R(x + 4, b - 78, 24, 8, '#f8f0a0'); R(x + 6, b - 76, 20, 4, k.c); for (let i = 0; i < 5; i++) R(x + 7 + i * 4, b - 75, 2, 2, '#f8f0a0');
    panel(x + 4, b - 66, 24, 22, '#202028'); R(x + 6, b - 64, 20, 18, '#68f0c8'); for (let j = 0; j < 18; j += 2) R(x + 6, b - 64 + j, 20, 1, '#58d8b0');
    R(x + 10, b - 58, 4, 4, '#202028'); R(x + 18, b - 52, 6, 2, '#f8f0a0'); R(x + 9, b - 50, 3, 3, '#e04848');
    for (let j = 0; j < 8; j++) R(x + 1, b - 44 + j, 30, 1, sh(k.c, j < 2 ? 1 : 0)); R(x + 8, b - 48, 2, 6, '#303038'); sphere(x + 9, b - 49, 2, '#e04848');
    sphere(x + 18, b - 40, 1.5, k.a); sphere(x + 23, b - 40, 1.5, '#4a7ac8'); R(x + 12, b - 24, 8, 6, '#202028'); R(x + 13, b - 22, 6, 1, '#f8c040');
  } },
  { id: 'jukebox', name: 'Jukebox', w: 1, h: 1, price: 950, glow: ['g', 'gl'], draw(x, b) {
    floorShadow(x, b, 32); panel(x + 2, b - 54, 28, 54, k.w, 2); disc(x + 16, b - 54, 14, sh(k.w, -1)); disc(x + 16, b - 54, 13, k.w);
    disc(x + 16, b - 54, 11, k.g); disc(x + 16, b - 54, 7, k.gl); R(x + 5, b - 54, 22, 12, k.g); R(x + 8, b - 54, 16, 12, k.gl);
    for (let i = 0; i < 5; i++) R(x + 7 + i * 4, b - 64, 2, 20, k.g);
    inset(x + 6, b - 40, 20, 12, k.p); for (let i = 0; i < 4; i++) R(x + 8 + i * 4, b - 38, 2, 8, BOOKS[i]);
    inset(x + 6, b - 26, 20, 16, sh(k.w, -2)); for (let j = 0; j < 5; j++) R(x + 7, b - 25 + j * 3, 18, 1, sh(k.m, 1));
    R(x + 2, b - 6, 28, 2, k.a);
  } },
  { id: 'vending', name: 'Vending machine', w: 1, h: 1, price: 900, glow: ['gl'], draw(x, b) {
    floorShadow(x, b, 32); panel(x, b - 80, 32, 80, k.c, 2); R(x + 2, b - 78, 28, 6, sh(k.c, 1));
    inset(x + 3, b - 70, 19, 46, sh(k.c, -2)); R(x + 4, b - 69, 17, 44, k.gl);
    for (let j = 0; j < 5; j++) { for (let i = 0; i < 3; i++) cyl(x + 5 + i * 5, b - 67 + j * 9, 4, 7, [k.a, '#68b8f0', '#f8a0c0', '#78d868'][(i + j) % 4]); R(x + 4, b - 60 + j * 9, 17, 1, sh(k.c, -1)); }
    for (let j = 0; j < 8; j++) sphere(x + 26, b - 66 + j * 4, 1.2, j === 2 ? '#e04848' : k.p);
    R(x + 24, b - 34, 4, 8, '#202028'); inset(x + 4, b - 18, 18, 10, '#202028'); R(x + 5, b - 17, 16, 1, '#404050');
  } },
  { id: 'snowman', name: 'Snowman', w: 1, h: 1, price: 160, draw(x, b) {
    floorShadow(x + 2, b, 28); sphere(x + 16, b - 12, 12, '#f4f8fc'); sphere(x + 16, b - 32, 9, '#f4f8fc');
    for (let j = 0; j < 5; j++) R(x + 6, b - 25 + j, 20, 1, j % 2 ? k.c : sh(k.c, 1)); R(x + 20, b - 24, 4, 10, k.c); R(x + 20, b - 15, 4, 2, sh(k.c, -1));
    P(x + 13, b - 35, '#202028'); P(x + 19, b - 35, '#202028'); R(x + 16, b - 32, 6, 2, '#f08030'); P(x + 21, b - 31, '#c06020');
    for (const j of [-14, -8]) sphere(x + 16, b + j, 1.5, '#303038');
    R(x + 8, b - 41, 16, 3, '#303038'); panel(x + 11, b - 52, 10, 12, '#303038'); R(x + 11, b - 44, 10, 2, k.c);
    R(x + 2, b - 22, 6, 1, sh(k.w, -1)); R(x + 24, b - 24, 7, 1, sh(k.w, -1));
  } },
  { id: 'grandclock', name: 'Grandfather clock', w: 1, h: 1, price: 800, draw(x, b) {
    floorShadow(x, b, 32); wood(x + 3, b - 8, 26, 8, k.w); wood(x + 6, b - 56, 20, 48, k.w, 'y');
    inset(x + 9, b - 50, 14, 38, sh(k.w, -2)); glass(x + 10, b - 49, 12, 36, sh(k.w, -1)); R(x + 15, b - 49, 2, 24, k.a); sphere(x + 16, b - 24, 4, k.a);
    wood(x + 2, b - 82, 28, 26, k.w); tri(x + 16, b - 90, 8, sh(k.w, 1), 1.6);
    disc(x + 16, b - 70, 10, k.a); disc(x + 16, b - 70, 9, k.p); for (let h = 0; h < 12; h++) P(x + 16 + Math.round(Math.cos(h * Math.PI / 6) * 7), b - 70 + Math.round(Math.sin(h * Math.PI / 6) * 7), '#303038');
    R(x + 16, b - 76, 1, 6, '#303038'); R(x + 16, b - 70, 5, 1, '#303038'); oval(x + 13, b - 74, 3, 1, '#ffffff');
  } },
  { id: 'counter', name: 'Shop counter', w: 2, h: 1, price: 650, draw(x, b, vw, dir) {
    if (dir % 2) return sideBox(x, b, vw, 36);
    floorShadow(x, b, vw); wood(x, b - 34, vw, 34, k.w); wood(x, b - 38, vw, 6, sh(k.w, 1));
    if (dir === 2) return;
    for (let i = 0; i < 4; i++) { inset(x + 4 + i * 15, b - 28, 12, 22, sh(k.w, -1)); wood(x + 5 + i * 15, b - 27, 10, 20, k.w, 'y'); }
    panel(x + 6, b - 54, 20, 16, k.m, 2); R(x + 8, b - 52, 16, 5, '#68f0a0'); R(x + 9, b - 51, 6, 1, '#d8ffe8'); for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) R(x + 9 + i * 5, b - 45 + j * 3, 3, 2, sh(k.m, 2));
    sphere(x + 42, b - 42, 4, k.c); sphere(x + 51, b - 42, 4, k.a); sphere(x + 46, b - 48, 4, '#68b8f0');
  } },
  { id: 'cupboard', name: 'Cupboard', w: 1, h: 1, price: 480, draw(x, b) {
    floorShadow(x, b, 32); wood(x + 1, b - 80, 30, 76, k.w, 'y'); wood(x, b - 82, 32, 4, sh(k.w, 1)); R(x + 3, b - 4, 4, 4, sh(k.w, -1)); R(x + 25, b - 4, 4, 4, sh(k.w, -1));
    inset(x + 4, b - 76, 24, 36, sh(k.w, -2)); glass(x + 5, b - 75, 22, 34, '#d8eef8'); R(x + 15, b - 76, 2, 36, k.w);
    for (const j of [-73, -58]) { for (const i of [9, 22]) { disc(x + i, b + j + 6, 4, '#ffffff'); disc(x + i, b + j + 6, 2, sh(k.c, 1)); } R(x + 5, b + j + 12, 22, 2, k.w); }
    inset(x + 4, b - 36, 24, 30, sh(k.w, -1)); wood(x + 5, b - 35, 22, 28, k.w, 'y'); sphere(x + 13, b - 22, 1.5, k.a); sphere(x + 19, b - 22, 1.5, k.a); R(x + 15, b - 35, 2, 28, sh(k.w, -1));
  } },
  { id: 'nightstand', name: 'Nightstand', w: 1, h: 1, price: 260, glow: ['g', 'gl'], draw(x, b) {
    floorShadow(x, b, 32); wood(x + 2, b - 24, 28, 22, k.w); R(x + 4, b - 4, 4, 4, sh(k.w, -1)); R(x + 24, b - 4, 4, 4, sh(k.w, -1));
    inset(x + 4, b - 20, 24, 8, sh(k.w, 1)); panel(x + 5, b - 19, 22, 6, k.w); sphere(x + 16, b - 16, 1.5, k.a);
    ovalShade(x + 11, b - 28, 5, 3, k.m); cyl(x + 10, b - 38, 2, 9, k.m);
    for (let j = 0; j < 10; j++) { const half = 4 + Math.floor(j * 0.4); R(x + 11 - half, b - 48 + j, half * 2, 1, j < 2 ? k.gl : k.g); }
    panel(x + 20, b - 30, 8, 6, k.c); R(x + 21, b - 29, 6, 1, sh(k.c, 1)); R(x + 22, b - 31, 1, 2, '#f8d030');
  } },
  { id: 'standmirror', name: 'Standing mirror', w: 1, h: 1, price: 420, draw(x, b) {
    floorShadow(x + 2, b, 28); for (const s of [-1, 1]) for (let j = 0; j < 10; j++) P(x + 16 + s * (6 + j), b - 10 + j, sh(k.w, -1));
    cyl(x + 6, b - 46, 3, 36, k.w); cyl(x + 23, b - 46, 3, 36, k.w);
    oval(x + 16, b - 46, 11, 28, sh(k.w, -1)); oval(x + 16, b - 46, 10, 27, k.w); oval(x + 16, b - 46, 8, 25, '#c8e4f0'); oval(x + 14, b - 52, 4, 16, '#d8eef8');
    for (let i = 0; i < 18; i++) P(x + 11 + Math.floor(i / 4), b - 60 + i, '#ffffff'); sphere(x + 6, b - 46, 2, k.a); sphere(x + 26, b - 46, 2, k.a);
  } },
  { id: 'pc', name: 'Storage PC', w: 1, h: 1, price: 1100, glow: ['#68e8f8'], draw(x, b) {
    floorShadow(x, b, 32); panel(x + 2, b - 62, 28, 62, k.p, 2); R(x + 3, b - 60, 26, 2, '#ffffff');
    inset(x + 4, b - 56, 24, 20, sh(k.m, -1)); R(x + 5, b - 55, 22, 18, '#68e8f8'); for (let j = 0; j < 18; j += 2) R(x + 5, b - 55 + j, 22, 1, '#88f0fc');
    stamp(MOTIFS.ball, x + 11, b - 51, { k: '#2a8ab0', '#': '#ffffff', '+': '#ffffff', o: '#a8f4fc' }, 1);
    R(x + 4, b - 32, 24, 3, k.c); R(x + 4, b - 32, 24, 1, sh(k.c, 2));
    inset(x + 4, b - 26, 10, 20, sh(k.p, -1)); for (let j = 0; j < 4; j++) R(x + 17, b - 24 + j * 4, 10, 2, sh(k.p, -2)); sphere(x + 9, b - 16, 2, '#68e868');
  } },
  { id: 'crystalball', name: 'Crystal ball', w: 1, h: 1, price: 520, glow: ['#c8a0f8', '#f0e0ff'], draw(x, b) {
    floorShadow(x + 4, b, 24); wood(x + 6, b - 7, 20, 7, k.w); for (let i = 0; i < 4; i++) tri(x + 9 + i * 5, b - 13, 6, k.a, 0.5);
    disc(x + 16, b - 24, 11, '#8a68c8'); disc(x + 16, b - 24, 10, '#c8a0f8'); disc(x + 17, b - 22, 6, '#f0e0ff'); disc(x + 18, b - 21, 3, '#ffffff');
    R(x + 10, b - 30, 3, 3, '#ffffff'); for (let i = 0; i < 6; i++) P(x + 9 + Math.floor(hash(i) * 14), b - 32 + Math.floor(hash(i, 2) * 14), '#f0e0ff');
  } },
  { id: 'gong', name: 'Gong', w: 1, h: 1, price: 480, draw(x, b) {
    floorShadow(x, b, 32); cyl(x + 1, b - 74, 4, 74, k.w); cyl(x + 27, b - 74, 4, 74, k.w); wood(x, b - 78, 32, 6, sh(k.w, 1)); tri(x + 2, b - 84, 6, k.c, 0.5); tri(x + 30, b - 84, 6, k.c, 0.5);
    R(x + 10, b - 72, 1, 8, k.m); R(x + 21, b - 72, 1, 8, k.m);
    disc(x + 16, b - 48, 14, sh(k.a, -2)); disc(x + 16, b - 48, 13, k.a); disc(x + 16, b - 48, 9, sh(k.a, -1)); disc(x + 16, b - 48, 8, k.a); disc(x + 16, b - 48, 4, sh(k.a, -1)); disc(x + 13, b - 52, 3, sh(k.a, 2));
    R(x + 4, b - 10, 2, 10, k.w); disc(x + 5, b - 12, 3, k.c);
  } },
  { id: 'toybox', name: 'Toy box', w: 1, h: 1, price: 300, draw(x, b) {
    floorShadow(x, b, 32);
    disc(x + 9, b - 28, 6, '#303038'); disc(x + 9, b - 28, 5, '#ffffff'); for (let j = -5; j < 0; j++) { const h = Math.sqrt(25 - j * j); R(Math.round(x + 9 - h), b - 28 + j, Math.round(h * 2) + 1, 1, '#e04848'); } R(x + 3, b - 29, 13, 2, '#303038'); disc(x + 9, b - 28, 1.5, '#ffffff');
    cyl(x + 18, b - 36, 4, 14, k.a); sphere(x + 20, b - 38, 3, k.a); R(x + 23, b - 30, 6, 6, '#68b8f0'); R(x + 24, b - 29, 4, 1, '#a8d8f8');
    wood(x + 1, b - 22, 30, 22, k.c); R(x + 1, b - 22, 30, 3, sh(k.c, 1));
    for (let i = 0; i < 3; i++) { const c = [k.a, k.p, '#68b8f0'][i]; panel(x + 4 + i * 9, b - 16, 7, 7, c); P(x + 7 + i * 9, b - 13, sh(c, -2)); }
  } },
  { id: 'bookstack', name: 'Book pile', w: 1, h: 1, price: 120, draw(x, b) {
    floorShadow(x + 2, b, 28);
    [[3, 26], [5, 22], [2, 27], [6, 19], [4, 23], [8, 16]].forEach(([dx, bw], i) => { const c = BOOKS[(i + 2) % BOOKS.length], y = b - 5 - i * 5; panel(x + dx, y, bw, 5, c); R(x + dx + bw - 3, y + 1, 2, 3, '#f4f0e0'); R(x + dx + 2, y + 2, bw - 7, 1, sh(c, 2)); });
    panel(x + 12, b - 40, 8, 8, k.c); R(x + 11, b - 41, 10, 2, sh(k.c, 1)); R(x + 13, b - 44, 2, 3, '#f0e8d0');
  } },
  { id: 'tent', name: 'Tent', w: 2, h: 2, price: 1200, draw(x, b, vw) {
    floorShadow(x, b, vw);
    for (let j = 0; j < 60; j++) { const half = Math.floor(j * 0.52) + 1; for (let i = -half; i < half; i++) P(x + vw / 2 + i, b - 60 + j, (Math.floor((i + 64) / 8) % 2) ? k.c : sh(k.c, i < 0 ? 1 : -1)); }
    for (let j = 0; j < 60; j++) { const half = Math.floor(j * 0.52) + 1; P(x + vw / 2 - half, b - 60 + j, sh(k.c, -2)); P(x + vw / 2 + half - 1, b - 60 + j, sh(k.c, -2)); }
    for (let j = 0; j < 30; j++) { const half = Math.floor(j * 0.42) + 1; R(x + vw / 2 - half, b - 30 + j, half * 2, 1, '#2a2030'); P(x + vw / 2 - half - 1, b - 30 + j, k.a); P(x + vw / 2 + half, b - 30 + j, k.a); }
    cyl(x + vw / 2 - 1, b - 68, 2, 9, k.w); for (let j = 0; j < 5; j++) R(x + vw / 2 + 1, b - 68 + j, 8 - j, 1, k.a);
    R(x + 2, b - 4, 3, 4, k.w); R(x + vw - 5, b - 4, 3, 4, k.w); oval(x + vw / 2 + 2, b - 4, 6, 2, '#ffd890');
  } },
  { id: 'slide', name: 'Slide', w: 2, h: 1, price: 900, draw(x, b, vw, dir) {
    if (dir % 2) return sideBox(x, b, vw, 44);
    floorShadow(x, b, vw); cyl(x + 4, b - 50, 3, 50, k.m); cyl(x + 18, b - 50, 3, 50, k.m); for (let j = b - 44; j < b - 2; j += 7) cyl(x + 6, j, 12, 2, sh(k.m, 1));
    panel(x + 2, b - 52, 20, 5, k.c);
    for (let i = 0; i < vw - 22; i++) { const y = b - 50 + Math.floor(i * 1.15); R(x + 21 + i, y, 1, 7, k.a); P(x + 21 + i, y, sh(k.a, 2)); R(x + 21 + i, y + 5, 1, 2, sh(k.a, -1)); P(x + 21 + i, y - 2, sh(k.a, -1)); }
  } },
  { id: 'pokecenter', name: 'Healing machine', w: 2, h: 1, price: 1500, glow: ['#f8a0c0', '#ffffff'], draw(x, b, vw, dir) {
    if (dir % 2) return sideBox(x, b, vw, 36);
    floorShadow(x, b, vw); panel(x, b - 32, vw, 32, k.p, 2); R(x + 4, b - 20, vw - 8, 6, k.c); R(x + 4, b - 20, vw - 8, 1, sh(k.c, 2));
    for (let i = 0; i < 4; i++) sphere(x + 10 + i * 14, b - 8, 2, i % 2 ? '#68e868' : '#f8d030');
    panel(x + 3, b - 42, vw - 6, 10, sh(k.m, -1), 2);
    for (let i = 0; i < 6; i++) {
      const cx = x + 13 + (i % 3) * 19, cy = b - 46 - Math.floor(i / 3) * 7;
      disc(cx, cy, 4, '#303038'); disc(cx, cy, 3, '#ffffff'); for (let j = -3; j < 0; j++) { const h = Math.floor(Math.sqrt(9 - j * j)); R(cx - h, cy + j, h * 2 + 1, 1, '#f8a0c0'); } R(cx - 3, cy, 7, 1, '#303038');
    }
  } },
]);

/* ---------- Pokémon dolls: a bitmap each, shaded and outlined in code; one look, never themed ---------- */
const DOLLS = [
  ['pikachu', 'Pikachu', { b: '#f8d030', s: '#d8a020', r: '#e04040', k: '#202028', e: '#202028' },
    ['k........k', 'b........b', 'bb......bb', '.bbbbbbbb.', 'bbbbbbbbbb', 'bbebbbbebb', 'rbbbbbbbbr', '.bbbssbbb.', '.bbbbbbbb.', 'bbbbbbbbbb', '.ss....ss.']],
  ['clefairy', 'Clefairy', { b: '#f8b8c8', s: '#e090a8', x: '#8a5a3a', e: '#202028', r: '#f87890' },
    ['x...b....x', 'bx.bb...xb', '.bbbbbbbb.', 'bbbbbbbbbb', 'bbebbbbebb', 'rbbbbbbbbr', '.bbbbbbbb.', 'bbbbbbbbbb', '.bbbbbbbb.', '.ss....ss.']],
  ['jigglypuff', 'Jigglypuff', { b: '#f8b8d0', s: '#e090b0', e: '#3a6ab8', w: '#ffffff', r: '#f87890' },
    ['....bb....', '.b.bbb..b.', '.bbbbbbbb.', 'bbbbbbbbbb', 'bbeebbeebb', 'bbwebbwebb', 'rbbbbbbbbr', 'bbbbbbbbbb', '.bbbbbbbb.', '..s....s..']],
  ['snorlax', 'Snorlax', { b: '#3a6a7a', w: '#f0e0c0', k: '#202028' },
    ['.b......b.', '.bbbbbbbb.', 'bbwwwwwwbb', 'bwkkwwkkwb', 'bwwwwwwwwb', 'bbwwwwwwbb', 'bwwwwwwwwb', 'bwwwwwwwwb', 'bbwwwwwwbb', '.ww....ww.']],
  ['bulbasaur', 'Bulbasaur', { b: '#78c8a8', s: '#4a9a80', x: '#4fa042', y: '#2f7a32', r: '#d84848', w: '#ffffff' },
    ['....xxx...', '...xyxxx..', 'b.bxxyxxx.', 'bbbbxxxxx.', 'bbbbbbbbbb', 'brwbbsbbbb', 'bbbbbsbbbb', '.bsbbbbsb.', '.bb.bb.bb.']],
  ['charmander', 'Charmander', { b: '#f08838', w: '#f8d878', x: '#f84030', y: '#f8d030', e: '#202028' },
    ['..bbbb....', '.bbbbbb...', '.bbebbe...', '.bbbbbb...', '..bbbb..y.', '.bwwwwb.xy', 'bbwwwwbbx.', '.bwwwwbb..', '..bbbb....', '.bb..bb...']],
  ['squirtle', 'Squirtle', { b: '#78b8e8', x: '#b87838', w: '#f0e0a0', e: '#202028' },
    ['..bbbbbb..', '.bbbbbbbb.', '.bebbbbeb.', '.bbbbbbbb.', 'xxwwwwwwxx', 'bxwwwwwwxb', '.xwwwwwwx.', '.xxwwwwxx.', '..bb..bb..']],
  ['eevee', 'Eevee', { b: '#b87838', w: '#f0e0b0', e: '#202028', s: '#8a5a28' },
    ['b........b', 'bb......bb', 'sbbbbbbbbs', '.bbbbbbbb.', '.bebbbbeb.', '.bbbbbbbb.', 'wwwwwwwwww', '.wwwwwwww.', '..bbbbbb..', '..bb..bb..']],
  ['psyduck', 'Psyduck', { b: '#f8d040', x: '#f8f0b0', w: '#ffffff', e: '#202028', k: '#202028' },
    ['...k.k....', '..bbbbbb..', '.bbbbbbbb.', '.bwebbweb.', '.bbxxxxbb.', '..bxxxxb..', '.bbbbbbbb.', 'bbbbbbbbbb', '.bbbbbbbb.', '.xx....xx.']],
  ['togepi', 'Togepi', { b: '#f8f0c0', w: '#ffffff', r: '#e04848', x: '#4a78d8', e: '#202028' },
    ['..b.bb.b..', '..bbbbbb..', '.bbebbebb.', '.bbbbbbbb.', 'wwrwwxwwrw', 'wrrwxxwrrw', 'wwwwwwwwww', '.wwxwwrww.', '..wwwwww..', '..bb..bb..']],
  ['marill', 'Marill', { b: '#4a88e8', w: '#f8f8f8', r: '#e86a7a', e: '#202028' },
    ['.bb....bb.', '.bbbbbbbb.', 'bbbbbbbbbb', 'bbebbbbebb', 'bbbbrrbbbb', 'bwwwwwwwwb', 'bwwwwwwwwb', '.bwwwwwwb.', '..bb..bb..']],
  ['ditto', 'Ditto', { b: '#b890d8', k: '#3a2a4a' },
    ['..bb..bb..', '.bbbbbbbbb', 'bbbbbbbbbb', 'bbkbbbkbbb', 'bbbbbbbbbb', 'bbbkkkbbbb', 'bbbbbbbbbb', '.bbbbbbbbb']],
  ['voltorb', 'Voltorb', { r: '#e04040', w: '#f8f8f8', k: '#202028' },
    ['...rrrr...', '.rrrrrrrr.', 'rrrrrrrrrr', 'rkkrrrrkkr', 'rrrrrrrrrr', 'wwwwwwwwww', 'wwwwwwwwww', '.wwwwwwww.', '...wwww...']],
  ['poliwag', 'Poliwag', { b: '#5a78d8', w: '#f8f8f8', e: '#202028', k: '#202028' },
    ['..bbbbbb..', '.bwwbbwwb.', '.bwebbewb.', 'bbbbbbbbbb', 'bwwwwwwwwb', 'bwwkkkkwwb', 'bwwkwwkwwb', 'bwwwwkkwwb', '.bwwwwwwb.', '..bb..bb..']],
  ['gengar', 'Gengar', { b: '#7a58b8', r: '#e84848', w: '#ffffff', k: '#202028' },
    ['b..b..b..b', 'bb.bbbb.bb', 'bbbbbbbbbb', 'brrbbbbrrb', 'bbbbbbbbbb', 'bwwwwwwwwb', 'bbwkwwkwbb', '.bbbbbbbb.', '.bbbbbbbb.', '.bb....bb.']],
  ['mew', 'Mew', { b: '#f8b8d0', x: '#4a88d8', e: '#202028' },
    ['.b....b...', '.bbbbbb...', 'bbbbbbbb..', 'bxebbxeb..', 'bbbbbbbb..', '.bbbbbb...', '..bbbb..b.', '.bbbbbb.b.', '..bbbb.bb.', '..b..b....']],
  // the other starters: Hoenn (the earned furniture's Torchic / Treecko / Mudkip), Johto, Unova, Sinnoh
  ['torchic', 'Torchic', { b: '#f08838', x: '#f8a850', y: '#f8d030', e: '#202028' },
    ['....xx....', '...xbbx...', '..bbbbbb..', '..bebbeb..', '..bbyybb..', '.bbbyybbb.', '.bbbbbbbb.', '..bbbbbb..', '...y..y...']],
  ['treecko', 'Treecko', { b: '#58b848', r: '#e85848', x: '#2f7a32', e: '#202028' },
    ['..bbbb....', '.bbbbbb...', '.bebbeb...', '.bbbbbb...', '..brrb..x.', '.bbrrbbxxx', '.b.rr.bxx.', '..bbbb.x..', '..b..b....']],
  ['mudkip', 'Mudkip', { b: '#5aa8e8', x: '#f08838', w: '#c8e8f8', e: '#202028' },
    ['....x.....', '...xbbb...', '..bbbbbbx.', '.bbebbebbx', 'xbbbbbbbbx', '.bwwwwwwb.', '.bwwwwwwb.', '..bbbbbb..', '..bb..bb..']],
  ['cyndaquil', 'Cyndaquil', { k: '#2a4a6a', w: '#f0e0a0', r: '#e84030', y: '#f8d030', e: '#f8f0e0' },
    ['..r.y.r...', '.rryryrr..', '.kkkkkkkk.', 'kkkkkkkkkk', 'kkekkkekkk', 'wwwwwwwwww', '.wwwwwwww.', '.wwwwwwww.', '..kk..kk..']],
  ['chikorita', 'Chikorita', { b: '#b8e088', x: '#58b848', y: '#a8c858', e: '#202028' },
    ['.....xx...', '....xxxx..', '....x.....', '..bbbbbb..', '.bbbbbbbb.', '.bebbbbeb.', '.bbbbbbbb.', '..yyyyyy..', '..bbbbbb..', '..bb..bb..']],
  ['totodile', 'Totodile', { b: '#4a98e0', r: '#e04040', w: '#f8f8f8', y: '#f0e0a0', e: '#202028' },
    ['.r..r.....', '.bbbbbbb..', 'bbebbbbeb.', 'bbbbbbbbb.', 'bwwwwwwwb.', '.bbbbbbbbr', '.byyyybb.r', '..bbbbb...', '..b...b...']],
  ['tepig', 'Tepig', { b: '#f08838', x: '#f8b080', k: '#303038', e: '#202028' },
    ['.b......b.', '.bbbbbbbb.', 'bbbbbbbbbb', 'bbebbbbebb', 'bbbxxxxbbb', '.bbxkkxbb.', 'kkkkkkkkkk', '.bbbbbbbb.', '.kk....kk.']],
  ['snivy', 'Snivy', { b: '#58b848', w: '#f0e8b0', y: '#f8d030', x: '#2f7a32', e: '#a83020' },
    ['.....xxx..', '..bbbbbx..', '.bwwwwbb..', '.bwewweb..', '.bwwwwbb..', '..yyyyy...', '..bwwwb...', '..bbbbb.xx', '..b...bxx.']],
  ['oshawott', 'Oshawott', { w: '#f8f8f8', b: '#5a90d8', y: '#f8d030', k: '#e8b090', e: '#202028' },
    ['..wwwwww..', '.wwwwwwww.', '.wewwwwew.', '.wwwkkwww.', '..wwwwww..', '.bbbyybbb.', '.bbbbbbbb.', '..bbbbbb..', '..ww..ww..']],
  ['turtwig', 'Turtwig', { b: '#78c868', k: '#a87848', x: '#4fa042', y: '#f8e080', e: '#202028' },
    ['....xx....', '....x.....', '..kkkkkk..', '.bbbbbbbb.', 'bbebbbbebb', 'bbbbyybbbb', '.kkkkkkkk.', '.bbbbbbbb.', '.bb....bb.']],
  ['chimchar', 'Chimchar', { b: '#e88838', w: '#f8e0b0', r: '#f04030', y: '#f8d030', e: '#202028' },
    ['..bbbbbb..', '.bbbbbbbb.', '.bwewwewb.', '.bwwwwwwb.', '..bwrrwb..', '..bbbbbb.y', '.bbwwwwbbr', '..bbbbbb.r', '..bb..bb..']],
  ['piplup', 'Piplup', { b: '#4a78c8', w: '#f8f8f8', y: '#f8b830', e: '#202028' },
    ['...bbbb...', '..bbbbbb..', '.bwwbbwwb.', '.bwewwewb.', '.bwwyywwb.', '..bwwwwb..', '.bbwwwwbb.', 'b.bwwwwb.b', '..yy..yy..']],
  // Gen 3's own dolls
  ['pichu', 'Pichu', { b: '#f8d878', k: '#202028', r: '#f87890', e: '#202028' },
    ['k........k', 'kb......bk', '.bb....bb.', '..bbbbbb..', '.bbbbbbbb.', '.bebbbbeb.', '.rbbbbbbr.', '..bbbbbb..', '..bb..bb..']],
  ['meowth', 'Meowth', { b: '#f0e0b0', s: '#b88858', y: '#f8d030', k: '#7a5a3a', e: '#202028' },
    ['.k......k.', '.bb.yy.bb.', '.bbbyybbb.', 'bbbbbbbbbb', 'bbebbbbebb', 'bbbbssbbbb', '.bbbbbbbb.', '..bbbbbb..', '..ss..ss..']],
  ['smoochum', 'Smoochum', { y: '#f8e070', b: '#f8c8c0', r: '#d878c0', e: '#3a6ab8' },
    ['..yyyyyy..', '.yyyyyyyy.', '.ybbbbbby.', '.bbebbebb.', '.bbbrrbbb.', '..rrrrrr..', '.rrrrrrrr.', '..rrrrrr..', '...b..b...']],
  ['duskull', 'Duskull', { w: '#e8e0d0', k: '#4a4a58', r: '#e83030' },
    ['..wwwwww..', '.wwwwwwww.', '.wwkrrkww.', '.wwwwwwww.', '..wkwkww..', '.kkkkkkkk.', 'kkkkkkkkkk', '.kkkkkkkk.', '..k.kk.k..']],
  ['wynaut', 'Wynaut', { b: '#78b8f0', r: '#e86868', e: '#202028' },
    ['...bbbb...', '..bbbbbb..', '.bbbbbbbb.', '.bbebbebb.', '.bbbrrbbb.', 'bbbbbbbbbb', '.bbbbbbbb.', '..bbbbbb..', '..b....b..', '.bbb..bbb.']],
  ['baltoy', 'Baltoy', { b: '#c8a068', x: '#e05040', e: '#202028' },
    ['....bb....', '...bbbb...', '..bebbeb..', '.bbbbbbbb.', 'bbbbbbbbbb', 'xxxxxxxxxx', '.bbbbbbbb.', '..bbbbbb..', '....bb....']],
  ['kecleon', 'Kecleon', { b: '#78c858', r: '#e04848', y: '#f0e080', x: '#4a9a40', e: '#202028' },
    ['..bbbbbb..', '.bbbbbbbb.', '.bebbbbeb.', '.bbbbbbbbx', 'rrrrrrrrrx', '.bbbbbbbxx', '.yyyyyybb.', '..bbbbbb..', '..bb..bb..']],
  ['azurill', 'Azurill', { b: '#5aa0e8', k: '#202028', e: '#202028' },
    ['..b....b..', '..bb..bb..', '..bbbbbb..', '.bbebbebb.', '.bbbbbbbb.', '..bbbbbb..', '.......kk.', '........bb', '.......bbb']],
  ['skitty', 'Skitty', { b: '#f8a8c0', w: '#f8e8c8', r: '#e86878', x: '#f8d0a0', e: '#202028' },
    ['.b......b.', 'bbb....bbb', 'bbbbbbbbbb', 'bwwwwwwwwb', 'bwewwwwewb', '.wwwrrwww.', '..bbbbbb.x', '..bbbbbbxx', '..ww..ww..']],
  ['swablu', 'Swablu', { b: '#68b8f0', w: '#f8f8f8', y: '#f8c830', e: '#202028' },
    ['..bbbb....', '.bbbbbb...', '.bebbbb...', '.bbbbbbyy.', 'wwbbbbww..', 'wwwwwwwww.', 'wwwwwwwwww', '.wwwwwwww.', '..y...y...']],
  ['gulpin', 'Gulpin', { b: '#a8d870', y: '#f8d030', k: '#202028' },
    ['..b...b...', '..bbbbbb..', '.bbbbbbbb.', '.bkbbbbkb.', '.bbbbbbbb.', 'bbbbyybbbb', 'bbbyyyybbb', 'bbbbyybbbb', '.bbbbbbbb.']],
  ['lotad', 'Lotad', { x: '#58b848', b: '#5a90d8', y: '#f8d030', e: '#202028' },
    ['.xxxxxxxx.', 'xxxxxxxxxx', 'xxxxxxxxxx', '..bbbbbb..', '.bbebbebb.', '.bbbyybbb.', '.bbbbbbbb.', '..bb..bb..']],
  ['seedot', 'Seedot', { k: '#5a4a3a', b: '#c89858', e: '#202028' },
    ['....kk....', '...kkkk...', '..kkkkkk..', '..bbbbbb..', '.bbebbebb.', '.bbbbbbbb.', '.bbbbbbbb.', '..bbbbbb..', '...b..b...']],
  // fan favourites
  ['vulpix', 'Vulpix', { b: '#d86838', w: '#f0c890', x: '#e88848', e: '#202028' },
    ['.b......b.', '.bb....bb.', '.bbbbbbbb.', '.bebbbbeb.', '..bbbbbb.x', '..bwwwwbxx', '..bbbbbbxx', '..bbbbb.x.', '..b...b...']],
  ['growlithe', 'Growlithe', { b: '#f08838', w: '#f0e0b0', k: '#303038', e: '#202028' },
    ['.b......b.', '.bbbbbbbb.', 'wbbbbbbbbw', 'wbebbbbebw', 'wbbbkkbbbw', '.wwwwwwww.', '.bkbbbbkb.', '.bbbbbbbb.', '.bb....bb.']],
  ['oddish', 'Oddish', { x: '#4fa042', b: '#5a68c8', e: '#c83838' },
    ['.x..x..x..', 'xxxxxxxxx.', '.xxxxxxx..', '..bbbbbb..', '.bbbbbbbb.', '.bbebbebb.', '.bbbbbbbb.', '..bbbbbb..', '..bb..bb..']],
  ['slowpoke', 'Slowpoke', { b: '#f8a0b0', w: '#f8e8c8', e: '#202028' },
    ['..bbbbbb..', '.bbbbbbbb.', 'bbbbbbbbbb', 'bbebbbbebb', '.bwwwwwwb.', '..bwwwwb..', '.bbbbbbbb.', 'bbbbbbbbbb', '.bb..bb.bb']],
  ['magikarp', 'Magikarp', { r: '#e85030', w: '#f8f0e0', y: '#f8d878', e: '#202028' },
    ['...yy.....', '..rrrrr...', '.rrrrrrr.y', 'rerrrrrryy', 'rrrrrrrryy', 'wwrrrrrr.y', '.wwwwww...', '..yy......']],
  ['lapras', 'Lapras', { b: '#5aa0e0', x: '#a8a8b8', k: '#706878', w: '#f0e8c0', e: '#202028' },
    ['.bb.......', 'bbbb......', 'bebb......', '.bbb......', '..bb......', '..bbxxxx..', '.bbxxkxxx.', 'bbwwwwwwbb', 'bbbbbbbbbb', '.bb....bb.']],
  ['dratini', 'Dratini', { b: '#78a0e8', w: '#f8f8f8', e: '#202028' },
    ['.w..bbb...', '.bbbbebb..', '..bbbbbb..', '....wwbb..', '....wwbb..', '..bbbbbb..', '.bbwwbbbbb', 'bbbbbbbbb.', '.bbbb.....']],
  ['cubone', 'Cubone', { w: '#e8e0d0', k: '#303038', b: '#a87848' },
    ['.w......w.', '.wwwwwwww.', 'wwkwwwwkww', 'wkkwwwwkkw', '.wwbbbbww.', '..bbbbbb..', '.bwwwwwwb.', '.bbwwwwbb.', '..bb..bb..']],
  ['abra', 'Abra', { b: '#f8c840', x: '#a86838', k: '#202028' },
    ['.b......b.', '.bb....bb.', '.bbbbbbbb.', '.bkbbbbkb.', '..bbbbbb..', '.xxxxxxxx.', 'bbxxxxxxbb', '..bbbbbb..', '.bb....bb.']],
  ['ponyta', 'Ponyta', { b: '#f8e8b8', r: '#f06030', y: '#f8d030', e: '#202028' },
    ['..rry.....', '.ryrbb....', '.ybbbbb...', '..bebbbb..', '...bbbbbbb', '....bbbbbr', '...bbbbbbr', '...bbbbbry', '...b.b.b..']],
  ['horsea', 'Horsea', { b: '#68b8e8', w: '#f0e8b0', e: '#202028' },
    ['..bbb.....', '.bbbbbbb..', '.bebbb....', '..bbb.....', '..bwwb....', '..bwwbb...', '..bbbbb...', '...bbb....', '..bb......', '..bbbb....']],
  ['wooper', 'Wooper', { b: '#78c0e8', x: '#9068b8', k: '#305878', e: '#202028' },
    ['xx......xx', 'x.bbbbbb.x', '.bbbbbbbb.', 'bbebbbbebb', 'bbbbbbbbbb', 'bbbkkkkbbb', '.bbbbbbbb.', '..bbbbbb..', '..bb..bb..']],
  ['mareep', 'Mareep', { w: '#f8f8f0', b: '#f8d860', k: '#303038', y: '#f8d030', e: '#202028' },
    ['.wwwwwwww.', 'wwwwwwwwww', 'wwbbbbbwww', 'wbbebbebww', 'wwbbbbbwww', 'wwwwwwwwww', 'wwwwwwwwwy', '.wwwwwwwwy', '..kk..kk..']],
  ['teddiursa', 'Teddiursa', { b: '#a86838', x: '#e8c890', y: '#f8d878', e: '#202028' },
    ['.b......b.', '.bbbbbbbb.', 'bbbbbbbbbb', 'bbebbbbebb', 'bbbbxxbbbb', '.bbbbbbbb.', 'bbbyyyybbb', '.bbbyybbb.', '.bb....bb.']],
  ['phanpy', 'Phanpy', { b: '#78b0e0', r: '#e86868', e: '#202028' },
    ['..bbbbbb..', '.bbbbbbbb.', 'bbbbbbbbbb', 'bbebbbbebb', '.bbbbbbbb.', '..bbbbbb..', '.r.bbbbbb.', 'r..bbbbbb.', '...bb..bb.']],
  ['spheal', 'Spheal', { b: '#78a8e8', w: '#f0e8c0', k: '#304868', e: '#202028' },
    ['..bbbbbb..', '.bbbbbbbb.', 'bbebbbbebb', 'bbbbkkbbbb', 'bwwwwwwwwb', 'bwwwwwwwwb', 'bbwwwwwwbb', '.bbbbbbbb.', '..b....b..']],
  ['wailmer', 'Wailmer', { b: '#4a78c8', w: '#e8f0f8', e: '#202028' },
    ['...w..w...', '..bbbbbb..', '.bbbbbbbb.', 'bbebbbbebb', 'bbbbbbbbbb', 'wwwwwwwwww', 'wwwwwwwwww', '.bbbbbbbb.', '..bbbbbb..']],
  ['munchlax', 'Munchlax', { b: '#2a5a6a', w: '#f0e0c0', k: '#202028' },
    ['.b......b.', '.bbbbbbbb.', 'bbwwwwwwbb', 'bwkkwwkkwb', 'bwwwwwwwwb', 'bbwwwwwwbb', 'bwwwwwwwwb', 'bbwwwwwwbb', '.ww....ww.']],
  ['pachirisu', 'Pachirisu', { w: '#f8f8f8', b: '#68b0e8', e: '#202028' },
    ['.b.....b..', '.wwwbwww..', 'wwewbweww.', 'wwwwwwwwb.', '.wwwwwwwbb', '.wwwwwwbbb', '..wwwww.bb', '..w...w...']],
];
/** A doll: a real plush sewn from its PLUSH pattern (js/base-dolls.js); its bitmap is only the fallback. */
function doll(id, x, b, vw, rows, colours, s) {
  const w = Math.max(...rows.map(r => r.length)), h = rows.length;
  floorShadow(x + vw / 2 - w * s * 0.6, b, w * s * 1.2);
  if (PLUSH[id]) return plushDoll(x + vw / 2, b - 0.5, h * s * 1.25, PLUSH[id]);
  plush(rows, x + (vw - w * s) / 2, b - h * s - 1, colours, s);
}
add('Dolls', DOLLS.map(([id, name, colours, rows]) => ({ id: `${id}doll`, name: `${name} doll`, proper: true, solo: true, w: 1, h: 1, price: 350,
  draw(x, b, vw) { doll(id, x, b, vw, rows, colours, 2); } })));
add('Dolls', DOLLS.map(([id, name, colours, rows]) => ({ id: `big${id}doll`, name: `Big ${name} doll`, proper: true, solo: true, w: 2, h: 2, price: 1000,
  draw(x, b, vw) { doll(id, x, b, vw, rows, colours, 5); } })));
