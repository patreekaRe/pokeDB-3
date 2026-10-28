/* ============================================================
   movefx.js  -  what an attack looks like as it lands, and the rest of a
   fight's smooth effects (the user's ask, 2026-10-28, after the smooth
   card trails): each move's own effect (js/data/move-fx.js: a stream, a
   beam, a bolt, bubbles, blades, a bite...), the hit's light on the foe,
   a shield forming as you block, motes rising as you heal, a status's
   ambience on the foe (embers, seeds, sparks, frost), and a cut-in for
   a big card. All of it draws on js/cardfx.js's one canvas and loop, in
   particle units, so Settings' Pixel look draws it in pixels and Off or
   Battle animations Off skips it. Nothing here is awaited but the cut-in.
   ============================================================ */

import { kit } from './cardfx.js';
import { MOVE_FX, TYPE_FX } from './data/move-fx.js';

const { parts, jobs, PALETTES, rand, rgba, glow, put, sprite, spawn } = kit;
const palOf = (type) => PALETTES[type] || PALETTES.normal;
const U = (px) => px / kit.PX;
const PETALS = ['#fff0f6', '#ffd0e4', '#f490bc', '#d0508c', '#902c5c', '#401020'];
const DARK_EDGE = '#c060ff';

/** The effect an attack plays: its own, else its type's. */
export const fxFor = (card) => MOVE_FX[card.id?.replace(/\+$/, '')] || TYPE_FX[card.type] || 'punch';

function part(o) {
  const p = { age: 0, vx: 0, vy: 0, g: 0, drag: 1, phase: rand(0, 20), life: 30, ...o };
  if (parts.length < kit.MAX_PARTS) parts.push(p);
  kit.start(!!o.ambient);
  return p;
}
/** A drawing run every frame for `ms` (halved at 2x speed); `f` gets the time in and its fraction. */
function job(ms, f, { ambient = false } = {}) {
  const t0 = performance.now();
  jobs.push((now) => {
    const t = now - t0;
    kit.ctx.save();
    const more = f(t, Math.min(1, t / ms), now);
    kit.ctx.restore();
    if (more === false || (ms && t >= ms)) return false;
  });
  kit.start(ambient);
}
const later = (ms, f) => setTimeout(f, ms);
const ease = (t) => 1 - (1 - t) ** 3;

/* ---------- sprites ---------- */

const bubble = () => sprite('bubble', 64, 64, (g) => {
  const grad = g.createRadialGradient(32, 32, 18, 32, 32, 30);
  grad.addColorStop(0, 'rgba(160, 220, 255, 0.08)'); grad.addColorStop(0.8, 'rgba(160, 220, 255, 0.35)'); grad.addColorStop(1, 'rgba(255, 255, 255, 0.9)');
  g.fillStyle = grad; g.beginPath(); g.arc(32, 32, 30, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(255, 255, 255, 0.9)'; g.beginPath(); g.ellipse(22, 20, 7, 4, -0.6, 0, Math.PI * 2); g.fill();
});
const petal = () => sprite('petal', 40, 56, (g) => {
  g.beginPath(); g.moveTo(20, 54); g.bezierCurveTo(-4, 34, 6, 4, 20, 10); g.bezierCurveTo(34, 4, 44, 34, 20, 54);
  const grad = g.createLinearGradient(0, 0, 0, 56);
  grad.addColorStop(0, PETALS[1]); grad.addColorStop(1, PETALS[3]);
  g.fillStyle = grad; g.fill();
});
const rock = (pal, n) => sprite(`rock${pal[3]}${n}`, 64, 64, (g) => {
  g.beginPath();
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2, r = 22 + ((i * 7 + n * 3) % 5) * 2.2;
    g[i ? 'lineTo' : 'moveTo'](32 + Math.cos(a) * r, 32 + Math.sin(a) * r);
  }
  g.closePath();
  const grad = g.createLinearGradient(10, 8, 54, 58);
  grad.addColorStop(0, pal[2]); grad.addColorStop(0.6, pal[3]); grad.addColorStop(1, pal[4]);
  g.fillStyle = grad; g.fill();
  g.strokeStyle = pal[5]; g.lineWidth = 2.5; g.stroke();
});
const crescent = (pal) => sprite(`cres${pal[2]}`, 64, 64, (g) => {
  g.beginPath(); g.arc(32, 32, 28, -2.4, 0.8); g.arc(24, 38, 24, 0.9, -2.3, true); g.closePath();
  const grad = g.createLinearGradient(0, 0, 64, 64);
  grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.5, pal[1]); grad.addColorStop(1, pal[3]);
  g.fillStyle = grad; g.fill();
});
const shard = (pal) => sprite(`shard${pal[2]}`, 24, 64, (g) => {
  g.beginPath(); g.moveTo(12, 0); g.lineTo(22, 40); g.lineTo(12, 64); g.lineTo(2, 40); g.closePath();
  const grad = g.createLinearGradient(2, 0, 22, 0);
  grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.5, pal[2]); grad.addColorStop(1, pal[3]);
  g.fillStyle = grad; g.fill();
  g.strokeStyle = 'rgba(255, 255, 255, 0.8)'; g.lineWidth = 1.5; g.stroke();
});
const cross = (col) => sprite(`cross${col}`, 32, 32, (g) => {
  g.fillStyle = col; g.fillRect(12, 3, 8, 26); g.fillRect(3, 12, 26, 8);
});
const hexes = () => sprite('hex', 128, 128, (g) => {
  g.strokeStyle = 'rgba(255, 255, 255, 0.9)'; g.lineWidth = 2;
  const r = 10, w = r * Math.sqrt(3);
  for (let row = -1; row < 10; row++) for (let col = -1; col < 9; col++) {
    const cx = col * w + (row % 2 ? w / 2 : 0), cy = row * r * 1.5;
    g.beginPath();
    for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + (i * Math.PI) / 3; g[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
    g.closePath(); g.stroke();
  }
});

/** A soft light with no white core, for the glow a hit throws round it. */
const light = (hex) => sprite(`light${hex}`, 64, 64, (g) => {
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, rgba(hex, 1)); grad.addColorStop(0.4, rgba(hex, 0.35)); grad.addColorStop(1, rgba(hex, 0));
  g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
});
const scorch = () => sprite('scorch', 64, 64, (g) => {
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(30, 10, 4, 0.9)'); grad.addColorStop(1, 'rgba(30, 10, 4, 0)');
  g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
});
const hole = () => sprite('hole', 64, 64, (g) => {
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(10, 0, 20, 0.85)'); grad.addColorStop(0.7, 'rgba(40, 0, 60, 0.5)'); grad.addColorStop(1, 'rgba(40, 0, 60, 0)');
  g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
});
/** The shield's bubble, its rim and hexagons painted once; each frame only scales and fades it. */
const shieldBall = () => sprite('shield', 128, 128, (g) => {
  const grad = g.createRadialGradient(64, 64, 35, 64, 64, 64);
  grad.addColorStop(0, 'rgba(120, 200, 255, 0)'); grad.addColorStop(0.85, 'rgba(120, 200, 255, 0.3)'); grad.addColorStop(1, 'rgba(220, 245, 255, 0.7)');
  g.fillStyle = grad; g.beginPath(); g.arc(64, 64, 64, 0, Math.PI * 2); g.fill();
  g.save(); g.clip(); g.globalAlpha = 0.28; g.drawImage(hexes(), 0, 0, 128, 128); g.restore();
});

/* ---------- particles drawn by their own hand ---------- */

const fadeOf = (f, from = 0.6) => (f < from ? 1 : 1 - (f - from) / (1 - from));
function drawGlow(p, f) {
  const r = p.r * (1 - f * (p.shrink ?? 0.5));
  kit.ctx.globalAlpha = fadeOf(f) * (p.alpha ?? 1);
  put(glow(p.col), p.x, p.y, r * 2 * (p.sx ?? 1), r * 2 * (p.sy ?? 1));
}
function drawFlame(p, f) {   // a tongue of flame, white-hot to red as it rises, tall and narrowing
  const pal = PALETTES.fire, i = Math.min(4, Math.floor(f * 5)), r = p.r * (1 - f * 0.6);
  kit.ctx.globalAlpha = fadeOf(f, 0.4);
  put(glow(pal[i]), p.x, p.y, r * 1.5, r * 3.2);
}
function drawSprite(p, f) {
  const grow = p.grow ? Math.min(1, f / p.grow) : 1;
  kit.ctx.globalAlpha = fadeOf(f, p.fadeFrom ?? 0.6);
  const a = p.face ? Math.atan2(p.vy, p.vx) + Math.PI / 2 : p.rot + p.age * (p.spin || 0);
  put(p.img, p.x, p.y, p.w * grow, p.h * grow, a, p.tumble ? Math.max(0.2, Math.abs(Math.cos((p.age + p.phase) / 6))) : 1);
}
function drawBubble(p, f) {
  const ctx = kit.ctx;
  if (f < 0.88) { ctx.globalAlpha = 0.95; put(bubble(), p.x, p.y, p.r * 2, p.r * 2); return; }
  const k = (f - 0.88) / 0.12;   // it pops
  ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = U(2);
  ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + k * 0.8), 0, Math.PI * 2); ctx.stroke();
}
function drawStreak(p, f) {   // a speed line: from where it is back along where it came from
  const ctx = kit.ctx, v = Math.hypot(p.vx, p.vy) || 1;
  ctx.globalAlpha = fadeOf(f, 0.3);
  ctx.strokeStyle = p.col; ctx.lineWidth = p.w * (1 - f * 0.6); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - (p.vx / v) * p.len, p.y - (p.vy / v) * p.len); ctx.stroke();
}
function drawDust(p, f) {
  kit.ctx.globalAlpha = (1 - f) * 0.55;
  put(glow(p.col), p.x, p.y, p.r * (1 + f) * 2, p.r * (1 + f) * 1.4);
}
function drawScorch(p, f) {
  kit.ctx.globalAlpha = Math.min(1, f * 6) * (1 - f) * 0.5;
  put(scorch(), p.x, p.y, p.r * 2, p.r * 0.64);
}
function drawMote(p, f) {
  kit.ctx.globalAlpha = fadeOf(f, 0.5);
  put(glow(p.col), p.x, p.y, p.r * 2.4, p.r * 2.4);
  if (p.plus) put(cross('#ffffff'), p.x, p.y, p.r * 0.9, p.r * 0.9);
}
function ringPart(x, y, col, r1, life, w = 1.4) {
  return part({ x, y, life, add: true, draw(p, f) {
    const ctx = kit.ctx;
    ctx.globalAlpha = (1 - f) * 0.9; ctx.strokeStyle = col; ctx.lineWidth = Math.max(0.15, (1 - f) * w);
    ctx.beginPath(); ctx.arc(p.x, p.y, U(4) + (r1 - U(4)) * ease(f), 0, Math.PI * 2); ctx.stroke();
  } });
}
const burst = (type, x, y, n, power = 2.5) => { for (let i = 0; i < n; i++) spawn(type, x, y, { burst: power }); };
const flame = (x, y, r, vy = rand(-1.4, -0.6), life = rand(24, 38)) => part({ x, y, r, vy, vx: rand(-0.25, 0.25), life, add: true, drag: 0.98, draw: drawFlame });

/* ---------- the moves ---------- */

const MOVES = {
  flames(A, B, pal, o) {
    for (let i = 0; i < (o.big ? 26 : 16); i++) flame(B.x + rand(-0.4, 0.4) * B.w, B.bottom - rand(0.05, 0.4) * B.h, U(rand(10, 18)));
    for (let i = 0; i < 10; i++) spawn('fire', B.x + rand(-0.3, 0.3) * B.w, B.y + rand(0, 0.3) * B.h, { ember: true, burst: 1.5 });
    part({ x: B.x, y: B.bottom - B.h * 0.04, r: B.w * 0.5, life: 110, draw: drawScorch });
  },
  inferno(A, B, pal, o) {
    MOVES.flames(A, B, pal, o);
    job(420 * o.ts, (t) => {
      for (let i = 0; i < 3; i++) {
        const a = t * 0.012 + (i * Math.PI * 2) / 3;
        flame(B.x + Math.cos(a) * B.w * 0.55, B.bottom - B.h * 0.15 + Math.sin(a) * B.h * 0.12, U(rand(12, 20)), rand(-2, -1.2), rand(18, 28));
      }
    });
  },
  splash(A, B, pal) {
    for (let i = 0; i < 24; i++) {
      const p = spawn('water', B.x + rand(-0.25, 0.25) * B.w, B.y + B.h * 0.1);
      p.vx = rand(-1.6, 1.6); p.vy = rand(-3.2, -1.4); p.g = 0.12; p.life = rand(30, 44);
    }
    ringPart(B.x, B.y + B.h * 0.1, pal[1], B.w * 0.7, 20);
  },
  wave(A, B, pal, o, type) {   // a wall of water (or lava) sweeping across the foe
    job(380 * o.ts, (t, f) => {
      const x = B.x - B.w * 0.9 + f * B.w * 1.8;
      for (let i = 0; i < 4; i++) {
        const p = spawn(type, x + rand(-U(10), U(10)), B.bottom - rand(0, 0.15) * B.h);
        p.vx = rand(0.4, 1.4); p.vy = rand(-3.4, -1.8); p.g = 0.13; p.life = rand(26, 38);
      }
      if (Math.random() < 0.6) part({ x, y: B.bottom - B.h * 0.25, r: U(rand(14, 22)), col: pal[1], alpha: 0.6, life: 20, vy: -0.5, add: true, draw: drawGlow });
    });
  },
  stream(A, B, pal, o, type) {   // a jet from your Pokémon to the foe
    const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy), frames = 12, sp = d / frames;
    job(320 * o.ts, () => {
      for (let i = 0; i < 4; i++) {
        const j = rand(-0.08, 0.08), vx = (dx / d) * sp + (-dy / d) * sp * j, vy = (dy / d) * sp + (dx / d) * sp * j;
        const x = A.x + dx * 0.12, y = A.y + dy * 0.12;
        if (type === 'fire') { const p = flame(x, y, U(rand(10, 16)), vy, frames + rand(2, 6)); p.vx = vx; }
        else if (type === 'water') { const p = spawn('water', x, y); Object.assign(p, { vx, vy, g: 0, drag: 1, life: frames + rand(2, 6), size: 2.4 }); }
        else part({ x, y, vx, vy, r: U(rand(8, 13)), col: pal[2], life: frames + rand(2, 6), add: true, draw: drawGlow, shrink: 0 });
      }
    });
    later(180 * o.ts, () => burst(type, B.x, B.y, 12, 2));
  },
  beam(A, B, pal, o, type) {
    const ms = 440 * o.ts;
    job(ms, (t, f) => {
      const ctx = kit.ctx, w = U(16) * Math.min(1, t / 70) * (f > 0.6 ? 1 - (f - 0.6) / 0.4 : 1) * (1 + 0.12 * Math.sin(t * 0.09));
      if (w <= 0) return;
      ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
      for (const [col, k, a] of [[pal[3], 1.6, 0.35], [pal[2], 1, 0.7], [pal[0], 0.35, 1]]) {
        ctx.globalAlpha = a; ctx.strokeStyle = col; ctx.lineWidth = w * k;
        ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      put(glow(pal[1]), A.x, A.y, w * 3, w * 3);
      put(glow(pal[1]), B.x, B.y, w * 5, w * 5);
      if (Math.random() < 0.7) { const u = Math.random(); spawn(type, A.x + (B.x - A.x) * u, A.y + (B.y - A.y) * u, { burst: 1 }); }
    });
  },
  bolt(A, B, pal, o) {
    const x0 = B.x + rand(-0.15, 0.15) * B.w, path = [];
    const zig = () => {
      path.length = 0;
      const n = 9;
      for (let i = 0; i <= n; i++) path.push([x0 + (B.x - x0) * (i / n) + (i && i < n ? rand(-1, 1) * U(18) : 0), (B.y * i) / n]);
    };
    job(320 * o.ts, (t) => {
      if (Math.floor(t / 45) !== path.t) { path.t = Math.floor(t / 45); zig(); }
      if (path.t % 3 === 2) return;   // it flickers
      const ctx = kit.ctx;
      ctx.globalCompositeOperation = 'lighter'; ctx.lineJoin = ctx.lineCap = 'round';
      for (const [col, w, a] of [[pal[2], U(12), 0.45], [pal[1], U(5), 0.9], ['#ffffff', U(2), 1]]) {
        ctx.globalAlpha = a; ctx.strokeStyle = col; ctx.lineWidth = w;
        ctx.beginPath(); path.forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](x, y)); ctx.stroke();
      }
      ctx.globalAlpha = 0.8; put(glow(pal[1]), B.x, B.y, B.w * 1.4, B.w * 1.4);
    });
    burst('electric', B.x, B.y, 14, 3);
  },
  bubbles(A, B) {
    const dx = B.x - A.x, dy = B.y - A.y;
    for (let i = 0; i < 9; i++) {
      const frames = rand(16, 24);
      part({ x: A.x + dx * 0.15, y: A.y + dy * 0.15, vx: dx * 0.85 / frames + rand(-0.3, 0.3), vy: dy * 0.85 / frames + rand(-0.4, 0.4), r: U(rand(7, 13)),
        sway: 0.5, life: frames / 0.88, draw: drawBubble });
    }
  },
  blades(A, B, pal, o, type) {
    const dx = B.x - A.x, dy = B.y - A.y;
    for (let i = 0; i < 6; i++) later(i * 40 * o.ts, () => {
      const frames = 10;
      const p = part({ x: A.x + rand(-1, 1) * U(20), y: A.y + rand(-1, 1) * U(20), vx: dx / frames, vy: dy / frames + rand(-0.6, 0.6), life: frames + 4,
        img: type === 'grass' ? kit.leaf(pal, i % 2 === 1) : crescent(pal), w: U(14), h: U(type === 'grass' ? 22 : 14), rot: rand(0, 6), spin: 0.6, add: type !== 'grass', draw: drawSprite });
      p.fadeFrom = 0.8;
    });
    later(160 * o.ts, () => MOVES.slash(A, B, pal, { ...o, quick: true }, type));
  },
  petals(A, B) {
    for (let i = 0; i < 28; i++) {
      const a = rand(0, Math.PI * 2), r = rand(0.4, 0.8) * B.w;
      part({ x: B.x + Math.cos(a) * r, y: B.y + Math.sin(a) * r * 0.6, vx: -Math.sin(a) * 1.6, vy: Math.cos(a) * 1, g: 0.02, drag: 0.96, life: rand(34, 50),
        img: petal(), w: U(9), h: U(13), rot: a, spin: 0.15, tumble: true, draw: drawSprite });
    }
    burst('grass', B.x, B.y, 6, 2);
  },
  vines(A, B, pal, o, type) {   // two vines lash out and crack across the foe
    const lashes = [[1, -0.5], [-1, 0.4]];
    job(380 * o.ts, (t, f) => {
      const ctx = kit.ctx, grow = Math.min(1, f / 0.55), fade = f > 0.6 ? 1 - (f - 0.6) / 0.4 : 1;
      ctx.lineCap = 'round';
      for (const [side, bend] of lashes) {
        const cx = (A.x + B.x) / 2 + side * U(40), cy = Math.min(A.y, B.y) - U(60) * (1 + bend);
        const pts = [];
        for (let i = 0; i <= 20 * grow; i++) {
          const u = i / 20, x = (1 - u) ** 2 * A.x + 2 * (1 - u) * u * cx + u * u * (B.x + side * B.w * 0.3);
          pts.push([x, (1 - u) ** 2 * A.y + 2 * (1 - u) * u * cy + u * u * (B.y + bend * B.h * 0.3)]);
        }
        if (pts.length < 2) continue;
        for (const [col, w] of [[pal[4], U(7)], [pal[2], U(4)], [pal[1], U(1.5)]]) {
          ctx.globalAlpha = fade; ctx.strokeStyle = col; ctx.lineWidth = w;
          ctx.beginPath(); pts.forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](x, y)); ctx.stroke();
        }
      }
    });
    later(200 * o.ts, () => MOVES.slash(A, B, pal, { ...o, quick: true }, type));
  },
  orb(A, B, pal, o, type) {   // a glowing ball flies in and bursts
    const ms = 200 * o.ts;
    job(ms, (t, f) => {
      const e = f * f, x = A.x + (B.x - A.x) * e, y = A.y + (B.y - A.y) * e - Math.sin(f * Math.PI) * U(30);
      kit.ctx.globalCompositeOperation = 'lighter';
      const r = U(20) * (1 + 0.1 * Math.sin(t * 0.08));
      put(glow(pal[2]), x, y, r * 2.6, r * 2.6);
      put(glow(pal[0]), x, y, r, r);
      if (Math.random() < 0.8) spawn(type, x, y, { burst: 0.6 });
    });
    later(ms, () => {
      burst(type, B.x, B.y, 22, 3.2);
      ringPart(B.x, B.y, pal[1], B.w * 0.8, 22, 2);
      part({ x: B.x, y: B.y, r: B.w * 0.7, col: pal[1], life: 14, add: true, draw: drawGlow, shrink: -0.6 });
    });
  },
  frost(A, B, pal) {   // ice crystals grow out of the foe, then glitter away
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + rand(-0.2, 0.2), r = rand(0.15, 0.45) * B.w;
      part({ x: B.x + Math.cos(a) * r, y: B.y + Math.sin(a) * r * 0.9, life: rand(34, 46), img: shard(pal), w: U(9), h: U(rand(22, 34)),
        rot: a + Math.PI / 2, grow: 0.25, add: true, draw: drawSprite });
    }
    burst('ice', B.x, B.y, 10, 2);
  },
  blizzard(A, B, pal, o) {
    job(460 * o.ts, () => {
      for (let i = 0; i < 3; i++) {
        const p = spawn('ice', B.x + B.w * rand(0.5, 1.2), B.y - B.h * rand(0.2, 0.9));
        Object.assign(p, { vx: rand(-4, -2.6), vy: rand(0.6, 1.6), drag: 1, g: 0, life: rand(16, 24) });
      }
      part({ x: B.x + B.w, y: B.y + rand(-0.5, 0.5) * B.h, vx: -5, vy: 1.4, len: U(30), w: U(1.5), col: '#ffffff', life: 14, add: true, draw: drawStreak });
    });
    MOVES.frost(A, B, pal);
  },
  shards(A, B, pal, o) {
    for (let i = 0; i < 5; i++) later(i * 45 * o.ts, () => {
      const sx = B.x - B.w * rand(0.6, 1), sy = B.y - B.h * rand(0.8, 1.2), frames = 9;
      part({ x: sx, y: sy, vx: (B.x + rand(-0.2, 0.2) * B.w - sx) / frames, vy: (B.y - sy) / frames, life: frames + 2, img: shard(pal), w: U(9), h: U(30), face: true, add: true, draw: drawSprite });
      later(150 * o.ts, () => burst('ice', B.x, B.y, 5, 2));
    });
  },
  rings(A, B, pal, o) {   // psychic waves roll out from your Pokémon and wash over the foe
    for (let i = 0; i < 4; i++) later(i * 50 * o.ts, () => {
      const frames = 14;
      part({ x: A.x, y: A.y, vx: (B.x - A.x) / frames, vy: (B.y - A.y) / frames, life: frames + 4, add: true, draw(p, f) {
        const ctx = kit.ctx, r = U(10) + f * B.w * 0.5;
        ctx.globalAlpha = fadeOf(f, 0.5) * 0.85; ctx.strokeStyle = i % 2 ? pal[1] : pal[2]; ctx.lineWidth = U(3);
        ctx.beginPath(); ctx.ellipse(p.x, p.y, r, r * 0.8, 0, 0, Math.PI * 2); ctx.stroke();
      } });
    });
    later(240 * o.ts, () => { ringPart(B.x, B.y, pal[1], B.w * 0.9, 24, 2.2); burst('psychic', B.x, B.y, 12, 2.4); });
  },
  punch(A, B, pal) {   // an impact star with speed lines bursting out of it
    const col = pal === PALETTES.normal ? '#ffffff' : pal[1];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + rand(-0.15, 0.15), v = rand(3, 5);
      part({ x: B.x + Math.cos(a) * U(10), y: B.y + Math.sin(a) * U(10), vx: Math.cos(a) * v, vy: Math.sin(a) * v, drag: 0.82, len: U(rand(16, 26)), w: U(3), col, life: 12, add: true, draw: drawStreak });
    }
    part({ x: B.x, y: B.y, life: 12, add: true, draw(p, f) {
      const ctx = kit.ctx, r = B.w * 0.35 * (0.5 + ease(f) * 0.8);
      ctx.globalAlpha = 1 - f; ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, rr = i % 2 ? r * 0.38 : r; ctx[i ? 'lineTo' : 'moveTo'](p.x + Math.cos(a) * rr, p.y + Math.sin(a) * rr); }
      ctx.closePath(); ctx.fill();
      put(glow(col), p.x, p.y, r * 2.4, r * 2.4);
    } });
  },
  slash(A, B, pal, o, type) {   // claw marks drawn across the foe
    const dark = type === 'dark', n = o.quick ? 1 : 3;
    for (let i = 0; i < n; i++) {
      const off = (i - (n - 1) / 2) * B.w * 0.22;
      later(i * 45 * o.ts, () => part({ x: B.x + off, y: B.y, life: 22, draw(p, f) {
        const ctx = kit.ctx, grow = Math.min(1, f / 0.3), x0 = p.x - B.w * 0.3, y0 = p.y - B.h * 0.35, x1 = p.x + B.w * 0.3, y1 = p.y + B.h * 0.35;
        const xe = x0 + (x1 - x0) * grow, ye = y0 + (y1 - y0) * grow, mx = (x0 + xe) / 2 + U(10), my = (y0 + ye) / 2 - U(10);
        ctx.lineCap = 'round'; ctx.globalAlpha = fadeOf(f, 0.35);
        const layers = dark ? [[DARK_EDGE, U(8), 'lighter'], ['#1a0c24', U(4), 'source-over']] : [[pal[2], U(9), 'lighter'], ['#ffffff', U(3), 'lighter']];
        for (const [col, w, op] of layers) {
          ctx.globalCompositeOperation = op; ctx.strokeStyle = col; ctx.lineWidth = w * (1 - f * 0.5);
          ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(mx, my, xe, ye); ctx.stroke();
        }
      } }));
    }
  },
  fangs(A, B, pal, o) {   // jaws snap shut on the foe
    const col = pal === PALETTES.dark ? '#f4ece4' : pal[0];
    part({ x: B.x, y: B.y, life: o.fast ? 22 : 44, draw(p, f) {
      const ctx = kit.ctx, shut = ease(Math.min(1, f / 0.35)), gap = B.h * 0.4 * (1 - shut) + U(2), w = B.w * 0.36;
      ctx.globalAlpha = fadeOf(f, 0.5);
      ctx.fillStyle = col; ctx.strokeStyle = 'rgba(40, 16, 24, 0.9)'; ctx.lineWidth = U(1.5);
      for (const side of [-1, 1]) {
        ctx.beginPath();
        const y = p.y + side * gap;
        ctx.moveTo(p.x - w, y + side * U(6));   // the jaw's back edge, then its teeth pointing in at the foe
        ctx.lineTo(p.x - w, y);
        for (let i = 0; i < 4; i++) {
          const xa = p.x - w + (i * 2 * w) / 4, xb = xa + (2 * w) / 4;
          ctx.lineTo((xa + xb) / 2, y - side * U(16));
          ctx.lineTo(xb, y);
        }
        ctx.lineTo(p.x + w, y + side * U(6)); ctx.closePath();
        ctx.fill(); ctx.stroke();
      }
      if (shut >= 1) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - f; put(glow(pal[1]), p.x, p.y, B.w, B.w * 0.6); }
    } });
  },
  rocks(A, B, pal, o) {
    const ground = PALETTES.ground;
    for (let i = 0; i < 6; i++) later(i * 40 * o.ts, () => {
      const x = B.x + rand(-0.4, 0.4) * B.w, frames = 12, drop = B.h * 1.1;
      part({ x, y: B.y - drop, vy: drop / frames, life: frames + 2, img: rock(ground, i % 3), w: U(rand(14, 22)), h: U(rand(14, 22)), rot: rand(0, 6), spin: 0.2, draw: drawSprite });
      later(frames * 16 * o.ts, () => { for (let j = 0; j < 3; j++) part({ x: x + rand(-1, 1) * U(10), y: B.y + rand(0, 0.3) * B.h, vx: rand(-0.6, 0.6), vy: rand(-0.6, -0.1), r: U(rand(10, 16)), col: ground[3], life: 30, draw: drawDust }); });
    });
  },
  quake(A, B, pal, o) {   // the ground cracks under the foe and throws up dust and stones
    const ground = PALETTES.ground, y = B.bottom - B.h * 0.06;
    const crack = Array.from({ length: 13 }, (_, i) => [i / 12, rand(-1, 1) * U(5)]);
    part({ x: B.x, y, life: 40, draw(p, f) {
      const ctx = kit.ctx, spread = ease(Math.min(1, f / 0.3)) * B.w * 1.1;
      ctx.globalAlpha = fadeOf(f, 0.5); ctx.strokeStyle = ground[5]; ctx.lineWidth = U(3); ctx.lineJoin = 'round';
      ctx.beginPath(); crack.forEach(([u, dy], i) => ctx[i ? 'lineTo' : 'moveTo'](p.x - spread + u * spread * 2, p.y + dy)); ctx.stroke();
    } });
    for (let i = 0; i < 14; i++) part({ x: B.x + rand(-0.7, 0.7) * B.w, y, vx: rand(-0.8, 0.8), vy: rand(-0.8, -0.2), r: U(rand(12, 20)), col: ground[2], life: rand(28, 40), draw: drawDust });
    for (let i = 0; i < 8; i++) part({ x: B.x + rand(-0.5, 0.5) * B.w, y, vx: rand(-1.2, 1.2), vy: rand(-3.6, -2), g: 0.22, life: 22, img: rock(ground, i % 3), w: U(8), h: U(8), rot: rand(0, 6), spin: 0.3, draw: drawSprite });
  },
  gust(A, B, pal) {   // wind sweeps round the foe in arcs
    for (let i = 0; i < 5; i++) {
      const r = B.w * rand(0.35, 0.65), a0 = rand(0, Math.PI * 2), dir = i % 2 ? 1 : -1;
      part({ x: B.x, y: B.y + rand(-0.3, 0.3) * B.h, life: rand(18, 26), add: true, draw(p, f) {
        const ctx = kit.ctx, a = a0 + dir * f * 3;
        ctx.globalAlpha = fadeOf(f, 0.4) * 0.85; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = U(2.5) * (1 - f * 0.5); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.ellipse(p.x, p.y, r, r * 0.45, 0, a, a + dir * 1.6, dir < 0); ctx.stroke();
      } });
    }
    burst('flying', B.x, B.y, 10, 2.6);
  },
  twister(A, B, pal, o, type) {
    job(480 * o.ts, (t, f) => {
      const ctx = kit.ctx;
      ctx.globalCompositeOperation = type === 'dark' ? 'source-over' : 'lighter'; ctx.lineCap = 'round';
      for (let i = 0; i < 7; i++) {
        const u = i / 6, y = B.bottom - u * B.h * 1.2, r = B.w * (0.12 + u * 0.45), a = t * 0.02 + u * 3;
        ctx.globalAlpha = (f > 0.7 ? 1 - (f - 0.7) / 0.3 : 1) * 0.7; ctx.strokeStyle = i % 2 ? pal[1] : '#ffffff'; ctx.lineWidth = U(2.5);
        ctx.beginPath(); ctx.ellipse(B.x + Math.sin(t * 0.01 + u * 2) * U(6), y, r, r * 0.28, 0, a, a + 4.2); ctx.stroke();
      }
      if (Math.random() < 0.7) spawn(type, B.x + rand(-0.4, 0.4) * B.w, B.bottom - rand(0, 1) * B.h, { burst: 1.5 });
    });
  },
  void(A, B, pal, o) {   // a dark vortex swallows the foe for a moment
    job(480 * o.ts, (t, f) => {
      const ctx = kit.ctx, k = f < 0.7 ? Math.min(1, f / 0.25) : 1 - (f - 0.7) / 0.3, r = B.w * 0.75 * k;
      if (r <= 0) return;
      put(hole(), B.x, B.y, r * 2, r * 2);
      ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = DARK_EDGE; ctx.lineWidth = U(2);
      for (let i = 0; i < 3; i++) {
        const a = -t * 0.01 + (i * Math.PI * 2) / 3;
        ctx.globalAlpha = 0.7 * k; ctx.beginPath(); ctx.arc(B.x, B.y, r * (0.4 + i * 0.2), a, a + 2); ctx.stroke();
      }
      if (Math.random() < 0.8) {
        const a = rand(0, Math.PI * 2), d = B.w * 0.9;
        part({ x: B.x + Math.cos(a) * d, y: B.y + Math.sin(a) * d, vx: -Math.cos(a) * d / 14, vy: -Math.sin(a) * d / 14, r: U(6), col: DARK_EDGE, life: 14, add: true, draw: drawGlow, shrink: 0.7 });
      }
    });
  },
};

/**
 * An attack's hit: its move's effect from your Pokémon (`from`) onto the foe (`to`), and the hit's light washing over
 * the foe and the arena round it. `power` (0-1, the share of the foe's HP the hit took) and `big` (a cut-in card)
 * make the light bigger. Only the first hit of a multi-hit move plays the whole effect; the rest flash and burst.
 */
export function attackFx(card, from, to, { power = 0, big = false, fast = false, first = true } = {}) {
  if (!from || !to || !kit.open()) return;
  const A = kit.box(from), B = kit.box(to), type = card.type, pal = palOf(type), o = { fast, big, ts: fast ? 0.5 : 1 };
  const kind = fxFor(card);
  try { (first ? MOVES[kind] || MOVES.punch : MOVES.punch)(A, B, pal, o, type); } catch (err) { console.warn('movefx', kind, err); }
  const glowR = B.w * (1.1 + power * 1.5 + (big ? 0.6 : 0));
  part({ x: B.x, y: B.y, r: glowR, col: pal[2], alpha: 0.55, life: 16, add: true, draw: drawGlow, shrink: -0.3 });
  const R = B.w * 4.5;   // the light it throws over the scene round the foe (a whole-screen fill was the costliest draw)
  part({ x: B.x, y: B.y, life: 16 * o.ts, add: true, draw(p, f) { kit.ctx.globalAlpha = 0.55 * (1 - f) * (1 + power); put(light(pal[2]), p.x, p.y, R, R); } });
}
/** The colour an attack lights the 3D arena in. */
export const lightOf = (type) => palOf(type)[2];

/** Block gained: a shimmering bubble of hexagons forms round your Pokémon and fades. */
export function shieldFx(node, { fast = false } = {}) {
  if (!node || !kit.open()) return;
  const A = kit.box(node), R = Math.max(A.w, A.h) * 0.62;
  job(700 * (fast ? 0.5 : 1), (t, f) => {
    const ctx = kit.ctx, r = R * (0.75 + 0.25 * ease(Math.min(1, f / 0.22))), a = f < 0.6 ? 1 : 1 - (f - 0.6) / 0.4;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = a; put(shieldBall(), A.x, A.y, r * 2, r * 2);
    ctx.globalAlpha = 0.9 * a; ctx.strokeStyle = '#e8f8ff'; ctx.lineWidth = U(3); ctx.lineCap = 'round';
    const s = f * 5;   // a sheen sweeping round its rim
    ctx.beginPath(); ctx.arc(A.x, A.y, r, s, s + 0.9); ctx.stroke();
  });
}

/** HP healed: green motes and pluses rise off your Pokémon. */
export function healFx(node) {
  if (!node || !kit.open()) return;
  const A = kit.box(node);
  for (let i = 0; i < 16; i++) {
    part({ x: A.x + rand(-0.4, 0.4) * A.w, y: A.bottom - rand(0, 0.5) * A.h, vy: rand(-1.2, -0.5), sway: 0.25, r: U(rand(5, 9)), plus: i % 3 === 0,
      col: i % 2 ? '#78e878' : '#c0ffb0', life: rand(36, 54), add: true, draw: drawMote });
  }
}

/* ---------- PP and End Turn ---------- */

const GOLD = PALETTES.electric;
function drawGather(p, f) {   // a mote drawn in to (tx, ty), swirling, with a short tail behind it
  const at = (g) => { const k = g * g, a = p.a + (1 - g) * p.swirl, d = p.d * (1 - k); return [p.tx + Math.cos(a) * d, p.ty + Math.sin(a) * d * 0.6]; };
  const [x, y] = at(f), [bx, by] = at(Math.max(0, f - 0.12)), ctx = kit.ctx;
  ctx.globalAlpha = Math.min(1, f * 5) * 0.8;
  ctx.strokeStyle = p.col; ctx.lineWidth = p.r * 0.7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(x, y); ctx.stroke();
  ctx.globalAlpha = Math.min(1, f * 5);
  put(glow(p.col), x, y, p.r * 2.6, p.r * 2.6);
}

/**
 * PP coming back: gold motes swirl in to the PP pill from round it, then a ring, a flash and a twinkle of stars as they
 * land. A turn's refill (`refill`) gathers more from further out; a card's +PP a few. Spending PP (`spent`) puffs sparks
 * up off its number.
 */
export function ppFx(node, { gain = 0, spent = 0, refill = false, fast = false } = {}) {
  if (!node || !kit.open()) return;
  const A = kit.box(node), C = kit.box(node.querySelector('.pp-count b') || node), ts = fast ? 0.5 : 1;
  if (spent) {
    for (let i = 0; i < Math.min(spent, 4) * 5; i++) {
      const a = rand(-2.8, -0.35), s = rand(0.9, 2.2);
      part({ x: C.x, y: C.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: 0.05, drag: 0.92, r: U(rand(3, 6)), col: GOLD[i % 3 ? 1 : 2], life: rand(16, 26) * ts, add: true, draw: drawMote });
    }
    ringPart(C.x, C.y, GOLD[1], A.h * 0.8, 12 * ts, 1);
    return;
  }
  if (!refill && !gain) return;
  const n = refill ? 22 : 6 + Math.min(gain, 3) * 3, R = Math.max(A.w, A.h * 2) * (refill ? 0.95 : 0.65), ms = (refill ? 420 : 300) * ts;
  for (let i = 0; i < n; i++) {
    part({ x: A.x, y: A.y, tx: A.x, ty: A.y, a: (i / n) * Math.PI * 2 + rand(-0.2, 0.2), d: R * rand(0.75, 1.2), swirl: rand(0.8, 1.4),
      r: U(rand(3, 5.5)), col: GOLD[i % 4 ? 1 : 0], life: (ms / 16.67) * rand(0.8, 1), add: true, draw: drawGather });
  }
  later(ms * 0.9, () => {
    if (!node.isConnected) return;
    ringPart(A.x, A.y, GOLD[1], A.w * (refill ? 0.85 : 0.6), 18 * ts, 1.6);
    part({ x: A.x, y: A.y, r: A.w * 0.6, sy: 0.6, col: GOLD[1], alpha: 0.7, life: 14 * ts, add: true, draw: drawGlow, shrink: -0.3 });
    burst('electric', C.x, C.y, refill ? 10 : 5, 2);
  });
}

/** End Turn pressed: a flash on the button, a ring off it, and speed lines and sparks thrown up toward the arena. */
export function endTurnFx(node, { fast = false } = {}) {
  if (!node || !kit.open()) return;
  const A = kit.box(node), ts = fast ? 0.5 : 1;
  part({ x: A.x, y: A.y, r: A.w * 0.7, sy: 0.55, col: '#fff0e0', alpha: 0.9, life: 12 * ts, add: true, draw: drawGlow, shrink: -0.4 });
  ringPart(A.x, A.y, '#ffffff', A.w * 0.85, 16 * ts, 1.6);
  for (let i = 0; i < 12; i++) {
    const a = rand(-2.7, -1.0), s = rand(3, 6), x = A.x + rand(-0.35, 0.35) * A.w, y = A.y + rand(-0.3, 0.3) * A.h;
    part({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, drag: 0.88, len: U(rand(16, 32)), w: U(rand(2, 3.5)), col: i % 3 ? '#ffffff' : '#ffc8b8', life: rand(12, 18) * ts, add: true, draw: drawStreak });
  }
  burst('fighting', A.x, A.y, 8, 2.4);
}

/* ---------- a status's ambience on the foe ---------- */

let amb = null;
/**
 * What the foe is suffering, shown on it the whole time it lasts: embers drift off a burned foe, seeds' green motes
 * off a seeded one, sparks crackle round a static one, frost glitters on a frostbitten one. Called with the foe's
 * sprite and its statuses each time they're drawn; it stops by itself once they're gone or the fight is off screen.
 */
export function ambience(node, { burn = 0, seed = 0, stat = 0, frost = 0 } = {}) {
  const any = burn || seed || stat || frost;
  if (!any || !node) { if (amb) amb.on = false; return; }
  if (amb?.on) { Object.assign(amb, { node, burn, seed, stat, frost }); return; }
  if (!kit.open()) return;
  amb = { on: true, node, burn, seed, stat, frost };
  const me = amb;
  let box = kit.box(node), tick = 0;
  job(0, (t) => {
    if (!me.on || amb !== me || !me.node.isConnected || me.node.closest('[hidden]') || document.hidden) { me.on = false; return false; }
    if (++tick % 20 === 0) box = kit.box(me.node);
    const B = box;
    if (me.burn && Math.random() < 0.18) spawn('fire', B.x + rand(-0.35, 0.35) * B.w, B.y + rand(-0.1, 0.35) * B.h, { ember: true });
    if (me.seed && Math.random() < 0.07) part({ x: B.x + rand(-0.4, 0.4) * B.w, y: B.y + rand(-0.2, 0.3) * B.h, vy: rand(-0.6, -0.3), sway: 0.3, r: U(5), col: '#9ee86a', life: 40, add: true, ambient: true, draw: drawMote });
    if (me.stat && Math.random() < 0.035) {
      const x = B.x + rand(-0.4, 0.4) * B.w, y = B.y + rand(-0.4, 0.3) * B.h, segs = Array.from({ length: 4 }, (_, i) => [x + rand(-1, 1) * U(10), y + i * U(6)]);
      part({ x, y, life: 6, add: true, ambient: true, draw(p, f) {
        const ctx = kit.ctx;
        ctx.globalAlpha = 1 - f; ctx.strokeStyle = '#fff4a0'; ctx.lineWidth = U(2);
        ctx.beginPath(); segs.forEach(([sx, sy], i) => ctx[i ? 'lineTo' : 'moveTo'](sx, sy)); ctx.stroke();
      } });
    }
    if (me.frost && Math.random() < 0.08) {
      const p = spawn('ice', B.x + rand(-0.4, 0.4) * B.w, B.y - rand(0.1, 0.5) * B.h);
      Object.assign(p, { vx: rand(-0.2, 0.2), vy: rand(0.2, 0.5), g: 0, drag: 1, size: 1.2 });
    }
  }, { ambient: true });
}

/* ---------- a big card's cut-in ---------- */

/**
 * A 3-PP or rare card: the screen dims and a band in its type's colours sweeps across with its name and speed lines,
 * then the move plays (the user's ask, 2026-10-28). About half a second, half that at 2x speed; resolves once it's gone.
 */
export function cutIn(card, { fast = false } = {}) {
  if (!kit.open()) return Promise.resolve();
  const ms = fast ? 300 : 600, pal = palOf(card.type);
  const lines = Array.from({ length: 14 }, () => [rand(0, 1), rand(-0.45, 0.45), rand(0.6, 1.4)]);
  const font = getComputedStyle(document.body).fontFamily;
  return new Promise(done => {
    job(ms, (t, f) => {
      const ctx = kit.ctx, W = innerWidth / kit.PX, H = innerHeight / kit.PX;
      const inK = Math.min(1, f / 0.18), outK = f > 0.8 ? (f - 0.8) / 0.2 : 0;
      ctx.globalAlpha = 0.5 * inK * (1 - outK); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      const bh = U(86), cy = H * 0.42, slide = (1 - ease(inK)) * -W + outK * W;
      ctx.globalAlpha = 1;
      ctx.translate(slide, cy); ctx.transform(1, -0.12, 0, 1, 0, 0);
      const grad = ctx.createLinearGradient(0, -bh / 2, 0, bh / 2);
      grad.addColorStop(0, pal[1]); grad.addColorStop(0.5, pal[2]); grad.addColorStop(1, pal[4]);
      ctx.fillStyle = grad; ctx.fillRect(-W * 0.1, -bh / 2, W * 1.2, bh);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(-W * 0.1, -bh / 2 - U(4), W * 1.2, U(3)); ctx.fillRect(-W * 0.1, bh / 2 + U(1), W * 1.2, U(3));
      ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)'; ctx.lineCap = 'round';
      for (const [x, y, sp] of lines) {
        const lx = ((x - t * 0.004 * sp) % 1 + 1) % 1 * W * 1.2 - W * 0.1;
        ctx.lineWidth = U(2); ctx.beginPath(); ctx.moveTo(lx, y * bh); ctx.lineTo(lx + U(40) * sp, y * bh); ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.font = `${U(30)}px ${font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = U(6); ctx.strokeStyle = pal[5]; ctx.lineJoin = 'round';
      ctx.strokeText(card.name.toUpperCase(), W / 2, U(2));
      ctx.fillStyle = '#ffffff'; ctx.fillText(card.name.toUpperCase(), W / 2, U(2));
      if (f >= 1) done();
    });
  });
}
