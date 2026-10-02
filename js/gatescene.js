/*
 * The Sealed Gate's scenes (docs/roadmap.md, "The Sealed Gate", part B), after a run's win scene and before its result
 * window. Deep in a crystal cavern the gate looms, its HP in a battle nameplate; your Pokémon (from behind, like battle)
 * attacks it with its type's move (Ember / Flamethrower / Blast Burn by how the run went), the hit flashes and shakes
 * it, the cracks spread across it as its HP runs down, and from half HP Mewtwo's silhouette shows behind the door.
 *
 * The blow that breaks it (only a Trainer Level 5 win can): the gate shudders, light bursts out of every crack, the
 * chains snap, a white flash, and the door blows apart in shards. Mewtwo stands in the open arch as a silhouette, its
 * eyes light up, and it steps out in colour with its cry: free, and a starter from now on.
 *
 * Everything is painted on one low-res canvas (P CSS px a pixel) so the cavern, gate and effects share their pixels; the
 * Pokémon are the GIFs. Under reduced motion nothing shakes, flashes or flies; the lines, bar and sounds stay.
 */
import { $, sleep } from './ui.js';
import { playSound, playCry, playMusic, preloadCries } from './audio.js';
import { sceneSay } from './evolution.js';
import { makeGate, gateReady, gateBar, setGateBar, settleGateBar } from './gate.js';
import { GATE_HP, GATE_HIT, GATE_SLIVER, gateStage } from './data/gate.js';
import { STARTERS_BY_ID, spriteUrl, stageName } from './data/starters.js';
import { spriteFit } from './data/sprite-fit.js';

const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const GW = 72, GH = 88;   // the gate, in its own pixels
const AURA_SRC = 'assets/pokemon/mewtwo-awakened-front.gif';

// a move per type: a lost run's last gasp, a win, and a Trainer Level 5 win's ultimate move
const MOVES = {
  fire: ['Ember', 'Flamethrower', 'Blast Burn'],
  water: ['Water Gun', 'Hydro Pump', 'Hydro Cannon'],
  grass: ['Vine Whip', 'Leaf Storm', 'Frenzy Plant'],
  psychic: ['Confusion', 'Psychic', 'Psystrike'],
};
const FX = {
  fire: ['#fff8c0', '#ffd040', '#ff8020', '#e03010', '#701808'],
  water: ['#ffffff', '#b8f0ff', '#58c0f8', '#2878e0', '#183c90'],
  grass: ['#e8ffb0', '#a8e858', '#58b838', '#2c7a28', '#184818'],
  psychic: ['#ffe8ff', '#f0a0f8', '#c060e8', '#8030c0', '#401870'],
};
const STONE = ['#c8f0ff', '#78a0e8', '#4656b8', '#2c2a78'];   // chips of the crystal spires
const SHARDS = ['#341c58', '#22123e', '#5a3a8a', '#ff6aa8', '#ffd0e8'];

let P = 4, W = 0, H = 0, gx = 0, gy = 0;
let gate = null, bg = null, halo = null, ctx = null, gateCanvas = null;
let parts = [], beams = [], rays = 0, raf = 0, last = 0, t = 0;
let shake = 0, view = null, bar = null;   // view: what the gate shows this frame (makeGate's state)

/**
 * Play the scene: `before` and `after` are the gate's HP, `kind` 'loss' | 'win' | 'ultimate', `level` the run's Trainer
 * Level, `first` the first time it's ever reached (its story is told), `music` the song to bring back after the break's
 * silence. Resolves once the last
 * line is tapped away and the scene has faded out.
 */
export async function gateScene({ starter, stage = 0, shiny = false, before, after, kind = 'win', level = 0, first = false, music = 'run-win' }) {
  await gateReady();
  const scene = $('gate-scene'), mon = $('gate-mon');
  const name = stageName(starter, stage);
  const type = MOVES[starter.type] ? starter.type : 'psychic';
  const move = MOVES[type][kind === 'loss' ? 0 : kind === 'ultimate' ? 2 : 1];
  const breaks = after <= 0;
  if (breaks) preloadCries('mewtwo');

  scene.className = `gate-scene${still() ? ' still' : ''}`;
  scene.hidden = false;
  $('gate-log').hidden = true;
  $('gate-free').hidden = true;
  $('gate-free').className = 'gate-free';
  mon.src = spriteUrl(starter, 'back', stage, shiny);
  mon.alt = name;
  mon.className = 'gate-mon pixel';
  view = { hp: before / GATE_HP, t: 0, flash: 0, seal: 0, eyes: 0 };
  bar ??= $('gate-plate').insertBefore(gateBar('big'), $('gate-hp-text'));
  parts = []; beams = []; rays = 0; shake = 0;
  showHp(before);
  layout();
  await loaded(mon);
  fitMon();
  addEventListener('resize', relayout);
  last = performance.now();
  raf = requestAnimationFrame(frame);

  playSound('gate-hum');
  await sleep(still() ? 200 : 900);
  scene.classList.add('mon-in');
  await sleep(still() ? 0 : 500);
  // the story, told in the scene rather than a menu (the user's call, 2026-10-02): the gate is only ever seen down here
  const story = first ? [
    'Far beneath the wastes lies a chamber no map shows...',
    'A gate of living crystal, bound by an ancient seal. Something sleeps behind it.',
    // a save whose earlier wins were counted before it ever got here (seedGate())
    ...(before < GATE_HP ? ['Cracks already run through the seal... your past victories have been reaching it all along.'] : []),
  ] : [];
  if (kind === 'loss') {
    await say([...story, `${name} fainted... but its last spark of strength is drawn down into the chamber.`]);
    tellNow(`${name} reaches for the seal...`);
  } else {
    await say([...story, first ? `The strength of ${name}'s victory echoes down into the chamber!` : `${name}'s victory echoes down to the Sealed Gate!`]);
    tellNow(`${name} used ${move}!`);
  }
  await attack(type, kind);
  const hit = before - after;
  if (hit > 0) {
    playSound(kind === 'ultimate' ? 'hit-super' : 'hit');
    playSound('gate-crack');
    impact(type, kind);
    popDamage(hit);
    await drain(before, after, kind === 'ultimate' ? 1300 : 900);
  } else {
    playSound('hit-weak');
    view.seal = 1.2;   // the seal flares and throws it back
    impact(type, 'held');
    await sleep(700);
  }

  if (breaks) return breakFree(scene, music);

  const lines = [];
  if (kind === 'loss') {
    lines.push(`But ${name} is too weak to harm the seal!`, 'Only the strength of a victory can wear it down. Win a run, and the seal will feel it.');
  } else if (hit > 0) {
    lines.push(`The seal took ${hit} damage!`);
    if (first) lines.push('Every run you win weakens the seal. The higher your Trainer Level, the harder the blow.');
  } else lines.push('The seal flared and threw the blow back!');
  const from = gateStage(before), to = gateStage(after);
  for (let k = from + 1; k <= Math.min(to, 3); k++) lines.push(...STAGE_LINES[k]);
  if (from < 2 && to >= 2) { view.eyes = 1; playSound('gate-hum'); }
  if (after === GATE_SLIVER) lines.push(hit > 0 ? 'The seal hangs by a thread! Only a Trainer Level 5 victory can break it now.' : 'Only a Trainer Level 5 victory can break it now.');
  else if (kind === 'win' && level < GATE_HIT.length - 1 && !first) lines.push(`A Trainer Level ${level + 1} victory would strike for ${GATE_HIT[level + 1]}.`);
  else if (hit > 0 && after <= GATE_HP / 2) lines.push('It won\'t hold much longer...');
  await say(lines);
  await leave(scene);
}

// what each stage crossed says: past 75%, 50%, 25%
const STAGE_LINES = [[], ['Cracks split the seal!'], ['A chain snapped!', '...Something is moving behind the gate!'], ['The last chain gave way!', 'The seal is failing...']];

const say = (lines) => sceneSay('gate-scene', 'gate-log', lines);

/** A line shown at once, without waiting for a tap (the move's name while it plays out). */
function tellNow(line) {
  const box = $('gate-log');
  box.hidden = false;
  box.classList.remove('more', 'typing');
  $('gate-log-text').textContent = line;
  $('gate-log-live').textContent = line;
}

async function leave(scene) {
  scene.classList.add('out');
  await sleep(still() ? 0 : 700);
  cancelAnimationFrame(raf);
  removeEventListener('resize', relayout);
  scene.hidden = true;
  scene.className = 'gate-scene';
}

/* ---------- layout ---------- */

function layout() {
  P = Math.max(2, Math.min(5, Math.floor(Math.min(innerHeight * 0.5 / GH, innerWidth * 0.8 / GW))));
  W = Math.ceil(innerWidth / P);
  H = Math.ceil(innerHeight / P);
  const canvas = $('gate-canvas');
  canvas.width = W; canvas.height = H;
  ctx = canvas.getContext('2d');
  gx = Math.round((W - GW) / 2);
  gy = Math.round(H * (innerHeight > innerWidth ? 0.56 : 0.6)) - GH;
  gate = makeGate(GW, GH);
  gateCanvas = Object.assign(document.createElement('canvas'), { width: GW, height: GH });
  bg = paintCavern();
  halo = paintHalo();
  const plate = $('gate-plate');
  plate.style.setProperty('--gate-top', `${Math.max(8, gy * P - plate.offsetHeight - 14)}px`);
}

function relayout() { layout(); fitMon(); }

/** Your Pokémon from behind, bottom left like battle, its feet on the cavern floor above the text box. */
function fitMon() {
  const mon = $('gate-mon');
  const [top, bottom, left, right] = spriteFit(mon.src);
  const pose = Math.max(mon.naturalWidth - left - right, mon.naturalHeight - top - bottom) || 64;
  const room = Math.min(innerWidth * 0.42, innerHeight * 0.26);
  const s = Math.max(1, Math.min(4, Math.floor((room / pose) * 2) / 2));
  mon.style.width = `${mon.naturalWidth * s}px`;
  mon.style.height = `${mon.naturalHeight * s}px`;
  mon.style.setProperty('--foot', `${bottom * s}px`);
}

const loaded = (img) => img.complete && img.naturalWidth ? null : new Promise(resolve => { img.onload = img.onerror = resolve; });

/** The bar and number at hp; with trail, the bar's pale trail holds where it was until the hit settles. */
function showHp(hp, trail = false) {
  setGateBar(bar, hp, trail);
  $('gate-hp-text').textContent = `${Math.max(0, Math.round(hp))} / ${GATE_HP}`;
}

/* ---------- painting ---------- */

const hex = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/** The cavern, painted once a layout: a dark vault, rock walls framing it, crystals glinting, a flagstone floor. */
function paintCavern() {
  const c = Object.assign(document.createElement('canvas'), { width: W, height: H });
  const g = c.getContext('2d');
  const floor = gy + GH - 2;
  const img = g.createImageData(W, H);
  const sky = ['#05020c', '#0a0518', '#100824', '#170c30'].map(hex);
  const ground = ['#1c1430', '#241a3c', '#2e2248', '#3a2c58'].map(hex);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let col;
    if (y < floor) {
      const v = Math.min(0.999, y / floor) * (sky.length - 1);
      const b = Math.floor(v), m = v - b;
      col = sky[m * 16 > BAYER[(y % 4) * 4 + (x % 4)] ? Math.min(b + 1, sky.length - 1) : b];
    } else {
      // flagstones in perspective: rows taller as they come closer, joints fanning out from the gate
      const d = y - floor, depth = H - floor;
      const v = Math.min(0.999, d / depth) * (ground.length - 1);
      const b = Math.floor(v), m = v - b;
      col = ground[m * 16 > BAYER[(y % 4) * 4 + (x % 4)] ? Math.min(b + 1, ground.length - 1) : b];
      const row = Math.sqrt(d) * 2.2;
      const fan = (x - W / 2) / (d + 6) * 3.2;
      if (Math.abs(row - Math.round(row)) < 0.09 * (1 + d / depth) || Math.abs(fan - Math.round(fan)) < 0.05) col = hex('#120c22');
    }
    const i = (y * W + x) * 4;
    img.data[i] = col[0]; img.data[i + 1] = col[1]; img.data[i + 2] = col[2]; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);

  const rand = seeded(77);
  // rock walls down each side, and a ragged roof
  for (const side of [0, 1]) {
    let w = W * (0.12 + rand() * 0.06);
    for (let y = 0; y < H; y++) {
      w = Math.max(W * 0.05, Math.min(W * 0.3, w + (rand() - 0.5) * 3 + (y > floor ? 0.25 : 0)));
      const x0 = side ? W - Math.round(w) : 0;
      g.fillStyle = '#0a0614';
      g.fillRect(x0, y, Math.round(w), 1);
      g.fillStyle = '#2a2044';
      g.fillRect(side ? x0 : Math.round(w) - 1, y, 1, 1);
      if (rand() < 0.1) { g.fillStyle = '#1a1230'; g.fillRect(x0 + Math.floor(rand() * w), y, 2 + Math.floor(rand() * 4), 1); }
    }
  }
  let roof = 4;
  for (let x = 0; x < W; x++) {
    roof = Math.max(2, Math.min(H * 0.12, roof + (rand() - 0.5) * 2.4));
    g.fillStyle = '#0a0614';
    g.fillRect(x, 0, 1, Math.round(roof));
    if (rand() < 0.08) g.fillRect(x, 0, 1, Math.round(roof + 3 + rand() * 6));   // stalactites
  }
  // crystal clusters along the walls and the floor's edges
  for (let k = 0; k < 14; k++) {
    const side = k % 2, x = side ? W - 4 - rand() * W * 0.22 : 4 + rand() * W * 0.22;
    const y = k < 8 ? floor - rand() * H * 0.45 : floor + rand() * (H - floor) * 0.8;
    crystal(g, Math.round(x), Math.round(y), 3 + Math.floor(rand() * 7), rand);
  }
  return c;
}

function crystal(g, x, y, h, rand) {
  for (let s = 0; s < 3; s++) {
    const cx = x + (s - 1) * Math.ceil(h / 3), ch = Math.round(h * (s === 1 ? 1 : 0.6 + rand() * 0.2));
    for (let i = 0; i < ch; i++) {
      const w = Math.max(1, Math.round(Math.min(i + 1, ch - i) * 0.6));
      g.fillStyle = i < 2 ? '#e0c0ff' : '#6a3cc0';
      g.fillRect(cx - Math.floor(w / 2), y - i, w, 1);
      g.fillStyle = '#b070ff';
      g.fillRect(cx - Math.floor(w / 2), y - i, 1, 1);
    }
  }
}

/** The glow the seal throws on the cavern: a dithered halo, drawn stronger as the gate fails. */
function paintHalo() {
  const R = Math.round(GW * 0.95);
  const c = Object.assign(document.createElement('canvas'), { width: R * 2, height: R * 2 });
  const g = c.getContext('2d');
  for (let y = 0; y < R * 2; y++) for (let x = 0; x < R * 2; x++) {
    const d = Math.hypot(x - R, (y - R) * 1.15) / R;
    if (d > 1) continue;
    const a = (1 - d) ** 1.6;
    if (a * 16 > BAYER[(y % 4) * 4 + (x % 4)]) {
      g.fillStyle = a > 0.45 ? '#7a2a8a' : a > 0.2 ? '#4a1a6a' : '#2a1046';
      g.fillRect(x, y, 1, 1);
    }
  }
  return c;
}

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  t += dt;
  view.t = t;
  ctx.drawImage(bg, 0, 0);
  // the halo behind the gate, brighter the more it's hurt
  ctx.globalAlpha = Math.min(1, 0.35 + (1 - Math.max(0, view.hp)) * 0.65 + (view.open ? 0.4 : 0));
  ctx.drawImage(halo, gx + GW / 2 - halo.width / 2, gy + gate.sealY - halo.height / 2);
  ctx.globalAlpha = 1;
  const sx = shake && !still() ? Math.round((Math.random() - 0.5) * 2 * shake) : 0;
  const sy = shake && !still() ? Math.round((Math.random() - 0.5) * 2 * shake) : 0;
  if (rays > 0) drawRays(sx, sy);
  gate.paint(gateCanvas.getContext('2d'), view);
  ctx.drawImage(gateCanvas, gx + sx, gy + sy);
  view.flash = Math.max(0, view.flash - dt * 2.2);
  view.seal = Math.max(0, view.seal - dt * 1.5);
  for (const b of beams) b.draw(dt);
  beams = beams.filter(b => !b.done);
  stepParts(dt);
  raf = requestAnimationFrame(frame);
}

/* ---------- particles ---------- */

function spark(x, y, vx, vy, life, colors, { size = 1, grav = 0, drag = 0 } = {}) {
  if (still()) return;
  parts.push({ x, y, vx, vy, life, max: life, colors, size, grav, drag });
}

function stepParts(dt) {
  for (const p of parts) {
    p.life -= dt;
    p.vy += p.grav * dt;
    if (p.drag) { p.vx *= 1 - p.drag * dt; p.vy *= 1 - p.drag * dt; }
    p.x += p.vx * dt; p.y += p.vy * dt;
    const age = 1 - p.life / p.max;
    ctx.fillStyle = p.colors[Math.min(p.colors.length - 1, Math.floor(age * p.colors.length))];
    ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
  }
  parts = parts.filter(p => p.life > 0 && p.y < H + 4);
}

/* ---------- the attack ---------- */

function mouth() {
  const r = $('gate-mon').getBoundingClientRect();
  return [(r.left + r.width * 0.55) / P, (r.top + r.height * 0.35) / P];
}
const target = () => [gx + gate.cx, gy + gate.sealY];

/** The move flies at the seal; resolves as it lands. */
async function attack(type, kind) {
  const mon = $('gate-mon');
  mon.classList.add('lunge');
  setTimeout(() => mon.classList.remove('lunge'), 700);
  if (still()) { await sleep(400); return; }
  const big = kind === 'ultimate', small = kind === 'loss';
  const colors = FX[type];
  const [x0, y0] = mouth(), [x1, y1] = target();
  const len = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / len, uy = (y1 - y0) / len;
  const time = big ? 1.3 : small ? 0.6 : 0.95;
  if (big) {   // the ultimate moves charge first: energy gathers round your Pokémon
    playSound('power');
    for (let i = 0; i < 70; i++) {
      const a = Math.random() * Math.PI * 2, d = 14 + Math.random() * 10;
      spark(x0 + Math.cos(a) * d, y0 + Math.sin(a) * d, -Math.cos(a) * d * 2.2, -Math.sin(a) * d * 2.2, 0.45, colors.slice(0, 3));
    }
    await sleep(500);
  }
  playSound(type === 'fire' ? 'burn' : type === 'water' ? 'item' : 'ball-throw');
  if (type === 'water') {
    // a jet, a solid beam that wobbles, with bubbles thrown off it
    beams.push(beam(x0, y0, x1, y1, time, big ? 5 : small ? 2 : 3, colors));
    const end = performance.now() + time * 1000;
    while (performance.now() < end) {
      const s = Math.random();
      spark(x0 + (x1 - x0) * s, y0 + (y1 - y0) * s, (Math.random() - 0.5) * 20, -10 - Math.random() * 20, 0.5, ['#ffffff', '#b8f0ff', '#58c0f8']);
      await sleep(30);
    }
  } else if (type === 'grass') {
    // leaves spiralling at it
    const n = big ? 90 : small ? 18 : 45;
    for (let i = 0; i < n; i++) {
      leaf(x0, y0, x1, y1, time * 0.6, i, colors);
      await sleep((time * 1000 * 0.6) / n);
    }
    await sleep(time * 400);
  } else if (type === 'psychic') {
    beams.push(beam(x0, y0, x1, y1, time, big ? 4 : 2, colors, true));
    await sleep(time * 1000);
  } else {
    // fire: a roaring stream of flame; Blast Burn's ends in a fireball
    const end = performance.now() + time * 1000;
    const speed = len / 0.32;
    while (performance.now() < end) {
      for (let k = 0; k < (big ? 7 : small ? 2 : 4); k++) {
        const spread = (Math.random() - 0.5) * (big ? 0.35 : 0.22);
        const vx = (ux * Math.cos(spread) - uy * Math.sin(spread)) * speed, vy = (uy * Math.cos(spread) + ux * Math.sin(spread)) * speed;
        spark(x0, y0, vx * (0.85 + Math.random() * 0.3), vy * (0.85 + Math.random() * 0.3), 0.32 + Math.random() * 0.1, colors, { size: big ? 2 : 1 + (Math.random() < 0.5 ? 1 : 0) });
      }
      await sleep(16);
    }
  }
  await sleep(type === 'fire' ? 280 : 60);
}

function leaf(x0, y0, x1, y1, time, i, colors) {
  const p = { t: 0, i, done: false };
  p.draw = (dt) => {
    p.t += dt / time;
    if (p.t >= 1) { p.done = true; return; }
    const e = p.t, swirl = Math.sin(e * Math.PI) * 14;
    const a = e * 9 + i;
    const x = x0 + (x1 - x0) * e + Math.cos(a) * swirl, y = y0 + (y1 - y0) * e + Math.sin(a) * swirl * 0.6;
    ctx.fillStyle = colors[1 + (i % 3)];
    ctx.fillRect(Math.round(x), Math.round(y), 2, 1);
    ctx.fillStyle = colors[0];
    ctx.fillRect(Math.round(x) + (Math.sin(a * 2) > 0 ? 1 : 0), Math.round(y) - 1, 1, 1);
  };
  beams.push(p);
}

/** A beam that grows out to the target, holds wobbling, then thins away. */
function beam(x0, y0, x1, y1, time, width, colors, ring = false) {
  const b = { t: 0, done: false };
  const len = Math.hypot(x1 - x0, y1 - y0), nx = -(y1 - y0) / len, ny = (x1 - x0) / len;
  b.draw = (dt) => {
    b.t += dt;
    if (b.t > time + 0.25) { b.done = true; return; }
    const reach = Math.min(1, b.t / 0.18), fade = b.t > time ? 1 - (b.t - time) / 0.25 : 1;
    const w = Math.max(1, Math.round(width * fade * (0.85 + 0.15 * Math.sin(b.t * 40))));
    for (let s = 0; s <= len * reach; s += 1) {
      const x = x0 + (x1 - x0) * (s / len), y = y0 + (y1 - y0) * (s / len);
      const wob = ring ? Math.sin(s * 0.5 - b.t * 30) * 2 : Math.sin(s * 0.4 + b.t * 25) * 0.6;
      for (let k = -w; k <= w; k++) {
        const band = Math.abs(k) / (w + 0.01);
        ctx.fillStyle = band < 0.3 ? colors[0] : band < 0.65 ? colors[1] : band < 0.9 ? colors[2] : colors[3];
        ctx.fillRect(Math.round(x + nx * (k + wob)), Math.round(y + ny * (k + wob)), 1, 1);
      }
    }
  };
  return b;
}

/** The hit lands: a flash on the gate, a shake, sparks of the move and chips of stone. 'held': it bounces off the seal. */
function impact(type, kind) {
  const [x, y] = target();
  const big = kind === 'ultimate';
  view.flash = kind === 'held' ? 0.3 : big ? 1 : 0.7;
  if (!still()) {
    shake = kind === 'held' ? 1 : big ? 3 : 2;
    setTimeout(() => { shake = 0; }, big ? 700 : 400);
  }
  const n = kind === 'held' ? 30 : big ? 120 : kind === 'loss' ? 25 : 60;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, v = 20 + Math.random() * (big ? 90 : 55);
    spark(x, y, Math.cos(a) * v, Math.sin(a) * v, 0.4 + Math.random() * 0.4, kind === 'held' ? ['#ffd0e8', '#ff6aa8', '#e02a70'] : FX[type], { drag: 2, grav: type === 'water' ? 120 : 0 });
  }
  if (kind === 'held') return;
  for (let i = 0; i < (big ? 40 : 18); i++) {
    spark(gx + 6 + Math.random() * (GW - 12), gy + Math.random() * GH * 0.7, (Math.random() - 0.5) * 30, -20 - Math.random() * 30, 1.4, STONE, { grav: 160, size: Math.random() < 0.3 ? 2 : 1 });
  }
}

/** Run the bar down, its trail following after; each stage it passes, the gate cracks open another step. */
async function drain(from, to, ms) {
  if (still()) { view.hp = to / GATE_HP; showHp(to); return sleep(300); }
  let stage = gateStage(from);
  await new Promise(resolve => {
    const start = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - start) / ms), e = 1 - (1 - k) ** 2;
      const hp = from + (to - from) * e;
      view.hp = hp / GATE_HP;
      showHp(hp, true);
      if (hp > 0 && gateStage(hp) > stage) { stage = gateStage(hp); crackOpen(); }
      if (k < 1) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
  await sleep(250);
  settleGateBar(bar);
  await sleep(600);
}

/** A stage passed: the gate jolts, a burst of light and crystal off it, and the bar's rune there shatters. */
function crackOpen() {
  playSound('gate-crack');
  view.flash = Math.max(view.flash, 0.8);
  view.seal = 1;
  shake = 3;
  setTimeout(() => { shake = 0; }, 450);
  const plate = $('gate-plate');
  plate.classList.remove('jolt');
  void plate.offsetWidth;
  plate.classList.add('jolt');
  const [x, y] = target();
  for (let i = 0; i < 50; i++) {
    const a = Math.random() * Math.PI * 2, v = 30 + Math.random() * 70;
    spark(x, y, Math.cos(a) * v, Math.sin(a) * v, 0.6 + Math.random() * 0.4, ['#ffffff', '#ffd0e8', '#ff6aa8', '#e02a70'], { drag: 2 });
  }
  for (let i = 0; i < 14; i++) spark(gx + 6 + Math.random() * (GW - 12), gy + Math.random() * GH * 0.6, (Math.random() - 0.5) * 30, -30, 1.4, STONE, { grav: 160, size: 2 });
}

function popDamage(n) {
  const pop = $('gate-dmg');
  pop.textContent = `-${n}`;
  pop.style.left = `${(gx + GW / 2) * P}px`;
  pop.style.top = `${(gy + gate.sealY) * P}px`;
  pop.classList.remove('go');
  void pop.offsetWidth;
  pop.classList.add('go');
}

/* ---------- the break ---------- */

function drawRays(sx, sy) {
  const [x0, y0] = [gx + gate.cx + sx, gy + gate.sealY + sy];
  const n = 14;
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2 + t * 0.3 + Math.sin(k * 7.1) * 0.2;
    const len = (40 + 40 * Math.sin(k * 3.3 + t * 2)) * rays;
    for (let s = 6; s < len; s++) {
      if ((s + k) % 2 && s > len * 0.6) continue;
      ctx.fillStyle = s < len * 0.35 ? '#ffffff' : s < len * 0.7 ? '#ffd0ec' : '#ff58a8';
      ctx.fillRect(Math.round(x0 + Math.cos(a) * s), Math.round(y0 + Math.sin(a) * s * 0.9), 1, 1);
    }
  }
}

async function breakFree(scene, music) {
  const mewtwo = STARTERS_BY_ID.mewtwo;
  const free = $('gate-free'), img = $('gate-free-img');
  img.src = spriteUrl(mewtwo, 'front', 0, false);
  new Image().src = AURA_SRC;
  tellNow('The Sealed Gate is breaking!');
  playMusic(null);
  playSound('quake');
  // it shudders harder and harder, light bursting out of every crack, the runes dying and the chains giving way
  const end = performance.now() + (still() ? 600 : 2600);
  let snapped = false;
  while (performance.now() < end) {
    const k = 1 - (end - performance.now()) / (still() ? 600 : 2600);
    view.hp = -0.45 * k;
    view.eyes = Math.random() < 0.3 + k * 0.6 ? 1 : 0;
    shake = still() ? 0 : 1 + k * 3;
    rays = still() ? 0 : k;
    if (k > 0.45 && !snapped) { snapped = true; view.chains = 0; playSound('gate-crack'); }
    if (Math.random() < 0.25) spark(gx + 4 + Math.random() * (GW - 8), gy + 4 + Math.random() * GH * 0.5, (Math.random() - 0.5) * 20, -10, 1.2, STONE, { grav: 150 });
    await sleep(40);
  }
  // white out; under it the door is blown apart, and Mewtwo stands in the arch
  scene.classList.add('white');
  playSound('gate-shatter');
  playSound('eruption');
  await sleep(still() ? 100 : 260);
  view.open = true; view.figure = 1; view.eyes = 0; view.chains = undefined; rays = 0;
  shards();
  shake = still() ? 0 : 3;
  setTimeout(() => { shake = 0; }, 900);
  scene.classList.remove('white');
  scene.classList.add('after-white');
  await sleep(still() ? 300 : 1600);

  // a pause, then its eyes open
  for (const on of [1, 0, 1]) { view.eyes = on; await sleep(on ? 260 : 140); }
  playSound('gate-hum');
  await say(['The Sealed Gate shattered!', 'Something steps out of the light...']);

  // it steps out of the arch, still dark, and the colour floods in with its cry
  const fit = gate.figureFit();
  const box = $('gate-canvas').getBoundingClientRect();
  free.style.left = `${box.left + (gx + gate.cx) * P}px`;
  free.style.top = `${box.top + (gy + gate.floorY) * P}px`;
  await loaded(img);
  const s = Math.max(2, Math.min(5, Math.floor(innerHeight * 0.32 / img.naturalHeight)));
  place(img, s);
  free.hidden = false;
  free.classList.add('dark');
  if (fit) view.figure = 0;
  void free.offsetWidth;
  free.classList.add('step');
  await sleep(still() ? 100 : 1100);
  free.classList.add('flash');
  playSound('spirit');
  await sleep(still() ? 0 : 200);
  // its colours come in blazing with its psychic aura (the power-up GIF, padded round the same body at the same scale)
  const blaze = AURA_SRC;
  img.src = blaze;
  await loaded(img);
  place(img, s);
  free.classList.remove('dark');
  aura();
  await Promise.race([playCry('mewtwo'), sleep(1500)]);
  await say(['Mewtwo is free!', 'It will fight beside you now: choose it at New game.']);
  playMusic(music);   // the win's song comes back for the result window
  await leave(scene);
}

/** Mewtwo at scale s, its body (not its box: the sprite has room for its tail on one side) centred on the arch, feet on the floor. */
function place(img, s) {
  const [, bottom, left, right] = spriteFit(img.src);
  img.style.width = `${img.naturalWidth * s}px`;
  img.style.height = `${img.naturalHeight * s}px`;
  img.style.setProperty('--foot', `${bottom * s}px`);
  img.style.setProperty('--dx', `${((right - left) / 2) * s}px`);
}

/** The door blows apart: every pixel of it a shard flying out from the seal and falling. */
function shards() {
  if (still()) return;
  const [cx, cy] = [gate.cx, gate.sealY];
  for (const i of gate.doorPixels()) {
    if (Math.random() < 0.45) continue;
    const x = i % GW, y = (i / GW) | 0;
    const a = Math.atan2(y - cy, x - cx), d = Math.hypot(x - cx, y - cy);
    const v = 40 + Math.random() * 110 + d;
    spark(gx + x, gy + y, Math.cos(a) * v, Math.sin(a) * v - 40, 0.9 + Math.random() * 0.9,
      [SHARDS[Math.floor(Math.random() * SHARDS.length)], '#5a3a8a', '#341c58', '#22123e'], { grav: 220, drag: 0.6, size: Math.random() < 0.2 ? 2 : 1 });
  }
}

/** Psychic rings pulsing out round Mewtwo as its colours come in. */
function aura() {
  if (still()) return;
  const [x, y] = [gx + gate.cx, gy + gate.floorY - GH * 0.35];
  for (let ring = 0; ring < 3; ring++) {
    setTimeout(() => {
      for (let k = 0; k < 64; k++) {
        const a = (k / 64) * Math.PI * 2;
        spark(x + Math.cos(a) * 6, y + Math.sin(a) * 6, Math.cos(a) * 80, Math.sin(a) * 60, 0.8, FX.psychic, { drag: 1.5 });
      }
    }, ring * 260);
  }
}

function seeded(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
