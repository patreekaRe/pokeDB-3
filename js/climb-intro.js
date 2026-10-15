/*
 * The Sky Pillar's opening film (the user's ask, 2026-10-06): pressing Climb plays it before the first landing. The camera
 * starts at the summit, Rayquaza's green glow breathing round the jade crystal over its broken crown, and falls the tower's
 * whole height through every band of its sky (space, the aurora, the sunset over the cloud sea, the storm, the clouds) to
 * the grass. Since 2026-10-15 the tower is the Clearing's (js/hub-pillar.js): sage stone, jade runes, Rayquaza's wind. Then a cut
 * to just behind your Pokémon (its back sprite) walking a flagstone path between stone pillars to the tower's great arched
 * door (the user's reference: a hero from behind before a temple door, two glowing eyes over its arch). The eyes light,
 * the door grinds open on warm light, your Pokémon walks in and it goes dark.
 *
 * Like travel() it resolves dark with a close(): call that once the climb's map is up beneath. One low-res canvas painted
 * whole every frame with js/tower-art.js's sky and stone, so it matches the tower and the lobby.
 */
import { $, sleep } from './ui.js';
import { playSound, preloadSounds } from './audio.js';
import { spriteUrl, stageName } from './data/starters.js';
import { spriteFit } from './data/sprite-fit.js';
import { makeBuffer, flush, put, rect, disc, K, bay, hash, paintSky, stone, runeBand, raySeal, FH, TOP } from './tower-art.js';

// the pan dips to black over its last FADE_OUT ms, holds CUT, and the walk fades in over its first FADE_IN
const PAN = 4800, FADE_OUT = 950, CUT = 450, FADE_IN = 1200, WALK = 2900, OPEN = 1900, STEP = 150;
const T_WALK = PAN + CUT, T_EYES = T_WALK + WALK * 0.6, T_OPEN = T_WALK + WALK, T_END = T_OPEN + OPEN;
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const easeInOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2);
const easeOutQuad = (p) => 1 - (1 - p) ** 2;
const frac = (v) => v - Math.floor(v);

let P = 4, b = null;

/**
 * Play the film for the climber `starter` at `stage`. Resolves dark (or at once if skipped to the end) with a close()
 * that takes the film away.
 */
export async function climbIntro({ starter, stage = 0, shiny = false }) {
  const scene = $('climb-scene'), mon = $('climb-mon'), canvas = $('climb-canvas');
  const calm = still();
  scene.className = `travel-scene climb-scene${calm ? ' still' : ''}`;
  scene.hidden = false;
  mon.hidden = true;
  mon.src = spriteUrl(starter, 'back', stage, shiny);
  mon.alt = stageName(starter, stage);
  preloadSounds('gust', 'gate-hum', 'rumble-far', 'footstep', 'door-light');
  const layout = () => {
    P = innerWidth <= 720 ? 4 : 5;
    b = makeBuffer(canvas, Math.ceil(innerWidth / P), Math.ceil(innerHeight / P) + 1);   // a spare row for the pan's glide
    canvas.style.width = `${b.W * P}px`;
    canvas.style.height = `${b.H * P}px`;
  };
  layout();
  addEventListener('resize', layout);
  await (mon.complete && mon.naturalWidth ? null : new Promise(r => { mon.onload = mon.onerror = r; }));

  const start = performance.now();
  let raf = 0, over = false, cue = new Set();
  const once = (id, fn) => { if (!cue.has(id)) { cue.add(id); fn(); } };
  const draw = (now) => {
    const ms = calm ? T_OPEN - 1 : now - start;
    frame(ms, scene, mon, canvas, once);
    if (!calm && !over) raf = requestAnimationFrame(draw);
  };
  raf = requestAnimationFrame(draw);

  await new Promise(resolve => {
    const skip = (e) => { if (e.type === 'pointerup') done(); };
    const onKey = (e) => { if (['Enter', ' ', 'Escape'].includes(e.key)) { e.preventDefault(); done(); } };
    const timer = setInterval(() => { if (!calm && performance.now() - start >= T_END) done(); }, 100);
    const hold = calm ? setTimeout(() => done(), 2200) : 0;
    function done() {
      if (over) return;
      over = true;
      clearInterval(timer);
      clearTimeout(hold);
      fadeTo(null);
      scene.removeEventListener('pointerup', skip);
      removeEventListener('keydown', onKey, true);
      resolve();
    }
    scene.addEventListener('pointerup', skip);
    addEventListener('keydown', onKey, true);
  });

  scene.classList.add('dark');
  await sleep(calm ? 150 : 600);
  return () => {
    cancelAnimationFrame(raf);
    removeEventListener('resize', layout);
    scene.hidden = true;
    scene.className = 'travel-scene climb-scene';
    canvas.style.translate = '';
  };
}

/** The black over the film, at `k` (0-1), or null to hand it back to the stylesheet (the closing `.dark`). */
function fadeTo(k) {
  const dark = $('climb-scene').querySelector('.travel-dark');
  dark.style.opacity = k == null ? '' : String(k);
}

function frame(ms, scene, mon, canvas, once) {
  scene.classList.toggle('titled', ms > 350 && ms < PAN - 1100);
  if (ms < PAN) {
    once('gust', () => playSound('gust'));
    mon.hidden = true;
    fadeTo(easeInOut(clamp01((ms - (PAN - FADE_OUT)) / FADE_OUT)));
    paintPan(ms, canvas);
  } else if (ms < T_WALK) {
    fadeTo(1);
    canvas.style.translate = '';
    mon.hidden = true;
    paintPov(0, 0, 0, ms);
  } else {
    const fade = clamp01((ms - T_WALK) / FADE_IN);
    fadeTo(fade < 1 ? 1 - easeInOut(fade) : null);
    const walk = easeOutQuad(clamp01((ms - T_WALK) / (WALK * 0.95)));
    const eyes = clamp01((ms - T_EYES) / 900);
    const open = easeInOut(clamp01((ms - T_OPEN - 250) / (OPEN * 0.55)));
    if (eyes > 0) once('eyes', () => playSound('gate-hum'));
    if (ms > T_OPEN) once('door', () => playSound('rumble-far'));
    const doorY = paintPov(walk, eyes, open, ms);
    // the door grinds: a shake while it moves, then your Pokémon walks in and the light floods out
    const shaking = ms > T_OPEN + 250 && open < 1;
    canvas.style.translate = shaking ? `${Math.round(Math.random() * 2 - 1) * P}px ${Math.round(Math.random() * 2 - 1) * P}px` : '';
    const inside = clamp01((ms - T_OPEN - OPEN * 0.62) / (OPEN * 0.38));
    scene.classList.toggle('flood', inside > 0.35);
    scene.style.setProperty('--door', `${doorY * P}px`);
    const walking = walk < 0.985 || (inside > 0 && inside < 0.8);
    // a footfall each time the bob touches down, and the light's swell as it crosses the threshold
    if (walking) once(`step${Math.floor((ms - T_WALK) / (STEP * Math.PI))}`, () => playSound('footstep'));
    if (inside > 0) once('enter', () => playSound('door-light'));
    placeMon(mon, ms - T_WALK, walking, inside, doorY * P);
  }
  flush(b);
}

/** Your Pokémon from behind at the bottom of the screen, bobbing while it walks; `inside` (0-1) carries it into the door. */
function placeMon(mon, ms, walking, inside, doorY) {
  mon.hidden = false;
  const [, bottom, left, right] = spriteFit(mon.src);
  const pose = Math.max(mon.naturalWidth - left - right, 40);
  const room = Math.min(innerWidth * 0.46, innerHeight * 0.3);
  const s = Math.max(1, Math.min(6, Math.floor((room / pose) * 2) / 2));
  const foot = innerHeight * 0.95;
  mon.style.width = `${mon.naturalWidth * s}px`;
  mon.style.height = `${mon.naturalHeight * s}px`;
  mon.style.top = `${foot - (mon.naturalHeight - bottom) * s}px`;
  const bob = walking ? -Math.abs(Math.sin(ms / STEP)) * 3 * s / 2 : 0;
  const k = easeInOut(inside);
  mon.style.transform = `translateX(-50%) translateY(${bob - (foot - doorY) * k}px) scale(${1 - 0.72 * k})`;
  mon.style.opacity = String(1 - clamp01((inside - 0.75) / 0.25));
}

/* ---------- the pan: the summit down to the foot ---------- */

// The Clearing's tower (js/hub-pillar.js) stretched to the climb's 100 floors: an octagonal shaft, a face to the front,
// in four tiers that each lean in and step narrower where the stone's colour changes (js/tower-art.js's TIERS)
const SHAFT = [[0, 1], [30, 0.85], [60, 0.74], [90, 0.64]];
const EDGE = 0.414;   // the front face's corners, as a share of the shaft's half-width
const MOSS = ['#5a8a3e', '#76a84c', '#3e6a2c'].map(K);
const IVY = ['#2e5a24', '#4a8a34', '#6aac44'].map(K);
const PANE = ['#8af0d0', '#5ad8b0', '#2a8870', '#22343e', '#1a2430'].map(K);   // a window's jade light, sill to arch
const STAIR = ['#081014', '#10222a', '#1e4a46'].map(K);
const TREAD = ['#82e8c4', '#4ac8a0', '#2a8870'].map(K);
const CLOTH = ['#22885a', '#14583c', '#e8c050', '#f8e090'].map(K);
const WIND = ['#e0fff0', '#8af8c8', '#40e0a0'].map(K);
const SEA_PUFF = ['#fff0dc', '#ffd8b0', '#f8a888', '#c87890'].map(K);
const NIGHT_PUFF = ['#eef2fa', '#c8d4ec', '#98a8c8', '#6a7898'].map(K);
const GEM = ['#e8fff4', '#9af0c4', '#3aae7c', '#16603e'].map(K);
const RAY = ['#e0ffe8', '#a0ffc8', '#40e0a0', '#209868'].map(K);
const GROUND = 3;   // the world row the plinth stands on

let cam = 0;
const Y = (wy) => b.H - 1 - Math.round(wy - cam);   // a world row on the canvas

/** The shaft's half-width at world row `wy`, for a foot `hw` wide each side. */
function shaftHalf(hw, wy) {
  const f = wy / FH;
  let i = SHAFT.length - 1;
  while (i > 0 && f < SHAFT[i][0]) i--;
  const [at, k] = SHAFT[i], end = SHAFT[i + 1]?.[0] ?? TOP;
  return Math.round(hw * k * (1 - 0.055 * clamp01((f - at) / (end - at))));
}

/** One row of stone from x0 to x1, its last pixel `end` (the shade side). */
function span(wy, x0, x1, c, end = c) {
  const s = Y(wy);
  if (s < 0 || s >= b.H) return;
  rect(b, Math.round(x0), s, Math.round(x1) - Math.round(x0) + 1, 1, c);
  put(b, x1, s, end);
}

function paintPan(ms, canvas) {
  const { W, H } = b;
  // a slow drift off the summit that gathers speed, then brakes and settles at the foot as the black comes down
  const p = 1 - (1 - clamp01((ms - 300) / (PAN - 300)) ** 2.6) ** 2;
  const from = TOP * FH + 40 - H * 0.6, to = -Math.round(H * 0.18);
  // painted at a whole pixel, the canvas slid the rest by CSS (over its spare row), so the fall glides
  const exact = from + (to - from) * p, camY = Math.floor(exact), t = ms / 33;
  const dpr = devicePixelRatio;
  canvas.style.translate = `0 ${Math.round((exact - camY - 1) * P * dpr) / dpr}px`;
  cam = camY;
  paintSky(b, camY, t);
  const cx = W >> 1, hw = Math.max(13, Math.round(W * 0.2)), u = hw / 1.155;   // u: one of the 3D tower's units
  const seen = (w0, w1) => w1 >= camY && w0 <= camY + H;
  const base = GROUND + Math.round(0.38 * u);
  const f0 = Math.max(0, Math.floor(camY / FH)), f1 = Math.min(TOP, Math.ceil((camY + H) / FH));
  const rocks = seen(32 * FH, 60 * FH);
  if (rocks) floating(cx, hw, u, t, false);
  shaft(cx, hw, u, base);
  for (let f = f0; f <= f1; f++) {
    if (f < TOP) windows(cx, hw, u, base, f);
    if (f > 0) cornice(cx, hw, f, t);
  }
  if (camY < 30 * FH) columns(cx, hw, base);
  if (camY < base + 3.4 * u) porch(cx, u, t, ms);
  if (seen(30 * FH, TOP * FH)) wind(cx, hw, t);
  if (seen(26 * FH, 29 * FH)) collar(cx, hw, u, 27 * FH + 3, 16, 0.22, SEA_PUFF, t);
  if (seen(88 * FH, 91 * FH)) collar(cx, hw, u, 89.5 * FH, 11, 0.15, NIGHT_PUFF, -t);
  if (rocks) floating(cx, hw, u, t, true);
  if (seen(TOP * FH, TOP * FH + 3 * u)) crown(cx, u, ms);
}

/** The shaft's three faces, lit from the left: courses of blocks, the corners catching the light, moss and ivy at the foot. */
function shaft(cx, hw, u, base) {
  const { W, H } = b;
  for (let s = 0; s < H; s++) {
    const wy = cam + H - 1 - s;
    if (wy < base || wy >= TOP * FH) continue;
    const f = Math.floor(wy / FH), inF = wy % FH, S = stone(f, true), h = shaftHalf(hw, wy);
    const course = Math.floor(wy / 4), joint = wy % 4 === 0, foot = clamp01(1 - (wy - base) / (1.6 * u));
    const eL = Math.round(cx - EDGE * h), eR = Math.round(cx + EDGE * h);
    const mortar = [S.wall[2], S.wall[3], S.rune[0]];
    for (let x = Math.max(0, cx - h); x <= Math.min(W - 1, cx + h); x++) {
      const n = (x - cx) / h, face = x < eL ? 0 : x <= eR ? 1 : 2;
      const g = face === 1 ? (n + EDGE) / (2 * EDGE) : face === 0 ? (n + 1) / (1 - EDGE) : (n - EDGE) / (1 - EDGE);
      let c = g * 0.75 > bay(x, s) ? S.wall[face + 1] : S.wall[face];
      if (joint || (x + (course % 2) * 3 + face * 2 + 700) % 7 === 0) c = mortar[face];
      if (x === eL) c = S.cut[0];
      else if (x === eR) c = S.wall[3];
      else if (x === cx - h) c = S.cut[1];
      else if (x === cx + h) c = S.rune[0];
      if (foot > 0 && hash(x * 3.1 + wy * 0.7) < foot * 0.55) c = MOSS[hash(x * 1.7 + wy * 0.3) < 0.5 ? 0 : 1];
      else if (inF < 5 && hash(x * 3.1 + wy * 0.7) < 0.1) c = S.moss;
      b.px[s * W + x] = c;
    }
  }
  // ivy climbing from the foot, clear of the door
  const h0 = shaftHalf(hw, base);
  for (let i = 0; i < 6; i++) {
    const x0 = cx + (i % 2 ? 1 : -1) * Math.round(h0 * (0.32 + hash(i * 4.3) * 0.6)), top = base + (0.9 + hash(i * 2.9) * 1.5) * u;
    for (let wy = base; wy < top; wy++) {
      const s = Y(wy);
      if (s < 0 || s >= H) continue;
      const x = x0 + Math.round(Math.sin(wy / 6 + i * 2) * 1.2);
      put(b, x, s, IVY[0]);
      if (wy % 3 === 0) put(b, x + ((wy / 3) % 2 ? 1 : -1), s, IVY[hash(wy + i) < 0.5 ? 1 : 2]);
    }
  }
}

/** A floor's windows, one an arch on each face lit jade inside (the front's with a slit under it); none by the porch. */
function windows(cx, hw, u, base, f) {
  const sill = f * FH + 18, top = f * FH + 40;
  if (sill < base + 3.1 * u) return;
  const h = shaftHalf(hw, f * FH + 29), S = stone(f, true);
  const side = (EDGE + 1) / 2;
  pane(cx - side * h, h * 0.065, sill, top, S, 0);
  pane(cx, h * 0.12, sill, top, S, 0);
  pane(cx + side * h, h * 0.065, sill, top, S, 1);
  for (let wy = f * FH + 7; wy <= f * FH + 12; wy++) put(b, cx, Y(wy), PANE[wy > f * FH + 9 ? 3 : 2]);
}

function pane(xc, ww, sill, top, S, dim) {
  xc = Math.round(xc);
  const r = Math.max(1, Math.round(ww)), spring = top - r;
  for (let wy = sill; wy <= top + 1; wy++) {
    const s = Y(wy);
    if (s < 0 || s >= b.H) continue;
    const up = Math.max(0, wy - spring), outer = Math.sqrt(Math.max(0, (r + 1.2) ** 2 - up * up)), inner = Math.sqrt(Math.max(0, r * r - up * up));
    const k = (wy - sill) / (top - sill) * 4 + dim;
    for (let dx = -Math.floor(outer); dx <= outer; dx++) {
      const x = xc + dx;
      if (Math.abs(dx) <= inner && wy < top) put(b, x, s, PANE[Math.min(4, Math.floor(k) + (frac(k) > bay(x, s) ? 1 : 0))]);
      else put(b, x, s, dx > 0 ? S.cut[1] : S.cut[0]);
    }
  }
  span(sill - 1, xc - r - 2, xc + r + 2, S.cut[0], S.cut[2]);
  span(sill - 2, xc - r - 1, xc + r + 1, S.cut[2]);
}

/** Where floor `f` stands on the one below: a thin lip, or every ten a cornice over a band of jade runes and a gold ring. */
function cornice(cx, hw, f, t) {
  const wy = f * FH, S = stone(f - 1, true);
  if (f % 10) {
    const h = shaftHalf(hw, wy - 1) + 1;
    span(wy, cx - h, cx + h, S.cut[2]);
    span(wy + 1, cx - h, cx + h, S.cut[0], S.cut[2]);
    return;
  }
  const h = shaftHalf(hw, wy - 6);
  const s = Y(wy - 1);
  if (s > -6 && s < b.H) runeBand(b, cx - h - 1, cx + h + 2, s, S, true, t, f);
  span(wy, cx - h - 2, cx + h + 2, S.gold[1], S.gold[2]);
  span(wy, cx - h - 2, cx - h, S.gold[0], S.gold[1]);
  span(wy + 1, cx - h - 3, cx + h + 3, S.cut[2]);
  span(wy + 2, cx - h - 3, cx + h + 3, S.cut[1], S.cut[2]);
  span(wy + 3, cx - h - 4, cx + h + 4, S.cut[0], S.cut[2]);
}

/** The 1st tier's engaged columns on its outer corners, the shaft's edges as seen from the front. */
function columns(cx, hw, base) {
  for (let s = 0; s < b.H; s++) {
    const wy = cam + b.H - 1 - s;
    if (wy < base || wy >= 30 * FH - 6) continue;
    const h = shaftHalf(hw, wy), S = stone(Math.floor(wy / FH), true), foot = wy < base + 3;
    put(b, cx - h - 1, s, foot ? S.cut[2] : S.cut[1]);
    put(b, cx - h, s, S.cut[0]);
    put(b, cx + h, s, S.cut[1]);
    put(b, cx + h + 1, s, S.cut[2]);
    if (foot) { put(b, cx - h - 2, s, S.cut[2]); put(b, cx + h + 2, s, S.cut[2]); }
  }
}

/** The foot: a stepped plinth with a stair, the doorway onto the jade-lit stair inside under a pale arch and Rayquaza's
    ring, jade banners either side, moss and fallen blocks. Sized in the 3D tower's units, `u` pixels each. */
function porch(cx, u, t, ms) {
  const S = stone(0, true), at = (v) => GROUND + v * u;
  const rows = (v0, v1, fn) => { for (let wy = Math.round(at(v0)); wy < Math.round(at(v1)); wy++) fn(wy, (wy - at(v0)) / ((v1 - v0) * u)); };
  // the plinth's two octagonal steps, then the stair up the front
  for (const [v0, v1, half, lo, hi] of [[0, 0.2, 1.57, S.cut[2], S.cut[1]], [0.2, 0.38, 1.39, S.wall[1], S.cut[0]]]) {
    rows(v0, v1, (wy, k) => {
      const h = Math.round(half * u);
      span(wy, cx - h, cx + h, k > 0.7 ? hi : lo, S.wall[3]);
      span(wy, cx - h, cx - Math.round(h * EDGE), k > 0.7 ? S.cut[0] : S.wall[0]);
    });
  }
  rows(0, 0.25, (wy) => { const h = Math.round(0.6 * u); span(wy, cx - h, cx + h, (wy - GROUND) % 3 === 2 ? S.cut[0] : S.cut[1], S.cut[2]); });
  // the doorway: the stair inside climbing away, lit from above
  const dw = 0.33 * u, spring = at(1.7) - dw;
  for (let wy = Math.round(at(0.38)); wy <= at(1.7); wy++) {
    const up = Math.max(0, wy - spring), half = Math.sqrt(Math.max(0, dw * dw - up * up)), k = (wy - at(0.38)) / (1.32 * u);
    const s = Y(wy);
    if (s < 0 || s >= b.H) continue;
    const tread = (1 - k) * 24 - 1.4, i = Math.round(tread / 2);
    const lit = i >= 0 && i < 9 && Math.abs(tread - i * 2) < 12 / (u * 1.32) + 0.2;
    for (let x = Math.ceil(cx - half); x <= cx + half; x++) {
      const inset = (1 + i * 0.42) / 12 * 2 * dw;
      const c = lit && Math.abs(x - cx) <= dw - inset ? TREAD[i < 3 ? 0 : i < 6 ? 1 : 2]
        : STAIR[Math.min(2, Math.floor((1 - k) * 2 + (frac((1 - k) * 2) > bay(x, s) ? 1 : 0)))];
      put(b, x, s, c);
    }
  }
  // the pilasters, the arch over them and its keystone
  for (const sx of [-1, 1]) {
    const x = cx + sx * 0.42 * u, h = Math.max(1, Math.round(0.085 * u));
    rows(0.38, 1.48, (wy) => span(wy, x - h, x + h, S.cut[0], S.cut[1]));
    rows(0.38, 0.46, (wy) => span(wy, x - h - 1, x + h + 1, S.cut[2]));
    rows(1.46, 1.52, (wy) => span(wy, x - h - 1, x + h + 1, S.gold[1], S.gold[2]));
  }
  const ac = at(1.48), R = 0.42 * u, tube = Math.max(1, 0.09 * u);
  for (let wy = Math.round(ac); wy <= ac + R + tube; wy++) {
    const s = Y(wy);
    for (let x = Math.floor(cx - R - tube); x <= cx + R + tube; x++) {
      const d = Math.hypot(x - cx, wy - ac);
      if (Math.abs(d - R) > tube) continue;
      const seam = frac(Math.atan2(wy - ac, x - cx) / (Math.PI / 7)) < 0.12;
      put(b, x, s, seam ? S.cut[2] : x < cx ? S.cut[0] : S.cut[1]);
    }
  }
  const kh = Math.max(1, Math.round(0.08 * u));
  rows(1.84, 2.04, (wy) => span(wy, cx - kh, cx + kh, S.cut[0], S.cut[1]));
  rows(2.04, 2.08, (wy) => span(wy, cx - kh - 1, cx + kh + 1, S.gold[1]));
  raySeal(b, cx, Y(at(2.36)), Math.max(3, 0.29 * u), S, true, t);
  // the banners, stirring
  for (const sx of [-1, 1]) {
    const x0 = cx + sx * 0.78 * u, half = Math.max(2, Math.round(0.14 * u)), top = at(2.64), len = 1.5 * u, tail = 0.18 * u;
    for (let wy = Math.round(top - len); wy <= top; wy++) {
      const down = top - wy, sway = Math.round(Math.sin(ms / 500 + sx) * down / len * 1.5), x = Math.round(x0) + sway, s = Y(wy);
      for (let dx = -half; dx <= half; dx++) {
        if (down > len - tail && down - (len - tail) > (tail * Math.abs(dx)) / half) continue;   // the swallow tail
        const ring = Math.abs(Math.hypot(dx, down - 0.2 * u) - Math.max(1.2, 0.07 * u)) < 0.6;
        put(b, x + dx, s, Math.abs(dx) === half ? CLOTH[2] : ring ? CLOTH[3] : CLOTH[Math.abs(dx) > half / 2 ? 1 : 0]);
      }
    }
    span(top + 1, x0 - half - 1, x0 + half + 1, S.gold[1], S.gold[2]);
  }
  // moss and fallen blocks round the foot
  for (const [mx, r] of [[-1.3, 0.24], [-1.52, 0.17], [1.35, 0.22], [0.5, 0.12]]) mound(cx + mx * u, r * u);
  for (const [bx, s] of [[-1.45, 1], [1.62, 0.8]]) {
    const w = Math.round(0.36 * s * u), h = Math.round(0.24 * s * u);
    for (let wy = GROUND; wy < GROUND + h; wy++) span(wy, cx + bx * u - w / 2, cx + bx * u + w / 2, wy === GROUND + h - 1 ? S.cut[1] : S.wall[1], S.wall[3]);
  }
}

function mound(x0, r) {
  for (let wy = GROUND; wy <= GROUND + r * 0.6; wy++) {
    const half = r * Math.sqrt(Math.max(0, 1 - ((wy - GROUND) / (r * 0.6 + 0.5)) ** 2)), s = Y(wy);
    for (let x = Math.round(x0 - half); x <= x0 + half; x++) put(b, x, s, MOSS[x > x0 + half / 3 ? 2 : hash(x * 2.3 + wy) < 0.4 ? 1 : 0]);
  }
}

/** Stones floating round the 2nd tier, a few with a jade shard in them: the ones behind the shaft (`front` false) first. */
function floating(cx, hw, u, t, front) {
  for (let i = 0; i < 22; i++) {
    const a = hash(i * 1.9) * Math.PI * 2 + t * (0.0016 + hash(i * 3.3) * 0.0016), depth = Math.cos(a);
    if (depth > 0 !== front) continue;
    const wy = (33 + hash(i * 3.7) * 25) * FH + Math.sin(t / 26 + i * 1.7) * 0.12 * u, h = shaftHalf(hw, wy);
    const x = Math.round(cx + Math.sin(a) * h * (1.5 + hash(i * 5.1) * 0.4)), s = Y(wy);
    if (s < -8 || s > b.H + 8) continue;
    const S = stone(Math.floor(wy / FH), true), r = Math.max(1.4, (0.08 + hash(i * 2.9) * 0.13) * u * 1.2);
    disc(b, x, s, r + 0.7, S.cut[2]);
    disc(b, x - 0.5, s - 0.5, r, S.cut[1]);
    disc(b, x - 1, s - 1, r * 0.45, S.cut[0]);
    if (i % 3 === 0) { put(b, x, s - Math.ceil(r) - 1, S.jade[0]); put(b, x, s - Math.ceil(r), S.jade[1]); }
  }
}

/** A collar of cloud wrapped round the shaft at world row `wy`, its front half over the stone, turning with `t`. */
function collar(cx, hw, u, wy, n, size, C, t) {
  const h = shaftHalf(hw, wy), puffs = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2 + hash(i * 2.1) * 0.3 + t * 0.002;
    puffs.push({ a, d: Math.cos(a), r: (size + hash(i * 4.7) * size) * u * 1.3, y: wy + (hash(i * 6.1) - 0.5) * 0.35 * u, R: h + 2 + hash(i * 1.3) * 0.5 * u });
  }
  puffs.sort((p, q) => p.d - q.d);
  for (const { a, d, r, y, R } of puffs) {
    if (d < -0.15) continue;
    const x = cx + Math.sin(a) * R, s = Y(y);
    disc(b, x, s + r * 0.35, r * 1.05, C[3]);
    disc(b, x, s, r, C[2]);
    disc(b, x - r * 0.2, s - r * 0.25, r * 0.75, C[1]);
    disc(b, x - r * 0.35, s - r * 0.45, r * 0.35, C[0]);
  }
}

/** Rayquaza's wind: two jade streams spiralling up the tower above the 1st tier, in dashes that climb. */
function wind(cx, hw, t) {
  for (const k of [0, 1]) {
    let last = null;
    for (let s = b.H - 1; s >= 0; s--) {
      const wy = cam + b.H - 1 - s;
      if (wy < 30 * FH || wy > TOP * FH - 8) { last = null; continue; }
      const h = shaftHalf(hw, wy), a = k * Math.PI + wy / 200 * Math.PI * 2 + t * 0.012;
      const x = Math.round(cx + Math.sin(a) * (h + 4)), behind = Math.cos(a) < 0;
      const d = frac(wy / 46 - t * 0.05 + k * 0.5);
      if (d < 0.55 && (!behind || Math.abs(x - cx) > h)) {
        const c = behind ? WIND[2] : WIND[d < 0.07 ? 0 : d < 0.28 ? 1 : 2];
        if (!behind || bay(x, s) < 0.5) for (let xx = Math.min(x, last ?? x); xx <= Math.max(x, last ?? x); xx++) {
          if (!behind || Math.abs(xx - cx) > h) put(b, xx, s, c);
        }
      }
      last = x;
    }
  }
}

/** The summit over the 4th tier's cornice: a roof slab ringed with broken columns, an altar, the jade crystal turning over
    it in Rayquaza's breathing glow. */
function crown(cx, u, ms) {
  const S = stone(TOP, true), g = TOP * FH + 4, at = (v) => g + v * u;
  for (let wy = g; wy < at(0.22); wy++) {
    const h = Math.round(0.905 * u);
    span(wy, cx - h, cx + h, wy === g ? S.cut[2] : wy + 1 >= at(0.22) ? S.cut[0] : S.cut[1], S.cut[2]);
    span(wy, cx - h, cx - Math.round(h * EDGE), wy + 1 >= at(0.22) ? S.cut[0] : S.wall[0]);
  }
  const cols = Array.from({ length: 8 }, (_, i) => ({ a: i * Math.PI / 4, h: (0.25 + hash(i * 5.3 + 2) * 0.85) * u }));
  const column = ({ a, h }, back) => {
    const x = Math.round(cx + Math.sin(a) * 0.84 * u), w = Math.max(1, Math.round(0.07 * u)), y0 = Math.round(at(0.22));
    for (let wy = y0; wy < y0 + h; wy++) {
      if (wy > y0 + h - 2 && hash(wy + a * 9) < 0.5) continue;   // its broken top
      for (let dx = -w; dx <= w; dx++) put(b, x + dx, Y(wy), back ? S.wall[dx < 0 ? 2 : 3] : dx < 0 ? S.cut[0] : dx > 0 ? S.cut[2] : S.cut[1]);
    }
    if (h > 0.8 * u) span(y0 + h, x - w - 1, x + w + 1, back ? S.wall[2] : S.cut[0], back ? S.wall[3] : S.cut[2]);
  };
  for (const c of cols) if (Math.cos(c.a) < 0) column(c, true);
  for (let wy = Math.round(at(0.22)); wy < at(0.46); wy++) {
    const h = Math.round(0.49 * u);
    span(wy, cx - h, cx + h, wy + 1 >= at(0.46) ? S.cut[0] : S.wall[1], S.wall[3]);
  }
  for (const c of cols) if (Math.cos(c.a) >= 0) column(c, false);
  // the crystal, Rayquaza's glow breathing round it
  const cy = Y(at(0.85 + 0.08 * Math.sin(ms / 900))), R = Math.max(14, Math.round(0.95 * u)), k = 0.45 + 0.25 * Math.sin(ms / 260);
  for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
    const d = Math.hypot(dx, dy) / R, x = cx + dx, y = cy + dy;
    if (d < 1 && bay(x, y) < (1 - d) * k) put(b, x, y, RAY[d < 0.15 ? 0 : d < 0.35 ? 1 : d < 0.65 ? 2 : 3]);
  }
  const hw = Math.max(3, Math.round(0.28 * u)), hh = Math.max(5, Math.round(0.48 * u)), mid = Math.round(Math.sin(ms / 700) * hw * 0.6);
  for (let dy = -hh; dy <= hh; dy++) {
    const w = Math.round(hw * (1 - Math.abs(dy) / (hh + 0.5)));
    for (let dx = -w; dx <= w; dx++) put(b, cx + dx, cy + dy, Math.abs(dx) === w ? GEM[3] : dx === mid ? GEM[0] : dx < mid ? GEM[1] : GEM[2]);
  }
}

/* ---------- the walk up: a view from behind your Pokémon ---------- */

const ZD = 60, EYE = 6, WALL = 24, DW = 6, DS = 10, GO = ZD - 29;
const SKYC = ['#4a8ad8', '#6aa8e8', '#8cc4f0', '#b4dcf4'].map(K);
const HILL = ['#6a9ab0', '#5a889c'].map(K);
const GRASS = ['#78c858', '#5ab048', '#3e9040', '#2e7434'].map(K);
const PATH = ['#c4baa4', '#aca28c', '#8a8274', '#5e584e'].map(K);
const PIL = ['#d8d0c0', '#b8b0a0', '#968e80', '#6a6458', '#4a463e'].map(K);
const LEAF = ['#5aa048', '#3e8040', '#2a6034', '#1a4026'].map(K);
const LIGHT = ['#fffbe0', '#f8e098', '#f0b858', '#c07838', '#5a3420'].map(K);
const EYEC = ['#fffbd0', '#f4f070', '#c8e868', '#90c050'].map(K);
const PILLARS = [-10, 10].flatMap(X => [{ X, Z: ZD - 26 }, { X, Z: ZD - 12 }]).sort((a, c) => c.Z - a.Z);

/** Paint the approach with the camera `walk` (0-1) of the way up the path, the eyes `eyes` lit, the door `open`.
    Returns the door's foot, in canvas rows. */
function paintPov(walk, eyes, open, ms) {
  const { W, H, px } = b;
  const cz = GO * walk;
  const F = Math.min(W, H * 0.72) * 1.05, cx = W / 2, hz = Math.round(H * 0.46);
  const S = stone(0, true);
  // the sky and the far hills at the horizon
  for (let y = 0; y <= hz; y++) {
    const g = y / hz * 3, i = Math.min(2, Math.floor(g));
    for (let x = 0; x < W; x++) px[y * W + x] = frac(g) > bay(x, y) ? SKYC[i + 1] : SKYC[i];
  }
  for (let x = 0; x < W; x++) {
    const top = hz - Math.round(4 + 3 * Math.sin(x * 0.09 + 1) + 2 * Math.sin(x * 0.23));
    for (let y = top; y <= hz; y++) put(b, x, y, HILL[y - top < 1 ? 0 : 1]);
  }
  // the ground: grass, and the flagstone path widening into a plaza at the door, warm where its light spills out
  for (let y = hz + 1; y < H; y++) {
    const d = EYE * F / (y - hz + 0.5), Z = cz + d, step = d * d / (EYE * F), xs = d / F;
    for (let x = 0; x < W; x++) {
      const X = (x - cx) * d / F;
      const half = Z > ZD - 9 ? 9.5 : 4.5;
      let c;
      if (Z < ZD && Math.abs(X) < half) {
        const row = Math.floor(Z / 3), col = Math.floor((X + (row % 2) * 1.5) / 3);
        c = PATH[hash(row * 31 + col * 7) < 0.4 ? 1 : 0];
        if (frac(Z / 3) * 3 < Math.max(0.1, step) || frac((X + (row % 2) * 1.5) / 3) * 3 < xs) c = PATH[2];
        if (Math.abs(X) > half - Math.max(0.5, xs)) c = PATH[3];
        if (open > 0) {
          const m = open * clamp01(1 - (ZD - Z) / 16) * clamp01(1 - Math.abs(X) / (DW + 3));
          if (m > bay(x, y)) c = LIGHT[m > 0.6 ? 1 : 2];
        }
      } else {
        const h = hash(Math.floor(X * 1.4) * 7.3 + Math.floor(Z * 1.4) * 13.1);
        const far = clamp01((Z - cz) / 90);
        c = GRASS[Math.min(3, (h < 0.25 ? 1 : 0) + (far > bay(x, y) ? 1 : 0) + (Z > ZD ? 1 : 0))];
      }
      px[y * W + x] = c;
    }
  }
  // the tower's foot, the arched door and the eyes over it
  const s = F / (ZD - cz), yb = Math.round(hz + EYE * s);
  const x0 = Math.max(0, Math.floor(cx - WALL * s)), x1 = Math.min(W - 1, Math.ceil(cx + WALL * s));
  const one = 1 / s;
  for (let y = Math.max(0, Math.floor(yb - 150 * s)); y <= yb && y < H; y++) {
    const v = (yb - y) / s;
    for (let x = x0; x <= x1; x++) {
      const u = (x - cx) / s, au = Math.abs(u);
      if (au > WALL) continue;
      px[y * W + x] = towerPixel(u, au, v, one, x, y, S, eyes, open, ms);
    }
  }
  // ivy and bushes banked against the wall either side
  for (const side of [-1, 1]) {
    for (let i = 0; i < 6; i++) {
      const X = side * (13.5 + i * 2.1), h = 4 + i * 1.6 + hash(i * 3 + side) * 3, r = 2.2 + hash(i + side * 9) * 0.8;
      blob(cx + X * s, yb, r * s, h * s, i);
    }
  }
  // the stone pillars along the path, far ones first
  for (const pl of PILLARS) pillar(cx, hz, F, cz, pl);
  return yb;
}

function towerPixel(u, au, v, one, x, y, S, eyes, open, ms) {
  const r = v > DS ? Math.hypot(u, v - DS) : au;
  const inDoor = v <= DS ? au <= DW : r <= DW;
  if (inDoor) {
    const gap = open * DW;
    if (au < gap) {   // the light inside, brightest at the middle and the floor
      const m = clamp01(1 - au / (DW + 0.01)) * 0.7 + open * 0.4 + 0.05 * Math.sin(ms / 90 + v);
      return LIGHT[m > 0.95 ? 0 : m > 0.7 ? 1 : m > 0.45 ? 2 : m > bay(x, y) * 0.5 ? 3 : 4];
    }
    const w = au - gap;
    if (au > DW - one || (v > DS && r > DW - one)) return S.wood[3];
    if (w < one) return open > 0 ? S.wood[3] : S.dark;
    if (Math.abs(v - 3) < 0.5 || Math.abs(v - 8) < 0.5) return S.iron[Math.abs(v - 3) < 0.5 && v < 3 ? 0 : 1];
    if (frac(w / 2) * 2 < one) return S.wood[2];
    return S.wood[u < 0 ? 0 : 1];
  }
  const ring = DW + 2.4;
  if ((v <= DS && au <= ring) || (v > DS && r <= ring)) {   // the arch's dressed stones and its keystone
    if (v > DS + DW && au < 1.3) return S.cut[0];
    const seam = v <= DS ? frac(v / 2.5) * 2.5 < one : frac(Math.atan2(v - DS, u) / (Math.PI / 9)) * (Math.PI / 9) * r < one;
    if (seam || (v <= DS ? au : r) > ring - one) return S.cut[2];
    return S.cut[u < 0 ? 0 : 1];
  }
  // the eyes: two slits carved over the arch, slanting down to the middle like a scowl, glowing once they wake
  const a = (au - 1.6) / 7;
  if (a > 0 && a < 1) {
    const top = 23.4 + a * 2.8, bot = 21.8 + a * 0.9, mid = (top + bot) / 2, half = (top - bot) / 2 * Math.sqrt(Math.sin(Math.PI * a));
    const dv = Math.abs(v - mid);
    if (dv <= half) {
      if (eyes <= 0) return S.dark;
      const core = dv < half * 0.55;
      return eyes > bay(x, y) ? EYEC[core ? 0 : 1] : S.dark;
    }
  }
  // the round tower's stone, lit from the left, its courses and joints
  const n = u / WALL, g = (n + 1) * 1.75, i = Math.min(3, Math.floor(g));
  let c = frac(g) > bay(x, y) && i < 3 ? S.wall[i + 1] : S.wall[i];
  const course = Math.floor(v / 2.2);
  if (frac(v / 2.2) * 2.2 < one || frac((u + (course % 2) * 2.2 + 100) / 4.4) * 4.4 < one) c = n > 0.5 ? S.wall[3] : S.cut[2];
  if (v < 2.5 && hash(Math.floor(u * 2) * 3.7 + Math.floor(v * 2)) < 0.3) c = S.moss;
  // the eyes' glow on the stone round them
  if (eyes > 0) {
    const d = Math.hypot((au - 5.2) / 1.8, v - 23.6) / 5;
    if (d < 1 && eyes * (1 - d) * 0.6 > bay(x, y)) c = EYEC[d < 0.4 ? 2 : 3];
  }
  return c;
}

/** A clump of leaves standing on row `yb`, `rw` wide each side and `hh` tall, in canvas pixels. */
function blob(bx, yb, rw, hh, seed) {
  for (let y = Math.floor(yb - hh); y <= yb; y++) {
    const k = (yb - y) / hh;
    const half = rw * Math.sqrt(Math.max(0, 1 - (k * 1.05) ** 4)) * (1 + 0.25 * Math.sin(y * 0.7 + seed));
    for (let x = Math.floor(bx - half); x <= bx + half; x++) {
      const e = Math.abs(x - bx) / Math.max(1, half), sh = (x > bx ? 1 : 0) + (k < 0.35 ? 1 : 0) + (e > 0.8 ? 1 : 0);
      const c = hash(x * 1.3 + y * 7.1 + seed) < 0.18 ? LEAF[Math.max(0, sh - 1)] : LEAF[Math.min(3, sh)];
      put(b, x, y, c);
    }
  }
}

function pillar(cx, hz, F, cz, { X, Z }) {
  const dz = Z - cz;
  if (dz < 2.5) return;
  const s = F / dz, px = cx + X * s, gy = hz + EYE * s;
  for (let y = Math.floor(gy - 9 * s); y <= gy; y++) {
    const v = (gy - y) / s;
    const r = v < 0.9 ? 1.6 : v > 8.2 ? 1.75 : v > 7.6 ? 1.45 : 1.15;
    for (let x = Math.floor(px - r * s); x <= px + r * s; x++) {
      const n = (x - px) / (r * s), g = (n + 1) * 2, i = Math.min(4, Math.floor(g));
      let c = frac(g) > bay(x, y) && i < 4 ? PIL[i + 1] : PIL[i];
      if (Math.abs(v - 0.9) < 0.6 / s * 2 || Math.abs(v - 7.6) < 0.6 / s * 2) c = PIL[Math.min(4, i + 1)];
      put(b, x, y, c);
    }
  }
}
