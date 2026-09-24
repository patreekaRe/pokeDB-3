/* ============================================================
   battlebg.js  -  the pixel-art scene behind a battle, one per biome,
   plus the grassy "battle pads" the two Pokémon stand on, like the
   Gen 3/4 games.

   The scene is painted into a small canvas (one canvas pixel = a few
   CSS pixels, upscaled with image-rendering: pixelated), the same way
   as the title screen's sky, so it stays blocky on any screen. Only
   the clouds move, and only while a battle is showing.
   ============================================================ */

import { $ } from './ui.js';

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const FPS = 6;

// Biomes without a scene keep the blurred photo backdrop.
const SCENES = {
  clearing: {
    sky: ['#4f98e8', '#62a8f0', '#78b8f4', '#90c8f8', '#a8d8f8', '#c4e8f8'],
    cloud: ['#ffffff', '#e0eef8', '#b8d0e8'],
    hills: ['#8cc0b0', '#6ea898'],          // far hills: lit top, body
    trees: ['#5cb050', '#3a8a3c', '#246830', '#174a24'],
    meadow: ['#88d060', '#78c450', '#68b848', '#5aa840', '#4c9838'],
    tuft: ['#a8e070', '#3c8430'],
    patch: '#4e9a3c',
    flowers: ['#f8f8f8', '#f8d848', '#f890b8'],
    pad: { top: '#a8e078', mid: '#80c858', low: '#5ea840', rim: '#2e6a2c', earth: '#8a6a3a' },
  },
};

export const hasScene = (biomeId) => !!SCENES[biomeId];

let canvas = null, ctx = null, scene = null, base = null, clouds = [], W = 0, H = 0, timer = 0, tick = 0;

/** Paint the scene for a biome behind the battle screen (or clear it, for a biome without one). */
export function showBattleScene(biomeId) {
  canvas = $('battle-bg');
  ctx = canvas.getContext('2d');
  scene = SCENES[biomeId] || null;
  document.body.classList.toggle('has-scene', !!scene);
  clearInterval(timer);
  if (!scene) return;
  const pad = padImage(scene.pad);
  $('battle-screen').style.setProperty('--pad', `url("${pad}")`);
  resize();
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) timer = setInterval(frame, 1000 / FPS);
}

addEventListener('resize', () => { if (scene) resize(); });

function resize() {
  const px = innerWidth <= 720 ? 4 : 5;
  W = Math.ceil(innerWidth / px);
  H = Math.ceil(innerHeight / px);
  canvas.width = W;
  canvas.height = H;
  const rand = seeded(W * 131 + H);
  base = paint(scene, W, H, horizonRow(px), rand);
  clouds = makeClouds(W, Math.round(horizonRow(px) * 0.7), rand);
  draw();
}

/** The horizon sits at about 38% of the screen, but always above the enemy's pad, so the pad is on the meadow on any layout. */
function horizonRow(px) {
  const box = $('enemy-portrait-box').getBoundingClientRect();
  const low = Math.round(H * 0.38);
  if (!box.height) return low;
  const pad = box.width * 1.25 * 14 / 48;   // the enemy's pad (its CSS width, at the pad image's aspect)
  const row = Math.round((box.bottom - pad - 6) / px);
  return Math.max(Math.round(H * 0.15), Math.min(low, row));
}

function frame() {
  if (document.body.dataset.screen !== 'battle-screen' || document.hidden) return;
  tick++;
  draw();
}

function draw() {
  ctx.putImageData(base, 0, 0);
  for (const c of clouds) {
    const x = ((c.x + tick * c.speed) % (W + c.w * 2)) - c.w;
    drawCloud(Math.round(x), c.y, c.w, c.h, scene.cloud);
  }
}

/* ---------- the scene ---------- */

function paint(s, W, H, horizon, rand) {
  const img = ctx.createImageData(W, H);
  const px = new Uint32Array(img.data.buffer);
  const put = (x, y, c) => { if (x >= 0 && x < W && y >= 0 && y < H) px[y * W + x] = c; };
  const col = (hex) => abgr(hex);

  // sky: bands from deep blue at the top to pale at the horizon, dithered where they meet
  const sky = s.sky.map(col);
  for (let y = 0; y < horizon; y++) {
    const t = (y / horizon) * (sky.length - 1);
    const i = Math.floor(t), f = t - i;
    for (let x = 0; x < W; x++) {
      const next = f * 16 > BAYER[(y % 4) * 4 + (x % 4)] ? 1 : 0;
      put(x, y, sky[Math.min(sky.length - 1, i + next)]);
    }
  }

  // far hills: two soft rolling ridges just above the horizon
  const [hillTop, hill] = s.hills.map(col);
  const hillY = (x) => horizon - 6 - Math.round(4 * Math.sin(x / 17 + 1) + 3 * Math.sin(x / 7.3));
  for (let x = 0; x < W; x++) {
    const top = hillY(x);
    for (let y = top; y < horizon; y++) put(x, y, y === top ? hillTop : hill);
  }

  // meadow: bands from the horizon down, getting darker (closer) towards the bottom
  const meadow = s.meadow.map(col);
  for (let y = horizon; y < H; y++) {
    const t = Math.pow((y - horizon) / (H - horizon), 0.8) * (meadow.length - 1);
    const i = Math.floor(t), f = t - i;
    for (let x = 0; x < W; x++) {
      const next = f * 16 > BAYER[(y % 4) * 4 + (x % 4)] ? 1 : 0;
      put(x, y, meadow[Math.min(meadow.length - 1, i + next)]);
    }
  }

  // darker patches of longer grass, flatter towards the horizon, so the field has some depth
  const patch = col(s.patch);
  for (let n = 0; n < Math.round(W / 12); n++) {
    const cy = horizon + 4 + Math.floor(rand() * (H - horizon)), depth = (cy - horizon) / (H - horizon);
    const rx = 4 + Math.floor(rand() * 10 * (0.5 + depth)), ry = Math.max(1, Math.round(rx * (0.15 + depth * 0.2)));
    const cx = Math.floor(rand() * W);
    for (let y = cy - ry; y <= cy + ry; y++) {
      for (let x = cx - rx; x <= cx + rx; x++) {
        const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
        if (d <= 1 && (d < 0.6 || BAYER[((y + 64) % 4) * 4 + ((x + 64) % 4)] < 8)) put(x, y, patch);
      }
    }
  }

  // grass tufts and a few flowers, sparse near the horizon and denser closer in
  const [tuftLight, tuftDark] = s.tuft.map(col);
  const flowers = s.flowers.map(col);
  for (let y = horizon + 3; y < H - 1; y++) {
    const depth = (y - horizon) / (H - horizon);
    const count = Math.round(W * (0.01 + depth * 0.03));
    for (let n = 0; n < count; n++) {
      const x = Math.floor(rand() * W);
      if (rand() < 0.04) { put(x, y, flowers[Math.floor(rand() * flowers.length)]); continue; }
      // a blade or two: dark at the root, lit at the tip
      put(x, y, tuftDark); put(x, y - 1, tuftLight);
      if (depth > 0.4 && rand() < 0.5) { put(x + 2, y, tuftDark); put(x + 2, y - 1, tuftDark); put(x + 2, y - 2, tuftLight); }
    }
  }

  // the tree line along the horizon: round canopies, lit from the top left
  const [leafLight, leaf, leafDark, trunk] = s.trees.map(col);
  const canopies = [];
  for (let x = -4; x < W + 6; x += 3 + Math.floor(rand() * 4)) {
    canopies.push({ x, y: horizon - 1 - Math.floor(rand() * 3), r: 3 + Math.floor(rand() * 3) });
  }
  for (const { x: cx, y: cy, r } of canopies) {
    for (let y = cy - r; y <= horizon + 1; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        const dx = x - cx, dy = y - cy;
        if (y < cy && dx * dx + dy * dy > r * r) continue;
        const lit = dx + dy < -r * 0.6, shade = dx + dy > r * 0.7 || y >= horizon;
        put(x, y, lit ? leafLight : shade ? leafDark : leaf);
      }
    }
  }
  for (let x = 0; x < W; x++) put(x, horizon + 2, trunk);   // a dark shadow line where the trees meet the meadow

  return img;
}

/* ---------- clouds ---------- */

function makeClouds(W, band, rand) {
  const list = [];
  const count = Math.max(3, Math.round(W / 45));
  for (let i = 0; i < count; i++) {
    const w = 14 + Math.floor(rand() * 16);
    list.push({ x: rand() * (W + w * 2), y: 3 + Math.floor(rand() * Math.max(1, band - 8)), w, h: 4 + Math.floor(rand() * 3), speed: 0.15 + rand() * 0.2 });
  }
  return list;
}

/** A flat-bottomed pixel cloud: a few puffs on a base, white on top and shaded underneath. */
function drawCloud(x0, y0, w, h, [white, shade, under]) {
  ctx.fillStyle = under;
  ctx.fillRect(x0 + 1, y0 + h, w - 2, 1);
  ctx.fillStyle = shade;
  ctx.fillRect(x0, y0 + h - 2, w, 2);
  ctx.fillStyle = white;
  ctx.fillRect(x0 + 1, y0 + h - 3, w - 2, 1);
  const puffs = [[0.25, 0.55], [0.5, 1], [0.75, 0.7]];
  for (const [at, size] of puffs) {
    const r = Math.max(2, Math.round(h * size * 0.75));
    const cx = x0 + Math.round(w * at), cy = y0 + h - 2;
    for (let y = -r; y <= 0; y++) {
      const half = Math.round(Math.sqrt(r * r - y * y));
      ctx.fillRect(cx - half, cy + y, half * 2, 1);
    }
  }
}

/* ---------- battle pads ---------- */

/** A small pixel oval of grass with an earthy rim, as a data URL for CSS to scale up. */
function padImage({ top, mid, low, rim, earth }) {
  const w = 48, h = 14;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  const rx = w / 2 - 0.5, ry = h / 2 - 2.5, cx = w / 2 - 0.5, cy = h / 2 - 2;
  const inside = (x, y, grow = 0) => ((x - cx) / (rx + grow)) ** 2 + ((y - cy) / (ry + grow)) ** 2 <= 1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let color = null;
      if (inside(x, y)) color = y < cy - ry * 0.35 ? top : y < cy + ry * 0.4 ? mid : low;
      else if (inside(x, y - 2) && y > cy) color = earth;                        // the side of the pad, below the grass
      else if (inside(x, y, 0.9) || (inside(x, y - 2, 0.9) && y > cy)) color = rim;
      if (!color) continue;
      g.fillStyle = color;
      g.fillRect(x, y, 1, 1);
    }
  }
  return c.toDataURL();
}

/* ---------- helpers ---------- */

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
