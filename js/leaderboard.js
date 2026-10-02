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
import { BOARD_COLLECTION, entryId, dayOffset, cleanName, buildEntry, checkEntry, rankBoards, boardValue, formatTime, NAME_MAX } from './data/leaderboard.js';
import { safariDay, safariDaily } from './data/safari.js';
import { STARTERS_BY_ID, spriteUrl } from './data/starters.js';
import { $, el, openDialog, closeDialog } from './ui.js';

const POST_KEY = 'pokedb.safari.post';
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

let shown = 0;           // 0 today, -1 yesterday
let posting = null;
const cache = new Map(); // day -> { at, entries }
let resultLine = null;   // the result window's line, kept up to date while it posts

/** The result still waiting to go up, if its day can still be posted. */
function pending() {
  const p = store.get(POST_KEY);
  if (!p?.day) return null;
  const today = safariDay();
  if (![dayOffset(today, -1), today].includes(p.day)) { store.set(POST_KEY, null); return null; }
  return p;
}

const nameFor = (user) => cleanName(user?.displayName || '') || cleanName(store.get(NAME_KEY) || '');

function say(text) {
  if (resultLine) resultLine.textContent = `📮 ${text}`;
}

/** Posts the waiting result: 'posted', 'already', 'signin', 'name', 'none', 'stale' or 'offline'. Never throws. */
async function post() {
  if (posting) return posting;
  posting = (async () => {
    const result = pending();
    if (!result) return 'none';
    let s;
    try { s = await cloudSession(); } catch (err) { return 'offline'; }
    if (!s.user) return 'signin';
    const name = nameFor(s.user);
    if (!name) return 'name';
    const entry = buildEntry(result, s.user.uid, name);
    if (checkEntry(entry, safariDay())) { store.set(POST_KEY, null); return 'stale'; }
    const ref = s.F.doc(s.db, BOARD_COLLECTION, entryId(entry.day, entry.uid));
    try {
      if ((await s.F.getDoc(ref)).exists()) { store.set(POST_KEY, null); return 'already'; }
      await s.F.setDoc(ref, { ...entry, at: s.F.serverTimestamp() });
    } catch (err) {
      if (err?.code === 'permission-denied') { store.set(POST_KEY, null); return 'already'; }
      return 'offline';
    }
    store.set(POST_KEY, null);
    cache.delete(entry.day);
    return 'posted';
  })();
  try { return await posting; } finally { posting = null; }
}

const POST_TEXT = {
  posted: 'Posted to today\'s Safari leaderboard!',
  already: 'This day\'s result was already posted from this account.',
  signin: 'Sign in (the Poké Ball menu, or the title\'s PC) to post this result. It waits on this device until tomorrow.',
  name: 'Open the Leaderboard and pick a name to post this result.',
  offline: 'Couldn\'t reach the leaderboard. The result waits on this device: open the Leaderboard to try again.',
  stale: 'This result is too old to post.',
};

/** From endRun(): keeps the first try's result and starts posting it. Returns the result window's line (or null). */
export function postSafariResult(result) {
  try {
    if (!cloudConfigured()) return null;
    store.set(POST_KEY, result);
    resultLine = el('li', 'board-line', '');
    const line = resultLine;
    if (!cloudRemembered()) { say(POST_TEXT.signin); return line; }
    say('Posting your result to today\'s leaderboard…');
    post().then(state => { if (resultLine === line) say(POST_TEXT[state] || POST_TEXT.offline); }).catch(() => {});
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
  li.title = `${e.name}: ${e.won ? 'crossed the Safari Zone' : `reached area ${e.area}`}, ${e.turns} turns, ${e.caught} caught`;
  return li;
}

function boardBox(board) {
  const box = el('section', 'board-box');
  box.append(el('h3', '', board.name));
  if (!board.rows.length) { box.append(el('p', 'hint', board.id === 'caught' ? 'Nobody has caught anything yet.' : 'No wins yet.')); return box; }
  const list = el('ol', 'board-list');
  list.append(...board.rows.map(r => row(board, r)));
  if (board.me) list.append(el('li', 'board-gap', '⋯'), row(board, board.me));
  box.append(list);
  return box;
}

async function entriesFor(day, s) {
  const hit = cache.get(day);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.entries;
  const q = s.F.query(s.F.collection(s.db, BOARD_COLLECTION), s.F.where('day', '==', day), s.F.limit(FETCH_LIMIT));
  const entries = (await s.F.getDocs(q)).docs.map(d => d.data());
  if (s.user && !entries.some(e => e.uid === s.user.uid)) {   // past the fetch limit, your own entry still shows
    const mine = await s.F.getDoc(s.F.doc(s.db, BOARD_COLLECTION, entryId(day, s.user.uid)));
    if (mine.exists()) entries.push(mine.data());
  }
  cache.set(day, { at: Date.now(), entries });
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

function nameRow(user) {
  const form = el('form', 'board-name-form');
  const input = el('input', 'board-name-input');
  input.maxLength = NAME_MAX;
  input.placeholder = 'Your name';
  input.required = true;
  input.autocomplete = 'nickname';
  input.value = cleanName(store.get(NAME_KEY) || '');
  const btn = el('button', 'btn primary', 'Post');
  btn.type = 'submit';
  form.append(el('p', 'hint', `Pick a name for the board (up to ${NAME_MAX} letters). It can't be changed once posted.`), input, btn);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = cleanName(input.value);
    if (!name) return;
    store.set(NAME_KEY, name);
    render();
  });
  return form;
}

async function render() {
  const day = dayOffset(safariDay(), shown);
  const body = $('board-body');
  for (const tab of document.querySelectorAll('.board-tab')) tab.setAttribute('aria-selected', String(Number(tab.dataset.day) === shown));
  const daily = safariDaily(day);
  $('board-day').textContent = `${day} · ${daily.starter.line[0].name} · ${daily.areas.map(a => a.name).join(' · ')}`;
  if (!cloudConfigured()) { body.replaceChildren(el('p', 'hint board-note', 'The leaderboard isn\'t available in this version of the game.')); return; }
  body.replaceChildren(el('p', 'hint board-note', 'Loading…'));
  let s;
  try { s = await cloudSession(); }
  catch (err) { body.replaceChildren(el('p', 'hint board-note', 'The leaderboard can\'t be reached right now (offline?). The game itself is unaffected.')); return; }
  const top = [];
  const waiting = pending();
  if (!s.user) top.push(signInRow(waiting ? 'Your first try is waiting on this device: sign in to post it.' : 'Sign in to post your first try of the day.'));
  else if (waiting) {
    const state = await post();
    if (state === 'name') top.push(nameRow(s.user));
    else if (POST_TEXT[state] && state !== 'none') top.push(el('p', 'hint board-note', POST_TEXT[state]));
  }
  let boards, mine;
  try {
    const entries = await entriesFor(day, s);
    boards = rankBoards(entries, s.user?.uid);
    mine = s.user && entries.find(e => e.uid === s.user.uid);
  }
  catch (err) { body.replaceChildren(...top, el('p', 'hint board-note', 'The leaderboard can\'t be reached right now (offline?). The game itself is unaffected.')); return; }
  if (dayOffset(safariDay(), shown) !== day) return;   // the tab changed while it loaded
  if (mine) {   // your own try, even when it's on no board (a loss with nothing caught)
    top.push(el('p', 'hint board-note board-mine', `Your try: ${mine.won ? 'crossed the Safari Zone' : `fainted in area ${mine.area}`} · ${mine.turns} turn${mine.turns === 1 ? '' : 's'} · ${formatTime(mine.time)} · ${mine.caught} caught`));
  }
  body.replaceChildren(...top, ...boards.map(boardBox));
}

export function openLeaderboard(day = 0) {
  shown = day;
  render().catch(() => {});
  openDialog('board-dialog');
}

export function initLeaderboard() {
  for (const tab of document.querySelectorAll('.board-tab')) {
    tab.addEventListener('click', () => { shown = Number(tab.dataset.day); render().catch(() => {}); });
  }
  $('board-close').addEventListener('click', () => closeDialog('board-dialog'));
  // a result waiting from a signed-out run goes up as soon as you sign in
  onCloudSignIn(() => { if (pending()) post().catch(() => {}); });
}
