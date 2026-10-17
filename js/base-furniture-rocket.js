/* base-furniture-rocket.js  -  the Team Rocket hideout set (furniture expansion session b, 2026-10-17): the basement
   under the Celadon Game Corner. Black, charcoal and steel, Rocket red, a touch of gold for Giovanni, and the big red R
   on everything (one glyph, R_OUT / R_HOLE, painted and extruded alike). All solo, fixed colours.
   An upright piece is a list of parts in painted units (32 a tile): `x` across from the left of its front, `h` up from
   the floor (a wall piece's from the foot of its strip), `z` out to the front from its middle (a wall piece's from the
   wall). They're painted here from any side, and js/base-models-rocket.js builds the same list as 3D parts (BUILT), so
   picture and model agree. A `pic` part (a screen, a poster, a label) is painted on the front only, and the model wears
   that crop of the painting. The two rugs are painted from above. */

import { R, sh, disc, oval, ovalShade, floorShadow, ctx, glass as glassPane } from './base-paint.js';

export const RK = {
  black: '#1c1c22', char: '#2e2e36', dark: '#41414b', red: '#d42a34', deep: '#8e1c24', steel: '#8a909c', light: '#c4c8d2',
  gold: '#d8b048', white: '#f2f0ea', screen: '#5ad0f0', green: '#58e070', cream: '#f2dfae', tan: '#c8a870', brown: '#7a5434',
  pink: '#f0a0b0', glowR: '#ff4a52', leather: '#5a2622', wood: '#5a3420', crate: '#8a6438', paper: '#e8dcbc', amber: '#ffb040',
};
const GROUP = 'Rocket hideout';
const TAU = Math.PI * 2;

/* the R, in a box 0.84 wide and 1 tall (y down): its outline and its bowl's hole */
export const R_OUT = [[0, 0], [0.5, 0], [0.6, 0.012], [0.68, 0.045], [0.735, 0.1], [0.765, 0.17], [0.775, 0.25], [0.765, 0.33],
  [0.73, 0.395], [0.67, 0.445], [0.6, 0.475], [0.84, 1], [0.57, 1], [0.36, 0.53], [0.25, 0.53], [0.25, 1], [0, 1]];
export const R_HOLE = [[0.25, 0.18], [0.47, 0.18], [0.52, 0.195], [0.545, 0.23], [0.55, 0.27], [0.54, 0.31], [0.51, 0.34],
  [0.46, 0.355], [0.25, 0.355]];

/* ---------- parts ---------- */
/** A rounded box centred at x, h, z. */
const B = (x, h, z, w, hh, d, c, o) => ({ t: 'box', x, h, z, w, hh, d, c, r: 1.5, ...o });
/** An upright cylinder centred at h (`rb` its bottom radius). */
const C = (x, h, z, r, hh, c, o) => ({ t: 'cyl', x, h, z, r, hh, c, ...o });
/** A ball rx x ry x rz. */
const S = (x, h, z, rx, ry, rz, c, o) => ({ t: 'ball', x, h, z, rx, ry, rz, c, ...o });
/** A rod from a to b, each [x, h, z]. */
const RD = (a, b, r, c, o) => ({ t: 'rod', a, b, r, c, x: (a[0] + b[0]) / 2, h: (a[1] + b[1]) / 2, z: (a[2] + b[2]) / 2, ...o });
/** A flat outline [[dx, dh]...] about x, h, d deep (`holes` cut out of it). */
const PR = (x, h, z, pts, d, c, o) => ({ t: 'prism', x, h, z, pts, d, c, ...o });
/** A lathe standing on h, its profile [[r, up]...]. */
const LA = (x, h, z, pts, c, o) => ({ t: 'lathe', x, h, z, pts, c, ...o });
/** A disc facing the front, th thick (`ry` for an oval). */
const DS = (x, h, z, r, th, c, o) => ({ t: 'disc', x, h, z, r, th, c, ...o });
/** A picture on a front face, w x hh centred at x, h: `fn(g, left, top, w, hh)` paints it; `lit` lights its crop. */
const PC = (x, h, z, w, hh, fn, o) => ({ t: 'pic', x, h, z, w, hh, fn, ...o });

/** The R, s tall, centred at x, h, d deep. */
const rGlyph = (x, h, z, s, d, c, o) => {
  const at = ([px, py]) => [(px - 0.42) * s, (0.5 - py) * s];
  return PR(x, h, z, R_OUT.map(at), d, c, { holes: [R_HOLE.map(at)], ...o });
};
/** A Poké Ball r round at x, h, z: two lathe halves, its band and button. */
const pokeBall = (x, h, z, r, top = RK.red) => {
  const arc = (a, b) => [0, 1, 2, 3, 4].map(i => { const t = a + (b - a) * i / 4; return [Math.cos(t) * r, Math.sin(t) * r]; });
  return [
    LA(x, h, z, arc(0, Math.PI / 2), top, { m: 'gloss' }),
    LA(x, h, z, arc(-Math.PI / 2, 0), RK.white, { m: 'gloss' }),
    C(x, h, z, r * 1.02, r * 0.18, RK.black, { m: 'gloss' }),
    DS(x, h, z + r * 0.92, r * 0.32, r * 0.2, RK.black, { m: 'gloss' }),
    DS(x, h, z + r * 1.02, r * 0.2, r * 0.1, RK.white, { m: 'gloss' }),
  ];
};

/* ---------- painting the parts ---------- */

const alphaOf = (hex, a) => { const v = parseInt(hex.slice(1), 16); return `rgba(${v >> 16},${(v >> 8) & 255},${v & 255},${a})`; };
function grad(g, x0, y0, x1, y1, c, m) {
  const l = g.createLinearGradient(x0, y0, x1, y1);
  if (m === 'metal') [[0, sh(c, 2)], [0.25, c], [0.55, sh(c, -1)], [0.8, sh(c, 1)], [1, sh(c, -1)]].forEach(s => l.addColorStop(...s));
  else if (m === 'glow') [[0, sh(c, 2)], [0.5, sh(c, 1)], [1, c]].forEach(s => l.addColorStop(...s));
  else [[0, sh(c, 1)], [0.35, c], [1, sh(c, -1)]].forEach(s => l.addColorStop(...s));
  return l;
}
function rbx(x, y, w, h, r, c, m) {
  if (w <= 0 || h <= 0) return;
  const g = ctx();
  if (m === 'glass') { g.save(); g.globalAlpha *= 0.4; glassPane(x, y, w, h, '#cfe8f4'); g.restore(); return; }
  g.fillStyle = grad(g, x, y, x + w * 0.3, y + h, c, m); g.beginPath(); g.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); g.fill();
  if (h > 3 && w > 3) { g.save(); g.globalAlpha *= 0.5; g.fillStyle = sh(c, 2); g.fillRect(x + Math.min(r, w / 2) * 0.6, y + 0.3, w - Math.min(r, w / 2) * 1.2, 0.6); g.restore(); }
}
function poly(pts, holes, c, m, horiz) {
  const g = ctx(), xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  if (m === 'glass') { g.save(); g.globalAlpha *= 0.35; }
  if (horiz) {
    const l = g.createLinearGradient(x0, 0, x1, 0);
    l.addColorStop(0, sh(c, -1)); l.addColorStop(0.3, sh(c, 1)); l.addColorStop(0.55, c); l.addColorStop(1, sh(c, -2));
    g.fillStyle = m === 'glass' ? '#cfe8f4' : l;
  } else g.fillStyle = grad(g, x0, y0, x1, y1, c, m);
  g.beginPath();
  for (const ring of [pts, ...(holes || [])]) { ring.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); }
  g.fill('evenodd');
  if (m === 'glass') g.restore();
}
function ball(cx, cy, rx, ry, c, m) {
  const g = ctx();
  if (m === 'glow') { const t = g.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry)); t.addColorStop(0, '#ffffff'); t.addColorStop(0.4, sh(c, 1)); t.addColorStop(1, c); g.fillStyle = t; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, TAU); g.fill(); return; }
  if (m === 'glass') { g.save(); g.globalAlpha *= 0.4; oval(cx, cy, rx, ry, '#dff0f8'); g.restore(); return; }
  ovalShade(cx, cy, rx, ry, c);
  if (m === 'gloss' || m === 'metal') { g.save(); g.globalAlpha *= 0.55; oval(cx - rx * 0.38, cy - ry * 0.42, rx * 0.22, ry * 0.14, '#ffffff'); g.restore(); }
}

/** Paints parts seen from `dir` (0 front, 2 back, 1 / 3 the sides), on a view vw wide standing on line b; W is the
    piece's front width in units. */
function paintParts(parts, x0, b, vw, dir, W) {
  const side = dir % 2 === 1, sg = dir === 3 ? -1 : 1, g = ctx();
  const U = (px, pz) => (dir === 0 ? x0 + px : dir === 2 ? x0 + W - px : x0 + vw / 2 + sg * pz);
  const key = (q) => q.k ?? (dir === 0 ? q.z : dir === 2 ? -q.z : sg * (W / 2 - q.x));
  const list = parts.map((q, i) => [key(q), i, q]).sort((a, c) => a[0] - c[0] || a[1] - c[1]).map(e => e[2]);
  for (const q of list) {
    if (q.t === 'pic' && dir !== 0) continue;
    const m = q.m || 'gloss', cx = U(q.x, q.z), cy = b - q.h;
    switch (q.t) {
      case 'box': { const w = side ? q.d : q.w; rbx(cx - w / 2, cy - q.hh / 2, w, q.hh, q.r, q.c, m); break; }
      case 'cyl': {
        const rb = q.rb ?? q.r, top = cy - q.hh / 2, bot = cy + q.hh / 2;
        poly([[cx - q.r, top], [cx + q.r, top], [cx + rb, bot], [cx - rb, bot]], null, q.c, m, m !== 'glow');
        if (m !== 'glass') oval(cx, top, q.r, Math.min(q.r * 0.22, q.hh / 2), sh(q.c, m === 'glow' ? 2 : 1));
        break;
      }
      case 'ball': ball(cx, cy, side ? q.rz : q.rx, q.ry, q.c, m); break;
      case 'disc': if (side) rbx(cx - q.th / 2, cy - (q.ry ?? q.r), q.th, (q.ry ?? q.r) * 2, q.th / 2, q.c, m); else ball(cx, cy, q.r, q.ry ?? q.r, q.c, m); break;
      case 'lathe': {
        const pts = q.pts.map(([r, up]) => [r, cy - up]);
        poly([...pts.map(([r, y]) => [cx - r, y]), ...pts.slice().reverse().map(([r, y]) => [cx + r, y])], null, q.c, m, true);
        break;
      }
      case 'rod': {
        const p0 = [U(q.a[0], q.a[2]), b - q.a[1]], p1 = [U(q.b[0], q.b[2]), b - q.b[1]];
        g.lineCap = 'round'; g.strokeStyle = m === 'glass' ? alphaOf('#cfe8f4', 0.4) : q.c; g.lineWidth = q.r * 2;
        g.beginPath(); g.moveTo(...p0); g.lineTo(...p1); g.stroke();
        if (q.r > 0.6 && m !== 'glass') {
          g.save(); g.globalAlpha *= 0.5; g.strokeStyle = sh(q.c, 2); g.lineWidth = q.r * 0.6;
          g.beginPath(); g.moveTo(p0[0] - q.r * 0.35, p0[1] - q.r * 0.35); g.lineTo(p1[0] - q.r * 0.35, p1[1] - q.r * 0.35); g.stroke(); g.restore();
        }
        break;
      }
      case 'prism': {
        if (side) {
          const hs = q.pts.map(p => p[1]), top = Math.max(...hs), bot = Math.min(...hs);
          rbx(cx - q.d / 2, b - q.h - top, q.d, top - bot, Math.min(1, q.d / 2), q.c, m);
          break;
        }
        const at = ([px, ph]) => [U(q.x + px), b - q.h - ph];
        poly(q.pts.map(at), q.holes?.map(h => h.map(at)), q.c, m);
        break;
      }
      case 'pic': g.save(); g.beginPath(); g.rect(cx - q.w / 2, cy - q.hh / 2, q.w, q.hh); g.clip(); q.fn(g, cx - q.w / 2, cy - q.hh / 2, q.w, q.hh); g.restore(); break;
    }
  }
}

/* ---------- pictures ---------- */

const font = (g, px, bold = true) => { g.font = `${bold ? 'bold ' : ''}${px}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; };
const fillR = (g, x, y, s, c) => { g.fillStyle = c; g.beginPath(); for (const ring of [R_OUT, R_HOLE]) { ring.forEach(([px, py], i) => (i ? g.lineTo(x + (px - 0.42) * s, y + (py - 0.5) * s) : g.moveTo(x + (px - 0.42) * s, y + (py - 0.5) * s))); g.closePath(); } g.fill('evenodd'); };

/** A security camera's view: n picks the room. */
const cctv = (n) => (g, x, y, w, h) => {
  const s = g.createLinearGradient(0, y, 0, y + h); s.addColorStop(0, '#1a3a44'); s.addColorStop(1, '#0c2228');
  g.fillStyle = s; g.fillRect(x, y, w, h);
  g.fillStyle = '#2e6a72';
  if (n === 0) { g.fillRect(x + 2, y + h * 0.55, w - 4, 1); for (let i = 0; i < 4; i++) g.fillRect(x + 3 + i * 3.5, y + h * 0.55 - 5, 2.4, 5); }
  if (n === 1) { g.beginPath(); g.moveTo(x, y + h); g.lineTo(x + w * 0.35, y + h * 0.35); g.lineTo(x + w * 0.65, y + h * 0.35); g.lineTo(x + w, y + h); g.fill(); }
  if (n === 2) { for (let i = 0; i < 3; i++) g.fillRect(x + 2 + i * 5, y + h * 0.4, 4, h * 0.45); }
  if (n === 3) { g.beginPath(); g.arc(x + w / 2, y + h * 0.6, h * 0.25, 0, TAU); g.fill(); g.fillStyle = '#8ad8e0'; g.fillRect(x + w / 2 - 0.5, y + h * 0.35, 1, h * 0.5); }
  if (n === 4) { g.fillRect(x + 2, y + h * 0.7, w - 4, 1); g.fillStyle = '#4a9aa2'; g.beginPath(); g.arc(x + w * 0.6, y + h * 0.5, 2.2, 0, TAU); g.fill(); g.fillRect(x + w * 0.6 - 1.4, y + h * 0.5 + 2, 2.8, 4); }
  if (n === 5) { for (let i = 0; i < 5; i++) g.fillRect(x + 1 + i * 3.2, y + 2 + (i % 2) * 2, 0.8, h - 4); }
  g.fillStyle = 'rgba(160,240,255,0.08)'; for (let j = y; j < y + h; j += 1.2) g.fillRect(x, j, w, 0.4);
  font(g, 2.6); g.textAlign = 'left'; g.fillStyle = '#c8f4ff'; g.fillText(`CAM ${n + 1}`, x + 1.2, y + 2.2);
  g.fillStyle = '#ff3a3a'; g.beginPath(); g.arc(x + w - 2, y + 2.1, 0.9, 0, TAU); g.fill();
};

/* ---------- the kinds ---------- */

/** What js/base-models-rocket.js builds for each upright and wall kind: its parts, doors and default material. */
export const BUILT = {};

function piece(id, name, w, h, price, mat, parts, { doors = [], inside, ...rest } = {}) {
  BUILT[id] = { parts, doors, inside, mat };
  const all = [...parts, ...doors.flatMap(d => d.parts)];
  return { id, name, group: GROUP, solo: true, w, h, price, ...rest, draw(x, b, vw, dir) { floorShadow(x, b, vw); paintParts(all, x, b, vw, dir, w * 32); } };
}
function wallPiece(id, name, w, price, mat, parts, rest = {}) {
  BUILT[id] = { parts, doors: [], mat };
  return { id, name, group: GROUP, solo: true, w, h: 1, layer: 'wall', price, ...rest, wall(x) { paintParts(parts, x, 96, w * 32, 0, w * 32); } };
}

const tri = (w, hh, lean = 0) => [[-w / 2, 0], [w / 2, 0], [lean, hh]];

/** Meowth's face on a ball centred x, h, z, r round: its ears, the gold charm, eyes, nose and whiskers. */
function meowthFace(x, h, z, r, { m = 'gloss', skin = RK.cream, eye = RK.white, eyeM = 'gloss' } = {}) {
  const fz = (dx, dh) => z + r * Math.sqrt(Math.max(0, 1 - (dx / r) ** 2 - (dh / r) ** 2));
  const out = [];
  for (const s of [-1, 1]) {
    out.push(PR(x + s * r * 0.55, h + r * 0.62, z - r * 0.15, tri(r * 0.62, r * 0.75, s * r * 0.12), r * 0.22, skin, { m }));
    out.push(PR(x + s * r * 0.55, h + r * 0.68, z - r * 0.15 + r * 0.12, tri(r * 0.36, r * 0.5, s * r * 0.1), r * 0.04, RK.black, { m: 'plain' }));
  }
  out.push(S(x, h, z, r, r * 0.9, r * 0.92, skin, { m }));
  out.push(DS(x, h + r * 0.55, fz(0, r * 0.55) + r * 0.02, r * 0.2, r * 0.08, RK.gold, { m: 'metal' }));
  out.push(DS(x, h + r * 0.55, fz(0, r * 0.55) + r * 0.08, r * 0.1, r * 0.06, sh(RK.gold, 1), { m: 'metal' }));
  for (const s of [-1, 1]) {
    const ex = x + s * r * 0.34, eh = h + r * 0.08;
    out.push(S(ex, eh, fz(s * r * 0.34, r * 0.08) - r * 0.05, r * 0.2, r * 0.27, r * 0.09, eye, { m: eyeM }));
    out.push(S(ex + s * r * 0.02, eh, fz(s * r * 0.34, r * 0.08) + r * 0.03, r * 0.045, r * 0.2, r * 0.03, RK.black, { m: 'gloss' }));
    for (const dh of [-0.18, -0.3]) out.push(RD([x + s * r * 0.5, h + r * dh, fz(s * r * 0.5, r * dh) - r * 0.02], [x + s * r * 1.12, h + r * (dh * 1.3 + 0.05), z + r * 0.3], Math.max(0.35, r * 0.025), RK.black, { m: 'plain' }));
  }
  out.push(S(x, h - r * 0.18, fz(0, -r * 0.18), r * 0.07, r * 0.05, r * 0.04, RK.pink, { m: 'gloss' }));
  out.push(RD([x - r * 0.18, h - r * 0.33, fz(0, -r * 0.33)], [x, h - r * 0.28, fz(0, -r * 0.28) + r * 0.01], Math.max(0.3, r * 0.022), RK.black, { m: 'plain' }));
  out.push(RD([x + r * 0.18, h - r * 0.33, fz(0, -r * 0.33)], [x, h - r * 0.28, fz(0, -r * 0.28) + r * 0.01], Math.max(0.3, r * 0.022), RK.black, { m: 'plain' }));
  return out;
}

export const ROCKET_KINDS = [
  // the big red R on a stand, lit
  piece('rktrsign', 'Rocket R sign', 1, 1, 650, 'gloss', [
    B(16, 2.5, 0, 26, 5, 18, RK.char),
    C(10, 9, -2, 1.2, 9, RK.steel, { m: 'metal' }), C(22, 9, -2, 1.2, 9, RK.steel, { m: 'metal' }),
    B(16, 39, -2.5, 30, 46, 4, RK.deep, { r: 3 }),
    B(16, 39, -2, 28, 44, 4.4, RK.black, { r: 2.5 }),
    rGlyph(16, 39, 1.2, 34, 2.4, RK.glowR, { m: 'glow' }),
  ], { glow: [RK.glowR] }),

  // the R on the wall, ringed in red
  wallPiece('rktemblem', 'Red R emblem', 2, 500, 'gloss', [
    DS(32, 54, 0.8, 28, 1.6, RK.red),
    DS(32, 54, 1.4, 25.5, 1.6, RK.black),
    rGlyph(32, 54, 2.8, 32, 1.6, RK.red),
  ]),

  // a bank of six camera screens over a console
  piece('rktmonitors', 'Surveillance monitor bank', 2, 1, 1400, 'gloss', [
    B(32, 12, 5, 60, 24, 20, RK.char),
    B(32, 24.6, 6, 60.5, 1.4, 20.5, RK.dark),
    PC(32, 13, 15.05, 50, 12, (g, x, y, w, h) => {
      g.fillStyle = RK.dark; g.fillRect(x, y, w, h);
      const cols = ['#ff4a52', '#58e070', '#ffd040', '#5ad0f0'];
      for (let i = 0; i < 12; i++) { g.fillStyle = cols[i % 4]; g.beginPath(); g.arc(x + 3 + i * 4, y + 3, 0.9, 0, TAU); g.fill(); }
      for (let i = 0; i < 5; i++) { g.fillStyle = '#16161c'; g.beginPath(); g.arc(x + 6 + i * 9.5, y + 8, 2.2, 0, TAU); g.fill(); g.fillStyle = RK.light; g.fillRect(x + 5.6 + i * 9.5, y + 6, 0.8, 2); }
    }, { lit: 0.35 }),
    B(32, 50, -9, 62, 42, 10, RK.black),
    ...[[13, 60.5, 0], [32, 60.5, 1], [51, 60.5, 2], [13, 40, 3], [32, 40, 4], [51, 40, 5]].flatMap(([x, h, n]) => [
      B(x, h, -3.6, 19, 18, 1.2, RK.dark, { r: 1 }),
      PC(x, h, -2.95, 16.5, 14.5, cctv(n), { lit: 0.6 }),
    ]),
    rGlyph(32, 75, -9, 8, 2, RK.red),
  ], { glow: ['#1a3a44', '#0c2228'] }),

  // the slot machine with the hideout's switch behind its poster
  piece('rktswitch', 'Hideout switch machine', 1, 1, 900, 'gloss', [
    B(16, 3, 0, 28, 6, 28, RK.black),
    B(16, 33, -1, 26, 54, 26, RK.char),
    B(16, 60.2, -1, 27, 1.6, 27, RK.gold, { m: 'metal', r: 0.6 }),
    B(16, 66, -2, 24, 11, 22, RK.red, { r: 4 }),
    PC(16, 66, 9.05, 20, 7, (g, x, y, w, h) => {
      g.fillStyle = RK.deep; g.fillRect(x, y, w, h);
      font(g, 4.6); g.fillStyle = '#ffe890'; g.fillText('BONUS', x + w / 2, y + h / 2 + 0.3);
    }, { lit: 0.5 }),
    B(16, 46, 12.4, 22, 13, 1.2, RK.black),
    PC(16, 46, 13.05, 19, 10, (g, x, y, w, h) => {
      for (let i = 0; i < 3; i++) {
        const rx = x + i * (w / 3) + 0.3, s = g.createLinearGradient(0, y, 0, y + h);
        s.addColorStop(0, '#b8b8b8'); s.addColorStop(0.5, '#ffffff'); s.addColorStop(1, '#b8b8b8');
        g.fillStyle = s; g.fillRect(rx, y, w / 3 - 0.6, h);
        fillR(g, rx + (w / 3 - 0.6) / 2, y + h / 2, 6.4, RK.red);
      }
      g.fillStyle = 'rgba(255,60,60,0.8)'; g.fillRect(x, y + h / 2 - 0.25, w, 0.5);
    }, { lit: 0.5 }),
    B(16, 36.5, 13, 22, 3, 2, RK.dark, { r: 0.8 }),
    S(9, 36.5, 14.2, 1.6, 1.2, 0.8, RK.glowR, { m: 'glow' }), S(16, 36.5, 14.2, 1.6, 1.2, 0.8, RK.amber, { m: 'glow' }), S(23, 36.5, 14.2, 1.6, 1.2, 0.8, RK.green, { m: 'glow' }),
    PC(16, 23, 12.05, 20, 18, (g, x, y, w, h) => {
      g.fillStyle = RK.paper; g.fillRect(x, y, w, h);
      g.fillStyle = RK.black; g.fillRect(x + 1, y + 1, w - 2, h - 6);
      fillR(g, x + w / 2, y + 6.5, 9, RK.red);
      font(g, 3.2); g.fillStyle = RK.black; g.fillText('TEAM ROCKET', x + w / 2, y + h - 2.6);
    }),
    B(24.5, 16.5, 12.4, 2.6, 2.6, 1, RK.red, { r: 0.6 }),
    B(16, 10, 13, 18, 4, 4, RK.steel, { m: 'metal', r: 1 }),
    B(30, 40, 0, 2, 7, 6, RK.steel, { m: 'metal', r: 0.6 }),
    RD([30.2, 41, 0], [30.2, 55, 2.5], 0.7, RK.light, { m: 'metal' }),
    S(30.2, 56.2, 2.7, 1.7, 1.7, 1.7, RK.red, { m: 'gloss' }),
  ], { glow: [RK.amber] }),

  // the Team Rocket balloon: Meowth's head for its envelope
  piece('rktballoon', 'Meowth balloon', 2, 2, 2400, 'gloss', [
    B(32, 9, 0, 26, 18, 26, RK.tan, { m: 'wood', r: 2 }),
    B(32, 18.6, 0, 28.5, 2.6, 28.5, RK.brown, { m: 'wood', r: 1.2 }),
    B(32, 1, 0, 27, 2, 27, RK.brown, { m: 'wood', r: 0.6 }),
    rGlyph(32, 9.5, 13.5, 12, 1.2, RK.red),
    ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => RD([32 + sx * 12.5, 19.5, sz * 12.5], [32 + sx * 13, 74, sz * 13], 0.55, RK.brown, { m: 'plain' })),
    ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => RD([32 + sx * 3, 30, sz * 3], [32 + sx * 12.6, 30, sz * 12.6], 0.4, RK.steel, { m: 'metal' })),
    C(32, 30, 0, 4.5, 7, RK.steel, { m: 'metal' }),
    S(32, 37, 0, 3, 4, 3, RK.amber, { m: 'glow' }),
    C(32, 63, 0, 9, 4, RK.cream, { rb: 7 }),
    ...meowthFace(32, 90, 0, 26),
  ], { glow: [RK.amber] }),

  // the arrow maze: four spinner tiles
  { id: 'rktspinner', name: 'Spinner arrow tiles', group: GROUP, solo: true, w: 2, h: 2, layer: 'rug', price: 600, high: 0.04, side: 'm', flat(w, h) {
    R(0, 0, w, h, RK.black);
    [0, 1, 2, 3].forEach(i => {
      const tx = (i % 2) * 32, ty = Math.floor(i / 2) * 32, g = ctx();
      const s = g.createLinearGradient(tx, ty, tx + 32, ty + 32); s.addColorStop(0, RK.light); s.addColorStop(1, RK.steel);
      g.fillStyle = s; g.beginPath(); g.roundRect(tx + 1.5, ty + 1.5, 29, 29, 2); g.fill();
      for (const [px, py] of [[4, 4], [28, 4], [4, 28], [28, 28]]) disc(tx + px, ty + py, 0.9, RK.dark);
      g.save(); g.translate(tx + 16, ty + 16); g.rotate([0, 1, 3, 2][i] * Math.PI / 2);
      g.fillStyle = RK.deep; g.beginPath(); [[-4, 10], [-4, -2], [-9, -2], [0, -11], [9, -2], [4, -2], [4, 10]].forEach(([px, py], j) => (j ? g.lineTo(px + 0.6, py + 0.6) : g.moveTo(px + 0.6, py + 0.6))); g.closePath(); g.fill();
      g.fillStyle = RK.red; g.beginPath(); [[-4, 10], [-4, -2], [-9, -2], [0, -11], [9, -2], [4, -2], [4, 10]].forEach(([px, py], j) => (j ? g.lineTo(px, py) : g.moveTo(px, py))); g.closePath(); g.fill();
      g.restore();
    });
  } },

  // the warp panel that flings you across the hideout
  { id: 'rktwarp', name: 'Rocket warp panel', group: GROUP, solo: true, w: 1, h: 1, layer: 'rug', price: 500, high: 0.04, side: 'm', glow: [RK.screen], flat(w, h) {
    const g = ctx();
    R(0, 0, w, h, RK.black);
    const s = g.createLinearGradient(0, 0, w, h); s.addColorStop(0, RK.dark); s.addColorStop(1, RK.char);
    g.fillStyle = s; g.beginPath(); g.roundRect(1.5, 1.5, w - 3, h - 3, 3); g.fill();
    for (const [px, py] of [[4, 4], [w - 4, 4], [4, h - 4], [w - 4, h - 4]]) disc(px, py, 1, RK.steel);
    disc(w / 2, h / 2, 12, RK.screen); disc(w / 2, h / 2, 10, RK.black);
    disc(w / 2, h / 2, 8, sh(RK.screen, -1)); disc(w / 2, h / 2, 6.5, RK.black);
    const c = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, 5); c.addColorStop(0, '#ffffff'); c.addColorStop(1, RK.screen);
    g.fillStyle = c; g.beginPath(); g.arc(w / 2, h / 2, 5, 0, TAU); g.fill();
  } },

  // Giovanni's desk: dark wood, gold trim, his R in gold
  piece('rktdesk', "Giovanni's desk", 2, 1, 1600, 'wood', [
    B(9, 13, -1, 15, 25, 28, RK.wood),
    B(55, 13, -1, 15, 25, 28, RK.wood),
    B(32, 15, 10, 32, 21, 2, sh(RK.wood, -1)),
    B(32, 27, 0, 63, 3.4, 30.5, RK.wood, { r: 1 }),
    B(32, 25.6, 15.2, 63, 0.9, 0.9, RK.gold, { m: 'metal', r: 0.3 }),
    ...[6, 15].map(h => B(9, h + 1, 13.6, 12, 8, 0.8, sh(RK.wood, 1), { r: 0.8 })),
    ...[6, 15].map(h => B(55, h + 1, 13.6, 12, 8, 0.8, sh(RK.wood, 1), { r: 0.8 })),
    ...[7, 16].flatMap(h => [B(9, h, 14.4, 4, 1, 1, RK.gold, { m: 'metal', r: 0.3 }), B(55, h, 14.4, 4, 1, 1, RK.gold, { m: 'metal', r: 0.3 })]),
    rGlyph(32, 16, 11.6, 11, 1, RK.gold, { m: 'metal' }),
  ]),

  // his leather chair, a Persian cushion on its seat
  piece('rktchair', "Boss's leather chair", 1, 1, 900, 'gloss', [
    C(16, 8, -1, 1.6, 8, RK.steel, { m: 'metal' }),
    ...[[4, -1], [28, -1], [16, -12], [16, 10]].flatMap(([x, z]) => [RD([16, 4, -1], [x, 2, z], 1, RK.steel, { m: 'metal' }), S(x, 1.4, z, 1.4, 1.4, 1.4, RK.black)]),
    B(16, 14.5, 0, 26, 5, 24, RK.leather, { r: 2.5 }),
    B(16, 37, -10, 26, 40, 6, RK.leather, { r: 4 }),
    ...[3.5, 28.5].flatMap(x => [B(x, 21, 0, 4, 9, 22, RK.leather, { r: 2 }), ...[-6, 0, 6].map(z => S(x, 25.6, z, 0.5, 0.5, 0.5, RK.gold, { m: 'metal' }))]),
    ...[8, 16, 24].map(x => S(x, 55.4, -7, 0.6, 0.6, 0.6, RK.gold, { m: 'metal' })),
    B(16, 18.5, 2, 18, 3, 16, RK.cream, { m: 'cloth', r: 1.4 }),
    B(16, 30, -5.4, 16, 15, 3.6, RK.cream, { m: 'cloth', r: 3 }),
    PR(10.5, 36.5, -5.4, tri(5, 5, -0.6), 3, RK.cream, { m: 'cloth' }), PR(21.5, 36.5, -5.4, tri(5, 5, 0.6), 3, RK.cream, { m: 'cloth' }),
    S(16, 33.5, -3.2, 1.5, 1.9, 0.7, RK.red, { m: 'gloss' }),
    S(12.5, 29, -3.4, 1.4, 0.5, 0.4, RK.black, { m: 'plain' }), S(19.5, 29, -3.4, 1.4, 0.5, 0.4, RK.black, { m: 'plain' }),
    S(16, 26.5, -3.4, 0.8, 0.6, 0.4, RK.pink, { m: 'plain' }),
  ]),

  // uniforms on a rail: three blacks and a white, the R on each
  piece('rktuniform', 'Rocket uniform rack', 2, 1, 700, 'gloss', [
    ...[4, 60].flatMap(x => [B(x, 1, 0, 5, 2, 24, RK.char, { r: 0.8 }), C(x, 31, 0, 1.2, 58, RK.steel, { m: 'metal' })]),
    RD([4, 60, 0], [60, 60, 0], 1, RK.light, { m: 'metal' }),
    ...[[14, RK.black], [26, RK.black], [38, RK.white], [50, RK.black]].flatMap(([x, c]) => [
      PR(x, 54.5, 0, tri(10, 4.5), 1, RK.steel, { m: 'metal' }),
      RD([x, 59, 0], [x, 61.5, 0], 0.5, RK.steel, { m: 'metal' }),
      B(x, 44, 0, 11, 20, 5, c, { m: 'cloth', r: 2 }),
      B(x - 6, 45, 0, 2.6, 14, 4, c, { m: 'cloth', r: 1.2 }), B(x + 6, 45, 0, 2.6, 14, 4, c, { m: 'cloth', r: 1.2 }),
      B(x, 31, 0, 10, 8, 4.4, c === RK.white ? RK.white : RK.char, { m: 'cloth', r: 1.2 }),
      rGlyph(x, 47, 2.9, 7, 0.6, RK.red, { m: 'plain' }),
    ]),
  ]),

  // crates of stolen goods, stamped R
  piece('rktcrates', 'R-stamped crates', 1, 1, 350, 'wood', [
    B(16, 10, 0, 29, 20, 28, RK.crate, { r: 0.8 }),
    ...[2, 18].map(h => B(16, h, 14.2, 29, 2.6, 0.8, sh(RK.crate, -1), { r: 0.3 })),
    ...[2.5, 29.5].map(x => B(x, 10, 14.2, 2.6, 20, 0.8, sh(RK.crate, -1), { r: 0.3 })),
    rGlyph(16, 10, 14.3, 11, 0.4, RK.red, { m: 'plain' }),
    B(14, 27, -3, 20, 14, 20, sh(RK.crate, 1), { r: 0.8 }),
    ...[21, 33].map(h => B(14, h, 7.2, 20, 2, 0.8, RK.crate, { r: 0.3 })),
    rGlyph(14, 27, 7.4, 8, 0.4, RK.red, { m: 'plain' }),
  ]),

  // the lift to the boss's floor, the Lift Key in its panel
  piece('rktelevator', 'Hideout elevator', 1, 1, 1300, 'metal', [
    B(16, 40, -6, 30, 80, 20, RK.char, { m: 'gloss' }),
    B(3, 35, 4.6, 4, 70, 1.6, RK.dark, { m: 'gloss' }), B(29, 35, 4.6, 4, 70, 1.6, RK.dark, { m: 'gloss' }),
    B(10.7, 34, 4.6, 10.4, 66, 1.2, RK.light, { r: 0.5 }), B(21.3, 34, 4.6, 10.4, 66, 1.2, RK.light, { r: 0.5 }),
    rGlyph(16, 40, 5.4, 12, 0.6, RK.red, { m: 'plain' }),
    B(16, 74, 4.6, 30, 12, 1.6, RK.dark, { m: 'gloss' }),
    PC(16, 74, 5.45, 22, 7, (g, x, y, w, h) => {
      g.fillStyle = '#16161c'; g.fillRect(x, y, w, h);
      font(g, 3.4); ['B1', 'B2', 'B3', 'B4'].forEach((s, i) => { g.fillStyle = i === 3 ? '#ffb040' : '#5a4a2a'; g.fillText(s, x + 3 + i * 5.3, y + h / 2 + 0.2); });
    }, { lit: 0.6 }),
    B(29, 38, 5.8, 2.6, 9, 1, RK.steel, { r: 0.4 }),
    S(29, 40.5, 6.5, 0.7, 0.7, 0.5, RK.amber, { m: 'glow' }),
    PR(29, 34, 6.5, [[-0.5, 0], [0.5, 0], [0.5, 2], [1.4, 2], [1.4, 3], [0.5, 3], [0.5, 3.6], [1.1, 3.6], [1.1, 4.6], [-0.5, 4.6]], 0.8, RK.gold, { m: 'metal' }),
  ], { glow: [RK.amber] }),

  // the Silph Scope under glass
  piece('rktscope', 'Silph Scope case', 1, 1, 1100, 'gloss', [
    B(16, 12, 0, 22, 24, 22, RK.char),
    B(16, 24.6, 0, 24, 1.4, 24, RK.gold, { m: 'metal', r: 0.5 }),
    PC(16, 15, 11.05, 16, 7, (g, x, y, w, h) => {
      g.fillStyle = RK.gold; g.fillRect(x, y, w, h); g.fillStyle = '#3a2a10'; g.fillRect(x + 0.6, y + 0.6, w - 1.2, h - 1.2);
      font(g, 2.6); g.fillStyle = '#f4dc90'; g.fillText('SILPH', x + w / 2, y + h * 0.33); g.fillText('SCOPE', x + w / 2, y + h * 0.7);
    }),
    C(16, 26.5, 0, 3.4, 2.4, RK.black),
    RD([8.5, 33, -1], [23.5, 33, -1], 0.9, RK.black, { m: 'plain' }),
    B(16, 33, 0.5, 10, 5.6, 5, '#5a5a68', { r: 1.6 }),
    DS(16, 33.2, 3.4, 3.4, 1.4, RK.light, { m: 'metal' }),
    DS(16, 33.2, 4.2, 2.6, 0.8, '#5aa8f0', { m: 'gloss' }),
    B(16, 36, 0, 20, 22, 20, '#cfe8f4', { m: 'glass', r: 0.6, k: 30 }),
    B(16, 47.6, 0, 21, 1.6, 21, RK.char, { r: 0.5 }),
  ]),

  // a lab tank of bubbling green
  piece('rkttank', 'Rocket lab tank', 1, 1, 1000, 'metal', [
    C(16, 5, 0, 13.5, 10, RK.steel),
    C(16, 37, 0, 11.4, 54, RK.green, { m: 'glow' }),
    ...[[12, 22, 8], [19, 34, 7], [14, 46, 6], [18, 56, 8], [11, 60, 3]].map(([x, h, z], i) => S(x, h, z, 1.2 + (i % 2) * 0.6, 1.2 + (i % 2) * 0.6, 1.2, '#d8ffe0', { m: 'glow' })),
    C(16, 40.5, 0, 12.3, 61, '#cfe8f4', { m: 'glass', k: 30 }),
    C(16, 75, 0, 13.5, 8, RK.steel),
    RD([10, 79, -4], [10, 86, -4], 1.4, RK.dark, { m: 'gloss' }), RD([22, 79, -4], [22, 84, -4], 1.4, RK.dark, { m: 'gloss' }),
    RD([10, 86, -4], [22, 84, -4], 1.4, RK.dark, { m: 'gloss' }),
    rGlyph(16, 5, 13.6, 6.5, 0.6, RK.red, { m: 'plain' }),
  ], { glow: [RK.green] }),

  // a steel cage, a Poké Ball locked in
  piece('rktcage', 'Rocket cage', 1, 1, 450, 'metal', [
    B(16, 1.5, 0, 29, 3, 29, RK.char, { m: 'gloss', r: 0.8 }),
    B(16, 39.5, 0, 29, 3, 29, RK.char, { m: 'gloss', r: 0.8 }),
    B(16, 20.5, -14, 27, 35, 1, RK.dark, { m: 'gloss', r: 0.3 }),
    ...pokeBall(16, 9.5, 0, 6.5),
    ...[3.5, 8.5, 13.5, 18.5, 23.5, 28.5].flatMap(x => [RD([x, 3, 13], [x, 38, 13], 0.8, RK.steel), RD([x, 3, -13], [x, 38, -13], 0.8, RK.steel)]),
    ...[-8, -3, 3, 8].flatMap(z => [RD([3.5, 3, z], [3.5, 38, z], 0.8, RK.steel), RD([28.5, 3, z], [28.5, 38, z], 0.8, RK.steel)]),
    RD([3.5, 21, 13], [28.5, 21, 13], 0.6, RK.steel),
    RD([10, 41, 0], [16, 46, 0], 0.7, RK.steel), RD([16, 46, 0], [22, 41, 0], 0.7, RK.steel),
    B(16, 18, 13.8, 4.5, 4, 1.6, RK.gold, { r: 0.6 }),
    RD([14.4, 20, 13.8], [16, 23, 13.8], 0.5, RK.light), RD([16, 23, 13.8], [17.6, 20, 13.8], 0.5, RK.light),
  ]),

  // the hideout's computer: a password prompt on a green screen
  piece('rktterminal', 'Rocket computer terminal', 1, 1, 850, 'gloss', [
    B(16, 16, -2, 28, 32, 24, RK.char),
    rGlyph(16, 17, 10.4, 11, 0.8, RK.red),
    ...[8, 12].map(x => S(x, 28, 10.4, 0.8, 0.8, 0.5, RK.green, { m: 'glow' })), S(24, 28, 10.4, 0.8, 0.8, 0.5, RK.glowR, { m: 'glow' }),
    B(16, 33, 6.5, 27, 2, 11, RK.dark, { r: 0.6 }),
    PC(16, 33, 12.05, 25, 1.8, (g, x, y, w, h) => { g.fillStyle = '#16161c'; g.fillRect(x, y, w, h); g.fillStyle = RK.light; for (let i = 0; i < 12; i++) g.fillRect(x + 0.6 + i * 2.05, y + 0.4, 1.5, h - 0.8); }),
    B(16, 50, -4, 26, 26, 16, RK.black),
    PC(16, 51, 4.05, 21, 18, (g, x, y, w, h) => {
      g.fillStyle = '#0a1a10'; g.fillRect(x, y, w, h);
      g.textAlign = 'left'; g.textBaseline = 'middle'; g.font = 'bold 2.6px monospace'; g.fillStyle = '#58e070';
      ['ROCKET OS 2.0', '> LIFT KEY', '  B4F: OK', '> PASSWORD:', '  ********_'].forEach((s, i) => g.fillText(s, x + 1.2, y + 2.6 + i * 3.2));
      g.fillStyle = 'rgba(120,255,140,0.07)'; for (let j = y; j < y + h; j += 1.1) g.fillRect(x, j, w, 0.4);
    }, { lit: 0.6 }),
  ], { glow: ['#0a1a10'] }),

  // a wanted poster for a Rocket grunt
  wallPiece('rktwanted', 'Rocket wanted poster', 1, 250, 'plain', [
    B(16, 56, 0.4, 26, 34, 0.8, RK.paper, { r: 0.3 }),
    PC(16, 56, 0.85, 25, 33, (g, x, y, w, h) => {
      g.fillStyle = RK.paper; g.fillRect(x, y, w, h);
      font(g, 5); g.fillStyle = RK.deep; g.fillText('WANTED', x + w / 2, y + 4.2);
      g.fillStyle = '#d8c8a0'; g.fillRect(x + 4, y + 7.5, w - 8, 15);
      g.fillStyle = RK.black; g.beginPath(); g.arc(x + w / 2, y + 22.5, 6.5, Math.PI, TAU); g.fill();
      g.fillStyle = '#f0c8a0'; g.beginPath(); g.arc(x + w / 2, y + 13.5, 3.6, 0, TAU); g.fill();
      g.fillStyle = RK.black; g.beginPath(); g.arc(x + w / 2, y + 12, 3.9, Math.PI, TAU); g.fill(); g.fillRect(x + w / 2 - 4.5, y + 11.6, 9, 1);
      fillR(g, x + w / 2, y + 19.2, 3.2, RK.red);
      font(g, 3); g.fillStyle = RK.black; g.fillText('ROCKET GRUNT', x + w / 2, y + 25.5, w - 2);
      font(g, 3.4); g.fillStyle = RK.deep; g.fillText('REWARD ₽5000', x + w / 2, y + 29.6, w - 2);
    }),
    S(5, 71, 1.4, 1, 1, 0.8, RK.red), S(27, 71, 1.4, 1, 1, 0.8, RK.red),
  ]),

  // Jessie, James and Meowth's motto, framed
  wallPiece('rktprepare', 'Prepare for trouble poster', 2, 450, 'gloss', [
    B(32, 54, 0.6, 58, 40, 1.2, RK.black, { r: 0.6 }),
    PC(32, 54, 1.25, 54, 36, (g, x, y, w, h) => {
      const s = g.createRadialGradient(x + w / 2, y + h * 0.55, 0, x + w / 2, y + h * 0.55, w * 0.6);
      s.addColorStop(0, '#ff6a50'); s.addColorStop(1, RK.deep);
      g.fillStyle = s; g.fillRect(x, y, w, h);
      g.fillStyle = 'rgba(255,220,180,0.18)';
      for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; g.beginPath(); g.moveTo(x + w / 2, y + h * 0.55); g.lineTo(x + w / 2 + Math.cos(a) * 60, y + h * 0.55 + Math.sin(a) * 60); g.lineTo(x + w / 2 + Math.cos(a + 0.18) * 60, y + h * 0.55 + Math.sin(a + 0.18) * 60); g.fill(); }
      fillR(g, x + w / 2, y + h * 0.56, 14, 'rgba(255,255,255,0.22)');
      // Jessie, her magenta hair swept back
      const fig = (cx, hair, swoop) => {
        g.fillStyle = RK.white; g.beginPath(); g.roundRect(cx - 4.5, y + 19, 9, 13, 2); g.fill();
        fillR(g, cx, y + 23, 4, RK.red);
        g.fillStyle = '#f4d0b0'; g.beginPath(); g.arc(cx, y + 15.5, 3.2, 0, TAU); g.fill();
        g.fillStyle = hair; g.beginPath();
        if (swoop) { g.moveTo(cx - 3.4, y + 15); g.quadraticCurveTo(cx - 4, y + 10, cx + 1, y + 11.6); g.quadraticCurveTo(cx + 9, y + 9, cx + 11, y + 22); g.quadraticCurveTo(cx + 6, y + 16, cx + 3.4, y + 14); }
        else { g.moveTo(cx - 3.6, y + 16); g.quadraticCurveTo(cx - 3.8, y + 10.5, cx + 0.5, y + 11.5); g.quadraticCurveTo(cx + 4.5, y + 11, cx + 3.6, y + 16); g.quadraticCurveTo(cx + 1, y + 13, cx - 3.6, y + 16); }
        g.fill();
      };
      fig(x + 15, '#e0488a', true); fig(x + 39, '#5878d8', false);
      g.fillStyle = RK.cream; g.beginPath(); g.arc(x + w / 2, y + 26.5, 4, 0, TAU); g.fill();
      g.beginPath(); g.moveTo(x + w / 2 - 4, y + 25); g.lineTo(x + w / 2 - 3, y + 20.5); g.lineTo(x + w / 2 - 0.8, y + 23); g.fill();
      g.beginPath(); g.moveTo(x + w / 2 + 4, y + 25); g.lineTo(x + w / 2 + 3, y + 20.5); g.lineTo(x + w / 2 + 0.8, y + 23); g.fill();
      g.fillStyle = RK.gold; g.beginPath(); g.arc(x + w / 2, y + 23.8, 0.9, 0, TAU); g.fill();
      font(g, 4.4); g.lineWidth = 0.9; g.strokeStyle = RK.black; g.fillStyle = RK.white;
      g.strokeText('PREPARE FOR TROUBLE!', x + w / 2, y + 4.4); g.fillText('PREPARE FOR TROUBLE!', x + w / 2, y + 4.4);
      font(g, 3.6); g.strokeText('...AND MAKE IT DOUBLE!', x + w / 2, y + h - 2.8); g.fillText('...AND MAKE IT DOUBLE!', x + w / 2, y + h - 2.8);
    }),
  ]),

  // the transmitter they took the Radio Tower with
  piece('rktradio', 'Rocket radio transmitter', 1, 1, 800, 'metal', [
    B(16, 20, -2, 27, 40, 22, '#5a606c', { r: 1 }),
    PC(16, 23, 9.05, 23, 30, (g, x, y, w, h) => {
      g.fillStyle = '#3a3e48'; g.fillRect(x, y, w, h);
      g.fillStyle = '#16161c'; g.fillRect(x + 2, y + 2, w - 4, 8);
      const s = g.createLinearGradient(x + 3, 0, x + w - 3, 0); s.addColorStop(0, '#58e070'); s.addColorStop(0.7, '#ffd040'); s.addColorStop(1, '#ff4a52');
      g.fillStyle = s; for (let i = 0; i < 9; i++) g.fillRect(x + 3 + i * 2, y + 9 - (2 + (i * 7 % 5)), 1.4, 2 + (i * 7 % 5));
      for (let i = 0; i < 3; i++) { g.fillStyle = RK.light; g.beginPath(); g.arc(x + 5 + i * 6.5, y + 16, 2.4, 0, TAU); g.fill(); g.fillStyle = RK.black; g.fillRect(x + 4.7 + i * 6.5, y + 13.8, 0.6, 2.2); }
      font(g, 3); g.fillStyle = '#ffb040'; g.fillText('88.8 MHz', x + w / 2, y + 22.5);
      fillR(g, x + w / 2, y + 26.5, 4, RK.red);
    }, { lit: 0.45 }),
    B(16, 40.6, -2, 28, 1.4, 23, RK.char, { m: 'gloss', r: 0.5 }),
    RD([9, 41, -2], [16, 86, -2], 0.8, RK.light), RD([23, 41, -2], [16, 86, -2], 0.8, RK.light),
    ...[[52, 10.7], [64, 12.6], [76, 14.5]].map(([h, x]) => RD([x, h, -2], [32 - x, h, -2], 0.5, RK.light)),
    RD([10.7, 52, -2], [19.4, 64, -2], 0.4, RK.light), RD([21.3, 52, -2], [12.6, 64, -2], 0.4, RK.light),
    S(16, 88, -2, 2.2, 2.2, 2.2, RK.glowR, { m: 'glow' }),
    RD([25, 30, 9], [29, 33, 11], 0.5, RK.black, { m: 'plain' }), S(29.3, 34, 11.2, 1.4, 2, 1.4, RK.dark),
  ], { glow: [RK.glowR, '#ffb040'] }),

  // a vending machine, Rocket red
  piece('rktvending', 'Rocket vending machine', 1, 1, 650, 'gloss', [
    B(16, 34, -1, 28, 68, 26, RK.red, { r: 2 }),
    B(16, 64, 12.2, 26, 7, 0.6, RK.black, { r: 0.4 }),
    PC(16, 64, 12.55, 24, 5.6, (g, x, y, w, h) => { g.fillStyle = RK.black; g.fillRect(x, y, w, h); font(g, 3.6); g.fillStyle = '#ffffff'; g.fillText('ROCKET COLA', x + w / 2, y + h / 2 + 0.2, w - 1.5); }, { lit: 0.6 }),
    B(12, 41, 12.2, 19, 36, 0.6, RK.black, { r: 0.4 }),
    PC(12, 41, 12.55, 17.5, 34.5, (g, x, y, w, h) => {
      g.fillStyle = '#e8f4fa'; g.fillRect(x, y, w, h);
      const cans = ['#d42a34', '#1c1c22', '#d8b048', '#5a90e0'];
      for (let r = 0; r < 4; r++) {
        g.fillStyle = '#a8b4c0'; g.fillRect(x, y + 8 + r * 8.5, w, 0.6);
        for (let i = 0; i < 4; i++) { g.fillStyle = cans[(i + r) % 4]; g.beginPath(); g.roundRect(x + 1.2 + i * 4.1, y + 1.6 + r * 8.5, 3.2, 6.2, 0.8); g.fill(); g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(x + 1.7 + i * 4.1, y + 2.2 + r * 8.5, 0.6, 5); }
      }
    }, { lit: 0.55 }),
    B(25.5, 41, 12.2, 5.4, 36, 0.6, RK.black, { r: 0.4 }),
    ...[0, 1, 2, 3, 4].map(i => B(25.5, 54 - i * 4, 12.8, 2.8, 2, 0.6, i % 2 ? RK.light : RK.amber, { r: 0.4 })),
    B(25.5, 30, 12.8, 2, 4, 0.6, RK.steel, { m: 'metal', r: 0.3 }),
    B(12, 14, 12.4, 18, 7, 1, RK.black, { r: 0.6 }),
    rGlyph(25.5, 14, 12.4, 6, 0.6, RK.white, { m: 'plain' }),
  ], { glow: ['#e8f4fa'] }),

  // the flag over the hideout
  piece('rktflag', 'Team Rocket flag', 1, 1, 400, 'gloss', [
    LA(5, 0, 0, [[5, 0], [5, 2], [3, 3.5], [1.4, 4.5], [0, 4.5]], RK.char),
    C(5, 44, 0, 0.9, 80, RK.light, { m: 'metal' }),
    S(5, 85, 0, 1.8, 1.8, 1.8, RK.gold, { m: 'metal' }),
    B(18.5, 68, 0, 25, 22, 0.8, RK.black, { m: 'cloth', r: 0.3 }),
    B(18.5, 57.8, 0, 25, 1.6, 0.9, RK.red, { m: 'cloth', r: 0.3 }), B(18.5, 78.2, 0, 25, 1.6, 0.9, RK.red, { m: 'cloth', r: 0.3 }),
    rGlyph(18.5, 68, 0.6, 14, 0.4, RK.red, { m: 'plain' }),
    rGlyph(18.5, 68, -0.6, 14, 0.4, RK.red, { m: 'plain' }),
  ]),

  // Giovanni's safe: its door swings open on his gold
  piece('rktsafe', "Giovanni's safe", 1, 1, 950, 'metal', [
    ...[[4, -11], [28, -11], [4, 9], [28, 9]].map(([x, z]) => B(x, 1, z, 3, 2, 3, RK.black, { m: 'gloss', r: 0.5 })),
    B(16, 19, -1, 29, 34, 26, '#3a3c44', { r: 1.6 }),
    B(16, 36.4, -1, 29.4, 1.2, 26.4, RK.gold, { r: 0.4 }),
  ], {
    doors: [{ hinge: [3.5, 12.6], side: 1, parts: [
      B(16, 19, 12.6, 25, 30, 1.4, '#4c4e58', { r: 1 }),
      DS(16, 21, 13.8, 4.6, 1.2, RK.light),
      DS(16, 21, 14.5, 1.4, 0.8, RK.dark, { m: 'gloss' }),
      ...[0, 1, 2].map(i => RD([16, 21, 14.4], [16 + Math.cos(i * TAU / 3) * 4.2, 21 + Math.sin(i * TAU / 3) * 4.2, 14.4], 0.5, RK.light)),
      B(25, 15, 13.6, 1.4, 6, 1, RK.gold, { r: 0.4 }),
      rGlyph(16, 30.5, 13.5, 5, 0.4, RK.gold),
    ] }],
    inside: { x: 16, h: 19, w: 23, hh: 28, z: 11.8 },
  }),

  // the arm that snatches Poké Balls
  piece('rktclaw', 'Poké Ball snatcher', 1, 1, 1200, 'metal', [
    B(16, 8, 0, 27, 16, 27, RK.char, { m: 'gloss', r: 1.4 }),
    rGlyph(16, 8.5, 13.6, 10, 0.6, RK.red, { m: 'plain' }),
    B(16, 16.4, 0, 27.5, 1.2, 27.5, RK.red, { m: 'gloss', r: 0.4 }),
    C(16, 19.5, 0, 7, 5, RK.steel),
    RD([16, 22, 0], [9, 48, 0], 2.2, RK.steel),
    S(9, 49, 0, 3.4, 3.4, 3.4, RK.dark, { m: 'gloss' }),
    RD([9, 49, 0], [21, 68, 1], 1.8, RK.steel),
    S(21, 69, 1, 2.8, 2.8, 2.8, RK.dark, { m: 'gloss' }),
    C(21, 64.5, 1, 3, 4, RK.red, { m: 'gloss' }),
    ...pokeBall(21, 55, 1, 4.6),
    RD([18.6, 62.5, 1], [15.4, 55, 1], 0.7, RK.light), RD([15.4, 55, 1], [17.4, 50.6, 1], 0.7, RK.light),
    RD([23.4, 62.5, 1], [26.6, 55, 1], 0.7, RK.light), RD([26.6, 55, 1], [24.6, 50.6, 1], 0.7, RK.light),
  ]),

  // a giant Meowth mecha's head, eyes alight
  piece('rktmecha', 'Mecha-Meowth head', 1, 1, 1300, 'metal', [
    B(16, 3, 0, 26, 6, 24, RK.char, { m: 'gloss', r: 1 }),
    rGlyph(16, 3, 12.2, 4.6, 0.6, RK.red, { m: 'plain' }),
    C(16, 18, 0, 4, 24, RK.steel),
    B(16, 32, 4, 13, 5, 10, RK.dark, { m: 'gloss', r: 1.4 }),
    ...meowthFace(16, 47, 0, 14, { m: 'metal', skin: '#d8c8a0', eye: '#ffe060', eyeM: 'glow' }),
    ...[-1, 1].map(s => S(16 + s * 13.4, 47, 0, 1.6, 3.4, 3.4, RK.dark, { m: 'gloss' })),
  ], { glow: ['#ffe060'] }),

  // an alarm lamp: a red beacon on a post
  piece('rktbeacon', 'Rocket alarm lamp', 1, 1, 400, 'gloss', [
    LA(16, 0, 0, [[8, 0], [8, 2], [5, 4], [1.6, 5], [0, 5]], RK.char),
    C(16, 25, 0, 1.9, 42, RK.steel, { m: 'metal' }),
    C(16, 47, 0, 6, 3, RK.black),
    C(16, 54, 0, 5, 11, RK.glowR, { m: 'glow', rb: 5.5 }),
    ...[1, 3, 5, 7].map(i => { const a = i * Math.PI / 4, cx = 16 + Math.cos(a) * 5.9, cz = Math.sin(a) * 5.9; return RD([cx, 48.5, cz], [cx, 59.6, cz], 0.5, RK.steel, { m: 'metal' }); }),
    C(16, 60.5, 0, 5.4, 2, RK.black),
  ], { glow: [RK.glowR] }),
].map(f => ({ group: GROUP, solo: true, ...f }));
