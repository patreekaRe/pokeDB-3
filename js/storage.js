/* ============================================================
   storage.js  -  saving and loading with localStorage.

   localStorage is a tiny key/value box that lives in the browser and
   survives closing the tab. It only stores text, so we turn our data
   into text with JSON.stringify and back with JSON.parse.

   What we save is your long-term progress (stats and unlocked starters).
   A run in progress is not saved yet: close the tab and the run is lost.

   Everything is wrapped in try/catch because localStorage can be
   blocked (private windows, strict settings). If it fails the game
   still works, it just can't remember anything.
   ============================================================ */

const KEY = 'pokedb.save.v2';

const freshSave = () => ({
  seenHelp: false,
  unlocked: [],              // ids of starters unlocked by achievements
  stats: {
    runsStarted: 0,
    runsWon: 0,
    enemiesDefeated: 0,
    bossesDefeated: {},      // { 1: true, 2: true, 3: true } by biome number
    winsBy: {},              // run wins per starter, e.g. { charmander: 2 }
    noDamageBoss: false,     // beat a boss without taking damage
    noRestWin: false,        // won a run without resting
  },
});

let data = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      const base = freshSave();
      return { ...base, ...saved, stats: { ...base.stats, ...saved.stats } };
    }
  } catch (err) { /* blocked or corrupted: fall through to a fresh save */ }
  return freshSave();
}

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); }
  catch (err) { /* storage is full or blocked: ignore */ }
}

/** Read-only look at the whole save. */
export const getSave = () => data;

/** Change the save with a callback, then write it to disk. */
export function updateSave(change) {
  change(data);
  persist();
}

export function resetSave() {
  data = freshSave();
  persist();
}
