/* ============================================================
   leaderboard.js  -  the Safari Zone's daily leaderboard (roadmap: Safari phase 5).

   The day's first try (run.safari.first) posts its result once, as
   safariBoard/<day>_<uid> in the cloud save's Firestore, when the run ends.
   The result waits on this device (POST_KEY) until it's posted: signed out,
   offline, or with no name yet, it goes up once you sign in or open the
   board (while its day is still within a day of today, as the rules allow).
   Nothing here may hold up the run: every Firebase call is caught, and with
   no config or no connection the board only says it's unavailable.
   ============================================================ */

import { cloudConfigured, cloudRemembered, cloudSession, onCloudSignIn, openCloud } from './cloud.js';
import { BOARD_COLLECTION, entryId, dayOffset, cleanName, buildEntry, checkEntry, rankBoards, formatTime, NAME_MAX,
  TOWER_COLLECTION, checkTowerEntry, rankTower, ARCADE_COLLECTION, ARCADE_GAMES, ARCADE_BY_ID, arcadeId, arcadeEntry, arcadeValue,
  checkArcadeEntry, rankArcade } from './data/leaderboard.js';
import { safariDay, safariDaily } from './data/safari.js';
import { towerWeek, weekOffset, towerWeekly } from './data/tower.js';
import { STARTERS, STARTERS_BY_ID, spriteUrl } from './data/starters.js';
import { $, el, openDialog, closeDialog, fitText } from './ui.js';
import { AUGMENTS, AUGMENTS_BY_ID } from './data/augments.js';
import { augIcon } from './augment-art.js';
import { playCry, playSound } from './audio.js';
import { getSave, updateSave } from './storage.js';
import { addTrainer, hasTrainer } from './trainers.js';

const POST_KEY = 'pokedb.safari.post';
const TOWER_POST_KEY = 'pokedb.tower.post';
const ARCADE_POST_KEY = 'pokedb.arcade.post';   // { [game]: a best waiting to go up }
const ARCADE_UP_KEY = 'pokedb.arcade.up';       // { [game]: { week, score } } the best already posted, so a lower one never asks
const NAME_KEY = 'pokedb.safari.name';   // where the nickname lived before the save took it (nameFor())
const FETCH_LIMIT = 1000;
const SAMPLE = new URLSearchParams(location.search).has('lbsample');   // playtest: made-up trainers on every board, nothing fetched or posted
const CACHE_MS = 60000;

const store = {
  get(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (err) { return null; } },
  set(key, value) {
    try { value == null ? localStorage.removeItem(key) : localStorage.setItem(key, JSON.stringify(value)); }
    catch (err) { /* blocked */ }
  },
};

/* The two boards: the Safari Zone's daily one and the Sky Pillar's weekly one (js/data/tower.js). Each posts its first
   try once, as <period>_<uid> in its own collection, the same way. */
const KINDS = {
  safari: {
    collection: BOARD_COLLECTION, postKey: POST_KEY, field: 'day', title: '🏆 Safari Leaderboard', tabs: ['Today', 'Yesterday'],
    now: () => safariDay(), offset: dayOffset, step: 1,
    check: (entry) => checkEntry(entry, safariDay()), rank: rankBoards,
    header: (day) => { const d = safariDaily(day); return `${day} · ${d.starter.line[0].name} · ${d.areas.map(a => a.name).join(' · ')}`; },
    mine: (e) => `Your try: ${e.won ? 'crossed the Safari Zone' : `fainted in area ${e.area}`} · ${e.turns} turn${e.turns === 1 ? '' : 's'} · ${formatTime(e.time)} · ${e.caught} caught${e.shinies ? ` · ✨ ${e.shinies} shiny` : ''}`,
    signin: 'Sign in to post your first try of the day.', period: 'today\'s',
  },
  tower: {
    collection: TOWER_COLLECTION, postKey: TOWER_POST_KEY, field: 'week', title: '🗼 Sky Pillar Leaderboard', tabs: ['This week', 'Last week'],
    now: () => towerWeek(), offset: (week, n) => weekOffset(week, n), step: 1,
    check: (entry) => checkTowerEntry(entry, towerWeek()), rank: rankTower,
    header: (week) => `Week of ${week} · ${towerWeekly(week).starter.line[0].name}`,
    mine: (e) => `Your climb: floor ${e.floor} · ${e.turns} turn${e.turns === 1 ? '' : 's'} · ${formatTime(e.time)}`,
    signin: 'Sign in to post your first climb of the week.', period: 'this week\'s',
  },
  arcade: {
    collection: ARCADE_COLLECTION, postKey: ARCADE_POST_KEY, field: 'week', title: '🕹️ Arcade Leaderboard', tabs: ['This week', 'Last week'],
    now: () => towerWeek(), offset: (week, n) => weekOffset(week, n), step: 1,
    rank: rankArcade,
    header: (week) => `Week of ${week} · your best score in each game`,
    mine: (list) => `Your bests: ${list.map(e => `${ARCADE_BY_ID[e.game]?.name ?? e.game} ${arcadeValue(e)}`).join(' · ')}`,
    signin: 'Sign in to post your best scores of the week.', period: 'this week\'s',
  },
};
let kind = 'safari';
const K = () => KINDS[kind];

let shown = 0;           // 0 today / this week, -1 the one before
const posting = new Map();   // per board: the post in flight
const cache = new Map(); // day -> { at, entries }
let resultLine = null;   // the result window's line, kept up to date while it posts

/** The arcade bests still waiting to go up, this week's or last week's. */
function arcadeWaiting() {
  const all = store.get(ARCADE_POST_KEY) || {}, now = towerWeek(), ok = [weekOffset(now, -1), now];
  const keep = Object.fromEntries(Object.entries(all).filter(([, e]) => ok.includes(e?.week)));
  if (Object.keys(keep).length !== Object.keys(all).length) store.set(ARCADE_POST_KEY, Object.keys(keep).length ? keep : null);
  return Object.values(keep);
}

/** The result still waiting to go up, if its day (or week) can still be posted. */
function pending(k = K()) {
  if (k === KINDS.arcade) return arcadeWaiting().length ? arcadeWaiting() : null;
  const p = store.get(k.postKey);
  if (!p?.[k.field]) return null;
  const now = k.now();
  if (![k.offset(now, -1), now].includes(p[k.field])) { store.set(k.postKey, null); return null; }
  return p;
}

/** The board only ever shows a nickname the player picked, never the sign-in's real name. It's in the save since
    2026-10-08 (the user's call), so it follows a cloud save to every device; a device's own old one moves in once, unless
    the save already has one. The old one stays on the device until a name is set here, in case a cloud save from before
    the move lands over the save without one. */
// every name is in capitals, as typed boxes show it (the user's call, 2026-10-11), so an old mixed-case save reads the same
const upper = (name) => cleanName(name).toUpperCase();
const nameFor = () => {
  const saved = upper(getSave().trainerName || '');
  if (saved) return saved;
  const old = upper(String(store.get(NAME_KEY) || ''));
  if (old) updateSave(d => { d.trainerName = old; });
  return old;
};
/** The Trainer Card's name: the leaderboard nickname the player picked, never the sign-in's real name. */
export const trainerName = () => nameFor() || 'TRAINER';
/** The picked nickname itself ('' if none), for Settings' name box. */
export const pickedName = () => nameFor();
/** Settings' name box: saves the nickname (an empty one goes back to "Trainer") and returns what was kept. */
export function setTrainerName(name) {
  const clean = upper(name);
  updateSave(d => { d.trainerName = clean; });
  store.set(NAME_KEY, null);   // so clearing it really goes back to "Trainer"
  return clean;
}
/** A suggestion for the name box: the sign-in's first name, only ever posted if the player keeps it. */
const suggestName = (user) => cleanName((user?.displayName || '').split(/\s+/)[0] || '');

function say(text) {
  if (resultLine) resultLine.textContent = `📮 ${text}`;
}

/** Posts the waiting arcade bests, each only if it beats the one up there: the last state, as post()'s. */
async function postArcade() {
  const waiting = arcadeWaiting();
  if (!waiting.length) return 'none';
  let s;
  try { s = await cloudSession(); } catch (err) { return 'offline'; }
  if (!s.user) return 'signin';
  const name = nameFor();
  if (!name) return 'name';
  let state = 'none';
  for (const best of waiting) {
    const drop = () => { const all = store.get(ARCADE_POST_KEY) || {}; if (all[best.game]?.score === best.score) { delete all[best.game]; store.set(ARCADE_POST_KEY, Object.keys(all).length ? all : null); } };
    const entry = arcadeEntry(best, s.user.uid, name);
    if (checkArcadeEntry(entry, towerWeek())) { drop(); state = 'stale'; continue; }
    const ref = s.F.doc(s.db, ARCADE_COLLECTION, arcadeId(entry.week, entry.game, entry.uid));
    try {
      const there = await s.F.getDoc(ref);
      if (there.exists() && there.data().score >= entry.score) { drop(); state = 'already'; continue; }
      await s.F.setDoc(ref, { ...entry, at: s.F.serverTimestamp() });
    } catch (err) {
      if (err?.code === 'permission-denied') { drop(); state = 'already'; continue; }
      return 'offline';
    }
    drop();
    store.set(ARCADE_UP_KEY, { ...(store.get(ARCADE_UP_KEY) || {}), [entry.game]: { week: entry.week, score: entry.score } });
    cache.delete(`${ARCADE_COLLECTION}/${entry.week}`);
    state = 'posted';
  }
  return state;
}

/** From the arcade cabinet's game over (js/arcade-kit.js): keeps a ranked game's score if it's the week's best yet and
    posts it. Resolves to a short line for the cabinet ('' when there's nothing to say); never throws. */
export async function postArcadeScore(game, score, starter) {
  try {
    if (!ARCADE_BY_ID[game] || !(score > 0) || !cloudConfigured()) return '';
    const week = towerWeek(), up = store.get(ARCADE_UP_KEY)?.[game], all = store.get(ARCADE_POST_KEY) || {};
    if ((up?.week === week && up.score >= score) || (all[game]?.week === week && all[game].score >= score)) return '';
    store.set(ARCADE_POST_KEY, { ...all, [game]: { week, game, score: Math.round(score), starter } });
    if (!cloudRemembered()) return 'Sign in to put it on the weekly leaderboard.';
    const state = await post(KINDS.arcade);
    return { posted: 'On this week\'s leaderboard!', name: 'Open the leaderboard (🏆) and pick a name to post it.', signin: 'Sign in to put it on the weekly leaderboard.', offline: 'Couldn\'t reach the leaderboard; it\'ll post next time.' }[state] || '';
  } catch (err) { return ''; }
}

/** Posts the waiting result: 'posted', 'already', 'signin', 'name', 'none', 'stale' or 'offline'. Never throws. */
async function post(k = K()) {
  if (k === KINDS.arcade) {
    if (!posting.has(k)) posting.set(k, postArcade());
    try { return await posting.get(k); } finally { posting.delete(k); }
  }
  if (posting.has(k)) return posting.get(k);
  posting.set(k, (async () => {
    const result = pending(k);
    if (!result) return 'none';
    let s;
    try { s = await cloudSession(); } catch (err) { return 'offline'; }
    if (!s.user) return 'signin';
    const name = nameFor();
    if (!name) return 'name';
    const entry = buildEntry(result, s.user.uid, name);
    if (k.check(entry)) { store.set(k.postKey, null); return 'stale'; }
    const ref = s.F.doc(s.db, k.collection, entryId(entry[k.field], entry.uid));
    try {
      if ((await s.F.getDoc(ref)).exists()) { store.set(k.postKey, null); return 'already'; }
      try { await s.F.setDoc(ref, { ...entry, at: s.F.serverTimestamp() }); } catch (err) {
        // the rules from before the shinies (until they're published again) refuse the key: it goes up without its ✨
        if (err?.code !== 'permission-denied' || !('shinies' in entry)) throw err;
        const { shinies, ...plain } = entry;
        await s.F.setDoc(ref, { ...plain, at: s.F.serverTimestamp() });
      }
    } catch (err) {
      if (err?.code === 'permission-denied') { store.set(k.postKey, null); return 'already'; }
      return 'offline';
    }
    store.set(k.postKey, null);
    cache.delete(`${k.collection}/${entry[k.field]}`);
    return 'posted';
  })());
  try { return await posting.get(k); } finally { posting.delete(k); }
}

const POST_TEXT = {
  posted: 'Posted to today\'s Safari leaderboard!',
  already: 'This day\'s result was already posted from this account.',
  signin: 'Sign in (the Pokédex\'s Settings, or the title\'s PC) to post this result. It waits on this device until tomorrow.',
  name: 'Open the Leaderboard and pick a name to post this result.',
  offline: 'Couldn\'t reach the leaderboard. The result waits on this device: open the Leaderboard to try again.',
  stale: 'This result is too old to post.',
};

/** From endRun(): keeps the first try's result and starts posting it. Returns the result window's line (or null). */
export const postSafariResult = (result) => postResult(KINDS.safari, result);
/** From endTower(): the week's first climb, the same way. */
export const postTowerResult = (result) => postResult(KINDS.tower, result);

function postResult(k, result) {
  try {
    if (!cloudConfigured()) return null;
    store.set(k.postKey, result);
    resultLine = el('li', 'board-line', '');
    const line = resultLine;
    const text = (state) => (k === KINDS.tower ? (POST_TEXT[state] || POST_TEXT.offline).replace('today\'s Safari leaderboard', 'this week\'s Sky Pillar leaderboard').replace('until tomorrow', 'until next week').replace('This day', 'This week') : POST_TEXT[state] || POST_TEXT.offline);
    if (!cloudRemembered()) { say(text('signin')); return line; }
    say(`Posting your result to ${k.period} leaderboard…`);
    post(k).then(state => { if (resultLine === line) say(text(state)); }).catch(() => {});
    return line;
  } catch (err) { return null; }
}

/* ---------- the window: an MMO-style ranking table (the user's call, 2026-10-18; it was the Pokédex's banners and a
   handheld, one trainer a screen). A banner names the board and its period, gold tabs switch the period, pills switch the
   board, then every ranked trainer is a row (top three in gold, silver, bronze) with your own row pinned at the bottom.
   A tap opens a row's details: all its numbers, a climb's augments by name, Add to Trainers. ---------- */

/* each board's banner colours and its line */
const LOOK = {
  fastest: { b1: '#5ad08a', b2: '#1e6a48', sub: 'The quickest crossing', col: 'Time' },
  turns: { b1: '#4ab8d8', b2: '#1a4a7a', sub: 'The fewest turns to cross', col: 'Turns' },
  caught: { b1: '#f0a040', b2: '#8a3a14', sub: 'The biggest haul', col: 'Caught' },
  floor: { b1: '#6aa8ff', b2: '#3a2a8a', sub: 'The furthest climb', col: 'Floor' },
  ...Object.fromEntries(ARCADE_GAMES.map(g => [g.id, { b1: g.b1, b2: g.b2, sub: `The week's best ${g.unit === 'pts' ? 'score' : g.unit === 'm' ? 'run' : g.unit}`, col: 'Score' }])),
};
const EMPTY = { fastest: 'Nobody has crossed yet.', turns: 'Nobody has crossed yet.', caught: 'Nobody has caught anything yet.', floor: 'Nobody has climbed yet.', ...Object.fromEntries(ARCADE_GAMES.map(g => [g.id, 'Nobody has played yet this week.'])) };
const MEDAL = ['', 'gold', 'silver', 'bronze'];
const ROW_AUGS = 6;   // a row's augment strip; the rest is "+N", all of them in its details

let host = null;     // where the board is mounted: the window's screen, or a lobby's app panel
let shelf = null;    // the mounted table
let topBox = null;   // the period tabs and any sign-in / name / posting lines
const pick = {};     // per kind: the board picked with the pills

function mon(e, cls) {
  const img = el('img', `pixel ${cls}`);
  const starter = STARTERS_BY_ID[e.starter];
  if (starter) img.src = spriteUrl(starter, 'front', 0);
  img.alt = '';
  img.draggable = false;
  return img;
}

/** One trainer's numbers, on an LCD. */
function facts(e) {
  const box = el('div', 'lb-facts');
  const fact = (k, v) => { const f = el('span', ''); f.append(el('b', '', k), el('span', '', v)); return f; };
  if (kind === 'arcade') box.append(fact('Game', ARCADE_BY_ID[e.game]?.name ?? e.game), fact('Score', arcadeValue(e)));
  else if (kind === 'tower') box.append(fact('Floor', `${e.floor}`), fact('Turns', `${e.turns}`), fact('Time', formatTime(e.time)));
  else box.append(fact('Result', e.won ? 'Crossed' : `Area ${e.area}`), fact('Turns', `${e.turns}`), fact('Time', formatTime(e.time)), fact('Caught', `${e.caught}`));
  if (kind === 'safari' && e.shinies > 0) box.append(fact('Shinies', `✨ ${e.shinies}`));
  const s = STARTERS_BY_ID[e.starter];
  if (s) box.append(fact('Pokémon', s.line[0].name));
  return box;
}

const augsOf = (e) => (e.augments || []).map(id => AUGMENTS_BY_ID[id]).filter(Boolean);

/** A climb's augments, in the order picked, each with its name (an entry posted before augments has none). */
function picks(e) {
  const augs = augsOf(e);
  if (kind !== 'tower' || !augs.length) return [];
  const box = el('div', 'lb-augs');
  box.append(el('b', '', `Augments (${augs.length})`));
  for (const a of augs) { const i = el('span', 'lb-aug'); i.append(augIcon(a), el('span', '', a.name)); box.append(i); }
  return [box];
}

/** A row's strip of augment icons. */
function augStrip(e) {
  const augs = augsOf(e);
  if (kind !== 'tower' || !augs.length) return [];
  const row = el('span', 'lb-aug-row');
  for (const a of augs.slice(0, ROW_AUGS)) { const i = augIcon(a); i.setAttribute('aria-label', a.name); row.append(i); }
  if (augs.length > ROW_AUGS) row.append(el('span', 'lb-aug-more', `+${augs.length - ROW_AUGS}`));
  return [row];
}

let me = null;   // the uid signed in when the board last loaded: anyone else's row offers Add to Trainers

/** A key that puts this trainer on your Trainers list (js/trainers.js), signed in only. */
function addKey(r) {
  const uid = r.entry.uid;
  if (!me || r.mine || !uid || uid === me) return [];
  const on = hasTrainer(uid);
  const b = el('button', `lb-btn lb-add${on ? ' on' : ''}`, on ? '✓ In your Trainers' : '+ Add to Trainers');
  b.type = 'button';
  b.disabled = on;
  b.addEventListener('click', (ev) => {
    ev.stopPropagation();
    const why = addTrainer(uid, me);
    playSound(why && why !== 'already' ? 'cancel' : 'confirm');
    b.textContent = why === 'full' ? 'Your Trainers list is full' : '✓ In your Trainers';
    b.disabled = true;
    b.classList.toggle('on', !why || why === 'already');
  });
  return [b];
}

/** A row's big number, in the board's own column. */
function value(id, e) {
  if (kind === 'arcade') return Number(e.score).toLocaleString();
  return id === 'floor' ? `F${e.floor}` : id === 'fastest' ? formatTime(e.time) : id === 'turns' ? `${e.turns}` : `${e.caught}`;
}

/** A row's second line: the numbers the big one leaves out. */
function subLine(id, e) {
  const t = (n) => `${n} turn${n === 1 ? '' : 's'}`;
  if (kind === 'arcade') return STARTERS_BY_ID[e.starter]?.line[0].name ?? '';
  if (kind === 'tower') return `${t(e.turns)} · ${formatTime(e.time)}`;
  if (id === 'fastest') return `${t(e.turns)} · ${e.caught} caught`;
  if (id === 'turns') return `${formatTime(e.time)} · ${e.caught} caught`;
  return e.won ? `Crossed · ${formatTime(e.time)}` : `Area ${e.area} · ${t(e.turns)}`;
}

/** Time left in the period on show, as "1d 07h" / "6h 12m" / "12m". */
function resetsIn(next) {
  const ms = Date.parse(`${next}T00:00:00Z`) - Date.now();
  if (!(ms > 0)) return '';
  const m = Math.floor(ms / 60000), d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), pad = (n) => String(n).padStart(2, '0');
  return d ? `${d}d ${pad(h)}h` : h ? `${h}h ${pad(m % 60)}m` : `${m % 60}m`;
}

function hero(b, day) {
  const look = LOOK[b?.id] ?? LOOK.floor;
  const box = el('div', 'lb-hero');
  box.style.setProperty('--b1', look.b1);
  box.style.setProperty('--b2', look.b2);
  box.append(el('strong', 'lb-hero-name', b?.name ?? K().title.replace(/^\S+ /, '')), el('span', 'lb-hero-line', K().header(day)));
  const next = kind === 'safari' ? dayOffset(day, 1) : weekOffset(day, 1);
  const left = shown === 0 ? resetsIn(next) : '';
  box.append(el('span', 'lb-hero-timer', left ? `⏳ Resets in ${left}` : 'Final standings'));
  const starter = kind === 'safari' ? safariDaily(day).starter : kind === 'tower' ? towerWeekly(day).starter : null;
  if (starter) box.append(mon({ starter: starter.id }, 'lb-hero-mon'));
  return box;
}

function pills(boards) {
  const box = el('div', `lb-pills${boards.length > 3 ? ' scroll' : ''}`);
  box.setAttribute('role', 'tablist');
  for (const b of boards) {
    const p = el('button', 'lb-pill', b.name);
    p.type = 'button';
    p.setAttribute('role', 'tab');
    p.setAttribute('aria-selected', String(b.id === pick[kind]));
    p.addEventListener('click', () => { if (pick[kind] !== b.id) { pick[kind] = b.id; playSound('select'); shelf?.redraw(); } });
    box.append(p);
  }
  return box;
}

function tableApp(boards, day) {
  let root = null, rows = null, opened = null;
  const board = () => boards.find(b => b.id === pick[kind]) ?? boards[0];

  function row(b, r, pinned) {
    const medal = MEDAL[r.rank] ?? '';
    const item = el('div', `lb-row${medal ? ` ${medal}` : ''}${r.mine ? ' mine' : ''}${pinned ? ' pinned' : ''}`);
    const head = el('button', 'lb-row-head');
    head.type = 'button';
    head.setAttribute('aria-expanded', 'false');
    const who = el('span', 'lb-who');
    const name = el('b', 'lb-name');
    if (r.mine) name.append(el('span', 'lb-you-tag', 'YOU'));
    if (r.rank === 1) name.append(el('span', 'lb-crown', '♛'));
    name.append(r.entry.name);
    if (kind === 'safari' && r.entry.shinies > 0) {   // caught a wild shiny on that try
      const mark = el('span', 'lb-shiny', r.entry.shinies > 1 ? `✨${r.entry.shinies}` : '✨');
      mark.title = `Caught ${r.entry.shinies} shiny Pokémon on this try`;
      name.append(mark);
    }
    who.append(name, el('small', 'lb-sub', subLine(b.id, r.entry)), ...augStrip(r.entry));
    head.append(el('span', `lb-rk${medal ? ' medal' : ''}`, pinned ? `#${r.rank}` : `${r.rank}`), mon(r.entry, 'lb-mon'), who, el('span', 'lb-val', value(b.id, r.entry)));
    head.addEventListener('click', () => toggle(item, r));
    item.append(head);
    return item;
  }

  function toggle(item, r) {
    const open = opened === item;
    if (opened) close();
    if (open) { playSound('cancel'); return; }
    opened = item;
    item.classList.add('open');
    item.firstChild.setAttribute('aria-expanded', 'true');
    const more = el('div', 'lb-more');
    more.append(facts(r.entry), ...picks(r.entry), ...addKey(r));
    item.append(more);
    const s = STARTERS_BY_ID[r.entry.starter];
    if (s) playCry(s.line[0].id);
    else playSound('select');
    const sc = item.closest('.lb-scroll');   // the details in view, but never the row's own head pushed off the top
    if (sc) {
      const box = sc.getBoundingClientRect(), it = item.getBoundingClientRect(), cols = sc.querySelector('.lb-cols')?.offsetHeight ?? 0;
      const over = it.bottom - box.bottom;
      if (over > 0) sc.scrollTop += Math.min(over, it.top - box.top - cols);
    }
  }

  function close() {
    if (!opened) return false;
    opened.classList.remove('open');
    opened.firstChild.setAttribute('aria-expanded', 'false');
    opened.querySelector('.lb-more')?.remove();
    opened = null;
    return true;
  }

  function draw() {
    opened = null;
    const b = board();
    const look = LOOK[b?.id] ?? LOOK.floor;
    const scroll = el('div', 'lb-scroll');
    scroll.append(topBox);
    if (boards.length > 1) scroll.append(pills(boards));
    if (b) {
      const cols = el('div', 'lb-cols');
      cols.append(el('span', '', 'Rank'), el('span', '', 'Trainer'), el('span', '', look.col));
      scroll.append(cols);
    }
    rows = el('div', 'lb-rows');
    if (b && b.rows.length) rows.append(...b.rows.map(r => row(b, r, false)));
    else if (b) rows.append(el('p', 'lb-empty', EMPTY[b.id] ?? 'Nobody here yet.'));
    scroll.append(rows);
    const parts = [hero(b, day), scroll];
    const mine = b && (b.rows.find(r => r.mine) ?? b.me);
    if (mine) parts.push(row(b, mine, true));
    if (b) {
      const foot = el('div', 'lb-foot');
      foot.append(el('span', '', `${b.total} trainer${b.total === 1 ? '' : 's'}`));
      if (nameFor() && !editingName) {
        const btn = el('button', 'lb-btn lb-name-key', `✎ ${nameFor()}`);
        btn.type = 'button';
        btn.setAttribute('aria-label', 'Change your leaderboard name');
        btn.addEventListener('click', () => { editingName = true; playSound('select'); render(); });
        foot.append(btn);
      }
      parts.push(foot);
    }
    root.replaceChildren(...parts);
  }

  return {
    mount(panel) {
      root = el('div', 'lb-mmo');
      panel.classList.add('lb-host');
      panel.append(root);
      draw();
    },
    redraw: () => root && draw(),
    back: () => close(),
    key: () => false,
    unmount() { root?.parentNode?.classList.remove('lb-host'); root?.remove(); root = null; },
  };
}

function mountBoards(boards = [], day = K().offset(K().now(), shown)) {
  shelf?.unmount();
  shelf = tableApp(boards, day);
  host.replaceChildren();
  shelf.mount(host);
}

function periodKeys() {
  const keys = el('div', 'lb-period');
  keys.setAttribute('role', 'tablist');
  K().tabs.forEach((label, i) => {
    const b = el('button', 'lb-key', label);
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', String(-i === shown));
    b.addEventListener('click', () => { if (shown !== -i) { shown = -i; playSound('confirm'); render().catch(() => {}); } });
    keys.append(b);
  });
  return keys;
}

/** ?lbsample's made-up board: 24 trainers (you 14th), each with a Pokémon, its numbers and, on the Sky Pillar, augments. */
function sampleEntries(day, k) {
  const names = ['SKYLORD', 'MISTY_K', 'BROCKROCK', 'ASHLEY', 'NOVA', 'GARYOAK99', 'LEAFGREEN', 'DAWN', 'RED', 'CYNTHIA', 'BUGSY', 'ROSA',
    'N_HARMONIA', 'ME', 'HIKER_J', 'LANCE', 'ERIKA', 'KOGA', 'SABRINA', 'BLAINE', 'GIOVANNI', 'WHITNEY', 'MORTY', 'JASMINE'];
  const mons = STARTERS.filter(st => !st.legendary).slice(0, 12);
  return names.flatMap((name, i) => {
    const uid = name === 'ME' ? 'sample-me' : `sample-${i}`, starter = mons[i % mons.length].id, n = names.length - i;
    const base = { [k.field]: day, uid, name: name === 'ME' ? (nameFor() || 'YOU') : name, starter };
    if (k === KINDS.tower) return [{ ...base, floor: 6 + n, turns: 40 + n * 8, time: 900 + n * 260, augments: AUGMENTS.slice(i % 5, i % 5 + Math.min(9, Math.floor(n / 3))).map(a => a.id) }];
    if (k === KINDS.arcade) return ARCADE_GAMES.slice(0, i % 3 ? 7 : 4).map((g, j) => ({ ...base, game: g.id, score: n * (97 + j * 31) }));
    return [{ ...base, won: i % 4 !== 3, area: i % 4 === 3 ? 2 : 3, bosses: i % 4 === 3 ? 1 : 3, turns: 30 + i * 3 + (i % 5), time: 700 + i * 75 + (i % 3) * 40, caught: (i * 7) % 11,
      ...(i % 6 === 1 && (i * 7) % 11 ? { shinies: i === 7 ? 2 : 1 } : {}) }];
  });
}

async function entriesFor(day, s, k = K()) {
  if (SAMPLE) return sampleEntries(day, k);
  const key = `${k.collection}/${day}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.entries;
  const q = s.F.query(s.F.collection(s.db, k.collection), s.F.where(k.field, '==', day), s.F.limit(FETCH_LIMIT));
  const entries = (await s.F.getDocs(q)).docs.map(d => d.data());
  if (s.user && k !== KINDS.arcade && !entries.some(e => e.uid === s.user.uid)) {   // past the fetch limit, your own entry still shows
    const mine = await s.F.getDoc(s.F.doc(s.db, k.collection, entryId(day, s.user.uid)));
    if (mine.exists()) entries.push(mine.data());
  }
  cache.set(key, { at: Date.now(), entries });
  return entries;
}

const note = (text, cls = '') =>el('p', `pdx-lcd lb-note${cls ? ` ${cls}` : ''}`, text);

function signInRow(text) {
  const box = el('div', 'pdx-lcd lb-signin');
  const btn = el('button', 'lb-btn primary', 'Sign in');
  btn.type = 'button';
  btn.addEventListener('click', () => { if ($('board-dialog').open) closeDialog('board-dialog'); openCloud(); });
  box.append(el('p', '', text), btn);
  return box;
}

let editingName = false;

function nameRow(user, waiting) {
  const form = el('form', 'pdx-lcd lb-name-form');
  const input = el('input', 'lb-name-input');
  input.maxLength = NAME_MAX;
  input.placeholder = 'YOUR NAME';
  input.required = true;
  input.autocomplete = 'nickname';
  input.value = nameFor() || suggestName(user).toUpperCase();
  const btn = el('button', 'lb-btn primary', waiting ? 'Post' : 'Save');
  btn.type = 'submit';
  form.append(el('strong', '', 'Pick your leaderboard name'),
    el('p', '', `A nickname others will see (up to ${NAME_MAX} letters). Your real name is never posted.`), input, btn);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = cleanName(input.value);
    if (!name) return;
    setTrainerName(name);
    editingName = false;
    render();
  });
  return form;
}

const UNREACHABLE = 'The leaderboard can\'t be reached right now (offline?). The game itself is unaffected.';

async function render() {
  if (!host) return;
  const k = K(), was = kind, at = host;
  const day = k.offset(k.now(), shown);
  $('board-title').textContent = k.title.replace(/^\S+ /, '');
  fitText($('board-title'));
  $('board-dialog').dataset.kind = kind;
  topBox = el('div', 'lb-top');
  const head = [periodKeys()];
  const show = (...nodes) => topBox.replaceChildren(...head, ...nodes);
  const fresh = () => kind === was && host === at && k.offset(k.now(), shown) === day;
  if (!SAMPLE && !cloudConfigured()) { show(note('The leaderboard isn\'t available in this version of the game.')); mountBoards(); return; }
  show(note('Loading…'));
  mountBoards();
  let s;
  try { s = SAMPLE ? { user: { uid: 'sample-me' } } : await cloudSession(); }
  catch (err) { if (fresh()) show(note(UNREACHABLE)); return; }
  me = s.user?.uid ?? null;
  const top = [];
  const waiting = !SAMPLE && pending(k);
  if (!nameFor() || editingName) top.push(nameRow(s.user, waiting && s.user));   // a nickname first, signed in or not
  if (!s.user) top.push(signInRow(waiting ? (kind === 'arcade' ? 'Your best scores are waiting on this device: sign in to post them.' : 'Your first try is waiting on this device: sign in to post it.') : k.signin));
  else if (nameFor() && !editingName && waiting) {
    const state = await post(k);
    const said = kind === 'arcade' ? { posted: 'Your new bests are on this week\'s board!', offline: POST_TEXT.offline }[state] : POST_TEXT[state];
    if (said && state !== 'none') top.push(note(said));
  }
  let boards, mine;
  try {
    const entries = await entriesFor(day, s, k);
    boards = k.rank(entries, s.user?.uid);
    mine = s.user ? entries.filter(e => e.uid === s.user.uid) : [];
  }
  catch (err) { if (fresh()) show(...top, note(UNREACHABLE)); return; }
  if (!fresh()) return;   // the tab changed (or the board closed) while it loaded
  const ranked = boards.some(b => b.me || b.rows.some(r => r.mine));
  if (mine.length && !ranked) top.push(note(k.mine(kind === 'arcade' ? mine : mine[0]), 'lb-mine'));   // your own try, even when it's on no board (else it's the pinned row)
  show(...top);
  mountBoards(boards, day);
}

/** The week's top climbers, for the lobby's plaque (js/towerprep.js): up to `n` entries, best first, each with `mine`;
    null when the board can't be reached (no config, offline). */
export async function towerTop(n = 5) {
  if (!cloudConfigured()) return null;
  try {
    const s = await cloudSession();
    const entries = await entriesFor(towerWeek(), s, KINDS.tower);
    return rankTower(entries, s.user?.uid)[0].rows.slice(0, n).map(r => ({ ...r.entry, mine: r.mine }));
  } catch (err) { return null; }
}

/** This week's arcade boards, for the Game Corner's leaderboard screen (js/mall-corner.js): rankArcade()'s boards, or null
    when they can't be reached (no config, offline). */
export async function arcadeTop() {
  if (!cloudConfigured()) return null;
  try {
    const s = await cloudSession();
    return rankArcade(await entriesFor(towerWeek(), s, KINDS.arcade), s.user?.uid, 3);
  } catch (err) { return null; }
}

function attach(panel, which, day = 0) {
  shelf?.unmount();
  shown = day;
  kind = KINDS[which] ? which : 'safari';
  editingName = false;
  host = panel;
  panel.dataset.kind = kind;
  render().catch(() => {});
}

function detach(panel) {
  if (panel && host !== panel) return;   // a lobby's app closing after the window took the board over
  shelf?.unmount();
  shelf = null;
  host = null;
}

/** ◀ / ▶: on a board's handheld they step its trainers, on the banners they switch the period. */
function stepKey(e) {
  if (shelf?.key(e)) return true;
  const step = { ArrowLeft: -1, ArrowRight: 0 }[e.key];
  if (step === undefined || shown === step) return false;
  shown = step;
  render().catch(() => {});
  return true;
}

/** Open a board: `which` is 'safari' (the daily one), 'tower' (the Sky Pillar's weekly one) or 'arcade' (the home
    arcade's weekly bests); `day` 0 the current day or week, -1 the one before. */
export function openLeaderboard(day = 0, which = 'safari') {
  attach($('board-host'), which, day);
  openDialog('board-dialog');
}

/** A board as an app of a Pokédex device's screen (the lobbies' Ranks keys). `which` as openLeaderboard()'s. */
export const boardApp = (which = 'safari') => {
  let mine = null;
  return {
    mount(panel) { mine = panel; attach(panel, which); },
    back: () => (host === mine && shelf?.back()) || false,
    key: (e) => host === mine && stepKey(e),
    unmount() { detach(mine); mine = null; },
  };
};

export function initLeaderboard() {
  const dialog = $('board-dialog');
  $('board-close').addEventListener('click', () => closeDialog('board-dialog'));
  dialog.addEventListener('cancel', (e) => { if (shelf?.back()) e.preventDefault(); });   // Escape is B: a board back to its banners first
  dialog.addEventListener('keydown', (e) => { if (['ArrowLeft', 'ArrowRight'].includes(e.key) && !e.target.closest('input') && stepKey(e)) e.preventDefault(); });
  dialog.addEventListener('close', () => detach($('board-host')));
  // a result waiting from a signed-out run goes up as soon as you sign in
  onCloudSignIn(() => { for (const k of Object.values(KINDS)) if (pending(k)) post(k).catch(() => {}); });
  const which = new URLSearchParams(location.search).get('lbsample');
  if (SAMPLE) setTimeout(() => openLeaderboard(0, which || 'tower'), 1500);
}

/** Today's top catchers, for the Safari lobby's plaque (js/safariprep.js): like towerTop(), off the Most caught board. */
export async function safariTop(n = 5) {
  if (!cloudConfigured()) return null;
  try {
    const s = await cloudSession();
    const entries = await entriesFor(safariDay(), s, KINDS.safari);
    return rankBoards(entries, s.user?.uid, n).find(b => b.id === 'caught').rows.map(r => ({ ...r.entry, mine: r.mine }));
  } catch (err) { return null; }
}
