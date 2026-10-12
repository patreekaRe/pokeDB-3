/* voltorb.js  -  Voltorb Flip, the Game Corner's game (the revamp, 2026-10-10): HGSS's board over whatever is showing,
   its rules in js/data/corner.js. Free to play; the day's first PLAYS.voltorb rounds pay coins from their score when won
   or quit, up to the caps, and after that it's played for fun.
   The round in play is saved (`save.corner.voltorb`), so a refresh comes back to the same board and flips. A Memo key
   marks tiles you think are Voltorbs (not saved). */

import {
  SIZE, DAILY_CAP, GAME_CAP, PLAYS, voltorbTickets, voltorbBoard, clues, score, cleared, payout, capPay, nextLevel, freshVoltorb,
} from './data/corner.js';
import { safariDay } from './data/safari.js';
import { getSave, updateSave } from './storage.js';
import { playSound, preloadSounds } from './audio.js';
import { el, refreshCoins } from './ui.js';
import { calmFx } from './prefs.js';
import { potWon, gameWon, payGame, stamp, earnTickets, record, tickets } from './corner-pot.js';
import { bestLine } from './casino-pot.js';

/** Does this round pay? The day's first PLAYS.voltorb do, while the caps allow. */
const roundPays = () => state.round < PLAYS.voltorb && capPay(1, potWon(), gameWon('voltorb')) > 0;
import { firstLook, helpKey, helpCard } from './corner-panel.js';

const LINE_COLOURS = ['#e07060', '#58b060', '#e8a040', '#4a90d8', '#b070d0'];

let help = false, root = null, just = -1, state = null, board = null, memo = false, marks = new Set(), ended = null, onClose = null;

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
  help = firstLook('voltorb');
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
  const won = potWon(), points = ended ? ended.points : score(board, state.flipped), paying = roundPays();
  const pays = ended ? ended.paid : paying ? capPay(payout(points), won, gameWon('voltorb')) : 0;
  const head = el('div', 'vf-head');
  head.append(el('strong', 'vf-title', 'VOLTORB FLIP'), el('span', 'vf-lv', `Lv. ${ended ? ended.level : state.level}`), helpKey(help, () => { help = !help; render(); }));
  if (help) {
    const panel = el('div', 'vf-panel');
    panel.append(head, helpCard(HELP, { picture: example(), done: () => { help = false; render(); } }));
    return root.replaceChildren(panel);
  }
  const meters = el('div', 'vf-meters');
  meters.append(
    meter('Score', points.toLocaleString()),
    !paying && !ended ? meter('Tickets', `🎟️${tickets().have}`) : meter('Pays', `${pays} 💰`),
    meter('Today', `${Math.min(won, DAILY_CAP)}/${DAILY_CAP}`),
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
    : !paying ? (won >= DAILY_CAP ? `The Game Corner has paid its ${DAILY_CAP} for today. Play on for prize tickets, new coins come tomorrow.`
      : gameWon('voltorb') >= GAME_CAP ? `Voltorb Flip has paid its ${GAME_CAP} for today. Play on for prize tickets, or try another game for coins.`
      : `Today's ${PLAYS.voltorb} paying rounds are done. Play on for prize tickets; your level carries over to tomorrow.`)
    : !state.flipped.length && state.round === 0 ? `You get ${PLAYS.voltorb} paying rounds a day. Flip the tiles: each one multiplies your score. The numbers say each line\'s total and how many Voltorbs hide in it.`
    : state.flipped.length ? 'Flip every 2 and 3 to clear the board. Or quit and take what you have.'
    : 'Flip the tiles: each one multiplies your score. The numbers say each line\'s total and how many Voltorbs hide in it.');

  const keys = el('div', 'vf-keys');
  if (ended) keys.append(button('Next round', 'vf-go', next));
  else {
    const m = button(memo ? 'Memo: on' : 'Memo', `vf-memo${memo ? ' on' : ''}`, () => { memo = !memo; playSound('select'); render(); });
    m.setAttribute('aria-pressed', String(memo));
    const quit = button(state.flipped.length && paying ? `Quit · take ${pays}` : 'Quit', 'vf-quit', quitRound);
    quit.disabled = !state.flipped.length;
    keys.append(m, quit);
  }
  keys.append(button('Close', 'vf-close', shut));

  const panel = el('div', `vf-panel${ended?.boom != null && just === ended.boom && !calmFx() ? ' shake' : ''}${ended?.paid ? ' won' : ''}`);
  panel.append(head, meters, grid, say, bestLine(['voltorbLevel', 'voltorbScore']), keys);
  root.replaceChildren(panel);
}

const HELP = [
  ['Every tile hides a 1, 2, 3 or a Voltorb.', 'Flip one with a tap.'],
  ['The number beside each row and under each column', 'is all of that line\'s numbers added up.'],
  ['The Voltorb number under it', 'is how many Voltorbs hide in that line.'],
  ['Your score is multiplied by each tile you flip.', '1s keep it, 2s double it, 3s triple it.'],
  ['Find every 2 and 3 to clear the board.', 'Flip a Voltorb and the round\'s score is gone, so you can Quit any time and take your coins.'],
  [`${PLAYS.voltorb} rounds a day pay PokéCoins;`, 'after that, rounds earn prize tickets for Meowth\'s prize counter. Your level carries over to the next day.'],
  ['Tips:', 'a line with 0 Voltorbs is safe to flip. A line whose total is low with lots of Voltorbs is only 1s and Voltorbs, so leave it. Memo marks tiles you think are Voltorbs.'],
];

/** One row worked out: five tiles face up and their clue, with what each number means. */
function example() {
  const box = el('div', 'vf-example');
  const row = el('div', 'vf-ex-row');
  for (const v of [1, 0, 3, 1, 2]) {
    const t = el('span', 'vf-tile up');
    t.append(v ? el('span', `vf-n n${v}`, String(v)) : voltorbIcon());
    row.append(t);
  }
  row.append(clue({ sum: 7, bombs: 1 }, 0));
  const notes = el('div', 'vf-ex-notes');
  notes.append(el('p', '', '1 + 3 + 1 + 2 = 07, the top number'), el('p', '', 'one Voltorb in the row, the bottom number'));
  box.append(row, notes);
  return box;
}

/** A meter's number running from `from` to `to`. */
function countUp(b, from, to) {
  const t0 = performance.now(), ms = calmFx() ? 0 : 700;
  const step = (now) => {
    const k = ms ? Math.min(1, (now - t0) / ms) : 1;
    b.textContent = `${Math.round(from + (to - from) * k)}/${DAILY_CAP}`;
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
  stamp('voltorb');
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
  const paying = roundPays(), paid = paying ? payGame(payout(points), 'voltorb') : 0, level = state.level, flipped = state.flipped;
  const got = paying ? 0 : earnTickets(voltorbTickets(points));
  const next = nextLevel(level, { won, flips });
  state = { ...state, round: state.round + 1, level: next, flipped: [] };
  keep();
  if (paid) playSound('coins', 'buy');
  const left = paying && !roundPays() ? (state.round >= PLAYS.voltorb ? ' That was today\'s last paying round.' : ' That\'s the most for today!') : '';
  const took = paying ? `${paid} PokéCoins` : `${got} prize ticket${got === 1 ? '' : 's'}`;
  record('voltorbLevel', Math.max(level, next));
  if (points) record('voltorbScore', points);
  ended = { level, points, paid, boom, flipped, fresh: true,
    line: line ?? (won ? `Board cleared! ${points.toLocaleString()} points: ${took}.${left} On to Lv. ${next}.`
      : `You took ${took}.${left}${next < level ? ` Next round is Lv. ${next}.` : ''}`) };
  refreshCoins();
  render();
}

function next() {
  playSound('confirm');
  board = voltorbBoard(state.day, state.round, state.level);
  ended = null; marks = new Set(); memo = false; just = -1;
  render();
}
