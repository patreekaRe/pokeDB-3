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
export const boardValue = (id, e) => (id === 'fastest' ? formatTime(e.time) : id === 'turns' ? `${e.turns} turn${e.turns === 1 ? '' : 's'}` : `${e.caught} caught`);

/** A Safari run's line to copy and share, e.g. "Safari 2026-10-03: 4 caught, floor 11 (Wetland)". */
export function shareLine({ day, won, caught = 0, floor, floors, area, first = true }) {
  const end = won ? `crossed all ${floors} floors!` : `floor ${floor}/${floors}${area ? ` (${area})` : ''}`;
  return `Safari ${day}: ${caught} caught, ${end}${first ? '' : ' (replay)'}`;
}
