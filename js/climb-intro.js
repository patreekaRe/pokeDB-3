/*
 * The Sky Pillar's opening film (the user's ask, 2026-10-06): pressing Climb plays it before the first landing. The camera
 * starts at the summit, the jade crystal turning among broken columns in Rayquaza's green glow, and falls the tower's whole height through
 * every band of its sky (space, the aurora, the sunset over the cloud sea, the storm, the clouds) to the grass. Then a cut
 * to just behind your Pokémon (its back sprite) walking a flagstone path between stone pillars to the tower's great arched
 * door (the user's reference: a hero from behind before a temple door). Since 2026-10-15 it is the Clearing's tower's
 * porch (js/hub-pillar.js): Rayquaza's ring over the arch lights, the stone doors grind open on jade light, your Pokémon
 * walks in and it goes dark.
 *
 * Like travel() it resolves dark with a close(): call that once the climb's map is up beneath. One low-res canvas painted
 * whole every frame with js/tower-art.js's sky and stone, so it matches the tower and the lobby.
 */
import { $, sleep } from './ui.js';
import { playMusic, playSound, preloadSounds } from './audio.js';
import { spriteUrl, stageName } from './data/starters.js';
import { spriteFit } from './data/sprite-fit.js';
import { makeBuffer, flush, put, K, bay, hash, paintSky, stone, glow, crystal, FH, TOP } from './tower-art.js';

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
  playMusic('map4', { restart: true });   // the climb's song starts with the pan down the tower (the user's call, 2026-10-15); the map's showMap() then carries on with it
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

function paintPan(ms, canvas) {
  const { W, H } = b;
  // a slow drift off the summit that gathers speed, then brakes and settles at the foot as the black comes down
  const p = 1 - (1 - clamp01((ms - 300) / (PAN - 300)) ** 2.6) ** 2;
  const from = TOP * FH + 40 - H * 0.6, to = -Math.round(H * 0.18);
  // painted at a whole pixel, the canvas slid the rest by CSS (over its spare row), so the fall glides
  const exact = from + (to - from) * p, camY = Math.floor(exact), t = ms / 33;
  const dpr = devicePixelRatio;
  canvas.style.translate = `0 ${Math.round((exact - camY - 1) * P * dpr) / dpr}px`;
  paintSky(b, camY, t);
  const cx = W >> 1, hw = Math.max(13, Math.round(W * 0.2));
  for (let s = 0; s < H; s++) {
    const wy = camY + H - 1 - s;
    if (wy < 3) continue;
    if (wy >= TOP * FH) continue;   // the crown, painted after
    const f = Math.floor(wy / FH), S = stone(f, true), inF = wy % FH;
    const big = f % 10 === 0 && f > 0 && inF < 5;
    if (big && inF < 3) {   // every 10 floors a band of jade runes under a cornice, as the Clearing's tower's tiers
      for (let x = cx - hw; x <= cx + hw; x++) {
        const cell = Math.floor((x - cx + 600) / 4), col = (x - cx + 600) % 4, g = GLYPHS[Math.floor(hash(cell * 0.37 + f) * 3)];
        put(b, x, s, col < 3 && g[(2 - inF) * 3 + col] === '1' ? S.glyph : S.rune[1]);
      }
      continue;
    }
    if (inF < 3 || big) {   // the floor's ledge, wider every 10 floors
      const half = hw + (big ? 4 : 2), c = big ? S.cut[inF === 4 ? 0 : 1] : S.slab[inF === 2 ? 0 : inF === 1 ? 1 : 3];
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
    // a window a floor, an arched slot; a few lit jade
    if (inF >= 22 && inF <= 38) {
      const lit = hash(f * 1.7) > 0.5, w = inF >= 37 ? 1 : 2;
      for (const ox of hw >= 18 ? [-Math.round(hw * 0.55), 0, Math.round(hw * 0.55)] : [0]) {
        for (let dx = -w; dx <= w; dx++) put(b, cx + ox + dx, s, lit && ox === 0 ? (inF < 28 ? S.jade[0] : S.glyph) : S.dark);
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
  // the crown, as the Clearing's tower's: a cornice slab, broken columns round an altar (the far ones first), the jade
  // crystal turning over it in Rayquaza's glow
  const top = TOP * FH, row = (wy) => H - 1 - (wy - camY);
  const tipS = row(top + 22);
  if (tipS > -30 && tipS < H + 30) {
    const C = stone(TOP, true);
    const span = (wy0, h, x0, x1, paint) => {
      for (let wy = wy0; wy < wy0 + h; wy++) {
        const s = row(wy);
        if (s >= 0 && s < H) for (let x = x0; x <= x1; x++) put(b, x, s, paint(x, wy - wy0));
      }
    };
    const columns = (far) => {
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4;
        if ((Math.cos(a) < -0.01) !== far) continue;
        const x = cx + Math.round(Math.sin(a) * hw * 0.85), h = 5 + Math.round(hash(i * 4.7 + 2) * 15), shade = far ? 2 : Math.sin(a) > 0.3 ? 1 : 0;
        for (let k = -1; k <= 1; k++) {
          const broken = k ? Math.round(hash(i * 3 + k + 7) * 2) : 0;
          span(top + 4, h - broken, x + k, x + k, () => (k === -1 && !far ? C.cut[0] : C.cut[Math.min(2, shade + (k === 1 ? 1 : 0))]));
        }
        if (h > 15) span(top + 4 + h, 1, x - 2, x + 2, () => C.cut[shade]);
      }
    };
    span(top, 4, cx - hw - 4, cx + hw + 4, (x, k) => (k === 3 ? C.cut[0] : k === 0 ? C.slab[3] : x > cx + hw ? C.cut[2] : C.cut[1]));
    columns(true);
    span(top + 4, 5, cx - (hw >> 1), cx + (hw >> 1), (x, k) => (k === 4 ? C.cut[0] : x > cx + hw / 4 ? C.cut[2] : C.cut[1]));
    columns(false);
    const RAY = ['#e0ffe8', '#a0ffc8', '#40e0a0', '#209868'].map(K), k = 0.45 + 0.25 * Math.sin(ms / 260);
    for (let dy = -14; dy <= 14; dy++) for (let dx = -14; dx <= 14; dx++) {
      const d = Math.hypot(dx, dy) / 14, x = cx + dx, y = tipS + dy;
      if (d < 1 && bay(x, y) < (1 - d) * k) put(b, x, y, RAY[d < 0.15 ? 0 : d < 0.35 ? 1 : d < 0.65 ? 2 : 3]);
    }
    crystal(b, cx, tipS + Math.round(Math.sin(t / 20) * 1.5), C, true, t);
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
const LIGHT = ['#f0fff8', '#b8fae0', '#6ae0b8', '#2a9a7a', '#103a30'].map(K);   // the jade light inside
const BAN = ['#2a9a66', '#1c7a50', '#14583c'].map(K);
const GLYPHS = ['010111010', '010101010', '111010111'];   // tower-art.js's runes: a diamond, a ring and a bar
// Rayquaza's ring over the arch (sealArt()'s serpent, its y flipped to the wall's v, up), at RV, RR wide
const RV = 23.8, RR = 3.6, JADE_R = RR * 0.74;
const SERPENT = (() => {
  const P = [[-4, 3.8], [5.5, 4.4], [-5.5, -4.4], [4, -3.8]].map(([x, y]) => [x * JADE_R / 6.4, y * JADE_R / 6.4]);
  return Array.from({ length: 17 }, (_, i) => {
    const t = i / 16, w = [(1 - t) ** 3, 3 * (1 - t) ** 2 * t, 3 * (1 - t) * t * t, t ** 3];
    return [0, 1].map(k => w.reduce((sum, wi, j) => sum + wi * P[j][k], 0));
  });
})();
const nearSerpent = (u, dv, r) => SERPENT.some(([x, y]) => (x - u) ** 2 + (y - dv) ** 2 < r * r);
const PILLARS = [-10, 10].flatMap(X => [{ X, Z: ZD - 26 }, { X, Z: ZD - 12 }]).sort((a, c) => c.Z - a.Z);

/** Paint the approach with the camera `walk` (0-1) of the way up the path, the ring `eyes` lit, the door `open`.
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
  // the tower's foot, the arched door and Rayquaza's ring over it
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

function towerPixel(u, au, v, one, x, y, S, lit, open, ms) {
  const r = v > DS ? Math.hypot(u, v - DS) : au;
  const inDoor = v <= DS ? au <= DW : r <= DW;
  if (inDoor) {
    const gap = open * DW;
    if (au < gap) {   // the jade light inside, brightest at the middle and the floor
      const m = clamp01(1 - au / (DW + 0.01)) * 0.7 + open * 0.4 + 0.05 * Math.sin(ms / 90 + v);
      return LIGHT[m > 0.95 ? 0 : m > 0.7 ? 1 : m > 0.45 ? 2 : m > bay(x, y) * 0.5 ? 3 : 4];
    }
    // two leaves of dark stone, a line of jade runes across each, glowing once the ring wakes
    const w = au - gap;
    if (au > DW - one || (v > DS && r > DW - one)) return S.rune[2];
    if (w < one) return open > 0 ? S.rune[2] : S.dark;
    if (Math.abs(v - 3) < 0.5 || Math.abs(v - 8) < 0.5) return lit > bay(x, y) ? S.glyph : S.rune[0];
    if (frac(w / 2) * 2 < one) return S.rune[2];
    return S.rune[u < 0 ? 0 : 1];
  }
  const ring = DW + 2.4;
  if ((v <= DS && au <= ring) || (v > DS && r <= ring)) {   // the arch's dressed stones on its pilasters, gold at the spring
    if (v > DS + DW && au < 1.3) return v > DS + ring - 0.8 ? S.gold[1] : S.cut[0];   // the keystone, gold-capped
    if (v <= DS && v > DS - 1) return S.gold[v > DS - 0.4 ? 0 : 1];
    const seam = v <= DS ? frac(v / 2.5) * 2.5 < one : frac(Math.atan2(v - DS, u) / (Math.PI / 9)) * (Math.PI / 9) * r < one;
    if (seam || (v <= DS ? au : r) > ring - one) return S.cut[2];
    return S.cut[u < 0 ? 0 : 1];
  }
  // Rayquaza's ring: a pale rim round a jade disc, the gold serpent across it; it lights as you near the door
  const dr = Math.hypot(u, v - RV);
  if (dr <= RR) {
    if (dr > RR - one) return S.cut[2];
    if (dr > JADE_R) return u - (v - RV) < 0 ? S.cut[0] : S.cut[1];
    const on = lit > bay(x, y);
    if (nearSerpent(u, v - RV, Math.max(0.5, one * 0.75))) return S.gold[on ? 0 : 2];
    if (dr > JADE_R - one) return S.jade[2];
    return on ? S.jade[u - (v - RV) < -1.2 ? 0 : 1] : S.jade[2];
  }
  // jade banners either side, swallow-tailed, gold-edged, a gold ring at the head
  const du = au - 11.6, half = 1.9;
  if (Math.abs(du) <= half && v <= 27 && v >= 9 + 1.6 * (1 - Math.abs(du) / half)) {
    if (v > 26.2) return S.gold[1];
    if (Math.abs(du) > half - one) return S.gold[u < 0 ? 0 : 1];
    const hr = Math.hypot(du, v - 24.4);
    if (hr < 0.9 && hr > 0.9 - one * 1.3) return S.gold[0];
    return BAN[(u < 0 ? 0 : 1) + ((27 - v) / 18 > bay(x, y) + 0.4 ? 1 : 0)];
  }
  // a band of jade runes under the first tier's cornice
  if (v >= 28.2 && v < 32) {
    if (v >= 30.8) return v >= 31.4 ? S.cut[0] : S.cut[1];
    if (v < 28.6) return S.rune[2];
    const cell = Math.floor((u + 120) / 2.4), col = Math.floor(frac((u + 120) / 2.4) * 4), rw = Math.floor((30.8 - v) / 0.74);
    const g = GLYPHS[Math.floor(hash(cell * 0.37) * 3)];
    return col < 3 && rw < 3 && g[rw * 3 + col] === '1' ? S.glyph : S.rune[1];
  }
  // the tower's stone, lit from the left, its courses and joints
  const n = u / WALL, g = (n + 1) * 1.75, i = Math.min(3, Math.floor(g));
  let c = frac(g) > bay(x, y) && i < 3 ? S.wall[i + 1] : S.wall[i];
  const course = Math.floor(v / 2.2);
  if (frac(v / 2.2) * 2.2 < one || frac((u + (course % 2) * 2.2 + 100) / 4.4) * 4.4 < one) c = n > 0.5 ? S.wall[3] : S.cut[2];
  if (v < 2.5 && hash(Math.floor(u * 2) * 3.7 + Math.floor(v * 2)) < 0.3) c = S.moss;
  // the ring's glow on the stone round it
  if (lit > 0) {
    const d = dr / (RR + 5);
    if (d < 1 && lit * (1 - d) * 0.6 > bay(x, y)) c = d < 0.6 ? S.glyph : S.jade[1];
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
