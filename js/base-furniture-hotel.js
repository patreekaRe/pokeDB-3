/* base-furniture-hotel.js  -  the Hotel lobby set (furniture expansion session l, 2026-10-17): a whole room of a grand
   old hotel's lobby, as Animal Crossing's Happy Home Paradise does a room type. Cream marble and dark mahogany, polished
   brass and deep teal velvet, over a burgundy-and-gold patterned carpet: the front desk and its service bell, a revolving
   door, a brass elevator under its floor dial, the bellhop's birdcage cart heaped with cases, the concierge's podium, a
   key-cubby cabinet, a wall of safe-deposit boxes, a wingback armchair, a chesterfield, a round banquette, the magazine
   table, a lamp table, a steamer trunk, a potted palm in a brass urn, a marble column, a pillar clock, the lobby
   fountain, a newspaper stand, the hotel's crest sign, a row of world-time clocks and the lobby carpet. A golden lucky
   Meowth, a Pikachu bellhop, a Persian on its velvet cushion and an oil painting of Lugia for the Pokémon touches.
   All solo, fixed colours, sold all year.
   An upright piece is a list of parts in painted units (32 a tile), as in js/base-furniture-ramen.js: `x` across from
   the left of its front, `h` up from the floor (a wall piece's from the foot of its strip), `z` out to the front from
   its middle (a wall piece's from the wall). They're painted here from any side, and js/base-models-hotel.js builds the
   same list as 3D parts (BUILT), so picture and model agree. `tex: 'grain'` is painted only (the model stays plain
   colour). A disc with `ax: 'x'` stands side-on (the cart's wheels). A `pic` part (the signs' words, the clock faces,
   the papers, the painting) is painted on the front only, and the model wears that crop of the painting. The safe's
   big door and the key cabinet's lower doors swing (`doors`, `inside`). The carpet is painted from above (RUG). */

import { sh, oval, ovalShade, floorShadow, ctx, hash, glass as glassPane } from './base-paint.js';

export const HT = {
  marble: '#eee6d6', marbleD: '#d4c7ae', vein: '#b4a486', mah: '#5c2618', mahL: '#7c3a24', mahD: '#3a160e',
  brass: '#c9a03c', brassL: '#efd27a', brassD: '#8a6a22', teal: '#1f5c5e', tealL: '#2f7f7e', tealD: '#123d3f',
  burg: '#701c2a', burgD: '#4a101a', cream: '#f4ead2', paper: '#f2eee4', ink: '#2a2020', black: '#1a1416',
  glowW: '#fff1c8', lamp: '#ffe7a0', water: '#8fd0e8', leaf: '#3e8a3a', leafD: '#24562a', trunk: '#8a6a48', soil: '#3a2a1c',
  leather: '#8a4a2a', leatherD: '#5a2e18', tan: '#c89a64', steel: '#8a9296',
  pika: '#f6d032', pikaD: '#c89a1a', cheek: '#e8402c', red: '#b82432', redD: '#7c1420',
  persian: '#f2e2b4', persianD: '#c8ac78', gem: '#d83040', lugia: '#f4f6fa', lugiaB: '#3a5a9a', sea: '#1e4a6a', seaD: '#0e2238',
  tags: ['#b82432', '#2f7f7e', '#c9a03c', '#3a5a9a'],
};
const GROUP = 'Hotel lobby';
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
      case 'disc': if (q.ax === 'x' ? !side : side) rbx(cx - q.th / 2, cy - (q.ry ?? q.r), q.th, (q.ry ?? q.r) * 2, q.th / 2, q.c, m); else {
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
        const a0 = q.arc ? -((q.a0 || 0) + q.arc) : 0, a1 = q.arc ? -(q.a0 || 0) : TAU;
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

const SERIF = 'Georgia, "Times New Roman", serif';
/** A word across a painted box: letters in fg over bg (none for clear). */
const word = (s, fg, bg, k = 0.78) => (g, x, y, w, h) => {
  if (bg) { g.fillStyle = bg; g.fillRect(x, y, w, h); }
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `bold ${h * k}px ${SERIF}`; g.fillText(s, x + w / 2, y + h * 0.55, w * 0.94);
};
const text = (g, s, cx, cy, size, c, maxW) => { g.fillStyle = c; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `bold ${size}px ${SERIF}`; g.fillText(s, cx, cy, maxW); };

/** A clock's face showing hh:mm: twelve ticks and two black hands on cream (the box is inside the face). */
const clockFace = (hh, mm) => (g, x, y, w, h) => {
  const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2;
  g.strokeStyle = HT.ink; g.lineCap = 'round';
  for (let k = 0; k < 12; k++) {
    const a = k / 12 * TAU, r0 = k % 3 ? r * 0.82 : r * 0.7;
    g.lineWidth = k % 3 ? r * 0.06 : r * 0.1;
    g.beginPath(); g.moveTo(cx + Math.sin(a) * r0, cy - Math.cos(a) * r0); g.lineTo(cx + Math.sin(a) * r * 0.95, cy - Math.cos(a) * r * 0.95); g.stroke();
  }
  const hand = (a, l, wd) => { g.lineWidth = wd; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.sin(a) * l, cy - Math.cos(a) * l); g.stroke(); };
  hand((hh % 12 + mm / 60) / 12 * TAU, r * 0.5, r * 0.12); hand(mm / 60 * TAU, r * 0.78, r * 0.07);
  g.fillStyle = HT.brassD; g.beginPath(); g.arc(cx, cy, r * 0.09, 0, TAU); g.fill();
};

/** The elevator's floor dial: L and 1 to 5 round the arc, its needle at 3, over a softly lit face. */
function dial(g, x, y, w, h) {
  const cx = x + w / 2, cy = y + h * 0.95, r = Math.min(w / 2, h) * 0.86;
  ['L', '1', '2', '3', '4', '5'].forEach((s, i) => { const a = Math.PI + (i + 0.5) / 6 * Math.PI; text(g, s, cx + Math.cos(a) * r * 0.74, cy + Math.sin(a) * r * 0.74, r * 0.26, HT.ink, r * 0.4); });
  const a = Math.PI + 3.5 / 6 * Math.PI;
  g.strokeStyle = HT.redD; g.lineWidth = r * 0.07; g.lineCap = 'round';
  g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.55); g.stroke();
}

/** A row of room numbers along a cubby shelf's edge. */
const roomNumbers = (first) => (g, x, y, w, h) => { for (let i = 0; i < 4; i++) text(g, String(first + i), x + w * (i + 0.5) / 4, y + h * 0.55, h * 0.9, HT.ink, w / 4.4); };

/** A folded newspaper on the rack: its masthead, a headline, a photo and columns of grey lines. */
const paperFront = (mast, head) => (g, x, y, w, h) => {
  g.fillStyle = HT.paper; g.fillRect(x, y, w, h);
  text(g, mast, x + w / 2, y + h * 0.14, h * 0.17, HT.ink, w * 0.92);
  g.fillStyle = HT.ink; g.fillRect(x + w * 0.05, y + h * 0.26, w * 0.9, h * 0.025);
  text(g, head, x + w / 2, y + h * 0.37, h * 0.12, HT.redD, w * 0.9);
  g.fillStyle = '#9a9488'; g.fillRect(x + w * 0.08, y + h * 0.48, w * 0.38, h * 0.36);
  g.fillStyle = '#b8b2a6';
  for (let k = 0; k < 5; k++) g.fillRect(x + w * 0.52, y + h * (0.5 + k * 0.08), w * 0.4, h * 0.03);
};

/** The oil painting: Lugia over a stormy sea at night, a lighthouse lit on the rocks, a full moon in the cloud. */
function lugiaPainting(g, x, y, w, h) {
  const l = g.createLinearGradient(0, y, 0, y + h); l.addColorStop(0, '#2a3a5a'); l.addColorStop(0.6, HT.sea); l.addColorStop(1, HT.seaD);
  g.fillStyle = l; g.fillRect(x, y, w, h);
  g.fillStyle = 'rgba(255,248,220,0.85)'; g.beginPath(); g.arc(x + w * 0.22, y + h * 0.24, h * 0.12, 0, TAU); g.fill();
  g.fillStyle = 'rgba(200,210,230,0.25)';
  for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(x + w * hash(i, 4, 1), y + h * (0.12 + hash(i, 2, 7) * 0.3), w * 0.14, h * 0.05, 0, 0, TAU); g.fill(); }
  g.fillStyle = HT.seaD; g.beginPath(); g.moveTo(x, y + h * 0.78);
  for (let k = 0; k <= 12; k++) g.lineTo(x + w * k / 12, y + h * (0.76 + (k % 2 ? 0.04 : -0.01)));
  g.lineTo(x + w, y + h); g.lineTo(x, y + h); g.fill();
  g.fillStyle = 'rgba(230,240,255,0.6)'; for (let k = 0; k < 7; k++) g.fillRect(x + w * (0.05 + k * 0.13), y + h * 0.8, w * 0.05, h * 0.012);
  g.fillStyle = '#2a2420'; g.beginPath(); g.moveTo(x + w * 0.78, y + h); g.lineTo(x + w * 0.84, y + h * 0.7); g.lineTo(x + w * 0.96, y + h * 0.74); g.lineTo(x + w, y + h); g.fill();
  g.fillStyle = '#e8e0d0'; g.fillRect(x + w * 0.86, y + h * 0.42, w * 0.05, h * 0.3);
  g.fillStyle = HT.red; g.fillRect(x + w * 0.86, y + h * 0.52, w * 0.05, h * 0.04); g.fillRect(x + w * 0.86, y + h * 0.62, w * 0.05, h * 0.04);
  g.fillStyle = HT.lamp; g.fillRect(x + w * 0.855, y + h * 0.36, w * 0.06, h * 0.06);
  g.fillStyle = 'rgba(255,240,170,0.25)'; g.beginPath(); g.moveTo(x + w * 0.88, y + h * 0.39); g.lineTo(x + w * 0.55, y + h * 0.3); g.lineTo(x + w * 0.55, y + h * 0.46); g.fill();
  const cx = x + w * 0.5, cy = y + h * 0.5, s = h;
  g.fillStyle = HT.lugia; g.strokeStyle = HT.seaD; g.lineWidth = 0.3;
  for (const sg of [-1, 1]) {
    g.beginPath(); g.moveTo(cx + sg * s * 0.05, cy - s * 0.05); g.lineTo(cx + sg * s * 0.42, cy - s * 0.24); g.lineTo(cx + sg * s * 0.38, cy - s * 0.14);
    g.lineTo(cx + sg * s * 0.42, cy - s * 0.08); g.lineTo(cx + sg * s * 0.33, cy - s * 0.03); g.lineTo(cx + sg * s * 0.34, cy + s * 0.03); g.lineTo(cx + sg * s * 0.06, cy + s * 0.06); g.closePath(); g.fill(); g.stroke();
  }
  g.beginPath(); g.moveTo(cx - s * 0.05, cy + s * 0.1); g.lineTo(cx + s * 0.02, cy + s * 0.28); g.lineTo(cx + s * 0.05, cy + s * 0.1); g.fill();
  g.beginPath(); g.ellipse(cx, cy + s * 0.03, s * 0.09, s * 0.1, 0, 0, TAU); g.fill(); g.stroke();
  g.fillRect(cx - s * 0.025, cy - s * 0.15, s * 0.05, s * 0.1);
  g.beginPath(); g.ellipse(cx, cy - s * 0.17, s * 0.065, s * 0.045, 0, 0, TAU); g.fill(); g.stroke();
  g.fillStyle = HT.lugiaB;
  for (const sg of [-1, 1]) { g.beginPath(); g.ellipse(cx + sg * s * 0.03, cy - s * 0.175, s * 0.018, s * 0.016, 0, 0, TAU); g.fill(); }
  for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse(cx, cy - s * 0.02 + k * s * 0.04, s * 0.03, s * 0.012, 0, 0, TAU); g.fill(); }
}

/* ---------- the kinds ---------- */

/** What js/base-models-hotel.js builds for each upright and wall kind: its parts, doors and default material. */
export const BUILT = {};
/** The lobby carpet's outline from above, in painted units across its 2 x 3 tiles, corners cut. */
export const RUG = [[4, 2], [60, 2], [62, 4], [62, 92], [60, 94], [4, 94], [2, 92], [2, 4]];

function piece(id, name, w, h, price, mat, parts, { doors = [], inside, ...rest } = {}) {
  BUILT[id] = { parts, doors, inside, mat };
  const all = [...parts, ...doors.flatMap(d => d.parts)];
  return { id, name, group: GROUP, solo: true, w, h, price, ...rest, draw(x, b, vw, dir) { floorShadow(x, b, vw); paintParts(all, x, b, vw, dir, w * 32); } };
}
function wallPiece(id, name, w, price, mat, parts, rest = {}) {
  BUILT[id] = { parts, doors: [], mat };
  return { id, name, group: GROUP, solo: true, w, h: 1, layer: 'wall', price, ...rest, wall(x) { paintParts(parts, x, 96, w * 32, 0, w * 32); } };
}

const MTL = (seg) => ({ m: 'metal', seg }), CLS = (seg) => ({ m: 'cloth', seg }), GLS = (seg) => ({ m: 'gloss', seg });
/** A turned mahogany bun foot. */
const bun = (x, z, r = 1.8) => S(x, r, z, r, r, r, HT.mahD, GLS(8));
/** A row of brass tufting buttons across a velvet back. */
const buttons = (x0, x1, n, hs, z) => hs.flatMap((h, j) => Array.from({ length: n - (j % 2) }, (_, i) => DS(x0 + (x1 - x0) * (i + (j % 2 ? 1 : 0.5)) / n, h, z, 0.55, 0.4, HT.brassL, MTL(6))));
/** A palm frond seen face-on: a narrow leaf from its stem at (x, h) to its tip dx, dh away. */
const frond = (x, h, z, dx, dh, wd = 2.4) => {
  const l = Math.hypot(dx, dh), nx = -dh / l * wd, ny = dx / l * wd;
  return PR(x, h, z, [[0, 0], [dx * 0.4 + nx, dh * 0.4 + ny], [dx, dh], [dx * 0.55 - nx * 0.6, dh * 0.55 - ny * 0.6]], 1.2, HT.leaf, CLS());
};
/** A brass cubby key on its coloured fob, hung in a cubby. */
const key = (x, h, i) => [RD([x, h + 2, 3.4], [x, h - 0.4, 3.4], 0.3, HT.brass, MT), B(x, h - 1.8, 3.4, 1.6, 2.6, 0.5, HT.tags[i % 4], { m: 'metal', r: 0.05 })];
const cupOn = (x, h, z) => [C(x, h + 0.2, z, 2.6, 0.4, HT.cream, GLS(12)), LA(x, h + 0.4, z, [[1, 0], [1.8, 1.4], [2, 2.8]], HT.cream, GLS(10))];

export const HOTEL_KINDS = [
  // the front desk: a panelled mahogany counter trimmed in brass, RECEPTION on its brass plate, a cream marble top with
  // the guest ledger open, a green banker's lamp and the service bell (a tap rings it)
  piece('htldesk', 'Hotel front desk', 2, 1, 1400, 'wood', [
    B(32, 1.5, 1, 62, 3, 26, HT.mahD, PL),
    B(32, 17, 0, 62, 30, 26, HT.mah, GR),
    ...[11, 32, 53].map(x => B(x, 16, 13.4, 17, 20, 0.8, HT.mahL, GR)),
    ...[4.4, 29.6].map(h => B(32, h, 13.8, 62, 1, 0.6, HT.brass, MT)),
    B(32, 18, 14, 14, 5, 0.4, HT.brass, MT), PC(32, 18, 14.3, 13, 4.4, word('RECEPTION', HT.mahD, HT.brassL, 0.7)),
    B(32, 33, 1, 64, 2.4, 28, HT.marble, GL),
    B(21, 34.6, 4, 13, 0.8, 9, HT.burg, GL), ...[17.8, 24.2].map(x => B(x, 35.2, 4, 6, 0.4, 8, HT.paper, PL)),
    RD([25, 35.6, 7], [29, 35.8, 4], 0.3, HT.ink, PL),
    C(8, 34.8, -6, 3, 1, HT.brass, MTL(12)), RD([8, 35, -6], [8, 41, -6], 0.4, HT.brass, MT),
    C(8, 42, -6, 1.6, 2.6, HT.leaf, { m: 'gloss', rb: 4, seg: 12 }),
    LA(46, 34.2, 6, [[3, 0], [3, 0.6], [2.6, 1.2], [2.2, 2.6], [1, 3.8], [0, 4.2]], HT.brassL, MTL(12)),
    RD([46, 38.2, 6], [46, 39.4, 6], 0.45, HT.brassD, MT),
  ]),

  // a revolving door: a glass drum on a marble step, four glazed mahogany wings round a brass post, push bars, and a
  // mahogany canopy with a brass band and a little dome (a tap turns it)
  piece('htlrevolving', 'Hotel revolving door', 1, 1, 1500, 'metal', [
    C(16, 0.6, 0, 15.4, 1.2, HT.marbleD, GLS(20)),
    C(16, 34, 0, 14.6, 64, '#cfe8f4', { m: 'glass', seg: 16 }),
    C(16, 34, 0, 1, 64, HT.brass, MTL(8)),
    B(16, 33, 0, 27, 60, 0.6, '#cfe8f4', { m: 'glass', r: 0.2 }), B(16, 33, 0, 0.6, 60, 27, '#cfe8f4', { m: 'glass', r: 0.2 }),
    ...[3.6, 62.4].flatMap(h => [B(16, h, 0, 27, 1.6, 1.2, HT.mahD, WD), B(16, h, 0, 1.2, 1.6, 27, HT.mahD, WD)]),
    B(16, 33, 0, 26, 0.8, 1.6, HT.brassL, MT), B(16, 33, 0, 1.6, 0.8, 26, HT.brassL, MT),
    ...[2, 66].map(h => RG(16, h, 0, 14.6, 0.7, HT.brass, { m: 'metal', flat: true })),
    C(16, 69, 0, 15.6, 4, HT.mah, { m: 'wood', seg: 20 }), C(16, 71.4, 0, 15.8, 1.2, HT.brass, MTL(20)),
    LA(16, 72, 0, [[15, 0], [11, 1.6], [3, 3], [0, 3.4]], HT.mahD, { m: 'gloss', seg: 20 }),
    LA(16, 75, 0, [[1, 0], [0.6, 2], [0, 3]], HT.brassL, MTL(8)),
  ]),

  // a brass elevator in a cream marble surround: two engraved brass doors, a lit floor dial over them, a call button
  // (a tap lights the dial and the button)
  piece('htlelevator', 'Hotel brass elevator', 1, 1, 1500, 'metal', [
    B(16, 36, -10, 32, 72, 12, HT.marble, GL),
    B(16, 71, -9, 32, 2.4, 14, HT.mahD, GL),
    ...[10.6, 21.4].flatMap(x => [B(x, 29, -3.6, 10.6, 54, 0.8, HT.brass, MT), B(x, 37, -3.1, 7, 22, 0.4, HT.brassL, MT), B(x, 15, -3.1, 7, 18, 0.4, HT.brassL, MT)]),
    B(16, 29, -3.3, 0.4, 54, 0.8, HT.brassD, PL),
    B(16, 57, -3.4, 25, 2, 1.4, HT.brassD, MT), ...[4.6, 27.4].map(x => B(x, 29, -3.4, 1.6, 58, 1.4, HT.brassD, MT)),
    PR(16, 59, -3.4, [[-8, 0], [8, 0], [7.4, 3], [5.6, 5.6], [3, 7.4], [0, 8], [-3, 7.4], [-5.6, 5.6], [-7.4, 3]], 1.2, HT.brass, MT),
    PR(16, 59.4, -2.6, [[-6.6, 0], [6.6, 0], [6.1, 2.5], [4.6, 4.6], [2.5, 6.1], [0, 6.6], [-2.5, 6.1], [-4.6, 4.6], [-6.1, 2.5]], 0.4, HT.lamp, { m: 'glow' }),
    PC(16, 62.6, -2.2, 13, 6.6, dial),
    B(30, 30, -3.6, 2.4, 6, 0.6, HT.brass, MT), DS(30, 31.4, -3.1, 0.7, 0.4, HT.lamp, { m: 'glow', seg: 8 }), DS(30, 28.6, -3.1, 0.7, 0.4, HT.brassL, MTL(8)),
  ], { glow: [HT.lamp] }),

  // the bellhop's birdcage cart: a carpeted brass deck on four wheels, two brass arches and a crown finial, heaped with a
  // leather suitcase, a teal case, a hatbox and a little vanity case
  piece('htlbirdcage', 'Hotel bellhop birdcage cart', 1, 1, 950, 'metal', [
    ...[4, 28].flatMap(x => [-8, 8].map(z => DS(x, 2.6, z, 2.6, 1.4, HT.black, { m: 'gloss', ax: 'x', seg: 12 }))),
    B(16, 5.2, 0, 29, 1.2, 23, HT.brass, MT), B(16, 6.4, 0, 27, 1.4, 21, HT.burg, CL),
    ...[3, 29].flatMap(x => [-9, 9].map(z => RD([x, 5, z], [x, 44, z], 0.6, HT.brass, MT))),
    ...[-9, 9].map(z => RG(16, 44, z, 13, 0.6, HT.brass, { m: 'metal', arc: Math.PI, a0: 0 })),
    RD([16, 57, -9], [16, 57, 9], 0.6, HT.brass, MT), RD([3, 44, 0], [29, 44, 0], 0.5, HT.brass, MT),
    S(16, 58.6, 0, 1.8, 1.8, 1.8, HT.brassL, MT), LA(16, 59.6, 0, [[1.2, 0], [0.6, 2], [0, 3]], HT.brass, MTL(8)),
    B(14, 12, 2, 20, 10, 15, HT.leather, GL), B(14, 12, 9.6, 20.4, 1.2, 0.4, HT.leatherD, PL), RD([11, 17.6, 2], [17, 17.6, 2], 0.5, HT.leatherD, GL),
    ...[5, 23].map(x => B(x, 12, 2, 1.6, 10.2, 15.2, HT.brassD, MT)),
    B(19, 21, 0, 15, 8, 13, HT.teal, GL), B(19, 21, 6.6, 15.2, 1, 0.4, HT.brass, PL),
    C(8.6, 21.2, -2, 4.6, 7, HT.cream, GLS(12)), C(8.6, 22.4, -2, 4.65, 1, HT.burg, { m: 'plain', seg: 12 }),
    B(20, 28.4, 1, 8, 6, 7, HT.burg, GL), RD([18, 31.8, 1], [22, 31.8, 1], 0.4, HT.brass, MT),
  ]),

  // the concierge's podium: a tapered mahogany stand banded in brass, CONCIERGE on its plate, a slanted top with a
  // folded city map and a brass pen holder (a tap hands you a map)
  piece('htlconcierge', 'Hotel concierge podium', 1, 1, 750, 'wood', [
    B(16, 1.5, 0, 22, 3, 16, HT.mahD, PL),
    PR(16, 3, 0, [[-8.5, 0], [8.5, 0], [10.5, 30], [-10.5, 30]], 15, HT.mah, GR),
    ...[6, 28].map(h => B(16, h, 7.6, 18 + h * 0.14, 1, 0.4, HT.brass, MT)),
    B(16, 18, 7.8, 14, 5, 0.4, HT.brass, MT), PC(16, 18, 8.1, 13, 4.4, word('CONCIERGE', HT.mahD, HT.brassL, 0.62)),
    B(16, 34, 0, 24, 2, 18, HT.mahL, GL),
    B(12, 35.4, 2, 9, 0.8, 7, HT.paper, PL), B(12, 35.9, 2, 4.4, 0.3, 6, HT.water, PL),
    C(22, 37, -3, 1.8, 4, HT.brass, MTL(10)), RD([21.6, 38, -3], [20.6, 42, -2], 0.3, HT.ink, PL), RD([22.6, 38, -3], [23.4, 41.6, -4], 0.3, HT.burg, PL),
  ]),

  // the key-cubby cabinet: sixteen mahogany cubbies numbered 101 to 404, a brass key on a coloured fob in each, over a
  // pair of panelled doors (a tap opens them on the shelves of parcels)
  piece('htlkeys', 'Hotel key cubby cabinet', 1, 1, 900, 'wood', [
    B(16, 1.5, -4, 30, 3, 16, HT.mahD, WD),
    ...[2, 30].map(x => B(x, 29, -4, 3, 54, 16, HT.mah, GR)),
    B(16, 29, -11.5, 26, 52, 1, HT.mahD, WD),
    ...[3.6, 22, 30, 38, 46, 54].map(h => B(16, h, -4, 26, 1.2, 15, HT.mah, WD)),
    ...[9.25, 16, 22.75].map(x => B(x, 38, -4, 0.8, 32, 15, HT.mah, WD)),
    ...[22, 30, 38, 46].flatMap((h, j) => [5.9, 12.6, 19.4, 26.1].flatMap((x, i) => key(x, h + 5, i + j))),
    ...[22, 30, 38, 46].map((h, j) => PC(16, h, 3.8, 26, 1.2, roomNumbers(401 - j * 100))),
    B(16, 56.6, -4, 32, 2.2, 18, HT.mahD, GL), B(16, 55.6, 5.1, 32, 0.6, 0.4, HT.brass, MT),
  ], {
    doors: [
      { hinge: [3.5, 4.4], side: 1, parts: [B(9.6, 12.4, 4.4, 12.2, 16, 1, HT.mahL, GR), B(9.6, 12.4, 5, 8.4, 11, 0.4, HT.mah, WD), DS(14.4, 12.4, 5.2, 0.7, 0.6, HT.brassL, MTL(8))] },
      { hinge: [28.5, 4.4], side: -1, parts: [B(22.4, 12.4, 4.4, 12.2, 16, 1, HT.mahL, GR), B(22.4, 12.4, 5, 8.4, 11, 0.4, HT.mah, WD), DS(17.6, 12.4, 5.2, 0.7, 0.6, HT.brassL, MTL(8))] },
    ],
    inside: { x: 16, h: 12.4, w: 24, hh: 15, z: 3.6 },
  }),

  // a wall of brass safe-deposit boxes on a mahogany plinth: twelve little numbered doors with keyholes over the big
  // vault door, its dial and spoked wheel (a tap swings it open on the gold)
  piece('htlsafe', 'Hotel safe-deposit boxes', 1, 1, 1200, 'metal', [
    B(16, 1, -4, 30, 2, 20, HT.mahD, PL),
    B(16, 24.5, -4, 30, 45, 20, HT.brassD, MT),
    ...[27, 33, 39, 45].flatMap(h => [6, 12.7, 19.3, 26].flatMap(x => [B(x, h - 0.5, 6.2, 6, 5, 0.6, HT.brass, MT), DS(x, h - 0.5, 6.6, 0.45, 0.4, HT.ink, { m: 'plain', seg: 6 })])),
    B(16, 47.6, -4, 32, 1.6, 22, HT.mah, GL),
  ], {
    doors: [{ hinge: [3, 6.4], side: 1, parts: [
      B(16, 12.4, 6.4, 26, 17, 1, HT.brassL, MT),
      RG(18.6, 12.4, 7.4, 4.2, 0.5, HT.brassD, MT), ...[0, 1, 2].map(i => { const a = i / 3 * Math.PI; return RD([18.6 + Math.cos(a) * 4.2, 12.4 + Math.sin(a) * 4.2, 7.4], [18.6 - Math.cos(a) * 4.2, 12.4 - Math.sin(a) * 4.2, 7.4], 0.35, HT.brassD, MT); }),
      DS(8.6, 14.4, 7.2, 2, 0.8, HT.steel, MTL(12)), DS(8.6, 14.4, 7.7, 0.6, 0.4, HT.ink, { m: 'plain', seg: 6 }),
    ] }],
    inside: { x: 16, h: 12.4, w: 24, hh: 15, z: 5.9 },
  }),

  // a wingback armchair in deep teal velvet: a buttoned back, rolled arms, a loose cushion, brass nailheads along the
  // seat rail and turned mahogany feet
  piece('htlarmchair', 'Hotel wingback armchair', 1, 1, 700, 'cloth', [
    ...[5, 27].flatMap(x => [-8, 8].map(z => C(x, 2, z, 1.4, 4, HT.mahD, { m: 'gloss', rb: 1, seg: 8 }))),
    B(16, 7.4, 0, 26, 6.8, 22, HT.teal, VL(1.6)), B(16, 4.4, 11.1, 26, 0.6, 0.4, HT.brass, MT),
    B(16, 12, 2, 20, 3.4, 18, HT.tealL, VL(1.4)),
    ...[3.4, 28.6].flatMap(x => [B(x, 12.5, 1, 5, 11, 22, HT.teal, VL(2)), RD([x, 18, -10], [x, 18, 11], 2.7, HT.teal, CL)]),
    B(16, 25, -8.5, 24, 28, 5, HT.teal, VL(2.4)),
    ...[4.4, 27.6].map(x => B(x, 27, -6, 4, 18, 8, HT.teal, VL(1.8))),
    S(16, 38, -8.5, 12, 3.4, 2.5, HT.teal, CLS(12)),
    ...buttons(8, 24, 3, [22, 28, 34], -5.8),
  ]),

  // a velvet chesterfield for three: deep-buttoned back, rolled arms as high as the back, three cushions, brass piping and
  // bun feet
  piece('htlchesterfield', 'Hotel velvet chesterfield', 2, 1, 1400, 'cloth', [
    ...[5, 59].flatMap(x => [-9, 9].map(z => bun(x, z))),
    B(32, 8, 0, 62, 7.4, 24, HT.teal, VL(1.4)), B(32, 4.6, 12.1, 60, 0.6, 0.4, HT.brass, MT),
    ...[14.5, 32, 49.5].map(x => B(x, 13.4, 2, 17.4, 3.8, 18, HT.tealL, VL(1.8))),
    B(32, 22, -8, 52, 24, 6, HT.teal, VL(2.4)),
    ...buttons(8, 56, 8, [18, 23.5, 29], -4.8),
    ...[4, 60].flatMap(x => [B(x, 13, 0, 8, 18, 24, HT.teal, VL(2.4)), RD([x, 23, -11], [x, 23, 11], 3.8, HT.teal, CL), DS(x, 23, 11.4, 2.6, 0.6, HT.tealD, { m: 'cloth', seg: 12 })]),
  ]),

  // a round lobby banquette: a teal velvet drum on a mahogany plinth, brass nailheads round its foot, a tall buttoned
  // back column in the middle with a brass urn of fern on top
  piece('htlbanquette', 'Hotel round banquette', 1, 1, 650, 'cloth', [
    C(16, 1, 0, 13, 2, HT.mahD, { m: 'wood', seg: 16 }),
    C(16, 7, 0, 14, 10, HT.teal, CLS(16)), RG(16, 2.6, 0, 14, 0.4, HT.brass, { m: 'metal', flat: true }),
    LA(16, 12, 0, [[14, 0], [13.6, 1], [12, 2], [0, 2.4]], HT.tealL, CLS(16)),
    C(16, 23, 0, 5, 20, HT.teal, { m: 'cloth', rb: 6, seg: 12 }),
    ...[18, 24, 30].map(h => DS(16, h, 5.3 + (24 - h) * 0.04, 0.6, 0.4, HT.brassL, MTL(6))),
    C(16, 33.4, 0, 5.4, 1.2, HT.brass, MTL(12)),
    LA(16, 34, 0, [[2, 0], [3.6, 2], [3, 4.4], [3.8, 5]], HT.brass, MTL(12)),
    S(16, 41, 0, 5.4, 3.4, 5, HT.leaf, CLS(10)), S(13, 43, 1, 2.6, 2.2, 2.6, HT.leafD, CLS(8)), S(19, 43.4, -1, 2.6, 2.4, 2.6, HT.leafD, CLS(8)),
  ]),

  // a long mahogany coffee table with a cream marble top: a stack of magazines, a tea tray with a pot and a cup, a bud
  // vase, more magazines on the shelf below
  piece('htlcoffeetable', 'Hotel magazine coffee table', 2, 1, 750, 'wood', [
    ...[6, 58].flatMap(x => [-8, 8].map(z => RD([x, 14, z], [x + (x < 32 ? -1.4 : 1.4), 0.8, z * 1.15], 1.7, HT.mah, WD))),
    B(32, 4.4, 0, 54, 2.4, 17, HT.mahD, WD),
    ...[0, 1].map(k => B(22 + k * 2, 6.2 + k * 0.8, 1, 12, 0.7, 9, HT.tags[k + 1], { m: 'gloss', r: 0.2 })),
    B(32, 11.8, 0, 56, 6.4, 20, HT.mah, GRH), ...[20, 44].map(x => DS(x, 11.8, 10.2, 0.8, 0.6, HT.brassL, MTL(8))),
    B(32, 16, 0, 62, 2, 24, HT.marble, GL), B(32, 14.8, 12.1, 62, 0.6, 0.4, HT.brass, MT),
    ...[0, 1, 2].map(k => B(16 + k * 0.8, 17.4 + k * 0.6, 2 - k * 0.6, 12, 0.6, 9, [HT.burg, HT.paper, HT.teal][k], { m: 'gloss', r: 0.2 })),
    B(44, 17.3, -1, 16, 0.6, 11, HT.brass, MT),
    LA(48, 17.6, -2, [[2.4, 0], [3.4, 1.6], [3, 3.6], [1.4, 4.4], [0.6, 5.4]], HT.cream, GLS(12)), RD([51, 19, -2], [53.4, 21.6, -2], 0.5, HT.cream, GL),
    ...cupOn(40, 17.6, 1),
    LA(30, 17, -6, [[1, 0], [1.6, 1.6], [0.6, 4], [0.8, 5]], HT.brass, MTL(8)), RD([30, 22, -6], [30.6, 26, -6], 0.25, HT.leafD, PL), S(30.8, 26.6, -6, 1.3, 1.3, 1.3, HT.red, CLS(8)),
  ]),

  // a round mahogany lamp table on a turned pedestal, a book on it and a brass lamp with a pleated cream shade (a tap
  // switches it)
  piece('htllamptable', 'Hotel brass lamp table', 1, 1, 560, 'wood', [
    LA(16, 0, 0, [[8, 0], [8, 1], [3.6, 2.4], [1.8, 4]], HT.mahD, { m: 'gloss', seg: 14 }),
    C(16, 11, 0, 1.6, 16, HT.mah, { m: 'wood', seg: 10 }), C(16, 6, 0, 2.4, 2, HT.mahL, { m: 'gloss', seg: 10 }),
    C(16, 19.8, 0, 11, 1.6, HT.mah, { m: 'gloss', seg: 18 }), C(16, 18.8, 0, 11.1, 0.6, HT.brass, MTL(18)),
    B(9, 21.4, 3, 6, 1.6, 8, HT.burg, GL),
    LA(17, 20.6, -1, [[3.4, 0], [3.4, 0.8], [1.2, 1.6], [0.8, 3]], HT.brass, MTL(12)),
    C(17, 27, -1, 0.6, 12, HT.brass, MTL(8)),
    C(17, 36, -1, 4, 8, HT.lamp, { m: 'glow', rb: 7, seg: 14 }),
    LA(17, 40, -1, [[0.8, 0], [0, 1.6]], HT.brass, MTL(6)),
  ], { glow: [HT.lamp] }),

  // a leather steamer trunk with brass corners and lock, two straps and a pair of travel labels (a tap opens it on
  // treasure)
  piece('htltrunk', 'Hotel steamer trunk', 1, 1, 620, 'wood', [
    ...[3, 29].flatMap(x => [-7, 7].map(z => S(x, 1, z, 1.2, 1, 1.2, HT.brassD, MTL(6)))),
    B(16, 9.4, 0, 28, 16, 18, HT.leather, GL),
    B(16, 18.6, 0, 28.4, 3.4, 18.4, HT.leatherD, GL),
    ...[9, 23].map(x => B(x, 10, 9.2, 2.2, 18, 0.5, HT.leatherD, PL)),
    ...[2.6, 29.4].flatMap(x => [3, 18.6].map(h => B(x, h, 0, 3.4, 3.4, 18.8, HT.brass, MT))),
    B(16, 16, 9.4, 3.4, 3.4, 0.8, HT.brassL, MT), DS(16, 15.6, 9.9, 0.4, 0.3, HT.ink, { m: 'plain', seg: 6 }),
    B(13.2, 9, 9.3, 5.6, 4, 0.3, HT.cream, PL), PC(13.2, 9, 9.5, 5.4, 3.8, word('OLIVINE', HT.redD, HT.cream, 0.36)),
    B(19.2, 6, 9.3, 4.4, 3, 0.3, HT.tealL, PL), PC(19.2, 6, 9.5, 4.2, 2.8, word('LUMIOSE', HT.cream, HT.tealL, 0.36)),
    ...[1, 31].map(x => RD([x, 12, -2.4], [x, 12, 2.4], 0.6, HT.leatherD, GL)),
  ]),

  // Pikachu as the bellhop: a red jacket with brass buttons, a red pillbox cap between its ears, a little suitcase in
  // one paw, on a round mahogany stand (a tap bounces it)
  piece('htlpikabellhop', 'Hotel Pikachu bellhop', 1, 1, 1050, 'cloth', [
    C(16, 0.8, 0, 10, 1.6, HT.mahD, GLS(16)),
    ...[12.6, 19.4].map(x => S(x, 2.8, 3, 2.4, 1.2, 3, HT.pika, CLS(8))),
    PR(7, 9, -4.6, [[0, 0], [2.4, 0], [-1.2, 6], [2.6, 6], [-2.8, 14], [-6, 12.6], [-3, 7.6], [-5.2, 7.4]], 1.2, HT.pika, CLS()),
    S(16, 9, 0, 6.4, 7, 5.6, HT.pika, CLS(14)),
    LA(16, 5, 0, [[6.4, 0], [7.2, 3], [6.8, 7], [4.6, 10]], HT.red, CLS(14)),
    ...[7.5, 10, 12.5].map(h => DS(16, h, 6.8 - Math.abs(h - 10) * 0.1, 0.55, 0.4, HT.brassL, MTL(6))),
    S(16, 21, 0, 7.4, 6.4, 6.4, HT.pika, CLS(16)),
    ...[13.4, 18.6].map(x => DS(x, 22.4, 6.1, 0.9, 0.4, HT.black, GLS(8))),
    ...[10.6, 21.4].map(x => DS(x, 19.4, 5.4, 1.6, 0.4, HT.cheek, GLS(10))),
    RD([14.8, 18.8, 6.4], [16, 18.2, 6.5], 0.25, HT.black, PL), RD([16, 18.2, 6.5], [17.2, 18.8, 6.4], 0.25, HT.black, PL),
    PR(10.6, 25, 0, [[-1.8, 0], [1.8, 0], [-2.6, 12]], 2, HT.pika, GL), PR(10.6, 25, 0, [[-2.2, 7.4], [-0.8, 7.4], [-2.6, 12]], 2.4, HT.black, GL),
    PR(21.4, 25, 0, [[-1.8, 0], [1.8, 0], [2.6, 12]], 2, HT.pika, GL), PR(21.4, 25, 0, [[0.8, 7.4], [2.2, 7.4], [2.6, 12]], 2.4, HT.black, GL),
    C(17, 28.4, 0.4, 3.2, 3, HT.red, GLS(12)), C(17, 27.4, 0.4, 3.25, 0.8, HT.brass, MTL(12)),
    RD([10.4, 12.6, 1], [8.4, 9, 4], 1.2, HT.red, CL),
    RD([21.6, 12.6, 1], [24, 10, 3], 1.2, HT.red, CL), S(24.4, 9.4, 3.4, 1.3, 1.3, 1.3, HT.pika, CLS(8)),
    B(25.4, 5.4, 3.4, 6, 5, 2.6, HT.leather, GL), RD([24, 8.4, 3.4], [26.8, 8.4, 3.4], 0.3, HT.leatherD, GL),
  ]),

  // Persian lying on a tasselled teal velvet cushion raised on brass ball feet: its red forehead gem, whiskers and a
  // curled tail (a tap sets it wobbling)
  piece('htlpersian', 'Hotel Persian on a velvet cushion', 1, 1, 1150, 'cloth', [
    ...[4, 28].flatMap(x => [-9, 9].map(z => S(x, 1.4, z, 1.4, 1.4, 1.4, HT.brass, MTL(8)))),
    B(16, 6.4, 0, 28, 6, 22, HT.teal, VL(2.6)),
    ...[2, 30].flatMap(x => [-10, 10].map(z => C(x, 3.4, z, 0.8, 2.4, HT.brassL, { m: 'cloth', rb: 1.1, seg: 6 }))),
    S(16, 13, -1.4, 10, 4.4, 7.4, HT.persian, CLS(14)),
    RD([24, 11.6, -4], [28.4, 14.6, 0.4], 1.4, HT.persian, CL), S(28.4, 15.2, 1, 1.6, 1.6, 1.6, HT.persianD, CLS(8)),
    ...[12.4, 19.6].map(x => S(x, 10.6, 6, 2, 1.4, 2.6, HT.persian, CLS(8))),
    S(16, 17.6, 3.6, 6.4, 5.4, 5, HT.persian, CLS(14)),
    ...[-1, 1].flatMap(s => [PR(16 + s * 4.4, 21, 2.4, [[-2, 0], [2, 0], [s * 1.4, 4.4]], 1.2, HT.persian, CL), PR(16 + s * 4.4, 21.2, 3.1, [[-1, 0], [1, 0], [s * 0.7, 2.8]], 0.4, HT.persianD, PL)]),
    DS(16, 21, 8.1, 1.1, 0.5, HT.gem, GLS(8)),
    ...[13.4, 18.6].map(x => B(x, 18.6, 8.2, 2, 0.6, 0.3, HT.ink, PL)),
    S(16, 16.4, 8.4, 0.6, 0.45, 0.4, HT.redD, PL),
    ...[-1, 1].flatMap(s => [[16.2, 0.8], [15.6, -0.6]].map(([h, dh]) => RD([16 + s * 2.6, h, 7.8], [16 + s * 8.4, h + dh, 6.4], 0.2, HT.persianD, PL))),
  ]),

  // a golden lucky Meowth on a mahogany plinth: one paw raised to beckon, a coin held in the other and its charm
  // shining on its forehead, GOOD LUCK on a brass plaque (a tap showers coins)
  piece('htlmeowth', 'Hotel lucky Meowth statue', 1, 1, 950, 'metal', [
    B(16, 5, 0, 20, 10, 16, HT.mah, GR), B(16, 10.6, 0, 22, 1.2, 18, HT.mahD, GL),
    B(16, 5, 8.2, 12, 3.6, 0.4, HT.brass, MT), PC(16, 5, 8.5, 11.4, 3.2, word('GOOD LUCK', HT.mahD, HT.brassL, 0.6)),
    RD([10, 13, -3], [6, 19, -4], 0.9, HT.brass, MT), RD([6, 19, -4], [7, 23, -4], 0.9, HT.brass, MT),
    ...[13, 19].map(x => S(x, 12.4, 3, 2, 1.2, 2.6, HT.brassL, MTL(8))),
    S(16, 17, 0, 5.6, 5.6, 4.8, HT.brassL, MTL(14)),
    S(16, 26, 0.6, 7, 5.6, 5.4, HT.brassL, MTL(14)),
    ...[-1, 1].map(s => PR(16 + s * 4.6, 29.4, 0.6, [[-2.2, 0], [2.2, 0], [s * 1, 5.4]], 2, HT.brassL, MT)),
    DS(16, 29.4, 5.6, 1.5, 0.5, HT.cream, GLS(10)),
    ...[13.4, 18.6].map(x => DS(x, 26.2, 5.8, 0.7, 0.3, HT.ink, { m: 'plain', seg: 6 })),
    ...[-1, 1].map(s => RD([16 + s * 2.6, 24.4, 5.6], [16 + s * 8, 24.8, 4.6], 0.2, HT.brassD, PL)),
    RD([20.6, 19, 1], [23.6, 26, 2], 1.4, HT.brassL, MT), S(23.8, 27.2, 2, 1.8, 1.8, 1.6, HT.brassL, MTL(8)),
    DS(12, 16.4, 5.4, 2.2, 0.6, HT.brass, MTL(12)), S(11, 17.6, 4.6, 1.4, 1.4, 1.4, HT.brassL, MTL(8)),
  ]),

  // a palm in a fluted brass urn: a ringed trunk and a crown of fronds arching every way
  piece('htlpalm', 'Hotel palm in a brass urn', 1, 1, 520, 'cloth', [
    LA(16, 0, 0, [[5, 0], [5, 1], [3.4, 2.2], [6.4, 6], [8.4, 12], [8.8, 14], [7.8, 15]], HT.brass, MTL(14)),
    C(16, 14.8, 0, 7.6, 0.6, HT.soil, { m: 'plain', seg: 12 }),
    ...[0, 1, 2, 3, 4].map(k => C(16 + k * 0.3, 17 + k * 4, 0, 1.6 - k * 0.08, 4, k % 2 ? HT.trunk : HT.tan, { m: 'wood', rb: 1.9 - k * 0.08, seg: 8 })),
    frond(17.4, 36, 0, -14, 4), frond(17.4, 36, 0, 14, 5), frond(17.4, 36, 2, -12, -8), frond(17.4, 36, 2, 13, -9),
    frond(17.4, 36, -3, -5, 12), frond(17.4, 36, -3, 6, 12), frond(17.4, 36, 4, -2, 9, 2), frond(17.4, 36, -4, 10, -12, 2),
  ]),

  // a cream marble column: a square plinth, a moulded base, the tapering shaft with a brass band, a brass capital and the
  // marble slab on top
  piece('htlcolumn', 'Hotel marble column', 1, 1, 750, 'gloss', [
    B(16, 2, 0, 26, 4, 26, HT.marbleD, GL),
    LA(16, 4, 0, [[11, 0], [11, 1], [9.6, 2.2], [9.6, 3], [8.6, 4]], HT.marble, GLS(16)),
    C(16, 41, 0, 7.4, 66, HT.marble, { m: 'gloss', rb: 8.4, seg: 16, tex: 'grain' }),
    C(16, 30, 0, 8.4, 1.4, HT.brass, MTL(16)),
    LA(16, 74, 0, [[7.4, 0], [8.6, 1.6], [10.4, 3.2], [11.6, 4]], HT.brass, MTL(16)),
    B(16, 79.2, 0, 26, 2.4, 26, HT.marble, GL),
  ]),

  // a lobby pillar clock: a brass foot, a fluted mahogany post ringed in brass, scrolled brackets and a big round clock
  // with a lit cream face and a brass finial (a tap chimes it)
  piece('htlpillarclock', 'Hotel pillar clock', 1, 1, 1150, 'metal', [
    LA(16, 0, 0, [[8, 0], [8, 2], [6, 3], [4.4, 6], [3.4, 8]], HT.brass, MTL(14)),
    C(16, 26, 0, 2.2, 36, HT.mah, { m: 'wood', seg: 10, tex: 'grain' }),
    ...[10, 40].map(h => C(16, h, 0, 2.7, 1.2, HT.brass, MTL(10))),
    ...[-1, 1].map(s => RD([16, 42, 0], [16 + s * 6, 47.6, 0], 0.5, HT.brass, MT)),
    DS(16, 56, 0, 9, 4, HT.brass, MTL(18)),
    DS(16, 56, 2.1, 7.6, 0.3, HT.glowW, { m: 'glow', seg: 18 }), DS(16, 56, -2.1, 7.6, 0.3, HT.cream, { m: 'plain', seg: 18 }),
    RG(16, 56, 2.2, 8, 0.7, HT.brassL, MT),
    PC(16, 56, 2.4, 10.6, 10.6, clockFace(10, 10)),
    LA(16, 64.6, 0, [[2.4, 0], [1.2, 2], [1.6, 3.6], [0, 5.6]], HT.brass, MTL(10)),
  ], { glow: [HT.glowW] }),

  // the lobby fountain: a round cream marble basin of water, a turned pedestal and an upper bowl spilling a veil of
  // water, a brass spout on top (a tap sends up a spray)
  piece('htlfountain', 'Hotel lobby fountain', 2, 2, 1500, 'gloss', [
    C(32, 5, 0, 30, 10, HT.marble, GLS(24)),
    RG(32, 10, 0, 29.4, 0.9, HT.marbleD, { m: 'gloss', flat: true }),
    C(32, 10.2, 0, 28.4, 0.6, HT.water, { m: 'gloss', seg: 24 }),
    LA(32, 10, 0, [[5, 0], [3, 4], [2.4, 14], [3, 16]], HT.marble, GLS(14)),
    C(32, 19, 0, 10.8, 16, '#cfe8f4', { m: 'glass', rb: 12.6, seg: 18 }),
    LA(32, 26, 0, [[2.6, 0], [8, 2], [11, 4], [11.4, 5]], HT.marble, GLS(18)),
    C(32, 30.6, 0, 10.6, 0.4, HT.water, { m: 'gloss', seg: 18 }),
    LA(32, 30, 0, [[1.8, 0], [1, 4], [2, 6], [0, 8]], HT.brass, MTL(10)),
  ]),

  // a mahogany newspaper stand: three tiers of the day's papers, each front page out, a NEWS crest on top (a tap hands
  // one over)
  piece('htlnewsstand', 'Hotel newspaper stand', 1, 1, 520, 'wood', [
    B(16, 1.5, 0, 28, 3, 16, HT.mahD, PL),
    B(16, 22, -6.5, 26, 40, 2, HT.mah, GR),
    ...[2.5, 29.5].map(x => B(x, 21, -1, 3, 38, 14, HT.mah, GR)),
    ...[[5, 'POKé POST', 'LUGIA SEEN'], [17, 'SAFARI NEWS', 'NEW ARRIVALS'], [29, 'POKé POST', 'FAIR SKIES']].flatMap(([h, mast, head]) => [
      B(16, h, 1, 24, 1, 10, HT.mahL, WD), B(16, h + 1.6, 5.6, 24, 2.4, 0.6, HT.mahL, WD),
      B(9.6, h + 6, 2.4, 11, 10, 0.6, HT.paper, PL), PC(9.6, h + 6, 2.8, 10.6, 9.6, paperFront('LOBBY TIMES', 'GALA TONIGHT')),
      B(22.4, h + 6, 1.8, 11, 10, 0.6, HT.paper, PL), PC(22.4, h + 6, 2.2, 10.6, 9.6, paperFront(mast, head)),
    ]),
    B(16, 43, -5, 30, 4, 4, HT.mahD, GL), B(16, 43, -2.8, 12, 3, 0.4, HT.brass, MT), PC(16, 43, -2.5, 11.4, 2.6, word('NEWS', HT.mahD, HT.brassL)),
  ]),

  // the hotel's crest sign: a mahogany board framed in brass, a brass shield with its H, GRAND HOTEL lit beneath and a
  // glowing lamp at each end (a tap switches it)
  wallPiece('htlcrest', 'Hotel crest sign', 2, 950, 'wood', [
    B(32, 64, 0.8, 58, 24, 1.6, HT.mah, GR),
    ...[52.4, 75.6].map(h => B(32, h, 1.8, 58, 1, 0.6, HT.brass, MT)), ...[3.4, 60.6].map(x => B(x, 64, 1.8, 1, 24, 0.6, HT.brass, MT)),
    PR(32, 62, 1.8, [[-5, 12], [5, 12], [5, 5], [3, 1.6], [0, 0], [-3, 1.6], [-5, 5]], 1, HT.brass, MT),
    PC(32, 68.4, 2.4, 7, 7, word('H', HT.burg, null, 0.9)),
    B(32, 57, 1.8, 46, 6, 0.4, HT.glowW, { m: 'glow' }), PC(32, 57, 2.2, 45, 5.6, word('GRAND HOTEL', HT.mahD, null, 0.8)),
    ...[1.8, 62.2].flatMap(x => [B(x, 64, 1, 2.6, 4, 2, HT.brass, MT), S(x, 67.4, 2, 1.6, 2.6, 1.6, HT.lamp, { m: 'glow', seg: 8 })]),
  ], { glow: [HT.glowW, HT.lamp] }),

  // a row of three brass world-time clocks on a mahogany board, each over its city's plaque: Saffron, Goldenrod and
  // Lumiose, each at its own hour (a tap chimes them)
  wallPiece('htlclocks', 'Hotel world-time clocks', 2, 850, 'metal', [
    B(32, 62, 0.4, 62, 24, 0.8, HT.mah, GR), B(32, 50.6, 0.9, 62, 0.8, 0.6, HT.brass, MT),
    ...[[12, 'SAFFRON', 9, 0], [32, 'GOLDENROD', 3, 15], [52, 'LUMIOSE', 6, 45]].flatMap(([x, city, hh, mm]) => [
      DS(x, 65, 1.4, 7, 1.4, HT.brass, MTL(16)), DS(x, 65, 2.2, 6, 0.4, HT.cream, { m: 'plain', seg: 16 }),
      PC(x, 65, 2.6, 8.4, 8.4, clockFace(hh, mm)),
      B(x, 54.4, 1, 15, 3.6, 0.8, HT.brass, MT), PC(x, 54.4, 1.6, 14.4, 3, word(city, HT.mahD, HT.brassL, 0.62)),
    ]),
  ]),

  // an oil painting of Lugia over a stormy sea by night, a lighthouse lit on the rocks, in a deep gilt frame with a brass
  // picture lamp over it
  wallPiece('htllugia', 'Hotel Lugia oil painting', 2, 1000, 'metal', [
    B(32, 62, 0.6, 56, 34, 1.2, HT.brass, MT), B(32, 62, 1.3, 50, 28, 0.4, HT.brassD, MT),
    PC(32, 62, 1.6, 48, 26, lugiaPainting),
    RD([32, 80, 0.5], [32, 81, 3], 0.4, HT.brass, MT), C(32, 81.4, 3.4, 1.2, 1.2, HT.brass, { m: 'metal', seg: 8 }),
    RD([22, 81, 3.4], [42, 81, 3.4], 1, HT.brass, MT),
  ]),

  // the lobby carpet: a burgundy field of gold lattice and dots, a teal-and-gold medallion in the middle, a wide gold
  // border with a burgundy key pattern
  { id: 'htlcarpet', name: 'Hotel lobby carpet', group: GROUP, solo: true, w: 2, h: 3, layer: 'rug', price: 950, high: 0.03, side: 'c', flat() {
    const g = ctx(), path = () => { g.beginPath(); RUG.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
    g.fillStyle = HT.burg; path(); g.fill();
    g.save(); path(); g.clip();
    g.fillStyle = HT.brass; g.fillRect(0, 0, 64, 6); g.fillRect(0, 90, 64, 6); g.fillRect(0, 0, 6, 96); g.fillRect(58, 0, 6, 96);
    g.fillStyle = HT.burgD;
    for (let k = 0; k < 16; k++) { g.fillRect(4 + k * 3.6, 2.2, 1.6, 1.6); g.fillRect(4 + k * 3.6, 92.2, 1.6, 1.6); }
    for (let k = 0; k < 25; k++) { g.fillRect(2.2, 4 + k * 3.6, 1.6, 1.6); g.fillRect(60.2, 4 + k * 3.6, 1.6, 1.6); }
    g.strokeStyle = HT.teal; g.lineWidth = 1; g.strokeRect(8, 8, 48, 80);
    g.strokeStyle = 'rgba(216,172,64,0.55)'; g.lineWidth = 0.4;
    for (let d = -96; d < 96; d += 8) { g.beginPath(); g.moveTo(9 + d, 9); g.lineTo(9 + d + 78, 87); g.moveTo(55 - d, 9); g.lineTo(55 - d - 78, 87); g.stroke(); }
    g.fillStyle = HT.brassL;
    for (let y = 13; y < 86; y += 8) for (let x = 13; x < 54; x += 8) { g.beginPath(); g.arc(x, y, 0.6, 0, TAU); g.fill(); }
    const lozenge = (r, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(32, 48 - r * 1.4); g.lineTo(32 + r, 48); g.lineTo(32, 48 + r * 1.4); g.lineTo(32 - r, 48); g.closePath(); g.fill(); };
    lozenge(16, HT.brass); lozenge(14, HT.teal); lozenge(9, HT.burgD); lozenge(6, HT.brass); lozenge(3.4, HT.tealL);
    g.restore();
    g.strokeStyle = HT.brassD; g.lineWidth = 1; path(); g.stroke();
  } },
];
