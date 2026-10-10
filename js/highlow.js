/* highlow.js  -  the Game Corner's High-Low (2026-10-10): a card, then guess whether the next is higher or lower. A
   right guess multiplies the pot (by 0.95 over its chance, js/data/casino.js's hlMult()), a tie or a wrong one loses
   it; cash out whenever you like. Each card comes from the play's stream and its step, and the pot is saved
   (`save.corner.bets.hlHand`), so a refresh comes back to the same card. */

import { drawRank, hlMult, hlChance } from './data/casino.js';
import { streamOf } from './rng.js';
import { playSound, preloadSounds } from './audio.js';
import { el } from './ui.js';
import { openPanel, key } from './corner-panel.js';
import { stake, settle, isOpen, coins, chipRow, tableMeters, closedLine, handOf, keepHand } from './casino-pot.js';

const NAMES = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' };
const SUIT = ['♠', '♥', '♦', '♣'];
let panel = null, bet = 10, hand = null, line = null, flip = null;

const cardAt = (h, step) => drawRank(streamOf('casino:hl', `${h.day}:${h.n}:${step}`));

export function openHighLow(onClose) {
  preloadSounds('card', 'coins', 'cancel', 'select', 'stat-up');
  hand = handOf('hl');
  if (hand?.over) hand = null;
  line = hand ? 'Your pot is still riding. Higher or lower?' : 'Guess if the next card is higher or lower. Each right guess grows the pot; a wrong one or a tie loses it.';
  flip = null;
  panel = openPanel('hl', 'High-Low', { onClose });
  render();
}

function card(rank, step, cls = '') {
  const s = SUIT[(rank + step) % 4], c = el('span', `bj-card big${s === '♥' || s === '♦' ? ' red' : ''} ${cls}`);
  c.append(el('b', '', NAMES[rank] ?? String(rank)), el('i', '', s));
  return c;
}

function render() {
  const head = el('div', 'vf-head');
  head.append(el('strong', 'vf-title', 'HIGH-LOW'), el('span', 'vf-lv', hand ? `Pot ${hand.pot}` : 'Bet to start'));
  const felt = el('div', 'bj-felt hl-felt');
  if (hand) {
    const rank = cardAt(hand, hand.step);
    if (flip) felt.append(card(flip.rank, hand.step - 1, 'old'));
    felt.append(card(rank, hand.step, flip ? 'new' : ''));
  } else if (flip) felt.append(card(flip.rank, 0, 'old'), card(flip.next, 1, 'new lost'));
  else felt.append(el('span', 'bj-label', 'Place your bet, meow.'));
  const keys = el('div', 'vf-keys');
  if (hand) {
    const rank = cardAt(hand, hand.step);
    for (const [g, label] of [['hi', 'Higher'], ['lo', 'Lower']]) {
      const m = hlMult(rank, g);
      const k = key(m ? `${label} ×${m.toFixed(2)}` : label, 'vf-go', () => guess(g));
      k.disabled = !m;
      k.title = `${Math.round(hlChance(rank, g) * 100)}% chance`;
      keys.append(k);
    }
    keys.append(key(`Cash out ${hand.pot}`, 'vf-go hl-cash', cashOut));
  } else {
    const go = key(`Deal · ${bet}`, 'vf-go', start);
    go.disabled = !isOpen() || coins() < bet;
    keys.append(go, key('Close', 'vf-close', () => panel.shut()));
  }
  const box = el('div', 'vf-panel hl-panel');
  box.append(head, tableMeters(hand?.bet ?? bet), felt);
  if (!hand) box.append(chipRow(bet, (v) => { bet = v; playSound('select'); render(); }));
  box.append(el('p', 'vf-say', hand || isOpen() ? line : closedLine), keys);
  panel.root.replaceChildren(box);
}

function start() {
  const play = stake('hl', bet);
  if (!play) return;
  hand = { day: play.day, n: play.n, bet, pot: bet, step: 0 };
  keepHand('hl', hand);
  flip = null;
  line = 'Higher or lower? The odds are on the keys.';
  playSound('card');
  render();
}

function guess(g) {
  const rank = cardAt(hand, hand.step), next = cardAt(hand, hand.step + 1), m = hlMult(rank, g);
  const right = g === 'hi' ? next > rank : next < rank;
  playSound('card');
  if (!right) {
    keepHand('hl', { ...hand, over: true });
    flip = { rank, next };
    line = `${NAMES[next] ?? next}! ${next === rank ? 'A tie loses' : 'Wrong way'}: the pot of ${hand.pot} goes to the house.`;
    hand = null;
    playSound('cancel');
    return render();
  }
  hand = { ...hand, pot: Math.floor(hand.pot * m), step: hand.step + 1 };
  keepHand('hl', hand);
  flip = { rank };
  line = `${NAMES[next] ?? next}! Right: the pot is ${hand.pot}. Again, or cash out?`;
  playSound('stat-up', 'select');
  render();
}

function cashOut() {
  settle(hand.pot);
  keepHand('hl', { ...hand, over: true });
  line = `Cashed out: ${hand.pot} PokéCoins!`;
  playSound('coins', 'buy');
  hand = null; flip = null;
  render();
}
