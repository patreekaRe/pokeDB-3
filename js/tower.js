/*
 * The Sky Pillar's screen (roadmap item 18 b): the climb is the map. A side-on cutaway of the tower (js/tower-art.js)
 * fills the map screen behind the run card, the floor you stand on low in the middle: its 2-3 doors, each with its room's
 * icon over the arch, the spiral stair at the right, the floors you've climbed lit below with a stone statue of every
 * foe beaten before the door it came through, the floors still to climb dim above. Pick a door and your Pokémon walks
 * to it and in (run.js's enterNode). Come back out and it climbs the stair while the camera pans up a floor and the LCD
 * on the bar below says which ten floors; the altitude gauge at the side tops out at floor 100.
 *
 * Also here: a guardian's intro before its fight (Rayquaza's at the summit the grandest) and the fall on a loss, both on
 * one overlay (#tower-fx) painted by the same art, so every floor looks the same wherever it's seen.
 */
import { FH, SLAB, TOP, K, bay, hash, makeBuffer, flush, paintSky, paintTower, towerLayout, doorXs, stairSteps, skyHex, DOOR_GEM } from './tower-art.js';
import { NODE_INFO } from './map.js';
import { ENEMY_DEFS } from './data/enemies.js';
import { spriteFit } from './data/sprite-fit.js';
import { playSound, preloadSounds } from './audio.js';
import { $, el, sleep } from './ui.js';
import { calmFx } from './prefs.js';

const FPS = 30;       // the art's own clock (flicker, drift); the screen itself repaints every display frame
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const ease = (v) => (v < 0.5 ? 2 * v * v : 1 - (-2 * v + 2) ** 2 / 2);
const pixel = () => (innerWidth <= 720 ? 3 : 4);
const STAND = 0.14;  // where the floor you stand on sits, from the top of the bottom bar (the run card and pockets)
const BANNER_OF = (flight) => (flight >= 9 ? 'top' : flight % 3);

let V = null;        // the screen: { b, lay, P, W, H }
let S = null;        // the climb as last drawn: see renderTower()
let camY = 0;
let tick = 0;
let timer = null;
let flash = 0;
let busy = false;    // a walk or a climb is playing: the doors wait
let held = false;    // the climb up from the floor below waits on a pick (waitBelow())
let last = null;     // the door last walked through: { floor, k, n, type }, so coming back out climbs on from it
const statues = new Map();   // enemy id -> its stone statue, a little canvas (null while it loads)
const mon = { x: 0, floor: 1, lift: 0, alpha: 1, flip: false, behind: false, hop: 0 };   // your Pokémon, in tower pixels

/* ---------- the screen ---------- */

function layout() {
  const P = pixel(), W = Math.ceil(innerWidth / P), H = Math.ceil(innerHeight / P);
  const canvas = $('tw-canvas');
  const b = makeBuffer(canvas, W, H + 1);   // a spare row on top, so the camera can sit between pixels (see paint())
  canvas.style.width = `${W * P}px`;
  canvas.style.height = `${(H + 1) * P}px`;
  V = { b, P, W, H, lay: towerLayout(W) };
  fitMon();
  placeGauge();
}

// The bar along the bottom: its height and its LCD's top, as CSS variables for the top bar and the gauge (css/screens.css)
let barH = 0;
function measureBar() {
  const win = document.querySelector('#map-screen.tower .mdex-window');
  if (!win || !win.offsetHeight || $('map-screen').classList.contains('bar-in')) return false;   // sliding in: measured once it's up
  const hinge = document.querySelector('#map-screen.tower .mdex-hinge');
  const top = Math.min(win.getBoundingClientRect().top, hinge ? hinge.getBoundingClientRect().top : Infinity), h = Math.round(innerHeight - top);
  const lcd = win.querySelector('.run-card').getBoundingClientRect(), css = document.documentElement.style;
  css.setProperty('--tw-lcd-x', `${Math.round(lcd.left)}px`);
  css.setProperty('--tw-lcd-y', `${Math.round(lcd.top)}px`);
  css.setProperty('--tw-lcd-h', `${Math.round(lcd.height)}px`);
  // the Home key sits on the hinge after the lights, placed inside the top bar, which is laid on the LCD
  const lights = hinge?.querySelector('.mdex-lights')?.getBoundingClientRect();
  if (lights) {
    css.setProperty('--tw-home-x', `${Math.round(lights.right + 10 - (lcd.left + 6))}px`);
    css.setProperty('--tw-home-y', `${Math.round(lights.top + lights.height / 2 - 13 - lcd.top)}px`);
  }
  document.documentElement.style.setProperty('--tw-bar-h', `${h}px`);
  if (h === barH) return false;
  barH = h;
  return true;
}
const standY = (floor) => floor * FH + SLAB - Math.round((barH + (innerHeight - barH) * STAND) / V.P);
const surfRow = (floor) => V.H - 1 - (floor * FH + SLAB - 1 - camY);   // the screen row a floor's feet stand on

/** What each floor holds, for the painter: doors, light, its guardian hall. */
function floorInfo(f) {
  if (!S) return null;
  const { floorNow, flight, rows, trail, opening } = S;
  const lit = f <= floorNow;
  const guardian = f % 10 === 0 && f > 0;
  const info = { lit, guardian, banner: BANNER_OF(Math.floor((f - 1) / 10)) };
  const past = trail.find(e => e.f === f);
  if (f === floorNow) info.doors = rows(f)?.map((type, k) => ({ type, open: opening?.k === k ? opening.v : 0 }));
  else if (past && f < floorNow) {
    const open = S.exit?.f === f ? S.exit.v : 0;
    info.doors = Array.from({ length: past.n }, (_, k) => ({ type: k === past.k ? past.type : 'fight', open: k === past.k ? open : 0, taken: k !== past.k }));
  } else if (f > floorNow && Math.floor((f - 1) / 10) === flight) info.doors = rows(f)?.map(type => ({ type }));
  return info;
}

// The art is painted at a whole-pixel camera and the canvas slid the rest of the way by CSS, so a pan glides instead
// of stepping a whole 3-4px tower pixel at a time.
function paint() {
  const { b, lay, P } = V, cam = Math.floor(camY);
  paintSky(b, cam, tick, { flash });
  paintTower(b, cam, lay, floorInfo, tick);
  flush(b);
  statuesOn(b, cam, lay, S.trail, S.floorNow, S.rising);
  b.ctx.canvas.style.translate = `0 ${snap((camY - cam - 1) * P)}px`;
  placeMon();
}
const snap = (px) => Math.round(px * devicePixelRatio) / devicePixelRatio;

function statuesOn(b, cam, lay, trail, below, rising = null) {
  for (const e of trail) {
    if (!e.enemy || e.f >= below || !['fight', 'elite', 'boss'].includes(e.type)) continue;
    const surf = b.H - 1 - (e.f * FH + SLAB - 1 - cam);
    if (surf < -40 || surf > b.H + 40) continue;
    const art = statue(e.enemy, e.type === 'boss' ? 30 : e.type === 'elite' ? 21 : 16);
    const x = e.type === 'boss' ? Math.round((lay.doorL + lay.doorR) / 2) : doorXs(lay, e.n)[e.k];
    const rise = rising?.f === e.f ? rising.v : 1;
    const ctx = b.ctx;
    ctx.fillStyle = '#5e5a52'; ctx.fillRect(x - 6, surf - 3, 13, 3);   // its plinth
    ctx.fillStyle = '#8a857a'; ctx.fillRect(x - 6, surf - 3, 13, 1);
    if (!art) continue;
    const h = Math.round(art.height * rise);
    if (h > 0) ctx.drawImage(art, 0, art.height - h, art.width, h, Math.round(x - art.width / 2), surf - 3 - h, art.width, h);
    if (rise < 1) for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#c8c0b0' : '#a09888'; ctx.fillRect(x - 7 + ((i * 5 + tick) % 15), surf - 4 - ((i * 3 + tick) % 6), 1, 1); }
  }
}

/** A foe turned to stone: its sprite (cropped to its pose) in four shades of grey, outlined, `h` tower pixels tall. */
function statue(id, h) {
  const key = `${id}:${h}`;
  if (statues.has(key)) return statues.get(key);
  statues.set(key, null);
  const def = ENEMY_DEFS[id];
  if (!def?.image) return null;
  const img = new Image();
  img.onload = () => {
    const [top, bottom, left, right] = spriteFit(def.image);
    const sw = img.naturalWidth - left - right, sh = img.naturalHeight - top - bottom;
    const k = h / sh, w = Math.max(4, Math.round(sw * k));
    const c = document.createElement('canvas');
    c.width = w + 2; c.height = h + 1;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(img, left, top, sw, sh, 1, 0, w, h);
    const data = g.getImageData(0, 0, c.width, c.height), d = data.data;
    const solid = (x, y) => x >= 0 && y >= 0 && x < c.width && y < c.height && d[(y * c.width + x) * 4 + 3] > 100;
    const out = new Uint8ClampedArray(d.length);
    const SH = [[226, 222, 210], [184, 180, 168], [140, 136, 126], [96, 92, 86]];
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
      const i = (y * c.width + x) * 4;
      let rgb = null;
      if (solid(x, y)) {
        const l = (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11) / 255;
        rgb = SH[l > 0.72 ? 0 : l > 0.45 ? 1 : l > 0.22 ? 2 : 3];
        if (!solid(x - 1, y) || !solid(x, y - 1)) rgb = SH[Math.max(0, SH.indexOf(rgb) - 1)];   // lit from the top left
      } else if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) rgb = [52, 48, 46];
      if (rgb) { out[i] = rgb[0]; out[i + 1] = rgb[1]; out[i + 2] = rgb[2]; out[i + 3] = 255; }
    }
    g.putImageData(new ImageData(out, c.width, c.height), 0, 0);
    statues.set(key, c);
  };
  img.src = def.image;
  return null;
}

function fitMon() {
  const img = $('tw-mon');
  if (!img.naturalWidth || !V) return;
  const [top, bottom, left, right] = spriteFit(img.src);
  const pose = Math.max(img.naturalWidth - left - right, img.naturalHeight - top - bottom) || 64;
  const s = Math.max(0.5, Math.round(((22 * V.P) / pose) * 2) / 2);
  img.style.width = `${img.naturalWidth * s}px`;
  img.style.height = `${img.naturalHeight * s}px`;
  img.style.setProperty('--foot', `${bottom * s}px`);
}

function placeMon() {
  const img = $('tw-mon'), { P } = V;
  img.style.left = `${snap(mon.x * P)}px`;
  img.style.top = `${snap((surfRow(mon.floor) - mon.lift - mon.hop) * P)}px`;
  img.style.opacity = String(mon.alpha);
  img.classList.toggle('flip', mon.flip);
  img.classList.toggle('behind', mon.behind);
}

let lastNow = 0, owed = 0;
function frame(now) {
  if ($('map-screen').hidden || !$('tower-view').isConnected || $('tower-view').hidden) { stop(); return; }
  timer = requestAnimationFrame(frame);
  owed = Math.min(owed + (now - lastNow), 250);
  lastNow = now;
  for (; owed >= 1000 / FPS; owed -= 1000 / FPS) {
    tick++;
    flash = Math.max(0, flash - 0.2);
    if (S && S.floorNow >= 15 && S.floorNow <= 26 && Math.random() < 0.006 && !calmFx()) { flash = 1; }
  }
  paint();
}
function run() { if (!timer) { lastNow = performance.now(); timer = requestAnimationFrame(frame); } }
function stop() { cancelAnimationFrame(timer); timer = null; }

/** A tween over `ms`, calling `fn(0..1)` each frame; resolves at the end (at once under reduced motion). */
function tween(ms, fn) {
  if (still()) { fn(1); return Promise.resolve(); }
  return new Promise(done => {
    const t0 = performance.now();
    const step = (now) => {
      const v = Math.min(1, (now - t0) / ms);
      fn(v);
      if (!timer) paint();
      if (v < 1) requestAnimationFrame(step); else done();
    };
    requestAnimationFrame(step);
  });
}

async function walk(toX, speed = 34) {
  const from = mon.x, d = Math.abs(toX - from);
  if (d < 1) return;
  mon.flip = toX > from;
  await tween(d / speed * 1000, v => { mon.x = from + (toX - from) * v; mon.hop = Math.abs(Math.sin(v * d / 3)) * 1.5; });
  mon.hop = 0;
}

/* ---------- the doors and the gauge ---------- */

function doorButtons() {
  const box = $('tw-doors');
  box.replaceChildren();
  if (busy || !S) return;
  const { lay, P } = V, f = S.floorNow, nodes = S.nodes;
  const surf = surfRow(f), guardian = f % 10 === 0, top = f === TOP;
  const xs = guardian ? [Math.round((lay.doorL + (top ? lay.iR - 3 : lay.doorR)) / 2)] : doorXs(lay, nodes.length);
  nodes.forEach((node, k) => {
    const info = NODE_INFO[node.type];
    const w = guardian ? 30 : 19, h = guardian ? 44 : 32;
    const btn = el('button', `tw-door type-${node.type}${guardian ? ' guardian' : ''}${top ? ' summit' : ''}`);
    btn.type = 'button';
    btn.style.left = `${(xs[k] - w / 2) * P}px`;
    btn.style.top = `${(surf - h) * P}px`;
    btn.style.width = `${w * P}px`;
    btn.style.height = `${h * P}px`;
    btn.style.setProperty('--gem', DOOR_GEM[node.type] || '#fff');
    const label = top ? 'The summit: Rayquaza' : guardian ? `Floor ${f} guardian` : info.label;
    btn.title = label;
    btn.setAttribute('aria-label', label);
    btn.append(el('span', 'tw-door-tag', top ? '🐉' : info.icon));
    btn.addEventListener('click', () => pick(node, k, xs[k]));
    box.append(btn);
  });
}

async function pick(node, k, x) {
  if (busy) return;
  busy = true;
  doorButtons();
  playSound('confirm');
  const guardian = S.floorNow % 10 === 0;
  last = { floor: S.floorNow, k, n: S.nodes.length, type: node.type };
  await walk(x);
  playSound(guardian ? 'quake' : 'door');
  await tween(guardian ? 700 : 380, v => { S.opening = { k, v }; });
  mon.flip = false;
  await tween(320, v => { mon.alpha = 1 - v; mon.lift = v * 2; });
  busy = false;
  S.onPick(node);
}

const GAUGE_MARKS = [[100, '🐉'], [50, '🌌'], [30, '🌇'], [20, '⛈️'], [10, '☁️'], [0, '🌲']];

function placeGauge() {
  const g = $('tw-gauge');
  if (!g || !V) return;
  const { lay, P } = V;
  const wide = lay.L * P > 70;
  g.classList.toggle('wide', wide);
  g.style.left = wide ? `${lay.L * P - 54}px` : '4px';
}

function buildGauge() {
  const g = $('tw-gauge');
  if (g.childElementCount) return;
  const stops = [];
  for (let a = 0; a <= 100; a += 5) stops.push(`${skyHex(a)} ${100 - a}%`);
  const track = el('div', 'tw-gauge-track');
  track.style.background = `linear-gradient(${stops.reverse().join(', ')})`;
  for (let f = 10; f < 100; f += 10) { const t = el('span', 'tw-tick'); t.style.bottom = `${f}%`; track.append(t); }
  for (const [f, icon] of GAUGE_MARKS) {
    const m = el('span', 'tw-mark', icon);
    m.style.bottom = `${f}%`;
    m.append(el('b', '', String(f)));
    track.append(m);
  }
  track.append(el('span', 'tw-best'), el('span', 'tw-here'));
  g.append(el('span', 'tw-gauge-cap', 'ALT'), track);
}

function setGauge(floor, best) {
  buildGauge();
  const here = $('tw-gauge').querySelector('.tw-here'), b = $('tw-gauge').querySelector('.tw-best');
  here.style.bottom = `${floor}%`;
  here.title = `Floor ${floor} of ${TOP}`;
  b.style.bottom = `${best}%`;
  b.hidden = !best;
  b.title = `Your best: floor ${best}`;
}

/* ---------- the climb ---------- */

/**
 * Draw the climb on the map screen (run.js's drawMap(), for a Sky Pillar run): `map` the flight's landings, `current`
 * the room you last went into, `flight`, `trail` the floors climbed so far ({ f, type, enemy, n, k }), `best` your best
 * floor, `sprite` your Pokémon's front GIF, `onPick(node)` going into a door.
 */
export function renderTower({ map, current, flight, trail, best, sprite, onPick, hold = false }) {
  const view = $('tower-view');
  view.hidden = false;
  $('map-screen').classList.add('tower');
  watchBar();
  measureBar();
  if (!S) popBar();
  preloadSounds('door', 'confirm');
  const here = current && map.byId[current];
  const row = here ? here.floor + 1 : 0;
  const floorNow = flight * 10 + row + 1;
  const nodes = row < map.floors.length ? map.floors[row] : [map.boss];
  const rows = (f) => {
    const r = f - flight * 10 - 1;
    if (r < 0 || r > map.floors.length) return null;
    return (r < map.floors.length ? map.floors[r] : [map.boss]).map(n => n.type);
  };
  if (busy && S?.floorNow === floorNow) return;   // redrawn mid-walk (the Bag closed): the walk carries on
  const prev = S;
  S = { floorNow, flight, rows, nodes, trail: trail || [], onPick, opening: null, rising: null };
  const img = $('tw-mon');
  if (!img.src.endsWith(sprite)) { img.onload = fitMon; img.src = sprite; }
  if (!V || V.W !== Math.ceil(innerWidth / pixel()) || V.H !== Math.ceil(innerHeight / pixel())) layout();
  setGauge(floorNow, best);
  const climb = !busy && !still() && (held || (last && last.floor === floorNow - 1) || (!last && floorNow === 1 && !trail?.length && !prev));
  const same = prev && prev.floorNow === floorNow && !climb;
  run();
  if (climb && hold) { held = true; return waitBelow(floorNow); }
  held = false;
  if (same && !busy) { doorButtons(); return; }
  if (climb) return climbUp(floorNow, flight);
  camY = standY(floorNow);
  Object.assign(mon, { x: V.lay.stairX + 1, floor: floorNow, lift: 0, alpha: 1, flip: false, behind: false });
  paint();
  doorButtons();
}

/** The door you come back out of (the lobby's way in on a fresh climb), in tower pixels. */
function exitDoor(from) {
  const { lay } = V;
  return !last ? lay.doorL + 9 : last.type === 'boss' || from % 10 === 0 ? Math.round((lay.doorL + lay.doorR) / 2) : doorXs(lay, last.n)[last.k];
}

/** The climb's waiting on a pick (an augment, Training Day): the floor below, your Pokémon still behind its door, no
    doors to tap. The next render climbs on from there (`held`). */
function waitBelow(floorNow) {
  const from = floorNow - 1;
  busy = false;
  camY = standY(from);
  Object.assign(mon, { x: exitDoor(from), floor: from, lift: 2, alpha: 0, flip: true, behind: false });
  S.opening = null;
  $('tw-doors').replaceChildren();
  paint();
}

/** A climb's first look (a new climb, or one continued): the menu bar slides up from the bottom. */
function popBar() {
  const map = $('map-screen');
  if (still()) return;
  map.classList.remove('bar-in');
  void map.offsetWidth;
  map.classList.add('bar-in');
  popping = sleep(BAR_IN).then(() => { map.classList.remove('bar-in'); if (measureBar()) relayout(); });
}
const BAR_IN = 480;   // css/screens.css's twBarIn
let popping = Promise.resolve();
/** Resolves once the menu bar has slid in, for whatever pops up over the climb next. */
export const barReady = () => popping;

/** Out of the door you went through and up the spiral stair to the next floor, the camera panning up with you. */
async function climbUp(floorNow, flight) {
  busy = true;
  doorButtons();
  const from = floorNow - 1, { lay } = V;
  const fromLobby = !last;
  const door = exitDoor(from);
  camY = standY(from);
  Object.assign(mon, { x: door, floor: from, lift: 2, alpha: 0, flip: true, behind: false });
  const beaten = S.trail.find(e => e.f === from);
  const fought = beaten?.enemy && ['fight', 'elite', 'boss'].includes(beaten.type);
  S.opening = null;
  S.exit = fromLobby ? null : { f: from, v: 1 };   // the door you used, open as you come back out
  if (fought) S.rising = { f: from, v: 0 };        // the foe you beat, about to set into stone
  await tween(300, v => { mon.alpha = v; mon.lift = 2 - v * 2; });
  await walk(door + (fought ? 13 : 10), 40);
  if (S.exit) await tween(300, v => { S.exit.v = 1 - v; });
  S.exit = null;
  if (fought) {
    playSound('stat-up');
    await tween(700, v => { S.rising.v = v; });
    S.rising = null;
  }
  await walk(lay.stair - 6);
  // up the spiral round the newel, gliding along the same circle as the steps (stairSteps()) with a little lift on
  // each tread, the camera rising a floor
  const n = stairSteps(lay.stairX, 0).length;
  const c0 = camY, c1 = standY(floorNow);
  let at = -1;
  await tween(1700, v => {
    const i = Math.min(n - 1, Math.floor(v * n));
    if (i !== at) { at = i; if (i % 2 === 0) playSound('stick'); }
    const a = v * Math.PI * 2 + Math.PI;
    mon.x = lay.stairX + Math.sin(a) * 6;
    mon.lift = v * FH;
    mon.hop = Math.sin((v * n) % 1 * Math.PI) * 1.2;
    mon.behind = Math.cos(a) < 0;
    mon.flip = Math.cos(a) > 0;
    camY = c0 + (c1 - c0) * ease(v);
  });
  mon.hop = 0;
  Object.assign(mon, { floor: floorNow, lift: 0, behind: false, x: lay.stairX });
  camY = c1;
  await walk(lay.stairX + 1);
  mon.flip = false;
  last = null;
  busy = false;
  doorButtons();
}

/** Leaving the map screen for good (the climb's over): nothing left to draw. */
export function hideTower() {
  stop();
  $('tower-view').hidden = true;
  $('map-screen').classList.remove('tower');
  S = null;
  last = null;
  held = false;
}

/* ---------- the overlay: guardian intros and the fall ---------- */

/** The overlay's canvas: the fall at the climb's own scale, a guardian's hall (`near`) closer, with bigger pixels. */
function overlay(near = false) {
  const fx = $('tower-fx');
  fx.hidden = false;
  fx.classList.remove('dark', 'flash', 'shake');
  fx.querySelector('.tw-fx-text').replaceChildren();
  const P = near ? Math.max(4, Math.min(Math.round(innerWidth / 64), Math.floor(innerHeight / 90))) : pixel();
  const W = Math.ceil(innerWidth / P), H = Math.ceil(innerHeight / P);
  const canvas = $('tw-fx-canvas');
  const b = makeBuffer(canvas, W, H);
  canvas.style.width = `${W * P}px`;
  canvas.style.height = `${H * P}px`;
  const lay = towerLayout(W);
  return { fx, b, P, W, H, lay: near ? { ...lay, doorL: lay.iL + 2, doorR: lay.iR - 2 } : lay };
}

function skipper(fx) {
  let skip = false;
  const on = () => { skip = true; };
  fx.addEventListener('pointerdown', on, { once: true });
  return { get skipped() { return skip; }, off: () => fx.removeEventListener('pointerdown', on) };
}

async function playFrames(ms, draw, skip) {
  if (still()) { draw(1, 0); return; }
  const t0 = performance.now();
  await new Promise(done => {
    const step = (now) => {
      const v = Math.min(1, (now - t0) / ms);
      draw(v, Math.floor((now - t0) / (1000 / FPS)));
      if (v < 1 && !skip.skipped) requestAnimationFrame(step); else done();
    };
    requestAnimationFrame(step);
  });
}

function sayFx(fx, top, name, high = false) {
  const box = fx.querySelector('.tw-fx-text');
  box.classList.toggle('high', high);
  box.replaceChildren(el('span', 'tw-fx-top', top), el('strong', 'tw-fx-name', name));
  box.classList.remove('in');
  void box.offsetWidth;
  box.classList.add('in');
}

/**
 * A guardian's intro, before its fight's wipe: the great hall's braziers flare, its doors grind open on the guardian's
 * silhouette, its name slams in. On floor 100 Rayquaza's: the summit open to space, a green streak across the stars,
 * then the dragon coiling down in a storm of light. A tap skips it.
 */
export async function guardianIntro({ def, floor }) {
  const summit = floor >= TOP;
  const o = overlay(true), { fx, b, lay, P, W, H } = o;
  const skip = skipper(fx);
  const sil = $('tw-fx-mon');
  sil.src = def.image;
  sil.className = `tw-fx-mon${summit ? ' rayquaza' : ''}`;
  sil.style.opacity = '0';
  preloadSounds('quake', 'thunder', 'gust', 'core-surge', 'fw-pop');
  const cam = floor * FH + SLAB - Math.round(H * (summit ? 0.2 : 0.3));
  const cx = Math.round((lay.doorL + lay.doorR) / 2);
  const banner = BANNER_OF(Math.floor((floor - 1) / 10));
  const info = (lit, open) => (f) => (f === floor ? { lit, guardian: true, banner, noStair: true, doors: [{ type: 'boss', open }] } : { lit: false, noStair: true });
  const surf = H - 1 - (floor * FH + SLAB - 1 - cam);
  // the silhouette's size: its pose as tall as the great door (Rayquaza half again), whatever its GIF's margins
  const size = (tall, wide) => {
    if (!sil.naturalHeight) return 1;
    const [top, bottom, left, right] = spriteFit(sil.src);
    return P * Math.min(tall / Math.max(16, sil.naturalHeight - top - bottom), wide / Math.max(16, sil.naturalWidth - left - right));
  };
  const placeSil = (x, y, s, a) => {
    sil.style.left = `${x * P}px`; sil.style.top = `${y * P}px`;
    sil.style.scale = String(s); sil.style.opacity = String(a);
  };
  let said = false, sounded = 0;
  const once = (n, sound) => { if (sounded < n) { sounded = n; playSound(sound); } };
  const set = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < W && y < H) b.px[y * W + x] = c; };
  if (!summit) {
    await playFrames(3400, (v, t) => {
      const lit = v > 0.16, open = Math.min(1, Math.max(0, (v - 0.3) / 0.32));
      if (lit) once(1, 'fw-pop');
      if (v > 0.3) once(2, 'quake');
      paintSky(b, cam, t);
      paintTower(b, cam, lay, info(lit, open), t);
      if (open > 0.3) for (let k = 0; k < 40; k++) {   // red light pouring out round the doors
        const a = (k / 40) * Math.PI, r = 18 + (k % 5) * 6 * open;
        if (hash(k + Math.floor(t / 3)) > 0.5) set(cx + Math.cos(a) * r, surf - 16 - Math.sin(a) * r * 0.9, K('#f86048'));
      }
      flush(b);
      const a = Math.max(0, Math.min(1, (v - 0.42) / 0.25));
      placeSil(cx, surf + 1, size(28, 30) * (0.92 + a * 0.08), a);
      if (v > 0.62 && !said) { said = true; playSound('thunder'); sayFx(fx, `Floor ${floor} · Guardian`, def.name); fx.classList.add('shake'); }
    }, skip);
  } else {
    await playFrames(6600, (v, t) => {
      const strike = (v > 0.55 && v < 0.6) || (v > 0.7 && v < 0.73) || (v > 0.86 && v < 0.88);
      paintSky(b, cam, t, { flash: strike ? 1 : 0 });
      const open = Math.min(1, Math.max(0, (v - 0.4) / 0.3));
      paintTower(b, cam, lay, info(true, open), t);
      const ax = cx, ay = surf - 26;
      if (open > 0) {   // the altar's light climbs into the sky
        const w = 1 + open * 5;
        for (let y = ay; y >= 0; y--) for (let x = -w - 2; x <= w + 2; x++) {
          const edge = Math.abs(x) > w, m = edge ? 0.25 * open : 0.55 + 0.45 * open;
          if (bay(ax + x, y + t) < m) set(ax + x, y, K(edge ? '#30b860' : Math.abs(x) < w * 0.4 ? '#f0fff4' : '#80f8b0'));
        }
      }
      if (v > 0.52) for (let k = 0; k < 16; k++) {   // rays fanning out as it comes down
        const ang = (k / 16) * Math.PI * 2 + t / 30, len = 10 + (v - 0.52) * 90;
        for (let r = 8; r < len; r += 2) if (hash(k * 13 + r) > 0.35) set(ax + Math.cos(ang) * r, ay - 34 + Math.sin(ang) * r * 0.8, K(k % 2 ? '#80f8b0' : '#fff8c0'));
      }
      // a green streak across the stars, twice, before it comes down
      for (const [s, e, dir] of [[0.06, 0.26, 1], [0.2, 0.4, -1]]) {
        if (v < s || v > e) continue;
        const p = (v - s) / (e - s), hx = dir > 0 ? -20 + p * (W + 40) : W + 20 - p * (W + 40), hy = H * (0.1 + p * 0.16 * (dir > 0 ? 1 : 0.6));
        for (let k = 0; k < 40; k++) {
          const x = hx - dir * k * 1.5, y = hy - k * 0.3 + Math.sin(k / 3 + t / 3) * 2;
          const c = K(k < 4 ? '#f8fff0' : k < 14 ? '#78f0a0' : '#30b860');
          if (k > 20 && k % 2) continue;
          set(x, y, c); set(x, y + 1, c);
          if (k < 14) { set(x, y - 1, c); set(x, y + 2, K('#30b860')); }
        }
      }
      flush(b);
      if (v > 0.06) once(1, 'gust');
      if (v > 0.2) once(2, 'gust');
      if (v > 0.42) once(3, 'core-surge');
      if (v > 0.55) once(4, 'thunder');
      if (v > 0.86) once(5, 'thunder');
      const a = Math.max(0, Math.min(1, (v - 0.45) / 0.3)), d = 1 - a;
      placeSil(ax + Math.sin(v * 10) * 14 * d, ay - 6 - d * 60, size(46, 64) * (0.7 + a * 0.3), a);
      if (v > 0.74 && !said) { said = true; playSound('thunder'); sayFx(fx, `Floor ${TOP} · The summit`, 'Rayquaza, Lord of the Sky', true); fx.classList.add('shake'); }
    }, skip);
  }
  if (!said) sayFx(fx, summit ? `Floor ${TOP} · The summit` : `Floor ${floor} · Guardian`, summit ? 'Rayquaza, Lord of the Sky' : def.name, summit);
  if (!skip.skipped && !still()) await sleep(summit ? 1300 : 900);
  skip.off();
  fx.classList.add('dark');
  await sleep(still() ? 0 : 350);
  return () => { fx.hidden = true; fx.classList.remove('dark', 'shake'); sil.style.opacity = '0'; };
}

/**
 * The fall: the floor you fainted on cracks and gives way, and your Pokémon drops past every floor it climbed, lit, with
 * their statues, the sky running back down from wherever you were to the treetops, until it hits the lobby floor. Then
 * dark, and the result window (resolves once it's dark; call the returned function to clear it).
 */
export async function towerFall({ floor, trail, sprite }) {
  const o = overlay(), { fx, b, lay, H } = o;
  const skip = skipper(fx);
  const img = $('tw-fx-mon');
  img.className = 'tw-fx-mon faller';
  img.src = sprite;
  img.style.scale = '1';
  img.style.opacity = '1';
  preloadSounds('gate-crack', 'gust', 'eruption');
  const cx = Math.round((lay.doorL + lay.doorR) / 2);
  const startCam = floor * FH + SLAB - Math.round(H * 0.42), endCam = SLAB - Math.round(H * 0.3);
  const fallMs = Math.max(1800, Math.min(6200, 1200 + floor * 60));
  const info = (f) => {
    const e = trail.find(x => x.f === f);
    return { lit: true, guardian: f % 10 === 0 && f > 0, banner: BANNER_OF(Math.floor((f - 1) / 10)),
      doors: e ? Array.from({ length: e.n }, (_, k) => ({ type: k === e.k ? e.type : 'fight', taken: k !== e.k })) : null };
  };
  const at = (cam, f) => H - 1 - (f * FH + SLAB - 1 - cam);
  const place = (y, spin) => { img.style.left = `${cx * o.P}px`; img.style.top = `${y * o.P}px`; img.style.rotate = `${spin}deg`; };
  // the crack
  playSound('gate-crack');
  fx.classList.add('shake');
  await playFrames(900, (v, t) => {
    paintSky(b, startCam, t);
    paintTower(b, startCam, lay, info, t, { crack: v, hole: { floor, x: cx } });
    flush(b);
    statuesOn(b, startCam, lay, trail, floor);
    place(at(startCam, floor), 0);
  }, skip);
  fx.classList.remove('shake');
  playSound('gust');
  // the drop: slow off the ledge, then faster and faster past every floor
  let gusted = false;
  await playFrames(fallMs, (v, t) => {
    const p = v < 0.18 ? (v / 0.18) ** 2 * 0.06 : 0.06 + (v - 0.18) / 0.82 * 0.94;
    const cam = startCam + (endCam - startCam) * Math.min(1, p);
    paintSky(b, cam, t);
    paintTower(b, cam, lay, info, t, v < 0.2 ? { crack: 1, hole: { floor, x: cx } } : {});
    flush(b);
    statuesOn(b, cam, lay, trail, floor);
    const y = v < 0.18 ? at(startCam, floor) + (v / 0.18) ** 2 * H * 0.12 : H * 0.55;
    place(Math.min(at(cam, 0), y), v * 900);
    if (v > 0.5 && !gusted && floor > 12) { gusted = true; playSound('gust'); }
  }, skip);
  place(at(endCam, 0), 180);
  paintSky(b, endCam, 0);
  paintTower(b, endCam, lay, info, 0);
  flush(b);
  statuesOn(b, endCam, lay, trail, floor);
  playSound('eruption');
  fx.classList.add('flash', 'shake');
  await sleep(still() ? 0 : 700);
  skip.off();
  fx.classList.add('dark');
  await sleep(still() ? 0 : 600);
  return () => { fx.hidden = true; fx.classList.remove('dark', 'flash', 'shake'); img.style.rotate = ''; };
}

function relayout() {
  if (!S || $('tower-view').hidden) return;
  measureBar();
  layout();
  if (held) waitBelow(S.floorNow);
  else if (!busy) { camY = standY(S.floorNow); mon.floor = S.floorNow; mon.x = V.lay.stairX + 1; paint(); doorButtons(); }
}
addEventListener('resize', relayout);

// the bar grows when the run card does (a Blaze capsule, a long name) or first shows: the floor keeps standing on it
let barWatch = null;
function watchBar() {
  if (barWatch) return;
  barWatch = new ResizeObserver(() => { if (measureBar()) relayout(); });
  barWatch.observe(document.querySelector('#map-screen .mdex-window'));
}
