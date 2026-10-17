/* arcade-flap.js  -  Pidgey Flap, a home arcade game (js/arcade-kit.js; it took Magikarp Fishing's place, 2026-10-12, the
   user's call): Pidgey flies on by itself, a tap flaps it up, and it slips through the gaps between tree trunks. Since
   2026-10-17 (the user's ask: every arcade game far more detailed, and harder the further you go) it flies through four
   skies (`LOOKS`: morning forest, sunset, a night of fireflies, a thunderstorm whose wind pushes it about, then round
   again), each painted once in layers; the gaps keep narrowing and swinging further apart, trunks start sliding up and
   down (12), Hoothoot and Zubat patrol inside gaps (20), and Spearow charge in at Pidgey's height after a warning (30).
   Oran Berries in gaps are a point each, a Protect bubble lets it through one trunk, and it evolves into Pidgeotto at
   30 and Pidgeot at 60. A point a gap. */

import { runArcade, drawMon, rand, pick, banner, stamp } from './arcade-kit.js';
import { calmFx } from './prefs.js';

const W = 300, H = 360, GROUND = 330, GRAV = 900, FLAP = -290, BIRD_X = 90, R = 13, TRUNK = 46, TAU = Math.PI * 2;
const LOOKS = [
  { name: 'Viridian Morning', sky: ['#58b0f0', '#dcf2ff'], orb: ['#fff7c0', 230, 56, 22], far: '#7aa8a0', mid: '#4f9a4a', grass: '#5aa03a', blade: '#3e8a2a', bark: ['#6a4022', '#9a6a3a', '#5a341a'], leaf: '#3e9a3a', guard: ['hoothoot', 'zubat'] },
  { name: 'Sunset Woods', sky: ['#e86040', '#ffd8a0'], orb: ['#ffe070', 70, 120, 30], far: '#a85a48', mid: '#6a5a2a', grass: '#7a8a30', blade: '#5a6a20', bark: ['#5a3018', '#8a5a2a', '#4a2810'], leaf: '#7a8a2a', guard: ['hoothoot', 'zubat'] },
  { name: 'Firefly Night', sky: ['#081030', '#2a3a6a'], orb: ['#f4f0d8', 240, 50, 16], far: '#122040', mid: '#16303a', grass: '#1e4a3a', blade: '#123a2a', bark: ['#2a2030', '#4a3a48', '#1e1622'], leaf: '#1e4a40', guard: ['hoothoot', 'noctowl'], night: true },
  { name: 'Thunderstorm', sky: ['#2a3040', '#6a7888'], orb: null, far: '#3a4450', mid: '#2a3a34', grass: '#3a5a3a', blade: '#2a4a2a', bark: ['#3a2a20', '#5a4a3a', '#2a1e16'], leaf: '#2a4a32', guard: ['zubat', 'golbat'], storm: true },
];
const EVOS = [[0, 'pidgey'], [30, 'pidgeotto'], [60, 'pidgeot']];
const noise = (i) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

const skyArt = (L) => (g) => {
  const sky = g.createLinearGradient(0, 0, 0, GROUND); sky.addColorStop(0, L.sky[0]); sky.addColorStop(1, L.sky[1]);
  g.fillStyle = sky; g.fillRect(0, 0, W, GROUND);
  if (L.orb) {
    const [c, x, y, r] = L.orb, glow = g.createRadialGradient(x, y, r * 0.5, x, y, r * 3.5);
    glow.addColorStop(0, `${c}99`); glow.addColorStop(1, `${c}00`);
    g.fillStyle = glow; g.fillRect(0, 0, W, GROUND);
    g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  }
  if (L.night) for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(255, 255, 230, ${0.25 + noise(i) * 0.6})`; g.fillRect(noise(i + 4) * W, noise(i + 30) * GROUND * 0.6, 1.3, 1.3); }
  if (L.storm) { g.fillStyle = 'rgba(30, 34, 44, 0.75)'; for (let i = 0; i < 9; i++) { g.beginPath(); g.ellipse(noise(i) * W, 10 + noise(i + 3) * 70, 60, 20, 0, 0, TAU); g.fill(); } }
};
const farArt = (L) => (g) => {
  g.fillStyle = L.far;
  for (let i = 0; i < 16; i++) {   // a far treeline of pines
    const x = i * 25 + noise(i) * 10, h = 50 + noise(i + 8) * 40;
    g.beginPath(); g.moveTo(x - 16, 120); g.lineTo(x, 120 - h); g.lineTo(x + 16, 120); g.fill();
  }
  g.fillRect(0, 100, 400, 20);
};
const midArt = (L) => (g) => {
  g.fillStyle = L.mid;
  for (let i = 0; i < 7; i++) { const cx = i * 64 + noise(i) * 20; g.beginPath(); g.arc(cx, 70, 30 + noise(i + 2) * 18, Math.PI, 0); g.fill(); }
  g.fillRect(0, 66, 448, 6);
  g.fillStyle = 'rgba(255, 255, 255, 0.07)';
  for (let i = 0; i < 7; i++) { const cx = i * 64 + noise(i) * 20; g.beginPath(); g.arc(cx - 8, 56, 10, 0, TAU); g.fill(); }
};
const groundArt = (L) => (g) => {
  g.fillStyle = L.grass; g.fillRect(0, 0, 96, H - GROUND);
  g.fillStyle = 'rgba(0, 0, 0, 0.2)'; g.fillRect(0, 4, 96, 2);
  g.fillStyle = L.blade;
  for (let x = 0; x < 96; x += 5) { g.beginPath(); g.moveTo(x, 4); g.lineTo(x + 2, -5 - noise(x) * 5); g.lineTo(x + 4, 4); g.fill(); }
  for (let i = 0; i < 8; i++) g.fillRect(noise(i) * 90, 10 + noise(i + 3) * 16, 8, 2);
  for (const [x, c] of [[18, '#ffe060'], [60, '#ff8ab0'], [80, '#ffffff']]) { g.fillStyle = c; g.beginPath(); g.arc(x, -2, 2.2, 0, TAU); g.fill(); }
};
const barkArt = (L) => (g) => {
  const tg = g.createLinearGradient(0, 0, TRUNK, 0); tg.addColorStop(0, L.bark[0]); tg.addColorStop(0.45, L.bark[1]); tg.addColorStop(1, L.bark[2]);
  g.fillStyle = tg; g.fillRect(0, 0, TRUNK, 64);
  g.strokeStyle = 'rgba(30, 14, 4, 0.4)'; g.lineWidth = 1.5;
  for (const k of [12, 38]) { g.beginPath(); g.moveTo(8, k); g.quadraticCurveTo(TRUNK / 2, k + 6, TRUNK - 8, k); g.stroke(); }
  g.beginPath(); g.moveTo(14, 0); g.lineTo(12, 64); g.moveTo(32, 0); g.lineTo(34, 64); g.stroke();
  g.fillStyle = 'rgba(30, 14, 4, 0.5)'; g.beginPath(); g.ellipse(26, 52, 3, 4, 0, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255, 255, 255, 0.08)'; g.fillRect(16, 0, 5, 64);
};
/** The trunk's end at a gap: a sawn ring with moss and leaves dangling, `up` for the top trunk's lower end. */
const capArt = (L, up) => (g) => {
  const y = up ? 2 : 8;
  g.fillStyle = L.bark[2]; g.fillRect(0, y, TRUNK + 8, 8);
  g.fillStyle = L.bark[1]; g.fillRect(2, y + 1, TRUNK + 4, 3);
  g.fillStyle = L.leaf;
  for (let i = 0; i < 9; i++) { const x = 3 + i * 5.5, d = 3 + noise(i + (up ? 9 : 0)) * 6; g.beginPath(); g.ellipse(x, up ? y + 8 + d / 2 : y - d / 2, 3.5, d / 2 + 2, 0, 0, TAU); g.fill(); }
};
const berryArt = (g) => {
  g.fillStyle = '#1a3a8a'; g.beginPath(); g.arc(7, 9, 7, 0, TAU); g.fill();
  g.fillStyle = '#3a7aea'; g.beginPath(); g.arc(7, 9, 5.6, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255, 255, 255, 0.7)'; g.beginPath(); g.arc(5, 7, 1.8, 0, TAU); g.fill();
  g.fillStyle = '#3aa040'; g.beginPath(); g.ellipse(9, 2, 4, 2, -0.5, 0, TAU); g.fill();
};

export const openFlap = (onClose) => runArcade({
  id: 'flap', title: 'Pidgey Flap', colour: '#c8904a', W, H, stick: false,
  intro: 'Tap to flap! Fly Pidgey through the gaps.',
  sounds: ['fx-ding', 'fx-poof', 'fx-whoosh', 'thunder'],
  help: [['Tap (or press Space) to flap.', 'Pidgey drops when you stop.'], ['Fly through the gaps between the trees.', 'Touch a trunk or the ground and it\'s over. A point a gap, a point a Berry.'], ['It gets harder and harder:', 'narrower gaps, sliding trunks, Hoothoot guarding gaps, Spearow charging after a "!", storm winds.'], ['A Protect bubble lets you through one trunk.', 'Pidgey evolves at 30 and 60!']],
  make(api) {
    let y = H * 0.42, vy = 0, x0 = 0, speed = 110, next = 0.4, flapped = 0, dead = false, clock = 0, look = 0, fade = 0, shield = 0, safe = 0, evo = 0, evoFlash = 0, charge = 8, shakeTo = 0, bolt = 0, spin = 0, lastTop = 140;
    const trees = [], bits = [], pops = [], foes = [], calm = calmFx();
    const s = () => api.score;
    const lookAt = (n) => (n < 10 ? 0 : n < 25 ? 1 : n < 40 ? 2 : 3 + Math.floor((n - 40) / 20));
    const L = () => LOOKS[look % LOOKS.length];
    const gap = () => Math.max(84, 140 - s() * 1.6 - Math.max(0, s() - 30) * 0.4);
    const pop = (x, yy, text, colour = '#ffd84a') => pops.push({ x, y: yy, text, colour, t: 0 });
    const burst = (x, yy, colour, n, sp = 100) => { for (let i = 0; i < n && bits.length < 140; i++) { const a = rand(0, TAU), v = rand(sp * 0.3, sp); bits.push({ x, y: yy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(0.4, 0.8), colour, r: rand(1.5, 3) }); } };
    const flap = () => { if (dead) return; vy = FLAP; flapped = 0.18; api.sound('select'); if (bits.length < 140) bits.push({ x: BIRD_X - 6, y: y + 4, vx: -40, vy: 30, life: 0.8, colour: '#e8d0a0', r: 2.5, feather: true }); };
    const crash = (text) => { dead = true; shakeTo = performance.now() + 450; burst(BIRD_X, y, '#c8a070', 16, 160); api.sound('fx-poof', 'cancel'); api.over(text); };

    const plant = () => {
      const n = s(), g = gap(), swing = Math.min(GROUND - 90 - g, 70 + n * 3);
      const top = Math.max(40, Math.min(GROUND - 40 - g, lastTop + rand(-swing, swing)));
      lastTop = top;
      const moving = n >= 12 && Math.random() < Math.min(0.7, (n - 12) * 0.035);
      const t = { x: W + 10, top, base: top, g, passed: false, amp: moving ? Math.min(46, 12 + (n - 12) * 0.7) : 0, ph: rand(0, TAU), rate: rand(1.2, 1.8) + n * 0.01 };
      trees.push(t);
      if (n >= 20 && Math.random() < Math.min(0.5, (n - 20) * 0.03)) foes.push({ tree: t, kind: 'guard', mon: pick(L().guard), ph: rand(0, TAU) });
      else if (Math.random() < 0.35) foes.push({ tree: t, kind: Math.random() < 0.12 && n >= 8 && !shield ? 'shield' : 'berry', dy: rand(-0.25, 0.25) });
      next = Math.max(150, 180 - n * 0.5) / speed;
    };
    const ahead = (f) => f.tree ? [f.tree.x + TRUNK / 2, f.tree.top + f.tree.g / 2 + (f.kind === 'guard' ? Math.sin(clock * 2.4 + f.ph) * (f.tree.g / 2 - 18) : f.dy * f.tree.g)] : [f.x, f.y];

    return {
      tick(dt) {
        clock += dt;
        const n = s();
        speed = Math.min(205, 110 + n * 2.5);
        const lk = lookAt(n);
        if (lk !== look) { look = lk; fade = 1; api.say(`${L().name}!${lk >= LOOKS.length ? ' Round again, harder.' : ''}`); api.sound('stat-up'); }
        fade = Math.max(0, fade - dt / 1.6);
        const want = EVOS.filter(([at]) => n >= at).length - 1;
        if (want > evo) { evo = want; evoFlash = 1; api.say(`Pidgey evolved into ${EVOS[evo][1][0].toUpperCase()}${EVOS[evo][1].slice(1)}!`); api.sound('stat-up'); burst(BIRD_X, y, '#ffffff', 20, 140); }
        evoFlash = Math.max(0, evoFlash - dt); safe = Math.max(0, safe - dt);
        const wind = L().storm ? Math.sin(clock * 0.9) * 160 + Math.sin(clock * 2.3) * 60 : 0;
        vy += (GRAV + wind) * dt; y += vy * dt; x0 += speed * dt; flapped = Math.max(0, flapped - dt);
        spin = Math.max(-0.5, Math.min(0.9, vy / 500));
        if ((next -= dt) <= 0) plant();
        for (const t of trees) {
          t.x -= speed * dt;
          if (t.amp) t.top = Math.max(20, Math.min(GROUND - 30 - t.g, t.base + Math.sin(clock * t.rate + t.ph) * t.amp));
          if (!t.passed && t.x + TRUNK < BIRD_X - R) { t.passed = true; api.add(1); api.sound('plink-2'); }
        }
        while (trees.length && trees[0].x < -TRUNK - 10) trees.shift();
        if (n >= 30 && (charge -= dt) <= 0) { charge = Math.max(3.5, 9 - (n - 30) * 0.08) + rand(0, 3); foes.push({ kind: 'charge', mon: L().night ? 'noctowl' : 'spearow', x: W + 30, y, warn: 1.1 }); api.sound('fx-whoosh', 'select'); }
        for (let i = foes.length - 1; i >= 0; i--) {
          const f = foes[i];
          if (f.kind === 'charge') { if (f.warn > 0) f.warn -= dt; else f.x -= (speed + 150) * dt; }
          const [fx, fy] = ahead(f);
          if (fx < -30 || f.gone) { foes.splice(i, 1); continue; }
          if (Math.hypot(fx - BIRD_X, fy - y) < R + (f.kind === 'berry' || f.kind === 'shield' ? 9 : 4)) {
            if (f.kind === 'berry') { f.gone = true; api.add(1); pop(fx, fy - 10, '+1'); api.sound('plink-1'); burst(fx, fy, '#7ab0ff', 6); }
            else if (f.kind === 'shield') { f.gone = true; shield = 1; api.sound('fx-ding', 'stat-up'); api.say('Protect! You can pass through one trunk.'); pop(fx, fy - 12, 'PROTECT', '#a8f0ff'); }
            else if (!safe) {
              if (shield) { shield = 0; safe = 1; f.gone = true; burst(fx, fy, '#ffffff', 12); api.sound('fx-ding'); }
              else return crash(f.kind === 'charge' ? 'A Spearow rammed you!' : 'Bonked a guard!');
            }
          }
        }
        if (L().storm && !calm && Math.random() < dt * 0.25) { bolt = 0.25; api.sound('thunder', 'fx-zap'); }
        bolt = Math.max(0, bolt - dt);
        if (L().night && Math.random() < dt * 3 && bits.length < 140) bits.push({ x: rand(0, W), y: rand(60, GROUND - 20), vx: rand(-10, 10), vy: rand(-10, 10), life: 2, colour: '#e8ff70', r: 1.8, glow: true });
        for (let i = bits.length - 1; i >= 0; i--) { const b = bits[i]; b.life -= dt; b.x += b.vx * dt; b.y += b.vy * dt; if (!b.glow) b.vy += (b.feather ? 40 : 200) * dt; if (b.life <= 0) bits.splice(i, 1); }
        for (let i = pops.length - 1; i >= 0; i--) if ((pops[i].t += dt) > 0.8) pops.splice(i, 1);
        if (y < R) { y = R; vy = Math.max(0, vy); }
        if (y + R >= GROUND) return crash('Splat!');
        for (const t of trees) {
          const nx = Math.max(t.x, Math.min(BIRD_X, t.x + TRUNK));
          for (const [a, b] of [[-100, t.top], [t.top + t.g, GROUND]]) {
            const ny = Math.max(a, Math.min(y, b));
            if (Math.hypot(BIRD_X - nx, y - ny) < R - 2) {
              if (safe) continue;
              if (shield) { shield = 0; safe = 0.9; burst(BIRD_X, y, '#a8f0ff', 14); api.sound('fx-ding', 'select'); api.say('Protect saved you!'); continue; }
              return crash('Bonk!');
            }
          }
        }
      },
      down() { flap(); },
      key(k, down) { if (down && (k === 'act' || k === 'up')) flap(); },
      draw(g, now) {
        const shake = !calm && now < shakeTo ? (shakeTo - now) / 450 * 4 : 0;
        g.save();
        if (shake) g.translate(rand(-shake, shake), rand(-shake, shake));
        const scene = (i) => {
          const lk = LOOKS[i], tile = (key, off, w, yy, h, paint) => { for (let x = -(off % w); x < W; x += w) stamp(g, key, x, yy, w, h, paint); };
          stamp(g, `flap-sky-${i}`, 0, 0, W, GROUND, skyArt(lk));
          tile(`flap-far-${i}`, x0 * 0.1, 400, GROUND - 150, 120, farArt(lk));
          tile(`flap-mid-${i}`, x0 * 0.35, 448, GROUND - 70, 72, midArt(lk));
        };
        const li = look % LOOKS.length;
        scene(li);
        if (fade > 0 && look > 0) { g.globalAlpha = fade; scene((look - 1) % LOOKS.length); g.globalAlpha = 1; }
        const lk = L();
        for (const t of trees) {
          for (let yy = t.top - 64; yy > -64; yy -= 64) stamp(g, `flap-bark-${li}`, Math.round(t.x), Math.round(yy), TRUNK, 64, barkArt(lk));
          for (let yy = t.top + t.g; yy < GROUND; yy += 64) stamp(g, `flap-bark-${li}`, Math.round(t.x), Math.round(yy), TRUNK, 64, barkArt(lk));
          stamp(g, `flap-capu-${li}`, Math.round(t.x - 4), Math.round(t.top - 10), TRUNK + 8, 22, capArt(lk, true));
          stamp(g, `flap-capd-${li}`, Math.round(t.x - 4), Math.round(t.top + t.g - 8), TRUNK + 8, 22, capArt(lk, false));
        }
        for (let x = -((x0) % 96); x < W; x += 96) stamp(g, `flap-ground-${li}`, x, GROUND - 6, 96, H - GROUND + 6, groundArt(lk));
        if (lk.night) { g.fillStyle = 'rgba(8, 10, 40, 0.2)'; g.fillRect(0, 0, W, H); }
        for (const f of foes) {
          const [fx, fy] = ahead(f);
          if (f.kind === 'berry') stamp(g, 'flap-berry', Math.round(fx - 7), Math.round(fy - 8 + Math.sin(now / 150 + fx) * 2), 14, 16, berryArt);
          else if (f.kind === 'shield') { g.fillStyle = `rgba(140, 230, 255, ${0.35 + 0.15 * Math.sin(now / 120)})`; g.beginPath(); g.arc(fx, fy, 10, 0, TAU); g.fill(); g.strokeStyle = '#d8f8ff'; g.lineWidth = 1.5; g.stroke(); banner(g, 'P', fx, fy + 1, 11, '#2a8ad8'); }
          else if (f.kind === 'charge' && f.warn > 0) { if (Math.floor(now / 120) % 2) banner(g, '!', W - 14, fy, 24, '#ff4040'); }
          else drawMon(g, f.mon, fx, fy + 14, 28);
        }
        if (lk.storm) {   // rain, one path a frame
          g.strokeStyle = 'rgba(200, 220, 255, 0.35)'; g.lineWidth = 1; g.beginPath();
          for (let i = 0; i < 36; i++) { const rx = ((i * 53 + now * 0.35) % (W + 40)) - 20, ry = (i * 97 + now * 0.9) % GROUND; g.moveTo(rx, ry); g.lineTo(rx - 6, ry + 14); }
          g.stroke();
        }
        for (const b of bits) {
          g.globalAlpha = b.glow ? 0.5 + 0.5 * Math.sin(now / 90 + b.x) : Math.min(1, b.life * 2);
          g.fillStyle = b.colour; g.fillRect(b.x - b.r / 2, b.y - b.r / 2, b.r, b.feather ? b.r * 0.6 : b.r);
        }
        g.globalAlpha = 1;
        const mon = EVOS[evo][1], blink = safe && Math.floor(now / 70) % 2;
        if (!blink) {
          g.save(); g.translate(BIRD_X, y); g.rotate(spin);
          drawMon(g, mon, 0, R + 4 - (flapped > 0 ? 3 : 0), 34 + evo * 4, true);
          g.restore();
        }
        if (shield) { g.strokeStyle = `rgba(160, 240, 255, ${0.6 + 0.3 * Math.sin(now / 100)})`; g.lineWidth = 2; g.beginPath(); g.arc(BIRD_X, y, R + 8, 0, TAU); g.stroke(); }
        g.restore();
        if (bolt && !calm) { g.fillStyle = `rgba(255, 255, 255, ${bolt * 1.6})`; g.fillRect(0, 0, W, H); }
        if (evoFlash && !calm) { g.fillStyle = `rgba(255, 255, 255, ${evoFlash * 0.6})`; g.fillRect(0, 0, W, H); }
        for (const p of pops) { g.globalAlpha = 1 - p.t / 0.8; banner(g, p.text, p.x, p.y - p.t * 24, 12, p.colour); }
        g.globalAlpha = 1;
        banner(g, String(api.score), W / 2, 34, 28);
        if (fade > 0 && look > 0) { g.globalAlpha = Math.min(1, fade * 2); banner(g, L().name.toUpperCase(), W / 2, 70, 18, '#ffd84a', W * 0.85); g.globalAlpha = 1; }
      },
    };
  },
}, onClose);
