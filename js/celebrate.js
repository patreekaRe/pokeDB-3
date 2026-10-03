/*
 * The Hall of Fame's celebration (a Level 5 win only, js/halloffame.js): one low-res canvas behind the pedestal, drawn at
 * ~30 fps in whole canvas pixels (`PX` CSS px each), so it reads as pixel art with no soft glows. Two spotlights sweep
 * up from the bottom corners, rockets climb on ember trails and burst in the starters' type colours (a sphere, a ring,
 * a Poké Ball, a drooping gold willow, a crackler that fizzes into white sparks), gold confetti and ribbon streamers
 * rain down, shooting stars cross the sky and little four-point twinkles pop. Particles fade by stepping down their
 * palette, never by alpha. `land()` bursts sparkles round the Pokémon's feet; `finale()` is the biggest firework.
 * Nothing here runs under reduced motion (halloffame.js never starts it).
 */
import { playSound, preloadSounds } from './audio.js';

const FPS_GAP = 1000 / 30 - 2;
const MAX_PARTS = 700;
// each burst palette, brightest first: a particle steps down it as it ages
const PALETTES = {
  fire: ['#fff8e0', '#f8e070', '#f8a038', '#e05030', '#902818'],
  grass: ['#f0ffe0', '#b8f070', '#58d048', '#289028', '#185818'],
  water: ['#f0f8ff', '#a8e0f8', '#50a8f8', '#2860d0', '#183888'],
  gold: ['#ffffff', '#fff0a0', '#f8d048', '#c88820', '#7a4c10'],
  rainbow: ['#ffffff', '#f85858', '#f8e048', '#58d858', '#58a8f8'],
  psychic: ['#fff0ff', '#e8a8f8', '#c060f0', '#8030c0', '#481878'],
  crystal: ['#ffffff', '#c8f8ff', '#78d8f8', '#5890e0', '#383890'],
};
const CONFETTI = [['#fff0a0', '#c88820'], ['#f8d048', '#9a6a18'], ['#fff0a0', '#c88820'], ['#f8f8f8', '#a8a8c0'], ['#f85858', '#982828']];
const STREAMERS = [['#f85858', '#f8f8f8'], ['#f8d048', '#c88820'], ['#50a8f8', '#f8f8f8'], ['#58d048', '#f8e048']];
const SHAPES = ['peony', 'peony', 'ring', 'ball', 'willow', 'crackle'];

const pick = (list) => list[Math.floor(Math.random() * list.length)];
const rand = (lo, hi) => lo + Math.random() * (hi - lo);

/**
 * Start the celebration on `canvas` (sized to the window). `type` is the champion's type: its colours come up most.
 * `onBoom` runs as the finale's big firework bursts (the scene flashes and shakes then).
 * Returns { land(x, y), finale(), stop() }, where x, y are CSS px in the window.
 */
export function celebrate(canvas, type, { onBoom } = {}) {
  preloadSounds('fw-launch', 'fw-pop', 'fw-boom', 'fw-crackle');
  const PX = innerWidth <= 720 ? 3 : 4;
  const g = canvas.getContext('2d');
  let W = 0, H = 0;
  const size = () => {
    W = Math.ceil(innerWidth / PX);
    H = Math.ceil(innerHeight / PX);
    canvas.width = W;
    canvas.height = H;
    canvas.style.width = `${W * PX}px`;
    canvas.style.height = `${H * PX}px`;
  };
  size();
  addEventListener('resize', size);

  // Mewtwo's party is the Depths' own: violet, crystal and gold
  const colours = (type === 'psychic' ? ['psychic', 'psychic', 'crystal', 'gold', 'gold'] : [type, type, 'fire', 'grass', 'water', 'gold', 'gold']).filter(c => PALETTES[c]);
  const rockets = [], parts = [], sparks = [], confetti = [], streamers = [], stars = [], twinkles = [];
  let t = 0, last = 0, frame = 0, raf = 0, nextLaunch = 0.4, nextStar = 1.2, nextTwinkle = 0.3, rain = 0;

  function launch(x = rand(0.15, 0.85) * W, top = rand(0.1, 0.4) * H, shape = pick(SHAPES), palette = pick(colours), big = false) {
    rockets.push({ x, y: H + 2, x0: x, top, drift: rand(-0.06, 0.06) * W, age: 0, time: rand(0.7, 1.0), shape, palette, big });
    playSound('fw-launch');
  }

  function burst(x, y, shape, palette, big) {
    const R = Math.min(W, H) * (big ? 0.34 : rand(0.14, 0.2));
    const add = (angle, speed, extra = {}) => {
      if (parts.length >= MAX_PARTS) return;
      parts.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, age: 0,
        life: rand(0.9, 1.3) * (big ? 1.4 : 1), pal: PALETTES[palette], trail: [], drag: 2.2, grav: 0.35, ...extra });
    };
    const n = big ? 120 : 56;
    if (shape === 'ring') for (let i = 0; i < n; i++) add((i / n) * Math.PI * 2, R * 2.2);
    else if (shape === 'ball') {
      // a Poké Ball: the rim, the band across it and the button
      for (let i = 0; i < n; i++) add((i / n) * Math.PI * 2, R * 2.1, { grav: 0.2 });
      for (let i = -6; i <= 6; i++) if (Math.abs(i) > 1) add(i < 0 ? Math.PI : 0, (Math.abs(i) / 6) * R * 2.1, { grav: 0.2 });
      for (let i = 0; i < 10; i++) add((i / 10) * Math.PI * 2, R * 0.55, { grav: 0.2, pal: PALETTES.gold });
    } else if (shape === 'willow') {
      for (let i = 0; i < n; i++) add(rand(0, Math.PI * 2), R * rand(1.2, 2.1), { pal: PALETTES.gold, life: rand(1.6, 2.2), grav: 0.9, drag: 1.6 });
    } else {
      for (let i = 0; i < n; i++) add(rand(0, Math.PI * 2), R * 2.2 * Math.sqrt(rand(0.15, 1)), { crackle: shape === 'crackle' });
    }
    if (big) for (let i = 0; i < 60; i++) add(rand(0, Math.PI * 2), R * rand(0.6, 1.4), { pal: PALETTES.rainbow, life: rand(1.2, 1.8) });
    playSound(big ? 'fw-boom' : 'fw-pop');
    if (big) onBoom?.();
    if (shape === 'crackle') setTimeout(() => raf && playSound('fw-crackle'), 900);
  }

  function sparkle(x, y, n, spread) {
    for (let i = 0; i < n && parts.length < MAX_PARTS; i++) {
      const a = rand(Math.PI * 1.05, Math.PI * 1.95);
      const v = spread * rand(1.2, 2.6);
      parts.push({ x: x + rand(-3, 3), y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, age: 0, life: rand(0.6, 1.0),
        pal: PALETTES.gold, trail: [], drag: 2.4, grav: 0.8 });
    }
  }

  function rainConfetti(n, ribbons = 0) {
    for (let i = 0; i < n; i++) {
      confetti.push({ x: rand(0, W), y: rand(-H * 0.5, -2), vy: rand(0.1, 0.18) * H, sway: rand(2, 6), phase: rand(0, 6),
        spin: rand(4, 9), col: pick(CONFETTI) });
    }
    for (let i = 0; i < ribbons; i++) {
      streamers.push({ x: rand(0.05, 0.95) * W, y: rand(-H * 0.4, -12), vy: rand(0.08, 0.12) * H, phase: rand(0, 6),
        len: Math.round(rand(10, 18)), col: pick(STREAMERS) });
    }
  }

  const dot = (x, y, colour) => { g.fillStyle = colour; g.fillRect(Math.round(x), Math.round(y), 1, 1); };

  // two beams from the bottom corners, swinging slowly, filled row by row so their edges stay whole pixels
  function spotlights() {
    g.fillStyle = 'rgba(255, 244, 190, 0.1)';
    for (const [ox, phase] of [[0.06, 0], [0.94, Math.PI]]) {
      const aim = -Math.PI / 2 + Math.sin(t * 0.7 + phase) * 0.55, half = 0.09;
      const a = Math.tan(aim - half + Math.PI / 2), b = Math.tan(aim + half + Math.PI / 2);
      for (let y = 0; y < H; y += 1) {
        const up = H - y;
        const x1 = Math.round(ox * W - a * up), x2 = Math.round(ox * W - b * up);
        const lo = Math.max(0, Math.min(x1, x2)), hi = Math.min(W, Math.max(x1, x2));
        if (hi > lo) g.fillRect(lo, y, hi - lo, 1);
      }
    }
  }

  function step(dt) {
    t += dt;
    rain = Math.max(0, rain - dt);
    if (t >= nextLaunch) {
      launch();
      if (Math.random() < 0.3) launch();
      nextLaunch = t + rand(0.9, 1.8);
    }
    if (t >= nextStar) {
      const right = Math.random() < 0.5;
      stars.push({ x: right ? rand(0.3, 1) * W : rand(0, 0.7) * W, y: rand(0.02, 0.25) * H, vx: (right ? -1 : 1) * H * 0.9, vy: H * 0.35, age: 0 });
      nextStar = t + rand(1.8, 3.6);
    }
    if (t >= nextTwinkle) {
      twinkles.push({ x: Math.round(rand(0.04, 0.96) * W), y: Math.round(rand(0.03, 0.5) * H), age: 0, col: pick(['#ffffff', '#fff0a0', '#a8e0f8']) });
      nextTwinkle = t + rand(0.15, 0.45);
    }
    if (rain > 0 && Math.random() < 0.6) rainConfetti(2);

    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.age += dt;
      const k = Math.min(1, r.age / r.time), ease = 1 - (1 - k) ** 2;
      r.x = r.x0 + r.drift * ease;
      r.y = H + 2 - (H + 2 - r.top) * ease;
      if (frame % 2 === 0) sparks.push({ x: r.x + rand(-0.5, 0.5), y: r.y + 1, age: 0, life: 0.35, col: ['#fff0a0', '#f8a038', '#984818'] });
      if (k >= 1) { rockets.splice(i, 1); burst(r.x, r.y, r.shape, r.palette, r.big); }
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.age += dt;
      if (p.age >= p.life) {
        if (p.crackle) for (let j = 0; j < 2; j++) sparks.push({ x: p.x + rand(-2, 2), y: p.y + rand(-2, 2), age: 0, life: rand(0.2, 0.45), col: ['#ffffff', '#fff0a0'], flicker: true });
        parts.splice(i, 1);
        continue;
      }
      if (frame % 2 === 0) { p.trail.unshift([p.x, p.y]); p.trail.length = Math.min(p.trail.length, 3); }
      const drag = Math.exp(-p.drag * dt);
      p.vx *= drag;
      p.vy = p.vy * drag + H * p.grav * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    for (let i = sparks.length - 1; i >= 0; i--) if ((sparks[i].age += dt) >= sparks[i].life) sparks.splice(i, 1);
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.age += dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.age > 1.2) stars.splice(i, 1);
    }
    for (let i = twinkles.length - 1; i >= 0; i--) if ((twinkles[i].age += dt) > 0.5) twinkles.splice(i, 1);
    for (let i = confetti.length - 1; i >= 0; i--) {
      const c = confetti[i];
      c.y += c.vy * dt;
      c.phase += dt * 2;
      if (c.y > H + 2) confetti.splice(i, 1);
    }
    for (let i = streamers.length - 1; i >= 0; i--) {
      const s = streamers[i];
      s.y += s.vy * dt;
      s.phase += dt * 5;
      if (s.y - s.len > H) streamers.splice(i, 1);
    }
  }

  function draw() {
    g.clearRect(0, 0, W, H);
    spotlights();
    for (const s of stars) {
      const dx = Math.sign(s.vx), slope = s.vy / Math.abs(s.vx);
      for (let j = 12; j >= 0; j--) {
        if (j > 6 && j % 2) continue;
        dot(s.x - dx * j, s.y - slope * j, j < 2 ? '#ffffff' : j < 6 ? '#fff0a0' : '#7890c8');
      }
    }
    for (const w of twinkles) {
      const arm = w.age < 0.12 || w.age > 0.38 ? 1 : 2;
      g.fillStyle = w.col;
      g.fillRect(w.x, w.y - arm, 1, arm * 2 + 1);
      g.fillRect(w.x - arm, w.y, arm * 2 + 1, 1);
    }
    for (const r of rockets) { dot(r.x, r.y, '#ffffff'); dot(r.x, r.y + 1, '#fff0a0'); }
    for (const s of sparks) {
      if (s.flicker && (frame + Math.round(s.x)) % 2) continue;
      dot(s.x, s.y, s.col[Math.min(s.col.length - 1, Math.floor((s.age / s.life) * s.col.length))]);
    }
    for (const p of parts) {
      const k = p.age / p.life;
      const shade = Math.min(p.pal.length - 1, Math.floor(k * p.pal.length));
      if (k > 0.8 && (frame + Math.round(p.x)) % 2) continue;
      p.trail.forEach(([x, y], j) => dot(x, y, p.pal[Math.min(p.pal.length - 1, shade + j + 1)]));
      dot(p.x, p.y, p.pal[shade]);
    }
    for (const c of confetti) {
      const x = Math.round(c.x + Math.sin(c.phase) * c.sway), y = Math.round(c.y);
      const spin = Math.floor(c.phase * c.spin / 2) % 3;
      g.fillStyle = spin === 1 ? c.col[1] : c.col[0];
      if (spin === 0) g.fillRect(x, y, 2, 1);
      else if (spin === 1) g.fillRect(x, y, 1, 1);
      else g.fillRect(x, y, 1, 2);
    }
    for (const s of streamers) {
      for (let j = 0; j < s.len; j++) {
        const x = s.x + Math.round(Math.sin(s.phase - j * 0.45) * 2);
        g.fillStyle = s.col[Math.floor(j / 2) % 2];
        g.fillRect(x, Math.round(s.y - j), 1, 1);
      }
    }
  }

  function tick(now) {
    raf = requestAnimationFrame(tick);
    if (now - last < FPS_GAP) return;
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 1 / 30;
    last = now;
    frame++;
    step(dt);
    draw();
  }
  raf = requestAnimationFrame(tick);

  const toCanvas = (x, y) => [x / PX, y / PX];
  return {
    /** The Pokémon lands on the pedestal at (x, y): a fountain of gold sparkles and a ring of twinkles round it. */
    land(x, y) {
      const [cx, cy] = toCanvas(x, y);
      sparkle(cx, cy, 40, Math.min(W, H) * 0.12);
      for (let i = 0; i < 8; i++) {
        twinkles.push({ x: Math.round(cx + rand(-0.14, 0.14) * W), y: Math.round(cy - rand(4, 0.3 * H)), age: rand(-0.3, 0), col: pick(['#ffffff', '#fff0a0']) });
      }
    },
    /** The biggest firework: a huge rainbow-cored Poké Ball over the pedestal, two bursts either side, and a rain of confetti. */
    finale() {
      launch(W / 2, H * 0.2, 'ball', 'gold', true);
      setTimeout(() => { if (raf) { launch(W * 0.2, H * 0.25, 'peony', type in PALETTES ? type : 'gold'); launch(W * 0.8, H * 0.25, 'ring', 'gold'); } }, 350);
      setTimeout(() => { if (raf) { rainConfetti(90, 7); rain = 14; } }, 900);
      nextLaunch = t + 2.4;
    },
    stop() {
      cancelAnimationFrame(raf);
      raf = 0;
      removeEventListener('resize', size);
      g.clearRect(0, 0, W, H);
    },
  };
}
