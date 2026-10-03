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
   (placeIntro(), each `stages[i]` look nearer). INTROS has an entry per
   biome with its own `scene` painter and camera move: the Clearing drops
   through the clouds and pans; the Shrine cranes up its steps while the
   lanterns light one by one; the Wastes bursts out of an ash cloud and
   rushes low over the plains (a Mode 7 ground) to the smoking volcano.
   ============================================================ */

import { el } from './ui.js';
import { playSound, playCry, preloadCries, preloadSounds } from './audio.js';
import { timeOfDay, GRADES, gradeHex } from './daytime.js';
import { getSave } from './storage.js';
import { spriteFit } from './data/sprite-fit.js';
import { SAFARI_INTROS } from './safari-intro.js';
import { DEPTHS_INTRO } from './depths-intro.js';

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
    shaded: ['ground', 'fore', 'forest', 'hill', 'tall', 'path'], shadeTo: '#0c2014',
    beats: { TILT, PAN, POPS, TITLE_AT, END },
    scene: clearingScene,
  },
  shrine: {
    title: ['OVERGROWN', 'SHRINE'], ink: ['#fff0e0', '#b0301e', '#3a0c08'],
    // misty, like the Shrine's scenes in js/scene.js
    skies: {
      day: { sky: ['#8ab4c4', '#9cc0c8', '#acc8c8', '#bcd2cc', '#ccdccf', '#dce6d4'], cloud: ['#f8fcf8', '#dce8e0', '#b4c8bc'] },
      dawn: { sky: ['#6a6890', '#8a7ca0', '#a890a8', '#c8a2ac', '#dcb4b0', '#ecccbc'], cloud: ['#f8e0dc', '#dcb0b8', '#a88898'] },
      dusk: { sky: ['#241e44', '#342852', '#4c3462', '#6a426a', '#8a5470', '#a86a74'], cloud: ['#e8a088', '#b06878', '#6a4060'] },
      night: { sky: ['#06101a', '#0a1824', '#0e2030', '#14283a', '#1a3242', '#203a4a'], cloud: ['#2a3a48', '#1e2c38', '#142028'] },
    },
    land: {
      far: ['#8aaca4', '#a4c0b8', '#c4d8d0'],
      ridge: ['#7aa890', '#5e8e78', '#4a7a64'],
      hill: ['#4a7a48', '#3a6a40', '#2a5434'],
      cedar: ['#5a9a60', '#3a7048', '#24503a'],
      maple: ['#f8a048', '#e05830', '#a02c20'],
      trunk: ['#6a4a34', '#4a3424'],
      stone: ['#c8c8b8', '#a2a294', '#7a7a6e', '#50504a'],
      moss: ['#7aa858', '#4e7a3a'],
      torii: ['#e05038', '#a83020', '#5a1410'],
      lantern: ['#bcbcac', '#8a8a7c', '#565650'],
      wood: ['#c08858', '#8a5430', '#5c361c', '#2e1a0c'],
      roof: ['#88d0b0', '#4aa080', '#2e7458', '#123828'],
      plaster: ['#f4f0e4', '#d8d4c8', '#a8a498'],
      rope: ['#e8d8a0', '#b8a870', '#f8f4e8'],
      gravel: ['#d8d4c8', '#ccc8bc', '#bcb8ac', '#a8a498'],
      bush: ['#78c880', '#4e9a58', '#2e6e40', '#143820'],
      blossom: ['#f8a8c8', '#ffffff', '#f87898'],
      mist: ['#e8f0ec'],
    },
    glow: { aura: ['#fff8e0', '#f8e0a0', '#f0b860'], lamp: ['#fff0a0', '#f8b848', '#d87028'], wisp: ['#f0ffff', '#98e0f8', '#4898c8'], firefly: ['#f8e888', '#d8b848'] },
    // each later place's walk on: the Torii Path's tunnel of gates, then through the gateway into the Inner Court
    stages: [null, { hall: 1.5, tunnel: true }, { hall: 1.9, court: true }],
    beats: { RISE: [300, 6800], POPS: [3000, 4000, 5000], TITLE_AT: 5600, END: 9300 },
    sounds: ['furin-0', 'furin-1', 'furin-2', 'bell-far'],
    scene: shrineScene,
  },
  wastes: {
    title: ['EMBER', 'WASTES'], ink: ['#fff0c8', '#d04818', '#3a0c06'],
    // ashen, like the Wastes' scenes in js/scene.js
    skies: {
      day: { sky: ['#5a4448', '#74504c', '#8e5e50', '#a86e50', '#c08050', '#d49458', '#e0a868'], cloud: ['#c0aca2', '#9a8680', '#76645e'] },
      dawn: { sky: ['#2e2440', '#46304c', '#663c52', '#8a4c54', '#b06050', '#d07c50', '#e8a060'], cloud: ['#c8a0a0', '#a07c84', '#785c68'] },
      dusk: { sky: ['#2c1216', '#44181a', '#5e201e', '#7c2a20', '#9c3a22', '#bc5028', '#d46a30'], cloud: ['#b86a50', '#8a4a40', '#5a3030'] },
      night: { sky: ['#0c0606', '#160a0a', '#220e0c', '#30120e', '#421810', '#5a2012', '#742a14'], cloud: ['#4a3432', '#3a2826', '#2a1c1a'] },
    },
    land: {
      ash: ['#a49c94', '#988f88', '#8c847c', '#807870', '#746c64', '#686058'],
      basalt: ['#5e4e48', '#564842', '#4e423c', '#463a36', '#3e3430', '#362e2a'],
      rock: ['#d0c8bc', '#a89e94', '#766c64', '#3a322e'],
      dark: ['#6e6874', '#4c4852', '#34313a', '#18161c'],
      dead: ['#7a6a60', '#54463e', '#362c26', '#1a1412'],
      grass: ['#d8d078', '#a8a048', '#403c18'],
      volcano: ['#8a6a5c', '#6a5048', '#4a3632'],
      mountains: ['#6a4c48', '#56403c', '#463430', '#a89890'],
      smoke: ['#9a8a86', '#76686a', '#544848'],
      path: ['#c8bcac', '#b0a494', '#4a403a'],
    },
    glow: { lava: ['#fff0a0', '#f8b830', '#f06820', '#b03010'], ember: ['#fff0a0', '#f8a830', '#e85820'] },
    // each later place's walk on: the Lava Fields' pools and river, then up the Volcano Slope, the cone filling the sky
    stages: [null, { volcano: 1.45, cracks: 2.2, pools: 9, river: true, ground: 'basalt', haze: 0.22 }, { volcano: 2.05, cracks: 3, pools: 14, flows: true, ground: 'basalt', haze: 0.1, ash: 1.6 }],
    beats: { DOLLY: [0, 3600], POPS: [3700, 4500, 5300], HUFF: 5600, TITLE_AT: 5800, END: 9400 },
    sounds: ['gust', 'rumble-far'],
    scene: wastesScene,
  },
  depths: DEPTHS_INTRO,   // Mewtwo's Crystal Depths: down a crystal shaft into the cavern as its lights come on (js/depths-intro.js)
  ...SAFARI_INTROS,   // the Safari Zone's six areas, one painter with a camera move each (js/safari-intro.js)
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
  // puffs biggest in the middle and kept inside the canvas, so the cloud is a dome and never cut off square
  const most = Math.min(w * 0.22, h * 0.6);
  for (let n = 0; n < 4 + w / 6; n++) {
    const u = rand(), dome = Math.sin(Math.PI * (0.08 + u * 0.84));
    const r = Math.max(2, most * dome * (0.6 + rand() * 0.4));
    const x = Math.min(w - r - 1, Math.max(r + 1, 1 + u * w));
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
function paintTree(g, cx, base, height, { bark, crown }, haze, rand, { mist = 0.28, spread = 1 } = {}, glow) {
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
    if (t > 0.1 && rand() < 0.35) { g.fillStyle = leaf[2]; g.fillRect(cx - half + Math.floor(rand() * half * 2), y, 1, 1); }   // moss
  }
  // the boss arena's hollow, its heart glowing (the same tree, seen from afar)
  const hy = Math.round(top + (base - top) * 0.45), hx = cx - Math.round(trunk * 0.25), hr = Math.max(2, Math.round(trunk * 0.45));
  for (let y = -Math.round(hr * 1.5); y <= Math.round(hr * 1.5); y++) for (let x = -hr; x <= hr; x++) {
    const d = (x / hr) ** 2 + (y / (hr * 1.5)) ** 2;
    if (d > 1) continue;
    g.fillStyle = d > 0.6 ? b0 : d > 0.3 ? b2 : mix(b2, '#000000', 0.3);
    g.fillRect(hx + x, hy + y, 1, 1);
  }
  if (glow) { g.fillStyle = glow[1]; g.fillRect(hx - 1, hy - 1, 2, 3); g.fillStyle = glow[0]; g.fillRect(hx, hy, 1, 1); }
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
  return { x: cx, y: cy, w: cw, h: ch, foot: trunk + height * 0.12 };
}

/** Roots crawling out of the trunk's foot down over its knoll, like the boss arena's. */
function paintRoots(g, cx, ground, foot, { bark }, haze, rand, mist = 0.28) {
  const [b0, b1, b2] = bark.map(c => mix(c, haze, mist));
  for (const side of [-1, 1]) for (let r = 0; r < 2; r++) {
    let x = cx + side * foot * (0.55 + r * 0.25), y = ground(x) - 1;
    const len = Math.round(foot * (0.6 + r * 0.4) + 2);
    for (let n = 0; n < len; n++) {
      const thick = Math.max(0, Math.round((1 - n / len) * (2 - r)));
      x += side * (0.9 + rand() * 0.3);
      y = Math.max(y, ground(x) - thick) + 0.15;
      for (let t = -thick; t <= thick; t++) { g.fillStyle = t === -thick ? b0 : t === thick ? b2 : b1; g.fillRect(Math.round(x), Math.round(y + t), 1, 1); }
    }
  }
}

/** The rolling hills' top at any x, rising into a knoll where the Tree stands (`knoll`: its middle, half-width, height). */
function hillLine(H, hz, rand, knoll) {
  const phase = rand() * 6;
  return (x) => {
    const d = Math.abs(x - knoll.x) / knoll.w;
    const rise = d < 1 ? knoll.h * (0.5 + 0.5 * Math.cos(Math.PI * d)) : 0;
    return Math.round(hz - H * 0.025 - H * 0.03 * (0.6 * Math.sin(x * 0.045 + phase) + 0.4 * Math.sin(x * 0.11 + phase * 3)) - rise);
  };
}

function paintHills(g, w, hz, colours, ground) {
  for (let x = 0; x < w; x++) {
    const top = ground(x);
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

/** Where a Pokémon (or a clump `size` across each way) stands clear of a road or stream at that row, centred `cx`, `half`
    wide: out to the side it's already on, unless that leaves it off the view (`lo`..`hi`) and the other side doesn't.
    A `side` (-1 left, 1 right) mirrors it over to that side first, so a film's Pokémon don't all end up on one side. */
export function offTheWay(x, size, cx, half, lo, hi, side = 0) {
  const clear = half + size + 2;
  const fits = (v) => v >= lo + 2 && v <= hi - 2;   // a clump half past the edge still reads, and the camera brings it in
  if (side && Math.sign(x - cx) !== side) {
    const mirrored = cx + side * Math.max(clear, Math.abs(x - cx));
    if (fits(mirrored)) return Math.round(mirrored);
  }
  if (Math.abs(x - cx) >= clear) return x;
  const near = x < cx ? cx - clear : cx + clear, far = x < cx ? cx + clear : cx - clear;
  return Math.round(fits(near) || !fits(far) ? near : far);
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
  for (let n = 0; n < w * (H - top) / 30; n++) {   // grass blades, bigger nearer: a dot far off, a V of blades close up
    const y = top + Math.floor(rand() ** 0.7 * (H - top)), x = Math.floor(rand() * w), near = (y - top) / (H - top);
    g.fillStyle = ground[3];
    if (near < 0.3) { g.fillRect(x, y, 1, 1); continue; }
    const tall = near > 0.65 ? 3 : 2;
    g.fillRect(x, y - tall + 1, 1, tall);
    g.fillRect(x - 1, y - 1, 1, 1); g.fillRect(x + 1, y - 1, 1, 1);
    if (tall > 2) { g.fillRect(x - 2, y - 2, 1, 1); g.fillRect(x + 2, y - 2, 1, 1); }
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
  for (const p of withStream ? patches : []) {   // nobody hides in the water
    const [cx, , half] = stream[Math.min(stream.length - 1, Math.max(0, p.y - top))];
    p.x = offTheWay(p.x, p.size + 2, cx, half + 1, ...(p.view || [0, w]));
  }
  for (let n = 0; n < w / 7; n++) {   // flower patches
    const fx = rand() * w, fy = top + 4 + rand() * (H - top - 4), colour = flowers[Math.floor(rand() * flowers.length)];
    for (let k = 0; k < 5; k++) { g.fillStyle = colour; g.fillRect(Math.round(fx + (rand() - 0.5) * 8), Math.round(fy + (rand() - 0.5) * 4), 1, 1); }
  }
  for (const { x, y, size } of patches) tallGrass(g, x - size - 2, y - 2 - Math.round(size * 0.4), size * 2 + 4, Math.ceil(size * 0.6) + Math.round(size * 0.4), tall);   // rises behind the Pokémon, ending with the tuft in front
  return stream;
}

/** A clump of tall grass: leaning blades tapering to points, out of a low rounded mound, outlined round the whole silhouette. */
function tallGrass(g, x0, y0, w, h, [lit, body, dark]) {
  const hash = (n) => ((Math.sin(n * 127.1 + x0 * 3.7 + y0 * 1.3) * 43758.5) % 1 + 1) % 1;
  const px = [];   // [x, y, width, colour, height]: drawn twice, outlined first
  const round = (x) => Math.sqrt(Math.max(0, 1 - ((x + 0.5) / w * 2 - 1) ** 2));
  for (let x = 1; x < w - 1; x++) {   // a low mound the blades grow out of
    const band = Math.max(1, Math.round(h * 0.4 * round(x)));
    px.push([x, h - band, 1, body, band]);
  }
  for (let x = 1, n = 0; x < w - 1; x += 2, n++) {   // blades, tallest mid-patch, each leaning and tapering to a point
    const hb = Math.min(h - 1, Math.max(2, Math.round(h * (0.5 + 0.5 * hash(n)) * (0.45 + 0.55 * round(x)))));
    const lean = (hash(n + 50) - 0.5) * 1.6, colour = n % 2 ? lit : body;
    for (let k = 0; k < hb; k++) {
      const bx = Math.min(w - 3, Math.max(1, Math.round(x + lean * (1 - k / hb) ** 2 * hb * 0.5)));
      px.push([bx, h - hb + k, k > hb * 0.45 ? 2 : 1, k < hb * 0.5 ? colour : body, 1]);
    }
  }
  g.fillStyle = dark;
  for (const [x, y, wd, , ht] of px) g.fillRect(x0 + x - 1, y0 + y - 1, wd + 2, ht + 2);
  for (const [x, y, wd, colour, ht] of px) { g.fillStyle = colour; g.fillRect(x0 + x, y0 + y, wd, ht); }
}

/** The near grass along the bottom edge, passing faster than the land, with a few flowers on stalks. */
function paintFore(g, w, H, [lit, body, shade, dark], flowers, rand) {
  const low = Math.round(H * 0.035);
  for (let y = H - low; y < H; y++) { g.fillStyle = y > H - 3 ? dark : shade; g.fillRect(0, y, w, 1); }
  // blades: 2px at the root tapering to a 1px tip that bends over, darker ones behind, lit ones in front
  for (let pass = 0; pass < 2; pass++) {
    for (let x = -2; x < w + 2; x += 2) {
      const h = Math.round(H * 0.04 + rand() * H * 0.06 + Math.sin(x * 0.2) * 2) - pass * 2;
      const lean = (rand() - 0.5) * 0.9, [c1, c2] = pass ? [lit, body] : [body, shade];
      for (let k = 0; k < h; k++) {   // k from the tip down
        const bx = Math.round(x + lean * (1 - k / h) ** 2 * h * 0.5 + pass);
        g.fillStyle = k < h * 0.35 ? c1 : c2;
        g.fillRect(bx, H - h + k, k > h * 0.4 ? 2 : 1, 1);
      }
    }
  }
  for (let x = 0; x < w; x++) {
    const h = Math.round(H * 0.07);
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
function known(save, id, safari) {
  if (safari) return save.safariDex?.seen?.includes(id) || save.safariDex?.caught?.includes(id);
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

/* The film around any biome's scenery: the page, the title, the Pokémon popping up, your Pokémon walking on, skipping.
   The biome's `scene(env)` paints its layers once and returns { spots, walkX, monAt(i, ms), draw(bg, fg, ms, tick) }. */
function run(film, biome, { number, stage, walker }, resolve) {
  const mini = stage > 0, look = film.stages?.[stage] || {};
  const time = timeOfDay(), g = GRADES[time];
  const dim = (k, c) => look.shade && film.shaded?.includes(k) ? mix(c, film.shadeTo, look.shade) : c;
  const land = Object.fromEntries(Object.entries(film.land).map(([k, v]) => [k, v.map(c => { c = dim(k, c); return g ? gradeHex(c, g.land) : c; })]));
  const skies = film.skies || SKIES, { sky, cloud } = skies[time] || skies.day;
  const P = innerWidth <= 720 ? 4 : 5;
  const W = Math.ceil(innerWidth / P), H = Math.ceil(innerHeight / P);
  if (!W || !H) return resolve();   // no window to paint in yet
  const tall = H > W;
  const rand = prng(biome.id.length * 7919 + W * 31 + H + stage * 101);
  // the full film has the biome's own beats; a place's mini film walks straight on instead
  const beats = mini ? { POPS: [], TITLE_AT: 700, END: 5000 } : film.beats;
  const still = reduced();
  let done = false;
  const scene = film.scene({ film, look, stage, mini, time, land, sky, cloud, W, H, P, tall, rand, beats, live: () => !done && !still });
  const spots = scene.spots;

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
  preloadSounds('biome-title', 'rustle', ...(film.sounds || []));
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
    return { wrap, img, spot: s, id, known: known(save, id, film.safari), shown: false };
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
  // a Safari area: SAFARI ZONE over the area's name
  const kicker = el('div', 'bi-kicker', film.safari ? (mini ? `Safari Zone - ${biome.name}` : `Area ${number}`) : mini ? biome.name : `Biome ${number}`);
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
  if (film.safari && !mini) card.append(el('div', 'bi-area', biome.name));
  if (!mini) card.append(el('div', 'bi-place', place));   // only where you are: the places ahead are for the walk to show
  const skip = el('div', 'bi-skip', 'Tap to skip');
  box.append(back, mons, front, el('div', 'bi-bars'), card, skip);
  document.body.append(box);

  const bg = back.getContext('2d'), fg = front.getContext('2d');
  bg.imageSmoothingEnabled = false; fg.imageSmoothingEnabled = false;
  const start = performance.now() - (still ? beats.END : 0);
  let raf = 0, titled = false, finishing = false, holdTimer = 0;

  function frame(now) {
    const ms = Math.max(0, now - start);   // a frame's time can be from just before the film started
    scene.draw(bg, fg, ms, ms / 1000);
    for (const [i, f] of figures.entries()) {
      const [x, y] = scene.monAt(i, ms);
      f.wrap.style.left = `${x * P}px`;
      f.wrap.style.top = `${(y + 1) * P}px`;
      if (!f.shown && ms >= f.spot.ms) {
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
      hiker.style.left = `${(scene.walkX + (step ? 0.5 : -0.5)) * P}px`;
      hiker.style.top = `${Math.round(H * (0.93 - 0.07 * p) - step) * P}px`;
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

/* ----- the Whispering Clearing: down through the clouds, across the meadow, to the Ancient Tree ----- */
function clearingScene({ film, look, mini, time, land, sky, cloud, W, H, tall, rand, beats }) {
  const hz = Math.round(H * (tall ? 0.6 : 0.56));
  const TILT_ = beats.TILT || [0, 1], PAN_ = beats.PAN || [0, 1];
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
  // the Tree stands on a knoll, its foot just in the grass (it used to stop short of the hills, on the far mountains)
  const foot = treeH * 0.19, ground = hillLine(H, hz, rand, { x: treeX, w: foot * 2.6, h: Math.round(H * 0.035 + foot * 0.25) });
  const footY = ground(treeX) + 2, crownTop = hz - Math.round(H * 0.03) - treeH;
  const crown = paintTree(hill.getContext('2d'), treeX, footY, footY - crownTop, land, sky[sky.length - 1], rand, reach, film.glow.aura);
  paintHills(hill.getContext('2d'), hill.width, hz, land.hill, ground);
  paintRoots(hill.getContext('2d'), treeX, ground, crown.foot, land, sky[sky.length - 1], rand, reach.mist);
  const forest = layer(wide('forest'), H);
  paintForest(forest.getContext('2d'), forest.width, H, hz, land.forest, rand, look.forest || 1);

  // where the Pokémon pop up: in view at their moment, nearer ones lower down
  const camAt = (ms) => Math.round(ease(span(PAN_, ms)) * PAN_PX);
  const liftAt = (ms) => mini ? 0 : Math.round((1 - easeOut(span(TILT_, ms))) * H * 1.05);
  const meadowTop = hz + Math.round(H * 0.035);
  const spots = beats.POPS.map((ms, i) => {
    const sx = W * [0.3, 0.68, 0.42][i], depth = [0.45, 0.3, 0.7][i];
    const y = Math.round(meadowTop + (H - meadowTop) * depth);
    const off = camAt(ms + 700) * SPEED.meadow;
    return { ms, x: Math.round(sx + off), y, size: Math.round(7 + depth * 12), scale: 0.6 + depth * 0.6, view: [off, off + W] };
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

  function draw(bg, fg, ms, tick) {
    const lift = liftAt(ms), cam = camAt(ms), z = grow(ms);
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
    for (const [i, s] of spots.entries()) {   // the tall grass each Pokémon hides in, shaking just before it pops out
      const rustle = ms > s.ms - 350 && ms < s.ms + 200 ? ((Math.floor(ms / 60) % 2) ? 1 : -1) : 0;
      fg.drawImage(tufts[i], Math.round(s.x + meadowX - s.size - 2 + rustle), Math.round(s.y + lift - 2));
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
  }

  return { spots, walkX: VX, draw, monAt: (i, ms) => [spots[i].x - Math.round(camAt(ms) * SPEED.meadow), spots[i].y + liftAt(ms)] };
}

/* ----- the Overgrown Shrine: a crane shot up the mossy steps, through a tunnel of torii, to the Main Hall ----- */

/** A cedar: three tiers, each wider than the one above, lit on the left, on a short trunk. */
function cedar(g, cx, foot, h, [lit, body, dark], [bark, barkDark]) {
  const half = Math.max(1, Math.round(h * 0.3)), tierH = Math.max(3, Math.round(h * 0.36));
  let y = foot - h;
  for (let i = 0; i < 3; i++) {
    const widest = Math.max(1, Math.round(half * (0.45 + 0.275 * i)));
    for (let k = 0; k < tierH; k++) {
      const w = Math.round(k / (tierH - 1) * widest), row = y + k;
      g.fillStyle = k === tierH - 1 ? dark : body; g.fillRect(cx - w, row, w * 2 + 1, 1);
      if (k === tierH - 1) continue;
      g.fillStyle = lit; g.fillRect(cx - w, row, Math.max(1, Math.round(w * 0.6)), 1);
      g.fillStyle = dark; g.fillRect(cx + Math.round(w * 0.45), row, w - Math.round(w * 0.45) + 1, 1);
    }
    y += Math.round(tierH * 0.62);
  }
  const top = y + Math.round(tierH * 0.38), tw = Math.max(1, Math.round(h * 0.05));
  if (top >= foot) return;
  g.fillStyle = barkDark; g.fillRect(cx - (tw >> 1), top, tw, foot - top + 1);
  g.fillStyle = bark; g.fillRect(cx - (tw >> 1), top, 1, foot - top + 1);
}

/** An autumn maple: a round crown of red puffs on a thin trunk. */
function maple(g, cx, foot, h, [lit, body, dark], [, barkDark], jit) {
  const r = Math.max(2, Math.round(h * 0.3)), cy = foot - h + r;
  g.fillStyle = barkDark; g.fillRect(cx, cy, Math.max(1, Math.round(h * 0.06)), foot - cy + 1);
  const puffs = [[cx, cy, r], [cx - r * 0.7, cy + r * 0.35, r * 0.7], [cx + r * 0.7, cy + r * 0.3, r * 0.72], [cx + (jit - 0.5) * r * 0.6, cy - r * 0.45, r * 0.6]];
  for (const [x, y, s] of puffs) disc(g, x, y + 1, s, dark);
  for (const [x, y, s] of puffs) disc(g, x, y, s - 0.5, body);
  for (const [x, y, s] of puffs) disc(g, x - s * 0.25, y - s * 0.3, s * 0.5, lit);
}

/** A torii: two posts, the tie beam, and the top beam overhanging with its ends swept up. Everything scales with its
    half-width, so a huge near one can be wider than it is tall. */
function torii(g, cx, foot, size, [red, shade, deep], halfW = Math.round(size * 0.55)) {
  const post = Math.max(1, Math.round(halfW / 6)), beam = Math.max(1, Math.round(halfW / 11)), topY = foot - size;
  for (const side of [-1, 1]) {
    const x0 = cx + side * Math.round(halfW * 0.72) - (post >> 1), edge = Math.max(1, Math.round(post / 3)), cap = Math.max(1, Math.round(halfW * 0.06));
    g.fillStyle = red; g.fillRect(x0, topY + beam * 2, post, foot - topY - beam * 2 + 1);
    g.fillStyle = shade; g.fillRect(x0 + post - edge, topY + beam * 2, edge, foot - topY - beam * 2 + 1);
    g.fillStyle = deep; g.fillRect(x0 - (post > 2 ? 1 : 0), foot - cap + 1, post + (post > 2 ? 2 : 0), cap);   // the black foot caps
  }
  const over = Math.max(2, Math.round(halfW * 0.15)), sweep = Math.max(1, Math.round(halfW * 0.12));
  for (let x = -halfW - over; x <= halfW + over; x++) {
    const out = Math.max(0, Math.abs(x) - halfW * 0.6) / (halfW * 0.4 + over), lift = Math.round(out * out * sweep);
    g.fillStyle = deep; g.fillRect(cx + x, topY - lift, 1, beam);
    g.fillStyle = red; g.fillRect(cx + x, topY - lift + beam, 1, beam);
    g.fillStyle = shade; g.fillRect(cx + x, topY - lift + beam * 2, 1, Math.max(1, Math.round(beam * 0.6)));
  }
  const tie = topY + Math.max(4, Math.round(halfW * 0.45));
  g.fillStyle = red; g.fillRect(cx - halfW, tie, halfW * 2 + 1, beam);
  g.fillStyle = shade; g.fillRect(cx - halfW, tie + beam, halfW * 2 + 1, Math.max(1, Math.round(beam * 0.6)));
  if (halfW >= 8) {   // the plaque between the beams
    const pw = Math.max(1, Math.round(halfW * 0.09));
    g.fillStyle = deep; g.fillRect(cx - pw, topY + beam * 3, pw * 2 + 1, tie - topY - beam * 3);
  }
}

/** A stone lantern (tōrō): base, pillar, platform, firebox, wide roof. Returns the height of its light. */
function stoneLantern(g, cx, foot, size, [lit, body, dark]) {
  const h = size * 2, s = Math.max(1, Math.round(size / 4));
  for (let y = 0; y < h; y++) {
    const f = y / h, hw = Math.round((f < 0.14 ? 1.6 : f < 0.45 ? 0.8 : f < 0.55 ? 1.6 : f < 0.72 ? 1.2 : f < 0.86 ? 2.4 : 0.6) * s);
    g.fillStyle = body; g.fillRect(cx - hw, foot - y, hw * 2 + 1, 1);
    g.fillStyle = lit; g.fillRect(cx - hw, foot - y, 1, 1);
    if (hw) { g.fillStyle = dark; g.fillRect(cx + 1, foot - y, hw, 1); }
  }
  const fy = foot - Math.round(h * 0.63);
  g.fillStyle = dark; g.fillRect(cx - (s > 1 ? 1 : 0), fy, s > 1 ? 3 : 1, s > 1 ? 2 : 1);   // its window, lit later
  return fy;
}

/** The Main Hall, as the boss arena has it: a stone plinth, red pillars between dark bays, a green copper roof sweeping
    up at the ends, the straw rope with its paper zigzags. Returns its doorway, which glows. */
function paintHall(g, cx, foot, half, { stone, wood, torii: red, roof, rope }) {
  const px = (x, y, c) => { g.fillStyle = c; g.fillRect(x, y, 1, 1); };
  const base = Math.max(2, Math.round(half * 0.12)), tall = Math.max(4, Math.round(half * 0.4)), roofH = Math.max(4, Math.round(half * 0.5));
  const eave = foot - base - tall;
  for (let y = foot - base; y <= foot; y++) { g.fillStyle = y === foot - base ? stone[0] : y === foot ? stone[3] : stone[1]; g.fillRect(cx - half - 2, y, half * 2 + 5, 1); }
  const bay = Math.max(4, Math.round(half / 3));
  for (let y = eave; y < foot - base; y++) for (let x = -half; x <= half; x++) {
    const b = (x + half) % bay;
    px(cx + x, y, b === 0 ? red[0] : b === 1 ? red[2] : y - eave < 2 ? red[1] : (x + y) % 2 && y - eave > 3 ? wood[2] : wood[3]);
  }
  for (let k = 0; k < roofH; k++) {
    const w = Math.round(half * (1.28 - k / roofH * 0.62)), y = eave - 1 - k;
    for (let x = -w; x <= w; x++) {
      const lift = k < 2 && Math.abs(x) > w - 3 ? (Math.abs(x) - (w - 3)) * 0.6 : 0;
      px(cx + x, Math.round(y - lift), k === 0 ? roof[3] : k === roofH - 1 ? roof[0] : (x + k) % 3 ? roof[1] : roof[2]);
    }
  }
  const ridge = eave - roofH, rw = Math.round(half * 0.66), chigi = Math.max(3, Math.round(half * 0.14));
  g.fillStyle = roof[3]; g.fillRect(cx - rw, ridge, rw * 2 + 1, 1);
  for (const side of [-1, 1]) for (let k = 0; k < chigi; k++) { px(cx + side * (rw + k), ridge - k, wood[3]); px(cx + side * (rw + chigi - 1 - k), ridge - k, wood[3]); }
  // the doorway, and stone steps up to it
  const door = Math.max(1, Math.round(half * 0.18)), top = eave + 3;
  g.fillStyle = wood[1]; g.fillRect(cx - door, top, door * 2 + 1, foot - base - top);
  for (let k = 0; k < base + 2; k++) { g.fillStyle = k % 2 ? stone[2] : stone[0]; g.fillRect(cx - door - 1 - k, foot - base + k, (door + 1 + k) * 2 + 1, 1); }
  const sag = Math.max(1, Math.round(half * 0.08)), every = Math.max(4, Math.round(half / 4));
  for (let x = -half + 2; x <= half - 2; x++) {
    const y = eave + 2 + Math.round(Math.sin((x + half) / (half * 2) * Math.PI) * sag);
    px(cx + x, y, x % 2 ? rope[0] : rope[1]);
    if ((x + half) % every === 0) for (let k = 1; k <= sag + 1; k++) px(cx + x + (k % 2), y + k, rope[2]);
  }
  return { x: cx, y: Math.round((top + foot - base) / 2), w: door * 2 + 1, top, bottom: foot - base, half };
}

/** Mossy stone steps climbing away to the hall, narrowing into the distance: each a lit edge over its shaded face. */
function paintSteps(g, top, bottom, xAt, halfAt, [lit, body, dark, line], moss, rand) {
  for (let y = top; y < bottom;) {
    const t = (y - top) / (bottom - top), rise = Math.max(2, Math.round(1.5 + t * 6));
    for (let k = 0; k < rise && y + k < bottom; k++) {
      const yy = y + k, x0 = Math.round(xAt(yy) - halfAt(yy)), w = Math.round(halfAt(yy) * 2) + 1, kerb = Math.max(1, Math.round(t * 3));
      g.fillStyle = k === 0 ? lit : k === rise - 1 ? line : k === 1 ? body : dark;
      g.fillRect(x0, yy, w, 1);
      g.fillStyle = line; g.fillRect(x0 - kerb, yy, kerb, 1); g.fillRect(x0 + w, yy, kerb, 1);
      if (rand() < 0.3) { g.fillStyle = moss[rand() < 0.5 ? 0 : 1]; g.fillRect(rand() < 0.5 ? x0 + Math.floor(rand() * 3) : x0 + w - 2 - Math.floor(rand() * 3), yy, 1 + Math.floor(rand() * 2), 1); }
    }
    y += rise;
  }
}

/** The Inner Court: raked gravel, and a flagstone walk up the middle to the hall. */
function paintCourt(g, W, top, bottom, xAt, halfAt, { gravel: [gl, gb, , groove], stone }, rand) {
  for (let y = top; y < bottom; y++) {
    const t = (y - top) / (bottom - top), step = Math.max(2, Math.round(2 + t * 4));
    for (let x = 0; x < W; x++) {
      g.fillStyle = (y + Math.round(Math.sin(x / (6 + t * 10)) * (1 + t))) % step === 0 ? groove : dither(x, y, 0.3) ? gb : gl;
      g.fillRect(x, y, 1, 1);
    }
  }
  for (let y = top, row = 0; y < bottom; row++) {
    const t = (y - top) / (bottom - top), slab = Math.max(2, Math.round(1.5 + t * 7));
    for (let k = 0; k < slab && y + k < bottom; k++) {
      const yy = y + k, half = halfAt(yy) * 0.6, x0 = Math.round(xAt(yy) - half), w = Math.round(half * 2) + 1;
      g.fillStyle = k === 0 ? stone[0] : k === slab - 1 ? stone[3] : stone[1];
      g.fillRect(x0, yy, w, 1);
      g.fillStyle = stone[3]; g.fillRect(x0 + Math.round(w * (row % 2 ? 0.35 : 0.65)), yy, 1, 1);
      if (rand() < 0.15) { g.fillStyle = stone[2]; g.fillRect(x0 + Math.floor(rand() * w), yy, 1, 1); }
    }
    y += slab;
  }
}

/** A plaster wall with a tiled cap either side of the hall. */
function paintWall(g, W, foot, height, from, to, { plaster, roof, wood }) {
  for (const [a, b] of [[0, from], [to, W]]) for (let x = a; x < b; x++) for (let k = 0; k <= height; k++) {
    g.fillStyle = k === 0 ? roof[0] : k === 1 ? roof[1] : k === 2 ? roof[3] : k === height ? wood[3] : k === 3 ? plaster[2] : x % 12 === 0 ? plaster[1] : plaster[0];
    g.fillRect(x, foot - height + k, 1, 1);
  }
}

/** A round shrub to hide a Pokémon in: overlapping puffs, outlined, lit on top, a few blossoms. */
function bushImage(size, [lit, body, shade, dark], blossom, rand) {
  const w = size * 2 + 4, h = Math.ceil(size * 1.5) + 4, c = layer(w, h), g = c.getContext('2d');
  const puffs = [];
  for (let n = 0; n < 5; n++) {
    const u = n / 4, r = Math.max(2, size * (0.42 + Math.sin(Math.PI * u) * 0.25));
    puffs.push([Math.min(w - r - 2, Math.max(r + 1, 2 + u * (w - 4))), h - 2 - r * 0.8 - Math.sin(Math.PI * u) * size * 0.3, r]);
  }
  for (const [x, y, r] of puffs) disc(g, x, y, r + 1, dark);
  for (const [x, y, r] of puffs) disc(g, x, y + 1, r, shade);
  for (const [x, y, r] of puffs) disc(g, x, y, r - 1, body);
  for (const [x, y, r] of puffs) disc(g, x - r * 0.3, y - r * 0.35, Math.max(1, r * 0.5), lit);
  for (let n = 0; n < size; n++) {
    const [x, y, r] = puffs[Math.floor(rand() * puffs.length)];
    g.fillStyle = blossom[n % blossom.length];
    g.fillRect(Math.round(x + (rand() - 0.5) * r * 1.4), Math.round(y + (rand() - 0.6) * r), 1, 1);
  }
  return c;
}

function shrineScene({ film, look, mini, time, land, sky, cloud, W, H, tall, rand, beats, live }) {
  const RISE = beats.RISE || [0, 1];
  // the full film starts at the foot of the hill and cranes up it; a place's mini film stands at the top and walks on
  const RISE_PX = mini ? 0 : Math.round(H * 1.15);
  const SPEED = { far: 0.12, ridge: 0.4, slope: 1, near: 1.5 };
  const DOLLY = { far: 0.03, ridge: 0.15, slope: 0.7, near: 1.2 };
  const drop = (k) => Math.ceil(RISE_PX * SPEED[k]);
  const riseAt = (ms) => mini ? 1 : ease(span(RISE, ms));
  const offY = (k, ms) => -Math.round(drop(k) * (1 - riseAt(ms)));
  // upright, the hall ends in the middle under the title; wide, on the right with the title beside it
  const hallX = Math.round(W * (tall || mini ? 0.5 : 0.68)), Hy = Math.round(H * (tall ? 0.5 : 0.56));
  const hallHalf = Math.round(Math.min(W * 0.42, Math.min(W * 0.17, H * 0.16) * (look.hall || 1)));
  const lamp = time === 'night' ? film.glow.wisp : film.glow.lamp, dark = time === 'night' || time === 'dusk';
  const haze = (list, t) => list.map(c => mix(c, land.mist[0], t));

  // ---- the sky and the far ranges ----
  const skyC = layer(W, H);
  paintSky(skyC.getContext('2d'), W, H, Hy, sky, time, rand);
  const farC = layer(W, H + drop('far'));
  {
    const g = farC.getContext('2d'), fz = Hy - Math.round(H * 0.05);
    paintFar(g, W, H, fz, land.far, rand);
    g.fillStyle = land.far[0]; g.fillRect(0, fz + 4, W, farC.height);
  }
  const ridgeC = layer(W, H + drop('ridge'));
  {
    const g = ridgeC.getContext('2d'), [lit, body, shade] = land.ridge, ph = rand() * 6;
    const top = (x) => Math.round(Hy - H * 0.03 - H * 0.025 * (Math.sin(x * 0.07 + ph) * 0.6 + Math.sin(x * 0.17 + ph * 2) * 0.4));
    for (let x = 0; x < W; x++) { const y = top(x); g.fillStyle = body; g.fillRect(x, y, 1, ridgeC.height - y); }
    for (let x = 0; x < W; x += 2 + Math.floor(rand() * 3)) {   // a fringe of far cedars
      const y = top(x), h = 3 + Math.floor(rand() * 4);
      for (let k = 0; k < h; k++) { const w = k >> 1; g.fillStyle = shade; g.fillRect(x - w, y - h + k, w * 2 + 1, 1); g.fillStyle = lit; g.fillRect(x - w, y - h + k, 1, 1); }
    }
  }

  // ---- the hill: the hall on its summit, the steps, gates, lanterns and trees down its face ----
  const slopeC = layer(W, mini ? H : H + drop('slope')), sg = slopeC.getContext('2d'), slopeH = slopeC.height;
  const L = slopeH - Hy, tOf = (y) => Math.min(1, Math.max(0, (y - Hy) / L));
  const h0 = Math.max(1.5, hallHalf * 0.22);
  const pathHalf = (t) => h0 + (W * 0.3 - h0) * t ** 1.5;
  const pathX = (t) => hallX + (W * 0.5 - hallX) * t ** 0.7 + Math.sin(t * 6) * W * 0.08 * t * (1 - t);
  const room = (t) => 2 + t * W * 0.06;   // the verge beside the steps, where the lanterns stand
  const sumY = (x) => Hy + 1 + Math.round((Math.max(0, Math.abs(x - hallX) - hallHalf * 1.8) / (W * 0.5)) ** 1.4 * H * (tall ? 0.12 : 0.3));
  const [hLit, hBody, hDark] = land.hill;
  for (let x = 0; x < W; x++) {
    const top = sumY(x);
    sg.fillStyle = hBody; sg.fillRect(x, top, 1, slopeH - top);
    sg.fillStyle = hLit; sg.fillRect(x, top, 1, 1);
    sg.fillStyle = hDark;
    for (let y = top + 2; y < slopeH; y++) if (dither(x, y, 0.15 + tOf(y) * 0.3)) sg.fillRect(x, y, 1, 1);
  }
  // the old cedars behind the hall (in the court, all along the wall)
  const grove = look.court ? Math.ceil(W / (hallHalf * 0.45)) : 7;
  for (let k = 0; k < grove; k++) {
    const x = look.court ? Math.round((k + 0.5) * W / grove + (rand() - 0.5) * 4) : Math.round(hallX + (k - 3) * hallHalf * 0.62 + (rand() - 0.5) * hallHalf * 0.3);
    const h = Math.min(Math.round(Hy * 0.85), Math.round(hallHalf * (look.court ? 1.1 : 1.5) + rand() * hallHalf * 0.8 + H * 0.04));
    cedar(sg, x, Hy - 1 - Math.floor(rand() * 2), h, haze(land.cedar, 0.18), land.trunk);
  }
  // where the Pokémon pop up: out of shrubs beside the steps, in view at their moment
  const spots = beats.POPS.map((ms, i) => {
    const y = Math.round(H * [0.66, 0.56, 0.8][i] - offY('slope', ms + 700)), t = tOf(y), size = Math.round(5 + t * 12), side = [-1, 1, -1][i];
    const x = Math.round(Math.min(W - size - 3, Math.max(size + 3, pathX(t) + side * (pathHalf(t) + room(t) * 0.6 + size))));
    return { ms, x, y, size, scale: 0.6 + t * 0.6 };
  });
  const bushes = spots.map(s => bushImage(s.size, land.bush, land.blossom, rand));
  const ops = [], lights = [];   // everything standing on the hill, drawn far to near
  // gates and trees nearer than the shrubs are drawn again over them (`cover`), so a Pokémon peeks out behind them
  const stand = (y, draw, cover) => ops.push({ y, draw, cover });
  let door = null;
  stand(Hy, () => { door = paintHall(sg, hallX, Hy, hallHalf, land); });
  const lanternPair = (t, out = 0) => {
    const y = Math.round(Hy + t * L), size = Math.max(2, Math.round(1.5 + t * W * 0.045)), off = pathHalf(t) + 1 + size * 0.6 + out;
    for (const side of [-1, 1]) {
      const x = Math.round(pathX(t) + side * off), fy = y - Math.round(size * 2 * 0.63);
      lights.push({ x, y: fy, size, t, side });
      stand(y, () => stoneLantern(sg, x, y, size, haze(land.lantern, (1 - t) * 0.3)));
    }
  };
  if (look.court) {
    const wall = Math.max(5, Math.round(hallHalf * 0.22));
    paintWall(sg, W, Hy, wall, hallX - hallHalf - 2, hallX + hallHalf + 3, land);
    paintCourt(sg, W, Hy + 1, slopeH, (y) => pathX(tOf(y)), (y) => pathHalf(tOf(y)), land, rand);
    for (const t of [0.15, 0.4, 0.75]) lanternPair(t, W * 0.04);
  } else {
    paintSteps(sg, Hy + 2, slopeH, (y) => pathX(tOf(y)), (y) => pathHalf(tOf(y)), land.stone, land.moss, rand);
    const gates = look.tunnel ? [0.04, 0.09, 0.15, 0.22, 0.3, 0.39, 0.5, 0.63, 0.78] : [0.07, 0.15, 0.26, 0.4, 0.58, 0.8];
    for (const t of gates) {
      const y = Math.round(Hy + t * L), size = Math.round((pathHalf(t) + 1.5) / 0.4);
      stand(y, (g) => torii(g, Math.round(pathX(t)), y, size, haze(land.torii, (1 - t) * 0.35)), true);
    }
    for (const t of look.tunnel ? [0.06, 0.18, 0.34, 0.56, 0.86] : [0.03, 0.11, 0.2, 0.33, 0.48, 0.68, 0.9]) lanternPair(t);
    for (let y = Hy - 1; y < slopeH + 6;) {   // cedars and autumn maples down the hillside, clear of the steps and the hall
      const t = tOf(y), h = Math.round(4 + t * H * 0.2 + rand() * (2 + t * 5)), gap = Math.max(2, h * 0.42);
      for (let x = -4 + rand() * gap; x < W + 4; x += gap * (0.7 + rand() * 0.8)) {
        const rx = Math.round(x), hh = h + Math.floor(rand() * 3), m = rand() < 0.06 + t * 0.12, jit = rand(), mist = (1 - t) * 0.35;
        if (Math.abs(rx - pathX(t)) < pathHalf(t) + room(t) + hh * 0.3) continue;
        if (y < sumY(rx) + 1) continue;
        if (Math.abs(rx - hallX) < hallHalf * 1.3 + hh * 0.3 && y - hh < Hy) continue;
        stand(y, m ? (g) => maple(g, rx, y, hh, haze(land.maple, mist), land.trunk, jit) : (g) => cedar(g, rx, y, hh, haze(land.cedar, mist), haze(land.trunk, mist)), true);
      }
      y += Math.max(1, Math.round(1 + t * 6));
    }
  }
  ops.sort((a, b) => a.y - b.y);
  for (const o of ops) o.draw(sg);
  const coverFrom = Math.min(...spots.map(s => s.y + 1)), coverC = spots.length ? layer(W, slopeH) : null;
  for (const o of ops) if (coverC && o.cover && o.y > coverFrom) o.draw(coverC.getContext('2d'));
  // the lanterns light in pairs, nearest first, then each pair as it comes into view up the hill
  const pairs = [...new Set(lights.map(l => l.t))].sort((a, b) => b - a);
  for (const l of lights) l.rank = pairs.indexOf(l.t);

  // ---- the near layer: old trunks at the edges, maple boughs overhead, shrubs ----
  const nearC = layer(W, mini ? H : H + drop('near')), ng = nearC.getContext('2d'), Ln = nearC.height;
  const bark = land.trunk.map(c => mix(c, '#000000', 0.35)), tw = Math.max(3, Math.round(W * 0.05));
  for (const side of [0, 1]) {
    const x0 = side ? W - tw : 0;
    ng.fillStyle = bark[1]; ng.fillRect(x0, 0, tw, Ln);
    ng.fillStyle = bark[0]; ng.fillRect(side ? x0 : x0 + tw - 1, 0, 1, Ln);
    for (let y = 0; y < Ln; y += 3 + Math.floor(rand() * 5)) { ng.fillStyle = mix(bark[1], '#000000', 0.3); ng.fillRect(x0 + 1 + Math.floor(rand() * (tw - 2)), y, 1, 2 + Math.floor(rand() * 3)); }
  }
  for (const side of [-1, 1]) {   // maple boughs reaching in from the top corners
    const len = W * (tall ? 0.36 : 0.22), y0 = H * (side < 0 ? 0.03 : 0.08), clumps = [];
    for (let k = 0; k <= len; k++) {
      const x = side < 0 ? k : W - 1 - k, y = y0 + (k / len) ** 2 * H * 0.08 + Math.sin(k * 0.3) * 1.2;
      ng.fillStyle = bark[1]; ng.fillRect(Math.round(x), Math.round(y), 1, k < len * 0.5 ? 2 : 1);
      if (k % 4 === 2) clumps.push([x, y + 1, 2 + rand() * (2 + (1 - k / len) * 3)]);
    }
    for (const [x, y, r] of clumps) disc(ng, x, y + 1, r, land.maple[2]);
    for (const [x, y, r] of clumps) disc(ng, x, y, r - 0.5, land.maple[1]);
    for (const [x, y, r] of clumps) disc(ng, x - r * 0.3, y - r * 0.3, r * 0.45, land.maple[0]);
  }
  for (let x = -4; x < W + 4; x += 4 + Math.floor(rand() * 6)) {   // shrubs along the bottom, either side of the steps
    if (Math.abs(x - W * 0.5) < W * 0.34) continue;
    const r = H * 0.035 + rand() * H * 0.03, cy = Ln - r * 0.5;
    disc(ng, x, cy, r + 1, land.bush[3]); disc(ng, x, cy, r, land.bush[1]); disc(ng, x - r * 0.3, cy - r * 0.35, r * 0.5, land.bush[0]);
    if (rand() < 0.6) { ng.fillStyle = land.blossom[Math.floor(rand() * land.blossom.length)]; ng.fillRect(Math.round(x + (rand() - 0.5) * r), Math.round(cy - r * 0.5), 1, 1); }
  }

  // ---- the air's life ----
  const clouds = Array.from({ length: 5 }, () => ({ img: cloudImage(Math.round(W * (0.2 + rand() * 0.25)), cloud, rand), x: rand() * W * 1.6 - W * 0.3, y: H * 0.04 + rand() * Hy * 0.5, drift: 0.5 + rand() * 0.8 }));
  const bands = [0.04, 0.3, 0.62, 1.0].map((k, i) => ({ y: Hy + H * k, ry: H * (0.018 + i * 0.01), speed: 3 + i * 3, phase: rand() * W }));
  const wisps = Array.from({ length: time === 'night' ? 9 : 5 }, () => ({ a: rand() * 6.28, r: 0.9 + rand() * 0.9, speed: 0.4 + rand() * 0.5, bob: rand() * 6 }));
  const leaves = Array.from({ length: 18 }, () => ({ x: rand(), y: rand(), speed: 0.5 + rand(), wob: rand() * 6, c: Math.floor(rand() * 3) }));
  const flies = dark ? Array.from({ length: 12 }, () => ({ x: rand(), y: rand(), phase: rand() * 6 })) : [];
  const mistAlpha = time === 'dawn' ? 0.3 : time === 'night' ? 0.1 : 0.2;
  let belled = false;

  // walking on: each layer grows about the hall's foot, nearer ones faster
  const VX = hallX, VY = Hy;
  const put = (ctx, img, y, key, z) => {
    const s = 1 + z * DOLLY[key];
    if (s === 1) return ctx.drawImage(img, 0, y);
    ctx.drawImage(img, Math.round(VX - VX * s), Math.round(VY + (y - VY) * s), Math.round(img.width * s), Math.round(img.height * s));
  };

  function draw(bg, fg, ms, tick) {
    const z = mini ? 0.32 * ease(Math.min(1, ms / beats.END)) : 0, ss = 1 + z * DOLLY.slope, oy = offY('slope', ms);
    const at = (x, y) => [VX + (x - VX) * ss, VY + (y + oy - VY) * ss];
    bg.drawImage(skyC, 0, 0);
    for (const c of clouds) {
      const x = Math.round(((c.x + tick * c.drift) % (W * 1.8) + W * 1.8) % (W * 1.8) - W * 0.4);
      bg.drawImage(c.img, x, Math.round(c.y + offY('far', ms) * 0.5));
    }
    put(bg, farC, offY('far', ms), 'far', z);
    put(bg, ridgeC, offY('ridge', ms), 'ridge', z);
    put(bg, slopeC, oy, 'slope', z);

    // the hall's doorway glows, breathing, and fox-fires drift round it
    const breath = 0.5 + 0.5 * Math.sin(tick * 1.4);
    const [dx, dy] = at(door.x, door.y);
    for (const [k, r] of [[0.08, 2.4], [0.12, 1.6], [0.18, 1]]) {
      bg.globalAlpha = k * (0.7 + 0.5 * breath) * (dark ? 1.7 : 1);
      bg.fillStyle = film.glow.aura[1];
      bg.beginPath(); bg.ellipse(Math.round(dx), Math.round(dy), door.half * 0.55 * r * ss, door.half * 0.4 * r * ss, 0, 0, Math.PI * 2); bg.fill();
    }
    bg.globalAlpha = 0.65 + 0.3 * breath;
    const [x0, y0] = at(door.x - (door.w >> 1), door.top);
    bg.fillStyle = film.glow.aura[0];
    bg.fillRect(Math.round(x0), Math.round(y0), Math.max(1, Math.round(door.w * ss)), Math.max(1, Math.round((door.bottom - door.top) * ss)));
    bg.globalAlpha = 1;

    for (const l of lights) {   // the lanterns, lit by the spirits as you climb
      const [x, y] = at(l.x, l.y);
      if (!l.lit && y > H * 0.08 && y < H && ms >= 300 + l.rank * 140) {
        l.lit = true;
        if (l.side < 0 && live()) playSound(`furin-${l.rank % 3}`);
      }
      if (!l.lit) continue;
      const flicker = 0.85 + 0.15 * Math.sin(tick * 9 + l.x);
      bg.globalAlpha = (dark ? 0.35 : 0.2) * flicker;
      bg.fillStyle = lamp[1];
      bg.beginPath(); bg.ellipse(Math.round(x), Math.round(y), l.size * 1.6 * ss, l.size * 1.3 * ss, 0, 0, Math.PI * 2); bg.fill();
      bg.globalAlpha = 1;
      bg.fillStyle = lamp[0];
      bg.fillRect(Math.round(x) - (l.size > 5 ? 1 : 0), Math.round(y), l.size > 5 ? 3 : 1, l.size > 5 ? 2 : 1);
    }

    bg.fillStyle = land.mist[0];   // banks of mist drifting across the hill
    for (const b of bands) {
      const [, y] = at(0, b.y);
      if (y < -b.ry * 2 || y > H + b.ry * 2) continue;
      bg.globalAlpha = mistAlpha;
      for (let n = 0; n < 4; n++) {
        const x = ((b.phase + n * W * 0.42 + tick * b.speed) % (W * 1.68)) - W * 0.34;
        bg.beginPath(); bg.ellipse(Math.round(x), Math.round(y + Math.sin(n * 2.1) * 2), W * 0.28, b.ry * ss, 0, 0, Math.PI * 2); bg.fill();
      }
    }
    bg.globalAlpha = 1;

    for (const w of wisps) {
      const a = w.a + tick * w.speed;
      const spot = (a2) => at(door.x + Math.cos(a2) * door.half * w.r * 1.2, door.y - door.half * 0.3 + Math.sin(a2) * door.half * 0.25 * w.r - Math.sin(tick * 1.3 + w.bob) * door.half * 0.3);
      const [x, y] = spot(a), [px, py] = spot(a - 0.2);
      bg.fillStyle = film.glow.wisp[2]; bg.fillRect(Math.round(px), Math.round(py), 1, 1);
      bg.fillStyle = film.glow.wisp[1]; bg.fillRect(Math.round(x), Math.round(y), 2, 2);
      bg.fillStyle = film.glow.wisp[0]; bg.fillRect(Math.round(x), Math.round(y), 1, 1);
    }

    fg.clearRect(0, 0, W, H);
    for (const [i, s] of spots.entries()) {   // the shrubs the Pokémon hide in, shaking just before one pops out
      const rustle = ms > s.ms - 350 && ms < s.ms + 200 ? ((Math.floor(ms / 60) % 2) ? 1 : -1) : 0, img = bushes[i];
      fg.drawImage(img, Math.round(s.x - img.width / 2 + rustle), Math.round(s.y + oy + s.size * 0.6 - img.height));
    }
    if (coverC) fg.drawImage(coverC, 0, oy);
    for (const p of leaves) {   // maple leaves tumbling down
      const x = Math.round(((p.x * W * 1.3 + tick * p.speed * 7 + Math.sin(tick * 1.5 + p.wob) * 5) % (W * 1.3) + W * 1.3) % (W * 1.3) - W * 0.15);
      const y = Math.round(((p.y * H + tick * p.speed * 14) % H + H) % H);
      fg.fillStyle = land.maple[p.c];
      const flip = Math.floor(tick * 5 + p.wob) % 3;
      fg.fillRect(x, y, flip ? 2 : 1, flip === 1 ? 1 : 2);
    }
    for (const f of flies) {
      if (Math.sin(tick * 3 + f.phase) < 0.2) continue;
      fg.fillStyle = film.glow.firefly[0];
      fg.fillRect(Math.round(f.x * W + Math.sin(tick + f.phase) * 4), Math.round(H * (0.45 + f.y * 0.5) + Math.cos(tick * 0.7 + f.phase) * 3), 1, 1);
    }
    put(fg, nearC, offY('near', ms), 'near', z);

    if (!mini && !belled && ms >= RISE[1] - 900) {   // the hall comes into view: its bell tolls, far off
      belled = true;
      if (live()) playSound('bell-far');
    }
  }

  return { spots, walkX: W * 0.5, draw, monAt: (i, ms) => [spots[i].x, spots[i].y + offY('slope', ms)] };
}

/* ----- the Ember Wastes: out of an ash cloud, rushing low over the plains, to the smoking volcano ----- */

/** A rock: a few lumps, lit on the top left, its foot flat on the ground. */
function rockImage(w, [lit, body, shade, dark], rand, h = Math.max(2, Math.ceil(w * 0.7))) {
  const c = layer(w + 2, h + 1), g = c.getContext('2d'), lumps = [];
  for (let n = 0; n < 2 + Math.floor(w / 5); n++) {
    const r = Math.max(1, w * (0.25 + rand() * 0.15)), x = Math.min(w - r, Math.max(r, rand() * w)) + 1;
    lumps.push([x, h - r * (0.55 + rand() * 0.3), Math.min(r, h * 0.62)]);
  }
  for (const [x, y, r] of lumps) disc(g, x, y, r + 1, dark);
  for (const [x, y, r] of lumps) disc(g, x, y, r, shade);
  for (const [x, y, r] of lumps) disc(g, x - r * 0.15, y - r * 0.2, r * 0.75, body);
  for (const [x, y, r] of lumps) disc(g, x - r * 0.4, y - r * 0.45, Math.max(0.5, r * 0.35), lit);
  return c;
}

/** A dead tree: a bare trunk forking into crooked branches. */
function deadTreeImage(h, [lit, body, dark], rand) {
  const w = Math.ceil(h * 0.9), c = layer(w, h + 1), g = c.getContext('2d'), cx = Math.round(w / 2) - 1;
  const branch = (x, y, len, dir, width) => {
    for (let k = 0; k < len; k++) {
      x += dir * (0.3 + rand() * 0.5); y -= 0.8 + rand() * 0.3;
      for (let i = 0; i < width; i++) { g.fillStyle = i ? dark : lit; g.fillRect(Math.round(x + i), Math.round(y), 1, 1); }
      if (width > 1 && k > 1 && rand() < 0.22) branch(x, y, Math.round(len * 0.55), rand() < 0.5 ? -1 : 1, width - 1);
    }
  };
  const trunk = Math.max(2, Math.round(h * 0.08));
  for (let y = h; y > h * 0.55; y--) for (let i = 0; i < trunk; i++) { g.fillStyle = i ? (i === trunk - 1 ? dark : body) : lit; g.fillRect(cx + i, y, 1, 1); }
  branch(cx, h * 0.55, Math.round(h * 0.5), -1, Math.max(1, trunk - 1));
  branch(cx + 1, h * 0.6, Math.round(h * 0.45), 1, Math.max(1, trunk - 1));
  return c;
}

/** Basalt columns: hexagonal pillars packed together, their flat tops lit, heights stepping. */
function columnsImage(h, [lit, body, shade, line], rand) {
  const count = 2 + Math.floor(rand() * 3), cw = Math.max(2, Math.round(h * 0.22)), c = layer(count * cw + 1, h + 1), g = c.getContext('2d');
  for (let n = 0; n < count; n++) {
    const ch = Math.round(h * (0.45 + 0.55 * rand())), x = n * cw;
    for (let y = h - ch; y <= h; y++) for (let k = 0; k < cw; k++) {
      g.fillStyle = y === h - ch ? lit : k === 0 ? line : k === cw - 1 ? shade : y === h - ch + 1 ? shade : body;
      g.fillRect(x + k, y, 1, 1);
    }
  }
  return c;
}

/** A steam vent: a low cone of rock with a glowing mouth (the steam is drawn live). */
function ventImage(w, [lit, body, shade, dark], glow) {
  const h = Math.max(2, Math.round(w * 0.4)), c = layer(w + 2, h + 1), g = c.getContext('2d');
  for (let y = 0; y <= h; y++) {
    const half = Math.round(1 + (w / 2 - 1) * (y / h));
    g.fillStyle = dark; g.fillRect(w / 2 - half, y, half * 2 + 2, 1);
    g.fillStyle = y < h * 0.5 ? body : shade; g.fillRect(w / 2 - half + 1, y, half * 2, 1);
    g.fillStyle = lit; g.fillRect(w / 2 - half + 1, y, 1, 1);
  }
  g.fillStyle = glow[1]; g.fillRect(Math.round(w / 2) - 1, 0, 3, 1);
  g.fillStyle = glow[0]; g.fillRect(Math.round(w / 2), 0, 1, 1);
  return c;
}

/** The volcano on the horizon: a broad cone lit on the left, gullied, its crater's lip glowing and lava running down. */
function volcanoImage(half, vh, [lit, body, shade], lava, flows, reach) {
  const crater = Math.max(2, Math.round(half * 0.13)), c = layer(half * 2 + 3, vh + 2), g = c.getContext('2d'), cx = half + 1;
  const halfAt = (y) => crater + (half - crater) * (y / vh) ** 1.4;
  for (let y = 0; y <= vh; y++) {
    const hw = Math.round(halfAt(y));
    for (let x = -hw; x <= hw; x++) {
      const u = x / Math.max(1, hw), gully = y > 2 && (((Math.round(x * 0.9 + y * 0.35) % 7) + 7) % 7) === 0;
      g.fillStyle = u < -0.7 || (u < -0.35 && dither(x, y, 0.4)) ? lit : u > 0.25 && (u > 0.55 || dither(x, y, 0.55)) ? shade : gully ? shade : body;
      g.fillRect(cx + x, y + 1, 1, 1);
    }
  }
  for (const side of [0.2, -0.5, 0.62].slice(0, flows)) {
    for (let y = 1; y < vh * reach; y++) {
      const x = cx + Math.round(side * halfAt(y) + Math.sin(y / 3 + side * 9));
      g.fillStyle = lava[3]; g.fillRect(x + 1, y + 1, 1, 1);
      g.fillStyle = y < vh * reach * 0.7 ? lava[2] : lava[3]; g.fillRect(x, y + 1, 1, 1);
    }
  }
  g.fillStyle = lava[2]; g.fillRect(cx - crater, 0, crater * 2 + 1, 2);
  g.fillStyle = lava[1]; g.fillRect(cx - crater + 1, 0, crater * 2 - 1, 1);
  return { img: c, cx, crater };
}

/** The ground's texture, 256 texels square and tiling: ash or basalt in soft patches, pebbles, cracks glowing with lava,
    and further in pools of lava and a river of it. Codes: 0-5 the ground's tones, 6 a dark rim, 7 a pebble, 10-13 lava. */
function wastesTexture(look, rand) {
  const T = 256, tex = new Uint8Array(T * T);
  const noise = (cell) => {
    const n = T / cell, v = Float32Array.from({ length: n * n }, () => rand());
    return (u, w) => {
      const gx = u / cell, gy = w / cell, x0 = Math.floor(gx), y0 = Math.floor(gy), fx = gx - x0, fy = gy - y0;
      const at = (x, y) => v[((y % n + n) % n) * n + ((x % n + n) % n)], sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
      return (at(x0, y0) * (1 - sx) + at(x0 + 1, y0) * sx) * (1 - sy) + (at(x0, y0 + 1) * (1 - sx) + at(x0 + 1, y0 + 1) * sx) * sy;
    };
  };
  const big = noise(32), small = noise(8);
  for (let w = 0; w < T; w++) for (let u = 0; u < T; u++) {
    const t = Math.min(4.99, Math.max(0, (big(u, w) * 0.65 + small(u, w) * 0.35) * 7 - 1)), i = Math.floor(t);
    tex[w * T + u] = Math.min(5, dither(u, w, t - i) ? i + 1 : i);
  }
  const set = (u, w, code) => { tex[((w & 255) * T) + (u & 255)] = code; };
  const get = (u, w) => tex[((w & 255) * T) + (u & 255)];
  for (let n = 0; n < 200; n++) { const u = Math.floor(rand() * T), w = Math.floor(rand() * T); set(u, w, 7); set(u, w - 1, 6); }
  const rim = (u, w) => { if (get(u, w) < 10) set(u, w, 6); };
  for (let n = 0; n < Math.round(40 * (look.cracks || 1)); n++) {   // cracks: random walks with lava deep inside
    let u = Math.floor(rand() * T), w = Math.floor(rand() * T);
    const dir = rand() < 0.5 ? -1 : 1, len = 10 + Math.floor(rand() * 30);
    for (let k = 0; k < len; k++) {
      u += rand() < 0.75 ? dir : 0;
      if (rand() < 0.35) w += rand() < 0.5 ? -1 : 1;
      set(u, w, 11 + ((k >> 2) & 1));
      rim(u, w - 1); rim(u, w + 1);
    }
  }
  for (let n = 0; n < (look.pools || 0); n++) {   // pools of lava, brightest in the middle
    const cu = Math.floor(rand() * T), cw = Math.floor(rand() * T), rx = 3 + rand() * 6, ry = rx * (0.6 + rand() * 0.5);
    for (let y = -Math.ceil(ry) - 1; y <= ry + 1; y++) for (let x = -Math.ceil(rx) - 1; x <= rx + 1; x++) {
      const d = (x / rx) ** 2 + (y / ry) ** 2;
      if (d <= 1) set(cu + x, cw + y, d < 0.25 ? 10 : d < 0.6 ? 11 : 12);
      else if (d <= 1.5) rim(cu + x, cw + y);
    }
  }
  const stream = (at, wide) => {   // a river of lava winding towards you
    for (let w = 0; w < T; w++) {
      const cx = at + Math.sin(w * Math.PI * 2 / 128) * 9 + Math.sin(w * Math.PI * 2 / 64) * 3;
      for (let x = -wide - 1; x <= wide + 1; x++) {
        const d = Math.abs(x) / wide;
        if (d > 1) rim(Math.round(cx + x), w);
        else set(Math.round(cx + x), w, d < 0.35 ? 10 : d < 0.75 ? 11 : 12);
      }
    }
  };
  if (look.river) stream(70, 3.5);
  if (look.flows) { stream(40, 1.5); stream(196, 2); }
  return tex;
}

function wastesScene({ film, look, mini, time, land, sky, cloud, W, H, tall, rand, beats, live }) {
  const hz = Math.round(H * (tall ? 0.58 : 0.55)), ROWS = H - hz - 1;
  const D0 = 10, F = 2 * D0, REF = 8, FOGD = 110;   // the bottom row is D0 texels off, 2 px a texel there
  const DOLLY = beats.DOLLY || [0, 1], RUN = mini ? 26 : 340;
  const camZ = (ms) => mini ? RUN * ease(Math.min(1, ms / beats.END)) : RUN * (1 - (1 - span(DOLLY, ms)) ** 2);
  // the full film swoops down out of the ash cloud: the camera starts high and drops to just over the ground
  const K = (ms) => D0 * ROWS * (mini ? 1 : 1 + 1.3 * (1 - easeOut(span([0, DOLLY[1] * 0.8], ms))));
  const VX = Math.round(W * (tall || mini ? 0.5 : 0.68));
  const haze = sky[sky.length - 1], night = time === 'night', dark = night || time === 'dusk';
  const ground = look.ground === 'basalt' ? land.basalt : land.ash, rocks = look.ground === 'basalt' ? land.dark : land.rock;
  const huffAt = (mini ? 2600 : beats.HUFF) / 1000;

  // ---- the sky, the far ranges, the volcano ----
  const skyC = layer(W, H);
  paintSky(skyC.getContext('2d'), W, H, hz, sky, time, rand);
  const farC = layer(W, H);
  {
    const [m0, m1, , ash] = land.mountains;
    paintFar(farC.getContext('2d'), W, H, hz + 1, [mix(m1, haze, 0.45), mix(m0, haze, 0.62), mix(ash, haze, 0.4)], rand);
  }
  const clouds = Array.from({ length: 5 }, () => ({ img: cloudImage(Math.round(W * (0.25 + rand() * 0.3)), cloud, rand), x: rand() * W * 1.6 - W * 0.3, y: H * 0.02 + rand() * hz * 0.45, drift: 0.4 + rand() * 0.6 }));
  const big = look.volcano || 1, grows = mini ? 1.12 : 1;
  const vh0 = Math.min(hz * 0.92, Math.round(hz * (tall ? 0.4 : 0.46) * big * grows));
  const vhalf0 = Math.min(Math.round(W * (tall ? 0.6 : 0.4) * Math.min(big, 1.6)), Math.round(vh0 * 1.5));
  const mist = look.haze ?? 0.35;
  const volc = volcanoImage(vhalf0, vh0, land.volcano.map(c => mix(c, haze, mist)), film.glow.lava, mini ? 1 + (look.flows ? 2 : 1) : 1, look.flows ? 0.85 : 0.45);
  // drawn at `vs` of its painted size: far off at first, it looms as you rush in (and on each walk on)
  const volScale = (ms) => mini ? (1 + (grows - 1) * ease(Math.min(1, ms / beats.END))) / grows : 0.72 + 0.28 * (camZ(ms) / RUN);

  // ---- the ground: a Mode 7 plane, sampled every frame ----
  const tex = wastesTexture(look, rand);
  const packed = (hex) => { const n = parseInt(hex.slice(1), 16); return (255 << 24 | (n & 255) << 16 | (n >> 8 & 255) << 8 | n >> 16) >>> 0; };
  const base = [...ground, rocks[3], rocks[0], land.path[1], land.path[0], land.path[2]];
  const pal = Array.from({ length: 8 }, (_, l) => base.map(c => packed(mix(c, haze, l / 8 * 0.95))));
  const glowPal = Array.from({ length: 8 }, (_, l) => film.glow.lava.map(c => packed(mix(c, haze, l / 8 * 0.5))));
  const groundC = layer(W, ROWS), gctx = groundC.getContext('2d'), groundImg = gctx.createImageData(W, ROWS);
  const out = new Uint32Array(groundImg.data.buffer);
  const PATH = 5;
  function paintGround(cz, k, tick) {
    for (let r = 1; r <= ROWS; r++) {
      const d = k / r, vz = cz + d, fog = (1 - Math.exp(-d / FOGD)) * 8, v = (Math.floor(vz) & 255) * 256, row = (r - 1) * W, step = d / F;
      let wx = (0 - VX) * step;
      for (let x = 0; x < W; x++, wx += step) {
        const u = Math.floor(wx), l = Math.max(0, Math.min(7, Math.floor(fog + BAYER[(r & 3) * 4 + (x & 3)] / 16 - 0.5)));
        if (mini && wx > -PATH && wx < PATH) {   // the trodden path you walk on up
          out[row + x] = pal[l][Math.abs(wx) > PATH - 0.8 ? 10 : ((u + Math.floor(vz * 0.5)) & 3) ? 8 : 9];
          continue;
        }
        const code = tex[v + (u & 255)];
        if (code >= 10) out[row + x] = glowPal[l][Math.max(0, code - 10 - (Math.sin(tick * 2.6 + u * 0.7 + vz * 0.45) > 0.55 ? 1 : 0))];
        else out[row + x] = pal[l][code];
      }
    }
    gctx.putImageData(groundImg, 0, 0);
  }

  // ---- what stands on the plain: rocks, dead trees, dry grass, basalt columns, steam vents ----
  const fogged = (paint) => { const seed = Math.floor(rand() * 1e9); return [0, 0.3, 0.55, 0.8].map(t => paint(t, prng(seed))); };
  const tone = (list, t) => list.map(c => mix(c, haze, t));
  const ppt = F / REF;   // px a texel, as painted
  const kinds = {
    rock: () => fogged((t, r) => rockImage(Math.round((3.5 + r() * 5) * ppt), tone(rocks, t), r)),
    tree: () => fogged((t, r) => deadTreeImage(Math.round((12 + r() * 10) * ppt), tone(land.dead, t).slice(0, 3), r)),
    grass: () => fogged((t, r) => { const w = Math.round((3.5 + r() * 3) * ppt), c = layer(w + 2, Math.ceil(w * 0.7) + 2); tallGrass(c.getContext('2d'), 1, 1, w, Math.ceil(w * 0.6), tone(land.grass, t)); return c; }),
    columns: () => fogged((t, r) => columnsImage(Math.round((8 + r() * 9) * ppt), tone(land.dark, t), r)),
    vent: () => fogged((t) => ventImage(Math.round(5 * ppt), tone(rocks, t), film.glow.lava)),
  };
  const mixOf = look.ground === 'basalt' ? { rock: 5, columns: 3, vent: 3, tree: 1 } : { rock: 5, tree: 3, grass: 4, vent: 1 };
  const library = Object.fromEntries(Object.keys(mixOf).map(k => [k, Array.from({ length: 6 }, kinds[k])]));
  const picks = Object.entries(mixOf).flatMap(([k, n]) => Array(n).fill(k));

  // where the Pokémon pop up: from behind rocks ahead of where the camera comes to rest, nearer ones lower down
  const zEnd = camZ(beats.END);
  const spots = beats.POPS.map((ms, i) => {
    const depth = [0.45, 0.3, 0.7][i], x = Math.round(W * [0.3, 0.68, 0.42][i]), dz = D0 / depth;
    return { ms, x, y: Math.round(hz + ROWS * depth), size: Math.round(7 + depth * 12), scale: 0.6 + depth * 0.6, wx: (x - VX) * dz / F, wz: zEnd + dz, dz };
  });
  const spotRocks = spots.map(s => rockImage(s.size * 2 + 4, rocks, rand, Math.round(s.size * 0.7)));
  const things = [];
  const lateral = W * 0.9;
  for (let z = 4; z < zEnd + 320; z += 0.35 + rand() * (2.2 * 100 / W)) {
    const x = (rand() * 2 - 1) * lateral * Math.min(1, 0.25 + z / 200), kind = picks[Math.floor(rand() * picks.length)];
    if (mini && Math.abs(x) < PATH + 4) continue;
    if (spots.some(s => Math.abs(x - s.wx) < 8 && Math.abs(z - s.wz) < 10)) continue;
    // in front of where the Pokémon pop up, only at the edges, so none hides them
    if (!mini && z > zEnd && z < zEnd + 30 && Math.abs(x) * F / (z - zEnd) < W * 0.42) continue;
    things.push({ x, z, kind, look: library[kind][Math.floor(rand() * 6)], phase: rand() * 6 });
  }

  // ---- the air: ash and embers flying at you as you rush in, then drifting down; sparks off the cracks ----
  const camH = D0 * ROWS / F;
  const motes = Array.from({ length: Math.round(70 * (look.ash || 1)) }, () => ({ x: 0, y: 0, z: -1, ember: rand() < 0.3 }));
  const spawn = (m, cz, first) => {
    m.z = cz + (first ? 4 : 30) + rand() * 150;
    const dz = m.z - cz;
    m.x = (rand() * 2 - 1) * (W * 0.6) * dz / F;
    m.y = rand() * camH * 1.4;
  };
  let lastMs = -1, lastCz = 0, lastK = K(0), gusted = false, rumbled = false;
  const nearAsh = mini ? [] : Array.from({ length: 5 }, (_, i) => ({ img: cloudImage(Math.round(W * (0.9 + rand() * 0.5)), cloud, rand), x: W * (i / 4) - W * 0.5, y: H * (0.1 + rand() * 0.6) - H * 0.2, dir: i < 2 ? -1 : i > 2 ? 1 : (rand() < 0.5 ? -1 : 1) }));

  const project = (wx, wz, cz, k) => { const dz = wz - cz; return [VX + wx * F / dz, hz + k / dz, dz]; };

  function draw(bg, fg, ms, tick) {
    const cz = camZ(ms), k = K(ms), dt = lastMs < 0 ? 0 : Math.min(0.1, (ms - lastMs) / 1000);
    if (!gusted && !mini) { gusted = true; if (live()) playSound('gust'); }
    if (!rumbled && tick >= huffAt - 0.25) { rumbled = true; if (live()) playSound('rumble-far'); }
    const huff = tick - huffAt, shake = huff > 0 && huff < 0.5 ? (Math.floor(ms / 50) % 2) : 0;

    bg.drawImage(skyC, 0, 0);
    for (const c of clouds) {
      const x = Math.round(((c.x + tick * c.drift) % (W * 1.8) + W * 1.8) % (W * 1.8) - W * 0.4);
      bg.drawImage(c.img, x, Math.round(c.y));
    }
    bg.drawImage(farC, 0, shake);

    // the volcano, its crater breathing light and a plume of smoke leaning on the wind
    const vs = volScale(ms), vw = volc.img.width * vs, vhh = volc.img.height * vs;
    const vx = Math.round(VX - volc.cx * vs), vy = Math.round(hz + 2 - vhh) + shake, cx = VX, cy = vy + Math.max(1, Math.round(vs));
    const breath = 0.5 + 0.5 * Math.sin(tick * 1.5) + (huff > 0 && huff < 1.2 ? (1 - huff / 1.2) * 1.5 : 0);
    for (const [a, r] of [[0.1, 3], [0.16, 1.8], [0.24, 1.1]]) {
      bg.globalAlpha = a * (0.6 + 0.4 * breath) * (dark ? 1.6 : 1);
      bg.fillStyle = film.glow.ember[1];
      bg.beginPath(); bg.ellipse(cx, cy, Math.max(2, volc.crater * vs * r * 1.6), Math.max(1.5, volc.crater * vs * r * 0.8), 0, 0, Math.PI * 2); bg.fill();
    }
    bg.globalAlpha = 1;
    bg.drawImage(volc.img, vx, vy, Math.round(vw), Math.round(vhh));
    const PERIOD = 0.32, LIFE = 5.5, unit = Math.max(6, vh0 * vs);
    const hash = (n) => ((Math.sin(n * 12.9898) * 43758.5453) % 1 + 1) % 1;
    for (let n = Math.floor((tick - LIFE) / PERIOD); n <= Math.floor(tick / PERIOD); n++) {
      const born = n * PERIOD, age = tick - born;
      if (age < 0 || age > LIFE) continue;
      const boost = born >= huffAt && born < huffAt + 0.8 ? 1.9 : 1;
      const x = cx + (hash(n) - 0.5) * volc.crater * vs + age ** 1.4 * unit * 0.09 + Math.sin(age + n) * 1.5;
      const y = cy - age * unit * 0.17 * boost - 1;
      const r = Math.max(1, (volc.crater * vs * 0.6 + age * unit * 0.05) * (boost > 1 ? 1.5 : 1));
      bg.globalAlpha = Math.min(1, age * 3) * (1 - age / LIFE) * 0.8;
      disc(bg, x + 1, y + 1, r, land.smoke[2]);
      disc(bg, x, y, r, age < 0.6 && dark ? mix(land.smoke[1], film.glow.lava[2], 0.5) : land.smoke[1]);
      disc(bg, x - r * 0.3, y - r * 0.3, r * 0.5, land.smoke[0]);
    }
    bg.globalAlpha = 1;
    if (huff > 0 && huff < 1.8) {   // the volcano huffs: a spray of sparks out of the crater
      for (let n = 0; n < 22; n++) {
        const ang = (hash(n + 7) - 0.5) * 1.3, v = (0.5 + hash(n + 31)) * unit * 1.1, a = huff;
        const x = cx + Math.sin(ang) * v * a, y = cy - Math.cos(ang) * v * a + 0.5 * unit * 1.5 * a * a;
        if (a > 0.9 + hash(n) * 0.9) continue;
        bg.fillStyle = film.glow.ember[n % 3];
        bg.fillRect(Math.round(x), Math.round(y), 1, 1);
      }
    }

    paintGround(cz, k, tick);
    bg.drawImage(groundC, 0, hz + 1 + shake);

    // the plain's rocks and trees, far to near; the ones nearer than a Pokémon's rock go in front of it
    const front = spots.length ? Math.min(...spots.map(s => s.wz - cz)) : 0;
    const seen = [];
    for (const t of things) {
      const dz = t.z - cz;
      if (dz < 5 || dz > 420) continue;
      const s = REF / dz, img = t.look[0];
      if (img.height * s < 1.5) continue;
      const [sx, sy] = project(t.x, t.z, cz, k);
      if (sx < -img.width * s || sx > W + img.width * s) continue;
      seen.push({ t, dz, s, sx, sy });
    }
    seen.sort((a, b) => b.dz - a.dz);
    fg.clearRect(0, 0, W, H);
    const fogIdx = (dz) => Math.min(3, Math.floor((1 - Math.exp(-dz / FOGD)) * 4.6));
    for (const { t, dz, s, sx, sy } of seen) {
      const img = t.look[fogIdx(dz)], ctx = dz < front ? fg : bg, w = Math.max(1, Math.round(img.width * s)), h = Math.max(1, Math.round(img.height * s));
      ctx.drawImage(img, Math.round(sx - w / 2), Math.round(sy - h + 1 + (ctx === bg ? shake : 0)), w, h);
      if (t.kind === 'vent' && s > 0.12) {   // steam curling up out of it
        for (let n = 0; n < 3; n++) {
          const a = (tick * 0.5 + n / 3 + t.phase) % 1, r = Math.max(1, (1 + a * 3) * s * 2.2);
          ctx.globalAlpha = 0.45 * (1 - a);
          disc(ctx, sx + Math.sin(tick * 2 + t.phase + n) * s * 3 + a * s * 6, sy - h - a * s * 22, r, land.smoke[0]);
        }
        ctx.globalAlpha = 1;
      }
    }
    for (const [i, s] of spots.entries()) {   // the rocks the Pokémon hide behind, shaking just before one pops out
      const dz = s.wz - cz, sc = s.dz / dz, img = spotRocks[i], [sx, sy] = project(s.wx, s.wz, cz, k);
      const rustle = ms > s.ms - 350 && ms < s.ms + 200 ? ((Math.floor(ms / 60) % 2) ? 1 : -1) : 0;
      const w = Math.round(img.width * sc), h = Math.round(img.height * sc);
      if (w > 1) fg.drawImage(img, Math.round(sx - w / 2 + rustle), Math.round(sy + 2 * sc - h + 1), w, h);
    }

    // sparks rising off the cracks
    for (let n = 0; n < Math.round(W / 6 * (look.cracks || 1) ** 0.5); n++) {
      const cyc = tick * (0.35 + hash(n) * 0.3) + hash(n + 99), i = Math.floor(cyc), p = cyc - i;
      if (p > 0.85) continue;
      const x = hash(n * 7 + i * 13) * W + Math.sin(tick * 3 + n) * 1.5, y = hz + 3 + hash(n * 3 + i * 5) * ROWS - p * H * 0.12;
      fg.fillStyle = film.glow.ember[(n + i) % 3];
      fg.fillRect(Math.round(x), Math.round(y), 1, 1);
    }
    // ash and embers in the air: streaking past while you rush, falling softly once you stop
    for (const m of motes) {
      if (m.z < 0) spawn(m, cz, true);
      m.y -= dt * (m.ember ? -1.5 : 2.2);
      m.x += dt * 2.5;
      const [px, , dz] = project(m.x, m.z, cz, k), sy = hz + (k - F * m.y) / dz;
      if (dz < 1.5 || px < -4 || px > W + 4 || sy > H + 4 || m.y < -2 || m.y > camH * 2) { spawn(m, cz, false); continue; }
      const [ox, oz] = [VX + m.x * F / (m.z - lastCz), hz + (lastK - F * m.y) / (m.z - lastCz)];
      fg.fillStyle = m.ember ? film.glow.ember[Math.floor(tick * 6 + m.z) % 2] : land.ash[0];
      const len = Math.min(10, Math.max(Math.abs(px - ox), Math.abs(sy - oz)));
      for (let q = 0; q <= len; q++) {
        const f = len ? q / len : 0;
        fg.fillRect(Math.round(ox + (px - ox) * f), Math.round(oz + (sy - oz) * f), 1, 1);
      }
    }

    if (!mini && ms < 2400) {   // bursting out of the ash cloud: its billows part either side, the haze thins
      const p = ms / 1000;
      for (const c of nearAsh) fg.drawImage(c.img, Math.round(c.x + c.dir * p * p * W * 0.55), Math.round(c.y + p * p * H * 0.35));
      fg.globalAlpha = Math.max(0, 1 - easeOut(span([0, 1900], ms))) * 0.95;
      fg.fillStyle = cloud[1];
      fg.fillRect(0, 0, W, H);
      fg.globalAlpha = 1;
    }
    lastMs = ms; lastCz = cz; lastK = k;
  }

  return { spots, walkX: VX, draw, monAt: (i, ms) => { const [x, y] = project(spots[i].wx, spots[i].wz, camZ(ms), K(ms)); return [Math.round(x), Math.round(y)]; } };
}

// the Safari areas' films (js/safari-intro.js) paint with the same brushes
export { ease, easeOut, span, layer, disc, mix, dither, paintSky, cloudImage, paintFar, tallGrass, paintFore, rockImage, deadTreeImage };
