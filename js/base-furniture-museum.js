/* base-furniture-museum.js  -  the Fossils and museum set (furniture expansion session b, 2026-10-17), after the Pewter
   Museum of Science: mounted skeletons (Kabutops, Aerodactyl, Tyrantrum), the fossils you revive (Helix, Dome, Root,
   Claw, Old Amber), a dig site, and the museum's own furniture (ropes, plaques, cases, a kiosk, a ticket desk). Fixed
   colours: bone ivory with darker joints, dark plinths, brass and red velvet.
   As in the Snorlax room, an upright or wall piece is a list of parts in painted units (32 a tile): `x` across from the
   left of its front, `h` up from the floor (a wall piece's from the foot of its strip), `z` out to the front from its
   middle (a wall piece's from the wall). They're painted here from any side, and js/base-models-museum.js builds the
   same list as 3D parts (BUILT), so picture and model agree. A bone (`BN`) runs between two points [x, h, z]; a picture
   (`PIC`, a label's `TX`) is painted on the front and worn by the model as a crop of the painting. The two rugs are
   painted from above (DIG and the ammonite's circle, for the model). */

import { R, oval, ovalShade, floorShadow, ctx, sh, hash } from './base-paint.js';

export const MUS = {
  bone: '#e8dcc0', boneD: '#c8b48e', joint: '#8a7254', tooth: '#f8f4ea', plinth: '#34303a', plinthT: '#4a4450',
  rod: '#8c9098', brass: '#d4aa48', brassD: '#a8822e', rope: '#b02830', velvet: '#7a1e2a', sand: '#e2c88e', sandD: '#c4a46a',
  stone: '#9a8e7c', stoneD: '#6e6456', stoneL: '#bcb2a0', amber: '#f0a030', amberL: '#ffd27a', wood: '#7a4e2e', woodD: '#4e3220',
  woodL: '#a8784a', paper: '#f4ecd8', ink: '#2a2420', steel: '#aab2bc', steelD: '#5a6068', moon: '#b8b0e8', moonL: '#e8e4ff',
  rock: '#4a4650', rockD: '#34303a', marble: '#e8e4dc', marbleD: '#c8c2b8', navy: '#24345a', screen: '#1c2a3a', cyan: '#58d8e8',
  liquid: '#68e0a8', green: '#58c858', red: '#e04848', yellow: '#f0c838', terra: '#c06a3a', gold: '#e0b440', dome: '#8a6038',
  shell: '#d8c098', shellD: '#9a7a50', white: '#f6f4ee', leather: '#8a2a30', frame: '#c09040',
};
const M = MUS;
const TAU = Math.PI * 2;

/* ---------- parts ---------- */
const B = (x, h, z, rx, ry, rz, c, o) => ({ t: 'blob', x, h, z, rx, ry, rz, c, ...o });
const BX = (x, h, z, w, hh, d, c, o) => ({ t: 'box', x, h, z, w, hh, d, c, r: 1, ...o });
const CY = (x, h, z, r, hh, c, o) => ({ t: 'cyl', x, h, z, r, hh, c, ...o });
const DZ = (x, h, z, r, th, c, o) => ({ t: 'disc', x, h, z, r, th, c, ...o });
/** A cone standing on its base at x, h, z: `tilt` leans it right (Math.PI points it down), `fwd` points it out front. */
const CN = (x, h, z, r, hh, c, o) => ({ t: 'cone', x, h, z, r, hh, c, tilt: 0, ...o });
/** A lathe from h up, its profile [[r, up]...]. */
const LA = (x, h, z, pts, c, o) => ({ t: 'lathe', x, h, z, pts, c, ...o });
/** A rod lying across, x0 to x1. */
const RD = (x0, x1, h, z, r, c, o) => ({ t: 'rod', x: (x0 + x1) / 2, x0, x1, h, z, r, c, ...o });
/** A bone (or a pipe, a handle) from a to b, each [x, h, z], r round at a and `r1` at b. */
const BN = (a, b, r, c, o) => ({ t: 'bone', x: (a[0] + b[0]) / 2, h: (a[1] + b[1]) / 2, z: (a[2] + b[2]) / 2, a, b, r, r1: r, c, ...o });
/** A rope hung from x0, h0 to x1, h1, sagging `sag` in the middle. */
const SW = (x0, h0, x1, h1, z, sag, r, c, o) => ({ t: 'swag', x: (x0 + x1) / 2, h: (h0 + h1) / 2 - sag / 2, z, x0, h0, x1, h1, sag, r, c, ...o });
/** Words painted on the front, `size` tall and at most `w` wide; the model wears that bit of the painting. */
const TX = (s, x, h, z, size, w, c, o) => ({ t: 'text', s, x, h, z, size, w, c, ...o });
/** A picture w x hh painted by fn(g, left, top, w, hh) on the front (a circle with `round`); the model wears it. */
const PIC = (x, h, z, w, hh, fn, o) => ({ t: 'pic', x, h, z, w, hh, fn, ...o });

const GLASS = { m: 'glass', k: 50 };
const metal = (o) => ({ m: 'metal', ...o });

/** A dark plinth w x d, hh tall, centred at cx, its top lipped and a brass label on its front. */
const plinth = (cx, w, d, hh, z = 0) => [
  BX(cx, hh / 2, z, w, hh, d, M.plinth, { r: 1.2 }),
  BX(cx, hh + 0.6, z, w + 1.2, 1.2, d + 1.2, M.plinthT, { r: 0.5 }),
  BX(cx, Math.min(hh * 0.55, hh - 3), z + d / 2 + 0.3, Math.min(10, w * 0.45), Math.min(3.4, hh * 0.4), 0.6, M.brass, metal({ r: 0.4 })),
];

/** Vertebrae along a path [[x, h, z]...], n of them from r0 round to r1, a dark joint between each; `along` 'x' for a
    spine lying across (each vertebra then tall, a spine on top), else upright. */
function spine(path, n, r0, r1, along) {
  const segs = [], lens = [];
  let tot = 0;
  for (let i = 1; i < path.length; i++) { const l = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1], path[i][2] - path[i - 1][2]); segs.push([path[i - 1], path[i]]); lens.push(l); tot += l; }
  const at = (d) => {
    for (let i = 0; i < segs.length; i++) { if (d <= lens[i] || i === segs.length - 1) { const f = Math.min(1, d / lens[i]), [a, b] = segs[i]; return a.map((v, k) => v + (b[k] - v) * f); } d -= lens[i]; }
  };
  const pts = Array.from({ length: n }, (_, i) => at(tot * i / (n - 1))), out = [];
  for (let i = 1; i < n; i++) out.push(BN(pts[i - 1], pts[i], (r0 + (r1 - r0) * i / n) * 0.42, M.joint, { m: 'plain', seg: 6 }));
  pts.forEach((p, i) => {
    const r = r0 + (r1 - r0) * i / Math.max(1, n - 1);
    if (along === 'x') {
      out.push(B(p[0], p[1], p[2], r * 0.62, r * 0.95, r * 0.9, M.bone));
      out.push(CN(p[0] - r * 0.15, p[1] + r * 0.7, p[2], r * 0.38, r * 1.15, M.boneD, { tilt: -0.3 }));
    } else out.push(B(p[0], p[1], p[2], r * 1.05, r * 0.62, r * 0.9, M.bone));
  });
  return out;
}

/* ---------- painting the parts ---------- */

const shine = (g, x0, y0, x1, y1, c) => {
  const l = g.createLinearGradient(x0, y0, x1, y1);
  l.addColorStop(0, sh(c, 1)); l.addColorStop(0.35, c); l.addColorStop(1, sh(c, -1));
  return l;
};
/** A superellipse k (1 an oval) lit from the top left, leaning `tilt`. */
function supr(cx, cy, rx, ry, k, c, tilt = 0, alpha = 1) {
  if (rx <= 0 || ry <= 0) return;
  const g = ctx();
  g.save(); g.globalAlpha *= alpha; g.translate(cx, cy); if (tilt) g.rotate(tilt); g.scale(1, ry / rx);
  const t = g.createRadialGradient(-rx * 0.35, -rx * 0.42, 0, 0, 0, rx * 1.05);
  t.addColorStop(0, sh(c, 1)); t.addColorStop(0.55, c); t.addColorStop(1, sh(c, -1));
  g.fillStyle = t; g.beginPath();
  if (k === 1) g.arc(0, 0, rx, 0, TAU);
  else for (let i = 0; i < 48; i++) { const a = i / 48 * TAU, co = Math.cos(a), si = Math.sin(a); g.lineTo(rx * Math.sign(co) * Math.abs(co) ** k, rx * Math.sign(si) * Math.abs(si) ** k); }
  g.fill(); g.restore();
}
function rbx(x, y, w, h, r, c, alpha = 1) {
  if (w <= 0 || h <= 0) return;
  const g = ctx();
  g.save(); g.globalAlpha *= alpha;
  g.fillStyle = shine(g, x, y, x + w * 0.3, y + h, c); g.beginPath(); g.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); g.fill();
  if (h > 3 && w > 3) { g.fillStyle = sh(c, 1); g.globalAlpha *= 0.6; g.beginPath(); g.roundRect(x + Math.min(r, w / 2) * 0.6, y + 0.4, w - Math.min(r, w / 2) * 1.2, 0.7, 0.35); g.fill(); }
  g.restore();
}
function poly(pts, c, horiz) {
  const g = ctx(), xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  g.fillStyle = horiz ? (() => { const l = g.createLinearGradient(x0, 0, x1, 0); l.addColorStop(0, sh(c, -1)); l.addColorStop(0.3, sh(c, 1)); l.addColorStop(0.55, c); l.addColorStop(1, sh(c, -1)); return l; })() : shine(g, x0, y0, x1, y1, c);
  g.beginPath(); pts.forEach(([x, y]) => g.lineTo(x, y)); g.closePath(); g.fill();
}
/** Glass: a pale tint, brighter edges and two glints. */
function glassRect(x, y, w, h) {
  const g = ctx();
  g.save();
  g.globalAlpha = 0.3; g.fillStyle = '#cfe8f4'; g.fillRect(x, y, w, h);
  g.globalAlpha = 0.75; g.strokeStyle = '#eef8ff'; g.lineWidth = 0.5; g.strokeRect(x + 0.25, y + 0.25, w - 0.5, h - 0.5);
  g.globalAlpha = 0.45; g.strokeStyle = '#ffffff'; g.lineWidth = Math.max(0.8, Math.min(w, h) * 0.08);
  g.beginPath(); g.moveTo(x + w * 0.12, y + h * 0.55); g.lineTo(x + w * 0.4, y + h * 0.08); g.stroke();
  g.lineWidth *= 0.5; g.beginPath(); g.moveTo(x + w * 0.28, y + h * 0.75); g.lineTo(x + w * 0.58, y + h * 0.22); g.stroke();
  g.restore();
}
/** A bone between two points on the picture, round-ended, r0 and r1 its half-widths, lit from the top left. */
function boneStroke(ax, ay, bx, by, r0, r1, c) {
  const g = ctx(), dx = bx - ax, dy = by - ay, l = Math.hypot(dx, dy) || 0.001;
  let nx = -dy / l, ny = dx / l;
  if (nx + ny > 0) { nx = -nx; ny = -ny; }
  const mx = (ax + bx) / 2, my = (ay + by) / 2, rm = Math.max(r0, r1);
  const t = g.createLinearGradient(mx + nx * rm, my + ny * rm, mx - nx * rm, my - ny * rm);
  t.addColorStop(0, sh(c, 1)); t.addColorStop(0.45, c); t.addColorStop(1, sh(c, -1));
  g.fillStyle = t; g.beginPath();
  g.moveTo(ax + nx * r0, ay + ny * r0); g.lineTo(bx + nx * r1, by + ny * r1); g.lineTo(bx - nx * r1, by - ny * r1); g.lineTo(ax - nx * r0, ay - ny * r0); g.closePath();
  g.moveTo(ax + r0, ay); g.arc(ax, ay, r0, 0, TAU); g.moveTo(bx + r1, by); g.arc(bx, by, r1, 0, TAU);
  g.fill();
}

/** Paints parts seen from `dir` (0 front, 2 back, 1 / 3 the sides), on a view vw wide standing on line b; W is the
    piece's front width in units. */
function paintParts(parts, x0, b, vw, dir, W) {
  const side = dir % 2 === 1, sg = dir === 3 ? -1 : 1, g = ctx();
  const U = (px, pz) => dir === 0 ? x0 + px : dir === 2 ? x0 + W - px : x0 + vw / 2 + sg * pz;
  const key = (q) => q.k ?? (dir === 0 ? q.z : dir === 2 ? -q.z : sg * (W / 2 - q.x));
  const list = parts.map((q, i) => [key(q), i, q]).sort((a, c) => a[0] - c[0] || a[1] - c[1]).map(e => e[2]);
  for (const q of list) {
    if ((q.t === 'text' || q.t === 'pic' || q.paintOnly) && dir !== 0) continue;
    const cx = U(q.x, q.z), cy = b - q.h, tilt = side ? 0 : dir === 2 ? -(q.tilt || 0) : q.tilt || 0, glass = q.m === 'glass';
    switch (q.t) {
      case 'blob': supr(cx, cy, side ? q.rz : q.rx, q.ry, q.ev ?? 1, q.c, tilt); break;
      case 'box': { const w = side ? q.d : q.w; if (glass) glassRect(cx - w / 2, cy - q.hh / 2, w, q.hh); else rbx(cx - w / 2, cy - q.hh / 2, w, q.hh, q.r, q.c); break; }
      case 'cyl': {
        const rb = q.rb ?? q.r;
        if (q.m === 'liquid') { g.save(); g.globalAlpha = 0.6; poly([[cx - q.r, cy - q.hh / 2], [cx + q.r, cy - q.hh / 2], [cx + rb, cy + q.hh / 2], [cx - rb, cy + q.hh / 2]], q.c, true); g.restore(); break; }
        if (glass) { glassRect(cx - Math.max(q.r, rb), cy - q.hh / 2, 2 * Math.max(q.r, rb), q.hh); break; }
        poly([[cx - q.r, cy - q.hh / 2], [cx + q.r, cy - q.hh / 2], [cx + rb, cy + q.hh / 2], [cx - rb, cy + q.hh / 2]], q.c, true);
        oval(cx, cy - q.hh / 2, q.r, Math.min(q.r * 0.25, q.hh / 2), sh(q.c, 1));
        break;
      }
      case 'disc': if (side) rbx(cx - q.th / 2, cy - (q.ry ?? q.r), q.th, (q.ry ?? q.r) * 2, q.th / 2, q.c); else ovalShade(cx, cy, q.r, q.ry ?? q.r, q.c); break;
      case 'cone': {
        if (q.fwd) { if (side) poly([[cx + sg * q.hh, cy], [cx, cy - q.r], [cx, cy + q.r]], q.c); else ovalShade(cx, cy, q.r, q.r, q.c); break; }
        const s = Math.sin(tilt), c = Math.cos(tilt);
        poly([[cx + s * q.hh, cy - c * q.hh], [cx + c * q.r, cy + s * q.r], [cx - c * q.r, cy - s * q.r]], q.c);
        break;
      }
      case 'lathe': {
        const pts = q.pts.map(([r, up]) => [r, cy - up]);
        if (glass) {
          g.save(); g.globalAlpha = 0.3; g.fillStyle = '#cfe8f4';
          g.beginPath(); [...pts.map(([r, y]) => [cx - r, y]), ...pts.slice().reverse().map(([r, y]) => [cx + r, y])].forEach(p => g.lineTo(...p)); g.closePath(); g.fill();
          g.globalAlpha = 0.7; g.strokeStyle = '#eef8ff'; g.lineWidth = 0.5; g.stroke();
          const t = pts[pts.length - 1][1], f = pts[0][1], r = Math.max(...q.pts.map(p => p[0]));
          g.globalAlpha = 0.5; g.fillStyle = '#ffffff'; g.fillRect(cx - r * 0.62, t + (f - t) * 0.18, Math.max(0.8, r * 0.14), (f - t) * 0.6);
          g.restore();
          break;
        }
        poly([...pts.map(([r, y]) => [cx - r, y]), ...pts.slice().reverse().map(([r, y]) => [cx + r, y])], q.c, true);
        break;
      }
      case 'rod': {
        if (side) { ovalShade(cx, cy, q.r, q.r, q.c); break; }
        const w = q.x1 - q.x0, l = g.createLinearGradient(0, cy - q.r, 0, cy + q.r);
        l.addColorStop(0, sh(q.c, 1)); l.addColorStop(0.35, sh(q.c, 2)); l.addColorStop(0.6, q.c); l.addColorStop(1, sh(q.c, -1));
        g.fillStyle = l; g.beginPath(); g.roundRect(cx - w / 2, cy - q.r, w, q.r * 2, q.r * 0.6); g.fill();
        break;
      }
      case 'bone': boneStroke(U(q.a[0], q.a[2]), b - q.a[1], U(q.b[0], q.b[2]), b - q.b[1], q.r, q.r1, q.c); break;
      case 'swag': {
        if (side) { ovalShade(cx, cy, q.r, q.r, q.c); break; }
        const ax = U(q.x0), ay = b - q.h0, bx = U(q.x1), by = b - q.h1, mx = (ax + bx) / 2, my = (ay + by) / 2 + q.sag * 2;
        for (const [w, c] of [[q.r * 2, sh(q.c, -1)], [q.r * 1.4, q.c], [q.r * 0.45, sh(q.c, 1)]]) {
          g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round';
          g.beginPath(); g.moveTo(ax, ay - (w < q.r ? q.r * 0.4 : 0)); g.quadraticCurveTo(mx, my - (w < q.r ? q.r * 0.4 : 0), bx, by - (w < q.r ? q.r * 0.4 : 0)); g.stroke();
        }
        break;
      }
      case 'text':
        g.font = `bold ${q.size}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillStyle = q.c; g.fillText(q.s, cx, cy, q.w);
        break;
      case 'pic': {
        const x = cx - q.w / 2, y = cy - q.hh / 2;
        g.save(); g.beginPath();
        if (q.round) g.ellipse(cx, cy, q.w / 2, q.hh / 2, 0, 0, TAU); else g.rect(x, y, q.w, q.hh);
        g.clip();
        q.fn(g, x, y, q.w, q.hh);
        g.restore();
        break;
      }
      case 'fn': q.fn(g, (px) => x0 + px, (h) => b - h); break;
    }
  }
}
/** A painting-only touch, front view only. */
const FN = (z, fn) => ({ t: 'fn', x: 0, h: 0, z, fn, paintOnly: true });

/* ---------- the kinds ---------- */

/** What js/base-models-museum.js builds for each upright and wall kind: its parts. */
export const BUILT = {};

function piece(id, name, w, h, price, parts, rest = {}) {
  BUILT[id] = { parts };
  return { id, name, w, h, price, ...rest, draw(x, b, vw, dir) { floorShadow(x, b, vw); paintParts(parts, x, b, vw, dir, w * 32); } };
}
function wallPiece(id, name, w, price, parts, rest = {}) {
  BUILT[id] = { parts, wall: true };
  return { id, name, w, h: 1, layer: 'wall', price, ...rest, wall(x) { paintParts(parts, x, 96, w * 32, 0, w * 32); } };
}

/* ---------- pictures ---------- */

/** A spiral shell's face (the Helix Fossil, Omanyte): chambers winding in from the rim. */
function spiralShell(g, cx, cy, r, c, dk, turns = 2.6) {
  const s = g.createRadialGradient(cx - r * 0.3, cy - r * 0.35, 0, cx, cy, r * 1.05);
  s.addColorStop(0, sh(c, 1)); s.addColorStop(0.6, c); s.addColorStop(1, sh(c, -1));
  g.fillStyle = s; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill();
  const k = Math.log(0.12) / (turns * TAU), pt = (a) => { const rr = r * 0.94 * Math.exp(k * a); return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, rr]; };
  g.strokeStyle = dk; g.lineCap = 'round';
  g.lineWidth = Math.max(0.5, r * 0.07); g.beginPath();
  for (let a = 0; a <= turns * TAU; a += 0.12) g.lineTo(...pt(a).slice(0, 2));
  g.stroke();
  g.lineWidth = Math.max(0.35, r * 0.035);
  for (let a = 0.4; a < turns * TAU - 1; a += 0.5) {
    const [x1, y1, r1] = pt(a), [x2, y2] = pt(a + TAU);
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2 + (x1 - x2) * 0.1, y2 + (y1 - y2) * 0.1); g.stroke();
    if (r1 < r * 0.15) break;
  }
  g.fillStyle = sh(c, 2); g.globalAlpha = 0.35; g.beginPath(); g.ellipse(cx - r * 0.35, cy - r * 0.4, r * 0.3, r * 0.16, -0.6, 0, TAU); g.fill(); g.globalAlpha = 1;
}
const helixFace = (g, x, y, w, h) => spiralShell(g, x + w / 2, y + h / 2, w / 2, M.shell, M.shellD, 2.4);
/** Omanyte pressed into a slab: the stone's grain, a darker hollow, its spiral shell and tentacles. */
function omanyteSlab(g, x, y, w, h) {
  g.fillStyle = M.stone; g.fillRect(x, y, w, h);
  for (let i = 0; i < 70; i++) { g.fillStyle = hash(i, 3) < 0.5 ? sh(M.stone, 1) : sh(M.stone, -1); g.globalAlpha = 0.5; g.beginPath(); g.arc(x + hash(i, 1) * w, y + hash(i, 2) * h, 0.3 + hash(i, 4) * 0.5, 0, TAU); g.fill(); }
  g.globalAlpha = 1;
  const cx = x + w * 0.5, cy = y + h * 0.42;
  g.fillStyle = M.stoneD; g.beginPath(); g.ellipse(cx, cy + 1, w * 0.4, h * 0.42, 0, 0, TAU); g.fill();
  g.strokeStyle = sh(M.shellD, -1); g.lineCap = 'round';
  for (let i = 0; i < 6; i++) { const a = Math.PI * (0.25 + i * 0.1); g.lineWidth = 1; g.beginPath(); g.moveTo(cx + Math.cos(a) * 3, cy + 5); g.quadraticCurveTo(cx + Math.cos(a) * 7, cy + 9, cx + Math.cos(a) * 6 + (i - 2.5) * 0.6, cy + 12); g.stroke(); }
  spiralShell(g, cx, cy, w * 0.3, M.shell, M.shellD, 2.2);
}
/** The museum's floor plan: rooms, their names, the stairs and where you are. */
function museumMap(g, x, y, w, h) {
  g.fillStyle = M.paper; g.fillRect(x, y, w, h);
  g.fillStyle = M.navy; g.fillRect(x, y, w, 6.5);
  g.font = 'bold 4.4px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = M.white;
  g.fillText('MUSEUM MAP', x + w / 2, y + 3.4, w - 4);
  const rooms = [[2, 9, 20, 10, '#e8c890', 'FOSSILS'], [24, 9, 14, 10, '#a8c8e8', 'SPACE'], [40, 9, 14, 10, '#c8e0a8', 'MINERALS'],
    [2, 21, 14, 7, '#e8b0a8', 'AMBER'], [18, 21, 22, 7, '#e0dcd0', 'HALL'], [42, 21, 12, 7, '#d8c0e0', 'SHOP']];
  g.font = 'bold 2.6px system-ui, sans-serif';
  for (const [rx, ry, rw, rh, c, n] of rooms) {
    g.fillStyle = c; g.fillRect(x + rx, y + ry, rw, rh);
    g.strokeStyle = '#5a5048'; g.lineWidth = 0.5; g.strokeRect(x + rx, y + ry, rw, rh);
    g.fillStyle = M.ink; g.fillText(n, x + rx + rw / 2, y + ry + rh / 2, rw - 1);
  }
  g.fillStyle = '#5a5048'; for (let i = 0; i < 4; i++) g.fillRect(x + 32 + i * 1.2, y + 22.5 + i * 1.1, 1, 3.6 - i * 1.1);
  g.fillStyle = M.red; g.beginPath(); g.arc(x + 25, y + 25, 1.5, 0, TAU); g.fill();
  g.strokeStyle = M.white; g.lineWidth = 0.4; g.stroke();
}
/** The prehistoric world: a dusk sky, a volcano, ferns, Aerodactyl overhead and a Tyrantrum below. */
function prehistoric(g, x, y, w, h) {
  const s = g.createLinearGradient(0, y, 0, y + h);
  s.addColorStop(0, '#e86a4a'); s.addColorStop(0.5, '#f4b060'); s.addColorStop(1, '#f8d890');
  g.fillStyle = s; g.fillRect(x, y, w, h);
  g.fillStyle = '#fff0c0'; g.beginPath(); g.arc(x + w * 0.2, y + h * 0.42, 3.6, 0, TAU); g.fill();
  g.fillStyle = '#9a5a5a'; g.beginPath(); g.moveTo(x, y + h * 0.7); g.lineTo(x + w * 0.15, y + h * 0.5); g.lineTo(x + w * 0.3, y + h * 0.66); g.lineTo(x + w * 0.42, y + h * 0.56); g.lineTo(x + w * 0.5, y + h * 0.7); g.lineTo(x, y + h); g.fill();
  g.fillStyle = '#6a3a3a'; g.beginPath(); g.moveTo(x + w * 0.45, y + h); g.lineTo(x + w * 0.66, y + h * 0.3); g.lineTo(x + w * 0.74, y + h * 0.3); g.lineTo(x + w * 0.98, y + h); g.fill();
  g.fillStyle = '#ff7a2a'; g.beginPath(); g.moveTo(x + w * 0.66, y + h * 0.3); g.lineTo(x + w * 0.74, y + h * 0.3); g.lineTo(x + w * 0.72, y + h * 0.48); g.lineTo(x + w * 0.69, y + h * 0.44); g.fill();
  g.fillStyle = 'rgba(80,60,70,0.55)'; for (const [dx, dy, r] of [[0.7, 0.22, 3], [0.73, 0.14, 3.6], [0.68, 0.07, 4]]) { g.beginPath(); g.arc(x + w * dx, y + h * dy, r, 0, TAU); g.fill(); }
  g.fillStyle = '#3a2a3a';
  for (const [ax, ay, k] of [[0.34, 0.2, 1], [0.48, 0.32, 0.7]]) {
    const cx = x + w * ax, cy = y + h * ay;
    g.beginPath(); g.moveTo(cx - 6 * k, cy - 1.5 * k); g.lineTo(cx - 1.5 * k, cy); g.lineTo(cx, cy - 1 * k); g.lineTo(cx + 1.5 * k, cy); g.lineTo(cx + 6 * k, cy - 1.5 * k); g.lineTo(cx + 1, cy + 1.6 * k); g.lineTo(cx - 1, cy + 1.6 * k); g.fill();
  }
  // a Tyrantrum on the plain
  const tx = x + w * 0.22, ty = y + h * 0.86;
  g.beginPath(); g.moveTo(tx - 9, ty - 4); g.quadraticCurveTo(tx - 2, ty - 8, tx + 2, ty - 7); g.lineTo(tx + 4, ty - 11); g.lineTo(tx + 9, ty - 10.5); g.lineTo(tx + 9, ty - 8.5); g.lineTo(tx + 5, ty - 7.5); g.lineTo(tx + 4, ty - 5); g.lineTo(tx + 2, ty - 3); g.lineTo(tx + 2, ty); g.lineTo(tx, ty); g.lineTo(tx - 1, ty - 3); g.lineTo(tx - 3, ty); g.lineTo(tx - 5, ty); g.lineTo(tx - 4, ty - 3); g.closePath(); g.fill();
  g.fillStyle = '#2f5a2a'; g.fillRect(x, y + h - 3, w, 3);
  for (let i = 0; i < 9; i++) {
    const fx = x + 2 + i * w / 8.5, fy = y + h - 2;
    g.strokeStyle = i % 2 ? '#3f7a32' : '#2f6a2a'; g.lineWidth = 0.8;
    for (const a of [-1.1, -0.6, 0, 0.6, 1.1]) { g.beginPath(); g.moveTo(fx, fy); g.quadraticCurveTo(fx + Math.sin(a) * 3, fy - 4, fx + Math.sin(a) * 5, fy - 3 - Math.cos(a) * 3); g.stroke(); }
  }
}
/** A labelled specimen jar's paper label. */
const jarLabel = (n) => (g, x, y, w, h) => {
  g.fillStyle = M.paper; g.fillRect(x, y, w, h);
  g.strokeStyle = M.brassD; g.lineWidth = 0.3; g.strokeRect(x + 0.4, y + 0.4, w - 0.8, h - 0.8);
  g.font = 'bold 1.8px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = M.ink;
  g.fillText(n, x + w / 2, y + h / 2 + 0.1, w - 0.8);
};
/** The revival machine's screen: a turning helix of DNA and a progress bar. */
function dnaScreen(g, x, y, w, h) {
  g.fillStyle = M.screen; g.fillRect(x, y, w, h);
  g.strokeStyle = M.cyan; g.lineWidth = 0.5;
  for (const ph of [0, Math.PI]) { g.beginPath(); for (let i = 0; i <= 20; i++) { const t = i / 20; g.lineTo(x + 1 + t * (w - 2), y + h * 0.42 + Math.sin(t * TAU * 1.5 + ph) * h * 0.22); } g.stroke(); }
  g.fillStyle = M.green; g.fillRect(x + 1.5, y + h - 2.4, (w - 3) * 0.66, 1.2);
  g.strokeStyle = M.green; g.lineWidth = 0.3; g.strokeRect(x + 1.5, y + h - 2.4, w - 3, 1.2);
}
/** The kiosk's screen: a welcome and the floor's highlights. */
function kioskScreen(g, x, y, w, h) {
  const s = g.createLinearGradient(0, y, 0, y + h); s.addColorStop(0, '#2a4a7a'); s.addColorStop(1, '#1a2a4a');
  g.fillStyle = s; g.fillRect(x, y, w, h);
  g.font = 'bold 2.6px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = M.white;
  g.fillText('WELCOME', x + w / 2, y + 3, w - 2);
  for (let i = 0; i < 3; i++) { g.fillStyle = ['#e8c890', '#a8c8e8', '#c8e0a8'][i]; g.fillRect(x + 1.5, y + 6 + i * 4.2, w - 3, 3.2); }
  g.fillStyle = M.ink; g.font = 'bold 2px system-ui, sans-serif';
  ['Fossils', 'Space', 'Minerals'].forEach((n, i) => g.fillText(n, x + w / 2, y + 7.7 + i * 4.2, w - 4));
}

/* ---------- the dig site, seen from above (64 x 64): a sandy pit, a half-dug skeleton, its grid of strings ---------- */

export const DIG = {
  pegs: [[6, 6], [32, 5], [58, 6], [5, 32], [59, 32], [6, 58], [32, 59], [58, 58]],
  spine: [[19, 22], [26, 28], [33, 33], [40, 38], [46, 44], [50, 50]],
  skull: [14, 17, 6, 4.6],
  ribs: [[26, 28], [30, 31], [34, 34], [38, 37]],
  bucket: [53, 13, 5],
};

/* ---------- the kinds ---------- */

export const MUSEUM_KINDS = [
  // Kabutops, stood up on its plinth, its scythes raised
  piece('muskabutops', 'Kabutops skeleton', 1, 1, 1400, [
    ...plinth(16, 26, 22, 8),
    CY(16, 24, -5, 0.9, 30, M.rod, metal()),
    ...spine([[16, 31, -3], [16, 24, -7], [17, 18, -9], [19, 13, -10]], 4, 2, 0.9),
    ...[-1, 1].flatMap(s => [
      BN([16 + s * 4, 31, 0], [16 + s * 6.5, 22, 3], 1.6, M.bone, { r1: 1.3 }), B(16 + s * 6.5, 22, 3, 1.8, 1.8, 1.8, M.joint, { m: 'plain' }),
      BN([16 + s * 6.5, 22, 3], [16 + s * 5, 12, 0], 1.3, M.bone, { r1: 1.1 }), B(16 + s * 5, 11.5, 0, 1.4, 1.4, 1.4, M.joint, { m: 'plain' }),
      BN([16 + s * 5, 10.4, 0], [16 + s * 6.5, 10.2, 6], 1, M.bone, { r1: 0.5 }), BN([16 + s * 5, 10.4, 0], [16 + s * 3.5, 10.2, 5.5], 0.8, M.bone, { r1: 0.4 }),
    ]),
    B(16, 32, 0, 6, 3, 3.5, M.bone),
    ...spine([[16, 34, -1.5], [16, 46, -2.5], [16, 57, -1.5]], 6, 2, 1.6),
    ...[40, 44.5, 49, 53.5].flatMap(h => [-1, 1].flatMap(s => [
      BN([16, h, -1.5], [16 + s * 7, h - 2, 1], 0.9, M.bone, { r1: 0.8, seg: 6 }), BN([16 + s * 7, h - 2, 1], [16 + s * 4.5, h - 5, 4.5], 0.8, M.bone, { r1: 0.6, seg: 6 }),
    ])),
    ...[-1, 1].flatMap(s => [
      B(16 + s * 6, 55, -2.5, 2.6, 3.2, 1.2, M.boneD),
      BN([16 + s * 6, 55, 0], [16 + s * 10, 61, 2], 1.5, M.bone, { r1: 1.2 }), B(16 + s * 10.2, 61.3, 2, 1.7, 1.7, 1.7, M.joint, { m: 'plain' }),
      BN([16 + s * 10.5, 62, 2], [16 + s * 12.6, 71, 3], 2.1, M.bone, { r1: 1.5 }),
      BN([16 + s * 12.6, 71, 3], [16 + s * 11.5, 80, 4], 1.5, M.bone, { r1: 0.8 }),
      BN([16 + s * 11.5, 80, 4], [16 + s * 8.5, 85, 4.5], 0.8, M.bone, { r1: 0.25 }),
    ]),
    ...spine([[16, 58, -1.5], [16, 62.5, 0]], 3, 1.6, 1.4),
    CN(16, 69, -2.5, 3.2, 11, M.boneD),
    B(16, 67, 1, 5, 4.6, 5.5, M.bone),
    B(16, 63.2, 3, 3.6, 1.5, 3.2, M.boneD),
    DZ(13.8, 67.6, 6, 1.4, 0.6, M.joint, { m: 'plain' }), DZ(18.2, 67.6, 6, 1.4, 0.6, M.joint, { m: 'plain' }),
  ]),

  // Aerodactyl in flight on a tall stand, wings spread, rods up to its elbows
  piece('musaerodactyl', 'Aerodactyl skeleton', 2, 2, 2200, [
    ...plinth(32, 30, 26, 6),
    CY(32, 33, 0, 1.4, 52, M.rod, metal()), B(32, 59, 0, 2.6, 1.6, 2.6, M.rod, metal()),
    ...[-1, 1].map(s => BN([32, 57, 0], [32 + s * 11, 85, -2], 0.5, M.rod, metal({ seg: 6 }))),
    B(32, 64, -1, 4.5, 3, 3, M.bone),
    ...spine([[32, 62, -3], [32, 56, -6], [32, 50, -7]], 4, 1.3, 0.6),
    ...[-1, 1].flatMap(s => [
      BN([32 + s * 3, 63, 0], [32 + s * 5, 55, 2], 1.1, M.bone, { r1: 0.9 }), B(32 + s * 5, 55, 2, 1.2, 1.2, 1.2, M.joint, { m: 'plain' }),
      BN([32 + s * 5, 55, 2], [32 + s * 4.5, 48, 0], 0.9, M.bone, { r1: 0.7 }),
      ...[-1, 0, 1].map(i => CN(32 + s * 4.5 + i * 1.1, 48, 0.5, 0.5, 2.6, M.boneD, { tilt: Math.PI + i * 0.3 })),
    ]),
    ...spine([[32, 66, -2], [32, 74, -3], [32, 81, -2]], 5, 2, 1.6),
    ...[68, 71.5, 75, 78.5].flatMap(h => [-1, 1].flatMap(s => [
      BN([32, h, -2], [32 + s * 5, h - 1.5, 0], 0.75, M.bone, { r1: 0.7, seg: 6 }), BN([32 + s * 5, h - 1.5, 0], [32 + s * 3, h - 4, 3], 0.65, M.bone, { r1: 0.5, seg: 6 }),
    ])),
    ...[-1, 1].flatMap(s => [
      B(32 + s * 3.5, 80, -2.5, 2.4, 1.6, 1.2, M.boneD),
      BN([32 + s * 3, 80, -1], [32 + s * 11, 86, -2], 1.4, M.bone, { r1: 1.1 }), B(32 + s * 11, 86, -2, 1.5, 1.5, 1.5, M.joint, { m: 'plain' }),
      BN([32 + s * 11, 86, -2], [32 + s * 19, 83, -3], 1.1, M.bone, { r1: 0.9 }), B(32 + s * 19, 83, -3, 1.3, 1.3, 1.3, M.joint, { m: 'plain' }),
      BN([32 + s * 19, 83, -3], [32 + s * 18, 89, -1], 0.5, M.bone, { r1: 0.2, seg: 6 }), BN([32 + s * 19, 83, -3], [32 + s * 21, 89, -1], 0.5, M.bone, { r1: 0.2, seg: 6 }),
      BN([32 + s * 19, 83, -3], [32 + s * 26, 92, -4], 0.9, M.bone, { r1: 0.75 }), B(32 + s * 26, 92, -4, 1, 1, 1, M.joint, { m: 'plain' }),
      BN([32 + s * 26, 92, -4], [32 + s * 30, 98, -4], 0.75, M.bone, { r1: 0.55 }),
      BN([32 + s * 30, 98, -4], [32 + s * 31, 105, -3.5], 0.55, M.bone, { r1: 0.2 }),
    ]),
    ...spine([[32, 82, -2], [32, 88, 0], [32, 92, 3]], 4, 1.4, 1.1),
    BN([32, 96, 1], [32, 100, -8], 2, M.boneD, { r1: 0.3 }),
    B(32, 94, 4, 4, 3.8, 5, M.bone),
    BN([32, 93, 7], [32, 92, 15], 2.2, M.bone, { r1: 0.6 }), BN([32, 90.5, 6], [32, 89.6, 13.5], 1.6, M.boneD, { r1: 0.5 }),
    ...[9, 11, 13].flatMap(z => [-1, 1].map(s => CN(32 + s * 1.1, 91.2, z, 0.45, 1.4, M.tooth, { tilt: Math.PI, m: 'gloss' }))),
    DZ(29.8, 95.2, 8, 1.2, 0.5, M.joint, { m: 'plain' }), DZ(34.2, 95.2, 8, 1.2, 0.5, M.joint, { m: 'plain' }),
  ]),

  // Tyrantrum, the showpiece: side on across three tiles, jaws open over the hall
  piece('mustyrantrum', 'Tyrantrum skeleton', 3, 2, 2500, [
    ...plinth(48, 88, 36, 6),
    CY(42, 27, 0, 1.2, 40, M.rod, metal()), CY(60, 32, 0, 1.2, 50, M.rod, metal()), CY(14, 25, 0, 1, 36, M.rod, metal()),
    ...spine([[36, 54, 0], [24, 57, 0], [12, 54, 0], [3, 46, 0]], 10, 3.2, 1, 'x'),
    ...[-1, 1].flatMap(s => [
      BN([42, 50, s * 5], [48, 34, s * 8], 3, M.bone, { r1: 2.4 }), B(48, 34, s * 8, 2.8, 2.8, 2.8, M.joint, { m: 'plain' }),
      BN([48, 34, s * 8], [42, 17, s * 8], 2.2, M.bone, { r1: 1.8 }), B(42, 17, s * 8, 2, 2, 2, M.joint, { m: 'plain' }),
      BN([42, 17, s * 8], [46, 9.5, s * 8], 1.7, M.bone, { r1: 1.4 }),
      BN([46, 8.6, s * 8], [55, 8.4, s * 9], 1.2, M.bone, { r1: 0.5 }), BN([46, 8.6, s * 8], [53, 8.4, s * 5], 1, M.bone, { r1: 0.4 }),
      BN([46, 8.6, s * 8], [40.5, 8.4, s * 8], 0.8, M.bone, { r1: 0.3 }),
    ]),
    B(42, 53, 0, 8, 5, 5.5, M.bone),
    ...spine([[44, 57, 0], [54, 61.5, 0], [64, 64, 0]], 6, 3, 2.6, 'x'),
    ...spine([[67, 67, 0], [71.5, 72, 0], [75, 76, 0]], 3, 2.5, 2.3, 'x'),
    ...[[48, 59], [52, 60.5], [56, 62], [60, 63]].flatMap(([x, h], i) => [-1, 1].flatMap(s => [
      BN([x, h, 0], [x + 1, h - 8, s * 7.5], 1.1, M.bone, { r1: 0.9, seg: 6 }), BN([x + 1, h - 8, s * 7.5], [x + 3, h - 16 + i, s * 3], 0.9, M.bone, { r1: 0.6, seg: 6 }),
    ])),
    ...[-1, 1].flatMap(s => [
      BN([64, 57, s * 5], [67, 51, s * 7], 1.2, M.bone, { r1: 1 }), BN([67, 51, s * 7], [70.5, 52, s * 7], 0.9, M.bone, { r1: 0.6 }),
      CN(70.5, 52, s * 7, 0.5, 2, M.boneD, { tilt: 2.4 }),
    ]),
    ...[[73, 85, -0.9], [75.5, 87, -0.5], [78.5, 88, -0.2]].map(([x, h, t]) => CN(x, h, -1, 1.7, 6, M.boneD, { tilt: t })),
    B(83, 80, 0, 11, 7.5, 6, M.bone, { ev: 0.85 }),
    B(92, 77, 0, 4, 4, 4.6, M.bone),
    B(84, 71, 0, 10, 2.6, 5, M.boneD, { ev: 0.75 }),
    ...[77, 80, 83, 86, 89, 92].flatMap(x => [CN(x, 74, 4, 0.75, 2.6, M.tooth, { tilt: Math.PI, m: 'gloss' }), CN(x, 74, -4, 0.75, 2.6, M.tooth, { tilt: Math.PI, m: 'gloss' })]),
    ...[79, 83, 87].map(x => CN(x, 72.8, 3.6, 0.6, 2, M.tooth, { m: 'gloss' })),
    DZ(79, 83, 5.6, 2.1, 0.6, M.joint, { m: 'plain' }), DZ(85.5, 79, 5.8, 1.6, 0.6, M.joint, { m: 'plain' }), DZ(93, 79.5, 4.4, 0.9, 0.4, M.joint, { m: 'plain' }),
  ]),

  // Old Amber in a glass case on a pedestal, lit from inside
  piece('musamber', 'Old Amber case', 1, 1, 900, [
    BX(16, 1, 0, 24, 2, 22, M.woodD, { m: 'wood' }),
    BX(16, 15, 0, 22, 26, 20, M.wood, { m: 'wood' }),
    BX(16, 28.6, 0, 24, 1.6, 22, M.woodD, { m: 'wood' }),
    BX(16, 19, 10.3, 11, 4, 0.6, M.brass, metal({ r: 0.4 })), TX('OLD AMBER', 16, 19, 10.7, 1.7, 10, M.ink),
    CY(16, 30.4, 0, 3.2, 1.6, M.brass, metal()),
    B(16, 37, 0, 5, 5.6, 4.4, M.amber, { m: 'glow' }), B(14.6, 38.6, 2, 2.4, 2.6, 2.2, M.amberL, { m: 'glow' }),
    FN(4.6, (g, X, Y) => { g.fillStyle = '#5a3010'; g.beginPath(); g.ellipse(X(17), Y(36), 1, 0.6, 0.5, 0, TAU); g.fill(); g.strokeStyle = '#5a3010'; g.lineWidth = 0.25; g.beginPath(); g.moveTo(X(16.3), Y(36.4)); g.lineTo(X(15.2), Y(37.6)); g.moveTo(X(17.7), Y(36.4)); g.lineTo(X(18.8), Y(37.4)); g.stroke(); }),
    BX(16, 41, 0, 20, 22, 18, '#cfe8f4', GLASS),
    ...[[-1, -1], [1, -1]].map(([sx, sz]) => BX(16 + sx * 9.6, 41, sz * 8.6, 0.9, 22, 0.9, M.woodD, { m: 'wood', r: 0.3 })),
    ...[[-1, 1], [1, 1]].map(([sx, sz]) => BX(16 + sx * 9.6, 41, sz * 8.6, 0.9, 22, 0.9, M.woodD, { m: 'wood', r: 0.3, k: 60 })),
    BX(16, 53, 0, 22, 2, 20, M.woodD, { m: 'wood' }),
    LA(16, 54, 0, [[3.4, 0], [3.4, 0.8], [2, 2.6], [0, 3]], M.brass, metal()),
  ], { glow: [M.amber, M.amberL] }),

  // a dig site: a sandy pit strung out in squares, a skeleton half dug, the trowel, brush and bucket left by it
  { id: 'musdig', name: 'Dig site', w: 2, h: 2, layer: 'rug', price: 800, high: 0.04, side: 'p', flat() {
    const g = ctx();
    g.fillStyle = M.sandD; g.beginPath(); g.roundRect(1, 1, 62, 62, 6); g.fill();
    g.fillStyle = M.sand; g.beginPath(); g.roundRect(3, 3, 58, 58, 5); g.fill();
    for (let i = 0; i < 260; i++) R(3 + hash(i, 7) * 57, 3 + hash(i, 8) * 57, 0.7, 0.7, hash(i, 9) < 0.5 ? sh(M.sand, -1) : sh(M.sand, 1));
    oval(32, 34, 24, 20, sh(M.sand, -1)); oval(32, 34.5, 21.5, 17.5, M.sandD);
    for (let i = 0; i < 120; i++) { const a = hash(i, 11) * TAU, d = Math.sqrt(hash(i, 12)); R(32 + Math.cos(a) * d * 20, 34.5 + Math.sin(a) * d * 16, 0.6, 0.6, sh(M.sandD, -1)); }
    // the skeleton, dug out up its spine and still buried past the hips
    const [sx, sy, srx, sry] = DIG.skull;
    for (const [x, y] of DIG.ribs) for (const s of [-1, 1]) { g.strokeStyle = M.boneD; g.lineWidth = 1.3; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + s * 5, y - s * 3, x + s * 7, y - s * 7 + 3); g.stroke(); }
    g.strokeStyle = M.joint; g.lineWidth = 1; g.beginPath(); DIG.spine.forEach(([x, y]) => g.lineTo(x, y)); g.stroke();
    DIG.spine.forEach(([x, y], i) => { ovalShade(x, y, 2.4 - i * 0.2, 2 - i * 0.15, M.bone); });
    g.globalAlpha = 0.55; oval(51, 51, 5, 4, M.sand); g.globalAlpha = 1;
    ovalShade(sx, sy, srx, sry, M.bone);
    oval(sx - 1.6, sy - 1, 1.3, 1.1, M.joint); oval(sx + 2, sy + 1.2, 1.1, 0.9, M.joint);
    for (let i = 0; i < 4; i++) oval(sx - 4 + i * 1.5, sy + 3.2 + i * 0.6, 0.5, 0.9, M.tooth);
    // the grid of strings between the pegs
    g.strokeStyle = '#8a5a30'; g.lineWidth = 0.6;
    for (const v of [6, 32, 58]) { g.beginPath(); g.moveTo(6, v); g.lineTo(58, v); g.stroke(); g.beginPath(); g.moveTo(v, 6); g.lineTo(v, 58); g.stroke(); }
    for (const [x, y] of DIG.pegs) { oval(x, y + 0.6, 1.6, 1.6, 'rgba(60,40,20,0.35)'); ovalShade(x, y, 1.4, 1.4, M.woodL); }
    // a trowel and a brush
    g.save(); g.translate(13, 49); g.rotate(-0.6);
    R(-1, -0.6, 7, 1.4, M.wood); g.fillStyle = M.steel; g.beginPath(); g.moveTo(6, -2.6); g.lineTo(13, 0); g.lineTo(6, 2.6); g.closePath(); g.fill();
    g.restore();
    g.save(); g.translate(44, 14); g.rotate(0.4);
    R(-5, -0.6, 7, 1.2, M.woodL); R(2, -1.6, 3.6, 3.2, '#3a2a20'); R(5.4, -1.8, 1.4, 3.6, '#c8a060');
    g.restore();
    const [bx, by, br] = DIG.bucket;
    ovalShade(bx, by, br, br, M.steelD); oval(bx, by, br - 1, br - 1, M.sandD); oval(bx - 1, by - 1, 1.2, 1, sh(M.sandD, 1));
  } },

  // brass posts and a red velvet rope, to keep the visitors back
  piece('musropes', 'Museum ropes', 2, 1, 300, [
    ...[6, 58].flatMap(x => [
      LA(x, 0, 0, [[5, 0], [5, 1.2], [3.6, 2.2], [1.4, 3.6], [0, 3.8]], M.brass, metal()),
      CY(x, 18, 0, 1.1, 30, M.brass, metal()),
      CY(x, 32.5, 0, 1.8, 1.6, M.brass, metal()),
      B(x, 35, 0, 2.2, 2.2, 2.2, M.brass, metal()),
    ]),
    B(8.6, 31, 0, 1.3, 1.3, 1.3, M.brassD, metal()), B(55.4, 31, 0, 1.3, 1.3, 1.3, M.brassD, metal()),
    SW(8.6, 31, 55.4, 31, 0, 8, 1.5, M.rope, { m: 'cloth' }),
  ]),

  // an exhibit's brass plaque, on a wooden board
  wallPiece('musplaque', 'Exhibit plaque', 1, 200, [
    BX(16, 54, 0.8, 26, 20, 1.6, M.woodD, { m: 'wood' }),
    BX(16, 54, 1.9, 22.5, 16.5, 0.6, M.brass, metal({ r: 0.6 })),
    TX('KABUTOPS', 16, 59, 2.3, 3.2, 18, M.ink), TX('Shellfish Pokémon', 16, 54.6, 2.3, 2, 19, M.ink), TX('Found in Mt. Moon', 16, 51.2, 2.3, 1.9, 19, M.ink),
    ...[[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sy]) => DZ(16 + sx * 9.6, 54 + sy * 6.6, 2.3, 0.55, 0.4, M.brassD, metal())),
  ]),

  // the Helix Fossil on a marble column, in a little brass cradle
  piece('mushelix', 'Helix Fossil pedestal', 1, 1, 450, [
    LA(16, 0, 0, [[9, 0], [9, 2], [7.4, 3], [6, 4.2], [6, 24], [7.4, 25], [8.6, 26.8], [8.6, 28.4], [0, 28.4]], M.marble),
    BX(16, 14, 6.2, 8, 3, 0.5, M.brass, metal({ r: 0.4 })), TX('HELIX', 16, 14, 6.5, 1.8, 7, M.ink),
    BX(16, 29.4, 0, 9, 2, 6, M.rod, metal({ r: 0.5 })),
    BN([12, 29.4, 0], [10.8, 35, 1], 0.55, M.rod, metal({ seg: 6 })), BN([20, 29.4, 0], [21.2, 35, 1], 0.55, M.rod, metal({ seg: 6 })),
    DZ(16, 39.5, 0, 9, 5, M.shellD),
    PIC(16, 39.5, 2.6, 17.4, 17.4, helixFace, { round: true }),
  ]),

  // the Dome Fossil on a velvet cushion, on a square plinth
  piece('musdome', 'Dome Fossil pedestal', 1, 1, 450, [
    BX(16, 1, 0, 20, 2, 20, M.marbleD), BX(16, 14, 0, 18, 24, 18, M.marble), BX(16, 26.8, 0, 20, 1.6, 20, M.marbleD),
    BX(16, 14, 9.3, 8, 3, 0.5, M.brass, metal({ r: 0.4 })), TX('DOME', 16, 14, 9.6, 1.8, 7, M.ink),
    B(16, 29.4, 0, 9, 2, 8, M.velvet, { m: 'cloth', ev: 0.5, e: 0.6 }),
    LA(16, 30.4, 0, [[8.6, 0], [8.6, 1.2], [8, 3.6], [6.8, 6], [4.8, 8], [2.4, 9.2], [0, 9.6]], M.dome, { m: 'gloss' }),
    BN([16, 31, 8.6], [16, 39.7, 1], 0.6, sh(M.dome, -1), { m: 'gloss', seg: 6 }),
    DZ(12.6, 34.6, 6.6, 1.3, 0.6, '#2a1a10', { m: 'gloss' }), DZ(19.4, 34.6, 6.6, 1.3, 0.6, '#2a1a10', { m: 'gloss' }),
  ]),

  // Omanyte pressed into a slab of stone, hung on brass pegs
  wallPiece('musomanyte', 'Omanyte fossil slab', 1, 500, [
    BX(16, 56, 1.5, 26, 26, 3, M.stone, { r: 3 }),
    PIC(16, 56, 3.05, 21, 21, omanyteSlab),
    BX(7, 42, 1.6, 3, 2, 3.2, M.brassD, metal({ r: 0.5 })), BX(25, 42, 1.6, 3, 2, 3.2, M.brassD, metal({ r: 0.5 })),
    BX(16, 39.6, 1, 12, 2.8, 1, M.brass, metal({ r: 0.4 })), TX('OMANYTE', 16, 39.6, 1.6, 1.7, 10, M.ink),
  ]),

  // the Root Fossil and the Claw Fossil on a stepped stand
  piece('musroot', 'Root and Claw Fossils', 1, 1, 550, [
    BX(16, 7, 0, 28, 14, 22, M.marble), BX(22.5, 19, -3, 14, 10, 15, M.marble),
    BX(9, 7, 11.3, 9, 2.8, 0.5, M.brass, metal({ r: 0.4 })), TX('ROOT', 9, 7, 11.6, 1.6, 7, M.ink),
    BX(22.5, 19, 4.8, 9, 2.8, 0.5, M.brass, metal({ r: 0.4 })), TX('CLAW', 22.5, 19, 5.1, 1.6, 7, M.ink),
    B(9, 18, 2, 5.6, 4.4, 4.8, M.stone, { ev: 0.85, e: 0.85 }),
    ...[[6, 16, 6, 3.4, 13, 6.4], [9, 15.6, 6.4, 9.6, 13.2, 7.4], [12, 16, 6, 14, 14, 6.4], [7.5, 20, 5.8, 5, 23, 4.4], [11, 20.5, 5.6, 13.6, 23.5, 3.4]]
      .map(([x0, h0, z0, x1, h1, z1]) => BN([x0, h0, z0], [x1, h1, z1], 0.6, '#7a5a3a', { r1: 0.3, m: 'plain', seg: 6 })),
    B(22.5, 28, -1, 5.4, 4, 4.6, M.stoneL, { ev: 0.85, e: 0.85 }),
    ...[[19.6, 28.5, 2.5, 18, 35, 4.5], [22.5, 30, 2.8, 22.2, 37, 4.8], [25.4, 28.5, 2.5, 27.4, 35, 4.5]]
      .flatMap(([x0, h0, z0, x1, h1, z1]) => [BN([x0, h0, z0], [x1, h1, z1], 1, M.bone, { r1: 0.6, seg: 6 }), BN([x1, h1, z1], [x1 + (x1 - x0) * 0.3 + 0.8, h1 + 1.8, z1 + 1], 0.6, M.boneD, { r1: 0.15, seg: 6 })]),
  ]),

  // the Skull Fossil: Cranidos's thick-domed head, on a plinth
  piece('muscranidos', 'Cranidos skull', 1, 1, 700, [
    ...plinth(16, 22, 18, 20),
    CY(16, 25, 0, 1, 7, M.rod, metal()),
    ...[-1, 1].flatMap(s => [CN(16 + s * 7.2, 40.5, -3, 1.6, 4.4, M.boneD, { tilt: s * 1.1 }), CN(16 + s * 4.6, 44.5, -4.5, 1.4, 3.6, M.boneD, { tilt: s * 0.6 })]),
    B(16, 38, -1, 8, 7.5, 8, M.bone, { ev: 0.9 }),
    B(16, 33, 4, 6, 4.5, 4.5, M.bone),
    B(16, 29, 3, 5.4, 1.7, 4, M.boneD),
    DZ(13, 35.6, 7.1, 1.6, 0.6, M.joint, { m: 'plain' }), DZ(19, 35.6, 7.1, 1.6, 0.6, M.joint, { m: 'plain' }),
    DZ(15, 31.8, 8.2, 0.6, 0.4, M.joint, { m: 'plain' }), DZ(17, 31.8, 8.2, 0.6, 0.4, M.joint, { m: 'plain' }),
    ...[12.5, 14.3, 16, 17.7, 19.5].map(x => CN(x, 30.4, 7, 0.5, 1.6, M.tooth, { tilt: Math.PI, m: 'gloss' })),
  ]),

  // a chunk of meteorite with a Moon Stone set in it, glowing faintly
  piece('musmeteor', 'Moon Stone meteorite', 1, 1, 650, [
    ...plinth(16, 24, 20, 14),
    BN([8, 15.4, 0], [8.6, 20, 1.5], 0.6, M.brass, metal({ seg: 6 })), BN([24, 15.4, 0], [23.4, 20, 1.5], 0.6, M.brass, metal({ seg: 6 })),
    B(16, 24, 0, 10, 8.4, 8.4, M.rock, { ev: 0.8, e: 0.85 }),
    B(10, 21, 2, 5, 5, 5, M.rockD, { ev: 0.85, e: 0.85 }), B(22, 27, -2, 6, 5, 5, M.rockD, { ev: 0.85, e: 0.85 }), B(17, 30.5, 1, 5, 3.6, 4.2, M.rock),
    DZ(11.5, 26, 6.6, 1.4, 0.4, M.rockD, { m: 'plain' }), DZ(20, 19.5, 7.2, 1.2, 0.4, M.rockD, { m: 'plain' }),
    B(17, 25.5, 6.4, 3.4, 4.2, 2.4, M.moon, { m: 'glow' }), B(15.8, 26.8, 7.6, 1.4, 1.8, 1.2, M.moonL, { m: 'glow' }),
  ], { glow: [M.moon, M.moonL] }),

  // a wooden cabinet, its glass top full of finds: a pot, a tablet, old coins, arrowheads, a fossil tooth
  piece('muscase', 'Museum display case', 2, 1, 1100, [
    BX(32, 1, 0, 58, 2, 24, M.woodD, { m: 'wood' }),
    BX(32, 14, 0, 60, 24, 26, M.wood, { m: 'wood', r: 1.5 }),
    BX(17, 14, 13.2, 24, 18, 0.6, M.woodL, { m: 'wood' }), BX(47, 14, 13.2, 24, 18, 0.6, M.woodL, { m: 'wood' }),
    B(29.5, 14, 13.9, 0.9, 0.9, 0.6, M.brass, metal()), B(34.5, 14, 13.9, 0.9, 0.9, 0.6, M.brass, metal()),
    BX(32, 26.8, 0, 62, 1.6, 28, M.woodD, { m: 'wood' }),
    BX(32, 27.8, 0, 58, 0.4, 24, M.velvet, { m: 'cloth', r: 0.1 }),
    LA(11, 28, -2, [[2.4, 0], [4, 3], [4.6, 7], [3.2, 11], [2.2, 12.6], [3, 14], [0, 14]], M.terra),
    FN(2.7, (g, X, Y) => { g.fillStyle = '#3a2418'; g.fillRect(X(7), Y(34.4), 8, 0.8); g.fillRect(X(7.4), Y(36.4), 7.2, 0.5); }),
    BX(23, 33, -4, 9, 10, 1.5, M.stoneL, { r: 0.8, tilt: 0 }),
    FN(-3, (g, X, Y) => { g.fillStyle = M.stoneD; for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) g.fillRect(X(19.6 + j * 2.4), Y(36.4 - i * 2), 1.4, 0.7); }),
    CY(33, 28.4, 3, 2.4, 0.7, M.gold, metal()), CY(37.5, 28.4, 6, 2.1, 0.7, M.gold, metal()), CY(35, 29.1, 1, 2.2, 0.7, M.brassD, metal()),
    B(47, 28.6, 2, 6, 0.9, 4.5, M.navy, { m: 'cloth' }),
    ...[43.5, 47, 50.5].map((x, i) => CN(x, 29.6, 2 + (i - 1) * 1.5, 1.2, 3.2, '#4a4a52', { tilt: 0.5 + i * 0.4, m: 'gloss' })),
    CN(55, 28, -3, 1.6, 6, M.tooth, { tilt: 0.25, m: 'gloss' }),
    BX(32, 38, 0, 58, 20, 24, '#cfe8f4', GLASS),
    ...[-1, 1].map(sx => BX(32 + sx * 28.6, 38, -11.6, 1, 20, 1, M.woodD, { m: 'wood', r: 0.3 })),
    ...[-1, 1].map(sx => BX(32 + sx * 28.6, 38, 11.6, 1, 20, 1, M.woodD, { m: 'wood', r: 0.3, k: 60 })),
    BX(32, 48.6, 0, 60, 1.2, 26, M.woodD, { m: 'wood', r: 0.4 }),
  ]),

  // Tyrunt's Jaw Fossil under a bell jar, on a round side table
  piece('musglassdome', 'Jaw Fossil bell jar', 1, 1, 600, [
    LA(16, 0, 0, [[8, 0], [8, 1.5], [5.4, 3], [3.4, 5], [3, 14], [3.4, 23], [6.4, 26], [9, 27.4], [9, 29], [0, 29]], M.woodD, { m: 'wood' }),
    CY(16, 30, 0, 8, 2, M.wood, { m: 'wood' }),
    CY(16, 31.6, 0, 1, 1.4, M.rod, metal()),
    BN([9, 33.6, 0], [22.5, 32.6, 0], 1.6, M.bone, { r1: 1.1 }), BN([9.4, 33, 0], [8.4, 39.5, -0.5], 1.4, M.boneD, { r1: 1 }),
    ...[12, 14.2, 16.4, 18.6, 20.8].map(x => CN(x, 34.6, 0.4, 0.6, 2.4 - (x - 12) * 0.08, M.tooth, { m: 'gloss' })),
    LA(16, 31, 0, [[7.5, 0], [7.5, 20], [6.6, 23.5], [4.2, 25.5], [0, 26.2]], '#cfe8f4', GLASS),
    B(16, 58, 0, 1.6, 1.6, 1.6, '#cfe8f4', GLASS),
  ]),

  // the machine that brings a fossil back: a glowing chamber, its console and a gas tank
  piece('musrevival', 'Fossil revival machine', 2, 1, 1800, [
    BX(32, 6, 0, 62, 12, 28, '#d8dce4', { m: 'gloss', r: 2 }),
    BX(32, 11.6, 13.8, 60, 1.2, 0.6, M.yellow, { m: 'plain', r: 0.2 }),
    CY(6, 26, -2, 3.4, 28, '#4a6aa8', { m: 'gloss' }), LA(6, 40, -2, [[3.4, 0], [2.4, 2], [1, 3], [1, 4.4], [0, 4.4]], M.steel, metal()),
    BN([6, 44, -2], [14, 50, -2], 0.8, M.steel, metal({ seg: 6 })),
    CY(26, 13.5, 0, 12, 3, M.steel, metal()),
    CY(26, 15.6, 0, 10.4, 1.2, M.liquid, { m: 'glow' }),
    B(26, 31, 0, 5, 3.6, 4.2, M.dome, { m: 'gloss' }), DZ(24, 31.6, 4, 1, 0.5, '#2a1a10', { m: 'gloss' }), DZ(28, 31.6, 4, 1, 0.5, '#2a1a10', { m: 'gloss' }),
    CY(26, 30, 0, 10.2, 28, M.liquid, { m: 'liquid', k: 40 }),
    CY(26, 32, 0, 11, 40, '#cfe8f4', { m: 'glass', k: 50 }),
    LA(26, 52, 0, [[12, 0], [12, 3], [8, 6], [3, 8], [3, 11], [0, 11]], M.steel, metal()),
    BN([28, 60, 0], [44, 60, -6], 1.3, M.steel, metal({ seg: 6 })), BN([44, 60, -6], [47, 49, -6], 1.3, M.steel, metal({ seg: 6 })),
    BX(52, 30, -2, 20, 36, 22, '#e8eaf0', { m: 'gloss', r: 2 }),
    BX(52, 38, 9.2, 16, 11, 0.6, M.screen, { m: 'glow' }), PIC(52, 38, 9.6, 15, 10, dnaScreen),
    DZ(46.5, 28, 9.4, 1.4, 0.8, M.red, { m: 'glow' }), DZ(52, 28, 9.4, 1.4, 0.8, M.green, { m: 'glow' }), DZ(57.5, 28, 9.4, 1.4, 0.8, M.yellow, { m: 'glow' }),
    BX(52, 19.5, 9.4, 12, 3.4, 1, M.ink, { m: 'gloss', r: 0.6 }),
    BN([59, 21, 9], [59, 25, 12], 0.6, M.steel, metal({ seg: 6 })), B(59, 25, 12, 1.1, 1.1, 1.1, M.red, { m: 'gloss' }),
  ], { glow: [M.liquid, M.screen, M.cyan, M.red, M.green, M.yellow] }),

  // an info kiosk: a tall stand with a touch screen and a pocket of leaflets
  piece('muskiosk', 'Museum info kiosk', 1, 1, 700, [
    BX(16, 1.5, 0, 20, 3, 14, M.ink, { m: 'gloss', r: 1 }),
    BX(16, 40, -1, 18, 74, 10, M.navy, { m: 'gloss', r: 2 }),
    BX(16, 72, 4.3, 16, 6, 0.6, M.white, { m: 'gloss', r: 0.6 }),
    DZ(10, 72, 4.8, 2.3, 0.4, M.navy, { m: 'gloss' }), TX('i', 10, 72, 5.1, 3.4, 3, M.white), TX('INFO', 18.5, 72, 4.8, 3.5, 10, M.navy),
    BX(16, 56, 4.3, 16, 19, 0.6, M.screen, { m: 'glow' }), PIC(16, 56, 4.65, 15, 18, kioskScreen),
    BX(16, 26, 5, 14, 9, 2.4, '#cfe8f4', GLASS),
    BX(11.5, 27, 5, 4, 8, 1, '#e8c890', { m: 'plain', r: 0.2 }), BX(16, 27.4, 5, 4, 8, 1, '#a8c8e8', { m: 'plain', r: 0.2 }), BX(20.5, 27, 5, 4, 8, 1, '#c8e0a8', { m: 'plain', r: 0.2 }),
  ], { glow: [M.screen] }),

  // a long backless bench in red leather, for sitting with the exhibits
  piece('musbench', 'Museum bench', 2, 1, 400, [
    BX(9, 7, 0, 6, 14, 18, M.steelD, metal({ r: 0.8 })), BX(55, 7, 0, 6, 14, 18, M.steelD, metal({ r: 0.8 })),
    RD(9, 55, 5, 0, 1.4, M.steelD, metal()),
    BX(32, 14.8, 0, 62, 2.6, 22, M.wood, { m: 'wood' }),
    BX(32, 19, 0, 60, 5.6, 20, M.leather, { m: 'cloth', r: 2 }),
  ]),

  // the desk you buy your tickets at, the museum's sign over it
  piece('musticket', 'Museum ticket desk', 2, 1, 900, [
    BX(32, 18, 2, 60, 36, 18, M.wood, { m: 'wood' }),
    BX(32, 21, 11.3, 50, 22, 0.6, M.navy, { m: 'gloss', r: 1 }),
    TX('TICKETS', 32, 25, 11.8, 5.4, 36, M.gold), TX('Adults 50 · Kids 20', 32, 18, 11.8, 2.6, 36, M.white),
    BX(32, 37, 2, 62, 2, 20, M.woodL, { m: 'wood' }),
    CY(6, 54, -6, 1, 32, M.brass, metal()), CY(58, 54, -6, 1, 32, M.brass, metal()),
    BX(32, 66, -6, 56, 12, 1.6, M.navy, { m: 'gloss', r: 1 }), TX('MUSEUM OF SCIENCE', 32, 66, -5.1, 4.4, 50, M.gold),
    RD(10, 18, 41, 4, 2.6, '#f0b0b8'), BX(14, 39, 4, 9, 2, 3, M.steelD, metal({ r: 0.3 })),
    LA(48, 38, 4, [[3, 0], [3, 0.6], [2.6, 1.4], [1.5, 2.8], [0.4, 3.4], [0, 3.6]], M.brass, metal()), B(48, 42, 4, 0.6, 0.6, 0.6, M.brassD, metal()),
    BX(31, 39, 5, 8, 2, 6, M.paper, { m: 'plain', r: 0.3 }), BX(31.6, 40.6, 5.4, 7, 1.2, 5, '#a8c8e8', { m: 'plain', r: 0.3 }),
  ]),

  // the museum's floor plan, YOU ARE HERE
  wallPiece('musmap', 'Museum map board', 2, 350, [
    BX(32, 54, 0.8, 60, 34, 1.6, M.woodD, { m: 'wood' }),
    PIC(32, 54, 1.7, 56, 30, museumMap),
  ]),

  // a painting of the world the fossils lived in, in a gilt frame with its own little light
  wallPiece('muspainting', 'Prehistoric mural', 2, 600, [
    BX(32, 54, 0.9, 60, 36, 1.8, M.frame, metal({ r: 1 })),
    PIC(32, 54, 1.9, 54, 30, prehistoric),
    BN([32, 71.5, 0.6], [32, 74, 4], 0.5, M.brassD, metal({ seg: 6 })), RD(23, 41, 74, 4, 1.3, M.brass, metal()),
  ]),

  // a rack of the tools for digging: a pickaxe, a rock hammer, brushes, a trowel, and a bucket of sand
  piece('mustools', 'Dig tool rack', 1, 1, 300, [
    BX(4, 35, -5, 3, 68, 3, M.wood, { m: 'wood' }), BX(28, 35, -5, 3, 68, 3, M.wood, { m: 'wood' }),
    BX(4, 1.2, -1, 4, 2.4, 20, M.woodD, { m: 'wood' }), BX(28, 1.2, -1, 4, 2.4, 20, M.woodD, { m: 'wood' }),
    BX(16, 65, -5, 26, 3, 2.6, M.wood, { m: 'wood' }), BX(16, 41, -5, 26, 3, 2.6, M.wood, { m: 'wood' }),
    BN([10, 64, -3], [10, 44, -3], 0.9, M.woodL, { m: 'wood', seg: 6 }),
    BN([10, 61, -3], [4.6, 58, -2.5], 1.2, M.steel, metal({ r1: 0.3, seg: 6 })), BN([10, 61, -3], [15.4, 58, -2.5], 1.2, M.steel, metal({ r1: 0.3, seg: 6 })),
    BN([21, 64, -3], [21, 47, -3], 0.8, M.woodL, { m: 'wood', seg: 6 }), BX(21, 60.5, -3, 6, 2.4, 2.4, M.steel, metal({ r: 0.4 })),
    ...[7.5, 12.5].flatMap(x => [BN([x, 40, -3], [x, 32, -3], 0.7, M.red, { m: 'gloss', seg: 6 }), BX(x, 30.5, -3, 2.4, 3, 1.6, '#3a2a20', { m: 'plain', r: 0.4 })]),
    BN([20, 40, -3], [20, 35, -3], 0.8, M.woodL, { m: 'wood', seg: 6 }), CN(20, 35, -3, 2.4, 7, M.steel, { tilt: Math.PI, m: 'metal' }),
    LA(16, 0, 5, [[4.6, 0], [5.6, 9], [5.9, 9.4], [0, 9.4]], M.steelD, metal()),
    CY(16, 9.2, 5, 5.3, 0.6, M.sandD, { m: 'plain' }),
    BN([12, 9, 5], [11.5, 14.5, 4], 0.5, M.woodL, { m: 'wood', seg: 6 }),
  ]),

  // a trestle table and its sieve, half full of sand, the finds laid out in a tray
  piece('mussieve', 'Fossil sieve table', 2, 1, 450, [
    ...[[5, -9], [59, -9], [5, 9], [59, 9]].map(([x, z]) => CY(x, 12, z, 1.4, 24, M.wood, { m: 'wood' })),
    RD(5, 59, 6, -9, 0.8, M.wood, { m: 'wood' }),
    BX(32, 25, 0, 62, 2.4, 24, M.woodL, { m: 'wood' }),
    BX(28, 27.2, 0, 33, 0.4, 17, '#8a9098', { m: 'metal', r: 0.1 }),
    BX(28, 28.4, -9.5, 36, 4, 1, M.wood, { m: 'wood', r: 0.3 }), BX(10.5, 28.4, 0, 1, 4, 18, M.wood, { m: 'wood', r: 0.3 }), BX(45.5, 28.4, 0, 1, 4, 18, M.wood, { m: 'wood', r: 0.3 }),
    B(25, 29.4, -1, 10, 2.8, 6.5, M.sand, { m: 'plain', ev: 0.6 }),
    B(34, 28.4, 3, 1.8, 0.8, 1, M.bone), B(31, 28.6, 5, 1.2, 0.7, 1.2, M.shell),
    BX(28, 28.4, 9.5, 36, 4, 1, M.wood, { m: 'wood', r: 0.3 }),
    BX(54, 26.9, 2, 12, 1.2, 10, '#3a3a44', { m: 'plain', r: 0.3 }),
    B(51, 27.9, 1, 1.8, 0.8, 1, M.bone), CN(55, 27.6, 3, 0.8, 3, M.tooth, { tilt: 1.3, m: 'gloss' }), B(57, 28, 0, 1.4, 1, 1.4, M.shell),
    BN([8, 26.8, 6], [14, 26.8, 8.5], 0.6, M.woodL, { m: 'wood', seg: 6 }), BX(15.4, 26.8, 9, 2.4, 1, 1.6, '#3a2a20', { m: 'plain', r: 0.3 }),
    LA(46, 0, 2, [[4, 0], [5, 8], [5.3, 8.4], [0, 8.4]], M.steelD, metal()), CY(46, 8.2, 2, 4.8, 0.6, M.sandD, { m: 'plain' }),
  ]),

  // a cabinet of labelled specimen jars
  piece('musjars', 'Specimen jar shelf', 1, 1, 650, [
    BX(2.5, 41, 0, 3, 78, 14, M.wood, { m: 'wood' }), BX(29.5, 41, 0, 3, 78, 14, M.wood, { m: 'wood' }),
    BX(16, 41, -6.4, 24, 78, 1.2, M.woodD, { m: 'wood' }),
    BX(16, 2, 0, 26, 4, 14, M.woodD, { m: 'wood' }), BX(16, 80.8, 0, 32, 1.6, 15, M.woodD, { m: 'wood' }),
    BX(16, 28, 0, 24, 1.6, 13, M.wood, { m: 'wood' }), BX(16, 53, 0, 24, 1.6, 13, M.wood, { m: 'wood' }),
    ...[[4, ['#d8c098', '#e8dcc0', '#7a9a48']], [28.8, ['#a85a30', '#f4e8d0', '#5a8ad8']], [53.8, ['#c87ab0', '#8a6038', '#e0b440']]].flatMap(([h0, cols], row) => [7.5, 16, 24.5].flatMap((x, i) => [
      B(x, h0 + 5.5, 1, 2.4, 4, 2.4, cols[i], { m: 'gloss', seg: 8 }),
      LA(x, h0, 1, [[3.4, 0], [3.6, 1], [3.6, 13], [2.6, 14], [2.6, 15.4], [0, 15.4]], '#cfe8f4', GLASS),
      CY(x, h0 + 16, 1, 2.9, 1.4, M.brassD, metal()),
      BX(x, h0 + 4.5, 4.7, 4.6, 3, 0.2, M.paper, { m: 'plain', r: 0.2, k: 55 }),
      PIC(x, h0 + 4.5, 4.85, 4.4, 2.8, jarLabel(`No.${row * 3 + i + 1}`), { k: 56 }),
    ])),
  ]),

  // an ammonite's spiral, chamber by chamber, as a round rug
  { id: 'musrug', name: 'Ammonite rug', w: 2, h: 2, layer: 'rug', price: 450, high: 0.04, side: 'p', flat() {
    const g = ctx();
    oval(32, 32, 30, 30, M.shellD); oval(32, 32, 28, 28, '#e8d4a8');
    for (let a = 0; a < 64; a++) { const t = a / 64 * TAU; R(32 + Math.cos(t) * 26.6 - 0.4, 32 + Math.sin(t) * 26.6 - 0.4, 0.8, 0.8, M.shellD); }
    const turns = 3, k = Math.log(0.05) / (turns * TAU), pt = (a, f = 1) => { const r = 25 * f * Math.exp(k * a); return [32 + Math.cos(a) * r, 32 + Math.sin(a) * r]; };
    for (let a = 0; a < turns * TAU - 0.3; a += 0.38) {
      const p = [pt(a), pt(a + 0.38), pt(a + 0.38 + TAU), pt(a + TAU)];
      g.fillStyle = Math.round(a / 0.38) % 2 ? '#d8b880' : '#c8a068';
      g.beginPath(); p.forEach(q => g.lineTo(...q)); g.closePath(); g.fill();
    }
    g.strokeStyle = M.shellD; g.lineWidth = 0.9; g.lineCap = 'round';
    g.beginPath(); for (let a = 0; a <= turns * TAU; a += 0.08) g.lineTo(...pt(a)); g.stroke();
    g.lineWidth = 0.5;
    for (let a = 0; a < turns * TAU - 0.3; a += 0.38) { g.beginPath(); g.moveTo(...pt(a)); g.lineTo(...pt(a + TAU)); g.stroke(); }
    oval(32, 32, 1.4, 1.4, M.shellD);
  } },
].map(f => ({ group: 'Museum', solo: true, ...f }));
