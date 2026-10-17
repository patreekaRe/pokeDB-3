/* base-furniture-acorn.js  -  the Acorn set (furniture expansion session f, 2026-10-17): Animal Crossing's tree's bounty
   series, autumn in an oak wood. Rounded nut-brown oak and bark, acorns everywhere (a glossy nut under a cross-hatched cap
   with a little stem: finials, knobs, a lamp, a stool, a whole wardrobe), pinecones, green and tawny oak leaves, moss
   green cushions; Seedot, Skwovet and Pineco for the Pokémon touches. All solo, fixed colours, sold all year.
   An upright piece is a list of parts in painted units (32 a tile), as in js/base-furniture-elegant.js: `x` across from
   the left of its front, `h` up from the floor (a wall piece's from the foot of its strip), `z` out to the front from its
   middle (a wall piece's from the wall). They're painted here from any side, and js/base-models-acorn.js builds the same
   list as 3D parts (BUILT), so picture and model agree. A lathe can lie over (`rot`, counter-clockwise seen from the
   front): the acorns in the pile, the wreath's pinecones. `tex` is painted only (the model stays plain colour): `hatch`
   the cap's and the pinecone's criss-cross, `bark` its streaks, `leafy` a canopy's dabs; an oak leaf's veins likewise.
   A `pic` part (the clock's dial, the screen's panels) is painted on the front only, and the model wears that crop of
   the painting. The wardrobe's doors swing (`doors`, `inside`). The rug is an oak leaf, painted from above (RUG). */

import { sh, oval, ovalShade, floorShadow, ctx, hash, glass as glassPane } from './base-paint.js';

export const AC = {
  nut: '#8e5226', nutL: '#b46d36', nutD: '#5f3416', cap: '#b08a52', capD: '#80602f', capL: '#d2aa6c',
  oak: '#b98250', oakL: '#d6a26a', oakD: '#8a5a32', bark: '#6e5038', barkD: '#4a3424', ring: '#e4c48c',
  leaf: '#6e9a44', leafD: '#4d7430', leafL: '#94b860', tawny: '#c8923a', tawnyD: '#9c6a26', rust: '#b0602c',
  moss: '#7f9c48', mossD: '#5d7a34', mossL: '#a4bc66', cone: '#8c5c34', coneL: '#b07c4c',
  cream: '#f2e2c0', glow: '#ffd890', ink: '#2c241c', soil: '#4a3220', thread: '#efe8d8', mirror: '#cfe1ea',
  seedot: '#a4622e', seedotCap: '#d8c8a0', skw: '#b07f62', skwL: '#ecd2a8', skwTail: '#c99a74', pineco: '#77958a', pinecoD: '#3c4a46',
};
const GROUP = 'Acorn';
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

const CL = { m: 'cloth' }, PL = { m: 'plain' }, GL = { m: 'gloss' }, WD = { m: 'wood' };

/** An acorn's nut and cap as lathe profiles, s its height. */
const nutPts = (s) => [[0, 0], [s * 0.16, s * 0.05], [s * 0.32, s * 0.17], [s * 0.42, s * 0.36], [s * 0.45, s * 0.56], [s * 0.42, s * 0.7]];
const capPts = (s) => [[s * 0.44, 0], [s * 0.5, s * 0.06], [s * 0.5, s * 0.14], [s * 0.42, s * 0.24], [s * 0.26, s * 0.32], [0, s * 0.36]];
/** An acorn s tall standing on its tip at x, h, z (or lying over by `rot`): a glossy nut, a hatched cap, a stem. */
function acorn(x, h, z, s, o = {}) {
  const rot = o.rot || 0, c = Math.cos(rot), sn = Math.sin(rot), at = (up) => [x - sn * up, h + c * up];
  const seg = o.seg ?? (s >= 12 ? 14 : s >= 6 ? 10 : 8), [cx, ch] = at(s * 0.62), [s0, h0] = at(s * 0.95), [s1, h1] = at(s * 1.1);
  return [
    LA(x, h, z, nutPts(s), o.nut ?? AC.nut, { m: 'gloss', seg, rot }),
    LA(cx, ch, z, capPts(s), o.cap ?? AC.cap, { m: 'wood', seg, rot, tex: s >= 4.5 ? 'hatch' : undefined, ts: Math.max(0.8, s * 0.1) }),
    RD([s0, h0, z], [s1 + c * s * 0.04, h1 + sn * s * 0.04, z], Math.max(0.28, s * 0.05), AC.capD, WD),
  ];
}
/** A pinecone's profile, len tall and wid across: tiers of scales, widest low, a blunt tip. */
function conePts(len, wid, tiers) {
  const env = (t) => Math.sin(Math.PI * Math.min(0.97, 0.18 + 0.82 * Math.pow(t, 0.7)));
  const pts = [[0, 0], [wid * 0.2, len * 0.01]];
  for (let i = 0; i < tiers; i++) {
    const t0 = i / tiers, t1 = (i + 0.9) / tiers;
    pts.push([wid / 2 * env(t0 + 0.04 / tiers), len * (t0 + 0.04 / tiers)], [wid / 2 * env(t1) * 0.74, len * t1]);
  }
  pts.push([0, len]);
  return pts;
}
const pinecone = (x, h, z, len, o = {}) => LA(x, h, z, conePts(len, o.wid ?? len * 0.56, o.tiers ?? (len > 12 ? 6 : 4)), o.c ?? AC.cone,
  { m: 'wood', seg: o.seg ?? (len > 14 ? 12 : 8), tex: 'hatch', ts: Math.max(0.8, len * 0.1), rot: o.rot });

/** An oak leaf's outline, len from stem to tip and wid across, with rounded lobes; turned ang counter-clockwise (0 up). */
function oakPts(len, wid, ang = 0, lobes = 3) {
  const n = lobes * 4, right = [], ws = Math.max(0.3, wid * 0.03);
  for (let i = 0; i <= n; i++) {
    const t = i / n, env = Math.pow(Math.sin(Math.PI * (0.1 + 0.82 * t)), 0.6), lobe = 0.55 + 0.45 * Math.abs(Math.sin(Math.PI * (lobes + 0.5) * t));
    right.push([wid / 2 * env * lobe, len * (0.04 + t * 0.95)]);
  }
  const pts = [[ws, -len * 0.12], [ws, 0], ...right, [0, len], ...right.slice().reverse().map(([x, y]) => [-x, y]), [-ws, 0], [-ws, -len * 0.12]];
  const c = Math.cos(ang), s = Math.sin(ang);
  return pts.map(([x, y]) => [x * c - y * s, x * s + y * c]);
}
/** The leaf's veins as segments [x0, h0, x1, h1] about its stem: the midrib and one to each lobe. */
function oakVeins(len, wid, ang = 0, lobes = 3) {
  const c = Math.cos(ang), s = Math.sin(ang), r = ([x, y]) => [x * c - y * s, x * s + y * c];
  const segs = [[[0, 0], [0, len * 0.95]]];
  for (let k = 0; k < lobes; k++) { const t = (k + 0.5) / (lobes + 0.5); for (const sg of [-1, 1]) segs.push([[0, len * t * 0.85], [sg * wid * 0.32, len * (0.04 + t * 0.95)]]); }
  return segs.map(([a, b]) => [...r(a), ...r(b)]);
}
/** An oak leaf standing in the front plane at x, h (its stem), d thick. */
const oak = (x, h, z, len, wid, c = AC.leaf, ang = 0, d = 0.8, o = {}) => PR(x, h, z, oakPts(len, wid, ang, o.lobes ?? 3), d, c, { m: 'cloth', veins: oakVeins(len, wid, ang, o.lobes ?? 3), ...o });
const LEAVES = [AC.leaf, AC.tawny, AC.leafL, AC.rust, AC.leafD, AC.tawnyD];

/** A round arch `rise` high over a base 2 * half wide (a dome, a chair back). */
const arch = (half, rise, n = 10) => [[-half, 0], [half, 0], ...Array.from({ length: n - 1 }, (_, i) => { const a = Math.PI * (i + 1) / n; return [half * Math.cos(a), rise * Math.sin(a)]; })];
/** An acorn cap seen from the front, extruded: a rolled rim and a dome. */
const capFront = (H, R) => [[-H * 0.94, 0], [H * 0.94, 0], [H, R * 0.12], [H, R * 0.3], ...Array.from({ length: 9 }, (_, i) => { const a = Math.PI * (i + 1) / 10; return [H * Math.cos(a), R * 0.3 + R * 0.7 * Math.sin(a)]; }), [-H, R * 0.3], [-H, R * 0.12]];

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
const polyPath = (pts) => { const p = new Path2D(); pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); p.closePath(); return p; };
const bounds = (pts) => { const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; };

/** The painted-only surface of a part (`tex`), inside its outline `path` over bounds bb. */
function texture(q, path, bb, rule = 'nonzero') {
  const g = ctx(), [x0, y0, x1, y1] = bb, c = q.c;
  g.save(); g.clip(path, rule);
  if (q.tex === 'hatch') {
    const s = q.ts || 1.6, span = y1 - y0;
    g.globalAlpha *= 0.6; g.strokeStyle = sh(c, -2); g.lineWidth = Math.max(0.28, s * 0.2);
    g.beginPath();
    for (let k = x0 - span - s; k < x1 + s; k += s) { g.moveTo(k, y1); g.lineTo(k + span, y0); g.moveTo(k + span, y1); g.lineTo(k, y0); }
    g.stroke();
    g.globalAlpha = 0.35; g.strokeStyle = sh(c, 2); g.lineWidth = Math.max(0.2, s * 0.1);
    g.beginPath(); for (let k = x0 - span - s; k < x1 + s; k += s) { g.moveTo(k + s * 0.3, y1); g.lineTo(k + span + s * 0.3, y0); } g.stroke();
  } else if (q.tex === 'bark') {
    g.globalAlpha *= 0.55; g.strokeStyle = sh(c, -2); g.lineWidth = 0.5;
    for (let x = x0 + 0.8, i = 0; x < x1; x += 2.1, i++) { g.beginPath(); g.moveTo(x, y0); for (let y = y0 + 2, j = 0; y <= y1 + 2; y += 2, j++) g.lineTo(x + (hash(i, j, 5) - 0.5) * 1.1, y); g.stroke(); }
  } else if (q.tex === 'leafy') {
    const n = Math.round((x1 - x0) * (y1 - y0) / 6);
    for (let i = 0; i < n; i++) {
      const px = x0 + hash(i, 11, q.x * 7) * (x1 - x0), py = y0 + hash(i, 12, q.h * 7) * (y1 - y0), v = hash(i, 13);
      g.globalAlpha = 0.8; g.fillStyle = v < 0.45 ? sh(c, -1) : v < 0.9 ? sh(c, 1) : AC.tawny;
      g.beginPath(); g.ellipse(px, py, 1.5, 0.8, hash(i, 14) * Math.PI, 0, TAU); g.fill();
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
        if (q.tex) texture(q, polyPath(pts), bounds(pts));
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
        if (q.tex) texture(q, polyPath(pts), bounds(pts));
        if (m === 'gloss' && rmax > 1.2) {
          const at = q.pts.find(p => p[0] === rmax), [hx, hy] = P(-rmax * 0.48, at[1] * 0.92);
          g.save(); g.globalAlpha *= 0.5; oval(hx, hy, rmax * 0.14, Math.max(0.4, len * 0.1), '#ffffff'); g.restore();
        }
        if (rot || (q.pts[q.pts.length - 1][0] < 0.01 && q.pts.length > 2)) break;
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
        if (q.tex && !q.flat && !q.arc) {
          const p = new Path2D(); p.ellipse(cx, cy, q.r + q.tr, ry + q.tr, 0, 0, TAU); p.ellipse(cx, cy, q.r - q.tr, ry - q.tr, 0, 0, TAU);
          texture(q, p, [cx - q.r - q.tr, cy - ry - q.tr, cx + q.r + q.tr, cy + ry + q.tr], 'evenodd');
        }
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
        const pts = q.pts.map(([px, ph]) => [U(q.x + px), b - q.h - ph]);
        poly(pts, q.c, m);
        if (q.tex) texture(q, polyPath(pts), bounds(pts));
        if (q.veins) {
          g.save(); g.lineCap = 'round'; g.strokeStyle = sh(q.c, 2); g.globalAlpha *= 0.7;
          q.veins.forEach(([ax, ah, bx, bh], i) => { g.lineWidth = i ? 0.35 : 0.55; g.beginPath(); g.moveTo(U(q.x + ax), b - q.h - ah); g.lineTo(U(q.x + bx), b - q.h - bh); g.stroke(); });
          g.restore();
        }
        break;
      }
      case 'pic': g.save(); g.beginPath(); g.rect(cx - q.w / 2, cy - q.hh / 2, q.w, q.hh); g.clip(); q.fn(g, cx - q.w / 2, cy - q.hh / 2, q.w, q.hh); g.restore(); break;
    }
  }
}

/* ---------- pictures ---------- */

/** An oak leaf filled on a canvas, its stem at cx, cy. */
function leafOn(g, cx, cy, len, wid, ang, c, lobes = 3) {
  g.fillStyle = c; g.beginPath(); oakPts(len, wid, ang, lobes).forEach(([x, y], i) => (i ? g.lineTo(cx + x, cy - y) : g.moveTo(cx + x, cy - y))); g.closePath(); g.fill();
  g.strokeStyle = sh(c, 2); g.lineWidth = Math.max(0.3, wid * 0.05); g.globalAlpha = 0.7;
  for (const [ax, ah, bx, bh] of oakVeins(len, wid, ang, lobes)) { g.beginPath(); g.moveTo(cx + ax, cy - ah); g.lineTo(cx + bx, cy - bh); g.stroke(); }
  g.globalAlpha = 1;
}
/** A little acorn on a canvas, its tip at cx, cy. */
function acornOn(g, cx, cy, s) {
  g.fillStyle = AC.nut; g.beginPath(); g.ellipse(cx, cy - s * 0.4, s * 0.38, s * 0.42, 0, 0, TAU); g.fill();
  g.fillStyle = AC.nutL; g.beginPath(); g.ellipse(cx - s * 0.14, cy - s * 0.45, s * 0.08, s * 0.14, 0, 0, TAU); g.fill();
  g.fillStyle = AC.cap; g.beginPath(); g.ellipse(cx, cy - s * 0.72, s * 0.44, s * 0.26, 0, Math.PI, TAU); g.fill(); g.fillRect(cx - s * 0.44, cy - s * 0.74, s * 0.88, s * 0.08);
  g.strokeStyle = AC.capD; g.lineWidth = s * 0.08; g.beginPath(); g.moveTo(cx, cy - s * 0.96); g.lineTo(cx + s * 0.08, cy - s * 1.12); g.stroke();
}

/** The wall clock's dial: cream, oak-brown marks at the hours, a little acorn at twelve, hands at ten past ten. */
function dial(g, x, y, w, h) {
  const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2;
  g.fillStyle = AC.nutL; g.fillRect(x, y, w, h);
  g.fillStyle = AC.cream; g.beginPath(); g.arc(cx, cy, r * 0.96, 0, TAU); g.fill();
  g.strokeStyle = AC.capD; g.lineWidth = r * 0.05; g.beginPath(); g.arc(cx, cy, r * 0.84, 0, TAU); g.stroke();
  g.fillStyle = AC.oakD;
  for (let i = 1; i < 12; i++) { const a = i / 12 * TAU - Math.PI / 2, big = i % 3 === 0; g.beginPath(); g.arc(cx + Math.cos(a) * r * 0.68, cy + Math.sin(a) * r * 0.68, r * (big ? 0.09 : 0.05), 0, TAU); g.fill(); }
  acornOn(g, cx, cy - r * 0.5, r * 0.34);
  g.strokeStyle = AC.ink; g.lineCap = 'round';
  for (const [a, len, lw] of [[-150, 0.42, 0.09], [-30, 0.6, 0.055]]) { const t = a * Math.PI / 180; g.lineWidth = r * lw; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(t) * r * len, cy + Math.sin(t) * r * len); g.stroke(); }
  g.fillStyle = AC.capD; g.beginPath(); g.arc(cx, cy, r * 0.08, 0, TAU); g.fill();
}
/** A screen panel: an oak bough on a warm autumn ground, leaves turning, acorns hanging; the middle one has a Seedot. */
function bough(seed) {
  return (g, x, y, w, h) => {
    const bg = g.createLinearGradient(0, y, 0, y + h); bg.addColorStop(0, '#f7ead0'); bg.addColorStop(0.7, '#efd6a6'); bg.addColorStop(1, '#e2bc80');
    g.fillStyle = bg; g.fillRect(x, y, w, h);
    const from = seed % 2 ? x + w + 1 : x - 1, sx = seed % 2 ? -1 : 1;
    g.strokeStyle = AC.bark; g.lineWidth = w * 0.07; g.lineCap = 'round';
    g.beginPath(); g.moveTo(from, y + h * 0.1); g.quadraticCurveTo(x + w * 0.5, y + h * 0.12, x + w * (0.5 + sx * 0.3), y + h * 0.36); g.stroke();
    g.lineWidth = w * 0.035; g.beginPath(); g.moveTo(x + w * 0.45, y + h * 0.13); g.quadraticCurveTo(x + w * (0.5 - sx * 0.1), y + h * 0.3, x + w * (0.5 - sx * 0.2), y + h * 0.42); g.stroke();
    const spots = [[0.25, 0.2, 0.9], [0.62, 0.17, -0.6], [0.78, 0.36, -1.6], [0.32, 0.4, 2.3], [0.52, 0.3, 3.1], [0.15, 0.08, 1.4]];
    spots.forEach(([fx, fy, a], i) => leafOn(g, x + w * (sx > 0 ? fx : 1 - fx), y + h * fy, w * 0.3, w * 0.24, a * sx, [AC.leaf, AC.tawny, AC.leafL, AC.rust, AC.leafD, AC.tawny][(i + seed) % 6]));
    for (const [fx, fy] of [[0.42, 0.5], [0.58, 0.47], [0.74, 0.55]]) {
      const ax = x + w * (sx > 0 ? fx : 1 - fx), ay = y + h * fy;
      g.strokeStyle = AC.capD; g.lineWidth = w * 0.02; g.beginPath(); g.moveTo(ax, ay - w * 0.18); g.lineTo(ax, ay - w * 0.3); g.stroke();
      acornOn(g, ax, ay, w * 0.18);
    }
    for (let i = 0; i < 5; i++) leafOn(g, x + w * (0.1 + hash(i, seed, 2) * 0.8), y + h * (0.86 + hash(i, seed, 3) * 0.1), w * 0.16, w * 0.13, (hash(i, seed, 4) - 0.5) * 3, [AC.tawny, AC.rust, AC.leafL][i % 3]);
    if (seed === 2) {
      const cx = x + w * 0.5, by = y + h * 0.86, s = w * 0.42;
      g.fillStyle = AC.seedot; g.beginPath(); g.moveTo(cx, by); g.bezierCurveTo(cx - s * 0.62, by - s * 0.1, cx - s * 0.56, by - s * 0.8, cx, by - s * 0.8); g.bezierCurveTo(cx + s * 0.56, by - s * 0.8, cx + s * 0.62, by - s * 0.1, cx, by); g.fill();
      g.fillStyle = AC.seedotCap; g.beginPath(); g.ellipse(cx, by - s * 0.76, s * 0.42, s * 0.3, 0, Math.PI, TAU); g.fill(); g.fillRect(cx - s * 0.42, by - s * 0.8, s * 0.84, s * 0.08);
      g.strokeStyle = AC.capD; g.lineWidth = s * 0.06; g.beginPath(); g.moveTo(cx, by - s * 1.04); g.lineTo(cx + s * 0.06, by - s * 1.16); g.stroke();
      g.fillStyle = AC.ink; for (const dx of [-1, 1]) { g.beginPath(); g.ellipse(cx + dx * s * 0.15, by - s * 0.5, s * 0.05, s * 0.1, 0, 0, TAU); g.fill(); }
      g.fillStyle = '#ffffff'; for (const dx of [-1, 1]) { g.beginPath(); g.arc(cx + dx * s * 0.15 - s * 0.015, by - s * 0.54, s * 0.022, 0, TAU); g.fill(); }
    }
  };
}

/* ---------- the kinds ---------- */

/** What js/base-models-acorn.js builds for each upright and wall kind: its parts, doors and default material. */
export const BUILT = {};
/** The rug's outline, an oak leaf from above, in painted units across its 3 x 2 tiles. */
export const RUG = oakPts(80, 56, -Math.PI / 2, 4).map(([x, y]) => [12 + x, 32 - y]);

function piece(id, name, w, h, price, mat, parts, { doors = [], inside, ...rest } = {}) {
  BUILT[id] = { parts, doors, inside, mat };
  const all = [...parts, ...doors.flatMap(d => d.parts)];
  return { id, name, group: GROUP, solo: true, w, h, price, ...rest, draw(x, b, vw, dir) { floorShadow(x, b, vw); paintParts(all, x, b, vw, dir, w * 32); } };
}
function wallPiece(id, name, w, price, mat, parts, rest = {}) {
  BUILT[id] = { parts, doors: [], mat };
  return { id, name, group: GROUP, solo: true, w, h: 1, layer: 'wall', price, ...rest, wall(x) { paintParts(parts, x, 96, w * 32, 0, w * 32); } };
}

const capFoot = (x, z, r = 3) => S(x, r * 0.8, z, r, r * 0.8, r, AC.capD, { m: 'wood', seg: 8 });
const stumpPts = [[13, 0], [12.2, 1.4], [10.8, 3], [10.2, 6], [10, 14], [10.2, 20], [10.6, 22.6]];

/** The garland's swag: a point along it from 0 to 1, x0 to x1 and dipping by sag below h. */
const swag = (x0, x1, h, sag) => (t) => [x0 + (x1 - x0) * t, h - sag * Math.sin(Math.PI * t)];

export const ACORN_KINDS = [
  // a bed under a great oak leaf: a rounded oak frame on acorn-cap feet, a hatched cap rail at its foot, acorn finials,
  // a moss coverlet and cream pillows
  piece('acrnbed', 'Acorn cap bed', 2, 2, 1500, 'wood', [
    ...[[6, -27], [58, -27], [6, 27], [58, 27]].map(([x, z]) => capFoot(x, z, 3.4)),
    oak(14, 30, -31, 34, 30, AC.tawny, 0.75, 1), oak(50, 30, -31, 34, 30, AC.rust, -0.75, 1),
    oak(32, 12, -29.5, 64, 58, AC.leaf, 0, 2.4),
    ...[5, 59].flatMap(x => [C(x, 22, -28.5, 3, 44, AC.oak, WD), ...acorn(x, 44, -28.5, 9)]),
    B(32, 9, 0, 60, 8, 58, AC.oak, { m: 'wood', r: 3 }),
    B(32, 16, 0, 58, 6, 54, AC.cream, { m: 'cloth', r: 2 }),
    B(32, 19.6, 6, 59, 3, 42, AC.moss, { m: 'cloth', r: 1.5 }), B(32, 20, -14.5, 59, 3.2, 5, AC.mossL, { m: 'cloth', r: 1.4 }),
    ...[20, 44].map(x => S(x, 22, -22, 9, 3.4, 4.8, AC.cream, { m: 'cloth' })),
    oak(32, 19, 4, 14, 12, AC.tawny, 0.2, 0.6),
    ...[5, 59].flatMap(x => [C(x, 13, 28, 2.8, 26, AC.oak, WD), ...acorn(x, 26, 28, 7)]),
    B(32, 16, 28.5, 52, 12, 3.4, AC.oak, { m: 'wood', r: 1.6 }),
    B(32, 23, 28.5, 54, 3.4, 5, AC.cap, { m: 'wood', r: 1.6, tex: 'hatch', ts: 1.4 }),
    oak(32, 12.4, 30.4, 9, 9, AC.leafD, 0, 0.6),
  ]),

  // a side chair: oak legs and seat, a moss cushion, an oak-leaf back between two uprights topped with acorns
  piece('acrnchair', 'Oak-leaf acorn chair', 1, 1, 360, 'wood', [
    ...[[6, 8], [26, 8]].map(([x, z]) => C(x, 6.5, z, 1.5, 13, AC.oak, WD)),
    ...[6, 26].map(x => RD([x, 0, -9], [x + (x < 16 ? 1 : -1), 36, -10], 1.5, AC.oak, WD)),
    ...acorn(7, 36, -10, 5.4), ...acorn(25, 36, -10, 5.4),
    oak(16, 15, -10.5, 26, 22, AC.leaf, 0, 1.6),
    B(16, 14.2, 0, 25, 3, 21, AC.oak, { m: 'wood', r: 1.4 }),
    B(16, 16.8, 1, 22, 2.4, 18, AC.moss, { m: 'cloth', r: 1.2 }),
  ]),

  // a tub armchair: a big acorn cap, hatched, on a little nut-brown foot, a rounded cap back, a moss cushion
  piece('acrnarmchair', 'Acorn cap armchair', 1, 1, 620, 'wood', [
    LA(16, 0, 0, [[6, 0], [6.4, 1], [5.4, 2.6], [4.4, 4]], AC.nut, { m: 'gloss', seg: 12 }),
    PR(16, 12, -10.5, capFront(14.5, 28), 5, AC.cap, { m: 'wood', tex: 'hatch', ts: 1.6 }),
    RD([16, 39.6, -10.5], [17.4, 43, -10.5], 1, AC.capD, WD),
    LA(16, 3, 0, [[0, 0], [6, 0.2], [10.4, 2], [13.6, 5.4], [15, 10], [15, 15.4], [13.8, 18], [0, 18]], AC.cap, { m: 'wood', seg: 20, tex: 'hatch', ts: 1.6 }),
    RG(16, 20.6, 0, 14.2, 1.3, AC.capD, { m: 'wood', flat: true }),
    S(16, 22, 1.5, 11.5, 3, 10.5, AC.moss, { m: 'cloth', seg: 16 }),
    S(16, 30, -7, 10, 7, 2.6, AC.mossL, { m: 'cloth', seg: 12 }),
  ]),

  // a log-frame sofa on acorn-cap feet: moss cushions, arms with hatched cap ends, acorn finials, a tawny leaf pillow
  piece('acrnsofa', 'Acorn log sofa', 2, 1, 1200, 'wood', [
    ...[[7, -10], [57, -10], [7, 10], [57, 10]].map(([x, z]) => capFoot(x, z, 3)),
    B(32, 8.5, 1, 58, 8, 26, AC.oak, { m: 'wood', r: 3 }),
    B(32, 22, -10.5, 56, 24, 6, AC.oak, { m: 'wood', r: 3 }),
    ...acorn(6, 31, -10.5, 7), ...acorn(58, 31, -10.5, 7),
    ...[18.5, 45.5].flatMap(x => [B(x, 14.6, 3, 25, 5, 21, AC.moss, { m: 'cloth', r: 2 }), B(x, 22, -6.5, 25, 14, 4, AC.mossL, { m: 'cloth', r: 2 })]),
    ...[4.5, 59.5].flatMap(x => [B(x, 14, 1, 8, 15, 26, AC.oak, { m: 'wood', r: 3.4 }), DS(x, 17, 14.2, 3.6, 1.2, AC.cap, { m: 'wood', tex: 'hatch', ts: 1.2 })]),
    oak(32, 14.5, -3, 15, 14, AC.tawny, 0.25, 3, { m: 'cloth' }),
  ]),

  // a tree-stump table: barky sides, roots, a pale ringed top, two acorns and an oak leaf at its foot
  piece('acrntable', 'Acorn stump table', 1, 1, 480, 'wood', [
    LA(16, 0, 0, stumpPts, AC.bark, { m: 'wood', seg: 16, tex: 'bark' }),
    C(16, 23.4, 0, 11.2, 1.6, AC.ring, WD),
    ...[[4.5, 4], [27.5, 3], [10, 11], [23, -10]].map(([x, z]) => S(x, 1.4, z, 3.6, 1.6, 2.6, AC.bark, { m: 'wood', seg: 8 })),
    ...acorn(25, 0, 12.6, 4.6, { rot: 1.35 }), ...acorn(28.5, 0, 9, 4, { rot: -1.4 }),
  ]),

  // a rounded oak desk: a drawer pedestal with acorn knobs, a log leg, a little hutch of acorns and a pinecone, an
  // oak-leaf crest, an open book
  piece('acrndesk', 'Acorn writing desk', 2, 1, 1100, 'wood', [
    B(11, 12.5, 0, 17, 23, 24, AC.oak, { m: 'wood', r: 2 }),
    ...[18.5, 8.5].flatMap(h => [B(11, h, 12.2, 13.5, 7.6, 0.9, AC.oakL, { m: 'wood', r: 1.4 }), ...acorn(11, h - 1.8, 13, 3.4)]),
    ...[-9, 9].map(z => C(56, 12, z, 2.4, 24, AC.bark, { m: 'wood', tex: 'bark' })),
    B(32, 25.6, 0, 62, 3, 28, AC.oakL, { m: 'wood', r: 1.4 }),
    B(32, 35, -12.4, 56, 16, 2.4, AC.oak, { m: 'wood', r: 1 }),
    B(32, 37.4, -9.6, 56, 1.4, 7, AC.oakL, { m: 'wood', r: 0.5 }),
    ...[4, 60].map(x => B(x, 35, -10, 2.4, 16, 7, AC.oak, { m: 'wood', r: 1 })),
    ...acorn(12, 38.1, -9.6, 4.4), ...acorn(17, 38.1, -9, 3.6), ...acorn(21, 38.1, -10, 4),
    pinecone(47, 38.1, -9.6, 7),
    oak(32, 42.4, -12.4, 11, 10, AC.leaf, 0, 1.4),
    ...acorn(4, 43, -10, 5), ...acorn(60, 43, -10, 5),
    B(28, 27.4, 4, 11, 0.7, 8, AC.cream, { m: 'plain', r: 0.2 }), B(28, 27.8, 4, 0.4, 0.4, 8, AC.oakD, { m: 'plain', r: 0.1 }),
  ]),

  // a great acorn as a wardrobe: a glossy nut body with two rounded doors (an oak leaf carved on each, acorn knobs),
  // a hatched cap for its roof and a stem on top, on a bark plinth
  piece('acrnwardrobe', 'Big acorn wardrobe', 2, 1, 1450, 'gloss', [
    B(32, 2.6, 0, 30, 5.2, 22, AC.bark, { m: 'wood', r: 2 }),
    PR(32, 4, 0, [[-10, 0], [10, 0], [18, 4], [24, 11], [27.5, 22], [28.5, 34], [28, 46], [26.5, 54], [-26.5, 54], [-28, 46], [-28.5, 34], [-27.5, 22], [-24, 11], [-18, 4]], 28, AC.nut),
    PR(32, 54, 0, capFront(31, 28), 30, AC.cap, { m: 'wood', tex: 'hatch', ts: 2 }),
    RD([32, 80, 0], [34.5, 89, -1], 2.2, AC.capD, WD),
  ], {
    doors: [10, 54].map((hx, i) => {
      const x = i ? 43 : 21, knob = i ? 34.6 : 29.4;
      return { hinge: [hx, 14], side: i ? -1 : 1, parts: [
        B(x, 32, 14.7, 21.6, 40, 1.4, AC.nutL, { m: 'gloss', r: 4 }),
        oak(x, 22, 15.6, 18, 13, AC.nut, 0, 0.5, { m: 'gloss' }),
        ...acorn(knob, 30, 16.2, 3.6),
      ] };
    }),
    inside: { x: 32, h: 32, w: 42, hh: 38, z: 14 },
  }),

  // a rounded oak chest of four drawers on acorn-cap feet, acorn knobs, a pinecone and two acorns on top
  piece('acrndresser', 'Acorn chest of drawers', 2, 1, 900, 'wood', [
    ...[[6, -10], [58, -10], [6, 10], [58, 10]].map(([x, z]) => capFoot(x, z, 3)),
    B(32, 17, 0, 60, 26, 26, AC.oak, { m: 'wood', r: 3 }),
    ...[[18, 22.5], [46, 22.5], [18, 11.5], [46, 11.5]].flatMap(([x, h]) => [B(x, h, 13.1, 25, 9, 0.9, AC.oakL, { m: 'wood', r: 1.6 }), ...acorn(x, h - 1.9, 13.9, 3.8)]),
    B(32, 31, 0, 62, 2.4, 28, AC.oakL, { m: 'wood', r: 1.2 }),
    pinecone(54, 32.2, -4, 9), ...acorn(9, 32.2, -5, 6), ...acorn(14.5, 32.2, -3, 5),
  ]),

  // an open oak shelf under a hatched acorn-cap dome, its shelves heaped with acorns and pinecones: a nut stash
  piece('acrnshelf', 'Acorn nut-stash shelf', 1, 1, 680, 'wood', [
    ...[2.5, 29.5].map(x => B(x, 32, 0, 3, 62, 18, AC.oak, { m: 'wood', r: 1.4 })),
    B(16, 32, -8, 26, 60, 1.6, AC.oakD, { m: 'wood', r: 0.4 }),
    ...[3, 22, 41, 60].map(h => B(16, h, 0, 26, 2, 17, AC.oakL, { m: 'wood', r: 0.6 })),
    PR(16, 61, 0, capFront(15.4, 13), 19, AC.cap, { m: 'wood', tex: 'hatch', ts: 1.5 }),
    RD([16, 73.6, 0], [17.2, 77.4, 0], 1, AC.capD, WD),
    ...acorn(7.5, 4, 3, 5.4), ...acorn(12.5, 4, -2, 6), ...acorn(18, 4, 3, 5.4), ...acorn(24, 4, -1, 6.2),
    pinecone(9, 23, 0, 11), pinecone(21, 23, -2, 12), ...acorn(26, 23, 4, 4.4),
    ...acorn(8.5, 42, 0, 6.6), ...acorn(15.5, 42, 3, 5.6), ...acorn(22.5, 42, -1, 7),
  ]),

  // a floor lamp: a glowing nut under a hatched cap shade, on a twig stem with an oak leaf, a stump foot
  piece('acrnlamp', 'Acorn lamp', 1, 1, 420, 'wood', [
    LA(16, 0, 0, [[7.4, 0], [7.4, 1.4], [6, 3], [2.4, 4.4]], AC.bark, { m: 'wood', seg: 16, tex: 'bark' }),
    LA(16, 4, 0, [[1.4, 0], [1.1, 18], [1.2, 30], [1, 42]], AC.oakD, { m: 'wood', seg: 8 }),
    RD([16.5, 24, 0], [21, 29, 0], 0.6, AC.oakD, WD), oak(21, 29, 0.4, 11, 9, AC.tawny, -0.6, 0.6),
    LA(16, 44, 0, nutPts(26), AC.glow, { m: 'glow', seg: 14 }),
    LA(16, 44 + 26 * 0.62, 0, capPts(26), AC.cap, { m: 'wood', seg: 14, tex: 'hatch', ts: 1.8 }),
    RD([16, 69, 0], [17.4, 73, 0], 1.1, AC.capD, WD),
  ], { glow: [AC.glow] }),

  // a lamp shaped like a big pinecone, its scales glowing warm from inside, on a stump with two oak leaves
  piece('acrnpinelamp', 'Acorn pinecone lamp', 1, 1, 440, 'wood', [
    LA(16, 0, 0, [[9, 0], [9, 2], [7.6, 4], [7, 10], [7.4, 12]], AC.bark, { m: 'wood', seg: 16, tex: 'bark' }),
    LA(16, 12, 0, conePts(52, 25, 7).map(([r, h]) => [r * 0.86, h]), AC.glow, { m: 'glow', seg: 12 }),
    LA(16, 12, 0, conePts(52, 26, 7), AC.cone, { m: 'wood', seg: 12, tex: 'hatch', ts: 2.2 }),
    oak(11, 11, 7.6, 13, 10, AC.leaf, 0.9, 0.6), oak(21, 11, 7.6, 12, 10, AC.tawny, -0.8, 0.6),
  ], { glow: [AC.glow] }),

  // an acorn wall clock: a nut-brown case with a cream dial, a hatched cap with its stem, an acorn on the pendulum
  wallPiece('acrnclock', 'Acorn wall clock', 1, 560, 'gloss', [
    PR(16, 47, 2.5, [[0, 0], [5, 1.2], [9, 4.4], [11.6, 10], [12.4, 16], [12, 22], [11, 26], [-11, 26], [-12, 22], [-12.4, 16], [-11.6, 10], [-9, 4.4], [-5, 1.2]], 5, AC.nut),
    RG(16, 63.5, 5.2, 7.6, 0.8, AC.capD, WD),
    PC(16, 63.5, 5.1, 15, 15, dial),
    PR(16, 72, 2.8, capFront(13.6, 12), 5.6, AC.cap, { m: 'wood', tex: 'hatch', ts: 1.4 }),
    RD([16, 83.6, 2.8], [17.4, 87.6, 2.8], 1, AC.capD, WD),
    RD([16, 48, 1.6], [16, 38, 1.6], 0.35, AC.capD, WD),
    ...acorn(16, 31, 1.8, 6.4),
  ]),

  // a three-panel folding screen: rounded oak frames with acorn finials, oak boughs turning, a Seedot on the middle one
  piece('acrnscreen', 'Acorn oak-leaf screen', 2, 1, 700, 'wood', [
    ...[[11, 4, 1], [32, -4, 2], [53, 4, 3]].flatMap(([x, z, seed]) => [
      ...[-7, 7].map(dx => capFoot(x + dx, z, 1.8)),
      B(x, 32.5, z, 20.4, 58, 2.2, AC.oak, { m: 'wood', r: 2 }),
      PC(x, 33, z + 1.3, 16, 50, bough(seed)),
      ...acorn(x, 61.4, z, 5.6),
    ]),
    ...[21.5, 42.5].flatMap(x => [16, 50].map(h => B(x, h, 0, 1, 3, 8.4, AC.capD, { m: 'wood', r: 0.3 }))),
  ]),

  // a round wall mirror in a hatched acorn-cap ring, oak leaves and an acorn cluster at its foot
  wallPiece('acrnmirror', 'Acorn cap mirror', 1, 520, 'wood', [
    DS(16, 62, 0.6, 12.4, 1.2, AC.oakD, WD),
    RG(16, 62, 1.6, 11.2, 1.8, AC.cap, { m: 'wood', tex: 'hatch', ts: 1.3 }),
    DS(16, 62, 1.4, 9.6, 0.5, AC.mirror, GL),
    oak(9, 48, 2.6, 11, 9, AC.leaf, 1, 0.6), oak(23, 48, 2.6, 11, 9, AC.tawny, -1, 0.6),
    ...acorn(13.4, 44, 3.4, 6), ...acorn(18.6, 44.4, 3.4, 5.4),
    RD([16, 74, 1.8], [17, 77.4, 1.8], 0.8, AC.capD, WD),
  ]),

  // a garland of oak leaves, green turning tawny and rust, swagged on twine, acorn clusters at its ends and middle
  wallPiece('acrngarland', 'Acorn oak-leaf garland', 2, 380, 'cloth', (() => {
    const at = swag(5, 59, 86, 17), n = 12, parts = [];
    for (let i = 0; i < n; i++) { const [ax, ah] = at(i / n), [bx, bh] = at((i + 1) / n); parts.push(RD([ax, ah, 1.4], [bx, bh, 1.4], 0.35, AC.oakD, WD)); }
    for (let i = 0; i <= 12; i++) {
      const t = 0.04 + i * 0.92 / 12, [x, h] = at(t), side = i % 2 ? 1 : -1;
      parts.push(oak(x, h, 2 + (i % 3) * 0.4, 10, 8, LEAVES[i % 6], Math.PI + side * 0.9 - (t - 0.5) * 0.8, 0.6));
    }
    for (const [x, h] of [[4.6, 80], [59.4, 80]]) parts.push(...acorn(x - 1.2, h, 3.6, 5.6), ...acorn(x + 1.4, h + 0.6, 3.2, 5));
    parts.push(...acorn(29.4, 63.8, 3.8, 5.6), ...acorn(34.6, 64.2, 3.6, 5.2), pinecone(32, 62.6, 3, 6, { rot: Math.PI }));
    return parts;
  })()),

  // a wreath of pinecones round a twig ring, oak leaves between, a rust ribbon bow at its foot
  wallPiece('acrnwreath', 'Acorn pinecone wreath', 1, 340, 'wood', [
    RG(16, 62, 1, 9.2, 1.8, AC.barkD, WD),
    ...Array.from({ length: 8 }, (_, i) => { const a = Math.PI / 2 + i / 8 * TAU + 0.2; return oak(16 + Math.cos(a) * 10.6, 62 + Math.sin(a) * 10.6, 1.6, 7, 6, LEAVES[i % 6], a - Math.PI / 2 + 0.9, 0.6); }),
    ...Array.from({ length: 8 }, (_, i) => { const a = Math.PI / 2 + (i + 0.5) / 8 * TAU, r = 6.4; return pinecone(16 + Math.cos(a) * r, 62 + Math.sin(a) * r, 2.6, 7.6, { rot: a - Math.PI / 2, wid: 4.4, seg: 8 }); }),
    ...acorn(16, 69.5, 3.4, 4.6),
    ...[-1, 1].flatMap(s => [S(16 + s * 3, 50, 3.4, 2.8, 1.8, 1, AC.rust, { m: 'cloth', seg: 8 }), RD([16 + s * 1, 49, 3.2], [16 + s * 3.4, 44, 3.2], 0.8, AC.rust, CL)]),
    S(16, 50, 3.8, 1.3, 1.3, 1.1, AC.tawnyD, { m: 'cloth', seg: 8 }),
  ]),

  // Seedot as a stool: its glossy brown body on two little feet, its pale cap the seat with a moss cushion on it
  piece('acrnseedot', 'Seedot acorn stool', 1, 1, 380, 'gloss', [
    ...[-5, 5].map(dx => S(16 + dx, 1.6, 3, 2.6, 1.6, 3.2, AC.ink, { m: 'gloss', seg: 8 })),
    LA(16, 1.2, 0, nutPts(28).map(([r, h], i) => [i ? r : 0, h]), AC.seedot, { m: 'gloss', seg: 16 }),
    LA(16, 1.2 + 28 * 0.62, 0, capPts(28), AC.seedotCap, { m: 'wood', seg: 16 }),
    ...[-1, 1].flatMap(s => [DS(16 + s * 3.6, 11.6, 11.4, 1.3, 0.8, AC.ink, { ry: 2.2, m: 'gloss', seg: 8 }), DS(16 + s * 3.6 - 0.4, 12.6, 11.9, 0.4, 0.3, '#ffffff', { m: 'plain', seg: 6 })]),
    S(16, 8.6, 12.2, 0.9, 0.6, 0.6, AC.nutD, { m: 'plain', seg: 6 }),
    S(16, 29.4, 0, 9.4, 1.8, 9.4, AC.moss, { m: 'cloth', seg: 14 }),
    RD([16, 30.8, 0], [17.4, 34, 0], 1, AC.capD, WD),
  ]),

  // a hollow log on its side spilling acorns, a Skwovet on top with stuffed cheeks hugging one more
  piece('acrnstash', 'Skwovet acorn stash', 1, 1, 560, 'wood', [
    DS(16, 11, 0, 11, 28, AC.bark, { m: 'wood', seg: 16, tex: 'bark' }),
    RG(16, 11, 14, 10.2, 0.9, AC.ring, WD), DS(16, 11, 14, 9.4, 0.4, AC.barkD, { m: 'plain', seg: 16 }),
    ...acorn(10, 3, 14, 5, { rot: 1.3 }), ...acorn(15.5, 2.6, 14.8, 5.6), ...acorn(21.5, 2.8, 14, 5.2, { rot: -0.4 }), ...acorn(13, 7.4, 13.6, 4.6, { rot: -1 }),
    ...acorn(4, 0, 14, 4.4, { rot: 1.45 }), ...acorn(27.5, 0, 13, 4.2, { rot: -1.45 }),
    S(16, 31, -8, 5, 8, 3.2, AC.skwTail, { m: 'cloth', seg: 10 }), S(16, 38, -5.4, 4, 3.6, 3, AC.skwTail, { m: 'cloth', seg: 10 }),
    S(16, 26.4, -1, 5.4, 5.4, 4.6, AC.skw, { m: 'cloth', seg: 12 }), S(16, 25.6, 2.6, 3.6, 4, 1.6, AC.skwL, { m: 'cloth', seg: 10 }),
    S(16, 33.6, 0, 4.4, 4, 4, AC.skw, { m: 'cloth', seg: 12 }),
    ...[-1, 1].flatMap(s => [S(16 + s * 3.4, 32.4, 1.6, 2.6, 2.4, 2.2, AC.skwL, { m: 'cloth', seg: 8 }), S(16 + s * 2.6, 37.4, -1, 1.2, 1.7, 0.8, AC.skw, { m: 'cloth', seg: 6 }), DS(16 + s * 1.6, 34.6, 3.8, 0.6, 0.4, AC.ink, { m: 'gloss', seg: 6 })]),
    S(16, 33, 4.1, 0.6, 0.45, 0.4, '#e08a8a', { m: 'plain', seg: 6 }),
    ...acorn(16, 24.6, 4.4, 4.4),
  ]),

  // Pineco hanging by a silk thread from an oak bough on a log post, two leaves on the bough
  piece('acrnpineco', 'Pineco oak-bough stand', 1, 1, 450, 'wood', [
    LA(16, 0, 0, [[9, 0], [9, 1.8], [7, 3.6], [3, 4.6]], AC.bark, { m: 'wood', seg: 16, tex: 'bark' }),
    LA(8, 3, 0, [[2.2, 0], [1.8, 6], [1.7, 52], [1.4, 56]], AC.bark, { m: 'wood', seg: 10, tex: 'bark' }),
    RD([8, 55, 0], [16, 58, 0], 1.3, AC.bark, WD), RD([16, 58, 0], [24, 57, 0], 1, AC.bark, WD),
    oak(13, 58, 1, 10, 8, AC.leaf, 0.5, 0.6), oak(20, 58, -1, 9, 7, AC.tawny, -0.4, 0.6),
    RD([22, 57, 0], [22, 40, 0], 0.18, AC.thread, PL),
    S(22, 32.6, 0, 7.4, 8, 7.4, AC.pineco, { m: 'wood', seg: 12, tex: 'hatch', ts: 2.4 }),
    S(22, 40.6, 0, 3, 1.6, 3, AC.pineco, { m: 'wood', seg: 8 }),
    DS(22, 32.6, 6.4, 4.6, 0.8, AC.pinecoD, { ry: 2.1, m: 'plain', seg: 12 }),
    ...[-1, 1].map(s => DS(22 + s * 2, 32.8, 6.9, 0.7, 0.3, AC.cream, { m: 'plain', seg: 6 })),
  ]),

  // a heap of acorns lying every way, a few standing on top, a fallen oak leaf among them
  piece('acrnpile', 'Acorn pile', 1, 1, 220, 'gloss', [
    oak(7, 0.4, -4, 11, 9, AC.tawny, -1.3, 0.6),
    ...acorn(12.5, 3.6, -5, 7, { rot: 1.5 }), ...acorn(19.5, 3.4, -6, 7, { rot: -1.4 }), ...acorn(26, 3.4, -2, 6.4, { rot: -1.6 }),
    ...acorn(6, 3.4, 2, 6.4, { rot: 1.6 }), ...acorn(13, 3.6, 4, 7, { rot: -1.5 }), ...acorn(20, 3.4, 6, 6.6, { rot: 1.5 }),
    ...acorn(10.5, 6, 0, 7.4, { rot: 0.5 }), ...acorn(17.5, 6.6, 0, 8), ...acorn(23.5, 6, -1, 7, { rot: -0.6 }),
    ...acorn(14.5, 12.8, -2, 7.4, { rot: 0.2 }),
  ]),

  // an arch of oak leaves, green, tawny and rust, on two bark posts, acorns hanging from it, pinecones at its feet
  piece('acrnarch', 'Acorn bounty arch', 2, 1, 980, 'wood', (() => {
    const parts = [
      ...[5, 59].flatMap(x => [LA(x, 0, 0, [[4, 0], [4, 1.6], [3, 3], [2.6, 5], [2.6, 58]], AC.bark, { m: 'wood', seg: 10, tex: 'bark' })]),
      RG(32, 58, 0, 27, 1.8, AC.bark, { m: 'wood', ry: 26, a0: 0, arc: Math.PI }),
    ];
    for (let i = 0; i <= 14; i++) {
      const a = i / 14 * Math.PI, x = 32 + Math.cos(a) * 27, h = 58 + Math.sin(a) * 26, s = i % 2 ? 1 : -1;
      parts.push(oak(x, h, s * 1.4, 10, 8.4, LEAVES[i % 6], a - Math.PI / 2 + s * 0.5, 0.8));
    }
    for (const [x, h, i] of [[5, 46, 0], [59, 40, 1], [5, 30, 2], [59, 24, 3], [5, 14, 4]]) parts.push(oak(x, h, 2.6, 9, 7.6, LEAVES[(i + 2) % 6], (x < 32 ? -1 : 1) * 0.8, 0.6));
    for (const [x, h, s] of [[24, 66, 5], [32, 70, 6], [40, 66, 5]]) {
      parts.push(RD([x, h + s * 1.08, 0], [x, 58 + Math.sqrt(Math.max(0, 1 - ((x - 32) / 27) ** 2)) * 26, 0], 0.2, AC.thread, PL), ...acorn(x, h, 0, s));
    }
    parts.push(pinecone(11, 0, 6, 9), pinecone(53, 0, 6, 9.6), ...acorn(14.5, 0, 9, 4, { rot: 1.4 }));
    return parts;
  })()),

  // a young oak in a staved tub: a slim trunk, three twigs of leaves just turning, an acorn on the soil
  piece('acrnsapling', 'Acorn oak sapling', 1, 1, 300, 'wood', [
    LA(16, 0, 0, [[7, 0], [8.2, 1.4], [8.8, 12], [9, 13]], AC.oak, { m: 'wood', seg: 16 }),
    C(16, 3, 0, 8.4, 1.2, AC.barkD, WD), C(16, 11, 0, 8.9, 1.2, AC.barkD, WD),
    C(16, 12.6, 0, 8.2, 0.6, AC.soil, PL),
    RD([16, 12, 0], [16.6, 34, 0], 1, AC.bark, WD),
    RD([16.4, 24, 0], [10, 32, 1], 0.6, AC.bark, WD), RD([16.5, 28, 0], [23, 35, -1], 0.6, AC.bark, WD),
    ...[[10, 32, 1, 0.7, 0], [7, 29, 2, 1.6, 1], [11, 36, 0, 0.2, 2], [23, 35, -1, -0.6, 2], [26, 31, 1, -1.5, 0], [21, 38, -2, -0.2, 3], [16.6, 34, 0, 0, 0], [14, 26, 3, 1.1, 1], [19.5, 27, 3, -1.2, 4]].map(([x, h, z, a, c]) => oak(x, h, z, 10, 8, LEAVES[c], a, 0.6)),
    ...acorn(12, 13, 4, 3.6, { rot: 1.4 }),
  ]),

  // a little rounded oak nightstand: a drawer with an acorn knob, a dark cubby, acorn-cap feet
  piece('acrnnight', 'Acorn nightstand', 1, 1, 380, 'wood', [
    ...[[6, -7], [26, -7], [6, 7], [26, 7]].map(([x, z]) => capFoot(x, z, 2.6)),
    B(16, 13.5, 0, 26, 20, 22, AC.oak, { m: 'wood', r: 3 }),
    B(16, 18.6, 11.2, 21.6, 6.4, 0.8, AC.oakL, { m: 'wood', r: 1.4 }), ...acorn(16, 17, 11.9, 3.4),
    B(16, 9.4, 11, 21.6, 8, 0.4, AC.oakD, { m: 'plain', r: 1.6 }),
    ...acorn(10.6, 6, 11.4, 3, { rot: 1.4 }), pinecone(19, 5.6, 11.4, 6, { rot: -1.5 }),
    B(16, 24.6, 0, 28, 2.4, 24, AC.oakL, { m: 'wood', r: 1.2 }),
  ]),

  // a big oak in a staved tub: a stout trunk, a full canopy of leaves turning at the edges, acorns hanging beneath
  piece('acrnbigtree', 'Big acorn oak tree', 1, 1, 900, 'wood', [
    LA(16, 0, 0, [[8.6, 0], [10, 1.4], [10.6, 13], [10.8, 14]], AC.oak, { m: 'wood', seg: 16 }),
    C(16, 3, 0, 10.2, 1.2, AC.barkD, WD), C(16, 12.4, 0, 10.7, 1.2, AC.barkD, WD), C(16, 14.4, 0, 10, 0.6, AC.soil, PL),
    LA(16, 14, 0, [[3.4, 0], [2.4, 4], [2.1, 26], [2.8, 34], [1.6, 40]], AC.bark, { m: 'wood', seg: 10, tex: 'bark' }),
    RD([16.4, 42, 0], [8, 52, 0], 1.2, AC.bark, WD), RD([16.4, 44, 0], [24, 54, 0], 1.2, AC.bark, WD),
    S(16, 66, -1, 13.6, 11, 12, AC.leaf, { m: 'cloth', seg: 12, tex: 'leafy' }),
    S(7.6, 58, 2, 7, 7, 7.4, AC.leafD, { m: 'cloth', seg: 12, tex: 'leafy' }), S(24.6, 59, 1, 7, 7, 7.4, AC.leafL, { m: 'cloth', seg: 12, tex: 'leafy' }),
    S(10, 75, 1, 7.6, 7, 7, AC.leafL, { m: 'cloth', seg: 12, tex: 'leafy' }), S(22.4, 76, -2, 7.6, 7, 7.6, AC.tawny, { m: 'cloth', seg: 12, tex: 'leafy' }),
    S(16, 82, 0, 6.4, 5.4, 6.4, AC.leaf, { m: 'cloth', seg: 12, tex: 'leafy' }),
    ...[[9, 49.4, 6], [15, 51, 9], [21.5, 49.6, 7], [26, 52, 3]].flatMap(([x, h, z]) => acorn(x, h, z, 4.4)),
  ]),

  // an oak-leaf rug, green at its heart turning tawny at the lobes, its veins picked out in cream
  { id: 'acrnrug', name: 'Acorn oak-leaf rug', group: GROUP, solo: true, w: 3, h: 2, layer: 'rug', price: 760, high: 0.04, side: 'c', flat() {
    const g = ctx(), path = () => { g.beginPath(); RUG.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
    const fill = g.createRadialGradient(46, 32, 4, 46, 32, 50);
    fill.addColorStop(0, AC.leafL); fill.addColorStop(0.45, AC.leaf); fill.addColorStop(0.8, AC.tawny); fill.addColorStop(1, AC.rust);
    g.fillStyle = fill; path(); g.fill();
    g.save(); path(); g.clip();
    for (let x = 0; x < 96; x += 2) for (let y = 0; y < 64; y += 2) if (hash(x, y, 9) < 0.14) { g.fillStyle = hash(x, y, 10) < 0.5 ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'; g.fillRect(x, y, 1, 1); }
    g.strokeStyle = AC.tawnyD; g.lineWidth = 2.4; path(); g.stroke();
    g.strokeStyle = AC.cream; g.globalAlpha = 0.85; g.lineCap = 'round';
    oakVeins(80, 56, -Math.PI / 2, 4).forEach(([ax, ay, bx, by], i) => { g.lineWidth = i ? 0.9 : 1.6; g.beginPath(); g.moveTo(12 + ax, 32 - ay); g.lineTo(12 + bx, 32 - by); g.stroke(); });
    g.restore();
    g.strokeStyle = AC.oakD; g.lineWidth = 0.8; path(); g.stroke();
  } },
];
