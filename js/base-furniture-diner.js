/* base-furniture-diner.js  -  the Diner set (furniture expansion session e, 2026-10-17): a 1950s American diner.
   Polished chrome, red and mint vinyl piped in white, black-and-white checker, cream enamel, mint formica, neon. All
   solo, fixed colours.
   As in js/base-furniture-antique.js, an upright piece is a list of parts in painted units (32 a tile): `x` across from
   the left of its front, `h` up from the floor (a wall piece's from the foot of its strip), `z` out to the front from its
   middle (a wall piece's from the wall). They're painted here from any side, and js/base-models-diner.js builds the
   same list as 3D parts (BUILT), so picture and model agree. A `pic` part (a dial, the menu, the checker panels) is
   painted on the front only, and the model wears that crop of the painting. A `slab` is a side profile run across x (the
   booth's ends, the register's wedge). The wardrobe's and the fridge's doors swing (`doors`, `inside`). The rug is
   painted from above. */

import { sh, oval, ovalShade, floorShadow, ctx, glass as glassPane } from './base-paint.js';

export const DN = {
  chrome: '#cfd6de', chromeD: '#8e98a6', red: '#d22a3c', redD: '#9c1c2c', white: '#f6f4ee', mint: '#9fe3cf', mintD: '#6cc4ad',
  teal: '#3aa8a4', cream: '#f3ead0', creamD: '#d9cba6', black: '#26262c', formica: '#d4f0e6', yellow: '#f5c52e',
  coffee: '#3a2216', crust: '#d9a055', cherry: '#b51d2c', blue: '#4a5ec0', lemon: '#f6e27a', choc: '#5a3420',
  pink: '#ff4fa8', neonMint: '#6effc8', amber: '#ffb43a', warm: '#ffe6b0', shake: '#f6a2c0', mirror: '#c8dce6',
  orange: '#e8742a', snorlax: '#3d6b7a',
};
const GROUP = 'Diner';
const TAU = Math.PI * 2;

/* ---------- parts ---------- */
const B = (x, h, z, w, hh, d, c, o) => ({ t: 'box', x, h, z, w, hh, d, c, r: 1, ...o });
const C = (x, h, z, r, hh, c, o) => ({ t: 'cyl', x, h, z, r, hh, c, ...o });
const S = (x, h, z, rx, ry, rz, c, o) => ({ t: 'ball', x, h, z, rx, ry, rz, c, ...o });
const RD = (a, b, r, c, o) => ({ t: 'rod', a, b, r, c, x: (a[0] + b[0]) / 2, h: (a[1] + b[1]) / 2, z: (a[2] + b[2]) / 2, ...o });
const PR = (x, h, z, pts, d, c, o) => ({ t: 'prism', x, h, z, pts, d, c, ...o });
const LA = (x, h, z, pts, c, o) => ({ t: 'lathe', x, h, z, pts, c, ...o });
const DS = (x, h, z, r, th, c, o) => ({ t: 'disc', x, h, z, r, th, c, ...o });
const RG = (x, h, z, r, tr, c, o) => ({ t: 'ring', x, h, z, r, tr, c, ...o });
const PC = (x, h, z, w, hh, fn, o) => ({ t: 'pic', x, h, z, w, hh, fn, ...o });
/** A side profile [[dz, dh]...] about z, h, run w across x. */
const SL = (x, h, z, w, pts, c, o) => ({ t: 'slab', x, h, z, w, pts, c, ...o });

const M = { m: 'metal' }, PL = { m: 'plain' }, CL = { m: 'cloth' }, GL = { m: 'glass' }, GW = { m: 'glow' };
/** A half circle r round, standing on its flat side, as prism points. */
const arch = (r, n = 10) => Array.from({ length: n + 1 }, (_, i) => { const a = Math.PI * (1 - i / n); return [Math.cos(a) * r, Math.sin(a) * r]; });
/** A half ring between radii ro and ri. */
const band = (ro, ri, n = 10) => [...arch(ro, n), ...arch(ri, n).reverse()];
const pull = (x, h, z, w = 6) => RD([x - w / 2, h, z], [x + w / 2, h, z], 0.45, DN.chrome, M);
/** A chrome tube from a to b. */
const tube = (a, b, r = 0.9) => RD(a, b, r, DN.chrome, M);

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
  if (m === 'plain') { g.fillStyle = c; g.beginPath(); g.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); g.fill(); return; }
  g.fillStyle = grad(g, x, y, x + w * 0.3, y + h, c, m); g.beginPath(); g.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); g.fill();
  if (h > 3 && w > 3) { g.save(); g.globalAlpha *= 0.4; g.fillStyle = sh(c, 2); g.fillRect(x + Math.min(r, w / 2) * 0.6, y + 0.3, w - Math.min(r, w / 2) * 1.2, 0.5); g.restore(); }
}
function poly(pts, c, m, horiz) {
  const g = ctx(), xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  if (m === 'glass') { g.save(); g.globalAlpha *= 0.35; }
  if (m === 'plain') g.fillStyle = c;
  else if (horiz) {
    const l = g.createLinearGradient(x0, 0, x1, 0);
    l.addColorStop(0, sh(c, -1)); l.addColorStop(0.3, sh(c, 1)); l.addColorStop(0.55, c); l.addColorStop(1, sh(c, -2));
    g.fillStyle = m === 'glass' ? '#cfe8f4' : l;
  } else g.fillStyle = m === 'glass' ? '#cfe8f4' : grad(g, x0, y0, x1, y1, c, m);
  g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill();
  if (m === 'glass') g.restore();
}
function ball(cx, cy, rx, ry, c, m) {
  const g = ctx();
  if (m === 'glow') { const t = g.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry)); t.addColorStop(0, '#ffffff'); t.addColorStop(0.4, sh(c, 1)); t.addColorStop(1, c); g.fillStyle = t; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, TAU); g.fill(); return; }
  if (m === 'glass') { g.save(); g.globalAlpha *= 0.4; oval(cx, cy, rx, ry, '#dff0f8'); g.restore(); return; }
  if (m === 'plain') { oval(cx, cy, rx, ry, c); return; }
  ovalShade(cx, cy, rx, ry, c);
  if (m === 'gloss' || m === 'metal') { g.save(); g.globalAlpha *= 0.55; oval(cx - rx * 0.38, cy - ry * 0.42, rx * 0.22, ry * 0.14, '#ffffff'); g.restore(); }
}

/** Paints parts seen from `dir` (0 front, 2 back, 1 / 3 the sides), on a view vw wide standing on line b; Wd is the
    piece's front width in units. */
function paintParts(parts, x0, b, vw, dir, Wd) {
  const side = dir % 2 === 1, sg = dir === 3 ? -1 : 1, g = ctx();
  const U = (px, pz) => (dir === 0 ? x0 + px : dir === 2 ? x0 + Wd - px : x0 + vw / 2 + sg * pz);
  const key = (q) => q.k ?? (dir === 0 ? q.z : dir === 2 ? -q.z : sg * (Wd / 2 - q.x));
  const list = parts.map((q, i) => [key(q), i, q]).sort((a, c) => a[0] - c[0] || a[1] - c[1]).map(e => e[2]);
  for (const q of list) {
    if (q.t === 'pic' && dir !== 0) continue;
    const m = q.m || 'gloss', cx = U(q.x, q.z), cy = b - q.h;
    switch (q.t) {
      case 'box': { const w = side ? q.d : q.w; rbx(cx - w / 2, cy - q.hh / 2, w, q.hh, q.r, q.c, m); break; }
      case 'cyl': {
        const rb = q.rb ?? q.r, top = cy - q.hh / 2, bot = cy + q.hh / 2;
        poly([[cx - q.r, top], [cx + q.r, top], [cx + rb, bot], [cx - rb, bot]], q.c, m, m !== 'glow');
        if (m !== 'glass') oval(cx, top, q.r, Math.min(q.r * 0.22, Math.max(0.3, q.hh / 2)), sh(q.c, m === 'glow' ? 2 : 1));
        break;
      }
      case 'ball': ball(cx, cy, side ? q.rz : q.rx, q.ry, q.c, m); break;
      case 'disc': if (side) rbx(cx - q.th / 2, cy - (q.ry ?? q.r), q.th, (q.ry ?? q.r) * 2, q.th / 2, q.c, m); else ball(cx, cy, q.r, q.ry ?? q.r, q.c, m); break;
      case 'lathe': {
        const pts = q.pts.map(([r, up]) => [r, cy - up]);
        poly([...pts.map(([r, y]) => [cx - r, y]), ...pts.slice().reverse().map(([r, y]) => [cx + r, y])], q.c, m, true);
        if (q.pts[q.pts.length - 1][0] < 0.01 && q.pts.length > 2) break;
        const [rt, ut] = q.pts[q.pts.length - 1];
        if (m !== 'glass') oval(cx, cy - ut, rt, rt * 0.22, sh(q.c, -2));
        break;
      }
      case 'ring': {
        g.strokeStyle = q.c; g.lineWidth = q.tr * 2; g.beginPath();
        if (q.flat) g.ellipse(cx, cy, q.r, q.r * 0.22, 0, 0, TAU);
        else if (side) { rbx(cx - q.tr, cy - q.r - q.tr, q.tr * 2, (q.r + q.tr) * 2, q.tr, q.c, m); break; }
        else g.arc(cx, cy, q.r, 0, TAU);
        g.stroke();
        if (m === 'plain') break;
        g.save(); g.globalAlpha *= 0.45; g.strokeStyle = sh(q.c, 2); g.lineWidth = q.tr * 0.6; g.beginPath();
        if (q.flat) g.ellipse(cx, cy - q.tr * 0.4, q.r, q.r * 0.22, 0, Math.PI, TAU); else g.arc(cx, cy, q.r, Math.PI * 1.1, Math.PI * 1.6);
        g.stroke(); g.restore();
        break;
      }
      case 'rod': {
        const p0 = [U(q.a[0], q.a[2]), b - q.a[1]], p1 = [U(q.b[0], q.b[2]), b - q.b[1]];
        if (Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) < 0.05) { ball(p0[0], p0[1], q.r, q.r, q.c, m); break; }
        g.lineCap = 'round'; g.strokeStyle = m === 'glass' ? alphaOf('#cfe8f4', 0.4) : q.c; g.lineWidth = q.r * 2;
        g.beginPath(); g.moveTo(...p0); g.lineTo(...p1); g.stroke();
        if (q.r > 0.6 && m !== 'glass' && m !== 'plain') {
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
        poly(q.pts.map(([px, ph]) => [U(q.x + px), b - q.h - ph]), q.c, m);
        break;
      }
      case 'slab': {
        if (side) { poly(q.pts.map(([dz, dh]) => [U(0, q.z + dz), b - q.h - dh]), q.c, m); break; }
        const hs = q.pts.map(p => p[1]), top = Math.max(...hs), bot = Math.min(...hs);
        rbx(cx - q.w / 2, b - q.h - top, q.w, top - bot, 0.5, q.c, m);
        break;
      }
      case 'pic': g.save(); g.beginPath(); g.rect(cx - q.w / 2, cy - q.hh / 2, q.w, q.hh); g.clip(); q.fn(g, cx - q.w / 2, cy - q.hh / 2, q.w, q.hh); g.restore(); break;
    }
  }
}

/* ---------- pictures ---------- */

/** The starburst clock's face: cream, atomic dots for the hours, a red sweep hand. Square, inside the round dial. */
function atomicDial(g, x, y, w, h) {
  const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2;
  g.fillStyle = DN.cream; g.fillRect(x, y, w, h);
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * TAU, big = i % 3 === 0;
    g.fillStyle = big ? DN.red : DN.black; g.beginPath(); g.arc(cx + Math.cos(a) * r * 0.8, cy + Math.sin(a) * r * 0.8, r * (big ? 0.11 : 0.06), 0, TAU); g.fill();
  }
  g.strokeStyle = DN.black; g.lineCap = 'round';
  for (const [a, len, lw] of [[-150, 0.45, 0.1], [-30, 0.66, 0.07]]) { const t = a * Math.PI / 180; g.lineWidth = r * lw; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(t) * r * len, cy + Math.sin(t) * r * len); g.stroke(); }
  g.strokeStyle = DN.red; g.lineWidth = r * 0.03; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + r * 0.2, cy + r * 0.68); g.stroke();
  g.fillStyle = DN.red; g.beginPath(); g.arc(cx, cy, r * 0.08, 0, TAU); g.fill();
}
/** Black and white checker, `n` squares across. */
const checker = (n) => (g, x, y, w, h) => {
  const s = w / n;
  for (let j = 0; j * s < h; j++) for (let i = 0; i < n; i++) { g.fillStyle = (i + j) % 2 ? DN.black : DN.white; g.fillRect(x + i * s, y + j * s, s + 0.05, s + 0.05); }
};
/** The menu board: white press-in letters on black felt, a burger, a shake and a slice of pie. */
function menuBoard(g, x, y, w, h) {
  g.fillStyle = '#1c1c22'; g.fillRect(x, y, w, h);
  g.fillStyle = 'rgba(255,255,255,0.05)'; for (let i = 0; i < h; i += 1.2) g.fillRect(x, y + i, w, 0.4);
  g.textBaseline = 'middle'; g.font = `bold ${h * 0.12}px monospace`;
  const rows = [['BURGER', '35¢'], ['FRIES', '15¢'], ['SHAKE', '25¢'], ['CHERRY PIE', '20¢'], ['COFFEE', '5¢']];
  rows.forEach(([a, p], i) => {
    const ly = y + h * (0.14 + i * 0.18);
    g.fillStyle = '#f4f4f0'; g.textAlign = 'left'; g.fillText(a, x + w * 0.04, ly);
    g.fillStyle = DN.yellow; g.textAlign = 'right'; g.fillText(p, x + w * 0.66, ly);
  });
  const ix = x + w * 0.83;
  g.fillStyle = DN.crust; g.beginPath(); g.ellipse(ix, y + h * 0.17, w * 0.07, h * 0.06, 0, Math.PI, TAU); g.fill();
  g.fillStyle = '#6a3a1e'; g.fillRect(ix - w * 0.075, y + h * 0.18, w * 0.15, h * 0.04);
  g.fillStyle = '#58b048'; g.fillRect(ix - w * 0.075, y + h * 0.22, w * 0.15, h * 0.02);
  g.fillStyle = DN.crust; g.fillRect(ix - w * 0.07, y + h * 0.245, w * 0.14, h * 0.04);
  g.fillStyle = DN.shake; g.beginPath(); g.moveTo(ix - w * 0.05, y + h * 0.4); g.lineTo(ix + w * 0.05, y + h * 0.4); g.lineTo(ix + w * 0.025, y + h * 0.6); g.lineTo(ix - w * 0.025, y + h * 0.6); g.fill();
  g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(ix, y + h * 0.39, w * 0.05, h * 0.04, 0, 0, TAU); g.fill();
  g.fillStyle = DN.cherry; g.beginPath(); g.arc(ix, y + h * 0.34, h * 0.025, 0, TAU); g.fill();
  g.fillStyle = DN.crust; g.beginPath(); g.moveTo(ix - w * 0.07, y + h * 0.88); g.lineTo(ix + w * 0.07, y + h * 0.88); g.lineTo(ix + w * 0.07, y + h * 0.74); g.fill();
  g.fillStyle = DN.cherry; g.beginPath(); g.moveTo(ix - w * 0.05, y + h * 0.86); g.lineTo(ix + w * 0.06, y + h * 0.86); g.lineTo(ix + w * 0.06, y + h * 0.77); g.fill();
}
/** White letters on red: a sign's word. */
const word = (text, ink = '#ffffff', bg = DN.red) => (g, x, y, w, h) => {
  g.fillStyle = bg; g.fillRect(x, y, w, h);
  g.fillStyle = ink; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `bold ${h * 0.8}px monospace`;
  g.fillText(text, x + w / 2, y + h * 0.55, w * 0.94);
};
/** The jukebox's title strips: two columns of cards, a red line on each. */
function titleStrips(g, x, y, w, h) {
  g.fillStyle = DN.black; g.fillRect(x, y, w, h);
  for (let col = 0; col < 2; col++) for (let row = 0; row < 3; row++) {
    const cx = x + w * (0.04 + col * 0.5), cy = y + h * (0.08 + row * 0.31);
    g.fillStyle = '#fff8e8'; g.fillRect(cx, cy, w * 0.42, h * 0.24);
    g.fillStyle = row % 2 ? DN.blue : DN.red; g.fillRect(cx + w * 0.03, cy + h * 0.09, w * 0.3, h * 0.06);
  }
}

/* ---------- the kinds ---------- */

/** What js/base-models-diner.js builds for each upright and wall kind: its parts, doors and default material. */
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

/** A neon letter's strokes, its middle at x, from h 58 to 70. */
const LETTERS = {
  D: (x) => [[[x - 4, 58], [x - 4, 70]], [[x - 4, 70], [x + 1, 70]], [[x + 1, 70], [x + 4, 67]], [[x + 4, 67], [x + 4, 61]], [[x + 4, 61], [x + 1, 58]], [[x + 1, 58], [x - 4, 58]]],
  I: (x) => [[[x, 58], [x, 70]], [[x - 2.5, 70], [x + 2.5, 70]], [[x - 2.5, 58], [x + 2.5, 58]]],
  N: (x) => [[[x - 4, 58], [x - 4, 70]], [[x - 4, 70], [x + 4, 58]], [[x + 4, 58], [x + 4, 70]]],
  E: (x) => [[[x - 4, 58], [x - 4, 70]], [[x - 4, 70], [x + 4, 70]], [[x - 4, 64], [x + 2.5, 64]], [[x - 4, 58], [x + 4, 58]]],
  R: (x) => [[[x - 4, 58], [x - 4, 70]], [[x - 4, 70], [x + 2, 70]], [[x + 2, 70], [x + 4, 68]], [[x + 4, 68], [x + 4, 66]], [[x + 4, 66], [x + 2, 64]], [[x + 2, 64], [x - 4, 64]], [[x - 1, 64], [x + 4, 58]]],
};
const neon = (strokes, z, c) => strokes.map(([[ax, ah], [bx, bh]]) => RD([ax, ah, z], [bx, bh, z], 0.75, c, GW));

/** A pie on a shelf: crust, filling, a cream dollop for the cream pies. */
const pie = (x, h, z, r, fill, top) => [C(x, h + 1, z, r, 2, DN.crust, { seg: 12 }), C(x, h + 2.15, z, r * 0.86, 0.3, fill, { seg: 12, m: 'plain' }), ...(top ? [S(x, h + 2.8, z, r * 0.5, 0.9, r * 0.5, top, { seg: 8, m: 'cloth' })] : [])];

export const DINER_KINDS = [
  // a chrome-railed bed: tube posts with ball finials, a channel-tufted red vinyl headboard piped in white, a mint quilt
  // with a checker throw at its foot
  piece('dnrbed', 'Chrome-rail diner bed', 2, 2, 1300, 'gloss', [
    ...[[4, -29], [60, -29]].flatMap(([x, z]) => [tube([x, 0, z], [x, 52, z], 1.4), S(x, 53.4, z, 2, 2, 2, DN.chrome, { m: 'metal', seg: 10 })]),
    ...[[4, 29], [60, 29]].flatMap(([x, z]) => [tube([x, 0, z], [x, 30, z], 1.4), S(x, 31.4, z, 2, 2, 2, DN.chrome, { m: 'metal', seg: 10 })]),
    tube([4, 50, -29], [60, 50, -29], 1), tube([4, 21, -29], [60, 21, -29], 1),
    tube([4, 28, 29], [60, 28, 29], 1), tube([4, 13, 29], [60, 13, 29], 1),
    B(32, 36, -29.6, 53.2, 29.2, 2.2, DN.white, { r: 3.4, m: 'plain' }),
    B(32, 36, -29.4, 52, 28, 3, DN.red, { r: 3 }),
    ...[14, 23, 32, 41, 50].map(x => B(x, 36, -27.8, 0.5, 24, 0.3, DN.redD, { m: 'plain', r: 0.1 })),
    B(32, 20.5, 29.6, 53.2, 13.2, 2, DN.white, { r: 2.4, m: 'plain' }),
    B(32, 20.5, 29.4, 52, 12, 2.6, DN.red, { r: 2 }),
    B(32, 9, 0, 56, 6, 56, DN.black, { r: 1 }),
    ...[2.8, 61.2].map(x => tube([x, 9, -27], [x, 9, 27], 0.7)),
    B(32, 15.5, 0, 54, 7, 54, DN.white, { m: 'cloth', r: 1.5 }),
    B(32, 20, 6, 55, 2.4, 42, DN.mint, { m: 'cloth' }),
    B(32, 20.2, -16, 55.4, 2.8, 5, DN.white, { m: 'cloth' }),
    ...[20, 44].map(x => S(x, 22, -22, 9, 3.2, 4.6, DN.white, { m: 'cloth' })),
    ...Array.from({ length: 16 }, (_, i) => B(8.4 + (i % 8) * 6.75, 21.4, 18 + Math.floor(i / 8) * 6.75, 6.75, 0.4, 6.75, (i + Math.floor(i / 8)) % 2 ? DN.black : DN.white, { m: 'plain', r: 0.05 })),
    ...Array.from({ length: 8 }, (_, i) => B(8.4 + i * 6.75, 19.6, 27.3, 6.75, 4, 0.6, (i + 1) % 2 ? DN.black : DN.white, { m: 'plain', r: 0.05 })),
  ]),

  // a chrome tube chair: red vinyl seat and back, both piped in white, a chrome band across the back
  piece('dnrchair', 'Chrome diner chair', 1, 1, 280, 'gloss', [
    ...[6, 26].flatMap(x => [tube([x, 0, 10], [x, 15, 9]), tube([x, 0, -10], [x + (x < 16 ? 0.5 : -0.5), 40, -11]), tube([x, 4, 9.6], [x, 4, -9.8], 0.6)]),
    B(16, 14.6, 0, 22, 1, 19, DN.chromeD, { m: 'metal', r: 0.4 }),
    B(16, 17.2, 0, 24.8, 4.2, 21.8, DN.white, { m: 'plain', r: 1.8 }),
    B(16, 17.4, 0.2, 24, 3.6, 21, DN.red, { r: 1.5 }),
    B(16, 32, -11.2, 22.8, 12.8, 2.6, DN.white, { m: 'plain', r: 1.8 }),
    B(16, 32, -11, 22, 12, 3.4, DN.red, { r: 1.5 }),
    B(16, 32, -9.1, 23, 1.2, 0.6, DN.chrome, { m: 'metal', r: 0.3 }),
  ]),

  // a chrome counter stool: a round base, a column and footring, a red vinyl seat piped top and bottom
  piece('dnrstool', 'Chrome counter stool', 1, 1, 220, 'gloss', [
    C(16, 0.8, 0, 9, 1.6, DN.chrome, M),
    LA(16, 1.6, 0, [[2.6, 0], [1.6, 2], [1.4, 19], [2.2, 20.4], [4, 20.4]], DN.chrome, { m: 'metal', seg: 12 }),
    RG(16, 8, 0, 7, 0.6, DN.chrome, { flat: true, m: 'metal' }),
    tube([9, 8, 0], [23, 8, 0], 0.5), tube([16, 8, -7], [16, 8, 7], 0.5),
    C(16, 24, 0, 11, 4, DN.red, { seg: 20 }),
    RG(16, 26, 0, 11, 0.5, DN.white, { flat: true, m: 'plain' }),
    RG(16, 22, 0, 11, 0.5, DN.white, { flat: true, m: 'plain' }),
    C(16, 21.4, 0, 10, 0.8, DN.chrome, M),
  ]),

  // a red vinyl booth for two: a channel-tufted back with a rolled top, white piping, chrome-edged ends and kick strip
  piece('dnrbooth', 'Red vinyl booth', 2, 1, 1100, 'gloss', [
    B(32, 6, 3, 58, 10, 22, DN.redD, { r: 1 }),
    B(32, 1.4, 14.4, 58, 2.8, 0.8, DN.chrome, { m: 'metal', r: 0.3 }),
    B(32, 13.5, 4, 58, 5, 22, DN.red, { r: 2 }),
    RD([3, 16, 15], [61, 16, 15], 0.5, DN.white, PL), RD([3, 11, 15], [61, 11, 15], 0.5, DN.white, PL),
    B(32, 30, -11, 58, 30, 9, DN.red, { r: 2 }),
    ...[12, 22, 32, 42, 52].map(x => B(x, 30, -6.4, 0.6, 24, 0.4, DN.redD, { m: 'plain', r: 0.1 })),
    RD([3, 45, -11], [61, 45, -11], 3.2, DN.red),
    RD([3, 47.6, -8.4], [61, 47.6, -8.4], 0.5, DN.white, PL),
    ...[1.6, 62.4].flatMap(x => [
      SL(x, 0, 0, 3.2, [[-15.5, 0], [15.5, 0], [15.5, 19], [-4, 19], [-7, 48], [-15.5, 48]], DN.red),
      tube([x, 0.5, 15.6], [x, 19, 15.6], 0.6), tube([x, 19, 15.6], [x, 19, -4], 0.6),
    ]),
  ]),

  // a pedestal table: mint formica in a ribbed chrome edge, a napkin dispenser, a Poké Ball ketchup bottle and mustard
  piece('dnrtable', 'Chrome-edge diner table', 1, 1, 420, 'gloss', [
    C(16, 0.8, 0, 10, 1.6, DN.chrome, M),
    LA(16, 1.6, 0, [[2.6, 0], [1.8, 2], [1.8, 21], [3, 23]], DN.chrome, { m: 'metal', seg: 12 }),
    B(16, 25, 0, 30.6, 1.8, 28.6, DN.chrome, { m: 'metal', r: 0.4 }),
    B(16, 26.2, 0, 30, 1.2, 28, DN.formica, { r: 0.4 }),
    B(10, 29.6, -4, 5, 5.6, 4, DN.chrome, { m: 'metal', r: 0.6 }), B(10, 32.6, -4, 3.4, 1.2, 0.6, DN.white, { m: 'plain', r: 0.1 }),
    C(19, 30.4, -3, 1.5, 7, DN.red, { seg: 12 }), C(19, 34.3, -3, 1.55, 0.8, DN.white, { seg: 12, m: 'plain' }),
    S(19, 35, -3, 1.5, 1.4, 1.5, DN.red, { seg: 10 }), DS(19, 34.6, -1.5, 0.5, 0.3, DN.white, PL),
    C(22.5, 30.4, -1, 1.4, 7, DN.yellow, { seg: 12 }), LA(22.5, 33.9, -1, [[1.2, 0], [0.4, 2], [0.2, 2.6]], DN.yellow, { seg: 8 }),
    ...[[13.5, DN.white], [15.6, DN.black]].flatMap(([x, c]) => [C(x, 28.7, 3, 0.9, 3.2, c, { seg: 10, m: 'plain' }), S(x, 30.5, 3, 0.9, 0.7, 0.9, DN.chrome, { m: 'metal', seg: 8 })]),
  ]),

  // a formica desk: a red drawer pedestal with chrome pulls, chrome tube legs, a stack of menus, an order pad and a bell
  piece('dnrdesk', 'Formica order desk', 2, 1, 850, 'gloss', [
    B(32, 28, 0, 64, 2, 30, DN.chrome, { m: 'metal', r: 0.4 }),
    B(32, 29.4, 0, 63.4, 1.2, 29.4, DN.formica, { r: 0.4 }),
    B(10, 14, 0, 18, 26, 26, DN.red, { r: 1 }),
    ...[5.5, 13.5, 21.5].flatMap(h => [B(10, h, 13.4, 15, 6.6, 0.8, DN.cream, { r: 0.6 }), pull(10, h, 14.2)]),
    ...[-12, 12].map(z => tube([60, 0, z], [60, 27, z])),
    tube([60, 4, -12], [60, 4, 12], 0.6),
    B(40, 24.6, 0, 38, 4.4, 26, DN.cream, { r: 0.6 }), pull(40, 24.6, 13.4),
    B(38, 15, -12.5, 42, 18, 1.2, DN.creamD, { r: 0.4 }),
    B(22, 30.6, 2, 10, 1.2, 14, DN.red, { r: 0.3 }), B(22, 31.6, 2, 9.4, 0.8, 13, DN.cream, { r: 0.2, m: 'plain' }),
    B(34, 30.2, 5, 6, 0.4, 8, DN.white, { m: 'plain', r: 0.05 }), RD([37, 30.6, 3], [38.5, 30.6, 9], 0.3, DN.yellow, PL),
    LA(48, 30, 3, [[3, 0], [3, 0.6], [2.6, 1.6], [1.6, 2.8], [0.6, 3.4], [0, 3.5]], DN.chrome, { m: 'metal', seg: 12 }), C(48, 34, 3, 0.4, 1, DN.black),
  ]),

  // a cream enamel wardrobe: rounded like a fridge, a red stripe under the crown, two doors with chrome levers
  piece('dnrwardrobe', 'Cream enamel wardrobe', 2, 1, 1200, 'gloss', [
    B(32, 2.5, 0, 58, 5, 27, DN.black, { r: 1 }),
    B(32, 4, 13.6, 58, 1.4, 0.6, DN.chrome, { m: 'metal', r: 0.3 }),
    B(32, 45, -1.5, 60, 80, 26, DN.cream, { r: 3 }),
    B(32, 86, -1, 62, 4, 28, DN.cream, { r: 2 }),
    B(32, 80, 12.4, 60, 3, 0.8, DN.red, { r: 0.4 }),
    B(32, 77.8, 12.4, 60, 0.8, 0.8, DN.chrome, { m: 'metal', r: 0.3 }),
    B(32, 8.5, 12.4, 56, 6, 0.8, DN.creamD, { r: 0.6 }), pull(20, 8.5, 13.2), pull(44, 8.5, 13.2),
  ], {
    doors: [3, 61].map((hx, i) => {
      const x = i ? 46.6 : 17.4, hand = i ? 34.4 : 29.6;
      return { hinge: [hx, 12], side: i ? -1 : 1, parts: [
        B(x, 43, 12.75, 28.4, 62, 1.5, DN.cream, { r: 1.5 }),
        B(x, 66, 13.6, 22, 2, 0.4, DN.red, { r: 0.4 }),
        B(x, 20, 13.6, 22, 2, 0.4, DN.red, { r: 0.4 }),
        RD([hand, 40, 14.4], [hand, 50, 14.4], 0.6, DN.chrome, M),
        DS(hand, 38, 13.8, 1, 0.4, DN.chrome, M),
      ] };
    }),
    inside: { x: 32, h: 43, w: 52, hh: 58, z: 12 },
  }),

  // a two-tone dresser: mint, cream drawer fronts with chrome bars, on chrome feet, a round mirror on a chrome stem
  piece('dnrdresser', 'Two-tone chrome dresser', 2, 1, 900, 'gloss', [
    ...[[5, -10], [59, -10], [5, 10], [59, 10]].map(([x, z]) => LA(x, 0, z, [[0.6, 0], [1.2, 6]], DN.chrome, { m: 'metal', seg: 8 })),
    B(32, 19, 0, 60, 26, 24, DN.mint, { r: 1.6 }),
    ...[17.5, 46.5].flatMap(x => [10.2, 18.4, 26.6].flatMap(h => [B(x, h, 12.4, 26, 7, 0.8, DN.cream, { r: 0.6 }), pull(x, h, 13.2)])),
    B(32, 31.8, 0, 62.4, 0.8, 26.4, DN.chrome, { m: 'metal', r: 0.3 }),
    B(32, 32.9, 0, 62, 1.4, 26, DN.cream, { r: 0.6 }),
    tube([32, 33.6, -8], [32, 39, -8], 0.8),
    DS(32, 50, -8, 12, 1.4, DN.chrome, M),
    DS(32, 50, -7.1, 10.6, 0.4, DN.mirror),
    LA(16, 33.6, 2, [[2, 0], [2.4, 2], [1, 4.4], [0.6, 5], [1, 6]], DN.shake, { seg: 10 }), S(16, 40.2, 2, 1, 1, 1, DN.chrome, { m: 'metal', seg: 6 }),
    B(48, 34.8, 2, 8, 2.4, 6, DN.red, { r: 0.6 }),
  ]),

  // an open chrome shelf on a red back: plates and cups, soda glasses, syrup pumps, sundae dishes, a Poké Ball cookie jar
  piece('dnrshelf', 'Soda-glass shelf', 1, 1, 520, 'gloss', [
    ...[[3, -10], [29, -10], [3, 10], [29, 10]].flatMap(([x, z]) => [tube([x, 0, z], [x, 72, z], 0.8), S(x, 73, z, 1.2, 1.2, 1.2, DN.chrome, { m: 'metal', seg: 6 })]),
    B(16, 38, -10.6, 26, 70, 0.8, DN.red, { r: 0.4 }),
    ...[4, 22, 40, 58].map(h => B(16, h, 0, 30, 1.2, 22, DN.formica, { r: 0.4 })),
    ...[0, 1, 2, 3].map(i => C(9, 5.4 + i * 0.8, 0, 5, 0.6, DN.white, { seg: 16 })),
    ...[21, 23.6].flatMap(x => [C(x, 6.4, 1, 2, 3, DN.white, { seg: 10 }), C(x, 9.4, 1, 2, 3, DN.white, { seg: 10 })]),
    ...[[8, DN.shake], [16, DN.cherry], [24, DN.choc]].flatMap(([x, c]) => [
      C(x, 26, 1, 1.6, 4.4, c, { rb: 1, seg: 10 }),
      LA(x, 22.6, 1, [[1.2, 0], [1.2, 0.4], [0.4, 1], [0.4, 2], [1.4, 3], [2.2, 8]], DN.white, { m: 'glass', seg: 10 }),
    ]),
    ...[[8, DN.cherry], [16, DN.choc], [24, DN.lemon]].flatMap(([x, c]) => [
      C(x, 45, 0, 2.2, 8, c, { seg: 10 }),
      C(x, 49.6, 0, 1.4, 1.2, DN.chrome, { m: 'metal', seg: 8 }), RD([x, 50, 0], [x, 53, 0], 0.4, DN.chrome, M), RD([x, 53, 0], [x, 53, 2.6], 0.4, DN.chrome, M),
    ]),
    ...[9, 15].map(x => LA(x, 59.2, 1, [[1, 0], [1, 0.4], [3, 1.2], [3.6, 3]], DN.white, { m: 'glass', seg: 10 })),
    S(24, 63.2, 0, 4, 4, 4, DN.white, { seg: 12 }),
    LA(24, 63.2, 0, [[4.05, 0], [3.6, 1.8], [2.4, 3.4], [0, 4.1]], DN.red, { seg: 12 }),
    C(24, 63.2, 0, 4.15, 0.6, DN.black, { seg: 12, m: 'plain' }), DS(24, 63.2, 4, 1, 0.4, DN.white, PL),
  ]),

  // a cone floor lamp: a chrome pole with a little atomic star, a cream fibreglass cone banded in red
  piece('dnrlamp', 'Atomic cone lamp', 1, 1, 380, 'gloss', [
    C(16, 1, 0, 8, 2, DN.chrome, M),
    tube([16, 2, 0], [16, 62, 0], 0.8),
    S(16, 34, 0, 1.6, 1.6, 1.6, DN.red, { seg: 8 }),
    ...[0, 60, 120].flatMap(deg => {
      const a = deg * Math.PI / 180, dx = Math.cos(a) * 5, dh = Math.sin(a) * 5;
      return [RD([16 - dx, 34 - dh, 0], [16 + dx, 34 + dh, 0], 0.35, DN.chrome, M), S(16 + dx, 34 + dh, 0, 0.9, 0.9, 0.9, DN.chrome, { m: 'metal', seg: 6 }), S(16 - dx, 34 - dh, 0, 0.9, 0.9, 0.9, DN.chrome, { m: 'metal', seg: 6 })];
    }),
    S(16, 63, 0, 2.2, 2, 2.2, DN.warm, { m: 'glow', seg: 8 }),
    LA(16, 60, 0, [[10.5, 0], [9.6, 2.4], [6, 9], [2.6, 13.4], [0, 14]], DN.warm, { m: 'glow', seg: 16 }),
    C(16, 60.5, 0, 10.4, 1.2, DN.red, { rb: 10.6, seg: 16 }),
    S(16, 74.6, 0, 1, 1.4, 1, DN.chrome, { m: 'metal', seg: 8 }),
  ], { glow: [DN.warm] }),

  // a starburst wall clock: chrome rays tipped with red balls, a cream face with atomic dots
  wallPiece('dnrclock', 'Starburst wall clock', 1, 420, 'metal', [
    ...Array.from({ length: 12 }, (_, i) => {
      const a = i / 12 * TAU, long = i % 2 === 0, r = long ? 14.5 : 10.5, ex = 16 + Math.cos(a) * r, eh = 60 + Math.sin(a) * r;
      return [RD([16, 60, 1], [ex, eh, 1], long ? 0.5 : 0.4, DN.chrome, M), ...(long ? [S(ex, eh, 1, 1.2, 1.2, 1.2, DN.red, { seg: 8 })] : [])];
    }).flat(),
    DS(16, 60, 1.6, 8, 1.2, DN.chrome, M),
    DS(16, 60, 2.2, 7, 0.4, DN.cream, PL),
    PC(16, 60, 2.5, 9.6, 9.6, atomicDial),
  ]),

  // a three-panel screen: chrome frames, black-and-white checker panels, a red vinyl band along each top
  piece('dnrscreen', 'Checker-panel screen', 2, 1, 600, 'metal', [
    ...[[11, 4], [32, -4], [53, 4]].flatMap(([x, z]) => [
      ...[-8.5, 8.5].map(dx => LA(x + dx, 0, z, [[1.6, 0], [1.6, 0.8], [0.9, 1.6], [0.9, 4]], DN.chrome, { m: 'metal', seg: 8 })),
      B(x, 35, z, 20.4, 62, 1.6, DN.chrome, { m: 'metal', r: 1.6 }),
      PC(x, 33, z + 0.95, 17, 48, checker(4)),
      B(x, 61.5, z + 0.9, 17.4, 5, 0.8, DN.red, { r: 1 }),
      B(x, 64.2, z + 1.35, 17.4, 0.5, 0.2, DN.white, { m: 'plain', r: 0.1 }),
    ]),
    ...[21.5, 42.5].flatMap(x => [16, 54].map(h => B(x, h, 0, 1, 3, 8.4, DN.chrome, { m: 'metal', r: 0.3 }))),
  ]),

  // a full-length mirror in a chrome frame piped red, pivoting between chrome uprights on a red vinyl plinth
  piece('dnrmirror', 'Chrome dressing mirror', 1, 1, 360, 'metal', [
    B(16, 2, 0, 28, 4, 18, DN.red, { m: 'gloss', r: 1.2 }),
    B(16, 4.2, 0, 28.4, 0.6, 18.4, DN.chrome, { r: 0.3 }),
    ...[3.5, 28.5].flatMap(x => [tube([x, 4, 0], [x, 46, 0]), S(x, 46.6, 0, 1.2, 1.2, 1.2, DN.chrome, { m: 'metal', seg: 8 }), S(x, 40, 0, 1.4, 1.4, 1.4, DN.chrome, { m: 'metal', seg: 8 })]),
    tube([5, 40, 0], [6, 40, 0], 0.5), tube([26, 40, 0], [27, 40, 0], 0.5),
    B(16, 40, -0.2, 21, 64, 1.4, DN.red, { m: 'gloss', r: 4.4 }),
    B(16, 40, 0.2, 20, 62, 2, DN.chrome, { r: 4 }),
    B(16, 40, 1.3, 17, 58, 0.4, DN.mirror, { m: 'gloss', r: 3 }),
  ]),

  // a bubbler jukebox: a red cabinet under a neon arch, lit bubble tubes up its corners, a chrome grille, the record behind glass
  piece('dnrjukebox', 'Bubbler jukebox', 1, 1, 1800, 'gloss', [
    B(16, 2, 0, 28, 4, 20, DN.chromeD, { m: 'metal', r: 0.6 }),
    B(16, 23, -0.5, 26, 38, 19, DN.red, { r: 1 }),
    PR(16, 42, -0.5, arch(13), 19, DN.red),
    PR(16, 42, 9.4, band(12.6, 10.4), 1.2, DN.pink, GW),
    PR(16, 42, 9.6, band(9.8, 8.8), 1.2, DN.neonMint, GW),
    PR(16, 42, 9.2, arch(8.6), 0.4, DN.black, PL),
    DS(16, 45, 9.6, 5, 0.4, DN.black, { m: 'gloss' }), DS(16, 45, 9.9, 1.6, 0.3, DN.red, PL),
    PR(16, 42, 10.2, arch(8.6), 0.3, DN.white, GL),
    B(16, 40.6, 9.6, 24, 2.4, 1, DN.chrome, { m: 'metal', r: 0.4 }),
    B(16, 33, 9.4, 20, 8, 0.8, DN.chrome, { m: 'metal', r: 0.6 }),
    PC(16, 33, 9.9, 18, 6.4, titleStrips),
    B(16, 16.5, 9.4, 18, 13, 0.8, DN.chrome, { m: 'metal', r: 0.6 }),
    ...[11.5, 14, 16.5, 19, 21.5].map(h => B(16, h, 9.9, 16, 0.8, 0.4, DN.chromeD, { m: 'metal', r: 0.2 })),
    ...[3.4, 28.6].flatMap(x => [C(x, 23, 8.4, 1.7, 34, DN.amber, { m: 'glow', seg: 10 }), C(x, 5.6, 8.4, 2, 1.4, DN.chrome, { m: 'metal', seg: 10 }), C(x, 40.4, 8.4, 2, 1.4, DN.chrome, { m: 'metal', seg: 10 })]),
  ], { glow: [DN.pink, DN.amber, DN.neonMint] }),

  // a neon DINER sign: pink tube letters and a mint arrow on a black board in a chrome edge
  wallPiece('dnrneon', 'Neon DINER sign', 2, 900, 'gloss', [
    B(32, 63, 0.6, 60, 26, 1.2, DN.chrome, { m: 'metal', r: 2.4 }),
    B(32, 63, 0.9, 58, 24, 1.4, DN.black, { r: 2 }),
    ...['D', 'I', 'N', 'E', 'R'].flatMap((l, i) => neon(LETTERS[l](10 + i * 11), 2.4, DN.pink)),
    ...neon([[[8, 54], [54, 54]], [[54, 54], [51, 56]], [[54, 54], [51, 52]]], 2.4, DN.neonMint),
  ], { glow: [DN.pink, DN.neonMint] }),

  // a menu board: press-in letters on black felt, a burger, a shake and pie, under a red MENU header
  wallPiece('dnrmenu', 'Diner menu board', 2, 520, 'metal', [
    B(32, 60, 0.6, 56, 30, 1.2, DN.chrome, { r: 0.8 }),
    PC(32, 60, 1.3, 52, 26, menuBoard),
    B(32, 79, 1, 30, 8, 1.8, DN.red, { m: 'gloss', r: 1.2 }),
    PC(32, 79, 1.95, 26, 5.6, word('MENU')),
  ]),

  // a soda fountain counter: cream and red with chrome bands, mint formica, three swan-neck taps, a cherry pie under a dome
  piece('dnrcounter', 'Soda fountain counter', 2, 1, 1600, 'gloss', [
    B(32, 1.5, 0, 60, 3, 25, DN.black, { r: 0.6 }),
    B(32, 17, 0, 62, 28, 26, DN.cream, { r: 1 }),
    B(32, 9, 13.2, 62.4, 10, 0.8, DN.red, { r: 0.4 }),
    ...[3.6, 14.4, 26].map(h => B(32, h, 13.6, 62.4, 1.2, 0.6, DN.chrome, { m: 'metal', r: 0.3 })),
    B(32, 32, 1, 64, 2.2, 29, DN.chrome, { m: 'metal', r: 0.4 }),
    B(32, 33.6, 1, 63.4, 1.2, 28.4, DN.formica, { r: 0.4 }),
    B(18, 39, -8, 16, 9.6, 6, DN.chrome, { m: 'metal', r: 1 }),
    ...[13, 18, 23].flatMap((x, i) => [
      RD([x, 41, -5], [x, 43, -2.6], 0.6, DN.chrome, M), RD([x, 43, -2.6], [x, 40, -1], 0.6, DN.chrome, M),
      S(x, 45.2, -7, 0.9, 1.2, 0.9, [DN.red, DN.black, DN.mint][i], { seg: 8 }), RD([x, 43.8, -7], [x, 44.4, -7], 0.4, DN.chrome, M),
    ]),
    LA(46, 34.2, -1, [[3, 0], [1, 1], [0.8, 4.6], [1.4, 5.6]], DN.chrome, { m: 'metal', seg: 10 }),
    C(46, 40.1, -1, 8, 0.6, DN.chrome, M),
    ...pie(46, 40.4, -1, 7, DN.cherry),
    LA(46, 40.4, -1, [[8.2, 0], [8.2, 5.6], [7, 8.4], [4, 10.4], [0, 11.2]], DN.white, { m: 'glass', seg: 14 }),
    S(46, 51.8, -1, 1, 1, 1, DN.chrome, { m: 'metal', seg: 8 }),
    LA(30, 34.2, 4, [[1.2, 0], [0.5, 1], [0.5, 2.2], [1.8, 3.4], [2.6, 9]], DN.white, { m: 'glass', seg: 10 }),
    C(30, 39.6, 4, 2.3, 5.8, DN.shake, { rb: 1.7, seg: 10 }),
    RD([30.5, 40, 4], [32.5, 46, 3], 0.35, DN.red, PL),
  ]),

  // a malt mixer on a red cabinet: a mint three-spindle mixer, steel cups on two spindles, a shake ready
  piece('dnrmalt', 'Triple malt mixer', 1, 1, 650, 'gloss', [
    B(16, 1, 0, 26, 2, 20, DN.black, { r: 0.4 }),
    B(16, 13.5, 0, 28, 23, 22, DN.red, { r: 1 }),
    B(16, 13.5, 11.2, 22, 17, 0.6, DN.cream, { r: 0.8 }), pull(16, 19, 11.8, 5),
    B(16, 26, 0, 30, 2, 24, DN.chrome, { m: 'metal', r: 0.4 }),
    B(16, 28.4, -1, 24, 2.8, 12, DN.mint, { r: 1 }),
    B(16, 40, -5, 5, 20, 4, DN.mint, { r: 2 }),
    B(16, 51.5, 0, 24, 5, 12, DN.mint, { r: 2.2 }),
    B(16, 54.2, 0, 22, 0.6, 10, DN.chrome, { m: 'metal', r: 0.3 }),
    ...[8, 16, 24].map(x => RD([x, 49, 2], [x, 37, 2], 0.35, DN.chrome, M)),
    ...[8, 24].map(x => LA(x, 29.8, 2, [[2.2, 0], [3.2, 10]], DN.chrome, { m: 'metal', seg: 12 })),
    LA(16, 29.8, 4.5, [[1, 0], [0.4, 1], [0.4, 2], [1.6, 3], [2.4, 8]], DN.white, { m: 'glass', seg: 10 }),
    C(16, 34.6, 4.5, 2.1, 5, DN.shake, { rb: 1.5, seg: 10 }), S(16, 38.2, 4.5, 2, 1.2, 2, DN.white, { m: 'cloth', seg: 8 }),
  ]),

  // a coffee station: a chrome brewer on a cream cabinet, two glass pots on warmers (one with the orange decaf handle)
  piece('dnrcoffee', 'Diner coffee station', 1, 1, 600, 'gloss', [
    B(16, 1, 0, 26, 2, 20, DN.black, { r: 0.4 }),
    B(16, 13.5, 0, 28, 23, 22, DN.cream, { r: 1 }),
    B(16, 8, 11.2, 28.4, 1.2, 0.6, DN.chrome, { m: 'metal', r: 0.3 }), B(16, 17, 11.2, 22, 12, 0.6, DN.mint, { r: 0.8 }), pull(16, 20, 11.8, 5),
    B(16, 26, 0, 30, 2, 24, DN.chrome, { m: 'metal', r: 0.4 }),
    B(16, 40, -6.5, 26, 26, 8, DN.chrome, { m: 'metal', r: 1 }),
    B(16, 50, -1, 26, 6, 18, DN.chrome, { m: 'metal', r: 1.2 }),
    B(16, 53.4, -1, 24, 0.8, 16, DN.black, { r: 0.4 }),
    B(16, 50, 8.2, 10, 2.4, 0.4, DN.red, { m: 'plain', r: 0.3 }),
    B(16, 45.8, 2, 9, 2.6, 7, DN.black, { r: 0.6 }),
    ...[[9, DN.black, 4.6], [23, DN.orange, 2.4]].flatMap(([x, c, fill]) => [
      C(x, 27.4, 1, 4.4, 0.8, DN.black, { seg: 12 }),
      C(x, 27.8 + fill / 2, 1, 3.6, fill, DN.coffee, { seg: 12 }),
      LA(x, 27.8, 1, [[3, 0], [4, 1.6], [4, 5.4], [2.6, 8.4], [2.6, 9.4]], DN.white, { m: 'glass', seg: 12 }),
      C(x, 37.6, 1, 2.8, 1, c, { seg: 12 }),
      RD([x + (x < 16 ? -3.8 : 3.8), 30, 1], [x + (x < 16 ? -5 : 5), 35, 1], 0.7, c),
    ]),
  ]),

  // a revolving pie case: a red drum, chrome-ringed glass, three shelves of pies, a lit crown
  piece('dnrpiecase', 'Revolving pie case', 1, 1, 1100, 'gloss', [
    C(16, 1, 0, 12.6, 2, DN.chrome, M),
    C(16, 10, 0, 12, 16, DN.red, { seg: 20 }),
    C(16, 18.6, 0, 12.6, 1.2, DN.chrome, M),
    ...[19.6, 32, 44.4].map(h => C(16, h, 0, 11.4, 0.8, DN.chrome, { m: 'metal', seg: 20 })),
    ...pie(11, 20, 3, 4.4, DN.cherry), ...pie(21, 20, 3, 4.4, DN.blue), ...pie(16, 20, -5, 4.4, DN.cherry),
    ...pie(11, 32.4, 3, 4.4, DN.lemon, DN.white), ...pie(21, 32.4, 3, 4.4, DN.choc, DN.white), ...pie(16, 32.4, -5, 4.4, DN.lemon, DN.white),
    ...pie(11, 44.8, 3, 4.4, DN.cherry), ...pie(21, 44.8, 3, 4.4, DN.choc, DN.white), ...pie(16, 44.8, -5, 4.4, DN.blue),
    C(16, 38, 0, 12, 38, DN.white, { m: 'glass', seg: 20 }),
    C(16, 57.4, 0, 12.4, 1.6, DN.warm, { m: 'glow', seg: 20 }),
    C(16, 60, 0, 12.6, 3.6, DN.red, { seg: 20 }),
    LA(16, 61.8, 0, [[12, 0], [9, 2.6], [3, 4], [0, 4.2]], DN.chrome, { m: 'metal', seg: 20 }),
    S(16, 66.6, 0, 1.4, 1.4, 1.4, DN.red, { seg: 8 }),
  ], { glow: [DN.warm] }),

  // a malt shop fridge: mint and rounded, a chrome lever handle and nameplate, a Poké Ball magnet, a kick grille
  piece('dnrfridge', 'Malt shop fridge', 1, 1, 1000, 'gloss', [
    B(16, 1.5, 0, 24, 3, 20, DN.chromeD, { m: 'metal', r: 0.6 }),
    B(16, 38, -1.5, 28, 70, 23, DN.mint, { r: 4 }),
    B(16, 5.6, 10.4, 22, 3, 0.6, DN.chrome, { m: 'metal', r: 0.4 }),
    ...[4.6, 6.6].map(h => B(16, h, 10.8, 20, 0.4, 0.3, DN.black, { m: 'plain', r: 0.1 })),
  ], {
    doors: [{ hinge: [2.5, 10.5], side: 1, parts: [
      B(16, 40, 11.3, 27.4, 62, 1.6, DN.mint, { r: 3.6 }),
      B(16, 63, 12.3, 9, 2.2, 0.4, DN.chrome, { m: 'metal', r: 0.4 }),
      B(16, 60.8, 12.3, 27.4, 0.6, 0.4, DN.chrome, { m: 'metal', r: 0.2 }),
      RD([26, 42, 13.6], [26, 54, 13.6], 0.8, DN.chrome, M),
      ...[42, 54].map(h => RD([26, h, 12], [26, h, 13.6], 0.6, DN.chrome, M)),
      DS(9, 50, 12.3, 1.8, 0.4, DN.white, PL), DS(9, 50.8, 12.55, 1.8, 0.2, DN.red, { m: 'plain', ry: 1 }),
      B(9, 50, 12.6, 3.6, 0.3, 0.2, DN.black, { m: 'plain', r: 0.05 }), DS(9, 50, 12.75, 0.6, 0.3, DN.white, PL),
    ] }],
    inside: { x: 16, h: 40, w: 24, hh: 58, z: 10.4 },
  }),

  // an ornate chrome cash register on a red stand: rows of keys, a crank, the sale flag up in its window
  piece('dnrregister', 'Chrome cash register', 1, 1, 600, 'gloss', [
    B(16, 1, 0, 24, 2, 18, DN.black, { r: 0.4 }),
    B(16, 12, 0, 26, 20, 20, DN.red, { r: 1 }),
    B(16, 12, 10.2, 20, 14, 0.6, DN.cream, { r: 0.8 }),
    B(16, 23, 0, 28, 2, 22, DN.chrome, { m: 'metal', r: 0.4 }),
    B(16, 25.6, 3, 22, 3.2, 14, DN.chromeD, { m: 'metal', r: 0.6 }), pull(16, 25.6, 10.3, 4),
    SL(16, 27.2, 0, 22, [[-8, 0], [9, 0], [9, 3], [3, 11], [-8, 13]], DN.chrome, M),
    ...[[32.4, 7.6], [35.3, 5.4], [38.2, 3.2]].flatMap(([h, z], row) => [0, 1, 2, 3, 4].map(i => S(8 + i * 4, h, z, 1, 0.8, 1, (i + row) % 3 ? DN.cream : DN.red, { seg: 6 }))),
    B(16, 45, -5, 16, 9, 3, DN.chrome, { m: 'metal', r: 1 }),
    PC(16, 45, -3.4, 12, 4.4, word('25¢', DN.black, '#fff8e8')),
    PR(16, 49.4, -5, [[-8, 0], [8, 0], [4, 2.4], [0, 3.4], [-4, 2.4]], 3, DN.chrome, M),
    RD([27.4, 33, 0], [30, 33, 0], 0.6, DN.chrome, M), RD([30, 33, 0], [30, 29, 2.6], 0.5, DN.chrome, M), S(30, 28.6, 3.2, 0.9, 0.9, 0.9, DN.black, { seg: 6 }),
  ]),

  // a Snorlax-size milkshake: a tall fluted glass of strawberry shake, whipped cream, a cherry, a striped straw, on a
  // Snorlax-blue stand with its cream belly
  piece('dnrshake', 'Snorlax-size milkshake', 1, 1, 750, 'gloss', [
    C(16, 2, 0, 13, 4, DN.snorlax, { seg: 20 }),
    DS(16, 2, 12.6, 6, 0.6, DN.cream, { ry: 1.6, m: 'plain' }),
    LA(16, 4, 0, [[6, 0], [6, 1], [2, 3], [1.6, 10], [4, 13], [9, 24], [11, 40], [11.4, 44]], DN.white, { m: 'glass', seg: 16 }),
    LA(16, 4, 0, [[0, 10.6], [1.4, 10.6], [3.6, 13.4], [8.4, 24], [10.4, 40], [10.6, 42], [0, 42]], DN.shake, { seg: 16 }),
    S(16, 47, 0, 10.6, 4.8, 10.6, DN.white, { m: 'cloth', seg: 14 }),
    S(16, 51.6, 0, 7.4, 4.2, 7.4, DN.white, { m: 'cloth', seg: 12 }),
    S(16, 55.6, 0, 4.4, 3.6, 4.4, DN.white, { m: 'cloth', seg: 10 }),
    S(16, 61, 0, 2.6, 2.6, 2.6, DN.cherry, { seg: 10 }), RD([16, 63, 0], [18, 67, -1], 0.3, '#3a6a2a', PL),
    ...[0, 1, 2, 3].map(i => RD([20 + i * 1.6, 44 + i * 5.5, -3 - i * 0.4], [21.6 + i * 1.6, 49.5 + i * 5.5, -3.4 - i * 0.4], 1.3, i % 2 ? DN.red : DN.white)),
  ]),

  // a chrome gumball machine: a pedestal, a red coin box, a glass globe of gumballs, a red cap
  piece('dnrgumball', 'Chrome gumball machine', 1, 1, 350, 'gloss', [
    LA(16, 0, 0, [[7, 0], [7, 1], [2.4, 3], [1.6, 25], [3.4, 27]], DN.chrome, { m: 'metal', seg: 12 }),
    C(16, 30.5, 0, 6, 7, DN.red, { seg: 16 }),
    DS(16, 31.4, 6, 2.4, 0.8, DN.chrome, M), B(16, 31.4, 6.6, 3.6, 0.8, 0.6, DN.chromeD, { m: 'metal', r: 0.3 }),
    B(16, 28, 5.6, 3, 2, 1.6, DN.chrome, { m: 'metal', r: 0.5 }),
    C(16, 34.6, 0, 5, 1.2, DN.chrome, { m: 'metal', seg: 16 }),
    ...[[13, 38, 2, DN.red], [18, 38, 3, DN.yellow], [15, 38.4, -3, DN.blue], [20, 39, -1, DN.white], [12, 41.6, -1, DN.mint],
      [16, 40.6, 4, DN.pink], [19.6, 42.4, 2, DN.orange], [14, 44.6, 2.6, DN.yellow], [17.6, 45.4, -2, DN.red], [11.6, 45, 1, DN.blue], [16, 48, 0, DN.white]]
      .map(([x, h, z, c]) => S(x, h, z, 1.9, 1.9, 1.9, c, { seg: 6, m: 'plain' })),
    S(16, 43, 0, 7.6, 7.6, 7.6, DN.white, { m: 'glass', seg: 14 }),
    C(16, 50.6, 0, 4, 2, DN.red, { seg: 12 }), S(16, 52.4, 0, 1.4, 1.2, 1.4, DN.red, { seg: 8 }),
  ]),

  // a checker-floor rug: black and white squares in a red border piped white
  { id: 'dnrrug', name: 'Checker-floor rug', group: GROUP, solo: true, w: 3, h: 2, layer: 'rug', price: 650, high: 0.04, side: 'c', flat(w, h) {
    const g = ctx();
    g.fillStyle = DN.red; g.fillRect(0, 0, w, h);
    g.fillStyle = DN.white; g.fillRect(2.6, 2.6, w - 5.2, h - 5.2);
    const s = 8, x0 = (w - 11 * s) / 2, y0 = (h - 7 * s) / 2;
    for (let j = 0; j < 7; j++) for (let i = 0; i < 11; i++) { g.fillStyle = (i + j) % 2 ? DN.white : DN.black; g.fillRect(x0 + i * s, y0 + j * s, s, s); }
    g.fillStyle = 'rgba(255,255,255,0.08)'; for (let j = 0; j < 7; j++) for (let i = 0; i < 11; i++) g.fillRect(x0 + i * s + 1, y0 + j * s + 1, s * 0.4, 0.6);
  } },
];
