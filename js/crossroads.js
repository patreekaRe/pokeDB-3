/*
 * The crossroads (roadmap item 19): after a boss's rewards, where the next slot has two roads (CROSSROADS), the path forks
 * at dusk on the edge of the woods, just before the journey film walks on from it.
 *
 * One low-res canvas (P CSS px a pixel), painted once a layout (paintBase()) with fireflies drawn over it each frame: the
 * path from your Pokémon's feet splits round a signpost into two roads, each running into a gap in the treeline that shows
 * a glimpse of where it goes (sceneShot() of the biome's first place, at dusk). Above each road a card names it: its sign,
 * its bosses (silhouettes until the Pokédex has met them) and its wilds' types. A tap on a card or a road picks it (its
 * arm of the signpost lights up), a second tap or the button takes it, and your Pokémon walks off up that road as the
 * dark comes down. Arrow keys pick, Enter takes. There's no way out without choosing.
 */
import { $, el, sleep } from './ui.js';
import { playSound, preloadSounds } from './audio.js';
import { sceneShot } from './scene.js';
import { dexSeen } from './pokedex.js';
import { BIOMES_BY_ID, ENEMY_DEFS } from './data/enemies.js';
import { TYPES } from './data/cards.js';
import { spriteUrl, stageName } from './data/starters.js';
import { spriteFit } from './data/sprite-fit.js';

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
const ARMS = { clearing: ['#b0682c', '#d89050'], shrine: ['#6f7f62', '#9aae84'], ruins: ['#4f7472', '#8cc8c0'], wastes: ['#54403a', '#e0602a'] };

let P = 4, W = 0, H = 0, tall = true, hz = 0, fy = 0, fx = 0, d = 0, gw = 0, gh = 0, bw = 0;
let canvas = null, ctx = null, img = null, buf = null, base = null, shots = [];
let roads = [], picked = -1, walking = false;

function layout() {
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

function paintBase() {
  base = new Uint32Array(W * H);
  const set = (x, y, c) => { if (x >= 0 && x < W && y >= 0 && y < H) base[y * W + x] = c; };
  // the sky, and the sun sinking between the two roads
  const sr = Math.max(4, Math.round(W * (tall ? 0.09 : 0.05))), sy = hz - Math.round(sr * 0.3);
  for (let y = 0; y < hz; y++) for (let x = 0; x < W; x++) {
    let c = ramp(SKY, y / hz, x, y);
    const r = Math.hypot(x - fx, (y - sy) * 1.1);
    if (r < sr) c = SUN[r < sr * 0.6 ? 0 : r < sr * 0.85 ? 1 : 2];
    else if (r < sr * 2.2 && (1 - (r - sr) / (sr * 1.2)) > bay(x, y) + 0.35) c = SUN[2];
    base[y * W + x] = c;
  }
  // far hills, then each road's glimpse of its biome through the gap it makes
  for (let x = 0; x < W; x++) {
    const top = hz - Math.round(3 + 3 * Math.sin(x * 0.09) + 2 * Math.sin(x * 0.23 + 1));
    for (let y = top; y < hz; y++) set(x, y, HILLS[y - top < 2 ? 0 : 1]);
  }
  shots.forEach((shot, i) => {
    const x0 = vx(i) - (gw >> 1), y0 = hz - Math.round(gh * 0.62), cy = hz - gh * 0.22;
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
      const X = x0 + x, Y = y0 + y;
      if (Y > hz + 1) continue;
      const dx = (X - vx(i)) / (gw / 2), dy = (Y - cy) / (gh * 0.5);
      if ((1 - dx * dx - dy * dy) * 4 > bay(X, Y)) set(X, Y, shot[y * gw + x]);
    }
  });
  // two rows of pines, parting where each road runs through them
  const gap = (x, wide) => Math.min(...roads.map((_, i) => Math.abs(x - vx(i)) / (gw * wide)));
  [[PINES[0], 4, 10, 0.36], [PINES[1], 7, 15, 0.5]].forEach(([c, step, tallest, wide], row) => {
    for (let p = -6, k = 0; p < W + 6; p += step * (0.7 + hash(k + row * 97) * 0.6), k++) {
      const edge = 1 + 1.2 * smooth(Math.abs(p - fx) / (W * 0.5) - 0.4);
      const ph = Math.round((tallest * 0.55 + hash(k * 3 + row) * tallest * 0.6) * edge * smooth(gap(p, wide) * 1.2 - 0.25));
      if (ph < 2) continue;
      for (let y = 0; y < ph; y++) {
        const half = Math.floor((y / ph) * step * 0.55 + (y % 3 === 2 ? 1 : 0));
        for (let x = -half; x <= half; x++) set(Math.round(p) + x, hz - ph + y + row, c);
      }
    }
  });
  // the meadow, the roads through it and their pebbles
  for (let y = hz; y < H; y++) {
    const t = (y - hz) / (H - hz);
    for (let x = 0; x < W; x++) base[y * W + x] = ramp(GRASS, t, x, y);
  }
  for (let k = 0; k < W * H * 0.012; k++) {
    const x = Math.floor(hash(k * 1.7) * W), y = hz + 2 + Math.floor(hash(k * 2.3 + 9) ** 0.7 * (H - hz - 2)), h = 1 + Math.floor(((y - hz) / (H - hz)) * 3);
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
  // the signpost's shadow on the path, then the post and one arm a road
  const sh = Math.round(H * (tall ? 0.13 : 0.17)), top = fy - sh, arm = Math.round(W * (tall ? 0.15 : 0.09));
  for (let x = -5; x <= 5; x++) if (Math.abs(x) < 4 || bay(fx + x, fy) > 0.5) set(fx + x, fy + 1, PATH[3]);
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
  // two old trees framing the view, lit at their edges by the sun
  for (const s of [-1, 1]) {
    const tx = s < 0 ? 0 : W - 1, tw = Math.max(3, Math.round(W * 0.045)), foot = Math.round(H * (tall ? 0.6 : 0.7));
    for (let y = 0; y <= foot; y++) {
      const flare = y > foot - 5 ? Math.round((5 - (foot - y)) * 0.8) : 0, lean = Math.round(Math.sin(y * 0.05) * 1.5);
      for (let x = -tw - flare; x <= tw + flare; x++) {
        const k = x * -s, edge = tw + flare - k;   // k grows towards the sun
        const c = edge < 1 ? RIM : edge < 2 && bay(x, y) > 0.4 ? RIM : hash(x * 3.7 + Math.floor((y + x * 2) / 4) * 1.3) > 0.82 ? TRUNK[2] : TRUNK[k > 0 ? 0 : 1];
        set(tx + x + lean, y, c);
      }
    }
    const blobs = [[0, 0.02, 0.22], [0.12, 0.08, 0.15], [0.2, 0.0, 0.14], [0.05, 0.16, 0.13], [0.27, 0.05, 0.1]];
    for (const [ox, oy, r] of blobs) {
      const bx = tx - s * ox * W, by = oy * H, R = r * Math.min(W, H * 0.7);
      for (let y = Math.floor(by - R); y <= by + R; y++) for (let x = Math.floor(bx - R); x <= bx + R; x++) {
        const q = Math.hypot(x - bx, y - by) / R;
        if (q > 1 - hash(x * 3.1 + y * 5.7) * 0.12) continue;
        const inner = (x - bx) * -s / R + (y - by) / R;   // the side facing the sun
        set(x, y, q > 0.84 && inner > 0.5 ? RIM : ramp(LEAF, q * 0.6 + (1 - inner) * 0.2, x, y));
      }
    }
  }
}

const flies = Array.from({ length: 18 }, (_, i) => [hash(i * 3.3), hash(i * 7.1 + 2), hash(i * 1.9 + 5) * 6.28]);

function frame(now) {
  buf.set(base);
  for (const [fxr, fyr, ph] of flies) {
    const x = Math.round(fxr * W + Math.sin(now * 0.0005 + ph) * 4), y = Math.round(hz - 6 + fyr * (fy - hz + 12) + Math.cos(now * 0.0007 + ph * 2) * 3);
    const b = Math.sin(now * 0.0021 + ph * 3);
    if (b < 0.1 || x < 1 || x >= W - 1 || y < 1 || y >= H - 1) continue;
    buf[y * W + x] = FLY[b > 0.5 ? 0 : 1];
    if (b > 0.75) for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) buf[(y + ay) * W + x + ax] = FLY[2];
  }
  ctx.putImageData(img, 0, 0);
}

/** Your Pokémon on the path below the fork, at a whole or half scale, and each card over its road. */
function place() {
  const mon = $('xr-mon');
  const [t, b, l, r] = spriteFit(mon.src);
  const pose = Math.max(mon.naturalWidth - l - r, mon.naturalHeight - t - b) || 64;
  const room = Math.min(innerWidth * 0.3, innerHeight * (tall ? 0.15 : 0.2));
  const s = Math.max(1, Math.min(4, Math.floor((room / pose) * 2) / 2));
  mon.style.width = `${mon.naturalWidth * s}px`;
  mon.style.height = `${mon.naturalHeight * s}px`;
  mon.style.setProperty('--foot', `${b * s}px`);
  mon.style.left = `${fx * P}px`;
  mon.style.top = `${Math.round(H * (tall ? 0.86 : 0.9)) * P}px`;
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

/** What lives on a road, by its wilds' types, the most common first: Alphas and bosses fight as Neutral. */
function typeChips(biome) {
  const counts = {};
  for (const id of biome.normals) counts[ENEMY_DEFS[id].type] = (counts[ENEMY_DEFS[id].type] || 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([type, n]) => {
    const chip = el('span', `chip type-${type}`, `${TYPES[type]?.icon ?? ''} ${n}`);
    chip.title = `${n} ${TYPES[type]?.label ?? type} wild Pokémon`;
    return chip;
  });
}

function roadCard(id, i, pick) {
  const biome = BIOMES_BY_ID[id];
  const card = el('button', 'xr-road');
  card.type = 'button';
  card.dataset.biome = id;
  const sign = el('div', 'biome-sign xr-sign', biome.name);
  sign.dataset.biome = id;
  const bosses = el('div', 'xr-bosses');
  for (const bossId of biome.bosses) {
    const def = ENEMY_DEFS[bossId], met = dexSeen(bossId);
    const pic = el('img', `pixel xr-boss${met ? '' : ' unmet'}`);
    pic.src = def.image;
    pic.alt = met ? def.name : '???';
    pic.title = met ? def.name : '???';
    pic.draggable = false;
    bosses.append(pic);
  }
  const types = el('div', 'xr-types');
  types.append(...typeChips(biome));
  card.append(sign, el('span', 'xr-label', 'Bosses'), bosses, el('span', 'xr-label', 'Wild Pokémon'), types);
  card.addEventListener('click', (e) => { e.stopPropagation(); pick(i); });
  return card;
}

/**
 * The fork between `ids` (CROSSROADS[slot], drawn left to right). Resolves once a road is taken and the screen is dark,
 * with the biome id and a close() that takes the scene away: call it once the journey film or the next map covers it.
 */
export async function crossroads({ ids, starter, stage = 0, shiny = false }) {
  roads = ids; picked = -1; walking = false;
  const scene = $('crossroads-scene'), mon = $('xr-mon'), go = $('xr-go'), calm = still();
  scene.className = `crossroads-scene${calm ? ' still' : ''}`;
  mon.className = 'xr-mon pixel';
  mon.style.transform = '';
  mon.src = spriteUrl(starter, 'back', stage, shiny);
  mon.alt = stageName(starter, stage);
  preloadSounds('stick', 'confirm', 'footstep');
  go.disabled = true;
  go.textContent = 'Which way?';
  scene.hidden = false;
  await new Promise(r => (mon.complete && mon.naturalWidth ? r() : (mon.onload = mon.onerror = r)));

  return new Promise(resolve => {
    let raf = 0;
    const pick = (i) => {
      if (walking) return;
      if (picked === i) return take();
      picked = i;
      playSound('stick');
      document.querySelectorAll('.xr-road').forEach((c, k) => c.classList.toggle('on', k === i));
      mon.style.setProperty('--lean', `${(i ? 1 : -1) * Math.round(P * 3)}px`);
      mon.classList.add('leaning');
      go.disabled = false;
      go.textContent = `To the ${BIOMES_BY_ID[roads[i]].name}`;
      paintBase();
      if (calm) frame(0);
    };
    const box = $('xr-roads');
    box.replaceChildren(...roads.map((id, i) => roadCard(id, i, pick)));
    layout();
    const loop = (now) => { frame(now); raf = requestAnimationFrame(loop); };
    if (calm) frame(0); else raf = requestAnimationFrame(loop);

    const onTap = (e) => {
      if (e.target.closest('.xr-road, .xr-go')) return;
      const r = canvas.getBoundingClientRect(), y = (e.clientY - r.top) / P;
      if (y > hz - gh && y < H * 0.95) pick((e.clientX - r.left) / P < fx ? 0 : 1);
    };
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') pick(0);
      else if (e.key === 'ArrowRight') pick(1);
      else if ((e.key === 'Enter' || e.key === ' ') && picked >= 0) take();
      else if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopPropagation();
    };
    const onResize = () => { if (!walking) layout(); };
    scene.addEventListener('click', onTap);
    addEventListener('keydown', onKey, true);
    addEventListener('resize', onResize);
    go.onclick = (e) => { e.stopPropagation(); take(); };

    async function take() {
      if (walking || picked < 0) return;
      walking = true;
      playSound('confirm');
      scene.removeEventListener('click', onTap);
      removeEventListener('keydown', onKey, true);
      removeEventListener('resize', onResize);
      go.disabled = true;
      scene.classList.add('chosen');
      // up the road: towards its gap in the trees, smaller with every step
      const [cx] = pathAt(Math.round((hz + fy) / 2), picked ? 1 : -1);
      mon.classList.remove('leaning');
      mon.style.setProperty('--to-x', `${(cx - fx) * P}px`);
      mon.style.setProperty('--to-y', `${(Math.round((hz + fy) / 2) - Math.round(H * (tall ? 0.86 : 0.9))) * P}px`);
      mon.classList.add('away');
      if (!calm) for (let k = 0; k < 4; k++) setTimeout(() => playSound('footstep'), 150 + k * 380);
      await sleep(calm ? 500 : 1300);
      scene.classList.add('dark');
      await sleep(650);
      const id = roads[picked];
      resolve({ id, close: () => { cancelAnimationFrame(raf); scene.hidden = true; scene.classList.remove('dark', 'chosen'); } });
    }
  });
}
