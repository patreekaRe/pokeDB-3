/* memory.js  -  Memory Match, a Game Corner game (2026-10-10): sixteen face-down cards, eight Pokémon twice. Turn two;
   a pair stays up, anything else turns back. Free; a cleared board pays memoryPay() for its misses into the games' shared
   pot (js/corner-pot.js). Boards come from the day's seed (memoryBoard()), and the pairs found and misses so far are
   saved (`save.corner.memory`), so a refresh can't wipe the misses. */

import { MEMORY_PAIRS, GAMES_CAP, memoryBoard, memoryPay } from './data/corner.js';
import { safariDay } from './data/safari.js';
import { getSave, updateSave } from './storage.js';
import { playSound, preloadSounds, playCry } from './audio.js';
import { el } from './ui.js';
import { openPanel, key, monPool, spriteOf } from './corner-panel.js';
import { potWon, payGame } from './corner-pot.js';

let panel = null, names = null, board = null, st = null, open = [], done = null, wait = false;

function load() {
  const day = safariDay(), s = getSave().corner?.memory;
  st = s?.day === day ? { ...s, found: [...s.found] } : { day, round: 0, found: [], misses: 0 };
  board = memoryBoard(st.day, st.round, [...names.keys()]);
}
const keep = () => updateSave(d => { d.corner = { ...d.corner, memory: st }; });

export async function openMemory(onClose) {
  names ??= await monPool();
  preloadSounds('card', 'select', 'stat-up', 'coins');
  load();
  open = []; done = null; wait = false;
  panel = openPanel('mm', 'Memory Match', { onClose, busy: () => wait });
  render();
}

function render() {
  const head = el('div', 'vf-head');
  head.append(el('strong', 'vf-title', 'MEMORY MATCH'), el('span', 'vf-lv', `${st.found.length}/${MEMORY_PAIRS} pairs`));
  const meters = el('div', 'vf-meters');
  for (const [k, v] of [['Misses', `${done ? done.misses : st.misses}`], ['Pays', `${done ? done.paid : memoryPay(st.misses)} 💰`], ['Today', `${Math.min(potWon(), GAMES_CAP)}/${GAMES_CAP}`]]) {
    const m = el('div', 'vf-meter'); m.append(el('span', '', k), el('b', '', v)); meters.append(m);
  }
  const grid = el('div', 'mm-grid');
  board.forEach((id, i) => {
    const up = done || open.includes(i) || st.found.includes(id);
    const c = el('button', `mm-card${up ? ' up' : ''}${st.found.includes(id) ? ' found' : ''}`);
    c.type = 'button';
    c.setAttribute('aria-label', up ? names.get(id) : 'Face down');
    const face = el('span', 'mm-face'), img = el('img', 'pixel');
    img.src = spriteOf(id); img.alt = '';
    face.append(img);
    c.append(el('span', 'mm-back'), face);
    if (!up) c.addEventListener('click', () => flip(i));
    grid.append(c);
  });
  const say = el('p', 'vf-say', done ? done.line : 'Turn two cards. A pair stays up; clear the board with as few misses as you can.');
  const keys = el('div', 'vf-keys');
  if (done) keys.append(key('Next board', 'vf-go', nextBoard));
  keys.append(key('Close', 'vf-close', () => { if (!wait) panel.shut(); }));
  const box = el('div', 'vf-panel mm-panel');
  box.append(head, meters, grid, say, keys);
  panel.root.replaceChildren(box);
}

function flip(i) {
  if (wait || done || open.includes(i)) return;
  open.push(i);
  playSound('card', 'select');
  if (open.length < 2) return render();
  const [a, b] = open.map(k => board[k]);
  if (a === b) {
    st.found.push(a);
    open = [];
    playCry(a);
    playSound('stat-up', 'select');
    if (st.found.length === MEMORY_PAIRS) finish();
    else keep();
    return render();
  }
  st.misses += 1;
  keep();
  wait = true;
  render();
  setTimeout(() => {
    wait = false; open = [];
    if (panel?.root.isConnected) render();
  }, 850);
}

function finish() {
  const misses = st.misses, paid = payGame(memoryPay(misses));
  st = { ...st, round: st.round + 1, found: [], misses: 0 };
  keep();
  if (paid) setTimeout(() => playSound('coins', 'buy'), 500);
  done = { misses, paid, line: `Board cleared with ${misses} miss${misses === 1 ? '' : 'es'}! ${paid ? `${paid} PokéCoins.` : 'The games have paid the most for today: this one was for fun.'}` };
}

function nextBoard() {
  playSound('confirm');
  board = memoryBoard(st.day, st.round, [...names.keys()]);
  done = null; open = [];
  render();
}
