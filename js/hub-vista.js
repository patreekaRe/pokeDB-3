/* hub-vista.js  -  the view out past the Clearing's Safari gate (branch secret-base, the user's ask 2026-10-09: the forest
   cleared round the gate like the Safari lobby's backdrop, js/safari-lobby.js, the road going on through it into the
   distance). One smooth painting in world units, stood up behind the back-left corner square to the camera
   (js/hub-3d.js's buildVista()): an open meadow, the trail winding from the ground's back edge off to the horizon, a
   treeline, two hazy ranges of snowy mountains and the lobby's sky, lit for the hour. Its foot fades out, so the 3D
   ground and road run on into it. */

import { hash } from './tower-art.js';
import { GRADES, gradeHex } from './daytime.js';
import { rgba, puff, glow, vgrad } from './smooth-paint.js';
import { SKY, CLOUD } from './safari-lobby.js';

export const VISTA = { x0: -22, w: 24, h: 14 };   // world x of its left edge, its size in world units
const K = 48;                                      // canvas pixels a world unit
const HZ = 0.95;                                   // the horizon, units up from its foot
const FADE = 0.3;                                  // its foot fading into the ground

/** The painting for `time`; `roadX` is the world x where the road leaves the ground's back edge, `half` its half-width. */
export function vistaArt(time, roadX, half) {
  const { w: W, h: H } = VISTA, c = new OffscreenCanvas(W * K, H * K), g = c.getContext('2d');
  c.fine = K;
  g.scale(K, K);
  const L = (hex) => time === 'day' ? hex : gradeHex(hex, GRADES[time].land);
  const night = time === 'night', low = time === 'dawn' || time === 'dusk';
  const hy = H - HZ;   // the horizon's canvas y

  const [s0, s1, s2] = SKY[time];
  g.fillStyle = vgrad(g, H - 9, hy, [s0, s1, s2]); g.fillRect(0, 0, W, hy + 0.05);
  // the sun (the moon at night) over the left of the view, low at dawn and dusk
  const sx = 6, sy = hy - (low ? 1.4 : 4.6), sr = night ? 0.42 : low ? 0.62 : 0.5;
  if (night) {
    glow(g, sx, sy, sr * 4, '#c8d4ff', 0.18);
    g.fillStyle = '#eceadc'; g.beginPath(); g.arc(sx, sy, sr, 0, Math.PI * 2); g.fill();
    for (let i = 0; i < 140; i++) {
      const x = hash(i * 3.1) * W, y = hash(i * 7.7 + 1) * (hy - 0.6), r = 0.02 + hash(i * 1.3) * 0.035;
      if (Math.hypot(x - sx, y - sy) < sr + 0.3) continue;
      g.fillStyle = `rgba(255,255,255,${0.4 + hash(i + 0.5) * 0.6})`; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
  } else {
    const hot = time === 'day' ? '#fff6b0' : time === 'dawn' ? '#ffd8a0' : '#ff9a50';
    glow(g, sx, sy, sr * (low ? 6 : 4.5), hot, low ? 0.55 : 0.4);
    const sg = g.createRadialGradient(sx - sr * 0.3, sy - sr * 0.3, 0, sx, sy, sr);
    sg.addColorStop(0, '#fffef0'); sg.addColorStop(1, time === 'day' ? '#ffe878' : time === 'dawn' ? '#ffc070' : '#ff7838');
    g.fillStyle = sg; g.beginPath(); g.arc(sx, sy, sr, 0, Math.PI * 2); g.fill();
  }
  for (let i = 0; i < 9; i++) puff(g, hash(i * 5.3) * (W + 2) - 1, hy - 2.6 - hash(i * 2.7) * 4.5, 0.35 + hash(i * 9.1) * 0.4, CLOUD[time], night ? 0.8 : 0.92);

  // two ranges of snowy mountains hazing into the distance
  const range = (n, lo, hi, seed, body, snow) => {
    const peaks = [];
    for (let i = -1; i <= n + 1; i++) peaks.push({ x: (i + 0.5 + (hash(i * 3.7 + seed) - 0.5) * 0.6) * W / n, h: lo + hash(i * 1.9 + seed) * (hi - lo) });
    const dip = (a, b) => ({ x: (a.x + b.x) / 2, h: Math.min(a.h, b.h) * (0.35 + hash(a.x + seed) * 0.2) });
    g.fillStyle = vgrad(g, hy - hi, hy, body);
    g.beginPath(); g.moveTo(-1, hy + 0.05);
    peaks.forEach((p, i) => { g.lineTo(p.x, hy - p.h); if (peaks[i + 1]) { const v = dip(p, peaks[i + 1]); g.lineTo(v.x, hy - v.h); } });
    g.lineTo(W + 1, hy + 0.05); g.closePath(); g.fill();
    peaks.forEach((p, i) => {   // each peak's shaded face, then its snow cap
      const rv = peaks[i + 1] ? dip(p, peaks[i + 1]) : { x: p.x + W / n / 2, h: 0 }, lv = peaks[i - 1] ? dip(peaks[i - 1], p) : { x: p.x - W / n / 2, h: 0 };
      g.fillStyle = 'rgba(20,30,60,0.16)';
      g.beginPath(); g.moveTo(p.x, hy - p.h); g.lineTo(rv.x, hy - rv.h); g.lineTo(rv.x, hy); g.lineTo(p.x + (rv.x - p.x) * 0.15, hy); g.closePath(); g.fill();
      if (p.h < lo + (hi - lo) * 0.35) return;
      const at = (v, k) => [p.x + (v.x - p.x) * k, hy - p.h + (p.h - v.h) * k];
      g.fillStyle = snow;
      g.beginPath(); g.moveTo(p.x, hy - p.h); g.lineTo(...at(rv, 0.32)); g.lineTo(...at(rv, 0.18).map((v, j) => j ? v + 0.1 : v - 0.06));
      g.lineTo(p.x + 0.03, hy - p.h * 0.8); g.lineTo(...at(lv, 0.2).map((v, j) => j ? v + 0.06 : v)); g.lineTo(...at(lv, 0.3)); g.closePath(); g.fill();
    });
    g.fillStyle = vgrad(g, hy - hi * 0.6, hy, [rgba(L(s2), 0), rgba(L(s2), 0.55)]);
    g.fillRect(0, hy - hi * 0.6, W, hi * 0.6 + 0.05);
  };
  range(5, 2.2, 3.8, 1, [L('#a8b8d8'), L('#8ca0c4')], L('#f4f6fa'));
  range(8, 1, 2, 9, [L('#8098c0'), L('#6a82ac')], L('#e8eef6'));

  // the meadow, paler far off, a treeline along the horizon
  g.fillStyle = vgrad(g, hy, H, [L('#b0dc88'), L('#8ccc62'), L('#76c052')]);
  g.fillRect(0, hy, W, HZ);
  const road = roadX - VISTA.x0;
  for (let i = 0; i < W * 3; i++) {
    const x = hash(i * 4.7) * W, r = 0.12 + hash(i * 2.3) * 0.2;
    if (Math.abs(x - road) < 0.45) continue;   // a gap where the trail goes over the horizon, framed by the gate
    const tg = g.createRadialGradient(x - r * 0.3, hy - r * 0.7, 0, x, hy - r * 0.3, r * 1.1);
    tg.addColorStop(0, L('#5eae4c')); tg.addColorStop(1, L('#2e6a30'));
    g.fillStyle = tg; g.beginPath(); g.ellipse(x, hy - r * 0.35, r, r * 0.8, 0, 0, Math.PI * 2); g.fill();
  }
  g.fillStyle = rgba(L('#2e6a30'), 0.55); g.fillRect(0, hy - 0.02, W, 0.07);
  for (let i = 0; i < W * 14; i++) {   // wildflowers, smaller far off
    const k = hash(i * 6.1), y = hy + 0.1 + k * (HZ - 0.2), x = hash(i * 2.9 + 3) * W;
    g.fillStyle = L(['#ffffff', '#f8e070', '#f898b8', '#c8a8f8'][i % 4]);
    g.beginPath(); g.arc(x, y, 0.012 + k * 0.035, 0, Math.PI * 2); g.fill();
  }

  // the trail, from the ground's back edge winding off over the horizon
  const at = (y) => {
    const t = (y - hy) / HZ;   // 0 at the horizon, 1 at the foot
    return [road + Math.sin((1 - t) * 3.2) * (1 - t) * 0.9, Math.max(0.015, half * t ** 1.7)];
  };
  const left = [], right = [];
  for (let y = hy; y <= H + 0.001; y += 0.02) { const [x, hw] = at(y); left.push([x - hw, y]); right.unshift([x + hw, y]); }
  const trail = new Path2D();
  [...left, ...right].forEach(([x, y], i) => (i ? trail.lineTo(x, y) : trail.moveTo(x, y)));
  trail.closePath();
  g.fillStyle = vgrad(g, hy, H, [L('#e8d4a0'), L('#e0c488'), L('#d6ba82')]); g.fill(trail);
  g.strokeStyle = rgba(L('#8a6838'), 0.5); g.lineWidth = 0.025; g.stroke(trail);
  for (let i = 0; i < 60; i++) {   // pebbles and ruts on it
    const y = hy + 0.1 + hash(i * 1.3) * (HZ - 0.1), [x, hw] = at(y);
    g.fillStyle = rgba(L('#a08048'), 0.5);
    g.beginPath(); g.ellipse(x + (hash(i * 7.1) - 0.5) * hw * 1.4, y, 0.01 + hw * 0.06, 0.006 + hw * 0.03, 0, 0, Math.PI * 2); g.fill();
  }

  // the foot fades out, onto the real ground
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'destination-in';
  const f = g.createLinearGradient(0, 0, 0, H * K);   // one fill: destination-in clears whatever a fill doesn't cover
  f.addColorStop(0, '#000'); f.addColorStop(1 - FADE / H, '#000'); f.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = f; g.fillRect(0, 0, W * K, H * K);
  return c;
}
