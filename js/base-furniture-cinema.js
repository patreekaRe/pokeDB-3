/* base-furniture-cinema.js  -  the Cinema set (furniture expansion session k, 2026-10-17): a whole room of an old-time
   picture palace, as Animal Crossing's Happy Home Paradise does a room type. Deep red velvet, gold trim and art-deco
   brass on dark walnut, over a dark carpet dotted with gold stars: rows of velvet seats, a VIP loveseat, a silver screen
   between drawn curtains (its picture live), a film projector whose beam lights, a popcorn machine that pops, the
   concession counter, a soda fountain, a hot-dog warmer, the ticket podium and its velvet ropes, a marquee ringed with
   bulbs, an exit sign and deco sconces. Posters of the house's own Pokémon films (Lugia, Jirachi and, coming soon,
   Celebi), Ditto in an usher's cap, Smeargle at the clapperboard and a Pikachu popcorn bucket for the Pokémon touches.
   All solo, fixed colours, sold all year.
   An upright piece is a list of parts in painted units (32 a tile), as in js/base-furniture-ramen.js: `x` across from
   the left of its front, `h` up from the floor (a wall piece's from the foot of its strip), `z` out to the front from
   its middle (a wall piece's from the wall). They're painted here from any side, and js/base-models-cinema.js builds the
   same list as 3D parts (BUILT), so picture and model agree. `tex: 'grain'` is painted only (the model stays plain
   colour). A `pic` part (the posters, the signs' words, the clapperboard) is painted on the front only, and the model
   wears that crop of the painting. The aisle carpet is painted from above (RUG). */

import { sh, oval, ovalShade, floorShadow, ctx, hash, glass as glassPane } from './base-paint.js';

export const CN = {
  red: '#8e1420', redD: '#5c0c16', redL: '#b82432', gold: '#d4a73a', goldL: '#f0d070', goldD: '#8c6a1e',
  black: '#1a1416', blackL: '#3a3236', gun: '#3c4440', walnut: '#4a2a1c', walnutL: '#6a3e28', walnutD: '#2e1a12',
  cream: '#f2e6c8', screen: '#eeeae2', steel: '#a8afb3', steelL: '#cdd3d6', steelD: '#6e767a', can: '#9aa2a6',
  film: '#2a1e18', popcorn: '#fff3cc', butter: '#f2c040', cola: '#4a1c10', sausage: '#b4502c', bun: '#e8b468', cheese: '#f4b82a',
  navy: '#1c1a38', navyD: '#121028', sea: '#1e4a7a', seaD: '#0e2444', night: '#2c1e54', leaf: '#4a9a3a', leafD: '#24502a',
  bulb: '#ffe08a', glowW: '#fff4d0', beam: '#fff2b0', exit: '#38d870',
  candy: ['#e8402c', '#f2c040', '#3a8ad8', '#58b048', '#e870a8', '#f08a1e'],
  ditto: '#c8a2d8', dittoD: '#5a3a6a', pika: '#f6d032', pikaD: '#c89a1a', cheek: '#e8402c',
  smear: '#f2ead2', smearB: '#7a5230', paint: '#4cae4c', lugia: '#f4f6fa', lugiaB: '#3a5a9a', jira: '#f6d84a', celebi: '#a8e070',
};
const GROUP = 'Cinema';
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

/** A film poster's frame: its sky, a scatter of light, a red header band (`head` in gold) and the title under the art. */
function posterFrame(g, x, y, w, h, top, bot, head, title, tag, titleC) {
  g.fillStyle = vgrad(g, x, y, h, top, bot); g.fillRect(x, y, w, h);
  g.fillStyle = 'rgba(255,255,255,0.7)';
  for (let i = 0; i < 16; i++) { const r = 0.2 + hash(i, w | 0, 5) * 0.35; g.beginPath(); g.arc(x + hash(i, 3, 1) * w, y + h * (0.12 + hash(i, 7, 2) * 0.55), r, 0, TAU); g.fill(); }
  g.fillStyle = CN.red; g.fillRect(x, y, w, h * 0.1);
  text(g, head, x + w / 2, y + h * 0.055, h * 0.065, CN.goldL, w * 0.9);
  g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(x, y + h * 0.74, w, h * 0.26);
  text(g, title, x + w / 2, y + h * 0.82, h * 0.1, titleC, w * 0.92);
  text(g, tag, x + w / 2, y + h * 0.92, h * 0.05, CN.goldL, w * 0.92);
  g.strokeStyle = CN.gold; g.lineWidth = 0.5; g.strokeRect(x + 0.6, y + 0.6, w - 1.2, h - 1.2);
}

/** Lugia rising from a dark sea, wings spread under a ring of moonlight: LUGIA, SONG OF THE DEEP. */
function lugiaPoster(g, x, y, w, h) {
  posterFrame(g, x, y, w, h, CN.sea, CN.seaD, 'NOW SHOWING', 'LUGIA', 'SONG OF THE DEEP', CN.lugia);
  const cx = x + w / 2, cy = y + h * 0.44;
  g.fillStyle = 'rgba(255,250,220,0.35)'; g.beginPath(); g.arc(cx, cy - h * 0.12, w * 0.26, 0, TAU); g.fill();
  g.fillStyle = CN.lugia; g.strokeStyle = CN.seaD; g.lineWidth = 0.3;
  for (const s of [-1, 1]) {
    g.beginPath(); g.moveTo(cx + s * w * 0.06, cy - h * 0.04); g.lineTo(cx + s * w * 0.46, cy - h * 0.2); g.lineTo(cx + s * w * 0.42, cy - h * 0.12);
    g.lineTo(cx + s * w * 0.46, cy - h * 0.07); g.lineTo(cx + s * w * 0.38, cy - h * 0.03); g.lineTo(cx + s * w * 0.4, cy + h * 0.02); g.lineTo(cx + s * w * 0.08, cy + h * 0.06); g.closePath(); g.fill(); g.stroke();
  }
  g.beginPath(); g.moveTo(cx - w * 0.06, cy + h * 0.1); g.lineTo(cx, cy + h * 0.26); g.lineTo(cx + w * 0.06, cy + h * 0.1); g.fill();
  g.beginPath(); g.ellipse(cx, cy + h * 0.03, w * 0.11, h * 0.1, 0, 0, TAU); g.fill(); g.stroke();
  g.fillRect(cx - w * 0.03, cy - h * 0.14, w * 0.06, h * 0.1);
  g.beginPath(); g.ellipse(cx, cy - h * 0.16, w * 0.075, h * 0.045, 0, 0, TAU); g.fill(); g.stroke();
  g.fillStyle = CN.lugiaB;
  for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * w * 0.035, cy - h * 0.165, w * 0.02, h * 0.018, 0, 0, TAU); g.fill(); }
  for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse(cx, cy - h * 0.02 + k * h * 0.04, w * 0.035, h * 0.012, 0, 0, TAU); g.fill(); }
  g.fillStyle = 'rgba(160,210,255,0.6)'; g.fillRect(x, y + h * 0.66, w, h * 0.08);
}

/** Jirachi asleep among the stars, its three-pointed crown lit, tags trailing: JIRACHI, A THOUSAND WISHES. */
function jirachiPoster(g, x, y, w, h) {
  posterFrame(g, x, y, w, h, CN.night, CN.navyD, 'NOW SHOWING', 'JIRACHI', 'A THOUSAND WISHES', CN.jira);
  const cx = x + w / 2, cy = y + h * 0.42, r = w * 0.17;
  g.fillStyle = 'rgba(255,240,160,0.3)'; g.beginPath(); g.arc(cx, cy, w * 0.36, 0, TAU); g.fill();
  g.fillStyle = CN.jira; g.strokeStyle = CN.pikaD; g.lineWidth = 0.3;
  g.beginPath();
  [[0, -2.1], [0.6, -0.9], [1.9, -0.7], [0.9, 0.2], [0, 0.6], [-0.9, 0.2], [-1.9, -0.7], [-0.6, -0.9]].forEach(([dx, dy], i) => (i ? g.lineTo(cx + dx * r, cy + dy * r) : g.moveTo(cx + dx * r, cy + dy * r)));
  g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(cx, cy + r * 0.25, r * 0.8, r * 0.7, 0, 0, TAU); g.fill(); g.stroke();
  g.beginPath(); g.ellipse(cx, cy + r * 1.35, r * 0.55, r * 0.6, 0, 0, TAU); g.fill(); g.stroke();
  g.strokeStyle = CN.black; g.lineWidth = 0.35;
  for (const s of [-1, 1]) { g.beginPath(); g.arc(cx + s * r * 0.32, cy + r * 0.2, r * 0.18, 0.2, Math.PI - 0.2); g.stroke(); }
  g.strokeStyle = '#5ab0e8'; g.lineWidth = 0.6;
  for (const [dx, dy] of [[-1.9, -0.7], [0, -2.1], [1.9, -0.7]]) { g.beginPath(); g.moveTo(cx + dx * r, cy + dy * r); g.quadraticCurveTo(cx + dx * r * 1.2, cy + dy * r + r * 0.8, cx + dx * r * 1.05, cy + dy * r + r * 1.4); g.stroke(); }
  g.fillStyle = CN.jira;
  for (let i = 0; i < 5; i++) { const sx = x + w * (0.12 + hash(i, 9, 3) * 0.76), sy = y + h * (0.15 + hash(i, 4, 6) * 0.5); g.beginPath(); for (let k = 0; k < 10; k++) { const a = k / 10 * TAU - Math.PI / 2, rr = k % 2 ? 0.35 : 0.9; g.lineTo(sx + Math.cos(a) * rr, sy + Math.sin(a) * rr); } g.fill(); }
}

/** Celebi among the leaves of an old forest, big blue eyes and glassy wings: COMING SOON, CELEBI, THE FOREST REMEMBERS. */
function celebiPoster(g, x, y, w, h) {
  posterFrame(g, x, y, w, h, CN.leaf, CN.leafD, 'COMING SOON', 'CELEBI', 'THE FOREST REMEMBERS', CN.celebi);
  const cx = x + w / 2, cy = y + h * 0.42, s = w;
  g.fillStyle = CN.leafD;
  for (let i = 0; i < 9; i++) { const lx = x + hash(i, 2, 8) * w, ly = y + h * (0.12 + hash(i, 5, 1) * 0.6); g.beginPath(); g.ellipse(lx, ly, s * 0.06, s * 0.025, hash(i, 1, 1) * 3, 0, TAU); g.fill(); }
  g.fillStyle = 'rgba(220,250,255,0.55)';
  for (const sg of [-1, 1]) { g.beginPath(); g.ellipse(cx + sg * s * 0.2, cy + s * 0.04, s * 0.16, s * 0.08, sg * -0.5, 0, TAU); g.fill(); }
  g.fillStyle = CN.celebi; g.strokeStyle = CN.leafD; g.lineWidth = 0.3;
  g.beginPath(); g.ellipse(cx, cy + s * 0.2, s * 0.08, s * 0.12, 0, 0, TAU); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(cx - s * 0.17, cy); g.quadraticCurveTo(cx - s * 0.18, cy - s * 0.2, cx, cy - s * 0.3); g.quadraticCurveTo(cx + s * 0.18, cy - s * 0.2, cx + s * 0.17, cy); g.quadraticCurveTo(cx, cy + s * 0.12, cx - s * 0.17, cy); g.fill(); g.stroke();
  for (const sg of [-1, 1]) {
    g.strokeStyle = CN.leafD; g.lineWidth = 0.5; g.beginPath(); g.moveTo(cx + sg * s * 0.06, cy - s * 0.24); g.quadraticCurveTo(cx + sg * s * 0.12, cy - s * 0.36, cx + sg * s * 0.18, cy - s * 0.34); g.stroke();
    g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(cx + sg * s * 0.065, cy - s * 0.06, s * 0.055, s * 0.065, 0, 0, TAU); g.fill();
    g.fillStyle = '#3a8ad8'; g.beginPath(); g.ellipse(cx + sg * s * 0.065, cy - s * 0.05, s * 0.04, s * 0.05, 0, 0, TAU); g.fill();
    g.fillStyle = CN.black; g.beginPath(); g.arc(cx + sg * s * 0.065, cy - s * 0.045, s * 0.018, 0, TAU); g.fill();
  }
}

/** A clapperboard's slate: chalk lines on black, the take written in. */
function slate(g, x, y, w, h) {
  g.fillStyle = '#1c1c1e'; g.fillRect(x, y, w, h);
  g.strokeStyle = '#d8d8d4'; g.lineWidth = 0.25; g.beginPath(); g.moveTo(x, y + h * 0.5); g.lineTo(x + w, y + h * 0.5); g.moveTo(x + w * 0.5, y + h * 0.5); g.lineTo(x + w * 0.5, y + h); g.stroke();
  text(g, 'POKé PICTURES', x + w / 2, y + h * 0.26, h * 0.22, '#f0f0ec', w * 0.9);
  text(g, 'SC 7', x + w * 0.25, y + h * 0.76, h * 0.22, '#f0f0ec', w * 0.45);
  text(g, 'TK 3', x + w * 0.75, y + h * 0.76, h * 0.22, '#f0f0ec', w * 0.45);
}
/** A clapper's stripes, black and white on the slant. */
function stripes(g, x, y, w, h) {
  g.fillStyle = '#f0f0ec'; g.fillRect(x, y, w, h); g.fillStyle = '#1c1c1e';
  for (let k = -1; k < w / h + 1; k += 2) { g.beginPath(); g.moveTo(x + k * h, y + h); g.lineTo(x + (k + 1) * h, y + h); g.lineTo(x + (k + 2) * h, y); g.lineTo(x + (k + 1) * h, y); g.closePath(); g.fill(); }
}
/** The marquee's letter board: NOW SHOWING over the feature's name in black on a lit cream panel. */
const marquee = (g, x, y, w, h) => { text(g, 'NOW SHOWING', x + w / 2, y + h * 0.24, h * 0.24, CN.red, w * 0.9); text(g, 'LUGIA', x + w / 2, y + h * 0.66, h * 0.42, CN.black, w * 0.9); };

/* ---------- the kinds ---------- */

/** What js/base-models-cinema.js builds for each upright and wall kind: its parts, doors and default material. */
export const BUILT = {};
/** The aisle carpet's outline from above, in painted units across its 2 x 3 tiles, corners cut. */
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

/** A velvet seat between armrests: its cushion, its tall back in a darker shell, a gold cap along the top. */
const seat = (x, w) => [
  B(x, 8, 0, w - 2, 6, 12, CN.blackL, PL),
  B(x, 12.6, 2, w, 4.4, 18, CN.red, VL(1.6)),
  B(x, 26, -7, w, 24, 4, CN.red, VL(2.2)),
  B(x, 26, -9.6, w + 0.4, 25, 1.2, CN.redD, GL),
  B(x, 38.6, -8, w - 2, 1.2, 4, CN.gold, MT),
];
/** A walnut armrest, its gold cap and a gold seat-number plaque on its front. */
const arm = (x) => [B(x, 9.5, 0, 3, 19, 24, CN.walnut, GL), B(x, 19.6, 1, 3.6, 1.2, 22, CN.gold, MT), DS(x, 13, 12.2, 1, 0.4, CN.gold, { m: 'metal', seg: 8 })];
/** A film reel stood facing the front: its back flange, the dark wound film, a steel rim, a hub and three spokes. */
const reel = (x, h, z, r) => [
  DS(x, h, z - 0.8, r, 0.4, CN.steelD, { m: 'metal', seg: 16 }),
  DS(x, h, z, r * 0.72, 1.4, CN.film, { m: 'plain', seg: 14 }),
  RG(x, h, z + 0.2, r, 0.6, CN.steel, MT),
  DS(x, h, z + 0.6, r * 0.2, 1.4, CN.steelL, { m: 'metal', seg: 8 }),
  ...[0, 1, 2].map(i => { const a = i / 3 * TAU + 0.5; return RD([x + Math.cos(a) * r * 0.2, h + Math.sin(a) * r * 0.2, z + 0.9], [x + Math.cos(a) * r * 0.95, h + Math.sin(a) * r * 0.95, z + 0.9], 0.4, CN.steel, MT); }),
];
const cup = (x, h, z, c = CN.red) => [LA(x, h, z, [[1.3, 0], [1.9, 5], [2, 5.4]], c, { m: 'gloss', seg: 10 }), RD([x + 0.4, h + 5, z], [x + 1.2, h + 8, z - 0.4], 0.25, CN.cream, PL)];

export const CINEMA_KINDS = [
  // a row of three red velvet seats on a black rail, walnut armrests capped in gold, a brass number on each
  piece('cnmseats', 'Cinema velvet seat row', 2, 1, 1100, 'cloth', [
    B(32, 1.5, 0, 62, 3, 18, CN.black, PL),
    ...[12, 32, 52].flatMap(x => seat(x, 16.6)),
    ...[2, 22, 42, 62].flatMap(arm),
  ]),

  // one tip-up velvet seat on cast-iron end standards, a gold scroll on each
  piece('cnmseat', 'Cinema tip-up seat', 1, 1, 380, 'cloth', [
    B(16, 1.5, 0, 26, 3, 16, CN.black, PL),
    ...seat(16, 21),
    ...[3, 29].flatMap(x => [B(x, 10, 0, 3, 20, 24, CN.black, MT), RG(x, 10, 12.3, 2.4, 0.5, CN.gold, MT), B(x, 20.6, 1, 3.6, 1.2, 22, CN.gold, MT)]),
  ]),

  // the VIP loveseat: deep buttoned velvet for two, gold piping, cupholder arms with a soda waiting in each
  piece('cnmvip', 'Cinema VIP velvet loveseat', 2, 1, 1500, 'cloth', [
    B(32, 4, 0, 60, 8, 26, CN.redD, VL(1.2)),
    B(32, 8.2, 13.1, 58, 0.8, 0.6, CN.gold, MT),
    ...[18, 46].map(x => B(x, 12, 2, 26, 6, 22, CN.red, VL(2.4))),
    B(32, 27, -9, 58, 28, 8, CN.red, VL(3)),
    ...[14, 24, 40, 50].flatMap(x => [24, 32].map(h => DS(x, h, -4.9, 0.6, 0.4, CN.gold, { m: 'metal', seg: 6 }))),
    B(32, 41.4, -9, 60, 3, 9, CN.redD, VL(1.4)),
    ...[3.2, 60.8].flatMap(x => [B(x, 12.5, 0, 6.4, 21, 26, CN.red, VL(2.6)), B(x, 23.6, 1, 6.8, 1.2, 24, CN.gold, MT), C(x, 24.6, 8, 1.8, 1, CN.black, { m: 'gloss', seg: 10 }), ...cup(x, 24.4, 8)]),
  ]),

  // the silver screen in a gold proscenium: a black mask round it, red velvet curtains drawn back on gold ropes, a
  // fringed valance over all, on a little walnut stage (its picture plays: a tap changes the reel)
  piece('cnmscreen', 'Cinema silver screen', 3, 1, 1500, 'cloth', [
    B(48, 3, 4, 94, 6, 22, CN.walnut, GRH), B(48, 3, 15.2, 94, 1.2, 0.6, CN.gold, MT),
    ...[3.5, 92.5].flatMap(x => [B(x, 45, -3, 6, 78, 8, CN.gold, MT), B(x, 85, -3, 7, 2, 9, CN.goldL, MT)]),
    B(48, 42, -6, 74, 50, 1, CN.black, PL),
    B(48, 42, -5, 54, 40, 0.8, CN.screen, PL),
    ...[8, 12.2, 16.4, 20.6, 75.4, 79.6, 83.8, 88].map(x => C(x, 41, 0, 2.6, 70, CN.red, { m: 'cloth', sz: 0.6, seg: 10 })),
    ...[[5.4, 23.2], [72.8, 90.6]].map(([a, b]) => RD([a, 34, 1.8], [b, 34, 1.8], 0.6, CN.gold, MT)),
    B(48, 80, 0, 86, 8, 6, CN.redD, VL(1)), B(48, 75.6, 3.2, 84, 1.2, 0.6, CN.gold, PL),
  ]),

  // a film projector on its stand: a gunmetal body and lamp house, brass lens, two reels up on their arms, and a beam
  // of light from the lens (a tap turns it on and off)
  piece('cnmprojector', 'Cinema film projector', 1, 1, 1200, 'metal', [
    C(14, 0.8, 0, 9, 1.6, CN.blackL, { m: 'metal', seg: 14 }),
    C(14, 12, 0, 1.8, 22, CN.blackL, { m: 'metal', seg: 8 }),
    B(14, 23.6, 0, 16, 1.2, 12, CN.black, MT),
    B(14, 30, 0, 18, 12, 10, CN.gun, MT),
    B(5.6, 32, 0, 5, 12, 8, CN.gun, MT), C(5.6, 39.6, 0, 1.6, 3.2, CN.black, { m: 'metal', seg: 8 }),
    B(14, 30, 5.2, 12, 6, 0.4, CN.gold, MT),
    RD([22.6, 30, 0], [27.4, 30, 0], 2, CN.gold, MT),
    S(27.6, 30, 0, 0.6, 1.6, 1.6, CN.glowW, GW),
    PR(27.8, 30, 0, [[0, -1.4], [4, -3.4], [4, 3.4], [0, 1.4]], 2.4, CN.beam, GW),
    RD([10, 36, -2], [9, 42, -2], 0.6, CN.blackL, MT), RD([19, 36, 2], [21, 41, 2], 0.6, CN.blackL, MT),
    ...reel(9, 46, -2, 7.4), ...reel(22, 45, 2, 6.6),
  ], { glow: [CN.glowW, CN.beam] }),

  // a walnut reel cabinet with a stepped deco crown: film reels stood in its slots, a stack of film cans on the middle shelf
  piece('cnmreels', 'Cinema reel cabinet', 1, 1, 640, 'wood', [
    ...[2.5, 29.5].map(x => B(x, 25, 0, 3, 50, 20, CN.walnut, GR)),
    B(16, 25, -9, 26, 48, 1, CN.walnutD, WD),
    ...[1.5, 17, 33, 49].map(h => B(16, h, 0, 30, 2, 20, CN.walnut, WD)),
    B(16, 51, 0, 30, 2, 21, CN.gold, MT),
    PR(16, 52, 0, [[-11, 0], [11, 0], [7, 3], [3, 3], [3, 5], [-3, 5], [-3, 3], [-7, 3]], 14, CN.walnut, WD),
    ...[[9, 9.2], [23, 9.2], [9, 40.4], [23, 40.4]].flatMap(([x, h]) => reel(x, h, 1, 6.2)),
    ...[0, 1, 2].flatMap(k => [C(10, 19.4 + k * 2.6, 1, 6.4, 2.4, k % 2 ? CN.steelL : CN.can, { m: 'metal', seg: 14 }), C(10, 19.4 + k * 2.6, 1, 6.45, 0.8, CN.red, { m: 'plain', seg: 14 })]),
    ...[0, 1].map(k => C(23, 19.4 + k * 2.6, 0, 5.8, 2.4, k ? CN.can : CN.steelL, { m: 'metal', seg: 14 })),
  ]),

  // a red popcorn cart: a glass cabinet framed in gold, the kettle hung over a heap of popcorn, a gold dome and a
  // glowing POPCORN sign up top (a tap pops some)
  piece('cnmpopcorn', 'Cinema popcorn machine', 1, 1, 1100, 'gloss', [
    ...[[5, 6], [27, 6], [5, -6], [27, -6]].map(([x, z]) => S(x, 2, z, 2, 2, 2, CN.black, { m: 'gloss', seg: 8 })),
    B(16, 11, 0, 26, 14, 20, CN.red, GL), B(16, 11, 10.2, 20, 8, 0.4, CN.gold, MT),
    PC(16, 11, 10.5, 18, 6.4, word('POPCORN', CN.red, CN.gold)),
    B(16, 18.6, 0, 27, 1.2, 21, CN.gold, MT),
    B(16, 30.2, 0, 24, 22, 18, '#cfe8f4', { m: 'glass' }),
    S(16, 21.4, 0, 11, 3.4, 8, CN.popcorn, { m: 'cloth', seg: 12 }),
    ...[[11, 23.6, 3], [18, 24, 4], [21, 23.2, -2]].map(([x, h, z]) => S(x, h, z, 2.2, 1.8, 2, CN.popcorn, { m: 'cloth', seg: 8 })),
    LA(16, 31, 0, [[3.6, 0], [5, 1.4], [5, 5], [4.4, 5.4]], CN.steelL, { m: 'metal', seg: 12 }), RD([16, 36.4, 0], [16, 41, 0], 0.5, CN.steel, MT),
    ...[[3.6, 9], [28.4, 9], [3.6, -9], [28.4, -9]].map(([x, z]) => RD([x, 19, z], [x, 41.4, z], 0.6, CN.gold, MT)),
    B(16, 42.2, 0, 27, 1.8, 21, CN.red, GL),
    LA(16, 43.1, 0, [[11, 0], [9, 2.6], [4.4, 4.4], [0, 5]], CN.gold, { m: 'metal', seg: 16 }),
    RD([11, 46, 0], [11, 49, 0], 0.4, CN.gold, MT), RD([21, 46, 0], [21, 49, 0], 0.4, CN.gold, MT),
    B(16, 52, 0, 23, 7, 2, CN.red, GL), B(16, 52, 1.2, 21, 5.4, 0.4, CN.bulb, GW),
    PC(16, 52, 1.5, 20, 5, word('POPCORN', CN.red, null)),
  ], { glow: [CN.bulb] }),

  // the concession counter: dark walnut, a red front panel lettered in gold, a glass case of boxed candy, a black
  // marble top with jars of sweets, boxes on show and a brass till
  piece('cnmcounter', 'Cinema concession counter', 2, 1, 1300, 'wood', [
    B(32, 1.5, 1, 62, 3, 24, CN.black, PL),
    B(32, 16, 0, 62, 26, 26, CN.walnut, GR),
    B(32, 10.6, 13.3, 58, 13, 0.8, CN.red, GL), PC(32, 10.6, 13.75, 40, 6.4, word('CANDY · SNACKS', CN.goldL, CN.red)),
    B(32, 18.4, 13.6, 62, 1.2, 0.6, CN.gold, MT),
    ...[0, 1, 2, 3, 4, 5, 6, 7].map(i => B(6 + i * 7.4, 23.4, 12.2, 5.6, 6.4, 1.6, CN.candy[i % 6], { m: 'gloss', r: 0.4 })),
    B(32, 23.8, 13.6, 60, 9, 0.6, '#cfe8f4', { m: 'glass' }),
    B(32, 29.4, 1, 64, 1.2, 28, CN.gold, MT),
    B(32, 31, 1, 64, 2, 28, '#2a1a14', GL),
    ...[[7, CN.candy[0]], [15, CN.candy[3]]].flatMap(([x, c]) => [S(x, 35, -4, 3.2, 2.6, 3.2, c, { m: 'gloss', seg: 10 }), LA(x, 32, -4, [[3, 0], [3.6, 1], [3.8, 7], [2.6, 8], [2.6, 9]], '#cfe8f4', { m: 'glass', seg: 12 }), C(x, 41.4, -4, 2.8, 1.2, CN.gold, { m: 'metal', seg: 10 })]),
    ...[0, 1, 2].map(i => B(25 + i * 5.6, 35.6, 4, 4.6, 7, 2, CN.candy[(i + 1) % 6], { m: 'gloss', r: 0.4 })),
    B(50, 36, -3, 13, 8, 11, CN.gold, MT), B(50, 41.6, -7, 10, 3.4, 2, CN.black, GL), B(50, 37, 2.8, 11, 3, 1, CN.goldD, MT),
  ]),

  // a three-tier walnut candy stand stacked with bright boxes of sweets, a red CANDY header on top
  piece('cnmcandy', 'Cinema candy stand', 1, 1, 520, 'wood', [
    B(16, 4, 6, 28, 8, 8, CN.walnut, GRH), B(16, 9, -1, 28, 18, 8, CN.walnut, GRH), B(16, 14, -8, 28, 28, 6, CN.walnut, GRH),
    ...[[8, 6], [18, -1], [28, -8]].flatMap(([h, z], t) => [0, 1, 2, 3].map(i => B(6 + i * 6.6, h + 3.5, z, 5.4, 7, 3, CN.candy[(i + t * 2) % 6], { m: 'gloss', r: 0.5 }))),
    ...[[8, 10.1], [18, 3.1], [28, -4.9]].map(([h, z]) => B(16, h - 0.4, z, 28.4, 0.8, 0.4, CN.gold, MT)),
    B(16, 36, -8, 26, 6, 1, CN.red, GL), PC(16, 36, -7.45, 24, 5.4, word('CANDY', CN.goldL, CN.red)),
  ]),

  // a red soda fountain cabinet with a chrome tower of three taps over a drip tray, a lit SODA panel, a stack of cups
  // and one filled with cola (a tap pours)
  piece('cnmsoda', 'Cinema soda fountain', 1, 1, 900, 'gloss', [
    B(16, 1, 0, 26, 2, 20, CN.black, PL),
    B(16, 13, 0, 28, 22, 22, CN.red, GL), B(16, 13, 11.1, 24, 16, 0.4, CN.redD, GL),
    ...[6, 20].map(h => B(16, h, 11.5, 24, 0.8, 0.4, CN.gold, MT)),
    B(16, 25, 0, 30, 2, 24, CN.black, GL),
    B(16, 33, -5, 20, 14, 8, CN.steelL, MT), B(16, 40.6, -5, 22, 1.4, 9, CN.gold, MT),
    B(16, 36.4, -0.8, 16, 5, 0.4, CN.glowW, GW), PC(16, 36.4, -0.5, 15, 4.6, word('SODA', CN.red, null)),
    ...[10, 16, 22].flatMap(x => [RD([x, 31, -1], [x, 31, 2], 0.6, CN.steelL, MT), RD([x, 31, 2], [x, 29.4, 2], 0.5, CN.steelL, MT), C(x, 31.4, 0.6, 0.9, 1.6, CN.black, { m: 'gloss', seg: 8 })]),
    B(16, 26.6, 3, 22, 1.2, 6, CN.steelD, MT),
    ...cup(16, 27.2, 2.4, CN.cream), C(16, 31.6, 2.4, 1.8, 0.4, CN.cola, { m: 'plain', seg: 10 }),
    LA(4.4, 26, 6, [[1.3, 0], [1.9, 7], [2, 7.4]], CN.cream, { m: 'gloss', seg: 10 }), C(4.4, 30, 6, 1.95, 1.4, CN.red, { m: 'plain', seg: 10 }),
  ]),

  // a steel hot-dog warmer: sausages turning on rollers under a glass hood, a red roof with a tray of nachos and a pump
  // of cheese sauce on it (a tap sends up steam)
  piece('cnmhotdog', 'Cinema hot-dog warmer', 1, 1, 820, 'metal', [
    B(16, 1, 0, 26, 2, 18, CN.black, PL),
    B(16, 11, 0, 28, 18, 20, CN.steel, MT), B(16, 13, 10.2, 22, 6, 0.4, CN.red, GL),
    PC(16, 13, 10.5, 20, 5, word('HOT DOGS', CN.goldL, CN.red)),
    B(16, 20.6, 0, 29, 1.2, 21, CN.steelD, MT),
    ...[-5, -1.6, 1.8, 5.2].flatMap(z => [RD([4, 22.6, z], [28, 22.6, z], 0.7, CN.steelD, MT), RD([7, 24, z], [25, 24, z], 0.9, CN.sausage, GL)]),
    B(16, 27.4, 0, 26, 12, 16, '#cfe8f4', { m: 'glass' }),
    B(16, 34, 0, 28, 1.4, 18, CN.red, GL),
    B(8, 35.4, 2, 9, 1.4, 7, CN.black, GL), ...[[6, 1], [9.4, 3], [8, 0], [10, 0.4]].map(([x, z]) => S(x, 36.6, z, 1.6, 0.6, 1.4, CN.cheese, { m: 'cloth', seg: 6 })),
    C(23, 38, -2, 3.2, 6, CN.steelL, { m: 'metal', seg: 12 }), C(23, 41.6, -2, 1, 1.2, CN.black, { m: 'gloss', seg: 8 }), RD([23, 42, -2], [27, 42, 2], 0.6, CN.black, GL),
  ]),

  // the ticket podium: a red deco lectern flared to the top with gold stripes, a roll of tickets and a TICKETS plate
  // (a tap tears one off)
  piece('cnmpodium', 'Cinema ticket podium', 1, 1, 600, 'gloss', [
    B(16, 1.5, 0, 22, 3, 16, CN.black, PL),
    PR(16, 3, 0, [[-8, 0], [8, 0], [10, 27], [-10, 27]], 14, CN.red, GL),
    B(16, 16, 7.2, 1.6, 26, 0.4, CN.gold, MT),
    ...[-1, 1].map(s => RD([16 + s * 3, 4, 7.2], [16 + s * 7, 29, 7.2], 0.4, CN.gold, MT)),
    B(16, 30.4, 0, 22, 1.4, 16, CN.gold, MT),
    B(16, 31.8, 0, 22, 1.6, 16, CN.walnut, GL),
    RD([9, 35.6, 1], [16, 35.6, 1], 2.6, CN.redL, GL), RD([8.4, 35.6, 1], [16.6, 35.6, 1], 0.6, CN.gold, MT),
    B(12.5, 33, 5.4, 4.4, 0.4, 7, CN.cream, PL),
    B(23, 36, -3, 10, 5, 1, CN.black, GL), PC(23, 36, -2.45, 9.4, 4.4, word('TICKETS', CN.goldL, CN.black)),
  ]),

  // a pair of brass stanchions, ball-topped, a red velvet rope swagged between them
  piece('cnmropes', 'Cinema velvet rope stanchions', 2, 1, 560, 'metal', [
    ...[6, 58].flatMap(x => [LA(x, 0, 0, [[6, 0], [6, 1], [3, 2.4], [1.4, 4]], CN.gold, { m: 'metal', seg: 14 }), C(x, 18, 0, 1.2, 28, CN.gold, { m: 'metal', seg: 10 }),
      C(x, 31.6, 0, 1.8, 1.2, CN.goldD, { m: 'metal', seg: 10 }), S(x, 34, 0, 2.2, 2.2, 2.2, CN.goldL, MT)]),
    ...Array.from({ length: 8 }, (_, i) => {
      const at = (k) => { const x = 8.4 + k / 8 * 47.2, t = (x - 32) / 23.6; return [x, 29.4 - 9 * (1 - t * t), 0]; };
      return RD(at(i), at(i + 1), 1.5, CN.red, CL);
    }),
    ...[8.4, 55.6].map(x => C(x, 29.4, 0, 1.4, 2, CN.gold, { m: 'metal', seg: 8 })),
  ]),

  // the marquee: a red board in a gold frame ringed with bulbs, NOW SHOWING LUGIA on its lit panel, a deco crest on
  // top (a tap switches it)
  wallPiece('cnmmarquee', 'Cinema marquee sign', 2, 1100, 'gloss', [
    B(32, 64, 1, 62, 26, 2, CN.red, GL),
    B(32, 64, 2.2, 52, 18, 0.4, CN.gold, MT),
    B(32, 64, 2.5, 49, 15.4, 0.4, CN.glowW, GW),
    PC(32, 64, 2.8, 48, 15, marquee),
    ...[...Array.from({ length: 15 }, (_, i) => [4 + i * 4, 75.4]), ...Array.from({ length: 15 }, (_, i) => [4 + i * 4, 52.6]),
      ...[56, 60, 64, 68, 72].flatMap(h => [[2.8, h], [61.2, h]])].map(([x, h]) => DS(x, h, 2.2, 0.9, 0.6, CN.bulb, { m: 'glow', seg: 8 })),
    PR(32, 77, 1, [[-14, 0], [14, 0], [8, 5], [3, 5], [0, 8], [-3, 5], [-8, 5]], 2, CN.gold, MT),
  ], { glow: [CN.bulb, CN.glowW] }),

  // two gold-framed posters of the house's films: Lugia, Song of the Deep and Jirachi, A Thousand Wishes
  wallPiece('cnmposters', 'Cinema now-showing posters', 2, 520, 'metal', [
    ...[[16, lugiaPoster], [48, jirachiPoster]].flatMap(([x, fn]) => [B(x, 62, 0.6, 26, 36, 1.2, CN.gold, MT), PC(x, 62, 1.25, 23, 33, fn)]),
  ]),

  // a lit EXIT sign on a bracket: dark letters on its glowing green face (a tap switches it)
  wallPiece('cnmexit', 'Cinema exit sign', 1, 300, 'gloss', [
    B(16, 76.6, 0.5, 6, 1.6, 1, CN.blackL, MT), RD([16, 76, 1], [16, 74.4, 2], 0.4, CN.blackL, MT),
    B(16, 70, 2, 21, 9, 4, CN.black, GL),
    B(16, 70, 4.2, 19, 7, 0.4, CN.exit, GW),
    PC(16, 70, 4.5, 18, 6.4, word('EXIT', '#0c3a1c', null, 0.86)),
  ], { glow: [CN.exit] }),

  // an art-deco wall sconce: a brass fan on the wall, a glowing glass shade in front, gold ribs and a finial (a tap
  // switches it)
  wallPiece('cnmsconce', 'Cinema deco sconce', 1, 420, 'metal', [
    PR(16, 54, 0.5, [[-3, 0], [3, 0], [10, 16], [-10, 16]], 1, CN.gold, MT),
    PR(16, 55, 1.6, [[-2.2, 0], [2.2, 0], [8, 14], [-8, 14]], 1.2, CN.glowW, GW),
    ...[-1, 0, 1].map(s => RD([16, 55, 2.4], [16 + s * 6, 69, 2.4], 0.35, CN.goldD, MT)),
    B(16, 70.4, 1.6, 21, 1.2, 2.4, CN.gold, MT),
    LA(16, 50, 1.6, [[0, 0], [1.4, 1.6], [2.4, 4]], CN.gold, { m: 'metal', seg: 10 }),
  ], { glow: [CN.glowW] }),

  // a director's chair: walnut X legs, red canvas seat and back, DIRECTOR stencilled across in gold
  piece('cnmchair', "Cinema director's chair", 1, 1, 450, 'wood', [
    ...[8, -8].flatMap(z => [RD([5, 0.6, z], [27, 16, z], 1, CN.walnut, WD), RD([27, 0.6, z], [5, 16, z], 1, CN.walnut, WD), RD([4.4, 16, z], [27.6, 16, z], 0.7, CN.walnut, WD)]),
    ...[4.4, 27.6].flatMap(x => [RD([x, 16, 8], [x, 26, 8], 1, CN.walnut, WD), RD([x, 16, -8], [x, 38, -8], 1, CN.walnut, WD), RD([x, 26, -8], [x, 26, 9], 0.9, CN.walnut, WD)]),
    B(16, 16.8, 0, 22, 1, 16, CN.red, VL(0.4)),
    B(16, 32, -8, 22, 8, 0.8, CN.red, VL(0.3)), PC(16, 32, -7.55, 21, 7, word('DIRECTOR', CN.goldL, CN.red, 0.6)),
  ]),

  // Smeargle at the director's mark on a black box, its beret on, a clapperboard in one paw and its tail's brush up
  piece('cnmsmeargle', 'Cinema Smeargle director', 1, 1, 1300, 'cloth', [
    B(16, 1, 0, 26, 2, 22, CN.black, GL),
    ...[12.4, 19.6].map(x => S(x, 4, 1, 2.6, 2.4, 3.4, CN.smearB, { m: 'cloth', seg: 8 })),
    S(16, 13, 0, 6.4, 8, 5.6, CN.smear, { m: 'cloth', seg: 14 }),
    RD([7, 9, -4], [4, 18, -5], 1, CN.smearB, CL), RD([4, 18, -5], [5, 28, -5], 1, CN.smearB, CL), S(5.4, 30.6, -5, 2.2, 3, 2.2, CN.paint, { m: 'cloth', seg: 8 }),
    S(16, 26, 0, 6.6, 6, 5.8, CN.smear, { m: 'cloth', seg: 14 }),
    S(16, 31, -0.6, 6, 2.6, 5.4, CN.smearB, { m: 'cloth', seg: 12 }), RD([16, 33, -0.6], [17, 35, -0.6], 0.6, CN.smearB, CL),
    ...[9.6, 22.4].map(x => S(x, 24, -1, 1.8, 4, 2.4, CN.smearB, { m: 'cloth', seg: 8 })),
    S(16, 23.6, 5, 2.6, 1.8, 1.6, CN.smear, { m: 'cloth', seg: 8 }),
    ...[13.4, 18.6].map(x => DS(x, 27, 5.3, 0.8, 0.4, CN.black, { m: 'gloss', seg: 8 })),
    RD([10.4, 15, 3], [8, 19, 6], 1.1, CN.smear, CL), S(8, 19.4, 6.4, 1.2, 1.2, 1.2, CN.smearB, { m: 'cloth', seg: 6 }),
    RD([21.6, 15, 3], [24, 14.6, 6], 1.1, CN.smear, CL),
    B(25, 13, 7, 9, 6.4, 1, '#1c1c1e', GL), PC(25, 13, 7.55, 8.6, 6, slate),
    B(25, 17.4, 7, 9, 1.6, 1, '#f0f0ec', GL), PC(25, 17.4, 7.55, 8.6, 1.4, stripes),
  ]),

  // a stack of round film cans, a red label round each, a reel leant against the stack
  piece('cnmcans', 'Cinema film-can stack', 1, 1, 280, 'metal', [
    ...[0, 0.6, -0.4, 0.8, 0].flatMap((o, k) => [C(14 + o, 1.4 + k * 2.9, -1, 10, 2.6, k % 2 ? CN.steelL : CN.can, { m: 'metal', seg: 18 }), C(14 + o, 1.4 + k * 2.9, -1, 10.05, 0.8, k === 2 ? CN.gold : CN.red, { m: 'plain', seg: 18 })]),
    ...reel(25, 7.2, 8, 6.2),
  ]),

  // Ditto the usher: a red pillbox cap with a gold band, a bow tie, a torch held out in one stretched arm
  piece('cnmditto', 'Cinema Ditto usher', 1, 1, 1000, 'cloth', [
    S(16, 8, 0, 12, 8, 10, CN.ditto, { m: 'cloth', seg: 16 }),
    S(16, 15.4, -1, 8.4, 6, 7.6, CN.ditto, { m: 'cloth', seg: 14 }),
    ...[12.6, 19.4].map(x => DS(x, 14, 7.3, 0.7, 0.4, CN.dittoD, { m: 'plain', seg: 6 })),
    RD([13, 11, 8.6], [19, 11, 8.6], 0.3, CN.dittoD, PL),
    C(16, 23, -1, 4, 3.6, CN.red, { m: 'gloss', seg: 12 }), C(16, 21.8, -1, 4.1, 1, CN.gold, { m: 'metal', seg: 12 }), C(16, 24.9, -1, 4, 0.4, CN.gold, { m: 'metal', seg: 12 }),
    PR(16, 6, 10, [[-3.2, -1.8], [0, 0], [-3.2, 1.8]], 1, CN.red, GL), PR(16, 6, 10, [[3.2, -1.8], [0, 0], [3.2, 1.8]], 1, CN.red, GL), S(16, 6, 10.4, 0.8, 0.8, 0.6, CN.redD, { m: 'gloss', seg: 6 }),
    S(25.4, 10, 3, 3.6, 2.4, 2.6, CN.ditto, { m: 'cloth', seg: 10 }),
    RD([27, 11, 4], [29.2, 13, 8], 1, CN.black, GL), S(29.4, 13.2, 8.4, 1, 1, 1, CN.glowW, { m: 'glow', seg: 8 }),
  ], { glow: [CN.glowW] }),

  // the usher's torch stand: a brass post with a little lantern glowing on top and two torches hung ready on its arms
  // (a tap switches the lantern)
  piece('cnmtorch', "Cinema usher's torch stand", 1, 1, 460, 'metal', [
    LA(16, 0, 0, [[7, 0], [7, 1], [4, 2], [1.6, 3]], CN.gold, { m: 'metal', seg: 14 }),
    C(16, 18, 0, 1.6, 30, CN.gold, { m: 'metal', seg: 10 }),
    C(16, 33.6, 0, 3, 1.2, CN.goldD, { m: 'metal', seg: 12 }),
    LA(16, 34.2, 0, [[2.6, 0], [3.4, 3], [3.4, 7], [2.6, 9]], CN.glowW, { m: 'glow', seg: 12 }),
    ...[-1, 1].map(s => RD([16 + s * 2.6, 38, 0], [16 + s * 2.6, 42, 0], 0.3, CN.gold, MT)),
    LA(16, 43, 0, [[3.6, 0], [1.2, 2.4], [0, 3.2]], CN.gold, { m: 'metal', seg: 12 }),
    ...[8, 24].flatMap(x => [RD([16, 28, 0], [x, 28, 0], 0.5, CN.gold, MT), RD([x, 28, 0], [x, 26.4, 0], 0.3, CN.gold, MT),
      C(x, 22, 0, 1.5, 8, CN.black, { m: 'gloss', seg: 8 }), C(x, 17.4, 0, 1.5, 1.4, CN.steel, { m: 'metal', seg: 8 })]),
  ], { glow: [CN.glowW] }),

  // the aisle carpet: dark navy dotted with gold stars, a red runner down the middle edged in gold
  { id: 'cnmcarpet', name: 'Cinema aisle carpet', group: GROUP, solo: true, w: 2, h: 3, layer: 'rug', price: 900, high: 0.03, side: 'c', flat() {
    const g = ctx(), path = () => { g.beginPath(); RUG.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
    g.fillStyle = CN.navy; path(); g.fill();
    g.save(); path(); g.clip();
    const star = (cx, cy, r, c) => { g.fillStyle = c; g.beginPath(); for (let k = 0; k < 10; k++) { const a = k / 10 * TAU - Math.PI / 2, rr = k % 2 ? r * 0.42 : r; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } g.fill(); };
    for (let i = 0; i < 70; i++) { const sx = 3 + hash(i, 11, 1) * 58, sy = 3 + hash(i, 13, 2) * 90; if (sx > 17 && sx < 47) continue; if (hash(i, 5, 3) < 0.4) star(sx, sy, 1.4, CN.gold); else { g.fillStyle = hash(i, 6, 4) < 0.5 ? CN.goldL : CN.redL; g.beginPath(); g.arc(sx, sy, 0.45, 0, TAU); g.fill(); } }
    g.fillStyle = CN.red; g.fillRect(20, 0, 24, 96);
    g.fillStyle = CN.redD; for (let y = 4; y < 96; y += 8) g.fillRect(20, y, 24, 0.5);
    g.fillStyle = CN.gold; g.fillRect(19, 0, 1.4, 96); g.fillRect(43.6, 0, 1.4, 96);
    g.restore();
    g.strokeStyle = CN.gold; g.lineWidth = 1; path(); g.stroke();
  } },

  // a giant Pikachu popcorn bucket: a yellow tub with Pikachu's face, ears up over a heap of buttery popcorn (a tap
  // spills some)
  piece('cnmpikabucket', 'Cinema Pikachu popcorn bucket', 1, 1, 760, 'gloss', [
    LA(16, 0, 0, [[8, 0], [8.4, 1], [11, 20], [11.4, 21]], CN.pika, { m: 'gloss', seg: 18 }),
    C(16, 20.4, 0, 11.4, 1.2, CN.pikaD, { m: 'gloss', seg: 18 }),
    ...[12, 20].map(x => S(x, 13.4, 9.3, 1.3, 1.6, 0.6, CN.black, { m: 'gloss', seg: 8 })),
    ...[9.4, 22.6].map(x => S(x, 9.6, 7.2, 1.9, 1.7, 0.8, CN.cheek, { m: 'gloss', seg: 8 })),
    RD([14.4, 9.4, 9.7], [16, 8.6, 9.8], 0.3, CN.black, PL), RD([16, 8.6, 9.8], [17.6, 9.4, 9.7], 0.3, CN.black, PL), S(16, 11, 9.9, 0.4, 0.3, 0.3, CN.black, PL),
    S(16, 21.4, 0, 10.6, 4, 10.6, CN.popcorn, { m: 'cloth', seg: 14 }),
    ...[[12, 25, 3], [19, 25.4, 1], [16, 26.6, -2], [21, 24, 6], [9, 24, -3]].map(([x, h, z]) => S(x, h, z, 2.1, 1.8, 2, x === 21 ? CN.butter : CN.popcorn, { m: 'cloth', seg: 8 })),
    PR(8.6, 20, 0, [[-2.6, 0], [2.2, 0], [-2.8, 12]], 2, CN.pika, GL), PR(8.6, 20, 0, [[-2.74, 8.4], [-1.3, 8.4], [-2.8, 12]], 2.4, CN.black, GL),
    PR(23.4, 20, 0, [[-2.2, 0], [2.6, 0], [2.8, 12]], 2, CN.pika, GL), PR(23.4, 20, 0, [[1.3, 8.4], [2.74, 8.4], [2.8, 12]], 2.4, CN.black, GL),
  ]),

  // a gold easel holding the next feature's poster: Celebi, The Forest Remembers, COMING SOON
  piece('cnmeasel', 'Cinema coming-soon easel', 1, 1, 480, 'metal', [
    RD([6, 0.6, 4], [12, 46, 0.6], 0.7, CN.gold, MT), RD([26, 0.6, 4], [20, 46, 0.6], 0.7, CN.gold, MT), RD([16, 0.6, -10], [16, 42, -0.6], 0.6, CN.goldD, MT),
    B(16, 12.4, 3.6, 24, 1.4, 3, CN.gold, MT),
    B(16, 30, 2.6, 23, 33, 1, CN.cream, PL),
    PC(16, 30, 3.15, 22, 32, celebiPoster),
    S(16, 47.4, 0.8, 1.4, 1.4, 1.4, CN.goldL, MT),
  ]),
];
