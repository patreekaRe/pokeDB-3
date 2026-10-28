/* ============================================================
   cardfx.js  -  card trails (roadmap 8, 2026-10-03).

   A played card arcs to where it acts with a trail in its type's
   colour (Fire embers, Water droplets, Grass leaves, Psychic
   sparkles, Neutral white specks); an exhausted card burns away
   from the bottom up into embers. The card is a clone flown by a
   Web Animation; the particles live on one canvas over everything, drawn
   smooth at the screen's sharpness: soft glows, droplets, tumbling leaves
   and twinkles that fade out (the user's ask, 2026-10-28: the old whole-pixel
   specks looked messy; `?pixelfx` still shows those, for a page load). battle.js never waits on a flight, so the next card
   is playable at once; only a picked exhaust waits for its burn.
   ============================================================ */

import { battleFx, pref } from './prefs.js';
import { tooSoon } from './hd2d.js';

/* Settings' Effects look: Smooth (the default), Pixel (the old look, every effect drawn on the low-res canvas) or Off.
   `?pixelfx` is Pixel for a page load. */
const PIXEL_FLAG = /[?&]pixelfx\b/.test(location.search);
const look = () => (PIXEL_FLAG ? 'pixel' : pref('cardFx'));
let CLEAN = look() !== 'pixel';

const PALETTES = {
  fire:    ['#fff8c0', '#ffd848', '#ff9028', '#e04818', '#902010', '#401008'],
  water:   ['#ffffff', '#c0ecff', '#68c0f8', '#2878d8', '#18489c', '#0c2450'],
  grass:   ['#f0ffc0', '#a8e858', '#58b838', '#2c8424', '#185414', '#0a2a08'],
  psychic: ['#ffffff', '#ffd0f4', '#f080d8', '#b048c0', '#702c88', '#341040'],
  electric: ['#ffffff', '#fff8b0', '#ffe040', '#e8b000', '#a07000', '#483000'],
  ice:     ['#ffffff', '#e0faff', '#a8ecff', '#58c0e8', '#2a7cb0', '#103850'],
  fighting: ['#ffffff', '#ffd8c0', '#f09058', '#c84a28', '#842818', '#401008'],
  ground:  ['#ffffff', '#fff0c8', '#e8c878', '#c09048', '#8a6430', '#402c10'],
  flying:  ['#ffffff', '#eef0ff', '#c8d0ff', '#98a4f0', '#6070c8', '#283070'],
  dark:    ['#f4ece4', '#c8b4a4', '#9a8070', '#6a5444', '#3e2e26', '#1c1410'],
  normal:  ['#ffffff', '#f4f4f8', '#d8d8e0', '#b0b0bc', '#808090', '#484858'],
};
const KIND = { fire: 'ember', water: 'drop', grass: 'leaf', psychic: 'spark', electric: 'spark', ice: 'flake', fighting: 'speck', ground: 'speck', flying: 'speck', dark: 'speck', normal: 'speck' };
const CHAR = '#281008';

/* Particles move in units of PX CSS px either way, so both looks share one set of physics; the clean look only draws
   them at the screen's own sharpness (at most 2x, for memory), from sprites painted once per type. */
let canvas, ctx, PX = 4, DPR = 1, raf = 0, last = 0;
const parts = [];
const jobs = [];   // flights and burns, each a function(now) that returns false once done

const rand = (a, b) => a + Math.random() * (b - a);
const reduced = () => !battleFx() || look() === 'off';
let busyAt = 0, beat = 0;   // the last time something other than a status's ambience was drawn

function ensureCanvas() {
  CLEAN = look() !== 'pixel';
  PX = innerWidth <= 720 ? 3 : 4;
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.className = 'card-fx';
    ctx = canvas.getContext('2d');
  }
  if (!canvas.isConnected) document.body.append(canvas);
  DPR = CLEAN ? Math.min(2, devicePixelRatio || 1) : 1;
  canvas.classList.toggle('clean', CLEAN);
  const w = Math.ceil(CLEAN ? innerWidth * DPR : innerWidth / PX), h = Math.ceil(CLEAN ? innerHeight * DPR : innerHeight / PX);
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  ctx.imageSmoothingEnabled = CLEAN;
}

function start(ambient = false) {
  if (!ambient) busyAt = performance.now();
  if (raf) return;
  last = performance.now();
  raf = requestAnimationFrame(frame);
}

function frame(now) {
  // only a status's ambience left: half the frames, so a long fight against a burned foe doesn't run the phone hot
  if (tooSoon(now, last) || (now - busyAt > 1200 && beat++ % 2)) { raf = requestAnimationFrame(frame); return; }
  const k = Math.min(3, (now - last) / 16.67);
  last = now;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(CLEAN ? DPR * PX : 1, 0, 0, CLEAN ? DPR * PX : 1, 0, 0);
  for (let i = jobs.length - 1; i >= 0; i--) if (jobs[i](now) === false) jobs.splice(i, 1);
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.age += k;
    if (p.age >= p.life) { parts.splice(i, 1); continue; }
    if (p.home) {   // an ember drawn into the exhaust pile
      p.vx += (p.home.x - p.x) * 0.012 * k;
      p.vy += (p.home.y - p.y) * 0.012 * k;
    }
    p.vy += p.g * k;
    p.vx *= p.drag ** k;
    p.vy *= p.drag ** k;
    p.x += (p.vx + (p.sway ? Math.sin((p.age + p.phase) / 5) * p.sway : 0)) * k;
    p.y += p.vy * k;
    if (p.draw) { ctx.globalCompositeOperation = p.add ? 'lighter' : 'source-over'; p.draw(p, p.age / p.life); }
    else if (CLEAN) drawClean(p);
    else { ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; draw(p); }
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  if (jobs.length || parts.length) raf = requestAnimationFrame(frame);
  else if (CLEAN) { raf = 0; canvas.width = canvas.height = 0; }   // a full-sharpness canvas is megabytes; it's re-made on the next card
  else { raf = 0; ctx.clearRect(0, 0, canvas.width, canvas.height); }
}

const sprites = new Map();
function sprite(key, w, h, paint) {
  let c = sprites.get(key);
  if (!c) {
    c = document.createElement('canvas');
    c.width = w; c.height = h;
    paint(c.getContext('2d'), w, h);
    sprites.set(key, c);
  }
  return c;
}
const rgba = (hex, a) => `rgba(${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)}, ${a})`;

/** A soft round glow, white-hot at the middle: drawn at 2r across, it shows a bright dot about r/2 wide. */
const glow = (hex) => sprite(`glow${hex}`, 64, 64, (g) => {
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.16, rgba(hex, 1));
  grad.addColorStop(0.42, rgba(hex, 0.35));
  grad.addColorStop(1, rgba(hex, 0));
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
});
const star = (pal) => sprite(`star${pal[2]}`, 64, 64, (g) => {
  g.beginPath();
  const tips = [[32, 1], [63, 32], [32, 63], [1, 32]];
  g.moveTo(...tips[0]);
  for (let i = 1; i <= 4; i++) {
    const [ax, ay] = tips[i - 1], [bx, by] = tips[i % 4];
    g.quadraticCurveTo(32 + (ax + bx - 64) * 0.09, 32 + (ay + by - 64) * 0.09, bx, by);
  }
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 30);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.3, pal[1]);
  grad.addColorStop(1, rgba(pal[2], 0.2));
  g.fillStyle = grad;
  g.fill();
});
const flake = (pal) => sprite(`flake${pal[2]}`, 64, 64, (g) => {
  g.translate(32, 32);
  g.strokeStyle = pal[0];
  g.lineCap = 'round';
  g.shadowColor = pal[2];
  g.shadowBlur = 6;
  for (let i = 0; i < 6; i++) {
    g.rotate(Math.PI / 3);
    g.lineWidth = 3.5;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -25); g.stroke();
    g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(0, -14); g.lineTo(-7, -21); g.moveTo(0, -14); g.lineTo(7, -21); g.stroke();
  }
});
const leaf = (pal, dark) => sprite(`leaf${pal[2]}${dark}`, 40, 64, (g) => {
  const [hi, mid, lo] = dark ? [pal[2], pal[3], pal[4]] : [pal[1], pal[2], pal[3]];
  g.beginPath();
  g.moveTo(20, 2);
  g.bezierCurveTo(40, 16, 36, 46, 20, 60);
  g.bezierCurveTo(4, 46, 0, 16, 20, 2);
  const grad = g.createLinearGradient(2, 0, 38, 0);
  grad.addColorStop(0, hi); grad.addColorStop(0.5, mid); grad.addColorStop(1, lo);
  g.fillStyle = grad;
  g.fill();
  g.strokeStyle = rgba(pal[0], 0.7);
  g.lineWidth = 2;
  g.beginPath(); g.moveTo(20, 6); g.quadraticCurveTo(21, 34, 20, 63); g.stroke();
});
const drop = (pal) => sprite(`drop${pal[2]}`, 48, 64, (g) => {
  g.beginPath();
  g.moveTo(24, 2);
  g.quadraticCurveTo(42, 28, 42, 44);
  g.arc(24, 44, 18, 0, Math.PI);
  g.quadraticCurveTo(6, 28, 24, 2);
  const grad = g.createRadialGradient(18, 38, 2, 22, 42, 28);
  grad.addColorStop(0, pal[0]); grad.addColorStop(0.45, pal[2]); grad.addColorStop(1, pal[3]);
  g.fillStyle = grad;
  g.fill();
  g.strokeStyle = rgba(pal[4], 0.6);
  g.lineWidth = 1.5;
  g.stroke();
  g.fillStyle = 'rgba(255, 255, 255, 0.85)';
  g.beginPath(); g.ellipse(17, 40, 3.5, 6, -0.4, 0, Math.PI * 2); g.fill();
});

/** A sprite drawn centred on (x, y), w by h units, turned by `a` and squashed sideways by `sx`. */
function put(img, x, y, w, h, a = 0, sx = 1) {
  ctx.save();
  ctx.translate(x, y);
  if (a) ctx.rotate(a);
  if (sx !== 1) ctx.scale(sx, 1);
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
}

function drawClean(p) {
  const f = p.age / p.life, s = p.size || 1, pal = p.pal;
  const fade = f < 0.6 ? 1 : 1 - (f - 0.6) / 0.4;
  ctx.globalCompositeOperation = p.kind === 'drop' || p.kind === 'leaf' || pal === PALETTES.dark ? 'source-over' : 'lighter';
  switch (p.kind) {
    case 'ember': {   // white-hot to red as it cools, shrinking, with a flicker
      const at = f * 4, i = Math.min(3, Math.floor(at)), mix = at - i;
      const r = s * 1.7 * (1 - f * 0.5) * (0.85 + 0.15 * Math.sin(p.age * 1.3 + p.phase));
      ctx.globalAlpha = fade * (1 - mix); put(glow(pal[i]), p.x, p.y, r * 2, r * 2);
      ctx.globalAlpha = fade * mix; put(glow(pal[i + 1]), p.x, p.y, r * 2, r * 2);
      break;
    }
    case 'drop': {   // turned to fall the way it moves, stretched by its speed
      const v = Math.hypot(p.vx, p.vy);
      ctx.globalAlpha = fade;
      put(drop(pal), p.x, p.y, s * 1.1, s * 1.5 * (1 + Math.min(0.6, v * 0.25)), v > 0.05 ? Math.atan2(p.vy, p.vx) - Math.PI / 2 : 0);
      break;
    }
    case 'leaf':   // spins and tumbles, flat to edge-on
      ctx.globalAlpha = fade;
      put(leaf(pal, p.phase > 10), p.x, p.y, s * 1.1, s * 1.75, p.phase + p.age * (p.phase > 10 ? 0.07 : -0.07),
        Math.max(0.2, Math.abs(Math.cos((p.age + p.phase) / 7))));
      break;
    case 'spark': {   // a soft glow under a twinkling four-point star
      const tw = 0.55 + 0.45 * Math.sin((p.age + p.phase) * 0.45);
      ctx.globalAlpha = fade * 0.7; put(glow(pal[2]), p.x, p.y, s * 2.4, s * 2.4);
      ctx.globalAlpha = fade; put(star(pal), p.x, p.y, s * 2.4 * tw, s * 2.4 * tw, p.phase * 0.05);
      break;
    }
    case 'flake':
      ctx.globalAlpha = fade * 0.6; put(glow(pal[3]), p.x, p.y, s * 2.2, s * 2.2);
      ctx.globalAlpha = fade; put(flake(pal), p.x, p.y, s * 1.7, s * 1.7, p.phase + p.age * 0.04);
      break;
    case 'ring': {   // the landing's shockwave
      ctx.globalAlpha = (1 - f) * 0.9;
      ctx.strokeStyle = pal[1];
      ctx.lineWidth = Math.max(0.15, (1 - f) * 1.4);
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r0 + (p.r1 - p.r0) * (1 - (1 - f) ** 3), 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = (1 - f) ** 2; put(glow(pal[1]), p.x, p.y, p.r1 * 1.4, p.r1 * 1.4);
      break;
    }
    default: {
      const r = s * 1.3 * (1 - f * 0.4);
      ctx.globalAlpha = fade; put(glow(pal === PALETTES.dark ? pal[3] : pal[2]), p.x, p.y, r * 2, r * 2);
    }
  }
}

function draw(p) {
  const step = Math.min(p.pal.length - 1, Math.floor((p.age / p.life) * p.pal.length));
  const x = Math.floor(p.x), y = Math.floor(p.y), s = p.size || 1;
  const dot = (dx, dy, c) => { ctx.fillStyle = c; ctx.fillRect(x + dx * s, y + dy * s, s, s); };
  const c = p.pal[step];
  switch (p.kind) {
    case 'ember':
      dot(0, 0, Math.floor(p.age) % 4 === 0 ? p.pal[Math.max(0, step - 1)] : c);   // a flicker
      if (step < 2) dot(0, 1, p.pal[step + 2]);
      break;
    case 'drop':
      dot(0, 0, step < 2 ? p.pal[0] : c);
      dot(0, 1, c);
      if (step < 3) dot(0, 2, p.pal[Math.min(p.pal.length - 1, step + 1)]);
      break;
    case 'leaf':   // tumbles: flat, then on its edge
      if (Math.floor((p.age + p.phase) / 5) % 2) { dot(0, 0, c); dot(1, 0, p.pal[Math.min(p.pal.length - 1, step + 1)]); }
      else { dot(0, 0, c); dot(0, 1, p.pal[Math.min(p.pal.length - 1, step + 1)]); }
      break;
    case 'spark':  // a four-point twinkle while young
      dot(0, 0, step < 2 ? p.pal[0] : c);
      if (step < 3 && Math.floor((p.age + p.phase) / 4) % 2) {
        const arm = p.pal[step + 1];
        dot(-1, 0, arm); dot(1, 0, arm); dot(0, -1, arm); dot(0, 1, arm);
      }
      break;
    default:
      dot(0, 0, c);
  }
}

/** One particle of a type's trail, at (x, y) in canvas pixels. `burst` throws it outwards. */
function spawn(type, x, y, { burst = 0, fast = false, ember = false } = {}) {
  let kind = ember ? 'ember' : KIND[type] || 'speck';
  if (kind === 'flake' && !CLEAN) kind = 'spark';
  const pal = ember ? PALETTES.fire : PALETTES[type] || PALETTES.normal;
  const a = Math.random() * Math.PI * 2, s = burst ? rand(0.4, 1) * burst : 0;
  const p = { x, y, kind, pal, age: 0, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: 0, drag: 0.96, phase: rand(0, 20) };
  if (kind === 'ember') { p.vx += rand(-0.3, 0.3); p.vy += rand(-0.8, -0.3); p.g = -0.008; p.life = rand(20, 36); }
  else if (kind === 'drop') { p.vx += rand(-0.4, 0.4); p.vy += rand(-0.6, 0.1); p.g = 0.07; p.drag = 0.99; p.life = rand(22, 34); }
  else if (kind === 'leaf') { p.vx += rand(-0.4, 0.4); p.vy += rand(-0.3, 0.1); p.g = 0.012; p.sway = 0.35; p.life = rand(30, 46); }
  else if (kind === 'spark') { p.vx += rand(-0.35, 0.35); p.vy += rand(-0.35, 0.35); p.drag = 0.93; p.life = rand(18, 30); }
  else { p.vx += rand(-0.25, 0.25); p.vy += rand(-0.3, 0.1); p.drag = 0.94; p.life = rand(14, 24); }
  if (!ember) { p.size = 2; p.life *= 1.8; }   // the trail hangs on after the card lands: at 1 px and ~0.4 s it was gone before you saw it (the user, 2026-10-03)
  if (fast) p.life /= 2;
  parts.push(p);
  return p;
}

/** A card's clone, pinned where it sits, for the effect to move. */
function ghostOf(src, cls) {
  const r = src.getBoundingClientRect();
  const ghost = src.cloneNode(true);
  ghost.classList.add(cls);
  ghost.removeAttribute('id');
  Object.assign(ghost.style, { position: 'fixed', left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, margin: 0, rotate: '0deg', translate: '0', transform: 'none', transformOrigin: '50% 50%', visibility: 'visible' });
  const wrap = document.createElement('div');
  wrap.className = 'exhaust-fx';
  wrap.append(ghost);
  document.body.append(wrap);
  src.style.visibility = 'hidden';
  return { ghost, wrap, r };
}

/**
 * A played card arcs from `src` to `target`, shedding its type's trail. An attack is thrown high, spinning, and lands
 * as the hit does (~0.22 s, like the old flight); anything else drops gently into your Pokémon with a soft glow.
 * The card itself flies on the browser's compositor (a Web Animation of transform and opacity), not by restyling it
 * every frame: the 3D arena, the hand's redraw and the text box all run on the main thread while it's in the air, and
 * a frame-by-frame flight stuttered whenever they ran long (the user, 2026-10-18). Only its trail is drawn per frame.
 */
export function flyTrail(src, target, { type = 'normal', attack = true, fast = false } = {}) {
  if (!src || !target || reduced()) return;
  ensureCanvas();
  const { ghost, wrap, r } = ghostOf(src, 'fly-ghost');
  const to = target.getBoundingClientRect();
  const x0 = r.left + r.width / 2, y0 = r.top + r.height / 2;
  const x2 = to.left + to.width / 2, y2 = to.top + to.height / 2;
  const lift = attack ? Math.max(70, Math.hypot(x2 - x0, y2 - y0) * 0.4) : 40;
  const x1 = (x0 + x2) / 2 + (attack ? (x0 - x2) * 0.15 : 0), y1 = Math.min(y0, y2) - lift;
  const total = attack ? (fast ? 200 : 400) : (fast ? 330 : 650), arrive = 0.55;   // an attack still lands with its hit
  const at = (t) => {
    const u = Math.min(1, t / arrive);
    const e = u * u * 0.55 + u * 0.45;   // speeds up into the hit
    const after = Math.max(0, (t - arrive) / (1 - arrive));
    return {
      u, e, after,
      x: (1 - e) ** 2 * x0 + 2 * (1 - e) * e * x1 + e * e * x2,
      y: (1 - e) ** 2 * y0 + 2 * (1 - e) * e * y1 + e * e * y2,
      scale: u < 1 ? 1 + (attack ? 0.22 - 1 : 0.25 - 1) * e : (attack ? 0.22 - 0.12 * after : 0.25 - 0.1 * after),
    };
  };
  const STEPS = 24, frames = [], glows = [];
  for (const t of [...Array.from({ length: STEPS + 1 }, (_, i) => i / STEPS), arrive].sort((a, b) => a - b)) {
    const { x, y, scale, e, after } = at(t);
    frames.push({ offset: t, opacity: 1 - after, transform: `translate(${x - x0}px, ${y - y0}px) scale(${scale}) rotate(${attack ? -30 * e - 10 * after : 0}deg)` });
    glows.push({ offset: t, opacity: Math.min(1, e * 0.6 + after * 0.4) });
  }
  ghost.animate(frames, { duration: total, fill: 'forwards' }).finished.then(() => wrap.remove(), () => wrap.remove());
  if (!attack) {   // a block, buff or power brightens as it sinks into your Pokémon
    const glow = document.createElement('i');
    glow.className = 'fly-glow';
    ghost.append(glow);
    glow.animate(glows, { duration: total, fill: 'forwards' });
  }
  const t0 = performance.now();
  let lastX = x0, lastY = y0, landed = false;
  const trail = [], pal = PALETTES[type] || PALETTES.normal;
  jobs.push((now) => {
    const t = Math.min(1, (now - t0) / total);
    const { u, x, y, scale } = at(t);
    if (u < 1) trail.push([x / PX, y / PX, now]);
    ribbon(trail, now, pal, (r.width * Math.min(1, scale)) / PX * 0.32);
    if (u < 1) {   // a trail as dense as the distance covered, from across the card's shrinking width
      const steps = Math.max(1, Math.round(Math.hypot(x - lastX, y - lastY) / 4.5));
      const half = (r.width * scale) / 2;
      for (let i = 1; i <= steps; i++) {
        const sx = lastX + ((x - lastX) * i) / steps, sy = lastY + ((y - lastY) * i) / steps;
        spawn(type, (sx + rand(-half, half) * 0.6) / PX, (sy + rand(-half, half) * 0.4) / PX, { fast });
      }
      lastX = x; lastY = y;
    } else if (!landed) {
      landed = true;
      if (CLEAN) parts.push({ kind: 'ring', x: x2 / PX, y: y2 / PX, pal: PALETTES[type] || PALETTES.normal, age: 0, life: (attack ? 20 : 28) / (fast ? 2 : 1), vx: 0, vy: 0, g: 0, drag: 1, r0: 1, r1: attack ? 16 : 10 });
      for (let i = 0; i < (attack ? 26 : 12); i++) {
        const p = spawn(type, x2 / PX, y2 / PX, { burst: attack ? 3 : 1.2, fast });
        if (!attack) p.vy -= 0.6;   // the glow rises off your Pokémon
      }
    }
    if (t >= 1 && (!trail.length || now - trail.at(-1)[2] > 260)) return false;
  });
  start();
}

/** The card's flight leaves a smooth ribbon of light, tapering and fading behind it over a quarter second. */
function ribbon(trail, now, pal, width) {
  while (trail.length && now - trail[0][2] > 260) trail.shift();
  if (trail.length < 2) return;
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  for (const [col, w, a] of [[pal[2], 1, 0.35], [pal[0], 0.35, 0.8]]) {
    ctx.strokeStyle = col;
    for (let i = 1; i < trail.length; i++) {
      const k = 1 - (now - trail[i][2]) / 260;
      ctx.globalAlpha = a * k;
      ctx.lineWidth = Math.max(0.2, width * w * k);
      ctx.beginPath(); ctx.moveTo(trail[i - 1][0], trail[i - 1][1]); ctx.lineTo(trail[i][0], trail[i][1]); ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

/**
 * An exhausted card burns away from the bottom up: a ragged, glowing edge eats it, charring as it goes, and its embers
 * rise, a few drifting into the exhaust pile, which bumps. Resolves once it's gone.
 */
export function burnAway(src, pile, { fast = false } = {}) {
  if (!src || reduced()) return Promise.resolve();
  ensureCanvas();
  const { ghost, wrap, r } = ghostOf(src, 'burn-ghost');
  const total = fast ? 500 : 1000;
  const cols = Math.max(4, Math.round(r.width / (PX * 3)));   // one ragged step every 3 canvas pixels
  const jag = Array.from({ length: cols }, () => rand(0, 1));
  const to = pile?.getBoundingClientRect();
  const home = to && to.width ? { x: (to.left + to.width / 2) / PX, y: (to.top + to.height / 2) / PX } : null;
  const t0 = performance.now();
  if (CLEAN) return burnClean({ ghost, wrap, r, pile, home, total, fast, t0 });
  return new Promise(resolve => {
    jobs.push((now) => {
      const t = Math.min(1, (now - t0) / total);
      const reach = r.height * 1.25 * t;   // how far up from the bottom the fire has eaten, jag included
      const pts = [];
      for (let i = 0; i < cols; i++) {
        const xa = (r.width * i) / cols, xb = (r.width * (i + 1)) / cols;
        const edge = Math.round((r.height - reach + jag[i] * r.height * 0.25) / PX) * PX;   // snapped to whole pixels
        const y = Math.max(0, Math.min(r.height, edge));
        pts.push(`${xa}px ${y}px`, `${xb}px ${y}px`);
        if (y > 0 && y < r.height) {
          const cx = Math.floor((r.left + xa) / PX), cw = Math.max(1, Math.ceil((xb - xa) / PX));
          const cy = Math.floor((r.top + y) / PX);
          ctx.fillStyle = CHAR; ctx.fillRect(cx, cy - 2, cw, 1);
          ctx.fillStyle = PALETTES.fire[3]; ctx.fillRect(cx, cy - 1, cw, 1);
          ctx.fillStyle = PALETTES.fire[(i + Math.floor(now / 60)) % 2]; ctx.fillRect(cx, cy, cw, 1);
          if (Math.random() < (fast ? 0.5 : 0.3)) {
            const p = spawn('fire', cx + rand(0, cw), cy, { ember: true, fast });
            if (Math.random() < 0.4) p.size = 2;
            if (home && Math.random() < 0.12) { p.home = home; p.life *= 1.6; p.g = 0; }
          }
        }
      }
      ghost.style.clipPath = `polygon(0 0, ${r.width}px 0, ${pts.reverse().join(', ')})`;
      ghost.style.filter = `sepia(${Math.min(1, t * 2) * 0.5}) brightness(${1 + t * 0.3})`;
      if (t >= 1) {
        wrap.remove();
        if (pile) { pile.classList.remove('bump'); void pile.offsetWidth; pile.classList.add('bump'); }
        resolve();
        return false;
      }
    });
    start();
  });
}

/* burnAway's clean look: the edge is a smooth, wavering line glowing white-hot to orange over a charred band. */
function burnClean({ ghost, wrap, r, pile, home, total, fast, t0 }) {
  const cols = Math.max(8, Math.round(r.width / 6));
  const raw = Array.from({ length: cols + 1 }, () => rand(0, 1));
  const jag = raw.map((v, i) => (v * 2 + (raw[i - 1] ?? v) + (raw[i + 1] ?? v)) / 4);
  const u = 1 / PX;   // one CSS px in particle units
  const line = (pts, style, width, dy = 0) => {
    ctx.strokeStyle = style; ctx.lineWidth = width * u;
    ctx.beginPath();
    let on = false;
    for (let i = 0; i < pts.length; i++) {
      const [x, y, live] = pts[i];
      if (live || pts[i + 1]?.[2]) { if (on) ctx.lineTo(x, y + dy * u); else { ctx.moveTo(x, y + dy * u); on = true; } }
      else on = false;
    }
    ctx.stroke();
  };
  return new Promise(resolve => {
    jobs.push((now) => {
      const t = Math.min(1, (now - t0) / total);
      const reach = r.height * 1.25 * t;
      const pts = [], clip = [];
      for (let i = 0; i <= cols; i++) {
        const x = (r.width * i) / cols;
        const y = Math.max(0, Math.min(r.height, r.height - reach + jag[i] * r.height * 0.25 + Math.sin(now / 80 + i * 1.7) * 1.5));
        clip.push(`${x}px ${y}px`);
        pts.push([(r.left + x) * u, (r.top + y) * u, y > 0 && y < r.height]);
        if (y > 0 && y < r.height && Math.random() < (fast ? 0.3 : 0.18)) {
          const p = spawn('fire', (r.left + x + rand(0, r.width / cols)) * u, (r.top + y) * u, { ember: true, fast });
          if (Math.random() < 0.4) p.size = 2;
          if (home && Math.random() < 0.12) { p.home = home; p.life *= 1.6; p.g = 0; }
        }
      }
      ghost.style.clipPath = `polygon(0 0, ${r.width}px 0, ${clip.reverse().join(', ')})`;
      ghost.style.filter = `sepia(${Math.min(1, t * 2) * 0.5}) brightness(${1 + t * 0.3})`;
      ctx.lineCap = ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = 'source-over';
      line(pts, rgba(CHAR, 0.7), 7, -4);
      ctx.globalCompositeOperation = 'lighter';
      line(pts, rgba(PALETTES.fire[2], 0.45), 8);
      line(pts, PALETTES.fire[1], 2.5);
      line(pts, PALETTES.fire[0], 1);
      ctx.globalCompositeOperation = 'source-over';
      if (t >= 1) {
        wrap.remove();
        if (pile) { pile.classList.remove('bump'); void pile.offsetWidth; pile.classList.add('bump'); }
        resolve();
        return false;
      }
    });
    start();
  });
}

/** What js/movefx.js draws with: the same canvas, loop and sprites. Positions are in particle units (PX CSS px). */
export const kit = {
  get ctx() { return ctx; }, get PX() { return PX; }, get clean() { return CLEAN; },
  parts, jobs, PALETTES, rand, rgba, glow, star, flake, leaf, drop, put, sprite, spawn, reduced,
  open() { if (reduced()) return false; ensureCanvas(); return true; },
  start,
  /** An element's box in particle units. */
  box(node) {
    const r = node.getBoundingClientRect();
    return { x: (r.left + r.width / 2) / PX, y: (r.top + r.height / 2) / PX, w: r.width / PX, h: r.height / PX, top: r.top / PX, bottom: r.bottom / PX };
  },
};
