/* base-furniture-haunted.js  -  the Haunted mansion set (furniture expansion session l, 2026-10-17): a whole room of a
   dusty Victorian manor nobody has lived in for a century, as Animal Crossing's Happy Home Paradise does a room type.
   Faded plum and moss-green damask, cobwebbed black ebony, tarnished silver and a dim green ghost-light: a harpsichord
   that still plays, a tall clock stopped at midnight, a séance table with its crystal ball, a bookcase that swings open
   on a hidden passage, a desk where a quill writes by itself, a rocking chair that rocks with no one in it, a wingback
   and a chaise gone to the moths, a high-backed dining chair, a cobwebbed dining table laid with a cracked tea set, a
   canopy bed under torn drapes, a steamer trunk that knocks, a hall table of dead roses, a suit of armour with
   something looking out of it, a marble bust that turns to watch, an iron candle stand and a crooked tassel lamp, a coat
   stand with a cloak still on it, a gothic window, a ghost-light sconce and a moth-eaten damask rug. Mismagius hovering
   over the séance table, Sableye peeking from a jewel box, Shuppet in the birdcage and Phantump in an urn for the
   Pokémon touches, and Chandelure, Banette and Dusknoir in the family portraits. All solo, fixed colours, sold all year.
   An upright piece is a list of parts in painted units (32 a tile), as in js/base-furniture-ramen.js: `x` across from
   the left of its front, `h` up from the floor (a wall piece's from the foot of its strip), `z` out to the front from
   its middle (a wall piece's from the wall). They're painted here from any side, and js/base-models-haunted.js builds
   the same list as 3D parts (BUILT), so picture and model agree. A `wedge` is a side profile ([z, up] points) extruded
   `w` across (the rocking chair's runners), as the Bakery's. `tex: 'grain'` is painted only (the model stays plain
   colour). A `pic` part (the portraits, the clock's face, the harpsichord's keys) is painted on the front only, and the
   model wears that crop of the painting. The bookcase's middle swings (`doors`) on a passage modelled behind it
   (`inside`, `bare`). The rug is painted from above (RUG). */

import { sh, oval, ovalShade, floorShadow, ctx, hash, glass as glassPane } from './base-paint.js';

export const HN = {
  plum: '#5a2e4a', plumD: '#3c1c32', plumL: '#7c4a68', moss: '#4e5e36', mossD: '#323e22', mossL: '#6e7e4c',
  eb: '#221c20', ebL: '#3c3438', ebD: '#141012', silver: '#a8a296', silverD: '#6c685e', silverL: '#ccc8ba',
  ghost: '#8cf0b0', ghostL: '#d8ffe4', ghostD: '#3a9a6a', crystal: '#b4f4d4',
  linen: '#d4c8ae', linenD: '#a29678', web: '#e6e2da', dust: '#bcb09a', paper: '#e8dfc8', ink: '#1c1830',
  wood: '#4c2e24', woodD: '#2c1a14', woodL: '#6c4632', gold: '#9c8448', goldL: '#c8b070',
  candle: '#e6dcc0', moon: '#cfe0ee', night: '#1a2034', nightL: '#2c3a5a', rose: '#5c1c26', roseL: '#8a3040',
  stone: '#8c867a', stoneD: '#57534a', marble: '#d6d2c8', marbleD: '#a8a49a', iron: '#2c2c30', ironL: '#4a4a50', pit: '#0c0a10',
  mis: '#5c3a78', misD: '#3a2250', misHat: '#432a5c', misGem: '#c8283c', misEye: '#f2d24a',
  shup: '#3e4466', shupD: '#262a44', shupEye: '#86e4f4',
  phan: '#5a4230', phanD: '#3a2a1e', leaf: '#4aa040', leafD: '#2a6a28', phanEye: '#e83030',
  sable: '#4a3c78', sableD: '#2c2450', gem: '#7ae0f8', gemR: '#e0283c',
  chand: '#3a3640', flame: '#9a5cf0', banette: '#4a4c5a', zip: '#e8c040', dusk: '#42424a', duskEye: '#e83030',
};
const GROUP = 'Haunted mansion';
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
const WG = (x, h, z, w, pts, c, o) => ({ t: 'wedge', x, h, z, w, pts, c, ...o });
const PC = (x, h, z, w, hh, fn, o) => ({ t: 'pic', x, h, z, w, hh, fn, ...o });

const CL = { m: 'cloth' }, PL = { m: 'plain' }, GL = { m: 'gloss' }, WD = { m: 'wood' }, MT = { m: 'metal' }, GW = { m: 'glow' };
const GR = { m: 'wood', tex: 'grain' }, GRH = { m: 'wood', tex: 'grain', pd: 'h' }, SQ = { r: 0.05 };
const cl = (r = 1.4) => ({ m: 'cloth', r });

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
  if (q.tex === 'grain') {
    const across = q.pd === 'h', w0 = across ? y0 : x0, w1 = across ? y1 : x1, l0 = across ? x0 : y0, l1 = across ? x1 : y1;
    g.lineWidth = 0.3;
    for (let w = w0 + 0.7, i = 0; w < w1; w += 0.9, i++) {
      const a = l0 + hash(i, seed, 1) * (l1 - l0) * 0.5, l = (l1 - l0) * (0.3 + hash(i, seed, 2) * 0.6), v = hash(i, seed, 3);
      g.globalAlpha = 0.35; g.strokeStyle = v < 0.5 ? sh(c, -2) : sh(c, 1);
      g.beginPath();
      if (across) { g.moveTo(a, w); g.bezierCurveTo(a + l * 0.3, w + 0.3, a + l * 0.6, w - 0.3, a + l, w); } else { g.moveTo(w, a); g.bezierCurveTo(w + 0.3, a + l * 0.3, w - 0.3, a + l * 0.6, w, a + l); }
      g.stroke();
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

/* ---------- pictures ---------- */

const vgrad = (g, x, y, h, top, bot) => { const l = g.createLinearGradient(0, y, 0, y + h); l.addColorStop(0, top); l.addColorStop(1, bot); return l; };
const ell = (g, cx, cy, rx, ry, c) => { g.fillStyle = c; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, TAU); g.fill(); };
const path = (g, pts, c) => { g.fillStyle = c; g.beginPath(); pts.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py))); g.closePath(); g.fill(); };

/** The harpsichord's two manuals seen from the front: ebony naturals, bone sharps, as the old instruments had them. */
function keys(g, x, y, w, h) {
  g.fillStyle = HN.ebD; g.fillRect(x, y, w, h);
  const n = 22, kw = w / n;
  for (let i = 0; i < n; i++) { g.fillStyle = '#342a2e'; g.fillRect(x + i * kw + 0.12, y + 0.15, kw - 0.24, h - 0.3); }
  const black = [1, 1, 0, 1, 1, 1, 0];
  for (let i = 0; i < n - 1; i++) if (black[i % 7]) { g.fillStyle = '#d8ccb0'; g.fillRect(x + (i + 1) * kw - kw * 0.3, y + 0.15, kw * 0.6, h * 0.55); }
  g.fillStyle = 'rgba(200,190,170,0.25)'; g.fillRect(x, y + h * 0.48, w, 0.25);
}

/** The tall clock's dial, its hands stopped together at midnight, a crack across the glass. */
function clockFace(g, x, y, w, h) {
  const cx = x + w / 2, cy = y + h / 2, r = w / 2 - 0.4;
  g.fillStyle = HN.silverD; g.beginPath(); g.arc(cx, cy, r + 0.4, 0, TAU); g.fill();
  g.fillStyle = vgrad(g, x, y, h, '#e4dac0', '#b4a888'); g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill();
  g.strokeStyle = HN.eb; g.lineWidth = 0.3; g.beginPath(); g.arc(cx, cy, r * 0.72, 0, TAU); g.stroke();
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * TAU, l = i % 3 ? 0.84 : 0.76;
    g.lineWidth = i % 3 ? 0.3 : 0.6; g.beginPath(); g.moveTo(cx + Math.sin(a) * r * l, cy - Math.cos(a) * r * l); g.lineTo(cx + Math.sin(a) * r * 0.95, cy - Math.cos(a) * r * 0.95); g.stroke();
  }
  g.lineCap = 'round'; g.strokeStyle = HN.ink;
  g.lineWidth = 0.8; g.beginPath(); g.moveTo(cx, cy + 0.6); g.lineTo(cx, cy - r * 0.5); g.stroke();
  g.lineWidth = 0.45; g.beginPath(); g.moveTo(cx, cy + 1); g.lineTo(cx, cy - r * 0.86); g.stroke();
  ell(g, cx, cy, 0.7, 0.7, HN.gold);
  g.strokeStyle = 'rgba(70,56,44,0.8)'; g.lineWidth = 0.22;
  g.beginPath(); g.moveTo(cx + r * 0.62, cy - r * 0.62); g.lineTo(cx + r * 0.25, cy - r * 0.1); g.lineTo(cx + r * 0.35, cy + r * 0.2); g.lineTo(cx - r * 0.1, cy + r * 0.7); g.stroke();
  g.fillStyle = 'rgba(120,110,90,0.3)'; g.beginPath(); g.arc(cx - r * 0.4, cy + r * 0.35, r * 0.25, 0, TAU); g.fill();
}

/** A portrait's oval: dark plum ground, a moss mat ringed in old gilt, the sitter's dim green backdrop. */
function sitting(g, x, y, w, h) {
  g.fillStyle = vgrad(g, x, y, h, HN.plumD, HN.ebD); g.fillRect(x, y, w, h);
  const cx = x + w / 2, cy = y + h / 2;
  ell(g, cx, cy, w * 0.46, h * 0.46, HN.goldL);
  ell(g, cx, cy, w * 0.43, h * 0.43, HN.moss);
  const r = g.createRadialGradient(cx, cy - h * 0.05, 0, cx, cy, w * 0.4);
  r.addColorStop(0, '#3e5a46'); r.addColorStop(1, '#141c18');
  g.fillStyle = r; g.beginPath(); g.ellipse(cx, cy, w * 0.38, h * 0.39, 0, 0, TAU); g.fill();
  return [cx, cy];
}
/** Great-grandmother Chandelure: a dark chandelier of a Pokémon, yellow eyes, purple flames burning in its cups. */
function chandelure(g, x, y, w, h) {
  const [cx, cy] = sitting(g, x, y, w, h), s = w / 15;
  g.strokeStyle = HN.chand; g.lineWidth = s * 0.7; g.lineCap = 'round';
  for (const k of [-1, 1]) { g.beginPath(); g.moveTo(cx + k * s, cy + s); g.quadraticCurveTo(cx + k * s * 5, cy + s * 2, cx + k * s * 4.4, cy - s * 2); g.stroke(); }
  ell(g, cx, cy + s * 1.2, s * 2.6, s * 2.6, HN.chand);
  ell(g, cx, cy - s * 0.4, s * 1.8, s * 1.2, '#5a5662');
  for (const k of [-1, 1]) ell(g, cx + k * s * 1, cy + s * 1.2, s * 0.55, s * 0.75, HN.misEye);
  for (const [fx, fy, fr] of [[cx - s * 4.4, cy - s * 2.6, 1], [cx + s * 4.4, cy - s * 2.6, 1], [cx, cy - s * 2.6, 1.3]]) {
    ell(g, fx, fy + s * 0.5, s * 0.9 * fr, s * 0.5, HN.chand);
    path(g, [[fx - s * 0.8 * fr, fy], [fx, fy - s * 2.6 * fr], [fx + s * 0.8 * fr, fy]], HN.flame);
    path(g, [[fx - s * 0.35 * fr, fy], [fx, fy - s * 1.4 * fr], [fx + s * 0.35 * fr, fy]], '#e0c8ff');
  }
}
/** Grandfather Banette: the cursed puppet, its spike of a head, red eyes and a gold zip for a mouth. */
function banette(g, x, y, w, h) {
  const [cx, cy] = sitting(g, x, y, w, h), s = w / 18;
  path(g, [[cx - s * 1.5, cy - s * 4.4], [cx + s * 3.6, cy - s * 9], [cx + s * 2.2, cy - s * 3.6]], HN.banette);
  g.fillStyle = HN.banette; g.beginPath(); g.roundRect(cx - s * 4.6, cy - s * 5.2, s * 9.2, s * 8, s * 3.6); g.fill();
  g.beginPath(); g.roundRect(cx - s * 3.6, cy + s * 1.8, s * 7.2, s * 8, s * 2.4); g.fill();
  for (const k of [-1, 1]) path(g, [[cx + k * s * 0.6, cy - s * 2.6], [cx + k * s * 3, cy - s * 3.2], [cx + k * s * 2.6, cy - s * 1.6]], '#e83a4a');
  g.strokeStyle = HN.zip; g.lineWidth = s * 0.5; g.beginPath(); g.moveTo(cx - s * 2.8, cy + s * 0.4); g.quadraticCurveTo(cx, cy + s * 1.4, cx + s * 2.8, cy + s * 0.4); g.stroke();
  g.lineWidth = s * 0.3; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(cx + i * s * 1.1, cy + s * 0.4); g.lineTo(cx + i * s * 1.1, cy + s * 1.3); g.stroke(); }
  ell(g, cx + s * 3.4, cy + s * 0.2, s * 0.7, s * 0.7, HN.zip);
}
/** Uncle Dusknoir: a grey hulk with a yellow antenna, one red eye and a grim zigzag mouth across its belly. */
function dusknoir(g, x, y, w, h) {
  const [cx, cy] = sitting(g, x, y, w, h), s = w / 15;
  g.strokeStyle = HN.zip; g.lineWidth = s * 0.8; g.lineCap = 'round';
  g.beginPath(); g.moveTo(cx, cy - s * 4); g.quadraticCurveTo(cx + s * 0.4, cy - s * 6.4, cx - s * 0.8, cy - s * 7); g.stroke();
  ell(g, cx, cy + s * 2.4, s * 4.6, s * 4.6, HN.dusk);
  ell(g, cx, cy - s * 2.4, s * 3.2, s * 2.6, '#55555e');
  for (const k of [-1, 1]) ell(g, cx + k * s * 4.6, cy + s * 3.6, s * 1.5, s * 2, '#55555e');
  ell(g, cx, cy - s * 2.4, s * 1.1, s * 1.1, HN.duskEye);
  ell(g, cx, cy - s * 2.4, s * 0.4, s * 0.4, '#ffffff');
  g.strokeStyle = HN.zip; g.lineWidth = s * 0.45; g.beginPath();
  for (let i = 0; i <= 6; i++) { const px = cx - s * 3 + i * s, py = cy + s * 2.6 + (i % 2 ? s * 0.8 : 0); i ? g.lineTo(px, py) : g.moveTo(px, py); }
  g.stroke();
}

/* ---------- the kinds ---------- */

/** What js/base-models-haunted.js builds for each upright and wall kind: its parts, doors and default material. */
export const BUILT = {};
/** The damask rug's outline from above, in painted units across its 2 x 3 tiles, corners cut. */
export const RUG = [[4, 2], [60, 2], [62, 4], [62, 92], [60, 94], [4, 94], [2, 92], [2, 4]];

function piece(id, name, w, h, price, mat, parts, { doors = [], inside, ...rest } = {}) {
  BUILT[id] = { parts, doors, inside, mat };
  const all = [...parts, ...doors.flatMap(d => d.parts)];
  return { id, name, group: GROUP, solo: true, w, h, price, ...rest, draw(x, b, vw, dir) { floorShadow(x, b, vw); paintParts(all, x, b, vw, dir, w * 32); } };
}
function wallPiece(id, name, w, price, mat, parts, rest = {}) {
  BUILT[id] = { parts, doors: [], mat };
  return { id, name, group: GROUP, solo: true, w, h: 1, layer: 'wall', price, ...rest, wall(x) { paintParts(parts, x, 96, w * 32, 0, w * 32); } };
}

/** A cobweb strung in a corner at x, h, z: threads out along dx and up along dy, two rounds of silk across them. */
const webFan = (x, h, z, dx, dy) => {
  const p = (f, k) => [x + dx * f, h + dy * k, z], o = [x, h, z], W = (a, b) => RD(a, b, 0.18, HN.web, PL);
  return [W(o, p(1, 0)), W(o, p(0.72, 0.72)), W(o, p(0, 1)), W(p(0.5, 0), p(0.36, 0.36)), W(p(0.36, 0.36), p(0, 0.5)), W(p(0.92, 0), p(0.64, 0.64)), W(p(0.64, 0.64), p(0, 0.92))];
};
/** A turned ebony leg, `up` tall. */
const leg = (x, z, up, c = HN.eb) => LA(x, 0, z, [[1.4, 0], [1.1, up * 0.12], [1.9, up * 0.3], [1.1, up * 0.5], [1.6, up * 0.78], [2.1, up * 0.94], [2.1, up]], c, { m: 'gloss', seg: 8 });
/** A drip candle `up` tall standing at h, its ghost-green flame on top. */
const candle = (x, h, z, up, r = 0.8) => [C(x, h + up / 2, z, r, up, HN.candle, { m: 'plain', seg: 8 }), S(x + r * 0.6, h + up - 1.2, z + r * 0.7, 0.35, 1, 0.35, HN.candle, { m: 'plain', seg: 6 }), S(x, h + up + 1.1, z, 0.6, 1.2, 0.6, HN.ghost, { m: 'glow', seg: 6 })];
const BOOKS = [HN.plum, HN.moss, HN.rose, HN.linenD, HN.woodL, HN.mossD, HN.plumL, HN.roseL, HN.eb];
/** A shelf's row of old books on a shelf top at h0, from x 8 to 56: leaning gaps, uneven heights, dusty bindings. */
function books(h0, row, z = 3.5) {
  const out = [];
  for (let x = 8.4, i = 0; x < 55.5; i++) {
    if (hash(i, row, 4) < 0.1) { x += 2.6; continue; }
    const w = 2 + hash(i, row, 1) * 1.8, hh = 9.5 + hash(i, row, 2) * 4.5;
    if (x + w > 56) break;
    out.push(B(x + w / 2, h0 + hh / 2, z, w - 0.25, hh, 7.4, BOOKS[Math.floor(hash(i, row, 3) * BOOKS.length)], { m: 'cloth', r: 0.05 }));
    x += w;
  }
  return out;
}

export const HAUNTED_KINDS = [
  // a dusty harpsichord on turned ebony legs: two manuals of black naturals and bone sharps, its plum lid propped up on a
  // stick, a page of music on the desk and a candle burning green (a tap plays a note)
  piece('hntharpsichord', 'Manor harpsichord', 2, 1, 1400, 'wood', [
    ...[[8, 9], [56, 9], [8, -9], [56, -9]].map(([x, z]) => leg(x, z, 20)),
    ...[9, -9].map(z => RD([8, 6, z], [56, 6, z], 0.6, HN.eb, GL)),
    B(32, 24, -1, 56, 8, 26, HN.wood, GR),
    B(32, 20.6, 12.2, 56, 1, 0.6, HN.gold, MT),
    B(32, 26, 11.5, 40, 4, 5, HN.eb, GL), PC(32, 26.2, 14.05, 38, 3.2, keys),
    ...[10.5, 53.5].map(x => B(x, 27, 10.5, 3, 6, 7, HN.woodD, WD)),
    B(32, 28.6, -8, 56, 1.2, 12, HN.plumD, GL),
    PR(32, 28, -1.5, [[-28, 0], [-26, 0], [26, 13.4], [26, 15.4]], 23, HN.plum, GL),
    RD([50, 28.6, 4], [50, 37.6, 4], 0.4, HN.woodL, WD),
    B(32, 32.4, 6, 20, 8, 1, HN.woodD, WD), B(32, 33, 6.7, 14, 6, 0.3, HN.paper, PL),
    C(14, 29, 7, 1.8, 1, HN.silver, { m: 'metal', seg: 10 }), ...candle(14, 29.5, 7, 5),
    ...webFan(8.6, 6.6, 9.6, 6, 12.6), ...webFan(55.4, 6.6, 9.6, -6, 12.6),
  ], { glow: [HN.ghost] }),

  // a tall-case clock in cracked walnut: its pendulum still behind the waist glass, the dial's hands stopped together
  // at midnight under a swan-neck bonnet, a cobweb on the hood (a tap: it chimes twelve after all)
  piece('hntclock', 'Manor midnight clock', 1, 1, 950, 'wood', [
    B(16, 4, 0, 24, 8, 14, HN.woodD, WD),
    B(16, 8.6, 0, 22, 1.2, 13, HN.wood, WD),
    B(16, 27, 0, 17, 36, 10, HN.wood, GR),
    B(16, 27, 5.2, 11, 26, 0.4, '#cfe8f4', { m: 'glass' }),
    RD([16, 40, 3], [16, 21, 3], 0.3, HN.goldL, MT), DS(16, 20, 3.3, 3, 0.6, HN.gold, { m: 'metal', seg: 12 }),
    B(16, 45.6, 0, 21, 1.4, 12, HN.woodD, WD),
    B(16, 55, 0, 21, 17, 12, HN.wood, GR),
    PC(16, 55, 6.25, 15, 15, clockFace),
    ...[5.3, 26.7].map(x => C(x, 55, 5, 0.9, 16, HN.goldL, { m: 'metal', seg: 8 })),
    PR(16, 63.5, 0, [[-11, 0], [11, 0], [11, 2], [6, 4], [2.5, 4.5], [0, 9], [-2.5, 4.5], [-6, 4], [-11, 2]], 12, HN.wood, WD),
    S(16, 73.8, 0, 1.2, 1.8, 1.2, HN.gold, MT),
    ...webFan(6.4, 63.2, 6.4, 6, -6),
  ]),

  // the séance table: a round table draped to the floor in plum, gold fringe at its foot, tarot cards laid out, two
  // candles and a crystal ball glowing green on a silver claw, Mismagius hovering over it all in its wide hat (a tap
  // lights or dims the ball)
  piece('hntseance', 'Manor séance table', 1, 1, 1200, 'cloth', [
    LA(16, 0, 0, [[13.4, 0], [13.8, 1], [12.6, 17], [13.8, 18.6], [14.2, 19.4]], HN.plum, { m: 'cloth', seg: 16 }),
    C(16, 2, 0, 14, 1.6, HN.gold, { m: 'metal', seg: 16 }),
    C(16, 19.8, 0, 14.2, 1, HN.plumD, { m: 'cloth', seg: 16 }),
    ...[[7.5, 7], [11.2, 9.4], [24.5, 7.4]].map(([x, z]) => B(x, 20.5, z, 3, 0.4, 4.4, HN.paper, { m: 'plain', r: 0.1 })),
    LA(16, 20.3, 0, [[3.4, 0], [2.2, 1.2], [1.4, 2.4], [2.8, 3.2]], HN.silver, { m: 'metal', seg: 12 }),
    S(16, 27, 0, 4.4, 4.4, 4.4, HN.crystal, { m: 'glow', seg: 16 }),
    ...[4.5, 27.5].flatMap(x => [C(x, 20.7, -6, 1.6, 0.8, HN.silverD, { m: 'metal', seg: 8 }), ...candle(x, 21, -6, 4.4)]),
    PR(16, 32, -2, [[-4.6, 4], [-3, 0], [-1.5, 3], [0, 0.4], [1.5, 3], [3, 0], [4.6, 4]], 3, HN.misD, CL),
    LA(16, 34.4, -2, [[3.6, 0], [4.6, 2.5], [4, 5], [2.6, 7]], HN.mis, { m: 'cloth', seg: 12 }),
    S(16, 44.5, -2, 5.2, 4.8, 4.6, HN.mis, { m: 'cloth', seg: 14 }),
    ...[10.8, 21.2].map(x => S(x, 42.6, -2, 1.6, 3.4, 2, HN.misD, { m: 'cloth', seg: 8 })),
    ...[13.8, 18.2].flatMap(x => [S(x, 45, 2.1, 1.1, 1.3, 0.5, HN.misEye, { m: 'gloss', seg: 8 }), DS(x, 45, 2.6, 0.5, 0.3, HN.misGem, { m: 'plain', seg: 6 })]),
    ...[[12.6, 40.6], [16, 39.8], [19.4, 40.6]].map(([x, h]) => S(x, h, 1.6, 1.2, 1.2, 1, HN.misGem, { m: 'gloss', seg: 8 })),
    LA(16, 48, -2, [[6.6, 0], [5.6, 1], [3.4, 2], [2.4, 5], [1.6, 8], [0.6, 10.5], [0, 11]], HN.misHat, { m: 'cloth', seg: 12 }),
    S(17.4, 58.6, -2, 1.2, 1.2, 1.2, HN.misHat, { m: 'cloth', seg: 6 }),
  ], { glow: [HN.crystal, HN.ghost] }),

  // a tall ebony bookcase of dusty books with one red volume pulled half out: its whole middle swings open on a hidden
  // stone passage, steps going up into the dark past a ghost-light torch (a tap opens it)
  piece('hntbookcase', 'Manor secret bookcase', 2, 1, 1500, 'wood', [
    ...[3, 61].map(x => B(x, 37, 0, 5, 74, 26, HN.eb, GL)),
    B(32, 75.5, 0.5, 64, 3, 27, HN.ebL, GL),
    PR(32, 77, 0.5, [[-30, 0], [30, 0], [26, 3], [4, 3], [0, 6], [-4, 3], [-26, 3]], 24, HN.eb, GL),
    B(32, 38, -11.6, 54, 72, 1.6, HN.stoneD, PL),
    PR(32, 2, -10.5, [[-15, 0], [15, 0], [15, 40], [11, 50], [0, 55], [-11, 50], [-15, 40]], 0.6, HN.pit, PL),
    ...[0, 1, 2].map(i => B(32, 2 + i * 4, -4.5 - i * 1.8, 28, 4, 2, HN.stone, PL)),
    RD([46, 38, -10.6], [46, 42, -8], 0.5, HN.iron, MT), S(46, 44.4, -8, 1.3, 2, 1.3, HN.ghost, { m: 'glow', seg: 6 }),
    ...webFan(5.6, 74, 13.4, 7, -7), ...webFan(58.4, 74, 13.4, -7, -7),
  ], {
    doors: [{ hinge: [5.5, 11], side: 1, parts: [
      B(32, 38, -1.6, 53, 72, 1, HN.wood, WD),
      ...[6.5, 57.5].map(x => B(x, 38, 4.4, 2, 72, 12, HN.eb, GL)),
      ...[3, 20, 37, 54, 71].map(h => B(32, h, 4.4, 53, 2, 12, HN.eb, GL)),
      ...[4, 21, 38, 55].flatMap((h, row) => books(h, row)),
      RD([31, 39, 8.4], [33, 51.6, 9.6], 1.4, HN.roseL, CL),
    ] }],
    inside: { x: 32, h: 37, w: 52, hh: 70, z: -3, bare: true },
    glow: [HN.ghost],
  }),

  // a little walnut writing desk: pigeonholes of old letters, a moss leather top, an inkwell and a candle, and a quill
  // writing a letter in the air by itself (a tap: the letter drifts off)
  piece('hntdesk', 'Manor ghost-writing desk', 1, 1, 780, 'wood', [
    ...[[4, -10], [28, -10], [4, 10], [28, 10]].map(([x, z]) => leg(x, z, 18, HN.wood)),
    B(16, 20.5, 0, 30, 5, 24, HN.wood, GR),
    B(16, 20.5, 12.2, 14, 3, 0.4, HN.woodL, WD), S(16, 20.5, 12.6, 0.6, 0.6, 0.5, HN.silver, { m: 'metal', seg: 6 }),
    B(16, 23.6, 0, 31, 1.4, 25, HN.woodD, WD),
    B(16, 24.4, 2.5, 22, 0.3, 14, HN.moss, { m: 'cloth', r: 0.1 }),
    B(16, 30, -9, 28, 11, 6, HN.wood, WD),
    ...[6.5, 12.8, 19.2, 25.5].flatMap(x => [27.5, 32.5].map(h => B(x, h, -5.9, 5.4, 3.8, 0.3, HN.woodD, PL))),
    B(12.8, 28.4, -5.4, 4, 2.6, 1.4, HN.paper, PL), B(25.5, 33.2, -5.4, 3.6, 2.4, 1.4, HN.linen, PL), B(6.5, 33, -5.4, 3.4, 2.8, 1.4, HN.paper, PL),
    C(23, 25.8, 5, 1.8, 2.6, HN.eb, { m: 'gloss', seg: 10 }), C(23, 27.4, 5, 1.2, 0.6, HN.silver, { m: 'metal', seg: 8 }),
    C(5.5, 24.8, 3, 1.6, 0.8, HN.silverD, { m: 'metal', seg: 8 }), ...candle(5.5, 25.2, 3, 4.6),
    B(19, 42, 3, 10, 7, 0.3, HN.paper, PL),
    ...[0, 1, 2].map(k => B(18.4 - (k === 2 ? 1.4 : 0), 43.8 - k * 1.6, 3.2, k === 2 ? 4.4 : 7, 0.35, 0.1, HN.ink, PL)),
    RD([10.4, 31, 6], [13.6, 41, 4], 0.25, HN.web, PL),
    PR(12.6, 34, 5, [[-0.6, 0], [0.8, -0.6], [2.4, 6.4], [1, 7]], 0.4, HN.linen, PL),
  ], { glow: [HN.ghost] }),

  // a crooked floor lamp: a tarnished silver stem kinked twice, a fringed moss shade glowing a sickly green
  // (a tap switches it)
  piece('hntlamp', 'Manor crooked tassel lamp', 1, 1, 420, 'metal', [
    LA(16, 0, 0, [[6, 0], [6, 0.8], [3.6, 2], [1.4, 3.2]], HN.silverD, { m: 'metal', seg: 12 }),
    RD([16, 3, 0], [18, 22, 0], 0.7, HN.silverD, MT), RD([18, 22, 0], [13.6, 34, 0], 0.7, HN.silverD, MT), RD([13.6, 34, 0], [17, 45, 0], 0.7, HN.silverD, MT),
    ...[[18, 22], [13.6, 34]].map(([x, h]) => S(x, h, 0, 1.2, 1.2, 1.2, HN.silver, { m: 'metal', seg: 8 })),
    S(17, 47.6, 0, 2.6, 3, 2.6, HN.ghostL, { m: 'glow', seg: 10 }),
    LA(17, 44, 0, [[9.6, 0], [9.8, 0.6], [6, 10], [5.6, 10.6]], HN.moss, { m: 'cloth', seg: 14 }),
    ...Array.from({ length: 10 }, (_, i) => { const a = i / 10 * TAU + 0.3, x = 17 + Math.cos(a) * 9.4, z = Math.sin(a) * 9.4; return [RD([x, 44, z], [x, 41.6, z], 0.25, HN.goldL, PL), S(x, 41.2, z, 0.5, 0.6, 0.5, HN.gold, { m: 'plain', seg: 6 })]; }).flat(),
    ...[[12.4, 49, 7.6], [20.4, 51.6, 6.4]].map(([x, h, z]) => DS(x, h, z, 0.9, 0.3, HN.mossD, { m: 'plain', seg: 6 })),
  ], { glow: [HN.ghostL] }),

  // an ebony rocking chair on curved runners: a spindle back, a worn moss cushion and a moth-eaten shawl over the back,
  // a cobweb under one arm (a tap: it rocks with no one in it)
  piece('hntrocker', 'Manor creaking rocker', 1, 1, 620, 'wood', [
    ...[6, 26].map(x => WG(x, 0, 0, 2.2, [[-14, 4], [-9, 1.4], [-3, 0.2], [3, 0.2], [9, 1.4], [14, 4], [14, 5.6], [9, 3], [3, 1.8], [-3, 1.8], [-9, 3], [-14, 5.6]], HN.eb, GL)),
    ...[6, 26].flatMap(x => [RD([x, 2, 7], [x, 17, 7], 0.9, HN.eb, GL), RD([x, 2, -7], [x, 17, -7], 0.9, HN.eb, GL), RD([x, 17, -8], [x, 47, -11.6], 1, HN.eb, GL),
      RD([x, 17, 7], [x, 27, 7.6], 0.7, HN.eb, GL), RD([x, 28, -9.6], [x, 27, 8.4], 0.9, HN.eb, GL)]),
    B(16, 17.6, 0, 24, 2, 18, HN.eb, GL),
    B(16, 19.2, 0.5, 21, 1.6, 15, HN.moss, cl(1)),
    ...[10, 13, 16, 19, 22].map(x => RD([x, 19, -8.4], [x, 44, -11.4], 0.45, HN.eb, GL)),
    B(16, 46, -11.6, 22, 4, 2, HN.eb, GL),
    PR(16, 48, -11.6, [[-9, 0], [9, 0], [5, 2.4], [0, 3.6], [-5, 2.4]], 2, HN.eb, GL),
    B(16, 39.6, -9.4, 18, 9, 1.2, HN.plumL, cl(0.6)),
    ...[9, 12, 15, 18, 21].map(x => RD([x, 35.2, -9], [x + 0.4, 32.6, -8.6], 0.22, HN.plumL, PL)),
    ...webFan(6.4, 17.6, 7.6, 0, 9.6).slice(0, 1), ...webFan(6.6, 26.4, 7.6, 4, -8),
  ]),

  // a deep wingback in faded plum damask gone to the moths: holes in its back with the stuffing coming through, rolled
  // arms, tall wings, a cobweb from wing to crest
  piece('hntwingback', 'Manor moth-eaten wingback', 1, 1, 760, 'cloth', [
    ...[[5, -9], [27, -9], [5, 10], [27, 10]].map(([x, z]) => LA(x, 0, z, [[1.4, 0], [1.8, 2], [1.2, 4]], HN.eb, { m: 'gloss', seg: 8 })),
    B(16, 8, 0.5, 30, 8, 26, HN.plum, cl(1.5)),
    B(16, 13.6, 3, 21, 3.4, 20, HN.plum, cl(1.4)),
    B(16, 30, -10, 26, 36, 6, HN.plum, cl(2)),
    S(16, 47, -10, 12, 3, 3, HN.plum, { m: 'cloth', seg: 14 }),
    ...[4, 28].map(x => B(x, 31, -4, 4, 22, 14, HN.plum, cl(1.8))),
    ...[3.6, 28.4].flatMap(x => [B(x, 15.5, 2, 4.8, 9, 22, HN.plum, cl(1.6)), S(x, 20, 2.6, 2.8, 1.8, 11, HN.plumL, { m: 'cloth', seg: 10 })]),
    B(16, 4.4, 13.6, 28, 0.6, 0.5, HN.goldL, PL),
    ...[[11, 34, 1.3], [21, 26, 0.9], [19.6, 40, 1]].flatMap(([x, h, r]) => [DS(x, h, -6.9, r, 0.3, HN.plumD, { m: 'plain', seg: 8 }), S(x, h, -6.7, r * 0.6, r * 0.6, 0.4, HN.linen, { m: 'cloth', seg: 6 })]),
    DS(12, 13.8, 13.1, 0.9, 0.3, HN.plumD, { m: 'plain', seg: 8 }),
    ...webFan(4.6, 42, -4, 5, 4.6),
  ]),

  // a fainting couch in faded moss velvet: a scrolled end with a bolster, a half back, a plum cushion, gold piping and a
  // tear with the stuffing showing
  piece('hntchaise', 'Manor tattered chaise', 2, 1, 900, 'cloth', [
    ...[[6, -9], [58, -9], [6, 9], [58, 9]].map(([x, z]) => LA(x, 0, z, [[1.4, 0], [1.8, 2], [1.2, 4]], HN.eb, { m: 'gloss', seg: 8 })),
    B(32, 7, 0, 60, 6, 24, HN.wood, GR),
    B(32, 12.6, 1, 56, 5, 22, HN.moss, cl(2)),
    PR(8, 10, 1, [[-6, 0], [7, 0], [6, 8], [3, 13], [-2, 15], [-6, 14], [-6.4, 10]], 22, HN.moss, CL),
    RD([3.4, 24.4, -10], [3.4, 24.4, 12], 2.8, HN.mossL, CL),
    PR(32, 15, -9, [[-20, 0], [26, 0], [26, 3], [12, 8], [-20, 13]], 4, HN.moss, CL),
    B(32, 10.2, 12.2, 56, 0.7, 0.6, HN.goldL, PL),
    DS(42, 12.6, 12.2, 1.6, 0.3, HN.mossD, { m: 'plain', seg: 8 }), S(42, 12.8, 12.4, 1, 0.8, 0.6, HN.linen, { m: 'cloth', seg: 6 }),
    S(16, 18, 2, 4.4, 3.6, 3, HN.plumL, { m: 'cloth', seg: 10 }),
    ...webFan(6.6, 4.6, 9.6, 6, -4.4).slice(0, 4),
  ]),

  // a gothic dining chair: a very tall ebony back with a pointed crest and finials, a plum seat and back panel
  piece('hntchair', 'Manor high-backed chair', 1, 1, 380, 'wood', [
    ...[[6, 9], [26, 9], [6, -9], [26, -9]].map(([x, z]) => RD([x, 0, z], [x, 15, z], 1, HN.eb, GL)),
    RD([6, 5, 9], [26, 5, 9], 0.5, HN.eb, GL), RD([6, 5, -9], [26, 5, -9], 0.5, HN.eb, GL),
    B(16, 15.8, 0.5, 24, 2.4, 21, HN.eb, GL),
    B(16, 17.6, 1, 21, 1.4, 18, HN.plum, cl(0.8)),
    ...[6.2, 25.8].flatMap(x => [RD([x, 15, -9.6], [x, 58, -10.4], 1, HN.eb, GL), S(x, 59.4, -10.4, 1.3, 1.8, 1.3, HN.eb, GL)]),
    B(16, 22.4, -9.8, 19.6, 1.6, 1.8, HN.eb, GL),
    B(16, 36.4, -9.9, 18, 26, 1, HN.plum, cl(0.6)),
    PR(16, 49.4, -10, [[-9.8, 0], [9.8, 0], [9.8, 2], [3, 4.6], [0, 8], [-3, 4.6], [-9.8, 2]], 2, HN.eb, GL),
    DS(16, 52.4, -8.9, 1, 0.4, HN.silver, { m: 'metal', seg: 8 }),
  ]),

  // a long dining table under a moth-eaten runner, laid for a tea that never ended: a tarnished teapot, cracked cups,
  // a cake gone grey on its stand, a candle burning green and the cobwebs over all
  piece('hnttable', 'Manor cobwebbed dining table', 2, 1, 1100, 'wood', [
    ...[[5, -10], [59, -10], [5, 10], [59, 10]].map(([x, z]) => leg(x, z, 22)),
    B(32, 20.5, 0, 58, 3.4, 24, HN.eb, GL),
    B(32, 23, 0, 64, 1.6, 28, HN.wood, GRH),
    B(32, 24, 0, 22, 0.3, 28.6, HN.linen, { m: 'cloth', r: 0.1 }), B(32, 21.6, 14.4, 22, 4.6, 0.4, HN.linen, cl(0.1)),
    ...[[27, 22.4], [36, 21]].map(([x, h]) => DS(x, h, 14.7, 0.9, 0.2, HN.linenD, { m: 'plain', seg: 6 })),
    LA(20, 24, -2, [[2.4, 0], [3.8, 1.5], [4, 4], [3, 6], [1.2, 6.6], [1.4, 7.4], [0, 8]], HN.silver, { m: 'metal', seg: 14 }),
    RD([23.4, 26, -2], [27, 30, -2], 0.6, HN.silver, MT), RG(16.4, 28, -2, 2, 0.4, HN.silverD, MT),
    ...[[33, 3], [44, -3], [52, 5]].flatMap(([x, z]) => [C(x, 24.3, z, 3, 0.5, HN.paper, { m: 'gloss', seg: 12 }), LA(x, 24.6, z, [[1.4, 0], [2.2, 1], [2.6, 3.4]], HN.paper, { m: 'gloss', seg: 10 })]),
    RD([33.6, 28, 5.4], [34.6, 25.6, 5.8], 0.15, HN.ink, PL),
    LA(10, 24, 2, [[3.2, 0], [1, 0.6], [0.6, 4], [5, 4.4], [5, 5]], HN.silver, { m: 'metal', seg: 12 }),
    C(10, 30.8, 2, 3.4, 3.6, HN.linenD, { m: 'cloth', seg: 12 }),
    LA(58, 24, -6, [[2.4, 0], [1, 1], [0.8, 7], [1.6, 8]], HN.silver, { m: 'metal', seg: 10 }), ...candle(58, 32, -6, 4),
    ...webFan(58, 36, -6, 5.6, -11.6), ...webFan(10, 32.4, 2, -6, -8.2),
  ], { glow: [HN.ghost] }),

  // a leather steamer trunk with wooden staves and a silver clasp, old labels on its front and a green light leaking from
  // under its lid (a tap: something knocks inside)
  piece('hnttrunk', 'Manor knocking trunk', 1, 1, 560, 'gloss', [
    B(16, 9, 0, 28, 16, 18, HN.plumD, { m: 'gloss', r: 1.4 }),
    B(16, 4, 0, 28.4, 1.2, 18.4, HN.silverD, MT),
    ...[8, 24].map(x => B(x, 9, 0, 2.4, 16.4, 18.6, HN.wood, WD)),
    B(16, 17.4, 0, 27, 0.8, 17, HN.ghost, GW),
    B(16, 20.4, 0, 28.6, 5, 18.6, HN.plumD, { m: 'gloss', r: 2 }),
    ...[8, 24].map(x => B(x, 20.4, 0, 2.6, 5.4, 19, HN.wood, WD)),
    B(16, 17.4, 9.6, 3, 3.6, 0.8, HN.silverL, MT),
    B(20.6, 11, 9.25, 5, 3.4, 0.3, HN.paper, PL), B(11.6, 7, 9.25, 4, 3, 0.3, HN.linenD, PL),
    ...webFan(1.8, 22.6, 9.4, 5, -6),
  ], { glow: [HN.ghost] }),

  // a walnut vanity with a cracked oval mirror in tarnished silver, a perfume bottle and a brush on its marble top, and a
  // rose jewel box with Sableye peeking out, its gem eyes shining, pearls spilling over the edge (a tap: treasure)
  piece('hntvanity', 'Manor Sableye vanity', 2, 1, 1250, 'wood', [
    ...[[5, -9], [59, -9], [5, 9], [59, 9]].map(([x, z]) => LA(x, 0, z, [[1.4, 0], [2, 2], [1.4, 5]], HN.eb, { m: 'gloss', seg: 8 })),
    B(32, 15.5, 0, 58, 21, 22, HN.wood, GR),
    ...[[16, 20.5], [16, 11], [48, 20.5], [48, 11]].flatMap(([x, h]) => [B(x, h, 11.2, 24, 7.4, 0.6, HN.woodL, WD), S(x, h, 11.8, 0.8, 0.8, 0.6, HN.silver, { m: 'metal', seg: 6 })]),
    B(32, 22, 11.2, 6, 4, 0.6, HN.woodL, WD),
    B(32, 27, 0, 62, 2, 24, HN.marble, GL),
    RD([32, 28, -8], [32, 34.4, -8], 1.2, HN.silver, MT),
    RG(32, 48, -8, 11, 1.4, HN.silver, { m: 'metal', ry: 14 }),
    DS(32, 48, -8.6, 10.4, 0.6, HN.nightL, { m: 'gloss', ry: 13.4, seg: 16 }),
    S(32, 62.8, -8, 2, 2, 1, HN.silver, { m: 'metal', seg: 8 }),
    RD([27, 56, -8], [33, 47, -8], 0.15, HN.web, PL), RD([33, 47, -8], [30, 40, -8], 0.15, HN.web, PL), RD([33, 47, -8], [38, 44, -8], 0.15, HN.web, PL),
    B(47, 30.5, 4, 12, 5, 8, HN.rose, GL), B(47, 36.5, -0.4, 12, 7, 1, HN.rose, GL), B(47, 33, 8.1, 12.4, 0.6, 0.4, HN.goldL, MT),
    S(47, 34.8, 3.6, 4.4, 3.4, 3.4, HN.sable, { m: 'gloss', seg: 12 }),
    ...[-1, 1].map(s => PR(47 + s * 4.4, 36, 3.6, [[-s * 1, 0], [s * 1, 0], [s * 1.2, 3.4]], 1, HN.sable, GL)),
    ...[45, 49].map(x => PR(x, 35, 6.6, [[0, -1.4], [1.1, 0], [0, 1.4], [-1.1, 0]], 0.6, HN.gem, GW)),
    B(47, 32.8, 6.8, 3.6, 0.8, 0.3, HN.web, PL),
    ...[42.4, 51.6].map(x => S(x, 33, 7, 1.4, 0.9, 1.2, HN.sable, { m: 'gloss', seg: 6 })),
    ...[[37, 28.6, 10], [38.6, 27.6, 12.2], [40.2, 26.6, 12.4], [41.8, 27.6, 12.2], [43, 28.6, 10]].map(([x, h, z]) => S(x, h, z, 0.7, 0.7, 0.7, HN.web, { m: 'gloss', seg: 6 })),
    LA(18, 28, 4, [[2, 0], [2.4, 1], [2, 4], [0.6, 5], [0.6, 6.4], [1.2, 7]], '#cfe8f4', { m: 'glass', seg: 10 }), S(21.4, 31, 4, 1, 1, 1, HN.roseL, { m: 'gloss', seg: 6 }),
    B(27, 28.6, 6, 6, 1.2, 2.4, HN.silver, MT),
  ], { glow: [HN.gem] }),

  // a tall gothic window: a pointed arch of ebony tracery, moonlit night in its panes, a full moon, a stone sill and
  // torn plum drapes hanging off a rod (a tap: moonlight on and off)
  wallPiece('hntwindow', 'Manor gothic window', 1, 650, 'gloss', [
    PR(16, 38, 0.5, [[-12, 0], [12, 0], [12, 30], [9, 38], [0, 46], [-9, 38], [-12, 30]], 1, HN.eb, GL),
    PR(16, 40, 1.2, [[-10, 0], [10, 0], [10, 29.4], [7.6, 36.4], [0, 43], [-7.6, 36.4], [-10, 29.4]], 0.6, '#3c4c74', GW),
    DS(19.6, 70, 1.6, 3, 0.3, '#f2f4e8', { m: 'glow', seg: 12 }),
    RD([16, 40, 1.8], [16, 82, 1.8], 0.6, HN.eb, GL), RD([6, 62, 1.8], [26, 62, 1.8], 0.6, HN.eb, GL),
    RG(16, 74, 1.8, 3, 0.5, HN.eb, GL),
    B(16, 37.4, 2, 28, 2, 4, HN.stone, PL),
    RD([1.6, 86, 3.4], [30.4, 86, 3.4], 0.6, HN.silverD, MT), ...[1.6, 30.4].map(x => S(x, 86, 3.4, 1.1, 1.1, 1.1, HN.silverD, { m: 'metal', seg: 6 })),
    PR(5, 33, 3.4, [[-4, 52], [4, 52], [3, 30], [5, 18], [2, 10], [3, 0], [1, 4], [-1, 0], [-2, 6], [-4, 2]], 1.2, HN.plum, CL),
    PR(27.6, 56, 3.4, [[-3, 30], [3.4, 30], [3.4, 4], [2, 0], [0, 6], [-1.6, 1], [-3, 10]], 1.2, HN.plumL, CL),
    ...webFan(8.6, 38.4, 1.6, 6, 6).slice(0, 5),
  ], { glow: ['#3c4c74', '#f2f4e8'] }),

  // the family portraits in tarnished gilt: great-grandmother Chandelure, grandfather Banette and uncle Dusknoir, each
  // over a silver nameplate, a cobweb on the first frame
  wallPiece('hntportraits', 'Manor Ghost family portraits', 2, 720, 'metal', [
    ...[[11, 58, 15, 19, chandelure], [32, 62, 18, 24, banette], [53, 58, 15, 19, dusknoir]].flatMap(([x, h, w, hh, fn]) => [
      B(x, h, 0.8, w + 4, hh + 4, 1.6, HN.gold, MT), PC(x, h, 1.65, w, hh, fn),
      B(x, h - hh / 2 - 4, 0.8, 7, 1.8, 1, HN.silver, MT),
    ]),
    PR(32, 76, 0.8, [[-6, 0], [6, 0], [3, 2.4], [0, 4.4], [-3, 2.4]], 1.6, HN.gold, MT),
    ...webFan(1.4, 69.6, 1.8, 5, -5),
  ]),

  // a tarnished silver sconce: a shield of a backplate, a curling arm, a drip candle burning green in a glass chimney
  // (a tap: it gutters out, or catches again)
  wallPiece('hntsconce', 'Manor ghost-light sconce', 1, 360, 'metal', [
    PR(16, 50, 0.4, [[-4, 0], [4, 0], [6, 10], [4, 20], [0, 24], [-4, 20], [-6, 10]], 0.8, HN.silverD, MT),
    RD([16, 56, 0.8], [16, 54, 4], 0.6, HN.silver, MT), RD([16, 54, 4], [16, 57, 7], 0.6, HN.silver, MT),
    LA(16, 57, 7, [[1, 0], [3, 1.2], [3.4, 2]], HN.silver, { m: 'metal', seg: 10 }),
    ...candle(16, 58.4, 7, 5.6, 1),
    LA(16, 59, 7, [[2.4, 0], [3.4, 3], [3.4, 7], [2.2, 10]], '#cfe8f4', { m: 'glass', seg: 12 }),
    ...webFan(10.4, 60, 0.9, 4, 5).slice(0, 5),
  ], { glow: [HN.ghost] }),

  // a damask rug in faded plum and moss, a medallion at its heart, worn through in moth holes, its fringe frayed
  { id: 'hntrug', name: 'Manor moth-eaten damask rug', group: GROUP, solo: true, w: 2, h: 3, layer: 'rug', price: 900, high: 0.03, side: 'c', flat() {
    const g = ctx(), outline = () => { g.beginPath(); RUG.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
    g.fillStyle = HN.plum; outline(); g.fill();
    g.save(); outline(); g.clip();
    g.strokeStyle = HN.moss; g.lineWidth = 3; g.strokeRect(6, 6, 52, 84);
    g.strokeStyle = HN.goldL; g.lineWidth = 0.5; g.strokeRect(4.2, 4.2, 55.6, 87.6); g.strokeRect(7.8, 7.8, 48.4, 80.4);
    const fleur = (cx, cy, s, c) => {
      g.fillStyle = c; g.beginPath(); g.ellipse(cx, cy, s * 0.5, s, 0, 0, TAU); g.fill();
      for (const k of [-1, 1]) { g.beginPath(); g.ellipse(cx + k * s * 0.8, cy + s * 0.2, s * 0.35, s * 0.7, k * 0.6, 0, TAU); g.fill(); }
      g.fillRect(cx - s * 0.9, cy + s * 0.7, s * 1.8, s * 0.25);
    };
    for (let row = 0; row < 7; row++) for (let col = 0; col < 4; col++) { const cx = 14 + col * 12 + (row % 2) * 6, cy = 15 + row * 11; if (cx < 52 && Math.hypot((cx - 32) / 16, (cy - 48) / 22) > 1) fleur(cx, cy, 2, HN.plumL); }
    g.fillStyle = HN.mossD; g.beginPath(); g.ellipse(32, 48, 15, 21, 0, 0, TAU); g.fill();
    g.fillStyle = HN.moss; g.beginPath(); g.ellipse(32, 48, 13, 19, 0, 0, TAU); g.fill();
    fleur(32, 40, 4, HN.plumL); fleur(32, 56, 4, HN.plumL); fleur(32, 48, 2.4, HN.goldL);
    g.strokeStyle = HN.goldL; g.lineWidth = 0.5; g.beginPath(); g.ellipse(32, 48, 14, 20, 0, 0, TAU); g.stroke();
    for (let i = 0; i < 9; i++) {
      const hx = 8 + hash(i, 21, 1) * 48, hy = 8 + hash(i, 22, 2) * 80, r = 1 + hash(i, 23, 3) * 2.2;
      g.fillStyle = 'rgba(200,180,150,0.35)'; g.beginPath(); g.ellipse(hx, hy, r * 1.5, r * 1.2, 0, 0, TAU); g.fill();
      g.fillStyle = '#2a1a16'; g.beginPath(); g.ellipse(hx, hy, r, r * 0.8, hash(i, 24, 4) * 3, 0, TAU); g.fill();
    }
    g.restore();
    g.strokeStyle = HN.linenD; g.lineWidth = 0.4;
    for (let x = 4; x <= 60; x += 1.6) for (const [y, d] of [[2, -1], [94, 1]]) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + (hash(x * 10 | 0, y, 5) - 0.5), y + d * (1.2 + hash(x * 10 | 0, y, 6) * 0.8)); g.stroke(); }
  } },

  // a suit of armour gone dull on a stone plinth, a halberd in its fist, a moth-eaten plume, and two green eyes looking
  // out of the visor (a tap: it rattles)
  piece('hntarmour', 'Manor haunted armour', 1, 1, 1150, 'metal', [
    B(16, 2, 0, 24, 4, 18, HN.stone, PL),
    ...[12, 20].flatMap(x => [S(x, 5.5, 3, 2.6, 1.8, 5, HN.silverD, { m: 'metal', seg: 8 }), LA(x, 6, 0, [[2, 0], [2.6, 6], [2.2, 12]], HN.silver, { m: 'metal', seg: 10 }),
      S(x, 18.6, 0.6, 2.4, 2.2, 2.4, HN.silverL, { m: 'metal', seg: 8 }), C(x, 24, 0, 2.6, 9, HN.silver, { m: 'metal', seg: 10 })]),
    LA(16, 26, 0, [[6.6, 0], [6, 4], [5.4, 7]], HN.silverD, { m: 'metal', seg: 12 }),
    S(16, 39, 0.6, 7.4, 8, 5.6, HN.silver, { m: 'metal', seg: 14 }),
    C(16, 47.6, 0, 3.4, 2, HN.silverD, { m: 'metal', seg: 10 }),
    ...[7.6, 24.4].map(x => S(x, 44.5, 0, 3.6, 3, 4, HN.silver, { m: 'metal', seg: 10 })),
    RD([7.6, 42, 0], [6.4, 32, 1], 1.5, HN.silver, MT), RD([6.4, 32, 1], [8, 24, 3], 1.4, HN.silver, MT), S(8.4, 23, 3.4, 1.8, 2, 1.8, HN.silverD, { m: 'metal', seg: 8 }),
    RD([24.4, 42, 0], [26, 34, 2], 1.5, HN.silver, MT), RD([26, 34, 2], [26.4, 30, 4], 1.4, HN.silver, MT), S(26.8, 30, 4.4, 1.8, 2, 1.8, HN.silverD, { m: 'metal', seg: 8 }),
    RD([27, 4, 4.4], [27, 70, 4.4], 0.6, HN.wood, WD),
    PR(27, 57, 4.4, [[0.5, 0], [4.4, 1], [5.4, 5], [4.4, 9], [0.5, 10]], 0.6, HN.silverL, MT),
    PR(27, 70, 4.4, [[-0.8, 0], [0.8, 0], [0, 5]], 0.8, HN.silverL, MT),
    LA(16, 48.6, 0, [[3.6, 0], [4.6, 2], [4.8, 7], [4, 10], [2.4, 11.6], [0, 12.2]], HN.silver, { m: 'metal', seg: 12 }),
    B(16, 55.2, 4.4, 6.4, 1.4, 1, HN.pit, PL),
    ...[14.4, 17.6].map(x => S(x, 55.2, 4.9, 0.6, 0.45, 0.3, HN.ghost, { m: 'glow', seg: 6 })),
    S(14.6, 63.4, -2, 1.6, 3.4, 1.6, HN.plumL, { m: 'cloth', seg: 8 }),
    RD([16, 60.6, 0], [27, 66, 4.4], 0.18, HN.web, PL), RD([18.6, 59, 2], [27, 62, 4.4], 0.18, HN.web, PL), RD([21.4, 61.6, 2], [24.4, 57, 3.4], 0.18, HN.web, PL),
  ], { glow: [HN.ghost] }),

  // a silver birdcage on a tall stand, its domed bars and perch tarnished, and no bird in it: Shuppet floats there, its
  // horn crooked, its blue eyes shining (a tap: it rattles the bars)
  piece('hntbirdcage', 'Manor Shuppet birdcage', 1, 1, 980, 'metal', [
    LA(16, 0, 0, [[7, 0], [7, 0.8], [4, 2], [1.2, 3.4]], HN.silverD, { m: 'metal', seg: 12 }),
    C(16, 17, 0, 0.8, 28, HN.silverD, { m: 'metal', seg: 8 }),
    C(16, 31.4, 0, 2, 1, HN.silver, { m: 'metal', seg: 8 }),
    C(16, 33, 0, 9, 1.6, HN.silverD, { m: 'metal', seg: 16 }),
    ...Array.from({ length: 10 }, (_, i) => { const a = i / 10 * TAU + 0.31, x = 16 + Math.cos(a) * 8.6, z = Math.sin(a) * 8.6; return [RD([x, 33.8, z], [x, 50, z], 0.28, HN.silver, MT), RD([x, 50, z], [16 + Math.cos(a) * 2.6, 56, Math.sin(a) * 2.6], 0.28, HN.silver, MT)]; }).flat(),
    RG(16, 50, 0, 8.6, 0.35, HN.silver, { m: 'metal', flat: true }), RG(16, 41, 0, 8.6, 0.3, HN.silver, { m: 'metal', flat: true }),
    C(16, 56.6, 0, 3, 1.2, HN.silver, { m: 'metal', seg: 10 }), RG(16, 59.4, 0, 1.6, 0.4, HN.silverD, MT),
    RD([9, 38, 0], [23, 38, 0], 0.4, HN.wood, WD),
    PR(16, 38.6, 0, [[-2.6, 3], [0, 0], [2.6, 3]], 2, HN.shup, CL),
    S(16, 44, 0, 4.2, 3.8, 3.6, HN.shup, { m: 'cloth', seg: 12 }),
    PR(16, 47, 0, [[-1, 0], [1, 0], [2.6, 4.2], [0.4, 2.4]], 1.2, HN.shupD, CL),
    ...[14.4, 17.6].map(x => S(x, 44.6, 3.4, 0.9, 0.7, 0.4, HN.shupEye, { m: 'glow', seg: 6 })),
    RD([14.6, 42.4, 3.4], [17.4, 42.4, 3.4], 0.2, HN.shupD, PL),
    ...webFan(16, 56, 2.8, -7, -5).slice(0, 4),
  ], { glow: [HN.shupEye] }),

  // a cracked stone urn on a plinth, moss creeping up it, and in its soil Phantump: a stump of a Pokémon, leaves on its
  // head, red eyes in its hollow face, little branch arms out (a tap: it shakes its leaves)
  piece('hntphantump', 'Manor Phantump urn', 1, 1, 820, 'plain', [
    B(16, 2, 0, 20, 4, 20, HN.stoneD, PL),
    LA(16, 4, 0, [[4, 0], [3, 2], [3, 4], [6, 7], [9, 12], [9.6, 16], [8.6, 17], [9.6, 18.4]], HN.stone, { m: 'plain', seg: 14 }),
    RD([11.6, 9.4, 4.8], [13.6, 14.6, 7.6], 0.2, HN.stoneD, PL), RD([13.6, 14.6, 7.6], [12.8, 18, 8.8], 0.2, HN.stoneD, PL),
    S(8.6, 16.4, 4.4, 2, 1.4, 2, HN.moss, { m: 'cloth', seg: 8 }), S(22.6, 13, 4, 1.6, 1.2, 1.6, HN.mossL, { m: 'cloth', seg: 8 }),
    C(16, 22, 0, 8.4, 0.8, HN.woodD, { m: 'plain', seg: 14 }),
    LA(16, 22, 0, [[5, 0], [4.4, 2], [4.6, 8], [5.2, 10], [4.6, 10.8]], HN.phan, { m: 'wood', seg: 12 }),
    DS(16, 28, 4.6, 3.2, 0.6, HN.phanD, { m: 'plain', ry: 3.6, seg: 12 }),
    ...[14.6, 17.4].map(x => DS(x, 28.6, 5, 0.7, 0.3, HN.phanEye, { m: 'glow', seg: 8 })),
    ...[-1, 1].map(s => RD([16 + s * 4.4, 27, 1], [16 + s * 8.4, 30.4, 3], 0.8, HN.phanD, WD)),
    ...[[16, 35.4, 0, 5.6, 2.4], [12.4, 34.2, -1.4, 3, 2], [19.6, 34.2, -1.2, 3, 2], [16, 37.6, -0.6, 3.4, 1.8]].map(([x, h, z, rx, ry]) => S(x, h, z, rx, ry, rx, HN.leaf, { m: 'cloth', seg: 10 })),
  ], { glow: [HN.phanEye] }),

  // a canopy bed under torn plum drapes: tall ebony posts, a pointed gothic headboard, a ragged valance, dusty linen,
  // a plum coverlet and grey pillows, cobwebs strung between the posts
  piece('hntbed', 'Manor canopy bed', 2, 2, 1500, 'wood', [
    ...[[3, -29], [61, -29], [3, 29], [61, 29]].map(([x, z]) => LA(x, 0, z, [[2.2, 0], [2.2, 4], [1.4, 6], [1.6, 24], [2.4, 28], [1.4, 32], [1.2, 90], [1.8, 92], [0.8, 95], [0, 97]], HN.eb, { m: 'gloss', seg: 8 })),
    B(32, 91, -29, 58, 2.4, 2.4, HN.eb, GL), B(32, 91, 29, 58, 2.4, 2.4, HN.eb, GL), B(3, 91, 0, 2.4, 2.4, 56, HN.eb, GL), B(61, 91, 0, 2.4, 2.4, 56, HN.eb, GL),
    B(32, 93, 0, 60, 1, 60, HN.plumD, cl(0.4)),
    PR(32, 82, 29.8, [[-29, 10], [29, 10], [29, 3], [26, 0], [22, 4], [17, 1], [12, 5], [6, 0], [2, 4], [-3, 1], [-8, 5], [-13, 0], [-18, 4], [-22, 1], [-26, 4], [-29, 2]], 1, HN.plum, CL),
    ...[1.6, 62.4].map(x => B(x, 88, 0, 0.8, 7, 58, HN.plum, cl(0.3))), B(32, 88, -29.8, 58, 7, 0.8, HN.plum, cl(0.3)),
    PR(6.6, 30, 27.6, [[-3, 58], [3, 58], [3, 40], [4, 22], [2, 8], [3, 0], [1, 4], [-1, 0], [-2, 6], [-3, 1]], 1.4, HN.plumL, CL),
    PR(57.4, 48, 27.6, [[-3, 40], [3, 40], [3, 16], [2, 0], [0, 6], [-2, 1], [-3, 10]], 1.4, HN.plumL, CL),
    ...[6.6, 57.4].map(x => B(x, 50, -27.4, 6, 76, 1.4, HN.plumL, cl(1))),
    B(32, 36, -28.5, 54, 28, 2.4, HN.eb, GL), B(32, 37, -27.1, 44, 20, 0.4, HN.plum, cl(0.4)),
    PR(32, 50, -28.5, [[-27, 0], [27, 0], [27, 4], [12, 8], [0, 16], [-12, 8], [-27, 4]], 2.4, HN.eb, GL),
    B(32, 17, 28.6, 54, 14, 2.4, HN.eb, GL),
    B(32, 10, 0, 56, 6, 54, HN.eb, GL),
    B(32, 16, 0, 54, 6, 52, HN.linen, cl(1.6)),
    B(32, 19.6, 5, 55, 1.6, 42, HN.plum, cl(0.8)),
    ...[20, 44].map(x => S(x, 21, -21, 9, 3, 4.6, HN.linenD, { m: 'cloth', seg: 10 })),
    ...webFan(4.4, 81, 29.6, 7, -7), ...webFan(59.6, 81, 29.6, -7, -7),
  ]),

  // a marble bust on a fluted column, cracked through, its blank eyes lit green (a tap: it turns to watch you)
  piece('hntbust', 'Manor watching bust', 1, 1, 640, 'gloss', [
    LA(16, 0, 0, [[7, 0], [7, 2], [5, 3], [4, 5], [3.4, 8], [3.4, 24], [4.4, 26], [6, 28], [6, 30]], HN.marble, { m: 'gloss', seg: 12 }),
    RD([15, 12, 3.5], [17, 18, 3.5], 0.18, HN.marbleD, PL),
    S(16, 33.6, 0, 8, 4, 4.6, HN.marble, { m: 'gloss', seg: 12 }),
    C(16, 39, 0, 2.2, 4, HN.marble, { m: 'gloss', seg: 10 }),
    S(16, 45, 0.6, 3.8, 4.8, 4.2, HN.marble, { m: 'gloss', seg: 12 }),
    S(16, 48.4, -0.6, 4, 2.8, 4, HN.marbleD, { m: 'gloss', seg: 10 }),
    S(16, 45, 4.8, 0.5, 0.9, 0.5, HN.marble, { m: 'gloss', seg: 6 }),
    ...[14.6, 17.4].map(x => S(x, 46, 4.3, 0.55, 0.4, 0.3, HN.ghost, { m: 'glow', seg: 6 })),
    RD([13.6, 48, 3.4], [16.4, 44, 4.4], 0.16, HN.marbleD, PL),
    ...webFan(9.4, 30.4, 3.6, -2.6, -6).slice(0, 5),
  ], { glow: [HN.ghost] }),

  // a wrought-iron candle stand on three feet: a crown of five drip candles and a tall one in the middle, every flame
  // burning green (a tap snuffs them, or lights them again)
  piece('hntcandles', 'Manor iron candle stand', 1, 1, 480, 'metal', [
    ...[0, 1, 2].flatMap(i => { const a = i / 3 * TAU + Math.PI / 2, x = 16 + Math.cos(a) * 7, z = Math.sin(a) * 7; return [RD([x, 0.6, z], [16, 6, 0], 0.7, HN.iron, MT), S(x, 0.8, z, 1.1, 0.8, 1.1, HN.iron, { m: 'metal', seg: 6 })]; }),
    C(16, 25, 0, 0.8, 38, HN.iron, { m: 'metal', seg: 8 }),
    RG(12, 20, 0, 2.4, 0.35, HN.iron, { m: 'metal', arc: Math.PI * 1.5, a0: 0 }), RG(20, 28, 0, 2.4, 0.35, HN.iron, { m: 'metal', arc: Math.PI * 1.5, a0: Math.PI }),
    RG(16, 44, 0, 7, 0.5, HN.iron, { m: 'metal', flat: true }),
    ...[6, 4, 7.5, 3, 5].flatMap((up, i) => { const a = i / 5 * TAU + 0.3, x = 16 + Math.cos(a) * 7, z = Math.sin(a) * 7; return [RD([16, 40, 0], [x, 44, z], 0.4, HN.iron, MT), C(x, 44.6, z, 1.6, 1.2, HN.ironL, { m: 'metal', seg: 8 }), ...candle(x, 45.2, z, up, 0.9)]; }),
    C(16, 44.6, 0, 1.6, 1.2, HN.ironL, { m: 'metal', seg: 8 }), ...candle(16, 45.2, 0, 8, 1.1),
  ], { glow: [HN.ghost] }),

  // a narrow hall table: a marble top on turned ebony legs, a silver urn of dead roses, petals fallen, a silver tray of
  // calling cards nobody came to collect, old books on the shelf below
  piece('hntconsole', 'Manor dead-rose hall table', 2, 1, 860, 'wood', [
    ...[[6, 9], [58, 9], [6, -9], [58, -9]].map(([x, z]) => LA(x, 0, z, [[1.4, 0], [1, 3], [1.8, 8], [1, 14], [1.6, 22], [2, 26], [2, 27]], HN.eb, { m: 'gloss', seg: 8 })),
    B(32, 6, 0, 56, 1.4, 20, HN.eb, GL),
    B(32, 26, 0, 58, 4, 22, HN.eb, GL), ...[20, 44].map(x => S(x, 26, 11.4, 0.8, 0.8, 0.6, HN.silver, { m: 'metal', seg: 6 })),
    B(32, 29, 0, 64, 2, 24, HN.marble, GL),
    LA(32, 30, -2, [[2.4, 0], [1.6, 1], [1.4, 2], [3.6, 5], [4, 8], [2.4, 11], [2, 12], [3, 13]], HN.silver, { m: 'metal', seg: 12 }),
    ...[[-4, 10], [-1.5, 13], [1.4, 12], [3.8, 9], [0.4, 15.4]].flatMap(([dx, dh]) => [RD([32 + dx * 0.3, 42, -2], [32 + dx, 42 + dh, -2 + dx * 0.2], 0.25, HN.mossD, PL), S(32 + dx, 42 + dh, -2 + dx * 0.2, 1.6, 1.5, 1.6, HN.rose, { m: 'cloth', seg: 8 })]),
    RD([31, 42, -2], [26, 46, -1], 0.25, HN.mossD, PL), S(25.4, 44, -0.8, 1.4, 1.6, 1.4, HN.rose, { m: 'cloth', seg: 8 }),
    ...[[20, 6], [23, 8], [38, 7]].map(([x, z]) => S(x, 30.3, z, 0.9, 0.3, 0.7, HN.roseL, { m: 'plain', seg: 6 })),
    C(50, 30.4, 3, 5, 0.8, HN.silver, { m: 'metal', seg: 14 }), B(50, 31.1, 3, 4, 0.4, 2.6, HN.paper, PL), B(51, 31.5, 2, 4, 0.4, 2.6, HN.linen, PL),
    B(13, 8, 0, 10, 2, 7, HN.plum, cl(0.3)), B(13.4, 10, 0, 9, 2, 6.6, HN.moss, cl(0.3)), B(12.8, 12, 0, 8, 2, 6, HN.rose, cl(0.3)),
    ...webFan(32, 43, -2, 6, 8).slice(0, 5), ...webFan(7.4, 6.8, 9.6, 0, 18).slice(0, 1),
  ]),

  // an ebony coat stand: a top hat on top, a tattered black cloak and a moss scarf still on its hooks, a furled umbrella
  // and a silver-knobbed cane leaning in (a tap: the cloak stirs)
  piece('hntcoatstand', 'Manor coat stand', 1, 1, 440, 'wood', [
    ...[0, 1, 2, 3].map(i => { const a = i / 4 * TAU + Math.PI / 4; return RD([16, 4, 0], [16 + Math.cos(a) * 9, 0.6, Math.sin(a) * 9], 0.8, HN.eb, GL); }),
    LA(16, 3, 0, [[1.6, 0], [1.2, 4], [1.2, 56], [1.8, 58], [1.4, 60], [0, 62]], HN.eb, { m: 'gloss', seg: 8 }),
    ...[0, 1, 2, 3].map(i => { const a = i / 4 * TAU + Math.PI / 4; return RD([16, 55, 0], [16 + Math.cos(a) * 4, 58, Math.sin(a) * 4], 0.4, HN.silverD, MT); }),
    PR(13, 14, 2.6, [[-1, 42], [3, 42], [4, 30], [6, 14], [5, 2], [3, 4], [1.5, 0], [0, 5], [-2, 1], [-3, 8], [-4.4, 4], [-5, 10], [-3, 28]], 2.4, HN.ebL, CL),
    B(20.6, 46, 2.2, 3.4, 18, 1, HN.moss, cl(0.5)), ...[19.6, 21.6].map(x => RD([x, 37, 2.8], [x, 35, 2.8], 0.2, HN.mossL, PL)),
    C(16, 65.4, 0, 5.4, 0.7, HN.ebD, { m: 'gloss', seg: 12 }), C(16, 69.4, 0, 3.4, 7.4, HN.ebD, { m: 'gloss', seg: 12 }), C(16, 67, 0, 3.45, 1.2, HN.plum, { m: 'cloth', seg: 12 }),
    RD([22.4, 1, 4], [24.4, 26, 2.6], 0.4, HN.eb, GL), RD([22.6, 6, 3.9], [24, 22, 2.8], 1.4, HN.ebL, CL), RG(25.8, 26.4, 2.6, 1.5, 0.4, HN.wood, { m: 'wood', arc: Math.PI, a0: 0 }),
    RD([8, 0.6, -5], [10, 34, -4], 0.5, HN.woodL, WD), S(10, 34.6, -4, 1, 1, 1, HN.silver, { m: 'metal', seg: 8 }),
  ]),
];
