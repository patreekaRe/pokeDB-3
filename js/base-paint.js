/* base-paint.js  -  the Secret Base furniture's paint kit, smooth since 2026-10-08 (the user's call: "legit furniture,
   clean and detailed, all of it smooth"; it was detailed pixel art at 32 pixels a tile). Painters still draw in a tile's
   32 units, but on a context `paintWith()` hands them scaled up (HD, 4 canvas pixels a unit, for textures; 1 for the
   carving in js/base-model.js), and every brush here is anti-aliased: gradients, round ends, true circles. A colour's
   shades are `sh(c, n)`, n from -3 (near black) to +3 (near white). `finish()` then gives the piece a soft dark outline
   in a shade of whatever it borders and lights its top-left edge, so painters needn't. */

export const RES = 2, FT = 16 * RES;   // a tile is 32 painted units
export const WALL_PX = 48 * RES;       // a wall piece's strip
export const HEAD = 64;                 // room above an upright's footprint for its height
export const HD = 4;                    // canvas pixels a unit, for the pictures shown (textures, the store, the tray)

let g, pal;
/** The palette of the piece being painted (a THEMES entry: w wood, c cloth, a accent, p pale, m metal, g glow, leaf, pot). */
export const k = new Proxy({}, { get: (_, key) => pal[key] });

/** The context being painted, for a painter that draws its own paths (js/base-dolls.js). */
export const ctx = () => g;

export function paintWith(ctx, palette, fn) {
  const keep = [g, pal];
  g = ctx; pal = palette;
  g.lineJoin = g.lineCap = 'round';
  try { fn(); } finally { [g, pal] = keep; }
}

const shades = new Map();
const STEP = { '-3': 0.32, '-2': 0.52, '-1': 0.74, 0: 1, 1: 1.2, 2: 1.42, 3: 1.7 };
/** A colour darker (n < 0) or lighter (n > 0), in steps. */
export function sh(hex, n = 0) {
  if (!n || hex[0] !== '#' || hex.length !== 7) return hex;
  const key = hex + n;
  let out = shades.get(key);
  if (out) return out;
  const f = STEP[n], v = parseInt(hex.slice(1), 16), ch = [v >> 16, (v >> 8) & 255, v & 255];
  // darker shades lean a little cooler and lighter ones warmer
  const mix = ch.map((c, i) => Math.max(0, Math.min(255, Math.round(f <= 1 ? c * f + (i === 2 ? (1 - f) * 18 : 0) : c + (255 - c) * (f - 1) * (i === 2 ? 0.85 : 1)))));
  out = '#' + mix.map(c => c.toString(16).padStart(2, '0')).join('');
  shades.set(key, out);
  return out;
}
/** A colour with an alpha, for soft overlays. */
const alpha = (hex, a) => {
  if (hex[0] !== '#' || hex.length !== 7) return hex;
  const v = parseInt(hex.slice(1), 16);
  return `rgba(${v >> 16},${(v >> 8) & 255},${v & 255},${a})`;
};
const lin = (x0, y0, x1, y1, stops) => {
  const l = g.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([t, c]) => l.addColorStop(t, c));
  return l;
};
const fill = (style, path) => { g.fillStyle = style; g.beginPath(); path(); g.fill(); };

export const R = (x, y, w, h, c) => { if (w <= 0 || h <= 0) return; g.fillStyle = c; g.fillRect(x, y, w, h); };
/** A dot: a fleck, a stud, a glint. */
export const P = (x, y, c) => fill(c, () => g.arc(x + 0.5, y + 0.5, 0.62, 0, Math.PI * 2));
export const clear = (x, y, w, h) => g.clearRect(x, y, w, h);
/** A stable hash of a few numbers, 0-1: for grain and specks that look random but never change. */
export const hash = (a, b = 0, c = 0) => { let h = (a * 374761393 + b * 668265263 + c * 2246822519) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

/** A flat panel lit from the top left: softly graded, a fine highlight along its top and left, shadow bottom and right. */
export function panel(x, y, w, h, c, depth = 1) {
  if (w <= 0 || h <= 0) return;
  const r = Math.min(0.8, w / 2, h / 2), e = Math.min(depth * 0.7, w / 3, h / 3);
  fill(lin(x, y, x + w * 0.3, y + h, [[0, sh(c, 1)], [0.25, c], [1, sh(c, -1)]]), () => g.roundRect(x, y, w, h, r));
  g.save(); g.beginPath(); g.roundRect(x, y, w, h, r); g.clip();
  R(x, y, w, e, alpha(sh(c, 2), 0.7)); R(x, y, e, h, alpha(sh(c, 1), 0.6));
  R(x, y + h - e, w, e, alpha(sh(c, -2), 0.55)); R(x + w - e, y, e, h, alpha(sh(c, -2), 0.45));
  g.restore();
}
/** A panel set into a frame: a soft shadow under its top and left edge. */
export function inset(x, y, w, h, c) {
  if (w <= 0 || h <= 0) return;
  R(x, y, w, h, c);
  R(x, y, w, h, lin(x, y, x, y + Math.min(h, 4), [[0, alpha(sh(c, -2), 0.8)], [1, alpha(c, 0)]]));
  R(x, y, w, h, lin(x, y, x + Math.min(w, 3), y, [[0, alpha(sh(c, -1), 0.6)], [1, alpha(c, 0)]]));
  R(x, y + h - 0.6, w, 0.6, alpha(sh(c, 1), 0.8));
}
/** Wood: a panel with fine grain running along it, a knot here and there. */
export function wood(x, y, w, h, c, along = 'x') {
  panel(x, y, w, h, c);
  const n = Math.round(x * 7 + y * 13 + w);
  g.save(); g.beginPath(); g.rect(x + 0.5, y + 0.5, w - 1, h - 1); g.clip();
  g.strokeStyle = alpha(sh(c, -1), 0.75); g.lineWidth = 0.45;
  g.beginPath();
  if (along === 'x') {
    for (let j = y + 1.6; j < y + h - 1; j += 2.2) {
      let i = x + 1 + hash(n, Math.round(j * 3)) * 6;
      while (i < x + w - 2) {
        const len = 4 + hash(n, Math.round(j * 3), Math.round(i)) * 10, bend = (hash(i, j, n) - 0.5) * 0.8;
        g.moveTo(i, j); g.quadraticCurveTo(i + len / 2, j + bend, Math.min(i + len, x + w - 1), j);
        i += len + 2 + hash(Math.round(i), Math.round(j), n) * 5;
      }
    }
  } else {
    for (let i = x + 1.6; i < x + w - 1; i += 2.2) {
      let j = y + 1 + hash(n, Math.round(i * 3)) * 6;
      while (j < y + h - 2) {
        const len = 4 + hash(n, Math.round(i * 3), Math.round(j)) * 10, bend = (hash(j, i, n) - 0.5) * 0.8;
        g.moveTo(i, j); g.quadraticCurveTo(i + bend, j + len / 2, i, Math.min(j + len, y + h - 1));
        j += len + 2 + hash(Math.round(j), Math.round(i), n) * 5;
      }
    }
  }
  g.stroke();
  if (w > 10 && h > 6 && hash(n, 77) < 0.35) {
    const kx = x + 3 + hash(n, 5) * (w - 6), ky = y + 2 + hash(n, 6) * (h - 4);
    fill(alpha(sh(c, -2), 0.6), () => g.ellipse(kx, ky, 1.4, 0.8, 0, 0, Math.PI * 2));
  }
  g.restore();
}
/** A padded cushion: well rounded, puffed in the middle, a sheen along the top and shadow tucked under. */
export function cushion(x, y, w, h, c, r = 2) {
  if (w <= 0 || h <= 0) return;
  const rr = Math.min(Math.max(r * 1.8, Math.min(w, h) * 0.42), w / 2, h / 2);
  fill(lin(x, y, x, y + h, [[0, sh(c, 1)], [0.35, c], [0.8, c], [1, sh(c, -1)]]), () => g.roundRect(x, y, w, h, rr));
  g.save(); g.beginPath(); g.roundRect(x, y, w, h, rr); g.clip();
  const puff = g.createRadialGradient(x + w * 0.4, y + h * 0.35, 0, x + w * 0.4, y + h * 0.35, Math.max(w, h) * 0.7);
  puff.addColorStop(0, alpha(sh(c, 2), 0.45)); puff.addColorStop(0.5, alpha(sh(c, 1), 0.12)); puff.addColorStop(1, alpha(sh(c, -2), 0.3));
  R(x, y, w, h, puff);
  // the soft shadow inside the bottom and right edges, where the padding rolls under
  g.lineWidth = Math.min(2.2, h * 0.25); g.strokeStyle = alpha(sh(c, -2), 0.35);
  g.beginPath(); g.roundRect(x + 0.4, y + 1.2, w - 0.8, h - 0.8, rr); g.stroke();
  g.lineWidth = 0.6; g.strokeStyle = alpha(sh(c, 3), 0.45);
  g.beginPath(); g.moveTo(x + rr * 0.8, y + 0.9); g.lineTo(x + w - rr * 0.8, y + 0.9); g.stroke();
  g.restore();
}
/** A shaded ball: lit from the upper left, a dark rim and a glint. */
export function sphere(cx, cy, r, c) {
  if (r <= 0) return;
  const s = g.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.05, cx, cy, r);
  s.addColorStop(0, sh(c, 2)); s.addColorStop(0.35, sh(c, 1)); s.addColorStop(0.7, c); s.addColorStop(1, sh(c, -2));
  fill(s, () => g.arc(cx, cy, r, 0, Math.PI * 2));
  fill(alpha('#ffffff', 0.75), () => g.ellipse(cx - r * 0.4, cy - r * 0.45, Math.max(0.5, r * 0.18), Math.max(0.4, r * 0.12), -0.6, 0, Math.PI * 2));
}
export function disc(cx, cy, r, c) { if (r > 0) fill(c, () => g.arc(cx, cy, r, 0, Math.PI * 2)); }
export function oval(cx, cy, rx, ry, c) { if (rx > 0 && ry > 0) fill(c, () => g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)); }
/** A lit oval: a rounded thing seen side on (a pot's belly, a cushion's end). */
export function ovalShade(cx, cy, rx, ry, c) {
  if (rx <= 0 || ry <= 0) return;
  g.save(); g.translate(cx, cy); g.scale(1, ry / rx);
  const t = g.createRadialGradient(-rx * 0.35, -rx * 0.4, 0, 0, 0, rx * 1.05);
  t.addColorStop(0, sh(c, 1)); t.addColorStop(0.55, c); t.addColorStop(1, sh(c, -1));
  fill(t, () => g.arc(0, 0, rx, 0, Math.PI * 2));
  g.restore();
}
/** An upright cylinder (a leg, a pot, a can): shaded round, with a highlight. */
export function cyl(x, y, w, h, c) {
  if (w <= 0 || h <= 0) return;
  R(x, y, w, h, lin(x, 0, x + w, 0, [[0, sh(c, -1)], [0.22, sh(c, 1)], [0.32, sh(c, 2)], [0.45, c], [0.85, sh(c, -1)], [1, sh(c, -2)]]));
}
/** A metal rod or pole. */
export const rod = (x, y, w, h, c) => cyl(x, y, w, h, c);
/** Glass: tinted, deeper at the bottom, with two soft diagonal glints. */
export function glass(x, y, w, h, tint = '#bfe0f0') {
  if (w <= 0 || h <= 0) return;
  R(x, y, w, h, lin(x, y, x + w * 0.4, y + h, [[0, sh(tint, 1)], [0.5, tint], [1, sh(tint, -1)]]));
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  g.strokeStyle = alpha('#ffffff', 0.55); g.lineWidth = Math.max(0.8, Math.min(w, h) * 0.12);
  g.beginPath(); g.moveTo(x + w * 0.15, y + h * 0.6); g.lineTo(x + w * 0.55, y + h * 0.05); g.stroke();
  g.lineWidth *= 0.5;
  g.beginPath(); g.moveTo(x + w * 0.35, y + h * 0.85); g.lineTo(x + w * 0.8, y + h * 0.2); g.stroke();
  g.restore();
  R(x, y, w, 0.5, alpha(sh(tint, -2), 0.6)); R(x, y, 0.5, h, alpha(sh(tint, -2), 0.5));
}
/** A leaf: an oval with its midrib, lit on top. */
export function leaf(cx, cy, rx, ry, c, tilt = 0) {
  if (rx <= 0 || ry <= 0) return;
  g.save(); g.translate(cx, cy); g.transform(1, 0, tilt * 0.6 * rx / ry, 1, 0, 0);
  fill(lin(0, -ry, 0, ry, [[0, sh(c, 1)], [0.45, c], [1, sh(c, -1)]]), () => g.ellipse(0, 0, rx + 0.4, ry + 0.4, 0, 0, Math.PI * 2));
  g.strokeStyle = alpha(sh(c, -2), 0.8); g.lineWidth = 0.4;
  g.beginPath(); g.moveTo(0, -ry * 0.85); g.lineTo(0, ry * 0.85); g.stroke();
  g.restore();
}
/** A cluster of leaves, for a bush or a tree's crown. */
export function foliage(cx, cy, r, c, seed = 0) {
  if (r <= 0) return;
  const s = g.createRadialGradient(cx - r * 0.3, cy - r * 0.4, 0, cx, cy, r);
  s.addColorStop(0, sh(c, -1)); s.addColorStop(1, sh(c, -2));
  fill(s, () => g.arc(cx, cy, r, 0, Math.PI * 2));
  for (let i = 0; i < r * 2.2; i++) {
    const a = hash(seed, i) * Math.PI * 2, d = Math.sqrt(hash(i, seed, 3)) * (r - 2.5);
    const lx = cx + Math.cos(a) * d, ly = cy + Math.sin(a) * d - 1;
    const tone = ly < cy - r * 0.3 ? 1 : ly > cy + r * 0.3 ? -1 : 0;
    g.save(); g.translate(lx, ly); g.rotate(a);
    fill(lin(0, -1.6, 0, 1.6, [[0, sh(c, tone + 1)], [1, sh(c, tone)]]), () => g.ellipse(0, 0, 2.7, 1.6, 0, 0, Math.PI * 2));
    g.restore();
  }
}
/** A filled triangle pointing up, `slope` units out per row. */
export function tri(cx, top, h, c, slope = 1) {
  if (h <= 0) return;
  const half = (h - 1) * slope + 0.5;
  fill(c, () => { g.moveTo(cx + 0.5, top); g.lineTo(cx + 0.5 + half, top + h); g.lineTo(cx + 0.5 - half, top + h); g.closePath(); });
}
/** Fleck an area with soft dots of a shade: fabric weave, stone, sand. */
export function speckle(x, y, w, h, c, n = 1, density = 0.12) {
  g.save(); g.globalAlpha *= 0.55;
  g.fillStyle = c; g.beginPath();
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (hash(i, j, n) < density) { g.moveTo(i + 1.05, j + 0.5); g.arc(i + 0.5, j + 0.5, 0.55, 0, Math.PI * 2); }
  g.fill();
  g.restore();
}

/* ---------- bitmaps, drawn smooth ---------- */

// a quadratic B-spline: how much a cell `d` cells away counts towards a point, and its slope
const B2 = (d) => { d = Math.abs(d); return d < 0.5 ? 0.75 - d * d : d < 1.5 ? 0.5 * (1.5 - d) ** 2 : 0; };
const DB2 = (d) => { const a = Math.abs(d), s = Math.sign(d); return a < 0.5 ? -2 * d : a < 1.5 ? -(1.5 - a) * s : 0; };
const rgb = (hex) => { const v = parseInt(hex.slice(1), 16); return [v >> 16, (v >> 8) & 255, v & 255]; };

/** A bitmap (rows of letters, each a colour of `ink`) as one smooth shape: its cells melted together on a B-spline, so
    corners round off like stuffing and colours meet in curves. `puff` lights it as a rounded thing from the top left.
    Returns the shape's cells' field for the doll painter. */
function smoothBits(rows, x, y, ink, s, puff, edge = 0.42) {
  const W = Math.max(...rows.map(r => r.length)), H = rows.length;
  const scale = Math.abs(g.getTransform().a) || 1, cell = s * scale, pad = Math.ceil(cell);
  const cw = Math.ceil(W * cell) + pad * 2, ch = Math.ceil(H * cell) + pad * 2;
  const keys = [...new Set(rows.join('').split(''))].filter(c => ink[c] && ink[c][0] === '#');
  if (!keys.length) return;
  const cols = keys.map(c => rgb(ink[c])), at = (i, j) => (j >= 0 && j < H && i >= 0 && i < rows[j].length ? keys.indexOf(rows[j][i]) : -1);
  const grid = new Int8Array(W * H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) grid[j * W + i] = at(i, j);
  const c = new OffscreenCanvas(cw, ch), cg = c.getContext('2d'), im = cg.createImageData(cw, ch), d = im.data;
  const acc = new Float32Array(keys.length), aa = 0.6 / cell;
  for (let py = 0; py < ch; py++) {
    const v = (py + 0.5 - pad) / cell - 0.5, j0 = Math.ceil(v - 1.5);
    for (let px = 0; px < cw; px++) {
      const u = (px + 0.5 - pad) / cell - 0.5, i0 = Math.ceil(u - 1.5);
      acc.fill(0);
      let tot = 0, gx = 0, gy = 0;
      for (let j = j0; j <= j0 + 2; j++) {
        if (j < 0 || j >= H) continue;
        const wy = B2(v - j), dy = DB2(v - j);
        for (let i = i0; i <= i0 + 2; i++) {
          if (i < 0 || i >= W) continue;
          const q = grid[j * W + i];
          if (q < 0) continue;
          const wx = B2(u - i), w = wx * wy;
          acc[q] += w; tot += w;
          gx += DB2(u - i) * wy; gy += wx * dy;
        }
      }
      if (tot < edge - aa) continue;
      const a = Math.min(1, (tot - edge + aa) / (2 * aa));
      // the strongest colour here, blended with the runner-up where they meet
      let b1 = 0, b2 = -1;
      for (let q = 1; q < keys.length; q++) if (acc[q] > acc[b1]) { b2 = b1; b1 = q; } else if (b2 < 0 || acc[q] > acc[b2]) b2 = q;
      let [r, gg, bb] = cols[b1];
      if (b2 >= 0 && acc[b2] > 0) {
        const t = Math.min(1, Math.max(0, (acc[b1] - acc[b2]) * cell * 0.9 + 0.5));
        const o = cols[b2];
        r = o[0] + (r - o[0]) * t; gg = o[1] + (gg - o[1]) * t; bb = o[2] + (bb - o[2]) * t;
      }
      if (puff) {
        // the field slopes down outwards, so -grad is the surface's outward lean: lit where it leans up and left
        const lit = Math.max(-1, Math.min(1, (gx + gy) * 0.75)) * puff;
        if (lit > 0) { r += (255 - r) * lit * 0.5; gg += (255 - gg) * lit * 0.5; bb += (255 - bb) * lit * 0.45; }
        else { r *= 1 + lit * 0.45; gg *= 1 + lit * 0.45; bb *= 1 + lit * 0.4; }
      }
      const o = (py * cw + px) * 4;
      d[o] = r; d[o + 1] = gg; d[o + 2] = bb; d[o + 3] = a * 255;
    }
  }
  cg.putImageData(im, 0, 0);
  g.drawImage(c, x - pad / scale, y - pad / scale, cw / scale, ch / scale);
}
/** A bitmap: each row a string, each character a colour from `ink`. Blank or '.' is clear. Drawn smooth. */
export function bits(rows, x, y, ink, s = 1) { smoothBits(rows, x, y, ink, s, 0); }
/** A bitmap drawn big and rounded, lit from the top left like a raised thing. */
export function stamp(rows, x, y, ink, s = 2) { smoothBits(rows, x, y, ink, s, s < 2 ? 0 : 0.5); }

/** A plush doll from a bitmap: the shape stuffed round, its colours sewn together, button eyes with a shine, a stitched
    smile between them, a seam around its edge and a little cloth tag. `e` cells are the eyes, `r` the cheeks. */
export function plush(rows, x, y, ink, s) {
  const W = Math.max(...rows.map(r => r.length)), H = rows.length;
  // the body, without the eyes (they're sewn on after): an eye's cell takes the fabric most round it
  const body = rows.map((r, j) => r.replace(/e/g, (_, i) => {
    const n = {};
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const c = rows[j + dj]?.[i + di]; if (c && c !== 'e' && c !== '.' && ink[c]) n[c] = (n[c] || 0) + 1; }
    return Object.keys(n).sort((a, b) => n[b] - n[a])[0] || 'e';
  }));
  const fur = ink;
  g.save();
  smoothBits(body, x, y, fur, s, 0.9, 0.4);
  // a soft shade over the whole body, as stuffing rounds away at the bottom
  g.globalCompositeOperation = 'source-atop';
  const cx = x + W * s / 2, cy = y + H * s / 2;
  const sh2 = g.createRadialGradient(cx - W * s * 0.18, cy - H * s * 0.25, 0, cx, cy, Math.max(W, H) * s * 0.75);
  sh2.addColorStop(0, 'rgba(255,255,255,0.22)'); sh2.addColorStop(0.55, 'rgba(255,255,255,0)'); sh2.addColorStop(1, 'rgba(40,20,40,0.28)');
  R(x - s, y - s, (W + 2) * s, (H + 2) * s, sh2);
  // fuzz: tiny soft flecks of light and shade over the fabric
  for (let i = 0; i < W * H * 1.5; i++) {
    const fx = x + hash(i, W, 1) * W * s, fy = y + hash(i, H, 2) * H * s;
    fill(hash(i, 3) < 0.5 ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)', () => g.arc(fx, fy, Math.max(0.3, s * 0.12), 0, Math.PI * 2));
  }
  g.globalCompositeOperation = 'source-over';
  // eyes: each run of `e` cells a glossy button
  const eyes = [];
  rows.forEach((row, j) => {
    let i = 0;
    while (i < row.length) {
      if (row[i] !== 'e') { i++; continue; }
      let n = 1;
      while (row[i + n] === 'e') n++;
      const up = eyes.find(e => Math.abs(e.x - (i + n / 2)) < 1 && e.j === j - 1);
      if (up) { up.y = (up.y + j + 0.5) / 2; up.j = j; up.h++; } else eyes.push({ x: i + n / 2, y: j + 0.5, j, w: n, h: 1 });
      i += n;
    }
  });
  const ec = ink.e || '#202028';
  for (const e of eyes) {
    const ex = x + e.x * s, ey = y + e.y * s, rx = Math.max(0.9, s * (0.32 + e.w * 0.14)), ry = rx * (e.h > 1 ? 1.35 : 1.15);
    fill(alpha('#000000', 0.25), () => g.ellipse(ex, ey + s * 0.12, rx * 1.05, ry * 1.05, 0, 0, Math.PI * 2));
    const eg = g.createRadialGradient(ex - rx * 0.3, ey - ry * 0.35, 0, ex, ey, ry);
    eg.addColorStop(0, sh(ec, 2)); eg.addColorStop(0.5, ec); eg.addColorStop(1, sh(ec, -2));
    fill(eg, () => g.ellipse(ex, ey, rx, ry, 0, 0, Math.PI * 2));
    fill('rgba(255,255,255,0.95)', () => g.arc(ex - rx * 0.35, ey - ry * 0.4, Math.max(0.35, rx * 0.32), 0, Math.PI * 2));
    fill('rgba(255,255,255,0.6)', () => g.arc(ex + rx * 0.3, ey + ry * 0.35, Math.max(0.2, rx * 0.14), 0, Math.PI * 2));
  }
  // a stitched smile under two eyes level with each other
  if (eyes.length === 2 && Math.abs(eyes[0].y - eyes[1].y) < 0.6) {
    const mx = x + (eyes[0].x + eyes[1].x) / 2 * s, my = y + (Math.max(eyes[0].y, eyes[1].y) + 1.1) * s, mw = Math.max(1.2, s * 0.75);
    g.strokeStyle = 'rgba(50,25,30,0.85)'; g.lineWidth = Math.max(0.35, s * 0.14);
    g.beginPath(); g.moveTo(mx - mw, my - mw * 0.25); g.quadraticCurveTo(mx - mw / 2, my + mw * 0.45, mx, my); g.quadraticCurveTo(mx + mw / 2, my + mw * 0.45, mx + mw, my - mw * 0.25); g.stroke();
  }
  // the side seam, a dashed stitch just inside the outline
  g.globalCompositeOperation = 'source-atop';
  g.setLineDash([Math.max(0.6, s * 0.3), Math.max(0.5, s * 0.25)]);
  g.strokeStyle = 'rgba(60,30,40,0.35)'; g.lineWidth = Math.max(0.3, s * 0.1);
  g.beginPath(); g.ellipse(cx, cy + s * 0.4, W * s * 0.44, H * s * 0.42, 0, Math.PI * 0.15, Math.PI * 0.85); g.stroke();
  g.setLineDash([]);
  // the tag, sewn into its lower side
  const tx = x + W * s * 0.8, ty = y + H * s * 0.72, tw = Math.max(1.6, s * 0.9), th = Math.max(1.2, s * 0.6);
  fill('#f6f2ea', () => g.roundRect(tx, ty, tw, th, th * 0.2));
  R(tx + tw * 0.15, ty + th * 0.4, tw * 0.7, Math.max(0.25, th * 0.2), '#d04050');
  g.restore();
}

/** A soft shadow on the floor under an upright piece. */
export function floorShadow(x, b, w) {
  const s = g.createRadialGradient(x + w / 2, b - 1.5, 0, x + w / 2, b - 1.5, w / 2);
  s.addColorStop(0, 'rgba(30,18,10,0.32)'); s.addColorStop(1, 'rgba(30,18,10,0)');
  g.save(); g.translate(0, b - 1.5); g.scale(1, 0.14); g.translate(0, -(b - 1.5));
  fill(s, () => g.arc(x + w / 2, b - 1.5, w / 2, 0, Math.PI * 2));
  g.restore();
}

/** The last pass on a painted piece: its silhouette's top-left edge caught by the light and the bottom-right in shade,
    then a soft outline in a dark shade of what it borders. Done with composites, not pixel by pixel, so it's quick at
    HD. */
export function finish(canvas, { outline = true, rim = true } = {}) {
  const w = canvas.width, h = canvas.height, ctx = canvas.getContext('2d'), u = canvas.hd || 1;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  const layer = () => new OffscreenCanvas(w, h);
  if (rim) {
    for (const [d, col] of [[1, 'rgba(255,250,235,0.26)'], [-1, 'rgba(20,10,30,0.22)']]) {
      const m = layer(), mg = m.getContext('2d'), o = d * Math.max(1, u * 0.9);
      mg.drawImage(canvas, 0, 0);
      mg.globalCompositeOperation = 'destination-out'; mg.drawImage(canvas, o, o);
      mg.globalCompositeOperation = 'source-in'; mg.fillStyle = col; mg.fillRect(0, 0, w, h);
      ctx.drawImage(m, 0, 0);
    }
  }
  if (outline) {
    // a dark copy of the piece, its own colours at a third, laid underneath in a ring
    const dark = layer(), dg = dark.getContext('2d');
    dg.drawImage(canvas, 0, 0);
    const im = dg.getImageData(0, 0, w, h), d = im.data;
    const soft = u > 1 ? 0.4 : 1, dk = u > 1 ? 0.55 : 0.3;
    for (let i = 0; i < d.length; i += 4) { d[i] *= dk; d[i + 1] *= dk * 0.95; d[i + 2] = d[i + 2] * dk + 10; d[i + 3] = (d[i + 3] > 30 ? 255 : d[i + 3] * 4) * soft; }
    dg.putImageData(im, 0, 0);
    const r = u > 1 ? u * 0.5 : 1, n = u > 1 ? 12 : 4;
    ctx.globalCompositeOperation = 'destination-over';
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; ctx.drawImage(dark, Math.cos(a) * r, Math.sin(a) * r); }
  }
  ctx.restore();
  return canvas;
}

/** Paint inside a box only (a picture inside its frame). */
export function clipped(x, y, w, h, fn) {
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  try { fn(); } finally { g.restore(); }
}
