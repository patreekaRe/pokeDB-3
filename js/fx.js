/* ============================================================
   fx.js  -  the orbiting sparkle ring around the "How to play" button.

   A small 3D effect without a 3D library: points sit on a tilted ring,
   spin around it, and are projected with simple perspective, so the far
   side of the ring is smaller and dimmer than the near side. It's drawn
   on a 2D canvas behind the button, and only while the start screen is
   showing.
   ============================================================ */

const COUNT = 42;
const TILT = 0.38;         // radians the ring leans back (0 = seen edge-on, like a planet's ring)
const SPEED = 0.35;        // radians per second around the ring
const COLORS = ['#ffcb05', '#ffffff', '#ff8f4d', '#5cbcff', '#72dc70'];

/** Called once at startup. */
export function initHowtoFx() {
  const canvas = document.getElementById('howto-fx');
  if (!canvas || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx = canvas.getContext('2d');

  // Each sparkle: where it sits on the ring, a small wobble, a size and a colour.
  const points = Array.from({ length: COUNT }, (_, i) => ({
    angle: (i / COUNT) * Math.PI * 2 + Math.random() * 0.3,
    lift: (Math.random() - 0.5) * 0.25,
    size: 1.8 + Math.random() * 2.6,
    color: COLORS[i % COLORS.length],
    phase: Math.random() * Math.PI * 2,
  }));
  const sprites = Object.fromEntries(COLORS.map(c => [c, glowSprite(c)]));

  let width = 0, height = 0;
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  function frame(ms) {
    requestAnimationFrame(frame);
    if (document.hidden || document.body.dataset.screen !== 'start-screen') return;
    const t = ms / 1000;
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'lighter';                 // overlapping glows add up, like light

    const radius = width * 0.42;
    const focal = radius * 3;
    // draw far points first so near ones land on top
    const projected = points.map(p => {
      const a = p.angle + t * SPEED;
      const x = Math.cos(a) * radius;
      const ringZ = Math.sin(a) * radius;
      const ringY = p.lift * radius + Math.sin(t * 2 + p.phase) * 3;
      // lean the ring back around the x axis
      const y = ringY * Math.cos(TILT) - ringZ * Math.sin(TILT);
      const z = ringY * Math.sin(TILT) + ringZ * Math.cos(TILT);
      const scale = focal / (focal + z);
      return { p, sx: width / 2 + x * scale, sy: height / 2 + y * scale, scale, z };
    }).sort((a, b) => b.z - a.z);

    for (const { p, sx, sy, scale, z } of projected) {
      const depth = 1 - (z + radius) / (radius * 2);            // 0 = far, 1 = near
      const twinkle = 0.75 + 0.25 * Math.sin(t * 3 + p.phase);
      const r = p.size * scale * 3;
      ctx.globalAlpha = (0.25 + 0.75 * depth) * twinkle;
      ctx.drawImage(sprites[p.color], sx - r, sy - r, r * 2, r * 2);
    }
    ctx.globalAlpha = 1;
  }
  requestAnimationFrame(frame);

  // a gentle 3D tilt toward the pointer (mouse only; fingers don't hover)
  const btn = document.getElementById('howto-btn');
  btn.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const box = btn.getBoundingClientRect();
    const dx = (e.clientX - box.left) / box.width - 0.5;
    const dy = (e.clientY - box.top) / box.height - 0.5;
    btn.style.transform = `perspective(400px) rotateX(${-dy * 16}deg) rotateY(${dx * 20}deg) scale(1.05)`;
  });
  btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
}

/** A soft glowing dot, drawn once per colour and reused every frame (cheaper than shadowBlur). */
function glowSprite(color) {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, '#fff');
  grad.addColorStop(0.25, color);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 32, 32);
  return c;
}
