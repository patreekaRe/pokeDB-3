/* ============================================================
   battlebg.js  -  the pixel-art scene behind a battle, one per biome,
   plus the grassy "battle pads" the two Pokémon stand on, like the
   Gen 3/4 games.

   The scene is painted into a small canvas (one canvas pixel = a few
   CSS pixels, upscaled with image-rendering: pixelated), the same way
   as the title screen's sky, so it stays blocky on any screen.
   Everything that never moves is painted once into `base`; each frame
   copies it and draws the living parts on top: drifting clouds and
   their shadows, grass swaying in waves of wind, butterflies, the odd
   flock of birds and floating pollen. It only animates while a battle
   is showing, and not at all under prefers-reduced-motion.
   ============================================================ */

import { $ } from './ui.js';

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const FPS = 8;
const dither = (x, y) => BAYER[((y % 4 + 4) % 4) * 4 + ((x % 4 + 4) % 4)];

// Biomes without a scene keep the blurred photo backdrop.
const SCENES = {
  clearing: {
    sky: ['#4a90e4', '#5ca0ec', '#70b0f2', '#86c0f6', '#9ed0f8', '#b8e0f8', '#d0ecf8'],
    sun: ['#fffce8', '#fff0a0', '#f8e070'],
    cloud: ['#ffffff', '#eef4fb', '#c8dcee', '#a8c4e0'],   // lit, body, shade, underside
    farHills: ['#b4d8d8', '#9cc8c8'],
    hills: ['#8cc8a0', '#74b48c', '#62a47c'],
    trees: ['#6cc058', '#48a044', '#2e7c34', '#1c5a26'],
    trunk: ['#7a5430', '#4e3418'],
    meadow: ['#90d468', '#80c858', '#70bc4c', '#62b044', '#56a43c', '#4a9834'],
    blade: ['#b0e878', '#78c050', '#3e8832'],             // tip, middle, root
    patch: '#4e9a3c',
    flowers: [['#ffffff', '#f8d848'], ['#f8e048', '#f89830'], ['#f8a0c8', '#f8f0f8'], ['#b0a0f8', '#f8f8f8']],
    rock: ['#d0d0c8', '#a0a098', '#6c6c68'],
    butterflies: ['#ffffff', '#f8d848', '#f8a040'],
    bird: '#34405c',
    pollen: ['#fffce0', '#f8f0a0'],
    pad: { top: '#a8e078', mid: '#80c858', low: '#5ea840', rim: '#2e6a2c', earth: '#8a6a3a', blade: '#c0f088' },
  },
};

export const hasScene = (biomeId) => !!SCENES[biomeId];

let canvas = null, ctx = null, scene = null, C = null, timer = 0, tick = 0;
let W = 0, H = 0, horizon = 0, base = null, img = null, px = null, sky = null;
let clouds = [], blades = [], butterflies = [], motes = [], flock = null, sun = null, rand = Math.random;

/** Paint the scene for a biome behind the battle screen (or clear it, for a biome without one). */
export function showBattleScene(biomeId) {
  canvas = $('battle-bg');
  ctx = canvas.getContext('2d');
  scene = SCENES[biomeId] || null;
  document.body.classList.toggle('has-scene', !!scene);
  clearInterval(timer);
  if (!scene) return;
  C = colours(scene);
  $('battle-screen').style.setProperty('--pad', `url("${padImage(scene.pad)}")`);
  resize();
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) timer = setInterval(frame, 1000 / FPS);
}

addEventListener('resize', () => { if (scene) resize(); });

function resize() {
  const scale = innerWidth <= 720 ? 4 : 5;
  W = Math.ceil(innerWidth / scale);
  H = Math.ceil(innerHeight / scale);
  canvas.width = W;
  canvas.height = H;
  horizon = horizonRow(scale);
  rand = seeded(W * 131 + H);
  img = ctx.createImageData(W, H);
  px = new Uint32Array(img.data.buffer);
  sky = new Uint8Array(W * H);
  base = paintBase();
  makeLife();
  draw();
}

/** The horizon sits at about 38% of the screen, but always above the enemy's pad, so the pad is on the meadow on any layout. */
function horizonRow(scale) {
  const box = $('enemy-portrait-box').getBoundingClientRect();
  const low = Math.round(H * 0.38);
  if (!box.height) return low;
  const pad = box.width * 1.25 * 16 / 48;   // the enemy's pad (its CSS width, at the pad image's aspect)
  const row = Math.round((box.bottom - pad - 6) / scale);
  return Math.max(Math.round(H * 0.15), Math.min(low, row));
}

function frame() {
  if (document.body.dataset.screen !== 'battle-screen' || document.hidden) return;
  tick++;
  draw();
}

/* ---------- drawing helpers (on the frame buffer) ---------- */

const put = (x, y, c) => { x |= 0; y |= 0; if (x >= 0 && x < W && y >= 0 && y < H) px[y * W + x] = c; };
const putSky = (x, y, c) => { x |= 0; y |= 0; if (x >= 0 && x < W && y >= 0 && y < H && sky[y * W + x]) px[y * W + x] = c; };
const shadeAt = (x, y, k) => {
  x |= 0; y |= 0;
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const c = px[y * W + x];
  const r = (c & 255) * k, g = ((c >> 8) & 255) * k, b = ((c >> 16) & 255) * k;
  px[y * W + x] = ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0;
};

/* ---------- the still scene ---------- */

function paintBase() {
  // sky: bands from deep blue at the top to pale at the horizon, dithered where they meet
  for (let y = 0; y < horizon; y++) {
    const t = (y / horizon) * (C.sky.length - 1);
    const i = Math.floor(t), f = t - i;
    for (let x = 0; x < W; x++) {
      put(x, y, C.sky[Math.min(C.sky.length - 1, i + (f * 16 > dither(x, y) ? 1 : 0))]);
      sky[y * W + x] = 1;
    }
  }

  // the sun, high on the right, with a soft dithered halo
  sun = { x: Math.round(W * 0.88), y: Math.max(12, Math.round(horizon * 0.5)), r: Math.max(3, Math.round(Math.min(W, H) * 0.03)) };
  for (let y = -sun.r * 2; y <= sun.r * 2; y++) {
    for (let x = -sun.r * 2; x <= sun.r * 2; x++) {
      const d = Math.sqrt(x * x + y * y);
      if (d <= sun.r) put(sun.x + x, sun.y + y, d < sun.r - 1 ? C.sun[0] : C.sun[1]);
      else if (d <= sun.r * 1.7 && dither(x, y) < 5) put(sun.x + x, sun.y + y, C.sky[C.sky.length - 1]);
    }
  }

  // far hills, pale with distance, then nearer green ones
  ridge(horizon - 9, 5, 23, 0.4, C.farHills, 0);
  ridge(horizon - 4, 4, 13, 2.1, C.hills, 1);

  // meadow: bands from the horizon down, darker (closer) towards the bottom
  for (let y = horizon; y < H; y++) {
    const t = Math.pow((y - horizon) / (H - horizon), 0.8) * (C.meadow.length - 1);
    const i = Math.floor(t), f = t - i;
    for (let x = 0; x < W; x++) put(x, y, C.meadow[Math.min(C.meadow.length - 1, i + (f * 16 > dither(x, y) ? 1 : 0))]);
  }

  // darker patches of longer grass, flatter towards the horizon
  for (let n = 0; n < Math.round(W / 10); n++) {
    const cy = horizon + 4 + Math.floor(rand() * (H - horizon)), depth = (cy - horizon) / (H - horizon);
    const rx = 4 + Math.floor(rand() * 10 * (0.5 + depth)), ry = Math.max(1, Math.round(rx * (0.15 + depth * 0.2)));
    const cx = Math.floor(rand() * W);
    for (let y = cy - ry; y <= cy + ry; y++) {
      for (let x = cx - rx; x <= cx + rx; x++) {
        const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
        if (d <= 1 && (d < 0.6 || dither(x, y) < 8)) put(x, y, C.patch);
      }
    }
  }

  // rocks, bigger closer in
  for (let n = 0; n < Math.max(2, Math.round(W / 60)); n++) {
    const y = horizon + 6 + Math.floor(rand() * (H - horizon - 8)), depth = (y - horizon) / (H - horizon);
    rock(Math.floor(rand() * W), y, depth > 0.5 ? 2 : 1);
  }

  // flowers in little clusters of one colour; near ones get petals round a centre
  for (let n = 0; n < Math.round(W / 9); n++) {
    const cy = horizon + 4 + Math.floor(rand() * (H - horizon - 4)), cx = Math.floor(rand() * W);
    const [petal, heart] = C.flowers[Math.floor(rand() * C.flowers.length)];
    const depth = (cy - horizon) / (H - horizon);
    for (let k = 0, count = 2 + Math.floor(rand() * 4); k < count; k++) {
      const x = cx + Math.round((rand() - 0.5) * (6 + depth * 10)), y = cy + Math.round((rand() - 0.5) * (2 + depth * 4));
      if (depth > 0.55) { put(x - 1, y, petal); put(x + 1, y, petal); put(x, y - 1, petal); put(x, y + 1, petal); put(x, y, heart); }
      else put(x, y, petal);
    }
  }

  // the tree line: a few tall trees at the back with their trunks showing, bushier ones in front
  for (let x = Math.floor(rand() * 10); x < W + 8; x += 10 + Math.floor(rand() * 16)) {
    tree(x, horizon - 9 - Math.floor(rand() * 4), 5 + Math.floor(rand() * 3), true);
  }
  for (let x = -4; x < W + 6; x += 3 + Math.floor(rand() * 4)) {
    tree(x, horizon - 1 - Math.floor(rand() * 3), 3 + Math.floor(rand() * 3), false);
  }
  for (let x = 0; x < W; x++) { put(x, horizon + 2, C.trees[3]); if (dither(x, horizon + 3) < 6) put(x, horizon + 3, C.trees[3]); }

  return Uint32Array.from(px);
}

/** A rolling ridge line; `seed` shifts its waves so the two ranges don't line up. */
function ridge(top, height, wave, seed, [lit, body, dark = body], id) {
  for (let x = 0; x < W; x++) {
    const y0 = top - Math.round(height * (0.6 * Math.sin(x / wave + seed) + 0.4 * Math.sin(x / (wave * 0.37) + seed * 3)));
    for (let y = y0; y < horizon; y++) {
      const shade = id && Math.sin(x / wave + seed + 0.8) < -0.2 && dither(x, y) < 10;   // the slopes facing away from the sun
      put(x, y, y === y0 ? lit : shade ? dark : body);
      sky[y * W + x] = 0;
    }
  }
}

/** A round canopy lit from the top right (the sun's side); tall trees also get a trunk. */
function tree(cx, cy, r, tall) {
  const [lit, leaf, shade, deep] = C.trees;
  if (tall) {
    for (let y = cy + r - 1; y <= horizon + 1; y++) {
      put(cx, y, C.trunk[0]); put(cx + 1, y, C.trunk[1]);
      sky[y * W + cx] = sky[y * W + cx + 1] = 0;
    }
  }
  for (let y = cy - r; y <= (tall ? cy + r : horizon + 1); y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      const dx = x - cx, dy = y - cy;
      if ((tall || y < cy) && dx * dx + dy * dy > r * r) continue;
      const light = -dx + dy;   // low towards the top right
      const colour = light < -r * 0.6 ? lit : light > r * 0.9 || y >= horizon ? deep : light > r * 0.3 && dither(x, y) < 8 ? shade : leaf;
      put(x, y, colour);
      if (y >= 0 && y < H && x >= 0 && x < W) sky[y * W + x] = 0;
    }
  }
  // a few lit leaf clumps on the sunny side
  for (let k = 0; k < r; k++) put(cx + Math.round(r * 0.3) + (k % 3) - 1, cy - Math.round(r * 0.5) + Math.floor(k / 3), lit);
}

function rock(x, y, size) {
  const [lit, body, dark] = C.rock;
  if (size === 1) { put(x, y, body); put(x + 1, y, dark); put(x, y - 1, lit); return; }
  for (let dx = -1; dx <= 2; dx++) put(x + dx, y, dark);
  for (let dx = -1; dx <= 1; dx++) put(x + dx, y - 1, body);
  put(x + 2, y - 1, dark); put(x, y - 2, lit); put(x - 1, y - 1, lit); put(x + 1, y - 2, body);
}

/* ---------- the living parts ---------- */

function makeLife() {
  clouds = [];
  const band = Math.max(8, Math.round(horizon * 0.75));
  for (let i = 0, n = Math.max(3, Math.round(W / 40)); i < n; i++) {
    const near = i % 2 === 0;
    const w = near ? 18 + Math.floor(rand() * 16) : 10 + Math.floor(rand() * 8);
    clouds.push({
      x: rand() * (W + w * 2), y: 2 + Math.floor(rand() * Math.max(1, band - 10)), w, h: near ? 5 + Math.floor(rand() * 3) : 3,
      speed: near ? 0.22 + rand() * 0.12 : 0.08 + rand() * 0.06, near,
      shadowY: horizon + 8 + Math.floor(rand() * Math.max(1, H - horizon - 16)),
    });
  }
  clouds.sort((a, b) => a.near - b.near);   // far ones behind

  blades = [];
  for (let y = horizon + 4; y < H; y++) {
    const depth = (y - horizon) / (H - horizon);
    for (let n = 0, count = Math.round(W * (0.012 + depth * 0.035)); n < count; n++) {
      blades.push({ x: Math.floor(rand() * W), y, h: depth > 0.6 ? 3 : depth > 0.25 ? 2 : 1, twin: depth > 0.45 && rand() < 0.5 });
    }
  }

  butterflies = [];
  for (let i = 0, n = Math.max(2, Math.round(W / 70)); i < n; i++) {
    butterflies.push({
      x: rand() * W, y: horizon + 6 + rand() * (H - horizon) * 0.6, vx: (rand() < 0.5 ? -1 : 1) * (0.25 + rand() * 0.3),
      phase: rand() * 10, colour: C.butterflies[i % C.butterflies.length],
    });
  }

  motes = [];
  for (let i = 0, n = Math.round(W / 8); i < n; i++) {
    motes.push({ x: rand() * W, y: horizon - 10 + rand() * (H - horizon + 10), vx: 0.1 + rand() * 0.2, vy: -0.03 - rand() * 0.06, phase: rand() * 20 });
  }

  flock = null;
}

function draw() {
  px.set(base);
  const t = tick;

  // the sun's halo breathes a little
  const glow = 8 + Math.round(3 * Math.sin(t / 10));
  for (let y = -sun.r * 2; y <= sun.r * 2; y++) {
    for (let x = -sun.r * 2; x <= sun.r * 2; x++) {
      const d = Math.sqrt(x * x + y * y);
      if (d > sun.r && d <= sun.r + 1.5 && dither(x, y) < glow) putSky(sun.x + x, sun.y + y, C.sun[2]);
    }
  }

  // clouds drift right, and the near ones drag their shadows across the meadow
  for (const c of clouds) {
    const x = ((c.x + t * c.speed) % (W + c.w * 2)) - c.w;
    if (c.near) cloudShadow(x, c);
    cloud(Math.round(x), c.y, c.w, c.h, c.near);
  }

  // the odd flock of birds crossing the sky
  if (!flock && t % (FPS * 14) === FPS * 3) {
    const y = 4 + Math.floor(rand() * Math.max(1, horizon * 0.5));
    flock = { x: -12, y, birds: [[0, 0], [-5, 3], [-9, -2]].slice(0, 2 + Math.floor(rand() * 2)) };
  }
  if (flock) {
    flock.x += 0.9;
    for (const [dx, dy] of flock.birds) bird(flock.x + dx, flock.y + dy + Math.round(Math.sin((t + dx) / 3)), (t + dx) % 4 < 2);
    if (flock.x > W + 14) flock = null;
  }

  // grass sways in waves of wind that roll across the meadow
  const [tip, mid, root] = C.blade;
  for (const b of blades) {
    const wind = Math.sin(t / 5 - b.x / 9 + b.y / 23) + 0.6 * Math.sin(t / 13 - b.x / 31);
    const lean = wind > 0.9 ? 1 : wind < -1.2 ? -1 : 0;
    put(b.x, b.y, root);
    if (b.h >= 2) put(b.x, b.y - 1, b.h === 2 ? tip : mid);
    put(b.x + lean, b.y - b.h, tip);
    if (b.twin) { put(b.x + 2, b.y, root); put(b.x + 2 + lean, b.y - 1, tip); }
  }

  // butterflies flutter along, bobbing, wings flapping
  for (const f of butterflies) {
    f.x += f.vx;
    if (f.x < -4) f.x = W + 3; else if (f.x > W + 4) f.x = -3;
    const y = f.y + Math.sin((t + f.phase) / 4) * 2.5;
    const open = (t + Math.round(f.phase)) % 3 !== 0;
    put(f.x, y, C.bird);
    if (open) { put(f.x - 1, y - 1, f.colour); put(f.x + 1, y - 1, f.colour); put(f.x - 1, y, f.colour); put(f.x + 1, y, f.colour); }
    else { put(f.x, y - 1, f.colour); put(f.x, y - 2, f.colour); }
  }

  // pollen drifts up and to the right, twinkling
  for (const m of motes) {
    m.x += m.vx; m.y += m.vy + Math.sin((t + m.phase) / 6) * 0.05;
    if (m.x > W + 2) m.x = -2;
    if (m.y < horizon - 14) m.y = H - 1;
    const s = Math.sin((t + m.phase) / 5);
    if (s > 0.2) put(m.x, m.y, s > 0.8 ? C.pollen[0] : C.pollen[1]);
  }

  ctx.putImageData(img, 0, 0);
}

/** A pixel cumulus: puffs on a flat base, lit on top, shaded underneath; far ones are smaller and greyer. */
function cloud(x0, y0, w, h, near) {
  const [lit, body, shade, under] = near ? C.cloud : [C.cloud[1], C.cloud[2], C.cloud[3], C.cloud[3]];   // far ones paler
  const puffs = near ? [[0.2, 0.55], [0.42, 1], [0.65, 0.8], [0.84, 0.5]] : [[0.3, 0.7], [0.62, 1]];
  const base = y0 + h;
  for (let x = x0 + 1; x < x0 + w - 1; x++) { putSky(x, base, under); putSky(x, base - 1, shade); }
  for (const [at, size] of puffs) {
    const r = Math.max(2, Math.round(h * size * 0.8)), cx = x0 + Math.round(w * at), cy = base - 2;
    for (let y = -r; y <= 1; y++) {
      const half = Math.round(Math.sqrt(Math.max(0, r * r - y * y)));
      for (let x = -half; x <= half; x++) {
        const light = x + y;   // lit from the top right
        putSky(cx + x, cy + y, y >= 0 ? shade : light > r * 0.4 || y < -r * 0.6 ? lit : body);
      }
    }
  }
}

/** The near clouds' shadows: flattened dithered ovals that darken the meadow as they pass. */
function cloudShadow(x, c) {
  const rx = c.w * 0.9, ry = Math.max(2, c.w * 0.18), cx = x + c.w / 2 - (c.shadowY - horizon) * 0.3, cy = c.shadowY;
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++) {
    for (let xx = Math.floor(cx - rx); xx <= cx + rx; xx++) {
      const d = ((xx - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
      if (d <= 1 && (d < 0.4 || dither(xx, y) < 6) && y > horizon + 3) shadeAt(xx, y, 0.92);
    }
  }
}

function bird(x, y, up) {
  const c = C.bird;
  putSky(x, y, c);
  if (up) { putSky(x - 1, y - 1, c); putSky(x - 2, y - 1, c); putSky(x + 1, y - 1, c); putSky(x + 2, y - 1, c); }
  else { putSky(x - 1, y, c); putSky(x - 2, y + 1, c); putSky(x + 1, y, c); putSky(x + 2, y + 1, c); }
}

/* ---------- battle pads ---------- */

/** A small pixel oval of grass with an earthy side and blades along its back edge, as a data URL for CSS to scale up. */
function padImage({ top, mid, low, rim, earth, blade }) {
  const w = 48, h = 16;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  const rx = w / 2 - 0.5, ry = 4.5, cx = w / 2 - 0.5, cy = 7;
  const inside = (x, y, grow = 0) => ((x - cx) / (rx + grow)) ** 2 + ((y - cy) / (ry + grow)) ** 2 <= 1;
  const dot = (x, y, colour) => { g.fillStyle = colour; g.fillRect(x, y, 1, 1); };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let colour = null;
      if (inside(x, y)) colour = y < cy - ry * 0.35 ? top : y < cy + ry * 0.4 ? (dither(x, y) < 3 ? top : mid) : (dither(x, y) < 4 ? mid : low);
      else if (inside(x, y - 2) && y > cy) colour = earth;                        // the side of the pad, below the grass
      else if (inside(x, y, 0.9) || (inside(x, y - 2, 0.9) && y > cy)) colour = rim;
      if (colour) dot(x, y, colour);
    }
  }
  // blades poking up along the back edge, and a few darker tufts on top
  for (let x = 4; x < w - 4; x += 3 + (x % 2)) {
    const edge = Math.round(cy - ry * Math.sqrt(Math.max(0, 1 - ((x - cx) / rx) ** 2)));
    dot(x, edge - 1, blade); if (x % 5 === 0) dot(x, edge - 2, blade);
  }
  for (const [x, y] of [[10, 7], [16, 9], [30, 6], [36, 8], [23, 10]]) { dot(x, y, low); dot(x, y - 1, top); }
  return c.toDataURL();
}

/* ---------- helpers ---------- */

function colours(s) {
  const out = {};
  const conv = (v) => typeof v === 'string' ? (v.startsWith('#') ? abgr(v) : v) : Array.isArray(v) ? v.map(conv) : v;
  for (const [k, v] of Object.entries(s)) if (k !== 'pad') out[k] = conv(v);
  return out;
}

function abgr(hex) {
  const n = parseInt(hex.slice(1), 16);
  return ((255 << 24) | ((n & 255) << 16) | (n & 0xff00) | (n >> 16)) >>> 0;
}

function seeded(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
