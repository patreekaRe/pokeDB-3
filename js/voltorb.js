/* voltorb.js  -  Voltorb Flip, the Game Corner's game (the revamp, 2026-10-10): HGSS's board over whatever is showing,
   its rules in js/data/corner.js. Free to play; a won or quit round pays coins from its score, up to the day's cap.
   The round in play is saved (`save.corner.voltorb`), so a refresh comes back to the same board and flips. A Memo key
   marks tiles you think are Voltorbs (not saved). */

import {
  SIZE, VOLTORB_CAP, voltorbBoard, clues, score, cleared, paysToday, nextLevel, freshVoltorb,
} from './data/corner.js';
import { safariDay } from './data/safari.js';
import { getSave, updateSave } from './storage.js';
import { playSound, preloadSounds } from './audio.js';
import { el, refreshCoins } from './ui.js';

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
  const won = state.won, points = ended ? ended.points : score(board, state.flipped);
  const pays = ended ? ended.paid : paysToday(points, won);
  const head = el('div', 'vf-head');
  head.append(el('strong', 'vf-title', 'VOLTORB FLIP'), el('span', 'vf-lv', `Lv. ${ended ? ended.level : state.level}`));
  const meters = el('div', 'vf-meters');
  meters.append(
    meter('Score', points.toLocaleString()),
    meter('Pays', won >= VOLTORB_CAP && !ended ? 'For fun' : `${pays} 💰`),
    meter('Today', `${Math.min(won, VOLTORB_CAP)}/${VOLTORB_CAP}`),
  );

  const c = clues(board), grid = el('div', 'vf-grid');
  for (let r = 0; r < SIZE; r++) {
    for (let col = 0; col < SIZE; col++) grid.append(tile(r * SIZE + col));
    grid.append(clue(c.rows[r], r));
  }
  for (let col = 0; col < SIZE; col++) grid.append(clue(c.cols[col], col));
  grid.append(el('span', 'vf-corner'));

  const say = el('p', 'vf-say', ended ? ended.line
    : won >= VOLTORB_CAP ? `You've won the most for today (${VOLTORB_CAP}). Play on for fun, new coins come tomorrow.`
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

  const panel = el('div', 'vf-panel');
  panel.append(head, meters, grid, say, keys);
  root.replaceChildren(panel);
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
  if (up) {
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
  const paid = paysToday(points, state.won), level = state.level, flipped = state.flipped;
  const next = nextLevel(level, { won, flips });
  state = { ...state, won: state.won + paid, round: state.round + 1, level: next, flipped: [] };
  updateSave(d => {
    d.coins += paid;
    d.stats.coinsEarned += paid;
    d.corner = { ...d.corner, voltorb: state };
  });
  if (paid) playSound('coins', 'buy');
  const left = state.won >= VOLTORB_CAP ? ' That\'s the most for today!' : '';
  ended = { level, points, paid, boom, flipped,
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
