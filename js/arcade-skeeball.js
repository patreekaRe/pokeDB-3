/* arcade-skeeball.js  -  Poké Ball Skee-Ball, a home arcade game (js/arcade-kit.js): an arrow swings left and right, a
   tap locks the aim; a power bar fills and empties, a second tap rolls. The ball runs up the lane, hops the ramp and
   drops into a ring: 10 to 50 up the target, 100 in the small corner cups. Nine balls a game. */

import { runArcade, rand, banner } from './arcade-kit.js';

const W = 280, H = 360, BALLS = 9, CX = 140, CY = 92;
const RINGS = [[16, 50], [30, 40], [44, 30], [58, 20], [72, 10]];
const CUPS = [[CX - 92, 40], [CX + 92, 40]];

export const openSkeeball = (onClose) => runArcade({
  id: 'skeeball', title: 'Poké Ball Skee-Ball', colour: '#3aa86a', W, H,
  intro: 'Roll the Poké Ball into the rings! Tap to aim, tap again to roll.',
  help: [['An arrow swings left and right:', 'tap to lock your aim.'], ['Then the power bar rises and falls:', 'tap again to roll. Too soft and it lands short, too hard and it goes long.'], [`Rings score 10 to 50, the corner cups 100.`, `You have ${BALLS} balls.`]],
  make(api) {
    let phase = 'aim', t = 0, aim = 0, power = 0, ball = null, left = BALLS, pop = null;
    const scoreAt = (x, y) => {
      for (const [cx, cy] of CUPS) if (Math.hypot(x - cx, y - cy) < 11) return 100;
      const d = Math.hypot(x - CX, y - CY);
      for (const [r, pts] of RINGS) if (d < r) return pts;
      return 0;
    };
    return {
      tick(dt) {
        t += dt;
        if (phase === 'aim') aim = Math.sin(t * 2.2);
        else if (phase === 'power') power = (1 - Math.cos(t * 3.4)) / 2;
        else if (phase === 'roll') {
          ball.k += dt / 1.1;
          if (ball.k >= 1) {
            const pts = scoreAt(ball.tx, ball.ty);
            api.add(pts); pop = { x: ball.tx, y: ball.ty, pts, t: 1 };
            api.sound(pts >= 50 ? 'stat-up' : pts ? 'plink-2' : 'cancel', 'select');
            left -= 1; ball = null;
            if (left <= 0) return api.over('All rolled!');
            phase = 'aim'; t = 0;
          }
        }
        if (pop) pop.t -= dt;
      },
      down() {
        if (phase === 'aim') { phase = 'power'; t = 0; api.sound('select'); }
        else if (phase === 'power') {
          const tx = CX + aim * 110 + rand(-6, 6), ty = CY + 105 - power * 150 + rand(-6, 6);
          ball = { k: 0, tx, ty }; phase = 'roll'; api.sound('confirm', 'select');
        }
      },
      key(k, down) { if (down && k === 'act') this.down(); },
      draw(g, now) {
        g.fillStyle = '#1a3a2a'; g.fillRect(0, 0, W, H);
        g.fillStyle = '#c89a60'; g.beginPath(); g.moveTo(70, H); g.lineTo(30, 180); g.lineTo(W - 30, 180); g.lineTo(W - 70, H); g.fill();
        g.fillStyle = '#a87a40'; for (let i = 0; i < 6; i++) g.fillRect(40 + i * 40, 180, 2, H - 180);
        g.fillStyle = '#2a6a4a'; g.fillRect(20, 10, W - 40, 175);
        for (const [r, pts] of [...RINGS].reverse()) { g.fillStyle = pts % 20 ? '#f8f0d8' : '#3aa86a'; g.beginPath(); g.arc(CX, CY, r, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#1a3a2a'; g.lineWidth = 2; g.stroke(); }
        for (const [r, pts] of RINGS) banner(g, String(pts), CX, CY + r - 7, 9, '#ffd84a');
        for (const [cx, cy] of CUPS) { g.fillStyle = '#e83a3a'; g.beginPath(); g.arc(cx, cy, 11, 0, Math.PI * 2); g.fill(); banner(g, '100', cx, cy, 8, '#fff'); }
        g.fillStyle = '#5a3a20'; g.fillRect(30, 176, W - 60, 8);
        const bx = ball ? CX + (ball.tx - CX) * ball.k : CX, by = ball ? H - 30 + (ball.ty - (H - 30)) * ball.k - Math.sin(ball.k * Math.PI) * 30 : H - 30, br = ball ? 12 - ball.k * 5 : 12;
        if (phase === 'aim' || phase === 'power') {
          const ax = CX + aim * 110, ay = CY + 105 - (phase === 'power' ? power : 0.5) * 150;
          g.strokeStyle = 'rgba(255, 216, 74, 0.8)'; g.lineWidth = 3; g.setLineDash([6, 6]); g.beginPath(); g.moveTo(CX, H - 30); g.lineTo(ax, ay); g.stroke(); g.setLineDash([]);
        }
        g.fillStyle = '#e83a3a'; g.beginPath(); g.arc(bx, by, br, Math.PI, 0); g.fill();
        g.fillStyle = '#f8f8f8'; g.beginPath(); g.arc(bx, by, br, 0, Math.PI); g.fill();
        g.strokeStyle = '#202028'; g.lineWidth = 1.5; g.beginPath(); g.arc(bx, by, br, 0, Math.PI * 2); g.moveTo(bx - br, by); g.lineTo(bx + br, by); g.stroke();
        if (phase === 'power') { g.fillStyle = '#000'; g.fillRect(W - 22, 200, 12, 130); g.fillStyle = power > 0.8 ? '#ff6060' : '#ffd84a'; g.fillRect(W - 20, 328 - power * 126, 8, power * 126); }
        if (pop && pop.t > 0) banner(g, pop.pts ? `+${pop.pts}` : 'miss', pop.x, pop.y - (1 - pop.t) * 30, 18, pop.pts ? '#ffd84a' : '#ff8080');
        for (let i = 0; i < BALLS; i++) { g.fillStyle = i < left ? '#e83a3a' : 'rgba(255, 255, 255, 0.15)'; g.beginPath(); g.arc(14 + i * 12, H - 10, 4, 0, Math.PI * 2); g.fill(); }
      },
    };
  },
}, onClose);
