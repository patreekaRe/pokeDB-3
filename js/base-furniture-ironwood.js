/* base-furniture-ironwood.js  -  the Ironwood set (furniture expansion session d, 2026-10-17): an industrial workshop
   loft. Black iron pipe and flat steel with rivets and corner brackets, warm reclaimed oak planks, Edison bulbs with
   amber filaments, a little copper and worn leather. All solo, fixed colours.
   As in js/base-furniture-partner.js, an upright piece is a list of parts in painted units (32 a tile): `x` across from
   the left of its front, `h` up from the floor (a wall piece's from the foot of its strip), `z` out to the front from its
   middle (a wall piece's from the wall). They're painted here from any side, and js/base-models-ironwood.js builds the
   same list (BUILT), so picture and model agree; a door's parts swing there. A `pic` part (a dial, a pegboard) is
   painted on the front only and the model wears that crop of the painting. The rug is painted from above. */

import { sh, oval, ovalShade, floorShadow, ctx, R, hash } from './base-paint.js';

export const IW = {
  iron: '#34363c', ironD: '#232429', ironL: '#4d5058', steel: '#7d848d', steelL: '#aab2ba', rivet: '#62666f',
  oak: '#a8743f', oakL: '#bf8a52', oakW: '#9a6a3c', oakD: '#86572f', oakDD: '#5e3d22',
  copper: '#c27444', brass: '#c9a048', leather: '#7e4426', leatherL: '#9a5a34', leatherD: '#5c301b',
  amber: '#ffb347', bulb: '#ffd98a', fire: '#ff8a30', linen: '#ece4d2', ticking: '#d8d0bc', wool: '#4e545c',
  rust: '#9a3b2a', dial: '#f2ead6', ink: '#1e1e22', locker: '#55606a', lockerD: '#48525b', chest: '#9a3a2a',
  chestL: '#ad4632', vise: '#4a6670', board: '#b8956a', mirror: '#d6e2e8', yellow: '#d8a530', green: '#5f8a4a', glassJar: '#d8ecf0',
};
const GROUP = 'Ironwood';
const TAU = Math.PI * 2;

/* ---------- parts ---------- */
/** A rounded box centred at x, h, z. */
const B = (x, h, z, w, hh, d, c, o) => ({ t: 'box', x, h, z, w, hh, d, c, r: 1.5, ...o });
/** An upright cylinder centred at h (`rb` its bottom radius). */
const C = (x, h, z, r, hh, c, o) => ({ t: 'cyl', x, h, z, r, hh, c, ...o });
/** A ball rx x ry x rz. */
const S = (x, h, z, rx, ry, rz, c, o) => ({ t: 'ball', x, h, z, rx, ry, rz, c, ...o });
/** A rod from a to b, each [x, h, z]. */
const RD = (a, b, r, c, o) => ({ t: 'rod', a, b, r, c, x: (a[0] + b[0]) / 2, h: (a[1] + b[1]) / 2, z: (a[2] + b[2]) / 2, ...o });
/** A flat outline [[dx, dh]...] about x, h, d deep. */
const PR = (x, h, z, pts, d, c, o) => ({ t: 'prism', x, h, z, pts, d, c, ...o });
/** A lathe standing on h, its profile [[r, up]...]. */
const LA = (x, h, z, pts, c, o) => ({ t: 'lathe', x, h, z, pts, c, ...o });
/** A disc facing the front, th thick. */
const DS = (x, h, z, r, th, c, o) => ({ t: 'disc', x, h, z, r, th, c, ...o });
/** A ring r round of a tube tr thick, facing the front (`flat` lies it down). */
const RG = (x, h, z, r, tr, c, o) => ({ t: 'ring', x, h, z, r, tr, c, ...o });
/** A picture on a front face, w x hh centred at x, h: `fn(g, left, top, w, hh)` paints it. */
const PC = (x, h, z, w, hh, fn, o) => ({ t: 'pic', x, h, z, w, hh, fn, ...o });

const PLANK = [IW.oak, IW.oakL, IW.oakW, IW.oakD];
/** n oak planks filling a w x hh x d board centred x, h, z, a gap between each: `along` 'h' rows up a face, 'z' boards
    front to back, 'x' boards side by side; `s` shifts which tone comes first. */
function planks(x, h, z, w, hh, d, n, along, s = 0, o = {}) {
  const out = [], gap = 0.5;
  for (let i = 0; i < n; i++) {
    const c = PLANK[(i + s) % PLANK.length], q = { r: 0.5, m: 'wood', ...o };
    if (along === 'h') { const ph = (hh - gap * (n - 1)) / n; out.push(B(x, h - hh / 2 + ph / 2 + i * (ph + gap), z, w, ph, d, c, q)); }
    else if (along === 'z') { const pd = (d - gap * (n - 1)) / n; out.push(B(x, h, z - d / 2 + pd / 2 + i * (pd + gap), w, hh, pd, c, q)); }
    else { const pw = (w - gap * (n - 1)) / n; out.push(B(x - w / 2 + pw / 2 + i * (pw + gap), h, z, pw, hh, d, c, q)); }
  }
  return out;
}
/** A black iron pipe from a to b. */
const pipe = (a, b, r = 1.5, c = IW.iron) => RD(a, b, r, c, { m: 'metal' });
/** A floor flange under a pipe standing at x, z. */
const flange = (x, h, z, r = 3) => C(x, h + 0.5, z, r, 1, IW.ironD, { m: 'metal', seg: 10 });
/** An elbow or tee fitting. */
const joint = (x, h, z, r = 2.1) => S(x, h, z, r, r, r, IW.ironD, { m: 'metal', seg: 8 });
/** A collar round an upright pipe. */
const collar = (x, h, z, r = 2.2, c = IW.ironD) => C(x, h, z, r, 1.4, c, { m: 'metal', seg: 10 });
/** A rivet on a front face at z. */
const rivet = (x, h, z, r = 0.7) => DS(x, h, z, r, 0.6, IW.rivet, { m: 'metal', seg: 6 });
const rivets = (pts, z, r) => pts.map(([x, h]) => rivet(x, h, z, r));
/** A flat steel strip (sharp edged). */
const flat = (x, h, z, w, hh, d, c = IW.iron) => B(x, h, z, w, hh, d, c, { r: 0, m: 'metal' });
/** A corner bracket on a front face: a steel triangle s across, its right angle at x, h, opening towards sx, sh. */
const bracket = (x, h, z, s, sx = 1, sy = 1) => PR(x, h, z, [[0, 0], [sx * s, 0], [0, sy * s]], 0.6, IW.ironL, { m: 'metal' });
/** An Edison bulb hanging from its cap at h: brass cap, amber glass, a glowing filament. */
const bulb = (x, h, z, s = 1) => [
  C(x, h - 1.2 * s, z, 1.4 * s, 2.4 * s, IW.brass, { m: 'metal', seg: 8 }),
  LA(x, h - 9.4 * s, z, [[0, 0], [1.6 * s, 0.4 * s], [2.9 * s, 2.2 * s], [3 * s, 4 * s], [2.2 * s, 5.8 * s], [1.3 * s, 7 * s]], IW.bulb, { m: 'glass', seg: 10 }),
  RD([x - 1.1 * s, h - 3 * s, z], [x - 0.6 * s, h - 6.6 * s, z], 0.3 * s, IW.amber, { m: 'glow' }),
  RD([x + 1.1 * s, h - 3 * s, z], [x + 0.6 * s, h - 6.6 * s, z], 0.3 * s, IW.amber, { m: 'glow' }),
  S(x, h - 5.4 * s, z, 1.3 * s, 1.7 * s, 1.3 * s, IW.amber, { m: 'glow', seg: 8 }),
];
/** A wire cage from h down hh round a bulb. */
const cage = (x, h, z, r, hh) => [
  RG(x, h - 0.8, z, r * 0.7, 0.35, IW.iron, { m: 'metal', flat: true }),
  RG(x, h - hh * 0.55, z, r, 0.35, IW.iron, { m: 'metal', flat: true }),
  ...[0, 1, 2, 3].map(i => { const a = (i + 0.5) * TAU / 4, dx = Math.cos(a), dz = Math.sin(a); return RD([x + dx * r * 0.7, h - 0.8, z + dz * r * 0.7], [x + dx * r, h - hh * 0.55, z + dz * r], 0.3, IW.iron, { m: 'metal' }); }),
  ...[0, 1, 2, 3].map(i => { const a = (i + 0.5) * TAU / 4, dx = Math.cos(a), dz = Math.sin(a); return RD([x + dx * r, h - hh * 0.55, z + dz * r], [x + dx * r * 0.3, h - hh, z + dz * r * 0.3], 0.3, IW.iron, { m: 'metal' }); }),
  S(x, h - hh, z, 0.9, 0.9, 0.9, IW.iron, { m: 'metal', seg: 6 }),
];
/** A gear's outline r round, n teeth `tooth` deep. */
const gear = (r, n, tooth = 2.2) => Array.from({ length: n * 4 }, (_, i) => {
  const a = (i + 0.5) / (n * 4) * TAU, rr = i % 4 === 1 || i % 4 === 2 ? r : r - tooth;
  return [Math.cos(a) * rr, Math.sin(a) * rr];
});
/** A slatted crate standing on h, its open slats facing the front. */
const crate = (x, h, z, w, hh, d, s = 0) => [
  B(x, h + hh / 2, z, w - 1, hh - 0.4, d - 1, IW.oakD, { r: 0.4, m: 'wood' }),
  ...planks(x, h + hh / 2, z + d / 2 - 0.6, w - 1.6, hh - 1, 1.2, 2, 'h', s),
  ...[x - w / 2 + 1, x + w / 2 - 1].map(px => B(px, h + hh / 2, z + d / 2 - 0.4, 2, hh, 1.6, IW.oakDD, { r: 0.3, m: 'wood' })),
];
/** A row of books standing on h from x0. */
const BOOKS = [IW.leather, IW.green, IW.rust, '#3e4a5c', IW.leatherL, IW.oakDD];
const books = (x0, h, z, n, s = 0) => Array.from({ length: n }, (_, i) => {
  const hh = 9 + ((i * 7 + s) % 4), w = 2.4 + ((i + s) % 2) * 0.6;
  return B(x0 + i * 3.4, h + hh / 2, z, w, hh, 7, BOOKS[(i + s) % BOOKS.length], { r: 0.4, m: 'plain' });
});
/** A copper pot standing on h. */
const pot = (x, h, z, r, hh) => [
  LA(x, h, z, [[0, 0], [r * 0.9, 0], [r, hh * 0.2], [r, hh], [r * 1.08, hh * 1.05], [0, hh * 1.05]], IW.copper, { m: 'metal', seg: 12 }),
  RD([x - r, h + hh * 0.8, z], [x - r - 2.4, h + hh * 0.9, z], 0.5, IW.ironD, { m: 'metal' }),
];
/** A caster wheel at x, z under a piece whose base sits at h. */
const caster = (x, h, z) => [
  B(x, h - 0.8, z, 2.4, 1.6, 2.4, IW.ironL, { r: 0.3, m: 'metal' }),
  DS(x, 1.6, z, 1.6, 1.2, IW.ironD, { m: 'metal', seg: 8 }),
];

/* ---------- painting the parts ---------- */

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
  if (m === 'glass') { g.save(); g.globalAlpha *= 0.45; g.fillStyle = c; g.fillRect(x, y, w, h); g.restore(); return; }
  g.fillStyle = grad(g, x, y, x + w * 0.3, y + h, c, m); g.beginPath(); g.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); g.fill();
  if (h > 3 && w > 3) { g.save(); g.globalAlpha *= 0.5; g.fillStyle = sh(c, 2); g.fillRect(x + Math.min(r, w / 2) * 0.6, y + 0.3, w - Math.min(r, w / 2) * 1.2, 0.6); g.restore(); }
}
function poly(pts, c, m, horiz) {
  const g = ctx(), xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  if (m === 'glass') { g.save(); g.globalAlpha *= 0.5; g.fillStyle = c; }
  else if (horiz) {
    const l = g.createLinearGradient(x0, 0, x1, 0);
    l.addColorStop(0, sh(c, -1)); l.addColorStop(0.3, sh(c, 1)); l.addColorStop(0.55, c); l.addColorStop(1, sh(c, -2));
    g.fillStyle = l;
  } else g.fillStyle = grad(g, x0, y0, x1, y1, c, m);
  g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill();
  if (m === 'glass') g.restore();
}
function ball(cx, cy, rx, ry, c, m) {
  const g = ctx();
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
    const m = q.m || 'metal', cx = U(q.x, q.z), cy = b - q.h;
    switch (q.t) {
      case 'box': { const w = side ? q.d : q.w; rbx(cx - w / 2, cy - q.hh / 2, w, q.hh, q.r, q.c, m); break; }
      case 'cyl': {
        const rb = q.rb ?? q.r, top = cy - q.hh / 2, bot = cy + q.hh / 2;
        poly([[cx - q.r, top], [cx + q.r, top], [cx + rb, bot], [cx - rb, bot]], q.c, m, m !== 'glow');
        if (m !== 'glass') oval(cx, top, q.r, Math.min(q.r * 0.22, Math.max(0.3, q.hh / 2)), sh(q.c, m === 'glow' ? 2 : 1));
        break;
      }
      case 'ball': ball(cx, cy, side ? q.rz : q.rx, q.ry, q.c, m); break;
      case 'disc': if (side) rbx(cx - q.th / 2, cy - q.r, q.th, q.r * 2, q.th / 2, q.c, m); else ball(cx, cy, q.r, q.r, q.c, m); break;
      case 'lathe': {
        const pts = q.pts.map(([r, up]) => [r, cy - up]);
        poly([...pts.map(([r, y]) => [cx - r, y]), ...pts.slice().reverse().map(([r, y]) => [cx + r, y])], q.c, m, true);
        if (m === 'glass' || (q.pts[q.pts.length - 1][0] < 0.01 && q.pts.length > 2)) break;
        const [rt, ut] = q.pts[q.pts.length - 1];
        oval(cx, cy - ut, rt, rt * 0.22, sh(q.c, -2));
        break;
      }
      case 'ring': {
        if (side && !q.flat) { rbx(cx - q.tr, cy - q.r - q.tr, q.tr * 2, (q.r + q.tr) * 2, q.tr, q.c, m); break; }
        g.strokeStyle = q.c; g.lineWidth = q.tr * 2; g.beginPath();
        if (q.flat) g.ellipse(cx, cy, q.r, q.r * 0.22, 0, 0, TAU); else g.arc(cx, cy, q.r, 0, TAU);
        g.stroke();
        g.save(); g.globalAlpha *= 0.45; g.strokeStyle = sh(q.c, 2); g.lineWidth = q.tr * 0.6; g.beginPath();
        if (q.flat) g.ellipse(cx, cy - q.tr * 0.4, q.r, q.r * 0.22, 0, Math.PI, TAU); else g.arc(cx, cy, q.r, Math.PI * 1.1, Math.PI * 1.6);
        g.stroke(); g.restore();
        break;
      }
      case 'rod': {
        const p0 = [U(q.a[0], q.a[2]), b - q.a[1]], p1 = [U(q.b[0], q.b[2]), b - q.b[1]];
        g.lineCap = 'round'; g.strokeStyle = q.c; g.lineWidth = q.r * 2;
        g.beginPath(); g.moveTo(...p0); g.lineTo(...p1); g.stroke();
        if (q.r > 0.6) {
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
        poly(q.pts.map(([px, ph]) => [U(q.x + px), b - q.h - ph]), q.c, m);
        break;
      }
      case 'pic': g.save(); g.beginPath(); g.rect(cx - q.w / 2, cy - q.hh / 2, q.w, q.hh); g.clip(); q.fn(g, cx - q.w / 2, cy - q.hh / 2, q.w, q.hh); g.restore(); break;
    }
  }
}

/* ---------- pictures ---------- */

/** A clock face filling the circle in w x h: ticks, the four quarters, hands at ten past ten. */
function dial(g, x, y, w, h) {
  const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2;
  g.fillStyle = IW.dial; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill();
  g.strokeStyle = IW.ink; g.lineCap = 'butt';
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * TAU, big = i % 3 === 0, r0 = r * (big ? 0.68 : 0.78);
    g.lineWidth = big ? r * 0.1 : r * 0.05;
    g.beginPath(); g.moveTo(cx + Math.sin(a) * r0, cy - Math.cos(a) * r0); g.lineTo(cx + Math.sin(a) * r * 0.9, cy - Math.cos(a) * r * 0.9); g.stroke();
  }
  g.lineCap = 'round';
  g.lineWidth = r * 0.1; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.sin(-1.05) * r * 0.48, cy - Math.cos(-1.05) * r * 0.48); g.stroke();
  g.lineWidth = r * 0.07; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.sin(1.05) * r * 0.7, cy - Math.cos(1.05) * r * 0.7); g.stroke();
  g.strokeStyle = IW.rust; g.lineWidth = r * 0.03; g.beginPath(); g.moveTo(cx, cy + r * 0.15); g.lineTo(cx, cy - r * 0.78); g.stroke();
  g.fillStyle = IW.ink; g.beginPath(); g.arc(cx, cy, r * 0.07, 0, TAU); g.fill();
}
/** A locker's number plate. */
const plate = (n) => (g, x, y, w, h) => {
  g.fillStyle = IW.brass; g.fillRect(x, y, w, h);
  g.font = `bold ${h * 0.8}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = IW.ink;
  g.fillText(n, x + w / 2, y + h / 2 + 0.2, w - 0.6);
};

/* ---------- the kinds ---------- */

/** What js/base-models-ironwood.js builds for each upright and wall kind: its parts, doors and default material. */
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

export const IRONWOOD_KINDS = [
  // an iron pipe bed, its head and footboards reclaimed oak, a wool blanket with a rust stripe
  piece('iwbed', 'Ironworks plank bed', 2, 2, 1300, 'metal', [
    ...[3, 61].flatMap(x => [
      pipe([x, 0, -29], [x, 46, -29], 1.8), flange(x, 0, -29), joint(x, 46.4, -29, 2.4),
      pipe([x, 0, 29], [x, 30, 29], 1.8), flange(x, 0, 29), joint(x, 30.4, 29, 2.4),
      flat(x, 10, 0, 2.6, 4, 56, IW.ironL),
    ]),
    ...planks(32, 33, -29, 55, 22, 2, 4, 'h'),
    pipe([3, 45, -29], [61, 45, -29], 1.3),
    ...planks(32, 20, 29, 55, 15, 2, 3, 'h', 1),
    pipe([3, 29, 29], [61, 29, 29], 1.3),
    ...rivets([[8, 14.8], [56, 14.8], [8, 20], [56, 20], [8, 25.2], [56, 25.2]], 30.2),
    bracket(4.8, 12.5, 30.1, 4), bracket(59.2, 12.5, 30.1, 4, -1),
    B(32, 15, 0, 55, 8, 56, IW.ticking, { r: 3, m: 'cloth' }),
    B(32, 19, -21, 40, 5.6, 12, IW.linen, { r: 2.6, m: 'cloth' }),
    B(32, 17, 7, 56.6, 5, 42, IW.wool, { r: 2, m: 'cloth' }),
    B(32, 17.1, 21, 56.8, 5.2, 3.4, IW.rust, { r: 1.2, m: 'cloth' }),
    B(32, 19.5, -13.4, 56.8, 1.4, 4, sh(IW.wool, 1), { r: 0.6, m: 'cloth' }),
  ]),

  // a plank seat and back on iron pipe legs, riveted, a worn leather pad
  piece('iwchair', 'Riveted iron chair', 1, 1, 300, 'metal', [
    ...[7, 25].flatMap(x => [
      pipe([x, 0, 9], [x, 15, 9], 1.5), flange(x, 0, 9, 2.4),
      pipe([x, 0, -10], [x, 42, -10], 1.5), flange(x, 0, -10, 2.4), joint(x, 42.4, -10, 2),
      pipe([x, 6, 9], [x, 6, -10], 1),
    ]),
    pipe([7, 6, 9], [25, 6, 9], 1),
    flat(16, 14.4, 0, 22, 1.2, 20),
    ...planks(16, 16, 0, 24, 2.2, 22, 3, 'z'),
    B(16, 17.8, 1, 20, 1.6, 18, IW.leather, { r: 0.8, m: 'plain' }),
    ...planks(16, 33, -10.6, 20, 14, 1.4, 2, 'h', 1),
    ...rivets([[9.5, 29.6], [22.5, 29.6], [9.5, 36.4], [22.5, 36.4]], -9.7),
  ]),

  // a round oak seat on a steel screw, four splayed legs and a foot ring
  piece('iwstool', 'Adjustable shop stool', 1, 1, 220, 'metal', [
    ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].flatMap(([sx, sz]) => [
      RD([16 + sx * 2.4, 14, sz * 2.4], [16 + sx * 10.5, 0.9, sz * 10.5], 1.1, IW.iron, { m: 'metal' }),
      S(16 + sx * 10.5, 0.9, sz * 10.5, 1.6, 0.9, 1.6, IW.ironD, { m: 'metal', seg: 6 }),
    ]),
    RG(16, 7, 0, 7.7, 0.6, IW.iron, { m: 'metal', flat: true }),
    C(16, 14, 0, 3.4, 3, IW.ironD, { m: 'metal', seg: 10 }),
    C(16, 19.5, 0, 1.4, 9, IW.steel, { m: 'metal', seg: 8 }),
    ...[16.5, 18.5, 20.5, 22.5].map(h => C(16, h, 0, 1.8, 0.5, IW.steelL, { m: 'metal', seg: 8 })),
    C(16, 24.6, 0, 4, 1.2, IW.iron, { m: 'metal', seg: 10 }),
    C(16, 26.5, 0, 10.5, 2.6, IW.oak, { m: 'wood' }),
    C(16, 26.5, 0, 10.8, 1, IW.oakD, { m: 'wood' }),
  ]),

  // tufted leather on an angle-iron frame, riveted iron arms with leather tops
  piece('iwsofa', 'Leather loft sofa', 2, 1, 950, 'plain', [
    ...[5, 59].flatMap(x => [-11, 11].flatMap(z => [pipe([x, 0, z], [x, 6.5, z], 1.6), flange(x, 0, z, 2.6)])),
    B(32, 8, 0, 60, 3, 28, IW.iron, { r: 0.3, m: 'metal' }),
    ...[4.5, 59.5].flatMap(x => [
      B(x, 14, 0, 8, 12, 30, IW.iron, { r: 0.6, m: 'metal' }),
      B(x, 22.5, 0, 9, 5, 30, IW.leatherL, { r: 2.2 }),
      ...rivets([[x - 2.2, 10.5], [x + 2.2, 10.5], [x - 2.2, 17.5], [x + 2.2, 17.5]], 15.3),
    ]),
    B(32, 25, -10, 46, 18, 8, IW.leather, { r: 3 }),
    B(20.6, 13.5, 2, 22.6, 8, 24, IW.leather, { r: 3 }),
    B(43.4, 13.5, 2, 22.6, 8, 24, IW.leather, { r: 3 }),
    ...[22, 29].flatMap(h => [16, 26, 38, 48].map(x => DS(x, h, -5.8, 0.8, 0.6, IW.leatherD, { seg: 6 }))),
  ]),

  // four oak planks on black pipe legs with floor flanges
  piece('iwtable', 'Pipe-leg plank table', 2, 1, 750, 'wood', [
    ...[5, 59].flatMap(x => [
      ...[-11, 11].flatMap(z => [pipe([x, 0, z], [x, 22.4, z], 1.6), flange(x, 0, z), C(x, 22.9, z, 3, 1, IW.ironD, { m: 'metal', seg: 10 })]),
      pipe([x, 6, -11], [x, 6, 11], 1.2), joint(x, 6, 0, 2),
    ]),
    pipe([5, 6, 0], [59, 6, 0], 1.2),
    flat(32, 22.5, 0, 52, 2.2, 22),
    ...planks(32, 25, 0, 62, 2.6, 30, 4, 'z'),
  ]),

  // an oak top on pipe legs and a riveted steel drawer cabinet, a leather desk mat
  piece('iwdesk', 'Pipe-leg workshop desk', 2, 1, 800, 'wood', [
    ...[-11, 11].flatMap(z => [pipe([5, 0, z], [5, 26.2, z], 1.6), flange(5, 0, z)]),
    pipe([5, 6, -11], [5, 6, 11], 1.2), pipe([5, 6, -11], [39, 6, -11], 1.2), joint(5, 6, -11, 2),
    B(50, 13.5, 0, 22, 25, 26, IW.ironL, { r: 0.6, m: 'metal' }),
    ...[[42, -10], [58, -10], [42, 10], [58, 10]].map(([x, z]) => B(x, 0.6, z, 3, 1.2, 3, IW.ironD, { r: 0.3, m: 'metal' })),
    ...[[50, 19.5], [50, 8]].flatMap(([x, h]) => [
      B(x, h, 13.3, 19, 9.6, 0.8, IW.iron, { r: 0.4, m: 'metal' }),
      B(x, h - 1, 14, 6, 1.4, 1.2, IW.copper, { r: 0.5, m: 'metal' }),
      B(x, h + 2.6, 13.9, 5, 2, 0.4, IW.brass, { r: 0.2, m: 'metal' }),
    ]),
    ...rivets([[41, 24.5], [59, 24.5], [41, 2.5], [59, 2.5]], 13.2),
    ...planks(32, 27.5, 0, 62, 2.4, 28, 3, 'z'),
    B(26, 29, 2, 24, 0.5, 15, IW.leatherD, { r: 0.3, m: 'plain' }),
    LA(10, 28.7, -6, [[0, 0], [2, 0], [2.1, 5], [0, 5]], IW.copper, { m: 'metal', seg: 10 }),
    RD([9.5, 29.5, -6], [9, 36, -5.4], 0.4, IW.yellow, { m: 'plain' }),
    RD([10.6, 29.5, -6], [11.4, 35, -6.6], 0.4, IW.rust, { m: 'plain' }),
  ]),

  // two tall steel lockers side by side: vents, number plates, lever handles, rivets
  piece('iwlocker', 'Riveted locker wardrobe', 2, 1, 1000, 'metal', [
    B(32, 1.5, 0, 58, 3, 26, IW.ironD, { r: 0.4 }),
    B(32, 39.5, -2, 60, 73, 27, IW.lockerD, { r: 0.6 }),
    B(32, 76.9, -1.5, 62, 1.8, 29, IW.ironD, { r: 0.5 }),
    flat(32, 39.5, 12.2, 1.2, 70, 1.2, IW.ironD),
  ], {
    doors: [[17, 3.25, 1, '01', 28], [47, 60.75, -1, '02', 36]].map(([x, hinge, side, n, hx]) => ({ hinge: [hinge, 12], side, parts: [
      B(x, 39.5, 12.75, 27.4, 70, 1.5, IW.locker, { r: 0.5 }),
      ...[0, 1, 2, 3, 4].map(i => flat(x, 68 - i * 2.4, 13.6, 14, 0.9, 0.3, IW.ink)),
      ...[0, 1, 2].map(i => flat(x, 12 - i * 2.4, 13.6, 14, 0.9, 0.3, IW.ink)),
      B(x, 56, 13.7, 7.4, 4, 0.4, IW.brass, { r: 0.3 }),
      PC(x, 56, 13.95, 7, 3.6, plate(n)),
      B(hx, 40, 14, 1.6, 8, 1.4, IW.steelL, { r: 0.5 }),
      ...rivets([[x - 11.5, 72.5], [x + 11.5, 72.5], [x - 11.5, 6.5], [x + 11.5, 6.5]], 13.6),
    ] })),
    inside: { x: 32, h: 39.5, w: 56, hh: 68, z: 11.5 },
  }),

  // six oak drawers in a black iron frame, ring pulls, a plank top
  piece('iwdresser', 'Plank-and-iron dresser', 2, 1, 700, 'wood', [
    ...[3, 61].flatMap(x => [-11, 11].map(z => B(x, 15.5, z, 3, 31, 3, IW.iron, { r: 0.4, m: 'metal' }))),
    B(32, 17, -1, 56, 26, 22, IW.oakDD, { r: 0.5 }),
    flat(32, 3, 11, 58, 2, 1),
    ...[18, 46].flatMap((x, c) => [8.5, 17, 25.5].flatMap((h, i) => [
      B(x, h, 10.4, 26.5, 7.8, 1.6, PLANK[(i + c * 2) % 4], { r: 0.5 }),
      B(x, h, 11.6, 6, 1.2, 1, IW.iron, { r: 0.3, m: 'metal' }),
    ])),
    ...rivets([[3, 6], [61, 6], [3, 16], [61, 16], [3, 26], [61, 26]], 12.8),
    ...planks(32, 32.3, 0, 64, 2.6, 28, 3, 'z'),
  ]),

  // pipe uprights and oak shelves, crates, a kettle, books and a fern in a tin
  piece('iwpipeshelf', 'Pipe shelf with crates', 2, 1, 850, 'wood', [
    ...[4, 60].flatMap(x => [-11, 11].flatMap(z => [
      pipe([x, 0, z], [x, 77, z], 1.5), flange(x, 0, z, 2.6), joint(x, 77.4, z, 1.9),
      ...[26.3, 50.3, 74.3].map(h => collar(x, h, z)),
    ])),
    ...[3, 27, 51, 75].flatMap((h, i) => planks(32, h, 0, 62, 2.2, 26, 2, 'z', i)),
    ...crate(17, 4.1, 0, 22, 16, 20), ...crate(45, 4.1, 0, 22, 16, 20, 1),
    ...crate(17, 28.1, 0, 22, 13, 20, 2),
    ...pot(46, 28.1, 2, 5, 8),
    ...books(30, 52.1, 0, 6, 1),
    LA(12, 52.1, 0, [[0, 0], [3.6, 0], [3.6, 6], [0, 6]], IW.steel, { m: 'metal', seg: 10 }),
    ...[[-2, 0, 3], [2, 0, 3.4], [0, 1, 4]].map(([dx, dz, r]) => S(12 + dx, 59.5 + dz, dz, r, r * 0.8, r, IW.green, { m: 'plain', seg: 8 })),
    ...crate(48, 52.1, 0, 18, 10, 18, 3),
    ...pot(20, 76.2, 0, 4, 6),
  ]),

  // a pipe stand, a tee at the top and two bare Edison bulbs hanging, a valve wheel for a switch
  piece('iwfloorlamp', 'Edison pipe floor lamp', 1, 1, 450, 'metal', [
    C(16, 1, 0, 9, 2, IW.ironD, { seg: 16 }),
    flange(16, 2, 0, 3.4),
    pipe([16, 2, 0], [16, 72, 0], 1.5),
    joint(16, 72, 0, 2.2),
    pipe([5, 72, 0], [27, 72, 0], 1.3),
    ...[5, 27].flatMap(x => [joint(x, 72, 0, 1.9), pipe([x, 72, 0], [x, 68, 0], 1), ...bulb(x, 67.6, 0, 1.05)]),
    collar(16, 34, 0, 2.2, IW.copper),
    RG(16, 44, 2.4, 2.6, 0.5, IW.rust, { m: 'metal' }),
    RD([13.4, 44, 2.4], [18.6, 44, 2.4], 0.35, IW.rust, { m: 'metal' }),
    RD([16, 41.4, 2.4], [16, 46.6, 2.4], 0.35, IW.rust, { m: 'metal' }),
    RD([16, 44, 0], [16, 44, 2.4], 0.5, IW.ironD, { m: 'metal' }),
  ], { glow: [IW.amber] }),

  // a station clock in a steel case on a pipe post, brass bezel
  piece('iwpostclock', 'Factory post clock', 1, 1, 650, 'metal', [
    C(16, 1, 0, 8, 2, IW.ironD, { seg: 16 }),
    flange(16, 2, 0, 3.2),
    pipe([16, 2, 0], [16, 55, 0], 1.6),
    collar(16, 30, 0, 2.3, IW.copper),
    collar(16, 54, 0, 2.6),
    DS(16, 66, 0, 11, 5, IW.ironD, { seg: 24 }),
    DS(16, 66, 2.6, 9.4, 0.4, IW.dial, { seg: 24, m: 'plain' }),
    PC(16, 66, 2.9, 18.8, 18.8, dial),
    RG(16, 66, 2.6, 10, 0.9, IW.brass, { m: 'metal' }),
    DS(16, 66, -2.6, 9.4, 0.4, IW.dial, { seg: 24, m: 'plain' }),
    S(16, 78, 0, 1.6, 1.6, 1.6, IW.brass, { seg: 8 }),
    C(16, 77, 0, 1, 2, IW.ironD, { seg: 8 }),
  ]),

  // a heavy oak bench on angle-iron legs, a vise, a hammer, a wrench and an oil can
  piece('iwworkbench', 'Workbench with a vise', 2, 1, 900, 'wood', [
    ...[4, 60].flatMap(x => [-11, 11].map(z => B(x, 13, z, 3.2, 26, 3.2, IW.iron, { r: 0.3, m: 'metal' }))),
    ...[4, 60].map(x => flat(x, 6, 0, 1.6, 2, 22)),
    ...planks(32, 6.8, 0, 56, 1.6, 24, 5, 'x', 2),
    flat(32, 24.6, 12.4, 58, 2.4, 0.8),
    B(40, 21.4, 13.2, 18, 4.4, 1.2, IW.oakL, { r: 0.4 }),
    B(40, 21.4, 14.1, 5, 1, 0.8, IW.iron, { r: 0.3, m: 'metal' }),
    ...rivets([[4, 4], [60, 4], [4, 22], [60, 22]], 12.8),
    ...planks(32, 27, 0, 62, 3.2, 28, 4, 'z', 1),
    B(10, 31.4, 8.6, 9, 5.6, 9, IW.vise, { r: 0.6, m: 'metal' }),
    B(10, 32.8, 13.4, 9.4, 3, 1.4, IW.steelL, { r: 0.3, m: 'metal' }),
    RD([10, 31.6, 14], [10, 31.6, 15.6], 0.8, IW.steelL, { m: 'metal' }),
    RD([6, 31.6, 15.6], [14, 31.6, 15.6], 0.5, IW.steelL, { m: 'metal' }),
    RD([28, 29.4, 2], [40, 29.4, 5], 0.8, IW.oakL, { m: 'wood' }),
    B(41, 29.8, 5.2, 2.4, 2.4, 6, IW.iron, { r: 0.4, m: 'metal' }),
    B(32, 28.9, -6, 12, 0.6, 1.8, IW.steel, { r: 0.2, m: 'metal' }),
    LA(52, 28.6, -6, [[0, 0], [3.6, 0], [3.8, 2], [1.2, 5], [0.8, 6.6], [0, 6.6]], IW.copper, { m: 'metal', seg: 12 }),
    RD([54.5, 31, -6], [59, 34, -6], 0.4, IW.copper, { m: 'metal' }),
  ]),

  // a butcher-block top on flat steel, two oak shelves, a copper towel bar, pots, on casters
  piece('iwcart', 'Rolling kitchen cart', 1, 1, 450, 'wood', [
    ...[4, 28].flatMap(x => [-10, 10].flatMap(z => [B(x, 18, z, 2, 30, 2, IW.iron, { r: 0, m: 'metal' }), ...caster(x, 3, z)])),
    ...planks(16, 6, 0, 26, 1.6, 21, 4, 'x', 1),
    ...planks(16, 18, 0, 26, 1.6, 21, 4, 'x', 3),
    ...planks(16, 33.8, 0, 30, 2.6, 24, 6, 'x'),
    ...[4, 28].map(x => RD([x, 29, 11], [x, 29, 13], 0.5, IW.iron, { m: 'metal' })),
    RD([3, 29, 13], [29, 29, 13], 0.7, IW.copper, { m: 'metal' }),
    B(10, 24, 13.4, 5, 9, 0.6, IW.linen, { r: 0.4, m: 'cloth' }),
    ...pot(11, 6.8, 0, 4.4, 6), ...pot(22, 6.8, -1, 3.6, 7),
    LA(10, 18.8, 0, [[0, 0], [3, 0], [3, 7], [2.2, 7.6], [0, 7.6]], IW.glassJar, { m: 'glass', seg: 10 }),
    C(10, 26.8, 0, 2.4, 1.2, IW.copper, { seg: 10 }),
    B(21, 21, 0, 9, 4.6, 8, IW.oakDD, { r: 0.4, m: 'wood' }),
  ]),

  // a slatted crate on its side on casters, an oak top, books inside, iron corner brackets
  piece('iwcrate', 'Crate side table', 1, 1, 200, 'wood', [
    ...[[5, -10], [27, -10], [5, 10], [27, 10]].map(([x, z]) => S(x, 1.2, z, 1.4, 1.2, 1.4, IW.ironD, { m: 'metal', seg: 6 })),
    B(16, 3.4, 0, 28, 2, 26, IW.oakD, { r: 0.4 }),
    ...[3, 29].flatMap((x, i) => planks(x, 14.4, 0, 2, 20, 26, 3, 'h', i)),
    ...planks(16, 14.4, -12, 24, 20, 1.5, 3, 'h', 2),
    ...planks(16, 25.4, 0, 28, 2, 26, 3, 'z', 1),
    ...books(8, 4.4, -4, 4, 2),
    LA(23, 4.4, -2, [[0, 0], [2.8, 0], [2.8, 6], [0, 6]], IW.steel, { m: 'metal', seg: 10 }),
    bracket(4, 4.4, 13.3, 4), bracket(28, 4.4, 13.3, 4, -1),
    bracket(4, 24.4, 13.3, 4, 1, -1), bracket(28, 24.4, 13.3, 4, -1, -1),
  ]),

  // a pipe post on a cross of pipe feet, hooks of elbows, a leather satchel and a wool scarf
  piece('iwcoatrack', 'Pipe coat rack', 1, 1, 350, 'metal', [
    pipe([4, 1.5, 0], [28, 1.5, 0], 1.5), pipe([16, 1.5, -12], [16, 1.5, 12], 1.5),
    ...[[4, 0], [28, 0], [16, -12], [16, 12]].map(([x, z]) => joint(x, 1.6, z, 1.9)),
    flange(16, 1.5, 0, 3),
    pipe([16, 2, 0], [16, 74, 0], 1.5),
    joint(16, 74.4, 0, 2),
    collar(16, 30, 0, 2.2, IW.copper),
    ...[[1, 0], [-1, 0], [0, 1], [0, -1]].flatMap(([dx, dz]) => [
      pipe([16, 66, 0], [16 + dx * 8, 66, dz * 8], 1.1),
      joint(16 + dx * 8, 66, dz * 8, 1.5),
      pipe([16 + dx * 8, 66, dz * 8], [16 + dx * 8, 69.5, dz * 8], 1.1),
      S(16 + dx * 8, 69.8, dz * 8, 1.3, 1.3, 1.3, IW.brass, { seg: 6 }),
    ]),
    collar(16, 66, 0, 2.2),
    RD([23, 65, 0.6], [21.5, 56, 2.4], 0.6, IW.leatherD, { m: 'plain' }),
    RD([25, 65, 0.6], [27.5, 56, 2.4], 0.6, IW.leatherD, { m: 'plain' }),
    B(25, 51, 2.6, 9, 10, 4, IW.leather, { r: 1.2, m: 'plain' }),
    B(25, 53.6, 4.8, 9.2, 4.6, 0.8, IW.leatherL, { r: 0.6, m: 'plain' }),
    B(25, 52, 5.4, 1.6, 1.6, 0.6, IW.brass, { r: 0.3 }),
    B(7.5, 53, 0.4, 5, 24, 3.4, IW.rust, { r: 2, m: 'cloth' }),
    B(7.5, 41.6, 0.4, 5.2, 1.2, 3.6, IW.linen, { r: 0.4, m: 'cloth' }),
  ]),

  // three iron-mesh panels in riveted frames, copper hinges
  piece('iwscreen', 'Iron mesh folding screen', 2, 1, 600, 'metal', [
    ...[[11, -4], [32, 3], [53, -4]].flatMap(([x, z]) => [
      ...[-9.2, 9.2].flatMap(dx => [B(x + dx, 32, z, 1.6, 60, 1.6, IW.iron, { r: 0.3 }), S(x + dx, 1.2, z, 1.4, 1.2, 1.4, IW.ironD, { seg: 6 })]),
      ...[61.2, 32, 3.2].map(h => B(x, h, z, 20, 1.6, 1.6, IW.iron, { r: 0.3 })),
      ...[-6, -3, 0, 3, 6].map(dx => flat(x + dx, 32, z, 0.5, 57, 0.4, IW.ironL)),
      ...Array.from({ length: 15 }, (_, i) => flat(x, 6.4 + i * 3.7, z, 17, 0.5, 0.4, IW.ironL)).filter(q => Math.abs(q.h - 32) > 1.4),
      ...rivets([[x - 9.2, 61.2], [x + 9.2, 61.2], [x - 9.2, 3.2], [x + 9.2, 3.2], [x - 9.2, 32], [x + 9.2, 32]], z + 0.9, 0.6),
    ]),
    ...[21.5, 42.5].flatMap(x => [16, 48].map(h => C(x, h, -0.5, 1.2, 4, IW.copper, { seg: 8 }))),
  ]),

  // a tall mirror in a flat steel frame, corner brackets, a little copper gear on top, kicked back on pipe legs
  piece('iwmirror', 'Steel-frame standing mirror', 1, 1, 450, 'metal', [
    ...[5, 27].flatMap(x => [B(x, 2, 0, 4, 4, 6, IW.ironD, { r: 0.4 }), pipe([x, 30, -1.4], [x, 0.8, -12], 1)]),
    B(16, 34, -0.2, 18, 56, 0.8, IW.mirror, { r: 0 }),
    ...[4.8, 27.2].map(x => B(x, 34, 0, 2.6, 60, 2, IW.iron, { r: 0.3 })),
    ...[5, 63].map(h => B(16, h, 0, 25, 2.4, 2, IW.iron, { r: 0.3 })),
    bracket(6.1, 6.2, 1.1, 4), bracket(25.9, 6.2, 1.1, 4, -1), bracket(6.1, 61.8, 1.1, 4, 1, -1), bracket(25.9, 61.8, 1.1, 4, -1, -1),
    ...rivets([[4.8, 5], [27.2, 5], [4.8, 63], [27.2, 63]], 1.2, 0.6),
    PR(16, 67.5, 0, gear(4.4, 8, 1.4), 1.4, IW.copper),
    DS(16, 67.5, 0.8, 1.2, 0.5, IW.brass, { seg: 8 }),
    B(11, 46, 0.3, 2.4, 14, 0.2, '#f4fafc', { r: 0, m: 'plain' }),
  ]),

  // a rust-red steel chest of five drawers on casters, steel pulls, a pipe side handle
  piece('iwtoolchest', 'Rolling tool chest', 1, 1, 550, 'metal', [
    ...[[5, -9], [27, -9], [5, 9], [27, 9]].flatMap(([x, z]) => caster(x, 4, z)),
    B(16, 19, 0, 28, 30, 24, IW.chest, { r: 0.8 }),
    ...[[8, 7], [15, 7], [21.5, 6], [27, 5], [31.5, 4]].flatMap(([h, hh]) => [
      B(16, h, 12.3, 26, hh - 0.8, 0.8, IW.chestL, { r: 0.4 }),
      B(16, h + hh * 0.18, 13.1, 18, 1, 0.8, IW.steelL, { r: 0.3 }),
    ]),
    B(16, 35, 0, 29, 2.4, 25, IW.chest, { r: 0.8 }),
    ...[-6, 6].map(z => RD([29.6, 28, z], [31, 28, z], 0.5, IW.iron)),
    pipe([31, 28, -6.5], [31, 28, 6.5], 0.8),
    ...rivets([[3, 33], [29, 33], [3, 5], [29, 5]], 12.3, 0.6),
  ]),

  // a pot-belly stove, its fire door glowing, a stovepipe off to the wall, a copper kettle on top
  piece('iwstove', 'Pot-belly stove', 1, 1, 900, 'metal', [
    B(16, 0.5, 0, 30, 1, 30, IW.ironD, { r: 0.4 }),
    ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => RD([16 + sx * 4.4, 7, sz * 4.4], [16 + sx * 7, 1, sz * 7], 1.1, IW.iron)),
    LA(16, 6, 0, [[0, 0], [6, 0], [9, 2], [11, 8], [11.5, 14], [10, 20], [8, 23], [8.5, 24], [0, 24]], IW.iron, { seg: 16 }),
    C(16, 14, 0, 11.7, 1.2, IW.copper, { seg: 16 }),
    B(16, 18, 10.6, 10, 9, 2, IW.ironD, { r: 1 }),
    B(16, 18, 11.7, 7, 6, 0.4, IW.fire, { r: 0.6, m: 'glow' }),
    ...[13.5, 16, 18.5].map(x => RD([x, 15.4, 12.1], [x, 20.6, 12.1], 0.35, IW.ironD)),
    B(16, 10, 9.6, 8, 2, 2, IW.ironD, { r: 0.4 }),
    C(16, 30.7, 0, 9, 1.4, IW.ironD, { seg: 16 }),
    C(16, 52, -5, 3.2, 42, IW.iron, { seg: 10 }),
    collar(16, 48, -5, 3.6, IW.copper),
    joint(16, 73.4, -5, 3.4),
    RD([16, 73.4, -5], [16, 73.4, -15.6], 3.2, IW.iron),
    LA(16, 31.4, 3.6, [[0, 0], [3.6, 0], [4.2, 2.4], [3, 4.4], [0.8, 5], [0, 5]], IW.copper, { seg: 12 }),
    RD([19.4, 33.6, 3.6], [22.4, 36, 3.6], 0.5, IW.copper),
    RG(16, 37, 3.6, 2.4, 0.4, IW.ironD),
  ], { glow: [IW.fire] }),

  // a leather steamer trunk, iron straps with rivets, oak bands, brass corners and lock
  piece('iwtrunk', 'Riveted steamer trunk', 1, 1, 500, 'plain', [
    ...[[4, -7], [28, -7], [4, 7], [28, 7]].map(([x, z]) => S(x, 1.4, z, 1.6, 1.4, 1.6, IW.ironD, { m: 'metal', seg: 6 })),
    B(16, 12, 0, 29, 18, 18, IW.leather, { r: 1 }),
    B(16, 22, 0, 29.4, 3.6, 18.4, IW.leatherD, { r: 1.4 }),
    ...[9, 15].map(h => B(16, h, 9.1, 29.2, 1.6, 0.8, IW.oakL, { r: 0.3, m: 'wood' })),
    ...[7, 25].flatMap(x => [flat(x, 12.8, 9.3, 2.2, 19.6, 0.6), ...rivets([[x, 5], [x, 12], [x, 20]], 9.8, 0.5)]),
    ...[[2.4, 4.2], [29.6, 4.2], [2.4, 21.4], [29.6, 21.4]].map(([x, h]) => B(x, h, 7.9, 3.2, 3.4, 3.2, IW.brass, { r: 0.6, m: 'metal' })),
    B(16, 19.6, 9.5, 4, 5, 0.8, IW.brass, { r: 0.4, m: 'metal' }),
    DS(16, 18.6, 10, 0.6, 0.4, IW.ink, { seg: 6 }),
    ...[1.2, 30.8].map(x => B(x, 16, 0, 0.8, 1.4, 7, IW.leatherD, { r: 0.3 })),
  ]),

  // a worn rust-red rug: a dark border, a navy diamond, faded where boots went over it, fringed ends
  { id: 'iwrug', name: 'Worn factory rug', group: GROUP, solo: true, w: 2, h: 2, layer: 'rug', price: 400, high: 0.04, side: 'c', flat(w, h) {
    const g = ctx();
    R(0, 0, w, h, IW.linen);
    R(1, 3, w - 2, h - 6, '#4a2a20');
    R(3, 5, w - 6, h - 10, '#8e3b2c');
    R(6, 8, w - 12, h - 16, '#a8503a');
    g.strokeStyle = '#c8963c'; g.lineWidth = 0.8; g.strokeRect(4.6, 6.6, w - 9.2, h - 13.2);
    const cx = w / 2, cy = h / 2;
    const dia = (r, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(cx, cy - r); g.lineTo(cx + r * 0.8, cy); g.lineTo(cx, cy + r); g.lineTo(cx - r * 0.8, cy); g.closePath(); g.fill(); };
    dia(20, '#2f3d4f'); dia(15, '#c8963c'); dia(12.5, '#8e3b2c'); dia(6, '#2f3d4f'); dia(2.6, '#e8d8b0');
    for (const [x, y] of [[12, 14], [w - 12, 14], [12, h - 14], [w - 12, h - 14]]) {
      g.fillStyle = '#2f3d4f'; g.beginPath(); g.moveTo(x, y - 4); g.lineTo(x + 3.4, y); g.lineTo(x, y + 4); g.lineTo(x - 3.4, y); g.closePath(); g.fill();
      oval(x, y, 1.2, 1.2, '#c8963c');
    }
    for (let i = 0; i < 9; i++) {
      const x = 6 + (w - 12) * i / 8;
      R(x - 0.6, 3.6, 1.2, 1.2, '#c8963c'); R(x - 0.6, h - 4.8, 1.2, 1.2, '#c8963c');
    }
    g.save();
    for (let i = 0; i < 7; i++) {
      g.globalAlpha = 0.18 + hash(i, 3) * 0.14;
      oval(10 + hash(i, 1) * (w - 20), 10 + hash(i, 2) * (h - 20), 5 + hash(i, 4) * 7, 3 + hash(i, 5) * 4, '#e8c8a8');
    }
    g.globalAlpha = 0.35; oval(cx + 4, cy + 6, 13, 9, '#d8b090');
    g.restore();
    g.strokeStyle = IW.linen; g.lineWidth = 0.5;
    for (let x = 1.5; x < w - 1; x += 1.6) {
      const a = hash(Math.round(x * 10), 7) * 0.8;
      g.beginPath(); g.moveTo(x, 3); g.lineTo(x + a - 0.4, 0.2); g.stroke();
      g.beginPath(); g.moveTo(x, h - 3); g.lineTo(x - a + 0.4, h - 0.2); g.stroke();
    }
  } },

  // a pegboard in an iron frame, a workshop's tools on hooks
  wallPiece('iwpegboard', 'Pegboard of tools', 2, 550, 'metal', [
    B(32, 60, 0.6, 58, 32, 1.2, IW.board, { r: 0.3, m: 'plain' }),
    PC(32, 60, 1.25, 58, 32, (g, x, y, w, h) => {
      g.fillStyle = IW.board; g.fillRect(x, y, w, h);
      g.fillStyle = '#5a4430';
      for (let py = y + 2; py < y + h - 1; py += 3.2) for (let px = x + 2; px < x + w - 1; px += 3.2) { g.beginPath(); g.arc(px, py, 0.45, 0, TAU); g.fill(); }
    }),
    ...[44, 76].map(h => flat(32, h, 1, 60, 1.6, 2)),
    ...[2.8, 61.2].map(x => flat(x, 60, 1, 1.6, 33.6, 2)),
    ...rivets([[2.8, 44], [61.2, 44], [2.8, 76], [61.2, 76]], 2.1, 0.6),
    RD([9, 72, 1.4], [9, 72, 3.4], 0.4, IW.steel), RD([9, 50, 2.4], [9, 70, 2.4], 0.9, IW.oakL, { m: 'wood' }),
    B(9, 70.6, 2.6, 7, 2.6, 2.6, IW.iron, { r: 0.4 }),
    RD([18, 72, 1.4], [18, 72, 3.4], 0.4, IW.steel), RD([18, 70, 2.4], [18, 52, 2.4], 0.8, IW.steelL),
    RG(18, 69, 2.4, 1.8, 0.6, IW.steelL), RG(18, 51, 2.4, 1.4, 0.6, IW.steelL),
    RD([27, 72, 1.4], [27, 72, 3.4], 0.4, IW.steel),
    B(27, 69, 2.6, 4.4, 5, 1.6, IW.oakD, { r: 1, m: 'wood' }),
    PR(27, 66.6, 2.6, [[-2.2, 0], [2.2, 0], [1.4, -18], [-2.2, -18]], 0.3, IW.steelL),
    ...[[35, IW.rust], [38.5, IW.brass], [42, IW.green]].flatMap(([x, c]) => [
      RD([x, 70, 1.4], [x, 70, 3.4], 0.4, IW.steel),
      B(x, 66, 2.6, 2.2, 5.6, 2.2, c, { r: 0.8, m: 'plain' }),
      RD([x, 63, 2.6], [x, 55, 2.6], 0.35, IW.steelL),
    ]),
    RD([50, 72, 1.4], [50, 72, 3.4], 0.4, IW.steel),
    RG(50, 66, 2.6, 4, 1, IW.copper), RG(50, 66, 3.2, 2.8, 0.8, IW.copper),
    RD([57, 72, 1.4], [57, 72, 3.4], 0.4, IW.steel),
    RD([55.4, 70, 2.4], [58.4, 54, 2.4], 0.6, IW.ironD), RD([58.6, 70, 2.6], [55.6, 54, 2.6], 0.6, IW.ironD),
    ...[[55.2, 54], [58.8, 54]].map(([x, h]) => B(x, h - 2.4, 2.5, 1.6, 5, 1.6, IW.rust, { r: 0.6, m: 'plain' })),
    B(50, 52, 2.4, 7, 6, 3.4, IW.steel, { r: 0.6 }),
  ]),

  // a big iron gear with a clock face, a smaller copper gear turning behind it
  wallPiece('iwwallclock', 'Gear wall clock', 1, 400, 'metal', [
    PR(8, 50, 0.6, gear(7.6, 9, 1.8), 1.2, IW.copper),
    DS(8, 50, 1.3, 1.6, 0.4, IW.brass, { seg: 8 }),
    PR(16, 63, 1.8, gear(15, 14, 2.4), 2.4, IW.iron),
    DS(16, 63, 3.1, 10.4, 0.4, IW.dial, { seg: 24, m: 'plain' }),
    PC(16, 63, 3.4, 20.8, 20.8, dial),
    RG(16, 63, 3.2, 10.6, 0.7, IW.brass),
    ...[0, 1, 2, 3, 4, 5].map(i => { const a = i / 6 * TAU; return rivet(16 + Math.cos(a) * 12, 63 + Math.sin(a) * 12, 3.1, 0.6); }),
  ]),

  // two oak shelves on black pipe brackets, jars with copper lids, books, a tin plant and a pot
  wallPiece('iwwallshelf', 'Pipe wall shelf', 2, 400, 'wood', [
    ...[8, 56].flatMap(x => [
      ...[45.8, 65.8].flatMap(h => [DS(x, h, 0.5, 2.8, 1, IW.ironD, { m: 'metal', seg: 10 }), pipe([x, h, 0], [x, h, 9], 1.2), joint(x, h, 9, 1.6)]),
      pipe([x, 45.8, 1.6], [x, 65.8, 1.6], 1),
    ]),
    ...[48, 68].flatMap((h, i) => planks(32, h, 5, 62, 2, 10, 2, 'z', i)),
    ...[14, 21, 28].flatMap((x, i) => [
      LA(x, 49, 5, [[0, 0], [2.6, 0], [2.6, 6 + i], [2, 6.6 + i], [0, 6.6 + i]], IW.glassJar, { m: 'glass', seg: 10 }),
      C(x, 56.2 + i, 5, 2.2, 1.2, IW.copper, { m: 'metal', seg: 10 }),
      B(x, 51 + i * 0.6, 5, 3.4, 3 + i, 3.4, [IW.rust, IW.oakL, IW.green][i], { r: 1.2, m: 'plain' }),
    ]),
    LA(44, 49, 5, [[0, 0], [3.2, 0], [3.2, 5], [0, 5]], IW.steel, { m: 'metal', seg: 10 }),
    ...[[-1.6, 0, 2.6], [1.6, 0, 2.4], [0, 1.4, 3]].map(([dx, dz, r]) => S(44 + dx, 55.6 + dz, 5 + dz, r, r * 0.8, r, IW.green, { m: 'plain', seg: 8 })),
    ...books(12, 69, 5, 5, 3),
    B(32, 74.6, 5, 2.4, 11, 7, IW.leatherD, { r: 0.4, m: 'plain' }),
    ...pot(46, 69, 5, 4, 6),
  ]),

  // a black pipe sconce, an Edison bulb hanging in a wire cage
  wallPiece('iwcagelamp', 'Caged wall lamp', 1, 300, 'metal', [
    DS(16, 72, 0.6, 3.6, 1.2, IW.ironD, { seg: 10 }),
    ...rivets([[16, 74.6], [16, 69.4]], 1.3, 0.5),
    pipe([16, 72, 0], [16, 72, 7], 1.2),
    joint(16, 72, 7, 1.7),
    pipe([16, 72, 7], [16, 68, 7], 1),
    collar(16, 67.4, 7, 1.8, IW.brass),
    ...bulb(16, 66.6, 7, 1.15),
    ...cage(16, 66.8, 7, 4.6, 13),
  ], { glow: [IW.amber] }),
];
