/* base-furniture-salon.js  -  the Salon set (furniture expansion session j, 2026-10-17): a whole room of a chic boutique
   hair salon that grooms Pokémon too, as Animal Crossing's Happy Home Paradise does a room type. Blush pink, white,
   black and gold, chrome where it pumps and swivels, mirrors framed in bulbs that light. A hydraulic styling chair (it
   swivels when tapped), a styling station, a shampoo basin, a hood dryer (it whirrs), a manicure table under its lamp, a
   towel steamer (it steams), a product shelf, a reception desk with its bell, a waiting sofa, a magazine table, a tool
   trolley, a barber pole whose stripes spin, a mannequin's wig stand, a price list and a hair-dye chart. Furfrou is the
   heart of it: a trimming table with a shaggy Furfrou on it, a board of all nine trims, three hedge topiaries cut to
   the Heart, Star and Diamond trims, a La Reine Furfrou on its velvet cushion and a gold Pharaoh Furfrou statue.
   Sylveon heads the price list, Jynx is on the magazine's cover and Smoochum sits on the reception desk for the other
   Pokémon touches. All solo, fixed colours, sold all year.
   An upright piece is a list of parts in painted units (32 a tile), as in js/base-furniture-ramen.js: `x` across from
   the left of its front, `h` up from the floor (a wall piece's from the foot of its strip), `z` out to the front from
   its middle (a wall piece's from the wall). They're painted here from any side, and js/base-models-salon.js builds the
   same list as 3D parts (BUILT), so picture and model agree. `tex` is painted only (the model stays plain colour):
   `stripe` a barber pole's red and blue bands, `leafy` a clipped hedge's leaves, `nemes` a headdress's gold stripes,
   `quilt` a tufted cushion's diamonds. A `spin` part (the barber pole's striped core) turns on its own in the model. A
   `pic` part (the signs, the price list, the magazine's cover, the trims board, the mirror's glass) is painted on the
   front only, and the model wears that crop of the painting. The floor mat is painted from above (RUG). */

import { sh, oval, ovalShade, floorShadow, ctx, hash, glass as glassPane } from './base-paint.js';

export const SL = {
  blush: '#f2c4cc', blushL: '#f9dfe3', blushD: '#d996a3', rose: '#c4607a', roseD: '#8e3a52',
  white: '#f7f3f0', whiteD: '#ddd5d0', marble: '#ece6e4', black: '#1f1b1e', blackL: '#3b3539',
  gold: '#d4a73c', goldL: '#f0cf72', goldD: '#9c7424', chrome: '#c3c8cc', chromeL: '#e6eaec', chromeD: '#7f868c',
  mirror: '#cfe3ec', mirrorD: '#a8c4d2', bulb: '#fff2c4', red: '#d0303a', blue: '#2f5fb8', barbicide: '#3aa6c8',
  fur: '#f5f2ed', furD: '#ddd7cf', furSkin: '#4d4450', furEye: '#4a90d0',
  hedge: '#4c8a3a', hedgeL: '#74b058', hedgeD: '#33652a', soil: '#3b2a20', lapis: '#28479a',
  green: '#3f7a3a', greenL: '#7aa860', skin: '#f2dcd0',
  syl: '#f6f1ea', sylP: '#f39ab8', sylB: '#6cc4e8', jynx: '#5a3a86', jynxH: '#f2c43c', jynxR: '#cc2a34', lips: '#ec5a8a',
  smoo: '#f4b2c2', smooH: '#f6d64a', smooR: '#d63444',
  dyes: ['#1c1816', '#4a2c1c', '#7a4424', '#9c3a24', '#c86a30', '#e8c070', '#f2e6c8', '#f4a6c0', '#c4607a', '#b49ad8', '#4a78c8', '#2a9a9a', '#8ad0b4', '#c0c4c8', '#d8303a', '#d4a73c'],
};
const GROUP = 'Salon';
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
const LF = { m: 'cloth', tex: 'leafy' };

/** Outlines about a middle x, from h 0 up: a heart, a five-pointed star and a diamond, s across. */
const heartPts = (s) => Array.from({ length: 16 }, (_, i) => { const t = i / 16 * TAU; return [s * Math.pow(Math.sin(t), 3) * 0.5, s * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t) + 17) / 30]; });
const starPts = (s) => Array.from({ length: 10 }, (_, i) => { const a = Math.PI / 2 + i / 10 * TAU, r = i % 2 ? s * 0.21 : s * 0.5; return [Math.cos(a) * r, s * 0.42 + Math.sin(a) * r]; });
const diamondPts = (s) => [[0, 0], [s * 0.38, s * 0.5], [0, s], [-s * 0.38, s * 0.5]];

/** Furfrou standing at x, h (its paws), z, scale s, facing the front: dark legs, face and snout, its fur in `fur` (white,
    a hedge's green, a statue's gold), trimmed by `trim`: `shag` the natural coat, a `top` shape (heart, star, diamond or
    a stacked bouffant) for its topknot and `emb` an emblem on its chest in `embC`, poodle cuffs on its ankles. */
function furfrou(x, h, z, s, { fur = SL.fur, skin = SL.furSkin, m = 'cloth', face = true, shag = false, top, topC, emb, embC, cuffs = !shag, tex } = {}) {
  const F = { m, ...(tex ? { tex } : {}) }, K = { m: m === 'cloth' ? 'cloth' : m };
  const o = (q) => ({ ...F, ...q });
  const parts = [
    ...[-1, 1].flatMap(sg => [
      C(x + sg * 3.6 * s, h + 3.5 * s, z + 4 * s, 1.3 * s, 7 * s, skin, { ...K, seg: 8 }),
      C(x + sg * 4.2 * s, h + 3.5 * s, z - 6 * s, 1.3 * s, 7 * s, skin, { ...K, seg: 8 }),
      S(x + sg * 3.9 * s, h + 18 * s, z + 4.4 * s, (shag ? 2 : 1.6) * s, (shag ? 4.4 : 3.6) * s, 1.6 * s, fur, o({ seg: 8 })),
    ]),
    S(x, h + 11.5 * s, z - 1.5 * s, (shag ? 8 : 6.4) * s, (shag ? 6.6 : 5.2) * s, (shag ? 10 : 9) * s, fur, o({ seg: 12 })),
    S(x, h + 12.5 * s, z + 4.4 * s, (shag ? 6.2 : 5) * s, (shag ? 6 : 5.2) * s, 3.4 * s, fur, o({ seg: 10 })),
    S(x, h + 15.6 * s, z - 10 * s, 2.4 * s, 2.6 * s, 2.4 * s, fur, o({ seg: 8 })),
    S(x, h + 19 * s, z + 5.4 * s, 3.4 * s, 3.6 * s, 3.2 * s, skin, { ...K, seg: 10 }),
    S(x, h + 17.4 * s, z + 7.9 * s, 1.7 * s, 1.3 * s, 1.6 * s, skin, { ...K, seg: 8 }),
  ];
  if (cuffs) parts.push(...[-1, 1].flatMap(sg => [S(x + sg * 3.6 * s, h + 2.2 * s, z + 4 * s, 1.9 * s, 1.5 * s, 1.9 * s, fur, o({ seg: 8 })), S(x + sg * 4.2 * s, h + 2.2 * s, z - 6 * s, 1.9 * s, 1.5 * s, 1.9 * s, fur, o({ seg: 8 }))]));
  if (shag) parts.push(...[-1, 1].map(sg => S(x + sg * 5.6 * s, h + 8 * s, z + 2 * s, 2.6 * s, 3.2 * s, 2.6 * s, fur, o({ seg: 8 }))));
  if (face) parts.push(
    DS(x, h + 17.9 * s, z + 9.5 * s, 0.6 * s, 0.3 * s, SL.black, { m: 'gloss', seg: 6 }),
    ...[-1, 1].map(sg => DS(x + sg * 1.35 * s, h + 19.8 * s, z + 8.3 * s, 0.75 * s, 0.3 * s, SL.furEye, { m: 'gloss', seg: 8 })),
  );
  const tc = topC ?? fur, tz = z + 4 * s;
  if (top === 'heart') parts.push(PR(x, h + 20.6 * s, tz, heartPts(8 * s), 3.6 * s, tc, o()));
  else if (top === 'star') parts.push(PR(x, h + 20.2 * s, tz, starPts(9.4 * s), 3.6 * s, tc, o()));
  else if (top === 'diamond') parts.push(PR(x, h + 20.6 * s, tz, diamondPts(8.4 * s), 3.6 * s, tc, o()));
  else if (top === 'bouffant') parts.push(S(x, h + 22.6 * s, z + 4.2 * s, 4.4 * s, 3 * s, 3.8 * s, tc, o({ seg: 10 })), S(x, h + 25.8 * s, z + 3.8 * s, 3.4 * s, 2.6 * s, 3 * s, tc, o({ seg: 10 })), S(x, h + 28.2 * s, z + 3.4 * s, 2.2 * s, 1.8 * s, 2 * s, tc, o({ seg: 8 })));
  else parts.push(S(x, h + 22.2 * s, z + 4.4 * s, (shag ? 4.8 : 4.2) * s, (shag ? 3 : 2.6) * s, 3.6 * s, tc, o({ seg: 10 })));
  if (emb) {
    const p = emb === 'heart' ? heartPts(5 * s) : emb === 'star' ? starPts(5.6 * s) : diamondPts(5.6 * s);
    parts.push(PR(x, h + 9.6 * s, z + 7.4 * s, p, 1.2 * s, embC, { m: 'gloss' }));
  }
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

/** The painted-only surface of a part (`tex`), inside its outline `path` over bounds bb. */
function texture(q, path, bb) {
  const g = ctx(), [x0, y0, x1, y1] = bb, c = q.c, seed = Math.round(q.x * 7 + q.h * 13 + q.z * 3);
  g.save(); g.clip(path);
  if (q.tex === 'stripe') {
    const bands = [SL.red, SL.white, SL.blue, SL.white], bw = 1.8, n = Math.ceil((x1 - x0 + y1 - y0) / bw) + 4;
    for (let i = 0; i < n; i++) {
      const a = y0 + (i - 2) * bw;
      g.fillStyle = bands[i % 4]; g.beginPath(); g.moveTo(x0, a); g.lineTo(x1, a - (x1 - x0) * 0.7); g.lineTo(x1, a - (x1 - x0) * 0.7 + bw); g.lineTo(x0, a + bw); g.closePath(); g.fill();
    }
    const l = g.createLinearGradient(x0, 0, x1, 0);
    l.addColorStop(0, 'rgba(0,0,0,0.3)'); l.addColorStop(0.3, 'rgba(255,255,255,0.25)'); l.addColorStop(0.6, 'rgba(0,0,0,0)'); l.addColorStop(1, 'rgba(0,0,0,0.35)');
    g.fillStyle = l; g.fillRect(x0, y0, x1 - x0, y1 - y0);
  } else if (q.tex === 'leafy') {
    for (let i = 0; i < (x1 - x0) * (y1 - y0) * 0.5; i++) {
      const px = x0 + hash(i, seed, 1) * (x1 - x0), py = y0 + hash(i, seed, 2) * (y1 - y0), v = hash(i, seed, 3);
      g.globalAlpha = 0.6; oval(px, py, 0.7, 0.45, v < 0.4 ? SL.hedgeD : v < 0.75 ? SL.hedgeL : sh(c, 1));
    }
  } else if (q.tex === 'nemes') {
    g.fillStyle = SL.gold;
    for (let y = y0 + 0.6; y < y1; y += 1.8) g.fillRect(x0, y, x1 - x0, 0.7);
  } else if (q.tex === 'quilt') {
    g.globalAlpha = 0.45; g.strokeStyle = sh(c, -2); g.lineWidth = 0.3; g.beginPath();
    for (let d = -(y1 - y0); d < x1 - x0; d += 4) { g.moveTo(x0 + d, y0); g.lineTo(x0 + d + (y1 - y0), y1); g.moveTo(x0 + d, y1); g.lineTo(x0 + d + (y1 - y0), y0); }
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
      case 'cyl': {
        const rb = q.rb ?? q.r, top = cy - q.hh / 2, bot = cy + q.hh / 2, pts = [[cx - q.r, top], [cx + q.r, top], [cx + rb, bot], [cx - rb, bot]];
        poly(pts, q.c, m, m !== 'glow');
        if (q.tex) texture(q, polyPath(pts), bounds(pts));
        if (m !== 'glass' && !q.tex) oval(cx, top, q.r, Math.min(q.r * 0.22, Math.max(0.3, q.hh / 2)), sh(q.c, m === 'glow' ? 2 : 1));
        break;
      }
      case 'ball': {
        const rx = side ? q.rz : q.rx; ball(cx, cy, rx, q.ry, q.c, m);
        if (q.tex) { const p = new Path2D(); p.ellipse(cx, cy, rx, q.ry, 0, 0, TAU); texture(q, p, [cx - rx, cy - q.ry, cx + rx, cy + q.ry]); }
        break;
      }
      case 'disc': if (side) rbx(cx - q.th / 2, cy - (q.ry ?? q.r), q.th, (q.ry ?? q.r) * 2, q.th / 2, q.c, m); else ball(cx, cy, q.r, q.ry ?? q.r, q.c, m); break;
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

const SANS = 'Arial Black, Arial, sans-serif', SERIF = 'Georgia, "Times New Roman", serif';
/** A word across a painted box: letters in fg over bg (none for clear), bold sans or an italic serif. */
const word = (text, fg, bg, k = 0.82, font = SANS) => (g, x, y, w, h) => {
  if (bg) { g.fillStyle = bg; g.fillRect(x, y, w, h); }
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = font === SERIF ? `italic bold ${h * k}px ${SERIF}` : `bold ${h * k}px ${SANS}`; g.fillText(text, x + w / 2, y + h * 0.54, w * 0.94);
};

/** A mirror's glass: pale blue, darker to the foot, two white glints across it. */
function glassPic(g, x, y, w, h) {
  const l = g.createLinearGradient(x, y, x + w * 0.4, y + h);
  l.addColorStop(0, '#eef6fa'); l.addColorStop(0.5, SL.mirror); l.addColorStop(1, SL.mirrorD);
  g.fillStyle = l; g.fillRect(x, y, w, h);
  g.fillStyle = 'rgba(255,255,255,0.65)';
  for (const [a, t] of [[0.15, 0.16], [0.42, 0.06]]) { g.beginPath(); g.moveTo(x + w * a, y + h); g.lineTo(x + w * (a + t), y + h); g.lineTo(x + w * (a + t + 0.5), y); g.lineTo(x + w * (a + 0.5), y); g.closePath(); g.fill(); }
}

/** Sylveon's head about cx, cy, s across: cream, pink ears lined blue, blue eyes, a pink bow with a blue middle. */
function sylveon(g, cx, cy, s) {
  g.strokeStyle = SL.black; g.lineWidth = s * 0.03;
  for (const sg of [-1, 1]) {
    g.fillStyle = SL.sylP; g.beginPath(); g.moveTo(cx + sg * s * 0.18, cy - s * 0.12); g.lineTo(cx + sg * s * 0.5, cy - s * 0.5); g.lineTo(cx + sg * s * 0.38, cy - s * 0.02); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = SL.sylB; g.beginPath(); g.moveTo(cx + sg * s * 0.24, cy - s * 0.12); g.lineTo(cx + sg * s * 0.44, cy - s * 0.38); g.lineTo(cx + sg * s * 0.36, cy - s * 0.08); g.closePath(); g.fill();
  }
  g.fillStyle = SL.syl; g.beginPath(); g.ellipse(cx, cy + s * 0.06, s * 0.32, s * 0.26, 0, 0, TAU); g.fill(); g.stroke();
  for (const sg of [-1, 1]) {
    g.fillStyle = SL.sylB; g.beginPath(); g.ellipse(cx + sg * s * 0.13, cy + s * 0.04, s * 0.07, s * 0.09, 0, 0, TAU); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(cx + sg * s * 0.12, cy + s * 0.01, s * 0.025, 0, TAU); g.fill();
  }
  g.strokeStyle = SL.black; g.beginPath(); g.moveTo(cx - s * 0.04, cy + s * 0.17); g.quadraticCurveTo(cx, cy + s * 0.21, cx + s * 0.04, cy + s * 0.17); g.stroke();
  const bx = cx + s * 0.26, by = cy - s * 0.16;
  g.fillStyle = SL.sylP;
  for (const sg of [-1, 1]) { g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + sg * s * 0.16, by - s * 0.09); g.lineTo(bx + sg * s * 0.16, by + s * 0.09); g.closePath(); g.fill(); }
  g.fillStyle = SL.sylB; g.beginPath(); g.arc(bx, by, s * 0.045, 0, TAU); g.fill();
}

/** The price list: black, a pink header with Sylveon over SALON, the services and their prices in gold. */
function priceList(g, x, y, w, h) {
  g.fillStyle = SL.black; g.fillRect(x, y, w, h);
  g.fillStyle = SL.blush; g.fillRect(x, y, w, h * 0.3);
  sylveon(g, x + w * 0.5, y + h * 0.14, h * 0.22);
  word('PRICES', SL.roseD, null, 0.8)(g, x, y + h * 0.235, w, h * 0.065);
  const rows = [['CUT', '30'], ['COLOUR', '60'], ['PERM', '80'], ['BLOW-DRY', '25'], ['NAILS', '20'], ['FURFROU TRIM', '50']];
  g.textBaseline = 'middle';
  rows.forEach(([name, p], i) => {
    const ry = y + h * (0.37 + i * 0.105);
    g.font = `bold ${h * 0.055}px ${SANS}`; g.fillStyle = i === 5 ? SL.blush : SL.white; g.textAlign = 'left'; g.fillText(name, x + w * 0.08, ry, w * 0.6);
    g.fillStyle = SL.goldL; g.textAlign = 'right'; g.fillText(p, x + w * 0.92, ry, w * 0.24);
    g.fillStyle = SL.goldD; g.fillRect(x + w * 0.08, ry + h * 0.04, w * 0.84, h * 0.006);
  });
}

/** The magazine's cover: STYLE across a pink masthead, Jynx on it in its red gown, gold hair falling to its shoulders. */
function jynxCover(g, x, y, w, h) {
  g.fillStyle = SL.blushL; g.fillRect(x, y, w, h);
  const cx = x + w / 2, s = w;
  g.fillStyle = SL.jynxH; g.beginPath(); g.ellipse(cx, y + h * 0.5, s * 0.36, h * 0.3, 0, 0, TAU); g.fill();
  g.fillRect(cx - s * 0.36, y + h * 0.5, s * 0.72, h * 0.22);
  g.fillStyle = SL.jynxR; g.beginPath(); g.moveTo(cx - s * 0.2, y + h * 0.66); g.lineTo(cx + s * 0.2, y + h * 0.66); g.lineTo(cx + s * 0.42, y + h); g.lineTo(cx - s * 0.42, y + h); g.closePath(); g.fill();
  g.fillStyle = SL.jynx; g.beginPath(); g.ellipse(cx, y + h * 0.52, s * 0.2, h * 0.13, 0, 0, TAU); g.fill();
  for (const sg of [-1, 1]) { g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(cx + sg * s * 0.08, y + h * 0.49, s * 0.055, h * 0.03, 0, 0, TAU); g.fill(); }
  g.fillStyle = SL.lips; g.beginPath(); g.ellipse(cx, y + h * 0.585, s * 0.1, h * 0.03, 0, 0, TAU); g.fill();
  g.fillStyle = SL.rose; g.fillRect(x, y, w, h * 0.2);
  word('STYLE', SL.white, null, 0.8, SERIF)(g, x, y, w, h * 0.2);
  word('NEW LOOKS', SL.roseD, null, 0.8)(g, x, y + h * 0.84, w * 0.5, h * 0.06);
}

/** Furfrou's head in a trim, about cx, cy, s tall: its dark face and snout, white fur in the trim's shape, its colour. */
function trimHead(g, cx, cy, s, trim) {
  const fur = SL.fur, skin = SL.furSkin, T = TRIMS[trim];
  g.strokeStyle = SL.black; g.lineWidth = s * 0.03;
  const shape = (pts, c) => { g.fillStyle = c; g.beginPath(); pts.forEach(([px, py], i) => (i ? g.lineTo(cx + px * s, cy - py * s) : g.moveTo(cx + px * s, cy - py * s))); g.closePath(); g.fill(); g.stroke(); };
  g.fillStyle = fur; g.beginPath(); g.ellipse(cx, cy + s * 0.3, s * 0.42, s * 0.22, 0, 0, TAU); g.fill(); g.stroke();
  for (const sg of [-1, 1]) { g.fillStyle = fur; g.beginPath(); g.ellipse(cx + sg * s * 0.3, cy + s * 0.02, s * 0.1, s * 0.2, 0, 0, TAU); g.fill(); g.stroke(); }
  if (T.top === 'heart') shape(heartPts(0.7).map(([a, b]) => [a, b + 0.12]), T.c);
  else if (T.top === 'star') shape(starPts(0.8).map(([a, b]) => [a, b + 0.08]), T.c);
  else if (T.top === 'diamond') shape(diamondPts(0.6).map(([a, b]) => [a, b + 0.16]), T.c);
  else if (T.top === 'tall') { g.fillStyle = T.c; g.beginPath(); g.ellipse(cx, cy - s * 0.32, s * 0.24, s * 0.26, 0, 0, TAU); g.fill(); g.stroke(); g.beginPath(); g.ellipse(cx, cy - s * 0.12, s * 0.32, s * 0.14, 0, 0, TAU); g.fill(); g.stroke(); }
  else if (T.top === 'curls') { g.fillStyle = T.c; for (const [px, py] of [[-0.22, 0.2], [0, 0.3], [0.22, 0.2]]) { g.beginPath(); g.arc(cx + px * s, cy - py * s, s * 0.14, 0, TAU); g.fill(); g.stroke(); } }
  else if (T.top === 'nemes') shape([[-0.4, -0.2], [-0.26, 0.36], [0.26, 0.36], [0.4, -0.2]], T.c);
  else { g.fillStyle = T.c; g.beginPath(); g.ellipse(cx, cy - s * 0.2, s * 0.3, s * 0.16, 0, 0, TAU); g.fill(); g.stroke(); }
  g.fillStyle = skin; g.beginPath(); g.ellipse(cx, cy, s * 0.2, s * 0.21, 0, 0, TAU); g.fill();
  g.beginPath(); g.ellipse(cx, cy + s * 0.14, s * 0.1, s * 0.08, 0, 0, TAU); g.fill();
  for (const sg of [-1, 1]) { g.fillStyle = SL.furEye; g.beginPath(); g.arc(cx + sg * s * 0.08, cy - s * 0.03, s * 0.04, 0, TAU); g.fill(); }
  g.fillStyle = SL.black; g.beginPath(); g.arc(cx, cy + s * 0.12, s * 0.03, 0, TAU); g.fill();
  if (trim === 'kabuki') { g.strokeStyle = SL.red; g.lineWidth = s * 0.035; for (const sg of [-1, 1]) { g.beginPath(); g.moveTo(cx + sg * s * 0.04, cy - s * 0.08); g.quadraticCurveTo(cx + sg * s * 0.14, cy - s * 0.14, cx + sg * s * 0.18, cy - s * 0.04); g.stroke(); } }
  if (trim === 'dandy') { g.fillStyle = T.c; for (const sg of [-1, 1]) { g.beginPath(); g.ellipse(cx + sg * s * 0.09, cy + s * 0.2, s * 0.09, s * 0.04, sg * 0.3, 0, TAU); g.fill(); } }
}
const TRIMS = {
  heart: { name: 'HEART', top: 'heart', c: '#f48aa8' }, star: { name: 'STAR', top: 'star', c: '#6a9ae0' }, diamond: { name: 'DIAMOND', top: 'diamond', c: '#f0cc50' },
  debutante: { name: 'DEBUTANTE', top: 'curls', c: '#b48ad8' }, matron: { name: 'MATRON', top: 'tall', c: '#7ab0e0' }, dandy: { name: 'DANDY', top: 'puff', c: '#6ab06a' },
  reine: { name: 'LA REINE', top: 'tall', c: '#f0a8c0' }, kabuki: { name: 'KABUKI', top: 'puff', c: '#e86058' }, pharaoh: { name: 'PHARAOH', top: 'nemes', c: SL.lapis },
};

/** The trims board: a pink header, FURFROU TRIMS, and the nine trims in a three by three grid, each named under it. */
function trimsBoard(g, x, y, w, h) {
  g.fillStyle = SL.white; g.fillRect(x, y, w, h);
  g.fillStyle = SL.blush; g.fillRect(x, y, w, h * 0.16);
  word('FURFROU TRIMS', SL.roseD, null, 0.78)(g, x, y, w, h * 0.16);
  Object.keys(TRIMS).forEach((t, i) => {
    const col = i % 3, row = Math.floor(i / 3), cw = w / 3, ch = h * 0.28, cx = x + cw * (col + 0.5), top = y + h * 0.16 + row * ch;
    g.fillStyle = (col + row) % 2 ? SL.blushL : SL.white; g.fillRect(x + cw * col, top, cw, ch);
    trimHead(g, cx - cw * 0.2, top + ch * 0.58, ch * 0.72, t);
    g.fillStyle = SL.black; g.textAlign = 'left'; g.textBaseline = 'middle'; g.font = `bold ${ch * 0.2}px ${SANS}`;
    g.fillText(TRIMS[t].name, cx - cw * 0.02, top + ch * 0.55, cw * 0.5);
  });
}

/** The dye chart's header: COLOUR in black on blush. */
const dyeHead = word('COLOUR', SL.black, SL.blush, 0.7);
/** A plaque's word in gold on black. */
const plaque = (text) => word(text, SL.goldL, SL.black, 0.62);

/* ---------- the kinds ---------- */

/** What js/base-models-salon.js builds for each upright and wall kind: its parts and default material. */
export const BUILT = {};
/** The floor mat's outline from above, in painted units across its 3 x 2 tiles, corners rounded off. */
export const RUG = [[6, 2], [90, 2], [94, 6], [94, 58], [90, 62], [6, 62], [2, 58], [2, 6]];

function piece(id, name, w, h, price, mat, parts, rest = {}) {
  BUILT[id] = { parts, mat };
  return { id, name, group: GROUP, solo: true, w, h, price, ...rest, draw(x, b, vw, dir) { floorShadow(x, b, vw); paintParts(parts, x, b, vw, dir, w * 32); } };
}
function wallPiece(id, name, w, price, mat, parts, rest = {}) {
  BUILT[id] = { parts, mat };
  return { id, name, group: GROUP, solo: true, w, h: 1, layer: 'wall', price, ...rest, wall(x) { paintParts(parts, x, 96, w * 32, 0, w * 32); } };
}

const foot4 = (xs, zs, s, hh, c = SL.gold, o = MT) => xs.flatMap(x => zs.map(z => B(x, hh / 2, z, s, hh, s, c, { ...o, r: s / 2 })));
/** A pump bottle of shampoo standing at x, h, z, its body in c, a black or gold pump. */
const pump = (x, h, z, c, top = SL.black, k = 1) => [
  LA(x, h, z, [[2.4 * k, 0], [2.6 * k, 0.4], [2.6 * k, 7 * k], [2 * k, 8.2 * k], [0.9 * k, 8.8 * k], [0.9 * k, 9.4 * k]], c, { m: 'gloss', seg: 10 }),
  C(x, h + 10.4 * k, z, 0.5 * k, 2 * k, top, { m: 'gloss', seg: 6 }), B(x + 1.2 * k, h + 11.6 * k, z, 3 * k, 0.9 * k, 1.2 * k, top, { m: 'gloss', r: 0.3 }),
];
/** A little bottle of nail polish at x, h, z: a round body in c, a black cap. */
const polish = (x, h, z, c) => [LA(x, h, z, [[1.1, 0], [1.3, 0.4], [1.3, 2.2], [0.6, 2.8]], c, { m: 'gloss', seg: 8 }), C(x, h + 3.8, z, 0.6, 2.2, SL.black, { m: 'gloss', seg: 6 })];
/** A pair of scissors lying open on a top at h: gold rings and steel blades from x, z pointing right. */
const scissors = (x, h, z, len = 7) => [
  RG(x, h + 0.4, z, 1.1, 0.35, SL.gold, { m: 'metal', flat: true }), RG(x, h + 0.4, z + 2.6, 1.1, 0.35, SL.gold, { m: 'metal', flat: true }),
  RD([x + 1, h + 0.4, z + 0.4], [x + len, h + 0.4, z + 1.8], 0.35, SL.chromeL, MT), RD([x + 1, h + 0.4, z + 2.2], [x + len, h + 0.4, z + 0.8], 0.35, SL.chromeL, MT),
];
/** A hedge topiary's planter: a white box with a gold rim and soil, its trim's name on a black plaque. */
const planter = (name) => [
  B(16, 6, 0, 22, 12, 20, SL.white, GL), B(16, 12.4, 0, 24, 1.4, 22, SL.gold, MT), B(16, 0.6, 0, 22.6, 1.2, 20.6, SL.goldD, MT),
  C(16, 12.9, 0, 9.6, 0.4, SL.soil, { m: 'plain', seg: 12 }),
  B(16, 6.4, 10.3, 14, 4, 0.6, SL.black, GL), PC(16, 6.4, 10.65, 13, 3.4, plaque(name)),
];

export const SALON_KINDS = [
  // the hydraulic styling chair: blush vinyl on a chrome pump and a round chrome foot, black arms, a footrest bar,
  // its pump pedal to the right
  piece('slnchair', 'Salon hydraulic styling chair', 1, 1, 980, 'gloss', [
    C(16, 0.8, 0, 11, 1.6, SL.chromeD, { m: 'metal', seg: 20 }),
    C(16, 7, 0, 2.8, 10.4, SL.chrome, { m: 'metal', seg: 12 }), RG(16, 11, 0, 3, 0.5, SL.chromeL, { m: 'metal', flat: true }),
    B(24, 2.6, 4, 6, 1.4, 3.4, SL.black, GL), RD([18.6, 4, 2], [22, 2.8, 3.6], 0.5, SL.chromeD, MT),
    C(16, 12.8, 0, 6.4, 1.4, SL.chromeD, { m: 'metal', seg: 14 }),
    RD([16, 13, 4], [16, 7.4, 10], 0.6, SL.chrome, MT), RD([10, 7.4, 10], [22, 7.4, 10], 0.8, SL.chrome, MT),
    B(16, 16, 1.4, 22, 5, 19, SL.blush, { m: 'cloth', r: 2 }),
    B(16, 28, -8.8, 23.4, 24, 1.6, SL.black, GL),
    B(16, 28, -7, 21, 22, 3.6, SL.blush, { m: 'cloth', r: 2.6, tex: 'quilt' }),
    ...[3.6, 28.4].flatMap(x => [B(x, 18.6, -1, 2, 5, 2, SL.chrome, MT), B(x, 21.6, 0, 3.4, 2.2, 18, SL.black, { m: 'gloss', r: 1 })]),
    RD([16, 40, -9], [16, 43, -9], 0.6, SL.chrome, MT), B(16, 44.2, -8.4, 12, 3.6, 3.4, SL.black, { m: 'gloss', r: 1.6 }),
  ]),

  // the styling station: a white cabinet with gold pulls and a black top, a round gold-framed mirror, a blow dryer, a
  // round brush, a spray bottle and a cup of combs and shears on it
  piece('slnstation', 'Salon styling station', 1, 1, 1150, 'gloss', [
    B(16, 1, 0, 28, 2, 20, SL.black, PL),
    B(16, 14, 0, 30, 24, 22, SL.white, GL),
    B(16, 20.6, 11.2, 26, 8.4, 0.6, SL.white, GL), B(16, 9.6, 11.2, 26, 11, 0.6, SL.white, GL),
    B(16, 21.4, 11.8, 7, 1, 0.8, SL.gold, MT), B(16, 12, 11.8, 7, 1, 0.8, SL.gold, MT),
    B(16, 27, 0, 32, 2, 24, SL.black, GL),
    B(16, 30, -9.6, 6, 4, 2, SL.gold, MT),
    DS(16, 45, -9.6, 13.4, 2, SL.gold, { m: 'metal', seg: 24 }),
    DS(16, 45, -8.4, 11.6, 0.6, SL.mirror, { m: 'gloss', seg: 24 }),
    RD([4.6, 33, 2], [12, 33, 2], 2.2, SL.black, GL), RD([12, 33, 2], [14, 33, 2], 1.4, SL.chromeD, MT), RD([7, 28.6, 2], [7, 31.6, 2], 1, SL.black, GL),
    RD([17, 29.2, 7], [26, 29.2, 7], 1.2, SL.goldD, CL), RD([26, 29.2, 7], [30, 29.2, 7], 0.6, SL.black, GL),
    LA(26, 28, -2, [[2.2, 0], [2.4, 0.4], [2.4, 7.4], [1.2, 8.4], [1.2, 9]], SL.blush, { m: 'gloss', seg: 10 }), B(26.8, 38, -2, 3, 2, 1.6, SL.white, { m: 'gloss', r: 0.4 }),
    C(19, 31, -3, 2, 6, SL.white, { m: 'gloss', seg: 10 }),
    RD([18.4, 33, -3], [17, 38.6, -3], 0.3, SL.black, PL), RD([19.6, 33, -3], [21, 38, -3], 0.3, SL.chromeL, MT), RD([19, 33, -2.4], [19.2, 39, -2.4], 0.5, SL.blushD, PL),
  ]),

  // the shampoo basin: a blush chair on a black cabinet, a black tilting basin behind its back with a neck rest, a
  // chrome mixer tap and spray hose
  piece('slnbasin', 'Salon shampoo basin chair', 1, 1, 1080, 'gloss', [
    B(16, 4.5, 0, 26, 9, 22, SL.black, GL),
    B(16, 11, 3, 24, 4, 16, SL.blush, { m: 'cloth', r: 2 }),
    B(16, 21, -5, 22, 18, 4, SL.blush, { m: 'cloth', r: 2.4, tex: 'quilt' }),
    ...[3, 29].map(x => B(x, 13.6, 1.6, 3.2, 5, 16, SL.black, { m: 'gloss', r: 1.2 })),
    B(16, 22, -10, 14, 24, 3, SL.black, GL),
    LA(16, 31, -9, [[4, 0], [7, 2], [10, 5], [11, 8.4], [10.4, 8.8]], SL.black, { m: 'gloss', seg: 16 }),
    B(16, 39.4, -1.6, 7, 1.6, 3, SL.blushD, { m: 'cloth', r: 0.8 }),
    RD([16, 39, -13], [16, 45, -13], 0.9, SL.chrome, MT), RD([16, 45, -13], [16, 45, -8], 0.7, SL.chrome, MT), RD([16, 45, -8], [16, 43, -6.6], 0.6, SL.chrome, MT),
    ...[13, 19].map(x => S(x, 41, -13, 1, 1, 1, SL.chromeL, { m: 'metal', seg: 8 })),
    RD([22, 40, -12], [24, 46, -11], 0.5, SL.black, PL), B(24.4, 47, -11, 1.6, 3, 1.6, SL.chrome, { m: 'metal', r: 0.6 }),
  ]),

  // the hood dryer chair: blush seat on a chrome tube frame, and a white hood dryer on a chrome stand over it, a pink
  // band and a black brim round its mouth, its timer on the side
  piece('slndryer', 'Salon hood dryer chair', 1, 1, 1250, 'gloss', [
    C(16, 0.8, -11, 6, 1.6, SL.chromeD, { m: 'metal', seg: 14 }),
    RD([16, 1.6, -11], [16, 41, -11], 1.1, SL.chrome, MT), RD([16, 41, -11], [16, 43.4, -5], 0.9, SL.chrome, MT),
    ...[5, 27].flatMap(x => [RD([x, 0.6, 9], [x, 0.6, -6], 0.8, SL.chrome, MT), RD([x, 0.6, 9], [x, 11, 7], 0.8, SL.chrome, MT), RD([x, 11, 7], [x, 11, -6], 0.8, SL.chrome, MT), RD([x, 11, -6], [x, 26, -8], 0.8, SL.chrome, MT)]),
    B(16, 12.6, 1, 22, 4, 17, SL.blush, { m: 'cloth', r: 2 }),
    B(16, 21, -7.2, 21, 14, 3.6, SL.blush, { m: 'cloth', r: 2.4, tex: 'quilt' }),
    ...[3.6, 28.4].map(x => B(x, 17.4, 0.4, 3, 1.8, 13, SL.black, { m: 'gloss', r: 0.9 })),
    LA(16, 30, -3, [[9.6, 0], [10.4, 1.4], [10.6, 7], [9.4, 11], [6, 14], [2.4, 15.2], [0, 15.4]], SL.white, { m: 'gloss', seg: 18 }),
    C(16, 30.6, -3, 10.2, 1.2, SL.black, { m: 'gloss', seg: 18 }),
    C(16, 34, -3, 10.62, 2.2, SL.blushD, { m: 'gloss', seg: 18 }),
    B(27.4, 38, -3, 1.4, 4, 4, SL.blackL, { m: 'gloss', r: 0.5 }), DS(28.2, 38.8, -3, 0.9, 0.6, SL.goldL, { m: 'glow', seg: 8 }),
  ], { glow: [SL.goldL] }),

  // the manicure table: white on gold legs, a cushion for the hand on a towel, a rack of polishes, a gold arm lamp that
  // lights, an emery board and a little dish of cotton
  piece('slnmanicure', 'Salon manicure table', 2, 1, 920, 'gloss', [
    ...foot4([4, 60], [-9, 9], 2.4, 25),
    B(32, 23.6, 0, 60, 3, 22, SL.white, GL),
    B(32, 22.6, 11.3, 20, 3.2, 0.6, SL.blushL, GL), B(32, 22.6, 11.8, 5, 0.8, 0.6, SL.gold, MT),
    B(32, 26, 0, 64, 2, 26, SL.white, GL),
    B(30, 27.4, 4, 16, 0.8, 10, SL.white, { m: 'cloth', r: 0.4 }), B(30, 29.4, 4, 11, 3.4, 7, SL.blush, { m: 'cloth', r: 1.6 }),
    RD([38, 27.4, 8], [44, 27.6, 6], 0.4, SL.blushD, PL),
    LA(22, 27, 6, [[2.6, 0], [3, 1.4], [0, 1.6]], SL.white, { m: 'gloss', seg: 10 }), S(22, 28.4, 6, 1.6, 1, 1.4, '#ffffff', { m: 'cloth', seg: 8 }),
    B(50, 33, -8, 24, 12, 5, SL.white, GL),
    ...[28.6, 34.4].map(h => B(50, h, -5, 24, 0.8, 2, SL.gold, MT)),
    ...[41, 44.6, 48.2, 51.8, 55.4, 59].flatMap((x, i) => [...polish(x, 29, -5.6, SL.dyes[[13, 8, 14, 9, 7, 15][i]]), ...polish(x, 34.8, -5.6, SL.dyes[[7, 10, 3, 11, 15, 8][i]])]),
    C(10, 27.6, -8, 3.2, 1.2, SL.black, { m: 'gloss', seg: 12 }),
    RD([10, 28, -8], [8, 40, -8], 0.6, SL.gold, MT), RD([8, 40, -8], [16, 44, -4], 0.6, SL.gold, MT), S(8, 40, -8, 0.9, 0.9, 0.9, SL.goldD, { m: 'metal', seg: 8 }),
    LA(17, 37, -3, [[4.4, 0], [3.6, 2.4], [1.6, 5], [0.6, 6], [0, 6.2]], SL.gold, { m: 'metal', seg: 14 }),
    S(17, 37.4, -3, 2.4, 1.2, 2.4, SL.bulb, { m: 'glow', seg: 10 }),
  ], { glow: [SL.bulb] }),

  // the towel steamer: a white cabinet with a glass door, rolled towels inside in pink and white, a little lit dial
  // and a vent on top; it stands on a cupboard with a gold handle
  piece('slnsteamer', 'Salon towel steamer', 1, 1, 680, 'gloss', [
    B(16, 1, 0, 24, 2, 18, SL.black, PL),
    B(16, 10, 0, 24, 16, 18, SL.white, GL), B(16, 10, 9.3, 20, 13, 0.6, SL.blushL, GL), B(24, 10, 10, 1, 5, 0.8, SL.gold, MT),
    B(16, 27, -1, 26, 18, 20, SL.white, GL),
    B(14.6, 27, 9.2, 21, 15, 0.6, SL.blushD, GL),
    ...[[8.8, 31], [14.6, 31], [20.4, 31], [8.8, 24.6], [14.6, 24.6], [20.4, 24.6]].flatMap(([x, h], i) => [DS(x, h, 8.4, 2.7, 1.4, i % 2 ? SL.blush : SL.white, { m: 'cloth', seg: 12 }), RG(x, h, 9.15, 1.3, 0.25, i % 2 ? SL.blushD : SL.whiteD, { m: 'plain' })]),
    B(14.6, 27, 9.7, 19, 13, 0.3, '#cfe8f4', { m: 'glass' }),
    B(26.8, 27, 9.6, 3.2, 14, 0.6, SL.white, GL),
    DS(26.8, 32, 10, 1, 0.4, SL.red, { m: 'glow', seg: 8 }), DS(26.8, 28.4, 10, 1, 0.5, SL.chromeD, { m: 'metal', seg: 8 }),
    C(16, 36.8, -4, 2.4, 1.6, SL.chrome, { m: 'metal', seg: 10 }),
  ], { glow: [SL.red] }),

  // the product shelf: white with gold edges on a blush back, pump bottles of shampoo and conditioner, sprays and tubs,
  // a jar of combs on top and rolled towels at the foot
  piece('slnshelf', 'Salon product shelf', 1, 1, 640, 'gloss', [
    ...[2.2, 29.8].map(x => B(x, 26, 0, 2.4, 52, 18, SL.white, GL)),
    B(16, 26.5, -8.4, 26, 51, 1, SL.blushL, GL),
    ...[1, 17, 33, 51].flatMap(h => [B(16, h, 0, 30, 2, 18, SL.white, GL), B(16, h, 9.2, 30, 2, 0.5, SL.gold, MT)]),
    ...[[8.6, 5.6], [8.6, 11], [16, 5.6], [16, 11], [23.4, 5.6], [23.4, 11]].map(([x, h], i) => DS(x, h, 1, 2.7, 13, i % 3 === 1 ? SL.blush : SL.white, { m: 'cloth', seg: 10 })),
    ...pump(7.6, 18, 0, SL.blush), ...pump(13.4, 18, 0, SL.black, SL.gold), ...pump(19.2, 18, 0, SL.blush), ...pump(25, 18, 0, SL.white, SL.gold, 0.9),
    ...[7.6, 13.4].map((x, i) => LA(x, 34, 0, [[2, 0], [2.2, 0.4], [2.2, 9], [1.4, 10], [0, 10.2]], i ? SL.gold : SL.black, { m: 'gloss', seg: 10 })),
    ...[7.6, 13.4].map(x => C(x, 45.4, 0, 1.2, 2, SL.chrome, { m: 'metal', seg: 8 })),
    C(21, 36.4, 1, 3.4, 4.8, SL.blush, { m: 'gloss', seg: 12 }), C(21, 39.4, 1, 3.6, 1.2, SL.gold, { m: 'metal', seg: 12 }),
    C(26.4, 37, 1, 1.8, 6, SL.white, { m: 'gloss', seg: 8 }), C(26.4, 40.6, 1, 1.8, 1.2, SL.gold, { m: 'metal', seg: 8 }),
    C(16, 55.4, 0, 3.4, 6.8, '#cfe8f4', { m: 'glass', seg: 12 }),
    ...[-2, -0.7, 0.7, 2].map((d, i) => B(16 + d, 58.4 + (i % 2), 0, 0.8, 7, 0.4, [SL.black, SL.blushD, SL.gold, SL.black][i], { m: 'plain', r: 0.2 })),
  ]),

  // the reception desk: white with a blush panel, SALON on it over a gold band, a marble top; on it the gold desk bell
  // (it rings), the appointment book, a vase of pink roses, and Smoochum sat beside them
  piece('slndesk', 'Salon reception desk', 2, 1, 1350, 'gloss', [
    B(32, 1.5, 0, 60, 3, 22, SL.black, PL),
    B(32, 17, 0, 62, 28, 24, SL.white, GL),
    B(32, 16, 12.3, 56, 20, 0.6, SL.blush, GL), B(32, 27.6, 12.5, 62, 1.4, 0.6, SL.gold, MT),
    PC(32, 16, 12.75, 34, 8, word('Salon', SL.roseD, SL.blush, 0.9, SERIF)),
    B(32, 32, 0.5, 64, 2, 27, SL.marble, GL),
    C(50, 33.4, 5, 2.8, 0.8, SL.goldD, { m: 'metal', seg: 12 }),
    LA(50, 33.8, 5, [[2.4, 0], [2.2, 1.2], [1.4, 2.2], [0, 2.6]], SL.gold, { m: 'metal', seg: 12 }), S(50, 36.8, 5, 0.6, 0.6, 0.6, SL.goldL, { m: 'metal', seg: 6 }),
    B(39, 33.6, 3, 10, 1.2, 7.4, SL.black, GL), B(39, 34.4, 3, 9.4, 0.4, 6.8, SL.white, PL),
    LA(57, 33, -6, [[2, 0], [2.8, 2], [2.4, 6], [1.4, 7.6], [1.8, 8.4]], SL.white, { m: 'gloss', seg: 10 }),
    ...[[-1.4, 44, 0], [1.4, 43.4, 0.4], [0, 45.4, -0.6], [2.2, 46, -1], [-2.4, 46.4, -0.8]].flatMap(([d, h, dz]) => [RD([57 + d * 0.3, 41, -6], [57 + d, h - 1.2, -6 + dz], 0.3, SL.green, PL), S(57 + d, h, -6 + dz, 1.4, 1.3, 1.4, SL.rose, { m: 'cloth', seg: 8 })]),
    ...[-1, 1].map(sg => S(57 + sg * 2.6, 41.4, -5, 1.6, 0.6, 1.2, SL.green, { m: 'cloth', seg: 6 })),
    ...[-1, 1].map(sg => S(14 + sg * 2.2, 33.8, 1.4, 1.6, 1.1, 2.2, SL.smoo, { m: 'cloth', seg: 8 })),
    LA(14, 33, -1, [[4.4, 0], [4.6, 1], [3.6, 5], [2.2, 6.6]], SL.smooR, { m: 'cloth', seg: 12 }),
    S(14, 42.6, -1, 4.6, 4.2, 4.2, SL.smoo, { m: 'cloth', seg: 12 }),
    S(14, 46.4, -1.6, 3.8, 2, 3.2, SL.smooH, { m: 'cloth', seg: 10 }), S(14, 48.6, -1.6, 1.6, 1.6, 1.4, SL.smooH, { m: 'cloth', seg: 8 }),
    ...[-1, 1].map(sg => S(14 + sg * 4.8, 37.6, 0, 1.2, 2, 1.2, SL.smoo, { m: 'cloth', seg: 8 })),
    ...[-1, 1].map(sg => DS(14 + sg * 1.6, 43.4, 3, 0.6, 0.3, SL.black, { m: 'gloss', seg: 6 })),
    DS(14, 41, 3.2, 1.3, 0.4, SL.smooR, { m: 'gloss', ry: 0.8, seg: 8 }),
  ]),

  // the waiting sofa: black tufted velvet with gold buttons, blush seat cushions, a gold cushion thrown in a corner, on
  // gold legs
  piece('slnsofa', 'Salon waiting sofa', 2, 1, 1200, 'cloth', [
    ...foot4([6, 58], [-8, 8], 2.2, 6),
    B(32, 9, 0, 60, 6, 22, SL.black, { m: 'cloth', r: 1.4 }),
    ...[18.5, 45.5].map(x => B(x, 14, 2.4, 26, 4, 17, SL.blush, { m: 'cloth', r: 1.6 })),
    B(32, 24, -7.6, 60, 22, 6, SL.black, { m: 'cloth', r: 3, tex: 'quilt' }),
    ...[3.6, 60.4].map(x => B(x, 18, 0, 7.2, 12, 22, SL.black, { m: 'cloth', r: 2.4 })),
    ...[[12, 28], [24, 28], [40, 28], [52, 28], [18, 22], [32, 25], [46, 22]].map(([x, h]) => DS(x, h, -4.5, 0.6, 0.4, SL.gold, { m: 'metal', seg: 6 })),
    B(12, 20.6, -2.6, 9, 9, 3, SL.gold, { m: 'cloth', r: 2.4 }),
  ]),

  // the magazine table: a round white top on a gold pedestal, a clear stand holding STYLE with Jynx on its cover, a
  // stack of magazines on the top and more on the shelf below
  piece('slnmagtable', 'Salon magazine table', 1, 1, 520, 'gloss', [
    C(16, 0.8, 0, 9, 1.6, SL.gold, { m: 'metal', seg: 16 }),
    C(16, 10, 0, 1.6, 18, SL.gold, { m: 'metal', seg: 10 }),
    C(16, 8, 0, 10, 1, SL.white, { m: 'gloss', seg: 16 }),
    ...[0, 1, 2].map(k => B(17 + k * 0.6, 9 + k * 0.8, 1, 10, 0.7, 12, [SL.blush, SL.white, SL.roseD][k], { m: 'plain', r: 0.3 })),
    C(16, 20, 0, 14, 2, SL.white, { m: 'gloss', seg: 20 }),
    ...[0, 1].map(k => B(8 + k * 0.8, 21.4 + k * 0.8, 3, 9, 0.7, 11, [SL.blushD, SL.white][k], { m: 'plain', r: 0.3 })),
    B(18, 22, 0, 13, 2, 4, '#cfe8f4', { m: 'glass' }),
    B(18, 29, -1.4, 11.6, 15, 0.5, SL.blushL, PL), PC(18, 29, -1.1, 11, 14.4, jynxCover),
    RD([18, 22.6, -2.4], [18, 25, -2.6], 0.4, '#cfe8f4', { m: 'glass' }),
  ]),

  // the tool trolley: three black trays on chrome posts and casters; shears, a comb, a round brush and the clippers on
  // top, a blue jar of combs in sanitiser on the middle tray, towels at the foot
  piece('slntrolley', 'Salon tool trolley', 1, 1, 560, 'gloss', [
    ...[[6, -7], [26, -7], [6, 7], [26, 7]].flatMap(([x, z]) => [S(x, 1.2, z, 1.2, 1.2, 1.2, SL.black, { m: 'gloss', seg: 8 }), RD([x, 2.4, z], [x, 31, z], 0.7, SL.chrome, MT)]),
    ...[5, 18, 30].flatMap(h => [B(16, h, 0, 24, 1.2, 18, SL.black, GL), B(16, h + 1.2, 8.8, 24, 1.4, 0.5, SL.blackL, GL)]),
    ...[[11, 7.4], [21, 7.4]].map(([x, h], i) => B(x, h, 0, 8, 3.4, 12, i ? SL.blush : SL.white, { m: 'cloth', r: 0.6 })),
    C(11, 23.6, 0, 3, 8, SL.barbicide, { m: 'glass', seg: 12 }), C(11, 22.6, 0, 2.8, 6, SL.barbicide, { m: 'plain', seg: 12 }), C(11, 27.8, 0, 3.2, 0.6, SL.black, { m: 'gloss', seg: 12 }),
    ...[-1.4, 0, 1.4].map((d, i) => B(11 + d, 29, 0, 0.8, 7, 0.4, [SL.black, SL.blushD, SL.black][i], { m: 'plain', r: 0.2 })),
    LA(21.5, 18.6, 0, [[2.2, 0], [2.4, 0.4], [2.4, 6], [1.2, 7.2], [1.2, 8]], SL.white, { m: 'gloss', seg: 10 }),
    ...scissors(6, 30.6, -2), B(12, 31, 4, 9, 0.6, 1.6, SL.black, { m: 'plain', r: 0.2 }),
    RD([16, 31.8, -4], [24, 31.8, -4], 1.1, SL.goldD, CL), RD([24, 31.8, -4], [28, 31.8, -4], 0.6, SL.black, GL),
    B(23, 31.8, 4, 4, 2.6, 8, SL.chromeD, { m: 'metal', r: 1 }), B(23, 31.6, 8.6, 3, 1.4, 1.4, SL.chromeL, { m: 'metal', r: 0.3 }),
  ]),

  // a barber pole on its stand: a chrome stem on a black foot, a glass column over red, white and blue stripes that turn
  // when tapped, chrome caps and a lit white globe on top
  piece('slnpole', 'Salon barber pole', 1, 1, 760, 'metal', [
    C(16, 0.8, 0, 7, 1.6, SL.black, { m: 'gloss', seg: 16 }),
    C(16, 7, 0, 1.6, 11, SL.chrome, { m: 'metal', seg: 10 }),
    LA(16, 12, 0, [[1.6, 0], [3, 1.2], [4.4, 2.6], [4.6, 4]], SL.chrome, { m: 'metal', seg: 14 }),
    C(16, 31, 0, 3.6, 30, SL.white, { m: 'plain', tex: 'stripe', seg: 14, spin: true }),
    C(16, 31, 0, 4.1, 30, '#cfe8f4', { m: 'glass', seg: 14 }),
    RG(16, 16.2, 0, 4.2, 0.5, SL.gold, { m: 'metal', flat: true }), RG(16, 45.8, 0, 4.2, 0.5, SL.gold, { m: 'metal', flat: true }),
    C(16, 47.2, 0, 4.6, 2.4, SL.chrome, { m: 'metal', seg: 14 }),
    S(16, 51.6, 0, 3.8, 3.4, 3.8, SL.bulb, { m: 'glow', seg: 12 }),
    S(16, 55.6, 0, 1, 1, 1, SL.chrome, { m: 'metal', seg: 8 }),
  ], { glow: [SL.bulb] }),

  // a mannequin head on a gold stand, wearing a blush pink bouffant wig with curls at its ears, lashes and pink lips
  piece('slnhead', 'Salon wig stand', 1, 1, 420, 'cloth', [
    C(16, 0.8, 0, 7, 1.6, SL.gold, { m: 'metal', seg: 14 }),
    C(16, 15.4, 0, 0.9, 28, SL.gold, { m: 'metal', seg: 8 }),
    LA(16, 29, 0, [[3.4, 0], [2.4, 2], [2, 4], [2.2, 6]], SL.skin, { m: 'gloss', seg: 12 }),
    S(16, 40, 0.8, 4.8, 5.8, 4.8, SL.skin, { m: 'gloss', seg: 12 }),
    S(16, 44.6, -1.2, 7, 5.4, 6.6, SL.blushD, { m: 'cloth', seg: 12 }),
    ...[-1, 1].flatMap(sg => [S(16 + sg * 5.4, 38.6, -0.6, 2.4, 3.6, 2.6, SL.blushD, { m: 'cloth', seg: 8 }), S(16 + sg * 5.6, 34.6, -0.6, 1.8, 2, 2, SL.blushD, { m: 'cloth', seg: 8 })]),
    S(16, 50.4, -1.4, 3.6, 2, 3.4, SL.blushD, { m: 'cloth', seg: 10 }),
    ...[-1, 1].map(sg => RD([16 + sg * 1, 40.4, 5.4], [16 + sg * 2.8, 40.8, 5], 0.35, SL.black, PL)),
    DS(16, 36.8, 5.5, 1.2, 0.4, SL.rose, { m: 'gloss', ry: 0.6, seg: 8 }),
  ]),

  // a hollywood mirror for the wall: a black frame round the glass, white bulbs round three sides that light
  wallPiece('slnmirror', 'Salon bulb mirror', 1, 780, 'gloss', [
    B(16, 62, 0.8, 28, 36, 1.6, SL.black, GL),
    B(16, 62, 1.7, 20, 28, 0.4, SL.mirror, GL), PC(16, 62, 1.95, 20, 28, glassPic),
    ...[49.4, 55.6, 61.8, 68, 74.2].flatMap(h => [3.8, 28.2].map(x => S(x, h, 2, 1.4, 1.4, 1.4, SL.bulb, { m: 'glow', seg: 8 }))),
    ...[9.6, 16, 22.4].map(x => S(x, 77.6, 2, 1.4, 1.4, 1.4, SL.bulb, { m: 'glow', seg: 8 })),
  ], { glow: [SL.bulb] }),

  // the price list in a gold frame: Sylveon over PRICES on pink, the services and their prices in gold on black, a
  // ribbon bow on its corner
  wallPiece('slnprices', 'Salon Sylveon price list', 1, 360, 'gloss', [
    B(16, 60, 0.5, 24, 34, 1, SL.gold, MT),
    PC(16, 60, 1.05, 22, 32, priceList),
    PR(24.6, 75, 1.4, [[0, 0], [-3.4, 2], [-3.4, -2]], 0.8, SL.sylP, GL), PR(24.6, 75, 1.4, [[0, 0], [3.4, 2], [3.4, -2]], 0.8, SL.sylP, GL),
    DS(24.6, 75, 1.9, 0.9, 0.6, SL.sylB, { m: 'gloss', seg: 8 }),
    RD([24.2, 74.4, 1.6], [22.4, 69, 1.6], 0.4, SL.sylB, PL), RD([25, 74.4, 1.6], [26.6, 68.6, 1.6], 0.4, SL.sylP, PL),
  ]),

  // a hair-dye chart for the wall: sixteen locks of hair from black to platinum, pinks, blues and gold, under COLOUR
  wallPiece('slndyechart', 'Salon hair-dye chart', 1, 340, 'gloss', [
    B(16, 60, 0.5, 26, 32, 1, SL.white, GL),
    B(16, 73, 1.1, 24, 4, 0.3, SL.blush, PL), PC(16, 73, 1.3, 24, 4, dyeHead),
    ...SL.dyes.flatMap((c, i) => { const x = 6.4 + (i % 4) * 6.4, h = 66.4 - Math.floor(i / 4) * 7; return [B(x, h - 0.6, 1.4, 3, 5.2, 0.6, c, { m: 'cloth', r: 1.2 }), B(x, h + 2.4, 1.6, 3.4, 1, 0.6, SL.goldD, { m: 'metal', r: 0.2 })]; }),
  ]),

  // a snake plant in a white pot with a gold band, its tall striped blades fanned out
  piece('slnplant', 'Salon snake plant', 1, 1, 380, 'gloss', [
    LA(16, 0, 0, [[5.4, 0], [6, 0.8], [7.4, 13], [7.6, 14]], SL.white, { m: 'gloss', seg: 16 }),
    C(16, 11.4, 0, 7.3, 1.2, SL.gold, { m: 'metal', seg: 16 }),
    C(16, 13.6, 0, 7, 0.6, SL.soil, { m: 'plain', seg: 14 }),
    ...[[-4.6, 22, -0.6, 2], [-2.2, 30, -0.3, -1], [0, 36, 0.2, 1.4], [2.4, 28, 0.5, 0], [4.8, 20, 0.7, -2], [-0.8, 24, 0.1, 4], [1.6, 32, 0.3, -3.6]].map(([dx, len, lean, z]) =>
      PR(16 + dx, 13.6, z, [[-1.8, 0], [1.8, 0], [1.4 + lean * len * 0.3, len * 0.8], [lean * len * 0.3, len], [-1.2 + lean * len * 0.3, len * 0.78]], 0.8, Math.abs(z) > 2 ? SL.greenL : SL.green, { m: 'gloss' })),
  ]),

  // the salon's floor mat: blush with a black and white checker border, gold shears and a comb crossed in its middle
  { id: 'slnmat', name: 'Salon floor mat', group: GROUP, solo: true, w: 3, h: 2, layer: 'rug', price: 520, high: 0.03, side: 'c', flat() {
    const g = ctx(), path = () => { g.beginPath(); RUG.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
    g.fillStyle = SL.black; path(); g.fill();
    g.save(); path(); g.clip();
    for (let x = 2, i = 0; x < 94; x += 4, i++) for (let y = 2, j = 0; y < 62; y += 4, j++) if ((i + j) % 2 && (x < 10 || x > 84 || y < 10 || y > 52)) { g.fillStyle = SL.white; g.fillRect(x, y, 4, 4); }
    g.restore();
    g.fillStyle = SL.gold; g.fillRect(9.4, 9.4, 77.2, 45.2);
    g.fillStyle = SL.blush; g.fillRect(10.4, 10.4, 75.2, 43.2);
    g.strokeStyle = SL.blushD; g.lineWidth = 0.4; g.strokeRect(13, 13, 70, 38);
    const cx = 48, cy = 32;
    g.save(); g.translate(cx, cy); g.rotate(-0.5);
    g.fillStyle = SL.black; g.fillRect(-16, -1.6, 32, 3.2);
    for (let i = 0; i < 14; i++) g.fillRect(-15 + i * 2.2, 1.4, 1.1, 4);
    g.restore();
    g.save(); g.translate(cx, cy); g.rotate(0.5);
    g.strokeStyle = SL.gold; g.lineWidth = 1.4;
    for (const sg of [-1, 1]) { g.beginPath(); g.ellipse(-12, sg * 3, 3, 2.4, 0, 0, TAU); g.stroke(); }
    g.fillStyle = SL.goldL;
    for (const sg of [-1, 1]) { g.beginPath(); g.moveTo(-9, sg * 2.4); g.lineTo(16, -sg * 0.4); g.lineTo(-6, sg * 0.4); g.closePath(); g.fill(); }
    g.fillStyle = SL.goldD; g.beginPath(); g.arc(-4, 0, 1, 0, TAU); g.fill();
    g.restore();
    g.strokeStyle = sh(SL.black, 1); g.lineWidth = 1; path(); g.stroke();
  } },

  // the Furfrou trimming table: a black table on a chrome lift with a pink non-slip mat, a grooming arm with its loop, a
  // shaggy Furfrou in its natural coat waiting on it for a trim, shears and a slicker brush beside it
  piece('slngroom', 'Furfrou trimming table', 2, 1, 1300, 'gloss', [
    B(32, 1.2, 0, 40, 2.4, 18, SL.black, GL),
    RD([18, 2.4, 0], [46, 21, 0], 1.1, SL.chrome, MT), RD([46, 2.4, 0], [18, 21, 0], 1.1, SL.chrome, MT),
    C(32, 11.6, 0, 1.6, 4, SL.chromeD, { m: 'metal', seg: 10 }),
    B(32, 22.4, 0, 46, 2, 16, SL.chromeD, MT),
    B(32, 24.6, 0, 62, 2.6, 24, SL.black, GL), B(32, 26.2, 0, 58, 0.8, 21, SL.blushD, { m: 'cloth', r: 0.4 }),
    RD([59, 26, -9], [59, 56, -9], 0.9, SL.chrome, MT), RD([59, 56, -9], [42, 56, -9], 0.8, SL.chrome, MT), B(59, 26.4, -9, 4, 1.6, 4, SL.chromeD, MT),
    RD([42, 56, -9], [40, 48, -5], 0.3, SL.rose, PL),
    ...furfrou(36, 26.6, -1, 1, { shag: true }),
    ...scissors(8, 26.6, 3, 8),
    B(16, 27.6, -6, 7, 1.4, 4, SL.white, { m: 'gloss', r: 0.4 }), RD([16, 27.8, -6], [22, 27.8, -6], 0.5, SL.blush, GL),
  ]),

  // a white board on gold legs: FURFROU TRIMS over the nine trims, Heart, Star, Diamond, Debutante, Matron, Dandy, La
  // Reine, Kabuki and Pharaoh, a Furfrou's head in each
  piece('slntrims', 'Furfrou trims board', 2, 1, 620, 'gloss', [
    ...[8, 56].flatMap(x => [B(x, 0.8, 0, 3, 1.6, 12, SL.goldD, MT), RD([x, 1.6, 0], [x, 20, -1], 0.8, SL.gold, MT)]),
    B(32, 38, -1, 62, 38, 1.6, SL.gold, MT),
    B(32, 38, 0, 58, 34, 1, SL.white, GL),
    PC(32, 38, 0.55, 58, 34, trimsBoard),
  ]),

  // a hedge topiary clipped into Furfrou in the Heart trim, its topknot a heart, a pink heart ribbon on its chest
  piece('slnheart', 'Furfrou Heart trim topiary', 1, 1, 880, 'cloth', [
    ...planter('HEART'),
    ...furfrou(16, 13, -1, 0.95, { fur: SL.hedge, skin: SL.hedgeD, face: false, tex: 'leafy', top: 'heart', topC: SL.hedge, emb: 'heart', embC: '#f48aa8' }),
  ]),

  // a hedge topiary clipped into Furfrou in the Star trim, its topknot a star, a blue star on its chest
  piece('slnstar', 'Furfrou Star trim topiary', 1, 1, 880, 'cloth', [
    ...planter('STAR'),
    ...furfrou(16, 13, -1, 0.95, { fur: SL.hedge, skin: SL.hedgeD, face: false, tex: 'leafy', top: 'star', topC: SL.hedge, emb: 'star', embC: '#6a9ae0' }),
  ]),

  // a hedge topiary clipped into Furfrou in the Diamond trim, its topknot a diamond, a gold diamond on its chest
  piece('slndiamond', 'Furfrou Diamond trim topiary', 1, 1, 880, 'cloth', [
    ...planter('DIAMOND'),
    ...furfrou(16, 13, -1, 0.95, { fur: SL.hedge, skin: SL.hedgeD, face: false, tex: 'leafy', top: 'diamond', topC: SL.hedge, emb: 'diamond', embC: '#f0cc50' }),
  ]),

  // Furfrou in the La Reine trim posed on a blush velvet cushion with gold tassels: its tall bouffant topped by a
  // little gold crown, a pink bow at its ear
  piece('slnreine', 'Furfrou La Reine cushion', 1, 1, 1100, 'cloth', [
    B(16, 3.4, 0, 28, 6.8, 24, SL.blush, { m: 'cloth', r: 3, tex: 'quilt' }),
    ...[[3, -11], [29, -11], [3, 11], [29, 11]].map(([x, z]) => S(x, 2.4, z, 1.2, 2.2, 1.2, SL.gold, { m: 'cloth', seg: 8 })),
    ...furfrou(16, 6.8, -1, 0.92, { top: 'bouffant' }),
    C(16, 33.8, 2, 1.8, 1.4, SL.gold, { m: 'metal', seg: 10 }),
    ...[-1.2, 0, 1.2].map(d => PR(16 + d, 34.4, 2, [[-0.5, 0], [0.5, 0], [0, 1.6]], 0.6, SL.goldL, MT)),
    PR(20.4, 25, 3.4, [[0, 0], [2.4, 1.6], [2.4, -1.6]], 0.8, SL.rose, GL), PR(20.4, 25, 3.4, [[0, 0], [-2.4, 1.6], [-2.4, -1.6]], 0.8, SL.rose, GL),
  ]),

  // a gold statue of Furfrou in the Pharaoh trim on a black plinth, its headdress striped lapis and gold
  piece('slnpharaoh', 'Furfrou Pharaoh gold statue', 1, 1, 1500, 'metal', [
    B(16, 4, 0, 26, 8, 22, SL.black, GL), B(16, 7.4, 0, 27, 1.2, 23, SL.gold, MT), B(16, 0.6, 0, 27, 1.2, 23, SL.goldD, MT),
    B(16, 3.8, 11.1, 16, 3.6, 0.4, SL.black, PL), PC(16, 3.8, 11.35, 15, 3.2, plaque('PHARAOH')),
    PR(16, 8 + 14 * 0.95, 1, [[-6.6, 0], [6.6, 0], [4.4, 10.6], [-4.4, 10.6]], 3, SL.lapis, { m: 'gloss', tex: 'nemes' }),
    ...furfrou(16, 8, -1, 0.95, { fur: SL.gold, skin: SL.goldD, m: 'metal', face: false, top: 'puff' }),
    B(16, 8 + 21.4 * 0.95, 8.4, 1.2, 2.4, 1, SL.lapis, { m: 'gloss', r: 0.4 }),
    ...[-1, 1].map(sg => DS(16 + sg * 1.3, 8 + 19.8 * 0.95, 8.4, 0.75, 0.3, SL.lapis, { m: 'gloss', seg: 8 })),
  ]),
];
