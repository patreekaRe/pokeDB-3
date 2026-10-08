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
import { AUGMENTS_BY_ID } from './data/augments.js';
import { augIcon } from './augment-art.js';
import { shelfApp, typed } from './bagdex.js';
import { playCry, playSound } from './audio.js';

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

/* ---------- the window: the Pokédex's banners and handheld (js/bagdex.js's shelfApp(); the user's call, 2026-10-07).
   A banner per board, its top three standing on it; a tap opens the red handheld on that board, one trainer a screen,
   their Pokémon blown up, the ranks as slots. The period, your name and sign-in sit on LCDs above the banners. ---------- */

/* each board's banner: its colours, its line, and for the Safari's an area of that day's run to paint it with */
const LOOK = {
  fastest: { b1: '#5ad08a', b2: '#1e6a48', sub: 'The quickest crossing', area: 0 },
  turns: { b1: '#4ab8d8', b2: '#1a4a7a', sub: 'The fewest turns to cross', area: 1 },
  caught: { b1: '#f0a040', b2: '#8a3a14', sub: 'The biggest haul', area: 2 },
  floor: { b1: '#6aa8ff', b2: '#3a2a8a', sub: 'The furthest climb' },
};
const EMPTY = { caught: 'Nobody has caught anything yet.', floor: 'Nobody has climbed yet.' };
const MEDAL = ['', 'gold', 'silver', 'bronze'];

let host = null;     // where the board is mounted: the window's screen, or a lobby's app panel
let shelf = null;    // its shelfApp
let topBox = null;   // the LCDs above the banners

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
  const box = el('div', 'pdx-lcd pdx-facts lb-facts');
  const fact = (k, v) => { const f = el('span', ''); f.append(el('b', '', `${k} `), v); return f; };
  if (kind === 'tower') box.append(fact('Floor', `${e.floor}`), fact('Turns', `${e.turns}`), fact('Time', formatTime(e.time)));
  else box.append(fact('Result', e.won ? 'Crossed' : `Area ${e.area}`), fact('Turns', `${e.turns}`), fact('Time', formatTime(e.time)), fact('Caught', `${e.caught}`));
  return box;
}

/** A climb's augments, in the order picked (an entry posted before augments has none). */
function picks(e) {
  const augs = (e.augments || []).map(id => AUGMENTS_BY_ID[id]).filter(Boolean);
  if (kind !== 'tower' || !augs.length) return [];
  const box = el('div', 'pdx-lcd lb-augs');
  const row = el('span', 'lb-aug-row');
  for (const a of augs) { const i = augIcon(a); i.title = a.name; row.append(i); }
  box.append(el('b', '', 'Augments'), row);
  return [box];
}

function boardsApp(boards, day) {
  const areas = kind === 'safari' ? safariDaily(day).areas : [];
  const groups = boards.map(b => {
    const look = LOOK[b.id] ?? LOOK.floor;
    const rows = b.me ? [...b.rows, b.me] : b.rows;
    return { id: b.id, name: b.name, sub: look.sub, b1: look.b1, b2: look.b2, scene: areas[look.area]?.id, board: b, list: () => rows };
  });
  const mine = (g) => g.board.rows.find(r => r.mine) ?? g.board.me;
  return shelfApp({
    groups,
    deviceCls: 'lb-device',
    known: () => true,
    no: (g, r) => `#${r.rank}`,
    label: (g, r) => r.entry.name,
    art: (g, r, k, where) => {
      if (where === 'banner') return mon(r.entry, 'pdx-banner-mon');
      const s = el('span', 'lb-slot');
      s.append(mon(r.entry, 'pdx-slot-mon'), el('b', 'lb-slot-rank', `${r.rank}`));
      return s;
    },
    slotCls: (g, r) => [r.mine && 'mine', MEDAL[r.rank] && `medal-${MEDAL[r.rank]}`].filter(Boolean).join(' '),
    screenCls: (g, r) => `lb-screen${MEDAL[r.rank] ? ` medal-${MEDAL[r.rank]}` : ''}`,
    screen: (g, r) => [el('span', 'pdx-pad'), mon(r.entry, 'pdx-mon bdx-art'),
      el('span', `pdx-role lb-rank${MEDAL[r.rank] ? ` ${MEDAL[r.rank]}` : ''}`, r.rank === 1 ? '★ 1st' : `#${r.rank}`),
      el('span', 'lb-value', boardValue(g.id, r.entry)), ...(r.mine ? [el('span', 'lb-you', 'You')] : [])],
    lines: (g, r) => [typed('', `${g.name}: ${boardValue(g.id, r.entry)}${r.mine ? '. That\'s you!' : ''}`), facts(r.entry), ...picks(r.entry)],
    tally: (g) => (mine(g) ? `Your rank: #${mine(g).rank} of` : 'Trainers on this board'),
    count: (g) => `${g.board.total}`,
    bannerArt: (g, rows) => {
      const podium = el('span', 'pdx-banner-mons lb-podium');
      podium.append(...[rows[1], rows[0], rows[2]].filter(r => r && r.rank <= 3).map(r => mon(r.entry, `pdx-banner-mon${r.rank === 1 ? ' lb-first' : ''}`)));
      return podium;
    },
    medal: (g) => { const m = mine(g); return m ? el('span', `pdx-medal lb-medal${m.rank <= 3 ? ' lv2' : ' lv1'}`, `${m.rank}`) : el('span', ''); },
    empty: (g) => EMPTY[g.id] ?? 'No wins yet.',
    onShow: (g, r) => { const s = STARTERS_BY_ID[r.entry.starter]; if (s) playCry(s.line[0].id); },
    top: () => topBox,
  });
}

function mountBoards(boards = [], day) {
  shelf?.unmount();
  shelf = boardsApp(boards, day);
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

function nameLine() {
  const row = el('div', 'pdx-lcd lb-name-line');
  const btn = el('button', 'lb-btn', 'Change');
  btn.type = 'button';
  btn.addEventListener('click', () => { editingName = true; render(); });
  const who = el('span', '');
  who.append(el('small', '', 'Your name '), el('b', '', nameFor()));
  row.append(who, btn);
  return row;
}

function nameRow(user, waiting) {
  const form = el('form', 'pdx-lcd lb-name-form');
  const input = el('input', 'lb-name-input');
  input.maxLength = NAME_MAX;
  input.placeholder = 'Your name';
  input.required = true;
  input.autocomplete = 'nickname';
  input.value = nameFor() || suggestName(user);
  const btn = el('button', 'lb-btn primary', waiting ? 'Post' : 'Save');
  btn.type = 'submit';
  form.append(el('strong', '', 'Pick your leaderboard name'),
    el('p', '', `A nickname others will see (up to ${NAME_MAX} letters). Your real name is never posted.`), input, btn);
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

const UNREACHABLE = 'The leaderboard can\'t be reached right now (offline?). The game itself is unaffected.';

async function render() {
  if (!host) return;
  const k = K(), was = kind, at = host;
  const day = k.offset(k.now(), shown);
  $('board-title').textContent = k.title.replace(/^\S+ /, '');
  $('board-dialog').dataset.kind = kind;
  topBox = el('div', 'lb-top');
  const head = [periodKeys(), note(k.header(day), 'lb-day')];
  const show = (...nodes) => topBox.replaceChildren(...head, ...nodes);
  const fresh = () => kind === was && host === at && k.offset(k.now(), shown) === day;
  if (!cloudConfigured()) { show(note('The leaderboard isn\'t available in this version of the game.')); mountBoards(); return; }
  show(note('Loading…'));
  mountBoards();
  let s;
  try { s = await cloudSession(); }
  catch (err) { if (fresh()) show(note(UNREACHABLE)); return; }
  const top = [];
  const waiting = pending(k);
  if (!nameFor() || editingName) top.push(nameRow(s.user, waiting && s.user));   // a nickname first, signed in or not
  else top.push(nameLine());
  if (!s.user) top.push(signInRow(waiting ? 'Your first try is waiting on this device: sign in to post it.' : k.signin));
  else if (nameFor() && !editingName && waiting) {
    const state = await post(k);
    if (POST_TEXT[state] && state !== 'none') top.push(note(POST_TEXT[state]));
  }
  let boards, mine;
  try {
    const entries = await entriesFor(day, s, k);
    boards = k.rank(entries, s.user?.uid);
    mine = s.user && entries.find(e => e.uid === s.user.uid);
  }
  catch (err) { if (fresh()) show(...top, note(UNREACHABLE)); return; }
  if (!fresh()) return;   // the tab changed (or the board closed) while it loaded
  if (mine) top.push(note(k.mine(mine), 'lb-mine'));   // your own try, even when it's on no board
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

/** Open a board: `which` is 'safari' (the daily one) or 'tower' (the Sky Pillar's weekly one); `day` 0 the current day or
    week, -1 the one before. */
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
