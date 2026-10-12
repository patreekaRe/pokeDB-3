/* arcade-ditto.js  -  Where's Ditto?, a home arcade game (js/arcade-kit.js): the shell game. Ditto hides under one of the
   Poké Balls, they shuffle, and you tap the one it's under. More swaps and quicker each round, a fourth ball from round
   5, and from round 7 Ditto sometimes hides among look-alikes, transforming before your eyes. 10 a round times the
   round; a wrong pick costs one of 3 lives. */

import { runArcade, drawMon, banner, pick, rand } from './arcade-kit.js';

const W = 300, H = 380, FLOOR = 262, LIVES = 3, DECOYS = ['pikachu', 'jigglypuff', 'psyduck', 'meowth', 'clefairy', 'eevee', 'slowpoke'];
const ease = (t) => t * t * (3 - 2 * t);

export const openDitto = (onClose) => runArcade({
  id: 'ditto', title: 'Where\'s Ditto?', colour: '#b080e0', W, H,
  stick: false,
  intro: 'Keep your eye on Ditto! Tap the Poké Ball it\'s under.',
  go: 'Watch closely...',
  help: [['Ditto hides under a Poké Ball, then they shuffle.', 'Keep your eye on the right one.'], ['Tap the ball Ditto is under', '(or Left / Right and Space). Each round scores 10 times its number.'], ['A wrong pick loses one of 3 lives.', 'Rounds get faster; a 4th ball from round 5, and from round 7 Ditto may hide among look-alikes.']],
  make(api) {
    let round = 1, lives = LIVES, balls = [], ditto = 0, phase = 'show', t = 0, swaps = [], swap = null, dur = 0.6, cursor = 0, chose = -1, decoy = null, morph = 0, flash = 0;
    const count = () => (round >= 5 ? 4 : 3), R = () => (count() === 4 ? 30 : 36);
    const slotX = (s) => W / (count() + 1) * (s + 1);
    const setup = () => {
      balls = Array.from({ length: count() }, (_, i) => ({ slot: i, x: slotX(i), y: 0, lift: 1, s: 1 }));
      ditto = Math.floor(Math.random() * balls.length);
      decoy = round >= 7 && Math.random() < 0.45 ? pick(DECOYS) : null;
      morph = 0; chose = -1; phase = 'show'; t = 0; cursor = Math.floor(balls.length / 2);
      const n = Math.min(18, 3 + round * 1.3 | 0);
      dur = Math.max(0.24, 0.62 - round * 0.035);
      swaps = [];
      for (let i = 0; i < n; i++) { const a = Math.floor(Math.random() * balls.length); let b = Math.floor(Math.random() * (balls.length - 1)); if (b >= a) b += 1; swaps.push([a, b]); }
      api.say(decoy ? 'Ditto is hiding among look-alikes! Watch it transform...' : `Round ${round}: watch Ditto!`);
    };
    setup();
    const showFor = () => (decoy ? 2.6 : 1.3);
    const ballAt = (x, y) => balls.findIndex(b => Math.hypot(x - b.x, y - (FLOOR - R())) < R() + 14);
    const choose = (i) => {
      if (phase !== 'pick' || i < 0) return;
      chose = i; phase = 'reveal'; t = 0;
      if (i === ditto) { api.add(10 * round); api.sound('stat-up', 'plink-2'); api.say(`Found it! +${10 * round}`); flash = 1; }
      else { lives -= 1; api.sound('cancel'); api.say(lives > 0 ? `Not there! Ditto was over here. ${lives} ${lives === 1 ? 'life' : 'lives'} left.` : 'Not there!'); }
    };
    const pokeBall = (g, x, y, r, sel) => {
      g.save(); g.translate(x, y);
      const top = g.createRadialGradient(-r * 0.35, -r * 0.45, r * 0.1, 0, 0, r * 1.1); top.addColorStop(0, '#ff8a80'); top.addColorStop(0.5, '#e8302a'); top.addColorStop(1, '#8a1010');
      const bot = g.createRadialGradient(-r * 0.3, r * 0.1, r * 0.1, 0, 0, r * 1.1); bot.addColorStop(0, '#ffffff'); bot.addColorStop(0.6, '#e8e8f0'); bot.addColorStop(1, '#9898a8');
      if (sel) { g.shadowColor = '#ffe060'; g.shadowBlur = 18; }
      g.fillStyle = bot; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill();
      g.shadowBlur = 0;
      g.fillStyle = top; g.beginPath(); g.arc(0, 0, r, Math.PI, Math.PI * 2); g.closePath(); g.fill();
      g.fillStyle = '#1e1e26'; g.fillRect(-r, -r * 0.08, r * 2, r * 0.16);
      g.strokeStyle = '#1e1e26'; g.lineWidth = r * 0.08; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke();
      g.fillStyle = '#1e1e26'; g.beginPath(); g.arc(0, 0, r * 0.3, 0, Math.PI * 2); g.fill();
      const btn = g.createRadialGradient(-r * 0.06, -r * 0.06, 1, 0, 0, r * 0.2); btn.addColorStop(0, '#ffffff'); btn.addColorStop(1, '#c8c8d4');
      g.fillStyle = btn; g.beginPath(); g.arc(0, 0, r * 0.19, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(255, 255, 255, 0.55)'; g.beginPath(); g.ellipse(-r * 0.4, -r * 0.55, r * 0.22, r * 0.12, -0.6, 0, Math.PI * 2); g.fill();
      g.restore();
    };
    return {
      tick(dt) {
        t += dt; flash = Math.max(0, flash - dt * 1.5);
        const lift = (to, k) => { for (const b of balls) b.lift += (to - b.lift) * Math.min(1, dt * k); };
        if (phase === 'show') {
          if (decoy) morph = Math.max(0, Math.min(1, (t - 1) / 0.7));
          if (t > showFor()) { phase = 'drop'; t = 0; }
        } else if (phase === 'drop') {
          lift(0, 10);
          if (t > 0.45) { for (const b of balls) b.lift = 0; phase = 'shuffle'; t = 0; }
        } else if (phase === 'shuffle') {
          if (!swap) {
            if (!swaps.length) { phase = 'pick'; api.say('Where\'s Ditto? Tap a Poké Ball.'); return; }
            const [a, b] = swaps.shift();
            const A = balls.find(o => o.slot === a), B = balls.find(o => o.slot === b);
            swap = { A, B, ax: A.x, bx: B.x, k: 0 };
            api.sound('plink-1');
          }
          swap.k = Math.min(1, swap.k + dt / dur);
          const e = ease(swap.k), arc = Math.sin(Math.PI * e) * Math.min(46, Math.abs(swap.bx - swap.ax) * 0.4);
          swap.A.x = swap.ax + (swap.bx - swap.ax) * e; swap.A.y = -arc; swap.A.s = 1 - arc / 400;
          swap.B.x = swap.bx + (swap.ax - swap.bx) * e; swap.B.y = arc * 0.35; swap.B.s = 1 + arc / 500;
          if (swap.k >= 1) {
            [swap.A.slot, swap.B.slot] = [swap.B.slot, swap.A.slot];
            for (const o of [swap.A, swap.B]) { o.x = slotX(o.slot); o.y = 0; o.s = 1; }
            swap = null;
          }
        } else if (phase === 'reveal') {
          for (const [i, b] of balls.entries()) b.lift += ((i === chose || i === ditto ? 1 : 0) - b.lift) * Math.min(1, dt * 9);
          if (t > 1.6) {
            if (lives <= 0) { phase = 'done'; return api.over(`Out of lives on round ${round}!`); }
            if (chose === ditto) round += 1;
            setup();
          }
        }
      },
      down(x, y) {
        if (phase !== 'pick') return;
        choose(ballAt(x, y));
      },
      key(k, down) {
        if (!down || phase !== 'pick') return;
        if (k === 'left' || k === 'right') { cursor = (cursor + (k === 'left' ? -1 : 1) + balls.length) % balls.length; api.sound('select'); }
        else choose(balls.findIndex(b => b.slot === cursor));
      },
      draw(g, now) {
        g.lineJoin = 'round';
        const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#3a2a6a'); bg.addColorStop(1, '#1a1236');
        g.fillStyle = bg; g.fillRect(0, 0, W, H);
        const sp = g.createRadialGradient(W / 2, FLOOR - 40, 10, W / 2, FLOOR - 40, 190); sp.addColorStop(0, 'rgba(220, 180, 255, 0.35)'); sp.addColorStop(1, 'rgba(220, 180, 255, 0)');
        g.fillStyle = sp; g.fillRect(0, 0, W, H);
        const cloth = g.createLinearGradient(0, FLOOR - 20, 0, H); cloth.addColorStop(0, '#2e8a5a'); cloth.addColorStop(1, '#14502e');
        g.fillStyle = cloth; g.beginPath(); g.moveTo(-10, H); g.lineTo(20, FLOOR - 30); g.lineTo(W - 20, FLOOR - 30); g.lineTo(W + 10, H); g.fill();
        g.strokeStyle = '#e8c050'; g.lineWidth = 3; g.beginPath(); g.moveTo(20, FLOOR - 30); g.lineTo(W - 20, FLOOR - 30); g.stroke();
        for (let i = 0; i < LIVES; i++) {
          const x = 22 + i * 22, on = i < lives;
          g.fillStyle = on ? '#ff6a9a' : 'rgba(255, 255, 255, 0.18)';
          g.beginPath(); g.moveTo(x, 30); g.bezierCurveTo(x - 12, 20, x - 8, 10, x, 16); g.bezierCurveTo(x + 8, 10, x + 12, 20, x, 30); g.fill();
        }
        banner(g, `ROUND ${round}`, W - 58, 22, 16, '#e8d8ff');
        const r = R();
        balls.forEach((b, i) => {
          const under = phase === 'show' || phase === 'drop' || phase === 'reveal';
          if (!under) return;
          const x = b.x, mon = i === ditto ? (decoy && morph >= 0.5 && phase !== 'reveal' ? decoy : 'ditto') : decoy;
          g.fillStyle = 'rgba(0, 0, 0, 0.3)'; g.beginPath(); g.ellipse(x, FLOOR, r * 0.9, 7, 0, 0, Math.PI * 2); g.fill();
          if (!mon) return;
          if (i === ditto && decoy && morph > 0 && morph < 1) {
            const k = Math.sin(morph * Math.PI);
            g.save(); g.translate(x, FLOOR); g.scale(1 + k * 0.35, 1 - k * 0.4);
            drawMon(g, mon, 0, 0, r * 1.25);
            g.restore();
            const gl = g.createRadialGradient(x, FLOOR - 20, 2, x, FLOOR - 20, 40); gl.addColorStop(0, `rgba(230, 160, 255, ${k})`); gl.addColorStop(1, 'rgba(230, 160, 255, 0)');
            g.fillStyle = gl; g.beginPath(); g.arc(x, FLOOR - 20, 40, 0, Math.PI * 2); g.fill();
          } else drawMon(g, mon, x, FLOOR, r * 1.25);
          if (phase === 'reveal' && i === ditto && chose !== ditto) banner(g, '!', x, FLOOR - r * 2.6 - b.lift * 70, 22, '#ffd84a');
        });
        const order = [...balls.keys()].sort((a, c) => balls[a].s - balls[c].s);
        for (const i of order) {
          const b = balls[i], y = FLOOR - r * b.s + b.y - b.lift * 74;
          if (b.lift < 0.05) { g.fillStyle = 'rgba(0, 0, 0, 0.3)'; g.beginPath(); g.ellipse(b.x, FLOOR + 2, r * 0.95 * b.s, 7, 0, 0, Math.PI * 2); g.fill(); }
          pokeBall(g, b.x, y, r * b.s, phase === 'pick' && b.slot === cursor);
        }
        if (phase === 'pick') banner(g, 'WHERE\'S DITTO?', W / 2, 80, 20, `rgba(255, 230, 255, ${0.7 + 0.3 * Math.sin(now / 250)})`);
        if (phase === 'shuffle' && round > 1) banner(g, 'SHUFFLE!', W / 2, 80, 18, 'rgba(230, 210, 255, 0.85)');
        if (phase === 'reveal') banner(g, chose === ditto ? 'FOUND IT!' : 'MISSED!', W / 2, 80, 24 * (1 + flash * 0.2), chose === ditto ? '#ffd84a' : '#ff8a9a');
        if (phase === 'show' && decoy) banner(g, morph < 1 ? 'TRANSFORM!' : 'WATCH...', W / 2, 80, 18, '#e8b0ff');
        if (flash > 0) { for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + now / 300, d = 40 + (1 - flash) * 60; g.fillStyle = `rgba(255, 230, 120, ${flash})`; g.beginPath(); g.arc(balls[ditto].x + Math.cos(a) * d, FLOOR - 40 + Math.sin(a) * d * 0.6, 3, 0, Math.PI * 2); g.fill(); } }
      },
    };
  },
}, onClose);
