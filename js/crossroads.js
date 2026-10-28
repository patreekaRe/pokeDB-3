/*
 * The crossroads (roadmap item 19): after a boss's rewards, where the next slot has two roads (CROSSROADS), the path forks
 * at dusk on the edge of the woods, just before the journey film walks on from it.
 *
 * One low-res canvas (P CSS px a pixel), painted once a layout (paintBase()) with fireflies drawn over it each frame: the
 * path from your Pokémon's feet splits round a signpost into two roads, each running into a gap in the treeline that shows
 * a glimpse of where it goes (sceneShot() of the biome's first place, at dusk). Above each road a card names it: its sign,
 * its bosses (silhouettes until the Pokédex has met them) and its wilds' types. A tap on a card or a road picks it (its
 * arm of the signpost lights up), a second tap or the button takes it, and your Pokémon walks off up that road as the
 * dark comes down. Or walk there yourself (the camera stays still): tap the ground (or hold and drag, or the arrow keys / WASD), and walking onto a
 * road picks it, on up it takes it. Taking one asks "Are you sure you want to enter the X?" first. Enter takes the picked one. There's no way out without choosing.
 */
import { $, el, sleep, confirmDialog } from './ui.js';
import { playSound, preloadSounds } from './audio.js';
import { sceneShot } from './scene.js';
import { getSave } from './storage.js';
import { BIOMES_BY_ID, ENEMY_DEFS } from './data/enemies.js';
import { TYPES } from './data/cards.js';
import { spriteUrl, stageName } from './data/starters.js';
import { spriteFit } from './data/sprite-fit.js';
import { meowthTalk } from './meowth.js';
import { leadersOf, spriteOf, gymWins } from './data/gym.js';
import { typeText } from './type-badge.js';

const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bay = (x, y) => BAYER[(y & 3) * 4 + (x & 3)] / 16;
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const abgr = (h) => { const n = parseInt(h.slice(1), 16); return (0xff000000 | ((n & 255) << 16) | (n & 0xff00) | (n >> 16)) >>> 0; };
const pal = (list) => list.map(abgr);
const smooth = (v) => { v = Math.max(0, Math.min(1, v)); return v * v * (3 - 2 * v); };
/** Down a palette by `t` (0-1), dithered between its steps. */
const ramp = (list, t, x, y) => { const f = Math.max(0, Math.min(0.999, t)) * (list.length - 1), i = Math.floor(f); return list[f - i > bay(x, y) ? i + 1 : i] ?? list[i]; };

// dusk, as the journey films open (js/travel.js's SKY.dusk), the land backlit by the low sun
const SKY = pal(['#282c68', '#5a3c80', '#a8507a', '#e8705e', '#f8a858']);
const SUN = pal(['#fff4c8', '#ffd890', '#fcb070']);
const HILLS = pal(['#8a5078', '#6a4068']);
const PINES = pal(['#4a3456', '#33263e']);
const GRASS = pal(['#6a7048', '#5a6a40', '#4a5e36', '#3e502e', '#324426']);
const TUFT = abgr('#2a3420');
const PATH = pal(['#e0b07a', '#c4925e', '#8e6844', '#5e4430']);
const TRUNK = pal(['#5a4030', '#3e2c22', '#281c16']);
const LEAF = pal(['#36402e', '#2a3226', '#1e261c']);
const RIM = abgr('#a86a48');
const POST = pal(['#c08848', '#8a5a2c', '#5a3818']);
const INK = abgr('#1a1008');
const GOLD = pal(['#fff0a0', '#f8c850']);
const FLY = pal(['#fffad0', '#f8d860', '#a88830']);
// each road's arm of the signpost in its biome sign's colours (css/screens.css's .biome-sign): plank, rim
export const ARMS = { clearing: ['#b0682c', '#d89050'], shrine: ['#6f7f62', '#9aae84'], ruins: ['#4f7472', '#8cc8c0'], wastes: ['#54403a', '#e0602a'], thornwood: ['#3e5a2a', '#8cc850'], savanna: ['#a8743a', '#f0c040'] };

let P = 4, W = 0, H = 0, tall = true, hz = 0, fy = 0, fx = 0, d = 0, gw = 0, gh = 0, bw = 0;
let canvas = null, ctx = null, img = null, buf = null, shots = [];
let roads = [], picked = -1, walking = false, asking = false;
// the painting is split into layers wider than the screen (M pixels each side) that a sideways camera offset `cam`
// would slide apart; the camera stays still (the user's call, 2026-10-11: the parallax felt wrong), so `cam` is 0
let M = 0, LW = 0, far = null, ground = null, trees = null, cam = 0;
// your Pokémon on the ground, in the painting's pixels with the camera at rest; `route` the points it's walking to
let mx = 0, my = 0, route = [], keys = new Set(), facing = 'back', scale0 = 1, monTall = 0, startY = 0;

/** How near row y is, 0 at the horizon and 1 at the bottom: the size of things and how fast they slide there. */
const near = (y) => Math.max(0.01, (y - hz) / (H - hz));
const K = () => W * 0.4;   // ground depth per 1/near, so walking up a road takes longer the further it goes
const toWorld = (x, y) => { const f = near(y); return [(x - fx) / f, K() / f]; };
const fromWorld = (X, Z) => { const f = K() / Z; return [fx + X * f, hz + f * (H - hz)]; };

function layout() {
  const fr = H ? [(mx - fx) / W, my / H] : null;
  P = innerWidth <= 720 ? 4 : 5;
  W = Math.ceil(innerWidth / P);
  H = Math.ceil(innerHeight / P);
  tall = H > W * 1.1;
  hz = Math.round(H * (tall ? 0.42 : 0.5));
  fy = Math.round(H * (tall ? 0.63 : 0.72));
  fx = W >> 1;
  d = Math.round(W * (tall ? 0.27 : 0.2));
  gw = Math.round(W * (tall ? 0.4 : 0.24));
  gh = Math.round(gw * 0.62);
  bw = Math.round(W * (tall ? 0.2 : 0.11));
  M = Math.ceil(W * 0.4);
  LW = W + M * 2;
  startY = Math.round(H * (tall ? 0.86 : 0.9));
  if (fr) { mx = fx + fr[0] * W; my = fr[1] * H; } else { mx = fx; my = startY; }
  canvas = $('xr-canvas');
  canvas.width = W; canvas.height = H;
  canvas.style.width = `${W * P}px`; canvas.style.height = `${H * P}px`;
  ctx = canvas.getContext('2d');
  img = ctx.createImageData(W, H);
  buf = new Uint32Array(img.data.buffer);
  shots = roads.map(id => {
    const shot = sceneShot(id, { w: gw, h: gh, at: 0.62, time: 'dusk', where: { progress: 0, stage: 0, step: null } });
    return new Uint32Array(shot.getContext('2d').getImageData(0, 0, gw, gh).data.buffer);
  });
  paintBase();
  place();
}

const vx = (i) => fx + (i ? d : -d);   // where road i meets the horizon

/** The road's middle and half-width on row y: one path below the fork, two above it (`side` -1 left, 1 right). */
function pathAt(y, side) {
  const fhw = bw * 0.6;
  if (y >= fy) return [fx, fhw + (bw - fhw) * ((y - fy) / Math.max(1, H - fy))];
  const t = (y - hz) / (fy - hz), v = vx(side > 0 ? 1 : 0), join = fx + side * fhw * 0.45;
  return [v + (join - v) * t ** 1.5, 0.6 + (fhw * 0.62 - 0.6) * t ** 1.4];
}

const putter = (layer, rows, y0) => (x, y, c) => { x = Math.round(x) + M; y -= y0; if (x >= 0 && x < LW && y >= 0 && y < rows) layer[y * LW + x] = c; };

function paintBase() {
  far = new Uint32Array(LW * hz);
  ground = new Uint32Array(LW * (H - hz));
  trees = new Uint32Array(LW * H);
  const sky = putter(far, hz, 0), set = putter(ground, H - hz, hz), front = putter(trees, H, 0);
  // the sky, and the sun sinking between the two roads
  const sr = Math.max(4, Math.round(W * (tall ? 0.09 : 0.05))), sy = hz - Math.round(sr * 0.3);
  for (let y = 0; y < hz; y++) for (let x = -M; x < W + M; x++) {
    let c = ramp(SKY, y / hz, x, y);
    const r = Math.hypot(x - fx, (y - sy) * 1.1);
    if (r < sr) c = SUN[r < sr * 0.6 ? 0 : r < sr * 0.85 ? 1 : 2];
    else if (r < sr * 2.2 && (1 - (r - sr) / (sr * 1.2)) > bay(x, y) + 0.35) c = SUN[2];
    sky(x, y, c);
  }
  // far hills, then each road's glimpse of its biome through the gap it makes
  for (let x = -M; x < W + M; x++) {
    const top = hz - Math.round(3 + 3 * Math.sin(x * 0.09) + 2 * Math.sin(x * 0.23 + 1));
    for (let y = top; y < hz; y++) sky(x, y, HILLS[y - top < 2 ? 0 : 1]);
  }
  shots.forEach((shot, i) => {
    const x0 = vx(i) - (gw >> 1), y0 = hz - Math.round(gh * 0.62), cy = hz - gh * 0.22;
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
      const X = x0 + x, Y = y0 + y;
      const dx = (X - vx(i)) / (gw / 2), dy = (Y - cy) / (gh * 0.5);
      if ((1 - dx * dx - dy * dy) * 4 > bay(X, Y)) sky(X, Y, shot[y * gw + x]);
    }
  });
  // two rows of pines, parting where each road runs through them
  const gap = (x, wide) => Math.min(...roads.map((_, i) => Math.abs(x - vx(i)) / (gw * wide)));
  [[PINES[0], 4, 10, 0.36], [PINES[1], 7, 15, 0.5]].forEach(([c, step, tallest, wide], row) => {
    for (let p = -6 - M, k = 0; p < W + M + 6; p += step * (0.7 + hash(k + row * 97) * 0.6), k++) {
      const edge = 1 + 1.2 * smooth(Math.abs(p - fx) / (W * 0.5) - 0.4);
      const ph = Math.round((tallest * 0.55 + hash(k * 3 + row) * tallest * 0.6) * Math.min(edge, 2) * smooth(gap(p, wide) * 1.2 - 0.25));
      if (ph < 2) continue;
      for (let y = 0; y < ph; y++) {
        const half = Math.floor((y / ph) * step * 0.55 + (y % 3 === 2 ? 1 : 0));
        for (let x = -half; x <= half; x++) sky(Math.round(p) + x, hz - ph + y + row, c);
      }
    }
  });
  // the meadow, the roads through it and their pebbles
  for (let y = hz; y < H; y++) {
    const t = (y - hz) / (H - hz);
    for (let x = -M; x < W + M; x++) set(x, y, ramp(GRASS, t, x, y));
  }
  for (let k = 0; k < LW * H * 0.012; k++) {
    const x = Math.floor(hash(k * 1.7) * LW) - M, y = hz + 2 + Math.floor(hash(k * 2.3 + 9) ** 0.7 * (H - hz - 2)), h = 1 + Math.floor(((y - hz) / (H - hz)) * 3);
    for (let i = 0; i < h; i++) set(x + (i === h - 1 && k & 1 ? 1 : 0), y - i, TUFT);
  }
  for (let y = hz + 1; y < H; y++) {
    const t = (y - hz) / (H - hz);
    for (const side of y >= fy ? [0] : [-1, 1]) {
      const [cx, hw] = pathAt(y, side || 1);
      for (let x = Math.floor(cx - hw); x <= Math.ceil(cx + hw); x++) {
        const off = Math.abs(x + 0.5 - cx);
        if (off > hw) continue;
        const c = hw > 2 && off > hw - 1 ? PATH[2] : hash(x * 7.3 + y * 131.1) > 0.965 ? PATH[3] : ramp(PATH.slice(0, 2), 0.3 + t * 0.5 + (off / hw) * 0.4, x, y);
        set(x, y, c);
      }
    }
  }
  for (let x = -5; x <= 5; x++) if (Math.abs(x) < 4 || bay(fx + x, fy) > 0.5) set(fx + x, fy + 1, PATH[3]);   // the signpost's shadow
  // two old trees framing the view, lit at their edges by the sun
  for (const s of [-1, 1]) {
    const tx = s < 0 ? 0 : W - 1, tw = Math.max(3, Math.round(W * 0.045)), foot = Math.round(H * (tall ? 0.6 : 0.7));
    for (let y = 0; y <= foot; y++) {
      const flare = y > foot - 5 ? Math.round((5 - (foot - y)) * 0.8) : 0, lean = Math.round(Math.sin(y * 0.05) * 1.5);
      for (let x = -tw - flare; x <= tw + flare; x++) {
        const k = x * -s, edge = tw + flare - k;   // k grows towards the sun
        const c = edge < 1 ? RIM : edge < 2 && bay(x, y) > 0.4 ? RIM : hash(x * 3.7 + Math.floor((y + x * 2) / 4) * 1.3) > 0.82 ? TRUNK[2] : TRUNK[k > 0 ? 0 : 1];
        front(tx + x + lean, y, c);
      }
    }
    const blobs = [[0, 0.02, 0.22], [0.12, 0.08, 0.15], [0.2, 0.0, 0.14], [0.05, 0.16, 0.13], [0.27, 0.05, 0.1]];
    for (const [ox, oy, r] of blobs) {
      const bx = tx - s * ox * W, by = oy * H, R = r * Math.min(W, H * 0.7);
      for (let y = Math.floor(by - R); y <= by + R; y++) for (let x = Math.floor(bx - R); x <= bx + R; x++) {
        const q = Math.hypot(x - bx, y - by) / R;
        if (q > 1 - hash(x * 3.1 + y * 5.7) * 0.12) continue;
        const inner = (x - bx) * -s / R + (y - by) / R;   // the side facing the sun
        front(x, y, q > 0.84 && inner > 0.5 ? RIM : ramp(LEAF, q * 0.6 + (1 - inner) * 0.2, x, y));
      }
    }
  }
}

/** The signpost, slid `ox` pixels by the camera: the post and one arm a road, the picked one lit. */
function paintPost(ox) {
  const set = (x, y, c) => { x += ox; if (x >= 0 && x < W && y >= 0 && y < H) buf[y * W + x] = c; };
  const sh = Math.round(H * (tall ? 0.13 : 0.17)), top = fy - sh, arm = Math.round(W * (tall ? 0.15 : 0.09));
  for (let y = top - 1; y <= fy; y++) for (let x = -2; x <= 2; x++) set(fx + x, y, Math.abs(x) === 2 || y === top - 1 ? INK : POST[x < 0 ? 0 : x === 0 ? 1 : 2]);
  roads.forEach((id, i) => {
    const s = i ? 1 : -1, y0 = top + 2 + i * 8, [plank, rim] = (ARMS[id] || ARMS.clearing).map(abgr), lit = picked === i;
    for (let k = 1; k <= arm; k++) {
      const tip = arm - k < 3 ? 3 - (arm - k) : 0;   // the arrow's point
      for (let y = y0 - 1 + tip; y <= y0 + 6 - tip; y++) {
        const X = fx + s * (2 + k), edge = y === y0 - 1 + tip || y === y0 + 6 - tip || k === arm;
        set(X, y, edge ? (lit ? GOLD[1] : INK) : y === y0 ? rim : (lit && (k + y) % 5 === 0 ? rim : plank));
      }
    }
    set(fx + s * 3, y0 + 2, INK);   // its nail
    if (lit) for (let k = 0; k <= arm - 3; k++) { set(fx + s * (2 + k), y0 - 2, GOLD[0]); set(fx + s * (2 + k), y0 + 7, GOLD[0]); }
  });
}

const flies = Array.from({ length: 18 }, (_, i) => [hash(i * 3.3), hash(i * 7.1 + 2), hash(i * 1.9 + 5) * 6.28]);
const dim = (c) => (0xff000000 | ((c >>> 1) & 0x7f7f7f) + ((c >>> 2) & 0x3f3f3f)) >>> 0;

function frame(now) {
  const sf = Math.round(cam * 0.06), st = Math.round(cam * 1.0);
  for (let y = 0; y < hz; y++) buf.set(far.subarray(y * LW + M + sf, y * LW + M + sf + W), y * W);
  for (let y = hz; y < H; y++) {
    const o = Math.max(-M, Math.min(M, Math.round(cam * near(y)))), r = (y - hz) * LW + M + o;
    buf.set(ground.subarray(r, r + W), y * W);
  }
  // your Pokémon's shadow on the grass
  const f = near(my), sx = mx - cam * f, rx = Math.max(2, monWidth() * 0.3 / P), ry = Math.max(1, rx * 0.3);
  for (let y = Math.floor(my - ry); y <= my + ry; y++) for (let x = Math.floor(sx - rx); x <= sx + rx; x++) {
    const q = ((x + 0.5 - sx) / rx) ** 2 + ((y + 0.5 - my) / ry) ** 2;
    if (q < 1 && x >= 0 && x < W && y >= hz && y < H && (q < 0.6 || bay(x, y) > 0.5)) buf[y * W + x] = dim(buf[y * W + x]);
  }
  paintPost(-Math.round(cam * near(fy)));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = trees[y * LW + M + x + st];
    if (c) buf[y * W + x] = c;
  }
  const t = still() ? 0 : now;
  for (const [fxr, fyr, ph] of flies) {
    const y = Math.round(hz - 6 + fyr * (fy - hz + 12) + Math.cos(t * 0.0007 + ph * 2) * 3);
    const x = Math.round(fxr * W + Math.sin(t * 0.0005 + ph) * 4 - cam * (y > hz ? near(y) : 0.06));
    const b = Math.sin(t * 0.0021 + ph * 3);
    if (b < 0.1 || x < 1 || x >= W - 1 || y < 1 || y >= H - 1) continue;
    buf[y * W + x] = FLY[b > 0.5 ? 0 : 1];
    if (b > 0.75) for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) buf[(y + ay) * W + x + ax] = FLY[2];
  }
  ctx.putImageData(img, 0, 0);
  // the size it loads in at near the bottom, easing down to 70% by the fork and held there (the user's pick, 2026-10-11:
  // full perspective felt like too much); walking off up a road at the end, the distance shrinks it on
  const ease = smooth((startY - my) / Math.max(1, startY - fy)), held = 1 - 0.3 * ease;
  const mon = $('xr-mon'), k = walking && my < fy ? held * near(my) / near(fy) : held;
  mon.style.left = `${sx * P}px`;
  mon.style.top = `${my * P}px`;
  mon.style.scale = `${k}`;
  mon.style.setProperty('--foot', `${(mon.dataset.foot || 0) * k}px`);
  const shift = `${-sf * P}px`;
  document.querySelectorAll('.xr-road').forEach(c => { c.style.marginLeft = shift; });
}

const monWidth = () => { const m = $('xr-mon'); return (m.naturalWidth || 64) * scale0 * 0.6; };

/** Your Pokémon's size at the bottom of the screen, a whole or half scale, and each card over its road. */
function place() {
  const mon = $('xr-mon');
  const [t, b, l, r] = spriteFit(mon.src);
  const pose = Math.max(mon.naturalWidth - l - r, mon.naturalHeight - t - b) || 64;
  const room = Math.min(innerWidth * 0.3, innerHeight * (tall ? 0.15 : 0.2));
  scale0 = Math.max(1, Math.min(4, Math.floor((room / pose) * 2) / 2));
  if (facing === 'back') monTall = (mon.naturalHeight - t - b) * scale0;
  fitMon();
  const cardW = Math.min(tall ? 200 : 290, (fx - d) * P * 2 - 16, d * P * 2 - 12);
  const cards = [...document.querySelectorAll('.xr-road')];
  cards.forEach((card, i) => {
    card.style.left = `${vx(i) * P}px`;
    card.style.width = `${cardW}px`;
    card.style.minHeight = '';
  });
  const tallest = Math.max(...cards.map(c => c.offsetHeight));
  cards.forEach(c => { c.style.minHeight = `${tallest}px`; });   // two of a kind, whichever name wraps
}

/** The sprite at full size (scaled per frame by `scale`), and its feet's gap kept for the frame to scale with it. */
function fitMon() {
  const mon = $('xr-mon'), [t, b] = spriteFit(mon.src);
  // its front sprite drawn as tall as the back one it loaded in as, so turning round never resizes it
  const s = monTall ? monTall / Math.max(1, mon.naturalHeight - t - b) : scale0;
  mon.style.width = `${mon.naturalWidth * s}px`;
  mon.style.height = `${mon.naturalHeight * s}px`;
  mon.dataset.foot = b * s;
}

/** Which road a spot is on (0 / 1), or -1 on the meadow below the fork. */
const regionOf = (x, y) => (y >= fy - 1 ? -1 : Math.abs(x - pathAt(y, -1)[0]) <= Math.abs(x - pathAt(y, 1)[0]) ? 0 : 1);
const meadowEdge = (y) => W * 0.42 * (0.55 + 0.45 * Math.max(0, (y - fy) / (H - fy)));
const lowest = () => startY + Math.round(H * 0.02);
const farthest = () => hz + Math.round((fy - hz) * 0.08);
const joinOf = (i) => [pathAt(fy - 1.5, i ? 1 : -1)[0], fy - 1.5];

/** Where a step from (x0, y0) to (x, y) ends up: on the meadow, or kept to the road it's on. */
function constrain(x0, y0, x, y) {
  y = Math.max(farthest(), Math.min(lowest(), y));
  if (y >= fy - 1) {
    const e = meadowEdge(y);
    return [Math.max(fx - e, Math.min(fx + e, x)), y];
  }
  const was = regionOf(x0, y0), side = was >= 0 ? was : regionOf(x, y);
  const [c, hw] = pathAt(y, side ? 1 : -1);
  if (was < 0 && Math.abs(x - c) > bw) return [x, Math.max(y, fy - 1)];   // only onto a road from the path at its mouth
  return [Math.max(c - hw - 0.5, Math.min(c + hw + 0.5, x)), y];
}

/** The way to (x, y): through the fork if it means changing road, then along it. */
function routeTo(x, y) {
  [x, y] = [x, Math.max(farthest(), Math.min(lowest(), y))];
  const to = regionOf(x, y), from = regionOf(mx, my);
  if (to >= 0) { const [c, hw] = pathAt(y, to ? 1 : -1); x = Math.max(c - hw, Math.min(c + hw, x)); }
  else { const e = meadowEdge(y); x = Math.max(fx - e, Math.min(fx + e, x)); }
  route = [];
  if (from >= 0 && to !== from) route.push(joinOf(from), [joinOf(from)[0], fy + 1]);
  if (to >= 0 && to !== from) route.push([joinOf(to)[0], fy + 1], joinOf(to));
  route.push([x, y]);
}
/** A biome's wilds' types and how many of each, the most common first. */
export function wildTypes(biome) {
  const counts = {};
  for (const id of biome.normals) counts[ENEMY_DEFS[id].type] = (counts[ENEMY_DEFS[id].type] || 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

/** What lives on a road, by its wilds' types, the most common first: Alphas and bosses fight as Neutral. */
function typeChips(biome) {
  return wildTypes(biome).map(([type, n]) => {
    const chip = el('span', `chip type-${type}`);
    chip.append(typeText(type, TYPES[type]?.icon ?? '', `${n}`));
    chip.title = `${n} ${TYPES[type]?.label ?? type} wild Pokémon`;
    return chip;
  });
}

/** A road's sign, its bosses (silhouettes until the Pokédex has met them) and its wilds' types: a card's or a board's. */
export function roadInfo(id) {
  const biome = BIOMES_BY_ID[id];
  const sign = el('div', 'biome-sign xr-sign', biome.name);
  sign.dataset.biome = id;
  const row = (ids) => {
    const box = el('div', 'xr-bosses');
    for (const id of ids) {
      const def = ENEMY_DEFS[id], met = getSave().dex.seen.includes(id);   // read, never dexSeen(): that marks it seen
      const pic = el('img', `pixel xr-boss${met ? '' : ' unmet'}`);
      pic.src = def.image;
      pic.alt = met ? def.name : '???';
      pic.title = met ? def.name : '???';
      pic.draggable = false;
      box.append(pic);
    }
    return box;
  };
  const bosses = row(biome.bosses), alphas = row(biome.elites ?? []);
  const types = el('div', 'xr-types');
  types.append(...typeChips(biome));
  // its Gym Leaders, each a shadow and ??? until beaten, over the bosses they send out (js/data/gym.js)
  const leaders = el('div', 'xr-leaders');
  for (const l of leadersOf(id)) {
    const met = gymWins(getSave(), l.id) > 0;
    const card = el('div', `xr-leader${met ? '' : ' unmet'}`);
    const pic = el('img', 'pixel xr-leader-pic');
    pic.src = spriteOf(l);
    pic.alt = '';
    pic.draggable = false;
    card.append(pic, el('span', 'xr-leader-name', met ? l.name : '???'), row(l.bosses));
    leaders.append(card);
  }
  return { sign, bosses, alphas, types, leaders: leaders.childElementCount ? leaders : bosses };
}

export function roadCard(id, i, pick, onSwap) {
  const card = el('button', 'xr-road');
  card.type = 'button';
  card.dataset.biome = id;
  const { sign, alphas, types, leaders } = roadInfo(id);
  card.append(sign, el('span', 'xr-label', 'Gym Leaders'), leaders, el('span', 'xr-label', 'Alphas'), alphas, el('span', 'xr-label', 'Wild Pokémon'), types);
  if (onSwap) {
    const swap = el('span', 'xr-swap', '🧭 Another road');   // the card is a button already, so not a nested one
    swap.setAttribute('role', 'button');
    swap.title = 'Wayfinder: swap this road for another biome you could walk.';
    swap.addEventListener('click', (e) => { e.stopPropagation(); onSwap(); });
    card.append(swap);
  }
  card.addEventListener('click', (e) => { e.stopPropagation(); pick(i); });
  return card;
}

/**
 * The fork between `ids` (CROSSROADS[slot], drawn left to right). `swap` (Wayfinder, the Savanna page's perk) lists the
 * biomes the second road can be swapped for: a button on its card steps through them and back. Resolves once a road is taken and the screen is dark,
 * with the biome id and a close() that takes the scene away: call it once the journey film or the next map covers it.
 * Your Pokémon walks where you tap (or hold and drag, or the arrow keys), shrinking a little towards the fork; walking onto a road picks it, and on up it takes it.
 */
export async function crossroads({ ids, swap = null, starter, stage = 0, shiny = false, meowth = false }) {
  // its backdrop at once, while the 3D place loads: on Continue the select under the leaving title showed through till then
  const sc = $('crossroads-scene');
  if (sc.hidden) { sc.className = `crossroads-scene wait${document.body.classList.contains('titling') || still() ? ' held' : ''}`; sc.hidden = false; }
  // the 3D fork first (js/crossroads-3d.js, the user's pick, 2026-10-11); `?xr2d`, or no Three.js, paints this one
  if (!new URLSearchParams(location.search).has('xr2d')) {
    try { return (await (await import('./crossroads-3d.js')).crossroads3d({ ids, swap, starter, stage, shiny, meowth })).chosen; }
    catch (e) { console.warn('3D crossroads unavailable, painting it', e); }
  }
  roads = [...ids]; picked = -1; walking = false; asking = false; route = []; keys = new Set(); cam = 0; H = 0; facing = 'back'; monTall = 0;
  const scene = $('crossroads-scene'), mon = $('xr-mon'), go = $('xr-go'), calm = still();
  const art = { back: spriteUrl(starter, 'back', stage, shiny), front: spriteUrl(starter, 'front', stage, shiny) };
  scene.className = `crossroads-scene held${calm ? ' still' : ''}`;
  mon.className = 'xr-mon pixel';
  mon.style.filter = '';
  mon.src = art.back;
  mon.alt = stageName(starter, stage);
  new Image().src = art.front;
  preloadSounds('stick', 'confirm', 'footstep');
  go.disabled = true;
  go.textContent = 'Which way?';
  scene.hidden = false;
  await new Promise(r => (mon.complete && mon.naturalWidth ? r() : (mon.onload = mon.onerror = r)));
  mon.onload = () => fitMon();

  return new Promise(resolve => {
    let raf = 0, last = 0, stepAt = 0, held = false, backing = false;
    const choose = (i) => {
      if (picked === i) return;
      picked = i;
      playSound('stick');
      document.querySelectorAll('.xr-road').forEach((c, k) => c.classList.toggle('on', k === i));
      go.disabled = false;
      go.textContent = `To the ${BIOMES_BY_ID[roads[i]].name}`;
    };
    const pick = (i) => {
      if (walking || asking) return;
      if (picked === i) return take();
      choose(i);
      routeTo(pathAt(fy - (fy - hz) * 0.12, i ? 1 : -1)[0], fy - (fy - hz) * 0.12);
    };
    const box = $('xr-roads');
    const ways = swap && [ids[1], ...swap];
    let way = 0;
    const cards = () => {
      box.replaceChildren(...roads.map((id, i) => roadCard(id, i, pick, ways && i === 1 ? turn : null)));
      if (picked >= 0) box.children[picked].classList.add('on');
    };
    function turn() {
      if (walking || asking) return;
      way = (way + 1) % ways.length;
      roads[1] = ways[way];
      playSound('stick');
      cards();
      if (picked === 1) go.textContent = `To the ${BIOMES_BY_ID[roads[1]].name}`;
      layout();
    }
    cards();
    layout();

    const face = (to) => {
      if (to === facing) return;
      facing = to;
      mon.src = art[to];
    };
    const loop = (now) => {
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0);
      last = now;
      const [X, Z] = toWorld(mx, my), speed = W * (walking ? 1.1 : 0.8) * dt;
      let gx = 0, gz = 0;
      if (keys.size && !walking && !asking) {
        gx = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0);
        gz = (keys.has('up') ? 1 : 0) - (keys.has('down') ? 1 : 0);
        route = [];
      } else if (route.length) {
        const [TX, TZ] = toWorld(...route[0]);
        const dist = Math.hypot(TX - X, TZ - Z);
        if (dist < Math.max(0.5, speed)) { [mx, my] = constrain(mx, my, ...route[0]); route.shift(); }
        else { gx = (TX - X) / dist; gz = (TZ - Z) / dist; }
      }
      const moving = gx || gz;
      if (moving) {
        const n = Math.hypot(gx, gz) || 1, [nx, ny] = fromWorld(X + (gx / n) * speed, Z + (gz / n) * speed);
        const [cx, cy] = constrain(mx, my, nx, ny), r = regionOf(cx, cy);
        if (r >= 0 && keys.size) [mx, my] = [cx + (pathAt(cy, r ? 1 : -1)[0] - cx) * Math.min(1, dt * 4), cy];   // keys steer along the road
        else [mx, my] = [cx, cy];
        if (gz < -0.5) face('front'); else if (gz > 0.3) face('back');
        if (!calm && now > stepAt) { playSound('footstep'); stepAt = now + 360; }
      }
      mon.classList.toggle('walking', !!moving && !calm);
      const r = regionOf(mx, my);
      if (r < 0) backing = false;
      if (!walking && !asking && r >= 0) {
        choose(r);
        if (my < hz + (fy - hz) * 0.72 && !backing) take();
      }
      if (walking) mon.style.filter = `brightness(${Math.max(0.5, near(my) / near(fy))})`;
      frame(now);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const aim = (e) => {
      const rect = canvas.getBoundingClientRect(), y = (e.clientY - rect.top) / P, x = (e.clientX - rect.left) / P;
      if (y <= hz + 1) return pick(x + cam * 0.06 < fx ? 0 : 1);   // a tap on a road's glimpse of its biome
      routeTo(x + cam * near(y), y);
    };
    const onDown = (e) => {
      if (walking || asking || e.target.closest('.xr-road, .xr-go')) return;
      held = true;
      aim(e);
    };
    const onMove = (e) => { if (held && !walking && (e.clientY - canvas.getBoundingClientRect().top) / P > hz + 1) aim(e); };
    const onUp = () => { held = false; };
    const KEYS = { ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right', ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down' };
    const onKey = (e) => {
      if (asking) return;
      const k = KEYS[e.key];
      if (k) keys.add(k);
      else if ((e.key === 'Enter' || e.key === ' ') && picked >= 0) take();
      else if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopPropagation();
    };
    const onKeyUp = (e) => { if (KEYS[e.key]) keys.delete(KEYS[e.key]); };
    const onResize = () => { if (!walking) layout(); };
    scene.addEventListener('pointerdown', onDown);
    addEventListener('pointermove', onMove);
    addEventListener('pointerup', onUp);
    addEventListener('pointercancel', onUp);
    addEventListener('keydown', onKey, true);
    addEventListener('keyup', onKeyUp, true);
    addEventListener('resize', onResize);
    go.onclick = (e) => { e.stopPropagation(); take(); };
    if (meowth) {   // Meowth, the first time after Biome 1, standing by your Pokémon to talk (js/meowth.js)
      asking = true;
      const cat = el('img', 'xr-meowth');
      cat.src = 'assets/pokemon/meowth-front.gif';
      cat.alt = 'Meowth';
      cat.style.left = `${(mx + W * 0.3) * P}px`;
      cat.style.top = `${(my - H * 0.03) * P}px`;
      cat.style.setProperty('--px', `${P}px`);
      scene.append(cat);
      meowthTalk(scene).then(() => { cat.remove(); asking = false; });
    }

    async function take() {
      if (walking || asking || picked < 0) return;
      // no way back once you walk on, so it asks first (the user's ask, 2026-10-11); a no steps back off the road
      asking = true;
      keys.clear();
      route = [];
      playSound('stick');
      const sure = await confirmDialog(`Are you sure you want to enter the ${BIOMES_BY_ID[roads[picked]].name}?`, 'Enter');
      asking = false;
      if (!sure || walking) {
        if (regionOf(mx, my) >= 0) { backing = true; routeTo(fx, fy + (H - fy) * 0.15); }
        return;
      }
      walking = true;
      keys.clear();
      playSound('confirm');
      scene.removeEventListener('pointerdown', onDown);
      removeEventListener('pointermove', onMove);
      removeEventListener('pointerup', onUp);
      removeEventListener('pointercancel', onUp);
      removeEventListener('keydown', onKey, true);
      removeEventListener('keyup', onKeyUp, true);
      removeEventListener('resize', onResize);
      go.disabled = true;
      scene.classList.add('chosen');
      face('back');
      // up the road: towards its gap in the trees, smaller with every step
      const y = hz + (fy - hz) * 0.2;
      routeTo(pathAt(y, picked ? 1 : -1)[0], y);
      await sleep(calm ? 500 : 1300);
      scene.classList.add('dark');
      await sleep(650);
      const id = roads[picked];
      resolve({ id, close: () => { cancelAnimationFrame(raf); scene.hidden = true; scene.classList.remove('dark', 'chosen'); } });
    }
  });
}
