/* mall-corner.js  -  the Poké Mall's Game Corner, walked into: a huge neon arcade behind the hall's middle front
   (rebuilt 2026-10-10, the user's ask: the room bigger, and no more cramped prize cases). Along the back wall four big
   showcase screens, each cycling through what it sells, opened up close to step through one at a time (js/showcase.js):
   Pokémon skins, shinies, perks and Poké Balls, either side of Meowth's prize counter. Down the floor the games: Voltorb
   Flip, Who's That Pokémon?, Memory Match and the Gachapon, with neon pillars and attract cabinets round the walls.
   Painted smooth (fine()); js/mall-3d.js walks it (its own COLS x ROWS, the camera following you), this file builds it. */

import { cornerEntries } from './shop.js';
import { trim } from './hd2d.js';
import { fine, texOf, words, star, GC } from './hub-3d.js';
import { SHOWCASES } from './showcase.js';

/* The room: `x` a thing's first tile, `w` its tiles; y 0 is the back wall. */
const COLS = 21, ROWS = 13, RUNNER = 10, DOOR = { x: RUNNER, y: ROWS - 1 };
const COUNTER = { x: 9, y: 1, w: 3 };
const SHOWS = [
  { row: 'skins', x: 0, w: 3 },
  { row: 'shiny', x: 4, w: 4 },
  { row: 'perks', x: 13, w: 4 },
  { row: 'balls', x: 18, w: 3 },
];
const SHOW_H = 3.1, SHOW_D = 0.8, SCREEN = { x0: 0.07, x1: 0.93, y0: 0.2, y1: 0.8 };   // the screen's share of the face
const CYCLE = 3600;   // ms each thing stays on a showcase's screen
const CAB_H = 1.6;    // a game cabinet's height
/* The games (the revamp, 2026-10-10): free to play for a shared daily pot, and the Gachapon of big dolls. */
const GAMES = {
  voltorb: { at: { x: 8, y: 5 }, name: 'Voltorb Flip', colour: '#58d080',
    line: 'Voltorb Flip! Clear the board for PokéCoins: the games pay up to 250 a day between them. Tap again to sit down, meow.',
    open: (done) => import('./voltorb.js').then(m => m.openVoltorb(done)) },
  quiz: { at: { x: 5, y: 5 }, name: 'Who\'s That Pokémon?', colour: '#4a90f0',
    line: 'Who\'s That Pokémon? Ten silhouettes, name \'em for coins. Tap again to play, meow.',
    open: (done) => import('./quiz.js').then(m => m.openQuiz(done)) },
  memory: { at: { x: 12, y: 5 }, name: 'Memory Match', colour: '#e070c0',
    line: 'Memory Match! Find the pairs, fewer misses pays more. Tap again to play, meow.',
    open: (done) => import('./memory.js').then(m => m.openMemory(done)) },
  gacha: { at: { x: 15, y: 5 }, name: 'Gachapon',
    line: 'The Gachapon! Big Pokémon dolls you can\'t buy anywhere else, a new set every Monday. Tap again to have a look, meow.',
    open: (done) => import('./gachapon.js').then(m => m.openGachapon(done)) },
};
/* The betting games (2026-10-10, the user's ask): a bank of slot machines either side of the runner, a Blackjack and a
   Roulette table, and High-Low. */
const CASINO = {
  slots: { ats: [{ x: 7, y: 8 }, { x: 8, y: 8 }, { x: 12, y: 8 }, { x: 13, y: 8 }], name: 'Slots', colour: '#ff5a5a',
    line: 'The slots! Bet 10 to 100 a spin. Three 7s pays a hundred times, meow. Tap again to play.',
    open: (done) => import('./slots.js').then(m => m.openSlots(done)) },
  highlow: { at: { x: 2, y: 5 }, name: 'High-Low', colour: '#ffd84a',
    line: 'High-Low: higher or lower, let it ride or cash out. Tap again to play, meow.',
    open: (done) => import('./highlow.js').then(m => m.openHighLow(done)) },
  blackjack: { at: { x: 3, y: 7 }, w: 2, name: 'Blackjack',
    line: 'Blackjack! I deal, you try to beat me to 21. Blackjack pays 3 to 2. Tap again to sit down.',
    open: (done) => import('./blackjack.js').then(m => m.openBlackjack(done)) },
  roulette: { at: { x: 16, y: 7 }, w: 2, name: 'Roulette',
    line: 'Roulette! Red or black, odd or even, or one lucky number. Tap again to sit down, meow.',
    open: (done) => import('./roulette.js').then(m => m.openRoulette(done)) },
};
const PILLARS = [[1, 9], [6, 10], [14, 10], [19, 9]];
const ATTRACT = [[0, 4], [0, 6], [0, 8], [20, 4], [20, 6], [20, 8]];   // scenery cabinets down the side walls

const NEON = { pink: '#ff5ab8', cyan: '#4ae8f0', gold: '#ffd84a', lime: '#9cf060' };
const WALL = ['#3a2260', '#2a1648', '#1c0e34'];

/* Meowth keeps the Game Corner (Pay Day: it can't keep its paws off a coin). */
export const KEEPER = {
  id: 'meowth', name: 'Meowth', src: 'assets/pokemon/meowth-front.gif',
  hello: ['Welcome to the Game Corner, meow! Everything here\'s for PokéCoins.', 'A customer! Step right up, the prizes won\'t buy themselves, meow.', 'Big screens on the back wall, games on the floor. Tap anything!'],
  chat: ['Coins, coins, coins! You win \'em on your runs, you spend \'em here. That\'s the deal, meow.', 'Voltorb Flip\'s on the house. Just mind the Voltorbs, meow!', 'Something\'s on sale every day. Look for the pink DEAL tag, meow.', 'I put a doll in that Gachapon I\'ve never seen myself. Lucky you if you get it!', 'Tap a big screen and flip through it, left and right. Every shiny\'s in there, meow.', 'Who\'s That Pokémon? I always say Meowth. I\'m usually wrong.', 'Pay Day is my favourite move. Can you tell?', 'Feeling lucky? The slots, the tables and High-Low take bets. The house only closes once you\'re 500 up for the day, meow.', 'Blackjack against me? Bold. I like bold. I like your coins more.'],
};

/* ---------- painting ---------- */

const glow = (g, col, blur) => { g.shadowColor = col; g.shadowBlur = blur; };

/** A neon tube along a path: a soft halo, the colour, a white-hot core; the shine map gets it too. */
function tube(g, s, col, w, path) {
  for (const [ctx, c, lw, b] of [[g, col, w * 2.2, w * 3], [g, col, w, 0], [g, '#ffffff', w * 0.35, 0], [s, col, w * 1.4, w * 2]]) {
    ctx.save(); glow(ctx, c, b); ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.globalAlpha = lw > w * 2 ? 0.35 : 1;
    ctx.beginPath(); path(ctx); ctx.stroke(); ctx.restore();
  }
}

function coin(g, x, y, r) {
  g.fillStyle = GC.goldDark; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  g.fillStyle = GC.gold; g.beginPath(); g.arc(x, y, r * 0.8, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#fff6c8'; star(g, x, y, r * 0.5);
}

/** Violet wallpaper in a gold lattice, with stars; `wy` turns a height into the painting's y. */
function paper(f, W, H) {
  const { g, lin } = f;
  g.fillStyle = lin(0, 0, 0, H, [WALL[2], WALL[1], WALL[0], WALL[1]]); g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(248,208,64,0.12)'; g.lineWidth = 0.5;
  for (let k = -H; k < W; k += 10) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + H, H); g.moveTo(k, H); g.lineTo(k + H, 0); g.stroke(); }
  for (let i = 0; i < 60; i++) {
    const x = (i * 97.3) % W, y = (i * 53.7) % (H * 0.6);
    g.fillStyle = `rgba(255,240,200,${0.25 + (i % 4) * 0.12})`; star(g, x, y, 0.8 + (i % 3) * 0.4);
  }
}

/** The back wall: neon bands, GAME CORNER in bulbs over the counter, and up high a neon Poké Ball, a coin and 777. */
function wallArt({ cols, top: TOP, u: U }) {
  const W = (cols + 0.8) * U, H = TOP * U, f = fine(W, H, 4), { g, rr, lin, shine } = f, s = shine();
  const wx = (t) => (t + 0.4) * U, wy = (y) => (TOP - y) * U;
  paper(f, W, H);
  // a dark wainscot under a cyan tube, a pink tube up where a storey would end
  rr(0, wy(0.9), W, H - wy(0.9), 0, lin(0, wy(0.9), 0, H, ['#24123e', '#140a24']));
  tube(g, s, NEON.cyan, 1.1, (c) => { c.moveTo(0, wy(0.9)); c.lineTo(W, wy(0.9)); });
  tube(g, s, NEON.pink, 1.1, (c) => { c.moveTo(0, wy(5.4)); c.lineTo(W, wy(5.4)); });
  // the sign: a red board ringed with bulbs, gold letters
  const cx = wx(COUNTER.x + COUNTER.w / 2), sw = 5.4 * U, sh = 22, sy = wy(4.6);
  rr(cx - sw / 2 - 2, sy - 2, sw + 4, sh + 4, 4, GC.goldDark);
  rr(cx - sw / 2, sy, sw, sh, 3, lin(0, sy, 0, sy + sh, [GC.red, GC.redDark]));
  s.fillStyle = '#3a1010'; s.beginPath(); s.roundRect(cx - sw / 2, sy, sw, sh, 3); s.fill();
  for (let i = 0; i <= 26; i++) for (const y of [sy + 1.6, sy + sh - 1.6]) {
    const x = cx - sw / 2 + 2 + i * (sw - 4) / 26;
    g.fillStyle = '#fff6c8'; g.beginPath(); g.arc(x, y, 0.9, 0, Math.PI * 2); g.fill();
    s.fillStyle = '#ffffff'; s.beginPath(); s.arc(x, y, 1.1, 0, Math.PI * 2); s.fill();
  }
  g.save(); glow(g, NEON.gold, 4); words(g, 'GAME CORNER', cx, sy + sh / 2 + 0.6, 11, GC.gold); g.restore();
  words(s, 'GAME CORNER', cx, sy + sh / 2 + 0.6, 11, '#ffe890');
  coin(g, cx - sw / 2 + 9, sy + sh / 2, 5); coin(g, cx + sw / 2 - 9, sy + sh / 2, 5);
  // up high, for a tall phone: neon shapes
  const hy = wy(7.6);
  tube(g, s, NEON.pink, 1.2, (c) => { c.arc(wx(2.2), hy, 16, 0, Math.PI * 2); c.moveTo(wx(2.2) - 16, hy); c.lineTo(wx(2.2) - 5, hy); c.moveTo(wx(2.2) + 5, hy); c.lineTo(wx(2.2) + 16, hy); });
  tube(g, s, NEON.pink, 1.2, (c) => { c.moveTo(wx(2.2) + 5, hy); c.arc(wx(2.2), hy, 5, 0, Math.PI * 2); });
  tube(g, s, NEON.gold, 1.2, (c) => { c.arc(wx(cols - 2.2), hy, 15, 0, Math.PI * 2); c.moveTo(wx(cols - 2.2) + 7, hy); c.arc(wx(cols - 2.2), hy, 7, 0, Math.PI * 2); });
  g.save(); glow(g, NEON.cyan, 6); words(g, '7 7 7', W / 2, hy, 22, NEON.cyan); g.restore();
  words(g, '7 7 7', W / 2, hy, 22, '#e8ffff'); words(s, '7 7 7', W / 2, hy, 22, NEON.cyan);
  return f.c;
}

/** A side wall's inside: the same paper and tubes. */
function sideArt({ rows, top: TOP, u: U }) {
  const W = rows * U, H = TOP * U, f = fine(W, H, 3), { g, rr, lin, shine } = f, s = shine();
  const wy = (y) => (TOP - y) * U;
  paper(f, W, H);
  rr(0, wy(0.9), W, H - wy(0.9), 0, lin(0, wy(0.9), 0, H, ['#24123e', '#140a24']));
  tube(g, s, NEON.cyan, 1.1, (c) => { c.moveTo(0, wy(0.9)); c.lineTo(W, wy(0.9)); });
  tube(g, s, NEON.pink, 1.1, (c) => { c.moveTo(0, wy(5.4)); c.lineTo(W, wy(5.4)); });
  return f.c;
}

/** Arcade carpet: deep navy strewn with neon confetti, a red runner up the middle edged in gold. */
function floorArt({ cols, rows }) {
  const T = 16, f = fine(cols * T, rows * T, 5), { g, rr, lin } = f;
  g.fillStyle = '#1a1438'; g.fillRect(0, 0, cols * T, rows * T);
  const cols4 = [NEON.pink, NEON.cyan, NEON.gold, NEON.lime, '#8a6aff'];
  for (let i = 0; i < cols * rows * 7; i++) {
    const x = (i * 37.17) % (cols * T), y = (i * 23.71 + (i % 7) * 11) % (rows * T), c = cols4[i % 5], k = i % 4;
    g.fillStyle = c; g.strokeStyle = c; g.lineWidth = 0.7; g.globalAlpha = 0.75;
    g.save(); g.translate(x, y); g.rotate(i * 0.7);
    if (k === 0) { g.beginPath(); g.moveTo(0, -2); g.lineTo(1.8, 1.4); g.lineTo(-1.8, 1.4); g.fill(); }
    else if (k === 1) { g.beginPath(); g.arc(0, 0, 1.4, 0, Math.PI * 2); g.stroke(); }
    else if (k === 2) { g.beginPath(); g.moveTo(-2.4, 0); g.quadraticCurveTo(-1.2, -1.6, 0, 0); g.quadraticCurveTo(1.2, 1.6, 2.4, 0); g.stroke(); }
    else star(g, 0, 0, 1.4);
    g.restore();
  }
  g.globalAlpha = 1;
  const rx = RUNNER * T + 2, rw = T - 4, ry = 2 * T;
  rr(rx - 1, ry, rw + 2, rows * T - ry, 0, GC.goldDark);
  rr(rx, ry, rw, rows * T - ry, 0, lin(rx, 0, rx + rw, 0, ['#a82838', '#c83848', '#a82838']));
  for (const y of [5, 9]) coin(g, (RUNNER + 0.5) * T, y * T, 4.6);
  return f.c;
}

/** The picked thing's marker: a gold frame with corner sparkles, laid over its cell or machine. */
function frameArt() {
  const f = fine(40, 40, 6), { g } = f;
  g.save(); glow(g, NEON.gold, 3); g.strokeStyle = NEON.gold; g.lineWidth = 2;
  g.beginPath(); g.roundRect(2, 2, 36, 36, 4); g.stroke(); g.restore();
  g.strokeStyle = '#fffbe0'; g.lineWidth = 0.7; g.beginPath(); g.roundRect(2, 2, 36, 36, 4); g.stroke();
  return f.c;
}

/* ---------- the perk machines' pictures, smooth: one per perk ---------- */

const PERK_ART = {
  hpBoost: (g) => { g.fillStyle = '#f04a5a'; g.beginPath(); g.moveTo(0, 4); g.bezierCurveTo(-7, -1, -4, -7, 0, -3); g.bezierCurveTo(4, -7, 7, -1, 0, 4); g.fill(); g.fillStyle = '#ffffff'; g.fillRect(-0.6, -2.6, 1.2, 3.6); g.fillRect(-1.8, -1.4, 3.6, 1.2); },
  relicCharm: (g) => { g.fillStyle = '#a07040'; g.beginPath(); g.moveTo(-3.5, 5); g.lineTo(3.5, 5); g.lineTo(2.4, 2.4); g.lineTo(-2.4, 2.4); g.fill(); const r = g.createRadialGradient(-1, -2, 0.5, 0, -1, 4); r.addColorStop(0, '#f4dcff'); r.addColorStop(1, '#8a4ad8'); g.fillStyle = r; g.beginPath(); g.arc(0, -1, 3.8, 0, Math.PI * 2); g.fill(); },
  wellFed: (g) => { g.fillStyle = '#e8743a'; g.beginPath(); g.arc(0, 0.5, 5, 0, Math.PI); g.fill(); g.fillStyle = '#f8d890'; g.fillRect(-5, 0, 10, 1.2); g.strokeStyle = '#ffffff'; g.lineWidth = 0.8; g.beginPath(); for (const x of [-2, 0.5, 3]) { g.moveTo(x, -1.4); g.quadraticCurveTo(x - 1.4, -3.4, x, -5.4); } g.stroke(); },
  coinFinder: (g) => { for (const [x, y] of [[-2, 2.6], [2, 2.6], [0, -1.6]]) coin(g, x, y, 3); },
  bagPocket: (g) => { g.fillStyle = '#e8a030'; g.beginPath(); g.roundRect(-4.4, -2.6, 8.8, 7.6, 2); g.fill(); g.strokeStyle = '#b06a18'; g.lineWidth = 1; g.beginPath(); g.arc(0, -2.6, 2.4, Math.PI, 0); g.stroke(); g.fillStyle = '#c87a20'; g.beginPath(); g.roundRect(-3, 0.4, 6, 3, 1); g.fill(); },
  martCard: (g) => { g.fillStyle = '#58b0f0'; g.beginPath(); g.moveTo(-5, -2.4); g.lineTo(2, -2.4); g.lineTo(5, 0.6); g.lineTo(2, 3.6); g.lineTo(-5, 3.6); g.fill(); g.fillStyle = '#ffffff'; g.beginPath(); g.arc(2, 0.6, 0.9, 0, Math.PI * 2); g.fill(); g.fillRect(-3.8, -0.4, 4, 0.9); g.fillRect(-3.8, 1.3, 3, 0.9); },
  tutorNotes: (g) => { g.fillStyle = '#f4ead4'; g.beginPath(); g.moveTo(0, -2.6); g.quadraticCurveTo(-3, -4, -5.4, -3); g.lineTo(-5.4, 3.6); g.quadraticCurveTo(-3, 2.6, 0, 4); g.quadraticCurveTo(3, 2.6, 5.4, 3.6); g.lineTo(5.4, -3); g.quadraticCurveTo(3, -4, 0, -2.6); g.fill(); g.strokeStyle = '#4a7ad0'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(0, -2.6); g.lineTo(0, 4); for (const y of [-1, 0.6, 2.2]) { g.moveTo(-4, y - 0.6); g.lineTo(-1.2, y); g.moveTo(1.2, y); g.lineTo(4, y - 0.6); } g.stroke(); },
  scoutReport: (g) => { g.strokeStyle = '#d8dce6'; g.lineWidth = 1.6; g.beginPath(); g.arc(-1, -1, 3.4, 0, Math.PI * 2); g.stroke(); g.fillStyle = 'rgba(160,220,255,0.6)'; g.beginPath(); g.arc(-1, -1, 2.6, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#a07040'; g.lineWidth = 2; g.beginPath(); g.moveTo(1.6, 1.6); g.lineTo(4.6, 4.6); g.stroke(); },
  scopeUpgrade: (g) => { g.fillStyle = '#5a5e6a'; g.fillRect(-1.2, -1.2, 2.4, 1.6); for (const x of [-3, 3]) { g.fillStyle = '#3a3e48'; g.beginPath(); g.arc(x, 0, 2.8, 0, Math.PI * 2); g.fill(); g.fillStyle = '#e84838'; g.beginPath(); g.arc(x, 0, 1.8, 0, Math.PI * 2); g.fill(); g.fillStyle = '#ffb0a0'; g.beginPath(); g.arc(x - 0.6, -0.6, 0.6, 0, Math.PI * 2); g.fill(); } },
};

/** A game cabinet's face: a lit marquee in its colour, its screen's picture (`screen(g, s)` draws in the 2.2..15.8 x
    7.6..18 box), the buttons lit, FREE PLAY. */
function gameArt(title, colour, screen, foot = 'FREE PLAY') {
  const f = fine(18, 27, 10), { g, rr, lin, shine } = f, s = shine();
  rr(0, 0, 18, 27, 1.4, lin(0, 0, 18, 0, [GC.chrome[2], GC.chrome[0], GC.chrome[1], GC.chrome[2]]));
  rr(1.2, 1.2, 15.6, 5, 1, lin(0, 1.2, 0, 6.2, [colour, '#00000060']));
  rr(2, 2, 14, 3.4, 0.8, colour);
  s.fillStyle = colour; s.beginPath(); s.roundRect(2, 2, 14, 3.4, 0.8); s.fill();
  words(g, title, 9, 3.8, title.length > 12 ? 1.6 : 2, '#121226');
  rr(1.6, 7, 14.8, 11.6, 1, '#120a22');
  screen(g, s, rr);
  for (const [x, c] of [[5, GC.red], [9, NEON.gold], [13, '#4a8ef0']]) {
    g.fillStyle = c; g.beginPath(); g.arc(x, 21, 1.4, 0, Math.PI * 2); g.fill();
    s.fillStyle = c; s.beginPath(); s.arc(x, 21, 1, 0, Math.PI * 2); s.fill();
  }
  words(g, foot, 9, 25, 1.9, NEON.gold); words(s, foot, 9, 25, 1.9, '#ffe890');
  return f.c;
}

const SCREENS = {
  slots(g, s, rr) {
    rr(2.2, 7.6, 13.6, 10.4, 0.8, '#1a0e20');
    for (let i = 0; i < 3; i++) {
      rr(3 + i * 4.2, 8.6, 3.6, 8.4, 0.6, '#f8f4ec');
      s.fillStyle = '#806040'; s.beginPath(); s.roundRect(3 + i * 4.2, 8.6, 3.6, 8.4, 0.6); s.fill();
      words(g, '7', 4.8 + i * 4.2, 12.9, 4.6, '#e02030');
    }
    g.strokeStyle = '#ffd84a'; g.lineWidth = 0.4; g.beginPath(); g.moveTo(2.6, 12.8); g.lineTo(15.4, 12.8); g.stroke();
  },
  highlow(g, s, rr) {
    rr(2.2, 7.6, 13.6, 10.4, 0.8, '#1f6a3a');
    s.fillStyle = '#2f8a50'; s.beginPath(); s.roundRect(2.2, 7.6, 13.6, 10.4, 0.8); s.fill();
    for (const [x, t, red] of [[4, '7', false], [10, '?', true]]) { rr(x, 8.6, 4.4, 6.4, 0.6, '#ffffff'); words(g, t, x + 2.2, 11.8, 3.4, red ? '#d02030' : '#202028'); }
    words(g, '▲ ▼', 9, 16.6, 2, '#ffe070');
  },
  voltorb(g, s, rr) {
    rr(2.2, 7.6, 13.6, 10.4, 0.8, '#2f8a58');
    s.fillStyle = '#3a9a68'; s.beginPath(); s.roundRect(2.2, 7.6, 13.6, 10.4, 0.8); s.fill();
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
      const x = 3 + c * 3.2, y = 8.4 + r * 3.1, up = r * 4 + c;
      rr(x, y, 2.6, 2.6, 0.4, up === 5 || up === 10 ? '#f4f8ec' : '#b8dc98');
      if (up === 5) { g.fillStyle = '#e04040'; g.beginPath(); g.arc(x + 1.3, y + 1.3, 1, Math.PI, 0); g.fill(); g.fillStyle = '#f8f8f8'; g.beginPath(); g.arc(x + 1.3, y + 1.3, 1, 0, Math.PI); g.fill(); }
      if (up === 10) words(g, '3', x + 1.3, y + 1.4, 2, '#d84a2a');
    }
  },
  quiz(g, s, rr) {
    const r = g.createRadialGradient(9, 12.8, 0.5, 9, 12.8, 7);
    r.addColorStop(0, '#fff7c0'); r.addColorStop(0.5, '#ffd84a'); r.addColorStop(1, '#f0a020');
    rr(2.2, 7.6, 13.6, 10.4, 0.8, r);
    s.fillStyle = '#c8a040'; s.beginPath(); s.roundRect(2.2, 7.6, 13.6, 10.4, 0.8); s.fill();
    g.fillStyle = '#121226';   // a Pikachu-ish silhouette: head, ears, a tail
    g.beginPath(); g.ellipse(9, 13.6, 3, 2.6, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.moveTo(6.6, 12.4); g.lineTo(5.6, 8.6); g.lineTo(7.8, 11.4); g.fill();
    g.beginPath(); g.moveTo(11.4, 12.4); g.lineTo(12.4, 8.6); g.lineTo(10.2, 11.4); g.fill();
    g.beginPath(); g.moveTo(11.6, 15); g.lineTo(14.4, 12.6); g.lineTo(13.6, 14.6); g.lineTo(15, 14.4); g.lineTo(12, 16.4); g.fill();
    words(g, '?', 9, 13.8, 3.2, '#ffd84a');
  },
  memory(g, s, rr) {
    rr(2.2, 7.6, 13.6, 10.4, 0.8, '#5a1e48');
    s.fillStyle = '#7a2a64'; s.beginPath(); s.roundRect(2.2, 7.6, 13.6, 10.4, 0.8); s.fill();
    for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) {
      const x = 3 + c * 3.2, y = 8.4 + r * 4.6, up = r * 4 + c === 2 || r * 4 + c === 5;
      rr(x, y, 2.6, 3.8, 0.4, up ? '#fffbea' : '#e84040');
      if (!up) { rr(x, y + 1.8, 2.6, 2, 0.4, '#f8f8f8'); g.fillStyle = '#303030'; g.fillRect(x, y + 1.7, 2.6, 0.3); }
      else { g.fillStyle = '#f8c830'; g.beginPath(); g.arc(x + 1.3, y + 1.9, 0.9, 0, Math.PI * 2); g.fill(); }
    }
  },
};

/** The Gachapon stand's face: GACHAPON in gold over a starry red, the coin slot and the capsule chute. */
function gachaArt() {
  const f = fine(20, 20, 10), { g, rr, lin, shine } = f, s = shine();
  rr(0, 0, 20, 20, 1, lin(0, 0, 0, 20, [GC.red, GC.redDark]));
  for (let i = 0; i < 9; i++) { g.fillStyle = 'rgba(255,240,200,0.35)'; star(g, (i * 7.3) % 20, 2 + (i * 4.1) % 6, 0.5); }
  rr(1.4, 1.2, 17.2, 4.4, 1, '#3a1020');
  g.save(); glow(g, NEON.gold, 2); words(g, 'GACHAPON', 10, 3.5, 2.6, GC.gold); g.restore();
  words(s, 'GACHAPON', 10, 3.5, 2.6, '#ffe890');
  rr(13.4, 9.2, 4, 1.2, 0.5, '#1a0810');
  words(g, '100', 15.4, 12, 1.6, '#fff2b8');
  rr(3.5, 13.6, 13, 5, 1.6, '#2a0a14');
  rr(4.3, 14.4, 11.4, 3.6, 1.2, lin(0, 14.4, 0, 18, ['#120408', '#3a1020']));
  s.fillStyle = '#601830'; s.beginPath(); s.roundRect(4.3, 14.4, 11.4, 3.6, 1.2); s.fill();
  return f.c;
}

/** A table's felt from above, `w` tiles by one: green, a gold line round it, and its game's markings. */
function feltArt(id, w) {
  const W = w * 16, H = 16, f = fine(W, H, 10), { g, rr, lin } = f;
  rr(0, 0, W, H, 1.5, lin(0, 0, 0, H, ['#2f8a50', '#1f6a3a']));
  g.strokeStyle = '#e8c860'; g.lineWidth = 0.4; g.beginPath(); g.roundRect(0.8, 0.8, W - 1.6, H - 1.6, 1.2); g.stroke();
  if (id === 'blackjack') {
    g.beginPath(); g.arc(W / 2, -6, 17, 0.35 * Math.PI, 0.65 * Math.PI); g.stroke();
    words(g, 'BLACKJACK PAYS 3 TO 2', W / 2, 5, 1.6, '#ffe890');
    words(g, 'DEALER STANDS ON 17', W / 2, 13.5, 1.2, '#c8f0c8');
  } else {
    for (let n = 1; n <= 36; n++) {
      const c = (n - 1) % 12, r = Math.floor((n - 1) / 12), x = 1.6 + c * ((W - 12) / 12), y = 2 + r * 3.2;
      rr(x, y, (W - 12) / 12 - 0.3, 2.8, 0.3, [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(n) ? '#c02030' : '#202028');
    }
    words(g, 'ROULETTE', (W - 10) / 2, 13.4, 1.6, '#ffe890');
  }
  return f.c;
}

/** The roulette wheel's top: red and black pockets round a gold hub. */
function wheelArt() {
  const f = fine(32, 32, 8), { g } = f;
  for (let i = 0; i < 37; i++) {
    g.fillStyle = i === 0 ? '#2a8a40' : i % 2 ? '#c02030' : '#202028';
    g.beginPath(); g.moveTo(16, 16); g.arc(16, 16, 15, i / 37 * Math.PI * 2, (i + 1) / 37 * Math.PI * 2); g.fill();
  }
  const r = g.createRadialGradient(14, 14, 1, 16, 16, 8);
  r.addColorStop(0, '#ffe8a0'); r.addColorStop(1, '#a87818');
  g.fillStyle = r; g.beginPath(); g.arc(16, 16, 7, 0, Math.PI * 2); g.fill();
  return f.c;
}

/* ---------- pictures ---------- */

const pics = new Map();
/** A thing's picture, cut to its pixels (a GIF's first frame, an item's PNG), loaded once. */
function picture(src) {
  if (!pics.has(src)) pics.set(src, new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = new OffscreenCanvas(img.naturalWidth, img.naturalHeight);
      c.getContext('2d').drawImage(img, 0, 0);
      resolve(trim(c));
    };
    img.onerror = () => resolve(null);
    img.src = src;
  }));
  return pics.get(src);
}

function silhouette(cut) {
  const c = new OffscreenCanvas(cut.w, cut.h), g = c.getContext('2d');
  g.drawImage(cut.c, 0, 0);
  g.globalCompositeOperation = 'source-in'; g.fillStyle = '#140a24'; g.fillRect(0, 0, cut.w, cut.h);
  return c;
}

/* ---------- the showcases ---------- */

/** A showcase's face, `w` tiles wide: a gold-trimmed cabinet, its name in neon along the top, a black glass where the
    live screen sits, and under it big ◀ ▶ keys either side of TAP TO BROWSE. */
function showcaseArt(def, w) {
  const W = w * 16, H = SHOW_H * 16, f = fine(W, H, 6), { g, rr, lin, shine } = f, s = shine(), col = SHOWCASES[def.row].colour;
  rr(0, 0, W, H, 2, lin(0, 0, 0, H, [GC.gold, GC.goldDark, '#8a6418']));
  rr(1.2, 1.2, W - 2.4, H - 2.4, 1.6, lin(0, 0, 0, H, ['#2a1648', '#1a0e30']));
  const title = SHOWCASES[def.row].title;
  g.save(); glow(g, col, 3); words(g, title, W / 2, H * 0.1, 5.2, col); g.restore();
  words(g, title, W / 2, H * 0.1, 5.2, '#ffffff'); words(s, title, W / 2, H * 0.1, 5.2, col);
  const sx = W * SCREEN.x0, sy = H * SCREEN.y0, sw = W * (SCREEN.x1 - SCREEN.x0), sh = H * (SCREEN.y1 - SCREEN.y0);
  rr(sx - 1, sy - 1, sw + 2, sh + 2, 1.4, '#0a0614');
  const by = H * 0.9;
  for (const [x, t] of [[W * 0.16, '◀'], [W * 0.84, '▶']]) {
    g.fillStyle = col; g.beginPath(); g.arc(x, by, 3, 0, Math.PI * 2); g.fill();
    s.fillStyle = col; s.beginPath(); s.arc(x, by, 3, 0, Math.PI * 2); s.fill();
    words(g, t, x, by + 0.2, 3, '#1a0e30');
  }
  words(g, 'TAP TO BROWSE', W / 2, by, 2.4, '#fff2b8'); words(s, 'TAP TO BROWSE', W / 2, by, 2.4, '#ffe890');
  return f.c;
}

/** Paints one entry on a showcase's live screen: its colour's glow, the thing big in the middle (a sprite crisp, a perk's
    picture), its name, and its price or OWNED; `cut` is its loaded picture. */
function paintScreen(c, def, e, cut) {
  const g = c.getContext('2d'), W = c.width, H = c.height, col = SHOWCASES[def.row].colour;
  g.setTransform(1, 0, 0, 1, 0, 0);
  const bg = g.createRadialGradient(W / 2, H * 0.45, 4, W / 2, H * 0.45, W * 0.7);
  bg.addColorStop(0, col); bg.addColorStop(0.35, '#2a2050'); bg.addColorStop(1, '#0c0818');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.globalAlpha = 0.12; g.fillStyle = '#ffffff';
  for (let k = 0; k < 16; k++) { g.beginPath(); g.moveTo(W / 2, H * 0.45); g.arc(W / 2, H * 0.45, W, k * Math.PI / 8, k * Math.PI / 8 + 0.12); g.fill(); }
  g.globalAlpha = 1;
  const box = H * 0.62;
  if (cut) {
    const k = Math.min(box / cut.h, box / cut.w) * 0.95;
    g.imageSmoothingEnabled = false;
    g.drawImage(e.dark ? silhouette(cut) : cut.c, W / 2 - cut.w * k / 2, H * 0.47 - cut.h * k / 2, cut.w * k, cut.h * k);
    g.imageSmoothingEnabled = true;
  } else if (PERK_ART[e.id]) {
    g.save(); g.translate(W / 2, H * 0.44); g.scale(box / 15, box / 15); PERK_ART[e.id](g); g.restore();
  }
  g.fillStyle = 'rgba(10,6,20,0.72)'; g.fillRect(0, H * 0.8, W, H * 0.2);
  words(g, e.name.toUpperCase(), W / 2, H * 0.9, Math.min(H * 0.09, W * 1.6 / Math.max(8, e.name.length)), '#ffffff');
  const tag = e.done ? e.done.toUpperCase() : e.blocked ? (e.dark ? '???' : 'LOCKED') : `${e.cost.toLocaleString()}`;
  g.fillStyle = e.done ? '#3a9a48' : e.blocked ? '#4a4458' : '#2a1648';
  g.beginPath(); g.roundRect(W - H * 0.42, H * 0.04, H * 0.38, H * 0.12, H * 0.06); g.fill();
  words(g, tag, W - H * 0.23, H * 0.1, H * 0.07, e.done ? '#ffffff' : '#ffe890');
  if (e.deal) {
    g.fillStyle = NEON.pink; g.beginPath(); g.roundRect(H * 0.04, H * 0.04, H * 0.3, H * 0.12, H * 0.06); g.fill();
    words(g, 'DEAL', H * 0.19, H * 0.1, H * 0.07, '#ffffff');
  }
}

/* ---------- building it ---------- */

/** The Game Corner. `size` gives the hall's paint units and wall height; the room is its own COLS x ROWS. Returns its
    group, the tiles it blocks, the spots you can walk up to (each showcase, each game, the counter), the gold frame that
    marks a picked one, its shopkeeper's place, `refresh()` to repaint after a buy, `tick()` to turn the screens, its
    size and door, and a dimmer light. */
export function buildCorner(THREE, size) {
  const { top: TOP, u: U } = size, cols = COLS, rows = ROWS, room = { cols, rows, top: TOP, u: U };
  const tileX = (tx) => tx + 0.5 - cols / 2, tileZ = (ty) => ty + 0.5 - rows / 2;
  const group = new THREE.Group(), blocked = new Set(), spots = [], redraws = [], screens = [];
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, ...o });
  const lit = (src, k = 1, colour = '#ffffff') => std({ map: texOf(src), emissive: new THREE.Color(colour), emissiveMap: texOf(src.glow ?? src), emissiveIntensity: k, roughness: 0.9 });
  const edge = std({ color: '#1a1028' });

  const floor = new THREE.Mesh(new THREE.BoxGeometry(cols, 0.6, rows), [edge, edge, std({ map: texOf(floorArt(room)), roughness: 0.95 }), edge, std({ color: '#2a1840' }), edge]);
  floor.position.y = -0.3;
  floor.receiveShadow = true;
  group.add(floor);
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(cols + 0.8, 7, rows + 0.4), [edge, edge, edge, edge, std({ color: '#24143a' }), edge]);
  plinth.position.set(0, -0.6 - 3.5, -0.2);
  group.add(plinth);
  const cap = std({ color: '#2a1648' });
  const back = new THREE.Mesh(new THREE.BoxGeometry(cols + 0.8, TOP, 0.4), [cap, cap, cap, cap, lit(wallArt(room), 1.2), cap]);
  back.position.set(0, TOP / 2, -rows / 2 - 0.2);
  back.receiveShadow = true;
  group.add(back);
  const side = sideArt(room);
  for (const sgn of [-1, 1]) {
    const inside = lit(side, 1.1);
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.4, TOP, rows), sgn < 0 ? [inside, cap, cap, cap, cap, cap] : [cap, inside, cap, cap, cap, cap]);
    m.position.set(sgn * (cols / 2 + 0.2), TOP / 2, 0);
    m.receiveShadow = true;
    group.add(m);
  }

  // the showcases: a tall cabinet each against the back wall, a live screen cycling through what it sells
  const gold = std({ color: GC.gold, metalness: 0.6, roughness: 0.3 });
  const cuts = new Map();
  const cutOf = (e) => (e.sprite ? cuts.get(e.sprite) ?? null : null);
  SHOWS.forEach((def, n) => {
    const w = def.w - 0.15, cx = tileX(def.x) - 0.5 + def.w / 2, z = -rows / 2 + SHOW_D / 2 + 0.02;
    for (let x = def.x; x < def.x + def.w; x++) blocked.add(`${x},0`);
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, SHOW_H, SHOW_D), [gold, gold, gold, gold, lit(showcaseArt(def, w), 0.9), gold]);
    body.position.set(cx, SHOW_H / 2, z);
    body.castShadow = body.receiveShadow = true;
    const crown = new THREE.Mesh(new THREE.BoxGeometry(w * 0.7, 0.18, SHOW_D * 0.6), std({ color: SHOWCASES[def.row].colour, emissive: new THREE.Color(SHOWCASES[def.row].colour), emissiveIntensity: 1 }));
    crown.position.set(cx, SHOW_H + 0.09, z);
    const sw = w * (SCREEN.x1 - SCREEN.x0), sh = SHOW_H * (SCREEN.y1 - SCREEN.y0);
    const canvas = new OffscreenCanvas(360, Math.round(360 * sh / sw));
    canvas.fine = 1;
    const map = texOf(canvas);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), new THREE.MeshBasicMaterial({ map, toneMapped: false }));
    glass.position.set(cx - w / 2 + w * (SCREEN.x0 + SCREEN.x1) / 2, SHOW_H * (1 - (SCREEN.y0 + SCREEN.y1) / 2), z + SHOW_D / 2 + 0.01);
    const sc = { def, canvas, map, at: 0, next: CYCLE * (1 + n * 0.25), held: false };
    sc.paint = () => {
      const list = cornerEntries(def.row);
      sc.at %= list.length;
      paintScreen(canvas, def, list[sc.at], cutOf(list[sc.at]));
      map.needsUpdate = true;
    };
    screens.push(sc);
    const spot = { id: `show-${def.row}`, kind: 'game', name: `${SHOWCASES[def.row].title} showcase`, open: true, step: { x: def.x + Math.floor(def.w / 2), y: 1 },
      frame: { x: cx, y: SHOW_H / 2, z: z + SHOW_D / 2 + 0.03, w: w + 0.1, h: SHOW_H + 0.1 } };
    spot.line = spot.name;
    spot.game = {
      name: spot.name,
      line: { skins: 'Pokémon you can play as, for keeps. Tap again and flip through \'em, meow.', shiny: 'Every shiny, on the big screen! Tap again to browse, left and right.', perks: 'Perks for every run. Tap again to look through \'em, meow.', balls: 'Poké Balls for the Safari Zone. Tap again to browse, meow.' }[def.row],
      open: (done) => import('./showcase.js').then(m => {
        sc.held = true;
        m.openShowcase(def.row, sc.at, { step: (i) => { sc.at = i; sc.paint(); }, close: () => { sc.held = false; sc.next = performance.now() + CYCLE; done?.(); } });
      }),
    };
    spots.push(spot);
    for (const m of [body, crown, glass]) { m.userData.front = spot; group.add(m); }
    sc.paint();
  });
  const srcs = [...new Set(SHOWS.flatMap(d => cornerEntries(d.row).map(e => e.sprite)).filter(Boolean))];
  Promise.all(srcs.map(src => picture(src).then(c => cuts.set(src, c)))).then(() => screens.forEach(sc => sc.paint()));
  redraws.push(() => screens.forEach(sc => sc.paint()));

  // the game cabinets
  const chrome = std({ color: '#cdc8e0', metalness: 0.5, roughness: 0.35 }), violet = std({ color: GC.violet, roughness: 0.6 });
  for (const [id, gm] of Object.entries(GAMES)) {
    if (id === 'gacha') continue;
    const { x, y } = gm.at;
    blocked.add(`${x},${y}`);
    const m = new THREE.Group();
    m.position.set(tileX(x), 0, tileZ(y));
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, CAB_H, 0.66), [violet, violet, chrome, chrome, lit(gameArt(gm.name.toUpperCase(), gm.colour, SCREENS[id]), 1), violet]);
    body.position.y = CAB_H / 2;
    body.castShadow = body.receiveShadow = true;
    const topper = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.18, 0.54), std({ color: gm.colour, emissive: new THREE.Color(gm.colour), emissiveIntensity: 0.9 }));
    topper.position.y = CAB_H + 0.09;
    m.add(body, topper);
    const spot = { id, kind: 'game', game: gm, name: gm.name, open: true, line: gm.name, step: { x, y: y + 1 },
      frame: { x: tileX(x), y: CAB_H / 2, z: tileZ(y) + 0.35, w: 1, h: CAB_H + 0.1 } };
    spots.push(spot);
    m.traverse(o => { o.userData.front = spot; });
    group.add(m);
  }

  // the slot bank and High-Low: cabinets like the games', a slot machine with a lever on its side
  const lever = std({ color: '#cdc8e0', metalness: 0.6, roughness: 0.3 });
  const casinoCab = (id, gm, x, y, slot) => {
    blocked.add(`${x},${y}`);
    const m = new THREE.Group();
    m.position.set(tileX(x), 0, tileZ(y));
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, CAB_H, 0.66), [violet, violet, chrome, chrome, lit(gameArt(gm.name.toUpperCase(), gm.colour, SCREENS[id], 'BET 10-100'), 1), violet]);
    body.position.y = CAB_H / 2;
    body.castShadow = body.receiveShadow = true;
    const topper = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.18, 0.54), std({ color: gm.colour, emissive: new THREE.Color(gm.colour), emissiveIntensity: 0.9 }));
    topper.position.y = CAB_H + 0.09;
    m.add(body, topper);
    if (slot) {
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.5, 10), lever);
      rod.position.set(0.5, CAB_H * 0.62, 0.05);
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 10), std({ color: GC.red, emissive: new THREE.Color(GC.red), emissiveIntensity: 0.4 }));
      knob.position.set(0.5, CAB_H * 0.62 + 0.27, 0.05);
      m.add(rod, knob);
    }
    const spot = { id: `${id}${x}`, kind: 'game', game: gm, name: gm.name, open: true, line: gm.name, step: { x, y: y + 1 },
      frame: { x: tileX(x), y: CAB_H / 2, z: tileZ(y) + 0.35, w: 1, h: CAB_H + 0.1 } };
    spots.push(spot);
    m.traverse(o => { o.userData.front = spot; });
    group.add(m);
  };
  for (const at of CASINO.slots.ats) casinoCab('slots', CASINO.slots, at.x, at.y, true);
  casinoCab('highlow', CASINO.highlow, CASINO.highlow.at.x, CASINO.highlow.at.y, false);

  // the tables: green felt on a dark wood base, two tiles wide; the roulette wheel turns slowly on its end
  const wood = std({ color: '#4a2a18', roughness: 0.6 });
  const wheels = [];
  for (const id of ['blackjack', 'roulette']) {
    const gm = CASINO[id], { x, y } = gm.at, w = gm.w;
    for (let k = 0; k < w; k++) blocked.add(`${x + k},${y}`);
    const t = new THREE.Group();
    t.position.set(tileX(x) - 0.5 + w / 2, 0, tileZ(y));
    const base = new THREE.Mesh(new THREE.BoxGeometry(w - 0.1, 0.72, 0.86), wood);
    base.position.y = 0.36;
    base.castShadow = base.receiveShadow = true;
    const rim = new THREE.Mesh(new THREE.BoxGeometry(w + 0.02, 0.08, 0.98), gold);
    rim.position.y = 0.74;
    const felt = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.08, 0.86), lit(feltArt(id, w), 0.5));
    felt.rotation.x = -Math.PI / 2;
    felt.position.y = 0.785;
    t.add(base, rim, felt);
    if (id === 'roulette') {
      const wheelTex = texOf(wheelArt());
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.08, 40), [wood, std({ map: wheelTex, roughness: 0.4 }), wood]);
      disc.position.set(w / 2 - 0.42, 0.83, 0);
      const spindle = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 10), gold);
      spindle.position.set(w / 2 - 0.42, 0.92, 0);
      t.add(disc, spindle);
      wheels.push(disc);
    } else {
      for (const [cx, cz, r] of [[-0.3, 0.1, 0.2], [0.05, 0.12, -0.1], [0.4, 0.08, 0.15]]) {   // cards dealt on the felt
        const c = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 0.18), std({ color: '#ffffff' }));
        c.rotation.set(-Math.PI / 2, 0, r);
        c.position.set(cx, 0.79, cz);
        t.add(c);
      }
    }
    const spot = { id, kind: 'game', game: gm, name: gm.name, open: true, line: gm.name, step: { x: x + Math.floor(w / 2), y: y + 1 },
      frame: { x: tileX(x) - 0.5 + w / 2, y: 0.5, z: tileZ(y) + 0.5, w: w + 0.1, h: 1 } };
    spots.push(spot);
    t.traverse(o => { o.userData.front = spot; });
    group.add(t);
  }

  // the Gachapon: a red stand under a glass dome full of capsules
  {
    const { x: gx, y: gy } = GAMES.gacha.at;
    const spot = { id: 'gacha', kind: 'game', game: GAMES.gacha, name: GAMES.gacha.name, open: true, line: GAMES.gacha.name, step: { x: gx, y: gy + 1 },
      frame: { x: tileX(gx), y: 0.75, z: tileZ(gy) + 0.42, w: 0.95, h: 1.5 } };
    spots.push(spot);
    blocked.add(`${gx},${gy}`);
    const m = new THREE.Group();
    m.position.set(tileX(gx), 0, tileZ(gy));
    const red = std({ color: GC.red, roughness: 0.45 });
    const stand = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.66, 0.6), [red, red, gold, red, lit(gachaArt(), 0.7), red]);
    stand.position.y = 0.33;
    stand.castShadow = stand.receiveShadow = true;
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.06, 20), chrome);
    knob.rotation.x = Math.PI / 2;
    knob.position.set(0, 0.44, 0.32);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.04), std({ color: '#a8a8b8', metalness: 0.4 }));
    grip.position.set(0, 0.44, 0.36);
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.33, 0.06, 28), gold);
    ring.position.y = 0.69;
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.31, 28, 18), new THREE.MeshStandardMaterial({ color: '#e0f0ff', transparent: true, opacity: 0.28, roughness: 0.05, metalness: 0.1, depthWrite: false }));
    dome.position.y = 0.98;
    const lid = new THREE.Mesh(new THREE.SphereGeometry(0.12, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), gold);
    lid.position.y = 1.25;
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 10), std({ color: GC.red, emissive: new THREE.Color(GC.red), emissiveIntensity: 0.6 }));
    ball.position.y = 1.4;
    m.add(stand, knob, grip, ring, dome, lid, ball);
    const caps = ['#f05a6a', '#4a9ae8', '#f8c840', '#6ac868', '#b07af0', '#f08ac8', '#40c8c0'];
    for (let i = 0; i < 16; i++) {
      const a = i * 2.4, r = 0.06 + (i % 3) * 0.075, c = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 10), std({ color: caps[i % caps.length], roughness: 0.3 }));
      c.position.set(Math.cos(a) * r, 0.8 + Math.floor(i / 5) * 0.09, Math.sin(a) * r);
      m.add(c);
    }
    m.scale.setScalar(1.35);
    m.traverse(o => { o.userData.front = spot; });
    group.add(m);
  }

  // scenery: neon pillars on the floor, attract cabinets down the side walls (their screens cycle colours)
  const tints = [NEON.pink, NEON.cyan, NEON.gold, NEON.lime];
  const rings = [];
  PILLARS.forEach(([x, y], n) => {
    blocked.add(`${x},${y}`);
    const p = new THREE.Group();
    p.position.set(tileX(x), 0, tileZ(y));
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 3.2, 20), std({ color: '#2a1648', roughness: 0.5 }));
    shaft.position.y = 1.6;
    p.add(shaft);
    for (let k = 0; k < 4; k++) {
      const mat = std({ color: tints[(n + k) % 4], emissive: new THREE.Color(tints[(n + k) % 4]), emissiveIntensity: 1.2 });
      const r = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.035, 8, 28), mat);
      r.rotation.x = Math.PI / 2;
      r.position.y = 0.5 + k * 0.75;
      rings.push(mat);
      p.add(r);
    }
    group.add(p);
  });
  const screenMats = [];
  for (const [x, y] of ATTRACT) {
    blocked.add(`${x},${y}`);
    const face = std({ color: '#120a22', emissive: new THREE.Color(NEON.cyan), emissiveIntensity: 0.6 });
    screenMats.push(face);
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.66, CAB_H, 0.9), [violet, violet, chrome, violet, violet, violet]);
    m.position.set(tileX(x), CAB_H / 2, tileZ(y));
    const glassSide = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.5), face);
    glassSide.position.set(tileX(x) + (x === 0 ? 0.34 : -0.34), CAB_H * 0.62, tileZ(y));
    glassSide.rotation.y = x === 0 ? Math.PI / 2 : -Math.PI / 2;
    m.castShadow = true;
    group.add(m, glassSide);
  }

  // the prize counter, Meowth's place behind it
  const keeper = { id: 'keeper', kind: 'keeper', name: KEEPER.name, open: true, step: { x: COUNTER.x + 1, y: COUNTER.y + 1 } };
  spots.push(keeper);
  for (let x = COUNTER.x; x < COUNTER.x + COUNTER.w; x++) for (let y = 0; y <= COUNTER.y; y++) blocked.add(`${x},${y}`);
  const desk = new THREE.Group();
  desk.position.set(tileX(COUNTER.x + 1), 0, tileZ(COUNTER.y));
  const redDark = std({ color: GC.redDark, roughness: 0.6 });
  const frontArt = (() => {
    const f = fine(COUNTER.w * 16, 14, 6), { g, rr, lin, shine } = f, s = shine();
    rr(0, 0, COUNTER.w * 16, 14, 0, lin(0, 0, 0, 14, [GC.red, GC.redDark]));
    rr(0, 0, COUNTER.w * 16, 1.4, 0, GC.gold);
    for (let x = 3; x < COUNTER.w * 16; x += 4) { g.fillStyle = '#fff6c8'; g.beginPath(); g.arc(x, 12.4, 0.6, 0, Math.PI * 2); g.fill(); s.fillStyle = '#ffffff'; s.beginPath(); s.arc(x, 12.4, 0.7, 0, Math.PI * 2); s.fill(); }
    rr(COUNTER.w * 8 - 13, 3, 26, 7.4, 1.4, '#1a0e30');
    words(g, 'PRIZE COUNTER', COUNTER.w * 8, 6.8, 3, GC.gold); words(s, 'PRIZE COUNTER', COUNTER.w * 8, 6.8, 3, '#ffe890');
    return f.c;
  })();
  const deskBody = new THREE.Mesh(new THREE.BoxGeometry(COUNTER.w - 0.1, 0.8, 0.72), [redDark, redDark, redDark, redDark, lit(frontArt, 0.8), redDark]);
  deskBody.position.y = 0.4;
  deskBody.castShadow = deskBody.receiveShadow = true;
  const deskTop = new THREE.Mesh(new THREE.BoxGeometry(COUNTER.w + 0.04, 0.08, 0.86), gold);
  deskTop.position.y = 0.84;
  for (const [x, n] of [[-1.05, 4], [-0.82, 2], [0.95, 3]]) for (let i = 0; i < n; i++) {   // stacks of coins
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.035, 14), gold);
    c.position.set(x, 0.9 + i * 0.037, 0.12);
    desk.add(c);
  }
  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), gold);
  bell.position.set(0.55, 0.88, 0.18);
  desk.add(deskBody, deskTop, bell);
  desk.traverse(o => { o.userData.front = keeper; });
  group.add(desk);

  const ring = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: texOf(frameArt()), transparent: true, depthWrite: false }));
  ring.visible = false;
  ring.raycast = () => {};
  group.add(ring);

  return {
    group, blocked, spots, frame: ring, top: 4.7, title: 'Game Corner', light: 0.6, cols, rows, door: DOOR,
    keeper: { ...KEEPER, x: tileX(COUNTER.x + 1), z: tileZ(0) },
    refresh: () => redraws.forEach(r => r()),
    tick(now) {
      for (const sc of screens) if (!sc.held && now >= sc.next) { sc.at += 1; sc.next = now + CYCLE; sc.paint(); }
      rings.forEach((m, i) => { m.emissiveIntensity = 0.7 + 0.6 * Math.max(0, Math.sin(now / 260 - i * 0.7)); });
      screenMats.forEach((m, i) => { m.emissive.set(tints[Math.floor(now / 900 + i) % 4]); });
      for (const w of wheels) w.rotation.y = now / 1400;
    },
  };
}
