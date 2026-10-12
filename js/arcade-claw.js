/* arcade-claw.js  -  Slowpoke's Claw Machine, a home arcade game (js/arcade-kit.js): the claw glides back and forth,
   a tap drops it; land it over a mini doll and it may hold on (the nearer the middle, the likelier) and carry it to
   the chute. Most dolls 1, a shiny gold one 5. Seven tries a game, and the pile is topped up as you win. */

import { runArcade, drawMon, rand, banner } from './arcade-kit.js';

const W = 300, H = 340, TOP = 50, FLOOR = 290, TRIES = 7, CHUTE = 36;
const DOLLS = ['slowpoke', 'pikachu', 'jigglypuff', 'psyduck', 'clefairy', 'togepi', 'eevee', 'poliwag', 'seel', 'diglett'];

export const openClaw = (onClose) => runArcade({
  id: 'claw', title: 'Claw Machine', colour: '#e870a8', W, H,
  intro: 'Slowpoke\'s claw machine! Tap to drop the claw on a doll.',
  help: [['The claw slides back and forth.', 'Tap to drop it.'], ['Land it right over a doll', 'and it might hold on all the way to the chute. A gold doll is worth 5!'], [`You get ${TRIES} tries.`, 'Every doll you win is a point.']],
  make(api) {
    let x = 120, dir = 1, phase = 'move', y = TOP, held = null, tries = TRIES, t = 0, slip = 0;
    const pile = [];
    const add = () => { const gold = Math.random() < 0.1; pile.push({ id: DOLLS[Math.floor(Math.random() * DOLLS.length)], x: rand(CHUTE + 40, W - 30), gold }); };
    for (let i = 0; i < 7; i++) add();
    return {
      tick(dt) {
        t += dt;
        if (phase === 'move') { x += dir * 110 * dt; if (x > W - 24) dir = -1; if (x < CHUTE + 30) dir = 1; }
        else if (phase === 'down') { y += 200 * dt; if (y >= FLOOR - 40) { y = FLOOR - 40; phase = 'grab'; t = 0; } }
        else if (phase === 'grab' && t > 0.35) {
          const near = pile.map((d, i) => [Math.abs(d.x - x), i]).sort((a, b) => a[0] - b[0])[0];
          if (near && near[0] < 22 && Math.random() < 0.9 - near[0] / 30) { held = pile.splice(near[1], 1)[0]; slip = Math.random() < 0.18 ? rand(0.3, 0.8) : 0; api.sound('select'); }
          phase = 'up';
        } else if (phase === 'up') {
          y -= 160 * dt;
          if (held && slip && y < FLOOR - 40 - (FLOOR - TOP) * slip) { held.x = x; pile.push(held); held = null; api.sound('cancel'); api.say('Oh! It slipped out!'); }
          if (y <= TOP) { y = TOP; phase = 'home'; }
        } else if (phase === 'home') {
          x -= 120 * dt;
          if (x <= CHUTE / 2 + 4) {
            if (held) { api.add(held.gold ? 5 : 1); api.sound(held.gold ? 'stat-up' : 'coins', 'plink-2'); api.say(held.gold ? 'A gold doll! +5!' : 'Got one!'); add(); held = null; }
            tries -= 1;
            if (tries <= 0) return api.over('Out of tries!');
            phase = 'move'; dir = 1;
          }
        }
      },
      down() { if (phase === 'move') { phase = 'down'; api.sound('confirm', 'select'); } },
      key(k, down) { if (down && k === 'act') this.down(); },
      draw(g, now) {
        g.fillStyle = '#ffd8ec'; g.fillRect(0, 0, W, H);
        g.fillStyle = '#e870a8'; g.fillRect(0, 0, W, 30); banner(g, 'SLOWPOKE CLAW', W / 2, 16, 14, '#fff');
        g.fillStyle = 'rgba(200, 240, 255, 0.35)'; g.fillRect(6, 34, W - 12, FLOOR - 30);
        g.fillStyle = '#8a4a6a'; g.fillRect(0, FLOOR, W, H - FLOOR);
        g.fillStyle = '#5a2a4a'; g.fillRect(4, FLOOR - 40, CHUTE, 40); banner(g, '▼', CHUTE / 2 + 4, FLOOR - 50, 16, '#ffd84a');
        for (const d of pile) {
          drawMon(g, d.id, d.x, FLOOR + 2, 36);
          if (d.gold) { g.fillStyle = `rgba(255, 216, 74, ${0.35 + 0.2 * Math.sin(now / 200)})`; g.beginPath(); g.arc(d.x, FLOOR - 18, 20, 0, Math.PI * 2); g.fill(); }
        }
        g.strokeStyle = '#a8a8b8'; g.lineWidth = 3; g.beginPath(); g.moveTo(6, TOP - 12); g.lineTo(W - 6, TOP - 12); g.stroke();
        g.lineWidth = 2; g.beginPath(); g.moveTo(x, TOP - 12); g.lineTo(x, y); g.stroke();
        const open = phase === 'down' || (phase === 'grab' && t < 0.2) ? 1 : 0.3;
        g.strokeStyle = '#d8d8e8'; g.lineWidth = 4;
        for (const s of [-1, 1]) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + s * 10 * (1 + open), y + 14); g.lineTo(x + s * 4, y + 26); g.stroke(); }
        g.fillStyle = '#c8c8d8'; g.fillRect(x - 8, y - 6, 16, 8);
        if (held) drawMon(g, held.id, x, y + 40, 32);
        for (let i = 0; i < TRIES; i++) { g.fillStyle = i < tries ? '#e870a8' : 'rgba(0, 0, 0, 0.2)'; g.beginPath(); g.arc(W - 14 - i * 14, FLOOR + 30, 5, 0, Math.PI * 2); g.fill(); }
        drawMon(g, 'slowpoke', 40, H - 2, 34);
      },
    };
  },
}, onClose);
