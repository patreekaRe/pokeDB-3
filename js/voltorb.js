/* voltorb.js  -  Voltorb Flip, the Game Corner's game (the revamp, 2026-10-10): HGSS's board over whatever is showing,
   its rules in js/data/corner.js. Free to play; a won or quit round pays coins from its score, up to the day's cap.
   The round in play is saved (`save.corner.voltorb`), so a refresh comes back to the same board and flips. A Memo key
   marks tiles you think are Voltorbs (not saved). */

import {
  SIZE, GAMES_CAP as VOLTORB_CAP, voltorbBoard, clues, score, cleared, payout, capPay, nextLevel, freshVoltorb,
} from './data/corner.js';
import { safariDay } from './data/safari.js';
import { getSave, updateSave } from './storage.js';
import { playSound, preloadSounds } from './audio.js';
import { el, refreshCoins } from './ui.js';
import { calmFx } from './prefs.js';
import { potWon, payGame } from './corner-pot.js';

const LINE_COLOURS = ['#e07060', '#58b060', '#e8a040', '#4a90d8', '#b070d0'];

let root = null, just = -1, state = null, board = null, memo = false, marks = new Set(), ended = null, onClose = null;

/** Today's record: a new day starts at round 0 with nothing won, keeping the level. */
function load() {
  const day = safariDay(), s = getSave().corner?.voltorb;
  state = s?.day === day ? { ...s, flipped: [...s.flipped] } : freshVoltorb(day, s?.level ?? 1);
  board = voltorbBoard(state.day, state.round, state.level);
}

const keep = () => updateSave(d => { d.corner = { ...d.corner, voltorb: state }; });

/** Opens the game; `close` runs once it's shut (the mall repaints its coins). */
export function openVoltorb(close) {
  onClose = close ?? null;
  preloadSounds('card', 'thunder', 'coins', 'plink-1', 'plink-2');
  load();
  memo = false; marks = new Set(); ended = null; just = -1;
  root?.remove();
  root = el('div', 'cg-overlay vf');
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', 'Voltorb Flip');
  root.addEventListener('pointerdown', (e) => { if (e.target === root) shut(); });
  document.body.append(root);
  document.addEventListener('keydown', onKey, true);
  render();
}

function onKey(e) {
  if (e.key !== 'Escape' || !root) return;
  e.stopPropagation();
  shut();
}

function shut() {
  playSound('cancel', 'confirm');
  document.removeEventListener('keydown', onKey, true);
  root?.remove();
  root = null;
  refreshCoins();
  onClose?.();
}

/** A Voltorb, drawn in CSS: red over white with its eyes. */
const voltorbIcon = (cls = '') => { const v = el('span', `vf-voltorb ${cls}`); v.setAttribute('aria-hidden', 'true'); return v; };

function render() {
  const won = potWon(), points = ended ? ended.points : score(board, state.flipped);
  const pays = ended ? ended.paid : capPay(payout(points), won);
  const head = el('div', 'vf-head');
  head.append(el('strong', 'vf-title', 'VOLTORB FLIP'), el('span', 'vf-lv', `Lv. ${ended ? ended.level : state.level}`));
  const meters = el('div', 'vf-meters');
  meters.append(
    meter('Score', points.toLocaleString()),
    meter('Pays', won >= VOLTORB_CAP && !ended ? 'For fun' : `${pays} 💰`),
    meter('Today', `${Math.min(won, VOLTORB_CAP)}/${VOLTORB_CAP}`),
  );
  if (ended?.fresh && ended.paid) {   // the round's coins count up into the day's, once
    ended.fresh = false;
    countUp(meters.lastChild.lastChild, won - ended.paid, won);
    meters.children[1].classList.add('paid');
  }

  const c = clues(board), grid = el('div', 'vf-grid');
  for (let r = 0; r < SIZE; r++) {
    for (let col = 0; col < SIZE; col++) grid.append(tile(r * SIZE + col));
    grid.append(clue(c.rows[r], r));
  }
  for (let col = 0; col < SIZE; col++) grid.append(clue(c.cols[col], col));
  grid.append(el('span', 'vf-corner'));

  const say = el('p', 'vf-say', ended ? ended.line
    : won >= VOLTORB_CAP ? `The games have paid the most for today (${VOLTORB_CAP}). Play on for fun, new coins come tomorrow.`
    : state.flipped.length ? 'Flip every 2 and 3 to clear the board. Or quit and take what you have.'
    : 'Flip the tiles: each one multiplies your score. The numbers say each line\'s total and how many Voltorbs hide in it.');

  const keys = el('div', 'vf-keys');
  if (ended) keys.append(button('Next round', 'vf-go', next));
  else {
    const m = button(memo ? 'Memo: on' : 'Memo', `vf-memo${memo ? ' on' : ''}`, () => { memo = !memo; playSound('select'); render(); });
    m.setAttribute('aria-pressed', String(memo));
    const quit = button(state.flipped.length ? `Quit · take ${pays}` : 'Quit', 'vf-quit', quitRound);
    quit.disabled = !state.flipped.length;
    keys.append(m, quit);
  }
  keys.append(button('Close', 'vf-close', shut));

  const panel = el('div', `vf-panel${ended?.boom != null && just === ended.boom && !calmFx() ? ' shake' : ''}${ended?.paid ? ' won' : ''}`);
  panel.append(head, meters, grid, say, keys);
  root.replaceChildren(panel);
}

/** A meter's number running from `from` to `to`. */
function countUp(b, from, to) {
  const t0 = performance.now(), ms = calmFx() ? 0 : 700;
  const step = (now) => {
    const k = ms ? Math.min(1, (now - t0) / ms) : 1;
    b.textContent = `${Math.round(from + (to - from) * k)}/${VOLTORB_CAP}`;
    if (k < 1 && b.isConnected) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function meter(label, value) {
  const m = el('div', 'vf-meter');
  m.append(el('span', '', label), el('b', '', value));
  return m;
}

function button(text, cls, fn) {
  const b = el('button', `vf-key ${cls}`, text);
  b.type = 'button';
  b.addEventListener('click', fn);
  return b;
}

function tile(i) {
  const mine = (ended ? ended.flipped : state.flipped).includes(i), up = mine || !!ended;
  const t = el('button', `vf-tile${up ? ' up' : ''}${up && !mine ? ' shown' : ''}${ended?.boom === i ? ' boom' : ''}${just === i ? ' just' : ''}`);
  t.type = 'button';
  if (up && !mine) t.style.animationDelay = `${300 + (Math.floor(i / SIZE) + i % SIZE) * 45}ms`;   // the rest turn over in a wave
  if (up) {
    if (ended?.boom === i && just === i) t.append(el('span', 'vf-blast'));
    if (board[i] === 0) t.append(voltorbIcon());
    else t.append(el('span', `vf-n n${board[i]}`, String(board[i])));
    t.setAttribute('aria-label', board[i] === 0 ? 'Voltorb' : String(board[i]));
    t.disabled = true;
  } else {
    if (marks.has(i)) t.append(voltorbIcon('memo'));
    t.setAttribute('aria-label', marks.has(i) ? 'Face down, marked as a Voltorb' : 'Face down');
    t.addEventListener('click', () => flip(i));
  }
  return t;
}

function clue({ sum, bombs }, k) {
  const c = el('div', 'vf-clue');
  c.style.setProperty('--line', LINE_COLOURS[k]);
  c.append(el('b', '', String(sum).padStart(2, '0')));
  const b = el('span', 'vf-bombs');
  b.append(voltorbIcon('small'), String(bombs));
  c.append(b);
  c.setAttribute('aria-label', `Total ${sum}, ${bombs} Voltorbs`);
  return c;
}

function flip(i) {
  if (ended || state.flipped.includes(i)) return;
  just = -1;
  if (memo) { marks.has(i) ? marks.delete(i) : marks.add(i); playSound('select'); return render(); }
  const flips = state.flipped.length;
  just = i;
  state.flipped.push(i);
  marks.delete(i);
  if (board[i] === 0) {
    playSound('thunder', 'hit-super');
    navigator.vibrate?.(120);
    return endRound({ won: false, flips, boom: i, points: 0,
      line: `Oh no! A Voltorb went off. ${flips ? `You flipped ${flips} tile${flips > 1 ? 's' : ''}, so ` : ''}next round is Lv. ${nextLevel(state.level, { won: false, flips })}.` });
  }
  playSound(board[i] > 1 ? `plink-${board[i] - 1}` : 'card', 'card');
  if (cleared(board, state.flipped)) {
    const points = score(board, state.flipped);
    return endRound({ won: true, points, line: null });
  }
  keep();
  render();
}

function quitRound() {
  if (ended || !state.flipped.length) return;
  const flips = state.flipped.length;
  endRound({ won: false, quit: true, flips, points: score(board, state.flipped), line: null });
}

/** Pays the round, moves the saved record on to the next one, and holds this board face up until Next. */
function endRound({ won, quit, flips, boom, points, line }) {
  const paid = payGame(payout(points)), level = state.level, flipped = state.flipped;
  const next = nextLevel(level, { won, flips });
  state = { ...state, round: state.round + 1, level: next, flipped: [] };
  keep();
  if (paid) playSound('coins', 'buy');
  const left = potWon() >= VOLTORB_CAP ? ' That\'s the most for today!' : '';
  ended = { level, points, paid, boom, flipped, fresh: true,
    line: line ?? (won ? `Board cleared! ${points.toLocaleString()} points: ${paid} PokéCoins.${left} On to Lv. ${next}.`
      : `You took ${paid} PokéCoins.${left}${next < level ? ` Next round is Lv. ${next}.` : ''}`) };
  refreshCoins();
  render();
}

function next() {
  playSound('confirm');
  board = voltorbBoard(state.day, state.round, state.level);
  ended = null; marks = new Set(); memo = false; just = -1;
  render();
}
