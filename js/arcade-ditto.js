/* arcade-ditto.js  -  Where's Ditto?, a home arcade game (js/arcade-kit.js): the shell game on a theatre's stage. Ditto
   hides under one of the Poké Balls, they shuffle, and you tap the one it's under. Since 2026-10-17 (the user's ask: every
   arcade game far more detailed, with more in it) the show keeps getting harder rather than levelling off: more swaps and
   quicker each round, a 4th ball from round 5 and a 5th from round 10; from round 3 feints (two balls start to swap and
   go back), from round 7 Ditto may hide among look-alikes, transforming before your eyes, from round 8 two pairs swap at
   once, from round 11 three balls turn round together, from round 13 the lights flicker out mid-shuffle. From round 4 a
   clock runs while you pick. Points are 10 times the round, more for a streak of finds and a quick pick, triple on
   every 5th round's Golden Ditto; a wrong pick (or the clock running out) costs one of 3 lives, and every 10th round
   gives one back. */

import { runArcade, drawMon, banner, pick, rand, stamp } from './arcade-kit.js';
import { calmFx } from './prefs.js';

const W = 300, H = 380, FLOOR = 262, LIVES = 3, TAU = Math.PI * 2;
const DECOYS = ['pikachu', 'jigglypuff', 'psyduck', 'meowth', 'clefairy', 'eevee', 'slowpoke', 'kecleon', 'smeargle'];
const ease = (t) => t * t * (3 - 2 * t);
const COUNT = (round) => (round >= 10 ? 5 : round >= 5 ? 4 : 3), RADIUS = { 3: 36, 4: 30, 5: 25 };
const clock = (round) => (round >= 4 ? Math.max(2.2, 4.6 - (round - 4) * 0.12) : 0);

/** The theatre, painted once: velvet curtains, a valance with gold fringe, the crowd's heads in the dark, spotlight
    cones and the green baize table. */
function theatre(g) {
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#2a1838'); bg.addColorStop(1, '#120a1c');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.fillStyle = '#1e1028';   // the back wall's panels
  for (let x = 40; x < W - 40; x += 44) { g.fillRect(x, 70, 36, 120); }
  g.strokeStyle = 'rgba(232, 192, 80, 0.25)'; g.lineWidth = 1;
  for (let x = 40; x < W - 40; x += 44) g.strokeRect(x + 3, 73, 30, 114);
  for (const side of [0, 1]) {   // the curtains, gathered at the sides
    g.save(); if (side) { g.translate(W, 0); g.scale(-1, 1); }
    const v = g.createLinearGradient(0, 0, 54, 0); v.addColorStop(0, '#5a0a18'); v.addColorStop(0.5, '#a01830'); v.addColorStop(1, '#6a0c1c');
    g.fillStyle = v; g.beginPath(); g.moveTo(0, 0); g.lineTo(58, 0); g.quadraticCurveTo(30, 150, 46, FLOOR - 30); g.lineTo(0, FLOOR - 30); g.fill();
    g.strokeStyle = 'rgba(0, 0, 0, 0.3)'; g.lineWidth = 2;
    for (let i = 1; i < 5; i++) { g.beginPath(); g.moveTo(i * 12, 0); g.quadraticCurveTo(i * 7, 150, i * 10, FLOOR - 30); g.stroke(); }
    g.strokeStyle = 'rgba(255, 140, 160, 0.18)'; g.lineWidth = 1.5;
    for (let i = 1; i < 5; i++) { g.beginPath(); g.moveTo(i * 12 + 4, 0); g.quadraticCurveTo(i * 7 + 4, 150, i * 10 + 4, FLOOR - 30); g.stroke(); }
    g.fillStyle = '#e8c050'; g.beginPath(); g.ellipse(34, 150, 10, 4, 0.4, 0, TAU); g.fill();   // the tie-back
    g.restore();
  }
  const val = g.createLinearGradient(0, 0, 0, 40); val.addColorStop(0, '#7a0e22'); val.addColorStop(1, '#a81c34');
  g.fillStyle = val; g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); g.lineTo(W, 30);
  for (let x = W; x >= 0; x -= 30) g.quadraticCurveTo(x - 15, 46, x - 30, 30);
  g.fill();
  g.fillStyle = '#e8c050';
  for (let x = 4; x < W; x += 6) g.fillRect(x, 32 + Math.sin(x / 30 * Math.PI) * 6 + 6, 2, 5);
  for (const sx of [70, 150, 230]) {   // spotlight cones from the rig
    const c = g.createLinearGradient(0, 40, 0, FLOOR); c.addColorStop(0, 'rgba(255, 240, 200, 0.16)'); c.addColorStop(1, 'rgba(255, 240, 200, 0.02)');
    g.fillStyle = c; g.beginPath(); g.moveTo(sx - 6, 40); g.lineTo(sx + 6, 40); g.lineTo(sx + 50, FLOOR - 30); g.lineTo(sx - 50, FLOOR - 30); g.fill();
    g.fillStyle = '#3a3040'; g.fillRect(sx - 7, 36, 14, 9); g.fillStyle = '#fff4c0'; g.fillRect(sx - 5, 44, 10, 2);
  }
  const cloth = g.createLinearGradient(0, FLOOR - 30, 0, H); cloth.addColorStop(0, '#2e8a5a'); cloth.addColorStop(1, '#0e3a20');
  g.fillStyle = cloth; g.beginPath(); g.moveTo(-10, H); g.lineTo(16, FLOOR - 30); g.lineTo(W - 16, FLOOR - 30); g.lineTo(W + 10, H); g.fill();
  g.strokeStyle = 'rgba(0, 0, 0, 0.12)'; g.lineWidth = 1;
  for (let i = 0; i < 14; i++) { const t = i / 13; g.beginPath(); g.moveTo(16 + (W - 32) * t, FLOOR - 30); g.lineTo(-10 + (W + 20) * t, H); g.stroke(); }
  g.strokeStyle = '#e8c050'; g.lineWidth = 3; g.beginPath(); g.moveTo(16, FLOOR - 30); g.lineTo(W - 16, FLOOR - 30); g.stroke();
  g.fillStyle = '#8a6a20'; g.fillRect(16, FLOOR - 28, W - 32, 2);
  g.fillStyle = '#08040c';   // the crowd
  for (let i = 0; i < 12; i++) { const x = i * 27 + 6, y = H - 10 + (i % 2) * 4; g.beginPath(); g.arc(x, y - 14, 11, 0, TAU); g.fill(); g.beginPath(); g.ellipse(x, y + 6, 17, 14, 0, Math.PI, 0); g.fill(); }
}

const balls = new Map();
/** A Poké Ball painted once a size (its gradients each frame cost the frame rate). */
function ballArt(r, s) {
  const k = `${r}@${s}`;
  if (balls.has(k)) return balls.get(k);
  const c = document.createElement('canvas'), px = Math.ceil((r + 2) * 2 * s);
  c.width = c.height = px;
  const g = c.getContext('2d');
  g.scale(s, s); g.translate(r + 2, r + 2);
  const top = g.createRadialGradient(-r * 0.35, -r * 0.45, r * 0.1, 0, 0, r * 1.1); top.addColorStop(0, '#ff8a80'); top.addColorStop(0.5, '#e8302a'); top.addColorStop(1, '#8a1010');
  const bot = g.createRadialGradient(-r * 0.3, r * 0.1, r * 0.1, 0, 0, r * 1.1); bot.addColorStop(0, '#ffffff'); bot.addColorStop(0.6, '#e8e8f0'); bot.addColorStop(1, '#9898a8');
  g.fillStyle = bot; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
  g.fillStyle = top; g.beginPath(); g.arc(0, 0, r, Math.PI, TAU); g.closePath(); g.fill();
  g.fillStyle = '#1e1e26'; g.fillRect(-r, -r * 0.08, r * 2, r * 0.16);
  g.strokeStyle = '#1e1e26'; g.lineWidth = r * 0.08; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke();
  g.fillStyle = '#1e1e26'; g.beginPath(); g.arc(0, 0, r * 0.3, 0, TAU); g.fill();
  const btn = g.createRadialGradient(-r * 0.06, -r * 0.06, 1, 0, 0, r * 0.2); btn.addColorStop(0, '#ffffff'); btn.addColorStop(1, '#c8c8d4');
  g.fillStyle = btn; g.beginPath(); g.arc(0, 0, r * 0.19, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255, 255, 255, 0.55)'; g.beginPath(); g.ellipse(-r * 0.4, -r * 0.55, r * 0.22, r * 0.12, -0.6, 0, TAU); g.fill();
  balls.set(k, c);
  return c;
}
const glows = new Map();
function halo(c) {
  if (glows.has(c)) return glows.get(c);
  const cv = document.createElement('canvas'); cv.width = cv.height = 64;
  const g = cv.getContext('2d'), r = g.createRadialGradient(32, 32, 4, 32, 32, 32);
  r.addColorStop(0, c); r.addColorStop(1, 'rgba(0, 0, 0, 0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  glows.set(c, cv);
  return cv;
}

export const openDitto = (onClose) => runArcade({
  id: 'ditto', title: 'Where\'s Ditto?', colour: '#b080e0', W, H,
  stick: false,
  sounds: ['fx-whoosh', 'fx-poof', 'fx-firework', 'fx-tick', 'fx-ding'],
  intro: 'Keep your eye on Ditto! Tap the Poké Ball it\'s under.',
  go: 'Watch closely...',
  help: [['Ditto hides under a Poké Ball, then they shuffle.', 'Keep your eye on the right one.'], ['Tap the ball Ditto is under', '(or Left / Right and Space). A round scores 10 times its number, more for a streak and a quick pick.'], ['It keeps getting trickier:', 'feints, more balls, look-alikes, two pairs at once, three turning together, lights out.'], ['From round 4 a clock runs while you pick.', 'Every 5th round is a Golden Ditto, worth triple.'], ['A wrong pick loses one of 3 lives.', 'Every 10th round gives one back.']],
  make(api) {
    const calm = calmFx();
    let round = 1, lives = LIVES, list = [], ditto = 0, phase = 'show', t = 0, moves = [], move = null, dur = 0.6, cursor = 0, chose = -1;
    let decoy = null, morph = 0, flash = 0, streak = 0, timer = 0, shake = 0, dark = 0, gained = 0;
    const confetti = [], puffs = [];
    const count = () => COUNT(round), R = () => RADIUS[count()];
    const slotX = (s) => W / (count() + 1) * (s + 1);
    const golden = () => round % 5 === 0;
    const twoOf = (n) => { const a = Math.floor(Math.random() * n); let b = Math.floor(Math.random() * (n - 1)); if (b >= a) b += 1; return [a, b]; };
    const setup = () => {
      const n = count();
      list = Array.from({ length: n }, (_, i) => ({ slot: i, x: slotX(i), y: 0, lift: 1, s: 1 }));
      ditto = Math.floor(Math.random() * n);
      decoy = round >= 7 && Math.random() < (round >= 12 ? 0.7 : 0.45) ? pick(DECOYS) : null;
      morph = 0; chose = -1; phase = 'show'; t = 0; cursor = Math.floor(n / 2);
      const many = Math.min(26, 3 + round * 1.4 | 0);
      dur = Math.max(0.18, 0.62 - round * 0.032);
      moves = [];
      for (let i = 0; i < many; i++) {
        const r = Math.random(), m = { dark: round >= 13 && Math.random() < 0.15 };
        if (round >= 11 && r < 0.2) { const s = [...Array(n).keys()].sort(() => Math.random() - 0.5).slice(0, 3); m.parts = [[s[0], s[1]], [s[1], s[2]], [s[2], s[0]]]; }
        else if (round >= 8 && n >= 4 && r < 0.45) { const s = [...Array(n).keys()].sort(() => Math.random() - 0.5); m.parts = [[s[0], s[1]], [s[1], s[0]], [s[2], s[3]], [s[3], s[2]]]; }
        else { const [a, b] = twoOf(n); m.parts = [[a, b], [b, a]]; m.feint = round >= 3 && Math.random() < Math.min(0.25, 0.08 + round * 0.012); }
        moves.push(m);
      }
      if (moves.at(-1).feint) moves.at(-1).feint = false;   // a feint last would end the shuffle on nothing
      api.say(golden() ? `Round ${round}: the Golden Ditto! Triple points.` : decoy ? 'Ditto is hiding among look-alikes! Watch it transform...' : `Round ${round}: watch Ditto!`);
    };
    setup();
    const showFor = () => (decoy ? (round >= 12 ? 2.1 : 2.6) : 1.3);
    const ballAt = (x, y) => list.findIndex(b => Math.hypot(x - b.x, y - (FLOOR - R())) < R() + 14);
    const choose = (i) => {
      if (phase !== 'pick') return;
      chose = i; phase = 'reveal'; t = 0;
      if (i === ditto) {
        streak++;
        const mult = 1 + Math.min(4, streak - 1) * 0.25, quick = timer > 0 ? Math.ceil(timer) * round : 0, gold = golden() ? 3 : 1;
        const got = Math.round(10 * round * mult * gold) + quick;
        api.add(got); api.sound('stat-up', 'plink-2'); flash = 1;
        api.say(`Found it! +${got}${quick ? ` (${quick} for speed)` : ''}${streak > 1 ? ` · ${streak} in a row, x${mult}` : ''}`);
        const bx = list[ditto].x;
        for (let k = 0; k < (gold > 1 ? 50 : 28); k++) confetti.push({ x: bx, y: FLOOR - 60, vx: rand(-120, 120), vy: rand(-260, -80), t: rand(0.9, 1.5), c: pick(gold > 1 ? ['#ffd84a', '#fff4a0', '#ffb020'] : ['#ff6a9a', '#ffd84a', '#7ad8ff', '#a8f080', '#e8b0ff']), r: rand(0, 6) });
        api.sound('fx-firework', 'coins');
      } else {
        lives -= 1; streak = 0; if (!calm) shake = 0.35;
        api.sound('cancel'); api.sound('fx-poof', 'select');
        const bx = i < 0 ? W / 2 : list[i].x;
        for (let k = 0; k < 10; k++) puffs.push({ x: bx + rand(-16, 16), y: FLOOR - 50 + rand(-10, 10), r: rand(6, 12), t: 0.8 });
        const why = i < 0 ? 'Time\'s up!' : 'Not there!';
        api.say(lives > 0 ? `${why} Ditto was over here. ${lives} ${lives === 1 ? 'life' : 'lives'} left.` : why);
      }
    };
    return {
      tick(dt) {
        t += dt; flash = Math.max(0, flash - dt * 1.5); shake = Math.max(0, shake - dt); gained = Math.max(0, gained - dt);
        dark = Math.max(0, dark - dt * 3);
        for (let i = confetti.length - 1; i >= 0; i--) { const c = confetti[i]; c.vy += 420 * dt; c.vx *= Math.exp(-1.5 * dt); c.x += c.vx * dt; c.y += c.vy * dt; c.r += dt * 8; if ((c.t -= dt) <= 0) confetti.splice(i, 1); }
        for (let i = puffs.length - 1; i >= 0; i--) { const p = puffs[i]; p.y -= 20 * dt; p.r += 14 * dt; if ((p.t -= dt) <= 0) puffs.splice(i, 1); }
        const lift = (to, k) => { for (const b of list) b.lift += (to - b.lift) * Math.min(1, dt * k); };
        if (phase === 'show') {
          if (decoy) morph = Math.max(0, Math.min(1, (t - 1) / 0.7));
          if (t > showFor()) { phase = 'drop'; t = 0; }
        } else if (phase === 'drop') {
          lift(0, 10);
          if (t > 0.45) { for (const b of list) b.lift = 0; phase = 'shuffle'; t = 0; }
        } else if (phase === 'shuffle') {
          if (!move) {
            if (!moves.length) { phase = 'pick'; timer = clock(round); api.say(timer ? `Where's Ditto? ${timer.toFixed(1)} seconds!` : 'Where\'s Ditto? Tap a Poké Ball.'); return; }
            const m = moves.shift();
            move = { k: 0, feint: m.feint, dark: m.dark, parts: m.parts.map(([f, to], j) => ({ o: list.find(o => o.slot === f), ax: slotX(f), bx: slotX(to), to, up: j % 2 === 0 })) };
            api.sound(m.parts.length > 2 ? 'fx-whoosh' : 'plink-1', 'plink-1');
          }
          move.k = Math.min(1, move.k + dt / (move.parts.length > 2 ? dur * 1.15 : dur));
          if (move.dark) dark = Math.min(1, dark + dt * 8);
          const e = move.feint ? Math.sin(move.k * Math.PI) * 0.42 : ease(move.k);
          for (const p of move.parts) {
            const arc = Math.sin(Math.PI * (move.feint ? move.k : e)) * Math.min(46, Math.abs(p.bx - p.ax) * 0.4) * (move.feint ? 0.5 : 1);
            p.o.x = p.ax + (p.bx - p.ax) * e;
            if (p.up) { p.o.y = -arc; p.o.s = 1 - arc / 400; } else { p.o.y = arc * 0.35; p.o.s = 1 + arc / 500; }
          }
          if (move.k >= 1) {
            for (const p of move.parts) { if (!move.feint) p.o.slot = p.to; p.o.x = slotX(p.o.slot); p.o.y = 0; p.o.s = 1; }
            move = null;
          }
        } else if (phase === 'pick') {
          if (timer > 0) {
            const was = timer;
            timer -= dt;
            if (Math.ceil(timer) < Math.ceil(was) && timer > 0 && timer < 3) api.sound('fx-tick', 'select');
            if (timer <= 0) { timer = 0; choose(-1); }
          }
        } else if (phase === 'reveal') {
          for (const [i, b] of list.entries()) b.lift += ((i === chose || i === ditto ? 1 : 0) - b.lift) * Math.min(1, dt * 9);
          if (t > 1.7) {
            if (lives <= 0) { phase = 'done'; return api.over(`Out of lives on round ${round}!`); }
            if (chose === ditto) {
              if (round % 10 === 0 && lives < LIVES) { lives++; gained = 1.5; api.sound('fx-ding', 'stat-up'); }
              round += 1;
            }
            setup();
          }
        }
      },
      down(x, y) {
        if (phase !== 'pick') return;
        const i = ballAt(x, y);
        if (i >= 0) choose(i);
      },
      key(k, down) {
        if (!down || phase !== 'pick') return;
        if (k === 'left' || k === 'right') { cursor = (cursor + (k === 'left' ? -1 : 1) + list.length) % list.length; api.sound('select'); }
        else choose(list.findIndex(b => b.slot === cursor));
      },
      draw(g, now) {
        g.save();
        if (shake) g.translate(Math.sin(now / 18) * shake * 14, 0);
        stamp(g, 'ditto-theatre', 0, 0, W, H, theatre);
        if (phase === 'shuffle') {   // a spotlight sweeping the table
          const sx = W / 2 + Math.sin(now / 500) * 110;
          g.globalAlpha = 0.5; g.drawImage(halo('rgba(255, 240, 200, 0.5)'), sx - 70, FLOOR - 90, 140, 110); g.globalAlpha = 1;
        }
        for (let i = 0; i < 16; i++) {   // bulbs chasing along the valance
          const on = Math.floor(now / 120 + i) % 4 === 0;
          g.fillStyle = on ? '#fff4b0' : '#8a6a30'; g.beginPath(); g.arc(10 + i * 18.7, 8, on ? 3 : 2.2, 0, TAU); g.fill();
        }
        for (let i = 0; i < LIVES; i++) {
          const x = 22 + i * 22, on = i < lives, pulse = gained && i === lives - 1 ? 1 + Math.sin(now / 60) * 0.25 : 1;
          g.fillStyle = on ? '#ff6a9a' : 'rgba(255, 255, 255, 0.18)';
          g.save(); g.translate(x, 22); g.scale(pulse, pulse);
          g.beginPath(); g.moveTo(0, 8); g.bezierCurveTo(-12, -2, -8, -12, 0, -6); g.bezierCurveTo(8, -12, 12, -2, 0, 8); g.fill();
          g.restore();
        }
        banner(g, `ROUND ${round}`, W - 58, 22, 16, golden() ? '#ffd84a' : '#e8d8ff');
        if (streak > 1) banner(g, `STREAK ${streak}`, W - 58, 40, 10, '#ffd84a');
        const r = R();
        list.forEach((b, i) => {
          const under = phase === 'show' || phase === 'drop' || phase === 'reveal';
          if (!under) return;
          const x = b.x, mon = i === ditto ? (decoy && morph >= 0.5 && phase !== 'reveal' ? decoy : 'ditto') : decoy;
          g.fillStyle = 'rgba(0, 0, 0, 0.3)'; g.beginPath(); g.ellipse(x, FLOOR, r * 0.9, 7, 0, 0, TAU); g.fill();
          if (!mon) return;
          if (i === ditto && golden()) { g.globalAlpha = 0.7 + 0.3 * Math.sin(now / 150); g.drawImage(halo('rgba(255, 210, 60, 0.9)'), x - r * 1.5, FLOOR - r * 2.4, r * 3, r * 3); g.globalAlpha = 1; }
          if (i === ditto && decoy && morph > 0 && morph < 1) {
            const k = Math.sin(morph * Math.PI);
            g.save(); g.translate(x, FLOOR); g.scale(1 + k * 0.35, 1 - k * 0.4);
            drawMon(g, mon, 0, 0, r * 1.25);
            g.restore();
            g.globalAlpha = k; g.drawImage(halo('rgba(230, 160, 255, 1)'), x - 40, FLOOR - 60, 80, 80); g.globalAlpha = 1;
          } else drawMon(g, mon, x, FLOOR, r * 1.25);
          if (phase === 'reveal' && i === ditto && chose !== ditto) banner(g, '!', x, FLOOR - r * 2.6 - b.lift * 70, 22, '#ffd84a');
        });
        const order = [...list.keys()].sort((a, c) => list[a].s - list[c].s), s = g.getTransform().a;
        for (const i of order) {
          const b = list[i], br = r * b.s, y = FLOOR - br + b.y - b.lift * 74;
          if (b.lift < 0.05) { g.fillStyle = 'rgba(0, 0, 0, 0.3)'; g.beginPath(); g.ellipse(b.x, FLOOR + 2, r * 0.95 * b.s, 7, 0, 0, TAU); g.fill(); }
          if (phase === 'pick' && b.slot === cursor) { g.globalAlpha = 0.75 + 0.25 * Math.sin(now / 120); g.drawImage(halo('rgba(255, 224, 96, 0.95)'), b.x - r * 1.8, y - r * 1.8, r * 3.6, r * 3.6); g.globalAlpha = 1; }
          const art = ballArt(r, s);
          g.drawImage(art, b.x - (r + 2) * b.s, y - (r + 2) * b.s, (r + 2) * 2 * b.s, (r + 2) * 2 * b.s);
        }
        if (dark > 0) { g.fillStyle = `rgba(4, 0, 10, ${dark * 0.72})`; g.fillRect(0, 0, W, H); if (dark > 0.5) banner(g, 'LIGHTS OUT!', W / 2, 110, 14, 'rgba(255, 255, 255, 0.5)'); }
        for (const p of puffs) { g.globalAlpha = p.t; g.fillStyle = '#b8a8c8'; g.beginPath(); g.arc(p.x, p.y, p.r, 0, TAU); g.fill(); }
        for (const c of confetti) { g.globalAlpha = Math.min(1, c.t * 2); g.fillStyle = c.c; g.save(); g.translate(c.x, c.y); g.rotate(c.r); g.fillRect(-3, -1.5, 6, 3); g.restore(); }
        g.globalAlpha = 1;
        g.restore();
        if (phase === 'pick') {
          banner(g, 'WHERE\'S DITTO?', W / 2, 80, 20, `rgba(255, 230, 255, ${0.7 + 0.3 * Math.sin(now / 250)})`);
          if (timer > 0) {
            const k = timer / clock(round), low = timer < 1.5;
            g.fillStyle = 'rgba(0, 0, 0, 0.45)'; g.beginPath(); g.roundRect(W / 2 - 60, 98, 120, 10, 5); g.fill();
            g.fillStyle = low ? (Math.floor(now / 100) % 2 ? '#ff5a6a' : '#ffd84a') : '#7ae8a0'; g.beginPath(); g.roundRect(W / 2 - 58, 100, 116 * k, 6, 3); g.fill();
          }
        }
        if (phase === 'shuffle' && round > 1) banner(g, golden() ? 'GOLDEN SHUFFLE!' : 'SHUFFLE!', W / 2, 80, 18, golden() ? '#ffd84a' : 'rgba(230, 210, 255, 0.85)');
        if (phase === 'reveal') banner(g, chose === ditto ? (golden() ? 'GOLDEN!' : 'FOUND IT!') : chose < 0 ? 'TOO SLOW!' : 'MISSED!', W / 2, 80, 24 * (1 + flash * 0.2), chose === ditto ? '#ffd84a' : '#ff8a9a');
        if (phase === 'show' && decoy) banner(g, morph < 1 ? 'TRANSFORM!' : 'WATCH...', W / 2, 80, 18, '#e8b0ff');
        if (gained) banner(g, '+1 LIFE!', W / 2, 130, 18, '#ff8ab0');
      },
    };
  },
}, onClose);
