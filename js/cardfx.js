/* ============================================================
   cardfx.js  -  card trails (roadmap 8, 2026-10-03).

   A played card arcs to where it acts with a trail in its type's
   colour (Fire embers, Water droplets, Grass leaves, Psychic
   sparkles, Neutral white specks); an exhausted card burns away
   from the bottom up into embers. The card is a clone flown by
   hand; the particles live on one low-res canvas over everything,
   drawn in whole pixels and faded by stepping down a palette, like
   celebrate.js. battle.js never waits on a flight, so the next card
   is playable at once; only a picked exhaust waits for its burn.
   ============================================================ */

const PALETTES = {
  fire:    ['#fff8c0', '#ffd848', '#ff9028', '#e04818', '#902010', '#401008'],
  water:   ['#ffffff', '#c0ecff', '#68c0f8', '#2878d8', '#18489c', '#0c2450'],
  grass:   ['#f0ffc0', '#a8e858', '#58b838', '#2c8424', '#185414', '#0a2a08'],
  psychic: ['#ffffff', '#ffd0f4', '#f080d8', '#b048c0', '#702c88', '#341040'],
  normal:  ['#ffffff', '#f4f4f8', '#d8d8e0', '#b0b0bc', '#808090', '#484858'],
};
const KIND = { fire: 'ember', water: 'drop', grass: 'leaf', psychic: 'spark', normal: 'speck' };
const CHAR = '#281008';

let canvas, ctx, PX = 4, raf = 0, last = 0;
const parts = [];
const jobs = [];   // flights and burns, each a function(now) that returns false once done

const rand = (a, b) => a + Math.random() * (b - a);
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function ensureCanvas() {
  PX = innerWidth <= 720 ? 3 : 4;
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.className = 'card-fx';
    ctx = canvas.getContext('2d');
  }
  if (!canvas.isConnected) document.body.append(canvas);
  const w = Math.ceil(innerWidth / PX), h = Math.ceil(innerHeight / PX);
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
}

function start() {
  if (raf) return;
  last = performance.now();
  raf = requestAnimationFrame(frame);
}

function frame(now) {
  const k = Math.min(3, (now - last) / 16.67);
  last = now;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
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
    draw(p);
  }
  if (jobs.length || parts.length) raf = requestAnimationFrame(frame);
  else { raf = 0; ctx.clearRect(0, 0, canvas.width, canvas.height); }
}

function draw(p) {
  const step = Math.min(p.pal.length - 1, Math.floor((p.age / p.life) * p.pal.length));
  const x = Math.floor(p.x), y = Math.floor(p.y);
  const dot = (dx, dy, c) => { ctx.fillStyle = c; ctx.fillRect(x + dx, y + dy, 1, 1); };
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
  const kind = ember ? 'ember' : KIND[type] || 'speck';
  const pal = ember ? PALETTES.fire : PALETTES[type] || PALETTES.normal;
  const a = Math.random() * Math.PI * 2, s = burst ? rand(0.4, 1) * burst : 0;
  const p = { x, y, kind, pal, age: 0, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: 0, drag: 0.96, phase: rand(0, 20) };
  if (kind === 'ember') { p.vx += rand(-0.3, 0.3); p.vy += rand(-0.8, -0.3); p.g = -0.008; p.life = rand(20, 36); }
  else if (kind === 'drop') { p.vx += rand(-0.4, 0.4); p.vy += rand(-0.6, 0.1); p.g = 0.07; p.drag = 0.99; p.life = rand(22, 34); }
  else if (kind === 'leaf') { p.vx += rand(-0.4, 0.4); p.vy += rand(-0.3, 0.1); p.g = 0.012; p.sway = 0.35; p.life = rand(30, 46); }
  else if (kind === 'spark') { p.vx += rand(-0.35, 0.35); p.vy += rand(-0.35, 0.35); p.drag = 0.93; p.life = rand(18, 30); }
  else { p.vx += rand(-0.25, 0.25); p.vy += rand(-0.3, 0.1); p.drag = 0.94; p.life = rand(14, 24); }
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
  const total = fast ? 200 : 400, arrive = 0.55;
  const t0 = performance.now();
  let lastX = x0, lastY = y0, landed = false;
  jobs.push((now) => {
    const t = Math.min(1, (now - t0) / total);
    const u = Math.min(1, t / arrive);
    const e = u * u * 0.55 + u * 0.45;   // speeds up into the hit
    const x = (1 - e) ** 2 * x0 + 2 * (1 - e) * e * x1 + e * e * x2;
    const y = (1 - e) ** 2 * y0 + 2 * (1 - e) * e * y1 + e * e * y2;
    const after = Math.max(0, (t - arrive) / (1 - arrive));
    const scale = u < 1 ? 1 + (attack ? 0.22 - 1 : 0.25 - 1) * e : (attack ? 0.22 - 0.12 * after : 0.25 - 0.1 * after);
    ghost.style.transform = `translate(${x - x0}px, ${y - y0}px) scale(${scale}) rotate(${attack ? -30 * e - 10 * after : 0}deg)`;
    ghost.style.opacity = String(1 - after);
    if (!attack) ghost.style.filter = `brightness(${1 + e * 0.6 + after * 0.4}) drop-shadow(0 0 ${Math.round(8 * e)}px #a8d8ff)`;
    if (u < 1) {   // a trail as dense as the distance covered, from across the card's shrinking width
      const steps = Math.max(1, Math.round(Math.hypot(x - lastX, y - lastY) / 7));
      const half = (r.width * scale) / 2;
      for (let i = 1; i <= steps; i++) {
        const sx = lastX + ((x - lastX) * i) / steps, sy = lastY + ((y - lastY) * i) / steps;
        spawn(type, (sx + rand(-half, half) * 0.6) / PX, (sy + rand(-half, half) * 0.4) / PX, { fast });
      }
      lastX = x; lastY = y;
    } else if (!landed) {
      landed = true;
      for (let i = 0; i < (attack ? 14 : 8); i++) {
        const p = spawn(type, x2 / PX, y2 / PX, { burst: attack ? 2.2 : 1, fast });
        if (!attack) p.vy -= 0.6;   // the glow rises off your Pokémon
      }
    }
    if (t >= 1) { wrap.remove(); return false; }
  });
  start();
}

/**
 * An exhausted card burns away from the bottom up: a ragged, glowing edge eats it, charring as it goes, and its embers
 * rise, a few drifting into the exhaust pile, which bumps. Resolves once it's gone.
 */
export function burnAway(src, pile, { fast = false } = {}) {
  if (!src || reduced()) return Promise.resolve();
  ensureCanvas();
  const { ghost, wrap, r } = ghostOf(src, 'burn-ghost');
  const total = fast ? 280 : 560;
  const cols = Math.max(4, Math.round(r.width / (PX * 3)));   // one ragged step every 3 canvas pixels
  const jag = Array.from({ length: cols }, () => rand(0, 1));
  const to = pile?.getBoundingClientRect();
  const home = to && to.width ? { x: (to.left + to.width / 2) / PX, y: (to.top + to.height / 2) / PX } : null;
  const t0 = performance.now();
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
