/* base-furniture-gamer.js  -  the Gamer room set (furniture expansion, room types, 2026-10-17): a whole room of a modern
   streamer's and gamer's den, as Animal Crossing's Happy Home Paradise does a room type. Matte black and graphite with
   RGB glow: cyan, magenta and violet strips and panels that light at night. The battlestation desk's middle monitor and
   the big TV are live screens; the tower PC, the streaming rig, the VR stand, the router tower, the hex panels, the GG
   sign and the light pieces switch on and off; the energy drink fridge's glass door opens; the floor rocker rocks; the
   sim rig rumbles. Porygon-Z on the desk's left monitor, a Pikachu headset that crackles when tapped, Gengar's shadow
   on the TV and a Pokédex beside a Game Boy-style handheld for the Pokémon touches. All solo, fixed colours, sold all
   year. The Throwback set is the 90s den and the arcade its cabinets; these are today's gamer's own pieces.
   An upright piece is a list of parts in painted units (32 a tile), as in js/base-furniture-ramen.js: `x` across from
   the left of its front, `h` up from the floor (a wall piece's from the foot of its strip), `z` out to the front from
   its middle (a wall piece's from the wall). They're painted here from any side, and js/base-models-gamer.js builds the
   same list as 3D parts (BUILT), so picture and model agree. A ring or disc with `ax: 'x'` stands side-on (the
   headset's ear cups, the rocker's speakers). A `wedge` is a side profile ([z, up] points) extruded `w` across (the floor
   rocker's shell). `tex` is painted only (the model stays plain colour): `mesh` a speaker grille's holes, `quilt` a
   gaming seat's diamond stitching. A `pic` part (the monitors, the TV, the handheld's and the Pokédex's screens, the
   game case spines, the poster) is painted on the front only, and the model wears that crop of the painting. The fridge's
   glass door swings (`doors`, `inside`). The rug is painted from above (RUG). */

import { sh, oval, ovalShade, floorShadow, ctx, hash, glass as glassPane } from './base-paint.js';

export const GM = {
  black: '#141418', blackL: '#26262d', gr: '#34363e', grL: '#4c4f5a', grD: '#1f2026', steel: '#9aa0a8', steelL: '#c8ccd2',
  cyan: '#28e0ff', mag: '#ff36c8', vio: '#9a5cff', ring: '#f4f6ff', screen: '#0b0f22', white: '#eceef4', red: '#e0304a',
  redD: '#9a1a2e', canG: '#5ee83a', canO: '#ff8a1e', canB: '#2a6cff', canP: '#ff3a9a', chipY: '#f2b81e', chipR: '#e83a2a',
  chipG: '#3a9a4a', gold: '#e2b23a', pika: '#f6d02e', pikaD: '#c49a10', pikaR: '#e8483a', geng: '#5b3d8f', gengD: '#2e1d4e',
  porz: '#e8506a', porzB: '#3a6ad8', porzY: '#f2d040', gb: '#c9c5bc', gbD: '#8e8a84', gbS: '#9bbc0f', gbSD: '#306230',
  dex: '#d42a34', dexD: '#8e1a22', dexS: '#9fe0f0',
};
const G = GM;
const GROUP = 'Gamer room';
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


function grad(g, x0, y0, x1, y1, c, m) {
  const l = g.createLinearGradient(x0, y0, x1, y1);
  if (m === 'metal') [[0, sh(c, 2)], [0.25, c], [0.55, sh(c, -1)], [0.8, sh(c, 1)], [1, sh(c, -1)]].forEach(s => l.addColorStop(...s));
  else [[0, sh(c, 1)], [0.35, c], [1, sh(c, -1)]].forEach(s => l.addColorStop(...s));
  return l;
}
function rbx(x, y, w, h, r, c, m) {
  if (w <= 0 || h <= 0) return;
  const g = ctx();
  if (m === 'glass') { g.save(); g.globalAlpha *= 0.4; glassPane(x, y, w, h, '#cfe8f4'); g.restore(); return; }
  if (m === 'plain' || m === 'glow') { g.fillStyle = c; g.beginPath(); g.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); g.fill(); return; }
  g.fillStyle = grad(g, x, y, x + w * 0.3, y + h, c, m); g.beginPath(); g.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); g.fill();
  if (h > 3 && w > 3) { g.save(); g.globalAlpha *= 0.4; g.fillStyle = sh(c, 2); g.fillRect(x + Math.min(r, w / 2) * 0.6, y + 0.3, w - Math.min(r, w / 2) * 1.2, 0.5); g.restore(); }
}
function poly(pts, c, m, horiz) {
  const g = ctx(), xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  if (m === 'glass') { g.save(); g.globalAlpha *= 0.35; }
  if (m === 'plain' || m === 'glow') g.fillStyle = c;
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
  if (m === 'glow' || m === 'plain') { oval(cx, cy, rx, ry, c); return; }
  if (m === 'glass') { g.save(); g.globalAlpha *= 0.4; oval(cx, cy, rx, ry, '#dff0f8'); g.restore(); return; }
  ovalShade(cx, cy, rx, ry, c);
  if (m === 'gloss' || m === 'metal') { g.save(); g.globalAlpha *= 0.55; oval(cx - rx * 0.38, cy - ry * 0.42, rx * 0.22, ry * 0.14, '#ffffff'); g.restore(); }
}
const polyPath = (pts) => { const p = new Path2D(); pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); p.closePath(); return p; };
const bounds = (pts) => { const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; };

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
      case 'cyl': {
        const rb = q.rb ?? q.r, top = cy - q.hh / 2, bot = cy + q.hh / 2, pts = [[cx - q.r, top], [cx + q.r, top], [cx + rb, bot], [cx - rb, bot]];
        poly(pts, q.c, m, m !== 'glow');
        if (q.tex) texture(q, polyPath(pts), bounds(pts));
        if (m !== 'glass') oval(cx, top, q.r, Math.min(q.r * 0.22, Math.max(0.3, q.hh / 2)), sh(q.c, m === 'glow' ? 0 : 1));
        break;
      }
      case 'ball': ball(cx, cy, side ? q.rz : q.rx, q.ry, q.c, m); break;
      case 'disc': if (edge) rbx(cx - q.th / 2, cy - (q.ry ?? q.r), q.th, (q.ry ?? q.r) * 2, q.th / 2, q.c, m); else ball(cx, cy, q.r, q.ry ?? q.r, q.c, m); break;
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
        if (m !== 'plain' && m !== 'glow') { g.save(); g.globalAlpha *= 0.45; g.strokeStyle = sh(q.c, 2); g.lineWidth = q.tr * 0.6; path(-q.tr * 0.4); g.stroke(); g.restore(); }
        break;
      }
      case 'rod': {
        const p0 = [U(q.a[0], q.a[2]), b - q.a[1]], p1 = [U(q.b[0], q.b[2]), b - q.b[1]];
        if (Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) < 0.05) { ball(p0[0], p0[1], q.r, q.r, q.c, m); break; }
        g.lineCap = 'round'; g.strokeStyle = m === 'glass' ? 'rgba(207,232,244,0.4)' : q.c; g.lineWidth = q.r * 2;
        g.beginPath(); g.moveTo(...p0); g.lineTo(...p1); g.stroke();
        if (q.r > 0.6 && m !== 'glass' && m !== 'plain' && m !== 'glow') {
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
      case 'wedge': {
        const ups = q.pts.map(p => p[1]), top = Math.max(...ups), bot = Math.min(...ups);
        if (!side) { rbx(cx - q.w / 2, cy - top, q.w, top - bot, 0.6, q.c, m); break; }
        poly(q.pts.map(([pz, up]) => [U(q.x, q.z + pz), cy - up]), q.c, m);
        break;
      }
      case 'pic': g.save(); g.beginPath(); g.rect(cx - q.w / 2, cy - q.hh / 2, q.w, q.hh); g.clip(); q.fn(g, cx - q.w / 2, cy - q.hh / 2, q.w, q.hh); g.restore(); break;
    }
  }
}

/** The painted-only surface of a part (`tex`), inside its outline `path` over bounds bb. */
function texture(q, path, bb) {
  const g = ctx(), [x0, y0, x1, y1] = bb, c = q.c;
  g.save(); g.clip(path);
  if (q.tex === 'mesh') {
    g.fillStyle = sh(c, -3); g.globalAlpha = 0.8;
    for (let y = y0 + 1, i = 0; y < y1 - 0.4; y += 1.2, i++) for (let x = x0 + 0.8 + (i % 2) * 0.6; x < x1 - 0.4; x += 1.2) { g.beginPath(); g.arc(x, y, 0.3, 0, TAU); g.fill(); }
  } else if (q.tex === 'quilt') {
    g.globalAlpha = 0.5; g.strokeStyle = sh(c, 2); g.lineWidth = 0.25; g.beginPath();
    for (let d = -(y1 - y0); d < x1 - x0; d += 3) { g.moveTo(x0 + d, y0); g.lineTo(x0 + d + (y1 - y0), y1); g.moveTo(x0 + d, y1); g.lineTo(x0 + d + (y1 - y0), y0); }
    g.stroke();
  }
  g.restore();
}

/** An energy drink can of colour c standing on h: the can and its steel lid. */
const can = (x, h, z, c) => [C(x, h + 3.7, z, 2.1, 7.4, c, { m: 'metal', seg: 10 }), C(x, h + 7.6, z, 1.8, 0.4, G.steelL, { m: 'metal', seg: 10 })];
/** A gamepad of colour c stood upright facing front about x, h: its body, two grips, two sticks and two buttons. */
const pad = (x, h, z, c, b1 = G.cyan, b2 = G.mag) => [
  S(x, h, z, 4.2, 2.2, 1.4, c, { m: 'gloss', seg: 10 }),
  ...[-1, 1].map(s => S(x + s * 3, h - 1.6, z, 1.7, 2.1, 1.3, c, { m: 'gloss', seg: 8 })),
  DS(x - 1.6, h + 0.3, z + 1.3, 0.8, 0.5, G.black, { m: 'gloss', seg: 8 }),
  DS(x + 1.4, h + 0.7, z + 1.3, 0.5, 0.4, b1, { m: 'plain', seg: 6 }), DS(x + 2.4, h - 0.2, z + 1.3, 0.5, 0.4, b2, { m: 'plain', seg: 6 }),
];
/** A gamepad lying flat on a top at h, its grips toward the front. */
const padFlat = (x, h, z, c) => [
  S(x, h + 0.9, z, 4, 0.9, 2.2, c, { m: 'gloss', seg: 10 }),
  ...[-1, 1].map(s => S(x + s * 2.8, h + 0.8, z + 1.6, 1.5, 0.8, 1.6, c, { m: 'gloss', seg: 8 })),
];
/** A pointy-topped hexagon r round its middle, as outline points. */
const hex = (r) => Array.from({ length: 6 }, (_, i) => [Math.sin(i * Math.PI / 3) * r, Math.cos(i * Math.PI / 3) * r]);
/** Neon letters (8 wide, 12 tall at s 1) as strokes about a middle x, standing on h. */
const GLYPH = {
  G: [[4, 10, 2, 12], [2, 12, -2, 12], [-2, 12, -4, 10], [-4, 10, -4, 2], [-4, 2, -2, 0], [-2, 0, 2, 0], [2, 0, 4, 2], [4, 2, 4, 6], [4, 6, 0.6, 6]],
};
const letters = (word, xs, h, z, s, r, c, o) => [...word].flatMap((ch, i) => GLYPH[ch].map(([ax, ah, bx, bh]) => RD([xs[i] + ax * s, h + ah * s, z], [xs[i] + bx * s, h + bh * s, z], r, c, o)));

/* ---------- pictures ---------- */

const SANS = 'Arial Black, Arial, sans-serif';
const word = (text, fg, bg, k = 0.78) => (g, x, y, w, h) => {
  if (bg) { g.fillStyle = bg; g.fillRect(x, y, w, h); }
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `bold ${h * k}px ${SANS}`; g.fillText(text, x + w / 2, y + h * 0.54, w * 0.92);
};
const night = (g, x, y, w, h, a, b) => { const l = g.createLinearGradient(0, y, 0, y + h); l.addColorStop(0, a); l.addColorStop(1, b); g.fillStyle = l; g.fillRect(x, y, w, h); };

/** The middle monitor as painted (the live screen plays over it in the room): a battle, two platforms and HP bars. */
function battleScreen(g, x, y, w, h) {
  night(g, x, y, w, h, '#3a6ad8', '#9fd0f0');
  g.fillStyle = '#5aa04a';
  g.beginPath(); g.ellipse(x + w * 0.72, y + h * 0.42, w * 0.18, h * 0.07, 0, 0, TAU); g.fill();
  g.beginPath(); g.ellipse(x + w * 0.28, y + h * 0.84, w * 0.22, h * 0.08, 0, 0, TAU); g.fill();
  oval(x + w * 0.72, y + h * 0.33, w * 0.07, h * 0.12, G.porz);
  oval(x + w * 0.28, y + h * 0.72, w * 0.09, h * 0.15, G.pika);
  for (const [bx, by] of [[0.06, 0.1], [0.56, 0.62]]) {
    g.fillStyle = '#f4f4f0'; g.fillRect(x + w * bx, y + h * by, w * 0.36, h * 0.13);
    g.fillStyle = '#3c3c44'; g.fillRect(x + w * (bx + 0.03), y + h * (by + 0.07), w * 0.3, h * 0.035);
    g.fillStyle = '#48d048'; g.fillRect(x + w * (bx + 0.03), y + h * (by + 0.07), w * (bx < 0.5 ? 0.2 : 0.27), h * 0.035);
  }
}
/** The left monitor: Porygon-Z drifting over a cyan grid, its beak and its spiral eye. */
function porygonZ(g, x, y, w, h) {
  g.fillStyle = G.screen; g.fillRect(x, y, w, h);
  g.strokeStyle = 'rgba(40,224,255,0.35)'; g.lineWidth = 0.25;
  for (let i = 1; i < 8; i++) { g.beginPath(); g.moveTo(x + w * i / 8, y); g.lineTo(x + w * i / 8, y + h); g.stroke(); }
  for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(x, y + h * i / 6); g.lineTo(x + w, y + h * i / 6); g.stroke(); }
  const cx = x + w * 0.46, cy = y + h * 0.52, s = h;
  g.fillStyle = G.porzB; g.beginPath(); g.moveTo(cx - s * 0.08, cy - s * 0.18); g.quadraticCurveTo(cx - s * 0.05, cy - s * 0.44, cx + s * 0.12, cy - s * 0.4); g.quadraticCurveTo(cx, cy - s * 0.3, cx + s * 0.04, cy - s * 0.18); g.fill();
  g.fillStyle = G.porz; g.beginPath(); g.ellipse(cx, cy, s * 0.24, s * 0.2, 0, 0, TAU); g.fill();
  g.fillStyle = G.porzB; g.beginPath(); g.moveTo(cx + s * 0.18, cy - s * 0.08); g.lineTo(cx + s * 0.44, cy + s * 0.02); g.lineTo(cx + s * 0.18, cy + s * 0.1); g.fill();
  g.fillStyle = G.porzB; g.beginPath(); g.ellipse(cx - s * 0.06, cy + s * 0.26, s * 0.12, s * 0.07, 0.3, 0, TAU); g.fill();
  g.fillStyle = G.porzY; g.beginPath(); g.arc(cx + s * 0.05, cy - s * 0.04, s * 0.09, 0, TAU); g.fill();
  g.strokeStyle = '#1a1a20'; g.lineWidth = s * 0.02; g.beginPath();
  for (let i = 0; i <= 24; i++) { const t = i / 24, a = t * TAU * 1.6, r = s * 0.075 * t; i ? g.lineTo(cx + s * 0.05 + Math.cos(a) * r, cy - s * 0.04 + Math.sin(a) * r) : g.moveTo(cx + s * 0.05, cy - s * 0.04); }
  g.stroke();
}
/** The right monitor: the stream's chat, a LIVE tag and a viewer count. */
function chatScreen(g, x, y, w, h) {
  g.fillStyle = '#121428'; g.fillRect(x, y, w, h);
  g.fillStyle = G.red; g.fillRect(x + w * 0.06, y + h * 0.07, w * 0.3, h * 0.14);
  word('LIVE', '#ffffff', null, 0.8)(g, x + w * 0.06, y + h * 0.07, w * 0.3, h * 0.14);
  g.fillStyle = G.cyan; g.fillRect(x + w * 0.44, y + h * 0.1, w * 0.4, h * 0.08);
  const cols = [G.mag, G.cyan, G.vio, G.canG, G.porzY];
  for (let i = 0; i < 6; i++) {
    const ly = y + h * (0.32 + i * 0.11);
    g.fillStyle = cols[i % 5]; g.fillRect(x + w * 0.06, ly, w * 0.18, h * 0.06);
    g.fillStyle = '#c8cce0'; g.fillRect(x + w * 0.28, ly, w * (0.25 + hash(i, 3) * 0.45), h * 0.06);
  }
}
/** The TV as painted (the live screen plays over it in the room): a purple night, a full moon and Gengar's shadow
    grinning out of the dark, its red eyes lit. */
function gengarTV(g, x, y, w, h) {
  night(g, x, y, w, h, '#1c1238', '#4a2c78');
  g.fillStyle = '#f4ecc8'; g.beginPath(); g.arc(x + w * 0.78, y + h * 0.26, h * 0.14, 0, TAU); g.fill();
  const cx = x + w * 0.42, cy = y + h * 0.66, s = h * 0.5;
  g.fillStyle = G.gengD; g.beginPath();
  g.moveTo(cx - s * 0.95, cy + s * 0.7);
  g.quadraticCurveTo(cx - s * 1.05, cy - s * 0.2, cx - s * 0.72, cy - s * 0.5);
  g.lineTo(cx - s * 0.9, cy - s * 1.05); g.lineTo(cx - s * 0.42, cy - s * 0.72);
  g.lineTo(cx - s * 0.28, cy - s * 0.98); g.lineTo(cx - s * 0.1, cy - s * 0.78);
  g.lineTo(cx + s * 0.08, cy - s * 1.02); g.lineTo(cx + s * 0.24, cy - s * 0.8);
  g.lineTo(cx + s * 0.42, cy - s * 0.72); g.lineTo(cx + s * 0.9, cy - s * 1.05); g.lineTo(cx + s * 0.72, cy - s * 0.5);
  g.quadraticCurveTo(cx + s * 1.05, cy - s * 0.2, cx + s * 0.95, cy + s * 0.7); g.closePath(); g.fill();
  g.fillStyle = '#ff3040';
  for (const sg of [-1, 1]) { g.beginPath(); g.moveTo(cx + sg * s * 0.12, cy - s * 0.3); g.lineTo(cx + sg * s * 0.52, cy - s * 0.42); g.lineTo(cx + sg * s * 0.4, cy - s * 0.18); g.closePath(); g.fill(); }
  g.fillStyle = '#f4f0f8'; g.beginPath(); g.moveTo(cx - s * 0.56, cy + s * 0.02); g.quadraticCurveTo(cx, cy + s * 0.18, cx + s * 0.56, cy + s * 0.02); g.quadraticCurveTo(cx, cy + s * 0.5, cx - s * 0.56, cy + s * 0.02); g.fill();
  g.strokeStyle = G.gengD; g.lineWidth = s * 0.04;
  for (const d of [-0.3, -0.1, 0.1, 0.3]) { g.beginPath(); g.moveTo(cx + s * d, cy + s * 0.06); g.lineTo(cx + s * d, cy + s * 0.32); g.stroke(); }
}
/** The handheld's green screen: a pixel Poké Ball on a pale green field. */
function gbScreen(g, x, y, w, h) {
  g.fillStyle = G.gbS; g.fillRect(x, y, w, h);
  const cx = x + w / 2, cy = y + h / 2, r = h * 0.34;
  g.fillStyle = G.gbSD; g.beginPath(); g.arc(cx, cy, r, Math.PI, TAU); g.fill();
  g.fillStyle = '#8bac0f'; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI); g.fill();
  g.fillStyle = '#0f380f'; g.fillRect(cx - r, cy - r * 0.12, r * 2, r * 0.24);
  g.beginPath(); g.arc(cx, cy, r * 0.32, 0, TAU); g.fill();
  g.fillStyle = G.gbS; g.beginPath(); g.arc(cx, cy, r * 0.16, 0, TAU); g.fill();
}
/** The Pokédex's screen: pale blue, a Pokémon's white silhouette and a line of data. */
function dexScreen(g, x, y, w, h) {
  g.fillStyle = G.dexS; g.fillRect(x, y, w, h);
  oval(x + w * 0.34, y + h * 0.5, w * 0.18, h * 0.3, '#ffffff');
  oval(x + w * 0.34, y + h * 0.18, w * 0.1, h * 0.12, '#ffffff');
  g.fillStyle = '#3a6ad8'; for (let i = 0; i < 3; i++) g.fillRect(x + w * 0.6, y + h * (0.24 + i * 0.22), w * (0.3 - i * 0.06), h * 0.1);
}
/** A row of game case spines in a shelf, each its colour, a pale band and a dark logo square; `seed` picks the run. */
const spines = (seed) => (g, x, y, w, h) => {
  const cols = [G.canB, G.red, G.white, G.canG, G.vio, G.chipY, G.blackL, G.mag, G.cyan];
  g.fillStyle = G.black; g.fillRect(x, y, w, h);
  for (let sx = x, i = 0; sx < x + w - 0.6; i++) {
    const sw = Math.min(1.6 + hash(i, seed, 1) * 1.4, x + w - sx), c = cols[Math.floor(hash(i, seed, 2) * cols.length)];
    g.fillStyle = c; g.fillRect(sx + 0.1, y + 0.3, sw - 0.2, h - 0.6);
    g.fillStyle = sh(c, 2); g.fillRect(sx + 0.1, y + h * 0.18, sw - 0.2, h * 0.08);
    g.fillStyle = sh(c, -2); g.fillRect(sx + sw * 0.3, y + h * 0.7, sw * 0.4, sw * 0.4);
    sx += sw;
  }
};
/** The poster: LEVEL UP in magenta over a cyan gamepad on a violet burst. */
function poster(g, x, y, w, h) {
  const cx = x + w / 2, cy = y + h * 0.56;
  g.fillStyle = '#1a1030'; g.fillRect(x, y, w, h);
  g.fillStyle = '#3a1f6a';
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, h, a, a + TAU / 24); g.closePath(); g.fill(); }
  g.fillStyle = G.mag; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `bold ${h * 0.14}px ${SANS}`; g.fillText('LEVEL', cx, y + h * 0.13, w * 0.9);
  g.fillText('UP!', cx, y + h * 0.27, w * 0.9);
  const s = w * 0.9;
  g.fillStyle = G.cyan;
  g.beginPath(); g.ellipse(cx, cy + h * 0.08, s * 0.36, s * 0.17, 0, 0, TAU); g.fill();
  for (const sg of [-1, 1]) { g.beginPath(); g.ellipse(cx + sg * s * 0.27, cy + h * 0.16, s * 0.13, s * 0.17, sg * 0.4, 0, TAU); g.fill(); }
  g.fillStyle = '#1a1030';
  g.fillRect(cx - s * 0.27, cy + h * 0.06, s * 0.14, s * 0.045); g.fillRect(cx - s * 0.222, cy + h * 0.06 - s * 0.048, s * 0.045, s * 0.14);
  for (const [dx, dy] of [[0.22, -0.05], [0.29, 0], [0.22, 0.05], [0.15, 0]]) { g.beginPath(); g.arc(cx + s * dx, cy + h * 0.08 + s * dy, s * 0.028, 0, TAU); g.fill(); }
  g.fillStyle = G.white; g.font = `bold ${h * 0.07}px ${SANS}`; g.fillText('PRESS START', cx, y + h * 0.9, w * 0.9);
}

/* ---------- the kinds ---------- */

/** What js/base-models-gamer.js builds for each upright and wall kind: its parts, doors and default material. */
export const BUILT = {};
/** The rug's outline from above, in painted units across its 3 x 2 tiles, corners rounded off. */
export const RUG = [[8, 2], [88, 2], [92, 3.5], [94, 8], [94, 56], [92, 60.5], [88, 62], [8, 62], [4, 60.5], [2, 56], [2, 8], [4, 3.5]];

function piece(id, name, w, h, price, mat, parts, { doors = [], inside, ...rest } = {}) {
  BUILT[id] = { parts, doors, inside, mat };
  const all = [...parts, ...doors.flatMap(d => d.parts)];
  return { id, name, group: GROUP, solo: true, w, h, price, ...rest, draw(x, b, vw, dir) { floorShadow(x, b, vw); paintParts(all, x, b, vw, dir, w * 32); } };
}
function wallPiece(id, name, w, price, mat, parts, rest = {}) {
  BUILT[id] = { parts, doors: [], mat };
  return { id, name, group: GROUP, solo: true, w, h: 1, layer: 'wall', price, ...rest, wall(x) { paintParts(parts, x, 96, w * 32, 0, w * 32); } };
}

const NEON = [G.cyan, G.mag, G.vio];

export const GAMER_KINDS = [
  // the battlestation: a black desk with a cyan strip under its edge, three monitors (Porygon-Z on the left one, the
  // game in the middle, the stream's chat on the right) with a magenta glow behind, an RGB keyboard, a mouse and a can
  piece('gmrdesk', 'Gamer battlestation desk', 2, 1, 1450, 'gloss', [
    ...[4, 60].map(x => B(x, 14, 0, 4, 28, 26, G.black, MT)),
    B(32, 20, -10, 54, 4, 2, G.grD, MT),
    B(32, 29, 0, 64, 2, 28, G.blackL, GL),
    B(32, 27.6, 13.6, 60, 0.8, 0.6, G.cyan, GW),
    B(30, 30.6, 6, 22, 1.2, 7, G.black, GL), B(30, 31.3, 6.4, 20, 0.2, 5.4, G.vio, GW),
    B(48, 30.2, 6, 13, 0.4, 10, G.grD, CL), S(48, 31, 6, 1.4, 0.9, 2.2, G.black, { m: 'gloss', seg: 8 }),
    ...can(57, 30, 1, G.canG),
    B(32, 46, -7.4, 30, 20, 0.4, G.mag, GW),
    B(32, 30.5, -8, 10, 1, 6, G.grD, MT), B(32, 36, -10, 2, 11, 1.6, G.grD, MT),
    B(32, 46, -6, 26, 16, 1.6, G.black, GL), PC(32, 46, -5.1, 24, 14, battleScreen),
    ...[10, 54].flatMap(x => [B(x, 30.5, -5, 8, 1, 5, G.grD, MT), B(x, 35, -7, 2, 9, 1.6, G.grD, MT), B(x, 45, -4, 18, 14, 1.6, G.black, GL)]),
    PC(10, 45, -3.1, 16, 12, porygonZ), PC(54, 45, -3.1, 16, 12, chatScreen),
  ], { glow: NEON }),

  // a tower PC turned to show its glass side: three violet-lit fans, a graphics card with a cyan strip, magenta RAM
  piece('gmrtower', 'Gamer glass tower PC', 1, 1, 1200, 'gloss', [
    ...[8, 24].map(x => B(x, 1, 0, 4, 2, 22, G.grD, PL)),
    B(16, 25, -10, 22, 46, 2, G.black, GL),
    B(16, 47.2, 0, 22, 1.6, 22, G.black, GL), B(16, 2.8, 0, 22, 1.6, 22, G.black, GL),
    ...[5.6, 26.4].map(x => B(x, 25, 0, 1.2, 46, 22, G.black, GL)),
    B(19, 28, -8.4, 13, 32, 0.6, G.grD, PL),
    B(19, 20, -2, 13, 3.4, 12, G.blackL, GL), B(19, 20, 4.2, 11, 0.6, 0.4, G.cyan, GW),
    ...[18.6, 20.4, 22.2].map(x => B(x, 36, -6, 0.8, 8, 3, G.mag, GW)),
    DS(18, 30, -6.4, 2.6, 2, G.grL, { m: 'metal', seg: 12 }),
    ...[11, 24, 37].flatMap(h => [RG(10.4, h, 7, 3.8, 0.6, G.vio, { m: 'glow' }), DS(10.4, h, 6.6, 3.2, 0.6, G.grD, { m: 'plain', seg: 12 }), DS(10.4, h, 7, 1, 0.8, G.blackL, { m: 'gloss', seg: 8 })]),
    B(16, 25, 10.6, 20, 42, 0.4, '#cfe8f4', { m: 'glass' }),
    B(16, 47.2, 8.6, 6, 0.4, 2, G.cyan, GW),
  ], { glow: NEON }),

  // the streaming rig on a tripod: a ring light lit white round a phone holder, a webcam on top, a mic on its arm
  // behind a pop filter
  piece('gmrstream', 'Gamer streaming rig', 1, 1, 980, 'gloss', [
    RD([16, 10, 0], [5, 0.6, 6], 0.8, G.black, MT), RD([16, 10, 0], [27, 0.6, 6], 0.8, G.black, MT), RD([16, 10, 0], [16, 0.6, -10], 0.8, G.black, MT),
    RD([16, 10, 0], [16, 56.4, 0], 0.9, G.black, MT),
    RG(16, 60, -0.8, 8.4, 1.9, G.blackL, GL),
    RG(16, 60, 0, 8.4, 1.6, G.ring, GW),
    B(16, 60, 0.4, 4, 7.4, 0.6, G.black, GL),
    RD([16, 69.6, 0], [16, 70.6, 0], 0.5, G.black, MT),
    B(16, 71.8, 0, 5.4, 2.6, 2.6, G.black, GL), DS(16, 71.8, 1.4, 0.9, 0.3, G.cyan, { m: 'glow', seg: 8 }),
    RD([16, 40, 0], [24, 47, 3], 0.5, G.black, MT), RD([24, 47, 3], [27, 41, 4], 0.5, G.black, MT),
    C(27, 37, 4.6, 1.6, 7, G.black, { m: 'gloss', seg: 10 }),
    RG(27, 37, 4.6, 2.2, 0.3, G.grL, { m: 'metal', flat: true }),
    DS(27, 37, 7.6, 2.6, 0.3, G.blackL, { m: 'cloth', seg: 12 }),
  ], { glow: [G.ring, G.cyan] }),

  // a big flat TV on a low black media cabinet: Gengar's shadow on its screen, a white console and a slim black one
  // with a violet strip, a pad on top, speaker grilles and a magenta glow underneath
  piece('gmrtv', 'Gamer big-screen TV', 2, 1, 1350, 'gloss', [
    ...[4, 60].map(x => B(x, 1, 2, 4, 2, 20, G.grD, PL)),
    B(32, 2.2, 12.6, 54, 0.6, 0.4, G.mag, GW),
    B(32, 8, 2, 62, 12, 22, G.black, GL),
    ...[13, 51].map(x => B(x, 8, 13.1, 20, 9, 0.4, G.grD, { m: 'plain', tex: 'mesh' })),
    B(18, 15.5, 3, 14, 3, 11, G.white, GL), DS(12.4, 15.5, 8.6, 0.5, 0.3, G.cyan, { m: 'glow', seg: 6 }),
    B(46, 19, 0, 4, 10, 12, G.black, GL), B(46, 19, 6.1, 0.6, 9, 0.3, G.vio, GW),
    ...padFlat(32, 14, 8, G.white),
    B(32, 18.5, -7, 8, 9, 3, G.grD, MT),
    B(32, 39, -6, 60, 34, 1.6, G.black, GL), PC(32, 39, -5.1, 57, 31, gengarTV),
  ], { glow: NEON }),

  // a sim-racing rig on a black frame: a red-trimmed bucket seat at the back, the wheel on its deck in front with a
  // cyan hub, pedals at the front, cyan glow along the rails
  piece('gmrsimrig', 'Gamer sim-racing rig', 1, 2, 1500, 'metal', [
    ...[4, 28].map(x => RD([x, 2, -28], [x, 2, 28], 1.2, G.black, MT)),
    ...[-28, 24].map(z => RD([4, 2, z], [28, 2, z], 1.2, G.black, MT)),
    ...[3, 29].map(x => RD([x, 0.6, -26], [x, 0.6, 26], 0.4, G.cyan, GW)),
    B(16, 6, -14, 18, 6, 14, G.grD, MT),
    B(16, 11, -12, 22, 4, 18, G.black, { m: 'cloth', tex: 'quilt' }),
    B(16, 26, -21, 22, 28, 4, G.black, { m: 'cloth', tex: 'quilt' }),
    ...[4.6, 27.4].flatMap(x => [B(x, 13.6, -12, 3, 5, 18, G.red, CL), B(x, 26, -19.6, 3, 26, 6, G.red, CL)]),
    B(16, 30, -18.8, 6, 18, 0.4, G.red, PL),
    RD([16, 2, 8], [16, 20, 8], 1.2, G.black, MT),
    B(16, 21, 8, 14, 2, 8, G.grD, MT),
    B(16, 24.5, 6, 7, 5, 8, G.black, GL),
    RG(16, 28, 1.6, 6.4, 0.9, G.black, GL), RD([9.6, 28, 1.6], [22.4, 28, 1.6], 0.6, G.grL, MT), RD([16, 28, 1.6], [16, 21.6, 1.6], 0.6, G.grL, MT),
    DS(16, 28, 1.6, 1.8, 1.2, G.cyan, { m: 'glow', seg: 10 }),
    B(16, 4, 22, 14, 3, 6, G.grD, MT),
    ...[11, 16, 21].map(x => B(x, 7, 21, 2.6, 5, 1, G.steelL, MT)),
  ], { glow: [G.cyan] }),

  // a VR headset on a round stand, white with a cyan strip across its visor, its two ring controllers hung either side
  piece('gmrvr', 'Gamer VR headset stand', 1, 1, 640, 'gloss', [
    C(16, 1, 0, 7, 2, G.black, { m: 'metal', seg: 18 }),
    C(16, 20, 0, 1.6, 36, G.grL, { m: 'metal', seg: 10 }),
    S(16, 43, -1, 5, 6, 5.4, G.grD, { m: 'gloss', seg: 12 }),
    RG(16, 44, -1, 6.2, 0.8, G.black, { m: 'cloth', flat: true }),
    RG(16, 44, -1, 6, 0.7, G.black, { m: 'cloth', a0: 0, arc: Math.PI, ax: 'x' }),
    B(16, 44, 4, 15, 7.6, 6, G.white, GL), B(16, 44, 7.1, 13, 1, 0.3, G.cyan, GW),
    RD([8, 32, 0], [24, 32, 0], 0.4, G.grL, MT),
    ...[7, 25].flatMap(x => [RG(x, 28, 0, 3, 0.9, G.white, GL), RD([x, 25, 0], [x, 18, 1.6], 1.3, G.black, GL)]),
  ], { glow: [G.cyan] }),

  // a black mini fridge of energy drinks behind a glass door: green, orange, blue and pink cans on cyan-lit shelves
  piece('gmrfridge', 'Gamer energy drink fridge', 1, 1, 820, 'gloss', [
    B(16, 1, -1, 26, 2, 24, G.black, PL),
    B(16, 19, -11.6, 28, 34, 1.6, G.black, GL),
    ...[2.8, 29.2].map(x => B(x, 19, -1, 2.4, 34, 23, G.black, GL)),
    B(16, 37, -1, 28, 2.4, 24, G.blackL, GL),
    B(16, 3.4, -1, 24, 1.2, 22, G.grD, MT),
    ...[14, 25].map(h => B(16, h, -1, 24, 0.8, 20, G.steelL, MT)),
    B(16, 35.2, 1, 22, 0.6, 14, G.cyan, GW),
    ...[[4, G.canG], [14.4, G.canO], [25.4, G.canB]].flatMap(([h, c], row) => [7, 12.4, 17.8, 23.2].flatMap((x, i) => can(x, h, 2, i % 2 && row !== 1 ? G.canP : c))),
  ], {
    doors: [{ hinge: [2.8, 11.2], side: 1, parts: [
      ...[4, 28].map(x => B(x, 19, 12, 2.4, 34, 1.6, G.black, GL)),
      ...[34.8, 3.4].map(h => B(16, h, 12, 26, 2.4, 1.6, G.black, GL)),
      B(16, 19, 12, 21.6, 30, 0.4, '#cfe8f4', { m: 'glass' }),
      B(4.6, 19, 12.9, 0.5, 30, 0.3, G.mag, GW),
      ...[14, 24].map(h => RD([25.6, h, 12.8], [25.6, h, 14], 0.4, G.steelL, MT)), RD([25.6, 14, 14], [25.6, 24, 14], 0.6, G.steelL, MT),
    ] }],
    inside: { x: 16, h: 19, w: 22, hh: 30, z: -10.6, bare: true },
    glow: [G.cyan, G.mag],
  }),

  // the network tower, its cables in a braided sleeve tied in cyan: a modem, a switch and a drive box on open shelves,
  // the router on top with four antennas
  piece('gmrrouter', 'Gamer router tower', 1, 1, 560, 'metal', [
    ...[9, 23].flatMap(x => [-5, 5].map(z => RD([x, 0, z], [x, 34, z], 0.6, G.black, MT))),
    ...[2, 12, 22, 33].map(h => B(16, h, 0, 16, 1, 12, G.grD, MT)),
    B(16, 6.6, 0, 12, 8, 9, G.blackL, GL), ...[12, 14, 16, 18, 20].map(x => DS(x, 8, 4.6, 0.4, 0.3, G.cyan, { m: 'glow', seg: 6 })),
    B(16, 14.6, 0, 13, 4, 9, G.black, GL), ...[11, 13, 15, 17, 19, 21].map(x => DS(x, 14.6, 4.6, 0.35, 0.3, G.mag, { m: 'glow', seg: 6 })),
    B(16, 27, 0, 10, 9, 9, G.gr, GL), ...[24.6, 27, 29.4].map(h => B(16, h, 4.6, 8, 1.2, 0.3, G.vio, GW)),
    B(16, 35, 0, 14, 3, 10, G.black, GL), B(16, 35, 5.1, 12, 0.6, 0.3, G.cyan, GW),
    ...[[10, 6, -3], [14, 13, -4], [18, 19, -4], [22, 26, -3]].map(([x0, x1, z]) => RD([x0, 36.4, z], [x1, 50, z], 0.5, G.black, GL)),
    RD([27, 0.6, -4], [27, 33, -4], 1, G.black, CL),
    ...[8, 18, 28].map(h => RG(27, h, -4, 1.2, 0.3, G.cyan, { m: 'glow', flat: true })),
  ], { glow: NEON }),

  // a racing-style gaming chair: black quilted seat and back with red bolsters, a red headrest and lumbar pillow, on a
  // five-star base of castors
  piece('gmrchair', 'Gamer racing chair', 1, 1, 900, 'cloth', [
    ...Array.from({ length: 5 }, (_, i) => { const a = i / 5 * TAU + 0.3, x = 16 + Math.sin(a) * 12, z = Math.cos(a) * 12; return [RD([16, 3, 0], [x, 2.6, z], 0.9, G.black, GL), S(x, 1.4, z, 1.4, 1.4, 1.4, G.blackL, { m: 'gloss', seg: 8 })]; }).flat(),
    C(16, 6, 0, 2, 4, G.black, { m: 'gloss', seg: 10 }), C(16, 11, 0, 1.4, 8, G.steel, { m: 'metal', seg: 10 }),
    B(16, 15.4, 0, 18, 2, 16, G.grD, MT),
    B(16, 18, 1, 20, 4, 20, G.black, { m: 'cloth', tex: 'quilt' }),
    ...[5.6, 26.4].flatMap(x => [B(x, 19.4, 1, 3.2, 5, 20, G.red, CL), B(x, 35, -8, 3.2, 30, 6, G.red, CL)]),
    B(16, 37, -9, 20, 34, 4, G.black, { m: 'cloth', tex: 'quilt' }),
    B(16, 49, -6.4, 9, 5, 2.4, G.red, CL), B(16, 25, -6.4, 10, 5, 2.4, G.red, CL),
    ...[2.4, 29.6].flatMap(x => [B(x, 21, 0, 2, 8, 2.4, G.grD, MT), B(x, 25.8, 1, 3, 1.6, 10, G.blackL, GL)]),
  ]),

  // a deep graphite couch for two players: magenta piping on its seat cushions, a violet cushion, cyan glow under it
  piece('gmrsofa', 'Gamer couch', 2, 1, 1100, 'cloth', [
    ...[5, 59].map(x => B(x, 1, 0, 4, 2, 22, G.black, PL)),
    B(32, 1.6, 12.4, 54, 0.8, 0.4, G.cyan, GW),
    B(32, 5, 0, 60, 6, 26, G.grD, CL),
    ...[18, 46].flatMap(x => [B(x, 11, 2, 26, 6, 22, G.gr, CL), B(x, 13.6, 13.1, 26, 0.5, 0.4, G.mag, PL)]),
    B(32, 22, -10, 60, 22, 6, G.gr, CL),
    ...[3, 61].map(x => B(x, 13, 0, 6, 18, 26, G.grD, CL)),
    B(11, 19, -5, 9, 9, 3, G.vio, CL),
  ], { glow: [G.cyan] }),

  // a big black bean bag slumped into a seat, a cyan glowing seam round its middle
  piece('gmrbeanbag', 'Gamer bean bag', 1, 1, 420, 'cloth', [
    S(16, 9.5, 1, 14.5, 9.5, 14, G.black, { m: 'cloth', seg: 16 }),
    S(16, 16, -6, 12, 9, 7, G.black, { m: 'cloth', seg: 14 }),
    RG(16, 7, 1, 14, 0.4, G.cyan, { m: 'glow', flat: true }),
  ], { glow: [G.cyan] }),

  // a floor rocker for console marathons: a black curved shell, a graphite seat pad, speakers in its wings and a
  // magenta strip along its top
  piece('gmrrocker', 'Gamer floor rocker', 1, 1, 380, 'cloth', [
    WG(16, 0, 0, 24, [[12, 3], [9, 0.6], [2, 0], [-6, 0.6], [-11, 3], [-13, 26], [-9, 27], [-6, 10], [11, 7.4]], G.black, CL),
    B(16, 9.6, 2, 22, 2, 14, G.gr, CL),
    ...[3.6, 28.4].map(x => DS(x, 20, -10, 2.2, 0.6, G.grL, { m: 'gloss', ax: 'x', seg: 12 })),
    B(16, 26.8, -11, 24.4, 0.6, 3, G.mag, GW),
  ], { glow: [G.mag] }),

  // a three-tier rolling snack cart: cans and a pink can case below, crisps in the middle, cup noodles and a jar of
  // gummies on top
  piece('gmrsnack', 'Gamer snack cart', 1, 1, 520, 'metal', [
    ...[4, 28].flatMap(x => [-9, 9].map(z => RD([x, 3, z], [x, 30, z], 0.6, G.black, MT))),
    ...[4, 28].flatMap(x => [-9, 9].map(z => S(x, 1.4, z, 1.4, 1.4, 1.4, G.blackL, { m: 'gloss', seg: 8 }))),
    ...[4, 15, 26].map(h => B(16, h, 0, 26, 1, 20, G.grD, MT)),
    ...can(8, 4.5, 2, G.canB), ...can(13, 4.5, 0, G.canO),
    B(22, 8.5, 0, 9, 7, 12, G.canP, GL),
    B(9, 19.5, 0, 7, 8, 3, G.chipY, GL), B(16, 19.2, 1.6, 7, 7.4, 3, G.chipR, GL), B(23, 19.6, -1, 7, 8.2, 3, G.chipG, GL),
    ...[8, 15].flatMap(x => [LA(x, 26.5, 0, [[2.2, 0], [3, 6], [3.1, 6.4]], G.white, { m: 'gloss', seg: 12 }), C(x, 30.6, 0, 2.9, 1.2, G.red, { m: 'plain', seg: 12 })]),
    LA(23, 26.5, 0, [[3, 0], [3.2, 7], [2.4, 8]], '#cfe8f4', { m: 'glass', seg: 12 }),
    ...[[22, 28.4, G.mag], [24, 29, G.canG], [23, 31, G.cyan], [21.8, 31.6, G.chipY]].map(([x, h, c]) => S(x, h, 0, 1, 1, 1, c, { m: 'gloss', seg: 6 })),
    C(23, 35, 0, 2.6, 1.2, G.mag, { m: 'gloss', seg: 12 }),
    RD([30, 28, -9], [30, 28, 9], 0.6, G.black, MT),
  ]),

  // a low black coffee table with a glass top lit violet round its edge, a pad and a can on it
  piece('gmrtable', 'Gamer LED coffee table', 2, 1, 640, 'gloss', [
    B(32, 8, 0, 54, 14, 22, G.black, GL),
    B(32, 0.8, 0, 50, 0.6, 18, G.cyan, GW),
    B(32, 8, 11.2, 46, 8, 0.4, G.grD, PL),
    B(32, 16, 0, 60, 1.2, 26, '#cfe8f4', { m: 'glass' }),
    B(32, 16, 13.2, 60, 1.2, 0.4, G.vio, GW),
    ...padFlat(24, 16.6, 2, G.black),
    ...can(42, 16.6, -3, G.canO),
  ], { glow: [G.cyan, G.vio] }),

  // the retro corner: a little white table with a Game Boy-style handheld on an acrylic stand, a red Pokédex beside it
  // and a rack of cartridges on the shelf below
  piece('gmrretro', 'Gamer retro handheld corner', 1, 1, 760, 'gloss', [
    ...[4, 28].flatMap(x => [-8, 8].map(z => B(x, 6, z, 2, 12, 2, G.grD, MT))),
    B(16, 4, 0, 26, 1, 20, G.grD, MT),
    ...[8, 12, 16, 20, 24].map((x, i) => B(x, 7, 0, 3.4, 4, 4, [G.gb, G.red, G.canB, G.gb, G.canG][i], GL)),
    B(16, 13, 0, 28, 2, 22, G.white, GL),
    B(12, 14.4, 2, 10, 0.8, 8, '#cfe8f4', { m: 'glass' }),
    B(12, 22, 1.4, 9, 14, 2.2, G.gb, GL),
    B(12, 25, 2.6, 7, 5.6, 0.2, G.gbD, PL), PC(12, 25, 2.8, 5.4, 4.4, gbScreen),
    B(9.8, 19.4, 2.6, 2.2, 0.7, 0.4, G.black, PL), B(9.8, 19.4, 2.6, 0.7, 2.2, 0.4, G.black, PL),
    DS(14, 19.6, 2.7, 0.7, 0.4, G.redD, { m: 'gloss', seg: 8 }), DS(15.4, 20.4, 2.7, 0.7, 0.4, G.redD, { m: 'gloss', seg: 8 }),
    B(23, 14.4, 0, 9, 0.8, 5, G.black, GL),
    B(23, 20, 0, 8, 11, 2.4, G.dex, GL), B(19.4, 20, 0, 0.8, 11, 2.6, G.dexD, PL),
    PC(23.4, 21, 1.25, 5.4, 4.2, dexScreen),
    DS(21, 24.4, 1.4, 0.8, 0.3, G.cyan, { m: 'glow', seg: 8 }),
  ], { glow: [G.cyan] }),

  // an open black shelf of gamepads, each upright on its shelf in its colour, violet light under every shelf
  piece('gmrpads', 'Gamer controller display shelf', 1, 1, 580, 'gloss', [
    ...[2, 30].map(x => B(x, 22.4, 0, 2, 44.8, 14, G.black, GL)),
    B(16, 22.4, -6.4, 28, 44.8, 1.2, G.grD, PL),
    ...[1, 15, 29, 44].map(h => B(16, h, 0, 28, 1.2, 14, G.black, GL)),
    ...[14.2, 28.2, 43.2].map(h => B(16, h, 6.6, 26, 0.4, 0.4, G.vio, GW)),
    ...[[9, 6.8, G.white], [23, 6.8, G.black], [9, 20.8, G.red], [23, 20.8, G.canB], [9, 34.8, G.pika], [23, 34.8, G.vio]].flatMap(([x, h, c]) => pad(x, h, 0, c)),
  ], { glow: [G.vio] }),

  // a tall shelf packed with game cases, their painted spines in every colour, a gold trophy on top
  piece('gmrgames', 'Gamer game case shelf', 1, 1, 620, 'gloss', [
    ...[2, 30].map(x => B(x, 26, 0, 2, 52, 16, G.black, GL)),
    B(16, 26, -7.4, 28, 52, 1.2, G.grD, PL),
    ...[1, 13.5, 26, 38.5, 51.4].map(h => B(16, h, 0, 28, 1.2, 16, G.black, GL)),
    ...[1.6, 14.1, 26.6, 39.1].flatMap((h, i) => [B(16, h + 5.6, -0.5, 26, 10.6, 12, G.blackL, PL), PC(16, h + 5.6, 5.55, 26, 10.6, spines(i + 3))]),
    LA(16, 52, 0, [[3, 0], [3, 1.4], [1, 2], [0.8, 4.2], [3, 6], [3.2, 9.6], [2.8, 10]], G.gold, { m: 'metal', seg: 12 }),
  ]),

  // a headset stand wearing a Pikachu headset: yellow band and ears tipped black, red cheek ear cups, a mic boom
  piece('gmrheadset', 'Gamer Pikachu headset stand', 1, 1, 480, 'gloss', [
    C(16, 1, 0, 6, 2, G.black, { m: 'metal', seg: 16 }),
    C(16, 14, 0, 1.4, 24, G.grL, { m: 'metal', seg: 10 }),
    B(16, 27, 0, 8, 2, 3, G.black, GL),
    RG(16, 26, 0, 8, 1.5, G.pika, { m: 'gloss', a0: 0, arc: Math.PI }),
    PR(10.9, 31.6, 0, [[-1.6, 0], [1.6, 0], [-3.4, 9]], 1.6, G.pika, GL), PR(10.9, 31.6, 0, [[-2.6, 5.4], [-1.6, 5.4], [-3.4, 9]], 1.8, G.black, GL),
    PR(21.1, 31.6, 0, [[-1.6, 0], [1.6, 0], [3.4, 9]], 1.6, G.pika, GL), PR(21.1, 31.6, 0, [[1.6, 5.4], [2.6, 5.4], [3.4, 9]], 1.8, G.black, GL),
    ...[[8, 10, 5.8], [24, 22, 26.2]].flatMap(([x, xi, xo]) => [DS(x, 22, 0, 4.4, 3, G.pika, { m: 'gloss', ax: 'x', seg: 14 }), DS(xi, 22, 0, 3.8, 1, G.black, { m: 'cloth', ax: 'x', seg: 12 }), DS(xo, 22, 0, 3.2, 1, G.pikaR, { m: 'gloss', ax: 'x', seg: 12 })]),
    RD([6, 20, 2], [10, 15, 8], 0.4, G.black, GL), S(10.4, 14.6, 8.4, 0.9, 0.9, 0.9, G.black, { m: 'gloss', seg: 6 }),
  ]),

  // a set of LED hexagon panels on the wall in cyan, magenta and violet, each a glowing ring round a dark middle
  wallPiece('gmrhex', 'Gamer LED hex panels', 2, 720, 'gloss', [
    ...[[18, 57], [28.4, 57], [38.8, 57], [49.2, 57], [23.2, 66], [33.6, 66], [44, 66], [38.8, 75]].flatMap(([x, h], i) => [
      PR(x, h, 0.4, hex(5.8), 0.8, G.black, GL), PR(x, h, 1.1, hex(5), 0.6, NEON[i % 3], GW), PR(x, h, 1.5, hex(3.4), 0.4, G.blackL, GL),
    ]),
  ], { glow: NEON }),

  // a poster on the wall in a graphite frame: LEVEL UP! over a cyan gamepad, PRESS START below
  wallPiece('gmrposter', 'Gamer LEVEL UP poster', 1, 280, 'plain', [
    B(16, 60, 0.4, 24, 32, 0.8, G.grD, GL),
    PC(16, 60, 0.85, 22, 30, poster),
  ]),

  // a neon GG on a black acrylic board edged magenta
  wallPiece('gmrgg', 'Gamer neon GG sign', 1, 680, 'gloss', [
    B(16, 62, 0.2, 29.4, 21.4, 0.4, G.mag, GW),
    B(16, 62, 0.6, 28, 20, 0.8, G.black, GL),
    ...letters('GG', [10, 22], 56, 1.4, 0.9, 0.7, G.cyan, GW),
  ], { glow: [G.cyan, G.mag] }),

  // an LED hoop lamp for the desk: a cyan hoop round a magenta one on a black puck
  piece('gmrlamp', 'Gamer LED hoop lamp', 1, 1, 340, 'gloss', [
    C(16, 1.2, 0, 6, 2.4, G.black, { m: 'metal', seg: 16 }),
    B(16, 4, 0, 2, 4, 2, G.grD, MT),
    RG(16, 15, 0, 9, 1.4, G.cyan, GW),
    RG(16, 15, 0, 6.4, 0.8, G.mag, GW),
  ], { glow: [G.cyan, G.mag] }),

  // two light bars for the room's corners on black feet, one magenta and one cyan
  piece('gmrlightbar', 'Gamer RGB light bars', 1, 1, 460, 'glow', [
    ...[[10, -2, 40, G.mag], [23, 3, 30, G.cyan]].flatMap(([x, z, hh, c]) => [
      C(x, 1, z, 4, 2, G.black, { m: 'metal', seg: 12 }),
      C(x, 2 + hh / 2, z, 2.4, hh, c, { m: 'glow', seg: 6 }),
      C(x, 2.6 + hh, z, 2.8, 1.2, G.black, { m: 'gloss', seg: 8 }),
    ]),
  ], { glow: [G.cyan, G.mag] }),

  // a pyramid of energy drink cans stacked on a crate, a gamer's trophy of late nights
  piece('gmrcans', 'Gamer energy can tower', 1, 1, 240, 'metal', [
    B(16, 2, 0, 28, 4, 12, G.grD, MT),
    ...[5, 4, 3, 2, 1].flatMap((n, row) => Array.from({ length: n }, (_, i) => can(16 + (i - (n - 1) / 2) * 5, 4 + row * 7.8, 0, [G.canG, G.canO, G.canB, G.canP][(i + row) % 4])).flat()),
  ]),

  // the room's rug: black with cyan, magenta and violet neon lines round it, a faint hex weave and a violet gamepad
  { id: 'gmrrug', name: 'Gamer RGB rug', group: GROUP, solo: true, w: 3, h: 2, layer: 'rug', price: 600, high: 0.03, side: 'c', glow: NEON, flat() {
    const g = ctx(), path = () => { g.beginPath(); RUG.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
    g.fillStyle = G.black; path(); g.fill();
    g.save(); path(); g.clip();
    g.strokeStyle = G.blackL; g.lineWidth = 0.4;
    for (let row = 0, y = 4; y < 64; row++, y += 5.2) for (let x = (row % 2) * 3; x < 98; x += 6) { g.beginPath(); hex(3).forEach(([px, py], i) => (i ? g.lineTo(x + px, y + py) : g.moveTo(x + px, y + py))); g.closePath(); g.stroke(); }
    g.restore();
    [[6, G.cyan], [8.5, G.mag], [11, G.vio]].forEach(([d, c]) => { g.strokeStyle = c; g.lineWidth = 0.9; g.beginPath(); g.roundRect(d, d, 96 - d * 2, 64 - d * 2, 6); g.stroke(); });
    const cx = 48, cy = 33;
    g.fillStyle = G.vio;
    g.beginPath(); g.ellipse(cx, cy - 2, 17, 8, 0, 0, TAU); g.fill();
    for (const sg of [-1, 1]) { g.beginPath(); g.ellipse(cx + sg * 12, cy + 3, 6.4, 8.4, sg * 0.45, 0, TAU); g.fill(); }
    g.fillStyle = G.black; g.fillRect(cx - 14, cy - 3.2, 8, 2.4); g.fillRect(cx - 11.2, cy - 6, 2.4, 8);
    [[10, -4.6, G.cyan], [13.4, -2, G.mag], [10, 0.6, G.canG], [6.6, -2, G.chipY]].forEach(([dx, dy, c]) => { g.fillStyle = c; g.beginPath(); g.arc(cx + dx, cy + dy, 1.4, 0, TAU); g.fill(); });
    g.fillStyle = G.blackL; for (const dx of [-3, 3]) { g.beginPath(); g.arc(cx + dx, cy + 2.4, 2, 0, TAU); g.fill(); }
  } },
];
