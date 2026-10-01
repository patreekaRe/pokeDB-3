/* ============================================================
   biome-intro.js  -  arriving in a new biome (the user's call, 2026-10-01).

   A short film over the map as a biome starts, ~9 s, tap to skip: the
   camera drops through the clouds onto the biome, glides sideways across
   it in parallax while some of its wild Pokémon pop out of the tall grass
   (black silhouettes until the Pokédex has seen them), and comes to rest
   on the biome's goal far off on the horizon (the Clearing's Ancient
   Tree, where its boss waits) as the title lands. Inviting where the boss
   intros (bossArenaPrelude() in js/scene.js) are menacing: a journey, not
   one set piece.

   Two low-res canvases (one canvas pixel = 4 CSS px on phones, 5 wider,
   like js/scene.js) sandwich the Pokémon, real GIFs: `back` is the sky and
   the land, `front` the near grass that hides their feet. Every layer is
   painted once (seeded, so it's the same each time) and slid by the camera
   at its own speed. Lit for the time of day: hand-painted skies, the land
   graded with GRADES like every other scene.

   Every later place in a biome gets a short walk on towards the goal
   (placeIntro(), each `stages[i]` look nearer). Only the Clearing has
   one so far; INTROS gets an entry per biome.
   ============================================================ */

import { el } from './ui.js';
import { playSound, playCry, preloadCries, preloadSounds } from './audio.js';
import { timeOfDay, GRADES, gradeHex } from './daytime.js';
import { getSave } from './storage.js';
import { spriteFit } from './data/sprite-fit.js';

// the film's beats, in ms
const TILT = [0, 2600];        // down through the clouds
const PAN = [500, 7300];       // across the land to the goal
const POPS = [2500, 3500, 4500];   // a wild Pokémon pops out of the grass
const TITLE_AT = 4900;
const END = 8900;
const FADE = 650;

const SKIES = {
  day: { sky: ['#4890e8', '#5ca0ec', '#78b4f0', '#98c8f4', '#b8dcf8'], cloud: ['#ffffff', '#d8e8f8', '#b0c8e8'] },
  dawn: { sky: ['#34407a', '#6a5a9a', '#b070a0', '#e898a0', '#f8c8a0'], cloud: ['#fce0e0', '#e0a8c0', '#a87898'] },
  dusk: { sky: ['#282c68', '#5a3c80', '#a8507a', '#e8705e', '#f8a858'], cloud: ['#f8c090', '#d07878', '#8a4a68'] },
  night: { sky: ['#050a20', '#0a1430', '#122046', '#1c2e5a', '#283e6e'], cloud: ['#38486e', '#2a3858', '#1e2a44'] },
};

/* Each biome's film. `land` colours are painted by day and graded for the time; `glow` ones shine by themselves. */
const INTROS = {
  clearing: {
    title: ['WHISPERING', 'CLEARING'], ink: ['#fff4c0', '#2e6a2a', '#123018'],
    land: {
      far: ['#8aa8d0', '#9ab8dc', '#e8f0f8'],
      hill: ['#88c070', '#70a85c', '#5a9048'],
      bark: ['#7a6450', '#5a4838', '#3a2e24'],
      crown: ['#68a860', '#4e8c4c', '#38703c', '#2a5630'],
      forest: ['#4e9a48', '#3a8040', '#2a6434', '#1c4a28'],
      ground: ['#8ad064', '#7cc45a', '#6eb850', '#5aa244'],
      tall: ['#58b040', '#3a8a30', '#20501c'],
      water: ['#58a8f0', '#78bcf4', '#c8e8fc', '#3a78b8'],
      flowers: ['#f878a8', '#f8d030', '#ffffff', '#a878f8'],
      fore: ['#6ab84c', '#4e9a3c', '#357a2e', '#1e5020'],
      path: ['#e0c888', '#c8a868', '#8a7044'],
    },
    glow: { aura: ['#fffce0', '#f8f0a0', '#c8f080'], firefly: ['#f8ffb0', '#c8f060'], petal: ['#f8a8c8', '#fff0f8'] },
    // each later place's walk on (placeIntro()): the Tree looms bigger, the woods grow taller and darker round the path
    stages: [null, { tree: 1.2, spread: 1.05, mist: 0.2, forest: 1.7, shade: 0.15 }, { tree: 2.2, spread: 1.7, mist: 0.08, forest: 2.4, shade: 0.5, frame: true, shafts: true }],
  },
};

const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
const easeOut = (t) => 1 - (1 - t) ** 3;
const span = ([a, b], ms) => Math.max(0, Math.min(1, (ms - a) / (b - a)));

function prng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const dither = (x, y, t) => t * 16 > BAYER[(y & 3) * 4 + (x & 3)];

function layer(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

/** Fill a pixel disc (a crown, a puff of cloud). */
function disc(g, cx, cy, r, colour) {
  g.fillStyle = colour;
  for (let y = -r; y <= r; y++) {
    const half = Math.floor(Math.sqrt(r * r - y * y));
    g.fillRect(Math.round(cx - half), Math.round(cy + y), half * 2 + 1, 1);
  }
}

/** The sky, top to horizon, in dithered bands, with the sun or the moon and stars. */
function paintSky(g, W, H, hz, sky, time, rand) {
  const bands = sky.length - 1;
  for (let y = 0; y < H; y++) {
    const t = Math.min(1, y / hz) * bands, i = Math.min(bands - 1, Math.floor(t));
    for (let x = 0; x < W; x++) {
      g.fillStyle = dither(x, y, t - i) ? sky[i + 1] : sky[i];
      g.fillRect(x, y, 1, 1);
    }
  }
  if (time === 'night') {
    for (let n = 0; n < W * H / 70; n++) {
      g.fillStyle = rand() < 0.2 ? '#ffffff' : '#a8b8e0';
      g.fillRect(Math.floor(rand() * W), Math.floor(rand() * hz * 0.9), 1, 1);
    }
    disc(g, W * 0.78, hz * 0.2, 5, '#f8f4d8');
    disc(g, W * 0.78 + 2, hz * 0.2 - 1, 4, sky[0]);
  } else {
    const low = time !== 'day', sx = low ? W * 0.22 : W * 0.8, sy = low ? hz * 0.8 : hz * 0.16;
    disc(g, sx, sy, low ? 9 : 7, low ? '#f8b070' : '#fff8d0');
    disc(g, sx, sy, low ? 7 : 5, low ? '#fff0b0' : '#ffffff');
  }
}

/** A cumulus: overlapping puffs, lit on top, shaded underneath. */
function cloudImage(w, colours, rand) {
  const h = Math.ceil(w * 0.5), c = layer(w + 2, h + 2), g = c.getContext('2d');
  const puffs = [];
  for (let n = 0; n < 4 + w / 6; n++) {
    const x = 2 + rand() * (w - 4), r = 2 + rand() * Math.min(w * 0.22, h * 0.6);
    puffs.push([x, h - r * 0.7, r]);
  }
  for (const [x, y, r] of puffs) disc(g, x, y + 1, r, colours[2]);
  for (const [x, y, r] of puffs) disc(g, x, y, r, colours[1]);
  for (const [x, y, r] of puffs) disc(g, x - r * 0.2, y - r * 0.25, r * 0.75, colours[0]);
  return c;
}

/** The far mountains: two ranges, the further one paler, snow on the highest peaks. */
function paintFar(g, w, H, hz, [body, back, snow], rand) {
  const ridge = (amp, base, freq, phase) => (x) => hz - base - amp * (0.55 * Math.sin(x * freq + phase) + 0.3 * Math.sin(x * freq * 2.3 + phase * 2) + 0.15 * Math.sin(x * freq * 5.1));
  const r1 = ridge(H * 0.07, H * 0.08, 0.05, rand() * 6), r2 = ridge(H * 0.05, H * 0.04, 0.08, rand() * 6);
  for (let x = 0; x < w; x++) {
    const top = Math.round(r1(x));
    g.fillStyle = back; g.fillRect(x, top, 1, hz - top + 4);
    if (top < hz - H * 0.17) { g.fillStyle = snow; g.fillRect(x, top, 1, 2 + (x & 1)); }
  }
  for (let x = 0; x < w; x++) {
    const top = Math.round(r2(x));
    g.fillStyle = body; g.fillRect(x, top, 1, hz - top + 4);
  }
}

/** Mix two '#rrggbb' colours, `t` of the way from a to b. */
function mix(a, b, t) {
  const n = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [n(a), n(b)];
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
}

/** The goal on the horizon: the Ancient Tree, far off yet towering over everything, a vast spreading crown on a
    buttressed trunk with roots like ridges, softened by the haze of distance. Returns the crown's middle and size. */
function paintTree(g, cx, base, height, { bark, crown }, haze, rand, { mist = 0.28, spread = 1 } = {}) {
  const far = (list) => list.map(c => mix(c, haze, mist));
  const [b0, b1, b2] = far(bark), leaf = far(crown);
  const cw = height * 0.62 * spread, ch = height * 0.3, cy = base - height + ch;
  // the trunk, flaring into buttress roots at the foot
  const top = Math.round(cy), trunk = height * 0.07;
  for (let y = top; y <= base; y++) {
    const t = (y - top) / (base - top), half = Math.round(trunk + (t > 0.6 ? ((t - 0.6) / 0.4) ** 2 * height * 0.12 : 0));
    g.fillStyle = b1; g.fillRect(cx - half, y, half * 2 + 1, 1);
    g.fillStyle = b0; g.fillRect(cx - half, y, Math.max(1, Math.round(half * 0.45)), 1);
    g.fillStyle = b2; g.fillRect(cx + Math.round(half * 0.55), y, Math.max(1, Math.round(half * 0.45)), 1);
    if (t > 0.15 && (y * 7) % 11 < 2) { g.fillStyle = b2; g.fillRect(cx - Math.round(half * 0.2), y, 1, 2); }   // bark furrows
  }
  for (const side of [-1, 1]) {   // great boughs out to the crown's wings
    for (let k = 0; k < cw * 0.7; k++) {
      const x = cx + side * k, y = top + ch * 0.35 - k * 0.45 + (k / (cw * 0.7)) ** 2 * ch * 0.5;
      g.fillStyle = b1; g.fillRect(Math.round(x), Math.round(y), 1, Math.max(1, Math.round(trunk * 0.5 * (1 - k / (cw * 0.7)))) + 1);
    }
  }
  // the crown: tiers of leaf puffs in a wide dome, shade under, light on top
  const puffs = [];
  for (let n = 0; n < 34; n++) {
    const a = rand() * Math.PI, d = Math.sqrt(rand());
    const x = cx + Math.cos(a) * d * cw * (n < 8 ? 1.05 : 0.85), y = cy - Math.sin(a) * d * ch * 0.9 + ch * 0.15;
    puffs.push([x, y, height * (0.06 + rand() * 0.06)]);
  }
  puffs.sort((p, q) => q[1] - p[1]);
  for (const [x, y, r] of puffs) disc(g, x, y + 2, r, leaf[3]);
  for (const [x, y, r] of puffs) disc(g, x, y, r, leaf[2]);
  for (const [x, y, r] of puffs) disc(g, x - r * 0.2, y - r * 0.3, r * 0.75, leaf[1]);
  for (const [x, y, r] of puffs) if (y < cy) disc(g, x - r * 0.35, y - r * 0.5, r * 0.4, leaf[0]);
  for (let n = 0; n < cw / 2; n++) {   // vines hanging off the crown's underside
    const x = Math.round(cx - cw * 0.8 + rand() * cw * 1.6), y = Math.round(cy + ch * 0.25 + rand() * ch * 0.25), len = 2 + Math.floor(rand() * height * 0.08);
    if (Math.abs(x - cx) < trunk * 1.5) continue;
    g.fillStyle = leaf[3]; g.fillRect(x, y, 1, len);
    g.fillStyle = leaf[1]; g.fillRect(x, y + len, 1, 1);
  }
  return { x: cx, y: cy, w: cw, h: ch };
}

function paintHills(g, w, H, hz, colours, rand) {
  const phase = rand() * 6;
  for (let x = 0; x < w; x++) {
    const top = Math.round(hz - H * 0.025 - H * 0.03 * (0.6 * Math.sin(x * 0.045 + phase) + 0.4 * Math.sin(x * 0.11 + phase * 3)));
    g.fillStyle = colours[1]; g.fillRect(x, top, 1, hz - top + 6);
    g.fillStyle = colours[0]; g.fillRect(x, top, 1, 1);
  }
}

/** The tree line: a row of round crowns on trunks, lighter where the light catches them. */
function paintForest(g, w, H, hz, [lit, body, shade, dark], rand, grow = 1) {
  g.fillStyle = dark; g.fillRect(0, hz + 1, w, Math.ceil(H * 0.06 * grow));
  for (let x = -6; x < w + 6; x += 3 + Math.floor(rand() * 4)) {
    const r = 3 + Math.floor(rand() * (H * 0.022 * grow)), y = hz - r * 0.4 + rand() * 3;
    g.fillStyle = dark; g.fillRect(x, y, 1, r * 2);
    disc(g, x, y + 1, r, shade);
    disc(g, x, y, r - 1, body);
    disc(g, x - 1, y - 1, Math.max(1, r - 3), lit);
  }
}

/** The meadow: grass to the bottom, a stream winding down from the woods, flowers, and patches of the games' tall grass. */
function paintMeadow(g, w, H, top, { ground, water, flowers, tall }, rand, patches, withStream = true) {
  for (let y = top; y < H; y++) {
    const t = (y - top) / (H - top), i = Math.min(2, Math.floor(t * 3));
    for (let x = 0; x < w; x++) {
      g.fillStyle = dither(x, y, t * 3 - i) ? ground[i + 1] : ground[i];
      g.fillRect(x, y, 1, 1);
    }
  }
  for (let n = 0; n < w * (H - top) / 30; n++) {   // grass blades, bigger nearer
    const y = top + Math.floor(rand() ** 0.7 * (H - top)), x = Math.floor(rand() * w), near = (y - top) / (H - top);
    g.fillStyle = ground[3]; g.fillRect(x, y, 1, near > 0.5 ? 2 : 1);
  }
  // the stream: in from the trees, wider as it nears; returns where it can glint
  const sx = w * (0.25 + rand() * 0.2), phase = rand() * 6, stream = [];
  for (let y = top; withStream && y < H; y++) {
    const t = (y - top) / (H - top), cx = sx + Math.sin(t * 5 + phase) * w * 0.05 + t * w * 0.12, half = 1 + t * w * 0.025;
    g.fillStyle = water[3]; g.fillRect(Math.round(cx - half - 1), y, Math.round(half * 2 + 2), 1);
    g.fillStyle = water[0]; g.fillRect(Math.round(cx - half), y, Math.round(half * 2), 1);
    if (rand() < 0.35) { g.fillStyle = water[1]; g.fillRect(Math.round(cx - half + rand() * half * 1.5), y, 2, 1); }
    stream.push([cx, y, half]);
  }
  for (let n = 0; n < w / 7; n++) {   // flower patches
    const fx = rand() * w, fy = top + 4 + rand() * (H - top - 4), colour = flowers[Math.floor(rand() * flowers.length)];
    for (let k = 0; k < 5; k++) { g.fillStyle = colour; g.fillRect(Math.round(fx + (rand() - 0.5) * 8), Math.round(fy + (rand() - 0.5) * 4), 1, 1); }
  }
  for (const { x, y, size } of patches) tallGrass(g, x - size, y - 2, size * 2, size, tall);
  return stream;
}

/** The games' tall grass: rows of outlined little Ws. */
function tallGrass(g, x0, y0, w, h, [lit, body, dark]) {
  for (let y = y0; y < y0 + h; y += 3) {
    for (let x = x0 + ((y - y0) / 3 % 2) * 2; x < x0 + w; x += 4) {
      g.fillStyle = dark; g.fillRect(x, y, 4, 4);
      g.fillStyle = body; g.fillRect(x, y + 1, 1, 2); g.fillRect(x + 2, y + 1, 1, 2); g.fillRect(x + 1, y + 2, 1, 1);
      g.fillStyle = lit; g.fillRect(x, y, 1, 1); g.fillRect(x + 2, y, 1, 1);
    }
  }
}

/** The near grass along the bottom edge, passing faster than the land, with a few flowers on stalks. */
function paintFore(g, w, H, [lit, body, shade, dark], flowers, rand) {
  for (let x = 0; x < w; x++) {
    const h = Math.round(H * 0.05 + rand() * H * 0.05 + Math.sin(x * 0.2) * 2);
    const lean = rand() < 0.5 ? -1 : 1;
    for (let k = 0; k < h; k++) {
      g.fillStyle = k < 2 ? lit : k < h * 0.5 ? body : shade;
      g.fillRect(x + (k < h * 0.3 ? lean : 0), H - h + k, 1, 1);
    }
    g.fillStyle = dark; g.fillRect(x, H - 2, 1, 2);
    if (rand() < 0.05) {
      const fy = H - h - 2, colour = flowers[Math.floor(rand() * flowers.length)];
      g.fillStyle = shade; g.fillRect(x, fy + 2, 1, 2);
      g.fillStyle = colour; g.fillRect(x - 1, fy, 3, 1); g.fillRect(x, fy - 1, 1, 3);
      g.fillStyle = '#fff8a0'; g.fillRect(x, fy, 1, 1);
    }
  }
}

/** A dirt path from your feet to the goal's foot, narrowing into the distance. */
function paintPath(g, H, top, vx, [lit, body, edge], rand) {
  for (let y = top; y < H; y++) {
    const t = (y - top) / (H - top), cx = vx + Math.sin(t * 4) * t * 3, half = 0.5 + t * t * H * 0.16 + t * 2;
    g.fillStyle = edge; g.fillRect(Math.round(cx - half - 1), y, Math.round(half * 2 + 2), 1);
    g.fillStyle = body; g.fillRect(Math.round(cx - half), y, Math.round(half * 2), 1);
    if (rand() < 0.4) { g.fillStyle = lit; g.fillRect(Math.round(cx - half + rand() * half * 2), y, 1, 1); }
  }
}

/** The deep woods close in: great dark trunks either side and a fringe of leaves overhead, passed as you walk on. */
function paintFrame(g, w, H, bark, crown, rand) {
  const dark = (c, t) => mix(c, '#06100a', t);
  for (const side of [0, 1]) {
    const tw = Math.round(w * (0.17 + rand() * 0.05)), x0 = side ? w - tw : 0;
    for (let y = 0; y < H; y++) {
      const flare = y > H * 0.8 ? Math.round(((y - H * 0.8) / (H * 0.2)) ** 2 * tw * 0.8) : 0;
      const x = side ? x0 - flare : x0, wide = tw + flare;
      g.fillStyle = dark(bark[1], 0.45); g.fillRect(x, y, wide, 1);
      g.fillStyle = dark(bark[0], 0.35); g.fillRect(side ? x : x + wide - 2, y, 2, 1);
      if ((y * 5) % 9 < 2) { g.fillStyle = dark(bark[2], 0.55); g.fillRect(x + Math.round(wide * 0.4), y, 1, 2); }
    }
  }
  const puffs = [];
  for (let x = -4; x < w + 4; x += 3 + Math.floor(rand() * 4)) puffs.push([x, Math.round(rand() * H * 0.06), 5 + Math.floor(rand() * H * 0.05)]);
  for (const [x, y, r] of puffs) disc(g, x, y + 1, r, dark(crown[3], 0.4));
  for (const [x, y, r] of puffs) disc(g, x, y, r - 1, dark(crown[2], 0.3));
  for (let n = 0; n < w / 3; n++) {   // vines hanging into view
    const x = Math.floor(rand() * w), len = 3 + Math.floor(rand() * H * 0.1);
    g.fillStyle = dark(crown[3], 0.3); g.fillRect(x, 0, 1, len);
    g.fillStyle = dark(crown[1], 0.2); g.fillRect(x, len, 1, 1);
  }
}

function pickMons(biome, n) {
  const pool = [...biome.normals];
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return pool.slice(0, n);
}

/** Has the Pokédex met this Pokémon (fought it, beaten it, or counted it for research)? */
function known(save, id) {
  const dex = save.dex;
  return dex.seen.includes(id) || dex.defeated.includes(id) || (dex.count?.[id] || 0) > 0;
}

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Play a biome's intro over whatever is up (the map); resolves when it's over or skipped. A biome without one resolves at once. */
export function biomeIntro(biome, number) {
  const film = INTROS[biome.id];
  if (!film) return Promise.resolve();
  return new Promise(resolve => run(film, biome, { number, stage: 0 }, resolve));
}

/** Walking into the next place of a biome (stage 1 or 2): a short film of your Pokémon walking on towards the goal,
    which looms bigger each time, and the place's name. `walker` is your Pokémon's back sprite. */
export function placeIntro(biome, stage, walker) {
  const film = INTROS[biome.id];
  if (!film?.stages?.[stage]) return Promise.resolve();
  return new Promise(resolve => run(film, biome, { stage, walker }, resolve));
}

function run(film, biome, { number, stage, walker }, resolve) {
  const mini = stage > 0, look = film.stages?.[stage] || {};
  const time = timeOfDay(), g = GRADES[time];
  const dim = (k, c) => look.shade && ['ground', 'fore', 'forest', 'hill', 'tall', 'path'].includes(k) ? mix(c, '#0c2014', look.shade) : c;
  const land = Object.fromEntries(Object.entries(film.land).map(([k, v]) => [k, v.map(c => { c = dim(k, c); return g ? gradeHex(c, g.land) : c; })]));
  const { sky, cloud } = SKIES[time] || SKIES.day;
  const P = innerWidth <= 720 ? 4 : 5;
  const W = Math.ceil(innerWidth / P), H = Math.ceil(innerHeight / P);
  const tall = H > W, hz = Math.round(H * (tall ? 0.6 : 0.56));
  const rand = prng(biome.id.length * 7919 + W * 31 + H + stage * 101);
  // the full film drops through the clouds and pans across the land; a place's mini film walks straight on instead
  const beats = mini
    ? { TILT: [0, 1], PAN: [0, 1], POPS: [], TITLE_AT: 700, END: 5000 }
    : { TILT, PAN, POPS, TITLE_AT, END };
  const PAN_PX = mini ? 0 : Math.round(W * 1.5);
  const SPEED = { far: 0.1, hill: 0.35, forest: 0.6, meadow: 0.85, fore: 1.3 };
  const DOLLY = { far: 0.03, hill: 0.25, forest: 0.45, meadow: 0.75, fore: 1.2 };   // how much each layer grows as you walk on
  const wide = (k) => W + Math.ceil(PAN_PX * SPEED[k]) + 8;

  // ---- paint every layer once ----
  const skyC = layer(W, H);
  paintSky(skyC.getContext('2d'), W, H, hz, look.shade ? sky.map(c => mix(c, '#0c2014', look.shade * 0.6)) : sky, time, rand);   // the woods' shade dims the sky too
  const far = layer(wide('far'), H);
  paintFar(far.getContext('2d'), far.width, H, hz, land.far, rand);
  const hill = layer(wide('hill'), H);
  // upright, the goal ends in the middle under the title; wide, on the right with the title beside it (a place's film: straight ahead)
  const treeX = Math.round(W * (tall || mini ? 0.5 : 0.68) + PAN_PX * SPEED.hill);
  // each place nearer: taller upright; wide, where it already stands tall, its crown spreads instead (always kept on screen)
  const base = Math.round(Math.min(H * (tall ? 0.36 : 0.5), W * 0.75)), near = look.tree || 1;
  const treeH = mini ? Math.min(Math.round(base * (tall ? near : 1 + (near - 1) * 0.25)), hz - Math.round(H * 0.02)) : base;
  const reach = { mist: look.mist, spread: (look.spread || 1) * (tall ? 1 : near ** 0.6) };
  const crown = paintTree(hill.getContext('2d'), treeX, hz - Math.round(H * 0.03), treeH, land, sky[sky.length - 1], rand, reach);
  paintHills(hill.getContext('2d'), hill.width, H, hz, land.hill, rand);
  const forest = layer(wide('forest'), H);
  paintForest(forest.getContext('2d'), forest.width, H, hz, land.forest, rand, look.forest || 1);

  // where the Pokémon pop up: in view at their moment, nearer ones lower down
  const camAt = (ms) => Math.round(ease(span(beats.PAN, ms)) * PAN_PX);
  const meadowTop = hz + Math.round(H * 0.035);
  const spots = beats.POPS.map((ms, i) => {
    const sx = W * [0.3, 0.68, 0.42][i], depth = [0.45, 0.3, 0.7][i];
    const y = Math.round(meadowTop + (H - meadowTop) * depth);
    return { ms, x: Math.round(sx + camAt(ms + 700) * SPEED.meadow), y, size: Math.round(7 + depth * 12), scale: 0.6 + depth * 0.6 };
  });
  const meadow = layer(wide('meadow'), H);
  const stream = paintMeadow(meadow.getContext('2d'), meadow.width, H, meadowTop, land, rand, spots, !mini);
  if (mini) paintPath(meadow.getContext('2d'), H, meadowTop, treeX, land.path, rand);
  const fore = layer(wide('fore'), H);
  paintFore(fore.getContext('2d'), fore.width, H, land.fore, land.flowers, rand);
  if (look.frame) paintFrame(fore.getContext('2d'), W, H, land.bark, land.crown, rand);
  const tufts = spots.map(s => { const c = layer(s.size * 2 + 4, s.size + 2); tallGrass(c.getContext('2d'), 0, 0, s.size * 2 + 4, Math.ceil(s.size * 0.6), land.tall); return c; });

  // the sky's life
  const clouds = [];
  for (let n = 0; n < 7; n++) clouds.push({ img: cloudImage(Math.round(W * (0.25 + rand() * 0.3)), cloud, rand), x: rand() * W * 1.6 - W * 0.3, y: -H * 0.5 + rand() * H * 0.85, lift: 0.5, drift: 0.6 + rand() });
  if (!mini) for (let n = 0; n < 3; n++) clouds.push({ img: cloudImage(Math.round(W * (0.7 + rand() * 0.4)), cloud, rand), x: rand() * W - W * 0.3, y: -H * 1.25 + rand() * H * 0.5, lift: 1.7, drift: 2 });
  const motes = Array.from({ length: 24 }, () => ({ a: rand() * Math.PI * 2, r: rand(), speed: 0.3 + rand() * 0.6, phase: rand() }));
  const petals = Array.from({ length: 22 }, () => ({ x: rand(), y: rand(), speed: 0.6 + rand(), wob: rand() * 6, c: rand() < 0.6 ? 0 : 1 }));
  const flies = time === 'night' || time === 'dusk' || look.shafts ? Array.from({ length: 14 }, () => ({ x: rand(), y: rand(), phase: rand() * 6 })) : [];
  const shafts = look.shafts ? Array.from({ length: 3 }, (_, i) => ({ x: W * (0.12 + i * 0.3 + rand() * 0.1), w: 3 + rand() * 5, phase: rand() * 6 })) : [];
  const leafy = look.shafts ? [land.crown[0], land.crown[1]] : film.glow.petal;

  // ---- the page ----
  const box = el('div', `biome-intro${mini ? ' mini' : ''}`);
  box.setAttribute('role', 'dialog');
  const place = biome.stages[stage];
  box.setAttribute('aria-label', `${mini ? place : biome.name}. Tap to skip.`);
  const back = layer(W, H), front = layer(W, H);
  back.className = 'bi-canvas'; front.className = 'bi-canvas';
  for (const c of [back, front]) { c.style.width = `${W * P}px`; c.style.height = `${H * P}px`; }
  const mons = el('div', 'bi-mons');
  const save = getSave();
  const ids = pickMons(biome, beats.POPS.length);
  preloadCries(...ids);
  preloadSounds('biome-title', 'rustle');
  // every one pops up as a silhouette; the ones the Pokédex has met colour in a beat later, like "Who's that Pokémon?"
  const figures = ids.map((id, i) => {
    const wrap = el('div', 'bi-mon'), img = el('img', 'pixel unseen');
    img.alt = '';
    img.src = `assets/pokemon/${id}-front.gif`;
    const s = spots[i], scale = s.scale * (P / 4) * (tall ? 1.6 : 2);
    img.addEventListener('load', () => {
      const [, bottom] = spriteFit(img.src);
      img.style.width = `${img.naturalWidth * scale}px`;
      img.style.marginBottom = `${-bottom * scale}px`;
    });
    wrap.append(img);
    mons.append(wrap);
    return { wrap, img, spot: s, id, known: known(save, id), shown: false };
  });
  let hiker = null;
  if (mini && walker) {
    hiker = el('div', 'bi-walker');
    const img = el('img', 'pixel');
    img.alt = '';
    img.src = walker;
    hiker.append(img);
    mons.append(hiker);
    hiker.base = (P / 4) * (tall ? 1.7 : 2.1);
    img.addEventListener('load', () => { hiker.img = img; hiker.feet = spriteFit(img.src)[1]; });
  }
  const card = el('div', 'bi-title');
  const kicker = el('div', 'bi-kicker', mini ? biome.name : `Biome ${number}`);
  const name = el('div', 'bi-name');
  name.style.setProperty('--ink', film.ink[0]);
  name.style.setProperty('--edge', film.ink[1]);
  name.style.setProperty('--deep', film.ink[2]);
  let k = 0;
  for (const word of mini ? place.toUpperCase().split(' ') : film.title) {
    const line = el('div', 'bi-word');
    for (const ch of word) { const letter = el('span', 'bi-letter', ch); letter.style.setProperty('--i', String(k++)); line.append(letter); }
    name.append(line);
  }
  card.append(kicker, name);
  if (!mini) card.append(el('div', 'bi-place', place));   // only where you are: the places ahead are for the walk to show
  const skip = el('div', 'bi-skip', 'Tap to skip');
  box.append(back, mons, front, el('div', 'bi-bars'), card, skip);
  document.body.append(box);

  const bg = back.getContext('2d'), fg = front.getContext('2d');
  bg.imageSmoothingEnabled = false; fg.imageSmoothingEnabled = false;
  const still = reduced();
  const start = performance.now() - (still ? beats.END : 0);
  let raf = 0, done = false, titled = false, finishing = false, holdTimer = 0;

  // walking on: each layer grows about the goal's foot, nearer ones faster, so you close in on it
  const VX = treeX, VY = hz;
  const grow = (ms) => mini ? 0.32 * ease(Math.min(1, ms / beats.END)) : 0;
  const scaleOf = (z, key) => 1 + z * DOLLY[key];
  const at = (x, y, s) => [VX + (x - VX) * s, VY + (y - VY) * s];
  const put = (ctx, img, x, y, s) => {
    if (s === 1) return ctx.drawImage(img, x, y);
    const [dx, dy] = at(x, y, s);
    ctx.drawImage(img, Math.round(dx), Math.round(dy), Math.round(img.width * s), Math.round(img.height * s));
  };

  function frame(now) {
    const ms = Math.max(0, now - start);   // a frame's time can be from just before the film started
    const lift = mini ? 0 : Math.round((1 - easeOut(span(beats.TILT, ms))) * H * 1.05);
    const cam = camAt(ms), z = grow(ms);
    const tick = ms / 1000;

    bg.drawImage(skyC, 0, 0);
    for (const c of clouds) {
      const x = Math.round(((c.x - cam * 0.05 + tick * c.drift) % (W * 1.8) + W * 1.8) % (W * 1.8) - W * 0.4);
      if (c.lift < 1) bg.drawImage(c.img, x, Math.round(c.y + lift * c.lift));
    }
    if (!mini && ms < 3400) {   // a flock crossing as you come down
      const fx = -10 + (ms / 3400) * (W + 30), fy = H * 0.42 + lift * 0.3 - ms / 300;
      bg.fillStyle = '#20283a';
      for (let n = 0; n < 5; n++) {
        const bx = Math.round(fx - Math.abs(n - 2) * 4), by = Math.round(fy + Math.abs(n - 2) * 3), up = (Math.floor(ms / 140) + n) % 2;
        bg.fillRect(bx - 1, by - up, 1, 1); bg.fillRect(bx, by, 1, 1); bg.fillRect(bx + 1, by - up, 1, 1);
      }
    }
    put(bg, far, -Math.round(cam * SPEED.far), Math.round(lift * 0.7), scaleOf(z, 'far'));
    // the goal's light: a slow-breathing halo behind the crown, motes spiralling up round it
    const sh = scaleOf(z, 'hill');
    const [tx, ty] = at(crown.x - cam * SPEED.hill, crown.y + lift * 0.8, sh), cw = crown.w * sh, ch = crown.h * sh;
    const breath = 0.5 + 0.5 * Math.sin(tick * 1.6);
    for (const [k, r] of [[0.1, 1.5], [0.14, 1.2], [0.18, 0.95]]) {
      bg.globalAlpha = k * (0.7 + 0.5 * breath) * (time === 'night' ? 1.6 : 1);
      bg.fillStyle = film.glow.aura[1];
      bg.beginPath(); bg.ellipse(Math.round(tx), Math.round(ty), cw * r, ch * r * 1.3, 0, 0, Math.PI * 2); bg.fill();
    }
    bg.globalAlpha = 1;
    put(bg, hill, -Math.round(cam * SPEED.hill), Math.round(lift * 0.8), sh);
    for (const m of motes) {
      const t = (tick * m.speed * 0.25 + m.phase) % 1, a = m.a + tick * m.speed;
      const x = tx + Math.cos(a) * cw * (0.4 + m.r * 0.8), y = ty + ch - t * ch * 3;
      bg.fillStyle = film.glow.aura[(m.r * 3) | 0] || film.glow.aura[0];
      if (t < 0.92) bg.fillRect(Math.round(x), Math.round(y), 1, 1);
    }
    for (const s of shafts) {   // light falling through the canopy
      bg.globalAlpha = 0.1 + 0.05 * Math.sin(tick * 1.3 + s.phase);
      bg.fillStyle = film.glow.aura[0];
      bg.beginPath();
      bg.moveTo(s.x, 0); bg.lineTo(s.x + s.w, 0); bg.lineTo(s.x + s.w + H * 0.35, hz + 6); bg.lineTo(s.x + H * 0.35, hz + 6);
      bg.fill();
    }
    bg.globalAlpha = 1;
    put(bg, forest, -Math.round(cam * SPEED.forest), Math.round(lift * 0.9), scaleOf(z, 'forest'));
    const meadowX = -Math.round(cam * SPEED.meadow);
    put(bg, meadow, meadowX, lift, scaleOf(z, 'meadow'));
    bg.fillStyle = land.water[2];   // the stream glints
    for (let n = 0; n < 5 && stream.length; n++) {
      const [cx, y, half] = stream[(n * 41 + Math.floor(tick * 5) * 17) % stream.length];
      bg.fillRect(Math.round(cx + meadowX + ((n * 7) % 3 - 1) * half * 0.5), y + lift, 2, 1);
    }

    fg.clearRect(0, 0, W, H);
    for (const [i, f] of figures.entries()) {
      const s = f.spot, x = s.x + meadowX, y = s.y + lift;
      const rustle = ms > s.ms - 350 && ms < s.ms + 200 ? ((Math.floor(ms / 60) % 2) ? 1 : -1) : 0;
      fg.drawImage(tufts[i], Math.round(x - s.size - 2 + rustle), Math.round(y - 2));
      f.wrap.style.left = `${x * P}px`;
      f.wrap.style.top = `${(y + 1) * P}px`;
      if (!f.shown && ms >= s.ms) {
        f.shown = true;
        f.wrap.classList.add('up');
        if (f.known) setTimeout(() => f.img.classList.remove('unseen'), 750);
        if (!still) { playSound('rustle'); setTimeout(() => !done && playCry(f.id), 220); }
      }
    }
    if (hiker?.img) {   // your Pokémon, from behind, walking up the path ahead of you
      const p = Math.min(1, ms / beats.END), step = still ? 0 : Math.floor(ms / 230) % 2;
      const scale = hiker.base * (1 - 0.15 * p);
      hiker.img.style.width = `${hiker.img.naturalWidth * scale}px`;
      hiker.img.style.marginBottom = `${-hiker.feet * scale}px`;
      hiker.style.left = `${(VX + (step ? 0.5 : -0.5)) * P}px`;
      hiker.style.top = `${Math.round(H * (0.93 - 0.07 * p) - step) * P}px`;
    }
    if (mini || ms > 1800) {   // petals on the breeze (leaves in the deep woods)
      for (const p of petals) {
        const x = Math.round(((p.x * W * 1.3 + tick * p.speed * 18 - cam * 0.3) % (W * 1.3) + W * 1.3) % (W * 1.3) - W * 0.15);
        const y = Math.round(((p.y * H + tick * p.speed * 6 + Math.sin(tick * 2 + p.wob) * 4) % H + H) % H);
        fg.fillStyle = leafy[p.c];
        fg.fillRect(x, y, (Math.floor(tick * 4 + p.wob) % 2) + 1, 1);
      }
    }
    for (const f of flies) {
      const on = Math.sin(tick * 3 + f.phase) > 0.2;
      if (!on) continue;
      fg.fillStyle = film.glow.firefly[0];
      fg.fillRect(Math.round(f.x * W + Math.sin(tick + f.phase) * 4), Math.round(meadowTop - 6 + f.y * (H - meadowTop) * 0.8 + lift), 1, 1);
    }
    put(fg, fore, -Math.round(cam * SPEED.fore), Math.round(lift * 1.3), scaleOf(z, 'fore'));
    for (const c of clouds) {   // the big near clouds you fall through
      if (c.lift < 1) continue;
      const y = Math.round(c.y + lift * c.lift);
      if (y < -c.img.height || y > H) continue;
      fg.drawImage(c.img, Math.round(c.x - cam * 0.2 + tick * c.drift), y);
    }

    if (!titled && ms >= beats.TITLE_AT) {
      titled = true;
      card.classList.add('on');
      if (!still) setTimeout(() => !done && playSound('biome-title'), 250);
    }
    if (!still && ms >= beats.END) return finish();
    if (!still) raf = requestAnimationFrame(frame);
  }

  function finish() {
    if (finishing) return;
    finishing = true;
    cancelAnimationFrame(raf);
    clearTimeout(holdTimer);
    removeEventListener('keydown', onKey, true);
    box.classList.add('leaving');
    setTimeout(() => { done = true; box.remove(); resolve(); }, still ? 200 : FADE);
  }
  const onKey = (e) => {
    if (!['Enter', ' ', 'Escape'].includes(e.key)) return;
    e.preventDefault(); e.stopPropagation();
    finish();
  };
  box.addEventListener('pointerup', finish);
  addEventListener('keydown', onKey, true);

  if (still) {
    for (const f of figures) { f.shown = true; f.wrap.classList.add('up'); if (f.known) f.img.classList.remove('unseen'); }
    if (walker) hiker.querySelector('img').addEventListener('load', () => frame(start + beats.END));
    frame(start + beats.END);
    holdTimer = setTimeout(finish, 3500);
  } else raf = requestAnimationFrame(frame);
}
