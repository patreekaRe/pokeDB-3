/* arcade-volley.js  -  Pikachu Volleyball, a home arcade game (js/arcade-kit.js), after the old PC classic: your Pikachu
   on the left, Meowth on the right. Hold left or right of Pikachu to run (or the arrow keys), tap above it or press Up /
   Space to jump. Keep the ball off your side of the beach; first to 7 wins. Your points are your score, and a win adds
   10. */

import { runArcade, drawMon, banner } from './arcade-kit.js';

const W = 340, H = 240, FLOOR = 214, NET_X = W / 2, NET_TOP = 150, BR = 11, GRAV = 520, PR = 20, TO = 7;

export const openVolley = (onClose) => runArcade({
  id: 'volley', title: 'Pikachu Volleyball', colour: '#f0c020', W, H,
  intro: 'Beat Meowth to 7! Hold beside Pikachu to run, tap above it to jump.',
  help: [['Hold to the left or right of Pikachu to run there,', 'tap above it to jump (or the arrow keys and Space).'], ['Bump the ball over the net with Pikachu\'s head.', 'If it lands on your side, Meowth scores.'], [`First to ${TO} wins.`, 'Every point you win scores, and winning the match adds 10.']],
  make(api) {
    const me = { x: 80, y: 0, vy: 0 }, foe = { x: W - 80, y: 0, vy: 0 };
    let ball = null, mine = 0, theirs = 0, serveTo = 'me', wait = 0.8, target = null, keyDir = 0, jumpAsk = false;
    const serve = () => { ball = { x: serveTo === 'me' ? 80 : W - 80, y: 60, vx: 0, vy: 0 }; };
    const jump = (p) => { if (p.y === 0) p.vy = 330; };
    const move = (p, dir, dt, lo, hi) => { p.x = Math.max(lo, Math.min(hi, p.x + dir * 190 * dt)); };
    const point = (toMe) => {
      if (toMe) { mine += 1; api.add(1); api.sound('plink-2'); } else { theirs += 1; api.sound('cancel'); }
      serveTo = toMe ? 'me' : 'foe'; ball = null; wait = 0.9;
      if (mine >= TO) { api.add(10); return api.over('You win the match!'); }
      if (theirs >= TO) return api.over('Meowth wins!');
      api.say(`${mine} - ${theirs}`);
    };
    const bump = (p, dir) => {
      const cx = p.x, cy = FLOOR - p.y - PR, dx = ball.x - cx, dy = ball.y - cy, d = Math.hypot(dx, dy);
      if (d < BR + PR && d > 0) {
        const ux = dx / d, uy = dy / d, sp = Math.max(300, Math.hypot(ball.vx, ball.vy));
        ball.x = cx + ux * (BR + PR); ball.y = cy + uy * (BR + PR);
        ball.vx = ux * sp * 0.9 + dir * 60; ball.vy = Math.min(-200, uy * sp * 0.9 - 120);
        api.sound('plink-1');
      }
    };
    return {
      tick(dt) {
        let dir = keyDir;
        if (target != null) dir = Math.abs(target - me.x) < 6 ? 0 : Math.sign(target - me.x);
        move(me, dir, dt, PR, NET_X - PR - 4);
        if (jumpAsk) { jump(me); jumpAsk = false; }
        if (ball) {
          const land = ball.x + ball.vx * 0.5;
          const want = ball.x > NET_X - 20 ? Math.max(NET_X + PR + 4, Math.min(W - PR, land + 8)) : W - 90;
          move(foe, Math.abs(want - foe.x) < 6 ? 0 : Math.sign(want - foe.x), dt * 0.82, NET_X + PR + 4, W - PR);
          if (ball.x > NET_X && ball.y > 90 && Math.abs(ball.x - foe.x) < 40 && ball.vy > 0 && Math.random() < 0.06) jump(foe);
        }
        for (const p of [me, foe]) { p.vy -= GRAV * 1.3 * dt; p.y = Math.max(0, p.y + p.vy * dt); if (p.y === 0) p.vy = 0; }
        if (!ball) { wait -= dt; if (wait <= 0) serve(); return; }
        const steps = 3;
        for (let n = 0; n < steps; n++) {
          const h = dt / steps;
          ball.vy += GRAV * h; ball.x += ball.vx * h; ball.y += ball.vy * h;
          if (ball.x < BR) { ball.x = BR; ball.vx = Math.abs(ball.vx); }
          if (ball.x > W - BR) { ball.x = W - BR; ball.vx = -Math.abs(ball.vx); }
          if (ball.y < BR) { ball.y = BR; ball.vy = Math.abs(ball.vy); }
          if (ball.y > NET_TOP - BR && Math.abs(ball.x - NET_X) < BR + 3) {
            if (ball.y < NET_TOP) { ball.vy = -Math.abs(ball.vy) * 0.7; ball.y = NET_TOP - BR; }
            else { ball.vx = (ball.x < NET_X ? -1 : 1) * Math.abs(ball.vx) * 0.6; ball.x = NET_X + (ball.x < NET_X ? -1 : 1) * (BR + 3); }
          }
          bump(me, 1); bump(foe, -1);
          if (ball.y > FLOOR - BR) return point(ball.x > NET_X);
        }
      },
      down(x, y) { if (y < FLOOR - me.y - PR * 2 - 6 && Math.abs(x - me.x) < 60) jumpAsk = true; else target = x; },
      move(x, y, pressed) { if (pressed && target != null) target = x; },
      up() { target = null; },
      key(k, down) { if (k === 'left' || k === 'right') keyDir = down ? (k === 'left' ? -1 : 1) : 0; else if ((k === 'up' || k === 'act') && down) jumpAsk = true; },
      draw(g, now) {
        const sky = g.createLinearGradient(0, 0, 0, FLOOR); sky.addColorStop(0, '#58b8f8'); sky.addColorStop(1, '#c8ecff');
        g.fillStyle = sky; g.fillRect(0, 0, W, FLOOR);
        g.fillStyle = 'rgba(255, 255, 255, 0.8)'; for (let i = 0; i < 3; i++) { const x = (i * 140 + now / 60) % (W + 80) - 40; g.beginPath(); g.ellipse(x, 40 + i * 18, 26, 9, 0, 0, Math.PI * 2); g.fill(); }
        g.fillStyle = '#f0d890'; g.fillRect(0, FLOOR, W, H - FLOOR);
        g.fillStyle = '#e8e8e8'; g.fillRect(NET_X - 3, NET_TOP, 6, FLOOR - NET_TOP); g.fillStyle = '#c83838'; g.fillRect(NET_X - 4, NET_TOP - 4, 8, 6);
        drawMon(g, 'pikachu', me.x, FLOOR - me.y + 3, PR * 2.4, true);
        drawMon(g, 'meowth', foe.x, FLOOR - foe.y + 3, PR * 2.4);
        if (ball) {
          g.fillStyle = 'rgba(0, 0, 0, 0.2)'; g.beginPath(); g.ellipse(ball.x, FLOOR + 3, 10, 3, 0, 0, Math.PI * 2); g.fill();
          g.fillStyle = '#e83a3a'; g.beginPath(); g.arc(ball.x, ball.y, BR, Math.PI, 0); g.fill();
          g.fillStyle = '#f8f8f8'; g.beginPath(); g.arc(ball.x, ball.y, BR, 0, Math.PI); g.fill();
          g.strokeStyle = '#202028'; g.lineWidth = 1.5; g.beginPath(); g.arc(ball.x, ball.y, BR, 0, Math.PI * 2); g.moveTo(ball.x - BR, ball.y); g.lineTo(ball.x + BR, ball.y); g.stroke();
        }
        banner(g, String(mine), W / 4, 24, 26, '#ffd84a'); banner(g, String(theirs), W * 3 / 4, 24, 26, '#ffffff');
      },
    };
  },
}, onClose);
