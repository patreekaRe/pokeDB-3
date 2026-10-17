/* base-furniture-ranch.js  -  the Ranch set (furniture expansion session g, 2026-10-17): Animal Crossing's Ranch series,
   the sun-bleached Wild West. Weathered pale barn planks and red barn paint with white trim, saddle-brown leather, wrought
   iron horseshoes (hung open end up, for luck) and drawer pulls, rope and lassos, wagon wheels, hay, cowhide and
   Navajo-style stripes (red, cream, black, turquoise, mustard), tin and brass. Tauros horns, a Miltank milk can, a Mudbray
   at the hitching post and Meowth on the WANTED poster for the Pokémon touches. All solo, fixed colours, sold all year.
   An upright piece is a list of parts in painted units (32 a tile), as in js/base-furniture-acorn.js: `x` across from the
   left of its front, `h` up from the floor (a wall piece's from the foot of its strip), `z` out to the front from its
   middle (a wall piece's from the wall). They're painted here from any side, and js/base-models-ranch.js builds the same
   list as 3D parts (BUILT), so picture and model agree. `tex` is painted only (the model stays plain colour): `plank` a
   board's seams and weathered grain (`pd: 'h'` for boards laid across), `straw` a bale's, `ribs` a cactus's. A `pic` part
   (the clock's dial, the poster, the milk can's Miltank) is painted on the front only, and the model wears that crop of
   the painting. The barn wardrobe's doors swing (`doors`, `inside`). The rug is a cowhide, painted from above (RUG). */

import { sh, oval, ovalShade, floorShadow, ctx, hash, glass as glassPane } from './base-paint.js';

export const RC = {
  wood: '#bcae96', woodL: '#d6cab2', woodD: '#8e7e66', red: '#a8382c', redD: '#7a2820', redL: '#c2503e', white: '#eee6d4',
  leather: '#8a4a24', leatherL: '#a8622f', leatherD: '#5c3016', iron: '#4c4846', ironL: '#6c6662', tin: '#aab1b5', tinL: '#ccd3d6',
  tinD: '#7e868a', brass: '#c9a046', rope: '#c8a86a', ropeD: '#9a7c46', hay: '#dfbf5e', hayL: '#f0d888', hayD: '#b29038',
  hide: '#f0e8d8', spot: '#4a3020', nRed: '#b8402e', nCream: '#efe2c4', nBlack: '#2e2622', turq: '#3e9a96', mustard: '#d6a23a',
  cactus: '#5f8e4a', cactusD: '#44703a', cactusL: '#82ae5e', clay: '#c06a3e', soil: '#5a4030', bloom: '#f07aa0',
  water: '#6aa4c8', glow: '#ffd890', paper: '#e6d2a2', ink: '#2c241c', cream: '#f2e6c8', mirror: '#cfe1ea', enamel: '#2f5f8a',
  enamelW: '#eef0ec', felt: '#a8845a', milk: '#f6f4ee', peach: '#e89a50', honey: '#d89a3a',
  horn: '#dcd0b4', hornD: '#8e8270', pink: '#f0a0b0', pinkL: '#f8c4cc',
  mb: '#a2683c', mbD: '#3a2a20', mbSnout: '#d8b08a', mane: '#2e2420',
};
const GROUP = 'Ranch';
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

const CL = { m: 'cloth' }, PL = { m: 'plain' }, GL = { m: 'gloss' }, WD = { m: 'wood' }, MT = { m: 'metal' }, LE = { m: 'gloss' };
const PLK = { m: 'wood', tex: 'plank', ts: 6.4 }, PLKH = { m: 'wood', tex: 'plank', pd: 'h', ts: 6.4 };
const NAVAJO = [RC.nBlack, RC.nCream, RC.turq, RC.mustard, RC.nCream, RC.nBlack];

/** A horseshoe of iron, r round its arch and tr thick, open at the top (`up`, for luck) or the bottom, with its nails. */
function horseshoe(x, h, z, r, tr, up = true, o = {}) {
  const gap = 0.62, base = up ? Math.PI / 2 : -Math.PI / 2, parts = [RG(x, h, z, r, tr, o.c ?? RC.iron, { m: 'metal', a0: base + gap, arc: TAU - 2 * gap })];
  if (o.nails !== false) for (const a of [1.35, 2.05, 2.7]) for (const s of [-1, 1]) {
    const t = base + s * a;
    parts.push(DS(x + Math.cos(t) * r, h + Math.sin(t) * r, z + tr * 0.75, Math.max(0.28, tr * 0.32), 0.4, RC.tinL, { m: 'metal', seg: 6 }));
  }
  return parts;
}
/** Stripes laid across a blanket's front face at z: [h, colour] each, w wide, hh tall. */
const bands = (x, z, w, list, hh = 1.4) => list.map(([h, c]) => B(x, h, z, w, hh, 0.4, c, CL));
/** A wagon wheel standing in the front plane: an iron tyre, a wooden felloe, n spokes, a hub with an iron cap. */
function wheel(x, h, z, R, n = 12) {
  const parts = [RG(x, h, z, R, 1.3, RC.iron, MT), RG(x, h, z, R - 2.5, 1.4, RC.wood, WD)];
  for (let i = 0; i < n; i++) { const a = i / n * TAU + 0.13, c = Math.cos(a), s = Math.sin(a); parts.push(RD([x + c * 3.6, h + s * 3.6, z], [x + c * (R - 3.4), h + s * (R - 3.4), z], 0.9, RC.woodL, WD)); }
  parts.push(DS(x, h, z, 4, 5, RC.woodD, WD), DS(x, h, z + 2.7, 2.2, 0.8, RC.iron, { m: 'metal', seg: 10 }));
  return parts;
}
/** A five-pointed star's outline about its middle (the sheriff's star). */
const star = (R, r) => Array.from({ length: 10 }, (_, i) => { const a = Math.PI / 2 + i * Math.PI / 5, k = i % 2 ? r : R; return [Math.cos(a) * k, Math.sin(a) * k]; });

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
  const g = ctx(), [x0, y0, x1, y1] = bb, c = q.c, seed = Math.round(q.x * 7 + q.h * 13 + q.z * 3);
  g.save(); g.clip(path);
  if (q.tex === 'plank') {
    const s = q.ts || 6, across = q.pd === 'h', len0 = across ? x0 : y0, len1 = across ? x1 : y1, w0 = across ? y0 : x0, w1 = across ? y1 : x1;
    const line = (a, b0, a1, b1) => (across ? (g.moveTo(b0, a), g.lineTo(b1, a1)) : (g.moveTo(a, b0), g.lineTo(a1, b1)));
    g.globalAlpha = 0.28; g.strokeStyle = sh(c, 2); g.lineWidth = 0.3; g.beginPath();
    for (let w = w0 + 0.9, i = 0; w < w1; w += 1.3, i++) {
      const a = len0 + hash(i, seed, 1) * (len1 - len0) * 0.6, l = (len1 - len0) * (0.25 + hash(i, seed, 2) * 0.5);
      line(w, a, w, a + l);
    }
    g.stroke();
    g.globalAlpha = 0.55; g.strokeStyle = sh(c, -2); g.lineWidth = 0.45; g.beginPath();
    for (let w = w0 + s; w < w1 - 0.6; w += s) line(w, len0, w, len1);
    g.stroke();
    g.globalAlpha = 0.45; g.fillStyle = sh(c, -2);
    for (let i = 0; i < Math.round((w1 - w0) / s); i++) if (hash(i, seed, 4) < 0.45) {
      const w = w0 + (i + 0.5) * s, a = len0 + (0.2 + hash(i, seed, 5) * 0.6) * (len1 - len0);
      g.beginPath(); across ? g.ellipse(a, w, 0.9, 0.5, 0, 0, TAU) : g.ellipse(w, a, 0.5, 0.9, 0, 0, TAU); g.fill();
    }
  } else if (q.tex === 'straw') {
    const n = Math.round((x1 - x0) * (y1 - y0) / 2.4);
    g.lineWidth = 0.35; g.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const px = x0 + hash(i, seed, 1) * (x1 - x0), py = y0 + hash(i, seed, 2) * (y1 - y0), a = (hash(i, seed, 3) - 0.5) * 0.9, l = 1.6 + hash(i, seed, 4) * 2.4, v = hash(i, seed, 5);
      g.globalAlpha = 0.75; g.strokeStyle = v < 0.5 ? sh(c, 1) : v < 0.85 ? sh(c, -1) : sh(c, -2);
      g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); g.stroke();
    }
  } else if (q.tex === 'ribs') {
    const s = q.ts || 1.8;
    g.lineWidth = 0.4;
    for (let x = x0 + s / 2, i = 0; x < x1; x += s, i++) {
      g.globalAlpha = 0.5; g.strokeStyle = sh(c, -2); g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y1); g.stroke();
      g.globalAlpha = 0.35; g.strokeStyle = sh(c, 2); g.beginPath(); g.moveTo(x + s * 0.4, y0); g.lineTo(x + s * 0.4, y1); g.stroke();
      g.globalAlpha = 0.9; g.fillStyle = RC.cream;
      for (let y = y0 + 1.4 + hash(i, seed) * 2; y < y1; y += 3.2) g.fillRect(x - 0.15, y, 0.3, 0.3);
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

/** The horseshoe clock's dial: cream, brown marks at the hours, a little brass star at twelve, hands at ten past ten. */
function dial(g, x, y, w, h) {
  const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2;
  g.fillStyle = RC.cream; g.beginPath(); g.arc(cx, cy, r * 0.98, 0, TAU); g.fill();
  g.strokeStyle = RC.woodD; g.lineWidth = r * 0.06; g.beginPath(); g.arc(cx, cy, r * 0.86, 0, TAU); g.stroke();
  g.fillStyle = RC.leatherD;
  for (let i = 1; i < 12; i++) {
    if (i === 12) continue;
    const a = i / 12 * TAU - Math.PI / 2, big = i % 3 === 0, rr = r * 0.7;
    g.save(); g.translate(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); g.rotate(a + Math.PI / 2); g.fillRect(-r * (big ? 0.05 : 0.025), -r * (big ? 0.11 : 0.06), r * (big ? 0.1 : 0.05), r * (big ? 0.22 : 0.12)); g.restore();
  }
  g.fillStyle = RC.brass; g.beginPath(); star(r * 0.17, r * 0.07).forEach(([sx, sy], i) => (i ? g.lineTo(cx + sx, cy - r * 0.62 - sy) : g.moveTo(cx + sx, cy - r * 0.62 - sy))); g.closePath(); g.fill();
  g.strokeStyle = RC.ink; g.lineCap = 'round';
  for (const [a, len, lw] of [[-150, 0.42, 0.09], [-30, 0.6, 0.055]]) { const t = a * Math.PI / 180; g.lineWidth = r * lw; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(t) * r * len, cy + Math.sin(t) * r * len); g.stroke(); }
  g.fillStyle = RC.brass; g.beginPath(); g.arc(cx, cy, r * 0.09, 0, TAU); g.fill();
}

/** The WANTED poster: foxed paper, the big word, Meowth in a red bandana in an ink-ruled frame, the reward. */
function poster(g, x, y, w, h) {
  const cx = x + w / 2;
  const bg = g.createRadialGradient(cx, y + h * 0.45, w * 0.2, cx, y + h * 0.5, h * 0.75);
  bg.addColorStop(0, sh(RC.paper, 1)); bg.addColorStop(0.7, RC.paper); bg.addColorStop(1, sh(RC.paper, -2));
  g.fillStyle = bg; g.fillRect(x, y, w, h);
  for (let i = 0; i < 26; i++) { g.globalAlpha = 0.18; g.fillStyle = RC.woodD; g.beginPath(); g.arc(x + hash(i, 1, 3) * w, y + hash(i, 2, 3) * h, 0.3 + hash(i, 3, 3) * 0.8, 0, TAU); g.fill(); }
  g.globalAlpha = 1;
  g.strokeStyle = RC.ink; g.lineWidth = 0.4; g.strokeRect(x + 1.2, y + 1.2, w - 2.4, h - 2.4);
  g.fillStyle = RC.ink; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.font = `bold ${w * 0.23}px Georgia, serif`; g.fillText('WANTED', cx, y + h * 0.22, w * 0.86);
  const bx = x + w * 0.2, by = y + h * 0.27, bw = w * 0.6, bh = h * 0.4;
  g.fillStyle = sh(RC.paper, 1); g.fillRect(bx, by, bw, bh);
  g.strokeStyle = RC.ink; g.lineWidth = 0.35; g.strokeRect(bx, by, bw, bh);
  g.save(); g.beginPath(); g.rect(bx, by, bw, bh); g.clip();
  const mx = cx, my = by + bh * 0.52, s = bw;
  for (const sg of [-1, 1]) {
    g.fillStyle = RC.cream; g.beginPath(); g.moveTo(mx + sg * s * 0.34, my - s * 0.02); g.lineTo(mx + sg * s * 0.38, my - s * 0.42); g.lineTo(mx + sg * s * 0.06, my - s * 0.2); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#6a3c28'; g.beginPath(); g.moveTo(mx + sg * s * 0.31, my - s * 0.08); g.lineTo(mx + sg * s * 0.34, my - s * 0.34); g.lineTo(mx + sg * s * 0.14, my - s * 0.2); g.closePath(); g.fill();
  }
  g.fillStyle = RC.cream; g.beginPath(); g.ellipse(mx, my + s * 0.04, s * 0.34, s * 0.26, 0, 0, TAU); g.fill(); g.stroke();
  g.fillStyle = RC.nRed; g.beginPath(); g.moveTo(mx - s * 0.3, my + s * 0.12); g.quadraticCurveTo(mx, my + s * 0.22, mx + s * 0.3, my + s * 0.12); g.lineTo(mx + s * 0.06, my + s * 0.5); g.lineTo(mx - s * 0.06, my + s * 0.5); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = RC.nCream; for (const [dx, dy] of [[-0.12, 0.22], [0.1, 0.26], [0, 0.36]]) { g.beginPath(); g.arc(mx + dx * s, my + dy * s, s * 0.022, 0, TAU); g.fill(); }
  g.fillStyle = '#e8c040'; g.beginPath(); g.ellipse(mx, my - s * 0.13, s * 0.07, s * 0.08, 0, 0, TAU); g.fill(); g.stroke();
  g.fillStyle = RC.ink;
  for (const sg of [-1, 1]) {
    g.beginPath(); g.ellipse(mx + sg * s * 0.13, my + s * 0.01, s * 0.06, s * 0.035, sg * 0.25, 0, TAU); g.fill();
    g.beginPath(); for (const dy of [-0.01, 0.05]) { g.moveTo(mx + sg * s * 0.24, my + s * (0.06 + dy)); g.lineTo(mx + sg * s * 0.46, my + s * (0.03 + dy * 1.6)); } g.stroke();
  }
  g.restore();
  g.font = `bold ${w * 0.13}px Georgia, serif`; g.fillText('MEOWTH', cx, y + h * 0.79, w * 0.8);
  g.font = `${w * 0.1}px Georgia, serif`; g.fillText('REWARD $5,000', cx, y + h * 0.91, w * 0.84);
}

/** The milk can's label: Miltank's face, pink, short cream horns, black ears, blue eyes and a pale muzzle. */
function miltank(g, x, y, w, h) {
  g.fillStyle = RC.pink; g.fillRect(x, y, w, h);
  const cx = x + w / 2, cy = y + h * 0.56, s = h;
  g.strokeStyle = RC.ink; g.lineWidth = s * 0.03;
  for (const sg of [-1, 1]) {
    g.fillStyle = RC.nBlack; g.beginPath(); g.ellipse(cx + sg * s * 0.42, cy - s * 0.2, s * 0.15, s * 0.07, sg * 0.4, 0, TAU); g.fill();
    g.fillStyle = RC.horn; g.beginPath(); g.moveTo(cx + sg * s * 0.12, cy - s * 0.3); g.lineTo(cx + sg * s * 0.22, cy - s * 0.46); g.lineTo(cx + sg * s * 0.25, cy - s * 0.26); g.closePath(); g.fill();
  }
  g.fillStyle = RC.pinkL; g.beginPath(); g.ellipse(cx, cy, s * 0.3, s * 0.32, 0, 0, TAU); g.fill(); g.stroke();
  g.fillStyle = '#fbe0e4'; g.beginPath(); g.ellipse(cx, cy + s * 0.15, s * 0.2, s * 0.12, 0, 0, TAU); g.fill();
  g.fillStyle = sh(RC.pink, -2); for (const sg of [-1, 1]) { g.beginPath(); g.arc(cx + sg * s * 0.07, cy + s * 0.15, s * 0.025, 0, TAU); g.fill(); }
  for (const sg of [-1, 1]) {
    g.fillStyle = RC.ink; g.beginPath(); g.ellipse(cx + sg * s * 0.13, cy - s * 0.06, s * 0.05, s * 0.065, 0, 0, TAU); g.fill();
    g.fillStyle = '#4878c8'; g.beginPath(); g.ellipse(cx + sg * s * 0.13, cy - s * 0.05, s * 0.032, s * 0.045, 0, 0, TAU); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(cx + sg * s * 0.13 - s * 0.012, cy - s * 0.08, s * 0.014, 0, TAU); g.fill();
  }
}

/* ---------- the kinds ---------- */

/** What js/base-models-ranch.js builds for each upright and wall kind: its parts, doors and default material. */
export const BUILT = {};
/** The rug's outline, a cowhide from above (head end left, four leg flaps), in painted units across its 3 x 2 tiles. */
export const RUG = [[18, 10], [28, 13], [38, 9], [48, 8], [58, 9], [68, 13], [78, 10], [85, 4], [90, 8], [86, 18], [81, 25], [86, 32], [81, 39],
  [86, 46], [90, 56], [85, 60], [78, 54], [68, 51], [58, 55], [48, 56], [38, 55], [28, 51], [18, 54], [11, 60], [6, 56], [10, 46], [15, 39], [8, 32],
  [15, 25], [10, 18], [6, 8], [11, 4]];
/** The hide's patches: middle x, y and size. */
const SPOTS = [[28, 22, 10, 1], [60, 18, 8, 2], [52, 40, 12, 3], [76, 38, 7, 4], [22, 44, 6, 5], [42, 24, 4, 6], [70, 26, 4, 7]];

function piece(id, name, w, h, price, mat, parts, { doors = [], inside, ...rest } = {}) {
  BUILT[id] = { parts, doors, inside, mat };
  const all = [...parts, ...doors.flatMap(d => d.parts)];
  return { id, name, group: GROUP, solo: true, w, h, price, ...rest, draw(x, b, vw, dir) { floorShadow(x, b, vw); paintParts(all, x, b, vw, dir, w * 32); } };
}
function wallPiece(id, name, w, price, mat, parts, rest = {}) {
  BUILT[id] = { parts, doors: [], mat };
  return { id, name, group: GROUP, solo: true, w, h: 1, layer: 'wall', price, ...rest, wall(x) { paintParts(parts, x, 96, w * 32, 0, w * 32); } };
}

const foot4 = (xs, zs, s, hh, c = RC.woodD) => xs.flatMap(x => zs.map(z => B(x, hh / 2, z, s, hh, s, c, WD)));

export const RANCH_KINDS = [
  // a barn-plank bed: square posts, a lucky horseshoe on the headboard, a cream mattress under a red Navajo blanket whose
  // striped end is folded over the footboard
  piece('rnchbed', 'Ranch bed', 2, 2, 1350, 'wood', [
    ...[4, 60].flatMap(x => [B(x, 25, -28, 5, 50, 5, RC.woodD, WD), B(x, 50.6, -28, 6.6, 2.2, 6.6, RC.wood, WD)]),
    B(32, 31, -28, 51, 30, 2.4, RC.wood, PLK),
    B(32, 46.6, -28, 56, 3, 3.6, RC.woodD, WD), B(32, 16.4, -28, 56, 2.6, 3.4, RC.woodD, WD),
    ...horseshoe(32, 33, -26.4, 5.2, 1.1, true),
    B(32, 8.5, 0, 58, 7, 58, RC.woodD, WD),
    B(32, 14.5, 0, 56, 5, 54, RC.cream, CL),
    B(32, 18, 5, 58, 2.4, 44, RC.nRed, CL),
    ...[[-6, RC.nBlack], [-2, RC.nCream], [2, RC.turq], [14, RC.mustard], [18, RC.nBlack]].map(([z, c]) => B(32, 19.3, z, 58.4, 0.4, 2.2, c, CL)),
    ...[20, 44].map(x => S(x, 20, -20, 10, 3.2, 5.4, RC.cream, { m: 'cloth', seg: 12 })),
    ...[4, 60].flatMap(x => [B(x, 14, 28, 5, 28, 5, RC.woodD, WD), B(x, 28.8, 28, 6.6, 2, 6.6, RC.wood, WD)]),
    B(32, 18, 28, 51, 14, 2.4, RC.wood, PLK), B(32, 25.6, 28, 56, 2.6, 3.4, RC.woodD, WD),
    B(32, 27.4, 28.6, 34, 1.6, 6, RC.nRed, CL), B(32, 21, 31, 34, 13, 1.2, RC.nRed, CL),
    ...bands(32, 31.7, 34, [[17, RC.nBlack], [19.6, RC.nCream], [22.4, RC.turq], [25, RC.nCream]], 1.3),
    B(32, 14.6, 31.2, 34, 1, 1.2, RC.nCream, CL),
  ]),

  // a barn-wood side chair with a cowhide back laced between its posts, a top slat, a stitched leather seat
  piece('rnchchair', 'Ranch cowhide chair', 1, 1, 320, 'wood', [
    ...[6, 26].flatMap(x => [B(x, 22.5, -9, 3, 45, 3, RC.wood, WD), S(x, 45.6, -9, 1.9, 1.4, 1.9, RC.woodD, { m: 'wood', seg: 8 }), B(x, 7, 8, 3, 14, 3, RC.wood, WD), RD([x, 6, -9], [x, 6, 8], 0.8, RC.woodD, WD)]),
    B(16, 41.6, -9, 21, 4, 1.8, RC.woodL, WD), B(16, 21.4, -9, 20, 2.6, 1.6, RC.woodL, WD),
    B(16, 31.2, -9, 20, 17.4, 1, RC.hide, CL),
    DS(12.4, 34.6, -8.3, 3.4, 0.4, RC.spot, { m: 'plain', ry: 2.6, seg: 8 }), DS(20, 28, -8.3, 2.6, 0.4, RC.spot, { m: 'plain', ry: 2.2, seg: 8 }), DS(21.6, 37.4, -8.3, 1.4, 0.4, RC.spot, { m: 'plain', ry: 1.2, seg: 8 }),
    RD([6, 5, 8], [26, 5, 8], 0.8, RC.woodD, WD),
    B(16, 14.8, 0, 24, 2.4, 21, RC.woodD, WD),
    B(16, 16.8, 1, 21, 1.8, 18, RC.leather, LE),
  ]),

  // a rocking chair: curved runners, a spindle back with a horseshoe on its crest, a Navajo-striped cushion and a
  // turquoise blanket thrown over its back
  piece('rnchrocker', 'Ranch rocking chair', 1, 1, 620, 'wood', [
    ...[5, 27].flatMap(x => { const at = (z) => [x, 1.3 + (z / 14) ** 2 * 4, z], zs = [-14, -7, 0, 7, 14]; return zs.slice(0, 4).map((z, i) => RD(at(z), at(zs[i + 1]), 1.3, RC.woodD, WD)); }),
    ...[5, 27].flatMap(x => [-8, 8].map(z => B(x, 8.8, z, 2.6, 12.4, 2.6, RC.wood, WD))),
    B(16, 15.4, 0, 25, 2.6, 22, RC.wood, WD),
    B(16, 17.6, 1, 21, 2, 18, RC.nRed, CL), ...bands(16, 10.2, 21, [[17.1, RC.nCream], [18.1, RC.nBlack]], 0.6),
    ...[5, 27].map(x => B(x, 28, -10, 2.6, 26, 2.6, RC.wood, WD)),
    ...[10, 14, 18, 22].map(x => RD([x, 16.7, -10], [x, 38, -10], 0.7, RC.woodL, WD)),
    B(16, 39.6, -10, 25, 4, 2.4, RC.woodD, WD),
    B(16, 40.4, -9.6, 18, 2, 4.6, RC.turq, CL), B(16, 31.6, -8.1, 18, 16, 1, RC.turq, CL),
    ...bands(16, -7.45, 18, [[26, RC.nRed], [29.2, RC.nCream], [32.4, RC.nBlack], [35.6, RC.nCream]], 1.3),
    B(16, 23, -8.1, 18, 1, 0.8, RC.nCream, CL),
    ...horseshoe(16, 40, -7.2, 2.4, 0.6, true, { nails: false }),
    ...[4.5, 27.5].flatMap(x => [B(x, 24, 0, 3, 1.8, 21, RC.wood, WD), RD([x, 16.7, 8], [x, 23.2, 8], 0.9, RC.woodD, WD)]),
  ]),

  // a leather sofa on a plank base: tufted brown cushions, brass studs, plank arms, a cowhide throw, a Navajo pillow
  piece('rnchsofa', 'Ranch leather sofa', 2, 1, 1150, 'gloss', [
    ...foot4([5, 59], [-10, 10], 4, 3),
    B(32, 7, 1, 60, 8, 26, RC.wood, PLK),
    B(32, 22, -10, 56, 22, 6, RC.leather, LE),
    ...[19, 45].flatMap(x => [B(x, 13.6, 3, 26, 5.4, 20, RC.leather, LE), B(x, 22.6, -6.2, 25, 13, 3.4, RC.leatherL, LE)]),
    ...[3.5, 60.5].flatMap(x => [B(x, 15.5, 1, 6, 15, 26, RC.wood, PLK), DS(x, 19, 14.2, 0.8, 0.4, RC.brass, { m: 'metal', seg: 6 }), DS(x, 13, 14.2, 0.8, 0.4, RC.brass, { m: 'metal', seg: 6 })]),
    ...[8, 16, 24, 32, 40, 48, 56].map(x => DS(x, 31.4, -6.8, 0.8, 0.4, RC.brass, { m: 'metal', seg: 6 })),
    B(14, 27, -4, 13, 12, 0.8, RC.hide, CL),
    DS(11.4, 29.4, -3.4, 2.6, 0.4, RC.spot, { m: 'plain', ry: 2, seg: 8 }), DS(17, 24.6, -3.4, 2, 0.4, RC.spot, { m: 'plain', ry: 1.6, seg: 8 }),
    B(51, 19.4, -1.6, 11, 9, 3, RC.turq, CL), ...bands(51, 0.1, 11, [[17, RC.nRed], [21.8, RC.nBlack]], 1.2),
  ]),

  // a trestle table of planks on slab legs pinned with wedges, an enamel coffee pot and a tin cup
  piece('rnchtable', 'Ranch trestle table', 2, 1, 640, 'wood', [
    ...[8, 56].flatMap(x => [B(x, 1.4, 0, 5, 2.8, 24, RC.woodD, WD), B(x, 13.4, 0, 3.6, 21.4, 7, RC.woodD, WD), B(x, 23.8, 0, 4.4, 2.2, 24, RC.woodD, WD)]),
    B(32, 9, 0, 50, 3, 3.4, RC.wood, WD), ...[4.6, 59.4].map(x => B(x, 9, 0, 1.6, 4.4, 1.6, RC.woodL, WD)),
    B(32, 26.4, 0, 63, 3, 28, RC.wood, WD),
    LA(20, 27.9, -2, [[3.8, 0], [4.2, 0.6], [4.4, 6.6], [3.2, 9.4], [1.6, 10.6], [1.9, 11.4], [0, 11.6]], RC.enamel, { m: 'gloss', seg: 12 }),
    RD([23.4, 32, -2], [26.8, 36.2, -2], 0.7, RC.enamel, GL),
    RG(15.8, 33.6, -2, 2.6, 0.55, RC.enamel, { m: 'gloss', a0: Math.PI / 2, arc: Math.PI }),
    C(31, 30, 4, 2.2, 4.2, RC.enamel, { m: 'gloss', seg: 10 }), RG(31, 32.1, 4, 2.1, 0.3, RC.enamelW, { m: 'plain', flat: true }),
  ]),

  // a plank writing desk: a drawer pedestal with horseshoe pulls, a back board with a lucky shoe, a leather ledger, an
  // inkwell and quill, a tin cup of pencils and a little potted cactus
  piece('rnchdesk', 'Ranch writing desk', 2, 1, 960, 'wood', [
    B(12, 12.5, 0, 20, 25, 26, RC.wood, PLK),
    ...[18.5, 7.5].flatMap(h => [B(12, h, 13.3, 16, 9, 0.9, RC.woodL, WD), ...horseshoe(12, h - 0.4, 14.2, 2.2, 0.55, false, { nails: false })]),
    ...[-10, 10].map(z => B(57, 12.5, z, 3.6, 25, 3.6, RC.woodD, WD)),
    B(41, 22.6, 11, 32, 4, 1.6, RC.woodD, WD),
    B(32, 26.4, 0, 64, 2.8, 28, RC.woodD, WD),
    B(32, 34, -12.4, 60, 11, 2.2, RC.wood, PLKH), ...horseshoe(32, 33.6, -11, 3, 0.8, true),
    B(26, 28.5, 3, 12.4, 1.4, 9, RC.cream, PL), B(26, 29.4, 3, 13, 0.5, 9.6, RC.leather, LE),
    C(42, 29.6, -2, 1.8, 3.6, RC.ink, { m: 'gloss', seg: 8 }), RD([42, 31, -2], [45, 38, -3], 0.4, RC.cream, PL),
    C(50, 30.2, 2, 2.4, 4.8, RC.tin, { m: 'metal', seg: 10 }), ...[RC.nRed, RC.mustard, RC.turq].map((c, i) => RD([49 + i, 32, 2], [48.4 + i * 1.6, 36.4, 2], 0.35, c, PL)),
    LA(8, 27.8, -4, [[2.4, 0], [2.8, 3.2], [3, 3.6]], RC.clay, { m: 'wood', seg: 10 }),
    LA(8, 31.4, -4, [[0, 0], [1.8, 0.3], [2, 4.6], [1.2, 6.4], [0, 6.8]], RC.cactus, { m: 'cloth', seg: 8 }),
  ]),

  // a little red barn for a wardrobe: white corner trim, a gambrel roof with a hayloft door and a weathervane, and two
  // barn doors with white X-braces that swing open
  piece('rnchwardrobe', 'Ranch barn wardrobe', 2, 1, 1300, 'wood', [
    B(32, 2, 0, 60, 4, 26, RC.woodD, WD),
    B(32, 30, 0, 56, 52, 24, RC.red, PLK),
    ...[4.6, 59.4].map(x => B(x, 30, 12.2, 2.4, 52, 1.6, RC.white, WD)), B(32, 54.6, 12.2, 56, 2.4, 1.6, RC.white, WD),
    PR(32, 56, 0, [[-30, 0], [30, 0], [24, 10], [11, 17], [-11, 17], [-24, 10]], 28, RC.red, PLK),
    ...[[-30, 0, -24, 10], [-24, 10, -11, 17], [-11, 17, 11, 17], [11, 17, 24, 10], [24, 10, 30, 0]].map(([ax, ah, bx, bh]) => RD([32 + ax, 56 + ah, 14.2], [32 + bx, 56 + bh, 14.2], 0.9, RC.white, WD)),
    B(32, 63.4, 14.3, 10, 9, 0.8, RC.white, WD), B(32, 63.4, 14.8, 8, 7, 0.4, RC.redD, WD),
    RD([28.4, 60.4, 15.1], [35.6, 66.4, 15.1], 0.45, RC.white, WD), RD([28.4, 66.4, 15.1], [35.6, 60.4, 15.1], 0.45, RC.white, WD),
    RD([32, 73, 0], [32, 86, 0], 0.4, RC.iron, MT),
    PR(32, 82.6, 0, [[-7, -0.4], [5, -0.4], [5, -1.8], [8.4, 0], [5, 1.8], [5, 0.4], [-7, 0.4], [-8.6, 1.8], [-8.6, -1.8]], 0.6, RC.iron, MT),
    S(32, 86.6, 0, 1, 1, 1, RC.brass, { m: 'metal', seg: 8 }),
  ], {
    doors: [6.2, 57.8].map((hx, i) => {
      const x = i ? 45 : 19, l = x - 12, r = x + 12, hz = 13.8;
      return { hinge: [hx, 13], side: i ? -1 : 1, parts: [
        B(x, 28.5, 12.9, 25.6, 45, 1.4, RC.red, PLK),
        RD([l, 50, hz], [r, 50, hz], 0.9, RC.white, WD), RD([l, 7, hz], [r, 7, hz], 0.9, RC.white, WD),
        RD([l, 7, hz], [l, 50, hz], 0.9, RC.white, WD), RD([r, 7, hz], [r, 50, hz], 0.9, RC.white, WD),
        RD([l, 7, hz], [r, 50, hz], 0.8, RC.white, WD), RD([l, 50, hz], [r, 7, hz], 0.8, RC.white, WD),
        RD([x + (i ? -9 : 9), 25, 14.6], [x + (i ? -9 : 9), 32, 14.6], 0.6, RC.woodD, WD),
      ] };
    }),
    inside: { x: 32, h: 28.5, w: 50, hh: 44, z: 12.2 },
  }),

  // a pale weathered dresser with six barn-red drawers on horseshoe pulls, an enamel pitcher and basin and a cowboy hat
  piece('rnchdresser', 'Ranch dresser', 2, 1, 880, 'wood', [
    ...foot4([5, 59], [-10, 10], 4, 3.2),
    B(32, 17, 0, 60, 28, 26, RC.wood, PLK),
    ...[[18, 25.4], [46, 25.4], [18, 16.8], [46, 16.8], [18, 8.2], [46, 8.2]].flatMap(([x, h]) => [B(x, h, 13.3, 26, 7.4, 1, RC.red, WD), ...horseshoe(x, h - 0.8, 14.2, 2.2, 0.55, false, { nails: false })]),
    B(32, 32.2, 0, 62, 2.4, 28, RC.woodD, WD),
    LA(46, 33.4, -2, [[3, 0], [5.6, 0.8], [7.4, 2.4], [7.8, 3]], RC.enamelW, { m: 'gloss', seg: 14 }), RG(46, 36.3, -2, 7.6, 0.4, RC.enamel, { m: 'gloss', flat: true }),
    LA(46, 34, -2, [[2.6, 0], [3.4, 1], [3.8, 5], [3, 8], [2, 10], [2.6, 12], [2.8, 12.4]], RC.enamelW, { m: 'gloss', seg: 12 }),
    RG(49.6, 41, -2, 2.4, 0.5, RC.enamelW, { m: 'gloss', a0: -Math.PI / 2, arc: Math.PI }), RG(46, 46.4, -2, 2.7, 0.3, RC.enamel, { m: 'gloss', flat: true }),
    LA(16, 33.4, 0, [[8.6, 1.6], [7.8, 0.6], [5.4, 0.2], [4.4, 0.4], [4.6, 4], [4.2, 6.4], [2, 7], [0, 6.4]], RC.felt, { m: 'cloth', seg: 14 }),
    C(16, 35.4, 0, 4.7, 1, RC.leatherD, { m: 'gloss', seg: 12 }),
  ]),

  // three open plank crates stacked for a shelf: a coiled rope and a tin can, jars of peaches and honey, leather books
  // and a horseshoe
  piece('rnchshelf', 'Ranch crate shelf', 1, 1, 540, 'wood', (() => {
    const parts = [];
    [0, 20, 40].forEach((h0, i) => {
      const c = i === 1 ? RC.woodL : RC.wood;
      parts.push(B(16, h0 + 1, 0, 30, 2, 22, c, WD), ...[2, 30].map(x => B(x, h0 + 10, 0, 2, 20, 22, c, PLKH)),
        B(16, h0 + 10, -10.2, 26, 20, 1.6, RC.woodD, PLKH), B(16, h0 + 3.4, 10.4, 26, 2.4, 1.2, c, WD));
    });
    parts.push(
      RG(11, 3.6, 2, 5, 1.5, RC.rope, { m: 'cloth', flat: true }), RG(11, 6.2, 2, 4.4, 1.4, RC.rope, { m: 'cloth', flat: true }), RG(11, 8.6, 2, 3.6, 1.2, RC.ropeD, { m: 'cloth', flat: true }),
      C(23, 7, 2, 3, 10, RC.tin, { m: 'metal', seg: 12 }), C(23, 7, 2, 3.15, 5, RC.nRed, { m: 'plain', seg: 12 }),
      ...[[10, RC.peach], [21.6, RC.honey]].flatMap(([x, c]) => [C(x, 27.4, 1, 3.2, 7.4, c, { m: 'plain', seg: 12 }), C(x, 28, 1, 3.6, 9, '#cfe8f4', { m: 'glass', seg: 12 }), C(x, 33, 1, 3.4, 1, RC.brass, { m: 'metal', seg: 12 })]),
      B(7.4, 49, -2, 3, 12, 10, RC.leather, LE), B(10.6, 48.4, -2, 3, 10.8, 10, RC.nRed, LE), B(13.8, 49.4, -2, 3, 12.8, 10, RC.leatherD, LE),
      ...horseshoe(22.6, 47.6, 0, 3.8, 1, true),
    );
    return parts;
  })()),

  // a tin hurricane lantern hung from a barn-wood post's arm, its glass glowing warm in a wire cage
  piece('rnchlantern', 'Ranch lantern post', 1, 1, 380, 'wood', [
    B(12, 1.4, 0, 22, 2.8, 6, RC.woodD, WD), B(12, 1.4, 0, 6, 2.8, 22, RC.woodD, WD),
    B(12, 29, 0, 4, 52, 4, RC.wood, PLK),
    B(18.4, 53, 0, 15, 2.6, 2.6, RC.wood, WD), RD([12, 45, 0], [19, 52, 0], 0.8, RC.woodD, WD),
    RD([23, 52, 0], [23, 47.6, 0], 0.35, RC.iron, MT),
    RG(23, 44.6, 0, 3.4, 0.4, RC.iron, { m: 'metal', a0: 0, arc: Math.PI }),
    LA(23, 41, 0, [[4.2, 0], [4, 0.8], [2, 2.6], [1.2, 3.4], [0, 3.6]], RC.tin, { m: 'metal', seg: 12 }),
    LA(23, 30.6, 0, [[2.4, 0], [3.6, 2], [4, 5], [3.6, 8.4], [2.6, 10.4]], RC.glow, { m: 'glow', seg: 12 }),
    ...[[18.8, 0], [27.2, 0], [23, 4.2], [23, -4.2]].map(([x, z]) => RD([x, 30.6, z], [x, 41, z], 0.3, RC.iron, MT)),
    C(23, 28.4, 0, 4.4, 4.4, RC.tin, { m: 'metal', seg: 12 }), C(23, 30.8, 0, 4.6, 0.8, RC.tinD, { m: 'metal', seg: 12 }),
  ], { glow: [RC.glow] }),

  // a wagon wheel hung flat as a chandelier on a post in a half barrel, four candles on its rim, chains to the top
  piece('rnchwheellamp', 'Ranch wagon-wheel lamp', 1, 1, 760, 'wood', (() => {
    const parts = [
      LA(16, 0, 0, [[8, 0], [8.8, 3], [9, 5], [8.8, 7], [8, 10]], RC.wood, { m: 'wood', seg: 14, tex: 'plank', ts: 2.6 }),
      C(16, 2, 0, 8.7, 1, RC.iron, { m: 'metal', seg: 14 }), C(16, 8, 0, 8.6, 1, RC.iron, { m: 'metal', seg: 14 }), C(16, 10, 0, 7.8, 0.6, RC.woodD, { m: 'wood', seg: 14 }),
      C(16, 43, 0, 1.6, 66, RC.woodD, { m: 'wood', seg: 8 }),
      RG(16, 58, 0, 14, 1, RC.iron, { m: 'metal', flat: true }), RG(16, 58, 0, 12.4, 1.1, RC.wood, { m: 'wood', flat: true }),
      C(16, 58, 0, 2.8, 3.4, RC.woodD, { m: 'wood', seg: 10 }),
      S(16, 77, 0, 2, 2, 2, RC.brass, { m: 'metal', seg: 8 }),
    ];
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, c = Math.cos(a), s = Math.sin(a); parts.push(RD([16 + c * 2.8, 58, s * 2.8], [16 + c * 11.6, 58, s * 11.6], 0.7, RC.woodL, WD)); }
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 4 + i * Math.PI / 2, x = 16 + Math.cos(a) * 12.4, z = Math.sin(a) * 12.4, b = i * Math.PI / 2, cx = 16 + Math.cos(b) * 12.4, cz = Math.sin(b) * 12.4;
      parts.push(C(x, 59.6, z, 1.4, 1.2, RC.tin, { m: 'metal', seg: 8 }), C(x, 61.8, z, 0.9, 3.2, RC.cream, { m: 'plain', seg: 8 }), S(x, 64.4, z, 0.9, 1.5, 0.9, RC.glow, { m: 'glow', seg: 6 }));
      parts.push(RD([cx, 58.8, cz], [16, 75.4, 0], 0.3, RC.iron, MT));
    }
    return parts;
  })(), { glow: [RC.glow] }),

  // a round barn-wood clock in a great iron horseshoe, open end up, a sheriff's star swinging below on its chain
  wallPiece('rnchclock', 'Ranch horseshoe clock', 1, 520, 'wood', [
    DS(16, 60, 0.8, 11.4, 1.6, RC.wood, { m: 'wood', tex: 'plank', ts: 4.6, seg: 18 }),
    ...horseshoe(16, 60, 2.2, 12.6, 1.8, true),
    PC(16, 60, 2.0, 15, 15, dial),
    RD([16, 48.4, 1.2], [16, 42.6, 1.2], 0.3, RC.brass, MT),
    PR(16, 39.4, 1.2, star(4.6, 2), 0.8, RC.brass, MT),
    RG(16, 73.4, 0.8, 2, 0.5, RC.rope, { m: 'cloth', a0: 0, arc: Math.PI }),
  ]),

  // a corral fence for a folding screen: three posts and plank rails, a lasso on the middle post, a horseshoe, and a
  // striped saddle blanket thrown over the top rail
  piece('rnchscreen', 'Ranch corral screen', 2, 1, 640, 'wood', [
    ...[4, 32, 60].flatMap(x => [B(x, 26, 0, 5, 52, 5, RC.woodD, PLK), B(x, 52.6, 0, 6, 1.6, 6, RC.wood, WD)]),
    ...[18, 46].flatMap(x => [9, 20, 31, 42].map(h => B(x, h, 1.6, 26, 7, 1.6, RC.wood, PLKH))),
    RD([32, 47, 2.6], [32, 47, 4.4], 0.5, RC.iron, MT),
    RG(32, 41.6, 3.4, 4.6, 0.8, RC.rope, CL), RG(32.6, 39.8, 3.9, 5.8, 0.7, RC.ropeD, CL),
    ...horseshoe(18, 43.4, 3, 3.4, 0.9, true),
    B(46, 46.2, 1.6, 18, 1.4, 4.4, RC.nRed, CL), B(46, 38.6, 3.6, 18, 15, 0.9, RC.nRed, CL),
    ...bands(46, 4.25, 18, [[34, RC.nCream], [37.4, RC.nBlack], [40.8, RC.turq], [44, RC.nCream]], 1.4),
    B(46, 30.8, 3.6, 18, 1, 0.8, RC.nCream, CL),
  ]),

  // a barn-wood mirror bound in rope, a pair of Tauros's great curved horns mounted on a studded leather plate above
  wallPiece('rnchmirror', 'Ranch Tauros-horn mirror', 1, 560, 'wood', (() => {
    const parts = [
      B(16, 50, 1.2, 21, 32, 2.4, RC.wood, PLKH),
      B(16, 50, 2.5, 14.4, 25, 0.4, RC.mirror, GL),
      ...[[8.6, 37, 23.4, 37], [23.4, 37, 23.4, 63], [23.4, 63, 8.6, 63], [8.6, 63, 8.6, 37]].map(([ax, ah, bx, bh]) => RD([ax, ah, 2.7], [bx, bh, 2.7], 0.7, RC.rope, CL)),
      B(16, 70.4, 2.2, 11, 6, 3.4, RC.leather, LE),
      ...[12.4, 16, 19.6].map(x => DS(x, 70.4, 4, 0.7, 0.4, RC.brass, { m: 'metal', seg: 6 })),
    ];
    const P = [[4.6, 71], [9.4, 72.4], [13, 75.6], [14.2, 79.6], [13.4, 83.4], [11.6, 85.6]], R = [1.9, 1.6, 1.3, 1.0, 0.7];
    for (const s of [-1, 1]) for (let i = 0; i < 5; i++) parts.push(RD([16 + s * P[i][0], P[i][1], 2.4], [16 + s * P[i + 1][0], P[i + 1][1], 2.4], R[i], i > 2 ? RC.hornD : RC.horn, { m: 'gloss' }));
    return parts;
  })()),

  // a cowhide rug, cream with brown patches, its four leg flaps spread
  { id: 'rnchrug', name: 'Ranch cowhide rug', group: GROUP, solo: true, w: 3, h: 2, layer: 'rug', price: 720, high: 0.04, side: 'c', flat() {
    const g = ctx(), path = () => { g.beginPath(); RUG.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
    const fill = g.createRadialGradient(48, 32, 4, 48, 32, 50);
    fill.addColorStop(0, RC.hide); fill.addColorStop(1, sh(RC.hide, -1));
    g.fillStyle = fill; path(); g.fill();
    g.save(); path(); g.clip();
    for (const [sx, sy, r, seed] of SPOTS) {
      g.fillStyle = RC.spot; g.beginPath();
      for (let i = 0; i < 14; i++) { const a = i / 14 * TAU, k = r * (0.7 + 0.5 * hash(i, seed, 7)); i ? g.lineTo(sx + Math.cos(a) * k, sy + Math.sin(a) * k * 0.85) : g.moveTo(sx + Math.cos(a) * k, sy + Math.sin(a) * k * 0.85); }
      g.closePath(); g.fill();
    }
    for (let x = 0; x < 96; x += 2) for (let y = 0; y < 64; y += 2) if (hash(x, y, 9) < 0.16) { g.fillStyle = hash(x, y, 10) < 0.5 ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'; g.fillRect(x, y, 1, 1.6); }
    g.restore();
    g.strokeStyle = sh(RC.hide, -2); g.lineWidth = 1.6; path(); g.stroke();
    g.strokeStyle = RC.spot; g.lineWidth = 0.6; path(); g.stroke();
  } },

  // a plank rack of four horseshoes hung for luck, iron hooks below with a lasso and an enamel cup
  wallPiece('rnchshoes', 'Ranch horseshoe rack', 2, 360, 'wood', [
    B(32, 56, 1, 56, 13, 2, RC.wood, PLKH),
    ...[[11, RC.iron], [24.5, RC.ironL], [39.5, RC.iron], [53, RC.ironL]].flatMap(([x, c]) => horseshoe(x, 56.6, 2.8, 4.2, 1.1, true, { c })),
    ...[20, 44].map(x => RD([x, 49.6, 1.2], [x, 47, 3.4], 0.4, RC.iron, MT)),
    RG(20, 40.4, 3.4, 6.2, 0.8, RC.rope, CL), RG(20.4, 41.4, 3.9, 5.2, 0.7, RC.ropeD, CL),
    C(44, 43, 3.6, 2.2, 4, RC.enamel, { m: 'gloss', seg: 10 }), RG(44, 45.1, 3.6, 2.1, 0.3, RC.enamelW, { m: 'plain', flat: true }),
  ]),

  // an old wagon wheel hung on the wall: an iron tyre, a wooden felloe, twelve spokes and a capped hub
  wallPiece('rnchwheel', 'Ranch wagon wheel', 2, 420, 'wood', wheel(32, 50, 2.8, 22)),

  // a foxed WANTED poster nailed up: Meowth in a red bandana, five thousand reward
  wallPiece('rnchwanted', 'Ranch WANTED poster', 1, 220, 'plain', [
    B(16, 56, 0.5, 22, 30, 0.6, RC.paper, PL),
    PC(16, 56, 0.85, 22, 30, poster),
    ...[[6.4, 69], [25.6, 69], [6.4, 43], [25.6, 43]].map(([x, h]) => DS(x, h, 1.1, 0.7, 0.4, RC.tin, { m: 'metal', seg: 6 })),
  ]),

  // a leather saddle on a sawhorse stand over a Navajo saddle blanket: a horn with a lasso, fenders and wooden stirrups
  piece('rnchsaddle', 'Ranch saddle stand', 1, 1, 980, 'wood', [
    ...[4, 28].flatMap(x => [RD([x, 26, 0], [x, 0.9, 9.4], 1.1, RC.woodD, WD), RD([x, 26, 0], [x, 0.9, -9.4], 1.1, RC.woodD, WD), RD([x, 9, 6.2], [x, 9, -6.2], 0.7, RC.woodD, WD)]),
    B(16, 26, 0, 30, 3.6, 3.6, RC.wood, WD),
    B(16, 28.4, 0, 21, 1.2, 20, RC.nRed, CL),
    ...[-1, 1].map(s => B(16, 21.6, s * 10, 21, 13, 1, RC.nRed, CL)),
    ...bands(16, 10.65, 21, [[17.6, RC.nBlack], [20.6, RC.nCream], [23.6, RC.turq], [26.2, RC.nCream]], 1.3),
    B(16, 15, 10, 21, 1, 1.2, RC.nCream, CL),
    B(16, 29.4, 0, 22, 1.2, 22, RC.leatherD, LE),
    PR(16, 29.8, 0, [[-11.6, 0], [10, 0], [11.4, 1.6], [11, 4.4], [8.6, 5.6], [5, 3.4], [-2, 2.6], [-7, 3.4], [-10.2, 7.6], [-12.4, 8.4], [-12.6, 6.2]], 13, RC.leather, LE),
    RD([26, 33.6, 0], [26.6, 37.4, 0], 1, RC.leatherD, LE), S(26.8, 38, 0, 2.2, 0.9, 1.8, RC.leatherD, { m: 'gloss', seg: 8 }),
    ...[-1, 1].flatMap(s => [B(15, 22, s * 11.2, 8, 14, 1.2, RC.leatherL, LE), RD([15, 15, s * 11.4], [15, 12.6, s * 11.4], 0.5, RC.leatherD, LE),
      RG(15, 9.6, s * 11.4, 3, 0.8, RC.woodD, WD), B(15, 6.8, s * 11.4, 5, 1, 2.4, RC.woodD, WD), DS(15, 26, s * 11.9, 1.2, 0.4, RC.tinL, { m: 'metal', seg: 8 })]),
    RG(27.6, 31, 2, 3.6, 0.7, RC.rope, CL),
  ]),

  // a hay bale to sit on, bound with twine, a turquoise Navajo blanket folded over it
  piece('rnchhay', 'Ranch hay bale seat', 1, 1, 240, 'cloth', [
    B(16, 9, 0, 30, 18, 24, RC.hay, { m: 'cloth', tex: 'straw', r: 2 }),
    ...[9, 23].map(x => B(x, 9, 0, 1.2, 18.4, 24.4, RC.ropeD, CL)),
    ...[[3, 17.6, 4, 1.4, 20, 5], [28, 17.4, -6, 30.6, 19.4, -7], [5, 4, 12, 2, 2.6, 13], [27, 11, 12, 30, 12.4, 13.4]].map(([ax, ah, az, bx, bh, bz]) => RD([ax, ah, az], [bx, bh, bz], 0.3, RC.hayL, CL)),
    B(16, 18.6, 3, 16, 1.2, 19, RC.turq, CL), B(16, 13, 12.6, 16, 11, 0.8, RC.turq, CL),
    ...bands(16, 13.15, 16, [[9.6, RC.nRed], [12.6, RC.nCream], [15.6, RC.nBlack]], 1.2),
  ]),

  // a galvanized tin stock trough on plank skids, ribbed, full to the brim, a tin dipper hung on its rim
  piece('rnchtrough', 'Ranch tin trough', 2, 1, 520, 'metal', [
    ...[-8, 8].map(z => B(32, 1, z, 56, 2, 4, RC.woodD, WD)),
    B(32, 8, 0, 58, 12, 24, RC.tin, { m: 'metal', r: 3 }),
    ...[5, 10].map(h => B(32, h, 0, 58.6, 0.8, 24.6, RC.tinD, { m: 'metal', r: 3 })),
    B(32, 14.1, 0, 54, 0.6, 20, RC.water, GL),
    ...[-11.6, 11.6].map(z => B(32, 15, z, 58, 2, 1.6, RC.tinL, MT)), ...[3.8, 60.2].map(x => B(x, 15, 0, 1.6, 2, 24.8, RC.tinL, MT)),
    RD([50, 16, 11.6], [52, 16, 14.4], 0.5, RC.tinD, MT), C(53.4, 13.6, 14.4, 1.8, 3.6, RC.tinD, { m: 'metal', seg: 10 }),
  ]),

  // a tin milk can with a pink Miltank band and its face on the front, handles at the shoulder, a capped lid
  piece('rnchmilk', 'Miltank ranch milk can', 1, 1, 320, 'metal', [
    LA(16, 0, 0, [[8, 0], [8.4, 0.8], [8.4, 2.2], [8, 2.8], [8, 18], [7.4, 21], [4.8, 24.6], [4.2, 26.4], [4.8, 27.2], [4.8, 29]], RC.tin, { m: 'metal', seg: 16 }),
    LA(16, 29, 0, [[5.6, 0], [5.6, 1.4], [4.2, 2.4], [1.8, 3], [1.8, 4.4], [0, 4.6]], RC.tinD, { m: 'metal', seg: 14 }),
    C(16, 12, 0, 8.25, 9, RC.pink, { m: 'plain', seg: 16 }),
    ...[-1, 1].map(s => RG(16 + s * 7.6, 22, 0, 2.6, 0.55, RC.tinD, { m: 'metal', a0: s < 0 ? Math.PI / 2 : -Math.PI / 2, arc: Math.PI })),
    PC(16, 12, 8.45, 11, 9, miltank),
  ]),

  // a tall green cactus with two arms and pink blooms, in a terracotta pot with a Navajo band
  piece('rnchcactus', 'Ranch potted cactus', 1, 1, 260, 'cloth', [
    LA(16, 0, 0, [[6.4, 0], [7.2, 0.6], [8.6, 10], [9.2, 10.4], [9.2, 12.4], [8.4, 12.6]], RC.clay, { m: 'wood', seg: 14 }),
    C(16, 7, 0, 8.5, 2.4, RC.turq, { m: 'plain', rb: 8.1, seg: 14 }), C(16, 5, 0, 8.15, 1, RC.nRed, { m: 'plain', rb: 8, seg: 14 }),
    C(16, 12, 0, 8.2, 0.6, RC.soil, { m: 'plain', seg: 14 }),
    LA(16, 12, 0, [[0, 0], [3.6, 0.4], [4.6, 4], [4.8, 24], [4.4, 29], [3, 32], [0, 33]], RC.cactus, { m: 'cloth', seg: 10, tex: 'ribs', ts: 1.9 }),
    RD([12, 25.6, 0], [7.6, 25.6, 0], 2.4, RC.cactusD, CL),
    LA(7.4, 24, 0, [[0, 0], [2.6, 0.3], [2.8, 8], [2, 10.4], [0, 11]], RC.cactusD, { m: 'cloth', seg: 8, tex: 'ribs', ts: 1.6 }),
    RD([20, 31, 0], [24.4, 31, 0], 2.2, RC.cactusL, CL),
    LA(24.6, 29.4, 0, [[0, 0], [2.4, 0.3], [2.6, 7], [1.8, 8.8], [0, 9.4]], RC.cactusL, { m: 'cloth', seg: 8, tex: 'ribs', ts: 1.5 }),
    S(16, 45, 0, 1.8, 1.4, 1.8, RC.bloom, { m: 'cloth', seg: 8 }), S(7.4, 35, 0, 1.4, 1.1, 1.4, RC.bloom, { m: 'cloth', seg: 8 }),
  ]),

  // Mudbray tied at a hitching rail: a sturdy brown body, its black mane, big mud-dark hooves; a tin bucket by the post
  piece('rnchpost', 'Mudbray hitching post', 2, 1, 680, 'wood', [
    ...[5, 59].flatMap(x => [B(x, 15.5, -5, 5, 31, 5, RC.woodD, PLK), B(x, 31.4, -5, 6, 1.4, 6, RC.wood, WD)]),
    B(32, 27, -5, 58, 3.4, 3.2, RC.wood, WD),
    RG(50, 24.2, -3.2, 1.6, 0.4, RC.iron, MT),
    S(28, 17, 4, 10.5, 7, 6, RC.mb, { m: 'cloth', seg: 14 }),
    ...[[21, 2], [24.5, 6], [32, 2], [35.5, 6]].flatMap(([x, z]) => [RD([x, 14, z], [x, 5, z], 1.9, RC.mb, CL), S(x, 2.8, z, 3, 2.8, 3, RC.mbD, { m: 'cloth', seg: 10 })]),
    S(37.6, 22.6, 4, 4, 5.6, 4, RC.mb, { m: 'cloth', seg: 10 }),
    S(42, 28, 4, 5, 4.2, 4.2, RC.mb, { m: 'cloth', seg: 12 }),
    S(46.4, 26.4, 4, 3.2, 2.8, 3.2, RC.mbSnout, { m: 'cloth', seg: 10 }),
    DS(43.6, 29.2, 8.1, 0.8, 0.4, RC.ink, { m: 'gloss', seg: 6 }),
    RD([40.4, 31, 4], [38.8, 37, 4], 1.2, RC.mb, CL), RD([42, 31, 3], [43, 37, 3], 1.2, RC.mb, CL),
    RD([35.4, 26.6, 4], [41, 32.6, 4], 2, RC.mane, CL), S(41.4, 33.4, 4, 2, 1.6, 1.6, RC.mane, { m: 'cloth', seg: 8 }),
    RD([18, 19, 4], [15.6, 13, 4], 1, RC.mane, CL), S(15.4, 12, 4, 1.8, 2.4, 1.6, RC.mane, { m: 'cloth', seg: 8 }),
    RD([48.4, 26.4, 5], [50, 22.8, -3.2], 0.45, RC.rope, CL),
    LA(58, 0, 9, [[3.6, 0], [4.6, 6.4], [4.8, 6.8]], RC.tin, { m: 'metal', seg: 12 }), RG(58, 7.4, 9, 4.4, 0.3, RC.tinD, { m: 'metal', a0: 0, arc: Math.PI }),
  ]),

  // a saloon bar: a plank counter with barn-red raised panels, a polished top, a brass foot rail, Moomoo milk bottles, a
  // glass and a brass service bell
  piece('rnchbar', 'Ranch saloon bar', 2, 1, 1400, 'wood', [
    B(32, 2, 1, 62, 4, 22, RC.woodD, WD),
    B(32, 18, 0, 60, 28, 22, RC.wood, PLK),
    ...[12, 32, 52].flatMap(x => [B(x, 18, 11.4, 16, 21, 0.8, RC.woodL, WD), B(x, 18, 11.9, 12, 17, 0.4, RC.red, WD)]),
    B(32, 33.2, 0, 64, 2.8, 26, RC.woodD, GL),
    RD([3, 6.4, 14.4], [61, 6.4, 14.4], 0.9, RC.brass, MT), ...[8, 32, 56].map(x => RD([x, 6.4, 11.4], [x, 6.4, 14.4], 0.5, RC.brass, MT)),
    ...[8, 12.6].flatMap(x => [LA(x, 34.6, -2, [[2.2, 0], [2.4, 0.6], [2.4, 5], [1.4, 7.4], [1.2, 8.6], [1.4, 9]], RC.milk, { m: 'gloss', seg: 10 }), C(x, 44, -2, 1.4, 0.8, RC.nRed, { m: 'plain', seg: 8 })]),
    C(8, 37.6, -2, 2.45, 2, RC.turq, { m: 'plain', seg: 10 }), C(12.6, 37.6, -2, 2.45, 2, RC.turq, { m: 'plain', seg: 10 }),
    C(22, 36.6, 2, 1.6, 4, '#cfe8f4', { m: 'glass', seg: 10 }),
    LA(50, 34.6, 2, [[3, 0], [3, 0.6], [2.6, 1.4], [1.6, 3.2], [0.4, 3.8], [0.4, 4.6], [0, 5]], RC.brass, { m: 'metal', seg: 12 }),
  ]),
];
