/* arcade-pong.js  -  Psyduck Pong, a home arcade game (js/arcade-kit.js; 2026-10-12, the user's pick): your paddle at the
   bottom, Psyduck's at the top, a Poké Ball between. Drag (or the arrow keys) to move. First to 7; a return scores 1, a
   point 5, and beating Psyduck adds 20. Psyduck gets quicker with every point you take. */

import { runArcade, drawMon, banner } from './arcade-kit.js';

const W = 300, H = 380, PW = 64, PH = 10, ME_Y = H - 34, FOE_Y = 44, BR = 8, TO = 7;

export const openPong = (onClose) => runArcade({
  id: 'pong', title: 'Psyduck Pong', colour: '#e8c040', W, H,
  intro: 'Beat Psyduck to 7! Drag to move your paddle.',
  help: [['Drag left and right to move your paddle', '(or hold the arrow keys).'], ['Hit the Poké Ball past Psyduck to score.', 'Where it hits your paddle sets the angle.'], [`First to ${TO} wins.`, 'A return scores 1, a point 5, and winning adds 20.']],
  make(api) {
    let me = W / 2, foe = W / 2, target = null, keyDir = 0, mine = 0, theirs = 0, ball = null, wait = 0.8, toFoe = true, ouch = 0;
    const serve = () => { const a = (Math.random() - 0.5) * 0.9; ball = { x: W / 2, y: H / 2, vx: Math.sin(a) * 170, vy: (toFoe ? -1 : 1) * Math.cos(a) * 170 }; };
    const point = (toMe) => {
      ball = null; wait = 0.9;
      if (toMe) { mine += 1; api.add(5); api.sound('stat-up', 'plink-2'); ouch = 1.2; } else { theirs += 1; api.sound('cancel'); }
      toFoe = !toMe;
      if (mine >= TO) { api.add(20); return api.over('Psyduck is confused!'); }
      if (theirs >= TO) return api.over('Psyduck wins!');
      api.say(`${mine} - ${theirs}`);
    };
    const hit = (px, down) => {
      const off = Math.max(-1, Math.min(1, (ball.x - px) / (PW / 2))), sp = Math.min(430, Math.hypot(ball.vx, ball.vy) * 1.06);
      ball.vx = off * sp * 0.75; ball.vy = (down ? 1 : -1) * Math.sqrt(sp * sp - ball.vx * ball.vx);
      api.sound('plink-1');
    };
    return {
      tick(dt) {
        if (target != null) me += Math.max(-420 * dt, Math.min(420 * dt, target - me)); else me += keyDir * 300 * dt;
        me = Math.max(PW / 2, Math.min(W - PW / 2, me));
        ouch = Math.max(0, ouch - dt);
        const aim = ball && ball.vy < 0 ? ball.x : W / 2, foeSpeed = 130 + mine * 22;
        foe += Math.max(-foeSpeed * dt, Math.min(foeSpeed * dt, aim - foe));
        foe = Math.max(PW / 2, Math.min(W - PW / 2, foe));
        if (!ball) { wait -= dt; if (wait <= 0) serve(); return; }
        ball.x += ball.vx * dt; ball.y += ball.vy * dt;
        if (ball.x < BR) { ball.x = BR; ball.vx = Math.abs(ball.vx); }
        if (ball.x > W - BR) { ball.x = W - BR; ball.vx = -Math.abs(ball.vx); }
        if (ball.vy > 0 && ball.y + BR >= ME_Y && ball.y + BR <= ME_Y + PH + 6 && Math.abs(ball.x - me) < PW / 2 + BR) { ball.y = ME_Y - BR; hit(me, false); api.add(1); }
        if (ball.vy < 0 && ball.y - BR <= FOE_Y + PH && ball.y - BR >= FOE_Y - 6 && Math.abs(ball.x - foe) < PW / 2 + BR) { ball.y = FOE_Y + PH + BR; hit(foe, true); }
        if (ball.y > H + BR) point(false);
        else if (ball.y < -BR) point(true);
      },
      down(x) { target = x; },
      move(x, y, pressed) { if (pressed) target = x; },
      up() { target = null; },
      key(k, down) { if (k === 'left' || k === 'right') keyDir = down ? (k === 'left' ? -1 : 1) : 0; },
      draw(g, now) {
        const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#2a7ac8'); bg.addColorStop(1, '#1a4a8a');
        g.fillStyle = bg; g.fillRect(0, 0, W, H);
        g.strokeStyle = 'rgba(255, 255, 255, 0.12)'; g.lineWidth = 2;
        for (let i = 0; i < 7; i++) { g.beginPath(); for (let x = 0; x <= W; x += 10) g.lineTo(x, 70 + i * 44 + Math.sin(x / 26 + now / 600 + i) * 4); g.stroke(); }
        g.setLineDash([10, 8]); g.strokeStyle = 'rgba(255, 255, 255, 0.5)'; g.beginPath(); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke(); g.setLineDash([]);
        banner(g, String(theirs), W - 26, H / 2 - 24, 24, 'rgba(255, 216, 74, 0.9)');
        banner(g, String(mine), W - 26, H / 2 + 24, 24, 'rgba(255, 255, 255, 0.9)');
        const paddle = (x, y, c) => { g.fillStyle = c; g.beginPath(); g.roundRect(x - PW / 2, y, PW, PH, 5); g.fill(); g.fillStyle = 'rgba(255, 255, 255, 0.45)'; g.fillRect(x - PW / 2 + 6, y + 2, PW - 12, 2); };
        drawMon(g, 'psyduck', foe, FOE_Y - 2 + (ouch > 0 ? Math.sin(now / 30) * 2 : 0), 40);
        if (ouch > 0) banner(g, '?!', foe + 26, FOE_Y - 30, 16, '#ffd84a');
        paddle(foe, FOE_Y, '#f0c040');
        paddle(me, ME_Y, '#f4f4f4');
        if (ball) {
          const { x, y } = ball;
          g.fillStyle = '#f4f4f4'; g.beginPath(); g.arc(x, y, BR, 0, Math.PI * 2); g.fill();
          g.fillStyle = '#e03838'; g.beginPath(); g.arc(x, y, BR, Math.PI, Math.PI * 2); g.fill();
          g.fillStyle = '#202028'; g.fillRect(x - BR, y - 1, BR * 2, 2); g.beginPath(); g.arc(x, y, 3, 0, Math.PI * 2); g.fill();
          g.fillStyle = '#f4f4f4'; g.beginPath(); g.arc(x, y, 1.6, 0, Math.PI * 2); g.fill();
        }
      },
    };
  },
}, onClose);
