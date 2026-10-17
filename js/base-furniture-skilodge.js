/* base-furniture-skilodge.js  -  the Ski lodge set (furniture expansion session l, 2026-10-17): a whole room of an
   alpine resort's après-ski lodge, as Animal Crossing's Happy Home Paradise does a room type. Warm honey pine and red
   and white Nordic knit, chrome resort gear, snow white and a fir green: a round stone hearth pit under a copper hood,
   a chair off the lift hung from its cable post, a gondola cabin set down as a nook seat, a sweater-knit sofa and a
   sheepskin armchair, a hot cocoa bar with its steaming pot, a fondue table, the ski rental counter with its wall of
   skis, the lift ticket kiosk, a boot dryer, a waxing bench, the helmet locker, a snowboard rack, boot cubbies, a
   snowboard coffee table, a knit-shaded floor lamp, a trail sign post, a ski patrol rescue sled, a picture window on
   the peaks, crossed vintage skis and a knit rug. The trail map of Lapras Peak (Lapras swimming in its lake), a Swinub
   snowmobile, Delibird in a bobble hat holding the WELCOME board and Cubchoo with a mug of cocoa for the Pokémon
   touches. All solo, fixed colours, sold all year.
   An upright piece is a list of parts in painted units (32 a tile), as in js/base-furniture-ramen.js: `x` across from
   the left of its front, `h` up from the floor (a wall piece's from the foot of its strip), `z` out to the front from
   its middle (a wall piece's from the wall). They're painted here from any side, and js/base-models-skilodge.js builds
   the same list as 3D parts (BUILT), so picture and model agree. `tex: 'grain'` and `tex: 'knit'` (the sweater
   stitches and their band of snowflakes, `kc` its colour) are painted only (the model stays plain colour). A `pic`
   part (the signs, the map, the window's view) is painted on the front only, and the model wears that crop of the
   painting. The rug is painted from above (RUG). */

import { sh, oval, ovalShade, floorShadow, ctx, hash, glass as glassPane } from './base-paint.js';

export const SK = {
  pine: '#d8a060', pineL: '#ecc286', pineD: '#a4703c', pineDD: '#6e4624',
  red: '#c8282e', redD: '#8c1820', redL: '#e04a46', white: '#f6f2ea', snow: '#eef4fa', snowD: '#c4d4e4',
  fir: '#2f6b4a', firD: '#1d4630', firL: '#4a8c62', blue: '#3a7ad0', blueD: '#24508e', yellow: '#f2c040',
  chrome: '#c4ccd2', chromeL: '#e6ecf0', chromeD: '#7a848c', black: '#24262a', blackL: '#44484e',
  stone: '#8e8880', stoneL: '#b0aaa0', stoneD: '#625c56', copper: '#c47a40', copperL: '#e6a26a', copperD: '#86481e',
  ember: '#ff8a2a', flame: '#ffd050', cocoa: '#5c301c', cream: '#f4e4c8', cheese: '#f4c84a', marsh: '#fffaf0',
  sky: '#a8d0f0', skyD: '#5a96d4', fleece: '#f2eadc', fleeceD: '#d8ccb6', screen: '#bfe4ff', glowW: '#fff2cc',
  lamp: '#ff4a3a', lens: '#f2a030', wax: '#9a6ad8', iron: '#e85a2a',
  swinub: '#8a5a34', swinubD: '#5c3a20', snout: '#f0a8a0', deli: '#d83a34', deliW: '#f8f4ec', beak: '#f2c040',
  cub: '#eef0f4', cubB: '#5a86c8', snot: '#bfe4ff', lapras: '#5aa0d8', laprasD: '#2e6a9e', shell: '#9a8e80',
};
const GROUP = 'Ski lodge';
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
  } else if (q.tex === 'knit') {
    const k = q.kc || SK.white, H = y1 - y0, mid = y0 + H * (q.kb ?? 0.5);
    g.lineWidth = 0.3; g.globalAlpha = 0.4; g.strokeStyle = sh(c, -2);
    for (let y = y0 + 0.8, i = 0; y < y1; y += 1.5, i++) {
      g.beginPath();
      for (let x = x0 - (i % 2) * 0.7; x < x1 + 1.4; x += 1.4) { g.moveTo(x, y); g.lineTo(x + 0.7, y + 0.8); g.lineTo(x + 1.4, y); }
      g.stroke();
    }
    if (H > 6) {
      g.globalAlpha = 1; g.fillStyle = k;
      g.fillRect(x0, mid - 2.6, x1 - x0, 0.5); g.fillRect(x0, mid + 2.1, x1 - x0, 0.5);
      for (let x = x0 + 2.2; x < x1 - 1; x += 4.4) {
        g.beginPath(); g.moveTo(x, mid - 1.4); g.lineTo(x + 1.1, mid); g.lineTo(x, mid + 1.4); g.lineTo(x - 1.1, mid); g.closePath(); g.fill();
        g.fillRect(x + 2.05, mid - 0.25, 0.3, 0.5);
      }
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
const text = (g, s, cx, cy, size, c, maxW) => { g.fillStyle = c; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `bold ${size}px ${SANS}`; g.fillText(s, cx, cy, maxW); };
const vgrad = (g, x, y, h, top, bot) => { const l = g.createLinearGradient(0, y, 0, y + h); l.addColorStop(0, top); l.addColorStop(1, bot); return l; };
const shape = (g, pts) => { g.beginPath(); pts.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py))); g.closePath(); g.fill(); };
/** A trail's mark: a green circle, a blue square or a black diamond, centred on cx, cy. */
function mark(g, kind, cx, cy, r) {
  if (kind === 'circle') { g.fillStyle = '#3aa04a'; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill(); }
  else if (kind === 'square') { g.fillStyle = SK.blue; g.fillRect(cx - r, cy - r, r * 2, r * 2); }
  else { g.fillStyle = SK.black; shape(g, [[cx, cy - r * 1.2], [cx + r, cy], [cx, cy + r * 1.2], [cx - r, cy]]); }
}
/** A row of snow-capped firs along y, n of them across x..x+w. */
function firs(g, x, y, w, n, th, seed) {
  for (let i = 0; i < n; i++) {
    const tx = x + (i + 0.5) / n * w + (hash(i, seed, 1) - 0.5) * w / n * 0.6, t = th * (0.7 + hash(i, seed, 2) * 0.6), tw = w / n * 0.42;
    g.fillStyle = SK.firD; shape(g, [[tx, y - t], [tx + tw, y], [tx - tw, y]]);
    g.fillStyle = SK.snow; shape(g, [[tx, y - t], [tx + tw * 0.34, y - t * 0.66], [tx - tw * 0.34, y - t * 0.66]]);
  }
}
/** The peaks out of the lodge's window: a winter sky, a pale far range, the white near peaks shaded on their east
    faces, a chairlift's cable across them, a fir forest along the foot and snow falling. */
function peaks(g, x, y, w, h) {
  g.fillStyle = vgrad(g, x, y, h, SK.skyD, SK.sky); g.fillRect(x, y, w, h);
  const range = (pts, c) => { g.fillStyle = c; shape(g, [[x, y + h], ...pts.map(([px, py]) => [x + px * w, y + py * h]), [x + w, y + h]]); };
  range([[0, 0.6], [0.12, 0.4], [0.22, 0.5], [0.36, 0.3], [0.46, 0.46], [0.6, 0.34], [0.74, 0.48], [0.88, 0.32], [1, 0.48]], '#cfdcec');
  const near = [[0, 0.76], [0.18, 0.4], [0.3, 0.56], [0.5, 0.2], [0.66, 0.52], [0.8, 0.38], [1, 0.66]];
  range(near, SK.snow);
  g.fillStyle = SK.snowD;
  for (const [px, py] of [near[1], near[3], near[5]]) shape(g, [[x + px * w, y + py * h], [x + (px + 0.12) * w, y + 0.8 * h], [x + (px + 0.02) * w, y + 0.8 * h]]);
  g.strokeStyle = SK.black; g.lineWidth = 0.25; g.beginPath(); g.moveTo(x, y + h * 0.5); g.lineTo(x + w, y + h * 0.28); g.stroke();
  for (let i = 1; i < 4; i++) { const cx = x + i / 4 * w, cy = y + h * (0.5 - 0.22 * i / 4); g.fillRect(cx - 0.1, cy, 0.2, h * 0.05); g.fillStyle = SK.red; g.fillRect(cx - 1, cy + h * 0.05, 2, h * 0.025); g.fillStyle = SK.black; }
  g.fillStyle = SK.firD; g.fillRect(x, y + h * 0.92, w, h * 0.08);
  firs(g, x, y + h * 0.95, w, 16, h * 0.2, 4);
  g.fillStyle = 'rgba(255,255,255,0.85)';
  for (let i = 0; i < 26; i++) { g.beginPath(); g.arc(x + hash(i, 7, 1) * w, y + hash(i, 9, 2) * h, 0.25 + hash(i, 3, 3) * 0.25, 0, TAU); g.fill(); }
}
/** Lapras Peak's trail map: the mountain under its red title band, green, blue and black runs wound down from the
    summit, the lift's dotted line, firs, and Lapras swimming in the lake at its foot, the trails' key in the corner. */
function trailMap(g, x, y, w, h) {
  g.fillStyle = vgrad(g, x, y, h, '#7fb6e6', '#d6e8f6'); g.fillRect(x, y, w, h);
  const P = (px, py) => [x + px * w, y + py * h];
  g.fillStyle = SK.snow; shape(g, [P(0, 0.92), P(0.18, 0.5), P(0.3, 0.58), P(0.5, 0.2), P(0.68, 0.54), P(0.82, 0.42), P(1, 0.86), P(1, 1), P(0, 1)]);
  g.fillStyle = SK.snowD; shape(g, [P(0.5, 0.2), P(0.62, 0.8), P(0.52, 0.8)]); shape(g, [P(0.18, 0.5), P(0.26, 0.86), P(0.2, 0.86)]);
  firs(g, x, y + h * 0.96, w, 14, h * 0.14, 2);
  const run = (c, pts, dash) => { g.strokeStyle = c; g.lineWidth = 0.6; g.setLineDash(dash || []); g.beginPath(); g.moveTo(...P(...pts[0])); for (let i = 1; i + 1 < pts.length; i += 2) g.quadraticCurveTo(...P(...pts[i]), ...P(...pts[i + 1])); g.stroke(); g.setLineDash([]); };
  run('#3aa04a', [[0.48, 0.24], [0.2, 0.5], [0.34, 0.66], [0.46, 0.8], [0.3, 0.9]]);
  run(SK.blue, [[0.5, 0.22], [0.6, 0.44], [0.5, 0.56], [0.42, 0.7], [0.58, 0.88]]);
  run(SK.black, [[0.52, 0.22], [0.76, 0.42], [0.7, 0.6], [0.64, 0.76], [0.82, 0.88]]);
  run(SK.red, [[0.66, 0.9], [0.58, 0.55], [0.51, 0.21]], [0.6, 0.6]);
  const lx = x + w * 0.16, ly = y + h * 0.86;
  g.fillStyle = '#4a9ad8'; g.beginPath(); g.ellipse(lx, ly, w * 0.13, h * 0.07, 0, 0, TAU); g.fill();
  g.fillStyle = SK.lapras; g.beginPath(); g.ellipse(lx, ly + h * 0.01, w * 0.045, h * 0.03, 0, 0, TAU); g.fill();
  g.fillStyle = SK.shell; g.beginPath(); g.ellipse(lx + w * 0.005, ly - h * 0.005, w * 0.032, h * 0.02, 0, Math.PI, TAU); g.fill();
  g.strokeStyle = SK.lapras; g.lineWidth = 0.9; g.beginPath(); g.moveTo(lx - w * 0.035, ly); g.quadraticCurveTo(lx - w * 0.07, ly - h * 0.04, lx - w * 0.05, ly - h * 0.09); g.stroke();
  g.fillStyle = SK.lapras; g.beginPath(); g.ellipse(lx - w * 0.055, ly - h * 0.095, w * 0.018, h * 0.018, 0, 0, TAU); g.fill();
  g.fillStyle = SK.black; g.beginPath(); g.arc(lx - w * 0.06, ly - h * 0.1, 0.25, 0, TAU); g.fill();
  g.fillStyle = SK.red; g.fillRect(x, y, w, h * 0.15);
  text(g, 'LAPRAS PEAK', x + w / 2, y + h * 0.08, h * 0.1, SK.white, w * 0.8);
  g.fillStyle = 'rgba(255,255,255,0.85)'; g.fillRect(x + w * 0.78, y + h * 0.18, w * 0.2, h * 0.18);
  ['circle', 'square', 'diamond'].forEach((k, i) => mark(g, k, x + w * (0.82 + i * 0.06), y + h * 0.27, h * 0.03));
}
/** A trail sign's arrow board: its mark and the run's name. */
const signBoard = (label, kind) => (g, x, y, w, h) => { mark(g, kind, x + h * 0.6, y + h / 2, h * 0.3); text(g, label, x + w * 0.58, y + h * 0.54, h * 0.56, SK.pineDD, w * 0.66); };
/** The gondola's number plate. */
const plate = (g, x, y, w, h) => { g.fillStyle = SK.white; g.fillRect(x, y, w, h); text(g, 'No. 7', x + w / 2, y + h * 0.56, h * 0.7, SK.red, w * 0.9); };

/* ---------- the kinds ---------- */

/** What js/base-models-skilodge.js builds for each upright and wall kind: its parts, doors and default material. */
export const BUILT = {};
/** The knit rug's outline from above, in painted units across its 2 x 2 tiles, corners cut. */
export const RUG = [[6, 3], [58, 3], [61, 6], [61, 58], [58, 61], [6, 61], [3, 58], [3, 6]];

function piece(id, name, w, h, price, mat, parts, { doors = [], inside, ...rest } = {}) {
  BUILT[id] = { parts, doors, inside, mat };
  const all = [...parts, ...doors.flatMap(d => d.parts)];
  return { id, name, group: GROUP, solo: true, w, h, price, ...rest, draw(x, b, vw, dir) { floorShadow(x, b, vw); paintParts(all, x, b, vw, dir, w * 32); } };
}
function wallPiece(id, name, w, price, mat, parts, rest = {}) {
  BUILT[id] = { parts, doors: [], mat };
  return { id, name, group: GROUP, solo: true, w, h: 1, layer: 'wall', price, ...rest, wall(x) { paintParts(parts, x, 96, w * 32, 0, w * 32); } };
}

const KN = (c = SK.white, o) => ({ m: 'cloth', tex: 'knit', kc: c, r: 2, ...o });
/** A mug: a gloss cup, its handle and the cocoa in it. */
const mug = (x, h, z, c) => [LA(x, h, z, [[1.8, 0], [2.1, 0.4], [2.2, 4.6]], c, { m: 'gloss', seg: 10 }), RG(x + 2.6, h + 2.4, z, 1.2, 0.4, c, { m: 'gloss' }), C(x, h + 4.3, z, 2, 0.4, SK.cocoa, { m: 'plain', seg: 10 })];
/** A ski boot stood up: its tall shell and its sole out to the front, two buckles. */
const boot = (x, h, z, c) => [B(x, h + 5, z - 1, 5, 10, 6, c, GL), B(x, h + 1.6, z + 2.4, 5, 3.2, 8, c, GL), B(x, h + 0.4, z + 2, 5.4, 0.8, 9, SK.black, PL),
  ...[5, 8].map(dh => B(x, h + dh, z + 2.1, 5.2, 0.6, 0.6, SK.chrome, MT))];
/** A knit bobble hat: its dome, a white turned-up band and the pompom. */
const hat = (x, h, z, c, r = 5) => [LA(x, h, z, [[r, 0], [r, 1.6], [r * 0.9, r * 0.9], [r * 0.4, r * 1.6], [0, r * 1.75]], c, { m: 'cloth', seg: 12 }),
  C(x, h + 1, z, r + 0.15, 2, SK.white, { m: 'cloth', seg: 12 }), S(x, h + r * 1.85, z, r * 0.36, r * 0.36, r * 0.36, SK.white, { m: 'cloth', seg: 8 })];
/** A snowboard stood on its tail, facing the front: the deck with rounded ends and a stripe down it. */
const board = (x, h0, h1, z, c, s = SK.white) => [B(x, (h0 + h1) / 2, z, 8, h1 - h0 - 8, 1.2, c, { m: 'gloss', r: 0.4 }),
  DS(x, h0 + 4, z, 4, 1.2, c, { m: 'gloss', seg: 14 }), DS(x, h1 - 4, z, 4, 1.2, c, { m: 'gloss', seg: 14 }), B(x, (h0 + h1) / 2, z + 0.7, 2, h1 - h0 - 6, 0.2, s, PL)];
/** A flat strip from (x0, h0) to (x1, h1), w across: a ski seen from the front. */
const strip = (x0, h0, x1, h1, w) => { const l = Math.hypot(x1 - x0, h1 - h0), nx = -(h1 - h0) / l * w / 2, nh = (x1 - x0) / l * w / 2; return [[x0 + nx, h0 + nh], [x1 + nx, h1 + nh], [x1 - nx, h1 - nh], [x0 - nx, h0 - nh]]; };

export const SKILODGE_KINDS = [
  // the hearth pit: a round ring of fieldstone round a bed of embers, three logs stood in a teepee and the fire up
  // through them, a copper hood hung over all on its flue (a tap lights it and puts it out)
  piece('sklhearth', 'Ski lodge stone hearth pit', 2, 2, 1500, 'gloss', [
    C(32, 6, 0, 26, 12, SK.stone, { m: 'gloss', seg: 20 }),
    ...Array.from({ length: 10 }, (_, i) => { const a = i / 10 * TAU + 0.3; return S(32 + Math.cos(a) * 23.5, 12, Math.sin(a) * 23.5, 4, 2.2, 4, i % 2 ? SK.stoneL : SK.stoneD, { m: 'gloss', seg: 8 }); }),
    C(32, 12.4, 0, 20, 0.6, SK.black, { m: 'plain', seg: 18 }),
    S(32, 13, 0, 13, 1.6, 13, SK.ember, { m: 'glow', seg: 12 }),
    RD([22, 13, -5], [32, 23, 0], 1.6, SK.pineDD, WD), RD([42, 13, -5], [32, 23, 0], 1.6, SK.pineDD, WD), RD([32, 13, 10], [32, 23, 0], 1.6, SK.pineDD, WD),
    LA(32, 13, 0, [[6.4, 0], [5.4, 4], [2.8, 10], [0, 17]], SK.flame, { m: 'glow', seg: 10 }),
    LA(32, 34, 0, [[22, 0], [22, 1.6], [13, 9], [5.4, 16], [5.4, 18]], SK.copper, { m: 'metal', seg: 20 }),
    C(32, 34.6, 0, 22.4, 1.4, SK.copperD, { m: 'metal', seg: 20 }),
    C(32, 70, 0, 5, 36, SK.copper, { m: 'metal', seg: 12 }),
    ...[56, 72].map(h => C(32, h, 0, 5.4, 1.2, SK.copperD, { m: 'metal', seg: 12 })),
  ], { glow: [SK.flame, SK.ember] }),

  // the hot cocoa bar: a pine counter fronted in red sweater knit, a copper pot of cocoa on its burner with the ladle
  // in, red and white mugs in a row, a jar of marshmallows, the cream and a chalk HOT COCOA board (a tap steams it)
  piece('sklcocoa', 'Ski lodge hot cocoa bar', 2, 1, 1300, 'wood', [
    B(32, 1.5, 1, 60, 3, 26, SK.pineDD, PL),
    B(32, 15, 0, 62, 24, 28, SK.pine, GR),
    B(32, 15, 14.2, 56, 18, 0.6, SK.red, KN()),
    B(32, 28, 0, 64, 2, 30, SK.pineL, GL),
    C(16, 29.6, -3, 6, 1.2, SK.black, { m: 'metal', seg: 12 }),
    LA(16, 30.2, -3, [[6, 0], [7, 1], [7.2, 9], [7.6, 9.6]], SK.copper, { m: 'metal', seg: 14 }), C(16, 39.4, -3, 7, 0.4, SK.cocoa, { m: 'plain', seg: 12 }),
    ...[-1, 1].map(s => RD([16 + s * 7.4, 37, -3], [16 + s * 9.6, 37, -3], 0.6, SK.copperD, MT)),
    RD([18, 39, -3], [22, 46, -5], 0.5, SK.chrome, MT),
    ...[28, 34, 40, 46].flatMap((x, i) => mug(x, 29, 7, i % 2 ? SK.white : SK.red)),
    LA(54, 29, -2, [[3, 0], [3.4, 1], [3.4, 8], [2.4, 9]], '#cfe8f4', { m: 'glass', seg: 12 }),
    ...[[53, 31, -2], [55, 32, -1], [54, 34, -3], [53.4, 35.6, -1.4]].map(([x, h, z]) => S(x, h, z, 1.4, 1.2, 1.4, SK.marsh, { m: 'cloth', seg: 6 })),
    C(54, 38.4, -2, 2.6, 1, SK.copper, { m: 'metal', seg: 10 }),
    C(46, 33, -4, 1.6, 8, SK.white, { m: 'gloss', seg: 10 }), C(46, 37.6, -4, 0.7, 1.4, SK.red, { m: 'gloss', seg: 8 }),
    B(32, 38, -12, 20, 12, 1, SK.pineD, WD), B(32, 38, -11.4, 18, 10, 0.4, SK.black, PL),
    PC(32, 38, -11.1, 17, 9, word('HOT COCOA', SK.cream, SK.black, 0.42)),
  ]),

  // a round pine fondue table: a knit doily, a copper pot of melted cheese over a little flame on its trivet, forks
  // dipped with bread on them (a tap bubbles it)
  piece('sklfondue', 'Ski lodge fondue table', 1, 1, 900, 'wood', [
    LA(16, 0, 0, [[10, 0], [10, 1.2], [3.4, 3], [2.4, 20], [3.4, 22]], SK.pineD, { m: 'wood', seg: 14 }),
    C(16, 23, 0, 14.4, 2, SK.pine, { m: 'wood', tex: 'grain', seg: 20 }),
    C(16, 24.2, 0, 10, 0.4, SK.red, { m: 'cloth', seg: 18 }),
    ...[0, 1, 2].map(i => { const a = i / 3 * TAU + 0.5; return RD([16 + Math.cos(a) * 5.4, 24.4, Math.sin(a) * 5.4], [16 + Math.cos(a) * 4.4, 30, Math.sin(a) * 4.4], 0.4, SK.copperD, MT); }),
    LA(16, 24.4, 0, [[2, 0], [1.4, 2], [0, 4]], SK.flame, { m: 'glow', seg: 8 }),
    LA(16, 29, 0, [[3.4, 0], [6, 2], [6.4, 6], [5.4, 7.4]], SK.copper, { m: 'metal', seg: 14 }), C(16, 36.2, 0, 5.4, 0.4, SK.cheese, { m: 'plain', seg: 12 }),
    ...[[8, 44, 3], [24, 45, -2], [20, 46, 5]].flatMap(([x, h, z]) => [RD([16 + (x - 16) * 0.2, 35, z * 0.2], [x, h, z], 0.35, SK.chrome, MT), B(x, h + 1, z, 2.4, 2.4, 2.4, SK.cream, { m: 'cloth', r: 0.6 })]),
  ], { glow: [SK.flame] }),

  // a chrome boot dryer: warm pegs in two rows off its back panel, three ski boots upturned on the top row and mitts on
  // the lower, its red light lit and a dial on the base (a tap hums it)
  piece('sklbootdryer', 'Ski lodge boot dryer', 1, 1, 700, 'metal', [
    B(16, 3, 0, 28, 6, 16, SK.chromeD, MT),
    DS(26, 3, 8.2, 1, 0.4, SK.lamp, { m: 'glow', seg: 8 }), DS(6, 3, 8.2, 1.6, 0.6, SK.black, { m: 'gloss', seg: 10 }),
    B(16, 24, -4, 26, 36, 3, SK.chrome, MT), B(16, 42.6, -4, 28, 1.4, 4, SK.chromeL, MT),
    ...[7, 16, 25].flatMap(x => [RD([x, 14, -2.5], [x, 17, 5], 0.8, SK.chromeL, MT), RD([x, 28, -2.5], [x, 31, 4], 0.8, SK.chromeL, MT)]),
    ...[[7, SK.red], [16, SK.blue], [25, SK.black]].flatMap(([x, c]) => [B(x, 36, 4, 6.6, 10, 6, c, GL), B(x, 42, 6.4, 6.6, 2.6, 9, c, GL), B(x, 43.6, 6.4, 7, 0.8, 9.4, SK.black, PL)]),
    ...[[7, SK.fir], [16, SK.red], [25, SK.white]].map(([x, c]) => S(x, 19, 5.6, 3, 3.8, 1.8, c, { m: 'cloth', seg: 8 })),
  ], { glow: [SK.lamp] }),

  // the ski rental counter: a pine counter with a chrome top and a red SKI RENTAL panel, the rental skis stood along
  // the back wall in their rack, a desk bell, a rental helmet and a stack of tickets on top (a tap hands over a ticket)
  piece('sklrental', 'Ski lodge ski rental counter', 2, 1, 1400, 'wood', [
    B(32, 38, -13, 62, 52, 2, SK.pineD, GR),
    B(32, 26, -11.4, 60, 2, 3, SK.pineDD, WD), B(32, 56, -11.4, 60, 2, 3, SK.pineDD, WD),
    ...[6, 13, 20, 27, 37, 44, 51, 58].flatMap((x, i) => [B(x, 41, -11, 3.6, 44, 0.8, [SK.red, SK.blue, SK.yellow, SK.fir, SK.white][i % 5], GL), DS(x, 63, -11, 1.8, 0.8, [SK.red, SK.blue, SK.yellow, SK.fir, SK.white][i % 5], { m: 'gloss', seg: 8 }), B(x, 38, -10.4, 4, 3, 1.6, SK.black, GL)]),
    B(32, 15, 4, 62, 30, 20, SK.pine, GR),
    B(32, 20, 14.3, 40, 7, 0.6, SK.red, GL), PC(32, 20, 14.65, 38, 6.4, word('SKI RENTAL', SK.white, SK.red)),
    B(32, 8, 14.3, 56, 3, 0.6, SK.red, KN()),
    B(32, 30.8, 4, 64, 1.6, 22, SK.chrome, MT),
    LA(10, 31.6, 6, [[2.6, 0], [2.2, 1.4], [0.8, 3], [0, 3.4]], SK.copper, { m: 'metal', seg: 10 }), S(10, 35.4, 6, 0.6, 0.6, 0.6, SK.copperL, MT),
    B(22, 32.4, 6, 8, 1.6, 6, SK.cream, PL),
    S(50, 34, 4, 5, 4.4, 5, SK.red, { m: 'gloss', seg: 12 }), B(50, 34.4, 8.2, 8, 2.4, 1, SK.lens, GL),
  ]),

  // the lift ticket kiosk: a red stand with a chrome LIFT TICKETS head, a lit screen, the card reader and the slot a
  // pass comes out of (a tap prints one)
  piece('skltickets', 'Ski lodge lift ticket kiosk', 1, 1, 950, 'gloss', [
    B(16, 1.5, 0, 24, 3, 18, SK.black, PL),
    B(16, 26, 0, 22, 46, 16, SK.red, GL),
    B(16, 36, 8.2, 18, 13, 0.6, SK.black, GL), B(16, 36, 8.6, 16, 11, 0.4, SK.screen, { m: 'glow' }),
    B(16, 52, 0, 24, 6, 17, SK.chrome, MT), PC(16, 52, 8.55, 23, 5.4, word('LIFT TICKETS', SK.red, null)),
    B(16, 23, 8.4, 10, 1.4, 0.6, SK.black, PL),
    B(16, 16, 8.6, 6, 4, 1.2, SK.chromeD, MT), DS(16, 16, 9.3, 1, 0.2, SK.fir, { m: 'glow', seg: 8 }),
    B(16, 8, 8.3, 18, 4, 0.4, SK.white, KN(SK.red)),
  ], { glow: [SK.screen] }),

  // a chair off the lift: its steel cable post on a base plate, the haul arm out over the room, the hanger down to a
  // padded red double seat, its armrests and the footrest bar
  piece('skllift', 'Ski lodge ski-lift chair bench', 2, 1, 1500, 'metal', [
    B(6, 1, -4, 10, 2, 20, SK.chromeD, MT),
    C(6, 36, -8, 2.4, 70, SK.chromeD, { m: 'metal', seg: 10 }),
    RD([6, 69, -8], [60, 69, -8], 1.2, SK.chromeD, MT), C(60, 69, -8, 2, 3, SK.black, { m: 'metal', seg: 10 }),
    B(32, 69, -8, 7, 4, 4, SK.black, GL),
    RD([32, 67, -8], [32, 45, -13], 1, SK.chromeD, MT),
    RD([10, 45, -13], [54, 45, -13], 0.9, SK.chrome, MT),
    ...[10, 54].flatMap(x => [RD([x, 45, -13], [x, 17, -13], 0.9, SK.chrome, MT), RD([x, 17, -13], [x, 15, 10], 0.9, SK.chrome, MT), RD([x, 30, -13], [x, 30, 8], 0.8, SK.chrome, MT)]),
    B(32, 18, -2, 44, 4, 22, SK.red, VL(1.6)),
    B(32, 31, -11.4, 44, 22, 3, SK.red, VL(1.4)), B(32, 31, -9.8, 40, 4, 0.4, SK.white, PL),
    ...[16, 48].map(x => RD([x, 15, 8], [x, 6, 12], 0.6, SK.chrome, MT)), RD([14, 6, 12], [50, 6, 12], 0.7, SK.chrome, MT),
  ]),

  // a gondola cabin set down on its stand as a nook seat: rounded red shell, white roof and its grip on the cable, the
  // door slid open on a knit-cushioned bench and a window on the peaks inside
  piece('sklgondola', 'Ski lodge gondola nook', 2, 1, 1500, 'gloss', [
    B(32, 1.5, 0, 62, 3, 30, SK.chromeD, MT),
    B(32, 25, -13, 58, 40, 2, SK.red, { m: 'gloss', r: 1 }),
    ...[4, 60].map(x => B(x, 25, 0, 2.4, 40, 28, SK.red, { m: 'gloss', r: 1 })),
    B(32, 4, 0, 58, 2, 28, SK.redD, PL),
    B(32, 9, 13, 58, 8, 2, SK.red, { m: 'gloss', r: 1 }), B(32, 41, 13, 58, 8, 2, SK.red, { m: 'gloss', r: 1 }),
    PC(32, 41, 14.1, 12, 4.4, plate),
    B(32, 46.6, 0, 60, 4, 30, SK.white, { m: 'gloss', r: 1.6 }),
    PC(32, 31, -11.9, 44, 14, peaks),
    B(32, 13, -3, 50, 6, 18, SK.red, KN()), B(32, 23, -10.4, 50, 14, 3, SK.white, KN(SK.red)),
    C(32, 53, 0, 1.6, 10, SK.chromeD, { m: 'metal', seg: 8 }), B(32, 59, 0, 10, 4, 6, SK.black, GL), RD([20, 61, 0], [44, 61, 0], 0.6, SK.black, MT),
  ]),

  // the sweater sofa: deep red Nordic knit with a band of white snowflakes through every cushion, cable-knit pillows
  // and a fir-green throw over one arm, on pine feet
  piece('sklsofa', 'Ski lodge Nordic sweater sofa', 2, 1, 1300, 'cloth', [
    ...[[6, -9], [58, -9], [6, 9], [58, 9]].map(([x, z]) => C(x, 1, z, 1.6, 2, SK.pineD, { m: 'wood', seg: 8 })),
    B(32, 6, 0, 60, 8, 26, SK.redD, VL(1.2)),
    ...[18.5, 45.5].map(x => B(x, 12.5, 2, 26, 5, 22, SK.red, KN())),
    B(32, 24, -9, 52, 24, 8, SK.red, KN(SK.white, { kb: 0.4 })),
    ...[3.4, 60.6].map(x => B(x, 14, 0, 6.8, 18, 26, SK.red, KN(SK.white, { r: 2.6 }))),
    S(13, 20, -3, 5, 5, 2.4, SK.white, { m: 'cloth', seg: 10 }), S(51, 20, -3, 5, 5, 2.4, SK.white, { m: 'cloth', seg: 10 }),
    B(60.6, 23.6, 0, 7.4, 1.4, 14, SK.fir, KN()), B(60.6, 18, 7.4, 7.4, 11, 1.2, SK.fir, KN()),
  ]),

  // a pine armchair heaped with sheepskin, a red knit cushion at its back
  piece('sklarmchair', 'Ski lodge sheepskin armchair', 1, 1, 900, 'wood', [
    ...[[5, -10], [27, -10], [5, 10], [27, 10]].map(([x, z]) => C(x, 4, z, 1.4, 8, SK.pineD, { m: 'wood', seg: 8 })),
    B(16, 9, 0, 28, 3, 24, SK.pine, GR),
    ...[4, 28].map(x => C(x, 24, -10, 1.6, 30, SK.pine, { m: 'wood', seg: 8 })), B(16, 38, -10, 26, 3, 3, SK.pine, WD),
    ...[3, 29].flatMap(x => [B(x, 17, 0, 3.4, 2, 22, SK.pine, WD), C(x, 13, 9, 1.2, 8, SK.pine, { m: 'wood', seg: 8 })]),
    S(16, 12.4, 1, 11.6, 3, 11, SK.fleece, { m: 'cloth', seg: 12 }),
    S(16, 25, -8, 11, 12, 3.2, SK.fleece, { m: 'cloth', seg: 12 }),
    S(16, 9, 10, 10.4, 3, 2, SK.fleeceD, { m: 'cloth', seg: 10 }),
    B(16, 21, -4, 14, 9, 3, SK.red, KN()),
  ]),

  // a coffee table made of a snowboard laid flat on four log legs, two mugs of cocoa on its deck
  piece('skltable', 'Ski lodge snowboard coffee table', 2, 1, 650, 'wood', [
    ...[[14, -5], [50, -5], [14, 5], [50, 5]].map(([x, z]) => C(x, 7.4, z, 2.4, 14.8, SK.pineD, { m: 'wood', tex: 'grain', seg: 10 })),
    B(32, 15.6, 0, 44, 1.6, 18, SK.blue, { m: 'gloss', r: 0.6 }),
    ...[10, 54].map(x => C(x, 15.6, 0, 9, 1.6, SK.blue, { m: 'gloss', seg: 18 })),
    B(32, 16.5, 0, 40, 0.2, 3, SK.white, PL),
    ...mug(24, 16.4, -2, SK.red), ...mug(38, 16.4, 3, SK.white),
  ]),

  // a waxing bench: a pine workbench with a red snowboard clamped base-up in its two vises, the hot wax iron on it, a
  // bar of wax, and brushes and scrapers on the shelf (a tap steams the iron)
  piece('sklwaxbench', 'Ski lodge waxing bench', 2, 1, 750, 'wood', [
    ...[[4, -9], [60, -9], [4, 9], [60, 9]].map(([x, z]) => B(x, 11.25, z, 3, 22.5, 3, SK.pineD, WD)),
    B(32, 6, 0, 58, 2, 20, SK.pineD, WD), B(32, 24, 0, 62, 3, 24, SK.pine, GRH),
    ...[12, 52].map(x => B(x, 27.6, 0, 5, 4, 8, SK.chromeD, MT)),
    B(32, 30.6, 0, 46, 1.4, 14, SK.red, GL), ...[9, 55].map(x => C(x, 30.6, 0, 7, 1.4, SK.red, { m: 'gloss', seg: 14 })),
    B(26, 33.2, 2, 9, 2.4, 6, SK.iron, GL), B(26, 35, 2, 5, 1.2, 2, SK.black, GL), ...[23, 29].map(x => RD([x, 34.4, 2], [x, 36, 2], 0.4, SK.black, PL)),
    B(40, 32.2, 3, 5, 1.8, 2.4, SK.wax, GL),
    B(16, 8, 2, 8, 2, 4, SK.chromeL, MT), B(30, 8.4, 0, 10, 2.8, 4, SK.pineDD, WD), B(30, 10.2, 0, 10, 1, 4, SK.black, PL), B(46, 8, 3, 6, 2, 2.4, SK.yellow, GL),
  ]),

  // a chrome helmet locker with a red door: vents at its top and a handle, a white helmet with orange goggles on top
  // and a black one beside (a tap opens it)
  piece('skllocker', 'Ski lodge helmet locker', 1, 1, 800, 'metal', [
    B(16, 26, -1, 28, 50, 26, SK.chromeD, MT), B(16, 51.4, -1, 29, 1, 27, SK.chrome, MT),
    S(10, 53, 0, 5.4, 4.6, 5.6, SK.white, { m: 'gloss', seg: 12 }), B(10, 53.4, 5.2, 8.4, 2.4, 1, SK.lens, GL), RG(10, 53.4, 0, 5.6, 0.4, SK.black, { m: 'plain', flat: true }),
    S(23, 52.6, -2, 4.6, 4, 4.8, SK.black, { m: 'gloss', seg: 12 }),
  ], {
    doors: [{ hinge: [3, 13], side: 1, parts: [
      B(16, 26, 12.6, 26, 46, 1.2, SK.red, GL),
      ...[42, 44.4, 46.8].map(h => B(16, h, 13.3, 14, 0.8, 0.3, SK.redD, PL)),
      B(26, 26, 13.6, 1.4, 6, 0.8, SK.chromeL, MT),
      B(16, 34, 13.3, 8, 3, 0.2, SK.white, PL),
    ] }],
    inside: { x: 16, h: 26, w: 24, hh: 44, z: 12.05 },
  }),

  // a pine snowboard rack: three boards stood in its slots, blue, green and red, each striped down its deck
  piece('sklboardrack', 'Ski lodge snowboard rack', 1, 1, 700, 'wood', [
    B(16, 3, 0, 30, 6, 24, SK.pineD, WD),
    ...[2, 30].map(x => B(x, 23, -8, 3, 40, 3, SK.pine, GR)), B(16, 41.5, -8, 30, 3, 3, SK.pine, WD),
    ...board(8, 6, 46, -5, SK.blue), ...board(16, 6, 42, 0, SK.fir, SK.yellow), ...board(24, 6, 44, 5, SK.red),
    B(16, 9, 9, 30, 3, 2, SK.pine, WD),
  ]),

  // boot cubbies: a pine set of nine, ski boots below, bobble hats in the middle row and folded sweaters up top
  piece('sklcubbies', 'Ski lodge boot cubbies', 2, 1, 900, 'wood', [
    B(32, 20, -11, 62, 38, 1.6, SK.pineD, WD),
    ...[2, 62].map(x => B(x, 20, 0, 3, 40, 24, SK.pine, GR)),
    ...[1, 13.5, 26.5, 39].map(h => B(32, h, 0, 62, 2, 24, SK.pine, WD)),
    ...[22, 42].map(x => B(x, 20, 0, 2, 38, 24, SK.pine, WD)),
    ...[[12, SK.red], [32, SK.blue], [52, SK.black]].flatMap(([x, c]) => [...boot(x - 3.6, 2, -2, c), ...boot(x + 3.6, 2, -2, c)]),
    ...[[12, SK.red], [32, SK.fir], [52, SK.white]].flatMap(([x, c]) => hat(x, 14.5, 0, c)),
    ...[[12, SK.fir, SK.white], [32, SK.red, SK.white], [52, SK.white, SK.red]].flatMap(([x, c, k]) => [B(x, 29.6, 1, 15, 4, 14, c, KN(k)), B(x, 33.6, 1, 14, 4, 13, k, KN(c))]),
  ]),

  // the trail map of Lapras Peak behind glass in a pine frame, lit from the lamp bar over it (a tap switches it)
  wallPiece('sklmap', 'Ski lodge Lapras Peak trail map', 2, 1100, 'wood', [
    B(32, 60, 0.8, 62, 40, 1.6, SK.pineD, GR),
    B(32, 60, 1.8, 58, 36, 0.4, SK.glowW, { m: 'glow' }),
    PC(32, 60, 2.1, 57, 35, trailMap),
    ...[14, 50].map(x => RD([x, 80, 1], [x, 82, 3.6], 0.4, SK.chromeD, MT)), B(32, 82, 3.6, 44, 1.6, 3, SK.chromeD, MT),
  ], { glow: [SK.glowW] }),

  // the big picture window on the peaks: a pine frame and mullions, a knit valance and a deep sill
  wallPiece('sklwindow', 'Ski lodge picture window', 2, 1200, 'wood', [
    B(32, 58, 0.6, 62, 48, 1.2, SK.pine, GR),
    PC(32, 58, 1.3, 56, 42, peaks),
    ...[22.7, 41.3].map(x => B(x, 58, 1.8, 1.6, 42, 1, SK.pineL, WD)), B(32, 58, 1.8, 56, 1.4, 1, SK.pineL, WD),
    B(32, 33, 3, 64, 2, 6, SK.pineL, WD),
    B(32, 80.6, 2.4, 62, 5, 2, SK.red, KN(SK.white, { r: 1 })),
  ]),

  // a pair of old wooden skis crossed on the wall with their leather straps, bamboo poles crossed behind them and a
  // red plaque where they meet
  wallPiece('sklskis', 'Ski lodge crossed vintage skis', 1, 450, 'wood', [
    RD([6, 42, 0.6], [26, 86, 0.6], 0.5, SK.pineL, WD), RD([26, 42, 0.6], [6, 86, 0.6], 0.5, SK.pineL, WD),
    ...[[7, 44], [25, 44]].map(([x, h]) => RG(x, h, 0.6, 1.6, 0.3, SK.blackL, { m: 'plain', flat: true })),
    PR(0, 0, 1.6, strip(8, 40, 24, 88, 3.4), 1, SK.pineD, GR), PR(0, 0, 2.4, strip(24, 40, 8, 88, 3.4), 1, SK.pineD, GR),
    DS(24, 88.6, 1.6, 1.8, 1, SK.pineD, { m: 'wood', seg: 8 }), DS(8, 88.6, 2.4, 1.8, 1, SK.pineD, { m: 'wood', seg: 8 }),
    ...[[11.4, 50], [20.6, 50]].map(([x, h]) => B(x, h, 3, 4.4, 2, 0.6, SK.cocoa, PL)),
    DS(16, 64, 3.4, 4, 1, SK.red, { m: 'gloss', seg: 14 }), DS(16, 64, 4, 2.4, 0.4, SK.white, { m: 'plain', seg: 12 }),
  ]),

  // the knit rug: red, a white band of snowflakes and diamonds round a field of stitches, a big snowflake at its heart
  { id: 'sklrug', name: 'Ski lodge Nordic knit rug', group: GROUP, solo: true, w: 2, h: 2, layer: 'rug', price: 800, high: 0.03, side: 'c', flat() {
    const g = ctx(), path = () => { g.beginPath(); RUG.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
    g.fillStyle = SK.red; path(); g.fill();
    g.save(); path(); g.clip();
    g.strokeStyle = SK.redD; g.lineWidth = 0.35;
    for (let y = 4; y < 62; y += 1.6) { g.beginPath(); for (let x = 2; x < 62; x += 1.6) { g.moveTo(x, y); g.lineTo(x + 0.8, y + 0.9); g.lineTo(x + 1.6, y); } g.stroke(); }
    g.fillStyle = SK.white;
    for (const d of [8, 14]) { g.fillRect(d, d, 64 - 2 * d, 0.9); g.fillRect(d, 64 - d - 0.9, 64 - 2 * d, 0.9); g.fillRect(d, d, 0.9, 64 - 2 * d); g.fillRect(64 - d - 0.9, d, 0.9, 64 - 2 * d); }
    const dia = (cx, cy, r) => shape(g, [[cx, cy - r], [cx + r, cy], [cx, cy + r], [cx - r, cy]]);
    for (let t = 13; t <= 51; t += 4) { dia(t, 11.4, 1.4); dia(t, 52.6, 1.4); dia(11.4, t, 1.4); dia(52.6, t, 1.4); }
    g.strokeStyle = SK.white; g.lineWidth = 1.2; g.lineCap = 'round';
    for (let k = 0; k < 6; k++) {
      const a = k / 6 * TAU, ex = 32 + Math.cos(a) * 11, ey = 32 + Math.sin(a) * 11;
      g.beginPath(); g.moveTo(32, 32); g.lineTo(ex, ey); g.stroke();
      for (const s of [-1, 1]) { const mx = 32 + Math.cos(a) * 6.6, my = 32 + Math.sin(a) * 6.6; g.beginPath(); g.moveTo(mx, my); g.lineTo(mx + Math.cos(a + s * 0.8) * 3.4, my + Math.sin(a + s * 0.8) * 3.4); g.stroke(); }
    }
    for (const [cx, cy] of [[6, 6], [58, 6], [6, 58], [58, 58]]) dia(cx, cy, 2);
    g.restore();
    g.strokeStyle = SK.white; g.lineWidth = 1; path(); g.stroke();
  } },

  // a Swinub snowmobile parked for photos, side-on: the furry brown nose cone with Swinub's pink snout and stripes, a
  // red body and windscreen, the black seat, its skis out front and the track behind (a tap revs it)
  piece('sklsnowmobile', 'Ski lodge Swinub snowmobile', 2, 1, 1400, 'gloss', [
    ...[-8, 8].flatMap(z => [B(15, 1, z, 22, 1.6, 3, SK.black, GL), RD([4, 1, z], [2, 4.4, z], 0.8, SK.black, GL), RD([16, 2, z], [19, 9, z * 0.6], 0.7, SK.chromeD, MT)]),
    B(45, 6, 0, 30, 10, 14, SK.black, { m: 'gloss', r: 4 }),
    ...[34, 45, 56].map(x => DS(x, 6, 7.4, 3.4, 0.6, SK.chromeD, { m: 'metal', seg: 12 })),
    S(16, 15, 0, 12, 8, 10, SK.swinub, { m: 'cloth', seg: 14 }),
    ...[11, 15, 19].map(x => S(x, 18, 7, 0.9, 4, 1, SK.swinubD, { m: 'cloth', seg: 6 })),
    S(4.6, 13, 0, 1.8, 2.8, 3.6, SK.snout, { m: 'gloss', seg: 10 }), ...[-1.4, 1.4].map(z => S(3.2, 13, z, 0.4, 0.8, 0.6, SK.swinubD, { m: 'plain', seg: 6 })),
    B(39, 15, 0, 22, 10, 16, SK.red, GL),
    PR(26, 20, 0, [[0, 0], [5, 0], [2, 8], [0, 7]], 14, '#cfe8f4', { m: 'glass' }),
    RD([31, 20, 0], [31, 25, 0], 0.6, SK.chromeD, MT), RD([31, 25, -8], [31, 25, 8], 0.7, SK.chromeD, MT),
    B(46, 21.6, 0, 22, 4, 14, SK.black, VL(1.6)),
    DS(59.6, 14, 6, 1.4, 0.6, SK.lamp, { m: 'glow', seg: 8 }), B(60, 14, 0, 2, 4, 14, SK.redD, GL),
  ], { glow: [SK.lamp] }),

  // Delibird the lodge's mascot in a red bobble hat and a fir-green scarf, its white sack of a tail behind, holding out
  // the WELCOME board (a tap wobbles it)
  piece('skldelibird', 'Ski lodge Delibird mascot', 1, 1, 1100, 'cloth', [
    B(16, 1, 0, 24, 2, 20, SK.pineD, WD),
    ...[12, 20].map(x => S(x, 3, 3, 2.4, 1.4, 3, SK.beak, { m: 'gloss', seg: 8 })),
    S(16, 13, -9, 6.4, 7, 5, SK.deliW, { m: 'cloth', seg: 12 }),
    S(16, 14, 0, 8.6, 10, 8, SK.deli, { m: 'cloth', seg: 14 }),
    S(16, 13, 5.4, 5.8, 7, 3.4, SK.deliW, { m: 'cloth', seg: 12 }),
    C(16, 23.4, 0, 6.6, 2.6, SK.fir, { m: 'cloth', seg: 12 }), RD([19, 23, 6], [21, 16, 8], 1, SK.fir, CL),
    S(16, 29.6, 0, 7, 6.4, 6.4, SK.deli, { m: 'cloth', seg: 14 }),
    ...[12.4, 19.6].map(x => S(x, 31, 4.6, 2.6, 1.8, 1.6, SK.deliW, { m: 'cloth', seg: 8 })),
    ...[13.6, 18.4].map(x => DS(x, 31, 6.2, 0.7, 0.4, SK.black, { m: 'gloss', seg: 8 })),
    S(16, 28, 6.6, 1.6, 1.2, 1.8, SK.beak, { m: 'gloss', seg: 8 }),
    ...hat(16, 34, 0, SK.red, 6),
    RD([8, 16, 2], [5, 14, 6], 1.6, SK.deli, CL), RD([24, 16, 2], [26, 14, 6], 1.6, SK.deli, CL),
    B(16, 12, 8.6, 22, 7, 1, SK.pine, WD), PC(16, 12, 9.15, 21, 6.4, word('WELCOME', SK.red, SK.pineL, 0.6)),
  ]),

  // Cubchoo on a red knit floor cushion, a mug of cocoa in both paws, its blue muzzle, ears and the drip at its nose
  // (a tap steams the mug)
  piece('sklcubchoo', 'Ski lodge Cubchoo cocoa break', 1, 1, 1000, 'cloth', [
    C(16, 2.4, 0, 13, 4.8, SK.red, { m: 'cloth', tex: 'knit', kc: SK.white, seg: 16 }),
    ...[11, 21].map(x => S(x, 6.4, 5, 2.4, 1.8, 2.6, SK.cub, { m: 'cloth', seg: 8 })),
    S(16, 12, 0, 7.4, 7, 6.6, SK.cub, { m: 'cloth', seg: 14 }),
    S(16, 23, 0, 7.4, 6.6, 6.4, SK.cub, { m: 'cloth', seg: 14 }),
    S(16, 20.6, 4.6, 5, 2.8, 2.2, SK.cubB, { m: 'cloth', seg: 10 }),
    ...[10, 22].flatMap(x => [S(x, 29, -1, 2.4, 2.4, 1.6, SK.cub, { m: 'cloth', seg: 8 }), DS(x, 29, 0.6, 1.4, 0.2, SK.cubB, { m: 'plain', seg: 8 })]),
    ...[13.4, 18.6].map(x => DS(x, 24.6, 6, 0.7, 0.4, SK.black, { m: 'gloss', seg: 8 })),
    S(16, 22.4, 6.8, 1, 0.7, 0.6, SK.black, { m: 'gloss', seg: 6 }), S(17.6, 19.6, 6.6, 0.6, 1.4, 0.6, SK.snot, { m: 'gloss', seg: 6 }),
    ...mug(16, 10, 8.4, SK.red), S(16, 15.2, 8.4, 1, 0.6, 1, SK.marsh, { m: 'cloth', seg: 6 }),
    ...[12.6, 19.4].map(x => S(x, 12, 7.6, 1.8, 1.8, 1.6, SK.cub, { m: 'cloth', seg: 8 })),
  ]),

  // a ski patrol rescue sled: a red toboggan hull lettered SKI PATROL with a white cross, steel runners and handles, a
  // fir-green blanket folded in it and the first-aid kit (a tap rocks it)
  piece('sklpatrol', 'Ski lodge ski patrol sled', 2, 1, 850, 'gloss', [
    ...[-9, 9].map(z => B(32, 0.8, z, 54, 1.6, 2, SK.chromeD, MT)),
    PR(32, 0, 0, [[-27, 1.6], [25, 1.6], [28, 4], [28, 10], [-26, 10], [-29, 6]], 22, SK.red, GL),
    B(32, 10.4, 0, 56, 1, 23, SK.white, PL),
    PC(20, 6, 11.05, 22, 5, word('SKI PATROL', SK.white, null)),
    B(46, 6, 11.2, 7, 2.4, 0.4, SK.white, PL), B(46, 6, 11.2, 2.4, 7, 0.4, SK.white, PL),
    ...[-8, 8].flatMap(z => [RD([3, 10, z], [0.8, 16, z], 0.6, SK.chromeD, MT), RD([61, 10, z], [63.2, 16, z], 0.6, SK.chromeD, MT)]),
    RD([0.8, 16, -8], [0.8, 16, 8], 0.7, SK.chromeD, MT), RD([63.2, 16, -8], [63.2, 16, 8], 0.7, SK.chromeD, MT),
    B(26, 12.6, 0, 28, 3.4, 20, SK.fir, KN()),
    B(48, 14, 0, 12, 6, 10, SK.white, GL), B(48, 14, 5.2, 4.4, 1.4, 0.4, SK.red, PL), B(48, 14, 5.2, 1.4, 4.4, 0.4, SK.red, PL), B(48, 17.6, 0, 4, 1.2, 1.2, SK.black, GL),
  ]),

  // a pine trail sign post stood in a drift: arrows to the Bunny Hill, Lapras Run and the Summit, each with its mark,
  // a red cap on the post
  piece('sklsignpost', 'Ski lodge trail sign post', 1, 1, 450, 'wood', [
    LA(16, 0, 0, [[11, 0], [9, 1.8], [5, 3.4], [0, 4]], SK.snow, { m: 'cloth', seg: 14 }),
    C(16, 25, 0, 1.8, 50, SK.pineD, { m: 'wood', seg: 8 }), LA(16, 50, 0, [[2.4, 0], [2.4, 1], [0, 3]], SK.red, { m: 'gloss', seg: 8 }),
    PR(16, 44, 1.4, [[-12, -3], [8, -3], [13, 0], [8, 3], [-12, 3]], 1.4, SK.pine, GR), PC(15, 44, 2.15, 18, 5, signBoard('SUMMIT', 'diamond')),
    PR(16, 36, -1.4, [[-13, 0], [-8, -3], [12, -3], [12, 3], [-8, 3]], 1.4, SK.pine, GR), PC(17.4, 36, -0.65, 18, 5, signBoard('LAPRAS', 'square')),
    PR(16, 28, 1.4, [[-12, -3], [8, -3], [13, 0], [8, 3], [-12, 3]], 1.4, SK.pine, GR), PC(15, 28, 2.15, 18, 5, signBoard('BUNNY', 'circle')),
    S(16, 47.6, 1, 2.6, 0.8, 2, SK.snow, { m: 'cloth', seg: 8 }),
  ]),

  // a floor lamp on a pine round: a chrome pole and a cream knit shade with a red snowflake band, lit (a tap switches it)
  piece('skllamp', 'Ski lodge knit-shade floor lamp', 1, 1, 600, 'wood', [
    C(16, 1.5, 0, 7, 3, SK.pineD, { m: 'wood', tex: 'grain', seg: 14 }),
    C(16, 22, 0, 0.8, 38, SK.chromeD, { m: 'metal', seg: 8 }),
    C(16, 47, 0, 7, 14, SK.glowW, { m: 'glow', tex: 'knit', kc: SK.red, rb: 9, seg: 16 }),
    C(16, 54.2, 0, 7.2, 0.6, SK.red, { m: 'cloth', seg: 16 }), C(16, 39.8, 0, 9.2, 0.6, SK.red, { m: 'cloth', seg: 16 }),
  ], { glow: [SK.glowW] }),
];
