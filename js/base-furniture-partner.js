/* base-furniture-partner.js  -  the Partner care set (furniture expansion session c, 2026-10-17): Pokémon-Amie and
   Pokémon Refresh by way of a pet boutique. Clean white and teal, warm wood, soft cushions, paw prints and Poké Puff
   pastels: bowls, beds sized for each partner, grooming, a bath, type corners (a heat lamp, a sun lamp, a splash tub)
   and a few wall racks. All decoration, all solo, fixed colours.
   An upright piece is a list of parts in painted units (32 a tile): `x` across from the left of its front, `h` up from
   the floor (a wall piece's from the foot of its strip), `z` out to the front from its middle (a wall piece's from the
   wall). They're painted here from any side, and js/base-models-partner.js builds the same list as 3D parts (BUILT), so
   picture and model agree. A `pic` part (a dial, a label, a photo) is painted on the front only, and the model wears
   that crop of the painting. The two rugs are painted from above; the paw rug's outline is RUGS. */

import { R, sh, oval, ovalShade, floorShadow, ctx, glass as glassPane } from './base-paint.js';

export const PT = {
  white: '#f7f9f8', cream: '#f6ead2', teal: '#38b2a8', tealD: '#23847d', mint: '#bdeee4', wood: '#d39a5c', woodD: '#a06a38',
  woodL: '#e8bf88', pink: '#f6a6c4', pinkD: '#d97aa0', yellow: '#f8da6a', lav: '#c4aef0', blue: '#9ccaf6', red: '#e2504c',
  steel: '#bcc4cc', dark: '#3a3e46', kibble: '#b8743c', water: '#62c4ee', green: '#6cc45a', greenD: '#3f9440',
  soil: '#6e4a2e', amber: '#ffb24a', stone: '#a8a098', pika: '#f6cf3a', growl: '#e98a46', snor: '#3c7d8c', snorC: '#efe2c2',
  rope: '#d8c08c', cork: '#c89a62', gold: '#e8c050', sun: '#fff3b0', orange: '#f08a3a',
};
const GROUP = 'Partner care';
const TAU = Math.PI * 2;

/* ---------- parts ---------- */
/** A rounded box centred at x, h, z. */
const B = (x, h, z, w, hh, d, c, o) => ({ t: 'box', x, h, z, w, hh, d, c, r: 1.5, ...o });
/** An upright cylinder centred at h (`rb` its bottom radius). */
const C = (x, h, z, r, hh, c, o) => ({ t: 'cyl', x, h, z, r, hh, c, ...o });
/** A ball rx x ry x rz. */
const S = (x, h, z, rx, ry, rz, c, o) => ({ t: 'ball', x, h, z, rx, ry, rz, c, ...o });
/** A rod from a to b, each [x, h, z]. */
const RD = (a, b, r, c, o) => ({ t: 'rod', a, b, r, c, x: (a[0] + b[0]) / 2, h: (a[1] + b[1]) / 2, z: (a[2] + b[2]) / 2, ...o });
/** A flat outline [[dx, dh]...] about x, h, d deep. */
const PR = (x, h, z, pts, d, c, o) => ({ t: 'prism', x, h, z, pts, d, c, ...o });
/** A lathe standing on h, its profile [[r, up]...]. */
const LA = (x, h, z, pts, c, o) => ({ t: 'lathe', x, h, z, pts, c, ...o });
/** A disc facing the front, th thick (`ry` for an oval). */
const DS = (x, h, z, r, th, c, o) => ({ t: 'disc', x, h, z, r, th, c, ...o });
/** A ring r round of a tube tr thick, facing the front (`flat` lies it down). */
const RG = (x, h, z, r, tr, c, o) => ({ t: 'ring', x, h, z, r, tr, c, ...o });
/** A picture on a front face, w x hh centred at x, h: `fn(g, left, top, w, hh)` paints it. */
const PC = (x, h, z, w, hh, fn, o) => ({ t: 'pic', x, h, z, w, hh, fn, ...o });

/** A paw print facing the front, s across, on a face at z. */
const paw = (x, h, z, s, c, o) => [
  DS(x, h - s * 0.14, z, s * 0.3, 0.3, c, { ry: s * 0.25, m: 'plain', ...o }),
  ...[[-0.36, 0.14], [-0.13, 0.33], [0.13, 0.33], [0.36, 0.14]].map(([dx, dh]) => DS(x + dx * s, h + dh * s, z, s * 0.12, 0.3, c, { ry: s * 0.14, m: 'plain', ...o })),
];
/** A bowl on h: its body, rim and what's in it ('food', 'water' or nothing). */
const bowl = (x, h, z, r, hh, c, rim, fill) => [
  LA(x, h, z, [[0, 0], [r * 0.72, 0], [r * 0.95, hh * 0.7], [r, hh], [0, hh]], c),
  C(x, h + hh - 0.5, z, r + 0.3, 1, rim, { rb: r * 0.97 }),
  ...(fill === 'food' ? [S(x, h + hh, z, r * 0.84, Math.max(1.4, r * 0.3), r * 0.84, PT.kibble, { m: 'plain' })] : []),
  ...(fill === 'water' ? [C(x, h + hh + 0.1, z, r * 0.86, 0.3, PT.water)] : []),
];
/** A Poké Puff r round on h: its pastel body, a cream swirl, maybe a berry. */
const puff = (x, h, z, r, c, berry) => [
  LA(x, h, z, [[r, 0], [r * 1.05, r * 0.4], [r * 0.82, r * 0.8], [r * 0.4, r * 1.02], [0, r * 1.08]], c, { seg: 10 }),
  S(x, h + r * 1.05, z, r * 0.5, r * 0.36, r * 0.5, PT.cream, { seg: 8 }),
  ...(berry ? [S(x, h + r * 1.45, z, r * 0.24, r * 0.24, r * 0.24, berry, { seg: 8 })] : []),
];
/** A brush lying or hanging: handle from a to b, its head at b. */
const brush = (a, b, c, head = PT.white) => [
  RD(a, b, 0.9, c, { m: 'wood' }),
  B(b[0], b[1], b[2], 5, 3, 3, c, { r: 1, m: 'wood' }),
  B(b[0], b[1], b[2] + 1.8, 4.4, 2.4, 1, head, { r: 0.4, m: 'plain' }),
];
/** A bone (a chew toy or a pillow) from a to b, its knobs k round. */
const bone = (a, b, k, c, o) => [
  RD(a, b, k * 0.6, c, o),
  ...[a, b].flatMap(([x, h, z]) => [S(x, h + k * 0.55, z, k, k, k, c, { seg: 8, ...o }), S(x, h - k * 0.55, z, k, k, k, c, { seg: 8, ...o })]),
];
/** A rosette: a ruffled disc, its centre and two ribbon tails. */
const rosette = (x, h, z, r, c) => [
  PR(x - r * 0.3, h - r * 0.4, z - 0.3, [[-r * 0.25, 0], [r * 0.25, 0], [r * 0.15, -r * 1.7], [0, -r * 1.45], [-r * 0.25, -r * 1.7]], 0.4, sh(c, -1), { m: 'cloth' }),
  PR(x + r * 0.3, h - r * 0.4, z - 0.3, [[-r * 0.25, 0], [r * 0.25, 0], [r * 0.25, -r * 1.7], [0, -r * 1.45], [-r * 0.15, -r * 1.7]], 0.4, sh(c, -1), { m: 'cloth' }),
  DS(x, h, z, r, 0.8, c, { m: 'cloth' }),
  DS(x, h, z + 0.5, r * 0.62, 0.6, sh(c, 1), { m: 'cloth' }),
  DS(x, h, z + 0.9, r * 0.4, 0.5, PT.white, { m: 'plain' }),
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
  if (m === 'glass') { g.save(); g.globalAlpha *= 0.4; glassPane(x, y, w, h, '#cfe8f4'); g.restore(); return; }
  g.fillStyle = grad(g, x, y, x + w * 0.3, y + h, c, m); g.beginPath(); g.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); g.fill();
  if (h > 3 && w > 3) { g.save(); g.globalAlpha *= 0.5; g.fillStyle = sh(c, 2); g.fillRect(x + Math.min(r, w / 2) * 0.6, y + 0.3, w - Math.min(r, w / 2) * 1.2, 0.6); g.restore(); }
}
function poly(pts, c, m, horiz) {
  const g = ctx(), xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  if (m === 'glass') { g.save(); g.globalAlpha *= 0.35; }
  if (horiz) {
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

/** Paints parts seen from `dir` (0 front, 2 back, 1 / 3 the sides), on a view vw wide standing on line b; W is the
    piece's front width in units. */
function paintParts(parts, x0, b, vw, dir, W) {
  const side = dir % 2 === 1, sg = dir === 3 ? -1 : 1, g = ctx();
  const U = (px, pz) => (dir === 0 ? x0 + px : dir === 2 ? x0 + W - px : x0 + vw / 2 + sg * pz);
  const key = (q) => q.k ?? (dir === 0 ? q.z : dir === 2 ? -q.z : sg * (W / 2 - q.x));
  const list = parts.map((q, i) => [key(q), i, q]).sort((a, c) => a[0] - c[0] || a[1] - c[1]).map(e => e[2]);
  for (const q of list) {
    if (q.t === 'pic' && dir !== 0) continue;
    const m = q.m || 'gloss', cx = U(q.x, q.z), cy = b - q.h;
    switch (q.t) {
      case 'box': { const w = side ? q.d : q.w; rbx(cx - w / 2, cy - q.hh / 2, w, q.hh, q.r, q.c, m); break; }
      case 'cyl': {
        const rb = q.rb ?? q.r, top = cy - q.hh / 2, bot = cy + q.hh / 2;
        poly([[cx - q.r, top], [cx + q.r, top], [cx + rb, bot], [cx - rb, bot]], q.c, m, m !== 'glow');
        if (m !== 'glass') oval(cx, top, q.r, Math.min(q.r * 0.22, Math.max(0.3, q.hh / 2)), sh(q.c, m === 'glow' ? 2 : 1));
        break;
      }
      case 'ball': ball(cx, cy, side ? q.rz : q.rx, q.ry, q.c, m); break;
      case 'disc': if (side) rbx(cx - q.th / 2, cy - (q.ry ?? q.r), q.th, (q.ry ?? q.r) * 2, q.th / 2, q.c, m); else ball(cx, cy, q.r, q.ry ?? q.r, q.c, m); break;
      case 'lathe': {
        const pts = q.pts.map(([r, up]) => [r, cy - up]);
        poly([...pts.map(([r, y]) => [cx - r, y]), ...pts.slice().reverse().map(([r, y]) => [cx + r, y])], q.c, m, true);
        if (q.pts[q.pts.length - 1][0] < 0.01 && q.pts.length > 2) break;
        const [rt, ut] = q.pts[q.pts.length - 1];
        oval(cx, cy - ut, rt, rt * 0.22, sh(q.c, -2));
        break;
      }
      case 'ring': {
        g.strokeStyle = q.c; g.lineWidth = q.tr * 2; g.beginPath();
        if (q.flat) g.ellipse(cx, cy, q.r, q.r * 0.22, 0, 0, TAU);
        else if (side) { rbx(cx - q.tr, cy - q.r - q.tr, q.tr * 2, (q.r + q.tr) * 2, q.tr, q.c, m); break; }
        else g.arc(cx, cy, q.r, 0, TAU);
        g.stroke();
        g.save(); g.globalAlpha *= 0.45; g.strokeStyle = sh(q.c, 2); g.lineWidth = q.tr * 0.6; g.beginPath();
        if (q.flat) g.ellipse(cx, cy - q.tr * 0.4, q.r, q.r * 0.22, 0, Math.PI, TAU); else g.arc(cx, cy, q.r, Math.PI * 1.1, Math.PI * 1.6);
        g.stroke(); g.restore();
        break;
      }
      case 'rod': {
        const p0 = [U(q.a[0], q.a[2]), b - q.a[1]], p1 = [U(q.b[0], q.b[2]), b - q.b[1]];
        g.lineCap = 'round'; g.strokeStyle = m === 'glass' ? alphaOf('#cfe8f4', 0.4) : q.c; g.lineWidth = q.r * 2;
        g.beginPath(); g.moveTo(...p0); g.lineTo(...p1); g.stroke();
        if (q.r > 0.6 && m !== 'glass') {
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
      case 'pic': g.save(); g.beginPath(); g.rect(cx - q.w / 2, cy - q.hh / 2, q.w, q.hh); g.clip(); q.fn(g, cx - q.w / 2, cy - q.hh / 2, q.w, q.hh); g.restore(); break;
    }
  }
}

/* ---------- pictures ---------- */

const font = (g, px, bold = true) => { g.font = `${bold ? 'bold ' : ''}${px}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; };
/** A paw print drawn flat, s across, centred x, y (y down). */
function pawAt(g, x, y, s, c, turn = 0) {
  g.save(); g.translate(x, y); g.rotate(turn); g.fillStyle = c;
  g.beginPath(); g.ellipse(0, s * 0.14, s * 0.3, s * 0.25, 0, 0, TAU); g.fill();
  for (const [dx, dy] of [[-0.36, -0.14], [-0.13, -0.33], [0.13, -0.33], [0.36, -0.14]]) { g.beginPath(); g.ellipse(dx * s, dy * s, s * 0.12, s * 0.14, 0, 0, TAU); g.fill(); }
  g.restore();
}

/* ---------- the kinds ---------- */

/** What js/base-models-partner.js builds for each upright and wall kind: its parts and default material. */
export const BUILT = {};
/** The paw rug's outline: ellipses [cx, cy, rx, ry] in painted units, from above. */
export const RUGS = {
  pcpawrug: [[32, 42, 18, 15], [12, 23, 6.5, 8], [24.5, 13, 6.5, 8.5], [39.5, 13, 6.5, 8.5], [52, 23, 6.5, 8]],
};

function piece(id, name, w, h, price, mat, parts, rest = {}) {
  BUILT[id] = { parts, mat };
  return { id, name, group: GROUP, solo: true, w, h, price, ...rest, draw(x, b, vw, dir) { floorShadow(x, b, vw); paintParts(parts, x, b, vw, dir, w * 32); } };
}
function wallPiece(id, name, w, price, mat, parts, rest = {}) {
  BUILT[id] = { parts, mat };
  return { id, name, group: GROUP, solo: true, w, h: 1, layer: 'wall', price, ...rest, wall(x) { paintParts(parts, x, 96, w * 32, 0, w * 32); } };
}

const BEANS = ['#f06a6a', '#f8c84a', '#6ac8f0', '#8ad86a', '#c48af0', '#f6a6c4', '#ffffff', '#f09a4a'];
const BLOCKS = ['#e2504c', '#4a8ae8', '#f6a6c4', '#6cc45a', '#f8da6a'];
const VITAMINS = [['#e84a4a', 'HP'], ['#f08a3a', 'PRO'], ['#8a9ab8', 'IRN'], ['#5ab0e8', 'CAL'], ['#a07ad8', 'ZNC'], ['#5ac870', 'CRB']];

export const PARTNER_KINDS = [
  // a single bowl of kibble on a teal mat
  piece('pcbowl', 'Partner food bowl', 1, 1, 150, 'gloss', [
    B(16, 0.6, 1, 28, 1.2, 22, PT.teal, { r: 0.6, m: 'plain' }),
    ...bowl(16, 1.2, 1, 10, 7, PT.white, PT.red, 'food'),
    ...paw(16, 4.6, 9.4, 5, PT.red),
    S(8, 9.6, 3, 1.2, 0.9, 1.2, sh(PT.kibble, -1), { m: 'plain', seg: 8 }),
    S(23, 9.2, 0, 1.2, 0.9, 1.2, sh(PT.kibble, -1), { m: 'plain', seg: 8 }),
  ]),

  // food and water side by side, set into a wooden stand
  piece('pcdoublebowl', 'Double bowl stand', 1, 1, 320, 'wood', [
    ...[[3, -7], [29, -7], [3, 7], [29, 7]].map(([x, z]) => B(x, 4, z, 3, 8, 3, PT.woodD, { r: 0.8 })),
    B(16, 9, 0, 31, 2.6, 20, PT.wood, { r: 1 }),
    ...bowl(9, 8, 0, 6.4, 5, PT.teal, PT.white, 'food').map(q => ({ m: 'gloss', ...q })),
    ...bowl(23, 8, 0, 6.4, 5, PT.white, PT.teal, 'water').map(q => ({ m: 'gloss', ...q })),
    ...paw(16, 9, 10.2, 4, PT.white),
  ]),

  // a bowl big enough for a Snorlax, heaped, an apple on top
  piece('pcbigbowl', 'Snorlax-size bowl', 2, 2, 650, 'gloss', [
    LA(32, 0, 0, [[0, 0], [21, 0], [27, 15], [27.6, 17], [0, 17]], PT.snor),
    C(32, 9, 0, 25.1, 4, PT.snorC, { rb: 23.6 }),
    ...paw(32, 9, 24.9, 6, PT.snor),
    S(32, 17, 0, 24.5, 9, 24.5, PT.kibble, { m: 'plain' }),
    S(24, 25, 6, 2, 1.4, 2, sh(PT.kibble, -1), { m: 'plain', seg: 8 }),
    S(42, 24, 10, 2, 1.4, 2, sh(PT.kibble, -1), { m: 'plain', seg: 8 }),
    S(37, 28.5, 2, 4.4, 4, 4.4, PT.red),
    RD([37, 32, 2], [37.6, 35, 2], 0.5, PT.woodD, { m: 'wood' }),
    S(39.5, 34.2, 2, 1.8, 0.8, 1, PT.green, { seg: 8 }),
    ...[[25, 26.5, 3], [28.5, 27, -2]].map(([x, h, z]) => S(x, h, z, 2.2, 2.2, 2.2, '#4a7ae8', { seg: 8 })),
  ]),

  // a pet fountain: water bubbles out of a flower spout and runs down
  piece('pcfountain', 'Partner water fountain', 1, 1, 450, 'gloss', [
    LA(16, 0, 0, [[0, 0], [12, 0], [13.5, 3], [13, 9], [0, 9]], PT.teal),
    ...paw(16, 4.8, 13.2, 5, PT.white),
    C(16, 9.2, 0, 12, 0.6, PT.water),
    LA(16, 9, 0, [[0, 0], [3.4, 0], [2.4, 5], [5, 9], [5.4, 10], [0, 10]], PT.white),
    C(16, 19.2, 0, 4.6, 0.5, PT.water),
    S(16, 20, 0, 2, 1.6, 2, sh(PT.water, 2), { seg: 8 }),
    ...[0, 1, 2, 3].map(i => { const a = (i + 0.5) * TAU / 4, cx = Math.cos(a), cz = Math.sin(a); return RD([16 + cx * 5.2, 18.6, cz * 5.2], [16 + cx * 9, 9.6, cz * 9], 0.6, PT.water); }),
  ]),

  // a tiered stand of Poké Puffs
  piece('pcpuffstand', 'Poké Puff tier stand', 1, 1, 650, 'gloss', [
    LA(16, 0, 0, [[7, 0], [7, 1], [3, 2.5], [1.2, 3], [0, 3]], PT.white),
    C(16, 22, 0, 1, 40, PT.gold, { m: 'metal' }),
    C(16, 4, 0, 14, 1.2, PT.white, { rb: 13 }),
    ...[0, 1, 2, 3, 4].flatMap(i => { const a = TAU * (i / 5 + 0.1); return puff(16 + Math.cos(a) * 9.4, 4.6, Math.sin(a) * 9.4, 3, [PT.pink, PT.lav, PT.mint, PT.yellow, PT.blue][i], i % 2 ? null : PT.red); }),
    C(16, 18, 0, 10.5, 1.2, PT.white, { rb: 9.5 }),
    ...[0, 1, 2, 3].flatMap(i => { const a = TAU * (i / 4 + 0.125); return puff(16 + Math.cos(a) * 6.3, 18.6, Math.sin(a) * 6.3, 2.6, [PT.yellow, PT.pink, PT.blue, PT.lav][i], i % 2 ? PT.red : null); }),
    C(16, 31, 0, 7, 1.2, PT.white, { rb: 6.2 }),
    ...[0, 1, 2].flatMap(i => { const a = TAU * (i / 3 + 0.25); return puff(16 + Math.cos(a) * 4, 31.6, Math.sin(a) * 4, 2.3, [PT.pink, PT.mint, PT.lav][i], i ? null : PT.red); }),
    RG(16, 44, 0, 2.2, 0.6, PT.gold, { m: 'metal' }),
  ]),

  // a jar of Poké Beans, plain and patterned
  piece('pcbeanjar', 'Poké Bean jar', 1, 1, 280, 'gloss', [
    C(16, 1.5, 0, 11, 3, PT.wood, { m: 'wood' }),
    ...Array.from({ length: 18 }, (_, i) => {
      const row = Math.floor(i / 6), j = i % 6, a = TAU * (j / 6 + row * 0.09), rr = row === 2 ? 4 : 6.4;
      return S(16 + Math.cos(a) * rr, 5.4 + row * 3.6, Math.sin(a) * rr, 2.4, 1.6, 1.6, BEANS[(i * 5) % BEANS.length], { seg: 8 });
    }),
    S(16, 15.8, 0, 2.4, 1.6, 1.6, PT.pink, { seg: 8 }),
    C(16, 15, 0, 9.4, 24, '#cfe8f4', { m: 'glass', k: 30 }),
    C(16, 28.4, 0, 10, 3.2, PT.teal, { k: 31 }),
    S(16, 31.4, 0, 3, 2.2, 3, PT.pink, { k: 32 }),
    B(16, 12, 9.8, 12, 6, 0.4, PT.white, { r: 0.5, m: 'plain', k: 33 }),
    PC(16, 12, 10.05, 11, 5, (g, x, y, w, h) => {
      g.fillStyle = PT.white; g.fillRect(x, y, w, h);
      font(g, 2.4); g.fillStyle = PT.tealD; g.fillText('POKÉ BEANS', x + w / 2, y + h / 2 + 0.2, w - 0.8);
    }, { k: 34 }),
  ]),

  // a wooden shelf: the Pokéblock case on top, a row of blocks below
  piece('pcblockshelf', 'Pokéblock shelf', 1, 1, 500, 'wood', [
    B(2.5, 20, 0, 3, 40, 22, PT.wood, { r: 0.8 }), B(29.5, 20, 0, 3, 40, 22, PT.wood, { r: 0.8 }),
    B(16, 20, -10, 26, 38, 1.6, PT.woodL, { r: 0.5 }),
    ...[1.5, 20, 39].map(h => B(16, h, 0, 31, 2.6, 22, PT.wood, { r: 0.8 })),
    ...BLOCKS.flatMap((c, i) => [B(6 + i * 5, 4.8, 3, 3.8, 3.8, 3.8, c, { r: 0.6, m: 'gloss' }), B(8.5 + i * 4.6, 4.8, -4, 3.8, 3.8, 3.8, BLOCKS[(i + 2) % 5], { r: 0.6, m: 'gloss' })]),
    B(16, 26, 1, 20, 9, 12, PT.red, { r: 2.4, m: 'gloss' }),
    B(16, 30, 1, 20.4, 1.4, 12.4, PT.white, { r: 0.6, m: 'gloss' }),
    DS(16, 26, 7.2, 2.4, 0.8, PT.white, { m: 'gloss' }),
    DS(16, 26, 7.7, 1.3, 0.5, PT.dark, { m: 'gloss' }),
    ...BLOCKS.slice(0, 3).map((c, i) => B(9.5 + i * 6.5, 23, 9, 3.6, 3.6, 3.6, c, { r: 0.6, m: 'gloss' })),
  ]),

  // a grooming table: arm and loop, a hair dryer on a stand, brushes and towels
  piece('pcgroomtable', 'Grooming table', 2, 1, 1100, 'metal', [
    ...[[5, -10], [59, -10], [5, 10], [59, 10]].map(([x, z]) => C(x, 11, z, 1.1, 22, PT.steel)),
    B(32, 6, 0, 56, 1.6, 22, PT.white, { r: 0.6, m: 'gloss' }),
    B(14, 8.8, 2, 11, 3.6, 9, PT.pink, { r: 1.8, m: 'cloth' }), B(26, 8.8, 2, 11, 3.6, 9, PT.mint, { r: 1.8, m: 'cloth' }),
    B(20, 12.2, 2, 11, 3.2, 9, PT.lav, { r: 1.6, m: 'cloth' }),
    C(44, 10, 2, 3, 6, PT.teal, { m: 'gloss' }), C(44, 14, 2, 1.2, 2, PT.white, { m: 'gloss' }),
    B(32, 23, 0, 62, 2.6, 28, PT.teal, { r: 1.2, m: 'gloss' }),
    B(34, 24.6, 0, 44, 0.8, 22, PT.mint, { r: 0.4, m: 'cloth' }),
    C(59, 40, -9, 1.1, 32, PT.steel), RD([59, 56, -9], [44, 56, -9], 1.1, PT.steel),
    RD([44, 56, -9], [44, 46, -9], 0.4, PT.red, { m: 'plain' }),
    RG(44, 42.5, -9, 3.6, 0.6, PT.red, { m: 'plain' }),
    C(7, 38, -6, 0.9, 28, PT.steel),
    S(7, 53, -5, 4.6, 4.4, 5.6, PT.pink, { m: 'gloss' }),
    DS(7, 53, 2, 2.4, 5, PT.white, { m: 'gloss' }),
    RD([7, 50, -4], [7, 45, -2], 1.4, PT.pinkD, { m: 'gloss' }),
    ...brush([20, 25.6, 4], [28, 26.6, 6], PT.woodD),
    B(50, 25.6, 6, 10, 1, 2, PT.steel, { r: 0.3 }),
  ]),

  // a rack of brushes and combs on the wall
  wallPiece('pcbrushrack', 'Grooming brush rack', 1, 300, 'wood', [
    B(16, 66, 0.6, 28, 9, 1.2, PT.woodL, { r: 0.8 }),
    ...paw(16, 68, 1.4, 5, PT.teal),
    ...[5, 27].map(x => RD([x, 63, 1], [x, 63, 4], 0.6, PT.steel, { m: 'metal' })),
    ...brush([5, 62, 3.5], [5, 50, 3.5], PT.teal),
    ...brush([27, 62, 3.5], [27, 51, 3.5], PT.pink),
    RD([12, 63, 1], [12, 63, 3.4], 0.5, PT.steel, { m: 'metal' }), RD([20, 63, 1], [20, 63, 3.4], 0.5, PT.steel, { m: 'metal' }),
    B(16, 55, 3, 11, 3.6, 1, PT.lav, { r: 0.6, m: 'gloss' }),
    ...[0, 1, 2, 3, 4, 5, 6].map(i => B(11.6 + i * 1.47, 51.4, 3, 0.6, 3.6, 0.8, PT.lav, { r: 0.2, m: 'gloss' })),
    RD([12, 63, 3.2], [13, 57, 3], 0.3, PT.dark, { m: 'plain' }), RD([20, 63, 3.2], [19, 57, 3], 0.3, PT.dark, { m: 'plain' }),
  ]),

  // a bath on paw feet, foaming, a rubber Psyduck afloat
  piece('pcbathtub', 'Partner bath tub', 2, 1, 950, 'gloss', [
    ...[[8, -9], [56, -9], [8, 9], [56, 9]].map(([x, z]) => S(x, 2.4, z, 3.2, 2.6, 3.2, PT.teal)),
    B(32, 13, 0, 58, 19, 27, PT.white, { r: 7 }),
    B(32, 22.6, 0, 60, 2.4, 29, PT.white, { r: 1.2 }),
    B(32, 22.4, 0, 54, 2, 23, PT.water, { r: 0.8 }),
    ...paw(32, 12, 13.6, 9, PT.teal),
    ...[[10, 25, -4, 4], [17, 26, 4, 5], [25, 24.6, -6, 3.6], [42, 25.4, -3, 4.6], [50, 26, 5, 4], [55, 24.6, -5, 3]].map(([x, h, z, r], i) => S(x, h, z, r, r * 0.8, r, [PT.white, '#e8f8ff', PT.white, '#fdeef6', PT.white, '#e8f8ff'][i], { m: 'gloss', seg: 10 })),
    S(32, 25.6, 3, 3.4, 2.4, 3, PT.yellow, { seg: 10 }),
    S(33.5, 29.8, 3, 2.6, 2.6, 2.6, PT.yellow, { seg: 10 }),
    S(33.5, 29.6, 5.6, 1.3, 0.8, 1.2, PT.orange, { seg: 8 }),
    RD([58, 22, -12], [58, 31, -12], 1, PT.steel, { m: 'metal' }), RD([58, 31, -12], [54, 31, -9], 1, PT.steel, { m: 'metal' }),
    RD([54, 31, -9], [54, 28, -9], 1, PT.steel, { m: 'metal' }),
  ]),

  // a little round cushion bed, Pikachu-sized, a bone pillow
  piece('pccushbed', 'Small cushion bed', 1, 1, 380, 'cloth', [
    LA(16, 0, 0, [[0, 0], [13, 0], [14.4, 4], [13.4, 8], [11, 9.2], [0, 9.2]], PT.pika),
    S(16, 7.6, 1, 10, 2.6, 10, PT.cream),
    ...bone([11, 11, -6], [21, 11, -6], 2.2, PT.white, { m: 'cloth' }),
    ...[[8, 3.4, 11], [24, 3.4, 11]].map(([x, h, z]) => S(x, h, z, 2.2, 1.6, 0.8, '#e05a3a', { m: 'cloth', seg: 8 })),
    ...paw(16, 4, 13.6, 4.6, sh(PT.pika, -2)),
  ]),

  // a wicker basket with a cushion, Growlithe-sized, a rope toy draped over the rim
  piece('pcbasketbed', 'Wicker basket bed', 1, 1, 520, 'wood', [
    LA(16, 0, 0, [[0, 0], [12, 0], [14.6, 11], [0, 11]], PT.woodL),
    C(16, 4, 0, 13.5, 1.6, PT.woodD, { rb: 13.1 }), C(16, 8, 0, 14.4, 1.6, PT.woodD, { rb: 14 }),
    C(16, 11.2, 0, 15, 2, PT.woodD, { rb: 14.6 }),
    S(16, 11, 0, 12.5, 3.2, 12.5, PT.growl, { m: 'cloth' }),
    S(16, 13, -1, 8, 1.2, 8, PT.cream, { m: 'cloth' }),
    RD([24, 13, 9], [28, 6, 12], 0.9, PT.red, { m: 'cloth' }), RD([24, 13, 9], [20, 13.5, 4], 0.9, PT.red, { m: 'cloth' }),
    S(28, 5.6, 12.2, 1.6, 1.6, 1.6, PT.white, { m: 'cloth', seg: 8 }),
  ]),

  // a big mattress for a Snorlax: a teal duvet, its belly on the front, two pillows
  piece('pcbigbed', 'Snorlax-size mattress', 2, 2, 1400, 'cloth', [
    B(32, 6.5, 0, 62, 13, 62, PT.snorC, { r: 5 }),
    PC(32, 6.5, 31.05, 52, 9, (g, x, y, w, h) => {
      g.fillStyle = PT.snorC; g.fillRect(x, y, w, h);
      g.fillStyle = PT.snor; g.fillRect(x, y, 8, h); g.fillRect(x + w - 8, y, 8, h);
      g.fillStyle = sh(PT.snorC, 1); g.beginPath(); g.ellipse(x + w / 2, y + h / 2, 16, 3.6, 0, 0, TAU); g.fill();
      font(g, 4.6); g.fillStyle = PT.snor; g.fillText('z Z z', x + w / 2, y + h / 2 + 0.3);
    }),
    B(32, 13.6, 7, 63, 3.2, 48, PT.snor, { r: 1.5 }),
    B(32, 13.9, -15.6, 63, 2.8, 2.4, PT.snorC, { r: 1.2 }),
    ...[17, 47].map(x => S(x, 17.5, -22, 12, 5, 7, PT.white)),
  ]),

  // a climbing tower: rope posts, a hidey cube, a perch bed on top, a pom-pom on a string
  piece('pctower', 'Climbing tower', 1, 1, 900, 'cloth', [
    B(16, 2, 0, 30, 4, 30, PT.cream, { r: 1.4 }),
    C(8, 28, -8, 2.8, 48, PT.rope, { m: 'plain' }),
    C(25, 15, 7, 2.6, 22, PT.rope, { m: 'plain' }),
    B(11, 13, 3, 17, 17, 17, PT.teal, { r: 2 }),
    DS(11, 10.5, 11.7, 4.5, 0.6, PT.tealD, { m: 'plain' }),
    B(22, 27.3, 3, 18, 2.6, 22, PT.cream, { r: 1.2 }),
    RD([28, 26, 10], [28, 18, 10], 0.3, PT.dark, { m: 'plain' }),
    S(28, 16.6, 10, 2, 2, 2, PT.pink, { seg: 8 }),
    LA(12, 52, -4, [[0, 0], [10.5, 0], [12, 5], [11, 6], [0, 6]], PT.teal),
    S(12, 56.6, -4, 9, 2, 9, PT.cream),
    ...paw(11, 18.4, 11.7, 3.4, PT.white),
  ]),

  // an open crate of chew toys
  piece('pctoycrate', 'Chew-toy crate', 1, 1, 360, 'wood', [
    B(16, 9, 0, 28, 18, 24, PT.woodL, { r: 1 }),
    ...[3, 15].map(h => B(16, h, 12.1, 28.4, 3, 0.6, PT.wood, { r: 0.3 })),
    ...paw(16, 9, 12.5, 6, PT.teal),
    ...bone([7, 20, -2], [17, 25, 1], 2.2, PT.white, { m: 'gloss' }),
    LA(23, 18, -2, [[0, 0], [3.6, 0.4], [4.8, 3.6], [4, 6.4], [0, 7.6]], PT.red, { seg: 12 }),
    RG(23, 19.4, -2, 4.9, 0.5, PT.dark, { flat: true, m: 'plain' }),
    RG(10, 21, -6, 4.6, 1.4, PT.teal, { m: 'gloss' }),
    RD([20, 18, 4], [26, 25, 6], 1, PT.pink, { m: 'cloth' }),
    S(26, 25.4, 6, 1.6, 1.6, 1.6, PT.pink, { m: 'cloth', seg: 8 }), S(20, 17.6, 4, 1.6, 1.6, 1.6, PT.pink, { m: 'cloth', seg: 8 }),
  ]),

  // a T-perch for bird partners: seed cups at the ends, a ring swing, a bell
  piece('pcperch', 'Bird partner perch', 1, 1, 480, 'wood', [
    LA(16, 0, 0, [[0, 0], [12, 0], [12, 2.2], [7, 3.4], [0, 3.4]], PT.teal, { m: 'gloss' }),
    C(16, 26, 0, 1.4, 46, PT.wood),
    RD([3, 49.5, 0], [29, 49.5, 0], 1.3, PT.woodL),
    ...[3.5, 28.5].map(x => LA(x, 50.6, 0, [[0, 0], [1.8, 0], [3, 3], [0, 3]], PT.white, { m: 'gloss', seg: 10 })),
    ...[3.5, 28.5].map(x => S(x, 53.4, 0, 2.2, 0.8, 2.2, PT.kibble, { m: 'plain', seg: 8 })),
    RD([21, 49, 0], [21, 41, 0], 0.3, PT.dark, { m: 'plain' }),
    RG(21, 37, 0, 4, 0.6, PT.pink, { m: 'gloss' }),
    RD([9, 49, 0], [9, 45, 0], 0.3, PT.dark, { m: 'plain' }),
    LA(9, 41.6, 0, [[2, 0], [1.8, 1.6], [1, 2.8], [0, 3.2]], PT.gold, { m: 'metal', seg: 10 }),
  ]),

  // a warm stone for Fire partners under an arched heat lamp
  piece('pcheatrock', 'Heat lamp rock', 1, 1, 750, 'plain', [
    B(16, 0.5, 2, 28, 1, 26, PT.orange, { r: 0.5, m: 'cloth' }),
    S(17, 4.6, 3, 12, 5, 11, PT.stone),
    S(7, 2.4, 12, 3, 2.2, 2.6, sh(PT.stone, -1), { seg: 8 }), S(27, 2.2, 11, 2.6, 2, 2.4, sh(PT.stone, 1), { seg: 8 }),
    S(17, 8.4, 3, 8, 1.4, 7, '#d8a088'),
    LA(4, 1, -12, [[4, 0], [4, 1.4], [2, 2.4], [0, 2.4]], PT.dark, { m: 'metal' }),
    C(4, 25, -12, 1, 46, PT.steel, { m: 'metal' }),
    RD([4, 48, -12], [16, 51, 0], 1, PT.steel, { m: 'metal' }),
    LA(16, 44, 0, [[8, 0], [5, 4], [2, 7], [0, 7.4]], PT.red, { m: 'gloss' }),
    S(16, 44, 0, 3.6, 2.6, 3.6, PT.amber, { m: 'glow' }),
  ], { glow: [PT.amber] }),

  // a planter bed for Grass partners under a sun lamp
  piece('pcsunplanter', 'Sun lamp planter', 2, 1, 800, 'wood', [
    B(32, 6, 2, 62, 12, 26, PT.wood, { r: 1 }),
    ...[2, 62].map(x => B(x, 6, 2, 2.4, 12.4, 26.4, PT.woodD, { r: 0.6 })),
    ...paw(32, 6, 15.3, 7, PT.woodD),
    B(32, 12.4, 2, 58, 1, 22, PT.soil, { r: 0.4, m: 'plain' }),
    ...[[8, 4], [18, 9], [46, 8], [56, 3], [12, -5], [52, -5]].map(([x, z], i) => S(x, 14.6, z, 5, 3.4 + (i % 3), 4.4, i % 2 ? PT.green : PT.greenD, { m: 'cloth', seg: 10 })),
    ...[[18, 18.2, 9, PT.pink], [46, 18.8, 8, PT.yellow], [12, 19, -5, PT.white]].map(([x, h, z, c]) => S(x, h, z, 1.6, 1.4, 1.6, c, { m: 'gloss', seg: 8 })),
    ...[4, 60].map(x => C(x, 32, -9, 1, 40, PT.white, { m: 'gloss' })),
    B(32, 51, -8, 60, 3, 9, PT.white, { r: 1.2, m: 'gloss' }),
    B(32, 49.2, -8, 56, 0.8, 7, PT.sun, { r: 0.3, m: 'glow' }),
  ], { glow: [PT.sun] }),

  // a glass splash tub for Water partners: pebbles, a lily pad
  piece('pcsplashtub', 'Splash tub', 1, 1, 700, 'gloss', [
    C(16, 1, 0, 14.2, 2, PT.teal),
    C(16, 7.4, 0, 13.2, 10.8, PT.water),
    ...[[11, 4], [18, 8], [22, -3], [12, -6], [16, 2]].map(([x, z], i) => S(x, 3.4, z, 2.2, 1.4, 2, [PT.stone, PT.white, PT.cream, sh(PT.stone, 1), PT.mint][i], { seg: 8, m: 'plain' })),
    C(20, 13.2, 3, 4.2, 0.4, PT.green, { m: 'plain' }),
    S(19, 14.2, 4, 1.6, 1.2, 1.6, PT.pink, { seg: 8 }),
    C(16, 8, 0, 13.6, 14, '#cfe8f4', { m: 'glass', k: 30 }),
    RG(16, 15, 0, 13.8, 1, PT.teal, { flat: true, k: 31 }),
  ]),

  // a weigh-in scale: a padded platform and a dial
  piece('pcweigh', 'Weigh-in scale', 1, 1, 420, 'gloss', [
    B(16, 2.5, 3, 28, 5, 22, PT.white, { r: 2 }),
    B(16, 5.2, 3, 22, 0.6, 17, PT.mint, { r: 0.3, m: 'cloth' }),
    ...paw(16, 2.6, 14.2, 4, PT.teal),
    B(16, 18, -11, 7, 28, 5, PT.teal, { r: 2 }),
    DS(16, 38, -10.4, 9.4, 3, PT.teal),
    DS(16, 38, -8.6, 8, 1, PT.white),
    PC(16, 38, -8.05, 13, 13, (g, x, y, w, h) => {
      const cx = x + w / 2, cy = y + h / 2;
      g.fillStyle = PT.white; g.fillRect(x, y, w, h);
      g.strokeStyle = PT.dark; g.lineWidth = 0.35;
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.beginPath(); g.moveTo(cx + Math.cos(a) * 5, cy + Math.sin(a) * 5); g.lineTo(cx + Math.cos(a) * 6, cy + Math.sin(a) * 6); g.stroke(); }
      font(g, 2.2); g.fillStyle = PT.tealD; g.fillText('kg', cx, cy + 3);
      g.strokeStyle = PT.red; g.lineWidth = 0.6; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + 3.6, cy - 3); g.stroke();
      g.fillStyle = PT.dark; g.beginPath(); g.arc(cx, cy, 0.8, 0, TAU); g.fill();
    }),
  ]),

  // vitamins on a wall shelf: HP Up, Protein, Iron, Calcium, Zinc, Carbos
  wallPiece('pcvitamins', 'Vitamin shelf', 2, 550, 'gloss', [
    B(32, 48, 6, 60, 2, 12, PT.white, { r: 0.6 }),
    ...[8, 56].map(x => PR(x, 47, 3, [[-0.8, 0], [0.8, 0], [0.8, -7], [-0.8, -7]], 6, PT.teal)),
    ...VITAMINS.flatMap(([c], i) => {
      const x = 7 + i * 10;
      return [C(x, 54.5, 6, 3.6, 11, c), C(x, 54, 6, 3.7, 4, PT.white, { m: 'plain' }), C(x, 61.4, 6, 2.2, 2.8, PT.white), C(x, 63, 6, 1.6, 1, sh(c, -1))];
    }),
    B(32, 72, 0.6, 30, 7, 1.2, PT.teal, { r: 1 }),
    PC(32, 72, 1.25, 28, 6, (g, x, y, w, h) => {
      g.fillStyle = PT.teal; g.fillRect(x, y, w, h);
      font(g, 3.6); g.fillStyle = PT.white; g.fillText('VITAMINS', x + w / 2, y + h / 2 + 0.2, w - 2);
    }),
  ]),

  // leashes and a collar on hooks
  wallPiece('pcleash', 'Leash hook rail', 1, 250, 'wood', [
    B(16, 66, 0.8, 28, 7, 1.6, PT.woodL, { r: 0.8 }),
    ...[6, 16, 26].flatMap(x => [RD([x, 65, 1.4], [x, 65, 4], 0.6, PT.steel, { m: 'metal' }), S(x, 65.6, 4, 0.9, 0.9, 0.9, PT.steel, { m: 'metal', seg: 8 })]),
    RG(6, 62, 3.4, 2.8, 0.7, PT.teal, { m: 'cloth' }),
    RD([6, 59.2, 3.4], [6, 40, 3.4], 0.7, PT.teal, { m: 'cloth' }), B(6, 38.6, 3.4, 2.2, 3, 1.4, PT.steel, { m: 'metal', r: 0.5 }),
    RG(16, 61.4, 3.4, 3.4, 0.7, PT.pink, { m: 'cloth' }),
    RD([16, 58, 3.4], [16, 43, 3.4], 0.7, PT.pink, { m: 'cloth' }), B(16, 41.6, 3.4, 2.2, 3, 1.4, PT.steel, { m: 'metal', r: 0.5 }),
    RG(26, 59.6, 3.4, 5, 0.9, PT.red, { m: 'cloth' }),
    DS(26, 53.6, 3.6, 1.8, 0.4, PT.gold, { m: 'metal' }),
    ...paw(16, 66.6, 1.7, 4, PT.teal),
  ]),

  // a cork board of contest rosettes around a photo of your partner
  wallPiece('pcrosettes', 'Ribbon rosette board', 2, 700, 'plain', [
    B(32, 58, 0.6, 56, 34, 1.2, PT.cork, { r: 0.6 }),
    ...[[32, 41.6, 57, 2], [32, 74.4, 57, 2]].map(([x, h, w, hh]) => B(x, h, 1, w, hh, 2, PT.woodD, { r: 0.6, m: 'wood' })),
    ...[[4.4, 58], [59.6, 58]].map(([x, h]) => B(x, h, 1, 2, 34.8, 2, PT.woodD, { r: 0.6, m: 'wood' })),
    B(32, 60, 1.4, 16, 18, 0.6, PT.white, { r: 0.3 }),
    PC(32, 60, 1.75, 14, 13, (g, x, y, w, h) => {
      const s = g.createLinearGradient(0, y, 0, y + h); s.addColorStop(0, '#bfe6f8'); s.addColorStop(1, '#e6f8d8');
      g.fillStyle = s; g.fillRect(x, y, w, h);
      g.fillStyle = PT.green; g.fillRect(x, y + h - 3, w, 3);
      const cx = x + w / 2, cy = y + h * 0.58;
      g.fillStyle = PT.pika;
      for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(cx + sx * 2, cy - 3); g.lineTo(cx + sx * 4.6, cy - 7.4); g.lineTo(cx + sx * 3.8, cy - 2); g.fill(); }
      g.beginPath(); g.ellipse(cx, cy, 4.4, 3.8, 0, 0, TAU); g.fill();
      g.fillStyle = PT.dark; for (const sx of [-1, 1]) { g.beginPath(); g.arc(cx + sx * 1.8, cy - 0.6, 0.6, 0, TAU); g.fill(); }
      g.fillStyle = '#e05a3a'; for (const sx of [-1, 1]) { g.beginPath(); g.arc(cx + sx * 3, cy + 1.1, 0.8, 0, TAU); g.fill(); }
      pawAt(g, x + 2.4, y + 2.6, 2.6, PT.white);
    }),
    ...rosette(13, 66, 2, 6, PT.gold),
    ...rosette(51, 66, 2, 5.4, '#4a7ae8'),
    ...rosette(13, 52, 2, 4.6, PT.red),
    ...rosette(51, 52, 2, 4.6, PT.pink),
    S(32, 70.6, 2, 0.8, 0.8, 0.6, PT.red, { seg: 8 }),
  ]),

  // a paw-pad rug: a big pad and four toes, stitched
  { id: 'pcpawrug', name: 'Paw-pad rug', group: GROUP, solo: true, w: 2, h: 2, layer: 'rug', price: 450, high: 0.04, side: 'c', flat() {
    const g = ctx();
    for (const [cx, cy, rx, ry] of RUGS.pcpawrug) {
      oval(cx, cy, rx, ry, PT.tealD); oval(cx, cy, rx - 1.2, ry - 1.2, PT.teal);
      oval(cx - rx * 0.15, cy - ry * 0.2, rx * 0.55, ry * 0.45, sh(PT.teal, 1));
      g.save(); g.setLineDash([1.2, 1]); g.strokeStyle = PT.white; g.lineWidth = 0.5;
      g.beginPath(); g.ellipse(cx, cy, rx - 2.6, ry - 2.6, 0, 0, TAU); g.stroke(); g.restore();
    }
    pawAt(g, 32, 44, 10, PT.mint);
  } },

  // a runner rug: Poké Puff pastel stripes, a trail of paw prints
  { id: 'pctrailrug', name: 'Paw-trail runner', group: GROUP, solo: true, w: 1, h: 2, layer: 'rug', price: 350, high: 0.04, side: 'c', flat(w, h) {
    const g = ctx();
    R(0, 0, w, h, PT.white);
    [PT.pink, PT.mint, PT.yellow, PT.lav, PT.blue].forEach((c, i) => R(2, 2 + i * (h - 4) / 5, w - 4, (h - 4) / 5, c));
    g.strokeStyle = PT.teal; g.lineWidth = 1.4; g.strokeRect(1.2, 1.2, w - 2.4, h - 2.4);
    g.save(); g.setLineDash([1.2, 1]); g.strokeStyle = PT.white; g.lineWidth = 0.5; g.strokeRect(3.4, 3.4, w - 6.8, h - 6.8); g.restore();
    for (let i = 0; i < 5; i++) pawAt(g, w / 2 + (i % 2 ? 5 : -5), h - 7 - i * 12.4, 6, PT.white, i % 2 ? 0.25 : -0.25);
  } },
].map(f => ({ group: GROUP, solo: true, ...f }));
