/*
 * Journey films (docs/roadmap.md step 10): between a boss's evolution and the next biome's intro film, a short film of
 * the trip there. Your evolved Pokémon walks left to right along a side-on road in parallax while the land turns from
 * one biome into the next and the sky runs dusk → night → dawn, with one set piece mid-way.
 *
 * Like the descent (js/descent.js): low-res canvases (P CSS px a pixel) painted whole every frame, the Pokémon a real GIF
 * between them (`back`: sky and land; `front`: the near grass). Everything is a function of the camera, so the road never
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
import { spriteUrl, stageName } from './data/starters.js';
import { spriteFit } from './data/sprite-fit.js';
import { GRADES, gradeHex } from './daytime.js';

const DUR = 7600;   // ms from the first step to dawn; the walk carries on while lines are still being read
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bay = (x, y) => BAYER[(y & 3) * 4 + (x & 3)] / 16;
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const abgr = (h) => { const n = parseInt(h.slice(1), 16); return (0xff000000 | ((n & 255) << 16) | (n & 0xff00) | (n >> 16)) >>> 0; };
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

const ROUTES = { 'clearing>shrine': CLEARING_SHRINE };

/** Is there a film for this trip? */
export const hasTravel = (from, to) => !!ROUTES[`${from}>${to}`];

/* ---------- the engine ---------- */

let P = 4, W = 0, H = 0, tall = false, hz = 0, GY = 0, mx = 0, TRIP = 1;
let back = null, front = null, bimg = null, fimg = null, buf = null, fbuf = null;
let route = null, lit = new Set(), chimeAt = 0, belled = false;

/**
 * Play the trip from one biome to the next. Resolves once it's over (or skipped) and the screen is dark, with a close()
 * that takes the film away: call it once the next biome's map and intro film are up beneath it. `first` (the save's
 * travelSeen) adds the trip's lines.
 */
export async function travel({ from, to, starter, stage = 0, shiny = false, first = false, at = null }) {
  route = ROUTES[`${from}>${to}`];
  if (!route) return () => {};
  const scene = $('travel-scene'), mon = $('travel-mon');
  const name = stageName(starter, stage);
  const calm = still();
  scene.className = `travel-scene${calm ? ' still' : ''}`;
  scene.hidden = false;
  $('travel-log').hidden = true;
  mon.src = spriteUrl(starter, 'front', stage, shiny);
  mon.alt = name;
  preloadSounds(...route.sounds);
  lit = new Set(); chimeAt = 0; belled = false;
  layout();
  await loaded(mon);
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
  W = Math.ceil(innerWidth / P);
  H = Math.ceil(innerHeight / P);
  tall = H > W;
  hz = Math.round(H * (tall ? 0.56 : 0.5));
  GY = Math.round(H * (tall ? 0.8 : 0.78));
  mx = Math.round(W * (tall ? 0.4 : 0.36));
  TRIP = Math.round(Math.max(W, 150) * 2.1);   // ground pixels walked from the first step to dawn
  back = $('travel-back'); front = $('travel-front');
  for (const c of [back, front]) { c.width = W; c.height = H; c.style.width = `${W * P}px`; c.style.height = `${H * P}px`; }
  bimg = back.getContext('2d').createImageData(W, H);
  fimg = front.getContext('2d').createImageData(W, H);
  buf = new Uint32Array(bimg.data.buffer);
  fbuf = new Uint32Array(fimg.data.buffer);
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
  const cam = trip * TRIP;
  const camY = Math.round(route.rise(trip) * H * 0.75);
  const sky = skyAt(p);
  const e = {
    ms, t: walked / 1000, trip, cam, camY, night: sky.night,
    a: tone(route.a, sky.land), b: tone(route.b, sky.land), c: tone(route.shared, sky.land), glow: GLOW.map(abgr),
  };
  paintSky(e, sky);
  fbuf.fill(0);
  route.paint(e);
  back.getContext('2d').putImageData(bimg, 0, 0);
  front.getContext('2d').putImageData(fimg, 0, 0);
  // your Pokémon, its feet on the road, a step up and down as it walks
  const mon = $('travel-mon');
  const step = still() ? 0 : Math.floor(walked / 220) % 2;
  mon.style.top = `${(groundY(mx + cam) + camY - step) * P}px`;
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
  const f = (u - mx) / TRIP;
  return Math.round(GY - route.rise(f) * H + Math.sin(u * 0.07) * 0.8);
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
  const { cam, camY, trip, a, b, c, glow, t } = e;
  const R = CLEARING_SHRINE, morph = R.morph;
  // a far layer's look runs on the clock, the right edge a little ahead (true world positions would put the Shrine at
  // its edge from the start, it moves so little)
  const ahead = (x, lead) => morph(trip + ((x - mx) / W) * lead);
  const lightK = 0.5 + 0.5 * e.night;

  // the far mountains: snow-capped blue ranges, turning to the Shrine's misty green ridges
  const fu = cam * 0.05, fy = Math.round(camY * 0.05);
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
  const hu = cam * 0.18, hy = Math.round(camY * 0.18);
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
  const S = 0.45, mu = cam * S, my = Math.round(camY * S), MB = GY - Math.round(H * 0.07);
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
  const nu = cam * 1.35, ny = Math.round(camY * 1.35);
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
