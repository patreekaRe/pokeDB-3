/* ============================================================
   select-sky.js  -  the character select's window (js/select.js),
   painted smooth at the screen's resolution like the Sky Pillar's and
   the Safari's lobbies (the user's call, 2026-10-07): the picked type's
   scene from js/scene.js's TYPE_ART, redrawn in gradients and soft
   shapes, lit for the player's time of day. Fire a red-rock canyon round
   a campfire, Water a seaside with a lighthouse, Grass a jungle under
   giant trunks, Psychic a violet plateau under the stars. The pixel
   scene still shows round the device on wide screens.
   ============================================================ */

import { hash } from './tower-art.js';
import { timeOfDay, GRADES, gradeHex } from './daytime.js';
import { rgba, layer, fitCanvas, puff, glow, vgrad, sparkle, animate, halt } from './smooth-paint.js';

let sky = null, want = 'grass', watching = false;

/** Shows `type`'s scene in the select's window, repainting only when the type, hour or size changed. */
export function selectSky(type) {
  want = SCENES[type] ? type : 'grass';
  const stage = document.querySelector('.sel-stage');
  if (!watching) {
    watching = true;
    new ResizeObserver(() => { if (!document.getElementById('start-screen').hidden) draw(stage); }).observe(stage);
  }
  const time = timeOfDay();
  if (sky?.raf && sky.type === want && sky.time === time && sky.W === stage.clientWidth && sky.H === stage.clientHeight) return;
  draw(stage);
}

function draw(stage) {
  halt(sky);
  const W = stage.clientWidth, H = stage.clientHeight, time = timeOfDay();
  if (!W || !H) return;
  const canvas = document.getElementById('sel-sky');
  const dpr = fitCanvas(canvas, W, H);
  const scene = SCENES[want];
  const graded = scene.grade.includes(time);
  const [back, b] = layer(W, H, dpr);
  const [front, f] = layer(W, H, dpr);
  const s = { type: want, time, W, H, cx: W / 2, Hz: Math.round(H * 0.6), dpr, raf: 0, L: (h) => graded ? gradeHex(h, GRADES[time].land) : h };
  b.fillStyle = vgrad(b, 0, s.Hz, scene.sky[time]);
  b.fillRect(0, 0, W, s.Hz + 4);
  scene.build(s, b, f);
  sky = s;
  const ctx = canvas.getContext('2d');
  animate(s, (t) => {
    if (document.getElementById('start-screen').hidden) return halt(s);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(back, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scene.mid?.(ctx, s, t);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(front, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scene.over?.(ctx, s, t);
  });
}

/* ---------- shared pieces ---------- */

function sun(b, x, y, r, [hot, rim], a) {
  glow(b, x, y, r * 5, hot, a);
  const g = b.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
  g.addColorStop(0, '#fffef0'); g.addColorStop(1, rim);
  b.fillStyle = g;
  b.beginPath(); b.arc(x, y, r, 0, Math.PI * 2); b.fill();
}

function moon(b, x, y, r) {
  glow(b, x, y, r * 4, '#c8d4ff', 0.2);
  b.fillStyle = '#eceadc';
  b.beginPath(); b.arc(x, y, r, 0, Math.PI * 2); b.fill();
  b.fillStyle = 'rgba(150, 150, 130, 0.35)';
  for (const [dx, dy, k] of [[-0.3, -0.2, 0.24], [0.35, 0.3, 0.16], [-0.1, 0.45, 0.12]]) { b.beginPath(); b.arc(x + dx * r, y + dy * r, k * r, 0, Math.PI * 2); b.fill(); }
}

const starsFor = (W, maxY, per, seed = 0) => Array.from({ length: Math.round(W * maxY / per) }, (_, i) => ({
  x: hash(i * 3.1 + seed) * W, y: hash(i * 7.7 + 1 + seed) * maxY, r: 0.5 + hash(i * 1.3) * 0.9, ph: hash(i + 0.5) * 6.3, big: hash(i * 1.9) < 0.07,
}));

function twinkle(ctx, stars, t) {
  for (const st of stars) {
    const a = 0.4 + 0.6 * Math.max(0, Math.sin(t * 1.6 + st.ph));
    ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
    ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2); ctx.fill();
    if (st.big) sparkle(ctx, st.x, st.y, (3 + 4 * a) * st.r, `rgba(210, 220, 255, ${a * 0.8})`);
  }
}

const flock = (s, n) => Array.from({ length: n }, (_, i) => ({ x: hash(i * 4.1) * s.W, y: s.H * (0.08 + hash(i * 2.3) * 0.22), v: 9 + hash(i) * 8, ph: hash(i * 7) * 6 }));

function birds(ctx, list, t, W, colour) {
  ctx.strokeStyle = colour;
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  for (const bd of list) {
    const x = ((bd.x + t * bd.v) % (W + 40)) - 20, y = bd.y + Math.sin(t * 0.8 + bd.ph) * 4, w = Math.sin(t * 6 + bd.ph) * 3;
    ctx.beginPath();
    ctx.moveTo(x - 6, y - w); ctx.quadraticCurveTo(x - 3, y - 2 - w, x, y);
    ctx.quadraticCurveTo(x + 3, y - 2 - w, x + 6, y - w);
    ctx.stroke();
  }
}

/** A soft drop shadow on the ground. */
function shadow(f, x, y, rx, ry, a = 0.25) {
  f.fillStyle = `rgba(0, 0, 0, ${a})`;
  f.beginPath(); f.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); f.fill();
}

/** A rounded boulder lit from the top left. */
function boulder(f, x, y, rx, ry, [lit, dark]) {
  shadow(f, x + rx * 0.2, y + ry * 0.15, rx * 1.1, ry * 0.35);
  const g = f.createRadialGradient(x - rx * 0.4, y - ry * 0.6, 0, x, y - ry * 0.2, rx * 1.2);
  g.addColorStop(0, lit); g.addColorStop(1, dark);
  f.fillStyle = g;
  f.beginPath(); f.ellipse(x, y - ry * 0.4, rx, ry, 0, Math.PI, 0); f.lineTo(x + rx, y); f.quadraticCurveTo(x, y + ry * 0.25, x - rx, y); f.fill();
}

/* ---------- Fire: a red-rock canyon at sunset, a campfire throwing sparks ---------- */

function mesa(f, x0, x1, top, base, [lit, mid, dark], strata) {
  const w = x1 - x0, cap = top + Math.min(12, (base - top) * 0.14);
  const p = new Path2D();
  p.moveTo(x0, base); p.lineTo(x0 + w * 0.07, cap + (base - cap) * 0.4); p.lineTo(x0 + w * 0.12, cap); p.lineTo(x0 + w * 0.15, top);
  p.lineTo(x1 - w * 0.15, top); p.lineTo(x1 - w * 0.12, cap); p.lineTo(x1 - w * 0.07, cap + (base - cap) * 0.4); p.lineTo(x1, base); p.closePath();
  const g = f.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, lit); g.addColorStop(0.55, mid); g.addColorStop(1, dark);
  f.fillStyle = g;
  f.fill(p);
  if (!strata) return;
  f.save();
  f.clip(p);
  for (let y = top + 6; y < base; y += 7 + hash(y) * 7) { f.fillStyle = 'rgba(90, 24, 12, 0.14)'; f.fillRect(x0, y, w, 1.5 + hash(y * 1.3) * 2.5); }
  f.fillStyle = 'rgba(40, 10, 24, 0.22)';
  f.beginPath(); f.moveTo(x1 - w * 0.3, top); f.lineTo(x1, top); f.lineTo(x1, base); f.lineTo(x1 - w * 0.2, base); f.fill();
  f.fillStyle = 'rgba(255, 220, 160, 0.35)';
  f.fillRect(x0 + w * 0.15, top, w * 0.7, 2);
  f.restore();
}

function cactus(f, x, base, h, L) {
  const w = Math.max(5, h * 0.15);
  shadow(f, x + w, base, w * 2.2, w * 0.45);
  f.lineCap = 'round';
  f.lineJoin = 'round';
  for (const [col, k, dx] of [[L('#2e4a22'), 1, 0], [L('#4e7232'), 0.68, -0.1], [L('#86a85a'), 0.2, -0.26]]) {
    f.strokeStyle = col;
    f.lineWidth = w * k;
    f.beginPath(); f.moveTo(x + dx * w, base); f.lineTo(x + dx * w, base - h + w / 2); f.stroke();
    f.lineWidth = w * k * 0.72;
    f.beginPath();
    for (const [side, at, len] of [[-1, 0.42, 0.3], [1, 0.58, 0.22]]) {
      const y = base - h * at, ax = x + side * w * 1.3 + dx * w;
      f.moveTo(x + dx * w, y); f.quadraticCurveTo(ax, y, ax, y - w * 0.8); f.lineTo(ax, y - h * len);
    }
    f.stroke();
  }
}

/* ---------- Grass: a jungle of giant trunks, vines and light through the canopy ---------- */

function trunk(f, x, w, base, L, hazed = 0) {
  const p = new Path2D();
  p.moveTo(x - w / 2, -4); p.lineTo(x - w / 2, base - w * 0.7);
  p.quadraticCurveTo(x - w / 2, base - w * 0.1, x - w * 1.25, base); p.lineTo(x + w * 1.25, base);
  p.quadraticCurveTo(x + w / 2, base - w * 0.1, x + w / 2, base - w * 0.7); p.lineTo(x + w / 2, -4); p.closePath();
  const g = f.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  g.addColorStop(0, L('#9a8a5a')); g.addColorStop(0.4, L('#64543a')); g.addColorStop(1, L('#2e2418'));
  f.fillStyle = g;
  f.fill(p);
  f.save();
  f.clip(p);
  f.lineWidth = 1.4;
  for (let i = 0; i < w / 4; i++) {
    const bx = x - w / 2 + hash(i * 2.7 + x) * w;
    f.strokeStyle = 'rgba(30, 20, 10, 0.25)';
    f.beginPath(); f.moveTo(bx, -4);
    for (let y = 0; y < base; y += 20) f.lineTo(bx + Math.sin(y * 0.05 + i) * 1.6, y);
    f.stroke();
  }
  for (let i = 0; i < 5; i++) {
    f.fillStyle = rgba(L('#5a9a3a'), 0.5);
    f.beginPath(); f.ellipse(x - w * 0.3 + hash(i + x) * w * 0.5, base * (0.3 + hash(i * 3 + x) * 0.6), w * 0.18, w * 0.3, 0, 0, Math.PI * 2); f.fill();
  }
  if (hazed) { f.fillStyle = rgba(L('#a8c8a0'), hazed); f.fillRect(x - w * 1.3, -4, w * 2.6, base + 8); }
  f.restore();
}

function fern(f, x, y, dir, size, L) {
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + dir * (0.25 + i * 0.28), len = size * (1 - i * 0.1);
    const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len * 0.8;
    const mx = x + Math.cos(a - dir * 0.3) * len * 0.5, my = y + Math.sin(a - dir * 0.3) * len * 0.6;
    f.strokeStyle = L('#2e5a22');
    f.lineWidth = 1.5;
    f.beginPath(); f.moveTo(x, y); f.quadraticCurveTo(mx, my, ex, ey); f.stroke();
    for (let k = 0.15; k < 1; k += 0.11) {
      const px = (1 - k) * (1 - k) * x + 2 * (1 - k) * k * mx + k * k * ex, py = (1 - k) * (1 - k) * y + 2 * (1 - k) * k * my + k * k * ey;
      const r = size * 0.09 * (1 - k * 0.7);
      f.fillStyle = L(k < 0.5 ? '#3e7a2e' : '#5a9a3c');
      for (const side of [-1, 1]) { f.beginPath(); f.ellipse(px + side * r * 0.6, py + r * 0.3, r, r * 0.38, a + side * 1.1, 0, Math.PI * 2); f.fill(); }
    }
  }
}

/* ---------- Psychic: a violet plateau under the stars, crystals floating ---------- */

function prism(f, x, base, w, h, [lit, dark], a = 1) {
  f.globalAlpha = a;
  f.fillStyle = lit;
  f.beginPath(); f.moveTo(x - w, base); f.lineTo(x - w * 0.8, base - h * 0.75); f.lineTo(x, base - h); f.lineTo(x, base); f.fill();
  f.fillStyle = dark;
  f.beginPath(); f.moveTo(x, base); f.lineTo(x, base - h); f.lineTo(x + w * 0.8, base - h * 0.75); f.lineTo(x + w, base); f.fill();
  f.fillStyle = 'rgba(255, 255, 255, 0.45)';
  f.beginPath(); f.moveTo(x - w * 0.55, base - h * 0.2); f.lineTo(x - w * 0.45, base - h * 0.7); f.lineTo(x - w * 0.3, base - h * 0.72); f.lineTo(x - w * 0.4, base - h * 0.22); f.fill();
  f.globalAlpha = 1;
}

/* ---------- the scenes ---------- */

const SCENES = {
  fire: {
    grade: ['night'],
    sky: {
      dusk: ['#2a1a4a', '#743062', '#d65a4c', '#f8a850', '#f8c868'],
      dawn: ['#3a3468', '#865486', '#e08a84', '#f8c8a0', '#f8dcb8'],
      day: ['#3a7ad8', '#68a4e8', '#a0caf0', '#d8e4e0', '#ece8d0'],
      night: ['#0a0a22', '#18163a', '#2e2450', '#48345e', '#583c62'],
    },
    build(s, b, f) {
      const { W, H, Hz, L, time } = s;
      if (time === 'night') moon(b, W * 0.74, H * 0.15, 10);
      else if (time === 'day') sun(b, W * 0.78, H * 0.13, 13, ['#fff6b0', '#ffe878'], 0.35);
      else sun(b, W * (time === 'dawn' ? 0.36 : 0.6), Hz - H * 0.09, 22, ['#ffb060', time === 'dawn' ? '#ffc070' : '#ff7838'], 0.6);
      for (const [x0, x1, h] of [[-0.05, 0.22, 0.1], [0.3, 0.5, 0.15], [0.56, 0.7, 0.08], [0.8, 1.06, 0.13]]) {
        mesa(f, x0 * W, x1 * W, Hz - h * H, Hz + 1, [L('#a05a78'), L('#8a4a6a'), L('#6a3a5a')], false);
      }
      const horizon = this.sky[time].at(-1);
      f.fillStyle = vgrad(f, Hz - H * 0.12, Hz + 2, [rgba(horizon, 0), rgba(horizon, 0.5)]);
      f.fillRect(0, Hz - H * 0.12, W, H * 0.12 + 2);
      mesa(f, -0.1 * W, 0.3 * W, Hz - 0.32 * H, Hz + 8, [L('#f09058'), L('#c0603c'), L('#7a3428')], true);
      mesa(f, 0.76 * W, 1.12 * W, Hz - 0.22 * H, Hz + 5, [L('#e88050'), L('#b85a3a'), L('#6a2c24')], true);
      f.fillStyle = vgrad(f, Hz, H, [L('#d47e46'), L('#b26038'), L('#7c3e2a')]);
      f.fillRect(0, Hz, W, H - Hz);
      f.lineCap = 'round';
      for (let i = 0; i < 16; i++) {
        const y = Hz + 8 + hash(i * 5.3) * (H - Hz - 14), k = (y - Hz) / (H - Hz);
        let x = hash(i * 2.1) * W;
        f.strokeStyle = rgba(L('#5a2a1a'), 0.35);
        f.lineWidth = 0.6 + k;
        f.beginPath(); f.moveTo(x, y);
        for (let j = 0; j < 3; j++) { x += (6 + hash(i * 9 + j) * 10) * (0.5 + k); f.lineTo(x, y + (hash(i + j * 3) - 0.5) * 4 * k); }
        f.stroke();
      }
      for (let i = 0; i < 22; i++) {
        const y = Hz + 4 + hash(i * 3.3) * (H - Hz - 6), k = (y - Hz) / (H - Hz);
        boulder(f, hash(i * 6.7) * W, y, 1.5 + k * 4, 1 + k * 2.6, [L('#d88a58'), L('#6a3424')]);
      }
      cactus(f, W * 0.12, H - 2, H * 0.36, L);
      cactus(f, W * 0.64, Hz + 16, Math.max(22, H * 0.09), L);
      const fx = W * 0.83, fy = H - Math.max(14, H * 0.06);
      s.fire = [fx, fy];
      shadow(f, fx, fy + 2, 26, 6, 0.3);
      f.lineCap = 'round';
      for (const [a, c] of [[0.35, L('#5a3a20')], [-0.35, L('#8a5a34')]]) {
        f.strokeStyle = c; f.lineWidth = 6;
        f.beginPath(); f.moveTo(fx - Math.cos(a) * 16, fy + Math.sin(a) * 4); f.lineTo(fx + Math.cos(a) * 16, fy - Math.sin(a) * 4); f.stroke();
      }
      for (let i = 0; i < 8; i++) {
        const a = Math.PI * (0.05 + i / 7 * 0.9);
        boulder(f, fx + Math.cos(a) * 22 * (i % 2 ? 1 : -1) * (i < 4 ? 1 : 0.8), fy + 2 + Math.sin(a) * 4, 4.5, 3.5, [L('#b0a098'), L('#48403c')]);
      }
      s.stars = time === 'night' ? starsFor(W, Hz - 30, 700) : [];
      s.flock = time === 'night' ? [] : flock(s, 3);
    },
    mid(ctx, s, t) {
      twinkle(ctx, s.stars, t);
      birds(ctx, s.flock, t, s.W, s.time === 'day' ? '#3a2a40' : '#3a1e30');
    },
    over(ctx, s, t) {
      const [fx, fy] = s.fire;
      glow(ctx, fx, fy - 10, 70 + 8 * Math.sin(t * 9), '#ff9040', s.time === 'day' ? 0.25 : 0.5);
      for (const [c, k, ph] of [['#e05a20', 1, 0], ['#f8a030', 0.76, 1.3], ['#f8e060', 0.5, 2.1], ['#fffce0', 0.26, 3]]) {
        const h = 30 * k * (1 + 0.16 * Math.sin(t * 11 + ph)), w = 12 * k, sway = Math.sin(t * 7 + ph) * 3 * k;
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.moveTo(fx - w, fy); ctx.quadraticCurveTo(fx - w * 1.15, fy - h * 0.5, fx + sway, fy - h);
        ctx.quadraticCurveTo(fx + w * 1.15, fy - h * 0.5, fx + w, fy); ctx.closePath(); ctx.fill();
      }
      for (let i = 0; i < 9; i++) {
        const life = (t * 0.55 + i / 9) % 1;
        const x = fx + Math.sin(i * 2.3 + t * 2) * 10 * life + (hash(i) - 0.5) * 10, y = fy - 22 - life * 80;
        ctx.fillStyle = `rgba(255, ${170 + 60 * (1 - life) | 0}, 80, ${1 - life})`;
        ctx.beginPath(); ctx.arc(x, y, 1.6 * (1 - life) + 0.5, 0, Math.PI * 2); ctx.fill();
      }
    },
  },

  water: {
    grade: ['dawn', 'dusk', 'night'],
    sky: {
      day: ['#3a88e0', '#62a8f0', '#98ccf8', '#d8eef8'],
      dawn: ['#34407a', '#86609a', '#e0a0a8', '#f8d4b4'],
      dusk: ['#2c2458', '#7a3a6a', '#d86a60', '#f8a868'],
      night: ['#060c24', '#0e1a3e', '#1a2c58', '#2a4070'],
    },
    build(s, b, f) {
      const { W, H, Hz, L, time } = s;
      const night = time === 'night';
      s.sunX = W * (time === 'dawn' ? 0.3 : 0.72);
      if (night) moon(b, W * 0.72, H * 0.15, 10);
      else if (time === 'day') sun(b, W * 0.76, H * 0.13, 13, ['#fff6b0', '#ffe878'], 0.4);
      else sun(b, s.sunX, Hz - 8, 20, ['#ffc070', time === 'dawn' ? '#ffd090' : '#ff8040'], 0.6);
      const Ys = Hz + (H - Hz) * 0.42;
      s.Ys = Ys;
      f.fillStyle = vgrad(f, Hz, Ys, [L('#86ccee'), L('#48a8e0'), L('#2a7cc0')]);
      f.fillRect(0, Hz, W, Ys - Hz + 1);
      f.fillStyle = rgba(L('#d8f0ff'), 0.5);
      f.fillRect(0, Hz, W, 1.2);
      f.lineCap = 'round';
      for (let i = 0; i < 60; i++) {
        const k = hash(i * 2.9) ** 1.6, y = Hz + 3 + k * (Ys - Hz - 4), x = hash(i * 7.3) * W;
        f.strokeStyle = rgba(L(i % 3 ? '#1e64a8' : '#a8e0f8'), 0.35);
        f.lineWidth = 0.6 + k;
        f.beginPath(); f.moveTo(x, y); f.lineTo(x + 4 + k * 20, y); f.stroke();
      }
      // the island and its lighthouse on the horizon
      const ix = W * 0.17, iw = Math.max(40, W * 0.15);
      f.fillStyle = vgrad(f, Hz - 14, Hz, [L('#7ab890'), L('#3e7a60')]);
      f.beginPath(); f.moveTo(ix - iw, Hz + 1); f.bezierCurveTo(ix - iw * 0.5, Hz - 16, ix + iw * 0.3, Hz - 14, ix + iw, Hz + 1); f.fill();
      const lx = ix + iw * 0.15, ly = Hz - 12, lh = 24;
      f.fillStyle = L('#f8f8f0');
      f.beginPath(); f.moveTo(lx - 3.5, ly); f.lineTo(lx - 2.5, ly - lh); f.lineTo(lx + 2.5, ly - lh); f.lineTo(lx + 3.5, ly); f.fill();
      f.fillStyle = L('#d84830');
      for (const k of [0.25, 0.6]) f.fillRect(lx - 3.5 + k * 1, ly - lh * k - 3, 7 - k * 2, 4);
      f.fillStyle = L('#3a3a40');
      f.fillRect(lx - 3.5, ly - lh - 6, 7, 2);
      f.beginPath(); f.moveTo(lx - 3, ly - lh - 6); f.lineTo(lx, ly - lh - 10); f.lineTo(lx + 3, ly - lh - 6); f.fill();
      f.fillStyle = night || time === 'dusk' ? '#fff0a0' : L('#c8e0f0');
      f.fillRect(lx - 2, ly - lh - 5, 4, 4);
      s.lamp = [lx, ly - lh - 3];
      // the beach, damp where the surf reaches
      f.fillStyle = vgrad(f, Ys, H, [L('#e0c488'), L('#f0dca0'), L('#f8e8b8')]);
      f.fillRect(0, Ys, W, H - Ys);
      f.fillStyle = vgrad(f, Ys, Ys + 28, [rgba(L('#b8a068'), 0.8), rgba(L('#c8b078'), 0)]);
      f.fillRect(0, Ys, W, 28);
      for (let i = 0; i < 30; i++) {
        const y = Ys + 26 + hash(i * 4.4) * (H - Ys - 30), x = hash(i * 1.7) * W;
        if (Math.abs(x - s.cx) < W * 0.2) continue;
        f.fillStyle = rgba(L('#c8a870'), 0.6);
        f.beginPath(); f.arc(x, y, 0.8 + hash(i) * 1.2, 0, Math.PI * 2); f.fill();
      }
      for (const [x, y, c] of [[W * 0.2, H - 16, '#f8c8c8'], [W * 0.3, H - 34, '#f8f0e0'], [W * 0.7, H - 22, '#f8a060']]) {
        f.fillStyle = L(c);
        f.beginPath(); f.moveTo(x - 5, y); f.quadraticCurveTo(x, y - 9, x + 5, y); f.closePath(); f.fill();
        f.strokeStyle = rgba(L('#a07060'), 0.6); f.lineWidth = 0.8;
        for (const dx of [-2.5, 0, 2.5]) { f.beginPath(); f.moveTo(x, y - 1); f.lineTo(x + dx, y - 6); f.stroke(); }
      }
      const rocks = [L('#d0c8b8'), L('#5a544e')];
      boulder(f, W * 0.9, H - 8, Math.max(24, W * 0.08), Math.max(18, W * 0.06), rocks);
      boulder(f, W * 0.8, H - 4, 14, 10, rocks);
      boulder(f, W * 0.97, Ys + 14, 16, 12, rocks);
      s.clouds = night ? [] : Array.from({ length: Math.max(2, Math.round(W / 140)) }, (_, i) => ({
        x: hash(i * 5.3) * (W + 160), y: 18 + hash(i * 2.7) * Math.max(10, Hz * 0.45), r: 10 + hash(i * 9.1) * 10, v: 3 + hash(i) * 4,
      }));
      s.tint = time === 'day' ? ['#ffffff', '#d8e4f2'] : time === 'dawn' ? ['#fbe4d8', '#c890a0'] : ['#f8d0b8', '#a06078'];
      s.stars = night ? starsFor(W, Hz - 20, 700) : [];
      s.flock = night ? [] : flock(s, 3);
      s.glints = Array.from({ length: 30 }, (_, i) => ({ x: hash(i * 3.7) * W, y: Hz + 2 + hash(i * 5.9) ** 1.4 * (Ys - Hz - 4), ph: hash(i) * 6.3 }));
    },
    mid(ctx, s, t) {
      twinkle(ctx, s.stars, t);
      for (const c of s.clouds) puff(ctx, ((c.x + t * c.v) % (s.W + 160)) - 80, c.y, c.r, s.tint, 0.92);
    },
    over(ctx, s, t) {
      const { W, Hz, Ys, time } = s;
      const night = time === 'night';
      for (const g of s.glints) {
        const a = Math.max(0, Math.sin(t * 2.4 + g.ph));
        if (a < 0.2) continue;
        const near = night ? 0 : Math.max(0, 1 - Math.abs(g.x - (time === 'day' ? W * 0.76 : s.sunX)) / (W * 0.2));
        ctx.fillStyle = `rgba(255, ${night ? 240 : 250}, ${night ? 200 : 230}, ${a * (0.35 + near * 0.6)})`;
        ctx.fillRect(g.x, g.y, 3 + (g.y - Hz) * 0.12, 1.2);
      }
      // a sail far out
      const bx = ((W * 0.5 + t * 3) % (W + 40)) - 20, by = Hz - 1;
      ctx.fillStyle = '#6a4a30';
      ctx.beginPath(); ctx.moveTo(bx - 7, by - 2); ctx.lineTo(bx + 7, by - 2); ctx.lineTo(bx + 5, by + 1); ctx.lineTo(bx - 5, by + 1); ctx.fill();
      ctx.fillStyle = night ? '#a8b0c8' : '#ffffff';
      ctx.beginPath(); ctx.moveTo(bx, by - 3); ctx.lineTo(bx, by - 16); ctx.lineTo(bx + 7, by - 3); ctx.fill();
      ctx.fillStyle = night ? '#8890a8' : '#dce6f0';
      ctx.beginPath(); ctx.moveTo(bx - 1, by - 3); ctx.lineTo(bx - 1, by - 12); ctx.lineTo(bx - 6, by - 3); ctx.fill();
      if (night || time === 'dusk') glow(ctx, ...s.lamp, 18 + 4 * Math.sin(t * 3), '#fff0a0', 0.7);
      // the surf running up the sand and back
      const reach = 10 + 9 * Math.sin(t * 0.7);
      const edge = (x) => Ys + reach + 2.5 * Math.sin(x * 0.045 + t * 1.4) + 1.5 * Math.sin(x * 0.11 - t);
      ctx.beginPath(); ctx.moveTo(0, Ys - 1);
      for (let x = 0; x <= W + 6; x += 6) ctx.lineTo(x, edge(x));
      ctx.lineTo(W, Ys - 1); ctx.closePath();
      ctx.fillStyle = vgrad(ctx, Ys - 2, Ys + 22, [rgba(s.L('#2e88cc'), 0.9), rgba(s.L('#7cd0f0'), 0.45)]);
      ctx.fill();
      ctx.lineCap = 'round';
      for (const [dy, a, w] of [[0, 0.95, 3], [-6 - 2 * Math.sin(t * 0.7 + 1), 0.45, 1.6]]) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${a})`;
        ctx.lineWidth = w;
        ctx.beginPath();
        for (let x = 0; x <= W + 6; x += 6) ctx[x ? 'lineTo' : 'moveTo'](x, edge(x) + dy);
        ctx.stroke();
      }
      birds(ctx, s.flock, t, W, '#ffffff');
    },
  },

  grass: {
    grade: ['dawn', 'dusk', 'night'],
    sky: {
      day: ['#a8dcb0', '#d0f0c0', '#f0f8d8'],
      dawn: ['#b090a8', '#f0c0a8', '#f8e0c0'],
      dusk: ['#6a4870', '#d08868', '#f8b878'],
      night: ['#08141e', '#10283a', '#1c3c44'],
    },
    build(s, b, f) {
      const { W, H, Hz, L, time, cx } = s;
      const horizon = this.sky[time].at(-1);
      // far trunks fading into the haze, then the undergrowth along the horizon
      for (let i = 0; i < 9; i++) {
        const x = hash(i * 3.3) * W, w = 6 + hash(i * 1.7) * 12;
        b.fillStyle = rgba(L('#6a8a64'), 0.35 + hash(i) * 0.25);
        b.fillRect(x - w / 2, 0, w, Hz + 4);
      }
      b.fillStyle = vgrad(b, Hz * 0.4, Hz, [rgba(horizon, 0), rgba(horizon, 0.6)]);
      b.fillRect(0, Hz * 0.4, W, Hz * 0.6 + 4);
      trunk(f, W * 0.64, Math.max(10, W * 0.05), Hz + 6, L, 0.35);
      trunk(f, W * 0.34, Math.max(8, W * 0.035), Hz + 4, L, 0.45);
      for (let i = 0; i < W / 7; i++) {
        const x = hash(i * 2.1) * W, r = 8 + hash(i * 4.3) * 12;
        const g = f.createRadialGradient(x - r * 0.3, Hz - r * 0.5, 0, x, Hz - r * 0.2, r * 1.2);
        g.addColorStop(0, L('#6aa84a')); g.addColorStop(1, L('#2e5a26'));
        f.fillStyle = g;
        f.beginPath(); f.ellipse(x, Hz - r * 0.2 + 3, r, r * 0.75, 0, 0, Math.PI * 2); f.fill();
      }
      f.fillStyle = vgrad(f, Hz, H, [L('#4e7c34'), L('#3a6428'), L('#22401a')]);
      f.fillRect(0, Hz + 2, W, H - Hz);
      for (let i = 0; i < 40; i++) {
        const y = Hz + 6 + hash(i * 5.1) * (H - Hz - 8), k = (y - Hz) / (H - Hz);
        f.fillStyle = rgba(L(i % 2 ? '#6a8a3a' : '#a07a40'), 0.55);
        f.beginPath(); f.ellipse(hash(i * 3.9) * W, y, 1.5 + k * 3.5, 0.8 + k * 1.6, hash(i) * 3, 0, Math.PI * 2); f.fill();
      }
      if (time !== 'night') {
        const g = f.createRadialGradient(cx, H - 12, 0, cx, H - 12, W * 0.36);
        g.addColorStop(0, rgba(L('#e0f080'), 0.4)); g.addColorStop(1, rgba(L('#e0f080'), 0));
        f.fillStyle = g;
        f.beginPath(); f.ellipse(cx, H - 12, W * 0.36, (H - Hz) * 0.4, 0, 0, Math.PI * 2); f.fill();
      }
      trunk(f, W * 0.08, Math.max(30, W * 0.15), H - (H - Hz) * 0.25, L);
      trunk(f, W * 0.93, Math.max(36, W * 0.19), H - (H - Hz) * 0.35, L);
      // the canopy overhead, dark against the light
      for (let x = -20; x < W + 30; x += 16) {
        const r = 18 + hash(x * 0.7) * 20, y = hash(x * 1.3) * H * 0.06;
        const g = f.createRadialGradient(x, y + r * 0.6, 0, x, y, r * 1.2);
        g.addColorStop(0, L('#3e7a32')); g.addColorStop(1, L('#163418'));
        f.fillStyle = g;
        f.beginPath(); f.ellipse(x, y, r * 1.2, r, 0, 0, Math.PI * 2); f.fill();
      }
      fern(f, -4, H + 2, 1, Math.max(50, H * 0.24), L);
      fern(f, W + 4, H + 2, -1, Math.max(56, H * 0.27), L);
      s.vines = Array.from({ length: 6 }, (_, i) => ({ x: W * (0.04 + i * 0.18 + hash(i) * 0.08), len: Hz * (0.3 + hash(i * 3.1) * 0.5), ph: hash(i * 5) * 6 }));
      s.shafts = time === 'night' ? [] : [[0.3, 22], [0.55, 34], [0.8, 18]].map(([x, w], i) => ({ x: x * W, w, ph: i * 2.1 }));
      s.motes = Array.from({ length: 22 }, (_, i) => ({ x: hash(i * 6.1) * W, y: H * (0.15 + hash(i * 2.2) * 0.75), ph: hash(i) * 50 }));
      s.vine = [L('#2e5a22'), L('#5a9a3c')];
    },
    over(ctx, s, t) {
      const { W, H, time } = s;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const sh of s.shafts) {
        const a = (time === 'day' ? 0.2 : 0.14) * (0.7 + 0.3 * Math.sin(t * 0.6 + sh.ph)), lean = H * 0.32;
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, `rgba(255, 248, 190, ${a})`); g.addColorStop(1, 'rgba(255, 248, 190, 0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(sh.x - sh.w / 2, 0); ctx.lineTo(sh.x + sh.w / 2, 0); ctx.lineTo(sh.x + sh.w - lean, H); ctx.lineTo(sh.x - sh.w - lean, H); ctx.fill();
      }
      ctx.restore();
      ctx.lineCap = 'round';
      for (const v of s.vines) {
        const sway = Math.sin(t * 0.8 + v.ph) * 6, ex = v.x + sway, ey = v.len;
        ctx.strokeStyle = s.vine[0];
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(v.x, 0); ctx.quadraticCurveTo(v.x + sway * 0.2, ey * 0.5, ex, ey); ctx.stroke();
        ctx.fillStyle = s.vine[1];
        for (let k = 0.2, side = 1; k <= 1; k += 0.16, side = -side) {
          const x = v.x + sway * k * k, y = ey * k;
          ctx.beginPath(); ctx.ellipse(x + side * 3, y, 3.4, 1.6, side * 0.6, 0, Math.PI * 2); ctx.fill();
        }
      }
      for (const m of s.motes) {
        const x = m.x + Math.sin((t + m.ph) * 0.4) * 16, y = m.y + Math.sin((t + m.ph) * 0.7) * 6 - ((t * 4 + m.ph * 10) % 30);
        if (time === 'night') {
          const on = Math.max(0, Math.sin(t * 1.8 + m.ph));
          if (on > 0.05) { glow(ctx, x, y, 9, '#d8f860', on * 0.6); ctx.fillStyle = `rgba(240, 255, 170, ${on})`; ctx.beginPath(); ctx.arc(x, y, 1.3, 0, Math.PI * 2); ctx.fill(); }
        } else {
          ctx.fillStyle = `rgba(255, 250, 200, ${0.4 + 0.4 * Math.sin(t * 2 + m.ph)})`;
          ctx.beginPath(); ctx.arc(x, y, 1.1, 0, Math.PI * 2); ctx.fill();
        }
      }
    },
  },

  psychic: {
    grade: [],
    sky: {
      day: ['#3a2a78', '#6a48b0', '#a878d8', '#e0b0f0'],
      dawn: ['#24164a', '#4a2a7a', '#8a50a8', '#d080c0'],
      dusk: ['#24164a', '#4a2a7a', '#8a50a8', '#d080c0'],
      night: ['#0a0620', '#160c38', '#2a1858', '#4a2a80'],
    },
    build(s, b, f) {
      const { W, H, Hz } = s;
      for (const [x, y, r, c] of [[0.2, 0.25, 0.5, '#c048b0'], [0.8, 0.15, 0.45, '#4878e0'], [0.55, 0.45, 0.4, '#8a48e0']]) {
        const g = b.createRadialGradient(x * W, y * H, 0, x * W, y * H, r * W);
        g.addColorStop(0, rgba(c, 0.28)); g.addColorStop(1, rgba(c, 0));
        b.fillStyle = g;
        b.fillRect(0, 0, W, Hz + 4);
      }
      for (let i = 0; i < 11; i++) {
        const x = hash(i * 3.9) * W, h = 14 + hash(i * 1.3) * Hz * 0.32, w = 4 + hash(i * 2.2) * 8;
        if (Math.abs(x - s.cx) < W * 0.12) continue;
        prism(f, x, Hz + 2, w, h, ['#c8a0f0', '#6a3aa0'], 0.55 + hash(i) * 0.3);
      }
      f.fillStyle = vgrad(f, Hz - Hz * 0.15, Hz + 2, [rgba('#d080c0', 0), rgba('#d080c0', 0.35)]);
      f.fillRect(0, Hz - Hz * 0.15, W, Hz * 0.15 + 2);
      f.fillStyle = vgrad(f, Hz, H, ['#5a3a8a', '#2e1a50', '#160c2a']);
      f.fillRect(0, Hz, W, H - Hz);
      f.fillStyle = 'rgba(230, 200, 255, 0.4)';
      f.fillRect(0, Hz, W, 1.5);
      f.lineCap = 'round';
      for (let i = 0; i < 12; i++) {
        let x = hash(i * 7.1) * W, y = Hz + 6 + hash(i * 2.9) * (H - Hz - 10);
        f.strokeStyle = 'rgba(200, 140, 255, 0.28)';
        f.lineWidth = 1;
        f.beginPath(); f.moveTo(x, y);
        for (let j = 0; j < 4; j++) { x += (hash(i * 3 + j) - 0.5) * 30; y += 2 + hash(i + j) * 5; f.lineTo(x, y); }
        f.stroke();
      }
      for (const [x, dir] of [[W * 0.06, 1], [W * 0.94, -1]]) {
        for (const [dx, w, h] of [[0, 9, 46], [dir * 14, 6, 28], [-dir * 10, 5, 22], [dir * 26, 4, 16]]) prism(f, x + dx, H - 2, w, Math.min(h * H / 260, h * 1.6), ['#e0c0ff', '#7a48b8']);
      }
      s.stars = starsFor(W, Hz - 10, s.time === 'night' ? 420 : 900);
      s.floats = [[0.18, 0.32, 9], [0.82, 0.28, 11], [0.3, 0.12, 6], [0.7, 0.42, 7]].map(([x, y, r], i) => ({ x: x * W, y: y * H, r, ph: i * 1.7 }));
      s.motes = Array.from({ length: 16 }, (_, i) => ({ x: hash(i * 4.4) * W, ph: hash(i * 1.1) }));
    },
    mid(ctx, s, t) {
      const { W, H } = s;
      twinkle(ctx, s.stars, t);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const [k, c] of [[0, '#60e0d0'], [1, '#e070d0']]) {
        const base = H * (0.16 + k * 0.1);
        const g = ctx.createLinearGradient(0, base - 18, 0, base + 30);
        g.addColorStop(0, rgba(c, 0)); g.addColorStop(0.35, rgba(c, 0.22 + 0.08 * Math.sin(t * 0.7 + k))); g.addColorStop(1, rgba(c, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        for (let x = 0; x <= W; x += 8) ctx.lineTo(x, base + Math.sin(x * 0.012 + t * 0.35 + k * 2) * 14);
        for (let x = W; x >= 0; x -= 8) ctx.lineTo(x, base + 30 + Math.sin(x * 0.015 + t * 0.3 + k) * 10);
        ctx.fill();
      }
      ctx.restore();
    },
    over(ctx, s, t) {
      const { W, H, cx } = s;
      const rx = Math.min(W * 0.3, 110), ry = rx * 0.16, ry0 = H - 9, pulse = 0.5 + 0.3 * Math.sin(t * 2);
      glow(ctx, cx, ry0, rx, '#b070ff', 0.25 * pulse);
      ctx.strokeStyle = `rgba(220, 180, 255, ${pulse})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.ellipse(cx, ry0, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(cx, ry0, rx * 0.78, ry * 0.78, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = `rgba(240, 220, 255, ${pulse + 0.2})`;
      for (let i = 0; i < 12; i++) {
        const a = t * 0.4 + i / 12 * Math.PI * 2;
        ctx.beginPath(); ctx.arc(cx + Math.cos(a) * rx * 0.89, ry0 + Math.sin(a) * ry * 0.89, 1.4, 0, Math.PI * 2); ctx.fill();
      }
      for (const c of s.floats) {
        const y = c.y + Math.sin(t * 1.1 + c.ph) * 5;
        glow(ctx, c.x, y - c.r, c.r * 3.5, '#c080ff', 0.35);
        prism(ctx, c.x, y, c.r * 0.6, c.r * 2.2, ['#f0e0ff', '#9060d0']);
        ctx.save(); ctx.translate(c.x, y); ctx.scale(1, -0.5);
        prism(ctx, 0, 0, c.r * 0.6, c.r * 1.4, ['#c8a8f0', '#6a40a8']);
        ctx.restore();
      }
      for (const m of s.motes) {
        const life = (t * 0.12 + m.ph) % 1, x = m.x + Math.sin(life * 6 + m.ph * 9) * 8, y = H - life * H * 0.8;
        ctx.fillStyle = `rgba(220, 180, 255, ${Math.sin(life * Math.PI) * 0.8})`;
        ctx.beginPath(); ctx.arc(x, y, 1.3, 0, Math.PI * 2); ctx.fill();
      }
    },
  },
};
