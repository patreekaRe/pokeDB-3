/* base-furniture-bamboo.js  -  the Bamboo set (furniture expansion session h, 2026-10-17): Animal Crossing's bamboo
   series, a whole room of it. Green and straw-gold canes with a node ring every so often, lashed with dark cord at the
   joints, split-bamboo slat panels and woven bamboo mats, pale green cushions and linen, a little dark lacquer for
   contrast. Pancham chewing a leaf in the grove, Pangoro on the drum's head and Leafeon on the folding screen for the
   Pokémon touches. All solo, fixed colours, sold all year.
   An upright piece is a list of parts in painted units (32 a tile), as in js/base-furniture-ranch.js: `x` across from the
   left of its front, `h` up from the floor (a wall piece's from the foot of its strip), `z` out to the front from its
   middle (a wall piece's from the wall). They're painted here from any side, and js/base-models-bamboo.js builds the same
   list as 3D parts (BUILT), so picture and model agree. A cane is a rod with short wider rods for its nodes (`cap: 'butt'`
   paints them square). `tex` is painted only (the model stays plain colour): `weave` a woven mat's over-and-under,
   `ribs` a paper shade's or a slat's lines. A `pic` part (the clock's dial, Pangoro, Leafeon) is painted on the front
   only, and the model wears that crop of the painting. The wardrobe's slatted doors swing (`doors`, `inside`). The rug
   is a woven mat, painted from above. */

import { sh, oval, ovalShade, floorShadow, ctx, hash, glass as glassPane } from './base-paint.js';

export const BC = {
  cane: '#93b356', caneL: '#b6d27c', caneD: '#6b8a3a', caneN: '#56742c', straw: '#d9bd6c', strawL: '#eed898', strawD: '#ad9046',
  strawN: '#8e7434', cord: '#3a2a20', lacq: '#2b2321', lacqL: '#4a3c34', linen: '#f1ecdc', linenD: '#d8d0bc', sage: '#c9dfae',
  sageD: '#a3c088', sageL: '#e0edcc', mat: '#d8c48e', matD: '#b8a068', matL: '#ece0b0', glow: '#ffe4a6', leaf: '#6fa84c',
  leafD: '#4c8034', leafL: '#94c46a', soil: '#4a3828', ink: '#2a2622', mirror: '#cfe1ea', celadon: '#9ec4a8', celadonD: '#78a486',
  iron: '#3c3a38', brass: '#c9a046', hollow: '#3e4a24', head: '#efdfba', camellia: '#d84a5a', pollen: '#f4d040',
  pw: '#f4f2ec', pk: '#2e2c2e', pnose: '#4a4448',
};
const GROUP = 'Bamboo';
const TAU = Math.PI * 2;
const CA = BC.cane, ST = BC.straw;

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

const CL = { m: 'cloth' }, PL = { m: 'plain' }, GL = { m: 'gloss' }, WD = { m: 'wood' }, MT = { m: 'metal' };
const WV = { m: 'wood', tex: 'weave' };

/** Each cane colour's node ring. */
const NODE = { [BC.cane]: BC.caneD, [BC.caneL]: BC.cane, [BC.caneD]: BC.caneN, [BC.straw]: BC.strawD, [BC.strawL]: BC.straw, [BC.strawD]: BC.strawN };

/** A bamboo cane from a to b ([x, h, z]), r thick, a node ring about every `every` units (none at the ends). */
function cane(a, b, r, c = CA, o = {}) {
  const d = [0, 1, 2].map(i => b[i] - a[i]), len = Math.hypot(...d), parts = [RD(a, b, r, c, { m: 'gloss' })];
  const n = o.nodes === false ? 0 : Math.round(len / (o.every ?? 11)), k = 0.45 / len, at = (s) => a.map((v, i) => v + d[i] * s);
  for (let i = 1; i < n; i++) parts.push(RD(at(i / n - k), at(i / n + k), r * 1.2, o.nc ?? NODE[c] ?? sh(c, -1), { m: 'gloss', seg: 8, cap: 'butt' }));
  return parts;
}
/** A wrap of dark cord round a joint at p, along axis `ax`, over a cane r thick. */
const lash = (p, ax, r, len = 1.8) => {
  const v = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] }[ax];
  return RD(p.map((c, i) => c - v[i] * len / 2), p.map((c, i) => c + v[i] * len / 2), r + 0.4, BC.cord, { m: 'cloth', seg: 6, cap: 'butt' });
};
/** n split-bamboo slats standing side by side from x0 to x1, h0 to h1, in the plane at z, colours taken in turn. */
function slats(x0, x1, h0, h1, z, n, cs = [ST, BC.strawL], gap = 0.9, d = 0.8) {
  const w = (x1 - x0 - gap * (n - 1)) / n;
  return Array.from({ length: n }, (_, i) => B(x0 + w / 2 + i * (w + gap), (h0 + h1) / 2, z, w, h1 - h0, d, cs[i % cs.length], { m: 'wood', r: 0 }));
}
/** n slats laid front to back across a seat or top at height h, from x0 to x1, d deep. */
function deck(x0, x1, h, z, d, n, cs = [ST, BC.strawL], gap = 0.7, th = 1.4) {
  const w = (x1 - x0 - gap * (n - 1)) / n;
  return Array.from({ length: n }, (_, i) => B(x0 + w / 2 + i * (w + gap), h, z, w, th, d, cs[i % cs.length], { m: 'wood', r: 0 }));
}
/** A bamboo leaf facing the front, its stalk end at x, h, pointing at angle `ang` (degrees, 0 to the right). */
function leaf(x, h, z, ang, len, wid, c = BC.leaf) {
  const a = ang * Math.PI / 180, dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx;
  const P = (s, t) => [dx * len * s + nx * wid * t, dy * len * s + ny * wid * t];
  return PR(x, h, z, [P(0, 0), P(0.28, 0.5), P(0.7, 0.3), P(1, 0), P(0.7, -0.3), P(0.28, -0.5)], 0.4, c, { m: 'cloth' });
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

/** The painted-only surface of a part (`tex`), inside its outline `path` over bounds bb. */
function texture(q, path, bb) {
  const g = ctx(), [x0, y0, x1, y1] = bb, c = q.c;
  g.save(); g.clip(path);
  if (q.tex === 'weave') {
    const s = q.ts || 2.2;
    g.lineWidth = 0.3;
    for (let y = y0, j = 0; y < y1; y += s, j++) for (let x = x0, i = 0; x < x1; x += s, i++) {
      const across = (i + j) % 2 === 0;
      g.globalAlpha = 0.3; g.fillStyle = sh(c, across ? 1 : -1); g.fillRect(x, y, s, s);
      g.globalAlpha = 0.45; g.strokeStyle = sh(c, -2); g.beginPath();
      if (across) { g.moveTo(x, y + s / 2); g.lineTo(x + s, y + s / 2); } else { g.moveTo(x + s / 2, y); g.lineTo(x + s / 2, y + s); }
      g.stroke();
    }
  } else if (q.tex === 'ribs') {
    const s = q.ts || 2.4;
    g.lineWidth = 0.35;
    for (let x = x0 + s / 2; x < x1; x += s) {
      g.globalAlpha = 0.35; g.strokeStyle = sh(c, -2); g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y1); g.stroke();
      g.globalAlpha = 0.3; g.strokeStyle = sh(c, 2); g.beginPath(); g.moveTo(x + 0.5, y0); g.lineTo(x + 0.5, y1); g.stroke();
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
        g.lineCap = q.cap || 'round'; g.strokeStyle = m === 'glass' ? alphaOf('#cfe8f4', 0.4) : q.c; g.lineWidth = q.r * 2;
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

/** The cane clock's dial: linen, ink ticks, a bamboo leaf at twelve, hands at ten past ten. */
function dial(g, x, y, w, h) {
  const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2;
  g.fillStyle = BC.linenD; g.fillRect(x, y, w, h);
  g.fillStyle = BC.linen; g.beginPath(); g.arc(cx, cy, r * 0.98, 0, TAU); g.fill();
  g.strokeStyle = BC.strawD; g.lineWidth = r * 0.05; g.beginPath(); g.arc(cx, cy, r * 0.86, 0, TAU); g.stroke();
  g.fillStyle = BC.ink;
  for (let i = 1; i < 12; i++) {
    const a = i / 12 * TAU - Math.PI / 2, big = i % 3 === 0, rr = r * 0.7;
    g.save(); g.translate(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); g.rotate(a + Math.PI / 2); g.fillRect(-r * (big ? 0.05 : 0.025), -r * (big ? 0.11 : 0.06), r * (big ? 0.1 : 0.05), r * (big ? 0.22 : 0.12)); g.restore();
  }
  g.fillStyle = BC.leaf; g.beginPath(); g.ellipse(cx, cy - r * 0.66, r * 0.07, r * 0.17, 0, 0, TAU); g.fill();
  g.strokeStyle = BC.ink; g.lineCap = 'round';
  for (const [a, len, lw] of [[-150, 0.42, 0.09], [-30, 0.6, 0.055]]) { const t = a * Math.PI / 180; g.lineWidth = r * lw; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(t) * r * len, cy + Math.sin(t) * r * len); g.stroke(); }
  g.fillStyle = BC.lacq; g.beginPath(); g.arc(cx, cy, r * 0.08, 0, TAU); g.fill();
}

/** Pangoro's face on the drum's head: white with round black ears, the black slanting eye patches of its scowl, a pale
    muzzle, a black nose, and its bamboo sprig in the corner of its mouth. */
function pangoro(g, x, y, w, h) {
  g.fillStyle = BC.head; g.fillRect(x, y, w, h);
  const cx = x + w / 2, cy = y + h * 0.54, s = w;
  g.strokeStyle = BC.ink; g.lineWidth = s * 0.02;
  for (const sg of [-1, 1]) { g.fillStyle = BC.pk; g.beginPath(); g.arc(cx + sg * s * 0.3, cy - s * 0.3, s * 0.12, 0, TAU); g.fill(); }
  g.fillStyle = BC.pw; g.beginPath(); g.ellipse(cx, cy, s * 0.36, s * 0.32, 0, 0, TAU); g.fill(); g.stroke();
  for (const sg of [-1, 1]) {
    g.fillStyle = BC.pk; g.beginPath();
    g.moveTo(cx + sg * s * 0.04, cy - s * 0.1); g.lineTo(cx + sg * s * 0.3, cy - s * 0.02); g.lineTo(cx + sg * s * 0.26, cy + s * 0.08); g.lineTo(cx + sg * s * 0.06, cy - s * 0.01);
    g.closePath(); g.fill();
    g.fillStyle = '#d84040'; g.beginPath(); g.arc(cx + sg * s * 0.16, cy - s * 0.02, s * 0.03, 0, TAU); g.fill();
  }
  g.fillStyle = sh(BC.pw, -1); g.beginPath(); g.ellipse(cx, cy + s * 0.14, s * 0.17, s * 0.11, 0, 0, TAU); g.fill();
  g.fillStyle = BC.pk; g.beginPath(); g.ellipse(cx, cy + s * 0.09, s * 0.06, s * 0.04, 0, 0, TAU); g.fill();
  g.strokeStyle = BC.ink; g.lineWidth = s * 0.02; g.beginPath(); g.moveTo(cx - s * 0.08, cy + s * 0.19); g.lineTo(cx + s * 0.08, cy + s * 0.19); g.stroke();
  g.strokeStyle = BC.leafD; g.lineWidth = s * 0.025; g.beginPath(); g.moveTo(cx + s * 0.06, cy + s * 0.19); g.lineTo(cx + s * 0.34, cy + s * 0.05); g.stroke();
  g.fillStyle = BC.leaf; g.beginPath(); g.ellipse(cx + s * 0.38, cy + s * 0.0, s * 0.05, s * 0.13, 0.9, 0, TAU); g.fill();
}

/** Leafeon in ink and wash on the screen's paper panel, bamboo sprigs about it. */
function leafeon(g, x, y, w, h) {
  g.fillStyle = BC.linen; g.fillRect(x, y, w, h);
  g.strokeStyle = alphaOf(BC.caneD, 0.45); g.lineWidth = w * 0.05;
  for (const [fx, top] of [[0.12, 0], [0.88, 0.1]]) { g.beginPath(); g.moveTo(x + fx * w, y + top * h); g.lineTo(x + fx * w, y + h); g.stroke(); }
  g.fillStyle = alphaOf(BC.leafD, 0.5);
  for (const [fx, fy, a] of [[0.12, 0.18, 0.7], [0.12, 0.26, 2.3], [0.88, 0.3, 2.4], [0.88, 0.4, 0.8]]) { g.beginPath(); g.ellipse(x + fx * w + Math.cos(a) * w * 0.1, y + fy * h, w * 0.12, w * 0.035, a, 0, TAU); g.fill(); }
  const cx = x + w / 2, cy = y + h * 0.58, s = w;
  g.strokeStyle = BC.ink; g.lineWidth = s * 0.018;
  for (const sg of [-1, 1]) {
    g.fillStyle = '#e4cf8e'; g.beginPath(); g.moveTo(cx + sg * s * 0.12, cy - s * 0.12); g.quadraticCurveTo(cx + sg * s * 0.46, cy - s * 0.26, cx + sg * s * 0.42, cy - s * 0.02); g.quadraticCurveTo(cx + sg * s * 0.26, cy - s * 0.04, cx + sg * s * 0.18, cy + s * 0.02); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = BC.leafD; g.beginPath(); g.moveTo(cx + sg * s * 0.16, cy - s * 0.06); g.lineTo(cx + sg * s * 0.4, cy - s * 0.1); g.stroke(); g.strokeStyle = BC.ink;
  }
  g.fillStyle = '#f2e6c0'; g.beginPath(); g.ellipse(cx, cy + s * 0.06, s * 0.22, s * 0.2, 0, 0, TAU); g.fill(); g.stroke();
  g.fillStyle = BC.leaf; g.beginPath(); g.moveTo(cx, cy - s * 0.1); g.quadraticCurveTo(cx + s * 0.12, cy - s * 0.3, cx + s * 0.02, cy - s * 0.42); g.quadraticCurveTo(cx - s * 0.06, cy - s * 0.24, cx, cy - s * 0.1); g.fill(); g.stroke();
  for (const sg of [-1, 1]) {
    g.fillStyle = '#6a3e24'; g.beginPath(); g.ellipse(cx + sg * s * 0.09, cy + s * 0.05, s * 0.035, s * 0.05, 0, 0, TAU); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(cx + sg * s * 0.09 - s * 0.01, cy + s * 0.03, s * 0.012, 0, TAU); g.fill();
  }
  g.fillStyle = '#7a5038'; g.beginPath(); g.ellipse(cx, cy + s * 0.14, s * 0.025, s * 0.015, 0, 0, TAU); g.fill();
  g.fillStyle = BC.leaf; for (const sg of [-1, 1]) { g.beginPath(); g.ellipse(cx + sg * s * 0.26, cy + s * 0.32, s * 0.12, s * 0.04, sg * -0.5, 0, TAU); g.fill(); g.stroke(); }
}

/* ---------- the kinds ---------- */

/** What js/base-models-bamboo.js builds for each upright and wall kind: its parts, doors and default material. */
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
/** Four upright canes at xs by zs, from the floor to hh. */
const posts = (xs, zs, hh, r, c = CA, o) => xs.flatMap(x => zs.flatMap(z => cane([x, 0, z], [x, hh, z], r, c, o)));

export const BAMBOO_KINDS = [
  // a cane bed: thick green posts, a headboard of split-bamboo slats between gold rails lashed with cord, a low slatted
  // footboard, linen and a pale green quilt
  piece('bmbbed', 'Bamboo bed', 2, 2, 1500, 'gloss', [
    ...posts([4, 60], [-29], 54, 2.4), ...[4, 60].map(x => C(x, 54.4, -29, 2.7, 1, BC.caneD, GL)),
    ...[50, 22].flatMap(h => cane([6.4, h, -29], [57.6, h, -29], 1.6, ST)),
    ...slats(6.6, 57.4, 23.4, 48.6, -29, 11),
    ...[4, 60].flatMap(x => cane([x, 11, -26.6], [x, 11, 26.6], 2, CA)),
    B(32, 9, 0, 54, 5, 56, BC.strawD, { m: 'wood', r: 0.5 }),
    B(32, 14.6, 0, 55, 5.2, 54, BC.linen, { m: 'cloth', r: 1.6 }),
    B(32, 18, 4, 56.4, 2.6, 46, BC.sage, CL), B(32, 19.4, -17.6, 56.6, 0.8, 5, BC.sageL, CL), B(32, 19.4, 18, 56.6, 0.8, 7, BC.sageD, CL),
    ...[20, 44].map(x => S(x, 20.4, -21, 10, 3.2, 5.4, BC.linen, { m: 'cloth', seg: 12 })),
    ...posts([4, 60], [29], 24, 2.4), ...[4, 60].map(x => C(x, 24.4, 29, 2.7, 1, BC.caneD, GL)),
    ...[21, 10].flatMap(h => cane([6.4, h, 29], [57.6, h, 29], 1.4, ST)),
    ...slats(6.6, 57.4, 11.2, 19.8, 29, 11),
    ...[4, 60].flatMap(x => [lash([x, 50, -29], 'y', 2.4), lash([x, 22, -29], 'y', 2.4), lash([x, 21, 29], 'y', 2.4), lash([x, 10, 29], 'y', 2.4)]),
  ]),

  // a little round stool: four splayed canes lashed under a woven seat, a gold ring of cane for a rung, a sage cushion
  piece('bmbstool', 'Bamboo stool', 1, 1, 220, 'gloss', [
    ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].flatMap(([sx, sz]) => cane([16 + sx * 6, 16.4, sz * 6], [16 + sx * 9.4, 0.6, sz * 9.4], 1.7, CA, { every: 8 })),
    RG(16, 7, 0, 8.6, 1, ST, { m: 'gloss', flat: true }),
    C(16, 16.6, 0, 10.4, 2.6, BC.mat, WV), RG(16, 17.9, 0, 10.2, 0.6, BC.strawD, { m: 'wood', flat: true }),
    C(16, 19.2, 0, 9, 1.8, BC.sage, { m: 'cloth', seg: 16 }),
    ...[[-1, 1], [1, 1]].map(([sx, sz]) => lash([16 + sx * 6.6, 14.2, sz * 6.6], 'y', 1.7)),
  ], {}),

  // a cane armchair: green posts and arms, a woven seat under a sage cushion, a slatted back with a linen pillow
  piece('bmbchair', 'Bamboo cane armchair', 1, 1, 560, 'gloss', [
    ...posts([4, 28], [-11], 44, 1.6), ...posts([4, 28], [10], 26, 1.6),
    ...[4, 28].flatMap(x => [...cane([x, 26, -11], [x, 26, 12], 1.4, ST), ...cane([x, 12.4, -11], [x, 12.4, 10], 1.2, CA, { nodes: false })]),
    ...[10, -11].flatMap(z => cane([4, 12.4, z], [28, 12.4, z], 1.2, CA)),
    B(16, 13.6, 0, 23, 1.4, 21, BC.mat, WV),
    B(16, 16.4, 1, 22, 3.6, 20, BC.sage, { m: 'cloth', r: 2 }),
    ...cane([4, 43, -11], [28, 43, -11], 1.4, ST, { nodes: false }), ...slats(6.4, 25.6, 17, 42, -11, 5),
    B(16, 28, -8.6, 20, 13, 3, BC.linen, { m: 'cloth', r: 1.5 }),
    ...[4, 28].flatMap(x => [lash([x, 26, 10], 'y', 1.6), lash([x, 43, -11], 'y', 1.6)]),
  ]),

  // a slat bench sofa: a cane frame, a gold slat seat and back, two sage seat cushions, back pillows and a linen cushion
  piece('bmbsofa', 'Bamboo slat sofa', 2, 1, 1150, 'gloss', [
    ...posts([3, 61], [-11], 36, 1.8), ...posts([3, 61], [11], 24, 1.8),
    ...[3, 61].flatMap(x => [...cane([x, 24, -11], [x, 24, 13], 1.6, ST), ...cane([x, 11, -11], [x, 11, 11], 1.2, CA, { nodes: false }), ...cane([x, 17.5, -11], [x, 17.5, 11], 1, CA, { nodes: false })]),
    ...cane([3, 10.6, 11], [61, 10.6, 11], 1.4, CA), ...cane([3, 10.6, -11], [61, 10.6, -11], 1.4, CA, { nodes: false }),
    ...deck(5, 59, 12.4, 0, 21, 11),
    ...[18, 46].map(x => B(x, 15.6, 1, 26, 4.8, 20, BC.sage, { m: 'cloth', r: 2 })),
    ...cane([3, 35, -11], [61, 35, -11], 1.5, ST), ...slats(5.4, 58.6, 13.6, 34, -11, 13),
    ...[18, 46].map(x => B(x, 23.6, -8, 25, 11, 3.6, BC.sageL, { m: 'cloth', r: 1.6 })),
    B(53, 20.8, -3.6, 9, 8, 3, BC.linen, { m: 'cloth', r: 1.6 }),
    ...[3, 61].flatMap(x => [lash([x, 24, 11], 'y', 1.8), lash([x, 35, -11], 'y', 1.8), lash([x, 10.6, 11], 'y', 1.8)]),
  ]),

  // a low tea table: a slat top in a green cane rim on four cane legs, a lacquer tray with a celadon pot and two cups
  piece('bmbtable', 'Bamboo tea table', 2, 1, 640, 'gloss', [
    ...posts([6, 58], [-10, 10], 14, 1.6, CA, { every: 7 }),
    ...[-10, 10].flatMap(z => cane([6, 5, z], [58, 5, z], 1, ST, { nodes: false })),
    ...deck(2, 62, 14.9, 0, 26, 14),
    ...[-13.4, 13.4].flatMap(z => cane([1.2, 14.6, z], [62.8, 14.6, z], 1.2, CA)), ...[1.2, 62.8].flatMap(x => cane([x, 14.6, -12.4], [x, 14.6, 12.4], 1.2, CA, { nodes: false })),
    B(40, 16.1, 0, 18, 0.8, 12, BC.lacq, { m: 'gloss', r: 0.4 }),
    LA(22, 15.6, -2, [[3.4, 0], [5, 1.6], [5.4, 3.6], [4.6, 5.6], [2.4, 6.8], [2.6, 7.4], [0, 7.6]], BC.celadon, { m: 'gloss', seg: 14 }),
    RD([26.6, 18, -2], [29.4, 21.4, -2], 0.7, BC.celadon, GL),
    RG(22, 23, -2, 3.4, 0.5, ST, { m: 'gloss', a0: 0, arc: Math.PI }),
    S(22, 23.4, -2, 0.9, 0.7, 0.9, BC.celadonD, { m: 'gloss', seg: 8 }),
    ...[[36, 3], [44, -3]].map(([x, z]) => LA(x, 16.5, z, [[1.2, 0], [2, 0.8], [2.4, 3.2]], BC.celadonD, { m: 'gloss', seg: 10 })),
    ...[-13.4, 13.4].flatMap(z => [lash([6, 14.6, z], 'z', 1.2), lash([58, 14.6, z], 'z', 1.2)]),
  ]),

  // a writing desk: a dark lacquer top on a woven-drawer pedestal and cane legs, a brush pot of cane, an inkstone and a
  // sheet of paper
  piece('bmbdesk', 'Bamboo desk', 2, 1, 920, 'gloss', [
    B(12, 13, -0.5, 20, 24, 25, ST, { m: 'wood', r: 0.6 }),
    ...[19, 8].flatMap(h => [B(12, h, 12.4, 16, 8.6, 0.8, BC.mat, WV), B(12, h, 13.2, 5, 1.2, 0.9, BC.lacq, { m: 'gloss', r: 0.4 })]),
    ...posts([2, 22], [12.4], 25, 1.2),
    ...posts([59], [-10, 10], 25, 1.6), ...cane([59, 6, -10], [59, 6, 10], 1, ST, { nodes: false }),
    ...cane([22, 22.6, -11], [59, 22.6, -11], 1.1, ST),
    B(32, 26.4, 0, 64, 2.6, 28, BC.lacq, { m: 'gloss', r: 0.8 }),
    B(30, 27.9, 4, 15, 0.4, 10, BC.linen, PL), B(40, 28.4, 3, 5, 1.4, 7, BC.ink, { m: 'gloss', r: 0.5 }),
    ...cane([50, 27.7, -4], [50, 34, -4], 2.6, CA, { nodes: false }), C(50, 30.6, -4, 3.1, 0.9, BC.caneD, GL),
    ...[[-1.2, BC.strawD], [0, ST], [1.2, BC.lacqL]].flatMap(([dx, c]) => [RD([50 + dx, 33, -4], [50 + dx * 2.4, 40, -4], 0.35, c, PL), RD([50 + dx * 2.4, 40, -4], [50 + dx * 2.6, 41.4, -4], 0.5, BC.ink, PL)]),
    ...[[59, -10], [59, 10]].map(([x, z]) => lash([x, 22.6, z], 'y', 1.6)),
  ]),

  // a wardrobe of gold bamboo in a green cane frame, a lacquer top, and two doors of split-bamboo slats that swing open
  piece('bmbwardrobe', 'Bamboo wardrobe', 2, 1, 1300, 'gloss', [
    B(32, 36, -1, 58, 68, 24, BC.strawD, { m: 'wood', r: 0.6 }),
    ...posts([3, 61], [12], 70, 2), ...cane([3, 4, 12], [61, 4, 12], 1.4, CA), ...cane([3, 68, 12], [61, 68, 12], 1.4, CA),
    B(32, 71, 0, 63, 2.4, 28, BC.lacq, { m: 'gloss', r: 0.8 }),
    ...[3, 61].flatMap(x => [lash([x, 68, 12], 'y', 2), lash([x, 4, 12], 'y', 2)]),
  ], {
    doors: [5.4, 58.6].map((hx, i) => {
      const x = i ? 45.4 : 18.6, l = x - 12.6, r = x + 12.6, hz = 13.6;
      return { hinge: [hx, 13], side: i ? -1 : 1, parts: [
        B(x, 36, 12.2, 26, 58, 1, BC.strawD, { m: 'wood', r: 0 }),
        ...slats(l + 1.4, r - 1.4, 8.4, 63.6, 12.9, 7),
        ...cane([l, 7, hz], [l, 65, hz], 1.1, CA), ...cane([r, 7, hz], [r, 65, hz], 1.1, CA),
        ...cane([l, 64.6, hz], [r, 64.6, hz], 1, CA, { nodes: false }), ...cane([l, 7.4, hz], [r, 7.4, hz], 1, CA, { nodes: false }),
        ...cane([x + (i ? -9.6 : 9.6), 30, 14.8], [x + (i ? -9.6 : 9.6), 40, 14.8], 0.8, BC.lacqL, { nodes: false }),
      ] };
    }),
    inside: { x: 32, h: 36, w: 50, hh: 56, z: 11.6 },
  }),

  // a dresser of six woven drawers in a gold case, green canes at its corners, a lacquer top, a cane vase of leaves and
  // a woven box
  piece('bmbdresser', 'Bamboo dresser', 2, 1, 880, 'gloss', [
    ...posts([5, 59], [-10, 10], 4, 1.4, CA, { nodes: false }),
    B(32, 18, 0, 60, 28, 26, ST, { m: 'wood', r: 0.6 }),
    ...[[18, 25.6], [46, 25.6], [18, 17.6], [46, 17.6], [18, 9.6], [46, 9.6]].flatMap(([x, h]) => [B(x, h, 13.2, 26, 7, 0.8, BC.mat, WV), B(x, h, 14, 5, 1.2, 0.9, BC.lacq, { m: 'gloss', r: 0.4 })]),
    ...posts([2.4, 61.6], [13.4], 32, 1.5),
    B(32, 32.6, 0, 63, 2.4, 28, BC.lacq, { m: 'gloss', r: 0.8 }),
    ...cane([14, 33.8, -3], [14, 46, -3], 2.8, CA, { nodes: false }), C(14, 40, -3, 3.3, 0.9, BC.caneD, GL),
    RD([14, 45, -3], [10, 54, -3], 0.3, BC.leafD, PL), RD([14, 45, -3], [17, 56, -3], 0.3, BC.leafD, PL),
    leaf(10, 54, -3, 160, 8, 2.2), leaf(10.4, 53, -3, 110, 7, 2, BC.leafD), leaf(17, 56, -3, 30, 8, 2.2), leaf(16.6, 55, -3, 80, 7, 2, BC.leafL),
    B(46, 36.2, 0, 13, 4.8, 9, BC.mat, WV), B(46, 38.9, 0, 13.6, 0.8, 9.6, BC.strawD, { m: 'wood', r: 0.3 }),
  ]),

  // an open shelf: four green canes lashed to gold slat shelves, a cross brace at the back, a woven basket, an iron
  // teapot, books, a little bonsai, a celadon vase and a lacquer box
  piece('bmbshelf', 'Bamboo shelf', 1, 1, 580, 'gloss', (() => {
    const parts = posts([2.6, 29.4], [-10.4, 10.4], 62, 1.6);
    for (const h of [2.6, 21, 40, 58.6]) parts.push(...deck(3.6, 28.4, h, 0, 21, 6), ...cane([2.6, h - 0.8, 10.6], [29.4, h - 0.8, 10.6], 0.9, ST, { nodes: false }), lash([2.6, h, 10.4], 'y', 1.6), lash([29.4, h, 10.4], 'y', 1.6));
    parts.push(
      RD([3.4, 4, -10.4], [28.6, 38, -10.4], 0.7, ST, PL), RD([28.6, 4, -10.4], [3.4, 38, -10.4], 0.7, ST, PL),
      C(10, 7.4, 1, 5.6, 8, BC.mat, WV), RG(10, 11.4, 1, 5.6, 0.6, BC.strawD, { m: 'wood', flat: true }),
      LA(22, 3.3, 0, [[2.6, 0], [4, 1.4], [4.2, 3.4], [3, 5.2], [1.6, 5.8], [1.8, 6.4], [0, 6.6]], BC.iron, { m: 'metal', seg: 12 }), RD([25.6, 5.4, 0], [27.6, 7.6, 0], 0.5, BC.iron, MT),
      B(7, 26.9, -2, 2.8, 10.4, 12, BC.lacq, GL), B(10, 26.4, -2, 2.8, 9.4, 12, BC.sageD, CL), B(13, 27.2, -2, 2.8, 11, 12, BC.linenD, CL),
      LA(22, 21.7, 0, [[3, 0], [3.4, 2.6], [3.6, 3]], BC.celadonD, { m: 'gloss', seg: 10 }), RD([22, 24.6, 0], [21, 29, 0], 0.5, BC.lacqL, WD),
      S(19, 30, 0, 3.4, 2, 3, BC.leafD, { m: 'cloth', seg: 10 }), S(23.6, 31.6, 0, 3, 1.8, 2.6, BC.leaf, { m: 'cloth', seg: 10 }),
      LA(10, 40.7, 0, [[2, 0], [3.6, 2], [3.8, 5], [2, 8.4], [1.4, 10], [1.8, 10.6]], BC.celadon, { m: 'gloss', seg: 12 }),
      B(22, 43.6, 0, 10, 5.8, 10, BC.mat, WV),
      C(10, 60.6, 0, 3, 2.4, BC.lacq, { m: 'gloss', seg: 12 }), C(22, 60.4, 1, 2, 2, BC.celadonD, { m: 'gloss', seg: 10 }),
    );
    return parts;
  })()),

  // a floor lamp: a gold cane on a lacquer foot, a tall paper shade ribbed with green cane that glows warm
  piece('bmblamp', 'Bamboo floor lamp', 1, 1, 460, 'gloss', [
    C(16, 1.4, 0, 6.6, 2.8, BC.lacq, { m: 'gloss', seg: 14 }),
    ...cane([16, 2.8, 0], [16, 66, 0], 1.3, ST, { every: 10 }), C(16, 66.2, 0, 1.6, 0.8, BC.strawD, GL),
    LA(16, 44, 0, [[8, 0], [8.6, 1], [8.6, 18], [8, 19]], BC.glow, { m: 'glow', seg: 16, tex: 'ribs', ts: 2.6 }),
    RG(16, 44.4, 0, 8.6, 0.6, CA, { m: 'gloss', flat: true }), RG(16, 62.6, 0, 8.4, 0.6, CA, { m: 'gloss', flat: true }),
    ...[[-1, 0], [1, 0], [0, 1]].map(([sx, sz]) => RD([16 + sx * 1.2, 44.4, sz * 1.2], [16 + sx * 8, 44.4, sz * 8], 0.3, CA, PL)),
  ], { glow: [BC.glow] }),

  // a cage lantern: four little canes round a glowing paper box, a lacquer foot and cap, a gold cane handle
  piece('bmblantern', 'Bamboo cage lantern', 1, 1, 300, 'gloss', [
    B(16, 1.2, 0, 22, 2.4, 22, BC.lacq, { m: 'gloss', r: 0.6 }),
    B(16, 15.4, 0, 16, 23, 16, BC.glow, { m: 'glow', r: 0.4, tex: 'ribs', ts: 2.6 }),
    ...[6, 26].flatMap(x => [-10, 10].flatMap(z => cane([x, 2.4, z], [x, 29.4, z], 1.2, CA, { every: 9 }))),
    ...[-10, 10].flatMap(z => [RD([6, 28.4, z], [26, 28.4, z], 0.8, CA, GL), RD([6, 4.4, z], [26, 4.4, z], 0.8, CA, GL)]),
    ...[6, 26].flatMap(x => [RD([x, 28.4, -10], [x, 28.4, 10], 0.8, CA, GL), RD([x, 4.4, -10], [x, 4.4, 10], 0.8, CA, GL)]),
    B(16, 30.6, 0, 24, 1.6, 24, BC.lacq, { m: 'gloss', r: 0.6 }),
    RG(16, 31.4, 0, 6, 0.8, ST, { m: 'gloss', a0: 0, arc: Math.PI }),
  ], { glow: [BC.glow] }),

  // a standing clock: a gold case between two thick green canes, a lacquer foot and cap, a linen dial and a brass
  // pendulum in a dark window
  piece('bmbclock', 'Bamboo cane clock', 1, 1, 720, 'gloss', [
    B(16, 2.5, 0, 28, 5, 14, BC.lacq, { m: 'gloss', r: 0.6 }),
    B(16, 38, -1, 18, 64, 10, ST, { m: 'wood', r: 0.6 }),
    ...[4.6, 27.4].flatMap(x => cane([x, 5, 0], [x, 74, 0], 2.2, CA, { every: 12 })),
    B(16, 75, 0, 31, 2.2, 15, BC.lacq, { m: 'gloss', r: 0.6 }),
    ...cane([2.4, 68, 4.4], [29.6, 68, 4.4], 1.2, ST, { nodes: false }), ...cane([2.4, 9, 4.4], [29.6, 9, 4.4], 1.2, ST, { nodes: false }),
    B(16, 31, 4.1, 12, 30, 0.4, BC.lacq, { m: 'gloss', r: 0.4 }),
    RD([16, 46, 4.5], [16, 23, 4.5], 0.35, BC.brass, MT), DS(16, 21.6, 4.7, 3, 0.6, BC.brass, { m: 'metal', seg: 12 }),
    DS(16, 57, 4.4, 7.6, 1.2, BC.lacqL, { m: 'gloss', seg: 18 }),
    PC(16, 57, 5.1, 12.4, 12.4, dial),
    ...[4.6, 27.4].flatMap(x => [lash([x, 68, 0], 'y', 2.2), lash([x, 9, 0], 'y', 2.2)]),
  ]),

  // a folding screen: three panels in green cane frames, zigzagged, gold slats either side and a paper middle with
  // Leafeon in ink and wash, cord hinges
  piece('bmbscreen', 'Bamboo folding screen', 2, 1, 680, 'gloss', (() => {
    const parts = [];
    [[1.6, 20.4, 3], [22.6, 41.4, -3], [43.6, 62.4, 3]].forEach(([l, r, z], i) => {
      parts.push(...cane([l, 0, z], [l, 62, z], 1.3, CA), ...cane([r, 0, z], [r, 62, z], 1.3, CA),
        ...cane([l, 59, z], [r, 59, z], 1, ST, { nodes: false }), ...cane([l, 6, z], [r, 6, z], 1, ST, { nodes: false }));
      if (i === 1) parts.push(B(32, 32.5, z, 17.4, 52, 0.6, BC.linen, { m: 'plain', r: 0 }), PC(32, 35, z + 0.5, 16, 26, leafeon));
      else parts.push(...slats(l + 1.4, r - 1.4, 7, 58, z, 5));
    });
    for (const h of [14, 48]) parts.push(RD([20.4, h, 3], [22.6, h, -3], 0.5, BC.cord, CL), RD([41.4, h, -3], [43.6, h, 3], 0.5, BC.cord, CL));
    return parts;
  })()),

  // a wall mirror in a frame of four green canes crossed past the corners, lashed with cord, hung on a cord from a nail
  wallPiece('bmbmirror', 'Bamboo-framed mirror', 1, 480, 'gloss', [
    B(16, 55, 0.6, 20, 38, 1.2, BC.strawD, { m: 'wood', r: 0.4 }),
    B(16, 55, 1.4, 18, 34, 0.4, BC.mirror, GL),
    ...[6, 26].flatMap(x => cane([x, 32, 2.8], [x, 78, 2.8], 1.6, CA, { every: 12 })),
    ...[36, 74].flatMap(h => cane([2, h, 2.8], [30, h, 2.8], 1.4, ST, { nodes: false })),
    RD([6, 76, 2.4], [16, 86, 1], 0.3, BC.cord, CL), RD([26, 76, 2.4], [16, 86, 1], 0.3, BC.cord, CL), DS(16, 86.4, 1, 0.8, 0.8, BC.brass, { m: 'metal', seg: 8 }),
    ...[6, 26].flatMap(x => [36, 74].map(h => lash([x, h, 2.8], 'y', 1.6, 2.4))),
  ]),

  // a woven bamboo mat: gold strips over and under, bound in green cloth with a dark lacquer line
  { id: 'bmbrug', name: 'Bamboo woven mat', group: GROUP, solo: true, w: 3, h: 2, layer: 'rug', price: 620, high: 0.04, side: 'c', flat() {
    const g = ctx();
    g.fillStyle = sh(BC.leafD, -1); g.beginPath(); g.roundRect(1, 1, 94, 62, 2); g.fill();
    g.fillStyle = BC.leafD; g.beginPath(); g.roundRect(2, 2, 92, 60, 1.6); g.fill();
    const x0 = 6, y0 = 6, x1 = 90, y1 = 58;
    g.fillStyle = BC.mat; g.fillRect(x0, y0, x1 - x0, y1 - y0);
    for (let y = y0, j = 0; y < y1; y += 2, j++) {
      const v = hash(j, 3, 5);
      g.fillStyle = v < 0.33 ? BC.matL : v < 0.66 ? BC.mat : sh(BC.mat, -1); g.fillRect(x0, y, x1 - x0, 1.7);
      for (let x = x0 + (j % 2) * 3, i = 0; x < x1; x += 6, i++) { g.fillStyle = 'rgba(80,60,20,0.22)'; g.fillRect(x, y, 3, 1.7); g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect(x + 0.4, y + 0.2, 2.2, 0.4); }
    }
    g.strokeStyle = BC.lacq; g.lineWidth = 0.8; g.strokeRect(x0 - 0.6, y0 - 0.6, x1 - x0 + 1.2, y1 - y0 + 1.2);
    g.fillStyle = BC.sage; for (const [x, y] of [[4, 4], [92, 4], [4, 60], [92, 60]]) { g.beginPath(); g.arc(x, y, 1.2, 0, TAU); g.fill(); }
  } },

  // a wall shelf: a gold slat board on green cane brackets, hung on cords, a celadon vase with a sprig, two cups, a
  // woven box and a lacquer tea caddy
  wallPiece('bmbwallshelf', 'Bamboo wall shelf', 2, 340, 'gloss', [
    ...cane([6, 41, 1.8], [58, 41, 1.8], 1, CA),
    ...[10, 54].map(x => RD([x, 41.6, 1.8], [x, 51, 7.2], 0.9, CA, GL)),
    ...deck(4, 60, 52, 4.4, 8, 10),
    ...cane([3, 52.4, 8.8], [61, 52.4, 8.8], 1.1, CA),
    RD([4, 53, 8], [8, 78, 0.8], 0.3, BC.cord, CL), RD([60, 53, 8], [56, 78, 0.8], 0.3, BC.cord, CL),
    ...[8, 56].map(x => DS(x, 78.4, 0.8, 0.8, 0.8, BC.brass, { m: 'metal', seg: 8 })),
    LA(14, 52.7, 4, [[2.2, 0], [3.2, 1.6], [3.4, 4], [2, 7], [1.2, 8.6], [1.6, 9.4]], BC.celadon, { m: 'gloss', seg: 12 }),
    RD([14, 61, 4], [11, 67, 4], 0.3, BC.leafD, PL), leaf(11, 67, 4, 150, 6, 1.8), leaf(11.6, 66, 4, 70, 5, 1.6, BC.leafL),
    LA(26, 52.7, 5, [[1.2, 0], [2, 0.8], [2.4, 3.2]], BC.celadonD, { m: 'gloss', seg: 10 }), LA(31, 52.7, 4, [[1.2, 0], [2, 0.8], [2.4, 3.2]], BC.linen, { m: 'gloss', seg: 10 }),
    B(43, 55.6, 4, 10, 5, 7, BC.mat, WV),
    C(54, 56, 4, 2.4, 6, BC.lacq, { m: 'gloss', seg: 10 }), C(54, 59.4, 4, 2.6, 0.8, BC.lacqL, { m: 'gloss', seg: 10 }),
    ...[6, 58].map(x => lash([x, 41, 1.8], 'x', 1)),
  ]),

  // a flute rack: two green canes hung on the wall, three bamboo flutes on pegs, finger holes, a sage tassel
  wallPiece('bmbflutes', 'Bamboo flute rack', 1, 420, 'gloss', (() => {
    const parts = [...[5, 27].flatMap(x => cane([x, 36, 1.8], [x, 80, 1.8], 1.5, CA, { every: 10 })), ...cane([3, 78, 2], [29, 78, 2], 1, ST, { nodes: false })];
    for (const [h, x0, x1, r, c] of [[46, 2, 30, 1.7, ST], [58, 3, 29, 1.5, CA], [70, 4, 28, 1.3, BC.strawD]]) {
      parts.push(...[5, 27].map(x => RD([x, h - r - 0.6, 1.8], [x, h - r - 0.6, 5.6], 0.5, BC.lacqL, WD)));
      parts.push(...cane([x0, h, 4.6], [x1, h, 4.6], r, c, { every: 9 }));
      for (let i = 0; i < 6; i++) parts.push(DS(x0 + 8 + i * 2.8, h, 4.6 + r * 0.9, r * 0.36, 0.3, BC.ink, { m: 'plain', seg: 6 }));
      parts.push(DS(x0 + 3, h, 4.6 + r * 0.9, r * 0.45, 0.3, BC.ink, { m: 'plain', seg: 6 }));
    }
    parts.push(RD([28.6, 45, 4.6], [29.2, 38, 4.6], 0.25, BC.sageD, PL), S(29.2, 37, 4.6, 0.9, 1.6, 0.9, BC.sage, { m: 'cloth', seg: 8 }));
    parts.push(RD([5, 79, 1.8], [16, 86, 0.6], 0.3, BC.cord, CL), RD([27, 79, 1.8], [16, 86, 0.6], 0.3, BC.cord, CL), DS(16, 86.4, 0.6, 0.8, 0.8, BC.brass, { m: 'metal', seg: 8 }));
    parts.push(...[5, 27].map(x => lash([x, 78, 1.8], 'y', 1.2)));
    return parts;
  })()),

  // a hanging vase cut from one thick green cane, a window cut in its front, a red camellia and leaves, hung on cord
  wallPiece('bmbvase', 'Bamboo hanging vase', 1, 260, 'gloss', [
    C(16, 50, 4.8, 4.4, 26, CA, { m: 'gloss', seg: 16 }),
    C(16, 44, 4.8, 4.9, 1, BC.caneD, { m: 'gloss', seg: 16 }), C(16, 62.6, 4.8, 4.9, 1, BC.caneD, { m: 'gloss', seg: 16 }),
    DS(16, 54, 9.1, 2.6, 0.4, BC.hollow, { m: 'plain', ry: 4, seg: 12 }),
    leaf(15, 55, 9.6, 160, 7, 2.4, BC.leafD), leaf(17, 56, 9.6, 30, 6.4, 2.2), leaf(16, 56.4, 9.6, 95, 5, 1.8, BC.leafL),
    S(15.4, 56.4, 10, 2.4, 2.2, 1.4, BC.camellia, { m: 'cloth', seg: 10 }), S(15.4, 56.6, 11.2, 0.8, 0.8, 0.5, BC.pollen, { m: 'plain', seg: 6 }),
    RD([12.4, 63, 4.8], [16, 74, 1], 0.3, BC.cord, CL), RD([19.6, 63, 4.8], [16, 74, 1], 0.3, BC.cord, CL), DS(16, 74.4, 1, 0.8, 0.8, BC.brass, { m: 'metal', seg: 8 }),
  ]),

  // a lacquer planter of tall bamboo, leaves fanned at the nodes, Pancham sitting in front chewing a leaf
  piece('bmbgrove', 'Bamboo grove with Pancham', 1, 1, 1200, 'gloss', [
    B(16, 6.5, -1, 29, 13, 27, BC.lacq, { m: 'gloss', r: 0.8 }), B(16, 7.5, -1, 29.6, 5, 27.6, BC.mat, WV),
    B(16, 13.2, -1, 27, 0.6, 25, BC.soil, PL),
    ...cane([7, 13, -7], [8, 80, -9], 1.6, CA), ...cane([12, 13, -9], [13, 72, -11], 1.3, ST),
    ...cane([21, 13, -6], [23, 84, -7], 1.8, CA), ...cane([26, 13, -10], [26.5, 64, -11], 1.2, BC.caneD),
    leaf(8, 80, -9, 120, 9, 2.2), leaf(8, 79, -9, 60, 8, 2), leaf(8.2, 66, -8.6, 150, 8, 2.2, BC.leafD), leaf(8.2, 66, -8.6, 205, 6, 2, BC.leafL),
    leaf(13, 72, -11, 100, 8, 2, BC.leafD), leaf(13, 71, -11, 30, 8, 2), leaf(12.8, 56, -10.6, 150, 8, 2.2, BC.leafL),
    leaf(23, 84, -7, 70, 7, 2), leaf(23, 83, -7, 130, 8, 2.2, BC.leafD), leaf(22.6, 70, -6.8, 25, 7, 2.2, BC.leafL), leaf(22.4, 60, -6.6, 330, 7, 2.2),
    leaf(26.5, 64, -11, 60, 7, 2, BC.leafD), leaf(26.4, 52, -10.8, 15, 5, 2),
    S(16, 17.6, 8.6, 4.8, 4.6, 4, BC.pw, { m: 'cloth', seg: 12 }),
    S(16, 25, 9.2, 5.2, 4.6, 4.4, BC.pw, { m: 'cloth', seg: 12 }),
    ...[-1, 1].flatMap(s => [
      S(16 + s * 4.4, 28.4, 8.6, 1.8, 1.8, 1.4, BC.pk, { m: 'cloth', seg: 8 }),
      DS(16 + s * 2.2, 25.4, 13.3, 1.6, 0.4, BC.pk, { m: 'plain', ry: 1.2, seg: 8 }),
      S(16 + s * 4.6, 18.6, 10, 1.8, 3, 1.8, BC.pk, { m: 'cloth', seg: 8 }),
      S(16 + s * 3, 13.6, 12, 2, 1.4, 2.4, BC.pk, { m: 'cloth', seg: 8 }),
    ]),
    DS(16, 23.6, 13.6, 0.7, 0.4, BC.pnose, { m: 'plain', seg: 6 }),
    RD([16, 29.2, 9], [17.4, 31.8, 9.4], 0.6, BC.pk, CL),
    RD([16.4, 22.6, 13.4], [19.6, 28.6, 14], 0.3, BC.leafD, PL), leaf(19.6, 28.6, 14, 65, 5, 1.8),
  ]),

  // a room partition of tall canes side by side, green and gold, cut at different heights on a lacquer rail, two cane
  // ties lashed across
  piece('bmbpartition', 'Bamboo partition', 2, 1, 560, 'gloss', (() => {
    const tops = [68, 72, 64, 70, 66], cs = [CA, ST, CA, BC.caneL, ST], xs = Array.from({ length: 13 }, (_, i) => 3.5 + i * 4.75);
    const parts = [B(32, 2.2, 0, 64, 4.4, 9, BC.lacq, { m: 'gloss', r: 0.6 })];
    xs.forEach((x, i) => parts.push(...cane([x, 4.4, 0], [x, tops[i % 5], 0], 2.2, cs[i % 5], { every: 12 }), C(x, tops[i % 5], 0, 1.7, 0.3, BC.strawL, PL)));
    for (const h of [22, 50]) parts.push(...cane([1, h, 3.2], [63, h, 3.2], 1.1, BC.caneD, { nodes: false }), ...xs.filter((_, i) => i % 2 === 0).map(x => lash([x, h, 3.2], 'y', 1.1, 2.4)));
    return parts;
  })()),

  // a stack of three round bamboo steamer baskets and a domed lid on a little slatted cane stand
  piece('bmbsteamer', 'Bamboo steamer stack', 1, 1, 320, 'gloss', (() => {
    const parts = [...posts([5, 27], [-11, 11], 12, 1.4, CA, { nodes: false }), ...deck(3, 29, 12.6, 0, 28, 8, [BC.strawD, ST])];
    for (let i = 0; i < 3; i++) {
      const b0 = 13.3 + i * 7;
      parts.push(C(16, b0 + 3.5, 0, 11, 7, ST, { m: 'wood', tex: 'weave', seg: 18 }), C(16, b0 + 0.6, 0, 11.4, 1.2, BC.strawD, { m: 'wood', seg: 18 }), C(16, b0 + 6.4, 0, 11.4, 1.2, BC.strawD, { m: 'wood', seg: 18 }));
    }
    parts.push(LA(16, 34.3, 0, [[11.4, 0], [11.4, 1.2], [10, 2.6], [6, 4.2], [0, 4.8]], ST, { m: 'wood', seg: 18, tex: 'weave' }), RG(16, 39.1, 0, 1.6, 0.5, BC.caneD, { m: 'gloss', a0: 0, arc: Math.PI }));
    return parts;
  })(), {}),

  // a barrel drum of dark lacquer on a cane cradle, roped heads, Pangoro's scowling face painted on the front, two cane
  // sticks
  piece('bmbdrum', 'Bamboo Pangoro drum', 1, 1, 760, 'gloss', [
    ...posts([4, 28], [-6, 6], 20, 1.3, CA, { every: 8 }),
    ...[-6, 6].map(z => RD([4, 13, z], [28, 13, z], 0.9, ST, GL)), ...[4, 28].map(x => RD([x, 18, -6], [x, 18, 6], 0.9, ST, GL)),
    DS(16, 26, 0, 10.4, 12.6, BC.lacq, { m: 'gloss', seg: 20 }), DS(16, 26, 0, 10.8, 3, BC.lacqL, { m: 'gloss', seg: 20 }),
    ...[-1, 1].flatMap(s => [DS(16, 26, s * 6.6, 10.2, 0.6, BC.head, { m: 'plain', seg: 20 }), RG(16, 26, s * 6.6, 10.6, 0.7, BC.cord, { m: 'cloth' })]),
    PC(16, 26, 7.1, 14, 14, pangoro),
    RD([3, 21, 9], [12, 22, 12], 0.6, ST, GL), RD([20, 22, 12], [29, 21, 9], 0.6, ST, GL),
    ...[4, 28].flatMap(x => [-6, 6].map(z => lash([x, 18, z], 'y', 1.3))),
  ]),

  // a wind chime stand: a green cane post on a lacquer foot, a gold arm lashed on, a lacquer disc hung with six
  // bamboo tubes, a clapper and a sage wind sail
  piece('bmbchime', 'Bamboo wind chime', 1, 1, 380, 'gloss', (() => {
    const parts = [B(11, 1.4, 0, 20, 2.8, 16, BC.lacq, { m: 'gloss', r: 0.6 }), ...cane([6, 2.8, 0], [6, 66, 0], 1.6, CA), ...cane([4.6, 63, 0], [28, 63, 0], 1.1, ST, { nodes: false }), lash([6, 63, 0], 'y', 1.6)];
    parts.push(RD([22, 62, 0], [22, 56.2, 0], 0.25, BC.cord, PL), C(22, 55.6, 0, 5.4, 1.2, BC.lacq, { m: 'gloss', seg: 14 }));
    [14, 11, 16, 12, 15, 10].forEach((len, i) => {
      const a = i / 6 * TAU, x = 22 + Math.cos(a) * 3.6, z = Math.sin(a) * 3.6;
      parts.push(RD([x, 55, z], [x, 53, z], 0.2, BC.cord, PL), ...cane([x, 53, z], [x, 53 - len, z], 0.9, i % 2 ? CA : ST, { every: 7 }));
    });
    parts.push(RD([22, 55, 0], [22, 34, 0], 0.2, BC.cord, PL), C(22, 44, 0, 2, 0.8, BC.lacqL, { m: 'gloss', seg: 10 }), B(22, 30.4, 0, 5, 7, 0.4, BC.sage, { m: 'cloth', r: 0.4 }));
    return parts;
  })()),

  // a bedside cabinet: canes at the corners, a woven drawer under a lacquer top, a woven box on the shelf below, a cane
  // bud vase and folded linen
  piece('bmbnightstand', 'Bamboo nightstand', 1, 1, 400, 'gloss', [
    ...posts([3, 29], [-11, 11], 25, 1.4, CA, { every: 8 }),
    B(16, 19.6, -0.5, 24, 9, 21, ST, { m: 'wood', r: 0.6 }), B(16, 19.6, 10.4, 22, 7, 0.8, BC.mat, WV), B(16, 19.6, 11.2, 5, 1.2, 0.9, BC.lacq, { m: 'gloss', r: 0.4 }),
    ...deck(4, 28, 4, 0, 21, 6, [BC.strawD, ST]), B(16, 10, -10.4, 24, 12, 0.8, ST, { m: 'wood', r: 0 }),
    B(16, 8.2, 1, 17, 7, 15, BC.mat, WV),
    B(16, 25, 0, 30, 2, 26, BC.lacq, { m: 'gloss', r: 0.6 }),
    ...cane([8, 26, -4], [8, 33, -4], 1.8, CA, { nodes: false }), C(8, 30, -4, 2.2, 0.7, BC.caneD, GL),
    RD([8, 33, -4], [6, 38, -4], 0.25, BC.leafD, PL), leaf(6, 38, -4, 130, 6, 1.8), leaf(6.6, 37, -4, 60, 5, 1.6, BC.leafL),
    B(21, 26.8, 3, 11, 1.6, 9, BC.linen, { m: 'cloth', r: 0.6 }), B(21, 28.2, 3, 10.4, 1.2, 8.4, BC.sageL, { m: 'cloth', r: 0.5 }),
  ]),

  // a tall woven laundry hamper with a lidded top, a lacquer rim, cane loop handles and a sage towel over the edge
  piece('bmbhamper', 'Bamboo laundry hamper', 1, 1, 300, 'gloss', [
    LA(16, 0, 0, [[8.6, 0], [9.2, 1], [10, 13], [10.4, 26]], ST, { m: 'wood', seg: 16, tex: 'weave' }),
    RG(16, 1, 0, 9.2, 0.7, BC.strawD, { m: 'wood', flat: true }), RG(16, 26, 0, 10.4, 0.8, BC.lacq, { m: 'gloss', flat: true }),
    LA(16, 26.4, 0, [[11, 0], [11, 1], [9, 2.6], [4, 3.6], [0, 3.8]], BC.strawD, { m: 'wood', seg: 16, tex: 'weave' }),
    S(16, 30.8, 0, 1.6, 1.4, 1.6, BC.lacq, { m: 'gloss', seg: 8 }),
    RG(26.2, 19, 0, 2.2, 0.6, CA, { m: 'gloss', a0: -Math.PI / 2, arc: Math.PI }), RG(5.8, 19, 0, 2.2, 0.6, CA, { m: 'gloss', a0: Math.PI / 2, arc: Math.PI }),
    B(12, 23.4, 10.4, 8, 6, 0.8, BC.sageL, { m: 'cloth', r: 0.4 }), B(12, 26.6, 9, 8, 1.2, 3.4, BC.sageL, { m: 'cloth', r: 0.4 }),
  ]),
];
