/* base-furniture-bakery.js  -  the Bakery set (furniture expansion session i, 2026-10-17): a room type, Animal Crossing's
   Happy Home Paradise bakery. A cosy neighbourhood bakery in warm cream and butter yellow, honey-coloured wood, flour
   white and a little sky-blue trim: wicker baskets of golden loaves and baguettes, a lit glass case of pastries, a brick
   deck oven, a proofing rack, a floor mixer, a floured kneading table, a till with its bell, café seats and a striped
   awning. A Slurpuff on the cake tower, an Alcremie on the cupcakes, a Munchlax cookie jar, a Fidough in the dough bowl
   and Dachsbun on the shop sign for the Pokémon touches. All solo, fixed colours, sold all year.
   An upright piece is a list of parts in painted units (32 a tile), as in js/base-furniture-ranch.js: `x` across from the
   left of its front, `h` up from the floor (a wall piece's from the foot of its strip), `z` out to the front from its
   middle (a wall piece's from the wall). They're painted here from any side, and js/base-models-bakery.js builds the same
   list as 3D parts (BUILT), so picture and model agree. A `wedge` is a side profile ([z, up] points) extruded `w` across
   (the awning's slope). `tex` is painted only (the model stays plain colour): `wicker` a basket's weave, `brick` the
   oven's courses, `flour` a floured top, `score` a loaf's slashes, `check` gingham, `stave` a barrel's staves; `tc` is
   its colour. A `pic` part (the menu, the pie clock's dial, the flour sack's print, the till's flag, the Dachsbun sign) is
   painted on the front only, and the model wears that crop of the painting. The deck oven's upper door swings (`doors`,
   `inside`). The rug is a checked floor rug, painted from above. */

import { sh, oval, ovalShade, floorShadow, ctx, hash, glass as glassPane } from './base-paint.js';

export const BK = {
  honey: '#c8904c', honeyL: '#deae6c', honeyD: '#946232', cream: '#f7ecd6', creamD: '#e6d4b0', butter: '#f4d47c',
  butterD: '#d8b050', flour: '#fbf9f2', sky: '#86c2e6', skyD: '#5a98c4', skyL: '#c2e2f4', crust: '#c27a32',
  crustL: '#e2a656', crustD: '#8c4c1c', bun: '#d89848', brick: '#b45c40', brickD: '#843c28', mortar: '#e0cfb4',
  steel: '#bcc2c8', steelL: '#e0e4e8', steelD: '#868c94', iron: '#3e3a38', wicker: '#d4a864', wickerD: '#a07838',
  marble: '#f2efe8', choc: '#6c4028', berry: '#d4485a', pink: '#f4aabc', pinkL: '#fbd2dc', mint: '#a6dcc4',
  lemon: '#f6e27a', glow: '#ffb45c', glass: '#cfe8f4', ink: '#3a2a20', chalk: '#2f3d36', red: '#d85a4a', brass: '#c9a046',
  brassD: '#a07e30', dough: '#f2e2c0', sack: '#ece2cc', sackD: '#cbbd9e', leather: '#7a4a2a',
  munch: '#2f5f74', munchC: '#f0e2bc', fido: '#f6e0a6', fidoD: '#e2bc76', whip: '#fffaf0',
};
const GROUP = 'Bakery';
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
const WG = (x, h, z, w, pts, c, o) => ({ t: 'wedge', x, h, z, w, pts, c, ...o });

const CL = { m: 'cloth' }, PL = { m: 'plain' }, GL = { m: 'gloss' }, WD = { m: 'wood' }, MT = { m: 'metal' }, GLW = { m: 'glow' };
const GLS = { m: 'glass' }, WIC = { m: 'cloth', tex: 'wicker', ts: 2 }, LOAF = { m: 'cloth', tex: 'score', seg: 10 };

/** A croissant seen from the front: a plump arch of pastry sitting on line `top`. */
const croissant = (x, top, z, c = BK.crustL, r = 2.6) => RG(x, top + 0.9, z, r, r * 0.46, c, { m: 'cloth', a0: 0.15, arc: Math.PI - 0.3 });
/** A cupcake standing on line h: its paper case, a swirl of frosting and a cherry. */
const cupcake = (x, h, z, wrap, frost) => [
  LA(x, h, z, [[1.8, 0], [2.6, 3.2]], wrap, { m: 'plain', seg: 10 }),
  S(x, h + 4.2, z, 2.9, 2.2, 2.9, frost, { m: 'cloth', seg: 8 }),
  S(x, h + 6.4, z, 0.7, 0.7, 0.7, BK.berry, { m: 'gloss', seg: 6 }),
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
  const g = ctx(), [x0, y0, x1, y1] = bb, c = q.c, tc = q.tc || sh(c, -2), seed = Math.round(q.x * 7 + q.h * 13 + q.z * 3);
  g.save(); g.clip(path);
  if (q.tex === 'wicker') {
    const s = q.ts || 2;
    g.globalAlpha = 0.55; g.strokeStyle = sh(c, -2); g.lineWidth = 0.3; g.beginPath();
    for (let y = y0 + s * 0.8; y < y1; y += s * 0.8) { g.moveTo(x0, y); g.lineTo(x1, y); }
    g.stroke();
    g.globalAlpha = 0.6; g.fillStyle = sh(c, 1);
    for (let y = y0 + s * 0.4, i = 0; y < y1; y += s * 0.8, i++) for (let x = x0 + (i % 2 ? s / 2 : 0); x < x1 + s; x += s) { g.beginPath(); g.ellipse(x, y, s * 0.34, s * 0.22, 0, 0, TAU); g.fill(); }
    g.globalAlpha = 0.4; g.fillStyle = sh(c, -2);
    for (let y = y0 + s * 0.4, i = 0; y < y1; y += s * 0.8, i++) for (let x = x0 + (i % 2 ? 0 : s / 2); x < x1 + s; x += s) g.fillRect(x - 0.15, y - s * 0.25, 0.3, s * 0.5);
  } else if (q.tex === 'brick') {
    const s = q.ts || 4.4, hb = s * 0.42;
    for (let y = y0, i = 0; y < y1; y += hb, i++) for (let x = x0 - (i % 2 ? s / 2 : 0); x < x1; x += s) {
      const v = hash(Math.round(x * 3), i, seed);
      if (v < 0.5) { g.globalAlpha = 0.3; g.fillStyle = v < 0.25 ? sh(c, 1) : sh(c, -1); g.fillRect(x, y, s, hb); }
    }
    g.globalAlpha = 0.85; g.strokeStyle = tc; g.lineWidth = 0.35; g.beginPath();
    for (let y = y0, i = 0; y < y1; y += hb, i++) {
      g.moveTo(x0, y); g.lineTo(x1, y);
      for (let x = x0 - (i % 2 ? s / 2 : 0); x < x1; x += s) { g.moveTo(x, y); g.lineTo(x, y + hb); }
    }
    g.stroke();
  } else if (q.tex === 'flour') {
    for (let i = 0; i < 3; i++) {
      const px = x0 + (0.2 + hash(i, seed, 1) * 0.6) * (x1 - x0), py = y0 + (0.2 + hash(i, seed, 2) * 0.6) * (y1 - y0), r = Math.min(x1 - x0, 14) * (0.2 + hash(i, seed, 3) * 0.2);
      const t = g.createRadialGradient(px, py, 0, px, py, r); t.addColorStop(0, 'rgba(255,255,255,0.6)'); t.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = t; g.fillRect(px - r, py - r, r * 2, r * 2);
    }
    const n = Math.round((x1 - x0) * (y1 - y0) / 4);
    g.fillStyle = '#ffffff';
    for (let i = 0; i < n; i++) { g.globalAlpha = 0.4 + hash(i, seed, 5) * 0.4; g.fillRect(x0 + hash(i, seed, 6) * (x1 - x0), y0 + hash(i, seed, 7) * (y1 - y0), 0.4, 0.4); }
  } else if (q.tex === 'score') {
    const W = x1 - x0, H = y1 - y0, n = W > 9 ? 3 : 2;
    g.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const x = x0 + W * (i + 1) / (n + 1), dx = W * 0.09;
      g.globalAlpha = 0.9; g.strokeStyle = BK.butter; g.lineWidth = Math.max(0.35, H * 0.1);
      g.beginPath(); g.moveTo(x - dx, y0 + H * 0.22); g.lineTo(x + dx, y0 + H * 0.58); g.stroke();
      g.globalAlpha = 0.5; g.strokeStyle = sh(c, -2); g.lineWidth = Math.max(0.2, H * 0.04);
      g.beginPath(); g.moveTo(x - dx + 0.3, y0 + H * 0.22); g.lineTo(x + dx + 0.3, y0 + H * 0.58); g.stroke();
    }
  } else if (q.tex === 'check') {
    const s = q.ts || 1.6;
    g.globalAlpha = 0.5; g.fillStyle = tc;
    for (let x = x0; x < x1; x += s * 2) g.fillRect(x, y0, s, y1 - y0);
    for (let y = y0; y < y1; y += s * 2) g.fillRect(x0, y, x1 - x0, s);
  } else if (q.tex === 'stave') {
    const s = q.ts || 2;
    g.globalAlpha = 0.5; g.strokeStyle = tc; g.lineWidth = 0.3; g.beginPath();
    for (let x = x0 + s; x < x1; x += s) { g.moveTo(x, y0); g.lineTo(x, y1); }
    g.stroke();
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
      case 'wedge': {
        const ups = q.pts.map(p => p[1]), top = Math.max(...ups), bot = Math.min(...ups);
        if (!side) { rbx(cx - q.w / 2, cy - top, q.w, top - bot, 0.3, q.c, m); break; }
        poly(q.pts.map(([pz, up]) => [U(q.x, q.z + pz), cy - up]), q.c, m);
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
        if (m === 'glass') break;
        const [rt, ut] = q.pts[q.pts.length - 1];
        oval(cx, cy - ut, rt, rt * 0.22, sh(q.c, -2));
        break;
      }
      case 'ring': {
        const ry = q.ry ?? q.r;
        if (side && !q.flat) { if (q.arc) break; rbx(cx - q.tr, cy - ry - q.tr, q.tr * 2, (ry + q.tr) * 2, q.tr, q.c, m); break; }
        const a0 = q.arc ? -(q.a0 + q.arc) : 0, a1 = q.arc ? -q.a0 : TAU;
        const path = (dy = 0) => { g.beginPath(); if (q.flat) g.ellipse(cx, cy + dy, q.r, q.r * 0.22, 0, 0, TAU); else g.ellipse(cx, cy + dy, q.r, ry, 0, a0, a1); };
        g.lineCap = q.arc ? 'round' : 'butt'; g.strokeStyle = q.c; g.lineWidth = q.tr * 2; path(); g.stroke();
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
        break;
      }
      case 'pic': g.save(); g.beginPath(); g.rect(cx - q.w / 2, cy - q.hh / 2, q.w, q.hh); g.clip(); q.fn(g, cx - q.w / 2, cy - q.hh / 2, q.w, q.hh); g.restore(); break;
    }
  }
}

/* ---------- pictures ---------- */

/** A sheaf of wheat at (cx, foot), s tall: stalks fanned out, a band, and plump ears. */
function wheat(g, cx, foot, s, c, band) {
  g.lineCap = 'round';
  for (const a of [-0.32, -0.16, 0, 0.16, 0.32]) {
    const tx = cx + Math.sin(a) * s, ty = foot - Math.cos(a) * s;
    g.strokeStyle = c; g.lineWidth = s * 0.05; g.beginPath(); g.moveTo(cx - a * s * 0.2, foot); g.lineTo(tx, ty + s * 0.3); g.stroke();
    g.fillStyle = c;
    for (let i = 0; i < 4; i++) for (const sd of [-1, 1]) {
      const k = 0.3 - i * 0.08, ex = tx - Math.sin(a) * s * k + sd * s * 0.045, ey = ty + Math.cos(a) * s * k;
      g.beginPath(); g.ellipse(ex, ey, s * 0.04, s * 0.075, a + sd * 0.45, 0, TAU); g.fill();
    }
  }
  g.fillStyle = band; g.fillRect(cx - s * 0.12, foot - s * 0.42, s * 0.24, s * 0.08);
}

/** The menu board: a chalkboard, MENU in butter chalk, four lines with prices, a loaf doodle. */
function menuPic(g, x, y, w, h) {
  g.fillStyle = BK.chalk; g.fillRect(x, y, w, h);
  for (let i = 0; i < 14; i++) { g.globalAlpha = 0.07; g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(x + hash(i, 4, 1) * w, y + hash(i, 5, 1) * h, 2 + hash(i, 6, 1) * 4, 1 + hash(i, 7, 1) * 2, 0, 0, TAU); g.fill(); }
  g.globalAlpha = 0.8; g.strokeStyle = BK.cream; g.lineWidth = 0.3; g.setLineDash([0.8, 0.6]); g.strokeRect(x + 1.2, y + 1.2, w - 2.4, h - 2.4); g.setLineDash([]);
  g.globalAlpha = 1; g.textBaseline = 'alphabetic';
  g.fillStyle = BK.butter; g.textAlign = 'center'; g.font = `bold ${h * 0.17}px Georgia, serif`; g.fillText('MENU', x + w / 2, y + h * 0.24, w * 0.5);
  const lines = [['Baguette', '₽2'], ['Croissant', '₽3'], ['Fidough bun', '₽4'], ['Slurpuff cake', '₽9']];
  g.font = `${h * 0.1}px Georgia, serif`;
  lines.forEach(([name, price], i) => {
    const ly = y + h * (0.42 + i * 0.15);
    g.fillStyle = i % 2 ? BK.pinkL : '#f4f2ea'; g.textAlign = 'left'; g.fillText(name, x + w * 0.1, ly, w * 0.5);
    g.textAlign = 'right'; g.fillStyle = BK.butter; g.fillText(price, x + w * 0.9, ly);
    g.fillStyle = 'rgba(255,255,255,0.45)'; for (let d = x + w * 0.58; d < x + w * 0.78; d += 1.2) g.fillRect(d, ly - 0.4, 0.4, 0.4);
  });
  g.strokeStyle = BK.butter; g.lineWidth = 0.35; g.globalAlpha = 0.9;
  g.beginPath(); g.ellipse(x + w * 0.13, y + h * 0.17, w * 0.06, h * 0.06, 0, 0, TAU); g.stroke();
  for (const d of [-1, 0, 1]) { g.beginPath(); g.moveTo(x + w * (0.13 + d * 0.03) - 0.4, y + h * 0.13); g.lineTo(x + w * (0.13 + d * 0.03) + 0.4, y + h * 0.21); g.stroke(); }
  g.beginPath(); g.ellipse(x + w * 0.87, y + h * 0.17, w * 0.05, h * 0.05, 0, Math.PI, TAU); g.stroke();
  g.globalAlpha = 1;
}

/** The pie clock's face: berry filling under a lattice of crust strips, a cream dial, hands at ten past ten. */
function pieDial(g, x, y, w, h) {
  const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2;
  g.fillStyle = BK.berry; g.fillRect(x, y, w, h);
  g.save(); g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.clip();
  g.fillStyle = BK.crustL;
  for (const ang of [Math.PI / 4, -Math.PI / 4]) for (const o of [-0.62, 0, 0.62]) {
    g.save(); g.translate(cx, cy); g.rotate(ang); g.fillRect(-r * 1.2, o * r - r * 0.09, r * 2.4, r * 0.18); g.restore();
  }
  g.restore();
  g.fillStyle = BK.cream; g.beginPath(); g.arc(cx, cy, r * 0.5, 0, TAU); g.fill();
  g.strokeStyle = BK.crustD; g.lineWidth = r * 0.04; g.beginPath(); g.arc(cx, cy, r * 0.5, 0, TAU); g.stroke();
  g.fillStyle = BK.crustD;
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, big = i % 3 === 0, rr = r * 0.41; g.beginPath(); g.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, r * (big ? 0.045 : 0.025), 0, TAU); g.fill(); }
  g.strokeStyle = BK.ink; g.lineCap = 'round';
  for (const [a, len, lw] of [[-150, 0.24, 0.06], [-30, 0.36, 0.04]]) { const t = a * Math.PI / 180; g.lineWidth = r * lw; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(t) * r * len, cy + Math.sin(t) * r * len); g.stroke(); }
  g.fillStyle = BK.berry; g.beginPath(); g.arc(cx, cy, r * 0.06, 0, TAU); g.fill();
}

/** The flour sack's print: a sky-blue wheat sheaf and FLOUR on the sacking. */
function flourLabel(g, x, y, w, h) {
  g.fillStyle = BK.sack; g.fillRect(x, y, w, h);
  g.strokeStyle = BK.skyD; g.lineWidth = 0.4; g.strokeRect(x + 0.6, y + 0.6, w - 1.2, h - 1.2);
  wheat(g, x + w * 0.2, y + h * 0.88, h * 0.72, BK.skyD, BK.skyD);
  g.fillStyle = BK.skyD; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `bold ${h * 0.36}px Georgia, serif`;
  g.fillText('FLOUR', x + w * 0.62, y + h * 0.44, w * 0.6);
  g.font = `${h * 0.18}px Georgia, serif`; g.fillText('No. 1', x + w * 0.62, y + h * 0.78, w * 0.4);
}

/** The till's price flag. */
function tillFlag(g, x, y, w, h) {
  g.fillStyle = BK.cream; g.fillRect(x, y, w, h);
  g.fillStyle = BK.ink; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `bold ${h * 0.7}px Georgia, serif`;
  g.fillText('₽300', x + w / 2, y + h * 0.55, w * 0.86);
}

/** The shop sign: cream board in a sky-blue border, BAKERY, and Dachsbun (a bread-loaf dog) between two sheaves. */
function signPic(g, x, y, w, h) {
  g.fillStyle = BK.skyD; g.fillRect(x, y, w, h);
  g.fillStyle = BK.cream; g.fillRect(x + 1.2, y + 1.2, w - 2.4, h - 2.4);
  g.strokeStyle = BK.sky; g.lineWidth = 0.4; g.strokeRect(x + 2, y + 2, w - 4, h - 4);
  g.fillStyle = BK.honeyD; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.font = `bold ${h * 0.2}px Georgia, serif`;
  g.fillText('BAKERY', x + w / 2, y + h * 0.3, w * 0.8);
  wheat(g, x + w * 0.14, y + h * 0.9, h * 0.5, BK.butterD, BK.skyD);
  wheat(g, x + w * 0.86, y + h * 0.9, h * 0.5, BK.butterD, BK.skyD);
  const cx = x + w * 0.47, cy = y + h * 0.64, s = w * 0.3;
  g.strokeStyle = BK.ink; g.lineWidth = s * 0.035;
  g.fillStyle = BK.fido;
  for (const lx of [-0.62, -0.3, 0.2, 0.5]) { g.beginPath(); g.roundRect(cx + lx * s, cy + s * 0.18, s * 0.16, s * 0.34, s * 0.06); g.fill(); g.stroke(); }
  const bg = g.createLinearGradient(0, cy - s * 0.4, 0, cy + s * 0.3); bg.addColorStop(0, BK.crustL); bg.addColorStop(1, BK.crust);
  g.fillStyle = bg; g.beginPath(); g.ellipse(cx - s * 0.12, cy, s * 0.78, s * 0.36, 0, 0, TAU); g.fill(); g.stroke();
  g.strokeStyle = BK.butter; g.lineWidth = s * 0.06;
  for (const sx of [-0.5, -0.15, 0.2]) { g.beginPath(); g.moveTo(cx + sx * s - s * 0.06, cy - s * 0.22); g.lineTo(cx + sx * s + s * 0.08, cy + s * 0.02); g.stroke(); }
  g.strokeStyle = BK.ink; g.lineWidth = s * 0.035;
  g.fillStyle = BK.bun; g.beginPath(); g.ellipse(cx - s * 0.94, cy - s * 0.12, s * 0.14, s * 0.1, -0.5, 0, TAU); g.fill(); g.stroke();
  const hx = cx + s * 0.7, hy = cy - s * 0.26;
  g.fillStyle = BK.fido; g.beginPath(); g.ellipse(hx, hy, s * 0.34, s * 0.3, 0, 0, TAU); g.fill(); g.stroke();
  g.beginPath(); g.ellipse(hx + s * 0.28, hy + s * 0.08, s * 0.17, s * 0.13, 0, 0, TAU); g.fill(); g.stroke();
  g.fillStyle = BK.crustD; g.beginPath(); g.ellipse(hx - s * 0.16, hy + s * 0.12, s * 0.12, s * 0.26, 0.35, 0, TAU); g.fill(); g.stroke();
  g.fillStyle = BK.ink; g.beginPath(); g.arc(hx + s * 0.08, hy - s * 0.06, s * 0.05, 0, TAU); g.fill();
  g.beginPath(); g.arc(hx + s * 0.43, hy + s * 0.04, s * 0.05, 0, TAU); g.fill();
}

/* ---------- the kinds ---------- */

/** What js/base-models-bakery.js builds for each upright and wall kind: its parts, doors and default material. */
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

const MAC = [BK.pink, BK.mint, BK.lemon, BK.choc];

export const BAKERY_KINDS = [
  // a honey-wood display case of pastries behind glass, lit warm from the back: a strawberry cake, fruit tarts,
  // croissants and éclairs below, macarons, doughnuts and cupcakes on the glass shelf, sky-blue panels on its base
  piece('bakcase', 'Bakery display case', 2, 1, 1500, 'wood', [
    B(32, 1.5, 0, 62, 3, 28, BK.honeyD, WD),
    B(32, 11.5, 0, 62, 17, 28, BK.honey, WD),
    ...[11, 32, 53].flatMap(x => [B(x, 11.5, 14.2, 18, 12, 0.8, BK.sky, GL), B(x, 11.5, 14.7, 14, 8, 0.4, BK.skyL, GL)]),
    B(32, 20.7, 0.5, 64, 1.4, 29, BK.honeyL, WD),
    B(32, 32.4, -12.2, 58, 21, 1, BK.glow, GLW),
    B(32, 21.8, 0, 58, 0.8, 24, BK.cream, PL),
    C(10, 25.2, 1, 5.4, 6, BK.pinkL, CL), C(10, 28.6, 1, 5.4, 0.8, BK.cream, PL),
    ...[[7.4, 3.6], [10, 5], [12.6, 3.6]].map(([x, z]) => S(x, 29.6, z, 0.9, 1, 0.9, BK.berry, { m: 'gloss', seg: 6 })),
    ...[21, 29].flatMap(x => [C(x, 23, 4, 3.4, 1.6, BK.crustL, WD), C(x, 24, 4, 2.8, 0.6, BK.lemon, PL), S(x, 24.6, 4, 1, 0.7, 1, BK.berry, { m: 'gloss', seg: 6 })]),
    croissant(39, 22.2, 4), croissant(46, 22.2, 4, BK.crust), croissant(53, 22.2, 4),
    ...[-5, -1].flatMap(z => [RD([40, 23.6, z], [56, 23.6, z], 1.3, BK.crustL, CL), RD([40.4, 24.6, z], [55.6, 24.6, z], 0.7, BK.choc, GL)]),
    B(32, 32, -1, 58, 0.6, 20, BK.glass, GLS),
    ...[6, 10, 14, 18, 22, 26].map((x, i) => S(x, 33.8, 3, 1.7, 1.2, 1.7, MAC[i % 4], { m: 'cloth', seg: 8 })),
    ...[[36, BK.pink], [43, BK.choc]].map(([x, c]) => RG(x, 34.7, 2, 2.2, 1.1, c, { m: 'gloss' })),
    ...cupcake(51, 32.3, 2, BK.sky, BK.pinkL), ...cupcake(57.6, 32.3, 2, BK.lemon, BK.whip),
    B(32, 32.4, 0.5, 60, 22, 27, BK.glass, { m: 'glass', k: 40, r: 0.6 }),
    ...[2.6, 61.4].flatMap(x => [-13, 13.6].map(z => B(x, 32.4, z, 1.6, 22, 1.6, BK.honeyD, { m: 'wood', k: 41 }))),
    B(32, 44.4, 0.5, 64, 2, 29, BK.honeyD, { m: 'gloss', k: 42 }),
  ], { glow: [BK.glow] }),

  // an open honey-wood bread shelf: wicker baskets of round loaves, a basket of standing baguettes, long bâtards, a tray
  // of rolls and a braided loaf, a sky-blue crest on top
  piece('bakshelf', 'Bakery bread shelf', 2, 1, 980, 'wood', [
    ...[2, 62].map(x => B(x, 31, 0, 3, 62, 24, BK.honey, WD)),
    B(32, 31, -10.8, 58, 60, 1.6, BK.honeyD, WD),
    ...[3, 22, 41].map(h => B(32, h, 0.5, 58, 2, 23, BK.honeyL, WD)),
    B(32, 61.4, 0.5, 64, 2, 25, BK.honeyD, WD),
    B(32, 67, -9.6, 44, 9, 1.6, BK.sky, GL), B(32, 67, -8.6, 38, 5.4, 0.4, BK.cream, PL), S(32, 67, -8.2, 6, 2, 0.6, BK.crust, LOAF),
    ...[17, 47].flatMap(x => [
      C(x, 8.6, 1, 11, 9, BK.wicker, WIC), RG(x, 13.2, 1, 11, 0.9, BK.wickerD, { m: 'cloth', flat: true }),
      S(x - 4.6, 14.6, -1, 4.4, 3, 4, BK.crust, LOAF), S(x + 4.6, 14.6, -1, 4.4, 3, 4, BK.crustL, LOAF), S(x, 15.4, 5, 4.2, 3, 3.6, BK.bun, LOAF),
    ]),
    B(16, 27.6, 0, 22, 7.2, 16, BK.wicker, WIC),
    ...[[8, BK.crustL], [12, BK.crust], [16, BK.crustL], [20, BK.crust], [24, BK.crustL]].map(([x, c], i) => RD([x, 25, i % 2 ? 2 : -2], [x + 1.6, 38.4, i % 2 ? -2 : -5], 1.5, c, CL)),
    S(41, 26.4, 3, 7, 2.8, 3.4, BK.crustL, LOAF), S(55, 26.4, 2, 5.6, 2.8, 3.4, BK.crust, LOAF), S(48, 30.6, -2, 6.4, 2.6, 3.2, BK.bun, LOAF),
    B(18, 43.6, 1, 26, 2.4, 18, BK.wicker, WIC),
    ...[[9, 4], [15, 4], [21, 4], [27, 4], [12, -3], [18, -3], [24, -3]].map(([x, z]) => S(x, 46.6, z, 2.8, 2.2, 2.8, BK.bun, { m: 'cloth', seg: 8 })),
    ...[[46, 0], [51.6, 0.6], [57, 0]].map(([x, dh], i) => S(x, 45.2 + dh, -2, 3.2, 2.4, 3.6, i % 2 ? BK.crustL : BK.crust, { m: 'cloth', seg: 8 })),
    RD([50, 42, 7], [50, 46, 7], 0.3, BK.honeyD, WD), B(50, 48.6, 7, 9, 5.4, 0.6, BK.chalk, PL), B(50, 49.4, 7.4, 6, 0.6, 0.2, BK.cream, PL),
  ]),

  // a brick deck oven with a steel front: two baking decks with glowing windows (the upper door swings open), a row of
  // dials, a flue, and two tins of loaves cooling on top
  piece('bakoven', 'Bakery deck oven', 2, 1, 1650, 'metal', [
    B(32, 3, -1, 62, 6, 28, BK.steelD, MT),
    B(32, 31, -2.5, 62, 50, 25, BK.brick, { m: 'cloth', tex: 'brick', tc: BK.mortar, ts: 4.4 }),
    B(32, 57.4, -2, 64, 3, 27, BK.brickD, CL),
    B(32, 30, 10.6, 58, 44, 1.2, BK.steel, MT),
    B(32, 19, 11.8, 50, 15, 1.2, BK.steelL, MT), B(32, 19.6, 12.6, 36, 7, 0.4, BK.glow, GLW),
    RD([10, 25, 14.6], [54, 25, 14.6], 0.7, BK.steelD, MT), ...[10, 54].map(x => RD([x, 25, 12.4], [x, 25, 14.6], 0.4, BK.steelD, MT)),
    B(32, 47.6, 11.6, 54, 6, 1, BK.steelD, MT),
    ...[10, 16, 22].map(x => DS(x, 47.6, 12.4, 1.6, 0.8, BK.ink, { m: 'plain', seg: 10 })),
    DS(50, 47.6, 12.4, 2.4, 0.6, BK.cream, { m: 'plain', seg: 12 }), RD([50, 47.6, 12.8], [51.4, 49, 12.8], 0.2, BK.berry, PL),
    C(52, 64, -9, 2.6, 12, BK.steelD, { m: 'metal', seg: 12 }), C(52, 70.4, -9, 3.4, 1.2, BK.steelD, { m: 'metal', seg: 12 }),
    ...[14, 28].flatMap(x => [B(x, 60.6, 0, 11, 3.4, 7, BK.steelD, MT), S(x, 62.4, 0, 5.4, 2.6, 3.4, BK.crust, LOAF)]),
  ], {
    doors: [{ hinge: [7, 12], side: 1, parts: [
      B(32, 36, 12.6, 50, 14, 1.2, BK.steelL, MT), B(32, 36.6, 13.4, 36, 6, 0.4, BK.glow, GLW),
      RD([10, 41.6, 15], [54, 41.6, 15], 0.7, BK.steelD, MT), ...[10, 54].map(x => RD([x, 41.6, 13.2], [x, 41.6, 15], 0.4, BK.steelD, MT)),
    ] }],
    inside: { x: 32, h: 36, w: 46, hh: 12, z: 11.4 },
    glow: [BK.glow],
  }),

  // a steel proofing rack on castors: five trays of dough balls, baguettes, croissants and rolls rising, the canvas
  // cover rolled up on top
  piece('bakproofer', 'Bakery proofing rack', 1, 1, 620, 'metal', [
    ...[[3, -11], [29, -11], [3, 11], [29, 11]].flatMap(([x, z]) => [RD([x, 4, z], [x, 62, z], 0.8, BK.steel, MT), RD([x, 4, z], [x, 2.8, z], 0.4, BK.steelD, MT), DS(x, 1.6, z, 1.6, 1, BK.ink, { m: 'gloss', seg: 8 })]),
    B(16, 62.4, 0, 28, 1.4, 24, BK.steelD, MT), B(16, 4.6, 0, 28, 1.4, 24, BK.steelD, MT),
    ...[12, 22, 32, 42, 52].map(h => B(16, h, 0, 26, 0.8, 22, BK.steelL, MT)),
    ...[12.4, 32.4].flatMap(h => [[8, 3], [16, 3], [24, 3], [12, -5], [20, -5]].map(([x, z]) => S(x, h + 2, z, 3, 2, 3, BK.dough, { m: 'cloth', seg: 8 }))),
    ...[-6, 0, 6].map(z => RD([5, 23.8, z], [27, 23.8, z], 1.4, BK.crustL, CL)),
    ...[[8, 3], [16, 3], [24, 3], [12, -5], [20, -5]].map(([x, z]) => croissant(x, 42.4, z, x === 16 ? BK.crust : BK.crustL, 2.4)),
    ...[[8, 3], [16, 3], [24, 3], [12, -5], [20, -5]].map(([x, z]) => S(x, 54, z, 2.6, 1.6, 2.6, BK.bun, { m: 'cloth', seg: 8 })),
    RD([3, 64.3, -10], [29, 64.3, -10], 1.3, BK.cream, CL),
  ]),

  // a big sky-blue floor mixer: a column and head over a steel bowl of dough, its hook down in it, a speed lever
  piece('bakmixer', 'Bakery floor mixer', 1, 1, 880, 'gloss', [
    B(16, 2.5, -1, 28, 5, 28, BK.skyD, GL),
    B(16, 29, -9, 11, 48, 10, BK.sky, GL),
    B(16, 54, -2, 15, 11, 26, BK.sky, GL), S(16, 59.4, -8, 6.4, 2.6, 6.4, BK.sky, { m: 'gloss', seg: 12 }),
    DS(16, 54, 11.2, 2.4, 0.5, BK.cream, { m: 'plain', seg: 12 }),
    B(16, 44, -3.6, 4, 3, 0.8, BK.berry, PL),
    RD([21.5, 40, -6], [24.6, 46, -4], 0.6, BK.steelD, MT), S(24.8, 46.6, -4, 1.2, 1.2, 1.2, BK.cream, { m: 'gloss', seg: 8 }),
    C(16, 7, 3, 5, 4, BK.steelD, { m: 'metal', seg: 14 }),
    LA(16, 9, 3, [[4.6, 0], [6.6, 1.4], [9, 5], [10, 10], [10.4, 15], [10.8, 15.6]], BK.steelL, { m: 'metal', seg: 18 }),
    RG(16, 21, 3, 11, 0.7, BK.steelD, { m: 'metal', flat: true }),
    ...[-1, 1].map(s => RD([16 + s * 10, 21, 0], [16 + s * 5, 24, -8.6], 0.8, BK.steelD, MT)),
    S(16, 24, 3, 8.4, 3.4, 8.4, BK.dough, { m: 'cloth', seg: 12 }),
    RD([16, 48.5, 3], [16, 27, 3], 0.9, BK.steelL, MT), RG(17.6, 29, 3, 1.8, 0.6, BK.steelL, { m: 'metal', a0: Math.PI, arc: Math.PI }),
  ]),

  // a floured butcher-block kneading table: a mound of dough, a rolling pin and bench scraper on top, a flour crock,
  // mixing bowls and a basket of eggs on the shelf below
  piece('baktable', 'Bakery kneading table', 2, 1, 760, 'wood', [
    ...[4, 60].flatMap(x => [-11, 11].map(z => B(x, 13, z, 3.6, 26, 3.6, BK.honeyD, WD))),
    B(32, 6, 0, 58, 1.6, 24, BK.honeyD, WD),
    LA(14, 6.8, 0, [[4.4, 0], [5.4, 4], [5.4, 9], [4.6, 10.4], [4.8, 11]], BK.cream, { m: 'gloss', seg: 14 }),
    C(14, 11.4, 0, 5.5, 2.4, BK.sky, { m: 'plain', seg: 14 }), C(14, 18.4, 0, 4.8, 1, BK.honeyL, { m: 'wood', seg: 12 }),
    LA(33, 6.8, 2, [[3, 0], [6, 2.4], [7, 5]], BK.sky, { m: 'gloss', seg: 14 }), LA(33, 9.4, 2, [[2.6, 0], [5.2, 2.2], [6, 4.4]], BK.cream, { m: 'gloss', seg: 14 }),
    C(50, 10, 2, 6, 6, BK.wicker, { ...WIC, seg: 12 }),
    ...[[47.6, 0], [50.6, 3], [52.6, -1]].map(([x, z]) => S(x, 13.6, 2 + z, 1.6, 2, 1.6, BK.cream, { m: 'gloss', seg: 8 })),
    B(32, 23.8, 0, 60, 5.2, 26, BK.honey, WD),
    B(32, 23.8, 13.2, 20, 3.6, 0.6, BK.honeyL, WD), DS(32, 23.8, 13.6, 0.8, 0.5, BK.brass, { m: 'metal', seg: 8 }),
    B(32, 28, 0, 64, 4, 30, BK.honeyL, { m: 'wood', tex: 'flour' }),
    S(24, 31.4, 1, 8, 2.8, 6.6, BK.dough, { m: 'cloth', seg: 12 }),
    RD([38, 31.6, 7], [56, 31.6, 7], 1.6, BK.honeyL, WD), RD([35, 31.6, 7], [38, 31.6, 7], 0.6, BK.honeyD, WD), RD([56, 31.6, 7], [59, 31.6, 7], 0.6, BK.honeyD, WD),
    B(10, 32.4, -7, 6, 4.4, 0.6, BK.steelL, MT), B(10, 35, -7, 6.4, 1.4, 1.4, BK.honeyD, WD),
    C(52, 33, -7, 1.8, 6, BK.steelL, { m: 'metal', seg: 10 }), S(52, 36.4, -7, 1.8, 1, 1.8, BK.steel, { m: 'metal', seg: 8 }),
  ]),

  // three sacks of flour stacked to sit on, blue-striped sacking, the top one printed with a wheat sheaf and tied off
  // at both ends, a little drift of spilt flour
  piece('bakflour', 'Bakery flour sacks', 1, 1, 280, 'cloth', [
    ...[8.6, 23.4].flatMap(x => [B(x, 6, 0, 15, 12, 28, BK.sack, { m: 'cloth', r: 4.5 }), ...[3.6, 8.4].map(h => B(x, h, 14.05, 13, 1.2, 0.3, BK.sky, PL))]),
    B(16, 17, 1, 26, 10, 16, BK.sack, { m: 'cloth', r: 4 }),
    ...[2.4, 29.6].map(x => S(x, 17, 1, 1.8, 2.8, 2.8, BK.sackD, { m: 'cloth', seg: 8 })),
    ...[4.4, 27.6].map(x => RG(x, 17, 1, 2.6, 0.35, BK.wickerD, { m: 'cloth', flat: true, k: 2 })),
    PC(16, 17, 9.2, 13, 7, flourLabel),
    S(26, 1, 12, 3.4, 1, 2.4, BK.flour, { m: 'plain', seg: 8 }),
  ]),

  // the till counter: honey wood with sky-blue panels and a marble top, a brass cash register with its price flag, a
  // service bell, a tray of cookies and a chocolate cake under a glass dome
  piece('bakcounter', 'Bakery till counter', 2, 1, 1300, 'wood', [
    B(32, 1, 0, 62, 2, 26, BK.honeyD, WD),
    B(32, 16, 0, 62, 28, 26, BK.honey, WD),
    ...[11, 32, 53].flatMap(x => [B(x, 16, 13.3, 17, 20, 0.8, BK.sky, GL), B(x, 16, 13.8, 13, 16, 0.4, BK.skyL, GL)]),
    B(32, 31.6, 0, 64, 3.2, 28, BK.marble, GL),
    B(14, 37.6, -3, 15, 8.8, 12, BK.brass, MT), B(14, 35, 5, 15, 3.6, 4.6, BK.brassD, MT),
    ...[9, 12.4, 15.8, 19.2].map(x => C(x, 37.2, 5, 0.9, 0.8, BK.cream, { m: 'plain', seg: 8 })),
    B(14, 44.2, -6, 11, 4.4, 1.2, BK.cream, PL), PC(14, 44.2, -5.3, 10, 3.6, tillFlag),
    RD([21.6, 38, -3], [23.6, 38, -3], 0.5, BK.steelD, MT), S(23.8, 39.4, -3, 1, 1.4, 1, BK.choc, { m: 'gloss', seg: 8 }),
    LA(33, 33.2, 6, [[3, 0], [3, 0.6], [2.6, 1.4], [1.6, 3.2], [0.4, 3.8], [0.4, 4.6], [0, 5]], BK.brass, { m: 'metal', seg: 12 }),
    B(45, 33.7, 3, 12, 1, 12, BK.steelL, MT),
    ...[[41.6, 0], [45, 0], [48.4, 0], [41.6, 5.6], [45, 5.6], [48.4, 5.6]].map(([x, z]) => C(x, 34.6, z, 1.6, 0.8, BK.crustL, { m: 'plain', seg: 10 })),
    C(56, 33.6, -5, 5.4, 0.8, BK.cream, { m: 'gloss', seg: 14 }), C(56, 36.4, -5, 4, 5, BK.choc, { m: 'plain', seg: 14 }), C(56, 39.2, -5, 4, 0.8, BK.whip, { m: 'plain', seg: 14 }),
    S(56, 40.2, -5, 0.9, 0.9, 0.9, BK.berry, { m: 'gloss', seg: 6 }),
    LA(56, 34, -5, [[5, 0], [5, 4], [4.4, 7], [2.6, 9], [0.8, 10], [0, 10.2]], BK.glass, { m: 'glass', seg: 14, k: 40 }),
    S(56, 44.6, -5, 0.8, 0.8, 0.8, BK.brass, { m: 'metal', seg: 6, k: 41 }),
  ]),

  // a three-tier cream and strawberry cake on a silver stand, pink ruffles round its tiers, Slurpuff sat on the top
  piece('bakcake', 'Bakery Slurpuff cake tower', 1, 1, 900, 'cloth', [
    LA(16, 0, 0, [[7, 0], [7, 0.8], [3, 1.6], [2, 4], [2, 5.4], [13.4, 5.6], [13.4, 6.4]], BK.steelL, { m: 'metal', seg: 16 }),
    C(16, 12.4, 0, 12, 12, BK.cream, { m: 'cloth', seg: 18 }),
    RG(16, 7.2, 0, 12, 0.9, BK.pink, { m: 'cloth', flat: true }), RG(16, 17.8, 0, 12, 0.8, BK.pink, { m: 'cloth', flat: true }),
    C(16, 23.4, 0, 9, 10, BK.pinkL, { m: 'cloth', seg: 16 }),
    RG(16, 19, 0, 9, 0.8, BK.whip, { m: 'cloth', flat: true }), RG(16, 28, 0, 9, 0.7, BK.whip, { m: 'cloth', flat: true }),
    C(16, 32.4, 0, 6, 8, BK.cream, { m: 'cloth', seg: 14 }),
    RG(16, 28.8, 0, 6, 0.7, BK.pink, { m: 'cloth', flat: true }),
    ...[[16, 10.4], [9.4, 7.6], [22.6, 7.6]].map(([x, z]) => S(x, 19.6, z, 1.2, 1.3, 1.2, BK.berry, { m: 'gloss', seg: 6 })),
    ...[[16, 7.4], [11, 5.2], [21, 5.2]].map(([x, z]) => S(x, 29.6, z, 1.1, 1.2, 1.1, BK.berry, { m: 'gloss', seg: 6 })),
    S(16, 41, 0, 4.8, 4.6, 4.4, BK.whip, { m: 'cloth', seg: 12 }),
    S(13, 45.6, -0.4, 2, 1.8, 2, BK.whip, { m: 'cloth', seg: 8 }), S(19, 45.6, -0.4, 2, 1.8, 2, BK.whip, { m: 'cloth', seg: 8 }), S(16, 46.6, -0.8, 2.2, 2, 2, BK.whip, { m: 'cloth', seg: 8 }),
    ...[11.4, 20.6].map(x => S(x, 42, 0, 1.2, 2.2, 1.6, BK.pink, { m: 'cloth', seg: 8 })),
    S(16, 40.8, 4.4, 1.2, 1, 0.8, BK.berry, { m: 'gloss', seg: 6 }),
    ...[13.8, 18.2].map(x => DS(x, 42.8, 3.9, 0.6, 0.3, BK.ink, { m: 'gloss', seg: 6 })),
  ]),

  // a little honey-wood shelf of glass cookie jars (butter cookies, chocolate, pink macarons, lemon drops), a Munchlax
  // cookie jar on top, its head the lid
  piece('bakjars', 'Bakery Munchlax cookie jars', 1, 1, 420, 'wood', [
    ...[2, 30].map(x => B(x, 22.6, 0, 2.4, 45.2, 20, BK.honey, WD)),
    B(16, 22.6, -9.2, 26, 43, 1.4, BK.honeyD, WD),
    ...[1.2, 22.4].map(h => B(16, h, 0, 28, 2, 20, BK.honeyL, WD)), B(16, 44.4, 0, 32, 2, 21, BK.honeyD, WD),
    ...[[2.2, BK.crustL, BK.choc], [23.4, BK.pink, BK.lemon]].flatMap(([h0, c0, c1]) => [[9, c0], [23, c1]].flatMap(([x, c]) => [
      C(x, h0 + 5.2, 1, 4.6, 8.4, c, { m: 'plain', seg: 12 }), C(x, h0 + 6, 1, 5.2, 12, BK.glass, { m: 'glass', seg: 12 }),
      C(x, h0 + 12.6, 1, 4.4, 1.4, BK.sky, { m: 'gloss', seg: 12 }), S(x, h0 + 13.8, 1, 1, 0.8, 1, BK.sky, { m: 'gloss', seg: 6 }),
    ])),
    LA(16, 45.4, 0, [[6, 0], [8.4, 3], [9.4, 8], [8.8, 12.4], [6.6, 15.4], [5, 16]], BK.munch, { m: 'gloss', seg: 16 }),
    DS(16, 51.6, 8.4, 5.2, 0.5, BK.munchC, { m: 'gloss', ry: 5.4, seg: 14 }),
    ...[12, 20].map(x => S(x, 46, 6, 2.4, 1, 2, BK.munchC, { m: 'gloss', seg: 8 })),
    ...[7.4, 24.6].map(x => S(x, 54, 2, 2, 2.6, 2, BK.munch, { m: 'gloss', seg: 8 })),
    S(16, 64, 0, 7.4, 5.6, 6.6, BK.munch, { m: 'gloss', seg: 14 }),
    DS(16, 63, 5.8, 5, 0.5, BK.munchC, { m: 'gloss', ry: 3.6, seg: 14 }),
    PR(11, 67.4, 0, [[-2.4, 0], [2, 0], [-1.6, 5]], 2, BK.munch, GL), PR(21, 67.4, 0, [[-2, 0], [2.4, 0], [1.6, 5]], 2, BK.munch, GL),
    ...[[13, 14.8], [17.2, 19]].map(([a, b]) => RD([a, 63.8, 6.4], [b, 63.8, 6.4], 0.35, BK.ink, PL)),
    RD([15, 61.4, 6.4], [17, 61.4, 6.4], 0.3, BK.ink, PL),
  ]),

  // a hooped honey-wood barrel stood full of baguettes, a chalk price tag on a stick
  piece('bakbarrel', 'Bakery baguette barrel', 1, 1, 360, 'wood', [
    LA(16, 0, 0, [[9.4, 0], [10.6, 5], [11, 10], [10.6, 16], [9.6, 21], [9.6, 22]], BK.honey, { m: 'wood', seg: 16, tex: 'stave', tc: BK.honeyD, ts: 2.4 }),
    RG(16, 3, 0, 10.4, 0.6, BK.iron, { m: 'metal', flat: true }), RG(16, 18.6, 0, 10.2, 0.6, BK.iron, { m: 'metal', flat: true }),
    ...[[10, -3, 7, 50], [13, 3, 11, 54], [16, -5, 15, 57], [19, 2, 20, 53], [22, -2, 25, 49], [15, 5, 13, 47], [20, -6, 22, 55]].map(([x0, z0, x1, h1], i) =>
      RD([x0, 16, z0], [x1, h1, z0 * 0.6], 1.7, i % 2 ? BK.crust : BK.crustL, CL)),
    RD([26, 20, 9], [26, 32, 9], 0.3, BK.honeyD, WD), B(26, 34.4, 9, 7, 4.6, 0.6, BK.chalk, PL), B(26, 34.6, 9.4, 4.6, 0.6, 0.2, BK.cream, PL),
  ]),

  // a three-tier silver tray stand piled with croissants, a ring to carry it by
  piece('bakcroissant', 'Bakery croissant stand', 1, 1, 480, 'metal', [
    LA(16, 0, 0, [[8, 0], [8, 0.8], [3, 1.6], [1.4, 3]], BK.steelD, { m: 'metal', seg: 14 }),
    C(16, 27, 0, 0.8, 52, BK.steel, { m: 'metal', seg: 8 }),
    ...[[8, 13], [22, 10.4], [35, 8]].flatMap(([h, r]) => [C(16, h, 0, r, 1, BK.steelL, { m: 'metal', seg: 18 }), RG(16, h + 0.6, 0, r, 0.5, BK.steelD, { m: 'metal', flat: true })]),
    ...[[8, 5], [16, 7], [24, 5], [11, -4], [21, -4]].map(([x, z], i) => croissant(x, 8.5, z, i % 2 ? BK.crust : BK.crustL)),
    ...[[10.5, 4], [16, 6], [21.5, 4], [16, -4]].map(([x, z], i) => croissant(x, 22.5, z, i % 2 ? BK.crustL : BK.crust)),
    ...[[13, 3], [19, 3], [16, -3]].map(([x, z], i) => croissant(x, 35.5, z, i % 2 ? BK.crust : BK.crustL, 2.4)),
    RG(16, 56, 0, 3, 0.6, BK.steelD, MT),
  ]),

  // a little round marble café table on an iron foot with two bentwood chairs facing over it, two cups of coffee and a
  // croissant on a plate
  piece('bakcafe', 'Bakery café table for two', 2, 1, 820, 'wood', (() => {
    const parts = [
      LA(32, 0, 0, [[8, 0], [8, 0.8], [2.6, 2], [1.4, 3.4]], BK.iron, { m: 'metal', seg: 14 }),
      C(32, 15, 0, 1.2, 25, BK.iron, { m: 'metal', seg: 8 }),
      C(32, 28, 0, 10, 1.6, BK.marble, { m: 'gloss', seg: 18 }),
      ...[[27, 3], [37, -3]].flatMap(([x, z]) => [C(x, 29.1, z, 2.6, 0.6, BK.flour, { m: 'gloss', seg: 12 }), C(x, 31, z, 1.6, 3.2, BK.flour, { m: 'gloss', rb: 1.3, seg: 10 }),
        C(x, 32.5, z, 1.4, 0.2, BK.choc, { m: 'plain', seg: 10 }), RG(x + 1.9, 31, z, 0.9, 0.3, BK.flour, { m: 'gloss', a0: -Math.PI / 2, arc: Math.PI })]),
      C(32, 29.1, 5, 3.4, 0.5, BK.skyL, { m: 'gloss', seg: 12 }), croissant(32, 29.4, 5, BK.crustL, 2.2),
    ];
    for (const [cx, s] of [[11, -1], [53, 1]]) {
      parts.push(...[[-5, -5], [5, -5], [-5, 5], [5, 5]].map(([dx, dz]) => RD([cx + dx * 0.8, 16.4, dz * 0.8], [cx + dx, 0.6, dz], 0.7, BK.honeyD, WD)));
      parts.push(C(cx, 17, 0, 6, 1.6, BK.honey, { m: 'wood', seg: 14 }), C(cx, 18.4, 0, 5.4, 1.2, BK.butter, { m: 'cloth', seg: 14 }));
      const bx = cx + s * 5.6;
      parts.push(...[-4.4, 4.4].map(z => RD([bx, 17, z], [bx + s * 1.4, 38, z], 0.6, BK.honey, WD)));
      parts.push(...[36.6, 30].map(h => RD([bx + s * (h - 17) / 21 * 1.4, h, -4.4], [bx + s * (h - 17) / 21 * 1.4, h, 4.4], 0.8, BK.honey, WD)));
    }
    return parts;
  })()),

  // a bentwood bistro chair: a hooped back with a sky-blue splat, a round seat with a striped butter cushion
  piece('bakchair', 'Bakery bistro chair', 1, 1, 300, 'wood', [
    ...[[-8, -8], [8, -8], [-8, 8], [8, 8]].map(([dx, dz]) => RD([16 + dx * 0.75, 16.6, dz * 0.75], [16 + dx, 0.7, dz], 0.8, BK.honeyD, WD)),
    RG(16, 7, 0, 7.2, 0.5, BK.honeyD, { m: 'wood', flat: true }),
    C(16, 17.4, 0, 9.5, 1.8, BK.honey, { m: 'wood', seg: 16 }),
    C(16, 19, 0.6, 8.6, 1.4, BK.butter, { m: 'cloth', seg: 16, tex: 'check', tc: BK.cream, ts: 1.6 }),
    RD([8.6, 18, -7], [8, 36, -8], 0.8, BK.honey, WD), RD([23.4, 18, -7], [24, 36, -8], 0.8, BK.honey, WD),
    RG(16, 36, -8, 8, 0.9, BK.honey, { m: 'wood', a0: 0, arc: Math.PI }),
    B(16, 31, -7.6, 7, 12, 1, BK.sky, GL), DS(16, 32.4, -7, 1.6, 0.4, BK.cream, { m: 'plain', seg: 10 }),
  ]),

  // a honey-wood window bench with storage under a striped butter cushion, sky-blue panels, two pillows and a basket of
  // bread on the end
  piece('bakbench', 'Bakery window bench', 2, 1, 680, 'wood', [
    B(32, 0.6, 2, 60, 1.2, 21, BK.honeyD, WD),
    B(32, 8, 2, 62, 14, 22, BK.honey, WD),
    ...[17, 47].flatMap(x => [B(x, 8, 13.3, 26, 9, 0.8, BK.sky, GL), DS(x, 8, 13.9, 0.8, 0.5, BK.brass, { m: 'metal', seg: 8 })]),
    B(32, 16.6, 2, 60, 3.2, 21, BK.butter, { m: 'cloth', tex: 'stripe', tc: BK.cream, ts: 3, r: 1.4 }),
    B(32, 28, -10.6, 62, 24, 2.4, BK.honey, WD), B(32, 39.6, -10.6, 64, 2, 3.2, BK.honeyD, WD),
    B(32, 30, -9.2, 52, 3, 0.6, BK.sky, PL),
    ...[2, 62].map(x => B(x, 22, 1, 3, 12, 22, BK.honey, WD)),
    S(12, 23.6, -6.4, 6.4, 5.4, 2.6, BK.sky, { m: 'cloth', seg: 12 }), S(24, 23.4, -6.4, 5.4, 5, 2.4, BK.flour, { m: 'cloth', seg: 12 }),
    C(52, 21.6, 3, 5, 6.6, BK.wicker, { ...WIC, seg: 12 }),
    RD([50, 22, 3], [47.6, 32, 0], 1.4, BK.crustL, CL), RD([54, 22, 3], [56, 30.6, 1], 1.4, BK.crust, CL),
    S(52, 25.2, 5, 3.6, 2, 2.4, BK.crust, LOAF),
  ]),

  // a chalkboard menu in a honey frame, hung from a cord: MENU and four bakes with their prices
  wallPiece('bakmenu', 'Bakery menu board', 2, 380, 'wood', [
    B(32, 58, 1, 50, 32, 2, BK.honey, WD),
    B(32, 58, 1.8, 45, 27, 0.6, BK.chalk, PL), PC(32, 58, 2.2, 45, 27, menuPic),
    B(32, 41.6, 2.6, 36, 1.2, 3.2, BK.honeyD, WD), B(26, 42.6, 2.8, 4, 0.8, 0.8, BK.flour, PL), B(36, 42.6, 2.8, 3, 0.8, 0.8, BK.pink, PL),
    RD([16, 74, 1], [32, 82, 1], 0.3, BK.iron, MT), RD([48, 74, 1], [32, 82, 1], 0.3, BK.iron, MT), DS(32, 82, 1, 0.8, 0.6, BK.iron, { m: 'metal', seg: 8 }),
  ]),

  // a sky-blue and cream striped awning sloping out from the wall, its scalloped valance, iron brackets beneath
  wallPiece('bakawning', 'Bakery striped awning', 2, 460, 'cloth', (() => {
    const n = 14, s = 62 / n, parts = [
      ...[6, 58].map(x => RD([x, 72, 0.5], [x, 65, 13], 0.4, BK.iron, { m: 'metal', k: -1 })),
      WG(32, 0, 0, 62, [[0, 80], [0, 78.4], [14, 64.4], [14, 66]], BK.sky, { m: 'cloth', k: 0 }),
      B(32, 62.6, 14.3, 62, 4.6, 0.6, BK.sky, { m: 'cloth', r: 0.3, k: 14.3 }),
    ];
    for (let i = 0; i < n; i++) {
      const x = 1 + s * (i + 0.5), c = i % 2 ? BK.cream : BK.sky;
      if (i % 2) parts.push(WG(x, 0, 0, s, [[0, 80.15], [0, 78.55], [14, 64.55], [14, 66.15]], BK.cream, { m: 'cloth', k: 0.5 }), B(x, 62.6, 14.65, s, 4.6, 0.1, BK.cream, { m: 'cloth', r: 0, k: 14.6 }));
      parts.push(DS(x, 60.3, 14.3, s / 2, 0.5, c, { m: 'cloth', seg: 12, k: 14 }));
    }
    return parts;
  })()),

  // a pie for a clock: a crimped golden crust in its tin, a lattice over berry filling, a cream dial in the middle
  wallPiece('bakclock', 'Bakery pie clock', 1, 520, 'cloth', [
    DS(16, 60, 0.8, 13, 1.6, BK.steelD, { m: 'metal', seg: 20 }),
    DS(16, 60, 1.8, 10, 1.4, BK.berry, { m: 'plain', seg: 18 }),
    PC(16, 60, 2.6, 14, 14, pieDial),
    RG(16, 60, 2, 11.4, 1.8, BK.crustL, { m: 'cloth' }),
    ...Array.from({ length: 12 }, (_, i) => { const a = i / 12 * TAU; return S(16 + Math.cos(a) * 11.4, 60 + Math.sin(a) * 11.4, 3.2, 1.3, 1.3, 1, BK.crustL, { m: 'cloth', seg: 6 }); }),
    RG(16, 74.6, 0.8, 1.6, 0.4, BK.iron, MT),
  ]),

  // the shop's sign: Dachsbun the bread dog between two wheat sheaves under BAKERY, hung on chains from an iron bar
  // with a bunch of wheat tied on top
  wallPiece('baksign', 'Bakery Dachsbun sign', 1, 440, 'wood', [
    RD([3, 76, 1.4], [29, 76, 1.4], 0.6, BK.iron, MT), ...[2.4, 29.6].map(x => S(x, 76, 1.4, 1, 1, 1, BK.iron, { m: 'metal', seg: 8 })),
    ...[7, 25].map(x => RD([x, 75.4, 1.4], [x, 70, 1.4], 0.3, BK.iron, MT)),
    B(16, 57, 1.4, 28, 26, 1.6, BK.honey, WD),
    PC(16, 57, 2.4, 25, 23, signPic),
    ...[[12, 84], [16, 86], [20, 84]].flatMap(([x, h]) => [RD([16, 72.6, 1], [x, h - 2, 1], 0.35, BK.butterD, CL), S(x + (x - 16) * 0.12, h, 1, 0.9, 2, 0.9, BK.butterD, { m: 'cloth', seg: 6 })]),
    RD([14.6, 76, 2.4], [17.4, 76, 2.4], 0.6, BK.sky, CL),
  ]),

  // a lamp on a turned honey-wood post with a little tray of rolls halfway up, a sky-blue enamel bell shade lit warm
  piece('baklamp', 'Bakery bell lamp', 1, 1, 420, 'wood', [
    LA(16, 0, 0, [[8, 0], [8, 1], [6.4, 2.4], [3, 3.4], [2, 4.6]], BK.honeyD, { m: 'wood', seg: 14 }),
    C(16, 30, 0, 1.4, 52, BK.honey, { m: 'wood', seg: 10 }),
    ...[12, 44].map(h => C(16, h, 0, 2.2, 1.6, BK.honeyD, { m: 'wood', seg: 10 })),
    C(16, 30, 0, 9, 1.2, BK.honeyL, { m: 'wood', seg: 16 }), RG(16, 30.8, 0, 9, 0.5, BK.honeyD, { m: 'wood', flat: true }),
    S(12, 32, 3, 2.6, 1.8, 2.4, BK.bun, { m: 'cloth', seg: 8 }), S(19.6, 32, 2, 2.6, 1.8, 2.4, BK.crustL, { m: 'cloth', seg: 8 }), S(16, 32.2, -4, 2.6, 1.8, 2.4, BK.bun, { m: 'cloth', seg: 8 }),
    S(16, 55, 0, 3.2, 3.2, 3.2, BK.glow, { m: 'glow', seg: 10 }),
    LA(16, 56, 0, [[10, 0], [9.6, 0.6], [7.6, 3], [5, 6.8], [3.4, 9.4], [1.6, 10.4], [0, 10.6]], BK.sky, { m: 'gloss', seg: 18 }),
    RG(16, 56.2, 0, 10, 0.5, BK.cream, { m: 'gloss', flat: true }),
    S(16, 67.4, 0, 1.2, 1.2, 1.2, BK.brass, { m: 'metal', seg: 8 }),
  ], { glow: [BK.glow] }),

  // a checked butter-and-cream rug in a sky-blue scalloped border, a croissant and wheat in the middle
  { id: 'bakrug', name: 'Bakery checked rug', group: GROUP, solo: true, w: 3, h: 2, layer: 'rug', price: 720, high: 0.03, side: 'c', flat() {
    const g = ctx();
    g.fillStyle = BK.skyD; g.beginPath(); g.roundRect(0, 1, 96, 62, 3); g.fill();
    g.fillStyle = BK.cream; g.fillRect(5, 6, 86, 52);
    g.fillStyle = BK.butter;
    for (let i = 0; i < 11; i++) for (let j = 0; j < 7; j++) if ((i + j) % 2 === 0) g.fillRect(5 + i * 86 / 11, 6 + j * 52 / 7, 86 / 11, 52 / 7);
    g.fillStyle = BK.flour;
    for (let x = 4; x < 94; x += 4) { g.beginPath(); g.arc(x, 3.4, 1.2, 0, TAU); g.fill(); g.beginPath(); g.arc(x, 60.6, 1.2, 0, TAU); g.fill(); }
    for (let y = 7; y < 58; y += 4) { g.beginPath(); g.arc(2.4, y, 1.2, 0, TAU); g.fill(); g.beginPath(); g.arc(93.6, y, 1.2, 0, TAU); g.fill(); }
    g.fillStyle = BK.sky; g.beginPath(); g.ellipse(48, 32, 16, 12, 0, 0, TAU); g.fill();
    g.strokeStyle = BK.flour; g.lineWidth = 0.8; g.beginPath(); g.ellipse(48, 32, 14.4, 10.4, 0, 0, TAU); g.stroke();
    wheat(g, 38, 40, 14, BK.butter, BK.flour); wheat(g, 58, 40, 14, BK.butter, BK.flour);
    g.lineCap = 'round'; g.strokeStyle = BK.crustD; g.lineWidth = 5.6; g.beginPath(); g.arc(48, 36, 6, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
    g.strokeStyle = BK.crustL; g.lineWidth = 4.4; g.beginPath(); g.arc(48, 36, 6, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
    g.strokeStyle = BK.crustD; g.lineWidth = 0.4;
    for (const a of [1.3, 1.5, 1.7]) { g.beginPath(); g.moveTo(48 + Math.cos(a * Math.PI) * 4, 36 + Math.sin(a * Math.PI) * 4); g.lineTo(48 + Math.cos(a * Math.PI) * 8, 36 + Math.sin(a * Math.PI) * 8); g.stroke(); }
  } },

  // a bread slicer on a honey cabinet: a steel housing with its blade slots, a loaf on the infeed tray, a lever on its
  // side and a sky-blue hopper
  piece('bakslicer', 'Bakery bread slicer', 1, 1, 640, 'metal', [
    B(16, 0.6, 0, 26, 1.2, 25, BK.honeyD, WD),
    B(16, 12.5, 0, 28, 23, 26, BK.honey, WD),
    B(16, 12.5, 13.3, 22, 17, 0.8, BK.sky, GL), DS(24, 12.5, 13.9, 0.8, 0.5, BK.brass, { m: 'metal', seg: 8 }),
    B(16, 25, 0, 30, 2, 28, BK.steelD, MT),
    B(16, 39, -4, 26, 26, 18, BK.steelL, MT),
    B(16, 53.4, -4, 24, 3, 16, BK.sky, GL),
    B(16, 36, 5.2, 20, 12, 0.6, BK.ink, PL),
    ...[8.4, 11.4, 14.4, 17.4, 20.4, 23.4].map(x => B(x, 36, 5.6, 0.5, 11, 0.3, BK.steelL, MT)),
    B(16, 47, 5.2, 12, 3, 0.4, BK.sky, PL),
    B(16, 27.6, 9, 24, 1.2, 8, BK.steelD, MT),
    S(16, 31.4, 8.4, 9, 3.8, 4, BK.crust, LOAF),
    RD([29.4, 36, -4], [30.2, 46, -4], 0.7, BK.steelD, MT), S(30.2, 46.6, -4, 1.2, 1.2, 1.2, BK.berry, { m: 'gloss', seg: 8 }),
  ]),

  // a sky-blue delivery bicycle: a wicker basket of baguettes and loaves under a gingham cloth on the front, a crate of
  // buns on the rear rack, its kickstand down
  piece('bakbike', 'Bakery delivery bicycle', 2, 1, 1100, 'gloss', (() => {
    const parts = [];
    for (const x of [12, 51]) {
      parts.push(RG(x, 11, 0, 10, 1, BK.ink, GL), RG(x, 11, 0, 9, 0.4, BK.steelL, MT), DS(x, 11, 0, 1.6, 2.4, BK.steelD, { m: 'metal', seg: 10 }));
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2, c = Math.cos(a), s = Math.sin(a); parts.push(RD([x + c * 1.6, 11 + s * 1.6, 0], [x + c * 8.6, 11 + s * 8.6, 0], 0.25, BK.steelL, MT)); }
      parts.push(RG(x, 11, 0, 11.6, 0.6, BK.sky, { m: 'gloss', a0: 0.45, arc: 2.25 }));
    }
    const R = [12, 11, 0], BB = [28, 10, 0], ST = [25, 30, 0], H = [45, 32, 0], Hb = [46, 26, 0], F = [51, 11, 0];
    parts.push(RD(R, BB, 0.8, BK.sky, GL), RD(R, [25.4, 27, 0], 0.8, BK.sky, GL), RD(BB, ST, 1, BK.sky, GL), RD([25.4, 27.4, 0], [45.4, 29.4, 0], 1, BK.sky, GL),
      RD(BB, Hb, 1, BK.sky, GL), RD(Hb, H, 1.1, BK.sky, GL), RD(Hb, F, 0.8, BK.sky, GL));
    parts.push(RG(28, 10, 1.4, 3, 0.5, BK.steelD, MT), RD([12, 11, 1.4], [28, 10, 1.4], 0.3, BK.steelD, MT),
      RD([28, 10, 1.6], [30, 6, 3.6], 0.4, BK.steelD, MT), B(30, 6, 4.6, 3, 0.8, 2.4, BK.ink, PL));
    parts.push(RD(ST, [24.6, 33, 0], 0.6, BK.steelD, MT), S(23.6, 34, 0, 4.4, 1.4, 2.4, BK.leather, { m: 'gloss', seg: 10 }));
    parts.push(RD(H, [44, 36, 0], 0.6, BK.steelD, MT), RD([43.6, 36, -7], [43.6, 36, 7], 0.6, BK.steelD, MT), ...[-7, 7].map(z => RD([43.6, 36, z], [41.6, 36.4, z * 1.15], 0.8, BK.cream, PL)));
    parts.push(...[-3, 3].map(z => RD([51, 11, z * 0.4], [57, 29.6, z], 0.4, BK.steelD, MT)), RD([46, 28, 0], [52, 29.6, 0], 0.5, BK.steelD, MT));
    parts.push(B(53, 34, 0, 15, 9, 13, BK.wicker, WIC));
    parts.push(RD([50, 33, -2], [46.4, 47, -4], 1.5, BK.crustL, CL), RD([54, 33, 1], [52.6, 49, 2], 1.5, BK.crust, CL),
      S(57, 39.4, 2, 3.6, 2.4, 3, BK.crust, LOAF), S(49.6, 39.6, 3, 3.2, 2.2, 2.6, BK.bun, { m: 'cloth', seg: 8 }));
    parts.push(B(53, 37.6, 6.9, 15.4, 3.4, 0.5, BK.red, { m: 'cloth', tex: 'check', tc: BK.flour, ts: 1.2, r: 0.3 }));
    parts.push(...[-3, 3].map(z => RD([12, 11, z * 0.4], [9, 22.4, z], 0.4, BK.steelD, MT)), RD([16, 22, 0], [25.4, 27, 0], 0.4, BK.steelD, MT));
    parts.push(B(8.6, 26, 0, 12, 7, 12, BK.honey, WD), B(8.6, 26, 6.1, 10, 1.4, 0.3, BK.honeyD, WD),
      ...[[5.4, 2], [11.4, 2], [8.4, -3]].map(([x, z]) => S(x, 30.2, z, 2.6, 1.8, 2.4, BK.bun, { m: 'cloth', seg: 8 })));
    parts.push(RD([28, 10, -1], [25.6, 0.4, -6], 0.4, BK.steelD, MT));
    return parts;
  })()),

  // a cone of cupcakes on three plates, pink, mint and lemon cases, and Alcremie on top with her strawberry
  piece('bakcupcake', 'Bakery Alcremie cupcake tower', 1, 1, 560, 'cloth', [
    C(16, 0.4, 0, 6, 0.8, BK.sky, { m: 'gloss', seg: 14 }),
    ...[[1.2, 13], [13, 10], [24.4, 7]].map(([h, r]) => C(16, h, 0, r, 0.8, BK.flour, { m: 'gloss', seg: 18 })),
    C(16, 7, 0, 1, 11.4, BK.sky, { m: 'gloss', seg: 8 }), C(16, 18.7, 0, 1, 11, BK.sky, { m: 'gloss', seg: 8 }),
    ...[[16, 9, 0], [8, 5.6, 1], [24, 5.6, 2], [7.6, -4, 2], [24.4, -4, 0], [16, -8.4, 1]].flatMap(([x, z, i]) => cupcake(x, 1.6, z, [BK.pink, BK.mint, BK.lemon][i], [BK.pinkL, BK.whip, BK.choc][(i + 1) % 3])),
    ...[[16, 6.4, 1], [10.4, 3, 2], [21.6, 3, 0], [16, -5, 2]].flatMap(([x, z, i]) => cupcake(x, 13.4, z, [BK.pink, BK.mint, BK.lemon][i], [BK.whip, BK.pinkL, BK.choc][i])),
    S(16, 29.4, 0, 4.8, 4.6, 4.4, BK.whip, { m: 'cloth', seg: 12 }),
    LA(16, 32.4, 0, [[4.4, 0], [4, 1.4], [3, 3], [1.6, 5], [0.4, 6.6], [0, 7]], BK.whip, { m: 'cloth', seg: 12 }),
    S(16, 40.4, 0, 1.6, 1.8, 1.6, BK.berry, { m: 'gloss', seg: 8 }), PR(16, 41.8, 0, [[-1.6, 0], [1.6, 0], [0, 1.2]], 0.6, BK.mint, PL),
    ...[14, 18].map(x => DS(x, 30.4, 4.2, 0.6, 0.3, BK.ink, { m: 'gloss', seg: 6 })),
    ...[12.4, 19.6].map(x => DS(x, 29, 3.8, 0.8, 0.3, BK.pink, { m: 'plain', seg: 6 })),
    ...[11.2, 20.8].map(x => S(x, 28, 1.6, 1.6, 1.4, 1.4, BK.whip, { m: 'cloth', seg: 8 })),
  ]),

  // a honey stool with a sky-blue mixing bowl of dough, a gingham tea towel over its rim, and Fidough the dough puppy
  // popping out of it
  piece('bakfidough', 'Bakery Fidough dough bowl', 1, 1, 520, 'cloth', [
    ...[[-6, -6], [6, -6], [-6, 6], [6, 6]].map(([dx, dz]) => RD([16 + dx, 13, dz], [16 + dx * 1.5, 0.5, dz * 1.5], 0.9, BK.honeyD, WD)),
    C(16, 13.6, 0, 9, 1.8, BK.honey, { m: 'wood', seg: 16 }),
    LA(16, 14.5, 0, [[5, 0], [5.4, 0.8], [9, 3.4], [11.4, 8], [12.2, 12], [12.4, 12.6]], BK.sky, { m: 'gloss', seg: 18 }),
    RG(16, 25.4, 0, 12.3, 0.5, BK.flour, { m: 'gloss', flat: true }),
    S(16, 26.6, 0, 10.6, 2, 10.6, BK.dough, { m: 'cloth', seg: 12 }),
    B(9, 22.6, 9.8, 6, 8, 0.6, BK.red, { m: 'cloth', tex: 'check', tc: BK.flour, ts: 1.2, r: 0.4 }),
    S(16, 33.4, 1, 6.8, 5.8, 6, BK.fido, { m: 'cloth', seg: 14 }),
    S(16, 39.2, -0.6, 3.4, 2, 3, BK.fidoD, { m: 'cloth', seg: 10 }),
    ...[9.2, 22.8].map(x => S(x, 32, 1.2, 2, 4.2, 2.4, BK.fidoD, { m: 'cloth', seg: 8 })),
    S(16, 31.6, 5.6, 3, 2, 1.6, BK.flour, { m: 'cloth', seg: 10 }),
    S(16, 32.6, 7, 1, 0.8, 0.6, BK.ink, { m: 'gloss', seg: 6 }), S(16, 30.2, 6.8, 0.8, 0.6, 0.4, BK.pink, { m: 'plain', seg: 6 }),
    ...[13, 19].map(x => DS(x, 35, 6, 0.8, 0.4, BK.ink, { m: 'gloss', seg: 8 })),
    ...[11.4, 20.6].map(x => S(x, 27.8, 9.4, 1.8, 1.3, 1.8, BK.fido, { m: 'cloth', seg: 8 })),
  ]),
];
