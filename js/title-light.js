/* ============================================================
   title-light.js  -  smooth light over the title's pixel sky (the
   user's pick, 2026-10-08: the ?hybrid look, HD-2D, for the title).

   The sky, hills and ledge stay pixels (js/title.js); this canvas,
   laid over them, adds what pixels can't: a bloom round the moon or
   sun, a warm (or cool) glow along the horizon, haze over the far
   hills, a soft vignette, and glowing motes drifting over the grass
   (fireflies at dusk and night, pollen by day). It's drawn at half
   resolution and scaled up, since light is blurry anyway.
   ============================================================ */

const SCALE = 0.5;
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* per time of day: the orb's bloom, the horizon's glow, the haze, the vignette's dark, and the motes */
const LOOKS = {
  dawn:  { bloom: [255, 214, 170, 0.42], horizon: [255, 170, 140, 0.26], haze: 0.10, dark: 0.22, mote: [255, 236, 190], count: 18, fly: false },
  day:   { bloom: [255, 246, 200, 0.55], horizon: [255, 255, 255, 0.14], haze: 0.16, dark: 0.14, mote: [255, 250, 220], count: 16, fly: false },
  dusk:  { bloom: [214, 206, 255, 0.34], horizon: [255, 150, 130, 0.30], haze: 0.08, dark: 0.30, mote: [220, 255, 140], count: 18, fly: true },
  night: { bloom: [200, 214, 255, 0.30], horizon: [90, 110, 220, 0.14], haze: 0.05, dark: 0.42, mote: [210, 255, 150], count: 22, fly: true },
};

let canvas = null, g = null, base = null, sprite = null, look = LOOKS.dusk, motes = [], raf = 0, last = 0, W = 0, H = 0, groundY = 0;

const rgba = ([r, gg, b], a) => `rgba(${r}, ${gg}, ${b}, ${a})`;

/** Paints the still light for this size and time; `orb` is the moon or sun ({ x, y, r } in CSS pixels), `ground` the
    ledge's height and `hills` how far the far hills rise over it (CSS pixels). */
export function paintTitleLight(el, { time, orb, ground, hills }) {
  canvas = el;
  g = canvas.getContext('2d');
  look = LOOKS[time] ?? LOOKS.dusk;
  W = canvas.width = Math.ceil(innerWidth * SCALE);
  H = canvas.height = Math.ceil(innerHeight * SCALE);
  groundY = (innerHeight - ground) * SCALE;
  const horizonY = groundY - hills * SCALE;
  base = document.createElement('canvas');
  base.width = W; base.height = H;
  const b = base.getContext('2d');

  // the horizon's glow, rising behind the hills
  const glow = b.createLinearGradient(0, horizonY - H * 0.35, 0, groundY);
  glow.addColorStop(0, rgba(look.horizon, 0));
  glow.addColorStop(0.75, rgba(look.horizon, look.horizon[3]));
  glow.addColorStop(1, rgba(look.horizon, look.horizon[3] * 0.4));
  b.fillStyle = glow;
  b.fillRect(0, 0, W, groundY);
  // haze lying over the far hills
  const haze = b.createLinearGradient(0, horizonY - 10, 0, groundY + 6);
  haze.addColorStop(0, 'rgba(255, 255, 255, 0)');
  haze.addColorStop(0.6, `rgba(230, 236, 255, ${look.haze})`);
  haze.addColorStop(1, 'rgba(230, 236, 255, 0)');
  b.fillStyle = haze;
  b.fillRect(0, horizonY - 10, W, groundY - horizonY + 16);
  // the moon's (or sun's) bloom
  const ox = orb.x * SCALE, oy = orb.y * SCALE, R = orb.r * SCALE;
  const bloom = b.createRadialGradient(ox, oy, R * 0.6, ox, oy, R * 7);
  bloom.addColorStop(0, rgba(look.bloom, look.bloom[3]));
  bloom.addColorStop(0.25, rgba(look.bloom, look.bloom[3] * 0.4));
  bloom.addColorStop(1, rgba(look.bloom, 0));
  b.fillStyle = bloom;
  b.fillRect(0, 0, W, H);
  // a soft vignette, so the eye sits in the middle
  const vig = b.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.3, W / 2, H * 0.45, Math.hypot(W, H) * 0.62);
  vig.addColorStop(0, 'rgba(4, 6, 20, 0)');
  vig.addColorStop(1, `rgba(4, 6, 20, ${look.dark})`);
  b.fillStyle = vig;
  b.fillRect(0, 0, W, H);

  sprite = glowSprite(look.mote);
  motes = Array.from({ length: look.count }, () => mote(true));
  draw(performance.now());
}

/** One glowing mote: a firefly wanders low over the grass and blinks; pollen rises slowly and fades. */
function mote(anywhere = false) {
  const top = groundY - H * 0.32;
  return {
    x: Math.random() * W,
    y: anywhere ? top + Math.random() * (H - top) : look.fly ? groundY + Math.random() * (H - groundY) : H + 4,
    r: (look.fly ? 5 : 3) + Math.random() * (look.fly ? 5 : 3),
    vx: (Math.random() - 0.5) * (look.fly ? 6 : 3),
    vy: look.fly ? (Math.random() - 0.5) * 4 : -(2 + Math.random() * 4),
    phase: Math.random() * Math.PI * 2,
    speed: 0.6 + Math.random() * 1.4,
  };
}

function glowSprite([r, gg, b]) {
  const s = document.createElement('canvas');
  s.width = s.height = 32;
  const c = s.getContext('2d');
  const grad = c.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, `rgba(255, 255, 255, 1)`);
  grad.addColorStop(0.18, `rgba(${r}, ${gg}, ${b}, 0.9)`);
  grad.addColorStop(0.5, `rgba(${r}, ${gg}, ${b}, 0.25)`);
  grad.addColorStop(1, `rgba(${r}, ${gg}, ${b}, 0)`);
  c.fillStyle = grad;
  c.fillRect(0, 0, 32, 32);
  return s;
}

function draw(now) {
  if (!g || !base) return;
  const t = now / 1000, dt = Math.min(0.1, (now - (last || now)) / 1000);
  last = now;
  g.clearRect(0, 0, W, H);
  g.globalAlpha = still() ? 1 : 0.9 + 0.1 * Math.sin(t * 0.8);   // the bloom breathes
  g.drawImage(base, 0, 0);
  g.globalCompositeOperation = 'lighter';
  for (const m of motes) {
    if (!still()) {
      m.x += (m.vx + Math.sin(t * m.speed + m.phase) * 3) * dt;
      m.y += (m.vy + Math.cos(t * m.speed * 0.7 + m.phase) * 2) * dt;
    }
    const a = look.fly ? Math.max(0, Math.sin(t * m.speed + m.phase)) ** 2 : Math.min(1, (H - m.y) / 30) * 0.6;
    if (m.x < -10 || m.x > W + 10 || m.y < groundY - H * 0.4 || m.y > H + 8) Object.assign(m, mote());
    if (a < 0.02) continue;
    g.globalAlpha = a;
    g.drawImage(sprite, m.x - m.r * 2, m.y - m.r * 2, m.r * 4, m.r * 4);
  }
  g.globalCompositeOperation = 'source-over';
  g.globalAlpha = 1;
}

/** Runs the motes while the title is up; still under reduced motion (painted once). */
export function runTitleLight(on) {
  cancelAnimationFrame(raf);
  raf = 0;
  last = 0;
  if (!on || still()) return;
  let prev = 0;
  const loop = (now) => {
    raf = requestAnimationFrame(loop);
    if (now - prev < 32) return;   // ~30 fps is plenty for drifting light
    prev = now;
    draw(now);
  };
  raf = requestAnimationFrame(loop);
}
