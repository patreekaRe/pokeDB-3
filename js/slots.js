/* slots.js  -  the Game Corner's slot machine (2026-10-10; reworked 2026-10-11, the user's pick): three reels you stop
   yourself, Gen 1's way. Each reel's STRIP turns under the line; a tap on its STOP stops it at the symbol under the line,
   then it slides on 0 to SLIP-1 more from the spin's own stream (js/data/casino.js), so timing pays but never quite
   guarantees. Three Pikachu start a bonus round of free spins paying double; three 7s win the JACKPOT. A spin stakes
   Meowth's house chips, never your coins: the day's first PLAYS.slots pay (js/casino-pot.js). The two 7s on the first reels slow the last one down. A spin left half-stopped (a
   refresh) is settled the next time the machine opens, its last reels stopped where the stream says. */

import { STRIP, slotPay, stopAt, playRand, PAY_THREE, PAY_TWO, PAY_BERRY, BONUS_SPINS, JACKPOT } from './data/casino.js';
import { STAKE } from './data/corner.js';
import { randIndex } from './rng.js';
import { playSound, preloadSounds } from './audio.js';
import { el } from './ui.js';
import { calmFx } from './prefs.js';
import { openPanel, key } from './corner-panel.js';
import { stake, freePlay, settle, wonText, bestLine, tableMeters, sayLine, playLabel, handOf, keepHand } from './casino-pot.js';
import { record } from './corner-pot.js';

export const SYMBOL_ART = {
  seven: null,   // a big red 7, in CSS
  pikachu: 'assets/pokemon/pikachu-front.gif',
  poliwag: 'assets/pokemon/poliwag-front.gif',
  ball: 'assets/items/ultra-ball.png',
  berry: 'assets/items/oran-berry.png',
  voltorb: 'assets/pokemon/voltorb-front.gif',
};
const SPEED = 9;          // symbols a second under the line
const AUTO_STOP = 7000;   // ms before a reel nobody stopped stops itself

let panel = null, line = null, won = 0, spin = null, raf = 0;
// spin: { play, free, reels: [{ pos, stopping, target, done }] }

/** The saved hand: { day, n, bet, paid, free, stops: [target or null] }, plus a bonus round's spins left (`bonus`). */
const saved = () => handOf('sl') ?? {};

export function openSlots(onClose) {
  preloadSounds('stick', 'coins', 'cancel', 'achievement', 'select');
  won = 0; spin = null;
  line = 'Spin, then tap each STOP to stop its reel. Line up three of a kind; three 7s win the jackpot, three Pikachu a bonus round.';
  panel = openPanel('sl', 'Slots', { onClose, busy: () => !!spin });
  const h = saved();
  if (h.stops && h.stops.some(s => s == null)) finishLeft(h);
  render();
}

/** A spin a refresh cut short: its unstopped reels stop where its stream says, and it's paid. */
function finishLeft(h) {
  const rand = playRand('slots-left', h.day, h.n);
  const stops = h.stops.map(s => (s == null ? randIndex(STRIP.length, rand) : s));
  payLine(stops, h);
  line = `Your last spin finished while you were away: ${line}`;
}

function symbol(s, cls = '') {
  const box = el('span', `sl-sym ${cls}`);
  if (SYMBOL_ART[s]) { const i = el('img', 'pixel'); i.src = SYMBOL_ART[s]; i.alt = s; box.append(i); }
  else box.append(el('b', 'sl-seven', '7'));
  return box;
}

let reelEls = [];
function render() {
  const h = saved(), bonus = h.bonus?.left ?? 0;
  const head = el('div', 'vf-head');
  head.append(el('strong', 'vf-title', 'SLOTS'), el('span', `vf-lv${bonus ? ' sl-bonus-tag' : ''}`, bonus ? `BONUS ×2 · ${bonus} free` : won > 0 ? `+${won}` : 'Tap to stop'));
  const pot = el('div', 'sl-jackpot');
  pot.append(el('span', '', 'JACKPOT'), el('b', '', JACKPOT.toLocaleString()));
  const window_ = el('div', `sl-window${bonus ? ' bonus' : ''}`);
  reelEls = [0, 1, 2].map((i) => {
    const reel = el('div', 'sl-reel');
    const strip = el('div', 'sl-strip');
    for (const s of [...STRIP, ...STRIP, ...STRIP.slice(0, 3)]) strip.append(symbol(s));
    reel.append(strip, el('span', 'sl-line'));
    window_.append(reel);
    return { reel, strip };
  });
  const stops = el('div', 'sl-stops');
  [0, 1, 2].forEach((i) => {
    const b = key('STOP', 'sl-stop', () => stopReel(i));
    b.disabled = !spin || spin.reels[i].stopping;
    stops.append(b);
  });
  const table = el('div', 'sl-pays');
  const row = (cells, pay, extra = '') => { const r = el('div', 'sl-pay'); r.append(...cells, el('b', '', pay), el('span', '', extra)); table.append(r); };
  row([symbol('seven', 'mini'), symbol('seven', 'mini'), symbol('seven', 'mini')], 'JACKPOT', 'pair ×' + PAY_TWO.seven);
  for (const s of ['pikachu', 'poliwag', 'ball', 'berry']) row([symbol(s, 'mini'), symbol(s, 'mini'), symbol(s, 'mini')], `×${PAY_THREE[s]}`, `${s === 'pikachu' ? '+BONUS · ' : ''}pair ×${PAY_TWO[s]}`);
  row([symbol('berry', 'mini'), el('span', '', 'first reel')], `×${PAY_BERRY}`);
  const keys = el('div', 'vf-keys');
  const go = key(spin ? 'Stop the reels!' : bonus ? `Free spin (${bonus})` : playLabel('slots', 'Spin'), 'vf-go', startSpin);
  go.disabled = !!spin;
  keys.append(go, key('Close', 'vf-close', () => { if (!spin) panel.shut(); }));
  const box = el('div', `vf-panel sl-panel${bonus ? ' bonus' : ''}`);
  box.append(head, tableMeters('slots'), pot, window_, stops);
  box.append(el('p', 'vf-say', sayLine('slots', line, !!spin || !!bonus)), bestLine(['jackpots', 'slots']), table, keys);
  panel.root.replaceChildren(box);
  drawReels();
}

/** Where each reel's strip sits: the symbol at `pos` under the line, the ones either side above and below. */
function drawReels() {
  const reels = spin?.reels ?? (saved().last ?? [0, 0, 0]).map(t => ({ pos: t }));
  reels.forEach((r, i) => {
    const el_ = reelEls[i];
    if (!el_) return;
    const h = el_.reel.clientHeight / 3 || 34;
    el_.strip.style.transform = `translateY(${-((r.pos % STRIP.length) + STRIP.length - 1) * h}px)`;   // the middle copy, so the rows above and below are never empty
  });
}

function startSpin() {
  if (spin) return;
  const h = saved(), bonus = h.bonus?.left ?? 0;
  const free = bonus > 0, b = STAKE;
  const play = free ? { ...freePlay('slots'), paid: h.bonus.paid } : stake('slots');
  const rand = playRand('slots', play.day, play.n);
  spin = { play, free, bet: b, rand, start: performance.now(), reels: [0, 1, 2].map(i => ({ pos: (h.last?.[i] ?? 0) + i * 0.37, stopping: false, done: false })) };
  keepHand('sl', { ...h, day: play.day, n: play.n, bet: b, paid: play.paid, free, stops: [null, null, null], bonus: free ? { ...h.bonus, left: bonus - 1 } : h.bonus });
  won = 0;
  line = free ? 'Bonus spin! Everything pays double.' : 'Tap STOP on each reel. Time it for a 7!';
  playSound('stick');
  render();
  cancelAnimationFrame(raf);
  let last = performance.now();
  const tick = (now) => {
    const dt = Math.min(60, now - last) / 1000; last = now;
    if (!spin) return;
    spin.reels.forEach((r, i) => {
      if (r.done) return;
      if (!r.stopping && now - spin.start > AUTO_STOP + i * 400) stopReel(i);
      const slowLast = i === 2 && spin.reels[0].done && spin.reels[1].done && STRIP[spin.reels[0].target] === 'seven' && STRIP[spin.reels[1].target] === 'seven';
      const v = r.stopping ? Math.max(2.5, Math.min(SPEED, (r.goal - r.pos) * 5)) : slowLast ? SPEED * 0.45 : SPEED;
      r.pos += v * dt;
      if (r.stopping && r.pos >= r.goal) { r.pos = r.goal; r.done = true; playSound('stick'); if (spin.reels.every(x => x.done)) return finishSpin(); }
    });
    drawReels();
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
}

function stopReel(i) {
  if (!spin) return;
  const r = spin.reels[i];
  if (r.stopping) return;
  const under = Math.ceil(r.pos) % STRIP.length;   // the symbol just reaching the line: a stop only ever rolls forward
  r.target = stopAt(under, spin.rand);
  r.goal = r.pos + ((r.target - (r.pos % STRIP.length)) % STRIP.length + STRIP.length) % STRIP.length;
  if (calmFx()) r.pos = r.goal;
  r.stopping = true;
  const h = saved(), stops = [...(h.stops ?? [null, null, null])];
  stops[i] = r.target;
  keepHand('sl', { ...h, stops });
  playSound('select');
  render();
}

function finishSpin() {
  cancelAnimationFrame(raf);
  const stops = spin.reels.map(r => r.target);
  const h = saved();
  spin = null;
  payLine(stops, h);
  render();
}

/** Pays a stopped line and moves the bonus round on; the line's words in `line`. */
function payLine(stops, h) {
  const got = stops.map(t => STRIP[t]), m = slotPay(got), mult = h.free ? 2 : 1;
  let bonusLeft = h.bonus?.left ?? 0, bonusPaid = h.bonus?.paid ?? h.paid;
  const chips = m === 'jackpot' ? JACKPOT : h.bet * m * mult, res = settle(chips, 'slots', h.paid), pay = res.coins;
  if (got.every(s => s === 'pikachu')) { bonusLeft += BONUS_SPINS; bonusPaid = h.paid; }
  keepHand('sl', { day: h.day, n: h.n, bet: h.bet, stops, last: stops, bonus: bonusLeft ? { left: bonusLeft, paid: bonusPaid } : null });
  won = pay;
  const coins = () => wonText(res, h.paid);
  if (chips) record('slots', chips);
  if (m === 'jackpot') record('jackpots', 1, true);
  if (m === 'jackpot') { playSound('achievement', 'coins'); line = `JACKPOT!!! Three 7s: ${coins()}!`; }
  else if (got.every(s => s === 'pikachu')) { playSound('achievement', 'coins'); line = `Pika-BONUS! ×${m * mult}: ${coins()}, and ${BONUS_SPINS} free spins paying double!`; }
  else if (chips) { playSound('coins', 'buy'); line = `×${m * mult}: ${coins()}!${h.free ? ' (bonus)' : ''}`; }
  else {
    playSound('cancel');
    line = got[0] === 'seven' && got[1] === 'seven' ? 'So close! Two 7s...' : h.free ? 'No luck on that free spin.' : 'No luck. Spin again?';
  }
  if (bonusLeft && !got.every(s => s === 'pikachu')) line += ` ${bonusLeft} free spin${bonusLeft > 1 ? 's' : ''} left.`;
}

