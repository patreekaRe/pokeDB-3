/* ============================================================
   data/leaderboard.js  -  the Safari Zone's daily leaderboard, the pure part
   (js/leaderboard.js posts and shows it; firestore.rules guards it).

   Only the day's first try posts, once, as safariBoard/<day>_<uid>. The
   bounds here are the same as the rules', so an entry the game builds is
   one Firestore takes. Boards: fastest win, fewest turns (wins only), most
   caught.
   ============================================================ */

export const BOARD_COLLECTION = 'safariBoard';
export const BOARD_TOP = 10;
export const NAME_MAX = 16;
export const LIMITS = {
  area: [1, 3], bosses: [0, 3], turns: [0, 3000], time: [0, 7 * 24 * 3600], caught: [0, 300],
};
export const ENTRY_KEYS = ['day', 'uid', 'name', 'starter', 'won', 'area', 'bosses', 'turns', 'time', 'caught', 'at'];

export const entryId = (day, uid) => `${day}_${uid}`;

/** A "YYYY-MM-DD" day moved n days (UTC). */
export function dayOffset(day, n) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** A name for the board: no control characters, spaces collapsed, at most NAME_MAX characters. '' if nothing is left. */
export function cleanName(name) {
  if (typeof name !== 'string') return '';
  const flat = name.replace(/\s+/g, ' ').replace(/[\u0000-\u001f\u007f-\u009f<>]/g, '').trim();
  return [...flat].slice(0, NAME_MAX).join('').trim();
}

const clamp = (n, [lo, hi]) => Math.min(hi, Math.max(lo, Math.round(Number(n) || 0)));

/** What a finished Safari run posts, before the uid and name are known: day, starter, won, area reached (1-3), bosses
    beaten, turns, run time in seconds, Pokémon caught. */
export function runResult({ day, starter, won, biome, turns, startedAt, endedAt = Date.now(), caught }) {
  const start = Date.parse(startedAt);
  return {
    day,
    starter: String(starter),
    won: Boolean(won),
    area: clamp((biome ?? 0) + 1, LIMITS.area),
    bosses: won ? 3 : clamp(biome ?? 0, [0, 2]),
    turns: clamp(turns, LIMITS.turns),
    time: Number.isFinite(start) ? clamp((endedAt - start) / 1000, LIMITS.time) : 0,
    caught: clamp(caught, LIMITS.caught),
  };
}

/** The document posted (the server adds `at`). */
export const buildEntry = (result, uid, name) => ({ ...result, uid, name: cleanName(name) });

const inRange = (n, [lo, hi]) => Number.isInteger(n) && n >= lo && n <= hi;

/** Why Firestore's rules would refuse an entry (null when they'd take it). `today` is the UTC day it's posted on. */
export function checkEntry(e, today) {
  if (!e || typeof e !== 'object') return 'no entry';
  const extra = Object.keys(e).filter(k => !ENTRY_KEYS.includes(k));
  if (extra.length) return `unknown field ${extra[0]}`;
  if (typeof e.day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(e.day)) return 'bad day';
  if (![dayOffset(today, -1), today, dayOffset(today, 1)].includes(e.day)) return 'day too far from today';
  if (typeof e.uid !== 'string' || !e.uid) return 'no uid';
  if (typeof e.name !== 'string' || !e.name || [...e.name].length > NAME_MAX) return 'bad name';
  if (typeof e.starter !== 'string' || !e.starter || e.starter.length > 32) return 'bad starter';
  if (typeof e.won !== 'boolean') return 'bad won';
  for (const key of Object.keys(LIMITS)) if (!inRange(e[key], LIMITS[key])) return `bad ${key}`;
  if (e.won !== (e.bosses === 3)) return 'won must mean 3 bosses';
  return null;
}

/** A Firestore timestamp, a Date or millis, as millis (unknown last). */
const when = (at) => (at?.toMillis ? at.toMillis() : at instanceof Date ? at.getTime() : typeof at === 'number' ? at : Infinity);

export const BOARDS = [
  { id: 'fastest', name: 'Fastest win', keep: e => e.won && e.time > 0, order: (a, b) => a.time - b.time || a.turns - b.turns },
  { id: 'turns', name: 'Fewest turns', keep: e => e.won, order: (a, b) => a.turns - b.turns || a.time - b.time },
  { id: 'caught', name: 'Most caught', keep: e => e.caught > 0,
    order: (a, b) => b.caught - a.caught || Number(b.won) - Number(a.won) || b.bosses - a.bosses || a.turns - b.turns },
];

/** A day's entries as the three boards: each its top BOARD_TOP rows ({ rank, entry, mine }) and, when you're below
    them, your own row (`me`). Ties keep the earlier post first. */
export function rankBoards(entries, uid, top = BOARD_TOP) {
  const valid = entries.filter(e => e && typeof e === 'object');
  return BOARDS.map(board => {
    const rows = valid.filter(board.keep)
      .sort((a, b) => board.order(a, b) || when(a.at) - when(b.at))
      .map((entry, i) => ({ rank: i + 1, entry, mine: Boolean(uid) && entry.uid === uid }));
    const me = rows.slice(top).find(r => r.mine) || null;
    return { id: board.id, name: board.name, rows: rows.slice(0, top), me, total: rows.length };
  });
}

/** "m:ss", or "h:mm:ss" past an hour. */
export function formatTime(sec) {
  const s = Math.max(0, Math.round(sec)), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(r)}` : `${m}:${pad(r)}`;
}

/** A board row's number. */
export const boardValue = (id, e) => (id === 'floor' ? `F${e.floor}` : id === 'fastest' ? formatTime(e.time) : id === 'turns' ? `${e.turns} turn${e.turns === 1 ? '' : 's'}` : `${e.caught} caught`);


/* ---------- the Sky Pillar's weekly board (js/data/tower.js): towerBoard/<week>_<uid>, the week's first climb only ---------- */

export const TOWER_COLLECTION = 'towerBoard';
export const TOWER_LIMITS = { floor: [0, 999], turns: [0, 60000], time: [0, 8 * 24 * 3600] };
export const TOWER_KEYS = ['week', 'uid', 'name', 'starter', 'floor', 'turns', 'time', 'at', 'augments'];
export const TOWER_AUGMENTS = 10;   // the most augments a climb can pick (js/data/augments.js: the start and nine guardians; Darkrai's Deal's extra one past ten is left off the board, so the rules needn't change)

/** What a finished climb posts, before the uid and name: the week (its Monday), starter, highest floor cleared, turns,
    climb time in seconds. */
export function towerResult({ week, starter, floor, turns, startedAt, endedAt = Date.now(), augments = [] }) {
  const start = Date.parse(startedAt);
  return {
    week,
    starter: String(starter),
    floor: clamp(floor, TOWER_LIMITS.floor),
    turns: clamp(turns, TOWER_LIMITS.turns),
    time: Number.isFinite(start) ? clamp((endedAt - start) / 1000, TOWER_LIMITS.time) : 0,
    augments: augments.slice(0, TOWER_AUGMENTS).map(id => String(id).slice(0, 32)),   // the augments taken, in order
  };
}

/** Why the rules would refuse a climb's entry (null when they'd take it). `thisWeek` is the Monday it's posted in: the
    entry's week is this one or the last (a climb started on a Sunday can end on Monday). */
export function checkTowerEntry(e, thisWeek) {
  if (!e || typeof e !== 'object') return 'no entry';
  const extra = Object.keys(e).filter(k => !TOWER_KEYS.includes(k));
  if (extra.length) return `unknown field ${extra[0]}`;
  if (typeof e.week !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(e.week)) return 'bad week';
  if (![dayOffset(thisWeek, -7), thisWeek].includes(e.week)) return 'week too far from now';
  if (typeof e.uid !== 'string' || !e.uid) return 'no uid';
  if (typeof e.name !== 'string' || !e.name || [...e.name].length > NAME_MAX) return 'bad name';
  if (typeof e.starter !== 'string' || !e.starter || e.starter.length > 32) return 'bad starter';
  for (const key of Object.keys(TOWER_LIMITS)) if (!inRange(e[key], TOWER_LIMITS[key])) return `bad ${key}`;
  if ('augments' in e && (!Array.isArray(e.augments) || e.augments.length > TOWER_AUGMENTS || e.augments.some(a => typeof a !== 'string' || !a || a.length > 32))) return 'bad augments';
  return null;
}

/** A week's climbs as one board, highest floor first (then fewer turns, then the faster climb, then the earlier post). */
export function rankTower(entries, uid, top = BOARD_TOP) {
  const rows = entries.filter(e => e && typeof e === 'object')
    .sort((a, b) => b.floor - a.floor || a.turns - b.turns || a.time - b.time || when(a.at) - when(b.at))
    .map((entry, i) => ({ rank: i + 1, entry, mine: Boolean(uid) && entry.uid === uid }));
  const me = rows.slice(top).find(r => r.mine) || null;
  return [{ id: 'floor', name: 'Highest floor', rows: rows.slice(0, top), me, total: rows.length }];
}
