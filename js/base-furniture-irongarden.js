/* base-furniture-irongarden.js  -  the Iron garden set (furniture expansion session g, 2026-10-17): Animal Crossing's iron
   garden series, for the Secret Base's backyard. White-painted wrought iron, slender and curling: lyre scrolls (two curls
   meeting in a point), crossed lattice backs and panels, mesh seats, ball-and-spike finials; sage-green cushions,
   terracotta pots, climbing roses and ivy, a little glass (a plant cabinet, lanterns, the fountain's falling water).
   Pidgey on the birdbath, Comfey's lei on the basket stand, a Roselia in the planter, a Natu in the bird cage and a
   Butterfree weathervane on the gazebo. Every kind `outdoor`, on the garden catalogue's own Iron garden tab
   (js/garden-shop.js's GARDEN_TABS); all solo, fixed colours, sold all year.
   As js/base-furniture-acorn.js: an upright piece is a list of parts in painted units (32 a tile), `x` across from the left
   of its front, `h` up from the floor, `z` out to the front from its middle, painted here from any side and built as the
   same 3D parts by js/base-models-irongarden.js (BUILT), so picture and model agree. Iron is thin rods (`curl()` a scroll
   as a few of them, `lattice()` crossed square bars) and flat bars (boxes with no rounding, 12 triangles each). `tex` is
   painted only: `mesh` a seat's criss-cross, `leafy` a bush's dabs with `dot` its roses. The clock's dial is a `pic`, its
   model a crop of the painting. The plant cabinet's glass doors and the gate's leaves swing (`doors`, a `bare` inside:
   what's behind them is modelled). The rug is a mosaic paving circle, painted from above (RUG). */

import { sh, oval, ovalShade, floorShadow, ctx, hash, glass as glassPane } from './base-paint.js';

export const IG = {
  iron: '#f2efe6', ironD: '#c9c4b6', sage: '#98b486', sageL: '#bcd0aa', sageD: '#6f8c5e', cream: '#f6efdc',
  terra: '#c8693f', terraD: '#9c4c2c', terraL: '#e08c62', soil: '#5c3e28', stone: '#ddd6c6', stoneD: '#b3aa98', grout: '#a89e8c',
  ivy: '#4f8a3c', ivyD: '#356a2a', ivyL: '#78ae54', moss: '#7d9a4a', rose: '#e05a78', roseD: '#b8385a', roseL: '#f4a6b8',
  red: '#d4344a', blue: '#4a6ad8', yellow: '#f2cf4a', lilac: '#b896e0', water: '#86cce2', glow: '#ffe6a0',
  mirror: '#d4e6ee', china: '#f8f6f0', ink: '#2a2620', zinc: '#a9b8ae',
  pidgey: '#b58658', pidgeyL: '#f0dcb4', pidgeyD: '#7e5a3a', pidgeyCrest: '#d47a6a', beak: '#6a6058', foot: '#d89a8a',
  roselia: '#8ccf5a', roseliaD: '#3f7a34', thorn: '#d8e070', comfey: '#6cbf7a', natu: '#5cb848', natuD: '#2f7a30',
  bfBody: '#5a5ab4', bfWing: '#f8f8fc', bfEdge: '#3a3450', bfEye: '#d0303a',
};
const GROUP = 'Iron garden';
const TAU = Math.PI * 2;
const IR = 0.75, IF = 0.5;

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

const CL = { m: 'cloth' }, PL = { m: 'plain' }, GL = { m: 'gloss' }, GS = { m: 'glass' };

/** A rod of iron from a to b ([x, h, z]). */
const bar = (a, b, r = IR, c = IG.iron, o) => RD(a, b, r, c, { m: 'gloss', ...o });
/** Rods joining points in turn. */
const line = (pts, r = IR, c = IG.iron, o) => pts.slice(1).map((p, i) => bar(pts[i], p, r, c, o));
/** A flat iron bar (a box with square edges). */
const fb = (x, h, z, w, hh, d, o) => B(x, h, z, w, hh, d, IG.iron, { m: 'gloss', r: 0, ...o });
/** An iron mesh seat or shelf: the painting criss-crossed, the model plain. */
const mesh = (x, h, z, w, hh, d) => B(x, h, z, w, hh, d, IG.iron, { m: 'gloss', r: 0, tex: 'mesh', ts: 1.6 });

/** A curl of iron round centre c ([x, h, z]) from angle a0 to a1 (counter-clockwise seen with u to the right), its radius
    R0 going to R1, in the upright plane along u ([ux, uz]; the front plane by default). `down` mirrors it upside down. */
function curl(c, R0, R1, a0, a1, o = {}) {
  const [ux, uz] = o.u ?? [1, 0], up = o.down ? -1 : 1, n = o.n ?? Math.max(2, Math.ceil(Math.abs(a1 - a0) / 0.6)), pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, a = a0 + (a1 - a0) * t, R = R0 + (R1 - R0) * t;
    pts.push([c[0] + ux * Math.cos(a) * R, c[1] + up * Math.sin(a) * R, c[2] + uz * Math.cos(a) * R]);
  }
  return line(pts, o.r ?? IF, o.c ?? IG.iron, o.seg ? { seg: o.seg } : undefined);
}
const LY = Math.atan2(-0.62, -0.32);
/** The lyre scroll: two curls rising from a point (x, h) and turning in, s tall and 1.66 s wide (`down` hangs it). */
function lyre(x, h, z, s, o = {}) {
  const [ux, uz] = o.u ?? [1, 0], up = o.down ? -1 : 1;
  return [-1, 1].flatMap(sg => curl([x + sg * ux * 0.32 * s, h + up * 0.62 * s, z + sg * uz * 0.32 * s], 0.7 * s, 0.14 * s, LY, LY + 1.85 * Math.PI,
    { ...o, u: [sg * ux, sg * uz], n: o.n ?? 10 }));
}
/** Crossed square bars filling w x hh from (x0, h0) in the upright plane at z (along u, as curl()), step apart. */
function lattice(x0, h0, w, hh, z, step, o = {}) {
  const [ux, uz] = o.u ?? [1, 0], r = o.r ?? 0.42, c = o.c ?? IG.iron, out = [], P = (a, t) => [x0 + ux * a, h0 + t, z + uz * a];
  for (let k = -hh + step / 2; k < w; k += step) {
    const t0 = Math.max(0, -k), t1 = Math.min(hh, w - k);
    if (t1 - t0 < 0.8) continue;
    out.push(bar(P(k + t0, t0), P(k + t1, t1), r, c, { seg: 4 }), bar(P(w - k - t0, t0), P(w - k - t1, t1), r, c, { seg: 4 }));
  }
  return out;
}
/** Points along a bow from x0 to x1 at height h rising `rise` in the middle (sagging when negative), at z. */
const bow = (x0, x1, h, rise, z, n = 8) => Array.from({ length: n + 1 }, (_, i) => [x0 + (x1 - x0) * i / n, h + rise * Math.sin(Math.PI * i / n), z]);
/** An iron finial: a ball and a spike, standing on h. */
const finial = (x, h, z, s = 1) => [S(x, h + 1.1 * s, z, 1.2 * s, 1.2 * s, 1.2 * s, IG.iron, { m: 'gloss', seg: 6 }), LA(x, h + 2 * s, z, [[0.8 * s, 0], [0.3 * s, 1.6 * s], [0, 2.8 * s]], IG.iron, { m: 'gloss', seg: 6 })];
/** A scalloped valance hanging from `top`, 2 * half wide: its outline for a prism. */
function scallop(half, depth, n) {
  const pts = [[-half, 0], [half, 0]];
  for (let k = n * 4; k >= 0; k--) { const t = k / (n * 4), f = (t * n) % 1; pts.push([-half + 2 * half * t, -depth * (0.4 + 0.6 * Math.sin(Math.PI * (k === n * 4 ? 0 : f)))]); }
  return pts;
}
/** Three curved legs from a pedestal out to curled feet, the first at angle th0 (0 to the right, a quarter turn the front). */
function tripod(x, z, top, reach, th0 = Math.PI / 6) {
  const out = [];
  for (let k = 0; k < 3; k++) {
    const th = th0 + k * TAU / 3, cx = Math.cos(th), cz = Math.sin(th), P = (rad, h) => [x + cx * rad, h, z + cz * rad];
    const pts = Array.from({ length: 6 }, (_, i) => { const t = i / 5; return P(1.6 + (reach - 1.6) * Math.sin(t * Math.PI / 2), 1.3 + (top - 1.3) * Math.cos(t * Math.PI / 2)); });
    out.push(...line(pts, IR), ...curl([x + cx * reach, 2.6, z + cz * reach], 1.3, 0.4, -Math.PI / 2, -Math.PI / 2 + 1.6 * Math.PI, { u: [cx, cz], r: IR * 0.8, n: 5 }));
  }
  return out;
}

const IVY = [[0, 0], [0.5, 0.18], [0.44, 0.52], [0.2, 0.6], [0, 1], [-0.2, 0.6], [-0.44, 0.52], [-0.5, 0.18]];
/** An ivy leaf in the front plane, its stem at x, h, s long, turned ang counter-clockwise (0 up). */
function ivy(x, h, z, s, ang, c = IG.ivy) {
  const ca = Math.cos(ang), sa = Math.sin(ang);
  return PR(x, h, z, IVY.map(([px, py]) => [(px * ca - py * sa) * s, (px * sa + py * ca) * s]), 0.5, c, CL);
}
const rose = (x, h, z, s = 1.2, c = IG.rose) => S(x, h, z, s, s * 0.9, s, c, { m: 'gloss', seg: 6 });
const LEAF = [IG.ivy, IG.ivyL, IG.ivyD];
/** A climbing stem through points, a leaf at each and a rose every `every` (0 none), its leaves `s` long. */
function vine(pts, o = {}) {
  const out = line(pts, 0.35, IG.ivyD, { m: 'cloth', seg: 4 }), every = o.every ?? 0, s = o.s ?? 3, roses = o.roses ?? [IG.rose, IG.roseL, IG.red];
  pts.forEach(([x, h, z], i) => {
    const next = pts[Math.min(i + 1, pts.length - 1)], prev = pts[Math.max(0, i - 1)], dir = Math.atan2(next[1] - prev[1], next[0] - prev[0]) - Math.PI / 2;
    out.push(ivy(x, h, z + 0.4, s, dir + (i % 2 ? 1 : -1) * 0.9, LEAF[i % 3]));
    if (every && i % every === every - 1) out.push(rose(x, h, z + 0.9, o.rs ?? 1.2, roses[(i / every | 0) % roses.length]));
  });
  return out;
}
/** A stem winding up a post at x, z from h0 to h1, round radius r. */
const windUp = (x, z, h0, h1, r, n, ph = 0) => Array.from({ length: n + 1 }, (_, i) => { const a = ph + i * 1.3; return [x + Math.cos(a) * r, h0 + (h1 - h0) * i / n, z + Math.sin(a) * r]; });
/** A terracotta pot r round, hh tall, with its soil. */
const pot = (x, h, z, r, hh, c = IG.terra) => [
  LA(x, h, z, [[0, 0], [r * 0.72, 0], [r * 0.9, hh * 0.76], [r * 1.08, hh * 0.78], [r * 1.08, hh], [r * 0.94, hh]], c, { m: 'plain', seg: 10 }),
  C(x, h + hh * 0.9, z, r * 0.94, 0.6, IG.soil, { m: 'plain', seg: 10 }),
];
/** A leafy bush, its roses (n of them) dotted over its front. */
function bush(x, h, z, rx, ry, rz, n = 4, o = {}) {
  const c = o.c ?? IG.ivy, dot = o.dot ?? IG.rose, out = [S(x, h, z, rx, ry, rz, c, { m: 'cloth', seg: o.seg ?? 8, tex: 'leafy', dot: n ? dot : undefined })];
  for (let i = 0; i < n; i++) {
    const a = 0.35 + hash(i, x * 3, h) * (Math.PI - 0.7), e = (hash(i, z * 5 + 1, x) - 0.45) * 1.3;
    out.push(rose(x + Math.cos(a) * rx * 0.8, h + e * ry * 0.7, z + Math.sin(a) * rz * 0.8, o.rs ?? Math.max(0.9, Math.min(rx, ry) * 0.24), o.roses?.[i % o.roses.length] ?? dot));
  }
  return out;
}

/* ---------- painting the parts ---------- */

const alphaOf = (hex, a) => { const v = parseInt(hex.slice(1), 16); return `rgba(${v >> 16},${(v >> 8) & 255},${v & 255},${a})`; };
function grad(g, x0, y0, x1, y1, c, m) {
  const l = g.createLinearGradient(x0, y0, x1, y1);
  if (m === 'glow') [[0, sh(c, 2)], [0.5, sh(c, 1)], [1, c]].forEach(s => l.addColorStop(...s));
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
  if (m === 'gloss' && rx > 0.8) { g.save(); g.globalAlpha *= 0.55; oval(cx - rx * 0.38, cy - ry * 0.42, rx * 0.22, ry * 0.14, '#ffffff'); g.restore(); }
}
const polyPath = (pts) => { const p = new Path2D(); pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); p.closePath(); return p; };
const bounds = (pts) => { const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; };

/** The painted-only surface of a part (`tex`), inside its outline `path` over bounds bb. */
function texture(q, path, bb) {
  const g = ctx(), [x0, y0, x1, y1] = bb, c = q.c;
  g.save(); g.clip(path);
  if (q.tex === 'mesh') {
    const s = q.ts || 1.6, span = y1 - y0;
    g.globalAlpha *= 0.55; g.strokeStyle = sh(c, -2); g.lineWidth = Math.max(0.25, s * 0.18);
    g.beginPath();
    for (let k = x0 - span - s; k < x1 + s; k += s) { g.moveTo(k, y1); g.lineTo(k + span, y0); g.moveTo(k + span, y1); g.lineTo(k, y0); }
    g.stroke();
  } else if (q.tex === 'leafy') {
    const n = Math.round((x1 - x0) * (y1 - y0) / 5);
    for (let i = 0; i < n; i++) {
      const px = x0 + hash(i, 11, q.x * 7) * (x1 - x0), py = y0 + hash(i, 12, q.h * 7) * (y1 - y0), v = hash(i, 13, q.z * 3);
      g.globalAlpha = 0.85; g.fillStyle = v < 0.45 ? sh(c, -1) : v < 0.88 || !q.dot ? sh(c, 1) : q.dot;
      g.beginPath(); g.ellipse(px, py, 1.4, 0.8, hash(i, 14) * Math.PI, 0, TAU); g.fill();
    }
  }
  g.restore();
}

/** Paints parts seen from `dir` (0 front, 2 back, 1 / 3 the sides), on a view vw wide standing on line b; Wd is the
    piece's front width in units. */
function paintParts(parts, x0, b, vw, dir, Wd) {
  const side = dir % 2 === 1, sg = dir === 3 ? -1 : 1, flip = dir === 2 ? -1 : 1, g = ctx();
  const U = (px, pz) => (dir === 0 ? x0 + px : dir === 2 ? x0 + Wd - px : x0 + vw / 2 + sg * pz);
  const key = (q) => q.k ?? (dir === 0 ? q.z : dir === 2 ? -q.z : sg * (Wd / 2 - q.x));
  const list = parts.map((q, i) => [key(q), i, q]).sort((a, c) => a[0] - c[0] || a[1] - c[1]).map(e => e[2]);
  for (const q of list) {
    if (q.t === 'pic' && dir !== 0) continue;
    const m = q.m || 'gloss', cx = U(q.x, q.z), cy = b - q.h;
    switch (q.t) {
      case 'box': {
        const w = side ? q.d : q.w; rbx(cx - w / 2, cy - q.hh / 2, w, q.hh, q.r, q.c, m);
        if (q.tex) { const p = new Path2D(); p.roundRect(cx - w / 2, cy - q.hh / 2, w, q.hh, Math.min(q.r, w / 2, q.hh / 2)); texture(q, p, [cx - w / 2, cy - q.hh / 2, cx + w / 2, cy + q.hh / 2]); }
        break;
      }
      case 'cyl': {
        const rb = q.rb ?? q.r, top = cy - q.hh / 2, bot = cy + q.hh / 2, pts = [[cx - q.r, top], [cx + q.r, top], [cx + rb, bot], [cx - rb, bot]];
        poly(pts, q.c, m, m !== 'glow');
        if (m !== 'glass') oval(cx, top, q.r, Math.min(q.r * 0.22, Math.max(0.3, q.hh / 2)), sh(q.c, m === 'glow' ? 2 : 1));
        break;
      }
      case 'ball': {
        const rx = side ? q.rz : q.rx; ball(cx, cy, rx, q.ry, q.c, m);
        if (q.tex) { const p = new Path2D(); p.ellipse(cx, cy, rx, q.ry, 0, 0, TAU); texture(q, p, [cx - rx, cy - q.ry, cx + rx, cy + q.ry]); }
        break;
      }
      case 'disc': if (side) rbx(cx - q.th / 2, cy - (q.ry ?? q.r), q.th, (q.ry ?? q.r) * 2, q.th / 2, q.c, m); else ball(cx, cy, q.r, q.ry ?? q.r, q.c, m); break;
      case 'lathe': {
        const rot = q.rot || 0, c = Math.cos(rot), s = Math.sin(rot), rmax = Math.max(...q.pts.map(p => p[0])), len = Math.max(...q.pts.map(p => p[1]));
        if (side && rot) { const mid = cy - c * len / 2; ball(cx, mid, rmax, (len * Math.abs(c) + 2 * rmax * Math.abs(s)) / 2, q.c, m); break; }
        const P = (dx, up) => [cx + flip * (dx * c - up * s), cy - (dx * s + up * c)];
        const pts = [...q.pts.map(([r, up]) => P(-r, up)), ...q.pts.slice().reverse().map(([r, up]) => P(r, up))];
        poly(pts, q.c, m, m !== 'glow' && !rot);
        if (m === 'gloss' && rmax > 1.2) {
          const at = q.pts.find(p => p[0] === rmax), [hx, hy] = P(-rmax * 0.48, at[1] * 0.92);
          g.save(); g.globalAlpha *= 0.5; oval(hx, hy, rmax * 0.14, Math.max(0.4, len * 0.1), '#ffffff'); g.restore();
        }
        if (rot || m === 'glass' || (q.pts[q.pts.length - 1][0] < 0.01 && q.pts.length > 2)) break;
        const [rt, ut] = q.pts[q.pts.length - 1];
        oval(cx, cy - ut, rt, rt * 0.22, sh(q.c, -2));
        break;
      }
      case 'ring': {
        const ry = q.ry ?? q.r;
        if (side && !q.flat) { if (q.arc) break; rbx(cx - q.tr, cy - ry - q.tr, q.tr * 2, (ry + q.tr) * 2, q.tr, q.c, m); break; }
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
        g.lineCap = 'round'; g.strokeStyle = m === 'glass' ? alphaOf('#cfe8f4', 0.45) : q.c; g.lineWidth = q.r * 2;
        g.beginPath(); g.moveTo(...p0); g.lineTo(...p1); g.stroke();
        if (q.r > 0.55 && m !== 'glass' && m !== 'plain') {
          g.save(); g.globalAlpha *= 0.5; g.strokeStyle = sh(q.c, m === 'gloss' && q.c === IG.iron ? -1 : 2); g.lineWidth = q.r * 0.6;
          g.beginPath(); g.moveTo(p0[0] + q.r * 0.35, p0[1] + q.r * 0.35); g.lineTo(p1[0] + q.r * 0.35, p1[1] + q.r * 0.35); g.stroke(); g.restore();
        }
        break;
      }
      case 'prism': {
        if (side) {
          const hs = q.pts.map(p => p[1]), top = Math.max(...hs), bot = Math.min(...hs);
          rbx(cx - q.d / 2, b - q.h - top, q.d, top - bot, Math.min(1, q.d / 2), q.c, m);
          break;
        }
        const pts = q.pts.map(([px, ph]) => [U(q.x + px), b - q.h - ph]);
        poly(pts, q.c, m);
        if (q.tex) texture(q, polyPath(pts), bounds(pts));
        break;
      }
      case 'pic': g.save(); g.beginPath(); g.rect(cx - q.w / 2, cy - q.hh / 2, q.w, q.hh); g.clip(); q.fn(g, cx - q.w / 2, cy - q.hh / 2, q.w, q.hh); g.restore(); break;
    }
  }
}

/* ---------- pictures ---------- */

/** The post clock's dial: cream, a sage chapter ring, iron-grey marks, a rose at twelve, hands at ten past ten. */
function dial(g, x, y, w, h) {
  const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2;
  g.fillStyle = IG.iron; g.fillRect(x, y, w, h);
  g.fillStyle = IG.cream; g.beginPath(); g.arc(cx, cy, r * 0.97, 0, TAU); g.fill();
  g.strokeStyle = IG.sage; g.lineWidth = r * 0.08; g.beginPath(); g.arc(cx, cy, r * 0.82, 0, TAU); g.stroke();
  g.fillStyle = IG.ink;
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * TAU - Math.PI / 2, big = i % 3 === 0;
    if (i === 0) continue;
    g.save(); g.translate(cx + Math.cos(a) * r * 0.66, cy + Math.sin(a) * r * 0.66); g.rotate(a + Math.PI / 2);
    g.fillRect(-r * (big ? 0.04 : 0.025), -r * (big ? 0.1 : 0.06), r * (big ? 0.08 : 0.05), r * (big ? 0.2 : 0.12)); g.restore();
  }
  g.fillStyle = IG.ivy; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * r * 0.13, cy - r * 0.6, r * 0.1, r * 0.05, s * 0.5, 0, TAU); g.fill(); }
  g.fillStyle = IG.rose; g.beginPath(); g.arc(cx, cy - r * 0.64, r * 0.09, 0, TAU); g.fill();
  g.strokeStyle = IG.ink; g.lineCap = 'round';
  for (const [a, len, lw] of [[-150, 0.4, 0.08], [-30, 0.58, 0.05]]) { const t = a * Math.PI / 180; g.lineWidth = r * lw; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(t) * r * len, cy + Math.sin(t) * r * len); g.stroke(); }
  g.fillStyle = IG.sageD; g.beginPath(); g.arc(cx, cy, r * 0.07, 0, TAU); g.fill();
}

/* ---------- the kinds ---------- */

/** What js/base-models-irongarden.js builds for each upright kind: its parts, doors and default material. */
export const BUILT = {};
/** The rug's outline, a paving circle, in painted units across its 3 x 3 tiles. */
export const RUG = Array.from({ length: 32 }, (_, i) => { const a = i / 32 * TAU; return [48 + Math.cos(a) * 46, 48 + Math.sin(a) * 46]; });

function piece(id, name, w, h, price, parts, { doors = [], inside, ...rest } = {}) {
  BUILT[id] = { parts, doors, inside, mat: 'gloss' };
  const all = [...parts, ...doors.flatMap(d => d.parts)];
  return { id, name, group: GROUP, solo: true, outdoor: true, yard: GROUP, w, h, price, ...rest, draw(x, b, vw, dir) { floorShadow(x, b, vw); paintParts(all, x, b, vw, dir, w * 32); } };
}

/** A sage cushion. */
const cushion = (x, h, z, w, hh, d, c = IG.sage) => B(x, h, z, w, hh, d, c, { m: 'cloth', r: Math.min(1.4, hh / 2) });
/** A front-plane arm scroll at x (sg 1 the left arm, -1 the right) rising from the seat at h to the arm at top. */
const armCurl = (x, h, top, z, sg) => [bar([x, h, z], [x, top - 4.4, z], IR), ...curl([x - sg * 1.2, top - 2.2, z], 2.3, 0.5, -Math.PI / 2, -Math.PI / 2 - 1.7 * Math.PI, { u: [sg, 0], r: IR, n: 8 })];
/** A lamp or clock post's foot: a stepped base and four curled feet. */
const postFoot = (x) => [
  LA(x, 0, 0, [[5.6, 0], [5.6, 1.4], [4, 2.6], [2.6, 4.6], [1.8, 7]], IG.iron, { m: 'gloss', seg: 8, ry: Math.PI / 8 }),
  ...[0, 1, 2, 3].flatMap(k => { const th = Math.PI / 4 + k * Math.PI / 2, cx = Math.cos(th), cz = Math.sin(th); return curl([x + cx * 6.8, 2.2, cz * 6.8], 1.8, 0.4, Math.PI, Math.PI + 1.6 * Math.PI, { u: [cx, cz], r: IR, n: 6 }); }),
];

/* the bed: a canopy daybed */
const bedParts = (() => {
  const P = [[3, -13], [61, -13], [3, 13], [61, 13]], parts = [];
  for (const [x, z] of P) parts.push(bar([x, 0, z], [x, 76, z], 1.1), S(x, 0.9, z, 1.6, 0.9, 1.6, IG.iron, { m: 'gloss', seg: 6 }), ...finial(x, 76, z, 0.9));
  parts.push(
    fb(32, 10, 0, 58, 2.4, 26),
    cushion(32, 15, 1, 56, 7, 23),
    S(8.5, 21.4, 1, 3.6, 3.2, 10.5, IG.sageL, { m: 'cloth', seg: 10 }), S(55.5, 21.4, 1, 3.6, 3.2, 10.5, IG.sageL, { m: 'cloth', seg: 10 }),
    S(23, 24, -8.6, 7.4, 5.6, 2.6, IG.cream, { m: 'cloth', seg: 10 }), S(41, 24, -8.6, 7.4, 5.6, 2.6, IG.roseL, { m: 'cloth', seg: 10 }),
    ...lattice(4, 19, 56, 22, -12.6, 6),
    fb(32, 19, -12.6, 57, 1.4, 1.4), fb(32, 41, -12.6, 57, 1.6, 1.6),
    ...lyre(18, 41.8, -12.6, 6), ...lyre(32, 41.8, -12.6, 8), ...lyre(46, 41.8, -12.6, 6),
  );
  for (const x of [3, 61]) parts.push(bar([x, 30, -13], [x, 30, 13]), bar([x, 18, -13], [x, 18, 13], IF), ...[-6, 0, 6].map(z => bar([x, 18, z], [x, 30, z], IF)),
    ...curl([x, 24, 9.4], 3, 0.6, Math.PI / 2, Math.PI / 2 + 1.7 * Math.PI, { u: [0, 1], n: 8 }));
  for (const z of [-13, 13]) parts.push(bar([3, 76, z], [61, 76, z]), ...line(bow(3, 61, 76, 9, z + Math.sign(z) * 0.6, 10), IR));
  for (const x of [3, 61]) parts.push(bar([x, 76, -13], [x, 76, 13]));
  parts.push(
    PR(32, 76, 0, [...bow(-29, 29, 0, 9, 0, 10).map(([x, h]) => [x, h]).reverse()], 25, IG.sage, CL),
    PR(32, 76, 12.9, scallop(29, 4.4, 6), 0.6, IG.sage, CL), PR(32, 76, -12.9, scallop(29, 4.4, 6), 0.6, IG.sage, CL),
    ...vine(windUp(3, 13.6, 2, 74, 1.6, 16), { every: 3 }),
    ...vine(bow(4, 30, 79, 4.5, 13.8, 7).map(([x, h, z], i) => [x, h - 3 - (i % 2) * 2, z]), { every: 2 }),
  );
  return parts;
})();

/* the gazebo: six posts on a hexagon, a white ogee roof, a scalloped frieze, railings round all but its open front */
const gazeboParts = (() => {
  const X = 48, R = 37, parts = [], at = (k, r = R) => { const th = Math.PI / 2 + Math.PI / 6 + k * Math.PI / 3; return [X + Math.cos(th) * r, Math.sin(th) * r]; };
  parts.push(C(X, 2, 0, 45, 4, IG.stone, { m: 'plain', seg: 6, ry: Math.PI / 6 }), C(X, 4.3, 0, 41, 0.6, IG.stoneD, { m: 'plain', seg: 6, ry: Math.PI / 6 }));
  for (let k = 0; k < 6; k++) {
    const [x, z] = at(k);
    parts.push(bar([x, 4, z], [x, 84, z], 1.2), C(x, 5.6, z, 2, 3.2, IG.iron, { m: 'gloss', seg: 6 }));
    const [x2, z2] = at(k + 1), len = Math.hypot(x2 - x, z2 - z), u = [(x2 - x) / len, (z2 - z) / len], mx = (x + x2) / 2, mz = (z + z2) / 2;
    parts.push(bar([x, 84, z], [x2, 84, z2], IR));
    parts.push(...line(Array.from({ length: 7 }, (_, i) => { const t = i / 6; return [x + (x2 - x) * t, 84 - 5.5 * Math.sin(Math.PI * t), z + (z2 - z) * t]; }), IF));
    parts.push(...lyre(mx, 70.6, mz, 7.6, { u, n: 8 }));
    if (k === 5) continue;
    parts.push(bar([x, 24, z], [x2, 24, z2], IR), bar([x, 8, z], [x2, 8, z2], IF));
    for (const t of [0.2, 0.8]) parts.push(bar([x + (x2 - x) * t, 8, z + (z2 - z) * t], [x + (x2 - x) * t, 24, z + (z2 - z) * t], IF));
    parts.push(...lyre(mx, 8.6, mz, 14, { u, n: 8 }));
  }
  const roof = [[42, 0], [41, 1.4], [35, 8], [25, 17], [14, 25], [6, 31], [2, 35], [1.6, 36]];
  parts.push(LA(X, 84, 0, roof, IG.iron, { m: 'gloss', seg: 6, ry: Math.PI / 6 }));
  for (let k = 0; k < 6; k++) {
    const th = Math.PI / 2 + Math.PI / 6 + k * Math.PI / 3, c = Math.cos(th), s = Math.sin(th);
    parts.push(...line(roof.slice(0, 7).map(([r, h]) => [X + c * r * 1.03, 84 + h + 0.5, s * r * 1.03]), IF));
  }
  parts.push(PR(X, 84, 36.4, scallop(19, 4, 4), 0.6, IG.iron, GL));
  parts.push(
    LA(X, 119.4, 0, [[2.2, 0], [3.2, 2.4], [1.6, 5], [1, 6.6]], IG.iron, { m: 'gloss', seg: 8 }), S(X, 128, 0, 2, 2, 2, IG.iron, { m: 'gloss', seg: 8 }),
    bar([X, 128, 0], [X, 146, 0], IF), bar([X - 7, 135, 0], [X + 7, 135, 0], 0.4, IG.iron, { seg: 4 }), bar([X, 135, -7], [X, 135, 7], 0.4, IG.iron, { seg: 4 }),
    ...[[-7, 0], [7, 0], [0, -7], [0, 7]].map(([dx, dz]) => S(X + dx, 135, dz, 0.8, 0.8, 0.8, IG.iron, { m: 'gloss', seg: 6 })),
  );
  // Butterfree on the vane: a dark wing edge behind each white wing, the body, a head with its big red eyes
  const wing = [[0.6, 0], [5.4, 2.6], [8.6, 6.2], [8, 8.6], [4.6, 8.4], [1.8, 5.4], [0.4, 2.2]], low = [[0.6, -0.2], [4.6, -2.6], [5.6, -5.4], [3.6, -6.4], [1.4, -4.4]];
  for (const sg of [-1, 1]) {
    const mir = (pts, k = 1) => pts.map(([px, ph]) => [sg * px * k, ph * k]);
    parts.push(PR(X, 145.6, 0.6, mir(wing, 1.12), 0.4, IG.bfEdge, PL), PR(X, 145.9, 0.9, mir(wing), 0.4, IG.bfWing, PL),
      PR(X, 145.2, 0.6, mir(low, 1.14), 0.4, IG.bfEdge, PL), PR(X, 145.2, 0.9, mir(low), 0.4, IG.bfWing, PL),
      bar([X + sg * 0.8, 151.4, 1.2], [X + sg * 2.6, 155, 1.2], 0.25, IG.bfEdge, { m: 'plain', seg: 4 }));
  }
  parts.push(S(X, 145.4, 1.4, 1.3, 3.4, 1.3, IG.bfBody, { m: 'gloss', seg: 8 }), S(X, 150, 1.4, 2, 1.8, 1.8, IG.bfBody, { m: 'gloss', seg: 8 }),
    ...[-1, 1].map(sg => DS(X + sg * 1.1, 150.3, 3, 0.9, 0.4, IG.bfEye, { m: 'gloss', seg: 6, ry: 1.1 })));
  for (const k of [0, 5]) {
    const [x, z] = at(k);
    parts.push(...vine(windUp(x, z, 5, 82, 1.8, 18, k), { every: 3, s: 3.4 }));
  }
  return parts;
})();

export const IRONGARDEN_KINDS = [
  // a canopy daybed: four slender posts with finials, a lattice back with lyre crests, a sage mattress, bolsters and
  // pillows, a sage canopy with a scalloped valance, a rose climbing the front post
  piece('igdbed', 'Iron garden canopy daybed', 2, 1, 1600, bedParts),

  // a side chair: slender legs, a mesh seat with a sage cushion, a lattice back under a bowed rail and a lyre crest
  piece('igdchair', 'Iron garden chair', 1, 1, 480, [
    ...[[6, 9], [26, 9], [6, -10], [26, -10]].flatMap(([x, z]) => [bar([x, 0, z], [x, 14, z], IR), S(x, 0.7, z, 1.1, 0.7, 1.1, IG.iron, { m: 'gloss', seg: 6 })]),
    ...[6, 26].map(x => bar([x, 14, -10], [x, 40, -10], IR)), ...finial(6, 40, -10, 0.7), ...finial(26, 40, -10, 0.7),
    mesh(16, 14, -0.5, 22, 1.4, 21),
    cushion(16, 15.9, 0.4, 19.6, 2.2, 18),
    ...lattice(6.6, 19, 18.8, 16, -10, 4.4),
    fb(16, 19, -10, 19.6, 1.2, 1.2),
    ...line(bow(6, 26, 35, 3.4, -10, 6), IR),
    ...lyre(16, 38.2, -10, 5),
    ...curl([10.5, 10, 9.4], 2.2, 0.5, Math.PI / 2, Math.PI / 2 + 1.7 * Math.PI, { n: 8 }), ...curl([21.5, 10, 9.4], 2.2, 0.5, Math.PI / 2, Math.PI / 2 + 1.7 * Math.PI, { u: [-1, 0], n: 8 }),
  ]),

  // a loveseat: a mesh seat with two sage cushions, a lattice back under a bowed rail with a lyre crest, scroll arms
  piece('igdbench', 'Iron garden loveseat bench', 2, 1, 1100, [
    ...[[5, 9], [59, 9], [5, -10], [59, -10]].flatMap(([x, z]) => [bar([x, 0, z], [x, 14, z], IR), S(x, 0.7, z, 1.1, 0.7, 1.1, IG.iron, { m: 'gloss', seg: 6 })]),
    ...[5, 59].map(x => bar([x, 14, -10], [x, 40, -10], IR)), ...finial(5, 40, -10, 0.8), ...finial(59, 40, -10, 0.8),
    mesh(32, 14, -0.5, 56, 1.4, 21),
    cushion(18.6, 16, 0.4, 26, 2.4, 18), cushion(45.4, 16, 0.4, 26, 2.4, 18),
    S(20, 25, -7.4, 7, 5, 2.2, IG.cream, { m: 'cloth', seg: 10 }), S(44, 25, -7.4, 7, 5, 2.2, IG.roseL, { m: 'cloth', seg: 10 }),
    ...lattice(5.6, 19, 52.8, 17, -10, 5),
    fb(32, 19, -10, 54, 1.2, 1.2),
    ...line(bow(5, 59, 36, 5.6, -10, 10), IR),
    ...lyre(32, 41.4, -10, 6),
    ...[5, 59].map(x => bar([x, 26, -10], [x, 26, 8], IR)),
    ...armCurl(5, 14, 26, 8.6, 1), ...armCurl(59, 14, 26, 8.6, -1),
    ...[18, 32, 46].flatMap(x => lyre(x, 6, 9.4, 6, { n: 8 })),
  ]),

  // a round bistro table: a white top on a turned pedestal, three curved legs with curled feet, lyres hung round its apron
  piece('igdtable', 'Iron garden bistro table', 1, 1, 620, [
    C(16, 24.4, 0, 14.4, 1.4, IG.iron, { m: 'gloss', seg: 24 }),
    RG(16, 23.3, 0, 13.4, 0.6, IG.ironD, { m: 'gloss', flat: true }),
    ...Array.from({ length: 6 }, (_, k) => { const th = k * Math.PI / 3 + Math.PI / 6, c = Math.cos(th), s = Math.sin(th); return lyre(16 + c * 12.4, 19.2, s * 12.4, 4, { u: [-s, c], n: 7 }); }).flat(),
    LA(16, 1.5, 0, [[2.4, 0], [1.4, 2], [1.2, 7], [2.2, 9], [1.2, 11], [1.1, 19], [2.2, 21.6], [2.6, 22.2]], IG.iron, { m: 'gloss', seg: 8 }),
    ...tripod(16, 0, 9, 11.6),
  ], { top: 25.1 }),

  // a potting bench: a slatted top, a mesh shelf of stacked pots and a watering can, a lattice back with a shelf of
  // seedlings, a trowel hung on a hook
  piece('igddesk', 'Iron garden potting bench', 2, 1, 980, [
    ...[[4, 11], [60, 11], [4, -11.6], [60, -11.6]].map(([x, z]) => bar([x, 0, z], [x, 26, z], 1)),
    ...[0, 1, 2, 3].map(i => B(32, 26, -9.6 + i * 6.4, 61, 1.6, 5.4, IG.iron, { m: 'gloss', r: 0.4 })),
    mesh(32, 7, 0, 56, 1.2, 22),
    ...[18, 32, 46].flatMap(x => lyre(x, 24.4, 11.4, 5, { down: true, n: 8 })),
    ...[4, 60].map(x => bar([x, 26, -12.4], [x, 54, -12.4], IR)), ...finial(4, 54, -12.4, 0.8), ...finial(60, 54, -12.4, 0.8),
    ...lattice(4.6, 27.4, 54.8, 18, -12.4, 6),
    fb(32, 46, -10.4, 56, 1.2, 5), fb(32, 27.4, -12.4, 56, 1, 1),
    ...line(bow(4, 60, 50, 3, -12.4, 8), IR), ...lyre(32, 52.6, -12.4, 5),
    ...[14, 25, 36].flatMap((x, i) => [...pot(x, 46.6, -10.4, 2.2, 3.8), ...bush(x, 51.6, -10.4, 2.4, 2, 2, 0, { c: [IG.ivyL, IG.sage, IG.ivy][i] })]),
    bar([48, 44, -11.6], [48, 41.6, -11.6], 0.3), bar([48, 41.6, -11.4], [48, 36, -11.4], 0.5, IG.terraD, { m: 'plain', seg: 4 }), PR(48, 30, -11.2, [[-1.4, 6], [1.4, 6], [1.2, 2], [0, 0], [-1.2, 2]], 0.6, IG.zinc, GL),
    ...pot(12, 7.6, 2, 5, 7), ...pot(12, 14, 2, 4.4, 4.4), ...pot(22, 7.6, 3, 3.4, 5.4),
    C(45, 12.6, 3, 4.4, 10, IG.zinc, { m: 'gloss', seg: 12 }), bar([48.6, 10, 3], [55.4, 17, 3], 0.7, IG.zinc), LA(55.4, 17, 3, [[0.6, 0], [1.6, 1.6], [1.6, 2]], IG.zinc, { m: 'gloss', seg: 8, rot: -0.75 }),
    RG(45, 17.6, 3, 3.4, 0.6, IG.zinc, { m: 'gloss', arc: Math.PI, a0: 0 }),
    ...pot(52, 26.8, -7, 3.2, 5), ...bush(52, 34, -7, 3.6, 3, 3, 3),
  ], { top: 26.8 }),

  // a little glass conservatory of a cabinet: an iron frame, glass sides and a glass gable roof, glass shelves of pots and
  // roses inside, two glass doors that open, lyres on their tops
  piece('igdcabinet', 'Iron garden glass plant cabinet', 2, 1, 1500, [
    B(32, 2.5, 0, 60, 5, 26, IG.iron, { m: 'gloss', r: 0.8 }),
    ...[[3, -12.4], [61, -12.4], [3, 12.4], [61, 12.4]].map(([x, z]) => fb(x, 38.5, z, 1.8, 67, 1.8)),
    fb(32, 71.6, 0, 60, 1.8, 26),
    B(32, 38.5, -12.2, 56, 66, 0.6, '#cfe8f4', { m: 'glass', r: 0 }),
    ...[3.4, 60.6].map(x => B(x, 38.5, 0, 0.6, 66, 23, '#cfe8f4', { m: 'glass', r: 0 })),
    ...[27, 49].flatMap(h => [B(32, h, 0, 56, 0.6, 22, '#cfe8f4', { m: 'glass', r: 0 }), fb(32, h, 10.8, 56, 0.8, 0.8)]),
    PR(32, 72.4, 0, [[-30, 0], [30, 0], [0, 14]], 25, '#cfe8f4', GS),
    ...[-12.6, 12.6].flatMap(z => [bar([2, 72.4, z], [32, 86.4, z]), bar([62, 72.4, z], [32, 86.4, z])]),
    bar([32, 86.4, -12.6], [32, 86.4, 12.6]), ...lyre(32, 73.4, 12.9, 8), ...finial(32, 86.4, 12.6, 0.9), ...finial(32, 86.4, -12.6, 0.9),
    ...pot(19, 5, -2, 5.4, 8), ...bush(19, 19, -2, 7.4, 6, 6.6, 5),
    ...pot(44, 5, -2, 4.6, 7.4), ...bush(44, 17.4, -2, 6.4, 5, 6, 0, { c: IG.ivyL }),
    ...[13, 32, 51].flatMap((x, i) => [...pot(x, 27.4, -2, 3.2, 5), ...bush(x, 35.6, -2, 4, 3.6, 3.6, i === 1 ? 3 : 0, { c: [IG.sage, IG.ivy, IG.ivyL][i], dot: IG.roseL })]),
    ...pot(22, 49.4, -3, 3.4, 5.6), ...bush(22, 57.6, -3, 4, 3.2, 3.6, 0),
    ...vine([[25, 56, 0], [27, 52, 2], [27.6, 47, 4], [26.6, 42, 5]], { s: 2.6 }),
    C(42, 53, -3, 3, 7, IG.zinc, { m: 'gloss', seg: 10 }), bar([44.6, 51.4, -3], [49, 55.6, -3], 0.5, IG.zinc),
  ], {
    doors: [0, 1].map(i => {
      const x0 = i ? 32 : 4, x1 = i ? 60 : 32, cx = (x0 + x1) / 2;
      return { hinge: [i ? 60 : 4, 13.6], side: i ? -1 : 1, parts: [
        fb(cx, 70, 13.6, 28, 1.6, 1.2), fb(cx, 6, 13.6, 28, 1.6, 1.2),
        fb(x0 + 0.8, 38, 13.6, 1.6, 65.6, 1.2), fb(x1 - 0.8, 38, 13.6, 1.6, 65.6, 1.2), fb(cx, 38, 13.6, 25, 1, 0.8),
        B(cx, 38, 13.4, 25, 62, 0.4, '#cfe8f4', { m: 'glass', r: 0 }),
        ...lyre(cx, 58.4, 13.9, 8, { n: 8 }),
        S(i ? x0 + 2.6 : x1 - 2.6, 38, 14.6, 1, 1, 1, IG.iron, { m: 'gloss', seg: 6 }),
      ] };
    }),
    inside: { x: 32, h: 38, w: 54, hh: 62, z: 12, bare: true },
  }),

  // a three-tier plant stand (the set's dresser): mesh tiers stepping back, scrolled sides, eight pots of roses, ivy and herbs
  piece('igdstand', 'Iron garden tiered plant stand', 2, 1, 820, [
    ...[0, 1, 2].map(k => mesh(32, 9 + k * 11, 8 - k * 8, 58, 1.2, 8.6)),
    ...[3, 61].flatMap(x => [
      bar([x, 0, 12], [x, 9, 12], IR), bar([x, 0, 4], [x, 20, 4], IR), bar([x, 0, -4], [x, 31, -4], IF), bar([x, 0, -12], [x, 31, -12], IR),
      bar([x, 9, 12], [x, 9, 4], IR), bar([x, 20, 4], [x, 20, -4], IR), bar([x, 31, -4], [x, 31, -12], IR),
      ...curl([x, 16, -4], 6, 1.2, -Math.PI / 2, -Math.PI / 2 + 1.7 * Math.PI, { u: [0, 1], n: 10, r: IF }),
    ]),
    ...finial(3, 31, -12, 0.8), ...finial(61, 31, -12, 0.8),
    ...[14, 32, 50].flatMap(x => lyre(x, 1, 12, 6.6, { n: 8 })),
    ...[[12, 0, 0], [32, 0, 1], [52, 0, 2], [20, 1, 3], [44, 1, 4], [12, 2, 5], [32, 2, 6], [52, 2, 7]].flatMap(([x, k, i]) => {
      const h = 9.6 + k * 11, z = 8 - k * 8, r = 3 + (i % 3) * 0.4, hh = 5 + (i % 2);
      const plant = i % 4 === 0 ? bush(x, h + hh + 3, z, 4, 3.6, 3.4, 4)
        : i % 4 === 1 ? [...bush(x, h + hh + 2.4, z, 3.4, 2.6, 3, 0, { c: IG.ivyL }), ...vine([[x + 2, h + hh, z + 2], [x + 3.4, h + hh - 3, z + 3], [x + 3.6, h + hh - 6.4, z + 3.6]], { s: 2.4 })]
          : i % 4 === 2 ? bush(x, h + hh + 3, z, 3.4, 3.6, 3, 3, { c: IG.sage, dot: IG.lilac, roses: [IG.lilac, IG.yellow] })
            : bush(x, h + hh + 2.8, z, 4, 3, 3.4, 3, { dot: IG.roseL });
      return [...pot(x, h, z, r, hh, i % 3 === 1 ? IG.terraL : IG.terra), ...plant];
    }),
  ]),

  // a tall étagère (the set's shelf): four mesh shelves on slender posts, side curls, a lyre crest, pots and trailing ivy
  piece('igdetagere', 'Iron garden étagère', 1, 1, 760, [
    ...[[3, 9], [29, 9], [3, -9], [29, -9]].flatMap(([x, z]) => [bar([x, 0, z], [x, 70, z], IR), ...finial(x, 70, z, 0.7)]),
    ...[4, 22, 40, 58].map(h => mesh(16, h, 0, 26.6, 1.2, 18.6)),
    ...[3, 29].flatMap(x => [13, 31, 49].flatMap(h => curl([x, h, 0], 4.4, 1, -Math.PI / 2, -Math.PI / 2 + 1.7 * Math.PI, { u: [0, x < 16 ? 1 : -1], n: 9 }))),
    ...lyre(16, 59, -9, 7), ...line(bow(3, 29, 64, 2.4, -9, 6), IF),
    ...pot(11, 4.6, 0, 4.6, 7.4), ...bush(11, 17.4, 0, 6, 5, 5.4, 0, { c: IG.ivyL }), C(23.6, 9, 2, 3.4, 8, IG.zinc, { m: 'gloss', seg: 10 }), bar([26.4, 8, 2], [30, 12.6, 2], 0.5, IG.zinc),
    ...pot(9, 22.6, -1, 3.2, 5), ...bush(9, 31, -1, 3.8, 3.4, 3.4, 3),
    ...pot(22, 22.6, 0, 3.4, 5.2), ...bush(22, 30, 0, 3.8, 2.6, 3.6, 0), ...vine([[24, 28, 3], [25.6, 24, 6], [26.4, 19, 7.6], [26, 14.6, 8.4]], { s: 2.6 }),
    ...pot(16, 40.6, 0, 4, 6), ...bush(16, 50.6, 0, 5.4, 4.4, 4.4, 5, { dot: IG.red, roses: [IG.red, IG.rose] }),
    ...pot(10, 58.6, 0, 3, 4.6), ...bush(10, 65.2, 0, 3.4, 2.4, 3, 0, { c: IG.ivyL }), ...vine([[8, 63, 3], [5.6, 59, 6], [5, 53.6, 7.6], [5.6, 48.4, 8.4], [5, 44, 8.6]], { s: 2.6 }),
  ]),

  // a garden lamppost: a stepped foot with curled feet, a slender post wound with a rose, scroll brackets, a hexagonal
  // glass lantern glowing under an onion cap
  piece('igdlamp', 'Iron garden lamppost', 1, 1, 760, [
    ...postFoot(16),
    LA(16, 7, 0, [[1.8, 0], [1.3, 3], [1.2, 58], [1.7, 60], [1.7, 63]], IG.iron, { m: 'gloss', seg: 8 }),
    ...[-1, 1].flatMap(sg => curl([16 + sg * 3.4, 66, 0], 3.4, 0.7, Math.PI, Math.PI + 1.75 * Math.PI, { u: [sg, 0], r: IR, n: 10 })),
    C(16, 70.6, 0, 4.6, 1.2, IG.iron, { m: 'gloss', seg: 8 }),
    C(16, 76.6, 0, 4, 10.6, '#cfe8f4', { m: 'glass', seg: 6, rb: 3.4 }),
    ...Array.from({ length: 6 }, (_, k) => { const th = k * Math.PI / 3, c = Math.cos(th) * 4, s = Math.sin(th) * 4; return bar([16 + c * 0.86, 71.2, s * 0.86], [16 + c, 82, s], 0.4, IG.iron, { seg: 4 }); }),
    LA(16, 81.6, 0, [[5.2, 0], [4.8, 1.2], [2.8, 3.4], [1.3, 5], [0.7, 6.4], [0, 7]], IG.iron, { m: 'gloss', seg: 6 }),
    ...finial(16, 88, 0, 0.8),
    S(16, 76.6, 0, 2.6, 3.8, 2.6, IG.glow, { m: 'glow', seg: 8 }),
    ...vine(windUp(16, 0, 8, 60, 1.9, 13), { every: 3, s: 3 }),
  ], { glow: [IG.glow] }),

  // a post clock: the lamppost's foot and post, lyre brackets under a round iron-cased clock, a lyre crest and finial
  piece('igdclock', 'Iron garden post clock', 1, 1, 900, [
    ...postFoot(16),
    LA(16, 7, 0, [[1.8, 0], [1.3, 3], [1.2, 48], [1.7, 50]], IG.iron, { m: 'gloss', seg: 8 }),
    ...lyre(16, 49, 0.4, 8, { r: IR }),
    DS(16, 68, 0, 10.4, 3.4, IG.iron, { m: 'gloss', seg: 20 }),
    RG(16, 68, 1.4, 10.4, 1.2, IG.iron, { m: 'gloss' }),
    PC(16, 68, 1.8, 17, 17, dial),
    DS(16, 68, -1.8, 8.6, 0.3, IG.cream, { m: 'gloss', seg: 16 }),
    ...lyre(16, 78.2, 0, 5.6, { r: IR }), ...finial(16, 83.4, 0, 0.8),
    ...vine(windUp(16, 0, 8, 48, 1.9, 10, 1), { every: 4, s: 3 }),
  ]),

  // a three-panel trellis screen: arched iron frames of crossed lattice, ivy climbing across, roses on the middle one
  piece('igdscreen', 'Iron garden ivy trellis screen', 2, 1, 640, [
    ...[[11, 3, 0], [32, -3, 1], [53, 3, 2]].flatMap(([x, z, i]) => [
      fb(x - 9.4, 31, z, 1.4, 60, 1.4), fb(x + 9.4, 31, z, 1.4, 60, 1.4), fb(x, 3.6, z, 19, 1.4, 1.4),
      ...[-9.4, 9.4].map(dx => S(x + dx, 0.8, z, 1.4, 0.8, 1.4, IG.iron, { m: 'gloss', seg: 6 })),
      ...line(bow(x - 9.4, x + 9.4, 61, 5, z, 6), IR), ...finial(x, 66, z, 0.8),
      ...lattice(x - 8.7, 4.3, 17.4, 56.6, z, 4.4),
      ...vine(Array.from({ length: 12 }, (_, j) => [x + (j % 2 ? 3 : -3) + (i - 1) * 2, 2 + j * 5, z + 1.2]), { every: i === 1 ? 2 : 0, s: 3.4 }),
    ]),
    ...[21.5, 42.5].flatMap(x => [16, 46].map(h => B(x, h, 0, 1, 3, 7.4, IG.ironD, { m: 'gloss', r: 0 }))),
  ]),

  // a standing mirror: an oval glass in a slim iron ring between two posts, curled feet, a lyre crest with a rose
  piece('igdmirror', 'Iron garden standing mirror', 1, 1, 700, [
    ...[4.6, 27.4].flatMap(x => [
      bar([x, 1, -7], [x, 1, 7], IR), ...curl([x, 2.6, 7], 1.6, 0.4, -Math.PI / 2, -Math.PI / 2 + 1.6 * Math.PI, { u: [0, 1], n: 6 }), ...curl([x, 2.6, -7], 1.6, 0.4, -Math.PI / 2, -Math.PI / 2 + 1.6 * Math.PI, { u: [0, -1], n: 6 }),
      bar([x, 1, 0], [x, 50, 0], IR), ...finial(x, 50, 0, 0.7), S(x, 36, 0, 1.3, 1.3, 1.3, IG.iron, { m: 'gloss', seg: 6 }),
    ]),
    bar([4.6, 10, 0], [27.4, 10, 0], IR), ...lyre(16, 10, 0, 6),
    DS(16, 36, 0, 9.6, 0.8, IG.mirror, { m: 'gloss', ry: 15, seg: 20 }),
    RG(16, 36, 0.3, 10.2, 0.9, IG.iron, { m: 'gloss', ry: 15.6 }),
    bar([5.4, 36, 0], [6, 36, 0], IF), bar([26, 36, 0], [26.6, 36, 0], IF),
    ...lyre(16, 50.4, 0.2, 6), rose(16, 57, 1, 1.6), ivy(14.2, 56, 0.8, 3, 0.9), ivy(17.8, 56, 0.8, 3, -0.9, IG.ivyL),
  ]),

  // a mosaic paving circle, rings of terracotta, cream and sage tesserae round a terracotta rose
  { id: 'igdrug', name: 'Iron garden mosaic paving', group: GROUP, solo: true, outdoor: true, yard: GROUP, w: 3, h: 3, layer: 'rug', price: 900, high: 0.04, side: 'c', flat() {
    const g = ctx(), cx = 48, cy = 48;
    g.fillStyle = IG.grout; g.beginPath(); g.arc(cx, cy, 46, 0, TAU); g.fill();
    const rings = [[46, 41.6, [IG.terra, IG.terraD, IG.terraL]], [41.6, 37.6, [IG.cream, IG.stone, '#efe4c8']], [37.6, 33.8, [IG.sage, IG.sageD, IG.sageL]],
      [33.8, 29.6, [IG.stone, IG.cream, IG.stoneD]], [29.6, 26, [IG.terraL, IG.terra, IG.cream]], [26, 21.6, [IG.cream, IG.stone, '#efe4c8']],
      [21.6, 18, [IG.sage, IG.sageL, IG.sageD]], [18, 13.4, [IG.stone, IG.cream, '#efe4c8']]];
    rings.forEach(([r1, r0, cols], ri) => {
      const n = Math.max(8, Math.round(TAU * (r0 + r1) / 2 / 3.6)), gap = 0.36 / ((r0 + r1) / 2);
      for (let i = 0; i < n; i++) {
        const a0 = i / n * TAU + gap + ri * 0.13, a1 = (i + 1) / n * TAU - gap + ri * 0.13, v = hash(i, ri, 7);
        g.fillStyle = cols[v < 0.55 ? 0 : v < 0.85 ? 1 : 2];
        g.beginPath(); g.arc(cx, cy, r1 - 0.35, a0, a1); g.arc(cx, cy, r0 + 0.35, a1, a0, true); g.closePath(); g.fill();
      }
    });
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU, sp = 0.32;
      g.fillStyle = i % 2 ? IG.terraL : IG.terra;
      g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, 12.6, a - sp, a + sp); g.closePath(); g.fill();
      g.fillStyle = IG.sageD; g.beginPath(); g.ellipse(cx + Math.cos(a + Math.PI / 8) * 10, cy + Math.sin(a + Math.PI / 8) * 10, 2, 1, a + Math.PI / 8 + Math.PI / 2, 0, TAU); g.fill();
    }
    g.fillStyle = IG.roseD; g.beginPath(); g.arc(cx, cy, 4.4, 0, TAU); g.fill();
    g.fillStyle = IG.rose; g.beginPath(); g.arc(cx - 0.5, cy - 0.5, 2.6, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.12)';
    for (let x = 2; x < 94; x += 2) for (let y = 2; y < 94; y += 2) if (hash(x, y, 9) < 0.1 && Math.hypot(x - cx, y - cy) < 45) g.fillRect(x, y, 1, 1);
    g.strokeStyle = IG.stoneD; g.lineWidth = 1.2; g.beginPath(); g.arc(cx, cy, 45.4, 0, TAU); g.stroke();
  } },

  // a rose arch: two lattice posts, a double arch banded with radial bars, roses and ivy climbing up and over it
  piece('igdarch', 'Iron garden rose arch', 2, 1, 1200, (() => {
    const parts = [], arcAt = (R, z, n = 12) => Array.from({ length: n + 1 }, (_, i) => { const a = Math.PI - Math.PI * i / n; return [32 + Math.cos(a) * R, 54 + Math.sin(a) * R, z]; });
    for (const x of [4, 60]) {
      for (const z of [-7, 7]) parts.push(bar([x, 0, z], [x, 54, z], 0.9));
      parts.push(...lattice(x, 2, 14, 50, -7, 5, { u: [0, 1] }), fb(x, 0.6, 0, 3, 1.2, 17));
      for (const h of [2, 52]) parts.push(bar([x, h, -7], [x, h, 7], IF));
    }
    for (const z of [-7, 7]) {
      parts.push(...line(arcAt(28, z), 0.9), ...line(arcAt(24.4, z), IF));
      for (let i = 1; i < 24; i += 2) { const a = Math.PI - Math.PI * i / 24; parts.push(bar([32 + Math.cos(a) * 24.4, 54 + Math.sin(a) * 24.4, z], [32 + Math.cos(a) * 28, 54 + Math.sin(a) * 28, z], 0.4, IG.iron, { seg: 4 })); }
    }
    for (let i = 1; i < 12; i += 2) { const [x, h] = arcAt(28, 0)[i]; parts.push(bar([x, h, -7], [x, h, 7], IF)); }
    parts.push(...lyre(32, 82.4, 7, 5));
    for (const sg of [-1, 1]) {
      const x = sg < 0 ? 4 : 60;
      parts.push(...vine(Array.from({ length: 11 }, (_, j) => [x + (j % 2 ? 1.4 : -1.4), 2 + j * 5, 7.8]), { every: 2, s: 3.4 }));
      parts.push(...vine(arcAt(28, 7.8, 12).slice(sg < 0 ? 0 : 6, sg < 0 ? 7 : 13).map(([px, ph, pz], j) => [px, ph + (j % 2 ? 1.6 : -1.2), pz]), { every: 2, s: 3.6, rs: 1.4 }));
    }
    parts.push(...bush(6, 3.6, 10, 4.6, 3.6, 4, 3), ...bush(58, 3.6, 10, 4.6, 3.6, 4, 3, { dot: IG.roseL }));
    return parts;
  })()),

  // a hexagonal gazebo, big (3 x 3, about 160 units tall to its vane): it's an open frame of six posts, a frieze and
  // railings, so its triangles go to many thin rods rather than mass
  piece('igdgazebo', 'Iron garden gazebo', 3, 3, 1800, gazeboParts),

  // a birdbath: a shallow iron basin of water on a turned pedestal and three curled legs, Pidgey perched on its rim
  piece('igdbirdbath', 'Pidgey iron garden birdbath', 1, 1, 560, [
    ...tripod(16, 0, 10, 11, Math.PI / 6),
    LA(16, 1, 0, [[2.6, 0], [1.6, 2.4], [1.3, 17], [2.2, 19], [1.6, 21], [2.8, 24]], IG.iron, { m: 'gloss', seg: 8 }),
    ...lyre(16, 13, 1.6, 7, { n: 8 }),
    LA(16, 24.6, 0, [[2.6, 0], [7, 1], [11, 2.8], [13.2, 5.2], [13.8, 6.6], [13, 7], [12, 6.2]], IG.iron, { m: 'gloss', seg: 16 }),
    C(16, 30.6, 0, 12.3, 0.6, IG.water, { m: 'gloss', seg: 16 }),
    rose(13, 22, 2.6, 1.3), ivy(11, 21.4, 2.2, 2.6, 0.9), ivy(18.6, 22, 2.2, 2.6, -1, IG.ivyL),
    S(27.4, 33.6, -3.6, 2, 1, 2.8, IG.pidgeyD, { m: 'gloss', seg: 6 }),
    S(27.4, 35.2, 0, 3.2, 3, 3.4, IG.pidgey, { m: 'gloss', seg: 10 }),
    S(27.4, 34.6, 2, 2.3, 2.2, 1.6, IG.pidgeyL, { m: 'gloss', seg: 8 }),
    S(27.4, 39.4, 0.8, 2.5, 2.4, 2.5, IG.pidgey, { m: 'gloss', seg: 10 }),
    S(27.4, 39, 2.4, 1.8, 1.5, 1.1, IG.pidgeyL, { m: 'gloss', seg: 8 }),
    S(27.4, 38.7, 3.6, 0.7, 0.5, 0.9, IG.beak, { m: 'gloss', seg: 6 }),
    ...[-1, 1].map(sg => DS(27.4 + sg * 1.1, 39.6, 3.2, 0.5, 0.3, IG.ink, { m: 'gloss', seg: 6 })),
    PR(27.4, 41.2, 0, [[-0.6, 0], [0.6, 0], [-0.4, 2.2], [-1.8, 2.8], [-1, 1.4]], 0.8, IG.pidgeyCrest, GL),
    ...[-1, 1].map(sg => bar([27.4 + sg, 32, 1], [27.4 + sg, 31.2, 1.4], 0.35, IG.foot, { seg: 4 })),
  ]),

  // a tiered fountain: a wide basin, a turned column with curls, a middle and a top basin, water falling as glass sheets,
  // lily pads in the pool
  piece('igdfountain', 'Iron garden tiered fountain', 2, 2, 1500, [
    LA(32, 0, 0, [[0, 0], [28, 0], [29.6, 1], [30, 8], [29.4, 9.6], [27.6, 9.8], [27, 8.6]], IG.iron, { m: 'gloss', seg: 24 }),
    C(32, 8.4, 0, 27.2, 0.6, IG.water, { m: 'gloss', seg: 24 }),
    ...[0.6, 1.1, 1.57, 2.04, 2.54].flatMap(th => { const c = Math.cos(th), s = Math.sin(th); return lyre(32 + c * 30.2, 1.6, s * 30.2, 6, { u: [-s, c], n: 7 }); }),
    LA(32, 8, 0, [[5, 0], [4, 2], [2.4, 5], [2, 12], [3, 14], [2, 16], [1.8, 24]], IG.iron, { m: 'gloss', seg: 10 }),
    ...[Math.PI / 4, 3 * Math.PI / 4, -Math.PI / 4, -3 * Math.PI / 4].flatMap(th => { const c = Math.cos(th), s = Math.sin(th); return curl([32 + c * 4.6, 26, s * 4.6], 2.6, 0.5, -Math.PI / 2, -Math.PI / 2 + 1.6 * Math.PI, { u: [c, s], r: IR, n: 7 }); }),
    LA(32, 30, 0, [[1.8, 0], [6, 1], [11, 3.4], [14, 6], [14.4, 7], [13.4, 7.2], [12.6, 6.4]], IG.iron, { m: 'gloss', seg: 16 }),
    C(32, 36.6, 0, 12.8, 0.5, IG.water, { m: 'gloss', seg: 16 }),
    LA(32, 36, 0, [[1.8, 0], [1.4, 4], [2.4, 7], [1.4, 9], [1.2, 14]], IG.iron, { m: 'gloss', seg: 8 }),
    LA(32, 49, 0, [[1.2, 0], [4, 1], [6.6, 3], [7.2, 4.4], [6.4, 4.6], [6, 4]], IG.iron, { m: 'gloss', seg: 12 }),
    C(32, 52.8, 0, 6.2, 0.4, IG.water, { m: 'gloss', seg: 12 }),
    LA(32, 52, 0, [[1, 0], [1.6, 2], [0.8, 4], [1.4, 5.6], [0, 8]], IG.iron, { m: 'gloss', seg: 8 }),
    LA(32, 8.6, 0, [[13.6, 0], [14, 28]], '#cfe8f4', { m: 'glass', seg: 16 }),
    LA(32, 37, 0, [[7, 0], [7.2, 16.6]], '#cfe8f4', { m: 'glass', seg: 12 }),
    ...[[16, 14], [46, 18], [22, -18]].flatMap(([x, z], i) => [C(x, 8.9, z, 3.6, 0.4, i % 2 ? IG.ivyL : IG.ivy, { m: 'cloth', seg: 10 }), ...(i === 0 ? [rose(x + 1, 9.8, z, 1.2, IG.roseL)] : [])]),
  ]),

  // a hanging-basket stand: a post with two scroll arms, a moss basket of roses and trailing ivy on one and Comfey with
  // its flower lei hanging from the other
  piece('igdbaskets', 'Comfey iron garden basket stand', 1, 1, 540, [
    ...postFoot(16),
    bar([16, 6, 0], [16, 72, 0], 1.1), ...finial(16, 72, 0, 0.9),
    bar([6, 66, 0], [26, 66, 0], IR),
    ...curl([26, 63.4, 0], 2.6, 0.5, Math.PI / 2, Math.PI / 2 - 1.7 * Math.PI, { r: IR, n: 8 }), ...curl([6, 63.4, 0], 2.6, 0.5, Math.PI / 2, Math.PI / 2 - 1.7 * Math.PI, { u: [-1, 0], r: IR, n: 8 }),
    ...[-1, 1].flatMap(sg => [bar([16, 56, 0], [16 + sg * 7, 65.4, 0], IF), ...curl([16 + sg * 4.6, 59.4, 0], 1.6, 0.4, Math.PI, Math.PI + 1.6 * Math.PI, { u: [sg, 0], n: 6 })]),
    ...[[-4.6, 0], [4.6, 0], [0, 4.6], [0, -4.6]].map(([dx, dz]) => bar([24, 66, 0], [24 + dx, 44, dz], 0.25, IG.ironD, { seg: 4 })),
    LA(24, 37.4, 0, [[0.6, 0], [3.4, 0.8], [5, 3.4], [5.6, 6.6]], IG.moss, { m: 'cloth', seg: 10 }),
    RG(24, 44, 0, 5.6, 0.5, IG.iron, { m: 'gloss', flat: true }),
    ...bush(24, 45.6, 0, 5.4, 3.4, 5, 5),
    ...vine([[20, 43, 4], [19.4, 39, 5], [20, 35, 5.2], [19.4, 31, 5]], { s: 2.6 }), ...vine([[28.4, 42, 3.6], [29, 38, 4], [28.4, 34, 4.2]], { s: 2.6, every: 3 }),
    bar([8, 65.4, 0], [8, 56.6, 0], 0.25, IG.ironD, { seg: 4 }),
    RG(8, 51, 0, 5, 0.5, IG.ivy, { m: 'cloth' }),
    ...Array.from({ length: 9 }, (_, i) => { const a = Math.PI / 2 + i / 9 * TAU; return S(8 + Math.cos(a) * 5, 51 + Math.sin(a) * 5, 0.6, 1.5, 1.5, 1.3, [IG.roseL, IG.yellow, IG.china, IG.lilac, IG.rose][i % 5], { m: 'gloss', seg: 6 }); }),
    S(8, 48.4, 0.4, 2.2, 2.5, 1.8, IG.comfey, { m: 'gloss', seg: 8 }),
    ...[-1, 1].map(sg => DS(8 + sg * 0.8, 48.8, 2.2, 0.4, 0.3, IG.ink, { m: 'gloss', seg: 6 })),
    S(8, 51.2, 0.4, 1.2, 1, 1, IG.china, { m: 'gloss', seg: 6 }), S(8, 51.2, 1.2, 0.5, 0.5, 0.4, IG.yellow, { m: 'gloss', seg: 6 }),
  ]),

  // a trellis fence: two posts with ball caps, spear-tipped pickets rising to a bow, a band of little iron rings, ivy
  piece('igdfence', 'Iron garden trellis fence', 2, 1, 360, [
    ...[2.5, 61.5].flatMap(x => [fb(x, 20, 0, 3, 40, 3), B(x, 40.6, 0, 4, 1.4, 4, IG.iron, { m: 'gloss', r: 0.3 }), S(x, 43.2, 0, 1.8, 1.8, 1.8, IG.iron, { m: 'gloss', seg: 6 })]),
    fb(32, 7, 0, 56, 1.4, 1), fb(32, 26, 0, 56, 1.4, 1), fb(32, 14.4, 0, 56, 1, 0.8),
    ...Array.from({ length: 14 }, (_, i) => { const x = 6 + i * 4, top = 31 + 4.6 * Math.sin(Math.PI * (x - 4) / 56); return [bar([x, 0.6, 0], [x, top, 0], 0.6, IG.iron, { seg: 4 }), LA(x, top, 0, [[0.9, 0], [1.3, 0.8], [0, 3.2]], IG.iron, { m: 'gloss', seg: 4 })]; }).flat(),
    ...Array.from({ length: 13 }, (_, i) => curl([8 + i * 4, 20.4, 0.3], 1.4, 1.4, 0, TAU, { r: 0.4, n: 6, seg: 4 })).flat(),
    ...vine(Array.from({ length: 14 }, (_, j) => [5 + j * 4, 6 + (j % 2) * 2.6, 1.2]), { s: 3, every: 5 }),
    ...vine(windUp(61.5, 0, 1, 38, 2.2, 8), { s: 3, every: 3 }),
  ]),

  // a garden gate: square posts with finials, an arch of scrolls over them with a climbing rose, two leaves that swing open
  piece('igdgate', 'Iron garden gate', 2, 1, 680, [
    ...[3, 61].flatMap(x => [fb(x, 28, 0, 4, 56, 4), B(x, 56.8, 0, 5, 1.6, 5, IG.iron, { m: 'gloss', r: 0.3 }), S(x, 59.6, 0, 2, 2, 2, IG.iron, { m: 'gloss', seg: 6 }), ...finial(x, 60.6, 0, 0.8)]),
    ...line(Array.from({ length: 13 }, (_, i) => { const a = Math.PI - Math.PI * i / 12; return [32 + Math.cos(a) * 29, 58 + Math.sin(a) * 14, 0]; }), IR),
    ...line(Array.from({ length: 13 }, (_, i) => { const a = Math.PI - Math.PI * i / 12; return [32 + Math.cos(a) * 26, 58 + Math.sin(a) * 10.4, 0]; }), IF),
    ...[18, 46].flatMap(x => lyre(x, 58.4, 0, 6, { n: 8 })), ...lyre(32, 61.6, 0, 6.6, { n: 8 }),
    ...vine(Array.from({ length: 12 }, (_, i) => { const a = Math.PI - Math.PI * i / 11; return [32 + Math.cos(a) * 28, 58 + Math.sin(a) * 13.4 + (i % 2 ? 1.4 : -1), 1.4]; }), { every: 2, s: 3.4, rs: 1.4 }),
    ...vine(Array.from({ length: 10 }, (_, j) => [3 + (j % 2 ? 2.6 : -1), 4 + j * 5.6, 2.6]), { every: 3, s: 3.2 }),
  ], {
    doors: [0, 1].map(i => {
      const x0 = i ? 32 : 5, x1 = i ? 59 : 32, cx = (x0 + x1) / 2, outer = i ? x1 : x0, top = (x) => 42 + 6 * ((x - outer) / (32 - outer)) ** 2;
      const pk = Array.from({ length: 5 }, (_, j) => x0 + 4.5 + j * 4.5);
      return { hinge: [i ? 59 : 5, 0], side: i ? -1 : 1, parts: [
        fb(x0 + 0.8, 23, 0, 1.6, 42, 1.2), fb(x1 - 0.8, 24.6, 0, 1.6, 45, 1.2),
        fb(cx, 3, 0, 27, 1.4, 1), fb(cx, 18, 0, 27, 1.4, 1),
        ...line(Array.from({ length: 7 }, (_, j) => { const x = x0 + (x1 - x0) * j / 6; return [x, top(x), 0]; }), IR),
        ...pk.flatMap(x => [bar([x, 18, 0], [x, top(x) + 2.2, 0], 0.5, IG.iron, { seg: 4 }), LA(x, top(x) + 2.2, 0, [[0.8, 0], [1.2, 0.7], [0, 2.8]], IG.iron, { m: 'gloss', seg: 4 })]),
        ...[cx - 6.4, cx + 6.4].flatMap(x => lyre(x, 4, 0, 7.4, { n: 8 })),
        RG(i ? x0 + 2.4 : x1 - 2.4, 25, 0.6, 1.4, 0.35, IG.iron, { m: 'gloss' }),
      ] };
    }),
    inside: { x: 32, h: 24, w: 54, hh: 44, z: -0.6, bare: true },
  }),

  // a porch swing: an iron A-frame under a sage canopy with a scalloped valance, a lattice-backed seat on chains, cushions
  piece('igdswing', 'Iron garden porch swing', 2, 1, 1400, [
    ...[3, 61].flatMap(x => [bar([x, 0, -13], [x, 66, 0], 1.1), bar([x, 0, 13], [x, 66, 0], 1.1), bar([x, 24, -8.3], [x, 24, 8.3], IR), ...lyre(x, 40, 0, 10, { u: [0, 1], n: 8 })]),
    bar([2, 66, 0], [62, 66, 0], 1.2),
    B(32, 68.6, 0, 62, 1.2, 24, IG.sage, { m: 'cloth', r: 0.5 }), PR(32, 68.2, 12.2, scallop(31, 4, 7), 0.6, IG.sage, CL), PR(32, 68.2, -12.2, scallop(31, 4, 7), 0.6, IG.sage, CL),
    ...[8, 56].flatMap(x => [bar([x, 66, 0], [x, 16.4, 7], 0.3, IG.ironD, { seg: 4 }), bar([x, 66, 0], [x, 37, -8], 0.3, IG.ironD, { seg: 4 })]),
    mesh(32, 15, -0.5, 48, 1.4, 16),
    cushion(32, 16.9, 0.2, 46, 2.4, 14.6),
    ...[8, 56].map(x => bar([x, 15, -8], [x, 37, -8], IR)),
    ...lattice(9, 19, 46, 15, -8, 5),
    fb(32, 19, -8, 48, 1.2, 1.2), ...line(bow(8, 56, 34, 4, -8, 8), IR), ...lyre(32, 37.6, -8, 4.6, { n: 8 }),
    ...[8, 56].map(x => bar([x, 25, -8], [x, 25, 7], IR)), ...armCurl(8, 15, 25, 7.4, 1), ...armCurl(56, 15, 25, 7.4, -1),
    S(20, 24, -5.4, 6, 4.6, 2, IG.cream, { m: 'cloth', seg: 10 }), S(44, 24, -5.4, 6, 4.6, 2, IG.roseL, { m: 'cloth', seg: 10 }),
    ...vine(Array.from({ length: 13 }, (_, j) => { const t = j / 12; return [3 + (j % 2 ? 1 : -0.6), 66 * t, 13 - 13 * t + 1]; }), { every: 3, s: 3 }),
  ]),

  // a tea cart: two big spoked wheels, a mesh shelf and a railed top, a scroll handle, a china teapot and cups, a pot of roses
  piece('igdcart', 'Iron garden tea cart', 1, 1, 720, [
    ...[-11.4, 11.4].flatMap(z => [RG(9, 7, z, 6.2, 0.7, IG.iron, { m: 'gloss' }), ...Array.from({ length: 6 }, (_, k) => { const a = k * Math.PI / 3; return bar([9, 7, z], [9 + Math.cos(a) * 6, 7 + Math.sin(a) * 6, z], 0.35, IG.iron, { seg: 4 }); }), S(9, 7, z, 1, 1, 0.8, IG.iron, { m: 'gloss', seg: 6 })]),
    bar([9, 7, -11.4], [9, 7, 11.4], IF),
    ...[-8.6, 8.6].flatMap(z => [bar([5, 7, z], [5, 27, z], IR), bar([27, 1, z], [27, 27, z], IR), S(27, 1, z, 1.1, 1, 1.1, IG.ironD, { m: 'gloss', seg: 6 })]),
    mesh(16, 10, 0, 24, 1.2, 18), mesh(16, 26, 0, 24.6, 1.2, 18.6),
    bar([4, 28.6, 9.2], [28, 28.6, 9.2], IF), bar([4, 28.6, -9.2], [28, 28.6, -9.2], IF), bar([4, 28.6, -9.2], [4, 28.6, 9.2], IF),
    ...lyre(16, 25.2, 9.4, 5, { down: true, n: 8 }),
    ...[-8.6, 8.6].map(z => bar([27, 27, z], [29.6, 33, z], IR)), bar([29.6, 33, -8.6], [29.6, 33, 8.6], 0.9),
    ...curl([28.2, 30, 9], 1.6, 0.4, 0, 1.6 * Math.PI, { n: 6 }),
    LA(13, 26.6, -1, [[0, 0], [3, 0], [4.2, 1.6], [4.4, 3.4], [3.4, 5], [1.4, 5.8], [0.6, 6.4], [1, 7.2], [0, 7.6]], IG.china, { m: 'gloss', seg: 10 }),
    C(13, 29.6, -1, 4.45, 1, IG.sage, { m: 'gloss', seg: 10 }),
    bar([16.6, 28.6, -1], [19.4, 32, -1], 0.6, IG.china), RG(9.2, 30.6, -1, 2, 0.5, IG.china, { m: 'gloss', arc: Math.PI, a0: Math.PI / 2 }),
    ...[[22, 3.6], [21.6, -5]].flatMap(([x, z]) => [C(x, 27, z, 2.6, 0.5, IG.china, { m: 'gloss', seg: 10 }), C(x, 28.4, z, 1.8, 2.2, IG.china, { m: 'gloss', seg: 10, rb: 1.3 }), RG(x + 2, 28.6, z, 0.8, 0.3, IG.china, { m: 'gloss' })]),
    ...pot(16, 10.6, 0, 3.8, 6), ...bush(16, 20, 0, 4.6, 3.4, 4, 4, { dot: IG.roseL }),
  ]),

  // a floor lantern: a square iron cage of glass, crossed bars on its faces, a candle glowing, an onion cap and a ring
  piece('igdlantern', 'Iron garden lantern', 1, 1, 380, [
    B(16, 1.4, 0, 13, 2, 13, IG.iron, { m: 'gloss', r: 0.5 }), ...[[-5, -5], [5, -5], [-5, 5], [5, 5]].map(([dx, dz]) => S(16 + dx, 0.6, dz, 1, 0.6, 1, IG.iron, { m: 'gloss', seg: 6 })),
    B(16, 12.4, 0, 10.4, 19.4, 10.4, '#cfe8f4', { m: 'glass', r: 0 }),
    ...[[-5.6, -5.6], [5.6, -5.6], [-5.6, 5.6], [5.6, 5.6]].map(([dx, dz]) => bar([16 + dx, 2.4, dz], [16 + dx, 22.4, dz], 0.55, IG.iron, { seg: 4 })),
    ...[5.4, -5.4].flatMap(z => [bar([10.8, 3, z], [21.2, 21.8, z], 0.35, IG.iron, { seg: 4 }), bar([21.2, 3, z], [10.8, 21.8, z], 0.35, IG.iron, { seg: 4 })]),
    ...[5.4, -5.4].flatMap(x => [bar([16 + x, 3, -5.2], [16 + x, 21.8, 5.2], 0.35, IG.iron, { seg: 4 }), bar([16 + x, 3, 5.2], [16 + x, 21.8, -5.2], 0.35, IG.iron, { seg: 4 })]),
    B(16, 23, 0, 13, 1.4, 13, IG.iron, { m: 'gloss', r: 0.5 }),
    LA(16, 23.6, 0, [[7.6, 0], [6.8, 1.2], [4.2, 4], [2.4, 7], [1.6, 9], [2.4, 10.4], [1.2, 12], [0, 13]], IG.iron, { m: 'gloss', seg: 4, ry: Math.PI / 4 }),
    RG(16, 39.6, 0, 2.8, 0.6, IG.iron, { m: 'gloss' }),
    C(16, 6.4, 0, 1.7, 7, IG.cream, { m: 'gloss', seg: 10 }),
    S(16, 12.6, 0, 1.8, 2.8, 1.8, IG.glow, { m: 'glow', seg: 8 }),
    ivy(9.6, 0.6, 7, 3.4, 0.7), ivy(11.4, 0.6, 7.4, 3, 0.1, IG.ivyL), ivy(21.6, 0.6, 7, 3, -0.6, IG.ivyD),
  ], { glow: [IG.glow] }),

  // a bird cage on a stand: three curled legs, a slim post wound with ivy, a domed cage of fine bars, Natu on its perch
  piece('igdbirdcage', 'Natu iron garden bird cage', 1, 1, 650, [
    ...tripod(16, 0, 9, 11),
    LA(16, 1, 0, [[2.4, 0], [1.4, 2], [1.1, 36], [1.8, 38.4]], IG.iron, { m: 'gloss', seg: 8 }),
    C(16, 40, 0, 10, 1.2, IG.iron, { m: 'gloss', seg: 16 }),
    RG(16, 54, 0, 9.4, 0.5, IG.iron, { m: 'gloss', flat: true }),
    ...Array.from({ length: 12 }, (_, k) => { const th = k * Math.PI / 6, c = Math.cos(th), s = Math.sin(th); return line([[9.4, 40.6], [9.4, 58], [8.4, 63], [5.8, 67], [2.6, 69.6], [0.4, 70.4]].map(([r, h]) => [16 + c * r, h, s * r]), 0.4, IG.iron, { seg: 4 }); }).flat(),
    ...finial(16, 70, 0, 0.8), RG(16, 76.4, 0, 2.2, 0.5, IG.iron, { m: 'gloss' }),
    bar([9, 47, 0], [23, 47, 0], 0.5, IG.ironD, { seg: 4 }),
    S(16, 51.4, 0.4, 3.6, 3.8, 3.4, IG.natu, { m: 'gloss', seg: 10 }),
    ...[-1, 1].flatMap(sg => [S(16 + sg * 3.2, 50.4, 0, 1.2, 2, 2, IG.yellow, { m: 'gloss', seg: 6 }), DS(16 + sg * 1.4, 52.6, 3.4, 1, 0.4, IG.china, { m: 'gloss', seg: 6 }), DS(16 + sg * 1.4, 52.6, 3.8, 0.5, 0.3, IG.ink, { m: 'gloss', seg: 6 })]),
    S(16, 51, 3.8, 0.8, 0.6, 1, IG.yellow, { m: 'gloss', seg: 6 }),
    ...[-1, 0, 1].map(dx => S(16 + dx * 1.2, 55.4, 0, 0.6, 0.9, 0.6, dx ? IG.red : IG.yellow, { m: 'gloss', seg: 6 })),
    ...vine(windUp(16, 0, 4, 38, 1.6, 9), { s: 2.8, every: 4 }),
  ]),

  // a planter box: a lattice-sided iron frame round a terracotta liner, two rose bushes, ivy over its edge, and a Roselia
  // sitting between them with its red and blue roses
  piece('igdplanter', 'Roselia iron garden planter box', 2, 1, 600, [
    ...[[4, 10], [60, 10], [4, -10], [60, -10]].flatMap(([x, z]) => [fb(x, 12.4, z, 2, 23, 2), S(x, 0.8, z, 1.4, 0.8, 1.4, IG.iron, { m: 'gloss', seg: 6 })]),
    B(32, 12.6, 0, 54, 20, 18, IG.terra, { m: 'plain', r: 0.8 }),
    B(32, 22.6, 0, 53, 1, 17, IG.soil, { m: 'plain', r: 0.4 }),
    ...[10.4, -10.4].flatMap(z => [fb(32, 23.6, z, 58, 1.4, 1.2), fb(32, 2.6, z, 58, 1.2, 1), ...lattice(5, 3.2, 54, 19.4, z, 5)]),
    ...[4, 60].flatMap(x => [fb(x, 23.6, 0, 1.2, 1.4, 21), ...lattice(x, 3.2, 18, 19.4, -9, 5, { u: [0, 1] })]),
    ...lyre(32, 3.4, 11, 7, { n: 8 }),
    ...bush(13, 28.4, -1, 8, 6, 7, 6), ...bush(51, 28.4, -1, 8, 6, 7, 6, { dot: IG.roseL }),
    ...vine([[10, 24, 9.6], [8.4, 20, 11.2], [9, 15, 11.6], [8, 10.4, 11.6]], { s: 3 }), ...vine([[55, 24, 9.6], [56.4, 19.6, 11.2], [55.6, 14.6, 11.6]], { s: 3, every: 3 }),
    PR(32, 26, -1, [[-6, 6], [-2, 13], [0, 9], [2, 13], [6, 6], [3, 1], [-3, 1]], 1, IG.roseliaD, CL),
    S(32, 28.4, 1.6, 4, 5, 3.6, IG.roselia, { m: 'gloss', seg: 10 }),
    S(32, 35.2, 2, 3.8, 3.4, 3.4, IG.roselia, { m: 'gloss', seg: 10 }),
    ...[[-2.2, 0.3], [0, 0], [2.2, -0.3]].map(([dx, rot]) => LA(32 + dx, 37.4, 1.6, [[0.9, 0], [0.5, 1.6], [0, 3]], IG.thorn, { m: 'gloss', seg: 6, rot })),
    ...[-1, 1].map(sg => DS(32 + sg * 1.4, 35.6, 5.2, 0.6, 0.4, IG.ink, { m: 'gloss', seg: 6, ry: 0.9 })),
    S(26.4, 29.6, 4.4, 2.6, 2.4, 2.4, IG.red, { m: 'gloss', seg: 8 }), S(37.6, 29.6, 4.4, 2.6, 2.4, 2.4, IG.blue, { m: 'gloss', seg: 8 }),
    ivy(26.4, 26.6, 4, 2.4, Math.PI - 0.4, IG.roseliaD), ivy(37.6, 26.6, 4, 2.4, Math.PI + 0.4, IG.roseliaD),
  ]),
];
