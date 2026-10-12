/* arcade-runner.js  -  Ponyta Dash, a home arcade game (js/arcade-kit.js): Ponyta gallops on by itself, a tap jumps
   (held a little longer, higher) over rocks and logs; Pidgey swoop low later on. A point a metre, faster and faster. */

import { runArcade, drawMon, rand, banner } from './arcade-kit.js';

const W = 320, H = 220, GROUND = 180, GRAV = 1500, JUMP = 440, FALL = 2.2;   // a hop drops quicker than it rises (the user's ask, 2026-10-12: it floated)

export const openRunner = (onClose) => runArcade({
  id: 'runner', title: 'Ponyta Dash', colour: '#e87830', W, H,
  intro: 'Gallop as far as you can! Tap to jump.',
  help: [['Ponyta runs by itself.', 'Tap (or press Space) to jump over rocks and logs.'], ['Hold the tap a moment to jump higher.', 'Later on, duck under swooping Pidgey by not jumping!'], ['A point for every metre.', 'It gets faster the further you go.']],
  make(api) {
    let y = 0, vy = 0, held = false, speed = 190, dist = 0, next = 1.2;
    const things = [];
    const jump = () => { if (y === 0) { vy = JUMP; held = true; api.sound('select'); } };
    return {
      tick(dt) {
        speed = Math.min(520, speed + dt * 9);
        dist += speed * dt / 30;
        if (Math.floor(dist) > api.score) api.score = Math.floor(dist);
        vy -= (vy > 0 ? (held ? GRAV * 0.5 : GRAV) : GRAV * FALL) * dt; y = Math.max(0, y + vy * dt); if (y === 0) vy = 0;
        next -= dt;
        if (next <= 0) {
          const r = Math.random(), bird = dist > 60 && r < 0.25;
          things.push(bird ? { x: W + 20, w: 26, h: 22, y: 46, bird: true } : r < 0.6 ? { x: W + 20, w: 22, h: 22, y: 0 } : { x: W + 20, w: 44, h: 18, y: 0, log: true });
          next = rand(0.7, 1.5) * 260 / speed;
        }
        for (const t of things) t.x -= speed * dt * (t.bird ? 1.25 : 1);
        while (things.length && things[0].x < -60) things.shift();
        for (const t of things) {
          const px = 60, pw = 26, ph = 34;
          if (px + pw / 2 > t.x && px - pw / 2 < t.x + t.w && y < t.y + t.h && y + ph > t.y) return api.over(t.bird ? 'Bonk! A Pidgey!' : 'Tripped!');
        }
      },
      down() { jump(); },
      up() { held = false; },
      key(k, down) { if (k === 'act' || k === 'up') { if (down) jump(); else held = false; } },
      draw(g, now) {
        const sky = g.createLinearGradient(0, 0, 0, GROUND); sky.addColorStop(0, '#f8a860'); sky.addColorStop(1, '#fde0a8');
        g.fillStyle = sky; g.fillRect(0, 0, W, GROUND);
        g.fillStyle = '#ffe070'; g.beginPath(); g.arc(250, 60, 26, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#d88a58';
        for (let i = 0; i < 4; i++) { const x = ((i * 130 - dist * 2) % 520 + 520) % 520 - 140; g.beginPath(); g.moveTo(x, GROUND); g.lineTo(x + 70, GROUND - 60); g.lineTo(x + 140, GROUND); g.fill(); }
        g.fillStyle = '#c87a40'; g.fillRect(0, GROUND, W, H - GROUND);
        g.fillStyle = '#a86030'; for (let i = 0; i < 12; i++) g.fillRect(((i * 40 - dist * 30) % 480 + 480) % 480 - 10, GROUND + 14 + (i % 3) * 8, 10, 2);
        for (const t of things) {
          if (t.bird) drawMon(g, 'pidgey', t.x + t.w / 2, GROUND - t.y + 6, 30, true);
          else if (t.log) { g.fillStyle = '#7a4a24'; g.fillRect(t.x, GROUND - t.h, t.w, t.h); g.fillStyle = '#c89a60'; g.beginPath(); g.ellipse(t.x + t.w, GROUND - t.h / 2, 5, t.h / 2, 0, 0, Math.PI * 2); g.fill(); }
          else { g.fillStyle = '#7a7a88'; g.beginPath(); g.moveTo(t.x, GROUND); g.lineTo(t.x + t.w / 2, GROUND - t.h); g.lineTo(t.x + t.w, GROUND); g.fill(); g.fillStyle = '#9a9aa8'; g.fillRect(t.x + t.w / 2 - 2, GROUND - t.h + 4, 3, 6); }
        }
        const bob = y === 0 ? Math.abs(Math.sin(now / 70)) * 3 : 0;
        drawMon(g, 'ponyta', 60, GROUND - y - bob + 4, 48, true);
        if (y === 0) for (let i = 0; i < 3; i++) { g.fillStyle = `rgba(255, ${140 + i * 40}, 40, 0.6)`; g.beginPath(); g.arc(36 - i * 8, GROUND - 22 + Math.sin(now / 60 + i) * 4, 4 - i, 0, Math.PI * 2); g.fill(); }
        banner(g, `${Math.floor(dist)} m`, W - 40, 20, 14);
      },
    };
  },
}, onClose);
