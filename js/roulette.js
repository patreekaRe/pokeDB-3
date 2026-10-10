/* roulette.js  -  the Game Corner's roulette wheel (2026-10-10): a single-zero wheel of 37, one bet a spin on a colour,
   odd / even, a half, a dozen or a single number. Paid the moment it's rolled (js/data/casino.js, the play's own
   stream), then the wheel turns to the number. */

import { WHEEL, REDS, ROULETTE_BETS, spinWheel, rouletteReturn, playRand } from './data/casino.js';
import { playSound, preloadSounds } from './audio.js';
import { el } from './ui.js';
import { calmFx } from './prefs.js';
import { openPanel, key } from './corner-panel.js';
import { stake, settle, isOpen, coins, chipRow, tableMeters, closedLine } from './casino-pot.js';

let panel = null, bet = 10, on = 'red', spinning = false, last = null, line = null, turn = 0, from = 0;

export function openRoulette(onClose) {
  preloadSounds('stick', 'coins', 'cancel', 'select');
  spinning = false;
  line = 'Pick what to bet on, then spin. Colours, odd/even and halves pay 2×, dozens 3×, one number 36×.';
  panel = openPanel('rl', 'Roulette', { onClose, busy: () => spinning });
  render();
}

const colour = (n) => (n === 0 ? 'green' : REDS.has(n) ? 'red' : 'black');

function wheel() {
  const w = el('div', 'rl-wheel');
  const disc = el('div', `rl-disc${spinning ? ' spinning' : ''}`);
  disc.style.setProperty('--turn', `${turn}deg`);
  disc.style.setProperty('--from', `${from}deg`);
  const step = 360 / WHEEL.length;
  WHEEL.forEach((n, i) => {
    const s = el('span', `rl-slot ${colour(n)}`, String(n));
    s.style.setProperty('--a', `${i * step}deg`);
    disc.append(s);
  });
  w.append(disc, el('span', 'rl-pointer'), el('span', `rl-hub${last != null && !spinning ? ` ${colour(last)}` : ''}`, last != null && !spinning ? String(last) : ''));
  return w;
}

function render() {
  const head = el('div', 'vf-head');
  head.append(el('strong', 'vf-title', 'ROULETTE'), el('span', 'vf-lv', typeof on === 'number' ? `On ${on}` : ROULETTE_BETS[on].name));
  const board = el('div', 'rl-board');
  for (const [id, b] of Object.entries(ROULETTE_BETS)) {
    const k = key(b.name, `rl-bet ${id}${on === id ? ' on' : ''}`, () => { on = id; playSound('select'); render(); });
    k.disabled = spinning;
    board.append(k);
  }
  const nums = el('div', 'rl-nums');
  for (let n = 0; n <= 36; n++) {
    const k = key(String(n), `rl-num ${colour(n)}${on === n ? ' on' : ''}`, () => { on = n; playSound('select'); render(); });
    k.disabled = spinning;
    nums.append(k);
  }
  const keys = el('div', 'vf-keys');
  const go = key(spinning ? 'Spinning…' : `Spin · ${bet}`, 'vf-go', spin);
  go.disabled = spinning || !isOpen() || coins() < bet;
  keys.append(go, key('Close', 'vf-close', () => { if (!spinning) panel.shut(); }));
  const box = el('div', 'vf-panel rl-panel');
  box.append(head, tableMeters(bet), wheel(), chipRow(bet, (v) => { bet = v; playSound('stick'); render(); }, spinning), board, nums, el('p', 'vf-say', isOpen() ? line : closedLine), keys);
  panel.root.replaceChildren(box);
}

async function spin() {
  if (spinning) return;
  const play = stake('roulette', bet);
  if (!play) return;
  const n = spinWheel(playRand('roulette', play.day, play.n)), ret = rouletteReturn(on, n), pay = bet * ret;
  settle(pay);
  spinning = true;
  const step = 360 / WHEEL.length, at = WHEEL.indexOf(n);
  from = turn;
  turn = turn - (((turn % 360) + 360) % 360) - 360 * 4 - at * step;   // whole turns, then the number under the pointer at the top
  playSound('stick');
  render();
  await new Promise(r => setTimeout(r, calmFx() ? 150 : 3200));
  if (!panel.root.isConnected) return;
  spinning = false; last = n;
  playSound(ret ? 'coins' : 'cancel', 'select');
  const what = typeof on === 'number' ? `number ${on}` : ROULETTE_BETS[on].name;
  line = ret ? `${n} ${colour(n)}! Your bet on ${what} pays ${pay} PokéCoins.` : `${n} ${colour(n)}. Your bet on ${what} loses.${n === 0 ? ' The zero is the house\'s, meow.' : ''}`;
  render();
}

