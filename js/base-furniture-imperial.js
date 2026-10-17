/* base-furniture-imperial.js  -  the Imperial set (furniture expansion session d, 2026-10-17): a palace at the lunar new
   year. Glossy red lacquer, gold trim and hardware, black lacquer, jade, cloud and lattice motifs, and a Gyarados where
   a dragon would go. All solo, fixed colours. Built like the Day Care set (js/base-furniture-daycare.js's head): an
   upright piece is a list of parts in painted units (32 a tile), `x` across from the left of its front, `h` up from the
   floor (a wall piece's from the foot of its strip), `z` out to the front from its middle (a wall piece's from the
   wall); painted here from any side, built as 3D parts by js/base-models-imperial.js (BUILT), so picture and model
   agree. A `pic` part is painted on the front only and the model wears that crop. The rug is painted from above. */

import { R, sh, disc, oval, ovalShade, floorShadow, ctx, glass as glassPane } from './base-paint.js';

export const IM = {
  red: '#c8202a', redD: '#8c1219', redL: '#e4483a', gold: '#e9b63c', goldD: '#a87a1c', goldL: '#fbe08a',
  black: '#2a2222', blackL: '#4a3c36', jade: '#3aa476', jadeD: '#1f6e4e', jadeL: '#9adcb8', paper: '#f6ecd4',
  silk: '#f3dcae', blue: '#2752aa', blueL: '#7a9ee0', white: '#f6f4ee', rose: '#7a2e1e', bronze: '#a0722e',
  bronzeD: '#6c4a1a', gyara: '#3a7ad2', gyaraD: '#24529c', cream: '#f2e2b2', glow: '#ff6a40', ink: '#2a2a34',
  pink: '#f0a0b4', pinkL: '#fbd2dc', mirror: '#d6e4ec', tea: '#9a5a32',
};
const GROUP = 'Imperial';
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
/** A flat outline [[dx, dh]...] about x, h, d deep (`holes` cut through it). */
const PR = (x, h, z, pts, d, c, o) => ({ t: 'prism', x, h, z, pts, d, c, ...o });
/** A lathe standing on h, its profile [[r, up]...]. */
const LA = (x, h, z, pts, c, o) => ({ t: 'lathe', x, h, z, pts, c, ...o });
/** A disc facing the front, th thick (`ry` for an oval). */
const DS = (x, h, z, r, th, c, o) => ({ t: 'disc', x, h, z, r, th, c, ...o });
/** A ring r round of a tube `tube` thick, facing the front (`flat` lays it level). */
const RG = (x, h, z, r, tube, c, o) => ({ t: 'ring', x, h, z, r, tube, c, ...o });
/** A picture on a front face, w x hh centred at x, h: `fn(g, left, top, w, hh)` paints it. */
const PC = (x, h, z, w, hh, fn, o) => ({ t: 'pic', x, h, z, w, hh, fn, ...o });

const GOLD = { m: 'metal' };
/** A thin square-edged bar (a lattice's, a trim's). */
const bar = (x, h, z, w, hh, d, c, o) => B(x, h, z, w, hh, d, c, { r: 0.05, ...o });

/** A lattice panel facing the front from a0 to a1 across x and h0 to h1 up, at z `at`, its frame and nx x ny panes;
    `side` stands it along z instead (a0, a1 across z, at its x). */
function lattice(a0, a1, h0, h1, at, nx, ny, c, { side = false, th = 1.2, d = 1.2, frame = c, m } = {}) {
  const put = (a, h, w, hh, col) => (side ? bar(at, h, a, d, hh, w, col, { m }) : bar(a, h, at, w, hh, d, col, { m }));
  const am = (a0 + a1) / 2, hm = (h0 + h1) / 2, W = a1 - a0, H = h1 - h0;
  const out = [put(am, h0 + th / 2, W, th, frame), put(am, h1 - th / 2, W, th, frame), put(a0 + th / 2, hm, th, H, frame), put(a1 - th / 2, hm, th, H, frame)];
  for (let i = 1; i < nx; i++) out.push(put(a0 + W * i / nx, hm, th * 0.75, H - th, c));
  for (let j = 1; j < ny; j++) out.push(put(am, h0 + H * j / ny, W - th, th * 0.75, c));
  return out;
}
/** A ruyi cloud in relief on a front face at z, s across. */
const cloud = (x, h, z, s, c = IM.gold) => [
  DS(x, h - s * 0.28, z, s * 0.62, 0.4, c, { ry: s * 0.18, ...GOLD }),
  DS(x - s * 0.42, h, z + 0.05, s * 0.3, 0.4, c, GOLD),
  DS(x + s * 0.42, h, z + 0.05, s * 0.3, 0.4, c, GOLD),
  DS(x, h + s * 0.16, z + 0.1, s * 0.38, 0.4, c, GOLD),
];
/** A round gold lock plate on a front face at z, r round. */
const lock = (x, h, z, r) => [
  DS(x, h, z, r, 0.6, IM.gold, GOLD), DS(x, h, z + 0.4, r * 0.7, 0.4, IM.goldL, GOLD),
  bar(x, h, z + 0.8, r * 0.28, r * 1.1, 0.5, IM.goldD, GOLD),
];
/** A curved roof's outline hw half-wide, hh tall, its eaves turned up. */
const roof = (hw, hh) => [[-hw, 0], [hw, 0], [hw + 1.6, hh * 0.6], [hw * 0.55, hh * 0.5], [hw * 0.25, hh], [-hw * 0.25, hh], [-hw * 0.55, hh * 0.5], [-hw - 1.6, hh * 0.6]];
/** A blue-and-white lathe: the profile cut at `cuts` (heights), its bands blue and white by turns from `first`. */
function porcelain(x, h, z, pts, cuts, first = IM.blue, o) {
  // at a height a point sits on, a band's foot takes the widest last point there and its top the first
  const at = (y, foot) => {
    const on = pts.filter(p => p[1] === y);
    if (on.length) return (foot ? on[on.length - 1] : on[0])[0];
    for (let i = 1; i < pts.length; i++) if (pts[i][1] > y) { const [r0, y0] = pts[i - 1], [r1, y1] = pts[i]; return r0 + (r1 - r0) * (y - y0) / (y1 - y0); }
    return pts[pts.length - 1][0];
  };
  const ys = [0, ...cuts, pts[pts.length - 1][1]], out = [];
  for (let i = 0; i < ys.length - 1; i++) {
    const lo = ys[i], hi = ys[i + 1], seg = [[at(lo, true), lo], ...pts.filter(([, y]) => y > lo && y < hi), [at(hi, false), hi]];
    if (i === 0) seg.unshift([0, 0]);
    if (i === ys.length - 2) seg.push([0, hi]);
    out.push(LA(x, h, z, seg, i % 2 ? (first === IM.blue ? IM.white : IM.blue) : first, o));
  }
  return out;
}
/** A blue flower painted on a round body r round at its front, dx across, at h. */
const sprig = (x, h, z, r, dx, s = 2.6) => {
  const fz = z + Math.sqrt(Math.max(0, r * r - dx * dx)) - 0.4;
  return [S(x + dx, h, fz, s, s, 0.7, IM.blue, { seg: 8 }), S(x + dx, h, fz + 0.3, s * 0.4, s * 0.4, 0.5, IM.white, { seg: 8 })];
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
  if (m === 'glow') { const t = g.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry)); t.addColorStop(0, '#fff4d8'); t.addColorStop(0.45, sh(c, 1)); t.addColorStop(1, c); g.fillStyle = t; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, TAU); g.fill(); return; }
  if (m === 'glass') { g.save(); g.globalAlpha *= 0.4; oval(cx, cy, rx, ry, '#dff0f8'); g.restore(); return; }
  if (m === 'plain') { oval(cx, cy, rx, ry, c); return; }
  ovalShade(cx, cy, rx, ry, c);
  if (m === 'gloss' || m === 'metal') { g.save(); g.globalAlpha *= 0.55; oval(cx - rx * 0.38, cy - ry * 0.42, rx * 0.22, ry * 0.14, '#ffffff'); g.restore(); }
}

/** Paints parts seen from `dir` (0 front, 2 back, 1 / 3 the sides), on a view vw wide standing on line b; W is the
    piece's front width in units, def the parts' material when they name none. */
function paintParts(parts, x0, b, vw, dir, W, def) {
  const side = dir % 2 === 1, sg = dir === 3 ? -1 : 1, g = ctx();
  const U = (px, pz) => (dir === 0 ? x0 + px : dir === 2 ? x0 + W - px : x0 + vw / 2 + sg * pz);
  const key = (q) => q.k ?? (dir === 0 ? q.z : dir === 2 ? -q.z : sg * (W / 2 - q.x));
  const list = parts.map((q, i) => [key(q), i, q]).sort((a, c) => a[0] - c[0] || a[1] - c[1]).map(e => e[2]);
  for (const q of list) {
    if (q.t === 'pic' && dir !== 0) continue;
    const m = q.m || def, cx = U(q.x, q.z), cy = b - q.h;
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
        if (side && !q.flat) { rbx(cx - q.tube, cy - q.r - q.tube, q.tube * 2, (q.r + q.tube) * 2, q.tube, q.c, m); break; }
        const l = g.createLinearGradient(cx - q.r, 0, cx + q.r, 0);
        l.addColorStop(0, sh(q.c, -1)); l.addColorStop(0.3, sh(q.c, 1)); l.addColorStop(0.6, q.c); l.addColorStop(1, sh(q.c, -2));
        g.strokeStyle = l; g.lineWidth = q.tube * 2;
        g.beginPath();
        if (q.flat) g.ellipse(cx, cy, q.r, Math.max(0.01, q.r * 0.04), 0, 0, TAU); else g.arc(cx, cy, q.r, 0, TAU);
        g.stroke();
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

/** A ruyi cloud painted flat, s across, centred x, y (y down). */
function cloudAt(g, x, y, s, c) {
  g.fillStyle = c;
  g.beginPath(); g.ellipse(x, y + s * 0.22, s * 0.62, s * 0.18, 0, 0, TAU); g.fill();
  for (const [dx, dy, r] of [[-0.42, 0, 0.3], [0.42, 0, 0.3], [0, -0.16, 0.38]]) { g.beginPath(); g.arc(x + dx * s, y + dy * s, r * s, 0, TAU); g.fill(); }
  g.strokeStyle = sh(c, -1); g.lineWidth = Math.max(0.3, s * 0.07);
  g.beginPath(); g.arc(x, y - s * 0.12, s * 0.17, Math.PI * 0.2, Math.PI * 1.7); g.stroke();
}
/** Gyarados as a stroke along `pts` (y down), its head at the last point facing `face` (1 right, -1 left). */
function gyaradosAt(g, pts, width, face, ink) {
  const path = () => { g.beginPath(); g.moveTo(...pts[0]); for (let i = 1; i < pts.length - 1; i++) g.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2); g.lineTo(...pts[pts.length - 1]); };
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.strokeStyle = ink ? ink : IM.gyara; g.lineWidth = width; path(); g.stroke();
  if (!ink) { g.save(); g.translate(0, width * 0.22); g.strokeStyle = IM.cream; g.lineWidth = width * 0.32; path(); g.stroke(); g.restore(); }
  const [hx, hy] = pts[pts.length - 1], r = width * 0.75;
  g.fillStyle = ink || IM.gyara;
  g.beginPath(); g.moveTo(hx - face * r * 0.4, hy - r * 0.6); g.lineTo(hx - face * r * 0.9, hy - r * 2.4); g.lineTo(hx + face * r * 0.3, hy - r * 0.8); g.fill();
  g.beginPath(); g.ellipse(hx, hy, r * 1.1, r * 0.8, 0, 0, TAU); g.fill();
  g.fillStyle = ink ? IM.paper : IM.redL; g.beginPath(); g.ellipse(hx + face * r * 0.8, hy + r * 0.35, r * 0.55, r * 0.25, 0, 0, TAU); g.fill();
  g.fillStyle = ink ? IM.paper : IM.gold; g.beginPath(); g.arc(hx + face * r * 0.2, hy - r * 0.2, r * 0.18, 0, TAU); g.fill();
  g.strokeStyle = ink ? ink : IM.white; g.lineWidth = Math.max(0.25, width * 0.09);
  g.beginPath(); g.moveTo(hx + face * r, hy); g.quadraticCurveTo(hx + face * r * 2.2, hy - r * 0.6, hx + face * r * 2.4, hy + r * 0.6); g.stroke();
}
/** The folding screen's scene, all four leaves side by side (W x H, y down). */
function screenArt(g, W, H) {
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#3a2a28'); bg.addColorStop(1, '#1a1414');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.fillStyle = IM.red; g.beginPath(); g.arc(9, 9, 4.4, 0, TAU); g.fill();
  g.strokeStyle = IM.gold; g.lineWidth = 0.5; g.beginPath(); g.arc(9, 9, 5.4, 0, TAU); g.stroke();
  g.save(); g.globalAlpha *= 0.55; g.strokeStyle = IM.goldL; g.lineWidth = 0.6;
  g.beginPath(); g.moveTo(0, 40); g.lineTo(7, 31); g.lineTo(12, 36); g.lineTo(21, 25); g.lineTo(30, 37); g.lineTo(38, 30); g.lineTo(50.4, 38); g.stroke(); g.restore();
  for (const [x, y, s] of [[26, 7, 5], [42, 9, 4], [17, 17, 3.2], [5, 23, 3.4], [47, 24, 3]]) cloudAt(g, x, y, s, IM.gold);
  gyaradosAt(g, [[12, 47], [18, 30], [27, 38], [34, 26], [40, 30], [43, 17]], 3.6, 1);
  for (let i = 0; i < 9; i++) {
    const x = i * 6.2 - 1, y = H - 5;
    g.fillStyle = i % 2 ? IM.jadeD : IM.jade; g.beginPath(); g.arc(x + 3, y + 2, 4.2, Math.PI, TAU); g.lineTo(x + 7, H); g.lineTo(x - 1, H); g.fill();
    g.strokeStyle = IM.goldL; g.lineWidth = 0.4; g.beginPath(); g.arc(x + 3, y + 2, 2.6, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
  }
}
/** The hanging scroll's ink painting: a waterfall, misty peaks, Gyarados leaping, a column of brushwork and a seal. */
function inkScroll(g, x, y, w, h) {
  g.fillStyle = IM.paper; g.fillRect(x, y, w, h);
  g.fillStyle = '#cfc6b4'; g.beginPath(); g.moveTo(x, y + 20); g.lineTo(x + 3, y + 12); g.lineTo(x + 5.5, y + 17); g.lineTo(x + 9, y + 9); g.lineTo(x + w, y + 18); g.lineTo(x + w, y + 24); g.lineTo(x, y + 26); g.fill();
  g.fillStyle = '#a49c8c'; g.beginPath(); g.moveTo(x, y + 28); g.lineTo(x + 2.4, y + 22); g.lineTo(x + 4.6, y + 27); g.lineTo(x + 4.6, y + h); g.lineTo(x, y + h); g.fill();
  g.strokeStyle = '#ffffff'; g.lineWidth = 0.5;
  for (const dx of [5.4, 6.4, 7.2]) { g.beginPath(); g.moveTo(x + dx, y + 18); g.lineTo(x + dx, y + h - 6); g.stroke(); }
  g.strokeStyle = '#4a5a78'; g.lineWidth = 0.4;
  for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(x + 1.5 + i * 3.4, y + h - 2.6, 1.8, Math.PI, TAU); g.stroke(); }
  gyaradosAt(g, [[x + 9.5, y + h - 4], [x + 11, y + 30], [x + 7, y + 25], [x + 8.6, y + 17]], 2, -1, '#2c3a58');
  g.fillStyle = IM.ink;
  for (let i = 0; i < 6; i++) g.fillRect(x + w - 2.4, y + 2 + i * 1.7, 1.1 - (i % 2) * 0.3, 0.8);
  g.fillStyle = IM.red; g.fillRect(x + w - 2.8, y + 13, 1.8, 1.8);
}
/** The clock's face: gold ticks, two hands. */
function dial(g, x, y, w, h) {
  const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2;
  g.fillStyle = IM.white; g.fillRect(x, y, w, h);
  g.strokeStyle = IM.goldD; g.lineWidth = 0.4;
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.beginPath(); g.moveTo(cx + Math.cos(a) * r * 0.66, cy + Math.sin(a) * r * 0.66); g.lineTo(cx + Math.cos(a) * r * 0.9, cy + Math.sin(a) * r * 0.9); g.stroke(); }
  g.strokeStyle = IM.ink; g.lineCap = 'round';
  g.lineWidth = 0.6; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + r * 0.36, cy - r * 0.2); g.stroke();
  g.lineWidth = 0.4; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx - r * 0.1, cy - r * 0.62); g.stroke();
  g.fillStyle = IM.red; g.beginPath(); g.arc(cx, cy, 0.5, 0, TAU); g.fill();
}
/** A key-fret (square spiral) cell s across at x, y. */
function fret(g, x, y, s) {
  const q = s / 5;
  g.beginPath(); g.moveTo(x, y + s); g.lineTo(x, y); g.lineTo(x + s, y); g.lineTo(x + s, y + s - q); g.lineTo(x + q * 2, y + s - q); g.lineTo(x + q * 2, y + q * 2); g.lineTo(x + q * 3, y + q * 2); g.stroke();
}

/* ---------- the kinds ---------- */

/** What js/base-models-imperial.js builds for each upright and wall kind: its parts and default material. */
export const BUILT = {};

function piece(id, name, w, h, price, mat, parts, rest = {}) {
  BUILT[id] = { parts, mat };
  return { id, name, group: GROUP, solo: true, w, h, price, ...rest, draw(x, b, vw, dir) { floorShadow(x, b, vw); paintParts(parts, x, b, vw, dir, w * 32, mat); } };
}
function wallPiece(id, name, w, price, mat, parts, rest = {}) {
  BUILT[id] = { parts, mat };
  return { id, name, group: GROUP, solo: true, w, h: 1, layer: 'wall', price, ...rest, wall(x) { paintParts(parts, x, 96, w * 32, 0, w * 32, mat); } };
}
/** How thick each rug's slab is, in tiles. */
export const RUGS = { imprug: 0.04 };

const CORNERS = (x0, x1, z) => [[x0, -z], [x1, -z], [x0, z], [x1, z]];
const STEP = [[-31, 0], [31, 0], [31, 20], [22, 20], [22, 25], [12, 25], [12, 30], [-12, 30], [-12, 25], [-22, 25], [-22, 20], [-31, 20]];
const STEP_RIM = [[-32, 0], [32, 0], [32, 21], [23, 21], [23, 26], [13, 26], [13, 31], [-13, 31], [-13, 26], [-23, 26], [-23, 21], [-32, 21]];

/** A guardian lion on its plinth at cx, its paw (on the side f) on a ball of colour `orb`. */
function lion(cx, f, orb) {
  const L = IM.gold, o = { m: 'metal', seg: 10 };
  return [
    B(cx, 2, 0, 26, 4, 26, IM.black, { r: 0.8 }),
    B(cx, 9, 0, 22, 10, 22, IM.red, { r: 0.8 }),
    ...cloud(cx, 9, 11.2, 7),
    B(cx, 15, 0, 25, 2, 25, IM.black, { r: 0.6 }),
    S(cx - f * 1.5, 21.5, -5, 7, 5.5, 7, L, o),
    S(cx, 25, -1, 6.5, 8, 6.5, L, o),
    S(cx, 27, 3, 6, 7.5, 5, L, o),
    RD([cx - f * 3.6, 24, 5], [cx - f * 3.6, 17, 7], 1.9, L, GOLD),
    S(cx - f * 3.6, 17, 8, 2.4, 1.6, 2.6, L, o),
    S(cx + f * 5, 19.4, 7.4, 3.4, 3.4, 3.4, orb, { seg: 10 }),
    RD([cx + f * 3.4, 24, 5], [cx + f * 4.8, 22.6, 8], 1.9, L, GOLD),
    S(cx + f * 4.8, 23.2, 8.6, 2.4, 1.6, 2.4, L, o),
    S(cx - f * 5.4, 30, -9, 3, 4.2, 3, L, o),
    ...[0, 1, 2, 3, 4, 5, 6, 7].map(i => { const a = i / 8 * TAU; return S(cx + Math.cos(a) * 7, 38.5 + Math.sin(a) * 6.6, 1.2, 2.6, 2.6, 2.6, IM.goldD, { m: 'metal', seg: 8 }); }),
    S(cx, 38.5, 3, 7, 6.6, 6, L, o),
    S(cx, 36, 8.4, 3.8, 2.6, 2.4, L, o),
    S(cx, 37.6, 10.4, 1.3, 0.9, 0.8, IM.redD, { seg: 8 }),
    S(cx, 34.2, 9.6, 2.4, 0.9, 1, IM.red, { seg: 8 }),
    ...[-1, 1].map(s => S(cx + s * 2.7, 40.6, 8.2, 1.2, 1.2, 0.8, IM.black, { seg: 8 })),
    ...[-1, 1].map(s => S(cx + s * 2.8, 42.4, 8, 1.8, 0.8, 0.8, IM.goldD, { m: 'metal', seg: 8 })),
  ];
}

/** Gyarados's body, each joint [x, h, z, r]: tail at the waves, the neck by its head. */
const COIL = [[6, 15, -2, 2.2], [10, 21, -1, 3], [15, 27, 1, 3.8], [21, 32, 3, 4.4], [28, 33, 4, 4.8], [35, 29, 3, 5.2], [41, 26, 1, 5.4],
  [47, 30, -1, 5.6], [51, 38, -1, 5.8], [52, 47, 0, 5.8], [50, 55, 2, 5.6]];

export const IMPERIAL_KINDS = [
  // a canopy bed in red lacquer: black posts, gold lattice at the head, the sides and under the canopy, curtains tied back
  piece('impbed', 'Lattice canopy bed', 2, 2, 1500, 'gloss', [
    ...CORNERS(3, 61, 29).map(([x, z]) => B(x, 3, z, 6, 6, 6, IM.black, { r: 0.8 })),
    B(32, 10, 0, 62, 8, 60, IM.red, { r: 1 }),
    bar(32, 7, 30.2, 54, 1.2, 0.6, IM.gold, GOLD),
    ...[16, 32, 48].flatMap(x => cloud(x, 10.4, 30.4, 5)),
    B(32, 17, -1, 58, 6, 56, IM.silk, { r: 2, m: 'cloth' }),
    B(32, 19.5, 9, 59, 3, 38, IM.red, { r: 1.2, m: 'cloth' }),
    bar(32, 19.6, 28.2, 59.4, 1.2, 0.8, IM.gold, { m: 'cloth' }),
    ...[18, 46].map(x => S(x, 22.5, -20, 10, 3.4, 6, IM.gold, { m: 'cloth' })),
    ...CORNERS(3, 61, 29).map(([x, z]) => C(x, 49, z, 1.8, 80, IM.black)),
    B(32, 91, 0, 64, 5, 62, IM.red, { r: 0.8 }),
    B(32, 94.6, 0, 60, 1.6, 58, IM.black, { r: 0.5 }),
    bar(32, 89, 31.3, 64, 1.4, 0.6, IM.gold, GOLD),
    B(32, 84.2, 28.2, 54, 8.4, 0.6, IM.redD, { r: 0.2, m: 'cloth' }),
    ...lattice(5, 59, 80, 88.4, 29, 12, 2, IM.gold, { frame: IM.black, th: 1.5, m: 'metal' }),
    B(32, 53.5, -30, 54, 65, 0.6, IM.silk, { r: 0.2, m: 'cloth' }),
    ...lattice(5, 59, 21, 86, -29, 9, 10, IM.gold, { frame: IM.black, th: 1.5, m: 'metal' }),
    ...[3, 61].flatMap(x => lattice(-27, 27, 21, 40, x, 8, 3, IM.gold, { side: true, frame: IM.black, m: 'metal' })),
    ...[7.5, 56.5].flatMap(x => [B(x, 56, 29.6, 6, 60, 1.6, IM.red, { m: 'cloth', r: 0.8 }), B(x, 50, 30.6, 6.6, 2, 0.8, IM.gold, { m: 'metal', r: 0.4 }),
      C(x, 46, 30.8, 0.4, 5, IM.gold, { m: 'cloth', rb: 1.4 })]),
  ]),

  // a horseshoe-back armchair in red lacquer, a gold seat cushion and a jade medallion on the splat
  piece('impchair', 'Horseshoe armchair', 1, 1, 420, 'gloss', [
    ...CORNERS(6, 26, 9).map(([x, z]) => C(x, 10.5, z, 1.3, 21, IM.red)),
    bar(16, 3, 9.5, 20, 1.6, 1.6, IM.black), bar(16, 3, -9.5, 20, 1.6, 1.6, IM.black),
    ...[6, 26].map(x => bar(x, 4, 0, 1.6, 1.6, 18, IM.black)),
    B(16, 17, 10.6, 20, 4, 1, IM.red, { r: 0.4 }),
    ...cloud(16, 17.2, 11.2, 4),
    B(16, 21.5, 0, 26, 3, 23, IM.red, { r: 0.8 }),
    B(16, 23.6, 1, 22, 1.4, 19, IM.gold, { r: 0.6, m: 'cloth' }),
    B(16, 31.5, -9.4, 9, 17, 1.4, IM.red, { r: 0.6 }),
    DS(16, 33, -8.5, 3, 0.6, IM.gold, GOLD), DS(16, 33, -8.1, 2.1, 0.5, IM.jade),
    ...[6.5, 25.5].map(x => C(x, 29.7, -6.5, 1.1, 13.4, IM.red)),
    ...[5, 27].map(x => C(x, 27.5, 8.5, 1, 9, IM.red)),
    ...(() => {
      const arc = Array.from({ length: 7 }, (_, i) => { const a = Math.PI * i / 6; return [16 - 11.5 * Math.cos(a), 33 + 6 * Math.sin(a), -2 - 8 * Math.sin(a)]; });
      const pts = [[4, 32, 11], [4.5, 33, 4], ...arc, [27.5, 33, 4], [28, 32, 11]];
      return pts.slice(1).map((p, i) => RD(pts[i], p, 1.1, IM.red));
    })(),
  ], {}),

  // a lacquered daybed: a stepped black back with gold lattice, low arms, a gold cushion and red bolsters
  piece('impsofa', 'Lacquer daybed', 2, 1, 1100, 'gloss', [
    ...CORNERS(4, 60, 12).map(([x, z]) => B(x, 4.5, z, 5, 9, 5, IM.black, { r: 0.6 })),
    ...CORNERS(4, 60, 12).map(([x, z]) => B(x, 1, z, 5.6, 2, 5.6, IM.gold, { m: 'metal', r: 0.4 })),
    B(32, 12, 0, 64, 6, 30, IM.red, { r: 1 }),
    B(32, 7.8, 13.6, 52, 3.6, 1, IM.red, { r: 0.5 }),
    ...[18, 32, 46].flatMap(x => cloud(x, 8, 14.2, 4.4)),
    bar(32, 14.4, 15.2, 62, 0.8, 0.6, IM.gold, GOLD),
    B(32, 17, 1.5, 56, 4, 25, IM.gold, { r: 1.6, m: 'cloth' }),
    PR(32, 15, -13.4, STEP_RIM, 1.4, IM.gold, GOLD),
    PR(32, 15, -12.6, STEP, 2, IM.black),
    ...lattice(12, 52, 22, 40, -11.2, 8, 3, IM.gold, { frame: IM.red, th: 1, d: 0.8, m: 'metal' }),
    ...[2.5, 61.5].flatMap(x => [B(x, 21, 0, 3, 12, 28, IM.black, { r: 0.6 }), B(x, 27.5, 0, 3.6, 1.4, 29, IM.gold, { m: 'metal', r: 0.4 })]),
    ...[9, 55].map(x => S(x, 22, 3, 4.5, 4.5, 10, IM.red, { m: 'cloth' })),
    S(32, 24.5, -8, 10, 6, 3.5, IM.red, { m: 'cloth' }),
  ]),

  // a round banquet table: a red top rimmed in gold, a jade centre, black legs on gold feet
  piece('imptable', 'Round banquet table', 2, 2, 950, 'gloss', [
    ...[0, 1, 2, 3].flatMap(i => {
      const a = TAU * (i / 4 + 1 / 8), x = 32 + Math.cos(a) * 19, z = Math.sin(a) * 19;
      return [C(x, 12, z, 2.6, 20, IM.black, { rb: 2 }), C(x, 1, z, 3, 2, IM.gold, GOLD)];
    }),
    RG(32, 6, 0, 19, 0.8, IM.gold, { flat: true, m: 'metal' }),
    C(32, 22.5, 0, 25, 4, IM.black),
    ...[[32, 25.1], [18, 20.4], [46, 20.4]].flatMap(([x, z]) => cloud(x, 22.4, z, 4)),
    C(32, 25.8, 0, 29, 2.6, IM.red),
    C(32, 25.8, 0, 29.3, 1.2, IM.gold, GOLD),
    C(32, 27.2, 0, 11, 0.3, IM.gold, GOLD), C(32, 27.4, 0, 8.5, 0.3, IM.jade),
  ]),

  // a scholar's desk in black lacquer, its ends turned up: a brush stand, a brush rack, an ink stone and paper
  piece('impdesk', 'Scholar’s desk', 2, 1, 900, 'gloss', [
    ...CORNERS(5, 59, 11).map(([x, z]) => B(x, 13.4, z, 3.4, 26.8, 3.4, IM.black, { r: 0.6 })),
    ...CORNERS(5, 59, 11).map(([x, z]) => B(x, 1, z, 4.2, 2, 4.2, IM.gold, { m: 'metal', r: 0.4 })),
    ...[5, 59].flatMap(x => lattice(-9.5, 9.5, 5, 20, x, 4, 3, IM.gold, { side: true, frame: IM.black, th: 1, d: 1, m: 'metal' })),
    B(32, 24.6, 12, 50, 4, 1.2, IM.red, { r: 0.5 }),
    ...[20, 44].flatMap(x => cloud(x, 24.8, 12.7, 4)),
    B(32, 28, 0, 58, 2.4, 28, IM.black, { r: 0.6 }),
    bar(32, 28, 14.1, 58, 0.8, 0.4, IM.gold, GOLD),
    PR(2, 26.8, 0, [[-1, 0], [2, 0], [2, 2.4], [0.5, 4.2], [-1.6, 4.6]], 28, IM.black),
    PR(62, 26.8, 0, [[1, 0], [-2, 0], [-2, 2.4], [-0.5, 4.2], [1.6, 4.6]], 28, IM.black),
    ...porcelain(50, 29.2, -5, [[3.4, 0], [3.4, 9.6]], [1.4, 8.2], IM.blue, { seg: 12 }),
    ...[[-1.4, 0.6, -2.6], [0.2, -0.8, 0.4], [1.4, 0.8, 2.6]].map(([dx, dz, lean]) => RD([50 + dx, 37, -5 + dz], [50 + dx + lean, 46, -5 + dz], 0.5, IM.rose, { m: 'wood' })),
    ...[8, 24].map(x => RD([x, 29.2, -8], [x, 41, -8], 0.6, IM.black)),
    RD([6.5, 41, -8], [25.5, 41, -8], 0.7, IM.black),
    ...[11, 14, 17, 20].flatMap(x => [RD([x, 40.4, -7.4], [x, 33.6, -7.4], 0.45, IM.rose, { m: 'wood' }), C(x, 32.4, -7.4, 0.6, 2.4, IM.ink, { rb: 0.1, m: 'cloth' })]),
    B(32, 29.9, 2, 8, 1.4, 6, IM.ink, { r: 0.5 }),
    B(42, 29.4, 5, 12, 0.3, 9, IM.paper, { r: 0.1, m: 'plain' }),
    B(26, 30.4, 7, 2, 2.4, 2, IM.red, { r: 0.3 }),
  ]),

  // a tall red wardrobe: gold-framed panels, a lattice under each, a big round gold lock across its doors
  piece('impwardrobe', 'Gold-lock wardrobe', 2, 1, 1200, 'gloss', [
    ...CORNERS(6, 58, 12).map(([x, z]) => B(x, 1.5, z, 5, 3, 5, IM.gold, { m: 'metal', r: 0.6 })),
    B(32, 4.5, 0, 58, 3, 29, IM.black, { r: 0.6 }),
    B(32, 46, 0, 54, 80, 27, IM.red, { r: 1 }),
    B(32, 87.5, 0, 59, 3, 31, IM.black, { r: 0.6 }),
    PR(32, 88.9, 0, [[-29.5, 0], [29.5, 0], [31.6, 2.6], [28.6, 1.6], [-28.6, 1.6], [-31.6, 2.6]], 30, IM.black),
    ...[18.5, 45.5].flatMap(x => [
      B(x, 60, 13.8, 22, 44, 0.6, IM.gold, { m: 'metal', r: 0.4 }), B(x, 60, 14.1, 19.6, 41.6, 0.6, IM.redD, { r: 0.4 }),
      ...cloud(x, 70, 14.5, 8), DS(x, 54, 14.5, 3.4, 0.4, IM.jade), RG(x, 54, 14.6, 3.6, 0.4, IM.gold, GOLD),
      B(x, 22, 13.8, 22, 26, 0.6, IM.gold, { m: 'metal', r: 0.4 }), B(x, 22, 14.1, 19.6, 23.6, 0.6, IM.redD, { r: 0.4 }),
      ...lattice(x - 8.6, x + 8.6, 11, 33, 14.6, 4, 4, IM.gold, { th: 0.8, d: 0.6, m: 'metal' }),
    ]),
    bar(32, 46, 13.9, 0.8, 78, 0.6, IM.black),
    ...lock(32, 46, 14.6, 5.4),
    ...[[8, 84], [56, 84], [8, 8.2], [56, 8.2]].map(([x, h]) => bar(x, h, 13.9, 4.4, 2.6, 0.6, IM.gold, GOLD)),
  ], {}),

  // a black lacquer chest of drawers: six red drawers with gold pulls, a red top
  piece('impdresser', 'Lacquer chest of drawers', 2, 1, 750, 'gloss', [
    ...CORNERS(5, 59, 12).map(([x, z]) => B(x, 2, z, 4.4, 4, 4.4, IM.black, { r: 0.6 })),
    B(32, 21, 0, 60, 34, 27, IM.black, { r: 0.8 }),
    B(32, 39, 0, 63, 2.4, 30, IM.red, { r: 0.6 }),
    bar(32, 39, 15.1, 63, 0.8, 0.4, IM.gold, GOLD),
    ...[10, 20.6, 31.2].flatMap(h => [17, 47].flatMap(x => [
      B(x, h, 13.7, 27, 9.4, 0.8, IM.red, { r: 0.6 }),
      DS(x, h + 0.6, 14.2, 1.8, 0.4, IM.gold, GOLD), RG(x, h - 0.9, 14.5, 1.6, 0.35, IM.gold, GOLD),
      ...[-1, 1].map(s => bar(x + s * 11.6, h, 14.2, 2, 7, 0.3, IM.goldD, GOLD)),
    ])),
  ]),

  // a curio shelf of staggered black lacquer cubbies on a red back: porcelain, jade, a gold ingot and a lacquer box
  piece('impshelf', 'Curio display shelf', 2, 1, 1000, 'gloss', [
    B(32, 44, -10.5, 58, 80, 1.2, IM.red, { r: 0.3 }),
    ...[2.5, 61.5].map(x => B(x, 44, 0, 3, 86, 22, IM.black, { r: 0.6 })),
    B(32, 87, 0, 64, 3, 24, IM.black, { r: 0.6 }),
    B(32, 89.2, 0, 60, 1.4, 22, IM.gold, { m: 'metal', r: 0.4 }),
    B(32, 3, 0, 62, 6, 22, IM.black, { r: 0.6 }),
    bar(32, 3.4, 11.2, 54, 1, 0.6, IM.gold, GOLD),
    B(32, 18, 0, 2, 24, 21, IM.black, { r: 0.3 }),
    B(18, 30, 0, 28, 2, 21, IM.black, { r: 0.3 }),
    B(46, 24, 0, 28, 2, 21, IM.black, { r: 0.3 }),
    B(41, 41.5, 0, 2, 33, 21, IM.black, { r: 0.3 }),
    B(22.5, 58, 0, 37, 2, 21, IM.black, { r: 0.3 }),
    B(51, 52, 0, 18, 2, 21, IM.black, { r: 0.3 }),
    B(24, 71.8, 0, 2, 27.5, 21, IM.black, { r: 0.3 }),
    ...porcelain(11, 6, 0, [[0, 0], [3.4, 0], [5.4, 6], [5, 12], [2.4, 15], [2.8, 17], [0, 17]], [1.2, 11], IM.blue, { seg: 12 }),
    S(24, 8.6, 2, 5, 2.6, 3, IM.gold, { m: 'metal', seg: 10 }), S(24, 10.6, 2, 2.4, 2.2, 2, IM.goldL, { m: 'metal', seg: 8 }),
    LA(40, 6, 0, [[0, 0], [3.6, 0], [5.6, 4], [5.6, 9], [3.4, 11.5], [0, 11.5]], IM.red),
    LA(40, 17.5, 0, [[3.6, 0], [3.4, 1.6], [1.2, 2.6], [0, 3]], IM.gold, { m: 'metal' }),
    B(52, 7, 0, 7, 2, 4, IM.black, { r: 0.3 }),
    RG(52, 13.8, 0, 4.4, 1.6, IM.jade),
    B(14, 32, -3, 9, 2, 4, IM.black, { r: 0.3 }),
    DS(14, 42, -6, 9, 1, IM.white), DS(14, 42, -5.3, 7.2, 0.4, IM.blue), DS(14, 42, -5, 5.8, 0.4, IM.white), DS(14, 42, -4.7, 2.6, 0.3, IM.blue),
    S(31, 36.4, 0, 5, 5.4, 5, IM.jade, { seg: 12 }), S(31, 44, 0, 3.4, 3.6, 3.4, IM.jade, { seg: 10 }), RD([31, 47.4, 0], [32.4, 50, 0], 0.5, IM.gold, GOLD),
    ...porcelain(51, 25, 0, [[0, 0], [3.6, 0], [4.4, 4], [6.6, 12], [5, 18], [2.4, 21], [3, 24], [0, 24]], [2, 13, 20], IM.blue, { seg: 12 }),
    B(13, 61.6, 0, 14, 5.2, 12, IM.blue, { r: 0.6, m: 'cloth' }), B(13, 66.4, 0, 12.4, 4.4, 11, IM.red, { r: 0.6, m: 'cloth' }),
    bar(13, 61.6, 6.1, 1.4, 5.2, 0.4, IM.white, { m: 'cloth' }),
    B(36, 62, 0, 12, 6, 10, IM.red, { r: 0.8 }), bar(36, 64, 5.1, 12.2, 1, 0.4, IM.gold, GOLD), DS(36, 61.4, 5.2, 1.4, 0.4, IM.gold, GOLD),
    ...porcelain(52, 59, 0, [[0, 0], [3, 0], [5.6, 5], [4.6, 9], [1.8, 11], [1.6, 15], [2.4, 16.5], [0, 16.5]], [9, 15], IM.white, { seg: 12 }),
  ]),

  // a red silk lantern hung from a black crook on its stand (tap it to switch)
  piece('implamp', 'Silk lantern lamp', 1, 1, 420, 'gloss', [
    LA(8, 0, -4, [[0, 0], [7, 0], [7, 1.4], [4, 2.4], [2, 4], [0, 4]], IM.black),
    RG(8, 1.6, -4, 6.6, 0.4, IM.gold, { flat: true, m: 'metal' }),
    C(8, 41, -4, 1.1, 74, IM.black),
    S(8, 79, -4, 1.6, 1.6, 1.6, IM.gold, { m: 'metal', seg: 8 }),
    RD([8, 76, -4], [21.5, 76, -4], 0.9, IM.black),
    RD([8, 70, -4], [13, 76, -4], 0.6, IM.black),
    S(22, 76, -4, 1.1, 1.1, 1.1, IM.gold, { m: 'metal', seg: 8 }),
    RD([20, 75.4, -4], [20, 71, -4], 0.3, IM.gold, GOLD),
    C(20, 70.2, -4, 4, 1.6, IM.gold, GOLD),
    S(20, 59.6, -4, 10, 10.4, 10, IM.glow, { m: 'glow', seg: 16 }),
    RG(20, 59.6, -4, 9.9, 0.4, IM.gold, { flat: true, m: 'metal' }),
    C(20, 49, -4, 4, 1.6, IM.gold, GOLD),
    RD([20, 48.2, -4], [20, 45, -4], 0.4, IM.red, { m: 'cloth' }),
    S(20, 44.6, -4, 1.4, 1.4, 1.4, IM.gold, { m: 'metal', seg: 8 }),
    C(20, 39.5, -4, 0.8, 8, IM.red, { m: 'cloth', rb: 2 }),
  ], { glow: [IM.glow] }),

  // a gilded clock under a two-tier pagoda roof, on a red lacquer pedestal
  piece('impclock', 'Gilded pagoda clock', 1, 1, 900, 'gloss', [
    B(16, 1.5, 0, 22, 3, 18, IM.black, { r: 0.6 }),
    B(16, 14, 0, 18, 22, 15, IM.red, { r: 0.8 }),
    B(16, 14, 7.8, 13, 16, 0.6, IM.gold, { m: 'metal', r: 0.4 }), B(16, 14, 8.1, 11, 14, 0.6, IM.black, { r: 0.3 }),
    ...cloud(16, 14, 8.6, 7),
    B(16, 26, 0, 21, 2, 18, IM.black, { r: 0.5 }),
    B(16, 39, 0, 17, 24, 13, IM.gold, { m: 'metal', r: 1 }),
    ...[8.5, 23.5].map(x => C(x, 39, 6, 1, 24, IM.red)),
    DS(16, 40, 6.6, 6.4, 0.6, IM.goldD, GOLD), DS(16, 40, 7, 5.6, 0.4, IM.white),
    PC(16, 40, 7.25, 7.8, 7.8, dial),
    PR(16, 51, 0, roof(11, 5), 16, IM.red),
    B(16, 57, 0, 9, 3, 7, IM.gold, { m: 'metal', r: 0.5 }),
    PR(16, 58.4, 0, roof(7, 4), 11, IM.red),
    LA(16, 62, 0, [[1.4, 0], [1.6, 1], [0.8, 2], [0, 2.4]], IM.gold, GOLD),
    S(16, 65.2, 0, 1.8, 1.8, 1.8, IM.gold, { m: 'metal', seg: 8 }),
  ]),

  // a four-leaf black lacquer screen in gold frames: a red sun, gold clouds and Gyarados over jade waves
  piece('impscreen', 'Cloud lacquer screen', 2, 1, 950, 'gloss', [0, 1, 2, 3].flatMap(i => {
    const x = 8.5 + i * 15.67, z = i % 2 ? -3 : 3;
    return [
      ...[-5, 5].map(dx => B(x + dx, 2, z, 3, 4, 7, IM.black, { r: 0.6 })),
      B(x, 42, z, 15.4, 72, 1.6, IM.gold, { m: 'metal', r: 0.5 }),
      B(x, 42, z + 0.5, 13.4, 66, 1, IM.black, { r: 0.3 }),
      B(x, 15, z + 1.1, 12.6, 9, 0.4, IM.red, { r: 0.3 }),
      ...cloud(x, 15.2, z + 1.4, 6),
      PC(x, 48, z + 1.05, 12.6, 52, (g, px, py) => { g.save(); g.translate(px - i * 12.6, py); screenArt(g, 50.4, 52); g.restore(); }),
      B(x, 79, z, 15.8, 2, 2.2, IM.black, { r: 0.5 }),
    ];
  })),

  // a round mirror in a red frame swung between black posts, a gold cloud on top
  piece('impmirror', 'Moon mirror stand', 1, 1, 550, 'gloss', [
    B(16, 2, 0, 30, 4, 12, IM.black, { r: 0.8 }),
    bar(16, 3.4, 6.1, 26, 0.8, 0.4, IM.gold, GOLD),
    ...[2.5, 29.5].map(x => B(x, 24, 0, 2.6, 40, 3, IM.black, { r: 0.6 })),
    ...[2.5, 29.5].map(x => S(x, 45, 0, 1.8, 1.8, 1.8, IM.gold, { m: 'metal', seg: 8 })),
    bar(16, 8, 0, 26, 2, 2.6, IM.red),
    ...[[3.8, 4.6], [27.4, 28.2]].map(([a, b]) => RD([a, 33, 0], [b, 33, 0], 0.7, IM.gold, GOLD)),
    DS(16, 33, 0, 11.6, 2, IM.red),
    RG(16, 33, 1.1, 10.6, 0.6, IM.gold, GOLD),
    DS(16, 33, 1.2, 9.6, 0.4, IM.mirror, GOLD),
    PR(13, 36, 1.5, [[-3, -2], [-1.4, -2], [3, 3], [1.4, 3]], 0.2, '#ffffff', { m: 'plain' }),
    ...cloud(16, 46.4, 0.6, 6),
  ]),

  // a bronze gong hung from a red-and-black frame (tap it to strike)
  piece('impgong', 'Palace gong', 1, 1, 800, 'gloss', [
    ...[2.4, 29.6].flatMap(x => [B(x, 2, 0, 4.4, 4, 16, IM.black, { r: 0.8 }), C(x, 37, 0, 1.6, 66, IM.red), S(x, 72, 0, 2, 2, 2, IM.gold, { m: 'metal', seg: 8 })]),
    B(16, 66, 0, 30, 3.4, 4, IM.black, { r: 0.6 }),
    PR(16, 67.7, 0, [[-13, 0], [13, 0], [16, 3], [11.5, 1.6], [-11.5, 1.6], [-16, 3]], 4.4, IM.red),
    bar(16, 8, 0, 26, 2, 3, IM.black),
    ...[-1, 1].map(s => RD([16 + s * 4, 64.4, 0], [16 + s * 2.4, 48.6, 0], 0.4, IM.red, { m: 'cloth' })),
    DS(16, 37, 0, 11.5, 1.6, IM.bronze, GOLD),
    RG(16, 37, 0.9, 10.6, 0.5, IM.bronzeD, GOLD),
    DS(16, 37, 1, 4, 1.2, IM.gold, GOLD),
    ...cloud(16, 44, 1.1, 5, IM.goldD),
    RD([26, 1, 7], [22, 20, 7], 0.6, IM.rose, { m: 'wood' }), S(22, 21.4, 7, 2, 2, 2, IM.red, { m: 'cloth', seg: 8 }),
  ]),

  // a red barrel drum on a splayed black stand, gold studs round its head (tap it to play)
  piece('impdrum', 'Palace drum', 1, 1, 650, 'gloss', [
    ...[[4, 9, -10, -4], [28, 23, -10, -4], [4, 9, 10, 4], [28, 23, 10, 4]].map(([x0, x1, z0, z1]) => RD([x0, 0.6, z0], [x1, 24, z1], 1.2, IM.black)),
    bar(16, 7, 0, 20, 1.4, 1.4, IM.black),
    DS(16, 30, 0, 12, 14, IM.red),
    ...[-6.2, 6.2].map(z => DS(16, 30, z, 12.3, 1, IM.goldD, GOLD)),
    ...[-7.1, 7.1].map(z => DS(16, 30, z, 11, 0.4, IM.silk, { m: 'plain' })),
    ...Array.from({ length: 12 }, (_, i) => { const a = i / 12 * TAU; return S(16 + Math.cos(a) * 11.5, 30 + Math.sin(a) * 11.5, 6.9, 0.7, 0.7, 0.5, IM.gold, { m: 'metal', seg: 6 }); }),
    DS(16, 30, 7.4, 4, 0.2, IM.gold, GOLD), DS(16, 30, 7.6, 2.8, 0.2, IM.red),
    RD([4, 42, 3], [12, 44, 3], 0.5, IM.rose, { m: 'wood' }), RD([28, 42, 3], [20, 44, 3], 0.5, IM.rose, { m: 'wood' }),
  ]),

  // a bronze tripod censer: cloud band, upright handles, a domed lid and a jade finial (tap it for smoke)
  piece('impincense', 'Tripod incense burner', 1, 1, 480, 'metal', [
    ...[0, 1, 2].flatMap(i => {
      const a = TAU * i / 3 + Math.PI / 2, c = Math.cos(a), s = Math.sin(a);
      return [RD([16 + c * 7, 12, s * 7], [16 + c * 9.5, 1.6, s * 9.5], 1.4, IM.bronze), S(16 + c * 9.6, 1.4, s * 9.6, 2, 1.4, 2, IM.bronzeD, { seg: 8 })];
    }),
    LA(16, 10, 0, [[0, 0], [7, 0.4], [10.5, 3], [11.6, 8], [11.4, 12], [0, 12]], IM.bronze),
    C(16, 16, 0, 11.9, 2, IM.goldD),
    ...cloud(16, 15.6, 11.9, 4),
    C(16, 22.5, 0, 12.4, 1.4, IM.bronzeD),
    ...[5.5, 26.5].map(x => PR(x, 23, 0, [[-2.4, 0], [2.4, 0], [2.4, 7], [-2.4, 7]], 1.6, IM.bronze, { holes: [[[-1.2, 0.8], [1.2, 0.8], [1.2, 5.6], [-1.2, 5.6]]] })),
    LA(16, 23, 0, [[10, 0], [9, 2], [6, 4.5], [3, 5.6], [0, 6]], IM.bronze),
    LA(16, 28.6, 0, [[1.6, 0], [2.4, 0.8], [1.2, 1.8], [0, 2]], IM.gold),
    S(16, 32.4, 0, 2.4, 2.4, 2.4, IM.jade, { m: 'gloss', seg: 10 }),
  ]),

  // a low rosewood tea table: a black tray, a blue-and-white teapot and three cups of tea (tap it for steam)
  piece('imptea', 'Gongfu tea table', 1, 1, 550, 'gloss', [
    ...CORNERS(4, 28, 11).map(([x, z]) => B(x, 7.2, z, 2.6, 14.4, 2.6, IM.black, { r: 0.5 })),
    B(16, 12.4, 12.4, 22, 3, 0.8, IM.red, { r: 0.3 }),
    ...cloud(16, 12.6, 12.9, 3.6),
    B(16, 4, 0, 23, 1.6, 21, IM.rose, { r: 0.4, m: 'wood' }),
    B(16, 15.6, 0, 30, 2.4, 28, IM.rose, { r: 0.6, m: 'wood' }),
    bar(16, 15.6, 14.1, 30, 0.6, 0.3, IM.gold, GOLD),
    B(16, 17.4, 0, 22, 1.2, 16, IM.black, { r: 0.4 }),
    ...porcelain(15, 18, -2, [[0, 0], [3.4, 0], [5, 2], [5.2, 3.6], [3.6, 5.8], [1.8, 6.4], [0, 6.4]], [1, 3.2, 4.2], IM.white, { seg: 12 }),
    RD([19.5, 21, -2], [23.5, 24.6, -2], 0.7, IM.white),
    RG(9.6, 21.6, -2, 2.2, 0.6, IM.white),
    S(15, 25, -2, 1.2, 1, 1.2, IM.blue, { seg: 8 }),
    ...[[8, 5], [16, 6], [24, 5]].flatMap(([x, z]) => [
      LA(x, 18, z, [[0, 0], [1.1, 0], [1.8, 1.6], [2, 2.6], [0, 2.6]], IM.white, { seg: 12 }),
      C(x, 19.6, z, 1.8, 0.3, IM.blue), C(x, 20.75, z, 1.7, 0.3, IM.tea, { m: 'plain' }),
    ]),
  ]),

  // a tall blue-and-white vase on a black stand, blue flowers round its body
  piece('impvase', 'Blue-and-white vase', 1, 1, 450, 'gloss', [
    C(16, 2, 0, 9, 4, IM.black, { rb: 10 }),
    RG(16, 4, 0, 9.4, 0.5, IM.gold, { flat: true, m: 'metal' }),
    ...porcelain(16, 4, 0, [[0, 0], [6, 0], [6.4, 1.4], [8.6, 7], [11, 15], [12, 22], [11.4, 27], [8, 32], [4.6, 35], [4.2, 37], [5.4, 39.5], [5.6, 40.5], [0, 40.5]],
      [1.4, 8, 9.2, 27, 32, 39.5], IM.blue),
    ...[0, -6.5, 6.5].flatMap(dx => sprig(16, 4 + 19, 0, 11.7, dx, dx ? 2.2 : 2.8)),
    ...[-4, 4].flatMap(dx => sprig(16, 4 + 14, 0, 10.6, dx, 1.4)),
  ]),

  // a jade tree on a gold trunk in a cloisonné pot, coral beads among its leaves
  piece('impjade', 'Jade tree', 1, 1, 650, 'gloss', [
    LA(16, 0, 0, [[0, 0], [6.5, 0], [7, 1], [9.6, 6], [10.6, 10], [11.2, 11.4], [0, 11.4]], IM.blue),
    C(16, 11.2, 0, 11.4, 1.2, IM.gold, GOLD),
    C(16, 1, 0, 7.2, 2, IM.gold, { rb: 6.9, m: 'metal' }),
    ...cloud(16, 6.4, 9.6, 5),
    S(16, 12, 0, 9.6, 1.6, 9.6, IM.jadeD, { seg: 12 }),
    RD([16, 12, 0], [15, 24, 0], 1.4, IM.gold, GOLD),
    ...[[[15, 24, 0], [8, 33, 2]], [[15, 24, 0], [24, 34, -2]], [[15, 24, 0], [16, 40, 0]], [[15.4, 20, 0], [21, 27, 4]], [[15.2, 21, 0], [10, 27, 4]]].map(([a, b]) => RD(a, b, 0.9, IM.gold, GOLD)),
    S(8, 35, 2, 6.5, 4.6, 6, IM.jade, { seg: 12 }), S(24, 36, -2, 6.5, 4.6, 6, IM.jadeL, { seg: 12 }), S(16, 43, 0, 7.5, 5.4, 7, IM.jade, { seg: 12 }),
    S(21, 28, 4, 4, 3, 4, IM.jadeL, { seg: 10 }), S(10, 28, 4, 4, 3, 4, IM.jade, { seg: 10 }),
    ...[[10, 39, 6, IM.pink], [20, 47, 5, IM.redL], [27, 38, 3, IM.pink], [13, 36, 6.6, IM.gold], [17, 48.6, 2, IM.pink], [23, 30, 7, IM.redL]].map(([x, h, z, c]) => S(x, h, z, 1.4, 1.4, 1.4, c, { seg: 8 })),
  ]),

  // a pair of gilded guardian lions on red plinths, each with a paw on a ball
  piece('implions', 'Guardian lion pair', 2, 1, 1300, 'gloss', [...lion(14, -1, IM.jade), ...lion(50, 1, IM.red)]),

  // Gyarados in blue lacquer bursting from jade waves on a black stand, its jaws open
  piece('impdragon', 'Gyarados carving', 2, 1, 1450, 'gloss', [
    B(32, 3, 0, 62, 6, 26, IM.black, { r: 0.8 }),
    bar(32, 5.2, 13.1, 60, 0.8, 0.4, IM.gold, GOLD),
    ...[14, 32, 50].flatMap(x => cloud(x, 2.8, 13.2, 4)),
    ...[[10, 8, 2, 9, 4, 9, IM.jade], [26, 7.6, -2, 9, 3.6, 10, IM.jadeD], [42, 8, 3, 9, 4, 9, IM.jade], [56, 7.6, -1, 7, 3.4, 9, IM.jadeL]].map(([x, h, z, rx, ry, rz, c]) => S(x, h, z, rx, ry, rz, c, { seg: 12 })),
    ...[[12, 11.4, 6], [40, 11.6, 7], [55, 10.6, 4]].map(([x, h, z]) => S(x, h, z, 3, 1.4, 3, IM.white, { seg: 8 })),
    PR(6, 14, -2, [[0, 0], [-5, 2], [-5.6, 8], [-1.4, 4.6], [1.2, 9], [2, 3]], 1, IM.white),
    ...COIL.map(([x, h, z, r]) => S(x, h, z, r, r, r, IM.gyara, { seg: 12 })),
    ...COIL.slice(1).map(([x, h, z, r], i) => RD(COIL[i].slice(0, 3), [x, h, z], Math.min(r, COIL[i][3]) * 0.92, IM.gyara)),
    ...COIL.slice(2).map(([x, h, z, r]) => S(x, h - r * 0.25, z + r * 0.45, r * 0.72, r * 0.72, r * 0.6, IM.cream, { seg: 10 })),
    ...[3, 5, 7, 9].map(i => { const [x, h, z, r] = COIL[i]; return PR(x, h + r * 0.8, z - 1, [[-2.4, 0], [2.4, 0], [-1.4, 4.4]], 0.8, IM.white); }),
    S(47, 63, 4, 7, 6.2, 7, IM.gyara, { seg: 12 }),
    S(51, 61, 8, 5.4, 3, 5, IM.gyara, { seg: 12 }),
    S(50.5, 58.4, 8.4, 4, 1.6, 3.6, IM.redL, { seg: 10 }),
    S(50, 56.4, 7, 4.6, 2, 4.4, IM.cream, { seg: 10 }),
    ...[48.4, 53].map(x => C(x, 59.2, 10.6, 0, 2.2, IM.white, { rb: 0.8 })),
    ...[44.6, 50.2].map(x => S(x, 65.4, 9.4, 1.5, 1.1, 0.8, '#f0d040', { seg: 8 })),
    PR(44, 67, 2, [[0, 0], [5, 0], [-1, 14], [-3.4, 9]], 1.2, IM.gyaraD),
    RD([54, 62, 10], [58.4, 64, 12], 0.5, IM.white), RD([58.4, 64, 12], [61, 60, 12], 0.5, IM.white),
    RD([45, 60.6, 10], [40.6, 62.6, 12], 0.5, IM.white), RD([40.6, 62.6, 12], [38.4, 58.6, 12], 0.5, IM.white),
  ]),

  // a red lacquer chest bound in gold, a round gold lock on its front (tap it to open)
  piece('impchest', 'Lacquer treasure chest', 1, 1, 600, 'gloss', [
    ...CORNERS(5, 27, 8).map(([x, z]) => B(x, 1, z, 3.4, 2, 3.4, IM.black, { r: 0.5 })),
    B(16, 9, 0, 28, 14, 20, IM.red, { r: 0.8 }),
    B(16, 18.6, 0, 29, 5.2, 21, IM.red, { r: 1.2 }),
    bar(16, 16.2, 0, 29.4, 0.8, 21.4, IM.black),
    ...[6, 26].map(x => bar(x, 11.6, 10.4, 2, 19, 0.8, IM.gold, GOLD)),
    ...[[2.6, 3.6], [29.4, 3.6], [2.6, 19.6], [29.4, 19.6]].map(([x, h]) => bar(x, h, 10.4, 2.8, 2.8, 0.8, IM.gold, GOLD)),
    ...lock(16, 13.4, 10.4, 3.6),
    ...[11, 21].flatMap(x => cloud(x, 6.6, 10.3, 3.4)),
  ]),

  // a red palace rug: a gold key-fret border, cloud scrolls and a round medallion
  { id: 'imprug', name: 'Palace rug', w: 2, h: 2, layer: 'rug', price: 650, high: 0.04, side: 'c', flat(w, h) {
    const g = ctx();
    R(0, 0, w, h, IM.goldD); R(1.2, 1.2, w - 2.4, h - 2.4, IM.gold);
    g.strokeStyle = IM.redD; g.lineWidth = 0.7;
    for (let i = 0; i < 12; i++) {
      const a = 2.4 + i * 4.95;
      fret(g, a, 2.4, 4); fret(g, a, h - 6.4, 4);
      if (i > 0 && i < 11) { fret(g, 2.4, a, 4); fret(g, w - 6.4, a, 4); }
    }
    R(8, 8, w - 16, h - 16, IM.red);
    g.strokeStyle = IM.gold; g.lineWidth = 0.6; g.strokeRect(9.6, 9.6, w - 19.2, h - 19.2);
    for (const [x, y] of [[18, 19], [46, 19], [18, 45], [46, 45], [32, 13], [32, 51], [13, 32], [51, 32]]) cloudAt(g, x, y, 4.4, sh(IM.red, -1));
    for (const [x, y, a] of [[10.2, 10.2, 0], [w - 10.2, 10.2, 0.5], [w - 10.2, h - 10.2, 1], [10.2, h - 10.2, 1.5]]) {
      g.fillStyle = IM.gold; g.beginPath(); g.moveTo(x, y); g.arc(x, y, 6, a * Math.PI, (a + 0.5) * Math.PI); g.fill();
      g.fillStyle = IM.red; g.beginPath(); g.moveTo(x, y); g.arc(x, y, 4, a * Math.PI, (a + 0.5) * Math.PI); g.fill();
    }
    disc(32, 32, 14, IM.gold); disc(32, 32, 12.6, IM.redD); disc(32, 32, 11.8, IM.red);
    g.fillStyle = IM.gold;
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; g.beginPath(); g.ellipse(32 + Math.cos(a) * 8, 32 + Math.sin(a) * 8, 3, 1.5, a, 0, TAU); g.fill(); }
    disc(32, 32, 5, IM.jade); disc(32, 32, 3.4, IM.gold); disc(32, 32, 2, IM.jadeD);
  } },

  // a hanging scroll: brocade top and bottom, an ink painting of Gyarados leaping a waterfall, a red seal
  wallPiece('impscroll', 'Gyarados ink scroll', 1, 320, 'cloth', [
    RD([10, 87, 1.6], [16, 93, 1.6], 0.3, IM.gold, GOLD), RD([22, 87, 1.6], [16, 93, 1.6], 0.3, IM.gold, GOLD),
    S(16, 93.4, 1.6, 0.9, 0.9, 0.9, IM.gold, { m: 'metal', seg: 8 }),
    RD([7, 86, 1.6], [25, 86, 1.6], 1.1, IM.black, { m: 'gloss' }),
    ...[6.4, 25.6].map(x => S(x, 86, 1.6, 1.2, 1.2, 1.2, IM.gold, { m: 'metal', seg: 8 })),
    B(16, 80, 0.8, 18, 11, 0.6, IM.redD, { r: 0.2 }),
    ...[76, 84].map(h => bar(16, h, 1.2, 18, 0.8, 0.3, IM.gold)),
    B(16, 52, 0.9, 14, 46, 0.6, IM.paper, { r: 0.1, m: 'plain' }),
    PC(16, 52, 1.25, 13, 44, inkScroll),
    B(16, 25, 0.8, 18, 8, 0.6, IM.redD, { r: 0.2 }),
    RD([6, 20.5, 1.6], [26, 20.5, 1.6], 1.4, IM.black, { m: 'gloss' }),
    ...[5.4, 26.6].map(x => S(x, 20.5, 1.6, 1.6, 1.6, 1.6, IM.gold, { m: 'metal', seg: 8 })),
  ]),

  // a big red folding fan on the wall, gold-edged, painted with peonies, a tassel from its pivot
  wallPiece('impfan', 'Peony paper fan', 2, 450, 'gloss', [
    ...Array.from({ length: 12 }, (_, i) => {
      const a0 = (10 + i * 160 / 12) * Math.PI / 180, a1 = (10 + (i + 1) * 160 / 12) * Math.PI / 180, p = (r, a) => [r * Math.cos(a), r * Math.sin(a)];
      return [
        PR(32, 44, 1, [p(9, a0), p(28, a0), p(28, a1), p(9, a1)], 0.6, i % 2 ? IM.red : IM.redL, { m: 'cloth' }),
        PR(32, 44, 1.1, [p(28, a0), p(30.6, a0), p(30.6, a1), p(28, a1)], 0.8, IM.gold, GOLD),
      ];
    }).flat(),
    ...Array.from({ length: 13 }, (_, i) => { const a = (10 + i * 160 / 12) * Math.PI / 180; return RD([32, 44, 0.6], [32 + Math.cos(a) * 9.4, 44 + Math.sin(a) * 9.4, 0.6], i % 12 ? 0.45 : 0.8, IM.black); }),
    ...[[21, 58], [43, 59], [32, 66]].flatMap(([x, h], i) => [
      DS(x - 3, h - 2.4, 1.5, 2.4, 0.3, IM.jade, { ry: 1.3, m: 'plain' }), DS(x + 3.4, h - 2, 1.5, 2.2, 0.3, IM.jadeD, { ry: 1.2, m: 'plain' }),
      DS(x, h, 1.7, i === 2 ? 3.4 : 3, 0.3, IM.pink, { m: 'plain' }), DS(x, h + 0.3, 1.9, i === 2 ? 2.2 : 2, 0.3, IM.pinkL, { m: 'plain' }),
      DS(x, h + 0.4, 2.1, 0.8, 0.3, IM.gold, { m: 'plain' }),
    ]),
    DS(32, 44, 1.6, 1.6, 0.8, IM.gold, GOLD),
    RD([32, 43, 1.4], [32, 33, 1.4], 0.35, IM.red, { m: 'cloth' }),
    S(32, 32.6, 1.4, 1.2, 1.2, 1.2, IM.gold, { m: 'metal', seg: 8 }),
    C(32, 27.6, 1.4, 0.6, 8, IM.red, { m: 'cloth', rb: 2 }),
  ]),

  // a round lattice window: a red frame ringed in gold, black lattice over pale paper
  wallPiece('implattice', 'Lattice moon window', 1, 400, 'gloss', [
    DS(16, 58, 0.5, 13, 0.8, IM.paper, { m: 'plain' }),
    ...[-8.8, -4.4, 0, 4.4, 8.8].flatMap(d => {
      const half = Math.sqrt(13 * 13 - d * d);
      return [bar(16 + d, 58, 1.3, 0.8, half * 2, 0.8, IM.black), bar(16, 58 + d, 1.4, half * 2, 0.8, 0.8, IM.black)];
    }),
    RG(16, 58, 1.2, 13.5, 1.8, IM.red),
    RG(16, 58, 1.2, 15.6, 0.5, IM.gold, GOLD),
    ...[[16, 74.6], [16, 41.4]].flatMap(([x, h]) => cloud(x, h, 1.4, 5)),
  ]),
];
