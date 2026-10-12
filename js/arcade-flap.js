/* arcade-flap.js  -  Pidgey Flap, a home arcade game (js/arcade-kit.js; it took Magikarp Fishing's place, 2026-10-12, the
   user's call): Pidgey flies on by itself, a tap flaps it up, and it slips through the gaps between tree trunks. A
   point a gap; the gaps close in and come quicker the further it gets. */

import { runArcade, drawMon, rand, banner } from './arcade-kit.js';

const W = 300, H = 360, GROUND = 330, GRAV = 900, FLAP = -290, BIRD_X = 90, R = 13, TRUNK = 46;

export const openFlap = (onClose) => runArcade({
  id: 'flap', title: 'Pidgey Flap', colour: '#c8904a', W, H,
  intro: 'Tap to flap! Fly Pidgey through the gaps.',
  help: [['Tap (or press Space) to flap.', 'Pidgey drops when you stop.'], ['Fly through the gaps between the trees.', 'Touch a trunk or the ground and it\'s over.'], ['A point for every gap.', 'They get narrower and faster as you go.']],
  make(api) {
    let y = H * 0.42, vy = 0, x0 = 0, speed = 110, next = 0.4, flapped = 0, dead = false;
    const trees = [];
    const gap = () => Math.max(92, 140 - api.score * 2.4);
    const flap = () => { if (dead) return; vy = FLAP; flapped = 0.18; api.sound('select'); };
    return {
      tick(dt) {
        speed = Math.min(190, 110 + api.score * 3);
        vy += GRAV * dt; y += vy * dt; x0 += speed * dt; flapped = Math.max(0, flapped - dt);
        next -= dt;
        if (next <= 0) { const g = gap(); trees.push({ x: W + 10, top: rand(50, GROUND - 40 - g), g, passed: false }); next = 175 / speed; }
        for (const t of trees) {
          t.x -= speed * dt;
          if (!t.passed && t.x + TRUNK < BIRD_X - R) { t.passed = true; api.add(1); api.sound('plink-2'); }
        }
        while (trees.length && trees[0].x < -TRUNK - 10) trees.shift();
        if (y < R) { y = R; vy = Math.max(0, vy); }
        if (y + R >= GROUND) { dead = true; return api.over('Splat!'); }
        for (const t of trees) {
          const nx = Math.max(t.x, Math.min(BIRD_X, t.x + TRUNK));
          for (const [a, b] of [[-100, t.top], [t.top + t.g, GROUND]]) {
            const ny = Math.max(a, Math.min(y, b));
            if (Math.hypot(BIRD_X - nx, y - ny) < R - 2) { dead = true; return api.over('Bonk!'); }
          }
        }
      },
      down() { flap(); },
      key(k, down) { if (down && (k === 'act' || k === 'up')) flap(); },
      draw(g, now) {
        const sky = g.createLinearGradient(0, 0, 0, GROUND); sky.addColorStop(0, '#68b8f0'); sky.addColorStop(1, '#d8f0ff');
        g.fillStyle = sky; g.fillRect(0, 0, W, GROUND);
        g.fillStyle = 'rgba(255, 255, 255, 0.85)';
        for (let i = 0; i < 4; i++) {
          const cx = ((i * 110 - x0 * 0.15) % 440 + 440) % 440 - 60, cy = 40 + (i % 3) * 38;
          g.beginPath(); g.ellipse(cx, cy, 30, 11, 0, 0, Math.PI * 2); g.ellipse(cx + 18, cy - 7, 18, 10, 0, 0, Math.PI * 2); g.fill();
        }
        g.fillStyle = '#7ab868';
        for (let i = 0; i < 6; i++) { const cx = ((i * 70 - x0 * 0.4) % 420 + 420) % 420 - 60; g.beginPath(); g.arc(cx, GROUND, 46 + (i % 3) * 12, Math.PI, 0); g.fill(); }
        for (const t of trees) {
          for (const [a, b] of [[0, t.top], [t.top + t.g, GROUND]]) {
            const tg = g.createLinearGradient(t.x, 0, t.x + TRUNK, 0); tg.addColorStop(0, '#6a4022'); tg.addColorStop(0.45, '#9a6a3a'); tg.addColorStop(1, '#5a341a');
            g.fillStyle = tg; g.fillRect(t.x, a, TRUNK, b - a);
            g.strokeStyle = 'rgba(40, 20, 8, 0.35)'; g.lineWidth = 1.5;
            for (let k = a + 14; k < b - 6; k += 26) { g.beginPath(); g.moveTo(t.x + 8, k); g.quadraticCurveTo(t.x + TRUNK / 2, k + 6, t.x + TRUNK - 8, k); g.stroke(); }
            g.fillStyle = '#4a2a12'; g.fillRect(t.x - 2, a ? a : b - 6, TRUNK + 4, 6);
          }
        }
        g.fillStyle = '#5a9a3a'; g.fillRect(0, GROUND, W, H - GROUND);
        g.fillStyle = '#4a8a2a'; for (let i = 0; i < 16; i++) g.fillRect(((i * 24 - x0) % W + W) % W, GROUND + 6 + (i % 3) * 7, 12, 3);
        g.save(); g.translate(BIRD_X, y); g.rotate(Math.max(-0.5, Math.min(0.9, vy / 500)));
        drawMon(g, 'pidgey', 0, R + 4 - (flapped > 0 ? 3 : 0), 34, true);
        g.restore();
        banner(g, String(api.score), W / 2, 34, 28);
      },
    };
  },
}, onClose);
