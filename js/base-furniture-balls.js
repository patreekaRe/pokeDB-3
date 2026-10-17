/* base-furniture-balls.js  -  the Poké Ball collection set (furniture expansion session b, 2026-10-17): 27 displays, one
   ball type each, every stand themed after its ball (the Master Ball in a velvet case on a gilt plinth, the Dive Ball in
   a tank, the Nest Ball in a twig nest...). One colour each, the ball's own.
   Every ball is the same: BALLS gives a type's top, bottom, band and button colours and its markings (`deco`), laid out
   on the sphere by angle: `a` round from the front towards the right, `t` down from the top pole, in degrees. Here
   `paintBall()` paints them in any view, and js/base-models-balls.js's `buildBall()` lays the same markings on one lathed
   sphere, so the two agree.
   An upright piece is a list of parts in painted units (32 a tile), BUILT: `x` across from its middle, `h` up from the
   floor (a wall piece's from the foot of its strip), `z` out to the front from its middle (a wall piece's from the wall).
   They're painted here from any side, and js/base-models-balls.js builds the same list. */

import { floorShadow, ctx, sh } from './base-paint.js';

const GROUP = 'Poké Balls';
const TAU = Math.PI * 2, RAD = Math.PI / 180;
export const INK = '#26262e', WHITE = '#f6f6f2', GOLD = '#d8b048', GLINT = '#f4dc88';

/* ---------- the balls ---------- */

const patch = (a0, a1, t0, t1, c) => ({ k: 'patch', a0, a1, t0, t1, c });
const ring = (t0, t1, c) => patch(-180, 180, t0, t1, c);
const spot = (a, t, s, c) => ({ k: 'spot', a, t, s, c });
/** A flat mark laid on the sphere at a, t: points in the ball's radii, x to the right, y up; `hole` cut out of it. */
const mark = (a, t, pts, c, hole) => ({ k: 'shape', a, t, pts, c, hole });
const flip = (pts) => pts.map(([x, y]) => [-x, y]).reverse();
const circle = (cx, cy, r, n = 16) => Array.from({ length: n }, (_, i) => [cx + Math.cos(i / n * TAU) * r, cy + Math.sin(i / n * TAU) * r]);
/** A heart `s` across, its middle at 0, 0 (y up). */
export const heartPts = (s, n = 28) => Array.from({ length: n }, (_, i) => {
  const t = i / n * TAU;
  return [16 * Math.sin(t) ** 3 * s / 32, (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t) + 2.5) * s / 32];
});

const M = [[-0.28, -0.2], [-0.16, -0.2], [-0.16, 0.06], [0, -0.1], [0.16, 0.06], [0.16, -0.2], [0.28, -0.2], [0.28, 0.21], [0.17, 0.21], [0, 0.03], [-0.17, 0.21], [-0.28, 0.21]];
const BOLT = [[-0.05, 0.3], [0.11, 0.3], [0.03, 0.06], [0.13, 0.06], [-0.09, -0.32], [-0.02, -0.04], [-0.12, -0.04]];
const SPIKE = [[-0.09, -0.3], [0.09, -0.3], [0.02, 0.36]];
const WING = [[-0.3, 0.02], [0.28, 0.22], [0.34, 0.12], [-0.22, -0.16]];
const crescentPts = () => {
  const out = [];
  for (let i = 0; i <= 12; i++) { const t = (40 + i * 280 / 12) * RAD; out.push([Math.cos(t) * 0.3, Math.sin(t) * 0.3]); }
  for (let i = 12; i >= 0; i--) { const t = (58 + i * 244 / 12) * RAD; out.push([0.13 + Math.cos(t) * 0.24, 0.04 + Math.sin(t) * 0.24]); }
  return out;
};

/** Each ball type: top and bottom halves, the band round its middle, its button's ring and face, and its markings. */
export const BALLS = {
  poke: { top: '#e23c3c' },
  great: { top: '#3a72d8', deco: [patch(25, 155, 12, 84, '#e84040'), patch(-155, -25, 12, 84, '#e84040')] },
  ultra: { top: '#2c2c34', deco: [patch(30, 150, 8, 80, '#f4c830'), patch(-150, -30, 8, 80, '#f4c830')] },
  master: { top: '#7a3cc0', deco: [spot(52, 44, 17, '#ec5aa8'), spot(-52, 44, 17, '#ec5aa8'), mark(0, 54, M, WHITE)] },
  safari: { top: '#86c058', bot: '#efe2b8', deco: [[-40, 40, 14], [35, 30, 12], [8, 66, 11], [-75, 70, 12], [70, 64, 13], [140, 45, 14], [-130, 50, 14], [180, 28, 12], [0, 12, 9], [-15, 50, 7]]
    .map(([a, t, s]) => spot(a, t, s, '#3e7a32')) },
  premier: { top: WHITE, band: '#d8383a' },
  luxury: { top: '#24242a', bot: '#24242a', ring: GOLD, btn: '#f4d878', deco: [ring(44, 48, GOLD), ring(48, 62, '#d03838'), ring(62, 66, GOLD)] },
  heal: { top: '#f088b8', ring: '#e85a98', deco: [ring(54, 66, '#fcd4e6'), spot(0, 0, 16, '#fcd4e6')] },
  net: { top: '#40b8c0', deco: [...Array.from({ length: 12 }, (_, i) => patch(i * 30 - 167, i * 30 - 163, 6, 86, '#1e3440')), ring(28, 31, '#1e3440'), ring(52, 55, '#1e3440'), ring(73, 76, '#1e3440')] },
  dive: { top: '#2a5cc8', deco: [ring(20, 28, '#8ad8f8'), ring(42, 50, '#8ad8f8'), ring(64, 72, '#8ad8f8')] },
  nest: { top: '#5aa83a', deco: [spot(0, 0, 20, '#3a7a2a'), ring(40, 62, '#c8e050')] },
  repeat: { top: '#e8702a', deco: [mark(44, 48, circle(0, 0, 0.3), '#f8d030', circle(0, 0, 0.18)), mark(-44, 48, circle(0, 0, 0.3), '#f8d030', circle(0, 0, 0.18))] },
  timer: { top: WHITE, deco: [...[0, 90, 180, -90].map(a => patch(a - 18, a + 18, 6, 80, '#d83a3a')), ring(80, 85, INK)] },
  quick: { top: '#3a88e0', bot: '#5ea4ea', deco: [spot(0, 0, 13, '#f8d030'), ...[45, 135, -45, -135].map(a => mark(a, 46, a < 0 ? flip(BOLT) : BOLT, '#f8d030'))] },
  dusk: { top: '#26302a', bot: '#34343c', deco: [spot(0, 0, 14, '#3a8a48'), ring(26, 34, '#58d068'), ring(56, 64, '#58d068')] },
  level: { top: '#2c2c34', deco: [patch(-16, 16, 0, 86, '#d83838'), patch(164, 196, 0, 86, '#d83838'),
    patch(16, 22, 4, 86, GOLD), patch(-22, -16, 4, 86, GOLD), patch(158, 164, 4, 86, GOLD), patch(196, 202, 4, 86, GOLD)] },
  lure: { top: '#2a7ad0', deco: [patch(74, 106, 0, 86, '#e04040'), patch(-106, -74, 0, 86, '#e04040'), spot(0, 52, 18, '#7ad0f0'), spot(180, 52, 18, '#7ad0f0')] },
  moon: { top: '#34407e', deco: [mark(0, 50, crescentPts(), '#f8e070'), spot(58, 32, 5, '#f8e070'), spot(-56, 62, 5, '#f8e070'), spot(-34, 24, 4, '#f8e070'), spot(130, 40, 6, '#f8e070'), spot(-140, 50, 6, '#f8e070')] },
  friend: { top: '#58b048', deco: [patch(-14, 14, 0, 86, '#e2503a'), patch(166, 194, 0, 86, '#e2503a'), spot(62, 50, 14, '#f0d040'), spot(-62, 50, 14, '#f0d040'), spot(118, 50, 14, '#f0d040'), spot(-118, 50, 14, '#f0d040')] },
  love: { top: '#f286b4', deco: [0, 90, 180, -90].map(a => mark(a, 48, heartPts(0.66), '#e83466')) },
  heavy: { top: '#8a94a6', bot: '#e4e6ec', deco: [ring(52, 70, '#3a5aa8'), patch(78, 102, 10, 48, INK), patch(-102, -78, 10, 48, INK)] },
  fast: { top: '#f4f4ee', deco: [ring(64, 72, '#f8c830'), mark(52, 40, WING, '#e85a30'), mark(-52, 40, flip(WING), '#e85a30'), mark(128, 40, flip(WING), '#e85a30'), mark(-128, 40, WING, '#e85a30')] },
  sport: { top: '#e88a30', deco: [...[-60, 60, 120, -120].map(a => patch(a - 2.5, a + 2.5, 4, 86, '#8a2a14')), ring(36, 40, '#8a2a14')] },
  park: { top: '#f0c838', ring: '#3a8ad8', deco: [ring(42, 62, '#58a848'), spot(0, 0, 14, '#e87830'), ...[0, 90, 180, -90].map(a => spot(a, 28, 7, '#3a8ad8'))] },
  dream: { top: '#ec94cc', bot: '#dcc0ec', deco: [[0, 40, 10], [50, 25, 7], [-55, 60, 9], [-20, 18, 6], [70, 62, 8], [140, 40, 10], [-130, 35, 8], [180, 65, 7]].map(([a, t, s]) => spot(a, t, s, '#a868d0')) },
  beast: { top: '#26307e', ring: '#58e0f8', deco: [ring(70, 76, '#58e0f8'), ...[38, -38, 142, -142].map(a => mark(a, 46, SPIKE, '#58e0f8'))] },
  cherish: { top: '#d82828', bot: '#c02020', deco: [ring(28, 36, '#8a1414'), ring(58, 66, '#8a1414'), spot(0, 0, 12, '#8a1414')] },
};
export const ballOf = (type) => ({ bot: WHITE, band: INK, btn: WHITE, deco: [], ...BALLS[type], ring: BALLS[type].ring || BALLS[type].band || INK });

/** A unit direction on the ball at a, t (degrees). */
export const dirOf = (a, t) => [Math.sin(t * RAD) * Math.sin(a * RAD), Math.cos(t * RAD), Math.sin(t * RAD) * Math.cos(a * RAD)];
/** Where a mark's point (u right, v up, in radii) lands on the ball, as a unit direction. */
export function markDir(a, t, u, v) {
  const d = dirOf(a, t), A = a * RAD, T = t * RAD;
  const e = [Math.cos(A), 0, -Math.sin(A)], n = [-Math.cos(T) * Math.sin(A), Math.sin(T), -Math.cos(T) * Math.cos(A)];
  const p = [0, 1, 2].map(i => d[i] + u * e[i] + v * n[i]), l = Math.hypot(...p);
  return p.map(c => c / l);
}
/** A closed outline with each edge cut in `n`. */
const fine = (pts, n = 5) => pts.flatMap((p, i) => { const q = pts[(i + 1) % pts.length]; return Array.from({ length: n }, (_, k) => [p[0] + (q[0] - p[0]) * k / n, p[1] + (q[1] - p[1]) * k / n]); });

/** A ball of radius r at cx, cy, seen from the view (C, S): its depth is x·S + z·C, across x·C - z·S. */
export function paintBall(cx, cy, r, type, C = 1, S = 0, { flat = false } = {}) {
  const g = ctx(), T = ballOf(type);
  const at = ([x, y, z]) => [cx + r * (x * C - z * S), cy - r * y, x * S + z * C];
  const shape = (outs) => { g.beginPath(); for (const pts of outs) pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
  g.save();
  g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.clip();
  g.fillStyle = T.bot; g.fillRect(cx - r, cy - 0.5, 2 * r, r + 0.5);
  g.fillStyle = T.top; g.fillRect(cx - r, cy - r, 2 * r, r);
  const av = Math.atan2(S, C) / RAD;
  for (const d of T.deco) {
    g.fillStyle = d.c;
    if (d.k === 'patch') {
      const ranges = d.a1 - d.a0 >= 360 ? [[av - 90, av + 90]] : [-360, 0, 360].map(k => [Math.max(d.a0 + k, av - 90), Math.min(d.a1 + k, av + 90)]).filter(([lo, hi]) => hi > lo);
      for (const [lo, hi] of ranges) {
        const pts = [], na = Math.max(2, Math.ceil((hi - lo) / 5)), nt = Math.max(2, Math.ceil((d.t1 - d.t0) / 5));
        for (let i = 0; i <= na; i++) pts.push(dirOf(lo + (hi - lo) * i / na, d.t0));
        for (let i = 0; i <= nt; i++) pts.push(dirOf(hi, d.t0 + (d.t1 - d.t0) * i / nt));
        for (let i = na; i >= 0; i--) pts.push(dirOf(lo + (hi - lo) * i / na, d.t1));
        for (let i = nt; i >= 0; i--) pts.push(dirOf(lo, d.t0 + (d.t1 - d.t0) * i / nt));
        shape([pts.map(at)]); g.fill();
      }
    } else if (d.k === 'spot') {
      if (at(dirOf(d.a, d.t))[2] < 0.12) continue;
      const pts = circle(0, 0, Math.tan(d.s * RAD), 20).map(([u, v]) => at(markDir(d.a, d.t, u, v)));
      shape([pts]); g.fill();
    } else {
      if (at(dirOf(d.a, d.t))[2] < 0.12) continue;
      const outs = [d.pts, d.hole].filter(Boolean).map(p => fine(p).map(([u, v]) => at(markDir(d.a, d.t, u, v))));
      shape(outs); g.fill('evenodd');
    }
  }
  g.fillStyle = T.band; g.fillRect(cx - r, cy - r * 0.08, 2 * r, r * 0.16);
  const light = g.createRadialGradient(cx - r * 0.38, cy - r * 0.42, r * 0.04, cx, cy, r);
  light.addColorStop(0, `rgba(255,255,255,${flat ? 0.25 : 0.5})`); light.addColorStop(0.42, 'rgba(255,255,255,0.06)');
  light.addColorStop(0.75, 'rgba(0,0,0,0.04)'); light.addColorStop(1, `rgba(20,10,30,${flat ? 0.18 : 0.38})`);
  g.fillStyle = light; g.fillRect(cx - r, cy - r, 2 * r, 2 * r);
  g.restore();
  // the button: face on from the front, a bump at its edge from the side
  if (C > 0.5) {
    g.fillStyle = T.ring; g.beginPath(); g.arc(cx, cy, r * 0.34, 0, TAU); g.fill();
    g.fillStyle = T.btn; g.beginPath(); g.arc(cx, cy, r * 0.22, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(40,40,50,0.35)'; g.lineWidth = Math.max(0.3, r * 0.04); g.beginPath(); g.arc(cx, cy, r * 0.13, 0, TAU); g.stroke();
  } else if (Math.abs(S) > 0.5) {
    const ex = cx - S * r;
    g.fillStyle = T.ring; g.fillRect(Math.min(ex, ex - S * r * 0.08), cy - r * 0.34, r * 0.08, r * 0.68);
  }
  if (!flat) {
    g.fillStyle = 'rgba(255,255,255,0.8)';
    g.beginPath(); g.ellipse(cx - r * 0.42, cy - r * 0.5, r * 0.16, r * 0.09, -0.6, 0, TAU); g.fill();
  }
}

/* ---------- parts ---------- */

const BX = (x, h, z, w, hh, d, c, o) => ({ t: 'box', x, h, z, w, hh, d, c, r: 1, ...o });
const CY = (x, h, z, r, hh, c, o) => ({ t: 'cyl', x, h, z, r, hh, c, ...o });
/** A disc facing the front, `th` thick. */
const DK = (x, h, z, r, th, c, o) => ({ t: 'disc', x, h, z, r, th, c, ...o });
const EL = (x, h, z, rx, ry, rz, c, o) => ({ t: 'egg', x, h, z, rx, ry, rz, c, ...o });
/** A lathe from h up, its profile [[r, up]...]. */
const LA = (x, h, z, pts, c, o) => ({ t: 'lathe', x, h, z, pts, c, ...o });
/** A ring R round, its tube r: `axis` 'z' faces the front, 'y' lies flat, 'x' faces the side. */
const TR = (x, h, z, R, r, c, o) => ({ t: 'torus', x, h, z, R, r, c, axis: 'y', ...o });
/** A flat shape facing the front, its points [[x, up]...] round x, h, `th` thick. */
const SB = (x, h, z, pts, th, c, o) => ({ t: 'slab', x, h, z, pts, th, c, ...o });
/** A stick from [x, h, z] to [x, h, z]. */
const SK = (p0, p1, r, c, o) => ({ t: 'stick', x: (p0[0] + p1[0]) / 2, h: (p0[1] + p1[1]) / 2, z: (p0[2] + p1[2]) / 2, p0, p1, r, c, ...o });
const BL = (x, h, z, r, type, o) => ({ t: 'ball', x, h, z, r, type, ...o });
/** A painting-only touch, front view only (a clock's ticks, a label). */
const FN = (z, fn) => ({ t: 'fn', x: 0, h: 0, z, fn, paintOnly: true });

/* ---------- painting the parts ---------- */

const VIEW = [[1, 0], [0, -1], [-1, 0], [0, 1]];
const grad = (g, x0, y0, x1, y1, c) => {
  const l = g.createLinearGradient(x0, y0, x1, y1);
  l.addColorStop(0, sh(c, 1)); l.addColorStop(0.35, c); l.addColorStop(1, sh(c, -1));
  return l;
};
const across = (g, x0, x1, c) => {
  const l = g.createLinearGradient(x0, 0, x1, 0);
  l.addColorStop(0, sh(c, -1)); l.addColorStop(0.28, sh(c, 1)); l.addColorStop(0.5, c); l.addColorStop(1, sh(c, -1));
  return l;
};
const glassTint = (q) => q.tint || '#d4ecf6';

/** The outline of a part in the view, as a path on g; false for parts drawn otherwise. */
function outlinePath(g, q, X, Y, C, S) {
  const cx = X(q.x, q.z), cy = Y(q.h);
  g.beginPath();
  switch (q.t) {
    case 'box': { const w = Math.abs(q.w * C) + Math.abs(q.d * S); g.roundRect(cx - w / 2, cy - q.hh / 2, w, q.hh, Math.min(q.r, w / 2, q.hh / 2)); return true; }
    case 'cyl': { const rb = q.rb ?? q.r; g.moveTo(cx - q.r, cy - q.hh / 2); g.lineTo(cx + q.r, cy - q.hh / 2); g.lineTo(cx + rb, cy + q.hh / 2); g.lineTo(cx - rb, cy + q.hh / 2); g.closePath(); return true; }
    case 'egg': g.ellipse(cx, cy, Math.abs(q.rx * C) + Math.abs(q.rz * S), q.ry, 0, 0, TAU); return true;
    case 'lathe': {
      const pts = q.pts.map(([r, up]) => [r, cy - up]);
      [...pts.map(([r, y]) => [cx - r, y]), ...pts.slice().reverse().map(([r, y]) => [cx + r, y])].forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.closePath(); return true;
    }
  }
  return false;
}

function paintParts(parts, cx, b, dir) {
  const g = ctx(), [C, S] = VIEW[dir];
  const X = (x, z) => cx + x * C - z * S, Y = (h) => b - h;
  const depth = (q) => q.x * S + q.z * C + (q.k || 0);
  const list = parts.filter(q => dir === 0 || !q.paintOnly).map((q, i) => [depth(q), i, q]).sort((a, c) => a[0] - c[0] || a[1] - c[1]).map(e => e[2]);
  const glass = list.filter(q => q.m === 'glass');
  // glass first, faint, so what stands in it shows through; its shine goes over everything after
  for (const q of glass) { if (!outlinePath(g, q, X, Y, C, S)) continue; g.save(); g.globalAlpha = 0.56; g.fillStyle = glassTint(q); g.fill(); g.restore(); }
  for (const q of list) if (q.m !== 'glass') paintPart(g, q, X, Y, C, S, dir);
  for (const q of glass) {
    if (!outlinePath(g, q, X, Y, C, S)) continue;
    g.save(); g.globalAlpha = 0.16; g.fillStyle = glassTint(q); g.fill(); g.clip();
    g.globalAlpha = 0.55; g.strokeStyle = '#ffffff'; g.lineWidth = 1.4;
    const cx = X(q.x, q.z), cy = Y(q.h), w = (q.w || (q.rx || 10) * 2), hh = (q.hh || (q.ry || 10) * 2);
    g.beginPath(); g.moveTo(cx - w * 0.36, cy + hh * 0.2); g.lineTo(cx - w * 0.1, cy - hh * 0.46); g.stroke();
    g.lineWidth = 0.8; g.beginPath(); g.moveTo(cx - w * 0.2, cy + hh * 0.36); g.lineTo(cx + w * 0.04, cy - hh * 0.3); g.stroke();
    g.restore();
    g.save(); outlinePath(g, q, X, Y, C, S); g.globalAlpha = 0.5; g.strokeStyle = '#ffffff'; g.lineWidth = 0.6; g.stroke(); g.restore();
  }
}

function paintPart(g, q, X, Y, C, S, dir) {
  const cx = X(q.x, q.z), cy = Y(q.h), side = Math.abs(S) > 0.5;
  switch (q.t) {
    case 'box': {
      const w = Math.abs(q.w * C) + Math.abs(q.d * S), x = cx - w / 2, y = cy - q.hh / 2, r = Math.min(q.r, w / 2, q.hh / 2);
      g.fillStyle = grad(g, x, y, x + w * 0.3, y + q.hh, q.c); g.beginPath(); g.roundRect(x, y, w, q.hh, r); g.fill();
      if (q.hh > 3 && w > 3) { g.save(); g.globalAlpha = 0.5; g.fillStyle = sh(q.c, 1); g.beginPath(); g.roundRect(x + r * 0.6, y + 0.35, w - r * 1.2, 0.7, 0.35); g.fill(); g.restore(); }
      break;
    }
    case 'cyl': {
      outlinePath(g, q, X, Y, C, S); g.fillStyle = across(g, cx - Math.max(q.r, q.rb ?? q.r), cx + Math.max(q.r, q.rb ?? q.r), q.c); g.fill();
      const ry = Math.min(q.r * 0.22, q.hh / 2);
      g.fillStyle = sh(q.c, 1); g.beginPath(); g.ellipse(cx, cy - q.hh / 2 + ry, q.r * 0.96, ry, 0, 0, TAU); g.fill();
      break;
    }
    case 'disc': {
      if (side) { g.fillStyle = across(g, cx - q.th / 2, cx + q.th / 2, q.c); g.fillRect(cx - q.th / 2, cy - q.r, q.th, q.r * 2); break; }
      const s = g.createRadialGradient(cx - q.r * 0.35, cy - q.r * 0.4, 0, cx, cy, q.r * 1.05);
      s.addColorStop(0, sh(q.c, 1)); s.addColorStop(0.6, q.c); s.addColorStop(1, sh(q.c, -1));
      g.fillStyle = s; g.beginPath(); g.arc(cx, cy, q.r, 0, TAU); g.fill();
      break;
    }
    case 'egg': {
      const rx = Math.abs(q.rx * C) + Math.abs(q.rz * S), tilt = side ? 0 : (q.tilt || 0) * C;
      g.save(); g.translate(cx, cy); if (tilt) g.rotate(tilt); g.scale(1, q.ry / rx);
      const s = g.createRadialGradient(-rx * 0.35, -rx * 0.42, 0, 0, 0, rx * 1.05);
      s.addColorStop(0, sh(q.c, 1)); s.addColorStop(0.55, q.c); s.addColorStop(1, sh(q.c, -1));
      g.fillStyle = s; g.beginPath(); g.arc(0, 0, rx, 0, TAU); g.fill(); g.restore();
      break;
    }
    case 'lathe': {
      const r = Math.max(...q.pts.map(p => p[0]));
      outlinePath(g, q, X, Y, C, S); g.fillStyle = across(g, cx - r, cx + r, q.c); g.fill();
      break;
    }
    case 'torus': {
      const faceOn = (q.axis === 'z' && !side) || (q.axis === 'x' && side);
      if (q.axis === 'y' || !faceOn) {
        const [w, hh] = q.axis === 'y' ? [2 * (q.R + q.r), 2 * q.r] : [2 * q.r, 2 * (q.R + q.r)];
        g.fillStyle = q.axis === 'y' ? across(g, cx - w / 2, cx + w / 2, q.c) : grad(g, cx - w / 2, cy - hh / 2, cx + w / 2, cy + hh / 2, q.c);
        g.beginPath(); g.roundRect(cx - w / 2, cy - hh / 2, w, hh, Math.min(w, hh) / 2); g.fill();
        break;
      }
      const a0 = q.rot || 0, a1 = a0 + (q.arc ?? TAU), mir = C < 0 || S > 0 ? -1 : 1;
      g.strokeStyle = grad(g, cx - q.R, cy - q.R, cx + q.R, cy + q.R, q.c); g.lineWidth = q.r * 2; g.lineCap = 'round';
      g.beginPath();
      if (mir < 0) g.arc(cx, cy, q.R, Math.PI + a0, Math.PI + a1, false); else g.arc(cx, cy, q.R, -a0, -a1, true);
      g.stroke();
      break;
    }
    case 'slab': {
      if (side) {
        const ys = q.pts.map(p => p[1]), top = Y(q.h + Math.max(...ys)), bot = Y(q.h + Math.min(...ys));
        g.fillStyle = across(g, cx - q.th / 2, cx + q.th / 2, q.c); g.beginPath(); g.roundRect(cx - q.th / 2, top, q.th, bot - top, Math.min(q.th / 3, 1)); g.fill();
        break;
      }
      const xs = q.pts.map(p => p[0]), ys = q.pts.map(p => p[1]);
      g.fillStyle = grad(g, cx + Math.min(...xs), Y(q.h + Math.max(...ys)), cx + Math.max(...xs), Y(q.h + Math.min(...ys)), q.c);
      g.beginPath();
      for (const pts of [q.pts, ...(q.holes || [])]) { pts.forEach(([x, y], i) => (i ? g.lineTo(cx + x * C, Y(q.h + y)) : g.moveTo(cx + x * C, Y(q.h + y)))); g.closePath(); }
      g.fill('evenodd');
      break;
    }
    case 'stick': {
      const a = [X(q.p0[0], q.p0[2]), Y(q.p0[1])], c = [X(q.p1[0], q.p1[2]), Y(q.p1[1])];
      g.lineCap = 'round'; g.strokeStyle = q.c; g.lineWidth = q.r * 2;
      g.beginPath(); g.moveTo(...a); g.lineTo(...c); g.stroke();
      if (q.r > 0.5) { g.strokeStyle = sh(q.c, 1); g.lineWidth = q.r * 0.6; g.beginPath(); g.moveTo(a[0] - q.r * 0.35, a[1]); g.lineTo(c[0] - q.r * 0.35, c[1]); g.stroke(); }
      break;
    }
    case 'ball': paintBall(cx, cy, q.r, q.type, C, S); break;
    case 'fn': q.fn(g, (x) => X(x, 0), Y); break;
  }
}

/* ---------- shapes the stands share ---------- */

/** A regular polygon's points, n corners, radius R, its first corner at the top. */
const ngon = (n, R, cy = 0) => Array.from({ length: n }, (_, i) => [Math.sin(i / n * TAU) * R, cy + Math.cos(i / n * TAU) * R]);
/** A five-pointed star r across. */
const star = (r) => Array.from({ length: 10 }, (_, i) => { const a = i / 10 * TAU, l = i % 2 ? r * 0.45 : r; return [Math.sin(a) * l, Math.cos(a) * l]; });
/** A crescent's cradle, horns up: the outer circle R round its middle, the inner one meeting it at the horns. */
function cradle(R, horn, thick) {
  const hy = Math.sin(horn) * R, hx = Math.cos(horn) * R, c = (hx * hx + hy * hy - (R - thick) ** 2) / (2 * (hy + R - thick));
  const ri = Math.hypot(hx, hy - c), out = [];
  const o0 = Math.PI - horn, o1 = TAU + horn;
  for (let i = 0; i <= 16; i++) { const t = o0 + (o1 - o0) * i / 16; out.push([Math.cos(t) * R, Math.sin(t) * R]); }
  const i0 = Math.atan2(hy - c, hx), i1 = Math.atan2(hy - c, -hx) - TAU;
  for (let i = 0; i <= 16; i++) { const t = i0 + (i1 - i0) * i / 16; out.push([Math.cos(t) * ri, c + Math.sin(t) * ri]); }
  return { pts: out, bottom: c - ri };
}
const MOON = cradle(12.5, 22 * RAD, 3.4);

/* ---------- the kinds ---------- */

/** What js/base-models-balls.js builds for each upright and wall kind: its parts. */
export const BUILT = {};
/** What a tap on each does (js/base-play.js's `does`). */
export const PLAYS = {};

function piece(id, name, w, h, price, parts, { play, ...rest } = {}) {
  BUILT[id] = parts;
  if (play) PLAYS[id] = play;
  return { id, name, w, h, price, ...rest, draw(x, b, vw, dir) { floorShadow(x, b, vw); paintParts(parts, x + vw / 2, b, dir); } };
}
function wallPiece(id, name, w, price, parts, rest = {}) {
  BUILT[id] = parts;
  return { id, name, w, h: 1, layer: 'wall', price, ...rest, wall(x) { paintParts(parts, x + w * 16, 96, 0); } };
}

const WOOD = '#9a6436', DARKWOOD = '#5a3a24', BRASS = '#d8a848', CHROME = '#c8ccd8';
/** A net bag hugging a ball at h, r round: rings and strings, hung from `top`. */
function netBag(h, r, top, c) {
  const lv = [[top, 0.6], [h + r * 0.95, r * 0.55], [h + r * 0.5, r * 0.94], [h, r * 1.08], [h - r * 0.5, r * 0.94], [h - r * 0.86, r * 0.6], [h - r * 1.08, 0.8]];
  const out = [];
  for (const [y, R] of lv.slice(2, 5)) out.push(TR(0, y, 0, R, 0.42, c));
  for (let k = 0; k < 6; k++) {
    const a = (k + 0.5) / 6 * TAU, P = ([y, R]) => [Math.sin(a) * R, y, Math.cos(a) * R];
    for (let i = 0; i < lv.length - 1; i++) out.push(SK(P(lv[i]), P(lv[i + 1]), 0.4, c, { m: 'plain' }));
  }
  out.push(EL(0, h - r * 1.1, 0, 1.2, 1.4, 1.2, c, { m: 'plain' }));
  return out;
}

const TICKS = (cx, ch, r) => FN(20, (g, X, Y) => {
  g.fillStyle = INK;
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.beginPath(); g.arc(X(cx) + Math.sin(a) * r, Y(ch) - Math.cos(a) * r, i % 3 ? 0.35 : 0.6, 0, TAU); g.fill(); }
});
const LABEL = (s, x, h, size, c) => FN(30, (g, X, Y) => { g.font = `bold ${size}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = c; g.fillText(s, X(x), Y(h)); });

const HEART_OUT = heartPts(28), HEART_IN = heartPts(17).map(([x, y]) => [x, y + 1.2]);
const HEX = ngon(6, 15), HEX_IN = ngon(6, 11.2), HEX_GLOW = ngon(6, 10.4);
const ANVIL = [[-9, 8], [9, 8], [9, 10], [5, 13], [5, 16], [12, 17], [13, 22], [-6, 22], [-14, 20.5], [-7, 17.5], [-5, 16], [-5, 13], [-9, 10]].map(([x, y]) => [x, y - 15]);
const QBOLT = [[2, 3], [6.5, 3], [4.2, 10], [9.5, 10], [3.4, 24], [-3.4, 24], [0.6, 15], [-3.8, 15]].map(([x, y]) => [x, y - 13.5]);
const WEED = (s) => [[0, 0], [2, 0], [3.5 * s, 5], [1.5 * s + 1, 10], [3 * s + 1, 15], [1.2, 18], [0.4 * s, 15], [-1 * s, 10], [1 * s, 5]];

export const BALL_KINDS = [
  // the plain Poké Ball on a turned wooden stand in a brass cup, a brass plate on its foot
  piece('pbpoke', 'Poké Ball keepsake stand', 1, 1, 300, [
    LA(0, 0, 0, [[12, 0], [12, 2.5], [10, 3.5], [6, 5], [4.5, 8], [4.5, 15], [7, 17], [8.5, 18.5], [0, 18.5]], WOOD, { m: 'wood' }),
    TR(0, 18.8, 0, 5.4, 1.2, BRASS, { m: 'metal' }),
    BL(0, 27.5, 0, 9, 'poke'),
    BX(0, 1.6, 12.2, 9, 2.6, 1.2, BRASS, { m: 'metal', r: 0.4 }),
  ], { play: 'ball' }),

  // the Ultra Ball high on a black column banded in yellow, an H on its front
  piece('pbultra', 'Ultra Ball pedestal', 1, 1, 600, [
    BX(0, 1.5, 0, 26, 3, 26, '#2a2a32'),
    BX(0, 3.8, 0, 22, 1.6, 22, '#f4c830'),
    CY(0, 13.3, 0, 6, 17.4, '#2c2c34', { rb: 7.2 }),
    CY(0, 22.6, 0, 8.4, 1.6, '#f4c830'),
    SB(0, 13, 6.9, [[-3, -4], [-1.5, -4], [-1.5, -0.7], [1.5, -0.7], [1.5, -4], [3, -4], [3, 4], [1.5, 4], [1.5, 0.7], [-1.5, 0.7], [-1.5, 4], [-3, 4]], 1, '#f4c830'),
    BL(0, 31.8, 0, 8.6, 'ultra'),
  ], { play: 'ball' }),

  // the showpiece: the Master Ball on a velvet cushion in a gold-framed glass case, up on a gilt plinth
  piece('pbmaster', 'Master Ball showcase', 1, 1, 2500, [
    BX(0, 1.8, 0, 28, 3.6, 28, GOLD, { m: 'metal' }),
    BX(0, 4.2, 0, 26, 1.4, 26, GLINT, { m: 'metal' }),
    BX(0, 12.8, 0, 22, 16, 22, '#4a2a6a'),
    BX(0, 13, 11.4, 10, 4, 0.8, GOLD, { m: 'metal', r: 0.4 }),
    BX(0, 21.6, 0, 24, 1.8, 24, GOLD, { m: 'metal' }),
    BX(0, 23, 0, 20, 1.2, 20, '#5a1a3a', { m: 'cloth' }),
    BX(0, 34, -9.3, 19, 21, 0.8, '#6a1a48', { m: 'cloth' }),
    EL(0, 25.2, 0, 7.5, 2.4, 7.5, '#8a2058', { m: 'cloth' }),
    BL(0, 34.4, 0, 7.6, 'master'),
    BX(0, 34, 0, 20, 21.6, 20, '#d4ecf6', { m: 'glass', r: 0.3 }),
    ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => CY(sx * 9.9, 34, sz * 9.9, 0.6, 21.6, GOLD, { m: 'metal' })),
    BX(0, 45.4, 0, 21.4, 1.6, 21.4, GOLD, { m: 'metal' }),
    LA(0, 46.2, 0, [[3, 0], [1.4, 1.4], [1, 2.6], [0, 2.6]], GOLD, { m: 'metal' }),
    EL(0, 49.8, 0, 1.4, 1.4, 1.4, '#ec5aa8'),
    LABEL('M', 0, 13, 3.2, '#4a2a6a'),
  ], { play: 'ball' }),

  // the Safari Ball nestled in grass on a woven wicker stand
  piece('pbsafari', 'Safari Ball wicker stand', 1, 1, 500, [
    LA(0, 0, 0, [[7.5, 0], [7.5, 1.2], [5.5, 2.2], [4.5, 9], [6, 13], [11, 15.5], [11, 17.5], [0, 17.5]], '#c8a060', { m: 'cloth' }),
    TR(0, 1.1, 0, 7, 1, '#a07840', { m: 'cloth' }),
    TR(0, 17, 0, 10.6, 1.1, '#a07840', { m: 'cloth' }),
    BL(0, 25, 0, 8, 'safari'),
    ...Array.from({ length: 9 }, (_, i) => { const a = (i / 9 + 0.03) * TAU; return EL(Math.sin(a) * 8.4, 19.5, Math.cos(a) * 8.4, 1.3, 4, 1.3, i % 2 ? '#5a9a3a' : '#78b848', { m: 'plain', tilt: Math.sin(a) * 0.35 }); }),
  ], { play: 'ball' }),

  // the Premier Ball framed in a white shadow box, on a red backing behind glass
  wallPiece('pbpremier', 'Premier Ball shadow box', 1, 350, [
    BX(0, 56, 0.6, 24, 24, 1.2, '#d8383a', { m: 'cloth' }),
    BX(0, 68.5, 6.5, 28, 3.6, 13, '#f4f2ec'), BX(0, 43.5, 6.5, 28, 3.6, 13, '#f4f2ec'),
    BX(-12.2, 56, 6.5, 3.6, 22, 13, '#f4f2ec'), BX(12.2, 56, 6.5, 3.6, 22, 13, '#f4f2ec'),
    BX(0, 47.6, 4, 9, 1.2, 6, '#f4f2ec'),
    BL(0, 54.6, 6.4, 6.2, 'premier'),
    BX(0, 56, 12.9, 21, 21, 0.4, '#d4ecf6', { m: 'glass', r: 0.2 }),
    BX(0, 43.5, 13.2, 8, 1.8, 0.4, GOLD, { m: 'metal', r: 0.3 }),
  ]),

  // the Luxury Ball on red velvet in a black-and-gold jewellery box, its lid stood open behind
  piece('pbluxury', 'Luxury Ball jewellery box', 1, 1, 1200, [
    ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => CY(sx * 11, 0.7, sz * 8, 1.3, 1.4, GOLD, { m: 'metal' })),
    BX(0, 7.4, 0, 26, 12, 20, '#1e1e24', { r: 1.2 }),
    BX(0, 2.2, 0, 26.6, 1, 20.6, GOLD, { m: 'metal', r: 0.3 }),
    BX(0, 12.8, 0, 26.6, 1, 20.6, GOLD, { m: 'metal', r: 0.3 }),
    BX(0, 13.5, 0.4, 23, 0.6, 17, '#c02838', { m: 'cloth', r: 0.3 }),
    BX(0, 22.5, -9.2, 26, 18, 1.6, '#1e1e24', { r: 0.8 }),
    BX(0, 22.5, -8.2, 22, 14, 0.5, '#c02838', { m: 'cloth', r: 0.4 }),
    BX(0, 31.2, -9.2, 26.6, 0.9, 2, GOLD, { m: 'metal', r: 0.3 }),
    BX(0, 9.4, 10.3, 3, 3.6, 0.8, GOLD, { m: 'metal', r: 0.4 }),
    TR(0, 14.4, 1.5, 4, 0.9, GOLD, { m: 'metal' }),
    BL(0, 21.4, 1.5, 7, 'luxury'),
  ], { play: 'ball' }),

  // the Heal Ball on a little pink table's tray, like a Pokémon Center's
  piece('pbheal', 'Heal Ball healing tray', 1, 1, 450, [
    LA(0, 0, 0, [[9, 0], [9, 1.6], [3.2, 3.2], [2.4, 4], [2.4, 18], [0, 18]], '#f4a8c8'),
    CY(0, 19, 0, 13, 2, '#f8c8dc'),
    BX(0, 21.1, 0, 22, 2.2, 15, '#f2f2f6', { r: 1 }),
    BX(0, 21.1, 7.7, 6, 1.4, 0.4, '#e85a98', { r: 0.3 }), BX(0, 21.1, 7.7, 1.4, 1.4, 0.4, '#e85a98', { r: 0.3, k: 0.1 }),
    TR(0, 22.6, 0, 4.4, 0.9, '#e85a98'),
    BL(0, 30, 0, 7.6, 'heal'),
  ], { play: 'heal' }),

  // the Net Ball caught in a teal net bag, hung from a wooden frame
  piece('pbnet', 'Net Ball hanging net', 1, 1, 500, [
    ...[-1, 1].map(s => BX(s * 12.5, 1, 0, 4, 2, 16, DARKWOOD, { m: 'wood' })),
    ...[-1, 1].map(s => CY(s * 12.5, 26, 0, 1.4, 50, '#8a6a42', { m: 'wood' })),
    SK([-13.6, 50.4, 0], [13.6, 50.4, 0], 1.4, '#8a6a42', { m: 'wood' }),
    SK([0, 49.2, 0], [0, 42.4, 0], 0.45, '#d8c8a0', { m: 'plain' }),
    BL(0, 31.5, 0, 8, 'net'),
    ...netBag(31.5, 8, 42.4, '#2a9aa8'),
  ], { play: 'ball' }),

  // the Dive Ball on a rock in an aquarium, sand, weed and bubbles, a light in its lid
  piece('pbdive', 'Dive Ball aquarium', 2, 1, 1400, [
    BX(0, 7.5, 0, 60, 15, 26, '#2a4a78', { r: 1.2 }),
    BX(-14, 7.5, 13.2, 24, 10, 0.6, '#34588a', { r: 0.6 }), BX(14, 7.5, 13.2, 24, 10, 0.6, '#34588a', { r: 0.6 }),
    BX(0, 16, 0, 56, 2, 22, '#e8d8a0', { m: 'plain', r: 0.6 }),
    BX(0, 29, 0, 56, 24, 22, '#68b8e8', { m: 'glass', tint: '#68b8e8', r: 0.2 }),
    BX(0, 30, 0, 58, 28, 24, '#d4ecf6', { m: 'glass', r: 0.3, k: -1 }),
    EL(-2, 18.6, 1, 7, 3, 6, '#8a8a96', { m: 'plain' }), EL(8, 17.8, -4, 4, 2, 4, '#7a7a86', { m: 'plain' }),
    BL(-2, 27.6, 1, 7, 'dive'),
    SB(-20, 17, -3, WEED(1), 2, '#4aa858', { m: 'plain' }), SB(-15, 17, -6, WEED(-1).map(([x, y]) => [x, y * 0.8]), 2, '#3a9048', { m: 'plain' }),
    SB(20, 17, -2, WEED(-1), 2, '#4aa858', { m: 'plain' }),
    EL(15, 18.4, 4, 2.4, 2.4, 2, '#f08a9a', { m: 'plain' }), EL(17.5, 19.2, 3, 1.6, 3, 1.4, '#f08a9a', { m: 'plain' }),
    ...[[4, 34, 4, 1.1], [6, 38, 3, 0.8], [4.6, 41, 4, 0.6], [-16, 30, -2, 0.9], [-15, 35, -2, 0.6]].map(([x, h, z, r]) => EL(x, h, z, r, r, r, '#f0faff')),
    BX(0, 45, 0, 60, 2, 26, '#2a4a78', { r: 0.6 }),
    BX(0, 43.6, 0, 50, 0.8, 16, '#c8f0ff', { m: 'glow', r: 0.3 }),
  ], { glow: ['#c8f0ff'], play: 'bubbles' }),

  // the Nest Ball in a twig nest on a tree stump
  piece('pbnest', 'Nest Ball stump nest', 1, 1, 450, [
    LA(0, 0, 0, [[12, 0], [10.4, 1.6], [9.4, 3.5], [9, 13.6], [9.4, 15], [0, 15]], '#8a5a32', { m: 'wood' }),
    CY(0, 15.1, 0, 9.2, 0.4, '#d8b080', { m: 'plain' }),
    EL(-9.5, 1.8, 4, 3.2, 1.8, 2.2, '#7a4e2a', { m: 'wood' }), EL(8.5, 1.8, -5, 3.2, 1.8, 2.4, '#7a4e2a', { m: 'wood' }), EL(3, 1.6, 10, 2.4, 1.6, 2.6, '#7a4e2a', { m: 'wood' }),
    TR(0, 17.2, 0, 7.2, 2.6, '#a87a48', { m: 'wood' }),
    TR(0, 19.6, 0, 7.8, 1.8, '#8a6238', { m: 'wood' }),
    ...[[-1, 0.4], [1, -0.5], [-0.2, 1]].map(([s, z], i) => SK([s * 10, 18 + i, z * 6], [-s * 3, 20.6 - i, z * 9], 0.5, '#6a4628', { m: 'wood' })),
    BL(0, 25, 0, 7.5, 'nest'),
    EL(-7, 21.4, 5, 2.4, 1.1, 1.4, '#6aa840', { m: 'plain', tilt: -0.5 }), EL(7.6, 20.8, 4, 2.2, 1, 1.4, '#5a9838', { m: 'plain', tilt: 0.4 }),
  ], { play: 'ball' }),

  // Repeat Balls, again and again: three of them up three steps
  piece('pbrepeat', 'Repeat Ball steps', 2, 1, 750, [
    ...[[-20, 8], [0, 14], [20, 20]].flatMap(([x, hh]) => [
      BX(x, hh / 2, 0, 20, hh, 20, '#f0e8d8'),
      BX(x, hh - 0.5, 0, 20.4, 1, 20.4, '#e8702a', { r: 0.4 }),
      TR(x, hh + 0.4, 0, 3.4, 0.8, '#f8d030'),
      BL(x, hh + 7, 0, 6.8, 'repeat'),
    ]),
  ], { play: 'ball' }),

  // the Timer Ball up on a pedestal with a clock in its face
  piece('pbtimer', 'Timer Ball clock pedestal', 1, 1, 650, [
    BX(0, 2, 0, 24, 4, 24, DARKWOOD, { m: 'wood' }),
    BX(0, 15, 0, 18, 22, 18, '#f0ece4'),
    BX(0, 27.2, 0, 22, 2.4, 22, DARKWOOD, { m: 'wood' }),
    DK(0, 15.5, 9.2, 7, 0.8, '#ffffff'),
    TR(0, 15.5, 9.4, 7, 0.75, '#d83a3a', { axis: 'z' }),
    BX(0, 17.4, 9.9, 0.8, 4.4, 0.4, INK, { r: 0.3 }), BX(1.6, 15.5, 9.9, 3.6, 0.8, 0.4, INK, { r: 0.3 }),
    TICKS(0, 15.5, 5.6),
    TR(0, 28.8, 0, 4.4, 1, '#d83a3a'),
    BL(0, 36.6, 0, 8, 'timer'),
  ], { play: 'chime' }),

  // the Quick Ball held up on a lightning bolt
  piece('pbquick', 'Quick Ball lightning stand', 1, 1, 550, [
    CY(0, 1.5, 0, 11, 3, '#2a4a8a'),
    SB(0, 13.5, 0, QBOLT, 5, '#f8d030'),
    TR(0, 24.6, 0, 4, 1, '#f8d030'),
    BL(0, 32.2, 0, 7.6, 'quick'),
  ], { play: 'ball' }),

  // the Dusk Ball under a smoked glass dome, a green light round its foot
  piece('pbdusk', 'Dusk Ball glow dome', 1, 1, 800, [
    LA(0, 0, 0, [[12, 0], [12, 3], [11, 4], [10.4, 6], [0, 6]], '#2a2a30'),
    TR(0, 6.4, 0, 10, 0.8, '#58e070', { m: 'glow' }),
    CY(0, 8, 0, 4.2, 4, '#3a3a44'),
    CY(0, 10.2, 0, 4.6, 0.4, '#7af090', { m: 'glow' }),
    BL(0, 17.4, 0, 7, 'dusk'),
    LA(0, 6, 0, [[10, 0], [10, 12], [9.4, 16], [8, 19], [5.5, 21.5], [0, 22.5]], '#5a7a68', { m: 'glass', tint: '#6a8a78' }),
    EL(0, 29, 0, 1.6, 1.6, 1.6, '#2a2a30'),
  ], { glow: ['#58e070', '#7af090'], play: 'light' }),

  // the Level Ball in a gold ring on a dark plaque, a level meter climbing beside it
  wallPiece('pblevel', 'Level Ball level-up plaque', 2, 600, [
    BX(0, 56, 1, 58, 26, 2, '#34343c'),
    BX(0, 69.6, 1.8, 60, 1.6, 3.6, GOLD, { m: 'metal', r: 0.4 }), BX(0, 42.4, 1.8, 60, 1.6, 3.6, GOLD, { m: 'metal', r: 0.4 }),
    BX(-16, 47.8, 5, 8, 1.2, 8, GOLD, { m: 'metal', r: 0.4 }),
    TR(-16, 56, 4, 8.4, 1, GOLD, { m: 'metal', axis: 'z' }),
    BL(-16, 56, 8, 7.2, 'level'),
    ...[5, 8, 11, 14, 17].map((hh, i) => BX(1.5 + i * 5.2, 46 + hh / 2, 2.8, 3.6, hh, 1.6, ['#d83838', '#e85a30', '#f08a28', '#f4b030', '#f8d030'][i], { r: 0.4 })),
    LABEL('LV', 10, 63, 5, '#f8d030'),
  ]),

  // the Lure Ball cradled on a fishing-rod rack, two rods leaning on its rail and a bobber hung from it
  piece('pblure', 'Lure Ball rod rack', 2, 1, 900, [
    BX(0, 2, 0, 60, 4, 20, '#8a6036', { m: 'wood' }),
    BX(-24, 22, -6, 3, 36, 3, '#8a6036', { m: 'wood' }), BX(24, 22, -6, 3, 36, 3, '#8a6036', { m: 'wood' }),
    BX(0, 39, -6, 51, 3, 3.4, '#8a6036', { m: 'wood' }),
    SK([-22, 4.6, 4], [-11, 60, -12], 0.8, '#3a3a44'), SK([22, 4.6, 4], [11, 60, -12], 0.8, '#3a3a44'),
    ...[-1, 1].map(s => CY(s * 20.4, 13, 2.4, 2.4, 2, '#c8ccd8', { m: 'metal' })),
    ...[-1, 1].map(s => SK([s * 22.4, 4.4, 4.2], [s * 21.4, 9.6, 3.8], 1.3, '#d8b050', { m: 'cloth' })),
    SK([12, 37.4, -6], [12, 30.4, -6], 0.3, '#e8e8e8', { m: 'plain' }),
    EL(12, 28.8, -6, 1.8, 2, 1.8, '#d83838'), EL(12, 27.2, -6, 1.8, 1.2, 1.8, '#f4f4f0'),
    CY(0, 9, 2, 2.2, 10, '#8a6036', { m: 'wood' }),
    TR(0, 14.4, 2, 4, 1, '#e04040'),
    BL(0, 21.6, 2, 7.4, 'lure'),
  ], { play: 'ball' }),

  // the Moon Ball in a glowing crescent's cradle, a star on a wire beside it
  piece('pbmoon', 'Moon Ball crescent stand', 1, 1, 700, [
    CY(0, 1.5, 0, 10, 3, '#2a3060'),
    CY(0, 6.5, 0, 2, 7.4, '#2a3060'),
    SB(0, 22.4, 0, MOON.pts, 4, '#f8e070', { m: 'glow' }),
    BL(0, 22.4 + MOON.bottom + 8, 0, 8, 'moon'),
    SK([9, 3, -5], [11.4, 37, -5], 0.35, '#c8c8d0', { m: 'metal' }),
    SB(11.4, 38.5, -5, star(3.4), 1.4, '#f8e070', { m: 'glow' }),
  ], { glow: ['#f8e070'], play: 'light' }),

  // the Friend Ball tucked in among leaves in a green planter
  piece('pbfriend', 'Friend Ball planter', 1, 1, 500, [
    LA(0, 0, 0, [[8, 0], [9, 1], [11, 12], [12, 13], [12, 15], [0, 15]], '#4a8a3a'),
    TR(0, 14.6, 0, 11.4, 0.9, '#3a7a2e'),
    CY(0, 14.6, 0, 10.8, 0.6, '#4a3020', { m: 'plain' }),
    BL(0, 22.6, 1, 7.6, 'friend'),
    ...Array.from({ length: 8 }, (_, i) => { const a = (i / 8 + 0.06) * TAU, s = Math.sin(a); return EL(s * 8.6, 18.5 + (i % 2) * 1.5, Math.cos(a) * 8.6, 2.4, 5.4, 1.6, i % 2 ? '#5aa840' : '#78c050', { m: 'plain', tilt: s * 0.6 }); }),
  ], { play: 'ball' }),

  // the Love Ball held in a pink heart
  piece('pblove', 'Love Ball heart stand', 1, 1, 550, [
    CY(0, 1.5, 0, 10, 3, '#f8c0d8'),
    CY(0, 8.2, 0, 2, 11, '#f8c0d8'),
    SB(0, 25.4, 0, HEART_OUT, 4, '#f05890', { holes: [HEART_IN] }),
    BL(0, 25, 0, 6.6, 'love'),
  ], { play: 'ball' }),

  // the Heavy Ball on a stone anvil, set on a stone block
  piece('pbheavy', 'Heavy Ball anvil', 1, 1, 650, [
    BX(0, 4, 0, 22, 8, 20, '#7a7a84', { m: 'plain', r: 1.2 }),
    SB(0, 15, 0, ANVIL, 13, '#8a8a96'),
    BL(0, 30.6, 0, 8.6, 'heavy'),
  ], { play: 'ball' }),

  // the Fast Ball on a red wall shelf, a chequered board and speed stripes behind
  wallPiece('pbfast', 'Fast Ball racing shelf', 1, 400, [
    BX(0, 58, 0.8, 28, 22, 1.6, '#f4f4f0'),
    ...Array.from({ length: 7 }, (_, i) => BX(-12 + i * 4, 66.5 + (i % 2) * 2, 1.7, 4, 2, 0.3, INK, { r: 0.1 })),
    ...['#e85a30', '#f08a28', '#f8c830'].map((c, i) => BX(-2 - i * 2, 61 - i * 3.6, 1.8, 20 - i * 4, 2, 0.4, c, { r: 0.6 })),
    BX(0, 47, 5.5, 28, 2, 11, '#d83a3a'),
    ...[-1, 1].map(s => BX(s * 11, 43.4, 2.4, 2, 5, 4.4, '#b82a2a', { r: 0.4 })),
    BL(0, 55, 7.2, 7, 'fast'),
  ]),

  // the Sport Ball caught in a bug-catching net, stood up in its stand
  piece('pbsport', 'Sport Ball bug net', 1, 1, 500, [
    CY(0, 1.5, 0, 9, 3, '#5a8a3a'),
    CY(0, 4.2, 0, 2.6, 2.4, '#4a7a2e'),
    SK([0, 4, 0], [0, 40.6, 0], 1, '#c89a60', { m: 'wood' }),
    EL(0, 48, -6.2, 8, 8, 7, '#f4f4f4', { m: 'glass', tint: '#f0f4f0' }),
    BL(0, 47, -2.4, 6.4, 'sport'),
    TR(0, 48, 0, 8, 0.8, CHROME, { m: 'metal', axis: 'z' }),
  ], { play: 'ball' }),

  // the Park Ball lit in a lantern on a little park lamppost, grass and flowers at its foot
  piece('pbpark', 'Park Ball lamppost', 1, 1, 750, [
    CY(0, 1, 0, 13, 2, '#6ab04a', { m: 'plain' }),
    ...[[-8, 6, '#f8f0f0'], [7, 7, '#f8d030'], [-3, 10, '#e85a8a'], [9, -5, '#f8f0f0']].map(([x, z, c]) => EL(x, 2.8, z, 1.4, 1, 1.4, c, { m: 'plain' })),
    LA(0, 2, 0, [[4, 0], [4, 2], [2.5, 4], [1.6, 6], [1.4, 44], [2.5, 46], [0, 46]], '#2a5a3a', { m: 'metal' }),
    LA(0, 48, 0, [[2.5, 0], [7.5, 2.4], [0, 2.4]], '#2a5a3a', { m: 'metal' }),
    TR(0, 50.4, 0, 4.6, 0.8, '#fff0b0', { m: 'glow' }),
    BL(0, 57.6, 0, 6.8, 'park'),
    ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => SK([sx * 5.4, 50, sz * 5.4], [sx * 5.4, 65, sz * 5.4], 0.45, '#2a5a3a', { m: 'metal' })),
    LA(0, 65, 0, [[8.6, 0], [6, 2.6], [2, 4.6], [0, 5.4]], '#2a5a3a', { m: 'metal' }),
    EL(0, 71.4, 0, 1.4, 1.4, 1.4, '#2a5a3a', { m: 'metal' }),
  ], { glow: ['#fff0b0'], play: 'light' }),

  // the Dream Ball afloat on a glowing cloud cushion
  piece('pbdream', 'Dream Ball cloud cushion', 1, 1, 700, [
    EL(0, 6.6, 0, 9.6, 6.6, 9.6, '#f2e4ff', { m: 'glow' }),
    EL(-8.4, 5.4, 2, 5.6, 5.4, 6, '#ead8fa', { m: 'glow' }), EL(8.4, 5.4, 2, 5.6, 5.4, 6, '#ead8fa', { m: 'glow' }),
    EL(0, 5, 8.6, 6.6, 5, 5, '#f6ecff', { m: 'glow' }), EL(-3, 5.6, -8, 6, 5, 5, '#ead8fa', { m: 'glow' }),
    BL(0, 19.6, 0, 7.6, 'dream'),
  ], { glow: ['#f2e4ff', '#ead8fa', '#f6ecff'], play: 'light' }),

  // the Beast Ball floating in an Ultra Beast's hexagon gate, its inner edge lit
  piece('pbbeast', 'Beast Ball hex frame', 1, 1, 900, [
    CY(0, 2, 0, 11, 4, '#1e2450', { seg: 6 }),
    CY(0, 9.6, 0, 1.6, 11.2, '#2a3a8a'),
    SB(0, 30, 0, HEX, 3.2, '#2a3a8a', { holes: [HEX_IN] }),
    SB(0, 30, 0, HEX_IN, 3.8, '#58e0f8', { m: 'glow', holes: [HEX_GLOW] }),
    BL(0, 30, 0, 7.4, 'beast'),
  ], { glow: ['#58e0f8'], play: 'light' }),

  // the Cherish Ball on a cushion in a glass case, up on a ribboned gift box with a bow on top
  piece('pbcherish', 'Cherish Ball gift case', 1, 1, 1100, [
    BX(0, 8, 0, 24, 16, 24, '#f4f0e8'),
    BX(0, 8, 0, 4, 16.2, 24.2, '#d82838', { r: 0.4, m: 'cloth' }), BX(0, 8, 0, 24.2, 16.2, 4, '#d82838', { r: 0.4, m: 'cloth' }),
    BX(0, 16.6, 0, 21, 1.2, 21, GOLD, { m: 'metal', r: 0.4 }),
    EL(0, 17.8, 0, 6, 1.3, 6, '#f8f0e0', { m: 'cloth' }),
    BL(0, 25.8, 0, 7, 'cherish'),
    BX(0, 26.6, 0, 20, 19, 20, '#d4ecf6', { m: 'glass', r: 0.3 }),
    BX(0, 36.6, 0, 21, 1, 21, GOLD, { m: 'metal', r: 0.4 }),
    EL(-3.6, 39.4, 0, 3.6, 2.2, 1.6, '#d82838', { tilt: -0.45 }), EL(3.6, 39.4, 0, 3.6, 2.2, 1.6, '#d82838', { tilt: 0.45 }),
    EL(0, 38.8, 0, 1.6, 1.6, 1.6, '#b81e2e'),
  ], { play: 'ball' }),

  // a round rug woven as a Great Ball
  { id: 'pbgreat', name: 'Great Ball rug', w: 2, h: 2, layer: 'rug', price: 450, high: 0.04, side: 'c', flat(w, h) {
    const g = ctx();
    g.fillStyle = '#2a2a32'; g.beginPath(); g.arc(w / 2, h / 2, 31, 0, TAU); g.fill();
    paintBall(w / 2, h / 2, 29.6, 'great', 1, 0, { flat: true });
    g.strokeStyle = 'rgba(255,255,255,0.35)'; g.setLineDash([1.6, 1.4]); g.lineWidth = 0.5;
    g.beginPath(); g.arc(w / 2, h / 2, 28.4, 0, TAU); g.stroke(); g.setLineDash([]);
  } },
].map(f => ({ group: GROUP, solo: true, ...f }));
