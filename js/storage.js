/* ============================================================
   storage.js  -  saving and loading with localStorage.

   localStorage is a tiny key/value box that lives in the browser and
   survives closing the tab. It only stores text, so we turn our data
   into text with JSON.stringify and back with JSON.parse.

   What we save is your long-term progress: stats, PokéCoins, shop
   purchases and unlocked starters. The run in progress is saved
   separately (see the bottom of this file) each time the map is shown.

   Everything is wrapped in try/catch because localStorage can be
   blocked (private windows, strict settings). If it fails the game
   still works, it just can't remember anything.
   ============================================================ */

import { RENAMED_STARTERS } from './data/starters.js';

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
    lightRestWin: false,      // won a run resting at most 3 times (at most 1 before, which still counts)
  },
});

let data = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      const base = freshSave();
      const merged = {
        ...base, ...saved,
        passives: { ...base.passives, ...saved.passives },
        stats: {
          ...base.stats, ...saved.stats,
          maxLevelWinByType: { ...base.stats.maxLevelWinByType, ...(saved.stats && saved.stats.maxLevelWinByType) },
        },
      };
      return renameStarters(merged);
    }
  } catch (err) { /* blocked or corrupted: fall through to a fresh save */ }
  return freshSave();
}

/** A starter that was swapped out (Shaymin -> Virizion) carries its unlock and wins over to the new one. */
function renameStarters(save) {
  for (const [from, to] of Object.entries(RENAMED_STARTERS)) {
    if (save.unlocked.includes(from)) save.unlocked = [...new Set(save.unlocked.map(id => (id === from ? to : id)))];
    if (save.stats.winsBy[from]) {
      save.stats.winsBy[to] = (save.stats.winsBy[to] || 0) + save.stats.winsBy[from];
      delete save.stats.winsBy[from];
    }
  }
  return save;
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

/** How many PokéCoins an amount is worth after the Coin Finder passive. */
export const coinsWithBonus = (amount) => Math.round(amount * (data.passives.coinFinder ? 1.15 : 1));

/** Give the player PokéCoins, boosted by the Coin Finder passive if they own it. */
export function awardCoins(amount) {
  const total = coinsWithBonus(amount);
  updateSave(d => { d.coins += total; });
  return total;
}

export function resetSave() {
  data = freshSave();
  persist();
}

/* ---------- the run in progress ----------
   Kept under its own key so a broken or outdated run save can be thrown
   away without touching your long-term progress. run.js decides what goes in. */

const RUN_KEY = 'pokedb.run.v1';

export function saveRunData(saved) {
  try { localStorage.setItem(RUN_KEY, JSON.stringify(saved)); }
  catch (err) { /* storage is full or blocked: ignore */ }
}

/** The saved run as plain data, or null if there isn't one (or it can't be read). */
export function loadRunData() {
  try {
    const raw = localStorage.getItem(RUN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) { return null; }
}

export function clearRunData() {
  try { localStorage.removeItem(RUN_KEY); }
  catch (err) { /* blocked: nothing to clear */ }
}
