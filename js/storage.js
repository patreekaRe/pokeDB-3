/* ============================================================
   storage.js  -  saving and loading with localStorage.

   localStorage is a tiny key/value box that lives in the browser and
   survives closing the tab. It only stores text, so we turn our data
   into text with JSON.stringify and back with JSON.parse.

   What we save is your long-term progress: stats, PokéCoins, shop
   purchases and unlocked starters. A run in progress is not saved yet:
   close the tab and the run is lost.

   Everything is wrapped in try/catch because localStorage can be
   blocked (private windows, strict settings). If it fails the game
   still works, it just can't remember anything.
   ============================================================ */

const KEY = 'pokedb.save.v2';

const freshSave = () => ({
  seenHelp: false,
  muted: false,              // background music switched off with the 🔊 button
  maxLevel: 0,               // the highest Trainer Level you have unlocked (see data/difficulty.js)
  unlocked: [],               // ids of starters unlocked, either by achievement OR by buying them in the shop
  coins: 0,                  // PokéCoins: the shop currency (see data/shop.js)
  passives: {                 // permanent perks bought in the shop (see data/shop.js)
    hpBoost: 0,               // stacks of "+5 max HP" (0-3)
    relicCharm: false,        // start every run holding one random common relic
    wellFed: false,           // Pokémon Centers heal +5% more
    coinFinder: false,        // +15% PokéCoins from every source
  },
  stats: {
    runsStarted: 0,
    runsWon: 0,
    enemiesDefeated: 0,
    bossesDefeated: {},       // { 1: true, 2: true, 3: true } by biome number
    winsBy: {},               // run wins per starter, e.g. { charmander: 2 }
    maxLevelWinByType: { fire: -1, grass: -1, water: -1 },   // highest Trainer Level won with each type, -1 = never
    healthyBossWin: false,    // beat a boss with over half your HP left
    lightRestWin: false,      // won a run visiting at most 1 rest site
  },
});

let data = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      const base = freshSave();
      return {
        ...base, ...saved,
        passives: { ...base.passives, ...saved.passives },
        stats: {
          ...base.stats, ...saved.stats,
          maxLevelWinByType: { ...base.stats.maxLevelWinByType, ...(saved.stats && saved.stats.maxLevelWinByType) },
        },
      };
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

/** Give the player PokéCoins, boosted by the Coin Finder passive if they own it. */
export function awardCoins(amount) {
  const bonus = data.passives.coinFinder ? 1.15 : 1;
  const total = Math.round(amount * bonus);
  updateSave(d => { d.coins += total; });
  return total;
}

export function resetSave() {
  data = freshSave();
  persist();
}
