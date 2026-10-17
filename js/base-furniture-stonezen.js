/* base-furniture-stonezen.js  -  the Stone zen set (furniture expansion session h, 2026-10-17): a Japanese stone garden for
   the Secret Base's backyard. Grey granite and dark slate, moss, raked white gravel, weathered stone, a little dark cedar
   and bamboo, black iron: a slab bench and slate table, stone lanterns (a tall kasuga, a low snow-viewing yukimi), a
   tsukubai basin fed by a bamboo spout, a five-tier pagoda, a slab bridge, a hokora shrine, a niwaki pine in a stone pot,
   a sundial, raked gravel beds, stepping stones and a dry stream. Roggenrola among the rock trio, a Lotad on the koi
   basin's lily pad, a Geodude carved in a boulder, Stonjourner as a standing stone and Bronzor on a pedestal. Every kind
   `outdoor`, on the garden catalogue's Zen tab (js/garden-shop.js's GARDEN_TABS); all solo, fixed colours, sold all year.
   As js/base-furniture-irongarden.js: an upright piece is a list of parts in painted units (32 a tile), `x` across from
   the left of its front, `h` up from the floor, `z` out to the front from its middle, painted here from any side and
   built as the same 3D parts by js/base-models-stonezen.js (BUILT), so picture and model agree. New here: `rock`, a lumpy
   stone whose front outline (rockOutline(), shared by both files) is the model's silhouette too, and `sq` on a lathe (a
   square-sectioned roof or pot, its half-width r seen from the front). `stone` parts are speckled and `moss` parts dabbed
   in the painting only. The sundial's face and the signboard are `pic`s, their models crops of the painting. The four
   ground pieces (gravel beds, stepping stones, the dry stream) are painted from above (RUGS, their outlines). */

import { sh, oval, ovalShade, floorShadow, ctx, hash, glass as glassPane } from './base-paint.js';

export const ZN = {
  granite: '#a5a49c', graniteL: '#c4c2b8', graniteD: '#7e7d76', slate: '#4d535a', slateL: '#6b737b', slateD: '#33383e',
  weather: '#b6b0a2', weatherD: '#8f8a7e', lichen: '#c9c79a', moss: '#6e8e3c', mossL: '#93ae54', mossD: '#4e6a2a',
  gravel: '#e6e2d6', gravelD: '#c6c0ae', gravelL: '#f7f4ec', pebble: '#8d979f', pebbleL: '#b3bbc1', pebbleD: '#66707a',
  cedar: '#5a3a26', cedarL: '#7c5538', cedarD: '#3e271a', bamboo: '#b4b26a', bambooD: '#868646', bambooL: '#d4d08c',
  iron: '#2f2d2b', rope: '#d6c492', ropeD: '#2a2420', paper: '#f6f2e8', glow: '#ffe2a2', water: '#5e9eae', waterL: '#9ccfd6',
  soil: '#4a3424', celadon: '#a9c4ae', china: '#f4f0e6', bark: '#6a4a34', barkD: '#4c3424', pine: '#3e6a34', pineL: '#5c8c46',
  pineD: '#2c4e26', straw: '#bfa064', lily: '#4f9a44', koi: '#ee6e2e', koiW: '#f8f4ee', koiG: '#f0b234', ink: '#22262a',
  white: '#f8f6f0', red: '#c23a30',
  rogg: '#34467e', roggD: '#24305a', roggC: '#d4683c', roggY: '#f2c43c', roggF: '#8a5a3a',
  stonj: '#9b978d', stonjD: '#6f6b63', lotad: '#5a8ad6', lotadL: '#8cb6ec', lotadLeaf: '#5ab04a', beak: '#f0c040',
  bronzor: '#3f8f96', bronzorL: '#7cc6c4', bronzorD: '#2a6a70', eye: '#f2a032',
};
const GROUP = 'Stone zen', TAB = 'Zen';
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
/** A lumpy stone standing on h, rx wide each way, hh tall, rz deep each way; `seed` shapes it, `amp` how lumpy, `base`
    how much of its round is cut off flat underneath (more for a tall standing stone). */
const RK = (x, h, z, rx, hh, rz, c, o) => ({ t: 'rock', x, h, z, rx, hh, rz, c, seed: 1, ...o });

const ST = { m: 'stone' }, MS = { m: 'moss' }, WD = { m: 'wood' }, GL = { m: 'gloss' }, PL = { m: 'plain' }, GW = { m: 'glow' }, GS = { m: 'glass' };
const HEX = { seg: 6, ry: Math.PI / 6 };

/** The front outline of a rock part: points round it, x from -1 to 1 and y from 0 (its flat foot) to 1. */
export function rockOutline(q, n = 28) {
  const s = q.seed ?? 1, amp = q.amp ?? 0.13, base = q.base ?? 0.35;
  const p = [hash(s, 1, 7) * TAU, hash(s, 2, 7) * TAU, hash(s, 3, 7) * TAU];
  const f = (a) => 1 + amp * (0.55 * Math.sin(2 * a + p[0]) + 0.3 * Math.sin(3 * a + p[1]) + 0.25 * Math.sin(5 * a + p[2]));
  let x0 = Infinity, x1 = -Infinity, top = -Infinity, fmax = 0;
  for (let i = 0; i < 180; i++) {
    const a = i / 180 * TAU, k = f(a), px = Math.cos(a) * k, py = Math.max(-base, Math.sin(a) * k);
    x0 = Math.min(x0, px); x1 = Math.max(x1, px); top = Math.max(top, py); fmax = Math.max(fmax, k);
  }
  const cx = (x0 + x1) / 2, hx = (x1 - x0) / 2, pts = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU, k = f(a);
    pts.push([(Math.cos(a) * k - cx) / hx, (Math.max(-base, Math.sin(a) * k) + base) / (top + base)]);
  }
  return { f, base, cx, hx, top, fmax, pts };
}

/** Points along a bow from x0 to x1 at height h rising `rise` in the middle (sagging when negative), at z. */
const bow = (x0, x1, h, rise, z, n = 8) => Array.from({ length: n + 1 }, (_, i) => [x0 + (x1 - x0) * i / n, h + rise * Math.sin(Math.PI * i / n), z]);
/** Rods joining points in turn. */
const line = (pts, r, c, o) => pts.slice(1).map((p, i) => RD(pts[i], p, r, c, o));
/** A cushion of moss on the ground (or on h). */
const tuft = (x, h, z, r, c = ZN.moss) => S(x, h + r * 0.3, z, r, r * 0.55, r * 0.8, c, { m: 'moss', seg: 8 });
/** A bamboo pole from a to b, its nodes darker rings every `every` units. */
function pole(a, b, r, every = 9) {
  const out = [RD(a, b, r, ZN.bamboo, { m: 'wood', seg: r >= 1.2 ? 8 : 6 })], len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  if (Math.abs(b[1] - a[1]) > len * 0.9) for (let t = every; t < len - 1; t += every) {
    const k = t / len;
    out.push(C(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k, r * 1.14, 0.6, ZN.bambooD, { m: 'wood', seg: 8 }));
  }
  return out;
}
/** A lantern or pagoda's jewel finial (hōju) standing on h. */
const hoju = (x, h, z, s = 1, c = ZN.granite) => LA(x, h, z, [[2.4 * s, 0], [3 * s, 1 * s], [2.2 * s, 2.2 * s], [2.9 * s, 3.4 * s], [2.6 * s, 4.8 * s], [1.4 * s, 6.4 * s], [0, 7.6 * s]], c, { m: 'stone', seg: 8 });

/* ---------- painting the parts ---------- */

const alphaOf = (hex, a) => { const v = parseInt(hex.slice(1), 16); return `rgba(${v >> 16},${(v >> 8) & 255},${v & 255},${a})`; };
function grad(g, x0, y0, x1, y1, c, m) {
  const l = g.createLinearGradient(x0, y0, x1, y1);
  if (m === 'glow') [[0, sh(c, 2)], [0.5, sh(c, 1)], [1, c]].forEach(s => l.addColorStop(...s));
  else [[0, sh(c, 1)], [0.35, c], [1, sh(c, -1)]].forEach(s => l.addColorStop(...s));
  return l;
}
function rbx(x, y, w, h, r, c, m) {
  if (w <= 0 || h <= 0) return;
  const g = ctx();
  if (m === 'glass') { g.save(); g.globalAlpha *= 0.4; glassPane(x, y, w, h, '#cfe8f4'); g.restore(); return; }
  if (m === 'plain') { g.fillStyle = c; g.beginPath(); g.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); g.fill(); return; }
  g.fillStyle = grad(g, x, y, x + w * 0.3, y + h, c, m); g.beginPath(); g.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); g.fill();
  if (h > 3 && w > 3 && m !== 'moss') { g.save(); g.globalAlpha *= m === 'stone' ? 0.25 : 0.4; g.fillStyle = sh(c, 2); g.fillRect(x + Math.min(r, w / 2) * 0.6, y + 0.3, w - Math.min(r, w / 2) * 1.2, 0.5); g.restore(); }
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
  if (m === 'gloss' && rx > 0.8) { g.save(); g.globalAlpha *= 0.55; oval(cx - rx * 0.38, cy - ry * 0.42, rx * 0.22, ry * 0.14, '#ffffff'); g.restore(); }
}
const polyPath = (pts) => { const p = new Path2D(); pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); p.closePath(); return p; };
const bounds = (pts) => { const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; };

/** The painted-only surface of a part inside its outline `path` over bounds bb: its own `tex`, or a stone's speckle and
    moss's dabs by default (`tex: 'none'` for neither). */
function texture(q, path, bb) {
  const tex = q.tex ?? (q.m === 'stone' ? 'speck' : q.m === 'moss' ? 'mossy' : null);
  if (!tex || tex === 'none') return;
  const g = ctx(), [x0, y0, x1, y1] = bb, c = q.c, area = (x1 - x0) * (y1 - y0);
  if (area < 2) return;
  g.save(); g.clip(path);
  if (tex === 'speck') {
    const n = Math.round(area / 3.2);
    for (let i = 0; i < n; i++) {
      const px = x0 + hash(i, 21, q.x * 7 + q.z) * (x1 - x0), py = y0 + hash(i, 22, q.h * 7) * (y1 - y0), v = hash(i, 23, q.x);
      g.globalAlpha = 0.5; g.fillStyle = v < 0.5 ? sh(c, -2) : v < 0.85 ? sh(c, 2) : ZN.lichen;
      g.fillRect(px, py, 0.6, 0.6);
    }
  } else if (tex === 'mossy' || tex === 'needles') {
    const n = Math.round(area / (tex === 'needles' ? 3 : 4));
    for (let i = 0; i < n; i++) {
      const px = x0 + hash(i, 11, q.x * 7) * (x1 - x0), py = y0 + hash(i, 12, q.h * 7) * (y1 - y0), v = hash(i, 13, q.z * 3);
      g.globalAlpha = 0.8; g.fillStyle = v < 0.5 ? sh(c, -1) : sh(c, 1);
      g.beginPath();
      if (tex === 'needles') g.ellipse(px, py, 1.6, 0.4, (hash(i, 14) - 0.5) * 0.8, 0, TAU);
      else g.ellipse(px, py, 1, 0.8, hash(i, 14) * Math.PI, 0, TAU);
      g.fill();
    }
  } else if (tex === 'slate') {
    g.strokeStyle = sh(c, -1); g.globalAlpha = 0.7; g.lineWidth = 0.35;
    for (let y = y0 + 1.6, i = 0; y < y1; y += 1.8 + hash(i++, 31, q.x) * 1.4) { g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y + (hash(i, 32) - 0.5) * 0.8); g.stroke(); }
    g.fillStyle = sh(c, 1); g.globalAlpha = 0.35;
    for (let i = 0; i < area / 9; i++) g.fillRect(x0 + hash(i, 33, q.h) * (x1 - x0), y0 + hash(i, 34, q.x) * (y1 - y0), 1.2, 0.4);
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
    const m = q.m || 'stone', cx = U(q.x, q.z), cy = b - q.h, qm = { ...q, m };
    switch (q.t) {
      case 'box': {
        const w = side ? q.d : q.w, p = new Path2D(); rbx(cx - w / 2, cy - q.hh / 2, w, q.hh, q.r, q.c, m);
        p.roundRect(cx - w / 2, cy - q.hh / 2, w, q.hh, Math.min(q.r, w / 2, q.hh / 2)); texture(qm, p, [cx - w / 2, cy - q.hh / 2, cx + w / 2, cy + q.hh / 2]);
        break;
      }
      case 'cyl': {
        const rb = q.rb ?? q.r, top = cy - q.hh / 2, bot = cy + q.hh / 2, pts = [[cx - q.r, top], [cx + q.r, top], [cx + rb, bot], [cx - rb, bot]];
        poly(pts, q.c, m, m !== 'glow' && m !== 'moss');
        texture(qm, polyPath(pts), bounds(pts));
        if (m !== 'glass' && !q.noTop) oval(cx, top, q.r, Math.min(q.r * 0.22, Math.max(0.3, q.hh / 2)), sh(q.c, m === 'glow' ? 2 : 1));
        break;
      }
      case 'ball': {
        const rx = side ? q.rz : q.rx, p = new Path2D(); ball(cx, cy, rx, q.ry, q.c, m);
        p.ellipse(cx, cy, rx, q.ry, 0, 0, TAU); texture(qm, p, [cx - rx, cy - q.ry, cx + rx, cy + q.ry]);
        break;
      }
      case 'disc': if (side) rbx(cx - q.th / 2, cy - (q.ry ?? q.r), q.th, (q.ry ?? q.r) * 2, q.th / 2, q.c, m); else ball(cx, cy, q.r, q.ry ?? q.r, q.c, m); break;
      case 'lathe': {
        const rot = q.rot || 0, c = Math.cos(rot), s = Math.sin(rot), rmax = Math.max(...q.pts.map(p => p[0])), len = Math.max(...q.pts.map(p => p[1]));
        if (side && rot) { const mid = cy - c * len / 2; ball(cx, mid, rmax, (len * Math.abs(c) + 2 * rmax * Math.abs(s)) / 2, q.c, m); break; }
        const P = (dx, up) => [cx + flip * (dx * c - up * s), cy - (dx * s + up * c)];
        const pts = [...q.pts.map(([r, up]) => P(-r, up)), ...q.pts.slice().reverse().map(([r, up]) => P(r, up))];
        poly(pts, q.c, m, m !== 'glow' && !rot && m !== 'moss');
        texture(qm, polyPath(pts), bounds(pts));
        if (m === 'gloss' && rmax > 1.2) {
          const at = q.pts.find(p => p[0] === rmax), [hx, hy] = P(-rmax * 0.48, at[1] * 0.92);
          g.save(); g.globalAlpha *= 0.5; oval(hx, hy, rmax * 0.14, Math.max(0.4, len * 0.1), '#ffffff'); g.restore();
        }
        if (rot || q.noTop || m === 'glass' || (q.pts[q.pts.length - 1][0] < 0.01 && q.pts.length > 2)) break;
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
        g.save(); g.globalAlpha *= 0.45; g.strokeStyle = sh(q.c, 2); g.lineWidth = q.tr * 0.6;
        if (q.flat) { g.beginPath(); g.ellipse(cx, cy - q.tr * 0.4, q.r, q.r * 0.22, 0, Math.PI, TAU); } else path(-q.tr * 0.4);
        g.stroke(); g.restore();
        break;
      }
      case 'rod': {
        const p0 = [U(q.a[0], q.a[2]), b - q.a[1]], p1 = [U(q.b[0], q.b[2]), b - q.b[1]];
        if (Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) < 0.05) { ball(p0[0], p0[1], q.r, q.r, q.c, m); break; }
        g.lineCap = 'round'; g.strokeStyle = m === 'glass' ? alphaOf('#cfe8f4', 0.55) : q.c; g.lineWidth = q.r * 2;
        g.beginPath(); g.moveTo(...p0); g.lineTo(...p1); g.stroke();
        if (q.r > 0.55 && m !== 'glass' && m !== 'plain') {
          g.save(); g.globalAlpha *= 0.45; g.strokeStyle = sh(q.c, 2); g.lineWidth = q.r * 0.6;
          g.beginPath(); g.moveTo(p0[0] - q.r * 0.35, p0[1] - q.r * 0.2); g.lineTo(p1[0] - q.r * 0.35, p1[1] - q.r * 0.2); g.stroke(); g.restore();
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
        texture(qm, polyPath(pts), bounds(pts));
        break;
      }
      case 'rock': {
        const { pts: o } = rockOutline(q), half = side ? q.rz : q.rx, f = dir === 2 ? -1 : 1;
        const pts = o.map(([px, py]) => [cx + f * px * half, cy - py * q.hh]);
        poly(pts, q.c, m);
        texture(qm, polyPath(pts), bounds(pts));
        g.save(); g.clip(polyPath(pts)); g.globalAlpha *= 0.3; g.fillStyle = sh(q.c, -2);
        g.fillRect(cx - half, cy - q.hh * 0.18, half * 2, q.hh * 0.18); g.restore();
        break;
      }
      case 'pic': g.save(); g.beginPath(); g.rect(cx - q.w / 2, cy - q.hh / 2, q.w, q.hh); g.clip(); q.fn(g, cx - q.w / 2, cy - q.hh / 2, q.w, q.hh); g.restore(); break;
    }
  }
}

/* ---------- pictures ---------- */

/** The sundial's face: a slate disc on the weathered pillar, white hour lines fanning down from the gnomon's root. */
function dial(g, x, y, w, h) {
  const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2;
  g.fillStyle = ZN.weather; g.fillRect(x, y, w, h);
  g.fillStyle = ZN.slateD; g.beginPath(); g.arc(cx, cy, r * 0.98, 0, TAU); g.fill();
  g.fillStyle = ZN.slate; g.beginPath(); g.arc(cx, cy, r * 0.86, 0, TAU); g.fill();
  const ox = cx, oy = cy - r * 0.5;
  g.strokeStyle = ZN.paper; g.lineCap = 'round';
  for (let i = 0; i <= 12; i++) {
    const a = Math.PI * i / 12, big = i % 3 === 0, len = r * (big ? 1.18 : 1.06);
    g.lineWidth = r * (big ? 0.05 : 0.03); g.globalAlpha = big ? 0.95 : 0.7;
    g.beginPath(); g.moveTo(ox + Math.cos(a) * r * 0.28, oy + Math.sin(a) * r * 0.28); g.lineTo(ox + Math.cos(a) * len, oy + Math.sin(a) * len); g.stroke();
  }
  g.globalAlpha = 1;
  g.save(); g.beginPath(); g.arc(cx, cy, r * 0.86, 0, TAU); g.clip();
  g.lineWidth = r * 0.035; g.beginPath(); g.arc(ox, oy, r * 1.22, 0.1, Math.PI - 0.1); g.stroke(); g.restore();
  g.fillStyle = ZN.paper; g.beginPath(); g.arc(ox, oy, r * 0.12, 0, TAU); g.fill();
  for (let k = 0; k < 8; k++) { const a = k * TAU / 8; g.fillRect(ox + Math.cos(a) * r * 0.2 - r * 0.02, oy + Math.sin(a) * r * 0.2 - r * 0.02, r * 0.04, r * 0.04); }
}

/** The signboard: grey slate, a white brushed ensō round a cairn of three stones, a red seal in its corner. */
function signArt(g, x, y, w, h) {
  g.fillStyle = ZN.slate; g.fillRect(x, y, w, h);
  g.strokeStyle = ZN.slateD; g.lineWidth = 0.3; g.globalAlpha = 0.8;
  for (let i = 0, yy = y + 1.4; yy < y + h; yy += 1.6 + hash(i++, 41) * 1.2) { g.beginPath(); g.moveTo(x, yy); g.lineTo(x + w, yy + (hash(i, 42) - 0.5) * 0.6); g.stroke(); }
  g.globalAlpha = 1;
  g.strokeStyle = ZN.cedarD; g.lineWidth = 0.8; g.strokeRect(x + 0.4, y + 0.4, w - 0.8, h - 0.8);
  const cx = x + w * 0.42, cy = y + h * 0.5, R = h * 0.34;
  g.fillStyle = ZN.paper;
  for (let i = 0; i < 40; i++) {
    const a = -1.1 + i / 40 * (TAU - 0.7), t = i / 40, lw = R * (0.08 + 0.16 * Math.sin(Math.PI * Math.min(1, t * 1.15)));
    g.globalAlpha = 0.92 - t * 0.2; g.beginPath(); g.arc(cx + Math.cos(a) * R, cy + Math.sin(a) * R, lw, 0, TAU); g.fill();
  }
  g.globalAlpha = 1;
  for (const [dy, rx, ry] of [[R * 0.42, R * 0.46, R * 0.2], [R * 0.02, R * 0.34, R * 0.16], [-R * 0.3, R * 0.22, R * 0.12]]) { g.beginPath(); g.ellipse(cx, cy + dy, rx, ry, 0, 0, TAU); g.fill(); }
  g.fillStyle = ZN.red; g.fillRect(x + w * 0.78, y + h * 0.62, w * 0.1, w * 0.1);
  g.fillStyle = ZN.paper; g.fillRect(x + w * 0.8, y + h * 0.66, w * 0.06, w * 0.015); g.fillRect(x + w * 0.82, y + h * 0.64, w * 0.015, w * 0.06);
  g.fillStyle = ZN.paper; g.globalAlpha = 0.85;
  for (let k = 0; k < 3; k++) g.fillRect(x + w * 0.8, y + h * (0.16 + k * 0.13), w * 0.06, h * 0.06);
  g.globalAlpha = 1;
}

/* ---------- the kinds ---------- */

/** What js/base-models-stonezen.js builds for each upright kind: its parts and default material. */
export const BUILT = {};
const rr = (w, h, r = 3) => {
  const pts = [], k = 4;
  for (const [cx, cy, a0] of [[w - r, r, -Math.PI / 2], [w - r, h - r, 0], [r, h - r, Math.PI / 2], [r, r, Math.PI]]) {
    for (let i = 0; i <= k; i++) { const a = a0 + i / k * Math.PI / 2; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  }
  return pts;
};
/** Each ground piece's outline from above, in painted units across its tiles. */
export const RUGS = {
  stzgravel: rr(94, 94, 4).map(([x, y]) => [x + 1, y + 1]),
  stzwaves: rr(62, 62, 4).map(([x, y]) => [x + 1, y + 1]),
  stzsteps: rr(30, 94, 5).map(([x, y]) => [x + 1, y + 1]),
  stzstream: rr(94, 62, 6).map(([x, y]) => [x + 1, y + 1]),
};

function piece(id, name, w, h, price, parts, rest = {}) {
  BUILT[id] = { parts, mat: 'stone' };
  return { id, name, group: GROUP, solo: true, outdoor: true, yard: TAB, w, h, price, ...rest, draw(x, b, vw, dir) { floorShadow(x, b, vw); paintParts(parts, x, b, vw, dir, w * 32); } };
}
const ground = (id, name, w, h, price, flat) => ({ id, name, group: GROUP, solo: true, outdoor: true, yard: TAB, w, h, layer: 'rug', price, high: 0.04, side: 'c', flat });

/* ---------- the ground pieces, painted from above ---------- */

/** Gravel grains over the box. */
function grains(g, x0, y0, w, h, seed, n = w * h / 5) {
  for (let i = 0; i < n; i++) {
    const v = hash(i, seed, 3);
    g.fillStyle = v < 0.4 ? ZN.gravelD : v < 0.8 ? ZN.gravelL : ZN.pebbleL; g.globalAlpha = 0.55;
    g.fillRect(x0 + hash(i, seed, 1) * w, y0 + hash(i, seed, 2) * h, 0.8, 0.8);
  }
  g.globalAlpha = 1;
}
/** A raked groove along the path drawn by `trace(g)`: a shadow, then a lit edge just below it. */
function groove(g, trace, lw = 0.7) {
  g.strokeStyle = ZN.gravelD; g.lineWidth = lw; g.beginPath(); trace(g, 0); g.stroke();
  g.strokeStyle = ZN.gravelL; g.lineWidth = lw * 0.6; g.beginPath(); trace(g, 0.7); g.stroke();
}
/** A stone seen from above: its lumpy outline (rockOutline) round its middle, shaded from the top left. */
function stoneTop(g, cx, cy, rx, ry, c, seed, amp = 0.16) {
  const { pts } = rockOutline({ seed, amp, base: 2 }, 24), path = new Path2D();
  pts.forEach(([px, py], i) => { const X = cx + px * rx, Y = cy + (py - 0.5) * 2 * ry; i ? path.lineTo(X, Y) : path.moveTo(X, Y); });
  path.closePath();
  g.fillStyle = 'rgba(40,40,36,0.28)'; g.save(); g.translate(1.2, 1.4); g.fill(path); g.restore();
  const l = g.createRadialGradient(cx - rx * 0.35, cy - ry * 0.35, 0, cx, cy, Math.max(rx, ry) * 1.1);
  l.addColorStop(0, sh(c, 2)); l.addColorStop(0.5, c); l.addColorStop(1, sh(c, -2));
  g.fillStyle = l; g.fill(path);
  g.save(); g.clip(path);
  for (let i = 0; i < rx * ry; i++) { g.globalAlpha = 0.45; g.fillStyle = hash(i, seed, 5) < 0.5 ? sh(c, -2) : sh(c, 2); g.fillRect(cx - rx + hash(i, seed, 6) * rx * 2, cy - ry + hash(i, seed, 7) * ry * 2, 0.6, 0.6); }
  g.restore(); g.globalAlpha = 1;
}
/** Moss seen from above round (cx, cy): soft dabs inside radius r. */
function mossPatch(g, cx, cy, r, seed, ry = r) {
  g.fillStyle = ZN.mossD; g.beginPath(); g.ellipse(cx, cy, r, ry, 0, 0, TAU); g.fill();
  for (let i = 0; i < r * ry * 1.2; i++) {
    const a = hash(i, seed, 1) * TAU, d = Math.sqrt(hash(i, seed, 2)), v = hash(i, seed, 3);
    g.fillStyle = v < 0.4 ? ZN.moss : v < 0.8 ? ZN.mossL : ZN.mossD;
    g.beginPath(); g.ellipse(cx + Math.cos(a) * d * r * 0.92, cy + Math.sin(a) * d * ry * 0.92, 1.1, 0.9, a, 0, TAU); g.fill();
  }
}
/** A kerb of cut granite round the box: stones of varying length along each edge, t thick. */
function kerb(g, x0, y0, w, h, t, seed) {
  g.fillStyle = ZN.graniteD; g.beginPath(); g.roundRect(x0, y0, w, h, 4); g.fill();
  const edge = (len, at) => { for (let s = 0, i = 0; s < len - 0.5; i++) { const l = Math.min(len - s, 7 + hash(i, seed, len) * 8); at(s + 0.4, l - 0.8, hash(i, seed + 1, len)); s += l; } };
  const col = (v) => (v < 0.35 ? ZN.granite : v < 0.7 ? ZN.graniteL : ZN.weather);
  edge(w, (s, l, v) => { g.fillStyle = col(v); g.fillRect(x0 + s, y0 + 0.4, l, t - 0.8); g.fillRect(x0 + w - s - l, y0 + h - t + 0.4, l, t - 0.8); });
  edge(h - 2 * t, (s, l, v) => { g.fillStyle = col(1 - v); g.fillRect(x0 + 0.4, y0 + t + s, t - 0.8, l); g.fillRect(x0 + w - t + 0.4, y0 + h - t - s - l, t - 0.8, l); });
}

const KINDS = [
  // a granite slab bench on two rough block legs, moss at their feet
  piece('stzbench', 'Stone zen slab bench', 2, 1, 950, [
    B(11, 6.5, 0, 11, 13, 17, ZN.graniteD, { r: 1.4 }), B(53, 6.5, 0, 11, 13, 17, ZN.graniteD, { r: 1.4 }),
    B(32, 15.5, 0, 62, 5, 22, ZN.granite, { r: 1.6 }),
    B(32, 13.4, 11.1, 46, 0.6, 0.3, ZN.graniteD, PL),
    tuft(4, 0, 8, 3.2), tuft(17.4, 0, 8.6, 2.2), tuft(58.6, 0, -5, 2.8), tuft(47, 0, 9, 2),
    S(28, 0.8, 12, 1.4, 0.8, 1.2, ZN.pebble, ST), S(33, 0.7, 13, 1.1, 0.7, 1, ZN.pebbleL, ST),
  ]),

  // a dark slate slab on two rough granite stones, an iron kettle and two celadon cups on a cedar tray
  piece('stztable', 'Stone zen slate table', 2, 1, 850, [
    RK(18, 0, 0, 8, 23.4, 9, ZN.granite, { seed: 4, base: 0.55 }), RK(46, 0, 0, 8, 23.4, 9, ZN.weather, { seed: 5, base: 0.55 }),
    B(32, 25, 0, 62, 3.4, 26, ZN.slate, { r: 0.8, tex: 'slate' }),
    B(39, 27, 1, 16, 0.6, 9, ZN.cedar, { m: 'wood', r: 0.3 }),
    LA(23, 26.7, -3, [[0, 0], [3.4, 0], [4.6, 1.6], [4.8, 3.4], [4, 4.8], [2, 5.4], [1.6, 6], [0, 6.2]], ZN.iron, { m: 'gloss', seg: 10 }),
    RG(23, 32.6, -3, 3.6, 0.4, ZN.iron, { m: 'gloss', arc: Math.PI, a0: 0, seg: 10 }),
    RD([27, 29.4, -3], [30.4, 31.6, -3], 0.6, ZN.iron, { m: 'gloss', seg: 4 }),
    C(35, 28.8, 2, 1.8, 2.6, ZN.celadon, { m: 'gloss', seg: 10, rb: 1.4 }), C(42, 28.8, -1, 1.8, 2.6, ZN.celadon, { m: 'gloss', seg: 10, rb: 1.4 }),
    tuft(10, 0, 6, 2.6), tuft(53, 0, 7, 2.4), tuft(25, 0, -6, 2),
  ]),

  // a turned granite drum stool with a slate band
  piece('stzstool', 'Stone zen drum stool', 1, 1, 300, [
    LA(16, 0, 0, [[0, 0], [8.6, 0], [9.8, 1.4], [10.4, 6], [10.2, 11], [9.6, 14.6], [8.8, 15.4], [0, 15.6]], ZN.granite, { m: 'stone', seg: 14 }),
    C(16, 8.4, 0, 10.6, 1.6, ZN.slate, { m: 'stone', seg: 14, tex: 'none' }),
    tuft(6, 0, 7, 2.4), tuft(25, 0, 8, 2),
  ]),

  // a tall kasuga lantern: a hexagonal foot, a round post, a flared platform, the firebox's window lit, a curled
  // hexagonal roof with a jewel on top, moss on its roof
  piece('stzkasuga', 'Stone zen kasuga lantern', 1, 1, 980, [
    C(16, 2, 0, 10, 4, ZN.graniteD, { m: 'stone', ...HEX }),
    LA(16, 4, 0, [[9.6, 0], [8, 1.6], [5.4, 2.6], [3.6, 3]], ZN.granite, { m: 'stone', ...HEX }),
    C(16, 18.5, 0, 3, 23, ZN.granite, { m: 'stone', seg: 10 }), C(16, 18, 0, 3.6, 1.2, ZN.graniteD, { m: 'stone', seg: 10 }),
    LA(16, 30, 0, [[3.2, 0], [5, 1.2], [8.6, 3.6], [9, 5], [8.4, 5.4]], ZN.granite, { m: 'stone', ...HEX }),
    C(16, 41, 0, 6.6, 11.4, ZN.weather, { m: 'stone', ...HEX }),
    B(16, 41.4, 0, 5.2, 6.4, 11.8, ZN.glow, { m: 'glow', r: 0 }),
    LA(16, 46.6, 0, [[12.4, 0], [12.8, 1], [11.6, 1.8], [7, 4.6], [3, 6.8], [2, 7.2]], ZN.granite, { m: 'stone', ...HEX }),
    ...[0, 1, 2, 3, 4, 5].map(k => { const a = Math.PI / 6 + k * Math.PI / 3; return S(16 + Math.sin(a) * 12.8, 48.2, Math.cos(a) * 12.8, 1.2, 1.5, 1.2, ZN.granite, { m: 'stone', seg: 6 }); }),
    hoju(16, 53.6, 0),
    S(10.6, 51.4, 2.4, 3, 1.1, 2.4, ZN.moss, { m: 'moss', seg: 8 }),
    tuft(6, 0, 9, 2.6), tuft(25.6, 0, 8, 2.2),
  ], { glow: [ZN.glow] }),

  // a low snow-viewing lantern: three splayed legs under a wide round roof, the firebox lit, a small jewel
  piece('stzyukimi', 'Stone zen snow-viewing lantern', 1, 1, 820, [
    ...[Math.PI / 3, Math.PI, 5 * Math.PI / 3].flatMap(a => {
      const P = (r, h) => [16 + Math.sin(a) * r, h, Math.cos(a) * r];
      return [...line([P(4.4, 15), P(9.6, 7), P(12.2, 1)], 1.6, ZN.granite, { m: 'stone', seg: 6 }), S(16 + Math.sin(a) * 12.4, 1, Math.cos(a) * 12.4, 2, 1, 2, ZN.graniteD, { m: 'stone', seg: 6 })];
    }),
    LA(16, 14, 0, [[5, 0], [8, 1.2], [8.4, 2.6], [7, 3.4]], ZN.granite, { m: 'stone', seg: 12 }),
    C(16, 21.2, 0, 5.4, 7.4, ZN.weather, { m: 'stone', ...HEX }),
    B(16, 21.4, 0, 4.4, 4.8, 9.6, ZN.glow, { m: 'glow', r: 0 }),
    LA(16, 24.8, 0, [[15, 0], [15.4, 0.9], [14, 1.8], [9, 4.6], [4, 7.2], [2.6, 7.8]], ZN.granite, { m: 'stone', seg: 16 }),
    LA(16, 32.4, 0, [[1.8, 0], [2.6, 1.2], [2, 2.4], [2.4, 3.4], [1, 5], [0, 5.8]], ZN.granite, { m: 'stone', seg: 8 }),
    S(21.6, 29.2, 3, 3.4, 1, 2.6, ZN.moss, { m: 'moss', seg: 8 }),
    tuft(5, 0, -4, 2.2), tuft(28, 0, 8, 2),
  ], { glow: [ZN.glow] }),

  // a tsukubai: a round granite basin of water, a bamboo spout trickling into it from its post, a bamboo ladle across
  // it, the front stone to kneel on and the two flanking stones, moss between
  piece('stztsukubai', 'Stone zen water basin', 2, 1, 760, [
    LA(34, 0, 2, [[0, 0], [9.4, 0], [11.2, 2.4], [11.8, 7], [11.2, 11], [9.6, 12.2], [6.4, 12.2], [6, 11]], ZN.granite, { m: 'stone', seg: 14 }),
    C(34, 11.2, 2, 6.2, 0.4, ZN.water, { m: 'gloss', seg: 12, k: 1.9 }),
    RK(30, 0, 11.4, 9, 3, 4.4, ZN.slateL, { seed: 11, base: 0.6 }),
    RK(12, 0, 3, 7, 9, 6, ZN.weather, { seed: 12 }), RK(55, 0, 6, 5.6, 7, 5, ZN.graniteD, { seed: 13 }),
    ...pole([52, 0, -8], [52, 27, -8], 1.6),
    RD([52, 23, -8], [38.4, 16.6, 0.2], 1.1, ZN.bamboo, { m: 'wood', seg: 6 }), C(45, 19.7, -4, 1.3, 0.6, ZN.bambooD, { m: 'wood', seg: 8 }),
    RD([38.6, 16, 0.4], [37.8, 11.4, 1.4], 0.45, ZN.waterL, { m: 'glass', seg: 4 }),
    RD([24, 12.6, 4], [39, 12.8, -3], 0.4, ZN.bambooL, { m: 'wood', seg: 4 }), C(39.6, 13.6, -3, 1.6, 1.8, ZN.bambooL, { m: 'wood', seg: 8 }),
    tuft(21, 0, 10, 2.6), tuft(45, 0, 10, 2.4), tuft(60, 0, -2, 2), tuft(4, 0, 9, 2.2, ZN.mossL),
  ]),

  // raked gravel round a rock on a moss ring, ripples spreading over straight lines, a second small stone, a kerb
  ground('stzgravel', 'Stone zen raked gravel ripples', 3, 3, 950, () => {
    const g = ctx();
    kerb(g, 1, 1, 94, 94, 4, 3);
    g.fillStyle = ZN.gravel; g.fillRect(5, 5, 86, 86);
    const rocks = [[36, 40, 11, 9, 61, 26], [68, 66, 6, 5, 62, 15]];
    g.save(); g.beginPath(); g.rect(5, 5, 86, 86); g.clip();
    const lines = new Path2D(); lines.rect(5, 5, 86, 86);
    for (const [x, y, , , , R] of rocks) lines.ellipse(x, y, R + 1, R * 0.92 + 1, 0, 0, TAU);
    g.save(); g.clip(lines, 'evenodd');
    for (let y = 7; y < 91; y += 2.4) groove(g, (gg, d) => { gg.moveTo(5, y + d); gg.lineTo(91, y + d); });
    g.restore();
    for (const [x, y, rx, ry, , R] of rocks) for (let r = rx + 3.2; r <= R; r += 2.4) groove(g, (gg, d) => { gg.ellipse(x, y + d, r, r * 0.92, 0, 0, TAU); });
    grains(g, 5, 5, 86, 86, 5);
    for (const [x, y, rx, ry, seed] of rocks) { mossPatch(g, x, y + 0.6, rx + 2.4, seed, ry + 2.2); stoneTop(g, x, y, rx, ry, seed === 61 ? ZN.granite : ZN.slateL, seed); }
    g.restore();
  }),

  // raked gravel in rolling waves inside a slate kerb
  ground('stzwaves', 'Stone zen raked gravel waves', 2, 2, 620, () => {
    const g = ctx();
    g.fillStyle = ZN.slateD; g.beginPath(); g.roundRect(1, 1, 62, 62, 4); g.fill();
    for (let i = 0; i < 14; i++) { g.fillStyle = i % 2 ? ZN.slate : ZN.slateL; const s = 1 + i * 4.43; g.fillRect(s + 0.3, 1.4, 3.8, 2.6); g.fillRect(s + 0.3, 60, 3.8, 2.6); g.fillRect(1.4, s + 0.3, 2.6, 3.8); g.fillRect(60, s + 0.3, 2.6, 3.8); }
    g.fillStyle = ZN.gravel; g.fillRect(4.4, 4.4, 55.2, 55.2);
    g.save(); g.beginPath(); g.rect(4.4, 4.4, 55.2, 55.2); g.clip();
    for (let y0 = 4; y0 < 64; y0 += 2.4) groove(g, (gg, d) => { for (let x = 4; x <= 60; x += 1) { const y = y0 + d + 2.2 * Math.sin(x / 5.2 + y0 / 14); x === 4 ? gg.moveTo(x, y) : gg.lineTo(x, y); } });
    grains(g, 4.4, 4.4, 55.2, 55.2, 7);
    g.restore();
  }),

  // flat stepping stones zigzagging over moss
  ground('stzsteps', 'Stone zen stepping stones', 1, 3, 380, () => {
    const g = ctx();
    g.fillStyle = ZN.mossD; g.beginPath(); g.roundRect(1, 1, 30, 94, 5); g.fill();
    g.save(); g.beginPath(); g.roundRect(1, 1, 30, 94, 5); g.clip();
    for (let i = 0; i < 260; i++) { const v = hash(i, 71, 1); g.fillStyle = v < 0.4 ? ZN.moss : v < 0.8 ? ZN.mossL : ZN.mossD; g.beginPath(); g.ellipse(1 + hash(i, 71, 2) * 30, 1 + hash(i, 71, 3) * 94, 1.2, 0.9, hash(i, 71, 4) * 3, 0, TAU); g.fill(); }
    g.restore();
    [[13, 12, 9, 7, ZN.granite], [19, 34, 9.6, 7.4, ZN.slateL], [12.6, 57, 9, 7, ZN.weather], [18.6, 80, 9.4, 7.6, ZN.granite]].forEach(([x, y, rx, ry, c], i) => stoneTop(g, x, y, rx, ry, c, 80 + i, 0.12));
    g.fillStyle = ZN.pebbleL; for (let i = 0; i < 10; i++) { g.beginPath(); g.ellipse(4 + hash(i, 73) * 24, 4 + hash(i, 74) * 88, 0.9, 0.7, 0, 0, TAU); g.fill(); }
  }),

  // a dry stream: blue-grey river pebbles winding through raked white gravel, bank stones and moss on its bends
  ground('stzstream', 'Stone zen dry stream bed', 3, 2, 760, () => {
    const g = ctx(), mid = (x) => 32 + 10 * Math.sin(x / 15 + 0.6), half = (x) => 8 + 2 * Math.sin(x / 9);
    g.fillStyle = ZN.gravelD; g.beginPath(); g.roundRect(1, 1, 94, 62, 6); g.fill();
    g.save(); g.beginPath(); g.roundRect(1.6, 1.6, 92.8, 60.8, 5.6); g.clip();
    g.fillStyle = ZN.gravel; g.fillRect(0, 0, 96, 64);
    for (let k = -6; k <= 6; k++) {
      if (Math.abs(k) < 4) continue;
      groove(g, (gg, d) => { for (let x = 0; x <= 96; x += 2) { const y = mid(x) + k * 2.6 * (half(x) / 8) + d; x ? gg.lineTo(x, y) : gg.moveTo(x, y); } });
    }
    for (const sgn of [-1, 1]) for (let k = 1; k < 4; k++) groove(g, (gg, d) => { for (let x = 0; x <= 96; x += 2) { const y = mid(x) + sgn * (half(x) + 3 + k * 2.6) + d; x ? gg.lineTo(x, y) : gg.moveTo(x, y); } });
    grains(g, 0, 0, 96, 64, 9);
    const bed = new Path2D();
    for (let x = 0; x <= 96; x += 2) bed[x ? 'lineTo' : 'moveTo'](x, mid(x) - half(x));
    for (let x = 96; x >= 0; x -= 2) bed.lineTo(x, mid(x) + half(x));
    bed.closePath();
    g.fillStyle = ZN.pebbleD; g.fill(bed);
    g.save(); g.clip(bed);
    for (let i = 0; i < 520; i++) {
      const x = hash(i, 91, 1) * 96, y = mid(x) + (hash(i, 91, 2) * 2 - 1) * half(x), v = hash(i, 91, 3);
      g.fillStyle = v < 0.35 ? ZN.pebble : v < 0.7 ? ZN.pebbleL : v < 0.9 ? ZN.slateL : ZN.graniteL;
      g.beginPath(); g.ellipse(x, y, 1.3 + hash(i, 91, 4), 1 + hash(i, 91, 5) * 0.6, hash(i, 91, 6) * 3, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(x - 0.6, y - 0.6, 0.6, 0.4);
    }
    g.restore();
    mossPatch(g, 18, mid(18) - half(18) - 4, 6, 92, 3.6); mossPatch(g, 70, mid(70) + half(70) + 4, 7, 93, 4);
    stoneTop(g, 22, mid(22) - half(22) - 2, 6, 4.4, ZN.granite, 94); stoneTop(g, 64, mid(64) + half(64) + 2.4, 7, 5, ZN.weather, 95);
    stoneTop(g, 84, mid(84) - half(84) - 1.4, 4.6, 3.6, ZN.slateL, 96);
    g.restore();
  }),

  // three standing rocks, tall, middling and small, moss round their feet, Roggenrola sitting among them
  piece('stzrocks', 'Roggenrola stone zen rock trio', 2, 1, 1250, [
    RK(20, 0, -3, 13, 46, 9, ZN.granite, { seed: 21, base: 0.7, amp: 0.12 }),
    RK(45, 0, 1, 9.4, 22, 8, ZN.weather, { seed: 22, base: 0.5 }),
    RK(58, 0, 8, 5, 9, 5, ZN.slateL, { seed: 23 }),
    tuft(10, 0, 6, 3.4), tuft(26, 0, 7, 3), tuft(52, 0, 9, 2.4), tuft(38, 0, -6, 2.6, ZN.mossL), tuft(62, 0, 1, 1.8),
    C(34, 2, 9, 4.2, 2.4, ZN.roggF, { m: 'plain', ...HEX }),
    C(34, 7.6, 9, 4.6, 9, ZN.rogg, { m: 'plain', ...HEX }),
    ...[[-2.2, 0.4], [0, 0], [2.2, -0.4]].map(([dx, rot]) => LA(34 + dx, 11.6, 9, [[1.4, 0], [1, 2], [0, 3.6]], ZN.roggC, { m: 'gloss', seg: 6, rot })),
    DS(34, 8, 13.4, 2.2, 0.5, ZN.roggY, { m: 'gloss', seg: 6 }), DS(34, 8, 13.7, 1, 0.4, ZN.roggD, { m: 'gloss', seg: 6 }),
    S(31.6, 0.9, 11, 1.4, 0.9, 1.6, ZN.roggF, { m: 'plain', seg: 6 }), S(36.4, 0.9, 11, 1.4, 0.9, 1.6, ZN.roggF, { m: 'plain', seg: 6 }),
  ]),

  // a low dome of moss, two lumps of other greens and a small stone poking through
  piece('stzmoss', 'Stone zen moss mound', 1, 1, 320, [
    LA(16, 0, 0, [[14, 0], [13.6, 2.4], [12, 5.4], [9, 8], [5, 9.6], [0, 10.2]], ZN.moss, { m: 'moss', seg: 12 }),
    RK(20.6, 5, -2, 5, 9, 4.6, ZN.granite, { seed: 31 }),
    S(8, 5.4, 6, 5, 3.6, 5, ZN.mossL, { m: 'moss', seg: 10 }), S(24, 3.6, 7, 4.4, 3.2, 4.4, ZN.mossD, { m: 'moss', seg: 10 }),
  ]),

  // a five-tier stone pagoda on a two-step base, each roof a square flared cap, the ringed spire and jewel on top
  piece('stzpagoda', 'Stone zen pagoda tower', 1, 1, 1300, (() => {
    const parts = [B(16, 2, 0, 24, 4, 24, ZN.graniteD, { r: 0.6 }), B(16, 6, 0, 16, 4, 16, ZN.granite, { r: 0.6 })];
    let h = 8;
    for (let i = 0; i < 5; i++) {
      const bw = 11 - i * 1.1, rf = 13 - i * 1.2;
      parts.push(B(16, h + 2.6, 0, bw, 5.2, bw, ZN.weather, { r: 0.3 }));
      parts.push(LA(16, h + 5.2, 0, [[rf, 0], [rf + 0.4, 0.8], [rf - 0.6, 1.6], [bw * 0.6, 3]], ZN.granite, { m: 'stone', sq: true, noTop: true }));
      h += 8.2;
    }
    parts.push(B(16, h + 1, 0, 4.6, 2, 4.6, ZN.granite, { r: 0.3 }), C(16, h + 8, 0, 0.9, 12, ZN.graniteD, { m: 'stone', seg: 8 }));
    for (let k = 0; k < 6; k++) parts.push(C(16, h + 4 + k * 1.7, 0, 1.9 - k * 0.08, 0.8, ZN.granite, { m: 'stone', seg: 8 }));
    parts.push(hoju(16, h + 14, 0, 0.7));
    parts.push(S(9.6, 14.2, 6.4, 2.8, 1, 2.2, ZN.moss, { m: 'moss', seg: 8 }), tuft(4, 4, 8, 1.8), tuft(27, 0, 9, 2.4));
    return parts;
  })()),

  // a gently arched granite slab bridge resting on two flat boulders, river pebbles under its span
  piece('stzbridge', 'Stone zen slab bridge', 3, 1, 1600, [
    RK(9, 0, 0, 8.6, 6.4, 12, ZN.graniteD, { seed: 41, base: 0.6 }), RK(87, 0, 0, 8.6, 6.4, 12, ZN.graniteD, { seed: 42, base: 0.6 }),
    PR(48, 0, 0, [...Array.from({ length: 11 }, (_, i) => { const x = -42 + 8.4 * i; return [x, 5.2 + 9 * (1 - (x / 42) ** 2)]; }),
      ...Array.from({ length: 11 }, (_, i) => { const x = 42 - 8.4 * i; return [x, 1.8 + 9 * (1 - (x / 42) ** 2)]; })], 18, ZN.granite),
    ...[[38, -3, ZN.pebble], [44, 2, ZN.pebbleL], [50, -1, ZN.slateL], [55, 3, ZN.pebble], [47, 6, ZN.pebbleD], [41, 5, ZN.pebbleL], [58, -4, ZN.pebbleD]].map(([x, z, c], i) => S(x, 0.8, z, 2 + (i % 3) * 0.5, 0.9, 1.8, c, { m: 'stone', seg: 6 })),
    tuft(3, 0, 10, 2.6), tuft(16, 0, 9, 2.2), tuft(93, 0, -9, 2.2), tuft(80, 0, 10, 2.8, ZN.mossL),
  ]),

  // a koi basin: a rough stone rim round dark water, koi under the surface, lily pads, Lotad sitting on the big one
  piece('stzkoi', 'Lotad stone zen koi basin', 2, 2, 1700, [
    C(32, 3.2, 0, 24.4, 0.6, ZN.water, { m: 'gloss', seg: 20, k: -3 }),
    ...[[24, 6, 4, 1.6, ZN.koi], [40, -6, 3.6, 1.4, ZN.koiW], [30, -14, 3.6, 1.5, ZN.koiG]].flatMap(([x, z, rx, rz, c], i) => [
      S(x, 3.6, z, rx, 0.6, rz, c, { m: 'gloss', seg: 8, k: -2 }), S(x + rx + 0.8, 3.6, z, 1.4, 0.4, 1.2, c, { m: 'gloss', seg: 6, k: -2 }),
      S(x - rx * 0.2, 3.9, z, rx * 0.45, 0.4, rz * 0.6, i ? ZN.koi : ZN.koiW, { m: 'gloss', seg: 6, k: -2 }),
    ]),
    C(18, 3.7, 14, 3.4, 0.4, ZN.lily, { m: 'gloss', seg: 10, k: -2 }),
    RK(10, 3, -12, 7, 9, 6, ZN.weather, { seed: 51 }), RK(53, 3, -14, 5, 6, 5, ZN.graniteD, { seed: 52 }),
    LA(32, 0, 0, [[30.2, 0], [30.6, 2.6], [29.4, 5.4], [26.4, 6.2], [24, 5], [23.6, 2.6]], ZN.granite, { m: 'stone', seg: 20, k: 20, noTop: true }),
    C(46, 3.9, 10, 7, 0.4, ZN.lily, { m: 'gloss', seg: 12, k: 9 }),
    S(46, 6.6, 10, 4.2, 3, 3.8, ZN.lotad, { m: 'gloss', seg: 10, k: 22 }),
    C(46, 9.8, 10, 6.6, 0.6, ZN.lotadLeaf, { m: 'gloss', seg: 12, k: 22.5 }),
    S(46, 6, 13.8, 2.2, 0.9, 1.4, ZN.beak, { m: 'gloss', seg: 8, k: 23 }),
    ...[-1, 1].map(sg => DS(46 + sg * 1.8, 7.8, 13.4, 0.6, 0.3, ZN.ink, { m: 'gloss', seg: 6, k: 23.5 })),
    tuft(4, 2, 18, 2.4), tuft(58, 2, 16, 2.6, ZN.mossL), tuft(16, 4, -24, 2), tuft(44, 3, -27, 2.4),
  ]),

  // a slate screen of three panels in a cedar frame, the middle one holding a round window of bamboo lattice
  piece('stzscreen', 'Stone zen slate screen', 2, 1, 720, (() => {
    const parts = [];
    for (const x of [1.8, 22, 42, 62.2]) parts.push(B(x, 27, 0, 3, 48, 3, ZN.cedar, { m: 'wood', r: 0.4 }), B(x, 1.4, 0, 3.6, 2.8, 5, ZN.graniteD, { r: 0.4 }));
    parts.push(B(32, 49.6, 0, 64, 2.4, 3.4, ZN.cedar, { m: 'wood', r: 0.3 }), B(32, 52, 0, 64, 1.6, 6, ZN.cedarD, { m: 'wood', r: 0.3 }), B(32, 5, 0, 64, 2, 3.2, ZN.cedar, { m: 'wood', r: 0.3 }));
    for (const x of [12, 52]) parts.push(B(x, 27.2, 0, 17.4, 42.4, 1.4, ZN.slate, { r: 0, tex: 'slate' }));
    const R = 7.6, cy = 27.2;
    parts.push(B(32, 41.8, 0, 17.4, 13.2, 1.4, ZN.slate, { r: 0, tex: 'slate' }), B(32, 12.6, 0, 17.4, 13.2, 1.4, ZN.slate, { r: 0, tex: 'slate' }));
    for (const [sx, sy] of [[1, 1], [-1, 1], [-1, -1], [1, -1]]) {
      const pts = [[8.7 * sx, 0], [8.7 * sx, 8.2 * sy], [0, 8.2 * sy], [0, R * sy]];
      for (let i = 1; i < 6; i++) { const a = Math.PI / 2 - i / 6 * Math.PI / 2; pts.push([Math.cos(a) * R * sx, Math.sin(a) * R * sy]); }
      pts.push([R * sx, 0]);
      parts.push(PR(32, cy, 0, sx * sy > 0 ? pts : pts.reverse(), 1.4, ZN.slate, { tex: 'slate' }));
    }
    parts.push(RG(32, cy, 0, 7.8, 0.8, ZN.cedar, { m: 'wood', seg: 20 }));
    for (const d of [-3.4, 0, 3.4]) {
      const c = Math.sqrt(R * R - d * d) - 0.2;
      parts.push(RD([32 + d, cy - c, 0], [32 + d, cy + c, 0], 0.45, ZN.bamboo, { m: 'wood', seg: 4 }), RD([32 - c, cy + d, 0], [32 + c, cy + d, 0], 0.45, ZN.bamboo, { m: 'wood', seg: 4 }));
    }
    parts.push(tuft(10, 0, 4, 2.4), tuft(50, 0, 4, 2.2, ZN.mossL));
    return parts;
  })()),

  // two granite gate posts with pyramid caps, a black iron chain swagged between, a rope-tied stop stone on the path
  piece('stzgate', 'Stone zen gate posts', 2, 1, 680, [
    ...[6, 58].flatMap(x => [
      B(x, 22, 0, 7.4, 44, 7.4, ZN.granite, { r: 0.6 }), B(x, 38, 0, 7.8, 1, 7.8, ZN.graniteD, { r: 0.2 }),
      B(x, 45.2, 0, 9, 2.4, 9, ZN.weather, { r: 0.4 }), LA(x, 46.4, 0, [[4.4, 0], [4, 0.8], [0.5, 4.2], [0, 4.4]], ZN.granite, { m: 'stone', sq: true }),
      RG(x + (x < 32 ? 4 : -4), 30, 0, 1, 0.35, ZN.iron, { m: 'gloss', seg: 8 }),
      tuft(x + (x < 32 ? -1 : 1), 0, 5, 2.4),
    ]),
    ...line(bow(10.4, 53.6, 29.4, -7.4, 0, 12), 0.55, ZN.iron, { m: 'gloss', seg: 4 }),
    S(32, 3, 6, 3.4, 3, 3.2, ZN.slateD, { m: 'stone', seg: 10 }),
    RG(32, 3.2, 6, 3.5, 0.4, ZN.ropeD, { m: 'cloth', seg: 12, flat: true }), RG(32, 3.2, 6, 3.3, 0.4, ZN.ropeD, { m: 'cloth', seg: 12, arc: Math.PI, a0: 0 }),
    S(32, 6.6, 6, 1.3, 1, 1.3, ZN.ropeD, { m: 'cloth', seg: 6 }),
  ]),

  // a hokora: a little stone shrine house under a gabled stone roof on a two-step plinth, cedar doors, a straw rope
  // with paper streamers, a cup and a sprig on the plinth, moss creeping up
  piece('stzhokora', 'Stone zen hokora shrine', 1, 1, 880, [
    B(16, 3, 0, 24, 6, 22, ZN.graniteD, { r: 0.8 }), B(16, 7.2, 0, 19, 2.4, 17, ZN.granite, { r: 0.6 }),
    B(16, 15, 0, 14, 13.2, 12, ZN.weather, { r: 0.4 }),
    B(16, 14.4, 6.2, 8, 9, 0.6, ZN.cedar, { m: 'wood', r: 0.2 }), B(16, 14.4, 6.6, 0.4, 9, 0.2, ZN.cedarD, { m: 'wood', r: 0 }),
    PR(16, 21.4, 0, [[-12, 0], [12, 0], [11, 1.6], [0, 7.4], [-11, 1.6]], 17.6, ZN.granite),
    B(16, 28.6, 0, 2, 1.2, 18.4, ZN.graniteD, { r: 0.4 }),
    ...line(bow(9.4, 22.6, 20.8, -1.4, 6.9, 6), 0.6, ZN.rope, { m: 'cloth', seg: 4 }),
    ...[11.8, 16, 20.2].map(x => PR(x, 19.4, 7.2, [[-0.6, 0], [0.6, 0], [0.6, -1.4], [1.2, -1.4], [1.2, -2.8], [0, -2.8], [0, -1.6], [-0.6, -1.6]], 0.2, ZN.paper, PL)),
    C(9.6, 9.2, 7, 1.2, 1.6, ZN.china, { m: 'gloss', seg: 8, rb: 0.9 }),
    C(22.4, 9.8, 7, 1, 2.8, ZN.celadon, { m: 'gloss', seg: 8 }), S(22.4, 12.6, 7, 1.6, 1.4, 1.2, ZN.pineL, { m: 'moss', seg: 6 }),
    S(10, 24.2, 3, 3, 1, 3, ZN.moss, { m: 'moss', seg: 8 }), tuft(4.6, 0, 9.4, 2.4), tuft(27, 0, 8.6, 2),
  ]),

  // a wooden gravel rake hung head-up in a bamboo stand beside a twig broom, on a stone foot
  piece('stzrake', 'Stone zen rake stand', 1, 1, 260, [
    B(16, 1.6, 0, 26, 3.2, 12, ZN.granite, { r: 0.6 }),
    ...pole([5, 3.2, -3], [5, 34, -3], 1.2, 10), ...pole([27, 3.2, -3], [27, 34, -3], 1.2, 10),
    RD([4, 30, -3], [28, 30, -3], 1, ZN.bamboo, { m: 'wood', seg: 6 }), RD([4, 12, -3], [28, 12, -3], 0.9, ZN.bamboo, { m: 'wood', seg: 6 }),
    RD([12, 3.2, 3], [13.6, 44.8, -1.6], 0.8, ZN.bambooL, { m: 'wood', seg: 6 }),
    B(13.6, 46, -1.6, 18, 2.4, 2.4, ZN.cedar, { m: 'wood', r: 0.3 }),
    ...Array.from({ length: 7 }, (_, i) => B(6 + i * 2.55, 49, -1.6, 1.3, 3.8, 1.4, ZN.cedarL, { m: 'wood', r: 0.2 })),
    LA(21.6, 3.2, 3, [[4.2, 0], [3.4, 4], [1.6, 9], [0.9, 10.4]], ZN.straw, { m: 'wood', seg: 8 }),
    RD([21.6, 12.6, 3], [20, 40, -1.8], 0.7, ZN.bambooD, { m: 'wood', seg: 6 }),
    RG(21.4, 11.6, 3, 1.2, 0.35, ZN.ropeD, { m: 'cloth', seg: 6, flat: true }),
    tuft(3, 0, 7, 2), tuft(29, 0, 7, 1.8),
  ]),

  // a niwaki: a pine pruned into cloud pads on a winding trunk, in a square granite pot topped with moss
  piece('stzpine', 'Stone zen niwaki pine', 1, 1, 1100, [
    LA(16, 0, 0, [[0, 0], [7.4, 0], [8.4, 1], [9.4, 8.6], [10, 10], [9, 10.4]], ZN.granite, { m: 'stone', sq: true }),
    C(16, 9.8, 0, 8.4, 0.6, ZN.soil, { m: 'plain', seg: 12 }), C(16, 10.2, 0, 8, 0.5, ZN.moss, { m: 'moss', seg: 12 }),
    ...line([[15, 10, 0], [13, 18, 0], [17, 26, 0], [20.6, 32, 0], [18, 40, 0], [15, 46, 0], [16, 51, 0]], 1.5, ZN.bark, { m: 'wood', seg: 6 }),
    RD([13.4, 19, 0], [7, 22.6, 2], 1, ZN.barkD, { m: 'wood', seg: 6 }), RD([20.4, 31.6, 0], [25.6, 34, 1], 1, ZN.barkD, { m: 'wood', seg: 6 }),
    RD([17.6, 40.4, 0], [9.6, 42.6, -1], 0.9, ZN.barkD, { m: 'wood', seg: 6 }),
    ...[[6.6, 23.6, 2, 6, 3, 6], [25.6, 35, 1, 6.2, 3.2, 6], [9.4, 43.6, -1, 5.4, 3, 5.4], [16, 54, 0, 7.4, 4, 6.6]].flatMap(([x, h, z, rx, ry, rz]) => [
      S(x, h, z, rx, ry, rz, ZN.pine, { m: 'moss', seg: 10, tex: 'needles' }),
      S(x - 0.6, h + ry * 0.4, z + 0.4, rx * 0.78, ry * 0.62, rz * 0.8, ZN.pineL, { m: 'moss', seg: 8, tex: 'needles' }),
    ]),
    tuft(4, 0, 9, 1.8),
  ]),

  // a weathered granite pillar wearing a slate sundial face, an iron gnomon throwing its shadow, a pyramid cap
  piece('stzsundial', 'Stone zen sundial', 1, 1, 900, [
    B(16, 1.6, 0, 22, 3.2, 18, ZN.graniteD, { r: 0.6 }),
    B(16, 18, 0, 13, 29.6, 11, ZN.weather, { r: 1 }),
    B(16, 34, 0, 16, 2.4, 13, ZN.granite, { r: 0.5 }),
    LA(16, 35.2, 0, [[7.6, 0], [7, 1], [0.6, 5], [0, 5.4]], ZN.granite, { m: 'stone', sq: true }),
    DS(16, 20, 5.8, 6.4, 0.8, ZN.slateD, { m: 'stone', seg: 16 }),
    PC(16, 20, 6.3, 12.8, 12.8, dial),
    RD([16, 23.2, 6.4], [16, 17.6, 11.6], 0.5, ZN.iron, { m: 'gloss', seg: 4 }), RD([16, 18.6, 6.4], [16, 19.6, 9.4], 0.4, ZN.iron, { m: 'gloss', seg: 4 }),
    S(11, 30, 5.4, 2.6, 1.6, 0.6, ZN.lichen, { m: 'moss', seg: 6 }),
    tuft(6, 3.2, 7, 2.2), tuft(26, 0, 8, 2.4),
  ]),

  // a slate signboard between cedar posts under a little roof, brushed with an ensō round a cairn and a red seal
  piece('stzsign', 'Stone zen slate signboard', 1, 1, 420, [
    ...[4, 28].flatMap(x => [B(x, 22, 0, 2.6, 44, 2.6, ZN.cedar, { m: 'wood', r: 0.4 }), B(x, 1.4, 0, 4.4, 2.8, 4.4, ZN.graniteD, { r: 0.4 })]),
    B(16, 30, 0, 22.2, 17, 1.4, ZN.slate, { r: 0, tex: 'none' }),
    PC(16, 30, 0.75, 22.2, 17, signArt),
    B(16, 18.6, 0, 22, 1.4, 1.6, ZN.cedar, { m: 'wood', r: 0.3 }),
    PR(16, 44, 0, [[-15, 0], [15, 0], [14, 1.6], [0, 4.6], [-14, 1.6]], 6, ZN.cedarD, WD),
    tuft(8, 0, 4, 2), tuft(24.6, 0, 5, 2.2, ZN.mossL),
  ]),

  // a granite boulder carved as Geodude: a brow, eyes and a frown, two arms raised with rocky fists, moss on its head
  piece('stzgeodude', 'Geodude stone zen boulder', 1, 1, 600, [
    RK(16, 0, 0, 10.4, 20, 9.4, ZN.granite, { seed: 61, amp: 0.1, base: 0.45 }),
    ...[-1, 1].flatMap(sg => [
      ...line([[16 + sg * 8.6, 11, 1], [16 + sg * 12, 13.4, 2], [16 + sg * 12.4, 17, 2.4]], 2.2, ZN.granite, { m: 'stone', seg: 6 }),
      RK(16 + sg * 12.4, 16, 2.6, 3.2, 6, 3, ZN.graniteD, { seed: 62 + sg, amp: 0.15 }),
    ]),
    PR(16, 12.2, 8.6, [[-6, 0], [-1.4, 1.8], [1.4, 1.8], [6, 0], [5, -1], [-5, -1]], 1.8, ZN.graniteD),
    ...[-1, 1].flatMap(sg => [DS(16 + sg * 3, 10.2, 9.4, 1.4, 0.4, ZN.slateD, { m: 'gloss', seg: 8 }), DS(16 + sg * 2.6, 10.6, 9.7, 0.5, 0.3, ZN.white, { m: 'gloss', seg: 6 })]),
    PR(16, 6, 9, [[-3, 0], [3, 0], [2.6, 0.9], [0, 1.4], [-2.6, 0.9]], 0.6, ZN.slateD, PL),
    S(12, 19.4, -1, 3.6, 1.4, 3, ZN.moss, { m: 'moss', seg: 8 }),
    tuft(6, 0, 7, 2.2), tuft(25.4, 0, 6.4, 2.4, ZN.mossL),
  ]),

  // Stonjourner standing as a henge stone: two leg stones, a pillar body with stub arms, a great square head stone
  // with its face set in, grass growing on top
  piece('stzstonjourner', 'Stonjourner stone zen standing stone', 1, 1, 1300, [
    B(10.4, 6, 0, 8.4, 12, 9.6, ZN.stonjD, { r: 1 }), B(21.6, 6, 0, 8.4, 12, 9.6, ZN.stonjD, { r: 1 }),
    B(16, 22.6, 0, 17, 21.6, 11, ZN.stonj, { r: 1.4 }),
    B(5.4, 26, 0, 4.4, 11, 6.6, ZN.stonjD, { r: 1.2 }), B(26.6, 26, 0, 4.4, 11, 6.6, ZN.stonjD, { r: 1.2 }),
    B(16, 46, 0, 27, 25, 13, ZN.stonj, { r: 1.6 }),
    B(16, 46.6, 6.4, 14.6, 9.4, 0.6, ZN.slateD, { m: 'plain', r: 0.6 }),
    ...[-1, 1].flatMap(sg => [DS(16 + sg * 3.6, 47, 6.9, 1.9, 0.4, ZN.white, { m: 'gloss', seg: 10 }), DS(16 + sg * 3.6, 46.8, 7.2, 0.9, 0.3, ZN.ink, { m: 'gloss', seg: 6 })]),
    B(16, 36.6, 5.8, 6, 2, 0.8, ZN.stonjD, { r: 0.4 }),
    S(16, 58.6, 0, 12.6, 1.6, 5.6, ZN.moss, { m: 'moss', seg: 10 }), S(9, 59.6, 1, 3.4, 1.6, 2.6, ZN.mossL, { m: 'moss', seg: 8 }),
    tuft(3.6, 0, 9, 2), tuft(28, 0, 8, 2.2),
  ]),

  // Bronzor resting upright in an iron cradle on a turned granite pedestal
  piece('stzbronzor', 'Bronzor stone zen pedestal', 1, 1, 780, [
    LA(16, 0, 0, [[0, 0], [8, 0], [8, 2], [6, 3], [4.4, 5], [4, 18], [5.6, 20], [7, 21.4], [7, 23], [0, 23]], ZN.granite, { m: 'stone', seg: 12 }),
    RG(16, 33, 0, 10.6, 0.7, ZN.iron, { m: 'gloss', arc: Math.PI, a0: Math.PI, seg: 12 }),
    DS(16, 33, 0, 10, 3.6, ZN.bronzor, { m: 'gloss', seg: 20 }),
    RG(16, 33, 1.9, 7.2, 0.5, ZN.bronzorL, { m: 'gloss', seg: 16 }), DS(16, 32, 1.9, 2.8, 0.4, ZN.bronzorL, { m: 'gloss', seg: 10 }),
    ...[-1, 1].flatMap(sg => [DS(16 + sg * 3.6, 36.4, 2.1, 1.4, 0.4, ZN.eye, { m: 'gloss', seg: 8 }), DS(16 + sg * 3.6, 36.4, 2.4, 0.6, 0.3, ZN.ink, { m: 'gloss', seg: 6 })]),
    ...Array.from({ length: 6 }, (_, k) => { const a = Math.PI / 2 + k * Math.PI / 3; return S(16 + Math.cos(a) * 10, 33 + Math.sin(a) * 10, 0, 1.6, 1.6, 1.6, ZN.bronzorD, { m: 'gloss', seg: 6 }); }),
    tuft(6, 0, 7, 2.2), tuft(26, 0, 7, 2),
  ]),
];

export const STONEZEN_KINDS = KINDS;
