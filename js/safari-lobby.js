/* ============================================================
   safari-lobby.js  -  the Safari Zone lobby's backdrop (js/safariprep.js),
   the Sky Pillar lobby's twin, painted smooth at the screen's resolution
   like it (the user's call, 2026-10-07): the Zone's gate on its fenced
   meadow, a trail winding off to the far mountains, lit for the player's
   time of day (js/daytime.js); clouds, swaying grass, butterflies by day
   and fireflies by night.
   ============================================================ */

import { hash } from './tower-art.js';
import { timeOfDay, GRADES, gradeHex } from './daytime.js';
import { rgba, layer, fitCanvas, puff, glow, vgrad, sparkle, animate, halt } from './smooth-paint.js';

export const SKY = {   // top, middle, horizon
  dawn: ['#2c3c70', '#a07898', '#f8c098'],
  day: ['#3a7ee0', '#78b4f0', '#cfeaf8'],
  dusk: ['#282050', '#a04868', '#f89048'],
  night: ['#060a20', '#101a40', '#2a3a62'],
};
export const CLOUD = { day: ['#ffffff', '#d8e4f2'], dawn: ['#fbe4d8', '#c890a0'], dusk: ['#f8d0b8', '#a06078'], night: ['#3a4870', '#222c4c'] };

let sky = null;

export function stopGate() { halt(sky); }

/** Paint (and animate) the backdrop on `canvas` over `page`, `ground` being the grass line's CSS y from the page's top.
    Returns the grass line. */
export function startGate(canvas, page, ground) {
  stopGate();
  const W = page.clientWidth, H = page.clientHeight, G = Math.round(ground);
  if (!W || !H) return G;   // not laid out yet: the lobby's ResizeObserver paints it once it is
  const dpr = fitCanvas(canvas, W, H);
  sky = build(W, H, G, dpr, timeOfDay());
  const ctx = canvas.getContext('2d');
  animate(sky, (t) => paint(ctx, sky, t));
  return G;
}

function build(W, H, G, dpr, time) {
  const L = (h) => time === 'day' ? h : gradeHex(h, GRADES[time].land);
  const night = time === 'night', lowSun = time === 'dawn' || time === 'dusk';
  const cx = W / 2;
  const Hz = G - Math.max(38, Math.round(G * 0.34));   // the horizon, where the meadow meets the mountains
  const [back, b] = layer(W, H, dpr);
  const [front, f] = layer(W, H, dpr);

  // the sky
  const [s0, s1, s2] = SKY[time];
  b.fillStyle = vgrad(b, 0, Hz, [s0, s1, s2]);
  b.fillRect(0, 0, W, Hz + 2);
  // the sun, low at dawn and dusk; at night the moon
  const sx = W * (time === 'dawn' ? 0.22 : 0.8), sy = lowSun ? Hz - 22 : Math.max(26, Hz * 0.3), sr = night ? 11 : lowSun ? 17 : 13;
  if (night) {
    glow(b, sx, sy, sr * 4, '#c8d4ff', 0.18);
    b.fillStyle = '#eceadc';
    b.beginPath(); b.arc(sx, sy, sr, 0, Math.PI * 2); b.fill();
    b.fillStyle = 'rgba(150, 150, 130, 0.35)';
    for (const [dx, dy, r] of [[-3, -2, 2.6], [4, 3, 1.8], [-1, 5, 1.4]]) { b.beginPath(); b.arc(sx + dx, sy + dy, r, 0, Math.PI * 2); b.fill(); }
  } else {
    const hot = time === 'day' ? '#fff6b0' : time === 'dawn' ? '#ffd8a0' : '#ff9a50';
    glow(b, sx, sy, sr * (lowSun ? 6 : 4.5), hot, lowSun ? 0.55 : 0.4);
    const sg = b.createRadialGradient(sx - sr * 0.3, sy - sr * 0.3, 0, sx, sy, sr);
    sg.addColorStop(0, '#fffef0'); sg.addColorStop(1, time === 'day' ? '#ffe878' : time === 'dawn' ? '#ffc070' : '#ff7838');
    b.fillStyle = sg;
    b.beginPath(); b.arc(sx, sy, sr, 0, Math.PI * 2); b.fill();
  }

  // the far mountains, snow on the peaks, two ranges hazing into the distance
  const range = (n, hMin, hMax, seed, body, snow, haze) => {
    const peaks = [];
    for (let i = -1; i <= n; i++) peaks.push({ x: (i + 0.5 + (hash(i * 3.7 + seed) - 0.5) * 0.6) * W / n, h: hMin + hash(i * 1.9 + seed) * (hMax - hMin) });
    const valley = (a, c) => ({ x: (a.x + c.x) / 2, h: Math.min(a.h, c.h) * (0.35 + hash(a.x + seed) * 0.2) });
    f.fillStyle = vgrad(f, Hz - hMax, Hz, body);
    f.beginPath(); f.moveTo(-10, Hz + 1);
    for (let i = 0; i < peaks.length; i++) {
      const p = peaks[i];
      f.lineTo(p.x, Hz - p.h);
      if (peaks[i + 1]) { const v = valley(p, peaks[i + 1]); f.lineTo(v.x, Hz - v.h); }
    }
    f.lineTo(W + 10, Hz + 1); f.closePath(); f.fill();
    // the shadowed face of each peak, then its snow cap
    for (let i = 0; i < peaks.length; i++) {
      const p = peaks[i], rv = peaks[i + 1] ? valley(p, peaks[i + 1]) : { x: p.x + W / n / 2, h: 0 };
      const lv = peaks[i - 1] ? valley(peaks[i - 1], p) : { x: p.x - W / n / 2, h: 0 };
      f.fillStyle = 'rgba(20, 30, 60, 0.16)';
      f.beginPath(); f.moveTo(p.x, Hz - p.h); f.lineTo(rv.x, Hz - rv.h); f.lineTo(rv.x, Hz); f.lineTo(p.x + (rv.x - p.x) * 0.15, Hz); f.closePath(); f.fill();
      if (p.h < hMin + (hMax - hMin) * 0.35) continue;
      const at = (v, k) => [p.x + (v.x - p.x) * k, Hz - p.h + (p.h - v.h) * k];
      f.fillStyle = snow;
      f.beginPath(); f.moveTo(p.x, Hz - p.h);
      f.lineTo(...at(rv, 0.32)); f.lineTo(...at(rv, 0.18).map((v, j) => j ? v + 3 : v - 2)); f.lineTo(p.x + 1, Hz - p.h + p.h * 0.2);
      f.lineTo(...at(lv, 0.2).map((v, j) => j ? v + 2 : v)); f.lineTo(...at(lv, 0.3));
      f.closePath(); f.fill();
    }
    f.fillStyle = vgrad(f, Hz - hMax * 0.6, Hz, [rgba(haze, 0), rgba(haze, 0.55)]);
    f.fillRect(0, Hz - hMax * 0.6, W, hMax * 0.6 + 1);
  };
  const mtn = Math.min(70, (Hz - 10) * 0.75);
  range(4, mtn * 0.55, mtn, 1, [L('#a8b8d8'), L('#8ca0c4')], L('#f4f6fa'), L(s2));
  range(6, mtn * 0.3, mtn * 0.6, 9, [L('#8098c0'), L('#6a82ac')], L('#e8eef6'), L(s2));

  // the meadow, paler far off, a treeline along the horizon
  f.fillStyle = vgrad(f, Hz, G, [L('#b0dc88'), L('#86c860'), L('#5cb044')]);
  f.fillRect(0, Hz, W, G - Hz + 1);
  for (let i = 0; i < W / 9; i++) {
    const x = hash(i * 4.7) * W, r = 5 + hash(i * 2.3) * 7;
    if (Math.abs(x - cx) < 22) continue;
    const tg = f.createRadialGradient(x - r * 0.3, Hz - r * 0.7, 0, x, Hz - r * 0.3, r * 1.1);
    tg.addColorStop(0, L('#5eae4c')); tg.addColorStop(1, L('#2e6a30'));
    f.fillStyle = tg;
    f.beginPath(); f.ellipse(x, Hz - r * 0.35, r, r * 0.8, 0, 0, Math.PI * 2); f.fill();
  }
  f.fillStyle = rgba(L('#2e6a30'), 0.6);
  f.fillRect(0, Hz - 1, W, 3);
  // wildflowers scattered over it
  for (let i = 0; i < W / 4; i++) {
    const y = Hz + 6 + hash(i * 6.1) * (G - Hz - 12), x = hash(i * 2.9 + 3) * W, k = (y - Hz) / (G - Hz);
    f.fillStyle = L(['#ffffff', '#f8e070', '#f898b8', '#c8a8f8'][i % 4]);
    f.beginPath(); f.arc(x, y, 0.6 + k * 1.4, 0, Math.PI * 2); f.fill();
  }

  // the trail: from the gate off to the horizon, winding as it goes
  const gw = Math.max(108, Math.min(150, W * 0.3));   // the gate's opening
  const pathAt = (y) => {
    const t = (y - Hz) / Math.max(1, G - Hz);
    return [cx + Math.sin((1 - t) * 4.2) * (1 - t) * W * 0.12, Math.max(1.5, t * t * gw * 0.32 + t * 6)];
  };
  const left = [], right = [];
  for (let y = Hz; y <= G; y += 2) { const [pc, hw] = pathAt(y); left.push([pc - hw, y]); right.unshift([pc + hw, y]); }
  const trail = new Path2D();
  trail.moveTo(...left[0]);
  for (const p of [...left, [cx - gw * 0.32 - 10, G + 14], [cx + gw * 0.32 + 10, G + 14], ...right]) trail.lineTo(...p);
  trail.closePath();
  f.fillStyle = vgrad(f, Hz, G + 14, [L('#e8d4a0'), L('#e0c488'), L('#c8a468')]);
  f.fill(trail);
  f.strokeStyle = rgba(L('#8a6838'), 0.55);
  f.lineWidth = 1.2;
  f.stroke(trail);
  for (let i = 0; i < 40; i++) {
    const y = Hz + 4 + hash(i * 1.3) * (G - Hz - 4), [pc, hw] = pathAt(y);
    f.fillStyle = rgba(L('#a08048'), 0.5);
    f.beginPath(); f.ellipse(pc + (hash(i * 7.1) - 0.5) * hw * 1.4, y, 0.8 + hw * 0.05, 0.5 + hw * 0.025, 0, 0, Math.PI * 2); f.fill();
  }

  // the fence along the meadow's edge, either side of the gate
  const gl = cx - gw / 2, gr = cx + gw / 2;
  const rail = (y, h) => {
    for (const [x0, x1] of [[-4, gl - 6], [gr + 6, W + 4]]) {
      f.fillStyle = vgrad(f, y, y + h, [L('#e0aa68'), L('#a87040'), L('#6a4020')]);
      f.beginPath(); f.roundRect(x0, y, x1 - x0, h, h / 2); f.fill();
    }
  };
  const fenceH = Math.min(34, (G - Hz) * 0.5);
  for (let x = cx + 34 * Math.floor(-cx / 34); x < W + 10; x += 34) {
    if (x > gl - 16 && x < gr + 16) continue;
    f.fillStyle = 'rgba(0, 0, 0, 0.18)';
    f.beginPath(); f.ellipse(x + 3, G, 6, 2, 0, 0, Math.PI * 2); f.fill();
    const pg = f.createLinearGradient(x - 3.5, 0, x + 3.5, 0);
    pg.addColorStop(0, L('#e0aa68')); pg.addColorStop(0.5, L('#a87040')); pg.addColorStop(1, L('#5a3418'));
    f.fillStyle = pg;
    f.beginPath(); f.roundRect(x - 3.5, G - fenceH - 4, 7, fenceH + 4, [3, 3, 0, 0]); f.fill();
  }
  rail(G - fenceH, 5);
  rail(G - fenceH * 0.5, 5);

  // the gate: two log posts, a green board with a Safari Ball, a thatched roof over it
  const gh = Math.min(G - 34, Math.max(96, Math.min(150, G * 0.62)));
  const pw = 14;
  for (const x of [gl - pw / 2, gr - pw / 2]) {
    f.fillStyle = 'rgba(0, 0, 0, 0.22)';
    f.beginPath(); f.ellipse(x + pw / 2 + 4, G + 1, pw, 3, 0, 0, Math.PI * 2); f.fill();
    const lg = f.createLinearGradient(x, 0, x + pw, 0);
    lg.addColorStop(0, L('#e4b070')); lg.addColorStop(0.35, L('#b87c48')); lg.addColorStop(1, L('#5a3418'));
    f.fillStyle = lg;
    f.beginPath(); f.roundRect(x, G - gh, pw, gh + 2, 4); f.fill();
    f.strokeStyle = rgba(L('#4a2810'), 0.35);
    f.lineWidth = 1;
    for (let y = G - gh + 14; y < G; y += 16) { f.beginPath(); f.moveTo(x + 2, y); f.quadraticCurveTo(x + pw / 2, y + 3, x + pw - 2, y); f.stroke(); }
  }
  const bh = 30, by = G - gh - 6, bx0 = gl - pw, bx1 = gr + pw;
  f.fillStyle = 'rgba(0, 0, 0, 0.25)';
  f.beginPath(); f.roundRect(bx0 + 3, by + 4, bx1 - bx0, bh, 6); f.fill();
  f.fillStyle = vgrad(f, by, by + bh, [L('#7ad868'), L('#34963a'), L('#1e6a26')]);
  f.beginPath(); f.roundRect(bx0, by, bx1 - bx0, bh, 6); f.fill();
  f.strokeStyle = L('#14501c');
  f.lineWidth = 2.5;
  f.stroke();
  f.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  f.lineWidth = 1.5;
  f.beginPath(); f.moveTo(bx0 + 7, by + 4); f.lineTo(bx1 - 7, by + 4); f.stroke();
  // the Safari Ball on the board, a rivet either side
  const bcx = cx, bcy = by + bh / 2, br = bh * 0.34;
  f.save();
  f.beginPath(); f.arc(bcx, bcy, br, 0, Math.PI * 2); f.clip();
  f.fillStyle = L('#f4eed4'); f.fillRect(bcx - br, bcy, br * 2, br);
  const top = f.createLinearGradient(0, bcy - br, 0, bcy);
  top.addColorStop(0, L('#a8d858')); top.addColorStop(1, L('#5a9a30'));
  f.fillStyle = top; f.fillRect(bcx - br, bcy - br, br * 2, br);
  f.fillStyle = L('#3a7a28');
  for (const [dx, dy, r] of [[-0.45, -0.5, 0.2], [0.35, -0.6, 0.16], [0.05, -0.28, 0.13]]) { f.beginPath(); f.arc(bcx + dx * br, bcy + dy * br, r * br, 0, Math.PI * 2); f.fill(); }
  f.fillStyle = '#202018'; f.fillRect(bcx - br, bcy - 1.5, br * 2, 3);
  f.restore();
  f.strokeStyle = '#202018'; f.lineWidth = 2;
  f.beginPath(); f.arc(bcx, bcy, br, 0, Math.PI * 2); f.stroke();
  f.fillStyle = '#ffffff';
  f.beginPath(); f.arc(bcx, bcy, br * 0.3, 0, Math.PI * 2); f.fill(); f.stroke();
  for (const x of [bx0 + 10, bx1 - 10]) {
    f.fillStyle = L('#c8e8a8');
    f.beginPath(); f.arc(x, bcy, 2.2, 0, Math.PI * 2); f.fill();
  }
  // the thatch
  const ry = by - 4, rh = 24, rw = (bx1 - bx0) / 2 + 14;
  const roof = new Path2D();
  roof.moveTo(cx - rw, ry); roof.quadraticCurveTo(cx - rw * 0.55, ry - rh * 0.55, cx - rw * 0.12, ry - rh);
  roof.lineTo(cx + rw * 0.12, ry - rh); roof.quadraticCurveTo(cx + rw * 0.55, ry - rh * 0.55, cx + rw, ry);
  roof.quadraticCurveTo(cx, ry + 5, cx - rw, ry);
  f.fillStyle = 'rgba(0, 0, 0, 0.22)';
  f.fillRect(bx0, by, bx1 - bx0, 4);
  const tg = f.createLinearGradient(cx - rw, 0, cx + rw, 0);
  tg.addColorStop(0, L('#f4cc78')); tg.addColorStop(0.45, L('#d09848')); tg.addColorStop(1, L('#8a5a28'));
  f.fillStyle = tg;
  f.fill(roof);
  f.save();
  f.clip(roof);
  f.strokeStyle = rgba(L('#7a4a20'), 0.45);
  f.lineWidth = 1;
  for (let x = cx - rw; x < cx + rw; x += 5) { f.beginPath(); f.moveTo(x + (x - cx) * 0.1, ry - rh); f.lineTo(x + (x - cx) * 0.25, ry + 4); f.stroke(); }
  f.restore();
  f.strokeStyle = rgba(L('#5a3818'), 0.8);
  f.lineWidth = 1.5;
  f.stroke(roof);
  // lanterns on the posts once the light goes
  const lamps = time === 'day' ? [] : [[gl, G - gh + 28], [gr, G - gh + 28]];
  for (const [lx, ly] of lamps) {
    f.fillStyle = '#3a2410';
    f.fillRect(lx - 4, ly - 7, 8, 3);
    f.fillStyle = vgrad(f, ly - 4, ly + 6, ['#fff4c0', '#f8c050']);
    f.beginPath(); f.roundRect(lx - 4.5, ly - 4, 9, 10, 3); f.fill();
  }

  // the grass lip, then dark soil under the lobby's buttons
  f.fillStyle = vgrad(f, G, H, [L('#6abc4c'), L('#2c4a24'), '#121a10', '#0c120a']);
  f.fillRect(0, G, W, H - G);
  f.save();
  f.globalAlpha = 0.9;
  f.fillStyle = vgrad(f, G, G + 14, [L('#e0c488'), rgba(L('#c8a468'), 0)]);
  f.beginPath(); f.moveTo(cx - gw * 0.32 - 10, G); f.lineTo(cx + gw * 0.32 + 10, G); f.lineTo(cx + gw * 0.36, G + 14); f.lineTo(cx - gw * 0.36, G + 14); f.fill();
  f.restore();

  const tufts = [];
  for (let x = 2; x < W - 2; x += 5 + hash(x) * 7) {
    if (x > gl - 14 && x < gr + 14) continue;
    tufts.push([x, 8 + hash(x * 1.7) * 12, hash(x * 5.1) * 6.28]);
  }
  const stars = night || time === 'dawn' ? Array.from({ length: Math.round(W * Hz / (night ? 900 : 3000)) }, (_, i) => ({
    x: hash(i * 3.1) * W, y: hash(i * 7.7 + 1) * (Hz - 30), r: 0.5 + hash(i * 1.3) * 0.9, ph: hash(i + 0.5) * 6.3, big: hash(i * 1.9) < 0.07,
  })).filter(st => Math.hypot(st.x - sx, st.y - sy) > sr + 8) : [];
  const clouds = Array.from({ length: Math.max(2, Math.round(W / 130)) }, (_, i) => ({
    x: hash(i * 5.3) * (W + 160), y: 16 + hash(i * 2.7) * Math.max(10, Hz - mtn - 34), r: 9 + hash(i * 9.1) * 10, v: 3 + hash(i) * 4,
  }));
  const bugs = Array.from({ length: 3 + Math.round(W / 70) }, (_, i) => ({ x: hash(i * 8.3) * W, y: Hz + 10 + hash(i * 3.9) * (G - Hz - 24), ph: hash(i) * 50, c: i % 2 ? '#ffffff' : '#f8e070' }));
  return { W, dpr, back, front, G, time, tufts, stars, clouds, bugs, lamps, tint: CLOUD[time], blade: [L('#8ad868'), L('#4e9e3c'), L('#2e6e2c')] };
}

function paint(ctx, s, t) {
  const { W, dpr, back, front, G, time, tufts, stars, clouds, bugs, lamps, tint, blade } = s;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(back, 0, 0);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  for (const st of stars) {
    const a = 0.4 + 0.6 * Math.max(0, Math.sin(t * 1.6 + st.ph));
    ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
    ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2); ctx.fill();
    if (st.big) sparkle(ctx, st.x, st.y, (3 + 4 * a) * st.r, `rgba(200, 220, 255, ${a * 0.8})`);
  }
  for (const c of clouds) puff(ctx, ((c.x + t * c.v) % (W + 160)) - 80, c.y, c.r, tint, time === 'night' ? 0.8 : 0.92);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(front, 0, 0);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  for (const [i, [x, y]] of lamps.entries()) glow(ctx, x, y + 1, 26 + 3 * Math.sin(t * 7 + i * 2), '#ffc860', 0.5);
  // butterflies by day, fireflies after dark, over the meadow
  const day = time === 'day' || time === 'dawn';
  for (const [i, b] of bugs.entries()) {
    const x = b.x + Math.sin(t * 0.5 + b.ph) * 40, y = b.y + Math.sin(t * 1.3 + b.ph) * 5;
    if (day) {
      const flap = Math.abs(Math.sin(t * 12 + i));
      ctx.fillStyle = b.c;
      for (const side of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + side * 2 * flap, y - 1, 2.4 * flap + 0.4, 2, side * 0.5, 0, Math.PI * 2); ctx.fill(); }
    } else {
      const on = Math.max(0, Math.sin(t * 1.8 + b.ph));
      if (on > 0.05) { glow(ctx, x, y, 9, '#d8f860', on * 0.6); ctx.fillStyle = `rgba(240, 255, 170, ${on})`; ctx.beginPath(); ctx.arc(x, y, 1.3, 0, Math.PI * 2); ctx.fill(); }
    }
  }
  // the tall grass along the fence, swaying
  ctx.lineCap = 'round';
  for (const [x, h, ph] of tufts) {
    const lean = Math.sin(t * 1.8 + ph) * 2.5;
    for (const [k, dx, c] of [[1, -2, 2], [0.8, 2, 1], [0.6, 0, 0]]) {
      ctx.strokeStyle = blade[c];
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x + dx, G + 3); ctx.quadraticCurveTo(x + dx, G - h * k * 0.6, x + dx + lean * k + dx, G - h * k); ctx.stroke();
    }
  }
}
