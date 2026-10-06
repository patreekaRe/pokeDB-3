/*
 * The Sky Pillar's opening film (the user's ask, 2026-10-06): pressing Climb plays it before the first landing. The camera
 * starts at the summit, Rayquaza's green glow breathing over the jade roof, and falls the tower's whole height through
 * every band of its sky (space, the aurora, the sunset over the cloud sea, the storm, the clouds) to the grass. Then a cut
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
import { makeBuffer, flush, put, K, bay, hash, paintSky, stone, FH, TOP } from './tower-art.js';

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
    b = makeBuffer(canvas, Math.ceil(innerWidth / P), Math.ceil(innerHeight / P));
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
    paintPan(ms);
  } else if (ms < T_WALK) {
    fadeTo(1);
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

function paintPan(ms) {
  const { W, H } = b;
  // a slow drift off the summit that gathers speed, then brakes and settles at the foot as the black comes down
  const p = 1 - (1 - clamp01((ms - 300) / (PAN - 300)) ** 2.6) ** 2;
  const from = TOP * FH + 40 - H * 0.6, to = -Math.round(H * 0.18);
  const camY = Math.round(from + (to - from) * p), t = ms / 33;
  paintSky(b, camY, t);
  const cx = W >> 1, hw = Math.max(13, Math.round(W * 0.2)), R = hw + 8;
  const ROOF = ['#7ab890', '#4e8a68', '#346048'].map(K);
  for (let s = 0; s < H; s++) {
    const wy = camY + H - 1 - s;
    if (wy < 3) continue;
    if (wy >= TOP * FH) {   // the summit's jade roof
      const k = wy - TOP * FH;
      if (k >= R) continue;
      const half = Math.round((hw + 3) * (1 - k / R));
      for (let x = cx - half; x <= cx + half; x++) put(b, x, s, ROOF[x < cx - half / 2 ? 0 : x > cx + half / 3 ? 2 : 1]);
      continue;
    }
    const f = Math.floor(wy / FH), S = stone(f, true), inF = wy % FH;
    const big = f % 10 === 0 && f > 0 && inF < 5;
    if (inF < 3 || big) {   // the floor's ledge, wider every 10 floors
      const half = hw + (big ? 4 : 2), c = big ? S.cut[inF >= 3 ? 0 : 1] : S.slab[inF === 2 ? 0 : inF === 1 ? 1 : 3];
      for (let x = cx - half; x <= cx + half; x++) put(b, x, s, x > cx + half - 2 ? S.slab[3] : c);
      continue;
    }
    for (let x = cx - hw; x <= cx + hw; x++) {
      const n = (x - cx) / hw, g = (n + 1) * 1.75, i = Math.min(3, Math.floor(g));
      let c = frac(g) > bay(x, s) && i < 3 ? S.wall[i + 1] : S.wall[i];
      if (n < -0.86) c = S.cut[0];
      if (inF % 4 === 0 || (x + (Math.floor(inF / 4) % 2) * 3) % 7 === 0) c = n > 0.4 ? S.wall[3] : S.cut[2];
      if (inF < 6 && hash(x * 3.1 + wy * 0.7) < 0.12) c = S.moss;
      put(b, x, s, c);
    }
    // a window a floor, an arched slot; a few lit
    if (inF >= 22 && inF <= 38) {
      const lit = hash(f * 1.7) > 0.5, w = inF >= 37 ? 1 : 2;
      for (const ox of hw >= 18 ? [-Math.round(hw * 0.55), 0, Math.round(hw * 0.55)] : [0]) {
        for (let dx = -w; dx <= w; dx++) put(b, cx + ox + dx, s, lit && ox === 0 ? (inF < 28 ? S.glow : K('#f8d070')) : S.dark);
      }
    }
    // the door at its foot
    if (wy < 20) {
      for (let dx = -4; dx <= 4; dx++) {
        if (wy > 15 + (4 - Math.abs(dx)) * 0.9) continue;
        put(b, cx + dx, s, Math.abs(dx) === 4 ? S.cut[1] : S.dark);
      }
    }
  }
  // Rayquaza's glow breathing over the roof's tip
  const tipS = H - 1 - (TOP * FH + R + 3 - camY);
  if (tipS > -20 && tipS < H + 20) {
    const RAY = ['#e0ffe8', '#a0ffc8', '#40e0a0', '#209868'].map(K), k = 0.45 + 0.25 * Math.sin(ms / 260);
    for (let dy = -14; dy <= 14; dy++) for (let dx = -14; dx <= 14; dx++) {
      const d = Math.hypot(dx, dy) / 14, x = cx + dx, y = tipS + dy;
      if (d < 1 && bay(x, y) < (1 - d) * k) put(b, x, y, RAY[d < 0.15 ? 0 : d < 0.35 ? 1 : d < 0.65 ? 2 : 3]);
    }
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
