/* The Super Saiyan aura a Trainer Level 6-10 win earns (js/data/difficulty.js's auraWorn(); the user's go, 2026-10-23),
   painted once into small sprite sheets on plain canvases: the walking buddy's billboards (wearAura() in js/hd2d.js) and
   the Trainer Card's partner and the Level picker (auraArt() in js/ui.js) all show the same frames. Pixel art, a few
   flat colours a frame, so it reads like the sprites it sits behind. Nothing here touches the GPU. */

/** Each Level's look, in its star's colour (starName()): how tall and wide round the sprite (by its height and width),
    how far the tongues lick, the ground glow's size, and the extras from 9 up. `ink`: light, mid, dark. */
export const AURA = {
  6: { ink: ['#ffd8e0', '#ff3a5c', '#b0123a'], gain: 0.75, tall: 0.55, wide: 1.35, lick: 0.3, hollow: 0.15, glow: 0.6 },
  7: { ink: ['#d8ffe2', '#34e878', '#0c8a42'], gain: 0.95, tall: 0.95, wide: 1.4, lick: 0.6, hollow: 0.5, glow: 0.65 },
  8: { ink: ['#dceeff', '#3e90ff', '#1640b8'], gain: 1, tall: 1.35, wide: 1.5, lick: 0.65, hollow: 0.55, glow: 0.75 },
  9: { ink: ['#f2e0ff', '#b462ff', '#5c1ab4'], gain: 1.05, tall: 1.5, wide: 1.6, lick: 0.75, hollow: 0.55, glow: 0.85, front: true, bolts: [1, 2, 7] },
  10: { ink: ['#fffbe0', '#ffd040', '#ff9a10'], gain: 1.1, tall: 2.0, wide: 1.95, lick: 0.9, hollow: 0.6, glow: 1, front: true, bolts: [1, 5, 6, 10], sparks: true, rainbow: true },
};
export const AURA_FRAMES = 12;
export const AURA_FPS = 14;
/** The frame shown under Calm effects: one with no lightning in it. */
export const CALM_FRAME = 0;

function hash(x, y, s) {
  let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
/** Value noise that repeats every `py` cells down, so a flame scrolled one period up is where it started: the loop. */
function noise(x, y, py, s) {
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy), w = (j) => ((j % py) + py) % py;
  const a = hash(x0, w(y0), s), b = hash(x0 + 1, w(y0), s), c = hash(x0, w(y0 + 1), s), d = hash(x0 + 1, w(y0 + 1), s);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}
const P = 2;
const fbm = (x, y, s) => noise(x, y, P, s) * 0.55 + noise(x * 2, y * 2, P * 2, s + 1) * 0.3 + noise(x * 4, y * 4, P * 4, s + 2) * 0.15;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const rgb = (hex) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
function hue(h) {
  const k = (n) => (n + h / 30) % 12, f = (n) => 0.6 - 0.4 * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [f(0), f(8), f(4)].map(v => Math.round(v * 255));
}

/** The flames' brightness at (u across, -1 to 1; v up, 0 to 1) in a frame at phase t (0 to 1): an egg of fire round the
    body, its rim brightest, tongues rising out of its sides and top. `front`: only the low licks round the feet and
    sides, drawn over the sprite at 9 and 10. */
function flame(a, u, v, t, front) {
  const half = Math.pow(Math.max(0, Math.sin(Math.PI * (0.1 + 0.86 * v))), 0.55) * 0.92;
  const f = fbm(u * 5 + 9, (v - t) * P, front ? 31 : 7), g = fbm(u * 9 + 3, (v - t) * P * 2, 53);
  const d = Math.abs(u) / Math.max(0.05, half);
  const edge = d - (f - 0.5) * 1.4 * a.lick * (0.35 + v);
  const top = v - (f - 0.5) * 0.9 * a.lick - (g - 0.5) * 0.25 * a.lick;
  let i = smooth(1, 0.72, edge) * smooth(1, 0.7, top) * smooth(0, 0.08, v);
  i *= (0.5 + 0.75 * g) * (1 - a.hollow + a.hollow * smooth(0.25, 0.9, d)) * a.gain;
  if (front) i *= smooth(0.45, 0.85, d) * (1 - smooth(0.15, 0.5, v));
  return i;
}

/** A sheet of `n` frames side by side, each w x h, painted by `px(x, y, frame)` -> [r, g, b, a] or null. */
function sheet(w, h, n, px) {
  const c = document.createElement('canvas');
  c.width = w * n; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true }), img = g.createImageData(w * n, h), d = img.data;
  for (let k = 0; k < n; k++) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const p = px(x, y, k);
    if (!p) continue;
    const o = (y * w * n + k * w + x) * 4;
    d[o] = p[0]; d[o + 1] = p[1]; d[o + 2] = p[2]; d[o + 3] = p[3];
  }
  g.putImageData(img, 0, 0);
  return c;
}

/** The flame sheet for a Level: AURA_FRAMES frames of w x h, looping. Three shades a frame, stepped, not blended. At 10
    the outer flames run through the rainbow up the blaze, round a gold core. */
export function auraFlames(level, w, h, front = false) {
  const a = AURA[level], [L, M, D] = a.ink.map(rgb);
  return sheet(w, h, AURA_FRAMES, (x, y, k) => {
    // a frame's outer column stays empty, so a neighbour never bleeds in at its edge
    if (x === 0 || x === w - 1) return null;
    const u = ((x + 0.5) / w) * 2 - 1, v = 1 - (y + 0.5) / h, t = k / AURA_FRAMES;
    const i = flame(a, u, v, t, front);
    if (i > 0.82) return [...L, 255];
    if (i > 0.5) return [...M, 230];
    if (i > 0.2) return [...(a.rainbow ? hue((v * 420 + t * 360 + u * 40 + 720) % 360) : D), a.rainbow ? 210 : 150];
    return null;
  });
}

function rand(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** What is drawn over the sprite at 9 and 10, in one sheet so it is one draw (the user found 10 laggy, 2026-10-23): the
    low licks, lightning in the frames AURA[level].bolts names (cycling them is the crackle; none in CALM_FRAME) and at
    10 the sparks rising. */
export function auraFront(level, w, h) {
  const c = auraFlames(level, w, h, true), g = c.getContext('2d');
  g.drawImage(auraBolts(level, w, h), 0, 0);
  if (AURA[level].sparks) g.drawImage(auraSparks(w, h), 0, 0);
  return c;
}

/** Lightning: a jagged bolt or two a frame named, a white core one pixel wide edged in the star's mid colour. */
function auraBolts(level, w, h) {
  const a = AURA[level], c = document.createElement('canvas');
  c.width = w * AURA_FRAMES; c.height = h;
  const g = c.getContext('2d'), r = rand(level * 97 + 13);
  const dot = (x, y, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), 1, 1); };
  const line = (x0, y0, x1, y1, fn) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let i = 0; i <= n; i++) fn(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n); };
  for (const k of a.bolts) {
    const ox = k * w;
    for (let b = 0; b < (level >= 10 ? 2 : 1); b++) {
      const side = r() < 0.5 ? -1 : 1;
      let x = w / 2 + side * w * (0.12 + r() * 0.2), y = h * (0.08 + r() * 0.2);
      const pts = [[x, y]];
      while (y < h * 0.85) { x += (r() - 0.5) * w * 0.28; y += h * (0.07 + r() * 0.08); pts.push([Math.max(2, Math.min(w - 3, x)), y]); }
      const at = (fn) => { for (let i = 1; i < pts.length; i++) line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], fn); };
      at((px, py) => { dot(ox + px - 1, py, a.ink[1]); dot(ox + px + 1, py, a.ink[1]); });
      at((px, py) => dot(ox + px, py, '#ffffff'));
      // one fork off its middle
      const m = pts[Math.floor(pts.length / 2)], fx = m[0] + side * w * 0.15, fy = m[1] + h * 0.1;
      line(m[0], m[1], Math.max(1, Math.min(w - 2, fx)), fy, (px, py) => dot(ox + px, py, a.ink[0]));
    }
  }
  return c;
}

/** Sparks rising through the blaze at 10: motes drifting up and round again, gold and the rainbow's colours, a few with
    a one-pixel tail. */
function auraSparks(w, h) {
  const c = document.createElement('canvas');
  c.width = w * AURA_FRAMES; c.height = h;
  const g = c.getContext('2d'), r = rand(1010);
  const cols = ['#fff6c0', '#ffd040', '#ff8a8a', '#8ad8ff', '#a8f0a0', '#d8a8ff'];
  const motes = Array.from({ length: 18 }, () => ({ x: 0.12 + r() * 0.76, at: r(), laps: r() < 0.3 ? 2 : 1, sway: r() * 6.28, col: cols[Math.floor(r() * cols.length)] }));
  for (let k = 0; k < AURA_FRAMES; k++) for (const m of motes) {
    const v = (m.at + (k / AURA_FRAMES) * m.laps) % 1, x = k * w + m.x * w + Math.sin(m.sway + v * 6.28) * 2, y = h * (0.95 - v * 0.9);
    if (x < k * w + 1 || x > (k + 1) * w - 2) continue;
    g.globalAlpha = v > 0.8 ? 0.5 : 1;
    g.fillStyle = m.col;
    g.fillRect(Math.round(x), Math.round(y), 1, 1);
    if (m.laps > 1) g.fillRect(Math.round(x), Math.round(y) + 1, 1, 1);
  }
  return c;
}

/** The glow on the ground under the buddy: an oval in the star's colour, three rings, brightest in the middle. */
export function auraGlow(level, w = 32, h = 16) {
  const a = AURA[level], cols = (a.rainbow ? ['#fffbe0', '#ffd040', '#ff7a30'] : a.ink).map(rgb);
  return sheet(w, h, 1, (x, y) => {
    const dx = ((x + 0.5) / w) * 2 - 1, dy = ((y + 0.5) / h) * 2 - 1, q = 1 - Math.hypot(dx, dy);
    if (q <= 0) return null;
    return q > 0.6 ? [...cols[0], 170] : q > 0.3 ? [...cols[1], 140] : [...cols[2], 90];
  });
}
