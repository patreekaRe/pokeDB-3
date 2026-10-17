/* base-furniture-caravan.js  -  the Desert caravan set (furniture expansion session h, 2026-10-17): a desert traders'
   tent room, a souk's warmth rather than the Desert shelf's Egypt. Woven rugs and cushions in deep red, saffron, indigo
   and teal with geometric kilim bands and tassels, carved dark wood with brass studs and mashrabiya lattice, pierced
   brass lanterns and coloured glass lamps, copper and brass trays and ewers, camel leather, striped tent cloth and a
   spice stall. A Sandile on the dresser, a Hippopotas pouf, a Trapinch carved on the chest, a Cacnea in a pot and
   Sigilyph woven into the tapestry for the Pokémon touches. All solo, fixed colours, sold all year.
   An upright piece is a list of parts in painted units (32 a tile), as in js/base-furniture-ranch.js: `x` across from the
   left of its front, `h` up from the floor (a wall piece's from the foot of its strip), `z` out to the front from its
   middle (a wall piece's from the wall). They're painted here from any side, and js/base-models-caravan.js builds the same
   list as 3D parts (BUILT), so picture and model agree. `tex` is painted only (the model stays plain colour): `kilim`
   woven zigzag and diamond rows, `lattice` a mashrabiya's diamond grid, `pierce` a pierced brass's holes, `stripe` tent
   cloth's stripes, `engrave` a brass plate's chased rings; `tc` is its colour. A `pic` part (the desk's map, the
   tapestry's Sigilyph, the chest's Trapinch) is painted on the front only, and the model wears that crop of the
   painting. The wardrobe's doors swing (`doors`, `inside`). The rug is a kilim, painted from above. */

import { sh, oval, ovalShade, floorShadow, ctx, hash, glass as glassPane } from './base-paint.js';

export const CV = {
  wood: '#5e3822', woodD: '#3e2416', woodL: '#80502e', red: '#a8262e', redD: '#741a20', redL: '#c84a3e',
  saffron: '#e2a224', saffronL: '#f4c858', saffronD: '#b07816', indigo: '#2e3c7c', indigoD: '#1e2856', indigoL: '#4c5ca8',
  teal: '#1f8a84', tealD: '#14625e', tealL: '#40b2a6', cream: '#efe0c0', creamD: '#d4c098',
  brass: '#c99a3c', brassL: '#e6c068', brassD: '#8e6a22', copper: '#b86a3a', copperD: '#8a4a26', silver: '#cfcac0',
  leather: '#b47a42', leatherD: '#865628', leatherL: '#cc965a', clay: '#c0703e', clayD: '#94502a', clayL: '#d89262',
  burlap: '#c8a878', burlapD: '#a08458', soil: '#5a4030', glow: '#ffcf70', ruby: '#ff8a74', jade: '#9ae6b4', amber: '#ffc46a',
  paper: '#e8d4a4', ink: '#2c221a', sand: '#e2c48a', mirror: '#cfe1ea', glass: '#cfe8f4',
  paprika: '#c8402a', turmeric: '#e8b020', sumac: '#7a2a3a', herb: '#7a8a3a', cinnamon: '#9a5a30', date: '#5a2a18',
  sandile: '#c89a68', sandileD: '#2a2420', hippo: '#d8b07a', hippoL: '#ecd2a4', hippoD: '#7a5636',
  cac: '#5c9a46', cacD: '#3e7232', cacL: '#b8d468', trap: '#e48a3c', trapD: '#a85a20',
};
const GROUP = 'Desert caravan';
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

const CL = { m: 'cloth' }, PL = { m: 'plain' }, GL = { m: 'gloss' }, WD = { m: 'wood' }, MT = { m: 'metal' }, ST = { m: 'metal', seg: 6 };
const LAT = (ts = 2.2, tc = CV.woodD) => ({ m: 'wood', tex: 'lattice', tc, ts });
const KIL = (tc, ts = 2.6) => ({ m: 'cloth', tex: 'kilim', tc, ts });

/** A brass stud. */
const stud = (x, h, z, c = CV.brassL) => DS(x, h, z, 0.7, 0.4, c, ST);
/** n brass studs in a row from x0 to x1. */
const studRow = (x0, x1, n, h, z) => Array.from({ length: n }, (_, i) => stud(x0 + (x1 - x0) * i / (n - 1), h, z));
/** A woven tassel hanging from its knot at h. */
const tassel = (x, h, z, c = CV.saffron) => [S(x, h, z, 0.75, 0.75, 0.75, c, { m: 'cloth', seg: 6 }), LA(x, h - 3.8, z, [[0, 0], [1.1, 0.2], [0.9, 1.6], [0.4, 3.4]], c, { m: 'cloth', seg: 6 })];
/** A pointed souk arch's outline about its foot's middle: w wide, straight sides h tall, the point `peak` above them. */
const arch = (w, h, peak) => { const a = w / 2; return [[-a, 0], [a, 0], [a, h], [a * 0.72, h + peak * 0.45], [a * 0.34, h + peak * 0.8], [0, h + peak], [-a * 0.34, h + peak * 0.8], [-a * 0.72, h + peak * 0.45], [-a, h]]; };

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
function texture(q, path, bb) {
  const g = ctx(), [x0, y0, x1, y1] = bb, c = q.c, tc = q.tc || sh(c, -2);
  g.save(); g.clip(path);
  if (q.tex === 'stripe') {
    const s = q.ts || 3;
    g.fillStyle = tc;
    for (let x = x0 + s / 2; x < x1; x += s * 2) g.fillRect(x, y0, s, y1 - y0);
    g.globalAlpha = 0.25; g.fillStyle = '#000000';
    for (let x = x0 + s / 2; x < x1; x += s) g.fillRect(x - 0.15, y0, 0.3, y1 - y0);
  } else if (q.tex === 'kilim') {
    const s = q.ts || 2.6;
    for (let y = y0 + s / 2, i = 0; y < y1 + s / 2; y += s, i++) {
      if (i % 2 === 0) {
        g.strokeStyle = tc; g.lineWidth = s * 0.24; g.beginPath();
        for (let x = x0 - s, k = 0; x <= x1 + s; x += s / 2, k++) g.lineTo(x, y + (k % 2 ? -s * 0.24 : s * 0.24));
        g.stroke();
      } else {
        g.fillStyle = i % 4 === 1 ? CV.cream : sh(tc, 1);
        for (let x = x0 + s / 2 + (i % 4 === 1 ? 0 : s / 2); x < x1; x += s) {
          const r = s * 0.26; g.beginPath(); g.moveTo(x, y - r); g.lineTo(x + r, y); g.lineTo(x, y + r); g.lineTo(x - r, y); g.closePath(); g.fill();
        }
      }
    }
  } else if (q.tex === 'lattice') {
    const s = q.ts || 2.2, H = y1 - y0;
    g.strokeStyle = tc; g.lineWidth = s * 0.26; g.beginPath();
    for (let k = x0 - H; k < x1 + s; k += s) { g.moveTo(k, y0); g.lineTo(k + H, y1); g.moveTo(k + H, y0); g.lineTo(k, y1); }
    g.stroke();
    g.fillStyle = sh(c, 2); g.globalAlpha = 0.5;
    for (let y = y0 + s / 2, i = 0; y < y1; y += s / 2, i++) for (let x = x0 + (i % 2 ? s / 2 : 0); x < x1; x += s) g.fillRect(x - 0.2, y - 0.2, 0.4, 0.4);
  } else if (q.tex === 'pierce') {
    const s = q.ts || 1.8;
    g.fillStyle = tc;
    for (let y = y0 + s / 2, i = 0; y < y1; y += s * 0.8, i++) for (let x = x0 + (i % 2 ? s / 2 : 0); x < x1; x += s) {
      const r = s * (i % 3 === 0 ? 0.26 : 0.18); g.beginPath(); g.moveTo(x, y - r); g.lineTo(x + r, y); g.lineTo(x, y + r); g.lineTo(x - r, y); g.closePath(); g.fill();
    }
  } else if (q.tex === 'engrave') {
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.min(x1 - x0, y1 - y0) / 2;
    g.strokeStyle = tc; g.globalAlpha = 0.7; g.lineWidth = R * 0.05;
    for (const k of [0.84, 0.5, 0.2]) { g.beginPath(); g.arc(cx, cy, R * k, 0, TAU); g.stroke(); }
    g.beginPath();
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, k = i % 2 ? 0.26 : 0.48; i ? g.lineTo(cx + Math.cos(a) * R * k, cy + Math.sin(a) * R * k) : g.moveTo(cx + Math.cos(a) * R * k, cy + Math.sin(a) * R * k); }
    g.closePath(); g.stroke();
    g.fillStyle = tc;
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.beginPath(); g.arc(cx + Math.cos(a) * R * 0.67, cy + Math.sin(a) * R * 0.67, R * 0.06, 0, TAU); g.fill(); }
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
        break;
      }
      case 'disc': if (side) rbx(cx - q.th / 2, cy - (q.ry ?? q.r), q.th, (q.ry ?? q.r) * 2, q.th / 2, q.c, m); else {
        ball(cx, cy, q.r, q.ry ?? q.r, q.c, m);
        if (q.tex) { const p = new Path2D(); p.ellipse(cx, cy, q.r, q.ry ?? q.r, 0, 0, TAU); texture(q, p, [cx - q.r, cy - q.r, cx + q.r, cy + q.r]); }
      } break;
      case 'lathe': {
        const P = (dx, up) => [cx + flip * dx, cy - up];
        const rmax = Math.max(...q.pts.map(p => p[0]));
        const pts = [...q.pts.map(([r, up]) => P(-r, up)), ...q.pts.slice().reverse().map(([r, up]) => P(r, up))];
        poly(pts, q.c, m, m !== 'glow');
        if (q.tex) texture(q, polyPath(pts), bounds(pts));
        if (m === 'gloss' && rmax > 1.2) {
          const at = q.pts.find(p => p[0] === rmax), [hx, hy] = P(-rmax * 0.48, at[1] * 0.92);
          g.save(); g.globalAlpha *= 0.5; oval(hx, hy, rmax * 0.14, Math.max(0.4, at[1] * 0.1), '#ffffff'); g.restore();
        }
        if (q.pts[q.pts.length - 1][0] < 0.01 && q.pts.length > 2) break;
        const [rt, ut] = q.pts[q.pts.length - 1];
        oval(cx, cy - ut, rt, rt * 0.22, sh(q.c, -2));
        break;
      }
      case 'ring': {
        const ry = q.ry ?? q.r;
        if (side && !q.flat) { if (q.arc) break; rbx(cx - q.tr, cy - ry - q.tr, q.tr * 2, (ry + q.tr) * 2, q.tr, q.c, m); break; }
        const a0 = q.arc ? -(q.a0 + q.arc) : 0, a1 = q.arc ? -q.a0 : TAU;
        const path = (dy = 0) => { g.beginPath(); if (q.flat) g.ellipse(cx, cy + dy, q.r, q.r * 0.22, 0, 0, TAU); else g.ellipse(cx, cy + dy, q.r, ry, 0, a0, a1); };
        g.lineCap = 'butt'; g.strokeStyle = q.c; g.lineWidth = q.tr * 2; path(); g.stroke();
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
        break;
      }
      case 'pic': g.save(); g.beginPath(); g.rect(cx - q.w / 2, cy - q.hh / 2, q.w, q.hh); g.clip(); q.fn(g, cx - q.w / 2, cy - q.hh / 2, q.w, q.hh); g.restore(); break;
    }
  }
}

/* ---------- pictures ---------- */

const diamond = (g, x, y, rx, ry, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(x, y - ry); g.lineTo(x + rx, y); g.lineTo(x, y + ry); g.lineTo(x - rx, y); g.closePath(); g.fill(); };

/** The desk's caravan map: foxed parchment, dunes, an oasis with palms, a dotted route between red towns, a compass rose. */
function map(g, x, y, w, h) {
  const bg = g.createRadialGradient(x + w / 2, y + h / 2, h * 0.3, x + w / 2, y + h / 2, w * 0.6);
  bg.addColorStop(0, sh(CV.paper, 1)); bg.addColorStop(1, sh(CV.paper, -2));
  g.fillStyle = bg; g.fillRect(x, y, w, h);
  for (let i = 0; i < 18; i++) { g.globalAlpha = 0.15; g.fillStyle = CV.woodL; g.beginPath(); g.arc(x + hash(i, 4, 1) * w, y + hash(i, 5, 1) * h, 0.3 + hash(i, 6, 1) * 0.9, 0, TAU); g.fill(); }
  g.globalAlpha = 0.6; g.strokeStyle = CV.saffronD; g.lineWidth = 0.3;
  for (const [dx, dy, r] of [[0.18, 0.3, 3], [0.4, 0.82, 4], [0.7, 0.86, 3.4], [0.5, 0.28, 2.6], [0.86, 0.6, 2.2], [0.12, 0.86, 2.4]]) { g.beginPath(); g.arc(x + dx * w, y + dy * h + r, r, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
  g.globalAlpha = 1;
  g.fillStyle = '#5a9ac0'; g.beginPath(); g.ellipse(x + w * 0.62, y + h * 0.62, 2, 1.1, 0, 0, TAU); g.fill();
  g.fillStyle = '#4a7a3a'; for (const [dx, dy] of [[-2.4, -1], [2.3, -0.8], [0.4, -1.8]]) { g.beginPath(); g.arc(x + w * 0.62 + dx, y + h * 0.62 + dy, 0.7, 0, TAU); g.fill(); }
  const route = [[0.1, 0.72], [0.28, 0.44], [0.46, 0.62], [0.62, 0.62], [0.78, 0.34], [0.9, 0.24]];
  g.strokeStyle = CV.red; g.lineWidth = 0.35; g.setLineDash([0.8, 0.7]); g.beginPath();
  route.forEach(([dx, dy], i) => (i ? g.lineTo(x + dx * w, y + dy * h) : g.moveTo(x + dx * w, y + dy * h))); g.stroke(); g.setLineDash([]);
  g.fillStyle = CV.redD; for (const [dx, dy] of [route[0], route[2], route[4]]) g.fillRect(x + dx * w - 0.8, y + dy * h - 0.8, 1.6, 1.6);
  const [ex, ey] = route[5]; g.strokeStyle = CV.redD; g.lineWidth = 0.4; g.beginPath(); g.moveTo(x + ex * w - 1, y + ey * h - 1); g.lineTo(x + ex * w + 1, y + ey * h + 1); g.moveTo(x + ex * w + 1, y + ey * h - 1); g.lineTo(x + ex * w - 1, y + ey * h + 1); g.stroke();
  const rx = x + w * 0.9, ry = y + h * 0.72;
  diamond(g, rx, ry, 0.6, 2.4, CV.ink); diamond(g, rx, ry, 2.4, 0.6, CV.ink); diamond(g, rx, ry - 1.2, 0.35, 1.2, CV.red);
  g.strokeStyle = CV.woodD; g.lineWidth = 0.4; g.strokeRect(x + 0.6, y + 0.6, w - 1.2, h - 1.2);
}

/** The tapestry: an indigo field in a saffron border woven with red zigzags, Sigilyph in the middle, its wings' eye spots
    yellow, red and blue, a ring at its tail's end, little saffron diamonds about it. */
function sigilyph(g, x, y, w, h) {
  g.fillStyle = CV.indigo; g.fillRect(x, y, w, h);
  const bw = 3.4;
  g.fillStyle = CV.saffron; g.fillRect(x, y, w, bw); g.fillRect(x, y + h - bw, w, bw); g.fillRect(x, y, bw, h); g.fillRect(x + w - bw, y, bw, h);
  g.strokeStyle = CV.red; g.lineWidth = 0.6; g.beginPath();
  const zig = (ax, ay, bx, by) => { const n = Math.round(Math.hypot(bx - ax, by - ay) / 1.6); for (let i = 0; i <= n; i++) { const t = i / n, o = i % 2 ? -0.8 : 0.8, nx = (by - ay) ? 1 : 0, ny = nx ? 0 : 1; g.lineTo(ax + (bx - ax) * t + o * nx, ay + (by - ay) * t + o * ny); } };
  g.moveTo(x + bw / 2, y + bw / 2); zig(x + bw / 2, y + bw / 2, x + w - bw / 2, y + bw / 2); g.stroke();
  g.beginPath(); g.moveTo(x + bw / 2, y + h - bw / 2); zig(x + bw / 2, y + h - bw / 2, x + w - bw / 2, y + h - bw / 2); g.stroke();
  g.beginPath(); g.moveTo(x + bw / 2, y + bw / 2); zig(x + bw / 2, y + bw / 2, x + bw / 2, y + h - bw / 2); g.stroke();
  g.beginPath(); g.moveTo(x + w - bw / 2, y + bw / 2); zig(x + w - bw / 2, y + bw / 2, x + w - bw / 2, y + h - bw / 2); g.stroke();
  g.strokeStyle = CV.tealL; g.lineWidth = 0.5; g.strokeRect(x + bw + 1, y + bw + 1, w - bw * 2 - 2, h - bw * 2 - 2);
  const cx = x + w / 2, cy = y + h * 0.5, s = h * 0.82, dark = '#1c1820';
  for (const k of [[0.1, 0.12], [0.9, 0.12], [0.1, 0.88], [0.9, 0.88], [0.5, 0.1]]) diamond(g, x + (bw + 3) + k[0] * (w - 2 * bw - 6), y + (bw + 3) + k[1] * (h - 2 * bw - 6), 1, 1.4, CV.saffronL);
  for (const sg of [-1, 1]) {
    g.fillStyle = dark; g.beginPath();
    g.moveTo(cx + sg * s * 0.05, cy - s * 0.12); g.lineTo(cx + sg * s * 0.5, cy - s * 0.3); g.lineTo(cx + sg * s * 0.58, cy - s * 0.08);
    g.lineTo(cx + sg * s * 0.46, cy + s * 0.08); g.lineTo(cx + sg * s * 0.06, cy + s * 0.1); g.closePath(); g.fill();
    const ex = cx + sg * s * 0.34, ey = cy - s * 0.1;
    g.fillStyle = CV.saffronL; g.beginPath(); g.ellipse(ex, ey, s * 0.085, s * 0.07, 0, 0, TAU); g.fill();
    g.fillStyle = CV.red; g.beginPath(); g.ellipse(ex, ey, s * 0.055, s * 0.045, 0, 0, TAU); g.fill();
    g.fillStyle = '#3a78d0'; g.beginPath(); g.arc(ex, ey, s * 0.025, 0, TAU); g.fill();
    g.fillStyle = CV.red; g.beginPath(); g.moveTo(cx + sg * s * 0.47, cy + s * 0.06); g.lineTo(cx + sg * s * 0.55, cy - s * 0.06); g.lineTo(cx + sg * s * 0.52, cy + s * 0.06); g.closePath(); g.fill();
  }
  g.fillStyle = dark; g.beginPath(); g.ellipse(cx, cy + s * 0.02, s * 0.075, s * 0.24, 0, 0, TAU); g.fill();
  g.beginPath(); g.arc(cx, cy - s * 0.28, s * 0.1, 0, TAU); g.fill();
  g.fillStyle = CV.saffronL; g.beginPath(); g.ellipse(cx, cy - s * 0.28, s * 0.06, s * 0.05, 0, 0, TAU); g.fill();
  g.fillStyle = CV.red; g.beginPath(); g.arc(cx, cy - s * 0.28, s * 0.03, 0, TAU); g.fill();
  g.fillStyle = '#3a78d0'; g.fillRect(cx - s * 0.05, cy - s * 0.06, s * 0.1, s * 0.03);
  g.fillStyle = CV.saffronL; g.fillRect(cx - s * 0.04, cy + s * 0.02, s * 0.08, s * 0.025);
  g.strokeStyle = dark; g.lineWidth = s * 0.025; g.beginPath(); g.moveTo(cx, cy + s * 0.24); g.lineTo(cx, cy + s * 0.4); g.stroke();
  g.strokeStyle = '#3a78d0'; g.lineWidth = s * 0.02; g.beginPath(); g.arc(cx, cy + s * 0.44, s * 0.04, 0, TAU); g.stroke();
}

/** The chest's carved medallion: Trapinch's great orange head, its wide toothed jaw and little dark eyes. */
function trapinch(g, x, y, w, h) {
  const cx = x + w / 2, cy = y + h / 2, s = w;
  g.fillStyle = CV.woodL; g.fillRect(x, y, w, h);
  g.fillStyle = CV.trap; g.beginPath(); g.ellipse(cx, cy + s * 0.32, s * 0.16, s * 0.12, 0, 0, TAU); g.fill();
  g.beginPath(); g.ellipse(cx, cy - s * 0.04, s * 0.42, s * 0.32, 0, 0, TAU); g.fill();
  g.strokeStyle = CV.trapD; g.lineWidth = s * 0.03; g.stroke();
  g.fillStyle = CV.trapD; g.beginPath(); g.ellipse(cx, cy + s * 0.04, s * 0.32, s * 0.08, 0, 0, TAU); g.fill();
  g.fillStyle = '#f6f0e0';
  for (const sg of [-1, 1]) for (const k of [0.12, 0.24]) {
    g.beginPath(); g.moveTo(cx + sg * s * k - s * 0.035, cy - s * 0.02); g.lineTo(cx + sg * s * k + s * 0.035, cy - s * 0.02); g.lineTo(cx + sg * s * k, cy + s * 0.05); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(cx + sg * s * k - s * 0.03, cy + s * 0.1); g.lineTo(cx + sg * s * k + s * 0.03, cy + s * 0.1); g.lineTo(cx + sg * s * k, cy + s * 0.04); g.closePath(); g.fill();
  }
  for (const sg of [-1, 1]) {
    diamond(g, cx + sg * s * 0.17, cy - s * 0.17, s * 0.05, s * 0.07, CV.ink);
    g.fillStyle = '#ffffff'; g.fillRect(cx + sg * s * 0.17 - s * 0.02, cy - s * 0.2, s * 0.025, s * 0.025);
  }
}

/* ---------- the kinds ---------- */

/** What js/base-models-caravan.js builds for each upright and wall kind: its parts, doors and default material. */
export const BUILT = {};
/** The rug's outline from above, in painted units across its 3 x 2 tiles. */
export const RUG = [[0, 1], [96, 1], [96, 63], [0, 63]];

function piece(id, name, w, h, price, mat, parts, { doors = [], inside, ...rest } = {}) {
  BUILT[id] = { parts, doors, inside, mat };
  const all = [...parts, ...doors.flatMap(d => d.parts)];
  return { id, name, group: GROUP, solo: true, w, h, price, ...rest, draw(x, b, vw, dir) { floorShadow(x, b, vw); paintParts(all, x, b, vw, dir, w * 32); } };
}
function wallPiece(id, name, w, price, mat, parts, rest = {}) {
  BUILT[id] = { parts, doors: [], mat };
  return { id, name, group: GROUP, solo: true, w, h: 1, layer: 'wall', price, ...rest, wall(x) { paintParts(parts, x, 96, w * 32, 0, w * 32); } };
}

/** A hanging lamp of coloured glass on its chain from (x, top, z): a brass cap, the glowing globe, a brass drop. */
const lamp = (x, top, z, c) => [
  RD([x, top, z], [x, top - 5, z], 0.3, CV.brassD, MT),
  LA(x, top - 7.6, z, [[2.8, 0], [2, 1.4], [0.8, 2.4], [0, 2.6]], CV.brass, { m: 'metal', seg: 10 }),
  S(x, top - 11, z, 3, 3.6, 3, c, { m: 'glow', seg: 10 }),
  LA(x, top - 16.4, z, [[0, 0], [0.8, 1], [2.2, 2.4]], CV.brass, { m: 'metal', seg: 10 }),
];

export const CARAVAN_KINDS = [
  // a low carved platform bed studded in brass, a red kilim cover over its front, cushions against a pointed lattice
  // headboard, and a striped tent canopy on four poles, its indigo curtains tied back
  piece('crvbed', 'Desert caravan canopy bed', 2, 2, 1750, 'wood', [
    B(32, 5, 0, 62, 10, 60, CV.wood, WD),
    B(32, 9.4, 30.2, 62, 1.2, 0.8, CV.brass, MT), ...studRow(6, 58, 7, 4.6, 30.4),
    B(32, 13, 1, 58, 6, 56, CV.cream, CL),
    B(32, 16.4, 6, 59, 1.6, 46, CV.red, CL),
    B(32, 11.6, 29.6, 59, 8.8, 0.8, CV.red, KIL(CV.saffron, 2.8)),
    ...[8, 20, 32, 44, 56].flatMap(x => tassel(x, 7.4, 30.2)),
    PR(32, 10, -29, arch(60, 20, 16), 3, CV.wood, WD),
    PR(32, 13, -27.3, arch(48, 16, 12), 0.6, CV.woodL, LAT(2.4)),
    ...studRow(6, 58, 8, 11.6, -27.2),
    S(16, 22.6, -21, 10, 5.5, 4, CV.indigo, { m: 'cloth', seg: 12 }), S(48, 22.6, -21, 10, 5.5, 4, CV.teal, { m: 'cloth', seg: 12 }),
    S(32, 21.4, -17, 8, 4.4, 3.4, CV.saffron, { m: 'cloth', seg: 12 }), ...tassel(24.6, 19, -15, CV.red), ...tassel(39.4, 19, -15, CV.red),
    ...[[2.5, -30], [61.5, -30], [2.5, 30], [61.5, 30]].flatMap(([x, z]) => [B(x, 36, z, 2.6, 52, 2.6, CV.woodD, WD), S(x, 63.4, z, 1.4, 1.6, 1.4, CV.brass, { m: 'metal', seg: 8 })]),
    PR(32, 62, 0, [[-32, 0], [32, 0], [0, 12]], 60, CV.saffron, { m: 'cloth', tex: 'stripe', tc: CV.red, ts: 3.2 }),
    B(32, 59.4, 30.4, 63, 5.2, 0.6, CV.red, CL), B(32, 58, 30.8, 63, 1, 0.4, CV.saffron, CL),
    ...[8, 20, 32, 44, 56].flatMap(x => tassel(x, 56.4, 30.8)),
    ...[5, 59].flatMap(x => [C(x, 46, 28.4, 3.4, 22, CV.indigo, { m: 'cloth', rb: 1.4, seg: 8 }), C(x, 34.4, 28.4, 1.7, 1.4, CV.saffron, { m: 'plain', seg: 8 }),
      C(x, 22.5, 28.4, 1.4, 23, CV.indigo, { m: 'cloth', rb: 3.6, seg: 8 }), ...tassel(x, 33.6, 30.2)]),
  ]),

  // a round camel-leather pouf, stitched, a red kilim band about its middle and saffron tassels
  piece('crvpouf', 'Desert caravan leather pouf', 1, 1, 260, 'cloth', [
    LA(16, 0, 0, [[9, 0], [11, 1.4], [12.2, 4.4], [12.4, 8], [11.6, 11.4], [9.6, 13.4], [5, 14.4], [0, 14.6]], CV.leather, { m: 'cloth', seg: 16 }),
    C(16, 7.4, 0, 12.55, 3.4, CV.red, { m: 'plain', seg: 16, tex: 'kilim', tc: CV.saffron, ts: 1.7 }),
    C(16, 4.6, 0, 12.3, 0.6, CV.leatherD, { m: 'plain', seg: 16 }), C(16, 10.2, 0, 12.2, 0.6, CV.leatherD, { m: 'plain', seg: 16 }),
    ...tassel(7.5, 6, 9.4), ...tassel(24.5, 6, 9.4),
  ]),

  // a carved dark-wood chair: a pointed lattice back, brass finials and studs, a red kilim cushion with tassels
  piece('crvchair', 'Desert caravan carved chair', 1, 1, 480, 'wood', [
    ...[6, 26].flatMap(x => [B(x, 23.5, -9, 2.8, 47, 2.8, CV.woodD, WD), B(x, 8, 9, 2.8, 16, 2.8, CV.woodD, WD), RD([x, 5, -9], [x, 5, 9], 0.7, CV.woodD, WD), S(x, 48.4, -9, 1.6, 1.6, 1.6, CV.brass, { m: 'metal', seg: 8 })]),
    RD([6, 5, 9], [26, 5, 9], 0.7, CV.woodD, WD),
    B(16, 16.6, 0, 24, 2.6, 22, CV.wood, WD),
    B(16, 13.6, 11.2, 20, 3.4, 0.8, CV.woodL, WD), ...studRow(9, 23, 3, 13.6, 11.7),
    B(16, 19, 1, 22, 2.4, 19, CV.red, KIL(CV.saffron, 1.6)), ...tassel(5.6, 18.6, 10.8), ...tassel(26.4, 18.6, 10.8),
    PR(16, 20.4, -9.2, arch(17.2, 14, 10), 1.4, CV.woodL, LAT(2)),
    PR(16, 43.6, -9.2, [[-10, 0], [10, 0], [6, 2.4], [0, 4.6], [-6, 2.4]], 2, CV.wood, WD),
    stud(16, 45.4, -8),
  ]),

  // a long low divan on a studded base: an indigo kilim seat, red back cushions, saffron and teal cushions with tassels,
  // and a teal bolster at each end
  piece('crvdivan', 'Desert caravan divan', 2, 1, 1250, 'cloth', [
    B(32, 4, 0, 62, 8, 28, CV.woodD, WD), ...studRow(5, 59, 10, 4, 14.2),
    B(32, 11, 2, 60, 6, 24, CV.indigo, { ...KIL(CV.saffron), r: 2 }),
    ...[18, 46].map(x => B(x, 20.6, -9, 27, 15, 7, CV.red, { m: 'cloth', r: 3 })),
    B(19, 19, -4.4, 14, 11, 3, CV.saffron, { ...KIL(CV.red, 2.2), r: 2 }), B(45, 19, -4.4, 14, 11, 3, CV.teal, { ...KIL(CV.cream, 2.2), r: 2 }),
    ...[12.6, 25.4].flatMap(x => tassel(x, 14, -2.6, CV.red)), ...[38.6, 51.4].flatMap(x => tassel(x, 14, -2.6, CV.cream)),
    ...[4.6, 59.4].flatMap(x => [RD([x, 17.6, -12], [x, 17.6, 12], 4.4, CV.teal, CL), DS(x, 17.6, 12.2, 3.2, 0.4, CV.saffron, { m: 'plain', seg: 12 }), ...tassel(x, 16.6, 12.8)]),
  ]),

  // a round hammered brass tray on a folding carved stand, three coloured tea glasses and a copper bowl of dates
  piece('crvtray', 'Desert caravan tray table', 1, 1, 420, 'metal', [
    ...[-7, 7].flatMap(z => [RD([5, 0.8, z], [27, 21.4, z], 1.1, CV.wood, WD), RD([27, 0.8, z], [5, 21.4, z], 1.1, CV.wood, WD), stud(16, 11.1, z + 1.3)]),
    RD([5, 21.4, -7], [5, 21.4, 7], 0.8, CV.woodD, WD), RD([27, 21.4, -7], [27, 21.4, 7], 0.8, CV.woodD, WD),
    C(16, 22.6, 0, 15.4, 1.4, CV.brass, { m: 'metal', seg: 20 }), RG(16, 23.4, 0, 15.2, 0.55, CV.brassD, { m: 'metal', flat: true }),
    ...[[9, 4, CV.teal], [13.4, 8, CV.red], [19.6, 6.4, CV.saffronD]].flatMap(([x, z, c]) => [C(x, 25.1, z, 1.5, 3.6, c, { m: 'gloss', rb: 1.1, seg: 10 }), C(x, 27, z, 1.55, 0.4, CV.brassL, { m: 'plain', seg: 10 })]),
    LA(22, 23.3, -3, [[1.8, 0], [3.6, 1], [4.4, 2.6], [4.6, 3.2]], CV.copper, { m: 'metal', seg: 12 }),
    S(21, 26.4, -3, 1.4, 0.9, 0.9, CV.date, { m: 'gloss', seg: 6 }), S(23.4, 26.6, -2.4, 1.4, 0.9, 0.9, CV.date, { m: 'gloss', seg: 6 }), S(22.2, 27.3, -3.6, 1.4, 0.9, 0.9, CV.date, { m: 'gloss', seg: 6 }),
  ]),

  // a carved writing desk on lattice pedestals, a brass-pulled drawer, the caravan's route map pinned on its back board,
  // a rolled scroll, an inkwell and quill and a little brass astrolabe
  piece('crvdesk', 'Desert caravan map desk', 2, 1, 900, 'wood', [
    ...[5, 59].flatMap(x => [B(x, 12.5, 0, 6, 25, 26, CV.wood, WD), B(x, 12.5, 13.3, 4.4, 21, 0.6, CV.woodL, LAT(1.8))]),
    B(32, 22.4, 11.6, 52, 5, 1.6, CV.woodL, WD), B(32, 22.4, 12.8, 16, 3.4, 0.8, CV.woodD, WD), DS(32, 22.4, 13.4, 0.9, 0.5, CV.brass, ST),
    stud(12, 22.4, 12.6), stud(52, 22.4, 12.6),
    B(32, 6, -10, 52, 2.4, 2.4, CV.woodD, WD),
    B(32, 26.4, 0, 64, 2.8, 28, CV.woodD, WD),
    B(32, 38.4, -12.6, 56, 20, 1.6, CV.woodD, WD),
    PR(32, 48.4, -12.6, [[-14, 0], [14, 0], [8, 3], [3, 5.4], [0, 7], [-3, 5.4], [-8, 3]], 1.6, CV.wood, WD), stud(32, 51, -11.6),
    PC(32, 38.4, -11.7, 48, 16, map),
    RD([8, 29.4, 4], [20, 29.4, 4], 1.4, CV.paper, PL), DS(8, 29.4, 4, 1.45, 0.4, CV.creamD, { m: 'plain', seg: 8 }), RD([14, 29.4, 5.5], [14, 29.4, 2.5], 1.5, CV.red, { m: 'plain' }),
    C(44, 29.6, 4, 1.8, 3.6, CV.indigo, { m: 'gloss', seg: 8 }), RD([44, 31, 4], [47.4, 38.4, 3], 0.4, CV.cream, PL),
    C(54, 28.3, -4, 1.8, 0.8, CV.brassD, { m: 'metal', seg: 10 }), RD([54, 28.6, -4], [54, 30, -4], 0.5, CV.brassD, MT),
    DS(54, 33.6, -4, 3.6, 0.6, CV.brass, { m: 'metal', seg: 14, tex: 'engrave', tc: CV.brassD }),
  ]),

  // a tall carved wardrobe under a pointed crown, brass studs, two doors with pointed lattice panels that swing open
  piece('crvwardrobe', 'Desert caravan carved wardrobe', 2, 1, 1400, 'wood', [
    B(32, 2, 0, 62, 4, 26, CV.woodD, WD),
    B(32, 33, 0, 60, 58, 24, CV.wood, WD),
    PR(32, 62, 0, [[-31, 0], [31, 0], [31, 3], [20, 6], [9, 9], [3, 12], [0, 14], [-3, 12], [-9, 9], [-20, 6], [-31, 3]], 26, CV.woodD, WD),
    ...studRow(5, 59, 9, 63.6, 13.3),
    S(32, 77.4, 0, 1.6, 2, 1.6, CV.brass, { m: 'metal', seg: 8 }),
  ], {
    doors: [4, 60].map((hx, i) => {
      const x = i ? 46.2 : 17.8, l = x - 13.8, r = x + 13.8, px = i ? l + 3.4 : r - 3.4;
      return { hinge: [hx, 13.4], side: i ? -1 : 1, parts: [
        B(x, 33, 12.7, 27.6, 54, 1.4, CV.woodL, WD),
        PR(x, 12, 13.6, arch(19, 26, 12), 0.6, CV.wood, LAT(2.2)),
        ...[[l + 2, 8], [r - 2, 8], [l + 2, 58], [r - 2, 58], [l + 2, 33], [r - 2, 33]].map(([sx, sh2]) => stud(sx, sh2, 13.6)),
        DS(px, 33.4, 13.6, 1, 0.4, CV.brass, ST), RG(px, 31.6, 13.9, 1.6, 0.35, CV.brassL, { m: 'metal', a0: Math.PI, arc: Math.PI }),
      ] };
    }),
    inside: { x: 32, h: 33, w: 52, hh: 52, z: 12.2 },
  }),

  // a chest of drawers bound at its corners in brass, studded drawers with drop pulls; Sandile basks on a brass plinth on
  // top beside a tall brass ewer
  piece('crvdresser', 'Desert caravan studded dresser', 2, 1, 880, 'wood', [
    ...[[5, -10], [59, -10], [5, 10], [59, 10]].map(([x, z]) => LA(x, 0, z, [[2.4, 0], [2.8, 1.2], [2, 2.6], [2.6, 3.4]], CV.woodD, { m: 'wood', seg: 8 })),
    B(32, 18.4, 0, 60, 30, 26, CV.wood, WD),
    ...[3, 61].map(x => B(x, 18.4, 13.2, 3.4, 30, 0.6, CV.brass, MT)),
    ...[[18, 27.4], [46, 27.4], [18, 18.4], [46, 18.4], [18, 9.4], [46, 9.4]].flatMap(([x, h]) => [B(x, h, 13.3, 25, 7.6, 1, CV.woodL, WD),
      ...[[-10.6, -2.6], [10.6, -2.6], [-10.6, 2.6], [10.6, 2.6]].map(([dx, dh]) => stud(x + dx, h + dh, 13.9)),
      DS(x, h + 0.8, 13.9, 1.1, 0.4, CV.brass, ST), RG(x, h + 0.8, 14.2, 1.5, 0.35, CV.brassL, { m: 'metal', a0: Math.PI, arc: Math.PI })]),
    B(32, 34.6, 0, 62, 2.4, 28, CV.woodD, WD),
    B(17, 36.4, 0, 18, 1.2, 8, CV.brassD, MT),
    S(16, 39.4, 0, 6.6, 2.6, 3.2, CV.sandile, { m: 'cloth', seg: 12 }),
    ...[12.2, 15.2, 18.2].map(x => B(x, 39.4 + 2.6 * Math.sqrt(1 - ((x - 16) / 6.6) ** 2) - 0.3, 0, 1.3, 0.9, 3.6, CV.sandileD, PL)),
    S(23.6, 39.8, 0.6, 3.4, 2.4, 2.8, CV.sandile, { m: 'cloth', seg: 10 }), S(27.2, 39.2, 0.8, 2.2, 1.4, 2.2, CV.sandile, { m: 'cloth', seg: 8 }),
    DS(23.8, 40.6, 3.2, 2.6, 0.4, CV.sandileD, { m: 'plain', ry: 0.9, seg: 10 }),
    RD([9.6, 38.4, 0], [5.6, 37.6, 0.4], 1.1, CV.sandile, CL),
    S(12.4, 37.4, 2.4, 1.2, 0.8, 1.2, CV.sandile, { m: 'cloth', seg: 6 }), S(20, 37.4, 2.4, 1.2, 0.8, 1.2, CV.sandile, { m: 'cloth', seg: 6 }),
    LA(48, 35.8, -1, [[3, 0], [3.4, 0.6], [2.2, 1.6], [3.6, 4], [4, 6.6], [2.8, 9], [1.4, 10.2], [1.4, 12], [2.2, 13.4]], CV.brass, { m: 'metal', seg: 12 }),
    RD([51.4, 40, -1], [55, 46.4, -1], 0.55, CV.brass, MT), RG(44.2, 42.6, -1, 2.8, 0.5, CV.brass, { m: 'metal', a0: Math.PI / 2, arc: Math.PI }),
    S(48, 49.8, -1, 1, 1, 1, CV.brassL, { m: 'metal', seg: 6 }),
  ]),

  // a carved shelf under a pointed crown: a clay amphora and an indigo pot, teal, clay and copper pots, a rolled red rug
  // and a teal tagine
  piece('crvshelf', 'Desert caravan pot shelf', 1, 1, 520, 'wood', [
    ...[2.5, 29.5].map(x => B(x, 26, 0, 3, 52, 18, CV.wood, WD)),
    B(16, 26, -8.2, 24, 52, 1.6, CV.woodD, WD),
    ...[1, 19, 37].map(h => B(16, h, 0, 26, 2, 18, CV.wood, WD)),
    PR(16, 52, 0, [[-15, 0], [15, 0], [15, 3], [9, 6], [3, 9], [0, 11], [-3, 9], [-9, 6], [-15, 3]], 18, CV.woodD, WD), ...studRow(5, 27, 5, 54, 9.4),
    LA(10, 2, 1, [[2.2, 0], [4.6, 3], [5.6, 7], [4.8, 11], [2.4, 13.6], [2, 14.6], [2.8, 15.4]], CV.clay, { m: 'wood', seg: 12 }), C(10, 9, 1, 5.6, 1.2, CV.clayD, { m: 'plain', rb: 5.55, seg: 12 }),
    LA(22.6, 2, 2, [[2.2, 0], [4.2, 2], [4.6, 5], [3, 7.8], [3.4, 8.6]], CV.indigo, { m: 'gloss', seg: 12 }),
    LA(8, 20, 1, [[1.8, 0], [3.4, 2.6], [3.6, 5], [2, 7.4], [2.4, 8]], CV.teal, { m: 'gloss', seg: 10 }),
    LA(16, 20, 2, [[2, 0], [3.2, 1.4], [3.4, 3.4], [2.2, 5.4], [1.2, 6], [1.4, 10], [2.2, 10.6]], CV.clayL, { m: 'wood', seg: 10 }),
    LA(24, 20, 1, [[2.6, 0], [3.6, 1.2], [3.8, 4], [3, 5], [3.2, 5.4], [1.4, 7], [0.6, 8], [0, 8.4]], CV.copper, { m: 'metal', seg: 10 }),
    RD([6.6, 40.6, 2], [25.4, 40.6, 2], 2.6, CV.red, CL), RD([11, 40.6, 2], [11.2, 40.6, 2], 2.7, CV.saffron, PL), RD([21, 40.6, 2], [21.2, 40.6, 2], 2.7, CV.saffron, PL),
    C(16, 43.6, 1, 4.4, 0.8, CV.tealD, { m: 'gloss', seg: 12 }),
    LA(16, 44, 1, [[3.8, 0], [3.4, 1], [2.2, 3.4], [1, 5.8], [0.8, 6.4], [1.2, 7], [0, 7.4]], CV.teal, { m: 'gloss', seg: 12 }),
  ]),

  // a tall standing lantern of pierced brass, its glowing glass caged in brass ribs under a pierced dome
  piece('crvlantern', 'Desert caravan pierced lantern', 1, 1, 420, 'metal', (() => {
    const prof = [[3.2, 0], [8.6, 10], [9, 16], [8.2, 23], [3.8, 31.6]], parts = [
      LA(16, 0, 0, [[7, 0], [7.4, 1], [6, 2.4], [3.4, 3.6], [3, 5]], CV.brassD, { m: 'metal', seg: 14 }),
      LA(16, 5, 0, [[3.2, 0], [6.4, 3.4], [8.6, 10], [9, 16], [8.2, 23], [6, 28.4], [3.8, 31.6], [3.4, 32]], CV.glow, { m: 'glow', seg: 14, tex: 'lattice', tc: CV.brassD, ts: 2.6 }),
      C(16, 21, 0, 9.3, 1.6, CV.brass, { m: 'metal', seg: 14 }),
      LA(16, 37, 0, [[4.4, 0], [5, 0.8], [4.6, 2.4], [3, 4.8], [1.4, 7], [0.7, 8.4], [0.8, 9], [0, 9.6]], CV.brass, { m: 'metal', seg: 14, tex: 'pierce', tc: CV.brassD, ts: 1.6 }),
      RG(16, 48.4, 0, 1.8, 0.45, CV.brass, MT),
    ];
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * TAU + Math.PI / 6, c = Math.cos(a), s = Math.sin(a);
      for (let k = 0; k < prof.length - 1; k++) {
        const [r0, u0] = prof[k], [r1, u1] = prof[k + 1];
        parts.push(RD([16 + c * (r0 + 0.3), 5 + u0, s * (r0 + 0.3)], [16 + c * (r1 + 0.3), 5 + u1, s * (r1 + 0.3)], 0.45, CV.brass, MT));
      }
    }
    return parts;
  })(), { glow: [CV.glow] }),

  // a brass lamp stand on three legs, its arms hung with three lamps of ruby, amber and jade glass
  piece('crvlampstand', 'Desert caravan lamp stand', 1, 1, 680, 'metal', [
    ...[Math.PI / 2, Math.PI / 2 + TAU / 3, Math.PI / 2 - TAU / 3].flatMap(a => { const fx = 16 + Math.cos(a) * 11, fz = Math.sin(a) * 11; return [RD([16, 8, 0], [fx, 1.2, fz], 0.8, CV.brassD, MT), S(fx, 1.2, fz, 1.2, 1.2, 1.2, CV.brass, { m: 'metal', seg: 6 })]; }),
    S(16, 8.4, 0, 2, 1.6, 2, CV.brass, { m: 'metal', seg: 8 }),
    C(16, 36, 0, 0.9, 56, CV.brass, { m: 'metal', seg: 8 }), S(16, 30, 0, 1.6, 1.2, 1.6, CV.brassL, { m: 'metal', seg: 8 }),
    LA(16, 64, 0, [[1.6, 0], [2, 1.4], [1, 3.4], [0, 5]], CV.brass, { m: 'metal', seg: 8 }),
    RD([16, 61, 0], [4.6, 61, 0], 0.55, CV.brass, MT), RD([16, 61, 0], [27.4, 61, 0], 0.55, CV.brass, MT), RD([16, 55, 0], [16, 55, 8], 0.55, CV.brass, MT),
    ...lamp(4.6, 61, 0, CV.ruby), ...lamp(27.4, 61, 0, CV.jade), ...lamp(16, 55, 8, CV.amber),
  ], { glow: [CV.ruby, CV.jade, CV.amber] }),

  // a great sand clock: two carved discs bound in brass, three turned posts, the glass running saffron sand
  piece('crvclock', 'Desert caravan sand clock', 1, 1, 560, 'wood', [
    C(16, 1.8, 0, 11, 3.6, CV.wood, { m: 'wood', seg: 16 }), C(16, 1.8, 0, 11.3, 1.2, CV.brass, { m: 'metal', seg: 16 }),
    C(16, 49.6, 0, 11, 3.6, CV.wood, { m: 'wood', seg: 16 }), C(16, 49.6, 0, 11.3, 1.2, CV.brass, { m: 'metal', seg: 16 }),
    S(16, 52.2, 0, 1.6, 1.4, 1.6, CV.brass, { m: 'metal', seg: 8 }),
    LA(16, 3.6, 0, [[5.8, 0], [6.2, 2.6], [5, 5], [2.6, 7.4], [0, 8.4]], CV.sand, { m: 'plain', seg: 12 }),
    LA(16, 34.4, 0, [[0.4, 0], [2.4, 1.2], [4.8, 3.2], [5.8, 6.4], [5.8, 8]], CV.sand, { m: 'plain', seg: 12 }),
    RD([16, 34.4, 0], [16, 12, 0], 0.15, CV.sand, PL),
    LA(16, 3.6, 0, [[5, 0], [6.6, 3], [7, 8], [5.8, 14], [2.4, 19], [0.8, 22]], CV.glass, { m: 'glass', seg: 14 }),
    LA(16, 25.6, 0, [[0.8, 0], [2.4, 3], [5.8, 8], [7, 14], [6.6, 19], [5, 22.2]], CV.glass, { m: 'glass', seg: 14 }),
    ...[-Math.PI / 2, Math.PI / 6, Math.PI * 5 / 6].flatMap(a => { const px = 16 + Math.cos(a) * 9, pz = Math.sin(a) * 9; return [C(px, 25.7, pz, 1, 44.2, CV.woodL, { m: 'wood', seg: 8 }), S(px, 25.6, pz, 1.6, 2.4, 1.6, CV.brass, { m: 'metal', seg: 8 })]; }),
  ]),

  // a three-panel mashrabiya screen: pointed carved panels of fine lattice, brass hinges and finials
  piece('crvscreen', 'Desert caravan lattice screen', 2, 1, 760, 'wood', [
    ...[11, 32, 53].flatMap(x => [
      B(x, 1.2, 0, 20, 2.4, 7, CV.woodD, WD), B(x, 26, 0, 20, 48, 2.4, CV.wood, WD), PR(x, 50, 0, arch(20, 2, 10), 2.4, CV.wood, WD),
      B(x, 26, 1.4, 15, 42, 0.6, CV.woodL, LAT(2.2)), PR(x, 47, 1.4, arch(15, 1, 7.4), 0.6, CV.woodL, LAT(2.2)),
      S(x, 63, 0, 1.2, 1.4, 1.2, CV.brass, { m: 'metal', seg: 8 }),
    ]),
    ...[21.5, 42.5].flatMap(hx => [12, 40].map(h => B(hx, h, 0.6, 1.4, 3, 2.8, CV.brass, MT))),
  ]),

  // an arched mirror in a pierced brass frame, brass studs about it and a crescent at its point
  wallPiece('crvmirror', 'Desert caravan arched mirror', 1, 580, 'metal', [
    PR(16, 36, 0.8, arch(22, 24, 16), 1.6, CV.brass, { m: 'metal', tex: 'pierce', tc: CV.brassD, ts: 1.6 }),
    PR(16, 39, 1.8, arch(16, 20, 12), 0.4, CV.mirror, GL),
    ...[[6.5, 38], [25.5, 38], [6.5, 48], [25.5, 48], [6.5, 58], [25.5, 58], [16, 73.4]].map(([x, h]) => stud(x, h, 1.9)),
    RD([16, 76, 0.8], [16, 78.6, 0.8], 0.4, CV.brass, MT),
    RG(16, 80.6, 0.8, 2, 0.5, CV.brass, { m: 'metal', a0: -0.9, arc: 4.4 }),
  ]),

  // a woven kilim: a red field, indigo borders with saffron zigzags, three hooked lozenges and fringed ends
  { id: 'crvrug', name: 'Desert caravan kilim rug', group: GROUP, solo: true, w: 3, h: 2, layer: 'rug', price: 780, high: 0.03, side: 'c', flat() {
    const g = ctx();
    g.fillStyle = CV.cream;
    for (let y = 2; y < 62; y += 1.6) { g.fillRect(0.4, y, 4, 0.7); g.fillRect(91.6, y, 4, 0.7); }
    g.fillStyle = CV.red; g.fillRect(4, 1, 88, 62);
    g.fillStyle = CV.indigo; g.fillRect(4, 1, 88, 8); g.fillRect(4, 55, 88, 8); g.fillRect(4, 1, 8, 62); g.fillRect(84, 1, 8, 62);
    g.strokeStyle = CV.saffron; g.lineWidth = 1.2; g.lineJoin = 'miter';
    const zig = (pts) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); };
    for (const y of [5, 59]) zig(Array.from({ length: 23 }, (_, i) => [8 + i * 3.6, y + (i % 2 ? -1.6 : 1.6)]));
    for (const x of [8, 88]) zig(Array.from({ length: 15 }, (_, i) => [x + (i % 2 ? -1.6 : 1.6), 7 + i * 3.6]));
    g.fillStyle = CV.cream; g.fillRect(12, 9, 72, 1); g.fillRect(12, 54, 72, 1); g.fillRect(12, 9, 1, 46); g.fillRect(83, 9, 1, 46);
    for (const [cx, c, k] of [[30, CV.teal, CV.saffron], [48, CV.saffron, CV.indigo], [66, CV.teal, CV.saffron]]) {
      diamond(g, cx, 32, 10, 17, CV.cream); diamond(g, cx, 32, 8.4, 14.6, c); diamond(g, cx, 32, 5, 9, k); diamond(g, cx, 32, 2, 3.6, CV.red);
      g.fillStyle = c;
      for (const [dx, dy] of [[-10, 0], [10, 0], [0, -17], [0, 17]]) { g.fillRect(cx + dx - 1.2 + (dx > 0 ? 1.2 : dx < 0 ? -1.2 : 0), 32 + dy - 1.2 + (dy > 0 ? 1.2 : dy < 0 ? -1.2 : 0), 2.4, 2.4); }
    }
    for (let x = 16; x < 82; x += 6) for (const y of [14, 50]) if (Math.abs(x - 48) > 3) diamond(g, x, y, 1.4, 1.4, CV.saffronL);
    for (const x of [16, 80]) for (let y = 20; y < 46; y += 6) diamond(g, x, y, 1.2, 1.6, CV.cream);
    for (let x = 4; x < 92; x += 2) for (let y = 1; y < 63; y += 2) if (hash(x, y, 13) < 0.12) { g.fillStyle = hash(x, y, 14) < 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'; g.fillRect(x, y, 1.6, 0.6); }
  } },

  // a woven tapestry on a brass rod: Sigilyph in an indigo field, a saffron border, tassels along its foot
  wallPiece('crvtapestry', 'Desert caravan Sigilyph tapestry', 2, 560, 'cloth', [
    RD([2.6, 76, 2.2], [61.4, 76, 2.2], 0.8, CV.brass, MT), S(2, 76, 2.2, 1.3, 1.3, 1.3, CV.brass, { m: 'metal', seg: 8 }), S(62, 76, 2.2, 1.3, 1.3, 1.3, CV.brass, { m: 'metal', seg: 8 }),
    ...[10, 21, 32, 43, 54].map(x => B(x, 75.4, 1.6, 3, 4, 1, CV.indigoD, CL)),
    B(32, 51, 0.8, 52, 46, 0.8, CV.indigo, CL),
    PC(32, 51, 1.25, 52, 46, sigilyph),
    ...[9, 16.5, 24, 31.5, 39, 46.5, 54].flatMap(x => tassel(x, 28.2, 1.4)),
  ]),

  // three hammered plates, brass, copper and brass, chased with rings and petals, stood on a carved wall rail
  wallPiece('crvplates', 'Desert caravan brass plates', 2, 440, 'metal', [
    B(32, 40, 2.6, 60, 2, 5.2, CV.woodD, WD), B(32, 42.2, 5, 60, 2.4, 0.6, CV.wood, WD),
    ...[8, 56].map(x => B(x, 35, 1.2, 2, 8, 2.4, CV.woodD, WD)),
    DS(14, 49.6, 2.2, 8.4, 0.8, CV.brass, { m: 'metal', seg: 18, tex: 'engrave', tc: CV.brassD }), RG(14, 49.6, 2.7, 8, 0.45, CV.brassL, MT),
    DS(32, 52.4, 1.8, 11, 0.8, CV.copper, { m: 'metal', seg: 20, tex: 'engrave', tc: CV.copperD }), RG(32, 52.4, 2.3, 10.6, 0.45, CV.clayL, MT),
    DS(50, 49.6, 2.2, 8.4, 0.8, CV.brass, { m: 'metal', seg: 18, tex: 'engrave', tc: CV.brassD }), RG(50, 49.6, 2.7, 8, 0.45, CV.brassL, MT),
  ]),

  // striped tent cloth hung on the wall: a red valance with tassels, saffron and red panels tied back with indigo
  wallPiece('crvdrape', 'Desert caravan tent drape', 2, 480, 'cloth', [
    B(32, 52, 0.4, 44, 62, 0.4, CV.cream, { m: 'cloth', tex: 'stripe', tc: CV.teal, ts: 2.6 }),
    B(32, 82, 1.6, 64, 7, 1.2, CV.red, CL), B(32, 79.4, 2.3, 64, 1.2, 0.3, CV.saffron, CL),
    ...[6, 14, 22, 30, 38, 46, 54, 62].map(x => tassel(Math.min(x, 60), 78.4, 2.4)).flat(),
    ...[7, 57].flatMap(x => [
      C(x, 64, 1.6, 6.4, 28, CV.saffron, { m: 'cloth', rb: 2.6, seg: 10, sz: 0.25, tex: 'stripe', tc: CV.red, ts: 1.6 }),
      C(x, 49, 1.8, 2.8, 2, CV.indigo, { m: 'plain', seg: 10, sz: 0.4 }),
      C(x, 34.5, 1.6, 2.6, 27, CV.saffron, { m: 'cloth', rb: 6, seg: 10, sz: 0.25, tex: 'stripe', tc: CV.red, ts: 1.6 }),
      ...tassel(x, 48.4, 3.2, CV.indigoL),
    ]),
  ]),

  // mint tea on a carved octagonal stand: a brass tray, a silver teapot with a long spout and four gilded glasses
  piece('crvteaset', 'Desert caravan tea stand', 1, 1, 460, 'wood', [
    C(16, 8.6, 0, 9.4, 17.2, CV.wood, { m: 'wood', seg: 8, rb: 10, tex: 'lattice', tc: CV.woodD, ts: 2.4 }),
    C(16, 16.2, 0, 9.8, 1.4, CV.brassD, { m: 'metal', seg: 8 }),
    C(16, 17.8, 0, 12.4, 1.2, CV.brass, { m: 'metal', seg: 18 }), RG(16, 18.5, 0, 12.2, 0.5, CV.brassL, { m: 'metal', flat: true }),
    LA(16, 18.4, -1, [[2.6, 0], [3.2, 0.6], [2.6, 1.2], [4.6, 3.6], [5, 6], [4, 8.4], [2.4, 9.4], [2.2, 10.6], [3, 11.2], [2, 12.6], [1.2, 14.4], [0.4, 15.6], [0, 16]], CV.silver, { m: 'metal', seg: 12 }),
    RD([20.2, 22, -1], [25.4, 28.4, -1], 0.6, CV.silver, MT), RG(11.4, 25, -1, 3, 0.55, CV.silver, { m: 'metal', a0: Math.PI / 2, arc: Math.PI }),
    ...[[7, 4, CV.teal], [25, 4.6, CV.red], [9, -7, CV.saffronD], [23, -7, CV.tealD]].flatMap(([x, z, c]) => [C(x, 20.6, z, 1.3, 3.2, c, { m: 'gloss', rb: 0.95, seg: 8 }), C(x, 22.3, z, 1.35, 0.4, CV.brassL, { m: 'plain', seg: 8 })]),
  ]),

  // a spice merchant's stall under a striped awning: burlap sacks heaped with paprika, turmeric, sumac and herbs, jars on
  // the back tier and a string of dried chillies
  piece('crvspice', 'Desert caravan spice stall', 2, 1, 1100, 'wood', [
    ...[2.4, 61.6].flatMap(x => [B(x, 27, -12, 3, 54, 3, CV.woodD, WD), B(x, 26.5, 12, 2.4, 53, 2.4, CV.woodD, WD)]),
    B(32, 54.6, 0, 64, 1.4, 28, CV.red, { m: 'cloth', tex: 'stripe', tc: CV.cream, ts: 3.2 }),
    B(32, 50.6, 13.4, 64, 6, 0.8, CV.red, { m: 'cloth', tex: 'stripe', tc: CV.cream, ts: 3.2 }),
    ...[5, 13, 21, 29, 37, 45, 53, 59].flatMap(x => tassel(x, 47.6, 13.8)),
    B(32, 16, -8, 58, 32, 10, CV.wood, WD),
    B(32, 5.6, 4, 58, 11.2, 16, CV.woodL, WD), B(32, 5.6, 12.2, 54, 8, 0.4, CV.wood, LAT(2.2)),
    ...[[9, CV.paprika], [24.4, CV.turmeric], [39.6, CV.sumac], [55, CV.herb]].flatMap(([x, c]) => [
      LA(x, 11.2, 4, [[5, 0], [6, 2], [6.2, 6], [5.6, 8.4], [6.2, 9.4]], CV.burlap, { m: 'cloth', seg: 12 }),
      RG(x, 20.6, 4, 6, 0.9, CV.burlapD, { m: 'cloth', flat: true }),
      LA(x, 19.8, 4, [[5.6, 0], [4.2, 1.6], [2, 3.2], [0, 3.8]], c, { m: 'plain', seg: 12 }),
    ]),
    RD([24.4, 23, 4], [28, 27, 6], 0.5, CV.brass, MT),
    LA(10, 32, -8, [[2.4, 0], [3.8, 2], [4, 5], [2.6, 7.4], [3, 8]], CV.clay, { m: 'wood', seg: 10 }),
    C(22, 36, -8, 2.7, 7, CV.cinnamon, { m: 'plain', seg: 10 }), C(22, 36.4, -8, 3, 8.8, CV.glass, { m: 'glass', seg: 10 }), C(22, 41.2, -8, 3.1, 0.8, CV.brass, { m: 'metal', seg: 10 }),
    LA(34, 32, -8, [[3, 0], [3.8, 1.2], [4, 4], [3, 5], [3.2, 5.4], [1.4, 7], [0, 7.6]], CV.copper, { m: 'metal', seg: 10 }),
    LA(46, 32, -8, [[2, 0], [3.6, 2.4], [3.8, 5], [2, 7], [2.4, 7.6]], CV.teal, { m: 'gloss', seg: 10 }),
    RD([56, 53.4, 10], [56, 35, 10], 0.3, CV.burlapD, CL),
    ...[0, 1, 2, 3, 4, 5].map(i => S(56 + (i % 2 ? 0.8 : -0.8), 50.6 - i * 2.8, 10, 1.1, 1.6, 1.1, CV.paprika, { m: 'gloss', seg: 6 })),
  ]),

  // a trader's chest of camel leather on a plinth: a stepped domed lid, brass straps and studs, a hasp, and Trapinch
  // carved in a wooden medallion on its front
  piece('crvchest', "Desert caravan trader's chest", 2, 1, 960, 'gloss', [
    B(32, 1.4, 0, 58, 2.8, 26, CV.woodD, WD),
    B(32, 11.6, 0, 56, 17.6, 24, CV.leather, GL),
    B(32, 22.2, 0, 56, 3.6, 24, CV.leather, { m: 'gloss', r: 1.6 }), B(32, 25.4, 0, 56, 3.2, 19, CV.leatherL, { m: 'gloss', r: 1.6 }), B(32, 27.8, 0, 56, 2, 11, CV.leatherL, GL),
    B(32, 20.6, 12.2, 57, 1.2, 0.6, CV.brass, MT),
    ...[10, 54].flatMap(x => [B(x, 11.6, 12.2, 3.2, 17.6, 0.6, CV.brass, MT), B(x, 22.2, 12.2, 3.2, 3.6, 0.6, CV.brass, MT), B(x, 25.4, 9.7, 3.2, 3.2, 0.6, CV.brass, MT), B(x, 27.8, 5.7, 3.2, 2, 0.6, CV.brass, MT), B(x, 28.9, 0, 3.2, 0.4, 11.4, CV.brass, MT)]),
    ...studRow(16, 48, 5, 18.4, 12.3), ...studRow(16, 48, 5, 4.8, 12.3),
    B(32, 19.6, 12.6, 5.6, 6, 0.8, CV.brass, MT), DS(32, 19, 13.1, 0.8, 0.3, CV.ink, { m: 'plain', seg: 6 }),
    DS(32, 10.2, 12.3, 5.4, 0.6, CV.woodD, { m: 'wood', seg: 16 }), PC(32, 10.2, 12.7, 7.6, 7.6, trapinch),
  ]),

  // a bench made of a camel saddle: carved legs, a leather saddle with an indigo cushion, a tall pommel crowned with a
  // brass Agadez cross, and a red kilim saddle cloth hung with tassels
  piece('crvsaddle', 'Desert caravan saddle bench', 2, 1, 820, 'wood', [
    ...[9, 55].flatMap(x => [-8, 8].map(z => B(x, 4.6, z, 3.6, 9.2, 3.6, CV.woodD, WD))),
    B(32, 10.4, 0, 52, 2.4, 22, CV.wood, WD),
    B(32, 15.4, 0, 40, 7.6, 20, CV.leather, { m: 'gloss', r: 3 }),
    B(32, 20.4, 0, 36, 2.6, 18, CV.indigo, { ...KIL(CV.saffron, 1.3), r: 1.2 }),
    B(8, 22, 0, 4, 21.6, 4, CV.woodD, WD), DS(8, 34.4, 0, 2.6, 1.6, CV.brass, { m: 'metal', seg: 12 }),
    B(56, 23, 0, 4, 23.6, 4, CV.woodD, WD),
    PR(56, 34.4, 0, [[-1.4, 0], [1.4, 0], [1.4, 2.6], [4.4, 3.4], [4.8, 5.2], [1.4, 5.2], [1.4, 7.4], [2.4, 8.6], [0, 10.4], [-2.4, 8.6], [-1.4, 7.4], [-1.4, 5.2], [-4.8, 5.2], [-4.4, 3.4], [-1.4, 2.6]], 2, CV.brass, MT),
    stud(8, 27, 2.2), stud(56, 28, 2.2), stud(8, 18, 2.2), stud(56, 18, 2.2),
    B(32, 12, 10.8, 40, 12, 0.8, CV.red, KIL(CV.saffron, 2.4)),
    ...[14, 20, 26, 32, 38, 44, 50].flatMap(x => tassel(x, 6.2, 11.4)),
  ]),

  // a spice merchant's balance of brass: a turned post on a carved base, a beam with two pans of paprika and turmeric on
  // their chains, and its weights
  piece('crvscale', 'Desert caravan spice scale', 1, 1, 540, 'metal', [
    B(16, 3, 0, 26, 6, 14, CV.wood, WD), B(16, 3, 7.2, 22, 4, 0.4, CV.woodL, LAT(1.6)),
    LA(16, 6, 0, [[3.4, 0], [2.6, 1.4], [1.4, 2.4], [1.2, 3]], CV.brass, { m: 'metal', seg: 10 }),
    C(16, 24, 0, 1.1, 36, CV.brass, { m: 'metal', seg: 8 }),
    S(16, 42.6, 0, 1.8, 1.4, 1.8, CV.brass, { m: 'metal', seg: 8 }), LA(16, 43.6, 0, [[1, 0], [1.4, 1.4], [0.6, 3.4], [0, 4.4]], CV.brassL, { m: 'metal', seg: 8 }),
    RD([5, 40.6, 0], [27, 40.6, 0], 0.7, CV.brass, MT), S(4.6, 40.6, 0, 1, 1, 1, CV.brass, { m: 'metal', seg: 6 }), S(27.4, 40.6, 0, 1, 1, 1, CV.brass, { m: 'metal', seg: 6 }),
    ...[[7, CV.paprika], [25, CV.turmeric]].flatMap(([x, c]) => [
      RD([x, 40, 0], [x - 5.2, 22, 0], 0.25, CV.brassD, MT), RD([x, 40, 0], [x + 5.2, 22, 0], 0.25, CV.brassD, MT), RD([x, 40, 0], [x, 22, -5], 0.25, CV.brassD, MT),
      LA(x, 19, 0, [[0.6, 0], [3, 0.6], [5, 1.8], [5.8, 3.2]], CV.brass, { m: 'metal', seg: 14 }),
      LA(x, 21, 0, [[4.4, 0], [3, 1.4], [1.2, 2.6], [0, 3]], c, { m: 'plain', seg: 10 }),
    ]),
    C(24.4, 7.4, 3, 1.4, 2.8, CV.brassD, { m: 'metal', seg: 8 }), C(27.4, 6.9, 3.6, 1, 1.8, CV.brassD, { m: 'metal', seg: 8 }),
  ]),

  // Hippopotas for a pouf: its round sandy body with dark patches, a big pale snout, little ears and feet, and a red
  // kilim saddle cushion on its back
  piece('crvhippo', 'Desert caravan Hippopotas pouf', 1, 1, 380, 'cloth', [
    ...[[9, -6], [23, -6], [9, 6], [23, 6]].map(([x, z]) => S(x, 2, z, 3, 2, 3, CV.hippo, { m: 'cloth', seg: 8 })),
    LA(16, 2, 0, [[9, 0], [11.4, 1.8], [12.4, 5.4], [12.2, 9.6], [10.6, 12.6], [7, 14.2], [0, 14.8]], CV.hippo, { m: 'cloth', seg: 16 }),
    DS(7.4, 7.6, 8.7, 2.2, 0.8, CV.hippoD, { m: 'plain', ry: 1.8, seg: 10 }), DS(25, 10.4, 8.2, 1.8, 0.8, CV.hippoD, { m: 'plain', ry: 1.5, seg: 10 }),
    S(16, 8.6, 10.6, 7.4, 4.6, 3.6, CV.hippoL, { m: 'cloth', seg: 12 }),
    DS(13.2, 10.2, 13.6, 0.9, 0.5, CV.ink, { m: 'plain', seg: 8 }), DS(18.8, 10.2, 13.6, 0.9, 0.5, CV.ink, { m: 'plain', seg: 8 }),
    DS(11.6, 14.2, 9.4, 1, 0.5, CV.ink, { m: 'gloss', ry: 1.2, seg: 8 }), DS(20.4, 14.2, 9.4, 1, 0.5, CV.ink, { m: 'gloss', ry: 1.2, seg: 8 }),
    S(9.6, 16.4, 2, 1.8, 1.3, 1.4, CV.hippoD, { m: 'cloth', seg: 8 }), S(22.4, 16.4, 2, 1.8, 1.3, 1.4, CV.hippoD, { m: 'cloth', seg: 8 }),
    B(16, 17.4, -1, 15, 2, 13, CV.red, { ...KIL(CV.saffron, 1), r: 1 }), ...tassel(9, 17, 5.4), ...tassel(23, 17, 5.4),
  ]),

  // Cacnea grown in a teal glazed pot banded in kilim: its round green body with dark diamonds, a crown of spikes and
  // its spiky little arms
  piece('crvcacnea', 'Desert caravan Cacnea pot', 1, 1, 300, 'cloth', [
    LA(16, 0, 0, [[5.6, 0], [6.4, 1], [8.4, 8], [9, 13], [9.6, 14], [9, 15]], CV.teal, { m: 'gloss', seg: 14 }),
    C(16, 9.6, 0, 8.8, 2.4, CV.saffron, { m: 'plain', seg: 14, rb: 8.5, tex: 'kilim', tc: CV.red, ts: 1.2 }),
    C(16, 14.6, 0, 8.8, 0.6, CV.soil, { m: 'plain', seg: 14 }),
    S(16, 21.6, 0, 7, 7, 7, CV.cac, { m: 'cloth', seg: 14 }),
    DS(11.6, 18.2, 4.3, 1.1, 0.5, CV.cacD, { m: 'plain', ry: 1.6, seg: 4 }), DS(20.4, 18.2, 4.3, 1.1, 0.5, CV.cacD, { m: 'plain', ry: 1.6, seg: 4 }), DS(16, 17, 5.3, 1.1, 0.5, CV.cacD, { m: 'plain', ry: 1.6, seg: 4 }),
    DS(13.4, 23.4, 6.2, 1.2, 0.5, CV.ink, { m: 'gloss', ry: 1.6, seg: 4 }), DS(18.6, 23.4, 6.2, 1.2, 0.5, CV.ink, { m: 'gloss', ry: 1.6, seg: 4 }),
    DS(16, 20.4, 6.8, 1, 0.4, CV.cacD, { m: 'plain', ry: 0.5, seg: 8 }),
    LA(16, 27.6, 0, [[2.2, 0], [1.4, 2.6], [0, 5.4]], CV.cacL, { m: 'cloth', seg: 6 }),
    LA(12, 26.4, 0, [[1.8, 0], [1, 2], [0, 4]], CV.cacL, { m: 'cloth', seg: 6 }), LA(20, 26.4, 0, [[1.8, 0], [1, 2], [0, 4]], CV.cacL, { m: 'cloth', seg: 6 }),
    RD([10, 20.6, 0], [5, 23.4, 0], 1, CV.cac, CL), RD([22, 20.6, 0], [27, 23.4, 0], 1, CV.cac, CL),
    S(4.4, 24, 0, 2.4, 2.4, 2.4, CV.cacD, { m: 'cloth', seg: 10 }), S(27.6, 24, 0, 2.4, 2.4, 2.4, CV.cacD, { m: 'cloth', seg: 10 }),
  ]),
];
