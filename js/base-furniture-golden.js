/* base-furniture-golden.js  -  the Golden set (furniture expansion session e, 2026-10-17): Animal Crossing's Golden
   series, never sold but earned (js/data/furniture.js). Everything solid polished gold, a bright yellow-gold body, a
   deeper gold in its shadows and pale gold where it catches the light, faint engraved lines and rosettes; deep red velvet
   on the seats and the bed, black and gold for the piano's keys. All solo, fixed colours.
   An upright piece is a list of parts in painted units (32 a tile), as in js/base-furniture-antique.js: `x` across from
   the left of its front, `h` up from the floor (a wall piece's from the foot of its strip), `z` out to the front from its
   middle (a wall piece's from the wall). They're painted here from any side, and js/base-models-golden.js builds the
   same list as 3D parts (BUILT), so picture and model agree. A `pic` part (the clock's dial, the framed seascape) is
   painted on the front only, and the model wears that crop of the painting. A `plate` is an outline seen from above
   ([x, z] points) standing hh tall, the grand piano's case; `roll` tips it about its left edge (the propped lid). A
   `slab` is a side profile run across x (the chest's open lid). The wardrobe's doors swing. The rug is painted from
   above. */

import { sh, oval, ovalShade, floorShadow, ctx, hash, glass as glassPane } from './base-paint.js';

export const GD = {
  gold: '#e8b62c', goldD: '#b5861a', goldDD: '#7c5810', goldL: '#f6d667', pale: '#fff0b4',
  velvet: '#9a1c2c', velvetD: '#681020', ruby: '#c8243a', black: '#221c1a', ivory: '#f8f1dc', flame: '#ffe08a',
  shade: '#fff0b8', mirror: '#e2e8e4', water: '#a8d8ec', foam: '#ffffff', grey: '#575a6a', eye: '#ffd23a',
  coin: '#f4c434', inside: '#3a2410', sky: '#f2b04a',
};
const GROUP = 'Golden';
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
/** A side profile [[dz, dh]...] about z, h, run w across x. */
const SL = (x, h, z, w, pts, c, o) => ({ t: 'slab', x, h, z, w, pts, c, ...o });
/** An outline [[x, z]...] seen from above, standing on h, hh tall; `roll` tips it up about its leftmost x. */
const PL = (h, pts, hh, c, o) => {
  const xs = pts.map(p => p[0]), zs = pts.map(p => p[1]);
  return { t: 'plate', x: (Math.min(...xs) + Math.max(...xs)) / 2, z: (Math.min(...zs) + Math.max(...zs)) / 2, h, pts, hh, c, px: Math.min(...xs), ...o };
};

const M = { m: 'metal' }, CL = { m: 'cloth' }, PLN = { m: 'plain' }, GL = { m: 'gloss' };
/** A cabriole leg from under a rail at `top` down to a gold paw, its knee pushed out along sx, sz. */
const cab = (x, z, top, sx, sz, c = GD.gold, foot = GD.goldD) => {
  const k = [x + sx * 1.7, top * 0.62, z + sz * 1.7], a = [x - sx * 0.2, 2.4, z - sz * 0.2];
  return [RD([x, top, z], k, 1.5, c), RD(k, a, 1, c), S(a[0] + sx * 0.3, 1.5, a[2] + sz * 0.3, 1.8, 1.5, 1.8, foot, { m: 'metal', seg: 8 })];
};
/** A turned spindle hh tall, r round at its widest. */
const turned = (x, h, z, hh, r, c = GD.gold) => LA(x, h, z, [[r * 0.9, 0], [r, hh * 0.06], [r * 0.55, hh * 0.14], [r * 1.15, hh * 0.3], [r * 0.6, hh * 0.46], [r * 0.65, hh * 0.82], [r * 1.05, hh * 0.9], [r * 0.75, hh]], c, { seg: 10 });
/** A ring pull hanging from a rosette, on a face at z. */
const pull = (x, h, z) => [DS(x, h + 1, z + 0.3, 0.8, 0.5, GD.goldD, M), RG(x, h - 0.5, z + 0.5, 1.3, 0.35, GD.goldL, { seg: 10 })];
/** A faint engraved line: a thin deep-gold rod laid on a face. */
const line = (a, b, c = GD.goldD) => RD(a, b, 0.3, c);
/** An engraved rectangle w x hh on a face at z. */
const frame = (x, h, z, w, hh, c = GD.goldD) => {
  const l = x - w / 2, r = x + w / 2, t = h + hh / 2, b = h - hh / 2;
  return [line([l, b, z], [r, b, z], c), line([r, b, z], [r, t, z], c), line([r, t, z], [l, t, z], c), line([l, t, z], [l, b, z], c)];
};
/** A four-pointed sparkle s across, facing the front. */
const star = (x, h, z, s, c = '#fffbe4') => PR(x, h, z, [[0, s], [s * 0.22, s * 0.22], [s, 0], [s * 0.22, -s * 0.22], [0, -s], [-s * 0.22, -s * 0.22], [-s, 0], [-s * 0.22, s * 0.22]], 0.4, c, PLN);
/** Tufted velvet buttons in rows across a face at z. */
const tufts = (x0, x1, rows, z, n) => rows.flatMap((h, row) => Array.from({ length: n - row % 2 }, (_, i) => DS(x0 + (i + (row % 2) * 0.5) * (x1 - x0) / (n - 1), h, z, 0.75, 0.5, GD.velvetD, { m: 'plain', seg: 6 })));

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

/** Paints parts seen from `dir` (0 front, 2 back, 1 / 3 the sides), on a view vw wide standing on line b; Wd is the
    piece's front width in units, def the material of a part that names none. */
function paintParts(parts, x0, b, vw, dir, Wd, def) {
  const side = dir % 2 === 1, sg = dir === 3 ? -1 : 1, g = ctx();
  const U = (px, pz) => (dir === 0 ? x0 + px : dir === 2 ? x0 + Wd - px : x0 + vw / 2 + sg * pz);
  const key = (q) => q.k ?? (dir === 0 ? q.z : dir === 2 ? -q.z : sg * (Wd / 2 - q.x));
  const list = parts.map((q, i) => [key(q), i, q]).sort((a, c) => a[0] - c[0] || a[1] - c[1]).map(e => e[2]);
  for (const q of list) {
    if (q.t === 'pic' && dir !== 0) continue;
    const m = q.m || def, cx = U(q.x, q.z), cy = b - q.h;
    switch (q.t) {
      case 'box': { const w = side ? q.d : q.w; rbx(cx - w / 2, cy - q.hh / 2, w, q.hh, q.r, q.c, m); break; }
      case 'cyl': {
        const rb = q.rb ?? q.r, top = cy - q.hh / 2, bot = cy + q.hh / 2;
        poly([[cx - q.r, top], [cx + q.r, top], [cx + rb, bot], [cx - rb, bot]], q.c, m, m !== 'glow');
        if (m !== 'glass') oval(cx, top, q.r, Math.min(q.r * 0.22, Math.max(0.3, q.hh / 2)), sh(q.c, m === 'glow' ? 2 : 1));
        break;
      }
      case 'ball': ball(cx, cy, side ? q.rz : q.rx, q.ry, q.c, m); break;
      case 'disc': if (side) rbx(cx - q.th / 2, cy - (q.ry ?? q.r), q.th, (q.ry ?? q.r) * 2, q.th / 2, q.c, m); else ball(cx, cy, q.r, q.ry ?? q.r, q.c, m); break;
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
        if (q.flat) g.ellipse(cx, cy, q.r, q.r * 0.22, 0, 0, TAU);
        else if (side) { rbx(cx - q.tr, cy - q.r - q.tr, q.tr * 2, (q.r + q.tr) * 2, q.tr, q.c, m); break; }
        else g.arc(cx, cy, q.r, 0, TAU);
        g.stroke();
        g.save(); g.globalAlpha *= 0.45; g.strokeStyle = sh(q.c, 2); g.lineWidth = q.tr * 0.6; g.beginPath();
        if (q.flat) g.ellipse(cx, cy - q.tr * 0.4, q.r, q.r * 0.22, 0, Math.PI, TAU); else g.arc(cx, cy, q.r, Math.PI * 1.1, Math.PI * 1.6);
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
        poly(q.pts.map(([px, ph]) => [U(q.x + px), b - q.h - ph]), q.c, m);
        break;
      }
      case 'slab': {
        if (side) { poly(q.pts.map(([dz, dh]) => [U(0, q.z + dz), b - q.h - dh]), q.c, m); break; }
        const hs = q.pts.map(p => p[1]), top = Math.max(...hs), bot = Math.min(...hs);
        rbx(cx - q.w / 2, b - q.h - top, q.w, top - bot, 0.5, q.c, m);
        break;
      }
      case 'plate': {
        const xs = q.pts.map(p => p[0]), zs = q.pts.map(p => p[1]), xa = Math.min(...xs), xb = Math.max(...xs);
        const za = Math.min(...zs), zb = Math.max(...zs), a = q.roll || 0, ca = Math.cos(a), sa = Math.sin(a);
        const at = (px, up) => [q.px + (px - q.px) * ca - up * sa, q.h + (px - q.px) * sa + up * ca];
        if (side) {
          const top = Math.max(at(xb, q.hh)[1], at(xa, q.hh)[1]), bot = Math.min(at(xa, 0)[1], at(xb, 0)[1]);
          const l = Math.min(U(0, za), U(0, zb));
          rbx(l, b - top, Math.abs(U(0, zb) - U(0, za)), top - bot, 0.6, q.c, m);
          break;
        }
        poly([at(xa, 0), at(xb, 0), at(xb, q.hh), at(xa, q.hh)].map(([px, ph]) => [U(px), b - ph]), q.c, m);
        break;
      }
      case 'pic': g.save(); g.beginPath(); g.rect(cx - q.w / 2, cy - q.hh / 2, q.w, q.hh); g.clip(); q.fn(g, cx - q.w / 2, cy - q.hh / 2, q.w, q.hh); g.restore(); break;
    }
  }
}

/* ---------- pictures ---------- */

const ROMAN = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
/** The clock's dial: a gold square with engraved corners, an ivory chapter ring, Roman hours, gold hands at ten past ten. */
function dial(g, x, y, w, h) {
  const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2;
  const br = g.createLinearGradient(x, y, x + w, y + h); br.addColorStop(0, GD.pale); br.addColorStop(0.45, GD.gold); br.addColorStop(1, GD.goldD);
  g.fillStyle = br; g.fillRect(x, y, w, h);
  g.strokeStyle = GD.goldDD; g.lineWidth = r * 0.03;
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { g.beginPath(); g.arc(cx + sx * r * 0.8, cy + sy * r * 0.8, r * 0.12, 0, TAU); g.stroke(); }
  g.fillStyle = GD.ivory; g.beginPath(); g.arc(cx, cy, r * 0.9, 0, TAU); g.fill();
  const sun = g.createRadialGradient(cx, cy, 0, cx, cy, r * 0.5); sun.addColorStop(0, GD.pale); sun.addColorStop(1, GD.goldL);
  g.fillStyle = sun; g.beginPath(); g.arc(cx, cy, r * 0.5, 0, TAU); g.fill();
  g.strokeStyle = GD.goldD; g.lineWidth = r * 0.025;
  for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; g.beginPath(); g.moveTo(cx + Math.cos(a) * r * 0.12, cy + Math.sin(a) * r * 0.12); g.lineTo(cx + Math.cos(a) * r * 0.46, cy + Math.sin(a) * r * 0.46); g.stroke(); }
  g.strokeStyle = GD.goldDD; g.lineWidth = r * 0.04; g.beginPath(); g.arc(cx, cy, r * 0.86, 0, TAU); g.stroke();
  g.fillStyle = GD.black; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `bold ${r * 0.19}px Georgia, serif`;
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU - Math.PI / 2; g.fillText(ROMAN[i], cx + Math.cos(a) * r * 0.68, cy + Math.sin(a) * r * 0.68); }
  g.strokeStyle = GD.goldDD; g.lineCap = 'round';
  for (const [a, len, lw] of [[-150, 0.42, 0.08], [-30, 0.62, 0.05]]) { const t = a * Math.PI / 180; g.lineWidth = r * lw; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(t) * r * len, cy + Math.sin(t) * r * len); g.stroke(); }
  g.fillStyle = GD.goldDD; g.beginPath(); g.arc(cx, cy, r * 0.07, 0, TAU); g.fill();
}
/** The framed picture: a golden hour at sea, the sun low over the waves and a Magikarp leaping in its path. */
function seascape(g, x, y, w, h) {
  const sky = g.createLinearGradient(0, y, 0, y + h * 0.6);
  sky.addColorStop(0, '#c86a3a'); sky.addColorStop(0.5, GD.sky); sky.addColorStop(1, '#fde7a0');
  g.fillStyle = sky; g.fillRect(x, y, w, h);
  g.fillStyle = 'rgba(255,250,220,0.9)'; g.beginPath(); g.arc(x + w * 0.62, y + h * 0.56, h * 0.15, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.35)';
  for (const [fx, fy, s] of [[0.18, 0.22, 1], [0.34, 0.3, 0.7], [0.82, 0.18, 0.9]]) { g.beginPath(); g.ellipse(x + w * fx, y + h * fy, w * 0.08 * s, h * 0.035, 0, 0, TAU); g.fill(); }
  const sea = g.createLinearGradient(0, y + h * 0.58, 0, y + h); sea.addColorStop(0, '#e8a848'); sea.addColorStop(0.4, '#9a6a3a'); sea.addColorStop(1, '#4a3a3a');
  g.fillStyle = sea; g.fillRect(x, y + h * 0.58, w, h * 0.42);
  g.fillStyle = 'rgba(255,240,180,0.75)';
  for (let i = 0; i < 6; i++) g.fillRect(x + w * (0.62 - 0.03 * (i + 1)), y + h * (0.62 + i * 0.06), w * 0.06 * (i + 1), h * 0.018);
  g.strokeStyle = 'rgba(255,230,160,0.45)'; g.lineWidth = h * 0.012;
  for (let i = 0; i < 7; i++) { const wx = x + w * (0.06 + i * 0.14), wy = y + h * (0.68 + (i % 3) * 0.08); g.beginPath(); g.moveTo(wx, wy); g.quadraticCurveTo(wx + w * 0.03, wy - h * 0.03, wx + w * 0.06, wy); g.stroke(); }
  // the Magikarp, mid-leap
  const fx = x + w * 0.3, fy = y + h * 0.5, fw = w * 0.07, fh = h * 0.1;
  g.save(); g.translate(fx, fy); g.rotate(-0.5);
  g.fillStyle = '#f0783a'; g.beginPath(); g.ellipse(0, 0, fw, fh, 0, 0, TAU); g.fill();
  g.beginPath(); g.moveTo(-fw * 0.8, 0); g.lineTo(-fw * 1.8, -fh * 0.8); g.lineTo(-fw * 1.6, fh * 0.9); g.closePath(); g.fill();
  g.fillStyle = '#f8e8b8'; g.beginPath(); g.moveTo(-fw * 0.6, -fh * 0.8); g.lineTo(0, -fh * 1.5); g.lineTo(fw * 0.5, -fh * 0.85); g.fill();
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(fw * 0.45, -fh * 0.2, fh * 0.28, 0, TAU); g.fill();
  g.fillStyle = '#202020'; g.beginPath(); g.arc(fw * 0.5, -fh * 0.2, fh * 0.1, 0, TAU); g.fill();
  g.restore();
  g.fillStyle = 'rgba(255,255,255,0.7)';
  for (const [dx, dy] of [[-0.05, 0.12], [0.03, 0.15], [-0.01, 0.1]]) { g.beginPath(); g.arc(fx + w * dx, fy + h * dy, h * 0.018, 0, TAU); g.fill(); }
}

/* ---------- the kinds ---------- */

/** What js/base-models-golden.js builds for each upright and wall kind: its parts, doors and default material. */
export const BUILT = {};

function piece(id, name, w, h, price, parts, { doors = [], inside, mat = 'metal', ...rest } = {}) {
  BUILT[id] = { parts, doors, inside, mat };
  const all = [...parts, ...doors.flatMap(d => d.parts)];
  return { id, name, group: GROUP, solo: true, w, h, price, ...rest, draw(x, b, vw, dir) { floorShadow(x, b, vw); paintParts(all, x, b, vw, dir, w * 32, mat); } };
}
function wallPiece(id, name, w, price, parts, { mat = 'metal', ...rest } = {}) {
  BUILT[id] = { parts, doors: [], mat };
  return { id, name, group: GROUP, solo: true, w, h: 1, layer: 'wall', price, ...rest, wall(x) { paintParts(parts, x, 96, w * 32, 0, w * 32, mat); } };
}

const POST = (hh) => [[2.8, 0], [2.8, hh * 0.09], [1.8, hh * 0.12], [2.4, hh * 0.2], [1.6, hh * 0.26], [1.5, hh * 0.88], [2.2, hh * 0.92], [1.4, hh * 0.96], [1.9, hh], [0, hh + 1.2]];
const CREST = (w, hgt) => [[-w, 0], [w, 0], [w * 0.8, hgt * 0.35], [w * 0.4, hgt * 0.55], [w * 0.15, hgt * 0.62], [0, hgt], [-w * 0.15, hgt * 0.62], [-w * 0.4, hgt * 0.55], [-w * 0.8, hgt * 0.35]];
const APRON = (w, dip) => [[-w, 0], [w, 0], [w * 0.85, -dip * 0.55], [w * 0.25, -dip * 0.65], [0, -dip], [-w * 0.25, -dip * 0.65], [-w * 0.85, -dip * 0.55]];

/* the chest's lid, opened `a` about its hinge at the back of the body: a dome profile [dz forward, dh up] */
const LID = [[0, 0], [20, 0], [20, 3], [18.6, 6], [15.4, 8.4], [10, 9.4], [4.6, 8.4], [1.4, 6], [0, 3]];
const lidAt = (a) => LID.map(([dz, dh]) => [dz * Math.cos(a) - dh * Math.sin(a), dz * Math.sin(a) + dh * Math.cos(a)]);

/* the grand piano's case from above: straight bass side on the left, the treble side curving in to the tail */
const CASE = [[4, 14], [4, -30], [10, -31.4], [17, -29.6], [23, -24], [28, -15], [33, -8.4], [40, -4.2], [48, -2.2], [55, 0.6], [59, 5.4], [60, 10], [60, 14]];
const NATURALS = 22, KEY0 = 7.6, KEYW = 48.8 / NATURALS;

export const GOLDEN_KINDS = [
  // a golden candlestick: a turned column on a domed foot, two curling arms and three ivory candles
  piece('goldcandle', 'Golden candlestick', 1, 1, 300, [
    LA(16, 0, 0, [[8.5, 0], [8.5, 1.2], [7.6, 2.2], [5.2, 3.6], [3, 5.6], [2.2, 7]], GD.gold, { seg: 16 }),
    RG(16, 2.6, 0, 7.4, 0.35, GD.goldD, { flat: true }),
    turned(16, 7, 0, 36, 2),
    LA(16, 42, 0, [[1.6, 0], [3, 1.5], [4.2, 2.6], [4.4, 3.2]], GD.goldL, { seg: 12 }),
    ...[-1, 1].flatMap(s => [
      RD([16, 43.5, 0], [16 + s * 7, 45, 0], 1.1, GD.gold), RD([16 + s * 7, 45, 0], [16 + s * 9.5, 48.6, 0], 1.1, GD.gold),
      LA(16 + s * 9.5, 48.5, 0, [[1, 0], [2.4, 1.2], [3.4, 2.2], [3.6, 2.6]], GD.goldL, { seg: 12 }),
      C(16 + s * 9.5, 55.6, 0, 1.5, 9, GD.ivory, GL),
      S(16 + s * 9.5, 62.2, 0, 1.2, 2.2, 1.2, GD.flame, { m: 'glow', seg: 8 }),
    ]),
    LA(16, 45.2, 0, [[1.5, 0], [3, 1], [4, 2], [4.2, 2.4]], GD.goldL, { seg: 12 }),
    C(16, 53.1, 0, 1.6, 11, GD.ivory, GL),
    S(16, 60.9, 0, 1.3, 2.4, 1.3, GD.flame, { m: 'glow', seg: 8 }),
  ], { glow: [GD.flame] }),

  // a golden longcase clock: a sunburst dial in an arched hood, the pendulum swinging behind its window, a crown on top
  piece('goldclock', 'Golden clock', 1, 1, 380, [
    ...[[5, -8], [27, -8], [5, 8], [27, 8]].map(([x, z]) => S(x, 1.6, z, 2.2, 1.6, 2.2, GD.goldD, { m: 'metal', seg: 8 })),
    B(16, 6, 0, 28, 6, 22, GD.gold),
    DS(16, 6, 11.2, 1.8, 0.4, GD.goldD, M),
    B(16, 9.6, 0, 26, 1.4, 20, GD.goldD, { r: 0.6 }),
    B(16, 30, 0, 22, 40, 16, GD.gold),
    B(16, 32, 8.15, 12.4, 28.4, 0.3, GD.goldDD, PLN),
    RD([16, 45, 8.6], [16, 22, 8.6], 0.5, GD.goldD),
    DS(16, 21, 8.9, 3.4, 0.8, GD.goldL, M),
    B(16, 46.6, 8.6, 15, 1.4, 1.2, GD.goldL, { r: 0.5 }), B(16, 17.4, 8.6, 15, 1.4, 1.2, GD.goldL, { r: 0.5 }),
    B(9.6, 32, 8.6, 1.4, 30, 1.2, GD.goldL, { r: 0.5 }), B(22.4, 32, 8.6, 1.4, 30, 1.2, GD.goldL, { r: 0.5 }),
    B(16, 32, 9.4, 12, 28, 0.3, GD.mirror, { m: 'glass', r: 0.05 }),
    B(16, 51, 0, 24, 2, 18, GD.goldD, { r: 0.6 }),
    B(16, 62, 0, 26, 20, 18, GD.gold),
    ...[4.2, 27.8].map(x => C(x, 62, 8.4, 1.2, 19, GD.goldL)),
    RG(16, 62.5, 9.2, 8.4, 0.6, GD.goldL, { seg: 16 }),
    PC(16, 62.5, 9.15, 16, 16, dial),
    B(16, 73, 0, 28, 2, 20, GD.goldD, { r: 0.6 }),
    PR(16, 74, 0, CREST(12, 7.5), 14, GD.gold),
    S(16, 83.2, 0, 2, 2, 2, GD.goldL, { m: 'metal', seg: 8 }),
    ...[4, 28].map(x => S(x, 75.4, 0, 1.4, 1.4, 1.4, GD.goldL, { m: 'metal', seg: 8 })),
  ]),

  // a golden side chair: turned legs, a deep red velvet seat and back panel in a gilded frame, a scrolled crest
  piece('goldchair', 'Golden chair', 1, 1, 460, [
    ...[6, 26].map(x => turned(x, 0, 10, 14, 1.6)),
    ...[6, 26].map(x => RD([x, 0, -10], [x, 14, -9.5], 1.3, GD.gold)),
    B(16, 14.5, 0, 25, 3, 22, GD.gold),
    line([8, 14.4, 11.15], [24, 14.4, 11.15]),
    B(16, 16.8, 0.8, 23, 2.6, 20, GD.velvet, { m: 'cloth', r: 1.2 }),
    RD([6, 15, -9.5], [6.5, 46, -10.5], 1.2, GD.gold), RD([26, 15, -9.5], [25.5, 46, -10.5], 1.2, GD.gold),
    B(16, 45, -10.5, 22, 3, 2.4, GD.gold),
    B(16, 21, -10, 20, 2, 2, GD.gold),
    B(16, 33, -10.2, 17, 21, 1.4, GD.velvet, { m: 'cloth', r: 1 }),
    ...frame(16, 33, -9.3, 15.4, 19.4, GD.goldL),
    PR(16, 46.5, -10.5, CREST(11, 6.5), 2.4, GD.gold),
    S(16, 54.2, -10.5, 1.8, 1.8, 1.4, GD.goldL, { m: 'metal', seg: 8 }),
  ]),

  // a round golden stool on four cabriole legs, its red velvet cushion piped in pale gold
  piece('goldstool', 'Golden stool', 1, 1, 520, [
    ...cab(6.5, 7.5, 12, -0.4, 0.4), ...cab(25.5, 7.5, 12, 0.4, 0.4), ...cab(6.5, -7.5, 12, -0.4, -0.4), ...cab(25.5, -7.5, 12, 0.4, -0.4),
    C(16, 13, 0, 12, 3, GD.gold),
    RG(16, 13, 0, 12.05, 0.4, GD.goldD, { flat: true }),
    S(16, 16.4, 0, 11.4, 3.4, 11.4, GD.velvet, CL),
    RG(16, 14.9, 0, 11.4, 0.6, GD.goldL, { flat: true }),
    DS(16, 19.5, 0, 1, 0.5, GD.velvetD, { m: 'plain', seg: 6, k: 30 }),
  ]),

  // a golden floor lamp: a turned column on a stepped foot, a pale gold pleated shade trimmed in gold
  piece('goldlamp', 'Golden lamp', 1, 1, 600, [
    LA(16, 0, 0, [[9, 0], [9, 1.2], [8, 2], [5, 3.2], [3, 4.5], [2, 6]], GD.gold, { seg: 16 }),
    RG(16, 1.8, 0, 8.4, 0.35, GD.goldD, { flat: true }),
    turned(16, 6, 0, 44, 1.6),
    LA(16, 50, 0, [[1.6, 0], [2.4, 1], [2.4, 3]], GD.goldL, { seg: 10 }),
    RD([16, 53, 0], [16, 65, 0], 0.4, GD.goldD),
    LA(16, 49, 0, [[11, 0], [10.6, 1], [6.5, 14], [6, 15]], GD.shade, { m: 'glow', seg: 16 }),
    RG(16, 49.3, 0, 10.9, 0.6, GD.goldL, { flat: true }),
    RG(16, 63.8, 0, 6.1, 0.5, GD.goldL, { flat: true }),
    S(16, 66.4, 0, 1.4, 1.6, 1.4, GD.goldL, { m: 'metal', seg: 8 }),
  ], { glow: [GD.shade] }),

  // a golden dinner set: a stack of gilded plates, a teapot and two cups on their saucers
  piece('golddishes', 'Golden dishes', 1, 1, 660, [
    ...Array.from({ length: 6 }, (_, i) => C(10, 0.7 + i * 1.35, -3, 8.4 - (i % 2) * 0.5, 1.2, i % 2 ? GD.goldL : GD.gold)),
    RG(10, 8.9, -3, 7.2, 0.35, GD.goldD, { flat: true }),
    LA(23, 0, -4, [[2.5, 0], [3.6, 0.6], [5, 3], [5.2, 5], [4, 7.5], [2, 8.6], [1.2, 9]], GD.gold, { seg: 16 }),
    RG(23, 4.6, -4, 5.2, 0.3, GD.goldD, { flat: true }),
    S(23, 9.8, -4, 1.1, 1.1, 1.1, GD.goldL, { m: 'metal', seg: 8 }),
    RD([27.4, 3.5, -4], [30.6, 8, -4], 0.8, GD.gold),
    RG(17.6, 5, -4, 2.4, 0.6, GD.gold, { seg: 10 }),
    ...[[8, 9], [21, 10]].flatMap(([x, z]) => [
      C(x, 0.4, z, 4, 0.8, GD.goldL),
      LA(x, 0.8, z, [[1.6, 0], [2, 0.3], [2.6, 2.6], [2.8, 3.4]], GD.gold, { seg: 12 }),
      RG(x + 3.2, 2.6, z, 1, 0.35, GD.gold, { seg: 8 }),
    ]),
  ]),

  // a golden table: four cabriole legs, a scalloped apron with an engraved band, a polished top
  piece('goldtable', 'Golden table', 1, 1, 740, [
    ...cab(5, 9, 22, -0.5, 0.5), ...cab(27, 9, 22, 0.5, 0.5), ...cab(5, -9, 22, -0.5, -0.5), ...cab(27, -9, 22, 0.5, -0.5),
    B(16, 21, 0, 26, 5, 22, GD.gold),
    ...frame(16, 21, 11.15, 20, 2.4),
    PR(16, 18.5, 10.6, APRON(10, 3), 1, GD.gold),
    DS(16, 21, 11.3, 1.2, 0.4, GD.goldL, M),
    B(16, 24.5, 0, 30, 2, 26, GD.goldL),
    B(16, 23.4, 0, 28, 0.6, 24, GD.goldD, { r: 0.3 }),
  ]),

  // a golden cheval mirror: an oval glass tilting between turned posts on sledge feet, a crest above
  piece('goldmirror', 'Golden mirror', 1, 1, 820, [
    ...[5, 27].flatMap(x => [B(x, 1.2, 0, 3.4, 2.4, 22, GD.goldD), turned(x, 2.4, 0, 52, 1.5), S(x, 56, 0, 1.6, 1.8, 1.6, GD.goldL, { m: 'metal', seg: 8 })]),
    RD([5, 8, 0], [27, 8, 0], 0.8, GD.gold),
    RD([5.5, 34, 0], [9.6, 34, 0], 0.7, GD.goldL), RD([22.4, 34, 0], [26.5, 34, 0], 0.7, GD.goldL),
    DS(16, 34, 0, 7.5, 1.8, GD.gold, { ry: 20 }),
    DS(16, 34, 1, 6.2, 0.4, GD.mirror, { ry: 18.4, m: 'gloss' }),
    PR(16, 53, 0, CREST(5, 5.5), 2, GD.gold),
    S(16, 59.6, 0, 1.4, 1.4, 1.4, GD.goldL, { m: 'metal', seg: 8 }),
    PR(16, 14.4, 0.6, APRON(4, 2.4), 1.4, GD.gold),
  ]),

  // a golden étagère: open shelves in a gilded frame, a crest, and gold treasures on show
  piece('goldshelf', 'Golden shelf', 2, 1, 900, [
    ...[[4, -10], [60, -10], [4, 10], [60, 10]].map(([x, z]) => S(x, 1.5, z, 2, 1.5, 2, GD.goldD, { m: 'metal', seg: 8 })),
    ...[[3, -10], [61, -10], [3, 10], [61, 10]].map(([x, z]) => B(x, 38, z, 3, 72, 3, GD.gold)),
    B(32, 38, -11, 56, 68, 1.4, GD.goldD),
    ...[16, 37, 58].flatMap(h => [RG(18, h, -10.1, 4.2, 0.35, GD.gold, { seg: 12 }), RG(46, h, -10.1, 4.2, 0.35, GD.gold, { seg: 12 })]),
    ...[4, 26, 48, 70].map(h => B(32, h, 0, 60, 2, 22, GD.gold, { r: 0.6 })),
    ...[26, 48, 70].map(h => line([5, h - 0.4, 11.1], [59, h - 0.4, 11.1])),
    PR(32, 71, -10, CREST(28, 9), 2, GD.gold),
    S(32, 81.6, -10, 2, 2, 1.6, GD.goldL, { m: 'metal', seg: 8 }),
    // bars, coins and a gold Poké Ball
    B(10, 7, 0, 7, 4, 5, GD.goldL, { r: 0.6 }), B(18, 7, 0, 7, 4, 5, GD.goldL, { r: 0.6 }), B(14, 11, 0, 7, 4, 5, GD.goldL, { r: 0.6 }),
    ...[0, 1, 2, 3].map(i => C(32 + (i % 2) * 0.6, 5.5 + i * 1.1, 2, 3.4, 1, GD.coin)),
    S(50, 9.6, 0, 4.5, 4.5, 4.5, GD.gold, { m: 'metal', seg: 12 }),
    RG(50, 9.6, 0, 4.5, 0.45, GD.goldDD, { flat: true }),
    DS(50, 9.6, 4.6, 1.4, 0.6, GD.pale, M),
    // a vase, a trophy and three velvet albums
    LA(12, 27, 0, [[2, 0], [3.4, 2], [3.8, 5], [2, 9], [1.4, 10], [2.2, 11]], GD.goldL, { seg: 12 }),
    LA(32, 27, 0, [[3, 0], [3, 1], [1, 2], [0.8, 6], [4, 9], [4.6, 13]], GD.gold, { seg: 12 }),
    RG(27.2, 37, 0, 1.8, 0.5, GD.gold, { seg: 8 }), RG(36.8, 37, 0, 1.8, 0.5, GD.gold, { seg: 8 }),
    ...[47, 50.4, 53.8].map((x, i) => B(x, 32.5 - i * 0.4, -2, 3.2, 10 - i * 0.8, 14, GD.velvet, { m: 'cloth', r: 0.3 })),
    ...[47, 50.4, 53.8].map((x, i) => B(x, 35.5 - i * 0.8, 5.1, 2.8, 0.6, 0.2, GD.goldL, { r: 0.05 })),
    // a golden egg on its stand and a crown on a velvet cushion
    LA(20, 49, 0, [[3, 0], [2, 1], [1.2, 2.4], [2.4, 3.6]], GD.goldD, { seg: 10 }),
    S(20, 56.4, 0, 3.4, 4.4, 3.4, GD.goldL, { m: 'metal', seg: 12 }),
    B(44, 50.8, 0, 12, 3, 10, GD.velvet, { m: 'cloth', r: 1.4 }),
    C(44, 54.6, 0, 4, 4, GD.gold, { rb: 3.4 }),
    ...[-3.6, -1.2, 1.2, 3.6].map(dx => S(44 + dx, 57.4, Math.sqrt(16 - dx * dx) * 0.5, 0.8, 1.2, 0.8, GD.goldL, { m: 'metal', seg: 6 })),
    DS(44, 54.4, 3.8, 0.9, 0.4, GD.ruby, GL),
  ]),

  // a golden chest of drawers: ring pulls on rosettes, engraved fronts, pilasters, a scalloped apron on cabriole legs
  piece('golddresser', 'Golden dresser', 2, 1, 980, [
    ...cab(5, 8, 8, -0.5, 1), ...cab(59, 8, 8, 0.5, 1),
    ...[5, 59].map(x => RD([x, 0, -10.5], [x, 8, -9.5], 1.2, GD.gold)),
    B(32, 20, 0, 60, 24, 24, GD.gold),
    PR(32, 8, 11.5, APRON(28, 3.6), 1, GD.gold),
    ...[3.5, 60.5].map(x => B(x, 20, 12.2, 3, 24, 1.4, GD.goldD, { r: 0.6 })),
    ...[17.5, 46.5].flatMap(x => [B(x, 28, 12.4, 25, 5, 0.8, GD.goldL, { r: 0.5 }), ...pull(x, 28, 12.8)]),
    ...[21, 13.5].flatMap(h => [B(32, h, 12.4, 54, 6.4, 0.8, GD.goldL, { r: 0.5 }), ...pull(18, h, 12.8), ...pull(46, h, 12.8),
      ...frame(32, h, 12.9, 48, 4.6), DS(32, h, 13, 1.4, 0.4, GD.goldD, M)]),
    B(32, 33, 0, 62, 2, 26, GD.gold),
    line([2, 32.4, 13.1], [62, 32.4, 13.1]),
  ]),

  // a golden writing desk: drawer pedestals, a red velvet writing pad, an inkwell and quill, a crested gallery behind
  piece('golddesk', 'Golden desk', 2, 1, 1060, [
    ...[9, 55].flatMap(x => [
      B(x, 1, 0, 17, 2, 29, GD.goldD, { r: 0.5 }),
      B(x, 15, 0, 16, 26, 28, GD.gold),
      ...[6, 14.5, 23].flatMap(h => [B(x, h, 14.4, 14, 7.2, 0.8, GD.goldL, { r: 0.5 }), ...pull(x, h, 14.8)]),
    ]),
    B(32, 15, -12, 30, 26, 2, GD.goldD),
    B(32, 25.6, 0, 30, 4, 28, GD.gold),
    B(32, 25.6, 14.4, 26, 3.2, 0.8, GD.goldL, { r: 0.5 }), DS(32, 25.6, 14.9, 0.9, 0.5, GD.goldD, M),
    B(32, 29, 0.5, 64, 2, 29.5, GD.gold, { r: 0.8 }),
    line([1, 28.4, 15.3], [63, 28.4, 15.3]),
    B(32, 30.15, 3, 40, 0.4, 16, GD.velvet, { m: 'cloth', r: 0.2 }),
    PR(32, 30, -13, [[-31, 0], [31, 0], [31, 4], [12, 5], [4, 7], [0, 9], [-4, 7], [-12, 5], [-31, 4]], 2, GD.gold),
    S(32, 40, -13, 1.6, 1.6, 1.2, GD.goldL, { m: 'metal', seg: 8 }),
    C(50, 31.6, -6, 1.8, 2.6, GD.goldD),
    RD([50, 33, -6], [53, 41, -8], 0.4, GD.ivory, PLN),
    B(22, 30.5, 4, 9, 0.3, 11, GD.ivory, { r: 0.05, m: 'plain' }),
  ]),

  // a three-panel golden screen, folded in a zigzag: arched gilded panels engraved with a sunburst, rosettes below
  piece('goldscreen', 'Golden screen', 2, 1, 1140, [
    ...[[11, -3], [32, 3], [53, -3]].flatMap(([x, z]) => [
      ...[-8, 8].map(dx => LA(x + dx, 0, z, [[1.6, 0], [1.8, 1.5], [1, 3], [1.4, 6]], GD.goldD, { seg: 8 })),
      B(x, 36, z, 20.4, 60, 2, GD.gold, { r: 0.8 }),
      PR(x, 66, z, [[-10.2, 0], [10.2, 0], [8, 2.6], [0, 4.4], [-8, 2.6]], 2, GD.gold),
      B(x, 37, z + 1.05, 17, 51, 0.3, GD.goldL, { r: 0.4 }),
      DS(x, 50, z + 1.4, 3.6, 0.4, GD.gold, M),
      ...Array.from({ length: 8 }, (_, i) => { const a = i / 8 * TAU; return line([x + Math.cos(a) * 4.2, 50 + Math.sin(a) * 4.2, z + 1.35], [x + Math.cos(a) * 7.4, 50 + Math.sin(a) * 7.4, z + 1.35]); }),
      line([x - 7.5, 31, z + 1.35], [x + 7.5, 31, z + 1.35]),
      ...frame(x, 20.5, z + 1.35, 14, 15),
      DS(x, 20.5, z + 1.4, 2.2, 0.4, GD.goldD, M),
    ]),
  ]),

  // a gilded frame on the wall, carved corners and a crest, round a golden hour at sea with a Magikarp leaping
  wallPiece('goldframe', 'Golden frame', 2, 1220, [
    B(32, 58, 0.8, 52, 36, 1.6, GD.gold, { r: 0.8 }),
    B(32, 58, 1.65, 46, 30, 0.2, GD.goldD, { r: 0.3 }),
    PC(32, 58, 1.75, 42, 26, seascape),
    ...[[7, 41], [57, 41], [7, 75], [57, 75]].map(([x, h]) => S(x, h, 1.8, 2.4, 2.4, 1.2, GD.goldL, { m: 'metal', seg: 8 })),
    PR(32, 76, 0.8, CREST(10, 7), 1.8, GD.gold),
    B(32, 40.2, 1.8, 10, 2.4, 0.6, GD.goldL, { r: 0.4 }),
  ]),

  // a golden wall sconce: an oval back plate, two curling arms, ivory candles
  wallPiece('goldsconce', 'Golden sconce', 1, 1300, [
    DS(16, 60, 0.6, 5, 1.2, GD.gold, { ry: 9 }),
    RG(16, 60, 1.2, 3.4, 0.3, GD.goldD, { seg: 12 }),
    PR(16, 68.6, 0.6, CREST(4, 4.4), 1.2, GD.gold),
    S(16, 51, 1.2, 1.6, 2.2, 1.2, GD.goldL, { m: 'metal', seg: 8 }),
    ...[-1, 1].flatMap(s => [
      RD([16, 56, 1.2], [16 + s * 7, 55, 4], 0.7, GD.gold), RD([16 + s * 7, 55, 4], [16 + s * 9, 58.6, 5], 0.7, GD.gold),
      LA(16 + s * 9, 58.6, 5, [[1, 0], [2.4, 1.2], [3, 2]], GD.goldL, { seg: 10 }),
      C(16 + s * 9, 64, 5, 1.2, 6.8, GD.ivory, GL),
      S(16 + s * 9, 68.8, 5, 1, 1.8, 1, GD.flame, { m: 'glow', seg: 8 }),
    ]),
  ], { glow: [GD.flame] }),

  // a golden rug: a deep gold border round a bright gold field, a sunburst medallion, crimson lines, pale fringes
  { id: 'goldrug', name: 'Golden rug', group: GROUP, solo: true, w: 3, h: 2, layer: 'rug', price: 1380, high: 0.04, side: 'c', flat(w, h) {
    const g = ctx(), FIELD = '#e6b431', DEEP = '#b0821a', PALE = '#fbe6a0', RED = '#8e1c2c', DARK = '#7c5810';
    const rect = (x, y, rw, rh, c) => { g.fillStyle = c; g.fillRect(x, y, rw, rh); };
    rect(0, 0, w, h, PALE);
    for (let y = 1; y < h - 1; y += 1.4) { rect(0, y, 3, 0.6, '#efd78a'); rect(w - 3, y, 3, 0.6, '#efd78a'); }
    rect(3, 0, w - 6, h, DEEP);
    rect(4.4, 1.4, w - 8.8, h - 2.8, RED);
    rect(5.2, 2.2, w - 10.4, h - 4.4, DEEP);
    g.fillStyle = PALE;
    for (let i = 0; i < 16; i++) { const x = 9 + i * (w - 18) / 15; g.beginPath(); g.moveTo(x, 2.8); g.lineTo(x + 1.4, 4.1); g.lineTo(x, 5.4); g.lineTo(x - 1.4, 4.1); g.fill(); g.beginPath(); g.moveTo(x, h - 2.8); g.lineTo(x + 1.4, h - 4.1); g.lineTo(x, h - 5.4); g.lineTo(x - 1.4, h - 4.1); g.fill(); }
    for (let i = 0; i < 9; i++) { const y = 8 + i * (h - 16) / 8; g.beginPath(); g.arc(7, y, 1, 0, TAU); g.fill(); g.beginPath(); g.arc(w - 7, y, 1, 0, TAU); g.fill(); }
    rect(9, 6.4, w - 18, h - 12.8, PALE);
    rect(9.8, 7.2, w - 19.6, h - 14.4, FIELD);
    const cx = w / 2, cy = h / 2;
    const sheen = g.createRadialGradient(cx, cy, 2, cx, cy, w * 0.4); sheen.addColorStop(0, 'rgba(255,248,210,0.55)'); sheen.addColorStop(1, 'rgba(255,248,210,0)');
    g.fillStyle = sheen; g.fillRect(9.8, 7.2, w - 19.6, h - 14.4);
    g.fillStyle = DEEP;
    for (const [sx, sy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      const x0 = sx ? w - 9.8 : 9.8, y0 = sy ? h - 7.2 : 7.2, dx = sx ? -1 : 1, dy = sy ? -1 : 1;
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + dx * 12, y0); g.quadraticCurveTo(x0 + dx * 5, y0 + dy * 3, x0, y0 + dy * 9); g.closePath(); g.fill();
    }
    g.strokeStyle = DEEP; g.lineWidth = 0.9;
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, r0 = 9, r1 = i % 2 ? 16 : 20; g.beginPath(); g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0 * 0.78); g.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 * 0.78); g.stroke(); }
    g.fillStyle = DEEP; g.beginPath(); g.ellipse(cx, cy, 9, 7, 0, 0, TAU); g.fill();
    g.fillStyle = RED; g.beginPath(); g.ellipse(cx, cy, 7.4, 5.7, 0, 0, TAU); g.fill();
    g.fillStyle = PALE; g.beginPath(); g.ellipse(cx, cy, 5, 3.9, 0, 0, TAU); g.fill();
    g.fillStyle = FIELD; g.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, r = i % 2 ? 1.8 : 4; g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.78); } g.fill();
    for (const s of [-1, 1]) { g.fillStyle = DEEP; g.beginPath(); g.ellipse(cx + s * 28, cy, 3, 2.3, 0, 0, TAU); g.fill(); g.fillStyle = RED; g.beginPath(); g.ellipse(cx + s * 28, cy, 1.4, 1.1, 0, 0, TAU); g.fill(); }
    g.fillStyle = 'rgba(124,88,16,0.14)'; for (let x = 10; x < w - 10; x += 3) for (let y = 8; y < h - 8; y += 3) if (hash(x, y, 7) < 0.16) g.fillRect(x + 1, y + 1, 1, 1);
    g.fillStyle = DARK; g.globalAlpha = 0.25; g.fillRect(3, 0, 0.6, h); g.fillRect(w - 3.6, 0, 0.6, h); g.globalAlpha = 1;
  } },

  // a golden sofa: a crested gilded back round a tufted red velvet panel, velvet cushions, rolled arms, cabriole legs
  piece('goldsofa', 'Golden sofa', 2, 1, 1460, [
    ...cab(6, 9, 8, -0.5, 1), ...cab(58, 9, 8, 0.5, 1),
    ...[6, 58].map(x => RD([x, 0, -10.5], [x, 8, -10], 1.3, GD.gold)),
    B(32, 11, 1, 60, 7, 26, GD.gold),
    PR(32, 7.5, 13.5, APRON(26, 2.4), 1, GD.gold),
    line([5, 11, 14.1], [59, 11, 14.1]),
    ...[19.5, 44.5].map(x => B(x, 16.5, 3, 25, 4, 21, GD.velvet, { m: 'cloth', r: 1.5 })),
    B(32, 28, -10, 60, 28, 4, GD.gold),
    B(32, 28, -7.6, 50, 20, 1.6, GD.velvet, { m: 'cloth', r: 1.2 }),
    ...tufts(12, 52, [25, 32], -6.7, 7),
    ...frame(32, 28, -6.75, 52, 22, GD.goldL),
    PR(32, 42, -10, CREST(30, 10), 4, GD.gold),
    S(32, 49.4, -9, 2, 2, 1.4, GD.goldL, { m: 'metal', seg: 8 }),
    ...[4, 60].flatMap(x => [B(x, 19, 1, 6, 12, 24, GD.gold), RD([x, 25, -8], [x, 25, 11], 2.4, GD.gold), DS(x, 22, 13.2, 3, 1, GD.goldL, M)]),
  ]),

  // a golden wardrobe: pilasters, a crowned cornice, engraved doors with pale gold panels and pulls, a drawer below
  piece('goldwardrobe', 'Golden wardrobe', 2, 1, 1560, [
    ...[[6, -10], [58, -10], [6, 10], [58, 10]].map(([x, z]) => S(x, 2.1, z, 2.6, 2.1, 2.6, GD.goldD, { m: 'metal', seg: 8 })),
    B(32, 6.5, 0, 62, 5, 30, GD.goldD),
    B(32, 46, -1, 58, 74, 26, GD.gold, { r: 1.2 }),
    ...[4.5, 59.5].map(x => B(x, 46, 11.5, 3.5, 74, 2, GD.goldD, { r: 0.6 })),
    B(32, 84.5, 0, 63, 3, 31, GD.goldD),
    PR(32, 86, 0, CREST(30, 7), 26, GD.gold),
    S(32, 94.2, 0, 1.6, 1.6, 1.6, GD.goldL, { m: 'metal', seg: 8 }),
    B(32, 14.5, 12.4, 52, 9, 0.8, GD.goldL, { r: 0.5 }), ...pull(20, 14.5, 12.8), ...pull(44, 14.5, 12.8),
  ], {
    doors: [6, 58].map((hx, i) => {
      const x = i ? 45 : 19, hand = i ? 34 : 30;
      return { hinge: [hx, 12], side: i ? -1 : 1, parts: [
        B(x, 50, 12.75, 25.6, 60, 1.5, GD.gold, { r: 0.8 }),
        B(x, 58, 13.6, 20, 34, 0.5, GD.goldL, { r: 0.6 }),
        B(x, 30, 13.6, 20, 12, 0.5, GD.goldL, { r: 0.6 }),
        PR(x, 58, 13.9, [[0, -10], [7, 0], [0, 10], [-7, 0]], 0.3, GD.goldD),
        DS(x, 30, 13.95, 2.2, 0.4, GD.goldD, M),
        RD([hand, 46, 14.1], [hand, 54, 14.1], 0.5, GD.goldL),
        DS(hand, 43.6, 13.7, 0.9, 0.3, GD.goldD, M),
      ] };
    }),
    inside: { x: 32, h: 50, w: 50, hh: 58, z: 12 },
  }),

  // a golden Magikarp on a stand: Animal Crossing's golden fish model, mid-splash, its whiskers and fins gilded
  piece('goldmagikarp', 'Golden Magikarp', 1, 1, 1660, [
    B(16, 2.5, 0, 26, 5, 20, GD.goldD, { r: 1.2 }),
    B(16, 8, 0, 20, 6, 16, GD.gold),
    B(16, 8, 8.2, 10, 3, 0.4, GD.goldL, { r: 0.3 }),
    B(16, 11.6, 0, 22, 1.4, 17, GD.goldD, { r: 0.6 }),
    RD([16, 12, 0], [16, 26, 0], 1.2, GD.gold),
    S(16.5, 34, 0, 10, 10, 5.5, GD.gold, { m: 'metal', seg: 16 }),
    ...[[12, 36], [12, 30], [16, 38.5], [16, 33], [16, 27.5], [20, 30]].map(([x, h]) => {
      const dx = x - 16.5, dh = h - 34, z = 5.5 * Math.sqrt(Math.max(0, 1 - dx * dx / 100 - dh * dh / 100)) + 0.1;
      return DS(x, h, z, 1.5, 0.4, GD.goldL, { m: 'metal', seg: 8 });
    }),
    PR(8, 34, 0, [[0, 0], [-5, 8], [-7.5, 9.4], [-6, 2], [-7.5, -7.4], [-5, -6.4]], 2, GD.goldL),
    PR(16, 43, 0, [[-6, 0], [6, 0], [4.5, 4], [2.5, 3], [0.5, 6], [-1.5, 4], [-3.5, 6.6], [-6, 3]], 1.4, GD.goldL),
    ...[5.4, -5.4].map(z => PR(17, 29, z, [[0, 0], [-5, -3.4], [-2.6, 1.2]], 1, GD.goldL)),
    PR(13, 25, 0, [[-2.5, 0], [2.5, 0], [-1, -3]], 1.4, GD.goldL),
    S(26.6, 32.6, 0, 1.8, 2.4, 2.6, GD.goldL, { m: 'metal', seg: 8 }),
    ...[3.2, -3.2].flatMap(z => [
      RD([25, 36, z], [28.4, 39.4, z * 1.25], 0.5, GD.goldL), RD([28.4, 39.4, z * 1.25], [30.6, 37.4, z * 1.4], 0.5, GD.goldL),
      S(22.6, 37.4, z * 1.3, 2.4, 2.4, 1.1, GD.pale, { m: 'gloss', seg: 8 }),
      S(23.1, 37.4, z * 1.3 + Math.sign(z) * 0.9, 0.9, 0.9, 0.4, GD.goldDD, { m: 'plain', seg: 6 }),
    ]),
  ]),

  // a golden toilet: a gilded pedestal bowl, its seat and lid raised against the tank, an engraved crest, a gold lever
  piece('goldtoilet', 'Golden toilet', 1, 1, 1760, [
    LA(16, 0, 3, [[5, 0], [5.4, 1], [4.2, 4], [4.6, 8], [7.4, 12], [8.4, 14], [8.6, 15]], GD.gold, { seg: 20 }),
    RG(16, 1, 3, 5.3, 0.35, GD.goldD, { flat: true }),
    C(16, 14.6, 3, 6.6, 0.4, GD.water, GL),
    RG(16, 15.6, 3, 7.4, 1.2, GD.goldL, { flat: true }),
    B(16, 16, -6, 12, 10, 6, GD.gold),
    B(16, 30, -11, 22, 20, 8, GD.gold, { r: 2 }),
    B(16, 40.6, -11, 24, 1.6, 9.4, GD.goldL, { r: 0.6 }),
    B(16, 27, -6, 15, 20, 1.4, GD.gold, { r: 3 }),
    RG(16, 29, -5.15, 3.6, 0.35, GD.goldD, { seg: 12 }),
    DS(16, 29, -5.15, 2.2, 0.4, GD.goldL, M),
    ...frame(16, 27, -5.2, 11, 16),
    RD([5.6, 37, -6.6], [9.4, 37, -6.6], 0.5, GD.goldL),
    S(5.2, 37, -6.6, 1, 1, 1, GD.goldL, { m: 'metal', seg: 8 }),
  ]),

  // a golden clawfoot bathtub: rolled rim, an engraved band, gilded paws, a gold tap and a tub full of bubbles
  piece('goldbath', 'Golden bathtub', 2, 1, 1880, [
    ...cab(8, 8, 8, -0.5, 0.6), ...cab(56, 8, 8, 0.5, 0.6), ...cab(8, -8, 8, -0.5, -0.6), ...cab(56, -8, 8, 0.5, -0.6),
    B(32, 17, 0, 58, 20, 26, GD.gold, { r: 7 }),
    line([10, 18, 13.05], [54, 18, 13.05]),
    line([10, 15, 13.05], [54, 15, 13.05]),
    DS(32, 16.5, 13.2, 2.4, 0.4, GD.goldL, M),
    B(32, 27.6, 12, 60, 2.4, 3, GD.goldL, { r: 1.2 }), B(32, 27.6, -12, 60, 2.4, 3, GD.goldL, { r: 1.2 }),
    B(3.2, 27.6, 0, 3, 2.4, 22, GD.goldL, { r: 1.2 }), B(60.8, 27.6, 0, 3, 2.4, 22, GD.goldL, { r: 1.2 }),
    B(32, 27, 0, 54, 0.4, 22, GD.water, { m: 'gloss', r: 0.1 }),
    ...[[14, 2, 3.4], [22, -4, 3], [30, 4, 3.6], [38, -2, 3.2], [46, 3, 3], [20, 6, 2.4], [42, -6, 2.6]].map(([x, z, r], i) =>
      S(x, 27.6 + (i % 3) * 0.6, z, r, r * 0.5, r, GD.foam, { m: 'plain', seg: 8 })),
    RD([58, 28, -11.5], [58, 36, -11.5], 0.9, GD.goldL), RD([58, 36, -11.5], [54, 36, -9], 0.8, GD.goldL),
    S(54, 35, -9, 0.9, 1.4, 0.9, GD.goldL, { m: 'metal', seg: 8 }),
    ...[55, 61].map(x => S(x, 33, -12, 1.2, 0.8, 1.2, GD.goldL, { m: 'metal', seg: 8 })),
  ]),

  // a golden grand piano: the gilded case on turned legs, its lid propped, black-and-gold keys, a lyre and pedals
  piece('goldpiano', 'Golden piano', 2, 2, 2100, [
    ...[[8.5, 9], [56, 9], [13, -24]].flatMap(([x, z]) => [turned(x, 0, z, 26, 2.2), S(x, 1, z, 1.6, 1, 1.6, GD.goldD, { m: 'metal', seg: 8 })]),
    PL(26, CASE, 12, GD.gold),
    PL(25.4, CASE.map(([x, z]) => [x, z]), 0.6, GD.goldD),
    PL(38, CASE, 1.2, GD.gold, { roll: 0.55, m: 'metal' }),
    RD([44, 38, -2], [43.2, 61.4, -2], 0.5, GD.goldL),
    RD([5, 32.5, 14.3], [59, 32.5, 14.3], 0.3, GD.goldD),
    RD([5, 28.4, 14.3], [59, 28.4, 14.3], 0.3, GD.goldD),
    B(32, 27.5, 19, 52, 3, 10, GD.black, { m: 'gloss', r: 0.4 }),
    B(5.5, 30, 19, 3, 8, 10, GD.gold, { r: 0.8 }), B(58.5, 30, 19, 3, 8, 10, GD.gold, { r: 0.8 }),
    B(32, 33.5, 14.6, 50, 7, 0.8, GD.black, { m: 'gloss', r: 0.3 }),
    ...Array.from({ length: NATURALS }, (_, i) => B(KEY0 + (i + 0.5) * KEYW, 29.6, 20, KEYW - 0.18, 1.2, 8, GD.goldL, { r: 0.05 })),
    ...Array.from({ length: NATURALS - 1 }, (_, i) => i).filter(i => [0, 1, 3, 4, 5].includes(i % 7)).map(i =>
      B(KEY0 + (i + 1) * KEYW, 30.7, 17.6, 1.3, 1.4, 5, GD.black, { m: 'gloss', r: 0.05 })),
    B(32, 28, 24.4, 54, 3, 0.8, GD.gold, { r: 0.4 }),
    B(32, 43, 12, 24, 9, 1, GD.gold, { r: 0.5 }),
    ...frame(32, 43, 12.6, 20, 6),
    ...[30, 34].map(x => RD([x, 25.4, 8], [x, 6, 8], 0.6, GD.gold)),
    B(32, 4, 8.5, 10, 3, 4, GD.gold, { r: 0.8 }),
    ...[29, 32, 35].map(x => B(x, 3.4, 11.4, 1.2, 1, 3, GD.goldL, { r: 0.3 })),
  ]),

  // a golden throne on its dais: a towering crowned back round red velvet, lion-knob arms, a velvet seat
  piece('goldthrone', 'Golden throne', 1, 1, 2350, [
    B(16, 2, 0, 31, 4, 31, GD.goldD),
    line([1.5, 2, 15.6], [30.5, 2, 15.6], GD.goldL),
    B(16, 5, 1, 28, 2, 26, GD.gold, { r: 0.8 }),
    ...[[6, 9], [26, 9], [6, -8], [26, -8]].map(([x, z]) => S(x, 7.4, z, 2.2, 1.6, 2.2, GD.goldL, { m: 'metal', seg: 8 })),
    B(16, 13, 0, 26, 10, 24, GD.gold),
    PR(16, 8, 12, APRON(11, 2.4), 1, GD.gold),
    ...frame(16, 13.5, 12.1, 20, 6),
    B(16, 19.6, 1.5, 22, 3.2, 20, GD.velvet, { m: 'cloth', r: 1.4 }),
    ...[3.5, 28.5].flatMap(x => [B(x, 22, 0, 4, 8, 22, GD.gold), RD([x, 18, 9], [x, 25, 10], 1.4, GD.gold), S(x, 26.4, 10.5, 2.6, 2.6, 2.6, GD.goldL, { m: 'metal', seg: 10 })]),
    B(16, 44, -11, 26, 52, 4, GD.gold, { r: 1.2 }),
    B(16, 44, -8.6, 19, 40, 1.2, GD.velvet, { m: 'cloth', r: 1 }),
    ...frame(16, 44, -7.9, 20.6, 41.6, GD.goldL),
    ...tufts(11, 21, [32, 42, 52], -7.9, 3),
    ...[3.2, 28.8].flatMap(x => [turned(x, 18, -11, 56, 1.6), S(x, 75.6, -11, 2, 2, 2, GD.goldL, { m: 'metal', seg: 8 })]),
    PR(16, 70, -11, [[-13, 0], [13, 0], [13, 5], [9, 3], [6.5, 9], [3.5, 4], [0, 12], [-3.5, 4], [-6.5, 9], [-9, 3], [-13, 5]], 4, GD.gold),
    ...[[9.5, 79.6], [16, 82.8], [22.5, 79.6]].map(([x, h]) => S(x, h, -11, 1.6, 1.6, 1.4, GD.ruby, { m: 'gloss', seg: 8 })),
    DS(16, 73, -8.8, 1.6, 0.5, GD.ruby, GL),
  ]),

  // a golden bed: a towering crested headboard round tufted velvet, gilded posts, a red velvet coverlet and ivory pillows
  piece('goldbed', 'Golden bed', 2, 2, 2400, [
    ...[[4, -29], [60, -29]].map(([x, z]) => LA(x, 0, z, POST(66), GD.gold, { seg: 10 })),
    ...[[4, 29], [60, 29]].map(([x, z]) => LA(x, 0, z, POST(34), GD.gold, { seg: 10 })),
    ...[[4, -29, 68.6], [60, -29, 68.6], [4, 29, 36.6], [60, 29, 36.6]].map(([x, z, h]) => S(x, h, z, 2, 2, 2, GD.goldL, { m: 'metal', seg: 8 })),
    B(32, 40, -29, 52, 44, 3, GD.gold),
    B(32, 42, -27.2, 44, 28, 1.2, GD.velvet, { m: 'cloth', r: 1 }),
    ...tufts(14, 50, [34, 42, 50], -26.5, 6),
    ...frame(32, 42, -26.5, 46, 30, GD.goldL),
    PR(32, 62, -29, CREST(26, 13), 3, GD.gold),
    S(32, 76.6, -29, 2.4, 2.4, 1.8, GD.goldL, { m: 'metal', seg: 8 }),
    DS(32, 66, -27.4, 2, 0.5, GD.ruby, GL),
    B(32, 22, 29, 52, 16, 3, GD.gold),
    B(32, 22, 30.7, 44, 10, 0.5, GD.goldL, { r: 0.5 }),
    ...frame(32, 22, 31, 38, 6),
    DS(32, 22, 31.1, 1.6, 0.4, GD.goldD, M),
    B(32, 30.6, 29, 54, 1.4, 3.8, GD.goldD, { r: 0.6 }),
    B(32, 11, 0, 56, 6, 54, GD.gold),
    B(32, 17.5, 0, 54, 7, 54, GD.ivory, { m: 'cloth', r: 1.5 }),
    B(32, 22, 5, 55, 2.4, 44, GD.velvet, { m: 'cloth' }),
    B(32, 20.8, 27.2, 55, 2, 0.8, GD.goldL, { r: 0.3 }),
    B(32, 22.2, -18, 55, 2.6, 5, GD.ivory, { m: 'cloth' }),
    ...[20, 44].map(x => S(x, 25.5, -22, 9, 3.2, 4.6, GD.ivory, CL)),
    S(32, 25, -16, 5, 3, 2.4, GD.velvet, CL),
  ]),

  // the Gimmighoul chest: a gold treasure chest with its lid ajar, Gimmighoul's coin, eyes and wiry arms peeking out
  // over the rim, its thin legs underneath, and coins spilled on the floor
  piece('goldchest', 'Golden Gimmighoul chest', 1, 1, 2450, [
    ...[[7, 7], [25, 7], [7, -6], [25, -6]].flatMap(([x, z]) => [
      RD([x, 6.2, z], [x + Math.sign(x - 16) * 1.4, 0.9, z + Math.sign(z) * 1.6], 0.55, GD.grey, GL),
      S(x + Math.sign(x - 16) * 1.6, 0.7, z + Math.sign(z) * 1.9, 1.2, 0.7, 1.4, GD.grey, { m: 'gloss', seg: 6 }),
    ]),
    B(16, 13, 1, 28, 14, 20, GD.gold),
    ...[8, 24].map(x => B(x, 13, 11.2, 2.4, 14.4, 0.6, GD.goldD, { r: 0.3 })),
    B(16, 6.6, 11.2, 28.4, 1.2, 0.6, GD.goldD, { r: 0.3 }),
    B(16, 16, 11.4, 5, 6, 0.6, GD.goldL, { r: 0.6 }),
    DS(16, 16.4, 11.8, 0.9, 0.3, GD.goldDD, { m: 'plain', seg: 6 }),
    B(16, 18.6, 11.8, 0.8, 1.8, 0.3, GD.goldDD, { m: 'plain', r: 0.1 }),
    B(16, 20.3, 1, 26, 0.6, 18, GD.inside, PLN),
    SL(16, 20, -9, 28.4, lidAt(0.9), GD.gold),
    C(9, 21, -3, 2.4, 0.8, GD.coin), C(21.5, 21.2, -4, 2.2, 0.8, GD.coin),
    S(16, 22, 4, 5.4, 3.2, 4.6, GD.grey, { m: 'gloss', seg: 10 }),
    ...[13.6, 18.4].flatMap(x => [S(x, 22.6, 8, 1.4, 1.2, 0.8, GD.eye, { m: 'gloss', seg: 8 }), S(x, 22.6, 8.7, 0.5, 0.6, 0.3, GD.black, { m: 'plain', seg: 6 })]),
    DS(16, 27.5, 6.4, 4.6, 1.2, GD.coin, M),
    RG(16, 27.5, 7.1, 3.2, 0.35, GD.goldD, { seg: 12 }),
    S(16, 27.5, 7.1, 1.2, 1.2, 0.4, GD.goldD, { m: 'metal', seg: 6 }),
    ...[-1, 1].flatMap(s => [
      RD([16 + s * 4.8, 21.6, 6], [16 + s * 8.2, 22.4, 10.2], 0.5, GD.grey, GL),
      RD([16 + s * 8.2, 22.4, 10.2], [16 + s * 8.6, 19.4, 11.8], 0.5, GD.grey, GL),
    ]),
    ...[[26, 13], [6, 13.4], [21, 14.2]].map(([x, z]) => C(x, 0.4, z, 2.3, 0.8, GD.coin)),
  ]),

  // a golden vase on a plinth: an amphora with S-curl handles, engraved bands and medallions, and a sparkle about it
  piece('goldvase', 'Golden vase', 1, 1, 2500, [
    B(16, 3, 0, 22, 6, 22, GD.goldD, { r: 1.2 }),
    ...frame(16, 3, 11.1, 18, 3.6, GD.goldL),
    B(16, 6.8, 0, 18, 1.6, 18, GD.gold),
    LA(16, 7.6, 0, [[4, 0], [5, 1], [3.4, 3], [5, 6], [9, 12], [10.4, 17], [9.6, 23], [6, 30], [3.8, 34], [3.4, 38], [4.8, 41], [5.2, 42.5]], GD.gold, { seg: 24 }),
    RG(16, 24.6, 0, 10.45, 0.5, GD.goldD, { flat: true }),
    RG(16, 13.6, 0, 5, 0.4, GD.goldD, { flat: true }),
    RG(16, 37.8, 0, 5.85, 0.4, GD.goldD, { flat: true }),
    RG(16, 49.6, 0, 5.2, 0.5, GD.goldL, { flat: true }),
    DS(16, 21, 10.2, 2.8, 0.5, GD.goldL, M), DS(16, 21, -10.2, 2.8, 0.5, GD.goldL, M),
    ...[-1, 1].map(s => RG(16 + s * 8.6, 38, 0, 3.2, 0.8, GD.gold, { seg: 12 })),
    star(5, 46, 4, 2.6), star(27, 30, 9, 2), star(8, 16, 10, 1.6), star(26.5, 52, 0, 2.2),
  ]),
];
