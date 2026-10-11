/* blastoff.js  -  Team Rocket Blast-Off, a Game Corner betting game (2026-10-11, the user's pick): bet, and Team Rocket's
   balloon lifts off with the payout climbing (×1.00, ×1.50, ×3...); cash out before it's blasted off and you win your bet
   times the climb, wait too long and it's gone. Where it blows comes from the play's stream (js/data/casino.js's
   crashPoint(): cashing out at any height returns 95% on average). The flight runs on the wall clock and is saved
   (`save.corner.bets.boHand`), so a refresh comes back to it still climbing, or already gone. */

import { crashPoint, crashMult, crashTime, playRand } from './data/casino.js';
import { playSound, preloadSounds } from './audio.js';
import { el } from './ui.js';
import { calmFx } from './prefs.js';
import { openPanel, key, firstLook, helpKey, helpCard } from './corner-panel.js';
import { stake, settle, isOpen, coins, chipRow, tableMeters, closedLine, handOf, keepHand } from './casino-pot.js';

let panel = null, bet = 10, flight = null, line = null, raf = 0, result = null, help = false;

const HELP = [
  ['Pick a bet, then Launch.', 'Your coins go up in Team Rocket\'s balloon.'],
  ['The number climbs as it rises:', '×1.00, ×1.50, ×2, ×5... Cash out pays your bet times that number. A 10 bet cashed at ×3 pays 30.'],
  ['At some random height the balloon blasts off.', 'Nobody knows when: half of all flights go before ×1.9, but now and then one sails past ×10.'],
  ['Tap Cash out before it blows and you win.', 'If it blows first, your bet goes with Team Rocket.'],
  ['Tip:', 'cashing out at ×1.5 wins about 6 times in 10; holding out for ×5 wins about 1 in 5. The strip at the top shows where the last flights blew.'],
];

/** Where the last flights blew (this device), newest first, for the strip over the sky. */
const history = () => { try { return JSON.parse(localStorage.getItem('pokedb.blastoff') || '[]'); } catch { return []; } };
const remember = (m) => { try { localStorage.setItem('pokedb.blastoff', JSON.stringify([m, ...history()].slice(0, 8))); } catch { /* storage off */ } };
// flight: { day, n, bet, start (Date.now()), crash }

export function openBlastOff(onClose) {
  preloadSounds('stick', 'coins', 'cancel', 'thunder', 'select', 'stat-up');
  result = null;
  line = 'Bet, then Launch! The payout climbs as the balloon rises. Cash out before Team Rocket blast off again!';
  help = firstLook('blastoff');
  const h = handOf('bo');
  flight = h && !h.over ? { ...h, crash: crashPoint(playRand('blastoff', h.day, h.n)) } : null;
  panel = openPanel('bo', 'Team Rocket Blast-Off', { onClose, busy: () => !!flight });
  render();
  if (flight) fly();
}

const multNow = () => crashMult(Date.now() - flight.start);

function render() {
  const head = el('div', 'vf-head');
  head.append(el('strong', 'vf-title', 'BLAST-OFF'), el('span', 'vf-lv', 'Team Rocket'), helpKey(help, () => { if (!flight) { help = !help; render(); } }));
  if (help && !flight) {
    const box = el('div', 'vf-panel bo-panel');
    box.append(head, helpCard(HELP, { done: () => { help = false; render(); } }));
    return panel.root.replaceChildren(box);
  }
  const past = el('div', 'bo-history');
  past.append(el('span', '', 'Last flights'));
  for (const m of history()) past.append(el('b', m >= 2 ? 'hi' : '', `×${m.toFixed(2)}`));
  const sky = el('div', `bo-sky${flight ? ' flying' : ''}${result?.lost ? ' blasted' : ''}`);
  const clouds = el('div', 'bo-clouds');
  for (let i = 0; i < 6; i++) { const c = el('span', 'bo-cloud'); c.style.setProperty('--x', `${(i * 37) % 90}%`); c.style.setProperty('--y', `${(i * 53) % 100}%`); clouds.append(c); }
  const balloon = el('div', 'bo-balloon');
  const meowth = el('img', 'pixel bo-meowth');
  meowth.src = 'assets/pokemon/meowth-front.gif'; meowth.alt = '';
  balloon.append(el('span', 'bo-ball', 'R'), el('span', 'bo-ropes'), el('span', 'bo-basket'), meowth);
  const mult = el('b', 'bo-mult', flight ? `×${multNow().toFixed(2)}` : result ? `×${result.at.toFixed(2)}` : '×1.00');
  const worth = el('span', 'bo-worth', flight ? `Cash out now: ${Math.floor(flight.bet * multNow())}` : result && !result.lost ? `You cashed out: ${result.pay}` : `Bet ${bet}`);
  sky.append(clouds, balloon, mult, worth);
  if (result?.lost) sky.append(el('span', 'bo-star'), el('span', 'bo-blast', "TEAM ROCKET'S BLASTING OFF AGAIN!"));
  const keys = el('div', 'vf-keys');
  if (flight) keys.append(key(`Cash out · ${Math.floor(flight.bet * multNow())}`, 'vf-go bo-cash', cashOut));
  else {
    const go = key(`Launch · ${bet}`, 'vf-go', launch);
    go.disabled = !isOpen() || coins() < bet;
    keys.append(go, key('Close', 'vf-close', () => panel.shut()));
  }
  const box = el('div', 'vf-panel bo-panel');
  box.append(head, tableMeters(flight?.bet ?? bet), past, sky);
  if (!flight) box.append(chipRow(bet, (v) => { bet = v; playSound('stick'); render(); }));
  box.append(el('p', 'vf-say', flight || isOpen() ? line : closedLine), keys);
  panel.root.replaceChildren(box);
}

function launch() {
  const play = stake('blastoff', bet);
  if (!play) return;
  flight = { day: play.day, n: play.n, bet, start: Date.now(), crash: crashPoint(playRand('blastoff', play.day, play.n)) };
  keepHand('bo', { day: flight.day, n: flight.n, bet, start: flight.start });
  result = null;
  line = 'Up, up and away! Cash out whenever you like.';
  playSound('stat-up', 'select');
  render();
  fly();
}

/** The climb: the multiplier and the cash-out key tick up each frame till it blows, or you cash out. */
function fly() {
  cancelAnimationFrame(raf);
  const tick = () => {
    if (!flight || !panel.root.isConnected) return;
    if (Date.now() - flight.start >= crashTime(flight.crash)) return blast();
    const m = multNow();
    panel.root.querySelector('.bo-mult').textContent = `×${m.toFixed(2)}`;
    panel.root.querySelector('.bo-cash').textContent = `Cash out · ${Math.floor(flight.bet * m)}`;
    panel.root.querySelector('.bo-worth').textContent = `Cash out now: ${Math.floor(flight.bet * m)}`;
    const rise = Math.min(1, Math.log(m) / Math.log(10));
    panel.root.querySelector('.bo-sky').style.setProperty('--rise', rise.toFixed(3));
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
}

function cashOut() {
  if (!flight) return;
  cancelAnimationFrame(raf);
  const m = Math.min(multNow(), flight.crash), pay = Math.floor(flight.bet * m);
  if (Date.now() - flight.start >= crashTime(flight.crash)) return blast();
  settle(pay);
  keepHand('bo', { day: flight.day, n: flight.n, over: true });
  result = { at: m, pay };
  remember(flight.crash);
  line = `Cashed out at ×${m.toFixed(2)}: ${pay} PokéCoins! It would have gone to ×${flight.crash.toFixed(2)}.`;
  flight = null;
  playSound('coins', 'buy');
  render();
}

function blast() {
  cancelAnimationFrame(raf);
  keepHand('bo', { day: flight.day, n: flight.n, over: true });
  result = { at: flight.crash, lost: true };
  remember(flight.crash);
  line = `Blasted off at ×${flight.crash.toFixed(2)}! Your ${flight.bet} went with them.`;
  flight = null;
  playSound('thunder', 'cancel');
  if (!calmFx()) navigator.vibrate?.(150);
  render();
}
