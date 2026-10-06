/*
 * The descent to the Sealed Gate (docs/roadmap-done.md, "Small asks" item 4): after the last boss falls (or your Pokémon
 * faints before it), the arena shakes, a crack opens under your Pokémon with violet light pouring out of it, the floor
 * gives way, and it drops down a crystal shaft towards the light below, where js/gatescene.js takes over.
 *
 * Two looks on one low-res canvas (P CSS px a pixel): the arena (a dusky wasteland, painted once a layout, the crack
 * drawn over it as it opens), then the shaft, painted whole every frame from the depth fallen (its walls, crystals and
 * strata are functions of the depth, so it never ends: the fall lasts as long as its lines). Under reduced motion
 * nothing shakes, tumbles or streaks; the lines and sounds stay.
 *
 * Its lines are picked per case by descentLines(), or handed in (`lines`), so another fall (Mewtwo's, item 5) reuses it.
 */
import { $, sleep } from './ui.js';
import { playSound, playMusic } from './audio.js';
import { sceneSay } from './evolution.js';
import { calmFx } from './prefs.js';
import { spriteUrl, stageName } from './data/starters.js';
import { spriteFit } from './data/sprite-fit.js';

const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bayer = (x, y) => BAYER[(y & 3) * 4 + (x & 3)] / 16;
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const abgr = (h) => { const n = parseInt(h.slice(1), 16); return (0xff000000 | ((n & 255) << 16) | (n & 0xff00) | (n >> 16)) >>> 0; };
const pal = (list) => list.map(abgr);

const SKY = pal(['#14080e', '#1e0c14', '#2c1218', '#3e1a1c', '#56241e', '#702e20']);
const MESA = abgr('#1a0a0e');
const GROUND = pal(['#4a2c22', '#40261e', '#36201a', '#2c1a16', '#221412']);
const CRACK = ['#ffffff', '#f0c8ff', '#c070ff', '#7a30c0'];
// the shaft: its far wall darkest at the top, lit violet from below; rock walls rimmed by the light; crystals
const VOID = pal(['#05020c', '#0a0518', '#110826', '#1a0c36', '#261048', '#36165e', '#4c1e78', '#682a98']);
const VOID_LOSS = pal(['#040108', '#080310', '#0e051a', '#160824', '#200a30', '#2c0e3c', '#3a124a', '#4c165a']);
const ROCK = pal(['#5a4886', '#3c2e62', '#2c224c', '#201838', '#161028', '#0c0818']);
const GEMS = [pal(['#ffffff', '#b8f4ff', '#58d0f0', '#2a7ab8', '#143e6e']), pal(['#fff4ff', '#e8b8ff', '#b070f0', '#7038c0', '#381870'])];
const DUST = pal(['#d8c8ff', '#8a7ab8', '#5a4a88']);

/**
 * The lines for a case: `arena` while the ground shakes and splits, `fall` on the way down. The first time (the save's
 * gateSeen) the fall tells the chamber's lore, which the gate scene no longer repeats; later wins get a line or two; a
 * loss at the last boss is dragged down instead.
 */
export function descentLines({ name, kind = 'win', first = false }) {
  const lore = first ? ['Far beneath the wastes lies a chamber no map shows...', 'A gate of living crystal, bound by an ancient seal. Something sleeps behind it.'] : [];
  if (kind === 'loss') return {
    arena: [`${name} fainted...`, 'The ground gives way beneath it!'],
    fall: ['Something drags it down into the dark...', ...lore],
  };
  if (first) return {
    arena: ['The ground shakes beneath the arena!', 'A crack splits the floor, and violet light pours out of it...'],
    fall: [`${name} falls into the dark!`, ...lore],
  };
  return kind === 'ultimate'
    ? { arena: ['The ground shakes harder than ever!'], fall: [`${name} plunges towards the seal, blazing with power!`] }
    : { arena: ['The ground shakes... the seal calls again!'], fall: [`${name} drops down the crystal shaft!`] };
}

let P = 4, W = 0, H = 0, GY = 0, ctx = null, img = null, buf = null, arenaBg = null;
let mode = 'arena', t = 0, last = 0, raf = 0, depth = 0, speed = 0, shake = 0, crack = 0, glow = 0;
let dust = [], bits = [], crackPts = [], loss = false, chimeAt = 0, monY = 0;

/**
 * Play the descent. Resolves once your Pokémon has fallen into the light and the screen is dark, with a close() that
 * takes the scene away; call it once the next scene (the gate's) is showing, so the page never shows through between them.
 */
export async function descent({ starter, stage = 0, shiny = false, kind = 'win', first = false, lines = null }) {
  const scene = $('descent-scene'), mon = $('descent-mon');
  const name = stageName(starter, stage);
  const said = lines ?? descentLines({ name, kind, first });
  loss = kind === 'loss';
  scene.className = `descent-scene${still() ? ' still' : ''}${loss ? ' loss' : ''}`;
  scene.hidden = false;
  $('descent-log').hidden = true;
  mon.src = spriteUrl(starter, 'front', stage, shiny);
  mon.alt = name;
  mon.className = 'descent-mon pixel';
  mode = 'arena'; t = 0; depth = 0; speed = 0; shake = 0; crack = 0; glow = 0; dust = []; bits = []; chimeAt = 0;
  layout();
  await loaded(mon);
  fit();
  addEventListener('resize', relayout);
  last = performance.now();
  raf = requestAnimationFrame(frame);
  playMusic('seal', { restart: true });   // the win's fanfare fades into the seal's song, through the gate scene until the win scene

  await sleep(still() ? 200 : 700);
  // the arena shakes, and the crack opens under your Pokémon while its lines are read
  playSound('quake');
  shake = 1.5;
  scene.classList.add('shaking');
  const opening = growCrack(still() ? 0 : 2200);
  await say(said.arena);
  await opening;
  playSound('gate-crack');
  shake = 3;
  await sleep(still() ? 0 : 500);

  // the floor gives way: a violet flash, and the shaft
  playSound('eruption');
  flash(scene);
  for (let i = 0; i < 40; i++) bit();
  await sleep(still() ? 0 : 180);
  scene.classList.remove('shaking');
  shake = 0;
  mode = 'shaft';
  speed = 26;
  scene.classList.add('falling');
  place();
  playSound('gust');
  await say(said.fall);

  // the light below floods up, your Pokémon drops into it, and the screen goes dark for the gate
  playSound('core-surge');
  scene.classList.add('landing');
  await sleep(still() ? 300 : 1300);
  scene.classList.add('dark');
  await sleep(still() ? 0 : 600);
  return () => {
    cancelAnimationFrame(raf);
    removeEventListener('resize', relayout);
    scene.hidden = true;
    scene.className = 'descent-scene';
  };
}

const say = (lines) => (lines.length ? sceneSay('descent-scene', 'descent-log', lines) : Promise.resolve());
const loaded = (el) => el.complete && el.naturalWidth ? null : new Promise(resolve => { el.onload = el.onerror = resolve; });

function flash(scene) {
  scene.classList.remove('flash');
  void scene.offsetWidth;
  scene.classList.add('flash');
}

/** The crack runs out from under your Pokémon to both sides over ms. */
function growCrack(ms) {
  if (!ms) { crack = 1; return Promise.resolve(); }
  return new Promise(resolve => {
    const start = performance.now();
    const step = (now) => {
      crack = Math.min(1, (now - start) / ms);
      if (Math.random() < 0.3) bit(true);
      if (crack < 1) requestAnimationFrame(step); else resolve();
    };
    requestAnimationFrame(step);
  });
}

/* ---------- layout ---------- */

function layout() {
  P = innerWidth < 720 ? 4 : 5;
  W = Math.ceil(innerWidth / P);
  H = Math.ceil(innerHeight / P);
  GY = Math.round(H * 0.6);
  const canvas = $('descent-canvas');
  canvas.width = W; canvas.height = H;
  ctx = canvas.getContext('2d');
  img = ctx.createImageData(W, H);
  buf = new Uint32Array(img.data.buffer);
  arenaBg = paintArena();
  crackPts = makeCrack();
  dust = Array.from({ length: Math.round(W / 4) }, () => mote(Math.random() * H));
}

function relayout() { layout(); fit(); }

/** Your Pokémon at a whole or half scale that fits the screen; in the arena its feet on the ground, falling mid-shaft. */
function fit() {
  const mon = $('descent-mon');
  const [top, bottom, left, right] = spriteFit(mon.src);
  const pose = Math.max(mon.naturalWidth - left - right, mon.naturalHeight - top - bottom) || 64;
  const room = Math.min(innerWidth * 0.4, innerHeight * 0.22);
  const s = Math.max(1, Math.min(4, Math.floor((room / pose) * 2) / 2));
  mon.style.width = `${mon.naturalWidth * s}px`;
  mon.style.height = `${mon.naturalHeight * s}px`;
  mon.style.setProperty('--foot', `${bottom * s}px`);
  mon.style.setProperty('--mid', `${((top - bottom) / 2) * s}px`);
  place();
}

function place() {
  const mon = $('descent-mon');
  const y = mode === 'arena' ? GY * P : innerHeight * 0.4;
  mon.style.top = `${y}px`;
  monY = y / P;
}

/* ---------- the arena ---------- */

function paintArena() {
  const c = Object.assign(document.createElement('canvas'), { width: W, height: H });
  const g = c.getContext('2d'), im = g.createImageData(W, H), d = new Uint32Array(im.data.buffer);
  const horizon = GY - Math.round(H * 0.12);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let col;
    if (y < horizon) {
      const v = (y / horizon) * (SKY.length - 1);
      col = SKY[Math.min(SKY.length - 1, Math.floor(v) + (v % 1 > bayer(x, y) ? 1 : 0))];
      // mesas on the horizon, flat-topped and ragged
      const m = horizon - (6 + Math.round(5 * Math.sin(x * 0.07) + 4 * Math.sin(x * 0.19 + 2) + (Math.sin(x * 0.045 + 1) > 0.4 ? 6 : 0)));
      if (y >= m) col = MESA;
    } else {
      const v = ((y - horizon) / (H - horizon)) * (GROUND.length - 1);
      col = GROUND[Math.min(GROUND.length - 1, Math.floor(v) + (v % 1 > bayer(x, y) ? 1 : 0))];
      if (hash(x * 31 + y * 7) < 0.04) col = GROUND[GROUND.length - 1];
      // old cracks and the arena's worn ring under the fight
      const ring = Math.hypot((x - W / 2) / (W * 0.42), (y - GY) / (H * 0.07));
      if (Math.abs(ring - 1) < 0.04) col = GROUND[0];
    }
    d[y * W + x] = col;
  }
  g.putImageData(im, 0, 0);
  return c;
}

/** The crack's zigzag, out from the middle both ways, flat across the ground as it runs to the edges. */
function makeCrack() {
  const pts = [];
  for (const dir of [-1, 1]) {
    let x = W / 2, y = GY + 1, k = 0;
    while (x > -2 && x < W + 2) {
      pts.push({ x: Math.round(x), y: Math.round(y), d: Math.abs(x - W / 2) / (W / 2), w: Math.max(0, 2 - Math.abs(x - W / 2) / (W * 0.18)) });
      x += dir * (1 + (hash(k * 3 + dir) * 2 | 0));
      y += (hash(k * 7 + dir * 5) - 0.5) * 2.2 + (GY + 1 - y) * 0.15;
      k++;
    }
  }
  return pts;
}

function drawCrack() {
  if (crack <= 0) return;
  for (const p of crackPts) {
    if (p.d > crack) continue;
    const w = Math.round(p.w * crack);
    for (let k = -w - 1; k <= w + 1; k++) {
      const edge = Math.abs(k) / (w + 1);
      ctx.fillStyle = edge < 0.34 ? CRACK[0] : edge < 0.67 ? CRACK[1] : edge < 1 ? CRACK[2] : CRACK[3];
      ctx.fillRect(p.x, p.y + k, 1, 1);
    }
    // light pouring up out of it, flickering
    if (crack > 0.4 && p.x % 3 === 0) {
      const len = Math.round((4 + 10 * hash(p.x + Math.floor(t * 8))) * (1 - p.d) * crack * 2);
      for (let s = 2; s < len; s++) {
        if (bayer(p.x, p.y - s) > 1 - s / len) continue;
        ctx.fillStyle = s < len * 0.4 ? CRACK[1] : CRACK[2];
        ctx.fillRect(p.x, p.y - s, 1, 1);
      }
    }
  }
}

/* ---------- the shaft ---------- */

const wallL = (wy) => W * 0.16 + 5 * Math.sin(wy * 0.031) + 3 * Math.sin(wy * 0.083 + 1) + 2 * hash(Math.floor(wy / 3));
const wallR = (wy) => W - (W * 0.16 + 5 * Math.sin(wy * 0.027 + 2) + 3 * Math.sin(wy * 0.071 + 4) + 2 * hash(Math.floor(wy / 3) + 99));

function paintShaft() {
  const voids = loss ? VOID_LOSS : VOID;
  const lit = 0.55 + glow * 0.45;
  for (let y = 0; y < H; y++) {
    const wy = Math.floor(y + depth), l = wallL(wy), r = wallR(wy);
    const below = (y / H) ** 1.6 * lit;
    for (let x = 0; x < W; x++) {
      let col;
      if (x >= l && x < r) {
        // the far wall, its strata streaming past
        const strata = ((wy + Math.round(Math.sin(x * 0.2) * 2)) % 11 === 0) ? -1 : 0;
        const v = Math.max(0, below * (voids.length - 1) + strata);
        col = voids[Math.min(voids.length - 1, Math.floor(v) + (v % 1 > bayer(x, wy) ? 1 : 0))];
      } else {
        // rock, rimmed where it meets the shaft and lit more the lower it is
        const into = x < l ? l - x : x - r + 1;
        const v = into / 2 - below * 1.6 + (hash(x * 13 + wy * 7) < 0.12 ? 1 : 0);
        col = ROCK[Math.max(0, Math.min(ROCK.length - 1, Math.floor(v)))];
      }
      buf[y * W + x] = col;
    }
  }
  // crystals jutting out of the walls, every so often down the shaft
  const first = Math.floor(depth / 14) - 1, lastSeg = Math.floor((depth + H) / 14) + 1;
  for (let s = first; s <= lastSeg; s++) {
    if (hash(s) > 0.72) continue;
    const left = hash(s + 0.5) < 0.5, gems = GEMS[hash(s + 0.25) < 0.5 ? 0 : 1];
    const by = s * 14 + Math.floor(hash(s + 0.75) * 10), sy = by - depth;
    const len = 4 + Math.floor(hash(s + 0.9) * 9), hw = 1 + Math.floor(hash(s + 0.3) * 2.5), slope = (hash(s + 0.6) - 0.6) * 0.8;
    const ex = left ? wallL(by) : wallR(by);
    for (let i = 0; i < len; i++) {
      const x = Math.round(ex + (left ? i - 1 : 1 - i)), w = Math.round(hw * (1 - i / len) + 0.4);
      for (let k = -w; k <= w; k++) {
        const y = Math.round(sy + i * slope + k);
        if (y < 0 || y >= H || x < 0 || x >= W) continue;
        const shade = i >= len - 2 ? 0 : k === -w ? 1 : k === w ? 3 : 2;
        buf[y * W + x] = gems[shade];
      }
    }
    // its tip glints as it passes your Pokémon, with a chime
    if (Math.abs(sy - monY) < 1 && t > chimeAt && !still()) { chimeAt = t + 0.6; playSound(`crystal-${s & 1 ? 1 : (s & 2 ? 2 : 0)}`); }
  }
  ctx.putImageData(img, 0, 0);
}

const mote = (y = H + Math.random() * 10) => ({ x: Math.random() * W, y, v: 0.6 + Math.random() * 1.2, len: 2 + Math.floor(Math.random() * 5) });

function drawDust(dt) {
  if (still()) return;
  for (const m of dust) {
    m.y -= speed * m.v * dt * 3;
    if (m.y + m.len < 0) Object.assign(m, mote());
    ctx.fillStyle = m.v > 1.3 ? '#d8c8ff' : '#8a7ab8';
    ctx.fillRect(Math.round(m.x), Math.round(m.y), 1, m.len);
  }
}

/** Chips of the floor: kicked up as it shakes, then falling with you (and past you) once it breaks. */
function bit(up = false) {
  if (still()) return;
  const x = W / 2 + (Math.random() - 0.5) * W * 0.6;
  bits.push({ x, y: GY + (Math.random() - 0.5) * 3, vx: (Math.random() - 0.5) * 30, vy: up ? -20 - Math.random() * 30 : -40 + Math.random() * 20, life: 1.6, c: Math.random() < 0.3 ? CRACK[2] : '#4a2c22', size: Math.random() < 0.3 ? 2 : 1 });
}

function drawBits(dt) {
  for (const b of bits) {
    b.life -= dt;
    b.vy += 140 * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt - (mode === 'shaft' ? speed * dt * 1.4 : 0);
    ctx.fillStyle = b.c;
    ctx.fillRect(Math.round(b.x), Math.round(b.y), b.size, b.size);
  }
  bits = bits.filter(b => b.life > 0);
}

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  t += dt;
  const sx = shake && !calmFx() ? Math.round((Math.random() - 0.5) * 2 * shake) : 0;
  const sy = shake && !calmFx() ? Math.round((Math.random() - 0.5) * shake) : 0;
  if (mode === 'arena') {
    ctx.fillStyle = '#05020c';
    ctx.fillRect(0, 0, W, H);
    ctx.drawImage(arenaBg, sx, sy);
    ctx.save();
    ctx.translate(sx, sy);
    drawCrack();
    ctx.restore();
  } else {
    depth += speed * dt * 3;
    glow = Math.min(1, glow + dt * 0.08);
    paintShaft();
    drawDust(dt);
  }
  drawBits(dt);
  raf = requestAnimationFrame(frame);
}
