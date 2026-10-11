/* plinko.js  -  Poké Ball Plinko, a Game Corner betting game (2026-10-11, the user's pick): drop a Poké Ball down eight
   rows of pegs into one of nine bins paying ×0.4 to ×13 (js/data/casino.js, PLINKO_PAYS: about 95% back). Each drop is
   paid the moment it's rolled (its path from the play's stream), then the ball plays it out; drop as many as you like
   at once. */

import { PLINKO_ROWS, PLINKO_PAYS, plinkoPath, plinkoBin, playRand } from './data/casino.js';
import { playSound, preloadSounds } from './audio.js';
import { el } from './ui.js';
import { calmFx } from './prefs.js';
import { openPanel, key } from './corner-panel.js';
import { stake, settle, isOpen, coins, chipRow, tableMeters, closedLine } from './casino-pot.js';

const STEP = 260;   // ms a row
let panel = null, bet = 10, line = null, falling = 0, board = null, meters = null;

export function openPlinko(onClose) {
  preloadSounds('stick', 'coins', 'cancel', 'select');
  falling = 0;
  line = 'Drop a Poké Ball! The edges pay big, the middle pays little. Drop as many as you like.';
  panel = openPanel('pk', 'Plinko', { onClose, busy: () => falling > 0 });
  render();
}

function render() {
  const head = el('div', 'vf-head');
  head.append(el('strong', 'vf-title', 'PLINKO'), el('span', 'vf-lv', 'Poké Ball drop'));
  board = el('div', 'pk-board');
  for (let r = 0; r < PLINKO_ROWS; r++) for (let k = 0; k <= r + 2; k++) {
    const peg = el('span', 'pk-peg');
    peg.style.left = `${pegX(r, k)}%`; peg.style.top = `${rowY(r)}%`;
    board.append(peg);
  }
  const bins = el('div', 'pk-bins');
  PLINKO_PAYS.forEach((m, i) => { const b = el('span', `pk-bin t${Math.min(4, Math.abs(i - 4))}`, `×${m}`); bins.append(b); });
  board.append(bins);
  meters = tableMeters(bet);
  const keys = el('div', 'vf-keys');
  const go = key(`Drop · ${bet}`, 'vf-go', drop);
  go.disabled = !isOpen() || coins() < bet;
  keys.append(go, key('Close', 'vf-close', () => { if (!falling) panel.shut(); }));
  const box = el('div', 'vf-panel pk-panel');
  box.append(head, meters, board, chipRow(bet, (v) => { bet = v; playSound('stick'); render(); }), el('p', 'vf-say', isOpen() ? line : closedLine), keys);
  panel.root.replaceChildren(box);
}

const SPAN = 84;   // % of the board's width the bottom row covers
const pegX = (r, k) => 50 + (k - (r + 2) / 2) * (SPAN / (PLINKO_ROWS + 1));
const rowY = (r) => 8 + r * 10;

function drop() {
  const play = stake('plinko', bet);
  if (!play) return;
  const path = plinkoPath(playRand('plinko', play.day, play.n)), bin = plinkoBin(path), m = PLINKO_PAYS[bin], pay = Math.floor(bet * m);
  settle(pay);
  falling += 1;
  playSound('select');
  const ball = el('span', 'pk-ball');
  board.append(ball);
  const pts = [{ x: 50, y: 0 }];
  let right = 0;
  path.forEach((d, r) => { right += d; pts.push({ x: 50 + (right - (r + 1) / 2) * (SPAN / (PLINKO_ROWS + 1)), y: rowY(r) + 5 }); });
  pts.push({ x: pts[pts.length - 1].x, y: 92 });
  const t0 = performance.now(), step = calmFx() ? 30 : STEP;
  const tick = (now) => {
    if (!ball.isConnected) return;
    const f = (now - t0) / step, i = Math.min(pts.length - 2, Math.floor(f)), k = Math.min(1, f - i);
    const a = pts[i], b = pts[i + 1], hop = Math.sin(k * Math.PI) * 3;
    ball.style.left = `${a.x + (b.x - a.x) * k}%`;
    ball.style.top = `${a.y + (b.y - a.y) * k - hop}%`;
    if (k >= 1 && i === pts.length - 2) return land(ball, bin, pay, m);
    if (Math.floor(f) !== Math.floor((now - 16 - t0) / step) && i < PLINKO_ROWS && !calmFx()) playSound('stick');
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  refreshMeters();
}

function land(ball, bin, pay, m) {
  falling -= 1;
  const b = board.querySelectorAll('.pk-bin')[bin];
  b.classList.remove('hit'); void b.offsetWidth; b.classList.add('hit');
  setTimeout(() => ball.remove(), 600);
  playSound(m >= 1 ? 'coins' : 'cancel', 'select');
  line = m >= 3 ? `×${m}! ${pay} PokéCoins!` : `×${m}: ${pay} back.`;
  panel.root.querySelector('.vf-say').textContent = line;
  refreshMeters();
}

function refreshMeters() {
  const fresh = tableMeters(bet);
  meters.replaceWith(fresh);
  meters = fresh;
  const go = panel.root.querySelector('.vf-keys .vf-go');
  if (go) go.disabled = !isOpen() || coins() < bet;
}
