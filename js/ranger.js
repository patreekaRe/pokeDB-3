/* ranger.js  -  the Ranger Task Board (2026-10-16, the user's ask: a board in the Safari Outfitter that tracks
   things for players, a tracker per task and a claim, "cool and immersive when they pull it up"). The tasks are
   js/data/ranger.js's; this file logs the catches they count, pays a claim and shows the board: a cork board in a
   bamboo frame, pinned paper notes with a Polaroid of the Pokémon (a silhouette till it's caught) or the ball, a
   paw-print trail for the progress and the reward; a ready note wiggles on its pin and its CLAIM stamps it. Opened
   from the board on the Outfitter's wall (js/mall-outfitter.js) and the Safari lobby's Tasks key (js/safariprep.js). */

import { getSave, updateSave, awardCoins } from './storage.js';
import { playSound } from './audio.js';
import { calmFx } from './prefs.js';
import { refreshCoins } from './ui.js';
import { checkBadges } from './progress.js';
import { showBadgeNews } from './trainercard.js';
import { ENEMY_DEFS } from './data/enemies.js';
import { BALLS } from './data/balls.js';
import { TABS, progressOf, readyTasks, rankOf, rewardText, logCatch, logDay, logWeekCatch, logWeekTick, logWeekDay, expeditionWeek, tasksOn, taskById } from './data/ranger.js';

/* ---------- counting ---------- */

/** The lasting log and this week's tally (the Expeditions'), each moved on by its own step. */
const logged = (fn, weekly) => updateSave(d => {
  const week = expeditionWeek();
  d.ranger = { claimed: [], ...d.ranger, log: fn(d.ranger?.log || {}), week: weekly(d.ranger?.week, week) };
});

/** A Safari catch, as the rewards are collected (a refresh replays the fight, so never as it ends). */
export const rangerCatch = (info) => logged(l => logCatch(l, info), (w, week) => logWeekCatch(w, week, info));

/** A Safari area's boss beaten, or the whole Safari crossed. */
export const rangerTick = (key) => logged(l => ({ ...l, [key]: (l[key] || 0) + 1 }), (w, week) => logWeekTick(w, week, key));

/** A Safari day begun, for the days-in-a-row streak and the week's days. */
export const rangerDay = (day) => logged(l => logDay(l, day), (w, week) => logWeekDay(w, week, day));

/** How many tasks wait to be claimed: the board's "!". */
export const rangerReady = (save = getSave()) => readyTasks(save).length;

/** Pays a done task once. Returns its reward, or null. */
function claim(id) {
  const task = taskById(id), save = getSave(), p = task && progressOf(task, save);
  if (!p?.done || p.claimed) return null;
  updateSave(d => { d.ranger = { log: {}, ...d.ranger, claimed: [...(d.ranger?.claimed || []), id] }; });
  const r = task.reward;
  if (r.coins) return { ...r, paid: awardCoins(r.coins) };
  if (r.balls) updateSave(d => { d.balls[r.balls[0]] = (d.balls[r.balls[0]] || 0) + r.balls[1]; });
  return r;
}

/* ---------- the board ---------- */

const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
const ballSprite = (id) => `assets/items/${BALLS.find(b => b.id === id)?.sprite ?? `${id}-ball`}.png`;
let dlg = null, tab = 'expeditions', onDone = null;

function rewardIcon(r) {
  const i = el('span', 'rb-reward-ico');
  if (r.balls) { const img = el('img', 'pixel'); img.src = ballSprite(r.balls[0]); img.alt = ''; i.append(img); }
  else i.textContent = r.coins ? '🪙' : r.slots ? '🏡' : '🪑';
  return i;
}

/** A task's note: pinned, a little crooked, its photo, words, trail and reward; done notes wiggle with a CLAIM stamp,
    claimed ones fade under a RANGER stamp. */
function note(task, save, i) {
  const p = progressOf(task, save), n = el('article', `rb-note${p.done && !p.claimed ? ' ready' : ''}${p.claimed ? ' claimed' : ''}`);
  n.style.setProperty('--tilt', `${((i * 37) % 7) - 3}deg`);
  n.style.setProperty('--pin', ['#d84838', '#3a74e0', '#f8c838', '#58a848'][i % 4]);
  n.append(el('span', 'rb-pin'));
  const pic = task.pic(save), shot = el('div', 'rb-photo');
  const img = el('img', 'pixel');
  img.alt = ''; img.loading = 'lazy';
  if (pic.ball) { img.src = ballSprite(pic.ball); shot.classList.add('ball'); }
  else { img.src = ENEMY_DEFS[pic.mon]?.image ?? ''; if (!pic.seen) shot.classList.add('unseen'); }
  shot.append(img);
  const body = el('div', 'rb-body');
  if (task.tier) body.append(el('span', `rb-tier ${task.tier}`, task.tier === 'bonus' ? 'BONUS' : task.tier.toUpperCase()));
  body.append(el('h3', 'rb-title', task.title), el('p', 'rb-text', task.text));
  const trail = el('div', 'rb-trail'), steps = 10, lit = Math.floor(p.n / p.goal * steps);
  for (let k = 0; k < steps; k++) trail.append(el('span', `rb-paw${k < lit ? ' on' : ''}`, '🐾'));
  trail.append(el('b', 'rb-count', `${p.n.toLocaleString()} / ${p.goal.toLocaleString()}`));
  const reward = el('p', 'rb-reward');
  reward.append(rewardIcon(task.reward), el('span', null, rewardText(task.reward)));
  body.append(trail, reward);
  n.append(shot, body);
  if (p.claimed) n.append(el('span', 'rb-stamp done', 'RANGER ✓'));
  else if (p.done) {
    const b = el('button', 'rb-claim', 'CLAIM');
    b.type = 'button';
    b.addEventListener('click', (e) => { e.stopPropagation(); claimNote(task, n); });
    n.append(b);
  }
  return n;
}

/** Time left till the next Monday, UTC, when the week's expeditions change: "3d 4h", or "5h 12m" on the last day. */
function untilWeek(now = Date.now()) {
  const next = Date.parse(`${expeditionWeek(new Date(now))}T00:00:00Z`) + 7 * 86400000, min = Math.max(0, Math.floor((next - now) / 60000));
  const d = Math.floor(min / 1440), h = Math.floor(min / 60) % 24, m = min % 60;
  return d ? `${d}d ${h}h` : `${h}h ${m}m`;
}

/** Ready first, then nearest to done, claimed last. */
const order = (save) => (a, b) => {
  const pa = progressOf(a, save), pb = progressOf(b, save);
  const rank = (p) => (p.claimed ? 2 : p.done ? 0 : 1);
  return rank(pa) - rank(pb) || pb.n / pb.goal - pa.n / pa.goal;
};

function render() {
  const save = getSave(), { n, rank, next, level } = rankOf(save);
  const head = dlg.querySelector('.rb-rank');
  head.querySelector('.rb-rank-name').textContent = rank.name;
  head.querySelector('.rb-rank-lv').textContent = `RANK ${level}`;
  head.querySelector('.rb-rank-next').textContent = next ? `${n} / ${next.at} tasks to ${next.name}` : `All ${n} tasks claimed`;
  head.querySelector('.rb-rank-bar i').style.width = `${next ? Math.round((n - rank.at) / (next.at - rank.at) * 100) : 100}%`;
  for (const t of TABS) {
    const tasks = tasksOn(t.id), b = dlg.querySelector(`[data-tab="${t.id}"]`);
    const ready = tasks.filter(x => progressOf(x, save).done && !progressOf(x, save).claimed).length, done = tasks.filter(x => progressOf(x, save).claimed).length;
    b.classList.toggle('on', t.id === tab);
    b.setAttribute('aria-selected', String(t.id === tab));
    b.querySelector('.rb-tab-n').textContent = `${done}/${tasks.length}`;
    b.querySelector('.rb-tab-ready').textContent = ready || '';
    b.querySelector('.rb-tab-ready').hidden = !ready;
  }
  const list = dlg.querySelector('.rb-notes');
  const notes = tasksOn(tab), week = dlg.querySelector('.rb-week');
  // the Expeditions keep their order (easy, medium, hard, then the bonus) under the week's banner
  list.replaceChildren(...(tab === 'expeditions' ? notes : notes.sort(order(save))).map((t, i) => note(t, save, i)));
  week.hidden = tab !== 'expeditions';
  if (!week.hidden) week.querySelector('span').textContent = `New expeditions in ${untilWeek()}`;
  dlg.querySelector('.rb-coins b').textContent = (save.coins ?? 0).toLocaleString();
}

/** The claim: the note's stamp slams down, the reward slides out of an envelope, then the board redraws. */
async function claimNote(task, n) {
  const r = claim(task.id);
  if (!r) return;
  const calm = calmFx();
  playSound('buy');
  const stamp = el('span', `rb-stamp done${calm ? '' : ' slam'}`, 'RANGER ✓');
  n.querySelector('.rb-claim')?.remove();
  n.classList.remove('ready');
  n.append(stamp);
  const before = rankOf({ ranger: { claimed: (getSave().ranger.claimed || []).slice(0, -1) } }).rank.name, after = rankOf(getSave()).rank.name;
  const toast = dlg.querySelector('.rb-toast');
  const badges = checkBadges();   // a rank up earns its Ranger badge, shown on the Trainer Card
  if (badges.length) showBadgeNews();
  toast.replaceChildren(rewardIcon(r), el('span', null, `${r.coins ? `+${r.paid.toLocaleString()} PokéCoins` : rewardText(r)}${after !== before ? `  ·  Rank up: ${after}!` : ''}${badges.length ? `  ·  ${badges.map(b => b.name).join(', ')}!` : ''}`));
  toast.hidden = false;
  toast.classList.remove('in'); void toast.offsetWidth; toast.classList.add('in');
  if (after !== before) playSound('achievement');
  refreshCoins();
  clearTimeout(claimNote.t);
  claimNote.t = setTimeout(() => { toast.hidden = true; }, 3200);
  await new Promise(res => setTimeout(res, calm ? 150 : 650));
  if (dlg?.open) render();
}

function build() {
  dlg = el('dialog', 'ranger-board');
  dlg.setAttribute('aria-label', 'Ranger Task Board');
  dlg.innerHTML = `
    <div class="rb-frame">
      <header class="rb-head">
        <div class="rb-plaque"><span class="rb-plaque-ball" aria-hidden="true"></span><h2>RANGER TASK BOARD</h2></div>
        <button type="button" class="rb-close" aria-label="Close">✕</button>
      </header>
      <div class="rb-rank"><span class="rb-badge" aria-hidden="true">★</span><div><span class="rb-rank-lv"></span><b class="rb-rank-name"></b>
        <span class="rb-rank-bar"><i></i></span><small class="rb-rank-next"></small></div><span class="rb-coins">🪙 <b></b></span></div>
      <nav class="rb-tabs" role="tablist">${TABS.map(t => `<button type="button" role="tab" class="rb-tab" data-tab="${t.id}"><span>${t.icon}</span> ${t.name} <small class="rb-tab-n"></small><em class="rb-tab-ready" hidden></em></button>`).join('')}</nav>
      <div class="rb-cork"><p class="rb-week" hidden><b>THIS WEEK'S EXPEDITIONS</b><span></span></p><div class="rb-notes"></div></div>
      <p class="rb-toast" hidden></p>
    </div>`;
  document.body.append(dlg);
  dlg.querySelector('.rb-close').addEventListener('click', () => close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
  for (const b of dlg.querySelectorAll('.rb-tab')) b.addEventListener('click', () => { if (tab === b.dataset.tab) return; tab = b.dataset.tab; playSound('confirm'); render(); dlg.querySelector('.rb-cork').scrollTop = 0; });
}

function close() {
  if (!dlg?.open) return;
  playSound('cancel');
  dlg.close();
  const done = onDone;
  onDone = null;
  done?.();
}

/** The board, over whatever's on screen. `done` runs as it closes. Opens on the tab with something to claim, if any. */
export function openRangerBoard(done = null) {
  if (!dlg) build();
  onDone = done;
  const ready = readyTasks(getSave());
  if (ready.length && !ready.some(t => t.tab === tab)) tab = ready[0].tab;
  render();
  dlg.classList.toggle('calm', calmFx());
  dlg.showModal();
  dlg.querySelector('.rb-cork').scrollTop = 0;
  playSound('confirm');
}

