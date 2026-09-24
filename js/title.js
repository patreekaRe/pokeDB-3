/* ============================================================
   title.js  -  the "PRESS START" title screen shown once per page
   load, before the starter screen. A Gold/Silver homage: a pixel
   night sky with a moon, Moltres crossing it as a silhouette, and
   the three starters waiting on a grassy ledge.

   The sky is painted into a small canvas (one canvas pixel = PIXEL
   CSS pixels, upscaled with image-rendering: pixelated) so it stays
   blocky on any screen. It only animates while the title is up.
   ============================================================ */

import { $ } from './ui.js';

const PIXEL = 3;
const FPS = 10;                 // a stepped, Game Boy-ish frame rate for the twinkles
const SKY = ['#0a0c26', '#12153a', '#1c1d4e', '#2a2660', '#3d3170', '#58407c'];
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const MOON = '#f8f0c8', MOON_SHADE = '#d8cc98', HALO = '#6a5a9a';
const FAR_HILLS = '#2a2358', NEAR_HILLS = '#1a1740';
const GRASS = ['#183a26', '#24583a', '#3c8a4c', '#6cc060'];

/** Show the title screen; resolves once the player presses start. */
export function showTitle() {
  const screen = $('title-screen');
  const canvas = $('title-sky');
  const ctx = canvas.getContext('2d');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  $('press-start-text').textContent = matchMedia('(pointer: coarse)').matches ? 'TAP TO START' : 'PRESS START';

  let base = null, stars = [], shooting = null, W = 0, H = 0, timer = 0, frame = 0;

  function resize() {
    const ground = Math.round(Math.min(150, Math.max(96, innerHeight * 0.17)));
    screen.style.setProperty('--ground', `${ground}px`);
    W = Math.ceil(innerWidth / PIXEL);
    H = Math.ceil(innerHeight / PIXEL);
    canvas.width = W;
    canvas.height = H;
    base = paintScenery(W, H, Math.round(ground / PIXEL));
    stars = makeStars(W, H - Math.round(ground / PIXEL) - 56, moonOf(W, H));
    draw();
  }

  function draw() {
    ctx.drawImage(base, 0, 0);
    for (const s of stars) {
      const glow = still ? 1 : 0.5 + 0.5 * Math.sin(frame * s.speed + s.phase);
      if (glow < 0.25) continue;
      ctx.fillStyle = glow > 0.7 ? '#ffffff' : '#9aa4e8';
      ctx.fillRect(s.x, s.y, 1, 1);
      if (s.big && glow > 0.8) {
        ctx.fillStyle = '#9aa4e8';
        ctx.fillRect(s.x - 1, s.y, 1, 1); ctx.fillRect(s.x + 1, s.y, 1, 1);
        ctx.fillRect(s.x, s.y - 1, 1, 1); ctx.fillRect(s.x, s.y + 1, 1, 1);
      }
    }
    if (shooting) {
      for (let i = 0; i < 7; i++) {
        ctx.fillStyle = i === 0 ? '#ffffff' : i < 3 ? '#fff2b0' : '#8a86c8';
        ctx.fillRect(Math.round(shooting.x - i * 2), Math.round(shooting.y - i), 2, 1);
      }
    }
  }

  function tick() {
    frame++;
    if (!shooting && Math.random() < 0.012) shooting = { x: W * (0.2 + Math.random() * 0.7), y: H * 0.05 + Math.random() * H * 0.2, life: 14 };
    if (shooting) {
      shooting.x -= 4; shooting.y += 2;
      if (--shooting.life <= 0) shooting = null;
    }
    draw();
  }

  resize();
  addEventListener('resize', resize);
  if (!still) timer = setInterval(tick, 1000 / FPS);
  screen.hidden = false;
  document.body.classList.add('titling');
  $('press-start').focus({ preventScroll: true });

  return new Promise(resolve => {
    const go = (e) => {
      if (e.type === 'keydown' && (e.repeat || ['Tab', 'Shift', 'Control', 'Alt', 'Meta'].includes(e.key))) return;
      e.preventDefault();
      screen.removeEventListener('click', go);
      document.removeEventListener('keydown', go);
      screen.classList.add('leaving');
      setTimeout(() => {
        clearInterval(timer);
        removeEventListener('resize', resize);
        screen.hidden = true;
        document.body.classList.remove('titling');
        resolve();
      }, still ? 0 : 1100);
    };
    screen.addEventListener('click', go);
    document.addEventListener('keydown', go);
  });
}

/** The sky, moon and hills: everything that doesn't move, painted once per resize. */
function paintScenery(W, H, groundH) {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const rand = seeded(1999);
  const groundY = H - groundH;

  // sky bands, ordered-dithered into each other like a GBC gradient
  const img = g.createImageData(W, H);
  const rgb = SKY.map(hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)));
  for (let y = 0; y < H; y++) {
    const t = Math.min(0.999, Math.max(0, (y / groundY) ** 1.6)) * (rgb.length - 1);
    const band = Math.floor(t), mix = t - band;
    for (let x = 0; x < W; x++) {
      const pick = mix * 16 > BAYER[(y % 4) * 4 + (x % 4)] ? band + 1 : band;
      const [r, gg, b] = rgb[Math.min(pick, rgb.length - 1)];
      const i = (y * W + x) * 4;
      img.data[i] = r; img.data[i + 1] = gg; img.data[i + 2] = b; img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);

  // the moon, with a dithered halo and a shaded side
  const { x: mx, y: my, r } = moonOf(W, H);
  for (let y = -r - 5; y <= r + 5; y++) {
    for (let x = -r - 5; x <= r + 5; x++) {
      const d = Math.hypot(x, y);
      if (d <= r) {
        g.fillStyle = x + y > r * 0.9 ? MOON_SHADE : MOON;
        g.fillRect(mx + x, my + y, 1, 1);
      } else if (d <= r + 5 && (x + y) % 2 === 0 && d <= r + 2 + rand() * 3) {
        g.fillStyle = HALO;
        g.fillRect(mx + x, my + y, 1, 1);
      }
    }
  }
  g.fillStyle = MOON_SHADE;
  for (const [cx, cy, cr] of [[-0.35, -0.2, 0.18], [0.2, 0.3, 0.13], [0.1, -0.45, 0.1]]) {
    const R = Math.max(1, Math.round(cr * r));
    for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) {
      if (x * x + y * y <= R * R) g.fillRect(mx + Math.round(cx * r) + x, my + Math.round(cy * r) + y, 1, 1);
    }
  }

  // two rows of hills, then the ledge the starters stand on
  ridge(g, W, groundY, FAR_HILLS, 52, 1.1, rand);
  ridge(g, W, groundY, NEAR_HILLS, 26, 1.5, rand);
  g.fillStyle = GRASS[0];
  g.fillRect(0, groundY, W, groundH);
  g.fillStyle = GRASS[1];
  g.fillRect(0, groundY, W, 3);
  g.fillStyle = GRASS[2];
  g.fillRect(0, groundY, W, 1);
  for (let x = 0; x < W; x += 3 + Math.floor(rand() * 5)) {
    const h = 1 + Math.floor(rand() * 3);
    g.fillStyle = GRASS[2];
    g.fillRect(x, groundY - h, 1, h);
    g.fillStyle = GRASS[3];
    g.fillRect(x, groundY - h, 1, 1);
  }
  for (let i = 0; i < W * groundH / 40; i++) {
    g.fillStyle = rand() < 0.5 ? GRASS[1] : '#10281a';
    g.fillRect(Math.floor(rand() * W), groundY + 4 + Math.floor(rand() * groundH), 2, 1);
  }
  return c;
}

/** A jagged skyline that random-walks across the width, filled down to the ground. */
function ridge(g, W, groundY, color, height, steep, rand) {
  g.fillStyle = color;
  let h = height * (0.4 + rand() * 0.6), dir = 1;
  for (let x = 0; x < W; x++) {
    if (rand() < 0.08) dir = -dir;
    h = Math.max(height * 0.25, Math.min(height, h + dir * steep * rand()));
    const top = Math.round(groundY - h);
    g.fillRect(x, top, 1, groundY - top);
  }
}

function moonOf(W, H) {
  return { x: Math.round(W * 0.74), y: Math.round(Math.min(H * 0.2, 60)), r: Math.max(9, Math.round(Math.min(W, H) * 0.06)) };
}

function makeStars(W, maxY, moon) {
  const rand = seeded(42);
  return Array.from({ length: Math.round(W * maxY / 180) }, () => ({
    x: Math.floor(rand() * W),
    y: Math.floor(rand() * maxY),
    big: rand() < 0.08,
    speed: 0.15 + rand() * 0.35,
    phase: rand() * Math.PI * 2,
  })).filter(s => Math.hypot(s.x - moon.x, s.y - moon.y) > moon.r + 7);
}

function seeded(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
