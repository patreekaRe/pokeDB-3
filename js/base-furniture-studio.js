/* base-furniture-studio.js  -  the Recording studio set (furniture expansion session k, 2026-10-17): a whole room of a
   professional recording studio, as Animal Crossing's Happy Home Paradise does a room type. Charcoal acoustic foam,
   walnut wood and oxblood leather, warm amber VU meters that glow, a red RECORDING / ON AIR light: the mixing console,
   a reel-to-reel tape machine (it whirrs), a rack of outboard gear with lit knobs, a synthesizer on its stand, a
   condenser mic, monitors on stands, a glass-fronted vocal booth, a gobo, foam and a skyline diffuser on the walls.
   Jigglypuff singing in the vocal booth in its headphones, Loudred sat on the subwoofer, Kricketune perched on the
   upright bass and Toxtricity on the gold record's plaque for the Pokémon touches. All solo, fixed colours, sold all year.
   An upright piece is a list of parts in painted units (32 a tile), as in js/base-furniture-ramen.js: `x` across from
   the left of its front, `h` up from the floor (a wall piece's from the foot of its strip), `z` out to the front from
   its middle (a wall piece's from the wall). They're painted here from any side, and js/base-models-studio.js builds the
   same list as 3D parts (BUILT), so picture and model agree. `ax: 'x'` stands a disc or ring side-on (the cable reel's
   flanges, the pop filter, the headphones' cups). A `wedge` is a side profile ([z, up] points) extruded `w` across (the
   console's and the synth's sloped panels). `tex` is painted only (the model stays plain colour): `grain` walnut's
   streaks (`pd: 'h'` for boards laid across), `foam` acoustic foam's wedges, `grille` speaker cloth, `tuft` buttoned
   leather. A `pic` part (the VU meters, the signs, the plaque, the setlist, the stencils) is painted on the front only,
   and the model wears that crop of the painting. The rug is painted from above (RUG). */

import { sh, oval, ovalShade, floorShadow, ctx, glass as glassPane } from './base-paint.js';

export const SD = {
  foam: '#34353a', foamL: '#4a4c52', foamD: '#222327', wine: '#5c2630',
  wal: '#6a4126', walL: '#8c5a36', walD: '#43281a', walK: '#2a180f',
  black: '#1a1a1c', blackL: '#303035', steel: '#a6adb2', steelL: '#d0d5d8', steelD: '#6c7378',
  amber: '#ffb43a', vu: '#ffd27a', red: '#c42a20', redD: '#7a1812', glowR: '#ff4436',
  cream: '#efe6d2', paper: '#f4f0e4', gold: '#e2b440', goldL: '#f6dc84', goldD: '#a87c1e',
  leather: '#6e2c22', leatherL: '#8a3c2c', leatherD: '#4a1c16', key: '#f4f0e6', keyK: '#1e1e22',
  tape: '#5a3a22', coffee: '#3a2014', mug: '#e8e2d4', pine: '#c8a472', pineD: '#9a7a4c', cable: '#26262a',
  bass: '#9a5222', bassL: '#c27a3a', bassD: '#5e2e12', string: '#e4d8b0',
  sunburst: '#d8862a', sunD: '#6a2a12', strat: '#b8241c', ivory: '#ece4d0',
  jig: '#f7b4c8', jigD: '#d884a2', jigEye: '#3c8cc8', jigM: '#a83850',
  loud: '#6a72c8', loudL: '#9aa2e4', loudD: '#3e449a', loudY: '#f2d048', loudM: '#c03a50',
  krick: '#c03a2a', krickK: '#2a2224', krickY: '#ead27a',
  tox: '#6a4c9c', toxL: '#d8cce8', toxY: '#f2d64a', toxR: '#d0405a',
};
const GROUP = 'Recording studio';
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
const WG = (x, h, z, w, pts, c, o) => ({ t: 'wedge', x, h, z, w, pts, c, ...o });
const PC = (x, h, z, w, hh, fn, o) => ({ t: 'pic', x, h, z, w, hh, fn, ...o });

const CL = { m: 'cloth' }, PL = { m: 'plain' }, GL = { m: 'gloss' }, WD = { m: 'wood' }, MT = { m: 'metal' }, GW = { m: 'glow' };
const GR = { m: 'wood', tex: 'grain' }, GRH = { m: 'wood', tex: 'grain', pd: 'h' }, FM = { m: 'cloth', tex: 'foam' };
const sq = (o) => ({ r: 0.05, ...o });

/* ---------- painting the parts ---------- */

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
      const v = ((i * 37 + seed * 11) % 17) / 17, a = l0 + v * (l1 - l0) * 0.5, l = (l1 - l0) * (0.3 + ((i * 53 + seed) % 13) / 13 * 0.6);
      g.globalAlpha = 0.35; g.strokeStyle = i % 2 ? sh(c, -2) : sh(c, 1);
      g.beginPath();
      if (across) { g.moveTo(a, w); g.bezierCurveTo(a + l * 0.3, w + 0.3, a + l * 0.6, w - 0.3, a + l, w); } else { g.moveTo(w, a); g.bezierCurveTo(w + 0.3, a + l * 0.3, w - 0.3, a + l * 0.6, w, a + l); }
      g.stroke();
    }
  } else if (q.tex === 'foam') {
    const s = 2.4;
    for (let y = y0, j = 0; y < y1; y += s, j++) for (let x = x0, i = 0; x < x1; x += s, i++) {
      const up = (i + j) % 2;
      g.globalAlpha = 0.55; g.fillStyle = sh(c, 1);
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + s, y); g.lineTo(up ? x : x + s, y + s); g.closePath(); g.fill();
      g.globalAlpha = 0.5; g.fillStyle = sh(c, -2);
      g.beginPath(); g.moveTo(x, y + s); g.lineTo(x + s, y + s); g.lineTo(up ? x + s : x, y); g.closePath(); g.fill();
    }
  } else if (q.tex === 'grille') {
    g.globalAlpha = 0.45; g.fillStyle = sh(c, 2);
    for (let y = y0 + 0.5; y < y1; y += 1) for (let x = x0 + 0.5 + (Math.round(y) % 2) * 0.5; x < x1; x += 1) g.fillRect(x, y, 0.3, 0.3);
  } else if (q.tex === 'tuft') {
    g.lineWidth = 0.3; g.strokeStyle = sh(c, -2); g.globalAlpha = 0.6; g.beginPath();
    for (let d = -(y1 - y0); d < x1 - x0; d += 4) { g.moveTo(x0 + d, y0); g.lineTo(x0 + d + (y1 - y0), y1); g.moveTo(x0 + d, y1); g.lineTo(x0 + d + (y1 - y0), y0); }
    g.stroke();
    g.globalAlpha = 0.8; g.fillStyle = sh(c, -3);
    for (let y = y0 + 2, j = 0; y < y1; y += 2, j++) for (let x = x0 + (j % 2 ? 2 : 0); x < x1; x += 4) { g.beginPath(); g.arc(x, y, 0.35, 0, TAU); g.fill(); }
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
    const m = q.m || 'gloss', cx = U(q.x, q.z), cy = b - q.h, edge = q.ax === 'x' ? !side : side;
    switch (q.t) {
      case 'box': {
        const w = side ? q.d : q.w; rbx(cx - w / 2, cy - q.hh / 2, w, q.hh, q.r, q.c, m);
        if (q.tex) { const p = new Path2D(); p.roundRect(cx - w / 2, cy - q.hh / 2, w, q.hh, Math.min(q.r, w / 2, q.hh / 2)); texture(q, p, [cx - w / 2, cy - q.hh / 2, cx + w / 2, cy + q.hh / 2]); }
        break;
      }
      case 'wedge': {
        const ups = q.pts.map(p => p[1]), top = Math.max(...ups), bot = Math.min(...ups);
        if (!side) { rbx(cx - q.w / 2, cy - top, q.w, top - bot, 0.3, q.c, m); break; }
        poly(q.pts.map(([pz, up]) => [U(q.x, q.z + pz), cy - up]), q.c, m);
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
        if (q.tex) { const p = new Path2D(); p.ellipse(cx, cy, rx, q.ry, 0, 0, TAU); texture(q, p, [cx - rx, cy - q.ry, cx + rx, cy + q.ry]); }
        break;
      }
      case 'disc': if (edge) rbx(cx - q.th / 2, cy - (q.ry ?? q.r), q.th, (q.ry ?? q.r) * 2, q.th / 2, q.c, m); else {
        ball(cx, cy, q.r, q.ry ?? q.r, q.c, m);
        if (q.tex) { const p = new Path2D(); p.ellipse(cx, cy, q.r, q.ry ?? q.r, 0, 0, TAU); texture(q, p, [cx - q.r, cy - q.r, cx + q.r, cy + q.r]); }
      } break;
      case 'lathe': {
        const P = (dx, up) => [cx + flip * dx, cy - up];
        const pts = [...q.pts.map(([r, up]) => P(-r, up)), ...q.pts.slice().reverse().map(([r, up]) => P(r, up))];
        poly(pts, q.c, m, m !== 'glow');
        if (q.pts[q.pts.length - 1][0] < 0.01 && q.pts.length > 2) break;
        const [rt, ut] = q.pts[q.pts.length - 1];
        if (m !== 'glass') oval(cx, cy - ut, rt, rt * 0.22, sh(q.c, -2));
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
        g.lineCap = 'round'; g.strokeStyle = q.c; g.lineWidth = q.r * 2;
        g.beginPath(); g.moveTo(...p0); g.lineTo(...p1); g.stroke();
        if (q.r > 0.6 && m !== 'plain') {
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

/** A VU meter's lit face: a warm amber card, its arc of marks turning red past 0, VU under it and the needle at `at`
    (0 to 1 across the scale). */
const vu = (at) => (g, x, y, w, h) => {
  g.fillStyle = SD.vu; g.fillRect(x, y, w, h);
  const cx = x + w / 2, cy = y + h * 1.05, r = h * 0.82;
  g.lineWidth = Math.max(0.25, h * 0.06);
  for (const [a0, a1, c] of [[-2.35, -1.25, SD.black], [-1.25, -0.8, SD.red]]) { g.strokeStyle = c; g.beginPath(); g.arc(cx, cy, r, a0, a1); g.stroke(); }
  g.lineWidth = Math.max(0.2, h * 0.04); g.strokeStyle = SD.black;
  for (let i = 0; i <= 6; i++) { const a = -2.35 + i * 0.26; g.beginPath(); g.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); g.lineTo(cx + Math.cos(a) * r * 0.86, cy + Math.sin(a) * r * 0.86); g.stroke(); }
  g.fillStyle = SD.black; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `bold ${h * 0.24}px ${SANS}`;
  g.fillText('VU', cx, y + h * 0.66, w * 0.5);
  const a = -2.25 + at * 1.4;
  g.strokeStyle = SD.black; g.lineWidth = Math.max(0.2, h * 0.04); g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * r * 1.02, cy + Math.sin(a) * r * 1.02); g.stroke();
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x, y, w, h * 0.08);
};

/** The gold record's plaque: Toxtricity (Amped) beside GOLD and its line of small print. */
function plaque(g, x, y, w, h) {
  g.fillStyle = SD.black; g.fillRect(x, y, w, h);
  g.fillStyle = SD.goldD; g.fillRect(x + 0.4, y + 0.4, w - 0.8, h - 0.8);
  g.fillStyle = SD.black; g.fillRect(x + 0.8, y + 0.8, w - 1.6, h - 1.6);
  const s = h - 2, px = x + 1 + s / 2, py = y + 1 + s / 2;
  g.fillStyle = SD.tox; g.beginPath(); g.arc(px, py, s * 0.48, 0, TAU); g.fill();
  g.save(); g.beginPath(); g.arc(px, py, s * 0.48, 0, TAU); g.clip();
  g.fillStyle = SD.tox; g.fillRect(px - s * 0.22, py + s * 0.1, s * 0.44, s * 0.4);
  g.fillStyle = SD.toxY;
  for (const dx of [-0.16, 0, 0.16]) { g.beginPath(); g.moveTo(px + s * (dx - 0.05), py + s * 0.5); g.lineTo(px + s * dx, py + s * 0.22); g.lineTo(px + s * (dx + 0.05), py + s * 0.5); g.fill(); }
  g.restore();
  g.fillStyle = SD.toxL; g.beginPath(); g.ellipse(px, py - s * 0.02, s * 0.2, s * 0.22, 0, 0, TAU); g.fill();
  g.fillStyle = SD.toxY;
  for (const [dx, up] of [[-0.12, 0.3], [-0.04, 0.42], [0.05, 0.4], [0.13, 0.28]]) { g.beginPath(); g.moveTo(px + s * (dx - 0.07), py - s * 0.16); g.lineTo(px + s * dx, py - s * up - s * 0.06); g.lineTo(px + s * (dx + 0.07), py - s * 0.16); g.fill(); }
  g.fillStyle = SD.toxR;
  for (const sgn of [-1, 1]) { g.beginPath(); g.ellipse(px + sgn * s * 0.08, py - s * 0.03, s * 0.045, s * 0.035, 0, 0, TAU); g.fill(); }
  g.strokeStyle = SD.black; g.lineWidth = s * 0.03; g.beginPath(); g.moveTo(px - s * 0.06, py + s * 0.1); g.lineTo(px + s * 0.07, py + s * 0.08); g.stroke();
  const tx = x + s + 2, tw = w - s - 3;
  g.fillStyle = SD.gold; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `bold ${h * 0.36}px ${SANS}`; g.fillText('GOLD', tx + tw / 2, y + h * 0.36, tw);
  g.fillStyle = SD.goldL; g.font = `bold ${h * 0.16}px ${SANS}`; g.fillText('TOXTRICITY', tx + tw / 2, y + h * 0.62, tw);
  g.fillText('1,000,000', tx + tw / 2, y + h * 0.8, tw);
}

/** A setlist taped to its stand: SETLIST in red, the songs as ink lines, one struck out. */
function setlist(g, x, y, w, h) {
  g.fillStyle = SD.paper; g.fillRect(x, y, w, h);
  g.fillStyle = SD.red; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `bold ${h * 0.14}px ${SANS}`;
  g.fillText('SETLIST', x + w / 2, y + h * 0.12, w * 0.9);
  g.fillStyle = SD.black;
  for (let i = 0; i < 6; i++) g.fillRect(x + w * 0.12, y + h * (0.28 + i * 0.12), w * (0.5 + ((i * 7) % 5) * 0.08), Math.max(0.3, h * 0.035));
  g.fillStyle = SD.red; g.fillRect(x + w * 0.08, y + h * 0.53, w * 0.8, Math.max(0.3, h * 0.03));
}

/* ---------- the kinds ---------- */

/** What js/base-models-studio.js builds for each upright and wall kind: its parts, doors and default material. */
export const BUILT = {};
/** The rug's outline from above, in painted units across its 3 x 2 tiles, corners cut. */
export const RUG = [[5, 3], [91, 3], [93, 5], [93, 59], [91, 61], [5, 61], [3, 59], [3, 5]];

function piece(id, name, w, h, price, mat, parts, { doors = [], inside, ...rest } = {}) {
  BUILT[id] = { parts, doors, inside, mat };
  const all = [...parts, ...doors.flatMap(d => d.parts)];
  return { id, name, group: GROUP, solo: true, w, h, price, ...rest, draw(x, b, vw, dir) { floorShadow(x, b, vw); paintParts(all, x, b, vw, dir, w * 32); } };
}
function wallPiece(id, name, w, price, mat, parts, rest = {}) {
  BUILT[id] = { parts, doors: [], mat };
  return { id, name, group: GROUP, solo: true, w, h: 1, layer: 'wall', price, ...rest, wall(x) { paintParts(parts, x, 96, w * 32, 0, w * 32); } };
}

const foot4 = (xs, zs, s, hh, c = SD.walD, o = WD) => xs.flatMap(x => zs.map(z => B(x, hh / 2, z, s, hh, s, c, o)));
/** A slope's height at z over a wedge from front zf (height uf) to back zb (height ub). */
const slope = (z, zf, uf, zb, ub) => uf + (zf - z) / (zf - zb) * (ub - uf);
/** An electric guitar's body outline about its middle, from its foot up (a double cutaway at the top). */
const BODY = [[-6, 0], [6, 0], [8, 2], [8.4, 6], [7, 9], [7.6, 13], [6, 16], [3.4, 15], [2, 12.6], [-2, 12.6], [-4, 15.4], [-7, 17], [-8, 13], [-7.4, 9], [-8.6, 6], [-8, 2]];
const scale = (pts, k) => pts.map(([a, c]) => [a * k, c * k]);
/** A guitar hung by its head from a hook at x, its body's foot at h, standing out z from the wall. */
const hungGuitar = (x, h, z, body, guard) => [
  PR(x, h, z, BODY, 2.6, body, GL), PR(x, h + 1.4, z + 1.45, scale(BODY, 0.62).map(([a, c]) => [a - 0.6, c]), 0.3, guard, PL),
  ...[5, 9].map(hh => B(x, h + hh, z + 1.7, 5, 1.2, 0.4, SD.black, sq(PL))),
  B(x, h + 2.4, z + 1.6, 4, 1, 0.5, SD.steelL, sq(MT)),
  ...[[4.6, 3], [5.6, 5.4]].map(([dx, hh]) => DS(x + dx, h + hh, z + 1.6, 0.7, 0.6, SD.cream, { m: 'gloss', seg: 6 })),
  B(x, h + 21, z, 2.6, 17, 1.4, SD.walD, sq(WD)),
  ...[-0.6, 0, 0.6].map(dx => RD([x + dx, h + 2.4, z + 1.8], [x + dx, h + 29, z + 0.8], 0.12, SD.steelL, PL)),
  B(x, h + 31.6, z, 3.6, 5, 1.2, SD.black, GL),
];

export const STUDIO_KINDS = [
  // the mixing console: a walnut desk with a leather armrest, a sloped black surface of faders and knobs, a meter bridge
  // of glowing amber VU meters at the back and a talkback mic on its gooseneck
  piece('rcsconsole', 'Studio mixing console', 2, 1, 1500, 'wood', [
    B(32, 1.5, 0, 62, 3, 28, SD.walK, WD),
    B(32, 14, 0, 64, 22, 28, SD.wal, GR),
    B(32, 13, 14.2, 56, 14, 0.4, SD.walD, sq(WD)),
    B(32, 25, 13.2, 64, 3, 4.4, SD.leather, CL),
    WG(32, 25, 0, 62, [[11, 0], [11, 2], [-11, 9], [-11, 0]], SD.black, GL),
    ...Array.from({ length: 10 }, (_, i) => 7 + i * 5.4).flatMap((x, i) => [
      B(x, 25 + slope(7, 11, 2, -11, 9) + 0.6, 7, 0.4, 0.4, 6, SD.blackL, sq(PL)),
      B(x, 25 + slope(6 + (i * 3 % 5) * 0.8, 11, 2, -11, 9) + 1, 6 + (i * 3 % 5) * 0.8, 2.2, 1.6, 1.2, i === 9 ? SD.red : SD.steelL, sq(MT)),
      C(x, 25 + slope(-2, 11, 2, -11, 9) + 0.6, -2, 0.9, 1.2, i % 3 ? SD.cream : SD.amber, { m: 'gloss', seg: 6 }),
      C(x, 25 + slope(-7, 11, 2, -11, 9) + 0.6, -7, 0.8, 1.2, i % 2 ? SD.red : SD.steelL, { m: 'gloss', seg: 6 }),
    ]),
    B(32, 39.5, -12.6, 62, 13, 3.6, SD.walD, WD),
    ...[13, 25.5, 38.5, 51].flatMap((x, i) => [B(x, 40.5, -10.6, 10, 7.6, 0.4, SD.vu, GW), PC(x, 40.5, -10.3, 10, 7.6, vu([0.62, 0.7, 0.5, 0.85][i]))]),
    ...[19.25, 32, 44.75].map(x => DS(x, 40.5, -10.6, 0.6, 0.4, SD.glowR, { m: 'glow', seg: 6 })),
    RD([58, 34, -8], [58, 38, -7], 0.4, SD.steelD, MT), RD([58, 38, -7], [55, 42, -4], 0.4, SD.steelD, MT),
    C(54.6, 42.6, -3.6, 0.8, 2, SD.black, { m: 'gloss', seg: 8 }),
  ], { glow: [SD.vu, SD.glowR] }),

  // a reel-to-reel tape machine on its walnut cabinet: two steel reels wound with brown tape, the heads, a pair of VU
  // meters and the transport keys
  piece('rcstape', 'Studio reel-to-reel', 1, 1, 1100, 'metal', [
    ...foot4([5, 27], [-7, 7], 2.4, 3, SD.black, PL),
    B(16, 12, 0, 28, 18, 22, SD.wal, GR),
    B(16, 12, 11.2, 24, 14, 0.4, SD.walD, sq(WD)),
    B(16, 36, -2, 28, 30, 10, SD.steelD, MT),
    B(16, 36, 3.2, 26, 28, 0.4, SD.blackL, sq(GL)),
    ...[9, 23].flatMap(x => [
      DS(x, 44, 3.8, 6, 0.6, SD.steelL, { m: 'metal', seg: 18 }),
      DS(x, 44, 4.4, 4.4, 0.6, SD.tape, { m: 'plain', seg: 16 }),
      DS(x, 44, 5, 1.3, 0.6, SD.steelD, { m: 'metal', seg: 8 }),
    ]),
    RD([5, 42, 4.6], [13, 33.4, 4.6], 0.25, SD.tape, PL), RD([27, 42, 4.6], [19, 33.4, 4.6], 0.25, SD.tape, PL),
    RD([13, 33.4, 4.6], [19, 33.4, 4.6], 0.25, SD.tape, PL),
    B(16, 32, 4, 7, 3, 1.4, SD.black, sq(GL)), ...[13, 19].map(x => DS(x, 33.4, 4.2, 0.9, 1, SD.steelL, { m: 'metal', seg: 8 })),
    ...[10.5, 21.5].flatMap((x, i) => [B(x, 27, 3.6, 7, 4.2, 0.4, SD.vu, GW), PC(x, 27, 3.85, 7, 4.2, vu(0.55 + i * 0.2))]),
    ...[6, 10, 14, 18, 22, 26].map((x, i) => B(x, 23, 3.8, 3, 1.6, 1, i === 4 ? SD.red : SD.cream, sq(PL))),
  ], { glow: [SD.vu] }),

  // a walnut rack of outboard gear: six black units, compressors and reverbs, their knobs and lit amber and red lamps
  piece('rcsoutboard', 'Studio outboard rack', 1, 1, 950, 'wood', [
    B(16, 1.5, 0, 30, 3, 22, SD.walK, WD),
    ...[3, 29].map(x => B(x, 27, 0, 4, 48, 22, SD.wal, GR)),
    B(16, 52.2, 0, 30, 2.4, 22, SD.walD, WD),
    ...[7, 14.4, 21.8, 29.2, 36.6, 44].flatMap((h, i) => [
      B(16, h, -0.5, 22, 6.6, 20, i % 2 ? SD.blackL : SD.black, sq(GL)),
      ...[8.5, 12.5, 16.5].map((x, k) => DS(x, h, 9.9, 1.2, 1.2, (i + k) % 3 ? SD.cream : SD.steelL, { m: 'gloss', seg: 8 })),
      i === 2 ? B(22.5, h, 9.6, 6, 4, 0.4, SD.vu, GW) : DS(22.5, h, 9.6, 0.8, 0.4, i % 2 ? SD.glowR : SD.amber, { m: 'glow', seg: 6 }),
    ]),
    PC(22.5, 21.8, 9.85, 6, 4, vu(0.7)),
  ], { glow: [SD.vu, SD.amber, SD.glowR] }),

  // an analogue synthesizer with walnut cheeks on an X stand: its keys, two wheels, a sloped panel of knobs and a small
  // amber screen
  piece('rcssynth', 'Studio synthesizer stand', 2, 1, 1150, 'gloss', [
    ...[[8, 24], [40, 56]].flatMap(([a, c]) => [-5, 5].flatMap(z => [RD([a, 0.8, z], [c, 22, z], 0.8, SD.black, MT), RD([c, 0.8, z], [a, 22, z], 0.8, SD.black, MT)])),
    ...[8, 24, 40, 56].map(x => RD([x, 0.8, -6], [x, 0.8, 6], 0.8, SD.blackL, MT)),
    ...[16, 48].map(x => RD([x, 22.6, -7], [x, 22.6, 7], 0.8, SD.blackL, MT)),
    B(32, 25.6, 0, 58, 5, 18, SD.blackL, GL),
    ...[2, 62].map(x => B(x, 27, 0, 4, 8, 18, SD.wal, GR)),
    B(35, 28.8, 4.8, 50, 1.6, 7.6, SD.key, sq(PL)),
    ...Array.from({ length: 21 }, (_, i) => i).filter(i => [0, 1, 3, 4, 5].includes(i % 7) && i < 20).map(i => B(10 + (i + 1) * 2.38, 29.9, 3.2, 1.3, 1, 4.6, SD.keyK, sq(PL))),
    ...[5.4, 8.6].map(x => DS(x, 29, 4, 1.6, 1.2, SD.black, { ax: 'x', m: 'gloss', seg: 10 })),
    WG(32, 28, -5, 56, [[1, 0], [1, 1.5], [-8, 6], [-8, 0]], SD.black, GL),
    ...[0, 1].flatMap(row => Array.from({ length: 9 }, (_, i) => 8 + i * 6).filter(x => row || Math.abs(x - 32) > 4).map(x => C(x, 28 + slope(row ? -1 : -6, 1, 1.5, -8, 6) + 0.6, row ? -1 : -6, 0.9, 1.2, (x + row) % 4 ? SD.cream : SD.amber, { m: 'gloss', seg: 6 }))),
    B(32, 34, -6.6, 7, 2.6, 0.4, SD.amber, GW),
  ], { glow: [SD.amber] }),

  // a large condenser mic in its shock mount on a tripod boom stand, a round pop filter clamped in front
  piece('rcsmic', 'Studio condenser mic', 1, 1, 620, 'metal', [
    ...[[0, 6], [-5.2, -3], [5.2, -3]].map(([dx, dz]) => RD([16, 12, 0], [16 + dx * 1.6, 0.6, dz * 1.6], 0.8, SD.black, MT)),
    C(16, 24, 0, 1, 28, SD.blackL, { m: 'metal', seg: 8 }),
    C(16, 38.4, 0, 1.2, 1.6, SD.black, { m: 'metal', seg: 8 }),
    RD([16, 38.4, 0], [19, 42, 0], 0.5, SD.blackL, MT),
    RG(19, 46, 0, 3.4, 0.35, SD.steelD, { m: 'metal', ax: 'x' }),
    C(19, 45, 0, 2.2, 8, SD.steelL, { m: 'metal', seg: 12 }),
    S(19, 49.6, 0, 2.2, 2.6, 2.2, SD.gold, { m: 'metal', seg: 10, tex: 'grille' }),
    B(19, 46, 2.2, 1.6, 2, 0.4, SD.gold, sq(MT)),
    RD([16, 34, 0], [24, 40, 5], 0.3, SD.black, MT),
    RG(24, 46, 6, 4.6, 0.4, SD.black, { m: 'gloss' }),
  ]),

  // the vocal booth: walnut walls lined with foam behind a glass front, RECORDING lit on its roof, and Jigglypuff inside
  // in its headphones, singing into the mic
  piece('rcsbooth', 'Studio vocal booth', 2, 1, 1500, 'wood', [
    B(32, 1.5, 0, 64, 3, 30, SD.walD, WD),
    B(32, 36, -13, 56, 66, 3, SD.foam, FM),
    ...[2, 62].map(x => B(x, 36, 0, 4, 66, 30, SD.wal, GR)),
    ...[5.4, 58.6].map(x => B(x, 36, -1, 2.8, 62, 22, SD.foam, FM)),
    B(32, 70.5, 0, 64, 3, 30, SD.walD, WD),
    B(32, 75, 8, 20, 6, 4, SD.black, GL), B(32, 75, 10.2, 18, 4.4, 0.4, SD.glowR, GW), PC(32, 75, 10.45, 18, 4.4, word('RECORDING', SD.paper, SD.glowR, 0.7)),
    C(26, 3.6, 4, 3.6, 1.2, SD.black, { m: 'metal', seg: 12 }),
    C(26, 9.6, 4, 0.5, 11, SD.blackL, { m: 'metal', seg: 6 }),
    RD([26, 15, 4], [33, 16, 5], 0.4, SD.blackL, MT),
    C(33.6, 14.6, 5, 1.4, 5, SD.steelL, { m: 'metal', seg: 10 }), S(33.6, 17.4, 5, 1.4, 1.6, 1.4, SD.gold, { m: 'metal', seg: 8 }),
    RG(36.4, 14, 6, 3, 0.3, SD.black, { m: 'gloss', ax: 'x' }),
    ...[38, 46].map(x => S(x, 4.4, 3, 2.6, 1.6, 3, SD.jig, { m: 'cloth', seg: 10 })),
    S(42, 14, 0, 9, 9, 8.4, SD.jig, { m: 'cloth', seg: 16 }),
    PR(42, 0, -1, [[-7.6, 18], [-3.4, 21.4], [-6.8, 27]], 2.4, SD.jig, CL), PR(42, 0, -1, [[3.4, 21.4], [7.6, 18], [6.8, 27]], 2.4, SD.jig, CL),
    PR(42, 0, -0.6, [[-6.4, 20.4], [-4.2, 21.8], [-6.2, 25]], 2.6, SD.keyK, PL), PR(42, 0, -0.6, [[4.2, 21.8], [6.4, 20.4], [6.2, 25]], 2.6, SD.keyK, PL),
    RG(41.4, 20.6, 7, 1.8, 0.6, SD.jigD, { m: 'cloth', a0: -0.6, arc: TAU * 0.78 }),
    ...[38.4, 45.6].flatMap(x => [DS(x, 15.4, 7.2, 2.6, 0.8, '#ffffff', { m: 'plain', seg: 12 }), DS(x, 15.2, 7.7, 1.9, 0.4, SD.jigEye, { m: 'gloss', seg: 10 }), DS(x - 0.7, 16.2, 8, 0.6, 0.2, '#ffffff', { m: 'plain', seg: 6 })]),
    DS(42, 10.6, 8.1, 1.5, 0.4, SD.jigM, { m: 'plain', ry: 1.2, seg: 10 }),
    ...[34, 50].map(x => S(x, 12, 3, 1.8, 2.4, 1.8, SD.jig, { m: 'cloth', seg: 8 })),
    RG(42, 14.6, 0, 9.6, 0.7, SD.black, { m: 'gloss', arc: Math.PI }),
    ...[32.4, 51.6].map(x => DS(x, 14, 0, 2.8, 1.6, SD.black, { ax: 'x', m: 'gloss', seg: 12 })),
    B(32, 36, 14.2, 56, 66, 0.6, '#cfe8f4', { m: 'glass' }),
    B(20, 36, 14.6, 1.6, 66, 1, SD.walD, WD), RD([22.6, 30, 15.4], [22.6, 40, 15.4], 0.5, SD.steelL, MT),
  ], { glow: [SD.glowR] }),

  // a studio monitor in a walnut cabinet on a steel stand: a black woofer and a silk-dome tweeter, its amber power lamp
  piece('rcsmonitor', 'Studio monitor on stand', 1, 1, 680, 'metal', [
    B(16, 0.8, 0, 18, 1.6, 18, SD.black, sq(MT)),
    C(16, 16, 0, 1.4, 28, SD.black, { m: 'metal', seg: 10 }),
    B(16, 30.6, 0, 14, 1.2, 14, SD.black, sq(MT)),
    B(16, 42.4, 0, 18, 22.4, 18, SD.wal, GR),
    B(16, 42.4, 9.2, 16.4, 20.6, 0.6, SD.black, GL),
    DS(16, 38.4, 9.8, 5.8, 0.8, SD.blackL, { m: 'gloss', seg: 16 }), RG(16, 38.4, 10.2, 5.6, 0.4, SD.steelD, MT),
    DS(16, 38.4, 10.2, 1.8, 0.8, SD.black, { m: 'gloss', seg: 10 }),
    DS(16, 48.6, 9.8, 2.4, 0.6, SD.steelD, { m: 'metal', seg: 10 }), S(16, 48.6, 10, 1.2, 1.2, 0.8, SD.cream, { m: 'cloth', seg: 8 }),
    DS(22, 33.4, 9.7, 0.5, 0.3, SD.amber, { m: 'glow', seg: 6 }),
  ], { glow: [SD.amber] }),

  // a black subwoofer with Loudred sat on top, its ear speakers out wide and its mouth open as loud as it goes
  piece('rcsloudred', 'Studio Loudred subwoofer', 1, 1, 900, 'gloss', [
    B(16, 11, 0, 28, 20, 24, SD.black, GL),
    B(16, 11, 12.2, 26, 18, 0.4, SD.blackL, { m: 'cloth', tex: 'grille', r: 0.05 }),
    DS(16, 11, 12.6, 7.4, 0.6, SD.blackL, { m: 'gloss', seg: 16 }), RG(16, 11, 12.9, 7.2, 0.4, SD.steelD, MT), DS(16, 11, 13, 2, 0.6, SD.black, { m: 'gloss', seg: 10 }),
    ...[10, 22].map(x => S(x, 22.6, 6, 3, 1.6, 3, SD.loud, { m: 'cloth', seg: 8 })),
    S(16, 31, -1, 9.6, 8.6, 8.4, SD.loud, { m: 'cloth', seg: 16 }),
    ...[5.6, 26.4].flatMap((x, i) => [
      RD([x + (i ? -2.8 : 2.8), 36, -1], [x, 38, -1], 1.6, SD.loud, CL),
      DS(x, 38.6, 0.6, 4.4, 2, SD.loudD, { m: 'gloss', seg: 14 }), DS(x, 38.6, 1.8, 3, 0.6, SD.loudY, { m: 'gloss', seg: 12 }),
      DS(x, 38.6, 2.2, 1, 0.4, SD.loudD, { m: 'plain', seg: 8 }),
    ]),
    PR(16, 38, -2, [[-2.6, 0], [2.6, 0], [0, 4.6]], 3, SD.loudD, CL),
    DS(16, 28.6, 7.2, 5, 0.8, SD.loudM, { m: 'plain', ry: 3.8, seg: 14 }),
    ...[13.6, 18.4].map(x => B(x, 31.6, 7.8, 1.6, 1, 0.4, '#ffffff', sq(PL))),
    ...[12, 20].flatMap((x, i) => [DS(x, 35, 7, 1.5, 0.6, SD.loudY, { m: 'plain', seg: 8 }), DS(x, 35, 7.4, 0.7, 0.4, SD.black, { m: 'plain', seg: 6 }), RD([x - 1.6, 37.6 - (i ? 0.8 : 0), 7], [x + 1.6, 37.6 - (i ? 0 : 0.8), 7], 0.4, SD.loudD, PL)]),
    ...[7.4, 24.6].map(x => S(x, 26, 3, 2, 2.8, 2, SD.loud, { m: 'cloth', seg: 8 })),
  ]),

  // a walnut headphone tree: two bars, a pair of studio headphones hung either side of each
  piece('rcsheadphones', 'Studio headphone rack', 1, 1, 380, 'wood', [
    C(16, 1, 0, 8, 2, SD.walD, { m: 'wood', seg: 14 }),
    B(16, 24, 0, 3, 44, 3, SD.wal, GR),
    ...[[46, SD.black, SD.amber], [28, SD.blackL, SD.red]].flatMap(([h, c, pad]) => [
      RD([3, h, 0], [29, h, 0], 0.7, SD.walL, WD),
      ...[8.6, 23.4].flatMap(x => [
        RG(x, h - 2.6, 0, 5.2, 0.7, c, { m: 'gloss', arc: Math.PI }),
        ...[-1, 1].flatMap(sg => [S(x + sg * 5.2, h - 4.6, 0, 1.6, 2.8, 2.8, c, { m: 'gloss', seg: 10 }), S(x + sg * 4, h - 4.6, 0, 0.6, 2.4, 2.4, pad, { m: 'cloth', seg: 8 })]),
        RD([x + 5.2, h - 7.4, 0], [x + 4, h - 12, 1], 0.3, SD.cable, PL),
      ]),
    ]),
    B(16, 47, 0, 4, 2, 4, SD.walD, WD),
  ]),

  // a double bass on its stand, varnished in warm amber, with Kricketune perched on its shoulder fiddling along
  piece('rcsbass', 'Studio upright bass', 1, 1, 1300, 'gloss', [
    B(16, 1, 0, 16, 2, 12, SD.black, sq(MT)),
    RD([16, 2, -4], [16, 30, -4], 0.6, SD.black, MT), RD([16, 30, -4], [16, 32, -1], 0.6, SD.black, MT),
    RD([16, 2, 0], [16, 5, 0], 0.4, SD.steelD, MT),
    PR(16, 5, 0, [[-6, 0], [6, 0], [10, 3], [12, 8], [11.5, 13], [9, 16], [9, 18], [10.5, 21], [10, 26], [7, 29], [3, 30.5], [-3, 30.5], [-7, 29], [-10, 26], [-10.5, 21], [-9, 18], [-9, 16], [-11.5, 13], [-12, 8], [-10, 3]], 7, SD.bass, GL),
    ...[-1, 1].map(sg => RD([16 + sg * 5, 17, 3.7], [16 + sg * 4.6, 22, 3.7], 0.35, SD.bassD, PL)),
    PR(16, 6.6, 3.8, [[-1, 0], [1, 0], [2.2, 8], [-2.2, 8]], 0.8, SD.black, GL),
    B(16, 16.4, 4, 6, 2.8, 0.8, SD.cream, sq(WD)),
    B(16, 47, 1.6, 3.2, 28, 2.4, SD.black, sq(GL)),
    B(16, 60.6, 0.6, 2.6, 4.8, 2.4, SD.bassD, sq(GL)), S(16, 64.4, 0.6, 1.6, 2, 1.8, SD.bassD, { m: 'gloss', seg: 8 }),
    ...[58.6, 61.6].flatMap(h => [-1, 1].map(sg => RD([16, h, 0.6], [16 + sg * 3.4, h, 0.6], 0.4, SD.steelL, MT))),
    ...[-1.1, -0.36, 0.36, 1.1].map(dx => RD([16 + dx * 1.4, 14.6, 4.6], [16 + dx * 0.8, 60, 3], 0.12, SD.string, PL)),
    ...[23.4, 26.6].map(x => RD([x, 35, 1.6], [x, 37.2, 1.6], 0.3, SD.krickK, PL)),
    S(25, 39.4, 1.6, 2.8, 3.4, 2.6, SD.krickK, { m: 'gloss', seg: 8 }),
    S(25, 44, 2, 3, 3, 2.8, SD.krick, { m: 'gloss', seg: 10 }),
    S(25, 48.4, 2.2, 2.4, 2.2, 2.2, SD.krick, { m: 'gloss', seg: 10 }),
    ...[-1, 1].map(sg => RD([25 + sg * 0.6, 47.4, 4.2], [25 + sg * 4.4, 45.4, 3.6], 0.45, SD.krickY, PL)),
    ...[-1, 1].map(sg => RD([25 + sg * 0.8, 50.2, 2.4], [25 + sg * 2.6, 54.4, 2], 0.25, SD.krickK, PL)),
    ...[23.8, 26.2].map(x => DS(x, 49, 4.2, 0.4, 0.3, SD.black, { m: 'plain', seg: 6 })),
    RD([22.4, 44, 2.4], [18, 41, 4], 0.5, SD.krickK, GL), RD([27.6, 44, 2.4], [29.6, 40, 3], 0.5, SD.krickK, GL),
  ]),

  // the producer's chair: oxblood leather, a tall buttoned back, black arms, on a five-star castor base
  piece('rcschair', "Studio producer's chair", 1, 1, 560, 'cloth', [
    ...[0, 1, 2, 3, 4].flatMap(i => { const a = i / 5 * TAU + Math.PI / 2, ex = 16 + Math.cos(a) * 11, ez = Math.sin(a) * 11; return [RD([16, 2.8, 0], [ex, 2.4, ez], 0.9, SD.black, MT), S(ex, 1.2, ez, 1.2, 1.2, 1.2, SD.blackL, { m: 'gloss', seg: 6 })]; }),
    C(16, 9, 0, 1.4, 12, SD.steelD, { m: 'metal', seg: 10 }),
    B(16, 17, 1, 22, 4, 20, SD.leather, { m: 'cloth', r: 2 }),
    RD([16, 17, -8], [16, 22, -10], 1, SD.black, MT),
    B(16, 32.4, -10, 20, 24, 4, SD.leather, { m: 'cloth', tex: 'tuft', r: 2.4 }),
    ...[4.6, 27.4].flatMap(x => [RD([x, 17.6, 0], [x, 23.4, 0], 0.7, SD.black, MT), B(x, 24.2, 1, 2.8, 1.6, 12, SD.black, GL)]),
  ]),

  // a long chesterfield for the band in buttoned oxblood leather, rolled arms, two seat cushions and an amber cushion
  piece('rcscouch', 'Studio band couch', 2, 1, 1100, 'cloth', [
    ...foot4([6, 58], [-9, 10], 2.6, 4, SD.walD),
    B(32, 9, 1, 62, 10, 26, SD.leather, { m: 'cloth', r: 2 }),
    ...[17.6, 46.4].map(x => B(x, 16, 3, 27.4, 4, 21, SD.leatherL, { m: 'cloth', r: 1.6 })),
    B(32, 25, -10, 62, 20, 6, SD.leather, { m: 'cloth', tex: 'tuft', r: 2 }),
    ...[3.4, 60.6].flatMap(x => [B(x, 18, 1, 6.8, 14, 26, SD.leather, { m: 'cloth', tex: 'tuft', r: 2 }), DS(x, 25.4, 1, 3.6, 26, SD.leatherL, { m: 'cloth', seg: 12 })]),
    S(11, 22, -3, 4.6, 4.6, 1.8, SD.amber, { m: 'cloth', seg: 10 }),
  ]),

  // a tall guitar stool: a round padded seat on splayed chrome legs with a foot ring
  piece('rcsstool', 'Studio guitar stool', 1, 1, 240, 'metal', [
    ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => RD([16 + sx * 8, 0.6, sz * 8], [16 + sx * 4, 25.4, sz * 4], 0.9, SD.steelL, MT)),
    RG(16, 9, 0, 6.8, 0.7, SD.steel, { m: 'metal', flat: true }),
    C(16, 26, 0, 6, 1.4, SD.steelD, { m: 'metal', seg: 14 }),
    C(16, 27.8, 0, 7, 2.4, SD.leatherD, { m: 'cloth', rb: 6.8, seg: 16 }),
  ]),

  // a low walnut coffee table: setlists stacked and one stood in a holder, two mugs, guitar picks and a capo
  piece('rcssetlist', 'Studio setlist table', 2, 1, 520, 'wood', [
    ...foot4([5, 59], [-9, 9], 3.4, 14),
    B(32, 4, 0, 56, 2, 22, SD.wal, WD),
    B(32, 15, 0, 62, 3, 26, SD.walL, GRH),
    ...[[46, -4], [50, -2]].map(([x, z], i) => B(x, 6 + i * 1, z, 12, 1, 8, i ? SD.red : SD.cream, sq(PL))),
    ...[0, 1, 2].map(i => B(16 + i * 0.6, 16.8 + i * 0.4, 2 - i, 11, 0.4, 14, SD.paper, sq(PL))),
    B(30, 17.3, -5, 4, 1.6, 3, SD.black, sq(GL)), B(30, 23.4, -5, 10, 11, 0.4, SD.paper, sq(PL)), PC(30, 23.4, -4.75, 10, 11, setlist),
    ...[[44, 3, SD.mug], [52, -3, SD.black]].map(([x, z, c]) => LA(x, 16.5, z, [[1.8, 0], [2.1, 0.4], [2.2, 4.6], [2.3, 5]], c, { m: 'gloss', seg: 10 })),
    ...[46.2, 54.2].map((x, i) => RG(x, 18.9, i ? -3 : 3, 1.1, 0.35, i ? SD.black : SD.mug, { m: 'gloss' })),
    ...[[38, 6, SD.red], [40, 8, SD.amber], [36.6, 9, SD.jig]].map(([x, z, c]) => C(x, 16.7, z, 1, 0.4, c, { m: 'gloss', seg: 6 })),
    B(58, 16.9, 5, 4, 0.8, 1.6, SD.steelD, sq(MT)),
  ]),

  // a walnut coffee cart on castors: a drip coffee maker with its glass pot, mugs on top, bags of beans below
  piece('rcscoffee', 'Studio coffee cart', 1, 1, 640, 'wood', [
    ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].flatMap(([sx, sz]) => [S(16 + sx * 12, 1.2, sz * 8, 1.2, 1.2, 1.2, SD.black, { m: 'gloss', seg: 6 }), RD([16 + sx * 12.6, 2.4, sz * 8.6], [16 + sx * 12.6, 30, sz * 8.6], 0.9, SD.steel, MT)]),
    B(16, 6, 0, 28, 2.2, 20, SD.wal, WD),
    B(16, 30, 0, 29, 2.2, 21, SD.walL, GRH),
    ...[9, 16, 23].map((x, i) => B(x, 10, -1, 6, 6.8, 5, [SD.pineD, SD.redD, SD.pine][i], { m: 'cloth', r: 1 })),
    B(10, 38, -4, 9, 14, 9, SD.black, GL), B(10, 44.4, -0.4, 9, 1.4, 6, SD.black, GL),
    LA(10, 30.8, 1.6, [[2.4, 0], [3.2, 1.6], [3.3, 4], [2.4, 6], [2.2, 6.6]], SD.coffee, { m: 'glass', seg: 12 }),
    B(10, 32.4, 1.6, 7, 3.2, 6, SD.coffee, sq(PL)),
    RD([13.4, 35, 1.6], [14.4, 34, 1.6], 0.5, SD.black, PL),
    DS(13, 41, 0.6, 0.6, 0.4, SD.glowR, { m: 'glow', seg: 6 }),
    ...[[20, 3, SD.mug], [25, 3, SD.red], [22.5, -4, SD.mug]].map(([x, z, c]) => LA(x, 30.8, z, [[1.6, 0], [1.9, 0.4], [2, 4], [2.1, 4.4]], c, { m: 'gloss', seg: 10 })),
  ], { glow: [SD.glowR] }),

  // a pine crate of LPs: their sleeves stood in a row, one record out leaning on the front
  piece('rcsvinyl', 'Studio vinyl crate', 1, 1, 320, 'wood', [
    B(16, 7.5, 0, 26, 13, 20, SD.pine, { m: 'wood', tex: 'grain', pd: 'h', r: 0.6 }),
    DS(16, 11, 10.1, 3.2, 0.3, SD.pineD, { m: 'plain', ry: 1.2, seg: 10 }),
    ...['#d24a3a', '#3a7ac8', '#e8c040', '#4aa86a', '#9a5ac8', SD.black, '#e88a3a', SD.cream].map((c, i) => B(16, 13.4 + (i % 3) * 0.5, -7.6 + i * 2, 24, 12, 0.6, c, sq(PL))),
    DS(22, 7.4, 10.8, 6.6, 0.4, SD.black, { m: 'gloss', seg: 18 }), DS(22, 7.4, 11.1, 2.2, 0.3, SD.red, { m: 'plain', seg: 10 }),
    B(9, 7.6, 10.6, 12, 12, 0.5, '#3a7ac8', sq(PL)), DS(9, 7.6, 10.9, 3.4, 0.2, SD.paper, { m: 'plain', seg: 10 }),
  ]),

  // two black road cases stacked, aluminium edged and stencilled, a little red pedal case on top
  piece('rcscases', 'Studio flight cases', 1, 1, 420, 'gloss', [
    ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => S(16 + sx * 11, 1.1, sz * 8, 1.1, 1.1, 1.1, SD.black, { m: 'gloss', seg: 6 })),
    B(16, 9, 0, 28, 14, 22, SD.black, GL),
    B(16, 9, 11.1, 28, 1, 0.4, SD.steelL, sq(MT)), PC(12, 12.4, 11.25, 14, 4, word('STUDIO A', SD.paper, null, 0.7)),
    ...[7, 25].map(x => B(x, 6.4, 11.3, 3, 2, 0.8, SD.steelL, sq(MT))),
    ...[[2.2, 9.6], [29.8, 9.6]].map(([x, h]) => B(x, h, 0, 1, 14, 22.4, SD.steelD, sq(MT))),
    B(15, 22, -1, 22, 12, 18, SD.blackL, GL),
    B(15, 22, 8.1, 22, 0.8, 0.4, SD.steelL, sq(MT)), PC(15, 24.6, 8.25, 12, 3.6, word('MICS', SD.paper, null, 0.8)),
    B(15, 19, 8.4, 4, 1.6, 0.8, SD.steelL, sq(MT)),
    B(17, 31, 1, 14, 6, 12, SD.red, GL), B(17, 31, 7.1, 3, 1.4, 0.4, SD.steelL, sq(MT)),
  ]),

  // a wooden cable drum wound with black mic cable, a loose coil on the floor ending in its plug
  piece('rcscable', 'Studio cable reel', 1, 1, 280, 'wood', [
    B(16, 0.8, 0, 26, 1.6, 8, SD.walD, WD),
    ...[5, 27].map(x => DS(x, 13.4, 0, 12, 1.8, SD.pine, { m: 'wood', ax: 'x', seg: 16 })),
    DS(16, 13.4, 0, 8.6, 20, SD.cable, { m: 'gloss', ax: 'x', seg: 14 }),
    ...[8, 12, 16, 20, 24].map(x => RG(x, 13.4, 0, 8.7, 0.35, SD.blackL, { m: 'gloss', ax: 'x' })),
    DS(16, 13.4, 0, 1.4, 25, SD.steelD, { m: 'metal', ax: 'x', seg: 8 }),
    RD([20, 5, 8.4], [21, 1, 10], 0.5, SD.cable, GL),
    RG(16, 0.6, 11, 4, 0.5, SD.cable, { m: 'gloss', flat: true }),
    RD([12, 0.6, 11], [7, 0.8, 13], 0.5, SD.cable, GL), C(6, 0.9, 13.4, 0.9, 1.8, SD.steelL, { m: 'metal', seg: 8 }),
  ]),

  // a free-standing gobo on castor feet: a walnut frame faced with foam and a little window to see the band through
  piece('rcsgobo', 'Studio gobo baffle', 1, 1, 450, 'wood', [
    ...[4, 28].flatMap(x => [B(x, 2.6, 0, 3, 2, 14, SD.walD, WD), ...[-6, 6].map(z => S(x, 0.9, z, 0.9, 0.9, 0.9, SD.black, { m: 'gloss', seg: 6 }))]),
    B(16, 30, 0, 30, 52, 4, SD.wal, GR),
    B(16, 25, 2.3, 26, 34, 1, SD.foam, FM),
    B(16, 48, 2.3, 22, 9, 0.6, '#cfe8f4', { m: 'glass' }),
  ]),

  // charcoal acoustic foam on the wall, two rows of wedge panels, wine-red panels between
  wallPiece('rcsfoam', 'Studio acoustic foam', 2, 380, 'cloth', [
    ...[11, 32, 53].flatMap((x, i) => [52, 72].map((h, j) => B(x, h, 1.6, 19.4, 19.4, 3.2, (i + j) % 2 ? SD.wine : SD.foam, { ...FM, r: 0.6 }))),
  ]),

  // a skyline diffuser: a walnut frame of square wooden blocks stood out from the wall at every depth
  wallPiece('rcsdiffuser', 'Studio skyline diffuser', 1, 420, 'wood', [
    B(16, 62, 0.6, 28, 28, 1.2, SD.walD, sq(WD)),
    ...[0, 1, 2, 3, 4].flatMap(i => [0, 1, 2, 3, 4].map(j => { const dp = 1 + ((i * 3 + j * 7 + i * j) % 5) * 1.1; return B(6 + i * 5, 52 + j * 5, 1.2 + dp / 2, 4.6, 4.6, dp, (i + j) % 2 ? SD.walL : SD.wal, sq(WD)); })),
  ]),

  // the red ON AIR light on a steel bracket: lit, it says the red light's on
  wallPiece('rcsonair', 'Studio ON AIR light', 1, 520, 'gloss', [
    B(16, 74, 0.8, 4, 3, 1.6, SD.steelD, sq(MT)),
    B(16, 66, 1.8, 29, 12, 3.6, SD.black, GL),
    B(16, 66, 3.8, 26, 9.4, 0.4, SD.glowR, GW), PC(16, 66, 4.05, 26, 9.4, word('ON AIR', SD.paper, SD.glowR, 0.66)),
  ], { glow: [SD.glowR] }),

  // a gold record framed in black: the disc above, Toxtricity on the plaque beneath with its million sold
  wallPiece('rcsgold', 'Studio gold record', 1, 760, 'gloss', [
    B(16, 61, 0.8, 28, 36, 1.6, SD.walK, GL),
    B(16, 61, 1.7, 24, 32, 0.2, SD.black, sq(PL)),
    DS(16, 68.6, 2.1, 8.4, 0.6, SD.gold, { m: 'metal', seg: 24 }),
    ...[6.6, 4.6].map(r => RG(16, 68.6, 2.45, r, 0.15, SD.goldD, { m: 'plain' })),
    DS(16, 68.6, 2.5, 2.6, 0.3, SD.tox, { m: 'plain', seg: 12 }), DS(16, 68.6, 2.7, 0.5, 0.2, SD.black, { m: 'plain', seg: 6 }),
    PC(16, 50, 1.95, 22, 9, plaque),
  ]),

  // a walnut hanger rail with three electric guitars hung by their heads: a sunburst, a red and a black
  wallPiece('rcsguitars', 'Studio guitar wall rack', 2, 1200, 'wood', [
    B(32, 72.6, 0.6, 60, 5, 1.2, SD.wal, GRH),
    ...[11, 32, 53].flatMap((x, i) => [
      RD([x, 72.6, 1.2], [x, 71, 3.4], 0.5, SD.black, MT),
      ...hungGuitar(x, 37.2, 3, [SD.sunburst, SD.strat, SD.black][i], [SD.black, SD.ivory, SD.ivory][i]),
    ]),
  ]),

  // the studio's rug: charcoal with an amber border and an amber waveform across it, a red REC dot in the corner
  { id: 'rcsrug', name: 'Studio waveform rug', group: GROUP, solo: true, w: 3, h: 2, layer: 'rug', price: 560, high: 0.03, side: 'c', flat() {
    const g = ctx(), path = () => { g.beginPath(); RUG.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
    g.fillStyle = SD.foamD; path(); g.fill();
    g.strokeStyle = SD.amber; g.lineWidth = 0.8; g.strokeRect(7, 7, 82, 50);
    g.strokeStyle = sh(SD.amber, -2); g.lineWidth = 0.4; g.strokeRect(8.6, 8.6, 78.8, 46.8);
    g.fillStyle = SD.foam; g.fillRect(9, 31.6, 78, 0.8);
    for (let i = 0; i < 52; i++) {
      const x = 11 + i * 1.44, env = Math.sin(i / 51 * Math.PI) ** 0.6, a = env * (0.35 + 0.65 * Math.abs(Math.sin(i * 0.9) * Math.cos(i * 0.37)));
      g.fillStyle = i % 9 === 4 ? sh(SD.amber, 1) : SD.amber; g.fillRect(x, 32 - a * 18, 0.9, a * 36);
    }
    g.fillStyle = SD.glowR; g.beginPath(); g.arc(14, 13, 2, 0, TAU); g.fill();
    g.fillStyle = SD.paper; g.textAlign = 'left'; g.textBaseline = 'middle'; g.font = `bold 3.4px ${SANS}`; g.fillText('REC', 17.4, 13.2);
    g.strokeStyle = sh(SD.foamD, 1); g.lineWidth = 1; path(); g.stroke();
  } },
];
