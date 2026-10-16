/* ============================================================
   smooth-paint.js  -  the helpers the smooth lobby backdrops share
   (the Sky Pillar's in js/towerprep.js, the Safari's in
   js/safari-lobby.js, the character select's in js/select-sky.js):
   full-resolution canvases, soft clouds, a ~30 fps frame loop.
   ============================================================ */

export const rgba = (hex, a) => `rgba(${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)}, ${a})`;

/** An offscreen canvas at the screen's resolution, its context in CSS pixels. */
export function layer(W, H, dpr) {
  const c = document.createElement('canvas');
  c.width = Math.round(W * dpr);
  c.height = Math.round(H * dpr);
  const ctx = c.getContext('2d');
  ctx.scale(dpr, dpr);
  return [c, ctx];
}

/** Sizes `canvas` to W x H CSS pixels at the screen's resolution; returns the scale. */
export function fitCanvas(canvas, W, H) {
  const dpr = Math.min(2, devicePixelRatio || 1);
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  return dpr;
}

/** A soft, rounded cloud: overlapping puffs lit from above. */
export function puff(ctx, x, y, r, tint = ['#ffffff', '#dce6f4'], alpha = 1) {
  const g = ctx.createLinearGradient(0, y - r * 1.2, 0, y + r * 0.6);
  g.addColorStop(0, rgba(tint[0], alpha));
  g.addColorStop(1, rgba(tint[1], alpha));
  ctx.fillStyle = g;
  ctx.beginPath();
  for (const [dx, dy, k] of [[-1.5, 0.15, 0.6], [-0.7, -0.35, 0.85], [0.3, -0.55, 1], [1.2, -0.15, 0.75], [1.9, 0.2, 0.5]]) {
    ctx.moveTo(x + dx * r + k * r, y + dy * r);
    ctx.arc(x + dx * r, y + dy * r, k * r, 0, Math.PI * 2);
  }
  ctx.rect(x - 1.5 * r, y, 3.4 * r, 0.35 * r);
  ctx.fill();
}

/** A soft round glow, added onto what's under it. */
export function glow(ctx, x, y, r, hex, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(hex, a));
  g.addColorStop(1, rgba(hex, 0));
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}

/** A vertical gradient through `stops` (colours spread evenly) from y0 to y1. */
export function vgrad(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach((c, i) => g.addColorStop(i / Math.max(1, stops.length - 1), c));
  return g;
}

/** A twinkling four-point star. */
export function sparkle(ctx, x, y, k, colour) {
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.moveTo(x, y - k); ctx.quadraticCurveTo(x, y, x + k, y); ctx.quadraticCurveTo(x, y, x, y + k);
  ctx.quadraticCurveTo(x, y, x - k, y); ctx.quadraticCurveTo(x, y, x, y - k);
  ctx.fill();
}

export const stillMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Calls draw(seconds) at ~30 fps on `state.raf` (draws once under reduced motion). */
export function animate(state, draw) {
  draw(0);
  if (stillMotion()) return;
  let last = 0;
  const tick = (now) => {
    state.raf = requestAnimationFrame(tick);
    if (now - last < 33) return;
    last = now;
    draw(now / 1000);
  };
  state.raf = requestAnimationFrame(tick);
}

export function halt(state) {
  if (state?.raf) cancelAnimationFrame(state.raf);
  if (state) state.raf = 0;
}
