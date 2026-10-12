/* arcade-pinball.js  -  Pokémon Pinball, a home arcade game (js/arcade-kit.js): a Poké Ball on a sloped table, two
   flippers (tap or hold the left or right half, or the arrow keys), three Voltorb bumpers (10 each), Pikachu's kicker
   guarding the right outlane (25), Diglett targets that drop when hit (50, all three for 300 and they pop back). Three
   balls a game. */

import { runArcade, drawMon, banner } from './arcade-kit.js';

const W = 280, H = 420, R = 8, GRAV = 520, BALLS = 3;
const FL = { l: { x: 88, y: 368, len: 46, rest: 0.5, up: -0.45 }, r: { x: 192, y: 368, len: 46, rest: Math.PI - 0.5, up: Math.PI + 0.45 } };
const WALLS = [[14, 40, 14, 330], [W - 14, 40, W - 14, 330], [14, 330, 88, 368], [W - 14, 330, 192, 368], [14, 40, 60, 12], [60, 12, W - 60, 12], [W - 60, 12, W - 14, 40]];
const BUMPERS = [{ x: 90, y: 130 }, { x: 190, y: 130 }, { x: 140, y: 190 }];

function hitSeg(b, x1, y1, x2, y2, bounce = 0.6, push = null) {
  const dx = x2 - x1, dy = y2 - y1, len2 = dx * dx + dy * dy;
  const t = Math.max(0, Math.min(1, ((b.x - x1) * dx + (b.y - y1) * dy) / len2));
  const px = x1 + dx * t, py = y1 + dy * t, nx = b.x - px, ny = b.y - py, d = Math.hypot(nx, ny);
  if (d >= R || d === 0) return false;
  const ux = nx / d, uy = ny / d;
  b.x = px + ux * R; b.y = py + uy * R;
  const vn = b.vx * ux + b.vy * uy;
  if (vn < 0) { b.vx -= (1 + bounce) * vn * ux; b.vy -= (1 + bounce) * vn * uy; }
  if (push) { b.vx += ux * push * t; b.vy += uy * push * t; }
  return true;
}

export const openPinball = (onClose) => runArcade({
  id: 'pinball', title: 'Pokémon Pinball', colour: '#e8c030', W, H,
  intro: 'Keep the Poké Ball in play! Tap the left or right side to flip.',
  help: [['Tap or hold the left half for the left flipper,', 'the right half for the right one (or the arrow keys).'], ['Voltorb bumpers 10, Pikachu\'s kicker 25,', 'each Diglett 50, and all three Diglett down for a 300 bonus.'], [`You have ${BALLS} balls.`, 'A ball down the middle is lost.']],
  make(api) {
    let ball = null, balls = BALLS, launch = 0.8, kick = 0, reset = 0;
    const flip = { l: false, r: false }, ang = { l: FL.l.rest, r: FL.r.rest }, lit = BUMPERS.map(() => 0);
    let digs = [true, true, true];
    const serve = () => { ball = { x: W - 30, y: 300, vx: -60, vy: -560 }; };
    const end = (side) => { const f = FL[side], a = ang[side]; return [f.x + Math.cos(a) * f.len, f.y + Math.sin(a) * f.len]; };
    const press = (side, on) => { if (on && !flip[side]) api.sound('select'); flip[side] = on; };
    return {
      tick(dt) {
        if (!ball) { launch -= dt; if (launch <= 0) serve(); else return; }
        for (const s of ['l', 'r']) {
          const want = flip[s] ? FL[s].up : FL[s].rest, was = ang[s];
          ang[s] += Math.sign(want - ang[s]) * Math.min(Math.abs(want - ang[s]), dt * 18);
          FL[s].moving = ang[s] !== was && flip[s];
        }
        kick = Math.max(0, kick - dt);
        if (reset) { reset = Math.max(0, reset - dt); if (!reset) digs = [true, true, true]; }
        lit.forEach((v, i) => { lit[i] = Math.max(0, v - dt); });
        const steps = 4;
        for (let n = 0; n < steps; n++) {
          const h = dt / steps;
          ball.vy += GRAV * h; ball.x += ball.vx * h; ball.y += ball.vy * h;
          for (const w of WALLS) hitSeg(ball, ...w);
          for (const s of ['l', 'r']) hitSeg(ball, FL[s].x, FL[s].y, ...end(s), 0.3, FL[s].moving ? 520 : null);
          BUMPERS.forEach((p, i) => {
            const dx = ball.x - p.x, dy = ball.y - p.y, d = Math.hypot(dx, dy);
            if (d < R + 16) { const ux = dx / d, uy = dy / d; ball.x = p.x + ux * (R + 16); ball.y = p.y + uy * (R + 16); ball.vx = ux * 420; ball.vy = uy * 420; if (!lit[i]) { api.add(10); api.sound('plink-1'); } lit[i] = 0.15; }
          });
          if (ball.x > W - 40 && ball.y > 290 && ball.y < 330 && ball.vy > 0 && !kick) { ball.vy = -620; ball.vx = -120; kick = 1.5; api.add(25); api.sound('thunder', 'plink-2'); }
          digs.forEach((up, i) => {
            const dx = 80 + i * 60;
            if (up && !reset && ball.vy < 0 && ball.y < 70 && ball.y > 40 && Math.abs(ball.x - dx) < 16) { digs[i] = false; ball.vy = Math.abs(ball.vy) * 0.7; api.add(50); api.sound('plink-2'); }
          });
          if (!digs.some(Boolean) && !reset) { reset = 4; api.add(300); api.sound('stat-up'); api.say('All three Diglett! +300!'); }
          const sp = Math.hypot(ball.vx, ball.vy); if (sp > 900) { ball.vx *= 900 / sp; ball.vy *= 900 / sp; }
        }
        if (ball.y > H + 20) {
          balls -= 1; ball = null; launch = 1; api.sound('cancel');
          if (balls <= 0) return api.over('Last ball down!');
          api.say(`${balls} ball${balls > 1 ? 's' : ''} left.`);
        }
      },
      down(x) { press(x < W / 2 ? 'l' : 'r', true); },
      up() { press('l', false); press('r', false); },
      key(k, down) { if (k === 'left' || k === 'right') press(k[0], down); else if (k === 'act') { press('l', down); press('r', down); } },
      draw(g, now) {
        const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#1a2a6a'); bg.addColorStop(1, '#3a1a5a');
        g.fillStyle = bg; g.fillRect(0, 0, W, H);
        g.strokeStyle = '#ffd84a'; g.lineWidth = 4; g.lineCap = 'round';
        for (const [x1, y1, x2, y2] of WALLS) { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }
        digs.forEach((up, i) => { if (up) drawMon(g, 'diglett', 80 + i * 60, 72, 30); else { g.fillStyle = '#4a2c18'; g.beginPath(); g.ellipse(80 + i * 60, 70, 12, 4, 0, 0, Math.PI * 2); g.fill(); } });
        BUMPERS.forEach((p, i) => { g.fillStyle = lit[i] ? '#fff070' : 'rgba(255, 255, 255, 0.15)'; g.beginPath(); g.arc(p.x, p.y, 20, 0, Math.PI * 2); g.fill(); drawMon(g, 'voltorb', p.x, p.y + 16, 32); });
        drawMon(g, 'pikachu', W - 32, 338 - (kick ? 10 : 0), 34);
        g.lineWidth = 10;
        for (const s of ['l', 'r']) { g.strokeStyle = '#e83a3a'; g.beginPath(); g.moveTo(FL[s].x, FL[s].y); g.lineTo(...end(s)); g.stroke(); }
        if (ball) {
          g.fillStyle = '#e83a3a'; g.beginPath(); g.arc(ball.x, ball.y, R, Math.PI, 0); g.fill();
          g.fillStyle = '#f8f8f8'; g.beginPath(); g.arc(ball.x, ball.y, R, 0, Math.PI); g.fill();
          g.strokeStyle = '#202028'; g.lineWidth = 1.5; g.beginPath(); g.arc(ball.x, ball.y, R, 0, Math.PI * 2); g.stroke();
        }
        for (let i = 0; i < BALLS; i++) { g.fillStyle = i < balls ? '#e83a3a' : 'rgba(255, 255, 255, 0.15)'; g.beginPath(); g.arc(20 + i * 14, H - 14, 5, 0, Math.PI * 2); g.fill(); }
        if (!ball && balls > 0) banner(g, 'READY', W / 2, 260, 22, '#ffd84a');
      },
    };
  },
}, onClose);
