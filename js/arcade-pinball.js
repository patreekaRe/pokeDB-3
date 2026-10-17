/* arcade-pinball.js  -  Pokémon Pinball, a home arcade game (js/arcade-kit.js). Rebuilt as a real table on 2026-10-17
   (the user's ask: the old one, three bumpers and three Diglett, was bland), after the Game Boy's Pokémon Pinball: a
   painted playfield under an arch, a plunger lane whose gauge swings (time the launch: the lit top lane is a Skill
   Shot), three rollover lanes the flippers rotate (all lit raises the bonus multiplier), Voltorb pop bumpers,
   slingshots, a spinner up the left orbit that charges the Pikachu kickbacks in both outlanes, a right orbit, a ramp
   that drops the ball onto the left flipper, a Diglett bank of drop targets that lights CATCH at the saucer, and Catch
   mode: a wild Pokémon in the middle, hit it with bumpers, ramps and orbits before it flees. Three ramps start
   Multiball (ramps then score Jackpots); the third and seventh catch give an extra ball. A ball saver opens each ball,
   shorter each ball; catches get harder as the list grows. A dot-matrix strip on top says what's lit, and each drained
   ball counts up its bonus. Still parts are painted once (`tableArt()`, `rampArt()` via the kit's `stamp()`); only the
   lamps, sprites, flippers and balls are drawn each frame. Three balls a game. */

import { runArcade, drawMon, banner, stamp } from './arcade-kit.js';
import { calmFx } from './prefs.js';

const W = 300, H = 520, R = 8, GRAV = 600, BALLS = 3, MAXV = 1150, TAU = Math.PI * 2;
const ARCH = { x: 150, y: 136, rx: 138, ry: 88 };
const FL = {
  l: { x: 92, y: 470, len: 38, rest: 0.52, up: -0.5 },
  r: { x: 188, y: 470, len: 38, rest: Math.PI - 0.52, up: Math.PI + 0.5 },
};
const LANES = [104, 140, 176], LANE_Y = 98;
const BUMPERS = [{ x: 108, y: 170 }, { x: 172, y: 170 }, { x: 140, y: 214 }], BR = 15;
const DIGLETT = [118, 140, 162], DIG_Y = 266;
const SAUCER = { x: 70, y: 262 };
const SPIN_Y = 200, PLUNGE = { x: 278, y: 486 };
const SLINGS = [{ s: 'l', a: [56, 370], b: [82, 432], c: [56, 416] }, { s: 'r', a: [224, 370], b: [198, 432], c: [224, 416] }];
const RAMP = [[227, 214], [228, 170], [222, 148], [206, 136], [180, 132], [100, 132], [74, 138], [58, 152], [50, 172], [47, 200], [46, 344]];
const MULT = [104, 128, 152, 176], MULT_Y = 352;
const GATE = [288, 146, 262, 172];          // one-way: a launched ball passes, a ball in play rolls off it to the left
const DEFLECTS = [[12, 262, 44, 290], [268, 262, 236, 290]];   // one-way: up an orbit passes, down it turns onto an inlane
const WILD = [['caterpie', 'pidgey', 'rattata', 'oddish', 'zubat', 'magikarp'], ['ekans', 'psyduck', 'geodude', 'meowth', 'jigglypuff', 'clefairy', 'staryu'], ['ditto', 'eevee', 'electrode', 'chansey'], ['snorlax', 'gyarados']];
const NAMES = { caterpie: 'Caterpie', pidgey: 'Pidgey', rattata: 'Rattata', oddish: 'Oddish', zubat: 'Zubat', magikarp: 'Magikarp', ekans: 'Ekans', psyduck: 'Psyduck', geodude: 'Geodude', meowth: 'Meowth', jigglypuff: 'Jigglypuff', clefairy: 'Clefairy', staryu: 'Staryu', ditto: 'Ditto', eevee: 'Eevee', electrode: 'Electrode', chansey: 'Chansey', snorlax: 'Snorlax', gyarados: 'Gyarados' };
const SAVER = [8, 6, 4], EXTRA_AT = [3, 8];

const WALLS = [];
for (let i = 0; i < 28; i++) {
  const a = Math.PI + i / 28 * Math.PI, b = Math.PI + (i + 1) / 28 * Math.PI;
  WALLS.push([ARCH.x + Math.cos(a) * ARCH.rx, ARCH.y + Math.sin(a) * ARCH.ry, ARCH.x + Math.cos(b) * ARCH.rx, ARCH.y + Math.sin(b) * ARCH.ry]);
}
WALLS.push([12, 136, 12, 560], [288, 136, 288, 560], [268, 166, 268, 560],
  [34, 360, 34, 432], [34, 432, 95, 465], [246, 360, 246, 432], [246, 432, 185, 465],
  ...[86, 122, 158, 194].map(x => [x, 84, x, 112]), [38, 160, 38, 250],
  ...SLINGS.flatMap(({ a, b, c }) => [[...a, ...c], [...c, ...b]]));

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
/** Pushes ball `b` out of the segment, bouncing it; the contact's normal and how hard it came in, or null. */
function hitSeg(b, x1, y1, x2, y2, bounce = 0.45, r = R) {
  const dx = x2 - x1, dy = y2 - y1, len2 = dx * dx + dy * dy;
  const t = clamp(((b.x - x1) * dx + (b.y - y1) * dy) / len2, 0, 1);
  const px = x1 + dx * t, py = y1 + dy * t, nx = b.x - px, ny = b.y - py, d = Math.hypot(nx, ny);
  if (d >= r || d === 0) return null;
  const ux = nx / d, uy = ny / d;
  b.x = px + ux * r; b.y = py + uy * r;
  const vn = b.vx * ux + b.vy * uy;
  if (vn < 0) { b.vx -= (1 + bounce) * vn * ux; b.vy -= (1 + bounce) * vn * uy; }
  return { ux, uy, vn };
}
/** Which side of the segment the ball's centre is on (>0 above a left-to-right line). */
const side = (b, [x1, y1, x2, y2]) => (x2 - x1) * (b.y - y1) - (y2 - y1) * (b.x - x1);

/** A flipper is a tapered capsule turning about its pivot: the ball meets its surface moving at ω × r, so a hit near
    the tip flies harder than one by the pivot, as on a real table. `w` is its turn rate this substep. */
function hitFlipper(b, f, ang, w) {
  const dx = Math.cos(ang) * f.len, dy = Math.sin(ang) * f.len;
  const t = clamp(((b.x - f.x) * dx + (b.y - f.y) * dy) / (f.len * f.len), 0, 1);
  const px = f.x + dx * t, py = f.y + dy * t, rr = R + 6 - 2.5 * t;
  let nx = b.x - px, ny = b.y - py;
  const d = Math.hypot(nx, ny);
  if (d >= rr || d === 0) return false;
  nx /= d; ny /= d;
  b.x = px + nx * rr; b.y = py + ny * rr;
  const sx = -w * (py - f.y), sy = w * (px - f.x), rvx = b.vx - sx, rvy = b.vy - sy, vn = rvx * nx + rvy * ny;
  if (vn < 0) {
    b.vx -= 1.35 * vn * nx; b.vy -= 1.35 * vn * ny;
    const vt = rvx * -ny + rvy * nx;
    b.vx -= vt * 0.04 * -ny; b.vy -= vt * 0.04 * nx;
  }
  return true;
}

/* ---- the painted table, once a scale ---- */
function playfieldPath(g) {
  g.beginPath();
  g.moveTo(12, 560);
  for (let i = 0; i <= 40; i++) { const a = Math.PI + i / 40 * Math.PI; g.lineTo(ARCH.x + Math.cos(a) * ARCH.rx, ARCH.y + Math.sin(a) * ARCH.ry); }
  g.lineTo(288, 560); g.closePath();
}
function lampInsert(g, x, y, r, colour) {
  g.fillStyle = 'rgba(0, 0, 0, 0.45)'; g.beginPath(); g.arc(x, y, r + 1.5, 0, TAU); g.fill();
  g.fillStyle = colour; g.globalAlpha = 0.28; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.globalAlpha = 1;
  g.strokeStyle = 'rgba(255, 255, 255, 0.25)'; g.lineWidth = 0.8; g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke();
}
function arrowPath(g, x, y, s, a) {
  const c = Math.cos(a), si = Math.sin(a), p = (u, v) => [x + u * c - v * si, y + u * si + v * c];
  g.beginPath(); g.moveTo(...p(s, 0)); g.lineTo(...p(-s * 0.6, s * 0.8)); g.lineTo(...p(-s * 0.2, 0)); g.lineTo(...p(-s * 0.6, -s * 0.8)); g.closePath();
}
function arrowInsert(g, x, y, s, a, colour) {
  g.fillStyle = 'rgba(0, 0, 0, 0.45)'; arrowPath(g, x, y, s + 1.5, a); g.fill();
  g.fillStyle = colour; g.globalAlpha = 0.28; arrowPath(g, x, y, s, a); g.fill(); g.globalAlpha = 1;
}
function label(g, text, x, y, size, colour, a = 0) {
  g.save(); g.translate(x, y); g.rotate(a);
  g.font = `800 ${size}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = size / 4; g.strokeStyle = 'rgba(0, 0, 0, 0.7)'; g.strokeText(text, 0, 0);
  g.fillStyle = colour; g.fillText(text, 0, 0);
  g.restore();
}
/** Pseudo-random from a seed, so the painted stars sit in the same places every time. */
const hash = (i) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

function tableArt(g) {
  g.fillStyle = '#120818'; g.fillRect(0, 0, W, H);
  const wood = g.createLinearGradient(0, 0, W, 0);
  wood.addColorStop(0, '#2a1630'); wood.addColorStop(0.5, '#1a0c22'); wood.addColorStop(1, '#2a1630');
  g.fillStyle = wood; g.fillRect(0, 36, W, H - 36);
  g.save();
  playfieldPath(g); g.clip();
  const field = g.createLinearGradient(0, 40, 0, H);
  field.addColorStop(0, '#1a3c94'); field.addColorStop(0.45, '#28247a'); field.addColorStop(1, '#3c1050');
  g.fillStyle = field; g.fillRect(0, 0, W, H);
  const glow = g.createRadialGradient(140, 250, 10, 140, 250, 190);
  glow.addColorStop(0, 'rgba(120, 180, 255, 0.35)'); glow.addColorStop(1, 'rgba(120, 180, 255, 0)');
  g.fillStyle = glow; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 6; i++) {   // light rays from the top
    g.fillStyle = `rgba(255, 255, 255, ${0.03 + (i % 2) * 0.02})`;
    g.beginPath(); g.moveTo(140, 40); g.lineTo(-40 + i * 70, H); g.lineTo(-10 + i * 70, H); g.fill();
  }
  for (let i = 0; i < 90; i++) {   // stars
    const x = 14 + hash(i) * 252, y = 50 + hash(i + 99) * 420, r = hash(i + 7) < 0.85 ? 0.6 : 1.2;
    g.fillStyle = `rgba(255, 255, 255, ${0.25 + hash(i + 3) * 0.5})`; g.fillRect(x, y, r, r);
  }
  // the big faded Poké Ball under everything
  g.globalAlpha = 0.16;
  g.fillStyle = '#ff3040'; g.beginPath(); g.arc(140, 300, 84, Math.PI, 0); g.fill();
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(140, 300, 84, 0, Math.PI); g.fill();
  g.globalAlpha = 0.35; g.fillStyle = '#0a0418'; g.fillRect(56, 295, 168, 10);
  g.beginPath(); g.arc(140, 300, 22, 0, TAU); g.fill();
  g.globalAlpha = 0.2; g.fillStyle = '#ffffff'; g.beginPath(); g.arc(140, 300, 13, 0, TAU); g.fill();
  g.globalAlpha = 1;
  g.strokeStyle = 'rgba(255, 220, 120, 0.25)'; g.lineWidth = 1.5; g.setLineDash([3, 5]);
  g.beginPath(); g.arc(140, 300, 92, 0, TAU); g.stroke(); g.setLineDash([]);
  // lanes' floors: the plunger lane, the left orbit, the right orbit, the top lanes
  g.fillStyle = 'rgba(0, 0, 0, 0.35)';
  g.fillRect(268, 150, 20, 410); g.fillRect(12, 160, 26, 90); g.fillRect(244, 190, 24, 70);
  for (const x of LANES) g.fillRect(x - 18, 84, 36, 28);
  g.strokeStyle = 'rgba(255, 255, 255, 0.07)'; g.lineWidth = 1;
  for (let y = 180; y < 480; y += 8) { g.beginPath(); g.moveTo(270, y); g.lineTo(286, y); g.stroke(); }
  // the apron round the flippers and the drain
  const apron = g.createLinearGradient(0, 430, 0, H);
  apron.addColorStop(0, '#2a0c3a'); apron.addColorStop(1, '#14061e');
  g.fillStyle = apron;
  g.beginPath(); g.moveTo(34, 432); g.lineTo(95, 465); g.lineTo(104, 520); g.lineTo(34, 520); g.fill();
  g.beginPath(); g.moveTo(246, 432); g.lineTo(185, 465); g.lineTo(176, 520); g.lineTo(246, 520); g.fill();
  g.fillStyle = 'rgba(0, 0, 0, 0.5)'; g.fillRect(104, 500, 72, 20);
  g.fillStyle = 'rgba(0, 0, 0, 0.3)'; g.fillRect(12, 440, 22, 80); g.fillRect(246, 440, 22, 80);
  g.restore();

  // inserts: lamps, arrows and their words, all dim; lit ones are drawn over them each frame
  for (const x of LANES) lampInsert(g, x, LANE_Y, 6, '#ffe050');
  label(g, 'P', 104, 76, 9, '#ffe9a0'); label(g, 'K', 140, 76, 9, '#ffe9a0'); label(g, 'M', 176, 76, 9, '#ffe9a0');
  MULT.forEach((x, i) => { lampInsert(g, x, MULT_Y, 8, '#ff9a30'); label(g, `${i + 2}×`, x, MULT_Y, 8, '#ffe0b0'); });
  label(g, 'BONUS', 140, MULT_Y + 15, 8, '#ffcf9a');
  arrowInsert(g, SAUCER.x, SAUCER.y + 26, 8, -Math.PI / 2, '#ff4060'); label(g, 'CATCH', SAUCER.x, SAUCER.y + 42, 8, '#ffb0c0');
  for (let i = 0; i < 3; i++) arrowInsert(g, 227, 260 - i * 13, 7, -Math.PI / 2, '#60d0ff');
  label(g, 'RAMP', 227, 276, 8, '#a8e4ff');
  for (let i = 0; i < 2; i++) arrowInsert(g, 25, 236 - i * 14, 6, -Math.PI / 2, '#80ff90');
  for (let i = 0; i < 2; i++) arrowInsert(g, 256, 250 - i * 14, 6, -Math.PI / 2, '#80ff90');
  label(g, 'ORBIT', 256, 266, 8, '#c0ffc8');
  for (const x of [23, 45, 235, 257]) lampInsert(g, x, 400, 4.5, x === 23 || x === 257 ? '#ff5050' : '#50ffa0');
  lampInsert(g, 140, 478, 7, '#ff5050'); label(g, 'SAVE', 140, 492, 8, '#ffb0b0');
  lampInsert(g, 140, 330, 5, '#ffe050');
  label(g, 'KICK', 23, 470, 8, '#fff2a0', -Math.PI / 2); label(g, 'KICK', 257, 470, 8, '#fff2a0', Math.PI / 2);
  label(g, 'POKéMON', 64, 506, 9, '#ffd84a'); label(g, 'PINBALL', 216, 506, 9, '#ffd84a');
  label(g, 'LAUNCH', 278, 420, 8, '#ffd84a', -Math.PI / 2);
  // the saucer: a dark hole in a gold ring
  g.fillStyle = '#b8862a'; g.beginPath(); g.arc(SAUCER.x, SAUCER.y, 13, 0, TAU); g.fill();
  g.fillStyle = '#ffe08a'; g.beginPath(); g.arc(SAUCER.x, SAUCER.y, 13, Math.PI * 1.1, Math.PI * 1.7); g.lineTo(SAUCER.x, SAUCER.y); g.fill();
  g.fillStyle = '#05020a'; g.beginPath(); g.arc(SAUCER.x, SAUCER.y, 9.5, 0, TAU); g.fill();
  // Diglett's dirt mounds and the bumpers' bases
  for (const x of DIGLETT) { g.fillStyle = '#5a3418'; g.beginPath(); g.ellipse(x, DIG_Y + 3, 11, 4, 0, 0, TAU); g.fill(); }
  for (const p of BUMPERS) {
    g.fillStyle = '#0a0a14'; g.beginPath(); g.arc(p.x, p.y + 2, BR + 3, 0, TAU); g.fill();
    g.fillStyle = '#d8dce8'; g.beginPath(); g.arc(p.x, p.y, BR + 2, 0, TAU); g.fill();
    g.fillStyle = '#3a3a52'; g.beginPath(); g.arc(p.x, p.y, BR - 1, 0, TAU); g.fill();
  }
  // slingshots: red plastic, a white rubber along the kicking face
  for (const { a, b, c } of SLINGS) {
    g.fillStyle = '#c81e30'; g.strokeStyle = '#4a0610'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.lineTo(...c); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255, 255, 255, 0.85)';
    g.beginPath(); g.moveTo(a[0] + (b[0] - a[0]) * 0.3 + (a[0] < 140 ? -6 : 6), a[1] + (b[1] - a[1]) * 0.55); g.arc(a[0] + (b[0] - a[0]) * 0.3 + (a[0] < 140 ? -6 : 6), a[1] + (b[1] - a[1]) * 0.55, 4, 0, TAU); g.fill();
    g.strokeStyle = '#f4f4f4'; g.lineWidth = 3; g.lineCap = 'round';
    g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke();
  }
  // the walls: chrome rails
  g.lineCap = 'round';
  for (const [w, c] of [[6, '#22182e'], [3.5, '#aab4c8'], [1.2, '#ffffff']]) {
    g.lineWidth = w; g.strokeStyle = c;
    for (const s of WALLS) { g.beginPath(); g.moveTo(s[0], s[1]); g.lineTo(s[2], s[3]); g.stroke(); }
  }
  g.strokeStyle = '#ffd84a'; g.lineWidth = 1.5;   // a gold inner rail along the arch
  g.beginPath();
  for (let i = 0; i <= 40; i++) { const a = Math.PI + i / 40 * Math.PI; g.lineTo(ARCH.x + Math.cos(a) * (ARCH.rx - 5), ARCH.y + Math.sin(a) * (ARCH.ry - 5)); }
  g.stroke();
  for (const [x1, y1, x2, y2] of [GATE, ...DEFLECTS]) {   // one-way gates: thin wire flaps
    g.strokeStyle = '#d0d8e8'; g.lineWidth = 2; g.setLineDash([4, 2]);
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); g.setLineDash([]);
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x1, y1, 2.2, 0, TAU); g.fill();
  }
  for (const x of [86, 122, 158, 194]) for (const y of [84, 112]) {   // posts with red rubbers
    g.fillStyle = '#d02838'; g.beginPath(); g.arc(x, y, 3.5, 0, TAU); g.fill();
    g.fillStyle = '#ffd0d0'; g.beginPath(); g.arc(x - 1, y - 1, 1.2, 0, TAU); g.fill();
  }
  for (const x of [12, 38]) { g.fillStyle = '#aab4c8'; g.beginPath(); g.arc(x, SPIN_Y, 2.5, 0, TAU); g.fill(); }   // the spinner's bracket
  // flipper pivots' housings
  for (const f of [FL.l, FL.r]) { g.fillStyle = '#1a0c22'; g.beginPath(); g.arc(f.x, f.y, 9, 0, TAU); g.fill(); }
  // the plunger's housing at the foot of its lane
  g.fillStyle = '#2a2236'; g.fillRect(268, 494, 20, 26);
  g.strokeStyle = 'rgba(255, 255, 255, 0.15)'; g.strokeRect(268.5, 494.5, 19, 25);
  // the dot-matrix display's bezel
  g.fillStyle = '#05030a'; g.fillRect(6, 2, W - 12, 34);
  g.strokeStyle = '#ffd84a'; g.lineWidth = 1.5; g.strokeRect(7, 3, W - 14, 32);
}

/** The ramp's clear plastic over the playfield (painted on a layer drawn over the balls in play, under one riding it). */
function rampArt(g) {
  g.lineCap = 'round'; g.lineJoin = 'round';
  const line = () => { g.beginPath(); g.moveTo(...RAMP[0]); for (const p of RAMP.slice(1)) g.lineTo(...p); };
  line(); g.strokeStyle = 'rgba(0, 0, 0, 0.25)'; g.lineWidth = 26; g.stroke();
  line(); g.strokeStyle = 'rgba(200, 240, 255, 0.55)'; g.lineWidth = 23; g.stroke();
  line(); g.strokeStyle = 'rgba(70, 150, 230, 0.55)'; g.lineWidth = 19; g.stroke();
  line(); g.strokeStyle = 'rgba(255, 255, 255, 0.35)'; g.lineWidth = 1.2; g.setLineDash([6, 6]); g.stroke(); g.setLineDash([]);
  g.fillStyle = '#ffd84a'; g.strokeStyle = '#5a3408'; g.lineWidth = 1;   // the ramp's sign
  g.beginPath(); g.rect(206, 220, 42, 12); g.fill(); g.stroke();
  g.font = '800 8px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#5a1a08';
  g.fillText('PIKA RAMP', 227, 226.5);
}

/** The dot-matrix display's dots, painted once and laid over the scaled-up text. */
function dotGrid(g) {
  g.fillStyle = '#05030a';
  for (let x = 0; x <= 280; x += 2) g.fillRect(x - 0.35, 0, 0.7, 30);
  for (let y = 0; y <= 30; y += 2) g.fillRect(0, y - 0.35, 280, 0.7);
}

const balls = new Map();
/** A Poké Ball, `r` round, painted once a scale. */
function ballArt(s) {
  if (balls.has(s)) return balls.get(s);
  const c = document.createElement('canvas'), px = Math.ceil((R + 1) * 2 * s);
  c.width = c.height = px;
  const g = c.getContext('2d');
  g.scale(s, s); g.translate(R + 1, R + 1);
  g.fillStyle = '#e83040'; g.beginPath(); g.arc(0, 0, R, Math.PI, 0); g.fill();
  g.fillStyle = '#f4f4f8'; g.beginPath(); g.arc(0, 0, R, 0, Math.PI); g.fill();
  g.fillStyle = '#202028'; g.fillRect(-R, -1.1, R * 2, 2.2);
  g.beginPath(); g.arc(0, 0, 3, 0, TAU); g.fill();
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(0, 0, 1.8, 0, TAU); g.fill();
  g.strokeStyle = '#202028'; g.lineWidth = 1.2; g.beginPath(); g.arc(0, 0, R - 0.4, 0, TAU); g.stroke();
  balls.set(s, c);
  return c;
}

/* ---- the game ---- */
export const openPinball = (onClose) => runArcade({
  id: 'pinball', title: 'Pokémon Pinball', colour: '#e8c030', W, H,
  intro: 'Time the LAUNCH, then flip with ◀ ▶ or the screen\'s halves!',
  go: 'LAUNCH when the gauge is right: the flashing top lane is a Skill Shot.',
  keys: { left: [['◀', 'left']], right: [['▶', 'right']] },
  pad: [['LAUNCH', 'plunge']],
  sounds: ['fx-click', 'fx-pop', 'fx-ding', 'fx-whoosh', 'fx-bloop', 'fx-tick', 'hit-weak', 'ball-throw', 'catch-success', 'run-away', 'thunder', 'heal'],
  help: [
    ['◀ ▶ flip (or tap the left or right half).', 'LAUNCH (▼ or Space too) fires the plunger as its gauge swings: roll through the flashing top lane for a Skill Shot.'],
    ['Light all three top lanes for a bigger bonus.', 'Flipping moves the lit lanes. Voltorb bumpers, slingshots, the spinner and both orbits score.'],
    ['Knock down the three Diglett to light CATCH,', 'then sink the saucer: hit the wild Pokémon with bumpers, ramps and orbits before it flees!'],
    ['Three ramps start Multiball, and ramps then score Jackpots.', 'The spinner charges Pikachu, who kicks a ball back up an outlane.'],
    [`${BALLS} balls, each starting with a ball saver.`, 'Catch 3 Pokémon for an extra ball. Each drained ball counts up its bonus.'],
  ],
  make(api) {
    const calm = calmFx();
    let ball = 1, left = BALLS, phase = 0, wait = 0, save = 0, tally = null, over = false;
    const ang = { l: FL.l.rest, r: FL.r.rest }, flip = { l: false, r: false }, held = { l: 0, r: 0 };
    let field = [{ x: PLUNGE.x, y: PLUNGE.y, vx: 0, vy: 0, lane: true, spin: 0 }];
    const riders = [], saucer = [], parts = [];
    const lit = { bump: [0, 0, 0], sling: { l: 0, r: 0 }, lanes: [false, false, false], inl: [0, 0, 0, 0] };
    let digs = [true, true, true], digBack = 0, catchLit = false, catching = null, caught = [];
    let ramps = 0, multi = false, charge = 0, chargeNeed = 20, spinA = 0, spinV = 0;
    let mult = 1, skill = Math.floor(Math.random() * 3), skillT = 0, launched = false;
    let msg = '', msgT = 0, big = null, flash = 0, shake = 0;
    let bonus = { targets: 0, ramps: 0, orbits: 0, catches: 0, spins: 0 };

    const say = (text, t = 2.2) => { msg = text; msgT = t; };
    const shout = (text, colour = '#ffd84a') => { big = { text, colour, t: 1.6 }; };
    const boom = (x, y, colour, n = 14, f = 1) => {
      if (calm) n = Math.ceil(n / 3);
      for (let i = 0; i < n && parts.length < 140; i++) { const a = Math.random() * TAU, v = 60 + Math.random() * 160; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0.5 + Math.random() * 0.4, c: colour }); }
      if (!calm) { flash = Math.max(flash, 0.35 * f); shake = Math.max(shake, 3 * f); }
    };
    const waiting = () => field.find(b => b.lane && b.y >= PLUNGE.y - 0.5 && Math.abs(b.vy) < 1);
    const hitMon = (n) => {
      if (!catching) return;
      catching.hits += n; catching.wobble = 0.3;
      if (catching.hits < catching.need) return;
      const tier = catching.tier, pts = 5000 + 2500 * tier + 1000 * caught.length;
      caught.push(catching.id); bonus.catches++;
      api.add(pts); api.sound('catch-success', 'stat-up');
      shout(`GOTCHA! ${NAMES[catching.id].toUpperCase()}`, '#ffe060');
      say(`CAUGHT ${NAMES[catching.id].toUpperCase()} +${pts}`, 3);
      api.say(`Gotcha! ${NAMES[catching.id]} was caught! +${pts.toLocaleString()} (${caught.length} caught)`);
      boom(140, 318, '#ffe060', 30, 1.4);
      catching = null;
      if (EXTRA_AT.includes(caught.length)) { left++; shout('EXTRA BALL!', '#80ff90'); api.sound('heal', 'stat-up'); api.say(`${caught.length} caught: an extra ball!`); }
    };
    const startCatch = () => {
      const tier = Math.min(3, Math.floor(caught.length / 2) + (Math.random() < 0.25 ? 1 : 0));
      const list = WILD[Math.min(3, tier)].filter(id => id !== caught[caught.length - 1]);
      const id = list[Math.floor(Math.random() * list.length)];
      catching = { id, tier, hits: 0, need: Math.min(12, 5 + caught.length), t: catchTime(), full: catchTime(), wobble: 0, appear: 0.6 };
      catchLit = false;
      api.sound('ball-throw', 'confirm');
      shout(`WILD ${NAMES[id].toUpperCase()}!`, '#ff8090');
      api.say(`A wild ${NAMES[id]} appeared! Hit it ${catching.need} times: bumpers, ramps, orbits!`);
    };
    const launchBall = (power) => {
      const b = waiting();
      if (!b) return;
      b.vy = -(640 + 540 * power); b.vx = 0;
      api.sound('fx-whoosh', 'select');
      if (!launched) { launched = true; skillT = 5; if (!save) save = SAVER[Math.min(2, ball - 1)]; }
      wait = 0;
    };
    const press = (s, on) => {
      if (on && !flip[s]) {
        api.sound('fx-click', 'select');
        // flipping turns the lit top lanes, so a player can line the unlit one up under a falling ball
        if (s === 'l') lit.lanes.push(lit.lanes.shift()); else lit.lanes.unshift(lit.lanes.pop());
      }
      flip[s] = on;
    };
    const newBall = () => {
      field = [{ x: PLUNGE.x, y: PLUNGE.y, vx: 0, vy: 0, lane: true, spin: 0 }];
      launched = false; skill = Math.floor(Math.random() * 3); skillT = 0; save = 0; mult = 1;
      lit.lanes = [false, false, false]; multi = false; tally = null; phase = 0; wait = 0;
      bonus = { targets: 0, ramps: 0, orbits: 0, catches: 0, spins: 0 };
      say(`BALL ${ball}`, 1.6);
    };
    const drained = () => {
      api.sound('cancel');
      if (catching) { say(`${NAMES[catching.id].toUpperCase()} FLED`, 2); catching = null; }
      const base = bonus.targets * 250 + bonus.ramps * 1000 + bonus.orbits * 500 + bonus.catches * 2500 + bonus.spins * 25;
      tally = { base, mult, total: base * mult, t: 0 };
      api.say(`Ball ${ball} drained. Bonus ${base.toLocaleString()} × ${mult}.`);
    };

    const step = (h) => {
      const grav = GRAV + Math.min(180, caught.length * 15);
      for (const s of ['l', 'r']) {
        const f = FL[s], want = flip[s] ? f.up : f.rest, was = ang[s];
        ang[s] += Math.sign(want - ang[s]) * Math.min(Math.abs(want - ang[s]), h * (flip[s] ? 26 : 14));
        f.w = (ang[s] - was) / h;
      }
      for (const b of field) {
        const py = b.y;
        b.vy += grav * h; b.x += b.vx * h; b.y += b.vy * h;
        b.spin += b.vx * h / R;
        if (b.lane) {
          if (b.y < 140) b.lane = false;
          if (b.y > PLUNGE.y) { b.y = PLUNGE.y; b.vy = 0; b.vx = 0; b.x = PLUNGE.x; }
        } else if (side(b, GATE) > 0) hitSeg(b, ...GATE, 0.3);
        else if (b.x > 268) b.lane = true;
        if (!b.lane && b.vy > 0) for (const d of DEFLECTS) if (side(b, d) * (d[0] < 140 ? 1 : -1) < 0) hitSeg(b, ...d, 0.2);
        for (const w of WALLS) hitSeg(b, ...w);
        for (const sl of SLINGS) {
          const c = hitSeg(b, ...sl.a, ...sl.b, 0.4);
          if (c && c.vn < -40 && !lit.sling[sl.s]) {
            b.vx += c.ux * 360; b.vy += c.uy * 360; lit.sling[sl.s] = 0.12;
            api.add(10); api.sound('fx-pop', 'plink-1');
          }
        }
        for (const s of ['l', 'r']) hitFlipper(b, FL[s], ang[s], FL[s].w);
        BUMPERS.forEach((p, i) => {
          const dx = b.x - p.x, dy = b.y - p.y, d = Math.hypot(dx, dy);
          if (d >= R + BR || d === 0) return;
          const ux = dx / d, uy = dy / d, vn = b.vx * ux + b.vy * uy;
          b.x = p.x + ux * (R + BR); b.y = p.y + uy * (R + BR);
          if (vn < 0) { b.vx -= 2 * vn * ux; b.vy -= 2 * vn * uy; }
          b.vx += ux * 300; b.vy += uy * 300;
          if (lit.bump[i] < 0.05) { api.add(100); api.sound(i % 2 ? 'plink-2' : 'plink-1'); hitMon(1); boom(b.x, b.y, '#fff080', 5, 0.2); }
          lit.bump[i] = 0.14;
        });
        digs.forEach((up, i) => {
          if (!up || digBack) return;
          const c = hitSeg(b, DIGLETT[i] - 10, DIG_Y, DIGLETT[i] + 10, DIG_Y, 0.5);
          if (!c) return;
          digs[i] = false; bonus.targets++; api.add(250); api.sound('hit-weak', 'plink-2'); hitMon(1);
          boom(DIGLETT[i], DIG_Y - 8, '#c08850', 8, 0.3);
          if (!digs.some(Boolean)) {
            digBack = 1.4; api.add(1000);
            if (!catching && !catchLit) { catchLit = true; say('CATCH IS LIT!', 2.5); api.say('Diglett down! CATCH is lit: sink the saucer!'); api.sound('stat-up'); }
            else say('DIGLETT BANK 1000');
          }
        });
        // sensors: lines the ball crosses
        const cross = (y) => (py < y) !== (b.y < y);
        if (cross(LANE_Y)) LANES.forEach((x, i) => {
          if (Math.abs(b.x - x) > 14) return;
          if (skillT > 0 && i === skill && launched) { api.add(5000); shout('SKILL SHOT!', '#80e0ff'); api.sound('stat-up'); boom(x, LANE_Y, '#80e0ff', 20); }
          skillT = 0;
          if (!lit.lanes[i]) { lit.lanes[i] = true; api.add(500); api.sound('fx-ding', 'plink-2'); }
          else api.add(100);
          if (lit.lanes.every(Boolean)) {
            lit.lanes = [false, false, false];
            if (mult < 5) { mult++; shout(`BONUS ${mult}×`, '#ffb050'); } else { api.add(5000); shout('BONUS MAX', '#ffb050'); }
            api.sound('stat-up');
          }
        });
        if (cross(400) && b.vy > 0) {
          const j = b.x < 34 ? 0 : b.x < 56 ? 1 : b.x > 246 ? 3 : b.x > 224 ? 2 : -1;
          if (j >= 0) { lit.inl[j] = 1.2; if (j === 1 || j === 2) { api.add(200); charge += 2 / chargeNeed; } }
        }
        if (b.x < 38 && cross(SPIN_Y)) { spinV = Math.min(24, Math.abs(b.vy) / 30); }
        if (b.x < 38 && cross(230) && b.vy < 0) orbit('LEFT');
        if (b.x > 242 && b.x < 268 && cross(210) && b.vy < 0 && !b.lane) orbit('RIGHT');
        if (b.x > 212 && b.x < 242 && b.y > 196 && b.y < 222 && b.vy < -200) b.ramp = true;
        if (Math.hypot(b.x - SAUCER.x, b.y - SAUCER.y) < 9 && Math.hypot(b.vx, b.vy) < 650) b.saucer = true;
        // Pikachu's thunder kicks a ball back up an outlane
        if (!b.lane && b.y > 462 && b.y < 500 && (b.x < 34 || b.x > 246) && charge >= 1) {
          b.vy = -980; b.vx = 0; charge = 0; chargeNeed += 8;
          api.sound('thunder', 'plink-2'); shout('PIKACHU!', '#fff060'); boom(b.x, b.y, '#fff060', 24, 1.2);
          api.say('Pikachu\'s Thunderbolt kicked it back!');
        }
        const sp = Math.hypot(b.vx, b.vy);
        if (sp > MAXV) { b.vx *= MAXV / sp; b.vy *= MAXV / sp; }
      }
      for (let i = 0; i < field.length; i++) for (let j = i + 1; j < field.length; j++) {   // multiball: balls knock each other
        const a = field[i], b = field[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
        if (d >= R * 2 || d === 0) continue;
        const ux = dx / d, uy = dy / d, o = (R * 2 - d) / 2;
        a.x -= ux * o; a.y -= uy * o; b.x += ux * o; b.y += uy * o;
        const rel = (a.vx - b.vx) * ux + (a.vy - b.vy) * uy;
        if (rel > 0) { a.vx -= rel * ux; a.vy -= rel * uy; b.vx += rel * ux; b.vy += rel * uy; }
      }
      for (let i = field.length - 1; i >= 0; i--) {
        const b = field[i];
        if (b.ramp) { field.splice(i, 1); riders.push({ d: 0, spin: b.spin }); api.sound('fx-whoosh', 'select'); continue; }
        if (b.saucer) { field.splice(i, 1); saucer.push({ t: 1.1 }); sink(); continue; }
        if (b.y > H + 24) { field.splice(i, 1); lost(); }
      }
    };

    function orbit(which) {
      bonus.orbits++; api.add(750); hitMon(2); say(`${which} ORBIT 750`, 1.4); api.sound('fx-ding', 'plink-2');
    }
    function sink() {
      api.sound('fx-bloop', 'select');
      if (catching) { api.add(1500); hitMon(2); say('SAUCER 1500', 1.4); }
      else if (catchLit) startCatch();
      else { api.add(500); say('SAUCER 500', 1.4); }
    }
    function rampDone() {
      bonus.ramps++; hitMon(2);
      if (multi) { const pts = 10000 + 5000 * caught.length; api.add(pts); shout('JACKPOT!', '#ff70e0'); boom(46, 300, '#ff70e0', 26, 1.3); api.sound('coins', 'stat-up'); api.say(`Jackpot! +${pts.toLocaleString()}`); return; }
      ramps++; api.add(1000); api.sound('fx-ding', 'plink-2');
      if (ramps % 3) { say(`RAMP ${ramps % 3}/3`, 1.6); return; }
      multi = true; save = Math.max(save, 8);
      field.push({ x: PLUNGE.x, y: PLUNGE.y, vx: 0, vy: -(1040 + Math.random() * 80), lane: true, spin: 0 });
      shout('MULTIBALL!', '#ff70e0'); boom(140, 260, '#ff70e0', 30, 1.5);
      api.sound('stat-up'); api.say('Multiball! Every ramp is a Jackpot while two balls are up.');
    }
    function inPlay() { return field.length + riders.length + saucer.length; }
    function lost() {
      if (save > 0) {
        field.push({ x: PLUNGE.x, y: PLUNGE.y, vx: 0, vy: -(1000 + Math.random() * 100), lane: true, spin: 0 });
        shout('BALL SAVED', '#80ff90'); api.sound('heal', 'confirm'); api.say('Ball saved! It\'s back in the lane.');
        return;
      }
      if (inPlay() > 0) { if (inPlay() === 1 && multi) { multi = false; say('MULTIBALL OVER', 1.8); } return; }
      drained();
    }

    const game = {
      tick(dt) {
        if (over) return;
        if (tally) {
          tally.t += dt;
          if (tally.t >= 2.2) {
            api.add(tally.total);
            left--; ball++;
            if (left <= 0) { over = true; tally = null; return api.over(caught.length ? `${caught.length} Pokémon caught!` : 'Last ball down!'); }
            newBall();
          }
          return;
        }
        const w = waiting();
        if (w) { phase += dt * TAU * 0.85; wait += dt; if (wait > 8) launchBall(0.45 + Math.random() * 0.3); }
        const fast = field.reduce((m, b) => Math.max(m, Math.hypot(b.vx, b.vy)), 0);
        const n = clamp(Math.ceil(fast * dt / 2.5), 6, 18);
        for (let i = 0; i < n; i++) step(dt / n);
        for (let i = riders.length - 1; i >= 0; i--) {
          const r = riders[i];
          r.d += dt * 560; r.spin -= dt * 18;
          if (r.d >= rampLen) { riders.splice(i, 1); field.push({ x: 46, y: 344, vx: 0, vy: 180, lane: false, spin: r.spin }); rampDone(); }
        }
        for (let i = saucer.length - 1; i >= 0; i--) if ((saucer[i].t -= dt) <= 0) {
          saucer.splice(i, 1);
          field.push({ x: SAUCER.x + 2, y: SAUCER.y + 10, vx: 150 + Math.random() * 60, vy: 120, lane: false, spin: 0 });
          api.sound('fx-pop', 'plink-1');
        }
        if (save > 0 && launched) save = Math.max(0, save - dt);
        if (skillT > 0) skillT = Math.max(0, skillT - dt);
        if (digBack && (digBack = Math.max(0, digBack - dt)) === 0) digs = [true, true, true];
        if (spinV > 0.1) {
          const before = Math.floor(spinA / Math.PI);
          spinA += spinV * TAU * dt; spinV *= Math.exp(-dt * 1.6);
          const turns = Math.floor(spinA / Math.PI) - before;
          if (turns > 0) {
            bonus.spins += turns; api.add(50 * turns);
            const was = charge;
            charge = Math.min(1, charge + turns / chargeNeed);
            if (was < 1 && charge >= 1) { say('PIKACHU READY!', 2); api.sound('thunder', 'plink-2'); }
            else api.sound('fx-tick', 'select');
          }
        } else spinV = 0;
        if (catching) {
          catching.t -= dt; catching.wobble = Math.max(0, catching.wobble - dt); catching.appear = Math.max(0, catching.appear - dt);
          if (catching.t <= 0) { say(`${NAMES[catching.id].toUpperCase()} FLED`, 2.2); api.sound('run-away', 'cancel'); api.say(`${NAMES[catching.id]} fled! Knock down the Diglett to light CATCH again.`); catching = null; }
        }
        lit.bump.forEach((v, i) => { lit.bump[i] = Math.max(0, v - dt); });
        for (const s of ['l', 'r']) lit.sling[s] = Math.max(0, lit.sling[s] - dt);
        lit.inl.forEach((v, i) => { lit.inl[i] = Math.max(0, v - dt); });
        msgT = Math.max(0, msgT - dt); flash = Math.max(0, flash - dt * 2.2); shake = Math.max(0, shake - dt * 14);
        if (big && (big.t -= dt) <= 0) big = null;
        for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.vy += 300 * dt; p.x += p.vx * dt; p.y += p.vy * dt; if ((p.t -= dt) <= 0) parts.splice(i, 1); }
      },
      plunge() { launchBall(power()); },
      down(x) {
        const s = x < W / 2 ? 'l' : 'r';
        held[s]++; press(s, true);
        if (s === 'r' && waiting()) launchBall(power());
      },
      up(x) {
        const s = held.l && held.r ? (x < W / 2 ? 'l' : 'r') : held.l ? 'l' : 'r';
        held[s] = Math.max(0, held[s] - 1);
        if (!held[s]) press(s, false);
      },
      key(k, down) {
        if (k === 'left' || k === 'right') press(k[0], down);
        else if (k === 'down') { if (down) launchBall(power()); }
        else if (k === 'act') { if (down && waiting()) launchBall(power()); else { press('l', down); press('r', down); } }
      },
      draw(g, now) {
        const sc = g.getTransform().a;
        g.save();
        if (shake && !calm) g.translate(Math.round((Math.random() - 0.5) * shake * 2), Math.round((Math.random() - 0.5) * shake * 2));
        stamp(g, 'pin-table', 0, 0, W, H, tableArt);
        const blink = (rate = 160) => Math.floor(now / rate) % 2 === 0;
        const glow = (x, y, r, c, a = 1) => { g.globalAlpha = a; g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.globalAlpha = 1; };
        // lamps
        LANES.forEach((x, i) => {
          if (lit.lanes[i]) glow(x, LANE_Y, 6, '#ffe860');
          else if (skillT > 0 || !launched) { if (i === skill && blink(120)) glow(x, LANE_Y, 6, '#80e0ff'); }
        });
        MULT.forEach((x, i) => { if (mult >= i + 2) { glow(x, MULT_Y, 8, '#ff9a30', 0.75); g.fillStyle = '#fff'; g.font = '800 8px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(`${i + 2}×`, x, MULT_Y); } });
        if (catchLit && blink(200)) { g.fillStyle = '#ff4060'; arrowPath(g, SAUCER.x, SAUCER.y + 26, 8, -Math.PI / 2); g.fill(); }
        for (let i = 0; i < 3; i++) if ((multi && blink(140)) || (!multi && ramps % 3 > i)) { g.fillStyle = multi ? '#ff70e0' : '#60d0ff'; arrowPath(g, 227, 260 - i * 13, 7, -Math.PI / 2); g.fill(); }
        if (catching && blink(180)) { g.fillStyle = '#80ff90'; for (let i = 0; i < 2; i++) { arrowPath(g, 25, 236 - i * 14, 6, -Math.PI / 2); g.fill(); arrowPath(g, 256, 250 - i * 14, 6, -Math.PI / 2); g.fill(); } }
        [23, 45, 235, 257].forEach((x, i) => { if (lit.inl[i]) glow(x, 400, 4.5, i === 0 || i === 3 ? '#ff5050' : '#50ffa0', Math.min(1, lit.inl[i] * 2)); });
        if (save > 0 && (save > 3 || blink(120))) glow(140, 478, 7, '#ff5050');
        if (charge >= 1 && blink(220)) for (const x of [23, 257]) glow(x, 470, 6, '#fff060', 0.6);
        // charge meter beside the spinner
        g.fillStyle = 'rgba(0, 0, 0, 0.5)'; g.fillRect(41, 172, 5, 48);
        g.fillStyle = charge >= 1 ? '#fff060' : '#e8c030'; g.fillRect(41, 220 - 48 * Math.min(1, charge), 5, 48 * Math.min(1, charge));
        // Diglett and the bumpers
        digs.forEach((up, i) => {
          if (up && !digBack) drawMon(g, 'diglett', DIGLETT[i], DIG_Y + 4, 24);
          else if (digBack && digBack < 0.4) drawMon(g, 'diglett', DIGLETT[i], DIG_Y + 4 + digBack * 40, 24);
          else { g.fillStyle = '#1a0c06'; g.beginPath(); g.ellipse(DIGLETT[i], DIG_Y + 2, 8, 3, 0, 0, TAU); g.fill(); }
        });
        BUMPERS.forEach((p, i) => {
          if (lit.bump[i]) glow(p.x, p.y, BR + 5, '#fff070', 0.8);
          drawMon(g, 'voltorb', p.x, p.y + 13 - (lit.bump[i] ? 2 : 0), 26);
        });
        for (const sl of SLINGS) if (lit.sling[sl.s]) { g.strokeStyle = '#fff070'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(...sl.a); g.lineTo(...sl.b); g.stroke(); }
        // the spinner: a plate seen turning edge-on
        const sh = Math.abs(Math.cos(spinA)) * 6 + 0.8;
        g.fillStyle = Math.cos(spinA) > 0 ? '#e8e8f0' : '#ffd84a'; g.fillRect(14, SPIN_Y - sh / 2, 22, sh);
        g.strokeStyle = '#3a3048'; g.lineWidth = 0.8; g.strokeRect(14, SPIN_Y - sh / 2, 22, sh);
        // Pikachu by the outlanes
        const bob = charge >= 1 ? Math.abs(Math.sin(now / 180)) * 3 : 0;
        drawMon(g, 'pikachu', 23, 518 - bob, 26);
        drawMon(g, 'pikachu', 257, 518 - bob, 26, true);
        // the wild Pokémon in Catch mode, a ring of hits round it and its timer under
        if (catching) {
          const cx = 140, cy = 322, k = 1 - catching.appear / 0.6;
          glow(cx, cy - 18, 30 * k, 'rgba(255, 255, 255, 0.18)');
          for (let i = 0; i < catching.need; i++) {
            const a = -Math.PI / 2 + i / catching.need * TAU;
            glow(cx + Math.cos(a) * 32, cy - 18 + Math.sin(a) * 32, 3, i < catching.hits ? '#ffe060' : 'rgba(255, 255, 255, 0.3)');
          }
          drawMon(g, catching.id, cx + (catching.wobble ? Math.sin(now / 20) * 3 : 0), cy + 2, 42 * k);
          g.fillStyle = 'rgba(0, 0, 0, 0.55)'; g.fillRect(cx - 26, cy + 18, 52, 5);
          g.fillStyle = catching.t < 5 && blink(120) ? '#ff5050' : '#80ff90';
          g.fillRect(cx - 26, cy + 18, 52 * Math.max(0, catching.t) / catching.full, 5);
        }
        // flippers: white bats with a red rubber, tapered to the tip
        for (const s of ['l', 'r']) {
          const f = FL[s], a = ang[s], ex = f.x + Math.cos(a) * f.len, ey = f.y + Math.sin(a) * f.len, nx = -Math.sin(a), ny = Math.cos(a);
          g.fillStyle = '#4a0610';
          g.beginPath(); g.arc(f.x, f.y, 7.5, a + Math.PI / 2, a - Math.PI / 2); g.lineTo(ex + nx * -4.5, ey + ny * -4.5); g.arc(ex, ey, 4.5, a - Math.PI / 2, a + Math.PI / 2); g.closePath(); g.fill();
          g.fillStyle = '#f4f4f8';
          g.beginPath(); g.arc(f.x, f.y, 6, a + Math.PI / 2, a - Math.PI / 2); g.lineTo(ex + nx * -3.2, ey + ny * -3.2); g.arc(ex, ey, 3.2, a - Math.PI / 2, a + Math.PI / 2); g.closePath(); g.fill();
          g.strokeStyle = '#e83040'; g.lineWidth = 2; g.beginPath(); g.moveTo(f.x + nx * 3, f.y + ny * 3); g.lineTo(ex + nx * 1.5, ey + ny * 1.5); g.stroke();
          g.fillStyle = '#ffd84a'; g.beginPath(); g.arc(f.x, f.y, 2.2, 0, TAU); g.fill();
        }
        // the plunger, drawn back by the gauge while a ball waits on it
        const pw = waiting() ? power() : 0, top = PLUNGE.y + R + pw * 18;
        g.strokeStyle = '#8a8a9a'; g.lineWidth = 1.2; g.beginPath();
        for (let i = 0; i <= 10; i++) g.lineTo(272 + (i % 2) * 12, top + 4 + i * (H - top - 4) / 10);
        g.stroke();
        g.fillStyle = '#d8d8e4'; g.fillRect(274, top, 8, 4); g.fillStyle = '#e83040'; g.fillRect(273, top - 1, 10, 2);
        if (waiting()) {
          g.fillStyle = 'rgba(0, 0, 0, 0.6)'; g.fillRect(291, 380, 6, 100);
          g.fillStyle = pw > 0.8 ? '#ff5050' : pw > 0.45 ? '#ffd84a' : '#80ff90'; g.fillRect(291, 480 - 100 * pw, 6, 100 * pw);
        }
        // balls in play, then the ramp's plastic over them, then a ball riding it
        const bimg = ballArt(sc);
        const drawBall = (x, y, spin, k = 1) => {
          g.save(); g.translate(x, y); g.rotate(spin); g.scale(k, k);
          g.drawImage(bimg, -R - 1, -R - 1, bimg.width / sc, bimg.height / sc);
          g.restore();
          g.fillStyle = 'rgba(255, 255, 255, 0.85)'; g.beginPath(); g.arc(x - R * 0.35 * k, y - R * 0.4 * k, 1.8 * k, 0, TAU); g.fill();
        };
        for (const s of saucer) drawBall(SAUCER.x, SAUCER.y, 0, 0.6 + 0.4 * Math.max(0, s.t - 0.8) / 0.3);
        for (const b of field) drawBall(b.x, b.y, b.spin);
        stamp(g, 'pin-ramp', 0, 0, W, H, rampArt);
        for (const r of riders) { const [x, y] = rampAt(r.d); g.fillStyle = 'rgba(0, 0, 0, 0.35)'; g.beginPath(); g.arc(x + 3, y + 4, R, 0, TAU); g.fill(); drawBall(x, y, r.spin, 1.12); }
        for (const p of parts) { g.globalAlpha = Math.min(1, p.t * 2); g.fillStyle = p.c; g.fillRect(p.x - 1.2, p.y - 1.2, 2.4, 2.4); }
        g.globalAlpha = 1;
        g.restore();
        drawDmd(g, now);
        if (big) {
          const k = Math.min(1, big.t / 0.4), pop = 1 + Math.max(0, big.t - 1.3) * 1.2;
          g.globalAlpha = k; banner(g, big.text, W / 2, 200, 22 * pop, big.colour, W * 0.86); g.globalAlpha = 1;
        }
        if (tally) {
          g.fillStyle = 'rgba(5, 3, 15, 0.72)'; g.fillRect(30, 170, 240, 120);
          g.strokeStyle = '#ffd84a'; g.lineWidth = 2; g.strokeRect(30, 170, 240, 120);
          const k = Math.min(1, tally.t / 1.2);
          banner(g, `BALL ${ball} BONUS`, W / 2, 192, 16, '#ffd84a');
          banner(g, Math.round(tally.base * k).toLocaleString(), W / 2, 222, 20, '#ffffff');
          if (tally.t > 1.2) banner(g, `× ${tally.mult}`, W / 2, 246, 16, '#ffb050');
          if (tally.t > 1.6) banner(g, `= ${tally.total.toLocaleString()}`, W / 2, 272, 18, '#80ff90');
        }
        if (waiting() && !launched && !tally && blink(400)) banner(g, 'LAUNCH ▶', 222, 452, 12, '#ffd84a');
        if (flash && !calm) { g.fillStyle = `rgba(255, 255, 255, ${flash * 0.5})`; g.fillRect(0, 0, W, H); }
      },
    };

    return game;
    function power() { return 0.5 - 0.5 * Math.cos(phase); }
    function catchTime() { return Math.max(14, 28 - caught.length * 2); }

    function dmdText(now) {
      if (tally) return `BONUS ${tally.total.toLocaleString()}`;
      if (msgT > 0) return msg;
      if (catching) return `${NAMES[catching.id].toUpperCase()} ${catching.hits}/${catching.need} ${Math.ceil(catching.t)}S`;
      if (waiting() && !launched) return `BALL ${ball} · LAUNCH!`;
      const lines = [`BALL ${ball}  BONUS ${mult}X`, catchLit ? 'CATCH LIT · SAUCER' : `DIGLETT ${digs.filter(d => !d).length}/3`,
        multi ? 'JACKPOT IS LIT' : `RAMP ${ramps % 3}/3 MULTIBALL`, charge >= 1 ? 'PIKACHU READY' : `PIKACHU ${Math.floor(charge * 100)}%`, `CAUGHT ${caught.length}`];
      return lines[Math.floor(now / 2200) % lines.length];
    }
    function drawDmd(g, now) {
      const text = dmdText(now);
      if (text !== dmd.text) {
        dmd.text = text;
        const x = dmd.cv.getContext('2d');
        x.clearRect(0, 0, 140, 15);
        x.font = 'bold 11px monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#ff9a2a';
        const w = x.measureText(text).width;
        if (w > 136) { x.save(); x.scale(136 / w, 1); x.fillText(text, 70 * w / 136, 8); x.restore(); } else x.fillText(text, 70, 8);
      }
      g.fillStyle = '#1a0a02'; g.fillRect(10, 4, 280, 30);
      const smooth = g.imageSmoothingEnabled;
      g.imageSmoothingEnabled = false;
      g.drawImage(dmd.cv, 10, 4, 280, 30);
      g.imageSmoothingEnabled = smooth;
      stamp(g, 'pin-dots', 10, 4, 280, 30, dotGrid);
    }
  },
}, onClose);

const dmd = { text: null, cv: typeof document !== 'undefined' ? Object.assign(document.createElement('canvas'), { width: 140, height: 15 }) : null };

const rampLen = RAMP.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - RAMP[i][0], p[1] - RAMP[i][1]), 0);
/** The point `d` along the ramp. */
function rampAt(d) {
  for (let i = 1; i < RAMP.length; i++) {
    const [x1, y1] = RAMP[i - 1], [x2, y2] = RAMP[i], l = Math.hypot(x2 - x1, y2 - y1);
    if (d <= l) return [x1 + (x2 - x1) * d / l, y1 + (y2 - y1) * d / l];
    d -= l;
  }
  return RAMP[RAMP.length - 1];
}
