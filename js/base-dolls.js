/* base-dolls.js  -  the Secret Base's Pokémon dolls as real plushies (2026-10-08, the user's ask: they were their
   bitmaps blown up). Every doll is one line of PLUSH: a build (`shape`), its fabric colours, and which ears, tail and
   extras are sewn on; plushDoll() puts it together the way a Pokémon Center plush is made: a big round head on a small
   soft body, stubby arms and feet, button eyes with a shine and a stitched mouth, each part puffed with its own light.
   It paints in 100 units from the floor up (`u` canvas units each), on the kit's context. */

import { ctx, sh } from './base-paint.js';

let g, u, X, B;
// set, the parts are sewn in 3D by js/base-plush3d.js instead of painted (the same patterns make both)
let pen = null;
export function sewWith(p) { pen = p; g = p ? {} : g; }
const px = (x) => X + x * u, py = (y) => B - y * u;
const rgba = (hex, a) => { const v = parseInt(hex.slice(1), 16); return `rgba(${v >> 16},${(v >> 8) & 255},${v & 255},${a})`; };

/** A stuffed part: an oval puffed from the top left, its edge rolling into shade. */
function puff(x, y, rx, ry, c, rot = 0) {
  if (pen) return pen.puff(x, y, rx, ry, c, rot);
  const cx = px(x), cy = py(y), RX = rx * u, RY = ry * u;
  g.save(); g.translate(cx, cy); g.rotate(rot); g.scale(1, RY / RX);
  const s = g.createRadialGradient(-RX * 0.35, -RX * 0.45, RX * 0.05, 0, 0, RX * 1.02);
  s.addColorStop(0, sh(c, 1)); s.addColorStop(0.45, c); s.addColorStop(0.85, sh(c, -1)); s.addColorStop(1, sh(c, -2));
  g.fillStyle = s; g.beginPath(); g.arc(0, 0, RX, 0, Math.PI * 2); g.fill();
  g.restore();
}
/** A stuffed shape from a path in doll units: filled with a soft light from its top left. */
function shape(pts, c, { curve = true } = {}) {
  if (pen) return pen.shape(pts, c, curve);
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const l = g.createLinearGradient(px(x0), py(y1), px(x1), py(y0));
  l.addColorStop(0, sh(c, 1)); l.addColorStop(0.5, c); l.addColorStop(1, sh(c, -1));
  g.fillStyle = l; g.beginPath();
  if (!curve) pts.forEach(([x, y], i) => (i ? g.lineTo(px(x), py(y)) : g.moveTo(px(x), py(y))));
  else {
    // a smooth closed curve through the points' midpoints
    const n = pts.length, mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const m0 = mid(pts[n - 1], pts[0]);
    g.moveTo(px(m0[0]), py(m0[1]));
    for (let i = 0; i < n; i++) { const p = pts[i], m = mid(p, pts[(i + 1) % n]); g.quadraticCurveTo(px(p[0]), py(p[1]), px(m[0]), py(m[1])); }
  }
  g.closePath(); g.fill();
}
const line = (pts, c, w) => {
  if (pen) return pen.line(pts, c, w);
  g.strokeStyle = c; g.lineWidth = w * u; g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(px(x), py(y)) : g.moveTo(px(x), py(y))));
  g.stroke();
};
const curveLine = (a, ctl, b, c, w) => { if (pen) return pen.curve(a, ctl, b, c, w); g.strokeStyle = c; g.lineWidth = w * u; g.beginPath(); g.moveTo(px(a[0]), py(a[1])); g.quadraticCurveTo(px(ctl[0]), py(ctl[1]), px(b[0]), py(b[1])); g.stroke(); };
const dot = (x, y, r, c) => { if (pen) return pen.flat(x, y, r, r, c); g.fillStyle = c; g.beginPath(); g.arc(px(x), py(y), r * u, 0, Math.PI * 2); g.fill(); };
const flat = (x, y, rx, ry, c, rot = 0) => { if (pen) return pen.flat(x, y, rx, ry, c, rot); g.fillStyle = c; g.beginPath(); g.ellipse(px(x), py(y), rx * u, ry * u, rot, 0, Math.PI * 2); g.fill(); };

/* ---------- builds: where each part sits ---------- */
export const BUILDS = {
  // stands on two feet: a small body under a big head
  biped: { head: [0, 60, 33, 29], body: [0, 25, 25, 21], belly: [0, 23, 16, 13], feet: [[-15, 6, 11, 6.5], [15, 6, 11, 6.5]], arms: [[-24, 31, 6.5, 10, 0.6], [24, 31, 6.5, 10, -0.6]], eye: [12, 61], ear: [19, 82], tail: [24, 22] },
  // sits on four paws, its head low over its front paws
  quad: { head: [0, 52, 31, 27], body: [0, 23, 33, 18], belly: [0, 20, 15, 11], feet: [[-28, 6, 9, 6], [28, 6, 9, 6], [-11, 6, 8.5, 7], [11, 6, 8.5, 7]], arms: [], eye: [12, 53], ear: [19, 72], tail: [28, 26] },
  // all head: a round one on two little feet
  ball: { head: [0, 38, 37, 34], feet: [[-15, 5, 10, 6], [15, 5, 10, 6]], arms: [[-33, 34, 6, 8, 0.9], [33, 34, 6, 8, -0.9]], eye: [13, 44], ear: [22, 68], tail: [32, 20], mouth: 30 },
  // a heap of fabric
  blob: { head: [0, 34, 28, 22], body: [0, 18, 44, 18], feet: [], arms: [], eye: [10, 36], ear: [18, 54], tail: [40, 16], mouth: 28 },
  // a fish, round and finned
  fish: { head: [0, 38, 38, 32], feet: [], arms: [[-34, 30, 7, 11, 0.9], [34, 30, 7, 11, -0.9]], eye: [16, 44], ear: [0, 70], tail: [36, 32], mouth: 30 },
};

/* ---------- ears and tails ---------- */
export function ear(t, side, at, c, tip, inner) {
  const [ex, ey] = at, s = side;
  const tri = (len, base, lean, tipFrac = 0.35) => {
    const bx = ex * s, tx = bx + Math.sin(lean) * len * s, ty = ey + Math.cos(lean) * len;
    const pts = [[bx - base / 2, ey - 4], [tx, ty], [bx + base / 2, ey - 4]];
    shape([[pts[0][0], pts[0][1]], [(pts[0][0] + tx) / 2 - s * 1, (pts[0][1] + ty) / 2], [tx, ty], [(pts[2][0] + tx) / 2 + s * 1, (pts[2][1] + ty) / 2], pts[2]], c);
    if (inner) shape([[bx - base * 0.25, ey - 1], [tx * 0.85 + bx * 0.15, ty * 0.85 + ey * 0.15], [bx + base * 0.25, ey - 1]], inner);
    if (tip) {
      const f = 1 - tipFrac, lx = pts[0][0] + (tx - pts[0][0]) * f, ly = pts[0][1] + (ty - pts[0][1]) * f, rx = pts[2][0] + (tx - pts[2][0]) * f, ry = pts[2][1] + (ty - pts[2][1]) * f;
      shape([[lx, ly], [tx, ty], [rx, ry]], tip, { curve: false });
    }
  };
  switch (t) {
    case 'tall': return tri(38, 13, 0.32);
    case 'long': return tri(34, 20, 0.5, 0.3);
    case 'pointy': return tri(24, 15, 0.45);
    case 'cat': return tri(16, 17, 0.4);
    case 'nub': return tri(9, 12, 0.5);
    case 'round': { const x = (ex + 4) * s; puff(x, ey + 4, 10, 10, c); if (inner) flat(x, ey + 4, 5.5, 5.5, inner); return; }
    case 'big': { const x = (ex + 12) * s; puff(x, ey - 10, 15, 17, c, s * 0.3); if (inner) flat(x, ey - 10, 9, 11, inner, s * 0.3); return; }
    case 'fin': { if (s > 0) shape([[-5, ey - 4], [-3, ey + 14], [6, ey + 22], [9, ey + 8], [5, ey - 4]], c); return; }
    case 'side': { const x = (ex + 16) * s; shape([[x - 6 * s, ey - 10], [x + 12 * s, ey - 6], [x + 4 * s, ey - 18]], c); return; }
  }
}
export function tail(t, at, c, tip) {
  const [tx, ty] = at;
  switch (t) {
    case 'bolt': shape([[tx - 4, ty - 4], [tx + 6, ty + 8], [tx + 2, ty + 10], [tx + 14, ty + 22], [tx + 10, ty + 24], [tx + 24, ty + 40], [tx + 8, ty + 30], [tx + 12, ty + 28], [tx, ty + 16], [tx + 4, ty + 14], [tx - 6, ty + 2]], c, { curve: false });
      if (tip) shape([[tx - 4, ty - 4], [tx + 6, ty + 8], [tx + 2, ty + 10], [tx - 6, ty + 2]], tip, { curve: false });
      return;
    case 'flame': line([[tx - 4, ty - 2], [tx + 8, ty + 6], [tx + 14, ty + 16]], c, 7); flame(tx + 15, ty + 24, 1, tip); return;
    case 'curl': g.lineCap = 'round'; curveLine([tx - 4, ty], [tx + 16, ty - 4], [tx + 16, ty + 10], c, 6); dot(tx + 12, ty + 12, 4.5, c); return;
    case 'fluffy': shape([[tx - 6, ty - 4], [tx + 16, ty + 2], [tx + 24, ty + 22], [tx + 16, ty + 40], [tx + 6, ty + 34], [tx + 4, ty + 16]], c);
      if (tip) shape([[tx + 12, ty + 30], [tx + 22, ty + 28], [tx + 16, ty + 42], [tx + 6, ty + 36]], tip);
      return;
    case 'leaf': shape([[tx - 6, ty - 4], [tx + 12, ty + 6], [tx + 22, ty + 24], [tx + 18, ty + 46], [tx + 6, ty + 28]], c); line([[tx, ty], [tx + 12, ty + 18], [tx + 16, ty + 40]], sh(c, -1), 1.2); return;
    case 'ball': line([[tx - 4, ty], [tx + 10, ty + 10], [tx + 14, ty + 22]], tip || sh(c, -2), 2.4); puff(tx + 15, ty + 28, 8, 8, c); return;
    case 'whip': curveLine([tx - 4, ty], [tx + 30, ty - 6], [tx + 22, ty + 36], c, 3.5); puff(tx + 21, ty + 38, 5, 6, c); return;
    case 'fin': shape([[tx - 6, ty - 4], [tx + 14, ty + 12], [tx + 24, ty + 26], [tx + 14, ty + 10], [tx + 26, ty - 8], [tx + 10, ty - 6]], c); return;
    case 'stub': puff(tx + 2, ty + 2, 6, 5, c); return;
  }
}
/** A flame: an outer red drop and a yellow heart. */
function flame(x, y, s = 1, c = '#f84030') {
  shape([[x, y - 8 * s], [x + 7 * s, y + 2 * s], [x + 2 * s, y + 8 * s], [x + 3 * s, y + 15 * s], [x - 3 * s, y + 8 * s], [x - 7 * s, y + 1 * s]], c);
  shape([[x, y - 5 * s], [x + 4 * s, y + 1 * s], [x + 1 * s, y + 7 * s], [x - 4 * s, y + 1 * s]], '#f8d030');
}

/* ---------- extras: the bits that make each one itself ---------- */
export const EXTRAS = {
  bulb: (d, L) => { const [x, y, rx, ry] = L.head; shape([[x - 22, y + ry - 10], [x - 18, y + ry + 12], [x, y + ry + 24], [x + 18, y + ry + 12], [x + 22, y + ry - 10]], '#4fa042'); line([[x, y + ry - 6], [x, y + ry + 20]], '#2f7a32', 1.4); line([[x - 10, y + ry - 6], [x - 8, y + ry + 12]], '#2f7a32', 1.2); line([[x + 10, y + ry - 6], [x + 8, y + ry + 12]], '#2f7a32', 1.2); },
  spots: (d, L) => { const [x, y] = L.head; for (const [a, b, r] of [[-20, 10, 4], [18, 14, 3], [-6, 22, 3.5]]) flat(x + a, y + b, r, r * 0.8, sh(d.head || d.body, -1)); },
  plastron: (d, L) => { const [x, y, rx, ry] = L.belly; line([[x - rx * 0.8, y + 3], [x + rx * 0.8, y + 3]], sh(d.belly, -1), 1.2); line([[x - rx * 0.7, y - 4], [x + rx * 0.7, y - 4]], sh(d.belly, -1), 1.2); line([[x, y + ry * 0.8], [x, y - ry * 0.8]], sh(d.belly, -1), 1.2); },
  shellrim: (d, L) => { const [x, y, rx, ry] = L.body; puff(x, y, rx + 4, ry + 3, '#b87838'); },
  ruff: (d, L) => { const [x, y] = L.head, c = d.ruff; for (let i = -2; i <= 2; i++) puff(x + i * 9, y - 24 + Math.abs(i) * 2, 8, 7, c); },
  hair3: (d, L) => { const [x, y, , ry] = L.head; for (const a of [-5, 0, 5]) curveLine([x + a, y + ry - 2], [x + a * 1.6, y + ry + 8], [x + a * 2.2, y + ry + 12], '#303038', 1.8); },
  curl: (d, L) => { const [x, y, , ry] = L.head; g.lineCap = 'round'; curveLine([x - 2, y + ry - 4], [x + 10, y + ry + 4], [x + 2, y + ry + 8], d.curl || d.head || d.body, 5); dot(x, y + ry + 4, 3, d.curl || d.head || d.body); },
  eggshell: (d, L) => { const [x, y, rx] = L.head; shape([[x - rx, y - 6], [x - rx * 0.6, y - 1], [x - rx * 0.3, y - 8], [x, y - 1], [x + rx * 0.3, y - 8], [x + rx * 0.6, y - 1], [x + rx, y - 6], [x + rx * 0.8, y - 30], [x - rx * 0.8, y - 30]], '#f8f8f8', { curve: false }); shape([[x - 20, y - 22], [x - 12, y - 12], [x - 4, y - 22]], '#e04848', { curve: false }); shape([[x + 4, y - 22], [x + 12, y - 12], [x + 20, y - 22]], '#4a78d8', { curve: false }); },
  crown: (d, L) => { const [x, y, , ry] = L.head; for (const a of [-14, 0, 14]) shape([[x + a - 6, y + ry - 6], [x + a, y + ry + 8], [x + a + 6, y + ry - 6]], d.head || d.body); },
  split: (d, L) => { const [x, y, rx] = L.head; g.save(); g.beginPath(); g.rect(px(x - rx - 2), py(y), (rx * 2 + 4) * u, (rx + 4) * u); g.clip(); puff(x, y, rx, L.head[3], '#f8f8f8'); g.restore(); line([[x - rx + 1, y], [x + rx - 1, y]], '#303038', 1.6); },
  swirl: (d, L) => { const [x, y] = L.head; flat(x, y - 14, 15, 13, '#f8f8f8'); g.lineCap = 'round'; g.strokeStyle = '#303038'; g.lineWidth = 2 * u; g.beginPath(); for (let a = 0; a < Math.PI * 5; a += 0.2) { const r = 1 + a * 1.7; g.lineTo(px(x + Math.cos(a) * r * 0.9), py(y - 14 + Math.sin(a) * r * 0.75)); } g.stroke(); },
  spikes: (d, L) => { const [x, y, rx, ry] = L.head; for (const [a, b] of [[-rx, 6], [-rx * 0.8, 20], [rx * 0.8, 20], [rx, 6]]) shape([[x + a - 6 * Math.sign(a), y + b - 6], [x + a + 8 * Math.sign(a), y + b + 2], [x + a - 2 * Math.sign(a), y + b + 8]], d.head || d.body, { curve: false }); },
  crest: (d, L) => { const [x, y, , ry] = L.head; for (const [a, h] of [[-6, 12], [0, 16], [6, 12]]) shape([[x + a - 4, y + ry - 6], [x + a, y + ry + h], [x + a + 4, y + ry - 6]], d.crest); },
  gills: (d, L) => { const [x, y, rx] = L.head; for (const s of [-1, 1]) { for (const [a, b] of [[0, 6], [3, 0], [0, -6]]) shape([[x + s * (rx - 4), y + b - 3], [x + s * (rx + 10 + a), y + b], [x + s * (rx - 4), y + b + 3]], d.gills); } },
  flamecrest: (d) => { for (const [a, b, s] of [[-20, 80, 1], [0, 88, 1.2], [20, 80, 1]]) flame(a, b, s, '#e84030'); },
  beads: (d, L) => { const [x, y] = L.head; for (let i = -3; i <= 3; i++) puff(x + i * 7, y - 26 + Math.abs(i) * 1.5, 3.5, 3.5, d.beads); },
  leaf: (d, L) => { const [x, y, , ry] = L.head; shape([[x - 2, y + ry - 4], [x + 6, y + ry + 18], [x + 22, y + ry + 34], [x + 8, y + ry + 30], [x - 4, y + ry + 12]], d.leafc); line([[x, y + ry - 2], [x + 12, y + ry + 24]], sh(d.leafc, -1), 1.2); },
  jaw: (d, L) => { const [x, y] = L.head; flat(x, y - 14, 14, 7, '#e04040'); for (const a of [-8, 0, 8]) shape([[x + a - 2.5, y - 8], [x + a, y - 13], [x + a + 2.5, y - 8]], '#ffffff', { curve: false }); },
  snout: (d, L) => { const [x, y] = L.head; puff(x, y - 10, 10, 7, d.snout); flat(x - 3.5, y - 10, 1.6, 2.4, sh(d.snout, -2)); flat(x + 3.5, y - 10, 1.6, 2.4, sh(d.snout, -2)); },
  collar: (d, L) => { const [x, y] = L.head; shape([[x - 18, y - 22], [x, y - 32], [x + 18, y - 22], [x + 14, y - 28], [x - 14, y - 28]], d.collar); },
  scalchop: (d, L) => { const [x, y] = L.belly; shape([[x - 7, y + 4], [x + 7, y + 4], [x + 5, y - 5], [x - 5, y - 5]], d.scal); for (const a of [-3, 0, 3]) line([[x + a, y + 3], [x + a * 0.8, y - 4]], sh(d.scal, -1), 0.8); },
  freckles: (d, L) => { const [x, y] = L.head; flat(x, y - 6, 3, 2.2, d.nose || '#e8b090'); for (const s of [-1, 1]) for (const a of [0, 3]) dot(x + s * (18 + a), y - 6 - a / 2, 1, '#c87850'); },
  shell: (d, L) => { const [x, y, rx, ry] = L.body; puff(x, y + 6, rx + 2, ry - 2, d.shell); for (const a of [-12, 0, 12]) flat(x + a, y + 14, 4, 3, sh(d.shell, 1)); },
  sprout: (d, L) => { const [x, y, , ry] = L.head; line([[x, y + ry - 2], [x, y + ry + 6]], '#7a5a30', 1.6); for (const s of [-1, 1]) shape([[x, y + ry + 5], [x + s * 10, y + ry + 12], [x + s * 4, y + ry + 4]], d.sprout); },
  face: (d, L) => { const [x, y, rx, ry] = L.head; puff(x, y - ry * 0.28, rx * 0.82, ry * 0.66, d.facec); },
  coin: (d, L) => { const [x, y, , ry] = L.head; puff(x, y + ry - 7, 6, 6, '#f8d030'); flat(x, y + ry - 7, 3, 3, '#e0b020'); },
  whiskers: (d, L) => { const [x, y, rx] = L.head; for (const s of [-1, 1]) for (const a of [-2, 2]) line([[x + s * (rx - 10), y - 8 + a], [x + s * (rx + 6), y - 6 + a * 2]], '#4a3a30', 0.8); },
  hair: (d, L) => { const [x, y, rx, ry] = L.head; shape([[x - rx - 2, y + 2], [x - rx * 0.8, y + ry * 0.9], [x, y + ry + 4], [x + rx * 0.8, y + ry * 0.9], [x + rx + 2, y + 2], [x + rx * 0.5, y + ry * 0.4], [x, y + ry * 0.6], [x - rx * 0.5, y + ry * 0.4]], d.hairc); },
  dress: (d, L) => { const [x, y, rx, ry] = L.body; shape([[x - rx - 4, y - ry + 2], [x - rx * 0.5, y + ry], [x + rx * 0.5, y + ry], [x + rx + 4, y - ry + 2]], d.dress); },
  skullmask: (d, L) => { const [x, y, rx, ry] = L.head; puff(x, y - 2, rx * 0.8, ry * 0.75, '#e8e0d0'); },
  wings: (d, L) => { const [x, y, rx] = L.head; for (const s of [-1, 1]) { puff(x + s * (rx + 6), y - 4, 14, 11, d.wingc); puff(x + s * (rx + 2), y + 4, 12, 9, d.wingc); } },
  beak: (d, L) => { const [x, y] = L.head; shape([[x - 7, y - 6], [x, y - 13], [x + 7, y - 6], [x, y - 3]], d.beakc); },
  bill: (d, L) => { const [x, y] = L.head; puff(x, y - 12, 11, 6, d.beakc); line([[x - 8, y - 12], [x + 8, y - 12]], sh(d.beakc, -1), 0.8); },
  lilypad: (d, L) => { const [x, y, rx, ry] = L.head; shape([[x - rx - 10, y + ry - 6], [x - rx, y + ry + 6], [x + rx, y + ry + 6], [x + rx + 10, y + ry - 6], [x, y + ry - 2]], d.pad); },
  acorn: (d, L) => { const [x, y, rx, ry] = L.head; shape([[x - rx - 3, y + ry * 0.35], [x - rx * 0.9, y + ry + 2], [x, y + ry + 8], [x + rx * 0.9, y + ry + 2], [x + rx + 3, y + ry * 0.35]], d.cap); line([[x, y + ry + 6], [x + 2, y + ry + 12]], '#5a4a3a', 2); },
  curls: (d, L) => { const [x, y, , ry] = L.head; for (const a of [-7, 0, 7]) { g.lineCap = 'round'; curveLine([x + a, y + ry - 4], [x + a * 1.8, y + ry + 10], [x + a * 0.6, y + ry + 12], d.curlc, 3.5); } },
  stripes: (d, L) => { const [x, y, , ry] = L.head; for (const a of [-8, 0, 8]) line([[x + a, y + ry - 1], [x + a * 1.2, y + ry - 8]], '#303038', 1.8); },
  leaves: (d, L) => { const [x, y, , ry] = L.head; for (const [a, l] of [[-0.6, 26], [-0.2, 30], [0.2, 30], [0.6, 26], [0, 22]]) { g.save(); g.translate(px(x), py(y + ry - 6)); g.rotate(a); const s = g.createLinearGradient(0, 0, 0, -l * u); s.addColorStop(0, sh(d.leafc, -1)); s.addColorStop(1, sh(d.leafc, 1)); g.fillStyle = s; g.beginPath(); g.ellipse(0, -l * u / 2, 6 * u, l * u / 2, 0, 0, Math.PI * 2); g.fill(); g.restore(); } },
  fins: (d, L) => { const [x, y, rx, ry] = L.head; shape([[x - 12, y + ry - 4], [x - 6, y + ry + 12], [x + 4, y + ry + 18], [x + 8, y + ry + 4], [x + 12, y + ry - 4]], d.finc); for (const s of [-1, 1]) { line([[x + s * 10, y - 8], [x + s * (rx + 10), y - 20]], d.whisk, 2.2); } },
  horn: (d, L) => { const [x, y, , ry] = L.head; shape([[x - 4, y + ry - 4], [x, y + ry + 12], [x + 4, y + ry - 4]], '#c8c0b8', { curve: false }); },
  knobs: (d, L) => { const [x, y, rx, ry] = L.body; puff(x, y + 8, rx + 2, ry - 1, d.shell); for (const a of [-16, 0, 16]) puff(x + a, y + ry + 4, 4, 4, sh(d.shell, -1)); },
  skull: (d, L) => { const [x, y, rx, ry] = L.head; g.save(); g.beginPath(); g.rect(px(x - rx - 6), py(y + ry + 10), (rx * 2 + 12) * u, (ry + 10) * u); g.clip(); puff(x, y + 2, rx + 3, ry + 3, '#e8e0d0'); g.restore(); for (const s of [-1, 1]) shape([[x + s * (rx - 6), y + ry - 6], [x + s * (rx + 2), y + ry + 12], [x + s * (rx - 12), y + ry]], '#e8e0d0'); flat(x - 11, y + 3, 7, 6, '#3a3030'); flat(x + 11, y + 3, 7, 6, '#3a3030'); },
  chest: (d, L) => { const [x, y, rx, ry] = L.body; puff(x, y + ry * 0.3, rx * 0.9, ry * 0.55, d.chestc); },
  mane: (d) => { for (const [a, b, s] of [[-12, 76, 0.9], [-2, 82, 1.1], [10, 78, 1], [18, 68, 0.8]]) flame(a, b, s, d.manec); },
  tube: (d, L) => { const [x, y] = L.head; puff(x, y - 14, 5, 9, d.head || d.body); flat(x, y - 22, 3, 2, sh(d.head || d.body, -2)); },
  wool: (d, L) => { const [x, y, rx, ry] = L.body; for (const [a, b] of [[-rx * 0.6, 4], [0, 8], [rx * 0.6, 4], [-rx * 0.8, -6], [rx * 0.8, -6], [-rx * 0.3, -8], [rx * 0.3, -8]]) puff(x + a, y + b, 12, 10, d.woolc); },
  crescent: (d, L) => { const [x, y, , ry] = L.head; g.fillStyle = d.moon; g.beginPath(); g.arc(px(x), py(y + ry - 10), 6 * u, 0, Math.PI * 2); g.arc(px(x), py(y + ry - 7), 5 * u, 0, Math.PI * 2, true); g.fill('evenodd'); },
  muzzle: (d, L) => { const [x, y] = L.head; puff(x, y - 12, 11, 8, d.muz); flat(x, y - 8, 3.2, 2.2, '#3a2820'); },
  trunk: (d, L) => { const [x, y] = L.head; g.lineCap = 'round'; curveLine([x, y - 6], [x + 2, y - 22], [x + 10, y - 24], d.head || d.body, 7); },
  spout: (d, L) => { const [x, y, , ry] = L.head; for (const a of [-6, 0, 6]) { g.lineCap = 'round'; curveLine([x, y + ry], [x + a, y + ry + 10], [x + a * 2, y + ry + 12], '#bfe0f8', 2.4); } },
  bluestripe: (d, L) => { const [x, y, , ry] = L.head; shape([[x - 6, y + ry - 2], [x, y + ry + 2], [x + 6, y + ry - 2], [x + 3, y + 2], [x - 3, y + 2]], d.stripe); },
  zigzag: (d, L) => { const [x, y] = L.body; line([[x - 14, y], [x - 7, y - 6], [x, y], [x + 7, y - 6], [x + 14, y]], d.zig, 3); },
  flippers: (d, L) => { const [x, y, rx] = L.head; for (const s of [-1, 1]) puff(x + s * (rx + 2), y - 10, 6, 11, d.head || d.body, s * 0.8); },
  ears3: (d, L) => { const [x, y, rx, ry] = L.head; for (const s of [-1, 1]) puff(x + s * rx * 0.75, y + ry * 0.7, 7, 7, d.head || d.body); },
  tuft: (d, L) => { const [x, y, , ry] = L.head; for (const a of [-5, 0, 5]) puff(x + a, y + ry + 2 + (a ? 0 : 3), 4.5, 6, d.tuftc); },
  smallarms: () => {},
};

/** One doll. `cx` its middle and `b` the floor, `size` its height in the kit's units. */
export function plushDoll(cx, b, size, d) {
  g = ctx(); u = size / 100; X = cx; B = b;
  const L = BUILDS[d.shape || 'biped'], body = d.body, head = d.head || body;
  const feet = d.feet || sh(body, -1), arms = d.arms || body;
  g.save();
  g.lineCap = g.lineJoin = 'round';
  for (const e of d.under || []) EXTRAS[e](d, L);
  if (d.tail) tail(d.tail, L.tail, d.tailc || body, d.tailtip);
  if (d.ears) for (const s of [-1, 1]) ear(d.ears, s, L.ear, d.earc || head, d.eartip, d.earin);
  if (L.body) puff(L.body[0], L.body[1], L.body[2], L.body[3], body);
  if (L.belly && d.belly) puff(L.belly[0], L.belly[1], L.belly[2], L.belly[3], d.belly);
  for (const e of d.mid || []) EXTRAS[e](d, L);
  for (const [x, y, rx, ry] of L.feet) puff(x, y, rx, ry, feet);
  if (!d.noarms) for (const [x, y, rx, ry, rot] of L.arms) puff(x, y, rx, ry, arms, rot);
  puff(L.head[0], L.head[1], L.head[2], L.head[3], head);
  for (const e of d.top || []) EXTRAS[e](d, L);
  face(d, L);
  // fuzz: tiny flecks of light and shade over the fabric
  g.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < 90; i++) {
    const a = Math.sin(i * 12.9898) * 43758.5453, r = a - Math.floor(a), b2 = Math.sin(i * 78.233) * 12345.6789, q = b2 - Math.floor(b2);
    dot((r - 0.5) * 84, q * 96, 0.5, i % 2 ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.07)');
  }
  g.restore();
}

/** Eyes, cheeks and mouth. */
function face(d, L) {
  const [hx, hy, hrx] = L.head, [ex, ey] = L.eye, mouthY = L.mouth ?? hy - 9;
  const eye = d.eye || '#202028';
  if (d.cheeks) for (const s of [-1, 1]) flat(hx + s * (ex + 10), ey - 9, 5.5, 3.8, rgba(d.cheeks, 0.9));
  const eyes = d.one ? [0] : [-1, 1];
  for (const s of eyes) {
    const x = hx + s * ex;
    if (d.eyes === 'shut') { curveLine([x - 5, ey], [x, ey - 3], [x + 5, ey], '#2a2028', 1.8); continue; }
    if (d.eyes === 'dot') { dot(x, ey, 2.4, eye); dot(x - 0.8, ey + 0.9, 0.8, '#ffffff'); continue; }
    if (d.eyes === 'white') { puff(x, ey, 6, 7, '#ffffff'); dot(x + s * 0.5, ey - 0.5, 1.8, '#202028'); continue; }
    const rx = d.eyes === 'big' ? 6 : 4.6, ry = rx * 1.3;
    flat(x, ey - 0.6, rx * 1.05, ry * 1.05, 'rgba(0,0,0,0.25)');
    const eg = g.createRadialGradient(px(x - rx * 0.3), py(ey + ry * 0.35), 0, px(x), py(ey), ry * u);
    eg.addColorStop(0, sh(eye, 2)); eg.addColorStop(0.5, eye); eg.addColorStop(1, sh(eye, -2));
    g.fillStyle = eg; g.beginPath(); g.ellipse(px(x), py(ey), rx * u, ry * u, 0, 0, Math.PI * 2); g.fill();
    if (d.eyes === 'slant') flat(x + s * 1, ey + ry * 0.9, rx * 1.4, ry * 0.5, d.head || d.body, s * -0.45);
    dot(x - rx * 0.32, ey + ry * 0.38, rx * 0.34, 'rgba(255,255,255,0.95)');
    dot(x + rx * 0.3, ey - ry * 0.35, rx * 0.15, 'rgba(255,255,255,0.6)');
  }
  const ink = 'rgba(50,25,30,0.9)';
  switch (d.mouth || 'smile') {
    case 'smile': curveLine([hx - 4, mouthY + 1], [hx, mouthY - 3], [hx + 4, mouthY + 1], ink, 1.4); break;
    case 'w': curveLine([hx - 5, mouthY + 1], [hx - 2.5, mouthY - 2.5], [hx, mouthY], ink, 1.3); curveLine([hx, mouthY], [hx + 2.5, mouthY - 2.5], [hx + 5, mouthY + 1], ink, 1.3); break;
    case 'open': { g.fillStyle = '#b83848'; g.beginPath(); g.moveTo(px(hx - 5), py(mouthY + 1)); g.quadraticCurveTo(px(hx), py(mouthY - 8), px(hx + 5), py(mouthY + 1)); g.closePath(); g.fill(); break; }
    case 'grin': { g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(px(hx - 14), py(mouthY + 4)); g.quadraticCurveTo(px(hx), py(mouthY - 10), px(hx + 14), py(mouthY + 4)); g.closePath(); g.fill(); line([[hx - 12, mouthY + 2], [hx + 12, mouthY + 2]], '#a0a0a8', 0.8); break; }
    case 'line': line([[hx - 4, mouthY], [hx + 4, mouthY]], ink, 1.3); break;
    case 'lips': puff(hx, mouthY - 1, 5, 3, d.lipc || '#d878c0'); break;
    case 'none': break;
  }
}

/** Every doll's pattern, by its Pokémon. */
export const PLUSH = {
  pikachu: { body: '#f8d030', ears: 'tall', eartip: '#2a2028', tail: 'bolt', tailtip: '#a86828', cheeks: '#e84040', mouth: 'w' },
  clefairy: { body: '#f8b8c8', ears: 'pointy', eartip: '#8a5a3a', top: ['curl'], tail: 'curl', mouth: 'smile', cheeks: '#f87890', wings: 0 },
  jigglypuff: { shape: 'ball', body: '#f8b8d0', ears: 'cat', earin: '#5a3040', top: ['curl'], eye: '#3a6ab8', eyes: 'big', mouth: 'smile' },
  snorlax: { body: '#3a6a7a', belly: '#f0e0c0', feet: '#f0e0c0', ears: 'nub', top: ['face'], facec: '#f0e0c0', eyes: 'shut', mouth: 'smile' },
  bulbasaur: { shape: 'quad', body: '#78c8a8', ears: 'cat', earin: '#5aa088', under: ['bulb'], top: ['spots'], eye: '#c83838', mouth: 'open' },
  charmander: { body: '#f08838', belly: '#f8d878', tail: 'flame', tailtip: '#f84030', mouth: 'open' },
  squirtle: { body: '#78b8e8', belly: '#f0e0a0', under: [], mid: ['plastron'], tail: 'curl', eye: '#7a3a28', mouth: 'smile', shellrim: 1 },
  eevee: { shape: 'quad', body: '#b87838', ears: 'long', eartip: '#6a4420', tail: 'fluffy', tailtip: '#f0e0b0', ruff: '#f0e0b0', top: ['ruff'], mouth: 'w' },
  psyduck: { body: '#f8d040', top: ['hair3', 'bill'], beakc: '#f8f0b0', eyes: 'white', mouth: 'none' },
  togepi: { shape: 'ball', body: '#f8f0c0', top: ['crown'], mid: [], noarms: false, under: [], eggshell: 1, mouth: 'open' },
  marill: { shape: 'ball', body: '#4a88e8', ears: 'round', earin: '#3a68c0', belly: '#f8f8f8', tail: 'ball', tailtip: '#303038', top: ['tummy'], mouth: 'smile', cheeks: '#e86a7a' },
  ditto: { shape: 'blob', body: '#b890d8', eyes: 'dot', eye: '#3a2a4a', mouth: 'line' },
  voltorb: { shape: 'ball', body: '#e04040', top: ['split'], eyes: 'slant', eye: '#202028', mouth: 'none', noarms: true, feet: '#d8d8d8' },
  poliwag: { shape: 'ball', body: '#5a78d8', top: ['swirl'], tail: 'fin', tailc: '#f8f8f8', feet: '#f8f8f8', mouth: 'smile' },
  gengar: { body: '#7a58b8', ears: 'pointy', top: ['spikes'], eye: '#e84848', eyes: 'slant', mouth: 'grin' },
  mew: { body: '#f8b8d0', ears: 'cat', tail: 'whip', eye: '#4a88d8', eyes: 'big', mouth: 'smile' },
  torchic: { shape: 'ball', body: '#f08838', top: ['crest', 'beak'], crest: '#f8a850', beakc: '#f8d030', feet: '#f8d030', arms: '#f8a850', mouth: 'none' },
  treecko: { body: '#58b848', belly: '#e85848', tail: 'leaf', tailc: '#2f7a32', eye: '#c8a020', mouth: 'smile' },
  mudkip: { shape: 'quad', body: '#5aa8e8', belly: '#c8e8f8', ears: 'fin', earc: '#4a88c8', top: ['gills'], gills: '#f08838', tail: 'fin', tailc: '#3a6ab0', mouth: 'smile' },
  cyndaquil: { shape: 'quad', body: '#f0e0a0', head: '#2a4a6a', under: ['flamecrest'], top: ['face'], facec: '#f0e0a0', eyes: 'shut', mouth: 'smile', feet: '#d8c080' },
  chikorita: { shape: 'quad', body: '#b8e088', top: ['leaf', 'beads'], leafc: '#58b848', beads: '#7aa838', eye: '#c8a020', mouth: 'smile' },
  totodile: { body: '#4a98e0', belly: '#f0e0a0', under: ['spikes'], top: ['jaw'], tail: 'stub', mouth: 'none', eye: '#a83020' },
  tepig: { shape: 'quad', body: '#f08838', belly: '#303038', ears: 'cat', top: ['snout'], snout: '#f8b080', tail: 'curl', tailc: '#303038', mouth: 'smile' },
  snivy: { body: '#58b848', belly: '#f0e8b0', top: ['collar'], collar: '#f8d030', tail: 'leaf', ears: 'side', earc: '#2f7a32', eye: '#a83020', mouth: 'smile' },
  oshawott: { body: '#5a90d8', head: '#f8f8f8', arms: '#f8f8f8', feet: '#f8f8f8', ears: 'nub', mid: ['scalchop'], scal: '#f8d030', top: ['freckles'], nose: '#e8b090', mouth: 'open' },
  turtwig: { shape: 'quad', body: '#78c868', under: ['shell'], shell: '#a87848', top: ['sprout'], sprout: '#4fa042', feet: '#a87848', mouth: 'smile' },
  chimchar: { body: '#e88838', belly: '#f8e0b0', ears: 'round', earc: '#f8e0b0', top: ['face'], facec: '#f8e0b0', tail: 'flame', tailtip: '#f04030', mouth: 'open' },
  piplup: { body: '#4a78c8', top: ['face', 'beak'], facec: '#f8f8f8', beakc: '#f8b830', feet: '#f8b830', mouth: 'none', eyes: 'big' },
  pichu: { body: '#f8d878', ears: 'big', earin: '#2a2028', cheeks: '#f87890', tail: 'bolt', tailc: '#2a2028', mouth: 'w' },
  meowth: { body: '#f0e0b0', ears: 'cat', earin: '#7a5a3a', top: ['coin', 'whiskers'], tail: 'curl', tailc: '#b88858', feet: '#b88858', mouth: 'w' },
  smoochum: { body: '#f8c8c0', mid: ['dress'], dress: '#d878c0', top: ['hair'], hairc: '#f8e070', eye: '#3a6ab8', mouth: 'lips', lipc: '#d878c0' },
  duskull: { shape: 'ball', body: '#4a4a58', top: ['skullmask'], one: true, eye: '#e83030', mouth: 'none', noarms: true, feet: '#3a3a48' },
  wynaut: { shape: 'ball', body: '#78b8f0', ears: 'cat', tail: 'ball', tailtip: '#3a68b8', cheeks: '#e86868', mouth: 'open', eyes: 'shut' },
  baltoy: { shape: 'ball', body: '#c8a068', top: ['ears3'], eyes: 'dot', eye: '#e05040', mouth: 'none', feet: '#a88048' },
  kecleon: { body: '#78c858', belly: '#f0e080', mid: ['zigzag'], zig: '#e04848', top: ['crest'], crest: '#4a9a40', tail: 'curl', eye: '#c8a020', mouth: 'smile' },
  azurill: { shape: 'ball', body: '#5aa0e8', ears: 'round', tail: 'ball', tailtip: '#303038', mouth: 'smile', cheeks: '#e88898' },
  skitty: { shape: 'quad', body: '#f8a8c0', ears: 'big', earin: '#f8e8c8', top: ['face'], facec: '#f8e8c8', tail: 'ball', tailc: '#e86878', mouth: 'w' },
  swablu: { shape: 'ball', body: '#68b8f0', top: ['wings', 'tuft', 'beak'], wingc: '#f8f8f8', tuftc: '#f8f8f8', beakc: '#f8c830', noarms: true, feet: '#f8c830', mouth: 'none' },
  gulpin: { shape: 'blob', body: '#a8d870', top: ['tuft'], tuftc: '#f8d030', eyes: 'dot', mouth: 'line' },
  lotad: { shape: 'ball', body: '#5a90d8', top: ['lilypad', 'bill'], pad: '#58b848', beakc: '#f8d030', mouth: 'none', noarms: true },
  seedot: { shape: 'ball', body: '#c89858', top: ['acorn'], cap: '#5a4a3a', eyes: 'dot', mouth: 'line', noarms: true },
  vulpix: { shape: 'quad', body: '#d86838', belly: '#f0c890', ears: 'pointy', earin: '#a84828', top: ['curls'], curlc: '#e88848', tail: 'fluffy', tailc: '#e88848', mouth: 'smile' },
  growlithe: { shape: 'quad', body: '#f08838', ears: 'cat', top: ['ruff', 'stripes'], ruff: '#f0e0b0', tail: 'fluffy', tailc: '#f0e0b0', mouth: 'open' },
  oddish: { shape: 'ball', body: '#5a68c8', top: ['leaves'], leafc: '#4fa042', eyes: 'dot', eye: '#c83838', mouth: 'smile', noarms: true },
  slowpoke: { shape: 'quad', body: '#f8a0b0', ears: 'round', top: ['muzzle'], muz: '#f8e8c8', tail: 'curl', eyes: 'white', mouth: 'none' },
  magikarp: { shape: 'fish', body: '#e85030', top: ['fins'], finc: '#f8f0e0', whisk: '#f8d878', tail: 'fin', tailc: '#f8f0e0', eyes: 'white', mouth: 'open' },
  lapras: { shape: 'quad', body: '#5aa0e0', belly: '#f0e8c0', under: ['knobs'], shell: '#a8a8b8', top: ['horn'], ears: 'round', mouth: 'smile', eyes: 'big' },
  dratini: { shape: 'ball', body: '#78a0e8', belly: '#f8f8f8', ears: 'side', earc: '#f8f8f8', tail: 'curl', mouth: 'smile', noarms: true },
  cubone: { body: '#a87848', belly: '#e8e0d0', top: ['skull'], eye: '#303038', mouth: 'line' },
  abra: { body: '#f8c840', mid: ['chest'], chestc: '#a86838', ears: 'pointy', eyes: 'shut', tail: 'stub', mouth: 'none' },
  ponyta: { shape: 'quad', body: '#f8e8b8', under: ['mane'], manec: '#f06030', tail: 'flame', tailtip: '#f06030', ears: 'cat', feet: '#c8b890', mouth: 'smile' },
  horsea: { body: '#68b8e8', belly: '#f0e8b0', top: ['tube'], ears: 'fin', tail: 'curl', mouth: 'none', noarms: true },
  wooper: { shape: 'ball', body: '#78c0e8', top: ['gills'], gills: '#9068b8', eyes: 'dot', mouth: 'smile', noarms: true },
  mareep: { shape: 'quad', body: '#f8d860', mid: ['wool'], woolc: '#f8f8f0', ears: 'cat', earin: '#303038', tail: 'ball', tailc: '#f8d030', tailtip: '#303038', mouth: 'smile', feet: '#303038' },
  teddiursa: { body: '#a86838', ears: 'round', earin: '#e8c890', top: ['crescent', 'muzzle'], moon: '#f8d878', muz: '#e8c890', mouth: 'none' },
  phanpy: { shape: 'quad', body: '#78b0e0', ears: 'big', earin: '#e86868', top: ['trunk'], mouth: 'none' },
  spheal: { shape: 'ball', body: '#78a8e8', belly: '#f0e8c0', top: ['flippers'], noarms: true, mouth: 'smile', cheeks: '#e89898' },
  wailmer: { shape: 'fish', body: '#4a78c8', top: ['spout'], tail: 'fin', mouth: 'smile', eyes: 'dot', noarms: false },
  munchlax: { body: '#2a5a6a', belly: '#f0e0c0', ears: 'nub', top: ['face'], facec: '#f0e0c0', eyes: 'shut', mouth: 'open' },
  pachirisu: { body: '#f8f8f8', ears: 'cat', earin: '#68b0e8', top: ['bluestripe'], stripe: '#68b0e8', tail: 'fluffy', tailc: '#68b0e8', tailtip: '#f8f8f8', cheeks: '#f8d030', mouth: 'w' },
};
// the few that need a part drawn behind or below the body
PLUSH.squirtle.under = ['shellrim'];
PLUSH.togepi.top = ['crown', 'eggshell'];
EXTRAS.tummy = (d, L) => { const [x, y, rx, ry] = L.head; puff(x, y - ry * 0.45, rx * 0.6, ry * 0.42, d.belly); };
