/* base-furniture-sushi.js  -  the Sushi bar room (furniture expansion session i, 2026-10-17): a whole sushi restaurant,
   as Animal Crossing's Happy Home Paradise does a room. Pale hinoki counters with a fine straight grain, black lacquer
   with red edges, white porcelain, indigo cloth in seigaiha waves, a little green (bamboo leaf, wasabi), steel, paper
   lanterns, and the fish themselves: salmon, tuna, tamago and prawn nigiri on coloured plates. Tatsugiri (the sushi
   Pokémon) rides the conveyor belt and sits in its three forms on the chef's geta, Magikarp swim in the tank, a Wishiwashi
   paper lamp, a Wingull on the bow of the sushi boat and Dondozo on the noren for the Pokémon touches. All solo, fixed
   colours, sold all year.
   An upright piece is a list of parts in painted units (32 a tile), as in js/base-furniture-ranch.js: `x` across from the
   left of its front, `h` up from the floor (a wall piece's from the foot of its strip), `z` out to the front from its
   middle (a wall piece's from the wall). They're painted here from any side, and js/base-models-sushi.js builds the same
   list as 3D parts (BUILT), so picture and model agree. `tex` is painted only (the model stays plain colour): `grain`
   hinoki's straight grain (`pd: 'v'` upright), `wave` seigaiha scales, `ribs` a paper lantern's bamboo ribs; `tc` is its
   colour. A `pic` part (the lantern's fish, the clock's dial, the noren's Dondozo, the menu tags, the sign, the ticket
   machine's buttons) is painted on the front only, and the model wears that crop of the painting. The fridge's glass
   door swings (`doors`, its bottles modelled behind it: `inside.bare`). The rug is a bamboo mat, painted from above. */

import { sh, oval, ovalShade, floorShadow, ctx, hash, glass as glassPane } from './base-paint.js';

export const SB = {
  hin: '#e6d0a4', hinL: '#f2e4c4', hinD: '#c0a272', hinDD: '#8a6e4a',
  lac: '#262220', lacL: '#3e3834', red: '#b8302a', redD: '#86201c', redL: '#d8503e',
  ind: '#283a70', indD: '#1a264c', indL: '#4a62a6', dz: '#3c5a94', dzL: '#7a98cc', dzD: '#24386a', dzB: '#c8d4e6', dzLip: '#e89a8c',
  white: '#f4f0e6', rice: '#fbf8f0', leaf: '#4a8a3a', leafL: '#72ae4e', wasabi: '#8cb446', gari: '#f4b4aa', soy: '#3a1a10',
  salmon: '#f2875a', tuna: '#c42e3c', tamago: '#f2c84a', ebi: '#f07a52', nori: '#20301e', ikura: '#f0602a',
  steel: '#b4bac0', steelL: '#dadee2', steelD: '#7a8288', copper: '#c27c46',
  tatami: '#ccc68a', tatamiB: '#2e3a5e', paper: '#f6ecd4', glow: '#ffe2a0', redGlow: '#ff6a4a', blueGlow: '#bcd8f4',
  water: '#8cc4dc', waterD: '#4f8fb4', sand: '#e0cc9c', stone: '#8a8680', weed: '#4c9a4a', ice: '#e4f2f6',
  pBlue: '#3a6ab4', pGold: '#e6b432', pGreen: '#5a9e48', pPink: '#ec8aa4',
  ink: '#1e1a18', tea: '#7a9a3a', ramune: '#7ac0e8', barley: '#b8742c', glassC: '#cfe8f4', panel: '#eef4f4',
  karp: '#e85a2c', karpL: '#f8c09a', karpF: '#f2e2a2', karpW: '#f4f0e0',
  tc: '#f0843a', tcD: '#c85a24', tp: '#ee90ac', tpD: '#c86a88', ty: '#f2c63e', tyD: '#c89a22', tW: '#fbf2e2',
  wish: '#4a7ccc', gull: '#f8f8f4', gullB: '#4a78b8', beak: '#f2c23a',
};
const GROUP = 'Sushi bar';
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

const CL = { m: 'cloth' }, PL = { m: 'plain' }, GL = { m: 'gloss' }, WD = { m: 'wood' }, MT = { m: 'metal' }, GS = { m: 'glass' };
const GRN = { m: 'wood', tex: 'grain' }, GRV = { m: 'wood', tex: 'grain', pd: 'v' };
const WAVE = (tc, ts = 3) => ({ m: 'cloth', tex: 'wave', tc, ts });
const PLATES = [SB.white, SB.red, SB.pBlue, SB.pGold, SB.lac, SB.pGreen, SB.pPink];

/** A nigiri on its rice, lying across, its foot at h: c the fish. */
const nigiri = (x, h, z, c) => [B(x, h + 0.9, z, 4.2, 1.8, 2.6, SB.rice, { m: 'cloth', r: 0.8 }), B(x, h + 2.1, z, 4.8, 0.9, 3, c, { m: 'gloss', r: 0.4 })];
/** A maki roll standing, its foot at h: nori round the rice, a salmon heart. */
const maki = (x, h, z) => [C(x, h + 1.4, z, 1.6, 2.8, SB.nori, { m: 'gloss', seg: 10 }), C(x, h + 2.9, z, 1.3, 0.2, SB.rice, { m: 'plain', seg: 10 }), C(x, h + 3.05, z, 0.5, 0.2, SB.salmon, { m: 'plain', seg: 6 })];
/** A sushi plate, r across its rim, its foot at h. */
const plate = (x, h, z, r, c) => C(x, h + 0.5, z, r, 1, c, { m: 'gloss', rb: r * 0.72, seg: 14 });
/** Two eyes looking out of the front at z: dark with a glint. */
const eyes = (x, h, z, dx, r = 0.5) => [-1, 1].flatMap(s => [DS(x + s * dx, h, z, r, 0.3, SB.ink, { m: 'plain', seg: 8 }), DS(x + s * dx - r * 0.3, h + r * 0.35, z + 0.2, r * 0.32, 0.2, '#ffffff', { m: 'plain', seg: 6 })]);
/** Tatsugiri, the sushi Pokémon, in its three forms (curly orange, droopy pink, stretchy yellow), sitting at h. */
function tatsugiri(x, h, z, form) {
  if (form === 'droopy') return [
    S(x - 0.6, h + 2.2, z - 0.4, 3.2, 2.2, 2.4, SB.tp, { m: 'gloss', seg: 10 }), S(x - 0.6, h + 1.8, z + 1.2, 2, 1.4, 1.2, SB.tW, { m: 'cloth', seg: 8 }),
    S(x + 2, h + 1.6, z + 1.4, 1.7, 1.5, 1.5, SB.tp, { m: 'gloss', seg: 8 }), RG(x - 3, h + 4, z - 0.4, 1.2, 0.5, SB.tpD, { m: 'gloss', a0: 0.4, arc: 4 }),
    ...eyes(x + 2.1, h + 1.9, z + 2.9, 0.7, 0.4),
  ];
  if (form === 'stretchy') return [
    LA(x, h, z, [[2.4, 0], [2.6, 1.6], [2.1, 4.4], [1.6, 7], [1.2, 8.4], [0, 8.8]], SB.ty, { m: 'gloss', seg: 10 }),
    S(x, h + 3.2, z + 1.6, 1.5, 2.6, 0.9, SB.tW, { m: 'cloth', seg: 8 }),
    S(x + 0.6, h + 9, z + 0.4, 1.8, 1.6, 1.8, SB.ty, { m: 'gloss', seg: 8 }), RG(x - 0.6, h + 11, z, 1, 0.45, SB.tyD, { m: 'gloss', a0: -0.4, arc: 4.2 }),
    ...eyes(x + 0.6, h + 9.3, z + 2.1, 0.75, 0.4),
  ];
  return [
    S(x, h + 3.2, z, 2.8, 3.2, 2.4, SB.tc, { m: 'gloss', seg: 10 }), S(x, h + 2.6, z + 1.5, 1.8, 2.1, 1, SB.tW, { m: 'cloth', seg: 8 }),
    RG(x + 0.8, h + 7, z, 1.4, 0.55, SB.tcD, { m: 'gloss', a0: -0.6, arc: 4.4 }),
    ...eyes(x, h + 4.4, z + 2.2, 0.9, 0.45),
  ];
}
/** Magikarp swimming, its middle at (x, h, z), s its size, f 1 facing right and -1 left. */
function magikarp(x, h, z, s, f) {
  const P = (pts) => pts.map(([a, b]) => [a * f * s, b * s]);
  return [
    S(x, h, z, 5 * s, 3.8 * s, 2 * s, SB.karp, { m: 'gloss', seg: 12 }),
    S(x + f * 0.6 * s, h - 1.4 * s, z + 0.6 * s, 3.4 * s, 1.8 * s, 1.4 * s, SB.karpL, { m: 'gloss', seg: 10 }),
    PR(x, h, z, P([[-4, 0], [-8.6, 3.8], [-7.2, 0], [-8.6, -3.8]]), 0.8 * s, SB.karpF, CL),
    PR(x, h, z, P([[-2.6, 2.8], [-1.4, 5.8], [0.6, 4.4], [2.2, 5.6], [2.8, 3]]), 0.6 * s, SB.karpF, CL),
    DS(x + f * 2.7 * s, h + 0.9 * s, z + 1.5 * s, 1.1 * s, 0.3, SB.karpW, { m: 'plain', seg: 10 }), DS(x + f * 2.9 * s, h + 0.9 * s, z + 1.7 * s, 0.5 * s, 0.3, SB.ink, { m: 'plain', seg: 8 }),
    RD([x + f * 4.4 * s, h - 0.4 * s, z + 0.8 * s], [x + f * 6.2 * s, h - 3.2 * s, z + 0.8 * s], 0.35 * s, SB.karpF, PL),
  ];
}
/** Wingull perched, its feet at h, looking right: a white body, long blue-tipped wings raised, a yellow beak. */
const wingull = (x, h, z) => [
  S(x, h + 2, z, 3, 2, 2.2, SB.gull, { m: 'gloss', seg: 10 }), S(x + 2.4, h + 3, z, 1.6, 1.5, 1.5, SB.gull, { m: 'gloss', seg: 8 }),
  B(x + 4.6, h + 2.8, z, 2.8, 0.8, 0.9, SB.beak, { m: 'gloss', r: 0.4 }),
  ...[-1, 1].flatMap(s => [PR(x, h + 3, z + s * 2, [[-0.6, 0], [1.2, 0.6], [-5.6, 7.4], [-7.8, 6.6]], 0.5, SB.gull, CL), PR(x, h + 3, z + s * 2.05, [[-4.6, 5], [-5.6, 7.4], [-7.8, 6.6], [-6, 4.6]], 0.6, SB.gullB, CL)]),
  ...eyes(x + 2.8, h + 3.5, z + 1.3, 0.6, 0.35),
];

/* ---------- painting the parts ---------- */

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
  if (q.tex === 'grain') {
    const across = q.pd !== 'v', a0 = across ? y0 : x0, a1 = across ? y1 : x1, l0 = across ? x0 : y0, l1 = across ? x1 : y1;
    g.lineWidth = 0.28;
    for (let a = a0 + 0.6, i = 0; a < a1; a += 0.8 + hash(i, seed, 1) * 0.9, i++) {
      g.globalAlpha = 0.16 + hash(i, seed, 2) * 0.2; g.strokeStyle = hash(i, seed, 3) < 0.55 ? sh(c, -1) : sh(c, 1);
      const s = l0 + hash(i, seed, 4) * (l1 - l0) * 0.3, e = l1 - hash(i, seed, 5) * (l1 - l0) * 0.3;
      g.beginPath(); if (across) { g.moveTo(s, a); g.lineTo(e, a); } else { g.moveTo(a, s); g.lineTo(a, e); } g.stroke();
    }
  } else if (q.tex === 'ribs') {
    const s = q.ts || 2;
    g.strokeStyle = tc; g.lineWidth = 0.35; g.globalAlpha = 0.4; g.beginPath();
    for (let y = y0 + s; y < y1; y += s) { g.moveTo(x0, y); g.lineTo(x1, y); }
    g.stroke();
  } else if (q.tex === 'wave') {
    const s = q.ts || 3, r = s * 0.62;
    g.lineWidth = s * 0.08;
    for (let y = y0, i = 0; y < y1 + r; y += s * 0.5, i++) for (let x = x0 + (i % 2 ? s / 2 : 0); x < x1 + r; x += s) {
      g.fillStyle = c; g.beginPath(); g.arc(x, y, r, Math.PI, TAU); g.fill();
      g.strokeStyle = tc;
      for (const k of [1, 0.66, 0.33]) { g.beginPath(); g.arc(x, y, r * k, Math.PI, TAU); g.stroke(); }
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

/** A brushed ink fish on the red lantern, a wave under it. */
function lanternFish(g, x, y, w, h) {
  const cx = x + w / 2, cy = y + h * 0.42, s = w;
  g.fillStyle = SB.ink; g.strokeStyle = SB.ink; g.lineCap = 'round';
  g.beginPath(); g.ellipse(cx - s * 0.04, cy, s * 0.3, s * 0.15, -0.15, 0, TAU); g.fill();
  g.beginPath(); g.moveTo(cx + s * 0.2, cy - s * 0.02); g.lineTo(cx + s * 0.46, cy - s * 0.2); g.lineTo(cx + s * 0.4, cy + s * 0.02); g.lineTo(cx + s * 0.48, cy + s * 0.2); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(cx - s * 0.1, cy - s * 0.12); g.lineTo(cx + s * 0.02, cy - s * 0.28); g.lineTo(cx + s * 0.12, cy - s * 0.1); g.fill();
  g.fillStyle = SB.redGlow; g.beginPath(); g.arc(cx - s * 0.22, cy - s * 0.03, s * 0.04, 0, TAU); g.fill();
  g.lineWidth = s * 0.07;
  g.beginPath(); g.moveTo(x + s * 0.08, y + h * 0.78); g.quadraticCurveTo(x + s * 0.3, y + h * 0.66, x + s * 0.5, y + h * 0.78); g.quadraticCurveTo(x + s * 0.7, y + h * 0.9, x + s * 0.92, y + h * 0.76); g.stroke();
}

/** The clock's face: a white dial ringed in indigo ticks, a tuna-red hour fish and an indigo minute fish for hands. */
function clockDial(g, x, y, w, h) {
  const cx = x + w / 2, cy = y + h / 2, r = w / 2;
  g.fillStyle = SB.white; g.beginPath(); g.arc(cx, cy, r * 0.98, 0, TAU); g.fill();
  g.strokeStyle = SB.ind; g.lineWidth = r * 0.04; g.beginPath(); g.arc(cx, cy, r * 0.94, 0, TAU); g.stroke();
  g.fillStyle = SB.ind;
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * TAU, big = i % 3 === 0, rr = r * 0.78;
    g.beginPath(); g.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, r * (big ? 0.09 : 0.045), 0, TAU); g.fill();
  }
  const fish = (a, len, c, wd) => {
    g.save(); g.translate(cx, cy); g.rotate(a); g.fillStyle = c;
    g.beginPath(); g.ellipse(len * 0.55, 0, len * 0.42, wd, 0, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(len * 0.1, 0); g.lineTo(-len * 0.08, -wd * 1.1); g.lineTo(-len * 0.08, wd * 1.1); g.closePath(); g.fill();
    g.restore();
  };
  fish(-Math.PI * 0.72, r * 0.52, SB.tuna, r * 0.1); fish(-Math.PI * 0.12, r * 0.74, SB.ind, r * 0.07);
  g.fillStyle = SB.red; g.beginPath(); g.arc(cx, cy, r * 0.08, 0, TAU); g.fill();
}

/** The noren's crest: Dondozo, the great blue catfish, in a white roundel. */
function dondozo(g, x, y, w, h) {
  const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2;
  g.fillStyle = SB.white; g.beginPath(); g.arc(cx, cy, r * 0.96, 0, TAU); g.fill();
  g.fillStyle = SB.dzD; g.beginPath(); g.ellipse(cx, cy + r * 0.05, r * 0.8, r * 0.6, 0, 0, TAU); g.fill();
  g.beginPath(); g.moveTo(cx - r * 0.3, cy - r * 0.48); g.quadraticCurveTo(cx, cy - r * 0.9, cx + r * 0.3, cy - r * 0.48); g.fill();
  g.fillStyle = SB.dzB; g.beginPath(); g.ellipse(cx, cy + r * 0.26, r * 0.62, r * 0.3, 0, 0, TAU); g.fill();
  g.fillStyle = SB.dzLip; g.beginPath(); g.ellipse(cx, cy + r * 0.2, r * 0.5, r * 0.08, 0, 0, TAU); g.fill();
  g.fillStyle = SB.dzD; g.beginPath(); g.ellipse(cx, cy + r * 0.19, r * 0.44, r * 0.035, 0, 0, TAU); g.fill();
  for (const s of [-1, 1]) {
    g.fillStyle = SB.white; g.beginPath(); g.arc(cx + s * r * 0.36, cy - r * 0.16, r * 0.1, 0, TAU); g.fill();
    g.fillStyle = SB.ink; g.beginPath(); g.arc(cx + s * r * 0.36, cy - r * 0.15, r * 0.055, 0, TAU); g.fill();
    g.fillStyle = SB.dzL; g.beginPath(); g.moveTo(cx + s * r * 0.74, cy + r * 0.1); g.lineTo(cx + s * r * 0.96, cy - r * 0.08); g.lineTo(cx + s * r * 0.86, cy + r * 0.3); g.closePath(); g.fill();
  }
}

/** Fake brushed writing, n strokes down a tag. */
function brush(g, cx, y0, y1, w, seed) {
  g.strokeStyle = SB.ink; g.lineCap = 'round';
  let y = y0;
  for (let i = 0; y < y1; i++) {
    const k = hash(i, seed, 1), len = w * (0.3 + k * 0.5);
    g.lineWidth = w * (0.1 + hash(i, seed, 2) * 0.06);
    g.beginPath();
    if (k < 0.4) { g.moveTo(cx - len / 2, y); g.lineTo(cx + len / 2, y - w * 0.06); }
    else if (k < 0.7) { g.moveTo(cx, y - w * 0.1); g.lineTo(cx + (hash(i, seed, 3) - 0.5) * w * 0.3, y + w * 0.32); }
    else { g.moveTo(cx - len / 2, y + w * 0.2); g.lineTo(cx, y - w * 0.04); g.lineTo(cx + len / 2, y + w * 0.24); }
    g.stroke();
    y += w * (0.2 + hash(i, seed, 4) * 0.2);
  }
}
/** A menu tag: a fish's colour at the top, its brushed name, its price in red at the foot. */
const TAGS = [SB.tuna, SB.salmon, SB.tamago, SB.ebi, SB.ikura, SB.pBlue, SB.tuna, SB.wasabi, SB.salmon];
const tag = (i) => (g, x, y, w, h) => {
  g.fillStyle = SB.hinL; g.fillRect(x, y, w, h);
  g.fillStyle = sh(SB.hinL, -1); g.fillRect(x, y, w * 0.08, h); g.fillRect(x + w * 0.92, y, w * 0.08, h);
  g.fillStyle = TAGS[i]; g.beginPath(); g.ellipse(x + w / 2, y + h * 0.1, w * 0.3, h * 0.04, 0, 0, TAU); g.fill();
  brush(g, x + w / 2, y + h * 0.22, y + h * 0.7, w, i * 11 + 3);
  g.strokeStyle = SB.red; g.lineWidth = w * 0.12; g.beginPath(); g.moveTo(x + w * 0.3, y + h * 0.84); g.lineTo(x + w * 0.7, y + h * 0.82); g.moveTo(x + w * 0.5, y + h * 0.78); g.lineTo(x + w * 0.5, y + h * 0.92); g.stroke();
};

/** The shop sign's face: SUSHI in indigo, a nigiri at its left and a red seal at its right. */
function signFace(g, x, y, w, h) {
  g.fillStyle = SB.ind; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `bold ${h * 0.62}px Georgia, serif`; g.fillText('SUSHI', x + w * 0.5, y + h * 0.54, w * 0.62);
  const nx = x + w * 0.1, ny = y + h * 0.56;
  g.fillStyle = SB.rice; g.beginPath(); g.ellipse(nx, ny + h * 0.08, w * 0.06, h * 0.13, 0, 0, TAU); g.fill();
  g.fillStyle = SB.salmon; g.beginPath(); g.ellipse(nx, ny - h * 0.06, w * 0.07, h * 0.11, 0, 0, TAU); g.fill();
  g.strokeStyle = '#ffffff'; g.lineWidth = h * 0.03; g.beginPath(); for (const d of [-0.04, 0, 0.04]) { g.moveTo(nx - w * 0.04, ny - h * 0.06 + d * h * 2); g.lineTo(nx + w * 0.04, ny - h * 0.1 + d * h * 2); } g.stroke();
  const sx = x + w * 0.9, sy = y + h * 0.5, sr = h * 0.26;
  g.fillStyle = SB.red; g.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
  g.strokeStyle = SB.white; g.lineWidth = sr * 0.16; g.beginPath(); g.moveTo(sx - sr * 0.5, sy - sr * 0.4); g.lineTo(sx + sr * 0.5, sy - sr * 0.4); g.moveTo(sx, sy - sr * 0.6); g.lineTo(sx, sy + sr * 0.6); g.moveTo(sx - sr * 0.5, sy + sr * 0.2); g.lineTo(sx + sr * 0.5, sy + sr * 0.2); g.stroke();
}

/** White lettering on a red header. */
const letters = (word) => (g, x, y, w, h) => {
  g.fillStyle = SB.white; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `bold ${h * 0.72}px Georgia, serif`; g.fillText(word, x + w / 2, y + h * 0.55, w * 0.9);
};

/** The ticket machine's buttons: a nigiri on each, coloured by price, two long buttons at the foot. */
function buttons(g, x, y, w, h) {
  g.fillStyle = SB.ink; g.fillRect(x, y, w, h);
  const cols = 3, rows = 4, bw = w / cols, bh = h * 0.8 / rows, fish = [SB.tuna, SB.salmon, SB.tamago, SB.ebi, SB.ikura, SB.tuna];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const bx = x + c * bw + bw * 0.08, by = y + r * bh + bh * 0.1, ww = bw * 0.84, hh = bh * 0.8, i = r * cols + c;
    g.fillStyle = [SB.red, SB.pBlue, SB.pGold][r % 3]; g.beginPath(); g.roundRect(bx, by, ww, hh, 0.5); g.fill();
    g.fillStyle = SB.white; g.beginPath(); g.roundRect(bx + ww * 0.1, by + hh * 0.12, ww * 0.8, hh * 0.76, 0.4); g.fill();
    g.fillStyle = SB.rice; g.strokeStyle = '#d8d0c0'; g.lineWidth = 0.15;
    g.beginPath(); g.ellipse(bx + ww / 2, by + hh * 0.6, ww * 0.26, hh * 0.16, 0, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = fish[i % fish.length]; g.beginPath(); g.ellipse(bx + ww / 2, by + hh * 0.45, ww * 0.3, hh * 0.14, 0, 0, TAU); g.fill();
  }
  for (const [i, c] of [[0, SB.pGreen], [1, SB.red]]) { g.fillStyle = c; g.beginPath(); g.roundRect(x + w * (0.06 + i * 0.5), y + h * 0.83, w * 0.4, h * 0.13, 0.6); g.fill(); }
}

/* ---------- the kinds ---------- */

/** What js/base-models-sushi.js builds for each upright and wall kind: its parts, doors, inside and default material. */
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

/** A cabinet's plinth, hinoki body and two framed panels with black pulls, its top at h. */
const cabinet = (W, h, d, z = 0) => [
  B(W / 2, 1.5, z + 1, W - 4, 3, d - 4, SB.lac, PL),
  B(W / 2, 3 + (h - 3) / 2, z, W - 2, h - 3, d, SB.hin, GRN),
  ...[W / 4, W * 3 / 4].flatMap((x, i) => [B(x, 3 + (h - 3) / 2, z + d / 2 + 0.3, W / 2 - 6, h - 9, 0.6, SB.hinL, GRV), B(x + (i ? -1 : 1) * (W / 4 - 6), 3 + (h - 3) / 2, z + d / 2 + 0.8, 1, 5, 0.8, SB.lac, PL)]),
];
/** A row of plates riding the belt, each with its sushi. */
function belt(x0, x1, n, h, z, first, skip = -1) {
  const parts = [];
  for (let i = 0; i < n; i++) {
    if (i === skip) continue;
    const x = x0 + (x1 - x0) * i / (n - 1), k = (i + first) % PLATES.length;
    parts.push(plate(x, h, z, 3.8, PLATES[k]));
    if (k % 3 === 2) parts.push(...maki(x - 1.5, h + 1, z), ...maki(x + 1.5, h + 1, z));
    else parts.push(...nigiri(x, h + 1, z - 0.8, [SB.salmon, SB.tuna, SB.tamago, SB.ebi][(i + first) % 4]), ...nigiri(x, h + 1, z + 1.4, [SB.tuna, SB.salmon, SB.ebi, SB.tamago][(i + first) % 4]));
  }
  return parts;
}
/** A yunomi teacup standing at h, its glaze c with a band. */
const cup = (x, h, z, c, band, r = 2.3) => [C(x, h + 3, z, r, 6, c, { m: 'gloss', rb: r * 0.86, seg: 12 }), C(x, h + 4, z, r * 1.02, 1.4, band, { m: 'plain', seg: 12, rb: r * 0.92 })];
/** A drink bottle standing at h. */
const bottle = (x, h, z, c, cap) => [LA(x, h, z, [[1.7, 0], [1.8, 6.4], [1.2, 8.4], [0.7, 9.4], [0.7, 10.2]], c, { m: 'gloss', seg: 8 }), C(x, h + 10.6, z, 0.8, 0.9, cap, { m: 'plain', seg: 8 })];

export const SUSHI_KINDS = [
  // the long hinoki counter: a red lacquer band, a lit glass neta case of salmon, tuna, tamago and prawn on ice and bamboo
  // leaves, a geta of nigiri, a soy dish and chopsticks at the front
  piece('sshcounter', 'Sushi counter', 2, 1, 1500, 'wood', [
    B(32, 2, 2, 60, 4, 24, SB.lac, PL),
    B(32, 18.5, 1, 64, 29, 28, SB.hin, GRN),
    ...[16, 48].map(x => B(x, 18.5, 15.3, 27, 21, 0.6, SB.hinL, GRV)),
    B(32, 31.4, 15.4, 64, 1.4, 0.8, SB.red, GL),
    B(32, 34.3, 0, 64, 2.6, 30, SB.hinL, GRN),
    B(32, 36.6, -4, 58, 2, 16, SB.steel, MT),
    B(32, 38, -4, 56, 0.8, 14, SB.ice, PL),
    ...[13, 29, 45].map(x => B(x, 38.6, -4, 15, 0.4, 11, SB.leaf, PL)),
    ...[[8.5, SB.salmon], [16.5, SB.tuna], [25, SB.tamago], [33, SB.ebi], [41, SB.salmon], [49, SB.tuna]].map(([x, c]) => B(x, 40, -5, 6.4, 2.4, 7, c, GL)),
    S(56, 39.6, -4, 1.6, 1, 1.4, SB.wasabi, { m: 'cloth', seg: 8 }),
    B(32, 51.3, -4, 58, 1.8, 16, SB.hinD, WD),
    B(32, 49.9, -4, 54, 0.8, 12, SB.glow, { m: 'glow' }),
    ...[3.6, 60.4].map(x => B(x, 44.2, -4, 1.2, 12, 15, SB.steelL, MT)),
    B(32, 44.2, -4, 57, 12, 15, SB.glassC, GS),
    B(48, 36.4, 8, 14, 1.6, 6, SB.hinD, WD), ...nigiri(44.8, 37.2, 8, SB.tuna), ...nigiri(51.2, 37.2, 8, SB.salmon),
    B(20, 35.9, 9, 2, 0.6, 1, SB.ind, PL), RD([13, 36.5, 9.6], [26, 36.5, 9], 0.3, SB.red, PL),
    C(30, 36, 9, 2.4, 0.8, SB.white, { m: 'gloss', rb: 1.7, seg: 12 }), C(30, 36.45, 9, 1.8, 0.1, SB.soy, { m: 'plain', seg: 12 }),
  ], { glow: [SB.glow] }),

  // a kaiten section: a hinoki base, a steel belt with its rails, coloured plates of nigiri and maki going round, and a
  // Tatsugiri riding a plate of rice
  piece('sshconveyor', 'Sushi conveyor belt', 2, 1, 1400, 'wood', [
    ...cabinet(64, 26, 26),
    B(32, 27.4, 0, 64, 2.8, 28, SB.steel, MT),
    B(32, 29.3, 1, 62, 1, 25, '#e8e0c8', PL),
    B(32, 30.6, 14, 64, 3, 1.2, SB.steelL, MT), B(32, 31.6, -13.2, 64, 5, 1.6, SB.steelL, MT),
    ...belt(5, 59, 5, 29.8, -5, 1),
    ...belt(6, 58, 5, 29.8, 6, 0, 2),
    plate(32, 29.8, 6, 3.8, SB.pGold), B(32, 31.8, 6, 5, 1.6, 4, SB.rice, { m: 'cloth', r: 0.8 }),
    ...tatsugiri(32, 32.6, 6, 'curly'),
  ]),

  // a tall counter stool: four splayed hinoki legs, a steel footring, a black and red lacquer seat and an indigo cushion
  piece('sshstool', 'Sushi counter stool', 1, 1, 320, 'wood', [
    ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => RD([16 + sx * 11, 0.9, sz * 11], [16 + sx * 7, 21, sz * 7], 1.1, SB.hinD, WD)),
    ...[-9.4, 9.4].flatMap(k => [RD([6.6, 9, k], [25.4, 9, k], 0.6, SB.steel, MT), RD([16 + k, 9, -9.4], [16 + k, 9, 9.4], 0.6, SB.steel, MT)]),
    C(16, 21.8, 0, 9.4, 2, SB.lac, { m: 'gloss', seg: 18 }),
    C(16, 23.6, 0, 9.2, 1.6, SB.red, { m: 'gloss', seg: 18 }),
    C(16, 25.4, 0, 8.4, 2, SB.ind, { m: 'cloth', seg: 18, rb: 8.9 }),
  ]),

  // the chef's station: a steel-topped hinoki cabinet, a thick cutting board with a side of salmon on a bamboo leaf, three
  // slices cut, the long yanagiba knife, a knife block, a steel bowl of hand water and a wasabi root
  piece('sshchef', "Sushi chef's station", 2, 1, 1250, 'wood', [
    ...cabinet(64, 26, 26),
    B(32, 27, 0, 64, 2, 28, SB.steel, MT),
    B(26, 29.2, 1, 32, 2.4, 18, SB.hinL, GRN),
    B(19, 30.6, 0, 16, 0.4, 8, SB.leaf, PL),
    B(19, 31.6, 0, 13, 1.6, 5.4, SB.salmon, GL), ...[15, 19, 23].map(x => B(x, 32.45, 0, 0.3, 0.1, 5, '#fbe0d0', PL)),
    ...[29.5, 33, 36.5].map(x => B(x, 31.2, 3, 2.6, 1.2, 4.4, SB.salmon, GL)),
    B(29, 30.7, 8, 18, 0.5, 2, SB.steelL, MT), B(38.6, 30.9, 8, 1, 1.2, 1.6, SB.lac, PL), B(42, 30.9, 8, 6, 1, 1.4, SB.hinD, WD),
    B(54, 33, -8, 10, 10, 6, SB.hinD, WD), ...[51, 54, 57].map(x => B(x, 40.2, -8, 1.4, 4.6, 1.2, SB.lac, PL)),
    C(8, 30.2, -4, 3.6, 4.4, SB.steel, { m: 'metal', rb: 3, seg: 14 }), C(8, 32.3, -4, 3.3, 0.2, SB.water, { m: 'plain', seg: 14 }),
    RD([46, 29.6, 3], [52, 29.9, 6], 0.9, SB.wasabi, CL),
  ]),

  // a hangiri: the wide shallow rice tub of hinoki in copper bands on its stand, a mound of rice, the shamoji paddle in it
  // and an indigo fan leaning at its side
  piece('sshhangiri', 'Sushi rice tub', 1, 1, 480, 'wood', [
    B(16, 1, 0, 24, 2, 18, SB.lac, PL), B(16, 7.9, 0, 26, 11.8, 20, SB.hinD, GRV), B(16, 7.9, 10.2, 20, 7, 0.6, SB.hin, GRV),
    B(16, 13.8, 0, 26, 2, 22, SB.hinD, WD),
    C(16, 18.6, 0, 13, 7.6, SB.hin, { m: 'wood', seg: 20, rb: 12.4 }),
    RG(16, 16.6, 0, 12.6, 0.5, SB.copper, { m: 'metal', flat: true }), RG(16, 20.6, 0, 13, 0.5, SB.copper, { m: 'metal', flat: true }),
    LA(16, 21.6, 0, [[12.2, 0], [9, 1.6], [4, 2.4], [0, 2.6]], SB.rice, { m: 'cloth', seg: 18 }),
    S(19.6, 23.8, 2, 2, 2.6, 0.6, SB.hinL, { m: 'wood', seg: 8 }), RD([20.4, 26, 2.4], [25, 33, 5], 0.6, SB.hinL, WD),
    DS(5.5, 31, 6, 5.2, 0.4, SB.ind, { m: 'cloth', seg: 14 }), RD([5.5, 25.8, 6], [6.5, 19, 7], 0.5, SB.hinD, WD),
  ]),

  // the green tea urn: a steel urn banded matcha green on a hinoki cabinet, its tap over a drip tray and a teacup
  piece('sshteatap', 'Sushi tea urn', 1, 1, 520, 'metal', [
    B(16, 1.5, 0, 28, 3, 22, SB.lac, PL),
    B(16, 13.5, 0, 30, 21, 24, SB.hin, GRN), B(16, 13.5, 12.3, 22, 15, 0.6, SB.hinL, GRV), B(24, 13.5, 12.8, 1, 5, 0.8, SB.lac, PL),
    B(16, 25, 0, 32, 2, 26, SB.hinD, WD),
    B(16, 26.6, 8, 12, 1.2, 8, SB.steelD, MT),
    C(16, 30.2, 8, 2.2, 4, SB.white, { m: 'gloss', rb: 1.8, seg: 12 }), C(16, 30.8, 8, 2.15, 1, SB.tea, { m: 'plain', seg: 12, rb: 2.05 }),
    C(16, 37, -3, 9.5, 22, SB.steel, { m: 'metal', seg: 18 }),
    C(16, 36, -3, 9.65, 6, SB.tea, { m: 'plain', seg: 18 }),
    LA(16, 48, -3, [[9.5, 0], [8, 2], [4, 3.6], [1.4, 4], [1.4, 5.4], [2.4, 6], [0, 6.4]], SB.steelL, { m: 'metal', seg: 16 }),
    B(16, 34, 7, 3, 2.6, 3.4, SB.lac, PL), RD([16, 33.6, 8], [16, 31.6, 8], 0.6, SB.steelL, MT), B(16, 36.4, 7.6, 1.2, 2.6, 1.2, SB.red, PL),
    ...cup(26.6, 26, -9.4, SB.white, SB.tea, 1.8),
  ]),

  // an open hinoki shelf of the shop's teacups: plates stacked, yunomi in white, celadon and red, and a teapot on top
  piece('sshcupshelf', 'Sushi teacup shelf', 1, 1, 560, 'wood', [
    ...[2, 30].map(x => B(x, 30, 0, 2.4, 60, 22, SB.hin, GRV)),
    ...[1.2, 20.6, 40, 59.2].map(h => B(16, h, 0, 26, 2, 22, SB.hinL, GRN)),
    B(16, 30, -10.2, 26, 58, 1.2, SB.hinD, WD),
    ...[0, 1, 2, 3].map(i => plate(9.5, 2.2 + i * 1.1, 1, 4.6, [SB.white, SB.ind, SB.white, SB.red][i])),
    ...cup(22, 2.2, 1, SB.white, SB.ind),
    ...cup(8.5, 21.6, 1, SB.white, SB.ind), ...cup(16, 21.6, 1, '#a8c8a8', SB.leaf), ...cup(23.5, 21.6, 1, SB.red, SB.lac),
    ...cup(8.5, 41, 1, '#a8c8a8', SB.leaf), ...cup(16, 41, 1, SB.lac, SB.red), ...cup(23.5, 41, 1, SB.white, SB.tuna),
    LA(14, 60.2, 0, [[2.6, 0], [4.4, 1.6], [4.6, 3.6], [3.4, 5.6], [1.2, 6.2], [1.2, 6.8], [0, 7.2]], '#6a5440', { m: 'gloss', seg: 12 }),
    RD([18.2, 62.4, 0], [21.4, 65, 0], 0.5, '#6a5440', GL), RD([10, 63, 0], [6, 63.6, 0], 0.7, SB.hinD, WD),
  ]),

  // a raised tatami booth: a hinoki platform, tatami on top, a low black lacquer table with sushi on a geta, teacups and a
  // soy dish, indigo zabuton cushions, and a low partition hung with seigaiha cloth behind
  piece('sshbooth', 'Sushi tatami booth', 2, 2, 1750, 'wood', [
    B(32, 6, 0, 64, 10, 64, SB.hin, GRN),
    B(32, 1, 0, 60, 2, 60, SB.lac, PL),
    B(32, 11.6, 0, 62, 1.6, 62, SB.tatami, CL), B(32, 11.7, 30.8, 62, 1.6, 0.8, SB.tatamiB, PL),
    B(32, 32, -30, 64, 40, 4, SB.hin, GRN),
    B(32, 32, -27.7, 54, 30, 0.6, SB.ind, WAVE(SB.indL, 4)),
    B(32, 52.8, -30, 64, 1.6, 5, SB.hinD, WD),
    ...[[14, -12], [50, -12], [14, 8], [50, 8]].map(([x, z]) => B(x, 15.6, z, 2.4, 6.4, 2.4, SB.lac, GL)),
    B(32, 19.8, -2, 42, 2, 26, SB.lac, GL), B(32, 19.8, 11.1, 42, 2.1, 0.4, SB.red, PL),
    B(32, 21.4, -2, 17, 1.2, 7, SB.hinD, WD), ...nigiri(26.6, 22, -2, SB.tuna), ...nigiri(32, 22, -2, SB.salmon), ...nigiri(37.4, 22, -2, SB.tamago),
    ...cup(18, 20.8, 3, SB.white, SB.ind, 1.8), ...cup(46, 20.8, -7, SB.white, SB.ind, 1.8),
    C(19, 21.2, -7, 2, 0.8, SB.white, { m: 'gloss', rb: 1.5, seg: 12 }), C(45, 21.2, 4, 2, 0.8, SB.white, { m: 'gloss', rb: 1.5, seg: 12 }),
    B(32, 13.6, 21, 18, 2.4, 16, SB.ind, CL), B(32, 13.6, -21.5, 18, 2.4, 9, SB.ind, CL),
  ]),

  // a black lacquer dining table, red at its edge: two place settings of chopsticks on rests and soy dishes, a soy bottle
  // and a box of chopsticks
  piece('sshtable', 'Sushi lacquer table', 2, 1, 760, 'gloss', [
    ...[[4.4, -10], [59.6, -10], [4.4, 10], [59.6, 10]].map(([x, z]) => B(x, 13, z, 4.4, 26, 4.4, SB.lac, GL)),
    B(32, 22.6, -10, 54, 4, 2, SB.lac, GL), B(32, 22.6, 10, 54, 4, 2, SB.lac, GL),
    B(32, 27.2, 0, 64, 2.4, 28, SB.lac, GL), B(32, 27.2, 14.1, 64, 1.2, 0.4, SB.red, PL),
    ...[16, 48].flatMap(x => [B(x - 4, 28.8, 7, 1.6, 0.8, 1, SB.white, PL), RD([x - 8, 29.4, 7.4], [x + 3, 29.4, 6.4], 0.3, SB.red, PL), C(x + 6, 28.8, 6, 2.2, 0.8, SB.white, { m: 'gloss', rb: 1.6, seg: 12 })]),
    LA(28, 28.4, -5, [[1.8, 0], [2, 3], [1.4, 5], [0.8, 6], [0.8, 7]], SB.soy, { m: 'gloss', seg: 10 }), LA(28, 35.4, -5, [[1.1, 0], [1.1, 1.2], [0.4, 2], [0, 2.1]], SB.red, { m: 'gloss', seg: 8 }),
    B(36, 30.4, -6, 6, 4, 3, SB.hin, WD), ...[34.4, 36, 37.6].map(x => RD([x, 32, -6], [x, 36.4, -6], 0.3, SB.hinD, WD)),
  ]),

  // a hinoki waiting bench on slab legs, two indigo seigaiha cushions on it
  piece('sshbench', 'Sushi waiting bench', 2, 1, 680, 'wood', [
    ...[6, 58].map(x => B(x, 7, 0, 4, 14, 20, SB.hinD, WD)),
    B(32, 5, 0, 48, 2, 3, SB.hinD, WD), B(32, 11.6, 9, 54, 4.4, 1.6, SB.hinD, WD),
    B(32, 15, 0, 64, 2.6, 22, SB.hin, GRN),
    ...[18, 46].map(x => B(x, 17.4, 0, 24, 2.2, 18, SB.ind, WAVE(SB.indL, 2.6))),
  ]),

  // the empty plates of a good meal stacked up: three towers of white, red, blue, gold, black, green and pink
  piece('sshplates', 'Sushi plate tower', 1, 1, 260, 'gloss', [
    B(16, 0.6, 1, 28, 1.2, 26, SB.hinD, WD),
    ...[[8.6, 4, 9], [21.6, -4, 15], [22.4, 8, 4]].flatMap(([x, z, n], k) => Array.from({ length: n }, (_, i) => plate(x, 1.2 + i * 1.2, z, 5.8, PLATES[(i + k * 2) % PLATES.length]))),
  ]),

  // a live fish tank on a hinoki cabinet: black lacquer frame, gravel, rocks and weed, two Magikarp, a light under the lid
  piece('sshtank', 'Sushi fish tank', 2, 1, 1450, 'wood', [
    ...cabinet(64, 21, 24),
    B(32, 22, 0, 64, 2, 26, SB.lac, GL),
    B(32, 24.2, 0, 60, 2.4, 22, SB.sand, CL),
    B(32, 38, -10.4, 60, 30, 0.6, SB.waterD, PL),
    S(12, 26.4, -4, 5, 3, 4, SB.stone, { m: 'cloth', seg: 10 }), S(51, 26, -5, 4, 2.4, 3.4, SB.stone, { m: 'cloth', seg: 10 }),
    ...[[8, -6, -2], [11, -7, 2], [14, -6, -1], [48, -7, 2], [53, -6, -2]].map(([x, z, lean]) => RD([x, 25, z], [x + lean, 25 + 13 + Math.abs(lean) * 2, z], 0.7, SB.weed, CL)),
    ...magikarp(28, 40, 0, 1, 1), ...magikarp(44, 31, 3, 0.7, -1),
    B(32, 53.6, 0, 64, 2.4, 26, SB.lac, GL),
    B(32, 51.8, 0, 56, 0.8, 18, SB.glow, { m: 'glow' }),
    ...[[1.4, 10.4], [62.6, 10.4], [1.4, -10.4], [62.6, -10.4]].map(([x, z]) => B(x, 37.7, z, 1.6, 29.4, 1.6, SB.lac, GL)),
    B(32, 37.7, 0, 60, 29.4, 22, SB.glassC, GS),
  ], { glow: [SB.glow] }),

  // a funamori: a little wooden boat on a lacquer stand laden with nigiri and maki on a bamboo leaf, a Wingull on its bow
  piece('sshboat', 'Sushi boat platter', 1, 1, 640, 'wood', [
    B(16, 5, 0, 26, 10, 13, SB.lac, GL),
    B(16, 11, 0, 30, 2, 16, SB.lac, GL), B(16, 11, 8.1, 30, 1, 0.4, SB.red, PL),
    PR(16, 12, 0, [[-12, 6], [-11, 1.4], [-8, 0], [9, 0], [12, 2.4], [14.4, 9.4], [13, 9.8], [11, 6]], 12, SB.hin, WD),
    B(15, 17.6, 0, 23, 0.6, 10, SB.hinL, WD),
    B(14, 18.1, 0, 20, 0.3, 9, SB.leaf, PL),
    ...nigiri(7.6, 18.2, -2.2, SB.tuna), ...nigiri(13, 18.2, -2.2, SB.salmon), ...nigiri(18.4, 18.2, -2.2, SB.tamago),
    ...maki(7.6, 18.2, 2.4), ...maki(11.2, 18.2, 2.4), ...nigiri(16.6, 18.2, 2.6, SB.ebi),
    S(20.4, 18.8, 3, 1.2, 0.8, 1.2, SB.gari, { m: 'cloth', seg: 8 }),
    ...wingull(23.4, 20.6, 0),
  ]),

  // a window of plastic food samples: three glass shelves of model sushi sets with their price cards, lit from the top
  piece('sshsamples', 'Sushi sample window', 1, 1, 980, 'wood', [
    B(16, 1.5, 0, 28, 3, 20, SB.lac, PL),
    B(16, 10, 0, 30, 14, 22, SB.hinD, GRN), B(16, 10, 11.2, 24, 9, 0.6, SB.red, GL),
    B(16, 17.6, 0, 30, 1.2, 22, SB.hinL, WD),
    B(16, 37, -10.4, 28, 38, 0.6, SB.paper, PL),
    ...[30.6, 43].map(h => B(16, h, -1, 27, 0.6, 18, SB.white, PL)),
    plate(9, 18.2, 1, 4.4, SB.lac), ...nigiri(9, 19.2, -0.4, SB.tuna), ...nigiri(9, 19.2, 2.4, SB.salmon),
    LA(22, 18.2, 1, [[2.2, 0], [4.4, 2.4], [4.8, 3.4]], SB.red, { m: 'gloss', seg: 12 }), C(22, 21.4, 1, 4.4, 0.4, SB.rice, { m: 'plain', seg: 12 }),
    S(20.4, 21.8, 0, 1.3, 0.6, 1, SB.salmon, { m: 'gloss', seg: 6 }), S(23.4, 21.8, 2, 1.3, 0.6, 1, SB.tuna, { m: 'gloss', seg: 6 }), S(22.4, 21.8, -1.6, 1, 0.5, 1, SB.tamago, { m: 'gloss', seg: 6 }),
    plate(10, 30.9, 1, 4.8, SB.white), ...maki(8, 31.9, 0), ...maki(11.4, 31.9, 0), ...maki(9.6, 31.9, 3),
    plate(22, 30.9, 1, 4, SB.pBlue), C(22, 33.3, 1, 1.8, 2.8, SB.nori, { m: 'gloss', seg: 10 }), S(22, 34.8, 1, 1.5, 0.6, 1.5, SB.ikura, { m: 'gloss', seg: 8 }),
    B(16, 43.9, 0, 18, 1.2, 7, SB.hinD, WD), ...nigiri(11, 44.5, 0, SB.ebi), ...nigiri(16, 44.5, 0, SB.tuna), ...nigiri(21, 44.5, 0, SB.salmon),
    ...[[9, 18.2], [22, 18.2], [10, 30.9], [22, 30.9], [16, 43.3]].map(([x, h]) => B(x, h + 1, 8.4, 4, 2, 0.4, SB.white, PL)),
    B(16, 56.8, 0, 32, 2.4, 22, SB.hinD, WD),
    B(16, 55.2, -1, 26, 0.8, 16, SB.glow, { m: 'glow' }),
    ...[[1.4, 10.2], [30.6, 10.2]].map(([x, z]) => B(x, 36.9, z, 1.6, 37.4, 1.6, SB.hinD, WD)),
    B(16, 36.9, 0, 30, 37.4, 22, SB.glassC, GS),
  ], { glow: [SB.glow] }),

  // the shop's ticket machine: a white cabinet under a red header, buttons with a nigiri on each, the coin and note slots
  // and the tray the tickets drop into
  piece('sshticket', 'Sushi ticket machine', 1, 1, 880, 'gloss', [
    B(16, 1.5, 0, 26, 3, 18, SB.steelD, MT),
    B(16, 28, -1, 26, 50, 18, SB.white, GL),
    B(16, 57, -1, 26, 8, 18, SB.red, GL),
    PC(16, 57, 8.2, 22, 6, letters('ORDER')),
    B(16, 39.6, 8.2, 23, 22, 0.6, SB.steelD, MT),
    PC(16, 39.6, 8.6, 21, 20, buttons),
    B(8, 24.6, 8.2, 7, 4, 0.6, SB.steelD, MT), B(8, 24.6, 8.6, 4, 0.8, 0.3, SB.ink, PL),
    B(21, 24.6, 8.2, 10, 3, 0.8, SB.ink, PL),
    B(16, 16.4, 8.2, 16, 3, 0.6, SB.steelD, MT), B(16, 16.4, 8.6, 12, 0.6, 0.3, SB.ink, PL),
    B(16, 8.6, 8.6, 10, 5, 1.4, SB.steelD, MT), B(16, 9.6, 9.4, 8, 2, 0.3, SB.ink, PL),
  ]),

  // the condiment stand: a lacquer two-drawer stand with a red tray of soy, pickled ginger, wasabi, soy dishes and chopsticks
  piece('sshcondiment', 'Sushi condiment stand', 1, 1, 360, 'gloss', [
    B(16, 9, 0, 28, 18, 20, SB.lac, GL), ...[13.2, 5.6].flatMap(h => [B(16, h, 10.2, 24, 6.4, 0.6, SB.lacL, GL), B(16, h, 10.7, 4, 1, 0.6, SB.red, PL)]),
    B(16, 19, 0, 30, 2, 22, SB.lac, GL),
    B(16, 20.8, 0, 26, 1.6, 18, SB.red, GL),
    LA(8, 21.6, -3, [[2.2, 0], [2.4, 3.6], [1.6, 6], [0.9, 7], [0.9, 7.6]], SB.soy, { m: 'gloss', seg: 10 }), LA(8, 29.2, -3, [[1.3, 0], [1.3, 1.4], [0.6, 2.2], [0, 2.4]], SB.red, { m: 'gloss', seg: 8 }),
    C(16, 24.4, -4, 2.8, 5.6, SB.gari, { m: 'plain', seg: 12 }), C(16, 24.6, -4, 3, 6, SB.glassC, { m: 'glass', seg: 12 }), C(16, 28.1, -4, 3.2, 1, SB.hinD, { m: 'wood', seg: 12 }),
    C(23, 22.2, 4, 2.4, 1.2, SB.white, { m: 'gloss', rb: 1.8, seg: 12 }), S(23, 23, 4, 1.2, 0.8, 1.2, SB.wasabi, { m: 'cloth', seg: 8 }),
    B(24, 24.6, -4, 6, 6, 4, SB.hinD, WD), ...[22.4, 24, 25.6].map(x => RD([x, 27.6, -4], [x, 32, -4], 0.3, SB.lac, PL)),
    C(9.5, 22.2, 5, 2.4, 1.2, SB.white, { m: 'gloss', rb: 1.8, seg: 12 }), C(9.5, 23.4, 5, 2.4, 1.2, SB.white, { m: 'gloss', rb: 1.8, seg: 12 }),
  ]),

  // a glass-door drinks fridge under a red header: green tea, ramune and barley tea on lit shelves, the door swings
  piece('sshfridge', 'Sushi drink fridge', 1, 1, 820, 'gloss', [
    B(16, 1.5, 0, 28, 3, 24, SB.ink, PL),
    B(16, 34, -11.4, 28, 62, 1.6, SB.white, GL),
    ...[1.8, 30.2].map(x => B(x, 34, 0, 2.4, 62, 24, SB.white, GL)),
    B(16, 4, 0, 26, 2, 24, SB.white, GL), B(16, 64, 0, 32, 2, 24, SB.white, GL),
    B(16, 68, 0.6, 32, 6, 23, SB.red, GL), PC(16, 68, 12.2, 26, 5, letters('DRINKS')),
    B(16, 34, -10.4, 25, 58, 0.6, SB.panel, PL),
    ...[19, 34, 49].map(h => B(16, h, -1, 25, 0.8, 19, SB.steelL, MT)),
    ...[5, 19.4, 34.4, 49.4].flatMap((h, r) => [5.6, 10.8, 16, 21.2, 26.4].flatMap((x, i) => bottle(x, h, -1, [SB.tea, SB.ramune, SB.barley][(i + r) % 3], [SB.leaf, SB.white, SB.red][(i + r) % 3]))),
  ], {
    doors: [{ hinge: [1, 12.6], side: 1, parts: [
      ...[2.2, 29.8].map(x => B(x, 34, 12.4, 2.4, 62, 1.2, SB.white, GL)),
      B(16, 64.2, 12.4, 29, 1.6, 1.2, SB.white, GL), B(16, 3.8, 12.4, 29, 1.6, 1.2, SB.white, GL),
      B(16, 34, 12.4, 25.2, 59, 0.4, SB.glassC, GS),
      B(27.4, 40, 13.6, 1.2, 14, 1.4, SB.steelL, MT),
    ] }],
    inside: { x: 16, h: 34, w: 25, hh: 58, z: 11, bare: true },
  }),

  // an akachochin: the red paper lantern, bamboo-ribbed, a brushed fish on it, hung from a hinoki post
  piece('sshlantern', 'Sushi red lantern', 1, 1, 420, 'wood', [
    B(16, 1.4, 0, 18, 2.8, 18, SB.lac, GL),
    B(16, 34, -8, 2.6, 62, 2.6, SB.hinD, WD),
    B(16, 64.6, -2, 2.4, 2, 14, SB.hinD, WD),
    RD([16, 63.6, 4], [16, 58.4, 4], 0.3, SB.ink, PL),
    C(16, 57.4, 4, 5.2, 2, SB.lac, { m: 'gloss', seg: 14 }),
    LA(16, 34.4, 4, [[5.6, 0], [8.2, 3], [9.4, 8], [9.6, 11], [9.4, 14], [8.2, 19], [5.6, 22]], SB.redGlow, { m: 'glow', seg: 16, tex: 'ribs', tc: SB.redD, ts: 1.6 }),
    C(16, 33.4, 4, 5.2, 2, SB.lac, { m: 'gloss', seg: 14 }),
    RD([16, 32.4, 4], [16, 29.6, 4], 0.3, SB.lac, PL), LA(16, 24.4, 4, [[0.4, 0], [1.2, 0.4], [0.9, 3.6], [0.5, 5.2]], SB.lac, { m: 'cloth', seg: 6 }),
    PC(16, 45.4, 13.7, 7, 13, lanternFish),
  ], { glow: [SB.redGlow] }),

  // a paper lamp in the shape of a Wishiwashi, its round eye and fins, glowing blue on a black pole
  piece('sshwishlamp', 'Sushi Wishiwashi lamp', 1, 1, 560, 'wood', [
    B(16, 1.4, 0, 20, 2.8, 16, SB.hinD, WD),
    C(16, 18.4, 0, 1, 31, SB.lac, { m: 'gloss', seg: 8 }),
    S(16, 42, 0, 12, 8, 6.4, SB.blueGlow, { m: 'glow', seg: 14 }),
    PR(16, 42, 0, [[-10, 0], [-15.4, 6], [-14, 0], [-15.4, -6]], 1.2, SB.wish, CL),
    PR(16, 42, 0, [[-4, 6.6], [2, 10.4], [4, 7]], 1, SB.wish, CL),
    PR(16, 42, 0, [[-2, -7], [1, -10.2], [3, -7]], 1, SB.wish, CL),
    PR(16, 42, 0, [[2, 0], [7, -3], [3, -4]], 7.6, SB.wish, CL),
    DS(22.6, 44, 5, 3.2, 0.4, SB.white, { m: 'plain', seg: 14 }), DS(23.2, 44, 5.4, 2, 0.4, SB.ink, { m: 'plain', seg: 12 }), DS(22.4, 44.8, 5.8, 0.6, 0.2, SB.white, { m: 'plain', seg: 6 }),
  ], { glow: [SB.blueGlow] }),

  // a round hinoki wall clock in a red lacquer rim, fish for hands
  wallPiece('sshclock', 'Sushi wall clock', 1, 380, 'wood', [
    DS(16, 56, 1, 12, 2, SB.hin, { m: 'wood', seg: 20 }),
    RG(16, 56, 2, 12, 0.8, SB.red, GL),
    PC(16, 56, 2.1, 15, 15, clockDial),
    RD([16, 69, 0.6], [16, 70.6, 0.6], 0.4, SB.lac, PL),
  ]),

  // the shop's noren: three Dondozo-blue panels on a hinoki rod, white seigaiha hems, Dondozo's crest on the middle one
  wallPiece('sshnoren', 'Sushi Dondozo noren', 2, 520, 'cloth', [
    ...[4, 60].map(x => B(x, 86, 1.5, 2, 4, 3, SB.hinD, WD)),
    RD([1.5, 84, 3], [62.5, 84, 3], 0.9, SB.hinD, WD),
    ...[11.2, 32, 52.8].flatMap(x => [
      B(x, 64.5, 2.4, 20.4, 38, 0.5, SB.dz, CL),
      B(x, 47.6, 2.75, 20.4, 4.2, 0.2, SB.white, WAVE(SB.dzL, 2.2)),
      ...[-6, 6].map(dx => B(x + dx, 84, 3, 3, 2.6, 2.2, SB.dzD, CL)),
    ]),
    PC(32, 67, 2.8, 17, 17, dondozo),
  ]),

  // the menu: nine hinoki tags on a rail, each with its fish's colour, its brushed name and its price in red
  wallPiece('sshmenu', 'Sushi menu tags', 2, 460, 'wood', [
    B(32, 80, 1.5, 62, 3, 3, SB.hinD, WD),
    ...Array.from({ length: 9 }, (_, i) => 5 + i * 6.75).flatMap((x, i) => [B(x, 66.6, 1.2, 5.6, 22, 0.8, SB.hinL, WD), PC(x, 66.6, 1.65, 5.6, 22, tag(i))]),
  ]),

  // the shop sign: a hinoki plank framed in dark wood, SUSHI, a nigiri and a red seal, hung on two cords
  wallPiece('sshsign', 'Sushi shop sign', 2, 620, 'wood', [
    RD([10, 88, 1], [16, 79.6, 1.8], 0.3, SB.ink, PL), RD([54, 88, 1], [48, 79.6, 1.8], 0.3, SB.ink, PL),
    ...[10, 54].map(x => S(x, 88, 1, 0.8, 0.8, 0.8, SB.steel, { m: 'metal', seg: 6 })),
    B(32, 68, 1.8, 58, 22, 2.4, SB.hinDD, WD),
    B(32, 68, 3.2, 54, 18, 0.6, SB.hin, GRN),
    PC(32, 68, 3.6, 50, 15, signFace),
  ]),

  // a makisu-style floor mat of pale bamboo slats bound with cotton thread, an indigo border and a red binding
  { id: 'sshmat', name: 'Sushi bamboo floor mat', group: GROUP, solo: true, w: 3, h: 2, layer: 'rug', price: 520, high: 0.03, side: 'c', flat() {
    const g = ctx();
    g.fillStyle = SB.ind; g.fillRect(0, 1, 96, 62);
    g.fillStyle = SB.red; g.fillRect(3.4, 4.4, 89.2, 55.2);
    for (let y = 5.4, i = 0; y < 58.6; y += 1.6, i++) {
      const c = hash(i, 3, 7) < 0.5 ? '#dccc96' : '#d0be86';
      g.fillStyle = c; g.fillRect(5, y, 86, 1.4);
      g.fillStyle = sh(c, 1); g.fillRect(5, y, 86, 0.35);
      g.fillStyle = sh(c, -2); g.fillRect(5, y + 1.15, 86, 0.25);
      for (let k = 0; k < 5; k++) if (hash(i, k, 9) < 0.5) { g.fillStyle = sh(c, -1); g.fillRect(8 + hash(i, k, 10) * 76, y + 0.4, 1, 0.6); }
    }
    g.fillStyle = SB.white;
    for (const x of [16, 32, 48, 64, 80]) for (let y = 5.4; y < 58.6; y += 1.6) g.fillRect(x - 0.4, y + 0.3, 0.8, 0.8);
    g.fillStyle = SB.indL; for (let x = 2; x < 96; x += 4) { g.fillRect(x, 2, 2, 0.6); g.fillRect(x, 61.4, 2, 0.6); }
  } },

  // the chef's geta: a hinoki board on a lacquer stand, a bamboo leaf, and Tatsugiri in all three forms on its nigiri rice
  piece('sshtatsugiri', 'Sushi Tatsugiri geta', 1, 1, 760, 'gloss', [
    B(16, 7, 0, 28, 14, 18, SB.lac, GL), B(16, 7, 9.1, 24, 10, 0.4, SB.red, PL),
    B(16, 15, 0, 30, 2, 14, SB.hin, GRN),
    B(16, 16.2, 0, 28, 0.4, 12, SB.leaf, PL),
    ...[6.5, 16, 25.5].map(x => B(x, 17.4, 0, 7, 2, 5, SB.rice, { m: 'cloth', r: 0.8 })),
    ...tatsugiri(6.5, 18.4, 0, 'curly'), ...tatsugiri(16, 18.4, 0, 'droopy'), ...tatsugiri(25.5, 18.4, 0, 'stretchy'),
    S(16, 16.8, 5.4, 1, 0.6, 0.8, SB.wasabi, { m: 'cloth', seg: 6 }),
  ]),
];
