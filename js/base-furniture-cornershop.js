/* base-furniture-cornershop.js  -  the Corner shop set (furniture expansion session j, 2026-10-17): a whole room of a
   neighbourhood Poké Mart, as Animal Crossing's Happy Home Paradise does a room type. The Mart's blue and white with a
   red stripe, steel and glass: gondola shelves stocked with Potions, Antidotes, Poké Balls and Repels under painted price
   strips, an end-cap SALE display, a glass-door drinks fridge row (Fresh Water, Soda Pop, Lemonade, Moomoo Milk), an ice
   cream freezer, the checkout and its conveyor, a hot-snack warmer, a coffee machine, a PC cash point, a lottery stand,
   baskets, a cart, a magazine rack, a price-list stand, a lit POKé MART sign, an OPEN neon and a security mirror. A
   Pikachu plush in the crane box, Kecleon minding the shop in a Mart apron, Munchlax at the snacks and Vanillite on the
   freezer's sign for the Pokémon touches. All solo, fixed colours, sold all year.
   An upright piece is a list of parts in painted units (32 a tile), as in js/base-furniture-ramen.js: `x` across from
   the left of its front, `h` up from the floor (a wall piece's from the foot of its strip), `z` out to the front from
   its middle (a wall piece's from the wall). They're painted here from any side, and js/base-models-cornershop.js builds
   the same list as 3D parts (BUILT), so picture and model agree. `tex` is painted only (the model stays plain colour):
   `mesh` a wire basket's weave, `grain` a board's streaks. A disc with `ax: 'x'` stands side-on (the cart's castors).
   A `pic` part (the price strips, labels, covers, signs' words) is painted on the front only, and the model wears that
   crop of the painting. The drinks fridge's two glass doors swing (`doors`, `inside`). The entrance mat is painted from
   above (RUG). */

import { sh, oval, ovalShade, floorShadow, ctx, hash, glass as glassPane } from './base-paint.js';

export const CS = {
  blue: '#2f6fd0', blueD: '#1f4c96', blueL: '#6fa0e8', sky: '#bcd6f4', white: '#f6f8fa', whiteD: '#d8dee6',
  red: '#d8343a', redD: '#9c2026', redL: '#f06a6a', yellow: '#f6cc3a', yellowD: '#c89a1c', black: '#22252a', blackL: '#40444c',
  grey: '#8a929c', greyL: '#c4cad2', greyD: '#5a626c', steel: '#a8afb3', steelL: '#cdd3d6', steelD: '#727a7e',
  card: '#c89a5a', cardD: '#9a7038', glass: '#cfe8f4',
  potion: '#a050d8', superp: '#f0a22a', hyper: '#e8508a', antidote: '#58b84a', repel: '#e8c838', repelD: '#7a56c8',
  water: '#9ad2f2', soda: '#3cb88a', lemon: '#f4dc4a', milk: '#f6f4ee', bun: '#e6b26a', bunD: '#b07a3a', sausage: '#b8503a',
  coffee: '#5a3622', cone: '#d8a058', vanil: '#eef6fc', vanilD: '#a8d0ec',
  pika: '#f6d030', pikaD: '#c89a18', cheek: '#e8443a',
  kec: '#7cc858', kecD: '#4c9038', kecB: '#f2e08a', kecR: '#d8403c',
  lax: '#3a6a80', laxD: '#244656', laxC: '#f0e0b8',
  glowW: '#f4f8ff', glowY: '#ffd27a', glowB: '#7ad0ff', glowG: '#9cf0a0', neonR: '#ff3c4c', neonB: '#4cc8ff',
};
const GROUP = 'Corner shop';
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

const CL = { m: 'cloth' }, PL = { m: 'plain' }, GL = { m: 'gloss' }, MT = { m: 'metal' }, GW = { m: 'glow' }, GS = { m: 'glass' };

/** Neon or bent-rod letters (8 wide, 12 tall at s 1) as strokes about a middle x, standing on h. */
const GLYPH = {
  M: [[-4, 0, -4, 12], [-4, 12, 0, 5], [0, 5, 4, 12], [4, 12, 4, 0]],
  A: [[-4, 0, 0, 12], [0, 12, 4, 0], [-2.4, 4.6, 2.4, 4.6]],
  R: [[-4, 0, -4, 12], [-4, 12, 2, 12], [2, 12, 4, 10], [4, 10, 4, 8], [4, 8, 2, 6], [2, 6, -4, 6], [-1, 6, 4, 0]],
  T: [[-4, 12, 4, 12], [0, 12, 0, 0]],
  O: [[-2, 0, 2, 0], [2, 0, 4, 2.5], [4, 2.5, 4, 9.5], [4, 9.5, 2, 12], [2, 12, -2, 12], [-2, 12, -4, 9.5], [-4, 9.5, -4, 2.5], [-4, 2.5, -2, 0]],
  P: [[-4, 0, -4, 12], [-4, 12, 2, 12], [2, 12, 4, 10], [4, 10, 4, 8], [4, 8, 2, 6], [2, 6, -4, 6]],
  E: [[-4, 0, -4, 12], [-4, 12, 4, 12], [-4, 6, 2.5, 6], [-4, 0, 4, 0]],
  N: [[-4, 0, -4, 12], [-4, 12, 4, 0], [4, 0, 4, 12]],
};
const letters = (word, xs, h, z, s, r, c, o) => [...word].flatMap((ch, i) => GLYPH[ch].map(([ax, ah, bx, bh]) => RD([xs[i] + ax * s, h + ah * s, z], [xs[i] + bx * s, h + bh * s, z], r, c, o)));

/** A Potion's spray bottle (c its colour) standing at x, h, z: a round-shouldered body, a white collar and trigger head. */
const spray = (x, h, z, c, k = 1) => [
  LA(x, h, z, [[1.7 * k, 0], [1.9 * k, 0.4], [1.9 * k, 4.4 * k], [1.2 * k, 5.6 * k], [0.8 * k, 6 * k]], c, { m: 'gloss', seg: 8 }),
  B(x, h + 6.8 * k, z, 1.8 * k, 1.8 * k, 1.8 * k, CS.white, { m: 'plain', r: 0 }),
];
/** A Poké Ball r round sitting at x, h, z: white below, `top` above, a white button at its front. */
const pball = (x, h, z, r, top = CS.red) => [
  S(x, h + r, z, r, r, r, CS.white, { m: 'gloss', seg: 8 }),
  LA(x, h + r * 1.04, z, [[r * 1.02, 0], [r * 0.9, r * 0.46], [r * 0.6, r * 0.82], [0, r * 1.02]], top, { m: 'gloss', seg: 8 }),
  DS(x, h + r, z + r * 0.95, r * 0.32, r * 0.2, CS.white, { m: 'plain', seg: 6 }),
];
/** A drink bottle at x, h, z: body c, cap cap; `milk` for Moomoo Milk's squat glass bottle. */
const drink = (x, h, z, c, cap, milk) => milk
  ? [LA(x, h, z, [[2.1, 0], [2.1, 5], [1.3, 6.6], [1.2, 7.6]], c, { m: 'gloss', seg: 6 }), C(x, h + 8, z, 1.3, 0.8, cap, { m: 'plain', seg: 6 })]
  : [LA(x, h, z, [[2, 0], [2, 6.4], [1.2, 8], [0.8, 8.8], [0.8, 9.6]], c, { m: 'gloss', seg: 6 }), C(x, h + 10, z, 0.9, 0.9, cap, { m: 'plain', seg: 6 })];
/** A snack bag (a puffed pillow) at x, h, z. */
const bag = (x, h, z, c, w = 5, hh = 7) => B(x, h + hh / 2, z, w, hh, 2.4, c, { m: 'gloss', r: 1 });

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
  if (m === 'glass') { g.save(); g.globalAlpha *= 0.4; glassPane(x, y, w, h, CS.glass); g.restore(); return; }
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
    g.fillStyle = m === 'glass' ? CS.glass : l;
  } else g.fillStyle = m === 'glass' ? CS.glass : grad(g, x0, y0, x1, y1, c, m);
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
  const g = ctx(), [x0, y0, x1, y1] = bb, c = q.c, seed = Math.round(q.x * 7 + q.h * 13 + q.z * 3);
  g.save(); g.clip(path);
  if (q.tex === 'mesh') {
    g.globalAlpha = 0.7; g.strokeStyle = sh(c, -2); g.lineWidth = 0.3; g.beginPath();
    for (let x = x0 + 1; x < x1; x += 1.6) { g.moveTo(x, y0); g.lineTo(x, y1); }
    for (let y = y0 + 1; y < y1; y += 1.6) { g.moveTo(x0, y); g.lineTo(x1, y); }
    g.stroke();
  } else if (q.tex === 'grain') {
    g.lineWidth = 0.3;
    for (let y = y0 + 0.7, i = 0; y < y1; y += 0.9, i++) {
      const a = x0 + hash(i, seed, 1) * (x1 - x0) * 0.5, l = (x1 - x0) * (0.3 + hash(i, seed, 2) * 0.6);
      g.globalAlpha = 0.35; g.strokeStyle = hash(i, seed, 3) < 0.5 ? sh(c, -2) : sh(c, 1);
      g.beginPath(); g.moveTo(a, y); g.bezierCurveTo(a + l * 0.3, y + 0.3, a + l * 0.6, y - 0.3, a + l, y); g.stroke();
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
    const m = q.m || 'gloss', cx = U(q.x, q.z), cy = b - q.h;
    switch (q.t) {
      case 'box': {
        const w = side ? q.d : q.w; rbx(cx - w / 2, cy - q.hh / 2, w, q.hh, q.r, q.c, m);
        if (q.tex) { const p = new Path2D(); p.roundRect(cx - w / 2, cy - q.hh / 2, w, q.hh, Math.min(q.r, w / 2, q.hh / 2)); texture(q, p, [cx - w / 2, cy - q.hh / 2, cx + w / 2, cy + q.hh / 2]); }
        break;
      }
      case 'cyl': {
        const rb = q.rb ?? q.r, top = cy - q.hh / 2, bot = cy + q.hh / 2, pts = [[cx - q.r, top], [cx + q.r, top], [cx + rb, bot], [cx - rb, bot]];
        poly(pts, q.c, m, m !== 'glow');
        if (m !== 'glass') oval(cx, top, q.r, Math.min(q.r * 0.22, Math.max(0.3, q.hh / 2)), sh(q.c, m === 'glow' ? 2 : 1));
        break;
      }
      case 'ball': { const rx = side ? q.rz : q.rx; ball(cx, cy, rx, q.ry, q.c, m); break; }
      case 'disc': {
        const edge = q.ax === 'x' ? !side : side;
        if (edge) rbx(cx - q.th / 2, cy - (q.ry ?? q.r), q.th, (q.ry ?? q.r) * 2, q.th / 2, q.c, m); else ball(cx, cy, q.r, q.ry ?? q.r, q.c, m);
        break;
      }
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
        g.lineCap = 'round'; g.strokeStyle = m === 'glass' ? alphaOf(CS.glass, 0.4) : q.c; g.lineWidth = q.r * 2;
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
/** A shelf's price strip: one red-edged white tag per item, its name and price. */
const strip = (items) => (g, x, y, w, h) => {
  g.fillStyle = CS.red; g.fillRect(x, y, w, h);
  const n = items.length, cw = w / n;
  items.forEach(([name, price], i) => {
    const cx = x + cw * i;
    g.fillStyle = CS.white; g.fillRect(cx + 0.6, y + 0.25, cw - 1.2, h - 0.5);
    g.textBaseline = 'middle'; g.font = `bold ${h * 0.62}px ${SANS}`;
    g.fillStyle = CS.blueD; g.textAlign = 'left'; g.fillText(name, cx + 1.2, y + h * 0.54, cw * 0.62);
    g.fillStyle = CS.red; g.textAlign = 'right'; g.fillText(price, cx + cw - 1.2, y + h * 0.54, cw * 0.3);
  });
};
/** A Poké Ball emblem r round about cx, cy. */
function emblem(g, cx, cy, r, top = CS.red) {
  g.fillStyle = CS.white; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill();
  g.fillStyle = top; g.beginPath(); g.arc(cx, cy, r, Math.PI, TAU); g.fill();
  g.fillStyle = CS.black; g.fillRect(cx - r, cy - r * 0.12, r * 2, r * 0.24);
  g.beginPath(); g.arc(cx, cy, r * 0.36, 0, TAU); g.fill();
  g.fillStyle = CS.white; g.beginPath(); g.arc(cx, cy, r * 0.22, 0, TAU); g.fill();
}
/** The Mart's own mark: a white panel, a red stripe, POKé MART in blue by a Poké Ball. */
function martMark(g, x, y, w, h) {
  g.fillStyle = CS.white; g.fillRect(x, y, w, h);
  g.fillStyle = CS.red; g.fillRect(x, y + h * 0.78, w, h * 0.12);
  emblem(g, x + h * 0.42, y + h * 0.42, h * 0.32);
  g.fillStyle = CS.blue; g.textAlign = 'left'; g.textBaseline = 'middle';
  g.font = `bold ${h * 0.5}px ${SANS}`; g.fillText('POKé MART', x + h * 0.86, y + h * 0.44, w - h);
}
/** A magazine's cover: a coloured ground, a masthead and a Poké Ball or bolt for its picture. */
const cover = (title, bg, ink, mark) => (g, x, y, w, h) => {
  g.fillStyle = bg; g.fillRect(x, y, w, h);
  g.fillStyle = ink; g.fillRect(x, y, w, h * 0.22);
  word(title, bg, null, 0.7)(g, x, y, w, h * 0.22);
  if (mark === 'ball') emblem(g, x + w / 2, y + h * 0.6, w * 0.3);
  else if (mark === 'bolt') { g.fillStyle = CS.yellow; g.beginPath(); [[0.55, 0.3], [0.3, 0.62], [0.48, 0.62], [0.4, 0.9], [0.72, 0.52], [0.54, 0.52], [0.64, 0.3]].forEach(([fx, fy], i) => (i ? g.lineTo(x + w * fx, y + h * fy) : g.moveTo(x + w * fx, y + h * fy))); g.fill(); } else { g.fillStyle = ink; for (let i = 0; i < 4; i++) g.fillRect(x + w * 0.12, y + h * (0.34 + i * 0.15), w * (i % 2 ? 0.5 : 0.76), h * 0.06); }
};
/** The lottery stand's board: rows of bright scratch cards, each with a star to scratch. */
function tickets(g, x, y, w, h) {
  g.fillStyle = CS.white; g.fillRect(x, y, w, h);
  const cols = [CS.red, CS.blue, CS.yellow, CS.soda, CS.potion, CS.superp], cw = w / 4, ch = h / 2;
  for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) {
    const cx = x + c * cw, cy = y + r * ch, col = cols[(r * 4 + c) % cols.length];
    g.fillStyle = col; g.fillRect(cx + 0.5, cy + 0.5, cw - 1, ch - 1);
    g.fillStyle = CS.greyL; g.fillRect(cx + 1.2, cy + ch * 0.45, cw - 2.4, ch * 0.32);
    g.fillStyle = CS.white; g.beginPath();
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU - Math.PI / 2, rr = i % 2 ? 0.8 : 1.8; g.lineTo(cx + cw / 2 + Math.cos(a) * rr, cy + ch * 0.25 + Math.sin(a) * rr); }
    g.fill();
  }
}
/** The price-list stand's board: TODAY'S PRICES over the Mart's staples, a red SALE tag. */
function priceList(g, x, y, w, h) {
  g.fillStyle = CS.white; g.fillRect(x, y, w, h);
  g.fillStyle = CS.blue; g.fillRect(x, y, w, h * 0.16);
  word("TODAY'S PRICES", CS.white, null, 0.66)(g, x, y, w, h * 0.16);
  const rows = [['POTION', '300'], ['ANTIDOTE', '100'], ['POKé BALL', '200'], ['GREAT BALL', '600'], ['REPEL', '350'], ['SODA POP', '300'], ['LEMONADE', '350']];
  g.font = `bold ${h * 0.075}px ${SANS}`; g.textBaseline = 'middle';
  rows.forEach(([name, price], i) => {
    const ry = y + h * (0.24 + i * 0.105);
    g.fillStyle = CS.blueD; g.textAlign = 'left'; g.fillText(name, x + w * 0.08, ry, w * 0.6);
    g.fillStyle = CS.red; g.textAlign = 'right'; g.fillText(price, x + w * 0.92, ry, w * 0.25);
    g.fillStyle = CS.whiteD; g.fillRect(x + w * 0.08, ry + h * 0.045, w * 0.84, 0.25);
  });
}
/** The freezer's sign: a pale blue ground, Vanillite smiling out of its cone, ICE CREAM beneath. */
function vanillite(g, x, y, w, h) {
  g.fillStyle = CS.sky; g.fillRect(x, y, w, h);
  g.fillStyle = CS.blue; g.fillRect(x, y + h * 0.74, w, h * 0.26);
  word('ICE CREAM', CS.white, null, 0.7)(g, x, y + h * 0.74, w, h * 0.26);
  const cx = x + w * 0.5, s = h * 0.7, top = y + h * 0.04;
  g.fillStyle = CS.vanilD; g.beginPath(); g.ellipse(cx, top + s * 0.62, s * 0.34, s * 0.16, 0, 0, TAU); g.fill();
  g.fillStyle = CS.vanil;
  g.beginPath(); g.ellipse(cx, top + s * 0.52, s * 0.32, s * 0.24, 0, 0, TAU); g.fill();
  g.beginPath(); g.ellipse(cx, top + s * 0.28, s * 0.2, s * 0.16, 0, 0, TAU); g.fill();
  g.beginPath(); g.moveTo(cx - s * 0.08, top + s * 0.16); g.quadraticCurveTo(cx + s * 0.06, top, cx + s * 0.14, top + s * 0.04); g.lineTo(cx + s * 0.08, top + s * 0.18); g.fill();
  g.fillStyle = CS.black;
  for (const sg of [-1, 1]) { g.beginPath(); g.ellipse(cx + sg * s * 0.1, top + s * 0.5, s * 0.035, s * 0.05, 0, 0, TAU); g.fill(); }
  g.strokeStyle = CS.black; g.lineWidth = s * 0.025; g.beginPath(); g.arc(cx, top + s * 0.58, s * 0.06, 0.2, Math.PI - 0.2); g.stroke();
  g.fillStyle = '#f6a0b0'; for (const sg of [-1, 1]) { g.beginPath(); g.ellipse(cx + sg * s * 0.2, top + s * 0.57, s * 0.04, s * 0.025, 0, 0, TAU); g.fill(); }
}
/** The crane box's marquee: CATCH! in yellow on red, a little bolt either side. */
function marquee(g, x, y, w, h) {
  word('CATCH!', CS.yellow, CS.red, 0.8)(g, x, y, w, h);
  g.fillStyle = CS.white; for (const fx of [0.08, 0.92]) { g.beginPath(); g.arc(x + w * fx, y + h / 2, h * 0.16, 0, TAU); g.fill(); }
}
/** The cash point's screen: the PC's blue, a Poké Ball and WELCOME. */
function atmScreen(g, x, y, w, h) {
  g.fillStyle = CS.blueD; g.fillRect(x, y, w, h);
  g.fillStyle = CS.glowB; g.fillRect(x + 0.5, y + 0.5, w - 1, h - 1);
  emblem(g, x + w / 2, y + h * 0.4, h * 0.22);
  word('WELCOME', CS.blueD, null, 0.7)(g, x, y + h * 0.7, w, h * 0.22);
}

/* ---------- the kinds ---------- */

/** What js/base-models-cornershop.js builds for each upright and wall kind: its parts, doors and default material. */
export const BUILT = {};
/** The entrance mat's outline from above, in painted units across its 2 x 1 tiles, corners cut. */
export const RUG = [[3, 2], [61, 2], [62, 3], [62, 29], [61, 30], [3, 30], [2, 29], [2, 3]];

function piece(id, name, w, h, price, mat, parts, { doors = [], inside, ...rest } = {}) {
  BUILT[id] = { parts, doors, inside, mat };
  const all = [...parts, ...doors.flatMap(d => d.parts)];
  return { id, name, group: GROUP, solo: true, w, h, price, ...rest, draw(x, b, vw, dir) { floorShadow(x, b, vw); paintParts(all, x, b, vw, dir, w * 32); } };
}
function wallPiece(id, name, w, price, mat, parts, rest = {}) {
  BUILT[id] = { parts, doors: [], mat };
  return { id, name, group: GROUP, solo: true, w, h: 1, layer: 'wall', price, ...rest, wall(x) { paintParts(parts, x, 96, w * 32, 0, w * 32); } };
}

/** A two-sided gondola 2 tiles long: a blue kick plate, a white pegboard spine, four shelves a side with their price
    strips, and a blue header naming the aisle; `rows` are the front shelves' stock, bottom first, each a list of parts
    for a shelf standing at h. */
function gondola(title, rows, strips, back) {
  const H = [4.6, 17.6, 30.6, 43.6];
  return [
    B(32, 2.3, 0, 62, 4.6, 24, CS.blue, GL),
    B(32, 27, 0, 60, 44, 2, CS.white, GL),
    ...[2, 62].map(x => B(x, 27, 0, 2, 50, 24, CS.whiteD, GL)),
    ...H.flatMap(h => [-1, 1].map(s => B(32, h, s * 6.5, 58, 1.2, 11, CS.whiteD, MT))),
    ...H.map((h, i) => PC(32, h - 0.6, 12.25, 58, 2.4, strip(strips[i]))),
    ...H.map(h => B(32, h - 0.6, 12.05, 58, 2.4, 0.3, CS.red, { m: 'plain', r: 0 })),
    B(32, 54, 0, 62, 6, 6, CS.blue, GL), PC(32, 54, 3.05, 44, 4.6, word(title, CS.white, CS.blue, 0.8)),
    B(32, 57.4, 0, 62, 0.8, 6.4, CS.red, PL),
    ...rows.flatMap((row, i) => row(H[i] + 0.6)),
    ...H.flatMap((h, i) => back(h + 0.6, i)),
  ];
}

export const CORNERSHOP_KINDS = [
  // the checkout: the Mart's blue counter with its white POKé MART front, a grey till with a green customer display, a
  // receipt printer and a carrier bag waiting on the top
  piece('crscheckout', 'Mart checkout counter', 2, 1, 1300, 'gloss', [
    B(32, 1.5, 0, 62, 3, 24, CS.black, PL),
    B(32, 17, 0, 62, 28, 26, CS.blue, GL),
    B(32, 19, 13.2, 54, 14, 0.8, CS.white, GL), PC(32, 19, 13.65, 50, 12, martMark),
    B(32, 9, 13.3, 62, 2.4, 0.8, CS.red, PL),
    B(32, 32.2, 0.5, 64, 2.4, 28, CS.greyL, GL),
    B(44, 35.4, -3, 16, 4, 12, CS.greyD, GL),
    B(44, 40.2, -4.5, 13, 5.6, 9, CS.greyL, GL),
    B(44, 43.2, -1.5, 12, 0.8, 4, CS.greyD, { m: 'plain', r: 0.3 }),
    ...[41, 44, 47].flatMap(x => [-0.6, -2.4].map(z => B(x, 43.8, z, 2, 0.5, 1.2, CS.white, { m: 'plain', r: 0.2 }))),
    RD([44, 43, -8], [44, 49, -8], 0.6, CS.greyD, MT), B(44, 51, -8, 12, 5, 1.4, CS.greyD, GL), B(44, 51, -7.2, 10, 3.4, 0.3, CS.glowG, GW),
    B(55, 37, -4, 6, 5, 7, CS.white, GL), B(55, 41.4, -1.6, 3.6, 4, 0.3, CS.white, PL),
    B(16, 38.6, -2, 11, 10.4, 6, CS.white, CL), B(16, 39, 1.1, 11, 3, 0.4, CS.blue, PL),
    RD([12.6, 43.6, -2], [14.6, 46.6, -2], 0.4, CS.blue, PL), RD([14.6, 46.6, -2], [17.4, 46.6, -2], 0.4, CS.blue, PL), RD([17.4, 46.6, -2], [19.4, 43.6, -2], 0.4, CS.blue, PL),
    S(9.4, 34.6, 6, 2, 1.2, 2, CS.red, { m: 'gloss', seg: 8 }), S(24, 34.6, 7, 1.6, 1, 1.6, CS.yellow, { m: 'gloss', seg: 8 }),
  ], { glow: [CS.glowG] }),

  // the conveyor checkout: a steel-topped blue counter whose black belt runs between rollers, a red divider bar, a
  // carton of Moomoo Milk, a Potion and a box of Poké Balls riding it to the till, a steel bagging well at its end
  piece('crsconveyor', 'Mart conveyor checkout', 2, 1, 1100, 'gloss', [
    B(32, 1.5, 0, 62, 3, 22, CS.black, PL),
    B(32, 15, 0, 62, 26, 24, CS.blue, GL),
    B(32, 15, 12.3, 56, 14, 0.6, CS.white, GL), B(32, 7, 12.4, 62, 2.4, 0.6, CS.red, PL),
    PC(32, 15.6, 12.65, 30, 6, word('THANK YOU', CS.blue, CS.white, 0.7)),
    B(32, 29, 0, 64, 2, 26, CS.steel, MT),
    B(29, 30.6, 0.5, 52, 1.2, 18, CS.black, PL),
    ...[3.6, 54.4].map(x => RD([x, 30.6, -8.4], [x, 30.6, 9.4], 1.1, CS.steelD, MT)),
    ...[-9.6, 10.6].map(z => B(29, 31.4, z, 56, 2.2, 1, CS.steelL, MT)),
    B(60, 30.6, 0, 7, 1.6, 22, CS.steelL, MT), B(63.1, 33, 0, 1.6, 6, 22, CS.steel, MT),
    B(36, 32.2, 0.5, 2, 2, 16, CS.red, GL),
    B(13, 34.2, 1, 6, 6, 6, CS.white, PL), PR(13, 37.2, 1, [[-3, 0], [3, 0], [0, 2.6]], 6, CS.white, PL), B(13, 34.2, 4.1, 5, 2.4, 0.3, CS.blue, PL),
    ...spray(24, 31.2, 2, CS.potion),
    B(46, 33.8, 1, 11, 5.2, 8, CS.red, GL), PC(46, 33.8, 5.05, 9, 4, (g, x, y, w, h) => { g.fillStyle = CS.red; g.fillRect(x, y, w, h); emblem(g, x + h * 0.55, y + h / 2, h * 0.38); word('x10', CS.white, null, 0.6)(g, x + h, y, w - h, h); }),
  ]),

  // the drinks fridge row: two bays behind glass doors, white with the Mart's blue header, four rows of Fresh Water,
  // Soda Pop, Lemonade and Moomoo Milk on wire shelves, each with its price strip
  piece('crsfridge', 'Mart glass-door drinks fridge', 2, 1, 1450, 'gloss', [
    B(32, 2.5, -1, 62, 5, 24, CS.black, PL),
    B(32, 31, -11.6, 60, 52, 1.6, CS.white, GL),
    ...[2.4, 61.6].map(x => B(x, 31, -1, 2.8, 52, 23, CS.white, GL)), B(32, 31, -1, 2.4, 52, 23, CS.white, GL),
    B(32, 59.5, -1, 64, 5, 24, CS.blue, GL), PC(32, 59.5, 11.3, 40, 3.8, word('COLD DRINKS', CS.white, CS.blue, 0.82)),
    B(32, 56.6, 11.1, 62, 0.8, 0.5, CS.red, PL),
    B(32, 5.6, -1, 58, 1.2, 22, CS.steelD, MT),
    ...[19, 32, 45].flatMap(h => [17, 47].map(x => B(x, h, -1, 27, 0.8, 20, CS.steelL, MT))),
    ...[[6.2, 'FRESH WATER', '200'], [19.4, 'SODA POP', '300'], [32.4, 'LEMONADE', '350'], [45.4, 'MOOMOO MILK', '500']].flatMap(([h], row) => [6.5, 12, 17.5, 23, 37, 42.5, 48, 53.5].flatMap(x => drink(x, h, 2.5,
      [CS.water, CS.soda, CS.lemon, CS.milk][row], [CS.blue, CS.red, CS.yellowD, CS.blue][row], row === 3))),
    ...[[5.6, 'FRESH WATER', '200'], [19, 'SODA POP', '300'], [32, 'LEMONADE', '350'], [45, 'MOOMOO MILK', '500']].flatMap(([h, n, p]) => [17, 47].flatMap(x => [B(x, h - 0.4, 9.2, 26, 2, 0.4, CS.red, { m: 'plain', r: 0 }), PC(x, h - 0.4, 9.45, 26, 2, strip([[n, p]]))])),
  ], {
    doors: [
      { hinge: [2.4, 11.4], side: 1, parts: [
        ...[3.6, 30].map(x => B(x, 31, 12, 2.4, 52, 1.4, CS.white, GL)), ...[56, 6].map(h => B(16.8, h, 12, 28.8, 2.4, 1.4, CS.white, GL)),
        B(16.8, 31, 12, 24.2, 48, 0.4, CS.glass, GS),
        ...[22, 40].map(h => RD([27.4, h, 12.7], [27.4, h, 14], 0.4, CS.steelL, GL)), RD([27.4, 22, 14], [27.4, 40, 14], 0.6, CS.steelL, GL),
      ] },
      { hinge: [61.6, 11.4], side: -1, parts: [
        ...[34, 60.4].map(x => B(x, 31, 12, 2.4, 52, 1.4, CS.white, GL)), ...[56, 6].map(h => B(47.2, h, 12, 28.8, 2.4, 1.4, CS.white, GL)),
        B(47.2, 31, 12, 24.2, 48, 0.4, CS.glass, GS),
        ...[22, 40].map(h => RD([36.6, h, 12.7], [36.6, h, 14], 0.4, CS.steelL, GL)), RD([36.6, 22, 14], [36.6, 40, 14], 0.6, CS.steelL, GL),
      ] },
    ],
    inside: { x: 32, h: 31, w: 56, hh: 48, z: -10.6, bare: true },
  }),

  // the ice cream freezer: a white chest on castors banded in blue, sliding glass lids over tubs and lollies, and
  // Vanillite smiling from the sign at its back
  piece('crsfreezer', 'Mart ice cream freezer', 2, 1, 1200, 'gloss', [
    ...[4, 60].flatMap(x => [-9, 9].map(z => B(x, 1, z, 3, 2, 3, CS.black, PL))),
    B(32, 14, 0, 62, 24, 24, CS.white, GL),
    B(32, 9, 12.2, 62, 6, 0.6, CS.blue, GL), PC(32, 9, 12.55, 32, 4.6, word('ICE CREAM', CS.white, CS.blue, 0.82)),
    B(32, 19.4, 12.2, 62, 1, 0.6, CS.red, PL),
    B(32, 26.8, 0, 64, 1.6, 26, CS.whiteD, GL),
    ...[[10, -5, CS.redL], [22, -5, CS.milk], [34, -5, '#8a5232'], [46, -5, CS.soda], [10, 5, CS.lemon], [22, 5, CS.hyper], [34, 5, CS.milk], [46, 5, CS.vanilD]].map(([x, z, c]) => C(x, 25.4, z, 4.6, 2, c, { m: 'plain', seg: 12 })),
    ...[54, 57, 60].map(x => B(x, 26, 0, 2, 1.6, 8, CS.superp, { m: 'gloss', r: 0.6 })),
    B(17.4, 28, 0, 28, 0.5, 23, CS.glass, GS), B(46.6, 28.6, 0, 28, 0.5, 23, CS.glass, GS),
    ...[17.4, 46.6].map((x, i) => B(x + (i ? -11 : 11), 28.6 + i * 0.6, 8, 3, 0.8, 4, CS.steelD, MT)),
    ...[18, 46].map(x => RD([x, 27.6, -11.4], [x, 34, -11.4], 0.6, CS.steelD, MT)),
    B(32, 41, -11.4, 32, 15, 1, CS.white, GL), PC(32, 41, -10.85, 30, 13, vanillite),
  ]),

  // the hot-snack warmer: a lit glass case on a blue cupboard, buns and croquettes below, Mart hot dogs above, a red
  // HOT SNACKS header
  piece('crswarmer', 'Mart hot-snack warmer', 1, 1, 780, 'gloss', [
    B(16, 1, 0, 26, 2, 20, CS.black, PL),
    B(16, 12, 0, 28, 20, 22, CS.blue, GL),
    B(16, 12, 11.2, 22, 12, 0.5, CS.white, GL), PC(16, 12, 11.5, 20, 6, word('FRESH', CS.red, CS.white, 0.8)),
    B(16, 22.8, 0, 30, 1.6, 24, CS.steel, MT),
    ...[2.4, 29.6].flatMap(x => [-9.6, 9.6].map(z => RD([x, 23.6, z], [x, 43, z], 0.6, CS.steelD, MT))),
    B(16, 33.3, -9.8, 26, 19.4, 0.6, CS.glowY, GW),
    B(16, 33.3, 10, 26, 19.4, 0.4, CS.glass, GS), ...[2.4, 29.6].map(x => B(x, 33.3, 0, 0.4, 19.4, 19, CS.glass, GS)),
    B(16, 33.4, 0, 26, 0.6, 18, CS.steelL, MT),
    ...[[6.4, -3], [12.8, -3], [19.2, -3], [25.6, -3], [9.6, 4], [22.4, 4]].map(([x, z]) => S(x, 26.4, z, 2.8, 2, 2.6, CS.bun, { m: 'gloss', seg: 8 })),
    S(16, 26, 4, 2.6, 1.6, 2, CS.bunD, { m: 'cloth', seg: 8 }),
    ...[7, 16, 25].flatMap(x => [B(x, 35.2, 0, 7, 2.6, 4, CS.bun, { m: 'gloss', r: 1.2 }), RD([x - 3.8, 36.4, 0], [x + 3.8, 36.4, 0], 0.9, CS.sausage, GL)]),
    B(16, 45, 0, 30, 4, 24, CS.red, GL), PC(16, 45, 12.05, 26, 3.4, word('HOT SNACKS', CS.white, CS.red, 0.85)),
  ], { glow: [CS.glowY] }),

  // the coffee machine: a black brewer with a lit blue display on a white counter cupboard, a paper cup under the
  // spout, a stack of cups with lids and a sugar caddy beside it
  piece('crscoffee', 'Mart coffee machine', 1, 1, 680, 'gloss', [
    B(16, 1, 0, 28, 2, 22, CS.black, PL),
    B(16, 14, 0, 30, 24, 22, CS.white, GL), B(16, 9, 11.2, 30, 2.4, 0.5, CS.red, PL),
    B(16, 14.8, 11.1, 0.4, 14, 0.4, CS.whiteD, PL), ...[14, 18].map(x => RD([x, 17, 11.5], [x, 12, 11.5], 0.4, CS.steelD, MT)),
    B(16, 27, 0, 32, 2, 24, CS.greyL, GL),
    B(12, 41, -3, 18, 26, 14, CS.black, GL),
    B(12, 49, 4.1, 14, 6, 0.4, CS.blueD, PL), PC(12, 49, 4.35, 12, 4, word('COFFEE', CS.glowB, CS.blueD, 0.7)),
    B(12, 34, 3.6, 12, 10, 1.2, CS.blackL, PL),
    C(12, 39.6, 2.6, 1.2, 1.4, CS.steel, { m: 'metal', seg: 8 }),
    LA(12, 28.4, 3, [[1.6, 0], [2.2, 4.4], [2.3, 4.8]], CS.white, { m: 'plain', seg: 10 }), C(12, 31, 3, 2.25, 1.2, CS.coffee, { m: 'plain', seg: 10 }),
    B(12, 28.6, 3, 10, 0.6, 6, CS.steelD, MT),
    LA(26, 28, -2, [[2, 0], [2.6, 7], [2.7, 7.4], [2.5, 7.4], [2.6, 9], [2.7, 9.4]], CS.white, { m: 'gloss', seg: 10 }),
    C(26, 38.4, -2, 2.6, 1, CS.black, { m: 'plain', seg: 10 }),
    B(26, 31, 5, 5, 4, 4, CS.red, GL), ...[24.8, 27.2].map(x => B(x, 34, 5, 1.6, 2, 2.4, CS.white, PL)),
  ], { glow: [CS.glowB] }),

  // the PC cash point: a grey kiosk with the Mart's blue cap, a lit screen with a Poké Ball, a keypad, card and note
  // slots
  piece('crsatm', 'Mart PC cash point', 1, 1, 1250, 'gloss', [
    B(16, 1, -2, 26, 2, 20, CS.black, PL),
    B(16, 27, -2, 24, 50, 18, CS.greyL, GL),
    B(16, 54, -2, 26, 4, 20, CS.blue, GL), PC(16, 54, 8.05, 18, 3.4, word('PC CASH', CS.white, CS.blue, 0.85)),
    B(16, 42, 7.3, 19, 13, 0.6, CS.greyD, GL), B(16, 42, 7.7, 16, 10.6, 0.3, CS.glowB, GW), PC(16, 42, 7.9, 15, 9.6, atmScreen),
    B(16, 32, 8.8, 18, 2, 4, CS.greyD, GL),
    ...[11.5, 14.5, 17.5].flatMap(x => [8, 9.6].map(z => B(x, 33.2, z, 2.2, 0.6, 1.2, CS.white, { m: 'plain', r: 0.2 }))),
    B(21.5, 33.2, 9.6, 2.2, 0.6, 1.2, CS.red, { m: 'plain', r: 0.2 }), B(21.5, 33.2, 8, 2.2, 0.6, 1.2, CS.antidote, { m: 'plain', r: 0.2 }),
    B(16, 26, 7.3, 9, 1.4, 0.5, CS.black, PL), DS(22, 26, 7.4, 0.7, 0.4, CS.glowG, { m: 'glow', seg: 6 }),
    B(16, 18, 7.3, 15, 2.2, 0.6, CS.black, PL),
    B(16, 8, 7.2, 24, 1.6, 0.4, CS.red, PL),
  ], { glow: [CS.glowB] }),

  // the lottery stand: a red cabinet holding a white board of scratch cards under a yellow LOTTO header, a pot of
  // pencils and a slip pad on its ledge
  piece('crslottery', 'Mart lottery ticket stand', 1, 1, 540, 'gloss', [
    B(16, 1, 0, 22, 2, 16, CS.black, PL),
    B(16, 16, 0, 18, 28, 12, CS.red, GL), B(16, 16, 6.2, 14, 20, 0.4, CS.redD, PL), PC(16, 21, 6.5, 12, 5, word('WIN!', CS.yellow, CS.redD, 0.8)),
    B(16, 30.8, 1, 26, 1.6, 15, CS.white, GL),
    B(16, 43, -2, 28, 22, 2, CS.blue, GL), B(16, 42, -0.7, 25, 18, 0.6, CS.white, PL), PC(16, 42, -0.35, 25, 18, tickets),
    B(16, 55.4, -2, 30, 4.4, 3, CS.yellow, GL), PC(16, 55.4, -0.45, 24, 3.8, word('LOTTO', CS.red, CS.yellow, 0.86)),
    C(5.6, 34.6, 4.6, 1.8, 6, CS.blueD, { m: 'gloss', seg: 10 }),
    ...[-0.8, 0, 0.8].map((d, i) => RD([5.6 + d, 36, 4.6], [5.6 + d * 2.4, 40.4 + i * 0.4, 4.6], 0.3, CS.yellowD, PL)),
    B(23, 32, 4, 8, 0.8, 6, CS.white, PL),
  ]),

  // the crane box: a blue cabinet with a glass case on top, a heap of plushes inside (a big Pikachu among Poké Ball
  // cushions), the claw hanging over them, a red CATCH! marquee and a prize chute
  piece('crscrane', 'Mart Pikachu crane box', 1, 1, 980, 'gloss', [
    B(16, 1, 0, 28, 2, 24, CS.black, PL),
    B(16, 12, 0, 28, 20, 24, CS.blue, GL),
    B(21, 12, 12.2, 8, 8, 0.6, CS.black, GL), B(21, 15.6, 12.4, 8, 1, 0.4, CS.steelL, MT),
    B(8.6, 18, 12.2, 8, 2, 1.4, CS.greyD, GL), C(8.6, 21, 12, 0.5, 4, CS.steelD, { m: 'metal', seg: 6 }), S(8.6, 23.4, 12, 1.4, 1.4, 1.4, CS.red, { m: 'gloss', seg: 8 }),
    B(16, 22.6, 0, 30, 1.2, 26, CS.steel, MT),
    ...[2, 30].flatMap(x => [-11, 11].map(z => B(x, 37.6, z, 1.6, 29, 1.6, CS.steelL, MT))),
    B(16, 37.6, -11.6, 26, 29, 0.6, CS.white, GL),
    B(16, 37.6, 11.6, 27, 29, 0.4, CS.glass, GS), ...[1.8, 30.2].map(x => B(x, 37.6, 0, 0.4, 29, 22, CS.glass, GS)),
    ...pball(6.4, 23.2, -4, 3.4), ...pball(25, 23.2, 2, 3.2, CS.blue), ...pball(7.2, 23.2, 5, 2.8, CS.black),
    S(17, 28.4, 0, 6.4, 5.4, 5.4, CS.pika, { m: 'cloth', seg: 12 }),
    ...[-1, 1].flatMap(s => [
      PR(17 + s * 3.6, 32.4, -1, s < 0 ? [[-1.6, 0], [1.4, 0], [-3.4, 7]] : [[-1.4, 0], [1.6, 0], [3.4, 7]], 1.6, CS.pika, CL),
      PR(17 + s * 3.6, 32.4, -0.9, s < 0 ? [[-2.65, 4.4], [-1.95, 4.4], [-3.4, 7]] : [[1.95, 4.4], [2.65, 4.4], [3.4, 7]], 1.8, CS.black, PL),
      DS(17 + s * 4, 27.2, 4.7, 1.3, 0.4, CS.cheek, { m: 'plain', seg: 8 }), DS(17 + s * 2, 29.4, 5.1, 0.7, 0.4, CS.black, { m: 'gloss', seg: 6 }),
    ]),
    RD([15.6, 27, 5.3], [18.4, 27, 5.3], 0.25, CS.black, PL),
    B(16, 50.4, 0, 22, 1, 4, CS.steelD, MT), RD([16, 50, 0], [16, 43, 0], 0.3, CS.steelD, MT), C(16, 42, 0, 1.6, 2, CS.steel, { m: 'metal', seg: 8 }),
    ...[-1, 1].map(s => RD([16 + s * 1.2, 41, 0], [16 + s * 3.4, 37, 0], 0.4, CS.steel, MT)), RD([16, 41, -1.2], [16, 37, -3.2], 0.4, CS.steel, MT),
    B(16, 55, 0, 30, 6.6, 26, CS.red, GL), PC(16, 55, 13.05, 26, 5, marquee),
  ]),

  // the clerk's stool: a blue vinyl seat on a steel pole, a foot ring round it
  piece('crsstool', 'Mart clerk stool', 1, 1, 240, 'metal', [
    C(16, 0.6, 0, 8, 1.2, CS.steelD, { m: 'metal', seg: 16 }),
    C(16, 11, 0, 2, 20, CS.steel, { m: 'metal', seg: 10 }),
    RG(16, 9, 0, 6.4, 0.6, CS.steel, { m: 'metal', flat: true }),
    RD([9.6, 9, 0], [22.4, 9, 0], 0.4, CS.steel, MT), RD([16, 9, -6.4], [16, 9, 6.4], 0.4, CS.steel, MT),
    C(16, 21.6, 0, 3, 1.4, CS.steelD, { m: 'metal', seg: 12 }),
    C(16, 23.6, 0, 8.4, 3, CS.blue, { m: 'gloss', seg: 18, rb: 8 }),
    RG(16, 22.2, 0, 8.1, 0.5, CS.red, { m: 'plain', flat: true }),
    LA(16, 25.1, 0, [[8.4, 0], [7.8, 0.8], [4.8, 1.3], [0, 1.5]], CS.blue, { m: 'gloss', seg: 18 }),
  ]),

  // the storefront bench: a white steel frame with blue slats, POKé MART on its back rail
  piece('crsbench', 'Mart storefront bench', 2, 1, 560, 'gloss', [
    ...[4, 60].flatMap(x => [B(x, 8, 2, 2.4, 16, 2.4, CS.white, MT), B(x, 15, -8, 2.4, 30, 2.4, CS.white, MT), RD([x, 1, 9], [x, 1, -8], 1, CS.white, MT), B(x, 21, 1, 2.6, 1.6, 16, CS.white, MT)]),
    ...[-4, 1, 6].map(z => B(32, 15.6, z, 60, 1.6, 4.2, CS.blue, GL)),
    ...[19.4, 25.4].map(h => B(32, h, -8.6, 54, 4.2, 1.4, CS.blue, GL)),
    B(32, 30.4, -8.6, 58, 2.4, 2, CS.white, MT), PC(32, 25.4, -7.85, 30, 3.6, word('POKé MART', CS.white, CS.blue, 0.86)),
  ]),

  // the eat-in counter: a high white window counter on steel legs with a foot rail, a napkin dispenser, ketchup and
  // mustard
  piece('crseatin', 'Mart eat-in window counter', 2, 1, 620, 'metal', [
    ...[4, 60].flatMap(x => [-5, 5].map(z => RD([x, 0, z], [x, 32, z], 0.9, CS.steel, MT))),
    ...[4, 60].map(x => B(x, 0.6, 0, 3, 1.2, 13, CS.steelD, MT)),
    RD([4, 8, 5], [60, 8, 5], 0.6, CS.steelL, MT),
    B(32, 31.2, 0, 60, 2.8, 12, CS.blue, GL), B(32, 30.6, 6.1, 60, 1, 0.4, CS.red, PL),
    B(32, 33.6, 0, 64, 2, 16, CS.white, GL),
    B(10, 37.2, -3, 6, 5.2, 4, CS.steel, MT), B(10, 40.2, -3, 4.4, 1, 1, CS.white, PL),
    LA(48, 34.6, -3, [[1.6, 0], [1.6, 5], [0.8, 6], [0.3, 7]], CS.red, { m: 'gloss', seg: 8 }),
    LA(52, 34.6, -3, [[1.6, 0], [1.6, 5], [0.8, 6], [0.3, 7]], CS.yellow, { m: 'gloss', seg: 8 }),
  ]),

  // the medicine aisle: a gondola of Potions, Super Potions, Antidotes and Hyper Potions, each row behind its price strip
  piece('crspotions', 'Mart medicine gondola', 2, 1, 980, 'gloss', gondola('MEDICINE', [
    (h) => [6, 13, 20, 27, 37, 44, 51, 58].flatMap(x => spray(x, h, 6, CS.potion)),
    (h) => [6, 13, 20, 27, 37, 44, 51, 58].flatMap(x => spray(x, h, 6, CS.superp)),
    (h) => [5.6, 11.4, 17.2, 23, 41, 46.8, 52.6, 58.4].map(x => LA(x, h, 6, [[1.6, 0], [1.6, 4], [0.8, 4.8], [0.8, 6]], CS.antidote, { m: 'gloss', seg: 8 })),
    (h) => [6, 13, 20, 27, 37, 44, 51, 58].flatMap(x => spray(x, h, 6, CS.hyper, 0.9)),
  ], [
    [['POTION', '300'], ['POTION', '300']], [['SUPER POTION', '700'], ['SUPER POTION', '700']], [['ANTIDOTE', '100'], ['FULL HEAL', '400']], [['HYPER POTION', '1500'], ['HYPER POTION', '1500']],
  ], (h, i) => [16, 32, 48].map(x => B(x, h + 3.5, -6.5, 12, 7, 8, [CS.potion, CS.superp, CS.antidote, CS.hyper][i], { m: 'gloss', r: 0 })))),

  // the ball aisle: a gondola of boxed Poké Balls, Poké Balls, Great and Ultra Balls, and Repel cans on top
  piece('crsballs', 'Mart Poké Ball gondola', 2, 1, 980, 'gloss', gondola('POKé BALLS', [
    (h) => [9, 23, 41, 55].flatMap(x => [B(x, h + 4, 6, 12, 8, 9, CS.red, GL), B(x, h + 2, 10.55, 12, 2.4, 0.2, CS.white, PL)]),
    (h) => [6, 13, 20, 27, 37, 44, 51, 58].flatMap(x => pball(x, h, 6, 3)),
    (h) => [6, 13, 20, 27, 37, 44, 51, 58].flatMap((x, i) => pball(x, h, 6, 3, i < 4 ? CS.blue : CS.black)),
    (h) => [5.6, 11.4, 17.2, 23, 41, 46.8, 52.6, 58.4].flatMap(x => [C(x, h + 3, 6, 2, 6, CS.repel, { m: 'gloss', seg: 8 }), C(x, h + 6.8, 6, 1.4, 1.6, CS.repelD, { m: 'plain', seg: 8 })]),
  ], [
    [['BALL BOX x10', '2000'], ['BALL BOX x10', '2000']], [['POKé BALL', '200'], ['POKé BALL', '200']], [['GREAT BALL', '600'], ['ULTRA BALL', '1200']], [['REPEL', '350'], ['SUPER REPEL', '500']],
  ], (h, i) => [16, 32, 48].map(x => B(x, h + 3.5, -6.5, 12, 7, 8, [CS.red, CS.white, CS.blue, CS.repel][i], { m: 'gloss', r: 0 })))),

  // the end-cap: a red and white stepped plinth heaped with a pyramid of Repel cans, a yellow SALE! board on a pole
  piece('crsendcap', 'Mart end-cap sale display', 1, 1, 640, 'gloss', [
    B(16, 4, 0, 30, 8, 26, CS.red, GL), B(16, 4, 13.1, 30, 2, 0.3, CS.white, PL),
    B(16, 10.5, 0, 26, 5, 22, CS.white, GL),
    ...[6.2, 11.1, 16, 20.9, 25.8].map(x => C(x, 16, 4, 2.3, 6, CS.repel, { m: 'gloss', seg: 10 })),
    ...[8.6, 13.5, 18.4, 23.3].map(x => C(x, 22, 3, 2.3, 6, CS.repel, { m: 'gloss', seg: 10 })),
    ...[11.1, 16, 20.9].map(x => C(x, 28, 2, 2.3, 6, CS.repelD, { m: 'gloss', seg: 10 })),
    ...[13.5, 18.4].map(x => C(x, 34, 1, 2.3, 6, CS.repelD, { m: 'gloss', seg: 10 })),
    ...[[6.2, 4], [11.1, 4], [16, 4], [20.9, 4], [25.8, 4], [8.6, 3], [13.5, 3], [18.4, 3], [23.3, 3]].map(([x, z], i) => B(x, i < 5 ? 16 : 22, z + 2.1, 3.4, 2, 0.3, CS.white, PL)),
    RD([16, 13, -8], [16, 46, -8], 0.8, CS.steelD, MT),
    B(16, 52, -8, 28, 14, 1, CS.yellow, GL), PC(16, 52, -7.45, 26, 12, (g, x, y, w, h) => { word('SALE!', CS.red, CS.yellow, 0.6)(g, x, y, w, h * 0.66); word('REPEL -30%', CS.blueD, null, 0.7)(g, x, y + h * 0.64, w, h * 0.3); }),
  ]),

  // a stack of red plastic Mart baskets on a little stand, BASKETS on its front, the top one's handles up
  piece('crsbaskets', 'Mart basket stack', 1, 1, 260, 'gloss', [
    B(16, 1.5, 0, 26, 3, 20, CS.whiteD, GL), PC(16, 1.5, 10.05, 14, 2.6, word('BASKETS', CS.blue, CS.whiteD, 0.8)),
    ...[0, 1, 2, 3, 4, 5].map(k => B(16, 5.4 + k * 3.4, 0, 24, 3.4 + (k === 5 ? 1 : 0), 17, CS.red, { m: 'gloss', r: 0.6, tex: 'mesh' })),
    ...[0, 1, 2, 3, 4].map(k => B(16, 7.1 + k * 3.4, 8.6, 24.4, 0.6, 0.3, CS.redD, PL)),
    B(16, 25.4, 0, 21, 0.4, 14, CS.redD, PL),
    ...[-1, 1].map(s => RG(16, 26, s * 5, 7, 0.6, CS.blue, { m: 'gloss', arc: Math.PI })),
  ]),

  // a shopping cart: a steel wire basket on a frame, a red push handle, four castors, a carton of Moomoo Milk and a box
  // of Poké Balls in it
  piece('crscart', 'Mart shopping cart', 1, 1, 480, 'metal', [
    ...[6, 26].flatMap(x => [-9, 8].flatMap(z => [DS(x, 2, z, 2, 1.2, CS.black, { m: 'gloss', ax: 'x', seg: 10 }), B(x, 4.4, z, 1.6, 2.6, 1.4, CS.steelD, MT)])),
    ...[6, 26].map(x => RD([x, 5.6, -9], [x, 5.6, 8], 0.6, CS.steel, MT)),
    RD([6, 5.6, 0], [26, 5.6, 0], 0.6, CS.steel, MT),
    B(16, 7.6, -0.5, 20, 0.6, 16, CS.steelL, { m: 'metal', r: 0.2 }),
    ...[[4.6, -10], [27.4, -10], [4.6, 10], [27.4, 10]].map(([x, z]) => RD([x, 5.6, z * 0.9], [x, 14, z], 0.6, CS.steel, MT)),
    B(16, 14.4, -0.5, 23, 0.6, 21, CS.steelL, { m: 'metal', r: 0.2 }),
    B(16, 23, 10, 24, 17, 0.6, CS.steelL, { m: 'metal', r: 0.4, tex: 'mesh' }),
    B(16, 23, -11, 24, 17, 0.6, CS.steelL, { m: 'metal', r: 0.4, tex: 'mesh' }),
    ...[4.2, 27.8].map(x => B(x, 23, -0.5, 0.6, 17, 21.6, CS.steelL, { m: 'metal', r: 0.4, tex: 'mesh' })),
    B(16, 31.6, -0.5, 25, 1, 22.4, CS.steel, { m: 'metal', r: 0.4 }),
    ...[4.2, 27.8].map(x => RD([x, 31.6, -11.4], [x, 37, -14], 0.6, CS.steel, MT)),
    RD([3.4, 37, -14], [28.6, 37, -14], 1.2, CS.red, GL),
    B(11, 19.4, 0, 7, 9, 7, CS.white, PL), PR(11, 23.9, 0, [[-3.5, 0], [3.5, 0], [0, 2.8]], 7, CS.white, PL), B(11, 19.4, 3.6, 6, 3, 0.3, CS.blue, PL),
    B(21, 18, -2, 9, 6, 7, CS.red, GL),
  ]),

  // the magazine rack: a blue stand with three stepped ledges of Pokémon magazines, the morning papers folded at its foot
  piece('crsmagazine', 'Mart magazine rack', 1, 1, 420, 'gloss', [
    ...[2, 30].map(x => B(x, 24, -2, 2.4, 48, 16, CS.blue, GL)),
    B(16, 24, -9.4, 26, 46, 1, CS.white, GL),
    B(16, 49, -2, 30, 4, 16, CS.blue, GL), PC(16, 49, 6.05, 24, 3.4, word('MAGAZINES', CS.white, CS.blue, 0.85)),
    ...[[2, 4.8], [15, 1.6], [28, -1.6]].map(([h, z]) => B(16, h, z, 26, 1.6, 7, CS.whiteD, MT)),
    ...[[15, 1.6], [28, -1.6]].map(([h, z]) => B(16, h + 1.2, z + 3.2, 26, 2.4, 0.6, CS.whiteD, MT)),
    ...[['POKé WEEK', CS.yellow, CS.red, 'ball'], ['VOLT', CS.blueD, CS.yellow, 'bolt'], ['TRAINER', CS.white, CS.blue, 'ball']].flatMap(([t, bg, ink, mark], i) => [B(7 + i * 9, 21.6, 3.2, 8, 11, 0.6, bg, PL), PC(7 + i * 9, 21.6, 3.55, 8, 11, cover(t, bg, ink, mark))]),
    ...[['GYM NEWS', CS.white, CS.redD], ['COOKING', CS.lemon, CS.soda, 'ball'], ['BERRY', CS.redL, CS.antidote]].flatMap(([t, bg, ink, mark], i) => [B(7 + i * 9, 34.6, 0, 8, 11, 0.6, bg, PL), PC(7 + i * 9, 34.6, 0.35, 8, 11, cover(t, bg, ink, mark))]),
    ...[0, 1].flatMap(i => [B(10 + i * 12, 4.4, 5, 11, 3.2 - i * 0.6, 6, CS.white, PL), PC(10 + i * 12, 4.4, 8.05, 11, 3.2 - i * 0.6, word('DAILY', CS.black, CS.white, 0.8))]),
  ]),

  // the shop's lit sign: a blue box with a red band reading POKé and MART in blue across its glowing white face
  wallPiece('crssign', 'Mart POKé MART lit sign', 2, 1100, 'gloss', [
    B(32, 64, 0.9, 62, 26, 1.8, CS.blue, GL),
    B(32, 74, 2, 56, 4.4, 0.5, CS.red, GL), PC(32, 74, 2.3, 30, 4, word('POKé', CS.white, CS.red, 0.9)),
    B(32, 61.8, 2, 56, 15, 0.5, CS.glowW, GW),
    ...letters('MART', [17, 27, 37, 47], 56.2, 2.6, 0.82, 0.9, CS.blue, PL),
    ...[5.4, 58.6].map(x => DS(x, 74, 2, 1.2, 0.6, CS.white, { m: 'gloss', seg: 8 })),
  ], { glow: [CS.glowW] }),

  // the OPEN neon: red tubes spelling OPEN inside a blue tube frame on a black board, hung by two wires
  wallPiece('crsopen', 'Mart OPEN neon sign', 1, 720, 'gloss', [
    ...[5, 27].map(x => RD([x, 70, 0.4], [x, 80, 0.4], 0.2, CS.black, PL)),
    B(16, 63, 0.4, 30, 15, 0.8, CS.black, GL),
    ...[[2.4, 57.6, 29.6, 57.6], [29.6, 57.6, 29.6, 68.4], [29.6, 68.4, 2.4, 68.4], [2.4, 68.4, 2.4, 57.6]].map(([ax, ah, bx, bh]) => RD([ax, ah, 1.4], [bx, bh, 1.4], 0.45, CS.neonB, GW)),
    ...letters('OPEN', [7, 13, 19, 25], 59.4, 1.6, 0.6, 0.45, CS.neonR, GW),
  ], { glow: [CS.neonR, CS.neonB] }),

  // the security mirror: a round convex dome in a black rim on a short bracket, a SMILE! tag beneath
  wallPiece('crsmirror', 'Mart security mirror', 1, 380, 'gloss', [
    B(16, 74, 0.6, 4, 4, 1.2, CS.greyD, MT), RD([16, 74, 1], [16, 71, 2.6], 0.6, CS.greyD, MT),
    S(16, 63, 2.6, 10.6, 10.6, 2.4, CS.steelL, { m: 'metal', seg: 16 }),
    RG(16, 63, 2.6, 10.6, 0.7, CS.black, GL),
    B(16, 49, 0.4, 14, 4, 0.6, CS.yellow, PL), PC(16, 49, 0.75, 13, 3.6, word('SMILE!', CS.black, CS.yellow, 0.86)),
  ]),

  // the price-list stand: a steel-framed white board of today's prices on two feet
  piece('crsprices', 'Mart price-list stand', 1, 1, 320, 'metal', [
    ...[4, 28].map(x => B(x, 0.8, 0, 2.4, 1.6, 12, CS.steelD, MT)),
    ...[4, 28].map(x => RD([x, 1, 0], [x, 46, 0], 0.8, CS.steel, MT)),
    B(16, 30, 0, 22, 30, 1, CS.blue, GL), B(16, 30, 0.6, 20, 28, 0.3, CS.white, PL), PC(16, 30, 0.8, 20, 28, priceList),
    B(25, 42, 0.9, 6, 3, 0.3, CS.red, PL), PC(25, 42, 1.1, 6, 3, word('SALE', CS.white, CS.red, 0.8)),
  ]),

  // the entrance mat: Mart blue with a white border, a Poké Ball and WELCOME
  { id: 'crsmat', name: 'Mart entrance mat', group: GROUP, solo: true, w: 2, h: 1, layer: 'rug', price: 420, high: 0.03, side: 'c', flat() {
    const g = ctx(), path = () => { g.beginPath(); RUG.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
    g.fillStyle = CS.blueD; path(); g.fill();
    g.fillStyle = CS.blue; g.fillRect(5, 5, 54, 22);
    g.strokeStyle = CS.white; g.lineWidth = 0.8; g.strokeRect(6.5, 6.5, 51, 19);
    g.fillStyle = CS.red; g.fillRect(5, 22, 54, 1.4);
    emblem(g, 15, 15.4, 5.4);
    word('WELCOME', CS.white, null, 0.8)(g, 23, 10.6, 33, 9);
    g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 0.3;
    for (let x = 4; x < 61; x += 1.4) { g.beginPath(); g.moveTo(x, 3); g.lineTo(x, 4.6); g.moveTo(x, 27.4); g.lineTo(x, 29); g.stroke(); }
    g.strokeStyle = sh(CS.blueD, -1); g.lineWidth = 1; path(); g.stroke();
  } },

  // Kecleon minding the shop: stood in the Mart's blue apron, its red zigzag across its middle, its curled tail behind,
  // holding out a Potion
  piece('crskecleon', 'Mart Kecleon shopkeeper', 1, 1, 1300, 'cloth', [
    ...[11, 21].map(x => S(x, 3, 1, 3.4, 3, 4.4, CS.kecD, { m: 'cloth', seg: 10 })),
    ...[11, 21].map(x => C(x, 8, 0, 2.6, 8, CS.kec, { m: 'cloth', seg: 10 })),
    S(16, 19, -1, 8.2, 9, 7.4, CS.kec, { m: 'cloth', seg: 14 }),
    S(16, 18, 2.4, 6, 7, 5, CS.kecB, { m: 'cloth', seg: 12 }),
    RG(16, 18.5, -1, 8, 0.8, CS.kecR, { m: 'plain', flat: true }),
    B(16, 18, 7.2, 10, 13, 0.8, CS.blue, CL), B(16, 24.8, 6.6, 10, 1, 1, CS.blue, CL), PC(16, 16, 7.65, 8, 3, word('MART', CS.white, CS.blue, 0.86)),
    RD([10.4, 24.6, 6.4], [9.4, 28, 2], 0.3, CS.blue, PL), RD([21.6, 24.6, 6.4], [22.6, 28, 2], 0.3, CS.blue, PL),
    S(16, 33.6, 0, 7.4, 6.4, 6.8, CS.kec, { m: 'cloth', seg: 14 }),
    S(16, 31, 4.4, 4.6, 2.4, 2.6, CS.kecB, { m: 'cloth', seg: 10 }),
    PR(16, 38, -1, [[-3.4, 0], [3.4, 0], [1.6, 4.6], [0, 6.2], [-1.6, 4.6]], 4, CS.kec, CL),
    ...[-1, 1].flatMap(s => [
      LA(16 + s * 5.4, 34.4, 3.2, [[2.4, -2.4], [2.6, -1], [2.4, 0.6], [1.6, 2], [0, 2.4]], CS.kecB, { m: 'cloth', seg: 10 }),
      DS(16 + s * 5.4, 34.4, 5.9, 1.3, 0.4, CS.kecR, { m: 'plain', seg: 8 }), DS(16 + s * 5.4, 34.4, 6.2, 0.6, 0.3, CS.black, { m: 'gloss', seg: 6 }),
    ]),
    RD([12.6, 29.6, 6.4], [19.4, 29.6, 6.4], 0.3, CS.kecD, PL),
    RD([8.6, 24, 1], [6, 18, 4], 1.4, CS.kec, CL), RD([23.4, 24, 1], [25.4, 20, 6], 1.4, CS.kec, CL),
    ...spray(25.6, 17.6, 7.4, CS.potion, 0.8),
    RG(16, 13, -10, 4.4, 1.6, CS.kec, { m: 'cloth', a0: -Math.PI / 2, arc: Math.PI * 1.6 }),
    RG(16, 13, -10.2, 4.4, 0.6, CS.kecR, { m: 'plain', a0: 0, arc: Math.PI * 0.6 }),
  ]),

  // Munchlax at the snacks: a low blue snack shelf of crisp bags and biscuit boxes, Munchlax sat on top hugging a bag
  piece('crsmunchlax', 'Mart Munchlax snack shelf', 1, 1, 1100, 'gloss', [
    B(16, 1.5, 0, 30, 3, 22, CS.blue, GL),
    ...[2, 30].map(x => B(x, 13, 0, 2, 26, 22, CS.white, GL)), B(16, 13, -10.4, 26, 24, 1.2, CS.white, GL),
    ...[3.6, 13.6].map(h => B(16, h, 0.5, 27, 1.2, 20, CS.whiteD, MT)),
    ...[[6.2, CS.superp], [11.4, CS.red], [16.6, CS.soda], [21.8, CS.yellow], [27, CS.potion]].map(([x, c]) => bag(x, 4.2, 6, c, 4.8, 8)),
    ...[[7.6, CS.blueL], [15, CS.redL], [22.4, CS.lemon]].map(([x, c]) => B(x, 18.4, 5, 6.6, 8.4, 5, c, { m: 'gloss', r: 0.4 })),
    B(16, 25.2, 0.5, 32, 1.6, 22, CS.blue, GL), PC(16, 25.2, 11.55, 20, 1.5, word('SNACKS', CS.white, CS.blue, 0.95)),
    S(16, 33.2, 0, 8.4, 7.4, 7.6, CS.lax, { m: 'cloth', seg: 14 }),
    S(16, 32, 4, 6.4, 5.2, 4, CS.laxC, { m: 'cloth', seg: 12 }),
    ...[9.6, 22.4].map(x => S(x, 27, 5, 2.4, 1.8, 3, CS.laxC, { m: 'cloth', seg: 8 })),
    S(16, 45, 0, 7, 5.8, 6.2, CS.lax, { m: 'cloth', seg: 14 }),
    S(16, 43.6, 3.6, 5, 3.6, 3.2, CS.laxC, { m: 'cloth', seg: 10 }),
    ...[-1, 1].map(s => PR(16 + s * 4.8, 48.4, -0.5, s < 0 ? [[-1.8, 0], [1.6, 0], [-1, 4]] : [[-1.6, 0], [1.8, 0], [1, 4]], 2.4, CS.laxD, CL)),
    ...[-1, 1].map(s => RD([16 + s * 2.6, 45.6, 6.6], [16 + s * 1.2, 45.6, 6.7], 0.3, CS.black, PL)),
    RD([14.6, 42.6, 6.7], [17.4, 42.6, 6.7], 0.3, CS.laxD, PL),
    bag(16, 30, 8.6, CS.superp, 6.4, 7.4),
    ...[-1, 1].map(s => S(16 + s * 4.2, 33.6, 7.6, 2.2, 2, 2.4, CS.lax, { m: 'cloth', seg: 8 })),
  ]),
];
