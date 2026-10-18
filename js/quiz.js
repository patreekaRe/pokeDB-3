/* quiz.js  -  Who's That Pokémon?, a Game Corner game (2026-10-10; slimmed to one round of five a UTC day 2026-10-11,
   the user's pick): a silhouette and four names, from every Pokémon in the game. Free; a round pays quizPay() into the games' shared pot (js/corner-pot.js). The day's rounds come
   from its seed (js/data/corner.js's quizRound()), and where you are in one is saved (`save.corner.quiz`), so a refresh
   never deals a question again. */

import { QUIZ_LEN, DAILY_CAP, quizRound, quizPay } from './data/corner.js';
import { safariDay } from './data/safari.js';
import { getSave, updateSave } from './storage.js';
import { playSound, preloadSounds, playCry } from './audio.js';
import { el, rayWheel } from './ui.js';
import { openPanel, key, monPool, spriteOf } from './corner-panel.js';
import { potWon, payGame, stamp, record, atHome, best } from './corner-pot.js';
import { bestLine } from './casino-pot.js';

// painted once and moved into each render's stage (a conic gradient there was a 3x layer, see rayWheel() in js/ui.js)
let rays = null;
const burst = () => (rays ??= rayWheel('qz-burst', 'rgba(255, 255, 255, 0.35)', { solid: 1, fade: 1, deg: 10 }));

let panel = null, names = null, round = null, st = null, picked = null, done = null, cur = 0;   // cur: the question on show

function load() {
  const day = safariDay(), s = getSave().corner?.quiz;
  st = s?.day === day ? { ...s } : { day, round: 0, q: 0, right: 0 };
  round = quizRound(st.day, st.round, [...names.keys()]);
  cur = st.q;
}
const keep = () => updateSave(d => { d.corner = { ...d.corner, quiz: st }; });

export async function openQuiz(onClose) {
  names ??= await monPool();
  preloadSounds('select', 'cancel', 'coins', 'stat-up');
  if (atHome()) return openEndless(onClose);
  load();
  picked = null; done = st.round >= 1 ? { ...st.last, line: `Today's round is done: ${st.last?.right ?? 0}/${QUIZ_LEN}. A new one tomorrow, meow!` } : null;
  panel = openPanel('qz', "Who's That Pokémon?", { onClose });
  render();
}

function render() {
  const head = el('div', 'vf-head');
  head.append(el('strong', 'vf-title', "WHO'S THAT POKéMON?"), el('span', 'vf-lv', done ? 'Done!' : `${cur + 1}/${QUIZ_LEN}`));
  const meters = el('div', 'vf-meters');
  const right = (done ?? ended)?.right ?? st.right;
  for (const [k, v] of [['Right', `${right}`], ['Pays', `${done ? done.paid : quizPay(right)} 💰`], ['Today', `${Math.min(potWon(), DAILY_CAP)}/${DAILY_CAP}`]]) {
    const m = el('div', 'vf-meter'); m.append(el('span', '', k), el('b', '', v)); meters.append(m);
  }
  const keys = el('div', 'vf-keys');
  const body = [];
  if (done) {
    body.push(el('p', 'vf-say', done.line));
  } else {
    const q = round[cur];
    const stage = el('div', `qz-stage${picked ? ' shown' : ''}`);
    const img = el('img', 'pixel qz-mon');
    img.src = spriteOf(q.answer); img.alt = picked ? names.get(q.answer) : 'A Pokémon in silhouette';
    stage.append(burst(), img);
    if (picked) stage.append(el('span', 'qz-name', `It's ${names.get(q.answer)}!`));
    const opts = el('div', 'qz-opts');
    for (const id of q.options) {
      const b = key(names.get(id), `qz-opt${picked ? (id === q.answer ? ' right' : id === picked ? ' wrong' : ' dim') : ''}`, () => answer(id));
      b.disabled = !!picked;
      opts.append(b);
    }
    body.push(stage, opts);
  }
  keys.append(key('Close', 'vf-close', () => panel.shut()));
  const box = el('div', 'vf-panel qz-panel');
  box.append(head, meters, ...body, bestLine(['quizPerfect']), keys);
  panel.root.replaceChildren(box);
}

let ended = null;   // the round just finished, shown once the last answer's reveal is over

function answer(id) {
  stamp('quiz');
  if (picked || done) return;
  const q = round[cur];
  picked = id;
  const ok = id === q.answer;
  if (ok) st.right += 1;
  st.q += 1;
  if (st.q >= QUIZ_LEN) ended = finish(); else keep();
  playSound(ok ? 'stat-up' : 'cancel', 'select');
  playCry(q.answer);
  render();
  setTimeout(() => {
    if (!panel?.root.isConnected) return;
    picked = null;
    if (ended) { done = ended; ended = null; if (done.paid) playSound('coins', 'buy'); }
    else cur = st.q;
    render();
  }, 1500);
}

/** The round's end: paid, and the record moved on to the next round. */
function finish() {
  const right = st.right, paid = payGame(quizPay(right), 'quiz');
  if (right === QUIZ_LEN) record('quizPerfect', 1, true);
  const result = { right, paid, line: `${right}/${QUIZ_LEN} right${right === QUIZ_LEN ? ', a perfect round' : ''}! ${paid ? `${paid} PokéCoins.` : potWon() >= DAILY_CAP ? 'The Game Corner has paid its most for today.' : 'No coins this time.'} A new round tomorrow.` };
  st = { ...st, round: st.round + 1, q: 0, right: 0, last: result };
  keep();
  return result;
}

/* ---------- endless, on a machine at home (2026-10-12, the user's ask): one Pokémon after another, never paying, a
   streak of right answers in a row and the best one kept (`quizStreak`). */

let streak = 0, q = null, said = '';

function question() {
  const ids = [...names.keys()], pick = () => ids[Math.floor(Math.random() * ids.length)];
  const answer = pick(), options = new Set([answer]);
  while (options.size < 4) options.add(pick());
  q = { answer, options: [...options].sort(() => Math.random() - 0.5) };
  picked = null;
}

function openEndless(onClose) {
  streak = 0; said = 'Free play on your own machine! How many can you get in a row?';
  question();
  panel = openPanel('qz', "Who's That Pokémon?", { onClose });
  renderEndless();
}

function renderEndless() {
  const head = el('div', 'vf-head');
  head.append(el('strong', 'vf-title', "WHO'S THAT POKéMON?"), el('span', 'vf-lv', 'At home'));
  const meters = el('div', 'vf-meters');
  for (const [k, v] of [['Streak', `${streak}`], ['Best', `${best('quizStreak')}`]]) {
    const m = el('div', 'vf-meter'); m.append(el('span', '', k), el('b', '', v)); meters.append(m);
  }
  const stage = el('div', `qz-stage${picked ? ' shown' : ''}`);
  const img = el('img', 'pixel qz-mon');
  img.src = spriteOf(q.answer); img.alt = picked ? names.get(q.answer) : 'A Pokémon in silhouette';
  stage.append(burst(), img);
  if (picked) stage.append(el('span', 'qz-name', `It's ${names.get(q.answer)}!`));
  const opts = el('div', 'qz-opts');
  for (const id of q.options) {
    const b = key(names.get(id), `qz-opt${picked ? (id === q.answer ? ' right' : id === picked ? ' wrong' : ' dim') : ''}`, () => answerEndless(id));
    b.disabled = !!picked;
    opts.append(b);
  }
  const keys = el('div', 'vf-keys');
  keys.append(key('Close', 'vf-close', () => panel.shut()));
  const box = el('div', 'vf-panel qz-panel');
  box.append(head, meters, stage, opts, el('p', 'vf-say', said), keys);
  panel.root.replaceChildren(box);
}

function answerEndless(id) {
  if (picked) return;
  picked = id;
  const ok = id === q.answer;
  if (ok) {
    streak += 1;
    const top = streak > best('quizStreak');
    record('quizStreak', streak);
    said = top && streak > 1 ? `${streak} in a row, a new best!` : `Right! ${streak} in a row.`;
  } else {
    said = streak ? `Not quite! Your streak ends at ${streak}.` : 'Not quite! Try the next one.';
    streak = 0;
  }
  playSound(ok ? 'stat-up' : 'cancel', 'select');
  playCry(q.answer);
  renderEndless();
  setTimeout(() => {
    if (!panel?.root.isConnected) return;
    question();
    renderEndless();
  }, 1500);
}
