/* base-furniture-pizzeria.js  -  the Pizzeria set (furniture expansion session j, 2026-10-17): a whole room of a cosy
   Italian pizzeria, as Animal Crossing's Happy Home Paradise does a room type. Brick and terracotta, dark wood, green,
   white and red trim and red-and-white checked cloths: a domed wood-fired oven whose mouth glows over burning logs, a
   floured dough counter, a glass slice counter under heat lamps, a gelato freezer, an espresso machine, a till, booths
   and trattoria chairs, a chalkboard menu, a neon PIZZA sign, a Chianti shelf hung with garlic and chillies, and a tiled
   floor mat. Charmander minding the oven, Lickitung as the chef and a Pikachu-faced pizza on the poster for the Pokémon
   touches. All solo, fixed colours, sold all year.
   An upright piece is a list of parts in painted units (32 a tile), as in js/base-furniture-ramen.js: `x` across from
   the left of its front, `h` up from the floor (a wall piece's from the foot of its strip), `z` out to the front from
   its middle (a wall piece's from the wall). They're painted here from any side, and js/base-models-pizzeria.js builds
   the same list as 3D parts (BUILT), so picture and model agree. A `wedge` is a side profile ([z, up] points) extruded
   `w` across (the gelato freezer's sloped glass, the shelf's brackets). `tex` is painted only (the model stays plain
   colour): `grain` a stained board's streaks (`pd: 'h'` across), `brick` the oven's courses, `flour` a floured top,
   `check` gingham, `stave` a barrel's staves, `wicker` a fiasco's straw; `tc` is its colour. A `pic` part (the menu,
   the poster, the signs' and labels' words, the checked cloth's front) is painted on the front only, and the model wears
   that crop of the painting. The floor mat is painted from above (RUG). */

import { sh, oval, ovalShade, floorShadow, ctx, hash, glass as glassPane } from './base-paint.js';

export const PZ = {
  brick: '#b5523a', brickD: '#8a3a28', mortar: '#e8d6bc', terra: '#c8693e', terraD: '#9a4a2a', terraL: '#e08c5c',
  stone: '#a49a8c', stoneD: '#7a7266', soot: '#1e1612',
  wood: '#5c3a24', woodL: '#86593a', woodD: '#3e2616', woodK: '#26170e', oak: '#9a6a3c', oakL: '#b8854e', bark: '#5a3a22', grainE: '#d8b07a',
  green: '#2f7a3e', greenD: '#1f5a2c', white: '#f6f1e6', red: '#c8302a', redD: '#8e1e1a', redL: '#e04e3c', cream: '#f2e6cc',
  marble: '#efebe4', steel: '#b0b6ba', steelL: '#d8dde0', steelD: '#767d82', black: '#221c1a', iron: '#2c2a2a',
  brass: '#c9a046', brassD: '#9c7a2e', chalk: '#2c3a33', chalkW: '#eef0e8', kraft: '#c8a676', soil: '#4a3222',
  dough: '#f1dcb0', crust: '#d69a4e', crustD: '#a86a2c', sauce: '#c23a22', cheese: '#f6d77a', cheeseL: '#fbe8a6', mozz: '#fbf6ea', pepperoni: '#a8321f',
  basil: '#3e8a36', basilD: '#2a6426', olive: '#2e2a1e', oil: '#c8a62a', tomato: '#d8352a', garlic: '#efe6d2', chilli: '#c42a1a',
  salami: '#a8483c', straw: '#d8b86a', fiasco: '#2e5a2c', candle: '#f4ecd4', wine: '#6a1a2a', coffee: '#4a2a18',
  vanilla: '#f8efd4', choc: '#6c4028', pistachio: '#b6d68a', strawberry: '#f4a0a8', lemon: '#f6e47a', mint: '#a8e0c8',
  glowF: '#ff8a2a', glowY: '#ffd25a', glowO: '#ffb24a', glowP: '#fff0ba', neonR: '#ff4a3a', neonG: '#5cff7a', neonW: '#f4fff0',
  char: '#f08a3a', charL: '#f8d48a', lick: '#f0a0b0', lickL: '#f8e4c8', lickT: '#e0566e', pika: '#f6d23a',
};
const GROUP = 'Pizzeria';
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

const CL = { m: 'cloth' }, PL = { m: 'plain' }, GL = { m: 'gloss' }, WD = { m: 'wood' }, MT = { m: 'metal' }, GW = { m: 'glow' }, GS = { m: 'glass' };
const GR = { m: 'wood', tex: 'grain' }, GRH = { m: 'wood', tex: 'grain', pd: 'h' };
const BRICK = { m: 'cloth', tex: 'brick', tc: PZ.mortar, ts: 4.4 }, STRAW = { m: 'cloth', tex: 'wicker', ts: 1.4 };

/** An arch's outline about its middle: straight sides `h` tall under a round top rising `rise`, half as wide as w. */
const arch = (w, h, rise, n = 8) => [[-w, 0], [w, 0], ...Array.from({ length: n + 1 }, (_, i) => { const a = i / n * Math.PI; return [w * Math.cos(a), h + rise * Math.sin(a)]; })];
/** A pizza lying flat at x, h, z, r round: its crust, the sauce, and toppings scattered on top. */
function pizza(x, h, z, r, top = 'pep', seg = 16) {
  const out = [C(x, h + 0.4, z, r, 0.8, PZ.crust, { m: 'cloth', seg }), C(x, h + 0.9, z, r * 0.86, 0.3, top === 'white' ? PZ.cheeseL : PZ.sauce, { m: 'plain', seg })];
  const at = [[-0.45, -0.35], [0.35, -0.45], [0, 0.05], [-0.35, 0.4], [0.45, 0.25]];
  if (top === 'pep') at.forEach(([a, c]) => out.push(C(x + a * r, h + 1.15, z + c * r, r * 0.14, 0.2, PZ.pepperoni, { m: 'plain', seg: 8 })));
  if (top === 'marg') at.forEach(([a, c], i) => out.push(i % 2 ? S(x + a * r, h + 1.2, z + c * r, r * 0.1, r * 0.04, r * 0.14, PZ.basil, { m: 'cloth', seg: 6 }) : C(x + a * r, h + 1.15, z + c * r, r * 0.15, 0.2, PZ.mozz, { m: 'plain', seg: 8 })));
  if (top === 'white') at.forEach(([a, c]) => out.push(C(x + a * r, h + 1.15, z + c * r, r * 0.08, 0.2, PZ.olive, { m: 'plain', seg: 6 })));
  return out;
}
/** A straw-wrapped Chianti fiasco on h: the straw ball, the green neck and a red foil cap. */
const fiasco = (x, h, z, k = 1) => [
  S(x, h + 3.6 * k, z, 3.8 * k, 3.6 * k, 3.8 * k, PZ.straw, { ...STRAW, seg: 10 }),
  LA(x, h + 5 * k, z, [[3, 0], [1.8, 3], [0.9, 5.4], [0.9, 8.4], [1.1, 8.8]].map(([r, u]) => [r * k, u * k]), PZ.fiasco, { m: 'gloss', seg: 10 }),
  C(x, h + 14.2 * k, z, 1.05 * k, 1.2 * k, PZ.red, { m: 'plain', seg: 8 }),
];
/** Neon or painted letters (8 wide, 12 tall at s 1) as strokes about a middle x, standing on h. */
const GLYPH = {
  P: [[-4, 0, -4, 12], [-4, 12, 2, 12], [2, 12, 4, 10], [4, 10, 4, 8], [4, 8, 2, 6], [2, 6, -4, 6]],
  I: [[0, 0, 0, 12], [-2.5, 12, 2.5, 12], [-2.5, 0, 2.5, 0]],
  Z: [[-4, 12, 4, 12], [4, 12, -4, 0], [-4, 0, 4, 0]],
  A: [[-4, 0, 0, 12], [0, 12, 4, 0], [-2.4, 4.6, 2.4, 4.6]],
};
const letters = (word, xs, h, z, s, r, c, o) => [...word].flatMap((ch, i) => GLYPH[ch].map(([ax, ah, bx, bh]) => RD([xs[i] + ax * s, h + ah * s, z], [xs[i] + bx * s, h + bh * s, z], r, c, o)));

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
    const across = q.pd === 'h', w0 = across ? y0 : x0, w1 = across ? y1 : x1, l0 = across ? x0 : y0, l1 = across ? x1 : y1;
    g.lineWidth = 0.3;
    for (let w = w0 + 0.7, i = 0; w < w1; w += 0.9, i++) {
      const a = l0 + hash(i, seed, 1) * (l1 - l0) * 0.5, l = (l1 - l0) * (0.3 + hash(i, seed, 2) * 0.6), v = hash(i, seed, 3);
      g.globalAlpha = 0.35; g.strokeStyle = v < 0.5 ? sh(c, -2) : sh(c, 1);
      g.beginPath();
      if (across) { g.moveTo(a, w); g.bezierCurveTo(a + l * 0.3, w + 0.3, a + l * 0.6, w - 0.3, a + l, w); } else { g.moveTo(w, a); g.bezierCurveTo(w + 0.3, a + l * 0.3, w - 0.3, a + l * 0.6, w, a + l); }
      g.stroke();
    }
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
  } else if (q.tex === 'wicker') {
    const s = q.ts || 2;
    g.globalAlpha = 0.55; g.strokeStyle = sh(c, -2); g.lineWidth = 0.3; g.beginPath();
    for (let y = y0 + s * 0.8; y < y1; y += s * 0.8) { g.moveTo(x0, y); g.lineTo(x1, y); }
    g.stroke();
    g.globalAlpha = 0.4; g.fillStyle = sh(c, -2);
    for (let y = y0 + s * 0.4, i = 0; y < y1; y += s * 0.8, i++) for (let x = x0 + (i % 2 ? 0 : s / 2); x < x1 + s; x += s) g.fillRect(x - 0.15, y - s * 0.25, 0.3, s * 0.5);
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
        if (q.r > 0.6 && m !== 'glass' && m !== 'plain' && m !== 'glow') {
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

const SANS = 'Arial Black, Arial, sans-serif';
/** A word across a painted box: bold letters in fg over bg (none for clear). */
const word = (text, fg, bg, k = 0.82) => (g, x, y, w, h) => {
  if (bg) { g.fillStyle = bg; g.fillRect(x, y, w, h); }
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `bold ${h * k}px ${SANS}`; g.fillText(text, x + w / 2, y + h * 0.54, w * 0.94);
};
/** Red gingham: a red cloth crossed by white bands, the squares where they meet whitest. */
const gingham = (g, x, y, w, h) => {
  g.fillStyle = PZ.red; g.fillRect(x, y, w, h);
  g.fillStyle = 'rgba(255,255,255,0.5)';
  for (let px = x; px < x + w; px += 4) g.fillRect(px, y, 2, h);
  for (let py = y; py < y + h; py += 4) g.fillRect(x, py, w, 2);
};
/** A pizza seen from above at cx, cy, r round: crust, sauce, cheese, pepperoni and basil. */
function topPizza(g, cx, cy, r) {
  g.fillStyle = PZ.crust; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill();
  g.fillStyle = PZ.sauce; g.beginPath(); g.arc(cx, cy, r * 0.84, 0, TAU); g.fill();
  g.fillStyle = PZ.cheese; g.beginPath(); g.arc(cx, cy, r * 0.76, 0, TAU); g.fill();
  for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + 0.3, d = r * (i % 2 ? 0.48 : 0.3); g.fillStyle = PZ.pepperoni; g.beginPath(); g.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, r * 0.11, 0, TAU); g.fill(); }
  g.fillStyle = PZ.basil;
  for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 1.1; g.beginPath(); g.ellipse(cx + Math.cos(a) * r * 0.6, cy + Math.sin(a) * r * 0.6, r * 0.09, r * 0.05, a, 0, TAU); g.fill(); }
  g.strokeStyle = sh(PZ.crust, -1); g.lineWidth = r * 0.03;
  for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI; g.beginPath(); g.moveTo(cx - Math.cos(a) * r * 0.82, cy - Math.sin(a) * r * 0.82); g.lineTo(cx + Math.cos(a) * r * 0.82, cy + Math.sin(a) * r * 0.82); g.stroke(); }
}

/** The chalkboard menu: PIZZE in chalk over a green, white and red rule, five pizzas and their prices, a chalk pizza. */
function menu(g, x, y, w, h) {
  g.fillStyle = PZ.chalk; g.fillRect(x, y, w, h);
  g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(x + w * 0.1, y + h * 0.2, w * 0.5, h * 0.5);
  g.fillStyle = PZ.chalkW; g.textBaseline = 'middle'; g.textAlign = 'center';
  g.font = `bold ${h * 0.18}px ${SANS}`; g.fillText('PIZZE', x + w * 0.34, y + h * 0.15, w * 0.5);
  [[PZ.green, 0], ['#ffffff', 1], [PZ.redL, 2]].forEach(([c, i]) => { g.fillStyle = c; g.fillRect(x + w * (0.12 + i * 0.148), y + h * 0.27, w * 0.148, h * 0.035); });
  const items = [['MARGHERITA', '8'], ['DIAVOLA', '9'], ['CAPRICCIOSA', '10'], ['QUATTRO FORMAGGI', '11'], ['CALZONE', '9']];
  g.font = `bold ${h * 0.085}px ${SANS}`;
  items.forEach(([n, p], i) => {
    const yy = y + h * (0.39 + i * 0.12);
    g.fillStyle = PZ.chalkW; g.textAlign = 'left'; g.fillText(n, x + w * 0.06, yy, w * 0.46);
    g.fillStyle = PZ.cheese; g.textAlign = 'right'; g.fillText(p, x + w * 0.62, yy, w * 0.08);
  });
  const cx = x + w * 0.8, cy = y + h * 0.55, r = h * 0.3;
  g.strokeStyle = PZ.chalkW; g.lineWidth = h * 0.02; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.stroke();
  g.beginPath(); g.arc(cx, cy, r * 0.8, 0, TAU); g.stroke();
  for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI + 0.3; g.beginPath(); g.moveTo(cx - Math.cos(a) * r * 0.8, cy - Math.sin(a) * r * 0.8); g.lineTo(cx + Math.cos(a) * r * 0.8, cy + Math.sin(a) * r * 0.8); g.stroke(); }
  g.fillStyle = PZ.strawberry;
  for (const [dx, dy] of [[-0.4, -0.2], [0.3, -0.4], [0.1, 0.4], [-0.3, 0.35], [0.45, 0.1]]) { g.beginPath(); g.arc(cx + dx * r, cy + dy * r, r * 0.1, 0, TAU); g.fill(); }
  g.fillStyle = PZ.chalkW; g.textAlign = 'center'; g.font = `bold ${h * 0.08}px ${SANS}`; g.fillText('OGGI!', cx, y + h * 0.13, w * 0.3);
}

/** The poster: a pizza made into Pikachu's face (cheese for fur, crust ears tipped with olive, pepperoni cheeks, olive
    eyes, a little smile in sauce) on a green, white and red ground; PIKA above, PIZZA below. */
function poster(g, x, y, w, h) {
  const cx = x + w / 2, cy = y + h * 0.53, s = w;
  g.fillStyle = PZ.white; g.fillRect(x, y, w, h);
  g.fillStyle = PZ.green; g.fillRect(x, y + h * 0.17, w / 3, h * 0.69);
  g.fillStyle = PZ.red; g.fillRect(x + w * 2 / 3, y + h * 0.17, w / 3, h * 0.69);
  g.fillStyle = PZ.green; g.fillRect(x, y, w, h * 0.17);
  g.fillStyle = PZ.red; g.fillRect(x, y + h * 0.86, w, h * 0.14);
  g.fillStyle = PZ.pika; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `bold ${h * 0.12}px ${SANS}`; g.fillText('PIKA', cx, y + h * 0.095, w * 0.9);
  g.fillStyle = PZ.white; g.font = `bold ${h * 0.1}px ${SANS}`; g.fillText('PIZZA', cx, y + h * 0.935, w * 0.9);
  g.strokeStyle = PZ.crustD; g.lineWidth = s * 0.015;
  for (const sg of [-1, 1]) {
    g.fillStyle = PZ.crust; g.beginPath(); g.moveTo(cx + sg * s * 0.12, cy - s * 0.24); g.lineTo(cx + sg * s * 0.38, cy - s * 0.56); g.lineTo(cx + sg * s * 0.3, cy - s * 0.16); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = PZ.olive; g.beginPath(); g.moveTo(cx + sg * s * 0.3, cy - s * 0.46); g.lineTo(cx + sg * s * 0.38, cy - s * 0.56); g.lineTo(cx + sg * s * 0.35, cy - s * 0.4); g.closePath(); g.fill();
  }
  g.fillStyle = PZ.crust; g.beginPath(); g.arc(cx, cy, s * 0.33, 0, TAU); g.fill(); g.stroke();
  g.fillStyle = PZ.pika; g.beginPath(); g.arc(cx, cy, s * 0.28, 0, TAU); g.fill();
  g.fillStyle = sh(PZ.pika, 1);
  for (const [dx, dy] of [[-0.12, -0.16], [0.14, -0.1], [0.04, 0.18]]) { g.beginPath(); g.arc(cx + dx * s, cy + dy * s, s * 0.04, 0, TAU); g.fill(); }
  for (const sg of [-1, 1]) {
    g.fillStyle = PZ.olive; g.beginPath(); g.arc(cx + sg * s * 0.1, cy - s * 0.05, s * 0.045, 0, TAU); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(cx + sg * s * 0.1 - s * 0.012, cy - s * 0.065, s * 0.015, 0, TAU); g.fill();
    g.fillStyle = PZ.pepperoni; g.beginPath(); g.arc(cx + sg * s * 0.19, cy + s * 0.07, s * 0.055, 0, TAU); g.fill();
  }
  g.fillStyle = PZ.olive; g.beginPath(); g.arc(cx, cy + s * 0.02, s * 0.012, 0, TAU); g.fill();
  g.strokeStyle = PZ.sauce; g.lineWidth = s * 0.018; g.lineCap = 'round';
  g.beginPath(); g.moveTo(cx - s * 0.06, cy + s * 0.07); g.quadraticCurveTo(cx - s * 0.03, cy + s * 0.11, cx, cy + s * 0.07); g.quadraticCurveTo(cx + s * 0.03, cy + s * 0.11, cx + s * 0.06, cy + s * 0.07); g.stroke();
}

/** The pizza box lid's print: a red ring round PIZZA on the kraft card, HOT & FRESH under it. */
function lid(g, x, y, w, h) {
  const cx = x + w / 2, cy = y + h * 0.45, r = Math.min(w, h) * 0.36;
  g.fillStyle = PZ.kraft; g.fillRect(x, y, w, h);
  g.strokeStyle = PZ.red; g.lineWidth = r * 0.12; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.stroke();
  g.fillStyle = PZ.red; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `bold ${r * 0.5}px ${SANS}`; g.fillText('PIZZA', cx, cy + r * 0.04, r * 1.6);
  g.fillStyle = PZ.green; g.font = `bold ${h * 0.09}px ${SANS}`; g.fillText('HOT & FRESH', cx, y + h * 0.9, w * 0.8);
}

/** A tin's label: a band of colour, the word in cream, a thin gold rule above and below. */
const label = (text, bg, fg = PZ.cream) => (g, x, y, w, h) => {
  g.fillStyle = bg; g.fillRect(x, y, w, h);
  g.fillStyle = PZ.brass; g.fillRect(x, y + h * 0.08, w, h * 0.06); g.fillRect(x, y + h * 0.86, w, h * 0.06);
  word(text, fg, null, 0.42)(g, x, y, w, h);
};

/* ---------- the kinds ---------- */

/** What js/base-models-pizzeria.js builds for each upright and wall kind: its parts, doors and default material. */
export const BUILT = {};
/** The floor mat's outline from above, in painted units across its 3 x 2 tiles, corners cut. */
export const RUG = [[4, 2], [92, 2], [94, 4], [94, 60], [92, 62], [4, 62], [2, 60], [2, 4]];

function piece(id, name, w, h, price, mat, parts, { doors = [], inside, ...rest } = {}) {
  BUILT[id] = { parts, doors, inside, mat };
  const all = [...parts, ...doors.flatMap(d => d.parts)];
  return { id, name, group: GROUP, solo: true, w, h, price, ...rest, draw(x, b, vw, dir) { floorShadow(x, b, vw); paintParts(all, x, b, vw, dir, w * 32); } };
}
function wallPiece(id, name, w, price, mat, parts, rest = {}) {
  BUILT[id] = { parts, doors: [], mat };
  return { id, name, group: GROUP, solo: true, w, h: 1, layer: 'wall', price, ...rest, wall(x) { paintParts(parts, x, 96, w * 32, 0, w * 32); } };
}

const foot4 = (xs, zs, s, hh, c = PZ.woodD) => xs.flatMap(x => zs.map(z => B(x, hh / 2, z, s, hh, s, c, WD)));
const FLAME = [[-8, 0], [8, 0], [7, 4], [5.4, 9], [3.6, 5.4], [2, 11.4], [0, 6.4], [-2, 10.6], [-3.8, 5.6], [-5.8, 8.6], [-7.2, 4]];
const flameAt = (k) => FLAME.map(([a, c]) => [a * k, c * k]);

export const PIZZERIA_KINDS = [
  // the wood-fired oven: a terracotta brick dome on a brick base, an arched brick portal round the mouth where logs burn,
  // a steel flue, split logs stored in an arch below, and Charmander sat on the hearth ledge minding the fire
  piece('pzroven', 'Pizzeria wood-fired oven', 2, 2, 1850, 'cloth', [
    B(32, 1.5, -2, 64, 3, 60, PZ.stoneD, PL),
    B(32, 16, -2, 62, 26, 58, PZ.brick, BRICK),
    PR(32, 4, 27.3, arch(13, 5, 7), 0.8, PZ.soot, PL),
    ...[[22, 7], [27, 7], [32, 7], [37, 7], [42, 7], [24.5, 11.4], [29.5, 11.4], [34.5, 11.4], [39.5, 11.4], [27, 15.6], [32, 15.6], [37, 15.6]].flatMap(([x, h]) => [DS(x, h, 27.9, 2.3, 0.6, PZ.bark, { m: 'wood', seg: 8 }), DS(x, h, 28.25, 1.7, 0.2, PZ.grainE, { m: 'plain', seg: 8 })]),
    B(32, 30, -2, 64, 2, 60, PZ.stone, CL),
    LA(32, 31, -6, [[25, 0], [24.6, 5.8], [22.9, 11.5], [19.6, 16.7], [14.4, 21], [7.7, 23.7], [0, 24.6]], PZ.terra, { ...BRICK, ts: 3.6, seg: 16 }),
    PR(32, 31, 22, arch(16, 11, 14), 8, PZ.terra, { ...BRICK, ts: 3.6 }),
    B(32, 55.6, 26.3, 4, 3.6, 0.8, PZ.terraD, CL),
    PR(32, 31.2, 26.3, arch(10, 6, 8), 0.8, PZ.soot, PL),
    RD([24, 33, 26.9], [39, 34.8, 26.9], 1.3, PZ.bark, WD), RD([26, 34.8, 27.1], [41, 33, 27.1], 1.3, PZ.bark, WD),
    PR(32, 33, 27.5, flameAt(1), 0.4, PZ.glowF, GW), PR(32, 33.4, 27.8, flameAt(0.6), 0.3, PZ.glowY, GW),
    B(32, 29.8, 28.6, 42, 2.4, 6, PZ.stone, CL),
    C(32, 63, 21, 3.4, 14, PZ.steelD, { m: 'metal', seg: 12 }), C(32, 70.6, 21, 4.8, 1.2, PZ.steelD, { m: 'metal', seg: 12 }),
    S(47, 35, 28.6, 3.4, 4, 2.8, PZ.char, { m: 'cloth', seg: 10 }), S(47, 34.4, 30.6, 2.2, 2.8, 1, PZ.charL, { m: 'cloth', seg: 8 }),
    S(47, 42, 28.8, 3.8, 3.4, 2.9, PZ.char, { m: 'cloth', seg: 12 }),
    ...[45.6, 48.4].map(x => DS(x, 42.6, 31.5, 0.7, 0.3, PZ.black, { m: 'plain', seg: 6 })),
    ...[44.8, 49.2].map(x => S(x, 31.6, 30, 1.4, 0.8, 1.4, PZ.char, { m: 'cloth', seg: 8 })),
    ...[43.8, 50.2].map(x => S(x, 36, 29.6, 1, 1.4, 1, PZ.char, { m: 'cloth', seg: 8 })),
    RD([49.6, 32, 26.6], [53.6, 35.4, 26], 0.9, PZ.char, CL), S(54, 38.2, 26, 1.5, 2.2, 1.4, PZ.glowY, { m: 'glow', seg: 8 }),
  ], { glow: [PZ.glowF, PZ.glowY] }),

  // the dough-prep counter: dark wood with green doors, a floured marble top, dough balls on a tray, a base stretched and
  // sauced, a rolling pin, bowls of sauce and grated cheese
  piece('pzrprep', 'Pizzeria dough-prep counter', 2, 1, 1150, 'wood', [
    B(32, 1.5, 0, 60, 3, 24, PZ.woodK, WD),
    B(32, 14, 0, 62, 22, 26, PZ.wood, GR),
    ...[11, 32, 53].flatMap(x => [B(x, 13.6, 13.3, 19, 17, 0.8, PZ.green, GL), DS(x, 19.4, 13.9, 0.9, 0.8, PZ.brass, { m: 'metal', seg: 8 })]),
    B(32, 24.4, 13.4, 62, 0.9, 0.6, PZ.red, PL),
    B(32, 26.4, 0, 64, 2.8, 30, PZ.marble, { m: 'gloss', tex: 'flour' }),
    B(10, 28.8, -6, 17, 2, 12, PZ.steelD, MT),
    ...[4.6, 10, 15.4].map(x => S(x, 30.8, -6, 2.6, 2, 2.6, PZ.dough, { m: 'cloth', seg: 10 })),
    ...pizza(30, 27.8, 3, 9.6, 'marg', 18),
    RD([42, 29.6, 9], [58, 29.6, 9], 1.6, PZ.woodL, WD), RD([39.4, 29.6, 9], [42, 29.6, 9], 0.6, PZ.woodD, WD), RD([58, 29.6, 9], [60.6, 29.6, 9], 0.6, PZ.woodD, WD),
    LA(48, 27.8, -6, [[2.4, 0], [3.6, 1], [4.6, 3.6], [4.4, 3.8]], PZ.white, { m: 'gloss', seg: 12 }), C(48, 31.2, -6, 4.2, 0.4, PZ.sauce, { m: 'plain', seg: 12 }),
    RD([49, 31.4, -6], [52.4, 37, -8], 0.35, PZ.steelL, MT),
    LA(58, 27.8, -6, [[2, 0], [3, 0.8], [3.8, 3], [3.6, 3.2]], PZ.green, { m: 'gloss', seg: 12 }), S(58, 30.8, -6, 3.2, 1, 3.2, PZ.cheeseL, { m: 'cloth', seg: 8 }),
  ]),

  // an espresso machine on a small dark cabinet striped green, white and red: a red body with a chrome front, two group
  // heads over cups, a steam wand, a pressure gauge, a chrome dome topped by a little finial
  piece('pzrespresso', 'Pizzeria espresso machine', 1, 1, 950, 'metal', [
    B(16, 1, -2, 26, 2, 22, PZ.woodK, PL),
    B(16, 11, -2, 28, 18, 24, PZ.woodD, GR),
    ...[[17, PZ.green], [15.4, PZ.white], [13.8, PZ.red]].map(([h, c]) => B(16, h, 10.3, 24, 1.6, 0.6, c, PL)),
    B(16, 6.6, 10.2, 24, 7, 0.4, PZ.woodK, WD),
    B(16, 20.8, -2, 30, 1.6, 26, PZ.marble, GL),
    B(16, 29.6, -5, 24, 15, 14, PZ.red, GL),
    B(16, 29.4, 2.3, 22, 12, 0.6, PZ.steelL, MT),
    DS(16, 33.6, 2.9, 1.8, 0.4, PZ.cream, { m: 'plain', seg: 12 }), RD([16, 33.6, 3.2], [17, 34.6, 3.2], 0.15, PZ.black, PL),
    B(16, 22.1, 4.2, 24, 0.8, 5, PZ.steelD, MT),
    ...[10.5, 21.5].flatMap(x => [C(x, 26.6, 4.4, 2.2, 2.4, PZ.steel, { m: 'metal', seg: 12 }), RD([x, 25.2, 5], [x, 24.8, 10.4], 0.6, PZ.black, GL),
      C(x, 23.4, 4.4, 1.3, 1.8, PZ.white, { m: 'gloss', seg: 10, rb: 1.1 })]),
    RD([25.6, 31, 0], [26.4, 24.5, 5], 0.35, PZ.steelL, MT),
    LA(16, 37.1, -5, [[8, 0], [7.6, 1.8], [5.4, 3.8], [1.6, 4.8], [1.6, 6.2], [2.8, 6.8], [0, 7.6]], PZ.steelL, { m: 'metal', seg: 14 }),
    LA(4, 21.6, 4, [[1.6, 0], [1.8, 3], [1.4, 4], [1.6, 4.4]], PZ.steelL, { m: 'metal', seg: 10 }),
  ]),

  // a gelato freezer: white with a green front and a red band, ten steel tubs of gelato in every colour under sloped
  // glass, a glowing GELATERIA sign on posts at the back
  piece('pzrgelato', 'Pizzeria gelato freezer', 2, 1, 1350, 'gloss', [
    B(32, 1.5, 0, 60, 3, 24, PZ.black, PL),
    B(32, 14, 0, 62, 22, 26, PZ.white, GL),
    B(32, 13, 13.3, 58, 15, 0.6, PZ.green, GL), PC(32, 13, 13.65, 40, 7, word('GELATO', PZ.white, PZ.green)),
    B(32, 22.6, 13.4, 62, 1.6, 0.6, PZ.red, PL),
    B(32, 25.6, 0, 62, 1.6, 26, PZ.steelL, MT),
    ...[[-6, [PZ.vanilla, PZ.choc, PZ.pistachio, PZ.strawberry, PZ.mint]], [4, [PZ.lemon, PZ.strawberry, PZ.vanilla, PZ.choc, PZ.pistachio]]].flatMap(([z, cs]) =>
      [8, 20, 32, 44, 56].flatMap((x, i) => [B(x, 27.2, z, 11, 1.6, 9, PZ.steelD, { m: 'metal', r: 0.4 }), S(x, 28.4, z, 4.6, 2.4, 3.8, cs[i], { m: 'cloth', seg: 8 })])),
    WG(32, 26.4, 0, 62, [[13.4, 0], [12.6, 0], [1.6, 11], [-13, 11], [-13, 11.8], [2, 11.8]], '#cfe8f4', GS),
    ...[1.2, 62.8].map(x => B(x, 32, 0, 0.4, 11, 26, '#cfe8f4', GS)),
    ...[5, 59].map(x => RD([x, 26.4, -12], [x, 42, -12], 0.6, PZ.steel, MT)),
    B(32, 46, -12, 50, 8, 1.6, PZ.red, GL), B(32, 46, -11.1, 46, 6, 0.4, PZ.glowP, GW), PC(32, 46, -10.85, 42, 5, word('GELATERIA', PZ.redD, null)),
  ], { glow: [PZ.glowP] }),

  // the slice counter: a terracotta brick front trimmed green and white, three whole pizzas on steel trays (pepperoni,
  // margherita, bianca with olives) under a glass case, a hood of heat lamps glowing over them
  piece('pzrslice', 'Pizzeria slice display counter', 2, 1, 1300, 'cloth', [
    B(32, 1.5, 0, 60, 3, 24, PZ.woodK, WD),
    B(32, 15, 0, 62, 24, 26, PZ.terra, { ...BRICK, ts: 4 }),
    B(32, 24.4, 13.4, 62, 1.6, 0.6, PZ.white, PL), B(32, 26.2, 13.4, 62, 1.6, 0.6, PZ.green, PL),
    B(32, 28, 0, 64, 2, 28, PZ.woodD, GL),
    ...[[11, 'pep'], [32, 'marg'], [53, 'white']].flatMap(([x, top]) => [C(x, 29.3, 1, 9.4, 0.6, PZ.steelD, { m: 'metal', seg: 16 }), ...pizza(x, 29.4, 1, 8.8, top)]),
    B(32, 35, 13.2, 63, 10, 0.4, '#cfe8f4', GS), B(32, 40.2, 1, 63, 0.4, 24.6, '#cfe8f4', GS),
    ...[0.8, 63.2].map(x => B(x, 35, 1, 0.4, 10, 24, '#cfe8f4', GS)),
    RD([0.6, 40.2, 13.2], [63.4, 40.2, 13.2], 0.4, PZ.steelL, MT),
    ...[2, 62].map(x => RD([x, 29, -12], [x, 48, -12], 0.7, PZ.steel, MT)),
    B(32, 48, -6, 62, 3, 14, PZ.steelD, MT), B(32, 46.3, -6, 56, 0.5, 10, PZ.glowO, GW),
  ], { glow: [PZ.glowO] }),

  // the till: dark wood with a green panel, a brass cash register showing the bill, a tip jar of coins, a service bell
  piece('pzrtill', 'Pizzeria till counter', 1, 1, 980, 'wood', [
    B(16, 1.5, 0, 28, 3, 24, PZ.woodK, WD),
    B(16, 15, 0, 30, 24, 26, PZ.wood, GR),
    B(16, 14, 13.3, 24, 16, 0.6, PZ.green, GL),
    B(16, 24.4, 13.4, 30, 1, 0.6, PZ.white, PL), B(16, 25.6, 13.4, 30, 1, 0.6, PZ.red, PL),
    B(16, 28, 0, 32, 2, 28, PZ.marble, GL),
    B(13, 31.6, -3, 18, 5.2, 14, PZ.brass, MT), B(13, 29.8, 4.3, 17, 1.6, 0.6, PZ.brassD, MT),
    WG(13, 34.2, -3, 18, [[7, 0], [-5, 0], [-5, 4], [7, 0.8]], PZ.brassD, MT),
    ...[0, 1].flatMap(row => [7.4, 11.2, 15, 18.8].map(x => DS(x, 35 + row * 1.6, 3.6 - row * 4, 0.8, 0.4, PZ.cream, { m: 'plain', seg: 6 }))),
    B(13, 40.2, -7, 10, 4.4, 3, PZ.brass, MT), PC(13, 40.2, -5.45, 8, 3, word('8.50', '#2a2a2a', PZ.cream)),
    LA(25.5, 29, 5, [[2.4, 0], [2.6, 5], [2.2, 5.6], [2.4, 6]], '#cfe8f4', { m: 'glass', seg: 10 }), C(25.5, 29.8, 5, 2.1, 1.4, PZ.brass, { m: 'metal', seg: 10 }),
    LA(25.5, 29, -7, [[2.6, 0], [2.4, 0.6], [1.4, 2], [0.6, 2.8], [0, 3]], PZ.brass, { m: 'metal', seg: 10 }), S(25.5, 32.4, -7, 0.5, 0.5, 0.5, PZ.brassD, { m: 'metal', seg: 6 }),
  ]),

  // a stack of pizza boxes, kraft and white with PIZZA stamped on their edges, the top one open on a pepperoni pizza
  piece('pzrboxes', 'Pizzeria pizza box stack', 1, 1, 300, 'cloth', [
    ...[0, 0.8, -0.6, 0.5, -0.4, 0.2].flatMap((o, k) => [B(16 + o, 1.6 + k * 3.2, 0, 28, 3, 28, k % 2 ? PZ.white : PZ.kraft, { m: 'cloth', r: 0.4 }), PC(16 + o, 1.6 + k * 3.2, 14.05, 12, 2.2, word('PIZZA', PZ.red, null, 0.9))]),
    B(16.2, 33.1, -13.6, 28, 28, 0.6, PZ.kraft, { m: 'cloth', r: 0.4 }), PC(16.2, 33.1, -13.25, 22, 22, lid),
    ...pizza(16.2, 18.8, 1, 12, 'pep', 18),
  ]),

  // a peel stand: a dark board on a slotted base, a wooden peel, a round steel peel and the oven brush stood in it
  piece('pzrpeel', 'Pizzeria peel stand', 1, 1, 360, 'wood', [
    B(16, 1.5, -4, 28, 3, 14, PZ.woodD, WD), B(16, 4.4, -4, 26, 2.8, 10, PZ.woodK, WD),
    B(16, 30, -11, 24, 54, 2, PZ.woodD, GR), B(16, 57.6, -11, 26, 2, 3, PZ.woodK, WD),
    RD([8, 5, -4.6], [8, 32, -7.2], 1, PZ.woodL, WD),
    PR(8, 32, -7.6, [[-1.4, -2], [1.4, -2], [6, 1], [6, 10], [4, 13.6], [0, 14.4], [-4, 13.6], [-6, 10], [-6, 1]], 0.8, PZ.woodL, GR),
    RD([22, 5, -4.6], [22, 34, -7.4], 0.8, PZ.woodK, WD), RD([22, 33.6, -7.5], [22, 35.6, -7.7], 1.2, PZ.steelL, MT),
    DS(22, 41.4, -7.8, 6.4, 0.5, PZ.steelL, { m: 'metal', seg: 16 }),
    RD([15, 5, -3.6], [15, 50, -5.6], 0.6, PZ.woodL, WD), B(15, 52.4, -5.8, 5, 4.6, 2.4, PZ.brassD, { m: 'cloth', r: 0.6 }),
  ]),

  // the firewood rack: an iron frame filled with split oak logs, their cut ends facing out
  piece('pzrlogs', 'Pizzeria firewood rack', 1, 1, 380, 'wood', [
    B(16, 1.5, 0, 30, 3, 22, PZ.iron, MT),
    ...[2, 30].flatMap(x => [-9, 9].map(z => RD([x, 3, z], [x, 47, z], 0.6, PZ.iron, MT))),
    ...[-9, 9].map(z => RD([2, 47, z], [30, 47, z], 0.6, PZ.iron, MT)), ...[2, 30].map(x => RD([x, 47, -9], [x, 47, 9], 0.6, PZ.iron, MT)),
    ...[6.2, 11.8, 17.4, 23, 28.6, 34.2, 39.8].flatMap((h, row) => [6.5, 12.8, 19.1, 25.4].flatMap((x, i) => {
      const r = 2.7 + ((row * 3 + i) % 3) * 0.12;
      return [DS(x, h, 0, r, 19, PZ.bark, { m: 'wood', seg: 8 }), DS(x, h, 9.65, r * 0.8, 0.3, PZ.grainE, { m: 'plain', seg: 8 })];
    })),
  ]),

  // tomato crates: two slatted crates below, one heaped with ripe tomatoes on top, POMODORI stamped on its front
  piece('pzrcrates', 'Pizzeria tomato crates', 1, 1, 340, 'wood', [
    B(8.5, 6, 0, 15, 12, 24, PZ.oak, GRH), B(23.5, 6, 1, 15, 12, 22, PZ.oakL, GRH),
    B(16, 18.4, -1, 28, 12.4, 22, PZ.oak, { ...GRH, r: 0.6 }), PC(16, 18.4, 10.05, 18, 4, label('POMODORI', PZ.red)),
    ...[[5, -7], [10.5, -7], [16, -7], [21.5, -7], [27, -7], [7.7, -1], [13.2, -1], [18.8, -1], [24.3, -1], [5, 5], [10.5, 5], [16, 5], [21.5, 5], [27, 5]].map(([x, z], i) =>
      S(x, i > 4 && i < 9 ? 27.6 : 25.6, z, 2.6, 2.2, 2.6, PZ.tomato, { m: 'gloss', seg: 8 })),
    ...[[10.5, 5], [21.5, 5], [13.2, -1]].map(([x, z]) => S(x, z < 0 ? 29.8 : 27.8, z, 0.9, 0.4, 0.9, PZ.basil, { m: 'cloth', seg: 6 })),
  ]),

  // a trattoria chair painted green: a ladder back, a rush seat with a red cushion
  piece('pzrchair', 'Pizzeria trattoria chair', 1, 1, 280, 'gloss', [
    ...[7, 25].flatMap(x => [RD([x, 0.6, 8], [x, 17, 8], 0.9, PZ.green, GL), RD([x, 0.6, -7], [x, 42, -7], 1, PZ.green, GL), S(x, 42.6, -7, 1.2, 1.2, 1.2, PZ.green, { m: 'gloss', seg: 8 }),
      RD([x, 6, -7], [x, 6, 8], 0.5, PZ.green, GL)]),
    RD([7, 6, 8], [25, 6, 8], 0.5, PZ.green, GL),
    B(16, 16.4, 0.5, 21, 1.2, 17, PZ.greenD, GL), B(16, 17.6, 0.5, 20, 1.4, 16, PZ.straw, { m: 'cloth', tex: 'wicker', ts: 1.6 }),
    B(16, 19.2, 1, 19, 1.8, 15, PZ.red, { m: 'cloth', r: 0.8 }),
    ...[[25, PZ.green], [31, PZ.green], [37, PZ.red]].map(([h, c]) => B(16, h, -7, 17, 2.6, 1, c, GL)),
  ]),

  // a wooden bar stool: four splayed legs, a brass foot ring, a red cushion piped in green
  piece('pzrstool', 'Pizzeria bar stool', 1, 1, 240, 'wood', [
    ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => RD([16 + sx * 10, 0.6, sz * 10], [16 + sx * 5.5, 27, sz * 5.5], 0.9, PZ.woodD, WD)),
    RG(16, 10, 0, 8.4, 0.5, PZ.brass, { m: 'metal', flat: true }),
    C(16, 28, 0, 8, 2, PZ.woodD, { m: 'wood', seg: 16 }),
    C(16, 30, 0, 7.4, 2, PZ.red, { m: 'cloth', seg: 16, rb: 7.8 }),
    RG(16, 29.1, 0, 7.8, 0.4, PZ.green, { m: 'plain', flat: true }),
  ]),

  // a booth for two: dark wood framing a buttoned red seat and back, green piping, a carved crest along the top
  piece('pzrbooth', 'Pizzeria red booth', 2, 1, 950, 'wood', [
    B(32, 0.8, 1, 60, 1.6, 24, PZ.woodK, WD),
    B(32, 6.2, 1, 62, 9.4, 26, PZ.woodD, GR),
    B(32, 13.4, 3, 56, 5, 20, PZ.red, { m: 'cloth', r: 2 }), B(32, 15.6, 13.1, 56, 0.7, 0.6, PZ.green, PL),
    B(32, 30, -10, 64, 40, 10, PZ.woodD, GR),
    B(32, 30, -4.4, 56, 28, 2.4, PZ.red, { m: 'cloth', r: 2 }),
    ...[22, 30, 38].flatMap(h => [10, 19, 28, 36, 45, 54].map(x => DS(x, h, -3.1, 0.5, 0.3, PZ.redD, { m: 'plain', seg: 6 }))),
    ...[2, 62].map(x => B(x, 17, 1, 4, 14, 26, PZ.woodD, GR)),
    B(32, 51, -10, 64, 2, 11, PZ.woodK, WD), PR(32, 52, -10, [[-12, 0], [12, 0], [9, 2.6], [0, 4], [-9, 2.6]], 6, PZ.woodK, WD),
  ]),

  // the family table: dark wood under a red-and-white checked cloth, a pepperoni pizza raised on a stand in the middle,
  // two plates, water glasses, a parmesan shaker and a jar of chilli flakes
  piece('pzrtable', 'Pizzeria family table', 2, 1, 780, 'wood', [
    ...foot4([5, 59], [-10, 10], 3, 24),
    B(32, 22.5, 0, 58, 3, 22, PZ.woodD, WD),
    B(32, 25.6, 0, 64, 1.2, 30, PZ.red, { m: 'cloth', r: 0.4, tex: 'check', tc: '#ffffff', ts: 2 }),
    B(32, 22.6, 14.7, 64, 6, 0.6, PZ.red, { m: 'cloth', r: 0.2 }), PC(32, 22.6, 15.05, 64, 6, gingham),
    B(32, 22.6, -14.7, 64, 6, 0.6, PZ.red, { m: 'cloth', r: 0.2, tex: 'check', tc: '#ffffff', ts: 2 }),
    ...[0.3, 63.7].map(x => B(x, 22.6, 0, 0.6, 6, 30, PZ.red, { m: 'cloth', r: 0.2, tex: 'check', tc: '#ffffff', ts: 2 })),
    LA(32, 26.2, 0, [[3, 0], [3, 0.6], [1, 1.4], [0.8, 5], [9.6, 5.6], [9.8, 6.2], [0, 6.4]], PZ.steelL, { m: 'metal', seg: 16 }),
    ...pizza(32, 32.6, 0, 9.2, 'pep'),
    ...[12, 52].flatMap(x => [C(x, 26.5, 6, 4.6, 0.6, PZ.white, { m: 'gloss', seg: 14 }), LA(x + (x < 32 ? -6 : 6), 26.2, -2, [[1, 0], [1.4, 0.4], [1.6, 5]], '#cfe8f4', { m: 'glass', seg: 10 })]),
    LA(22, 26.2, -7, [[1.6, 0], [1.6, 4], [1.2, 4.6]], PZ.cream, { m: 'gloss', seg: 10 }), LA(22, 30.8, -7, [[1.2, 0], [1, 0.8], [0, 1.4]], PZ.steelL, { m: 'metal', seg: 10 }),
    LA(42, 26.2, -7, [[1.6, 0], [1.6, 4], [1.2, 4.6]], PZ.chilli, { m: 'gloss', seg: 10 }), LA(42, 30.8, -7, [[1.2, 0], [1, 0.8], [0, 1.4]], PZ.steelL, { m: 'metal', seg: 10 }),
  ]),

  // a café table: a round top edged in terracotta tile on a black iron tripod, an espresso and a coupe of gelato
  piece('pzrcafe', 'Pizzeria tile-top café table', 1, 1, 440, 'metal', [
    ...[0, 2.09, 4.19].map(a => RD([16, 7.6, 0], [16 + Math.cos(a) * 10, 0.6, Math.sin(a) * 10], 0.6, PZ.iron, MT)),
    C(16, 7, 0, 2, 2, PZ.iron, { m: 'metal', seg: 10 }), C(16, 16, 0, 1.1, 18, PZ.iron, { m: 'metal', seg: 8 }),
    C(16, 24.6, 0, 4, 1.2, PZ.iron, { m: 'metal', seg: 10 }),
    C(16, 26, 0, 13, 2, PZ.terra, { m: 'gloss', seg: 20 }), C(16, 27.1, 0, 11.6, 0.3, PZ.white, { m: 'plain', seg: 20 }),
    C(10, 27.4, 3, 2.6, 0.4, PZ.white, { m: 'gloss', seg: 12 }), C(10, 28.7, 3, 1.4, 2.2, PZ.white, { m: 'gloss', seg: 10, rb: 1.1 }), C(10, 29.85, 3, 1.25, 0.1, PZ.coffee, { m: 'plain', seg: 10 }),
    RG(11.7, 28.7, 3, 0.7, 0.25, PZ.white, GL),
    LA(21, 27.2, 1, [[1.8, 0], [1.8, 0.4], [0.4, 1], [0.4, 3.6], [3, 5.4], [3.2, 6]], '#cfe8f4', { m: 'glass', seg: 10 }),
    S(20, 34, 1, 2, 1.8, 2, PZ.strawberry, { m: 'cloth', seg: 8 }), S(22.2, 34.6, 0.6, 2, 1.8, 2, PZ.pistachio, { m: 'cloth', seg: 8 }),
    B(23, 37, 0, 1.4, 4, 0.4, PZ.crust, { m: 'plain', r: 0.2 }),
  ]),

  // a Chianti barrel for a table: oak staves bound in iron, a straw fiasco on top with a candle burning in its neck,
  // wax run down it in green, white and red, and a glass of red beside it
  piece('pzrbarrel', 'Pizzeria Chianti barrel table', 1, 1, 520, 'wood', [
    LA(16, 0, 0, [[10.4, 0], [11.6, 4], [12.4, 10], [12.6, 14], [12.4, 18], [11.6, 24], [10.4, 28]], PZ.oak, { m: 'wood', tex: 'stave', tc: PZ.woodD, ts: 2.4, seg: 16 }),
    ...[[3, 11.3], [9, 12.3], [19, 12.3], [25, 11.3]].map(([h, r]) => RG(16, h, 0, r, 0.5, PZ.iron, { m: 'metal', flat: true })),
    C(16, 28.4, 0, 10, 0.8, PZ.oakL, { m: 'wood', seg: 16 }),
    ...fiasco(16, 28.8, 0),
    ...[[14.9, PZ.green], [16, PZ.white], [17.1, PZ.red]].map(([x, c], i) => RD([x, 43.6, 0.9], [x - 0.2, 39.4 - i, 1.3], 0.35, c, PL)),
    C(16, 46, 0, 1, 5, PZ.candle, { m: 'plain', seg: 10 }), S(16, 50, 0, 0.8, 1.4, 0.8, PZ.glowY, { m: 'glow', seg: 8 }),
    LA(22.4, 28.8, 4, [[1.6, 0], [1.6, 0.3], [0.3, 0.6], [0.3, 3.4], [1.4, 4.2], [1.8, 6.6]], '#cfe8f4', { m: 'glass', seg: 10 }), C(22.4, 35, 4, 1.5, 1.6, PZ.wine, { m: 'plain', seg: 10 }),
  ], { glow: [PZ.glowY] }),

  // a little two-tier stand for the condiments: a wire caddy of olive oil, chilli flakes and parmesan, napkins and a
  // jar of oregano on the shelf below
  piece('pzrcondiment', 'Pizzeria condiment stand', 1, 1, 260, 'wood', [
    ...foot4([5, 27], [-8, 8], 2.4, 26),
    B(16, 8, 0, 24, 1.4, 18, PZ.woodD, WD), B(16, 26.6, 0, 30, 1.8, 22, PZ.woodL, GR),
    B(15, 28.9, 0, 18, 2.8, 8, PZ.iron, { m: 'metal', r: 0.4 }), RG(15, 31, 0, 5.5, 0.35, PZ.iron, { m: 'metal', arc: Math.PI }),
    LA(9, 27.8, 0, [[2.2, 0], [2.4, 4], [1.4, 6], [0.6, 7.4], [0.6, 9.6], [0.9, 10]], PZ.oil, { m: 'gloss', seg: 10 }), RD([9.3, 37.6, 0], [11.6, 39.4, 0], 0.3, PZ.steelL, MT),
    LA(15, 27.8, 0, [[1.8, 0], [1.8, 5], [1.4, 5.6]], PZ.chilli, { m: 'gloss', seg: 10 }), C(15, 34, 0, 1.5, 1, PZ.steelL, { m: 'metal', seg: 10 }),
    LA(21, 27.8, 0, [[1.9, 0], [1.9, 5.4], [1.6, 5.8]], PZ.cream, { m: 'gloss', seg: 10 }), LA(21, 33.6, 0, [[1.6, 0], [1.4, 1.2], [0, 1.8]], PZ.steelL, { m: 'metal', seg: 10 }),
    B(10, 9.6, 0, 8, 1.8, 8, PZ.white, { m: 'cloth', r: 0.3 }), B(10, 11.4, 0, 8, 1.8, 8, PZ.red, { m: 'cloth', r: 0.3 }),
    LA(21, 8.7, 0, [[2, 0], [2.2, 4], [1.6, 4.4]], PZ.basil, { m: 'gloss', seg: 10 }), C(21, 13.6, 0, 1.7, 1, PZ.red, { m: 'plain', seg: 10 }),
  ]),

  // the delivery scooter: a red Vespa-style scooter seen side-on, cream seat, chrome fork and lamp, and a white
  // delivery box on its rack stamped PIZZA
  piece('pzrscooter', 'Pizzeria delivery scooter', 2, 1, 1450, 'gloss', [
    ...[17, 53].flatMap(x => [RG(x, 6.4, 0, 5.2, 1.3, PZ.black, GL), DS(x, 6.4, 0, 3.4, 2.4, PZ.steelL, { m: 'metal', seg: 12 }), DS(x, 6.4, 1.4, 1.2, 0.4, PZ.steelD, { m: 'metal', seg: 8 })]),
    S(21, 14, 0, 12, 7, 6, PZ.red, { m: 'gloss', seg: 14 }),
    B(37, 9.6, 0, 18, 1.6, 9, PZ.black, PL),
    PR(47, 8.6, 0, [[-3, 0], [2, 0], [5, 10], [6, 20], [3, 22], [-1, 20], [-2, 10]], 8, PZ.red, GL),
    S(53, 12.4, 0, 5.6, 2.6, 3.4, PZ.red, { m: 'gloss', seg: 10 }),
    RD([53, 7, 0], [50, 22, 0], 0.9, PZ.steelL, MT), RD([50, 22, 0], [50, 30, 0], 1.2, PZ.red, GL),
    RD([50, 30, -6], [50, 30, 6], 0.7, PZ.steelL, MT),
    S(52.6, 27.6, 0, 2, 2.2, 2.2, PZ.steelL, { m: 'metal', seg: 10 }), S(54, 27.6, 0, 0.9, 1.6, 1.6, PZ.glowP, { m: 'glow', seg: 8 }),
    B(25, 22.6, 0, 14, 3, 8, PZ.cream, { m: 'cloth', r: 1.4 }),
    B(12, 25.4, 0, 14, 1, 10, PZ.steelD, MT), RD([8, 19, 0], [8, 25, 0], 0.5, PZ.steelD, MT), RD([16, 20.4, 0], [16, 25, 0], 0.5, PZ.steelD, MT),
    B(12, 32, 0, 16, 12, 12, PZ.white, { m: 'gloss', r: 1 }), B(12, 38.4, 0, 16.4, 1.6, 12.4, PZ.red, GL),
    PC(12, 32, 6.05, 13, 6, word('PIZZA', PZ.red, null)),
    RD([33, 8.8, 3], [31, 0.6, 5], 0.5, PZ.steelD, MT), RD([11, 6, -4.5], [23, 7, -4.5], 1, PZ.steelL, MT),
  ], { glow: [PZ.glowP] }),

  // a terracotta window box of basil on a little wooden stand, a tomato plant tied to its cane at one end
  piece('pzrbasil', 'Pizzeria basil planter', 1, 1, 320, 'cloth', [
    ...foot4([4, 28], [-5, 5], 2.2, 14),
    B(16, 14.6, 0, 28, 1.2, 14, PZ.woodD, WD),
    B(16, 20, 0, 30, 10, 14, PZ.terra, { m: 'cloth', r: 1 }), B(16, 25.4, 0, 31, 1.4, 15, PZ.terraL, CL), B(16, 25.8, 0, 28, 0.6, 12, PZ.soil, PL),
    PC(16, 20, 7.05, 22, 4.6, word('BASILICO', PZ.cream, null)),
    ...[7, 16].flatMap(x => [[0, 28, 0], [-2.4, 27.4, 2], [2.4, 27.6, -2], [-1.6, 31, -1], [1.6, 31.4, 1.4], [0, 34, 0]].map(([dx, h, dz]) => S(x + dx, h, dz, 2.4, 1.6, 2.2, (dx + dz) % 2 ? PZ.basilD : PZ.basil, { m: 'cloth', seg: 8 }))),
    RD([25, 26, -2], [25, 46, -2], 0.4, PZ.straw, WD),
    ...[[23, 30, 0], [27, 34, -1], [23.4, 38, -2], [26.6, 42, -1]].map(([x, h, z]) => S(x, h, z, 2.4, 1.8, 2.2, PZ.basilD, { m: 'cloth', seg: 8 })),
    ...[[27.4, 30, 1.6], [22.6, 34.4, 1], [27, 39, 0.6]].map(([x, h, z]) => S(x, h, z, 1.6, 1.6, 1.6, PZ.tomato, { m: 'gloss', seg: 8 })),
  ]),

  // a chalkboard menu in a dark frame: PIZZE over a green, white and red rule, the pizzas and their prices, OGGI! by a
  // chalk pizza, a ledge with chalk
  wallPiece('pzrmenu', 'Pizzeria chalkboard menu', 2, 540, 'wood', [
    B(32, 62, 0.8, 60, 30, 1.6, PZ.woodD, GR),
    B(32, 62, 1.7, 55, 25, 0.4, PZ.chalk, PL), PC(32, 62, 1.95, 55, 25, menu),
    B(32, 47.6, 2.6, 50, 1.4, 3, PZ.woodD, WD),
    RD([20, 48.6, 3], [23, 48.6, 3.4], 0.35, PZ.white, PL), RD([26, 48.6, 3], [28, 48.6, 2.6], 0.35, PZ.cheese, PL), B(42, 49, 2.8, 5, 1.6, 2, PZ.woodL, WD),
  ]),

  // a neon sign on a black board edged red: PIZZA in red tubes over a green, white and red underline
  wallPiece('pzrneon', 'Pizzeria neon PIZZA sign', 2, 920, 'gloss', [
    B(32, 62, 0.3, 62, 28, 0.6, PZ.red, GL),
    B(32, 62, 0.9, 59, 25, 1, PZ.black, GL),
    ...letters('PIZZA', [11, 21.5, 32, 42.5, 53], 58, 2, 1, 0.75, PZ.neonR, GW),
    RD([8, 53.6, 2], [24, 53.6, 2], 0.7, PZ.neonG, GW), RD([24.6, 53.6, 2], [39.4, 53.6, 2], 0.7, PZ.neonW, GW), RD([40, 53.6, 2], [56, 53.6, 2], 0.7, PZ.neonR, GW),
  ], { glow: [PZ.neonR, PZ.neonG, PZ.neonW] }),

  // a dark wood wall shelf of straw-wrapped Chianti, a tin of olive oil and one of tomatoes, a garlic braid, a salami
  // and a string of red chillies hung beneath
  wallPiece('pzrshelf', 'Pizzeria Chianti wall shelf', 2, 600, 'wood', [
    B(32, 64, 5, 60, 2, 10, PZ.woodD, GRH),
    ...[6, 58].map(x => WG(x, 57, 0, 2, [[0.5, 0], [0.5, 6], [9, 6]], PZ.woodK, WD)),
    ...[10, 20, 30].flatMap(x => fiasco(x, 65, 5)),
    B(42, 70.4, 5, 7, 11, 5, PZ.green, { m: 'metal', r: 0.6 }), PC(42, 70.4, 7.55, 7, 6, label('OLIO', PZ.green)), C(42, 76.4, 5, 1, 1.2, PZ.brass, { m: 'metal', seg: 8 }),
    C(52, 69, 5, 3, 8, PZ.red, { m: 'metal', seg: 12 }), PC(52, 69, 8.05, 5.4, 4.4, label('POMODORO', PZ.red)),
    RD([14, 63, 6], [14, 46, 6], 0.4, PZ.straw, CL),
    ...[60, 56.6, 53.2, 49.8, 46.6].map((h, i) => S(14 + (i % 2 ? 1.4 : -1.4), h, 6.6, 1.8, 2, 1.8, PZ.garlic, { m: 'cloth', seg: 8 })),
    RD([32, 63, 6], [32, 61, 6], 0.3, PZ.straw, CL), S(32, 54, 6, 2.8, 7, 2.8, PZ.salami, { m: 'cloth', seg: 10 }),
    RD([48, 63, 6], [48, 44, 6], 0.3, PZ.straw, CL),
    ...[61, 58.4, 55.8, 53.2, 50.6, 48, 45.4].map((h, i) => S(48 + (i % 2 ? 1 : -1), h, 6.4, 0.8, 1.8, 0.8, PZ.chilli, { m: 'gloss', seg: 6 })),
  ]),

  // a poster of a pizza made into Pikachu's face on a green, white and red ground: PIKA above, PIZZA below
  wallPiece('pzrposter', 'Pizzeria Pikachu pizza poster', 1, 280, 'plain', [
    B(16, 60, 0.5, 22, 30, 0.6, PZ.white, PL),
    PC(16, 60, 0.85, 22, 30, poster),
    ...[[6.4, 73.6], [25.6, 73.6], [6.4, 46.4], [25.6, 46.4]].map(([x, h]) => DS(x, h, 1.1, 0.7, 0.4, PZ.red, { m: 'gloss', seg: 6 })),
  ]),

  // the floor mat: terracotta and cream tiles in a green, white and red border, a mosaic pizza in the middle
  { id: 'pzrmat', name: 'Pizzeria tiled floor mat', group: GROUP, solo: true, w: 3, h: 2, layer: 'rug', price: 540, high: 0.03, side: 'c', flat() {
    const g = ctx(), path = () => { g.beginPath(); RUG.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
    g.fillStyle = PZ.terraD; path(); g.fill();
    [[PZ.green, 4], [PZ.white, 6], [PZ.red, 8]].forEach(([c, i]) => { g.fillStyle = c; g.fillRect(i, i, 96 - i * 2, 64 - i * 2); });
    g.fillStyle = PZ.cream; g.fillRect(10, 10, 76, 44);
    for (let y = 10, j = 0; y < 54; y += 5.5, j++) for (let x = 10, i = 0; x < 86; x += 5.5, i++) {
      g.fillStyle = (i + j) % 2 ? PZ.terra : PZ.terraL; g.fillRect(x + 0.3, y + 0.3, 4.9, 4.9);
    }
    g.fillStyle = PZ.mortar; for (let y = 10; y <= 54; y += 5.5) g.fillRect(10, y - 0.2, 76, 0.5); for (let x = 10; x <= 86; x += 5.5) g.fillRect(x - 0.2, 10, 0.5, 44);
    g.fillStyle = PZ.cream; g.beginPath(); g.arc(48, 32, 18, 0, TAU); g.fill();
    topPizza(g, 48, 32, 15);
    g.strokeStyle = sh(PZ.terraD, -1); g.lineWidth = 1; path(); g.stroke();
  } },

  // Lickitung in a chef's toque and a red neckerchief, holding up a fresh pizza and giving its edge a long lick
  piece('pzrlickitung', 'Pizzeria Lickitung chef', 1, 1, 1250, 'cloth', [
    ...[10, 22].map(x => S(x, 2.2, 3, 3.6, 2.2, 3.6, PZ.lick, { m: 'cloth', seg: 10 })),
    S(16, 15, -2, 12, 13, 10, PZ.lick, { m: 'cloth', seg: 16 }),
    S(16, 13, 4.6, 8.4, 9, 4, PZ.lickL, { m: 'cloth', seg: 12 }),
    S(16, 32, -1, 7, 6, 6, PZ.lick, { m: 'cloth', seg: 14 }),
    RG(16, 27.4, -1, 6.4, 0.9, PZ.red, { m: 'cloth', flat: true }),
    ...[13, 19].map(x => DS(x, 34, 4.4, 1, 0.4, PZ.black, { m: 'plain', seg: 8 })),
    C(16, 38.8, -1, 4.8, 2.4, PZ.white, { m: 'cloth', seg: 14 }), S(16, 43.4, -1, 6, 4.4, 5.4, PZ.white, { m: 'cloth', seg: 12 }),
    ...[7.6, 24.4].map(x => S(x, 18, 7, 2.4, 2.4, 2.4, PZ.lick, { m: 'cloth', seg: 8 })),
    DS(16, 18, 9, 7, 0.8, PZ.crust, { m: 'cloth', seg: 18 }), DS(16, 18, 9.5, 6, 0.3, PZ.sauce, { m: 'plain', seg: 16 }),
    ...[[-3, 2], [2.6, 3], [0, -1], [-2.4, -3.4], [3.4, -2]].map(([dx, dy]) => DS(16 + dx, 18 + dy, 9.8, 1, 0.2, PZ.pepperoni, { m: 'plain', seg: 8 })),
    RD([16, 30.4, 4.6], [16.6, 27, 8.6], 1.2, PZ.lickT, GL), S(17, 25.4, 9.6, 1.6, 1.2, 1, PZ.lickT, { m: 'gloss', seg: 8 }),
  ]),
];
