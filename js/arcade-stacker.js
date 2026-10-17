/* arcade-stacker.js  -  Snorlax Stacker, a home arcade game (js/arcade-kit.js): a cushion slides back and forth, a tap
   drops it; what hangs over the one below is cut off and tumbles, so the stack narrows. Since 2026-10-17 (the user's ask:
   every arcade game far more detailed, and harder the further you go) the tower climbs from Snorlax's meadow past the
   treetops, through a sea of clouds and a starry night into space (`ZONES`, the sky painted once a band and scrolled
   at half speed), with Pidgey, Jigglypuff and Clefairy drifting by. Perfects in a row score more, and three in a row
   grow the cushion back a little; every tenth floor is a golden cushion worth more; some carry a Berry that counts only
   if it lands on the stack. The cushion speeds up every floor, swings in eased arcs from floor 30 and changes pace from
   floor 45. A point a floor plus the bonuses. */

import { runArcade, drawMon, banner, rand } from './arcade-kit.js';
import { calmFx } from './prefs.js';

const W = 280, H = 360, SLAB = 22, START = 150, BASE = 40, TAU = Math.PI * 2;
const ZONES = [
  { at: 0, name: 'Snorlax\'s Meadow', sky: '#9ad8ff', cushion: ['#3a7a8a', '#e8dcc0'] },
  { at: 10, name: 'Above the Treetops', sky: '#5ab0f0', cushion: ['#4a6ac8', '#f0e0a0'] },
  { at: 20, name: 'Sea of Clouds', sky: '#f0a080', cushion: ['#c85a7a', '#ffe0e8'] },
  { at: 35, name: 'Starry Night', sky: '#2a2a6a', cushion: ['#5a4aa8', '#d8d0ff'] },
  { at: 50, name: 'Outer Space', sky: '#06061a', cushion: ['#2a2a3a', '#a8f0ff'] },
];
const noise = (i) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
/* what drifts past in each zone's sky: [Pokémon, height on screen, speed, size] */
const FLYERS = [[], [['pidgey', 70, 30, 22], ['pidgey', 120, 24, 18]], [['jigglypuff', 90, 14, 26], ['pidgey', 170, 20, 18]], [['hoothoot', 80, 16, 24], ['jigglypuff', 150, 10, 22]], [['clefairy', 70, 10, 28], ['clefairy', 160, 13, 22]]];
const zoneOf = (n) => ZONES.reduce((z, x, i) => (n >= x.at ? i : z), 0);

const bands = new Map();
/** Zone `k`'s sky painted once a scale, W x H, its own colour at the bottom fading into the next zone's above. */
function band(k, scale) {
  const key = `${k}@${scale}`;
  if (bands.has(key)) return bands.get(key);
  const c = document.createElement('canvas');
  c.width = Math.round(W * scale); c.height = Math.round(H * scale);
  const g = c.getContext('2d');
  g.scale(scale, scale);
  const lo = ZONES[Math.min(k, ZONES.length - 1)].sky, hi = ZONES[Math.min(k + 1, ZONES.length - 1)].sky;
  const sky = g.createLinearGradient(0, H, 0, 0); sky.addColorStop(0, lo); sky.addColorStop(1, hi);
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  if (k === 0) {
    g.fillStyle = '#fff6c0'; g.beginPath(); g.arc(220, 70, 22, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255, 246, 192, 0.25)'; g.beginPath(); g.arc(220, 70, 36, 0, TAU); g.fill();
    g.fillStyle = '#7ab8d0'; g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 20) g.lineTo(x, H - 60 - Math.sin(x / 50) * 18 - noise(x) * 10); g.lineTo(W, H); g.fill();
    g.fillStyle = '#5aa050'; g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 14) g.lineTo(x, H - 28 - Math.sin(x / 34 + 1) * 10); g.lineTo(W, H); g.fill();
  }
  if (k >= 1 && k <= 2) {
    for (let i = 0; i < (k === 2 ? 9 : 5); i++) {
      const cx = noise(i + k * 10) * W, cy = 30 + noise(i + k * 20) * (H - 60), r = 14 + noise(i + 3) * 16;
      g.fillStyle = k === 2 ? 'rgba(255, 230, 230, 0.85)' : 'rgba(255, 255, 255, 0.85)';
      g.beginPath(); g.ellipse(cx, cy, r * 2, r * 0.7, 0, 0, TAU); g.ellipse(cx + r * 0.8, cy - r * 0.4, r, r * 0.7, 0, 0, TAU); g.ellipse(cx - r * 0.7, cy - r * 0.2, r * 0.8, r * 0.6, 0, 0, TAU); g.fill();
      g.fillStyle = 'rgba(120, 120, 180, 0.15)'; g.fillRect(cx - r * 2, cy + r * 0.3, r * 4, 2);
    }
  }
  if (k >= 2) for (let i = 0; i < (k >= 3 ? 90 : 25); i++) { g.fillStyle = `rgba(255, 255, 255, ${0.2 + noise(i + k) * 0.7})`; const s = noise(i + 50) > 0.9 ? 2 : 1; g.fillRect(noise(i * 3 + k) * W, noise(i * 7 + k) * H * (k === 2 ? 0.4 : 1), s, s); }
  if (k === 3) { g.fillStyle = '#f8f4d8'; g.beginPath(); g.arc(70, 90, 24, 0, TAU); g.fill(); g.fillStyle = 'rgba(200, 190, 150, 0.6)'; for (const [x, y, r] of [[62, 84, 5], [78, 98, 4], [74, 80, 3]]) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); } }
  if (k >= 4) {
    const px = 60 + (k * 97) % 160, py = 80 + (k * 53) % 180;
    g.fillStyle = ['#c87a4a', '#6a9ad8', '#a8d870'][k % 3]; g.beginPath(); g.arc(px, py, 20, 0, TAU); g.fill();
    g.fillStyle = 'rgba(0, 0, 0, 0.25)'; g.beginPath(); g.arc(px + 6, py + 4, 18, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(255, 240, 200, 0.7)'; g.lineWidth = 2; g.beginPath(); g.ellipse(px, py, 34, 8, -0.3, 0, TAU); g.stroke();
  }
  bands.set(key, c);
  if (bands.size > 24) bands.delete(bands.keys().next().value);
  return c;
}

export const openStacker = (onClose) => runArcade({
  id: 'stacker', title: 'Snorlax Stacker', colour: '#3a7a8a', W, H,
  stick: false,
  intro: 'Stack them up for Snorlax\'s nap! Tap to drop each cushion.',
  sounds: ['fx-pop', 'fx-ding', 'fx-poof'],
  help: [['A cushion slides back and forth.', 'Tap to drop it on the stack. What hangs over the edge falls off.'], ['Land it exactly for a Perfect!', 'Perfects in a row score more, and three in a row grow the cushion back.'], ['Golden cushions every 10 floors, and Berries:', 'a Berry counts only if it lands on the stack.'], ['A point a floor, climbing into space.', 'It speeds up every floor and starts swinging and changing pace. Miss the stack and it\'s over.']],
  make(api) {
    const stack = [{ x: (W - START) / 2, w: START }], falling = [], bits = [], pops = [], calm = calmFx();
    let mov = null, speed = 95, cam = 0, perfect = 0, streak = 0, zone = 0, fade = 0, clock = 0, shakeTo = 0, shakeBy = 0, munch = 0, land = 0;
    const top = () => stack[stack.length - 1];
    const yOf = (n) => H - BASE - (n + 1) * SLAB + cam;
    const pop = (x, y, text, colour = '#ffd84a') => pops.push({ x, y, text, colour, t: 0 });
    const burst = (x, y, colour, n, sp = 90) => { for (let i = 0; i < n && bits.length < 120; i++) { const a = rand(0, TAU), v = rand(sp * 0.3, sp); bits.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, life: rand(0.35, 0.7), colour, r: rand(1.5, 3) }); } };
    const shake = (n, ms) => { if (!calm) { shakeTo = performance.now() + ms; shakeBy = n; } };
    /** The next cushion, from the side the last went to: golden every tenth floor, sometimes a Berry riding on it. */
    const serve = (dir) => {
      const n = stack.length, w = top().w;
      mov = { x: dir > 0 ? -w * 0.3 : W - w * 0.7, w, dir, t: 0, gold: n % 10 === 0, berry: n % 10 && n > 2 && Math.random() < 0.22 ? rand(0.2, 0.8) : null, pace: n >= 45 ? rand(0.8, 1.25) : 1 };
    };
    serve(1);
    return {
      tick(dt) {
        clock += dt;
        const n = stack.length;
        mov.t += dt;
        // from floor 30 it swings in eased arcs, quickest in the middle, so a steady rhythm no longer lands it
        const ease = n >= 30 ? 0.55 + 0.9 * Math.sin(Math.PI * Math.max(0.05, Math.min(0.95, (mov.x + mov.w / 2) / W))) : 1;
        mov.x += mov.dir * speed * ease * mov.pace * dt;
        if (mov.x < -mov.w * 0.4) { mov.x = -mov.w * 0.4; mov.dir = 1; }
        if (mov.x + mov.w > W + mov.w * 0.4) { mov.x = W + mov.w * 0.4 - mov.w; mov.dir = -1; }
        const want = Math.max(0, (n - 9) * SLAB);
        cam += (want - cam) * Math.min(1, dt * 4);
        for (const f of falling) { f.vy += 900 * dt; f.y += f.vy * dt; f.x += f.vx * dt; f.spin += f.vs * dt; }
        while (falling.length && falling[0].y > H + 80) falling.shift();
        for (let i = bits.length - 1; i >= 0; i--) { const b = bits[i]; b.life -= dt; b.x += b.vx * dt; b.y += b.vy * dt; b.vy += 220 * dt; if (b.life <= 0) bits.splice(i, 1); }
        for (let i = pops.length - 1; i >= 0; i--) if ((pops[i].t += dt) > 0.9) pops.splice(i, 1);
        perfect = Math.max(0, perfect - dt); fade = Math.max(0, fade - dt / 2); munch = Math.max(0, munch - dt); land = Math.max(0, land - dt);
      },
      down() {
        const t = top(), l = Math.max(mov.x, t.x), r = Math.min(mov.x + mov.w, t.x + t.w), n = stack.length, y = yOf(n - 1);
        if (r - l <= 0) { falling.push({ x: mov.x, w: mov.w, y, vy: 0, vx: mov.dir * 60, spin: 0, vs: mov.dir * 3, z: zone, gold: mov.gold }); shake(5, 500); api.sound('fx-poof', 'cancel'); return api.over('It toppled!'); }
        let gain = 1;
        const exact = Math.abs(mov.x - t.x) < 4;
        if (exact) {
          streak++;
          const grow = streak >= 3 ? Math.min(START - t.w, 8) : 0;
          stack.push({ x: Math.max(0, t.x - grow / 2), w: t.w + grow, gold: mov.gold });
          gain += Math.min(5, streak);
          perfect = 0.8; burst(W / 2, y, '#ffffff', 10, 120);
          api.sound(streak >= 3 ? 'stat-up' : 'fx-ding', 'plink-2');
          if (grow) api.say(`${streak} Perfects in a row! The cushion grows.`);
        } else {
          if (streak >= 3) api.say('Streak broken.');
          streak = 0;
          stack.push({ x: l, w: r - l, gold: mov.gold });
          if (mov.x < l) falling.push({ x: mov.x, w: l - mov.x, y, vy: 0, vx: -40, spin: 0, vs: -2.5, z: zone, gold: mov.gold });
          if (mov.x + mov.w > r) falling.push({ x: r, w: mov.x + mov.w - r, y, vy: 0, vx: 40, spin: 0, vs: 2.5, z: zone, gold: mov.gold });
          api.sound('fx-pop', 'plink-1');
          burst(l, y + SLAB - 2, '#e8e0d0', 3, 50); burst(r, y + SLAB - 2, '#e8e0d0', 3, 50);
        }
        if (mov.gold) { const b = exact ? 10 : 3; gain += b; api.say(`Golden cushion! +${b}`); burst(W / 2, y, '#ffd84a', 16, 140); }
        if (mov.berry !== null) {
          const bx = mov.x + mov.w * mov.berry;
          if (bx > l && bx < r) { gain += 3; munch = 0.8; pop(bx, y - 10, 'Berry +3', '#9ac8ff'); api.sound('plink-2'); }
          else { falling.push({ x: bx - 6, w: 12, y: y - 12, vy: -80, vx: mov.dir * 30, spin: 0, vs: 6, berry: true }); pop(bx, y - 10, 'Lost it!', '#ff9a9a'); }
        }
        api.add(gain);
        if (gain > 1) pop(W / 2, y - 8, `+${gain}`, exact ? '#ffd84a' : '#ffffff');
        land = 0.12; shake(1.5, 120);
        const z = zoneOf(stack.length - 1);
        if (z !== zone) { zone = z; fade = 1; api.say(`${ZONES[z].name}! Floor ${stack.length - 1}.`); api.sound('stat-up'); }
        speed = Math.min(300 + Math.max(0, stack.length - 30) * 2, speed + 7);
        serve(mov.dir);
      },
      key(k, down) { if (down && (k === 'act' || k === 'up' || k === 'down')) this.down(); },
      draw(g, now) {
        const sc = g.getTransform().a;
        g.save();
        if (now < shakeTo) g.translate(rand(-shakeBy, shakeBy), rand(-shakeBy, shakeBy));
        g.drawImage(band(zone, sc), 0, -2, W, H + 4);
        if (fade > 0 && zone > 0) { g.globalAlpha = fade; g.drawImage(band(zone - 1, sc), 0, -2, W, H + 4); g.globalAlpha = 1; }
        FLYERS[zone].forEach(([mon, y, rate, h], i) => drawMon(g, mon, ((now / 1000 * rate + i * 150) % (W + 60)) - 30, y + Math.sin(now / 600 + i) * 6, h, i % 2 === 0));
        const gy = H - BASE + cam;
        if (gy < H + 10) {
          g.fillStyle = '#4a8a3a'; g.fillRect(0, gy, W, BASE + 10);
          g.fillStyle = '#5aa04a'; g.fillRect(0, gy, W, 4);
          g.fillStyle = '#3a7a2a'; for (let i = 0; i < 20; i++) g.fillRect(noise(i) * W, gy + 8 + noise(i + 5) * 26, 6, 2);
          drawMon(g, 'snorlax', W - 40, gy + 26 - (munch ? Math.abs(Math.sin(now / 60)) * 3 : 0), 52);
          const zz = (now / 40) % 30;
          g.globalAlpha = 1 - zz / 30; banner(g, 'z', W - 22 + zz * 0.3, gy - 30 - zz, 12, '#c8e0ff'); banner(g, 'Z', W - 14 + zz * 0.2, gy - 44 - zz, 14, '#c8e0ff'); g.globalAlpha = 1;
        }
        const cushion = (x, y, w, i, gold, z = zoneOf(i)) => {
          const [a, b] = gold ? ['#c89a20', '#fff0a0'] : ZONES[z].cushion;
          g.fillStyle = 'rgba(0, 0, 0, 0.25)'; g.fillRect(x + 1, y + SLAB - 3, w, 2);
          g.fillStyle = a; g.beginPath(); g.roundRect(x, y, w, SLAB - 2, Math.min(7, w / 2)); g.fill();
          g.fillStyle = b; g.beginPath(); g.roundRect(x + Math.min(5, w * 0.15), y + 4, Math.max(0, w - Math.min(10, w * 0.3)), SLAB - 10, 4); g.fill();
          g.fillStyle = 'rgba(255, 255, 255, 0.3)'; g.fillRect(x + 4, y + 1.5, Math.max(0, w - 8), 2);
          if (w > 30) { g.fillStyle = a; g.fillRect(x + w / 2 - 1, y + 8, 2, 2); }
        };
        stack.forEach((s, i) => { const y = yOf(i - 1); if (y < H + SLAB && y > -SLAB) cushion(s.x, y + (i === stack.length - 1 && land ? land * 10 : 0), s.w, i, s.gold); });
        for (const f of falling) {
          g.save(); g.translate(f.x + f.w / 2, f.y + SLAB / 2); g.rotate(f.spin);
          if (f.berry) { g.fillStyle = '#3a7aea'; g.beginPath(); g.arc(0, 0, 6, 0, TAU); g.fill(); }
          else cushion(-f.w / 2, -SLAB / 2, f.w, 0, f.gold, f.z);
          g.restore();
        }
        if (mov) {
          const y = yOf(stack.length - 1);
          if (mov.gold) { g.fillStyle = `rgba(255, 230, 120, ${0.25 + 0.15 * Math.sin(now / 90)})`; g.fillRect(mov.x - 4, y - 4, mov.w + 8, SLAB + 6); }
          cushion(mov.x, y, mov.w, stack.length, mov.gold);
          if (mov.berry !== null) { const bx = mov.x + mov.w * mov.berry; g.fillStyle = '#1a3a8a'; g.beginPath(); g.arc(bx, y - 5, 6, 0, TAU); g.fill(); g.fillStyle = '#3a7aea'; g.beginPath(); g.arc(bx, y - 5, 4.8, 0, TAU); g.fill(); g.fillStyle = '#3aa040'; g.fillRect(bx, y - 12, 4, 2); }
          g.fillStyle = 'rgba(255, 255, 255, 0.18)'; g.fillRect(top().x, y + SLAB - 2, 2, H); g.fillRect(top().x + top().w - 2, y + SLAB - 2, 2, H);
        }
        for (const b of bits) { g.globalAlpha = Math.min(1, b.life * 3); g.fillStyle = b.colour; g.fillRect(b.x - b.r / 2, b.y - b.r / 2, b.r, b.r); }
        g.globalAlpha = 1;
        g.restore();
        for (const p of pops) { g.globalAlpha = 1 - p.t / 0.9; banner(g, p.text, p.x, p.y - p.t * 28, 12, p.colour); }
        g.globalAlpha = 1;
        banner(g, `Floor ${stack.length - 1}`, 46, 18, 13);
        if (streak >= 2) banner(g, `Perfect x${streak}`, W - 52, 18, 12, '#ffd84a');
        if (perfect) banner(g, 'PERFECT!', W / 2, 60, 26 * (1 + perfect * 0.15), '#ffd84a');
        if (fade > 0 && zone > 0) { g.globalAlpha = Math.min(1, fade * 2); banner(g, ZONES[zone].name.toUpperCase(), W / 2, 96, 18, '#ffffff', W * 0.85); g.globalAlpha = 1; }
      },
    };
  },
}, onClose);
