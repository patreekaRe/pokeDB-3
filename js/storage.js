/* ============================================================
   storage.js  -  saving and loading with localStorage.

   localStorage is a tiny key/value box that lives in the browser and
   survives closing the tab. It only stores text, so we turn our data
   into text with JSON.stringify and back with JSON.parse.

   Everything is wrapped in try/catch because localStorage can be
   blocked (private windows, strict settings). If it fails the game
   still works, it just can't remember anything.
   ============================================================ */

const KEY = 'pokedb.save.v1';
export const DECK_SLOTS = 3;

const freshSave = () => ({
  wins: 0,
  losses: 0,
  streak: 0,
  bestStreak: 0,
  seenHelp: false,
  decks: {},        // per starter: { current: [cardIds], slots: [[ids] | null, ...] }
});

let data = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...freshSave(), ...JSON.parse(raw) };
  } catch (err) { /* blocked or corrupted: fall through to a fresh save */ }
  return freshSave();
}

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); }
  catch (err) { /* storage is full or blocked: ignore */ }
}

/** Read-only look at the whole save (progress numbers, etc). */
export const getSave = () => data;

/** Change the save with a callback, then write it to disk. */
export function updateSave(change) {
  change(data);
  persist();
}

/* ---------- decks ---------- */

function deckRecord(starterId) {
  if (!data.decks[starterId]) {
    data.decks[starterId] = { current: null, slots: Array(DECK_SLOTS).fill(null) };
  }
  return data.decks[starterId];
}

/** The deck you were last editing for this starter, or null if none yet. */
export const getCurrentDeck = (starterId) => deckRecord(starterId).current;

export function setCurrentDeck(starterId, cardIds) {
  updateSave(() => { deckRecord(starterId).current = [...cardIds]; });
}

export const getSlots = (starterId) => deckRecord(starterId).slots;

export function saveToSlot(starterId, slot, cardIds) {
  updateSave(() => { deckRecord(starterId).slots[slot] = [...cardIds]; });
}

/* ---------- results ---------- */

export function recordResult(won) {
  updateSave(d => {
    if (won) {
      d.wins += 1;
      d.streak += 1;
      d.bestStreak = Math.max(d.bestStreak, d.streak);
    } else {
      d.losses += 1;
      d.streak = 0;
    }
  });
}

export function resetSave() {
  data = freshSave();
  persist();
}
