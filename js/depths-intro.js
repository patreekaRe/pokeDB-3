/* ============================================================
   depths-intro.js  -  arriving in the Crystal Depths (v1.0 part B2).

   The same film as the other biomes' (run() in js/biome-intro.js plays
   it: the title, the Pokémon popping out, your Pokémon walking on), with
   its own painter and camera: you drop down a crystal-lined shaft, dust
   streaming past, and out of its foot into the great cavern; in the dark
   its crystals light one by one, each with a chime, and the camera
   pushes slowly in towards the far end, where the Energy Well's column of
   crimson light climbs to the roof. The wild Pokémon step out from behind
   crystal outcrops on the way.

   No clock underground: every hour paints the same, so it ignores the
   graded `land` and paints from its own palettes (HALLS, and DEEP for the
   Deep Core's walk-on, the rock gone black and veined with energy).
   Layers (far, mid, walls, ground, fore) are painted once into ImageData
   and slid and grown about the Well by the camera at their own speeds.
   ============================================================ */

import { ease, span, layer, settle } from './biome-intro.js';
import { playSound } from './audio.js';

const PUSH = { sky: 0.04, far: 0.12, mid: 0.3, wall: 0.55, ground: 0.6, fore: 1.1 };
const LIFT = { far: 0.45, mid: 0.7, wall: 1, ground: 1.15, fore: 1.5 };

const HALLS = {
  void: ['#04030a', '#07051a', '#0c0826', '#120c32', '#1a1240', '#22184e', '#2c205c'],
  rock: ['#5c5088', '#463c6c', '#342c54', '#241e3c', '#120e22'],
  floor: ['#3a3260', '#342c56', '#2e274c', '#282242', '#221c38', '#1c172e'],
  crystal: ['#ffffff', '#b8f4ff', '#58d0f0', '#2a7ab8', '#143e6e'],
  gem2: ['#fff4ff', '#e8b8ff', '#b070f0', '#7038c0', '#381870'],
  water: ['#a8f0ff', '#48b0d8', '#206898', '#0e3458'],
  mote: ['#e8ffff', '#88e0f8'],
};
const DEEP = {
  void: ['#060206', '#0c040a', '#140610', '#1c0816', '#280a1c', '#360c22', '#460e2a'],
  rock: ['#4c3448', '#382638', '#281a2a', '#1a111c', '#0a050a'],
  floor: ['#30222e', '#2a1d29', '#251924', '#20151f', '#1b111a', '#160d15'],
  crystal: ['#fff0f4', '#ff9ac8', '#f03c80', '#a81450', '#500828'],
  gem2: ['#fff4ff', '#e8b8ff', '#b070f0', '#7038c0', '#381870'],
  water: ['#ffb0d8', '#c04880', '#6a1a48', '#2a0820'],
  mote: ['#fff4fa', '#ff8ae0'],
};
const ENERGY = ['#fff4fa', '#ff8ae0', '#f0349a', '#a8106a', '#4a0630'];

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bayer = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];
const noise = (a, b, c) => { const s = Math.sin(a * 12.9898 + b * 78.233 + c * 37.719) * 43758.5453; return s - Math.floor(s); };
const rgba = (hex, a = 255) => { const n = parseInt(hex.slice(1), 16); return ((a << 24) | ((n & 255) << 16) | (n & 0xff00) | (n >> 16)) >>> 0; };

/** A layer painted pixel by pixel into ImageData (ABGR words), turned into a canvas once it's done. */
function pixels(w, h) {
  const c = layer(w, h), g = c.getContext('2d'), img = g.createImageData(w, h), d = new Uint32Array(img.data.buffer);
  const ok = (x, y) => x >= 0 && y >= 0 && x < w && y < h;
  return {
    w, h, d,
    put(x, y, hex) { x |= 0; y |= 0; if (ok(x, y)) d[y * w + x] = rgba(hex); },
    // a see-through pixel takes the colour faintly; a painted one is mixed towards it
    glow(x, y, hex, k) {
      x |= 0; y |= 0;
      if (!ok(x, y) || k <= 0) return;
      const i = y * w + x, a = d[i] >>> 24, n = parseInt(hex.slice(1), 16), r = n >> 16, gg = (n >> 8) & 255, b = n & 255;
      if (!a) { d[i] = ((Math.round(255 * Math.min(1, k)) << 24) | (b << 16) | (gg << 8) | r) >>> 0; return; }
      const m = (s, v) => Math.round(((d[i] >> s) & 255) * (1 - k) + v * k);
      d[i] = ((a << 24) | (m(16, b) << 16) | (m(8, gg) << 8) | m(0, r)) >>> 0;
    },
    tint(x, y, k) {
      x |= 0; y |= 0;
      if (!ok(x, y)) return;
      const i = y * w + x, a = d[i] >>> 24, f = (s) => Math.min(255, Math.round(((d[i] >> s) & 255) * k));
      if (a) d[i] = ((a << 24) | (f(16) << 16) | (f(8) << 8) | f(0)) >>> 0;
    },
    done() { g.putImageData(img, 0, 0); return c; },
  };
}

/** A crystal, as in js/scene.js's prism(): a six-sided prism from (fx, fy) along angle a, coming to a point. */
function prism(p, fx, fy, a, len, hw, pal, halo = 0) {
  const dx = Math.cos(a), dy = Math.sin(a);
  let ax = -dy, ay = dx;
  if (ax + ay < 0) { ax = -ax; ay = -ay; }
  const point = Math.max(1.4, hw * 1.7), reach = len + hw + halo + 2;
  for (let y = Math.floor(fy - reach); y <= fy + reach; y++) for (let x = Math.floor(fx - reach); x <= fx + reach; x++) {
    const rx = x + 0.5 - fx, ry = y + 0.5 - fy, u = rx * dx + ry * dy, v = rx * ax + ry * ay;
    if (u < -0.5 || u > len + halo) continue;
    const w = u > len - point ? hw * Math.max(0, (len - u) / point) : hw, av = Math.abs(v);
    if (av > w || u > len) { if (halo && av - w < halo && bayer(x, y) < 10) p.glow(x, y, pal[3], 0.35 * (1 - (av - w) / halo)); continue; }
    const s = v / Math.max(0.5, w);
    p.put(x, y, av > w - 0.7 && w > 1 ? pal[4] : u > len - point ? (s < -0.2 ? pal[0] : s < 0.3 ? pal[1] : pal[2]) : s > -0.7 && s < -0.42 ? pal[0] : s < -0.42 ? pal[1] : s < 0.25 ? pal[2] : pal[3]);
  }
  return [fx + dx * len, fy + dy * len];
}

function cluster(p, fx, fy, size, pal, pal2, up = -Math.PI / 2, n = 4, halo = 2) {
  const parts = [[2, 0.36, 0.55], [-2, 0.4, 0.6], [1, 0.6, 0.8], [-1, 0.68, 0.82], [0, 1, 1]].slice(5 - n);
  for (const [k, l, w] of parts) {
    const a = up + k * 0.3 + (noise(fx, fy + k, 3) - 0.5) * 0.2;
    prism(p, fx + Math.cos(up + Math.PI / 2) * k * size * 0.16, fy + Math.sin(up + Math.PI / 2) * k * size * 0.16 + Math.abs(k) * 0.4, a, size * l, Math.max(0.9, size * 0.13 * w), k % 2 ? pal2 : pal, halo);
  }
}

/** Mix two '#rrggbb' colours. */
function mix(a, b, t) {
  const n = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [n(a), n(b)];
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
}

function depthsScene({ look, mini, W, H, tall, rand, beats, live }) {
  const C = look.red ? DEEP : HALLS, hz = Math.round(H * (tall ? 0.5 : 0.52)), VX = Math.round(W * 0.5);
  const haze = C.void[6], goal = look.goal || 1;
  const B = mini ? { DROP: [0, 1], PUSH: [0, beats.END], LIGHTS: [] } : beats;
  // the drop: the shaft scrolls up past you until its foot clears the top of the screen; the cavern rises in under it
  const shaftH = Math.round(H * 1.7);
  const shaftY = (ms) => (mini ? -shaftH - H : -(shaftH + H * 0.1) * Math.pow(span(B.DROP, ms), 1.15));
  const foot = (ms) => Math.max(0, shaftY(ms) + shaftH);
  const lift = (ms, k) => foot(ms) * k * 0.9;   // how far below its place a layer still is while you come down
  const zoom = (ms) => (mini ? 0.32 : 0.55) * ease(span(B.PUSH, ms));
  const grow = (ms, k) => 1 + zoom(ms) * k;

  // ---- the far dark: the void, glimmers, the far glow of the Well ----
  const skyP = pixels(W, H);
  for (let y = 0; y < H; y++) {
    const t = Math.min(1, y / hz) * (C.void.length - 1), i = Math.min(C.void.length - 2, Math.floor(t));
    for (let x = 0; x < W; x++) skyP.put(x, y, bayer(x, y) < (t - i) * 16 ? C.void[i + 1] : C.void[i]);
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const d = Math.hypot((x - VX) / (W * 0.5 * goal ** 0.4), (y - hz) / (H * 0.5));
    if (d < 1 && bayer(x, y) < 15) skyP.glow(x, y, ENERGY[3], 0.45 * (1 - d) ** 2);
  }
  const glimmers = [];
  for (let n = 0; n < W * hz / 60; n++) {
    const x = Math.floor(rand() * W), y = Math.floor(rand() * hz * 0.95), c = rand() < 0.5 ? C.crystal[3] : C.gem2[3];
    skyP.put(x, y, c);
    if (rand() < 0.3) glimmers.push({ x, y, ph: rand() * 6, c: rand() < 0.5 ? C.crystal[1] : C.gem2[1] });
  }
  const skyC = skyP.done();

  // ---- the far ridges and spires ----
  const farP = pixels(W, H);
  const ridge = (top, amp, seed, k) => {
    for (let x = 0; x < W; x++) {
      const jag = Math.abs(((x / (4 + seed) + seed) % 2) - 1), y0 = Math.round(top - amp * (0.4 + 0.4 * jag + 0.2 * Math.sin(x / 11 + seed)));
      for (let y = y0; y <= hz + 1; y++) farP.put(x, y, y === y0 && bayer(x, y) < 9 ? mix(C.crystal[3], haze, 0.5) : mix(C.rock[3], haze, k));
    }
  };
  ridge(hz - H * 0.05, H * 0.05, 1.7, 0.62);
  for (let n = 0; n < W / 16; n++) {
    const x = rand() * W;
    if (Math.abs(x - VX) < W * 0.06) continue;
    prism(farP, x, hz, -Math.PI / 2 + (rand() - 0.5) * 0.4, H * (0.04 + rand() * 0.1), 1 + rand(), (n % 2 ? C.crystal : C.gem2).map(c => mix(c, haze, 0.5)), 1);
  }
  ridge(hz - H * 0.02, H * 0.025, 4.3, 0.4);
  const farC = farP.done();

  // ---- the middle distance: giant crystal columns to the roof, and the clusters that light up ----
  const midP = pixels(W, H);
  const cols = tall ? [0.14, 0.3, 0.72, 0.88] : [0.1, 0.24, 0.38, 0.64, 0.78, 0.92];
  cols.forEach((at, i) => {
    const x = W * at + (noise(i, 1, 5) - 0.5) * W * 0.04, hw = Math.max(2, W * (0.018 + noise(i, 2, 5) * 0.014));
    prism(midP, x, hz + 2, -Math.PI / 2 + (noise(i, 3, 5) - 0.5) * 0.12, H * 0.9, hw, (i % 2 ? C.gem2 : C.crystal).map(c => mix(c, haze, 0.45)), 3);
  });
  const midC = midP.done();
  // the clusters: painted dark into the scene, then each lit on its own canvas, faded in as the lights come on
  const lights = [];
  const spotsAt = tall ? [[0.2, 0.08], [0.82, 0.1], [0.34, 0.03], [0.66, 0.04], [0.08, 0.16], [0.93, 0.18]] : [[0.16, 0.06], [0.84, 0.07], [0.32, 0.02], [0.68, 0.03], [0.06, 0.14], [0.95, 0.15]];
  spotsAt.forEach(([u, v], i) => {
    const size = H * (0.07 + v * 0.6), x = W * u, y = hz + H * v, pal = i % 2 ? C.gem2 : C.crystal, pal2 = i % 2 ? C.crystal : C.gem2;
    const lit = pixels(W, H);
    for (let yy = Math.round(y - size * 0.6); yy < y + size * 0.6; yy++) for (let xx = Math.round(x - size * 1.4); xx < x + size * 1.4; xx++) {   // its light on the floor
      const d = Math.hypot((xx - x) / (size * 1.4), (yy - y) / (size * 0.6));
      if (d < 1 && bayer(xx, yy) < (1 - d) * 18) lit.glow(xx, yy, pal[3], 0.5);
    }
    cluster(lit, x, y, size, pal, pal2, -Math.PI / 2, 4, 3);
    const dark = pixels(W, H);
    cluster(dark, x, y, size, pal.map(c => mix(c, C.rock[4], 0.75)), pal2.map(c => mix(c, C.rock[4], 0.75)), -Math.PI / 2, 4, 0);
    lights.push({ lit: lit.done(), dark: dark.done(), at: B.LIGHTS?.[i] ?? -1, x, y: y - size });
  });

  // ---- the walls: the arch of rock round the cavern, crystals growing off it, stalactites ----
  const wallP = pixels(W, H);
  const roof = (x) => {
    const u = Math.abs(x + 0.5 - VX) / (W / 2);
    return Math.round(hz * (0.04 + 0.96 * Math.min(1.3, u ** 3.2 * 1.02)) + (noise(x >> 1, 1, 7) - 0.5) * 3 + (noise(x >> 3, 2, 7) - 0.5) * H * 0.04);
  };
  const R = C.rock;
  for (let x = 0; x < W; x++) {
    const r = roof(x);
    for (let y = 0; y < Math.min(H, r); y++) {
      const inner = r - y, n = noise(x >> 2, y >> 2, 8), n2 = noise(x >> 1, y >> 1, 9);
      const crack = noise(Math.round(x / 5 + Math.sin(y / 4)), Math.round(y / 4), 10) > 0.86;
      const shade = Math.min(4, Math.floor(inner / (H * 0.05) + n * 1.6 + (bayer(x, y) / 16) * 0.8));
      wallP.put(x, y, inner <= 1 ? mix(R[0], C.crystal[2], 0.4) : crack ? R[4] : n2 > 0.8 && shade < 3 ? R[0] : R[Math.min(3, shade)]);
    }
  }
  if (look.red) {   // energy veins splitting the walls
    for (let n = 0; n < W / 8; n++) {
      let x = n % 2 ? rand() * W * 0.25 : W - rand() * W * 0.25, y = hz - 1 - rand() * hz * 0.2, a = -Math.PI / 2 + (rand() - 0.5);
      for (let k = 0; k < hz * 0.8; k++) {
        a += (rand() - 0.5) * 0.8;
        x += Math.cos(a); y += Math.sin(a);
        if (y < 0 || y >= roof(x | 0) - 1) break;
        wallP.put(x, y, ENERGY[k % 9 ? 3 : 2]);
        wallP.glow(x + 1, y, ENERGY[4], 0.5); wallP.glow(x, y + 1, ENERGY[4], 0.4);
      }
    }
  }
  for (let n = 0; n < (tall ? 7 : 11); n++) {   // crystals off the walls, aimed into the cavern
    const side = n % 2 ? 1 : -1, x = side < 0 ? rand() * W * 0.2 : W - rand() * W * 0.2;
    const y = Math.min(hz - 2, roof(x | 0) - 1 - rand() * hz * 0.2);
    const a = (side < 0 ? 0 : Math.PI) + (y < hz * 0.5 ? 0.6 : -0.5) * (side < 0 ? 1 : -1) + (rand() - 0.5) * 0.4;
    cluster(wallP, x, y, H * (0.06 + rand() * 0.08), n % 3 ? C.crystal : C.gem2, n % 3 ? C.gem2 : C.crystal, a, 3, 2);
  }
  for (let x = 2; x < W - 2; x += 3 + Math.floor(rand() * 5)) {   // stalactites, some of them crystal
    const y0 = roof(x);
    if (y0 > hz * 0.7) continue;
    const len = 3 + rand() * H * 0.06;
    if (rand() < 0.4) { prism(wallP, x, y0 - 2, Math.PI / 2 + (rand() - 0.5) * 0.2, len, 1.2, rand() < 0.5 ? C.crystal : C.gem2, 2); continue; }
    for (let k = 0; k < len; k++) { const half = Math.round((1 - k / len) * 2); for (let dx = -half; dx <= half; dx++) wallP.put(x + dx, y0 + k, k >= len - 2 ? mix(R[0], C.crystal[1], 0.4) : dx < 0 ? R[1] : dx > 0 ? R[3] : R[2]); }
  }
  const wallC = wallP.done();

  // ---- the floor: mottled rock in perspective, a way worn towards the Well, still pools, cracks ----
  const groundP = pixels(W, H), span0 = H - hz;
  const smooth = (x, y, seed) => {
    const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), n = (a, b) => noise(a, b, seed);
    return (n(i, j) * (1 - u) + n(i + 1, j) * u) * (1 - v) + (n(i, j + 1) * (1 - u) + n(i + 1, j + 1) * u) * v;
  };
  for (let y = hz; y < H; y++) {
    const g = (y - hz) / span0 + 0.03, Zg = 8 / g, t = Math.pow(Math.min(1, (y - hz) / span0), 0.8) * (C.floor.length - 1), i = Math.min(C.floor.length - 2, Math.floor(t));
    for (let x = 0; x < W; x++) {
      const X = (x + 0.5 - VX) / W * 4 / g, m = smooth(X * 0.5, Zg * 0.5, 11) * 0.65 + smooth(X * 1.6, Zg * 1.6, 12) * 0.35;
      const lift2 = ((m - 0.5) * 2.4 + (bayer(x, y) / 16 - 0.5) * 0.45) * Math.min(1, g * 3);
      const k = lift2 > 0.5 ? 1.14 : lift2 > 0.2 ? 1.06 : lift2 < -0.45 ? 0.8 : lift2 < -0.18 ? 0.91 : 1;
      const mid = VX + Math.sin(g * 4) * W * 0.04, hw = 1 + g * W * 0.16, onPath = Math.abs(x + 0.5 - mid) < hw;
      groundP.put(x, y, bayer(x, y) < (t - i) * 16 ? C.floor[i + 1] : C.floor[i]);
      groundP.tint(x, y, k * (onPath ? 1.1 : 1));
      const d = Math.hypot((x - VX) / (W * 0.45), (y - hz) / (span0 * 0.35));   // the Well's light lying on the floor
      if (d < 1 && bayer(x, y) < (1 - d) * 22) groundP.glow(x, y, ENERGY[3], 0.3);
    }
  }
  for (let n = 0; n < (look.red ? 8 : 5); n++) {   // cracks; glowing ones in the Deep Core
    let x = rand() * W, y = hz + 3 + rand() * span0 * 0.8, a = (x < VX ? 0 : Math.PI) + (rand() - 0.5) * 1.2;
    for (let k = 0; k < 14 + rand() * 30; k++) {
      const dep = (y - hz) / span0, dx = Math.cos(a), dy = Math.sin(a) * (0.45 + dep * 0.55), m = Math.max(Math.abs(dx), Math.abs(dy));
      x += dx / m; y += dy / m; a += (rand() - 0.5) * 0.7;
      if (y >= H) break;
      if (look.red) { groundP.put(x, y, ENERGY[3]); groundP.glow(x, y - 1, ENERGY[3], 0.4); groundP.glow(x, y + 1, ENERGY[4], 0.4); }
      else groundP.put(x, y, C.floor[5]);
    }
  }
  for (let n = 0; n < 4; n++) {   // pools catching the glow
    const cx = W * (n % 2 ? 0.62 + rand() * 0.3 : 0.08 + rand() * 0.3), cy = hz + span0 * (0.2 + rand() * 0.6), rx = 3 + ((cy - hz) / span0) * W * 0.08, ry = Math.max(1.5, rx * 0.3);
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
      if (d <= 1) groundP.put(x, y, d > 0.7 ? C.water[2] : y === Math.floor(cy - ry) + 1 && bayer(x, y) < 8 ? C.water[1] : (x + y * 3) % 9 === 0 ? C.water[0] : C.water[3]);
    }
  }
  const groundC = groundP.done();

  // ---- the near corners: big crystal clusters, a stalagmite ----
  const foreP = pixels(W, H);
  cluster(foreP, W * 0.06, H - span0 * 0.06, span0 * 0.55, C.crystal, C.gem2, -Math.PI / 2 + 0.15, 5, 3);
  cluster(foreP, W * 0.95, H - span0 * 0.03, span0 * 0.42, C.gem2, C.crystal, -Math.PI / 2 - 0.15, 4, 3);
  for (let n = 0; n < 2; n++) {
    const cx = n ? W * 0.84 : W * 0.17, foot = H + 1, h = span0 * (n ? 0.3 : 0.4), half = Math.max(2, h * 0.16);
    for (let k = 0; k < h; k++) { const w = Math.round(half * (1 - k / h) ** 0.8); for (let dx = -w - 1; dx <= w + 1; dx++) foreP.put(cx + dx, foot - k, Math.abs(dx) > w ? R[4] : dx < -w * 0.3 ? R[0] : dx > w * 0.4 ? R[3] : k % 4 === 0 ? R[3] : R[1]); }
  }
  const foreC = foreP.done();

  // ---- the shaft you come down: rock walls either side, crystals jutting off them, its foot a jagged lip ----
  const shaftP = pixels(W, shaftH);
  if (!mini) {
    for (let y = 0; y < shaftH; y++) {
      const L = W * (0.3 + 0.06 * Math.sin(y / 17) + (noise(y >> 2, 1, 13) - 0.5) * 0.05), Rr = W * (0.7 + 0.06 * Math.sin(y / 13 + 2) + (noise(y >> 2, 2, 13) - 0.5) * 0.05);
      for (let x = 0; x < W; x++) {
        if (x > L && x < Rr) continue;
        const bottom = shaftH - 3 - Math.round(noise(x >> 1, 3, 14) * H * 0.08);
        if (y > bottom) continue;
        const e2 = x <= L ? L - x : x - Rr, n = noise(x >> 2, y >> 2, 15);
        shaftP.put(x, y, e2 < 1 ? mix(R[0], C.crystal[2], 0.3) : noise(Math.round(x / 4), Math.round(y / 5 + Math.sin(x / 3)), 16) > 0.85 ? R[4] : R[Math.min(4, 1 + Math.floor(n * 2 + e2 / (W * 0.08)))]);
      }
    }
    for (let n = 0; n < 14; n++) {
      const side = n % 2 ? 1 : -1, y = rand() * shaftH * 0.9, x = W * (side < 0 ? 0.3 : 0.7) + side * 2;
      cluster(shaftP, x, y, H * (0.05 + rand() * 0.06), n % 3 ? C.crystal : C.gem2, C.gem2, side < 0 ? (rand() - 0.5) * 0.8 : Math.PI + (rand() - 0.5) * 0.8, 3, 2);
    }
  }
  const shaftC = shaftP.done();

  // ---- where the Pokémon step out: from behind crystal outcrops ahead of where the camera comes to rest ----
  const spots = beats.POPS.map((ms, i) => {
    const k = i + 3 - beats.POPS.length, depth = [0.4, 0.25, 0.62][k], y = Math.round(hz + span0 * depth), x = Math.round(W * [0.3, 0.68, 0.44][k]);
    return { ms, x, y, scale: 0.6 + depth * 0.6, size: Math.round(5 + depth * 12) };
  });
  const end = grow(beats.END, PUSH.ground);   // how far the camera has pushed in once it settles
  settle(spots, { way: (s) => { const g = (s.y - hz) / span0 + 0.03; return [VX + Math.sin(g * 4) * W * 0.04, 1 + g * W * 0.16]; }, view: () => [0, W], rest: [VX - VX / end, VX + (W - VX) / end] });   // either side of the way worn to the Well
  const outcrops = spots.map((s, i) => {
    const w = s.size * 2 + 6, h = s.size * 2 + 4, p = pixels(w, h), cx = w / 2, foot = h - 1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const d = ((x - cx) / (s.size)) ** 2 + ((y - foot) / (s.size * 0.6)) ** 2;
      if (d <= 1 && y <= foot) p.put(x, y, d > 0.8 ? R[4] : x < cx - 1 && y < foot - s.size * 0.2 ? R[0] : x > cx + 2 ? R[3] : R[1]);
    }
    cluster(p, cx + (i % 2 ? 2 : -2), foot - s.size * 0.3, s.size * 1.2, i % 2 ? C.gem2 : C.crystal, i % 2 ? C.crystal : C.gem2, -Math.PI / 2, 3, 1);
    return p.done();
  });
  const at = (x, y, ms, k) => {   // a point on a layer, after the camera's push and the fall
    const s = grow(ms, k);
    return [VX + (x - VX) * s, hz + (y - hz) * s + lift(ms, LIFT.ground)];
  };

  // ---- the air: motes rising; dust streaming past as you fall ----
  const motes = Array.from({ length: Math.round(W / 4) }, () => ({ x: rand() * W, y: rand() * H, v: 0.6 + rand() * 1.4, ph: rand() * 6 }));
  const dust = Array.from({ length: 40 }, () => ({ x: W * (0.3 + rand() * 0.4), y: rand() * H, k: 0.5 + rand() }));
  let lastMs = 0, hummed = false;
  const chimed = new Set();

  function draw(bg, fg, ms, tick) {
    const R = bg.snap;
    const dt = Math.min(0.1, (ms - lastMs) / 1000);
    lastMs = ms;
    if (!hummed && live()) { hummed = true; playSound('gate-hum'); }

    const layerAt = (g, img, k, l) => {
      const s = grow(ms, k), off = l ? lift(ms, l) : 0;
      g.drawImage(img, R(VX - VX * s), R(hz - hz * s + off), R(W * s), R(H * s));
    };
    bg.drawImage(skyC, 0, 0);
    for (const g of glimmers) if (Math.sin(tick * 1.4 + g.ph) > 0.75) { bg.fillStyle = g.c; bg.fillRect(g.x, g.y, 1, 1); }
    layerAt(bg, farC, PUSH.far, LIFT.far);

    // the Energy Well, far off: a column of crimson light climbing to a vortex on the roof
    {
      const s = grow(ms, PUSH.far) * goal, off = lift(ms, LIFT.far), x = VX, base = hz + off, top = Math.max(0, hz * (1 - 0.92 * Math.min(1, s * 0.75)) + off - hz * 0.1);
      const w = Math.max(1, Math.round(s * 0.7 + Math.sin(tick * 7) * 0.3));
      bg.globalAlpha = 0.25;
      bg.fillStyle = ENERGY[3]; bg.fillRect(x - w * 4, R(top), w * 8 + 1, R(base - top));
      bg.globalAlpha = 1;
      for (let y = Math.round(top); y < base; y++) {
        const wob = R(Math.sin(y * 0.4 + tick * 6) * 0.6);
        bg.fillStyle = ENERGY[2]; bg.fillRect(x - w - 1 + wob, y, w * 2 + 3, 1);
        bg.fillStyle = (y + Math.floor(tick * 20)) % 6 < 2 ? ENERGY[0] : ENERGY[1]; bg.fillRect(x - w + 1 + wob, y, Math.max(1, w * 2 - 1), 1);
      }
      const vr = W * 0.14 * s;   // its vortex
      for (let n = 0; n < 90; n++) {
        const a = n / 90 * Math.PI * 8 + tick * 1.8, r = (n / 90) * vr;
        bg.fillStyle = ENERGY[n % 3 + 1];
        bg.fillRect(R(x + Math.cos(a) * r), R(top + Math.sin(a) * r * 0.35), 1, 1);
      }
      bg.globalAlpha = 0.35 + 0.15 * Math.sin(tick * 3);
      bg.fillStyle = ENERGY[2];
      bg.beginPath(); bg.ellipse(x, base, Math.max(3, W * 0.05 * s), Math.max(1, 1.5 * s), 0, 0, Math.PI * 2); bg.fill();
      bg.globalAlpha = 1;
    }

    layerAt(bg, midC, PUSH.mid, LIFT.mid);
    for (const [i, l] of lights.entries()) {   // the lights coming on
      const k = mini ? 1 : l.at < 0 ? 1 : Math.min(1, Math.max(0, (ms - l.at) / 500));
      if (!mini && l.at >= 0 && ms >= l.at && !chimed.has(i)) { chimed.add(i); if (live() && i < 3) playSound(`crystal-${i}`); }
      if (k < 1) layerAt(bg, l.dark, PUSH.mid, LIFT.mid);
      if (k > 0) {
        bg.globalAlpha = k;
        layerAt(bg, l.lit, PUSH.mid, LIFT.mid);
        if (k < 1) {   // a flash as it catches
          const s = grow(ms, PUSH.mid), [x, y] = [VX + (l.x - VX) * s, hz + (l.y - hz) * s + lift(ms, LIFT.mid)];
          bg.fillStyle = '#ffffff';
          bg.fillRect(R(x) - 2, R(y), 5, 1); bg.fillRect(R(x), R(y) - 2, 1, 5);
        }
        bg.globalAlpha = 1;
      }
    }
    layerAt(bg, groundC, PUSH.ground, LIFT.ground);
    layerAt(bg, wallC, PUSH.wall, LIFT.wall);

    fg.clearRect(0, 0, W, H);
    for (const [i, s] of spots.entries()) {   // the outcrops, shaking just before one steps out
      const img = outcrops[i], [x, y] = at(s.x, s.y, ms, PUSH.ground), sc = grow(ms, PUSH.ground);
      const rustle = ms > s.ms - 350 && ms < s.ms + 200 ? ((Math.floor(ms / 60) % 2) ? 1 : -1) : 0;
      const w = R(img.width * sc), h = R(img.height * sc);
      fg.drawImage(img, R(x - w / 2 + rustle), R(y + 2 * sc - h + 1), w, h);
    }
    layerAt(fg, foreC, PUSH.fore, LIFT.fore);

    for (const m of motes) {   // motes drifting up, or streaking past while you fall
      m.y -= m.v * dt * 6;
      if (m.y < -2) { m.y = H + 2; m.x = Math.random() * W; }
      const y = ((m.y + lift(ms, 1.2)) % (H + 4) + H + 4) % (H + 4) - 2;
      if (Math.sin(tick * 2.5 + m.ph) > -0.2) { fg.fillStyle = (look.red && m.ph > 3) ? ENERGY[1] : C.mote[m.ph > 4 ? 0 : 1]; fg.fillRect(R(m.x), R(y), 1, 1); }
    }

    if (!mini && foot(ms) > 0) {   // the shaft: its walls slide up past you, and its foot opens onto the cavern
      const speed = (shaftH + H * 0.1) * 1.15 / (B.DROP[1] / 1000);
      fg.drawImage(shaftC, 0, R(shaftY(ms)));
      for (const d of dust) {
        d.y -= speed * dt * d.k * 0.5;
        if (d.y < -10) { d.y = H + Math.random() * 20; d.x = W * (0.32 + Math.random() * 0.36); }
        const len = Math.min(12, Math.max(1, speed * 0.012 * d.k));
        fg.fillStyle = C.mote[1];
        fg.fillRect(R(d.x), R(d.y), 1, R(len));
      }
      const above = Math.max(0, 1 - ms / 1800);   // the light from the hole you came down, fading above you
      if (above > 0) {
        const grd = fg.createLinearGradient(0, 0, 0, H * 0.5);
        grd.addColorStop(0, `rgba(224, 240, 255, ${0.45 * above})`); grd.addColorStop(1, 'rgba(224, 240, 255, 0)');
        fg.fillStyle = grd; fg.fillRect(0, 0, W, H * 0.5);
      }
    }
    if (!mini && ms < 400) { fg.fillStyle = `rgba(0, 0, 0, ${1 - ms / 400})`; fg.fillRect(0, 0, W, H); }
  }

  return {
    spots, walkX: VX, draw,
    monAt: (i, ms) => { const s = spots[i], [x, y] = at(s.x, s.y, ms, PUSH.ground); return [x, y]; },
  };
}

const same = (sky) => ({ day: sky, dawn: sky, dusk: sky, night: sky });

export const DEPTHS_INTRO = {
  title: ['CRYSTAL', 'DEPTHS'], ink: ['#f8eaff', '#c0287a', '#2a0630'],
  skies: same({ sky: HALLS.void, cloud: ['#2c205c', '#1a1240', '#0c0826'] }),
  land: {},
  // the Crystal Halls' walk-on, then the Deep Core's, the Well nearer each time and the rock gone red
  stages: [null, { goal: 1.6 }, { goal: 2.5, red: true }],
  beats: { DROP: [0, 3000], PUSH: [2700, 9600], LIGHTS: [3000, 3350, 3700, 4000, 4250, 4500], POPS: [4700, 5400], TITLE_AT: 6400, END: 9800 },
  sounds: ['gate-hum', 'crystal-0', 'crystal-1', 'crystal-2'],
  scene: depthsScene,
};
