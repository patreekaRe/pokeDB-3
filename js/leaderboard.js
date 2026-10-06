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
import { BOARD_COLLECTION, entryId, dayOffset, cleanName, buildEntry, checkEntry, rankBoards, boardValue, formatTime, NAME_MAX,
  TOWER_COLLECTION, checkTowerEntry, rankTower } from './data/leaderboard.js';
import { safariDay, safariDaily } from './data/safari.js';
import { towerWeek, weekOffset, towerWeekly } from './data/tower.js';
import { STARTERS_BY_ID, spriteUrl } from './data/starters.js';
import { $, el, openDialog, closeDialog } from './ui.js';

const POST_KEY = 'pokedb.safari.post';
const TOWER_POST_KEY = 'pokedb.tower.post';
const NAME_KEY = 'pokedb.safari.name';
const FETCH_LIMIT = 1000;
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
    mine: (e) => `Your try: ${e.won ? 'crossed the Safari Zone' : `fainted in area ${e.area}`} · ${e.turns} turn${e.turns === 1 ? '' : 's'} · ${formatTime(e.time)} · ${e.caught} caught`,
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
};
let kind = 'safari';
const K = () => KINDS[kind];

let shown = 0;           // 0 today / this week, -1 the one before
const posting = new Map();   // per board: the post in flight
const cache = new Map(); // day -> { at, entries }
let resultLine = null;   // the result window's line, kept up to date while it posts

/** The result still waiting to go up, if its day (or week) can still be posted. */
function pending(k = K()) {
  const p = store.get(k.postKey);
  if (!p?.[k.field]) return null;
  const now = k.now();
  if (![k.offset(now, -1), now].includes(p[k.field])) { store.set(k.postKey, null); return null; }
  return p;
}

/** The board only ever shows a nickname the player picked, never the sign-in's real name. */
const nameFor = () => cleanName(store.get(NAME_KEY) || '');
/** The Trainer Card's name: the leaderboard nickname the player picked, never the sign-in's real name. */
export const trainerName = () => nameFor() || 'Trainer';
/** The picked nickname itself ('' if none), for Settings' name box. */
export const pickedName = () => nameFor();
/** Settings' name box: saves the nickname (an empty one goes back to "Trainer") and returns what was kept. */
export function setTrainerName(name) {
  const clean = cleanName(name);
  store.set(NAME_KEY, clean || null);
  return clean;
}
/** A suggestion for the name box: the sign-in's first name, only ever posted if the player keeps it. */
const suggestName = (user) => cleanName((user?.displayName || '').split(/\s+/)[0] || '');

function say(text) {
  if (resultLine) resultLine.textContent = `📮 ${text}`;
}

/** Posts the waiting result: 'posted', 'already', 'signin', 'name', 'none', 'stale' or 'offline'. Never throws. */
async function post(k = K()) {
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
      await s.F.setDoc(ref, { ...entry, at: s.F.serverTimestamp() });
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

/* ---------- the window ---------- */

function row(board, r) {
  const e = r.entry;
  const li = el('li', `board-row${r.mine ? ' mine' : ''}`);
  const img = el('img', 'pixel board-mon');
  const starter = STARTERS_BY_ID[e.starter];
  if (starter) { img.src = spriteUrl(starter, 'front', 0); img.alt = ''; }
  li.append(el('span', 'board-rank', `${r.rank}`), img, el('span', 'board-name', e.name), el('span', 'board-value', boardValue(board.id, e)));
  li.title = kind === 'tower' ? `${e.name}: floor ${e.floor}, ${e.turns} turns, ${formatTime(e.time)}`
    : `${e.name}: ${e.won ? 'crossed the Safari Zone' : `reached area ${e.area}`}, ${e.turns} turns, ${e.caught} caught`;
  return li;
}

function boardBox(board) {
  const box = el('section', 'board-box');
  box.append(el('h3', '', board.name));
  if (!board.rows.length) { box.append(el('p', 'hint', board.id === 'caught' ? 'Nobody has caught anything yet.' : board.id === 'floor' ? 'Nobody has climbed yet.' : 'No wins yet.')); return box; }
  const list = el('ol', 'board-list');
  list.append(...board.rows.map(r => row(board, r)));
  if (board.me) list.append(el('li', 'board-gap', '⋯'), row(board, board.me));
  box.append(list);
  return box;
}

async function entriesFor(day, s, k = K()) {
  const key = `${k.collection}/${day}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.entries;
  const q = s.F.query(s.F.collection(s.db, k.collection), s.F.where(k.field, '==', day), s.F.limit(FETCH_LIMIT));
  const entries = (await s.F.getDocs(q)).docs.map(d => d.data());
  if (s.user && !entries.some(e => e.uid === s.user.uid)) {   // past the fetch limit, your own entry still shows
    const mine = await s.F.getDoc(s.F.doc(s.db, k.collection, entryId(day, s.user.uid)));
    if (mine.exists()) entries.push(mine.data());
  }
  cache.set(key, { at: Date.now(), entries });
  return entries;
}

function signInRow(text) {
  const box = el('div', 'board-signin');
  const btn = el('button', 'btn primary', 'Sign in');
  btn.type = 'button';
  btn.addEventListener('click', () => { closeDialog('board-dialog'); openCloud(); });
  box.append(el('p', 'hint', text), btn);
  return box;
}

let editingName = false;

function nameLine() {
  const row = el('div', 'board-name-line');
  const btn = el('button', 'btn small', 'Change');
  btn.type = 'button';
  btn.addEventListener('click', () => { editingName = true; render(); });
  row.append(el('span', 'hint', `Your leaderboard name: ${nameFor()}`), btn);
  return row;
}

function nameRow(user, waiting) {
  const form = el('form', 'board-name-form');
  const input = el('input', 'board-name-input');
  input.maxLength = NAME_MAX;
  input.placeholder = 'Your name';
  input.required = true;
  input.autocomplete = 'nickname';
  input.value = nameFor() || suggestName(user);
  const btn = el('button', 'btn primary', waiting ? 'Post' : 'Save');
  btn.type = 'submit';
  form.append(el('strong', 'board-name-head', 'Pick your leaderboard name'),
    el('p', 'hint', `A nickname others will see (up to ${NAME_MAX} letters). Your real name is never posted. A result already posted keeps the name it went up with.`), input, btn);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = cleanName(input.value);
    if (!name) return;
    store.set(NAME_KEY, name);
    editingName = false;
    render();
  });
  return form;
}

async function render() {
  const k = K(), was = kind;
  const day = k.offset(k.now(), shown);
  const body = $('board-body');
  for (const tab of document.querySelectorAll('.board-tab')) {
    tab.setAttribute('aria-selected', String(Number(tab.dataset.day) === shown));
    tab.textContent = k.tabs[-Number(tab.dataset.day)];
  }
  $('board-title').textContent = k.title;
  $('board-day').textContent = k.header(day);
  if (!cloudConfigured()) { body.replaceChildren(el('p', 'hint board-note', 'The leaderboard isn\'t available in this version of the game.')); return; }
  body.replaceChildren(el('p', 'hint board-note', 'Loading…'));
  let s;
  try { s = await cloudSession(); }
  catch (err) { body.replaceChildren(el('p', 'hint board-note', 'The leaderboard can\'t be reached right now (offline?). The game itself is unaffected.')); return; }
  const top = [];
  const waiting = pending(k);
  if (!nameFor() || editingName) top.push(nameRow(s.user, waiting && s.user));   // a nickname first, signed in or not
  else top.push(nameLine());
  if (!s.user) top.push(signInRow(waiting ? 'Your first try is waiting on this device: sign in to post it.' : k.signin));
  else if (nameFor() && !editingName && waiting) {
    const state = await post(k);
    if (POST_TEXT[state] && state !== 'none') top.push(el('p', 'hint board-note', POST_TEXT[state]));
  }
  let boards, mine;
  try {
    const entries = await entriesFor(day, s, k);
    boards = k.rank(entries, s.user?.uid);
    mine = s.user && entries.find(e => e.uid === s.user.uid);
  }
  catch (err) { body.replaceChildren(...top, el('p', 'hint board-note', 'The leaderboard can\'t be reached right now (offline?). The game itself is unaffected.')); return; }
  if (kind !== was || k.offset(k.now(), shown) !== day) return;   // the tab changed while it loaded
  if (mine) top.push(el('p', 'hint board-note board-mine', k.mine(mine)));   // your own try, even when it's on no board
  body.replaceChildren(...top, ...boards.map(boardBox));
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

/** Open a board: `which` is 'safari' (the daily one) or 'tower' (the Sky Pillar's weekly one); `day` 0 the current day or
    week, -1 the one before. */
export function openLeaderboard(day = 0, which = 'safari') {
  shown = day;
  kind = KINDS[which] ? which : 'safari';
  render().catch(() => {});
  openDialog('board-dialog');
}

export function initLeaderboard() {
  for (const tab of document.querySelectorAll('.board-tab')) {
    tab.addEventListener('click', () => { shown = Number(tab.dataset.day); render().catch(() => {}); });
  }
  $('board-close').addEventListener('click', () => closeDialog('board-dialog'));
  // a result waiting from a signed-out run goes up as soon as you sign in
  onCloudSignIn(() => { for (const k of Object.values(KINDS)) if (pending(k)) post(k).catch(() => {}); });
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
