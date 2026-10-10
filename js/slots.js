/* slots.js  -  the Game Corner's slot machine (2026-10-10): three reels of Pokémon, one line, bet 10 to 100 a spin.
   The spin is paid the moment it's rolled (js/data/casino.js's spinReels() / slotPay(), the play's own stream), then
   the reels play it out, so a refresh can't take it back. */

import { spinReels, slotPay, playRand, PAY_THREE, PAY_TWO, PAY_BERRY } from './data/casino.js';
import { playSound, preloadSounds } from './audio.js';
import { el } from './ui.js';
import { calmFx } from './prefs.js';
import { openPanel, key } from './corner-panel.js';
import { stake, settle, isOpen, coins, chipRow, tableMeters, closedLine } from './casino-pot.js';

export const SYMBOL_ART = {
  seven: null,   // a big red 7, in CSS
  pikachu: 'assets/pokemon/pikachu-front.gif',
  poliwag: 'assets/pokemon/poliwag-front.gif',
  ball: 'assets/items/ultra-ball.png',
  berry: 'assets/items/oran-berry.png',
  voltorb: 'assets/pokemon/voltorb-front.gif',
};
const ORDER = ['seven', 'pikachu', 'poliwag', 'ball', 'berry', 'voltorb'];

let panel = null, bet = 10, reels = ['seven', 'pikachu', 'berry'], spinning = false, line = null, won = 0;

export function openSlots(onClose) {
  preloadSounds('stick', 'coins', 'cancel', 'achievement');
  spinning = false; won = 0;
  line = 'Pick a bet and pull! Three of a kind pays big; a matching pair on the first two reels, or an Oran Berry first, pays too.';
  panel = openPanel('sl', 'Slots', { onClose, busy: () => spinning });
  render();
}

function symbol(s, cls = '') {
  const box = el('span', `sl-sym ${cls}`);
  if (SYMBOL_ART[s]) { const i = el('img', 'pixel'); i.src = SYMBOL_ART[s]; i.alt = s; box.append(i); }
  else box.append(el('b', 'sl-seven', '7'));
  return box;
}

function render(spinTo = null) {
  const head = el('div', 'vf-head');
  head.append(el('strong', 'vf-title', 'SLOTS'), el('span', 'vf-lv', won > 0 ? `+${won}` : 'Bet a line'));
  const window_ = el('div', 'sl-window');
  reels.forEach((s, i) => {
    const reel = el('div', `sl-reel${spinTo ? ' spin' : ''}`);
    if (spinTo) {
      const strip = el('div', 'sl-strip');
      strip.style.setProperty('--d', `${0.9 + i * 0.45}s`);
      for (let k = 0; k < 14; k++) strip.append(symbol(ORDER[(k + i * 2) % ORDER.length]));
      strip.append(symbol(spinTo[i]));
      reel.append(strip);
    } else reel.append(symbol(s, won > 0 ? 'hit' : ''));
    window_.append(reel);
  });
  const table = el('div', 'sl-pays');
  for (const s of ['seven', 'pikachu', 'poliwag', 'ball', 'berry']) {
    const row = el('div', 'sl-pay');
    row.append(symbol(s, 'mini'), symbol(s, 'mini'), symbol(s, 'mini'), el('b', '', `×${PAY_THREE[s]}`), el('span', '', `pair ×${PAY_TWO[s]}`));
    table.append(row);
  }
  const berry = el('div', 'sl-pay');
  berry.append(symbol('berry', 'mini'), el('span', '', 'first reel'), el('b', '', `×${PAY_BERRY}`));
  table.append(berry);
  const keys = el('div', 'vf-keys');
  const pull = key(spinning ? 'Spinning…' : `Spin · ${bet}`, 'vf-go', spin);
  pull.disabled = spinning || !isOpen() || coins() < bet;
  keys.append(pull, key('Close', 'vf-close', () => { if (!spinning) panel.shut(); }));
  const box = el('div', 'vf-panel sl-panel');
  box.append(head, tableMeters(bet), window_, chipRow(bet, (v) => { bet = v; playSound('stick'); render(); }, spinning), el('p', 'vf-say', isOpen() ? line : closedLine), table, keys);
  panel.root.replaceChildren(box);
}

async function spin() {
  if (spinning) return;
  const play = stake('slots', bet);
  if (!play) return;
  const got = spinReels(playRand('slots', play.day, play.n)), mult = slotPay(got), pay = bet * mult;
  settle(pay);
  spinning = true; won = 0;
  playSound('stick');
  render(got);
  const ms = calmFx() ? 150 : 2000;
  for (let i = 0; i < 3 && !calmFx(); i++) setTimeout(() => playSound('stick'), 900 + i * 450);
  await new Promise(r => setTimeout(r, ms));
  if (!panel.root.isConnected) return;
  spinning = false; reels = got; won = pay - bet;
  if (mult >= 40) playSound('achievement', 'coins'); else if (mult) playSound('coins', 'buy'); else playSound('cancel');
  line = mult ? `${mult >= 40 ? 'JACKPOT! ' : ''}×${mult}: you win ${pay} PokéCoins!` : 'No luck this time. Spin again?';
  render();
}
