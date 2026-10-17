/* base-furniture-throwback.js  -  the Throwback set (furniture expansion session g, 2026-10-17): Animal Crossing's
   Throwback series, a 90s kid's bedroom. Bold teal, purple, hot pink and lime on black, memphis squiggles, triangles and
   confetti, inflatable and see-through plastic, glow-in-the-dark stars and neon; a CRT TV with rabbit ears, a boombox and
   a stack of cassettes, a game console with its cartridges, a see-through phone, a mini hoop, skateboards. Pikachu on a
   handheld, a Porygon lamp, a Dedenne in its habitat and Togepi in a pocket pet for the Pokémon touches. All solo, fixed
   colours, sold all year.
   An upright piece is a list of parts in painted units (32 a tile), as in js/base-furniture-acorn.js: `x` across from
   the left of its front, `h` up from the floor (a wall piece's from the foot of its strip), `z` out to the front from its
   middle (a wall piece's from the wall). They're painted here from any side, and js/base-models-throwback.js builds the
   same list as 3D parts (BUILT), so picture and model agree. `tex` is painted only (the model stays plain colour):
   `squiggle` memphis squiggles, `confetti` scattered dots, dashes and triangles. A `pic` part (the memphis panels on the
   bed, sofa, wardrobe doors and screen, the TV's picture, the handheld, the cassettes, the clock's dial) is painted on
   the front only, and the model wears that crop of the painting. The wardrobe's doors swing (`doors`, `inside`). The
   rug is painted from above. */

import { sh, oval, ovalShade, floorShadow, ctx, hash, glass as glassPane } from './base-paint.js';

export const TB = {
  ink: '#1f1c2a', inkL: '#3a3548', teal: '#1cc4bc', tealD: '#128a86', tealL: '#7ae8e0', purple: '#7a3cc8', purpleD: '#4f2590',
  purpleL: '#b07cf0', pink: '#ff3fa4', pinkD: '#c2227a', pinkL: '#ff9ccc', lime: '#a8e830', limeD: '#72a81a', yellow: '#ffd83a',
  white: '#f4f2f8', grey: '#cfccd6', greyD: '#8e8a9a', orange: '#ff8a32', mirror: '#cfe6f2', star: '#dcf8a8', lava: '#ff5cae',
  lcd: '#b4c8a0', lcdD: '#2c3a28', gbScreen: '#9cbc2c', gbInk: '#29411c', dede: '#e8a24e', dedeL: '#ffe0b0', togepi: '#fff4dc',
};
const GROUP = 'Throwback';
const TAU = Math.PI * 2;
const POP = [TB.teal, TB.pink, TB.lime, TB.yellow, TB.purpleL, TB.white];

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

const CL = { m: 'cloth' }, PL = { m: 'plain' }, GL = { m: 'gloss' }, MT = { m: 'metal' }, GW = { m: 'glow' }, GS = { m: 'glass' };

/** A memphis triangle, s across its base, standing on it (or turned by ang). */
const triPts = (s, ang = 0) => [[-s / 2, 0], [s / 2, 0], [0, s * 0.86]].map(([x, y]) => [x * Math.cos(ang) - y * Math.sin(ang), x * Math.sin(ang) + y * Math.cos(ang)]);
/** A round arch `rise` high over a base 2 * half wide (a half-disc on a wardrobe's crown). */
const arch = (half, rise, n = 10) => [[-half, 0], [half, 0], ...Array.from({ length: n - 1 }, (_, i) => { const a = Math.PI * (i + 1) / n; return [half * Math.cos(a), rise * Math.sin(a)]; })];
/** A star's outline about its middle, r to the points, ri to the notches, turned by rot. */
const starPts = (r, ri = r * 0.45, n = 5, rot = 0) => Array.from({ length: n * 2 }, (_, i) => { const a = Math.PI / 2 + rot + i * Math.PI / n, rr = i % 2 ? ri : r; return [Math.cos(a) * rr, Math.sin(a) * rr]; });
/** A wavy blob about its middle: a circle r round with `n` bumps `amp` deep (the mirror's frame). */
const wavyPts = (r, amp, n, seg = 48) => Array.from({ length: seg }, (_, i) => { const a = i / seg * TAU, rr = r + amp * Math.sin(a * n); return [Math.cos(a) * rr, Math.sin(a) * rr]; });
/** A crescent moon about its middle, r round, its horns to the right: the outer arc, then the inner one back. */
const moonPts = (r, seg = 12) => {
  const cx = r * 0.45, ri = Math.hypot(r * 0.5 - cx, r * 0.866), a0 = Math.atan2(-r * 0.866, r * 0.5 - cx);
  return [
    ...Array.from({ length: seg + 1 }, (_, i) => { const a = Math.PI / 3 + i / seg * Math.PI * 4 / 3; return [Math.cos(a) * r, Math.sin(a) * r]; }),
    ...Array.from({ length: seg - 1 }, (_, i) => { const a = a0 - (i + 1) / seg * (2 * Math.PI + 2 * a0); return [cx + Math.cos(a) * ri, Math.sin(a) * ri]; }),
  ];
};
/** A zigzag of rods from x0 to x1 at h, `amp` up and down, n teeth (a neon squiggle). */
const zigzag = (x0, x1, h, z, amp, n, r, c, o) => Array.from({ length: n }, (_, i) => RD([x0 + (x1 - x0) * i / n, h + (i % 2 ? amp : -amp), z], [x0 + (x1 - x0) * (i + 1) / n, h + (i % 2 ? -amp : amp), z], r, c, o));

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

/** Memphis bits scattered on a canvas over [x0, y0, x1, y1]: dots, dashes, little triangles, never in colour `not`. */
function confettiOn(g, x0, y0, x1, y1, s, seed, not) {
  const cols = POP.filter(c => c !== not), n = Math.max(3, Math.round((x1 - x0) * (y1 - y0) / (s * s * 2.4)));
  for (let i = 0; i < n; i++) {
    const px = x0 + hash(i, 21, seed) * (x1 - x0), py = y0 + hash(i, 22, seed) * (y1 - y0), v = hash(i, 23, seed), a = hash(i, 24, seed) * Math.PI;
    g.fillStyle = cols[Math.floor(hash(i, 25, seed) * cols.length)]; g.strokeStyle = g.fillStyle;
    if (v < 0.4) { g.beginPath(); g.arc(px, py, s * 0.22, 0, TAU); g.fill(); }
    else if (v < 0.75) { g.lineWidth = s * 0.16; g.lineCap = 'round'; g.beginPath(); g.moveTo(px - Math.cos(a) * s * 0.4, py - Math.sin(a) * s * 0.4); g.lineTo(px + Math.cos(a) * s * 0.4, py + Math.sin(a) * s * 0.4); g.stroke(); }
    else { g.beginPath(); triPts(s * 0.6, a).forEach(([tx, ty], j) => (j ? g.lineTo(px + tx, py - ty) : g.moveTo(px + tx, py - ty))); g.closePath(); g.fill(); }
  }
}
/** Memphis squiggles across [x0, y0, x1, y1]: wavy bands every `s`, their colours cycling through `cols`. */
function squigglesOn(g, x0, y0, x1, y1, s, cols) {
  g.lineCap = 'round'; g.lineWidth = s * 0.16;
  for (let y = y0 + s * 0.5, i = 0; y < y1 + s * 0.5; y += s, i++) {
    g.strokeStyle = cols[i % cols.length]; g.beginPath();
    for (let x = x0 - s; x <= x1 + s; x += s * 0.25) { const yy = y + Math.sin((x - x0) / s * Math.PI * 1.3 + i) * s * 0.22; x === x0 - s ? g.moveTo(x, yy) : g.lineTo(x, yy); }
    g.stroke();
  }
}

/** The painted-only surface of a part (`tex`), inside its outline `path` over bounds bb. */
function texture(q, path, bb, rule = 'nonzero') {
  const g = ctx(), [x0, y0, x1, y1] = bb;
  g.save(); g.clip(path, rule);
  if (q.tex === 'squiggle') squigglesOn(g, x0, y0, x1, y1, q.ts || 3, q.tc || [TB.teal, TB.lime, TB.pink]);
  else if (q.tex === 'confetti') confettiOn(g, x0, y0, x1, y1, q.ts || 3, Math.round(q.x * 7 + q.h * 3), q.c);
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
        const rmax = Math.max(...q.pts.map(p => p[0])), len = Math.max(...q.pts.map(p => p[1]));
        const P = (dx, up) => [cx + flip * dx, cy - up];
        const pts = [...q.pts.map(([r, up]) => P(-r, up)), ...q.pts.slice().reverse().map(([r, up]) => P(r, up))];
        poly(pts, q.c, m, m !== 'glow');
        if (q.tex) texture(q, polyPath(pts), bounds(pts));
        if (m === 'gloss' && rmax > 1.2) {
          const at = q.pts.find(p => p[0] === rmax), [hx, hy] = P(-rmax * 0.48, at[1] * 0.92);
          g.save(); g.globalAlpha *= 0.5; oval(hx, hy, rmax * 0.14, Math.max(0.4, len * 0.1), '#ffffff'); g.restore();
        }
        if (q.pts[q.pts.length - 1][0] < 0.01 && q.pts.length > 2) break;
        const [rt, ut] = q.pts[q.pts.length - 1];
        if (m !== 'glass') oval(cx, cy - ut, rt, rt * 0.22, sh(q.c, m === 'glow' ? 1 : -2));
        break;
      }
      case 'ring': {
        const ry = q.ry ?? q.r;
        if (side && !q.flat) { if (q.arc) break; rbx(cx - q.tr, cy - ry - q.tr, q.tr * 2, (ry + q.tr) * 2, q.tr, q.c, m); break; }
        const a0 = q.arc ? -(q.a0 + q.arc) : 0, a1 = q.arc ? -q.a0 : TAU;
        const path = (dy = 0) => { g.beginPath(); if (q.flat) g.ellipse(cx, cy + dy, q.r, q.r * 0.22, 0, 0, TAU); else g.ellipse(cx, cy + dy, q.r, ry, 0, a0, a1); };
        g.save(); if (m === 'glass') g.globalAlpha *= 0.4;
        g.strokeStyle = m === 'glass' ? '#cfe8f4' : q.c; g.lineWidth = q.tr * 2; path(); g.stroke();
        g.globalAlpha *= 0.45; g.strokeStyle = sh(q.c, 2); g.lineWidth = q.tr * 0.6;
        if (q.flat) { g.beginPath(); g.ellipse(cx, cy - q.tr * 0.4, q.r, q.r * 0.22, 0, Math.PI, TAU); } else path(-q.tr * 0.4);
        g.stroke(); g.restore();
        break;
      }
      case 'rod': {
        const p0 = [U(q.a[0], q.a[2]), b - q.a[1]], p1 = [U(q.b[0], q.b[2]), b - q.b[1]];
        if (Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) < 0.05) { ball(p0[0], p0[1], q.r, q.r, q.c, m); break; }
        g.lineCap = 'round'; g.strokeStyle = m === 'glass' ? alphaOf('#cfe8f4', 0.4) : m === 'glow' ? sh(q.c, 1) : q.c; g.lineWidth = q.r * 2;
        g.beginPath(); g.moveTo(...p0); g.lineTo(...p1); g.stroke();
        if (q.r > 0.6 && m !== 'glass' && m !== 'plain') {
          g.save(); g.globalAlpha *= m === 'glow' ? 0.8 : 0.5; g.strokeStyle = m === 'glow' ? '#ffffff' : sh(q.c, 2); g.lineWidth = q.r * (m === 'glow' ? 0.7 : 0.6);
          const o = m === 'glow' ? 0 : q.r * 0.35;
          g.beginPath(); g.moveTo(p0[0] - o, p0[1] - o); g.lineTo(p1[0] - o, p1[1] - o); g.stroke(); g.restore();
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

/** A memphis print on ground `bg`: squiggles, triangles, rings, dots and confetti, laid out by `seed`. */
function memphis(seed, bg, s = 4) {
  return (g, x, y, w, h) => {
    g.fillStyle = bg; g.fillRect(x, y, w, h);
    const cols = POP.filter(c => c !== bg), col = (i) => cols[Math.floor(hash(i, seed, 31) * cols.length)];
    confettiOn(g, x, y, x + w, y + h, s, seed * 13, bg);
    const n = Math.max(2, Math.round(w * h / (s * s * 14)));
    for (let i = 0; i < n; i++) {
      const px = x + hash(i, seed, 32) * w, py = y + hash(i, seed, 33) * h, v = hash(i, seed, 34), sz = s * (0.9 + hash(i, seed, 35) * 0.8);
      g.fillStyle = col(i); g.strokeStyle = col(i + 7); g.lineCap = 'round';
      if (v < 0.3) {
        g.lineWidth = s * 0.3; g.beginPath();
        for (let k = 0; k <= 8; k++) { const xx = px - sz + k * sz / 4, yy = py + Math.sin(k * 1.4) * sz * 0.25; k ? g.lineTo(xx, yy) : g.moveTo(xx, yy); }
        g.stroke();
      } else if (v < 0.55) { g.beginPath(); triPts(sz, hash(i, seed, 36) * TAU).forEach(([tx, ty], j) => (j ? g.lineTo(px + tx, py - ty) : g.moveTo(px + tx, py - ty))); g.closePath(); g.fill(); }
      else if (v < 0.75) { g.lineWidth = s * 0.28; g.beginPath(); g.arc(px, py, sz * 0.45, 0, TAU); g.stroke(); }
      else if (v < 0.9) { g.beginPath(); g.arc(px, py, sz * 0.35, 0, TAU); g.fill(); }
      else { g.lineWidth = s * 0.24; g.beginPath(); for (let k = 0; k < 5; k++) { g.moveTo(px - sz * 0.6 + k * sz * 0.3, py - sz * 0.4); g.lineTo(px - sz * 0.9 + k * sz * 0.3, py + sz * 0.4); } g.stroke(); }
    }
  };
}

/** A little Pikachu face drawn in one ink about cx, cy, r its head's radius (the handheld's screen, a skateboard). */
function pikaOn(g, cx, cy, r, ink, body, cheek) {
  if (body) {
    g.fillStyle = body;
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * r * 0.5, cy - r * 0.6); g.lineTo(cx + s * r * 1.2, cy - r * 1.9); g.lineTo(cx + s * r * 0.95, cy - r * 0.3); g.closePath(); g.fill(); }
    g.beginPath(); g.ellipse(cx, cy, r, r * 0.85, 0, 0, TAU); g.fill();
  }
  g.fillStyle = ink;
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * r * 1.03, cy - r * 1.55); g.lineTo(cx + s * r * 1.2, cy - r * 1.9); g.lineTo(cx + s * r * 0.9, cy - r * 1.48); g.closePath(); g.fill(); }
  if (!body) {
    g.strokeStyle = ink; g.lineWidth = r * 0.14;
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * r * 0.5, cy - r * 0.6); g.lineTo(cx + s * r * 1.2, cy - r * 1.9); g.lineTo(cx + s * r * 0.95, cy - r * 0.3); g.stroke(); }
    g.beginPath(); g.ellipse(cx, cy, r, r * 0.85, 0, 0, TAU); g.stroke();
  }
  for (const s of [-1, 1]) { g.beginPath(); g.arc(cx + s * r * 0.4, cy - r * 0.15, r * 0.14, 0, TAU); g.fill(); }
  g.fillStyle = cheek || ink; for (const s of [-1, 1]) { g.beginPath(); g.arc(cx + s * r * 0.66, cy + r * 0.25, r * 0.17, 0, TAU); g.fill(); }
  g.fillStyle = ink; g.beginPath(); g.arc(cx, cy + r * 0.1, r * 0.06, 0, TAU); g.fill();
}

/** The handheld's whole face: grey shell, a green screen with Pikachu, a d-pad, two magenta buttons, start and select. */
function handheld(g, x, y, w, h) {
  g.fillStyle = '#c9c6cc'; g.fillRect(x, y, w, h);
  g.fillStyle = '#5c5a6c'; g.beginPath(); g.roundRect(x + w * 0.1, y + h * 0.07, w * 0.8, h * 0.44, [w * 0.06, w * 0.06, w * 0.2, w * 0.06]); g.fill();
  g.fillStyle = TB.gbScreen; g.fillRect(x + w * 0.22, y + h * 0.12, w * 0.56, h * 0.34);
  pikaOn(g, x + w * 0.5, y + h * 0.33, w * 0.11, TB.gbInk, '#c4d84a', TB.gbInk);
  g.fillStyle = TB.ink; g.fillRect(x + w * 0.14, y + h * 0.64, w * 0.24, w * 0.08); g.fillRect(x + w * 0.22, y + h * 0.64 - w * 0.08, w * 0.08, w * 0.24);
  g.fillStyle = '#b02a6a'; for (const [fx, fy] of [[0.66, 0.68], [0.82, 0.62]]) { g.beginPath(); g.arc(x + w * fx, y + h * fy, w * 0.07, 0, TAU); g.fill(); }
  g.fillStyle = TB.greyD; for (const fx of [0.38, 0.54]) { g.beginPath(); g.roundRect(x + w * fx, y + h * 0.84, w * 0.12, h * 0.025, h * 0.012); g.fill(); }
  g.strokeStyle = TB.greyD; g.lineWidth = w * 0.025; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(x + w * (0.7 + i * 0.06), y + h * 0.97); g.lineTo(x + w * (0.78 + i * 0.06), y + h * 0.88); g.stroke(); }
}

/** The CRT's picture: a cartoon morning over green hills, a Poké Ball sun, scanlines and the glass's glare. */
function crt(g, x, y, w, h) {
  const sky = g.createLinearGradient(0, y, 0, y + h); sky.addColorStop(0, '#5ab8f0'); sky.addColorStop(1, '#bfe8ff');
  g.fillStyle = sky; g.fillRect(x, y, w, h);
  const bx = x + w * 0.72, by = y + h * 0.3, br = h * 0.17;
  g.fillStyle = '#f04040'; g.beginPath(); g.arc(bx, by, br, Math.PI, TAU); g.fill();
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(bx, by, br, 0, Math.PI); g.fill();
  g.fillStyle = TB.ink; g.fillRect(bx - br, by - br * 0.1, br * 2, br * 0.2); g.beginPath(); g.arc(bx, by, br * 0.32, 0, TAU); g.fill();
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(bx, by, br * 0.18, 0, TAU); g.fill();
  g.fillStyle = '#58c048'; g.beginPath(); g.ellipse(x + w * 0.25, y + h * 1.05, w * 0.45, h * 0.4, 0, 0, TAU); g.fill();
  g.fillStyle = '#3c9a38'; g.beginPath(); g.ellipse(x + w * 0.85, y + h * 1.1, w * 0.4, h * 0.38, 0, 0, TAU); g.fill();
  pikaOn(g, x + w * 0.3, y + h * 0.62, h * 0.11, TB.ink, '#ffd83a', '#f05050');
  g.fillStyle = 'rgba(0,0,0,0.12)'; for (let yy = y; yy < y + h; yy += 0.8) g.fillRect(x, yy, w, 0.3);
  const gl = g.createRadialGradient(x + w * 0.3, y + h * 0.25, 0, x + w * 0.3, y + h * 0.25, w * 0.6); gl.addColorStop(0, 'rgba(255,255,255,0.35)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gl; g.fillRect(x, y, w, h);
  g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 1; g.beginPath(); g.roundRect(x + 0.5, y + 0.5, w - 1, h - 1, 2); g.stroke();
}

/** A cassette's face in shell colour c: a label with a stripe, a dark window with two toothed reels. */
function cassette(c, stripe) {
  return (g, x, y, w, h) => {
    g.fillStyle = c; g.fillRect(x, y, w, h);
    g.fillStyle = TB.white; g.fillRect(x + w * 0.08, y + h * 0.1, w * 0.84, h * 0.55);
    g.fillStyle = stripe; g.fillRect(x + w * 0.08, y + h * 0.16, w * 0.84, h * 0.08);
    g.fillStyle = TB.ink; g.beginPath(); g.roundRect(x + w * 0.25, y + h * 0.32, w * 0.5, h * 0.24, h * 0.1); g.fill();
    for (const fx of [0.36, 0.64]) {
      g.fillStyle = TB.white; g.beginPath(); g.arc(x + w * fx, y + h * 0.44, h * 0.09, 0, TAU); g.fill();
      g.fillStyle = TB.ink; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; g.fillRect(x + w * fx + Math.cos(a) * h * 0.05 - 0.15, y + h * 0.44 + Math.sin(a) * h * 0.05 - 0.15, 0.3, 0.3); }
    }
    g.fillStyle = sh(c, -1); g.beginPath(); g.moveTo(x + w * 0.2, y + h); g.lineTo(x + w * 0.27, y + h * 0.76); g.lineTo(x + w * 0.73, y + h * 0.76); g.lineTo(x + w * 0.8, y + h); g.fill();
  };
}

/** The wall clock's dial: black, neon ticks in pink and teal, a lime triangle at twelve, white hands at ten past ten. */
function dial(g, x, y, w, h) {
  const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2;
  g.fillStyle = TB.teal; g.fillRect(x, y, w, h);
  g.fillStyle = TB.ink; g.beginPath(); g.arc(cx, cy, r * 0.97, 0, TAU); g.fill();
  g.lineCap = 'round';
  for (let i = 1; i < 12; i++) {
    if (i % 3 === 0) continue;
    const a = i / 12 * TAU - Math.PI / 2; g.strokeStyle = i % 2 ? TB.pink : TB.teal; g.lineWidth = r * 0.08;
    g.beginPath(); g.moveTo(cx + Math.cos(a) * r * 0.62, cy + Math.sin(a) * r * 0.62); g.lineTo(cx + Math.cos(a) * r * 0.78, cy + Math.sin(a) * r * 0.78); g.stroke();
  }
  g.fillStyle = TB.yellow; for (const i of [3, 6, 9]) { const a = i / 12 * TAU - Math.PI / 2; g.beginPath(); g.arc(cx + Math.cos(a) * r * 0.7, cy + Math.sin(a) * r * 0.7, r * 0.1, 0, TAU); g.fill(); }
  g.fillStyle = TB.lime; g.beginPath(); triPts(r * 0.3, Math.PI).forEach(([tx, ty], j) => (j ? g.lineTo(cx + tx, cy - r * 0.58 - ty) : g.moveTo(cx + tx, cy - r * 0.58 - ty))); g.closePath(); g.fill();
  g.strokeStyle = TB.white;
  for (const [a, len, lw] of [[-150, 0.4, 0.1], [-30, 0.58, 0.06]]) { const t = a * Math.PI / 180; g.lineWidth = r * lw; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(t) * r * len, cy + Math.sin(t) * r * len); g.stroke(); }
  g.fillStyle = TB.pink; g.beginPath(); g.arc(cx, cy, r * 0.09, 0, TAU); g.fill();
}

/** A skateboard's underside graphic: `seed` 0 memphis on pink, 1 a Pikachu and bolts on yellow, 2 confetti on teal. */
function deck(seed) {
  return (g, x, y, w, h) => {
    if (seed === 0) { memphis(9, TB.pink, 2.6)(g, x, y, w, h); return; }
    if (seed === 2) { g.fillStyle = TB.teal; g.fillRect(x, y, w, h); squigglesOn(g, x, y, x + w, y + h, 3.4, [TB.ink, TB.lime, TB.white]); return; }
    g.fillStyle = TB.yellow; g.fillRect(x, y, w, h);
    g.fillStyle = TB.ink;
    for (const fy of [0.2, 0.8]) { g.beginPath(); [[0.55, -0.1], [0.25, 0.02], [0.5, 0.02], [0.35, 0.12], [0.75, -0.02], [0.5, -0.02], [0.65, -0.1]].forEach(([fx, dy], i) => (i ? g.lineTo(x + w * fx, y + h * (fy + dy)) : g.moveTo(x + w * fx, y + h * (fy + dy)))); g.fill(); }
    pikaOn(g, x + w / 2, y + h * 0.52, w * 0.3, TB.ink, null, '#f05050');
  };
}

/** The phone's keypad: twelve buttons on its see-through front, the guts glowing pink behind. */
function keypad(g, x, y, w, h) {
  g.fillStyle = 'rgba(255,90,170,0.55)'; g.fillRect(x, y, w, h);
  for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) { g.fillStyle = (i + j) % 3 ? TB.white : TB.tealL; g.beginPath(); g.roundRect(x + w * (0.06 + i * 0.235), y + h * (0.1 + j * 0.3), w * 0.18, h * 0.22, 0.3); g.fill(); }
}

/** The pocket pet's screen: a grey-green LCD with Togepi in its shell, a heart meter above. */
function petScreen(g, x, y, w, h) {
  g.fillStyle = TB.lcd; g.fillRect(x, y, w, h);
  const cx = x + w / 2, cy = y + h * 0.6, r = w * 0.2, ink = TB.lcdD;
  g.fillStyle = ink; g.beginPath(); g.arc(cx, cy - r * 0.7, r * 0.75, 0, TAU); g.fill();
  g.fillStyle = TB.lcd; g.beginPath(); g.arc(cx, cy - r * 0.7, r * 0.55, 0, TAU); g.fill();
  g.fillStyle = ink; for (const s of [-1, 1]) { g.beginPath(); g.arc(cx + s * r * 0.24, cy - r * 0.78, r * 0.1, 0, TAU); g.fill(); }
  for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(cx - r * 0.25 + i * r * 0.25, cy - r * 1.4); g.lineTo(cx - r * 0.12 + i * r * 0.25, cy - r * 1.7); g.lineTo(cx + i * r * 0.25, cy - r * 1.4); g.fill(); }
  g.beginPath(); g.moveTo(cx - r, cy - r * 0.2); for (let i = 0; i <= 6; i++) g.lineTo(cx - r + i * r / 3, cy - r * (i % 2 ? 0.55 : 0.2)); g.lineTo(cx + r, cy + r * 0.6); g.quadraticCurveTo(cx, cy + r * 1.1, cx - r, cy + r * 0.6); g.closePath(); g.fill();
  g.fillStyle = TB.lcd; g.beginPath(); g.arc(cx - r * 0.4, cy + r * 0.3, r * 0.16, 0, TAU); g.arc(cx + r * 0.45, cy + r * 0.1, r * 0.14, 0, TAU); g.fill();
  g.fillStyle = ink; for (let i = 0; i < 3; i++) { const hx = x + w * (0.2 + i * 0.16), hy = y + h * 0.14; g.beginPath(); g.arc(hx - w * 0.025, hy, w * 0.03, 0, TAU); g.arc(hx + w * 0.025, hy, w * 0.03, 0, TAU); g.moveTo(hx - w * 0.055, hy + w * 0.01); g.lineTo(hx, hy + w * 0.07); g.lineTo(hx + w * 0.055, hy + w * 0.01); g.fill(); }
}

/** The boombox's tape deck: a grey door with a window on a cassette, play and stop keys above. */
function tapeDeck(g, x, y, w, h) {
  g.fillStyle = TB.inkL; g.fillRect(x, y, w, h);
  for (let i = 0; i < 4; i++) { g.fillStyle = [TB.pink, TB.teal, TB.lime, TB.yellow][i]; g.fillRect(x + w * (0.08 + i * 0.23), y + h * 0.04, w * 0.18, h * 0.12); }
  g.fillStyle = TB.grey; g.beginPath(); g.roundRect(x + w * 0.06, y + h * 0.24, w * 0.88, h * 0.7, 0.6); g.fill();
  cassette(TB.purpleL, TB.pink)(g, x + w * 0.16, y + h * 0.34, w * 0.68, h * 0.48);
  g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(x + w * 0.16, y + h * 0.34, w * 0.68, h * 0.48);
}

/** The console's front plate: its slot's lip, a power light and a name stripe. */
function consoleFace(g, x, y, w, h) {
  g.fillStyle = TB.grey; g.fillRect(x, y, w, h);
  g.fillStyle = TB.purple; g.fillRect(x, y + h * 0.55, w, h * 0.2);
  g.fillStyle = TB.ink; for (const fx of [0.12, 0.32]) { g.beginPath(); g.roundRect(x + w * fx, y + h * 0.15, w * 0.14, h * 0.3, 0.3); g.fill(); }
  g.fillStyle = TB.pink; g.beginPath(); g.arc(x + w * 0.86, y + h * 0.3, h * 0.12, 0, TAU); g.fill();
  g.fillStyle = TB.white; g.fillRect(x + w * 0.55, y + h * 0.6, w * 0.24, h * 0.08);
}

/* ---------- the kinds ---------- */

/** What js/base-models-throwback.js builds for each upright and wall kind: its parts, doors and default material. */
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

const ballFoot = (x, z, r, c = TB.lime) => S(x, r, z, r, r, r, c, { m: 'gloss', seg: 8 });
const cones = (x, z, r, hh, c) => C(x, hh / 2, z, r * 0.55, hh, c, { rb: r, m: 'gloss', seg: 10 });

/** The cassettes: a stack of n at x, z from h, each 11 x 2 x 8, their colours from `seed`; the spines' labels white. */
function tapeStack(x, z, h, n, seed) {
  const cols = [TB.pink, TB.teal, TB.lime, TB.purpleL, TB.yellow, TB.ink, TB.orange], out = [];
  for (let i = 0; i < n; i++) {
    const dx = (hash(i, seed, 41) - 0.5) * 2.4, dz = (hash(i, seed, 42) - 0.5) * 2, c = cols[(i * 3 + seed) % cols.length], hh = h + 1 + i * 2.1;
    out.push(B(x + dx, hh, z + dz, 12, 2, 8, c, { m: 'gloss', r: 0.5 }), B(x + dx, hh, z + dz + 4.05, 8, 0.9, 0.2, TB.white, { m: 'plain', r: 0.2 }));
  }
  return out;
}

/** A neon letter's strokes, in a 7 x 12 box from x, h. */
const LETTERS = {
  R: [[[0, 0], [0, 12]], [[0, 12], [4.6, 12]], [[4.6, 12], [7, 10]], [[7, 10], [7, 8]], [[7, 8], [4.6, 6]], [[4.6, 6], [0, 6]], [[3, 6], [7, 0]]],
  A: [[[0, 0], [3.5, 12]], [[3.5, 12], [7, 0]], [[1.5, 5], [5.5, 5]]],
  D: [[[0, 0], [0, 12]], [[0, 12], [4, 12]], [[4, 12], [7, 9]], [[7, 9], [7, 3]], [[7, 3], [4, 0]], [[4, 0], [0, 0]]],
  '!': [[[0, 4], [0, 12]], [[0, 0.4], [0, 0.6]]],
};
const neon = (ch, x, h, z, c) => LETTERS[ch].map(([[ax, ah], [bx, bh]]) => RD([x + ax, h + ah, z], [x + bx, h + bh, z], 0.8, c, GW));

export const THROWBACK_KINDS = [
  // a black bed on lime ball feet: a purple squiggle duvet, a teal fold, pink and teal pillows, a memphis headboard
  // crowned with a pink ball and a lime triangle, a teal tube along its top, a memphis footboard
  piece('thbbed', 'Throwback squiggle bed', 2, 2, 1400, 'gloss', [
    ...[[5, -26], [59, -26], [5, 26], [59, 26]].map(([x, z]) => ballFoot(x, z, 2.6)),
    B(32, 26, -28.5, 62, 40, 4, TB.ink, { r: 3 }),
    PC(32, 31, -26.4, 56, 26, memphis(1, TB.purpleD)),
    RD([3, 46.5, -28.5], [61, 46.5, -28.5], 2.2, TB.teal, GL),
    S(13, 52, -28.5, 4.4, 4.4, 3.4, TB.pink, GL), PR(51, 47, -28.5, triPts(11), 3.4, TB.lime),
    B(32, 9, 1, 62, 10, 58, TB.ink, { r: 3 }),
    B(32, 15.5, 1, 58, 5, 54, TB.white, { m: 'cloth', r: 2 }),
    B(32, 19.4, 6, 60, 3.8, 44, TB.purple, { m: 'cloth', r: 1.6, tex: 'squiggle', ts: 3.2 }),
    B(32, 19.8, -17.5, 60, 4, 6, TB.teal, { m: 'cloth', r: 1.6 }),
    S(20, 22.4, -22, 9, 3.6, 4.6, TB.pinkL, CL), S(44, 22.4, -22, 9, 3.6, 4.6, TB.tealL, CL),
    B(32, 13, 29.5, 62, 18, 3, TB.ink, { r: 1.6 }),
    PC(32, 13, 31.05, 56, 13, memphis(2, TB.teal, 3)),
  ]),

  // an inflatable armchair in see-through pink and purple: a ring for its base, a ring seat with a cushion in it, a
  // ring for its back and two tube arms
  piece('thbchair', 'Throwback inflatable chair', 1, 1, 380, 'gloss', [
    RG(16, 4, 2, 10.4, 4, TB.purple, { flat: true }),
    S(16, 9.6, 2, 10, 2.6, 9.6, TB.purpleL),
    RG(16, 11.6, 2, 10, 3.4, TB.pink, { flat: true }),
    RG(16, 24, -9, 8.6, 3.6, TB.purple),
    DS(16, 24, -9, 6, 1.6, TB.pinkL),
    ...[4.4, 27.6].map(x => RD([x, 16.6, -9], [x, 16.6, 8], 3.4, TB.pink, GL)),
  ]),

  // a memphis sofa: a black plinth on lime cone feet, teal cushions, a purple back in a memphis print, round pink
  // bolster arms, a lime triangle cushion and a yellow ball
  piece('thbsofa', 'Throwback memphis sofa', 2, 1, 1100, 'cloth', [
    ...[[8, -9], [56, -9], [8, 9], [56, 9]].map(([x, z]) => cones(x, z, 2.6, 3, TB.lime)),
    B(32, 6, 0, 60, 6, 26, TB.ink, { m: 'gloss', r: 2 }),
    B(32, 21, -9.5, 54, 22, 7, TB.purple, { r: 3 }),
    PC(32, 24.5, -5.95, 50, 14, memphis(3, TB.purple, 3.4)),
    ...[19.5, 44.5].map(x => B(x, 12, 3, 25, 6, 20, TB.teal, { r: 2 })),
    ...[5, 59].map(x => RD([x, 14, -12], [x, 14, 12], 5.6, TB.pink, GL)),
    PR(46, 15, 1, triPts(12), 3, TB.lime, CL),
    S(18, 18.4, 1, 4.4, 4.4, 3, TB.yellow, GL),
  ]),

  // a memphis side table: a black foot, a lime column, a pink ball, a teal neck, a round black top with a confetti rim
  piece('thbtable', 'Throwback memphis table', 1, 1, 450, 'gloss', [
    C(16, 1.2, 0, 9, 2.4, TB.ink, { seg: 16 }),
    C(16, 7.4, 0, 4.6, 10, TB.lime, { seg: 12 }),
    S(16, 15, 0, 6.4, 5.4, 6.4, TB.pink),
    C(16, 21.4, 0, 4.4, 5, TB.teal, { seg: 12 }),
    C(16, 25, 0, 14.6, 2.6, TB.ink, { seg: 20, tex: 'confetti', ts: 2.2 }),
    C(16, 26.5, 0, 13.4, 0.4, TB.white, { seg: 20, m: 'plain' }),
  ]),

  // a homework desk: a purple pedestal with teal and pink drawers on lime knobs, lime legs, a black top, a pencil cup,
  // two notebooks and a grey handheld with Pikachu on its screen
  piece('thbdesk', 'Throwback homework desk', 2, 1, 900, 'gloss', [
    B(12, 12, 0, 20, 24, 24, TB.purple, { r: 2 }),
    ...[[18, TB.teal], [8, TB.pink]].flatMap(([h, c]) => [B(12, h, 12.3, 16, 8, 0.8, c, { r: 1.2 }), S(12, h, 13, 1.5, 1.5, 1, TB.lime, { seg: 8 })]),
    ...[-9, 9].map(z => C(55, 12, z, 2.2, 24, TB.lime, { seg: 10 })),
    ...[-9, 9].map(z => S(55, 1.6, z, 2.6, 1.6, 2.6, TB.pink, { seg: 8 })),
    B(32, 25.5, 0, 62, 3, 28, TB.ink, { r: 1 }),
    C(20, 30, -6, 2.6, 6, TB.teal, { seg: 10 }),
    RD([19.4, 30, -6], [18.4, 37, -6.4], 0.45, TB.yellow, PL), RD([20.6, 30, -6], [22, 36, -5.6], 0.45, TB.pink, PL),
    B(52, 27.9, -1, 13, 1.8, 9, TB.pink, { r: 0.4 }), B(52.4, 29.6, -1.2, 11, 1.6, 8, TB.yellow, { r: 0.4 }),
    B(37, 34.6, -6, 10, 14, 2.4, TB.grey, { r: 1 }),
    PC(37, 34.6, -4.75, 10, 14, handheld),
    B(37, 27.6, -4, 8, 1.2, 4, TB.ink, { r: 0.4 }),
  ]),

  // a purple wardrobe on lime feet, a memphis crown of a teal half-disc, a pink ball and a lime triangle, its two doors
  // teal and pink in memphis prints with yellow knobs
  piece('thbwardrobe', 'Throwback wardrobe', 2, 1, 1200, 'gloss', [
    ...[[6, -10], [58, -10], [6, 8], [58, 8]].map(([x, z]) => C(x, 2, z, 2.4, 4, TB.lime, { seg: 10 })),
    B(32, 36, -1, 58, 64, 26, TB.purple, { r: 3 }),
    B(32, 70, -1, 62, 4, 28, TB.ink, { r: 1.4 }),
    PR(17, 72, -1, arch(8, 8), 4, TB.teal), S(33, 76.4, -1, 4.4, 4.4, 4.4, TB.pink), PR(48, 72, -1, triPts(12), 4, TB.lime),
  ], {
    doors: [4, 60].map((hx, i) => {
      const x = i ? 46 : 18, c = i ? TB.pink : TB.teal;
      return { hinge: [hx, 12.6], side: i ? -1 : 1, parts: [
        B(x, 36.5, 12.6, 27, 60, 1.4, c, { r: 2 }),
        PC(x, 36.5, 13.35, 23, 56, memphis(4 + i, c, 3.6)),
        S(i ? 34.6 : 29.4, 36.5, 14, 1.6, 1.6, 1.2, TB.yellow, { seg: 8 }),
      ] };
    }),
    inside: { x: 32, h: 36.5, w: 52, hh: 58, z: 12 },
  }),

  // a black chest of six drawers in teal, pink, lime, purple, yellow and teal on pink feet, a teal top, a glowing
  // Porygon lamp and a purple trinket box on it
  piece('thbdresser', 'Throwback chest of drawers', 2, 1, 850, 'gloss', [
    ...[[6, -10], [58, -10], [6, 10], [58, 10]].map(([x, z]) => C(x, 2, z, 2.4, 4, TB.pink, { seg: 10 })),
    B(32, 16, 0, 60, 24, 26, TB.ink, { r: 2 }),
    ...[[23.4, TB.teal, TB.pink], [16, TB.pink, TB.lime], [8.6, TB.lime, TB.purpleL]].flatMap(([h, a, c], j) => [17.5, 46.5].flatMap((x, i) => [
      B(x, h, 13.2, 26, 6.4, 0.8, i ? c : a, { r: 1 }), S(x, h, 13.9, 1.4, 1.4, 1, i ? TB.yellow : TB.white, { seg: 8 }),
    ])),
    B(32, 29.2, 0, 62, 2.4, 28, TB.teal, { r: 1 }),
    B(16, 32.6, -3, 11, 4.4, 8, TB.purple, { r: 1 }), S(16, 35.8, -3, 1.6, 1.4, 1.6, TB.lime, { seg: 8 }),
    ...[45.6, 50.4].map(x => B(x, 31.4, -2, 2.6, 2, 3, TB.tealL, { m: 'glow', r: 0.6 })),
    B(48, 36, -2, 9, 7.2, 8, TB.lava, { m: 'glow', r: 1.4 }),
    B(48, 36, -7.4, 4, 3.6, 3, TB.tealL, { m: 'glow', r: 0.8 }),
    B(48, 43.4, -0.6, 8, 6.4, 8.4, TB.lava, { m: 'glow', r: 1.4 }),
    B(48, 42.4, 4.6, 4, 3, 3, TB.tealL, { m: 'glow', r: 0.8 }),
    ...[-1, 1].flatMap(s => [DS(48 + s * 2.4, 45, 3.5, 1.1, 0.3, TB.white, { m: 'plain', seg: 8 }), DS(48 + s * 2.4, 45, 3.7, 0.5, 0.3, TB.ink, { m: 'plain', seg: 6 })]),
  ], { glow: [TB.lava, TB.tealL] }),

  // a black cube shelf, its four boards teal, pink, lime and teal on a purple back: comics, a lime bouncy ball, upright
  // books, a pink pyramid, a yellow star and a teal ball
  piece('thbshelf', 'Throwback cube shelf', 1, 1, 600, 'gloss', [
    ...[2.5, 29.5].map(x => B(x, 32, 0, 3, 64, 16, TB.ink, { r: 1.2 })),
    B(16, 32, -7, 25, 60, 1.4, TB.purpleD, { r: 0.4 }),
    ...[[2, TB.teal], [22, TB.pink], [42, TB.lime], [62.4, TB.teal]].map(([h, c]) => B(16, h, 0, 25, 2, 15.6, c, { r: 0.6 })),
    B(9, 5, 0, 9, 4, 9, TB.pink, { r: 0.4 }), B(9, 8, 0, 8, 2, 8, TB.yellow, { r: 0.4 }),
    S(22, 7.8, 0, 4.8, 4.8, 4.8, TB.lime),
    ...[[6.6, TB.teal, 12], [9.2, TB.purpleL, 11], [11.8, TB.yellow, 12.4], [14.4, TB.white, 10.6]].map(([x, c, hh]) => B(x, 23 + hh / 2, 0, 2.4, hh, 10, c, { r: 0.4 })),
    PR(22.5, 23, 0, triPts(8), 6, TB.pink),
    PR(10, 50, 0, starPts(6), 2.4, TB.yellow),
    S(22, 47, 0, 4, 4, 4, TB.teal),
    PR(16, 63.4, 0, triPts(10), 3, TB.pink),
  ]),

  // a lava lamp on a memphis pedestal: a lime column on a black foot, a purple cone base, a glowing purple bottle with
  // pink blobs rising, a purple cap
  piece('thblamp', 'Throwback lava lamp', 1, 1, 420, 'gloss', [
    C(16, 1.2, 0, 8, 2.4, TB.ink, { seg: 16 }),
    C(16, 11, 0, 5, 17, TB.lime, { seg: 12 }),
    C(16, 20.2, 0, 7, 1.6, TB.ink, { seg: 16 }),
    LA(16, 21, 0, [[6.6, 0], [6.6, 1], [4.6, 11], [4.4, 12]], TB.purple, { seg: 14 }),
    LA(16, 33, 0, [[4.4, 0], [6, 8], [6.2, 16], [3.6, 28], [3, 29]], TB.purpleL, { m: 'glow', seg: 14 }),
    ...[[16, 36, 4.2, 3.4], [14.6, 44, 3, 2.6], [17.6, 51, 2.4, 2], [15.6, 57, 1.6, 1.4]].map(([x, h, rx, ry]) => S(x, h, 6 - rx * 0.7, rx, ry, rx, TB.lava, { m: 'glow', seg: 10 })),
    LA(16, 61.6, 0, [[3, 0], [3.4, 0.4], [2.4, 6], [0, 6.4]], TB.purple, { seg: 12 }),
  ], { glow: [TB.purpleL, TB.lava] }),

  // a memphis wall clock: a pink triangle behind a teal-rimmed black dial, a yellow ball and a lime squiggle
  wallPiece('thbclock', 'Throwback wall clock', 1, 480, 'gloss', [
    PR(14, 46, 1, triPts(26), 2, TB.pink),
    DS(17, 62, 2.4, 11, 2.4, TB.ink, { seg: 20 }),
    RG(17, 62, 3.7, 10.6, 1.1, TB.teal),
    PC(17, 62, 3.7, 19, 19, dial),
    S(6, 72, 3, 3, 3, 2.4, TB.yellow, { seg: 10 }),
    ...zigzag(20, 30, 47, 2.6, 1.4, 4, 0.7, TB.lime, GL),
  ]),

  // a three-panel folding screen, black frames on lime ball feet, a memphis print on each (purple, teal, pink) and a
  // shape on each top
  piece('thbscreen', 'Throwback memphis screen', 2, 1, 650, 'gloss', [
    ...[[11, 4, 6, TB.purple], [32, -4, 7, TB.teal], [53, 4, 8, TB.pink]].flatMap(([x, z, seed, c]) => [
      ...[-7, 7].map(dx => ballFoot(x + dx, z, 1.8)),
      B(x, 31.5, z, 20.4, 57, 2.2, TB.ink, { r: 1.6 }),
      PC(x, 32, z + 1.25, 17, 51, memphis(seed, c, 3.4)),
    ]),
    S(11, 63.4, 4, 3.4, 3.4, 2, TB.pink), PR(32, 60, -4, triPts(8), 2, TB.lime), PR(53, 60, 4, arch(4.4, 4.4, 8), 2, TB.yellow),
    ...[21.5, 42.5].flatMap(x => [16, 48].map(h => B(x, h, 0, 1, 3, 8.4, TB.greyD, { r: 0.3 }))),
  ]),

  // a squiggle-edged mirror: a wavy pink frame, a lime triangle, a teal ball and a yellow zigzag on its edge
  wallPiece('thbmirror', 'Throwback squiggle mirror', 1, 450, 'gloss', [
    PR(16, 62, 0.8, wavyPts(13, 1.4, 9), 1.6, TB.pink),
    DS(16, 62, 1.9, 10, 0.6, TB.mirror, { seg: 24 }),
    PR(6.5, 47, 2.4, triPts(9, 0.3), 1.6, TB.lime),
    S(26, 72.5, 2.6, 3, 3, 2.2, TB.teal, { seg: 10 }),
    ...zigzag(17, 28, 50, 2.6, 1.2, 4, 0.7, TB.yellow, GL),
  ]),

  // the wall's glow-in-the-dark stars: big and little ones, a crescent moon and a ringed planet, pale green-yellow
  wallPiece('thbstars', 'Throwback glow-star wall', 2, 300, 'glow', [
    ...[[8, 82, 4.4, 0.2], [22, 70, 3, -0.3], [36, 86, 2.4, 0.5], [44, 66, 3.8, 0.1], [58, 78, 2.6, -0.4], [12, 58, 2.6, 0.6], [30, 54, 2, 0], [54, 52, 3, 0.3], [4, 70, 1.8, -0.2], [62, 62, 1.8, 0.4]]
      .map(([x, h, r, rot]) => PR(x, h, 0.4, starPts(r, r * 0.45, 5, rot), 0.5, TB.star, GW)),
    PR(28, 74, 0.4, moonPts(5.6), 0.5, TB.star, GW),
    DS(50, 88, 0.6, 3.2, 0.8, TB.star, { m: 'glow', seg: 14 }),
    RG(50, 88, 0.8, 5, 0.5, TB.star, { m: 'glow', ry: 1.6 }),
  ], { glow: [TB.star] }),

  // a neon sign on a black board: RAD! in pink tubes, a teal zigzag under it and a lime star
  wallPiece('thbneon', 'Throwback RAD neon sign', 2, 850, 'gloss', [
    B(32, 64, 0.8, 58, 30, 1.6, TB.ink, { r: 3 }),
    ...neon('R', 12, 61, 2.2, TB.pink), ...neon('A', 22, 61, 2.2, TB.pink), ...neon('D', 32, 61, 2.2, TB.pink), ...neon('!', 44, 61, 2.2, TB.pink),
    ...zigzag(10, 46, 55, 2.2, 1.4, 10, 0.75, TB.teal, GW),
    PR(53, 64, 2, starPts(5, 2.2), 0.8, TB.lime, GW),
  ], { glow: [TB.pink, TB.teal, TB.lime] }),

  // a chunky CRT TV in teal on a black stand with a VCR, rabbit-ear aerials, a side panel of knobs
  piece('thbtv', 'Throwback CRT TV', 1, 1, 1000, 'gloss', [
    ...[[5, -8], [27, -8], [5, 8], [27, 8]].map(([x, z]) => ballFoot(x, z, 1.6, TB.pink)),
    B(16, 10.6, 0, 28, 17, 22, TB.ink, { r: 2 }),
    B(16, 10, 10.8, 22, 6, 1, TB.inkL, { r: 0.6 }), B(16, 9, 11.4, 12, 1, 0.3, TB.ink, { m: 'plain', r: 0.2 }),
    DS(24.6, 11.4, 11.4, 0.7, 0.3, TB.lime, { m: 'glow', seg: 6 }),
    B(16, 33.4, -10, 22, 20, 10, TB.tealD, { r: 3 }),
    B(16, 33.4, 2, 30, 27, 18, TB.teal, { r: 4 }),
    B(13, 34.4, 11.1, 23, 19.4, 0.6, TB.ink, { r: 3 }),
    PC(13, 34.4, 11.45, 19.4, 15.4, crt),
    B(27, 34, 11.1, 3.4, 20, 0.5, TB.tealD, { r: 1 }),
    ...[[40, TB.pink], [35.4, TB.lime]].map(([h, c]) => S(27, h, 11.6, 1.3, 1.3, 1, c, { seg: 8 })),
    ...[30.4, 28].map(h => B(27, h, 11.5, 2.4, 0.8, 0.3, TB.ink, { m: 'plain', r: 0.2 })),
    S(16, 47.4, -4, 3.4, 1.6, 3.4, TB.ink, { seg: 10 }),
    RD([15, 48, -4], [6, 64, -4], 0.4, TB.grey, MT), RD([17, 48, -4], [27, 63, -4], 0.4, TB.grey, MT),
    S(6, 64, -4, 0.9, 0.9, 0.9, TB.grey, MT), S(27, 63, -4, 0.9, 0.9, 0.9, TB.grey, MT),
  ]),

  // a black boombox on a lime crate: two speakers ringed in pink and teal, a tape deck between, a pink top stripe, a
  // chrome handle and an aerial
  piece('thbboombox', 'Throwback boombox', 1, 1, 700, 'gloss', [
    B(16, 4, 0, 26, 8, 18, TB.lime, { r: 1 }),
    ...[6, 26].map(x => B(x, 4, 9.2, 4, 5, 0.6, TB.limeD, { m: 'plain', r: 0.6 })),
    B(16, 17, 0, 31, 18, 11, TB.ink, { r: 3 }),
    B(16, 25.4, 0, 28, 1.4, 10, TB.pink, { r: 0.6 }),
    ...[[6.6, TB.pink], [25.4, TB.teal]].flatMap(([x, c]) => [
      DS(x, 16, 5.6, 5.4, 0.6, TB.inkL, { seg: 16 }), RG(x, 16, 6, 5.2, 0.8, c), S(x, 16, 5.8, 2.2, 2.2, 1.4, TB.greyD, { seg: 10 }),
    ]),
    PC(16, 16.6, 5.65, 8.4, 10, tapeDeck),
    RG(16, 25.6, 0, 11, 1, TB.grey, { m: 'metal', a0: 0, arc: Math.PI, ry: 6 }),
    ...[5, 27].map(x => B(x, 26.6, 0, 2.4, 1.6, 2.4, TB.greyD, { m: 'metal', r: 0.4 })),
    RD([27, 26, -3], [30.4, 42, -3], 0.35, TB.grey, MT),
  ]),

  // two stacks of cassettes in every colour, white labels on their spines, one stood up in front showing its reels
  piece('thbtapes', 'Throwback cassette stack', 1, 1, 180, 'gloss', [
    ...tapeStack(9.6, -2, 0, 7, 0), ...tapeStack(23, -3, 0, 5, 3),
    B(22.4, 16.2, -2, 12, 8, 2, TB.teal, { r: 0.6 }),
    PC(22.4, 16.2, -0.95, 12, 8, cassette(TB.teal, TB.pink)),
    B(18, 4.4, 9, 12, 8, 2, TB.pink, { r: 0.6 }),
    PC(18, 4.4, 10.05, 12, 8, cassette(TB.pink, TB.lime)),
  ]),

  // a hot-pink beanbag sprinkled with confetti, slumped into a back, a teal cushion on it
  piece('thbbeanbag', 'Throwback beanbag', 1, 1, 450, 'cloth', [
    S(16, 7.6, 1.5, 14.4, 7.6, 13.4, TB.pink, { seg: 16, tex: 'confetti', ts: 2.6 }),
    S(16, 15.4, -6, 12.6, 10, 7.4, TB.pink, { seg: 14, tex: 'confetti', ts: 2.6 }),
    S(16, 13.6, 2.4, 9, 2.6, 7, TB.pinkD, { seg: 12 }),
    S(22.6, 16.6, 1, 5, 3.6, 2.4, TB.teal, { seg: 10 }),
  ]),

  // a purple TV cube holding a row of cartridges, a grey console on top with one plugged in, two pads with cords and
  // three more cartridges stood beside it
  piece('thbconsole', 'Throwback console and cartridges', 1, 1, 800, 'gloss', [
    B(16, 7, -1, 28, 14, 22, TB.purple, { r: 2 }),
    B(16, 6.4, 9, 24, 9, 2.4, TB.ink, { r: 0.6 }),
    ...[TB.pink, TB.teal, TB.lime, TB.yellow, TB.grey, TB.purpleL].map((c, i) => B(7 + i * 3.6, 6.4, 10.4, 2.8, 7.4, 1.6, c, { r: 0.4 })),
    B(13, 16.4, -3, 18, 4.4, 13, TB.grey, { r: 1.4 }),
    PC(13, 16.4, 3.55, 17, 4, consoleFace),
    B(13, 20.4, -5, 9, 4.6, 1.8, TB.pink, { r: 0.4 }),
    ...[[8, 7], [19, 6]].flatMap(([x, z]) => [B(x, 14.9, z, 7, 1.4, 4, TB.grey, { r: 0.7 }), S(x - 2, 15.7, z + 0.6, 0.7, 0.5, 0.7, TB.ink, { seg: 6 }), S(x + 2, 15.7, z + 0.6, 0.7, 0.5, 0.7, TB.pink, { seg: 6 })]),
    RD([8, 14.8, 5], [11, 14.8, 1], 0.3, TB.inkL, PL), RD([19, 14.8, 4], [15, 14.8, 3.4], 0.3, TB.inkL, PL),
    ...[[24.6, TB.teal], [27.2, TB.lime], [29.8, TB.yellow]].map(([x, c]) => B(x, 18.4, -6, 2.2, 7.6, 6, c, { r: 0.4 })),
  ]),

  // a see-through landline phone, its pink guts showing, a teal handset in its cradle and a curly cord, on a memphis
  // side table
  piece('thbphone', 'Throwback see-through phone', 1, 1, 320, 'gloss', [
    C(16, 1, 0, 8, 2, TB.ink, { seg: 16 }),
    C(16, 11, 0, 4.6, 18, TB.pink, { seg: 12, rb: 5.6 }),
    C(16, 21, 0, 11, 2, TB.teal, { seg: 20 }),
    B(16, 24.6, 0, 10, 4, 7, TB.lava, { m: 'plain', r: 1 }),
    B(16, 25, 0, 14, 6, 10, TB.white, { m: 'glass', r: 2 }),
    PC(16, 25.3, 5.1, 8.4, 3.6, keypad),
    RD([10, 29.6, -1], [22, 29.6, -1], 1.5, TB.teal, GL),
    S(9.6, 29.4, -1, 2.6, 2, 3.4, TB.teal, { seg: 10 }), S(22.4, 29.4, -1, 2.6, 2, 3.4, TB.teal, { seg: 10 }),
    ...Array.from({ length: 5 }, (_, i) => RG(5.6, 26 - i * 1.4, 1.5, 1.1, 0.35, TB.teal, { flat: true })),
  ]),

  // a mini basketball hoop: a black weighted foot, a chrome pole, a see-through backboard with a pink square, an orange
  // rim and a white net, a ball on the foot
  piece('thbhoop', 'Throwback mini hoop', 1, 1, 550, 'gloss', [
    B(16, 2.4, -1, 26, 4.8, 22, TB.ink, { r: 2 }),
    RD([16, 4, -8], [16, 64, -8], 1.2, TB.grey, MT),
    B(16, 66, -6.4, 28, 18, 1.2, TB.white, { m: 'glass', r: 1 }),
    B(16, 66, -5.6, 28, 18, 0.3, TB.teal, { m: 'plain', r: 1 }),
    B(16, 66, -5.3, 26, 16, 0.3, TB.white, { m: 'plain', r: 0.6 }),
    B(16, 63.4, -5.1, 10, 7.4, 0.3, TB.pink, { m: 'plain', r: 0.2 }), B(16, 63.4, -4.9, 8, 5.4, 0.3, TB.white, { m: 'plain', r: 0.1 }),
    LA(16, 51, 0, [[3.4, 0], [4.6, 7], [4.8, 7.6]], TB.white, { m: 'cloth', seg: 12 }),
    RG(16, 59, 0, 5, 0.6, TB.orange, { flat: true }),
    RD([16, 59, -5], [16, 59, -4.4], 0.6, TB.orange, GL),
    S(8, 9.2, 5, 4.4, 4.4, 4.4, TB.orange, { seg: 12 }),
  ]),

  // a lime rack of three skateboards stood up, their undersides showing: a memphis deck, a Pikachu deck and a squiggle
  // deck, on yellow, white and pink wheels
  piece('thbskate', 'Throwback skateboard rack', 1, 1, 500, 'gloss', [
    B(16, 2, -4, 30, 4, 16, TB.lime, { r: 1 }),
    ...[2.5, 29.5].map(x => RD([x, 3, -10], [x, 50, -10], 1, TB.lime, GL)), RD([2.5, 48, -10], [29.5, 48, -10], 0.9, TB.lime, GL),
    ...[[7, -6, 0, TB.yellow], [16, -4, 1, TB.white], [25, -6, 2, TB.pink]].flatMap(([x, z, seed, wc]) => [
      B(x, 27, z, 8.6, 44, 1.4, TB.ink, { r: 4 }),
      PC(x, 27, z + 0.75, 7.4, 40, deck(seed)),
      ...[10, 44].flatMap(h => [B(x, h, z + 1.4, 5, 1, 1.4, TB.grey, { m: 'metal', r: 0.3 }), ...[-1, 1].map(s => S(x + s * 2.6, h, z + 2.4, 1.3, 1.3, 1.2, wc, { seg: 8 }))]),
    ]),
  ]),

  // a see-through habitat on a purple tray, a teal lid, a pink tube up to a lookout pod, a lime wheel, Dedenne inside
  piece('thbcage', 'Throwback Dedenne habitat', 1, 1, 650, 'gloss', [
    B(16, 3, 0, 28, 6, 22, TB.purple, { r: 1.4 }),
    B(16, 6.4, 0, 26, 0.8, 20, TB.dedeL, { m: 'cloth', r: 0.3 }),
    RG(9.4, 15, -3, 6, 0.8, TB.lime), RD([9.4, 7, -4.4], [9.4, 15, -4.4], 0.6, TB.lime, GL),
    S(21, 10.6, 2, 4.4, 3.8, 4, TB.dede, { m: 'cloth', seg: 10 }),
    S(21, 15.6, 3, 3.6, 3.2, 3.2, TB.dede, { m: 'cloth', seg: 10 }),
    S(21, 15, 5.6, 2.4, 1.8, 1, TB.dedeL, { m: 'cloth', seg: 8 }),
    ...[-1, 1].flatMap(s => [
      DS(21 + s * 4.6, 18.6, 2.4, 2.8, 0.8, TB.dede, { m: 'cloth', seg: 10 }), DS(21 + s * 4.6, 18.6, 2.9, 1.8, 0.3, TB.dedeL, { m: 'plain', seg: 8 }),
      DS(21 + s * 1.4, 16.2, 6.1, 0.55, 0.3, TB.ink, { m: 'plain', seg: 6 }), DS(21 + s * 2.4, 14.4, 5.7, 0.7, 0.3, TB.orange, { m: 'plain', seg: 6 }),
      RD([21 + s * 0.6, 18.4, 3], [21 + s * 1.6, 21, 2], 0.25, TB.ink, PL),
    ]),
    B(16, 18.4, 0, 28, 24, 22, TB.white, { m: 'glass', r: 1 }),
    B(16, 31.2, 0, 28, 2, 22, TB.teal, { r: 0.8 }),
    RD([24, 32, -2], [24, 42, -2], 2.6, TB.pink, GL),
    S(24, 45.4, -2, 4.6, 4.2, 4.6, TB.white, { m: 'glass', seg: 12 }),
    C(24, 41.6, -2, 4.4, 0.8, TB.pink, { seg: 12 }),
  ]),

  // a pocket pet blown up big: a hot-pink egg on a black and teal stand, an LCD with Togepi on it, three yellow buttons
  // and a lime keyring loop
  piece('thbpet', 'Throwback Togepi pocket pet', 1, 1, 360, 'gloss', [
    C(16, 1.2, 0, 8, 2.4, TB.ink, { seg: 16 }),
    C(16, 9.4, 0, 4, 14, TB.ink, { seg: 12 }),
    C(16, 17, 0, 7, 1.6, TB.teal, { seg: 16 }),
    S(16, 30, 0, 10.4, 12.6, 5.6, TB.pink, { seg: 16 }),
    DS(16, 32.6, 4.7, 6, 1, TB.white, { m: 'plain', seg: 16, ry: 5 }),
    PC(16, 32.6, 5.25, 7.2, 6.4, petScreen),
    ...[11.6, 16, 20.4].map((x, i) => S(x, 23.2 - (i === 1 ? 0.8 : 0), 4.2, 1.3, 1.3, 1, TB.yellow, { seg: 8 })),
    RG(16, 44.4, 0, 2.6, 0.7, TB.lime),
  ]),

  // a black rug with a teal border, memphis squiggles, pink and lime triangles and confetti all over
  { id: 'thbrug', name: 'Throwback confetti rug', group: GROUP, solo: true, w: 3, h: 2, layer: 'rug', price: 700, high: 0.04, side: 'c', flat(w, h) {
    const g = ctx();
    g.fillStyle = TB.teal; g.beginPath(); g.roundRect(0, 0, w, h, 4); g.fill();
    g.fillStyle = TB.pink; g.beginPath(); g.roundRect(2.4, 2.4, w - 4.8, h - 4.8, 3); g.fill();
    g.fillStyle = TB.ink; g.beginPath(); g.roundRect(4, 4, w - 8, h - 8, 2.4); g.fill();
    g.save(); g.beginPath(); g.rect(4, 4, w - 8, h - 8); g.clip();
    memphis(11, TB.ink, 5)(g, 4, 4, w - 8, h - 8);
    g.restore();
  } },
];
