/* plinko.js  -  Poké Ball Plinko, a Game Corner game (2026-10-11, the user's pick; rebuilt the same day, the
   user's ask: bigger, and the ball should fall like a ball): drop a Poké Ball down twelve rows of pegs into one of
   thirteen bins paying ×0.2 to ×10 (js/data/casino.js: PLINKO_PAYS / PLINKO_ODDS, about 95% back). Each drop is paid
   the moment it's rolled (its bin and bounces from the play's stream), then the ball plays it out on a canvas under
   gravity: every peg it strikes knocks it up a little and sideways, and it speeds up as it falls. A drop stakes Meowth's
   house chips; the day's first PLAYS.plinko pay (js/casino-pot.js). Drop one at a time or all you have left at once. */

import { PLINKO_ROWS, PLINKO_PAYS, plinkoDrop, playRand } from './data/casino.js';
import { STAKE } from './data/corner.js';
import { playSound, preloadSounds } from './audio.js';
import { el } from './ui.js';
import { getSave } from './storage.js';
import { calmFx } from './prefs.js';
import { openPanel, key, firstLook, helpKey, helpCard } from './corner-panel.js';
import { stake, settle, wonText, bestLine, playsLeft, paysNow, tableMeters, sayLine, playLabel } from './casino-pot.js';
import { record } from './corner-pot.js';

/* The board in peg spacings (1 = the gap between two pegs in a row); the canvas scales it. */
const GAP_Y = 0.88, TOP = 1.3, PEG_R = 0.1, BALL_R = 0.27, GRAVITY = 40, BOUNCE = 0.42;
const W = PLINKO_ROWS + 2.2, BIN_H = 1.25, H = TOP + (PLINKO_ROWS - 1) * GAP_Y + 0.7 + BIN_H;
const pegX = (r, k) => W / 2 + (k - (r + 2) / 2);
const rowY = (r) => TOP + r * GAP_Y;
const binX = (b) => W / 2 + (b - PLINKO_ROWS / 2);
const BIN_TOP = rowY(PLINKO_ROWS - 1) + 0.55;
const TIERS = ['#5a6a80', '#4a9a68', '#3aa8d8', '#e8a030', '#e85a3a', '#ff2a68', '#ffd84a'];
const tierOf = (b) => Math.abs(b - PLINKO_ROWS / 2);

const HELP = [
  ['Drop a Poké Ball.', 'It\'s free, and it bounces down through the pegs into a bin.'],
  ['The bin it lands in sets what you win,', `its number times ${STAKE} PokéCoins: ×0.2 to ×0.55 in the middle, more further out, up to ×10 (${10 * STAKE}) at the very edges.`],
  ['Most balls land near the middle,', 'but about 1 in 25 reaches an edge. You get a few paying drops a day; after that, drop for fun (Plinko earns no prize tickets).'],
];

let panel = null, bet = STAKE, line = null, help = false;
let held = { coins: 0, tickets: 0 };
let cv = null, g = null, balls = [], flashes = new Map(), binHits = new Map(), raf = 0, last = 0, plinked = 0;

export function openPlinko(onClose) {
  preloadSounds('stick', 'coins', 'cancel', 'select', 'plink-1', 'plink-2');
  balls = []; flashes = new Map(); binHits = new Map(); held = { coins: 0, tickets: 0 };
  line = 'Drop a Poké Ball! The edges pay big, the middle pays little.';
  help = firstLook('plinko');
  panel = openPanel('pk', 'Plinko', { onClose: () => { cancelAnimationFrame(raf); onClose?.(); }, busy: () => balls.length > 0 });
  render();
}

function render() {
  const head = el('div', 'vf-head');
  head.append(el('strong', 'vf-title', 'PLINKO'), el('span', 'vf-lv', 'Poké Ball drop'), helpKey(help, () => { if (!balls.length) { help = !help; render(); } }));
  const box = el('div', 'vf-panel pk-panel');
  if (help) {
    box.append(head, helpCard(HELP, { done: () => { help = false; render(); } }));
    return panel.root.replaceChildren(box);
  }
  cv = el('canvas', 'pk-canvas');
  g = cv.getContext('2d');
  const keys = el('div', 'vf-keys');
  const one = key(playLabel('plinko', 'Drop'), 'vf-go pk-one', () => drop(1));
  const all = key('Drop them all', 'vf-go pk-five', () => drop(playsLeft('plinko')));
  keys.append(one, all, key('Close', 'vf-close', () => { if (!balls.length) panel.shut(); }));
  box.append(head, tableMeters('plinko', held), cv, el('p', 'vf-say', sayLine('plinko', line, balls.length > 0)), bestLine(['plinko']), keys);
  panel.root.replaceChildren(box);
  sizeCanvas();
  refreshKeys();
  cancelAnimationFrame(raf);
  last = performance.now();
  raf = requestAnimationFrame(frame);
}

function sizeCanvas() {
  const w = cv.clientWidth || 360, dpr = Math.min(2, devicePixelRatio || 1);
  cv.width = Math.round(w * dpr);
  cv.height = Math.round(w * H / W * dpr);
  cv.style.height = `${w * H / W}px`;
}

function refreshKeys() {
  const one = panel.root.querySelector('.pk-one'), all = panel.root.querySelector('.pk-five');
  if (one) one.textContent = playLabel('plinko', 'Drop');
  if (all) all.hidden = !paysNow('plinko') || playsLeft('plinko') < 2;
}

/** Pays `n` drops at once (so a refresh mid-fall loses nothing), then sets each ball off, a beat apart. What they won
    stays off the meters and the coin count until each lands (the user's ask, 2026-10-12: it showed at the drop). */
function drop(n) {
  for (let i = 0; i < Math.max(1, n); i++) {
    const play = stake('plinko');
    const { bin, path } = plinkoDrop(playRand('plinko', play.day, play.n)), m = PLINKO_PAYS[bin];
    const res = settle(bet * m, 'plinko', play.paid);
    held.coins += res.coins; held.tickets += res.tickets;
    setTimeout(() => launch(bin, path, m, res, play.paid), i * 260);
  }
  playSound('select');
  showHeld();
  refreshKeys();
}

function showHeld() {
  panel.root.querySelector('.vf-meters')?.replaceWith(tableMeters('plinko', held));
  const coins = String(getSave().coins - held.coins);
  for (const node of document.querySelectorAll('.coin-value')) node.textContent = coins;
}

/* The fall, worked out up front as arcs between strikes: from each peg the ball leaves upwards at BOUNCE of the speed it
   hit with, half a gap sideways, and gravity brings it down onto the next row's peg. */
function launch(bin, path, m, res, paid) {
  if (!panel?.root.isConnected) return;
  const segs = [];
  let x = W / 2 + (Math.random() - 0.5) * 0.12, y = 0.2, vy = 0, c = 0;
  path.forEach((d, r) => {
    const px = pegX(r, c + 1), py = rowY(r) - PEG_R - BALL_R * 0.9;
    segs.push(arc(x, y, px + (d ? 0.08 : -0.08), py, vy, { peg: `${r},${c + 1}` }));
    vy = segs[segs.length - 1].vEnd * BOUNCE;
    x = px + (d ? 0.08 : -0.08); y = py;
    c += d;
  });
  const bx = binX(bin), floorY = H - BALL_R - 0.08;
  segs.push(arc(x, y, bx, floorY, vy, { bin }));
  segs.push(arc(bx, floorY, bx, floorY, segs[segs.length - 1].vEnd * 0.3, { settle: true }));
  balls.push({ segs, i: 0, t: 0, x, y: 0.2, spin: 0, bin, m, res, paid, trail: [] });
}

/** One arc from (x0, y0) to (x1, y1), leaving with upward speed `up` (canvas y grows downwards). */
function arc(x0, y0, x1, y1, up, info) {
  const dy = y1 - y0, v0 = -up;
  const T = Math.max(0.06, (-v0 + Math.sqrt(Math.max(0, v0 * v0 + 2 * GRAVITY * dy))) / GRAVITY);
  return { x0, y0, x1, y1, v0, T, vEnd: v0 + GRAVITY * T, ...info };
}

function frame(now) {
  if (!cv?.isConnected) return;
  const dt = Math.min(0.05, (now - last) / 1000) * (calmFx() ? 3 : 1);
  last = now;
  for (const b of [...balls]) step(b, dt, now);
  draw(now);
  raf = requestAnimationFrame(frame);
}

function step(b, dt, now) {
  b.t += dt;
  let s = b.segs[b.i];
  while (s && b.t >= s.T) {
    b.t -= s.T;
    if (s.peg) { flashes.set(s.peg, now); if (!calmFx() && now - plinked > 45) { plinked = now; playSound(Math.random() < 0.5 ? 'plink-1' : 'plink-2'); } }
    if (s.bin != null) binHit(b, now);
    if (s.settle) { balls.splice(balls.indexOf(b), 1); return; }
    s = b.segs[++b.i];
  }
  if (!s) return;
  const k = b.t / s.T;
  b.x = s.x0 + (s.x1 - s.x0) * k;
  b.y = s.y0 + s.v0 * b.t + GRAVITY * b.t * b.t / 2;
  b.spin += (s.x1 - s.x0) * dt * 14;
  b.trail.push([b.x, b.y]);
  if (b.trail.length > 7) b.trail.shift();
}

function binHit(b, now) {
  binHits.set(b.bin, now);
  held.coins -= b.res.coins; held.tickets -= b.res.tickets;
  showHeld();
  playSound(b.m >= 1 ? 'coins' : 'cancel', 'select');
  const won = wonText(b.res, b.paid);
  record('plinko', b.m);
  line = b.m >= 2.4 ? `×${b.m}! ${won}!` : `×${b.m}: ${won}.`;
  const say = panel.root.querySelector('.vf-say');
  if (say) say.textContent = sayLine('plinko', line, balls.length > 1);
  refreshKeys();
}

function draw(now) {
  const s = cv.width / W;
  g.setTransform(s, 0, 0, s, 0, 0);
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#1d3c66'); sky.addColorStop(1, '#0b1830');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  for (let r = 0; r < PLINKO_ROWS; r++) for (let k = 0; k <= r + 2; k++) {
    const lit = Math.max(0, 1 - (now - (flashes.get(`${r},${k}`) ?? -1e9)) / 350);
    const x = pegX(r, k), y = rowY(r);
    if (lit) { g.fillStyle = `rgba(255, 230, 140, ${0.5 * lit})`; g.beginPath(); g.arc(x, y, PEG_R * (2 + 2 * lit), 0, Math.PI * 2); g.fill(); }
    const p = g.createRadialGradient(x - 0.03, y - 0.03, 0, x, y, PEG_R);
    p.addColorStop(0, '#ffffff'); p.addColorStop(1, lit ? '#ffe07a' : '#8eb4dc');
    g.fillStyle = p; g.beginPath(); g.arc(x, y, PEG_R, 0, Math.PI * 2); g.fill();
  }
  for (let b = 0; b <= PLINKO_ROWS; b++) {
    const x = binX(b), t = tierOf(b), hit = Math.max(0, 1 - (now - (binHits.get(b) ?? -1e9)) / 500);
    const y = BIN_TOP + hit * 0.18;
    g.fillStyle = TIERS[t]; g.beginPath(); g.roundRect(x - 0.46, y, 0.92, H - y - 0.04, 0.14); g.fill();
    if (hit) { g.fillStyle = `rgba(255, 255, 255, ${0.6 * hit})`; g.beginPath(); g.roundRect(x - 0.46, y, 0.92, H - y - 0.04, 0.14); g.fill(); }
    g.fillStyle = '#ffffff'; g.font = `800 ${String(PLINKO_PAYS[b]).length > 3 ? 0.3 : 0.36}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(String(PLINKO_PAYS[b]), x, y + 0.42); g.font = '700 0.22px system-ui, sans-serif'; g.fillText('×', x, y + 0.14);
  }
  for (const b of balls) {
    b.trail.forEach(([x, y], i) => { g.fillStyle = `rgba(255, 255, 255, ${0.05 * i})`; g.beginPath(); g.arc(x, y, BALL_R * (0.5 + i * 0.06), 0, Math.PI * 2); g.fill(); });
    ball(b.x, b.y, b.spin);
  }
}

/** A Poké Ball, turning as it rolls. */
function ball(x, y, spin) {
  g.save();
  g.translate(x, y); g.rotate(spin);
  g.fillStyle = '#e83a3a'; g.beginPath(); g.arc(0, 0, BALL_R, Math.PI, 0); g.fill();
  g.fillStyle = '#f6f6f6'; g.beginPath(); g.arc(0, 0, BALL_R, 0, Math.PI); g.fill();
  g.strokeStyle = '#202028'; g.lineWidth = 0.05;
  g.beginPath(); g.moveTo(-BALL_R, 0); g.lineTo(BALL_R, 0); g.stroke();
  g.beginPath(); g.arc(0, 0, BALL_R, 0, Math.PI * 2); g.stroke();
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(0, 0, 0.08, 0, Math.PI * 2); g.fill(); g.stroke();
  g.restore();
  g.fillStyle = 'rgba(255, 255, 255, 0.5)'; g.beginPath(); g.arc(x - 0.09, y - 0.1, 0.05, 0, Math.PI * 2); g.fill();
}
