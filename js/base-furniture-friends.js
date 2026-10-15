/* base-furniture-friends.js  -  each friend's second and third signature pieces (docs/roadmap.md step 8, session d,
   2026-10-15): two a friend, never sold, given at 3 and 5 hearts (js/data/workshop.js's HEART_PIECES, js/data/furniture.js's
   `heart` source), each in the style of their first (the favourite gift's) and in their own colours, so one colour each
   (`solo`). These paintings are the store's and the tray's pictures; the room builds each as a 3D model
   (js/base-models-friends.js). */

import { sh, R, P, panel, inset, wood, cushion, sphere, disc, oval, ovalShade, cyl, glass, tri, leaf, floorShadow, ctx } from './base-paint.js';
import { line, ring } from './base-furniture-rooms3.js';
import { arc } from './base-furniture-rooms4.js';

export const BABY = '#88c4f0', BABYP = '#e0f2ff', CREAM = '#fbf8f2', PIKA = '#f8d030', LACQUER = '#c83a30', INK = '#2a2430',
  NAVY = '#2a3a6a', GOLD = '#e0b04a', PEACH = '#f8b890', BOA = '#f890b0', TEAL = '#2ab0a8', RACK = '#2a2e36', LEMON = '#f8e050',
  LAV = '#b8a0e0', VIOLET = '#9a58d8', IRON = '#3a3440', BROWN = '#7a5236', MOON = '#fff0c0', SAND = '#e0c088', BLOOD = '#a01c28',
  NEON = '#ff5ab4', AQUA = '#38e8d8', STEEL = '#5a6a6a';

const words = (text, x, y, size, col, w) => {
  const g = ctx();
  g.font = `bold ${size}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = col; g.fillText(text, x, y, w);
};
/** A two-wide piece seen from its side: a block of its colour, `h` tall. */
const side = (x, b, vw, h, c) => { floorShadow(x, b, vw); panel(x + 3, b - h, vw - 6, h, c); R(x + 4, b - h + 1, vw - 8, 1, sh(c, 1)); };
/** A little Pikachu, sitting, its middle at cx, its feet on y. */
function pika(cx, y, s = 1) {
  ovalShade(cx, y - 5 * s, 5 * s, 5 * s, PIKA); ovalShade(cx, y - 12 * s, 5 * s, 4.5 * s, PIKA);
  for (const sx of [-1, 1]) { line(cx + sx * 3 * s, y - 15 * s, cx + sx * 6 * s, y - 21 * s, PIKA, Math.max(1, 2 * s)); P(cx + sx * 6 * s, y - 21 * s, INK); }
  for (const sx of [-1, 1]) { P(cx + sx * 2 * s, y - 13 * s, INK); disc(cx + sx * 3.6 * s, y - 10.5 * s, 1.2 * s, '#e84848'); }
}
/** A sitting cat, `c` its coat, its middle at cx, its feet on y. */
function cat(cx, y, c, tail = 1) {
  ovalShade(cx, y - 6, 6, 6, c); ovalShade(cx, y - 15, 5, 4.5, c);
  for (const sx of [-1, 1]) tri(cx + sx * 3, y - 22, 4, c, 0.6);
  for (const sx of [-1, 1]) P(cx + sx * 2, y - 16, '#e8d040');
  line(cx + tail * 5, y - 2, cx + tail * 10, y - 10, c, 2);
}
/** A gamepad. */
const pad = (cx, y, c) => { oval(cx, y, 5, 2.5, c); disc(cx - 4, y + 1, 2, c); disc(cx + 4, y + 1, 2, c); P(cx + 2, y - 1, '#f4f4f0'); P(cx - 3, y - 1, INK); };

export const FRIEND_KINDS = [
  // the Nietos at 3: Linc's crib in baby blue, a Pikachu plush in it and a mobile over it
  { id: 'linccrib', name: 'Pikachu crib', group: 'Friends', solo: true, w: 2, h: 1, price: 600, draw(x, b, vw, dir) {
    if (dir % 2) return side(x, b, vw, 40, BABY);
    floorShadow(x, b, vw);
    for (const i of [3, vw - 6]) { cyl(x + i, b - 42, 3, 42, BABY); sphere(x + i + 1.5, b - 43, 2.5, BABYP); }
    R(x + 5, b - 40, vw - 10, 3, BABY); R(x + 5, b - 12, vw - 10, 3, BABY);
    cushion(x + 6, b - 20, vw - 12, 7, CREAM, 2); cushion(x + 22, b - 19, vw - 30, 6, BABY, 2);
    pika(x + 15, b - 14, 0.8);
    for (let i = 9; i < vw - 6; i += 5) R(x + i, b - 37, 1.5, 25, BABYP);
    line(x + vw - 5, b - 44, x + vw - 5, b - 70, '#f4f4f0', 1.5); line(x + vw - 5, b - 70, x + vw / 2, b - 70, '#f4f4f0', 1.5);
    for (const [i, c] of [[-10, '#e84848'], [0, PIKA], [10, '#f4f4f0']]) { R(x + vw / 2 + i, b - 70, 1, 8, '#d0d0d0'); sphere(x + vw / 2 + i, b - 60, 3, c); }
  } },
  // the Nietos at 5: the very tired couch, sagging in the middle, two controllers and Linc's blanket on it
  { id: 'tiredcouch', name: 'Very tired couch', group: 'Friends', solo: true, w: 2, h: 1, price: 900, draw(x, b, vw, dir) {
    const C = '#9cc8e8';
    if (dir % 2) return side(x, b, vw, 34, C);
    floorShadow(x, b, vw);
    cushion(x + 2, b - 36, vw - 4, 20, sh(C, -1), 5);
    for (const [i, tilt] of [[6, 3], [vw / 2, -1]]) cushion(x + i, b - 34 + Math.abs(tilt), vw / 2 - 8, 16, C, 5);
    cushion(x + 1, b - 26, 8, 20, sh(C, 1), 4); cushion(x + vw - 9, b - 26, 8, 20, sh(C, 1), 4);
    cushion(x + 6, b - 18, vw / 2 - 6, 8, C, 3); cushion(x + vw / 2, b - 17, vw / 2 - 6, 8, C, 3);
    R(x + 4, b - 10, vw - 8, 6, sh(C, -2)); R(x + 6, b - 4, 3, 4, BROWN); R(x + vw - 9, b - 4, 3, 4, BROWN);
    for (let i = 0; i < 5; i++) R(x + 8 + i * 4, b - 36, 3, 14, i % 2 ? PIKA : '#f4f4f0');
    pad(x + vw / 2 + 8, b - 19, '#e86aa0'); pad(x + vw / 2 + 20, b - 18, '#4a78d0');
  } },
  // John at 3: an omikuji stand from the shrine, the fortunes tied to its ropes, one of them blue with a ?
  { id: 'omikuji', name: 'Omikuji stand', group: 'Friends', solo: true, w: 1, h: 1, price: 520, draw(x, b) {
    floorShadow(x, b, 32);
    for (const i of [3, 27]) cyl(x + i, b - 60, 2, 60, '#8a5a34');
    panel(x + 1, b - 66, 30, 4, '#3a4a58'); tri(x + 16, b - 74, 8, '#3a4a58', 2);
    for (const j of [-50, -42]) { R(x + 4, b + j, 24, 1, '#e0c070'); for (let i = 0; i < 6; i++) R(x + 6 + i * 4, b + j + 1, 2, 4, i === 3 && j === -42 ? '#4a78d0' : '#fbf6e8'); }
    panel(x + 5, b - 26, 22, 26, LACQUER); R(x + 5, b - 26, 22, 2, INK);
    cyl(x + 9, b - 38, 8, 12, '#c89a5a'); R(x + 9, b - 34, 8, 4, '#fbf6e8'); words('?', x + 13, b - 32, 4, LACQUER);
    words('みくじ', x + 16, b - 14, 5, '#fbf6e8', 20);
  } },
  // John at 5: a step chest, his Steam Deck, Switch 2 and AYN Thor charging on it, none picked
  { id: 'handheldtansu', name: 'Handheld tansu', group: 'Friends', solo: true, w: 1, h: 1, price: 900, draw(x, b) {
    const W = '#6a3e22';
    floorShadow(x, b, 32);
    wood(x + 2, b - 24, 28, 24, W); wood(x + 2, b - 48, 16, 24, W);
    for (const [i, j, w] of [[4, -21, 24], [4, -11, 24], [4, -45, 12], [4, -35, 12]]) { inset(x + i, b + j, w, 8, sh(W, -1)); R(x + i + w / 2 - 2, b + j + 3, 4, 2, INK); }
    R(x + 19, b - 30, 10, 5, '#3a3a44'); R(x + 20, b - 29, 8, 3, '#7ac0f0');
    R(x + 3, b - 54, 14, 6, '#3a3a44'); R(x + 3, b - 54, 3, 6, '#3ab0e8'); R(x + 14, b - 54, 3, 6, '#e84848'); R(x + 6, b - 53, 8, 4, '#a8e070');
    R(x + 7, b - 62, 8, 6, '#2a2a30'); R(x + 8, b - 61, 6, 4, '#f0a040');
    R(x + 20, b - 46, 7, 7, '#f8e070'); words('?', x + 23.5, b - 42.5, 6, '#4a78d0');
  } },
  // Jahmes at 3: a navy grandfather clock, stopped at eleven
  { id: 'curfewclock', name: 'Curfew clock', group: 'Friends', solo: true, w: 1, h: 1, price: 640, draw(x, b) {
    floorShadow(x + 4, b, 24);
    panel(x + 7, b - 14, 18, 14, NAVY); panel(x + 9, b - 54, 14, 40, NAVY); glass(x + 11, b - 50, 10, 30, '#3a4a7a');
    R(x + 15.5, b - 50, 1, 20, GOLD); disc(x + 16, b - 27, 3, GOLD);
    panel(x + 6, b - 76, 20, 22, NAVY); oval(x + 16, b - 77, 10, 5, NAVY);
    disc(x + 16, b - 66, 8, GOLD); disc(x + 16, b - 66, 7, '#fbf6e8');
    line(x + 16, b - 66, x + 13, b - 71, INK, 1); line(x + 16, b - 66, x + 16, b - 73, INK, 1);
    words('11', x + 16, b - 61.5, 3.5, NAVY);
    disc(x + 16, b - 84, 3, GOLD); disc(x + 17.5, b - 85, 2.5, NAVY);
  } },
  // Jahmes at 5: a futon laid out for eleven sharp, a starry quilt and his three alarms
  { id: 'curfewfuton', name: 'Curfew futon', group: 'Friends', solo: true, w: 2, h: 1, price: 800, draw(x, b, vw, dir) {
    if (dir % 2) return side(x, b, vw, 12, NAVY);
    floorShadow(x, b, vw);
    R(x + 1, b - 3, vw - 2, 3, '#d4ca84'); cushion(x + 2, b - 9, vw - 4, 7, CREAM, 3);
    cushion(x + 16, b - 15, vw - 18, 10, NAVY, 4);
    for (let n = 0; n < 6; n++) P(x + 20 + n * 6, b - 12 + (n % 2) * 3, GOLD);
    cushion(x + 3, b - 14, 12, 6, '#e8e0f0', 3);
    for (const [i, c] of [[24, '#e84848'], [34, PIKA], [44, '#4a78d0']]) { sphere(x + i, b - 21, 3, c); disc(x + i, b - 21, 1.6, '#fbf6e8'); disc(x + i - 2, b - 24.5, 1, c); disc(x + i + 2, b - 24.5, 1, c); }
  } },
  // Clarence at 3: the ring light for the nine o'clock show, his feather boa thrown over it
  { id: 'ringlight', name: 'Ring light', group: 'Friends', solo: true, w: 1, h: 1, price: 560, glow: ['#fff4e8'], draw(x, b) {
    floorShadow(x, b, 32);
    line(x + 16, b - 30, x + 5, b, '#3a3a44', 1.5); line(x + 16, b - 30, x + 27, b, '#3a3a44', 1.5); line(x + 16, b - 30, x + 16, b, '#2a2a30', 1.5);
    R(x + 15, b - 62, 2, 32, '#3a3a44');
    ring(x + 16, b - 70, 11, '#fff4e8', 3); ring(x + 16, b - 70, 9, PEACH, 1);
    R(x + 13, b - 75, 6, 10, INK); R(x + 14, b - 74, 4, 8, PEACH);
    for (let n = 0; n < 12; n++) { const a = -0.4 + n * 0.32; disc(x + 16 + Math.cos(a) * 12 + (n > 6 ? (n - 6) * 1.5 : 0), b - 70 + Math.sin(a) * 12 + (n > 6 ? (n - 6) * 4 : 0), 2.5, n % 2 ? BOA : sh(BOA, 1)); }
  } },
  // Clarence at 5: his dressing table for showtime, a bulb-lit mirror, a feather fan and his lipstick
  { id: 'showvanity', name: 'Showtime vanity', group: 'Friends', solo: true, w: 2, h: 1, price: 1100, glow: ['#fff4d0'], draw(x, b, vw, dir) {
    if (dir % 2) return side(x, b, vw, 30, PEACH);
    floorShadow(x, b, vw);
    for (const i of [6, vw - 9]) cyl(x + i, b - 22, 3, 22, GOLD);
    panel(x + 3, b - 30, vw - 6, 8, PEACH); panel(x + 5, b - 26, 18, 6, sh(PEACH, -1)); panel(x + vw - 23, b - 26, 18, 6, sh(PEACH, -1));
    disc(x + 14, b - 23, 1.2, GOLD); disc(x + vw - 14, b - 23, 1.2, GOLD);
    panel(x + 12, b - 78, vw - 24, 48, sh(PEACH, -1)); glass(x + 16, b - 74, vw - 32, 40, '#d8e8f0');
    for (let i = 0; i < 6; i++) { disc(x + 14, b - 74 + i * 8, 1.6, '#fff4d0'); disc(x + vw - 14, b - 74 + i * 8, 1.6, '#fff4d0'); }
    for (let i = 0; i < 5; i++) disc(x + 20 + i * (vw - 40) / 4, b - 77, 1.6, '#fff4d0');
    for (let n = 0; n < 5; n++) line(x + 10, b - 31, x + 4 + n * 3, b - 42, n % 2 ? BOA : '#fbe0e8', 2);
    R(x + vw - 18, b - 36, 2, 6, '#e84060'); cyl(x + vw - 26, b - 37, 4, 7, '#f8c8d8');
  } },
  // Shaun at 3: a server rack, every light teal, a laptop on top tagged FIXED
  { id: 'helpdeskrack', name: 'Help desk rack', group: 'Friends', solo: true, w: 1, h: 1, price: 700, glow: [TEAL], draw(x, b) {
    floorShadow(x + 2, b, 28);
    panel(x + 5, b - 66, 22, 64, RACK); glass(x + 7, b - 63, 18, 56, '#3a4a5a');
    for (let n = 0; n < 8; n++) { R(x + 8, b - 61 + n * 7, 16, 5, '#3a404a'); for (let i = 0; i < 4; i++) P(x + 10 + i * 3, b - 59 + n * 7, (n + i) % 3 ? TEAL : '#f0a040'); }
    for (const i of [6, 24]) disc(x + i, b - 1, 1.5, INK);
    panel(x + 7, b - 70, 18, 3, '#9aa0aa'); R(x + 9, b - 78, 14, 8, '#c0c4cc'); R(x + 10, b - 77, 12, 6, '#7ad0e8');
    R(x + 18, b - 72, 9, 4, PIKA); words('FIXED', x + 22.5, b - 70, 3, INK, 8);
  } },
  // Shaun at 5: the three-monitor desk, a VOD paused on one, his stats on another, a ticket on the third
  { id: 'tripledesk', name: 'Three-monitor desk', group: 'Friends', solo: true, w: 2, h: 1, price: 1200, glow: ['#7ad0e8'], draw(x, b, vw, dir) {
    if (dir % 2) return side(x, b, vw, 28, RACK);
    floorShadow(x, b, vw);
    R(x + 4, b - 26, 3, 26, '#4a4e58'); R(x + vw - 7, b - 26, 3, 26, '#4a4e58'); panel(x + 2, b - 30, vw - 4, 4, RACK); R(x + 2, b - 27, vw - 4, 1, TEAL);
    for (const [i, w, c] of [[3, 18, '#5a7ab0'], [vw / 2 - 10, 20, '#3a4a6a'], [vw - 21, 18, '#2a5a5a']]) {
      R(x + i + w / 2 - 1, b - 36, 2, 6, '#2a2a30'); panel(x + i, b - 50, w, 14, '#1a1a20'); R(x + i + 1, b - 49, w - 2, 12, c);
    }
    for (let n = 0; n < 4; n++) R(x + vw / 2 - 7 + n * 4, b - 46 + (n % 2) * 3, 3, 1, '#e84848');
    words('34/12', x + 12, b - 43, 4, '#f4f4f0', 14); words('#4410', x + vw - 12, b - 43, 4, AQUA, 14);
    R(x + vw / 2 - 10, b - 33, 20, 3, '#2a2a30'); for (let i = 0; i < 6; i++) P(x + vw / 2 - 9 + i * 3, b - 32, ['#e84848', PIKA, TEAL][i % 3]);
    arc(x + 9, b - 36, 4, 4, Math.PI, Math.PI * 2, TEAL, 1.5); R(x + 4, b - 36, 2, 4, TEAL); R(x + 12, b - 36, 2, 4, TEAL);
  } },
  // Pat at 3: his guitar on its stand, a lemon sticker on it, for singing a line when nobody's there
  { id: 'serenadeguitar', name: 'Serenade guitar', group: 'Friends', solo: true, w: 1, h: 1, price: 600, draw(x, b) {
    const BODY = '#e0a050';
    floorShadow(x + 4, b, 24);
    line(x + 10, b, x + 16, b - 12, INK, 1.5); line(x + 22, b, x + 16, b - 12, INK, 1.5); R(x + 21, b - 50, 1.5, 50, INK);
    ovalShade(x + 16, b - 18, 9, 9, BODY); ovalShade(x + 16, b - 31, 7, 7, BODY); disc(x + 16, b - 26, 3, '#3a2210');
    R(x + 14.5, b - 66, 3, 36, '#5a3a20'); panel(x + 13.5, b - 74, 5, 8, '#5a3a20');
    for (const j of [-73, -70, -67]) { P(x + 12, b + j, '#e0e0e0'); P(x + 19, b + j, '#e0e0e0'); }
    R(x + 13, b - 14, 6, 1.5, INK);
    ovalShade(x + 21, b - 16, 3, 2.5, LEMON); leaf(x + 23, b - 19, 1.5, 0.8, '#58a838', 0.5);
  } },
  // Pat at 5: a lemonade stand from the houseboat, striped awning, fairy lights, the rose in its bottle
  { id: 'lemonadestand', name: 'Lemonade stand', group: 'Friends', solo: true, w: 2, h: 1, price: 1000, glow: ['#fff0a0'], draw(x, b, vw, dir) {
    if (dir % 2) return side(x, b, vw, 30, LEMON);
    floorShadow(x, b, vw);
    for (const i of [4, vw - 7]) R(x + i, b - 72, 3, 72, '#c8a070');
    for (let i = 0; i < vw - 4; i += 6) { R(x + 2 + i, b - 78, 6, 8, (i / 6) % 2 ? '#fbf6e8' : LEMON); disc(x + 5 + i, b - 70, 3, (i / 6) % 2 ? '#fbf6e8' : LEMON); }
    for (let i = 0; i < 9; i++) disc(x + 8 + i * (vw - 16) / 8, b - 62 + Math.sin(i / 8 * Math.PI) * 5, 1.4, '#fff0a0');
    panel(x + 6, b - 30, vw - 12, 30, '#fbf6e8'); for (let i = 0; i < vw - 12; i += 8) R(x + 6 + i, b - 30, 4, 30, LEMON);
    panel(x + 12, b - 24, vw - 24, 10, '#fbf6e8'); words('LEMONADE', x + vw / 2, b - 19, 5, '#d89a20', vw - 26);
    panel(x + 4, b - 32, vw - 8, 3, '#c8a070');
    glass(x + 12, b - 44, 9, 12, '#f8f0a0'); R(x + 13, b - 40, 7, 7, LEMON);
    for (const i of [26, 32]) { glass(x + i, b - 38, 4, 6, '#f8f0a0'); }
    glass(x + vw - 18, b - 48, 6, 16, '#c8e8e0'); disc(x + vw - 15, b - 50, 2.5, '#d83040'); R(x + vw - 15.5, b - 48, 1, 6, '#58a838');
  } },
  // Kayl at 3: her lavender bass amp, Reya sat on it as always, her bass leaning on the side
  { id: 'bassamp', name: 'Bass amp', group: 'Friends', solo: true, w: 1, h: 1, price: 650, draw(x, b) {
    floorShadow(x, b, 32);
    line(x + 26, b - 2, x + 30, b - 60, '#5a3a2a', 2); ovalShade(x + 26, b - 14, 5, 9, '#7a58b0');
    panel(x + 3, b - 32, 22, 32, LAV); inset(x + 5, b - 26, 18, 22, '#3a3448'); disc(x + 14, b - 15, 7, '#2a2438'); disc(x + 14, b - 15, 2, '#4a4458');
    R(x + 5, b - 31, 18, 4, '#d0c0f0'); for (let i = 0; i < 5; i++) P(x + 7 + i * 3, b - 29, '#e0e0e8');
    cat(x + 14, b - 32, '#9a98a8', -1);
  } },
  // Kayl at 5: a record console, Currents spinning, lavender in a vase, Spooky asleep on the end with his tail hanging
  { id: 'vinylconsole', name: 'Record console', group: 'Friends', solo: true, w: 2, h: 1, price: 1100, draw(x, b, vw, dir) {
    const W = '#9a6a42';
    if (dir % 2) return side(x, b, vw, 28, W);
    floorShadow(x, b, vw);
    line(x + 8, b - 8, x + 5, b, INK, 2); line(x + vw - 8, b - 8, x + vw - 5, b, INK, 2);
    wood(x + 3, b - 28, vw - 6, 20, W); inset(x + 6, b - 25, vw / 2 - 8, 14, LAV); for (let j = 0; j < 14; j += 2) R(x + 6, b - 25 + j, vw / 2 - 8, 1, sh(LAV, -1));
    for (let i = 0; i < 7; i++) R(x + vw / 2 + 2 + i * 3, b - 24, 2, 12, ['#e84848', '#f0a040', '#4a78d0', '#a858d8', '#58b848'][i % 5]);
    R(x + 8, b - 31, 22, 3, '#3a3440'); oval(x + 19, b - 31, 9, 2, '#1a1a20'); disc(x + 19, b - 31.5, 2, '#f06a40'); line(x + 27, b - 33, x + 22, b - 31, '#c0c0c8', 1);
    cyl(x + 34, b - 38, 5, 10, '#f4f0f8'); for (let n = 0; n < 5; n++) { line(x + 36, b - 38, x + 32 + n * 2, b - 50, '#58884a', 1); disc(x + 32 + n * 2, b - 51, 1.4, VIOLET); }
    ovalShade(x + vw - 13, b - 32, 9, 4, '#2a2830'); ovalShade(x + vw - 19, b - 34, 4, 3.5, '#2a2830');
    for (const sx of [-1, 1]) tri(x + vw - 19 + sx * 2, b - 40, 3, '#2a2830', 0.6);
    for (let j = 0; j < 12; j++) disc(x + vw - 5 + Math.sin(j / 3) * 1.5, b - 30 + j, 3, '#3a3840');
  } },
  // Phil at 3: an iron candelabra burning violet, in a ring of salt, for when JONA's near
  { id: 'saltcandelabra', name: 'Salt-ring candelabra', group: 'Friends', solo: true, w: 1, h: 1, price: 560, glow: ['#c890ff'], draw(x, b) {
    floorShadow(x, b, 32);
    ring(x + 16, b - 2, 13, '#f4f4f0', 1);
    line(x + 16, b - 8, x + 9, b - 1, IRON, 2); line(x + 16, b - 8, x + 23, b - 1, IRON, 2); cyl(x + 15, b - 48, 3, 42, IRON);
    arc(x + 16, b - 44, 11, 8, 0, Math.PI, IRON, 2); arc(x + 16, b - 44, 6, 5, 0, Math.PI, IRON, 2);
    for (const i of [-11, -6, 0, 6, 11]) { const top = i ? b - 44 : b - 54; R(x + 15 + i, top - 8, 3, 8, '#f4ecd8'); ovalShade(x + 16.5 + i, top - 11, 1.8, 3, '#c890ff'); P(x + 16 + i, top - 10, '#ffffff'); }
  } },
  // Phil at 5: the chair nobody sits in, JONA's horns on its crest and her eye in the back
  { id: 'nobodychair', name: 'The chair nobody sits in', group: 'Friends', solo: true, w: 1, h: 1, price: 900, glow: ['#c060ff'], draw(x, b) {
    const W = '#2a1e2e';
    floorShadow(x + 2, b, 28);
    for (const i of [6, 23]) R(x + i, b - 20, 3, 20, W);
    panel(x + 4, b - 24, 24, 5, W); cushion(x + 5, b - 28, 22, 5, '#6a3a8a', 2);
    panel(x + 6, b - 74, 20, 48, W); cushion(x + 9, b - 68, 14, 38, '#6a3a8a', 3);
    for (const sx of [-1, 1]) { arc(x + 16 + sx * 12, b - 78, 4, 7, sx > 0 ? Math.PI : 0, sx > 0 ? Math.PI * 1.6 : -Math.PI * 0.6, '#1a1020', 2); }
    tri(x + 16, b - 82, 8, W, 1.2);
    oval(x + 16, b - 56, 4, 2.5, '#f4e8ff'); disc(x + 16, b - 56, 1.6, '#c060ff');
  } },
  // Ricky at 3: a coffee cart for 2 a.m., the pot on, three mugs (one with a moon on it)
  { id: 'coffeecart', name: '2 a.m. coffee cart', group: 'Friends', solo: true, w: 1, h: 1, price: 540, draw(x, b) {
    floorShadow(x, b, 32);
    for (const i of [4, 26]) R(x + i, b - 36, 2, 33, '#3a3440'); line(x + 26, b - 36, x + 30, b - 42, '#3a3440', 2);
    for (const i of [6, 24]) disc(x + i, b - 2, 2, INK);
    panel(x + 3, b - 14, 26, 3, BROWN); panel(x + 3, b - 38, 26, 3, BROWN);
    panel(x + 5, b - 60, 12, 22, '#2a2a30'); glass(x + 7, b - 47, 8, 9, '#6a3a1a'); R(x + 7, b - 58, 8, 3, '#e84848');
    for (const [i, c] of [[19, '#fbf6e8'], [24, NAVY]]) { cyl(x + i, b - 45, 4, 7, c); }
    disc(x + 26, b - 42, 1.4, MOON);
    R(x + 6, b - 24, 8, 10, '#8a5a34'); cyl(x + 18, b - 20, 4, 6, '#fbf6e8'); cyl(x + 18, b - 26, 4, 6, '#d8a060');
  } },
  // Ricky at 5: a moon lamp on a stand, his mug under it, like his badge
  { id: 'allnightmoon', name: 'All-nighter moon lamp', group: 'Friends', solo: true, w: 1, h: 1, price: 760, glow: [MOON], draw(x, b) {
    floorShadow(x, b, 32);
    line(x + 16, b - 34, x + 6, b, BROWN, 2); line(x + 16, b - 34, x + 26, b, BROWN, 2); line(x + 16, b - 34, x + 16, b, sh(BROWN, -1), 2);
    arc(x + 16, b - 46, 10, 10, 0.3, Math.PI - 0.3, BROWN, 2);
    sphere(x + 16, b - 54, 13, MOON); for (const [i, j, r] of [[-5, -4, 2.5], [4, 2, 3], [2, -8, 1.5], [-3, 6, 2]]) disc(x + 16 + i, b - 54 + j, r, sh(MOON, -1));
    cyl(x + 23, b - 8, 6, 8, BROWN); arc(x + 30, b - 4, 2, 2.5, -Math.PI / 2, Math.PI / 2, BROWN, 1); disc(x + 26, b - 5, 1.2, MOON);
  } },
  // Machew at 3: his katana on a lacquer stand (plastic, a price tag still on), a short sword under it
  { id: 'katanastand', name: 'Katana stand', group: 'Friends', solo: true, w: 1, h: 1, price: 700, draw(x, b) {
    floorShadow(x, b, 32);
    panel(x + 1, b - 4, 30, 4, INK); for (const i of [5, 25]) R(x + i, b - 24, 3, 20, INK);
    for (const [j, l] of [[-24, 30], [-15, 24]]) {
      R(x + 1, b + j, l - 9, 3, '#1a1418'); R(x + l - 8, b + j - 0.5, 1.5, 4, GOLD); R(x + l - 6.5, b + j, 7, 3, BLOOD);
      for (let i = 0; i < 3; i++) P(x + l - 6 + i * 2, b + j + 1, INK);
    }
    R(x + 24, b - 21, 1, 4, '#d0d0d0'); R(x + 22, b - 17, 5, 3, '#fbf6e8');
  } },
  // Machew at 5: a sandstone pillar to brood behind, his hood hung on it and a red banner down its front
  { id: 'broodpillar', name: 'Brooding pillar', group: 'Friends', solo: true, w: 1, h: 1, price: 1000, draw(x, b) {
    floorShadow(x, b, 32);
    panel(x + 3, b - 8, 26, 8, sh(SAND, -1)); cyl(x + 7, b - 80, 18, 72, SAND);
    for (const i of [10, 14, 18, 22]) R(x + i, b - 78, 1, 68, sh(SAND, -1));
    panel(x + 4, b - 88, 24, 8, sh(SAND, 1));
    R(x + 11, b - 78, 10, 40, BLOOD); tri(x + 16, b - 40, 4, BLOOD, 1.2); R(x + 11, b - 78, 10, 2, GOLD);
    line(x + 16, b - 66, x + 16, b - 52, '#e0e0e8', 1); R(x + 14, b - 54, 5, 1, GOLD);
    R(x + 25, b - 64, 3, 2, IRON); ovalShade(x + 27, b - 54, 4, 9, '#2a2228');
  } },
  // Jerome at 3: a neon palm tree, Vice City pink over a teal sunset, VI on its base
  { id: 'neonpalm', name: 'Neon palm', group: 'Friends', solo: true, w: 1, h: 1, price: 680, glow: [NEON, AQUA], draw(x, b) {
    floorShadow(x, b, 32);
    disc(x + 16, b - 34, 13, '#3a1838'); for (let j = 0; j < 4; j++) R(x + 4, b - 34 + j * 3, 24, 1, '#f06a40');
    disc(x + 16, b - 34, 11, '#f06a8a'); for (let j = 0; j < 4; j++) R(x + 5, b - 30 + j * 3, 22, 1.5, '#3a1838');
    line(x + 16, b - 8, x + 18, b - 52, NEON, 2);
    for (const [dx, dy] of [[-12, 6], [12, 6], [-10, -4], [10, -4], [0, -10]]) line(x + 18, b - 52, x + 18 + dx, b - 52 + dy, AQUA, 1.5);
    panel(x + 4, b - 8, 24, 8, '#1a1418'); words('VI', x + 16, b - 4, 6, NEON);
  } },
  // Jerome at 5: a safe from the heist, its door swung open, gold bars and cash inside and a GTA VI sticker
  { id: 'heistsafe', name: 'Heist safe', group: 'Friends', solo: true, w: 1, h: 1, price: 1100, draw(x, b) {
    floorShadow(x, b, 32);
    panel(x + 3, b - 40, 24, 38, STEEL); inset(x + 6, b - 36, 18, 30, '#2a3030');
    for (let n = 0; n < 3; n++) { R(x + 7 + n * 5, b - 12, 5, 4, GOLD); R(x + 9 + n * 5, b - 16, 5, 4, GOLD); }
    for (let n = 0; n < 3; n++) { R(x + 8, b - 32 + n * 5, 14, 4, '#58a858'); R(x + 13, b - 32 + n * 5, 3, 4, '#f4f4f0'); }
    panel(x + 24, b - 40, 6, 38, sh(STEEL, 1)); disc(x + 27, b - 22, 3, '#9aa8a8'); disc(x + 27, b - 22, 1.2, INK);
    for (const i of [6, 24]) R(x + i, b - 2, 3, 2, INK);
    R(x + 6, b - 46, 10, 6, '#e86aa0'); words('VI', x + 11, b - 43, 5, '#fbf6e8');
    R(x + 2, b - 3, 6, 3, GOLD);
  } },
];
