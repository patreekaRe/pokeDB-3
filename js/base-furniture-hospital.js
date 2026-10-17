/* base-furniture-hospital.js  -  the Hospital ward set (furniture expansion, room types, 2026-10-17): Animal Crossing's
   Happy Home Paradise hospital, kept friendly. White and pale mint, aqua vinyl, soft Pokémon Center pink, brushed steel,
   pale wood and green privacy curtains. No red cross: its medical mark is a pink Poké Ball with a white heart for a button
   (`mark()`). Chansey on the nurse's station, Blissey with a tray of Lucky Eggs, Audino with a clipboard, Comfey's lei on
   the get-well flowers and an eye chart read in Unown for the Pokémon touches. All solo, fixed colours, sold all year.
   An upright piece is a list of parts in painted units (32 a tile), as in js/base-furniture-ranch.js: `x` across from
   the left of its front, `h` up from the floor (a wall piece's from the foot of its strip), `z` out to the front from
   its middle (a wall piece's from the wall). They're painted here from any side, and js/base-models-hospital.js builds
   the same list as 3D parts (BUILT), so picture and model agree. A ring or disc with `ax: 'x'` stands side-on (the
   wheelchair's wheels, the castors, the tap's gooseneck). A `pic` part (the monitor's pulse, the X-ray films, the eye
   chart, the clock's dial, the station's screen, the quiet sign) is painted on the front only, and the model wears that
   crop of the painting. The medicine cabinet's glass doors swing (`doors`, `inside`). The rug is painted from above. */

import { sh, oval, ovalShade, floorShadow, ctx, hash, glass as glassPane } from './base-paint.js';

export const HC = {
  white: '#f6f8f6', whiteD: '#dfe6e3', cream: '#fbf6ea', mint: '#bfe8dc', mintL: '#def5ee', mintD: '#86c4b2',
  aqua: '#a4dce4', aquaD: '#62acba', pink: '#f5a8c0', pinkL: '#fcd4e0', pinkD: '#e07898',
  steel: '#bcc4c8', steelL: '#dde3e6', steelD: '#858e93', rubber: '#4a5054',
  wood: '#e4cca4', woodL: '#f2e0c2', woodD: '#c4a274', curtain: '#94caa0', curtainL: '#b4dcbc', curtainD: '#6ea87c',
  ink: '#2a3236', screen: '#163430', pulse: '#78f0a4', bulb: '#fff4d6', xlight: '#e4f2fa', film: '#1c2a3a', bone: '#cfe6f2',
  fluid: '#f9cbd8', water: '#a8d8ec', yellow: '#f6d460', blue: '#5a9ad8', purple: '#9a86d0', leaf: '#6ab070', leafD: '#4c9058',
  chansey: '#f7bccb', chanseyD: '#e894aa', egg: '#fbf4e4', audino: '#f4e6cc', audinoP: '#f2a6b8', eye: '#4a84c8',
  comfey: '#5cb06a', berry: '#4a7cd0',
};
const GROUP = 'Hospital';
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

const CL = { m: 'cloth' }, PL = { m: 'plain' }, GL = { m: 'gloss' }, WD = { m: 'wood' }, MT = { m: 'metal' };

/** A heart's outline about its middle, r about half its width (the medical mark's button, the pillows, a balloon). */
const heartPts = (r) => Array.from({ length: 24 }, (_, i) => {
  const t = i / 24 * TAU, s = r / 16;
  return [16 * Math.sin(t) ** 3 * s, (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t) + 4) * s];
});
/** A half disc's outline, its flat side down. */
const halfPts = (r) => Array.from({ length: 13 }, (_, i) => [Math.cos(i / 12 * Math.PI) * r, Math.sin(i / 12 * Math.PI) * r]);
/** The ward's medical mark facing front: a Poké Ball, pink above, its band, and a white button holding a pink heart. */
const mark = (x, h, z, r) => [
  DS(x, h, z, r, 0.5, HC.white, { m: 'plain', seg: 18 }),
  PR(x, h, z + 0.3, halfPts(r * 0.97), 0.4, HC.pink, PL),
  B(x, h, z + 0.55, r * 1.94, r * 0.2, 0.3, HC.pinkD, { m: 'plain', r: 0.1 }),
  DS(x, h, z + 0.75, r * 0.4, 0.4, HC.white, { m: 'plain', seg: 14 }),
  PR(x, h - r * 0.03, z + 0.95, heartPts(r * 0.23), 0.3, HC.pink, PL),
];
/** A castor under a frame at h 4.4 (scaled by s): its stem and a little rubber wheel standing side-on. */
const caster = (x, z, s = 1) => [
  RD([x, 4.4 * s, z], [x, 2.4 * s, z], 0.55 * s, HC.steelD, MT),
  DS(x, 1.8 * s, z, 1.8 * s, 1.3 * s, HC.rubber, { m: 'plain', ax: 'x', seg: 10 }),
];
/** A five-legged wheeled star foot round a pole at x (the drip stand, the exam lamp). */
function starBase(x, R = 11) {
  const parts = [C(x, 3.4, 0, 2.2, 3, HC.steelD, { m: 'metal', seg: 10 })];
  for (let i = 0; i < 5; i++) {
    const a = Math.PI / 2 + i / 5 * TAU, ex = x + Math.cos(a) * R, ez = Math.sin(a) * R;
    parts.push(RD([x, 3.6, 0], [ex, 3, ez], 0.9, HC.steel, MT), ...caster(ex, ez, 0.75));
  }
  return parts;
}
/** A Potion-shaped bottle of colour c, its white cap. */
const potion = (x, h, z, c, s = 1) => [
  LA(x, h, z, [[2 * s, 0], [2.4 * s, 0.6 * s], [2.4 * s, 5 * s], [1.3 * s, 7 * s], [1 * s, 8 * s]], c, { m: 'gloss', seg: 10 }),
  C(x, h + 8.6 * s, z, 1.3 * s, 1.4 * s, HC.white, { m: 'gloss', seg: 8 }),
];
const foot4 = (xs, zs, s, hh, c = HC.woodD) => xs.flatMap(x => zs.map(z => B(x, hh / 2, z, s, hh, s, c, WD)));

/* ---------- painting the parts ---------- */

function grad(g, x0, y0, x1, y1, c, m) {
  const l = g.createLinearGradient(x0, y0, x1, y1);
  if (m === 'metal') [[0, sh(c, 2)], [0.25, c], [0.55, sh(c, -1)], [0.8, sh(c, 1)], [1, sh(c, -1)]].forEach(s => l.addColorStop(...s));
  else if (m === 'glow') [[0, c], [1, c]].forEach(s => l.addColorStop(...s));
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
  if (m === 'glow') { oval(cx, cy, rx, ry, c); return; }
  if (m === 'glass') { g.save(); g.globalAlpha *= 0.4; oval(cx, cy, rx, ry, '#dff0f8'); g.restore(); return; }
  if (m === 'plain') { oval(cx, cy, rx, ry, c); return; }
  ovalShade(cx, cy, rx, ry, c);
  if (m === 'gloss' || m === 'metal') { g.save(); g.globalAlpha *= 0.55; oval(cx - rx * 0.38, cy - ry * 0.42, rx * 0.22, ry * 0.14, '#ffffff'); g.restore(); }
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
      case 'box': { const w = side ? q.d : q.w; rbx(cx - w / 2, cy - q.hh / 2, w, q.hh, q.r, q.c, m); break; }
      case 'cyl': {
        const rb = q.rb ?? q.r, k = side ? q.sz ?? 1 : 1, top = cy - q.hh / 2, bot = cy + q.hh / 2;
        poly([[cx - q.r * k, top], [cx + q.r * k, top], [cx + rb * k, bot], [cx - rb * k, bot]], q.c, m, m !== 'glow');
        if (m !== 'glass') oval(cx, top, q.r * k, Math.min(q.r * 0.22, Math.max(0.3, q.hh / 2)), sh(q.c, m === 'glow' ? 0 : 1));
        break;
      }
      case 'ball': ball(cx, cy, side ? q.rz : q.rx, q.ry, q.c, m); break;
      case 'disc': if (edge) rbx(cx - q.th / 2, cy - (q.ry ?? q.r), q.th, (q.ry ?? q.r) * 2, q.th / 2, q.c, m); else ball(cx, cy, q.r, q.ry ?? q.r, q.c, m); break;
      case 'lathe': {
        const P = (dx, up) => [cx + flip * dx, cy - up];
        const pts = [...q.pts.map(([r, up]) => P(-r, up)), ...q.pts.slice().reverse().map(([r, up]) => P(r, up))];
        poly(pts, q.c, m, m !== 'glow');
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
        if (m !== 'plain') { g.save(); g.globalAlpha *= 0.45; g.strokeStyle = sh(q.c, 2); g.lineWidth = q.tr * 0.6; path(-q.tr * 0.4); g.stroke(); g.restore(); }
        break;
      }
      case 'rod': {
        const p0 = [U(q.a[0], q.a[2]), b - q.a[1]], p1 = [U(q.b[0], q.b[2]), b - q.b[1]];
        if (Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) < 0.05) { ball(p0[0], p0[1], q.r, q.r, q.c, m); break; }
        g.lineCap = 'round'; g.strokeStyle = m === 'glass' ? 'rgba(207,232,244,0.4)' : q.c; g.lineWidth = q.r * 2;
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
        poly(q.pts.map(([px, ph]) => [U(q.x + px), b - q.h - ph]), q.c, m);
        break;
      }
      case 'pic': g.save(); g.beginPath(); g.rect(cx - q.w / 2, cy - q.hh / 2, q.w, q.hh); g.clip(); q.fn(g, cx - q.w / 2, cy - q.hh / 2, q.w, q.hh); g.restore(); break;
    }
  }
}

/* ---------- pictures ---------- */

const heartPath = (g, cx, cy, r) => { g.beginPath(); heartPts(r).forEach(([px, py], i) => (i ? g.lineTo(cx + px, cy - py) : g.moveTo(cx + px, cy - py))); g.closePath(); };

/** The heart monitor's screen: a faint grid, the green pulse (it lights at night), an aqua oxygen trace, a pink heart and 72. */
function pulseScreen(g, x, y, w, h) {
  g.fillStyle = HC.screen; g.fillRect(x, y, w, h);
  g.strokeStyle = 'rgba(120,240,164,0.14)'; g.lineWidth = 0.2; g.beginPath();
  for (let gx = x + 2; gx < x + w; gx += 2) { g.moveTo(gx, y); g.lineTo(gx, y + h); }
  for (let gy = y + 2; gy < y + h; gy += 2) { g.moveTo(x, gy); g.lineTo(x + w, gy); }
  g.stroke();
  const base = y + h * 0.42, P = [[0, 0], [0.16, 0], [0.2, -0.05], [0.24, 0], [0.3, 0], [0.33, 0.1], [0.37, -0.42], [0.41, 0.2], [0.44, 0], [0.54, 0], [0.6, -0.08], [0.66, 0], [0.7, 0]];
  g.strokeStyle = HC.pulse; g.lineWidth = 0.7; g.lineJoin = 'round'; g.lineCap = 'round'; g.beginPath();
  P.forEach(([px, py], i) => (i ? g.lineTo(x + w * 0.04 + px * w * 0.9, base + py * h) : g.moveTo(x + w * 0.04 + px * w * 0.9, base + py * h)));
  g.stroke();
  g.strokeStyle = HC.aqua; g.lineWidth = 0.45; g.beginPath();
  for (let i = 0; i <= 30; i++) { const px = x + w * 0.04 + i / 30 * w * 0.62, py = y + h * 0.8 - Math.max(0, Math.sin(i / 30 * TAU * 2.5)) * h * 0.12; i ? g.lineTo(px, py) : g.moveTo(px, py); }
  g.stroke();
  g.fillStyle = HC.pink; heartPath(g, x + w * 0.82, y + h * 0.26, w * 0.07); g.fill();
  g.fillStyle = HC.pulse; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `bold ${h * 0.3}px monospace`;
  g.fillText('72', x + w * 0.83, y + h * 0.56);
  g.fillStyle = HC.aqua; g.font = `bold ${h * 0.18}px monospace`; g.fillText('98%', x + w * 0.83, y + h * 0.82);
}

/** The nurse's station screen: the ward's beds as six boxes, a Poké Ball resting in each, a heart by the ones mended. */
function wardScreen(g, x, y, w, h) {
  g.fillStyle = '#d6f0f4'; g.fillRect(x, y, w, h);
  g.fillStyle = HC.aquaD; g.fillRect(x, y, w, h * 0.2);
  g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `bold ${h * 0.14}px sans-serif`;
  g.fillText('WARD 3', x + w / 2, y + h * 0.1, w * 0.9);
  for (let i = 0; i < 6; i++) {
    const bx = x + w * (0.06 + (i % 3) * 0.31), by = y + h * (0.27 + (i / 3 | 0) * 0.37), bw = w * 0.26, bh = h * 0.31;
    g.fillStyle = '#ffffff'; g.fillRect(bx, by, bw, bh);
    const cx = bx + bw * 0.38, cy = by + bh / 2, r = bh * 0.3;
    g.fillStyle = HC.pink; g.beginPath(); g.arc(cx, cy, r, Math.PI, TAU); g.fill();
    g.fillStyle = '#f4f4f4'; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI); g.fill();
    g.strokeStyle = HC.ink; g.lineWidth = 0.25; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.moveTo(cx - r, cy); g.lineTo(cx + r, cy); g.stroke();
    if (hash(i, 3, 1) < 0.6) { g.fillStyle = HC.pinkD; heartPath(g, bx + bw * 0.78, cy, bh * 0.14); g.fill(); }
  }
}

/** An X-ray film: the deep blue film, its bones lit pale (they glow with the box at night). `chansey` shows Chansey's
    round outline and the egg in her pouch; otherwise a chest of ribs about a spine. */
function film(chansey) {
  return (g, x, y, w, h) => {
    g.fillStyle = HC.film; g.fillRect(x, y, w, h);
    g.strokeStyle = HC.bone; g.fillStyle = HC.bone; g.lineCap = 'round';
    const cx = x + w / 2;
    if (chansey) {
      g.save(); g.globalAlpha = 0.35; g.lineWidth = 0.6; g.beginPath(); g.ellipse(cx, y + h * 0.55, w * 0.38, h * 0.36, 0, 0, TAU); g.stroke();
      for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * w * 0.18, y + h * 0.22); g.quadraticCurveTo(cx + s * w * 0.26, y + h * 0.08, cx + s * w * 0.3, y + h * 0.2); g.stroke(); }
      g.restore();
      g.lineWidth = 0.7; g.beginPath(); g.ellipse(cx, y + h * 0.66, w * 0.14, h * 0.13, 0, 0, TAU); g.stroke();
      g.save(); g.globalAlpha = 0.5; g.beginPath(); g.ellipse(cx, y + h * 0.66, w * 0.1, h * 0.09, 0, 0, TAU); g.fill(); g.restore();
      g.lineWidth = 0.5;
      for (let i = 0; i < 5; i++) { const by = y + h * (0.3 + i * 0.07); g.beginPath(); g.moveTo(cx - w * 0.04, by); g.lineTo(cx + w * 0.04, by); g.stroke(); }
      g.beginPath(); g.ellipse(cx, y + h * 0.2, w * 0.13, h * 0.08, 0, 0, TAU); g.stroke();
    } else {
      g.lineWidth = w * 0.06; g.beginPath(); g.moveTo(cx, y + h * 0.1); g.lineTo(cx, y + h * 0.92); g.stroke();
      g.lineWidth = w * 0.035;
      for (let i = 0; i < 6; i++) for (const s of [-1, 1]) {
        const ry = y + h * (0.24 + i * 0.1);
        g.beginPath(); g.moveTo(cx + s * w * 0.04, ry); g.quadraticCurveTo(cx + s * w * 0.4, ry - h * 0.04, cx + s * w * 0.34, ry + h * 0.1); g.stroke();
      }
      for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * w * 0.05, y + h * 0.16); g.lineTo(cx + s * w * 0.4, y + h * 0.12); g.stroke(); }
      g.lineWidth = w * 0.04; g.beginPath(); g.moveTo(cx - w * 0.28, y + h * 0.92); g.quadraticCurveTo(cx, y + h * 0.78, cx + w * 0.28, y + h * 0.92); g.stroke();
    }
    g.fillStyle = HC.bone; g.textAlign = 'left'; g.textBaseline = 'top'; g.font = `${h * 0.07}px monospace`;
    g.fillText(chansey ? 'CHANSEY' : 'R', x + w * 0.06, y + h * 0.04);
  };
}

/** One Unown letter: its eye and two or three strokes, picked by the letter's number. */
function unown(g, cx, cy, s, i) {
  g.strokeStyle = HC.ink; g.fillStyle = HC.ink; g.lineCap = 'round'; g.lineWidth = s * 0.16;
  g.beginPath(); g.arc(cx, cy, s * 0.28, 0, TAU); g.stroke();
  g.beginPath(); g.arc(cx, cy, s * 0.1, 0, TAU); g.fill();
  const n = 2 + (hash(i, 5, 2) < 0.5 ? 1 : 0);
  for (let k = 0; k < n; k++) {
    const a = (Math.floor(hash(i, k, 3) * 8) / 8) * TAU, a1 = a + (hash(i, k, 4) - 0.5) * 1.2;
    g.beginPath(); g.moveTo(cx + Math.cos(a) * s * 0.28, cy + Math.sin(a) * s * 0.28); g.lineTo(cx + Math.cos(a1) * s * 0.62, cy + Math.sin(a1) * s * 0.62); g.stroke();
  }
}
/** The eye chart: rows of Unown getting smaller, a pink rule under the line you should read. */
function unownChart(g, x, y, w, h) {
  g.fillStyle = HC.white; g.fillRect(x, y, w, h);
  const rows = [[1, 0.22], [2, 0.15], [3, 0.11], [4, 0.085], [5, 0.068], [6, 0.055]];
  let cy = y + h * 0.09, n = 0;
  rows.forEach(([count, sz], r) => {
    const s = h * sz, step = w * 0.84 / count;
    cy += s * 0.62;
    for (let i = 0; i < count; i++) unown(g, x + w * 0.08 + step * (i + 0.5), cy, s, n++);
    cy += s * 0.62 + h * 0.012;
    if (r === 3) { g.fillStyle = HC.pinkD; g.fillRect(x + w * 0.1, cy - h * 0.012, w * 0.8, h * 0.008); }
  });
}

/** The wall clock's dial: white, steel ticks, a pink heart at twelve, a pink second hand. */
function clockDial(g, x, y, w, h) {
  const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2;
  g.fillStyle = HC.white; g.fillRect(x, y, w, h);
  g.fillStyle = HC.steelD;
  for (let i = 0; i < 12; i++) {
    if (i === 0) continue;
    const a = i / 12 * TAU - Math.PI / 2, big = i % 3 === 0;
    g.save(); g.translate(cx + Math.cos(a) * r * 0.82, cy + Math.sin(a) * r * 0.82); g.rotate(a + Math.PI / 2); g.fillRect(-r * (big ? 0.05 : 0.025), -r * (big ? 0.12 : 0.07), r * (big ? 0.1 : 0.05), r * (big ? 0.24 : 0.14)); g.restore();
  }
  g.fillStyle = HC.pink; heartPath(g, cx, cy - r * 0.8, r * 0.13); g.fill();
  g.strokeStyle = HC.ink; g.lineCap = 'round';
  for (const [a, len, lw] of [[-150, 0.45, 0.09], [-30, 0.66, 0.06]]) { const t = a * Math.PI / 180; g.lineWidth = r * lw; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(t) * r * len, cy + Math.sin(t) * r * len); g.stroke(); }
  g.strokeStyle = HC.pinkD; g.lineWidth = r * 0.025; g.beginPath(); g.moveTo(cx - r * 0.15, cy + r * 0.1); g.lineTo(cx + r * 0.6, cy - r * 0.4); g.stroke();
  g.fillStyle = HC.pinkD; g.beginPath(); g.arc(cx, cy, r * 0.07, 0, TAU); g.fill();
}

/** The quiet sign: a sleeping crescent moon, Zz, and QUIET PLEASE. */
function quietSign(g, x, y, w, h) {
  g.fillStyle = HC.pinkL; g.fillRect(x, y, w, h);
  const mx = x + w * 0.15, my = y + h / 2, r = h * 0.3;
  g.fillStyle = HC.yellow; g.beginPath(); g.arc(mx, my, r, 0, TAU); g.fill();
  g.fillStyle = HC.pinkL; g.beginPath(); g.arc(mx + r * 0.5, my - r * 0.3, r * 0.85, 0, TAU); g.fill();
  g.fillStyle = HC.aquaD; g.textAlign = 'left'; g.textBaseline = 'middle';
  g.font = `bold ${h * 0.22}px sans-serif`; g.fillText('z', x + w * 0.24, y + h * 0.3); g.font = `bold ${h * 0.16}px sans-serif`; g.fillText('z', x + w * 0.28, y + h * 0.16);
  g.fillStyle = HC.pinkD; g.textAlign = 'center';
  g.font = `bold ${h * 0.32}px sans-serif`; g.fillText('QUIET', x + w * 0.64, y + h * 0.33, w * 0.6);
  g.font = `bold ${h * 0.24}px sans-serif`; g.fillText('PLEASE', x + w * 0.64, y + h * 0.7, w * 0.6);
}

/* ---------- the kinds ---------- */

/** What js/base-models-hospital.js builds for each upright and wall kind: its parts, doors and default material. */
export const BUILT = {};
/** The floor mat's outline from above, in painted units across its 2 x 2 tiles. */
export const RUG = [[1, 1], [63, 1], [63, 63], [1, 63]];

function piece(id, name, w, h, price, mat, parts, { doors = [], inside, ...rest } = {}) {
  BUILT[id] = { parts, doors, inside, mat };
  const all = [...parts, ...doors.flatMap(d => d.parts)];
  return { id, name, group: GROUP, solo: true, w, h, price, ...rest, draw(x, b, vw, dir) { floorShadow(x, b, vw); paintParts(all, x, b, vw, dir, w * 32); } };
}
function wallPiece(id, name, w, price, mat, parts, rest = {}) {
  BUILT[id] = { parts, doors: [], mat };
  return { id, name, group: GROUP, solo: true, w, h: 1, layer: 'wall', price, ...rest, wall(x) { paintParts(parts, x, 96, w * 32, 0, w * 32); } };
}

export const HOSPITAL_KINDS = [
  // an adjustable ward bed, foot to the front: a white head and footboard capped in pink, the mark on the head, steel
  // side rails, a mint mattress under a pink blanket with a white turned-down cuff, the chart clipped to the foot; tap it
  // and everyone in the room is healed
  piece('hspbed', 'Hospital bed', 1, 2, 1500, 'gloss', [
    ...[4, 28].flatMap(x => [-26, 26].flatMap(z => caster(x, z))),
    B(16, 6, 0, 22, 2.4, 40, HC.steelD, MT),
    B(16, 9, 0, 28, 3, 58, HC.steel, MT),
    B(16, 26, -29.5, 30, 30, 3, HC.white, GL), B(16, 41.6, -29.5, 31, 3, 3.6, HC.pink, GL),
    ...mark(16, 33, -27.6, 5),
    B(16, 13, 0, 27, 3, 54, HC.whiteD, PL),
    B(16, 16.4, 0, 26, 4, 52, HC.mintL, CL),
    S(16, 21.4, -21, 10, 3.4, 5, HC.white, { m: 'cloth', seg: 12 }),
    B(16, 19.4, 7, 28, 2, 42, HC.pink, CL), B(16, 20.6, -12, 28.4, 1.4, 4, HC.white, CL),
    B(16, 15, 27.6, 28, 9, 1, HC.pink, CL),
    ...[1.6, 30.4].flatMap(x => [RD([x, 27, -24], [x, 27, 2], 0.8, HC.steelL, MT), RD([x, 22, -24], [x, 22, 2], 0.7, HC.steelL, MT),
      ...[-24, 2].map(z => RD([x, 10.5, z], [x, 27, z], 0.8, HC.steelL, MT))]),
    B(16, 17.5, 29.6, 30, 18, 3, HC.white, GL), B(16, 27.2, 29.6, 31, 2.6, 3.6, HC.pink, GL),
    B(16, 19, 31.6, 9, 11, 0.8, HC.woodL, WD), B(16, 18.6, 32.1, 7.4, 8.6, 0.3, HC.white, PL), B(16, 24.4, 32.3, 3.6, 1.4, 0.8, HC.steelD, MT),
  ]),

  // a white bedside cabinet: a mint drawer, an open cubby with a pink towel and tissues, a pale wood top with a water
  // jug, a cup and a get-well card
  piece('hspcabinet', 'Hospital bedside cabinet', 1, 1, 420, 'gloss', [
    B(16, 1.5, 0, 26, 3, 22, HC.steelD, MT),
    B(16, 15, 0, 28, 24, 24, HC.white, GL),
    B(16, 23, 12.3, 25, 6, 0.8, HC.mint, GL), B(16, 23, 13, 8, 1.2, 0.8, HC.steelD, MT),
    B(16, 12.5, 12.2, 25, 11, 0.4, HC.mintD, PL),
    B(11, 10, 12.8, 10, 5, 1, HC.pinkL, CL), B(22, 11, 12.8, 7, 7, 1, HC.aqua, GL), B(22, 15, 13, 2.4, 1.4, 0.6, HC.white, CL),
    B(16, 27.8, 0, 30, 1.6, 26, HC.woodL, WD),
    LA(9, 28.6, -2, [[3, 0], [3.4, 1], [3.6, 7], [2.6, 9], [2.9, 10.4]], HC.aqua, { m: 'gloss', seg: 12 }),
    RG(12.6, 33, -2, 2.4, 0.6, HC.aqua, { m: 'gloss', a0: -Math.PI / 2, arc: Math.PI }),
    C(16.4, 30.8, 3, 1.8, 4.4, HC.white, { m: 'gloss', seg: 10 }),
    B(23.4, 32.2, -1, 8, 7.4, 0.6, HC.white, PL), PR(23.4, 31.4, -0.5, heartPts(2.4), 0.4, HC.pink, PL),
  ]),

  // an over-bed table on a wheeled steel base: one column at the side, a pale wood top with a meal tray of soup, a
  // pudding and an Oran Berry
  piece('hsptable', 'Hospital over-bed table', 1, 1, 380, 'metal', [
    ...[5, 27].flatMap(x => [-10, 10].flatMap(z => caster(x, z, 0.8))),
    ...[5, 27].map(x => B(x, 4, 0, 4, 1.8, 24, HC.steel, MT)), B(16, 4, -10, 26, 1.8, 3, HC.steel, MT),
    B(6, 14, -8, 4, 20, 4, HC.steel, MT), B(6, 23, -8, 4.8, 8, 4.8, HC.steelL, MT),
    B(16, 28, 0, 30, 2, 20, HC.woodL, WD), B(16, 28, 10.2, 30, 2, 0.6, HC.mint, PL),
    B(18, 29.5, 1, 18, 1, 12, HC.pinkL, GL),
    LA(12.4, 30, 1, [[1.6, 0], [3, 1.2], [3.2, 2.4]], HC.white, { m: 'gloss', seg: 12 }),
    C(19.6, 31.2, 3, 1.7, 2.4, HC.yellow, { m: 'gloss', rb: 1.3, seg: 10 }), C(19.6, 32.5, 3, 1.8, 0.3, HC.white, { m: 'plain', seg: 10 }),
    S(24.4, 31.6, -1.6, 2, 1.8, 2, HC.berry, { m: 'gloss', seg: 10 }), S(24.4, 33.6, -1.6, 1.2, 0.5, 0.8, HC.leaf, { m: 'plain', seg: 6 }),
    RD([15, 30.4, 5], [22, 30.4, 5.6], 0.3, HC.steelL, MT),
  ]),

  // a privacy curtain on a wheeled rail stand: steel posts and rail, a mesh band at the top and green pleats below, the
  // mark pinned in the middle
  piece('hspcurtain', 'Hospital curtain screen', 2, 1, 760, 'cloth', [
    ...[4, 60].flatMap(x => [B(x, 3.4, 0, 4, 2, 22, HC.steel, MT), ...[-9, 9].flatMap(z => caster(x, z, 0.75)), RD([x, 4, 0], [x, 74, 0], 1, HC.steelL, MT), S(x, 75, 0, 1.6, 1.6, 1.6, HC.steelD, { m: 'metal', seg: 8 })]),
    RD([4, 74, 0], [60, 74, 0], 1, HC.steelL, MT),
    B(32, 69, 0, 52, 5, 2, HC.mintL, CL),
    ...Array.from({ length: 11 }, (_, i) => C(7.4 + i * 4.92, 41, 0, 2.6, 52, i % 2 ? HC.curtainL : HC.curtain, { m: 'cloth', sz: 0.55, seg: 10 })),
    ...Array.from({ length: 11 }, (_, i) => RG(7.4 + i * 4.92, 72.4, 0, 1, 0.3, HC.steelD, { m: 'metal', ax: 'x' })),
    ...mark(32, 46, 1.8, 4.4),
  ]),

  // an IV drip stand: a five-legged wheeled foot, a steel pole with hooks, a pink drip bag with its heart label, a drip
  // chamber and the line looped down, a little water bottle on the other hook
  piece('hspdrip', 'Hospital IV drip stand', 1, 1, 300, 'metal', [
    ...starBase(16),
    RD([16, 4, 0], [16, 76, 0], 0.8, HC.steelL, MT),
    C(16, 40, 0, 1.4, 2.4, HC.steelD, { m: 'metal', seg: 8 }),
    RD([9.4, 76, 0], [22.6, 76, 0], 0.5, HC.steelL, MT), S(16, 77.2, 0, 1.2, 1.2, 1.2, HC.steelD, { m: 'metal', seg: 8 }),
    ...[9.4, 22.6].map(x => RG(x, 74.6, 0, 1.4, 0.35, HC.steelL, { m: 'metal', a0: Math.PI, arc: Math.PI })),
    RD([9.4, 73.4, 0], [10.4, 72, 0], 0.3, HC.steelD, MT),
    B(10.4, 65.4, 0.4, 7.4, 12, 2.4, HC.fluid, GL), B(10.4, 66.4, 1.7, 4.6, 4, 0.3, HC.white, PL), PR(10.4, 65.8, 1.9, heartPts(1.2), 0.2, HC.pink, PL),
    C(10.4, 57.6, 0.4, 0.9, 3.4, '#cfe8f4', { m: 'glass', seg: 8 }),
    RD([10.4, 56, 0.4], [12, 44, 1.6], 0.3, HC.white, GL), RD([12, 44, 1.6], [19.6, 34, 2.2], 0.3, HC.white, GL),
    LA(22.6, 63, 0, [[0, 0], [2.2, 0.2], [2.4, 7], [1.2, 8.6], [1, 9.6]], HC.water, { m: 'gloss', seg: 10 }),
  ]),

  // a heart monitor on a wheeled cart: a white monitor with a green pulse that lights at night, pink and aqua buttons, a
  // handle on top, its leads coiled down; tap it and it beeps
  piece('hspmonitor', 'Hospital heart monitor', 1, 1, 900, 'gloss', [
    ...[6, 26].flatMap(x => [-7, 7].flatMap(z => caster(x, z, 0.8))),
    B(16, 4.2, 0, 24, 2.2, 18, HC.steel, MT),
    B(16, 20, -2, 4, 32, 4, HC.steelL, MT),
    B(16, 21, 0, 22, 1.6, 16, HC.steel, MT), B(16, 24, 2, 14, 5, 10, HC.mint, GL),
    B(16, 37, 0, 24, 2, 18, HC.white, GL),
    B(16, 49, -1, 26, 22, 12, HC.white, { m: 'gloss', r: 2 }),
    B(16, 50.6, 5.2, 23, 16, 0.6, HC.ink, PL),
    PC(16, 50.8, 5.6, 21, 14, pulseScreen),
    ...[[8, HC.pink], [12, HC.aqua], [16, HC.mint]].map(([x, c]) => DS(x, 40.8, 5.4, 1.1, 0.6, c, { m: 'gloss', seg: 8 })), B(23, 40.8, 5.3, 5, 1.4, 0.6, HC.steelD, MT),
    ...[8, 24].map(x => RD([x, 60, -1], [x, 63, -1], 0.6, HC.steelD, MT)), RD([8, 63, -1], [24, 63, -1], 0.7, HC.steelD, MT),
    RD([29, 46, 0], [29.4, 30, 3], 0.4, HC.aqua, GL), RG(28.6, 27.6, 3, 2.4, 0.4, HC.aqua, { m: 'gloss', ax: 'x' }),
    RD([3, 46, 0], [2.6, 32, 3], 0.4, HC.pink, GL),
  ], { glow: [HC.pulse] }),

  // a wheelchair facing out: big steel-rimmed wheels side-on, a pink sling seat and back with the mark, padded arms,
  // footrests and little front castors
  piece('hspwheelchair', 'Hospital wheelchair', 1, 1, 820, 'metal', (() => {
    const parts = [];
    for (const x of [3, 29]) {
      const o = x < 16 ? -1 : 1;
      parts.push(RG(x, 12, -2, 10.6, 1.1, HC.rubber, { m: 'plain', ax: 'x' }), RG(x + o * 1.6, 12, -2, 9.4, 0.5, HC.steelL, { m: 'metal', ax: 'x' }),
        DS(x, 12, -2, 1.8, 2.6, HC.steelD, { m: 'metal', ax: 'x', seg: 10 }));
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, c = Math.cos(a), s = Math.sin(a); parts.push(RD([x, 12 + s * 1.6, -2 + c * 1.6], [x, 12 + s * 9.6, -2 + c * 9.6], 0.22, HC.steelL, MT)); }
    }
    parts.push(
      ...[7, 25].flatMap(x => [RD([x, 15, 10], [x, 5.2, 11], 0.6, HC.steel, MT), DS(x, 2.6, 11, 2.6, 1.2, HC.rubber, { m: 'plain', ax: 'x', seg: 10 })]),
      ...[6, 26].flatMap(x => [RD([x, 15.6, -10], [x, 15.6, 10], 0.7, HC.steel, MT), RD([x, 15.6, -10], [x, 38, -11.4], 0.7, HC.steel, MT),
        RD([x, 38, -11.4], [x, 38.6, -15], 0.9, HC.rubber, PL), RD([x, 15.6, 6], [x, 23.6, 6], 0.6, HC.steel, MT)]),
      B(16, 17, 0, 20, 2, 18, HC.pink, CL),
      B(16, 27, -10.2, 20, 16, 1.4, HC.pink, CL),
      ...mark(16, 28, -9.3, 4),
      ...[5.4, 26.6].map(x => B(x, 24.4, 0, 2.6, 1.8, 15, HC.rubber, PL)),
      ...[10, 22].flatMap(x => [RD([x < 16 ? 7 : 25, 15.6, 9], [x, 5.4, 13], 0.5, HC.steel, MT), B(x, 4.8, 13.6, 7, 0.9, 4, HC.rubber, PL)]),
    );
    return parts;
  })()),

  // a visitor's armchair of pale wood with mint cushions and a pink heart pillow
  piece('hspchair', 'Hospital visitor chair', 1, 1, 360, 'wood', [
    ...[4, 28].flatMap(x => [B(x, 12, 8, 2.6, 24, 2.6, HC.wood, WD), B(x, 20, -10, 2.6, 40, 2.6, HC.wood, WD), B(x, 25, -0.5, 3.2, 2, 21, HC.woodL, WD)]),
    ...[[16, 8], [16, -10]].map(([x, z]) => RD([4, 6, z], [28, 6, z], 0.8, HC.woodD, WD)),
    B(16, 13.4, 0, 25, 2.4, 20, HC.wood, WD),
    B(16, 16.6, 1, 22, 4, 18, HC.mint, CL),
    B(16, 30, -9.4, 22, 14, 3, HC.mint, CL), B(16, 39, -10, 26, 2.4, 3, HC.woodD, WD),
    PR(16, 24, -7.4, heartPts(5.4), 2.4, HC.pink, CL),
  ]),

  // a long aqua vinyl day-room sofa on a pale wood base with wooden arms, a pink heart cushion and a round Chansey-pink one
  piece('hspsofa', 'Hospital day-room sofa', 2, 1, 1100, 'cloth', [
    ...foot4([6, 58], [-9, 9], 3.4, 4),
    B(32, 8, 1, 56, 8, 24, HC.woodL, WD),
    ...[19, 45].map(x => B(x, 14.6, 3, 25.6, 5, 20, HC.aqua, CL)),
    B(32, 24.6, -9, 54, 24, 6, HC.aqua, CL),
    ...[19, 45].map(x => B(x, 25, -5.4, 25, 14, 3, HC.mint, CL)),
    ...[3.5, 60.5].flatMap(x => [B(x, 16.5, 1, 6, 17, 24, HC.woodL, WD), B(x, 25.4, 1, 6.6, 1.6, 25, HC.wood, WD)]),
    PR(14, 20, -2, heartPts(5), 2.4, HC.pink, CL),
    S(50, 23.4, -2.4, 5.6, 5.6, 2.4, HC.chansey, { m: 'cloth', seg: 12 }), DS(50, 23.4, 0.1, 2, 0.4, HC.white, { m: 'plain', seg: 10 }),
  ]),

  // the nurse's station: a white counter banded pink and mint with the big mark on its front, a pale wood ledge with a
  // service bell, a clipboard and a little Chansey, the ward screen behind; tap it and the bell rings
  piece('hspdesk', "Hospital nurse's station", 2, 1, 1450, 'gloss', [
    B(32, 13, -8, 60, 26, 14, HC.mintL, GL),
    RD([46, 26, -9], [46, 40, -9], 1, HC.steelD, MT),
    B(46, 46, -9, 19, 13.4, 2, HC.ink, GL), PC(46, 46.2, -7.9, 17, 11.4, wardScreen),
    B(32, 19, 7, 62, 38, 12, HC.white, GL),
    B(32, 4, 13.3, 62, 8, 0.8, HC.mintD, GL), B(32, 34, 13.3, 62, 4, 0.8, HC.pink, GL),
    ...mark(32, 19.6, 13.6, 8.4),
    B(32, 39, 6, 64, 2, 15, HC.woodL, WD),
    LA(13, 40, 9, [[2.8, 0], [2.8, 0.5], [2.4, 1], [1.8, 2.6], [0.5, 3.4], [0.5, 4], [0, 4.3]], HC.yellow, { m: 'metal', seg: 12 }),
    B(37, 40.3, 9, 8, 0.6, 7, HC.woodL, WD), B(37, 40.7, 9, 6.4, 0.3, 5.6, HC.white, PL),
    S(25, 45.4, 6, 4.8, 5, 4, HC.chansey, { m: 'cloth', seg: 12 }),
    S(25, 43, 9.4, 2, 2, 1, HC.egg, { m: 'gloss', seg: 8 }),
    ...[-1, 1].flatMap(s => [S(25 + s * 2.8, 50.6, 6, 0.9, 1.6, 0.9, HC.chanseyD, { m: 'cloth', seg: 6 }), S(25 + s * 2, 40.8, 7.4, 1.4, 0.8, 1.6, HC.chansey, { m: 'cloth', seg: 6 }),
      S(25 + s * 3.8, 44.6, 7.6, 1.2, 1, 1, HC.chansey, { m: 'cloth', seg: 6 }), DS(25 + s * 1.6, 47.4, 9.3, 0.5, 0.3, HC.ink, { m: 'plain', seg: 6 })]),
  ]),

  // a tall white medicine cabinet: a mint drawer below, three steel shelves of Potions, Super Potions, pill jars and
  // bandage rolls behind two glass doors that swing open, the mark on a plaque on top
  piece('hspmedcab', 'Hospital medicine cabinet', 1, 1, 980, 'gloss', [
    B(16, 1.5, 0, 28, 3, 20, HC.steelD, MT),
    B(16, 36, -8.6, 28, 66, 1.6, HC.white, GL),
    ...[2.4, 29.6].map(x => B(x, 36, 0.6, 2, 66, 20, HC.white, GL)),
    B(16, 70, 0.6, 31, 2.4, 22, HC.white, GL), B(16, 72, 0.6, 30, 1.6, 21, HC.pink, GL),
    B(16, 8, 9.6, 25, 9, 1, HC.mint, GL), B(16, 8, 10.4, 7, 1.2, 0.8, HC.steelD, MT),
    ...[13, 31, 49].map(h => B(16, h, 0, 25, 1, 17, HC.steelL, MT)),
    ...potion(7, 13.5, 0, HC.pink), ...potion(12, 13.5, 0, HC.pink), B(20, 17.4, -2, 6, 7, 7, HC.aqua, GL), C(25.4, 16.5, 1, 2, 6, HC.white, { m: 'gloss', seg: 10 }),
    ...potion(7, 31.5, 0, HC.purple), ...potion(12.4, 31.5, 0, HC.yellow), ...potion(17.8, 31.5, 0, HC.purple), C(24, 34.5, 1, 2.6, 6, HC.white, { m: 'gloss', seg: 10 }), C(24, 38, 1, 2.7, 1.2, HC.pink, { m: 'gloss', seg: 10 }),
    ...[7, 12].map(x => C(x, 52.5, 1, 2.2, 5, HC.cream, { m: 'gloss', seg: 10 })), B(20.5, 54, -1, 7, 8, 8, HC.mint, GL), C(25.6, 53, 2, 1.8, 7, HC.berry, { m: 'gloss', seg: 10 }),
    B(16, 78, 0, 11, 9, 1, HC.white, GL), ...mark(16, 78, 0.6, 3.6),
  ], {
    doors: [[3.4, 9.85], [28.6, 22.15]].map(([hx, xc], i) => ({ hinge: [hx, 10.4], side: i ? -1 : 1, parts: [
      B(xc, 66.4, 10.4, 12.6, 1.6, 1.2, HC.white, { m: 'gloss', r: 0.4 }), B(xc, 14.2, 10.4, 12.6, 1.6, 1.2, HC.white, { m: 'gloss', r: 0.4 }),
      B(i ? 27.8 : 4.2, 40.3, 10.4, 1.6, 53.8, 1.2, HC.white, { m: 'gloss', r: 0.4 }), B(i ? 16.8 : 15.2, 40.3, 10.4, 1.6, 53.8, 1.2, HC.white, { m: 'gloss', r: 0.4 }),
      B(xc, 40.3, 10.4, 11, 51, 0.3, '#cfe8f4', { m: 'glass', r: 0.2 }),
      B(i ? 18.4 : 13.6, 40, 11.4, 0.8, 7, 1, HC.steelL, { m: 'gloss', r: 0.3 }),
    ] })),
    inside: { x: 16, h: 40, w: 24, hh: 52, z: 9.6, bare: true },
  }),

  // a steel supply cart on castors: towels and a basin below, mint drawers, a tissue box, a jar of cotton and a Potion
  // spray on top
  piece('hspcart', 'Hospital supply cart', 1, 1, 560, 'metal', [
    ...[4, 28].flatMap(x => [-9, 9].flatMap(z => caster(x, z, 0.8))),
    ...[4, 28].flatMap(x => [-9, 9].map(z => RD([x, 3.4, z], [x, z < 0 ? 42 : 36, z], 0.9, HC.steelL, MT))),
    RD([4, 42, -9], [28, 42, -9], 0.9, HC.steelL, MT),
    ...[5, 19, 34].flatMap(h => [B(16, h, 0, 26, 1.4, 20, HC.white, GL), B(16, h + 1.2, 9.8, 26, 1.6, 0.6, HC.mint, PL)]),
    B(10, 7.4, 0, 10, 3, 14, HC.mintL, CL), B(10, 10.4, 0, 10, 3, 14, HC.pinkL, CL),
    LA(22, 5.7, 0, [[3, 0], [4.6, 2.4], [4.8, 3]], HC.steelL, { m: 'metal', seg: 12 }),
    B(16, 24.6, 0, 22, 8, 16, HC.mint, GL), B(16, 24.6, 8.1, 22, 0.4, 0.4, HC.mintD, PL),
    ...[[16, 26.6], [16, 22.6]].map(([x, h]) => B(x, h, 8.4, 5, 1, 0.6, HC.pink, GL)),
    B(9, 37.2, -2, 8, 4.6, 6, HC.aqua, GL), B(9, 40, -2, 2.4, 1.4, 0.8, HC.white, CL),
    C(16.4, 37.6, 2, 2.4, 6, '#cfe8f4', { m: 'glass', seg: 10 }), C(16.4, 37, 2, 2, 4.4, HC.white, { m: 'cloth', seg: 10 }), C(16.4, 41, 2, 2.6, 0.8, HC.pink, { m: 'gloss', seg: 10 }),
    ...potion(23, 34.7, 0, HC.purple, 0.9), B(23, 44.2, 0, 1.6, 1.2, 2.6, HC.white, GL),
  ]),

  // an X-ray light box: a white housing, its pale panel lit behind two films (a chest of ribs, and Chansey with the egg
  // in her pouch); tap it to switch the light
  wallPiece('hspxray', 'Hospital X-ray light box', 2, 640, 'gloss', [
    B(32, 58, 1.6, 56, 30, 3.2, HC.white, GL),
    B(32, 59, 3.3, 52, 24, 0.3, HC.xlight, { m: 'glow', r: 0.3 }),
    PC(19, 58.6, 3.6, 20, 22, film(false)), PC(45, 58.6, 3.6, 20, 22, film(true)),
    ...[19, 45].map(x => B(x, 70, 3.9, 5, 1.4, 0.6, HC.steelD, MT)),
    DS(52, 45, 3.4, 0.9, 0.6, HC.pink, { m: 'gloss', seg: 8 }), DS(12, 45, 3.4, 0.6, 0.4, HC.pulse, { m: 'glow', seg: 8 }),
  ], { glow: [HC.xlight, HC.bone] }),

  // an eye chart read in Unown, rows getting smaller, a pink rule under the line to read
  wallPiece('hspeyechart', 'Hospital Unown eye chart', 1, 260, 'plain', [
    B(16, 54, 0.4, 22, 36, 0.8, HC.steelL, MT),
    B(16, 54, 0.9, 20, 34, 0.4, HC.white, PL),
    PC(16, 54, 1.2, 19, 33, unownChart),
  ]),

  // a round ward clock: a steel rim, a white dial with a pink heart at twelve and a pink second hand
  wallPiece('hspclock', 'Hospital wall clock', 1, 300, 'metal', [
    DS(16, 62, 0.8, 11, 1.6, HC.steelL, { m: 'metal', seg: 20 }),
    DS(16, 62, 1.7, 9.6, 0.4, HC.white, { m: 'plain', seg: 20 }),
    PC(16, 62, 2, 13.4, 13.4, clockDial),
  ]),

  // a pink QUIET PLEASE plaque with a sleeping moon
  wallPiece('hspsign', 'Hospital quiet-please sign', 1, 180, 'plain', [
    B(16, 64, 0.6, 26, 13, 1.2, HC.pinkL, { m: 'plain', r: 2 }),
    PC(16, 64, 1.3, 24, 11, quietSign),
    ...[4.4, 27.6].map(x => DS(x, 64, 1.4, 0.5, 0.3, HC.steelD, { m: 'metal', seg: 6 })),
  ]),

  // a hand-sanitiser station: a white dispenser with a pink push pad on a steel pole, a drip tray, a little sign with a
  // heart and bubbles
  piece('hspsanitizer', 'Hospital sanitiser station', 1, 1, 220, 'gloss', [
    C(16, 1, 0, 7, 2, HC.steelD, { m: 'metal', seg: 14 }),
    RD([16, 2, 0], [16, 52, 0], 1, HC.steelL, MT),
    B(16, 44, 1.6, 9, 12, 5, HC.white, GL), B(16, 45, 4.3, 6, 5, 0.6, HC.pink, GL),
    B(16, 37.4, 3, 1.6, 1.4, 1.4, HC.steelD, MT), B(16, 31, 2.4, 7, 1, 4.4, HC.steel, MT), RD([16, 31, 0], [16, 31, 1], 0.5, HC.steel, MT),
    B(16, 56.4, 1.2, 11, 8, 0.6, HC.mintL, PL), PR(16, 55.4, 1.7, heartPts(2.4), 0.3, HC.pink, PL),
    ...[[12.4, 58.4, 0.9], [19.6, 57.8, 0.7], [20.4, 55, 0.5]].map(([x, h, r]) => DS(x, h, 1.7, r, 0.3, HC.aquaD, { m: 'plain', seg: 8 })),
  ]),

  // a pale wood stand holding a pair of steel crutches with grey pads and a pink walking cane
  piece('hspcrutches', 'Hospital crutches stand', 1, 1, 240, 'metal', [
    B(16, 1.5, 0, 26, 3, 12, HC.woodL, WD),
    ...[3.6, 28.4].map(x => B(x, 21, -3, 2.4, 36, 2.4, HC.wood, WD)), B(16, 38, -3, 27, 2.4, 5, HC.woodL, WD),
    ...[8.4, 15.6].flatMap(x => [RD([x - 2.6, 53, 1], [x - 0.8, 10, 1], 0.6, HC.steelL, MT), RD([x + 2.6, 53, 1], [x + 0.8, 10, 1], 0.6, HC.steelL, MT),
      RD([x, 10, 1], [x, 3.6, 1], 0.7, HC.steel, MT), C(x, 3.8, 1, 1.1, 1.6, HC.rubber, { m: 'plain', seg: 8 }),
      B(x, 54, 1, 7.4, 2.2, 2.8, HC.steelD, { m: 'plain', r: 1 }), RD([x - 2, 33, 1], [x + 2, 33, 1], 0.9, HC.rubber, PL)]),
    RD([24, 3.6, 1], [24, 46, 1], 0.7, HC.pink, GL), RG(21.6, 46, 1, 2.4, 0.7, HC.pink, { m: 'gloss', a0: 0, arc: Math.PI }),
    C(24, 3.8, 1, 0.9, 1.4, HC.rubber, { m: 'plain', seg: 8 }),
  ]),

  // get-well flowers in a mint vase with Comfey's lei of tiny flowers draped round its neck, and two balloons: a pink
  // heart and a white one with the mark
  piece('hspflowers', 'Hospital get-well flowers', 1, 1, 340, 'cloth', (() => {
    const parts = [
      LA(16, 0, 0, [[4.4, 0], [5, 1], [5.8, 6], [5, 11], [3.2, 14], [3, 16], [3.8, 17]], HC.mint, { m: 'gloss', seg: 14 }),
      RG(16, 13.4, 0, 4.4, 0.8, HC.comfey, { m: 'cloth', flat: true }),
    ];
    for (let i = 0; i < 7; i++) { const a = Math.PI * (0.05 + i * 0.15); parts.push(S(16 + Math.cos(a) * 4.4, 13.4 - Math.sin(a) * 1, Math.sin(a) * 4.4, 1, 1, 1, [HC.pink, HC.yellow, HC.white][i % 3], { m: 'cloth', seg: 6 })); }
    for (const [x, h, z, c] of [[11, 27, -1, HC.pink], [16, 30, 1, HC.white], [21, 26, 0, HC.yellow], [13.4, 22.6, 2.4, HC.pinkL], [19, 22.6, -2, HC.pink]]) {
      parts.push(RD([16, 15, 0], [x, h - 2, z], 0.4, HC.leafD, CL), S(x, h, z, 2.6, 2.2, 2.6, c, { m: 'cloth', seg: 8 }), S(x, h + 0.4, z + 1.8, 0.9, 0.9, 0.9, HC.yellow, { m: 'plain', seg: 6 }));
    }
    parts.push(S(10.6, 20, 1.6, 2.2, 0.9, 1.6, HC.leaf, { m: 'cloth', seg: 6 }), S(21.6, 19.6, -1, 2.2, 0.9, 1.6, HC.leaf, { m: 'cloth', seg: 6 }),
      RD([15, 16, -2], [8, 51, -3], 0.2, HC.white, PL), PR(8, 57, -3, heartPts(6.4), 3, HC.pink, GL),
      RD([17, 16, -2], [23.6, 56, -4], 0.2, HC.white, PL), S(23.6, 62, -4, 5, 5.6, 4.4, HC.white, { m: 'gloss', seg: 12 }), ...mark(23.6, 62, 0.4, 3.8));
    return parts;
  })()),

  // a stretcher on scissor legs and castors: a steel frame, a mint mattress with its head raised, a pillow, a folded
  // pink blanket and a steel side rail
  piece('hspgurney', 'Hospital stretcher', 2, 1, 1050, 'metal', [
    ...[5, 59].flatMap(x => [-8, 8].flatMap(z => caster(x, z))),
    ...[-8, 8].flatMap(z => [RD([5, 4.6, z], [59, 4.6, z], 0.9, HC.steel, MT), RD([8, 5, z], [56, 21, z], 0.9, HC.steelL, MT), RD([56, 5, z], [8, 21, z], 0.9, HC.steelL, MT)]),
    RD([32, 13, -8], [32, 13, 8], 0.7, HC.steelD, MT),
    B(32, 22, 0, 60, 2.4, 22, HC.steelL, MT),
    B(32, 25.4, 0, 58, 4, 20, HC.mint, CL),
    PR(9, 27.4, 0, [[-7, 0], [9, 0], [-7, 9]], 20, HC.mint, CL),
    S(6.6, 33, 0, 3, 2.4, 8, HC.white, { m: 'cloth', seg: 10 }),
    B(51, 28.6, 0, 11, 2.6, 18, HC.pink, CL), B(51, 30.1, 0, 11.4, 0.6, 18.4, HC.pinkL, CL),
    ...[16, 48].map(x => RD([x, 23, 10.8], [x, 31, 10.8], 0.6, HC.steelL, MT)), RD([16, 31, 10.8], [48, 31, 10.8], 0.7, HC.steelL, MT),
  ]),

  // a ward sink unit: a pale wood cupboard with white doors, a white basin and counter, a steel gooseneck tap with elbow
  // levers, a mint splashback with a paper towel box and a pink soap pump; tap it to run the water
  piece('hspsink', 'Hospital sink unit', 1, 1, 620, 'gloss', [
    B(16, 14, 1, 28, 28, 24, HC.woodL, WD), B(16, 1.6, 12.6, 28, 3.2, 1, HC.woodD, WD),
    ...[9.4, 22.6].flatMap(x => [B(x, 15, 13.4, 12.4, 21, 0.8, HC.white, GL), B(x < 16 ? 14 : 18, 21, 14.1, 0.8, 4, 0.8, HC.steelD, MT)]),
    B(16, 29, 1, 30, 2.4, 26, HC.white, GL),
    RG(16, 30.4, 3, 7.4, 0.7, HC.white, { m: 'gloss', flat: true }), DS(16, 30.2, 3, 6.6, 0.2, HC.whiteD, { m: 'plain', ry: 1.4, seg: 14 }),
    B(16, 44, -10.6, 30, 28, 2, HC.mintL, GL),
    RD([16, 30.2, -8], [16, 40, -8], 0.8, HC.steelL, MT), RG(16, 40, -5.4, 2.6, 0.8, HC.steelL, { m: 'metal', ax: 'x', a0: 0, arc: Math.PI }),
    RD([16, 40, -2.8], [16, 37.4, -2.8], 0.6, HC.steelL, MT),
    ...[-1, 1].map(s => RD([16 + s * 1.4, 33, -8], [16 + s * 5, 33.6, -7], 0.5, HC.steelL, MT)),
    B(7, 50, -8.4, 9, 10, 2.8, HC.white, GL), B(7, 45.4, -7, 6, 1.4, 0.4, HC.white, CL),
    B(25, 42, -8.6, 4, 6, 2.4, HC.pink, GL), B(25, 38.6, -7.6, 1, 1.2, 1.4, HC.steelD, MT),
    ...mark(25, 52, -9.4, 3),
  ]),

  // a ward floor mat: pale mint vinyl squares, a pink border, the mark in the middle and little paw prints
  { id: 'hsprug', name: 'Hospital ward floor mat', group: GROUP, solo: true, w: 2, h: 2, layer: 'rug', price: 520, high: 0.04, side: 'c', flat() {
    const g = ctx();
    g.fillStyle = HC.pinkD; g.fillRect(1, 1, 62, 62);
    g.fillStyle = HC.pinkL; g.fillRect(2.4, 2.4, 59.2, 59.2);
    g.fillStyle = HC.mintL; g.fillRect(5, 5, 54, 54);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) if ((i + j) % 2) { g.fillStyle = HC.mint; g.fillRect(5 + i * 9, 5 + j * 9, 9, 9); }
    for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) if (hash(i, j, 21) < 0.3) { g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(5 + i * 9 + 1, 5 + j * 9 + 1, 3, 1); }
    const cx = 32, cy = 32, r = 11;
    g.fillStyle = HC.white; g.beginPath(); g.arc(cx, cy, r + 1.2, 0, TAU); g.fill();
    g.fillStyle = HC.pink; g.beginPath(); g.arc(cx, cy, r, Math.PI, TAU); g.fill();
    g.fillStyle = HC.pinkD; g.fillRect(cx - r, cy - 1, r * 2, 2);
    g.fillStyle = HC.white; g.beginPath(); g.arc(cx, cy, r * 0.42, 0, TAU); g.fill();
    g.fillStyle = HC.pink; heartPath(g, cx, cy, r * 0.24); g.fill();
    for (const [px, py, a] of [[13, 13, 0.6], [51, 51, -2.5], [51, 13, -0.6], [13, 51, 2.5]]) {
      g.save(); g.translate(px, py); g.rotate(a); g.fillStyle = HC.pinkD;
      g.beginPath(); g.ellipse(0, 1, 2, 1.6, 0, 0, TAU); g.fill();
      for (const [tx, ty] of [[-2, -1.6], [-0.7, -2.6], [0.7, -2.6], [2, -1.6]]) { g.beginPath(); g.arc(tx, ty, 0.7, 0, TAU); g.fill(); }
      g.restore();
    }
  } },

  // Blissey in her white curls holding a steel tray of three spotted Lucky Eggs
  piece('hspeggtray', 'Hospital Blissey egg tray', 1, 1, 640, 'cloth', [
    ...[-1, 1].map(s => S(16 + s * 5, 2, 1, 3, 2, 4, HC.chansey, { m: 'cloth', seg: 10 })),
    S(16, 15, -1, 11, 12, 9.4, HC.chansey, { m: 'cloth', seg: 16 }),
    S(16, 27, -1.6, 7, 3, 5, HC.white, { m: 'cloth', seg: 12 }),
    ...[-1, 1].flatMap(s => [S(16 + s * 9.6, 21.6, -1, 2.6, 3.6, 3, HC.white, { m: 'cloth', seg: 10 }), S(16 + s * 6.6, 29, -2, 2, 2.4, 2, HC.white, { m: 'cloth', seg: 8 }),
      DS(16 + s * 3, 20.4, 6.7, 0.7, 0.6, HC.ink, { m: 'plain', seg: 8 }), S(16 + s * 9.6, 13.4, 5, 2.2, 1.6, 2.6, HC.chansey, { m: 'cloth', seg: 8 })]),
    S(16, 17, 7.6, 1.6, 0.5, 0.6, HC.chanseyD, { m: 'plain', seg: 6 }),
    B(16, 11.4, 9, 20, 1.2, 8, HC.steelL, { m: 'metal', r: 0.6 }),
    ...[10.6, 16, 21.4].flatMap(x => [S(x, 14.6, 9, 2.4, 3, 2.4, HC.egg, { m: 'gloss', seg: 10 }), DS(x - 0.6, 15.6, 11.3, 0.6, 0.3, HC.pink, { m: 'plain', seg: 6 }), DS(x + 0.9, 13.4, 11.3, 0.5, 0.3, HC.pink, { m: 'plain', seg: 6 })]),
  ]),

  // Audino in its pink frills, its curly ear feelers hanging down, holding the ward's clipboard
  piece('hspaudino', 'Hospital Audino helper', 1, 1, 600, 'cloth', [
    C(16, 0.5, 0, 9, 1, HC.mint, { m: 'plain', seg: 16 }),
    ...[-1, 1].map(s => S(16 + s * 3.6, 2.4, 2, 2.6, 1.6, 3.4, HC.audino, { m: 'cloth', seg: 8 })),
    S(16, 6.6, 0, 8, 3, 6.4, HC.audinoP, { m: 'cloth', seg: 12 }),
    S(16, 15, 0, 8, 9, 6.6, HC.audino, { m: 'cloth', seg: 14 }),
    S(16, 29, 0, 7.4, 6.4, 6.2, HC.audino, { m: 'cloth', seg: 14 }),
    S(16, 35.4, -0.6, 4, 1.6, 3, HC.audinoP, { m: 'cloth', seg: 8 }),
    ...[-1, 1].flatMap(s => [RD([16 + s * 6, 32, 0], [16 + s * 9.6, 22, 0.6], 1.5, HC.audinoP, CL), RG(16 + s * 10.4, 19.4, 0.6, 1.8, 0.8, HC.audinoP, { m: 'cloth' }),
      DS(16 + s * 2.6, 30, 5.6, 1, 0.6, HC.eye, { m: 'gloss', seg: 8 }), S(16 + s * 6.4, 17, 3.6, 1.8, 2.4, 1.8, HC.audino, { m: 'cloth', seg: 8 })]),
    S(16, 27.4, 6, 1.4, 0.9, 0.6, HC.audinoP, { m: 'plain', seg: 6 }),
    B(19.4, 16.6, 7.6, 7.6, 9.6, 0.8, HC.woodL, WD), B(19.4, 16, 8.1, 6.2, 7, 0.3, HC.white, PL), B(19.4, 21, 8.3, 3, 1.2, 0.6, HC.steelD, MT),
    PR(19.4, 15.6, 8.4, heartPts(1.8), 0.2, HC.pink, PL),
  ]),

  // an examination lamp on a wheeled star foot: a steel pole, an angled arm and a round white head with a warm light
  // that glows; tap it to switch it on and off
  piece('hsplamp', 'Hospital examination lamp', 1, 1, 480, 'metal', [
    ...starBase(12, 10),
    RD([12, 4, 0], [12, 52, 0], 0.9, HC.steelL, MT),
    S(12, 52.4, 0, 1.6, 1.6, 1.6, HC.steelD, { m: 'metal', seg: 8 }),
    RD([12, 52.4, 0], [22, 62, 1], 0.7, HC.steelL, MT),
    S(22, 62.4, 1, 1.4, 1.4, 1.4, HC.steelD, { m: 'metal', seg: 8 }),
    LA(22, 55, 1, [[7.4, 0], [7.2, 2.2], [5.6, 4.6], [3, 6.2], [1, 6.8], [0, 7]], HC.white, { m: 'gloss', seg: 16 }),
    C(22, 55, 1, 6.6, 0.6, HC.bulb, { m: 'glow', seg: 16 }),
    RD([29, 57.6, 1], [31, 59, 1], 0.6, HC.pink, GL),
  ], { glow: [HC.bulb] }),
];
