/* blackjack.js  -  the Game Corner's Blackjack table (2026-10-10), Meowth dealing: one deck a hand, the dealer stands
   on 17, a blackjack pays 3:2, Double on your first two cards. The hand's deck comes from its play's stream, and what
   you've done is saved (`save.corner.bets.bjHand`), so a refresh deals the same cards back where you were. */

import { shuffledDeck, handValue, isBlackjack, dealerPlays, blackjackReturn, playRand } from './data/casino.js';
import { playSound, preloadSounds } from './audio.js';
import { el } from './ui.js';
import { openPanel, key } from './corner-panel.js';
import { stake, stakeMore, settle, isOpen, coins, chipRow, tableMeters, closedLine, handOf, keepHand } from './casino-pot.js';

let panel = null, bet = 10, hand = null, result = null;

/** The hand as it stands, rebuilt from its deck and what was done: { player, dealer, deck }. */
function cards(h) {
  const deck = shuffledDeck(playRand('bj', h.day, h.n));
  const player = [deck.shift(), deck.shift()], dealer = [deck.shift(), deck.shift()];
  for (let i = 0; i < h.hits; i++) player.push(deck.shift());
  return { player, dealer, deck };
}

export function openBlackjack(onClose) {
  preloadSounds('card', 'coins', 'cancel', 'select');
  hand = handOf('bj');
  if (hand?.over) hand = null;
  result = null;
  panel = openPanel('bj', 'Blackjack', { onClose });
  render();
}

function card([r, s], down = false) {
  const c = el('span', `bj-card${down ? ' down' : ''}${s === '♥' || s === '♦' ? ' red' : ''}`);
  if (!down) c.append(el('b', '', r), el('i', '', s));
  return c;
}

function render() {
  const head = el('div', 'vf-head');
  head.append(el('strong', 'vf-title', 'BLACKJACK'), el('span', 'vf-lv', 'Meowth deals'));
  const felt = el('div', 'bj-felt');
  const shown = result ?? (hand ? { ...cards(hand), live: true } : null);
  if (shown) {
    const hide = shown.live;
    const drow = el('div', 'bj-row'), prow = el('div', 'bj-row');
    shown.dealer.forEach((c, i) => drow.append(card(c, hide && i === 1)));
    shown.player.forEach(c => prow.append(card(c)));
    felt.append(el('span', 'bj-label', hide ? `Meowth: ${handValue([shown.dealer[0]]).total} + ?` : `Meowth: ${handValue(shown.dealer).total}`), drow, prow,
      el('span', 'bj-label', `You: ${handValue(shown.player).total}${hand?.doubled || result?.doubled ? ' (doubled)' : ''}`));
  } else felt.append(el('span', 'bj-label', 'Place your bet, meow.'));
  const say = el('p', 'vf-say', result ? result.line : hand ? 'Hit for another card, Stand to stop, or Double your bet for exactly one more card.' : isOpen() ? 'Get closer to 21 than Meowth without going over. Blackjack pays 3 to 2.' : closedLine);
  const keys = el('div', 'vf-keys');
  if (hand) {
    const { player } = cards(hand);
    keys.append(key('Hit', 'vf-go', hit), key('Stand', 'vf-go', stand));
    const dbl = key(`Double`, 'vf-go', double);
    dbl.disabled = player.length !== 2 || coins() < hand.bet;
    keys.append(dbl);
  } else {
    const deal = key(`Deal · ${bet}`, 'vf-go', dealHand);
    deal.disabled = !isOpen() || coins() < bet;
    keys.append(deal, key('Close', 'vf-close', () => panel.shut()));
  }
  const box = el('div', 'vf-panel bj-panel');
  box.append(head, tableMeters(hand?.bet ?? bet), felt);
  if (!hand) box.append(chipRow(bet, (v) => { bet = v; playSound('select'); render(); }));
  box.append(say, keys);
  panel.root.replaceChildren(box);
}

function dealHand() {
  const play = stake('bj', bet);
  if (!play) return;
  result = null;
  hand = { day: play.day, n: play.n, bet, hits: 0, doubled: false };
  keepHand('bj', hand);
  playSound('card');
  const { player, dealer } = cards(hand);
  if (isBlackjack(player) || isBlackjack(dealer)) return finish();
  render();
}

function hit() {
  hand.hits += 1;
  keepHand('bj', hand);
  playSound('card');
  if (handValue(cards(hand).player).total >= 21) return finish();
  render();
}

function double() {
  if (!stakeMore(hand.bet)) return;
  hand = { ...hand, bet: hand.bet * 2, doubled: true, hits: hand.hits + 1 };
  keepHand('bj', hand);
  playSound('card');
  finish();
}

const stand = () => finish();

function finish() {
  const { player, dealer, deck } = cards(hand);
  const final = handValue(player).total > 21 ? dealer : dealerPlays(dealer, deck);
  const ret = blackjackReturn(player, final), pay = Math.floor(hand.bet * ret);
  settle(pay);
  keepHand('bj', { ...hand, over: true });
  const p = handValue(player).total, d = handValue(final).total;
  const line = p > 21 ? `Bust at ${p}! Meowth takes it.` : ret === 2.5 ? `Blackjack! You win ${pay} PokéCoins.` : ret === 2 ? `${d > 21 ? `Meowth busts at ${d}!` : `${p} beats ${d}!`} You win ${pay} PokéCoins.` : ret === 1 ? `Push at ${p}: your ${pay} back.` : isBlackjack(final) ? 'Meowth has Blackjack. Meow-ha!' : `Meowth's ${d} beats your ${p}.`;
  playSound(ret > 1 ? 'coins' : ret === 1 ? 'select' : 'cancel', 'select');
  result = { player, dealer: final, line, doubled: hand.doubled };
  hand = null;
  render();
}
