/* base-furniture-daycare.js  -  the Day Care set (furniture expansion session c, 2026-10-17): the old couple's Day Care
   on Route 34 / Route 117. Warm pine, cream, baby pastels (pink, mint, sky, butter), eggs and Poké Balls. All solo, fixed
   colours. Built like the Rocket set (js/base-furniture-rocket.js's head): an upright piece is a list of parts in painted
   units (32 a tile), `x` across from the left of its front, `h` up from the floor (a wall piece's from the foot of its
   strip), `z` out to the front from its middle; painted here from any side, built as 3D parts by
   js/base-models-daycare.js (BUILT), so picture and model agree. A `pic` part is painted on the front only and the model
   wears that crop. The two rugs are painted from above. */

import { R, sh, disc, oval, ovalShade, floorShadow, ctx, glass as glassPane } from './base-paint.js';

export const DC = {
  pine: '#dcae72', pineD: '#a8743e', pineL: '#f0d09a', cream: '#f8eed8', white: '#fdfaf2', ink: '#4a3a3a',
  pink: '#f7bccb', pinkD: '#e88aa4', mint: '#a8e2c8', mintD: '#6cc49c', sky: '#a8d2f2', skyD: '#6aa8de', butter: '#f9e48e',
  lav: '#cdb8ec', peach: '#ffc89a', orange: '#ffa860', red: '#ee6a6a', wicker: '#cf9e5c', wickerD: '#a8763c',
  straw: '#ecd078', strawD: '#c8a248', egg: '#fbf4e2', eggP: '#fde4ea', eggS: '#e4f0fb', glowY: '#ffe9a8',
  sand: '#f0d8a0', sandD: '#dcbc80', leaf: '#78c070', brown: '#8a5a34',
};
const GROUP = 'Day Care';
const TAU = Math.PI * 2;

/* ---------- parts ---------- */
/** A rounded box centred at x, h, z. */
const B = (x, h, z, w, hh, d, c, o) => ({ t: 'box', x, h, z, w, hh, d, c, r: 1.5, ...o });
/** An upright cylinder centred at h (`rb` its bottom radius; r 0 a cone). */
const C = (x, h, z, r, hh, c, o) => ({ t: 'cyl', x, h, z, r, hh, c, ...o });
/** A ball rx x ry x rz. */
const S = (x, h, z, rx, ry, rz, c, o) => ({ t: 'ball', x, h, z, rx, ry, rz, c, ...o });
/** A rod from a to b, each [x, h, z]. */
const RD = (a, b, r, c, o) => ({ t: 'rod', a, b, r, c, x: (a[0] + b[0]) / 2, h: (a[1] + b[1]) / 2, z: (a[2] + b[2]) / 2, ...o });
/** A flat outline [[dx, dh]...] about x, h, d deep. */
const PR = (x, h, z, pts, d, c, o) => ({ t: 'prism', x, h, z, pts, d, c, ...o });
/** A lathe standing on h, its profile [[r, up]...]. */
const LA = (x, h, z, pts, c, o) => ({ t: 'lathe', x, h, z, pts, c, ...o });
/** A disc facing the front, th thick (`ry` for an oval). */
const DS = (x, h, z, r, th, c, o) => ({ t: 'disc', x, h, z, r, th, c, ...o });
/** A level ring r round at h, its tube `tube` thick. */
const RG = (x, h, z, r, tube, c, o) => ({ t: 'ring', x, h, z, r, tube, c, ...o });
/** A picture on a front face, w x hh centred at x, h: `fn(g, left, top, w, hh)` paints it; `lit` lights its crop. */
const PC = (x, h, z, w, hh, fn, o) => ({ t: 'pic', x, h, z, w, hh, fn, ...o });

const tri = (w, hh, lean = 0) => [[-w / 2, 0], [w / 2, 0], [lean, hh]];
/** A heart s across, its point at 0. */
const heart = (s) => Array.from({ length: 18 }, (_, i) => {
  const t = i / 18 * TAU;
  return [16 * Math.sin(t) ** 3 * s / 34, (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t) + 17) * s / 34];
});
/** A five-point star r round, centred on 0. */
const star = (r) => Array.from({ length: 10 }, (_, i) => { const a = i / 10 * TAU + Math.PI / 2, k = i % 2 ? r * 0.45 : r; return [Math.cos(a) * k, Math.sin(a) * k]; });
/** A rocker: a curved runner w across, its middle on the floor, lifting `lift` at its ends, `th` thick. */
const rocker = (w, lift, th) => {
  const n = 8, low = [], high = [];
  for (let i = 0; i <= n; i++) { const dx = -w / 2 + w * i / n, dh = lift * (2 * dx / w) ** 2; low.push([dx, dh]); high.push([dx, dh + th]); }
  return [...low, ...high.reverse()];
};
/** A flame w across and hh tall, three tongues, leaning back. */
const flame = (w, hh) => [[-w / 2, 0], [w / 2, 0], [w * 0.42, hh * 0.45], [w * 0.18, hh * 0.38], [-w * 0.02, hh], [-w * 0.16, hh * 0.52],
  [-w * 0.36, hh * 0.78], [-w * 0.44, hh * 0.32]];

/** An egg r round at x, h, z: its shell and two spots. */
const egg = (x, h, z, r, c, spot, o = {}) => {
  const ry = r * 1.3, fz = (dx, dh) => z + r * Math.sqrt(Math.max(0, 1 - (dx / r) ** 2 - (dh / ry) ** 2));
  return [
    S(x, h, z, r, ry, r, c, { m: 'gloss', ...o }),
    S(x - r * 0.38, h + r * 0.35, fz(-r * 0.38, r * 0.35) - r * 0.08, r * 0.26, r * 0.3, r * 0.14, spot, { m: 'gloss' }),
    S(x + r * 0.34, h - r * 0.4, fz(r * 0.34, -r * 0.4) - r * 0.08, r * 0.22, r * 0.24, r * 0.12, spot, { m: 'gloss' }),
  ];
};
/** A Poké Ball r round at x, h, z: two lathe halves, its band and button. */
const pokeBall = (x, h, z, r, top = DC.red) => {
  const arc = (a, b) => [0, 1, 2, 3, 4].map(i => { const t = a + (b - a) * i / 4; return [Math.cos(t) * r, Math.sin(t) * r]; });
  return [
    LA(x, h, z, arc(0, Math.PI / 2), top, { m: 'gloss' }),
    LA(x, h, z, arc(-Math.PI / 2, 0), DC.white, { m: 'gloss' }),
    C(x, h, z, r * 1.02, r * 0.18, DC.ink, { m: 'gloss' }),
    DS(x, h, z + r * 0.92, r * 0.32, r * 0.2, DC.ink, { m: 'gloss' }),
    DS(x, h, z + r * 1.02, r * 0.2, r * 0.1, DC.white, { m: 'gloss' }),
  ];
};
/** A handle's arch over x0..x1 from h0, rising hh, as n rods. */
const arch = (x0, x1, h0, hh, z, r, c, n = 6) => {
  const pt = (i) => { const a = Math.PI - i / n * Math.PI; return [(x0 + x1) / 2 + Math.cos(a) * (x1 - x0) / 2, h0 + Math.sin(a) * hh, z]; };
  return Array.from({ length: n }, (_, i) => RD(pt(i), pt(i + 1), r, c, { m: 'wood' }));
};

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
  g.fillStyle = grad(g, x, y, x + w * 0.3, y + h, c, m); g.beginPath(); g.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); g.fill();
  if (h > 3 && w > 3) { g.save(); g.globalAlpha *= 0.5; g.fillStyle = sh(c, 2); g.fillRect(x + Math.min(r, w / 2) * 0.6, y + 0.3, w - Math.min(r, w / 2) * 1.2, 0.6); g.restore(); }
}
function poly(pts, holes, c, m, horiz) {
  const g = ctx(), xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  if (m === 'glass') { g.save(); g.globalAlpha *= 0.35; }
  if (horiz) {
    const l = g.createLinearGradient(x0, 0, x1, 0);
    l.addColorStop(0, sh(c, -1)); l.addColorStop(0.3, sh(c, 1)); l.addColorStop(0.55, c); l.addColorStop(1, sh(c, -2));
    g.fillStyle = m === 'glass' ? '#cfe8f4' : l;
  } else g.fillStyle = grad(g, x0, y0, x1, y1, c, m);
  g.beginPath();
  for (const ring of [pts, ...(holes || [])]) { ring.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); }
  g.fill('evenodd');
  if (m === 'glass') g.restore();
}
function ball(cx, cy, rx, ry, c, m) {
  const g = ctx();
  if (m === 'glow') { const t = g.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry)); t.addColorStop(0, '#ffffff'); t.addColorStop(0.4, sh(c, 1)); t.addColorStop(1, c); g.fillStyle = t; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, TAU); g.fill(); return; }
  if (m === 'glass') { g.save(); g.globalAlpha *= 0.4; oval(cx, cy, rx, ry, '#dff0f8'); g.restore(); return; }
  ovalShade(cx, cy, rx, ry, c);
  if (m === 'gloss' || m === 'metal') { g.save(); g.globalAlpha *= 0.55; oval(cx - rx * 0.38, cy - ry * 0.42, rx * 0.22, ry * 0.14, '#ffffff'); g.restore(); }
}

/** Paints parts seen from `dir` (0 front, 2 back, 1 / 3 the sides), on a view vw wide standing on line b; W is the
    piece's front width in units. */
function paintParts(parts, x0, b, vw, dir, W) {
  const side = dir % 2 === 1, sg = dir === 3 ? -1 : 1, g = ctx();
  const U = (px, pz) => (dir === 0 ? x0 + px : dir === 2 ? x0 + W - px : x0 + vw / 2 + sg * pz);
  const key = (q) => q.k ?? (dir === 0 ? q.z : dir === 2 ? -q.z : sg * (W / 2 - q.x));
  const list = parts.map((q, i) => [key(q), i, q]).sort((a, c) => a[0] - c[0] || a[1] - c[1]).map(e => e[2]);
  for (const q of list) {
    if (q.t === 'pic' && dir !== 0) continue;
    const m = q.m || 'gloss', cx = U(q.x, q.z), cy = b - q.h;
    switch (q.t) {
      case 'box': { const w = side ? q.d : q.w; rbx(cx - w / 2, cy - q.hh / 2, w, q.hh, q.r, q.c, m); break; }
      case 'cyl': {
        const rb = q.rb ?? q.r, top = cy - q.hh / 2, bot = cy + q.hh / 2;
        poly([[cx - q.r, top], [cx + q.r, top], [cx + rb, bot], [cx - rb, bot]], null, q.c, m, m !== 'glow');
        if (m !== 'glass' && q.r > 0) oval(cx, top, q.r, Math.min(q.r * 0.22, q.hh / 2), sh(q.c, m === 'glow' ? 2 : 1));
        break;
      }
      case 'ball': ball(cx, cy, side ? q.rz : q.rx, q.ry, q.c, m); break;
      case 'disc': if (side) rbx(cx - q.th / 2, cy - (q.ry ?? q.r), q.th, (q.ry ?? q.r) * 2, q.th / 2, q.c, m); else ball(cx, cy, q.r, q.ry ?? q.r, q.c, m); break;
      case 'lathe': {
        const pts = q.pts.map(([r, up]) => [r, cy - up]);
        poly([...pts.map(([r, y]) => [cx - r, y]), ...pts.slice().reverse().map(([r, y]) => [cx + r, y])], null, q.c, m, true);
        break;
      }
      case 'ring': {
        const l = g.createLinearGradient(cx - q.r, 0, cx + q.r, 0);
        l.addColorStop(0, sh(q.c, -1)); l.addColorStop(0.3, sh(q.c, 1)); l.addColorStop(0.6, q.c); l.addColorStop(1, sh(q.c, -2));
        g.strokeStyle = l; g.lineWidth = q.tube * 2;
        g.beginPath(); g.ellipse(cx, cy, q.r, Math.max(0.01, q.r * 0.12), 0, 0, TAU); g.stroke();
        break;
      }
      case 'rod': {
        const p0 = [U(q.a[0], q.a[2]), b - q.a[1]], p1 = [U(q.b[0], q.b[2]), b - q.b[1]];
        g.lineCap = 'round'; g.strokeStyle = m === 'glass' ? alphaOf('#cfe8f4', 0.4) : q.c; g.lineWidth = q.r * 2;
        g.beginPath(); g.moveTo(...p0); g.lineTo(...p1); g.stroke();
        if (q.r > 0.6 && m !== 'glass') {
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
        const at = ([px, ph]) => [U(q.x + px), b - q.h - ph];
        poly(q.pts.map(at), q.holes?.map(h => h.map(at)), q.c, m);
        break;
      }
      case 'pic': g.save(); g.beginPath(); g.rect(cx - q.w / 2, cy - q.hh / 2, q.w, q.hh); g.clip(); q.fn(g, cx - q.w / 2, cy - q.hh / 2, q.w, q.hh); g.restore(); break;
    }
  }
}

/* ---------- pictures ---------- */

const font = (g, px, bold = true) => { g.font = `${bold ? 'bold ' : ''}${px}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; };
const eggIcon = (g, x, y, r, c, spot) => {
  g.fillStyle = c; g.beginPath(); g.ellipse(x, y, r, r * 1.3, 0, 0, TAU); g.fill();
  g.fillStyle = spot; g.beginPath(); g.arc(x - r * 0.35, y - r * 0.3, r * 0.3, 0, TAU); g.fill();
  g.beginPath(); g.arc(x + r * 0.35, y + r * 0.45, r * 0.22, 0, TAU); g.fill();
};
/** A letter block's face. */
const blockFace = (ch, c) => (g, x, y, w, h) => {
  g.fillStyle = sh(c, 1); g.fillRect(x, y, w, h);
  g.strokeStyle = sh(c, -1); g.lineWidth = 0.6; g.strokeRect(x + 0.8, y + 0.8, w - 1.6, h - 1.6);
  if (ch === '*') { g.fillStyle = DC.white; g.beginPath(); star(2.6).forEach(([px, py], i) => (i ? g.lineTo(x + w / 2 + px, y + h / 2 - py) : g.moveTo(x + w / 2 + px, y + h / 2 - py))); g.closePath(); g.fill(); return; }
  font(g, 5.4); g.fillStyle = DC.white; g.fillText(ch, x + w / 2 + 0.3, y + h / 2 + 0.6); g.fillStyle = sh(c, -2); g.fillText(ch, x + w / 2, y + h / 2 + 0.3);
};

/* ---------- the kinds ---------- */

/** What js/base-models-daycare.js builds for each upright and wall kind: its parts and default material. */
export const BUILT = {};

function piece(id, name, w, h, price, mat, parts, rest = {}) {
  BUILT[id] = { parts, mat };
  return { id, name, group: GROUP, solo: true, w, h, price, ...rest, draw(x, b, vw, dir) { floorShadow(x, b, vw); paintParts(parts, x, b, vw, dir, w * 32); } };
}
function wallPiece(id, name, w, price, mat, parts, rest = {}) {
  BUILT[id] = { parts, mat };
  return { id, name, group: GROUP, solo: true, w, h: 1, layer: 'wall', price, ...rest, wall(x) { paintParts(parts, x, 96, w * 32, 0, w * 32); } };
}
/** How thick each rug's slab is, in tiles. */
export const RUGS = { dcnapmats: 0.045, dcabcrug: 0.05 };

const BALLS = [DC.pink, DC.mint, DC.sky, DC.butter, DC.lav, DC.peach];

export const DAYCARE_KINDS = [
  // a wicker basket of three eggs, a pink bow on its handle
  piece('dceggbasket', 'Wicker egg basket', 1, 1, 300, 'wood', [
    LA(16, 0, 0, [[0, 0], [8, 0], [10.5, 2], [12.5, 6], [13.5, 10], [13.5, 11.5], [0, 11.5]], DC.wicker),
    RG(16, 4, 0, 11.6, 0.7, DC.wickerD, { m: 'wood' }), RG(16, 8, 0, 13.1, 0.7, DC.wickerD, { m: 'wood' }),
    RG(16, 11.5, 0, 13.2, 1.3, DC.wickerD, { m: 'wood' }),
    S(16, 12, 0, 12, 2.4, 12, DC.pink, { m: 'cloth' }),
    ...egg(10.5, 17, -2, 4.2, DC.egg, DC.mintD), ...egg(21.5, 17, -2, 4.2, DC.egg, DC.skyD), ...egg(16, 16.5, 4, 4, DC.eggP, DC.pinkD),
    ...arch(3, 29, 11.5, 19.5, 0, 1, DC.wickerD),
    S(13.4, 31, 0.4, 2.3, 1.6, 1, DC.pink, { m: 'cloth' }), S(18.6, 31, 0.4, 2.3, 1.6, 1, DC.pink, { m: 'cloth' }), S(16, 31, 1.2, 1, 1, 1, DC.pinkD, { m: 'cloth' }),
  ]),

  // a three-tier wicker stand, an egg or three on each tier
  piece('dceggtier', 'Tiered egg stand', 1, 1, 450, 'wood', [
    LA(16, 0, 0, [[0, 0], [10, 0], [10, 1.6], [7, 3], [0, 3]], DC.pineD),
    C(16, 18, 0, 1, 30, DC.pine),
    ...[[8, 12.5], [21, 10], [33, 7.5]].flatMap(([h, r]) => [
      LA(16, h, 0, [[0, 0], [r * 0.6, 0], [r, 2.2], [r, 3.4], [0, 3.4]], DC.wicker),
      RG(16, h + 3.4, 0, r, 0.9, DC.wickerD, { m: 'wood' }),
    ]),
    ...egg(9.5, 15.8, 2, 3.4, DC.egg, DC.mintD), ...egg(16, 15.8, -4, 3.4, DC.eggS, DC.skyD), ...egg(22.5, 15.8, 2, 3.4, DC.eggP, DC.pinkD),
    ...egg(12.4, 28.6, 1, 3.2, DC.eggP, DC.pinkD), ...egg(19.6, 28.6, 1, 3.2, DC.egg, DC.mintD),
    ...egg(16, 40.6, 0, 3.2, DC.egg, DC.orange),
  ]),

  // the incubator: an egg on a warm pad under a glass dome
  piece('dcincubator', 'Day Care incubator', 1, 1, 900, 'wood', [
    B(16, 6, 0, 26, 12, 24, DC.pine, { r: 2 }),
    PC(16, 6.5, 12.05, 18, 7, (g, x, y, w, h) => {
      g.fillStyle = DC.cream; g.beginPath(); g.roundRect(x, y, w, h, 1.4); g.fill();
      g.fillStyle = '#e8dcc0'; g.fillRect(x + 1.5, y + 2.6, 8, 1.8);
      const s = g.createLinearGradient(x + 1.5, 0, x + 9.5, 0); s.addColorStop(0, DC.sky); s.addColorStop(1, DC.red);
      g.fillStyle = s; g.fillRect(x + 1.5, y + 2.6, 5.6, 1.8);
      [DC.mintD, DC.butter, DC.pinkD].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(x + 11.8 + i * 2.2, y + h / 2, 0.85, 0, TAU); g.fill(); });
    }, { lit: 0.4 }),
    B(16, 12.6, 0, 27, 1.4, 25, DC.cream, { m: 'gloss', r: 0.6 }),
    C(16, 14.3, 0, 9.5, 2, DC.glowY, { m: 'glow' }),
    ...egg(16, 22, 0, 5.6, DC.egg, DC.mintD),
    RG(16, 13.8, 0, 11.6, 1, DC.pink, { m: 'gloss' }),
    LA(16, 13.3, 0, [[11.5, 0], [11.5, 5], [10.3, 10], [7.6, 14.5], [4, 17], [0, 17.8]], '#cfe8f4', { m: 'glass', k: 30 }),
    S(16, 31.6, 0, 2.2, 1.8, 2.2, DC.pink, { m: 'gloss', k: 31 }),
  ], { glow: [DC.glowY] }),

  // a straw nest, its egg cracking
  piece('dchatchnest', 'Hatching nest', 1, 1, 350, 'cloth', [
    LA(16, 0, 0, [[0, 0], [10, 0], [13, 2.5], [14, 5], [13.5, 7.5], [0, 7.5]], DC.straw),
    RG(16, 7, 0, 12.6, 1.6, DC.strawD, { m: 'cloth' }),
    RD([5, 6, 4], [1.6, 9, 6], 0.5, DC.strawD), RD([27, 6, -3], [30.4, 8.6, -5], 0.5, DC.strawD), RD([10, 7, 10], [7.5, 9.5, 13], 0.5, DC.strawD),
    RD([22, 7, 10], [25, 10, 12], 0.5, DC.strawD),
    ...egg(16, 16, 0, 6.4, DC.egg, DC.mintD),
    PR(16, 18, 5.6, [[-3.6, 0.2], [-2, 1.6], [-0.6, -0.2], [1, 1.6], [2.4, -0.2], [3.6, 1], [3.6, 0.2], [2.4, -1], [1, 0.8], [-0.6, -1], [-2, 0.8], [-3.6, -0.6]], 0.5, DC.ink, { m: 'plain' }),
    PR(8, 8.2, 6, tri(3.4, 2.2, 0.4), 1, DC.egg, { m: 'gloss' }), PR(23.5, 8.2, 5, tri(2.6, 2, -0.3), 1, DC.egg, { m: 'gloss' }),
  ]),

  // a pine crib, slatted, a mint blanket and an egg on the headboard
  piece('dccrib', 'Pine nursery crib', 2, 1, 800, 'wood', [
    ...[3, 61].flatMap(x => [-12, 12].flatMap(z => [B(x, 21, z, 4, 42, 4, DC.pine, { r: 1.2 }), S(x, 43.4, z, 2.4, 2.4, 2.4, DC.pineL, { m: 'wood' })])),
    B(32, 9, 0, 56, 4, 23, DC.pineD, { r: 1 }),
    B(32, 13, 0, 55, 5, 22, DC.white, { m: 'cloth', r: 2 }),
    B(32, 26, -12, 56, 26, 2, DC.pineL, { r: 1 }),
    DS(32, 31, -10.7, 5, 0.8, DC.pink, { ry: 6.4, m: 'gloss' }), DS(30, 33, -10.2, 1.4, 0.6, DC.white, { m: 'gloss' }), DS(34, 29, -10.2, 1.1, 0.6, DC.white, { m: 'gloss' }),
    ...[3, 61].flatMap(x => [B(x, 36, 0, 2.4, 2.6, 20, DC.pine, { r: 1 }), ...[-8, -4, 0, 4, 8].map(z => RD([x, 14, z], [x, 35, z], 0.7, DC.pineL))]),
    B(13, 17.5, 0, 13, 4, 15, DC.sky, { m: 'cloth', r: 2 }),
    B(38, 16.6, 1, 30, 1.6, 20, DC.mint, { m: 'cloth', r: 0.8 }),
    B(32, 36, 12, 56, 2.6, 2.6, DC.pine, { r: 1 }), B(32, 13, 12, 56, 2.4, 2.4, DC.pine, { r: 1 }),
    ...Array.from({ length: 13 }, (_, i) => RD([7 + i * 4.17, 14, 12], [7 + i * 4.17, 35, 12], 0.75, DC.pineL)),
  ]),

  // a cradle on rockers, a pink hood over its pillow (tap it to rock)
  piece('dccradle', 'Rocking cradle', 1, 1, 650, 'wood', [
    ...[-9, 9].map(z => PR(16, 0, z, rocker(29, 4, 3), 2.4, DC.pineD)),
    ...[8, 24].flatMap(x => [-9, 9].map(z => B(x, 6.5, z, 2.4, 7, 2.4, DC.pine, { r: 0.8 }))),
    S(16, 21, -6, 13, 11, 6, DC.pink, { m: 'cloth' }),
    B(16, 15, 0, 26, 11, 22, DC.pineL, { r: 4 }),
    B(16, 20.8, 0, 27, 1.4, 23, DC.pine, { r: 0.7 }),
    PR(16, 11, 11.1, heart(7), 0.6, DC.pink, { m: 'gloss' }),
    B(9, 22, 0, 8, 3, 12, DC.sky, { m: 'cloth', r: 1.4 }),
    B(19, 21.4, 2, 16, 1.6, 16, DC.butter, { m: 'cloth', r: 0.7 }),
  ]),

  // a padded play pen, mint mat, net sides, toys inside
  piece('dcplaypen', 'Day Care play pen', 2, 2, 700, 'cloth', [
    B(32, 1.5, 0, 58, 3, 58, DC.mint, { r: 1 }),
    ...pokeBall(20, 7.5, 6, 4.5),
    B(40, 6, -6, 6, 6, 6, DC.pink, { m: 'gloss', r: 1 }), B(46.5, 6, -3, 6, 6, 6, DC.sky, { m: 'gloss', r: 1 }), B(43, 12, -4.5, 6, 6, 6, DC.butter, { m: 'gloss', r: 1 }),
    ...egg(28, 8.2, -14, 4, DC.egg, DC.mintD, { m: 'cloth' }),
    ...[3, 61].flatMap(x => [-27, 27].map(z => B(x, 12, z, 4, 24, 4, DC.butter, { m: 'gloss', r: 1.5 }))),
    B(32, 13, -27, 56, 18, 0.6, '#cfe8f4', { m: 'glass', r: 0.2 }),
    B(3, 13, 0, 0.6, 18, 50, '#cfe8f4', { m: 'glass', r: 0.2 }), B(61, 13, 0, 0.6, 18, 50, '#cfe8f4', { m: 'glass', r: 0.2 }),
    B(32, 13, 27, 56, 18, 0.6, '#cfe8f4', { m: 'glass', r: 0.2 }),
    B(32, 23.5, -27, 56, 3, 3, DC.sky, { r: 1.4 }), B(3, 23.5, 0, 3, 3, 50, DC.sky, { r: 1.4 }), B(61, 23.5, 0, 3, 3, 50, DC.sky, { r: 1.4 }),
    B(32, 23.5, 27, 56, 3, 3, DC.sky, { r: 1.4 }),
  ]),

  // a pine high chair, a butter-yellow tray with a bowl and spoon
  piece('dchighchair', 'Feeding high chair', 1, 1, 450, 'wood', [
    RD([5, 0, -11], [9, 27, -5], 1.1, DC.pine), RD([27, 0, -11], [23, 27, -5], 1.1, DC.pine),
    B(16, 42, -7.5, 18, 22, 2.6, DC.pine, { r: 4 }),
    ...pokeBall(16, 44, -5.4, 3.2),
    RD([6.2, 8, -9.2], [6.2, 8, 9.2], 0.7, DC.pineD), RD([25.8, 8, -9.2], [25.8, 8, 9.2], 0.7, DC.pineD),
    B(16, 28, 0, 20, 3, 16, DC.pine, { r: 1 }),
    B(16, 30.2, 0, 17, 1.8, 14, DC.pink, { m: 'cloth', r: 0.8 }),
    B(6.5, 34, 1, 2, 2, 14, DC.pine, { r: 0.8 }), B(25.5, 34, 1, 2, 2, 14, DC.pine, { r: 0.8 }),
    RD([5, 0, 11], [9, 27, 5], 1.1, DC.pine), RD([27, 0, 11], [23, 27, 5], 1.1, DC.pine),
    B(16, 12, 9, 16, 1.6, 3, DC.pineD, { r: 0.6 }),
    B(16, 36, 9, 26, 2, 9, DC.butter, { m: 'gloss', r: 1.6 }),
    LA(19.5, 37, 9.5, [[0, 0], [2, 0], [3, 1.6], [3.2, 2.2], [0, 2.2]], DC.sky, { m: 'gloss' }),
    RD([10.5, 37.4, 10], [14, 37.8, 9], 0.45, DC.white, { m: 'metal' }),
  ]),

  // a pine rack of Moomoo Milk bottles, its sign on top
  piece('dcmilkrack', 'Moomoo Milk bottle rack', 1, 1, 400, 'wood', [
    B(16, 20, -9.5, 23, 38, 1, DC.pineL, { r: 0.4 }),
    B(3, 20, 0, 3, 40, 20, DC.pine, { r: 0.8 }), B(29, 20, 0, 3, 40, 20, DC.pine, { r: 0.8 }),
    B(16, 2, 0, 23, 2, 19, DC.pine, { r: 0.6 }), B(16, 20, 0, 23, 2, 19, DC.pine, { r: 0.6 }),
    ...[3, 21].flatMap(h => [7.6, 13.2, 18.8, 24.4].flatMap((x, i) => [
      LA(x, h, 3, [[0, 0], [2.6, 0], [2.7, 8], [1.4, 11], [1.4, 13.5], [0, 13.5]], DC.white, { m: 'gloss' }),
      C(x, h + 14, 3, 1.6, 1, (i + h) % 2 ? DC.sky : DC.pink, { m: 'gloss' }),
      PC(x, h + 4.5, 5.75, 4.2, 4.4, (g, px, py, w, hh) => {
        g.fillStyle = DC.white; g.fillRect(px, py, w, hh);
        g.fillStyle = (i + h) % 2 ? DC.skyD : DC.pinkD; g.fillRect(px, py + hh - 1.2, w, 1.2);
        g.fillStyle = DC.ink; g.beginPath(); g.ellipse(px + 1.2, py + 1.2, 0.8, 0.6, 0.3, 0, TAU); g.ellipse(px + 3, py + 2, 0.7, 0.5, 0, 0, TAU); g.fill();
      }),
    ])),
    B(16, 40.6, 0, 30, 2.2, 22, DC.pineD, { r: 0.8 }),
    B(16, 46, -6, 22, 8, 1.2, DC.cream, { m: 'gloss', r: 1 }),
    PC(16, 46, -5.35, 21, 7, (g, x, y, w, h) => {
      g.fillStyle = DC.cream; g.fillRect(x, y, w, h);
      font(g, 2.8); g.fillStyle = DC.skyD; g.fillText('MOOMOO', x + w / 2, y + 2.2); g.fillStyle = DC.pinkD; g.fillText('MILK', x + w / 2, y + 5);
    }),
  ]),

  // a sky-blue toy chest, a pink lid (tap it for treasure)
  piece('dctoybox', 'Day Care toy chest', 1, 1, 450, 'gloss', [
    ...[5, 27].flatMap(x => [-8, 8].map(z => S(x, 1.6, z, 1.6, 1.6, 1.6, DC.pine, { m: 'wood' }))),
    B(16, 11, 0, 28, 18, 22, DC.sky, { r: 2 }),
    PC(16, 11, 11.05, 22, 12, (g, x, y, w, h) => {
      g.fillStyle = sh(DC.sky, 1); g.fillRect(x, y, w, h);
      ['T', 'O', 'Y', 'S'].forEach((ch, i) => {
        const bx = x + 0.6 + i * 5.3, c = [DC.pink, DC.butter, DC.mint, DC.lav][i];
        g.fillStyle = c; g.beginPath(); g.roundRect(bx, y + 3 + (i % 2) * 1.2, 4.6, 4.6, 0.8); g.fill();
        font(g, 3.6); g.fillStyle = DC.white; g.fillText(ch, bx + 2.3, y + 5.5 + (i % 2) * 1.2);
      });
    }),
    B(1.6, 13, 0, 1.2, 2.5, 7, DC.pineD, { m: 'wood', r: 0.5 }), B(30.4, 13, 0, 1.2, 2.5, 7, DC.pineD, { m: 'wood', r: 0.5 }),
    B(16, 21.2, 0, 29.5, 3, 23.5, DC.pink, { r: 1.4 }),
    B(16, 19.2, 11.4, 4, 3, 1, DC.butter, { r: 0.6 }),
  ]),

  // a stack of pastel letter blocks (tap it to wobble)
  piece('dcblocks', 'Stacking letter blocks', 1, 1, 200, 'gloss', [
    ...[[6.5, 4.5, 2, DC.pink, 'A'], [16, 4.5, -1, DC.mint, 'B'], [25.5, 4.5, 2, DC.sky, 'C'], [11.25, 13.5, 0, DC.butter, 'D'], [20.75, 13.5, 1, DC.lav, 'E'], [16, 22.5, 0, DC.peach, '*']]
      .flatMap(([x, h, z, c, ch]) => [B(x, h, z, 9, 9, 9, c, { r: 1.2 }), PC(x, h, z + 4.55, 7, 7, blockFace(ch, c))]),
  ]),

  // Ponyta on pine rockers, its mane a soft flame (tap it to rock)
  piece('dcponyta', 'Ponyta rocking horse', 1, 1, 900, 'gloss', [
    ...[-7, 7].map(z => PR(16, 0, z, rocker(29, 4, 3), 2.2, DC.pineD, { m: 'wood' })),
    ...[[8, -1], [22, 1]].flatMap(([fx, s]) => [-3.5, 3.5].flatMap(z => [RD([fx + s * 1.5, 18, z], [fx, 6, z * 1.6], 1.4, DC.cream), C(fx, 5.6, z * 1.6, 1.6, 2, '#a08a70')])),
    PR(4.5, 20, 0, flame(6, 10), 3.5, DC.orange), PR(4.8, 20.5, 0, flame(3.6, 7), 4, DC.butter, { m: 'glow' }),
    S(15, 21, 0, 10.5, 6.5, 6, DC.cream),
    RD([20, 24, 0], [23.5, 34, 0], 3, DC.cream),
    PR(20.5, 28, 0, flame(8, 13), 4, DC.orange), PR(20.8, 28.6, 0, flame(5, 9), 4.6, DC.butter, { m: 'glow' }),
    S(25.5, 37, 0, 4.5, 4, 3.8, DC.cream), S(28.8, 35.4, 0, 2.8, 2.4, 2.8, DC.cream),
    PR(23.6, 39.8, 0, tri(2.4, 3.4, -0.5), 1.6, DC.cream),
    S(26.2, 38.2, 3.1, 0.8, 1.1, 0.5, DC.ink), S(30.8, 35.8, 2.1, 0.4, 0.4, 0.4, DC.ink),
    RD([25, 34.5, -5], [25, 34.5, 5], 0.6, DC.pineD, { m: 'wood' }),
    B(14.5, 27.3, 0, 8, 1.6, 12.5, DC.pink, { m: 'cloth', r: 0.8 }),
  ], { glow: [DC.butter] }),

  // a baby walker: butter base on wheels, a mint tray ring with beads (tap it to bounce)
  piece('dcwalker', 'Baby walker', 1, 1, 350, 'gloss', [
    ...[[4, 0], [28, 0], [16, 12], [16, -12]].map(([x, z]) => S(x, 1.6, z, 1.6, 1.6, 1.6, '#8a8a96')),
    LA(16, 1.4, 0, [[0, 0], [13.4, 0], [13.6, 1.6], [12, 7], [11.2, 8.4], [0, 8.4]], DC.butter),
    LA(16, 9.6, 0, [[0, 0], [5, 0.6], [8, 4], [9, 8], [0, 8.4]], DC.pink, { m: 'cloth' }),
    ...[1, 3, 5, 7].map(i => { const a = i * Math.PI / 4; return RD([16 + Math.cos(a) * 11.4, 9.6, Math.sin(a) * 11.4], [16 + Math.cos(a) * 11, 17.6, Math.sin(a) * 11], 0.9, DC.white); }),
    RG(16, 18.5, 0, 11, 2.4, DC.mint, { m: 'gloss' }),
    S(11, 21.3, 9, 1.4, 1.4, 1.4, DC.pinkD), S(16, 21.3, 10.5, 1.4, 1.4, 1.4, DC.skyD), S(21, 21.3, 9, 1.4, 1.4, 1.4, DC.butter),
    ...pokeBall(25.5, 22.4, 3, 2.2),
  ]),

  // three nap mats in a row, a pillow on each
  { id: 'dcnapmats', name: 'Nap mats', w: 2, h: 1, layer: 'rug', price: 300, high: 0.045, side: 'm', flat(w, h) {
    const g = ctx();
    [DC.pink, DC.mint, DC.sky].forEach((c, i) => {
      const x = 2.5 + i * 20, y = 2.5, mw = 19, mh = h - 5;
      g.fillStyle = sh(c, -1); g.beginPath(); g.roundRect(x, y + 0.6, mw, mh, 3); g.fill();
      g.fillStyle = c; g.beginPath(); g.roundRect(x, y, mw, mh, 3); g.fill();
      g.strokeStyle = DC.white; g.lineWidth = 0.6; g.setLineDash([1.2, 1]); g.beginPath(); g.roundRect(x + 1.6, y + 1.6, mw - 3.2, mh - 3.2, 2); g.stroke(); g.setLineDash([]);
      g.fillStyle = DC.white; g.beginPath(); g.roundRect(x + 3, y + 3, mw - 6, 6, 2.4); g.fill();
      g.fillStyle = sh(DC.white, -1); g.fillRect(x + 4, y + 7.6, mw - 8, 0.8);
      for (const [px, py] of [[x + 6, y + 14], [x + 13, y + 18], [x + 7, y + 22]]) {
        if (i === 0) disc(px, py, 1.2, DC.white);
        else if (i === 1) { g.fillStyle = DC.white; g.beginPath(); star(1.8).forEach(([sx, sy], j) => (j ? g.lineTo(px + sx, py - sy) : g.moveTo(px + sx, py - sy))); g.closePath(); g.fill(); }
        else oval(px, py, 1.1, 1.45, DC.white);
      }
    });
  } },

  // a changing table: two drawers, a mint pad, towels and powder
  piece('dcchanging', 'Changing table', 1, 1, 600, 'wood', [
    ...[3.5, 28.5].flatMap(x => [-9.5, 9.5].map(z => B(x, 1, z, 3, 2, 3, DC.pineD, { r: 0.5 }))),
    B(16, 15, 0, 28, 26, 22, DC.pine, { r: 1.2 }),
    B(16, 9, 11.3, 23, 9, 0.8, DC.cream, { m: 'gloss', r: 0.8 }), B(16, 20, 11.3, 23, 9, 0.8, DC.cream, { m: 'gloss', r: 0.8 }),
    S(16, 9, 12, 1, 1, 0.7, DC.pinkD), S(16, 20, 12, 1, 1, 0.7, DC.mintD),
    B(16, 28.8, 0, 29, 1.6, 23, DC.pineD, { r: 0.6 }),
    B(16, 31, 0, 26, 3, 19, DC.mint, { m: 'cloth', r: 1.5 }),
    B(16, 33.4, -8.5, 26, 2.4, 2.4, DC.sky, { m: 'cloth', r: 1.1 }),
    B(6, 33.5, 5.5, 6, 2, 5, DC.pink, { m: 'cloth', r: 0.8 }), B(6, 35.3, 5.5, 6, 1.6, 5, DC.butter, { m: 'cloth', r: 0.7 }),
    LA(25, 32.5, 5.5, [[0, 0], [1.8, 0], [1.8, 3.6], [0.9, 4.5], [0, 4.7]], DC.white, { m: 'gloss' }),
  ]),

  // the old couple's counter: a ledger, a desk bell and a vase of flowers (tap the bell)
  piece('dccounter', 'Day Care front counter', 2, 1, 1200, 'wood', [
    B(32, 15, 1, 62, 30, 24, DC.pine, { r: 1.2 }),
    B(32, 1.2, 13, 60, 2.4, 1, DC.pineD, { r: 0.4 }),
    B(17, 15, 13.4, 26, 18, 0.8, DC.cream, { m: 'gloss', r: 1.2 }), B(47, 15, 13.4, 26, 18, 0.8, DC.cream, { m: 'gloss', r: 1.2 }),
    S(17, 15, 13.9, 4.6, 6, 0.9, DC.eggP), S(15.4, 17, 14.6, 1.2, 1.4, 0.4, DC.pinkD), S(18.6, 13, 14.6, 1, 1.1, 0.4, DC.pinkD),
    S(47, 15, 13.9, 4.6, 6, 0.9, DC.eggS), S(45.4, 17, 14.6, 1.2, 1.4, 0.4, DC.skyD), S(48.6, 13, 14.6, 1, 1.1, 0.4, DC.skyD),
    B(32, 27, 13.5, 24, 4.6, 0.8, DC.pineD, { r: 0.6 }),
    PC(32, 27, 13.95, 22, 3.8, (g, x, y, w, h) => {
      g.fillStyle = DC.pineD; g.fillRect(x, y, w, h);
      font(g, 3.2); g.fillStyle = DC.butter; g.fillText('DAY CARE', x + w / 2, y + h / 2 + 0.2);
    }),
    B(32, 31.2, 0, 64, 2.4, 28, DC.pineL, { r: 0.8 }),
    B(22, 32.8, 2, 16, 0.8, 11, DC.red, { m: 'gloss', r: 0.3 }), B(22, 33.4, 2, 15, 0.6, 10, DC.white, { m: 'plain', r: 0.2 }),
    RD([26, 33.6, 3], [29, 37.5, 0], 0.35, DC.white, { m: 'plain' }),
    LA(42, 32.4, 4, [[3.2, 0], [3.2, 0.6], [2.8, 1.4], [1.8, 2.6], [0, 3]], DC.butter, { m: 'metal' }), S(42, 35.6, 4, 0.7, 0.7, 0.7, DC.butter, { m: 'metal' }),
    LA(54, 32.4, -4, [[0, 0], [2.4, 0], [3, 2.6], [2, 5], [1.6, 6], [0, 6]], DC.sky, { m: 'gloss' }),
    RD([54, 38, -4], [52.4, 42, -4], 0.3, DC.leaf, { m: 'plain' }), RD([54, 38, -4], [55.6, 43, -4], 0.3, DC.leaf, { m: 'plain' }),
    S(52.4, 42.5, -4, 1.4, 1.4, 1.4, DC.pink, { m: 'cloth' }), S(55.6, 43.5, -4, 1.4, 1.4, 1.4, DC.butter, { m: 'cloth' }), S(54, 40.6, -2.8, 1.2, 1.2, 1.2, DC.lav, { m: 'cloth' }),
  ]),

  // the Day Care's sign, under a little pine roof
  wallPiece('dcsign', 'Day Care sign', 2, 450, 'wood', [
    B(32, 56, 0.4, 60, 24, 0.8, DC.pineD, { r: 4 }),
    B(32, 56, 1.2, 56, 20, 1.6, DC.pine, { r: 3 }),
    PC(32, 56, 2.05, 42, 16, (g, x, y, w, h) => {
      g.fillStyle = DC.cream; g.beginPath(); g.roundRect(x, y, w, h, 2); g.fill();
      font(g, 6.6); g.fillStyle = DC.pinkD; g.fillText('DAY CARE', x + w / 2, y + 6.4);
      font(g, 2.8, false); g.fillStyle = DC.ink; g.fillText('We raise your Pokémon!', x + w / 2, y + 12, w - 3);
    }),
    ...egg(7.5, 56, 1.6, 3, DC.eggP, DC.pinkD), ...egg(56.5, 56, 1.6, 3, DC.eggS, DC.mintD),
    PR(32, 67.6, 1.6, [[-31.5, 0], [31.5, 0], [0, 8]], 3, DC.red, { m: 'wood' }),
  ]),

  // a chart of eggs and the steps each has left to hatch
  wallPiece('dcstepchart', 'Egg steps chart', 1, 250, 'plain', [
    B(16, 56, 0.4, 26, 34, 0.8, DC.cream, { r: 0.3 }),
    PC(16, 56, 0.85, 25, 33, (g, x, y, w, h) => {
      g.fillStyle = DC.cream; g.fillRect(x, y, w, h);
      font(g, 3.4); g.fillStyle = DC.pinkD; g.fillText('EGG STEPS', x + w / 2, y + 3.4);
      [[DC.mintD, 0.85], [DC.skyD, 0.55], [DC.pinkD, 0.3], [DC.orange, 0.1]].forEach(([c, f], i) => {
        const ry = y + 9 + i * 6.4;
        eggIcon(g, x + 3.6, ry, 1.8, DC.white, c);
        g.fillStyle = '#e8dcc0'; g.beginPath(); g.roundRect(x + 7, ry - 1.2, w - 9, 2.4, 1.2); g.fill();
        g.fillStyle = c; g.beginPath(); g.roundRect(x + 7, ry - 1.2, (w - 9) * f, 2.4, 1.2); g.fill();
      });
      font(g, 2.6, false); g.fillStyle = DC.ink; g.fillText('Walk more to hatch!', x + w / 2, y + h - 2.4, w - 2);
    }),
    S(5, 71, 1.4, 1, 1, 0.8, DC.pinkD), S(27, 71, 1.4, 1, 1, 0.8, DC.mintD),
  ]),

  // a height chart, little Pokémon marking how they've grown
  wallPiece('dcheight', 'Day Care height chart', 1, 250, 'gloss', [
    B(16, 46, 0.5, 13, 76, 1, DC.cream, { r: 1.5 }),
    PC(16, 46, 1.05, 12, 75, (g, x, y, w, h) => {
      g.fillStyle = DC.cream; g.fillRect(x, y, w, h);
      const bands = [DC.pink, DC.butter, DC.mint, DC.sky, DC.lav];
      bands.forEach((c, i) => { g.fillStyle = c; g.fillRect(x, y + i * h / 5, 3.4, h / 5); });
      g.fillStyle = DC.ink;
      for (let i = 0; i <= 30; i++) g.fillRect(x + 3.4, y + h - 1 - i * (h - 2) / 30, i % 5 ? 1.4 : 2.6, 0.35);
      [[0.18, DC.butter, 'p'], [0.42, DC.egg, 't'], [0.68, DC.pink, 'i']].forEach(([f, c, who]) => {
        const hy = y + h - f * h, cx = x + 8.4;
        g.fillStyle = DC.pinkD; g.fillRect(x + 3.4, hy - 0.25, 3, 0.5);
        if (who === 'p') { g.fillStyle = DC.ink; g.beginPath(); g.moveTo(cx - 2.6, hy - 1); g.lineTo(cx - 3.4, hy - 4.4); g.lineTo(cx - 1, hy - 2); g.moveTo(cx + 2.6, hy - 1); g.lineTo(cx + 3.4, hy - 4.4); g.lineTo(cx + 1, hy - 2); g.fill(); }
        g.fillStyle = c; g.beginPath(); g.arc(cx, hy, 2.6, 0, TAU); g.fill();
        if (who === 't') { g.fillStyle = DC.egg; for (const dx of [-1.2, 0, 1.2]) { g.beginPath(); g.moveTo(cx + dx - 0.7, hy - 2.2); g.lineTo(cx + dx, hy - 3.8); g.lineTo(cx + dx + 0.7, hy - 2.2); g.fill(); } }
        if (who === 'i') { g.fillStyle = sh(DC.pink, -1); g.beginPath(); g.arc(cx, hy - 2.4, 0.9, 0, TAU); g.fill(); }
        g.fillStyle = DC.ink; g.fillRect(cx - 1.1, hy - 0.6, 0.6, 0.9); g.fillRect(cx + 0.5, hy - 0.6, 0.6, 0.9);
        if (who === 'p') { g.fillStyle = DC.red; g.beginPath(); g.arc(cx - 1.6, hy + 0.9, 0.55, 0, TAU); g.arc(cx + 1.6, hy + 0.9, 0.55, 0, TAU); g.fill(); }
      });
    }),
    ...egg(16, 89, 1.4, 4, DC.egg, DC.mintD),
  ]),

  // interlocking foam tiles, a letter on each
  { id: 'dcabcrug', name: 'Foam alphabet play mat', w: 2, h: 2, layer: 'rug', price: 500, high: 0.05, side: 'm', flat(w, h) {
    const g = ctx(), n = 4, s = w / n;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const c = BALLS[(i + j * 3) % BALLS.length], x = i * s, y = j * s;
      R(x, y, s, s, c);
      g.fillStyle = sh(c, -1); g.fillRect(x, y + s - 0.6, s, 0.6); g.fillRect(x + s - 0.6, y, 0.6, s);
      if (i < n - 1) disc(x + s, y + s / 2, 2, c);
      if (j < n - 1) disc(x + s / 2, y + s, 2, c);
      font(g, 9); g.fillStyle = sh(c, -2); g.fillText(String.fromCharCode(65 + j * n + i), x + s / 2 + 0.5, y + s / 2 + 1.3);
      g.fillStyle = DC.white; g.fillText(String.fromCharCode(65 + j * n + i), x + s / 2, y + s / 2 + 0.8);
    }
  } },

  // Togepi's shell, its top half a soft night light (tap it to switch)
  piece('dcnightlight', 'Togepi-shell night light', 1, 1, 400, 'gloss', [
    LA(16, 0, 0, [[0, 0], [8, 0], [8, 1.8], [6.5, 3], [0, 3]], DC.pine, { m: 'wood' }),
    LA(16, 3, 0, [[0, 0], [5, 0.4], [8.5, 3], [10, 7], [10.2, 10], [0, 10]], DC.egg),
    PR(16, 8, -8.8, tri(3.6, 3.2), 0.8, DC.red), PR(12, 7, 8.2, tri(3.6, 3.2), 0.8, DC.red), PR(20, 7.6, 8.2, tri(3.6, 3.2), 0.8, DC.skyD),
    PR(6.6, 7.6, 1.5, tri(1, 3.2), 3, DC.skyD), PR(25.4, 7.6, -1.5, tri(1, 3.2), 3, DC.red),
    LA(16, 13, 0, [[9.6, 0], [9.3, 3], [7.6, 6.2], [4.4, 8.4], [0, 9.2]], DC.glowY, { m: 'glow' }),
    ...Array.from({ length: 8 }, (_, i) => { const a = (i + 0.5) / 8 * TAU; return C(16 + Math.cos(a) * 8.6, 14.4, Math.sin(a) * 8.6, 0, 3, DC.egg, { rb: 2.6 }); }),
    C(13.8, 23, 0, 0, 3.2, DC.cream, { rb: 1.2 }), C(16, 23.8, 0, 0, 3.6, DC.cream, { rb: 1.3 }), C(18.2, 23, 0, 0, 3.2, DC.cream, { rb: 1.2 }),
  ], { glow: [DC.glowY] }),

  // a little slide: steps, a mint platform, a pink chute
  piece('dcslide', 'Baby Pokémon slide', 2, 1, 650, 'gloss', [
    B(3.5, 3.5, 0, 5, 7, 18, DC.sky, { r: 1 }), B(8.5, 7, 0, 5, 14, 18, DC.sky, { r: 1 }),
    B(15, 10, 0, 10, 20, 20, DC.butter, { r: 1.2 }),
    B(12, 21, 0, 17, 2, 22, DC.mint, { r: 1 }),
    ...[4.5, 19.5].map(x => RD([x, 22, -9.5], [x, 30, -9.5], 0.8, DC.pinkD)), RD([4.5, 30, -9.5], [19.5, 30, -9.5], 0.8, DC.pinkD),
    RD([4.5, 22, 9.5], [4.5, 30, 9.5], 0.8, DC.pinkD), RD([4.5, 30, -9.5], [4.5, 30, 9.5], 0.8, DC.pinkD),
    B(46, 3.5, 0, 3, 7, 12, DC.sky, { r: 0.8 }),
    PR(41, 0, 0, [[19, 23.5], [26, 22.5], [34, 17.5], [44, 10], [52, 5], [58, 3.6], [63, 3.6], [63, 1], [57, 1], [51, 2.5], [43, 7.5], [33, 15], [25, 20], [19, 21]].map(([X, H]) => [X - 41, H]), 14, DC.pink),
    ...[-7.6, 7.6].map(z => PR(41, 0, z, [[19, 26], [26, 25], [34, 20], [44, 12.5], [52, 7.5], [58, 6], [63, 6], [63, 3.6], [58, 3.6], [52, 5], [44, 10], [34, 17.5], [26, 22.5], [19, 23.5]].map(([X, H]) => [X - 41, H]), 1.6, DC.butter)),
  ]),

  // a round ball pit full of pastel balls and a Poké Ball (tap it to boing)
  piece('dcballpit', 'Pastel ball pit', 2, 2, 900, 'gloss', [
    C(32, 7, 0, 29, 14, DC.sky),
    RG(32, 1, 0, 28.8, 1, DC.butter, { m: 'gloss' }),
    ...Array.from({ length: 18 }, (_, i) => {
      const a = i * 2.39996, rad = 22.5 * Math.sqrt((i + 0.5) / 18);
      return S(32 + Math.cos(a) * rad, 14.8 + (i % 3) * 0.9, Math.sin(a) * rad, 2.6, 2.6, 2.6, [...BALLS, DC.red][i % 7]);
    }),
    ...pokeBall(32, 17.4, 4, 3.2),
    RG(32, 14, 0, 27, 2.4, DC.pink, { m: 'cloth' }),
  ]),

  // a pine sandbox: a sand castle, a bucket, a spade and a Poké Ball half buried
  piece('dcsandbox', 'Day Care sandbox', 2, 2, 600, 'wood', [
    B(32, 4.5, -28, 62, 9, 4, DC.pine, { r: 1 }),
    B(2, 4.5, 0, 4, 9, 52, DC.pine, { r: 1 }), B(62, 4.5, 0, 4, 9, 52, DC.pine, { r: 1 }),
    B(32, 6.5, 0, 56, 3, 52, DC.sand, { m: 'plain', r: 1 }),
    C(40, 11, -8, 6, 6, DC.sandD, { m: 'plain', rb: 7 }),
    ...[[35, 1.6, 5, 1.8], [45, 1.6, 5, 1.8], [40, 2.2, 7, 2.6]].flatMap(([x, r, hh, rb]) => [C(x, 14 + hh / 2, -8, r, hh, DC.sandD, { m: 'plain' }), C(x, 14 + hh + 1.1, -8, 0, 2.2, DC.sandD, { m: 'plain', rb })]),
    RD([40, 23, -8], [40, 27, -8], 0.25, DC.pineD), PR(41.4, 26, -8, [[-1.2, -0.8], [1.6, 0], [-1.2, 0.8]], 0.4, DC.pinkD, { m: 'plain' }),
    LA(16, 8, 6, [[0, 0], [3, 0], [3.8, 5.5], [4, 6], [0, 6]], DC.pink),
    ...arch(12.2, 19.8, 13.6, 3, 6, 0.3, DC.white, 4),
    RD([24, 9, 10], [29, 15, 6], 0.5, DC.pineD), B(23, 8.4, 11, 3.2, 0.8, 4, DC.mint, { r: 0.6 }),
    ...pokeBall(50, 8, 10, 3),
    B(32, 4.5, 28, 62, 9, 4, DC.pine, { r: 1 }),
    ...[[5, 25], [59, 25], [5, -25], [59, -25]].map(([x, z]) => B(x, 9.6, z, 9, 1.4, 9, DC.pineL, { r: 0.6 })),
  ]),

  // a mobile on a stand: eggs, a star and a Poké Ball turning (tap it to spin)
  piece('dcmobile', 'Egg crib mobile', 1, 1, 400, 'wood', [
    LA(16, 0, 0, [[0, 0], [9, 0], [9, 2], [6, 3.4], [0, 3.4]], DC.pineD),
    C(16, 31, 0, 1, 56, DC.pineL),
    RD([5, 58, 0], [27, 58, 0], 0.6, DC.pine), RD([16, 58, -11], [16, 58, 11], 0.6, DC.pine),
    S(16, 60, 0, 1.8, 1.8, 1.8, DC.butter, { m: 'gloss' }),
    ...[[5, 52.6, 0], [27, 52.6, 0], [16, 50.6, 11], [16, 54, -11]].map(([x, h, z]) => RD([x, 58, z], [x, h, z], 0.25, DC.white, { m: 'plain' })),
    ...egg(5, 49.4, 0, 2.4, DC.eggP, DC.pinkD), ...egg(27, 49.4, 0, 2.4, DC.egg, DC.mintD),
    ...pokeBall(16, 48, 9.5, 2.6),
    PR(16, 51, -11, star(3.2), 1.2, DC.butter, { m: 'gloss' }),
  ]),
].map(f => ({ group: GROUP, solo: true, ...f }));
