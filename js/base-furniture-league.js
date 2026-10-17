/* base-furniture-league.js  -  the Pokémon League set (furniture expansion session b, 2026-10-17): the Indigo Plateau's
   halls in deep royal blue, gold, red and marble white. The Champion's seat on its dais, the Elite Four's four thrones
   (Lorelei's ice, Bruno's stone, Agatha's ghost, Lance's dragon), the Hall of Fame machine, and the halls round them.
   Its emblem, on the rug, the banner, the gate and the seat, is a Poké Ball between two golden wings.
   As in the Snorlax room, an upright piece is a list of parts in painted units (32 a tile): `x` across from the left of
   its front, `h` up from the floor (a wall piece's from the foot of its strip), `z` out to the front from its middle (a
   wall piece's from the wall). They're painted here from any side, and js/base-models-league.js builds the same list
   (BUILT) as 3D parts, so picture and model agree. A screen or a board is one cached canvas (PIC), drawn in both. */

import { R, oval, ovalShade, floorShadow, ctx, sh } from './base-paint.js';

export const LG = {
  blue: '#2a4aa8', deep: '#1c3278', gold: '#e8b838', bronze: '#b88a28', red: '#c82838', wine: '#8e1a28',
  marble: '#eeeae2', vein: '#cfcac0', ink: '#22242e', white: '#f8f8f4', ice: '#9cd4ee', frost: '#dff4fc',
  stone: '#8e877c', rock: '#6f685e', ghost: '#6a3a9a', shade: '#3e2260', plum: '#9a6ad0', wisp: '#c890ff', eye: '#ff5070',
  crimson: '#8a1c24', amber: '#d8742c', statue: '#b4b0a6', statue2: '#94908a', belly: '#cfcbc0', light: '#8ad8ff',
  flame: '#ff8a2a', core: '#ffe070', mint: '#8af0b8', screen: '#78c0ff', wax: '#e8e0f0',
};
const { blue: BLUE, deep: DEEP, gold: GOLD, bronze: BRONZE, red: RED, marble: MARBLE, vein: VEIN, ink: INK, white: WHITE } = LG;
const GROUP = 'Pokémon League';
const TAU = Math.PI * 2;

/* ---------- parts ---------- */
const B = (x, h, z, rx, ry, rz, c, o) => ({ t: 'blob', x, h, z, rx, ry, rz, c, ...o });
const BX = (x, h, z, w, hh, d, c, o) => ({ t: 'box', x, h, z, w, hh, d, c, r: 1.5, ...o });
const CY = (x, h, z, r, hh, c, o) => ({ t: 'cyl', x, h, z, r, hh, c, ...o });
/** A cone standing on its base at x, h, z: `tilt` leans it right, `fwd` points it out to the front. */
const CN = (x, h, z, r, hh, c, o) => ({ t: 'cone', x, h, z, r, hh, c, tilt: 0, ...o });
/** A lathe from h up, its profile [[r, up]...]. */
const LA = (x, h, z, pts, c, o) => ({ t: 'lathe', x, h, z, pts, c, ...o });
/** A rod lying across, x0 to x1. */
const RD = (x0, x1, h, z, r, c, o) => ({ t: 'rod', x: (x0 + x1) / 2, x0, x1, h, z, r, c, ...o });
/** A flat outline [[across, up]...] about x, h, cut d deep at z (a wing, a flame, a shield). */
const SH = (x, h, z, pts, d, c, o) => ({ t: 'shape', x, h, z, pts, d, c, ...o });
/** A ring R round, its tube r thick, facing the front: `arc` of it, starting `a0` (anticlockwise from the right). */
const RG = (x, h, z, R0, r, c, o) => ({ t: 'ring', x, h, z, R: R0, r, c, arc: TAU, a0: 0, ...o });
/** A Poké Ball r round, its button to the front. */
const BALL = (x, h, z, r) => ({ t: 'ball', x, h, z, r });
/** A cached picture (PIC) w x hh on the front at z, `lit` like a screen. */
const IMG = (x, h, z, w, hh, pic, o) => ({ t: 'img', x, h, z, w, hh, pic, ...o });
const TX = (s, x, h, z, size, w, c) => ({ t: 'text', s, x, h, z, size, w, c });
/** A painting-only touch, front view only. */
const FN = (z, fn) => ({ t: 'fn', x: 0, h: 0, z, fn, paintOnly: true });

const mir = (pts) => pts.map(([x, y]) => [-x, y]).reverse();
const sc = (pts, k, ky = k) => pts.map(([x, y]) => [x * k, y * ky]);
const star = (n, ro, ri, a0 = Math.PI / 2) => Array.from({ length: n * 2 }, (_, i) => { const a = a0 + i / (n * 2) * TAU, r = i % 2 ? ri : ro; return [Math.cos(a) * r, Math.sin(a) * r]; });
const gon = (n, r, a0 = 0) => Array.from({ length: n }, (_, i) => { const a = a0 + i / n * TAU; return [Math.cos(a) * r, Math.sin(a) * r]; });
/** An arch's band: an outer half-ellipse rxo x ryo, the opening rxi x ryi, standing on y 0. */
const archBand = (rxo, ryo, rxi, ryi, n = 12) => [
  ...Array.from({ length: n + 1 }, (_, i) => { const a = i / n * Math.PI; return [Math.cos(a) * rxo, Math.sin(a) * ryo]; }),
  ...Array.from({ length: n + 1 }, (_, i) => { const a = Math.PI - i / n * Math.PI; return [Math.cos(a) * rxi, Math.sin(a) * ryi]; }),
];

/* the League's emblem: a Poké Ball between golden wings, s its ball's radius (5.4 s across) */
const WING = [[0.8, 0.35], [1.5, 0.95], [2.6, 1.3], [2.25, 0.85], [2.75, 0.62], [2.3, 0.32], [2.6, 0.05], [2.1, -0.12], [2.15, -0.45], [1.5, -0.38], [0.8, -0.3]];
function emblem(x, h, z, s, { wz = z - s * 0.3, wd = s * 0.4 } = {}) {
  return [SH(x, h, wz, sc(WING, s), wd, GOLD, { m: 'metal' }), SH(x, h, wz, mir(sc(WING, s)), wd, GOLD, { m: 'metal' }), BALL(x, h, z, s)];
}
/** A flame's outline, w across and hh tall, from its foot. */
const FLAME = [[0, 0], [0.42, 0.12], [0.5, 0.38], [0.36, 0.62], [0.42, 0.78], [0.16, 0.7], [0.06, 1], [-0.14, 0.72], [-0.36, 0.82], [-0.32, 0.58], [-0.5, 0.36], [-0.42, 0.12]];
const flame = (w, hh) => FLAME.map(([x, y]) => [x * w, y * hh]);

/* ---------- pictures ---------- */

const PICS = {};
/** A picture w x h painted units, drawn once at 4 canvas pixels a unit by `draw(g, W, H)`. */
const pic = (key, w, h, draw) => () => {
  if (PICS[key]) return PICS[key];
  const c = new OffscreenCanvas(w * 4, h * 4), g = c.getContext('2d');
  draw(g, c.width, c.height);
  return (PICS[key] = c);
};
function ballOn(g, x, y, r) {
  g.save(); g.beginPath(); g.arc(x, y, r, 0, TAU); g.clip();
  g.fillStyle = WHITE; g.fillRect(x - r, y - r, r * 2, r * 2);
  g.fillStyle = RED; g.fillRect(x - r, y - r, r * 2, r);
  g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(x - r * 0.38, y - r * 0.5, r * 0.32, r * 0.18, -0.6, 0, TAU); g.fill();
  g.fillStyle = INK; g.fillRect(x - r, y - r * 0.11, r * 2, r * 0.22);
  g.restore();
  g.fillStyle = INK; g.beginPath(); g.arc(x, y, r * 0.36, 0, TAU); g.fill();
  g.fillStyle = WHITE; g.beginPath(); g.arc(x, y, r * 0.22, 0, TAU); g.fill();
  g.strokeStyle = INK; g.lineWidth = Math.max(1, r * 0.08); g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke();
}
function sparkle(g, x, y, r, c) {
  g.fillStyle = c; g.beginPath();
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, d = i % 2 ? r * 0.3 : r; g.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d); }
  g.fill();
}

/* the Hall of Fame's screen: the champion's team of six, recorded */
const HOF = pic('hof', 48, 38, (g, w, h) => {
  const s = g.createLinearGradient(0, 0, 0, h); s.addColorStop(0, '#0e1a4a'); s.addColorStop(1, '#2a4aa8');
  g.fillStyle = s; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(138,216,255,0.18)'; g.lineWidth = 2;
  for (let y = 6; y < h; y += 8) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  g.fillStyle = LG.core; g.font = `bold ${h * 0.12}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('CHAMPION', w / 2, h * 0.12, w * 0.8);
  for (let i = 0; i < 6; i++) ballOn(g, w * (0.22 + (i % 3) * 0.28), h * (i < 3 ? 0.38 : 0.7), h * 0.12);
  g.fillStyle = 'rgba(255,255,255,0.85)'; g.font = `bold ${h * 0.08}px system-ui, sans-serif`;
  g.fillText('INDIGO LEAGUE', w / 2, h * 0.92, w * 0.8);
  for (const [x, y] of [[0.08, 0.25], [0.92, 0.3], [0.1, 0.85], [0.9, 0.82]]) sparkle(g, w * x, h * y, h * 0.05, LG.core);
});

/* the tournament bracket: eight challengers, four rounds, the cup in the middle */
const BRACKET = pic('bracket', 54, 36, (g, w, h) => {
  g.fillStyle = '#f4f2ea'; g.fillRect(0, 0, w, h);
  g.fillStyle = DEEP; g.fillRect(0, 0, w, h * 0.17);
  g.fillStyle = GOLD; g.font = `bold ${h * 0.11}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('INDIGO LEAGUE', w / 2, h * 0.09, w * 0.8);
  const C = ['#e85050', '#5888e8', '#f0b838', '#58b868', '#a868d8', '#e88848', '#48b8c8', '#e868a8'];
  g.strokeStyle = INK; g.lineWidth = 3;
  for (const side of [0, 1]) {
    const X = (f) => side ? w - f * w : f * w;
    const ys = [0.3, 0.48, 0.66, 0.84].map(f => f * h);
    ys.forEach((y, i) => {
      g.fillStyle = C[side * 4 + i]; g.fillRect(Math.min(X(0.03), X(0.17)), y - h * 0.06, w * 0.14, h * 0.12);
      g.beginPath(); g.moveTo(X(0.17), y); g.lineTo(X(0.24), y); g.stroke();
    });
    for (const [a, b] of [[0, 1], [2, 3]]) {
      const m = (ys[a] + ys[b]) / 2;
      g.beginPath(); g.moveTo(X(0.24), ys[a]); g.lineTo(X(0.24), ys[b]); g.moveTo(X(0.24), m); g.lineTo(X(0.33), m); g.stroke();
    }
    const m1 = (ys[0] + ys[1]) / 2, m2 = (ys[2] + ys[3]) / 2;
    g.beginPath(); g.moveTo(X(0.33), m1); g.lineTo(X(0.33), m2); g.moveTo(X(0.33), (m1 + m2) / 2); g.lineTo(X(0.42), (m1 + m2) / 2); g.stroke();
  }
  const cx = w / 2, cy = h * 0.57;
  g.fillStyle = GOLD;
  g.beginPath(); g.moveTo(cx - w * 0.07, cy - h * 0.2); g.lineTo(cx + w * 0.07, cy - h * 0.2); g.quadraticCurveTo(cx + w * 0.06, cy + h * 0.04, cx, cy + h * 0.06); g.quadraticCurveTo(cx - w * 0.06, cy + h * 0.04, cx - w * 0.07, cy - h * 0.2); g.fill();
  g.fillRect(cx - w * 0.012, cy + h * 0.05, w * 0.024, h * 0.1); g.fillRect(cx - w * 0.05, cy + h * 0.14, w * 0.1, h * 0.05);
  g.strokeStyle = GOLD; g.lineWidth = 4;
  for (const s of [-1, 1]) { g.beginPath(); g.arc(cx + s * w * 0.075, cy - h * 0.12, h * 0.06, 0, TAU); g.stroke(); }
  g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(cx - w * 0.04, cy - h * 0.18, w * 0.015, h * 0.14);
});

/* the stained glass: the emblem in leaded panes */
const PANES = ['#3a6ad8', '#2a4aa8', '#5a8ae8', '#f0c040', '#e04848'];
const GLASS = pic('glass', 22, 44, (g, w, h) => {
  g.fillStyle = '#2a2a38'; g.fillRect(0, 0, w, h);
  const cols = 3, rows = 7, pw = w / cols, ph = h / rows;
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    g.fillStyle = (i + j) % 2 ? PANES[0] : PANES[2];
    if (j === 0 || j === rows - 1) g.fillStyle = (i % 2) ? PANES[3] : PANES[4];
    g.fillRect(i * pw + 3, j * ph + 3, pw - 6, ph - 6);
  }
  const cx = w / 2, cy = h * 0.47;
  g.fillStyle = '#2a2a38'; g.beginPath(); g.arc(cx, cy, w * 0.42, 0, TAU); g.fill();
  g.fillStyle = PANES[3];
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, w * 0.39, a, a + TAU / 24); g.fill(); }
  g.fillStyle = PANES[1];
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + TAU / 24; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, w * 0.39, a, a + TAU / 24); g.fill(); }
  ballOn(g, cx, cy, w * 0.24);
  g.strokeStyle = '#2a2a38'; g.lineWidth = 5; g.beginPath(); g.arc(cx, cy, w * 0.42, 0, TAU); g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.22)'; g.fillRect(w * 0.12, h * 0.05, w * 0.06, h * 0.85);
});

/* ---------- painting the parts ---------- */

const shine = (g, x0, y0, x1, y1, c) => {
  const l = g.createLinearGradient(x0, y0, x1, y1);
  l.addColorStop(0, sh(c, 1)); l.addColorStop(0.35, c); l.addColorStop(1, sh(c, -1));
  return l;
};
/** A superellipse k (1 an oval, under 1 boxier) lit from the top left, leaning `tilt`. */
function supr(cx, cy, rx, ry, k, c, tilt = 0) {
  if (rx <= 0 || ry <= 0) return;
  const g = ctx();
  g.save(); g.translate(cx, cy); if (tilt) g.rotate(tilt); g.scale(1, ry / rx);
  const t = g.createRadialGradient(-rx * 0.35, -rx * 0.42, 0, 0, 0, rx * 1.05);
  t.addColorStop(0, sh(c, 1)); t.addColorStop(0.55, c); t.addColorStop(1, sh(c, -1));
  g.fillStyle = t; g.beginPath();
  if (k === 1) g.arc(0, 0, rx, 0, TAU);
  else for (let i = 0; i < 64; i++) { const a = i / 64 * TAU, co = Math.cos(a), si = Math.sin(a); g.lineTo(rx * Math.sign(co) * Math.abs(co) ** k, rx * Math.sign(si) * Math.abs(si) ** k); }
  g.fill(); g.restore();
}
function rbx(cx, cy, w, h, r, c, tilt = 0) {
  if (w <= 0 || h <= 0) return;
  const g = ctx(), x = -w / 2, y = -h / 2;
  g.save(); g.translate(cx, cy); if (tilt) g.rotate(tilt);
  g.fillStyle = shine(g, x, y, x + w * 0.3, y + h, c); g.beginPath(); g.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); g.fill();
  if (h > 3 && w > 3) { g.fillStyle = sh(c, 1); g.globalAlpha *= 0.6; g.beginPath(); g.roundRect(x + Math.min(r, w / 2) * 0.6, y + 0.4, w - Math.min(r, w / 2) * 1.2, 0.7, 0.35); g.fill(); }
  g.restore();
}
function poly(pts, c, horiz) {
  const g = ctx(), xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  g.fillStyle = horiz ? (() => { const l = g.createLinearGradient(x0, 0, x1, 0); l.addColorStop(0, sh(c, -1)); l.addColorStop(0.3, sh(c, 1)); l.addColorStop(0.55, c); l.addColorStop(1, sh(c, -1)); return l; })() : shine(g, x0, y0, x1, y1, c);
  g.beginPath(); pts.forEach(([x, y]) => g.lineTo(x, y)); g.closePath(); g.fill();
}
function paintBall(cx, cy, r, front) {
  const g = ctx();
  supr(cx, cy, r, r, 1, WHITE);
  g.save(); g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.clip();
  g.beginPath(); g.rect(cx - r, cy - r, r * 2, r); g.clip(); supr(cx, cy, r, r, 1, RED);
  g.restore();
  g.fillStyle = INK; g.fillRect(cx - r, cy - r * 0.1, r * 2, r * 0.2);
  if (front) { oval(cx, cy, r * 0.38, r * 0.38, INK); ovalShade(cx, cy, r * 0.24, r * 0.24, WHITE); }
}

/** Paints parts seen from `dir` (0 front, 2 back, 1 / 3 the sides), on a view vw wide standing on line b; W is the
    piece's front width in units. */
function paintParts(parts, x0, b, vw, dir, W) {
  const side = dir % 2 === 1, sg = dir === 3 ? -1 : 1, g = ctx(), fx = dir === 2 ? -1 : 1;
  const U = (px, pz) => dir === 0 ? x0 + px : dir === 2 ? x0 + W - px : x0 + vw / 2 + sg * pz;
  const key = (q) => q.k ?? (dir === 0 ? q.z : dir === 2 ? -q.z : sg * (W / 2 - q.x));
  const list = parts.map((q, i) => [key(q), i, q]).sort((a, c) => a[0] - c[0] || a[1] - c[1]).map(e => e[2]);
  for (const q of list) {
    if ((q.paintOnly || ['text', 'img'].includes(q.t)) && dir !== 0) continue;
    const cx = U(q.x, q.z), cy = b - q.h, tilt = side ? 0 : fx * (q.tilt || 0);
    switch (q.t) {
      case 'blob': supr(cx, cy, side ? q.rz : q.rx, q.ry, q.ev ?? 1, q.c, tilt); break;
      case 'box': rbx(cx, cy, side ? q.d : q.w, q.hh, q.r, q.c, tilt); break;
      case 'cyl': {
        poly([[cx - q.r, cy - q.hh / 2], [cx + q.r, cy - q.hh / 2], [cx + (q.rb ?? q.r), cy + q.hh / 2], [cx - (q.rb ?? q.r), cy + q.hh / 2]], q.c, true);
        oval(cx, cy - q.hh / 2, q.r, Math.min(q.r * 0.25, q.hh / 2), sh(q.c, 1));
        break;
      }
      case 'cone': {
        if (q.fwd) { ovalShade(cx, cy, q.r, q.r, q.c); break; }
        const s = Math.sin(tilt), c = Math.cos(tilt);
        poly([[cx + s * q.hh, cy - c * q.hh], [cx + c * q.r, cy + s * q.r], [cx - c * q.r, cy - s * q.r]], q.c);
        break;
      }
      case 'lathe': {
        const pts = q.pts.map(([r, up]) => [r, cy - up]);
        poly([...pts.map(([r, y]) => [cx - r, y]), ...pts.slice().reverse().map(([r, y]) => [cx + r, y])], q.c, true);
        break;
      }
      case 'rod': {
        if (side) { ovalShade(cx, cy, q.r, q.r, q.c); break; }
        const w = q.x1 - q.x0, l = g.createLinearGradient(0, cy - q.r, 0, cy + q.r);
        l.addColorStop(0, sh(q.c, 1)); l.addColorStop(0.35, sh(q.c, 2)); l.addColorStop(0.6, q.c); l.addColorStop(1, sh(q.c, -1));
        g.fillStyle = l; g.beginPath(); g.roundRect(cx - w / 2, cy - q.r, w, q.r * 2, q.r * 0.6); g.fill();
        break;
      }
      case 'shape': {
        if (side) {
          const ys = q.pts.map(p => p[1]), lo = Math.min(...ys), hi = Math.max(...ys);
          rbx(cx, cy - (lo + hi) / 2, q.d, hi - lo, Math.min(1, q.d / 2), q.c);
        } else poly(q.pts.map(([px, py]) => [cx + fx * px, cy - py]), q.c);
        break;
      }
      case 'ring': {
        if (side) { rbx(cx, cy, q.r * 2, q.R * 2 + q.r * 2, q.r, q.c); break; }
        const l = g.createLinearGradient(cx - q.R, cy - q.R, cx + q.R, cy + q.R);
        l.addColorStop(0, sh(q.c, 1)); l.addColorStop(0.5, q.c); l.addColorStop(1, sh(q.c, -1));
        g.strokeStyle = l; g.lineWidth = q.r * 2; g.lineCap = 'round';
        const a = dir === 2 ? [q.a0 - Math.PI, q.a0 + q.arc - Math.PI] : [-(q.a0 + q.arc), -q.a0];
        g.beginPath(); g.arc(cx, cy, q.R, a[0], a[1]); g.stroke();
        break;
      }
      case 'ball': paintBall(cx, cy, q.r, dir === 0); break;
      case 'img': g.drawImage(q.pic(), cx - q.w / 2, cy - q.hh / 2, q.w, q.hh); break;
      case 'text':
        g.font = `bold ${q.size}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillStyle = q.c; g.fillText(q.s, cx, cy, q.w);
        break;
      case 'fn': q.fn(g, (px) => x0 + px, (h) => b - h); break;
    }
  }
}

/* ---------- the kinds ---------- */

/** What js/base-models-league.js builds for each upright and wall kind: its parts and default material. */
export const BUILT = {};

function piece(id, name, w, h, price, mat, parts, rest = {}) {
  BUILT[id] = { parts, mat };
  return { id, name, group: GROUP, solo: true, w, h, price, ...rest, draw(x, b, vw, dir) { floorShadow(x, b, vw); paintParts(parts, x, b, vw, dir, w * 32); } };
}
function wallPiece(id, name, w, price, mat, parts, rest = {}) {
  BUILT[id] = { parts, mat };
  return { id, name, group: GROUP, solo: true, w, h: 1, layer: 'wall', price, ...rest, wall(x) { paintParts(parts, x, 96, w * 32, 0, w * 32); } };
}

/** The round rugs' outlines as ovals [cx, cy, rx, ry], in painted units seen from above, for the model. */
export const RUGS = { lgcrestrug: [[32, 32, 31, 31]] };

/** The emblem seen from above (a rug's), its ball s round. */
function flatEmblem(cx, cy, s) {
  const g = ctx();
  for (const wing of [sc(WING, s), mir(sc(WING, s))]) {
    g.fillStyle = sh(GOLD, -1); g.beginPath(); wing.forEach(([x, y]) => g.lineTo(cx + x * 1.04, cy - y * 1.04)); g.closePath(); g.fill();
    poly(wing.map(([x, y]) => [cx + x, cy - y]), GOLD);
  }
  paintBall(cx, cy, s, true);
}

/* a few front details */
const flutes = (cx, h0, h1, r) => (g, X, Y) => {
  g.strokeStyle = sh(MARBLE, -1); g.lineWidth = 0.7;
  for (const f of [-0.66, -0.33, 0, 0.33, 0.66]) { g.beginPath(); g.moveTo(X(cx + f * r), Y(h0)); g.lineTo(X(cx + f * r), Y(h1)); g.stroke(); }
};
const keys = (x0, x1, h) => (g, X, Y) => {
  for (let x = x0; x < x1; x += 3) { R(X(x), Y(h + 1.6), 2.2, 1.2, '#c8d0e8'); }
};
const traySlots = (g, X, Y) => {
  for (let i = 0; i < 6; i++) oval(X(20 + (i % 3) * 12 + (i > 2 ? 6 : 0)), Y(29.6), 3.2, 0.5, sh(VEIN, -2));
};

/* the champion seat's pediment */
const PEDIMENT = [[-19, 0], [19, 0], ...Array.from({ length: 9 }, (_, i) => { const a = i / 8 * Math.PI; return [16 * Math.cos(a), 3 + 9 * Math.sin(a)]; })];
/* Agatha's back: a grinning ghost, spikes on its head */
const GHOSTBACK = [[-13, -26], [13, -26], [13, 6], [16, 14], [11, 13], [10, 20], [6, 17], [3, 26], [0, 19], [-3, 26], [-6, 17], [-10, 20], [-11, 13], [-16, 14], [-13, 6]];
const GRIN = [[-8, 2], [8, 2], [6, -2], [4, 0], [2, -3], [0, -0.5], [-2, -3], [-4, 0], [-6, -2]];
/* Lance's: horns over the back, bat wings either side */
const HORNS = [[-14, 0], [14, 0], [16, 10], [19, 20], [11, 8], [6, 5], [0, 9], [-6, 5], [-11, 8], [-19, 20], [-16, 10]];
const DRAGONHEAD = [[-6, -6], [6, -6], [7, 0], [5, 4], [9, 9], [3, 6], [0, 8], [-3, 6], [-9, 9], [-5, 4], [-7, 0]];
const BATWING = [[0, 0], [0, 36], [-4, 44], [-8, 40], [-14, 42], [-12, 32], [-14, 26], [-11, 18], [-13, 12], [-8, 6]];
const inset = (pts, k) => { const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length; return pts.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k]); };
/* the banners' swallowtail */
const PENNANT = (w, top, bot, notch) => [[-w, top], [w, top], [w, -bot], [0, -notch], [-w, -bot]];
const SHIELD = [[-6, 7], [6, 7], [6, -1], [0, -8], [-6, -1]];
const DROP = [[0, 4.5], ...Array.from({ length: 9 }, (_, i) => { const a = 0.25 * Math.PI - i / 8 * 1.5 * Math.PI; return [3 * Math.cos(a), -0.8 + 3 * Math.sin(a)]; })];
const HEART = Array.from({ length: 16 }, (_, i) => { const t = i / 16 * TAU; return [0.27 * 16 * Math.sin(t) ** 3, 0.27 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 1.1]; });
const FLOWER = Array.from({ length: 24 }, (_, i) => { const a = i / 24 * TAU, r = 3 + 1.3 * Math.cos(a * 6); return [Math.cos(a) * r, Math.sin(a) * r]; });
const LEAF = [[0, 4.5], [3.5, 1], [2.5, -3.5], [0, -4.5], [-2.5, -3.5], [-3.5, 1]];
const GHOSTY = [[-3.5, -4], [-2, -2.6], [-1, -4], [0, -2.6], [1, -4], [2, -2.6], [3.5, -4], [3.5, 1.5], [2.5, 3.5], [0, 4.5], [-2.5, 3.5], [-3.5, 1.5]];
const WINGLET = [[-4, -3.5], [-1, -1], [4, -4], [2, 0], [4.5, 1], [1, 2], [2.5, 4.5], [-1.5, 2.5], [-4, 4]];
const CAPE = [[-10, 27], [10, 27], [13, 0], [14, -26], [5, -28], [0, -26], [-5, -28], [-14, -26], [-13, 0]];

/* the laurel wreath: leaves along an open ring */
const WREATH = { x: 16, h: 55, R: 8.5, a0: Math.PI * 0.65, arc: Math.PI * 1.7 };
const laurel = () => Array.from({ length: 16 }, (_, i) => {
  const s = i % 2 ? 1 : -1, t = WREATH.a0 + (Math.floor(i / 2) + 0.5) / 8 * WREATH.arc, r = WREATH.R + s * 1.5, a = t + s * 0.45;
  return B(WREATH.x + Math.cos(t) * r, WREATH.h + Math.sin(t) * r, 0.3, 1.3, 2.6, 0.8, GOLD, { m: 'metal', tilt: -a, seg: 8 });
});

export const LEAGUE_KINDS = [
  // the Champion's seat: a tall blue throne framed in gold, the emblem on its crest, up two marble steps
  piece('lgchampseat', 'Champion’s seat', 2, 2, 2500, 'gloss', [
    BX(32, 3, 0, 63, 6, 61, MARBLE), BX(32, 6, 0, 64, 1.2, 62, GOLD, { m: 'metal', r: 0.5 }),
    BX(32, 9.5, -4, 50, 6, 46, MARBLE), BX(32, 12.5, -4, 51, 1.2, 47, GOLD, { m: 'metal', r: 0.5 }),
    BX(32, 6.6, 25, 22, 0.8, 11, RED, { m: 'cloth', r: 0.3 }),
    BX(32, 20, -6, 36, 15, 30, BLUE, { r: 2 }), BX(32, 26.5, -6, 37, 1.5, 31, GOLD, { m: 'metal', r: 0.5 }),
    B(32, 29.5, -4, 16, 3, 13.5, RED, { m: 'cloth', ev: 0.5, e: 0.6 }),
    BX(32, 58, -19, 40, 62, 5, GOLD, { m: 'metal' }), BX(32, 57, -17.5, 34, 56, 4, BLUE),
    BX(32, 55, -15.2, 24, 40, 0.8, RED, { m: 'cloth', r: 0.4 }), ...emblem(32, 61, -13.6, 3.2),
    SH(32, 89, -19, PEDIMENT, 4, GOLD, { m: 'metal' }), ...emblem(32, 96, -16.4, 3.6),
    ...[12, 52].flatMap(x => [B(x, 91, -19, 2.6, 2.6, 2.6, GOLD, { m: 'metal' }), CN(x, 92.5, -19, 1.6, 6, GOLD, { m: 'metal' })]),
    ...[13, 51].flatMap(x => [BX(x, 30.2, -6, 4.5, 6, 28, DEEP), BX(x, 35, -6, 6, 3.5, 30, GOLD, { m: 'metal' }),
      CY(x, 31, 7, 1.8, 8, GOLD, { m: 'metal' }), B(x, 37.5, 8, 3, 3, 3, GOLD, { m: 'metal' })]),
  ]),

  // Lorelei's: carved ice, a snowflake in its back, crystals for a crown and icicles at its edge
  piece('lgicethrone', 'Lorelei’s ice throne', 1, 1, 1100, 'gloss', [
    BX(16, 9, 0, 28, 18, 26, LG.ice, { r: 3 }),
    ...[7, 11.5, 16, 20.5, 25].map((x, i) => CN(x, 17.5, 13.3, 1.3, 4 + (i % 2) * 2, LG.frost, { tilt: Math.PI })),
    B(16, 19.5, 1, 12.5, 2.5, 11.5, LG.frost, { m: 'cloth', ev: 0.5, e: 0.6 }),
    BX(16, 40, -10.5, 26, 44, 5, LG.ice, { r: 2.5 }),
    SH(16, 41, -7.6, star(6, 8, 2.4), 0.8, WHITE),
    CN(16, 60, -10.5, 5.5, 26, LG.frost), CN(8, 58, -10.5, 4, 16, LG.ice, { tilt: -0.3 }), CN(24, 58, -10.5, 4, 16, LG.ice, { tilt: 0.3 }),
    CN(4.5, 50, -10.5, 3, 11, LG.frost, { tilt: -0.6 }), CN(27.5, 50, -10.5, 3, 11, LG.frost, { tilt: 0.6 }),
    ...[3.5, 28.5].flatMap((x, i) => [BX(x, 21, -1, 4, 5, 20, LG.ice), BX(x, 24.5, -1, 5, 3, 22, LG.frost),
      CN(x, 26, 8, 2.2, 8, LG.ice, { tilt: i ? 0.15 : -0.15 })]),
  ]),

  // Bruno's: boulders bound with a black belt, a stone slab to sit on
  piece('lgstonethrone', 'Bruno’s stone throne', 1, 1, 1000, 'plain', [
    B(16, 9, 0, 15, 9, 13, LG.stone, { e: 0.25, ev: 0.25 }),
    BX(16, 19.5, 0.5, 30, 3, 26, LG.rock, { r: 1 }),
    B(16, 37, -9.5, 14, 16, 5.5, LG.stone, { e: 0.35, ev: 0.35 }),
    B(16, 60, -9.5, 11, 8, 5, LG.rock, { e: 0.4, ev: 0.45 }),
    BX(16, 40, -9.5, 28.6, 4, 11.8, INK, { m: 'cloth', r: 1.5 }),
    B(16, 40, -3.2, 3, 2.6, 1.6, INK, { m: 'cloth' }),
    BX(14, 34.5, -3.2, 2.4, 8, 1, INK, { m: 'cloth', r: 0.4, tilt: 0.25 }), BX(18, 34.5, -3.2, 2.4, 8, 1, INK, { m: 'cloth', r: 0.4, tilt: -0.25 }),
    B(3.5, 25, 0, 3.5, 5, 11, LG.rock, { e: 0.4, ev: 0.5 }), B(28.5, 25, 0, 3.5, 5, 11, LG.rock, { e: 0.4, ev: 0.5 }),
  ]),

  // Agatha's: a grinning ghost for a back, its eyes alight, a purple candle on each arm
  piece('lgghostthrone', 'Agatha’s ghost throne', 1, 1, 1100, 'gloss', [
    BX(16, 9, 0, 28, 18, 26, LG.shade, { r: 3 }),
    B(16, 19.5, 1, 12.5, 2.5, 11.5, LG.plum, { m: 'cloth', ev: 0.5, e: 0.6 }),
    SH(16, 44, -10.5, GHOSTBACK, 5, LG.ghost),
    SH(11.5, 52, -7.6, [[-3.5, 1.5], [2.5, -1.5], [2, 2.5]], 0.8, LG.eye, { m: 'glow' }),
    SH(20.5, 52, -7.6, [[3.5, 1.5], [-2.5, -1.5], [-2, 2.5]], 0.8, LG.eye, { m: 'glow' }),
    SH(16, 42, -7.6, GRIN, 0.8, WHITE),
    ...[3.5, 28.5].flatMap(x => [BX(x, 20.5, -1, 4, 5, 20, LG.shade), BX(x, 24.5, -1, 5, 3, 22, LG.ghost),
      CY(x, 28.8, 8, 1.6, 6, LG.wax, { m: 'plain' }), B(x, 33.4, 8, 1.4, 2.4, 1.4, LG.wisp, { m: 'glow' })]),
  ], { glow: [LG.wisp, LG.eye] }),

  // Lance's: crimson and gold, horns over its back and a dragon's wings spread either side
  piece('lgdragonthrone', 'Lance’s dragon throne', 2, 1, 1500, 'gloss', [
    ...[[15, 30, 1], [49, 30, -1]].flatMap(([x, h, s]) => {
      const wing = s > 0 ? BATWING : mir(BATWING);
      return [SH(x, h, -11.5, wing, 2, BRONZE, { m: 'metal' }), SH(x, h, -10.2, inset(wing, 0.86), 1, LG.amber)];
    }),
    BX(32, 9, 0, 40, 18, 26, LG.crimson, { r: 2 }), BX(32, 18, 0, 41, 1.5, 27, GOLD, { m: 'metal', r: 0.5 }),
    B(32, 20.5, 1, 18, 2.6, 11.5, RED, { m: 'cloth', ev: 0.5, e: 0.6 }),
    BX(32, 44, -10.5, 34, 50, 4, GOLD, { m: 'metal' }), BX(32, 43, -9.5, 29, 44, 3.5, LG.crimson),
    SH(32, 46, -7.4, DRAGONHEAD, 0.8, GOLD, { m: 'metal' }),
    SH(32, 69, -10.5, HORNS, 4, GOLD, { m: 'metal' }),
    ...[14, 50].flatMap(x => [BX(x, 21.5, -1, 4, 5, 22, LG.crimson), BX(x, 25.5, -1, 5, 3, 24, GOLD, { m: 'metal' }),
      ...[-1.6, 0, 1.6].map(d => CN(x + d, 25.5, 11, 0.8, 3, WHITE, { fwd: true })),
      B(x, 2, 12, 3, 2, 2.5, GOLD, { m: 'metal' })]),
  ]),

  // the Hall of Fame: a great console, the champion's six on its screen, six balls in its tray
  piece('lghalloffame', 'Hall of Fame machine', 2, 2, 2400, 'gloss', [
    BX(32, 1.5, 5, 62.5, 3, 46.5, DEEP, { r: 1 }), BX(32, 15, 5, 62, 26, 46, BLUE, { r: 3 }),
    BX(32, 28, 5, 62.6, 1.6, 46.6, GOLD, { m: 'metal', r: 0.5 }),
    ...emblem(32, 15, 28, 3), BX(4, 15, 28.3, 2, 20, 0.6, LG.light, { m: 'glow', r: 0.3 }), BX(60, 15, 28.3, 2, 20, 0.6, LG.light, { m: 'glow', r: 0.3 }),
    BX(32, 30, 20, 44, 2.4, 14, '#30344a', { r: 0.6 }), FN(28, keys(12, 52, 29)),
    ...[12, 20, 28, 36, 44, 52].map(x => BALL(x, 31.4, 7, 2.6)),
    BX(32, 60, -18, 60, 62, 22, DEEP, { r: 3 }),
    BX(32, 62, -6.6, 54, 44, 1, GOLD, { m: 'metal', r: 0.5 }), IMG(32, 62, -5.9, 48, 38, HOF, { lit: true }),
    BX(32, 35, -6.6, 40, 5, 1, INK, { m: 'plain', r: 0.4 }),
    BX(4.5, 60, -6.6, 2.4, 56, 1.2, LG.light, { m: 'glow', r: 0.4 }), BX(59.5, 60, -6.6, 2.4, 56, 1.2, LG.light, { m: 'glow', r: 0.4 }),
    BX(32, 91.5, -18, 56, 1.4, 16, GOLD, { m: 'metal', r: 0.5 }), BX(32, 98, -18, 52, 12, 14, RED, { r: 2 }),
    TX('HALL OF FAME', 32, 98, -10.8, 6.5, 46, GOLD), ...emblem(32, 109, -17, 4),
  ], { glow: [LG.light] }),

  // the League's crest: the emblem in gold on royal blue, ringed with stars
  { id: 'lgcrestrug', name: 'League crest rug', group: GROUP, solo: true, w: 2, h: 2, layer: 'rug', price: 700, high: 0.04, side: 'c', flat() {
    const g = ctx(), [[cx, cy, r]] = RUGS.lgcrestrug;
    oval(cx, cy, r, r, sh(GOLD, -1)); oval(cx, cy, r - 1, r - 1, GOLD);
    ovalShade(cx, cy, r - 3, r - 3, BLUE);
    g.strokeStyle = GOLD; g.lineWidth = 1.4; g.beginPath(); g.arc(cx, cy, r - 7, 0, TAU); g.stroke();
    ovalShade(cx, cy, r - 9, r - 9, DEEP);
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU + Math.PI / 8;
      poly(star(5, 2.2, 0.9, -Math.PI / 2).map(([x, y]) => [cx + Math.cos(a) * (r - 5) + x, cy + Math.sin(a) * (r - 5) + y]), GOLD);
    }
    flatEmblem(cx, cy, 7.5);
  } },

  // the red carpet up to the Champion, gold edged, fringed, the emblem at its head
  { id: 'lgredcarpet', name: 'Champion’s red carpet', group: GROUP, solo: true, w: 1, h: 3, layer: 'rug', price: 450, high: 0.04, side: 'c', flat(w, h) {
    const g = ctx();
    for (const y of [0, h - 3]) { R(1, y, w - 2, 3, GOLD); for (let x = 2; x < w - 2; x += 2) R(x, y + (y ? 1.5 : 0), 0.8, 1.5, sh(GOLD, -1)); }
    const l = g.createLinearGradient(0, 0, w, 0); l.addColorStop(0, sh(RED, -1)); l.addColorStop(0.5, RED); l.addColorStop(1, sh(RED, -1));
    g.fillStyle = l; g.fillRect(1, 3, w - 2, h - 6);
    R(3.5, 3, 1.4, h - 6, GOLD); R(w - 4.9, 3, 1.4, h - 6, GOLD);
    for (let y = 26; y < h - 8; y += 12) poly([[w / 2, y - 3.5], [w / 2 + 3.5, y], [w / 2, y + 3.5], [w / 2 - 3.5, y]], sh(RED, -1));
    flatEmblem(w / 2, 14, 3.6);
  } },

  // a long royal blue pennant on a gold rod, the emblem on it
  wallPiece('lgbanner', 'Indigo League banner', 1, 350, 'cloth', [
    RD(3, 29, 88, 2.5, 1.2, GOLD, { m: 'metal' }), B(3, 88, 2.5, 1.8, 1.8, 1.8, GOLD, { m: 'metal' }), B(29, 88, 2.5, 1.8, 1.8, 1.8, GOLD, { m: 'metal' }),
    SH(16, 60, 1.2, PENNANT(11, 27, 25, 18), 1, GOLD, { m: 'metal' }), SH(16, 60, 1.9, PENNANT(9.5, 26, 23, 16.5), 1, BLUE),
    ...emblem(16, 68, 3, 3, { wz: 2.6, wd: 0.6 }),
    BX(16, 55, 2.5, 14, 1.4, 0.3, GOLD, { m: 'metal', r: 0.2 }), BX(16, 52, 2.5, 10, 1.4, 0.3, GOLD, { m: 'metal', r: 0.2 }),
  ]),

  // Victory Road's torches: a blue post, a gold bowl, a flame that burns all night
  piece('lgtorch', 'Victory Road torch', 1, 1, 500, 'metal', [
    LA(16, 0, 0, [[9, 0], [9, 2.5], [6, 4.5], [3.2, 7], [0, 7]], BRONZE),
    CY(16, 28, 0, 2.4, 42, DEEP, { m: 'gloss' }), CY(16, 20, 0, 3, 1.6, GOLD), CY(16, 40, 0, 3, 1.6, GOLD),
    LA(16, 48, 0, [[2.6, 0], [5, 3], [9, 7], [10.5, 10], [10.5, 11.5], [9, 11.5], [0, 10]], GOLD),
    B(16, 64, 0, 7, 6.5, 7, LG.flame, { m: 'glow' }), CN(16, 64, 0, 6.5, 20, LG.flame, { m: 'glow' }),
    CN(11, 61, 0, 3, 10, LG.flame, { m: 'glow', tilt: -0.4 }), CN(21, 61, 0, 3, 10, LG.flame, { m: 'glow', tilt: 0.4 }),
    B(16, 63, 3, 4, 4.5, 4.5, LG.core, { m: 'glow' }), CN(16, 64, 3, 3.5, 12, LG.core, { m: 'glow' }),
  ], { glow: [LG.flame, LG.core] }),

  // the Champion's cup on a marble pedestal, a ball engraved on it
  piece('lgchampcup', 'Champion’s cup', 1, 1, 1500, 'metal', [
    BX(16, 2, 0, 24, 4, 24, BRONZE, { r: 0.8 }), BX(16, 15, 0, 20, 22, 20, MARBLE, { m: 'gloss', r: 1 }),
    BX(16, 27, 0, 23, 2.4, 23, GOLD, { r: 0.6 }), BX(16, 15, 10.3, 12, 5, 0.8, GOLD, { r: 0.3 }),
    LA(16, 28, 0, [[7, 0], [7, 1.8], [3.5, 3.5], [1.8, 7], [1.8, 9], [3.5, 11], [8, 14], [10.5, 20], [11.5, 29], [10.6, 29.6], [0, 27]], GOLD),
    RG(5.5, 50, 0, 3.6, 1.1, GOLD), RG(26.5, 50, 0, 3.6, 1.1, GOLD),
    BALL(16, 46, 9.2, 3),
  ]),

  // a stone Dragonite on a marble plinth, one for each side of the gate
  piece('lgstatue', 'Dragonite gate statue', 1, 1, 900, 'plain', [
    BX(16, 0.8, 0, 29, 1.6, 27, GOLD, { m: 'metal', r: 0.4 }), BX(16, 6, 0, 28, 9, 26, MARBLE, { m: 'gloss' }),
    BX(16, 10.6, 0, 29, 1.4, 27, GOLD, { m: 'metal', r: 0.4 }),
    SH(9, 34, -7, [[2, 0], [1, 6], [-4, 11], [-7, 8], [-5, 5], [-7, 2], [-4, 0]], 2, LG.statue2),
    SH(23, 34, -7, mir([[2, 0], [1, 6], [-4, 11], [-7, 8], [-5, 5], [-7, 2], [-4, 0]]), 2, LG.statue2),
    B(25, 16, -5, 5, 3.5, 6, LG.statue2, { tilt: 0.5 }),
    B(11, 13, 4, 4, 2, 4.5, LG.statue), B(21, 13, 4, 4, 2, 4.5, LG.statue),
    B(16, 27, -1, 10, 13, 9, LG.statue), B(16, 25.5, 4.5, 7, 10, 4.5, LG.belly),
    B(7.5, 30, 3, 2.5, 4.5, 2.5, LG.statue, { tilt: 0.4 }), B(24.5, 30, 3, 2.5, 4.5, 2.5, LG.statue, { tilt: -0.4 }),
    B(16, 46, 0, 6.5, 6, 6, LG.statue), B(16, 44, 5, 4.5, 3.2, 3, LG.statue),
    CN(13.5, 51, 0, 0.9, 8, LG.statue2, { tilt: -0.35 }), CN(18.5, 51, 0, 0.9, 8, LG.statue2, { tilt: 0.35 }),
    B(10.8, 58.5, 0, 1.2, 1.2, 1.2, LG.statue2), B(21.2, 58.5, 0, 1.2, 1.2, 1.2, LG.statue2),
  ]),

  // the eight Kanto badges pinned to blue velvet in a gold frame
  wallPiece('lgbadgewall', 'Kanto badge display', 2, 900, 'metal', [
    BX(32, 56, 1, 58, 34, 2, GOLD, { r: 1 }), BX(32, 56, 2.2, 53, 29, 0.6, DEEP, { m: 'cloth', r: 0.3 }),
    BX(32, 76.5, 1.4, 24, 5, 1, GOLD, { r: 0.6 }), TX('KANTO', 32, 76.5, 2, 4, 20, DEEP),
    SH(14, 63, 2.9, gon(8, 4, Math.PI / 8), 1.2, '#a8a8b0'),
    SH(26, 63, 2.9, DROP, 1.2, '#5aa8e8'),
    SH(38, 63, 2.9, star(8, 4.5, 2.8), 1.2, '#f0a838'),
    SH(50, 63, 2.9, FLOWER, 1.2, '#78c858'),
    SH(14, 49, 2.9, HEART, 1.2, '#f070a8'),
    RG(26, 49, 2.9, 3, 1.1, '#f0c840'),
    SH(38, 49, 2.9, flame(8, 9).map(([x, y]) => [x, y - 4.5]), 1.2, '#e8482c'),
    SH(50, 49, 2.9, LEAF, 1.2, '#58b860'),
  ]),

  // a healing station in League colours: six balls rest on its marble tray
  piece('lgheal', 'League healing station', 2, 1, 1400, 'gloss', [
    BX(32, 1.2, 0, 60.4, 2.4, 24.4, DEEP, { r: 1 }), BX(32, 15, 0, 60, 26, 24, BLUE, { r: 4 }),
    BX(32, 28.6, 0, 62, 2.4, 28, MARBLE, { r: 1 }), BX(32, 29.9, 0, 40, 0.4, 14, '#c8d8e8', { r: 0.2 }), FN(14, traySlots),
    BX(32, 24, 12.2, 56, 1.6, 0.8, GOLD, { m: 'metal', r: 0.3 }),
    ...emblem(32, 13, 12.6, 3),
    BX(5, 14, 12.2, 2, 18, 0.8, LG.mint, { m: 'glow', r: 0.3 }), BX(59, 14, 12.2, 2, 18, 0.8, LG.mint, { m: 'glow', r: 0.3 }),
  ], { glow: [LG.mint] }),

  // the gate up to the Indigo Plateau: marble columns, a blue arch, the emblem for a keystone
  piece('lggate', 'Indigo Plateau gate', 2, 1, 1200, 'gloss', [
    BX(32, 1, 0, 63, 2, 28, VEIN, { r: 0.6 }),
    ...[6, 58].flatMap(x => [BX(x, 4, 0, 11, 4, 11, GOLD, { m: 'metal', r: 0.6 }), CY(x, 39, 0, 4.2, 66, MARBLE), FN(5, flutes(x, 8, 70, 4.2)),
      BX(x, 74, 0, 11, 4, 11, GOLD, { m: 'metal', r: 0.6 })]),
    SH(32, 76, 0, archBand(31.8, 19.6, 30, 18), 9, GOLD, { m: 'metal' }), SH(32, 76, 0, archBand(31, 19, 24, 12), 8, BLUE),
    ...emblem(32, 91.5, 4.6, 3.3),
    BX(32, 83, 0, 26, 9, 2, GOLD, { m: 'metal', r: 0.6 }), TX('INDIGO PLATEAU', 32, 83, 1.1, 4.2, 23, DEEP),
  ]),

  // the tournament's bracket board on gold posts
  piece('lgbracket', 'Tournament bracket board', 2, 1, 700, 'metal', [
    BX(4, 1, 0, 6, 2, 16, BRONZE, { r: 0.6 }), BX(60, 1, 0, 6, 2, 16, BRONZE, { r: 0.6 }),
    CY(4, 36, 0, 1.6, 68, GOLD), CY(60, 36, 0, 1.6, 68, GOLD),
    B(4, 71, 0, 2, 2, 2, GOLD), B(60, 71, 0, 2, 2, 2, GOLD),
    BX(32, 48, 0, 58, 40, 3, DEEP, { m: 'gloss', r: 1 }), IMG(32, 48, 1.7, 54, 36, BRACKET),
  ]),

  // where the matches are called from: two microphones and a monitor on a blue desk
  piece('lgdesk', 'Commentator’s desk', 2, 1, 800, 'gloss', [
    BX(32, 14, -2, 62, 28, 26, BLUE, { r: 2 }), BX(32, 22, 11.2, 58, 1.4, 0.6, GOLD, { m: 'metal', r: 0.3 }),
    TX('INDIGO LEAGUE', 32, 13, 11.3, 6, 44, GOLD),
    BX(32, 29, 0, 64, 2, 30, MARBLE, { r: 0.8 }),
    ...[18, 46].flatMap(x => [CY(x, 30.6, 3, 2.6, 1.2, INK, { m: 'plain' }), CY(x, 36, 3, 0.5, 10, '#9098a8', { m: 'metal' }), B(x, 42, 3, 1.8, 2.4, 1.8, INK, { m: 'plain' })]),
    BX(32, 31.5, -6, 6, 3, 4, INK, { m: 'plain', r: 0.5 }), BX(32, 38, -6, 16, 10, 2, INK, { m: 'plain', r: 0.6 }),
    BX(32, 38, -4.8, 13.5, 7.5, 0.4, LG.screen, { m: 'glow', r: 0.2 }),
    BX(25, 30.2, 6, 7, 0.4, 5, WHITE, { m: 'plain', r: 0.1 }),
  ], { glow: [LG.screen] }),

  // a marble bench for the challengers waiting their turn, a blue cushion on it
  piece('lgbench', 'Challenger’s bench', 2, 1, 450, 'gloss', [
    BX(7, 5.5, 0, 4, 11, 18, BRONZE, { m: 'metal', r: 0.8 }), BX(57, 5.5, 0, 4, 11, 18, BRONZE, { m: 'metal', r: 0.8 }),
    BX(7, 18.5, -9, 4, 7, 3, BRONZE, { m: 'metal', r: 0.6 }), BX(57, 18.5, -9, 4, 7, 3, BRONZE, { m: 'metal', r: 0.6 }),
    BX(32, 13, 0, 60, 4, 22, MARBLE, { r: 1 }), B(32, 16.5, 1, 27, 2, 10, BLUE, { m: 'cloth', ev: 0.5, e: 0.6 }),
    BX(32, 28, -9, 60, 12, 3, MARBLE, { r: 1 }), BX(32, 28, -7.3, 52, 7, 0.6, BLUE, { r: 0.3 }), BALL(32, 28, -6.6, 2.6),
  ]),

  // a gold laurel wreath on a marble column, a Poké Ball at its heart
  piece('lglaurel', 'Laurel wreath pedestal', 1, 1, 600, 'gloss', [
    BX(16, 2.5, 0, 22, 5, 22, VEIN, { r: 1 }), CY(16, 22, 0, 6.5, 34, MARBLE), FN(7, flutes(16, 8, 36, 6.5)),
    CY(16, 6, 0, 7.2, 2, GOLD, { m: 'metal' }), CY(16, 38, 0, 7.2, 2, GOLD, { m: 'metal' }),
    BX(16, 40.5, 0, 18, 3, 18, VEIN, { r: 0.8 }), CY(16, 44, 0, 1, 4, GOLD, { m: 'metal' }),
    RG(WREATH.x, WREATH.h, 0, WREATH.R, 1.2, GOLD, { m: 'metal', a0: WREATH.a0, arc: WREATH.arc }), ...laurel(),
    B(13.6, 47, 1.4, 2.4, 1.5, 1, RED, { m: 'cloth', tilt: -0.5 }), B(18.4, 47, 1.4, 2.4, 1.5, 1, RED, { m: 'cloth', tilt: 0.5 }),
    BALL(16, 55, 0, 4),
  ]),

  // the emblem in stained glass under a gold point, lit from behind
  wallPiece('lgwindow', 'League stained glass', 1, 900, 'metal', [
    BX(16, 35, 2, 28, 2.4, 4, MARBLE, { m: 'gloss', r: 0.6 }),
    BX(16, 60, 1, 26, 48, 2, GOLD, { r: 0.8 }), SH(16, 84, 1, [[-13, 0], [13, 0], [0, 10]], 2, GOLD),
    IMG(16, 60, 2.2, 22, 44, GLASS, { lit: true }),
  ], { glow: PANES }),

  // the Champion's red cape on its stand, gold collar and clasp, the emblem on its back
  piece('lgcape', 'Champion’s cape stand', 1, 1, 700, 'metal', [
    LA(16, 0, 0, [[8, 0], [8, 2], [5, 3.5], [1.6, 5], [0, 5]], BRONZE),
    CY(16, 34, 0, 1.3, 58, BRONZE), RD(5, 27, 62, 0, 1.2, BRONZE), B(16, 65.5, 0, 2.5, 2.5, 2.5, GOLD),
    SH(16, 34, 1.8, inset(CAPE, 0.97), 1, BLUE, { m: 'cloth' }), SH(16, 34, 3, CAPE, 1.4, RED, { m: 'cloth' }),
    SH(16, 59, 3.8, [[-11, 0], [11, 0], [12.5, 5], [-12.5, 5]], 1.4, GOLD), B(16, 58.5, 4.8, 1.8, 1.8, 1.2, GOLD),
    ...emblem(16, 40, 4.4, 3, { wz: 3.9, wd: 0.6 }),
  ]),

  // a fluted marble column, a royal blue band and a gilded capital
  piece('lgcolumn', 'Indigo marble column', 1, 1, 400, 'gloss', [
    BX(16, 2, 0, 26, 4, 26, VEIN, { r: 0.8 }), BX(16, 5, 0, 22, 2, 22, GOLD, { m: 'metal', r: 0.5 }),
    LA(16, 6, 0, [[7.5, 0], [7.8, 20], [7.4, 48], [6.8, 68], [0, 68]], MARBLE), FN(9, flutes(16, 8, 72, 7)),
    CY(16, 40, 0, 8, 4, BLUE), CY(16, 37.6, 0, 8.2, 0.8, GOLD, { m: 'metal' }), CY(16, 42.4, 0, 8.2, 0.8, GOLD, { m: 'metal' }),
    CY(16, 75, 0, 8.4, 2, GOLD, { m: 'metal' }), BX(16, 78.5, 0, 24, 5, 24, VEIN, { r: 0.8 }), BX(16, 81.6, 0, 26, 1.2, 26, GOLD, { m: 'metal', r: 0.4 }),
  ]),

  // two herald trumpets on a stand, each with a pennant, to sound the Champion in
  piece('lgfanfare', 'Fanfare trumpet rack', 1, 1, 650, 'metal', [
    LA(16, 0, 0, [[8, 0], [8, 2], [5, 3.5], [1.5, 5], [0, 5]], BRONZE), CY(16, 30, 0, 1.2, 50, BRONZE),
    BX(16, 50, 0.8, 2.2, 2.2, 1.6, BRONZE, { r: 0.4 }), BX(16, 38, 0.8, 2.2, 2.2, 1.6, BRONZE, { r: 0.4 }),
    RD(4, 22, 50, 1.6, 0.8, GOLD), B(3.4, 50, 1.6, 1, 1, 1, GOLD), CN(27.5, 50, 1.6, 4, 7, GOLD, { tilt: -Math.PI / 2 }),
    RD(10, 28, 38, 1.6, 0.8, GOLD), B(28.6, 38, 1.6, 1, 1, 1, GOLD), CN(4.5, 38, 1.6, 4, 7, GOLD, { tilt: Math.PI / 2 }),
    SH(11, 50, 2.6, PENNANT(5, 0, 10, 7), 0.8, BLUE, { m: 'cloth' }), BALL(11, 45, 3.6, 1.9),
    SH(21, 38, 2.6, PENNANT(5, 0, 10, 7), 0.8, BLUE, { m: 'cloth' }), BALL(21, 33, 3.6, 1.9),
  ]),

  // the Elite Four's shields: ice, fighting, ghost and dragon
  wallPiece('lgeliteshields', 'Elite Four shields', 2, 800, 'gloss', [
    BX(32, 60, 0.6, 62, 32, 1.2, GOLD, { m: 'metal', r: 0.8 }), BX(32, 60, 1.6, 60, 30, 1.4, DEEP, { r: 0.8 }),
    TX('ELITE FOUR', 32, 70.5, 2.5, 4, 30, GOLD),
    ...[[11, LG.ice], [25, LG.stone], [39, LG.ghost], [53, LG.crimson]].flatMap(([x, c]) => [
      SH(x, 57, 2.6, sc(SHIELD, 1.15), 1, GOLD, { m: 'metal' }), SH(x, 57, 3.2, SHIELD, 1, c)]),
    SH(11, 58, 3.9, star(6, 4.2, 1.3), 0.6, WHITE), SH(25, 58, 3.9, star(8, 4.4, 2), 0.6, WHITE),
    SH(39, 58, 3.9, GHOSTY, 0.6, WHITE), SH(53, 58, 3.9, WINGLET, 0.6, GOLD, { m: 'metal' }),
  ]),

  // the League's flag on a white pole, the emblem on royal blue
  piece('lgflag', 'Indigo League flag', 1, 1, 400, 'gloss', [
    LA(6, 0, 0, [[5, 0], [5, 2], [3, 3.5], [1.2, 5], [0, 5]], BRONZE, { m: 'metal' }),
    CY(6, 47, 0, 1, 84, '#e8e4dc'), B(6, 90.5, 0, 2, 2, 2, GOLD, { m: 'metal' }),
    SH(7, 70, 0, [[0, 16], [12, 17.5], [23, 15], [23, -6], [12, -4], [0, -5]], 1, BLUE, { m: 'cloth' }),
    ...emblem(18, 76, 0, 2.6, { wz: 0, wd: 1.6 }),
  ]),
];
