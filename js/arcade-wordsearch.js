/* arcade-wordsearch.js  -  Unown Word Search, a home arcade game (js/arcade-kit.js): an 8x8 grid of Unown letters
   hides six Pokémon names, across, down or diagonal. Drag from a name's first letter to its last. 10 a letter found,
   the seconds left as a bonus when the grid is cleared, then a new grid with less time. */

import { runArcade, banner, pick } from './arcade-kit.js';

const W = 300, H = 360, N = 8, CELL = 34, X0 = 14, Y0 = 46, WORDS = 6;
const NAMES = ['PIKACHU', 'EEVEE', 'ONIX', 'ABRA', 'MEW', 'DITTO', 'ZUBAT', 'GOLEM', 'SEEL', 'MUK', 'PONYTA', 'SLOWPOKE', 'MAGIKARP', 'SNORLAX', 'UNOWN',
  'TOGEPI', 'LAPRAS', 'VULPIX', 'ODDISH', 'PSYDUCK', 'MEOWTH', 'GENGAR', 'RAICHU', 'MACHOP', 'GASTLY', 'HORSEA', 'STARYU', 'JYNX', 'LUGIA', 'CELEBI', 'MARILL', 'NATU', 'WOOPER', 'EKANS', 'ARBOK', 'PIDGEY', 'RATTATA'];
const DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];

function grid() {
  for (;;) {
    const cells = Array(N * N).fill(null), placed = [];
    for (const word of [...NAMES].sort(() => Math.random() - 0.5)) {
      if (placed.length >= WORDS || word.length > N) continue;
      for (let tries = 0; tries < 40; tries++) {
        const [dx, dy] = pick(DIRS), x = Math.floor(Math.random() * N), y = Math.floor(Math.random() * N);
        const ex = x + dx * (word.length - 1), ey = y + dy * (word.length - 1);
        if (ex < 0 || ex >= N || ey < 0 || ey >= N) continue;
        if (![...word].every((ch, i) => { const c = cells[(y + dy * i) * N + x + dx * i]; return c == null || c === ch; })) continue;
        [...word].forEach((ch, i) => { cells[(y + dy * i) * N + x + dx * i] = ch; });
        placed.push({ word, x, y, ex, ey, found: false });
        break;
      }
    }
    if (placed.length < WORDS) continue;
    const ABC = 'ABCDEFGHIJKLMNOPRSTUVWY';
    return { cells: cells.map(c => c ?? ABC[Math.floor(Math.random() * ABC.length)]), words: placed };
  }
}

export const openWordSearch = (onClose) => runArcade({
  id: 'words', title: 'Unown Word Search', colour: '#6a5ac8', W, H,
  intro: 'Find the hidden Pokémon! Drag from a name\'s first letter to its last.',
  help: [['Six Pokémon names hide in the Unown letters:', 'across, down or diagonal, always read forwards.'], ['Drag from a name\'s first letter to its last', 'to circle it. 10 points a letter.'], ['Find all six for a time bonus,', 'then a new grid comes with less time. When the clock runs out, the game is over.']],
  make(api) {
    let g0 = grid(), left = 90, board = 1, from = null, to = null, flash = 0;
    const cellAt = (x, y) => { const c = Math.floor((x - X0) / CELL), r = Math.floor((y - Y0) / CELL); return c >= 0 && c < N && r >= 0 && r < N ? [c, r] : null; };
    const line = (a, b) => { if (!a || !b) return null; const dx = b[0] - a[0], dy = b[1] - a[1]; return dx === 0 || dy === 0 || Math.abs(dx) === Math.abs(dy) ? [a, b] : null; };
    return {
      tick(dt) {
        left -= dt; flash = Math.max(0, flash - dt);
        if (left <= 0) api.over('Time\'s up!');
      },
      down(x, y) { from = cellAt(x, y); to = from; },
      move(x, y, pressed) { if (pressed && from) to = cellAt(x, y) ?? to; },
      up() {
        const l = line(from, to); from = null; to = null;
        if (!l) return;
        const [[ax, ay], [bx, by]] = l;
        const w = g0.words.find(o => !o.found && ((o.x === ax && o.y === ay && o.ex === bx && o.ey === by) || (o.x === bx && o.y === by && o.ex === ax && o.ey === ay)));
        if (!w) { api.sound('cancel'); return; }
        w.found = true; api.add(w.word.length * 10); api.sound('plink-2'); api.say(`Found ${w.word[0]}${w.word.slice(1).toLowerCase()}!`);
        if (g0.words.every(o => o.found)) { api.add(Math.ceil(left)); api.sound('stat-up'); flash = 1; board += 1; g0 = grid(); left = Math.max(45, 95 - board * 8); api.say(`Grid ${board - 1} cleared! Here's the next.`); }
      },
      draw(g, now) {
        g.fillStyle = '#1e1a3a'; g.fillRect(0, 0, W, H);
        const mark = (a, b, colour) => {
          g.strokeStyle = colour; g.lineWidth = CELL * 0.7; g.lineCap = 'round';
          g.beginPath(); g.moveTo(X0 + (a[0] + 0.5) * CELL, Y0 + (a[1] + 0.5) * CELL); g.lineTo(X0 + (b[0] + 0.5) * CELL, Y0 + (b[1] + 0.5) * CELL); g.stroke();
        };
        for (const w of g0.words) if (w.found) mark([w.x, w.y], [w.ex, w.ey], 'rgba(120, 220, 140, 0.45)');
        if (from && to) mark(from, to, line(from, to) ? 'rgba(255, 216, 74, 0.5)' : 'rgba(255, 96, 96, 0.4)');
        g0.cells.forEach((ch, i) => {
          const cx = X0 + (i % N + 0.5) * CELL, cy = Y0 + (Math.floor(i / N) + 0.5) * CELL;
          g.fillStyle = '#2e2a5a'; g.beginPath(); g.arc(cx, cy, CELL * 0.42, 0, Math.PI * 2); g.fill();
          g.fillStyle = '#f8f8f8'; g.beginPath(); g.arc(cx, cy - 1, 5, 0, Math.PI * 2); g.fill();
          g.fillStyle = '#202028'; g.beginPath(); g.arc(cx, cy - 1, 2.4, 0, Math.PI * 2); g.fill();
          g.font = '800 15px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
          g.fillStyle = '#c8c0ff'; g.fillText(ch, cx, cy + 9);
        });
        g.fillStyle = 'rgba(0, 0, 0, 0.35)'; g.fillRect(0, 0, W, 34);
        g.fillStyle = left < 15 ? '#ff6060' : '#ffd84a'; g.fillRect(8, 12, (W - 70) * Math.max(0, left) / Math.max(45, 95 - (board - 1) * 8), 10);
        banner(g, `${Math.ceil(Math.max(0, left))}s`, W - 34, 17, 14);
        g.font = '700 12px system-ui, sans-serif'; g.textAlign = 'center';
        g0.words.forEach((w, i) => { g.fillStyle = w.found ? 'rgba(160, 230, 170, 0.6)' : '#ffffff'; g.fillText(w.found ? `✓ ${w.word}` : w.word, 52 + (i % 3) * 98, Y0 + N * CELL + 16 + Math.floor(i / 3) * 18); });
        if (flash) banner(g, 'CLEARED!', W / 2, H / 2 - 20, 32, '#ffd84a');
      },
    };
  },
}, onClose);
