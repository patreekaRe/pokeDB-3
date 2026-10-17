/* base-furniture-logcabin.js  -  the Log cabin set (furniture expansion session d, 2026-10-17): a snowy mountain lodge.
   Round split logs with pale cut ends, red-and-black buffalo check and green plaid, wool, cast iron, and carved wood
   Pokémon where a lodge would hang a trophy (a Stantler-antler mount, an Ursaring, a Teddiursa on its stump). All
   decoration, all solo, fixed colours.
   An upright piece is a list of parts in painted units (32 a tile): `x` across from the left of its front, `h` up from
   the floor (a wall piece's from the foot of its strip), `z` out to the front from its middle (a wall piece's from the
   wall). They're painted here from any side, and js/base-models-logcabin.js builds the same list as 3D parts (BUILT), so
   picture and model agree. A `pic` part (a clock's dial) is painted on the front only, and the model wears that crop of
   the painting. A `plaid` part is painted in its check here and wears the same check (plaidOn) in the model. */

import { R, sh, oval, ovalShade, floorShadow, ctx, glass as glassPane } from './base-paint.js';

export const LC = {
  log: '#b07a44', logD: '#86592f', logL: '#cf9c62', end: '#efd8a8', ring: '#c49a62',
  plank: '#c48a52', plankD: '#9a6434', plankL: '#dcaa72',
  iron: '#3a383c', ironL: '#5c5a60', brass: '#d6aa48', fire: '#ff9a2e', flame: '#ffd25a',
  cream: '#efe6d2', wool: '#d8c8a6', red: '#c4302a', black: '#26201f', snow: '#f2f6fa', pine: '#2f5e3e', green: '#3d7a48',
  honey: '#e0a030', pecha: '#e87a9a', oran: '#3a62b8', crock: '#e8dcc0', blue: '#3a5a9a', mirror: '#cfe0e8',
  antler: '#dcc08e', orb: '#3a3436', carve: '#b98450', carveD: '#8e5e32', carveL: '#dcb07a', pidgey: '#a8743c',
  pidgeyL: '#f0dcb0', leather: '#6e4a2e', webbing: '#e8dcb4',
};
const GROUP = 'Log cabin';
const TAU = Math.PI * 2;

/* ---------- plaid ---------- */

/** Each check: its ground, the bands crossing it every 8 units (4 wide) and a thin line, if any. */
export const PLAIDS = {
  red: { base: '#c4302a', band: 'rgba(22,14,16,0.64)' },
  green: { base: '#3d7a48', band: 'rgba(14,38,24,0.55)', line: 'rgba(240,206,92,0.85)' },
};
/** Paints check `pl` over x, y, w, h on g, aligned to its own 8-unit grid. */
export function plaidOn(g, x, y, w, h, pl) {
  const P = PLAIDS[pl];
  g.fillStyle = P.base; g.fillRect(x, y, w, h);
  g.fillStyle = P.band;
  for (let s = Math.floor(x / 8) * 8; s < x + w; s += 8) g.fillRect(s, y, 4, h);
  for (let s = Math.floor(y / 8) * 8; s < y + h; s += 8) g.fillRect(x, s, w, 4);
  if (!P.line) return;
  g.fillStyle = P.line;
  for (let s = Math.floor(x / 8) * 8 + 6; s < x + w; s += 8) g.fillRect(s, y, 0.5, h);
  for (let s = Math.floor(y / 8) * 8 + 6; s < y + h; s += 8) g.fillRect(x, s, w, 0.5);
}

/* ---------- parts ---------- */
/** A rounded box centred at x, h, z (`rot` turns it in the front's plane). */
const B = (x, h, z, w, hh, d, c, o) => ({ t: 'box', x, h, z, w, hh, d, c, r: 1.5, ...o });
/** A plaid box: c is the check, 'red' or 'green'. */
const PB = (x, h, z, w, hh, d, pl, o) => B(x, h, z, w, hh, d, pl, { m: 'plaid', r: 1.2, ...o });
/** An upright cylinder centred at h (`rb` its bottom radius). */
const C = (x, h, z, r, hh, c, o) => ({ t: 'cyl', x, h, z, r, hh, c, ...o });
/** A ball rx x ry x rz. */
const S = (x, h, z, rx, ry, rz, c, o) => ({ t: 'ball', x, h, z, rx, ry, rz, c, ...o });
/** A rod from a to b, each [x, h, z] (`cap: 'butt'` for a log, whose end is a disc of its own). */
const RD = (a, b, r, c, o) => ({ t: 'rod', a, b, r, c, x: (a[0] + b[0]) / 2, h: (a[1] + b[1]) / 2, z: (a[2] + b[2]) / 2, ...o });
/** A flat outline [[dx, dh]...] about x, h, d deep. */
const PR = (x, h, z, pts, d, c, o) => ({ t: 'prism', x, h, z, pts, d, c, ...o });
/** A flat outline seen from the side [[dz, dh]...] about x, h, z, d across. */
const PZ = (x, h, z, pts, d, c, o) => ({ t: 'pz', x, h, z, pts, d, c, ...o });
/** A lathe standing on h, its profile [[r, up]...]. */
const LA = (x, h, z, pts, c, o) => ({ t: 'lathe', x, h, z, pts, c, ...o });
/** A disc facing the front, th thick (`ry` for an oval, `rot` to turn it, `fx` to face the sides instead). */
const DS = (x, h, z, r, th, c, o) => ({ t: 'disc', x, h, z, r, th, c, ...o });
/** A ring r round of a tube tr thick, facing the front. */
const RG = (x, h, z, r, tr, c, o) => ({ t: 'ring', x, h, z, r, tr, c, ...o });
/** A picture on a front face, w x hh centred at x, h: `fn(g, left, top, w, hh)` paints it. */
const PC = (x, h, z, w, hh, fn, o) => ({ t: 'pic', x, h, z, w, hh, fn, ...o });

/** A log's cut end facing the front at z: the pale wood and two rings. */
const endZ = (x, h, z, r) => [
  DS(x, h, z + 0.2, r, 0.4, LC.end, { m: 'plain' }),
  DS(x, h, z + 0.45, r * 0.64, 0.2, LC.ring, { m: 'plain' }),
  DS(x, h, z + 0.6, r * 0.44, 0.2, LC.end, { m: 'plain' }),
  DS(x, h, z + 0.75, r * 0.14, 0.2, LC.ring, { m: 'plain' }),
];
/** A log's cut end facing a side (s 1 right, -1 left) at x. */
const endX = (x, h, z, r, s) => [
  DS(x + s * 0.2, h, z, r, 0.4, LC.end, { m: 'plain', fx: true }),
  DS(x + s * 0.45, h, z, r * 0.64, 0.2, LC.ring, { m: 'plain', fx: true }),
  DS(x + s * 0.6, h, z, r * 0.44, 0.2, LC.end, { m: 'plain', fx: true }),
];
/** A log lying across from x0 to x1 (`ends: false` where posts hide them). */
const LOGX = (x0, x1, h, z, r, o = {}) => [
  RD([x0, h, z], [x1, h, z], r, o.c || LC.log, { m: 'wood', cap: 'butt' }),
  ...(o.ends === false ? [] : [...endX(x0, h, z, r, -1), ...endX(x1, h, z, r, 1)]),
];
/** A log lying front to back from z0 to z1, its cut end at the front. */
const LOGZ = (x, h, z0, z1, r, o = {}) => [
  RD([x, h, z0], [x, h, z1], r, o.c || LC.log, { m: 'wood', cap: 'butt' }),
  DS(x, h, z0 - 0.2, r, 0.4, LC.end, { m: 'plain' }),
  ...endZ(x, h, z1, r),
];
/** An upright log from h0 to h1, its cut top showing. */
const LOGY = (x, h0, h1, z, r, c = LC.log) => [
  C(x, (h0 + h1) / 2, z, r, h1 - h0, c, { m: 'wood' }),
  C(x, h1 + 0.15, z, r * 0.94, 0.3, LC.end, { m: 'plain' }),
  C(x, h1 + 0.35, z, r * 0.56, 0.2, LC.ring, { m: 'plain' }),
];
/** A cut log's rings on a flat top at h (r its radius). */
const ringsUp = (x, h, z, r) => [
  C(x, h + 0.15, z, r * 0.95, 0.3, LC.end, { m: 'plain' }),
  C(x, h + 0.35, z, r * 0.68, 0.2, LC.ring, { m: 'plain' }),
  C(x, h + 0.5, z, r * 0.48, 0.2, LC.end, { m: 'plain' }),
  C(x, h + 0.65, z, r * 0.2, 0.2, LC.ring, { m: 'plain' }),
];
/** A jar on h: its body, a cloth lid and a label. */
const jar = (x, h, z, r, hh, c, lid = LC.red) => [
  C(x, h + hh / 2, z, r, hh, c, { m: 'gloss' }),
  C(x, h + hh + 0.6, z, r * 0.86, 1.2, LC.ironL, { m: 'metal' }),
  C(x, h + hh + 1.4, z, r * 1.12, 1, lid, { m: 'plain', rb: r * 1.2 }),
  B(x, h + hh * 0.48, z + r - 0.3, r * 1.2, hh * 0.36, 0.6, LC.cream, { r: 0.3, m: 'plain' }),
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
  const g = ctx(), rr = Math.min(r, w / 2, h / 2);
  if (m === 'glass') { g.save(); g.globalAlpha *= 0.4; glassPane(x, y, w, h, '#cfe8f4'); g.restore(); return; }
  if (m === 'plaid') {
    g.save(); g.beginPath(); g.roundRect(x, y, w, h, rr); g.clip();
    plaidOn(g, x, y, w, h, c);
    const l = g.createLinearGradient(0, y, 0, y + h);
    l.addColorStop(0, 'rgba(255,255,255,0.16)'); l.addColorStop(0.4, 'rgba(255,255,255,0)'); l.addColorStop(1, 'rgba(0,0,0,0.18)');
    g.fillStyle = l; g.fillRect(x, y, w, h); g.restore();
    return;
  }
  g.fillStyle = grad(g, x, y, x + w * 0.3, y + h, c, m); g.beginPath(); g.roundRect(x, y, w, h, rr); g.fill();
  if (h > 3 && w > 3) { g.save(); g.globalAlpha *= 0.5; g.fillStyle = sh(c, 2); g.fillRect(x + rr * 0.6, y + 0.3, w - rr * 1.2, 0.6); g.restore(); }
}
function poly(pts, c, m, horiz) {
  const g = ctx(), xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  if (m === 'glass') { g.save(); g.globalAlpha *= 0.35; }
  if (horiz) {
    const l = g.createLinearGradient(x0, 0, x1, 0);
    l.addColorStop(0, sh(c, -1)); l.addColorStop(0.3, sh(c, 1)); l.addColorStop(0.55, c); l.addColorStop(1, sh(c, -2));
    g.fillStyle = m === 'glass' ? '#cfe8f4' : l;
  } else g.fillStyle = m === 'glass' ? '#cfe8f4' : grad(g, x0, y0, x1, y1, c, m);
  g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill();
  if (m === 'glass') g.restore();
}
function ball(cx, cy, rx, ry, c, m, rot = 0) {
  const g = ctx();
  if (rot) { g.fillStyle = grad(g, cx - rx, cy - ry, cx + rx, cy + ry, c, m); g.beginPath(); g.ellipse(cx, cy, rx, ry, -rot, 0, TAU); g.fill(); return; }
  if (m === 'glow') { const t = g.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry)); t.addColorStop(0, '#ffffff'); t.addColorStop(0.4, sh(c, 1)); t.addColorStop(1, c); g.fillStyle = t; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, TAU); g.fill(); return; }
  if (m === 'plain') { oval(cx, cy, rx, ry, c); return; }
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
      case 'box': {
        const w = side ? q.d : q.w;
        if (q.rot && !side) { g.save(); g.translate(cx, cy); g.rotate(dir === 0 ? -q.rot : q.rot); rbx(-w / 2, -q.hh / 2, w, q.hh, q.r, q.c, m); g.restore(); }
        else rbx(cx - w / 2, cy - q.hh / 2, w, q.hh, q.r, q.c, m);
        break;
      }
      case 'cyl': {
        const rb = q.rb ?? q.r, top = cy - q.hh / 2, bot = cy + q.hh / 2;
        poly([[cx - q.r, top], [cx + q.r, top], [cx + rb, bot], [cx - rb, bot]], q.c, m, m !== 'glow');
        if (m !== 'glass') oval(cx, top, q.r, Math.min(q.r * 0.22, Math.max(0.3, q.hh / 2)), sh(q.c, m === 'glow' ? 2 : 1));
        break;
      }
      case 'ball': ball(cx, cy, side ? q.rz : q.rx, q.ry, q.c, m); break;
      case 'disc': {
        const ry = q.ry ?? q.r;
        if (side !== !!q.fx) rbx(cx - q.th / 2, cy - ry, q.th, ry * 2, q.th / 2, q.c, m);
        else ball(cx, cy, q.r, ry, q.c, m, side ? 0 : (dir === 0 ? q.rot : -q.rot) || 0);
        break;
      }
      case 'lathe': {
        const pts = q.pts.map(([r, up]) => [r, cy - up]);
        poly([...pts.map(([r, y]) => [cx - r, y]), ...pts.slice().reverse().map(([r, y]) => [cx + r, y])], q.c, m, true);
        if (q.pts[q.pts.length - 1][0] < 0.01 && q.pts.length > 2) break;
        const [rt, ut] = q.pts[q.pts.length - 1];
        oval(cx, cy - ut, rt, rt * 0.22, sh(q.c, -2));
        break;
      }
      case 'ring': {
        g.strokeStyle = q.c; g.lineWidth = q.tr * 2; g.beginPath();
        if (side) { rbx(cx - q.tr, cy - q.r - q.tr, q.tr * 2, (q.r + q.tr) * 2, q.tr, q.c, m); break; }
        g.arc(cx, cy, q.r, 0, TAU); g.stroke();
        g.save(); g.globalAlpha *= 0.45; g.strokeStyle = sh(q.c, 2); g.lineWidth = q.tr * 0.6; g.beginPath();
        g.arc(cx, cy, q.r, Math.PI * 1.1, Math.PI * 1.6); g.stroke(); g.restore();
        break;
      }
      case 'rod': {
        const p0 = [U(q.a[0], q.a[2]), b - q.a[1]], p1 = [U(q.b[0], q.b[2]), b - q.b[1]];
        if (Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) < 0.01 && q.cap === 'butt') break;
        g.lineCap = q.cap || 'round'; g.strokeStyle = m === 'glass' ? alphaOf('#cfe8f4', 0.4) : q.c; g.lineWidth = q.r * 2;
        g.beginPath(); g.moveTo(...p0); g.lineTo(...p1); g.stroke();
        if (q.r > 0.6 && m !== 'glass') {
          g.save(); g.globalAlpha *= 0.5; g.strokeStyle = sh(q.c, 2); g.lineWidth = q.r * 0.6;
          g.beginPath(); g.moveTo(p0[0] - q.r * 0.35, p0[1] - q.r * 0.35); g.lineTo(p1[0] - q.r * 0.35, p1[1] - q.r * 0.35); g.stroke(); g.restore();
          g.save(); g.globalAlpha *= 0.35; g.strokeStyle = sh(q.c, -2); g.lineWidth = q.r * 0.5;
          g.beginPath(); g.moveTo(p0[0] + q.r * 0.5, p0[1] + q.r * 0.5); g.lineTo(p1[0] + q.r * 0.5, p1[1] + q.r * 0.5); g.stroke(); g.restore();
        }
        break;
      }
      case 'prism': {
        if (side) {
          const hs = q.pts.map(p => p[1]), top = Math.max(...hs), bot = Math.min(...hs);
          rbx(cx - q.d / 2, b - q.h - top, q.d, top - bot, Math.min(1, q.d / 2), q.c, m);
          break;
        }
        poly(q.pts.map(([px, ph]) => [U(q.x + px, 0), b - q.h - ph]), q.c, m);
        break;
      }
      case 'pz': {
        if (!side) {
          const hs = q.pts.map(p => p[1]), top = Math.max(...hs), bot = Math.min(...hs);
          rbx(cx - q.d / 2, b - q.h - top, q.d, top - bot, Math.min(1, q.d / 2), q.c, m);
          break;
        }
        poly(q.pts.map(([pz, ph]) => [U(q.x, q.z + pz), b - q.h - ph]), q.c, m);
        break;
      }
      case 'pic': g.save(); g.beginPath(); g.rect(cx - q.w / 2, cy - q.hh / 2, q.w, q.hh); g.clip(); q.fn(g, cx - q.w / 2, cy - q.hh / 2, q.w, q.hh); g.restore(); break;
    }
  }
}

/* ---------- pictures ---------- */

/** A clock face filling w x hh: cream, twelve ticks, two hands. */
function dial(g, x, y, w, h) {
  const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2 - 0.4;
  g.fillStyle = LC.cream; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill();
  g.strokeStyle = LC.plankD; g.lineWidth = 0.5; g.beginPath(); g.arc(cx, cy, r - 0.3, 0, TAU); g.stroke();
  g.strokeStyle = LC.black; g.lineWidth = 0.35;
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, k = i % 3 ? 0.82 : 0.7; g.beginPath(); g.moveTo(cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k); g.lineTo(cx + Math.cos(a) * r * 0.9, cy + Math.sin(a) * r * 0.9); g.stroke(); }
  g.lineCap = 'round'; g.lineWidth = 0.6;
  g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + r * 0.42, cy - r * 0.22); g.stroke();
  g.lineWidth = 0.4; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx - r * 0.1, cy - r * 0.68); g.stroke();
  g.fillStyle = LC.brass; g.beginPath(); g.arc(cx, cy, 0.7, 0, TAU); g.fill();
}

/* ---------- the kinds ---------- */

/** What js/base-models-logcabin.js builds for each upright and wall kind: its parts, doors and default material. */
export const BUILT = {};
/** The braided rug's outline: ellipses [cx, cy, rx, ry] in painted units, from above. */
export const RUGS = {
  cabinbraidrug: [[32, 32, 30, 25]],
};

function piece(id, name, w, h, price, mat, parts, { doors = [], inside, ...rest } = {}) {
  BUILT[id] = { parts, doors, inside, mat };
  const all = [...parts, ...doors.flatMap(d => d.parts)];
  return { id, name, group: GROUP, solo: true, w, h, price, ...rest, draw(x, b, vw, dir) { floorShadow(x, b, vw); paintParts(all, x, b, vw, dir, w * 32); } };
}
function wallPiece(id, name, w, price, mat, parts, rest = {}) {
  BUILT[id] = { parts, doors: [], mat };
  return { id, name, group: GROUP, solo: true, w, h: 1, layer: 'wall', price, ...rest, wall(x) { paintParts(parts, x, 96, w * 32, 0, w * 32); } };
}
/** A wardrobe door, x0 to x1 wide, its hinge on side s (1 the left edge), planked, Z-braced and strapped in iron. */
function plankDoor(x0, x1, s) {
  const cx = (x0 + x1) / 2, w = x1 - x0, hx = s > 0 ? x0 + 3.5 : x1 - 3.5, px = s > 0 ? x1 - 3 : x0 + 3;
  return {
    hinge: [s > 0 ? x0 : x1, 12.6], side: s, parts: [
      B(cx, 41, 12.6, w, 68, 1.6, LC.plank, { r: 0.8 }),
      ...[-1, 0, 1].map(i => B(cx + i * w / 4, 41, 13.45, 0.5, 66, 0.3, LC.plankD, { r: 0.1 })),
      ...[20, 62].map(h => B(cx, h, 13.8, w - 3, 3, 0.8, LC.plankD, { r: 0.5 })),
      RD([x0 + 2.5, 21.5, 13.8], [x1 - 2.5, 60.5, 13.8], 1.1, LC.plankD),
      ...[20, 62].map(h => B(hx, h, 14.4, 8, 1.6, 0.6, LC.iron, { r: 0.3, m: 'metal' })),
      RG(px, 41, 14.2, 1.8, 0.45, LC.iron, { m: 'metal' }),
    ],
  };
}

export const LOGCABIN_KINDS = [
  // a log bed: stacked logs for head and foot, a buffalo-check quilt, a green blanket folded at the foot
  piece('cabinbed', 'Log cabin bed', 2, 2, 1200, 'wood', [
    ...[5, 59].flatMap(x => [...LOGY(x, 0, 46, -27, 4.2), ...LOGY(x, 0, 28, 27, 4.2)]),
    ...[22, 29.5, 37].flatMap(h => LOGX(1, 63, h, -27.6, 3.4)),
    ...[13, 20.4].flatMap(h => LOGX(1, 63, h, 27.4, 3.2)),
    ...[5, 59].map(x => RD([x, 10, -27], [x, 10, 27], 3, LC.logD, { m: 'wood', cap: 'butt' })),
    B(32, 15, 0, 54, 8, 52, LC.cream, { r: 2, m: 'cloth' }),
    PB(32, 20.5, 4, 56, 3, 46, 'red'),
    B(32, 21.4, -17, 56, 3.4, 6, LC.cream, { r: 1.5, m: 'cloth' }),
    ...[19, 45].map(x => S(x, 24, -22, 10, 3.6, 5.5, LC.cream, { m: 'cloth' })),
    PB(32, 23.3, 17, 40, 2.6, 10, 'green', { r: 1 }),
  ]),

  // a log armchair: post legs, log arms with their cut ends forward, plaid cushions
  piece('cabinchair', 'Log armchair', 1, 1, 400, 'wood', [
    ...[5, 27].flatMap(x => [...LOGY(x, 0, 42, -10, 2.6), ...LOGY(x, 0, 24, 10, 2.6)]),
    B(16, 15, 0, 26, 3, 24, LC.plank, { r: 1 }),
    ...[5, 27].map(x => RD([x, 7, -10], [x, 7, 10], 1.5, LC.logD)),
    RD([5, 7, 10], [27, 7, 10], 1.5, LC.logD),
    ...[5, 27].flatMap(x => LOGZ(x, 25.6, -11, 13, 2.2)),
    ...[31, 39].flatMap(h => LOGX(5, 27, h, -10, 2.2, { ends: false })),
    PB(16, 18, 1, 22, 3, 19, 'red', { r: 1.4 }),
    PB(16, 30.5, -7.6, 20, 12, 3, 'red', { r: 1.4 }),
  ]),

  // a rocking chair on curved runners, spindles at its back, a green throw over them
  piece('cabinrocker', 'Cabin rocking chair', 1, 1, 650, 'wood', [
    ...[6, 26].map(x => PZ(x, 0, 0, [[-15, 3.4], [-10, 1.2], [-4, 0.2], [4, 0.2], [10, 1.2], [15, 3.4], [15, 6], [10, 3.8], [4, 2.8], [-4, 2.8], [-10, 3.8], [-15, 6]], 2.4, LC.logD)),
    ...[6, 26].flatMap(x => [RD([x, 2.5, 7], [x, 22, 8], 1.6, LC.log), RD([x, 2.5, -7], [x, 45, -11], 1.8, LC.log)]),
    B(16, 19, 0, 24, 2.6, 20, LC.plank, { r: 1 }),
    ...[6, 26].flatMap(x => LOGZ(x, 27.5, -9.5, 11, 1.8)),
    ...[11, 16, 21].map(x => RD([x, 20, -8.4], [x, 44, -10.8], 0.9, LC.logL)),
    ...LOGX(4, 28, 45, -11, 2.2),
    PB(16, 21.6, 1, 20, 2.4, 17, 'red'),
    PB(16, 35, -8.6, 18, 16, 1.4, 'green', { r: 0.8 }),
  ]),

  // a log sofa: a wall of stacked logs behind, log arms, buffalo-check cushions
  piece('cabinsofa', 'Log sofa', 2, 1, 1100, 'wood', [
    ...[4, 60].flatMap(x => [...LOGY(x, 0, 34, -12, 3.2), ...LOGY(x, 0, 24, 11, 3.2)]),
    ...[14, 21, 28].flatMap(h => LOGX(1, 63, h, -12.6, 3)),
    ...[4, 60].flatMap(x => LOGZ(x, 25, -12, 13, 2.8)),
    ...LOGX(7, 57, 6, 11, 3, { ends: false }),
    B(32, 10, 0, 52, 4, 24, LC.plank, { r: 1 }),
    ...[19, 45].map(x => PB(x, 14.5, 2, 25, 5, 21, 'red', { r: 2 })),
    ...[19, 45].map(x => PB(x, 24.5, -7.5, 24, 13, 5, 'red', { r: 2 })),
    S(54, 21, -2.5, 4.5, 4.5, 2, LC.cream, { m: 'cloth' }),
    S(10, 21, -2.5, 4.5, 4.5, 2, LC.green, { m: 'cloth' }),
  ]),

  // a long table of three wide planks on log legs, a plaid runner down it
  piece('cabintable', 'Plank dining table', 2, 1, 800, 'wood', [
    ...[6, 58].flatMap(x => [-10, 10].flatMap(z => LOGY(x, 0, 25.5, z, 2.8))),
    ...LOGX(6, 58, 8, 0, 1.8, { ends: false }),
    ...[6, 58].map(x => RD([x, 8, -10], [x, 8, 10], 1.6, LC.logD)),
    B(32, 23.4, 0, 52, 3, 22, LC.plankD, { r: 0.6 }),
    B(32, 27, -10.3, 63, 3, 10, LC.plank, { r: 0.8 }),
    B(32, 27, 0, 63, 3, 10.2, LC.plankL, { r: 0.8 }),
    B(32, 27, 10.3, 63, 3, 10, LC.plank, { r: 0.8 }),
    PB(32, 28.7, 0, 16, 0.5, 30.6, 'red', { r: 0.2 }),
  ]),

  // a writing desk: a pedestal of three drawers on the left, log legs on the right
  piece('cabindesk', 'Log writing desk', 2, 1, 850, 'wood', [
    B(13, 13, 1, 22, 26, 24, LC.plank, { r: 1 }),
    ...[5.5, 13, 20.5].flatMap(h => [B(13, h, 13.4, 19, 6.4, 1, LC.plankL, { r: 0.8 }), B(13, h, 14.2, 5, 1.2, 0.8, LC.iron, { r: 0.4, m: 'metal' })]),
    ...[-10, 11].flatMap(z => LOGY(58, 0, 26, z, 2.6)),
    RD([58, 7, -10], [58, 7, 11], 1.5, LC.logD),
    B(42, 22.5, -10.5, 32, 6, 1.6, LC.plankD, { r: 0.5 }),
    B(32, 27.5, 1, 63, 3, 28, LC.plankL, { r: 1 }),
  ]),

  // a tall plank wardrobe in a log frame, its sides stacked logs, two Z-braced doors
  piece('cabinwardrobe', 'Log wardrobe', 2, 1, 1200, 'wood', [
    B(32, 41, -1, 56, 72, 24, LC.plankD, { r: 1 }),
    ...[3, 61].flatMap(x => [...LOGY(x, 0, 80, 11, 3), ...LOGY(x, 0, 80, -12, 3)]),
    ...[3, 61].flatMap(x => [15, 27, 39, 51, 63].map(h => RD([x, h, -12], [x, h, 11], 2.6, LC.logL, { m: 'wood', cap: 'butt' }))),
    ...LOGX(0.8, 63.2, 80.6, 12, 3),
    ...LOGX(6, 58, 3.2, 11.4, 3.2, { ends: false }),
  ], {
    doors: [plankDoor(6.5, 32, 1), plankDoor(32, 57.5, -1)],
    inside: { x: 32, h: 41, w: 50, hh: 66, z: 11.2 },
  }),

  // a chest of drawers between log posts, iron pulls
  piece('cabindresser', 'Log dresser', 2, 1, 900, 'wood', [
    B(32, 18, -1, 58, 32, 24, LC.plankD, { r: 1 }),
    ...[3, 61].flatMap(x => [...LOGY(x, 0, 35, 11, 2.8), ...LOGY(x, 0, 35, -12, 2.8)]),
    ...[18, 46].flatMap(x => [B(x, 29, 11.8, 25, 8.6, 1.4, LC.plank, { r: 0.8 }), B(x, 29, 12.9, 5, 1.3, 0.8, LC.iron, { r: 0.4, m: 'metal' })]),
    ...[8, 18.5].flatMap(h => [B(32, h, 11.8, 52, 8.6, 1.4, LC.plank, { r: 0.8 }), ...[20, 44].map(x => B(x, h, 12.9, 5, 1.3, 0.8, LC.iron, { r: 0.4, m: 'metal' }))]),
    B(32, 36.4, 0, 63, 3, 30, LC.plankL, { r: 1 }),
  ]),

  // a pantry shelf: Teddiursa's honey, Pecha jam and Oran preserves, a crock and folded blankets below
  piece('cabinshelf', 'Pantry jar shelf', 1, 1, 600, 'wood', [
    ...[3, 29].flatMap(x => LOGY(x, 0, 66, -4, 2.6)),
    ...[2, 22, 42, 62].map(h => B(16, h, -4, 31, 2.4, 17, LC.plank, { r: 0.6 })),
    LA(9, 3.2, -4, [[0, 0], [5, 0], [5.6, 4], [5.2, 10], [4, 11], [0, 11]], LC.crock, { m: 'gloss', seg: 12 }),
    C(9, 8.6, -4, 5.75, 1.6, LC.blue, { m: 'plain' }),
    PB(22.5, 6, -4, 11, 5.6, 13, 'red', { r: 1 }),
    PB(22.5, 11.2, -4, 11, 4.6, 13, 'green', { r: 1 }),
    ...jar(8, 23.2, -3, 3.4, 9, LC.honey),
    ...jar(16, 23.2, -3, 3.4, 8, LC.pecha, LC.green),
    ...jar(24, 23.2, -3, 3.4, 9, LC.oran),
    ...jar(8, 43.2, -3, 3, 7, LC.oran, LC.green),
    ...jar(15.5, 43.2, -3, 3.6, 11, LC.honey),
    C(24, 47.2, -3, 3.2, 8, LC.red, { m: 'gloss' }), C(24, 47.2, -3, 3.3, 2.4, LC.cream, { m: 'plain' }), C(24, 51.6, -3, 3.3, 0.8, LC.ironL, { m: 'metal' }),
  ]),

  // an iron lantern hung from a shepherd's hook on a log post, a log round for its base
  piece('cabinlamp', 'Lantern floor lamp', 1, 1, 450, 'metal', [
    C(16, 2, 0, 10, 4, LC.log, { m: 'wood' }), ...ringsUp(16, 4, 0, 10),
    ...LOGY(10, 4, 60, 0, 2.2),
    RD([10, 58, 0], [23, 58, 0], 1, LC.iron), RD([23, 58, 0], [23, 54, 0], 0.5, LC.iron),
    RG(23, 53, 0, 1.3, 0.4, LC.iron),
    C(23, 35.4, 0, 4.8, 1.6, LC.iron),
    B(23, 41.6, 0, 7.4, 11, 7.4, LC.flame, { r: 1, m: 'glow' }),
    ...[[-4, -4], [4, -4], [-4, 4], [4, 4]].map(([dx, dz]) => RD([23 + dx, 36, dz], [23 + dx, 47.6, dz], 0.5, LC.iron)),
    LA(23, 47.4, 0, [[5.2, 0], [4.8, 1], [2, 4], [0.8, 5], [0, 5.2]], LC.iron, { seg: 8 }),
  ], { glow: [LC.flame] }),

  // a longcase clock: plank case between half-logs, a brass pendulum behind glass, a carved pediment
  piece('cabinclock', 'Log longcase clock', 1, 1, 1000, 'wood', [
    B(16, 6, 0, 24, 12, 16, LC.plankD, { r: 1 }),
    B(16, 26, 0, 17, 28, 12, LC.plank, { r: 0.8 }),
    ...[6.8, 25.2].flatMap(x => LOGY(x, 12, 40, 3.5, 1.9)),
    B(16, 26, 6.3, 11, 22, 0.8, LC.plankD, { r: 0.4 }),
    RD([16, 36, 7], [16, 21, 7], 0.4, LC.brass, { m: 'metal' }),
    DS(16, 20, 7.1, 3, 0.6, LC.brass, { m: 'metal' }),
    B(16, 26, 7.8, 9.4, 20, 0.4, '#cfe8f4', { r: 0.3, m: 'glass', k: 30 }),
    B(16, 49, 0, 22, 18, 15, LC.plankD, { r: 1 }),
    DS(16, 49.5, 7.6, 7, 0.6, LC.cream, { m: 'plain' }),
    PC(16, 49.5, 8, 13, 13, dial),
    PR(16, 58, 0, [[-12, 0], [12, 0], [0, 7]], 15, LC.plank),
    S(16, 65.4, 0, 1.6, 1.6, 1.6, LC.brass, { m: 'metal' }),
  ]),

  // a cast iron wood stove, the fire through its grate, a stovepipe up the wall, a red kettle warming
  piece('cabinstove', 'Cast iron stove', 1, 1, 1300, 'metal', [
    ...[7, 25].flatMap(x => [-5, 9].map(z => C(x, 2.5, z, 1.4, 5, LC.iron, { rb: 2 }))),
    B(16, 5.6, 2, 26, 2, 22, LC.ironL, { r: 0.6 }),
    B(16, 15.5, 2, 24, 21, 20, LC.iron, { r: 2 }),
    B(16, 27, 2, 28, 2.4, 23, LC.ironL, { r: 0.8 }),
    B(16, 15, 12.4, 15, 12, 1, LC.ironL, { r: 1 }),
    B(16, 15.5, 13, 10, 6.5, 0.4, LC.fire, { r: 1, m: 'glow' }),
    ...[13, 16, 19].map(x => RD([x, 12.4, 13.4], [x, 18.6, 13.4], 0.4, LC.iron)),
    B(16, 8, 12.6, 12, 1.4, 1.4, LC.ironL, { r: 0.4 }),
    RD([21.5, 15, 13.2], [21.5, 15, 15.2], 0.5, LC.brass), S(21.5, 15, 15.4, 0.9, 0.9, 0.9, LC.brass, { m: 'metal' }),
    C(16, 29.5, -3, 4, 3, LC.ironL),
    C(16, 54, -3, 3.2, 52, LC.iron),
    C(16, 46, -3, 3.6, 1, LC.ironL),
    LA(8.5, 28.2, 6, [[0, 0], [4, 0], [4.6, 2.6], [3.6, 5], [1.2, 6], [0, 6]], LC.red, { m: 'gloss', seg: 10 }),
    RD([12.4, 30, 6], [15, 33, 6], 0.7, LC.red, { m: 'gloss' }),
    S(8.5, 34.4, 6, 0.9, 0.9, 0.9, LC.black, { m: 'gloss' }),
  ], { glow: [LC.fire] }),

  // a plank box heaped with split logs, their cut ends out
  piece('cabinwoodbox', 'Firewood box', 1, 1, 300, 'wood', [
    B(16, 8.5, 0, 28, 15, 24, LC.plank, { r: 1 }),
    ...[4, 13].map(h => B(16, h, 12.2, 28.4, 2, 0.8, LC.iron, { r: 0.3, m: 'metal' })),
    ...[8, 16, 24].flatMap(x => LOGZ(x, 19.5, -10, 10.5, 3.8)),
    ...[12, 20].flatMap(x => LOGZ(x, 26, -10, 10.5, 3.8, { c: LC.logD })),
    RD([26, 16, -6], [28.5, 30, -8], 0.8, LC.logL),
  ]),

  // a thick log round on three splayed legs, its rings on top
  piece('cabinstool', 'Log-slice stool', 1, 1, 200, 'wood', [
    ...[90, 210, 330].map(a => { const c = Math.cos(a * Math.PI / 180), s = Math.sin(a * Math.PI / 180); return RD([16 + c * 6, 14, s * 6], [16 + c * 10, 0.5, s * 10], 1.6, LC.logD); }),
    C(16, 16.5, 0, 11, 6, LC.log, { m: 'wood' }), ...ringsUp(16, 19.5, 0, 11),
  ]),

  // a log coat rack: a wool hat on top, a green plaid jacket and a buffalo-check scarf on its pegs
  piece('cabincoatrack', 'Cabin coat rack', 1, 1, 350, 'wood', [
    ...LOGX(3, 29, 2.4, 0, 2.4), ...LOGZ(16, 2.4, -13, 13, 2.4),
    ...LOGY(16, 4.8, 66, 0, 2.2),
    RD([16, 60, 0], [8, 64, 4], 0.8, LC.logL), RD([16, 60, 0], [24, 64, -4], 0.8, LC.logL),
    RD([16, 52, 0], [24, 55, 4], 0.8, LC.logL), RD([16, 52, 0], [8, 55, -4], 0.8, LC.logL),
    PB(7.6, 52, 4.8, 4.4, 22, 1.4, 'red', { r: 0.6 }),
    PB(11.2, 54, 4.4, 4.2, 17, 1.4, 'red', { r: 0.6 }),
    PB(24.5, 43, 5.4, 9, 22, 3, 'green', { r: 2 }),
    B(24.5, 53.6, 5.6, 6, 2, 3.4, LC.wool, { r: 0.8, m: 'cloth' }),
    LA(16, 66.4, 0, [[4.6, 0], [4.4, 3], [3, 6], [0, 7]], LC.green, { m: 'cloth', seg: 10 }),
    C(16, 67.2, 0, 4.9, 1.6, LC.cream, { m: 'cloth' }),
    S(16, 74, 0, 2, 2, 2, LC.cream, { m: 'cloth', seg: 8 }),
  ]),

  // a blanket chest: iron bands, a brass lock, a corner of buffalo check under the lid
  piece('cabinchest', 'Blanket chest', 2, 1, 700, 'wood', [
    ...[6, 58].flatMap(x => [-10, 10].map(z => S(x, 1.4, z, 3, 1.6, 3, LC.logD, { m: 'wood' }))),
    B(32, 12, 0, 58, 20, 26, LC.plank, { r: 1 }),
    ...[9, 15].map(h => B(32, h, 13.1, 56, 0.5, 0.4, LC.plankD, { r: 0.1, m: 'plain' })),
    ...[12, 52].map(x => B(x, 12, 13.2, 3, 20.4, 0.8, LC.iron, { r: 0.3, m: 'metal' })),
    PB(43, 21.4, 13.4, 14, 2.4, 1.2, 'red', { r: 0.4 }),
    B(32, 24, 0, 60, 4, 28, LC.plankD, { r: 1.2 }),
    ...[12, 52].flatMap(x => [B(x, 26.2, 0, 3, 0.4, 28.4, LC.iron, { r: 0.1, m: 'metal' }), B(x, 24, 14.2, 3, 4.2, 0.6, LC.iron, { r: 0.2, m: 'metal' })]),
    B(32, 19.6, 13.4, 6, 7, 0.8, LC.brass, { r: 0.6, m: 'metal' }),
    DS(32, 19, 13.9, 0.8, 0.3, LC.black, { m: 'plain' }),
  ]),

  // a standing mirror between two log posts on log feet
  piece('cabinmirror', 'Log-framed mirror', 1, 1, 550, 'wood', [
    ...[5, 27].flatMap(x => LOGZ(x, 2.2, -9, 9, 2.2)),
    ...[5, 27].flatMap(x => LOGY(x, 4.4, 60, 0, 2.6)),
    ...LOGX(2, 30, 57.6, 0.4, 2.2),
    ...LOGX(7.6, 24.4, 14, 0, 2, { ends: false }),
    B(16, 36, 0, 19.4, 42, 1.4, LC.mirror, { r: 0.3 }),
    PR(16, 36, 0.9, [[-7, -12], [-3.6, -12], [6, 14], [2.6, 14]], 0.3, '#f4fbff', { m: 'plain' }),
    PR(16, 36, 0.9, [[-7, 4], [-5.6, 4], [-1, 16], [-2.4, 16]], 0.3, '#f4fbff', { m: 'plain' }),
  ]),

  // three plank panels on log rails: a pine cut out of the middle one, a plaid band across the others
  piece('cabinscreen', 'Plank folding screen', 2, 1, 650, 'wood', [
    ...[[11, -2.4], [32, 2.4], [53, -2.4]].flatMap(([cx, z], i) => [
      ...[-9.4, 9.4].flatMap(dx => LOGY(cx + dx, 0, 58, z, 1.5, LC.logD)),
      ...[-1, 0, 1].map(k => B(cx + k * 5.8, 31, z, 5.6, 50, 1.6, (k + i) % 2 ? LC.plankL : LC.plank, { r: 0.5 })),
      ...[6, 57].map(h => B(cx, h, z, 19, 2.4, 2.4, LC.logD, { r: 0.8 })),
      ...(i === 1
        ? [PR(cx, 18, z + 1.2, [[-7, 0], [7, 0], [2.6, 7], [5.4, 7], [1.6, 14], [4, 14], [0, 22], [-4, 14], [-1.6, 14], [-5.4, 7], [-2.6, 7]], 0.6, LC.pine, { m: 'plain' }),
          B(cx, 16.6, z + 1.2, 2.4, 2.8, 0.6, LC.logD, { r: 0.3, m: 'plain' }),
          ...[[-5, 46], [4, 50], [-2, 42], [6, 43]].map(([dx, h]) => DS(cx + dx, h, z + 1.2, 0.9, 0.4, LC.snow, { m: 'plain' }))]
        : [PB(cx, 44, z + 1.1, 17.8, 4, 0.6, 'red', { r: 0.3 })]),
    ]),
  ]),

  // a carved Ursaring rearing on a log round, the ring on its belly in paler wood
  piece('cabinursaring', 'Carved Ursaring', 1, 1, 1400, 'wood', [
    C(16, 3, 0, 13, 6, LC.log), ...ringsUp(16, 6, 0, 13),
    ...[10, 22].flatMap(x => [S(x, 9, 2, 4, 3, 5, LC.carveD), S(x, 14, 0, 4.4, 6, 4.4, LC.carve)]),
    S(16, 27, 0, 10, 13, 8.5, LC.carve),
    RG(16, 27, 7.2, 4.6, 1.1, LC.carveL),
    DS(16, 27, 7.4, 3.4, 0.4, sh(LC.carve, -1), { m: 'plain' }),
    ...[[7, 4], [25, 28]].flatMap(([x, ex]) => [RD([x, 34, 1], [ex, 22, 5], 2.6, LC.carve), S(ex, 21, 5.6, 3, 2.6, 3, LC.carveD)]),
    ...[10, 22].flatMap(x => [S(x, 51, 0, 2.8, 2.8, 2, LC.carve), DS(x, 51, 1.8, 1.5, 0.3, LC.carveD, { m: 'plain' })]),
    S(16, 45, 1, 7.5, 6.8, 6.8, LC.carve),
    S(16, 43, 6.6, 3.6, 2.8, 2.6, LC.carveL),
    S(16, 44.2, 9, 1.2, 0.9, 0.8, LC.black, { m: 'gloss', seg: 8 }),
    ...[13, 19].map(x => DS(x, 47, 7.2, 0.9, 0.3, LC.black, { m: 'gloss' })),
  ]),

  // Teddiursa carved sitting on its stump, licking honey from a paw, the pot beside it
  piece('cabinteddiursa', 'Teddiursa stump carving', 1, 1, 900, 'wood', [
    LA(16, 0, 0, [[0, 0], [12.5, 0], [11, 2.5], [10, 6], [10, 16], [0, 16]], LC.logD, { seg: 14 }), ...ringsUp(16, 16, 0, 10),
    ...[12, 20].map(x => S(x, 18, 4.5, 2.6, 2, 3, LC.carve)),
    S(16, 23, 0, 6.5, 6.8, 6, LC.carve),
    S(16, 33.5, 0.5, 6.8, 6.2, 6, LC.carve),
    ...[10.8, 21.2].flatMap(x => [S(x, 38.6, 0, 2.4, 2.4, 1.8, LC.carve), DS(x, 38.6, 1.4, 1.3, 0.3, LC.carveL, { m: 'plain' })]),
    S(16, 32, 5.6, 3, 2.2, 1.8, LC.carveL),
    S(16, 32.8, 7.2, 0.9, 0.7, 0.6, LC.black, { m: 'gloss', seg: 8 }),
    ...[13.4, 18.6].map(x => DS(x, 34.6, 5.4, 0.8, 0.3, LC.black, { m: 'gloss' })),
    PR(16, 37, 5.8, [[-2.2, 0.8], [-1, -0.6], [1, -0.6], [2.2, 0.8], [1, 0.1], [-1, 0.1]], 0.5, LC.carveL, { m: 'plain' }),
    RD([11, 26, 2], [12.6, 29.6, 5], 1.8, LC.carve), S(12.8, 30, 5.6, 1.8, 1.8, 1.6, LC.carveL),
    RD([21, 26, 2], [21.6, 21.6, 5], 1.8, LC.carve),
    LA(23, 16.6, 6.2, [[0, 0], [2.6, 0], [3.2, 2], [2.6, 4], [2, 4.6], [0, 4.6]], LC.honey, { m: 'gloss', seg: 10 }),
  ]),

  // a braided rag rug, round and round in red, cream, green and brown
  { id: 'cabinbraidrug', name: 'Braided rag rug', w: 2, h: 2, layer: 'rug', price: 500, high: 0.04, side: 'c', flat() {
    const g = ctx(), [cx, cy, rx, ry] = RUGS.cabinbraidrug[0], bands = [LC.logD, LC.red, LC.cream, LC.green, LC.wool, LC.red, LC.logL, LC.green, LC.cream, LC.red];
    bands.forEach((c, i) => {
      const k = i * 2.6;
      if (rx - k <= 1) return;
      oval(cx, cy, rx - k, ry - k, c);
      g.save(); g.setLineDash([1.4, 1.2]); g.strokeStyle = sh(c, -2); g.globalAlpha *= 0.6; g.lineWidth = 0.6;
      g.beginPath(); g.ellipse(cx, cy, rx - k - 1.3, ry - k - 1.3, 0, 0, TAU); g.stroke(); g.restore();
    });
    oval(cx, cy, 3, 2, LC.red);
  } },

  // a buffalo-check rug, fringed at both ends
  { id: 'cabinplaidrug', name: 'Buffalo-check rug', w: 3, h: 2, layer: 'rug', price: 650, high: 0.04, side: 'c', flat(w, h) {
    const g = ctx();
    R(4, 1, w - 8, h - 2, PLAIDS.red.base);
    g.fillStyle = PLAIDS.red.band;
    for (let x = 4; x < w - 4; x += 16) g.fillRect(x, 1, 8, h - 2);
    for (let y = 1; y < h - 1; y += 16) g.fillRect(4, y, w - 8, 8);
    g.strokeStyle = LC.black; g.lineWidth = 1.2; g.strokeRect(4.6, 1.6, w - 9.2, h - 3.2);
    g.strokeStyle = LC.cream; g.lineWidth = 0.6;
    for (let y = 2.5; y < h - 2; y += 2) for (const [x0, x1] of [[0.6, 4], [w - 4, w - 0.6]]) { g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke(); }
  } },

  // a carved Stantler head on a log-round plaque, its wooden antlers curling, their orbs dark
  wallPiece('cabinantlers', 'Stantler antler mount', 2, 800, 'wood', [
    PR(32, 60, 0.8, [[-11, 12], [11, 12], [12, -1], [0, -14], [-12, -1]], 1.6, LC.plankD),
    DS(32, 60, 2.2, 8.5, 1.2, LC.log), DS(32, 60, 2.9, 8, 0.3, LC.end, { m: 'plain' }),
    DS(32, 60, 3.1, 5.6, 0.2, LC.ring, { m: 'plain' }), DS(32, 60, 3.3, 3.4, 0.2, LC.end, { m: 'plain' }),
    ...[-1, 1].flatMap(s => {
      const X = (dx) => 32 + s * dx;
      return [
        RD([X(3), 64, 5], [X(8), 70, 5], 1.4, LC.antler), RD([X(8), 70, 5], [X(15), 73, 4.5], 1.3, LC.antler),
        RD([X(15), 73, 4.5], [X(20), 79, 4], 1.2, LC.antler), RD([X(20), 79, 4], [X(19), 86, 4], 1.1, LC.antler),
        RD([X(19), 86, 4], [X(15), 88, 4], 1, LC.antler), RD([X(8), 70, 5], [X(8), 78, 4.6], 1, LC.antler),
        RD([X(15), 73, 4.5], [X(26), 75, 4], 1, LC.antler),
        S(X(15), 73, 5, 2.3, 2.3, 2, LC.orb, { m: 'gloss', seg: 10 }),
        S(X(8), 78.4, 4.6, 1.6, 1.6, 1.4, LC.orb, { m: 'gloss', seg: 8 }),
        S(X(6.5), 63.5, 4, 2.8, 1.4, 1.2, LC.carve),
      ];
    }),
    S(32, 60, 5.4, 5, 5.6, 3.6, LC.carve),
    S(32, 56, 7.6, 3, 3, 2.4, LC.carveL),
    S(32, 55.4, 9.8, 1.3, 1, 0.8, LC.black, { m: 'gloss', seg: 8 }),
    ...[29.6, 34.4].map(x => DS(x, 61.6, 8.4, 0.8, 0.3, LC.black, { m: 'gloss' })),
  ]),

  // a cuckoo clock under a snowy roof, Pidgey at its little door, pinecone weights on chains
  wallPiece('cabincuckoo', 'Pidgey cuckoo clock', 1, 600, 'wood', [
    B(16, 47.4, 3.2, 20, 1.4, 6.6, LC.plankD, { r: 0.4 }),
    B(16, 58, 3, 18, 20, 6, LC.plank, { r: 0.6 }),
    PR(16, 68, 3, [[-9, 0], [9, 0], [0, 7.4]], 5.6, LC.plank),
    PR(16, 68, 3.4, [[-13, -3], [0, 8], [13, -3], [13, -1], [0, 10.2], [-13, -1]], 7.6, LC.plankD),
    PR(16, 68, 3.4, [[-13, -1], [0, 10.2], [13, -1], [13, 0.4], [0, 11.6], [-13, 0.4]], 7.8, LC.snow, { m: 'plain' }),
    B(16, 71.4, 6.2, 3.8, 3.8, 0.4, LC.black, { r: 0.6, m: 'plain' }),
    S(16, 71.6, 6.8, 2, 1.9, 1.6, LC.pidgey), S(16, 71.2, 8, 1.3, 1.1, 0.7, LC.pidgeyL, { seg: 8 }),
    S(16, 70.8, 8.6, 0.5, 0.4, 0.6, LC.black, { m: 'plain', seg: 6 }),
    DS(16, 57, 6.3, 6, 0.6, LC.cream, { m: 'plain' }),
    PC(16, 57, 6.7, 11, 11, dial),
    ...[[8, 49, -1], [24, 49, 1]].map(([x, h, s]) => S(x, h, 6.4, 2.2, 1.2, 0.8, LC.pine, { m: 'plain', seg: 8 })),
    RD([16, 46.6, 4], [16, 37, 4], 0.35, LC.brass, { m: 'metal' }), DS(16, 36, 4.4, 2.4, 0.5, LC.brass, { m: 'metal' }),
    RD([12, 46.6, 2.4], [12, 30.4, 2.4], 0.25, LC.iron, { m: 'metal' }),
    LA(12, 24, 2.4, [[0, 0], [1.3, 1], [1.6, 3.4], [1.2, 5.6], [0, 6.4]], LC.logD, { seg: 8 }),
    RD([20, 46.6, 2.4], [20, 38.4, 2.4], 0.25, LC.iron, { m: 'metal' }),
    LA(20, 32, 2.4, [[0, 0], [1.3, 1], [1.6, 3.4], [1.2, 5.6], [0, 6.4]], LC.logD, { seg: 8 }),
  ]),

  // two wooden snowshoes crossed on a peg, tied with a scrap of buffalo check
  wallPiece('cabinsnowshoes', 'Crossed snowshoes', 1, 300, 'wood', (() => {
    const shoe = (rot, z) => {
      const at = (lx, lh) => [16 + lx * Math.cos(rot) - lh * Math.sin(rot), 56 + lx * Math.sin(rot) + lh * Math.cos(rot)];
      const [tx, th] = at(0, -13.4), [ex, eh] = at(0, -20);
      return [
        DS(16, 56, z, 5.6, 0.8, LC.logL, { ry: 14, rot, m: 'wood' }),
        DS(16, 56, z + 0.5, 4.5, 0.4, LC.webbing, { ry: 12.6, rot, m: 'plain' }),
        RD([tx, th, z], [ex, eh, z], 1, LC.logL),
        ...[[0, 4.6], [0, -3.6]].map(([lx, lh]) => { const [x, h] = at(lx, lh); return B(x, h, z + 0.8, 9, 0.8, 0.6, LC.logL, { r: 0.3, rot }); }),
        (() => { const [x, h] = at(0, 0.6); return B(x, h, z + 1.1, 5, 3, 0.8, LC.leather, { r: 0.6, rot, m: 'plain' }); })(),
      ];
    };
    return [
      RD([16, 66, 0], [16, 66, 5], 0.8, LC.logD),
      ...shoe(0.45, 1.2), ...shoe(-0.45, 3.4),
      PB(16, 57, 5.4, 4, 5, 1, 'red', { r: 0.4 }),
    ];
  })()),
].map(f => ({ group: GROUP, solo: true, ...f }));
