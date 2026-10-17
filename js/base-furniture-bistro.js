/* base-furniture-bistro.js  -  the Bistro kitchen set (furniture expansion session i, 2026-10-17): a little French
   bistro, its open kitchen and its dining room in one. The kitchen in stainless steel and copper: a big range under a
   copper hood, a steel prep table, the pass under its heat lamps, a stockpot on its ring, a glass-door fridge of berry
   juice, the dish sink, a copper pan rail and a rack of hanging herbs and garlic. The dining room in dark green and cream
   with brass: bentwood chairs, a marble table for two, a tufted banquette, a checked-cloth table, a zinc bar with its
   coffee machine, chalkboards, a rack of berry-juice bottles, a cheese cart, a dessert trolley, a maître d's stand, a
   pillar clock, Edison-bulb lamps and a black-and-white hex tile mat. A chef-hat Pikachu on the prep table, Alcremie on
   the dessert trolley, Slurpuff piping cream at the pastry counter and Swirlix on the maître d's stand for the Pokémon
   touches. All solo, fixed colours, sold all year.
   An upright piece is a list of parts in painted units (32 a tile), as in js/base-furniture-caravan.js: `x` across from
   the left of its front, `h` up from the floor (a wall piece's from the foot of its strip), `z` out to the front from its
   middle (a wall piece's from the wall). They're painted here from any side, and js/base-models-bistro.js builds the same
   list as 3D parts (BUILT), so picture and model agree. `tex` is painted only (the model stays plain colour): `tile`
   white wall tiles, `steel` brushed steel, `marble` veins, `check` a gingham cloth, `cane` a woven cane seat, `tuft` a
   buttoned banquette, `stripe` stripes; `tc` is its colour. A `pic` part (the chalkboards, the clock's dial) is painted on
   the front only, and the model wears that crop of the painting. The range's oven door and the fridge's glass door swing
   (`doors`, `inside`). A disc with `ax: 'x'` stands side-on (the carts' wheels). The rug is painted from above. */

import { sh, oval, ovalShade, floorShadow, ctx, hash, glass as glassPane } from './base-paint.js';

export const BS = {
  steel: '#b4bac0', steelD: '#7e858d', steelL: '#d8dde2', iron: '#2a2c30', ink: '#1c1a18', black: '#202024',
  copper: '#c06a38', copperD: '#8a4624', copperL: '#e0925a', brass: '#c9a040', brassD: '#8e6c22', brassL: '#e8c868',
  zinc: '#a3abb0', green: '#24503a', greenD: '#163626', greenL: '#3a7454', cream: '#efe4c8', creamD: '#d6c8a4',
  wood: '#4e2e1c', woodD: '#301c10', woodL: '#7a4c2c', marble: '#eeece6', vein: '#a8a6a4', white: '#f6f4ee',
  red: '#c0282c', redD: '#8a1a20', tile: '#f2f0ea', grout: '#c8c6c0', chalk: '#28322c', chalkL: '#f0f0e6',
  flame: '#5aa8ff', heat: '#ff7a3a', bulb: '#ffc460', glass: '#cfe8f4', bottle: '#2e5a3c', berry: '#7a1e50',
  berryL: '#b03a70', gold: '#d8a030', oran: '#3a6ad0', pecha: '#f4a0c0', cheri: '#d83040',
  cheese: '#f2c85a', cheeseD: '#d29a34', brie: '#f4ecd6', bread: '#d09048', breadD: '#a8682c', grape: '#6a3a7a',
  herb: '#5a8a3a', herbD: '#3a6a2a', lavender: '#8a72b8', garlic: '#f2ece0', onion: '#c87a4a', carrot: '#e87a28',
  tomato: '#d83a2a', steak: '#7a3a22', fries: '#e8c050', soup: '#d0843a', egg: '#f6f0e2', butter: '#f4e08a', choux: '#d8a050',
  choc: '#5a3420', tart: '#e0a040', sponge: '#f0d060', apron: '#f4f2ec', beret: '#2a2226', scarf: '#c0282c',
  pika: '#f6d030', pikaD: '#c89a18', cheek: '#e04030', alc: '#f8f0e2', alcPink: '#f2a6c0', slur: '#faf6f2',
  slurPink: '#f08aa8', swirl: '#fbeef2', swirlPink: '#f4b4cc', mirror: '#cfe1ea',
};
const GROUP = 'Bistro';
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

const CL = { m: 'cloth' }, PL = { m: 'plain' }, GL = { m: 'gloss' }, WD = { m: 'wood' }, MT = { m: 'metal' }, GS = { m: 'glass' };
const BR = { m: 'metal', seg: 8 }, LT = { m: 'glow', seg: 10 };
const STL = { m: 'metal', tex: 'steel' };

/** A bottle of berry juice standing on h: green glass, a coloured label band and foil cap. */
const bottle = (x, h, z, label, cap = label, c = BS.bottle) => [
  C(x, h + 5, z, 2.2, 10, c, { m: 'gloss', seg: 10 }), C(x, h + 5, z, 2.3, 4, label, { m: 'plain', seg: 10 }),
  LA(x, h + 10, z, [[2.2, 0], [1.3, 1.6], [0.85, 2.6], [0.85, 5.2]], c, { m: 'gloss', seg: 8 }), C(x, h + 14.6, z, 0.95, 1.6, cap, { m: 'plain', seg: 8 }),
];
/** A stemmed glass standing on h. */
const wineGlass = (x, h, z) => LA(x, h, z, [[1.6, 0], [1.6, 0.3], [0.3, 0.6], [0.3, 3.4], [1.4, 4.2], [1.9, 6], [1.8, 7.4]], BS.glass, { m: 'glass', seg: 10 });
/** A white plate lying on h. */
const plate = (x, h, z, r = 4.6) => C(x, h + 0.4, z, r, 0.8, BS.white, { m: 'gloss', seg: 16, rb: r * 0.8 });
/** A gas burner seen on a cooktop at h: its grate and its blue ring of flame. */
const burner = (x, h, z) => [
  RG(x, h + 0.4, z, 2.2, 0.4, BS.flame, { m: 'glow', flat: true }),
  C(x, h + 0.5, z, 1.2, 1, BS.iron, { m: 'plain', seg: 8 }),
  RD([x - 3.8, h + 1.2, z], [x + 3.8, h + 1.2, z], 0.4, BS.iron, PL), RD([x, h + 1.2, z - 3.8], [x, h + 1.2, z + 3.8], 0.4, BS.iron, PL),
  RG(x, h + 1.2, z, 3.6, 0.4, BS.iron, { m: 'plain', flat: true }),
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
  const g = ctx();
  if (m === 'glass') { g.save(); g.globalAlpha *= 0.4; glassPane(x, y, w, h, BS.glass); g.restore(); return; }
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
    g.fillStyle = m === 'glass' ? BS.glass : l;
  } else g.fillStyle = m === 'glass' ? BS.glass : grad(g, x0, y0, x1, y1, c, m);
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
  const g = ctx(), [x0, y0, x1, y1] = bb, c = q.c, tc = q.tc || sh(c, -2), s = q.ts || 2.4;
  g.save(); g.clip(path);
  if (q.tex === 'stripe') {
    g.fillStyle = tc;
    for (let x = x0 + s / 2; x < x1; x += s * 2) g.fillRect(x, y0, s, y1 - y0);
  } else if (q.tex === 'tile') {
    g.fillStyle = tc;
    for (let y = y1, i = 0; y > y0; y -= s, i++) {
      g.fillRect(x0, y - 0.25, x1 - x0, 0.3);
      for (let x = x0 + (i % 2 ? s : 0); x < x1; x += s * 2) g.fillRect(x - 0.15, y - s, 0.3, s);
    }
  } else if (q.tex === 'steel') {
    for (let y = y0 + 0.4, i = 0; y < y1; y += 0.7, i++) {
      g.fillStyle = hash(i, 3, 7) < 0.5 ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.08)';
      const a = x0 + hash(i, 4, 7) * (x1 - x0) * 0.4; g.fillRect(a, y, (x1 - x0) * (0.3 + hash(i, 5, 7) * 0.6), 0.25);
    }
  } else if (q.tex === 'marble') {
    g.strokeStyle = tc; g.lineWidth = 0.3; g.globalAlpha = 0.7;
    const W = x1 - x0, H = y1 - y0, seed = Math.round(x0 * 7 + y0 * 3);
    for (let k = 0; k < 4; k++) {
      g.beginPath(); let x = x0 + hash(seed, k, 1) * W, y = y0;
      g.moveTo(x, y);
      while (y < y1 && x < x1 + 2) { x += 1 + hash(seed, k, Math.round(y * 9)) * 2.6; y += (hash(seed, k + 9, Math.round(x * 7)) - 0.3) * H * 0.5 + 0.3; g.lineTo(x, y); }
      g.stroke();
    }
  } else if (q.tex === 'check') {
    g.fillStyle = alphaOf(tc, 0.5);
    for (let x = x0 + s / 2; x < x1; x += s * 2) g.fillRect(x, y0, s, y1 - y0);
    for (let y = y0 + s / 2; y < y1; y += s * 2) g.fillRect(x0, y, x1 - x0, s);
  } else if (q.tex === 'cane') {
    g.strokeStyle = tc; g.lineWidth = 0.25; g.beginPath();
    const H = y1 - y0;
    for (let k = x0 - H; k < x1 + s; k += s) { g.moveTo(k, y0); g.lineTo(k + H, y1); g.moveTo(k + H, y0); g.lineTo(k, y1); }
    for (let x = x0; x < x1; x += s) { g.moveTo(x, y0); g.lineTo(x, y1); }
    g.stroke();
  } else if (q.tex === 'tuft') {
    g.strokeStyle = tc; g.lineWidth = 0.35; g.beginPath();
    const H = y1 - y0;
    for (let k = x0 - H; k < x1 + s * 2; k += s * 2) { g.moveTo(k, y1); g.lineTo(k + H, y0); g.moveTo(k + H, y1); g.lineTo(k, y0); }
    g.stroke();
    g.fillStyle = sh(tc, -1);
    for (let k = x0 - H, i = 0; k < x1 + s * 2; k += s * 2, i++) for (let j = 0; j < H / s; j++) {
      const px = k + s + j * s, py = y1 - s - j * s; if (px > x0 && px < x1 && py > y0) { g.beginPath(); g.arc(px, py, 0.45, 0, TAU); g.fill(); }
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
        if (q.tex) texture(q, polyPath(pts), bounds(pts));
        if (m !== 'glass') oval(cx, top, q.r, Math.min(q.r * 0.22, Math.max(0.3, q.hh / 2)), sh(q.c, m === 'glow' ? 2 : 1));
        break;
      }
      case 'ball': {
        const rx = side ? q.rz : q.rx; ball(cx, cy, rx, q.ry, q.c, m);
        break;
      }
      case 'disc': {
        const edge = q.ax === 'x' ? !side : side, ry = q.ry ?? q.r;
        if (edge) rbx(cx - q.th / 2, cy - ry, q.th, ry * 2, q.th / 2, q.c, m);
        else {
          ball(cx, cy, q.r, ry, q.c, m);
          if (q.tex) { const p = new Path2D(); p.ellipse(cx, cy, q.r, ry, 0, 0, TAU); texture(q, p, [cx - q.r, cy - ry, cx + q.r, cy + ry]); }
        }
        break;
      }
      case 'lathe': {
        const P = (dx, up) => [cx + flip * dx, cy - up];
        const rmax = Math.max(...q.pts.map(p => p[0]));
        const pts = [...q.pts.map(([r, up]) => P(-r, up)), ...q.pts.slice().reverse().map(([r, up]) => P(r, up))];
        poly(pts, q.c, m, m !== 'glow');
        if (q.tex) texture(q, polyPath(pts), bounds(pts));
        if (m === 'gloss' && rmax > 1.2) {
          const at = q.pts.find(p => p[0] === rmax), [hx, hy] = P(-rmax * 0.48, at[1] * 0.92);
          g.save(); g.globalAlpha *= 0.5; oval(hx, hy, rmax * 0.14, Math.max(0.4, at[1] * 0.1), '#ffffff'); g.restore();
        }
        if (q.pts[q.pts.length - 1][0] < 0.01 && q.pts.length > 2) break;
        if (m === 'glass') break;
        const [rt, ut] = q.pts[q.pts.length - 1];
        oval(cx, cy - ut, rt, rt * 0.22, sh(q.c, -2));
        break;
      }
      case 'ring': {
        const ry = q.ry ?? q.r;
        if (side && !q.flat) { if (q.arc) break; rbx(cx - q.tr, cy - ry - q.tr, q.tr * 2, (ry + q.tr) * 2, q.tr, q.c, m); break; }
        const a0 = q.arc ? -(q.a0 + q.arc) : 0, a1 = q.arc ? -q.a0 : TAU;
        const path = (dy = 0) => { g.beginPath(); if (q.flat) g.ellipse(cx, cy + dy, q.r, q.r * 0.22, 0, 0, TAU); else g.ellipse(cx, cy + dy, q.r, ry, 0, a0, a1); };
        g.lineCap = 'butt'; g.strokeStyle = m === 'glow' ? sh(q.c, 1) : q.c; g.lineWidth = q.tr * 2; path(); g.stroke();
        if (m !== 'plain') {
          g.save(); g.globalAlpha *= 0.45; g.strokeStyle = sh(q.c, 2); g.lineWidth = q.tr * 0.6;
          if (q.flat) { g.beginPath(); g.ellipse(cx, cy - q.tr * 0.4, q.r, q.r * 0.22, 0, Math.PI, TAU); } else path(-q.tr * 0.4);
          g.stroke(); g.restore();
        }
        break;
      }
      case 'rod': {
        const p0 = [U(q.a[0], q.a[2]), b - q.a[1]], p1 = [U(q.b[0], q.b[2]), b - q.b[1]];
        if (Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) < 0.05) { ball(p0[0], p0[1], q.r, q.r, q.c, m); break; }
        g.lineCap = 'round'; g.strokeStyle = m === 'glass' ? alphaOf(BS.glass, 0.4) : q.c; g.lineWidth = q.r * 2;
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

/** A chalkboard's slate, a little smudged. */
function slate(g, x, y, w, h) {
  g.fillStyle = BS.chalk; g.fillRect(x, y, w, h);
  for (let i = 0; i < 14; i++) { g.globalAlpha = 0.06; g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(x + hash(i, 1, 21) * w, y + hash(i, 2, 21) * h, 1.5 + hash(i, 3, 21) * 3, 0.6 + hash(i, 4, 21), 0, 0, TAU); g.fill(); }
  g.globalAlpha = 1;
}
function chalkText(g, text, x, y, size, c = BS.chalkL, maxW) {
  g.fillStyle = c; g.font = `bold ${size}px Georgia, serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, x, y, maxW);
}

/** The easel's menu: MENU over three dishes and their prices, a chalk swirl under the title. */
function menu(g, x, y, w, h) {
  slate(g, x, y, w, h);
  const cx = x + w / 2;
  chalkText(g, 'MENU', cx, y + h * 0.12, h * 0.13, BS.chalkL, w * 0.8);
  g.strokeStyle = BS.pecha; g.lineWidth = 0.35; g.beginPath(); g.moveTo(x + w * 0.22, y + h * 0.21); g.quadraticCurveTo(cx, y + h * 0.27, x + w * 0.78, y + h * 0.21); g.stroke();
  [['Soupe', '4'], ['Quiche', '6'], ['Crêpe', '5'], ['Tarte', '5']].forEach(([d, p], i) => {
    const yy = y + h * (0.36 + i * 0.15);
    g.fillStyle = BS.chalkL; g.font = `${h * 0.085}px Georgia, serif`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(d, x + w * 0.1, yy, w * 0.6);
    g.textAlign = 'right'; g.fillStyle = BS.butter; g.fillText(p, x + w * 0.9, yy);
    g.fillStyle = 'rgba(240,240,230,0.35)'; for (let k = x + w * 0.62; k < x + w * 0.8; k += 1.2) g.fillRect(k, yy + 0.4, 0.4, 0.3);
  });
}

/** The specials board: PLAT DU JOUR, two dishes, and a little chalk Swirlix in the corner. */
function specials(g, x, y, w, h) {
  slate(g, x, y, w, h);
  const cx = x + w / 2;
  chalkText(g, 'PLAT DU JOUR', cx, y + h * 0.16, h * 0.15, BS.butter, w * 0.86);
  g.strokeStyle = BS.chalkL; g.lineWidth = 0.3; g.beginPath(); g.moveTo(x + w * 0.16, y + h * 0.29); g.lineTo(x + w * 0.84, y + h * 0.29); g.stroke();
  g.font = `${h * 0.11}px Georgia, serif`; g.textBaseline = 'middle';
  [['Coq au vin', '12'], ['Ratatouille', '9'], ['Crème brûlée', '5']].forEach(([d, p], i) => {
    const yy = y + h * (0.44 + i * 0.17);
    g.fillStyle = BS.chalkL; g.textAlign = 'left'; g.fillText(d, x + w * 0.08, yy, w * 0.6);
    g.fillStyle = BS.pecha; g.textAlign = 'right'; g.fillText(p, x + w * 0.74, yy);
  });
  const sx = x + w * 0.87, sy = y + h * 0.66, r = h * 0.12;
  g.strokeStyle = BS.swirlPink; g.lineWidth = 0.4;
  for (const [dx, dy, k] of [[0, 0, 1], [-0.7, -0.6, 0.55], [0.7, -0.6, 0.55], [0, -1, 0.5]]) { g.beginPath(); g.arc(sx + dx * r, sy + dy * r, r * k, 0, TAU); g.stroke(); }
  g.fillStyle = BS.chalkL; g.beginPath(); g.arc(sx - r * 0.35, sy, 0.45, 0, TAU); g.arc(sx + r * 0.35, sy, 0.45, 0, TAU); g.fill();
  g.strokeStyle = BS.chalkL; g.lineWidth = 0.3; g.beginPath(); g.arc(sx, sy + r * 0.25, r * 0.25, 0.2, Math.PI - 0.2); g.stroke();
}

/** The pillar clock's dial: a cream face in a green ring, its hour marks and black hands at ten past ten. */
function dial(g, x, y, w, h) {
  const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2;
  g.fillStyle = BS.cream; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill();
  g.strokeStyle = BS.green; g.lineWidth = r * 0.08; g.beginPath(); g.arc(cx, cy, r * 0.92, 0, TAU); g.stroke();
  g.fillStyle = BS.ink;
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, k = i % 3 ? 0.05 : 0.09; g.beginPath(); g.arc(cx + Math.sin(a) * r * 0.74, cy - Math.cos(a) * r * 0.74, r * k, 0, TAU); g.fill(); }
  g.strokeStyle = BS.ink; g.lineCap = 'round';
  g.lineWidth = r * 0.09; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.sin(-1.05) * r * 0.42, cy - Math.cos(-1.05) * r * 0.42); g.stroke();
  g.lineWidth = r * 0.06; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.sin(1.05) * r * 0.62, cy - Math.cos(1.05) * r * 0.62); g.stroke();
  g.fillStyle = BS.brass; g.beginPath(); g.arc(cx, cy, r * 0.08, 0, TAU); g.fill();
}

/* ---------- the kinds ---------- */

/** What js/base-models-bistro.js builds for each upright and wall kind: its parts, doors and default material. */
export const BUILT = {};
/** The tile mat's outline from above, in painted units across its 2 x 2 tiles. */
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

/** A bare Edison bulb hung from a socket at (x, top, z). */
const edison = (x, top, z) => [C(x, top - 1.1, z, 1.2, 2.2, BS.brass, BR), S(x, top - 4.6, z, 2.1, 2.8, 2.1, BS.bulb, LT)];

export const BISTRO_KINDS = [
  // a big professional range in steel: six gas burners on the cooktop, a brass-handled oven door that opens, a tiled
  // splashback with a spice shelf, a copper saucepan on the back burner and a copper hood over it all
  piece('bstrange', 'Bistro range', 2, 1, 1650, 'metal', [
    ...[[4, -11], [60, -11], [4, 10], [60, 10]].map(([x, z]) => C(x, 1.5, z, 1.3, 3, BS.steelD, { m: 'metal', seg: 8 })),
    B(32, 16, -0.5, 62, 26, 27, BS.steel, STL),
    B(32, 29.6, -0.5, 63, 1.4, 28, BS.steelD, MT),
    B(32, 25.6, 13.4, 62, 5, 0.6, BS.steelL, MT),
    ...[7, 16, 25, 39, 48, 57].map(x => DS(x, 25.6, 14.2, 1.3, 1.2, BS.black, { m: 'gloss', seg: 10 })),
    B(52, 13, 13.6, 20, 18, 1, BS.steel, STL), DS(52, 19.4, 14.3, 1, 0.6, BS.brass, BR),
    ...[12, 32, 52].flatMap(x => [...burner(x, 30.3, -6), ...burner(x, 30.3, 6)]),
    C(52, 34.8, -6, 4.6, 6, BS.copper, { m: 'metal', seg: 16 }), RG(52, 37.8, -6, 4.6, 0.4, BS.copperL, { m: 'metal', flat: true }),
    RD([56.8, 36.8, -6], [62.6, 37.8, -6], 0.6, BS.brass, MT),
    C(12, 32.6, 6, 5, 2.2, BS.iron, { m: 'gloss', seg: 16 }), RD([7, 33.2, 6], [1.4, 34, 7], 0.6, BS.iron, GL),
    B(32, 45, -14.6, 62, 30, 1.6, BS.tile, { m: 'plain', tex: 'tile', tc: BS.grout, ts: 2.6 }),
    B(32, 50, -11.6, 56, 1, 5.6, BS.steelL, MT),
    ...[[18, BS.red], [23, BS.herb], [28, BS.gold], [36, BS.copper], [41, BS.cream], [46, BS.red]].map(([x, c]) => C(x, 52.6, -11.6, 1.5, 4.2, c, { m: 'gloss', seg: 8 })),
    PR(32, 60, -6, [[-31.6, 0], [31.6, 0], [24, 15], [-24, 15]], 20, BS.copper, MT),
    B(32, 61.2, -6, 63.4, 2.4, 20, BS.brass, MT),
    B(32, 81, -11, 18, 12, 9, BS.copper, MT), B(32, 86.6, -11, 19.4, 1.4, 10, BS.brass, MT),
  ], {
    doors: [{ hinge: [3, 13.5], side: 1, parts: [
      B(22, 13, 14.1, 38, 18, 1.2, BS.steel, STL),
      B(22, 13.6, 14.8, 24, 8, 0.3, '#3a2a22', GL),
      B(8, 20, 15, 1, 1, 1.2, BS.brass, MT), B(36, 20, 15, 1, 1, 1.2, BS.brass, MT),
      RD([7, 20, 15.4], [37, 20, 15.4], 0.5, BS.brass, MT),
    ] }],
    inside: { x: 22, h: 13, w: 34, hh: 16, z: 13.4 },
    glow: [BS.flame],
  }),

  // a steel prep table with an undershelf of bowls, a crate of onions and a stockpot; on top a chopping board with a
  // knife and carrots, tomatoes and a copper bowl, and a chef-hat Pikachu figure keeping an eye on it all
  piece('bstprep', 'Bistro prep table', 2, 1, 720, 'metal', [
    ...[[3, -12], [61, -12], [3, 12], [61, 12]].map(([x, z]) => B(x, 14.4, z, 2, 28.8, 2, BS.steel, MT)),
    B(32, 7, 0, 60, 1, 26, BS.steelD, MT),
    LA(14, 7.5, 0, [[3.2, 0], [6, 2.6], [6.8, 5.6]], BS.steelL, { m: 'metal', seg: 14 }), LA(14, 9, 0, [[2.6, 0], [5, 2.2], [5.8, 4.8]], BS.steel, { m: 'metal', seg: 14 }),
    B(36, 11, 0, 14, 7, 12, BS.woodL, WD),
    S(32.6, 15.2, -1, 2.2, 2, 2.2, BS.onion, CL), S(37, 15.6, 1, 2.2, 2, 2.2, BS.onion, CL), S(40.6, 15.2, -1.4, 2.2, 2, 2.2, BS.onion, CL),
    C(53, 11.2, 0, 5, 7.4, BS.steel, { m: 'metal', seg: 14 }),
    B(32, 29.6, 0, 62, 1.6, 28, BS.steelL, STL),
    B(32, 32.6, -13.4, 62, 4.4, 1.2, BS.steelL, MT),
    B(22, 31.1, 3, 24, 1.4, 14, BS.woodL, WD),
    B(27, 32.1, 6, 11, 0.4, 1.8, BS.steelL, MT), B(19.4, 32.2, 6, 4.4, 0.8, 1.4, BS.ink, GL),
    RD([12, 32.8, 0], [22, 32.6, -1], 1, BS.carrot, CL), RD([12, 32.8, 0], [9, 34, 0], 0.4, BS.herb, CL),
    RD([13, 32.8, 3.4], [21, 32.6, 2.6], 1, BS.carrot, CL), RD([13, 32.8, 3.4], [10, 34.2, 3.6], 0.4, BS.herb, CL),
    S(28.6, 33.8, -2, 2.2, 2, 2.2, BS.tomato, GL), S(31.6, 33.6, 0.6, 2, 1.8, 2, BS.tomato, GL),
    LA(39, 30.4, -6, [[2, 0], [4.6, 1.6], [5.6, 4.6]], BS.copper, { m: 'metal', seg: 14 }),
    RD([40, 33.6, -6], [43, 41, -7], 0.4, BS.steelL, MT), LA(40.4, 33.4, -6, [[0, 0], [1, 1.4], [1.2, 3]], BS.steelL, { m: 'metal', seg: 6 }),
    S(50.4, 31, 4, 1.2, 0.6, 1.4, BS.pika, CL), S(53.6, 31, 4, 1.2, 0.6, 1.4, BS.pika, CL),
    PR(57, 34, 0, [[0, 0], [2, 1], [1, 4], [4, 6], [3, 9], [7, 10], [5, 6], [6, 5], [3, 3], [4, 1.5]], 1, BS.pika, CL),
    S(52, 34.8, 2, 3.4, 4, 3, BS.pika, CL),
    S(48.8, 35.6, 3.6, 1, 1, 1, BS.pika, CL), S(55.2, 35.6, 3.6, 1, 1, 1, BS.pika, CL),
    S(52, 41.4, 2.4, 3.8, 3.2, 3.2, BS.pika, CL),
    RD([49.4, 43.4, 2], [46.6, 48.4, 2], 0.8, BS.pika, CL), RD([47.4, 47, 2], [46.6, 48.4, 2], 0.85, BS.ink, CL),
    RD([54.6, 43.4, 2], [57.4, 48.4, 2], 0.8, BS.pika, CL), RD([56.6, 47, 2], [57.4, 48.4, 2], 0.85, BS.ink, CL),
    C(52, 45.6, 2.4, 2.6, 2.4, BS.white, { m: 'cloth', seg: 12 }), S(52, 48, 2.4, 3.6, 2, 3.2, BS.white, { m: 'cloth', seg: 12 }),
    DS(50.6, 42, 5.3, 0.6, 0.3, BS.ink, { m: 'gloss', ry: 0.75, seg: 8 }), DS(53.4, 42, 5.3, 0.6, 0.3, BS.ink, { m: 'gloss', ry: 0.75, seg: 8 }),
    DS(49.2, 40.4, 4.6, 0.9, 0.3, BS.cheek, { m: 'plain', seg: 8 }), DS(54.8, 40.4, 4.6, 0.9, 0.3, BS.cheek, { m: 'plain', seg: 8 }),
    DS(52, 40.6, 5.5, 0.6, 0.3, BS.ink, { m: 'plain', ry: 0.3, seg: 6 }),
  ]),

  // the pass: a steel counter with cupboards, a gantry over it with a heat lamp glowing orange, order tickets on the rail,
  // plates waiting under it (steak and frites, a bowl of soup, an omelette) and a brass service bell
  piece('bstpass', 'Bistro pass counter', 2, 1, 1250, 'metal', [
    B(32, 1, 1, 60, 2, 24, BS.steelD, MT),
    B(32, 16, 0.5, 62, 28, 26, BS.steel, STL),
    ...[17, 47].flatMap(x => [B(x, 15, 14, 28, 22, 0.8, BS.steelL, STL), RD([x + (x < 32 ? 11 : -11), 11, 14.9], [x + (x < 32 ? 11 : -11), 19, 14.9], 0.4, BS.steelD, MT)]),
    B(32, 30.8, 0.5, 63, 1.6, 27, BS.steelL, STL),
    B(3, 51, -11, 2.4, 40, 2.4, BS.steel, MT), B(61, 51, -11, 2.4, 40, 2.4, BS.steel, MT),
    B(32, 71, -8, 62, 3, 8, BS.steelD, MT),
    B(32, 67, -4, 56, 4, 6, BS.steelD, MT), B(32, 64.6, -4, 52, 1, 5, BS.heat, { m: 'glow' }),
    B(32, 58, -11, 56, 1.6, 1.6, BS.steelL, MT),
    ...[10, 16, 22, 42, 49].flatMap(x => [B(x, 54.4, -10, 4.4, 6, 0.3, BS.white, PL), B(x, 56.2, -9.8, 4.4, 0.8, 0.2, BS.red, PL),
      B(x, 54.2, -9.8, 3, 0.35, 0.2, BS.ink, PL), B(x, 52.8, -9.8, 2.4, 0.35, 0.2, BS.ink, PL)]),
    plate(13, 31.6, -2, 5.6), S(12, 33.6, -2, 3, 1.2, 2.4, BS.steak, CL),
    RD([15, 33, 0], [18, 34.4, -2], 0.4, BS.fries, PL), RD([15.6, 33, 1], [18.4, 33.8, 0], 0.4, BS.fries, PL), RD([14.6, 33.2, -0.4], [17, 35, -3], 0.4, BS.fries, PL),
    S(10, 34.6, -1, 1, 0.8, 1, BS.herb, CL),
    plate(31, 31.6, 2, 5), LA(31, 32.4, 2, [[2.4, 0], [4, 1.6], [4.6, 3.6]], BS.white, { m: 'gloss', seg: 14 }), C(31, 35.6, 2, 4.2, 0.4, BS.soup, { m: 'plain', seg: 14 }),
    plate(46, 31.6, -2, 5), S(46, 33.4, -2, 3.6, 1.2, 2.4, BS.butter, CL), S(46.4, 34.6, -2, 0.8, 0.5, 0.8, BS.herb, CL),
    LA(57, 31.6, 6, [[3, 0], [3, 0.5], [2.6, 1.4], [1.6, 2.6], [0, 3]], BS.brass, { m: 'metal', seg: 12 }), C(57, 35, 6, 0.5, 1, BS.brassD, { m: 'metal', seg: 6 }),
  ], { glow: [BS.heat] }),

  // a tall copper stockpot on a cast-iron gas ring, its blue flame lit, soup at the rim and a ladle in it
  piece('bststockpot', 'Bistro stockpot', 1, 1, 480, 'metal', [
    ...[Math.PI / 2, Math.PI / 2 + TAU / 3, Math.PI / 2 - TAU / 3].flatMap(a => {
      const c = Math.cos(a), s = Math.sin(a);
      return [RD([16 + c * 9.4, 13, s * 9.4], [16 + c * 12, 0.8, s * 12], 0.9, BS.iron, GL), S(16 + c * 12, 0.8, s * 12, 1.2, 0.8, 1.2, BS.iron, { m: 'gloss', seg: 6 })];
    }),
    C(16, 9.6, 0, 3.6, 4, BS.iron, { m: 'gloss', seg: 10 }),
    RG(16, 12, 0, 5.4, 0.6, BS.flame, { m: 'glow', flat: true }),
    C(16, 13, 0, 10, 1.6, BS.iron, { m: 'gloss', seg: 18 }),
    C(16, 26.4, 0, 11, 25, BS.copper, { m: 'metal', seg: 20 }),
    C(16, 18.4, 0, 11.2, 1.4, BS.copperD, { m: 'metal', seg: 20 }), C(16, 35, 0, 11.2, 1.4, BS.copperD, { m: 'metal', seg: 20 }),
    RG(16, 38.9, 0, 11, 0.7, BS.copperL, { m: 'metal', flat: true }),
    C(16, 38.2, 0, 10.4, 0.4, BS.soup, { m: 'plain', seg: 18 }),
    RG(4.2, 33, 0, 2.4, 0.7, BS.brass, { m: 'metal', a0: Math.PI / 2, arc: Math.PI }), RG(27.8, 33, 0, 2.4, 0.7, BS.brass, { m: 'metal', a0: -Math.PI / 2, arc: Math.PI }),
    RD([20, 37, -3], [25, 52, -6], 0.6, BS.steelL, MT), S(25.2, 52.6, -6, 1.2, 0.8, 1.2, BS.steelL, { m: 'metal', seg: 6 }),
    RD([12, 37, 2], [8, 50, 4], 0.7, BS.woodL, WD), S(7.8, 50.8, 4, 1.2, 1.6, 0.6, BS.woodL, { m: 'wood', seg: 6 }),
  ], { glow: [BS.flame] }),

  // a tall steel fridge with a glass door that opens: shelves of berry-juice bottles, a cheese wheel, a milk jug, eggs,
  // butter and a pot of jam
  piece('bstfridge', 'Bistro glass fridge', 1, 1, 1150, 'metal', [
    B(16, 4, -1, 30, 8, 28, BS.steelD, MT), B(16, 4.5, 13.2, 26, 4, 0.4, BS.ink, PL),
    B(16, 9, -1, 30, 2, 28, BS.steel, MT), B(16, 77, -1, 30, 4, 28, BS.steel, STL),
    B(1.6, 43, -1, 3.2, 66, 28, BS.steel, STL), B(30.4, 43, -1, 3.2, 66, 28, BS.steel, STL),
    B(16, 43, -14, 26, 66, 1.2, BS.steelL, PL),
    ...[27, 45, 61].map(h => B(16, h, -1, 25.6, 0.8, 24, BS.steelL, MT)),
    ...bottle(7, 10, -1, BS.cream, BS.berry), ...bottle(12.6, 10, -1, BS.cream, BS.berryL), ...bottle(18.6, 10, -1, BS.cream, BS.gold), ...bottle(24.4, 10, -1, BS.cream, BS.berry),
    C(9.6, 30.2, -1, 5, 5.6, BS.cheese, { m: 'cloth', seg: 14 }), C(9.6, 30.2, -1, 5.1, 1.4, BS.cheeseD, { m: 'plain', seg: 14 }),
    LA(21, 27.4, -1, [[3, 0], [3.4, 2], [3.2, 6], [2, 8], [1.6, 10], [2.2, 10.6]], BS.white, { m: 'gloss', seg: 12 }),
    B(16, 46.6, -1, 18, 1.6, 10, BS.cream, PL), ...[9.6, 13.8, 18, 22.2].map(x => S(x, 49, -1, 1.6, 2, 1.6, BS.egg, GL)),
    B(25.6, 47, 2, 5, 3, 4, BS.butter, CL),
    ...bottle(8, 61.4, -2, BS.gold, BS.gold), ...bottle(14, 61.4, -2, BS.gold, BS.berry), C(22, 65, -1, 3, 6, BS.berryL, { m: 'gloss', seg: 12 }), C(22, 68.4, -1, 3.2, 1.2, BS.red, { m: 'cloth', seg: 12 }),
    B(16, 77.6, 13.4, 10, 2.4, 0.4, BS.brass, MT),
  ], {
    doors: [{ hinge: [1, 13.2], side: 1, parts: [
      B(16, 74.6, 14, 30, 4, 1.2, BS.steel, STL), B(16, 11.6, 14, 30, 4, 1.2, BS.steel, STL),
      B(3, 43, 14, 4, 60, 1.2, BS.steel, STL), B(29, 43, 14, 4, 60, 1.2, BS.steel, STL),
      B(16, 43, 14, 22, 60, 0.4, BS.glass, GS),
      RD([27.6, 32, 15.2], [27.6, 56, 15.2], 0.5, BS.brass, MT),
    ] }],
    inside: { x: 16, h: 43, w: 22, hh: 60, z: 13, bare: true },
  }),

  // the dish sink: two steel basins full of suds, a spring pre-rinse tap, a swing spout, plates drying in a wire rack and
  // a stack of clean plates and a bucket on the shelf under it
  piece('bstsink', 'Bistro dish sink', 2, 1, 820, 'metal', [
    ...[[3, -11], [61, -11], [3, 11], [61, 11]].map(([x, z]) => B(x, 11.6, z, 2, 23.2, 2, BS.steel, MT)),
    B(32, 5, 0, 60, 1, 24, BS.steelD, MT),
    C(16, 8, 0, 6, 5, BS.white, { m: 'gloss', seg: 16 }), LA(46, 5.5, 0, [[4, 0], [5, 7], [5.4, 8]], BS.steelL, { m: 'metal', seg: 14 }),
    B(32, 27, 0, 62, 8, 28, BS.steel, STL),
    B(18, 31.2, 1, 25, 0.5, 20, BS.steelD, PL), B(46, 31.2, 1, 25, 0.5, 20, BS.steelD, PL),
    S(13, 32, 2, 2.4, 1.2, 2.4, BS.white, PL), S(17, 32.4, -1, 2.6, 1.4, 2.6, BS.white, PL), S(21.6, 32, 3, 2, 1.1, 2, BS.white, PL),
    B(31.6, 31.8, 11, 3.4, 1.4, 2.4, BS.sponge, CL),
    B(32, 37, -13.6, 62, 12, 1.2, BS.steelL, STL),
    RD([32, 31, -11.6], [32, 58, -11.6], 0.8, BS.steelL, MT), C(32, 51, -11.6, 1.7, 8, BS.steelD, { m: 'metal', seg: 10 }),
    RD([32, 58, -11.6], [32, 60, -7], 0.6, BS.steelL, MT), RD([32, 60, -7], [32, 49, -5], 0.5, BS.steelD, MT), C(32, 47.4, -5, 1.2, 3.2, BS.steelL, { m: 'metal', seg: 8 }),
    RD([32, 41, -11.6], [22, 41, -6], 0.6, BS.steelL, MT), RD([22, 41, -6], [22, 38, -6], 0.5, BS.steelL, MT),
    DS(27.6, 37, -12.6, 1.4, 1, BS.steelL, { m: 'metal', seg: 8 }), DS(36.4, 37, -12.6, 1.4, 1, BS.steelL, { m: 'metal', seg: 8 }),
    RD([38, 31.8, -9], [58, 31.8, -9], 0.3, BS.steelL, MT), RD([38, 31.8, -1], [58, 31.8, -1], 0.3, BS.steelL, MT),
    ...[39, 57].map(x => RD([x, 31.8, -9], [x, 38, -9], 0.3, BS.steelL, MT)),
    ...[-8, -5.4, -2.8].map((z, i) => DS(46 + i * 1.6, 37.6, z, 6, 0.6, BS.white, { m: 'gloss', seg: 16 })),
  ]),

  // a zinc-topped bar in dark green panelling with a brass foot rail; a copper and brass coffee machine under its dome at
  // the back, cups on their saucers, a bottle of berry juice and two glasses
  piece('bstbar', 'Bistro zinc bar', 2, 1, 1500, 'wood', [
    B(32, 1.5, 2.4, 63, 3, 24.8, BS.woodD, WD),
    B(32, 18, 2, 62, 30, 24, BS.green, WD),
    B(17, 18, 14.3, 24, 22, 0.8, BS.greenL, WD), B(47, 18, 14.3, 24, 22, 0.8, BS.greenL, WD),
    B(32, 31.4, 14.4, 62, 1, 0.8, BS.brass, MT),
    ...[8, 32, 56].map(x => B(x, 4.6, 14.6, 1.2, 2.8, 1.4, BS.brass, MT)),
    RD([3, 6, 15.2], [61, 6, 15.2], 0.7, BS.brass, MT),
    B(32, 34, 0, 63, 2, 30, BS.zinc, MT),
    B(46, 38, -6, 20, 6, 12, BS.copperD, MT),
    C(46, 48, -6, 6, 14, BS.copper, { m: 'metal', seg: 16 }), C(46, 48, -6, 6.2, 1.4, BS.brass, { m: 'metal', seg: 16 }),
    LA(46, 55, -6, [[6, 0], [5, 2], [3, 3.6], [1, 4.6], [0.6, 6], [1.4, 7], [0, 8]], BS.brass, { m: 'metal', seg: 14 }),
    ...[40, 52].flatMap(x => [C(x, 42.6, 0.6, 1.6, 2, BS.steelL, { m: 'metal', seg: 8 }), RD([x, 41.6, 1.2], [x, 39, 1.6], 0.5, BS.ink, GL),
      RD([x, 44, 1], [x, 52, 2], 0.4, BS.ink, GL), S(x, 52.4, 2, 1, 1, 1, BS.ink, { m: 'gloss', seg: 6 })]),
    ...[[36, 7], [41, 9], [52, 8]].flatMap(([x, z]) => [C(x, 35.2, z, 2.2, 0.4, BS.white, { m: 'gloss', seg: 12 }), C(x, 36.6, z, 1.4, 2.4, BS.white, { m: 'gloss', seg: 10, rb: 1.1 })]),
    ...bottle(12, 35, -2, BS.cream, BS.berry), wineGlass(18, 35, 4), wineGlass(22, 35, 2),
  ]),

  // a bentwood chair in dark walnut: the bent back hoop with its inner loop, a woven cane seat, a ring between the legs
  piece('bstchair', 'Bistro bentwood chair', 1, 1, 260, 'wood', [
    RD([10.4, 17.4, 7], [9, 0.4, 9.4], 0.8, BS.wood, WD), RD([21.6, 17.4, 7], [23, 0.4, 9.4], 0.8, BS.wood, WD),
    RD([10.4, 0.4, -9], [10.4, 17.4, -5], 0.8, BS.wood, WD), RD([21.6, 0.4, -9], [21.6, 17.4, -5], 0.8, BS.wood, WD),
    RD([10.4, 17.4, -5], [9.6, 40, -6], 0.8, BS.wood, WD), RD([21.6, 17.4, -5], [22.4, 40, -6], 0.8, BS.wood, WD),
    RG(16, 40, -6, 6.4, 0.8, BS.wood, { m: 'wood', a0: 0, arc: Math.PI }),
    RG(16, 28.6, -5.4, 5.6, 0.6, BS.wood, { m: 'wood', ry: 8 }),
    RG(16, 7, 0.4, 9.8, 0.5, BS.wood, { m: 'wood', flat: true }),
    C(16, 18, 2, 9, 1.4, '#d8b878', { m: 'cloth', seg: 18, tex: 'cane', tc: '#a8844a', ts: 1.6 }),
    RG(16, 18, 2, 9, 0.7, BS.wood, { m: 'wood', flat: true }),
  ]),

  // a round marble table for two on a cast-iron foot, a brass rim, a glass carafe, two glasses and a red rose in a vase
  piece('bsttable', 'Bistro marble table', 1, 1, 420, 'gloss', [
    LA(16, 0, 0, [[9, 0], [9, 0.8], [6, 2], [2.4, 4], [1.6, 6]], BS.iron, { m: 'gloss', seg: 16 }),
    C(16, 16, 0, 1.4, 20, BS.iron, { m: 'gloss', seg: 10 }), C(16, 12, 0, 2, 1.4, BS.brass, { m: 'metal', seg: 10 }),
    C(16, 26.4, 0, 4, 1.6, BS.iron, { m: 'gloss', seg: 12 }),
    C(16, 28.6, 0, 12.8, 1.6, BS.marble, { m: 'gloss', seg: 24, tex: 'marble', tc: BS.vein }),
    RG(16, 28.6, 0, 12.8, 0.5, BS.brass, { m: 'metal', flat: true }),
    LA(10, 29.4, -3, [[2.2, 0], [2.6, 2], [2.2, 5], [1, 7], [0.9, 9], [1.2, 9.6]], BS.glass, { m: 'glass', seg: 12 }),
    wineGlass(16, 29.4, 5), wineGlass(20.6, 29.4, 3),
    LA(22, 29.4, -4, [[1.4, 0], [1.8, 1.4], [1, 4], [0.6, 6]], BS.cream, { m: 'gloss', seg: 10 }),
    RD([22, 35, -4], [22.6, 40, -4], 0.25, BS.herbD, PL), S(23.4, 37.6, -4, 1, 0.5, 0.6, BS.herb, CL),
    S(22.6, 41, -4, 1.6, 1.4, 1.6, BS.red, CL),
  ]),

  // a long banquette in tufted dark green leather on a walnut base, walnut arms and a brass rail along its top
  piece('bstbanquette', 'Bistro banquette', 2, 1, 1050, 'cloth', [
    B(32, 4, 1, 62, 8, 26, BS.woodD, WD),
    B(32, 11.2, 3, 56, 6.4, 22, BS.green, { m: 'cloth', r: 2 }),
    B(32, 27, -8.4, 56, 25, 6, BS.green, { m: 'cloth', r: 2, tex: 'tuft', tc: BS.greenD, ts: 3.2 }),
    B(32, 40.6, -8.8, 62, 2.4, 7.6, BS.wood, WD),
    B(2, 19, 0, 3.6, 22, 26, BS.wood, WD), B(62, 19, 0, 3.6, 22, 26, BS.wood, WD),
    B(2, 30.4, 0.6, 3.8, 1.4, 27, BS.woodL, WD), B(62, 30.4, 0.6, 3.8, 1.4, 27, BS.woodL, WD),
    ...[6, 32, 58].map(x => RD([x, 41.8, -11], [x, 50, -11], 0.4, BS.brass, MT)),
    RD([4, 50, -11], [60, 50, -11], 0.6, BS.brass, MT), S(4, 50, -11, 1, 1, 1, BS.brass, { m: 'metal', seg: 6 }), S(60, 50, -11, 1, 1, 1, BS.brass, { m: 'metal', seg: 6 }),
    B(14, 17.4, -3, 10, 6, 3, BS.cream, { m: 'cloth', r: 2 }),
  ]),

  // a square table under a red-and-white checked cloth: two places laid, a candle in a bottle and a pepper mill
  piece('bstcheck', 'Bistro checked table', 1, 1, 460, 'cloth', [
    ...[[5, -11], [27, -11], [5, 11], [27, 11]].map(([x, z]) => B(x, 9, z, 1.6, 18, 1.6, BS.woodD, WD)),
    B(16, 22.6, 0, 29, 10.4, 29, BS.white, { m: 'cloth', r: 0.6, tex: 'check', tc: BS.red, ts: 1.8 }),
    plate(16, 27.8, 8, 4.2), plate(16, 27.8, -8, 4.2),
    B(10.6, 28.1, 8, 0.6, 0.3, 6, BS.steelL, MT), B(21.4, 28.1, 8, 0.6, 0.3, 6, BS.steelL, MT),
    LA(10, 27.8, 0, [[2.2, 0], [2.2, 4], [1.2, 6], [0.9, 7.4]], BS.bottle, { m: 'gloss', seg: 10 }),
    C(10, 37, 0, 0.9, 4, BS.cream, { m: 'plain', seg: 8 }), S(9.4, 35.6, 0.6, 0.7, 1.4, 0.5, BS.cream, PL), S(10, 39.8, 0, 0.5, 0.9, 0.5, BS.butter, PL),
    LA(22, 27.8, 0, [[1.4, 0], [1.6, 1], [1, 3], [1.2, 5.4], [1.6, 6], [0.4, 7.4]], BS.wood, { m: 'wood', seg: 10 }),
  ]),

  // a chalkboard menu in a walnut frame on a wooden easel, a stick of chalk on its ledge
  piece('bstmenu', 'Bistro menu easel', 1, 1, 340, 'wood', [
    RD([16, 0.4, -12], [16, 56, -2], 0.8, BS.woodD, WD),
    RD([5, 0.4, 3], [12, 60, -0.6], 0.9, BS.woodL, WD), RD([27, 0.4, 3], [20, 60, -0.6], 0.9, BS.woodL, WD),
    B(16, 16.4, 3.4, 26, 1.6, 4, BS.woodL, WD), B(10, 17.6, 4.6, 3, 0.8, 0.8, BS.chalkL, PL),
    B(16, 36, 1.6, 26, 34, 1.6, BS.wood, WD),
    PC(16, 36, 2.45, 22, 30, menu),
  ]),

  // the specials blackboard on the wall: PLAT DU JOUR in chalk in a walnut frame hung on two brass chains, a chalk Swirlix
  wallPiece('bstspecials', 'Bistro specials board', 2, 380, 'wood', [
    RD([14, 74, 1], [22, 84, 0.6], 0.3, BS.brass, MT), RD([50, 74, 1], [42, 84, 0.6], 0.3, BS.brass, MT),
    S(22, 84, 0.6, 0.8, 0.8, 0.8, BS.brass, { m: 'metal', seg: 6 }), S(42, 84, 0.6, 0.8, 0.8, 0.8, BS.brass, { m: 'metal', seg: 6 }),
    B(32, 56, 1, 54, 38, 2, BS.wood, WD),
    PC(32, 56, 2.05, 48, 32, specials),
    B(32, 36.6, 2.4, 48, 1.4, 3, BS.woodL, WD), B(20, 37.6, 3, 3, 0.7, 0.8, BS.chalkL, PL), B(25, 37.6, 3, 2.4, 0.7, 0.8, BS.pecha, PL),
  ]),

  // a brass rail on the wall hung with copper: two frying pans, a saucepan, a lidded pot, a ladle and a whisk
  wallPiece('bstpans', 'Bistro copper pan rail', 2, 620, 'metal', [
    B(4, 76, 2, 2, 3, 4, BS.brassD, MT), B(60, 76, 2, 2, 3, 4, BS.brassD, MT),
    RD([2.6, 76, 4], [61.4, 76, 4], 0.8, BS.brass, MT),
    ...[9, 24, 37, 48, 56].map(x => RG(x, 74.6, 4, 1.2, 0.25, BS.steelD, { m: 'metal', a0: Math.PI, arc: Math.PI })),
    RD([9, 73.4, 4], [9, 64, 4], 0.7, BS.brass, MT), DS(9, 56, 3.4, 7.6, 1.4, BS.copper, { m: 'metal', seg: 20 }), RG(9, 56, 4.2, 7.2, 0.4, BS.copperL, MT),
    RD([24, 73.4, 4], [24, 66, 4], 0.6, BS.brass, MT), DS(24, 60, 3.4, 5.6, 1.4, BS.copper, { m: 'metal', seg: 18 }), RG(24, 60, 4.2, 5.2, 0.4, BS.copperL, MT),
    RG(37, 71.6, 4.6, 2, 0.4, BS.brass, { m: 'metal', a0: 0, arc: Math.PI }),
    LA(37, 54, 4.6, [[4.4, 0], [5, 1], [5, 9], [5.4, 10]], BS.copper, { m: 'metal', seg: 14 }), LA(37, 64, 4.6, [[5.4, 0], [4.6, 1.2], [1, 2.2], [1, 3], [1.6, 3.6], [0, 4]], BS.copperL, { m: 'metal', seg: 14 }),
    RG(31.6, 60, 4.6, 1.2, 0.4, BS.brass, { m: 'metal', a0: Math.PI / 2, arc: Math.PI }), RG(42.4, 60, 4.6, 1.2, 0.4, BS.brass, { m: 'metal', a0: -Math.PI / 2, arc: Math.PI }),
    RD([48, 73.4, 4], [48, 54, 4], 0.4, BS.brass, MT), LA(48, 49.6, 4, [[0, 0], [2.4, 0.6], [2.8, 2.2], [2.6, 3]], BS.copper, { m: 'metal', seg: 10 }),
    RD([56, 73.4, 4], [56, 62, 4], 0.45, BS.steelL, MT), LA(56, 51, 4, [[0, 0], [1.6, 2], [2.2, 5], [2, 8], [0.6, 11]], BS.steelL, { m: 'glass', seg: 8 }),
    RD([54.6, 52, 4], [56, 62, 4], 0.2, BS.steelL, MT), RD([57.4, 52, 4], [56, 62, 4], 0.2, BS.steelL, MT), RD([56, 51, 4], [56, 62, 4], 0.2, BS.steelL, MT),
  ]),

  // a walnut rack on the wall hung with bundles of bay, rosemary and lavender, a braid of garlic and a string of onions
  wallPiece('bstherbs', 'Bistro herb rack', 1, 280, 'wood', [
    B(16, 74, 1, 30, 4, 2, BS.wood, WD),
    ...[4, 10, 22, 28].map(x => DS(x, 72, 2.4, 0.8, 1.2, BS.brassD, BR)),
    ...[[4, BS.herb], [10, BS.lavender], [28, BS.herbD]].flatMap(([x, c]) => [
      RD([x, 72, 2.6], [x, 66, 3], 0.3, BS.creamD, PL),
      LA(x, 50, 3, [[0, 0], [1.6, 3], [2.6, 8], [2.2, 12], [0.8, 15], [0.8, 16]], c, { m: 'cloth', seg: 8 }),
      C(x, 64.6, 3, 0.9, 1.4, BS.redD, { m: 'plain', seg: 6 }),
    ]),
    RD([16, 72, 2], [16, 44, 3], 0.4, BS.creamD, PL),
    ...[68, 63.4, 58.8, 54.2, 49.6].flatMap((h, i) => [S(16 + (i % 2 ? 1.2 : -1.2), h, 3, 2.2, 2.4, 2.2, BS.garlic, CL)]),
    S(16, 45, 3, 1.8, 2, 1.8, BS.garlic, CL),
    RD([22, 72, 2.4], [22, 48, 3], 0.3, BS.creamD, PL),
    ...[66, 60.4, 54.8].map(h => S(22, h, 3, 2.4, 2.4, 2.4, BS.onion, GL)),
  ]),

  // a brass wall sconce with two curved arms, each an Edison bulb in a clear glass tulip shade
  wallPiece('bstsconce', 'Bistro brass sconce', 1, 360, 'metal', [
    DS(16, 62, 0.6, 3.6, 1.2, BS.brass, { m: 'metal', seg: 14 }), S(16, 57.6, 0.8, 1, 1.6, 1, BS.brass, { m: 'metal', seg: 6 }),
    RD([16, 62, 1.2], [8, 65.4, 5], 0.6, BS.brass, MT), RD([16, 62, 1.2], [24, 65.4, 5], 0.6, BS.brass, MT),
    ...[8, 24].flatMap(x => [C(x, 66.4, 5, 1.4, 2, BS.brass, { m: 'metal', seg: 8 }), S(x, 70.6, 5, 2, 2.8, 2, BS.bulb, LT),
      LA(x, 67.4, 5, [[1.6, 0], [3.4, 2], [4.2, 5], [4.2, 8.2]], BS.glass, { m: 'glass', seg: 12 })]),
  ], { glow: [BS.bulb] }),

  // a tall brass floor lamp on a round foot, three curved arms each hung with a bare Edison bulb
  piece('bstlamp', 'Bistro Edison lamp', 1, 1, 560, 'metal', [
    LA(16, 0, 0, [[8, 0], [8, 1], [5, 2.4], [2, 4], [1.4, 6]], BS.brass, { m: 'metal', seg: 16 }),
    C(16, 37, 0, 0.8, 62, BS.brass, { m: 'metal', seg: 8 }), S(16, 36, 0, 1.4, 1.2, 1.4, BS.brassL, { m: 'metal', seg: 8 }),
    S(16, 68.4, 0, 1.6, 1.6, 1.6, BS.brass, { m: 'metal', seg: 8 }), LA(16, 69.6, 0, [[1, 0], [0.6, 2], [0, 3.4]], BS.brassL, { m: 'metal', seg: 8 }),
    RD([16, 68, 0], [5, 70.4, 0], 0.5, BS.brass, MT), RD([16, 68, 0], [27, 70.4, 0], 0.5, BS.brass, MT), RD([16, 68, 0], [16, 70.4, -9], 0.5, BS.brass, MT),
    ...[[5, 0], [27, 0], [16, -9]].flatMap(([x, z]) => [RD([x, 70.4, z], [x, 67.4, z], 0.4, BS.brass, MT), ...edison(x, 67.4, z)]),
  ], { glow: [BS.bulb] }),

  // a Paris pillar clock in green cast iron: a fluted column on its round foot, a brass collar and a double face
  piece('bstclock', 'Bistro pillar clock', 1, 1, 680, 'metal', [
    LA(16, 0, 0, [[9, 0], [9, 2], [7, 3], [6.4, 6], [4, 8], [3, 10]], BS.green, { m: 'metal', seg: 16 }),
    C(16, 30, 0, 2, 40, BS.green, { m: 'metal', seg: 10 }), C(16, 30, 0, 2.6, 1.6, BS.brass, { m: 'metal', seg: 10 }), C(16, 11, 0, 3.2, 1.4, BS.brass, { m: 'metal', seg: 10 }),
    LA(16, 50, 0, [[2, 0], [4, 2], [5, 4], [5, 5]], BS.green, { m: 'metal', seg: 12 }),
    DS(16, 64.4, 0, 10, 6, BS.green, { m: 'metal', seg: 20 }),
    RG(16, 64.4, 3.1, 8.4, 0.7, BS.brass, MT), DS(16, 64.4, -3.1, 7.6, 0.4, BS.cream, { m: 'plain', seg: 16 }),
    PC(16, 64.4, 3.05, 15, 15, dial),
    LA(16, 74, 0, [[2, 0], [1.6, 2], [0.6, 3], [1.4, 4.4], [0, 6]], BS.brass, { m: 'metal', seg: 10 }),
  ]),

  // a black-and-white hexagon tile mat edged in green
  { id: 'bstrug', name: 'Bistro hex tile mat', group: GROUP, solo: true, w: 2, h: 2, layer: 'rug', price: 420, high: 0.03, side: 'c', flat() {
    const g = ctx();
    g.fillStyle = BS.greenD; g.fillRect(1, 1, 62, 62);
    g.fillStyle = BS.green; g.fillRect(2.4, 2.4, 59.2, 59.2);
    g.fillStyle = BS.grout; g.fillRect(4, 4, 56, 56);
    g.save(); g.beginPath(); g.rect(4, 4, 56, 56); g.clip();
    const r = 2.6, hx = r * Math.sqrt(3);
    for (let j = 0, y = 4; y < 62; y += r * 1.5, j++) for (let i = 0, x = 4 + (j % 2 ? hx / 2 : 0); x < 62; x += hx, i++) {
      const dark = (i + j * 2) % 7 === 0 || hash(i, j, 31) < 0.06;
      g.fillStyle = dark ? BS.black : BS.white;
      g.beginPath();
      for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3, px = x + Math.cos(a) * (r - 0.3), py = y + Math.sin(a) * (r - 0.3); k ? g.lineTo(px, py) : g.moveTo(px, py); }
      g.closePath(); g.fill();
    }
    g.restore();
    g.strokeStyle = BS.black; g.lineWidth = 1; g.strokeRect(4.5, 4.5, 55, 55);
  } },

  // a tall walnut rack of berry-juice bottles lying in their cubbies, their necks in coloured foil, a basket of Oran, Pecha and Cheri berries on top
  piece('bstrack', 'Bistro bottle rack', 1, 1, 640, 'wood', [
    ...[[3, -9], [29, -9], [3, 9], [29, 9]].map(([x, z]) => B(x, 40, z, 2.4, 80, 2.4, BS.woodD, WD)),
    ...[4, 20, 36, 52, 68].map(h => B(16, h, 0, 24, 1.2, 20, BS.wood, WD)),
    B(11.4, 36, 0, 1, 64, 20, BS.wood, WD), B(20.6, 36, 0, 1, 64, 20, BS.wood, WD),
    B(16, 80, 0, 30, 1.6, 22, BS.woodD, WD),
    ...[4.6, 20.6, 36.6, 52.6].flatMap((s, r) => [7.2, 16, 24.8].flatMap((x, c) => [2.4, 7.2].flatMap((dh, k) => {
      const cap = [BS.berry, BS.berryL, BS.gold, BS.red][(r + c + k) % 4];
      return [RD([x, s + dh, -8], [x, s + dh, 3], 2.2, BS.bottle, GL), RD([x, s + dh, 3], [x, s + dh, 7.6], 0.95, cap, PL)];
    }))),
    C(16, 72, 0, 6, 5, BS.woodL, { m: 'cloth', seg: 12, rb: 5 }),
    S(13, 75, -1, 1.8, 1.8, 1.8, BS.oran, GL), S(17, 75.4, 1, 1.8, 1.6, 1.8, BS.pecha, GL), S(19.6, 75, -1.4, 1.6, 1.6, 1.6, BS.cheri, GL),
  ]),

  // a walnut cheese cart on side wheels: a board of a Comté wheel, a wedge, a brie under a glass cloche, grapes and a
  // baguette; more bread and a lying bottle on the shelf below, a brass handle at its side
  piece('bstcart', 'Bistro cheese cart', 1, 1, 580, 'wood', [
    ...[[3.6, -9], [28.4, -9], [3.6, 9], [28.4, 9]].map(([x, z]) => B(x, 15, z, 1.6, 22, 1.6, BS.wood, WD)),
    ...[[2.2, -7], [2.2, 7], [29.8, -7], [29.8, 7]].map(([x, z]) => DS(x, 3.4, z, 3.4, 1, BS.iron, { m: 'gloss', seg: 14, ax: 'x' })),
    B(16, 9, 0, 26, 1.2, 20, BS.woodL, WD), B(16, 25, 0, 26, 1.6, 20, BS.woodL, WD),
    RD([3.6, 28, 9], [28.4, 28, 9], 0.4, BS.brass, MT), RD([3.6, 28, -9], [28.4, 28, -9], 0.4, BS.brass, MT),
    ...[[3.6, -9], [28.4, -9], [3.6, 9], [28.4, 9]].map(([x, z]) => RD([x, 25.8, z], [x, 28, z], 0.4, BS.brass, MT)),
    RD([28.4, 25.8, -7], [31.2, 33, -7], 0.45, BS.brass, MT), RD([28.4, 25.8, 7], [31.2, 33, 7], 0.45, BS.brass, MT), RD([31.2, 33, -7], [31.2, 33, 7], 0.6, BS.brass, MT),
    B(14, 26.6, 0, 20, 1.4, 14, BS.woodD, WD),
    C(9, 30, -2, 4.4, 5.4, BS.cheese, { m: 'cloth', seg: 14 }), C(9, 30, -2, 4.5, 1, BS.cheeseD, { m: 'plain', seg: 14 }),
    PR(16, 27.3, 2, [[0, 0], [7, 0], [0, 4.4]], 4, BS.cheese, CL),
    C(20.6, 28.3, -3, 3, 2, BS.brie, { m: 'cloth', seg: 12 }),
    LA(20.6, 27.3, -3, [[3.8, 0], [3.8, 2], [3, 4.6], [1.4, 6], [0.4, 6.6], [0.6, 7.6], [0, 8]], BS.glass, { m: 'glass', seg: 12 }),
    RD([5, 28.6, 5.4], [25, 29.6, 6.4], 1.4, BS.bread, CL),
    S(25, 29, 2.6, 1.2, 1.2, 1.2, BS.grape, GL), S(26.6, 29, 1, 1.2, 1.2, 1.2, BS.grape, GL), S(25.6, 30.6, 1.6, 1.2, 1.2, 1.2, BS.grape, GL),
    RD([6, 11, -3], [26, 11, -4], 1.4, BS.breadD, CL), RD([6, 11.4, 2], [24, 11.4, 1], 1.4, BS.bread, CL),
    RD([8, 11.6, 6.6], [20, 11.6, 6.6], 2, BS.bottle, GL), RD([20, 11.6, 6.6], [24, 11.6, 6.6], 0.8, BS.bottle, GL),
  ]),

  // a two-tier brass dessert trolley: a strawberry cake on a stand with Alcremie beside it on the top tier, a pyramid of
  // profiteroles and a fruit tart under a glass dome below
  piece('bsttrolley', 'Bistro dessert trolley', 1, 1, 760, 'metal', [
    ...[[3, -8], [3, 8], [29, -8], [29, 8]].map(([x, z]) => DS(x, 2, z, 2, 0.8, BS.iron, { m: 'gloss', seg: 10, ax: 'x' })),
    ...[[3.6, -9], [3.6, 9], [28.4, -9], [28.4, 9]].map(([x, z]) => RD([x, 3.6, z], [x, 34, z], 0.6, BS.brass, MT)),
    RD([3.6, 34, -9], [3.6, 34, 9], 0.6, BS.brass, MT), RD([28.4, 34, -9], [28.4, 34, 9], 0.6, BS.brass, MT),
    B(16, 11, 0, 26, 1, 18, BS.brass, MT), B(16, 26, 0, 26, 1, 18, BS.brass, MT),
    RD([3.6, 28.4, 9], [28.4, 28.4, 9], 0.35, BS.brassL, MT),
    LA(11, 26.5, 0, [[3, 0], [3, 0.6], [1, 1.4], [0.8, 4], [6.4, 4.6], [6.4, 5.4]], BS.white, { m: 'gloss', seg: 16 }),
    C(11, 35.6, 0, 5.6, 7.2, BS.white, { m: 'cloth', seg: 16 }), C(11, 35.6, 0, 5.7, 1.4, BS.alcPink, { m: 'plain', seg: 16 }),
    ...[[8.6, -1], [11, 1.6], [13.4, -1]].map(([x, z]) => S(x, 40, z, 1.2, 1.3, 1.2, BS.cheri, GL)),
    S(23, 30.4, 1, 4.2, 4, 3.6, BS.alc, CL),
    LA(23, 33.6, 1, [[4.4, 0], [4.6, 1.4], [3.4, 2.4], [3.6, 3.4], [2.4, 4.4], [2.4, 5.2], [1, 6.4], [0, 7]], BS.alcPink, { m: 'cloth', seg: 12 }),
    S(23, 41.4, 1, 1.4, 1.6, 1.4, BS.cheri, GL), S(23, 43, 1, 0.8, 0.4, 0.8, BS.herb, CL),
    S(18.8, 30.6, 2, 1, 0.9, 1, BS.alc, CL), S(27.2, 30.6, 2, 1, 0.9, 1, BS.alc, CL),
    DS(21.6, 31, 4.3, 0.5, 0.3, BS.ink, { m: 'gloss', ry: 0.8, seg: 8 }), DS(24.4, 31, 4.3, 0.5, 0.3, BS.ink, { m: 'gloss', ry: 0.8, seg: 8 }),
    DS(20.4, 29.6, 3.8, 0.7, 0.3, BS.alcPink, { m: 'plain', seg: 8 }), DS(25.6, 29.6, 3.8, 0.7, 0.3, BS.alcPink, { m: 'plain', seg: 8 }),
    ...[[7.4, -1], [11, -2], [9.2, 2], [9.2, -0.4, 1]].map(([x, z, up]) => S(x, 13.4 + (up ? 3 : 0), z, 2, 1.8, 2, BS.choux, CL)),
    RD([7, 17.4, 0], [11.4, 14, 1.6], 0.4, BS.choc, PL),
    C(22, 12.4, 0, 4.4, 1.6, BS.tart, { m: 'cloth', seg: 14 }), S(20.6, 13.6, 0.6, 1, 0.5, 1, BS.cheri, GL), S(23.4, 13.6, -0.6, 1, 0.5, 1, BS.oran, GL),
    LA(22, 11.5, 0, [[5, 0], [5, 1.6], [4.2, 4.6], [2.4, 6.6], [0.6, 7.4], [0.7, 8.4], [0, 8.8]], BS.glass, { m: 'glass', seg: 12 }),
  ]),

  // a bentwood coat stand: four curved feet, a chef's apron, a red scarf and a black beret on its hooks and an umbrella
  // leaning at its foot
  piece('bstcoat', 'Bistro coat stand', 1, 1, 300, 'wood', [
    ...[[9, 0], [-9, 0], [0, 9], [0, -9]].map(([dx, dz]) => RD([16, 10, 0], [16 + dx, 0.6, dz], 0.9, BS.wood, WD)),
    RG(16, 7, 0, 3.6, 0.5, BS.wood, { m: 'wood', flat: true }),
    C(16, 40, 0, 1.2, 72, BS.wood, { m: 'wood', seg: 8 }), S(16, 77, 0, 1.8, 1.8, 1.8, BS.wood, { m: 'wood', seg: 8 }),
    ...[[-7, 0], [7, 0], [0, 7], [0, -7]].flatMap(([dx, dz]) => [RD([16, 70, 0], [16 + dx, 74, dz], 0.6, BS.wood, WD), S(16 + dx, 74, dz, 0.9, 0.9, 0.9, BS.wood, { m: 'wood', seg: 6 })]),
    S(9, 75.2, 0, 4, 1.3, 4, BS.beret, { m: 'cloth', seg: 12 }), RD([9, 76.4, 0], [9, 77.6, 0], 0.4, BS.beret, CL),
    B(23.4, 60, 0, 4, 26, 1.6, BS.scarf, { m: 'cloth', tex: 'stripe', tc: BS.cream, ts: 1.2 }),
    RD([13.6, 73, 7.4], [12.4, 66, 7.6], 0.3, BS.apron, PL), RD([18.4, 73, 7.4], [19.6, 66, 7.6], 0.3, BS.apron, PL),
    B(16, 52, 7.8, 9, 28, 0.8, BS.apron, CL), B(16, 46, 8.4, 6, 4, 0.3, BS.creamD, PL),
    LA(4.2, 1, 4, [[0.3, 0], [1.6, 4], [2, 24], [1.4, 30], [0.4, 33]], BS.beret, { m: 'cloth', seg: 8 }), RG(5, 35.4, 4, 1.4, 0.45, BS.woodL, { m: 'wood', a0: 0, arc: Math.PI }),
    RD([4.2, 33, 4], [3.6, 35.4, 4], 0.4, BS.woodL, WD),
  ]),

  // a maître d's stand in dark green with a brass plate: the open reservations book, a pen, and Swirlix perched beside it
  piece('bstlectern', "Bistro maître d' stand", 1, 1, 520, 'wood', [
    B(16, 1.5, 0, 24, 3, 18, BS.woodD, WD),
    B(16, 20, 0, 20, 34, 14, BS.green, WD),
    B(16, 20, 7.4, 15, 26, 0.8, BS.greenL, WD), B(16, 30, 7.9, 10, 3, 0.4, BS.brass, MT),
    B(16, 38.4, 0.6, 26, 2.8, 20, BS.woodD, WD), B(16, 37.4, 10.7, 26, 0.8, 0.6, BS.brass, MT),
    B(12, 40.2, 2, 14, 0.8, 10, BS.redD, CL), B(9, 41, 2, 6.6, 0.8, 9, BS.cream, PL), B(15.2, 41, 2, 6.6, 0.8, 9, BS.cream, PL),
    RD([13, 41.6, 4], [18, 41.6, 1], 0.3, BS.ink, GL),
    S(23.6, 42.8, -2, 3.6, 3, 3.2, BS.swirl, CL), S(23.6, 46.2, -2.4, 3, 2.4, 2.8, BS.swirlPink, CL), S(23.6, 48.6, -2.6, 1.6, 1.4, 1.4, BS.swirl, CL),
    S(20.4, 46, -2.4, 1.4, 1.2, 1.2, BS.swirl, CL), S(26.8, 46, -2.4, 1.4, 1.2, 1.2, BS.swirl, CL),
    DS(22.4, 43.6, 1, 0.45, 0.3, BS.ink, { m: 'gloss', ry: 0.6, seg: 8 }), DS(24.8, 43.6, 1, 0.45, 0.3, BS.ink, { m: 'gloss', ry: 0.6, seg: 8 }),
    DS(23.6, 42.2, 1.1, 0.6, 0.3, BS.slurPink, { m: 'plain', ry: 0.35, seg: 8 }),
  ]),

  // a cream pastry counter with a marble top: Slurpuff piping cream onto a cake on a turntable, pink rosettes on top
  piece('bstslurpuff', 'Bistro Slurpuff pastry counter', 1, 1, 700, 'wood', [
    B(16, 1.2, 0, 29, 2.4, 21, BS.green, WD),
    B(16, 15.6, 0, 28, 26.4, 20, BS.cream, WD),
    B(16, 15.6, 10.3, 22, 20, 0.6, BS.creamD, WD), B(16, 27, 10.4, 26, 1, 0.6, BS.green, WD),
    B(16, 29.6, 0, 30, 1.6, 22, BS.marble, { m: 'gloss', tex: 'marble', tc: BS.vein }),
    LA(22, 30.4, -1, [[3.6, 0], [3.6, 0.6], [1, 1.4], [1, 3], [5.6, 3.4], [5.6, 4.2]], BS.steelL, { m: 'metal', seg: 14 }),
    C(22, 38.2, -1, 5.2, 7, BS.cream, { m: 'cloth', seg: 14 }), C(22, 35.2, -1, 5.3, 1, BS.choc, { m: 'plain', seg: 14 }),
    ...[[19.6, -1], [22, 1.4], [24.4, -1]].map(([x, z]) => S(x, 42.4, z, 1.1, 0.9, 1.1, BS.slurPink, CL)),
    S(7.6, 31, 3, 1.4, 0.7, 1.4, BS.slur, CL), S(11.6, 31, 3, 1.4, 0.7, 1.4, BS.slur, CL),
    S(9.6, 36.4, 1, 5.4, 5.6, 4.4, BS.slur, CL),
    RD([6, 41, 1], [4.4, 45, 1], 1.2, BS.slurPink, CL), RD([13.2, 41, 1], [14.8, 45, 1], 1.2, BS.slurPink, CL),
    ...[8, 9.6, 11.2].map(x => S(x, 42.2, 0.6, 1, 0.9, 1, BS.slurPink, CL)),
    DS(8, 38.4, 5.1, 0.7, 0.3, BS.ink, { m: 'gloss', ry: 1, seg: 8 }), DS(11.2, 38.4, 5.1, 0.7, 0.3, BS.ink, { m: 'gloss', ry: 1, seg: 8 }),
    S(9.6, 36.8, 5.2, 0.9, 0.7, 0.6, BS.slurPink, GL),
    RD([13.6, 35.6, 2], [16.4, 38.6, 3], 1, BS.slur, CL),
    LA(17.4, 41.4, 2, [[0, 0], [1.6, 3.4], [2, 6]], BS.white, { m: 'cloth', seg: 8 }), S(17.4, 47.6, 2, 1.2, 0.8, 1.2, BS.slurPink, CL),
    S(18.4, 41.8, 1, 1, 0.7, 1, BS.white, CL),
  ]),
];
