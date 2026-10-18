/*
 * The Crystal Depths' ending (the user's script, 2026-10-18): after Eternamax falls, before the Champion of the Depths'
 * win scene. A white-out and a rumble, then the Energy Well: its red vortex cools to violet (and, with all five Waystones
 * lit, to crystal white as Mewtwo binds it with their star), Eternatus curled dim at the bottom, Mewtwo's talk, the light
 * rising; then five painted epilogue stills, a line each. All 2D on one low-res canvas (no WebGL context). Under reduced
 * motion nothing spins, shakes or drifts; the lines stay.
 */
import { $, el, sleep } from './ui.js';
import { playSound, playMusic, playCry } from './audio.js';
import { sceneSay } from './evolution.js';
import { calmFx } from './prefs.js';
import { tooSoon } from './hd2d.js';
import { gymTalk } from './gym.js';
import { getSave } from './storage.js';
import { STARTERS_BY_ID, spriteUrl } from './data/starters.js';
import { ENEMY_DEFS } from './data/enemies.js';
import { RING } from './data/towns.js';
import { GYM_LEADERS, gymWins } from './data/gym.js';
import { sealedMult } from './data/difficulty.js';

const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const rgb = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const mix = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
const css = ([r, g, b], a = 1) => `rgba(${r},${g},${b},${a})`;

// the Well's core as it cools: Eternatus's red, Mewtwo's violet, the bound seal's crystal white
const TONES = [['#ff3048', '#7a0c24', '#1c0410'], ['#c080ff', '#4a1c8a', '#0e0620'], ['#f4f0ff', '#8ab8f0', '#101a34']].map(t => t.map(rgb));
const toneAt = (c) => { const i = Math.min(1, Math.floor(c)), k = Math.min(1, c - i); return TONES[i].map((v, j) => mix(v, TONES[i + 1][j], k)); };

/** What Mewtwo says, after the Well cools: with all five Waystones (or before the shards count) it binds the Well. */
export function wellLines(bound, shards) {
  const pct = Math.round(sealedMult(shards) * 100);
  return {
    open: ['It is over. For now.', 'Eternatus cannot be destroyed. It is the Well\'s energy, given a body.', 'But without the energy it took, it will sleep. Longer than I did.'],
    full: ['The five stones\' light came all the way down. I fought at my full strength.', 'I can do what the old seal never could. Not a gate. Me.'],
    held: 'The seal is mine to hold now. It will not crack again.',
    part: [shards ? `I won with ${pct}% of my strength. It is enough to close the Well, not to bind it.` : 'I won with half my strength. It is enough to close the Well, not to bind it.',
      'One day it will stir again. Mend the rest of the stones, and I will be ready.'],
    you: ['...When the gate broke, I thought I had been freed by accident.', 'Then you walked every road with me. Win after win, you wore the seal down. On purpose.',
      'I have been alone with this power since the day I was made. I never had anyone fight beside me.', 'Thank you, Trainer.'],
    up: 'Come. The way up is open.',
  };
}

let P = 4, W = 0, H = 0, ctx = null, raf = 0, last = 0, t = 0;
let cool = 0, coolTo = 0, power = 1, rise = 0, riseTo = 0, motes = [], walls = null, gems = [];

/**
 * Play the Well. `bind`: 'full' (five shards: the star binds it), 'part' (fewer) or 'plain' (the shards don't count yet:
 * the full lines, no star). Resolves once the epilogue's last still is tapped away, the screen dark for the win scene;
 * call the returned close() once that scene covers it.
 */
export async function wellEnding({ stage = 0, shiny = false, bind = 'plain', shards = 5 }) {
  const scene = $('well-scene'), mon = $('well-mon');
  const said = wellLines(bind, shards);
  const mewtwo = { id: 'mewtwo', name: 'MEWTWO', talk: spriteUrl(STARTERS_BY_ID.mewtwo, 'front', stage, shiny) };
  const talk = (lines) => gymTalk(mewtwo, lines, { lit: true, title: '', look: 'psychic' });
  scene.className = `well-scene white${still() ? ' still' : ''}`;
  scene.hidden = false;
  $('well-log').hidden = true;
  $('well-slide').hidden = true;
  $('well-star').replaceChildren();
  mon.src = ENEMY_DEFS.eternatus.image;
  cool = coolTo = 0; power = 1; rise = riseTo = 0; t = 0;
  layout();
  addEventListener('resize', layout);
  last = performance.now();
  raf = requestAnimationFrame(frame);
  playMusic('seal', { restart: true });   // the victory fanfare gives way to the Depths' own song, the fall's

  // Eternamax's light gutters out: a white-out and a rumble, the Well showing through as it fades
  playSound('quake');
  if (!calmFx()) scene.classList.add('shaking');
  await sleep(still() ? 200 : 900);
  scene.classList.remove('white');
  await say(['Eternamax\'s light gutters out...', 'The Energy Well goes still.']);
  scene.classList.remove('shaking');

  // the vortex slows and cools to violet; Eternatus sinks, dim
  coolTo = 1;
  scene.classList.add('spent');
  playSound('gate-hum');
  await Promise.race([playCry('eternatus', { rate: 0.7, echo: true }), sleep(2600)]);
  await say(['Eternatus is too weak to rise. Its energy pours back into the crystal walls.']);
  await talk(said.open);

  if (bind === 'part') await talk(said.part);
  else {
    await talk(said.full);
    if (bind === 'full') {
      await star(scene);
      await say(['Mewtwo binds the Well with the star of the five Waystones.']);
    } else coolTo = 2;
    await talk([said.held]);
  }
  await talk(said.you);

  // a beat, and the Well's light rises round them
  riseTo = 1;
  scene.classList.add('rising');
  playSound('core-surge');
  await sleep(still() ? 300 : 1400);
  await talk([said.up]);
  scene.classList.add('dark');
  await sleep(still() ? 0 : 700);
  cancelAnimationFrame(raf);
  removeEventListener('resize', layout);
  await epilogue(scene);
  return () => {
    scene.hidden = true;
    scene.className = 'well-scene';
    $('well-slide').hidden = true;
  };
}

const say = (lines) => sceneSay('well-scene', 'well-log', lines);

/** The five Waystones' star over the Well: drawn line by line in their colours, a flash, then it sinks into the crystal. */
async function star(scene) {
  const NS = 'http://www.w3.org/2000/svg', svg = $('well-star');
  const pt = (k) => { const a = (-90 + k * 72) * Math.PI / 180; return [Math.cos(a) * 80, Math.sin(a) * 80]; };
  const node = (tag, attrs) => { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); return n; };
  svg.replaceChildren(node('circle', { class: 'well-ring', r: 92 }));
  for (let k = 0; k < 5; k++) {   // the pentagram's strokes, each from a point two along, in that town's colour
    const [x1, y1] = pt(k), [x2, y2] = pt(k + 2);
    const line = node('line', { class: 'well-stroke', x1, y1, x2, y2 });
    line.style.setProperty('--glow', RING[k].glow);
    line.style.setProperty('--i', k);
    svg.append(line);
  }
  RING.forEach((town, k) => {
    const [x, y] = pt(k), gem = node('circle', { class: 'well-gem', cx: x, cy: y, r: 9 });
    gem.style.setProperty('--glow', town.glow);
    gem.style.setProperty('--i', k);
    svg.append(gem);
  });
  scene.classList.add('star');
  for (let k = 0; k < 5; k++) { playSound(`crystal-${k % 3}`); await sleep(still() ? 0 : 260); }
  await sleep(still() ? 0 : 500);
  playSound('gate-shatter');
  if (!calmFx()) { scene.classList.remove('flash'); void scene.offsetWidth; scene.classList.add('flash'); }
  scene.classList.add('sink');
  coolTo = 2;
  await sleep(still() ? 200 : 1600);
}

/* ---------- the Well, painted ---------- */

function layout() {
  P = innerWidth < 720 ? 4 : 5;
  W = Math.ceil(innerWidth / P);
  H = Math.ceil(innerHeight / P);
  const canvas = $('well-canvas');
  canvas.width = W; canvas.height = H;
  ctx = canvas.getContext('2d');
  // the cavern's two walls, jagged, narrowing to the Well; crystals jutting from them and the floor's rim
  walls = Array.from({ length: H }, (_, y) => {
    const f = y / H, jag = (hash(y * 0.37) - 0.5) * 3 + Math.sin(y * 0.11) * 2;
    return [W * (0.06 + 0.16 * Math.sin(f * Math.PI)) + jag, W * (0.94 - 0.16 * Math.sin(f * Math.PI)) - jag * 0.8];
  });
  gems = Array.from({ length: 16 }, (_, i) => {
    const left = i % 2 === 0, y = Math.round(H * (0.12 + 0.8 * hash(i * 3.1)));
    const [l, r] = walls[Math.min(H - 1, y)];
    return { x: left ? l : r, y, h: 6 + hash(i * 7.7) * Math.min(W, H) * 0.12, lean: (left ? 1 : -1) * (0.3 + hash(i * 1.9) * 0.9), w: 2 + hash(i * 5.3) * 3, k: hash(i) };
  });
  for (let i = 0; i < 7; i++) {   // the floor's crystals round the Well's rim
    const x = W * (0.2 + 0.6 * hash(i * 9.1 + 4)), y = H * (0.8 + 0.12 * hash(i * 2.3));
    gems.push({ x, y, h: 5 + hash(i * 4.4) * Math.min(W, H) * 0.09, lean: (hash(i * 6.6) - 0.5) * 0.8, w: 2 + hash(i * 8.8) * 3, k: hash(i + 9) });
  }
  motes = Array.from({ length: Math.round(W / 3) }, (_, i) => ({ x: hash(i * 1.3) * W, y: hash(i * 2.9) * H, v: 0.2 + hash(i * 3.7) * 0.8, s: hash(i * 6.1) }));
  fitMon();
  paint();
}

function fitMon() {
  const mon = $('well-mon');
  mon.style.height = `${Math.round(Math.min(innerHeight * 0.26, innerWidth * 0.5))}px`;
}

function frame(now) {
  raf = requestAnimationFrame(frame);
  if (tooSoon(now, last)) return;
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!still()) t += dt;
  cool += Math.sign(coolTo - cool) * Math.min(Math.abs(coolTo - cool), dt * 0.45);
  rise += Math.sign(riseTo - rise) * Math.min(Math.abs(riseTo - rise), dt * 0.6);
  power = Math.max(0.15, 1 - cool * 0.6);
  if (still()) { cool = coolTo; rise = riseTo; }
  paint();
}

function paint() {
  if (!ctx) return;
  const [core, mid, deep] = toneAt(cool);
  const cx = W / 2, cy = H * 0.66, R = Math.min(W * 0.42, H * 0.3);
  // the cavern's air: darkest above, lit from the Well below
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, css(mix(deep, [0, 0, 0], 0.6)));
  sky.addColorStop(0.55, css(deep));
  sky.addColorStop(1, css(mix(mid, deep, 0.4)));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 2.2);
  glow.addColorStop(0, css(core, 0.75));
  glow.addColorStop(0.35, css(mid, 0.45));
  glow.addColorStop(1, css(mid, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // the vortex: arms of energy spiralling in, spinning slower as Eternatus's power goes
  const arms = 6, spin = t * (0.3 + power * 1.5);
  for (let a = 0; a < arms; a++) {
    for (let s = 0; s < 46; s++) {
      const f = s / 46, r = R * (0.08 + f * 0.95);
      const ang = a * (Math.PI * 2 / arms) + f * 3.4 - spin;
      const x = cx + Math.cos(ang) * r, y = cy + Math.sin(ang) * r * 0.42;
      ctx.fillStyle = css(mix(core, mid, f), (1 - f) * (0.5 + power * 0.5));
      const d = Math.max(1, Math.round((1 - f) * 3));
      ctx.fillRect(Math.round(x), Math.round(y), d, d);
    }
  }
  ctx.fillStyle = css(core, 0.9);
  ctx.beginPath();
  ctx.ellipse(cx, cy, R * 0.18, R * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();

  // the walls, black against the light, their edge rimmed by it
  const rock = css(mix(deep, [0, 0, 0], 0.75)), rim = css(mix(mid, core, cool / 2), 0.9);
  for (let y = 0; y < H; y++) {
    const [l, r] = walls[y];
    ctx.fillStyle = rock;
    ctx.fillRect(0, y, Math.round(l), 1);
    ctx.fillRect(Math.round(r), y, W - Math.round(r), 1);
    ctx.fillStyle = rim;
    ctx.fillRect(Math.round(l) - 1, y, 1, 1);
    ctx.fillRect(Math.round(r), y, 1, 1);
  }
  // the floor's lip in front of the Well
  ctx.fillStyle = rock;
  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.lineTo(0, H * 0.86);
  for (let i = 0; i <= 12; i++) ctx.lineTo(W * i / 12, H * (0.88 + (hash(i * 4.2) - 0.5) * 0.04));
  ctx.lineTo(W, H);
  ctx.fill();

  // the crystals: they drink the energy as it pours back, brightening as the Well cools
  const lit = Math.min(1, 0.25 + cool * 0.5);
  for (const g of gems) {
    const tw = still() ? 0 : Math.max(0, Math.sin(t * 2 + g.k * 20)) * 0.3;
    const tipX = g.x + g.lean * g.h, tipY = g.y - g.h;
    ctx.fillStyle = css(mix(mid, core, lit * 0.6 + tw * 0.5), 0.95);
    ctx.beginPath(); ctx.moveTo(g.x - g.w, g.y); ctx.lineTo(tipX, tipY); ctx.lineTo(g.x, g.y); ctx.fill();
    ctx.fillStyle = css(mix(deep, mid, lit), 0.95);
    ctx.beginPath(); ctx.moveTo(g.x, g.y); ctx.lineTo(tipX, tipY); ctx.lineTo(g.x + g.w, g.y); ctx.fill();
  }

  // motes: drawn in to the Well while it rages, drifting up into the walls as it cools, rising fast with the light
  for (const m of motes) {
    if (!still()) m.y -= m.v * (0.15 + cool * 0.25 + rise * 2.5);
    if (m.y < 0) { m.y = H; m.x = hash(m.x + t) * W; }
    ctx.fillStyle = css(mix(core, [255, 255, 255], 0.5), 0.3 + m.s * 0.5);
    ctx.fillRect(Math.round(m.x), Math.round(m.y), 1, 1);
  }

  if (rise > 0) {   // the light rising round them
    const up = ctx.createLinearGradient(0, H, 0, H * (1 - rise * 1.2));
    up.addColorStop(0, css([255, 250, 255], rise * 0.85));
    up.addColorStop(1, css([255, 250, 255], 0));
    ctx.fillStyle = up;
    ctx.fillRect(0, 0, W, H);
  }
}

/* ---------- the epilogue: five painted stills, a line each ---------- */

const SLIDES = [
  { paint: lanternNight, line: 'The Waystones burn on, all across the land.' },
  { paint: clearingPC, line: 'Back home, word spreads fast.', cast: () => [{ src: 'assets/trainers/gym/nietos.png', x: 34, y: 82, h: 34, cls: 'wave' }] },
  { paint: leaderStage, line: 'Every leader you beat heard what you did below.', cast: leaderRow },
  { paint: depthsCamp, line: 'The miners\' camp falls quiet. Nothing stirs under the gate.' },
  { paint: titleSky, line: 'And something old sleeps beneath it all.', cast: () => [{ src: ENEMY_DEFS.eternatus.image, x: 50, y: 40, h: 11, cls: 'drift' }] },
];

async function epilogue(scene) {
  const slide = $('well-slide'), art = $('well-slide-art'), cast = $('well-slide-cast');
  slide.hidden = false;
  for (const s of SLIDES) {
    const p = innerWidth < 720 ? 3 : 4, w = Math.ceil(innerWidth / p), h = Math.ceil(innerHeight / p);
    art.width = w; art.height = h;
    const c = art.getContext('2d');
    c.imageSmoothingEnabled = false;
    s.paint(c, w, h);
    cast.replaceChildren(...(s.cast?.() ?? []).map(({ src, x, y, h: tall, cls = '' }) => {
      const img = el('img', `well-cast pixel ${cls}`);
      img.src = src;
      img.alt = '';
      img.style.left = `${x}%`;
      img.style.top = `${y}%`;
      img.style.height = `${tall}%`;
      return img;
    }));
    slide.classList.remove('in');
    void slide.offsetWidth;
    slide.classList.add('in');
    playSound('crystal-1');
    await sleep(still() ? 0 : 700);
    await say([s.line]);
    slide.classList.remove('in');
    await sleep(still() ? 0 : 600);
  }
  cast.replaceChildren();
}

/** The leaders you've beaten in a row along the stage (all of them, if you've beaten none yet). The Nietos' sprite is Law
    and Britt again with Linc, so they stand as Linc alone, cut out of it, small, in the front row (the user's ask). */
function leaderRow() {
  const all = GYM_LEADERS.filter(l => l.sprite), beaten = all.filter(l => gymWins(getSave(), l.id) > 0);
  const picked = beaten.length ? beaten : all;
  const list = picked.filter(l => l.id !== 'nietos').map(l => ({ src: l.sprite, size: 1 }));
  const back = list.length > 7 ? Math.floor(list.length / 2) : 0;   // two rows when it's a crowd
  if (picked.some(l => l.id === 'nietos')) list.splice(back + Math.ceil((list.length - back) / 2), 0, { src: 'assets/trainers/gym/linc.png', size: 0.62 });
  const place = (row, y, scale) => row.map((l, i) => {
    const per = Math.min(16, 88 / row.length);
    return { src: l.src, x: 50 + (i - (row.length - 1) / 2) * per, y, h: Math.min(26, per * 2.4) * scale * l.size };
  });
  return [...place(list.slice(0, back), 72, 0.85), ...place(list.slice(back), 88, 1)];
}

function stars(c, w, h, n, top = 0.6) {
  for (let i = 0; i < n; i++) {
    c.fillStyle = `rgba(255,248,230,${0.35 + hash(i * 3.3) * 0.65})`;
    c.fillRect(Math.round(hash(i * 1.7) * w), Math.round(hash(i * 2.9) * h * top), 1, 1);
  }
}
const grad = (c, y0, y1, stops) => { const g = c.createLinearGradient(0, y0, 0, y1); stops.forEach((s, i) => g.addColorStop(i / (stops.length - 1), s)); return g; };
function halo(c, x, y, r, color, a = 0.6) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, css(rgb(color), a));
  g.addColorStop(1, css(rgb(color), 0));
  c.fillStyle = g;
  c.fillRect(x - r, y - r, r * 2, r * 2);
}

/** Lantern Village at night: its rooftops, strings of lanterns, the mended Waystone burning in the plaza. */
function lanternNight(c, w, h) {
  c.fillStyle = grad(c, 0, h, ['#070a22', '#14143a', '#2a1a48', '#3a2040']);
  c.fillRect(0, 0, w, h);
  stars(c, w, h, Math.round(w * h / 90), 0.5);
  c.fillStyle = '#f8f0d0';
  c.beginPath(); c.arc(w * 0.82, h * 0.14, Math.min(w, h) * 0.05, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#1a1230';   // far hills
  c.beginPath(); c.moveTo(0, h * 0.62);
  for (let i = 0; i <= 10; i++) c.lineTo(w * i / 10, h * (0.55 + Math.sin(i * 1.3) * 0.04));
  c.lineTo(w, h); c.lineTo(0, h); c.fill();
  const ground = h * 0.78;
  for (let i = 0; i < 6; i++) {   // rooftops either side of the plaza
    const left = i < 3, k = i % 3, bw = w * 0.14, x = left ? w * (0.02 + k * 0.13) : w * (0.98 - (k + 1) * 0.13), top = ground - h * (0.14 + hash(i) * 0.05);
    c.fillStyle = '#2c1c24';
    c.fillRect(x, top, bw, ground - top);
    c.fillStyle = '#140c18';
    c.beginPath(); c.moveTo(x - bw * 0.12, top + 2); c.quadraticCurveTo(x + bw / 2, top - h * 0.09, x + bw * 1.12, top + 2); c.fill();
    c.fillStyle = '#ffc070';
    c.fillRect(Math.round(x + bw * 0.4), Math.round(top + (ground - top) * 0.35), Math.max(2, Math.round(bw * 0.18)), Math.max(2, Math.round(bw * 0.16)));
  }
  c.fillStyle = '#20182a';
  c.fillRect(0, ground, w, h - ground);
  c.strokeStyle = 'rgba(40,24,30,0.9)';   // the lantern strings, sagging across the plaza
  for (const [y, n] of [[0.42, 7], [0.5, 9]]) {
    c.beginPath(); c.moveTo(0, h * y); c.quadraticCurveTo(w / 2, h * (y + 0.08), w, h * y); c.stroke();
    for (let i = 1; i < n; i++) {
      const f = i / n, x = w * f, ly = h * y + Math.sin(f * Math.PI) * h * 0.04 + 2;
      halo(c, x, ly, 7, '#ff9050', 0.5);
      c.fillStyle = i % 2 ? '#ff7048' : '#ffb050';
      c.fillRect(Math.round(x) - 1, Math.round(ly) - 1, 3, 4);
    }
  }
  const sx = w / 2, glow = RING[0].glow;   // the Waystone: a tall stone, its cracks burning, a beam into the sky
  c.fillStyle = grad(c, 0, ground, ['rgba(255,140,110,0)', 'rgba(255,140,110,0.35)']);
  c.fillRect(sx - 3, 0, 6, ground);
  halo(c, sx, ground - h * 0.12, Math.min(w, h) * 0.25, glow, 0.55);
  c.fillStyle = '#4a4058';
  c.beginPath(); c.moveTo(sx - w * 0.035, ground); c.lineTo(sx - w * 0.025, ground - h * 0.22); c.lineTo(sx, ground - h * 0.26); c.lineTo(sx + w * 0.025, ground - h * 0.22); c.lineTo(sx + w * 0.035, ground); c.fill();
  c.strokeStyle = glow; c.lineWidth = 1;
  c.beginPath(); c.moveTo(sx, ground - h * 0.24); c.lineTo(sx - 2, ground - h * 0.16); c.lineTo(sx + 2, ground - h * 0.1); c.lineTo(sx - 1, ground - h * 0.03); c.stroke();
  c.fillStyle = '#e8d8ff';
  c.fillRect(sx - 1, ground - h * 0.255, 2, 2);
}

/** The Clearing's house: a wooden room, a window on the night, the PC's screen lit; the Nietos waving beside it. */
function clearingPC(c, w, h) {
  const floor = h * 0.8;
  c.fillStyle = grad(c, 0, floor, ['#5a3a28', '#7a5034', '#6a4430']);
  c.fillRect(0, 0, w, floor);
  for (let x = 0; x < w; x += Math.max(6, Math.round(w / 14))) { c.fillStyle = 'rgba(40,20,10,0.35)'; c.fillRect(x, 0, 1, floor); }
  c.fillStyle = grad(c, floor, h, ['#a07850', '#7a5838']);
  c.fillRect(0, floor, w, h - floor);
  for (let y = floor + 4; y < h; y += 5) { c.fillStyle = 'rgba(60,36,20,0.35)'; c.fillRect(0, y, w, 1); }
  const wx = w * 0.12, wy = h * 0.14, ww = w * 0.22, wh = h * 0.24;   // the window
  c.fillStyle = '#3a2416'; c.fillRect(wx - 3, wy - 3, ww + 6, wh + 6);
  c.fillStyle = grad(c, wy, wy + wh, ['#101438', '#2a2a5a']); c.fillRect(wx, wy, ww, wh);
  c.save(); c.beginPath(); c.rect(wx, wy, ww, wh); c.clip(); stars(c, w, h, 40, 0.4); c.restore();
  c.fillStyle = '#3a2416'; c.fillRect(wx + ww / 2 - 1, wy, 2, wh); c.fillRect(wx, wy + wh / 2 - 1, ww, 2);
  const dx = w * 0.56, dw = w * 0.36, dy = floor - h * 0.2;   // the desk and the PC
  c.fillStyle = '#4a2c1a'; c.fillRect(dx, dy, dw, h * 0.035);
  c.fillRect(dx + 3, dy, 4, floor - dy); c.fillRect(dx + dw - 7, dy, 4, floor - dy);
  const mx = dx + dw * 0.22, mw = dw * 0.56, mh = h * 0.2, my = dy - mh - 4;
  halo(c, mx + mw / 2, my + mh / 2, Math.min(w, h) * 0.32, '#70c0ff', 0.45);
  c.fillStyle = '#d8d0c0'; c.fillRect(mx - 3, my - 3, mw + 6, mh + 6);
  c.fillStyle = grad(c, my, my + mh, ['#58b8ff', '#2a70d0']); c.fillRect(mx, my, mw, mh);
  c.fillStyle = '#e8f6ff';
  for (let i = 0; i < 4; i++) c.fillRect(Math.round(mx + 4), Math.round(my + 4 + i * mh * 0.2), Math.round(mw * (0.4 + hash(i) * 0.45)), 2);
  c.fillStyle = '#b8b0a0'; c.fillRect(mx + mw / 2 - 3, my + mh + 3, 6, 4);
}

/** A stage at dusk for the Gym Leaders to stand along. */
function leaderStage(c, w, h) {
  c.fillStyle = grad(c, 0, h * 0.7, ['#20184a', '#6a2a5a', '#d8603a', '#f8b048']);
  c.fillRect(0, 0, w, h);
  stars(c, w, h, Math.round(w * h / 200), 0.3);
  halo(c, w / 2, h * 0.7, Math.max(w, h) * 0.5, '#ffd070', 0.5);
  c.fillStyle = '#3a1a38';
  c.beginPath(); c.moveTo(0, h * 0.72);
  for (let i = 0; i <= 8; i++) c.lineTo(w * i / 8, h * (0.66 + hash(i * 3) * 0.05));
  c.lineTo(w, h); c.lineTo(0, h); c.fill();
  c.fillStyle = grad(c, h * 0.8, h, ['#c89858', '#8a6034']);
  c.fillRect(0, h * 0.8, w, h * 0.2);
  c.fillStyle = '#f0d088'; c.fillRect(0, h * 0.8, w, 2);
}

/** The Depths camp after: tents, the fire still lit, the crystal cart on its rails empty, the dark mine mouth. */
function depthsCamp(c, w, h) {
  c.fillStyle = grad(c, 0, h, ['#05030c', '#120a26', '#1e1238', '#140c26']);
  c.fillRect(0, 0, w, h);
  for (let i = 0; i < 18; i++) {   // the cavern roof's stalactites
    const x = hash(i * 2.1) * w, len = h * (0.05 + hash(i * 4.3) * 0.12);
    c.fillStyle = '#0a0618';
    c.beginPath(); c.moveTo(x - 4, 0); c.lineTo(x, len); c.lineTo(x + 4, 0); c.fill();
  }
  const ground = h * 0.74;
  c.fillStyle = '#1a1028'; c.fillRect(0, ground, w, h - ground);
  const mx = w * 0.82, my = ground;   // the mine mouth, timbered, black inside
  c.fillStyle = '#020104'; c.beginPath(); c.moveTo(mx - w * 0.09, my); c.lineTo(mx - w * 0.07, my - h * 0.2); c.lineTo(mx + w * 0.07, my - h * 0.2); c.lineTo(mx + w * 0.09, my); c.fill();
  c.fillStyle = '#5a3a20'; c.fillRect(mx - w * 0.085, my - h * 0.21, w * 0.17, 3); c.fillRect(mx - w * 0.085, my - h * 0.21, 3, h * 0.21); c.fillRect(mx + w * 0.082, my - h * 0.21, 3, h * 0.21);
  c.fillStyle = '#4a3420';   // the rails
  c.fillRect(w * 0.45, ground + h * 0.05, w * 0.5, 1); c.fillRect(w * 0.45, ground + h * 0.08, w * 0.5, 1);
  for (let x = w * 0.46; x < w * 0.95; x += 6) c.fillRect(Math.round(x), ground + h * 0.045, 2, h * 0.045);
  const kx = w * 0.56, ky = ground + h * 0.03;   // the cart, empty
  c.fillStyle = '#3a3448'; c.beginPath(); c.moveTo(kx, ky - h * 0.07); c.lineTo(kx + w * 0.14, ky - h * 0.07); c.lineTo(kx + w * 0.125, ky); c.lineTo(kx + w * 0.015, ky); c.fill();
  c.fillStyle = '#6a6080'; c.fillRect(kx, ky - h * 0.07, w * 0.14, 2);
  c.fillStyle = '#181420'; c.fillRect(kx + 2, ky - h * 0.065, w * 0.14 - 4, 3);
  c.fillStyle = '#20182a'; c.beginPath(); c.arc(kx + w * 0.03, ky + 1, 3, 0, Math.PI * 2); c.arc(kx + w * 0.11, ky + 1, 3, 0, Math.PI * 2); c.fill();
  for (const [x, s, col] of [[0.1, 1, '#6a3a30'], [0.27, 0.8, '#3a5a6a']]) {   // two tents
    const tx = w * x, tw = w * 0.16 * s, th = h * 0.16 * s;
    c.fillStyle = col; c.beginPath(); c.moveTo(tx, ground); c.lineTo(tx + tw / 2, ground - th); c.lineTo(tx + tw, ground); c.fill();
    c.fillStyle = 'rgba(0,0,0,0.45)'; c.beginPath(); c.moveTo(tx + tw / 2, ground); c.lineTo(tx + tw / 2, ground - th); c.lineTo(tx + tw * 0.62, ground); c.fill();
  }
  const fx = w * 0.4, fy = ground + h * 0.02;   // the fire, still burning low
  halo(c, fx, fy - 4, Math.min(w, h) * 0.3, '#ff9040', 0.5);
  c.fillStyle = '#4a2c18'; c.fillRect(fx - 6, fy - 1, 12, 2);
  for (const [dx, hh, col] of [[0, 9, '#ff7030'], [-2, 6, '#ffb040'], [2, 5, '#ffb040'], [0, 4, '#fff0a0']]) {
    c.fillStyle = col; c.beginPath(); c.moveTo(fx + dx - 3, fy - 1); c.lineTo(fx + dx, fy - 1 - hh); c.lineTo(fx + dx + 3, fy - 1); c.fill();
  }
  for (let i = 0; i < 10; i++) {   // crystal glints on the walls
    const x = hash(i * 5.5) * w, y = h * (0.2 + hash(i * 6.7) * 0.45);
    halo(c, x, y, 4, i % 2 ? '#b080f0' : '#80d8f0', 0.5);
    c.fillStyle = '#e8f0ff'; c.fillRect(Math.round(x), Math.round(y), 1, 1);
  }
}

/** The title's sky by day: clouds over far hills, Eternatus drifting small across it. */
function titleSky(c, w, h) {
  c.fillStyle = grad(c, 0, h, ['#4a8ae0', '#7ab8f0', '#b8e0f8', '#e8f4f0']);
  c.fillRect(0, 0, w, h);
  c.fillStyle = 'rgba(255,255,255,0.9)';
  for (let i = 0; i < 7; i++) {
    const x = hash(i * 3.9) * w, y = h * (0.1 + hash(i * 7.1) * 0.4), r = Math.min(w, h) * (0.04 + hash(i * 2.2) * 0.05);
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.arc(x + r, y + r * 0.3, r * 0.8, 0, Math.PI * 2); c.arc(x - r, y + r * 0.35, r * 0.7, 0, Math.PI * 2); c.fill();
  }
  c.fillStyle = '#7aa0b8';
  c.beginPath(); c.moveTo(0, h * 0.74);
  for (let i = 0; i <= 10; i++) c.lineTo(w * i / 10, h * (0.68 + Math.sin(i * 0.9) * 0.04));
  c.lineTo(w, h); c.lineTo(0, h); c.fill();
  c.fillStyle = '#5a9850';
  c.beginPath(); c.moveTo(0, h * 0.84);
  for (let i = 0; i <= 10; i++) c.lineTo(w * i / 10, h * (0.8 + Math.cos(i * 1.4) * 0.025));
  c.lineTo(w, h); c.lineTo(0, h); c.fill();
}
