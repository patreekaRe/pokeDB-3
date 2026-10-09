/* mall-corner.js  -  the Poké Mall's Game Corner, walked into (roadmap 5b; branch secret-base): a 3D arcade behind the
   hall's middle front. Neon on violet walls, a confetti carpet, and everything the cabinet sells (js/shop.js's
   cornerEntries(), the same items and prices) standing there to buy in person: the starter skins and Poké Balls in a lit
   prize case on the left (Gen 1's prize exchange), every shiny in a case on the right, a row of perk machines either
   side of the red runner, and Meowth behind the prize counter saying every line. One machine is dark, waiting for the
   prize games (5c). Painted smooth (fine()); js/mall-3d.js walks it, this file only builds it. */

import { cornerEntries } from './shop.js';
import { trim } from './hd2d.js';
import { fine, texOf, words, star, GC } from './hub-3d.js';

/* The room: two cases against the back wall either side of the counter, perk machines in a row across the middle with
   the runner free between them. `x` a thing's first tile, `w` its tiles. */
const CASES = [
  { id: 'prizes', x: 0, w: 5, title: 'PRIZES', shelves: [{ row: 'skins', per: 6 }, { row: 'balls', per: 8 }] },
  { id: 'shiny', x: 8, w: 5, title: 'SHINY', shelves: [{ row: 'shiny', per: 8 }] },
];
const CASE_H = 2.5, CASE_D = 0.7;
const COUNTER = { x: 5, y: 1, w: 3 };
const MACHINE_Y = 3, MACHINES = [0, 1, 2, 3, 4, 8, 9, 10, 11, 12];   // a perk each, the last one dark till the prize games
const MACHINE_H = 1.3;

const NEON = { pink: '#ff5ab8', cyan: '#4ae8f0', gold: '#ffd84a', lime: '#9cf060' };
const WALL = ['#3a2260', '#2a1648', '#1c0e34'];

/* Meowth keeps the Game Corner (Pay Day: it can't keep its paws off a coin). */
export const KEEPER = {
  id: 'meowth', name: 'Meowth', src: 'assets/pokemon/meowth-front.gif',
  hello: ['Welcome to the Game Corner, meow! Everything here\'s for PokéCoins.', 'A customer! Step right up, the prizes won\'t buy themselves, meow.', 'Shinies on the right, prizes on the left, perks in the machines. Tap anything!'],
  chat: ['Coins, coins, coins! You win \'em on your runs, you spend \'em here. That\'s the deal, meow.', 'That dark machine? Prize games are coming. Slots, meow! I can hardly wait.', 'Every shiny in that case is the real deal. Polished \'em myself.', 'Pay Day is my favourite move. Can you tell?'],
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

function ball(g, x, y, r, ink = GC.ink) {
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  g.fillStyle = GC.red; g.beginPath(); g.arc(x, y, r, Math.PI, 0); g.fill();
  g.strokeStyle = ink; g.lineWidth = r * 0.16;
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.moveTo(x - r, y); g.lineTo(x + r, y); g.stroke();
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x, y, r * 0.32, 0, Math.PI * 2); g.fill(); g.stroke();
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
  const rx = 6 * T + 2, rw = T - 4, ry = 2 * T;
  rr(rx - 1, ry, rw + 2, rows * T - ry, 0, GC.goldDark);
  rr(rx, ry, rw, rows * T - ry, 0, lin(rx, 0, rx + rw, 0, ['#a82838', '#c83848', '#a82838']));
  coin(g, 6.5 * T, 5 * T, 4.6);
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
const PERK_COLOUR = { hpBoost: NEON.pink, relicCharm: '#b07af0', wellFed: '#f0904a', coinFinder: NEON.gold, bagPocket: '#f0b040', martCard: NEON.cyan, tutorNotes: '#7aa8f0', scoutReport: NEON.lime, scopeUpgrade: '#f06060' };

/** A perk machine's face: a lit marquee in its colour, a screen with its picture, level and price, buttons and a coin
    tray; a dark one (`e` null) says SOON on a black screen. */
function machineArt(e) {
  const f = fine(18, 27, 10), { g, rr, lin, shine } = f, s = shine();
  const col = e ? PERK_COLOUR[e.id] ?? NEON.pink : '#5a5668';
  rr(0, 0, 18, 27, 1.4, lin(0, 0, 18, 0, [GC.chrome[2], GC.chrome[0], GC.chrome[1], GC.chrome[2]]));
  rr(1.2, 1.2, 15.6, 5, 1, lin(0, 1.2, 0, 6.2, [col, '#00000060']));
  rr(2, 2, 14, 3.4, 0.8, e ? col : '#4a4656');
  if (e) { s.fillStyle = col; s.beginPath(); s.roundRect(2, 2, 14, 3.4, 0.8); s.fill(); }
  words(g, e ? (e.name.length > 14 ? e.name.split(' ').slice(-1)[0] : e.name).toUpperCase() : 'PRIZE GAMES', 9, 3.8, e ? 2.3 : 2, e ? '#2a1648' : '#8a8698');
  rr(1.6, 7, 14.8, 11.6, 1, '#120a22');
  if (e) {
    const sc = lin(0, 7.6, 0, 18, ['#2a1a50', '#3a2470']);
    rr(2.2, 7.6, 13.6, 10.4, 0.8, sc);
    s.fillStyle = '#6a50a8'; s.beginPath(); s.roundRect(2.2, 7.6, 13.6, 10.4, 0.8); s.fill();
    g.save(); g.translate(9, 11.4); g.scale(0.62, 0.62); (PERK_ART[e.id] ?? PERK_ART.coinFinder)(g); g.restore();
    s.save(); s.translate(9, 11.4); s.scale(0.62, 0.62); (PERK_ART[e.id] ?? PERK_ART.coinFinder)(s); s.restore();
    const tag = e.blocked ? 'LOCKED' : e.done ? e.done.toUpperCase() : `${e.cost}`;
    words(g, e.level ?? '', 9, 15.3, 1.8, '#c8b8f0');
    if (!e.done && !e.blocked) coin(g, 5.6, 17, 1);
    words(g, tag, e.done || e.blocked ? 9 : 10, 17, 2.1, e.done ? NEON.lime : e.blocked ? '#a098b8' : NEON.gold);
    words(s, tag, e.done || e.blocked ? 9 : 10, 17, 2.1, '#ffffff');
  } else {
    rr(2.2, 7.6, 13.6, 10.4, 0.8, '#0a0612');
    words(g, 'SOON', 9, 12.8, 3, '#3a3448');
  }
  for (const [x, c] of [[5, GC.red], [9, NEON.gold], [13, '#4a8ef0']]) {
    g.fillStyle = '#00000050'; g.beginPath(); g.arc(x, 21.4, 1.5, 0, Math.PI * 2); g.fill();
    g.fillStyle = e ? c : '#6a6678'; g.beginPath(); g.arc(x, 21, 1.4, 0, Math.PI * 2); g.fill();
    if (e) { s.fillStyle = c; s.beginPath(); s.arc(x, 21, 1, 0, Math.PI * 2); s.fill(); }
  }
  rr(5, 23.6, 8, 2.2, 0.8, '#3a3448');
  rr(6, 24.2, 6, 1, 0.5, '#120a22');
  return f.c;
}

/* ---------- the prize cases ---------- */

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

/** A case's face, `w` tiles wide: a gold frame, its name in neon along the top, then velvet shelves behind glass with
    each thing on them and its price (OWNED with a ball once bought, a padlock if it can't be yet). `cut` maps a src to
    its loaded picture. */
function caseArt(def, rows, cutOf, U) {
  const W = def.w * U, H = CASE_H * U, f = fine(W, H, 8), { g, rr, lin, shine } = f, s = shine();
  rr(0, 0, W, H, 2, lin(0, 0, 0, H, [GC.gold, GC.goldDark, '#8a6418']));
  rr(1.6, 1.6, W - 3.2, 8, 1.4, '#1a0e30');
  g.save(); glow(g, NEON.pink, 3); words(g, def.title, W / 2, 5.8, 6, NEON.pink); g.restore();
  words(g, def.title, W / 2, 5.8, 6, '#ffe0f4'); words(s, def.title, W / 2, 5.8, 6, NEON.pink);
  const top = 11, bot = H - 2.4, x0 = 2.2, x1 = W - 2.2;
  rr(x0, top, x1 - x0, bot - top, 1, lin(0, top, 0, bot, ['#7a1830', '#a82848', '#6a1428']));
  s.fillStyle = '#502030'; s.fillRect(x0, top, x1 - x0, bot - top);
  const cells = [];
  let y = top;
  const total = def.shelves.reduce((n, sh) => n + Math.ceil(rows[sh.row].length / sh.per), 0), lane = (bot - top) / total;
  for (const sh of def.shelves) {
    const list = rows[sh.row];
    for (let r = 0; r * sh.per < list.length; r++) {
      const slots = list.slice(r * sh.per, (r + 1) * sh.per), cw = (x1 - x0) / sh.per;
      const shelfY = y + lane - 1.6;
      rr(x0, shelfY, x1 - x0, 1.6, 0.3, lin(0, shelfY, 0, shelfY + 1.6, ['#fff4d0', '#d8b870']));
      s.fillStyle = '#ffffff'; s.fillRect(x0, shelfY, x1 - x0, 0.5);
      slots.forEach((e, k) => {
        const i = r * sh.per + k, cx = x0 + cw * (k + 0.5), picH = lane - 5.4, cut = cutOf(e.sprite);
        if (cut) {
          const sc = Math.min(picH / cut.h, (cw - 1.6) / cut.w);
          const w = cut.w * sc, h = cut.h * sc;
          g.imageSmoothingEnabled = false;
          g.drawImage(e.dark ? silhouette(cut) : cut.c, cx - w / 2, shelfY - 3.6 - h, w, h);
          g.imageSmoothingEnabled = true;
        }
        const tagY = shelfY - 1.9;
        if (e.done) { ball(g, cx - 3.6, tagY, 0.9); words(g, 'OWNED', cx + 1, tagY, 1.9, NEON.lime); }
        else if (e.blocked) words(g, e.dark ? '???' : 'LOCKED', cx, tagY, 1.9, '#d8b8c8');
        else { coin(g, cx - 2.8, tagY, 0.9); words(g, `${e.cost}`, cx + 1, tagY, 2, '#fff2b8'); }
        cells.push({ row: sh.row, i, x: cx / U, y: (H - (y + lane / 2)) / U, w: cw / U, h: lane / U });
      });
      y += lane;
    }
  }
  g.fillStyle = 'rgba(255,255,255,0.12)';   // the glass's glint
  g.beginPath(); g.moveTo(x0 + 6, top); g.lineTo(x0 + 16, top); g.lineTo(x0 + 6, bot); g.lineTo(x0, bot); g.closePath(); g.fill();
  return { c: f.c, cells };
}

/* ---------- building it ---------- */

/** The Game Corner. `size` is the hall's ({ cols, rows, top, u }), so one camera fits both. Returns its group, the tiles
    it blocks, the spots you can walk up to (a case's every thing, each machine, the counter), the gold frame that marks a
    picked one, its shopkeeper's place, `refresh()` to repaint prices and OWNED marks after a buy, and a dimmer light. */
export function buildCorner(THREE, size) {
  const { cols, rows, top: TOP, u: U } = size;
  const tileX = (tx) => tx + 0.5 - cols / 2, tileZ = (ty) => ty + 0.5 - rows / 2;
  const group = new THREE.Group(), blocked = new Set(), spots = [], redraws = [];
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, ...o });
  const lit = (src, k = 1, colour = '#ffffff') => std({ map: texOf(src), emissive: new THREE.Color(colour), emissiveMap: texOf(src.glow ?? src), emissiveIntensity: k, roughness: 0.9 });
  const swap = (m, src, k) => { m.map?.dispose(); m.emissiveMap?.dispose(); m.map = texOf(src); m.emissiveMap = texOf(src.glow ?? src); m.emissiveIntensity = k; m.needsUpdate = true; };
  const edge = std({ color: '#1a1028' });

  const floor = new THREE.Mesh(new THREE.BoxGeometry(cols, 0.6, rows), [edge, edge, std({ map: texOf(floorArt(size)), roughness: 0.95 }), edge, std({ color: '#2a1840' }), edge]);
  floor.position.y = -0.3;
  floor.receiveShadow = true;
  group.add(floor);
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(cols + 0.8, 7, rows + 0.4), [edge, edge, edge, edge, std({ color: '#24143a' }), edge]);
  plinth.position.set(0, -0.6 - 3.5, -0.2);
  group.add(plinth);
  const cap = std({ color: '#2a1648' });
  const back = new THREE.Mesh(new THREE.BoxGeometry(cols + 0.8, TOP, 0.4), [cap, cap, cap, cap, lit(wallArt(size), 1.2), cap]);
  back.position.set(0, TOP / 2, -rows / 2 - 0.2);
  back.receiveShadow = true;
  group.add(back);
  const side = sideArt(size);
  for (const sgn of [-1, 1]) {
    const inside = lit(side, 1.1);
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.4, TOP, rows), sgn < 0 ? [inside, cap, cap, cap, cap, cap] : [cap, inside, cap, cap, cap, cap]);
    m.position.set(sgn * (cols / 2 + 0.2), TOP / 2, 0);
    m.receiveShadow = true;
    group.add(m);
  }

  // the prize cases, their faces lit from inside, an invisible board over each thing to tap
  const tapMat = new THREE.MeshBasicMaterial({ visible: false });
  for (const def of CASES) {
    const z = -rows / 2 + CASE_D / 2 + 0.02, cx = tileX(def.x) - 0.5 + def.w / 2;
    for (let x = def.x; x < def.x + def.w; x++) blocked.add(`${x},0`);
    const box = new THREE.Group();
    box.position.set(cx, 0, z);
    const body = std({ color: GC.goldDark, metalness: 0.4, roughness: 0.4 }), face = std({});
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(def.w - 0.08, CASE_H, CASE_D), [body, body, body, body, face, body]);
    mesh.position.y = CASE_H / 2;
    mesh.castShadow = mesh.receiveShadow = true;
    box.add(mesh);
    group.add(box);
    const caseSpots = new Map();
    const paint = (cutOf) => {
      const rowsNow = Object.fromEntries(def.shelves.map(sh => [sh.row, cornerEntries(sh.row)]));
      const art = caseArt(def, rowsNow, cutOf, U);
      swap(face, art.c, 0.85);
      for (const cell of art.cells) {
        const e = rowsNow[cell.row][cell.i], k = `${cell.row}${cell.i}`;
        let spot = caseSpots.get(k);
        if (!spot) {
          const wx = cx - def.w / 2 + cell.x, tx = Math.min(def.x + def.w - 1, Math.max(def.x, Math.floor(wx + cols / 2)));
          spot = { id: k, kind: 'prize', row: cell.row, i: cell.i, open: true, step: { x: tx, y: 1 },
            frame: { x: wx, y: cell.y, z: z + CASE_D / 2 + 0.02, w: cell.w * 0.96, h: cell.h * 0.96 } };
          caseSpots.set(k, spot);
          spots.push(spot);
          const tap = new THREE.Mesh(new THREE.PlaneGeometry(cell.w, cell.h), tapMat);
          tap.position.set(wx, cell.y, z + CASE_D / 2 + 0.03);
          tap.userData.front = spot;
          group.add(tap);
        }
        spot.name = e.name;
      }
    };
    const srcs = def.shelves.flatMap(sh => cornerEntries(sh.row).map(e => e.sprite)).filter(Boolean);
    const cuts = new Map();
    paint(() => null);
    Promise.all(srcs.map(src => picture(src).then(c => cuts.set(src, c)))).then(() => paint(src => cuts.get(src)));
    redraws.push(() => paint(src => cuts.get(src) ?? null));
  }

  // the perk machines, and the dark one
  const perks = cornerEntries('perks');
  const chrome = std({ color: '#cdc8e0', metalness: 0.5, roughness: 0.35 }), violet = std({ color: GC.violet, roughness: 0.6 });
  MACHINES.forEach((tx, n) => {
    const e = perks[n] ?? null;
    blocked.add(`${tx},${MACHINE_Y}`);
    const m = new THREE.Group();
    m.position.set(tileX(tx), 0, tileZ(MACHINE_Y));
    const face = lit(machineArt(e), e ? 1 : 0.2);
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.84, MACHINE_H, 0.6), [violet, violet, chrome, chrome, face, violet]);
    body.position.y = MACHINE_H / 2;
    body.castShadow = body.receiveShadow = true;
    m.add(body);
    const topper = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.16, 0.5), std({ color: e ? PERK_COLOUR[e.id] : '#3a3448', emissive: new THREE.Color(e ? PERK_COLOUR[e.id] : '#000000'), emissiveIntensity: e ? 0.9 : 0 }));
    topper.position.y = MACHINE_H + 0.08;
    m.add(topper);
    const spot = e
      ? { id: `perk${n}`, kind: 'prize', row: 'perks', i: n, name: e.name, open: true, step: { x: tx, y: MACHINE_Y + 1 }, frame: { x: tileX(tx), y: MACHINE_H / 2, z: tileZ(MACHINE_Y) + 0.32, w: 0.94, h: MACHINE_H + 0.1 } }
      : { id: 'soon', kind: 'soon', name: 'Prize games', open: false, line: 'Out of order: prize games are coming soon.', step: { x: tx, y: MACHINE_Y + 1 } };
    spots.push(spot);
    m.traverse(o => { o.userData.front = spot; });
    group.add(m);
    if (e) redraws.push(() => { const now = cornerEntries('perks')[n]; spot.name = now.name; swap(face, machineArt(now), 1); });
  });

  // the prize counter, Meowth's place behind it
  const keeper = { id: 'keeper', kind: 'keeper', name: KEEPER.name, open: true, step: { x: COUNTER.x + 1, y: COUNTER.y + 1 } };
  spots.push(keeper);
  for (let x = COUNTER.x; x < COUNTER.x + COUNTER.w; x++) for (let y = 0; y <= COUNTER.y; y++) blocked.add(`${x},${y}`);
  const desk = new THREE.Group();
  desk.position.set(tileX(COUNTER.x + 1), 0, tileZ(COUNTER.y));
  const red = std({ color: GC.redDark, roughness: 0.6 });
  const frontArt = (() => {
    const f = fine(COUNTER.w * 16, 14, 6), { g, rr, lin, shine } = f, s = shine();
    rr(0, 0, COUNTER.w * 16, 14, 0, lin(0, 0, 0, 14, [GC.red, GC.redDark]));
    rr(0, 0, COUNTER.w * 16, 1.4, 0, GC.gold);
    for (let x = 3; x < COUNTER.w * 16; x += 4) { g.fillStyle = '#fff6c8'; g.beginPath(); g.arc(x, 12.4, 0.6, 0, Math.PI * 2); g.fill(); s.fillStyle = '#ffffff'; s.beginPath(); s.arc(x, 12.4, 0.7, 0, Math.PI * 2); s.fill(); }
    rr(COUNTER.w * 8 - 13, 3, 26, 7.4, 1.4, '#1a0e30');
    words(g, 'PRIZE COUNTER', COUNTER.w * 8, 6.8, 3, GC.gold); words(s, 'PRIZE COUNTER', COUNTER.w * 8, 6.8, 3, '#ffe890');
    return f.c;
  })();
  const deskBody = new THREE.Mesh(new THREE.BoxGeometry(COUNTER.w - 0.1, 0.8, 0.72), [red, red, red, red, lit(frontArt, 0.8), red]);
  deskBody.position.y = 0.4;
  deskBody.castShadow = deskBody.receiveShadow = true;
  const deskTop = new THREE.Mesh(new THREE.BoxGeometry(COUNTER.w + 0.04, 0.08, 0.86), std({ color: GC.gold, metalness: 0.5, roughness: 0.35 }));
  deskTop.position.y = 0.84;
  const gold = std({ color: GC.gold, metalness: 0.7, roughness: 0.3 });
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
    group, blocked, spots, frame: ring, top: 4.7, title: 'Game Corner', light: 0.6,
    keeper: { ...KEEPER, x: tileX(COUNTER.x + 1), z: tileZ(0) },
    refresh: () => redraws.forEach(r => r()),
  };
}
