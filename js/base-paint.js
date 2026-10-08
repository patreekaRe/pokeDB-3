/* base-paint.js  -  the Secret Base furniture's paint kit (32 pixels a tile, the user's pick of "detailed pixel" over
   smooth, 2026-10-08). Every painter in js/base-furniture.js and js/base-furniture-kinds.js draws with these on the
   context `paintWith()` hands it, in the palette `k` of the piece's colour theme. A colour's shades are `sh(c, n)`, n from
   -3 (near black) to +3 (near white). `finish()` then outlines the piece in a dark shade of whatever it borders and lights
   its top-left edge, so painters needn't. */

export const RES = 2, FT = 16 * RES;   // a tile is 32 painted pixels
export const WALL_PX = 48 * RES;       // a wall piece's strip
export const HEAD = 64;                 // room above an upright's footprint for its height

let g, pal;
/** The palette of the piece being painted (a THEMES entry: w wood, c cloth, a accent, p pale, m metal, g glow, leaf, pot). */
export const k = new Proxy({}, { get: (_, key) => pal[key] });

export function paintWith(ctx, palette, fn) {
  const keep = [g, pal];
  g = ctx; pal = palette;
  try { fn(); } finally { [g, pal] = keep; }
}

const shades = new Map();
const STEP = { '-3': 0.32, '-2': 0.52, '-1': 0.74, 0: 1, 1: 1.2, 2: 1.42, 3: 1.7 };
/** A colour darker (n < 0) or lighter (n > 0), in steps. */
export function sh(hex, n = 0) {
  if (!n) return hex;
  const key = hex + n;
  let out = shades.get(key);
  if (out) return out;
  const f = STEP[n], v = parseInt(hex.slice(1), 16), ch = [v >> 16, (v >> 8) & 255, v & 255];
  // darker shades lean a little cooler and lighter ones warmer, as pixel artists shade
  const mix = ch.map((c, i) => Math.max(0, Math.min(255, Math.round(f <= 1 ? c * f + (i === 2 ? (1 - f) * 18 : 0) : c + (255 - c) * (f - 1) * (i === 2 ? 0.85 : 1)))));
  out = '#' + mix.map(c => c.toString(16).padStart(2, '0')).join('');
  shades.set(key, out);
  return out;
}

export const R = (x, y, w, h, c) => { if (w <= 0 || h <= 0) return; g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
export const P = (x, y, c) => R(x, y, 1, 1, c);
export const clear = (x, y, w, h) => g.clearRect(x, y, w, h);
/** A stable hash of a few numbers, 0-1: for grain and specks that look random but never change. */
export const hash = (a, b = 0, c = 0) => { let h = (a * 374761393 + b * 668265263 + c * 2246822519) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

/** A flat panel lit from the top left: a light top and left edge, a dark bottom and right. */
export function panel(x, y, w, h, c, depth = 1) {
  R(x, y, w, h, c);
  R(x, y, w, depth, sh(c, 1)); R(x, y, depth, h, sh(c, 1));
  R(x, y + h - depth, w, depth, sh(c, -1)); R(x + w - depth, y + depth, depth, h - depth, sh(c, -1));
  P(x, y, sh(c, 2));
}
/** A panel set into a frame: a dark inner shadow under its top and left edge. */
export function inset(x, y, w, h, c) {
  R(x, y, w, h, c); R(x, y, w, 1, sh(c, -2)); R(x, y, 1, h, sh(c, -1)); R(x, y + h - 1, w, 1, sh(c, 1));
}
/** Wood: a panel with grain running along it. */
export function wood(x, y, w, h, c, along = 'x') {
  panel(x, y, w, h, c);
  const n = Math.round(x * 7 + y * 13 + w);
  if (along === 'x') {
    for (let j = y + 2; j < y + h - 2; j += 3) {
      let i = x + 1 + Math.floor(hash(n, j) * 6);
      while (i < x + w - 3) { const len = 3 + Math.floor(hash(n, j, i) * 9); R(i, j, Math.min(len, x + w - 2 - i), 1, sh(c, -1)); i += len + 2 + Math.floor(hash(i, j, n) * 6); }
      if (hash(j, n, 9) < 0.3) P(x + 2 + Math.floor(hash(j, n) * (w - 4)), j + 1, sh(c, -2));
    }
  } else {
    for (let i = x + 2; i < x + w - 2; i += 3) {
      let j = y + 1 + Math.floor(hash(n, i) * 6);
      while (j < y + h - 3) { const len = 3 + Math.floor(hash(n, i, j) * 9); R(i, j, 1, Math.min(len, y + h - 2 - j), sh(c, -1)); j += len + 2 + Math.floor(hash(j, i, n) * 6); }
    }
  }
}
/** A padded cushion: rounded corners, a soft highlight along the top, shadow underneath. */
export function cushion(x, y, w, h, c, r = 2) {
  R(x + r, y, w - r * 2, h, c); R(x, y + r, w, h - r * 2, c); if (r > 1) R(x + 1, y + 1, w - 2, h - 2, c);
  R(x + r, y + 1, w - r * 2, 2, sh(c, 1)); R(x + 1, y + r, 1, h - r * 2, sh(c, 1));
  R(x + r, y + h - 2, w - r * 2, 2, sh(c, -1)); R(x + w - 2, y + r, 1, h - r * 2, sh(c, -1));
  R(x + r + 1, y + 2, Math.max(1, Math.floor(w / 3)), 1, sh(c, 2));
}
/** A shaded ball: dark rim, lit from the upper left, with a glint. */
export function sphere(cx, cy, r, c) {
  disc(cx, cy, r, sh(c, -1));
  disc(cx - r * 0.15, cy - r * 0.15, r * 0.85, c);
  disc(cx - r * 0.35, cy - r * 0.35, r * 0.45, sh(c, 1));
  R(cx - r * 0.45, cy - r * 0.5, Math.max(1, r * 0.25), Math.max(1, r * 0.2), sh(c, 3));
}
export function disc(cx, cy, r, c) {
  for (let j = -Math.ceil(r); j <= Math.ceil(r); j++) {
    const s = r * r - j * j;
    if (s < 0) continue;
    const h = Math.sqrt(s);
    R(Math.round(cx - h), Math.round(cy + j), Math.round(cx + h) - Math.round(cx - h) + 1, 1, c);
  }
}
export function oval(cx, cy, rx, ry, c) {
  for (let j = -Math.ceil(ry); j <= Math.ceil(ry); j++) {
    const s = 1 - (j * j) / (ry * ry);
    if (s < 0) continue;
    const h = rx * Math.sqrt(s);
    R(Math.round(cx - h), Math.round(cy + j), Math.round(cx + h) - Math.round(cx - h) + 1, 1, c);
  }
}
/** A lit oval: a rounded thing seen side on (a pot's belly, a cushion's end). */
export function ovalShade(cx, cy, rx, ry, c) {
  oval(cx, cy, rx, ry, sh(c, -1)); oval(cx - rx * 0.12, cy - ry * 0.12, rx * 0.85, ry * 0.85, c); oval(cx - rx * 0.35, cy - ry * 0.4, rx * 0.4, ry * 0.35, sh(c, 1));
}
/** An upright cylinder (a leg, a pot, a can): shaded across, with a highlight stripe. */
export function cyl(x, y, w, h, c) {
  R(x, y, w, h, c);
  const hi = Math.max(1, Math.round(w * 0.2));
  R(x, y, Math.max(1, Math.round(w * 0.15)), h, sh(c, -1));
  R(x + Math.round(w * 0.22), y, hi, h, sh(c, 1));
  if (w > 4) R(x + Math.round(w * 0.27), y, 1, h, sh(c, 2));
  R(x + w - Math.max(1, Math.round(w * 0.3)), y, Math.max(1, Math.round(w * 0.3)), h, sh(c, -1));
  R(x + w - 1, y, 1, h, sh(c, -2));
}
/** A metal rod or pole. */
export const rod = (x, y, w, h, c) => cyl(x, y, w, h, c);
/** Glass: tinted, with two diagonal glints. */
export function glass(x, y, w, h, tint = '#bfe0f0') {
  R(x, y, w, h, tint); R(x, y, w, 1, sh(tint, -1)); R(x, y, 1, h, sh(tint, -1));
  for (let i = 0; i < Math.min(w, h); i++) { if (x + 3 + i < x + w && y + h - 3 - i > y) { P(x + 2 + i, y + Math.round(h * 0.55) - i, sh(tint, 2)); } if (x + 6 + i < x + w && y + Math.round(h * 0.8) - i > y) P(x + 5 + i, y + Math.round(h * 0.8) - i, sh(tint, 2)); }
}
/** A leaf: an oval with its midrib, lit on top. */
export function leaf(cx, cy, rx, ry, c, tilt = 0) {
  for (let j = -ry; j <= ry; j++) {
    const s = 1 - (j * j) / (ry * ry);
    if (s < 0) continue;
    const h = rx * Math.sqrt(s), off = Math.round(tilt * j / ry * rx * 0.6);
    R(Math.round(cx - h) + off, cy + j, Math.round(h * 2) + 1, 1, j < -ry * 0.2 ? sh(c, 1) : j > ry * 0.4 ? sh(c, -1) : c);
    P(cx + off, cy + j, sh(c, -2));
  }
}
/** A cluster of leaves, for a bush or a tree's crown. */
export function foliage(cx, cy, r, c, seed = 0) {
  disc(cx, cy, r, sh(c, -2));
  disc(cx, cy - 1, r - 1, sh(c, -1));
  for (let i = 0; i < r * 1.6; i++) {
    const a = hash(seed, i) * Math.PI * 2, d = hash(i, seed, 3) * (r - 3);
    const lx = cx + Math.cos(a) * d, ly = cy + Math.sin(a) * d - 1;
    const tone = ly < cy - r * 0.3 ? 1 : ly > cy + r * 0.3 ? -1 : 0;
    oval(lx, ly, 2.5, 1.5, sh(c, tone));
    P(lx - 1, ly - 1, sh(c, tone + 1));
  }
}
/** A filled triangle pointing up, `slope` pixels out per row. */
export function tri(cx, top, h, c, slope = 1) {
  for (let j = 0; j < h; j++) { const half = Math.floor(j * slope); R(cx - half, top + j, half * 2 + 1, 1, c); }
}
/** Speckle an area with a darker shade: fabric weave, stone, sand. */
export function speckle(x, y, w, h, c, n = 1, density = 0.12) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (hash(i, j, n) < density) P(i, j, c);
}
/** A pixel bitmap: each row a string, each character a colour from `ink`. Blank or '.' is clear. */
export function bits(rows, x, y, ink, s = 1) {
  rows.forEach((row, j) => [...row].forEach((ch, i) => { const c = ink[ch]; if (c) R(x + i * s, y + j * s, s, s, c); }));
}
/** A bitmap drawn big and shaded: every cell's top-left lit and bottom-right in shadow where it meets the edge. */
export function stamp(rows, x, y, ink, s = 2) {
  const at = (i, j) => j >= 0 && j < rows.length && i >= 0 && i < rows[j].length && ink[rows[j][i]];
  rows.forEach((row, j) => [...row].forEach((ch, i) => {
    const c = ink[ch];
    if (!c) return;
    R(x + i * s, y + j * s, s, s, c);
    if (s < 2) return;
    if (!at(i, j - 1) || rows[j - 1][i] !== ch) R(x + i * s, y + j * s, s, 1, sh(c, 1));
    if (!at(i - 1, j)) R(x + i * s, y + j * s, 1, s, sh(c, 1));
    if (!at(i, j + 1)) R(x + i * s, y + j * s + s - 1, s, 1, sh(c, -1));
    if (!at(i + 1, j)) R(x + i * s + s - 1, y + j * s, 1, s, sh(c, -1));
  }));
}
/** A soft shadow on the floor under an upright piece. */
export function floorShadow(x, b, w) {
  g.fillStyle = 'rgba(30,18,10,0.28)';
  for (let j = 0; j < 3; j++) { const inset2 = 2 - j; g.fillRect(x + inset2 + 1, b - 3 + j, w - inset2 * 2 - 2, 1); }
}

/** The last pass on a painted piece: a 1 px outline in a dark shade of what it borders, and its silhouette's top-left
    edge caught by the light. */
export function finish(canvas, { outline = true, rim = true } = {}) {
  const w = canvas.width, h = canvas.height, ctx = canvas.getContext('2d');
  const im = ctx.getImageData(0, 0, w, h), d = im.data, out = new Uint8ClampedArray(d);
  const solid = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 200;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    if (d[i + 3] > 200) {
      if (!rim) continue;
      // the lit rim: just inside the silhouette, where the outside is above or left
      if (!solid(x, y - 1) || !solid(x - 1, y)) for (let c = 0; c < 3; c++) out[i + c] = Math.min(255, d[i + c] + (255 - d[i + c]) * 0.22);
      else if (!solid(x, y + 1) || !solid(x + 1, y)) for (let c = 0; c < 3; c++) out[i + c] = d[i + c] * 0.82;
      continue;
    }
    if (!outline || d[i + 3] > 0) continue;
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      if (!solid(x + dx, y + dy)) continue;
      const j = ((y + dy) * w + x + dx) * 4;
      out[i] = d[j] * 0.3; out[i + 1] = d[j + 1] * 0.28; out[i + 2] = d[j + 2] * 0.34 + 10; out[i + 3] = 255;
      break;
    }
  }
  im.data.set(out); ctx.putImageData(im, 0, 0);
  return canvas;
}

/** Paint inside a box only (a picture inside its frame). */
export function clipped(x, y, w, h, fn) {
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  try { fn(); } finally { g.restore(); }
}
