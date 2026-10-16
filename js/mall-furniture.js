/* mall-furniture.js  -  the Poké Mall's Furniture store (roadmap 5a): its front in the hall, glass with two of the day's
   pieces on show behind it, and its two 3D shop floors. Rebuilt as a grand showroom (2026-10-15, the user's ask: "much
   BIGGER and way more AESTHETIC, extravagant, AWESOME and ORGANIZED"): a room the Game Corner's size that the camera
   follows you round, the day's stock (furnitureStock()) sorted into eight departments, four a wing (Furnishings left,
   Décor & Art right), each piece near life size on a velvet-topped marble plinth with its department's plaque set in the
   floor in front and a price card in the department's colour; a marble nave down the middle, a carpet runner from the
   door to the lift under the store's crest, the counter left of it and Smeargle's painting right, a velvet rotunda seat with a bouquet, crystal
   chandeliers, arched windows with drapes, and Smeargle's easel (a grand piano upstairs) in the back corner. The second
   floor (`secretBase.upstairs`, bought once) is the same room in rose; its lift at the head of the nave is roped off until it's
   open. Painted smooth like the hall (fine()), the furniture in its own pixels (pieceArt()). js/mall-3d.js walks it (its
   own COLS x ROWS and door, like the Game Corner); this file only builds it. */

import { PIECES, pieceArt, furnitureStock, loadBase, UPSTAIRS_PRICE, KINDS_OF } from './secret-base.js';
import { tex, trim, bakeColours } from './hd2d.js';
import { furnitureModel } from './base-mesh.js';
import { shapeOf } from './base-shapes.js';
import { fine, texOf, words, star, mergeStatic } from './hub-3d.js';
import { RES, HD } from './base-paint.js';
import { hallKit } from './mall-hall.js';
import { calmFx } from './prefs.js';
import { smoothIcon } from './smooth-icons.js';

const PX = 1 / (16 * RES);   // one of a piece's painted pixels, in tiles
/* The room: `x` a thing's first tile, y 0 the back wall. The nave runs up the middle from the door to the counter, the
   wings either side of it hold the departments. */
const COLS = 21, ROWS = 13, NAVE = 10, DOOR = { x: NAVE, y: ROWS - 1 };
/* The lift between the floors (2026-10-09, the user's ask: the stair's steps were blocks under a smooth ramp, so your
   partner sank into every tread), at the head of the nave where the runner ends since 2026-10-16 (the user's ask: at
   the back right it stood behind the Plants stand, which hid your partner walking in): `x` its middle, `foot` the tile you stand on at its doors, `door` right in
   front of them and `inside` in its car. */
export const LIFT = { x: NAVE, foot: { x: NAVE, y: 2 }, door: { x: NAVE, y: 2 }, inside: { x: NAVE, y: 0.45 } };
const LIFT_W = 3, LIFT_D = 1.4, LIFT_H = 2.7, LIFT_DOOR = 2, DOORWAY = 1.3;   // its case, and its doorway's height and width
const COUNTER = { x: 6, y: 2, w: 3 };   // left of the lift, its front on row 2, the shopkeeper a tile behind its middle
const GALLERY = 13;                      // right of the lift: Smeargle's painting over a bench, a topiary each side
const ROTUNDA = { x: NAVE, y: 7 };      // the velvet seat's middle, 3 x 3 tiles
const CORNER = { x: 2, y: 0.6 };        // Smeargle's easel, or the piano upstairs, on tiles 1-3 of the back two rows
/* The departments, a 2 x 2 stand each: the tall kinds along the back row of each wing, so nothing in front hides them.
   `ink` colours its plaque and price cards, `step` is where you stand to look, `tall` how tall its piece may stand. */
const DEPTS = [
  { kind: 'Storage', name: 'STORAGE', x: 1, y: 3, ink: '#a8703c' },
  { kind: 'Lights', name: 'LIGHTING', x: 4, y: 3, ink: '#d8a020' },
  { kind: 'Seats', name: 'SEATING', x: 1, y: 7, ink: '#d04a5e' },
  { kind: 'Tables', name: 'TABLES', x: 4, y: 7, ink: '#3a7ac0' },
  { kind: 'Wall', name: 'WALL ART', x: 15, y: 3, ink: '#8a5ac8' },
  { kind: 'Plants', name: 'PLANTS', x: 18, y: 3, ink: '#3e9a4e' },
  { kind: 'Rugs', name: 'RUGS', x: 15, y: 7, ink: '#e07a3a' },
  { kind: 'Other', name: 'CURIOS', x: 18, y: 7, ink: '#2aa0a0' },
].map(d => ({ ...d, step: { x: d.x, y: d.y + 2 }, tall: d.y < 5 ? 2.3 : 1.7 }));
const DAIS = 1.84, DAIS_H = 0.16;   // a plinth's width (a little under its two tiles) and height
const GOLD = ['#fff4c4', '#f2c85a', '#c08a2a'];
const LOOK = {
  1: { ivory: ['#fdf9f0', '#f1e8d4'], damask: 'rgba(60,130,96,0.12)', panel: ['#2a7a5e', '#1b5642'], panelDark: '#123c2e',
    velvet: '#2e8a68', runner: ['#2a7c60', '#1c5a45'], inlay: ['#2f7a60', '#205642'], bloom: ['#ffffff', '#f4b8c8', '#f8e0a0'],
    parquet: ['#d6a266', '#c89258', '#e0b076'], gap: '#7a4a26', sky: ['#f8c878', '#f8a070', '#d07890'],
    trim: '#4fa45e', trimDark: '#347a44', dark: '#7a4c2a' },
  2: { ivory: ['#fff7f6', '#f6e4e4'], damask: 'rgba(200,96,128,0.12)', panel: ['#c0687f', '#984a62'], panelDark: '#6a2e44',
    velvet: '#d07490', runner: ['#c45a7a', '#9a3e5c'], inlay: ['#d88aa2', '#b86882'], bloom: ['#ffffff', '#f8d4e0', '#d8c0f0'],
    parquet: ['#ecd0b0', '#e2c2a0', '#f2dcc0'], gap: '#a8805e', sky: ['#3a3a7a', '#7a5aa8', '#e890b0'],
    trim: '#d0708a', trimDark: '#9a4a62', dark: '#7a4a4a' },
};
export const STORE_COLOUR = LOOK[1].trim;

/* Each floor's shopkeeper, who says every line in the store (the user's ask: "a shopkeeper, one of the Pokémon"):
   Smeargle paints the furniture, Minccino keeps the second floor spotless. */
export const KEEPERS = {
  1: { id: 'smeargle', name: 'Smeargle', src: 'assets/pokemon/smeargle-front.gif',
    hello: ['Welcome to my showroom! I painted every piece in here myself.', 'Fresh pieces in every department today, still wet! Kidding.', 'Have a look round. Tap a piece and I\'ll tell you about it.'],
    chat: ['Every colour of a piece comes with it. I can never pick just one.', 'New stock every day, the moment the clock strikes midnight.', 'A room is a canvas, you know. Your Secret Base is your masterpiece!',
      'Seats and tables on the left, décor on the right. A place for everything!', 'Build a backyard on your PC\'s House Upgrades, and tap me: I keep a garden catalogue too!'],
    // with a backyard, a tap opens the garden catalogue (js/garden-shop.js), the Yard shelf, always in stock
    special: (done) => import('./garden-shop.js').then(m => m.gardenTap(done)) },
  2: { id: 'minccino', name: 'Minccino', src: 'assets/pokemon/minccino-front.gif',
    hello: ['Welcome to the Rose Salon! Mind the... no, there\'s no dust. I checked.', 'Oh! A customer! Let me just polish that plinth. There.'],
    chat: ['I dust every plinth twice a day. Three times on Sundays.', 'Eight more pieces up here, every day. All spotless.', 'The chandeliers took me all morning. Worth it!'] },
};

const price = (n) => n.toLocaleString();

/* ---------- sorting the day's stock ---------- */

const fits = (d, p) => (d.kind === 'Other' ? KINDS_OF.Other(p) || KINDS_OF.Dolls(p) : KINDS_OF[d.kind](p));

/** The day's pieces sorted into the departments, one a stand: a piece goes where it fits, moving another to its other
    fit if it must; any that fit nowhere left fill the empty stands. A piece (or null) for each of DEPTS. */
function sortIn(stock) {
  const at = DEPTS.map(() => null);
  const place = (id, seen) => DEPTS.some((d, i) => {
    if (seen.has(i) || !fits(d, PIECES[id])) return false;
    seen.add(i);
    if (at[i] !== null && !place(at[i], seen)) return false;
    at[i] = id;
    return true;
  });
  const left = stock.filter(id => !place(id, new Set()));
  return at.map(id => id ?? left.shift() ?? null);
}

/** A stand's department: its own, or the one its piece belongs to when it only filled a gap. */
const deptOf = (d, id) => (!id || fits(d, PIECES[id]) ? d : DEPTS.find(e => fits(e, PIECES[id])) ?? DEPTS.at(-1));

/* ---------- the front, in the hall ---------- */

/** A sofa, the store's sign: two arms, a back and a seat. */
function sofa(g, x, y, r, col) {
  g.fillStyle = col;
  g.beginPath(); g.roundRect(x - r, y - r * 0.5, r * 2, r * 0.9, r * 0.25); g.fill();
  g.beginPath(); g.roundRect(x - r * 1.25, y - r * 0.1, r * 0.5, r * 0.9, r * 0.2); g.fill();
  g.beginPath(); g.roundRect(x + r * 0.75, y - r * 0.1, r * 0.5, r * 0.9, r * 0.2); g.fill();
  g.beginPath(); g.roundRect(x - r * 0.8, y + 0.2 * r, r * 1.6, r * 0.6, r * 0.15); g.fill();
}

/** The front on the hall's back wall, between x0 and x1 (the painting's units) from `top` to `foot`: a teal fascia saying
    FURNITURE, two warm-lit display windows (the pieces in them are real, set in front of this) and a glass door. */
export function frontArt(f, s, x0, x1, top, foot, closed = false) {
  const { g, rr, lin } = f, L = LOOK[1], mid = (x0 + x1) / 2;
  rr(x0, top, x1 - x0, foot - top, 0, '#4a3a2e');
  rr(x0, top, x1 - x0, 12, 1, lin(0, top, 0, top + 12, [L.trim, L.trim, L.dark]));
  rr(x0 + 2, top + 2, x1 - x0 - 4, 8, 1, '#ffffff');
  sofa(g, x0 + 9, top + 6.4, 2.6, L.trim);
  words(g, 'FURNITURE', mid + 4, top + 6.2, 5.4, L.dark);
  s.fillStyle = '#c8c8c8'; s.beginPath(); s.roundRect(x0 + 2, top + 2, x1 - x0 - 4, 8, 1); s.fill();
  words(s, 'FURNITURE', mid + 4, top + 6.2, 5.4, '#40a0a0');
  const wt = top + 14, wb = foot - 4, dw = 14;
  for (const [a, b] of [[x0 + 2, mid - dw / 2 - 1.5], [mid + dw / 2 + 1.5, x1 - 2]]) {
    rr(a, wt, b - a, wb - wt, 0.8, lin(0, wt, 0, wb, ['#fff4d0', '#ffd890', '#e8b070']));
    g.fillStyle = 'rgba(120,70,40,0.18)'; g.fillRect(a, wb - 6, b - a, 6);   // the display's back, under the pieces
    s.fillStyle = '#a08060'; s.fillRect(a, wt, b - a, wb - wt - 6);
    rr(a - 0.6, wb, b - a + 1.2, 4, 0.4, '#e8dcc4');
  }
  rr(mid - dw / 2, wt - 2, dw, foot - wt + 2, 0.6, '#3a3a44');
  rr(mid - dw / 2 + 1.2, wt - 0.8, dw - 2.4, foot - wt + 0.8, 0.4, lin(0, wt, 0, foot, ['#cfeaff', '#9ac8e8', '#7aa8c8']));
  g.fillStyle = '#3a3a44'; g.fillRect(mid - 0.4, wt - 0.8, 0.8, foot - wt);
  for (const x of [mid - 2.4, mid + 1.6]) rr(x, (wt + foot) / 2, 0.8, 5, 0.4, '#d8dce6');
  rr(mid - 4.5, wt + 3, 9, 3.6, 0.8, '#ffffff');
  words(g, closed ? 'CLOSED' : 'OPEN', mid, wt + 4.9, 2.6, closed ? '#c83828' : L.trim);
}

/** Two of today's pieces in the front's windows (uprights, so they read as themselves), with the glass in front of them
    and a sill under each. `cx` is the front's middle, `z` the wall's face. */
export function frontWindow(THREE, cx, z) {
  const group = new THREE.Group(), stock = furnitureStock(), shown = stock.filter(id => !PIECES[id].flat && !PIECES[id].wall);
  const picks = [...shown, 'plant', 'lamp'].slice(0, 2);
  // painted once the hall is up, one a moment, at half HD (they stand a hand high): painting both while the hall was
  // being built held the way in for up to a second (2026-10-12, the user saw the mall stutter as it opened)
  const later = (fn) => (self.requestIdleCallback ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 400));
  picks.forEach((id, i) => setTimeout(() => later(() => {
    const cut = trim(pieceArt(id, 0, HD / 2)), w = cut.w * PX, h = cut.h * PX, k = Math.min(1, 0.78 / w, 1.15 / h);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w * k, h * k), new THREE.MeshStandardMaterial({ map: tex(cut.c), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1 }));
    m.position.set(cx + (i ? 1 : -1), 0.42 + h * k / 2, z + 0.12);
    m.userData.front = group.userData.front;
    group.add(m);
  }), 700 + i * 350));
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 1.95), new THREE.MeshStandardMaterial({ color: '#d8f0ff', transparent: true, opacity: 0.16, roughness: 0.05, metalness: 0.3, depthWrite: false }));
  glass.position.set(cx, 0.98, z + 0.3);
  group.add(glass);
  return group;
}

/* ---------- the walls ---------- */

/** Nook's leaf, the store's mark: a leaf on its tip with a curled stalk and a vein. */
function leaf(g, x, y, r, col) {
  g.fillStyle = col;
  g.beginPath(); g.moveTo(x, y + r); g.bezierCurveTo(x - r * 1.2, y + r * 0.2, x - r * 0.6, y - r * 0.9, x, y - r);
  g.bezierCurveTo(x + r * 0.6, y - r * 0.9, x + r * 1.2, y + r * 0.2, x, y + r); g.fill();
  g.strokeStyle = '#fbf3e0'; g.lineWidth = r * 0.14;
  g.beginPath(); g.moveTo(x, y + r * 0.8); g.lineTo(x, y - r * 0.6); g.stroke();
  g.strokeStyle = col; g.lineWidth = r * 0.2;
  g.beginPath(); g.moveTo(x, y + r); g.quadraticCurveTo(x + r * 0.2, y + r * 1.5, x + r * 0.6, y + r * 1.4); g.stroke();
}

/** Damask: a small fleur on a half-drop grid, in one soft tone, between heights y0 and y1 of the painting. */
function damask(g, W, y0, y1, col) {
  const S = 15;
  g.fillStyle = col;
  for (let r = 0, y = y0 + S * 0.5; y < y1 - 4; r++, y += S * 0.62) for (let x = (r % 2) * S / 2; x < W + S; x += S) {
    g.beginPath(); g.ellipse(x, y, 1.3, 3.2, 0, 0, Math.PI * 2); g.fill();
    for (const s of [-1, 1]) { g.beginPath(); g.ellipse(x + s * 2.4, y + 1.4, 0.9, 2.3, s * 0.75, 0, Math.PI * 2); g.fill(); }
    g.beginPath(); g.moveTo(x, y - 5.6); g.lineTo(x + 1, y - 4.4); g.lineTo(x, y - 3.4); g.lineTo(x - 1, y - 4.4); g.fill();
    g.fillRect(x - 2.2, y + 3.6, 4.4, 0.6);
  }
}

/** A wall of the showroom, `W` wide: ivory damask over a dado of lacquered panels outlined in gold, a gold chair rail, a
    dark skirting, and a white cornice with dentils and a gold bead, coffers above it. `wy` turns a height into the
    painting's y. */
function grand(f, W, H, L, wy) {
  const { g, rr, lin } = f;
  g.fillStyle = lin(0, 0, 0, H, [L.ivory[1], L.ivory[0], L.ivory[0], L.ivory[1]]); g.fillRect(0, 0, W, H);
  const cornice = wy(5.4), rail = wy(1.3), sk = wy(0.22);
  damask(g, W, cornice + 2, rail - 2, L.damask);
  for (let x = 2; x < W; x += 16) {
    rr(x, cornice - 26, 13, 16, 1, 'rgba(150,120,80,0.1)');
    g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(x, cornice - 10.6, 13, 0.6);
  }
  rr(0, rail, W, sk - rail, 0, lin(0, rail, 0, sk, L.panel));
  const n = Math.floor((W - 2) / 24), x0 = (W - n * 24 + 4) / 2;
  for (let i = 0; i < n; i++) {
    const x = x0 + i * 24;
    rr(x, rail + 3.4, 20, sk - rail - 6.4, 1, 'rgba(255,255,255,0.06)');
    g.strokeStyle = GOLD[1]; g.lineWidth = 0.6; g.beginPath(); g.roundRect(x, rail + 3.4, 20, sk - rail - 6.4, 1); g.stroke();
    g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 0.4; g.beginPath(); g.roundRect(x + 1.4, rail + 4.8, 17.2, sk - rail - 9.2, 0.6); g.stroke();
  }
  rr(0, rail - 2, W, 3, 0.6, lin(0, rail - 2, 0, rail + 1, GOLD));
  rr(0, sk, W, H - sk, 0, lin(0, sk, 0, H, [L.panelDark, '#140c0a']));
  g.fillStyle = GOLD[1]; g.fillRect(0, sk, W, 0.7);
  rr(0, cornice - 7, W, 8, 0, lin(0, cornice - 7, 0, cornice + 1, ['#ffffff', L.ivory[0], '#d6c8ac']));
  g.fillStyle = 'rgba(140,110,70,0.35)';
  for (let x = 0.6; x < W; x += 3) g.fillRect(x, cornice - 4.2, 1.6, 2.4);
  rr(0, cornice + 0.4, W, 1.6, 0.4, lin(0, cornice + 0.4, 0, cornice + 2, GOLD));
}

/** A fluted white marble pilaster from the skirting to the cornice, on a gold-ringed plinth, under a gold Ionic capital. */
function pilaster(f, x, wy, w = 9) {
  const { g, rr, lin } = f, top = wy(5.4) + 2, foot = wy(0.22);
  rr(x - w / 2 - 1.4, foot - 8, w + 2.8, 8, 0.4, lin(0, foot - 8, 0, foot, ['#fffaf0', '#d8ccb6']));
  rr(x - w / 2 - 0.8, foot - 9.4, w + 1.6, 1.6, 0.6, lin(0, foot - 9.4, 0, foot - 7.8, GOLD));
  rr(x - w / 2, top + 5, w, foot - top - 14.4, 0, lin(x - w / 2, 0, x + w / 2, 0, ['#ddd4c2', '#ffffff', '#f4eee2', '#d2c6b0']));
  g.fillStyle = 'rgba(140,120,90,0.22)';
  for (let i = 1; i < 4; i++) g.fillRect(x - w / 2 + i * w / 4 - 0.4, top + 7, 0.8, foot - top - 18.4);
  rr(x - w / 2 - 1.8, top, w + 3.6, 5, 0.8, lin(0, top, 0, top + 5, GOLD));
  for (const sx of [-1, 1]) {
    g.fillStyle = GOLD[1]; g.beginPath(); g.arc(x + sx * (w / 2 + 0.6), top + 3.2, 2, 0, Math.PI * 2); g.fill();
    g.strokeStyle = GOLD[2]; g.lineWidth = 0.4; g.beginPath(); g.arc(x + sx * (w / 2 + 0.6), top + 3.2, 1.1, 0, Math.PI * 1.6); g.stroke();
  }
}

/** A tall arched window: a gold frame, sky, a cloud and a far green hill through it (lit), gold glazing bars fanning in
    the arch, a white sill, and drapes in the floor's colour on a gold rod, swagged across the top and tied back. */
function archWindow(f, s, cx, top, foot, w, L) {
  const { g, rr, lin } = f, r = w / 2;
  const arch = (c, k) => { c.beginPath(); c.moveTo(cx - r - k, foot); c.lineTo(cx - r - k, top + r); c.arc(cx, top + r, r + k, Math.PI, 0); c.lineTo(cx + r + k, foot); c.closePath(); };
  g.save(); g.translate(1, 1.2); g.fillStyle = 'rgba(60,40,20,0.2)'; arch(g, 2.2); g.fill(); g.restore();
  g.fillStyle = lin(0, top, 0, foot, GOLD); arch(g, 2.2); g.fill();
  g.fillStyle = lin(0, top, 0, foot, ['#7cbcf0', '#b4dcf8', '#eaf6ff']); arch(g, 0); g.fill();
  g.save(); arch(g, 0); g.clip();
  g.fillStyle = 'rgba(255,255,255,0.85)';
  for (const [dx, dy, cr] of [[-3, 0, 3], [0.5, -1, 4], [4, 0.4, 2.8]]) { g.beginPath(); g.arc(cx + dx, top + r * 1.4 + dy, cr, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = '#90c478'; g.beginPath(); g.moveTo(cx - r, foot);
  for (let x = -r; x <= r + 1; x += 2) g.lineTo(cx + x, foot - 8 - Math.sin(x * 0.3) * 2 - Math.cos(x * 0.13) * 2);
  g.lineTo(cx + r, foot); g.fill();
  g.fillStyle = '#6aa858'; g.fillRect(cx - r, foot - 3, w, 3);
  g.restore();
  s.fillStyle = '#4a6078'; arch(s, 0); s.fill();
  g.strokeStyle = GOLD[1]; g.lineWidth = 0.8;
  g.beginPath(); g.moveTo(cx, top); g.lineTo(cx, foot); g.moveTo(cx - r, top + r); g.lineTo(cx + r, top + r);
  for (let y = top + r + 9; y < foot - 2; y += 9) { g.moveTo(cx - r, y); g.lineTo(cx + r, y); }
  for (const a of [0.25, 0.75]) { g.moveTo(cx, top + r); g.lineTo(cx + Math.cos(Math.PI + a * Math.PI) * r, top + r + Math.sin(Math.PI + a * Math.PI) * r); }
  g.stroke();
  rr(cx - r - 4, foot, w + 8, 2.6, 0.8, lin(0, foot, 0, foot + 2.6, ['#ffffff', '#d8ccb4']));
  // the drapes, tied back with gold cord and a tassel
  const tie = top + (foot - top) * 0.58;
  for (const sd of [-1, 1]) {
    const out = cx + sd * (r + 6), inn = cx + sd * (r - 4);
    g.fillStyle = lin(out, 0, inn, 0, [L.panel[1], L.panel[0], L.panel[1]]);
    g.beginPath(); g.moveTo(out, top - 5); g.lineTo(inn, top - 5);
    g.quadraticCurveTo(inn, tie - 10, cx + sd * (r + 0.5), tie);
    g.quadraticCurveTo(cx + sd * (r - 1), foot - 6, cx + sd * (r - 2), foot + 4);
    g.lineTo(out + sd * 1.5, foot + 4); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.2)'; g.lineWidth = 0.5;
    for (let k = 1; k < 3; k++) { const fx = out - sd * k * 1.8; g.beginPath(); g.moveTo(fx, top - 4); g.lineTo(fx, tie - 2); g.moveTo(fx + sd * 0.4, tie + 2); g.lineTo(fx + sd * 0.8, foot + 3); g.stroke(); }
    const tx = cx + sd * (r + 1.5);
    g.fillStyle = GOLD[1]; g.beginPath(); g.ellipse(tx, tie, 2.6, 1.1, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.moveTo(tx - 0.9, tie + 0.8); g.lineTo(tx + 0.9, tie + 0.8); g.lineTo(tx + 1.3, tie + 4.6); g.lineTo(tx - 1.3, tie + 4.6); g.fill();
  }
  g.fillStyle = L.panel[0];
  g.beginPath(); g.moveTo(cx - r - 7, top - 6); g.lineTo(cx + r + 7, top - 6); g.lineTo(cx + r + 7, top - 2);
  g.quadraticCurveTo(cx + r / 2, top + 8, cx, top + 1); g.quadraticCurveTo(cx - r / 2, top + 8, cx - r - 7, top - 2); g.closePath(); g.fill();
  g.fillStyle = GOLD[1];   // the swag's fringe
  for (const sd of [-1, 1]) for (let i = 0; i <= 10; i++) {
    const t = i / 10, ax = cx + sd * (r + 7), bx = cx + sd * r / 2, ex = cx, ay = top - 2, by = top + 8, ey = top + 1;
    const x = (1 - t) ** 2 * ax + 2 * (1 - t) * t * bx + t * t * ex, y = (1 - t) ** 2 * ay + 2 * (1 - t) * t * by + t * t * ey;
    g.fillRect(x - 0.3, y, 0.6, 1.6);
  }
  rr(cx - r - 9, top - 7.6, w + 18, 1.6, 0.8, lin(0, top - 7.6, 0, top - 6, GOLD));
  for (const sd of [-1, 1]) { g.beginPath(); g.arc(cx + sd * (r + 9.4), top - 6.8, 1.6, 0, Math.PI * 2); g.fill(); }
}

/** A wall sconce: a soft pool of light on the wall, a gold backplate, two curled arms and their frosted tulip shades, lit. */
function sconce(f, s, x, y) {
  const { g, rr, lin } = f;
  const halo = g.createRadialGradient(x, y - 3, 0, x, y - 3, 15);
  halo.addColorStop(0, 'rgba(255,226,150,0.4)'); halo.addColorStop(1, 'rgba(255,226,150,0)');
  g.fillStyle = halo; g.fillRect(x - 15, y - 18, 30, 30);
  rr(x - 1.4, y - 2, 2.8, 7, 1.4, lin(0, y - 2, 0, y + 5, GOLD));
  g.strokeStyle = GOLD[1]; g.lineWidth = 0.9;
  for (const sd of [-1, 1]) {
    g.beginPath(); g.moveTo(x, y + 2.5); g.quadraticCurveTo(x + sd * 4.5, y + 4, x + sd * 4.5, y - 1); g.stroke();
    const bx = x + sd * 4.5, by = y - 3.4;
    for (const c of [g, s]) {
      c.fillStyle = c === g ? lin(0, by - 3, 0, by + 2, ['#fffbe8', '#ffe2a0']) : '#ffe8a8';
      c.beginPath(); c.moveTo(bx - 2.2, by + 2); c.quadraticCurveTo(bx - 2.6, by - 2.8, bx, by - 3); c.quadraticCurveTo(bx + 2.6, by - 2.8, bx + 2.2, by + 2); c.closePath(); c.fill();
    }
    rr(bx - 1.4, by + 1.6, 2.8, 1, 0.4, GOLD[2]);
  }
}

/** A wing's sign hung from the cornice on two gold chains (with `wy`; without, flat on the wall): a lacquered board in a
    gold frame, its name in lit gold. */
function wingSign(f, s, cx, top, w, h, L, text, wy = null) {
  const { g, rr, lin } = f;
  g.strokeStyle = GOLD[2]; g.lineWidth = 0.7; g.setLineDash([1.2, 0.8]);
  if (wy) for (const x of [cx - w / 2 + 8, cx + w / 2 - 8]) { g.beginPath(); g.moveTo(x, wy(5.4) + 2); g.lineTo(x, top); g.stroke(); }
  g.setLineDash([]);
  rr(cx - w / 2 + 1, top + 1.4, w, h, 3, 'rgba(40,20,10,0.25)');
  rr(cx - w / 2, top, w, h, 3, lin(0, top, 0, top + h, GOLD));
  rr(cx - w / 2 + 1.3, top + 1.3, w - 2.6, h - 2.6, 2.2, lin(0, top, 0, top + h, L.panel));
  g.strokeStyle = 'rgba(255,230,160,0.6)'; g.lineWidth = 0.35; g.beginPath(); g.roundRect(cx - w / 2 + 2.4, top + 2.4, w - 4.8, h - 4.8, 1.6); g.stroke();
  words(g, text, cx, top + h / 2 + 0.4, h * 0.46, GOLD[0]);
  words(s, text, cx, top + h / 2 + 0.4, h * 0.46, '#a08040');
  g.fillStyle = GOLD[1];
  for (const sd of [-1, 1]) star(g, cx + sd * (w / 2 - 6), top + h / 2, 2.4);
}

/** The store's crest over the counter: a lacquered board framed in gold with a scroll each end, under a gold medallion
    ringed with pearls with the leaf in it, the store's name in lit gold and the floor's own small under it. */
function crest(f, s, cx, top, w, h, L, floor) {
  const { g, rr, lin } = f, name = floor === 1 ? 'FURNITURE' : 'FURNITURE 2F', sub = floor === 1 ? 'THE GRAND SHOWROOM' : 'THE ROSE SALON';
  rr(cx - w / 2 + 1, top + 1.6, w, h, 4, 'rgba(40,20,10,0.25)');
  for (const sd of [-1, 1]) {
    g.fillStyle = GOLD[1]; g.beginPath(); g.arc(cx + sd * (w / 2 + 1), top + h / 2, 4, 0, Math.PI * 2); g.fill();
    g.fillStyle = L.panel[1]; g.beginPath(); g.arc(cx + sd * (w / 2 + 1), top + h / 2, 2.2, 0, Math.PI * 2); g.fill();
  }
  rr(cx - w / 2, top, w, h, 4, lin(0, top, 0, top + h, GOLD));
  rr(cx - w / 2 + 1.6, top + 1.6, w - 3.2, h - 3.2, 3, lin(0, top, 0, top + h, L.panel));
  g.strokeStyle = 'rgba(255,230,160,0.6)'; g.lineWidth = 0.4; g.beginPath(); g.roundRect(cx - w / 2 + 3, top + 3, w - 6, h - 6, 2); g.stroke();
  const my = top, mr = 6.6;
  g.fillStyle = GOLD[0];
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; g.beginPath(); g.arc(cx + Math.cos(a) * (mr + 1.4), my + Math.sin(a) * (mr + 1.4), 0.7, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = lin(0, my - mr, 0, my + mr, GOLD); g.beginPath(); g.arc(cx, my, mr, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#fbf3e0'; g.beginPath(); g.arc(cx, my, mr - 1.5, 0, Math.PI * 2); g.fill();
  leaf(g, cx, my - 0.4, mr - 3.2, L.trim);
  g.font = `900 ${h * 0.34}px "Trebuchet MS", sans-serif`;
  const fs = h * 0.34 * Math.min(1, (w - 10) / g.measureText(name).width);
  words(g, name, cx, top + h * 0.52, fs, GOLD[0]);
  words(s, name, cx, top + h * 0.52, fs, '#c8a050');
  words(g, sub, cx, top + h * 0.8, h * 0.12, 'rgba(255,240,200,0.9)');
}

/** Smeargle's own painting behind the counter, in a carved gold frame with rosettes at its corners: a Poké Ball sun
    setting over hills and a lake downstairs, a moonlit night upstairs, signed on a brass plate under it. */
function masterpiece(f, cx, top, w, h, L, floor) {
  const { g, rr, lin } = f, x = cx - w / 2;
  rr(x + 1.2, top + 1.6, w, h, 1, 'rgba(40,20,10,0.3)');
  rr(x - 2.6, top - 2.6, w + 5.2, h + 5.2, 1.4, lin(x, top, x + w, top + h, [GOLD[0], GOLD[1], GOLD[2], GOLD[1], GOLD[0]]));
  g.strokeStyle = GOLD[2]; g.lineWidth = 0.5; g.strokeRect(x - 1, top - 1, w + 2, h + 2);
  for (const [px, py] of [[x - 1.3, top - 1.3], [x + w + 1.3, top - 1.3], [x - 1.3, top + h + 1.3], [x + w + 1.3, top + h + 1.3]]) {
    g.fillStyle = GOLD[0]; g.beginPath(); g.arc(px, py, 2.4, 0, Math.PI * 2); g.fill();
    g.fillStyle = GOLD[2]; g.beginPath(); g.arc(px, py, 1, 0, Math.PI * 2); g.fill();
  }
  g.save(); g.beginPath(); g.rect(x, top, w, h); g.clip();
  g.fillStyle = lin(0, top, 0, top + h * 0.7, L.sky); g.fillRect(x, top, w, h);
  const sx = cx + w * 0.2, sy = top + h * 0.5, sr = h * 0.18;
  if (floor === 1) {
    g.fillStyle = '#e86a58'; g.beginPath(); g.arc(sx, sy, sr, Math.PI, 0); g.fill();
    g.fillStyle = '#fff6e0'; g.beginPath(); g.arc(sx, sy, sr, 0, Math.PI); g.fill();
    g.fillStyle = '#5a3030'; g.fillRect(sx - sr, sy - 0.4, sr * 2, 0.8);
    g.fillStyle = '#fff6e0'; g.beginPath(); g.arc(sx, sy, sr * 0.3, 0, Math.PI * 2); g.fill();
  } else {
    g.fillStyle = '#fff8e0'; g.beginPath(); g.arc(sx, sy - h * 0.18, sr * 0.8, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,255,240,0.9)';
    for (let i = 0; i < 18; i++) g.fillRect(x + (i * 37 % w), top + (i * 13 % (h * 0.5)), 0.7, 0.7);
  }
  const hill = (y0, amp, col) => {
    g.fillStyle = col; g.beginPath(); g.moveTo(x, top + h);
    for (let t = 0; t <= w; t += 2) g.lineTo(x + t, top + h * y0 - Math.sin(t * 0.09 + y0 * 9) * amp - Math.sin(t * 0.21) * amp * 0.4);
    g.lineTo(x + w, top + h); g.fill();
  };
  hill(0.62, 3, floor === 1 ? '#9a7ab0' : '#4a3a70');
  hill(0.74, 2.4, floor === 1 ? '#5a9a5a' : '#3a5a6a');
  g.fillStyle = floor === 1 ? 'rgba(255,230,200,0.55)' : 'rgba(200,200,255,0.4)';
  g.beginPath(); g.ellipse(cx - w * 0.1, top + h * 0.9, w * 0.3, h * 0.07, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 0.8;   // brush strokes
  for (let i = 0; i < 16; i++) { const bx = x + (i * 29 % w), by = top + (i * 17 % h); g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + 3, by - 0.6); g.stroke(); }
  g.restore();
  rr(cx - 9, top + h + 3.4, 18, 3.4, 0.6, lin(0, top + h + 3.4, 0, top + h + 6.8, GOLD));
  words(g, 'SMEARGLE', cx, top + h + 5.2, 2.2, '#5a3a10');
}

/** A gold-framed arched mirror for the side walls, silvered with a soft streak of light across it. */
function mirror(f, cx, top, foot, w) {
  const { g, lin } = f, r = w / 2;
  const arch = (k) => { g.beginPath(); g.moveTo(cx - r - k, foot); g.lineTo(cx - r - k, top + r); g.arc(cx, top + r, r + k, Math.PI, 0); g.lineTo(cx + r + k, foot); g.closePath(); };
  g.fillStyle = lin(0, top, 0, foot, GOLD); arch(2.2); g.fill();
  g.fillStyle = lin(cx - r, top, cx + r, foot, ['#e8eef4', '#c4d0dc', '#eef2f6', '#b8c4d0']); arch(0); g.fill();
  g.save(); arch(0); g.clip();
  g.fillStyle = 'rgba(255,255,255,0.45)';
  g.beginPath(); g.moveTo(cx - r, foot - 6); g.lineTo(cx - r + 6, foot - 6); g.lineTo(cx + r, top + 8); g.lineTo(cx + r - 6, top + 8); g.fill();
  g.restore();
}

/** A floor's back wall, one painting: the showroom's wall, pilasters at the nave's edges, arched windows in the wings
    under each wing's sign, the crest and Smeargle's painting over the counter between two sconces. */
function wallArt(floor, { top: TOP, u: U }) {
  const W = (COLS + 0.8) * U, H = TOP * U, L = LOOK[floor], f = fine(W, H, 4), s = f.shine();
  const wx = (t) => (t + 0.4) * U, wy = (y) => (TOP - y) * U;
  grand(f, W, H, L, wy);
  for (const t of [0.1, 20.9]) pilaster(f, wx(t), wy);
  for (const t of [2, 5.1, 16]) archWindow(f, s, wx(t), wy(3.55), wy(1.55), 1.3 * U, L);
  wingSign(f, s, wx(3.55), wy(4.45), 3.6 * U, 0.6 * U, L, 'FURNISHINGS', wy);
  wingSign(f, s, wx(16), wy(4.45), 2.9 * U, 0.6 * U, L, 'DÉCOR & ART', wy);
  sconce(f, s, wx(20.2), wy(2.3));
  masterpiece(f, wx(GALLERY + 0.5), wy(2.15), 2.1 * U, 1.05 * U, L, floor);
  wingSign(f, s, wx(COUNTER.x + COUNTER.w / 2), wy(1.95), 1.9 * U, 0.5 * U, L, 'CASHIER');
  return f.c;
}

/** A side wall's inside, the same wall: pilasters, two arched mirrors and a sconce at each end (the left one's painting
    starts at the room's front, the right one's at the back). */
function sideArt(floor, left, { top: TOP, u: U }) {
  const W = ROWS * U, H = TOP * U, L = LOOK[floor], f = fine(W, H, 3), s = f.shine();
  const wy = (y) => (TOP - y) * U, at = (t) => (left ? ROWS - t - 0.5 : t + 0.5) * U;
  grand(f, W, H, L, wy);
  for (const t of [2.5, 6, 9.5]) pilaster(f, at(t), wy, 8);
  for (const t of [4.25, 7.75]) mirror(f, at(t), wy(3.6), wy(1.5), 1.4 * U);
  for (const t of [1.1, 10.9]) sconce(f, s, at(t), wy(2.4));
  return f.c;
}

/* ---------- the floor ---------- */

/** A department's little picture, in `col` on its coloured disc. */
function icon(g, kind, x, y, r, col) {
  g.fillStyle = col; g.strokeStyle = col;
  if (kind === 'Seats') return sofa(g, x, y - r * 0.1, r * 0.6, col);
  if (kind === 'Plants') return leaf(g, x, y - r * 0.15, r * 0.75, col);
  if (kind === 'Other') return star(g, x, y, r * 0.95);
  if (kind === 'Tables') {
    g.fillRect(x - r * 0.95, y - r * 0.45, r * 1.9, r * 0.3);
    for (const sx of [-0.75, 0.55]) g.fillRect(x + sx * r, y - r * 0.2, r * 0.2, r * 0.95);
  } else if (kind === 'Storage') {
    g.fillRect(x - r * 0.8, y - r * 0.8, r * 1.6, r * 1.6);
    g.fillStyle = 'rgba(0,0,0,0.35)';
    g.fillRect(x - r * 0.8, y - r * 0.06, r * 1.6, r * 0.12);
    for (const dy of [-0.48, 0.3]) g.fillRect(x - r * 0.18, y + dy * r, r * 0.36, r * 0.16);
  } else if (kind === 'Lights') {
    g.beginPath(); g.moveTo(x - r * 0.4, y - r * 0.9); g.lineTo(x + r * 0.4, y - r * 0.9); g.lineTo(x + r * 0.75, y - r * 0.1); g.lineTo(x - r * 0.75, y - r * 0.1); g.fill();
    g.fillRect(x - r * 0.09, y - r * 0.1, r * 0.18, r * 0.8);
    g.fillRect(x - r * 0.45, y + r * 0.68, r * 0.9, r * 0.2);
  } else if (kind === 'Rugs') {
    g.fillRect(x - r * 0.72, y - r * 0.55, r * 1.44, r * 1.1);
    for (let i = -2; i <= 2; i++) for (const sx of [-0.95, 0.75]) g.fillRect(x + sx * r, y + i * r * 0.22 - r * 0.04, r * 0.2, r * 0.08);
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x - r * 0.42, y - r * 0.25, r * 0.84, r * 0.5);
  } else if (kind === 'Wall') {
    g.lineWidth = r * 0.2; g.strokeRect(x - r * 0.8, y - r * 0.7, r * 1.6, r * 1.4);
    g.beginPath(); g.moveTo(x - r * 0.6, y + r * 0.5); g.lineTo(x - r * 0.1, y - r * 0.2); g.lineTo(x + r * 0.2, y + r * 0.15);
    g.lineTo(x + r * 0.6, y - r * 0.1); g.lineTo(x + r * 0.6, y + r * 0.5); g.fill();
  }
}

/** A department's plaque set in the floor: gold-rimmed lacquer, its picture on a disc of its colour, its name in gold. */
function plaque(f, x, y, w, h, d, L) {
  const { g, rr, lin } = f;
  rr(x + 0.3, y + 0.5, w, h, 1.2, 'rgba(40,20,10,0.3)');
  rr(x, y, w, h, 1.2, lin(0, y, 0, y + h, GOLD));
  rr(x + 0.7, y + 0.7, w - 1.4, h - 1.4, 0.8, lin(0, y, 0, y + h, L.panel));
  const r = h / 2 - 1, ix = x + 1.4 + r, iy = y + h / 2;
  g.fillStyle = d.ink; g.beginPath(); g.arc(ix, iy, r, 0, Math.PI * 2); g.fill();
  g.strokeStyle = GOLD[1]; g.lineWidth = 0.35; g.stroke();
  icon(g, d.kind, ix, iy, r * 0.7, '#ffffff');
  words(g, d.name, (ix + r + x + w) / 2, iy + 0.2, h * 0.5, GOLD[0]);
}

/** The floor: chevron parquet in the wings, a nave of marble set on the diagonal between gold strips, a carpet runner
    up it from the door to the counter, a compass-star medallion under the rotunda, a plaque in front of every stand, a
    welcome mat at the door and a mat at the lift's doors. `depts` says which department each stand is today. */
function floorArt(floor, depts) {
  const T = 16, W = COLS * T, H = ROWS * T, L = LOOK[floor], f = fine(W, H, 5), { g, rr, lin } = f;
  g.fillStyle = L.gap; g.fillRect(0, 0, W, H);
  const cw = 8, pw = 2.6;
  for (let c = 0; c * cw < W; c++) {
    const x0 = c * cw, dy = (c % 2 ? 1 : -1) * cw * 0.6;
    for (let y = -cw, n = 0; y < H + cw; y += pw, n++) {
      g.fillStyle = L.parquet[(c * 7 + n * 3) % 3];
      g.beginPath(); g.moveTo(x0 + 0.15, y); g.lineTo(x0 + cw - 0.15, y + dy); g.lineTo(x0 + cw - 0.15, y + dy + pw - 0.3); g.lineTo(x0 + 0.15, y + pw - 0.3); g.fill();
      g.fillStyle = 'rgba(255,240,210,0.18)';
      g.beginPath(); g.moveTo(x0 + 0.15, y); g.lineTo(x0 + cw - 0.15, y + dy); g.lineTo(x0 + cw - 0.15, y + dy + 0.5); g.lineTo(x0 + 0.15, y + 0.5); g.fill();
    }
  }
  // the nave
  const n0 = 7 * T, n1 = 14 * T, q = T * 0.62;
  g.save(); g.beginPath(); g.rect(n0, 0, n1 - n0, H); g.clip();
  g.translate((n0 + n1) / 2, H / 2); g.rotate(Math.PI / 4);
  for (let i = -16; i < 16; i++) for (let j = -16; j < 16; j++) {
    const dark = (i + j) % 2 !== 0;
    g.fillStyle = dark ? L.inlay[(i * 3 + j) & 1] : ['#f8f4ea', '#eee6d6'][(i + j * 3) & 1];
    g.fillRect(i * q, j * q, q - 0.25, q - 0.25);
    if (!dark && (i * 7 + j * 5) % 3 === 0) {
      g.strokeStyle = 'rgba(150,135,110,0.3)'; g.lineWidth = 0.25;
      g.beginPath(); g.moveTo(i * q, j * q + q * 0.3); g.quadraticCurveTo(i * q + q * 0.5, j * q + q * 0.7, i * q + q, j * q + q * 0.4); g.stroke();
    }
  }
  g.restore();
  for (const x of [n0, n1]) { rr(x - 1.4, 0, 2.8, H, 0, '#f6f0e2'); rr(x - 0.6, 0, 1.2, H, 0, lin(x - 0.6, 0, x + 0.6, 0, GOLD)); }
  // the runner from the counter to the door
  const rx = (NAVE + 0.5) * T, rw = 1.6 * T, ry0 = (LIFT_D + 0.5) * T;
  rr(rx - rw / 2 - 0.6, ry0, rw + 1.2, H - ry0, 0, 'rgba(30,20,10,0.25)');
  rr(rx - rw / 2, ry0, rw, H - ry0, 0, L.runner[0]);
  for (const sd of [-1, 1]) {
    rr(rx + sd * (rw / 2 - 1.6) - 0.6, ry0, 1.2, H - ry0, 0, GOLD[1]);
    rr(rx + sd * (rw / 2 - 3.2) - 0.25, ry0, 0.5, H - ry0, 0, L.runner[1]);
  }
  for (let y = ry0 + T / 2; y < H; y += T) {
    g.fillStyle = L.runner[1]; g.beginPath(); g.moveTo(rx, y - 4); g.lineTo(rx + 4, y); g.lineTo(rx, y + 4); g.lineTo(rx - 4, y); g.fill();
    g.fillStyle = GOLD[1]; g.beginPath(); g.arc(rx, y, 1, 0, Math.PI * 2); g.fill();
  }
  // the rotunda's medallion: rings of gold and marble round a compass star
  const mx = rx, my = (ROTUNDA.y + 0.5) * T;
  for (const [r, col] of [[1.78 * T, GOLD[1]], [1.7 * T, '#f6f0e2'], [1.52 * T, L.inlay[0]], [1.46 * T, GOLD[2]], [1.4 * T, '#f8f4ea']]) { g.fillStyle = col; g.beginPath(); g.arc(mx, my, r, 0, Math.PI * 2); g.fill(); }
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * Math.PI * 2, r = (i % 2 ? 0.95 : 1.35) * T, side = 0.16;
    g.fillStyle = i % 2 ? GOLD[1] : L.inlay[i % 4 ? 1 : 0];
    g.beginPath(); g.moveTo(mx + Math.cos(a) * r, my + Math.sin(a) * r);
    g.lineTo(mx + Math.cos(a + side) * T * 0.3, my + Math.sin(a + side) * T * 0.3);
    g.lineTo(mx + Math.cos(a - side) * T * 0.3, my + Math.sin(a - side) * T * 0.3); g.fill();
  }
  DEPTS.forEach((d, i) => plaque(f, d.x * T + 1.2, (d.y + 2) * T + 0.6, 2 * T - 2.4, 6.4, depts[i], L));
  // the welcome mat, and the lift's
  const dx = DOOR.x * T, dyy = (ROWS - 1) * T;
  rr(dx + 1, dyy + 2.5, T - 2, T - 5, 2, lin(0, dyy, 0, dyy + T, GOLD));
  rr(dx + 1.8, dyy + 3.3, T - 3.6, T - 6.6, 1.6, L.panel[1]);
  words(g, 'WELCOME', dx + T / 2, dyy + T / 2, 2.4, GOLD[0]);
  const lx = (LIFT.x + 0.5) * T, ly = (LIFT_D + 0.32) * T;
  rr(lx - 0.75 * T, ly - 0.28 * T, 1.5 * T, 0.56 * T, 2, lin(0, ly - 5, 0, ly + 5, GOLD));
  rr(lx - 0.75 * T + 1, ly - 0.28 * T + 1, 1.5 * T - 2, 0.56 * T - 2, 1.4, L.panel[1]);
  return f.c;
}

/* ---------- the stands ---------- */

/** A plinth's top: marble in a gold line round a velvet inset, buttoned, in the floor's colour, edged in the department's. */
function daisTop(L, ink) {
  const f = fine(48, 48, 4), { g, rr, lin } = f;
  rr(0, 0, 48, 48, 0, lin(0, 0, 48, 48, ['#fbf7ee', '#e6dcc8', '#f6f0e4']));
  g.strokeStyle = 'rgba(150,135,110,0.3)'; g.lineWidth = 0.3;
  for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(0, 8 + i * 9); g.bezierCurveTo(14, 4 + i * 9, 30, 14 + i * 9, 48, 6 + i * 9); g.stroke(); }
  g.strokeStyle = GOLD[1]; g.lineWidth = 1; g.strokeRect(3, 3, 42, 42);
  rr(5.5, 5.5, 37, 37, 1.6, L.velvet);
  g.strokeStyle = ink; g.lineWidth = 0.9; g.beginPath(); g.roundRect(7.5, 7.5, 33, 33, 1.2); g.stroke();
  g.fillStyle = 'rgba(0,0,0,0.2)';
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { g.beginPath(); g.arc(12 + c * 7.4 + (r % 2) * 3.7, 12 + r * 7.4, 0.7, 0, Math.PI * 2); g.fill(); }
  return f.c;
}

/** A plinth's side: lacquer between gold lines. */
function daisSide(L) {
  const f = fine(48, 6, 4), { rr, lin } = f;
  rr(0, 0, 48, 6, 0, lin(0, 0, 0, 6, L.panel));
  rr(0, 0, 48, 0.9, 0, GOLD[1]);
  rr(0, 5.3, 48, 0.7, 0, GOLD[2]);
  return f.c;
}

/** The board that stands on a plinth once its piece is bought: a red SOLD OUT on cream, a leaf in the corner. */
function soldArt(L) {
  const f = fine(44, 22, 6), { g, rr } = f;
  rr(0.6, 1.2, 43, 20.4, 3, 'rgba(60,30,10,0.25)');
  rr(0, 0, 43, 20.4, 3, '#fbf3e0');
  g.strokeStyle = '#d23a3a'; g.lineWidth = 1.2;
  g.beginPath(); g.roundRect(1.8, 1.8, 39.4, 16.8, 2.2); g.stroke();
  words(g, 'SOLD', 21.5, 7.4, 7.4, '#d23a3a');
  words(g, 'OUT', 21.5, 14.6, 7.4, '#d23a3a');
  leaf(g, 5.2, 16, 2.2, L.trim);
  return f.c;
}

/* ---------- the lift ---------- */

/** The rope across the lift's doors until the second floor is open: two brass posts, a red rope and its sign. */
function ropeArt() {
  const f = fine(30, 12, 6), { g, rr } = f;
  rr(0.5, 0.5, 29, 11, 2, LOOK[2].trim);
  rr(1.6, 1.6, 26.8, 8.8, 1.4, '#ffffff');
  words(g, '2F CLOSED', 15, 6.2, 4.4, LOOK[2].dark);
  return f.c;
}

/** The lift's header: lacquer between gold bands, and a brass dial reading 1 and 2 (its needle is a mesh). */
function liftDialArt(L) {
  const W = LIFT_W * 20, f = fine(W, 14, 8), { g, rr, lin } = f;
  rr(0, 0, W, 14, 0, lin(0, 0, 0, 14, L.panel));
  rr(0, 0, W, 1, 0, GOLD[1]);
  rr(0, 12, W, 2, 0, lin(0, 12, 0, 14, GOLD));
  const cx = W / 2, cy = 10.6;
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.arc(cx + 0.3, cy + 0.4, 8, Math.PI, 0); g.closePath(); g.fill();
  g.fillStyle = lin(0, cy - 8, 0, cy, ['#fff0b0', '#e0b040', '#a87818']); g.beginPath(); g.arc(cx, cy, 8, Math.PI, 0); g.closePath(); g.fill();
  g.fillStyle = '#fbf6ea'; g.beginPath(); g.arc(cx, cy, 6.6, Math.PI, 0); g.closePath(); g.fill();
  g.strokeStyle = L.dark; g.lineWidth = 0.3;
  for (let i = 0; i <= 8; i++) {
    const a = Math.PI + (0.25 + i / 8 * 0.5) * Math.PI;
    g.beginPath(); g.moveTo(cx + Math.cos(a) * 5.4, cy + Math.sin(a) * 5.4); g.lineTo(cx + Math.cos(a) * 6.2, cy + Math.sin(a) * 6.2); g.stroke();
  }
  for (const [n, a] of [['1', -0.75], ['2', -0.25]]) words(g, n, cx + Math.cos(a * Math.PI) * 3.9, cy + Math.sin(a * Math.PI) * 3.9 + 0.2, 2.6, L.dark);
  rr(cx - 8.4, cy, 16.8, 0.9, 0.3, '#a87818');
  return f.c;
}

/** The lift's shaft from its header up to the top of the walls, `h` units tall: ivory damask between lacquered posts edged
    in gold, the store's crest, the room's cornice crossing it, a gold sunburst over the header with a glowing lamp, and
    sunk panels above. */
function liftShaftArt(L, h, floor) {
  const U = 20, W = LIFT_W * U, H = h * U, f = fine(W, H, 4), { g, rr, lin, shine } = f, s = shine();
  const wy = (y) => (LIFT_H + 0.1 + h - y) * U;
  g.fillStyle = lin(0, 0, 0, H, [L.ivory[1], L.ivory[0]]); g.fillRect(0, 0, W, H);
  damask(g, W, 0, H, L.damask);
  for (let y = wy(6); y > 8; y -= 26) {
    rr(9, y - 22, W - 18, 20, 1.2, 'rgba(150,120,80,0.14)');
    g.fillStyle = 'rgba(255,250,235,0.6)'; g.fillRect(9.5, y - 2.6, W - 19, 0.6);
  }
  const cornice = wy(5.4);
  rr(0, cornice - 7, W, 8, 0, lin(0, cornice - 7, 0, cornice + 1, ['#ffffff', L.ivory[0], '#d6c8ac']));
  rr(0, cornice + 0.4, W, 1.6, 0.4, lin(0, cornice + 0.4, 0, cornice + 2, GOLD));
  for (const x of [0, W - 4.6]) { rr(x, 0, 4.6, H, 0, lin(x, 0, x + 4.6, 0, L.panel)); rr(x + (x ? 0 : 3.8), 0, 0.8, H, 0, GOLD[1]); }
  const lx = W / 2, ly = wy(LIFT_H + 0.15);
  g.strokeStyle = GOLD[1]; g.lineWidth = 0.7;
  for (let i = 0; i <= 10; i++) { const a = Math.PI + i / 10 * Math.PI; g.beginPath(); g.moveTo(lx + Math.cos(a) * 4, ly + Math.sin(a) * 4); g.lineTo(lx + Math.cos(a) * 12, ly + Math.sin(a) * 12); g.stroke(); }
  g.fillStyle = lin(0, ly - 5, 0, ly, ['#fffbe8', '#ffe2a0']); g.beginPath(); g.arc(lx, ly, 4, Math.PI, 0); g.fill();
  s.fillStyle = '#ffe8a8'; s.beginPath(); s.arc(lx, ly, 4, Math.PI, 0); s.fill();
  crest(f, s, W / 2, wy(4.3), W - 13, 1.0 * U, L, floor);
  return f.c;
}

/** The lift's two doors as one picture (each door shows its half): brushed champagne metal, a panel inset on each, and
    the store's leaf in a cream ring split down the middle. */
function liftDoorArt(L) {
  const f = fine(20, 36, 8), { g, rr, lin } = f;
  rr(0, 0, 20, 36, 0, lin(0, 0, 20, 0, ['#e8d6aa', '#f6ead0', '#dcc694', '#f2e2c0', '#e0cc9c']));
  for (let x = 0.4; x < 20; x += 0.7) { g.fillStyle = `rgba(${x % 1.4 < 0.7 ? '255,255,255' : '120,90,40'},0.08)`; g.fillRect(x, 0, 0.3, 36); }
  for (const x0 of [1.4, 11.4]) {
    g.strokeStyle = 'rgba(140,100,40,0.45)'; g.lineWidth = 0.4; g.strokeRect(x0, 2, 7.2, 32);
    g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 0.3; g.strokeRect(x0 + 0.35, 2.35, 7.2, 32);
  }
  g.fillStyle = 'rgba(90,60,20,0.5)'; g.fillRect(9.9, 0, 0.2, 36);
  g.fillStyle = '#fbf3e0'; g.beginPath(); g.arc(10, 14, 4.4, 0, Math.PI * 2); g.fill();
  g.strokeStyle = L.trimDark; g.lineWidth = 0.5; g.stroke();
  leaf(g, 10, 14, 3.1, L.trim);
  return f.c;
}

/** The call buttons beside the doors: a brass plate, up and down in round lit buttons. */
function liftCallArt() {
  const f = fine(7, 12, 10), { rr, lin, shine } = f, g = f.g, s = shine();
  rr(0, 0, 7, 12, 1.4, lin(0, 0, 0, 12, ['#fff0b0', '#d8a838', '#a87818']));
  rr(0.6, 0.6, 5.8, 10.8, 1, '#f6ecd0');
  for (const [y, up] of [[3.6, true], [8.4, false]]) {
    for (const c of [g, s]) {
      c.fillStyle = c === g ? '#6a5040' : '#000000'; c.beginPath(); c.arc(3.5, y, 2, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#ffd870';
      c.beginPath();
      if (up) { c.moveTo(3.5, y - 1.1); c.lineTo(4.7, y + 0.8); c.lineTo(2.3, y + 0.8); }
      else { c.moveTo(3.5, y + 1.1); c.lineTo(4.7, y - 0.8); c.lineTo(2.3, y - 0.8); }
      c.closePath(); c.fill();
    }
  }
  return f.c;
}

/* ---------- the counter and the corner ---------- */

/** The counter's front: lacquer between gold bands, gold-lined panels, the leaf on a gold medallion in the middle. */
function counterArt(w, L) {
  const W = w * 16, f = fine(W, 14, 5), { g, rr, lin } = f;
  rr(0, 0, W, 14, 0, lin(0, 0, 0, 14, L.panel));
  const n = Math.floor((W - 2) / 13.6), x0 = (W - n * 13.6 + 1.6) / 2;
  g.strokeStyle = GOLD[1]; g.lineWidth = 0.5;
  for (let i = 0; i < n; i++) g.strokeRect(x0 + i * 13.6, 3, 12, 8);
  rr(0, 0, W, 1.4, 0, lin(0, 0, 0, 1.4, GOLD));
  rr(0, 12.4, W, 1.6, 0, L.panelDark);
  g.fillStyle = GOLD[1]; g.beginPath(); g.arc(W / 2, 7, 4, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#fbf3e0'; g.beginPath(); g.arc(W / 2, 7, 3.1, 0, Math.PI * 2); g.fill();
  leaf(g, W / 2, 7, 2.1, L.trim);
  return f.c;
}

/** Smeargle's canvas on the easel, half done: a sunny meadow, flowers dabbed in, a corner still a pencil sketch. */
function canvasArt() {
  const f = fine(50, 40, 6), { g, lin } = f;
  g.fillStyle = '#fbf8f0'; g.fillRect(0, 0, 50, 40);
  g.fillStyle = lin(0, 0, 0, 28, ['#8cc8f0', '#d8eefa']); g.fillRect(2, 2, 46, 26);
  g.fillStyle = '#7ab860'; g.beginPath(); g.moveTo(2, 28); g.quadraticCurveTo(18, 18, 30, 24); g.quadraticCurveTo(40, 20, 48, 24); g.lineTo(48, 38); g.lineTo(2, 38); g.fill();
  g.fillStyle = '#f8d040'; g.beginPath(); g.arc(38, 10, 5, 0, Math.PI * 2); g.fill();
  for (let i = 0; i < 16; i++) { g.fillStyle = ['#e85868', '#f8a0c0', '#ffffff', '#f8d040'][i % 4]; g.beginPath(); g.arc(4 + (i * 23) % 42, 29 + (i * 7) % 8, 1.4, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = '#fbf8f0'; g.beginPath(); g.moveTo(30, 40); g.lineTo(50, 22); g.lineTo(50, 40); g.fill();
  g.strokeStyle = 'rgba(80,80,90,0.5)'; g.lineWidth = 0.3; g.beginPath(); g.arc(43, 34, 3.4, 0, Math.PI * 2); g.moveTo(39.6, 34); g.lineTo(46.4, 34); g.stroke();
  return f.c;
}

/** A piano's keys, from above: white keys, black ones in their twos and threes. */
function keysArt() {
  const f = fine(52, 8, 8), { g } = f;
  g.fillStyle = '#fbf8f0'; g.fillRect(0, 0, 52, 8);
  g.fillStyle = 'rgba(0,0,0,0.3)';
  for (let i = 1; i < 52; i++) g.fillRect(i, 0, 0.12, 8);
  g.fillStyle = '#18181c';
  for (let i = 0; i < 51; i++) if ([0, 1, 3, 4, 5].includes(i % 7)) g.fillRect(i + 0.65, 0, 0.7, 4.8);
  return f.c;
}

/* ---------- building it ---------- */

/** One floor of the store. `size` gives the hall's paint units and wall height; the room is its own COLS x ROWS. Returns
    its group, the tiles it blocks, the spots you can walk up to (a stand each, the counter and the lift), the gold ring
    that marks a picked stand, the rope (hidden once the second floor is open), the lift (its doors, dial needle, how
    open), its shopkeeper's place (js/mall-3d.js puts the Pokémon there), its size and door, and tick() for the
    chandeliers and palms. */
export function buildFloor(THREE, floor, size, upstairs) {
  const { top: TOP } = size, cols = COLS, rows = ROWS, L = LOOK[floor], calm = calmFx();
  const tileX = (tx) => tx + 0.5 - cols / 2, tileZ = (ty) => ty + 0.5 - rows / 2;
  const group = new THREE.Group(), blocked = new Set(), spots = [], ticks = [];
  const block = (x0, y0, x1 = x0, y1 = y0) => { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) blocked.add(`${x},${y}`); };
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, ...o });
  const lit = (src, colour, k = 1) => std({ map: texOf(src), emissive: new THREE.Color(colour), emissiveMap: texOf(src.glow), emissiveIntensity: k, roughness: 0.9 });
  const put = (parent, geo, m, x, y, z, shadow = true) => {
    const o = new THREE.Mesh(geo, m);
    o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true;
    parent.add(o);
    return o;
  };
  const lathe = (pts, n = 32) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), n);
  const kit = hallKit(THREE), M = kit.M, edge = std({ color: '#3a3040' });
  const goldM = M.gold, lacquer = std({ color: L.panel[1], roughness: 0.25, metalness: 0.1 }), marble = std({ color: '#f6f0e4', roughness: 0.22 });

  const stock = furnitureStock(undefined, floor), owned = loadBase().owned, owners = sortIn(stock), depts = DEPTS.map((d, i) => deptOf(d, owners[i]));
  const floorBox = new THREE.Mesh(new THREE.BoxGeometry(cols, 0.6, rows), [edge, edge, std({ map: texOf(floorArt(floor, depts)), roughness: 0.45 }), edge, std({ color: L.panelDark }), edge]);
  floorBox.position.y = -0.3;
  floorBox.receiveShadow = true;
  group.add(floorBox);
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(cols + 0.8, 7, rows + 0.4), [edge, edge, edge, edge, std({ color: '#3a2c24' }), edge]);
  plinth.position.set(0, -0.6 - 3.5, -0.2);
  group.add(plinth);
  const cap = std({ color: L.panelDark });
  const back = new THREE.Mesh(new THREE.BoxGeometry(cols + 0.8, TOP, 0.4), [cap, cap, cap, cap, lit(wallArt(floor, size), '#fff4dc', 1), cap]);
  back.position.set(0, TOP / 2, -rows / 2 - 0.2);
  back.receiveShadow = true;
  group.add(back);
  for (const s of [-1, 1]) {
    const inside = lit(sideArt(floor, s < 0, size), '#fff4dc', 0.8);
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.4, TOP, rows), s < 0 ? [inside, cap, cap, cap, cap, cap] : [cap, inside, cap, cap, cap, cap]);
    m.position.set(s * (cols / 2 + 0.2), TOP / 2, 0);
    m.receiveShadow = true;
    group.add(m);
  }

  // the stands, a department each, their pieces near life size
  const side = std({ map: texOf(daisSide(L)), roughness: 0.4 }), soldMat = std({ map: texOf(soldArt(L)), alphaTest: 0.3, roughness: 0.7 });
  DEPTS.forEach((b, i) => {
    const id = owners[i];
    block(b.x, b.y, b.x + 1, b.y + 1);
    if (!id) return;
    const p = PIECES[id], d = depts[i], cx = tileX(b.x) + 0.5, cz = tileZ(b.y) + 0.5, H = DAIS_H;
    // one of each piece a player (the user's call, 2026-10-12): once owned it's sold out here, and copies are the PC's Duplicate
    const spot = { id: `bay${i}`, kind: 'bay', piece: id, name: p.name, open: true, step: { ...b.step }, at: { x: cx, y: H + 0.01, z: cz }, sold: (owned[p.own] || 0) > 0, dept: { name: d.name, ink: d.ink } };
    spots.push(spot);
    const bay = new THREE.Group();
    bay.position.set(cx, 0, cz);
    const top = std({ map: texOf(daisTop(L, d.ink)), roughness: 0.5 });
    const slab = new THREE.Mesh(new THREE.BoxGeometry(DAIS, H, DAIS), [side, side, top, side, side, side]);
    slab.position.y = H / 2;
    slab.castShadow = slab.receiveShadow = true;
    const ware = new THREE.Group();   // the piece, which a buy poofs away (js/mall-3d.js's poof())
    bay.add(slab, ware);
    pieceInto(THREE, ware, id, b.tall, H, std, goldM);
    // the SOLD OUT board on its own easel in the plinth's middle, shown once the piece is gone
    const sold = new THREE.Group();
    put(sold, new THREE.PlaneGeometry(1.3, 0.65), soldMat, 0, 0.7, 0).rotation.x = -0.12;
    for (const x of [-0.36, 0.36]) put(sold, new THREE.BoxGeometry(0.05, 0.7, 0.05), goldM, x, 0.35, -0.06);
    sold.position.set(0, H, 0.1);
    ware.visible = !spot.sold; sold.visible = spot.sold;
    bay.add(sold);
    Object.assign(spot, { ware, soldSign: sold, bay });
    bay.traverse(o => { o.userData.front = spot; });
    group.add(bay);
  });

  // the counter at the back of the nave: lacquer under a marble top on a gold edge, a brass till, the bell, a stack of
  // catalogues and a vase of flowers; the shopkeeper behind it
  const keeper = { id: 'keeper', kind: 'keeper', name: KEEPERS[floor].name, open: true, step: { x: COUNTER.x + 1, y: COUNTER.y + 1 } };
  spots.push(keeper);
  block(COUNTER.x, 0, COUNTER.x + COUNTER.w - 1, COUNTER.y);
  const desk = new THREE.Group();
  desk.position.set(tileX(COUNTER.x + 1), 0, tileZ(COUNTER.y));
  const body = put(desk, new THREE.BoxGeometry(COUNTER.w - 0.1, 0.8, 0.72), [lacquer, lacquer, lacquer, lacquer, std({ map: texOf(counterArt(COUNTER.w, L)), roughness: 0.35 }), lacquer], 0, 0.4, 0);
  body.receiveShadow = true;
  put(desk, new THREE.BoxGeometry(COUNTER.w + 0.06, 0.04, 0.9), goldM, 0, 0.82, 0);
  put(desk, new THREE.BoxGeometry(COUNTER.w + 0.02, 0.07, 0.86), marble, 0, 0.875, 0);
  put(desk, new THREE.BoxGeometry(0.44, 0.24, 0.32), M.brass, -0.95, 1.03, -0.1);
  put(desk, new THREE.BoxGeometry(0.3, 0.12, 0.04), std({ color: '#2a3440', emissive: new THREE.Color('#60c0a0'), emissiveIntensity: 0.6 }), -0.95, 1.2, -0.2).rotation.x = -0.4;
  put(desk, new THREE.SphereGeometry(0.1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), std({ color: '#e8c050', metalness: 0.7, roughness: 0.3 }), 0.35, 0.91, 0.2);
  ['#c84a5a', '#3a7ac0', L.panel[0]].forEach((c, i) => put(desk, new THREE.BoxGeometry(0.34, 0.035, 0.26), std({ color: c, roughness: 0.6 }), -0.3, 0.928 + i * 0.036, 0.16).rotation.y = (i - 1) * 0.12);
  const vase = new THREE.Group();
  vase.position.set(0.95, 0.91, -0.1);
  put(vase, lathe([[0, 0], [0.07, 0], [0.1, 0.08], [0.07, 0.2], [0.05, 0.24], [0.07, 0.27], [0, 0.27]]), goldM, 0, 0, 0);
  vase.add(bouquet(THREE, std, L, 0.42)).children.at(-1).position.y = 0.3;
  desk.add(vase);
  desk.traverse(o => { o.userData.front = keeper; });
  group.add(desk);
  // a topiary left of the counter; right of the lift, a bench under Smeargle's painting between two more
  kit.topiary(group, tileX(COUNTER.x - 1), tileZ(1), 0.28, 1);
  block(COUNTER.x - 1, 1);
  for (const x of [GALLERY - 1, GALLERY + 1]) kit.topiary(group, tileX(x), tileZ(0.8), 0.28, x);
  kit.bench(group, tileX(GALLERY), tileZ(0.75), 0, 1.3);
  block(GALLERY - 1, 0, GALLERY + 1, 1);

  // the velvet rotunda seat in the middle of the nave, a bouquet in a gold urn on top
  const ro = new THREE.Group();
  ro.position.set(tileX(ROTUNDA.x), 0, tileZ(ROTUNDA.y));
  const velvet = std({ color: L.velvet, roughness: 0.95 }), button = std({ color: L.panelDark, roughness: 0.6 });
  put(ro, new THREE.CylinderGeometry(1.24, 1.26, 0.1, 48), lacquer, 0, 0.05, 0);
  put(ro, new THREE.CylinderGeometry(1.16, 1.2, 0.3, 48), velvet, 0, 0.25, 0);
  put(ro, new THREE.TorusGeometry(1.17, 0.022, 8, 64), goldM, 0, 0.4, 0, false).rotation.x = Math.PI / 2;
  put(ro, new THREE.TorusGeometry(1.215, 0.02, 8, 64), goldM, 0, 0.1, 0, false).rotation.x = Math.PI / 2;
  put(ro, lathe([[0, 0.4], [1.12, 0.4], [1.17, 0.44], [1.14, 0.5], [0.9, 0.53], [0.6, 0.54], [0, 0.54]], 48), velvet, 0, 0, 0);
  const tufts = new THREE.InstancedMesh(new THREE.SphereGeometry(0.022, 8, 6), button, 30), m4 = new THREE.Matrix4();
  for (let i = 0; i < 30; i++) {
    const a = i / 15 * Math.PI * 2 + (i >= 15 ? Math.PI / 15 : 0), r = i >= 15 ? 0.78 : 1.0;
    tufts.setMatrixAt(i, m4.makeTranslation(Math.cos(a) * r, i >= 15 ? 0.54 : 0.525, Math.sin(a) * r));
  }
  ro.add(tufts);
  put(ro, new THREE.CylinderGeometry(0.5, 0.58, 0.48, 40), velvet, 0, 0.78, 0);
  for (let i = 0; i < 12; i++) {   // the back's channel tufting
    const a = i / 12 * Math.PI * 2;
    put(ro, new THREE.BoxGeometry(0.012, 0.44, 0.012), button, Math.cos(a) * 0.545, 0.78, Math.sin(a) * 0.545, false).rotation.y = -a;
  }
  put(ro, new THREE.TorusGeometry(0.5, 0.025, 8, 48), goldM, 0, 1.02, 0, false).rotation.x = Math.PI / 2;
  put(ro, lathe([[0, 1.02], [0.16, 1.02], [0.12, 1.08], [0.13, 1.14], [0.26, 1.28], [0.3, 1.34], [0.27, 1.36], [0, 1.36]]), goldM, 0, 0, 0);
  const flowers = bouquet(THREE, std, L, 1);
  flowers.position.y = 1.38;
  ro.add(flowers);
  group.add(ro);
  block(ROTUNDA.x - 1, ROTUNDA.y - 1, ROTUNDA.x + 1, ROTUNDA.y + 1);

  // palms in the corners, a three-globe lamp either side of the way in
  for (const [x, y, s] of [[0, 0, 1], [cols - 1, 0, 2], [0, rows - 1, 3], [cols - 1, rows - 1, 4]]) { ticks.push(kit.palm(group, tileX(x), tileZ(y), 1.8, s)); block(x, y); }
  for (const x of [NAVE - 3, NAVE + 3]) { kit.lamp(group, tileX(x), tileZ(rows - 2), []); block(x, rows - 2); }

  // the back-left corner: Smeargle's easel downstairs, a grand piano upstairs
  (floor === 1 ? easel : piano)(THREE, group, tileX(CORNER.x), tileZ(CORNER.y), { std, put, lathe, M, L, goldM });
  block(CORNER.x - 1, 0, CORNER.x + 1, 1);

  // crystal chandeliers either side of the crest, over the aisles, so their chains clear the signs' lettering
  const crystal = std({ color: '#f4fbff', emissive: new THREE.Color('#cfe8ff'), emissiveIntensity: 0.45, metalness: 0.2, roughness: 0.05, transparent: true, opacity: 0.88 });
  const flame = std({ color: '#fff6dc', emissive: new THREE.Color('#ffd88a'), emissiveIntensity: 2.2, roughness: 0.4 });
  const lights = [[NAVE - 4, 5.3, 1], [NAVE + 4, 5.3, 1]].map(([x, y, k], i) => chandelier(THREE, group, tileX(x), y, tileZ(3.5), k, TOP, { put, lathe, goldM, crystal, flame }, i));
  if (!calm) ticks.push((now) => {
    crystal.emissiveIntensity = 0.45 + Math.sin(now / 340) * 0.12 + Math.sin(now / 130) * 0.05;
    lights.forEach((c, i) => { c.rotation.z = Math.sin(now / 2600 + i * 2) * 0.01; c.rotation.y = Math.sin(now / 5200 + i) * 0.06; });
  });

  // the lift at the head of the nave (LIFT): a lacquered case against the back wall, its car lit inside, two doors that slide
  // apart into its sides, a brass dial over them and call buttons beside them (js/mall-3d.js opens and rides it)
  block(LIFT.x - 1, 0, LIFT.x + 1, 1);
  const liftSpot = { id: 'lift', kind: 'lift', name: floor === 1 ? 'Lift up' : 'Lift down', open: true, step: { ...LIFT.foot } };
  spots.push(liftSpot);
  const liftGroup = new THREE.Group();
  liftGroup.position.set(tileX(LIFT.x), 0, -rows / 2);
  const lp = (geo, m, x, y, z, shadow = true) => put(liftGroup, geo, m, x, y, z, shadow);
  const brass = std({ color: '#e0b040', metalness: 0.7, roughness: 0.3 }), champagne = std({ color: '#e4d0a0', metalness: 0.5, roughness: 0.35 });
  const PW = (LIFT_W - DOORWAY) / 2;   // each side's width
  for (const sgn of [-1, 1]) {
    // only up to the header: running on up behind it, their fronts shared its plane and the two flickered (2026-10-16)
    lp(new THREE.BoxGeometry(PW, LIFT_DOOR, LIFT_D), lacquer, sgn * (DOORWAY / 2 + PW / 2), LIFT_DOOR / 2, LIFT_D / 2);
    lp(new THREE.BoxGeometry(0.08, LIFT_DOOR + 0.04, 0.06), goldM, sgn * (DOORWAY / 2 + 0.04), (LIFT_DOOR + 0.04) / 2, LIFT_D + 0.03);
    lp(new THREE.BoxGeometry(PW + 0.06, 0.12, LIFT_D + 0.06), goldM, sgn * (DOORWAY / 2 + PW / 2), 0.06, LIFT_D / 2);
  }
  const ceiling = std({ color: '#fff4d8', emissive: new THREE.Color('#ffe8b0'), emissiveIntensity: 0.9 });
  lp(new THREE.BoxGeometry(LIFT_W, LIFT_H - LIFT_DOOR, LIFT_D), [lacquer, lacquer, lacquer, ceiling, std({ map: texOf(liftDialArt(L)), roughness: 0.5 }), lacquer],
    0, (LIFT_H + LIFT_DOOR) / 2, LIFT_D / 2);
  lp(new THREE.BoxGeometry(LIFT_W + 0.12, 0.1, LIFT_D + 0.12), goldM, 0, LIFT_H + 0.05, LIFT_D / 2);
  // its shaft on up to the top of the walls, so it reads as a lift through the ceiling, not a booth on the floor
  const shaftH = TOP - LIFT_H - 0.1;
  lp(new THREE.BoxGeometry(LIFT_W, shaftH, LIFT_D - 0.1), [lacquer, lacquer, lacquer, lacquer, lit(liftShaftArt(L, shaftH, floor), '#ffe8b0', 0.8), lacquer],
    0, LIFT_H + 0.1 + shaftH / 2, (LIFT_D - 0.1) / 2);
  // the car: a warm-lit back panel, a wood floor, a brass handrail
  lp(new THREE.PlaneGeometry(DOORWAY, LIFT_DOOR), std({ color: '#f6e6c4', emissive: new THREE.Color('#ffe0a8'), emissiveIntensity: 0.3 }), 0, LIFT_DOOR / 2, 0.03, false);
  lp(new THREE.BoxGeometry(DOORWAY, 0.02, LIFT_D), M.wood, 0, 0.01, LIFT_D / 2, false);
  lp(new THREE.CylinderGeometry(0.02, 0.02, DOORWAY - 0.1, 10), brass, 0, 0.85, 0.1, false).rotation.z = Math.PI / 2;
  // the dial's needle, turning about its foot (rotation.z: 1F left, 2F right)
  const needle = new THREE.Group();
  needle.position.set(0, LIFT_H - 10.6 / 14 * (LIFT_H - LIFT_DOOR), LIFT_D + 0.015);
  const hand = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.25, 0.008), std({ color: '#3a2418' }));
  hand.position.y = 0.11;
  needle.add(hand, new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.012, 14), brass).rotateX(Math.PI / 2));
  needle.rotation.z = floor === 1 ? Math.PI / 4 : -Math.PI / 4;
  liftGroup.add(needle);
  // the doors, each showing its half of the picture
  const doorTex = texOf(liftDoorArt(L)), doors = [-1, 1].map(sgn => {
    const map = doorTex.clone();
    map.repeat.set(0.5, 1); map.offset.set(sgn < 0 ? 0 : 0.5, 0); map.needsUpdate = true;
    const face = std({ map, metalness: 0.45, roughness: 0.35 });
    const d = lp(new THREE.BoxGeometry(DOORWAY / 2, LIFT_DOOR, 0.04), [champagne, champagne, champagne, champagne, face, champagne], sgn * DOORWAY / 4, LIFT_DOOR / 2, LIFT_D - 0.08);
    d.userData.home = sgn * DOORWAY / 4; d.userData.side = sgn; d.userData.slide = DOORWAY / 2;
    return d;
  });
  lp(new THREE.PlaneGeometry(0.15, 0.26), lit(liftCallArt(), '#ffd870', 0.6), DOORWAY / 2 + PW / 2, 1.1, LIFT_D + 0.012, false);
  let rope = null;
  if (floor === 1 && !upstairs) {
    rope = new THREE.Group();
    for (const x of [-0.75, 0.75]) {
      put(rope, new THREE.CylinderGeometry(0.045, 0.07, 0.7, 10), brass, x, 0.35, LIFT_D + 0.3);
      put(rope, new THREE.SphereGeometry(0.07, 10, 8), brass, x, 0.72, LIFT_D + 0.3, false);
    }
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-0.75, 0.66, LIFT_D + 0.3), new THREE.Vector3(0, 0.36, LIFT_D + 0.3), new THREE.Vector3(0.75, 0.66, LIFT_D + 0.3));
    rope.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.03, 6), std({ color: '#c8283a', roughness: 0.6 })));
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.24), std({ map: texOf(ropeArt()) }));
    sign.position.set(0, 0.4, LIFT_D + 0.34);
    rope.add(sign);
    liftGroup.add(rope);
  }
  // the lift answers a tap anywhere on it: an invisible box over the whole of it
  lp(new THREE.BoxGeometry(LIFT_W, LIFT_H, LIFT_D + 0.4), new THREE.MeshBasicMaterial({ visible: false }), 0, LIFT_H / 2, LIFT_D / 2 + 0.2, false);
  liftGroup.traverse(o => { o.userData.front = liftSpot; });
  group.add(liftGroup);
  const lift = { doors, needle, open: 0, want: 0, dial: floor };

  const ring = new THREE.Mesh(new THREE.RingGeometry(0.98, 1.08, 64), new THREE.MeshBasicMaterial({ color: '#f8d040', transparent: true, opacity: 0.9, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  ring.visible = false;
  ring.raycast = () => {};
  group.add(ring);

  const tags = priceTags(THREE, spots);
  return {
    group, blocked, spots, ring, rope, lift, cols, rows, door: DOOR, top: 4.85, title: floor === 1 ? 'Furniture' : 'Furniture 2F',
    keeper: { ...KEEPERS[floor], x: tileX(COUNTER.x + 1), z: tileZ(COUNTER.y - 1) },
    tick: (now, dt, hud) => { for (const t of ticks) t(now, dt); if (hud) tags.place(hud); },
    leave: () => tags.drop(),
  };
}

/** Each stand's price on screen, a cream tag with a coin pinned at its plinth's front edge (2026-10-16, the user's ask:
    the painted price cards were too small to read on a phone): crisp at any size, hidden once sold and while the buy
    window is up (css/hub.css). */
function priceTags(THREE, spots) {
  const at = new THREE.Vector3();
  let box = null;
  return {
    place(hud) {
      if (!box?.isConnected) {
        box = document.createElement('div');
        box.className = 'mall-tags';
        for (const s of spots) {
          if (s.kind !== 'bay') continue;
          const t = document.createElement('span');
          t.className = 'mall-tag';
          t.style.setProperty('--ink', s.dept.ink);
          t.append(smoothIcon('coin', 'mall-tag-coin'), price(PIECES[s.piece].price));
          s.tag = t;
          box.append(t);
        }
        hud.view.after(box);   // under the speech window, the buy window and the bar
      }
      const r = hud.view.getBoundingClientRect(), o = hud.stage.getBoundingClientRect();
      for (const s of spots) {
        if (!s.tag) continue;
        at.set(s.at.x, DAIS_H, s.at.z + DAIS / 2).project(hud.camera);
        const on = !s.soldSign.visible && s.ware.visible && Math.abs(at.x) < 1.1 && Math.abs(at.y) < 1.1;
        s.tag.hidden = !on;
        if (on) s.tag.style.translate = `${(r.left - o.left + (at.x + 1) / 2 * r.width).toFixed(1)}px ${(r.top - o.top + (1 - at.y) / 2 * r.height).toFixed(1)}px`;
      }
    },
    drop() { box?.remove(); box = null; },
  };
}

/** A piece as it stands on its plinth into `ware`, the plinth's top at height H, standing at most `tall`: its 3D model
    (js/base-mesh.js), a modelled wall piece on a little display board, a rug or mat as a slab, or else its painting
    upright. Shared by the stands and the buy window's turntable. */
function pieceInto(THREE, ware, id, tall, H, std, goldM) {
  const p = PIECES[id];
  const put = (geo, m, x, y, z, shadow = true) => {
    const o = new THREE.Mesh(geo, m);
    o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true;
    ware.add(o);
    return o;
  };
  const fit = Math.min(1.35, 1.8 / Math.max(p.w, p.h));   // small pieces a little larger than life, so they read on a plinth
  const model = p.wall && !shapeOf(p.fam, p) ? null : furnitureModel(THREE, id, (art) => std({ map: tex(art), roughness: 0.9 }));
  if (model && p.wall) {
    // a modelled wall piece hangs on its little display board as on the room's wall, its back flat to the board
    const box = new THREE.Box3().setFromObject(model), mw = box.max.x - box.min.x, mh = box.max.y - box.min.y;
    const k = Math.min(1.35, 1.6 / mw, (tall - 0.3) / mh), cy = H + 0.18 + mh * k / 2 + 0.1;
    model.scale.setScalar(k);
    model.position.set(-(box.min.x + box.max.x) / 2 * k, cy - (box.min.y + box.max.y) / 2 * k, -0.52);
    model.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
    ware.add(model);
    put(new THREE.BoxGeometry(mw * k + 0.2, mh * k + 0.2, 0.06), std({ color: '#fbf3e0' }), 0, cy, -0.55);
    put(new THREE.BoxGeometry(mw * k + 0.3, mh * k + 0.3, 0.04), goldM, 0, cy, -0.59);
  } else if (model) {
    // its 3D model (js/base-mesh.js), turned a little so its depth shows
    const k = Math.min(fit, tall / model.userData.top);
    model.scale.setScalar(k);
    model.position.y = H;
    model.rotation.y = -0.3;
    model.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
    bakeColours(model);
    ware.add(model);
  } else if (p.flat) {
    const k = Math.min(1, fit), h = Math.max(0.04, p.high * k), s = std({ color: p.side, roughness: 0.95 });
    const box = put(new THREE.BoxGeometry(p.w * k, h, p.h * k), [s, s, std({ map: tex(pieceArt(id, 0, HD)), alphaTest: 0.5, roughness: 0.9 }), s, s, s], 0, H + h / 2, 0, h > 0.1);
    box.receiveShadow = true;
  } else {
    const cut = trim(pieceArt(id, 0, HD)), w = cut.w * PX, h = cut.h * PX, k = Math.min(1.35, 1.6 / w, tall / h);
    put(new THREE.PlaneGeometry(w * k, h * k), std({ map: tex(cut.c), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1 }), 0, H + h * k / 2 + (p.wall ? 0.08 : 0), p.wall ? -0.5 : 0);
    if (p.wall) put(new THREE.BoxGeometry(w * k + 0.2, h * k + 0.2, 0.06), std({ color: '#fbf3e0' }), 0, H + h * k / 2 + 0.08, -0.55);
  }
}

const previews = new Map();
/** The piece alone for the buy window (js/turntable.js), on a round velvet turntable in its department's colour, rimmed
    in gold, its middle over the turntable's. Kept per piece, as the shared renderer keeps it. */
export function piecePreview(THREE, id, ink) {
  if (previews.has(id)) return previews.get(id);
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, ...o });
  const goldM = std({ color: '#e8b848', metalness: 0.85, roughness: 0.22 });
  const pivot = new THREE.Group(), ware = new THREE.Group();
  pieceInto(THREE, ware, id, 2.3, 0, std, goldM);
  const box = new THREE.Box3().setFromObject(ware), mid = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
  const r = Math.max(0.6, Math.hypot(size.x, size.z) / 2 + 0.12), DISC = 0.1;
  ware.position.set(-mid.x, DISC - box.min.y, -mid.z);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.02, DISC, 64), std({ color: ink, roughness: 0.95 }));
  disc.position.y = DISC / 2;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r, 0.025, 8, 64), goldM);
  rim.rotation.x = Math.PI / 2; rim.position.y = DISC;
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.06, r * 1.08, 0.05, 64), std({ color: '#2a2030', roughness: 0.3 }));
  foot.position.y = -0.025;
  pivot.add(ware, disc, rim, foot);
  const out = { pivot, h: size.y + DISC, r: Math.hypot(r, (size.y + DISC) / 2) };
  previews.set(id, out);
  return out;
}

/** A round bouquet: blooms in the floor's colours heaped in a dome, a few leaves among them, `k` its size. */
function bouquet(THREE, std, L, k) {
  const n = 44, inst = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.075 * k, 1), std({ roughness: 0.8 }), n);
  const m4 = new THREE.Matrix4(), col = new THREE.Color(), r = 0.34 * k;
  for (let i = 0; i < n; i++) {
    const phi = Math.acos(1 - (i / n) * 1.1), th = i * 2.399;
    inst.setMatrixAt(i, m4.makeTranslation(Math.sin(phi) * Math.cos(th) * r, Math.cos(phi) * r * 0.9, Math.sin(phi) * Math.sin(th) * r));
    inst.setColorAt(i, col.set(i % 6 === 0 ? '#4a9a48' : L.bloom[i % 3]));
  }
  inst.castShadow = true;
  return inst;
}

/** A crystal chandelier at (x, y, z), `k` its size, hanging from the wall's top: a gold chain and crown, a bulbous gold
    stem, two rings of candle bulbs on gold arms, strands of crystal beads swagged between the candles, crystal drops
    under each ring and a crystal ball at the bottom. Returns its group (tick() sways it). */
function chandelier(THREE, parent, x, y, z, k, top, { put, lathe, goldM, crystal, flame }, seed) {
  const g = new THREE.Group();
  g.position.set(x, y, z); g.scale.setScalar(k);
  parent.add(g);
  const len = (top - y) / k;
  put(g, new THREE.CylinderGeometry(0.014, 0.014, len, 6), goldM, 0, len / 2 + 0.7, 0, false);
  put(g, lathe([[0, 0.64], [0.14, 0.66], [0.17, 0.72], [0.07, 0.78], [0, 0.8]]), goldM, 0, 0, 0, false);
  put(g, lathe([[0, -0.44], [0.05, -0.42], [0.1, -0.3], [0.06, -0.18], [0.045, 0], [0.1, 0.1], [0.05, 0.26], [0.035, 0.64], [0, 0.64]]), goldM, 0, 0, 0, false);
  put(g, lathe([[0, -0.1], [0.22, -0.05], [0.26, 0.01], [0, 0.01]]), goldM, 0, 0, 0, false);
  const tiers = [{ y: 0, r: 0.58, n: 8 }, { y: 0.34, r: 0.34, n: 6 }], sleeves = [], flames = [], drops = [], beads = [];
  for (const t of tiers) {
    put(g, new THREE.TorusGeometry(t.r, 0.018, 8, 48), goldM, 0, t.y, 0, false).rotation.x = Math.PI / 2;
    for (let i = 0; i < t.n; i++) {
      const a = (i / t.n) * Math.PI * 2, cx = Math.cos(a) * t.r, cz = Math.sin(a) * t.r;
      put(g, new THREE.CylinderGeometry(0.012, 0.012, t.r, 6), goldM, cx / 2, t.y - 0.02, cz / 2, false).rotation.set(0, -a, Math.PI / 2);
      put(g, new THREE.CylinderGeometry(0.045, 0.03, 0.04, 12), goldM, cx, t.y + 0.03, cz, false);
      sleeves.push([cx, t.y + 0.1, cz]); flames.push([cx, t.y + 0.2, cz]);
      drops.push([cx, t.y - 0.1, cz]);
      const b = (i + 1) / t.n * Math.PI * 2, nx = Math.cos(b) * t.r, nz = Math.sin(b) * t.r;
      drops.push([Math.cos((a + b) / 2) * t.r * 1.02, t.y - 0.2, Math.sin((a + b) / 2) * t.r * 1.02]);
      for (let s = 1; s < 7; s++) { const u = s / 7; beads.push([cx + (nx - cx) * u, t.y - 0.02 - Math.sin(u * Math.PI) * 0.13, cz + (nz - cz) * u]); }
    }
  }
  drops.push([0, -0.62, 0]);
  const many = (geo, mat, at, sy = 1) => {
    const m = new THREE.InstancedMesh(geo, mat, at.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(1, sy, 1);
    at.forEach(([px, py, pz], i) => m.setMatrixAt(i, m4.compose(new THREE.Vector3(px, py, pz), q, sc)));
    g.add(m);
  };
  many(new THREE.CylinderGeometry(0.022, 0.022, 0.12, 8), flame, sleeves);
  many(new THREE.SphereGeometry(0.035, 10, 8), flame, flames, 1.5);
  many(new THREE.OctahedronGeometry(0.04), crystal, drops, 1.8);
  many(new THREE.SphereGeometry(0.017, 6, 4), crystal, beads);
  put(g, new THREE.SphereGeometry(0.07, 16, 12), crystal, 0, -0.5, 0, false);
  mergeStatic(g, () => false);   // ~34 gold parts, one draw; only the whole chandelier sways
  g.rotation.y = seed;
  return g;
}

/** Smeargle's corner, downstairs: an easel with its half-done canvas, a stool, and a little round table of paint pots
    and a jar of brushes. */
function easel(THREE, group, x, z, { std, put, lathe, M, goldM }) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  group.add(g);
  for (const sd of [-1, 1]) put(g, new THREE.BoxGeometry(0.06, 1.9, 0.05), M.wood, sd * 0.32, 0.94, 0.1).rotation.z = -sd * 0.16;
  put(g, new THREE.BoxGeometry(0.05, 1.9, 0.05), M.wood, 0, 0.9, -0.3).rotation.x = -0.3;
  put(g, new THREE.BoxGeometry(0.9, 0.05, 0.14), M.wood, 0, 0.62, 0.14);
  put(g, new THREE.BoxGeometry(0.1, 0.06, 0.1), M.wood, 0, 1.6, 0.08);
  const plain = std({ color: '#f4efe4' });
  put(g, new THREE.BoxGeometry(0.98, 0.78, 0.04), [plain, plain, plain, plain, std({ map: texOf(canvasArt()), roughness: 0.9 }), plain], 0, 1.04, 0.12).rotation.x = -0.08;
  const stool = new THREE.Group();
  stool.position.set(-0.85, 0, 0.55);
  g.add(stool);
  put(stool, new THREE.CylinderGeometry(0.18, 0.18, 0.05, 20), M.wood, 0, 0.46, 0);
  for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; put(stool, new THREE.CylinderGeometry(0.018, 0.022, 0.46, 6), M.wood, Math.cos(a) * 0.12, 0.23, Math.sin(a) * 0.12); }
  const table = new THREE.Group();
  table.position.set(0.85, 0, 0.45);
  g.add(table);
  put(table, new THREE.CylinderGeometry(0.24, 0.24, 0.04, 24), M.wood, 0, 0.58, 0);
  put(table, new THREE.CylinderGeometry(0.03, 0.03, 0.56, 8), goldM, 0, 0.28, 0);
  put(table, new THREE.CylinderGeometry(0.14, 0.16, 0.03, 20), goldM, 0, 0.015, 0);
  ['#e84a5a', '#f8c838', '#3a8ad8', '#4aa860'].forEach((c, i) => {
    const a = i / 4 * Math.PI * 2 + 0.4;
    put(table, new THREE.CylinderGeometry(0.045, 0.045, 0.07, 14), std({ color: '#e8e4dc' }), Math.cos(a) * 0.13, 0.635, Math.sin(a) * 0.13);
    put(table, new THREE.CylinderGeometry(0.04, 0.04, 0.005, 14), std({ color: c, roughness: 0.3 }), Math.cos(a) * 0.13, 0.672, Math.sin(a) * 0.13, false);
  });
  put(table, lathe([[0, 0], [0.04, 0], [0.045, 0.12], [0, 0.12]], 14), std({ color: '#cfeaff', transparent: true, opacity: 0.5, roughness: 0.1 }), 0, 0.6, 0);
  for (const [dx, dz, t] of [[-0.01, 0, 0.1], [0.012, 0.01, -0.12], [0, -0.012, 0.02]]) put(table, new THREE.CylinderGeometry(0.006, 0.006, 0.24, 5), M.wood, dx, 0.74, dz).rotation.z = t;
}

/** The Rose Salon's corner, upstairs: a black lacquered grand piano with its lid propped open and its bench. */
function piano(THREE, group, x, z, { std, put, goldM, L }) {
  const g = new THREE.Group();
  g.position.set(x, 0, z + 0.4);
  group.add(g);
  const black = std({ color: '#121216', roughness: 0.14, metalness: 0.3 }), shape = new THREE.Shape();
  shape.moveTo(-0.7, 0); shape.lineTo(0.7, 0); shape.lineTo(0.7, 0.45);
  shape.bezierCurveTo(0.7, 0.95, 0.25, 0.9, 0.1, 1.3); shape.quadraticCurveTo(-0.05, 1.55, -0.4, 1.55);
  shape.quadraticCurveTo(-0.7, 1.55, -0.7, 1.2); shape.closePath();
  const slab = (depth, y) => {
    const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 24 });
    geo.rotateX(-Math.PI / 2);
    const m = put(g, geo, black, 0, y, 0);
    return m;
  };
  slab(0.3, 0.6);
  put(g, new THREE.BoxGeometry(1.42, 0.02, 0.02), goldM, 0, 0.9, 0.005, false);
  const lid = new THREE.Group();
  lid.position.set(-0.7, 0.92, 0);
  g.add(lid);
  const lidGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.025, bevelEnabled: false, curveSegments: 24 });
  lidGeo.rotateX(-Math.PI / 2); lidGeo.translate(0.7, 0, 0);
  put(lid, lidGeo, black, 0, 0, 0);
  lid.rotation.z = 0.55;
  put(g, new THREE.CylinderGeometry(0.012, 0.012, 0.62, 6), black, 0.35, 1.18, -0.6).rotation.z = 0.5;
  put(g, new THREE.BoxGeometry(1.3, 0.03, 0.2), std({ map: texOf(keysArt()), roughness: 0.4 }), 0, 0.76, 0.1);
  put(g, new THREE.BoxGeometry(1.44, 0.1, 0.24), black, 0, 0.7, 0.1);
  for (const sd of [-1, 1]) put(g, new THREE.BoxGeometry(0.06, 0.14, 0.24), black, sd * 0.69, 0.81, 0.1);
  put(g, new THREE.BoxGeometry(1.3, 0.16, 0.03), black, 0, 0.9, -0.02);
  for (const [lx, lz] of [[-0.6, -0.15], [0.6, -0.15], [-0.3, -1.35]]) {
    put(g, new THREE.CylinderGeometry(0.05, 0.035, 0.6, 10), black, lx, 0.3, lz);
    put(g, new THREE.SphereGeometry(0.04, 10, 8), goldM, lx, 0.03, lz, false);
  }
  put(g, new THREE.BoxGeometry(0.3, 0.42, 0.04), black, 0, 0.21, -0.25).rotation.x = 0.2;   // the pedals' lyre
  for (const dx of [-0.06, 0, 0.06]) put(g, new THREE.BoxGeometry(0.03, 0.015, 0.08), goldM, dx, 0.05, -0.2, false);
  const bench = new THREE.Group();
  bench.position.set(0, 0, 0.42);
  g.add(bench);
  put(bench, new THREE.BoxGeometry(0.8, 0.08, 0.32), black, 0, 0.44, 0);
  put(bench, new THREE.BoxGeometry(0.76, 0.06, 0.3), std({ color: L.velvet, roughness: 0.95 }), 0, 0.51, 0);
  for (const sx of [-0.34, 0.34]) for (const sz of [-0.12, 0.12]) put(bench, new THREE.BoxGeometry(0.04, 0.4, 0.04), black, sx, 0.2, sz);
}

export const upstairsLine = () => `Upstairs there are 8 more pieces every day. Shall I open it for ${price(UPSTAIRS_PRICE)} PokéCoins? Tap again.`;
