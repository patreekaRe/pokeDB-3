/* base-furniture-constellations.js  -  the Constellations set (furniture expansion session h, 2026-10-17): Animal
   Crossing's star and zodiac feel, a night room. Midnight blue lacquer and velvet (deep navy to indigo) trimmed in silver,
   little silver and pale-gold stars dotted over everything, star-shaped knobs and finials, crescent moons, a celestial
   globe, an armillary sphere, an orrery and a brass telescope, and plenty that glows: a full-moon lamp, a star floor lamp,
   jars of stars, a glowing star-dial, a crescent wall lamp, a garland of stars and a star projector. Clefairy by the moon
   lamp, a Minior on the star-jar shelf, Jirachi asleep on the clock, Lunatone and Solrock on their plinth and a Cosmog
   cushion for the Pokémon touches. All solo, fixed colours, sold all year.
   An upright piece is a list of parts in painted units (32 a tile), as in js/base-furniture-ranch.js: `x` across from the
   left of its front, `h` up from the floor (a wall piece's from the foot of its strip), `z` out to the front from its
   middle (a wall piece's from the wall). They're painted here from any side, and js/base-models-constellations.js builds
   the same list as 3D parts (BUILT), so picture and model agree. New here: a ring can stand side on (`ax: 'x'`) or tilt
   about the front axis (`rz`, the armillary's ecliptic), and crescents and stars are flat outlines (`prism`). `tex:
   'stars'` (a dusting of tiny stars) is painted only; the model keeps plain colours and its bigger stars as parts. A `pic`
   part (the screen's panels, the star chart) is painted on the front only, and the model wears that crop of the painting.
   The wardrobe's doors swing (`doors`, `inside`). The rug is an oval of the night sky, painted from above (RUG). */

import { sh, oval, ovalShade, floorShadow, ctx, hash, glass as glassPane } from './base-paint.js';

export const CC = {
  navy: '#1e2756', navyD: '#141a3c', navyL: '#2e3a78', indigo: '#3c357e', indigoL: '#5a4fa6', velvet: '#2a3270',
  velvetL: '#3a4590', silver: '#c4cad8', silverL: '#e6eaf4', silverD: '#8a90a6', gold: '#e6cc84', goldL: '#f6e4ae',
  brass: '#c8a04a', brassD: '#9a7a34', glow: '#fff0b0', glowB: '#d4e2ff', moonG: '#fbefc4', moonD: '#d8c890',
  dial: '#f4eed6', sunG: '#ffd070', sheet: '#d6daf0', paper: '#e8dcb8', ink: '#10142c', mirror: '#c6d6ea', glass: '#cfe8f4',
  pink: '#f6bccb', pinkD: '#e0909f', tip: '#6a4030', jira: '#f6dc5a', jiraW: '#f4f2ea', tag: '#7ab8e8',
  minior: '#e8484a', shell: '#9a7656', shellD: '#6e5038', eyeW: '#ffffff',
  luna: '#e6daa0', lunaD: '#bfb07a', lunaEye: '#d83838', sol: '#e8963a', solL: '#f2b860', solMask: '#5a3020',
  cosmog: '#2e2a74', cosmogL: '#4a62c8', cosmogT: '#9ab8f0', starY: '#ffe070',
  venus: '#e8c888', earth: '#4a86d8', mars: '#d0603c',
};
const GROUP = 'Constellations';
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

const CL = { m: 'cloth' }, PL = { m: 'plain' }, GL = { m: 'gloss' }, MT = { m: 'metal' }, GW = { m: 'glow' };
const STR = { m: 'cloth', tex: 'stars' }, STRG = { m: 'gloss', tex: 'stars' };

/** An n-pointed star's outline about its middle, points R out and dips r, the first point at `rot` (straight up). */
const starPts = (R, r, n = 5, rot = Math.PI / 2) => Array.from({ length: n * 2 }, (_, i) => {
  const a = rot + i * Math.PI / n, k = i % 2 ? r : R; return [Math.cos(a) * k, Math.sin(a) * k];
});
/** A crescent moon's outline about the middle of its outer circle R, its horns to the right, turned by `rot`. */
function crescent(R, rot = 0, n = 16) {
  const R2 = R * 0.84, d = R * 0.5, xi = (R * R - R2 * R2 + d * d) / (2 * d), yi = Math.sqrt(R * R - xi * xi);
  const t1 = Math.atan2(yi, xi), p1 = Math.atan2(yi, xi - d), pts = [];
  for (let i = 0; i <= n; i++) { const a = t1 + (TAU - 2 * t1) * i / n; pts.push([Math.cos(a) * R, Math.sin(a) * R]); }
  for (let i = 1; i < n; i++) { const a = TAU - p1 - (TAU - 2 * p1) * i / n; pts.push([d + Math.cos(a) * R2, Math.sin(a) * R2]); }
  const c = Math.cos(rot), s = Math.sin(rot);
  return pts.map(([x, y]) => [x * c - y * s, x * s + y * c]);
}
/** A five-pointed star standing in the front plane, metal unless told. */
const st = (x, h, z, R, c, o = {}) => PR(x, h, z, starPts(R, R * 0.45), o.d ?? 0.8, c, { m: 'metal', ...o });
/** A crescent moon standing in the front plane, horns right unless turned (`rot`). */
const mn = (x, h, z, R, c, o = {}) => PR(x, h, z, crescent(R, o.rot ?? 0), o.d ?? 1.2, c, { m: 'metal', ...o });
/** Little stars dotted over a front face at z between x0..x1 and h0..h1, gold and silver by turns. */
const sprinkle = (x0, x1, h0, h1, z, n, seed, R = 1.1) => Array.from({ length: n }, (_, i) =>
  st(x0 + hash(i, seed, 1) * (x1 - x0), h0 + hash(i, seed, 2) * (h1 - h0), z, R * (0.7 + 0.6 * hash(i, seed, 3)), i % 2 ? CC.silverL : CC.goldL, { d: 0.5 }));
/** A glass jar with a glowing star inside and a silver lid, standing at h0. */
const jar = (x, h0, z, r, hh, c) => [
  st(x, h0 + hh * 0.48, z, r * 0.66, c, { m: 'glow', d: 0.8 }),
  C(x, h0 + hh / 2, z, r, hh, CC.glass, { m: 'glass', seg: 12 }),
  C(x, h0 + hh + 0.7, z, r * 0.86, 1.4, CC.silver, { m: 'metal', seg: 10 }),
];

/** Clefairy, sitting, its feet at h0: the round pink body, its brown-tipped ears, the curl, little arms and feet. */
function clefairy(x, h0, z) {
  const parts = [S(x, h0 + 5.4, z, 5, 5.2, 4.4, CC.pink, { m: 'cloth', seg: 12 })];
  for (const s of [-1, 1]) parts.push(
    RD([x + s * 2.4, h0 + 9, z - 0.4], [x + s * 4.2, h0 + 13, z - 0.8], 1.1, CC.pink, CL),
    S(x + s * 4.4, h0 + 13.5, z - 0.8, 0.9, 1, 0.9, CC.tip, { m: 'cloth', seg: 8 }),
    S(x + s * 4.9, h0 + 4.6, z + 1.2, 1.3, 1.1, 1.1, CC.pink, { m: 'cloth', seg: 8 }),
    S(x + s * 2.3, h0 + 0.9, z + 2.4, 1.6, 0.9, 2, CC.pinkD, { m: 'cloth', seg: 8 }),
    DS(x + s * 1.8, h0 + 6.4, z + 4.2, 0.6, 0.4, CC.ink, { m: 'plain', ry: 0.95, seg: 6 }),
    DS(x + s * 3, h0 + 4.6, z + 3.6, 0.8, 0.4, CC.pinkD, { m: 'plain', ry: 0.5, seg: 6 }));
  parts.push(RG(x, h0 + 10.6, z + 0.6, 1.1, 0.35, CC.pinkD, { m: 'cloth', a0: -0.6, arc: 4.4 }));
  return parts;
}
/** Jirachi asleep, sitting at h0: its white body and head, the yellow three-pointed star behind, a blue tag at each point. */
function jirachi(x, h0, z) {
  const parts = [
    PR(x, h0 + 9.4, z - 1.6, starPts(6.4, 2.8, 3), 1.4, CC.jira, GL),
    S(x, h0 + 3, z, 3, 3.2, 2.6, CC.jiraW, { m: 'gloss', seg: 10 }),
    S(x, h0 + 8.4, z, 3.6, 3.2, 3, CC.jiraW, { m: 'gloss', seg: 12 }),
    B(x, h0 + 17.4, z - 1.6, 1.4, 2.4, 0.4, CC.tag, PL),
  ];
  for (const s of [-1, 1]) parts.push(
    B(x + s * 5.5, h0 + 4.6, z - 1.6, 1.4, 2.6, 0.4, CC.tag, PL),
    RD([x + s * 0.7, h0 + 8.6, z + 3], [x + s * 1.9, h0 + 8.6, z + 2.8], 0.25, CC.ink, PL),
    S(x + s * 3, h0 + 3.6, z + 0.6, 1, 0.9, 0.9, CC.jiraW, { m: 'gloss', seg: 8 }));
  return parts;
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
const polyPath = (pts) => { const p = new Path2D(); pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); p.closePath(); return p; };
const bounds = (pts) => { const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; };

/** A four-pointed twinkle at cx, cy, k across. */
function twinkle(g, cx, cy, k) {
  g.beginPath(); g.moveTo(cx, cy - k); g.lineTo(cx + k * 0.22, cy - k * 0.22); g.lineTo(cx + k, cy); g.lineTo(cx + k * 0.22, cy + k * 0.22);
  g.lineTo(cx, cy + k); g.lineTo(cx - k * 0.22, cy + k * 0.22); g.lineTo(cx - k, cy); g.lineTo(cx - k * 0.22, cy - k * 0.22); g.closePath(); g.fill();
}
/** The painted-only dusting of tiny stars (`tex: 'stars'`) inside a part's outline `path` over bounds bb. */
function texture(q, path, bb) {
  if (q.tex !== 'stars') return;
  const g = ctx(), [x0, y0, x1, y1] = bb, seed = Math.round(q.x * 7 + q.h * 13 + q.z * 3);
  const n = Math.max(2, Math.round((x1 - x0) * (y1 - y0) / (q.ts || 16)));
  g.save(); g.clip(path);
  for (let i = 0; i < n; i++) {
    const px = x0 + hash(i, seed, 1) * (x1 - x0), py = y0 + hash(i, seed, 2) * (y1 - y0), v = hash(i, seed, 3);
    g.fillStyle = v < 0.55 ? CC.goldL : CC.silverL;
    if (v > 0.86) { g.globalAlpha = 0.95; twinkle(g, px, py, 1.3); } else { g.globalAlpha = 0.45 + v * 0.5; g.fillRect(px, py, 0.7, 0.7); }
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
        // which way it faces as seen: 'z' face on, 'y' lying flat, 'x' edge on
        const o0 = q.flat ? 'y' : q.ax === 'x' ? 'x' : 'z', o = side && o0 !== 'y' ? (o0 === 'z' ? 'x' : 'z') : o0;
        const rz = side ? 0 : -(q.rz || 0) * flip, ry = q.ry ?? q.r;
        if (o === 'x') {
          if (q.arc) break;
          g.save(); g.translate(cx, cy); g.rotate(rz); rbx(-q.tr, -ry - q.tr, q.tr * 2, (ry + q.tr) * 2, q.tr, q.c, m); g.restore();
          break;
        }
        const fy = o === 'y' ? (side ? Math.max(0.22, Math.abs(Math.sin(q.rz || 0))) : 0.22) * q.r : ry;
        const a0 = q.arc && o === 'z' ? -(q.a0 + q.arc) : 0, a1 = q.arc && o === 'z' ? -q.a0 : TAU;
        const path = (dy = 0, half = false) => { g.beginPath(); g.ellipse(cx, cy + dy, q.r, fy, rz, half ? Math.PI : a0, half ? TAU : a1); };
        g.lineCap = 'butt'; g.strokeStyle = q.c; g.lineWidth = q.tr * 2; path(); g.stroke();
        g.save(); g.globalAlpha *= 0.45; g.strokeStyle = sh(q.c, 2); g.lineWidth = q.tr * 0.6; path(-q.tr * 0.4, o === 'y'); g.stroke(); g.restore();
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

/** Joins stars [x, y] (fractions of w, h) with faint silver lines, then paints each as a twinkle. */
function constellation(g, x, y, w, h, pts, links, k = 1) {
  g.strokeStyle = alphaOf(CC.silverL, 0.55); g.lineWidth = 0.35 * k; g.beginPath();
  for (const [a, c] of links) { g.moveTo(x + pts[a][0] * w, y + pts[a][1] * h); g.lineTo(x + pts[c][0] * w, y + pts[c][1] * h); }
  g.stroke();
  g.fillStyle = CC.goldL;
  pts.forEach(([px, py], i) => twinkle(g, x + px * w, y + py * h, (i % 3 ? 0.9 : 1.4) * k));
}
/** A deep sky from navy to indigo, faint dust of stars, seeded so it is the same each time. */
function sky(g, x, y, w, h, seed) {
  const bg = g.createLinearGradient(x, y, x + w * 0.3, y + h);
  bg.addColorStop(0, CC.navyD); bg.addColorStop(0.6, CC.navy); bg.addColorStop(1, CC.indigo);
  g.fillStyle = bg; g.fillRect(x, y, w, h);
  const n = Math.round(w * h / 9);
  for (let i = 0; i < n; i++) {
    const v = hash(i, seed, 3);
    g.globalAlpha = 0.35 + v * 0.6; g.fillStyle = v < 0.5 ? CC.silverL : CC.goldL;
    g.fillRect(x + hash(i, seed, 1) * w, y + hash(i, seed, 2) * h, 0.6, 0.6);
  }
  g.globalAlpha = 1;
}
/** A folding screen's panel: the night sky, a little constellation on each. */
function starfield(g, x, y, w, h) {
  const seed = Math.round(x * 3 + y);
  sky(g, x, y, w, h, seed);
  const pts = [[0.2, 0.18], [0.42, 0.26], [0.62, 0.2], [0.78, 0.34], [0.7, 0.52], [0.36, 0.62], [0.5, 0.8], [0.24, 0.86]];
  constellation(g, x, y, w, h, pts.map(([a, c], i) => [a + (hash(i, seed, 7) - 0.5) * 0.12, c + (hash(i, seed, 8) - 0.5) * 0.06]), [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7]]);
}
/** The star chart: two round skies ruled in silver, their constellations, a crescent between them at the top. */
function chart(g, x, y, w, h) {
  sky(g, x, y, w, h, 41);
  const r = Math.min(w / 4.4, h / 2.3);
  for (const [cx, seed] of [[x + w * 0.27, 1], [x + w * 0.73, 2]]) {
    const cy = y + h * 0.54;
    g.strokeStyle = CC.silver; g.lineWidth = 0.5; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.stroke();
    g.strokeStyle = alphaOf(CC.silver, 0.35); g.lineWidth = 0.3; g.beginPath(); g.arc(cx, cy, r * 0.62, 0, TAU);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI; g.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); g.lineTo(cx - Math.cos(a) * r, cy - Math.sin(a) * r); }
    g.stroke();
    const pts = seed === 1
      ? [[0.2, 0.3], [0.36, 0.38], [0.5, 0.36], [0.62, 0.46], [0.66, 0.66], [0.84, 0.64], [0.86, 0.44]]
      : [[0.3, 0.2], [0.5, 0.34], [0.7, 0.22], [0.5, 0.5], [0.34, 0.76], [0.66, 0.76], [0.5, 0.88]];
    const links = seed === 1 ? [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]] : [[0, 1], [1, 2], [1, 3], [3, 4], [3, 5], [4, 6], [5, 6]];
    constellation(g, cx - r, cy - r, r * 2, r * 2, pts, links, 0.9);
  }
  g.fillStyle = CC.gold; g.beginPath(); crescent(h * 0.12, 0.4).forEach(([px, py], i) => (i ? g.lineTo(x + w / 2 + px, y + h * 0.2 - py) : g.moveTo(x + w / 2 + px, y + h * 0.2 - py))); g.closePath(); g.fill();
  g.strokeStyle = CC.silverD; g.lineWidth = 0.6; g.strokeRect(x + 0.8, y + 0.8, w - 1.6, h - 1.6);
}

/* ---------- the kinds ---------- */

/** What js/base-models-constellations.js builds for each upright and wall kind: its parts, doors and default material,
    and its shape's `seat` / `top` (painted units) and tap (`play`). */
export const BUILT = {};
/** The rug's outline, an oval seen from above, in painted units across its 3 x 2 tiles. */
export const RUG = Array.from({ length: 36 }, (_, i) => { const a = i / 36 * TAU; return [48 + Math.cos(a) * 46, 32 + Math.sin(a) * 30]; });

function piece(id, name, w, h, price, mat, parts, { doors = [], inside, seat, top, play, ...rest } = {}) {
  BUILT[id] = { parts, doors, inside, mat, seat, top, play };
  const all = [...parts, ...doors.flatMap(d => d.parts)];
  return { id, name, group: GROUP, solo: true, w, h, price, ...rest, draw(x, b, vw, dir) { floorShadow(x, b, vw); paintParts(all, x, b, vw, dir, w * 32); } };
}
function wallPiece(id, name, w, price, mat, parts, { play, ...rest } = {}) {
  BUILT[id] = { parts, doors: [], mat, play };
  return { id, name, group: GROUP, solo: true, w, h: 1, layer: 'wall', price, ...rest, wall(x) { paintParts(parts, x, 96, w * 32, 0, w * 32); } };
}
const corners = (xs, zs) => xs.flatMap(x => zs.map(z => [x, z]));
/** A point on a sphere's front (centre cx, ch, cz, radius R) at dx, dy: the z its face sits at. */
const onBall = (R, dx, dy, cz = 0) => cz + Math.sqrt(Math.max(0, R * R - dx * dx - dy * dy)) + 0.2;

export const CONSTELLATION_KINDS = [
  // a four-poster with silver star finials, a navy canopy whose scalloped valance is dotted with stars, a starry back
  // drape, curtains tied back at the foot, a crescent on the arched headboard and an indigo quilt of stars
  piece('cstbed', 'Constellation canopy bed', 2, 2, 1750, 'gloss', [
    B(32, 52, -30.6, 56, 46, 1, CC.navyL, STR),
    ...corners([4, 60], [-29, 29]).flatMap(([x, z]) => [
      B(x, 39, z, 3.6, 78, 3.6, CC.navy, GL), B(x, 30, z, 4.4, 1.4, 4.4, CC.silver, MT),
      C(x, 79.6, z, 1.2, 2.4, CC.silver, { m: 'metal', seg: 8 }), st(x, 84.4, z, 3.2, CC.gold, { d: 1.2 }),
    ]),
    B(32, 77.2, 0, 62, 2.4, 62, CC.navyD, GL), B(32, 79, 0, 58, 1.4, 58, CC.navy, CL),
    B(32, 72.5, 30.4, 58, 9, 1.2, CC.indigo, STR),
    ...[8, 16, 24, 32, 40, 48, 56].map(x => DS(x, 68, 30.3, 3.8, 1, CC.indigo, { m: 'cloth', ry: 2.2, seg: 10 })),
    ...[2.4, 61.6].map(x => B(x, 72.5, 0, 1.2, 9, 58, CC.indigo, CL)),
    mn(32, 72.6, 31.3, 3.6, CC.silverL, { d: 0.6, rot: 0.3 }), ...[14, 22, 42, 50].map((x, i) => st(x, 72.4 + (i % 2 ? 1 : -1), 31.3, 1.7, CC.goldL, { d: 0.6 })),
    B(32, 33, -29, 52, 30, 2.4, CC.navyL, STRG), DS(32, 48, -29, 14, 2.4, CC.navyL, { m: 'gloss', ry: 6, seg: 20 }),
    mn(32, 39, -27.5, 8, CC.silver, { d: 1, rot: 0.25 }), st(41, 45, -27.5, 2.2, CC.gold), st(24, 30, -27.5, 1.6, CC.gold), st(43, 30, -27.5, 1.2, CC.goldL),
    B(32, 9, 0, 58, 8, 58, CC.navy, GL),
    B(32, 15.5, 0, 56, 5, 54, CC.sheet, CL),
    B(32, 19, 5, 58, 2.4, 44, CC.indigo, STR), B(32, 15, 29.7, 52, 10, 1, CC.indigo, STR), B(32, 9.8, 30.3, 52, 0.8, 0.5, CC.silver, MT),
    B(32, 20.4, -12, 58.4, 0.6, 4, CC.sheet, CL),
    ...[20, 44].map(x => S(x, 21.4, -21, 9, 3, 5, CC.silverL, { m: 'cloth', seg: 12 })),
    ...[[8, 1], [56, -1]].flatMap(([x]) => [B(x, 52, 28.2, 6, 40, 1.6, CC.navyL, CL), B(x, 44, 28.2, 6.6, 1.4, 2.4, CC.gold, MT)]),
  ]),

  // a crescent moon of pale gold for a back, horns up to cradle you, padded in velvet, on a navy seat and silver legs
  piece('cstchair', 'Constellation crescent chair', 1, 1, 480, 'gloss', [
    ...corners([5, 27], [-8, 9]).map(([x, z]) => RD([x, 0, z], [x, 13, z], 0.9, CC.silver, MT)),
    B(16, 13.8, 0.5, 26, 2.4, 21, CC.navy, GL),
    B(16, 16.6, 1.5, 24, 3.6, 19, CC.velvet, STR),
    RD([16, 15, -10], [16, 22.6, -10], 1, CC.silver, MT),
    mn(16, 35, -10, 14, CC.gold, { rot: Math.PI / 2, d: 3 }),
    mn(16, 36.6, -8.2, 11.4, CC.velvet, { m: 'cloth', rot: Math.PI / 2, d: 0.8 }),
    st(28, 45.2, -10, 2.4, CC.silverL, { d: 1 }),
  ], { seat: 18.4 }),

  // a camelback sofa in navy velvet on a lacquered base: silver piping and feet, a gold star cushion and a silver moon
  piece('cstsofa', 'Constellation velvet sofa', 2, 1, 1250, 'cloth', [
    ...corners([5, 59], [-11, 11]).map(([x, z]) => C(x, 1.8, z, 1.6, 3.6, CC.silver, { m: 'metal', seg: 8, rb: 1.1 })),
    B(32, 8, 1, 62, 9, 26, CC.navy, GL), B(32, 12.4, 14.2, 60, 0.8, 0.6, CC.silver, MT),
    B(32, 22, -10, 56, 22, 6, CC.velvet, STR),
    ...[16, 32, 48].map(x => DS(x, 32, -10, 9, 5.6, CC.velvet, { m: 'cloth', ry: 5, seg: 16 })),
    ...[16, 32, 48].map(x => st(x, 33.4, -6.9, 1.5, CC.goldL, { d: 0.6 })),
    ...[19, 45].flatMap(x => [B(x, 15, 3, 26, 5, 20, CC.velvetL, CL), B(x, 23, -6, 25, 12, 3.4, CC.velvetL, CL)]),
    ...[3.5, 60.5].flatMap(x => [B(x, 16, 1, 7, 15, 26, CC.velvet, CL), B(x, 24, 1, 7.6, 2.2, 26.6, CC.velvetL, CL)]),
    st(15, 24.5, -3.4, 6.4, CC.gold, { m: 'cloth', d: 3.4 }),
    mn(49, 24.5, -3.4, 6.8, CC.silverL, { m: 'cloth', d: 3.4, rot: 0.4 }),
  ], { seat: 17.5 }),

  // a round table under an indigo cloth of stars, a silver-rimmed navy top, a little gold crescent on its stand
  piece('csttable', 'Constellation round table', 1, 1, 620, 'gloss', [
    LA(16, 0, 0, [[9, 0], [9, 1.4], [6, 2.6], [2.6, 4.4], [2.2, 5]], CC.navy, { m: 'gloss', seg: 16 }),
    C(16, 11, 0, 1.8, 12, CC.silver, { m: 'metal', seg: 10 }),
    C(16, 21, 0, 14.6, 9, CC.indigo, { m: 'cloth', rb: 15.4, seg: 20, tex: 'stars' }),
    ...[[-6, 20.6, 1.8], [0, 19, 1.4], [6, 21.6, 1.6]].map(([dx, h, R]) => st(16 + dx, h, Math.sqrt(15 * 15 - dx * dx) + 0.2, R, CC.goldL, { d: 0.5 })),
    C(16, 26.6, 0, 15, 2.2, CC.navy, { m: 'gloss', seg: 20 }),
    RG(16, 27.7, 0, 15, 0.5, CC.silver, { m: 'metal', flat: true }),
    C(16, 28.4, -7, 2.4, 1.2, CC.silver, { m: 'metal', seg: 10 }), RD([16, 29, -7], [16, 31.4, -7], 0.4, CC.silver, MT),
    mn(16, 34.6, -7, 4, CC.gold, { d: 1, rot: 0.3 }),
  ], { top: 27.9 }),

  // a lacquered writing desk with star-knobbed drawers, a star map unrolled, an inkwell and quill, and a little brass
  // telescope on its tripod pointed at the window
  piece('cstdesk', 'Constellation telescope desk', 2, 1, 1100, 'gloss', [
    B(12, 12.5, 0, 20, 25, 26, CC.navy, GL),
    ...[18.5, 7.5].flatMap(h => [B(12, h, 13.3, 16, 9, 0.9, CC.navyL, STRG), st(12, h, 14.2, 1.8, CC.silver)]),
    ...[-10, 10].map(z => B(57, 12.5, z, 3.6, 25, 3.6, CC.navy, GL)),
    B(41, 22.6, 11, 32, 4, 1.6, CC.navyL, GL), st(41, 22.6, 12.2, 1.4, CC.gold),
    B(32, 26.4, 0, 64, 2.8, 28, CC.navyD, GL), B(32, 26.4, 14.2, 64, 0.8, 0.5, CC.silver, MT),
    B(22, 28.1, 3, 13, 0.5, 10, CC.paper, PL), ...[15.4, 28.6].map(x => RD([x, 28.6, -2], [x, 28.6, 8], 0.8, CC.paper, PL)),
    ...[[19, 1], [23, 4], [26, 2]].map(([x, z]) => DS(x, 28.5, z, 0.6, 0.2, CC.navy, { m: 'plain', seg: 6 })),
    C(8, 29.6, -4, 1.8, 3.6, CC.ink, { m: 'gloss', seg: 8 }), RD([8, 31, -4], [11, 38, -5], 0.4, CC.silverL, PL),
    ...[[42, -8], [50, -8], [46, 1]].map(([x, z]) => RD([x, 27.8, z], [46, 37, -4], 0.5, CC.brassD, MT)),
    S(46, 37.4, -4, 1.4, 1.4, 1.4, CC.brass, { m: 'metal', seg: 8 }),
    RD([38, 33, -3.6], [55, 43.2, -5.4], 1.8, CC.brass, MT),
    RD([54, 42.6, -5.3], [59, 45.6, -5.8], 2.2, CC.brassD, MT),
    RD([35, 31.2, -3.3], [38, 33, -3.6], 0.8, CC.brassD, MT),
    RD([44.6, 37.6, -4.3], [45.4, 38.1, -4.4], 2, CC.silver, MT),
  ], { top: 27.8 }),

  // a tall navy wardrobe with an arched crest and a gold crescent, star finials, and two starry doors, a silver moon on
  // one and a gold star on the other, that swing open
  piece('cstwardrobe', 'Constellation wardrobe', 2, 1, 1450, 'gloss', [
    B(32, 2, 0, 62, 4, 28, CC.navyD, GL),
    B(32, 31, -1, 60, 54, 24, CC.navy, GL),
    B(32, 59.5, 0, 64, 3, 28, CC.navyD, GL), B(32, 58.4, 14.1, 64, 0.8, 0.5, CC.silver, MT),
    DS(32, 61, -2, 16, 3, CC.navy, { m: 'gloss', ry: 9, seg: 20 }),
    mn(32, 65, 0, 4.6, CC.gold, { d: 1, rot: 0.3 }), st(24, 63.5, 0, 1.4, CC.goldL, { d: 0.6 }), st(40, 63.5, 0, 1.4, CC.goldL, { d: 0.6 }),
    ...[4, 60].flatMap(x => [RD([x, 61, 0], [x, 64.5, 0], 0.5, CC.silver, MT), st(x, 67.4, 0, 3, CC.silver, { d: 1 })]),
  ], {
    doors: [4.3, 59.7].map((hx, i) => {
      const x = i ? 46 : 18, l = x - 11, r = x + 11, hz = 13.1;
      return { hinge: [hx, 12], side: i ? -1 : 1, parts: [
        B(x, 31, 12, 27.4, 52, 1.6, CC.navyL, STRG),
        RD([l, 8, hz], [r, 8, hz], 0.5, CC.silver, MT), RD([r, 8, hz], [r, 54, hz], 0.5, CC.silver, MT),
        RD([r, 54, hz], [l, 54, hz], 0.5, CC.silver, MT), RD([l, 54, hz], [l, 8, hz], 0.5, CC.silver, MT),
        i ? st(x, 34, 13.2, 6.4, CC.gold, { d: 1 }) : mn(x, 34, 13.2, 7, CC.silverL, { d: 1, rot: 0.3 }),
        ...sprinkle(l + 2, r - 2, 12, 50, 13.1, 5, i + 3),
        RD([x + (i ? -11.6 : 11.6), 28, 13.6], [x + (i ? -11.6 : 11.6), 36, 13.6], 0.6, CC.silver, MT),
      ] };
    }),
    inside: { x: 32, h: 31, w: 52, hh: 48, z: 11.2 },
    play: { does: 'door', inside: 'clothes', double: true },
  }),

  // a low dresser of six starry drawers on star knobs and silver feet, an oval mirror crowned by a crescent, a crystal
  // ball with a star glowing inside and a little jewellery box
  piece('cstdresser', 'Constellation dresser', 2, 1, 950, 'gloss', [
    ...corners([5, 59], [-10, 10]).map(([x, z]) => LA(x, 0, z, [[1.2, 0], [2, 1.2], [2.2, 2.6], [1.8, 3.6]], CC.silver, { m: 'metal', seg: 8 })),
    B(32, 18, 0, 60, 29, 26, CC.navy, GL),
    B(32, 33.6, 0, 63, 2.4, 28, CC.navyD, GL), B(32, 33.6, 14.1, 63, 0.7, 0.5, CC.silver, MT),
    ...[17, 47].flatMap(x => [8, 17.6, 27.2].flatMap(h => [B(x, h, 13.3, 27, 8.4, 0.9, CC.navyL, { m: 'gloss', tex: 'stars', ts: 24 }), st(x, h, 14.2, 1.6, CC.silver)])),
    RD([32, 34.6, -10], [32, 36.4, -10], 1.2, CC.silver, MT),
    DS(32, 47, -10, 9.6, 1.4, CC.silver, { m: 'metal', ry: 11.6, seg: 18 }), DS(32, 47, -9.1, 8.2, 0.4, CC.mirror, { m: 'gloss', ry: 10.2, seg: 18 }),
    mn(32, 62, -10, 3.6, CC.gold, { d: 1, rot: Math.PI / 2 }),
    LA(52, 34.8, 2, [[2.6, 0], [2.6, 0.8], [1.4, 2], [2, 2.8]], CC.gold, { m: 'metal', seg: 10 }),
    st(52, 40.8, 2, 1.6, CC.glow, { m: 'glow', d: 0.6 }), S(52, 40.8, 2, 3.6, 3.6, 3.6, CC.glass, { m: 'glass', seg: 12 }),
    B(13, 36.6, 2, 9, 3.6, 6, CC.indigo, GL), B(13, 38.8, 2, 9.6, 0.8, 6.6, CC.silver, MT), st(13, 36.6, 5.2, 1.1, CC.gold, { d: 0.5 }),
  ], { top: 34.8, glow: [CC.glow] }),

  // an open navy shelf with a starry back and an arched crest: jars of glowing stars, and a Minior peeping out of its
  // broken meteor shell on the top shelf
  piece('cstshelf', 'Constellation star-jar shelf', 1, 1, 680, 'gloss', [
    B(16, 30, -10, 26, 58, 1.4, CC.navyL, STRG),
    ...[2.2, 29.8].map(x => B(x, 30, 0, 3, 60, 22, CC.navy, GL)),
    ...[1.2, 20, 39, 59].map(h => B(16, h, 0, 30, 2.4, 22, CC.navyD, GL)),
    ...[20, 39].map(h => B(16, h, 11.2, 30, 0.6, 0.5, CC.silver, MT)),
    DS(16, 60, -3, 13, 2.4, CC.navy, { m: 'gloss', ry: 6, seg: 16 }), st(16, 62.6, -1.4, 2.6, CC.gold),
    ...jar(8, 2.4, 1, 4, 10, CC.glow), ...jar(17, 2.4, 0, 3.4, 12, CC.glowB), ...jar(25, 2.4, 1.5, 3.2, 9, CC.glow),
    ...jar(9, 21.2, 0, 3.6, 11, CC.glowB), ...jar(22, 21.2, 1, 4, 9, CC.glow),
    ...jar(24, 40.2, 0, 3, 8, CC.glowB),
    S(11.6, 45, 2, 4.4, 4.4, 4.2, CC.minior, { m: 'gloss', seg: 12 }),
    S(8.4, 48.2, 1.4, 2.6, 2.2, 2.4, CC.shell, { m: 'cloth', seg: 8 }), S(15.2, 41.6, 2.4, 2.4, 1.8, 2.2, CC.shellD, { m: 'cloth', seg: 8 }),
    S(7.6, 42, 1, 1.6, 1.6, 1.6, CC.shell, { m: 'cloth', seg: 8 }),
    ...[-1, 1].flatMap(s => [DS(11.6 + s * 1.5, 45.4, 6.2, 0.8, 0.4, CC.ink, { m: 'plain', ry: 1.1, seg: 6 }), DS(11.6 + s * 1.5 - 0.3, 45.9, 6.5, 0.3, 0.2, CC.eyeW, { m: 'plain', seg: 6 })]),
  ], { glow: [CC.glow, CC.glowB] }),

  // a glowing full moon, craters and all, cradled in a silver crescent on a slim stand, Clefairy sitting at its foot
  piece('cstmoonlamp', 'Constellation Clefairy moon lamp', 1, 1, 620, 'metal', [
    LA(16, 0, -2, [[8, 0], [8, 1.2], [6.4, 2.2], [2, 3.4], [1.4, 4]], CC.navy, { m: 'gloss', seg: 16 }),
    RG(16, 1.3, -2, 8, 0.4, CC.silver, { m: 'metal', flat: true }),
    RD([16, 4, -2], [16, 27, -2], 0.7, CC.silver, MT),
    mn(16, 36, -2, 11.4, CC.silver, { rot: Math.PI / 2, d: 2.4 }),
    S(16, 36, -2, 10, 10, 10, CC.moonG, { m: 'glow', seg: 18 }),
    ...[[-4, 3, 1.9], [3, 5, 1.2], [4, -3, 2.4], [-3, -4, 1.3]].map(([dx, dy, r]) => DS(16 + dx, 36 + dy, onBall(10, dx, dy, -2) - 0.4, r, 0.6, CC.moonD, { m: 'plain', seg: 10 })),
    ...clefairy(24.5, 0, 8.6),
  ], { glow: [CC.moonG], play: { does: 'light' } }),

  // a slim silver floor lamp topped by a gold crescent holding a glowing star, a little star dangling from its horn
  piece('cststarlamp', 'Constellation star floor lamp', 1, 1, 560, 'metal', [
    LA(16, 0, 0, [[7.4, 0], [7.4, 1.4], [5, 2.4], [1.4, 3.4]], CC.navy, { m: 'gloss', seg: 16 }),
    RG(16, 1.4, 0, 7.4, 0.4, CC.silver, { m: 'metal', flat: true }),
    RD([16, 3, 0], [16, 52.6, 0], 0.7, CC.silver, MT),
    ...[18, 36].map(h => C(16, h, 0, 1.3, 1.2, CC.gold, { m: 'metal', seg: 8 })),
    mn(16, 62, 0, 10, CC.gold, { d: 1.6 }),
    st(21.6, 62, 0.4, 6.4, CC.glow, { m: 'glow', d: 2.4 }),
    RD([21, 53.4, 0], [21, 49, 0], 0.2, CC.silver, MT), st(21, 47, 0, 1.9, CC.glow, { m: 'glow', d: 0.8 }),
    st(21.2, 72.4, 0, 1.4, CC.silverL, { d: 0.6 }),
  ], { glow: [CC.glow], play: { does: 'light' } }),

  // a tall case clock in navy lacquer: a pendulum behind glass, a glowing star-dial under an arched crest, and Jirachi
  // asleep on top, wishing
  piece('cstclock', 'Constellation Jirachi clock', 1, 1, 1200, 'gloss', [
    B(16, 3, 0, 26, 6, 18, CC.navyD, GL),
    B(16, 27, 0, 20, 42, 14, CC.navy, GL),
    RD([16, 40, 5.4], [16, 22, 5.4], 0.4, CC.gold, MT), DS(16, 20.4, 5.6, 3, 0.6, CC.gold, { m: 'metal', seg: 12 }),
    B(16, 27, 7.3, 12, 28, 0.4, CC.glass, { m: 'glass' }),
    ...[[16, 9.6], [16, 44.4]].map(([x, h]) => st(x, h, 7.4, 1.6, CC.gold, { d: 0.6 })),
    B(16, 57, 0, 26, 18, 16, CC.navy, GL), B(16, 48.4, 8.1, 26, 0.7, 0.5, CC.silver, MT),
    DS(16, 66, -1, 13, 4, CC.navy, { m: 'gloss', ry: 6, seg: 18 }),
    mn(16, 68.2, 1.6, 2.8, CC.gold, { d: 0.8, rot: 0.3 }),
    DS(16, 57, 8.2, 8.4, 0.8, CC.dial, { m: 'glow', seg: 20 }), RG(16, 57, 8.6, 8.6, 0.6, CC.silver, { m: 'metal' }),
    ...[0, 1, 2, 3].map(i => { const a = i * Math.PI / 2; return st(16 + Math.cos(a) * 6.2, 57 + Math.sin(a) * 6.2, 8.9, 1.3, CC.indigo, { d: 0.4 }); }),
    RD([16, 57, 9.1], [12.5, 59, 9.1], 0.5, CC.ink, PL), RD([16, 57, 9.2], [21.2, 60, 9.2], 0.35, CC.ink, PL), DS(16, 57, 9.4, 0.8, 0.4, CC.silver, { m: 'metal', seg: 8 }),
    ...jirachi(16, 71.6, 0),
  ], { glow: [CC.dial], play: { does: 'chime' } }),

  // a three-panel folding screen, each panel a starry night with its own constellation in a silver frame under an arch,
  // a gold crescent on the middle one and stars on the others
  piece('cstscreen', 'Constellation folding screen', 2, 1, 760, 'gloss', [
    ...[[11, 2], [32, -2], [53, 2]].flatMap(([x, z], i) => {
      const l = x - 9.6, r = x + 9.6;
      return [
        DS(x, 50, z, 9.6, 1.4, CC.navy, { m: 'gloss', ry: 4.6, seg: 16 }),
        B(x, 27, z, 19, 46, 1.4, CC.navy, GL),
        PC(x, 27.4, z + 0.75, 16, 41, starfield),
        RD([l, 0, z + 0.3], [l, 50, z + 0.3], 0.8, CC.silver, MT), RD([r, 0, z + 0.3], [r, 50, z + 0.3], 0.8, CC.silver, MT),
        RD([l, 5, z + 0.5], [r, 5, z + 0.5], 0.5, CC.silver, MT),
        RG(x, 50, z + 0.4, 9.6, 0.6, CC.silver, { m: 'metal', a0: 0, arc: Math.PI, ry: 4.6 }),
        st(x, 56.6, z, 1.8, CC.silverL, { d: 0.8 }),
        i === 1 ? mn(x, 32, z + 1.3, 6, CC.gold, { d: 0.6, rot: 0.3 }) : st(x, 36, z + 1.3, 3.2, CC.gold, { d: 0.6 }),
      ];
    }),
  ]),

  // a cheval mirror swinging between two navy posts on silver star finials, an oval glass framed in silver, a crescent
  // and a star on its crest
  piece('cstmirror', 'Constellation crescent mirror', 1, 1, 680, 'gloss', [
    ...[3, 29].flatMap(x => [B(x, 2, 0, 3.4, 4, 16, CC.navy, GL), B(x, 25, 0, 2.6, 46, 2.6, CC.navy, GL), st(x, 51.4, 0, 2.4, CC.silver, { d: 1 })]),
    ...[[4.3, 5.8], [26.2, 27.7]].map(([a, c]) => RD([a, 32, 0], [c, 32, 0], 0.7, CC.silver, MT)),
    DS(16, 32, 0, 10.4, 1.4, CC.silver, { m: 'metal', ry: 17, seg: 20 }),
    DS(16, 32, 0.6, 9, 0.6, CC.mirror, { m: 'gloss', ry: 15.6, seg: 20 }),
    mn(16, 54, 0, 5.6, CC.gold, { d: 1.2, rot: Math.PI / 2 }), st(16, 56, 0.6, 2, CC.goldL, { d: 0.6 }),
    ...[[-8, 10], [8.6, 4], [-7.4, -10]].map(([dx, dy]) => st(16 + dx, 32 + dy, 1, 1.1, CC.goldL, { d: 0.4 })),
  ]),

  // an oval rug of the night sky: a silver border, the Big Dipper and a few more, a gold crescent and stars
  { id: 'cstrug', name: 'Constellation rug', group: GROUP, solo: true, w: 3, h: 2, layer: 'rug', price: 820, high: 0.04, side: 'c', flat() {
    const g = ctx(), path = () => { g.beginPath(); RUG.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
    g.save(); path(); g.clip();
    const bg = g.createRadialGradient(48, 32, 4, 48, 32, 48);
    bg.addColorStop(0, CC.indigo); bg.addColorStop(0.6, CC.navy); bg.addColorStop(1, CC.navyD);
    g.fillStyle = bg; g.fillRect(0, 0, 96, 64);
    for (let i = 0; i < 220; i++) {
      const v = hash(i, 5, 3); g.globalAlpha = 0.3 + v * 0.6; g.fillStyle = v < 0.5 ? CC.silverL : CC.goldL;
      g.fillRect(hash(i, 5, 1) * 96, hash(i, 5, 2) * 64, 0.7, 0.7);
    }
    g.globalAlpha = 1;
    constellation(g, 10, 10, 50, 26, [[0.06, 0.3], [0.24, 0.24], [0.4, 0.34], [0.56, 0.42], [0.62, 0.78], [0.92, 0.84], [0.96, 0.5]], [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]], 1.4);
    constellation(g, 50, 30, 34, 26, [[0.1, 0.2], [0.3, 0.4], [0.5, 0.2], [0.7, 0.4], [0.9, 0.2]], [[0, 1], [1, 2], [2, 3], [3, 4]], 1.3);
    constellation(g, 18, 40, 22, 16, [[0.2, 0.2], [0.5, 0.1], [0.8, 0.3], [0.6, 0.8], [0.3, 0.7]], [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]], 1.2);
    g.fillStyle = CC.gold; g.beginPath(); crescent(7, 0.5).forEach(([px, py], i) => (i ? g.lineTo(74 + px, 16 - py) : g.moveTo(74 + px, 16 - py))); g.closePath(); g.fill();
    g.restore();
    g.strokeStyle = CC.silver; g.lineWidth = 1.6; path(); g.stroke();
    g.strokeStyle = CC.silverD; g.lineWidth = 0.5; g.beginPath(); RUG.forEach(([x, y], i) => { const px = 48 + (x - 48) * 0.93, py = 32 + (y - 32) * 0.9; i ? g.lineTo(px, py) : g.moveTo(px, py); }); g.closePath(); g.stroke();
    g.fillStyle = CC.goldL; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; twinkle(g, 48 + Math.cos(a) * 42.8, 32 + Math.sin(a) * 27, 1.2); }
  } },

  // a framed star chart: two round skies of the year's constellations, ruled in silver, a crescent between
  wallPiece('cstchart', 'Constellation star chart', 2, 480, 'metal', [
    B(32, 56, 0.6, 54, 34, 1.2, CC.silver, MT),
    PC(32, 56, 1.25, 50, 30, chart),
    st(32, 75.6, 0.8, 2.4, CC.gold, { d: 0.8 }),
    ...[[6, 40], [58, 40], [6, 72], [58, 72]].map(([x, h]) => st(x, h, 1.4, 1.4, CC.gold, { d: 0.4 })),
  ]),

  // a crescent-moon sconce that glows, a little lit star nestled in its curve and another dangling from its horn
  wallPiece('cstwalllamp', 'Constellation crescent wall lamp', 1, 420, 'metal', [
    DS(11, 60, 0.4, 4, 0.8, CC.silver, { m: 'metal', seg: 14 }),
    RD([11, 60, 0.8], [11, 60, 3.4], 0.6, CC.silver, MT),
    mn(18, 60, 4.2, 11, CC.moonG, { m: 'glow', d: 3 }),
    st(23.4, 61, 4.4, 4.2, CC.glow, { m: 'glow', d: 1.6 }),
    RD([23.6, 50.6, 4.2], [23.6, 46, 4.2], 0.2, CC.silver, MT), st(23.6, 44, 4.2, 1.8, CC.glow, { m: 'glow', d: 0.8 }),
  ], { glow: [CC.moonG, CC.glow], play: { does: 'light' } }),

  // a silver wire draped between two hooks, glowing stars hung along it on threads of different lengths
  wallPiece('cststring', 'Constellation star garland', 2, 360, 'metal', (() => {
    const at = (t) => [3 + 58 * t, 72 - 12 * (1 - (2 * t - 1) ** 2)];
    const parts = [3, 61].map(x => RD([x, 72, 0], [x, 72, 1.6], 0.5, CC.silver, MT));
    for (let i = 0; i < 10; i++) { const [x0, h0] = at(i / 10), [x1, h1] = at((i + 1) / 10); parts.push(RD([x0, h0, 1.4], [x1, h1, 1.4], 0.25, CC.silver, MT)); }
    for (let i = 0; i < 7; i++) {
      const [x, h] = at((i + 0.7) / 7.4), len = i % 2 ? 6 : 3;
      parts.push(RD([x, h, 1.4], [x, h - len, 1.4], 0.2, CC.silverL, PL), st(x, h - len - 2.6, 1.6, 2.8, i % 2 ? CC.glowB : CC.glow, { m: 'glow', d: 1.2 }));
    }
    return parts;
  })(), { glow: [CC.glow, CC.glowB], play: { does: 'light' } }),

  // a brass refracting telescope on a navy tripod tied with a silver tray, a finder scope alongside, pointed at the stars
  piece('csttelescope', 'Constellation telescope', 1, 1, 1350, 'metal', [
    ...[[4, -9], [28, -9], [16, 12]].flatMap(([x, z]) => [RD([16, 38, -1], [x, 0.8, z], 1, CC.navy, GL), S(x, 0.8, z, 1.3, 0.8, 1.3, CC.silver, { m: 'metal', seg: 8 })]),
    RD([8.4, 14, -6.1], [23.6, 14, -6.1], 0.5, CC.silver, MT), RD([23.6, 14, -6.1], [16, 14, 7.8], 0.5, CC.silver, MT), RD([16, 14, 7.8], [8.4, 14, -6.1], 0.5, CC.silver, MT),
    B(16, 39.4, -1, 4, 3, 4, CC.silver, MT), S(16, 41.4, -1, 2, 2, 2, CC.brassD, { m: 'metal', seg: 8 }),
    st(16, 39.4, 1.4, 1.4, CC.gold, { d: 0.5 }),
    RD([7, 35, 5], [25, 53, -5], 2.6, CC.brass, MT),
    RD([24.2, 52.2, -4.5], [28, 56, -6.6], 3.2, CC.brassD, MT),
    RD([4.6, 32.6, 6.3], [7, 35, 5], 1, CC.silver, MT),
    ...[0.25, 0.7].map(t => RD([7 + 18 * t, 35 + 18 * t, 5 - 10 * t], [7.6 + 18 * t, 35.6 + 18 * t, 4.7 - 10 * t], 2.9, CC.silver, MT)),
    RD([12, 43.6, 2.2], [18, 49.6, -1.1], 0.7, CC.silver, MT),
  ]),

  // an armillary sphere: silver and gold rings round a little glowing sun, the ecliptic's band aslant, its polar axis
  // capped with a star, on a turned navy stand
  piece('cstarmillary', 'Constellation armillary sphere', 1, 1, 1150, 'metal', [
    LA(16, 0, 0, [[8, 0], [8, 1.6], [6, 2.8], [3, 4], [2.4, 6]], CC.navy, { m: 'gloss', seg: 16 }),
    C(16, 12, 0, 1.6, 12, CC.silver, { m: 'metal', seg: 10, rb: 2.2 }), S(16, 18.6, 0, 2.4, 1.6, 2.4, CC.gold, { m: 'metal', seg: 10 }),
    RD([16, 18.6, 0], [16, 21.5, 0], 1, CC.silver, MT),
    S(16, 34, 0, 3, 3, 3, CC.sunG, { m: 'glow', seg: 12 }),
    RD([10.6, 21.6, 0], [21.4, 46.4, 0], 0.45, CC.silver, MT), st(22, 48, 0, 1.8, CC.gold, { d: 0.8 }),
    RG(16, 34, 0, 12, 0.7, CC.silver, { m: 'metal', ax: 'x' }),
    RG(16, 34, 0, 12, 0.7, CC.gold, { m: 'metal', flat: true }),
    RG(16, 34, 0, 12, 1.2, CC.gold, { m: 'metal', flat: true, rz: 0.41 }),
    RG(16, 34, 0, 13, 0.8, CC.silver, { m: 'metal' }),
  ], { glow: [CC.sunG], play: { does: 'spin' } }),

  // a celestial globe: the navy sky dotted with gold stars, in a silver meridian and a gold horizon ring on a stand
  piece('cstglobe', 'Constellation celestial globe', 1, 1, 980, 'gloss', [
    LA(16, 0, 0, [[8.6, 0], [8.6, 1.4], [6, 2.6], [2.2, 4]], CC.navy, { m: 'gloss', seg: 16 }),
    C(16, 11, 0, 1.4, 14, CC.silver, { m: 'metal', seg: 10, rb: 2 }),
    RD([16, 18, 0], [4.4, 31, 0], 0.7, CC.silver, MT), RD([16, 18, 0], [27.6, 31, 0], 0.7, CC.silver, MT),
    S(16, 32, 0, 11.4, 11.4, 11.4, CC.navy, { m: 'gloss', seg: 20 }),
    ...[[-5, 5, 1.6], [-1.5, 7.5, 1.1], [3, 3, 1.6], [6.5, -1, 1.1], [-6, -2, 1.2], [0, -5, 1.6], [4, -7.5, 1.1], [-3, 0.5, 0.9]]
      .map(([dx, dy, R], i) => st(16 + dx, 32 + dy, onBall(11.4, dx, dy), R, i % 3 ? CC.goldL : CC.gold, { d: 0.5 })),
    RD([10.6, 19.7, 0], [21.4, 44.3, 0], 0.5, CC.silver, MT), S(21.6, 44.8, 0, 1, 1, 1, CC.gold, { m: 'metal', seg: 8 }),
    RG(16, 32, 0, 12.6, 0.7, CC.silver, { m: 'metal' }),
    RG(16, 32, 0, 13.6, 1.4, CC.gold, { m: 'metal', flat: true }),
  ], { play: { does: 'spin' } }),

  // a brass orrery on a starry navy pedestal: a glowing sun at the middle and the planets on their arms, Saturn ringed
  piece('cstorrery', 'Constellation orrery', 1, 1, 1600, 'metal', (() => {
    const parts = [
      B(16, 7, 0, 24, 14, 20, CC.navy, STRG), B(16, 14.8, 0, 26, 1.6, 22, CC.silver, MT), B(16, 0.8, 0, 26, 1.6, 22, CC.silver, MT),
      st(16, 7.4, 10.3, 3, CC.gold, { d: 0.6 }),
      C(16, 19, 0, 1.4, 7, CC.brass, { m: 'metal', seg: 10 }), C(16, 23, 0, 3.6, 1.2, CC.brassD, { m: 'metal', seg: 12 }),
      RD([16, 23, 0], [16, 29.4, 0], 0.8, CC.brass, MT),
      S(16, 34, 0, 4.6, 4.6, 4.6, CC.sunG, { m: 'glow', seg: 14 }),
      RG(16, 24, 0, 12.6, 0.35, CC.silverD, { m: 'metal', flat: true }),
    ];
    for (const [r, deg, h, s, c, ringed] of [[6.4, 200, 27, 1.3, CC.silverL], [9, 320, 26, 1.9, CC.venus], [11.4, 60, 29, 2.2, CC.earth], [12.6, 150, 36, 2.2, CC.gold, true], [12.6, 255, 31, 1.7, CC.mars]]) {
      const a = deg * Math.PI / 180, px = 16 + Math.cos(a) * r, pz = Math.sin(a) * r;
      parts.push(RD([16, 24, 0], [px, 24, pz], 0.4, CC.brass, MT), RD([px, 24, pz], [px, h - s, pz], 0.35, CC.brass, MT), S(px, h, pz, s, s, s, c, { m: 'gloss', seg: 10 }));
      if (ringed) parts.push(RG(px, h, pz, s * 1.9, 0.35, CC.goldL, { m: 'metal', flat: true, rz: 0.3 }));
    }
    return parts;
  })(), { glow: [CC.sunG], play: { does: 'spin' } }),

  // a star projector: a navy dome pricked with glowing stars on a silver collar, on a slim three-legged stand
  piece('cstprojector', 'Constellation star projector', 1, 1, 820, 'gloss', (() => {
    const prof = [[5.4, 0], [9.4, 2], [10, 5.5], [9.4, 9], [7, 12.2], [3.6, 14.2], [0, 15]];
    const rAt = (up) => { for (let i = 1; i < prof.length; i++) if (up <= prof[i][1]) { const [r0, u0] = prof[i - 1], [r1, u1] = prof[i]; return r0 + (r1 - r0) * (up - u0) / (u1 - u0); } return 0; };
    return [
      ...[[6, -7], [26, -7], [16, 10]].map(([x, z]) => RD([16, 18, 0], [x, 0.6, z], 0.9, CC.navy, GL)),
      C(16, 19, 0, 5, 2.4, CC.silver, { m: 'metal', seg: 14 }),
      LA(16, 20, 0, prof, CC.navy, { m: 'gloss', seg: 18 }),
      RG(16, 25.5, 0, 10.1, 0.6, CC.silver, { m: 'metal', flat: true }),
      S(16, 35.4, 0, 1.4, 1, 1.4, CC.gold, { m: 'metal', seg: 8 }),
      ...[[-5, 9, 1.6], [1.6, 11.4, 1.2], [5.6, 7.4, 1.8], [-1, 3, 1.4], [-7, 2.6, 1.1], [6.4, 2.4, 1.2], [-2.4, 13.2, 0.9]]
        .map(([dx, up, R]) => st(16 + dx, 20 + up, Math.sqrt(Math.max(0, rAt(up) ** 2 - dx * dx)) + 0.2, R, CC.glow, { m: 'glow', d: 0.6 })),
    ];
  })(), { glow: [CC.glow], play: { does: 'light', stars: true } }),

  // Lunatone and Solrock floating over a starry navy plinth: the pale crescent with its red eye, the sun of rays with
  // its masked face
  piece('cstlunasol', 'Constellation Lunatone and Solrock', 2, 1, 1300, 'gloss', [
    B(32, 4.4, 0, 60, 8.8, 22, CC.navy, STRG), B(32, 9.2, 0, 62, 1.2, 24, CC.silver, MT),
    mn(17, 26, 0, 13, CC.luna, { m: 'gloss', d: 6 }),
    ...[[8.6, 33, 1.6], [7.4, 18, 1.2], [13, 15.6, 0.9]].map(([x, h, r]) => DS(x, h, 3.1, r, 0.4, CC.lunaD, { m: 'plain', seg: 8 })),
    DS(8.4, 26.4, 3.2, 2, 0.5, CC.eyeW, { m: 'plain', ry: 1.4, seg: 10 }), DS(8.8, 26.4, 3.5, 1.2, 0.4, CC.lunaEye, { m: 'plain', ry: 1.1, seg: 8 }),
    RD([6, 29.4, 3.2], [11, 29, 3.2], 0.35, CC.lunaD, PL),
    PR(47, 25, 0, starPts(12.4, 8.6, 10), 5, CC.sol, GL),
    DS(47, 25, 2.6, 8, 1, CC.solL, { m: 'gloss', seg: 16 }),
    B(47, 26, 3.4, 12, 3.6, 0.6, CC.solMask, PL),
    ...[-1, 1].map(s => DS(47 + s * 3, 26, 3.8, 1.1, 0.4, CC.lunaEye, { m: 'plain', ry: 0.9, seg: 8 })),
    ...sprinkle(4, 60, 1.6, 7.6, 11.2, 5, 9, 0.9),
  ]),

  // a beanbag Cosmog: its dark nebula of a body, blue cloud lobes either side, a sleepy smile and glowing star specks
  piece('cstcosmog', 'Constellation Cosmog cushion', 1, 1, 520, 'cloth', [
    S(16, 1.6, 3, 8, 1.6, 6, CC.cosmogL, { m: 'cloth', seg: 12 }),
    S(16, 12, 0, 10.6, 11, 10.6, CC.cosmog, { m: 'cloth', seg: 16 }),
    ...[-1, 1].flatMap(s => [S(16 + s * 10.6, 13.4, -1, 4.2, 6, 4.6, CC.cosmogL, { m: 'cloth', seg: 10 }), S(16 + s * 10.6, 18.6, -1, 2.6, 2.2, 2.6, CC.cosmogT, { m: 'cloth', seg: 8 })]),
    ...[-1, 1].flatMap(s => [
      DS(16 + s * 3.6, 14, onBall(10.6, 3.6, 2) - 0.4, 2, 0.5, CC.eyeW, { m: 'plain', ry: 2.5, seg: 10 }),
      DS(16 + s * 3.4, 13.6, onBall(10.6, 3.4, 1.6) - 0.1, 1.3, 0.4, CC.ink, { m: 'plain', ry: 1.7, seg: 8 }),
      DS(16 + s * 6.4, 9.6, onBall(10.6, 6.4, -2.4) - 0.3, 1.4, 0.4, CC.cosmogT, { m: 'plain', ry: 0.9, seg: 8 }),
    ]),
    RG(16, 10, onBall(10.6, 0, -2) - 0.2, 1.4, 0.3, CC.ink, { m: 'plain', a0: Math.PI * 1.15, arc: Math.PI * 0.7 }),
    ...[[-6, 6, 1.1], [5, 7, 0.8], [-7, -4, 0.8], [7.4, 2.4, 0.9], [0, -7, 0.8]].map(([dx, dy, R]) => st(16 + dx, 12 + dy, onBall(10.6, dx, dy), R, CC.starY, { m: 'glow', d: 0.4 })),
  ], { seat: 22, glow: [CC.starY] }),

  // a bedside cabinet: a star-knobbed drawer over an arched niche with a crescent, a glowing star night-light and a book
  piece('cstnightstand', 'Constellation nightstand', 1, 1, 450, 'gloss', [
    ...corners([5, 27], [-7, 7]).map(([x, z]) => LA(x, 0, z, [[1.2, 0], [1.8, 1.4], [1.6, 3.2]], CC.silver, { m: 'metal', seg: 8 })),
    B(16, 13, 0, 26, 20, 20, CC.navy, GL),
    B(16, 23.8, 0, 28, 1.8, 22, CC.navyD, GL), B(16, 23.8, 11.1, 28, 0.6, 0.4, CC.silver, MT),
    B(16, 18.6, 10.4, 22, 6.4, 0.9, CC.navyL, STRG), st(16, 18.6, 11.3, 1.4, CC.silver),
    B(16, 9, 10.2, 20, 8, 0.6, CC.navyD, PL), DS(16, 13, 10.2, 10, 0.6, CC.navyD, { m: 'plain', ry: 2.4, seg: 14 }),
    mn(16, 9.4, 10.7, 3.4, CC.gold, { d: 0.5, rot: 0.3 }),
    LA(14, 24.7, -1, [[3.6, 0], [3.6, 1], [2.6, 1.6]], CC.silver, { m: 'metal', seg: 10 }),
    st(14, 31, -1, 4.8, CC.glow, { m: 'glow', d: 2 }),
    B(24, 25.6, 2, 6, 1.8, 8, CC.indigo, GL), B(24, 25.6, 2, 5.4, 1.2, 8.2, CC.paper, PL),
  ], { top: 24.7, glow: [CC.glow], play: { does: 'light' } }),
];
