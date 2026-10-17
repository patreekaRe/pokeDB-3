/* base-furniture-garage.js  -  the Garage and workshop set (furniture expansion, room types, 2026-10-17): a whole room of a
   working mechanic's garage and tinkerer's workshop, as Animal Crossing's Happy Home Paradise does a room type. Grey
   concrete, safety yellow with black hazard stripes, red tool chests, oily gunmetal and bright steel, overall blue. The
   machines do something when tapped: the drill press and the engine whirr, the bench grinder throws sparks, the
   compressor puffs, the welder's arc and the work lamp light, the drum fan turns, the tool chest's door opens. A
   Magnemite holding up the work lamp, a Klink gear clock, a Porygon on the diagnostics cart and Rotom's mower plans on
   the blueprint board for the Pokémon touches. All solo, fixed colours, sold all year. The Ironwood series' workbench,
   tool chest and pegboard are furniture in that look; these are the working garage's own.
   An upright piece is a list of parts in painted units (32 a tile), as in js/base-furniture-ramen.js: `x` across from
   the left of its front, `h` up from the floor (a wall piece's from the foot of its strip), `z` out to the front from
   its middle (a wall piece's from the wall). They're painted here from any side, and js/base-models-garage.js builds the
   same list as 3D parts (BUILT), so picture and model agree. A ring or disc with `ax: 'x'` stands side-on (the
   grinder's wheels and motor, the welder's wheels, the tank). A `wedge` is a side profile ([z, up] points) extruded `w`
   across (the bucket seat's back). `tex` is painted only (the model stays plain colour): `grain` a board's streaks,
   `tread` a tyre's tread, `perf` a pegboard's holes, `cork` cork's speckle, `slats` a roller shutter's slats. A `pic`
   part (the hazard stripes, the labels and signs, the welder's panel, the blueprints, the clock's dial) is painted on
   the front only, and the model wears that crop of the painting. The tool chest's cupboard door swings (`doors`,
   `inside`). The floor mat is painted from above (RUG). */

import { sh, oval, ovalShade, floorShadow, ctx, hash, glass as glassPane } from './base-paint.js';

export const GC = {
  concrete: '#9b9d9a', concreteD: '#737572', concreteL: '#c0c2be',
  yellow: '#f2c21a', yellowD: '#c4970e', black: '#1f2023', blackL: '#3b3d41',
  red: '#c8261e', redD: '#8c1a14', redL: '#e2493a',
  steel: '#a9b0b5', steelL: '#d3d8db', steelD: '#6d757a', oily: '#4a5056', chrome: '#e3e7e9',
  blue: '#2f5f9e', blueL: '#5a86c2', blueD: '#1f4170',
  rubber: '#2b2c2e', rubberD: '#151617', wood: '#b8864e', woodL: '#d6aa72', woodD: '#7e5530',
  board: '#c9a87a', cork: '#c49a62', kraft: '#c49a5c', paper: '#f3f0e6', beige: '#d9d2c0', beigeD: '#b8b09c',
  print: '#2a5ca8', printL: '#e6f0fb', note: '#f6e27a', noteP: '#f6a8c0',
  green: '#3f7a52', greenL: '#5aa06e', orange: '#e8741c', stone: '#8d8f8a', gold: '#d0a030',
  glowW: '#fff2c4', arc: '#a8dcff', screen: '#123c2a', code: '#6cf08a',
  klink: '#aab1b8', klinkD: '#7b838a', mag: '#b2bcc4', magD: '#7f8a93', pink: '#f08ca8', pinkD: '#d0607e', pory: '#46a8d8',
  rotom: '#f2843a', white: '#f6f6f2',
};
const G = GC;
const GROUP = 'Garage';
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

/** A castor under a frame at h 4.4 (scaled by s): its stem and a little rubber wheel standing side-on. */
const caster = (x, z, s = 1) => [
  RD([x, 4.4 * s, z], [x, 2.4 * s, z], 0.55 * s, G.steelD, MT),
  DS(x, 1.8 * s, z, 1.8 * s, 1.3 * s, G.rubber, { m: 'plain', ax: 'x', seg: 10 }),
];
/** A five-legged wheeled star foot round a column at x (the shop stool). */
function starBase(x, R = 11) {
  const parts = [C(x, 3.4, 0, 2.2, 3, G.steelD, { m: 'metal', seg: 10 })];
  for (let i = 0; i < 5; i++) {
    const a = Math.PI / 2 + i / 5 * TAU, ex = x + Math.cos(a) * R, ez = Math.sin(a) * R;
    parts.push(RD([x, 3.6, 0], [ex, 3, ez], 0.9, G.black, GL), ...caster(ex, ez, 0.75));
  }
  return parts;
}
/** A tyre r round and hh tall standing on h: tread all round, and (open) its dark hole seen from above. */
const tyre = (x, h, z, r, hh, open) => [
  C(x, h + hh / 2, z, r, hh, G.rubber, { m: 'cloth', tex: 'tread', seg: 20 }),
  ...(open ? [C(x, h + hh + 0.15, z, r * 0.6, 0.3, G.rubberD, { m: 'plain', seg: 16 })] : []),
];
/** A jerrycan of colour c standing on h, its narrow end to the front: the can, its handle on top and the spout cap. */
const jerry = (x, h, c) => [
  B(x, h + 8, 0, 11, 16, 17, c, { m: 'gloss', r: 1.6 }),
  B(x, h + 8, 8.6, 7, 10, 0.4, sh(c, -1), { m: 'plain', r: 0.6 }),
  RD([x, h + 16, -6], [x, h + 17.8, -5], 0.6, c, GL), RD([x, h + 17.8, -5], [x, h + 17.8, 2], 0.6, c, GL), RD([x, h + 17.8, 2], [x, h + 16, 3], 0.6, c, GL),
  C(x, h + 17.1, 6, 1.6, 2.2, G.black, { m: 'gloss', seg: 10 }),
];
/** A bottle of motor oil: a squared jug, its cap. */
const oilBottle = (x, h, z, c) => [
  LA(x, h, z, [[2.2, 0], [2.4, 0.4], [2.4, 6], [1.6, 7.4], [0.9, 7.8], [0.9, 8.8]], c, { m: 'gloss', seg: 8 }),
  C(x, h + 9.2, z, 1, 1, G.black, { m: 'gloss', seg: 8 }),
];
/** A gear r round at x, h (z from the wall): its disc, n teeth as stubby rods, a rim. */
const gear = (x, h, z, r, n, tr, c) => [
  DS(x, h, z, r, 1.6, c, { m: 'metal', seg: 20 }),
  ...Array.from({ length: n }, (_, i) => { const a = i / n * TAU + 0.15, ca = Math.cos(a), sa = Math.sin(a); return RD([x + ca * (r - 0.6), h + sa * (r - 0.6), z], [x + ca * (r + tr), h + sa * (r + tr), z], 1.25, c, MT); }),
  RG(x, h, z + 0.9, r * 0.82, 0.4, sh(c, -1), MT),
];

/* ---------- painting the parts ---------- */

function grad(g, x0, y0, x1, y1, c, m) {
  const l = g.createLinearGradient(x0, y0, x1, y1);
  if (m === 'metal') [[0, sh(c, 2)], [0.25, c], [0.55, sh(c, -1)], [0.8, sh(c, 1)], [1, sh(c, -1)]].forEach(s => l.addColorStop(...s));
  else [[0, sh(c, 1)], [0.35, c], [1, sh(c, -1)]].forEach(s => l.addColorStop(...s));
  return l;
}
function rbx(x, y, w, h, r, c, m) {
  if (w <= 0 || h <= 0) return;
  const g = ctx();
  if (m === 'glass') { g.save(); g.globalAlpha *= 0.4; glassPane(x, y, w, h, '#cfe8f4'); g.restore(); return; }
  if (m === 'plain' || m === 'glow') { g.fillStyle = c; g.beginPath(); g.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); g.fill(); return; }
  g.fillStyle = grad(g, x, y, x + w * 0.3, y + h, c, m); g.beginPath(); g.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); g.fill();
  if (h > 3 && w > 3) { g.save(); g.globalAlpha *= 0.4; g.fillStyle = sh(c, 2); g.fillRect(x + Math.min(r, w / 2) * 0.6, y + 0.3, w - Math.min(r, w / 2) * 1.2, 0.5); g.restore(); }
}
function poly(pts, c, m, horiz) {
  const g = ctx(), xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  if (m === 'glass') { g.save(); g.globalAlpha *= 0.35; }
  if (m === 'plain' || m === 'glow') g.fillStyle = c;
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
  if (m === 'glow' || m === 'plain') { oval(cx, cy, rx, ry, c); return; }
  if (m === 'glass') { g.save(); g.globalAlpha *= 0.4; oval(cx, cy, rx, ry, '#dff0f8'); g.restore(); return; }
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
    g.lineWidth = 0.3;
    for (let y = y0 + 0.7, i = 0; y < y1; y += 0.9, i++) {
      const a = x0 + hash(i, seed, 1) * (x1 - x0) * 0.5, l = (x1 - x0) * (0.3 + hash(i, seed, 2) * 0.6);
      g.globalAlpha = 0.35; g.strokeStyle = hash(i, seed, 3) < 0.5 ? sh(c, -2) : sh(c, 1);
      g.beginPath(); g.moveTo(a, y); g.bezierCurveTo(a + l * 0.3, y + 0.3, a + l * 0.6, y - 0.3, a + l, y); g.stroke();
    }
  } else if (q.tex === 'tread') {
    g.globalAlpha = 0.7; g.strokeStyle = G.rubberD; g.lineWidth = 0.5;
    const mid = (y0 + y1) / 2;
    for (let x = x0 + 0.8, i = 0; x < x1; x += 1.6, i++) {
      g.beginPath(); g.moveTo(x, y0 + 0.6); g.lineTo(x + (i % 2 ? 0.7 : -0.7), mid); g.lineTo(x, y1 - 0.6); g.stroke();
    }
    g.globalAlpha = 0.25; g.fillStyle = '#ffffff'; g.fillRect(x0, mid - 0.2, x1 - x0, 0.4);
  } else if (q.tex === 'perf') {
    g.fillStyle = sh(c, -3); g.globalAlpha = 0.75;
    for (let y = y0 + 1.6; y < y1 - 0.5; y += 2.4) for (let x = x0 + 1.6; x < x1 - 0.5; x += 2.4) { g.beginPath(); g.arc(x, y, 0.35, 0, TAU); g.fill(); }
  } else if (q.tex === 'cork') {
    for (let i = 0; i < (x1 - x0) * (y1 - y0) * 0.6; i++) {
      g.globalAlpha = 0.5; g.fillStyle = hash(i, seed, 4) < 0.5 ? sh(c, -2) : sh(c, 1);
      g.fillRect(x0 + hash(i, seed, 5) * (x1 - x0), y0 + hash(i, seed, 6) * (y1 - y0), 0.35, 0.35);
    }
  } else if (q.tex === 'slats') {
    for (let y = y0 + 3; y < y1; y += 3) {
      g.globalAlpha = 0.55; g.fillStyle = sh(c, -2); g.fillRect(x0, y - 0.4, x1 - x0, 0.5);
      g.globalAlpha = 0.45; g.fillStyle = sh(c, 2); g.fillRect(x0, y + 0.1, x1 - x0, 0.4);
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
    const m = q.m || 'gloss', cx = U(q.x, q.z), cy = b - q.h, edge = q.ax === 'x' ? !side : side;
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
        if (m !== 'glass') oval(cx, top, q.r, Math.min(q.r * 0.22, Math.max(0.3, q.hh / 2)), sh(q.c, m === 'glow' ? 0 : 1));
        break;
      }
      case 'ball': ball(cx, cy, side ? q.rz : q.rx, q.ry, q.c, m); break;
      case 'disc': if (edge) rbx(cx - q.th / 2, cy - (q.ry ?? q.r), q.th, (q.ry ?? q.r) * 2, q.th / 2, q.c, m); else ball(cx, cy, q.r, q.ry ?? q.r, q.c, m); break;
      case 'lathe': {
        const P = (dx, up) => [cx + flip * dx, cy - up];
        const rmax = Math.max(...q.pts.map(p => p[0]));
        const pts = [...q.pts.map(([r, up]) => P(-r, up)), ...q.pts.slice().reverse().map(([r, up]) => P(r, up))];
        poly(pts, q.c, m, m !== 'glow');
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
        if (q.flat) {
          g.lineCap = 'butt'; g.strokeStyle = q.c; g.lineWidth = q.tr * 2;
          g.beginPath(); g.ellipse(cx, cy, q.r, q.r * 0.22, 0, 0, TAU); g.stroke();
          break;
        }
        const ry = q.ry ?? q.r, a0 = q.a0 ?? 0, arc = q.arc ?? TAU, n = Math.max(8, Math.round(arc / TAU * 32));
        const at = (a, dy = 0) => {
          const px = q.ax === 'x' ? q.x : q.x + Math.cos(a) * q.r, pz = q.ax === 'x' ? q.z - Math.cos(a) * q.r : q.z;
          return [U(px, pz), b - q.h - Math.sin(a) * ry + dy];
        };
        const path = (dy) => { g.beginPath(); for (let i = 0; i <= n; i++) { const [px, py] = at(a0 + arc * i / n, dy); i ? g.lineTo(px, py) : g.moveTo(px, py); } if (arc >= TAU - 0.01) g.closePath(); };
        g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = q.c; g.lineWidth = q.tr * 2; path(0); g.stroke();
        if (m !== 'plain' && m !== 'glow') { g.save(); g.globalAlpha *= 0.45; g.strokeStyle = sh(q.c, 2); g.lineWidth = q.tr * 0.6; path(-q.tr * 0.4); g.stroke(); g.restore(); }
        break;
      }
      case 'rod': {
        const p0 = [U(q.a[0], q.a[2]), b - q.a[1]], p1 = [U(q.b[0], q.b[2]), b - q.b[1]];
        if (Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) < 0.05) { ball(p0[0], p0[1], q.r, q.r, q.c, m); break; }
        g.lineCap = 'round'; g.strokeStyle = m === 'glass' ? 'rgba(207,232,244,0.4)' : q.c; g.lineWidth = q.r * 2;
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
        poly(q.pts.map(([px, ph]) => [U(q.x + px), b - q.h - ph]), q.c, m);
        break;
      }
      case 'wedge': {
        const ups = q.pts.map(p => p[1]), top = Math.max(...ups), bot = Math.min(...ups);
        if (!side) { rbx(cx - q.w / 2, cy - top, q.w, top - bot, 0.6, q.c, m); break; }
        poly(q.pts.map(([pz, up]) => [U(q.x, q.z + pz), cy - up]), q.c, m);
        break;
      }
      case 'pic': g.save(); g.beginPath(); g.rect(cx - q.w / 2, cy - q.hh / 2, q.w, q.hh); g.clip(); q.fn(g, cx - q.w / 2, cy - q.hh / 2, q.w, q.hh); g.restore(); break;
    }
  }
}

/* ---------- pictures ---------- */

const SANS = 'Arial Black, Arial, sans-serif';
/** A word across a painted box: bold letters in fg over bg (none for clear). */
const word = (text, fg, bg, k = 0.78) => (g, x, y, w, h) => {
  if (bg) { g.fillStyle = bg; g.fillRect(x, y, w, h); }
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `bold ${h * k}px ${SANS}`; g.fillText(text, x + w / 2, y + h * 0.54, w * 0.92);
};
/** Safety stripes: yellow with black bands slanting across, `s` apart. */
const stripes = (s = 4) => (g, x, y, w, h) => {
  g.fillStyle = G.yellow; g.fillRect(x, y, w, h);
  g.fillStyle = G.black;
  for (let d = -h; d < w + h; d += s) { g.beginPath(); g.moveTo(x + d, y + h); g.lineTo(x + d + s / 2, y + h); g.lineTo(x + d + s / 2 + h, y); g.lineTo(x + d + h, y); g.closePath(); g.fill(); }
};
/** A label: a white card ruled in ink with a word on it. */
const label = (text, bg = G.paper, fg = G.black) => (g, x, y, w, h) => {
  g.fillStyle = bg; g.fillRect(x, y, w, h);
  g.strokeStyle = fg; g.lineWidth = Math.min(w, h) * 0.08; g.strokeRect(x + g.lineWidth, y + g.lineWidth, w - g.lineWidth * 2, h - g.lineWidth * 2);
  word(text, fg, null, 0.56)(g, x, y, w, h);
};

/** The welder's front panel: two dials, an amber readout, a red switch and WELD across the top. */
function weldPanel(g, x, y, w, h) {
  g.fillStyle = G.black; g.fillRect(x, y, w, h);
  word('WELD', G.yellow, null, 0.8)(g, x, y, w, h * 0.22);
  g.fillStyle = '#2a1a08'; g.fillRect(x + w * 0.32, y + h * 0.3, w * 0.36, h * 0.18);
  g.fillStyle = G.orange; g.font = `bold ${h * 0.15}px ${SANS}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('120A', x + w / 2, y + h * 0.4);
  for (const fx of [0.2, 0.8]) {
    const cx = x + w * fx, cy = y + h * 0.66, r = h * 0.15;
    g.fillStyle = G.steelL; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill();
    g.strokeStyle = G.black; g.lineWidth = r * 0.25; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + r * 0.6, cy - r * 0.6); g.stroke();
  }
  g.fillStyle = G.red; g.fillRect(x + w * 0.44, y + h * 0.62, w * 0.12, h * 0.16);
  g.fillStyle = G.steel; g.beginPath(); g.arc(x + w * 0.4, y + h * 0.9, h * 0.06, 0, TAU); g.arc(x + w * 0.6, y + h * 0.9, h * 0.06, 0, TAU); g.fill();
}
/** The oil drum's label: a yellow card ruled black, a black oil drop and MOTOR OIL. */
function oilLabel(g, x, y, w, h) {
  g.fillStyle = G.yellow; g.fillRect(x, y, w, h);
  g.strokeStyle = G.black; g.lineWidth = 0.4; g.strokeRect(x + 0.4, y + 0.4, w - 0.8, h - 0.8);
  const cx = x + w / 2, cy = y + h * 0.42, r = h * 0.18;
  g.fillStyle = G.black; g.beginPath(); g.moveTo(cx, cy - r * 1.8); g.quadraticCurveTo(cx + r * 1.2, cy, cx + r, cy + r * 0.4); g.arc(cx, cy + r * 0.3, r, 0, Math.PI); g.quadraticCurveTo(cx - r * 1.2, cy, cx, cy - r * 1.8); g.fill();
  word('MOTOR OIL', G.black, null, 0.8)(g, x, y + h * 0.74, w, h * 0.2);
}
/** A flammable sign's flame, black on white, for the red diamond. */
function flameSign(g, x, y, w, h) {
  const cx = x + w / 2, by = y + h * 0.85;
  g.fillStyle = G.white; g.beginPath(); g.moveTo(cx, y); g.lineTo(x + w, y + h / 2); g.lineTo(cx, y + h); g.lineTo(x, y + h / 2); g.closePath(); g.fill();
  g.fillStyle = G.black; g.beginPath(); g.moveTo(cx, y + h * 0.2); g.bezierCurveTo(cx + w * 0.24, y + h * 0.42, cx + w * 0.2, by - h * 0.05, cx, by - h * 0.08); g.bezierCurveTo(cx - w * 0.2, by - h * 0.05, cx - w * 0.22, y + h * 0.48, cx - w * 0.05, y + h * 0.38); g.quadraticCurveTo(cx, y + h * 0.5, cx, y + h * 0.2); g.fill();
}
/** The big blueprint: a blue sheet ruled in a fine grid, ROTOM MOW across the top, and Rotom's mower drawn in white
    lines: the cutting deck, wheels, the handle, Rotom's eyes and a lightning bolt, a dimension line under it. */
function rotomPrint(g, x, y, w, h) {
  g.fillStyle = G.print; g.fillRect(x, y, w, h);
  g.strokeStyle = 'rgba(230,240,251,0.18)'; g.lineWidth = 0.15; g.beginPath();
  for (let gx = x + 1.5; gx < x + w; gx += 1.5) { g.moveTo(gx, y); g.lineTo(gx, y + h); }
  for (let gy = y + 1.5; gy < y + h; gy += 1.5) { g.moveTo(x, gy); g.lineTo(x + w, gy); }
  g.stroke();
  word('ROTOM MOW', G.printL, null, 0.8)(g, x, y + h * 0.04, w, h * 0.14);
  g.strokeStyle = G.printL; g.lineWidth = 0.35; g.lineJoin = 'round'; g.lineCap = 'round';
  const bx = x + w * 0.18, by = y + h * 0.42, bw = w * 0.5, bh = h * 0.3;
  g.beginPath(); g.roundRect(bx, by, bw, bh, bh * 0.35); g.stroke();
  for (const fx of [0.12, 0.88]) { g.beginPath(); g.arc(bx + bw * fx, by + bh, bh * 0.32, 0, TAU); g.stroke(); }
  g.beginPath(); g.moveTo(bx + bw * 0.9, by + bh * 0.1); g.lineTo(x + w * 0.88, y + h * 0.22); g.lineTo(x + w * 0.94, y + h * 0.22); g.stroke();
  for (const fx of [0.36, 0.6]) { g.beginPath(); g.ellipse(bx + bw * fx, by + bh * 0.45, bw * 0.08, bh * 0.2, 0, 0, TAU); g.stroke(); }
  g.beginPath(); g.moveTo(bx + bw * 0.28, by - bh * 0.1); g.lineTo(bx + bw * 0.2, by - bh * 0.55); g.lineTo(bx + bw * 0.3, by - bh * 0.5); g.lineTo(bx + bw * 0.22, by - bh * 0.95); g.stroke();
  g.lineWidth = 0.2; g.beginPath(); g.moveTo(bx, y + h * 0.9); g.lineTo(bx + bw, y + h * 0.9); g.moveTo(bx, y + h * 0.86); g.lineTo(bx, y + h * 0.94); g.moveTo(bx + bw, y + h * 0.86); g.lineTo(bx + bw, y + h * 0.94); g.stroke();
}
/** A parts list on lined paper: a title bar and handwritten-looking lines with ticks. */
function partsList(g, x, y, w, h) {
  g.fillStyle = G.paper; g.fillRect(x, y, w, h);
  g.fillStyle = G.red; g.fillRect(x, y, w, h * 0.12);
  g.strokeStyle = 'rgba(42,92,168,0.35)'; g.lineWidth = 0.15;
  for (let i = 0; i < 7; i++) { const ly = y + h * (0.24 + i * 0.11); g.beginPath(); g.moveTo(x + 0.6, ly); g.lineTo(x + w - 0.6, ly); g.stroke(); }
  g.strokeStyle = '#3a3a48'; g.lineWidth = 0.3;
  for (let i = 0; i < 6; i++) { const ly = y + h * (0.21 + i * 0.11), l = w * (0.4 + hash(i, 3) * 0.4); g.beginPath(); g.moveTo(x + 2.2, ly); g.lineTo(x + 2.2 + l, ly); g.stroke(); }
  g.strokeStyle = G.green; g.lineWidth = 0.35;
  for (let i = 0; i < 4; i++) { const ly = y + h * (0.21 + i * 0.11); g.beginPath(); g.moveTo(x + 0.7, ly - 0.2); g.lineTo(x + 1.1, ly + 0.3); g.lineTo(x + 1.8, ly - 0.6); g.stroke(); }
}
/** A snapshot: blue sky, grey road and a red motorbike on it. */
function snapshot(g, x, y, w, h) {
  g.fillStyle = G.white; g.fillRect(x, y, w, h);
  const ix = x + 0.6, iy = y + 0.6, iw = w - 1.2, ih = h * 0.72;
  g.fillStyle = '#9cd0f0'; g.fillRect(ix, iy, iw, ih); g.fillStyle = G.concrete; g.fillRect(ix, iy + ih * 0.7, iw, ih * 0.3);
  g.fillStyle = G.black; for (const fx of [0.3, 0.7]) { g.beginPath(); g.arc(ix + iw * fx, iy + ih * 0.7, ih * 0.14, 0, TAU); g.fill(); }
  g.fillStyle = G.red; g.beginPath(); g.moveTo(ix + iw * 0.3, iy + ih * 0.66); g.lineTo(ix + iw * 0.45, iy + ih * 0.42); g.lineTo(ix + iw * 0.68, iy + ih * 0.44); g.lineTo(ix + iw * 0.7, iy + ih * 0.66); g.closePath(); g.fill();
}
/** The Klink clock's dial: cream, steel hour marks, two hands at ten past ten, a bolt for a centre. */
function dial(g, x, y, w, h) {
  const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2;
  g.fillStyle = G.paper; g.beginPath(); g.arc(cx, cy, r * 0.98, 0, TAU); g.fill();
  g.fillStyle = G.black;
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * TAU - Math.PI / 2, big = i % 3 === 0, rr = r * 0.78;
    g.save(); g.translate(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); g.rotate(a + Math.PI / 2);
    g.fillRect(-r * (big ? 0.06 : 0.03), -r * (big ? 0.12 : 0.07), r * (big ? 0.12 : 0.06), r * (big ? 0.24 : 0.14));
    g.restore();
  }
  g.lineCap = 'round';
  for (const [a, len, lw, c] of [[-150, 0.46, 0.1, G.black], [-30, 0.66, 0.07, G.red]]) { const t = a * Math.PI / 180; g.strokeStyle = c; g.lineWidth = r * lw; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(t) * r * len, cy + Math.sin(t) * r * len); g.stroke(); }
  g.fillStyle = G.steelD; g.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; g.lineTo(cx + Math.cos(a) * r * 0.14, cy + Math.sin(a) * r * 0.14); } g.closePath(); g.fill();
}
/** The diagnostics screen as painted (the live screen plays over it in the room): green code lines and a bar chart. */
function diagScreen(g, x, y, w, h) {
  g.fillStyle = G.screen; g.fillRect(x, y, w, h);
  g.fillStyle = G.code;
  for (let i = 0; i < 5; i++) g.fillRect(x + 1, y + 1 + i * h * 0.16, w * (0.25 + hash(i, 9) * 0.3), h * 0.07);
  for (let i = 0; i < 5; i++) { const bh = h * (0.2 + hash(i, 11) * 0.5); g.fillRect(x + w * 0.62 + i * w * 0.07, y + h - 1 - bh, w * 0.05, bh); }
}

/* ---------- the kinds ---------- */

/** What js/base-models-garage.js builds for each upright and wall kind: its parts, doors and default material. */
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

/** The Bicycle's frame, lifted `up` off the floor: red tubes, chrome wheels and spokes, black saddle and grips. */
function bicycle(up) {
  const parts = [], Y = (p) => [p[0], p[1] + up, p[2]];
  for (const x of [12, 51]) {
    parts.push(RG(x, 11 + up, 0, 10, 1, G.rubber, GL), RG(x, 11 + up, 0, 9, 0.4, G.chrome, MT), DS(x, 11 + up, 0, 1.6, 2.4, G.steelD, { m: 'metal', seg: 10 }));
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2, c = Math.cos(a), s = Math.sin(a); parts.push(RD([x + c * 1.6, 11 + up + s * 1.6, 0], [x + c * 8.6, 11 + up + s * 8.6, 0], 0.25, G.chrome, MT)); }
    parts.push(RG(x, 11 + up, 0, 11.6, 0.6, G.red, { m: 'gloss', a0: 0.45, arc: 2.25 }));
  }
  const R = Y([12, 11, 0]), BB = Y([28, 10, 0]), ST = Y([25, 30, 0]), H = Y([45, 32, 0]), Hb = Y([46, 26, 0]), F = Y([51, 11, 0]);
  parts.push(RD(R, BB, 0.8, G.red, GL), RD(R, Y([25.4, 27, 0]), 0.8, G.red, GL), RD(BB, ST, 1, G.red, GL), RD(Y([25.4, 27.4, 0]), Y([45.4, 29.4, 0]), 1, G.red, GL),
    RD(BB, Hb, 1, G.red, GL), RD(Hb, H, 1.1, G.red, GL), RD(Hb, F, 0.8, G.chrome, MT));
  parts.push(RG(28, 10 + up, 1.4, 3, 0.5, G.steelD, MT), RD(Y([12, 11, 1.4]), Y([28, 10, 1.4]), 0.3, G.steelD, MT),
    RD(Y([28, 10, 1.6]), Y([30, 6, 3.6]), 0.4, G.chrome, MT), B(30, 6 + up, 4.6, 3, 0.8, 2.4, G.black, PL));
  parts.push(RD(ST, Y([24.6, 33, 0]), 0.6, G.chrome, MT), S(23.6, 34 + up, 0, 4.4, 1.4, 2.4, G.black, { m: 'gloss', seg: 10 }));
  parts.push(RD(H, Y([44, 36, 0]), 0.6, G.chrome, MT), RD(Y([43.6, 36, -7]), Y([43.6, 36, 7]), 0.6, G.chrome, MT), ...[-7, 7].map(z => RD(Y([43.6, 36, z]), Y([41.6, 36.4, z * 1.12]), 0.8, G.black, PL)));
  parts.push(B(48.4, 30 + up, 0, 3, 2.4, 2.4, G.white, GL));
  return parts;
}

export const GARAGE_KINDS = [
  // a red rolling tool chest: a cupboard below and two drawers above on castors, a top chest of drawers on its rubber
  // mat, chrome pulls, a lid handle and a side bar to push it by
  piece('grgtoolchest', 'Garage red tool chest', 1, 1, 950, 'gloss', [
    ...[4, 28].flatMap(x => [-7, 7].flatMap(z => caster(x, z))),
    B(16, 5, 0, 28, 1.4, 20, G.steelD, MT),
    B(16, 21, 0, 28, 31, 20, G.red, GL),
    ...[33, 28.6].flatMap(h => [B(16, h, 10.2, 25, 3.4, 0.5, G.red, GL), RD([9, h, 10.9], [23, h, 10.9], 0.45, G.chrome, MT)]),
    B(16, 36.9, 0, 29, 1, 21, G.black, PL),
    B(16, 44, -1, 27, 13, 17, G.red, GL),
    ...[46.6, 41.8].flatMap(h => [B(16, h, 7.7, 24, 3.6, 0.5, G.red, GL), RD([10, h, 8.4], [22, h, 8.4], 0.4, G.chrome, MT)]),
    B(16, 51.4, -1, 28, 2, 18, G.redD, GL),
    ...[10, 22].map(x => RD([x, 52.4, -1], [x, 54.6, -1], 0.5, G.chrome, MT)), RD([10, 54.6, -1], [22, 54.6, -1], 0.6, G.chrome, MT),
    ...[-6, 6].map(z => RD([30, 28, z], [31.2, 28, z], 0.45, G.chrome, MT)), RD([31.2, 28, -6], [31.2, 28, 6], 0.6, G.chrome, MT),
  ], {
    doors: [{ hinge: [2.2, 10.4], side: 1, parts: [
      B(16, 14.8, 10.7, 25.6, 17, 0.8, G.red, GL),
      PC(9.4, 21, 11.15, 7, 2.4, word('TOOLS', G.black, G.yellow)),
      RD([24.4, 9, 11.6], [24.4, 20, 11.6], 0.5, G.chrome, MT),
    ] }],
    inside: { x: 16, h: 14.8, w: 24, hh: 16, z: 10 },
  }),

  // a heavy workbench: steel legs, a thick maple top, a drawer, a red toolbox and a paint can on the shelf below, a blue
  // engineer's vice bolted to the right end, a hammer and spanner left out
  piece('grgbench', 'Garage workbench and vice', 2, 1, 1150, 'metal', [
    ...[3, 61].flatMap(x => [-11, 11].map(z => B(x, 13.5, z, 3.2, 27, 3.2, G.steelD, MT))),
    B(32, 6, 0, 60, 1.4, 24, G.steelD, MT),
    B(32, 24.7, 0, 60, 4.6, 24, G.steel, MT),
    B(18, 24.7, 12.2, 18, 3.4, 0.6, G.steel, MT), RD([14, 24.7, 12.9], [22, 24.7, 12.9], 0.4, G.black, GL),
    B(32, 28.6, 0, 64, 3.2, 28, G.woodL, { m: 'wood', tex: 'grain' }),
    B(14, 10.7, 0, 16, 8, 10, G.red, GL), ...[10, 18].map(x => RD([x, 14.7, 0], [x, 16.4, 0], 0.45, G.black, GL)), RD([10, 16.4, 0], [18, 16.4, 0], 0.55, G.black, GL),
    B(14, 11.2, 5.1, 14, 0.6, 0.3, G.yellow, PL),
    C(36, 11.4, 2, 4, 9, G.blue, { m: 'gloss', seg: 14 }), C(36, 16.1, 2, 4.1, 0.6, G.steelL, { m: 'metal', seg: 14 }),
    B(50, 8, 1, 10, 2.6, 9, G.blueL, { m: 'cloth', r: 1 }),
    B(54, 31.4, 7, 10, 2.4, 9, G.blue, GL), B(54, 35, 7, 8, 5, 8, G.blue, GL),
    B(54, 38.6, 3.6, 10, 3, 3, G.steelD, MT), B(54, 38.6, 11.4, 10, 3, 3, G.blue, GL),
    RD([54, 36, 7], [54, 36, 14.6], 0.6, G.chrome, MT), RD([49.4, 36, 14.6], [58.6, 36, 14.6], 0.5, G.chrome, MT),
    ...[49.4, 58.6].map(x => S(x, 36, 14.6, 0.9, 0.9, 0.9, G.chrome, MT)),
    RD([25, 30.8, 4], [37, 30.8, 7], 0.6, G.wood, WD), B(24, 31.6, 3.8, 2.4, 2.4, 5, G.steelD, MT),
    RD([6, 30.6, -2], [17, 30.6, 2], 0.5, G.chrome, MT), RG(5.4, 30.6, -2.4, 1.3, 0.4, G.chrome, { m: 'metal', flat: true }),
    C(43, 32.6, -6, 2.2, 4.4, G.yellow, { m: 'gloss', seg: 10 }),
  ]),

  // a pegboard of tools on the wall in a steel frame: a hammer, a row of spanners in their sizes, three screwdrivers,
  // pliers, a saw, a tape measure and a coil of wire
  wallPiece('grgpegboard', 'Garage tool pegboard', 2, 560, 'metal', [
    B(32, 62, 0.6, 60, 34, 1.2, G.board, { m: 'wood', tex: 'perf' }),
    B(32, 79.4, 0.9, 62, 1.6, 1.8, G.steelD, MT), B(32, 44.6, 0.9, 62, 1.6, 1.8, G.steelD, MT),
    ...[1.4, 62.6].map(x => B(x, 62, 0.9, 1.6, 35, 1.8, G.steelD, MT)),
    RD([8, 49, 2], [8, 66, 2], 0.8, G.wood, WD), B(8, 67.6, 2.2, 7, 2.6, 2.4, G.steelD, MT),
    ...[0, 1, 2, 3, 4].flatMap(i => { const x = 15 + i * 3.2, L = 9 + i * 1.4; return [RG(x, 71, 2, 1.1, 0.45, G.chrome, MT), RD([x, 70, 2], [x, 70 - L, 2], 0.5, G.chrome, MT), B(x, 69.4 - L, 2, 2, 1.4, 0.8, G.chrome, MT)]; }),
    ...[[33, G.red], [36.4, G.yellow], [39.8, G.blue]].flatMap(([x, c]) => [C(x, 70, 2, 1.1, 6, c, { m: 'gloss', seg: 8 }), RD([x, 67, 2], [x, 58, 2], 0.3, G.chrome, MT)]),
    RD([46, 72, 2], [47.6, 66, 2], 0.5, G.steelD, MT), RD([49.2, 72, 2], [47.6, 66, 2], 0.5, G.steelD, MT),
    RD([47.6, 66, 2], [45.4, 57, 2], 0.6, G.red, GL), RD([47.6, 66, 2], [49.8, 57, 2], 0.6, G.red, GL),
    PR(56, 52, 1.8, [[-3.6, 0], [3.6, 0], [2.6, 15], [-2.6, 15]], 0.4, G.steelL, MT), B(56, 70, 2, 6, 5, 1.4, G.wood, WD),
    DS(36, 51, 2, 3, 2, G.yellow, { m: 'gloss', seg: 14 }), B(36, 48.4, 2.6, 1.6, 0.8, 1, G.black, PL),
    RG(17, 50, 2, 3.2, 0.6, G.orange, GL), RG(17, 50, 2, 2, 0.6, G.orange, GL),
  ]),

  // a floor-standing drill press: a steel column on an oily base, a blue head and belt guard, the motor at its back,
  // the chuck and bit over a round table with a block clamped on it, three feed handles with yellow knobs
  piece('grgdrill', 'Garage drill press', 1, 1, 1050, 'metal', [
    B(16, 1.4, -1, 22, 2.8, 24, G.oily, MT),
    C(16, 30, -7, 1.8, 54, G.chrome, { m: 'metal', seg: 12 }),
    C(16, 25, -7, 2.8, 4, G.blue, { m: 'gloss', seg: 12 }), B(16, 25, -3, 4, 2.4, 8, G.blue, GL),
    C(16, 26.8, 2, 7, 1.6, G.steelD, { m: 'metal', seg: 18 }),
    B(16, 28.6, 2, 6, 2, 4, G.woodL, WD),
    B(16, 47, -2, 14, 12, 18, G.blue, GL),
    B(16, 56, -2, 16, 6, 20, G.blue, { m: 'gloss', r: 2.6 }),
    DS(16, 47, -13, 4.5, 6, G.black, { m: 'gloss', seg: 14 }),
    C(16, 38, 3, 1.8, 6, G.chrome, { m: 'metal', seg: 10 }),
    LA(16, 31.6, 3, [[0.6, 0], [1.6, 1.2], [1.8, 3.6], [1.4, 4.4]], G.steelD, { m: 'metal', seg: 10 }),
    RD([16, 29.8, 3], [16, 31.8, 3], 0.3, G.steelD, MT),
    DS(23.6, 44, 0, 2, 2, G.black, { m: 'gloss', ax: 'x', seg: 10 }),
    ...[90, 210, 330].flatMap(d => { const a = d * Math.PI / 180, eh = 44 + Math.sin(a) * 9, ez = Math.cos(a) * 9; return [RD([24.6, 44, 0], [24.6, eh, ez], 0.5, G.chrome, MT), S(24.6, eh, ez, 1.4, 1.4, 1.4, G.yellow, GL)]; }),
    B(9, 44, 7.6, 3.4, 4.4, 1.4, G.yellow, GL), DS(9, 45, 8.4, 0.8, 0.4, G.red, { m: 'plain', seg: 8 }), DS(9, 43, 8.4, 0.8, 0.4, G.green, { m: 'plain', seg: 8 }),
  ]),

  // a bench grinder on its pedestal: a blue motor between two grey stones, steel guards over them, tool rests and eye
  // shields, the switch at the front
  piece('grggrinder', 'Garage bench grinder', 1, 1, 720, 'metal', [
    B(16, 1, 0, 18, 2, 18, G.oily, MT),
    C(16, 15, 0, 2.6, 26, G.steelD, { m: 'metal', seg: 12 }),
    B(16, 28.6, 0, 22, 1.2, 12, G.steelD, MT),
    B(16, 30.2, 0, 8, 2, 7, G.steelD, MT),
    RD([6, 35, 0], [26, 35, 0], 0.5, G.chrome, MT),
    ...[6.4, 25.6].flatMap(x => [
      B(x, 37.4, -1.4, 3.8, 8.4, 11.6, G.steelD, { m: 'metal', r: 2.6 }),
      DS(x, 35, 0, 5.4, 2.4, G.stone, { m: 'plain', ax: 'x', seg: 16 }),
      B(x, 31.4, 5.6, 4, 0.8, 3, G.steelD, MT),
      B(x, 41.4, 5.8, 5, 3.6, 0.4, '#cfe8f4', { m: 'glass' }),
    ]),
    DS(16, 35, 0, 5, 11, G.blue, { m: 'gloss', ax: 'x', seg: 16 }),
    B(16, 33.6, 5, 3, 2, 1, G.yellow, GL), DS(16, 33.6, 5.6, 0.6, 0.4, G.red, { m: 'plain', seg: 6 }),
  ]),

  // a welding cart: a yellow welder with its panel of dials, a green gas bottle chained at the back, big wheels, coils
  // of red and black lead, the torch on top with its arc lit blue and the black welding mask beside it
  piece('grgwelder', 'Garage welding cart', 1, 1, 980, 'metal', [
    ...[3.4, 28.6].map(x => DS(x, 5.4, -6, 5.4, 2, G.rubber, { m: 'plain', ax: 'x', seg: 16 })),
    RD([3.4, 5.4, -6], [28.6, 5.4, -6], 0.5, G.steelD, MT),
    ...caster(7, 8), ...caster(25, 8),
    B(16, 5, 1, 22, 1.4, 22, G.steelD, MT),
    ...[5.4, 26.6].map(x => RD([x, 5.7, -12], [x, 40, -12], 0.6, G.steelD, MT)), RD([5.4, 40, -12], [26.6, 40, -12], 0.6, G.steelD, MT),
    LA(16, 5.7, -8, [[5, 0], [5.2, 0.6], [5.2, 34], [4, 38], [1.6, 40]], G.green, { m: 'gloss', seg: 14 }),
    RG(16, 30, -8, 5.4, 0.4, G.steelD, { m: 'metal', flat: true }),
    C(16, 47, -8, 1.2, 3, G.chrome, { m: 'metal', seg: 8 }), B(16, 49, -7, 3, 2, 3, G.steelD, MT), DS(16, 49, -5.2, 1.6, 0.8, G.white, { m: 'plain', seg: 10 }),
    B(16, 13.6, 2, 22, 15, 18, G.yellow, GL),
    B(16, 13.6, 11.2, 20, 13, 0.5, G.black, PL), PC(16, 13.6, 11.5, 19, 12, weldPanel),
    RG(28.6, 26, 3, 3.2, 0.7, G.red, { m: 'gloss', ax: 'x' }), RG(28.6, 15, 4, 3.2, 0.7, G.black, { m: 'gloss', ax: 'x' }),
    S(8, 25.8, 1, 4.6, 4.8, 4.2, G.black, { m: 'gloss', seg: 12 }), B(8, 26.6, 5, 4.4, 2, 0.6, '#3a5a48', GL),
    RD([13, 22, 4], [21, 22, 8], 0.8, G.black, GL), RD([21, 22, 8], [23.4, 21.4, 9.6], 0.5, G.chrome, MT),
    S(24, 21.2, 10, 1, 1, 1, G.arc, GW),
  ], { glow: [G.arc] }),

  // a stack of spare tyres: three worn tyres, the top one still on its steel wheel
  piece('grgtyres', 'Garage spare tyre stack', 1, 1, 380, 'cloth', [
    ...tyre(16, 0, 0, 13.6, 8.2), ...tyre(16.6, 8.4, 0.4, 13.4, 8.2), ...tyre(15.6, 16.8, -0.4, 13.6, 8.2),
    C(15.6, 25.2, -0.4, 8.4, 0.4, G.steelL, { m: 'metal', seg: 18 }),
    C(15.6, 25.6, -0.4, 2.8, 0.8, G.steelD, { m: 'metal', seg: 10 }),
    ...[0, 1, 2, 3, 4].map(i => { const a = i / 5 * TAU; return C(15.6 + Math.cos(a) * 4.6, 25.6, -0.4 + Math.sin(a) * 4.6, 0.6, 0.8, G.chrome, { m: 'metal', seg: 6 }); }),
  ]),

  // a red trolley jack, its saddle up and long handle back, beside a pair of yellow axle stands
  piece('grgjack', 'Garage trolley jack and stands', 2, 1, 640, 'gloss', [
    B(18, 5.6, 0, 26, 6, 10, G.red, GL),
    ...[-5.8, 5.8].map(z => DS(28, 2.6, z, 2.6, 1.4, G.black, { m: 'gloss', seg: 12 })),
    ...caster(7, -4, 0.7), ...caster(7, 4, 0.7),
    C(11, 10.4, 0, 2, 4, G.chrome, { m: 'metal', seg: 10 }),
    RD([12, 7, 0], [30, 12, 0], 1.6, G.redD, GL), C(30, 13.4, 0, 3, 1.4, G.steelD, { m: 'metal', seg: 12 }),
    RD([7, 7, 0], [2.4, 32, 0], 0.8, G.chrome, MT), RD([2.4, 32, 0], [1.6, 37, 0], 1.1, G.black, GL),
    ...[44, 57].flatMap(x => [
      ...[[-5, -5], [5, -5], [-5, 5], [5, 5]].map(([dx, dz]) => RD([x + dx, 0.8, dz], [x, 15, 0], 0.7, G.yellow, GL)),
      C(x, 15.4, 0, 2.4, 2.4, G.yellow, { m: 'gloss', seg: 10 }),
      C(x, 20.6, 0, 1.4, 10.4, G.steel, { m: 'metal', seg: 10 }),
      B(x, 26.4, 0, 6, 1.4, 3, G.yellow, GL), ...[-2.6, 2.6].map(d => B(x + d, 28, 0, 0.9, 2.4, 3, G.yellow, GL)),
      RD([x, 18, 1], [x, 18, 4.4], 0.4, G.chrome, MT),
    ]),
  ]),

  // a blue oil drum with its ribs and bungs, a yellow MOTOR OIL label, a gold oil can left on its lid
  piece('grgoildrum', 'Garage oil drum', 1, 1, 360, 'gloss', [
    C(16, 19, 0, 12, 36, G.blue, { m: 'gloss', seg: 20 }),
    ...[1.6, 12.6, 25.4].map(h => RG(16, h, 0, 12.1, 0.7, G.blueD, { m: 'gloss', flat: true })),
    C(16, 37.2, 0, 12.2, 0.6, G.blueD, { m: 'gloss', seg: 20 }),
    C(21, 37.8, -5, 1.6, 1, G.chrome, { m: 'metal', seg: 8 }), C(9, 37.8, -6, 1, 0.8, G.chrome, { m: 'metal', seg: 8 }),
    PC(16, 19, 12.05, 8, 8, oilLabel),
    LA(10, 37.5, 3, [[3, 0], [3, 4], [2.4, 5], [1, 6.4], [0.6, 8]], G.gold, { m: 'metal', seg: 10 }),
    RD([11.4, 41, 3], [17, 45, 5], 0.35, G.gold, MT), RD([7, 42, 3], [6.4, 39, 3], 0.4, G.gold, MT),
  ]),

  // a steel rack of jerrycans: red petrol and green diesel below, yellow and red above, a flammable diamond on top
  piece('grgjerry', 'Garage jerrycan rack', 1, 1, 480, 'metal', [
    ...[2, 30].flatMap(x => [-9, 9].map(z => B(x, 21.6, z, 1.6, 43.2, 1.6, G.steelD, MT))),
    ...[1.6, 21, 41.4].map(h => B(16, h, 0, 30, 1.2, 20, G.steelD, MT)),
    ...jerry(9, 2.2, G.red), ...jerry(23, 2.2, G.green), ...jerry(9, 21.6, G.yellow), ...jerry(23, 21.6, G.red),
    PR(16, 42.2, -9.2, [[0, 0], [5, 5], [0, 10], [-5, 5]], 0.6, G.red, GL), PC(16, 47.2, -8.85, 6.4, 6.4, flameSign),
  ]),

  // a mechanic's creeper: a red frame on four castors, a black padded deck and headrest, a rag and a spanner left on it
  piece('grgcreeper', 'Garage creeper board', 1, 1, 280, 'cloth', [
    ...[3, 29].flatMap(x => [-5.5, 5.5].flatMap(z => caster(x, z, 0.6))),
    B(16, 3.3, 0, 30, 1.4, 15, G.red, GL),
    B(14.4, 5.2, 0, 24, 2.4, 12, G.black, { m: 'cloth', r: 1.2 }),
    B(27.6, 6.4, 0, 5, 3.6, 11, G.black, { m: 'cloth', r: 1.6 }),
    B(9, 6.8, 2, 6, 0.8, 5, G.blueL, { m: 'cloth', r: 0.4 }),
    RD([14, 6.8, -3], [21, 6.8, -1], 0.5, G.chrome, MT),
  ]),

  // an engine on a red engine stand: an oily block with a red valve cover, the oil pan below, pulleys at the front, its
  // exhaust manifold, the stand's post and castored T-foot
  piece('grgengine', 'Garage engine on a stand', 1, 1, 1350, 'metal', [
    B(16, 2.4, 8, 26, 1.8, 2.4, G.red, GL), B(16, 2.4, -1, 2.4, 1.8, 20, G.red, GL),
    ...caster(4, 8, 0.6), ...caster(28, 8, 0.6), ...caster(16, -10, 0.6),
    B(16, 14, -9, 3, 22, 3, G.red, GL), B(16, 25, -7.4, 3, 3, 6, G.red, GL),
    B(16, 30, -4.6, 10, 10, 1, G.steelD, MT),
    B(16, 23.4, 3, 16, 3.6, 11, G.black, GL),
    B(16, 31, 3, 20, 12, 13, G.oily, MT),
    B(16, 39, 3, 21, 4, 14, G.steelD, MT),
    B(16, 42.6, 3, 19, 3.4, 11, G.red, GL), C(10, 45, 3, 1.2, 1.4, G.black, { m: 'gloss', seg: 8 }),
    ...[11, 15, 19, 23].map(x => RD([x, 44.2, 7], [x + 1.6, 40, 10.4], 0.35, G.black, PL)),
    ...[30, 34].map(h => RD([26, h, 0], [28.6, h - 4, 4], 0.9, G.steelD, MT)), RD([28.6, 26, 4], [28.6, 21, 4], 1, G.steelD, MT),
    DS(16, 28, 10.2, 4, 1.4, G.steelL, { m: 'metal', seg: 14 }), DS(16, 28, 11, 1.2, 0.6, G.steelD, { m: 'metal', seg: 8 }),
    C(8.6, 35, 10, 2.4, 3.4, G.steelL, { m: 'metal', seg: 10 }), DS(8.6, 35, 11.4, 1.6, 0.8, G.black, { m: 'gloss', seg: 10 }),
    RD([9.6, 36.4, 11], [18.6, 31.2, 11], 0.4, G.black, PL), RD([7.6, 33.6, 11], [13.6, 26, 11], 0.4, G.black, PL),
  ]),

  // the Bicycle up on a repair stand: red frame, chrome wheels and spokes, its saddle post held in the stand's yellow
  // clamp, a tray of tools on the stand's post
  piece('grgbike', 'Garage Bicycle repair stand', 2, 1, 1250, 'gloss', [
    ...[[22, -14], [42, -14], [32, 2]].map(([x, z]) => RD([32, 8, -9], [x, 0.7, z], 0.8, G.black, GL)),
    RD([32, 8, -9], [32, 48, -9], 1, G.steelD, MT),
    B(32, 30, -9, 9, 1, 6, G.yellow, GL), B(29.6, 31, -9, 2.4, 1, 2, G.red, PL), RD([33, 31, -9], [36, 31.2, -8], 0.3, G.chrome, MT),
    RD([32, 46, -9], [26.4, 39, -2], 0.8, G.steelD, MT),
    B(26, 37, -1.4, 3.4, 4, 3, G.yellow, GL),
    ...bicycle(9),
  ]),

  // a red air compressor: its tank on wheels, the black motor and steel pump on top under a red belt guard, a gauge
  // and a coil of yellow air hose
  piece('grgcompressor', 'Garage air compressor', 1, 1, 760, 'gloss', [
    DS(16, 10, 0, 7.4, 22, G.red, { m: 'gloss', ax: 'x', seg: 16 }),
    ...[5, 27].map(x => S(x, 10, 0, 2.2, 7.4, 7.4, G.red, { m: 'gloss', seg: 14 })),
    ...[-9.4, 9.4].map(z => DS(7, 4.4, z, 4.4, 2, G.black, { m: 'gloss', seg: 14 })), RD([7, 4.4, -10], [7, 4.4, 10], 0.5, G.steelD, MT),
    B(25, 1.6, 0, 4, 3.2, 10, G.black, GL),
    B(17.4, 21.4, -6.4, 15, 9, 2.4, G.red, { m: 'gloss', r: 3 }),
    DS(12, 21.4, -1, 4, 9, G.blackL, { m: 'gloss', ax: 'x', seg: 14 }),
    B(22, 21.6, -1, 6, 8, 7, G.steelD, MT), C(22, 27, -1, 2.6, 3, G.steelL, { m: 'metal', seg: 10 }),
    ...[-6, 6].map(z => RD([4, 16, z], [1.6, 26, z], 0.6, G.black, GL)), RD([1.6, 26, -6], [1.6, 26, 6], 0.9, G.black, GL),
    B(22, 27.6, 4.4, 4, 3, 3, G.steelD, MT), DS(22, 30.6, 5, 2.2, 1, G.white, { m: 'plain', seg: 12 }), RD([22, 30.6, 5.6], [23.2, 31.6, 5.6], 0.2, G.red, PL),
    RG(16, 10, 8.4, 4, 0.8, G.yellow, GL), RG(16, 10, 8.8, 2.6, 0.8, G.yellow, GL),
  ]),

  // a black drum fan on a yoke: yellow blades behind a chrome cage, a carry handle on top
  piece('grgfan', 'Garage drum fan', 1, 1, 420, 'metal', [
    B(16, 1.2, 0, 26, 2.4, 10, G.black, GL),
    ...[4, 28].map(x => RD([x, 2.4, 0], [x, 20, 0], 0.9, G.black, GL)),
    DS(3.4, 20, 0, 1.6, 1.4, G.yellow, { m: 'gloss', ax: 'x', seg: 10 }), DS(28.6, 20, 0, 1.6, 1.4, G.yellow, { m: 'gloss', ax: 'x', seg: 10 }),
    DS(16, 20, -2, 11.8, 5, G.black, { m: 'gloss', seg: 20 }),
    DS(16, 20, -6, 4.4, 4, G.blackL, { m: 'gloss', seg: 12 }),
    ...[90, 210, 330].map(d => { const a = d * Math.PI / 180; return PR(16, 20, 1.2, [[0, 0], [Math.cos(a - 0.4) * 10, Math.sin(a - 0.4) * 10], [Math.cos(a + 0.25) * 10.4, Math.sin(a + 0.25) * 10.4]], 0.6, G.yellow, GL); }),
    DS(16, 20, 2, 2.4, 1.6, G.yellowD, { m: 'gloss', seg: 10 }),
    RG(16, 20, 3.4, 11.8, 0.5, G.chrome, MT), RG(16, 20, 3.4, 7.6, 0.3, G.chrome, MT), RG(16, 20, 3.4, 3.8, 0.3, G.chrome, MT),
    ...[0, 45, 90, 135].map(d => { const a = d * Math.PI / 180; return RD([16 - Math.cos(a) * 11.6, 20 - Math.sin(a) * 11.6, 3.4], [16 + Math.cos(a) * 11.6, 20 + Math.sin(a) * 11.6, 3.4], 0.25, G.chrome, MT); }),
    ...[11, 21].map(x => RD([x, 31.4, -2], [x, 34, -2], 0.6, G.black, GL)), RD([11, 34, -2], [21, 34, -2], 0.7, G.black, GL),
  ]),

  // a cork board of plans in a wooden frame: Rotom's mower drawn up on a big blueprint, a parts list, a snapshot of a
  // red motorbike and sticky notes, all pinned in red
  wallPiece('grgblueprints', 'Garage Rotom blueprint board', 2, 480, 'wood', [
    B(32, 62, 0.8, 60, 34, 1.6, G.woodD, WD),
    B(32, 62, 1.2, 56, 30, 1.4, G.cork, { m: 'cloth', tex: 'cork' }),
    B(21, 62, 2.05, 30, 22, 0.3, G.print, PL), PC(21, 62, 2.25, 30, 22, rotomPrint),
    B(46, 69, 2.05, 12, 12, 0.3, G.paper, PL), PC(46, 69, 2.25, 12, 12, partsList),
    B(46, 54, 2.1, 10, 9, 0.3, G.white, PL), PC(46, 54, 2.3, 10, 9, snapshot),
    B(55.6, 50.4, 2.05, 5, 5, 0.3, G.note, PL), B(56, 72.4, 2.05, 5, 5, 0.3, G.noteP, PL),
    ...[[7.4, 72], [34.6, 72], [7.4, 52], [34.6, 52], [46, 74.4], [46, 57.8], [55.6, 52.4], [56, 74.4]].map(([x, h]) => DS(x, h, 2.6, 0.8, 0.6, G.red, { m: 'gloss', seg: 8 })),
  ]),

  // a steel roller shutter door: its drum housing on top, hazard-striped guide rails, the slats, a bottom bar with its
  // handle and a KEEP CLEAR sign
  wallPiece('grgshutter', 'Garage roller shutter door', 2, 880, 'metal', [
    B(32, 87.6, 2.4, 62, 8, 4.8, G.steelD, { m: 'metal', r: 2.4 }),
    ...[3.4, 60.6].flatMap(x => [B(x, 44, 1.4, 4.4, 80, 2.8, G.black, PL), PC(x, 44, 2.85, 4.4, 80, stripes(4))]),
    B(32, 46, 0.8, 52, 76, 1.2, G.steel, { m: 'metal', tex: 'slats' }),
    B(32, 9.4, 1.4, 52, 3.2, 2, G.steelD, MT),
    ...[27, 37].map(x => RD([x, 11, 2], [x, 14, 2.8], 0.5, G.black, GL)), RD([27, 14, 2.8], [37, 14, 2.8], 0.6, G.black, GL),
    DS(32, 18, 1.6, 1.2, 0.6, G.chrome, { m: 'metal', seg: 10 }),
    B(32, 54, 1.6, 22, 7, 0.4, G.yellow, PL), PC(32, 54, 1.85, 22, 7, word('KEEP CLEAR', G.black, G.yellow, 0.6)),
  ]),

  // a rubber floor mat for the work bay: hazard stripes round a dark ribbed middle, a yellow badge of a crossed spanner
  // and screwdriver
  { id: 'grgmat', name: 'Garage hazard floor mat', group: GROUP, solo: true, w: 3, h: 2, layer: 'rug', price: 540, high: 0.03, side: 'c', flat() {
    const g = ctx(), path = () => { g.beginPath(); RUG.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
    g.save(); path(); g.clip(); stripes(6)(g, 0, 0, 96, 64); g.restore();
    g.fillStyle = G.blackL; g.fillRect(9, 9, 78, 46);
    g.strokeStyle = G.rubber; g.lineWidth = 0.6;
    for (let y = 11, i = 0; y < 54; y += 2.6, i++) for (let x = 11 + (i % 2) * 1.6; x < 86; x += 3.2) { g.beginPath(); g.moveTo(x - 0.8, y + (i % 2 ? 0.5 : -0.5)); g.lineTo(x + 0.8, y + (i % 2 ? -0.5 : 0.5)); g.stroke(); }
    g.strokeStyle = G.yellow; g.lineWidth = 0.8; g.strokeRect(11, 11, 74, 42);
    const cx = 48, cy = 32;
    g.fillStyle = G.yellow; g.beginPath(); g.arc(cx, cy, 13, 0, TAU); g.fill();
    g.strokeStyle = G.black; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, 11.6, 0, TAU); g.stroke();
    g.lineCap = 'round';
    g.save(); g.translate(cx, cy); g.rotate(-Math.PI / 4);
    g.fillStyle = G.black; g.fillRect(-1.2, -8, 2.4, 14); g.beginPath(); g.arc(0, -8.4, 3, 0, TAU); g.fill();
    g.fillStyle = G.yellow; g.fillRect(-1.1, -12, 2.2, 4);
    g.rotate(Math.PI / 2);
    g.fillStyle = G.black; g.fillRect(-0.6, -9, 1.2, 9); g.fillRect(-1.6, 0, 3.2, 8);
    g.restore();
    g.strokeStyle = sh(G.black, 1); g.lineWidth = 1; path(); g.stroke();
  } },

  // a work lamp on a yellow tripod stand, and up on top Magnemite holding the caged lamp off its magnet
  piece('grglamp', 'Garage Magnemite work lamp', 1, 1, 820, 'metal', [
    ...[90, 210, 330].map(d => { const a = d * Math.PI / 180; return RD([14, 10, 0], [14 + Math.cos(a) * 11, 0.7, Math.sin(a) * 11], 0.7, G.yellow, GL); }),
    RD([14, 10, 0], [14, 44.6, 0], 0.9, G.yellow, GL), C(14, 24, 0, 1.6, 2.4, G.black, { m: 'gloss', seg: 10 }), RD([14, 24, 1.4], [14, 24, 3.4], 0.5, G.black, GL),
    S(14, 50, 0, 6, 6, 6, G.mag, { m: 'metal', seg: 16 }),
    DS(14, 50.6, 5.6, 3.4, 0.6, G.white, { m: 'plain', seg: 14 }), DS(14, 50.6, 6.1, 1.3, 0.4, G.black, { m: 'plain', seg: 10 }),
    C(14, 57, 0, 1.3, 2.6, G.steelL, { m: 'metal', seg: 8 }), C(14, 58.6, 0, 2, 0.8, G.steelL, { m: 'metal', seg: 10 }),
    RD([11.6, 45.6, 1.6], [10.4, 43.6, 2], 0.9, G.steelL, MT), RD([16.4, 45.6, 1.6], [17.6, 43.6, 2], 0.9, G.steelL, MT),
    RG(5.6, 50, 0, 2.4, 0.9, G.magD, { m: 'metal', a0: -Math.PI / 2, arc: Math.PI }),
    RD([5.6, 52.4, 0], [3.4, 52.4, 0], 0.9, G.magD, MT), RD([5.6, 47.6, 0], [3.4, 47.6, 0], 0.9, G.magD, MT),
    RD([3.4, 52.4, 0], [1.6, 52.4, 0], 0.95, G.red, GL), RD([3.4, 47.6, 0], [1.6, 47.6, 0], 0.95, G.pory, GL),
    RG(22.4, 50, 0, 2.4, 0.9, G.magD, { m: 'metal', a0: Math.PI / 2, arc: Math.PI }),
    RD([22.4, 52.4, 0], [24.6, 52.4, 0], 0.9, G.magD, MT), RD([22.4, 47.6, 0], [24.6, 47.6, 0], 0.9, G.magD, MT),
    RD([24.6, 52.4, 0], [26.4, 52.4, 0], 0.95, G.red, GL), RD([24.6, 47.6, 0], [26.4, 47.6, 0], 0.95, G.pory, GL),
    RD([26, 46.8, 0], [26, 41.6, 0], 0.3, G.black, PL),
    C(26, 40.6, 0, 1.6, 2, G.black, { m: 'gloss', seg: 10 }),
    LA(26, 30.6, 0, [[0.8, 0], [2.4, 1.2], [3, 4.4], [2.4, 7.6], [1.4, 9]], G.glowW, { m: 'glow', seg: 12 }),
    ...[32, 36].map(h => RG(26, h, 0, 3.3, 0.3, G.black, { m: 'plain', flat: true })),
    ...[22.8, 29.2].map(x => RD([x, 31.2, 0], [x, 38.6, 0], 0.3, G.black, PL)), RD([26, 31, 3.2], [26, 38.6, 3.2], 0.3, G.black, PL),
  ], { glow: [G.glowW] }),

  // a steel shelf of parts: labelled boxes of bolts, nuts and fuses, a red parts bin, spray cans, a car battery and
  // bottles of motor oil
  piece('grgshelf', 'Garage parts shelf', 1, 1, 640, 'metal', [
    ...[1.4, 30.6].flatMap(x => [-9, 9].map(z => B(x, 29, z, 1.4, 58, 1.4, G.steelD, MT))),
    ...[2, 16, 30, 44, 57.4].map(h => B(16, h, 0, 30, 1.2, 20, G.steel, MT)),
    B(9, 8.6, 0, 13, 11, 16, G.kraft, CL), B(9, 9.4, 8.1, 8, 3, 0.3, G.paper, PL), PC(9, 9.4, 8.3, 8, 3, label('PARTS')),
    B(23, 6, 3, 11, 6.4, 12, G.red, GL),
    ...[[6.5, G.blue, 'BOLTS'], [16, G.yellow, 'NUTS'], [25.5, G.blue, 'FUSES']].flatMap(([x, c, t]) => [B(x, 19.6, 3, 8, 5.4, 12, c, GL), B(x, 19.6, 9.1, 6, 2.4, 0.3, G.paper, PL), PC(x, 19.6, 9.3, 6, 2.4, label(t))]),
    B(11, 35.6, -1, 16, 10, 16, G.kraft, CL), B(11, 36, 7.1, 9, 3.4, 0.3, G.paper, PL), PC(11, 36, 7.3, 9, 3.4, label('SPARES')),
    ...[[23.4, G.red], [27.6, G.blue]].flatMap(([x, c]) => [C(x, 34.6, 3, 1.8, 8, c, { m: 'gloss', seg: 10 }), C(x, 39.4, 3, 1.2, 1.6, G.steelL, { m: 'metal', seg: 8 })]),
    B(10, 48.6, 0, 12, 8, 9, G.black, GL), B(10, 49, 4.6, 9, 3, 0.3, G.yellow, PL), PC(10, 49, 4.8, 9, 3, word('12V', G.black, G.yellow)),
    C(6.4, 53.2, -1, 1, 1.2, G.red, { m: 'gloss', seg: 8 }), C(13.6, 53.2, -1, 1, 1.2, G.black, { m: 'gloss', seg: 8 }),
    ...oilBottle(21.6, 44.6, 1, G.yellow), ...oilBottle(27, 44.6, 1, G.green),
  ]),

  // a mechanic's shop stool: a round black seat on a gas column, a red tool tray ringing it low, five castors
  piece('grgstool', "Garage mechanic's stool", 1, 1, 260, 'cloth', [
    ...starBase(16),
    C(16, 10, 0, 1.6, 12, G.chrome, { m: 'metal', seg: 10 }),
    C(16, 7.4, 0, 9, 1.6, G.red, { m: 'gloss', seg: 18 }), RG(16, 8.4, 0, 8.6, 0.5, G.redD, { m: 'gloss', flat: true }),
    RD([10, 8.6, 2], [15, 8.6, 5], 0.4, G.chrome, MT), C(20, 9, -3, 1, 2, G.yellow, { m: 'gloss', seg: 8 }),
    C(16, 16.6, 0, 3, 1.6, G.steelD, { m: 'metal', seg: 10 }),
    C(16, 18.2, 0, 8.4, 3.6, G.black, { m: 'cloth', seg: 18, rb: 8 }),
  ]),

  // a wall clock made of Klink: its big gear is the dial, the little gear meshed with it gives the clock its eye
  wallPiece('grgclock', 'Garage Klink gear clock', 1, 680, 'metal', [
    ...gear(13, 62, 0.8, 8.4, 11, 2.4, G.klink),
    PC(13, 62, 1.75, 12, 12, dial),
    ...gear(24.4, 50.4, 0.8, 4.8, 8, 2, G.klink),
    DS(24.4, 50.8, 1.8, 2.2, 0.6, G.white, { m: 'plain', seg: 12 }), DS(24.4, 50.6, 2.2, 0.9, 0.4, G.black, { m: 'plain', seg: 8 }),
    RD([22, 53.6, 2], [26.8, 53.2, 2], 0.4, G.klinkD, PL),
    RD([13, 73.4, 0.4], [13, 74.6, 0.4], 0.5, G.steelD, MT),
  ]),

  // a diagnostics cart: a beige computer on a steel trolley, a green readout on its screen, keyboard and tower below,
  // and Porygon perched on top keeping an eye on the numbers
  piece('grgporygon', 'Garage Porygon diagnostics cart', 1, 1, 1300, 'metal', [
    ...[4, 28].flatMap(x => [-9, 9].flatMap(z => caster(x, z))),
    ...[3, 29].flatMap(x => [-10, 10].map(z => B(x, 17.2, z, 1.4, 25.6, 1.4, G.steelD, MT))),
    B(16, 5.4, 0, 28, 1.2, 22, G.steelD, MT), B(16, 18, 0, 28, 1.2, 22, G.steelD, MT), B(16, 30.2, 0, 28, 1.4, 22, G.steel, MT),
    B(10, 11.6, 0, 8, 10, 16, G.beige, GL), DS(10, 14.4, 8.1, 0.6, 0.4, G.code, { m: 'plain', seg: 6 }), B(10, 9.6, 8.05, 5, 0.6, 0.2, G.beigeD, PL),
    RG(23, 9.4, 2, 3, 0.6, G.black, { m: 'gloss', ax: 'x' }),
    B(16, 19.3, 7.4, 22, 1.4, 7, G.beigeD, GL),
    B(16, 40, -1, 24, 18, 16, G.beige, GL),
    B(16, 40.6, 7.1, 19.4, 13.4, 0.4, G.screen, GW), PC(16, 40.6, 7.35, 18.4, 12.4, diagScreen),
    B(16, 32, 7.2, 6, 1, 0.4, G.beigeD, PL),
    B(15, 55.4, -1, 10, 7, 9, G.pink, GL), B(15, 55.4, -5.6, 6, 4, 0.4, G.pory, PL),
    ...[12, 18].map(x => B(x, 51.6, 2, 3, 1.4, 3, G.pory, GL)),
    B(9.4, 56, -3, 3, 4, 3, G.pory, GL), B(7.6, 58.4, -3, 2.4, 2.4, 2.4, G.pory, GL),
    B(19.6, 61.6, 1, 8, 6, 7, G.pink, GL), B(19.6, 60.6, 5.6, 4, 2.4, 2.4, G.pory, GL),
    DS(17.4, 62.4, 4.6, 1.2, 0.4, G.white, { m: 'plain', seg: 8 }), DS(17.4, 62.4, 4.9, 0.6, 0.3, G.black, { m: 'plain', seg: 6 }),
  ], { glow: [G.screen] }),

  // the parts counter: a blue counter with a steel top, PARTS & SERVICE on a yellow sign, a hazard-striped kick plate,
  // a service bell, a clipboard of job cards and a box of spark plugs
  piece('grgcounter', 'Garage parts counter', 2, 1, 1100, 'gloss', [
    B(32, 1.6, -1, 60, 3.2, 22, G.black, PL),
    B(32, 18.6, -1, 62, 30.4, 24, G.blue, GL),
    B(32, 4.8, 11.15, 60, 3.2, 0.3, G.yellow, PL), PC(32, 4.8, 11.35, 60, 3.2, stripes(3)),
    B(32, 22, 11.2, 40, 8, 0.5, G.yellow, PL), PC(32, 22, 11.5, 40, 8, word('PARTS & SERVICE', G.black, G.yellow, 0.56)),
    B(32, 35, 0, 64, 2.4, 28, G.steelL, MT),
    LA(48, 36.2, 2, [[2.8, 0], [2.8, 0.4], [2.4, 1], [1.6, 2.4], [0.6, 3], [0.4, 3.6], [0, 3.8]], G.chrome, { m: 'metal', seg: 14 }),
    B(20, 36.5, 2, 9, 0.6, 12, G.woodD, WD), B(20, 36.9, 2.4, 7.6, 0.3, 10, G.paper, PL), B(20, 37.1, -3.4, 3, 0.6, 1.2, G.chrome, MT),
    B(36, 38.7, -6, 8, 5, 6, G.kraft, CL), B(36, 38.7, -2.9, 6, 2, 0.3, G.red, PL),
    RD([6, 36.6, -4], [14, 36.6, 0], 0.5, G.chrome, MT),
  ]),

  // a red racing bucket seat bolted to a steel frame on rails, a black centre and wings for the head
  piece('grgbucket', 'Garage bucket-seat chair', 1, 1, 640, 'cloth', [
    ...[8, 24].map(x => B(x, 1.2, 0, 2.6, 2.4, 26, G.steelL, MT)),
    B(16, 6, 0, 18, 5, 16, G.black, GL),
    B(16, 11.6, 1.4, 18, 4.4, 18, G.red, { m: 'cloth', r: 2 }),
    B(16, 14, 2.2, 11, 0.6, 15, G.black, { m: 'cloth', r: 0.3 }),
    ...[6, 26].map(x => B(x, 14.4, 1.4, 4, 8, 18, G.red, { m: 'cloth', r: 2 })),
    WG(16, 9.6, 0, 22, [[-6, 2], [-10.4, 2], [-13.4, 36.6], [-11, 38], [-9, 36.6]], G.red, CL),
    WG(16, 9.6, 0.3, 12, [[-6.2, 4], [-9, 4], [-11.6, 32], [-9.4, 33]], G.black, CL),
    ...[6.4, 25.6].map(x => WG(x, 9.6, 0, 3.4, [[-6, 8], [-9.6, 8], [-12.4, 30], [-10, 30]], G.redD, CL)),
  ]),
];
