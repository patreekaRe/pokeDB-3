/* casino-pot.js  -  the betting games' bookkeeping (js/data/casino.js has the rules): what you're up today, how many
   plays each game has had (the play's number seeds its roll), staking and paying out. Kept in `save.corner.bets`
   ({ day, net, plays }); a game's hand in progress is its own field there. Winnings never count towards
   `stats.coinsEarned`, so betting can't earn the coin badges. */

import { BETS, BET_CAP, tablesOpen, JACKPOT_BASE, JACKPOT_FEED } from './data/casino.js';
import { safariDay } from './data/safari.js';
import { getSave, updateSave } from './storage.js';
import { el, refreshCoins } from './ui.js';

function today() {
  const b = getSave().corner?.bets, day = safariDay();
  return b?.day === day ? b : { day, net: 0, plays: {} };
}
const write = (b) => updateSave(d => { d.corner = { ...d.corner, bets: b }; });

export const netToday = () => today().net;
export const isOpen = () => tablesOpen(today().net);
export const coins = () => getSave().coins ?? 0;

/** Takes a stake for a new play of `game`; returns { day, n } (the play's seed), or null if it can't be bet. */
export function stake(game, amount) {
  const b = today();
  if (!tablesOpen(b.net) || coins() < amount) return null;
  const n = b.plays[game] ?? 0;
  write({ ...b, net: b.net - amount, plays: { ...b.plays, [game]: n + 1 } });
  updateSave(d => { d.coins -= amount; });
  refreshCoins();
  return { day: b.day, n };
}

/** A free play of `game` (a bonus round's spin): its seed, no stake. */
export function freePlay(game) {
  const b = today(), n = b.plays[game] ?? 0;
  write({ ...b, plays: { ...b.plays, [game]: n + 1 } });
  return { day: b.day, n };
}

/** The slots' jackpot: it carries over between days (`save.corner.jackpot`), fed by every paid spin. */
export const jackpot = () => getSave().corner?.jackpot ?? JACKPOT_BASE;
export function feedJackpot(bet) {
  const pot = jackpot() + Math.max(1, Math.round(bet * JACKPOT_FEED));
  updateSave(d => { d.corner = { ...d.corner, jackpot: pot }; });
}
/** Three 7s: the whole pot, and it starts again from the floor. */
export function winJackpot() {
  const pot = jackpot();
  updateSave(d => { d.corner = { ...d.corner, jackpot: JACKPOT_BASE }; });
  settle(pot);
  return pot;
}

/** More stake on a play already going (Blackjack's double). False if the coins aren't there. */
export function stakeMore(amount) {
  if (coins() < amount) return false;
  const b = today();
  write({ ...b, net: b.net - amount });
  updateSave(d => { d.coins -= amount; });
  refreshCoins();
  return true;
}

/** Pays `amount` back (the stake included). */
export function settle(amount) {
  if (!amount) return;
  const b = today();
  write({ ...b, net: b.net + amount });
  updateSave(d => { d.coins += amount; });
  refreshCoins();
}

/** A game's saved hand in progress (`save.corner.bets[game + 'Hand']`), only if it's today's. */
export const handOf = (game) => { const b = today(), h = b[`${game}Hand`]; return h?.day === b.day ? h : null; };
export const keepHand = (game, hand) => write({ ...today(), [`${game}Hand`]: hand });

/** The chips row: BETS to pick from, the picked one lit, and how much more today's tables allow. */
export function chipRow(bet, pick, disabled = false) {
  const row = el('div', 'cs-chips');
  for (const v of BETS) {
    const c = el('button', `cs-chip${v === bet ? ' on' : ''}`, String(v));
    c.type = 'button';
    c.disabled = disabled || coins() < v;
    c.addEventListener('click', () => pick(v));
    row.append(c);
  }
  return row;
}

/** The meters every table shows: your coins, the bet, and today's winnings against the cap. */
export function tableMeters(bet) {
  const m = el('div', 'vf-meters');
  const net = netToday();
  for (const [k, v] of [['Coins', coins().toLocaleString()], ['Bet', String(bet)], ['Today', `${net >= 0 ? '+' : ''}${net}/${BET_CAP}`]]) {
    const box = el('div', 'vf-meter'); box.append(el('span', '', k), el('b', '', v)); m.append(box);
  }
  return m;
}

export const closedLine = `The house is out of coins for today: you're ${BET_CAP} up! The tables open again tomorrow, meow.`;
