/* base-furniture-mushroom.js  -  the Mushroom set (furniture expansion session f, 2026-10-17): a forest-floor room like
   Animal Crossing's mush series. Domed caps, red with white spots and a few tan and brown, on thick cream stalks, pale
   gills under every cap, mossy green bases and soft forest browns; the lamps' caps glow at night. Pokémon touches: a
   Shroomish stool, a Foongus end table, a Parasect lamp, a Shiinotic glow lamp, a Breloom figure. All solo, fixed colours.
   An upright piece is a list of parts in painted units (32 a tile), as in js/base-furniture-elegant.js: `x` across from
   the left of its front, `h` up from the floor (a wall piece's from the foot of its strip), `z` out to the front from its
   middle (a wall piece's from the wall). They're painted here from any side, and js/base-models-mushroom.js builds the
   same list as 3D parts (BUILT), so picture and model agree. A cap (`cap()`) is a lathed dome over a cone of gills, its
   spots little balls set into its surface; a lathe can be squashed front to back (`sz`), a cylinder halved against a wall
   (`half`, the bracket fungi), a disc turned to face the sides (`ax: 'x'`, the log's cut ends). A `pic` part (the clock's
   dial, the screen's woods) is painted on the front only, and the model wears that crop of the painting. The wardrobe's
   doors swing (`doors`, `inside`). The rug is round, painted from above. */

import { sh, oval, ovalShade, floorShadow, ctx, hash, glass as glassPane } from './base-paint.js';

export const MU = {
  red: '#d9483b', redL: '#ef7464', redD: '#a8302a', spot: '#fdf8ec', stalk: '#f1e6cf', stalkL: '#fbf5e6', stalkD: '#d8c7a6',
  gill: '#e8d5b2', gillD: '#c4a984', tan: '#cf9f63', tanL: '#e6be86', tanD: '#a7783f', brown: '#8c5a36', brownL: '#ad7a50',
  brownD: '#674027', bark: '#6f4a30', barkD: '#4f321f', moss: '#6f9e48', mossL: '#94c062', mossD: '#4d7a33', soil: '#7b5a3e',
  soilD: '#5a3f2a', ink: '#33241c', mirror: '#cfe1ea', glowR: '#ff8a62', glowT: '#ffc98a', glowG: '#fff0c4', glowO: '#ff7a4a',
  pink: '#f6a8d2', blue: '#8fe0ff', lav: '#ebe3f4', orange: '#e8643a', yellow: '#f7dc7a', green: '#62a84a', greenD: '#3f7a2e',
  beige: '#eadfb4', beigeD: '#cbbd8c', wicker: '#c99b5b', wickerD: '#9c7038', white: '#ffffff', black: '#2a2226',
  paper: '#f5ecd8', clay: '#c4704a', book1: '#5a7a9a', book2: '#9a5a4a', book3: '#7a9a5a',
};
const GROUP = 'Mushroom';
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

const CL = { m: 'cloth' }, PL = { m: 'plain' }, GL = { m: 'gloss' }, WD = { m: 'wood' }, GW = { m: 'glow' };

/** A dome's profile R across and H high, its rim curled a little under. */
const DOME = (R, H) => [[R * 0.9, -0.8], [R, 0.3], [R * 0.98, H * 0.22], [R * 0.88, H * 0.5], [R * 0.68, H * 0.76], [R * 0.38, H * 0.94], [0, H]];
/** A stalk sr round rising hh from h, swollen a little at its foot. */
const stalk = (x, h, z, sr, hh, c = MU.stalk, o) => LA(x, h, z, [[sr * 1.3, 0], [sr * 1.12, hh * 0.12], [sr, hh * 0.4], [sr * 0.92, hh * 0.85], [sr * 0.96, hh]], c, { m: 'gloss', ...o });
/** A cap: a dome R across and H high whose rim sits at h, a cone of gills under it down to the stalk (sr), `spots` balls
    set into its surface, scattered by the golden angle from `seed`; `sz` squashes it front to back. */
function cap(x, h, z, R, H, c, { sr = R * 0.3, gill = MU.gill, gm = 'plain', spots = 0, spot = MU.spot, sm = 'plain', seed = 1, m = 'gloss', sz = 1, g = Math.max(1, R * 0.16), ss = 0.14 } = {}) {
  const out = [];
  if (gill) out.push(LA(x, h - g, z, [[sr, 0], [R * 0.92, g]], gill, { m: gm, sz, gl: true }));
  out.push(LA(x, h, z, DOME(R, H), c, { m, sz }));
  for (let i = 0; i < spots; i++) {
    const az = i * 2.39996 + seed, phi = i === 0 && spots > 5 ? Math.PI / 2 : 0.3 + 0.9 * ((i * 0.618 + hash(i, seed) * 0.35) % 1);
    const cr = Math.cos(phi), px = R * cr * Math.sin(az), py = H * Math.sin(phi), pz = R * sz * cr * Math.cos(az);
    const nx = px / (R * R), ny = py / (H * H), nz = pz / (R * R * sz * sz), nl = Math.hypot(nx, ny, nz) || 1;
    const s = R * ss * (0.75 + 0.5 * hash(i, seed, 2)), k = 0.45 * s / nl;
    out.push(S(x + px - nx * k, h + py - ny * k, z + pz - nz * k, s, s * (0.5 + 0.5 * cr), s * Math.max(0.5, sz), spot, { m: sm, seg: 6 }));
  }
  return out;
}
/** A little whole mushroom standing on h: a stalk and its cap. */
const shroom = (x, h, z, sr, hh, R, H, c, o = {}) => [stalk(x, h, z, sr, hh), ...cap(x, h + hh, z, R, H, c, { sr, ...o })];
/** A half ellipse a either side and b high, standing on its flat edge: a cap seen side on. */
const halfEll = (a, b, n = 12) => [[-a, 0], [a, 0], ...Array.from({ length: n - 1 }, (_, i) => { const t = (i + 1) / n * Math.PI; return [a * Math.cos(t), b * Math.sin(t)]; })];
/** A mossy cushion on the floor. */
const moss = (x, z, rx, rz, hh = 2.6, c = MU.moss) => LA(x, 0, z, [[rx, 0], [rx * 0.96, hh * 0.35], [rx * 0.75, hh * 0.8], [rx * 0.4, hh], [0, hh]], c, { m: 'cloth', sz: rz / rx, seg: 12 });
/** White spots on a flat face at z. */
const dots = (list, z, r = 1.3, c = MU.spot) => list.map(([x, h, k = 1]) => DS(x, h, z, r * k, 0.3, c, { m: 'plain', seg: 8 }));
const knob = (x, h, z) => [S(x, h, z, 1.6, 1.3, 1, MU.red, { m: 'gloss', seg: 8 }), S(x - 0.4, h + 0.5, z + 0.8, 0.45, 0.35, 0.3, MU.spot, { m: 'plain', seg: 6 })];

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
  if (h > 3 && w > 3 && m !== 'glow') { g.save(); g.globalAlpha *= 0.4; g.fillStyle = sh(c, 2); g.fillRect(x + Math.min(r, w / 2) * 0.6, y + 0.3, w - Math.min(r, w / 2) * 1.2, 0.5); g.restore(); }
}
function poly(pts, c, m, horiz) {
  const g = ctx(), xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  if (m === 'plain') g.fillStyle = c;
  else if (m === 'glow') {
    const t = g.createRadialGradient((x0 + x1) / 2, y1, 0, (x0 + x1) / 2, y1, Math.max(x1 - x0, y1 - y0));
    t.addColorStop(0, sh(c, 2)); t.addColorStop(0.45, sh(c, 1)); t.addColorStop(1, c);
    g.fillStyle = t;
  } else if (horiz) {
    const l = g.createLinearGradient(x0, 0, x1, 0);
    l.addColorStop(0, sh(c, -1)); l.addColorStop(0.3, sh(c, 1)); l.addColorStop(0.55, c); l.addColorStop(1, sh(c, -2));
    g.fillStyle = l;
  } else g.fillStyle = grad(g, x0, y0, x1, y1, c, m);
  g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill();
}
function ball(cx, cy, rx, ry, c, m) {
  const g = ctx();
  if (m === 'glow') { const t = g.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry)); t.addColorStop(0, sh(c, 2)); t.addColorStop(0.4, sh(c, 1)); t.addColorStop(1, c); g.fillStyle = t; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, TAU); g.fill(); return; }
  if (m === 'plain') { oval(cx, cy, rx, ry, c); return; }
  ovalShade(cx, cy, rx, ry, c);
  if (m === 'gloss') { g.save(); g.globalAlpha *= 0.5; oval(cx - rx * 0.38, cy - ry * 0.42, rx * 0.22, ry * 0.14, '#ffffff'); g.restore(); }
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
        if (q.half && side) { poly([[cx, top], [cx + sg * q.r, top], [cx + sg * rb, bot], [cx, bot]], q.c, m, m !== 'glow'); break; }
        poly([[cx - q.r, top], [cx + q.r, top], [cx + rb, bot], [cx - rb, bot]], q.c, m, m !== 'glow');
        if (!q.half) oval(cx, top, q.r, Math.min(q.r * 0.22, Math.max(0.3, q.hh / 2)), sh(q.c, m === 'glow' ? 2 : 1));
        break;
      }
      case 'ball': ball(cx, cy, side ? q.rz : q.rx, q.ry, q.c, m); break;
      case 'disc': {
        const edge = q.ax === 'x' ? !side : side;
        if (edge) rbx(cx - q.th / 2, cy - (q.ry ?? q.r), q.th, (q.ry ?? q.r) * 2, q.th / 2, q.c, m); else ball(cx, cy, q.r, q.ry ?? q.r, q.c, m);
        break;
      }
      case 'lathe': {
        const k = side ? q.sz ?? 1 : 1, pts = q.pts.map(([r, up]) => [r * k, cy - up]);
        poly([...pts.map(([r, y]) => [cx - r, y]), ...pts.slice().reverse().map(([r, y]) => [cx + r, y])], q.c, m, true);
        if (q.gl) {
          const [[r0, y0], [r1, y1]] = pts, n = Math.max(4, Math.round(r1 / 1.6));
          g.save(); g.strokeStyle = sh(q.c, -1); g.lineWidth = 0.35; g.globalAlpha *= 0.8;
          for (let i = 1; i < n; i++) { const f = i / n * 2 - 1; g.beginPath(); g.moveTo(cx + f * r0, y0); g.lineTo(cx + f * r1 * 0.98, y1 + 0.2); g.stroke(); }
          g.restore();
          break;
        }
        if (q.pts[q.pts.length - 1][0] < 0.01 && q.pts.length > 2) break;
        const [rt, ut] = q.pts[q.pts.length - 1];
        oval(cx, cy - ut, rt * k, rt * 0.22, sh(q.c, -2));
        break;
      }
      case 'ring': {
        const ry = q.ry ?? q.r;
        if (side && !q.flat) { if (q.arc) { rbx(cx - q.tr, cy - ry - q.tr, q.tr * 2, ry + q.tr * 2, q.tr, q.c, m); break; } rbx(cx - q.tr, cy - ry - q.tr, q.tr * 2, (ry + q.tr) * 2, q.tr, q.c, m); break; }
        const a0 = q.arc ? -(q.a0 + q.arc) : 0, a1 = q.arc ? -q.a0 : TAU;
        const path = (dy = 0) => { g.beginPath(); if (q.flat) g.ellipse(cx, cy + dy, q.r, q.r * 0.22, 0, 0, TAU); else g.ellipse(cx, cy + dy, q.r, ry, 0, a0, a1); };
        g.strokeStyle = q.c; g.lineWidth = q.tr * 2; path(); g.stroke();
        g.save(); g.globalAlpha *= 0.45; g.strokeStyle = sh(q.c, 2); g.lineWidth = q.tr * 0.6;
        if (q.flat) { g.beginPath(); g.ellipse(cx, cy - q.tr * 0.4, q.r, q.r * 0.22, 0, Math.PI, TAU); } else path(-q.tr * 0.4);
        g.stroke(); g.restore();
        break;
      }
      case 'rod': {
        const p0 = [U(q.a[0], q.a[2]), b - q.a[1]], p1 = [U(q.b[0], q.b[2]), b - q.b[1]];
        if (Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) < 0.05) { ball(p0[0], p0[1], q.r, q.r, q.c, m); break; }
        g.lineCap = 'round'; g.strokeStyle = m === 'glass' ? alphaOf('#cfe8f4', 0.4) : q.c; g.lineWidth = q.r * 2;
        g.beginPath(); g.moveTo(...p0); g.lineTo(...p1); g.stroke();
        if (q.r > 0.6 && m !== 'plain') {
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
      case 'pic': g.save(); g.beginPath(); g.rect(cx - q.w / 2, cy - q.hh / 2, q.w, q.hh); g.clip(); q.fn(g, cx - q.w / 2, cy - q.hh / 2, q.w, q.hh); g.restore(); break;
    }
  }
}

/* ---------- pictures ---------- */

/** A cream dial on the clock's stalk: brown dots for the hours, a little red toadstool at twelve, hands at ten past ten. */
function dial(g, x, y, w, h) {
  const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2;
  g.fillStyle = MU.brownD; g.fillRect(x, y, w, h);
  g.fillStyle = MU.stalkL; g.beginPath(); g.arc(cx, cy, r * 0.96, 0, TAU); g.fill();
  g.fillStyle = MU.brown;
  for (let i = 0; i < 12; i++) if (i) { const a = i / 12 * TAU - Math.PI / 2, d = i % 3 ? 0.05 : 0.09; g.beginPath(); g.arc(cx + Math.cos(a) * r * 0.74, cy + Math.sin(a) * r * 0.74, r * d, 0, TAU); g.fill(); }
  g.fillStyle = MU.stalk; g.fillRect(cx - r * 0.05, cy - r * 0.78, r * 0.1, r * 0.14);
  g.fillStyle = MU.red; g.beginPath(); g.ellipse(cx, cy - r * 0.78, r * 0.16, r * 0.12, 0, Math.PI, TAU); g.fill();
  g.fillStyle = MU.spot; g.beginPath(); g.arc(cx - r * 0.05, cy - r * 0.84, r * 0.03, 0, TAU); g.fill();
  g.strokeStyle = MU.ink; g.lineCap = 'round';
  for (const [a, len, lw] of [[-150, 0.4, 0.08], [-30, 0.6, 0.05]]) { const t = a * Math.PI / 180; g.lineWidth = r * lw; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(t) * r * len, cy + Math.sin(t) * r * len); g.stroke(); }
  g.fillStyle = MU.red; g.beginPath(); g.arc(cx, cy, r * 0.08, 0, TAU); g.fill();
}
/** A screen panel's woods at dusk: dark trunks, ferns, toadstools glowing at their feet, fireflies. */
function woods(seed) {
  return (g, x, y, w, h) => {
    const sky = g.createLinearGradient(0, y, 0, y + h); sky.addColorStop(0, '#9fc39a'); sky.addColorStop(0.55, '#6f9a6a'); sky.addColorStop(1, '#4a6a3e');
    g.fillStyle = sky; g.fillRect(x, y, w, h);
    for (let i = 0; i < 3; i++) {
      const tx = x + w * (0.12 + 0.36 * i + hash(i, seed) * 0.12), tw = w * (0.1 + hash(i, seed, 1) * 0.08);
      g.fillStyle = i % 2 ? '#5a4a36' : '#4a3a2a'; g.fillRect(tx, y, tw, h * 0.86);
    }
    g.fillStyle = '#3e5a30'; g.beginPath(); g.moveTo(x, y + h);
    for (let i = 0; i <= 8; i++) g.lineTo(x + w * i / 8, y + h * (0.8 - (i % 2) * 0.05 - hash(i, seed, 2) * 0.04));
    g.lineTo(x + w, y + h); g.fill();
    for (let i = 0; i < 4; i++) {
      const fx = x + w * (0.15 + i * 0.24 + hash(i, seed, 3) * 0.06), fy = y + h * (0.9 + hash(i, seed, 4) * 0.04), r = w * (0.08 + hash(i, seed, 5) * 0.05);
      g.fillStyle = MU.stalk; g.fillRect(fx - r * 0.22, fy - r * 0.9, r * 0.44, r * 0.9);
      g.fillStyle = i % 3 === 1 ? MU.tan : MU.red; g.beginPath(); g.ellipse(fx, fy - r * 0.9, r, r * 0.7, 0, Math.PI, TAU); g.fill();
      g.fillStyle = MU.spot; for (const d of [-0.45, 0.1, 0.5]) { g.beginPath(); g.arc(fx + d * r, fy - r * (1.1 + Math.abs(d) * -0.3), r * 0.12, 0, TAU); g.fill(); }
    }
    g.fillStyle = '#fff3a8';
    for (let i = 0; i < 7; i++) { g.beginPath(); g.arc(x + w * hash(i, seed, 6), y + h * (0.15 + hash(i, seed, 7) * 0.55), w * 0.02, 0, TAU); g.fill(); }
  };
}

/* ---------- the kinds ---------- */

/** What js/base-models-mushroom.js builds for each upright and wall kind: its parts, doors and default material. */
export const BUILT = {};
/** The rug's outline: circles [cx, cy, r] in painted units, from above. */
export const RUGS = { shrmrug: [[48, 48, 46]] };

function piece(id, name, w, h, price, mat, parts, { doors = [], inside, ...rest } = {}) {
  BUILT[id] = { parts, doors, inside, mat };
  const all = [...parts, ...doors.flatMap(d => d.parts)];
  return { id, name, group: GROUP, solo: true, w, h, price, ...rest, draw(x, b, vw, dir) { floorShadow(x, b, vw); paintParts(all, x, b, vw, dir, w * 32); } };
}
function wallPiece(id, name, w, price, mat, parts, rest = {}) {
  BUILT[id] = { parts, doors: [], mat };
  return { id, name, group: GROUP, solo: true, w, h: 1, layer: 'wall', price, ...rest, wall(x) { paintParts(parts, x, 96, w * 32, 0, w * 32); } };
}

/** The radiating gills on a cap-shaped back seen from beneath: lines from (x, h) out to its rim a by b. */
const gillLines = (x, h, z, a, b, n, c = MU.gillD) => Array.from({ length: n }, (_, i) => {
  const t = (i + 0.5) / n * Math.PI;
  return RD([x, h + 0.6, z], [x + a * 0.92 * Math.cos(t), h + b * 0.92 * Math.sin(t), z], 0.28, c, PL);
});

export const MUSHROOM_KINDS = [
  // a bed under a great spotted cap held up on two stalks, a stalk headboard, a red quilt dotted white
  piece('shrmbed', 'Mushroom canopy bed', 2, 2, 1450, 'gloss', [
    ...[[8, -24], [56, -24], [8, 26], [56, 26]].map(([x, z]) => S(x, 1.6, z, 2.6, 1.6, 2.6, MU.brownD, { m: 'wood', seg: 8 })),
    B(32, 6.5, 2, 52, 8, 56, MU.brown, { m: 'wood', r: 1.5 }),
    B(32, 12.5, 3, 50, 5, 53, MU.stalkL, { m: 'cloth', r: 2 }),
    B(32, 15.6, 9, 51, 2.4, 41, MU.red, { m: 'cloth', r: 1 }), B(32, 11.8, 29.6, 51, 7.4, 1.2, MU.red, { m: 'cloth', r: 0.6 }),
    B(32, 15.8, -12, 51, 2.8, 5, MU.stalkL, { m: 'cloth', r: 1 }),
    ...[[14, 2], [26, 14], [40, 4], [50, 18], [20, 24], [44, 26], [32, 22]].map(([x, z]) => S(x, 16.9, z, 2.4, 0.4, 2, MU.spot, { m: 'plain', seg: 6 })),
    ...dots([[12, 12], [24, 10.4], [36, 12.6], [48, 10.6]], 30.3, 1.4),
    ...[20, 44].map(x => S(x, 17.6, -20, 9, 3, 5, MU.stalkL, { m: 'cloth', seg: 12 })),
    B(32, 22, -28.5, 50, 30, 4, MU.stalk, { r: 3 }), B(32, 24, -26.3, 42, 22, 0.6, MU.gill, { m: 'plain', r: 2 }),
    ...gillLines(32, 13.5, -25.9, 20, 20, 9),
    ...[3.6, 60.4].flatMap(x => [stalk(x, 0, -12, 2.6, 60), moss(x, -12, 5, 5, 2.4)]),
    ...cap(32, 60, -4, 31, 24, MU.red, { sr: 1, g: 4, spots: 16, ss: 0.11, sz: 0.86, seed: 2 }),
  ]),

  // a chair: a spotted red cap for its seat on a stalk, a tan cap stood up behind for its back, gills to the sitter
  piece('shrmchair', 'Mushroom cap chair', 1, 1, 340, 'gloss', [
    moss(16, 0, 10, 10, 2.4),
    stalk(16, 0, 0, 5, 12),
    ...cap(16, 12, 0, 13, 5, MU.red, { sr: 5, g: 2, spots: 8, ss: 0.13, seed: 3 }),
    RD([16, 12, -6], [16, 15, -11], 2.2, MU.stalk),
    PR(16, 14, -12, halfEll(12, 24), 3, MU.tan),
    PR(16, 14.4, -10.2, halfEll(10.8, 22.4), 0.6, MU.gill, PL),
    ...gillLines(16, 14.4, -9.8, 10.8, 22.4, 9),
    ...dots([[10, 26], [21, 31], [15, 34.5], [23, 21], [9, 18.5]], -13.7, 1.8),
  ]),

  // a sofa: a stalk-cream base, two spotted red cushions, a red half-cap back, little tan toadstools for arms
  piece('shrmsofa', 'Mushroom cap sofa', 2, 1, 1100, 'gloss', [
    ...[[8, -9], [56, -9], [8, 9], [56, 9]].map(([x, z]) => S(x, 1.5, z, 2, 1.5, 2, MU.brownD, { m: 'wood', seg: 8 })),
    B(32, 7, 1, 58, 9, 26, MU.stalk, { r: 3 }),
    PR(32, 10.5, -11, halfEll(30, 27), 4, MU.red, CL),
    ...dots([[12, 17, 1.2], [22, 27], [32, 34, 1.3], [42, 27], [52, 17, 1.2], [27, 18, 0.8], [38, 20, 0.9], [32, 26, 0.7], [17, 24, 0.7], [47, 24, 0.7]], -8.7, 1.8),
    ...[18.5, 45.5].flatMap((x, i) => [
      B(x, 13.8, 3, 26, 5.2, 21, MU.red, { m: 'cloth', r: 2 }),
      ...[[-6, 6], [3, -3], [7, 8], [-2, 11]].map(([dx, z], j) => S(x + dx, 16.4, z, 1.9 - (i + j) % 2 * 0.4, 0.35, 1.6, MU.spot, { m: 'plain', seg: 6 })),
    ]),
    ...[5.6, 58.4].flatMap((x, i) => shroom(x, 2, 2, 3, 14, 5.4, 4.4, MU.tan, { spots: 4, seed: 4 + i, ss: 0.16 })),
  ]),

  // a toadstool table: a flat red cap dotted white on a thick stalk, a mossy foot
  piece('shrmtable', 'Toadstool table', 1, 1, 480, 'gloss', [
    moss(16, 0, 9, 9, 2.8),
    stalk(16, 0, 0, 4.2, 20),
    LA(16, 17, 0, [[4.2, 0], [13.4, 3]], MU.gill, { m: 'plain', gl: true }),
    LA(16, 20, 0, [[13.6, -0.6], [14.6, 0.6], [14.6, 2.2], [13.6, 3.6], [11, 4.4], [0, 4.6]], MU.red),
    ...[[0, 0, 2.4], [6, 2, 1.8], [-5, 4, 1.6], [-3, -6, 2], [4, -6, 1.5], [-8, -2, 1.3], [8, -3, 1.3], [1, 8, 1.6]].map(([dx, z, r]) => S(16 + dx, 24.7, z, r, 0.35, r, MU.spot, { m: 'plain', seg: 6 })),
    ...Array.from({ length: 8 }, (_, i) => { const a = i / 8 * TAU + 0.35; return S(16 + Math.sin(a) * 14.2, 21.6, Math.cos(a) * 14.2, 1.6, 1.3, 1.6, MU.spot, { m: 'plain', seg: 6 }); }),
  ]),

  // a desk: a tan cap-edged top on a stalk pedestal of drawers and a stalk leg, a toadstool and a book on it
  piece('shrmdesk', 'Mushroom desk', 2, 1, 980, 'gloss', [
    moss(53, 0, 7, 7, 2.4),
    B(13, 13.5, 0, 20, 25, 24, MU.stalk, { r: 3.5 }),
    ...[19, 8.5].flatMap(h => [B(13, h, 12.3, 16, 8, 0.8, MU.stalkL, { r: 1 }), ...knob(13, h, 13)]),
    stalk(53, 0, 0, 4, 26.3),
    B(32, 25.6, 0, 58, 1, 24, MU.gill, PL),
    B(32, 28, 0, 62, 3.4, 28, MU.tan, { r: 1.4 }),
    ...dots([[6, 28], [19, 28.2], [32, 27.8], [45, 28.2], [58, 28]], 14.2, 1.1),
    ...shroom(52, 29.7, -6, 1.4, 5, 4.4, 3.6, MU.red, { spots: 4, seed: 7 }),
    B(22, 30.7, -5, 9, 2, 7, MU.book1, { m: 'plain', r: 0.3 }), B(22.5, 32.5, -5, 8, 1.6, 6.4, MU.book2, { m: 'plain', r: 0.3 }),
    B(37, 29.9, 4, 10, 0.3, 8, MU.paper, { m: 'plain', r: 0.05 }),
  ]),

  // a wardrobe: a stalk-cream body, two doors with arched gill panels, a big spotted red cap for its top
  piece('shrmwardrobe', 'Mushroom wardrobe', 1, 1, 1250, 'gloss', [
    ...[[6, -9], [26, -9], [6, 8], [26, 8]].map(([x, z]) => S(x, 1.5, z, 2, 1.5, 2, MU.brownD, { m: 'wood', seg: 8 })),
    B(16, 4.5, 0, 28, 3, 26, MU.stalkD, { r: 1.4 }),
    B(16, 34, -1, 26, 62, 24, MU.stalk, { r: 4 }),
    ...cap(16, 65, -0.2, 15.8, 22, MU.red, { sr: 12, g: 3, spots: 11, seed: 5 }),
  ], {
    doors: [3.4, 28.6].map((hx, i) => {
      const x = i ? 22.4 : 9.6, s = i ? -1 : 1;
      return { hinge: [hx, 11.5], side: s, parts: [
        B(x, 33, 11.8, 12.2, 54, 1.4, MU.stalkL, { r: 1.2 }),
        PR(x, 26, 12.6, [[-4.4, 0], [4.4, 0], [4.4, 18], [3.2, 22], [0, 23.6], [-3.2, 22], [-4.4, 18]], 0.4, MU.gill, PL),
        ...[-2.2, 0, 2.2].map(dx => B(x + dx, 37, 12.85, 0.5, 18, 0.2, MU.gillD, { m: 'plain', r: 0.1 })),
        B(x, 15, 12.6, 8.8, 5, 0.4, MU.gill, { m: 'plain', r: 1 }),
        ...knob(x + s * 4.8, 33, 12.8),
      ] };
    }),
    inside: { x: 16, h: 33, w: 22, hh: 52, z: 11 },
  }),

  // a dresser: a stalk-cream chest of four drawers with red knobs, a red top dotted white, a little toadstool clump on it
  piece('shrmdresser', 'Mushroom dresser', 2, 1, 880, 'gloss', [
    ...[[7, -9], [57, -9], [7, 9], [57, 9]].map(([x, z]) => S(x, 1.6, z, 2.2, 1.6, 2.2, MU.brownD, { m: 'wood', seg: 8 })),
    B(32, 15.5, -1, 56, 25, 24, MU.stalk, { r: 3 }),
    ...[19, 45].flatMap(x => [21.5, 10.5].flatMap(h => [B(x, h, 11.3, 23, 9, 0.8, MU.stalkL, { r: 1 }), ...knob(x, h, 11.9)])),
    B(32, 27.6, -1, 58, 1, 25, MU.gill, PL),
    B(32, 29.6, 0, 62, 3.4, 28, MU.red, { r: 1.5 }),
    ...dots([[5, 29.6], [14, 29.4], [23, 29.8], [32, 29.4], [41, 29.8], [50, 29.4], [59, 29.6]], 14.2, 1.1),
    ...[[10, 4], [22, -6], [40, 6]].map(([x, z]) => S(x, 31.4, z, 2, 0.35, 1.8, MU.spot, { m: 'plain', seg: 6 })),
    S(52, 32.2, -5, 6, 1.8, 5, MU.moss, { m: 'cloth', seg: 10 }),
    ...shroom(50, 32.4, -5, 1.4, 5, 4, 3.4, MU.red, { spots: 4, seed: 9 }), ...shroom(55.5, 32.4, -3, 1, 3, 2.8, 2.4, MU.tan, { seed: 2 }),
  ]),

  // a tiered shelf: three round tan caps stacked up a stalk, a red cap crowning it, jars, books and a potted toadstool
  piece('shrmshelf', 'Mushroom tier shelf', 1, 1, 620, 'gloss', [
    moss(16, 0, 11, 11, 2.8),
    stalk(16, 0, 0, 3, 64),
    ...[18, 36, 54].flatMap(h => [
      LA(16, h - 2, 0, [[3, 0], [14, 2]], MU.gill, { m: 'plain', gl: true }),
      LA(16, h, 0, [[14.5, 0], [14.8, 1.2], [13.8, 2.4], [0, 2.5]], MU.tan),
    ]),
    ...cap(16, 64, 0, 8, 7, MU.red, { sr: 3, spots: 6, seed: 6 }),
    C(7.5, 23.2, 3, 2.4, 5, '#bfe0e8', { m: 'gloss' }), C(7.5, 26.2, 3, 2.6, 1, MU.brown, WD),
    C(24.5, 22.8, 4, 2, 4, '#e8c8a0', { m: 'gloss' }), C(24.5, 25.2, 4, 2.2, 0.8, MU.red, GL),
    ...[[7, MU.book1, 7], [9.4, MU.book2, 6.2]].map(([x, c, hh]) => B(x, 38.5 + hh / 2, 1, 2.2, hh, 7, c, { m: 'plain', r: 0.3 })),
    C(24, 40.5, 4, 2.8, 4, MU.clay, { rb: 2.2 }), ...shroom(24, 42.5, 4, 0.9, 3, 3, 2.6, MU.red, { spots: 3, seed: 8 }),
    ...shroom(9, 56.5, 3, 1.1, 4, 3.6, 3, MU.tan, { seed: 3 }), S(23, 57.6, 3, 2.6, 1.2, 2.2, MU.moss, { m: 'cloth', seg: 8 }),
  ]),

  // a lamp: a glowing red cap dotted white on a stalk from a mossy foot, a little toadstool beside it
  piece('shrmlamp', 'Mushroom cap lamp', 1, 1, 380, 'gloss', [
    moss(16, 0, 9, 9, 3),
    stalk(16, 0, 0, 2.8, 22),
    ...cap(16, 22, 0, 12, 11, MU.glowR, { m: 'glow', sr: 2.8, gill: MU.glowG, gm: 'glow', spots: 9, seed: 4 }),
    ...shroom(25.5, 1, 6, 1.4, 5, 3.8, 3.4, MU.red, { spots: 3, seed: 1 }),
  ], { glow: [MU.glowR, MU.glowG] }),

  // a floor lamp: a tall stalk under a broad glowing tan cap, a smaller glowing toadstool sprouting at its foot
  piece('shrmfloorlamp', 'Mushroom floor lamp', 1, 1, 520, 'gloss', [
    moss(16, 0, 10, 10, 3),
    stalk(16, 0, 0, 2.4, 58),
    ...cap(16, 58, 0, 13, 13, MU.glowT, { m: 'glow', sr: 2.4, gill: MU.glowG, gm: 'glow', spots: 10, seed: 3 }),
    ...shroom(7, 1, 4, 1.6, 21, 5.6, 5, MU.glowR, { m: 'glow', gill: MU.glowG, gm: 'glow', spots: 4, seed: 6 }),
  ], { glow: [MU.glowT, MU.glowR, MU.glowG] }),

  // a clock: a fat stalk like a toadstool house, a round arched door, the dial in a bark bezel, a spotted red cap
  piece('shrmclock', 'Mushroom clock', 1, 1, 780, 'gloss', [
    moss(16, 0, 12, 12, 3),
    LA(16, 0, 0, [[10.5, 0], [11.5, 4], [11, 14], [9.6, 30], [8.4, 38], [8.6, 40]], MU.stalk),
    PR(16, 3, 9.8, [[-4, 0], [4, 0], [4, 7], [2.8, 9.6], [0, 10.6], [-2.8, 9.6], [-4, 7]], 3, MU.brown, WD), S(18.4, 7.5, 11.5, 0.7, 0.7, 0.5, MU.yellow, { m: 'gloss', seg: 6 }),
    DS(16, 24, 9.2, 6.6, 2.4, MU.brownD, WD),
    PC(16, 24, 10.6, 10.8, 10.8, dial),
    ...cap(16, 40, 0, 14.5, 13, MU.red, { sr: 8.6, g: 2.4, spots: 10, seed: 8 }),
  ]),

  // a folding screen: three stalk-cream panels painted with toadstool woods at dusk, each under a spotted red half-cap
  piece('shrmscreen', 'Mushroom folding screen', 2, 1, 680, 'gloss', [
    ...[[11, 4, 1], [32, -4, 2], [53, 4, 3]].flatMap(([x, z, seed]) => [
      ...[-7, 7].map(dx => S(x + dx, 1.4, z, 1.6, 1.4, 1.6, MU.brownD, { m: 'wood', seg: 8 })),
      B(x, 29.5, z, 20, 53, 2, MU.stalk, { r: 0.8 }),
      PC(x, 29.5, z + 1.15, 16.4, 46, woods(seed)),
      B(x, 55.4, z, 21, 1.2, 2.6, MU.gill, PL),
      PR(x, 55.6, z, halfEll(11, 9), 3, MU.red),
      ...dots([[x - 6, 58.4, 1], [x + 1, 62.4, 1.1], [x + 6.5, 57.6, 0.8], [x - 2.4, 57.4, 0.7]], z + 1.65, 1.2),
    ]),
    ...[21.5, 42.5].flatMap(x => [14, 46].map(h => B(x, h, 0, 1, 3, 8.4, MU.brown, { m: 'wood', r: 0.3 }))),
  ]),

  // a wall mirror: an oval glass in a stalk-cream frame under a spotted red cap, moss and toadstools at its foot
  wallPiece('shrmmirror', 'Mushroom wall mirror', 1, 480, 'gloss', [
    DS(16, 56, 0.8, 10, 1.6, MU.stalk, { ry: 14 }),
    RG(16, 56, 1.7, 9.1, 0.5, MU.stalkD, { ry: 13.1 }),
    DS(16, 56, 1.75, 8.2, 0.4, MU.mirror, { ry: 12.2 }),
    B(16, 66, 1.5, 24, 1.4, 2, MU.gill, PL),
    PR(16, 66.2, 1.4, halfEll(13, 12), 2.4, MU.red),
    ...dots([[9, 69, 1.1], [16, 74.5, 1.3], [22.5, 70, 1], [12.5, 75.5, 0.7], [20, 76.5, 0.7]], 2.7, 1.3),
    S(13, 43.4, 1.8, 6, 2, 1.4, MU.moss, { m: 'cloth', seg: 8 }),
    ...shroom(21, 42.6, 2.6, 0.9, 3, 2.6, 2.2, MU.tan, { sz: 0.9 }), ...shroom(9, 43, 2.6, 0.7, 2.4, 2, 1.8, MU.red),
  ]),

  // a wall lamp: a bark plaque, three toadstools sprouting from it with glowing caps, a tuft of moss
  wallPiece('shrmwalllamp', 'Mushroom wall lamp', 1, 320, 'gloss', [
    DS(16, 58, 0.6, 9, 1.2, MU.bark, { ry: 11, m: 'wood' }),
    S(16, 49.4, 1.4, 6, 2, 1.2, MU.moss, { m: 'cloth', seg: 8 }),
    RD([15, 52, 1.2], [9, 59, 4.4], 1.1, MU.stalk), RD([17, 52, 1.2], [23, 61, 4.4], 1.1, MU.stalk), RD([16, 52, 1.2], [16, 64.5, 4.2], 1.3, MU.stalk),
    ...cap(9, 59, 4.4, 5, 4.5, MU.glowR, { m: 'glow', sr: 1.1, gill: MU.glowG, gm: 'glow', spots: 3, seed: 2, sz: 0.7 }),
    ...cap(23, 61, 4.4, 5.4, 5, MU.glowR, { m: 'glow', sr: 1.1, gill: MU.glowG, gm: 'glow', spots: 3, seed: 5, sz: 0.7 }),
    ...cap(16, 64.5, 4.2, 6.4, 6, MU.glowT, { m: 'glow', sr: 1.3, gill: MU.glowG, gm: 'glow', spots: 4, seed: 7, sz: 0.6 }),
  ], { glow: [MU.glowR, MU.glowT, MU.glowG] }),

  // a wall shelf: two bracket fungi grown out of the wall, a jar, books and a potted toadstool on them
  wallPiece('shrmwallshelf', 'Mushroom bracket shelf', 1, 420, 'gloss', [
    C(13, 62.4, 0, 12, 1, MU.gill, { m: 'plain', half: true }),
    C(13, 64.2, 0, 12.8, 2.6, MU.tan, { half: true, rb: 12.4 }),
    C(19, 46.6, 0, 11, 1, MU.gill, { m: 'plain', half: true }),
    C(19, 48.4, 0, 11.6, 2.6, MU.brownL, { half: true, rb: 11.2 }),
    C(7.5, 68, 6, 2.2, 5, '#bfe0e8', GL), C(7.5, 71, 6, 2.4, 1, MU.brown, WD),
    B(15.5, 69, 5, 2.4, 7, 6, MU.book1, { m: 'plain', r: 0.3 }), B(18.2, 68.4, 5, 2.4, 5.8, 6, MU.book3, { m: 'plain', r: 0.3 }),
    C(23, 51.6, 5, 2.4, 4, MU.clay, { rb: 1.9 }), ...shroom(23, 53.6, 5, 0.8, 3, 2.8, 2.4, MU.red, { spots: 3, seed: 4 }),
    ...shroom(13, 49.7, 5, 1, 3.4, 3.2, 2.8, MU.tan, { seed: 6 }),
  ]),

  // a clump of toadstools on a mossy mound: red ones spotted white, a tan and a brown, big to small
  piece('shrmcluster', 'Mushroom cluster', 1, 1, 220, 'gloss', [
    moss(16, 0, 14, 13, 4.4), S(8, 3.6, -4, 5, 2.4, 4, MU.mossL, { m: 'cloth', seg: 8 }),
    ...shroom(12, 2.4, -3, 2.6, 16, 7.5, 7, MU.red, { spots: 7, seed: 2 }),
    ...shroom(21.5, 2.4, -5, 2, 11, 5.5, 5, MU.tan, { seed: 4 }),
    ...shroom(22, 2.6, 5, 1.6, 7, 4.4, 4, MU.red, { spots: 4, seed: 6 }),
    ...shroom(9, 2.6, 6, 1.4, 6, 3.8, 3.4, MU.brown, { seed: 3 }),
    ...shroom(16, 3, 8, 1.1, 4, 2.8, 2.4, MU.tan, { seed: 5 }),
  ]),

  // a seat of a fallen log: moss along its back, cut ends, bracket fungi and toadstools growing about it
  piece('shrmlog', 'Mossy mushroom log', 2, 1, 560, 'wood', [
    B(32, 8.5, 0, 55, 15, 16, MU.bark, { r: 7.4, seg: 4 }),
    ...[4.6, 59.4].flatMap(x => [DS(x, 8.5, 0, 7, 0.8, MU.tanL, { ax: 'x' }), DS(x + (x < 32 ? -0.3 : 0.3), 8.5, 0, 3.6, 0.6, MU.tanD, { ax: 'x' })]),
    S(22, 15.4, -1, 11, 2.4, 6.5, MU.moss, { m: 'cloth', seg: 10 }), S(41, 15.6, -1.5, 8, 2.2, 6, MU.mossL, { m: 'cloth', seg: 10 }),
    S(53, 15, 0, 5, 2, 5, MU.moss, { m: 'cloth', seg: 8 }),
    ...[[47, 10.5, 5], [52.5, 6.5, 4], [43, 6, 3.2]].map(([x, h, r]) => C(x, h, 7.4, r, 1.4, MU.tan, { m: 'gloss', half: true, rb: r * 0.9 })),
    ...shroom(10, 0, 11.5, 1.4, 6, 4, 3.4, MU.red, { spots: 4, seed: 3 }), ...shroom(15.5, 0, 12.8, 1, 4, 2.8, 2.4, MU.tan, { seed: 2 }),
    ...shroom(7, 15, -2.5, 1.2, 4.5, 3.6, 3, MU.red, { spots: 3, seed: 5 }),
    moss(26, 11, 5, 3, 1.6), moss(38, -12, 6, 3, 1.6),
  ]),

  // a Shroomish to sit on: a round tan body on stubby feet, its green cap with darker spots, a shy face
  piece('shrmshroomish', 'Shroomish stool', 1, 1, 360, 'gloss', [
    ...[11, 21].map(x => S(x, 1.8, 6, 3, 1.8, 3.4, MU.beigeD, { m: 'gloss', seg: 8 })),
    S(16, 9, 0, 12, 8.6, 11.5, MU.beige, { m: 'gloss', seg: 16 }),
    LA(16, 11.4, 0, DOME(13, 7.2), MU.green),
    ...[[0, 7, 0], [7.5, 4.6, 6], [-7, 4.6, 5], [5, 5, -8], [-6, 4.8, -7], [10.6, 2, -2], [-10.8, 2, 0], [2, 3.4, 10.4]].map(([dx, h, z], i) => S(16 + dx, 11.4 + h, z, i ? 2.2 : 2.8, 0.7 + (i ? 0.6 : 0), i ? 2 : 2.8, MU.greenD, { m: 'plain', seg: 6 })),
    ...[12.4, 19.6].flatMap(x => [S(x, 7.6, 10.4, 1.3, 1.9, 1, MU.black, { m: 'plain', seg: 6 }), S(x - 0.3, 8.4, 11.2, 0.45, 0.55, 0.3, MU.white, { m: 'plain', seg: 6 })]),
    S(16, 4.8, 10.6, 1.4, 0.6, 0.8, '#a84a3a', { m: 'plain', seg: 6 }),
  ]),

  // an end table of a Foongus: its cream body and face below, its cap red over white like a Poké Ball for the top
  piece('shrmfoongus', 'Foongus end table', 1, 1, 420, 'gloss', [
    ...[12, 20].map(x => S(x, 1.4, 4, 2.6, 1.4, 2.8, MU.beigeD, { m: 'gloss', seg: 8 })),
    LA(16, 0, 0, [[9, 0.6], [9.6, 3], [9.2, 9], [8, 14], [7.6, 17]], MU.beige),
    ...[13.2, 18.8].map(x => S(x, 10.4, 8.4, 1.1, 1.7, 0.8, MU.black, { m: 'plain', seg: 6 })),
    B(16, 6.6, 8.7, 4, 0.8, 0.6, MU.black, { m: 'plain', r: 0.3 }),
    LA(16, 14.5, 0, [[7.6, 0], [13.8, 2]], MU.gill, { m: 'plain', gl: true }),
    C(16, 18, 0, 14.2, 3, MU.spot),
    C(16, 20, 0, 14.4, 1, MU.black, PL),
    LA(16, 20.5, 0, [[14.2, 0], [14.2, 1.6], [13, 3.4], [10, 4.4], [0, 4.6]], MU.red),
    ...[-1, 1].flatMap(s => [RD([16 + s * 8, 11, 0], [16 + s * 11.6, 8, 2], 1.2, MU.beige), ...cap(16 + s * 12, 8.6, 2, 3.4, 3, MU.red, { sr: 1.2, gill: MU.spot, spots: 0 })]),
  ]),

  // a lamp of a Parasect: the orange bug at its foot, a stalk up to the broad cap it carries, glowing, spotted yellow
  piece('shrmparasect', 'Parasect cap lamp', 1, 1, 540, 'gloss', [
    S(16, 5, 1, 11, 5, 9, MU.orange, { m: 'gloss', seg: 14 }),
    ...[-1, 1].flatMap(s => [S(16 + s * 6.4, 3.4, 9.6, 2.2, 2.4, 2.4, MU.yellow, { m: 'gloss', seg: 8 }), S(16 + s * 2.8, 6.6, 9.2, 1.3, 1.3, 0.9, MU.white, { m: 'plain', seg: 6 })]),
    ...[-1, 1].flatMap(s => [-4, 1, 6].map(dz => S(16 + s * 10.6, 1.4, dz - 1, 1.6, 1.4, 1.6, MU.orange, { m: 'gloss', seg: 6 }))),
    stalk(16, 8, -1, 2.4, 40),
    ...cap(16, 48, -1, 15, 9, MU.glowO, { m: 'glow', sr: 2.4, gill: MU.glowG, gm: 'glow', spots: 10, spot: MU.yellow, ss: 0.17, seed: 5 }),
  ], { glow: [MU.glowO, MU.glowG] }),

  // a glow lamp of a Shiinotic: a slender lilac body on a mossy foot, its arms' glowing bulbs, a pink cap spotted blue
  piece('shrmshiinotic', 'Shiinotic glow lamp', 1, 1, 620, 'gloss', [
    moss(16, 0, 10, 10, 2.6),
    LA(16, 0, 0, [[9, 0.6], [8.6, 3], [6, 10], [4, 22], [3.6, 34], [4.2, 38]], MU.lav),
    ...[-1, 1].flatMap(s => [
      RD([16 + s * 3.4, 26, 0], [16 + s * 9.6, 30, 3], 0.7, MU.lav), RD([16 + s * 9.6, 30, 3], [16 + s * 11, 36, 3], 0.7, MU.lav),
      S(16 + s * 11, 37.6, 3, 1.9, 1.9, 1.9, MU.blue, { m: 'glow', seg: 8 }),
      S(16 + s * 1.5, 33, 3.6, 0.7, 1, 0.5, MU.ink, { m: 'plain', seg: 6 }),
    ]),
    ...cap(16, 38, 0, 12.4, 16, MU.pink, { m: 'glow', sr: 4, gill: MU.glowG, gm: 'glow', spots: 9, spot: MU.blue, sm: 'glow', ss: 0.15, seed: 6 }),
  ], { glow: [MU.pink, MU.blue, MU.glowG] }),

  // a Breloom on a mossy stump: green legs and arms, a cream body and tail, its green cap seeded red on top
  piece('shrmbreloom', 'Breloom figure', 1, 1, 900, 'gloss', [
    C(16, 2.5, 0, 12, 5, MU.bark, WD), C(16, 5.3, 0, 11.4, 0.6, MU.moss, CL),
    ...[12.5, 19.5].flatMap(x => [C(x, 9.5, 0, 1.8, 8, MU.green), S(x, 6.4, 1.6, 2.2, 1.4, 3, MU.green, { m: 'gloss', seg: 8 })]),
    S(16, 18, 0, 6, 7, 5, MU.beige, { m: 'gloss', seg: 12 }),
    RD([16, 14, -4], [16, 25, -10], 1.6, MU.beige), S(16, 27.4, -11.2, 3.6, 3.4, 3, MU.green, { m: 'gloss', seg: 10 }),
    ...[[14.4, 29.6], [17.6, 29.6], [16, 30.8]].map(([x, h]) => S(x, h, -11.2, 1, 1, 1, MU.red, { m: 'gloss', seg: 6 })),
    ...[-1, 1].flatMap(s => [RD([16 + s * 5, 21, 0], [16 + s * 9.4, 14, 2], 1.3, MU.green), S(16 + s * 9.6, 13, 2.2, 1.6, 1.6, 1.4, MU.green, { m: 'gloss', seg: 8 })]),
    S(16, 28.5, 1, 4.6, 4, 4.2, MU.beige, { m: 'gloss', seg: 10 }),
    S(16, 27, 4.8, 1.5, 1, 1.4, MU.beige, { m: 'gloss', seg: 6 }),
    ...[14.2, 17.8].map(x => S(x, 29, 4.4, 0.7, 1, 0.5, MU.ink, { m: 'plain', seg: 6 })),
    LA(16, 30.5, 0, DOME(8.4, 6.4), MU.green),
    ...[[13, 36, 0], [19, 36, 0], [16, 36.8, -2], [16, 36.6, 2.4]].map(([x, h, z]) => S(x, h, z, 1.1, 1.1, 1.1, MU.red, { m: 'gloss', seg: 6 })),
  ]),

  // a giant toadstool to stand under: a tall stalk with a skirt, a broad spotted red cap, a little tan one at its foot
  piece('shrmparasol', 'Mushroom parasol', 1, 1, 640, 'gloss', [
    moss(16, 0, 12, 12, 2.8),
    stalk(16, 0, 0, 3.2, 66),
    LA(16, 50, 0, [[6.2, 0], [5.8, 1], [3.3, 3]], MU.stalkL),
    ...cap(16, 66, 0, 15.6, 15, MU.red, { sr: 3.2, spots: 12, seed: 9 }),
    ...shroom(24, 1, 6, 1.4, 6, 4, 3.4, MU.tan, { seed: 3 }),
  ]),

  // a forager's basket of wicker, heaped with red, tan and brown mushrooms and a few leaves
  piece('shrmbasket', 'Mushroom forage basket', 1, 1, 260, 'wood', [
    LA(16, 0, 0, [[8, 0], [9, 1], [11, 6], [12, 11], [12.4, 12]], MU.wicker),
    ...[4, 8].map(h => RG(16, h, 0, 9.6 + h * 0.25, 0.5, MU.wickerD, { flat: true })),
    RG(16, 12, 0, 12.4, 0.8, MU.wickerD, { flat: true }),
    C(16, 11, 0, 11.8, 1, MU.soilD, PL),
    RG(16, 12, 0, 11, 0.8, MU.wickerD, { a0: 0, arc: Math.PI }),
    ...[[9, -3, 0.5], [22, 3, -0.4], [12.6, 6.6, 0.2]].map(([x, z, a]) => S(x, 12.4, z, 3.4, 0.6, 1.6, a > 0 ? MU.green : MU.moss, { m: 'cloth', seg: 6 })),
    ...shroom(11, 10.6, -1.5, 1.4, 2, 4.6, 4, MU.red, { spots: 4, seed: 2 }),
    ...shroom(20, 10.6, 1, 1.2, 2.6, 4, 3.6, MU.tan, { seed: 4 }),
    ...shroom(15.5, 10.6, -5, 1.1, 4.4, 3.8, 3.6, MU.brown, { seed: 6 }),
    ...shroom(21, 10.6, -5.5, 1, 1.6, 3.4, 3, MU.red, { spots: 3, seed: 7 }),
    ...shroom(10.5, 10.6, 5, 1, 1.4, 3.2, 3, MU.tan, { seed: 8 }),
  ]),

  // a round rug of moss with a fairy ring: a darker band of grass, red and tan toadstools round it, clover in the middle
  { id: 'shrmrug', name: 'Mushroom fairy ring rug', group: GROUP, solo: true, w: 3, h: 3, layer: 'rug', price: 760, high: 0.04, side: 'c', flat() {
    const g = ctx(), [[cx, cy, r]] = RUGS.shrmrug;
    oval(cx, cy, r, r, MU.mossD); oval(cx, cy, r - 1.4, r - 1.4, MU.moss);
    const field = g.createRadialGradient(cx, cy, 0, cx, cy, r);
    field.addColorStop(0, MU.mossL); field.addColorStop(0.7, MU.moss); field.addColorStop(1, MU.mossD);
    g.fillStyle = field; g.beginPath(); g.arc(cx, cy, r - 2, 0, TAU); g.fill();
    g.strokeStyle = MU.mossD; g.lineWidth = 7; g.beginPath(); g.arc(cx, cy, 30, 0, TAU); g.stroke();
    g.strokeStyle = 'rgba(40,70,30,0.35)'; g.lineWidth = 0.6;
    for (let i = 0; i < 160; i++) {
      const a = hash(i, 11) * TAU, d = Math.sqrt(hash(i, 12)) * (r - 3), x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + (hash(i, 13) - 0.5) * 1.6, y - 1.6); g.stroke();
    }
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * TAU + 0.3, d = 6 + hash(i, 14) * 12, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
      g.fillStyle = MU.mossL; for (let p = 0; p < 3; p++) { const b = p / 3 * TAU; g.beginPath(); g.arc(x + Math.cos(b) * 1.1, y + Math.sin(b) * 1.1, 1.1, 0, TAU); g.fill(); }
      if (i % 3 === 0) oval(x, y, 0.8, 0.8, MU.white);
    }
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU, x = cx + Math.cos(a) * 30, y = cy + Math.sin(a) * 30, s = 3.6 + hash(i, 15) * 1.4, red = i % 3 !== 2;
      oval(x + 0.8, y + 1, s, s, 'rgba(30,40,20,0.35)');
      ovalShade(x, y, s, s, red ? MU.red : MU.tan);
      if (red) for (let p = 0; p < 4; p++) { const b = p / 4 * TAU + i; oval(x + Math.cos(b) * s * 0.5, y + Math.sin(b) * s * 0.5, s * 0.17, s * 0.17, MU.spot); }
      oval(x - s * 0.3, y - s * 0.35, s * 0.25, s * 0.15, 'rgba(255,255,255,0.4)');
    }
  } },
];
