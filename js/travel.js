/*
 * Journey films (docs/roadmap.md step 10): between a boss's evolution and the next biome's intro film, a short film of
 * the trip there. Your evolved Pokémon walks left to right along a side-on road in parallax while the land turns from
 * one biome into the next and the sky runs dusk → night → dawn, with one set piece mid-way.
 *
 * Like the descent (js/descent.js): low-res canvases (P CSS px a pixel) painted whole every frame, one per parallax layer
 * (LAYERS, into()), the Pokémon a real GIF between them (`sky`... `road` behind; `roadFront` and `near`, the near grass, in front). Everything is a function of the camera, so the road never
 * ends and the land changes by where a thing stands along it: a column's look is the trip's progress when it passes
 * your Pokémon, so the next biome rolls in from the right. Palettes cross over by dithering, never by alpha. The sky's
 * colours are painted per time; the land is graded with GRADES like every scene, blended between the times.
 *
 * ROUTES has an entry per trip ('clearing>shrine'...), each with its palettes, its climb, its painter and its lines.
 * A trip without one resolves at once. Under reduced motion one still frame holds while the lines are read.
 */
import { $, sleep } from './ui.js';
import { playSound, preloadSounds } from './audio.js';
import { sceneSay } from './evolution.js';
import { spriteUrl, stageName, STARTERS_BY_ID } from './data/starters.js';
import { spriteFit } from './data/sprite-fit.js';
import { GRADES, gradeHex } from './daytime.js';
import { GATE_HP } from './data/gate.js';
import { isStarterUnlocked } from './progress.js';
import { gateHp } from './gate.js';
import { FLYERS } from './title.js';

const DUR = 7600;   // ms from the first step to dawn; the walk carries on while lines are still being read
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
let LX = 0, LY = 0;   // the whole-pixel offset of the layer being painted (into()), so its dithers stay put on the land
const bay = (x, y) => BAYER[((y + LY) & 3) * 4 + ((x + LX) & 3)] / 16;
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const abgr = (h) => { const n = parseInt(h.slice(1), 16); return (0xff000000 | ((n & 255) << 16) | (n & 0xff00) | (n >> 16)) >>> 0; };
const dev = (v) => Math.round(v * devicePixelRatio) / devicePixelRatio;   // CSS px, on a whole device pixel
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const smooth = (v) => { v = clamp01(v); return v * v * (3 - 2 * v); };
/** a's colour where the dither says so, b's past it: `m` 0 is all a, 1 all b. */
const dd = (a, b, m, x, y) => (m > bay(x, y) ? b : a);

/** Smooth value noise, 0-1: soft blobs for mist, where an ordered dither reads as a fence. */
function noise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), u = smooth(x - xi), v = smooth(y - yi);
  const h = (a, b) => hash(a * 57 + b * 131);
  const top = h(xi, yi) + (h(xi + 1, yi) - h(xi, yi)) * u, bottom = h(xi, yi + 1) + (h(xi + 1, yi + 1) - h(xi, yi + 1)) * u;
  return top + (bottom - top) * v;
}

function mix(a, b, t) {
  const n = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [n(a), n(b)];
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
}

// the skies the trip runs through (biome-intro.js's SKIES): top to horizon
const SKY = {
  dusk: ['#282c68', '#5a3c80', '#a8507a', '#e8705e', '#f8a858'],
  night: ['#050a20', '#0a1430', '#122046', '#1c2e5a', '#283e6e'],
  dawn: ['#34407a', '#6a5a9a', '#b070a0', '#e898a0', '#f8c8a0'],
};
const GLOW = ['#fff8c0', '#f8c850', '#e08030'];   // lit lanterns and windows, ungraded: they shine by themselves

/* ---------- the routes ---------- */

const CLEARING_SHRINE = {
  // the Clearing's colours (`a`) and the Shrine's (`b`), as biome-intro.js paints them by day
  a: {
    far: ['#8aa8d0', '#9ab8dc', '#e8f0f8'],
    hill: ['#88c070', '#70a85c', '#5a9048'],
    forest: ['#68b058', '#4e9a48', '#3a8040', '#1c4a28'],
    floor: ['#3a7a40', '#2a6434'],
    bark: ['#7a6450', '#5a4838', '#3a2e24'],
    path: ['#e0c888', '#c8a868', '#8a7044'],
    ground: ['#7cc45a', '#6eb850', '#5aa244', '#468a36'],
    fore: ['#6ab84c', '#4e9a3c', '#357a2e', '#1e5020'],
  },
  b: {
    far: ['#8aaca4', '#a4c0b8', '#c4d8d0'],
    hill: ['#4a7a48', '#3a6a40', '#2a5434'],
    forest: ['#5a9a60', '#3a7048', '#24503a', '#143024'],
    floor: ['#3a6a4a', '#2a5440'],
    bark: ['#6a4a34', '#4a3424', '#2e2016'],
    path: ['#d8d4c8', '#bcb8ac', '#7a7a6e'],
    ground: ['#7aa858', '#5e9048', '#4e7a3a', '#3a6430'],
    fore: ['#78c880', '#4e9a58', '#2e6e40', '#143820'],
  },
  shared: {
    root: ['#9a8064', '#6e5844', '#4a3a2c', '#2a2018'],   // the Ancient Tree: older and paler than the woods
    moss: ['#88b858', '#5a8a3c'],
    maple: ['#f8a048', '#e05830', '#a02c20'],
    stone: ['#d0d0c0', '#a8a898', '#7a7a6e', '#4a4a44'],
    torii: ['#e05038', '#a83020', '#5a1410'],
    roof: ['#88d0b0', '#4aa080', '#2e7458', '#123828'],
    plaster: ['#f4f0e4', '#c8c4b8'],
    flowers: ['#f878a8', '#f8d030', '#ffffff', '#a878f8'],
    mist: ['#e8f0ec', '#c8d8d4'],
  },
  fly: 0.03,   // when the flyover starts (pickGuest()), in the dusk, before the Ancient Tree fills the sky
  morph: (f) => smooth((f - 0.18) / 0.5),   // the land turns over the trip's first two thirds
  rise: (f) => 0.15 * smooth((f - 0.42) / 0.14),   // up the Ancient Tree's roots, onto the Shrine's mountain
  ramp: [0.39, 0.59],
  TRUNK: 0.47,
  sounds: ['furin-0', 'furin-1', 'furin-2', 'bell-far'],
  lines: (name) => [
    [0.04, [`${name} leaves the Whispering Clearing behind...`]],
    [0.4, ['The path climbs the Ancient Tree\'s great roots.']],
    [0.6, ['High above, lanterns glimmer through the mist.', 'The Overgrown Shrine lies ahead!']],
  ],
  paint: paintClearingShrine,
};

// Shrine → Wastes: `a` the Shrine, `d` the land drying out half-way, `b` the Wastes (biome-intro.js's ashen palettes)
const SHRINE_WASTES = {
  a: CLEARING_SHRINE.b,
  d: {
    far: ['#8a8a78', '#9e9a88', '#c8c0b0'],
    hill: ['#8a8a50', '#727040', '#5a5834'],
    forest: ['#8a8a48', '#6a6a38', '#4a4a2c', '#2a2a1c'],
    floor: ['#6a6440', '#585234'],
    bark: ['#6a5040', '#4a3828', '#2e2218'],
    path: ['#c8b890', '#a89870', '#6a5a44'],
    ground: ['#a8a058', '#8a8448', '#706a3a', '#56502e'],
    fore: ['#c8b860', '#a09040', '#706030', '#40381c'],
  },
  b: {
    far: ['#56403c', '#6a4c48', '#a89890'],
    hill: ['#7a6a60', '#5e4e48', '#463a36'],
    forest: ['#7a6a60', '#54463e', '#362c26', '#1a1412'],
    floor: ['#564842', '#463a36'],
    bark: ['#7a6a60', '#54463e', '#362c26'],
    path: ['#c8bcac', '#b0a494', '#4a403a'],
    ground: ['#a49c94', '#8c847c', '#746c64', '#5e4e48'],
    fore: ['#a8a048', '#7a7438', '#4e4a2a', '#2a2618'],
  },
  shared: {
    stone: CLEARING_SHRINE.shared.stone,
    moss: CLEARING_SHRINE.shared.moss,
    mist: CLEARING_SHRINE.shared.mist,
    oldTorii: ['#b07060', '#7a4838', '#3a2420'],   // the Shrine's last gate, weathered
    dead: ['#7a6a60', '#54463e', '#362c26', '#1a1412'],
    rock: ['#8a7a70', '#5e5048', '#3e3430', '#221c18'],
    plank: ['#b08458', '#8a6038', '#5c3c20'],
    rope: ['#e0d098', '#a89060', '#6a5838'],
    volcano: ['#6a5048', '#4e3a34', '#362824'],
    smoke: ['#8a7a76', '#6a5c58', '#4a3e3c'],
    ash: ['#e0d8d0', '#a8a098'],
  },
  fly: 0.05,
  morph: (f) => smooth((f - 0.08) / 0.64),   // 0 the Shrine, 0.5 dried out, 1 the Wastes
  rise: () => 0,
  walk: (trip) => trip - 0.07 * smooth((trip - 0.34) / 0.3),   // careful steps over the bridge
  gorge: [0.4, 0.6],
  deck: bridgeDeck,
  sounds: ['gust', 'creak', 'rumble-far'],
  lines: (name) => [
    [0.04, [`${name} leaves the Overgrown Shrine behind...`]],
    [0.25, ['The moss dries out. Ash begins to fall.']],
    [0.42, ['A rope bridge sways over a deep chasm.', 'Embers drift up from far below...']],
    [0.72, ['On the horizon, a volcano glows red.', 'The Ember Wastes lie ahead!']],
  ],
  paint: paintShrineWastes,
};

const ROUTES = { 'clearing>shrine': CLEARING_SHRINE, 'shrine>wastes': SHRINE_WASTES };

/** Is there a film for this trip? */
export const hasTravel = (from, to) => !!ROUTES[`${from}>${to}`];

/* ---------- the engine ---------- */

let P = 4, W = 0, H = 0, tall = false, hz = 0, GY = 0, mx = 0, TRIP = 1;
/* Each parallax layer is its own canvas, painted at its camera offset rounded down to a whole pixel and slid the rest of
   the way by CSS, so it glides in screen pixels while its art keeps its chunky ones. Back to front; your Pokémon walks
   between `road` and `roadFront` (the road's things that pass in front of it), and the flyer between `road` and it. */
const LAYERS = ['sky', 'far', 'hill', 'mid', 'road', 'roadFront', 'near'];
let layers = {}, buf = null, fbuf = null;

/** Paint the next things into a layer at camera offset (ox, oy): its whole-pixel part comes back to paint with, the rest
    is left for CSS. `road` also takes `roadFront` as the front buffer, `near` is front only. */
function into(name, ox = 0, oy = 0) {
  const l = layers[name], ix = Math.floor(ox), iy = Math.floor(oy);
  l.fx = ox - ix; l.fy = oy - iy;
  LX = ix; LY = -iy;
  if (name === 'near') fbuf = l.buf;
  else buf = l.buf;
  if (name === 'road') { const f = layers.roadFront; f.fx = l.fx; f.fy = l.fy; fbuf = f.buf; }
  return [ix, iy];
}
let guest = null;
let route = null, lit = new Set(), chimeAt = 0, belled = false, cued = new Set(), camX = 0, clock = 0;

/**
 * Play the trip from one biome to the next. Resolves once it's over (or skipped) and the screen is dark, with a close()
 * that takes the film away: call it once the next biome's map and intro film are up beneath it. `first` (the save's
 * travelSeen) adds the trip's lines.
 */
export async function travel({ from, to, starter, stage = 0, shiny = false, first = false, at = null, seed = '', flyer = null }) {
  route = ROUTES[`${from}>${to}`];
  if (!route) return () => {};
  guest = pickGuest(`${seed}|${from}>${to}`, flyer);
  const scene = $('travel-scene'), mon = $('travel-mon');
  const name = stageName(starter, stage);
  const calm = still();
  scene.className = `travel-scene${calm ? ' still' : ''}`;
  scene.hidden = false;
  $('travel-log').hidden = true;
  mon.src = spriteUrl(starter, 'front', stage, shiny);
  mon.alt = name;
  preloadSounds(...route.sounds, 'gust', 'rumble-far');
  lit = new Set(); chimeAt = 0; belled = false; cued = new Set();
  layout();
  const fl = $('travel-flyer');
  fl.hidden = true;
  if (guest && guest !== ETERNATUS) fl.src = `assets/pokemon/${guest}-front.gif`;
  await Promise.all([loaded(mon), guest && guest !== ETERNATUS && loaded(fl)]);
  fit();
  addEventListener('resize', relayout);

  const start = performance.now();
  let raf = 0, saying = false, linesDone = !first, over = false;
  // `at` (a playtest's &at=0.5) holds the film at that point of the trip, still walking, until it's tapped away
  const elapsed = () => (calm ? DUR * 0.55 : performance.now() - start);
  const draw = (now) => {
    const ms = calm ? DUR * 0.55 : at !== null ? at * DUR : now - start;
    frame(ms, now - start);
    if (!calm) raf = requestAnimationFrame(draw);
  };
  raf = requestAnimationFrame(draw);

  // the lines, each at its beat; while one is up a tap reads on rather than skipping
  const told = first ? (async () => {
    for (const [beat, lines] of route.lines(name)) {
      while (!over && !calm && elapsed() < beat * DUR) await sleep(80);
      if (over) return;
      saying = true;
      await sceneSay('travel-scene', 'travel-log', lines);
      saying = false;
    }
    linesDone = true;
  })() : Promise.resolve();

  await new Promise(resolve => {
    const skip = (e) => { if (!saying && e.type === 'pointerup') done(); };
    const onKey = (e) => { if (!saying && ['Enter', ' ', 'Escape'].includes(e.key)) { e.preventDefault(); done(); } };
    let timer = 0;
    function done() {
      if (over) return;
      over = true;
      clearInterval(timer);
      scene.removeEventListener('pointerup', skip);
      removeEventListener('keydown', onKey, true);
      resolve();
    }
    scene.addEventListener('pointerup', skip);
    addEventListener('keydown', onKey, true);
    // the film's end, or once the last line is read; under reduced motion a short hold after the lines
    if (calm) told.then(() => sleep(first ? 600 : 2200)).then(done);
    else if (at === null) timer = setInterval(() => { if (linesDone && elapsed() >= DUR) done(); }, 100);
  });

  scene.classList.add('dark');
  $('travel-log').hidden = true;
  await sleep(calm ? 150 : 600);
  return () => {
    cancelAnimationFrame(raf);
    removeEventListener('resize', relayout);
    scene.hidden = true;
    scene.className = 'travel-scene';
  };
}

const loaded = (el) => el.complete && el.naturalWidth ? null : new Promise(resolve => { el.onload = el.onerror = resolve; });

function layout() {
  P = innerWidth <= 720 ? 4 : 5;
  W = Math.ceil(innerWidth / P) + 1;   // a pixel spare each way for the layers' slide
  H = Math.ceil(innerHeight / P) + 1;
  tall = H > W;
  hz = Math.round(H * (tall ? 0.56 : 0.5));
  GY = Math.round(H * (tall ? 0.8 : 0.78));
  mx = Math.round(W * (tall ? 0.4 : 0.36));
  TRIP = Math.round(Math.max(W, 150) * 2.1);   // ground pixels walked from the first step to dawn
  layers = {};
  for (const name of LAYERS) {
    const c = layerCanvas(name), g = c.getContext('2d');
    c.width = W; c.height = H; c.style.width = `${W * P}px`; c.style.height = `${H * P}px`;
    const img = g.createImageData(W, H);
    layers[name] = { c, g, img, buf: new Uint32Array(img.data.buffer), fx: 0, fy: 0 };
  }
}

/** The canvas for a layer: the page's two (sky at the back, near grass at the front), the rest made beside them once. */
function layerCanvas(name) {
  if (name === 'sky') return $('travel-back');
  if (name === 'near') return $('travel-front');
  let c = $(`travel-${name}`);
  if (!c) {
    c = document.createElement('canvas');
    c.id = `travel-${name}`;
    c.className = 'travel-canvas pixel';
    c.setAttribute('aria-hidden', 'true');
    $(name === 'roadFront' ? 'travel-front' : 'travel-flyer').before(c);
  }
  return c;
}

function relayout() { layout(); fit(); }

/** Your Pokémon at a whole or half scale that fits the screen. */
function fit() {
  const mon = $('travel-mon');
  const [top, bottom, left, right] = spriteFit(mon.src);
  const pose = Math.max(mon.naturalWidth - left - right, mon.naturalHeight - top - bottom) || 64;
  const room = Math.min(innerWidth * 0.32, innerHeight * 0.17);
  const s = Math.max(1, Math.min(4, Math.floor((room / pose) * 2) / 2));
  mon.style.width = `${mon.naturalWidth * s}px`;
  mon.style.height = `${mon.naturalHeight * s}px`;
  mon.style.setProperty('--foot', `${bottom * s}px`);
  mon.style.left = `${mx * P}px`;
}

/** The sky's colours, the land's grade and how much of the night is up, at `p` of the trip. */
function skyAt(p) {
  const blend = (a, b, t) => a.map((c, i) => mix(c, b[i], t));
  const grade = (a, b, t) => { a = a || [1, 0, 0, 0]; b = b || [1, 0, 0, 0]; return a.map((v, i) => v + (b[i] - v) * t); };
  if (p < 0.32) { const t = smooth(p / 0.32); return { sky: blend(SKY.dusk, SKY.night, t), land: grade(GRADES.dusk.land, GRADES.night.land, t), night: t }; }
  if (p < 0.62) return { sky: SKY.night, land: GRADES.night.land, night: 1 };
  const t = smooth((p - 0.62) / 0.38);
  return { sky: blend(SKY.night, SKY.dawn, t), land: grade(GRADES.night.land, GRADES.dawn.land, t), night: 1 - t };
}

/** Every palette of the route through the land's grade, as pixels. */
function tone(set, land) {
  const out = {};
  for (const [k, list] of Object.entries(set)) out[k] = list.map(h => abgr(gradeHex(h, land)));
  return out;
}

function frame(ms, walked = ms) {
  const trip = ms / DUR, p = Math.min(1, trip);
  // `pos` is how far along the road (a route's `walk` can slow the steps); `trip` stays the clock
  const pos = route.walk ? route.walk(trip) : trip;
  const cam = pos * TRIP;
  const camY = route.rise(pos) * H * 0.75;
  camX = cam; clock = walked / 1000;
  const sky = skyAt(p);
  const e = {
    ms, t: walked / 1000, trip, pos, cam, camY, night: sky.night,
    a: tone(route.a, sky.land), b: tone(route.b, sky.land), c: tone(route.shared, sky.land), glow: GLOW.map(abgr),
    d: route.d && tone(route.d, sky.land),
  };
  for (const l of Object.values(layers)) l.buf.fill(0);
  into('sky');
  paintSky(e, sky);
  if (guest === ETERNATUS) redGlow(e);
  route.paint(e);
  flyBy(e);
  for (const l of Object.values(layers)) {
    l.g.putImageData(l.img, 0, 0);
    l.c.style.transform = l.fx || l.fy ? `translate(${dev(-l.fx * P)}px, ${dev(l.fy * P)}px)` : '';
  }
  // your Pokémon, its feet on the road, a step up and down as it walks
  const mon = $('travel-mon');
  const step = still() ? 0 : Math.floor(walked / 220) % 2;
  mon.style.top = `${dev((groundY(mx + cam) + camY - step) * P)}px`;
}

/* ---------- the flyover (roadmap step 12) ---------- */

/* Mid-trip a legendary you haven't unlocked yet crosses the sky as a black silhouette, its shadow sweeping the road: a
   tease, like the title's flyers. Once the Sealed Gate is below half, sometimes Eternatus stirs instead, a red glow pulsing
   on the horizon. Picked from the run's seed and the trip, so a refresh shows the same one; nothing once you own them all. */
const ETERNATUS = 'eternatus';
const FLY_LEN = 0.3;   // of the trip
const RED = ['#ff8060', '#d02838', '#701020'].map(abgr);   // ungraded, like the lanterns

function pickGuest(seed, forced) {
  if (forced) return forced === 'none' ? null : forced;
  let n = 7;
  for (const ch of seed) n = (n * 31 + ch.charCodeAt(0)) % 100003;
  const roll = (k) => hash(n / 97 + k);
  if (gateHp() <= GATE_HP / 2 && roll(1) < 0.35) return ETERNATUS;
  const locked = FLYERS.filter(id => STARTERS_BY_ID[id] && !isStarterUnlocked(STARTERS_BY_ID[id]));
  return locked.length ? locked[Math.floor(roll(2) * locked.length)] : null;
}

/** 0-1 through the flyover, or null outside it. */
const flyK = (e) => { const k = (e.trip - route.fly) / FLY_LEN; return k > 0 && k < 1 && !still() ? k : null; };

/** The silhouette from right to left high over the road (the way the title's go), its shadow on the ground beneath. */
function flyBy(e) {
  const fl = $('travel-flyer'), k = guest && guest !== ETERNATUS ? flyK(e) : null;
  fl.hidden = k === null;
  if (k === null) return;
  const s = Math.max(1, Math.round((Math.min(innerWidth * 0.3, 240) / Math.max(64, fl.naturalWidth)) * 2) / 2);
  const w = fl.naturalWidth * s, x = innerWidth + w / 2 - k * (innerWidth + w);
  fl.style.width = `${w}px`;
  fl.style.left = `${x}px`;
  fl.style.top = `${(hz * 0.32 + Math.sin(k * Math.PI * 3) * 3) * P}px`;
  if (k > 0.38) cue('fly', 'gust');
  // the shadow, a little behind it (the light's low), a dark smear over the road's band of ground
  const cx = x / P + w / P * 0.2, rx = Math.max(10, w / P * 0.4);
  const dark = (c) => (0xff000000 | ((c & 0xfefefe) >>> 1)) >>> 0;
  for (let gx = Math.floor(cx - rx); gx <= cx + rx; gx++) {
    if (gx < 0 || gx >= W) continue;
    const d = Math.abs(gx - cx) / rx, gy = groundY(gx + e.cam) + Math.round(e.camY);
    for (let dy = -3; dy <= 4; dy++) {
      const y = gy + dy;
      if (y < 0 || y >= H || Math.hypot(d, dy / 4.5) >= 1 || bay(gx, y) > 0.75 * (1 - d * d)) continue;
      const i = y * W + gx;
      if (buf[i]) buf[i] = dark(buf[i]);
      if (fbuf[i]) fbuf[i] = dark(fbuf[i]);
    }
  }
}

/** Eternatus stirs far below: a red glow swelling behind the horizon's hills three times, with a far rumble. */
function redGlow(e) {
  const k = flyK(e);
  if (k === null) return;
  const pulse = Math.sin(k * Math.PI) * Math.pow(Math.sin(k * Math.PI * 3), 2);
  if (k > 0.1) cue('stir', 'rumble-far');
  const cx = W * 0.68, rx = W * 0.32, ry = Math.max(8, H * 0.12);
  for (let y = Math.floor(hz - ry); y <= hz + 2; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
    const d = Math.hypot((x - cx) / rx, (y - hz) / ry);
    if (d < 1 && bay(x, y) < (1 - d) * 0.9 * pulse) put(x, y, RED[d < 0.25 ? 0 : d < 0.55 ? 1 : 2]);
  }
}

/* ---------- painting helpers ---------- */

const put = (x, y, c) => { if (x >= 0 && x < W && y >= 0 && y < H) buf[y * W + x] = c; };
const fput = (x, y, c) => { if (x >= 0 && x < W && y >= 0 && y < H) fbuf[y * W + x] = c; };
function rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x + i, y + j, c); }
function disc(cx, cy, r, c) {
  for (let y = -r; y <= r; y++) { const half = Math.floor(Math.sqrt(r * r - y * y)); for (let x = -half; x <= half; x++) put(Math.round(cx + x), Math.round(cy + y), c); }
}
/** A warm halo, dithered out from (cx, cy). */
function halo(cx, cy, r, k, glow) {
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
    const d = Math.hypot(x, y * 1.2) / r;
    if (d >= 1) continue;
    const px = Math.round(cx + x), py = Math.round(cy + y);
    if (bay(px, py) < (1 - d) * 0.6 * k) put(px, py, d < 0.35 ? glow[1] : glow[2]);
  }
}

function paintSky(e, { sky, night }) {
  const cols = sky.map(abgr), bands = cols.length - 1;
  for (let y = 0; y < H; y++) {
    const v = Math.min(1, y / hz) * bands, i = Math.min(bands - 1, Math.floor(v));
    for (let x = 0; x < W; x++) buf[y * W + x] = dd(cols[i], cols[i + 1], v - i, x, y);
  }
  // stars come out with the night, twinkling
  const stars = Math.round((W * hz) / 60);
  for (let n = 0; n < stars; n++) {
    if (hash(n + 0.3) > night) continue;
    if (Math.sin(e.t * 3 + n * 1.7) > 0.85) continue;
    put(Math.floor(hash(n) * W), Math.floor(hash(n + 0.6) * hz * 0.85), hash(n + 0.9) < 0.25 ? abgr('#ffffff') : abgr('#a8b8e0'));
  }
  const p = Math.min(1, e.trip);
  // the sun sets on the left, the moon crosses the night, the sun comes up on the right
  if (p < 0.3) {
    const y = hz * 0.72 + (p / 0.3) * hz * 0.45;
    disc(W * 0.14, y, 8, abgr('#f8b070')); disc(W * 0.14, y, 6, abgr('#fff0b0'));
  }
  if (p > 0.16 && p < 0.84) {
    const k = (p - 0.16) / 0.68, x = W * (0.15 + 0.7 * k), y = hz * (0.55 - 0.4 * Math.sin(Math.PI * k));
    disc(x, y, 5, abgr('#f8f4d8')); disc(x + 2, y - 1, 4, cols[0]);
  }
  if (p > 0.72) {
    const y = hz * 1.12 - ((p - 0.72) / 0.28) * hz * 0.4;
    disc(W * 0.86, y, 8, abgr('#f8c080')); disc(W * 0.86, y, 6, abgr('#fff4c8'));
  }
}

/** The road's top at ground x `u` (before the camera's rise). */
function groundY(u) {
  const f = (u - mx) / TRIP, base = GY - route.rise(f) * H;
  const deck = route.deck?.(f, u);   // a bridge's planks, where the route has one
  return Math.round(deck == null ? base + Math.sin(u * 0.07) * 0.8 : base + deck);
}

/** A stone lantern standing on (x, y); `small` for the far ones up the mountain. Returns its light's middle. */
function lantern(x, y, on, { stone }, glow, small = false) {
  if (small) {
    put(x, y - 1, stone[2]); put(x, y - 2, stone[2]);
    rect(x - 1, y - 3, 3, 1, stone[1]);
    put(x, y - 4, on ? glow[0] : stone[3]); put(x - 1, y - 4, stone[2]); put(x + 1, y - 4, stone[2]);
    rect(x - 2, y - 5, 5, 1, stone[1]); put(x, y - 6, stone[0]);
    return [x, y - 4];
  }
  rect(x - 2, y - 1, 5, 1, stone[2]);
  rect(x - 1, y - 4, 3, 3, stone[1]); rect(x + 1, y - 4, 1, 3, stone[2]);
  rect(x - 2, y - 5, 5, 1, stone[1]);
  rect(x - 1, y - 7, 3, 2, on ? glow[1] : stone[3]); put(x, y - 7, on ? glow[0] : stone[3]); put(x, y - 6, on ? glow[0] : stone[3]);
  put(x - 2, y - 7, stone[2]); put(x + 2, y - 7, stone[2]); put(x - 2, y - 6, stone[2]); put(x + 2, y - 6, stone[2]);
  rect(x - 3, y - 8, 7, 1, stone[1]); rect(x - 2, y - 9, 5, 1, stone[0]); put(x, y - 10, stone[0]);
  return [x, y - 6.5];
}

/** A torii, front on, its feet on (cx, y). */
function torii(cx, y, h, { torii: red }) {
  const w = Math.round(h * 0.85), half = Math.round(w / 2), legs = Math.round(w * 0.32);
  for (const side of [-1, 1]) {
    const lx = cx + side * legs;
    rect(lx - 1, y - h + 2, 3, h - 2, red[1]); rect(lx - 1, y - h + 2, 1, h - 2, red[0]);
    rect(lx - 2, y - 2, 5, 2, red[2]);   // the black feet
  }
  rect(cx - half + 3, y - h + 5, w - 6, 2, red[1]);   // the nuki
  rect(cx - 1, y - h + 2, 3, 3, red[1]);             // the plaque post
  rect(cx - half + 1, y - h + 1, w - 2, 2, red[0]);   // the kasagi, its ends swept up
  rect(cx - half, y - h, w, 1, red[2]);
  put(cx - half - 1, y - h - 1, red[2]); put(cx + half, y - h - 1, red[2]);
}

/* ---------- Clearing → Shrine ---------- */

function paintClearingShrine(e) {
  const { trip, a, b, c, glow, t } = e;
  let { cam, camY } = e;
  const R = CLEARING_SHRINE, morph = R.morph;
  // a far layer's look runs on the clock, the right edge a little ahead (true world positions would put the Shrine at
  // its edge from the start, it moves so little)
  const ahead = (x, lead) => morph(trip + ((x - mx) / W) * lead);
  const lightK = 0.5 + 0.5 * e.night;

  // the far mountains: snow-capped blue ranges, turning to the Shrine's misty green ridges
  const [fu, fy] = into('far', cam * 0.05, camY * 0.05);
  for (let x = 0; x < W; x++) {
    const u = x + fu, m = ahead(x, 0.25);
    const top1 = Math.round(hz - H * 0.05 - H * 0.07 * (0.55 * Math.sin(u * 0.045 + 1) + 0.3 * Math.sin(u * 0.11 + 2) + 0.15 * Math.sin(u * 0.23))) + fy;
    const top2 = Math.round(hz - H * 0.015 - H * 0.04 * (0.6 * Math.sin(u * 0.07 + 4) + 0.4 * Math.sin(u * 0.17))) + fy;
    for (let y = Math.max(0, top1); y < hz + 12 && y < H; y++) {
      const peak = y < top1 + 2 && top1 < hz - H * 0.09;
      buf[y * W + x] = peak ? dd(a.far[2], b.far[2], m, x, y) : y >= top2 ? dd(a.far[0], b.far[0], m, x, y) : dd(a.far[1], b.far[1], m, x, y);
    }
  }

  // the hills
  const [hu, hy] = into('hill', cam * 0.18, camY * 0.18);
  for (let x = 0; x < W; x++) {
    const u = x + hu, m = ahead(x, 0.4);
    const top = Math.round(hz + H * 0.01 - H * 0.035 * (0.6 * Math.sin(u * 0.04 + 3) + 0.4 * Math.sin(u * 0.09))) + hy;
    for (let y = Math.max(0, top); y < H; y++) {
      const k = y === top ? 0 : y < top + 7 ? 1 : 2;
      buf[y * W + x] = dd(a.hill[k], b.hill[k], m, x, y);
    }
  }

  // the woods (true positions from here on): the meadow's round trees thin out, cedars and maples come in, and the
  // Shrine's mountain rises out of them, a stair of lanterns climbing it
  const S = 0.45, [mu, my] = into('mid', cam * S, camY * S), MB = GY - Math.round(H * 0.07);
  const fAt = (u) => (u - mx) / (S * TRIP);
  const slope = (f) => smooth((f - 0.5) / 0.3);
  const midTop = (u) => {
    const r = H * 0.2 * slope(fAt(u));
    return MB - (r > 0.5 && r < H * 0.2 - 0.5 ? Math.round(r / 2) * 2 : Math.round(r)) + Math.round(Math.sin(u * 0.13)) + my;
  };
  for (let x = 0; x < W; x++) {
    const u = x + mu, m = morph(fAt(u)), top = midTop(u);
    for (let y = Math.max(0, top); y < H; y++) buf[y * W + x] = dd(a.floor[y - top < 3 ? 0 : 1], b.floor[y - top < 3 ? 0 : 1], m, x, y);
    const f = fAt(u);
    if (f > 0.5 && f < 0.8 && (Math.round(u) & 1)) { put(x, top, c.stone[1]); put(x, top + 1, c.stone[2]); }   // the stair up
  }
  const uT = mx + R.TRUNK * S * TRIP, halfT = Math.max(16, Math.round(W * 0.16));
  for (let k = Math.floor((mu - 14) / 4); k <= Math.ceil((mu + W + 14) / 4); k++) {
    const u0 = k * 4 + Math.floor(hash(k) * 3), f = fAt(u0), m = morph(f);
    if (Math.abs(u0 - uT) < halfT * 1.5) continue;
    const x = Math.round(u0 - mu), base = midTop(u0);
    if (hash(k + 0.5) > m * 1.05) {
      if (hash(k + 0.2) < m * 0.8) continue;   // the meadow's trees thin out as the land turns
      const r = 3 + Math.floor(hash(k + 0.7) * H * 0.022), cy = base - r - 2;
      rect(x, cy, 1, base - cy, a.bark[2]);
      disc(x, cy + 1, r, a.forest[2]); disc(x, cy, r - 1, a.forest[1]); disc(x - 1, cy - 1, Math.max(1, r - 3), a.forest[0]);
    } else if (hash(k + 0.9) < 0.14) {
      const r = 3 + Math.floor(hash(k + 0.4) * 3), cy = base - r - 2;
      rect(x, cy, 1, base - cy, b.bark[1]);
      disc(x, cy + 1, r, c.maple[2]); disc(x, cy, r - 1, c.maple[1]); disc(x - 1, cy - 1, Math.max(1, r - 3), c.maple[0]);
    } else {
      const hc = 9 + Math.floor(hash(k + 0.3) * H * 0.07);
      for (let i = 0; i < hc; i++) {
        const half = Math.round(i * 0.3 - (i % 4) * 0.3 + 0.4), y = base - hc - 1 + i;
        for (let j = -half; j <= half; j++) put(x + j, y, j < 0 ? b.forest[1] : b.forest[2]);
        if (half > 1) put(x - half, y, b.forest[0]);
      }
      rect(x, base - 2, 1, 2, b.bark[2]);
    }
  }
  paintTrunk(Math.round(uT - mu), halfT, midTop(uT), c, t);
  // the lanterns up the mountain, lighting one by one through the mist as you climb towards them
  for (let k = 0; k < 9; k++) {
    const f = 0.5 + k * 0.036, u = mx + f * S * TRIP, x = Math.round(u - mu);
    if (x < -6 || x > W + 6) continue;
    const on = trip >= f - 0.13;
    const [lx, ly] = lantern(x, midTop(u), on, c, glow, true);
    if (on) { halo(lx, ly, 4, lightK, glow); lightUp(`m${k}`, x); }
  }
  // the Main Hall on the mountain's top, ahead at the end
  const hallU = mx + 1.22 * S * TRIP, hx = Math.round(hallU - mu);
  if (hx > -30 && hx < W + 30) {
    hall(hx, midTop(hallU), c, glow, e.night);
    if (!belled && hx < W - 6) { belled = true; if (!still()) playSound('bell-far'); }
  }

  // mist rolls in between the woods and the road, thickest round the climb and on the mountain
  const mist = (f) => 0.08 + 0.5 * smooth((f - 0.32) / 0.25);
  for (let y = Math.max(0, MB - Math.round(H * 0.16) + my); y < GY + camY && y < H; y++) {
    const band = 1 - Math.abs((y - (MB + my - H * 0.04)) / (H * 0.13));
    if (band <= 0) continue;
    for (let x = 0; x < W; x++) {
      const d = mist(trip + (x - mx) / (S * TRIP)) * band, u = x + cam * 0.6;
      const n = noise(u * 0.06 + t * 0.25, y * 0.2) * 0.75 + noise(u * 0.17 - t * 0.4, y * 0.45) * 0.25;
      if (n < d) buf[y * W + x] = n < d - 0.1 ? c.mist[0] : c.mist[1];
    }
  }

  [cam, camY] = into('road', cam, camY);
  // the road: the Clearing's dirt path and meadow, the Ancient Tree's roots up the climb, the Shrine's gravel and moss
  const [r0, r1] = R.ramp;
  for (let x = 0; x < W; x++) {
    const u = x + cam, f = (u - mx) / TRIP, m = morph(f), top = groundY(u) + camY;
    const root = smooth((f - r0) / 0.03) * (1 - smooth((f - (r1 - 0.03)) / 0.03));
    for (let y = Math.max(0, top); y < H; y++) {
      const d = y - top;
      let col;
      if (d === 0) col = dd(a.path[0], b.path[0], m, x, y);
      else if (d < 3) col = dd(a.path[1], b.path[1], m, x, y);
      else if (d === 3) col = dd(a.path[2], b.path[2], m, x, y);
      else {
        const k = Math.min(3, Math.floor(((d - 4) / Math.max(1, H - top - 4)) * 4));
        col = dd(a.ground[k], b.ground[k], m, x, y);
      }
      if (m > 0.5 && d > 0 && d < 3 && Math.round(u) % 6 === 0) col = b.path[2];   // stepping stones
      if (root > bay(x, y)) {
        const s = Math.sin(d * 0.55 - u * 0.35) + Math.sin(y * 0.2 + u * 0.12) * 0.6;
        col = d === 0 ? c.moss[0] : d === 1 ? c.root[0] : s > 0.9 ? c.root[0] : s > 0.1 ? c.root[1] : s > -0.6 ? c.root[2] : c.root[3];
        if (d > 1 && hash(Math.floor(u / 2) * 7 + Math.floor(y / 2)) < 0.05) col = c.moss[1];
      }
      buf[y * W + x] = col;
    }
  }
  // along it: bushes, tall grass and flowers, then stone lanterns and torii
  for (let k = Math.floor((cam - 10) / 9); k <= Math.ceil((cam + W + 10) / 9); k++) {
    const u0 = k * 9 + Math.floor(hash(k + 0.1) * 4), f = (u0 - mx) / TRIP;
    if (f > r0 - 0.02 || hash(k + 0.3) < morph(f) * 1.15 || hash(k + 0.8) > 0.75) continue;
    const x = Math.round(u0 - cam), y = groundY(u0) + camY, kind = hash(k + 0.6);
    if (kind < 0.35) { disc(x, y - 3, 3, a.forest[2]); disc(x, y - 4, 2, a.forest[1]); put(x - 1, y - 5, a.forest[0]); }
    else if (kind < 0.65) for (let i = -3; i <= 3; i++) { const h = 3 + Math.round(hash(k * 3 + i) * 3); rect(x + i, y - h, 1, h, i & 1 ? a.fore[1] : a.fore[0]); put(x + i, y - 1, a.fore[3]); }
    else if (kind < 0.85) for (let i = 0; i < 5; i++) put(x + Math.round((hash(k + i) - 0.5) * 8), y - 1 - Math.round(hash(k + i + 0.5) * 2), c.flowers[Math.floor(hash(k * 5 + i) * 4)]);
    else { rect(x - 2, y - 2, 4, 2, c.stone[2]); rect(x - 1, y - 3, 2, 1, c.stone[1]); }
  }
  const toriiAt = [0.74, 0.94, 1.14, 1.34], th = Math.max(24, Math.round(Math.min(H * 0.22, W * 0.45)));
  for (const f of toriiAt) {
    const u = mx + f * TRIP, x = Math.round(u - cam);
    if (x > -th && x < W + th) torii(x, groundY(u) + camY, th, c);
  }
  for (let k = Math.floor((cam - 10) / 15); k <= Math.ceil((cam + W + 10) / 15); k++) {
    const u0 = k * 15, f = (u0 - mx) / TRIP;
    if (f < r1 - 0.02 || hash(k + 0.4) > 0.8 || toriiAt.some(ft => Math.abs((ft - f) * TRIP) < 14)) continue;
    const x = Math.round(u0 - cam), on = trip >= f - 0.3;
    const [lx, ly] = lantern(x, groundY(u0) + camY, on, c, glow);
    if (on) { halo(lx, ly, 6, lightK, glow); lightUp(`g${k}`, x); }
  }

  // fireflies over the meadow while it's dark
  if (e.night > 0.2) {
    for (let i = 0; i < 10; i++) {
      const x = Math.round(((hash(i) * W * 1.6 - cam * 0.8) % (W * 1.6) + W * 1.6) % (W * 1.6) + Math.sin(t * 0.7 + i) * 4 - W * 0.3);
      if (morph((x + cam - mx) / TRIP) > 0.5) continue;
      const y = Math.round(GY + camY - 5 - hash(i + 0.5) * H * 0.15 + Math.cos(t + i) * 3);
      if (Math.sin(t * 3 + i * 1.7) > 0.2) { put(x, y, glow[0]); if (Math.sin(t * 3 + i * 1.7) > 0.7) { put(x - 1, y, glow[2]); put(x + 1, y, glow[2]); } }
    }
  }

  // the near grass along the bottom, passing faster than the road
  const [nu, ny] = into('near', e.cam * 1.35, e.camY * 1.35);
  for (let x = 0; x < W; x++) {
    const u = x + nu, m = morph((u - mx) / (1.35 * TRIP));
    const h = Math.round(H * 0.04 + hash(Math.floor(u)) * H * 0.05 + Math.sin(u * 0.21) * 2);
    for (let y = Math.max(0, H - h + ny); y < H; y++) {
      const d = y - (H - h + ny), k = d < 2 ? 0 : d < h * 0.45 ? 1 : d < h * 0.8 ? 2 : 3;
      fput(x, y, dd(a.fore[k], b.fore[k], m, x, y));
    }
  }
}

/** The Ancient Tree's trunk towering out of sight, buttress roots spreading into the woods' floor, furrowed and mossy. */
function paintTrunk(cx, half, base, { root, moss }, t) {
  if (cx + half * 3 < 0 || cx - half * 3 > W) return;
  for (let y = 0; y <= base; y++) {
    const flare = y > base - half ? Math.round(((y - (base - half)) / half) ** 2 * half * 1.4) : 0;
    const l = cx - half - flare, r = cx + half + flare;
    for (let x = Math.max(0, l); x <= Math.min(W - 1, r); x++) {
      const into = (x - l) / (r - l);
      let col = into < 0.12 ? root[0] : into < 0.6 ? root[1] : into < 0.9 ? root[2] : root[3];
      if ((x - cx + Math.round(Math.sin(y * 0.15 + x * 0.5) * 1.5)) % 6 === 0) col = root[3];   // bark furrows
      if (hash(Math.floor(x / 2) * 13 + Math.floor(y / 3) * 7) < 0.07) col = moss[into < 0.5 ? 0 : 1];
      put(x, y, col);
    }
  }
  for (let n = 0; n < half; n++) {   // vines hanging down its face
    const x = cx - half + Math.floor(hash(n + 50) * half * 2), len = 4 + Math.floor(hash(n + 70) * base * 0.5);
    for (let y = 0; y < len; y++) put(x + Math.round(Math.sin(y * 0.2 + t * 0.8 + n) * 0.6), y, y === len - 1 ? moss[0] : moss[1]);
  }
}

/** The Shrine's Main Hall atop the mountain: a stone base, white walls between dark posts, a green two-tier roof. */
function hall(cx, base, { stone, roof, plaster, torii: wood }, glow, night) {
  rect(cx - 12, base - 2, 25, 2, stone[2]); rect(cx - 12, base - 2, 25, 1, stone[1]);
  rect(cx - 9, base - 8, 19, 6, plaster[0]);
  for (let i = -9; i <= 9; i += 4) rect(cx + i, base - 8, 1, 6, wood[2]);
  if (night > 0.2) { rect(cx - 6, base - 6, 2, 2, glow[1]); rect(cx + 5, base - 6, 2, 2, glow[1]); rect(cx - 1, base - 6, 3, 4, glow[0]); }
  const tier = (y, w, h) => {
    for (let j = 0; j < h; j++) {
      const half = Math.round(w / 2 - j * 1.2);
      rect(cx - half, y + j, half * 2 + 1, 1, j === 0 ? roof[0] : j === h - 1 ? roof[2] : roof[1]);
    }
    put(cx - Math.round(w / 2) - 1, y - 1, roof[0]); put(cx + Math.round(w / 2) + 1, y - 1, roof[0]);
  };
  tier(base - 11, 30, 3);
  rect(cx - 6, base - 14, 13, 3, plaster[1]);
  tier(base - 17, 20, 3);
  rect(cx - 5, base - 18, 11, 1, roof[3]);
}

/** A lantern just lit: a wind chime, now and then, while it's on screen. */
function lightUp(id, x) {
  if (lit.has(id)) return;
  lit.add(id);
  const now = performance.now();
  if (still() || x < 0 || x >= W || now < chimeAt) return;
  chimeAt = now + 260;
  playSound(`furin-${lit.size % 3}`);
}

/* ---------- Shrine → Wastes ---------- */

const LAVA = ['#fff0a0', '#f8b830', '#f06820', '#b03010', '#6a1c14'].map(abgr);   // ungraded: it glows by itself

/** A sound once per film. */
function cue(id, sound = id) {
  if (cued.has(id)) return;
  cued.add(id);
  if (!still()) playSound(sound);
}

/** The rope bridge's planks below the cliff tops at `f`: a sag, a sway, and a dip under your Pokémon's weight. */
function bridgeDeck(f, u) {
  const [g0, g1] = SHRINE_WASTES.gorge;
  if (f <= g0 || f >= g1) return null;
  const arc = Math.sin(Math.PI * (f - g0) / (g1 - g0)), at = camX / TRIP;
  const on = smooth((at - g0) / 0.02) * (1 - smooth((at - g1 + 0.02) / 0.02));
  const sag = Math.min(H * 0.04, (g1 - g0) * TRIP * 0.09);
  const load = on * 2 * Math.exp(-(((u - mx - camX) / 12) ** 2));
  return (sag + load + Math.sin(clock * 2.3) * (0.5 + 1.3 * on)) * arc;
}

/** A dead tree: a bare trunk, crooked branches. */
function deadTree(x, base, h, col, k) {
  rect(x, base - h, 1, h, col[1]); put(x - 1, base - 1, col[2]); put(x + 1, base - 1, col[2]);
  const n = 2 + Math.floor(hash(k + 1.1) * 3);
  for (let i = 0; i < n; i++) {
    const by = base - Math.round(h * (0.4 + 0.5 * hash(k + i * 0.37))), dir = (i + Math.floor(hash(k) * 2)) & 1 ? 1 : -1;
    const len = 2 + Math.floor(hash(k + i * 0.71) * h * 0.3);
    for (let j = 1; j <= len; j++) put(x + dir * j, by - Math.round(j * 0.8), col[j === len ? 2 : 1]);
    if (len > 3) put(x + dir * len, by - len, col[2]);
  }
}

/** A boulder half sunk in the ground. */
function boulder(x, base, r, col) {
  for (let j = 0; j <= r; j++) {
    const half = Math.round(Math.sqrt(r * r - (r - j) ** 2) * 1.3);
    rect(x - half, base - r + j, half * 2 + 1, 1, j === 0 ? col[0] : j < r / 2 ? col[1] : col[2]);
  }
}

function paintShrineWastes(e) {
  const { pos, a, d, c, glow, t, night } = e;
  let { cam, camY } = e;
  const R = SHRINE_WASTES, morph = R.morph, [g0, g1] = R.gorge;
  // the land's three looks: the Shrine's, dried out half-way, the Wastes'
  const L = (key, k, m, x, y) => (m < 0.5 ? dd(a[key][k], d[key][k], m * 2, x, y) : dd(d[key][k], e.b[key][k], m * 2 - 1, x, y));
  const ahead = (x, lead) => morph(pos + ((x - mx) / W) * lead);
  const flick = (n) => Math.sin(t * 7 + n * 1.3) > 0.3;
  const lightK = 0.5 + 0.5 * night;

  // the volcano rises over the horizon, its red glow in the sky behind it, smoke trailing off its crater
  const grow = smooth((pos - 0.12) / 0.62);
  const [fu] = into('far', cam * 0.05);
  const vx = Math.round(W * (tall ? 0.8 : 0.84)) - fu, vh = Math.round(H * (tall ? 0.08 : 0.11) * (0.7 + 0.5 * grow));
  const vtop = Math.round(hz + 4 + (1 - grow) * H * 0.14 - vh);
  const glowK = grow * (0.35 + 0.65 * night), gr = Math.round(Math.max(W * 0.32, H * 0.17));
  for (let y = Math.max(0, vtop - gr); y < Math.min(H, hz + 8); y++) {
    for (let x = Math.max(0, vx - gr * 1.5); x < Math.min(W, vx + gr * 1.5); x++) {
      const q = Math.hypot((x - vx) / 1.5, (y - vtop) * 1.2) / gr;
      if (q < 1 && bay(x, y) < (1 - q) * 0.7 * glowK) buf[y * W + x] = q < 0.35 ? LAVA[3] : LAVA[4];
    }
  }
  for (let y = Math.max(0, vtop); y < Math.min(H, hz + 14); y++) {
    const half = Math.round(2 + ((y - vtop) / vh) * vh * 1.5);
    for (let x = Math.max(0, vx - half); x <= Math.min(W - 1, vx + half); x++) {
      const side = (x - vx) / Math.max(1, half);
      buf[y * W + x] = side < -0.3 ? c.volcano[0] : side < 0.45 ? dd(c.volcano[0], c.volcano[1], (side + 0.3) / 0.75, x, y) : c.volcano[2];
    }
  }
  if (grow > 0.05) {
    rect(vx - 2, vtop, 5, 1, LAVA[flick(0) ? 1 : 2]); put(vx - 1, vtop + 1, LAVA[3]); put(vx + 1, vtop + 1, LAVA[3]);
    if (night > 0.25) {   // lava runs down its flanks in the dark
      for (const s of [-1, 1]) for (let j = 1; j < vh * 0.7; j++) put(vx + s * Math.round(j * (0.55 + 0.25 * s) + Math.sin(j * 0.6)), vtop + 1 + j, j % 4 ? LAVA[3] : LAVA[2]);
    }
    const plume = Math.round(H * 0.24 * grow);
    for (let j = 1; j < plume; j++) {
      const y = vtop - j;
      if (y < 0) break;
      const cx = vx - j * 0.8 - Math.sin(j * 0.15 - t * 0.8) * 2, w = 1.5 + j * 0.3;
      for (let x = Math.floor(cx - w); x <= cx + w; x++) {
        const n = noise(x * 0.2 + t * 0.3, (y + t * 6) * 0.2), edge = Math.abs(x - cx) / w;
        if (n > 0.3 + edge * 0.55) put(x, y, j < 5 && night > 0.25 ? LAVA[4] : n > 0.7 ? c.smoke[0] : n > 0.5 ? c.smoke[1] : c.smoke[2]);
      }
    }
  }

  // the far ranges: the Shrine's misty green ridges, then dry, then the Wastes' ashen peaks
  for (let x = 0; x < W; x++) {
    const u = x + fu, m = ahead(x, 0.25);
    const top1 = Math.round(hz - H * 0.04 - H * 0.06 * (0.55 * Math.sin(u * 0.045 + 1) + 0.3 * Math.sin(u * 0.11 + 2) + 0.15 * Math.sin(u * 0.23)));
    const top2 = Math.round(hz - H * 0.01 - H * 0.035 * (0.6 * Math.sin(u * 0.07 + 4) + 0.4 * Math.sin(u * 0.17)));
    for (let y = Math.max(0, top1); y < hz + 12 && y < H; y++) {
      const peak = y < top1 + 2 && top1 < hz - H * 0.08;
      buf[y * W + x] = peak ? L('far', 2, m, x, y) : y >= top2 ? L('far', 0, m, x, y) : L('far', 1, m, x, y);
    }
  }

  // the hills
  const [hu] = into('hill', cam * 0.18);
  for (let x = 0; x < W; x++) {
    const u = x + hu, m = ahead(x, 0.4);
    const top = Math.round(hz + H * 0.01 - H * 0.035 * (0.6 * Math.sin(u * 0.04 + 3) + 0.4 * Math.sin(u * 0.09)));
    for (let y = Math.max(0, top); y < H; y++) buf[y * W + x] = L('hill', y === top ? 0 : y < top + 7 ? 1 : 2, m, x, y);
  }

  // the woods: the Shrine's cedars brown and die, dead trees and boulders take over
  const S = 0.45, [mu] = into('mid', cam * S, camY * S), MB = GY - Math.round(H * 0.07);
  const fAt = (u) => (u - mx) / (S * TRIP);
  const midTop = (u) => MB + Math.round(Math.sin(u * 0.13)) + camY;
  for (let x = 0; x < W; x++) {
    const u = x + mu, m = morph(fAt(u)), top = midTop(u);
    for (let y = Math.max(0, top); y < H; y++) buf[y * W + x] = L('floor', y - top < 3 ? 0 : 1, m, x, y);
  }
  for (let k = Math.floor((mu - 14) / 4); k <= Math.ceil((mu + W + 14) / 4); k++) {
    const u0 = k * 4 + Math.floor(hash(k) * 3), m = morph(fAt(u0));
    if (hash(k + 0.9) < m * 0.45) continue;   // they thin out
    const x = Math.round(u0 - mu), base = midTop(u0);
    if (hash(k + 0.5) > m * 1.1) {
      const set = m > 0.5 || hash(k + 0.6) < m * 2 ? d : a;   // a cedar, browning as the land dries
      const hc = 9 + Math.floor(hash(k + 0.3) * H * 0.07);
      for (let i = 0; i < hc; i++) {
        const half = Math.round(i * 0.3 - (i % 4) * 0.3 + 0.4), y = base - hc - 1 + i;
        for (let j = -half; j <= half; j++) put(x + j, y, j < 0 ? set.forest[1] : set.forest[2]);
        if (half > 1) put(x - half, y, set.forest[0]);
      }
      rect(x, base - 2, 1, 2, set.bark[2]);
    } else if (hash(k + 0.2) > 0.3) deadTree(x, base, 8 + Math.floor(hash(k + 0.4) * H * 0.07), c.dead, k);
    else boulder(x, base, 2 + Math.floor(hash(k + 0.7) * 3), c.rock);
  }

  // the Shrine's mist, thinning out behind you
  for (let y = Math.max(0, MB - Math.round(H * 0.14) + camY); y < GY + camY && y < H; y++) {
    const band = 1 - Math.abs((y - (MB + camY - H * 0.04)) / (H * 0.12));
    if (band <= 0) continue;
    for (let x = 0; x < W; x++) {
      const dm = 0.45 * (1 - smooth((pos + (x - mx) / (S * TRIP) - 0.02) / 0.22)) * band;
      if (dm <= 0.01) continue;
      const u = x + cam * 0.6, n = noise(u * 0.06 + t * 0.25, y * 0.2) * 0.75 + noise(u * 0.17 - t * 0.4, y * 0.45) * 0.25;
      if (n < dm) buf[y * W + x] = n < dm - 0.1 ? c.mist[0] : c.mist[1];
    }
  }

  [cam, camY] = into('road', cam, camY);
  // the road: the Shrine's gravel and moss, dry earth, the Wastes' ash, cut by the chasm; its cliffs are bare rock
  const uL = mx + g0 * TRIP, uR = mx + g1 * TRIP, rim = GY + camY;
  for (let x = 0; x < W; x++) {
    const u = x + cam, f = (u - mx) / TRIP, m = morph(f);
    const near = f > g0 - 0.07 && f < g1 + 0.07;
    const top = near && f > g0 && f < g1 ? rim : groundY(u) + camY;
    for (let y = Math.max(0, top); y < H; y++) {
      const dp = y - top;
      let col;
      if (near) {
        const jl = (hash(Math.floor(y / 2) + 0.17) - 0.5) * 0.01, jr = (hash(Math.floor(y / 2) + 0.61) - 0.5) * 0.01;
        const inL = g0 + dp * 0.0011 + jl, inR = g1 - dp * 0.0011 + jr;
        if (f > inL && f < inR) {   // down into the chasm: its far wall, lit red from the lava far below
          const q = dp / Math.max(1, H - rim);
          col = noise(u * 0.25, y * 0.35) > 0.55 ? c.rock[2] : c.rock[3];
          if (q < 0.12) col = c.rock[1];
          if (q > 0.5) col = dd(col, LAVA[q > 0.85 ? 3 : 4], ((q - 0.5) / 0.5) * 0.9, x, y);
          if (y >= H - 2) col = LAVA[Math.sin(t * 3 + u * 0.4) > 0.3 ? 1 : 2];
          buf[y * W + x] = col;
          continue;
        }
        if (dp > 2 && f > g0 - 0.01 - dp * 0.0008 && f < g1 + 0.01 + dp * 0.0008) {   // the cliff faces, in strata
          const edge = Math.min(Math.abs(f - inL), Math.abs(f - inR)) * TRIP;
          col = ((y + Math.round(Math.sin(u * 0.3) * 1.5)) / 3 | 0) & 1 ? c.rock[1] : c.rock[2];
          if (edge < 1.5) col = dp / (H - rim) > 0.45 ? LAVA[4] : c.rock[0];
          buf[y * W + x] = col;
          continue;
        }
      }
      if (dp === 0) col = L('path', 0, m, x, y);
      else if (dp < 3) col = L('path', 1, m, x, y);
      else if (dp === 3) col = L('path', 2, m, x, y);
      else col = L('ground', Math.min(3, Math.floor(((dp - 4) / Math.max(1, H - top - 4)) * 4)), m, x, y);
      if (m < 0.3 && dp > 0 && dp < 3 && Math.round(u) % 6 === 0) col = a.path[2];   // the Shrine's stepping stones
      if (m > 0.7 && dp > 4) {   // the Wastes' ground cracks, lava glowing in them
        const seg = Math.floor(u / 9), cy = top + 5 + Math.floor(hash(seg + 0.4) * (H - top - 6)) + Math.round(Math.sin(u * 0.8) * 0.6);
        if (y === cy && hash(seg + 0.8) < (m - 0.7) * 1.8) col = LAVA[flick(seg) ? 2 : 3];
      }
      buf[y * W + x] = col;
    }
  }

  // along it: moss and stone lanterns, the Shrine's last weathered torii, dry grass, dead shrubs, then rocks
  for (let k = Math.floor((cam - 10) / 9); k <= Math.ceil((cam + W + 10) / 9); k++) {
    const u0 = k * 9 + Math.floor(hash(k + 0.1) * 4), f = (u0 - mx) / TRIP;
    if ((f > g0 - 0.06 && f < g1 + 0.05) || hash(k + 0.8) > 0.7) continue;
    const x = Math.round(u0 - cam), y = groundY(u0) + camY, m = morph(f), kind = hash(k + 0.6);
    if (m < 0.3) {
      if (kind < 0.5) for (let i = -2; i <= 2; i++) put(x + i, y - 1 - (i & 1), c.moss[i & 1]);
      else { rect(x - 2, y - 2, 4, 2, c.stone[2]); rect(x - 1, y - 3, 2, 1, c.stone[1]); }
    } else if (m < 0.7) {
      if (kind < 0.6) for (let i = -3; i <= 3; i++) { const h = 2 + Math.round(hash(k * 3 + i) * 3); rect(x + i, y - h, 1, h, i & 1 ? d.fore[1] : d.fore[0]); }
      else for (let i = 1; i <= 3; i++) { put(x - i, y - i, c.dead[2]); put(x + i, y - i, c.dead[2]); put(x, y - i, c.dead[1]); }
    } else if (kind < 0.55) boulder(x, y, 2 + Math.floor(hash(k + 0.2) * 3), c.rock);
    else if (kind < 0.8) { rect(x, y - 4, 2, 4, c.dead[2]); put(x + 2, y - 3, c.dead[2]); }
  }
  for (let k = 1; k <= 3; k++) {
    const u0 = mx + k * 0.05 * TRIP, x = Math.round(u0 - cam);
    if (x < -8 || x > W + 8) continue;
    const [lx, ly] = lantern(x, groundY(u0) + camY, true, c, glow);
    halo(lx, ly, 6, lightK * (1 - k * 0.2), glow);
  }
  const th = Math.max(22, Math.round(Math.min(H * 0.2, W * 0.4))), uTorii = mx + 0.24 * TRIP, xt = Math.round(uTorii - cam);
  if (xt > -th && xt < W + th) torii(xt, groundY(uTorii) + camY, th, { torii: c.oldTorii });

  // the rope bridge: planks hung between two posts, the far rope behind your Pokémon, the near one in front
  const RH = Math.max(7, Math.round(H * 0.045));
  const rail = (y) => y - RH - Math.round((y - rim) * 0.3);
  if (uR - cam > -4 && uL - cam < W + 4) {
    for (let u = Math.ceil(uL); u <= uR; u++) {
      const x = Math.round(u - cam), y = groundY(u) + camY, i = u - Math.ceil(uL), ry = rail(y);
      if (i % 3 !== 2) { put(x, y, c.plank[i % 6 < 2 ? 0 : 1]); put(x, y + 1, c.plank[2]); }
      put(x, y + 2, c.rope[2]);
      put(x, ry, c.rope[1]);
      if (i % 6 === 0) for (let j = ry + 1; j < y; j++) put(x, j, c.rope[2]);
      fput(x, ry + 1, c.rope[0]);
      if (i % 12 === 3) for (let j = ry + 2; j < y; j++) fput(x, j, c.rope[1]);
    }
    for (const u of [uL - 2, uR + 1]) {
      const x = Math.round(u - cam);
      rect(x, rim - RH - 2, 2, RH + 5, c.plank[2]); put(x, rim - RH - 2, c.plank[0]);
      for (let j = rim - RH - 1; j < rim + 3; j++) fput(x + 1, j, c.plank[1]);
    }
  }
  // embers drifting up out of the chasm
  if (uR - cam > -10 && uL - cam < W + 10) {
    const span = H - rim + H * 0.3;
    for (let n = 0; n < 28; n++) {
      const u = uL + hash(n + 0.12) * (uR - uL), up = (t * (8 + hash(n + 0.44) * 10) + hash(n + 0.7) * span) % span;
      const x = Math.round(u - cam + Math.sin(t * 1.7 + n) * 2), y = Math.round(H - up), h = up / span;
      if (h > 0.85 && flick(n)) continue;
      (n & 1 ? fput : put)(x, y, LAVA[h < 0.3 ? 1 : h < 0.65 ? 2 : 3]);
    }
  }

  // the near grass along the bottom, drying and thinning, none over the chasm
  const [nu] = into('near', e.cam * 1.35);
  for (let x = 0; x < W; x++) {
    const u = x + nu, fn = (u - mx) / (1.35 * TRIP), m = morph(fn);
    if (fn > g0 - 0.015 && fn < g1 + 0.01) continue;
    const h = Math.round((H * 0.04 + hash(Math.floor(u)) * H * 0.05 + Math.sin(u * 0.21) * 2) * (1 - 0.55 * smooth((m - 0.5) / 0.5)));
    for (let y = Math.max(0, H - h); y < H; y++) {
      const dp = y - (H - h), k = dp < 2 ? 0 : dp < h * 0.45 ? 1 : dp < h * 0.8 ? 2 : 3;
      fput(x, y, L('fore', k, m, x, y));
    }
  }

  // ash starts to fall
  const ashK = smooth((pos - 0.2) / 0.35), wrap = W * 1.4;
  for (let n = 0; n < 80; n++) {
    if (hash(n + 0.21) > ashK) continue;
    const sp = 5 + hash(n + 0.5) * 7;
    const x = Math.round((((hash(n) * wrap - t * sp * 0.6 - cam * (0.3 + hash(n + 0.6) * 0.6)) % wrap) + wrap) % wrap - W * 0.2 + Math.sin(t * 1.5 + n) * 1.5);
    const y = Math.round((hash(n + 0.33) * H + t * sp) % H);
    (n & 1 ? fput : put)(x, y, c.ash[hash(n + 0.9) < 0.3 ? 0 : 1]);
  }

  if (pos > 0.22) cue('gust');
  if (pos > g0 - 0.01) cue('creak');
  if (pos > (g0 + g1) / 2) cue('creak-mid', 'creak');
  if (pos > 0.68) cue('rumble-far');
}
