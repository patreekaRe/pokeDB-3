/* base-furniture-ramen.js  -  the Ramen shop set (furniture expansion session i, 2026-10-17): a whole room of a small,
   steamy late-night ramen-ya, as Animal Crossing's Happy Home Paradise does a room type. Dark stained wood and red
   lacquer, black and red with yellow signage, red paper lanterns that glow, steel stockpots and a noodle boiler (they
   steam when tapped), wooden menu tags and posters, a glowing ticket machine, neon and a lit signboard. Psyduck at the
   noodle table, a Magikarp-shaped fishcake in the giant bowl, Slowpoke on the poster, a Lechonk regular on its stool
   and Snorlax with the biggest bowl in the house for the Pokémon touches. All solo, fixed colours, sold all year.
   An upright piece is a list of parts in painted units (32 a tile), as in js/base-furniture-ranch.js: `x` across from
   the left of its front, `h` up from the floor (a wall piece's from the foot of its strip), `z` out to the front from
   its middle (a wall piece's from the wall). They're painted here from any side, and js/base-models-ramen.js builds the
   same list as 3D parts (BUILT), so picture and model agree. `tex` is painted only (the model stays plain colour):
   `grain` a stained board's streaks (`pd: 'h'` for boards laid across), `noodle` wavy noodles, `mesh` a strainer
   basket's weave, `hribs` a paper lantern's ribs. A `pic` part (the menu tags, the poster, the clock's dial, the signs'
   words) is painted on the front only, and the model wears that crop of the painting. The drinks fridge's glass door
   swings (`doors`, `inside`). The floor mat is painted from above (RUG). */

import { sh, oval, ovalShade, floorShadow, ctx, hash, glass as glassPane } from './base-paint.js';

export const RM = {
  wood: '#6a4028', woodL: '#8a5a38', woodD: '#45281a', woodK: '#2a1810', red: '#b4231c', redD: '#7e1612', redL: '#d63c2c',
  black: '#1f1b1a', blackL: '#3c3634', yellow: '#f4c430', yellowD: '#c8941c', cream: '#f0e4c8', paper: '#efe0bc', ivory: '#e8e3da',
  steel: '#a8afb3', steelL: '#cdd3d6', steelD: '#727a7e', water: '#bcd8e2', broth: '#c98538', brothL: '#e0a456',
  noodle: '#f0d27a', chashu: '#b06a44', chashuL: '#e2aa84', egg: '#f7f1e2', yolk: '#f2a01c', nori: '#22302a', scallion: '#68a848',
  menma: '#c89c50', corn: '#f2cc40', chilli: '#c4301a', amber: '#d8902e', soy: '#3a1c12', ginger: '#f0a0a8',
  cola: '#5a2618', ramune: '#7cc8c0', orange: '#f08a1e', milk: '#f6f4ee', bowlW: '#f4f0e6',
  glowR: '#ff6448', glowY: '#ffd65a', glowP: '#fff0ba', flame: '#58aaff', neonR: '#ff3c4c',
  lech: '#6c6872', lechL: '#b8b4bc', lechD: '#2e2a32', lechNose: '#e8b2b6',
  snor: '#3c6a76', snorC: '#efe0bc', psy: '#f2cc3c', bill: '#f4e0a4', karp: '#e85a2c', karpL: '#fbeee4', slow: '#f2a0b8', slowL: '#f8e0c0',
};
const GROUP = 'Ramen shop';
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

const CL = { m: 'cloth' }, PL = { m: 'plain' }, GL = { m: 'gloss' }, WD = { m: 'wood' }, MT = { m: 'metal' }, GW = { m: 'glow' };
const GR = { m: 'wood', tex: 'grain' }, GRH = { m: 'wood', tex: 'grain', pd: 'h' }, NOO = { m: 'cloth', tex: 'noodle' };

/** A ramen bowl standing at x, h, z, r round its rim: the outside (black by default) with a red band under the rim,
    broth to the brim and a mound of noodles. */
const bowl = (x, h, z, r, out = RM.black, band = RM.red, seg = 14) => [
  LA(x, h, z, [[r * 0.42, 0], [r * 0.46, r * 0.1], [r * 0.6, r * 0.12], [r * 0.85, r * 0.42], [r, r * 0.82], [r * 0.95, r * 0.86]], out, { m: 'gloss', seg }),
  C(x, h + r * 0.68, z, r * 0.995, r * 0.16, band, { m: 'gloss', rb: r * 0.965, seg }),
  C(x, h + r * 0.8, z, r * 0.9, r * 0.08, RM.broth, { m: 'plain', seg }),
  S(x, h + r * 0.84, z, r * 0.66, r * 0.16, r * 0.66, RM.noodle, { m: 'cloth', seg: 10 }),
];
/** A stack of n bowls r round, each s tall, as one turned outline. */
function bowlStack(x, h, z, r, n, s, c, o = {}) {
  const pts = [[r * 0.45, 0]];
  for (let k = 0; k < n; k++) pts.push([r, k * s + s * 0.92], [r * 0.9, k * s + s]);
  return LA(x, h, z, pts, c, { m: 'gloss', seg: 12, ...o });
}
/** Neon or painted letters (8 wide, 12 tall at s 1) as strokes about a middle x, standing on h. */
const GLYPH = {
  R: [[-4, 0, -4, 12], [-4, 12, 2, 12], [2, 12, 4, 10], [4, 10, 4, 8], [4, 8, 2, 6], [2, 6, -4, 6], [-1, 6, 4, 0]],
  A: [[-4, 0, 0, 12], [0, 12, 4, 0], [-2.4, 4.6, 2.4, 4.6]],
  M: [[-4, 0, -4, 12], [-4, 12, 0, 5], [0, 5, 4, 12], [4, 12, 4, 0]],
  E: [[-4, 0, -4, 12], [-4, 12, 4, 12], [-4, 6, 2.5, 6], [-4, 0, 4, 0]],
  N: [[-4, 0, -4, 12], [-4, 12, 4, 0], [4, 0, 4, 12]],
};
const letters = (word, xs, h, z, s, r, c, o) => [...word].flatMap((ch, i) => GLYPH[ch].map(([ax, ah, bx, bh]) => RD([xs[i] + ax * s, h + ah * s, z], [xs[i] + bx * s, h + bh * s, z], r, c, o)));
/** Magikarp as a fishcake's outline about its middle, nose to the right (the naruto in the giant bowl). */
const KARP = [[3.6, 0], [3, 1.4], [1.6, 2.2], [0.6, 2.3], [-0.2, 3.4], [-1.4, 2.1], [-2.4, 1.2], [-3.2, 0.4], [-4.6, 2], [-4.2, 0], [-4.6, -2],
  [-3.2, -0.4], [-2.4, -1.2], [-0.6, -2.2], [1.6, -2.2], [3, -1.4]];
const karp = (k) => KARP.map(([px, py]) => [px * k, py * k]);

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
  const g = ctx(), [x0, y0, x1, y1] = bb, c = q.c, seed = Math.round(q.x * 7 + q.h * 13 + q.z * 3);
  g.save(); g.clip(path);
  if (q.tex === 'grain') {
    const across = q.pd === 'h', w0 = across ? y0 : x0, w1 = across ? y1 : x1, l0 = across ? x0 : y0, l1 = across ? x1 : y1;
    g.lineWidth = 0.3;
    for (let w = w0 + 0.7, i = 0; w < w1; w += 0.9, i++) {
      const a = l0 + hash(i, seed, 1) * (l1 - l0) * 0.5, l = (l1 - l0) * (0.3 + hash(i, seed, 2) * 0.6), v = hash(i, seed, 3);
      g.globalAlpha = 0.35; g.strokeStyle = v < 0.5 ? sh(c, -2) : sh(c, 1);
      g.beginPath();
      if (across) { g.moveTo(a, w); g.bezierCurveTo(a + l * 0.3, w + 0.3, a + l * 0.6, w - 0.3, a + l, w); } else { g.moveTo(w, a); g.bezierCurveTo(w + 0.3, a + l * 0.3, w - 0.3, a + l * 0.6, w, a + l); }
      g.stroke();
    }
  } else if (q.tex === 'noodle') {
    g.lineWidth = 0.45; g.lineCap = 'round';
    for (let y = y0 + 0.4, i = 0; y < y1 + 0.5; y += 0.8, i++) {
      g.globalAlpha = 0.8; g.strokeStyle = i % 2 ? sh(c, 1) : sh(c, -1);
      g.beginPath(); g.moveTo(x0, y);
      for (let x = x0; x <= x1 + 1; x += 1) g.lineTo(x, y + Math.sin(x * 1.3 + i * 1.7 + seed) * 0.45);
      g.stroke();
    }
  } else if (q.tex === 'mesh') {
    g.globalAlpha = 0.6; g.strokeStyle = sh(c, -2); g.lineWidth = 0.25; g.beginPath();
    for (let d = -(y1 - y0); d < x1 - x0; d += 0.9) { g.moveTo(x0 + d, y0); g.lineTo(x0 + d + (y1 - y0), y1); g.moveTo(x0 + d, y1); g.lineTo(x0 + d + (y1 - y0), y0); }
    g.stroke();
  } else if (q.tex === 'hribs') {
    g.lineWidth = 0.35;
    for (let y = y0 + 1.4, i = 0; y < y1 - 0.6; y += 1.6, i++) {
      g.globalAlpha = 0.4; g.strokeStyle = sh(c, -2); g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke();
      g.globalAlpha = 0.3; g.strokeStyle = '#ffffff'; g.beginPath(); g.moveTo(x0, y + 0.5); g.lineTo(x1, y + 0.5); g.stroke();
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
      case 'disc': if (side) rbx(cx - q.th / 2, cy - (q.ry ?? q.r), q.th, (q.ry ?? q.r) * 2, q.th / 2, q.c, m); else {
        ball(cx, cy, q.r, q.ry ?? q.r, q.c, m);
        if (q.tex) { const p = new Path2D(); p.ellipse(cx, cy, q.r, q.ry ?? q.r, 0, 0, TAU); texture(q, p, [cx - q.r, cy - q.r, cx + q.r, cy + q.r]); }
      } break;
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
/** A word read downwards, one letter under the next, as on a lantern or a hanging tag. */
const vword = (text, fg, bg) => (g, x, y, w, h) => {
  if (bg) { g.fillStyle = bg; g.fillRect(x, y, w, h); }
  const n = text.length, cell = h / n;
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `bold ${Math.min(w * 0.86, cell * 0.92)}px ${SANS}`;
  [...text].forEach((ch, i) => g.fillText(ch, x + w / 2, y + cell * (i + 0.55), w));
};
/** A wooden menu tag: the dish read downwards in ink, its price in red at the foot (a red tag for the specials). */
const tag = (name, price, special) => (g, x, y, w, h) => {
  const bg = special ? RM.red : RM.paper;
  g.fillStyle = bg; g.fillRect(x, y, w, h);
  g.fillStyle = sh(bg, -1); g.fillRect(x, y, w, 0.5); g.fillRect(x, y + h - 0.5, w, 0.5);
  vword(name, special ? RM.yellow : RM.black, null)(g, x, y + 0.8, w, h * 0.74);
  g.fillStyle = special ? RM.paper : RM.red; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `bold ${w * 0.5}px ${SANS}`; g.fillText(price, x + w / 2, y + h * 0.9, w * 0.96);
};
const TAGS = [['SHOYU', '700'], ['MISO', '800'], ['SHIO', '700'], ['TONKO', '900', 1], ['SPICY', '850'], ['CHASU', '950'], ['GYOZA', '400'], ['RICE', '200'], ['EGG', '100', 1]];

/** A naruto's pink swirl on its white disc. */
function swirl(g, cx, cy, r) {
  g.fillStyle = RM.karpL; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill();
  g.strokeStyle = RM.ginger; g.lineWidth = r * 0.16; g.lineCap = 'round'; g.beginPath();
  for (let i = 0; i <= 40; i++) { const t = i / 40, a = t * TAU * 2.2, rr = r * 0.78 * t; i ? g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) : g.moveTo(cx, cy); }
  g.stroke();
}

/** The poster: rays of red on yellow, a black bowl heaped with noodles, and Slowpoke's head rising behind it, gazing at
    nothing in particular; SLOW in red above, RAMEN below. */
function poster(g, x, y, w, h) {
  const cx = x + w / 2, cy = y + h * 0.56;
  g.fillStyle = RM.yellow; g.fillRect(x, y, w, h);
  g.fillStyle = sh(RM.yellow, 1);
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, h, a, a + TAU / 24); g.closePath(); g.fill(); }
  g.fillStyle = RM.red; g.fillRect(x, y, w, h * 0.17); g.fillRect(x, y + h * 0.86, w, h * 0.14);
  g.fillStyle = RM.yellow; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `bold ${h * 0.13}px ${SANS}`; g.fillText('SLOW', cx, y + h * 0.095, w * 0.9);
  g.font = `bold ${h * 0.1}px ${SANS}`; g.fillText('RAMEN', cx, y + h * 0.935, w * 0.9);
  const s = w;
  g.strokeStyle = RM.black; g.lineWidth = s * 0.02;
  g.fillStyle = RM.slow; g.beginPath(); g.ellipse(cx, cy - s * 0.12, s * 0.27, s * 0.24, 0, 0, TAU); g.fill(); g.stroke();
  for (const sg of [-1, 1]) { g.beginPath(); g.ellipse(cx + sg * s * 0.22, cy - s * 0.32, s * 0.07, s * 0.05, sg * 0.5, 0, TAU); g.fill(); g.stroke(); }
  g.fillStyle = RM.slowL; g.beginPath(); g.ellipse(cx, cy - s * 0.01, s * 0.2, s * 0.1, 0, 0, TAU); g.fill();
  for (const sg of [-1, 1]) {
    g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(cx + sg * s * 0.11, cy - s * 0.15, s * 0.06, s * 0.065, 0, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = RM.black; g.beginPath(); g.arc(cx + sg * s * 0.11, cy - s * 0.14, s * 0.018, 0, TAU); g.fill();
  }
  g.beginPath(); g.moveTo(cx - s * 0.08, cy + s * 0.01); g.quadraticCurveTo(cx, cy + s * 0.05, cx + s * 0.08, cy + s * 0.01); g.stroke();
  g.fillStyle = RM.noodle; g.beginPath(); g.ellipse(cx, cy + s * 0.12, s * 0.38, s * 0.07, 0, 0, TAU); g.fill();
  g.strokeStyle = sh(RM.noodle, -2); g.lineWidth = s * 0.012;
  for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(cx - s * 0.3, cy + s * (0.09 + i * 0.012)); g.bezierCurveTo(cx - s * 0.1, cy + s * (0.06 + i * 0.012), cx + s * 0.1, cy + s * (0.14 + i * 0.012), cx + s * 0.3, cy + s * (0.1 + i * 0.012)); g.stroke(); }
  swirl(g, cx + s * 0.2, cy + s * 0.1, s * 0.07);
  g.fillStyle = RM.black; g.strokeStyle = RM.black;
  g.beginPath(); g.moveTo(cx - s * 0.42, cy + s * 0.14); g.lineTo(cx + s * 0.42, cy + s * 0.14); g.quadraticCurveTo(cx + s * 0.36, cy + s * 0.46, cx, cy + s * 0.48); g.quadraticCurveTo(cx - s * 0.36, cy + s * 0.46, cx - s * 0.42, cy + s * 0.14); g.fill();
  g.fillStyle = RM.red; g.fillRect(cx - s * 0.4, cy + s * 0.18, s * 0.8, s * 0.05);
  g.strokeStyle = RM.woodL; g.lineWidth = s * 0.025; g.lineCap = 'round';
  for (const dx of [0, 0.05]) { g.beginPath(); g.moveTo(cx + s * (0.12 + dx), cy + s * 0.12); g.lineTo(cx + s * (0.38 + dx), cy - s * 0.3); g.stroke(); }
}

/** The clock's dial: cream, red hour marks, a naruto swirl in the middle and a pair of chopsticks for hands, ten past ten. */
function dial(g, x, y, w, h) {
  const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2;
  g.fillStyle = RM.cream; g.beginPath(); g.arc(cx, cy, r * 0.98, 0, TAU); g.fill();
  g.fillStyle = RM.red;
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * TAU - Math.PI / 2, big = i % 3 === 0, rr = r * 0.78;
    g.save(); g.translate(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); g.rotate(a + Math.PI / 2);
    if (i === 0) { g.fillStyle = RM.yellowD; g.beginPath(); g.arc(0, 0, r * 0.1, 0, TAU); g.fill(); } else g.fillRect(-r * (big ? 0.05 : 0.025), -r * (big ? 0.1 : 0.06), r * (big ? 0.1 : 0.05), r * (big ? 0.2 : 0.12));
    g.restore();
  }
  g.lineCap = 'round';
  for (const [a, len, lw] of [[-150, 0.46, 0.09], [-30, 0.66, 0.06]]) { const t = a * Math.PI / 180; g.strokeStyle = RM.woodL; g.lineWidth = r * lw; g.beginPath(); g.moveTo(cx - Math.cos(t) * r * 0.1, cy - Math.sin(t) * r * 0.1); g.lineTo(cx + Math.cos(t) * r * len, cy + Math.sin(t) * r * len); g.stroke(); }
  swirl(g, cx, cy, r * 0.16);
}

/** A noodle crate's stamp: a red box rule round NOODLES. */
function stamp(g, x, y, w, h) {
  g.strokeStyle = RM.redD; g.lineWidth = 0.4; g.strokeRect(x + 0.4, y + 0.4, w - 0.8, h - 0.8);
  word('NOODLES', RM.redD, null, 0.6)(g, x, y, w, h);
}

/* ---------- the kinds ---------- */

/** What js/base-models-ramen.js builds for each upright and wall kind: its parts, doors and default material. */
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

const foot4 = (xs, zs, s, hh, c = RM.woodD) => xs.flatMap(x => zs.map(z => B(x, hh / 2, z, s, hh, s, c, WD)));
const bottle = (x, h, z, c, m = 'gloss') => LA(x, h, z, [[2, 0], [2.1, 0.4], [2.1, 6], [1.4, 8], [0.9, 9], [0.9, 10.4], [1, 10.8]], c, { m, seg: 8 });

export const RAMEN_KINDS = [
  // the shop's counter: dark stained wood, a red lacquer front with the shop's name in yellow, a raised serving ledge at
  // the back with two bowls passed over it, a red box of chopsticks
  piece('rmncounter', 'Ramen counter', 2, 1, 1250, 'wood', [
    B(32, 2, 1, 62, 4, 24, RM.woodK, WD),
    B(32, 18, 0, 62, 28, 26, RM.wood, GR),
    B(32, 18, 13.4, 56, 20, 0.8, RM.red, GL), B(32, 29.4, 13.5, 62, 1.6, 0.8, RM.black, PL),
    PC(32, 18, 13.85, 34, 8, word('RAMEN', RM.yellow, RM.red)),
    B(32, 33.2, 1.5, 64, 2.4, 29, RM.woodL, GL),
    B(32, 38.4, -11, 64, 8, 4, RM.woodD, WD),
    B(32, 43.2, -10, 64, 1.6, 8, RM.woodK, GL),
    ...bowl(16, 44, -10, 4.6), ...bowl(42, 44, -10, 4.6),
    RD([45, 48.6, -10], [51, 49.2, -9], 0.3, RM.woodL, WD), RD([45, 48.6, -9.2], [51, 49.4, -8.2], 0.3, RM.woodL, WD),
    B(54, 36.4, 6, 7, 4, 4, RM.red, GL),
    ...[52.6, 54, 55.4].map((x, i) => RD([x, 38, 6], [x - 0.4 + i * 0.4, 43, 6], 0.3, RM.woodL, WD)),
  ]),

  // a red vinyl counter stool on a steel pole, a foot ring round it
  piece('rmnstool', 'Ramen red stool', 1, 1, 220, 'metal', [
    C(16, 0.6, 0, 8, 1.2, RM.steelD, { m: 'metal', seg: 16 }),
    C(16, 10, 0, 2.2, 18, RM.steel, { m: 'metal', seg: 10 }),
    RG(16, 7, 0, 6.4, 0.6, RM.steel, { m: 'metal', flat: true }),
    RD([9.6, 7, 0], [22.4, 7, 0], 0.4, RM.steel, MT), RD([16, 7, -6.4], [16, 7, 6.4], 0.4, RM.steel, MT),
    C(16, 18.6, 0, 3.2, 1.4, RM.steelD, { m: 'metal', seg: 12 }),
    C(16, 20.4, 0, 8.6, 3.2, RM.red, { m: 'gloss', seg: 18, rb: 8.2 }),
    RG(16, 19, 0, 8.3, 0.5, RM.black, { m: 'plain', flat: true }),
    LA(16, 22, 0, [[8.6, 0], [8, 0.8], [5, 1.4], [0, 1.6]], RM.red, { m: 'gloss', seg: 18 }),
  ]),

  // the stock station: a steel range with two burners lit blue, a tall lidded stockpot simmering bones and a second pot
  // of broth open with its ladle
  piece('rmnstockpot', 'Ramen stockpot station', 2, 1, 1350, 'metal', [
    B(32, 1, 0, 60, 2, 24, RM.black, PL),
    B(32, 10, 0, 62, 16, 26, RM.steel, MT),
    B(32, 12, 13.3, 58, 7, 0.6, RM.steelD, MT), B(32, 5, 13.3, 58, 2, 0.4, RM.steelD, MT),
    ...[8, 22, 42, 56].map(x => DS(x, 12, 14, 1.6, 1.2, RM.black, { m: 'gloss', seg: 10 })),
    B(32, 18.7, 0, 64, 1.4, 28, RM.steelD, MT),
    ...[17, 47].map(x => RG(x, 19.9, 0, 7.5, 0.6, RM.flame, { m: 'glow', flat: true })),
    LA(17, 20.2, 0, [[11, 0], [11.4, 0.6], [11.4, 25], [12, 25.6], [11.6, 26.2]], RM.steel, { m: 'metal', seg: 20 }),
    C(17, 30, 0, 11.6, 1, RM.steelD, { m: 'metal', seg: 20 }),
    LA(17, 46.2, 0, [[11.8, 0], [11, 1.2], [3, 2.8], [2, 3], [2, 4.6], [0, 4.8]], RM.steelD, { m: 'metal', seg: 18 }),
    ...[-1, 1].map(s => RG(17 + s * 11.6, 40, 0, 2.6, 0.6, RM.steelD, { m: 'metal', a0: s < 0 ? Math.PI / 2 : -Math.PI / 2, arc: Math.PI })),
    LA(47, 20.2, 0, [[10, 0], [10.3, 0.6], [10.3, 20], [10.9, 20.6], [10.5, 21.2]], RM.steel, { m: 'metal', seg: 20 }),
    C(47, 40.9, 0, 10, 0.5, RM.broth, { m: 'plain', seg: 18 }),
    ...[-1, 1].map(s => RG(47 + s * 10.5, 36, 0, 2.3, 0.6, RM.steelD, { m: 'metal', a0: s < 0 ? Math.PI / 2 : -Math.PI / 2, arc: Math.PI })),
    RD([50, 40, 2], [57, 57, -3], 0.6, RM.steelL, MT), RG(57.4, 58.6, -3, 1.4, 0.4, RM.steelL, { m: 'metal' }),
  ], { glow: [RM.flame] }),

  // the noodle boiler: a steel cooker of boiling water, three deep strainer baskets dipped in it, their long handles
  // resting on a rail at the back
  piece('rmnboiler', 'Ramen noodle boiler', 1, 1, 900, 'metal', [
    B(16, 1, 0, 28, 2, 24, RM.black, PL),
    B(16, 15, 0, 30, 26, 26, RM.steel, MT),
    B(16, 13, 13.3, 26, 18, 0.6, RM.steelL, MT), RD([8, 19, 14.2], [24, 19, 14.2], 0.5, RM.steelD, MT),
    B(16, 4, 13.3, 26, 2, 0.4, RM.steelD, MT),
    B(16, 29, 0, 31, 2, 27, RM.steelL, MT),
    B(16, 30.2, 1, 26, 0.4, 22, RM.water, GL),
    ...[2.4, 29.6].map(x => RD([x, 30, -11.5], [x, 45, -11.5], 0.6, RM.steelD, MT)), B(16, 45, -11.5, 30, 1.6, 2, RM.steelD, MT),
    ...[7.5, 16, 24.5].flatMap(x => [
      C(x, 32, 5, 3.4, 6, RM.steelD, { m: 'metal', tex: 'mesh', seg: 12 }), RG(x, 35, 5, 3.4, 0.4, RM.steel, { m: 'metal', flat: true }),
      RD([x, 35, 2], [x, 45.4, -9.6], 0.45, RM.steel, MT), RD([x, 45.4, -9.6], [x, 46.6, -13], 0.8, RM.black, GL),
    ]),
  ]),

  // the noodle-making table: a block of dough and a rolling pin, fresh-cut noodles in nests, a cutting knife, a sack of
  // flour below, and Psyduck sat at the end holding its head over it all
  piece('rmnnoodle', 'Ramen noodle-making table', 2, 1, 980, 'wood', [
    ...foot4([4, 60], [-10, 10], 3.4, 26),
    B(32, 24, 0, 60, 4, 24, RM.wood, WD),
    B(32, 6, 0, 58, 1.6, 22, RM.wood, WD),
    B(32, 27, 0, 64, 2.4, 28, RM.woodL, GRH),
    S(14, 13, 0, 8, 6.4, 7, RM.cream, CL), DS(14, 13, 6.8, 3, 0.3, RM.red, { m: 'plain', ry: 2.2 }),
    B(44, 10, 0, 18, 6.4, 16, RM.woodL, WD),
    B(18, 29.6, 2, 18, 2.8, 14, RM.cream, { m: 'cloth', r: 1.4 }),
    RD([8, 32.4, 6], [28, 32.4, 6], 1.4, RM.woodL, WD), RD([4.6, 32.4, 6], [8, 32.4, 6], 0.6, RM.woodD, WD), RD([28, 32.4, 6], [31.4, 32.4, 6], 0.6, RM.woodD, WD),
    B(38, 29, 2, 10, 1.6, 10, RM.noodle, { ...NOO, r: 0.8 }),
    ...[33, 40].map(x => S(x, 30.4, -7, 3, 1.4, 2.6, RM.noodle, { ...NOO, seg: 8 })),
    B(42, 30.1, 9, 12, 0.6, 4.4, RM.steelL, { m: 'metal', r: 0.2 }), B(50, 30.4, 9, 4, 1.2, 1.6, RM.woodK, WD),
    S(53.6, 28.8, 3.6, 1.8, 0.9, 2.4, RM.bill, { m: 'cloth', seg: 8 }), S(58.4, 28.8, 3.6, 1.8, 0.9, 2.4, RM.bill, { m: 'cloth', seg: 8 }),
    S(56, 33.4, 0, 4.6, 4.8, 4.2, RM.psy, { m: 'cloth', seg: 12 }),
    S(56, 41.4, 0, 4.8, 4.4, 4.4, RM.psy, { m: 'cloth', seg: 12 }),
    S(56, 39.6, 4.2, 2.6, 1.3, 1.8, RM.bill, { m: 'cloth', seg: 10 }),
    ...[-1, 1].flatMap(s => [DS(56 + s * 1.9, 42.2, 3.9, 1, 0.4, '#ffffff', { m: 'plain', seg: 8 }), DS(56 + s * 1.9, 42.2, 4.15, 0.4, 0.3, RM.black, { m: 'plain', seg: 6 }),
      RD([56 + s * 4, 35, 1], [56 + s * 4.6, 43, 0.5], 1, RM.psy, CL), S(56 + s * 4.2, 44.4, 0.6, 1.3, 1.3, 1.3, RM.psy, { m: 'cloth', seg: 8 })]),
    ...[-1, 0, 1].map(s => RD([56 + s * 0.6, 45.4, 0], [56 + s * 1.6, 48.4, 0], 0.25, RM.black, PL)),
  ]),

  // the ticket machine: cream and red, rows of buttons on a glowing panel, coin and note slots and the ticket tray
  piece('rmnticket', 'Ramen ticket machine', 1, 1, 1100, 'gloss', [
    B(16, 1, -2, 26, 2, 22, RM.black, PL),
    B(16, 30, -2, 26, 56, 20, RM.ivory, GL),
    B(16, 59.4, -2, 27.4, 3, 21.4, RM.red, GL),
    B(16, 54, 8.3, 22, 5, 0.6, RM.red, GL), PC(16, 54, 8.65, 20, 4, word('TICKETS', RM.yellow, RM.red)),
    B(16, 41, 8.3, 22, 18, 0.6, RM.glowP, GW),
    ...[34.4, 37.8, 41.2, 44.6, 48].flatMap((h, row) => [10, 16, 22].map((x, col) => B(x, h, 8.9, 5, 2.4, 0.6, row === 4 ? RM.red : (row + col) % 2 ? RM.yellow : RM.cream, { m: 'plain', r: 0.4 }))),
    B(16, 26, 8.4, 20, 7, 1, RM.steelD, MT),
    B(11, 27.4, 9, 4, 0.8, 0.4, RM.black, { m: 'plain', r: 0.2 }), B(20, 27.4, 9, 7, 0.8, 0.4, RM.black, { m: 'plain', r: 0.2 }),
    DS(16, 24.2, 9, 1, 0.4, RM.red, { m: 'plain', seg: 8 }),
    B(16, 13, 8.6, 14, 5, 1.6, RM.black, GL), B(16, 14.4, 9.6, 5, 0.6, 1, RM.paper, PL),
    B(16, 8, 8.3, 26, 1.4, 0.4, RM.red, PL),
  ], { glow: [RM.glowP] }),

  // a red paper lantern hung from a dark wooden post's arm, RAMEN read down its glowing side, a tassel below
  piece('rmnlantern', 'Ramen red lantern stand', 1, 1, 420, 'wood', [
    B(12, 1.4, 0, 20, 2.8, 18, RM.woodK, WD),
    B(7, 29, 0, 3.6, 52, 3.6, RM.woodD, GR),
    B(14, 54, 0, 17, 2.4, 2.6, RM.woodD, WD), RD([7, 45, 0], [13, 53, 0], 0.7, RM.woodD, WD),
    RD([19, 52.8, 0], [19, 49.4, 0], 0.3, RM.black, PL),
    C(19, 48.6, 0, 5.4, 1.8, RM.black, { m: 'gloss', seg: 14 }),
    LA(19, 27.6, 0, [[5.4, 0], [7.6, 1.6], [8.8, 4.6], [9.2, 10], [8.8, 15.4], [7.6, 18.4], [5.4, 20]], RM.glowR, { m: 'glow', seg: 16, tex: 'hribs' }),
    PC(19, 37.6, 9.3, 5, 14, vword('RAMEN', RM.black, null)),
    C(19, 26.8, 0, 5.4, 1.8, RM.black, { m: 'gloss', seg: 14 }),
    RD([19, 26, 0], [19, 21, 0], 0.5, RM.red, CL), S(19, 20.4, 0, 1, 1.6, 1, RM.red, { m: 'cloth', seg: 8 }),
  ], { glow: [RM.glowR] }),

  // a yatai street stall: a wooden cart on a big wheel, its red roof on four posts, a black curtain spelling RAMEN, two
  // lanterns glowing at the front, a stockpot and a stack of bowls on its counter, its shafts to the right
  piece('rmnyatai', 'Ramen yatai cart', 2, 1, 1800, 'wood', [
    ...[5, 55].map(x => B(x, 4.5, 0, 3, 9, 20, RM.woodD, WD)),
    B(30, 17, 0, 52, 16, 22, RM.wood, GRH),
    B(22, 17, 11.3, 34, 12, 0.6, RM.red, GL), PC(22, 17, 11.7, 30, 6, word('RAMEN', RM.yellow, RM.red)),
    B(30, 26, 1.5, 58, 2, 27, RM.woodL, GL),
    ...[-8, 8].map(z => RD([56, 20, z], [63.2, 22, z], 0.8, RM.woodD, WD)),
    RG(46, 9, 13.6, 7.8, 0.9, RM.black, GL), RG(46, 9, 13.6, 6.6, 0.6, RM.woodD, WD),
    ...Array.from({ length: 8 }, (_, i) => { const a = i / 8 * TAU + 0.2; return RD([46 + Math.cos(a) * 1.6, 9 + Math.sin(a) * 1.6, 13.6], [46 + Math.cos(a) * 6.2, 9 + Math.sin(a) * 6.2, 13.6], 0.45, RM.woodL, WD); }),
    DS(46, 9, 14, 1.6, 1.4, RM.black, { m: 'gloss', seg: 10 }),
    ...[6, 54].flatMap(x => [-11, 11].map(z => RD([x, 27, z], [x, 52, z], 0.9, RM.woodD, WD))),
    PR(30, 52, 0, [[-30, 0], [30, 0], [24, 8], [-24, 8]], 30, RM.red, GL),
    B(30, 52.6, 15.1, 60, 1.2, 0.4, RM.black, PL),
    B(30, 51.6, 10.5, 48, 1, 1, RM.woodD, WD),
    ...['R', 'A', 'M', 'E', 'N'].flatMap((ch, i) => { const x = 10 + i * 10; return [B(x, 47.4, 10.5, 9.4, 7.6, 0.4, RM.black, CL), PC(x, 47.4, 10.75, 7, 5.6, word(ch, RM.yellow, RM.black, 0.9))]; }),
    ...[10.5, 49.5].flatMap(x => [RD([x, 51, 13], [x, 45.4, 13], 0.25, RM.black, PL), C(x, 45, 13, 2.2, 0.8, RM.black, { m: 'gloss', seg: 10 }),
      LA(x, 38, 13, [[2.2, 0], [2.9, 1], [3.2, 3.4], [2.9, 5.8], [2.2, 6.8]], RM.glowR, { m: 'glow', seg: 12, tex: 'hribs' }), C(x, 37.6, 13, 2.2, 0.8, RM.black, { m: 'gloss', seg: 10 })]),
    LA(44, 27, -4, [[5, 0], [5.3, 0.5], [5.3, 9], [5.7, 9.4], [5.4, 9.8]], RM.steel, { m: 'metal', seg: 14 }),
    LA(44, 36.6, -4, [[5.6, 0], [4.6, 1.2], [1.2, 1.8], [1.2, 2.8], [0, 3]], RM.steelD, { m: 'metal', seg: 14 }),
    bowlStack(16, 27, -2, 4.4, 4, 2.2, RM.black),
    C(16, 30.8, -2, 4.42, 1.2, RM.red, { m: 'plain', seg: 12 }),
  ], { glow: [RM.glowR] }),

  // a little stand for the counter's condiments: a red caddy of chilli oil, garlic and pepper, a cup of chopsticks, soy
  // sauce on the shelf below
  piece('rmncondiment', 'Ramen condiment stand', 1, 1, 380, 'wood', [
    ...foot4([4, 28], [-8, 8], 3.2, 22),
    B(16, 6, 0, 26, 1.4, 18, RM.woodD, WD),
    ...[9, 15].map(x => bottle(x, 6.7, -1, RM.soy)), ...[9, 15].map(x => C(x, 18, -1, 1, 0.8, RM.red, { m: 'plain', seg: 8 })),
    LA(23, 6.7, 1, [[2.6, 0], [3, 2], [3, 4.6], [2.2, 5.6]], RM.ginger, { m: 'gloss', seg: 10 }),
    B(16, 23, 0, 30, 2, 22, RM.woodL, GR),
    B(13, 25.4, 0, 20, 2.8, 12, RM.red, GL),
    ...[9.6, 16.4].map(x => RD([x, 26.8, 0], [x, 33.4, 0], 0.5, RM.black, GL)), B(13, 33.4, 0, 9, 1, 1, RM.black, GL),
    LA(6.4, 26.8, 2, [[2.4, 0], [2.6, 0.4], [2.6, 5], [1.8, 6], [1.8, 6.6]], RM.chilli, GL), C(6.4, 34, 2, 2, 1.2, RM.black, { m: 'gloss', seg: 10 }),
    LA(13, 26.8, 3, [[2, 0], [2.2, 3.2], [1.4, 4.2], [1.6, 4.8]], RM.cream, GL), C(13, 32, 3, 1.6, 0.8, RM.red, { m: 'plain', seg: 8 }),
    C(19.6, 30, 2, 1.7, 6.4, RM.black, { m: 'gloss', seg: 10 }), LA(19.6, 33.2, 2, [[1.7, 0], [1.3, 1], [0, 1.6]], RM.steelL, { m: 'metal', seg: 10 }),
    C(26.6, 28, 0, 2.2, 8, RM.woodK, { m: 'wood', seg: 10 }),
    ...[-1.2, 0, 1.2].flatMap((d, i) => [RD([26.6 + d, 31, -0.6], [26.6 + d * 2.2, 40 - i * 0.8, -0.6], 0.3, RM.woodL, WD), RD([26.6 + d, 31, 0.6], [26.6 + d * 1.6, 39 + i * 0.6, 0.6], 0.3, RM.red, PL)]),
  ]),

  // a giant ramen bowl for a sign: black with a red band, heaped noodles, chashu, a soft egg, nori, scallions and a
  // Magikarp-shaped fishcake, a pair of chopsticks stood in it
  piece('rmnbowl', 'Ramen giant bowl', 1, 1, 680, 'gloss', [
    B(16, 1.5, 0, 20, 3, 20, RM.black, GL),
    LA(16, 3, 0, [[7, 0], [7.4, 1], [6.8, 1.8], [9.5, 3.4], [12.4, 7.4], [14.4, 12], [15.4, 17], [15.6, 19], [15, 19.4]], RM.black, { m: 'gloss', seg: 22 }),
    C(16, 20, 0, 15.75, 2.6, RM.red, { m: 'gloss', rb: 15.35, seg: 22 }),
    C(16, 22.2, 0, 14.8, 0.4, RM.broth, { m: 'plain', seg: 22 }),
    B(10, 28.4, -9, 8, 12, 0.6, RM.nori, { m: 'plain', r: 0.2 }), B(14.4, 28.8, -10, 8, 12, 0.6, RM.nori, { m: 'plain', r: 0.2 }),
    S(16, 22.4, 0, 12.4, 3, 12, RM.noodle, { ...NOO, seg: 16 }),
    DS(8.6, 25.6, 3, 4.6, 1.2, RM.chashu, { m: 'cloth', seg: 14 }), DS(8.6, 25.6, 3.7, 3.2, 0.4, RM.chashuL, { m: 'plain', seg: 12 }),
    S(23.6, 25, 4, 3.4, 2.8, 1.6, RM.egg, { m: 'gloss', seg: 10 }), DS(23.6, 25, 5.5, 1.6, 0.3, RM.yolk, { m: 'plain', seg: 10 }),
    PR(16, 25.4, 6.4, karp(1.15), 1, RM.karp, GL), PR(16.4, 25.4, 7.1, karp(0.72), 0.4, RM.karpL, PL),
    ...[[12, 6], [20, 7], [18.6, 9.2], [10.6, 8.6]].map(([x, z]) => S(x, 24, z, 1.1, 0.7, 1.1, RM.scallion, { m: 'cloth', seg: 6 })),
    RD([19, 23, 0], [27, 40, -2], 0.6, RM.woodL, WD), RD([20.4, 23, 1], [29.4, 39.4, -1], 0.6, RM.woodL, WD),
  ]),

  // a board of wooden menu tags on the wall under a red MENU header: the bowls and sides read downwards, prices in red
  wallPiece('rmnmenu', 'Ramen menu tag board', 2, 480, 'wood', [
    B(32, 64, 0.8, 60, 22, 1.6, RM.woodD, GRH),
    B(32, 77.5, 1.2, 62, 5, 2.4, RM.red, GL), PC(32, 77.5, 2.45, 30, 3.8, word('MENU', RM.yellow, RM.red)),
    ...TAGS.flatMap(([name, price, sp], i) => { const x = 8 + i * 6; return [B(x, 63.4, 1.9, 5, 17, 0.5, sp ? RM.red : RM.paper, PL), PC(x, 63.4, 2.2, 5, 17, tag(name, price, sp)), DS(x, 72.8, 2.2, 0.5, 0.4, RM.steelD, { m: 'metal', seg: 6 })]; }),
  ]),

  // a poster of a heaped bowl of ramen with Slowpoke gazing over it: SLOW above, RAMEN below
  wallPiece('rmnposter', 'Ramen Slowpoke poster', 1, 260, 'plain', [
    B(16, 58, 0.5, 22, 30, 0.6, RM.paper, PL),
    PC(16, 58, 0.85, 22, 30, poster),
    ...[[6.4, 71.6], [25.6, 71.6], [6.4, 44.4], [25.6, 44.4]].map(([x, h]) => DS(x, h, 1.1, 0.7, 0.4, RM.red, { m: 'gloss', seg: 6 })),
  ]),

  // a neon sign on a black board edged red: RAMEN in red tubes over a yellow bowl and chopsticks
  wallPiece('rmnneon', 'Ramen neon sign', 2, 920, 'gloss', [
    B(32, 62, 0.3, 62, 30, 0.6, RM.red, GL),
    B(32, 62, 0.9, 59, 27, 1, RM.black, GL),
    ...letters('RAMEN', [12, 22, 32, 42, 52], 60.6, 2, 1, 0.75, RM.neonR, GW),
    ...[[20, 55.6, 44, 55.6], [22, 55.6, 25, 51.4], [25, 51.4, 39, 51.4], [39, 51.4, 42, 55.6], [36, 57, 47, 58.6], [37, 56.4, 47.4, 57]].map(([ax, ah, bx, bh]) => RD([ax, ah, 2], [bx, bh, 2], 0.7, RM.glowY, GW)),
  ], { glow: [RM.neonR, RM.glowY] }),

  // a round wall clock in red lacquer: chopstick hands and a naruto swirl on its cream dial, an OPEN tag hung below
  wallPiece('rmnclock', 'Ramen wall clock', 1, 480, 'gloss', [
    DS(16, 62, 0.8, 12.4, 1.6, RM.red, { m: 'gloss', seg: 20 }),
    RG(16, 62, 1.7, 11.4, 0.6, RM.black, GL),
    PC(16, 62, 1.75, 16, 16, dial),
    RD([12, 49.8, 1], [13.2, 47.2, 1], 0.25, RM.black, PL), RD([20, 49.8, 1], [18.8, 47.2, 1], 0.25, RM.black, PL),
    B(16, 45, 1, 12, 4.4, 0.6, RM.woodL, WD), PC(16, 45, 1.35, 11, 3.8, word('OPEN', RM.red, RM.woodL)),
  ]),

  // the shop's floor mat: red with a yellow thunder-key border on black, a big bowl and chopsticks in the middle
  { id: 'rmnmat', name: 'Ramen floor mat', group: GROUP, solo: true, w: 3, h: 2, layer: 'rug', price: 520, high: 0.03, side: 'c', flat() {
    const g = ctx(), path = () => { g.beginPath(); RUG.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
    g.fillStyle = RM.black; path(); g.fill();
    g.fillStyle = RM.red; g.fillRect(10, 10, 76, 44);
    g.strokeStyle = RM.yellow; g.lineWidth = 0.8; g.lineCap = 'square';
    const key = (x, y) => { g.beginPath(); [[0, 5], [0, 0], [5, 0], [5, 5], [1.7, 5], [1.7, 1.7], [3.4, 1.7], [3.4, 3.4]].forEach(([dx, dy], i) => (i ? g.lineTo(x + dx, y + dy) : g.moveTo(x + dx, y + dy))); g.stroke(); };
    for (let x = 4.5; x < 88; x += 7) { key(x, 3.4); key(x, 55.6); }
    for (let y = 11; y < 50; y += 7) { key(3.4, y); key(87.6, y); }
    g.strokeStyle = RM.yellowD; g.lineWidth = 0.6; g.strokeRect(9.6, 9.6, 76.8, 44.8);
    const cx = 48, cy = 34;
    g.fillStyle = RM.black; g.beginPath(); g.moveTo(cx - 20, cy - 4); g.lineTo(cx + 20, cy - 4); g.quadraticCurveTo(cx + 18, cy + 14, cx, cy + 15); g.quadraticCurveTo(cx - 18, cy + 14, cx - 20, cy - 4); g.fill();
    g.fillStyle = RM.yellow; g.fillRect(cx - 19.4, cy - 2, 38.8, 2);
    g.fillStyle = RM.noodle; g.beginPath(); g.ellipse(cx, cy - 4, 20, 3.6, 0, 0, TAU); g.fill();
    g.strokeStyle = sh(RM.noodle, -2); g.lineWidth = 0.5;
    for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(cx - 16, cy - 5.4 + i * 1); g.bezierCurveTo(cx - 6, cy - 7 + i, cx + 6, cy - 3 + i, cx + 16, cy - 5 + i); g.stroke(); }
    swirl(g, cx + 9, cy - 5, 3);
    g.strokeStyle = RM.woodL; g.lineWidth = 1.2; g.lineCap = 'round';
    for (const d of [0, 2.4]) { g.beginPath(); g.moveTo(cx + 4 + d, cy - 6); g.lineTo(cx + 18 + d, cy - 20); g.stroke(); }
    g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 0.6;
    for (const [sx, k] of [[-8, 0], [-2, 1], [4, 2]]) { g.beginPath(); g.moveTo(cx + sx, cy - 9); g.bezierCurveTo(cx + sx - 2, cy - 12, cx + sx + 2, cy - 14, cx + sx, cy - 17 - k); g.stroke(); }
    g.strokeStyle = sh(RM.black, 1); g.lineWidth = 1; path(); g.stroke();
  } },

  // the water station: a steel cupboard with a steel jug of iced water and stacks of amber tumblers on its tray
  piece('rmnwater', 'Ramen water station', 1, 1, 420, 'metal', [
    B(16, 1, 0, 28, 2, 22, RM.black, PL),
    B(16, 13, 0, 28, 22, 22, RM.steelL, MT),
    B(16, 13, 11.2, 0.4, 20, 0.4, RM.steelD, PL), ...[13.6, 18.4].map(x => RD([x, 16, 11.6], [x, 10, 11.6], 0.45, RM.steelD, MT)),
    B(16, 24.6, 0, 30, 1.2, 24, RM.steel, MT),
    B(16, 25.8, 0, 26, 1.2, 18, RM.black, GL),
    LA(9, 26.4, 0, [[3.6, 0], [3.8, 0.6], [4, 8], [3.6, 11], [3.2, 12], [3.6, 12.6]], RM.steelL, { m: 'metal', seg: 14 }),
    RG(5, 32.6, 0, 2.6, 0.6, RM.steelL, { m: 'metal', a0: Math.PI / 2, arc: Math.PI }),
    PR(12.4, 37.4, 0, [[0, 0], [2.4, 1.8], [0, 1.6]], 1.8, RM.steelL, MT),
    ...[[20.4, -2], [26, -2]].map(([x, z]) => LA(x, 26.4, z, [[2.2, 0], [2.6, 3], [2.4, 3.2], [2.8, 6], [2.6, 6.2], [3, 9], [3.1, 9.4]], RM.amber, { m: 'gloss', seg: 10 })),
    C(23.2, 28.6, 5, 2.4, 4.4, RM.amber, { m: 'gloss', rb: 2, seg: 10 }),
  ]),

  // a red drinks fridge with a glass door: rows of cola, ramune and orange soda inside, a glowing yellow sign on top
  piece('rmnfridge', 'Ramen drinks fridge', 1, 1, 1000, 'gloss', [
    B(16, 2.5, -1, 28, 5, 24, RM.black, PL),
    B(16, 31, -11.6, 28, 52, 1.6, RM.red, GL),
    ...[2.8, 29.2].map(x => B(x, 31, -1, 2.4, 52, 23, RM.red, GL)),
    B(16, 59.5, -1, 28, 5, 24, RM.red, GL), B(16, 59.5, 11.3, 24, 3.6, 0.5, RM.glowY, GW),
    B(16, 5.6, -1, 24, 1.2, 22, RM.steelD, MT),
    ...[19, 32, 45].map(h => B(16, h, -1, 24, 0.8, 20, RM.steelL, MT)),
    ...[[6.2, RM.cola], [19.4, RM.ramune], [32.4, RM.orange], [45.4, RM.milk]].flatMap(([h, c], row) => [7.5, 13, 18.5, 24].map((x, i) => bottle(x, h, 3, row === 2 && i % 2 ? RM.ramune : c, row === 1 ? 'glass' : 'gloss'))),
  ], {
    doors: [{ hinge: [2.8, 11.2], side: 1, parts: [
      ...[4, 28].map(x => B(x, 31, 12, 2.4, 52, 1.6, RM.red, GL)),
      ...[56, 6].map(h => B(16, h, 12, 26, 2.4, 1.6, RM.red, GL)),
      B(16, 31, 12, 21.6, 48, 0.4, '#cfe8f4', { m: 'glass' }),
      ...[24, 38].map(h => RD([25.6, h, 12.8], [25.6, h, 14], 0.4, RM.steelL, MT)), RD([25.6, 24, 14], [25.6, 38, 14], 0.6, RM.steelL, MT),
    ] }],
    inside: { x: 16, h: 31, w: 22, hh: 48, z: -10.6 },
  }),

  // a waiting bench of dark wood: a red cushion on its seat, a plank back on two posts
  piece('rmnbench', 'Ramen bench seat', 2, 1, 560, 'wood', [
    ...foot4([5, 59], [-6, 8], 3.4, 13.6),
    RD([5, 5, 1], [59, 5, 1], 0.7, RM.woodD, WD),
    B(32, 14.8, 1, 62, 2.6, 18, RM.wood, GRH),
    B(32, 17, 1.6, 58, 2.2, 15, RM.red, { m: 'cloth', r: 1 }),
    ...[5, 59].map(x => B(x, 26, -8.6, 3.4, 22, 3, RM.woodD, WD)),
    B(32, 31, -8.6, 60, 9, 1.8, RM.wood, GRH),
    B(32, 36.4, -8.6, 62, 1.6, 2.8, RM.woodD, WD),
  ]),

  // a little table for two: a dark square top on a black pedestal, a chopstick box and a tray of chilli and pepper
  piece('rmntable', 'Ramen table for two', 1, 1, 480, 'wood', [
    C(16, 0.8, 0, 10, 1.6, RM.black, { m: 'metal', seg: 18 }),
    C(16, 13.8, 0, 2.4, 24.4, RM.black, { m: 'metal', seg: 10 }),
    B(16, 26.4, 0, 22, 1, 4, RM.black, MT), B(16, 26.4, 0, 4, 1, 22, RM.black, MT),
    B(16, 27.9, 0, 30, 2, 30, RM.woodD, { m: 'gloss', tex: 'grain', pd: 'h' }),
    B(23, 29.5, -9, 9, 1.2, 5, RM.red, GL), C(21, 32, -9, 1, 4, RM.chilli, { m: 'gloss', seg: 8 }), C(25, 31.8, -9, 1, 3.6, RM.black, { m: 'gloss', seg: 8 }),
    B(8, 31.1, -9, 6, 4.4, 4, RM.woodK, WD), ...[6.8, 8, 9.2].map(x => RD([x, 33, -9], [x, 37, -9], 0.3, RM.woodL, WD)),
  ]),

  // the toppings station: a steel cooler with pans of chashu, soft eggs, scallions, bamboo shoots, corn and nori under
  // a glass guard
  piece('rmntopping', 'Ramen toppings station', 1, 1, 860, 'metal', [
    B(16, 1, 0, 28, 2, 24, RM.black, PL),
    B(16, 13, 0, 30, 22, 24, RM.steel, MT),
    B(16, 13, 12.3, 26, 16, 0.6, RM.steelL, MT),
    B(16, 24.8, 0, 31, 1.6, 26, RM.steelL, MT),
    ...[[7, -5.5, RM.nori], [16, -5.5, RM.corn], [25, -5.5, RM.menma], [7, 4, RM.chashu], [16, 4, RM.egg], [25, 4, RM.scallion]].map(([x, z, c]) => B(x, 26, z, 8.4, 1.2, 8, c, { m: 'plain', r: 0.4 })),
    ...[4.6, 7, 9.4].map(x => B(x, 29, -5.5, 2, 5, 0.4, RM.nori, { m: 'plain', r: 0.1 })),
    ...[[5, 2.2], [9, 5.4]].map(([x, z]) => DS(x, 27.6, z, 2.2, 0.8, RM.chashuL, { m: 'cloth', seg: 10 })),
    ...[[14.2, 2.8], [17.8, 5]].map(([x, z]) => S(x, 27, z, 1.8, 1.4, 1.8, RM.egg, { m: 'gloss', seg: 8 })),
    ...[2.2, 29.8].map(x => RD([x, 25.6, 9.4], [x, 36.8, 9.4], 0.4, RM.steelL, MT)),
    B(16, 32, 9.4, 30, 8, 0.4, '#cfe8f4', { m: 'glass' }), B(16, 36.6, 3, 30, 0.6, 13, '#cfe8f4', { m: 'glass' }),
  ]),

  // an open shelf of dark wood stacked with bowls: black ones with red bands, white ones with red rims, a pot of
  // porcelain soup spoons and a stack of plates
  piece('rmnbowls', 'Ramen bowl shelf', 1, 1, 540, 'wood', [
    ...[2.2, 29.8].map(x => B(x, 24, 0, 2.4, 48, 20, RM.woodD, GR)),
    B(16, 24.5, -9.4, 26, 47, 1, RM.woodK, WD),
    ...[1.2, 16.2, 31.2, 47].map(h => B(16, h, 0, 30, 2, 20, RM.woodD, WD)),
    bowlStack(9.5, 2.2, 1, 5.4, 4, 2.4, RM.black), C(9.5, 9.8, 1, 5.45, 0.8, RM.red, { m: 'plain', seg: 12 }),
    bowlStack(22.5, 2.2, 1, 5.4, 3, 2.4, RM.red),
    bowlStack(9.5, 17.2, 1, 5, 4, 2.2, RM.bowlW), C(9.5, 25.4, 1, 5.05, 0.6, RM.red, { m: 'plain', seg: 12 }),
    bowlStack(22.5, 17.2, 1, 5, 3, 2.2, RM.bowlW),
    LA(9.5, 32.2, 1, [[2.6, 0], [3, 4.4], [3.2, 5]], RM.blackL, { m: 'gloss', seg: 10 }),
    ...[-1.4, 0, 1.4].map(d => RD([9.5 + d, 36, 1], [9.5 + d * 2.4, 42, 1.6], 0.6, RM.bowlW, GL)),
    ...[0, 1, 2, 3, 4].map(k => C(22.5, 32.8 + k * 1.1, 1, 6, 0.8, k % 2 ? RM.bowlW : RM.cream, { m: 'gloss', rb: 4.6, seg: 12 })),
  ]),

  // Lechonk, the shop's regular, sat on a red stool with its own bowl, a noodle on its snout
  piece('rmnlechonk', 'Ramen Lechonk regular', 1, 1, 720, 'cloth', [
    C(16, 0.5, 0, 7, 1, RM.steelD, { m: 'metal', seg: 14 }),
    C(16, 6.5, 0, 2, 11, RM.steel, { m: 'metal', seg: 8 }),
    C(16, 13, 0, 7.4, 2.8, RM.red, { m: 'gloss', rb: 7, seg: 16 }),
    S(16, 21, -1, 8.4, 7.2, 7.6, RM.lech, { m: 'cloth', seg: 16 }),
    S(16, 21.4, 4.4, 6, 5.2, 2.6, RM.lechL, { m: 'cloth', seg: 12 }),
    DS(16, 20.4, 6.9, 2.4, 1.4, RM.lechNose, { m: 'gloss', ry: 1.7, seg: 10 }),
    ...[15.1, 16.9].map(x => DS(x, 20.4, 7.65, 0.4, 0.3, RM.lechD, { m: 'plain', seg: 6 })),
    ...[12.8, 19.2].map(x => DS(x, 23.6, 6.4, 0.8, 0.4, RM.black, { m: 'gloss', seg: 8 })),
    S(16, 28.4, -1, 2.4, 2, 3.6, RM.lechD, { m: 'cloth', seg: 8 }), S(16, 29.4, -3, 1.6, 1.4, 2.4, RM.lechD, { m: 'cloth', seg: 8 }),
    ...[9.4, 22.6].map(x => S(x, 26, -2, 1.8, 1.4, 1.4, RM.lechD, { m: 'cloth', seg: 8 })),
    ...[11.4, 20.6].map(x => S(x, 15, 4.4, 1.8, 1.6, 2.2, RM.lechD, { m: 'cloth', seg: 8 })),
    ...bowl(16, 14.6, 7.2, 4.4),
    RD([15.6, 18.6, 7.4], [15.8, 19.4, 7.8], 0.3, RM.noodle, PL),
  ]),

  // Snorlax sat with the biggest bowl in the house in its lap, eyes shut in bliss
  piece('rmnsnorlax', 'Ramen Snorlax big bowl', 1, 1, 1500, 'cloth', [
    S(16, 16, -3, 14.4, 15.4, 12, RM.snor, { m: 'cloth', seg: 18 }),
    S(16, 14, 3, 11.6, 11.6, 6.6, RM.snorC, { m: 'cloth', seg: 14 }),
    ...[7.4, 24.6].map(x => S(x, 3.2, 6, 4.6, 3.2, 3.6, RM.snorC, { m: 'cloth', seg: 10 })),
    S(16, 36, -3, 10.4, 7.6, 8.6, RM.snor, { m: 'cloth', seg: 16 }),
    S(16, 35, 2.4, 7.6, 5.2, 3.6, RM.snorC, { m: 'cloth', seg: 12 }),
    PR(9.4, 41.6, -3, [[-2.4, 0], [2, 0], [-1, 4.4]], 3, RM.snor, CL), PR(22.6, 41.6, -3, [[-2, 0], [2.4, 0], [1, 4.4]], 3, RM.snor, CL),
    RD([11.8, 36.6, 5.6], [14, 36.4, 5.8], 0.35, RM.black, PL), RD([18, 36.4, 5.8], [20.2, 36.6, 5.6], 0.35, RM.black, PL),
    RD([14.4, 32.4, 5.6], [17.6, 32.4, 5.6], 0.35, RM.black, PL),
    ...[4, 28].map(x => S(x, 20, 2, 3.4, 6, 4.4, RM.snor, { m: 'cloth', seg: 10 })),
    ...bowl(16, 7, 6, 8.4, RM.red, RM.black, 16),
    ...[9.2, 22.8].map(x => S(x, 10.4, 9.6, 2.6, 2.2, 2.4, RM.snor, { m: 'cloth', seg: 8 })),
    RD([18, 14, 6], [23, 24, 4], 0.45, RM.woodL, WD), RD([19, 14, 7], [24.6, 23.4, 5], 0.45, RM.woodL, WD),
  ]),

  // a tall lit signboard on the pavement: a black box, RAMEN read down its glowing yellow face in red, a red cap
  piece('rmnsignbox', 'Ramen lit signboard', 1, 1, 640, 'gloss', [
    B(16, 1.4, 0, 18, 2.8, 14, RM.black, GL),
    B(16, 4.4, 0, 6, 3.2, 4, RM.black, GL),
    B(16, 32, 0, 15, 52, 10, RM.black, GL),
    B(16, 32, 5.2, 12, 48, 0.5, RM.glowY, GW),
    ...[...'RAMEN'].flatMap((ch, i) => letters(ch, [16], 9.4 + (4 - i) * 9.5, 5.75, 0.62, 0.6, RM.red, PL)),
    B(16, 58.8, 0, 16, 1.6, 11, RM.red, GL),
  ], { glow: [RM.glowY] }),

  // a stack of shallow wooden noodle crates fresh from the noodle maker, stamped NOODLES, nests of noodles on top
  piece('rmncrates', 'Ramen noodle crates', 1, 1, 360, 'wood', [
    ...[0, 0.8, -0.6, 0.4].flatMap((o, k) => [B(16 + o, 3.2 + k * 6.6, 0, 28, 6.2, 22, k % 2 ? RM.woodL : RM.wood, { m: 'wood', tex: 'grain', pd: 'h', r: 0.6 }), PC(16 + o, 3.2 + k * 6.6, 11.05, 14, 3.6, stamp)]),
    ...[[9, -5], [23, -5], [9.6, 5], [22.4, 5]].map(([x, z]) => S(x, 26.6, z, 4.4, 1.6, 3.6, RM.noodle, { ...NOO, seg: 10 })),
  ]),
];
