/* base-furniture-rattan.js  -  the Rattan set (furniture expansion session d, 2026-10-17): a breezy beach house. Honey
   cane and wicker (the weave painted as a crosshatch), bent bamboo frames, cushions in white, sea blue and coral, a few
   tropical leaf prints. All decoration, all solo, fixed colours.
   An upright piece is a list of parts in painted units (32 a tile): `x` across from the left of its front, `h` up from
   the floor (a wall piece's from the foot of its strip), `z` out to the front from its middle (a wall piece's from the
   wall). They're painted here from any side, and js/base-models-rattan.js builds the same list as 3D parts (BUILT), so
   picture and model agree. `m: 'weave'` is woven cane (crosshatched here, the cloth weave in 3D); `wv` adds the hatch
   to another finish. A `pic` part (a dial, a leaf print) is painted on the front only, and the model wears that crop of
   the painting. The jute rug is painted from above; its outline is RUGS. */

import { sh, oval, ovalShade, floorShadow, ctx, glass as glassPane } from './base-paint.js';

export const RT = {
  cane: '#dba862', caneL: '#efcc8c', caneD: '#a8743a', bam: '#cfae62', bamD: '#9a7a36', white: '#f7f4ec', sea: '#3f9cc6',
  seaL: '#a6d8ec', coral: '#f0785c', coralL: '#f8b4a0', leaf: '#3f9a58', leafD: '#2a7040', jute: '#c9a874', juteD: '#9e7e4c',
  mirror: '#cfe4ee', brass: '#d8b060', dark: '#3e3630', lamp: '#fbe2a4', soil: '#5e4028', trunk: '#8a6a3a', sand: '#f0e0b8',
};
const GROUP = 'Rattan';
const TAU = Math.PI * 2;

/* ---------- parts ---------- */
/** A rounded box centred at x, h, z. */
const B = (x, h, z, w, hh, d, c, o) => ({ t: 'box', x, h, z, w, hh, d, c, r: 1.5, ...o });
/** An upright cylinder centred at h (`rb` its bottom radius). */
const C = (x, h, z, r, hh, c, o) => ({ t: 'cyl', x, h, z, r, hh, c, ...o });
/** A ball rx x ry x rz. */
const S = (x, h, z, rx, ry, rz, c, o) => ({ t: 'ball', x, h, z, rx, ry, rz, c, ...o });
/** A rod from a to b, each [x, h, z]. */
const RD = (a, b, r, c, o) => ({ t: 'rod', a, b, r, c, x: (a[0] + b[0]) / 2, h: (a[1] + b[1]) / 2, z: (a[2] + b[2]) / 2, ...o });
/** A flat outline [[dx, dh]...] about x, h, d deep. */
const PR = (x, h, z, pts, d, c, o) => ({ t: 'prism', x, h, z, pts, d, c, ...o });
/** A lathe standing on h, its profile [[r, up]...]. */
const LA = (x, h, z, pts, c, o) => ({ t: 'lathe', x, h, z, pts, c, ...o });
/** A disc facing the front, th thick (`ry` for an oval). */
const DS = (x, h, z, r, th, c, o) => ({ t: 'disc', x, h, z, r, th, c, ...o });
/** A ring r round of a tube tr thick, facing the front (`ry` an oval, `flat` lies it down, `arc` from `rot` part of one). */
const RG = (x, h, z, r, tr, c, o) => ({ t: 'ring', x, h, z, r, tr, c, ...o });
/** A picture on a front face, w x hh centred at x, h: `fn(g, left, top, w, hh)` paints it. */
const PC = (x, h, z, w, hh, fn, o) => ({ t: 'pic', x, h, z, w, hh, fn, ...o });

const W8 = { m: 'weave' }, WD = { m: 'wood' }, CL = { m: 'cloth' }, PL = { m: 'plain' };

/** A bamboo pole standing from h0 to h1, its nodes banded. */
const pole = (x, z, h0, h1, r, c = RT.bam) => {
  const out = [C(x, (h0 + h1) / 2, z, r, h1 - h0, c, WD)], n = Math.max(1, Math.round((h1 - h0) / 16));
  for (let i = 1; i <= n; i++) { const h = h0 + (h1 - h0) * (i - 0.5) / n; out.push(C(x, h, z, r + 0.35, 0.9, RT.bamD, { m: 'wood', seg: 8 })); }
  return out;
};
/** A palm frond in the front plane: from x, h at angle `ang` (radians from across), len long, its leaflets serrated. */
function frond(x, h, z, len, ang, wid, c, droop = 0.4) {
  const N = 12, ca = Math.cos(ang), sa = Math.sin(ang), up = [], lo = [];
  const at = (t) => [ca * len * t, sa * len * t - droop * len * t * t];
  for (let i = 0; i <= N; i++) {
    const t = i / N, [px, ph] = at(t), [qx, qh] = at(Math.min(1, t + 0.02)), dl = Math.hypot(qx - px, qh - ph) || 1;
    const nx = -(qh - ph) / dl, nh = (qx - px) / dl, ww = wid * Math.pow(Math.sin(Math.PI * Math.min(t, 0.97)), 0.7) * (i % 2 ? 0.45 : 1);
    up.push([px + nx * ww, ph + nh * ww]); lo.push([px - nx * ww * 0.8, ph - nh * ww * 0.8]);
  }
  return PR(x, h, z, [...up, ...lo.reverse()], 0.6, c, { m: 'plain' });
}
/** A pot of leaves: a white pot r round on h and a few broad leaves. */
const potPlant = (x, h, z, r, hh, s = 1) => [
  C(x, h + hh / 2, z, r, hh, RT.white, { rb: r * 0.78, m: 'gloss' }),
  frond(x, h + hh, z + 0.5, 9 * s, 1.15, 2.4 * s, RT.leaf, 0.2), frond(x, h + hh, z - 0.5, 8 * s, 2.1, 2.4 * s, RT.leafD, 0.2),
  frond(x, h + hh, z + 1, 7 * s, 0.45, 2.2 * s, RT.leafD, 0.3), frond(x, h + hh, z, 7.5 * s, 2.75, 2.2 * s, RT.leaf, 0.3),
];

/* ---------- painting the parts ---------- */

const alphaOf = (hex, a) => { const v = parseInt(hex.slice(1), 16); return `rgba(${v >> 16},${(v >> 8) & 255},${v & 255},${a})`; };
function grad(g, x0, y0, x1, y1, c, m) {
  const l = g.createLinearGradient(x0, y0, x1, y1);
  if (m === 'metal') [[0, sh(c, 2)], [0.25, c], [0.55, sh(c, -1)], [0.8, sh(c, 1)], [1, sh(c, -1)]].forEach(s => l.addColorStop(...s));
  else if (m === 'glow') [[0, sh(c, 2)], [0.5, sh(c, 1)], [1, c]].forEach(s => l.addColorStop(...s));
  else [[0, sh(c, 1)], [0.35, c], [1, sh(c, -1)]].forEach(s => l.addColorStop(...s));
  return l;
}
/** The cane's crosshatch inside the current path. */
function hatch(x0, y0, x1, y1, c) {
  const g = ctx(), H = y1 - y0;
  g.save(); g.clip(); g.globalAlpha *= 0.5; g.strokeStyle = sh(c, -2); g.lineWidth = 0.45; g.beginPath();
  for (let t = -H; t < x1 - x0; t += 2.2) { g.moveTo(x0 + t, y0); g.lineTo(x0 + t + H, y1); g.moveTo(x0 + t, y1); g.lineTo(x0 + t + H, y0); }
  g.stroke(); g.restore();
}
function rbx(x, y, w, h, r, c, m, wv) {
  if (w <= 0 || h <= 0) return;
  const g = ctx();
  if (m === 'glass') { g.save(); g.globalAlpha *= 0.4; glassPane(x, y, w, h, '#cfe8f4'); g.restore(); return; }
  g.fillStyle = grad(g, x, y, x + w * 0.3, y + h, c, m); g.beginPath(); g.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); g.fill();
  if (wv) hatch(x, y, x + w, y + h, c);
  if (h > 3 && w > 3) { g.save(); g.globalAlpha *= 0.5; g.fillStyle = sh(c, 2); g.fillRect(x + Math.min(r, w / 2) * 0.6, y + 0.3, w - Math.min(r, w / 2) * 1.2, 0.6); g.restore(); }
}
function poly(pts, c, m, horiz, wv) {
  const g = ctx(), xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  if (m === 'glass') { g.save(); g.globalAlpha *= 0.35; }
  if (horiz) {
    const l = g.createLinearGradient(x0, 0, x1, 0);
    l.addColorStop(0, sh(c, -1)); l.addColorStop(0.3, sh(c, 1)); l.addColorStop(0.55, c); l.addColorStop(1, sh(c, -2));
    g.fillStyle = m === 'glass' ? '#cfe8f4' : l;
  } else g.fillStyle = m === 'glass' ? '#cfe8f4' : grad(g, x0, y0, x1, y1, c, m);
  g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill();
  if (wv) hatch(x0, y0, x1, y1, c);
  if (m === 'glass') g.restore();
}
function ball(cx, cy, rx, ry, c, m, wv) {
  const g = ctx();
  if (m === 'glow') { const t = g.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry)); t.addColorStop(0, '#ffffff'); t.addColorStop(0.4, sh(c, 1)); t.addColorStop(1, c); g.fillStyle = t; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, TAU); g.fill(); return; }
  if (m === 'glass') { g.save(); g.globalAlpha *= 0.4; oval(cx, cy, rx, ry, '#dff0f8'); g.restore(); return; }
  if (m === 'plain') oval(cx, cy, rx, ry, c); else ovalShade(cx, cy, rx, ry, c);
  if (wv) { g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, TAU); hatch(cx - rx, cy - ry, cx + rx, cy + ry, c); }
  if (m === 'gloss' || m === 'metal') { g.save(); g.globalAlpha *= 0.55; oval(cx - rx * 0.38, cy - ry * 0.42, rx * 0.22, ry * 0.14, '#ffffff'); g.restore(); }
}
/** Wrapped cane on a stroked line: short dark dashes over it. */
function wrap(g, c, lw) { g.save(); g.setLineDash([0.6, 1]); g.strokeStyle = sh(c, -2); g.globalAlpha *= 0.55; g.lineWidth = lw; g.stroke(); g.restore(); }

/** Paints parts seen from `dir` (0 front, 2 back, 1 / 3 the sides), on a view vw wide standing on line b; W is the
    piece's front width in units. */
function paintParts(parts, x0, b, vw, dir, W) {
  const side = dir % 2 === 1, sg = dir === 3 ? -1 : 1, g = ctx();
  const U = (px, pz) => (dir === 0 ? x0 + px : dir === 2 ? x0 + W - px : x0 + vw / 2 + sg * pz);
  const key = (q) => q.k ?? (dir === 0 ? q.z : dir === 2 ? -q.z : sg * (W / 2 - q.x));
  const list = parts.map((q, i) => [key(q), i, q]).sort((a, c) => a[0] - c[0] || a[1] - c[1]).map(e => e[2]);
  for (const q of list) {
    if (q.t === 'pic' && dir !== 0) continue;
    const m = q.m === 'weave' ? 'cloth' : q.m || 'gloss', wv = q.m === 'weave' || q.wv, cx = U(q.x, q.z), cy = b - q.h;
    switch (q.t) {
      case 'box': { const w = side ? q.d : q.w; rbx(cx - w / 2, cy - q.hh / 2, w, q.hh, q.r, q.c, m, wv); break; }
      case 'cyl': {
        const rb = q.rb ?? q.r, top = cy - q.hh / 2, bot = cy + q.hh / 2;
        poly([[cx - q.r, top], [cx + q.r, top], [cx + rb, bot], [cx - rb, bot]], q.c, m, m !== 'glow', wv);
        if (m !== 'glass') oval(cx, top, q.r, Math.min(q.r * 0.22, Math.max(0.3, q.hh / 2)), sh(q.c, m === 'glow' ? 2 : 1));
        break;
      }
      case 'ball': ball(cx, cy, side ? q.rz : q.rx, q.ry, q.c, m, wv); break;
      case 'disc': if (side) rbx(cx - q.th / 2, cy - (q.ry ?? q.r), q.th, (q.ry ?? q.r) * 2, q.th / 2, q.c, m, wv); else ball(cx, cy, q.r, q.ry ?? q.r, q.c, m, wv); break;
      case 'lathe': {
        const pts = q.pts.map(([r, up]) => [r, cy - up]);
        poly([...pts.map(([r, y]) => [cx - r, y]), ...pts.slice().reverse().map(([r, y]) => [cx + r, y])], q.c, m, true, wv);
        if (q.pts[q.pts.length - 1][0] < 0.01 && q.pts.length > 2) break;
        const [rt, ut] = q.pts[q.pts.length - 1];
        oval(cx, cy - ut, rt, rt * 0.22, sh(q.c, -2));
        break;
      }
      case 'ring': {
        const ry = q.ry ?? q.r;
        if (side && !q.flat) { rbx(cx - q.tr, cy - ry - q.tr, q.tr * 2, (ry + q.tr) * 2, q.tr, q.c, m); break; }
        g.strokeStyle = q.c; g.lineWidth = q.tr * 2; g.lineCap = 'round'; g.beginPath();
        if (q.flat) g.ellipse(cx, cy, q.r, q.r * 0.22, 0, 0, TAU);
        else if (q.arc) g.ellipse(cx, cy, q.r, ry, 0, -(q.rot || 0) - q.arc, -(q.rot || 0));
        else g.ellipse(cx, cy, q.r, ry, 0, 0, TAU);
        g.stroke();
        if (wv) wrap(g, q.c, q.tr * 2);
        g.save(); g.globalAlpha *= 0.45; g.strokeStyle = sh(q.c, 2); g.lineWidth = q.tr * 0.6; g.beginPath();
        if (q.flat) g.ellipse(cx, cy - q.tr * 0.4, q.r, q.r * 0.22, 0, Math.PI, TAU); else if (!q.arc) g.ellipse(cx, cy, q.r, ry, 0, Math.PI * 1.1, Math.PI * 1.6);
        g.stroke(); g.restore();
        break;
      }
      case 'rod': {
        const p0 = [U(q.a[0], q.a[2]), b - q.a[1]], p1 = [U(q.b[0], q.b[2]), b - q.b[1]];
        g.lineCap = 'round'; g.strokeStyle = m === 'glass' ? alphaOf('#cfe8f4', 0.4) : q.c; g.lineWidth = q.r * 2;
        g.beginPath(); g.moveTo(...p0); g.lineTo(...p1); g.stroke();
        if (wv) wrap(g, q.c, q.r * 2);
        if (q.r > 0.6 && m !== 'glass') {
          g.save(); g.globalAlpha *= 0.5; g.strokeStyle = sh(q.c, 2); g.lineWidth = q.r * 0.6;
          g.beginPath(); g.moveTo(p0[0] - q.r * 0.35, p0[1] - q.r * 0.35); g.lineTo(p1[0] - q.r * 0.35, p1[1] - q.r * 0.35); g.stroke(); g.restore();
        }
        break;
      }
      case 'prism': {
        if (side) {
          const hs = q.pts.map(p => p[1]), top = Math.max(...hs), bot = Math.min(...hs);
          rbx(cx - q.d / 2, b - q.h - top, q.d, top - bot, Math.min(1, q.d / 2), q.c, m, wv);
          break;
        }
        poly(q.pts.map(([px, ph]) => [U(q.x + px), b - q.h - ph]), q.c, m, false, wv);
        break;
      }
      case 'pic': g.save(); g.beginPath(); g.rect(cx - q.w / 2, cy - q.hh / 2, q.w, q.hh); g.clip(); q.fn(g, cx - q.w / 2, cy - q.hh / 2, q.w, q.hh); g.restore(); break;
    }
  }
}

/* ---------- pictures ---------- */

/** A tropical leaf print: broad split leaves on `bg`. */
const leafPrint = (bg, ink, ink2 = sh(ink, -1)) => (g, x, y, w, h) => {
  g.fillStyle = bg; g.fillRect(x, y, w, h);
  const s = Math.min(w, h), spots = [[0.28, 0.32, 0.6, ink], [0.74, 0.7, -0.9, ink2], [0.8, 0.18, 2.3, ink2], [0.2, 0.84, -2.2, ink]];
  for (const [fx, fy, a, c] of spots) {
    g.save(); g.translate(x + fx * w, y + fy * h); g.rotate(a); g.fillStyle = c;
    g.beginPath(); g.ellipse(0, 0, s * 0.3, s * 0.17, 0, 0, TAU); g.fill();
    g.strokeStyle = bg; g.lineWidth = Math.max(0.35, s * 0.035);
    g.beginPath(); g.moveTo(-s * 0.3, 0); g.lineTo(s * 0.28, 0);
    for (let i = -2; i <= 2; i++) { g.moveTo(i * s * 0.09, 0); g.lineTo(i * s * 0.09 + s * 0.06, -s * 0.17); g.moveTo(i * s * 0.09, 0); g.lineTo(i * s * 0.09 + s * 0.06, s * 0.17); }
    g.stroke(); g.restore();
  }
};
/** A clock face: cream, twelve ticks, the hands at ten past ten. */
const dial = (g, x, y, w, h) => {
  const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2;
  g.fillStyle = '#fbf6e8'; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill();
  g.strokeStyle = RT.caneD; g.lineWidth = 0.6; g.beginPath(); g.arc(cx, cy, r - 0.3, 0, TAU); g.stroke();
  g.strokeStyle = RT.dark; g.lineCap = 'round';
  for (let i = 0; i < 12; i++) { const a = i * TAU / 12, l = i % 3 ? 0.12 : 0.24; g.lineWidth = i % 3 ? 0.45 : 0.8; g.beginPath(); g.moveTo(cx + Math.sin(a) * r * (0.86 - l), cy - Math.cos(a) * r * (0.86 - l)); g.lineTo(cx + Math.sin(a) * r * 0.86, cy - Math.cos(a) * r * 0.86); g.stroke(); }
  g.lineWidth = 0.9; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.sin(-1.05) * r * 0.45, cy - Math.cos(-1.05) * r * 0.45); g.stroke();
  g.lineWidth = 0.6; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.sin(1.05) * r * 0.66, cy - Math.cos(1.05) * r * 0.66); g.stroke();
  g.fillStyle = RT.coral; g.beginPath(); g.arc(cx, cy, 0.8, 0, TAU); g.fill();
};
/** A beach snapshot: sky, sun, sea, sand. */
const beach = (g, x, y, w, h) => {
  const s = g.createLinearGradient(0, y, 0, y + h * 0.55); s.addColorStop(0, '#8fd0f0'); s.addColorStop(1, '#d8f0f8');
  g.fillStyle = s; g.fillRect(x, y, w, h * 0.55);
  g.fillStyle = '#fff0a0'; g.beginPath(); g.arc(x + w * 0.72, y + h * 0.28, w * 0.13, 0, TAU); g.fill();
  g.fillStyle = RT.sea; g.fillRect(x, y + h * 0.55, w, h * 0.2);
  g.fillStyle = RT.sand; g.fillRect(x, y + h * 0.75, w, h * 0.25);
  g.fillStyle = '#ffffff'; g.fillRect(x, y + h * 0.74, w, h * 0.03);
};

/* ---------- the kinds ---------- */

/** What js/base-models-rattan.js builds for each upright and wall kind: its parts, doors and default material. */
export const BUILT = {};
/** The jute rug's outline: ellipses [cx, cy, rx, ry] in painted units, from above. */
export const RUGS = { rtnrug: [[32, 32, 30, 30]] };

function piece(id, name, w, h, price, mat, parts, { doors = [], inside, ...rest } = {}) {
  BUILT[id] = { parts, doors, inside, mat };
  const all = [...parts, ...doors.flatMap(d => d.parts)];
  return { id, name, group: GROUP, solo: true, w, h, price, ...rest, draw(x, b, vw, dir) { floorShadow(x, b, vw); paintParts(all, x, b, vw, dir, w * 32); } };
}
function wallPiece(id, name, w, price, mat, parts, rest = {}) {
  BUILT[id] = { parts, doors: [], mat };
  return { id, name, group: GROUP, solo: true, w, h: 1, layer: 'wall', price, ...rest, wall(x) { paintParts(parts, x, 96, w * 32, 0, w * 32); } };
}

/* the peacock chair's fan back, about its foot */
const FAN = [[-6, 0], [6, 0], [12, 16], [15, 34], [14.5, 48], [11, 59], [5, 65.5], [0, 67], [-5, 65.5], [-11, 59], [-14.5, 48], [-15, 34], [-12, 16]];
/* the bed's arched headboard, about its foot */
const ARCH = [[-27, 0], [27, 0], [27, 26], [21, 33], [10, 37], [0, 38], [-10, 37], [-21, 33], [-27, 26]];

export const RATTAN_KINDS = [
  // a cane bed: an arched woven headboard on bamboo posts, white sheets, a sea-blue throw, a leaf-print cushion
  piece('rtnbed', 'Rattan bed', 2, 2, 1200, 'wood', [
    PR(32, 16, -29, ARCH, 3, RT.cane, W8),
    ...ARCH.slice(2).map((p, i, a) => i < a.length - 1 ? RD([32 + p[0], 16 + p[1], -29], [32 + a[i + 1][0], 16 + a[i + 1][1], -29], 1.3, RT.caneD, WD) : null).filter(Boolean),
    ...[3.5, 60.5].flatMap(x => [...pole(x, -29, 0, 46, 2.2), S(x, 47, -29, 2.6, 2.6, 2.6, RT.bamD, WD)]),
    ...[3.5, 60.5].flatMap(x => [...pole(x, 29, 0, 25, 2.2), S(x, 26, 29, 2.6, 2.6, 2.6, RT.bamD, WD)]),
    B(32, 17, 29, 54, 12, 2.4, RT.cane, W8),
    RD([5, 23.4, 29], [59, 23.4, 29], 1.2, RT.caneD, WD),
    ...[3.5, 60.5].map(x => B(x, 10, 0, 3.4, 6, 56, RT.caneD, WD)),
    B(32, 10, 0, 54, 6, 56, RT.caneD, WD),
    B(32, 17, 0, 56, 8, 56, RT.white, { m: 'cloth', r: 3 }),
    B(32, 18, 12, 57, 8.6, 32, RT.sea, { m: 'cloth', r: 2.5 }),
    B(32, 22.4, 12, 57.4, 0.6, 32.4, RT.seaL, { m: 'cloth', r: 0.3 }),
    S(18, 24.5, -20, 11, 4, 6, RT.white, CL), S(46, 24.5, -20, 11, 4, 6, RT.white, CL),
    B(32, 28, -15, 16, 11, 3, RT.coral, { m: 'cloth', r: 2.5 }),
    PC(32, 28, -13.45, 14, 9, leafPrint(RT.coral, RT.white, RT.coralL)),
  ]),

  // the peacock chair: a big woven fan back, a coral seat cushion, an hourglass base
  piece('rtnpeacock', 'Peacock chair', 1, 1, 750, 'wood', [
    PR(16, 22, -12, FAN, 3, RT.cane, W8),
    ...FAN.slice(2).map((p, i, a) => i < a.length - 1 ? RD([16 + p[0], 22 + p[1], -10.3], [16 + a[i + 1][0], 22 + a[i + 1][1], -10.3], 0.9, RT.caneD, WD) : null).filter(Boolean),
    ...[[-12, 46], [-6, 60], [0, 64], [6, 60], [12, 46]].map(([dx, dh]) => RD([16, 26, -10.2], [16 + dx * 0.9, 22 + dh * 0.95, -10.2], 0.55, RT.caneD, WD)),
    LA(16, 0, 1, [[11, 0], [10, 2], [5, 9], [4.5, 11], [6, 15], [12, 18], [0, 18.5]], RT.cane, W8),
    C(16, 1, 1, 11.4, 2, RT.caneD, WD),
    C(16, 19, 1, 13, 2.4, RT.caneD, WD),
    S(16, 22, 2, 12, 3, 11, RT.coral, CL),
    ...[2.5, 29.5].map(x => RD([x, 20, 10], [x + (x < 16 ? -0.5 : 0.5), 34, -8], 2, RT.caneD, { m: 'wood', wv: true })),
    B(16, 37, -8.5, 17, 20, 3, RT.white, { m: 'cloth', r: 2.5 }),
    PC(16, 37, -6.95, 15, 18, leafPrint(RT.white, RT.leaf, RT.leafD)),
  ]),

  // an egg chair hanging from its C stand, a sea-blue cushion inside
  piece('rtneggchair', 'Hanging egg chair', 1, 1, 950, 'wood', [
    LA(16, 0, -1, [[14, 0], [14, 1.4], [10, 3], [0, 3.6]], RT.dark, { m: 'metal' }),
    RD([16, 2, -13], [16, 82, -13], 1.6, RT.dark, { m: 'metal' }),
    RD([16, 82, -13], [16, 89, -8], 1.6, RT.dark, { m: 'metal' }),
    RD([16, 89, -8], [16, 89, -1], 1.6, RT.dark, { m: 'metal' }),
    RD([16, 89, -1], [16, 70, -1], 0.5, RT.brass, { m: 'metal' }),
    LA(16, 12, -1, [[0, 0], [5, 1], [9, 4], [11.5, 10], [12, 19], [11.5, 31], [9.5, 43], [6.5, 51], [3, 56], [0, 58]], RT.cane, { m: 'weave', seg: 16 }),
    DS(16, 38, 10.4, 8.6, 0.6, '#8a5a2a', { ry: 16, m: 'plain' }),
    RG(16, 38, 10.6, 9.2, 1.2, RT.caneD, { ry: 16.6, m: 'wood', wv: true }),
    S(16, 40, 10.4, 6.5, 8, 1.6, RT.white, CL),
    S(16, 26.5, 11.5, 9, 3.6, 3.6, RT.sea, CL),
  ]),

  // a cane sofa: woven back and arms, bent cane rolls, white cushions, coral and sea-blue pillows
  piece('rtnsofa', 'Rattan sofa', 2, 1, 1000, 'wood', [
    B(32, 30, -12, 60, 24, 4, RT.cane, W8),
    ...[4, 60].map(x => B(x, 20, 0, 6, 22, 26, RT.cane, W8)),
    ...[4, 60].map(x => RD([x, 31.5, -13], [x, 31.5, 13], 2.2, RT.caneD, { m: 'wood', wv: true })),
    RD([2, 42, -12], [62, 42, -12], 2.2, RT.caneD, { m: 'wood', wv: true }),
    B(32, 12, 0, 52, 8, 26, RT.cane, W8),
    ...[[6, -11], [58, -11], [6, 11], [58, 11]].map(([x, z]) => C(x, 4.5, z, 1.8, 9, RT.bamD, WD)),
    B(19.5, 19, 2, 24, 6, 24, RT.white, { m: 'cloth', r: 3 }), B(44.5, 19, 2, 24, 6, 24, RT.white, { m: 'cloth', r: 3 }),
    B(19.5, 30, -7.5, 23, 15, 6, RT.white, { m: 'cloth', r: 3 }), B(44.5, 30, -7.5, 23, 15, 6, RT.white, { m: 'cloth', r: 3 }),
    B(14, 28, -3, 10, 10, 3, RT.coral, { m: 'cloth', r: 2.5 }),
    PC(14, 28, -1.45, 8.4, 8.4, leafPrint(RT.coral, RT.white, RT.coralL)),
    B(50, 28, -3, 10, 10, 3, RT.sea, { m: 'cloth', r: 2.5 }),
  ]),

  // a round coffee table: a woven hourglass drum under a glass top, a shell and a little vase on it
  piece('rtntable', 'Glass-top cane table', 1, 1, 450, 'wood', [
    LA(16, 0, 0, [[11, 0], [11.5, 1.5], [7, 8], [7, 10], [11.5, 16], [12, 17], [0, 17.2]], RT.cane, W8),
    C(16, 1, 0, 11.8, 2, RT.caneD, WD),
    C(16, 9, 0, 7.5, 2.4, RT.caneD, WD),
    C(16, 17.4, 0, 12.6, 1.4, RT.caneD, WD),
    C(16, 18.8, 0, 15, 1.4, RT.white, { m: 'glass' }),
    LA(10, 19.5, 2, [[3.4, 0], [3, 2], [1.8, 4], [0, 5.4]], RT.coralL, { m: 'gloss', seg: 10 }),
    LA(21, 19.5, -2, [[1.6, 0], [2.6, 2], [2.4, 4], [1.2, 6], [1.4, 7]], RT.sea, { m: 'gloss', seg: 10 }),
  ], { }),

  // a writing desk on bamboo legs, a woven drawer and modesty panel, a letter stack and a potted leaf
  piece('rtndesk', 'Cane writing desk', 2, 1, 700, 'wood', [
    ...[[4, -11], [60, -11], [4, 11], [60, 11]].flatMap(([x, z]) => pole(x, z, 0, 28, 1.6)),
    ...[4, 60].map(x => RD([x, 7, -11], [x, 7, 11], 1, RT.caneD, WD)),
    B(32, 15, -11.5, 54, 16, 1.4, RT.cane, W8),
    B(32, 25, 0, 58, 5, 25, RT.caneD, WD),
    B(32, 25, 12.9, 26, 4.2, 1, RT.cane, W8),
    S(32, 25, 13.8, 1.1, 1.1, 1.1, RT.brass, { m: 'metal', seg: 8 }),
    B(32, 29, 0, 62, 2.6, 28, RT.cane, { m: 'wood', r: 1 }),
    B(14, 31, -2, 11, 1.6, 8, RT.sea, PL), B(14, 32.4, -2, 10, 1.2, 7, RT.white, PL), B(13, 33.4, -1, 8, 0.8, 5.5, RT.coralL, PL),
    ...potPlant(52, 30.3, -4, 3.6, 6),
  ]),

  // a tall wardrobe, its two doors framed in cane round woven panels
  piece('rtnwardrobe', 'Cane-panel wardrobe', 2, 1, 1100, 'wood', [
    ...[[5, -10], [59, -10], [5, 10], [59, 10]].map(([x, z]) => C(x, 1.5, z, 2, 3, RT.bamD, WD)),
    B(32, 4.5, -1, 58, 3, 26, RT.caneD, WD),
    B(32, 46, -1, 60, 80, 28, RT.cane, WD),
    B(32, 87, -1, 62, 3, 30, RT.caneD, WD),
    ...[3.2, 60.8].map(x => RD([x, 6, 13], [x, 85.5, 13], 1.3, RT.bam, WD)),
  ], {
    doors: [
      { hinge: [4, 13.5], side: 1, parts: [B(18, 46, 13.6, 27, 76, 1.2, RT.caneL, WD), B(18, 52, 14.4, 21, 54, 0.6, RT.cane, W8), B(18, 17, 14.4, 21, 8, 0.6, RT.cane, W8), S(29, 44, 14.8, 1.1, 1.1, 1.1, RT.brass, { m: 'metal', seg: 8 })] },
      { hinge: [60, 13.5], side: -1, parts: [B(46, 46, 13.6, 27, 76, 1.2, RT.caneL, WD), B(46, 52, 14.4, 21, 54, 0.6, RT.cane, W8), B(46, 17, 14.4, 21, 8, 0.6, RT.cane, W8), S(35, 44, 14.8, 1.1, 1.1, 1.1, RT.brass, { m: 'metal', seg: 8 })] },
    ],
    inside: { x: 32, h: 46, w: 54, hh: 72, z: 12.8 },
  }),

  // a low dresser: six woven drawer fronts, a cone shell and a beach snapshot on top
  piece('rtndresser', 'Rattan dresser', 2, 1, 800, 'wood', [
    ...[[5, -11], [59, -11], [5, 11], [59, 11]].map(([x, z]) => C(x, 2.5, z, 1.8, 5, RT.bamD, WD)),
    B(32, 19, -1, 60, 28, 28, RT.cane, WD),
    B(32, 34, -1, 62, 2.4, 30, RT.caneD, WD),
    ...[17, 47].flatMap(x => [10, 19, 28].flatMap(h => [B(x, h, 13.3, 27, 7.4, 1, RT.caneL, W8), S(x, h, 14.2, 1, 1, 1, RT.brass, { m: 'metal', seg: 8 })])),
    LA(16, 35.2, -2, [[4, 0], [3.6, 2.5], [2, 5], [0, 7]], RT.coralL, { m: 'gloss', seg: 10 }),
    B(46, 41.5, -6, 11, 12, 1.4, RT.white, { m: 'gloss', r: 0.8 }),
    PC(46, 41.5, -5.25, 9, 10, beach),
    PR(46, 35.2, -8, [[-3, 0], [3, 0], [0, 6]], 1, RT.white, { m: 'gloss' }),
  ]),

  // a bamboo ladder leaning on the wall, its shelves narrowing up: a basket, a plant, shells, rolled towels
  piece('rtnladder', 'Bamboo ladder shelf', 1, 1, 400, 'wood', [
    ...[[2.5, 4.5], [29.5, 27.5]].flatMap(([x0, x1]) => [RD([x0, 0, 10], [x1, 88, -12.5], 1.7, RT.bam, WD), ...[22, 44, 66].map(h => C(x0 + (x1 - x0) * h / 88, h, 10 - 22.5 * h / 88, 2.05, 0.9, RT.bamD, { m: 'wood', seg: 8 }))]),
    ...[[14, 18], [36, 14], [58, 10], [78, 6]].map(([h, d]) => B(16, h, 10 - 22.5 * h / 88 - d / 2 + 1, 24, 1.6, d, RT.cane, { m: 'wood', r: 0.6 })),
    LA(16, 14.8, 0, [[7, 0], [8, 6], [8.3, 7.5]], RT.cane, W8), C(16, 21.8, 0, 8.6, 1.2, RT.caneD, WD),
    ...potPlant(16, 36.8, -4.5, 3.4, 6, 0.9),
    LA(11, 58.8, -8, [[3, 0], [2.6, 2], [1.4, 4], [0, 5]], RT.coralL, { m: 'gloss', seg: 10 }),
    S(20, 60.6, -8, 2.6, 1.8, 2.2, RT.white, { m: 'gloss', seg: 8 }),
    RD([9, 81, -11.5], [23, 81, -11.5], 2.2, RT.sea, CL), RD([10, 85.2, -12], [22, 85.2, -12], 2, RT.white, CL),
  ]),

  // a floor lamp: a bamboo tripod under a woven cone shade, lit through
  piece('rtnlamp', 'Woven-shade floor lamp', 1, 1, 450, 'wood', [
    RD([16, 60, 0], [4, 0, 8], 1.2, RT.bam, WD), RD([16, 60, 0], [28, 0, 8], 1.2, RT.bam, WD), RD([16, 60, 0], [16, 0, -12], 1.2, RT.bam, WD),
    C(16, 62, 0, 1.6, 6, RT.bamD, WD),
    LA(16, 58, 0, [[14, 0], [12.4, 8], [10.8, 16], [9, 23]], RT.lamp, { m: 'glow', wv: true, seg: 16 }),
    C(16, 58.6, 0, 14.4, 1.4, RT.caneD, WD), C(16, 66, 0, 12.8, 1, RT.caneD, WD), C(16, 74, 0, 11.2, 1, RT.caneD, WD), C(16, 80.6, 0, 9.4, 1.2, RT.caneD, WD),
  ], { glow: [RT.lamp] }),

  // a table clock: a cream dial in a woven round, a bamboo hoop, on a cane foot
  piece('rtnclock', 'Rattan table clock', 1, 1, 350, 'wood', [
    B(16, 2, 0, 18, 4, 10, RT.caneD, WD),
    B(16, 6, 0, 6, 4, 5, RT.cane, WD),
    DS(16, 20, 0, 12, 4, RT.cane, W8),
    RG(16, 20, 0.5, 12.6, 1, RT.bamD, WD),
    DS(16, 20, 2.2, 8.4, 0.6, '#fbf6e8', PL),
    PC(16, 20, 2.6, 17, 17, (g, x, y, w, h) => { g.save(); g.beginPath(); g.arc(x + w / 2, y + h / 2, 8.2, 0, TAU); g.clip(); dial(g, x + w / 2 - 8.2, y + h / 2 - 8.2, 16.4, 16.4); g.restore(); }),
  ]),

  // a three-panel folding screen of cane in bamboo frames, the middle one printed with palm leaves
  piece('rtnscreen', 'Cane folding screen', 2, 1, 600, 'wood', [
    ...[[11, -4], [32, 4], [53, -4]].flatMap(([x, z]) => [
      ...pole(x - 9.5, z, 0, 80, 1.4), ...pole(x + 9.5, z, 0, 80, 1.4),
      RD([x - 9.5, 78, z], [x + 9.5, 78, z], 1.2, RT.bam, WD), RD([x - 9.5, 7, z], [x + 9.5, 7, z], 1.2, RT.bam, WD),
      B(x, 42.5, z, 18, 68, 1.2, RT.cane, W8),
    ]),
    PC(32, 50, 4.65, 14, 24, leafPrint(RT.caneL, RT.leaf, RT.leafD)),
  ]),

  // an oval mirror in a woven ring, swung between bamboo legs
  piece('rtnmirror', 'Cane standing mirror', 1, 1, 500, 'wood', [
    RD([4, 0, 5], [6.5, 84, -2], 1.4, RT.bam, WD), RD([28, 0, 5], [25.5, 84, -2], 1.4, RT.bam, WD), RD([16, 0, -13], [16, 66, -3], 1.2, RT.bam, WD),
    ...[6.5, 25.5].map(x => S(x, 85, -2, 1.8, 1.8, 1.8, RT.bamD, WD)),
    DS(16, 50, 0, 9.6, 1, RT.mirror, { ry: 26, m: 'gloss' }),
    PR(16, 50, 0.7, [[-6, 10], [-3, 14], [4, -6], [1, -10]], 0.2, '#f0f9fc', PL),
    RG(16, 50, 0, 10.8, 1.8, RT.cane, { ry: 27.2, m: 'weave' }),
    ...[6.5, 25.5].map(x => S(x, 50, -1, 1.4, 1.4, 1.4, RT.brass, { m: 'metal', seg: 8 })),
  ]),

  // a sun lounger: a woven seat, a raked back, a white pad, a coral bolster, a folded beach towel
  piece('rtnlounger', 'Rattan sun lounger', 2, 1, 700, 'wood', [
    ...[[14, -11], [58, -11], [14, 11], [58, 11]].map(([x, z]) => C(x, 6.5, z, 1.8, 13, RT.bamD, WD)),
    ...[-13, 13].map(z => RD([10, 12, z], [62, 12, z], 1.6, RT.caneD, WD)),
    B(36.5, 14, 0, 51, 3, 26, RT.cane, W8),
    PR(0, 0, 0, [[2.5, 38], [6, 40], [16, 15.5], [12, 13]], 26, RT.cane, W8),
    B(37, 17.5, 0, 48, 4, 24, RT.white, { m: 'cloth', r: 2 }),
    PR(0, 0, 0, [[7, 40], [10.5, 41.5], [20.5, 18], [16.5, 16]], 22, RT.white, CL),
    S(16, 31, 0, 3, 3, 10, RT.coral, CL),
    B(55, 20.3, 0, 10, 1.6, 22, RT.sea, { m: 'cloth', r: 0.8 }), B(55, 21.4, 0, 10.2, 0.6, 22.2, RT.seaL, { m: 'cloth', r: 0.3 }),
  ]),

  // a bamboo bar cart: two woven trays, a bottle, a coconut cup, a pineapple and an ice basket
  piece('rtnbarcart', 'Bamboo bar cart', 1, 1, 550, 'wood', [
    ...[[4, -10], [28, -10], [4, 10], [28, 10]].flatMap(([x, z]) => [...pole(x, z, 3, 33, 1.3), S(x, 2, z, 2, 2, 2, RT.dark, { m: 'plain', seg: 8 })]),
    RD([2, 33, -10], [2, 33, 10], 1.2, RT.bamD, WD),
    B(16, 8, 0, 26, 1.6, 22, RT.cane, W8), B(16, 24, 0, 26, 1.6, 22, RT.cane, W8),
    LA(16, 8.8, 0, [[5, 0], [6, 6], [6.3, 7.5]], RT.cane, W8),
    LA(8, 24.8, -3, [[2.4, 0], [2.4, 7], [1, 9], [0.8, 11], [0, 11.2]], '#3e8a6a', { m: 'gloss', seg: 10 }),
    S(16, 27.6, 3, 2.8, 2.8, 2.8, '#7a5030', { m: 'plain', seg: 8 }), RD([16.8, 29.5, 3], [18, 33, 3], 0.4, RT.coral, PL),
    S(23, 28.4, -2, 3, 3.6, 3, '#e8b040', { seg: 8 }),
    frond(23, 31.6, -2, 5, 1.2, 1.2, RT.leaf, 0), frond(23, 31.6, -1.6, 5, 1.95, 1.2, RT.leafD, 0),
  ]),

  // a woven trunk: cane bands, a sea-blue strap with brass buckles, cane handles
  piece('rtntrunk', 'Woven trunk', 2, 1, 500, 'wood', [
    ...[[5, -10], [59, -10], [5, 10], [59, 10]].map(([x, z]) => C(x, 1, z, 2, 2, RT.caneD, WD)),
    B(32, 12, 0, 58, 20, 26, RT.cane, W8),
    ...[8, 56].map(x => B(x, 12, 13.2, 3, 20, 1, RT.caneD, WD)),
    B(32, 22.4, 0, 60.4, 1.6, 28.4, RT.caneD, WD),
    B(32, 25, 0, 60, 4, 28, RT.cane, W8),
    ...[22, 42].flatMap(x => [B(x, 21, 14.3, 4, 10, 0.8, RT.sea, { m: 'cloth', r: 0.4 }), B(x, 18, 14.8, 3.2, 3.2, 0.6, RT.brass, { m: 'metal', r: 0.4 })]),
    ...[1.2, 62.8].map(x => RD([x, 16, -5], [x, 16, 5], 0.9, RT.caneD, { m: 'wood', wv: true })),
  ]),

  // a side stool: an hourglass of cane, banded, a coral cushion
  piece('rtnstool', 'Cane side stool', 1, 1, 200, 'wood', [
    LA(16, 0, 0, [[10, 0], [10.5, 1.5], [6.5, 9], [6.5, 11], [10.5, 18], [10, 19.5], [0, 19.6]], RT.cane, W8),
    C(16, 1, 0, 10.8, 2, RT.caneD, WD),
    C(16, 10, 0, 7, 2.6, RT.caneD, WD),
    C(16, 19, 0, 11, 1.8, RT.caneD, WD),
    S(16, 22.4, 0, 10.4, 2.8, 10.4, RT.coral, CL),
  ]),

  // a tall lidded hamper, a beach towel tucked over its rim
  piece('rtnhamper', 'Rattan laundry hamper', 1, 1, 250, 'wood', [
    LA(16, 0, 0, [[9, 0], [10, 2], [11.5, 36], [11.5, 37.5]], RT.cane, W8),
    C(16, 1, 0, 10, 2, RT.caneD, WD), C(16, 19, 0, 10.9, 1.6, RT.caneD, WD), C(16, 36.6, 0, 11.9, 1.8, RT.caneD, WD),
    LA(16, 37.5, 0, [[12.4, 0], [12.4, 1.4], [9, 3.4], [0, 4.2]], RT.cane, W8),
    S(16, 42.2, 0, 1.8, 1.6, 1.8, RT.caneD, { m: 'wood', seg: 8 }),
    B(21, 31, 12.2, 8, 14, 1.4, RT.sea, { m: 'cloth', r: 0.6 }), B(21, 25.6, 12.95, 8, 1.2, 0.2, RT.white, { m: 'cloth', r: 0.1 }),
  ]),

  // a big-bellied basket planter with a palm
  piece('rtnpalm', 'Basket palm', 1, 1, 450, 'wood', [
    LA(16, 0, 0, [[8, 0], [11, 4], [13, 12], [12.5, 20], [11, 24], [11.5, 25]], RT.cane, W8),
    C(16, 24.6, 0, 11.9, 1.6, RT.caneD, WD), C(16, 12, 0, 13.2, 1.4, RT.caneD, WD),
    C(16, 23.6, 0, 10.6, 0.6, RT.soil, PL),
    RD([16, 23, 0], [14.5, 56, 0], 1.6, RT.trunk, { m: 'wood', wv: true }), RD([17, 23, 1], [20, 44, 1], 1.3, RT.trunk, { m: 'wood', wv: true }),
    ...[[0.35, 21, 4], [1.1, 20, 4.6], [1.9, 20, 4.6], [2.75, 21, 4], [0.05, 17, 3.6], [3.1, 17, 3.6], [1.5, 15, 4]].map(([a, len, wid], i) =>
      frond(14.5, 56, (i % 3) - 1, len, a, wid, i % 2 ? RT.leafD : RT.leaf, 0.5)),
    ...[[0.5, 12, 3], [2.6, 12, 3]].map(([a, len, wid]) => frond(20, 44, 2, len, a, wid, RT.leaf, 0.5)),
  ]),

  // a round braided jute rug, a sea-blue band and a coral one
  { id: 'rtnrug', name: 'Round jute rug', group: GROUP, solo: true, w: 2, h: 2, layer: 'rug', price: 400, high: 0.04, side: 'c', flat() {
    const g = ctx(), [[cx, cy, R]] = RUGS.rtnrug;
    oval(cx, cy, R, R, RT.juteD);
    for (let r = R - 1, i = 0; r > 1; r -= 2.4, i++) {
      const c = i === 2 || i === 3 ? RT.sea : i === 7 ? RT.coral : i % 2 ? RT.jute : sh(RT.jute, 1);
      g.strokeStyle = c; g.lineWidth = 2.2; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.stroke();
      g.save(); g.setLineDash([1, 1.1]); g.lineDashOffset = i * 0.6; g.strokeStyle = sh(c, -1); g.globalAlpha = 0.6; g.lineWidth = 1.2;
      g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.stroke(); g.restore();
    }
    oval(cx, cy, 2, 2, RT.juteD);
  } },

  // a sunburst mirror: a round glass, a woven ring, cane rays
  wallPiece('rtnsunburst', 'Sunburst cane mirror', 1, 450, 'wood', [
    ...Array.from({ length: 16 }, (_, i) => {
      const a = i * TAU / 16, l = i % 2 ? 13 : 15.4;
      return RD([16 + Math.cos(a) * 9, 60 + Math.sin(a) * 9, 1], [16 + Math.cos(a) * l, 60 + Math.sin(a) * l, 1], i % 2 ? 0.7 : 0.9, i % 2 ? RT.caneD : RT.cane, { m: 'wood', wv: true });
    }),
    ...Array.from({ length: 8 }, (_, i) => { const a = i * TAU / 8; return S(16 + Math.cos(a) * 15.4, 60 + Math.sin(a) * 15.4, 1, 1, 1, 1, RT.caneD, { m: 'wood', seg: 8 }); }),
    DS(16, 60, 0.8, 9.4, 1.6, RT.cane, W8),
    DS(16, 60, 1.8, 7, 0.8, RT.mirror, { m: 'gloss' }),
    RG(16, 60, 1.9, 7.4, 0.7, RT.caneD, { m: 'wood', wv: true }),
  ]),

  // three woven wall baskets, flat rounds of cane with dyed centres
  wallPiece('rtnbaskets', 'Woven wall baskets', 2, 350, 'wood', [
    ...[[18, 58, 13, RT.sea], [44, 68, 9, RT.coral], [51, 47, 7.5, RT.white], [33, 42, 4.5, RT.sea]].flatMap(([x, h, r, c]) => [
      DS(x, h, 1, r, 1.6, RT.cane, W8),
      RG(x, h, 1.8, r, 0.9, RT.caneD, { m: 'wood', wv: true }),
      RG(x, h, 1.9, r * 0.62, r * 0.09, c, PL),
      DS(x, h, 1.9, r * 0.28, 0.4, c, PL),
    ]),
  ]),

  // a cane wall shelf on bent brackets: a trailing plant, a starfish, a sea-glass bottle
  wallPiece('rtnwallshelf', 'Cane wall shelf', 1, 300, 'wood', [
    B(16, 63, 0.7, 28, 20, 1.4, RT.cane, W8),
    RD([2, 53, 1], [2, 73, 1], 0.9, RT.caneD, WD), RD([30, 53, 1], [30, 73, 1], 0.9, RT.caneD, WD), RD([2, 73, 1], [30, 73, 1], 0.9, RT.caneD, WD),
    B(16, 52, 6, 30, 2, 11, RT.cane, { m: 'wood', r: 0.6 }),
    ...[4, 28].map(x => RD([x, 41, 1], [x, 51, 10], 0.9, RT.caneD, { m: 'wood', wv: true })),
    C(8, 56.5, 6, 3.4, 7, RT.white, { rb: 2.7, m: 'gloss' }),
    ...[[6, 52, 9.5], [4.6, 47, 10], [9.6, 49, 10.4], [7.2, 43, 10.2]].map(([x, h, z], i) => S(x, h, z, 1.8, 1.4, 0.6, i % 2 ? RT.leafD : RT.leaf, { m: 'plain', seg: 8 })),
    RD([8, 59, 7], [6, 42, 10], 0.3, RT.leafD, PL),
    frond(8, 60, 6, 6, 1.0, 1.6, RT.leaf, 0.1), frond(8, 60, 5.6, 6, 2.2, 1.6, RT.leafD, 0.1),
    PR(17, 56, 7, Array.from({ length: 10 }, (_, i) => { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 1.4 : 3.4; return [Math.cos(a) * r, Math.sin(a) * r]; }), 1, RT.coral, { m: 'gloss' }),
    LA(25, 53, 6, [[2.2, 0], [2.2, 5], [0.9, 7], [0.8, 9], [0, 9.2]], '#6fb8b0', { m: 'gloss', seg: 10 }),
  ]),

  // a bedside table on bamboo legs: a woven drawer, a woven lower shelf with a basket
  piece('rtnnightstand', 'Cane bedside table', 1, 1, 350, 'wood', [
    ...[[4, -10], [28, -10], [4, 10], [28, 10]].flatMap(([x, z]) => pole(x, z, 0, 24, 1.5)),
    B(16, 6, 0, 24, 1.6, 22, RT.cane, W8),
    LA(13, 6.8, 0, [[5, 0], [5.6, 5], [5.8, 6]], RT.caneL, W8),
    B(16, 20, 0, 26, 7, 22, RT.cane, WD),
    B(16, 20, 11.3, 20, 5.4, 1, RT.caneL, W8),
    S(16, 20, 12.2, 1, 1, 1, RT.brass, { m: 'metal', seg: 8 }),
    B(16, 25, 0, 30, 2.2, 26, RT.caneD, WD),
  ]),

  // a wicker floor lantern: a lit shade in a cage of cane, a woven cap and a carrying loop
  piece('rtnlantern', 'Wicker floor lantern', 1, 1, 400, 'wood', [
    C(16, 2, 0, 9.4, 4, RT.caneD, WD),
    C(16, 18, 0, 7, 28, RT.lamp, { m: 'glow' }),
    ...Array.from({ length: 8 }, (_, i) => { const a = (i + 0.5) * TAU / 8, x = 16 + Math.cos(a) * 8.2, z = Math.sin(a) * 8.2; return RD([x, 4, z], [x, 32, z], 0.8, RT.cane, { m: 'wood', wv: true }); }),
    ...[6, 18, 30].map(h => RG(16, h, 0, 8.4, 0.8, RT.caneD, { flat: true, m: 'wood' })),
    LA(16, 32, 0, [[9.6, 0], [9.2, 2], [4, 7], [0, 8]], RT.cane, W8),
    RG(16, 43.4, 0, 3.4, 0.7, RT.caneD, { m: 'wood', wv: true }),
  ], { glow: [RT.lamp] }),
].map(f => ({ group: GROUP, solo: true, ...f }));
