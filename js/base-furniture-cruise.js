/* base-furniture-cruise.js  -  the Cruise cabin set (furniture expansion session l, 2026-10-17): a whole stateroom of a
   luxury ocean liner (the S.S. Anne's kind), as Animal Crossing's Happy Home Paradise does a room type. Crisp navy and
   white over teak, brass fittings and coral-red accents with a touch of art deco: a curtained bunk berth, a teak dresser
   with sea-rails, a steamer-trunk wardrobe that opens, a round-mirror vanity and its pouf, a club armchair, a striped
   settee, a steamer lounger, a fiddle-rail table, the voyage chart desk, a room-service cart under a cloche, a mini bar,
   the cabin telephone, a funnel whistle, a brass binnacle, a balcony rail with its deck light, a mooring bollard, a life
   ring, the ship's clock and barometer, a porthole mirror and a shuffleboard court. Wingull on a piling, a Wailmer pool
   float, a Corsola centrepiece and a Tentacool lamp for the Pokémon touches. All solo, fixed colours, sold all year.
   An upright piece is a list of parts in painted units (32 a tile), as in js/base-furniture-ramen.js: `x` across from
   the left of its front, `h` up from the floor (a wall piece's from the foot of its strip), `z` out to the front from
   its middle (a wall piece's from the wall). They're painted here from any side, and js/base-models-cruise.js builds the
   same list as 3D parts (BUILT), so picture and model agree. `tex: 'grain'` is painted only (the model stays plain
   colour). A `pic` part (the trunk's labels, the chart, the dials, the striped cushions) is painted on the front only,
   and the model wears that crop of the painting. A disc with `ax: 'x'` stands side-on (the cart's castors). The trunk's
   and the mini bar's doors swing (`doors`, `inside`). The shuffleboard court is painted from above (RUG). */

import { sh, oval, ovalShade, floorShadow, ctx, hash, glass as glassPane } from './base-paint.js';

export const CZ = {
  navy: '#1e2f5a', navyD: '#131d3c', navyL: '#34508a', white: '#f3f1ea', whiteD: '#d6d2c4', sheet: '#fbfaf5',
  teak: '#a5652f', teakD: '#6c3c18', teakL: '#c88a4e', brass: '#c9a043', brassL: '#efd77e', brassD: '#8a6a22',
  coral: '#e04f3c', coralD: '#a3302a', coralL: '#f27c64', sea: '#3f8fc0', seaL: '#8cc8e6', green: '#3a9a5a',
  iron: '#2b3038', ironL: '#4a525c', rope: '#d9c08a', ropeD: '#a68a56', silver: '#c8ccd0', silverL: '#e6e8ea', silverD: '#8a9096',
  glowW: '#fff1c8', cream: '#f6ecd4', parch: '#efe0b8',
  gull: '#fbfbf8', gullB: '#5a8ac8', beak: '#f2c23a', wail: '#3c7ec8', wailD: '#24548e', wailL: '#f0e6c4',
  cors: '#f7a0b0', corsD: '#d8607a', corsL: '#ffd0d8', tcool: '#8ad4f2', tcoolD: '#3a8ab8', gem: '#e0383c', ink: '#1a1a20',
};
const GROUP = 'Cruise cabin';
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
const GR = { m: 'wood', tex: 'grain' }, GRH = { m: 'wood', tex: 'grain', pd: 'h' }, VL = (r = 1.6) => ({ m: 'cloth', r });

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
const word = (s, fg, bg, k = 0.82) => (g, x, y, w, h) => {
  if (bg) { g.fillStyle = bg; g.fillRect(x, y, w, h); }
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `bold ${h * k}px ${SANS}`; g.fillText(s, x + w / 2, y + h * 0.54, w * 0.94);
};
const text = (g, s, cx, cy, size, c, maxW) => { g.fillStyle = c; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `bold ${size}px ${SANS}`; g.fillText(s, cx, cy, maxW); };

/** Navy and white awning stripes, upright. */
function stripes(g, x, y, w, h) {
  g.fillStyle = CZ.white; g.fillRect(x, y, w, h);
  g.fillStyle = CZ.navy; for (let sx = x + 1.1; sx < x + w; sx += 4.4) g.fillRect(sx, y, 2.2, h);
}

/** A steamer trunk's travel labels slapped on at angles: a coral oval, a navy roundel and a cream tag. */
function labels(g, x, y, w, h) {
  const lab = (cx, cy, rx, ry, rot, bg, fg, s, round) => {
    g.save(); g.translate(cx, cy); g.rotate(rot);
    g.fillStyle = bg; g.beginPath(); if (round) g.ellipse(0, 0, rx, ry, 0, 0, TAU); else g.roundRect(-rx, -ry, rx * 2, ry * 2, 0.6); g.fill();
    g.strokeStyle = fg; g.lineWidth = 0.3; g.beginPath(); if (round) g.ellipse(0, 0, rx - 0.6, ry - 0.6, 0, 0, TAU); else g.rect(-rx + 0.5, -ry + 0.5, rx * 2 - 1, ry * 2 - 1); g.stroke();
    text(g, s, 0, 0, ry * 0.62, fg, rx * 1.6); g.restore();
  };
  lab(x + w * 0.34, y + h * 0.22, w * 0.3, h * 0.15, -0.2, CZ.coral, CZ.cream, 'VERMILION', true);
  lab(x + w * 0.68, y + h * 0.5, w * 0.27, h * 0.2, 0.1, CZ.navyL, CZ.brassL, 'S.S. TIDAL', true);
  lab(x + w * 0.38, y + h * 0.8, w * 0.32, h * 0.12, 0.15, CZ.cream, CZ.navy, 'SLATEPORT', false);
}

/** A compass rose: four long points and four short in navy and brass, north in coral, on an optional disc. */
function rose(g, cx, cy, r, bg) {
  if (bg) { g.fillStyle = bg; g.beginPath(); g.arc(cx, cy, r * 1.2, 0, TAU); g.fill(); g.strokeStyle = CZ.navy; g.lineWidth = 0.25; g.stroke(); }
  for (let k = 0; k < 8; k++) {
    const a = k / 8 * TAU - Math.PI / 2, l = k % 2 ? r * 0.55 : r, s = r * 0.17, ca = Math.cos(a + Math.PI / 2) * s, sa = Math.sin(a + Math.PI / 2) * s;
    g.fillStyle = k === 0 ? CZ.coral : k % 2 ? CZ.brassD : CZ.navy;
    g.beginPath(); g.moveTo(cx + Math.cos(a) * l, cy + Math.sin(a) * l); g.lineTo(cx + ca, cy + sa); g.lineTo(cx - ca, cy - sa); g.closePath(); g.fill();
  }
  g.fillStyle = CZ.brass; g.beginPath(); g.arc(cx, cy, r * 0.12, 0, TAU); g.fill();
}

/** The voyage chart: parchment over a pale sea, a grid, three coasts, the route dotted in coral between two ports. */
function chart(g, x, y, w, h) {
  g.fillStyle = CZ.parch; g.fillRect(x, y, w, h);
  g.fillStyle = 'rgba(63,143,192,0.28)'; g.fillRect(x + 1, y + 1, w - 2, h - 2);
  g.strokeStyle = 'rgba(30,47,90,0.35)'; g.lineWidth = 0.2;
  for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(x + w * i / 6, y + 1); g.lineTo(x + w * i / 6, y + h - 1); g.stroke(); }
  for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(x + 1, y + h * i / 4); g.lineTo(x + w - 1, y + h * i / 4); g.stroke(); }
  const land = (pts) => { g.fillStyle = '#cdb47a'; g.strokeStyle = CZ.teakD; g.lineWidth = 0.3; g.beginPath(); pts.forEach(([px, py], i) => (i ? g.lineTo(x + px * w, y + py * h) : g.moveTo(x + px * w, y + py * h))); g.closePath(); g.fill(); g.stroke(); };
  land([[0.03, 0.08], [0.3, 0.05], [0.36, 0.3], [0.27, 0.52], [0.1, 0.47], [0.03, 0.3]]);
  land([[0.6, 0.56], [0.86, 0.5], [0.97, 0.7], [0.9, 0.94], [0.66, 0.92], [0.57, 0.73]]);
  land([[0.46, 0.2], [0.53, 0.17], [0.55, 0.27], [0.48, 0.3]]);
  g.strokeStyle = CZ.coral; g.lineWidth = 0.5; g.setLineDash([1, 0.8]);
  g.beginPath(); g.moveTo(x + w * 0.3, y + h * 0.42); g.bezierCurveTo(x + w * 0.45, y + h * 0.72, x + w * 0.55, y + h * 0.3, x + w * 0.66, y + h * 0.6); g.stroke(); g.setLineDash([]);
  for (const [px, py] of [[0.3, 0.42], [0.66, 0.6]]) { g.fillStyle = CZ.coral; g.beginPath(); g.arc(x + px * w, y + py * h, 0.8, 0, TAU); g.fill(); }
  rose(g, x + w * 0.84, y + h * 0.24, h * 0.15);
  text(g, 'KANTO - HOENN', x + w * 0.27, y + h * 0.86, h * 0.08, CZ.navy, w * 0.46);
  g.strokeStyle = CZ.navy; g.lineWidth = 0.4; g.strokeRect(x + 0.6, y + 0.6, w - 1.2, h - 1.2);
}

/** A white dial: its ticks, and what it reads. */
function dial(g, x, y, w, h, fn) {
  const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) * 0.46;
  g.fillStyle = CZ.white; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill();
  fn(cx, cy, r);
  g.fillStyle = CZ.brass; g.beginPath(); g.arc(cx, cy, r * 0.08, 0, TAU); g.fill();
}
const hand = (g, cx, cy, a, l, wd, c) => { g.strokeStyle = c; g.lineCap = 'round'; g.lineWidth = wd; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.sin(a) * l, cy - Math.cos(a) * l); g.stroke(); };
/** The ship's clock: twelve ticks, its quarters numbered, ten past ten. */
const clockFace = (g, x, y, w, h) => dial(g, x, y, w, h, (cx, cy, r) => {
  g.strokeStyle = CZ.navy; g.lineCap = 'butt';
  for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; g.lineWidth = k % 3 ? 0.3 : 0.7; g.beginPath(); g.moveTo(cx + Math.sin(a) * r * 0.8, cy - Math.cos(a) * r * 0.8); g.lineTo(cx + Math.sin(a) * r * 0.94, cy - Math.cos(a) * r * 0.94); g.stroke(); }
  ['12', '3', '6', '9'].forEach((s, k) => text(g, s, cx + Math.sin(k * Math.PI / 2) * r * 0.6, cy - Math.cos(k * Math.PI / 2) * r * 0.6, r * 0.26, CZ.navy));
  hand(g, cx, cy, -TAU / 6, r * 0.45, 0.8, CZ.ink); hand(g, cx, cy, TAU / 6 * 0.35, r * 0.72, 0.5, CZ.ink); hand(g, cx, cy, TAU * 0.55, r * 0.8, 0.25, CZ.coral);
});
/** The barometer: a scale round the top, RAIN, CHANGE and FAIR, its needle swung to fair. */
const baroFace = (g, x, y, w, h) => dial(g, x, y, w, h, (cx, cy, r) => {
  g.strokeStyle = CZ.navy; g.lineWidth = 0.25;
  for (let k = 0; k <= 20; k++) { const a = -2.2 + k / 20 * 4.4; g.beginPath(); g.moveTo(cx + Math.sin(a) * r * (k % 5 ? 0.84 : 0.76), cy - Math.cos(a) * r * (k % 5 ? 0.84 : 0.76)); g.lineTo(cx + Math.sin(a) * r * 0.94, cy - Math.cos(a) * r * 0.94); g.stroke(); }
  text(g, 'RAIN', cx - r * 0.5, cy + r * 0.05, r * 0.2, CZ.navy); text(g, 'CHANGE', cx, cy - r * 0.48, r * 0.2, CZ.navy); text(g, 'FAIR', cx + r * 0.5, cy + r * 0.05, r * 0.2, CZ.coral);
  hand(g, cx, cy, 1.25, r * 0.78, 0.4, CZ.ink); hand(g, cx, cy, 1.0, r * 0.55, 0.3, CZ.brassD);
});

/* ---------- the kinds ---------- */

/** What js/base-models-cruise.js builds for each upright and wall kind: its parts, doors and default material. */
export const BUILT = {};
/** The shuffleboard court's outline from above, in painted units across its 1 x 3 tiles, corners cut. */
export const RUG = [[2, 1], [30, 1], [31, 2], [31, 94], [30, 95], [2, 95], [1, 94], [1, 2]];

function piece(id, name, w, h, price, mat, parts, { doors = [], inside, ...rest } = {}) {
  BUILT[id] = { parts, doors, inside, mat };
  const all = [...parts, ...doors.flatMap(d => d.parts)];
  return { id, name, group: GROUP, solo: true, w, h, price, ...rest, draw(x, b, vw, dir) { floorShadow(x, b, vw); paintParts(all, x, b, vw, dir, w * 32); } };
}
function wallPiece(id, name, w, price, mat, parts, rest = {}) {
  BUILT[id] = { parts, doors: [], mat };
  return { id, name, group: GROUP, solo: true, w, h: 1, layer: 'wall', price, ...rest, wall(x) { paintParts(parts, x, 96, w * 32, 0, w * 32); } };
}

/** A teak drawer front and its brass cup pull. */
const drawer = (x, h, z, w, hh) => [B(x, h, z, w, hh, 0.8, CZ.teakL, GL), B(x, h + hh * 0.18, z + 0.6, Math.min(7, w * 0.3), 1.4, 0.6, CZ.brass, MT)];
/** A rope coil lying on the deck: three flat turns, narrowing as they stack. */
const coil = (x, h, z, r) => [0, 1, 2].map(k => RG(x, h + k * 1.8, z, r - k * 0.5, 0.95, k % 2 ? CZ.ropeD : CZ.rope, { m: 'cloth', flat: true }));

export const CRUISE_KINDS = [
  // the cabin's built-in bunk berth: solid teak ends and canopy, two made-up berths under navy blankets, navy curtains
  // drawn back on brass rails with coral tie-backs, a sea-rail on the top bunk, a brass ladder and a berth light
  piece('crzbunk', 'Cruise cabin bunk berth', 2, 1, 1400, 'wood', [
    ...[2.5, 61.5].map(x => B(x, 40, 0, 5, 80, 30, CZ.teak, GR)),
    B(32, 40, -14, 56, 78, 2, CZ.teakD, WD),
    B(32, 6, 0, 54, 12, 28, CZ.teakD, WD), ...drawer(18, 6, 14.2, 24, 8), ...drawer(46, 6, 14.2, 24, 8),
    B(32, 14.5, 0, 54, 5, 26, CZ.sheet, VL(2)), B(38, 15, 1, 42, 5.4, 26.6, CZ.navy, VL(2)), B(38, 17.4, 13.4, 42, 0.8, 0.6, CZ.white, PL), B(11, 18.6, -4, 10, 3.6, 14, CZ.white, VL(1.5)),
    B(32, 44, 0, 54, 4, 28, CZ.teak, WD),
    B(32, 48.5, 0, 54, 5, 26, CZ.sheet, VL(2)), B(38, 49, 1, 42, 5.4, 26.6, CZ.navy, VL(2)), B(11, 52.6, -4, 10, 3.6, 14, CZ.white, VL(1.5)),
    B(30, 54, 13.6, 46, 6, 1.4, CZ.teak, WD), B(30, 57.2, 13.6, 46, 0.6, 1.6, CZ.brass, MT),
    B(32, 78, 0, 64, 4, 32, CZ.teak, WD), B(32, 76, 15.4, 60, 0.8, 0.6, CZ.brass, MT),
    DS(32, 68, -12.6, 2.6, 0.8, CZ.glowW, { m: 'glow', seg: 12 }), RG(32, 68, -12.2, 2.6, 0.4, CZ.brass, MT),
    ...[[73.6, 61], [40, 27.4]].flatMap(([rail, mid]) => [
      RD([5.4, rail, 14.2], [58.6, rail, 14.2], 0.45, CZ.brass, MT),
      ...[7.4, 11.4, 52.6, 56.6].map(x => C(x, mid, 13.2, 2.4, (rail - mid) * 2 - 1, CZ.navy, { m: 'cloth', sz: 0.6, seg: 10 })),
      ...[9.4, 54.6].map(x => B(x, mid - 2, 14.6, 8.4, 1.6, 1, CZ.coral, CL)),
    ]),
    ...[44.4, 49.6].map(x => RD([x, 0, 15], [x, 58, 15], 0.6, CZ.brass, MT)),
    ...[10, 22, 34].map(h => RD([44.4, h, 15], [49.6, h, 15], 0.45, CZ.brass, MT)),
  ], { glow: [CZ.glowW] }),

  // a built-in teak dresser: six drawers with brass cup pulls, a brass trim, and a raised sea-rail round its top so the
  // vase and the folded towel don't slide in a swell
  piece('crzdresser', 'Cruise teak sea-rail dresser', 2, 1, 980, 'wood', [
    B(32, 1.5, 0, 60, 3, 24, CZ.teakD, PL),
    B(32, 19, 0, 62, 32, 26, CZ.teak, GR),
    ...[8.5, 18.5, 28.5].flatMap(h => [...drawer(17, h, 13.3, 28, 8.4), ...drawer(47, h, 13.3, 28, 8.4)]),
    B(32, 35.4, 13.3, 62, 0.8, 0.6, CZ.brass, MT),
    B(32, 36, 0, 64, 2, 28, CZ.teakD, GL),
    B(32, 38.4, 13.2, 64, 2.8, 1.2, CZ.teak, WD), B(32, 38.4, -13.2, 64, 2.8, 1.2, CZ.teak, WD),
    ...[0.6, 63.4].map(x => B(x, 38.4, 0, 1.2, 2.8, 28, CZ.teak, WD)),
    LA(14, 37, -2, [[2.2, 0], [3.2, 3], [1.4, 8], [2, 10]], CZ.navy, { m: 'gloss', seg: 12 }),
    S(14, 49, -2, 3, 2.6, 3, CZ.coral, { m: 'cloth', seg: 8 }), ...[[11.6, 47.4], [16.4, 47.6]].map(([x, h]) => S(x, h, -1, 1.8, 1.6, 1.8, CZ.coralL, { m: 'cloth', seg: 8 })),
    B(48, 38.6, 0, 13, 3.2, 10, CZ.white, VL(1)), B(48, 38.6, 5.1, 13, 1, 0.4, CZ.coral, PL),
  ]),

  // a steamer trunk stood on end as a wardrobe: navy canvas, teak slats, brass corners and lock, travel labels from
  // Vermilion and Slateport (a tap opens it on the clothes hung inside)
  piece('crztrunk', 'Cruise steamer trunk wardrobe', 1, 1, 1100, 'gloss', [
    B(16, 0.8, -3, 26, 1.6, 18, CZ.teakD, PL),
    B(16, 30, -3, 28, 58, 20, CZ.navy, GL),
    ...[6, 54].map(h => B(16, h, -3, 28.4, 2, 20.4, CZ.teak, WD)),
    RD([11, 59.6, -3], [21, 59.6, -3], 0.9, CZ.teakD, GL),
  ], {
    doors: [{ hinge: [2, 10], side: 1, parts: [
      B(16, 30, 8.5, 28, 58, 3, CZ.navy, GL),
      ...[6, 30, 54].map(h => B(16, h, 10.4, 28.4, 2, 0.8, CZ.teak, WD)),
      ...[[3, 57.2], [29, 57.2], [3, 2.8], [29, 2.8]].map(([x, h]) => B(x, h, 10.4, 3, 3, 0.8, CZ.brass, MT)),
      B(26, 30, 11, 2.6, 4, 0.6, CZ.brassL, MT),
      PC(15, 42, 10.35, 22, 20, labels),
    ] }],
    inside: { x: 16, h: 30, w: 24, hh: 52, z: 7 },
  }),

  // a white lacquer vanity: two pedestals of navy drawers, a brass edge, a round brass-ringed mirror on its back, a coral
  // scent bottle and a powder pot
  piece('crzvanity', 'Cruise deco round-mirror vanity', 1, 1, 900, 'gloss', [
    ...[5, 27].flatMap(x => [B(x, 13.5, 0, 9, 27, 20, CZ.white, GL), ...[6, 14, 22].map(h => B(x, h, 10.2, 7.4, 6, 0.6, CZ.navy, GL)), ...[6, 14, 22].map(h => DS(x, h + 1, 10.7, 0.7, 0.6, CZ.brass, { m: 'metal', seg: 6 }))]),
    B(16, 25, 1, 14, 4, 18, CZ.white, GL), B(16, 25, 10.2, 12, 3, 0.4, CZ.navy, GL),
    B(16, 28, 0, 32, 2, 22, CZ.white, GL), B(16, 28, 11.2, 32, 0.8, 0.4, CZ.brass, MT),
    B(16, 31, -8, 6, 4, 4, CZ.white, GL),
    DS(16, 44, -8.4, 10.4, 0.6, CZ.silverL, { m: 'metal', seg: 20 }), RG(16, 44, -8, 10.6, 1.3, CZ.brass, MT),
    PR(16, 55, -8, [[-4, 0], [4, 0], [2, 2.6], [0, 3.4], [-2, 2.6]], 1.2, CZ.brass, MT),
    LA(8, 29, 3, [[1.6, 0], [2, 3], [0.6, 4], [1, 5.6]], CZ.coral, { m: 'gloss', seg: 10 }),
    LA(23, 29, 4, [[2.4, 0], [2.4, 2], [0.4, 2.8]], CZ.navy, { m: 'gloss', seg: 10 }),
  ]),

  // a round coral pouf on four brass legs, white piping round its seat
  piece('crzpouf', 'Cruise coral vanity pouf', 1, 1, 280, 'cloth', [
    ...[[7, 6], [25, 6], [7, -6], [25, -6]].map(([x, z]) => RD([x, 0.4, z], [x + (16 - x) * 0.12, 11, z * 0.9], 0.6, CZ.brass, MT)),
    C(16, 11.4, 0, 10, 1.4, CZ.brass, { m: 'metal', seg: 16 }),
    C(16, 14.4, 0, 10.6, 4.8, CZ.coral, { m: 'cloth', seg: 18 }),
    S(16, 16.8, 0, 10.4, 1.8, 10.4, CZ.coral, { m: 'cloth', seg: 16 }),
    RG(16, 12.2, 0, 10.7, 0.4, CZ.white, { m: 'plain', flat: true }),
    S(16, 18.4, 0, 0.8, 0.5, 0.8, CZ.coralD, { m: 'cloth', seg: 6 }),
  ]),

  // a deco club armchair: deep navy velvet with rolled arms piped in white, a coral cushion, on a teak plinth
  piece('crzarmchair', 'Cruise deco club armchair', 1, 1, 820, 'cloth', [
    B(16, 1.5, 0, 28, 3, 24, CZ.teakD, GL),
    B(16, 8, 1, 22, 10, 22, CZ.navy, VL(2)),
    B(16, 14.6, 3, 21, 4, 20, CZ.navyL, VL(1.6)),
    B(16, 22, -9, 30, 30, 8, CZ.navy, VL(3)),
    ...[3.2, 28.8].flatMap(x => [B(x, 11, 0, 6.4, 18, 25, CZ.navy, VL(2.4)), DS(x, 21, 0, 3.4, 25, CZ.navy, { m: 'cloth', seg: 12 }), RG(x, 21, 12.6, 3.4, 0.4, CZ.white, PL)]),
    B(16, 22, -3.6, 13, 9, 4, CZ.coral, VL(2)),
  ]),

  // a striped stateroom settee for two: navy-and-white ticking on its cushions, teak arms and top rail, coral bolsters
  piece('crzsettee', 'Cruise striped stateroom settee', 2, 1, 1250, 'cloth', [
    ...[5, 59].flatMap(x => [9, -9].map(z => B(x, 1, z, 3, 2, 3, CZ.teakD, WD))),
    B(32, 4, 0, 60, 4, 24, CZ.teak, GR),
    ...[18.5, 45.5].flatMap(x => [B(x, 9.6, 2, 26, 7, 22, CZ.white, VL(2)), PC(x, 9.6, 13.05, 25, 6.4, stripes)]),
    B(32, 21.6, -9, 54, 22, 6, CZ.white, VL(3)), PC(32, 21.6, -5.95, 52, 20, stripes),
    B(32, 33.4, -9, 58, 1.6, 7, CZ.teak, WD),
    ...[2.5, 61.5].map(x => B(x, 12, 0, 5, 18, 24, CZ.teak, GR)),
    ...[2.5, 61.5].map(x => B(x, 21.4, 1, 5.6, 1, 24, CZ.brass, MT)),
    ...[9, 55].map(x => DS(x, 16, 1, 3, 20, CZ.coral, { m: 'cloth', seg: 12 })),
  ]),

  // a steamer deck lounger seen side-on: teak frames and slats, a white pad, a navy blanket with white stripes thrown over
  // its foot, armrests and a coral pillow
  piece('crzlounger', 'Cruise steamer deck lounger', 2, 1, 1150, 'wood', [
    ...[12, -12].map(z => PR(0, 0, z, [[3, 0], [6, 0], [16, 11], [57, 11], [58, 0], [61, 0], [61, 15], [20, 15], [10, 41], [6, 41], [16, 13]], 2, CZ.teak, WD)),
    PR(0, 0, 0, [[8, 39], [19, 15], [23, 15], [12, 40]], 22, CZ.teakL, WD),
    PR(0, 0, 0, [[11.6, 40], [22.4, 16], [25.4, 16.8], [14.6, 41]], 20, CZ.white, CL),
    B(40, 13.5, 0, 38, 2, 24, CZ.teakL, WD),
    B(41, 16, 0, 36, 3, 21, CZ.white, VL(1)),
    B(51, 17.6, 0, 18, 2, 23, CZ.navy, VL(0.6)), ...[45, 57].map(x => B(x, 17.7, 0, 1.4, 2.2, 23.2, CZ.white, PL)),
    B(60.6, 11, 0, 1.6, 14, 23, CZ.navy, VL(0.4)),
    ...[11, -11].flatMap(z => [B(27.5, 25, z, 21, 1.4, 3, CZ.teak, WD), RD([36, 15, z], [36, 24.4, z], 0.7, CZ.teak, WD)]),
    B(17.4, 33, 0, 4, 8, 14, CZ.coral, VL(1.8)),
  ]),

  // a round teak cabin table on a pedestal: a brass fiddle rail round its top, a tea cup on its saucer and a carafe
  piece('crztable', 'Cruise fiddle-rail cabin table', 1, 1, 640, 'wood', [
    B(16, 1, 0, 26, 2, 4, CZ.teakD, WD), B(16, 1, 0, 4, 2, 26, CZ.teakD, WD),
    LA(16, 2, 0, [[5, 0], [3, 3], [2.2, 5]], CZ.brass, { m: 'metal', seg: 12 }),
    C(16, 14, 0, 2.2, 22, CZ.teak, { m: 'wood', seg: 12 }),
    C(16, 26, 0, 14, 2, CZ.teak, { m: 'gloss', seg: 20 }),
    ...[0, 1, 2, 3, 4, 5].map(k => { const a = k / 6 * TAU + 0.5; return RD([16 + Math.cos(a) * 13.4, 27, Math.sin(a) * 13.4], [16 + Math.cos(a) * 13.4, 29.2, Math.sin(a) * 13.4], 0.35, CZ.brass, MT); }),
    RG(16, 29.2, 0, 13.4, 0.45, CZ.brass, { m: 'metal', flat: true }),
    C(10, 27.3, 3, 3, 0.6, CZ.white, { m: 'gloss', seg: 12 }), LA(10, 27.6, 3, [[1.2, 0], [1.9, 2.8]], CZ.white, { m: 'gloss', seg: 10 }), RG(12.2, 29, 3, 0.8, 0.25, CZ.white, PL),
    LA(21, 27, -2, [[2.4, 0], [2.6, 3], [1, 6.6], [1.2, 8]], '#cfe8f4', { m: 'glass', seg: 12 }), C(21, 34.4, -2, 1.3, 0.8, CZ.brass, { m: 'metal', seg: 8 }),
  ]),

  // the voyage chart desk: a teak pedestal of drawers and turned legs, a chart of the route pinned on its board, a
  // brass-meridian globe, a rolled chart and the dividers left open on the top
  piece('crzchartdesk', 'Cruise voyage chart desk', 2, 1, 1350, 'wood', [
    B(9, 14, 0, 16, 28, 24, CZ.teak, GR), ...[6, 14, 22].flatMap(h => drawer(9, h, 12.3, 13, 7)),
    ...[9, -9].map(z => C(58, 14, z, 1.6, 28, CZ.teak, { m: 'wood', seg: 8, rb: 1.2 })),
    B(36, 26.4, -10, 44, 3, 1.2, CZ.teakD, WD),
    B(32, 29, 0, 64, 2, 28, CZ.teakD, GL),
    B(36, 45, -10, 42, 28, 1.6, CZ.teak, WD), PC(36, 45, -9.15, 39, 25, chart),
    ...[[17.6, 58.2], [54.4, 58.2]].map(([x, h]) => DS(x, h, -8.8, 0.6, 0.4, CZ.brass, { m: 'metal', seg: 6 })),
    LA(8, 30, 4, [[3.4, 0], [1, 2], [0.8, 4]], CZ.brass, { m: 'metal', seg: 10 }),
    S(8, 39.4, 4, 5.4, 5.4, 5.4, CZ.sea, { m: 'gloss', seg: 14 }), RG(8, 39.4, 4, 6, 0.4, CZ.brass, MT),
    RD([44, 30.2, 7], [50, 30.2, 10], 0.3, CZ.brass, MT), RD([44, 30.2, 7], [51, 30.2, 5], 0.3, CZ.brass, MT),
    RD([24, 31.3, 6], [36, 31.3, 8], 1.3, CZ.cream, PL),
  ]),

  // a brass room-service cart on castors: a white cloth with a coral hem, a silver cloche on its platter, a rose in a
  // bud vase and a folded napkin (a tap lifts the cloche on a puff of steam)
  piece('crzservice', 'Cruise room-service cart', 1, 1, 780, 'metal', [
    ...[[5, 9], [27, 9], [5, -9], [27, -9]].flatMap(([x, z]) => [DS(x, 1.6, z, 1.6, 1, CZ.iron, { m: 'gloss', seg: 10, ax: 'x' }), RD([x, 3, z], [x, 24, z], 0.6, CZ.brass, MT)]),
    B(16, 8, 0, 24, 1.2, 20, CZ.teak, WD),
    B(16, 24.6, 0, 27, 1.6, 23, CZ.white, CL), B(16, 21.6, 11.7, 27, 6, 0.6, CZ.white, CL), B(16, 18.9, 12.1, 27, 0.8, 0.4, CZ.coral, PL),
    ...[9, -9].map(z => RD([5, 25, z], [2, 30, z], 0.5, CZ.brass, MT)), RD([2, 30, -9], [2, 30, 9], 0.6, CZ.brass, MT),
    C(17, 25.8, 0, 7.8, 0.8, CZ.silver, { m: 'metal', seg: 16 }),
    LA(17, 26.2, 0, [[7, 0], [7, 0.8], [6.4, 3], [4.6, 6], [2, 7.4], [0, 7.8]], CZ.silverL, { m: 'metal', seg: 16 }), S(17, 34.6, 0, 1, 1, 1, CZ.silver, MT),
    LA(26, 25.4, -6, [[1, 0], [1.2, 4], [0.5, 6]], '#cfe8f4', { m: 'glass', seg: 8 }), RD([26, 29, -6], [26, 32, -6], 0.2, CZ.green, PL), S(26, 32.6, -6, 1.2, 1.2, 1.2, CZ.coral, { m: 'cloth', seg: 8 }),
    B(7.6, 26.2, 5, 5, 1.2, 4, CZ.coral, CL),
  ]),

  // a teak mini bar with a deco brass sunburst on its door, a brass tray on top with a cocktail shaker and two coupes
  // (a tap opens it on the chilled shelves)
  piece('crzminibar', 'Cruise teak mini bar', 1, 1, 880, 'wood', [
    B(16, 1, 0, 28, 2, 22, CZ.teakD, PL),
    B(16, 17, -1, 28, 30, 22, CZ.teak, GR),
    B(16, 33, 0, 30, 2, 24, CZ.teakD, GL),
    B(16, 34.4, 0, 22, 0.8, 14, CZ.brass, MT),
    LA(10, 34.8, 0, [[2, 0], [2.2, 6], [1.4, 8], [0.8, 9.6]], CZ.silverL, { m: 'metal', seg: 12 }),
    ...[18, 23].map(x => LA(x, 34.8, 2, [[1.4, 0], [0.3, 0.4], [0.3, 3], [2.4, 5.4]], '#cfe8f4', { m: 'glass', seg: 10 })),
    S(23.6, 39.4, 2, 0.7, 0.7, 0.7, CZ.coral, { m: 'gloss', seg: 6 }),
  ], {
    doors: [{ hinge: [3, 11.6], side: 1, parts: [
      B(16, 17, 10.8, 26, 28, 1.6, CZ.teakL, GL),
      DS(16, 7, 11.7, 5, 0.4, CZ.brass, { m: 'metal', seg: 16, ry: 5 }),
      ...[-2, -1, 0, 1, 2].map(k => { const a = k * 0.5; return RD([16, 7, 11.9], [16 + Math.sin(a) * 11, 7 + Math.cos(a) * 15, 11.9], 0.3, CZ.brass, MT); }),
      B(26, 18, 12, 1.2, 6, 1, CZ.brassL, MT),
    ] }],
    inside: { x: 16, h: 17, w: 24, hh: 26, z: 10 },
  }),

  // a candlestick telephone, black and brass, its earpiece on the hook, on a little round teak stand (a tap rings it)
  piece('crzphone', 'Cruise cabin telephone stand', 1, 1, 420, 'wood', [
    ...[0, 1, 2].map(k => { const a = k / 3 * TAU + 0.6; return RD([16 + Math.cos(a) * 7, 0.4, Math.sin(a) * 7], [16 + Math.cos(a) * 6, 21, Math.sin(a) * 6], 0.7, CZ.teak, WD); }),
    C(16, 8, 0, 7, 1, CZ.teak, { m: 'wood', seg: 14 }),
    C(16, 22, 0, 8, 1.6, CZ.teak, { m: 'gloss', seg: 16 }), RG(16, 23.1, 0, 7.8, 0.35, CZ.brass, { m: 'metal', flat: true }),
    LA(16, 22.8, 0, [[3.4, 0], [3.4, 1], [1, 2.4], [0.7, 12]], CZ.iron, { m: 'gloss', seg: 12 }),
    LA(16, 34.6, 0, [[0.7, 0], [2.2, 2.2], [2.2, 2.8]], CZ.brass, { m: 'metal', seg: 12 }),
    RD([16.6, 31.4, 0], [19.6, 31.4, 0], 0.3, CZ.brass, MT),
    RD([20.4, 32.4, 0], [20.4, 27.4, 0], 1, CZ.iron, GL), C(20.4, 26.6, 0, 1.6, 1.4, CZ.iron, { m: 'gloss', seg: 10 }),
    RD([18, 23.6, 2], [21.6, 23.6, 5], 0.25, CZ.ink, PL),
    B(10, 23.4, 3, 6, 0.6, 4, CZ.cream, PL),
  ]),

  // a little coral funnel with its black top and white band, a brass steam whistle beside it on a lever and pull chain,
  // on a teak deck plate (a tap blows it)
  piece('crzwhistle', 'Cruise funnel steam whistle', 1, 1, 760, 'gloss', [
    B(16, 1.5, 0, 30, 3, 26, CZ.teak, GRH),
    C(13, 22, -1, 8.6, 38, CZ.coral, { m: 'gloss', seg: 16, rb: 9.6 }),
    C(13, 33, -1, 8.9, 2.6, CZ.white, { m: 'gloss', seg: 16 }),
    C(13, 38.5, -1, 8.5, 6, CZ.iron, { m: 'gloss', seg: 16 }),
    C(13, 41.6, -1, 7.6, 0.4, CZ.ink, { m: 'plain', seg: 16 }),
    C(26, 15, 6, 0.9, 24, CZ.brass, { m: 'metal', seg: 8 }),
    LA(26, 27, 6, [[1.4, 0], [2.3, 0.6], [2.3, 8], [2.7, 8.4], [1.2, 10], [0, 10.6]], CZ.brass, { m: 'metal', seg: 12 }),
    RD([26, 35, 6], [29.6, 37, 6], 0.4, CZ.brassD, MT), RD([29.6, 37, 6], [29.6, 22, 6], 0.2, CZ.brassD, MT), S(29.6, 21.2, 6, 0.9, 1.3, 0.9, CZ.teak, { m: 'gloss', seg: 8 }),
  ]),

  // a brass binnacle on a teak column: its hood over a lit compass card, the port and starboard balls on their arms (a
  // tap lights the binnacle lamp)
  piece('crzbinnacle', 'Cruise brass binnacle', 1, 1, 950, 'metal', [
    LA(16, 0, 0, [[9, 0], [9, 1.4], [6, 3], [5, 4]], CZ.teakD, { m: 'wood', seg: 8 }),
    C(16, 15, 0, 5, 22, CZ.teak, { m: 'wood', seg: 8, rb: 6 }),
    C(16, 27, 0, 6.6, 2, CZ.brass, { m: 'metal', seg: 14 }),
    LA(16, 28, 0, [[6, 0], [7.2, 3], [7.4, 5]], CZ.brass, { m: 'metal', seg: 16 }),
    LA(16, 33, 0, [[7.4, 0], [7.2, 3], [5.4, 7], [2, 9], [0, 9.6]], CZ.brass, { m: 'metal', seg: 16 }),
    DS(16, 36, 7, 3.4, 0.8, CZ.glowW, { m: 'glow', seg: 14 }), PC(16, 36, 7.5, 7, 7, (g, x, y, w, h) => rose(g, x + w / 2, y + h / 2, w * 0.38, CZ.glowW)),
    RG(16, 36, 7.3, 3.6, 0.4, CZ.brassD, MT),
    ...[[9, 4.4, CZ.coral], [23, 27.6, CZ.green]].flatMap(([a, x, c]) => [RD([a, 31, 0], [x, 31, 0], 0.8, CZ.brass, MT), S(x, 31, 0, 3.4, 3.4, 3.4, c, { m: 'gloss', seg: 12 })]),
    S(16, 43, 0, 1.2, 1.2, 1.2, CZ.brassL, MT),
  ], { glow: [CZ.glowW] }),

  // a run of balcony rail: white stanchions and wires under a teak cap rail, and a deck lamp with a frosted globe at its
  // end (a tap lights it)
  piece('crzrail', 'Cruise balcony rail and deck light', 2, 1, 900, 'gloss', [
    B(32, 1, 4, 64, 2, 12, CZ.teak, GRH),
    ...[3, 18, 33, 48].map(x => RD([x, 2, 8], [x, 34, 8], 0.9, CZ.white, GL)),
    ...[12, 21, 30].map(h => RD([2, h, 8], [62, h, 8], 0.45, CZ.whiteD, MT)),
    B(32, 35, 8, 64, 2.4, 4, CZ.teak, WD),
    LA(58, 2, -2, [[4, 0], [4, 1.4], [1.6, 3], [1.4, 4]], CZ.white, { m: 'gloss', seg: 12 }),
    C(58, 24, -2, 1.3, 40, CZ.white, { m: 'gloss', seg: 10 }),
    C(58, 44.4, -2, 2.4, 1.4, CZ.brass, { m: 'metal', seg: 12 }),
    S(58, 49.6, -2, 4.4, 5, 4.4, CZ.glowW, { m: 'glow', seg: 14 }),
    LA(58, 54, -2, [[4, 0], [3, 1.4], [0.8, 2.6], [0, 3.4]], CZ.brass, { m: 'metal', seg: 12 }),
    ...coil(40, 3, 1, 5),
  ], { glow: [CZ.glowW] }),

  // an iron twin mooring bollard on its deck plate, a rope made fast round both posts and its coil laid in front
  piece('crzbollard', 'Cruise mooring bollard', 1, 1, 380, 'gloss', [
    B(16, 1, -4, 28, 2, 14, CZ.iron, MT),
    ...[8.5, 23.5].map(x => LA(x, 2, -4, [[4, 0], [3.4, 2], [3, 10], [4.4, 11], [4.4, 13], [3.6, 14]], CZ.iron, { m: 'gloss', seg: 12 })),
    ...[8.5, 23.5].map(x => RG(x, 8, -4, 3.6, 0.9, CZ.rope, { m: 'cloth', flat: true })),
    RD([9, 7.4, -1], [23, 9, -1], 0.9, CZ.rope, CL), RD([9, 9, -1.6], [23, 7.4, -1.6], 0.9, CZ.ropeD, CL),
    RD([23.5, 8, -1], [28, 2.4, 6], 0.9, CZ.rope, CL),
    ...coil(17, 1, 9, 5.6),
  ]),

  // a coral-and-white life ring on a brass hook, its grab line round it, the ship's name on a teak plate under it
  wallPiece('crzlifering', 'Cruise S.S. Tidal life ring', 1, 380, 'gloss', [
    B(16, 75.4, 0.8, 3, 3, 1.6, CZ.brass, MT),
    RG(16, 60, 3, 10, 3.6, CZ.white, GL),
    ...[0, 1, 2, 3].map(k => RG(16, 60, 3.1, 10, 3.7, CZ.coral, { m: 'gloss', arc: Math.PI / 4, a0: -Math.PI / 8 + k * Math.PI / 2 })),
    RG(16, 60, 3, 14, 0.5, CZ.rope, CL),
    B(16, 42, 1, 22, 5, 1, CZ.teak, GL), PC(16, 42, 1.55, 21, 4.4, word('S.S. TIDAL', CZ.brassL, CZ.teak, 0.7)),
  ]),

  // the ship's clock and barometer in matching brass bezels on a teak board (a tap strikes the bells)
  wallPiece('crzclock', "Cruise ship's clock and barometer", 2, 980, 'metal', [
    B(32, 62, 0.6, 58, 30, 1.2, CZ.teak, { m: 'wood', tex: 'grain', pd: 'h', r: 3 }),
    ...[[18, clockFace], [46, baroFace]].flatMap(([x, fn]) => [
      DS(x, 62, 1.6, 10, 0.8, CZ.white, { m: 'plain', seg: 18 }), PC(x, 62, 2.05, 20, 20, fn),
      RG(x, 62, 2.2, 10.4, 1.4, CZ.brass, MT),
      ...[0, 1, 2, 3, 4, 5].map(k => { const a = k / 6 * TAU + 0.26; return DS(x + Math.cos(a) * 10.4, 62 + Math.sin(a) * 10.4, 3.4, 0.5, 0.4, CZ.brassL, { m: 'metal', seg: 6 }); }),
    ]),
    B(32, 50, 1.6, 6, 2, 1, CZ.brass, MT),
  ]),

  // a porthole turned mirror: a brass flange bolted round, its two dogs on the side, silvered glass where the sea would be
  wallPiece('crzportmirror', 'Cruise porthole looking-glass', 1, 520, 'metal', [
    DS(16, 60, 0.4, 13.4, 0.8, CZ.brassD, { m: 'metal', seg: 20 }),
    DS(16, 60, 1, 9.6, 0.4, CZ.silverL, { m: 'gloss', seg: 20 }),
    RG(16, 60, 1.4, 10.4, 1.6, CZ.brass, MT),
    ...[0, 1, 2, 3, 4, 5, 6, 7].map(k => { const a = k / 8 * TAU + 0.39; return DS(16 + Math.cos(a) * 12.4, 60 + Math.sin(a) * 12.4, 1, 0.8, 0.6, CZ.brassL, { m: 'metal', seg: 6 }); }),
    ...[56, 64].map(h => RD([27.4, h, 1.6], [30.4, h + (h > 60 ? 2 : -2), 1.6], 0.6, CZ.brass, MT)),
  ]),

  // a shuffleboard court painted on a run of teak decking: its scoring triangles at each end, coral and navy discs and a
  // cue laid by
  { id: 'crzshuffle', name: 'Cruise shuffleboard court', group: GROUP, solo: true, w: 1, h: 3, layer: 'rug', price: 600, high: 0.03, side: 'c', flat() {
    const g = ctx(), path = () => { g.beginPath(); RUG.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
    g.fillStyle = CZ.teak; path(); g.fill();
    g.save(); path(); g.clip();
    for (let x = 1, i = 0; x < 31; x += 3.75, i++) {
      g.fillStyle = sh(CZ.teak, hash(i, 3, 1) < 0.5 ? -1 : 1); g.globalAlpha = 0.5; g.fillRect(x, 0, 3.75, 96); g.globalAlpha = 1;
      g.fillStyle = CZ.teakD; g.fillRect(x, 0, 0.35, 96);
      g.fillRect(x, 10 + hash(i, 7, 2) * 70, 3.75, 0.35);
    }
    g.strokeStyle = CZ.white; g.lineWidth = 0.7; g.strokeRect(4, 4, 24, 88);
    const end = () => {
      g.beginPath(); g.moveTo(16, 7); g.lineTo(27, 34); g.lineTo(5, 34); g.closePath(); g.stroke();
      g.beginPath(); g.moveTo(11.6, 16); g.lineTo(20.4, 16); g.moveTo(8, 25); g.lineTo(24, 25); g.moveTo(16, 16); g.lineTo(16, 34); g.moveTo(5, 40); g.lineTo(27, 40); g.stroke();
      text(g, '10', 16, 12.6, 3, CZ.white); text(g, '8', 13, 21, 3.2, CZ.white); text(g, '8', 19, 21, 3.2, CZ.white);
      text(g, '7', 11.6, 30, 3.2, CZ.white); text(g, '7', 20.4, 30, 3.2, CZ.white); text(g, '10 OFF', 16, 37.2, 2.6, CZ.coral, 20);
    };
    end(); g.save(); g.translate(32, 96); g.rotate(Math.PI); end(); g.restore();
    for (const [x, y, c] of [[12.6, 22, CZ.coral], [19.4, 29.6, CZ.coral], [17, 62, CZ.navy], [10.4, 70, CZ.navy]]) {
      oval(x, y, 2.5, 2.5, c); g.strokeStyle = CZ.white; g.lineWidth = 0.35; g.beginPath(); g.arc(x, y, 1.6, 0, TAU); g.stroke();
    }
    g.strokeStyle = CZ.teakL; g.lineCap = 'round'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(24, 50); g.lineTo(9, 84); g.stroke();
    g.strokeStyle = CZ.brass; g.lineWidth = 0.7; g.beginPath(); g.moveTo(7, 84); g.lineTo(9, 84); g.lineTo(9.6, 86.6); g.moveTo(9, 84); g.lineTo(11.2, 85); g.stroke();
    g.restore();
    g.strokeStyle = CZ.teakD; g.lineWidth = 1; path(); g.stroke();
  } },

  // Wingull perched on a teak piling bound with rope, its long wings spread with their blue tips, yellow beak out
  piece('crzwingull', 'Cruise Wingull piling perch', 1, 1, 620, 'gloss', [
    LA(16, 0, 0, [[7, 0], [7, 1.4], [5, 2.4]], CZ.teakD, { m: 'wood', seg: 10 }),
    C(16, 14.6, 0, 4, 25, CZ.teak, { m: 'wood', seg: 10 }),
    ...[8, 20].map(h => C(16, h, 0, 4.3, 1.8, CZ.rope, { m: 'cloth', seg: 10 })),
    C(16, 27.4, 0, 4.2, 0.8, CZ.teakD, { m: 'wood', seg: 10 }),
    S(16, 31, -1, 4.6, 3.4, 6, CZ.gull, { m: 'gloss', seg: 12 }),
    ...[-1, 1].flatMap(s => [
      PR(16, 31.6, -1, [[s * 2, -1.4], [s * 14.4, 5], [s * 15.2, 3.4], [s * 2, 1.4]], 1.6, CZ.gull, GL),
      PR(16, 31.6, -1.05, [[s * 11, 2.6], [s * 14.4, 5], [s * 15.2, 3.4], [s * 11.4, 1.3]], 1.8, CZ.gullB, GL),
    ]),
    S(16, 33.6, 3.6, 3, 2.8, 3, CZ.gull, { m: 'gloss', seg: 12 }),
    RD([16, 33, 6.2], [16, 32.4, 10.6], 0.8, CZ.beak, GL),
    ...[14.4, 17.6].map(x => RD([x, 34.6, 6], [x + (x < 16 ? -0.8 : 0.8), 34.4, 5.8], 0.25, CZ.ink, PL)),
    PR(16, 29.6, -7, [[-2.6, 0], [2.6, 0], [0, 2.6]], 1.4, CZ.gullB, GL),
    ...[14.6, 17.4].map(x => RD([x, 27.8, 2], [x, 28.8, 2], 0.4, CZ.beak, PL)),
  ]),

  // a Wailmer pool float, round and blue with its cream underside, little eyes, flippers and its spout on top (a tap
  // sets it rocking)
  piece('crzwailmer', 'Cruise Wailmer pool float', 1, 1, 700, 'gloss', [
    S(16, 9.4, 0, 13.4, 9.4, 12.4, CZ.wail, { m: 'gloss', seg: 16 }),
    S(16, 6, 3.4, 11, 5.4, 9.4, CZ.wailL, { m: 'gloss', seg: 14 }),
    ...[10.6, 21.4].map(x => S(x, 12.4, 9.6, 1.1, 1.6, 0.7, CZ.ink, { m: 'gloss', seg: 8 })),
    RD([13.6, 8.8, 11.2], [18.4, 8.8, 11.2], 0.3, CZ.wailD, PL),
    ...[3, 29].map(x => S(x, 6, 2, 2.2, 1.4, 3.4, CZ.wail, { m: 'gloss', seg: 8 })),
    RG(16, 18.6, -1, 1.6, 0.5, CZ.wailD, { m: 'gloss', flat: true }),
    PR(16, 15, -9, [[-7, 4.6], [-2, 0], [2, 0], [7, 4.6], [0, 2.2]], 2, CZ.wail, GL),
  ]),

  // Corsola on a navy plinth: its pink body on a brass dish of sea glass, branching coral horns up
  piece('crzcorsola', 'Cruise Corsola coral centrepiece', 1, 1, 820, 'gloss', [
    B(16, 1.5, 0, 20, 3, 20, CZ.brass, MT),
    B(16, 12.6, 0, 18, 19.6, 18, CZ.navy, GL),
    B(16, 23.2, 0, 20, 1.6, 20, CZ.brass, MT),
    LA(16, 24, 0, [[3, 0], [2, 1], [7, 3], [8, 4.4]], CZ.brass, { m: 'metal', seg: 14 }),
    S(16, 27.6, 0, 7, 1.4, 7, CZ.seaL, { m: 'gloss', seg: 12 }),
    S(16, 32, 0, 5.6, 4.6, 5, CZ.cors, { m: 'gloss', seg: 12 }),
    S(16, 30.4, 2.8, 3.8, 2.6, 2.6, CZ.white, { m: 'gloss', seg: 10 }),
    ...[13.8, 18.2].map(x => DS(x, 33.4, 4.5, 0.75, 0.4, CZ.ink, { m: 'plain', seg: 8 })),
    ...[-1, 1].flatMap(s => [
      RD([16 + s * 2, 35.4, -1], [16 + s * 5, 41, -1], 0.9, CZ.corsD, GL),
      RD([16 + s * 5, 41, -1], [16 + s * 7.4, 43.4, -1], 0.7, CZ.corsD, GL),
      RD([16 + s * 5, 41, -1], [16 + s * 4.4, 44.4, -1], 0.7, CZ.corsD, GL),
      S(16 + s * 7.4, 43.4, -1, 0.8, 0.8, 0.8, CZ.corsL, { m: 'gloss', seg: 6 }),
    ]),
    RD([16, 36.4, -1.4], [16.4, 42.4, -1.4], 0.8, CZ.corsD, GL), S(16.4, 42.6, -1.4, 0.8, 0.8, 0.8, CZ.corsL, { m: 'gloss', seg: 6 }),
  ]),

  // a Tentacool table lamp: its clear blue dome lit as the shade, the red gems on it, two blue tentacles curling down to
  // a brass foot (a tap switches it)
  piece('crztentacool', 'Cruise Tentacool table lamp', 1, 1, 560, 'gloss', [
    LA(16, 0, 0, [[6, 0], [6, 1.2], [3, 2.6], [1.6, 3.4]], CZ.brass, { m: 'metal', seg: 14 }),
    ...[-1, 1].flatMap(s => [RD([16 + s * 0.8, 3, 0], [16 + s * 3.4, 10, 1], 0.8, CZ.tcoolD, GL), RD([16 + s * 3.4, 10, 1], [16 + s * 1.6, 19, 0.4], 0.8, CZ.tcoolD, GL)]),
    C(16, 19.8, 0, 3.4, 1.6, CZ.tcoolD, { m: 'gloss', seg: 12 }),
    LA(16, 20.4, 0, [[3, 0], [6.6, 1.6], [7, 5], [5, 10], [0, 12]], CZ.tcool, { m: 'glow', seg: 14 }),
    ...[-1, 1].map(s => S(16 + s * 4.2, 26.4, 4.4, 1.9, 2.1, 1.2, CZ.gem, { m: 'gloss', seg: 10 })),
    S(16, 23.4, 6.4, 1, 1, 0.7, CZ.gem, { m: 'gloss', seg: 8 }),
  ], { glow: [CZ.tcool] }),
];
