/* base-furniture-shell.js  -  the Mermaid set (furniture expansion session e, 2026-10-17): a mermaid's room, after
   Animal Crossing's Mermaid series. Pearly white and blush pink with iridescent aqua and a touch of lavender and gold:
   scallop shells, pearls, coral, sea glass and wave scrolls. All solo, fixed colours.
   Built as js/base-furniture-antique.js's set is: an upright piece is a list of parts in painted units (32 a tile), `x`
   across from the left of its front, `h` up from the floor (a wall piece's from the foot of its strip), `z` out to the
   front from its middle (a wall piece's from the wall), painted here from any side, and js/base-models-shell.js builds
   the same list as 3D parts (BUILT). A scallop shell is a flat outline (`prism`) with its ribs as rods; a `prism` can
   lean back by `tilt` (the clam's open lid), a `ring` can be an arc (`arc` from `rot`, a wave's curl). A `pic` part
   (the clock's dial, the screen's sea glass) is painted on the front only, and the model wears that crop. The wardrobe's
   doors swing (`doors`, `inside`). The rug is painted from above. */

import { sh, oval, ovalShade, floorShadow, ctx, hash, glass as glassPane } from './base-paint.js';

export const MR = {
  pearl: '#f6eee8', pearlD: '#e2d2d0', pearlS: '#fffaf6', blush: '#f5c8d0', blushD: '#e2a0b0', rose: '#ec8ea6',
  coral: '#f2867c', coralD: '#d66a64', aqua: '#86d8d2', aquaD: '#52b6b2', aquaL: '#c4f0ea', lav: '#c8b8ea', lavD: '#a08ad0',
  gold: '#e6c46e', goldD: '#b99448', foam: '#e8f8f2', sea: '#a4e2c8', seaB: '#9ccfee', mirror: '#d6eef4', ink: '#5a4660',
  water: '#7cc8e4', sand: '#f0dcb4', glow: '#fff3ea', glowP: '#ffd6e2', string: '#fff2cc',
};
const GROUP = 'Mermaid';
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

const M = { m: 'metal' }, CL = { m: 'cloth' }, PL = { m: 'plain' };
const pearl = (x, h, z, r = 1, c = MR.pearlS) => S(x, h, z, r, r, r, c, { m: 'gloss', seg: 6 });

/** A scallop shell's outline [[x, up]...] from its hinge: rx across, ry up, n lobes along its rim, two ears at the hinge. */
function fanPts(rx, ry, n, spread) {
  const e = Math.min(rx, ry) * 0.2, steps = n * 4;
  const out = [[-e * 0.7, 0], [e * 0.7, 0], [e * 1.8, e * 0.5], [e * 1.8, e * 1.3]];
  for (let i = 0; i <= steps; i++) {
    const a = spread - 2 * spread * i / steps, r = 0.9 + 0.1 * Math.abs(Math.sin(i / 4 * Math.PI));
    out.push([Math.sin(a) * rx * r, Math.cos(a) * ry * r]);
  }
  out.push([-e * 1.8, e * 1.3], [-e * 1.8, e * 0.5]);
  return out;
}
/** A scallop shell standing on its hinge at x, h, z, d thick, its ribs (rib colour) on its face and pearls along its rim
    if asked; `tilt` leans it back. */
function fan(x, h, z, rx, ry, d, c, { n = 7, spread = 1.2, rib = sh(c, -1), rr, pearls, pc = MR.pearlS, tilt = 0, m } = {}) {
  const ct = Math.cos(tilt), st = Math.sin(tilt), at = (px, ph, dz) => [x + px, h + ph * ct + dz * st, z - ph * st + dz * ct];
  rr ??= Math.max(0.35, Math.min(rx, ry) * 0.05);
  const out = [PR(x, h, z, fanPts(rx, ry, n, spread), d, c, { tilt, ...(m ? { m } : {}) })];
  for (let k = 0; k < n; k++) {
    const a = spread - 2 * spread * (4 * k + 2) / (4 * n), sx = Math.sin(a), cy = Math.cos(a), dz = d / 2 + rr * 0.3;
    if (rib) out.push(RD(at(sx * rx * 0.22, cy * ry * 0.22, dz), at(sx * rx * 0.9, cy * ry * 0.9, dz), rr, rib, { m: 'gloss' }));
    if (pearls) { const p = at(sx * rx * 0.97, cy * ry * 0.97, dz); out.push(pearl(p[0], p[1], p[2], pearls, pc)); }
  }
  return out;
}
/** A band w across and hh tall whose top edge rolls in n waves. */
const wavePts = (w, hh, n) => [[-w / 2, 0], [w / 2, 0], ...Array.from({ length: n * 6 + 1 }, (_, i) => {
  const f = i / (n * 6), ph = f * n * TAU;
  return [w / 2 - w * f, hh * (0.55 + 0.45 * Math.sin(ph + Math.sin(ph) * 0.6))];
})];
/** A five-pointed star r round, a point up. */
const starPts = (r) => Array.from({ length: 10 }, (_, i) => { const a = i / 10 * TAU, k = i % 2 ? 0.45 : 1; return [Math.sin(a) * r * k, Math.cos(a) * r * k]; });
/** A wave's curl: an arc from rot round by arc, about x, h on a face at z. */
const curl = (x, h, z, r, tr, c, rot = 0, arc = 4.4) => RG(x, h, z, r, tr, c, { arc, rot, m: 'gloss' });
/** A spiral conch lying along the floor of a shelf: its body, its spire and its pink mouth. */
const conch = (x, h, z, s = 1, c = MR.blush) => [
  S(x, h + 2.4 * s, z, 3.2 * s, 2.4 * s, 2.4 * s, c, { seg: 8 }),
  RD([x - 2.6 * s, h + 2.6 * s, z], [x - 6 * s, h + 3.4 * s, z], 1.2 * s, MR.pearl, { m: 'gloss' }),
  S(x + 2.2 * s, h + 2.2 * s, z + 1.4 * s, 1.4 * s, 1.8 * s, 1 * s, MR.rose, { seg: 6, m: 'plain' }),
];
/** A little sea-glass bottle. */
const bottle = (x, h, z, c, s = 1) => LA(x, h, z, [[1.6 * s, 0], [2 * s, 1.5 * s], [2 * s, 4.5 * s], [0.8 * s, 6 * s], [0.8 * s, 7.6 * s], [1 * s, 8 * s]], c, { seg: 10, m: 'gloss' });
/** A coral branch from a, forking twice towards b. */
function coralTree(a, b, r, c = MR.coral) {
  const m = [a[0] + (b[0] - a[0]) * 0.5, a[1] + (b[1] - a[1]) * 0.5, a[2] + (b[2] - a[2]) * 0.5];
  const off = (p, dx, dh) => [p[0] + dx, p[1] + dh, p[2]];
  return [RD(a, m, r, c), RD(m, b, r * 0.8, c), RD(m, off(m, (b[0] > a[0] ? -1 : 1) * 4, 5), r * 0.7, c), S(b[0], b[1], b[2], r * 0.9, r * 0.9, r * 0.9, c, { seg: 6 })];
}

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
        oval(cx, cy - ut, rt, rt * 0.22, sh(q.c, -2));
        break;
      }
      case 'ring': {
        if (side && !q.flat) { rbx(cx - q.tr, cy - q.r - q.tr, q.tr * 2, (q.r + q.tr) * 2, q.tr, q.c, m); break; }
        const a0 = q.arc ? -(q.rot + q.arc) : 0, a1 = q.arc ? -q.rot : TAU;
        g.lineCap = 'round'; g.strokeStyle = q.c; g.lineWidth = q.tr * 2; g.beginPath();
        if (q.flat) g.ellipse(cx, cy, q.r, q.r * 0.22, 0, 0, TAU); else g.arc(cx, cy, q.r, a0, a1);
        g.stroke();
        g.save(); g.globalAlpha *= 0.45; g.strokeStyle = sh(q.c, 2); g.lineWidth = q.tr * 0.6; g.beginPath();
        if (q.flat) g.ellipse(cx, cy - q.tr * 0.4, q.r, q.r * 0.22, 0, Math.PI, TAU); else g.arc(cx, cy, q.r - q.tr * 0.3, q.arc ? a0 : Math.PI * 1.1, q.arc ? a1 : Math.PI * 1.6);
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
        const ct = Math.cos(q.tilt || 0), st = Math.sin(q.tilt || 0);
        if (side) {
          const hs = q.pts.map(p => p[1]), top = Math.max(...hs), bot = Math.min(...hs);
          const at = (dz, ph) => [U(0, q.z - ph * st + dz * ct), b - q.h - ph * ct - dz * st];
          poly([at(-q.d / 2, bot), at(q.d / 2, bot), at(q.d / 2, top), at(-q.d / 2, top)], q.c, m);
          break;
        }
        poly(q.pts.map(([px, ph]) => [U(q.x + px), b - q.h - ph * ct]), q.c, m);
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

/** The shell clock's dial: a pearl face, gold dots for the hours, a pink shell at twelve, two hands at ten past ten. */
function dial(g, x, y, w, h) {
  const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2;
  const f = g.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r);
  f.addColorStop(0, '#ffffff'); f.addColorStop(0.7, MR.pearlS); f.addColorStop(1, MR.blush);
  g.fillStyle = MR.gold; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill();
  g.fillStyle = f; g.beginPath(); g.arc(cx, cy, r * 0.88, 0, TAU); g.fill();
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * TAU - Math.PI / 2;
    g.fillStyle = i % 3 ? MR.goldD : MR.aquaD;
    g.beginPath(); g.arc(cx + Math.cos(a) * r * 0.7, cy + Math.sin(a) * r * 0.7, r * (i % 3 ? 0.05 : 0.08), 0, TAU); g.fill();
  }
  g.strokeStyle = MR.ink; g.lineCap = 'round';
  for (const [a, len, lw] of [[-150, 0.42, 0.08], [-30, 0.6, 0.05]]) { const t = a * Math.PI / 180; g.lineWidth = r * lw; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(t) * r * len, cy + Math.sin(t) * r * len); g.stroke(); }
  g.fillStyle = MR.gold; g.beginPath(); g.arc(cx, cy, r * 0.07, 0, TAU); g.fill();
}
const GLASS = [MR.aqua, MR.sea, MR.lav, MR.blush, MR.seaB, MR.aquaL];
/** Sea glass set in pearl leading: soft rounded pieces in aqua, sea green, lavender and blush. */
function seaGlass(seed) {
  return (g, x, y, w, h) => {
    g.fillStyle = MR.pearl; g.fillRect(x, y, w, h);
    const cols = 3, rows = 7, cw = w / cols, ch = h / rows;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const c = GLASS[Math.floor(hash(i, j, seed) * GLASS.length)], px = x + i * cw + 0.5, py = y + j * ch + 0.5;
      const l = g.createLinearGradient(px, py, px + cw, py + ch); l.addColorStop(0, sh(c, 1)); l.addColorStop(1, c);
      g.fillStyle = l; g.beginPath(); g.roundRect(px, py, cw - 1, ch - 1, Math.min(cw, ch) * 0.35); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillRect(px + cw * 0.18, py + ch * 0.18, cw * 0.25, 0.5);
    }
  };
}

/* ---------- the kinds ---------- */

/** What js/base-models-shell.js builds for each upright and wall kind: its parts, doors and default material. */
export const BUILT = {};

function piece(id, name, w, h, price, mat, parts, { doors = [], inside, ...rest } = {}) {
  BUILT[id] = { parts, doors, inside, mat };
  const all = [...parts, ...doors.flatMap(d => d.parts)];
  return { id, name, w, h, price, ...rest, draw(x, b, vw, dir) { floorShadow(x, b, vw); paintParts(all, x, b, vw, dir, w * 32); } };
}
function wallPiece(id, name, w, price, mat, parts, rest = {}) {
  BUILT[id] = { parts, doors: [], mat };
  return { id, name, w, h: 1, layer: 'wall', price, ...rest, wall(x) { paintParts(parts, x, 96, w * 32, 0, w * 32); } };
}
const bun = (pts, r = 2.4, c = MR.gold) => pts.map(([x, z]) => S(x, r * 0.85, z, r, r * 0.85, r, c, { m: 'metal', seg: 8 }));

export const SHELL_KINDS = [
  // a scallop-shell bed: a great pearly fan for a headboard with a pearl on its crest, a blush quilt, aqua pillows
  piece('merbed', 'Mermaid scallop bed', 2, 2, 1500, 'gloss', [
    ...bun([[6, -26], [58, -26], [6, 27], [58, 27]], 2.6),
    B(32, 8.5, 1, 60, 8, 60, MR.pearlD, { r: 1.5 }),
    B(32, 16, 2, 56, 7, 56, MR.foam, { m: 'cloth', r: 2 }),
    B(32, 20.6, 7, 57, 2.6, 46, MR.blush, CL), B(32, 15.5, 29.6, 57, 9, 1.4, MR.blush, CL),
    B(32, 19.6, -15.5, 57, 1.6, 4, MR.pearlS, CL),
    ...[20, 44].map(x => S(x, 23, -22, 9, 3.2, 4.6, MR.aquaL, CL)),
    ...fan(32, 6, -29, 30, 46, 4, MR.pearl, { n: 9, spread: 1.25, rib: MR.blush, pearls: 0.9 }),
    B(32, 7, -29, 60, 4, 4, MR.pearlD, { r: 1 }),
    pearl(32, 55, -28, 3.6),
    ...fan(32, 5, 30.6, 26, 13, 1.6, MR.pearl, { n: 7, spread: 1.3, rib: MR.blush }),
  ]),

  // a pearly side chair: a scallop-shell back, an aqua cushion, slender legs on gold toes
  piece('merchair', 'Mermaid scallop chair', 1, 1, 380, 'gloss', [
    ...[[6, -9], [26, -9], [6, 9], [26, 9]].flatMap(([x, z]) => [RD([x, 13, z], [x + (x < 16 ? -1 : 1), 1.4, z + (z < 0 ? -1 : 1)], 1.1, MR.pearl), pearl(x + (x < 16 ? -1 : 1), 1, z + (z < 0 ? -1 : 1), 1.1, MR.gold)]),
    B(16, 13.8, 1, 24, 3, 20, MR.pearlD),
    B(16, 16.3, 1.5, 23, 2.6, 19, MR.aqua, { m: 'cloth', r: 1.2 }),
    ...fan(16, 15.5, -9.5, 13, 26, 2.4, MR.pearl, { n: 7, rib: MR.blush }),
    pearl(16, 42.2, -9.5, 1.8),
  ]),

  // a shell sofa: three scallops for a back, rolled pearly arms, aqua seat cushions and a blush pillow
  piece('mersofa', 'Mermaid shell sofa', 2, 1, 1200, 'gloss', [
    ...bun([[6, -10], [58, -10], [6, 10], [58, 10]]),
    B(32, 9, 1, 60, 10, 26, MR.pearl, { r: 1.5 }),
    ...[19.5, 44.5].map(x => B(x, 15.8, 3, 25, 3.6, 21, MR.aqua, { m: 'cloth', r: 1.5 })),
    B(32, 17, -10.5, 56, 10, 5, MR.pearlD, { r: 1.5 }),
    ...fan(14, 13, -10, 12.5, 21, 5, MR.pearl, { n: 6, rib: MR.blush }),
    ...fan(50, 13, -10, 12.5, 21, 5, MR.pearl, { n: 6, rib: MR.blush }),
    ...fan(32, 13, -9.6, 14, 27, 5, MR.pearl, { n: 7, rib: MR.blush, pearls: 0.8 }),
    ...[3.6, 60.4].flatMap(x => [B(x, 16, 1.5, 6, 14, 23, MR.pearl, { r: 1.5 }), DS(x, 23, 2, 3.4, 23, MR.pearlD), DS(x, 23, 13.6, 1.6, 0.6, MR.gold, M)]),
    S(11.5, 22, -4, 5, 4.6, 2.4, MR.blush, CL),
  ]),

  // a round sea-glass table on a branching coral base
  piece('mertable', 'Mermaid coral table', 1, 1, 520, 'gloss', [
    C(16, 0.6, 0, 7, 1.2, MR.coralD),
    ...coralTree([16, 1, 0], [9, 22.6, -5], 2, MR.coral),
    ...coralTree([16, 1, 0], [23, 22.6, 5], 2, MR.coral),
    ...coralTree([16, 1, 0], [17, 22.6, -8], 1.6, MR.coral),
    C(16, 24.4, 0, 14.5, 2, MR.aquaL),
    RG(16, 25.4, 0, 14.4, 0.7, MR.pearlS, { flat: true, m: 'gloss' }),
    LA(16, 25.4, 2, [[0, 0], [2.5, 0.6], [3.6, 2], [0, 2.2]], MR.blush, { seg: 10 }),
    pearl(16, 27.2, 2, 1.2),
  ]),

  // a pearly writing desk: drawers with blush fronts and pearl knobs, a wave-curled leg, a shell-shaped letter rack
  piece('merdesk', 'Mermaid wave desk', 2, 1, 1100, 'gloss', [
    ...bun([[3, -11], [19, -11], [3, 11], [19, 11]], 1.8),
    B(11, 14, 0, 18, 24, 26, MR.pearl),
    ...[20, 9.5].flatMap(h => [B(11, h, 13.3, 15, 8.5, 0.8, MR.blush, { r: 0.6 }), pearl(11, h, 14.2, 1)]),
    ...[[57, -11], [57, 11]].flatMap(([x, z]) => [RD([x, 0.5, z], [x, 25.5, z], 1.4, MR.pearl), curl(x - 3, 21.5, z + (z > 0 ? 1.6 : -1.6), 3, 0.8, MR.aquaD, -0.6), pearl(x, 0.9, z, 1.3, MR.gold)]),
    B(40, 24.2, 11.5, 36, 3.6, 2, MR.pearlD, { r: 0.6 }),
    PR(40, 22.4, 12.6, wavePts(34, 2.4, 4), 0.4, MR.aqua, PL),
    B(32, 27, 0, 63, 2, 28, MR.pearlS, { r: 0.8 }),
    ...fan(48, 28, -9, 9, 10, 2.4, MR.lav, { n: 5, rib: MR.lavD }),
    B(30, 28.2, 4, 11, 0.3, 8, MR.pearlS, { m: 'plain', r: 0.05 }),
    LA(18, 28, 2, [[1.8, 0], [2.4, 1.6], [1.8, 3.2], [1.4, 3.6]], MR.aquaD, { seg: 10 }),
    RD([18, 31, 2], [21, 39, 0], 0.5, MR.pearlS, PL),
  ]),

  // a tall pearly wardrobe crowned with a scallop shell, its doors set with aqua panels and blush shell medallions
  piece('merwardrobe', 'Mermaid shell wardrobe', 2, 1, 1400, 'gloss', [
    ...bun([[6, -10], [58, -10], [6, 10], [58, 10]], 2.2),
    B(32, 5.5, 0, 60, 4, 28, MR.pearlD),
    B(32, 44, -1, 58, 74, 26, MR.pearl, { r: 1.2 }),
    ...[4.5, 59.5].map(x => B(x, 44, 11.5, 3.5, 74, 2, MR.blush, { r: 0.6 })),
    B(32, 82.5, 0, 62, 3, 30, MR.pearlD),
    ...fan(32, 84, 0, 20, 11, 5, MR.pearl, { n: 7, spread: 1.3, rib: MR.blush }),
    B(32, 10.5, 12.4, 52, 5, 0.8, MR.blush, { r: 0.5 }), pearl(20, 10.5, 13.2, 0.9), pearl(44, 10.5, 13.2, 0.9),
  ], {
    doors: [6, 58].map((hx, i) => {
      const x = i ? 45 : 19, hand = i ? 34.5 : 29.5;
      return { hinge: [hx, 12], side: i ? -1 : 1, parts: [
        B(x, 46.5, 12.75, 25.6, 66, 1.5, MR.pearl, { r: 0.8 }),
        B(x, 54, 13.6, 20, 32, 0.5, MR.aquaL, { r: 1.2 }),
        B(x, 26, 13.6, 20, 14, 0.5, MR.aquaL, { r: 1.2 }),
        ...fan(x, 47, 13.9, 5.5, 7, 0.6, MR.blush, { n: 5, rib: MR.rose }),
        pearl(hand, 44, 14.2, 1),
      ] };
    }),
    inside: { x: 32, h: 46, w: 50, hh: 62, z: 12 },
  }),

  // a wave dresser: three rows of drawers rolled with aqua waves, pearl knobs, a sea-glass top, a conch on it
  piece('merdresser', 'Mermaid wave dresser', 2, 1, 950, 'gloss', [
    ...bun([[5, -9], [59, -9], [5, 9], [59, 9]], 2.6, MR.pearlD),
    B(32, 16.5, 0, 60, 24, 24, MR.pearl, { r: 1.2 }),
    B(32, 29.8, 0, 62, 2, 26, MR.aquaL),
    ...[17.5, 46.5].flatMap(x => [B(x, 24.5, 12.4, 26, 6, 0.8, MR.blush, { r: 0.5 }), pearl(x, 24.5, 13.2, 0.9)]),
    ...[17, 9.5].flatMap(h => [
      B(32, h, 12.4, 55, 6.4, 0.8, MR.blush, { r: 0.5 }),
      PR(32, h - 3, 12.9, wavePts(53, 2.6, 5), 0.3, MR.aqua, PL),
      pearl(19, h + 0.6, 13.2, 0.9), pearl(45, h + 0.6, 13.2, 0.9),
    ]),
    ...conch(52, 30.8, -3, 1.1),
    pearl(12, 32, -4, 1.4), pearl(15, 31.8, -2, 1, MR.blush),
  ]),

  // a pearly open shelf: a scallop crest, sea-glass bottles, shells, a starfish, pearls and pastel books
  piece('mershelf', 'Mermaid shell shelf', 1, 1, 650, 'gloss', [
    ...bun([[4, -8], [28, -8], [4, 8], [28, 8]], 1.8, MR.pearlD),
    ...[2.5, 29.5].map(x => B(x, 36, 0, 3, 68, 18, MR.pearl, { r: 0.8 })),
    B(16, 36, -8.4, 24, 68, 1.2, MR.aquaL, { r: 0.3 }),
    ...[3.5, 21, 38.5, 56, 69.4].map(h => B(16, h, 0, 26, 1.6, 17, MR.pearl, { r: 0.5 })),
    ...fan(16, 70, -2, 13, 12, 3, MR.pearl, { n: 7, spread: 1.3, rib: MR.blush }),
    bottle(8, 4.3, -1, MR.aqua, 1.4), bottle(13.5, 4.3, -2, MR.lav, 1.1), ...conch(23, 4.3, 0, 0.9),
    ...[[7, MR.blush], [9.2, MR.aqua], [11.4, MR.lav], [13.4, MR.pearlS]].map(([x, c]) => B(x, 28.5, -1, 2, 13, 13, c, { m: 'cloth', r: 0.1 })),
    ...fan(22, 21.8, 0, 5, 6, 1.4, MR.coral, { n: 5, rib: MR.coralD }),
    PR(10, 46, 2, starPts(5), 1.4, MR.coral), pearl(21, 40.8, 1, 2.2), pearl(25.5, 40.2, 2, 1.4, MR.blush),
    bottle(9, 56.8, -1, MR.sea, 1.2), ...fan(20, 56.8, 0, 6, 7, 1.4, MR.blush, { n: 5, rib: MR.rose }),
  ]),

  // a pearl lamp: an open scallop holding a glowing pearl, on a coral stem and a pearly dome
  piece('merlamp', 'Mermaid pearl lamp', 1, 1, 480, 'gloss', [
    LA(16, 0, 0, [[7.5, 0], [7.5, 1.2], [5.4, 2.8], [2.4, 4.4], [1.6, 5.4], [0, 5.6]], MR.pearl, { seg: 16 }),
    ...coralTree([16, 5, 0], [16, 27, 0], 1.4, MR.coral),
    LA(16, 25.5, 0, [[1.4, 0], [5, 0.8], [8.6, 2.6], [9.6, 3.6]], MR.blush, { seg: 16 }),
    ...fan(16, 26.5, -4, 11, 15, 2, MR.pearl, { n: 7, rib: MR.blush }),
    S(16, 33.4, 1, 5.2, 5.2, 5.2, MR.glow, { m: 'glow', seg: 12 }),
  ], { glow: [MR.glow] }),

  // a three-panel screen: pearly frames under scallop crests, the panes sea glass in pearl leading
  piece('merscreen', 'Mermaid sea-glass screen', 2, 1, 700, 'gloss', [
    ...[[11, 4], [32, -4], [53, 4]].flatMap(([x, z], i) => [
      ...[-8, 8].map(dx => pearl(x + dx, 1.4, z, 1.5, MR.gold)),
      B(x, 33, z, 20.4, 60, 2, MR.pearl, { r: 0.8 }),
      ...fan(x, 61, z, 9.5, 9, 2, MR.pearl, { n: 6, spread: 1.3, rib: MR.blush }),
      B(x, 33, z - 1.05, 17, 52, 0.3, MR.aquaL, { m: 'plain', r: 0.3 }),
      PC(x, 33, z + 1.1, 16, 50, seaGlass(i + 1)),
    ]),
    ...[21.5, 42.5].flatMap(x => [16, 50].map(h => B(x, h, 0, 1, 3, 8.4, MR.gold, { m: 'metal', r: 0.3 }))),
  ]),

  // a shell vanity: a little pearly table with a drawer, a scallop-framed mirror, perfume and a pearl necklace
  piece('mervanity', 'Mermaid shell vanity', 1, 1, 780, 'gloss', [
    ...[[4, -11], [28, -11], [4, 7], [28, 7]].flatMap(([x, z]) => [RD([x, 17, z], [x + (x < 16 ? -0.8 : 0.8), 1.2, z], 1, MR.pearl), pearl(x + (x < 16 ? -0.8 : 0.8), 1, z, 1, MR.gold)]),
    B(16, 16.3, -2, 28, 3.4, 19, MR.pearlD),
    B(16, 16.3, 7.7, 14, 2.4, 0.6, MR.blush, { r: 0.4 }), pearl(16, 16.3, 8.3, 0.7),
    B(16, 19, -2, 30, 2, 21, MR.pearlS, { r: 0.6 }),
    ...fan(16, 20, -11, 14, 34, 2, MR.pearl, { n: 8, rib: null, pearls: 0.7 }),
    DS(16, 37, -9.6, 9.5, 0.4, MR.mirror, { ry: 13 }),
    LA(7, 20, 2, [[2, 0], [2.6, 1.6], [2.4, 4], [1, 5], [0.8, 6.2], [1.4, 7]], MR.lav, { seg: 10 }),
    pearl(7, 27.4, 2, 1, MR.gold),
    ...[19, 21.4, 23.8, 26].map((x, i) => pearl(x, 20.6 + (i % 2) * 0.3, 4 + i * 0.4, 0.7)),
    ...fan(12, 20, 5, 3, 3, 1, MR.blush, { n: 5, rib: MR.rose }),
  ]),

  // a pearly wall shelf on a scallop back: a conch, a sea-glass bottle and a pearl on it
  wallPiece('merwallshelf', 'Mermaid shell wall shelf', 1, 320, 'gloss', [
    ...fan(16, 38, 0.6, 14, 22, 1.2, MR.pearl, { n: 7, rib: MR.blush }),
    B(16, 44, 3.4, 26, 1.6, 6.4, MR.pearlD, { r: 0.6 }),
    ...[6, 26].map(x => PR(x, 38, 2.4, [[-0.8, 5], [0.8, 5], [0.8, 4], [0, 0]], 4, MR.pearlD)),
    ...conch(20, 44.8, 3.6, 0.8),
    bottle(9, 44.8, 3.4, MR.aqua, 1),
    pearl(13.4, 46.2, 4, 1.4),
  ]),

  // a fishing net draped from two gold pegs, a coral starfish, a shell and pearls caught in it
  wallPiece('mernet', 'Mermaid starfish net', 2, 380, 'plain', (() => {
    const L0 = 6, L1 = 58, H0 = 46, H1 = 74, z = 0.8, out = [];
    const clip = (x0, x1) => { // a line from (x0, top) to (x1, bottom), cut to the net's sides
      if ((x0 < L0 && x1 < L0) || (x0 > L1 && x1 > L1)) return null;
      let [ax, ah, bx, bh] = [x0, H1, x1, H0];
      const cut = (x) => ah + (bh - ah) * (x - ax) / (bx - ax);
      if (ax < L0) { ah = cut(L0); ax = L0; } else if (ax > L1) { ah = cut(L1); ax = L1; }
      if (bx < L0) { bh = cut(L0); bx = L0; } else if (bx > L1) { bh = cut(L1); bx = L1; }
      return ah - bh > 0.5 ? RD([ax, ah, z], [bx, bh, z], 0.3, MR.sand) : null;
    };
    for (let x = L0 - 28; x <= L1; x += 6) { const a = clip(x, x + 28); if (a) out.push(a); const c = clip(x + 28, x); if (c) out.push(c); }
    out.push(RD([L0 - 2, H1, 1], [L1 + 2, H1, 1], 0.7, MR.sand), RD([L0, H0, 1], [L1, H0, 1], 0.5, MR.sand));
    out.push(...[L0 - 2, L1 + 2].map(x => S(x, H1 + 0.5, 1.4, 1.8, 1.8, 1.4, MR.gold, { m: 'metal', seg: 8 })));
    out.push(PR(20, 60, 2, starPts(7), 1.6, MR.coral), S(20, 60, 2.6, 1.6, 1.6, 0.6, MR.coralD, { seg: 6 }));
    out.push(PR(45, 52, 2, starPts(4.4), 1.2, MR.gold));
    out.push(...fan(36, 61, 1.8, 6, 7, 1.4, MR.blush, { n: 6, rib: MR.rose }));
    out.push(pearl(28, 51, 1.8, 1.4), pearl(52, 64, 1.8, 1.2, MR.blush), pearl(12, 50, 1.6, 1.1, MR.lav));
    return out;
  })()),

  // a wall clock in a scallop shell: a pearly fan, a gold-rimmed pearl dial, a pearl drop under it
  wallPiece('merwallclock', 'Mermaid shell wall clock', 1, 560, 'gloss', [
    ...fan(16, 38, 1, 14, 34, 2, MR.pearl, { n: 8, rib: MR.blush, pearls: 0.8 }),
    DS(16, 56, 2.4, 8.2, 1, MR.gold, M),
    PC(16, 56, 2.95, 14.6, 14.6, dial),
    pearl(16, 36, 1.8, 2, MR.blush),
  ]),

  // a mermaid's harp: a gold column crowned with a shell, a pearly soundbox, pale gold strings
  piece('merharp', 'Mermaid harp', 1, 1, 1100, 'gloss', (() => {
    const box = (x) => 6 + (x - 9) / 17 * 44, neck = [[6.5, 64], [13, 66], [19.5, 61], [26, 52]];
    const top = (x) => { for (let i = 1; i < neck.length; i++) if (x <= neck[i][0]) { const [a, b] = [neck[i - 1], neck[i]]; return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]) - 1; } return 50; };
    return [
      B(16, 2, 0, 22, 4, 12, MR.pearlD, { r: 1 }), ...bun([[6, -4], [26, -4], [6, 4], [26, 4]], 1.4),
      LA(6.5, 4, 0, [[2.2, 0], [1.5, 3], [1.3, 52], [2.2, 56], [1.6, 58]], MR.gold, { m: 'metal', seg: 10 }),
      RD([9, 5, 0], [26, 50, 0], 2.8, MR.pearl),
      ...neck.slice(1).map((p, i) => RD([neck[i][0], neck[i][1], 0], [p[0], p[1], 0], 1.4, MR.gold, M)),
      ...fan(6.5, 62, 0.8, 4.6, 6, 1.4, MR.blush, { n: 5, rib: MR.rose }),
      ...Array.from({ length: 8 }, (_, i) => { const x = 10.5 + i * 1.9; return RD([x, top(x), 0], [x, box(x) + 2.4, 0], 0.2, MR.string, PL); }),
      pearl(26.4, 52.6, 0, 1.6),
    ];
  })(), {}),

  // a conch fountain: a pearly basin, a shell column, a blush scallop dish and a conch on top that pours
  piece('merfountain', 'Mermaid conch fountain', 1, 1, 1300, 'gloss', [
    LA(16, 0, 0, [[13.6, 0], [14.6, 1.2], [15, 7], [15.4, 8], [14.2, 8.6], [13.2, 2.6]], MR.pearl, { seg: 20 }),
    C(16, 6.6, 0, 13.4, 1.2, MR.water),
    ...Array.from({ length: 8 }, (_, i) => { const a = i / 8 * TAU; return pearl(16 + Math.cos(a) * 14.8, 8.6, Math.sin(a) * 14.8, 0.9); }),
    LA(16, 7, 0, [[3.4, 0], [2.4, 4], [2.2, 10], [3, 12], [2, 13]], MR.pearl, { seg: 12 }),
    LA(16, 19, 0, [[1.6, 0], [5, 1.4], [8, 3.4], [8.6, 4.2]], MR.blush, { seg: 16 }),
    C(16, 22.6, 0, 7.6, 0.6, MR.water),
    LA(16, 22.6, -1, [[3, 0], [4, 2], [3.6, 5], [2.4, 8], [1.2, 10.4], [0, 11.6]], MR.pearlS, { seg: 12 }),
    ...[3, 6, 9].map(h => RG(16, 22.6 + h, -1, 3.6 - h * 0.25, 0.4, MR.blush, { flat: true, m: 'gloss' })),
    S(16, 25.6, 2.6, 2.6, 2.2, 1.4, MR.rose, { seg: 8, m: 'plain' }),
    RD([16, 24.6, 3.6], [16, 22.6, 6.2], 0.8, MR.aquaL, { m: 'glass' }),
  ]),

  // a bubble tank: a glass globe on a pearly shell stand, a Luvdisc swimming over a little treasure chest and coral
  piece('mertank', 'Mermaid bubble tank', 1, 1, 900, 'gloss', [
    LA(16, 0, 0, [[9, 0], [9.4, 1.4], [6.4, 3.2], [4, 8], [4.6, 12], [8, 14], [9, 15.4]], MR.pearl, { seg: 16 }),
    ...[0, 1, 2, 3, 4, 5].map(i => { const a = i / 6 * TAU; return pearl(16 + Math.cos(a) * 9.2, 1.2, Math.sin(a) * 9.2, 1, MR.gold); }),
    S(16, 19.6, 0, 8.6, 3, 8.6, MR.sand, { m: 'plain', seg: 12 }),
    B(12, 22.4, 1, 5, 3.4, 3.6, MR.coralD, { r: 0.6 }), B(12, 24.4, 1, 5.2, 1.2, 3.8, MR.gold, { m: 'metal', r: 0.5 }),
    ...coralTree([20, 20.6, -2], [22, 28, -2], 0.8, MR.coral),
    S(17, 31, 2, 3.6, 3, 1.6, MR.rose),
    PR(20.2, 31, 2, [[0, 0], [3, 2.4], [3, -2.4]], 0.8, MR.rose),
    S(15.4, 31.6, 3.4, 0.6, 0.6, 0.4, MR.ink, { m: 'plain', seg: 6 }),
    ...[[13, 36, 1, 0.8], [11, 39, 0, 0.6], [14.5, 33.4, 2, 0.5]].map(([x, h, z, r]) => S(x, h, z, r, r, r, MR.pearlS, { m: 'gloss', seg: 6 })),
    S(16, 29, 0, 13, 13, 13, MR.mirror, { m: 'glass', seg: 16 }),
    RG(16, 41, 0, 5.2, 0.8, MR.gold, { flat: true, m: 'metal' }),
  ]),

  // a pearl chandelier stand: a tall gold stem, a crown dripping strings of pearls, a glowing pearl in a shell on top
  piece('merchandelier', 'Mermaid pearl chandelier', 1, 1, 850, 'metal', [
    LA(16, 0, 0, [[8, 0], [8, 1.4], [5.6, 3], [2.6, 5], [1.6, 7], [0, 7.2]], MR.pearl, { seg: 16, m: 'gloss' }),
    LA(16, 6, 0, [[1.4, 0], [1, 10], [1.8, 12], [1, 14], [1, 60], [1.6, 62], [1.2, 64]], MR.gold, { seg: 10 }),
    LA(16, 64, 0, [[1.2, 0], [6, 1.2], [10, 3.4], [10.6, 4.4], [9.4, 4.8]], MR.gold, { seg: 16 }),
    ...[-1, 1].map(s => RD([16, 50, 0], [16 + s * 8, 58, 0], 0.7, MR.gold)),
    ...[-1, 1].map(s => S(16 + s * 8, 60, 0, 2, 2.6, 2, MR.glowP, { m: 'glow', seg: 8 })),
    ...fan(16, 68, -2, 7, 9, 1.4, MR.pearl, { n: 6, rib: MR.blush, m: 'gloss' }),
    S(16, 72, 0.6, 3, 3, 3, MR.glow, { m: 'glow', seg: 10 }),
    ...Array.from({ length: 6 }, (_, i) => { const a = (i + 0.5) / 6 * TAU, x = 16 + Math.cos(a) * 9.6, z = Math.sin(a) * 9.6; return [66.4, 63.4, 60.4, 57.4].map((h, j) => pearl(x, h, z, j === 3 ? 1.2 : 0.8)); }).flat(),
  ], { glow: [MR.glow, MR.glowP] }),

  // a Corsola: a pink coral Pokémon, round and smiling, its two coral horns branching up
  piece('mercorsola', 'Mermaid Corsola figure', 1, 1, 520, 'gloss', [
    ...[[9, -4], [23, -4], [9, 5], [23, 5]].map(([x, z]) => S(x, 2, z, 2.6, 2, 2.6, MR.rose, { seg: 8 })),
    S(16, 11, 0, 11, 9, 10, MR.rose, { seg: 16 }),
    S(16, 7.5, 2.6, 9, 5, 7.6, MR.pearlS, { seg: 12 }),
    ...[11.6, 20.4].flatMap(x => [S(x, 13, 8.6, 1.5, 2.2, 0.8, MR.ink, { m: 'plain', seg: 6 }), S(x - 0.4, 13.8, 9.2, 0.5, 0.6, 0.3, '#ffffff', { m: 'plain', seg: 6 })]),
    S(16, 10.2, 9.9, 1.6, 0.8, 0.5, MR.coralD, { m: 'plain', seg: 6 }),
    ...[-1, 1].flatMap(s => [
      RD([16 + s * 4, 18, -1], [16 + s * 7, 25, -1], 1.6, MR.rose), RD([16 + s * 7, 25, -1], [16 + s * 6, 31, -1], 1.2, MR.rose),
      RD([16 + s * 7, 25, -1], [16 + s * 11, 28, -1], 1.1, MR.rose),
      S(16 + s * 6, 31, -1, 1.2, 1.2, 1.2, MR.pearlS, { seg: 6 }), S(16 + s * 11, 28, -1, 1.1, 1.1, 1.1, MR.pearlS, { seg: 6 }),
    ]),
  ]),

  // a treasure clam: a blush giant clam open on a sandy foot, its lid ribbed, a great pearl and gold coins inside
  piece('merclam', 'Mermaid treasure clam', 1, 1, 620, 'gloss', [
    C(16, 1, 0, 11, 2, MR.sand, { rb: 12 }),
    LA(16, 2, 2, [[4, 0], [9, 1.4], [12.6, 4.4], [13.6, 7.2]], MR.blush, { seg: 16 }),
    C(16, 8.2, 2, 12.6, 0.6, MR.pearl, { m: 'plain' }),
    ...[[11, 8.8, 4], [21, 8.8, 5], [13, 9.4, 7], [20, 9.2, 0]].map(([x, h, z]) => C(x, h, z, 1.6, 0.6, MR.gold, M)),
    pearl(16, 12.6, 3, 4.2),
    ...fan(16, 7, -8, 14, 18, 2, MR.blush, { n: 8, rib: MR.rose, tilt: 0.3 }),
  ]),

  // a pearly nightstand: two blush drawers with little shell badges, a sea-glass top, a conch and a pearl on it
  piece('mernightstand', 'Mermaid shell nightstand', 1, 1, 360, 'gloss', [
    ...bun([[5, -8], [27, -8], [5, 8], [27, 8]], 2, MR.pearlD),
    B(16, 12.5, 0, 26, 18, 22, MR.pearl),
    B(16, 22.4, 0, 28, 1.6, 24, MR.aquaL, { r: 0.6 }),
    ...[17, 8.5].flatMap(h => [B(16, h, 11.4, 22, 7, 0.8, MR.blush, { r: 0.5 }), ...fan(16, h - 2, 12, 2.6, 3, 0.4, MR.lav, { n: 5, rib: null }), pearl(16, h + 1.8, 12.4, 0.7)]),
    ...conch(20, 23.2, -2, 0.8), pearl(9, 24.4, 2, 1.2),
  ]),

  // a mermaid's throne: a tall gold-ribbed scallop strung with pearls, coral arm posts, a lavender velvet seat
  piece('merthrone', 'Mermaid scallop throne', 1, 1, 1250, 'gloss', [
    B(16, 4, 0, 28, 8, 26, MR.pearl, { r: 2 }),
    ...fan(16, 0, 13.4, 9, 7, 1, MR.blush, { n: 6, rib: MR.rose }),
    B(16, 11.5, 0.5, 26, 7, 22, MR.pearlD, { r: 1.5 }),
    B(16, 16.4, 2, 24, 3, 19, MR.lav, { m: 'cloth', r: 1.4 }),
    ...fan(16, 13, -9.5, 15, 48, 3, MR.pearl, { n: 9, spread: 1.15, rib: MR.gold, pearls: 0.8 }),
    pearl(16, 61.8, -9.5, 2.4),
    ...[3.2, 28.8].flatMap(x => [
      RD([x, 14, 9.5], [x, 20, 9.5], 1.4, MR.coral), RD([x, 15, 9.5], [x + (x < 16 ? -1.2 : 1.2), 22, 7], 0.8, MR.coral),
      B(x, 21, 1, 3.6, 2.4, 19, MR.pearl, { r: 1 }), S(x, 21.4, 10.6, 2, 2, 2, MR.gold, { m: 'metal', seg: 8 }),
    ]),
  ]),

  // a seahorse rocker: a pearly seahorse with a pink fin and an aqua saddle, its tail curled, on shell-white rockers
  piece('merseahorse', 'Mermaid seahorse rocker', 1, 1, 540, 'gloss', [
    ...[7, 25].map(x => SL(x, 0, 0, 2.4, [[-15, 4], [-10, 1.4], [-4, 0.2], [4, 0.2], [10, 1.4], [15, 4], [15, 5.6], [10, 3], [4, 1.8], [-4, 1.8], [-10, 3], [-15, 5.6]], MR.pearlD)),
    ...[-8, 8].flatMap(z => [RD([7, 2.6, z], [25, 2.6, z], 0.8, MR.gold, M), RD([16, 2.6, z], [16, 10, z * 0.6], 1.1, MR.gold, M)]),
    SL(16, 0, 0, 8, [[-6, 10], [-1, 9], [5, 10], [8, 14], [8, 20], [6, 25], [7, 29], [11, 31], [15, 31], [15, 34], [10, 35], [6, 38], [1, 37.4], [-1, 34], [1, 29], [-1, 24], [-5, 20], [-9, 16], [-11, 12], [-9, 9]], MR.pearl),
    ...[[-10.6, 9.4, 1.8], [-12.2, 6.8, 1.6], [-10.4, 5, 1.4], [-8.6, 6.4, 1.2]].map(([z, h, r]) => S(16, h, z, r, r, r, MR.pearl, { seg: 8 })),
    SL(16, 0, 0, 1.4, [[-1, 32], [-5, 30], [-7, 26], [-5, 24], [-2, 27]], MR.rose),
    ...[0, 1, 2].map(i => S(16, 37.4 - i * 2.4, -0.4 - i * 1.6, 1.4, 1.4, 1.4, MR.blush, { seg: 6 })),
    B(16, 21.6, 0, 9.6, 2.4, 9, MR.aqua, { m: 'cloth', r: 1 }),
    ...[11.6, 20.4].flatMap(x => [S(x, 34, 4, 1.3, 1.3, 1.3, MR.ink, { m: 'plain', seg: 6 }), RD([16, 27, 3], [x < 16 ? 9 : 23, 26, 2], 0.5, MR.gold, M)]),
    S(16, 31.6, 13.8, 1.6, 1.6, 1.2, MR.pearlD, { seg: 6 }),
  ]),

  // a pearl stool: a great pearly cushion on a blush scallop base
  piece('merstool', 'Mermaid pearl stool', 1, 1, 260, 'gloss', [
    LA(16, 0, 0, [[9, 0], [9.6, 1], [7, 3], [4.2, 5], [4.2, 8.6], [7.6, 10]], MR.blush, { seg: 16 }),
    ...Array.from({ length: 8 }, (_, i) => { const a = i / 8 * TAU; return S(16 + Math.cos(a) * 8.6, 1.4, Math.sin(a) * 8.6, 1.6, 1.4, 1.6, MR.blushD, { seg: 6 }); }),
    RG(16, 10, 0, 7.8, 1, MR.aqua, { flat: true, m: 'gloss' }),
    S(16, 13.4, 0, 10.4, 4.6, 10.4, MR.pearl, { seg: 16 }),
  ]),

  // a sea-foam rug: aqua water rippling in waves, a pearl-scalloped border, shells, starfish and pearls on it
  { id: 'merrug', name: 'Mermaid sea-foam rug', w: 3, h: 2, layer: 'rug', price: 700, high: 0.04, side: 'c', flat(w, h) {
    const g = ctx(), cx = w / 2, cy = h / 2;
    g.fillStyle = MR.blush; g.beginPath(); g.roundRect(0, 0, w, h, 6); g.fill();
    g.fillStyle = MR.pearlS;
    for (let x = 4; x < w - 2; x += 5) for (const y of [2.6, h - 2.6]) { g.beginPath(); g.arc(x, y, 1.4, 0, TAU); g.fill(); }
    for (let y = 7; y < h - 4; y += 5) for (const x of [2.6, w - 2.6]) { g.beginPath(); g.arc(x, y, 1.4, 0, TAU); g.fill(); }
    g.fillStyle = MR.pearl; g.beginPath(); g.roundRect(5, 5, w - 10, h - 10, 5); g.fill();
    const sea = g.createRadialGradient(cx, cy, 2, cx, cy, w * 0.5);
    sea.addColorStop(0, MR.aquaL); sea.addColorStop(0.6, MR.aqua); sea.addColorStop(1, MR.aquaD);
    g.fillStyle = sea; g.beginPath(); g.roundRect(7, 7, w - 14, h - 14, 4); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 0.8; g.lineCap = 'round';
    for (let r = 0; r < 6; r++) {
      const y = 11 + r * (h - 22) / 5;
      g.beginPath();
      for (let x = 9; x <= w - 9; x += 1) { const yy = y + Math.sin(x / 5 + r * 1.7) * 1.4; x === 9 ? g.moveTo(x, yy) : g.lineTo(x, yy); }
      g.stroke();
    }
    g.save(); g.translate(cx, cy + 9);
    g.fillStyle = MR.pearlS; g.beginPath(); fanPts(13, 17, 7, 1.2).forEach(([x, y], i) => (i ? g.lineTo(x, -y) : g.moveTo(x, -y))); g.closePath(); g.fill();
    g.strokeStyle = MR.blush; g.lineWidth = 0.9;
    for (let k = 0; k < 7; k++) { const a = 1.2 - 2.4 * (4 * k + 2) / 28; g.beginPath(); g.moveTo(Math.sin(a) * 3, -Math.cos(a) * 4); g.lineTo(Math.sin(a) * 11.6, -Math.cos(a) * 15); g.stroke(); }
    g.restore();
    const star = (x, y, r, c) => { g.fillStyle = c; g.beginPath(); starPts(r).forEach(([a, b], i) => (i ? g.lineTo(x + a, y - b) : g.moveTo(x + a, y - b))); g.closePath(); g.fill(); };
    star(18, 16, 4.4, MR.coral); star(w - 17, h - 15, 3.6, MR.gold); star(w - 22, 15, 2.6, MR.lav);
    for (let i = 0; i < 9; i++) {
      const x = 12 + hash(i, 7) * (w - 24), y = 12 + hash(i, 8) * (h - 24);
      if (Math.abs(x - cx) < 16 && Math.abs(y - cy) < 14) continue;
      g.fillStyle = [MR.pearlS, MR.blush, MR.lav][i % 3]; g.beginPath(); g.arc(x, y, 1 + hash(i, 9) * 0.8, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(x - 0.6, y - 0.7, 0.6, 0.5);
    }
  } },
].map(f => ({ group: GROUP, solo: true, ...f }));
