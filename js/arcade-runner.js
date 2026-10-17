/* arcade-runner.js  -  Ponyta Dash, a home arcade game (js/arcade-kit.js): Ponyta gallops on by itself, a tap jumps
   (held a little longer, higher; ▼ drops it fast). Since 2026-10-17 (the user's ask: every arcade game far more detailed,
   harder the further you go) it runs through four lands every STAGE_M metres, each painted once in layers that scroll
   at their own speeds (`LANDS`: Route 1's meadow, a sunset canyon, a volcano, starlit plains, then round again faster),
   and what comes at it grows every 250 m (`tier()`): rocks and logs, then pits, low flyers and pairs, then rolling
   Geodude, tall boulders and Diglett popping up, then diving Spearow and long pits, then triples. Oran Berries in rows
   score more the more are caught in a row (x5 at most); a Protect bubble takes one hit; a Fire Stone makes it a
   Rapidash for a few seconds, burning through everything. A point a metre plus the bonuses. */

import { runArcade, drawMon, rand, pick, banner, stamp } from './arcade-kit.js';
import { calmFx } from './prefs.js';

const W = 320, H = 220, GROUND = 180, GRAV = 1500, JUMP = 440, FALL = 2.2;   // a hop drops quicker than it rises (the user's ask, 2026-10-12: it floated)
const PX = 60, PW = 24, PH = 32, STAGE_M = 500, BLAZE_S = 5, TAU = Math.PI * 2;
const LANDS = [
  { name: 'Route 1 Meadow', sky: ['#4ea8ec', '#d8f2ff'], orb: ['#fff6b0', 250, 46, 20], far: '#8fb4d0', mid: '#4f9444', top: '#7cc050', soil: '#8a5a30', fleck: '#5a9a30', pit: '#3a90d8', flyer: 'pidgey', swoop: 'spearow', prop: 'tree' },
  { name: 'Sunset Canyon', sky: ['#e8603c', '#fde0a8'], orb: ['#ffe070', 236, 98, 30], far: '#c87a58', mid: '#a05a34', top: '#d89058', soil: '#a05a28', fleck: '#7a4018', pit: '#4a2410', flyer: 'spearow', swoop: 'fearow', prop: 'cactus' },
  { name: 'Cinder Volcano', sky: ['#1e0814', '#b8401c'], orb: ['#ff9a50', 70, 40, 14], far: '#3e1414', mid: '#240c0c', top: '#4a3230', soil: '#2a1a18', fleck: '#ff6a20', pit: '#ff5a10', flyer: 'zubat', swoop: 'golbat', prop: 'snag', embers: true },
  { name: 'Starlit Plains', sky: ['#060a2a', '#383274'], orb: ['#f4f0d8', 262, 38, 13], far: '#1a2050', mid: '#163434', top: '#2a5a48', soil: '#1a2a20', fleck: '#4a8a6a', pit: '#0c1428', flyer: 'hoothoot', swoop: 'noctowl', prop: 'grass', stars: true },
];
/* a fixed scatter, so a painted layer is the same every time it's painted */
const noise = (i) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

const skyArt = (L) => (g) => {
  const sky = g.createLinearGradient(0, 0, 0, GROUND); sky.addColorStop(0, L.sky[0]); sky.addColorStop(1, L.sky[1]);
  g.fillStyle = sky; g.fillRect(0, 0, W, GROUND);
  const [c, x, y, r] = L.orb, glow = g.createRadialGradient(x, y, r * 0.6, x, y, r * 3.2);
  glow.addColorStop(0, `${c}aa`); glow.addColorStop(1, `${c}00`);
  g.fillStyle = glow; g.fillRect(0, 0, W, GROUND);
  g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  if (L.stars) {
    for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(255, 255, 240, ${0.3 + noise(i) * 0.7})`; g.fillRect(noise(i + 9) * W, noise(i + 40) * GROUND * 0.75, noise(i + 3) > 0.85 ? 2 : 1, noise(i + 3) > 0.85 ? 2 : 1); }
    g.fillStyle = L.sky[0]; g.beginPath(); g.arc(x + 5, y - 3, r * 0.9, 0, TAU); g.fill();   // a crescent
  } else if (L.embers) {
    g.fillStyle = 'rgba(40, 10, 10, 0.55)';   // ash clouds
    for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(noise(i) * W, 20 + noise(i + 5) * 50, 50, 12, 0, 0, TAU); g.fill(); }
  } else {
    g.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 5; i++) { const cx = noise(i + 2) * W, cy = 18 + noise(i + 7) * 60; g.beginPath(); g.ellipse(cx, cy, 26, 8, 0, 0, TAU); g.ellipse(cx + 14, cy - 6, 15, 8, 0, 0, TAU); g.ellipse(cx - 12, cy - 3, 11, 6, 0, 0, TAU); g.fill(); }
  }
};
const farArt = (L, n) => (g) => {
  g.fillStyle = L.far; g.beginPath(); g.moveTo(0, 100);
  for (let x = 0; x <= 480; x += 24) g.lineTo(x, 100 - 30 - (Math.sin(x / 480 * TAU * 2 + n) * 0.5 + 0.5) * 40 - noise(x + n) * 22);
  g.lineTo(480, 100); g.fill();
  if (L.embers) {   // the volcano itself, glowing at the top
    g.fillStyle = '#4a1a14'; g.beginPath(); g.moveTo(200, 100); g.lineTo(265, 12); g.lineTo(285, 12); g.lineTo(360, 100); g.fill();
    g.fillStyle = '#ff7a20'; g.fillRect(265, 10, 20, 4);
    g.fillStyle = 'rgba(255, 120, 30, 0.5)'; g.beginPath(); g.moveTo(268, 14); g.lineTo(258, 50); g.lineTo(264, 50); g.lineTo(276, 14); g.fill();
  } else if (L.prop === 'tree') {
    g.fillStyle = '#f4f8ff';   // snowy peaks
    for (const x of [120, 340]) { g.beginPath(); g.moveTo(x - 30, 52); g.lineTo(x, 22); g.lineTo(x + 30, 52); g.lineTo(x + 12, 46); g.lineTo(x, 54); g.lineTo(x - 14, 46); g.fill(); g.fillStyle = L.far; g.beginPath(); g.moveTo(x - 60, 100); g.lineTo(x, 26); g.lineTo(x + 60, 100); g.fill(); g.fillStyle = '#f4f8ff'; g.beginPath(); g.moveTo(x - 17, 47); g.lineTo(x, 26); g.lineTo(x + 17, 47); g.lineTo(x + 6, 43); g.lineTo(x, 49); g.lineTo(x - 7, 43); g.fill(); }
  }
  g.fillStyle = 'rgba(255, 255, 255, 0.08)'; g.fillRect(0, 96, 480, 4);
};
const midArt = (L) => (g) => {
  g.fillStyle = L.mid; g.beginPath(); g.moveTo(0, 60);
  for (let x = 0; x <= 480; x += 16) g.lineTo(x, 60 - 16 - Math.sin(x / 480 * TAU * 3) * 9 - noise(x) * 5);
  g.lineTo(480, 60); g.fill();
  for (let i = 0; i < 9; i++) {
    const x = 20 + i * 52 + noise(i) * 20, b = 50 - Math.sin(x / 480 * TAU * 3) * 9;
    if (L.prop === 'tree') { g.fillStyle = '#5a3a1a'; g.fillRect(x - 2, b - 16, 4, 16); g.fillStyle = '#3a7a34'; g.beginPath(); g.arc(x, b - 20, 10, 0, TAU); g.arc(x - 6, b - 14, 7, 0, TAU); g.arc(x + 6, b - 14, 7, 0, TAU); g.fill(); g.fillStyle = 'rgba(255, 255, 255, 0.15)'; g.beginPath(); g.arc(x - 3, b - 24, 4, 0, TAU); g.fill(); }
    else if (L.prop === 'cactus') { g.fillStyle = '#3a6a30'; g.fillRect(x - 3, b - 22, 6, 22); g.fillRect(x - 10, b - 14, 4, 8); g.fillRect(x - 10, b - 10, 8, 4); g.fillRect(x + 6, b - 18, 4, 9); g.fillRect(x + 2, b - 12, 8, 4); }
    else if (L.prop === 'snag') { g.strokeStyle = '#120606'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, b); g.lineTo(x, b - 22); g.moveTo(x, b - 14); g.lineTo(x - 8, b - 22); g.moveTo(x, b - 18); g.lineTo(x + 7, b - 25); g.stroke(); }
    else { g.fillStyle = '#204a3a'; for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(x + k * 3 - 1, b); g.lineTo(x + k * 5, b - 10 - noise(i + k) * 6); g.lineTo(x + k * 3 + 1, b); g.fill(); } }
  }
};
const groundArt = (L) => (g) => {
  g.fillStyle = L.soil; g.fillRect(0, 0, 160, H - GROUND);
  g.fillStyle = L.top; g.fillRect(0, 0, 160, 6);
  g.fillStyle = 'rgba(255, 255, 255, 0.18)'; g.fillRect(0, 0, 160, 1.5);
  g.fillStyle = 'rgba(0, 0, 0, 0.18)'; g.fillRect(0, 6, 160, 2);
  for (let i = 0; i < 16; i++) { g.fillStyle = i % 3 ? L.fleck : 'rgba(255, 255, 255, 0.12)'; g.fillRect(noise(i) * 156, 10 + noise(i + 20) * 26, 3 + noise(i + 5) * 6, 2); }
  g.fillStyle = L.top;
  for (let x = 2; x < 160; x += 7) { g.beginPath(); g.moveTo(x, 1); g.lineTo(x + 1.5, -3 - noise(x) * 3); g.lineTo(x + 3, 1); g.fill(); }
};
const rockArt = (g) => {
  g.fillStyle = '#5a5a68'; g.beginPath(); g.moveTo(0, 24); g.lineTo(3, 9); g.lineTo(10, 1); g.lineTo(18, 4); g.lineTo(23, 14); g.lineTo(24, 24); g.fill();
  g.fillStyle = '#8a8a9a'; g.beginPath(); g.moveTo(4, 12); g.lineTo(10, 3); g.lineTo(16, 5); g.lineTo(12, 13); g.fill();
  g.strokeStyle = '#34343e'; g.lineWidth = 1; g.beginPath(); g.moveTo(14, 12); g.lineTo(17, 20); g.stroke();
};
const logArt = (g) => {
  g.fillStyle = '#6a3e1c'; g.fillRect(0, 2, 42, 16);
  g.fillStyle = '#8a5a2c'; g.fillRect(0, 3, 42, 4);
  g.strokeStyle = '#4a2a10'; g.lineWidth = 1; for (const x of [8, 20, 31]) { g.beginPath(); g.moveTo(x, 8); g.lineTo(x + 5, 8); g.stroke(); }
  g.fillStyle = '#d8aa6a'; g.beginPath(); g.ellipse(42, 10, 5, 8, 0, 0, TAU); g.fill();
  g.strokeStyle = '#8a5a2c'; g.beginPath(); g.ellipse(42, 10, 2.5, 4.5, 0, 0, TAU); g.stroke();
  g.fillStyle = '#4a8a2a'; g.fillRect(12, 0, 6, 3); g.fillRect(14, -2, 2, 3);
};
const tallArt = (g) => {
  for (const [x, y, r, c] of [[14, 46, 13, '#6a6a78'], [13, 25, 11, '#7a7a88'], [15, 8, 8, '#8a8a98']]) {
    g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255, 255, 255, 0.22)'; g.beginPath(); g.arc(x - r * 0.35, y - r * 0.35, r * 0.4, 0, TAU); g.fill();
  }
};
const moundArt = (g) => { g.fillStyle = '#6a4424'; g.beginPath(); g.ellipse(15, 10, 15, 6, 0, Math.PI, 0); g.fill(); g.fillStyle = '#8a5a30'; for (const x of [6, 13, 21]) g.fillRect(x, 6, 3, 2); };
const berryArt = (g) => {
  g.fillStyle = '#1a3a8a'; g.beginPath(); g.arc(7, 9, 7, 0, TAU); g.fill();
  g.fillStyle = '#3a7aea'; g.beginPath(); g.arc(7, 9, 5.6, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255, 255, 255, 0.7)'; g.beginPath(); g.arc(5, 7, 1.8, 0, TAU); g.fill();
  g.fillStyle = '#3aa040'; g.beginPath(); g.ellipse(9, 2, 4, 2, -0.5, 0, TAU); g.fill();
};
const stoneArt = (g) => {
  g.fillStyle = '#a83810'; g.beginPath(); g.moveTo(8, 0); g.lineTo(16, 7); g.lineTo(12, 18); g.lineTo(4, 18); g.lineTo(0, 7); g.closePath(); g.fill();
  g.fillStyle = '#ff8a30'; g.beginPath(); g.moveTo(8, 2); g.lineTo(14, 7); g.lineTo(11, 16); g.lineTo(5, 16); g.lineTo(2, 7); g.closePath(); g.fill();
  g.fillStyle = '#ffe070'; g.beginPath(); g.moveTo(8, 6); g.quadraticCurveTo(12, 10, 8, 14); g.quadraticCurveTo(4, 10, 8, 6); g.fill();
};
const shieldArt = (g) => {
  g.fillStyle = 'rgba(120, 220, 255, 0.35)'; g.beginPath(); g.arc(9, 9, 8, 0, TAU); g.fill();
  g.strokeStyle = '#a8f0ff'; g.lineWidth = 1.6; g.stroke();
  g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(6, 5.5, 3, 1.6, -0.6, 0, TAU); g.fill();
  g.fillStyle = '#2a8ad8'; g.font = '800 8px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('P', 9, 10);
};
const ART = { rock: [24, 24, rockArt], log: [48, 20, logArt], tall: [28, 56, tallArt], berry: [14, 16, berryArt], stone: [16, 18, stoneArt], shield: [18, 18, shieldArt] };

export const openRunner = (onClose) => runArcade({
  id: 'runner', title: 'Ponyta Dash', colour: '#e87830', W, H,
  intro: 'Gallop as far as you can! Tap to jump.',
  sounds: ['fx-ding', 'fx-poof', 'fx-squeak'],
  help: [['Ponyta runs by itself.', 'Tap (or press Space) to jump; hold for higher. ▼ drops you fast.'], ['Rocks, logs, pits, Geodude, Diglett, swooping birds:', 'new ones every 250 m, and it keeps getting faster.'], ['Oran Berries in a row score up to x5.', 'A Protect bubble takes a hit; a Fire Stone makes you a Rapidash that burns through everything.'], ['A point a metre, through four lands', 'and round again, quicker each time.']],
  make(api) {
    let y = 0, vy = 0, held = false, speed = 190, dist = 0, room = 1.2 * 190, bonus = 0, combo = 0, shield = false, blaze = 0, stage = 0, fade = 0, mark = 250;
    let squash = 0, sunk = false, air = 0, gift = rand(10, 16), shakeTo = 0, trail = 0, dead = false;
    const things = [], bits = [], pops = [], calm = calmFx();
    const tier = () => Math.min(6, Math.floor(dist / 250));
    const mult = () => Math.min(5, 1 + Math.floor(combo / 4));
    const land = () => LANDS[stage % LANDS.length];
    const score = () => { const s = Math.floor(dist) + bonus; if (s !== api.score) api.score = s; };
    const pop = (x, y, text, colour = '#ffd84a') => pops.push({ x, y, text, colour, t: 0 });
    const burst = (x, y, colour, n, sp = 120) => { for (let i = 0; i < n && bits.length < 160; i++) { const a = rand(0, TAU), s = rand(sp * 0.3, sp); bits.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, life: rand(0.3, 0.7), colour, r: rand(1.2, 3) }); } };
    const jump = () => { if (dead || (y > 0.5 && air > 0.09) || sunk) return; vy = JUMP; held = true; air = 1; api.sound('select'); burst(PX, GROUND - 2, '#e8d0a0', 5, 60); };

    /** One obstacle pattern ahead, from what this distance has unlocked, with Berries or a power-up in the gap after it. */
    const spawn = () => {
      const t = tier(), x = W + 20, L = land();
      const pool = ['rock', 'rock', 'log'];
      if (t >= 1) pool.push('pit', 'flyer', 'pair');
      if (t >= 2) pool.push('roller', 'tall', 'digger', 'flyer');
      if (t >= 3) pool.push('swoop', 'longpit', 'rockflyer', 'roller');
      if (t >= 4) pool.push('triple', 'pitrock', 'swoop', 'pair');
      if (t >= 5) pool.push('triple', 'longpit', 'rockflyer');
      const kind = pick(pool);
      let span = 0;
      const add = (o, at = 0) => { things.push({ x: x + at, y: 0, h: 0, ...o }); span = Math.max(span, at + o.w); };
      const rock = (at) => add({ kind: 'rock', w: 22, h: 22 }, at);
      const pit = (w, at = 0) => add({ kind: 'pit', w }, at);
      if (kind === 'rock') rock(0);
      else if (kind === 'log') add({ kind: 'log', w: 44, h: 18 });
      else if (kind === 'tall') add({ kind: 'tall', w: 26, h: 52 });
      else if (kind === 'pair') { rock(0); rock(26 + speed * 0.1); }
      else if (kind === 'triple') { rock(0); rock(34 + speed * 0.42); rock(68 + speed * 0.84); }
      else if (kind === 'pit') pit(44 + speed * 0.05);
      else if (kind === 'longpit') pit(70 + speed * 0.12);
      else if (kind === 'pitrock') { pit(44 + speed * 0.04); rock(44 + speed * 0.4); }
      else if (kind === 'flyer') add({ kind: 'flyer', w: 24, h: 20, y: 40, fly: 1.25, mon: L.flyer });
      else if (kind === 'rockflyer') { rock(0); add({ kind: 'flyer', w: 24, h: 20, y: 40, fly: 1.25, mon: L.flyer }, 50 + speed * 1.1); }
      else if (kind === 'swoop') add({ kind: 'swoop', w: 26, h: 20, y: 120, fly: 1.2, mon: L.swoop });
      else if (kind === 'roller') add({ kind: 'roller', w: 24, h: 24, roll: 0.3 + t * 0.05, spin: 0 });
      else if (kind === 'digger') add({ kind: 'digger', w: 22, h: 22, rise: 0 });
      const gap = speed * rand(0.8, 1.35) * (1 - t * 0.05) + 40;
      const mid = x + span + gap * 0.5;
      if (gift <= 0 && t >= 1) { gift = rand(14, 22); things.push({ kind: t >= 2 && Math.random() < 0.5 ? 'stone' : 'shield', item: true, x: mid - 9, y: 46, w: 18, h: 18 }); }
      else if (Math.random() < 0.5) {
        const n = 3 + Math.floor(Math.random() * 3), high = Math.random() < 0.55;
        for (let i = 0; i < n; i++) things.push({ kind: 'berry', item: true, x: mid - n * 9 + i * 18, y: high ? 24 + Math.sin(i / (n - 1) * Math.PI) * 44 : 4, w: 14, h: 14 });
      }
      room = span + gap;
    };

    const die = (text) => {
      dead = true; shakeTo = performance.now() + 450;
      burst(PX, GROUND - y - 16, '#ff9a30', 18, 200);
      api.sound('fx-poof', 'cancel');
      api.over(text);
    };
    const collect = (t) => {
      t.gone = true;
      if (t.kind === 'berry') { combo++; const n = 5 * mult(); bonus += n; pop(t.x, GROUND - t.y - 16, `+${n}`); api.sound(combo % 2 ? 'plink-1' : 'plink-2'); burst(t.x + 7, GROUND - t.y - 7, '#7ab0ff', 5, 80); if (combo % 4 === 0 && mult() > 1) api.say(`Berry streak! x${mult()}`); }
      else if (t.kind === 'shield') { shield = true; api.sound('fx-ding', 'stat-up'); api.say('Protect! The next hit bounces off.'); pop(t.x, GROUND - t.y - 20, 'PROTECT', '#a8f0ff'); }
      else { blaze = BLAZE_S; api.sound('stat-up'); api.say('Fire Stone! Ponyta evolved into Rapidash!'); pop(t.x, GROUND - t.y - 20, 'RAPIDASH!', '#ff9a30'); burst(PX, GROUND - y - 20, '#ffd060', 24, 220); }
    };
    const smash = (t, n) => { t.gone = true; burst(t.x + t.w / 2, GROUND - t.y - t.h / 2, '#d8d0c0', 14, 220); if (n) { bonus += n; pop(t.x, GROUND - t.y - t.h - 6, `+${n}`, '#ff9a30'); } api.sound('fx-poof', 'plink-2'); };

    return {
      tick(dt) {
        speed = Math.min(620, 190 + dist * 0.2) * (blaze ? 1.25 : 1);
        dist += speed * dt / 30;
        const st = Math.floor(dist / STAGE_M);
        if (st !== stage) { stage = st; fade = 1; api.say(`${land().name}!${st >= LANDS.length ? ' Round again, faster.' : ''}`); api.sound('stat-up'); }
        fade = Math.max(0, fade - dt / 2);
        if (dist >= mark) { api.say(`${mark} m!${mark % 500 ? ' New dangers ahead.' : ''}`); pop(W - 70, 40, `${mark} m!`, '#ffffff'); mark += 250; }
        blaze = Math.max(0, blaze - dt); gift -= dt; squash = Math.max(0, squash - dt);
        if (blaze && blaze < dt * 1.5) api.say('Back to Ponyta.');

        const over = !blaze && things.some(t => t.kind === 'pit' && PX - 7 > t.x && PX + 7 < t.x + t.w);
        vy -= (vy > 0 ? (held ? GRAV * 0.5 : GRAV) : GRAV * FALL) * dt; y += vy * dt;
        air = y > 0 ? air + dt : 0;
        if (y <= 0) {
          if (over || sunk) { if (y < -6) sunk = true; }
          else { if (vy < -260) { squash = 0.14; burst(PX, GROUND - 1, '#e8d0a0', 6, 70); } y = 0; vy = 0; }
        }
        if (sunk && y < -40) {
          if (!shield) return die('Fell in!');
          shield = false; sunk = false; y = -39; vy = JUMP * 1.3; held = false; api.sound('fx-ding', 'select'); api.say('Protect bounced you out!');
        }

        if ((room -= speed * dt) <= 0) spawn();
        for (const t of things) {
          t.x -= speed * dt * (t.fly || (t.roll ? 1 + t.roll : 1));
          if (t.kind === 'swoop') t.y = Math.min(120, 14 + Math.abs(t.x + t.w / 2 - PX) * 0.42);
          if (t.kind === 'digger' && t.x < 175 && !t.rise) api.sound('fx-squeak', 'select');
          if (t.kind === 'digger' && t.x < 175) t.rise = Math.min(1, t.rise + dt * 4);
          if (t.roll) t.spin += dt * speed * (1 + t.roll) / 12;
          if (t.kind === 'berry' && !t.gone && !t.missed && t.x + t.w < PX - 16) { t.missed = true; if (combo >= 4) api.say('Streak dropped.'); combo = 0; }
        }
        while (things.length && things[0].x + (things[0].w || 0) < -60) things.shift();
        for (const t of things) {
          if (t.gone || t.kind === 'pit' || (t.kind === 'digger' && t.rise < 0.6)) continue;
          const hit = PX + PW / 2 - 3 > t.x && PX - PW / 2 + 3 < t.x + t.w && y + 2 < t.y + t.h && y + PH > t.y + 2;
          if (!hit) continue;
          if (t.item) collect(t);
          else if (blaze) smash(t, 25);
          else if (shield) { shield = false; smash(t, 0); api.say('Protect blocked it!'); }
          else return die(t.fly ? `Bonk! A ${t.mon[0].toUpperCase()}${t.mon.slice(1)}!` : t.kind === 'roller' ? 'Flattened by Geodude!' : t.kind === 'digger' ? 'Tripped on Diglett!' : 'Tripped!');
        }

        if ((trail -= dt) <= 0 && bits.length < 160) { trail = blaze ? 0.02 : 0.05; bits.push({ x: PX - 12 + rand(-3, 3), y: GROUND - y - 26 + rand(-4, 4), vx: -speed * 0.4 - 30, vy: rand(-40, -10), life: 0.35, colour: blaze ? '#ffe070' : pick(['#ff8a20', '#ffc040', '#ff5a10']), r: rand(1.5, 3) }); }
        if (land().embers && Math.random() < dt * 8 && bits.length < 160) bits.push({ x: rand(0, W), y: GROUND, vx: rand(-20, 10), vy: rand(-70, -30), life: 2.2, colour: '#ff7a20', r: 1.4 });
        for (let i = bits.length - 1; i >= 0; i--) { const b = bits[i]; b.life -= dt; b.x += b.vx * dt; b.y += b.vy * dt; b.vy += 200 * dt; if (b.life <= 0) bits.splice(i, 1); }
        for (let i = pops.length - 1; i >= 0; i--) if ((pops[i].t += dt) > 0.9) pops.splice(i, 1);
        score();
      },
      down() { jump(); },
      up() { held = false; },
      key(k, down) { if (k === 'act' || k === 'up') { if (down) jump(); else held = false; } else if (k === 'down' && down && y > 0) { vy = Math.min(vy, -620); held = false; } },
      draw(g, now) {
        const shake = !calm && now < shakeTo ? (shakeTo - now) / 450 * 4 : 0;
        g.save();
        if (shake) g.translate(rand(-shake, shake), rand(-shake, shake));
        const scroll = dist * 30, li = stage % LANDS.length;
        const layers = (i) => {
          const L = LANDS[i], tile = (key, off, w, y, h, paint) => { for (let x = -(off % w); x < W; x += w) stamp(g, key, x, y, w, h, paint); };
          stamp(g, `runner-sky-${i}`, 0, 0, W, GROUND, skyArt(L));
          tile(`runner-far-${i}`, scroll * 0.06, 480, GROUND - 100, 100, farArt(L, i));
          tile(`runner-mid-${i}`, scroll * 0.25, 480, GROUND - 58, 60, midArt(L));
          tile(`runner-ground-${i}`, scroll, 160, GROUND - 4, H - GROUND + 4, groundArt(L));
        };
        layers(li);
        if (fade > 0 && stage > 0) { g.globalAlpha = fade; layers((stage - 1) % LANDS.length); g.globalAlpha = 1; }
        const L = land();
        if (L.stars) for (let i = 0; i < 8; i++) { g.fillStyle = `rgba(255, 255, 255, ${0.5 + 0.5 * Math.sin(now / 300 + i * 2)})`; g.fillRect(noise(i + 90) * W, noise(i + 70) * 100, 1.5, 1.5); }

        for (const t of things) {
          if (t.gone) continue;
          const cx = t.x + t.w / 2, by = GROUND - t.y;
          if (t.kind === 'pit') {
            g.fillStyle = '#0a0606'; g.fillRect(t.x, GROUND - 3, t.w, H - GROUND + 3);
            g.fillStyle = L.pit; g.fillRect(t.x + 2, GROUND + 12, t.w - 4, H - GROUND - 12);
            g.fillStyle = L.embers ? '#ffd040' : 'rgba(255, 255, 255, 0.35)';
            for (let k = 0; k < t.w - 10; k += 12) g.fillRect(t.x + 4 + k + Math.sin(now / 200 + k) * 2, GROUND + 14 + (k % 24 ? 4 : 0), 6, 1.5);
            g.fillStyle = L.soil; g.fillRect(t.x - 2, GROUND - 4, 4, 18); g.fillRect(t.x + t.w - 2, GROUND - 4, 4, 18);
          } else if (ART[t.kind]) {
            const [w, h, paint] = ART[t.kind], bob = t.item ? Math.sin(now / 160 + t.x * 0.05) * 2 : 0;
            if (t.kind === 'stone' || t.kind === 'shield') { g.fillStyle = `rgba(255, 240, 160, ${0.25 + 0.15 * Math.sin(now / 120)})`; g.beginPath(); g.arc(cx, by - t.h / 2 + bob, 13, 0, TAU); g.fill(); }
            stamp(g, `runner-${t.kind}`, Math.round(t.x - (w - t.w) / 2), Math.round(by - (t.item ? t.h : h) + bob), w, h, paint);
          } else if (t.kind === 'roller') {
            g.save(); g.translate(cx, by - 12); g.rotate(-t.spin); drawMon(g, 'geodude', 0, 13, 26); g.restore();
            g.fillStyle = 'rgba(220, 200, 160, 0.5)'; g.fillRect(cx + 10, GROUND - 4, 8 + Math.sin(now / 50) * 3, 3);
          } else if (t.kind === 'digger') {
            if (t.rise) drawMon(g, 'diglett', cx, GROUND + 2 + 22 * (1 - t.rise), 24);
            stamp(g, 'runner-mound', Math.round(cx - 15), GROUND - 7, 30, 12, moundArt);
          } else drawMon(g, t.mon, cx, by + 4 + Math.sin(now / 90 + t.x) * 2, t.kind === 'swoop' ? 30 : 26);
        }

        const bob = y === 0 ? Math.abs(Math.sin(now / (blaze ? 45 : 70))) * 3 : 0, mon = blaze ? 'rapidash' : 'ponyta';
        if (blaze) { g.fillStyle = `rgba(255, 160, 40, ${0.25 + 0.1 * Math.sin(now / 40)})`; g.beginPath(); g.ellipse(PX, GROUND - y - 20, 30, 22, 0, 0, TAU); g.fill(); }
        if (sunk) { g.save(); g.beginPath(); g.rect(0, 0, W, GROUND + 6); g.clip(); }
        if (squash) { g.save(); g.translate(PX, GROUND - y + 4); g.scale(1.18, 0.82); drawMon(g, mon, 0, 0, blaze ? 54 : 48, true); g.restore(); }
        else drawMon(g, mon, PX, GROUND - y - bob + 4, blaze ? 54 : 48, true);
        if (sunk) g.restore();
        if (shield) { g.strokeStyle = `rgba(160, 240, 255, ${0.6 + 0.3 * Math.sin(now / 100)})`; g.lineWidth = 2; g.beginPath(); g.arc(PX, GROUND - y - 20, 26, 0, TAU); g.stroke(); }
        for (const b of bits) { g.globalAlpha = Math.min(1, b.life * 3); g.fillStyle = b.colour; g.fillRect(b.x - b.r / 2, b.y - b.r / 2, b.r, b.r); }
        g.globalAlpha = 1;
        g.restore();

        for (const p of pops) { g.globalAlpha = 1 - p.t / 0.9; banner(g, p.text, p.x, p.y - p.t * 26, 11, p.colour); }
        g.globalAlpha = 1;
        banner(g, `${Math.floor(dist)} m`, W - 40, 18, 14);
        if (combo >= 4) banner(g, `Berries x${mult()}`, 52, 18, 11, '#9ac8ff');
        if (blaze) { g.fillStyle = 'rgba(0, 0, 0, 0.4)'; g.fillRect(W / 2 - 40, 10, 80, 6); g.fillStyle = '#ff9a30'; g.fillRect(W / 2 - 40, 10, 80 * blaze / BLAZE_S, 6); }
        if (fade > 0 && stage > 0) { g.globalAlpha = Math.min(1, fade * 2); banner(g, land().name.toUpperCase(), W / 2, 62, 18, '#ffd84a', W * 0.85); g.globalAlpha = 1; }
      },
    };
  },
}, onClose);
