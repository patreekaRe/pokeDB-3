/* base-furniture-laundromat.js  -  the Laundromat set (furniture expansion session j, 2026-10-17): a whole room of a
   bright retro coin laundromat, as Animal Crossing's Happy Home Paradise does a room type. Mint green, white enamel and
   chrome, orange plastic seats, green and amber LED timers that glow. Front-loading coin washers with round glass doors
   (one swings open on the wash inside), a washer-dryer tower, a row of big tumble dryers, a steam press and an ironing
   board (they steam), a detergent vending machine, a change machine and a gumball machine that give, a folding table,
   a drop-off counter with its bell, carts, baskets, a soap shelf, clothes on a rail, a drying rack, chairs, a LAUNDRY
   neon, a clock, a lost-sock board, an out-of-order sign and a tiled floor mat. Rotom-Wash as a washer of its own, a
   Wooloo puffed up fresh from the dryer, Lotad soap on the shelf and a Gyarados beach towel for the Pokémon touches.
   All solo, fixed colours, sold all year.
   An upright piece is a list of parts in painted units (32 a tile), as in js/base-furniture-ramen.js: `x` across from
   the left of its front, `h` up from the floor (a wall piece's from the foot of its strip), `z` out to the front from
   its middle (a wall piece's from the wall). They're painted here from any side, and js/base-models-laundromat.js builds
   the same list as 3D parts (BUILT), so picture and model agree. A box or a picture with `rx` leans its top back by
   that angle (the sign's A-frame boards). A disc with `ax: 'x'` stands side-on (the cart's castors). `tex` is painted
   only (the model stays plain colour): `mesh` a basket's or a wire shelf's weave, `terry` a towel's fine ribs. A `pic`
   part (the timers, the labels, the dial, the towel's Gyarados, the soap boxes' Lotad, the signs' words) is painted on
   the front only, and the model wears that crop of the painting. The coin washer's round glass door swings (`doors`,
   `inside`) on the wash modelled behind it. The floor mat is painted from above (RUG). */

import { sh, oval, ovalShade, floorShadow, ctx, hash, glass as glassPane } from './base-paint.js';

export const LD = {
  mint: '#8fd4b8', mintL: '#c4ecdc', mintD: '#58a48a', enamel: '#f6f5ee', enamelD: '#d9d9d0', chrome: '#c4ccd0', chromeL: '#e8eef0',
  chromeD: '#7e888e', orange: '#f2832a', orangeD: '#c55e18', orangeL: '#ffab5c', black: '#24282c', blackL: '#40464c',
  drum: '#5c666c', drumD: '#3a4248', led: '#7cf0a8', ledO: '#ffb060', glowW: '#eafff6', red: '#d84030', yellow: '#f6cc3a',
  pink: '#f4a0b4', sky: '#8cc8f0', lemon: '#f8e080', white: '#fbfbf6', lilac: '#c0a8e8', canvas: '#e6dcc2', canvasD: '#c4b898',
  cork: '#c89a60', paper: '#f6f0dc', water: '#a8d8f0', plant: '#58a858',
  rotomW: '#eef4f8', rotomB: '#3a84d4', rotomO: '#ff9a2a', wool: '#f6f2ea', woolD: '#ddd4c4', woolFace: '#4a4246',
  gya: '#3a78c8', gyaD: '#28568e', gyaB: '#f0dc90', lotad: '#4a90c8', lotadPad: '#5cb850',
};
const GROUP = 'Laundromat';
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

const CL = { m: 'cloth' }, PL = { m: 'plain' }, GL = { m: 'gloss' }, MT = { m: 'metal' }, GW = { m: 'glow' };
const MESH = { m: 'gloss', tex: 'mesh' }, TERRY = { m: 'cloth', tex: 'terry' };

/** A round front-loader's porthole at x, h on a front at z: a chrome ring r round, its glass, and (`wash`) the drum's
    dark back with two bundles of laundry tumbling in it. Returns [fixed parts, door parts]. */
function porthole(x, h, z, r, wash = [LD.pink, LD.sky]) {
  const inside = [DS(x, h, z + 0.15, r * 0.92, 0.2, LD.drumD, PL), RG(x, h, z + 0.25, r * 0.9, 0.5, LD.chromeD, MT)];
  if (wash) inside.push(S(x - r * 0.28, h - r * 0.32, z + 0.45, r * 0.42, r * 0.3, 0.3, wash[0], CL), S(x + r * 0.3, h - r * 0.22, z + 0.5, r * 0.36, r * 0.32, 0.3, wash[1], CL));
  const door = [DS(x, h, z + 1.1, r * 0.9, 0.4, '#cfe8f4', { m: 'glass' }), RG(x, h, z + 1.3, r, r * 0.13, LD.chrome, MT)];
  return [inside, door];
}
/** An LED timer: a black window, its digits lit in c. */
const timer = (x, h, z, w, text, c = LD.led) => [B(x, h, z, w, 3.6, 0.6, LD.black, PL), PC(x, h, z + 0.35, w - 1, 3, word(text, c, LD.black))];
/** A folded towel w across, 2 tall, d deep, its fold to the front. */
const towel = (x, h, z, w, d, c) => B(x, h + 1, z, w, 2, d, c, { ...TERRY, r: 0.9 });
/** A shirt hung on a wire hanger whose hook meets a rail at `rail`: its outline extruded thin. */
const SHIRT = [[-4.4, 0], [4.4, 0], [4.6, 7.4], [6.2, 6.4], [7.4, 8.8], [3.6, 11.4], [1.6, 11], [0, 10.2], [-1.6, 11], [-3.6, 11.4], [-7.4, 8.8], [-6.2, 6.4], [-4.6, 7.4]];
const DRESS = [[-6, 0], [6, 0], [3, 8.4], [4, 11.2], [2, 11.6], [0, 10.6], [-2, 11.6], [-4, 11.2], [-3, 8.4]];
const hung = (x, rail, z, c, out = SHIRT) => {
  const h = rail - 15.2;
  return [
    PR(x, h, z, out, 1.4, c, CL),
    RD([x - 6, h + 10.4, z], [x, h + 13, z], 0.35, LD.chromeD, MT), RD([x, h + 13, z], [x + 6, h + 10.4, z], 0.35, LD.chromeD, MT),
    RD([x, h + 13, z], [x, rail, z], 0.35, LD.chromeD, MT),
  ];
};
/** A sock, cuff up, toe to the right. */
const SOCK = [[-1.6, 9], [1.6, 9], [1.6, 3.4], [4.8, 2.8], [5.4, 1.4], [4.6, 0], [-0.6, 0], [-1.6, 1.2]];
const flip = (pts) => pts.map(([px, ph]) => [-px, ph]);
const legs4 = (xs, zs, s, hh, c = LD.chrome, o = MT) => xs.flatMap(x => zs.map(z => B(x, hh / 2, z, s, hh, s, c, { ...o, r: s / 2 })));

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
  const g = ctx(), [x0, y0, x1, y1] = bb, c = q.c;
  g.save(); g.clip(path);
  if (q.tex === 'mesh') {
    g.globalAlpha = 0.55; g.strokeStyle = sh(c, -2); g.lineWidth = 0.35; g.beginPath();
    for (let x = x0 + 1.2; x < x1; x += 1.6) { g.moveTo(x, y0); g.lineTo(x, y1); }
    for (let y = y0 + 1.2; y < y1; y += 1.6) { g.moveTo(x0, y); g.lineTo(x1, y); }
    g.stroke();
  } else if (q.tex === 'terry') {
    g.lineWidth = 0.25;
    for (let y = y0 + 0.5, i = 0; y < y1; y += 0.7, i++) { g.globalAlpha = 0.35; g.strokeStyle = i % 2 ? sh(c, 1) : sh(c, -1); g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke(); }
  }
  g.restore();
}

/** Paints parts seen from `dir` (0 front, 2 back, 1 / 3 the sides), on a view vw wide standing on line b; Wd is the
    piece's front width in units. */
function paintParts(parts, x0, b, vw, dir, Wd) {
  const side = dir % 2 === 1, sg = dir === 3 ? -1 : 1, flp = dir === 2 ? -1 : 1, g = ctx();
  const U = (px, pz) => (dir === 0 ? x0 + px : dir === 2 ? x0 + Wd - px : x0 + vw / 2 + sg * pz);
  const key = (q) => q.k ?? (dir === 0 ? q.z : dir === 2 ? -q.z : sg * (Wd / 2 - q.x));
  const list = parts.map((q, i) => [key(q), i, q]).sort((a, c) => a[0] - c[0] || a[1] - c[1]).map(e => e[2]);
  for (const q of list) {
    if (q.t === 'pic' && dir !== 0) continue;
    const m = q.m || 'gloss', cx = U(q.x, q.z), cy = b - q.h;
    switch (q.t) {
      case 'box': {
        if (q.rx && side) {
          const ca = Math.cos(q.rx), sa = Math.sin(q.rx);
          const pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([dz, du]) => { const z = dz * q.d / 2, up = du * q.hh / 2; return [U(q.x, q.z + z * ca - up * sa), cy - (z * sa + up * ca)]; });
          poly(pts, q.c, m);
          break;
        }
        const w = side ? q.d : q.w, hh = q.rx ? q.hh * Math.cos(q.rx) + q.d * Math.abs(Math.sin(q.rx)) : q.hh;
        rbx(cx - w / 2, cy - hh / 2, w, hh, q.r, q.c, m);
        if (q.tex) { const p = new Path2D(); p.roundRect(cx - w / 2, cy - hh / 2, w, hh, Math.min(q.r, w / 2, hh / 2)); texture(q, p, [cx - w / 2, cy - hh / 2, cx + w / 2, cy + hh / 2]); }
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
      case 'disc': {
        const edge = q.ax === 'x' ? !side : side;
        if (edge) rbx(cx - q.th / 2, cy - (q.ry ?? q.r), q.th, (q.ry ?? q.r) * 2, q.th / 2, q.c, m);
        else ball(cx, cy, q.r, q.ry ?? q.r, q.c, m);
        break;
      }
      case 'lathe': {
        const P = (dx, up) => [cx + flp * dx, cy - up];
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

const SANS = 'Arial Black, Arial, sans-serif';
/** A word across a painted box: bold letters in fg over bg (none for clear). */
const word = (text, fg, bg, k = 0.82) => (g, x, y, w, h) => {
  if (bg) { g.fillStyle = bg; g.fillRect(x, y, w, h); }
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `bold ${h * k}px ${SANS}`; g.fillText(text, x + w / 2, y + h * 0.54, w * 0.94);
};
/** Two lines of words, one over the other. */
const lines2 = (a, b2, fg, bg) => (g, x, y, w, h) => { word(a, fg, bg, 0.8)(g, x, y, w, h / 2); word(b2, fg, null, 0.8)(g, x, y + h / 2, w, h / 2); };

/** Neon letters (8 wide, 12 tall at s 1) as strokes about a middle x, standing on h. */
const GLYPH = {
  L: [[-4, 12, -4, 0], [-4, 0, 4, 0]],
  A: [[-4, 0, 0, 12], [0, 12, 4, 0], [-2.4, 4.6, 2.4, 4.6]],
  U: [[-4, 12, -4, 2.5], [-4, 2.5, -1.8, 0], [-1.8, 0, 1.8, 0], [1.8, 0, 4, 2.5], [4, 2.5, 4, 12]],
  N: [[-4, 0, -4, 12], [-4, 12, 4, 0], [4, 0, 4, 12]],
  D: [[-4, 0, -4, 12], [-4, 12, 1, 12], [1, 12, 4, 9], [4, 9, 4, 3], [4, 3, 1, 0], [1, 0, -4, 0]],
  R: [[-4, 0, -4, 12], [-4, 12, 2, 12], [2, 12, 4, 10], [4, 10, 4, 8], [4, 8, 2, 6], [2, 6, -4, 6], [-1, 6, 4, 0]],
  Y: [[-4, 12, 0, 6], [4, 12, 0, 6], [0, 6, 0, 0]],
};
const letters = (text, xs, h, z, s, r, c, o) => [...text].flatMap((ch, i) => GLYPH[ch].map(([ax, ah, bx, bh]) => RD([xs[i] + ax * s, h + ah * s, z], [xs[i] + bx * s, h + bh * s, z], r, c, o)));

/** The beach towel: Gyarados's blue with its cream belly scales across the foot, its fierce head in the middle, white
    barbels and fangs, and a fringe. */
function gyarados(g, x, y, w, h) {
  const s = w, cx = x + w / 2, cy = y + h * 0.42;
  g.fillStyle = LD.gya; g.fillRect(x, y, w, h);
  g.fillStyle = LD.gyaB; g.fillRect(x, y + h * 0.78, w, h * 0.22);
  g.strokeStyle = sh(LD.gyaB, -2); g.lineWidth = s * 0.02;
  for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(x + w * (i + 0.5) / 5, y + h * 0.78, w * 0.1, 0, Math.PI); g.stroke(); }
  g.fillStyle = '#ffffff'; for (let i = 0; i < 10; i++) g.fillRect(x + w * (i + 0.2) / 10, y + h * 0.95, w * 0.05, h * 0.05);
  g.fillStyle = LD.gyaD;
  g.beginPath(); g.moveTo(cx - s * 0.3, cy - s * 0.12); g.lineTo(cx - s * 0.12, cy - s * 0.38); g.lineTo(cx, cy - s * 0.22); g.lineTo(cx + s * 0.12, cy - s * 0.38); g.lineTo(cx + s * 0.3, cy - s * 0.12); g.closePath(); g.fill();
  g.fillStyle = sh(LD.gya, 1); g.beginPath(); g.ellipse(cx, cy, s * 0.3, s * 0.22, 0, 0, TAU); g.fill();
  g.fillStyle = '#ffffff';
  for (const sg of [-1, 1]) {
    g.beginPath(); g.moveTo(cx + sg * s * 0.06, cy - s * 0.1); g.lineTo(cx + sg * s * 0.24, cy - s * 0.14); g.lineTo(cx + sg * s * 0.2, cy - s * 0.04); g.closePath(); g.fill();
  }
  g.fillStyle = LD.red; for (const sg of [-1, 1]) { g.beginPath(); g.arc(cx + sg * s * 0.17, cy - s * 0.09, s * 0.025, 0, TAU); g.fill(); }
  g.fillStyle = '#5a1a1a'; g.beginPath(); g.ellipse(cx, cy + s * 0.08, s * 0.16, s * 0.09, 0, 0, TAU); g.fill();
  g.fillStyle = '#ffffff';
  for (const sg of [-1, 1]) { g.beginPath(); g.moveTo(cx + sg * s * 0.13, cy + s * 0.02); g.lineTo(cx + sg * s * 0.09, cy + s * 0.1); g.lineTo(cx + sg * s * 0.06, cy + s * 0.02); g.closePath(); g.fill(); }
  g.strokeStyle = '#ffffff'; g.lineWidth = s * 0.03; g.lineCap = 'round';
  for (const sg of [-1, 1]) { g.beginPath(); g.moveTo(cx + sg * s * 0.26, cy + s * 0.06); g.quadraticCurveTo(cx + sg * s * 0.42, cy + s * 0.12, cx + sg * s * 0.4, cy + s * 0.28); g.stroke(); }
}

/** A box of Lotad soap: the lily pad over its blue face, white eyes and a little yellow beak, LOTAD across the foot,
    and soap bubbles. */
function lotad(g, x, y, w, h) {
  const cx = x + w / 2, cy = y + h * 0.48, s = w;
  g.fillStyle = LD.white; g.fillRect(x, y, w, h);
  g.fillStyle = LD.lotad; g.beginPath(); g.ellipse(cx, cy + s * 0.05, s * 0.34, s * 0.24, 0, 0, TAU); g.fill();
  g.fillStyle = LD.lotadPad; g.beginPath(); g.ellipse(cx, cy - s * 0.18, s * 0.46, s * 0.16, 0, 0, TAU); g.fill();
  g.strokeStyle = sh(LD.lotadPad, -2); g.lineWidth = s * 0.03; g.beginPath(); g.moveTo(cx, cy - s * 0.18); g.lineTo(cx, cy - s * 0.32); g.stroke();
  g.fillStyle = '#ffffff'; for (const sg of [-1, 1]) { g.beginPath(); g.ellipse(cx + sg * s * 0.13, cy + s * 0.02, s * 0.07, s * 0.08, 0, 0, TAU); g.fill(); }
  g.fillStyle = LD.black; for (const sg of [-1, 1]) { g.beginPath(); g.arc(cx + sg * s * 0.13, cy + s * 0.03, s * 0.03, 0, TAU); g.fill(); }
  g.fillStyle = LD.yellow; g.beginPath(); g.ellipse(cx, cy + s * 0.15, s * 0.12, s * 0.05, 0, 0, TAU); g.fill();
  g.strokeStyle = LD.water; g.lineWidth = s * 0.03;
  for (const [bx, by, r] of [[0.14, 0.12, 0.07], [0.86, 0.18, 0.05], [0.8, 0.06, 0.04]]) { g.beginPath(); g.arc(x + w * bx, y + h * by, s * r, 0, TAU); g.stroke(); }
  word('LOTAD', LD.lotad, null, 0.9)(g, x, y + h * 0.8, w, h * 0.18);
}

/** A detergent jug's label: a mint swoosh and its name. */
const jugLabel = (name, c) => (g, x, y, w, h) => {
  g.fillStyle = LD.white; g.fillRect(x, y, w, h);
  g.fillStyle = c; g.beginPath(); g.ellipse(x + w / 2, y + h * 0.36, w * 0.4, h * 0.26, -0.3, 0, TAU); g.fill();
  word(name, LD.black, null, 0.9)(g, x, y + h * 0.66, w, h * 0.3);
};

/** A magazine's cover: its title on a band, a bright picture block and a strap line. */
const cover = (title, bg, art) => (g, x, y, w, h) => {
  g.fillStyle = bg; g.fillRect(x, y, w, h);
  word(title, LD.white, null, 0.8)(g, x, y + h * 0.04, w, h * 0.2);
  g.fillStyle = art; g.beginPath(); g.arc(x + w * 0.5, y + h * 0.56, w * 0.26, 0, TAU); g.fill();
  g.fillStyle = sh(art, 2); g.beginPath(); g.arc(x + w * 0.42, y + h * 0.5, w * 0.08, 0, TAU); g.fill();
  g.fillStyle = LD.white; g.fillRect(x + w * 0.1, y + h * 0.86, w * 0.8, h * 0.04);
};

/** The clock's dial: white, mint hour marks, orange hands at ten past ten, a little washer porthole in the middle. */
function dial(g, x, y, w, h) {
  const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2;
  g.fillStyle = LD.white; g.beginPath(); g.arc(cx, cy, r * 0.98, 0, TAU); g.fill();
  g.fillStyle = LD.mintD;
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * TAU - Math.PI / 2, big = i % 3 === 0, rr = r * 0.8;
    g.save(); g.translate(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); g.rotate(a + Math.PI / 2);
    g.fillRect(-r * (big ? 0.05 : 0.025), -r * (big ? 0.1 : 0.06), r * (big ? 0.1 : 0.05), r * (big ? 0.2 : 0.12));
    g.restore();
  }
  g.lineCap = 'round';
  for (const [a, len, lw] of [[-150, 0.46, 0.09], [-30, 0.66, 0.06]]) { const t = a * Math.PI / 180; g.strokeStyle = LD.orange; g.lineWidth = r * lw; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(t) * r * len, cy + Math.sin(t) * r * len); g.stroke(); }
  g.fillStyle = LD.chrome; g.beginPath(); g.arc(cx, cy, r * 0.14, 0, TAU); g.fill();
  g.fillStyle = LD.water; g.beginPath(); g.arc(cx, cy, r * 0.09, 0, TAU); g.fill();
}

/** The lost-sock board's notice: FOUND in red, lines of writing, a sock drawn at the foot. */
function notice(g, x, y, w, h) {
  g.fillStyle = LD.paper; g.fillRect(x, y, w, h);
  word('FOUND!', LD.red, null, 0.8)(g, x, y + h * 0.04, w, h * 0.2);
  g.fillStyle = LD.blackL;
  for (let i = 0; i < 4; i++) g.fillRect(x + w * 0.12, y + h * (0.32 + i * 0.1), w * (i === 3 ? 0.5 : 0.76), h * 0.035);
  g.fillStyle = LD.sky; g.beginPath(); SOCK.forEach(([px, ph], i) => { const X = x + w * 0.42 + px * w * 0.05, Y = y + h * 0.95 - ph * h * 0.03; i ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.closePath(); g.fill();
}

/** The out-of-order board: black-and-yellow hazard stripes top and foot, OUT OF / ORDER between. */
function outOfOrder(g, x, y, w, h) {
  g.fillStyle = LD.yellow; g.fillRect(x, y, w, h);
  for (const by of [y, y + h * 0.84]) {
    g.save(); g.beginPath(); g.rect(x, by, w, h * 0.16); g.clip();
    g.fillStyle = LD.black;
    for (let sx = x - h; sx < x + w; sx += w * 0.18) { g.beginPath(); g.moveTo(sx, by + h * 0.16); g.lineTo(sx + w * 0.09, by + h * 0.16); g.lineTo(sx + w * 0.09 + h * 0.16, by); g.lineTo(sx + h * 0.16, by); g.closePath(); g.fill(); }
    g.restore();
  }
  lines2('OUT OF', 'ORDER', LD.black, null)(g, x, y + h * 0.2, w, h * 0.6);
}

/* ---------- the kinds ---------- */

/** What js/base-models-laundromat.js builds for each upright and wall kind: its parts, doors and default material. */
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

const washerPort = porthole(16, 22, 13, 9.6);
const rotomPort = porthole(16, 17, 12, 7.6, null);
const stackLow = porthole(16, 17.5, 12, 8.2), stackHigh = porthole(16, 51.5, 12, 8.2, [LD.lemon, LD.white]);
const dryerPorts = [porthole(16, 29, 12, 11, [LD.lilac, LD.white]), porthole(48, 29, 12, 11, [LD.lemon, LD.sky])];
/** The gumball globe's gumballs, heaped in its lower part on a grid. */
const GUMS = [];
for (let gx = -4.2; gx <= 4.3; gx += 2.8) for (let gh = -4.6; gh <= 1; gh += 2.6) for (let gz = -3; gz <= 3.1; gz += 3) {
  if (Math.hypot(gx, gh, gz) > 5.2) continue;
  GUMS.push(S(16 + gx, 33.6 + gh, gz, 1.5, 1.5, 1.5, [LD.red, LD.yellow, LD.sky, LD.orange, LD.pink, LD.plant][GUMS.length % 6], { m: 'gloss', seg: 8 }));
}
/** The A-frame sign's lean, and its front board's face. */
const LEAN = Math.atan2(6, 30), FACE = { up: Math.sin(LEAN) * 0.75, out: Math.cos(LEAN) * 0.75 };

export const LAUNDROMAT_KINDS = [
  // a white enamel coin washer: its round glass door swings open on the drum and the wash, a mint panel up top with
  // the coin slide and a green timer
  piece('lndwasher', 'Laundromat coin washer', 1, 1, 950, 'gloss', [
    B(16, 1, 0, 28, 2, 24, LD.chromeD, PL),
    B(16, 24, 0, 28, 44, 26, LD.enamel, GL),
    B(16, 46.6, 0, 29, 1.6, 27, LD.chrome, MT),
    B(16, 51, -7, 28, 7.6, 12, LD.mint, GL),
    ...timer(10, 51, -0.8, 10, '0:32'),
    B(22.5, 51, -0.6, 7, 3.4, 1.2, LD.chrome, MT), B(22.5, 51, 0.1, 1, 2.4, 0.4, LD.black, PL),
    B(16, 40, 13.2, 24, 4.4, 0.6, LD.mint, GL), PC(16, 40, 13.55, 20, 3.6, word('WASH', LD.white, LD.mint)),
    B(16, 6, 13.2, 22, 4, 0.6, LD.enamelD, PL),
    ...washerPort[0],
  ], {
    doors: [{ hinge: [16 - 9.6 * 1.13, 14.3], side: 1, parts: [...washerPort[1], B(25.6, 22, 14.9, 1.6, 6, 1.4, LD.chromeD, MT)] }],
    inside: { x: 16, h: 22, w: 17, hh: 17, z: 13.1, bare: true },
    glow: [LD.led],
  }),

  // Rotom in a washer of its own: a white body trimmed blue, blue eyes over its porthole grin, blue hose arms and its
  // orange plasma crackling up over the lid
  piece('lndrotom', 'Laundromat Rotom-Wash washer', 1, 1, 1250, 'gloss', [
    B(16, 1, 0, 26, 2, 22, LD.rotomB, PL),
    B(16, 22, 0, 26, 40, 24, LD.rotomW, GL),
    B(16, 42.8, 0, 27, 1.8, 25, LD.rotomB, GL),
    PR(16, 43.4, 0, [[-12, 0], [12, 0], [11, 5], [8, 3], [6, 8.5], [3, 4], [0, 9.5], [-3, 4], [-6, 8.5], [-8, 3], [-11, 5]], 18, LD.rotomO, GW),
    ...[10, 22].flatMap(x => [DS(x, 32, 12.3, 3.2, 0.6, LD.rotomB, { m: 'gloss', ry: 4.2 }), DS(x - 0.8, 33.4, 12.75, 1, 0.3, '#ffffff', PL)]),
    DS(16, 17, 12.15, 7, 0.2, LD.water, PL),
    ...[[13, 13.6, 2.4], [17.6, 13, 2.8], [20.2, 15.4, 1.8], [15.4, 16, 1.6]].map(([x, h, r]) => S(x, h, 12.45, r, r, 0.3, LD.white, CL)),
    DS(16, 17, 12.75, 6.8, 0.4, '#cfe8f4', { m: 'glass' }), RG(16, 17, 12.9, 7.6, 1.1, LD.rotomB, GL),
    B(16, 5, 12.2, 20, 3, 0.4, LD.rotomB, PL),
    ...[2.2, 29.8].map(x => RD([x, 34, 3], [x, 22, 7], 1.2, LD.rotomB, GL)),
    ...[2.2, 29.8].map(x => S(x, 21, 7.4, 1.6, 1.6, 1.6, LD.rotomO, GW)),
  ], { glow: [LD.rotomO] }),

  // a washer under a dryer in one chrome-banded tower, a green wash timer and an amber dry one
  piece('lndstack', 'Laundromat washer-dryer tower', 1, 1, 1400, 'gloss', [
    B(16, 1, 0, 28, 2, 24, LD.chromeD, PL),
    B(16, 18, 0, 28, 32, 24, LD.enamel, GL),
    B(16, 34.6, 0, 28.6, 1.4, 24.6, LD.chrome, MT),
    B(16, 52.2, 0, 28, 34, 24, LD.enamel, GL),
    B(16, 71.2, 0, 28.6, 4, 24.6, LD.mint, GL),
    ...stackLow[0], ...stackLow[1], ...stackHigh[0], ...stackHigh[1],
    ...timer(9, 30, 12.3, 9, 'WASH'), ...timer(9, 65, 12.3, 9, 'DRY', LD.ledO),
    ...[30, 65].map(h => B(22.6, h, 12.5, 6, 3, 1, LD.chrome, MT)),
  ], { glow: [LD.led, LD.ledO] }),

  // two big tumble dryers side by side under a mint DRYERS band: wide glass doors on the laundry tumbling, amber timers
  piece('lnddryers', 'Laundromat tumble dryer row', 2, 1, 1500, 'gloss', [
    B(32, 1, 0, 62, 2, 24, LD.chromeD, PL),
    ...[16, 48].map(x => B(x, 28, 0, 30, 52, 24, LD.enamel, GL)),
    B(32, 57, 0, 64, 6, 26, LD.mint, GL), PC(32, 57, 13.05, 30, 4.6, word('DRYERS', LD.white, LD.mint)),
    ...dryerPorts.flatMap(([a, d]) => [...a, ...d]),
    ...[16, 48].flatMap(x => [...timer(x - 4, 47, 12.2, 12, '0:45', LD.ledO), B(x + 7, 47, 12.4, 6, 3, 1, LD.chrome, MT), B(x + 11.6, 29, 14, 1.4, 6, 1.4, LD.chromeD, MT), B(x, 8, 12.2, 24, 6, 0.6, LD.enamelD, PL)]),
  ], { glow: [LD.ledO] }),

  // a laundry steam press: a mint cabinet, the padded buck and the chrome head over it on its arm, an orange handle bar,
  // a pressure gauge on the column and a foot pedal
  piece('lndpress', 'Laundromat steam press', 1, 1, 820, 'metal', [
    B(16, 1, 0, 26, 2, 22, LD.chromeD, PL),
    B(16, 11, -1, 24, 18, 20, LD.mint, GL),
    B(16, 2.6, 12.6, 10, 1.2, 5, LD.black, GL),
    B(16, 34, -7, 7, 28, 6, LD.chrome, MT),
    B(16, 21.6, 2, 30, 3, 18, LD.chromeD, MT),
    B(16, 23.9, 2, 29, 1.8, 17, LD.canvas, { ...CL, r: 0.9 }),
    B(16, 31.6, 3, 30, 3.6, 18, LD.chrome, MT),
    B(16, 39.6, -2, 8, 3, 15, LD.chrome, MT), RD([16, 38, 6], [16, 33.4, 9], 1, LD.chromeD, MT),
    RD([4, 34, 12.6], [28, 34, 12.6], 0.9, LD.orange, GL), ...[4, 28].map(x => RD([x, 33.2, 10], [x, 34, 12.6], 0.5, LD.chromeD, MT)),
    DS(16, 45, -3.6, 3, 0.8, LD.chromeL, MT), DS(16, 45, -3.1, 2.4, 0.3, LD.white, PL),
    RD([16, 45, -2.9], [17.6, 46.4, -2.9], 0.2, LD.red, PL),
    RD([10.8, 20, -8], [7, 36, -9], 0.6, LD.blackL, GL), RD([7, 36, -9], [12.4, 42, -8], 0.6, LD.blackL, GL),
  ]),

  // a detergent vending machine: mint, rows of little soap boxes behind its lit window, an orange SOAP header, the coin
  // panel and the pick-up tray
  piece('lndvend', 'Laundromat detergent vending machine', 1, 1, 1050, 'gloss', [
    B(16, 1, -1, 28, 2, 22, LD.black, PL),
    B(16, 32, -5, 28, 60, 14, LD.mint, GL),
    B(26, 32, 6, 8, 60, 8, LD.mint, GL), B(3, 36, 6, 2, 34, 8, LD.mint, GL),
    B(13, 57.5, 6, 18, 9, 8, LD.mint, GL), B(13, 10.5, 6, 18, 17, 8, LD.mint, GL),
    B(16, 62.6, -1, 29, 1.4, 23, LD.chrome, MT),
    B(13, 57.4, 10.2, 16, 6, 0.4, LD.orange, GL), PC(13, 57.4, 10.45, 15, 5, word('SOAP', LD.white, LD.orange)),
    B(13, 36, 2.3, 18, 34, 0.4, LD.glowW, GW),
    ...[19.4, 31.5, 43].map(h => B(13, h, 5, 18, 0.8, 6, LD.chrome, MT)),
    ...[19.8, 31.9, 43.4].flatMap((h, row) => [7.5, 13, 18.5].map((x, i) => B(x, h + 3.8, 5, 4.6, 7, 4, [LD.orange, LD.lotad, LD.yellow, LD.pink, LD.lilac][(row * 3 + i) % 5], { ...PL, r: 0.4 }))),
    B(13, 36, 9.6, 18, 34, 0.4, '#cfe8f4', { m: 'glass' }),
    B(26, 40, 10.2, 5, 16, 0.4, LD.chrome, MT), B(26, 45, 10.5, 1, 3.4, 0.4, LD.black, PL),
    ...[[38.4, LD.red], [35, LD.led], [41.6, LD.orange]].map(([h, c]) => DS(26, h, 10.6, 1, 0.4, c, PL)),
    B(13, 10, 10.4, 14, 7, 1, LD.black, GL), B(13, 10.6, 11, 12, 4, 0.4, LD.chromeD, MT),
  ], { glow: [LD.glowW] }),

  // a change machine on a mint pedestal: chrome, a lit CHANGE window, a note slot lit green and a coin cup
  piece('lndchange', 'Laundromat change machine', 1, 1, 700, 'metal', [
    B(16, 1, -1, 20, 2, 16, LD.chromeD, PL),
    B(16, 13, -2, 10, 22, 10, LD.mint, GL),
    B(16, 40, -2, 22, 32, 16, LD.chrome, MT),
    B(16, 57, -2, 23, 2, 17, LD.orange, GL),
    B(16, 51, 6.2, 18, 5, 0.6, LD.black, PL), PC(16, 51, 6.55, 17, 4.2, word('CHANGE', LD.led, LD.black)),
    B(16, 44, 6.4, 12, 2.4, 1, LD.black, GL), B(16, 44, 7, 9, 0.6, 0.4, LD.led, GW),
    ...[10.6, 21.4].map(x => DS(x, 38, 6.4, 1.4, 0.6, LD.orange, GL)),
    B(16, 29.4, 6.8, 12, 5, 3, LD.chromeD, MT), B(16, 30.6, 7.6, 10, 3, 1.6, LD.black, PL),
  ], { glow: [LD.led] }),

  // an ironing board on chrome X legs: a mint cover, a steam iron in orange, a folded shirt at the end and its cord
  piece('lndironing', 'Laundromat ironing board', 2, 1, 480, 'metal', [
    ...[-5, 5].flatMap(z => [RD([14, 0.6, z], [44, 29, z], 0.7, LD.chrome, MT), RD([44, 0.6, z], [14, 29, z], 0.7, LD.chrome, MT)]),
    ...[14, 44].flatMap(x => [-5, 5].map(z => S(x, 0.8, z, 1, 0.8, 1, LD.black, PL))),
    B(32, 29.8, 0, 56, 1.4, 14, LD.chromeD, MT),
    B(32, 31.1, 0, 57, 1.4, 14.4, LD.mint, { ...CL, r: 0.7 }),
    B(22, 32.3, 0, 12, 1, 6, LD.chromeL, MT),
    PR(22, 32.7, 0, [[-6, 0], [6, 0], [6, 2.8], [-2, 3.4], [-6, 0.8]], 5.4, LD.orange, GL),
    RD([18.6, 36.4, 0], [25.6, 36.8, 0], 0.8, LD.black, GL), ...[[19, 35.4], [25.2, 35.6]].map(([x, h]) => RD([x, h - 0.6, 0], [x, h + 1, 0], 0.5, LD.black, GL)),
    RD([28, 34, 0], [40, 31.8, -6], 0.3, LD.blackL, PL), RD([40, 31.8, -6], [56, 22, -7], 0.3, LD.blackL, PL),
    towel(48, 31.8, 1, 13, 10, LD.sky), towel(48.4, 33.8, 1, 12, 9, LD.white),
  ]),

  // three orange moulded seats on a chrome beam, as in every waiting area
  piece('lndseats', 'Laundromat orange seat row', 2, 1, 640, 'gloss', [
    ...[8, 56].flatMap(x => [B(x, 0.6, 0, 4, 1.2, 18, LD.chromeD, MT), B(x, 7, 0, 2.4, 12, 2.4, LD.chrome, MT)]),
    B(32, 13.6, 0, 60, 2, 3, LD.chrome, MT),
    ...[11.5, 32, 52.5].flatMap(x => [
      B(x, 16, 1.5, 19, 2.6, 15, LD.orange, { ...GL, r: 1.2 }),
      B(x, 25, -6.6, 18, 13, 2, LD.orange, { ...GL, r: 1.6 }),
      RD([x, 14.6, -4], [x, 19, -6.6], 0.7, LD.chromeD, MT),
    ]),
  ]),

  // a single orange plastic chair on chrome legs
  piece('lndchair', 'Laundromat orange plastic chair', 1, 1, 260, 'gloss', [
    ...[8, 24].flatMap(x => [RD([x, 0, 7], [x, 15, 6], 0.7, LD.chrome, MT), RD([x, 0, -7], [x, 15, -6], 0.7, LD.chrome, MT), RD([x, 15, -6.6], [x, 22, -7.4], 0.7, LD.chrome, MT)]),
    B(16, 16, 0.6, 20, 2.4, 16, LD.orange, { ...GL, r: 1.2 }),
    B(16, 25, -7.4, 19, 12, 2, LD.orange, { ...GL, r: 1.6 }),
  ]),

  // a long white folding table on chrome legs: stacks of folded towels, a Gyarados beach towel hung over its front, a
  // mint basket on the shelf below
  piece('lndfold', 'Laundromat folding table', 2, 1, 900, 'gloss', [
    ...legs4([3, 61], [-11, 11], 2.4, 27.4),
    B(32, 7, 0, 58, 1.4, 22, LD.chromeD, MT),
    B(18, 11.6, 0, 22, 8, 18, LD.mint, { ...MESH, r: 1.2 }), B(18, 15.8, 0, 23, 1, 19, LD.mintD, GL),
    B(32, 28, 0, 64, 1.2, 28, LD.chrome, MT),
    B(32, 29.2, 0, 63.4, 1.4, 27.4, LD.white, GL),
    ...[LD.pink, LD.white, LD.sky].map((c, k) => towel(11, 29.9 + k * 2, -2, 14, 10, c)),
    ...[LD.lemon, LD.lilac].map((c, k) => towel(28, 29.9 + k * 2, -3, 13, 10, c)),
    B(49, 30.7, 6, 17, 1.6, 15, LD.gya, CL),
    B(49, 21.6, 14.4, 17, 17, 0.8, LD.gya, CL), PC(49, 21.6, 14.85, 16, 16, gyarados),
  ]),

  // a low magazine table: a mint top, magazines and a coffee cup on it, covers facing out from the rack below
  piece('lndmagtable', 'Laundromat magazine table', 1, 1, 380, 'metal', [
    ...legs4([4, 28], [-10, 10], 1.6, 14),
    B(16, 4, 0, 28, 1.2, 22, LD.chromeD, MT),
    B(16, 15, 0, 30, 2, 24, LD.mint, GL),
    B(12, 16.6, -1, 13, 1.2, 10, LD.white, PL), B(12.6, 17.6, 0, 12, 0.8, 9, LD.sky, PL),
    C(23.6, 18, 3, 1.9, 4, LD.orange, { m: 'gloss', seg: 10 }), RG(25.8, 18.2, 3, 1, 0.3, LD.orange, GL),
    ...[[9, LD.red, 'SPIN', LD.yellow], [22.6, LD.mintD, 'SUDS', LD.pink]].flatMap(([x, bg, t, art]) => [B(x, 9.2, 9.6, 11, 9, 0.6, bg, PL), PC(x, 9.2, 9.95, 11, 9, cover(t, bg, art))]),
    B(16, 5.2, 10.6, 28, 1.2, 1, LD.chrome, MT),
  ]),

  // the drop-off counter: mint with an orange DROP-OFF band, a service bell, claim tags, a tied laundry bag and a
  // bundle of pressed shirts banded for collection
  piece('lndcounter', 'Laundromat drop-off counter', 2, 1, 1100, 'gloss', [
    B(32, 1, 0, 60, 2, 22, LD.chromeD, PL),
    B(32, 17, 0, 62, 30, 24, LD.mint, GL),
    B(32, 22, 12.3, 46, 6, 0.6, LD.orange, GL), PC(32, 22, 12.65, 42, 5, word('DROP-OFF', LD.white, LD.orange)),
    B(32, 9, 12.3, 58, 1.2, 0.4, LD.chrome, MT),
    B(32, 32.4, 0, 64, 0.8, 26.4, LD.chrome, MT), B(32, 33.4, 0, 63.4, 1.4, 26, LD.white, GL),
    C(10, 34.5, 4, 3, 0.8, LD.black, { m: 'gloss', seg: 12 }),
    LA(10, 34.9, 4, [[2.8, 0], [2.6, 1], [1.8, 2.4], [0.6, 3], [0, 3.1]], LD.chromeL, { m: 'metal', seg: 12 }), S(10, 38.3, 4, 0.6, 0.6, 0.6, LD.chromeL, MT),
    LA(28, 34.1, -4, [[3, 0], [5.4, 0.6], [6.2, 3.4], [5.6, 7], [3, 9.2], [1.2, 10], [1.6, 11.2], [0, 11.8]], LD.canvas, { m: 'cloth', seg: 12 }),
    RG(28, 44.4, -4, 1.2, 0.4, LD.orange, PL),
    B(43, 34.8, 6, 6, 1.4, 4, LD.orange, PL), RD([46.8, 34.2, 6], [48.6, 34.4, 3], 0.3, LD.black, PL),
    B(54, 36.2, -2, 14, 4, 10, LD.white, { ...CL, r: 0.6 }), B(54, 36.2, -2, 3, 4.4, 10.4, LD.mint, PL),
    B(54, 39.4, -2, 13, 2.4, 9, LD.sky, { ...CL, r: 0.6 }),
  ]),

  // a rolling laundry cart: a chrome frame on castors, a canvas bag of laundry in it, a shirt on the rail above
  piece('lndcart', 'Laundromat rolling laundry cart', 1, 1, 560, 'metal', [
    ...[5, 27].flatMap(x => [-9, 9].flatMap(z => [DS(x, 1.6, z, 1.6, 1, LD.black, { m: 'gloss', ax: 'x', seg: 10 }), RD([x, 1.6, z], [x, 3.6, z], 0.4, LD.chromeD, MT)])),
    ...[-9, 9].map(z => RD([5, 3.8, z], [27, 3.8, z], 0.6, LD.chrome, MT)), ...[5, 27].map(x => RD([x, 3.8, -9], [x, 3.8, 9], 0.6, LD.chrome, MT)),
    ...[5, 27].flatMap(x => [-9, 9].map(z => RD([x, 3.8, z], [x, 26, z], 0.7, LD.chrome, MT))),
    ...[-9, 9].map(z => RD([5, 26, z], [27, 26, z], 0.6, LD.chrome, MT)), ...[5, 27].map(x => RD([x, 26, -9], [x, 26, 9], 0.6, LD.chrome, MT)),
    B(16, 16.6, 0, 21, 17, 17, LD.canvas, { ...CL, r: 2 }), B(16, 25.4, 0, 22.4, 1.6, 18.6, LD.canvasD, { ...CL, r: 0.8 }),
    S(12, 26.4, 2, 5, 2.4, 4, LD.pink, CL), S(20, 26.8, -2, 5, 2.6, 4, LD.sky, CL),
    ...[5, 27].map(x => RD([x, 26, -9], [x, 46, -9], 0.7, LD.chrome, MT)), RD([5, 46, -9], [27, 46, -9], 0.7, LD.chrome, MT),
    ...hung(16, 46, -9, LD.lemon),
  ]),

  // a stack of three plastic laundry baskets, mint, orange and white, their handholds cut, towels in the top one
  piece('lndbaskets', 'Laundromat laundry baskets', 1, 1, 340, 'gloss', [
    ...[[16, 0, LD.mint], [16.6, 11, LD.orange], [15.6, 22, LD.white]].flatMap(([x, h, c]) => [
      B(x, h + 5, 0, 26, 10, 22, c, { ...MESH, r: 1.4 }), B(x, h + 10.4, 0, 27, 1.2, 23, sh(c, -1), GL),
      ...[-7, 7].map(d => B(x + d, h + 8, 11.1, 5, 1.6, 0.4, LD.black, { ...PL, r: 0.6 })),
    ]),
    S(12, 33.2, 0, 6, 2.4, 6, LD.pink, CL), S(20, 33.6, 1, 6, 2.6, 6, LD.sky, CL),
  ]),

  // a chrome wire shelf of washday supplies: big jugs of detergent, boxes of Lotad soap, softener bottles, folded towels
  piece('lndsoap', 'Laundromat soap shelf', 1, 1, 560, 'metal', [
    ...[2.4, 29.6].flatMap(x => [-8, 8].map(z => RD([x, 0, z], [x, 49, z], 0.7, LD.chrome, MT))),
    ...[2, 18, 33, 48].map(h => B(16, h, 0, 30, 1, 18, LD.chrome, { m: 'metal', tex: 'mesh', r: 0.3 })),
    ...[[9, LD.orange, 'SUDS', LD.lotad], [22, LD.sky, 'FRESH', LD.mint]].flatMap(([x, c, name, sw]) => [
      B(x, 8.6, 0, 9, 12, 8, c, { ...GL, r: 2 }), C(x + 2.4, 15.6, 0, 1.6, 2.4, LD.white, { m: 'gloss', seg: 10 }),
      RG(x - 2.6, 13, 0, 1.6, 0.5, c, GL), PC(x, 8, 4.05, 7, 6, jugLabel(name, sw)),
    ]),
    ...[7, 16, 25].flatMap(x => [B(x, 22.6, 2, 7, 8, 6, LD.white, PL), PC(x, 22.6, 5.05, 7, 8, lotad)]),
    ...[[8, LD.pink], [14, LD.lilac], [20, LD.pink]].map(([x, c]) => LA(x, 33.5, 0, [[2.4, 0], [2.6, 0.4], [2.6, 7], [1.6, 8.4], [1.2, 8.6], [1.2, 9.6], [1.4, 10]], c, { m: 'gloss', seg: 10 })),
    B(25.6, 37, 0, 7, 7, 6, LD.mintL, PL),
    ...[LD.white, LD.sky, LD.lemon].map((c, k) => towel(16, 48.5 + k * 2, 0, 18, 11, c)),
  ]),

  // LAUNDRY in orange neon tubes on a black board edged mint, a row of mint bubbles under it
  wallPiece('lndneon', 'Laundromat LAUNDRY neon', 2, 920, 'gloss', [
    B(32, 62, 0.3, 62, 26, 0.6, LD.mint, GL),
    B(32, 62, 0.9, 59, 23, 1, LD.black, GL),
    ...letters('LAUNDRY', [8, 16, 24, 32, 40, 48, 56], 60, 2, 0.7, 0.65, LD.orangeL, GW),
    ...[[12, 54.6, 1.6], [20, 53.8, 1], [27, 55, 1.4], [37, 54, 1.2], [44, 55, 1.7], [52, 53.8, 1]].map(([x, h, r]) => RG(x, h, 2, r, 0.4, LD.led, GW)),
  ], { glow: [LD.orangeL, LD.led] }),

  // a round wall clock in a chrome rim: orange hands and mint marks on its white dial, an OPEN 24H tag hung below
  wallPiece('lndclock', 'Laundromat wall clock', 1, 420, 'gloss', [
    DS(16, 64, 0.8, 12, 1.6, LD.mint, GL),
    PC(16, 64, 1.75, 17, 17, dial),
    RG(16, 64, 1.7, 11, 0.8, LD.chrome, MT),
    RD([12, 52, 1], [13, 49.2, 1], 0.25, LD.chromeD, PL), RD([20, 52, 1], [19, 49.2, 1], 0.25, LD.chromeD, PL),
    B(16, 47, 1, 14, 4.4, 0.6, LD.orange, GL), PC(16, 47, 1.35, 13, 3.8, word('OPEN 24H', LD.white, LD.orange)),
  ]),

  // the lost-sock board: a mint-framed cork board with odd socks pinned all over it and a FOUND! notice
  wallPiece('lndsocks', 'Laundromat lost-sock board', 2, 360, 'plain', [
    B(32, 62, 0.3, 62, 30, 0.6, LD.mint, GL),
    B(32, 61, 0.8, 58, 24, 0.6, LD.cork, PL),
    PC(32, 74.4, 1.15, 36, 3.6, word('LOST SOCKS', LD.white, LD.mint)),
    ...[[8, 57, LD.pink, 0], [17, 62, LD.sky, 1], [27, 52, LD.lemon, 0], [37, 61, LD.white, 0], [58, 53, LD.lilac, 1]].flatMap(([x, h, c, f]) => [
      PR(x, h, 1.4, f ? flip(SOCK) : SOCK, 0.6, c, CL), DS(x, h + 8.4, 1.9, 0.7, 0.4, LD.red, GL)]),
    B(48, 60, 1.3, 12, 14, 0.3, LD.paper, PL), PC(48, 60, 1.5, 12, 14, notice), DS(48, 66.4, 1.7, 0.7, 0.4, LD.sky, GL),
  ]),

  // the laundromat's floor mat: mint and white tiles in an orange border, a washer's porthole in the middle
  { id: 'lndmat', name: 'Laundromat tiled floor mat', group: GROUP, solo: true, w: 3, h: 2, layer: 'rug', price: 480, high: 0.03, side: 'c', flat() {
    const g = ctx(), path = () => { g.beginPath(); RUG.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
    g.fillStyle = LD.orange; path(); g.fill();
    for (let ty = 0; ty < 6; ty++) for (let tx = 0; tx < 10; tx++) {
      g.fillStyle = (tx + ty) % 2 ? LD.mint : LD.white;
      g.fillRect(8 + tx * 8, 8 + ty * 8, 8, 8);
      g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(8 + tx * 8, 8 + ty * 8 + 7.6, 8, 0.4); g.fillRect(8 + tx * 8 + 7.6, 8 + ty * 8, 0.4, 8);
    }
    g.strokeStyle = LD.orangeD; g.lineWidth = 0.8; g.strokeRect(7.6, 7.6, 80.8, 48.8);
    const cx = 48, cy = 32;
    g.fillStyle = LD.enamel; g.beginPath(); g.arc(cx, cy, 14, 0, TAU); g.fill();
    g.strokeStyle = LD.chrome; g.lineWidth = 2.4; g.beginPath(); g.arc(cx, cy, 11, 0, TAU); g.stroke();
    g.fillStyle = LD.water; g.beginPath(); g.arc(cx, cy, 9.6, 0, TAU); g.fill();
    g.fillStyle = sh(LD.water, -1); g.beginPath(); g.arc(cx, cy, 9.6, 0.1 * Math.PI, 0.9 * Math.PI); g.fill();
    g.strokeStyle = LD.white; g.lineWidth = 0.6;
    for (const [bx, by, r] of [[-4, -3, 2], [2, -5, 1.4], [4, 1, 2.4], [-2, 3, 1.2]]) { g.beginPath(); g.arc(cx + bx, cy + by, r, 0, TAU); g.stroke(); }
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.4; g.fillStyle = LD.white; g.beginPath(); g.arc(cx + Math.cos(a) * 22 * (1 + hash(i, 3) * 0.2), cy + Math.sin(a) * 15, 1.2 + hash(i, 7), 0, TAU); g.fill(); }
    g.strokeStyle = sh(LD.orangeD, -1); g.lineWidth = 1; path(); g.stroke();
  } },

  // a chrome clothes rail on castors: pressed shirts and a dress on wire hangers
  piece('lndrail', 'Laundromat clothes rail', 2, 1, 640, 'metal', [
    ...[4, 60].flatMap(x => [B(x, 2.4, 0, 3, 1.2, 20, LD.chromeD, MT), ...[-8.6, 8.6].map(z => DS(x, 1.2, z, 1.2, 1, LD.black, { m: 'gloss', ax: 'x', seg: 8 })), RD([x, 3, 0], [x, 52, 0], 0.9, LD.chrome, MT)]),
    RD([4, 52, 0], [60, 52, 0], 0.8, LD.chrome, MT),
    ...hung(14, 52, -1.2, LD.sky), ...hung(25, 52, 0.2, LD.white), ...hung(39, 52, -0.4, LD.pink, DRESS), ...hung(50, 52, 1, LD.mint),
  ]),

  // a folding drying rack: chrome A-frames, towels hung over its top rail and socks pegged on the lower ones
  piece('lndrack', 'Laundromat drying rack', 1, 1, 320, 'metal', [
    ...[3, 29].flatMap(x => [RD([x, 0.6, -8.8], [x, 32, 0], 0.6, LD.chrome, MT), RD([x, 0.6, 8.8], [x, 32, 0], 0.6, LD.chrome, MT)]),
    RD([3, 32, 0], [29, 32, 0], 0.5, LD.chrome, MT),
    ...[-1, 1].map(s => RD([3, 21, s * 3.4], [29, 21, s * 3.4], 0.45, LD.chrome, MT)),
    ...[-1, 1].map(s => RD([3, 10, s * 6.2], [29, 10, s * 6.2], 0.45, LD.chrome, MT)),
    ...[-1, 1].map(s => B(10, 26, s * 1.1, 11, 12, 0.8, LD.pink, { ...TERRY, r: 0.4 })), RD([4.6, 32.4, 0], [15.4, 32.4, 0], 0.9, LD.pink, CL),
    B(22.4, 25, 1.1, 10, 14, 0.8, LD.white, { ...TERRY, r: 0.4 }), RD([17.4, 32.4, 0], [27.4, 32.4, 0], 0.9, LD.white, CL),
    B(12, 15.6, 3.9, 10, 10, 0.6, LD.sky, { ...TERRY, r: 0.4 }),
    ...[[20, LD.lemon, 0], [25, LD.lilac, 1]].map(([x, c, f]) => PR(x, 12.4, 4, f ? flip(SOCK) : SOCK, 0.6, c, CL)),
    ...[[8, LD.orange, 1], [22, LD.mint, 0]].map(([x, c, f]) => PR(x, 1.6, 6.8, f ? flip(SOCK) : SOCK, 0.6, c, CL)),
  ]),

  // a gumball machine: a glass globe heaped with gumballs on a mint body and a chrome stand, an orange cap
  piece('lndgumball', 'Laundromat gumball machine', 1, 1, 300, 'gloss', [
    C(16, 1, 0, 7, 2, LD.chromeD, { m: 'metal', seg: 16 }),
    C(16, 10, 0, 1.6, 16, LD.chrome, { m: 'metal', seg: 10 }),
    LA(16, 18, 0, [[4, 0], [5.4, 1.2], [5.8, 6], [5.2, 8.4], [4.6, 9]], LD.mint, { m: 'gloss', seg: 16 }),
    DS(16, 23, 5.6, 2.2, 0.8, LD.chromeL, MT), B(16, 23, 6.3, 3.6, 0.9, 0.8, LD.chromeD, MT),
    B(16, 19.6, 5, 3, 2.2, 2.6, LD.chromeD, MT),
    ...GUMS,
    S(16, 33.6, 0, 6.8, 6.8, 6.8, '#dff0f8', { m: 'glass', k: 20, seg: 14 }),
    LA(16, 39.4, 0, [[3.6, 0], [3.8, 1], [2.6, 2.4], [0, 2.7]], LD.orange, { m: 'gloss', seg: 14 }), S(16, 42.4, 0, 0.9, 0.9, 0.9, LD.orange, GL),
  ]),

  // a yellow A-frame OUT OF ORDER sign, for the machine that ate your coins
  piece('lndsign', 'Laundromat out-of-order sign', 1, 1, 180, 'gloss', [
    ...[-1, 1].map(s => B(16, 15.2, s * 3.6, 20, 30.6, 1.2, LD.yellow, { ...GL, r: 0.5, rx: s * LEAN })),
    PC(16, 15.2 + FACE.up, 3.6 + FACE.out + 0.05, 18, 26, outOfOrder, { rx: LEAN }),
    RD([7, 29.8, 0], [25, 29.8, 0], 0.7, LD.black, GL),
    ...[7.4, 24.6].map(x => RD([x, 10, -4.4], [x, 10, 4.4], 0.3, LD.chromeD, MT)),
  ]),

  // Wooloo, puffed up fresh from the dryer, sat in a mint laundry basket with a stray sock caught in its wool
  piece('lndwooloo', 'Laundromat Wooloo fresh from the dryer', 1, 1, 760, 'cloth', [
    B(16, 6, 1, 28, 12, 22, LD.mint, { ...MESH, r: 1.4 }), B(16, 12.4, 1, 29, 1.4, 23, LD.mintD, GL),
    ...[-8, 8].map(d => B(16 + d, 9.4, 12.1, 5, 1.6, 0.4, LD.black, { ...PL, r: 0.6 })),
    S(16, 20, -1, 11, 9, 9, LD.wool, { m: 'cloth', seg: 16 }),
    ...[[6.4, 19, 1, 4.4], [25.6, 19, 1, 4.4], [9, 26, -1, 5], [23, 26, -1, 5], [16, 29, -2, 5.4], [11, 14.4, 4, 4], [21, 14.4, 4, 4]].map(([x, h, z, r]) => S(x, h, z, r, r * 0.9, r, LD.wool, { m: 'cloth', seg: 10 })),
    S(16, 18.6, 6, 5.2, 4.4, 2.6, LD.woolFace, { m: 'cloth', seg: 12 }),
    ...[-1, 1].flatMap(sg => [DS(16 + sg * 2, 19.4, 8.5, 1.1, 0.3, '#ffffff', PL), DS(16 + sg * 2, 19.2, 8.7, 0.5, 0.3, LD.black, PL), S(16 + sg * 5.6, 21, 5, 1.2, 1.6, 1.2, LD.woolD, { m: 'cloth', seg: 8 })]),
    S(16, 23.2, 5, 6, 2.6, 3, LD.wool, { m: 'cloth', seg: 10 }),
    PR(22, 25, 3.4, SOCK, 0.6, LD.pink, CL),
  ]),
];
