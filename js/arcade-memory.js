/* arcade-memory.js  -  Voltorb Memory, a home arcade game (js/arcade-kit.js): sixteen cards face down (a Voltorb on
   each back), eight pairs of Pokémon. Flip two at a time; a pair stays up. Clear the board for 10 a pair plus the
   seconds left, then a new board with less time. The clock running out ends it. */

import { runArcade, drawMon, banner } from './arcade-kit.js';

const W = 300, H = 330, POOL = ['pikachu', 'bulbasaur', 'charmander', 'squirtle', 'eevee', 'jigglypuff', 'psyduck', 'clefairy', 'togepi', 'meowth', 'slowpoke', 'snorlax', 'diglett', 'magikarp', 'ponyta', 'seel'];

export const openMemory = (onClose) => runArcade({
  id: 'memory', title: 'Voltorb Memory', colour: '#d83a3a', W, H,
  stick: false,
  intro: 'Find the matching pairs before the time runs out!',
  help: [['Tap a card to flip it, then another.', 'If they match they stay face up; if not, they flip back.'], ['Clear the board for 10 points a pair', 'plus a point for every second left. Then a new board, with less time.'], ['When the clock runs out,', 'the game is over.']],
  make(api) {
    let cards = [], open = [], board = 0, left = 0, wait = 0, flash = 0;
    const deal = () => {
      const mons = [...POOL].sort(() => Math.random() - 0.5).slice(0, 8);
      cards = [...mons, ...mons].sort(() => Math.random() - 0.5).map(id => ({ id, up: false, done: false, turn: 0 }));
      open = []; left = Math.max(25, 60 - board * 6); board += 1;
    };
    deal();
    const cell = (i) => ({ x: 14 + (i % 4) * 68, y: 44 + Math.floor(i / 4) * 70, w: 62, h: 64 });
    return {
      tick(dt) {
        left -= dt; flash = Math.max(0, flash - dt);
        for (const c of cards) c.turn += ((c.up || c.done ? 1 : 0) - c.turn) * Math.min(1, dt * 14);
        if (wait > 0) { wait -= dt; if (wait <= 0) { for (const c of open) c.up = false; open = []; } }
        if (left <= 0) api.over('Time\'s up!');
      },
      down(x, y) {
        if (wait > 0) return;
        const i = cards.findIndex((_, n) => { const r = cell(n); return x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h; });
        const c = cards[i];
        if (!c || c.up || c.done) return;
        c.up = true; open.push(c); api.sound('select');
        if (open.length < 2) return;
        if (open[0].id === open[1].id) {
          for (const o of open) o.done = true;
          open = []; api.sound('plink-2');
          if (cards.every(o => o.done)) { api.add(80 + Math.ceil(left)); api.sound('stat-up'); api.say(`Board ${board} cleared! Here comes the next one.`); flash = 1; deal(); }
        } else { wait = 0.7; api.sound('cancel'); }
      },
      draw(g, now) {
        g.fillStyle = '#2a1a3a'; g.fillRect(0, 0, W, H);
        cards.forEach((c, i) => {
          const r = cell(i), sx = Math.abs(Math.cos(c.turn * Math.PI));
          const face = c.turn > 0.5;
          g.save(); g.translate(r.x + r.w / 2, r.y + r.h / 2); g.scale(Math.max(0.05, sx), 1);
          g.fillStyle = face ? (c.done ? '#fff4c8' : '#f8f8f8') : '#c82838';
          g.beginPath(); g.roundRect(-r.w / 2, -r.h / 2, r.w, r.h, 8); g.fill();
          if (face) drawMon(g, c.id, 0, r.h / 2 - 6, 50);
          else {
            g.fillStyle = '#f8f8f8'; g.beginPath(); g.arc(0, 0, 20, 0, Math.PI); g.fill();
            g.fillStyle = '#e83a3a'; g.beginPath(); g.arc(0, 0, 20, Math.PI, 0); g.fill();
            g.fillStyle = '#202028'; g.beginPath(); g.ellipse(-7, -6, 3, 4, 0, 0, Math.PI * 2); g.ellipse(7, -6, 3, 4, 0, 0, Math.PI * 2); g.fill();
          }
          g.restore();
        });
        g.fillStyle = 'rgba(0, 0, 0, 0.35)'; g.fillRect(0, 0, W, 34);
        g.fillStyle = left < 10 ? '#ff6060' : '#ffd84a'; g.fillRect(8, 12, (W - 80) * Math.max(0, left) / Math.max(25, 60 - (board - 1) * 6), 10);
        banner(g, `${Math.ceil(Math.max(0, left))}s`, W - 50, 17, 14);
        banner(g, `#${board}`, W - 18, 17, 12, '#c8c8f0');
        if (flash) banner(g, 'CLEARED!', W / 2, H / 2, 32 * (1 + flash * 0.2), '#ffd84a');
      },
    };
  },
}, onClose);
