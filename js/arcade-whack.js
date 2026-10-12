/* arcade-whack.js  -  Whac-a-Diglett, a home arcade game (js/arcade-kit.js): 30 seconds, nine holes, Diglett popping up
   faster and faster. Tap one before it hides: Diglett 1, Dugtrio 3; a Voltorb costs 5 and a shake. */

import { runArcade, drawMon, rand, banner } from './arcade-kit.js';

const W = 300, H = 330, TIME = 30;
const HOLES = Array.from({ length: 9 }, (_, i) => ({ x: 55 + (i % 3) * 95, y: 110 + Math.floor(i / 3) * 85 }));
const WHO = { diglett: 1, dugtrio: 3, voltorb: -5 };

export const openWhack = (onClose) => runArcade({
  id: 'whack', title: 'Whac-a-Diglett', colour: '#a8683a', W, H,
  intro: 'Tap the Diglett before they dig back down! Watch out for Voltorb.',
  help: [['Diglett pop out of the holes.', 'Tap one before it hides: 1 point, a Dugtrio 3.'], ['Don\'t tap a Voltorb!', 'It costs 5 points.'], [`You have ${TIME} seconds,`, 'and they get faster as the clock runs down.']],
  make(api) {
    const mons = HOLES.map(() => null), bonks = [];
    let left = TIME, next = 0.6, shake = 0;
    return {
      tick(dt, now) {
        left -= dt; shake = Math.max(0, shake - dt);
        if (left <= 0) return api.over('Time\'s up!');
        const pace = 1 - (TIME - left) / TIME * 0.55;
        next -= dt;
        if (next <= 0) {
          const free = mons.map((m, i) => (m ? -1 : i)).filter(i => i >= 0);
          if (free.length) {
            const i = free[Math.floor(Math.random() * free.length)], r = Math.random();
            mons[i] = { id: r < 0.12 ? 'voltorb' : r < 0.22 ? 'dugtrio' : 'diglett', up: 0, life: rand(0.8, 1.4) * pace, hit: false };
          }
          next = rand(0.35, 0.75) * pace;
        }
        mons.forEach((m, i) => {
          if (!m) return;
          m.up = Math.min(1, m.up + dt * 6);
          m.life -= dt;
          if (m.life <= 0) { m.up -= dt * 12; if (m.up <= 0) mons[i] = null; }
        });
        for (const b of bonks) b.t -= dt;
        while (bonks.length && bonks[0].t <= 0) bonks.shift();
      },
      down(x, y) {
        mons.forEach((m, i) => {
          if (!m || m.hit || m.up < 0.4) return;
          const h = HOLES[i];
          if (Math.abs(x - h.x) > 38 || y < h.y - 60 || y > h.y + 14) return;
          m.hit = true; m.life = Math.min(m.life, 0.05);
          const pts = WHO[m.id];
          api.add(pts); api.score = Math.max(0, api.score);
          bonks.push({ x: h.x, y: h.y - 50, text: pts > 0 ? `+${pts}` : `${pts}`, bad: pts < 0, t: 0.6 });
          if (pts < 0) { shake = 0.3; api.sound('thunder', 'cancel'); } else api.sound(pts > 1 ? 'plink-2' : 'plink-1');
        });
      },
      draw(g, now) {
        g.save();
        if (shake) g.translate(Math.sin(now / 20) * 4, 0);
        const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#9ed870'); sky.addColorStop(1, '#5aa040');
        g.fillStyle = sky; g.fillRect(-10, 0, W + 20, H);
        for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(40, 90, 30, 0.35)'; g.fillRect((i * 53) % W, 40 + (i * 37) % (H - 40), 3, 6); }
        HOLES.forEach((h, i) => {
          g.fillStyle = '#4a2c18'; g.beginPath(); g.ellipse(h.x, h.y, 36, 13, 0, 0, Math.PI * 2); g.fill();
          g.fillStyle = '#1e1008'; g.beginPath(); g.ellipse(h.x, h.y + 1, 30, 9, 0, 0, Math.PI * 2); g.fill();
          const m = mons[i];
          if (m && m.up > 0) {
            g.save(); g.beginPath(); g.rect(h.x - 40, h.y - 80, 80, 81); g.clip();
            drawMon(g, m.id, h.x, h.y + 4 + (1 - m.up) * 60, 58);
            if (m.hit) banner(g, '✦', h.x + 18, h.y - 50, 18, '#fff070');
            g.restore();
          }
          g.fillStyle = '#7a5030'; g.beginPath(); g.ellipse(h.x, h.y + 6, 36, 7, 0, 0, Math.PI); g.fill();
        });
        for (const b of bonks) banner(g, b.text, b.x, b.y - (0.6 - b.t) * 40, 20, b.bad ? '#ff6060' : '#fff070');
        g.restore();
        g.fillStyle = 'rgba(0, 0, 0, 0.3)'; g.fillRect(0, 0, W, 34);
        g.fillStyle = '#ffd84a'; g.fillRect(8, 12, (W - 16) * Math.max(0, left) / TIME, 10);
        banner(g, `${Math.ceil(Math.max(0, left))}`, W - 22, 17, 14);
      },
    };
  },
}, onClose);
