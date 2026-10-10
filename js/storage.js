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

import { RENAMED_STARTERS, STARTERS } from './data/starters.js';
import { GATE_HP, seedGate } from './data/gate.js';
import { migrateBalls } from './data/balls.js';

const KEY = 'pokedb.save.v2';
const RUN_KEY = 'pokedb.run.v1';

/** The two localStorage keys, for the cloud save (js/cloud.js), which copies them as they are. */
export const SAVE_KEYS = { save: KEY, run: RUN_KEY };

const listeners = [];
/** Call fn after every write to either key (the cloud save uploads a little later). */
export const onSaveWrite = (fn) => listeners.push(fn);
const wrote = () => listeners.forEach(fn => fn());

const freshSave = () => ({
  seenHelp: false,
  trainerName: '',           // the nickname on the Trainer Card and the leaderboards (js/leaderboard.js), '' = "Trainer"
  helpTapped: false,         // the title's ? bubble on New game hops until it's first tapped
  muted: false,              // background music switched off with the 🔊 button
  volume: 1,                 // the old single volume slider, 0-1: where both bars below start on an old save
  musicVolume: null,         // the 🎵 bar, 0-1 (js/audio.js squares it); null = `volume`
  sfxVolume: null,           // the 🔔 bar: effects
  cryVolume: null,           // the Cries bar; null = `sfxVolume` (cries went with effects before it had a bar)
  battleSpeed: 1,            // 1 or 2: the enemy's turn and the hit animations (battleSpeed() in js/battle.js)
  endTurnWarn: true,         // ask before ending a turn with PP left and a card you could play
  textSpeed: 'mid',          // text boxes typing: slow, mid, fast or instant (textPace() in js/settings.js)
  clock: 'auto',             // the scenes' time of day: auto (the device clock) or dawn / day / dusk / night (js/daytime.js)
  vibration: true,           // phones buzz (vibrate() in js/prefs.js)
  shell: 'red',              // the Pokédex device's colour: red, blue, yellow, green, pink or black (css/base.css)
  deckSort: 'got',           // the deck view's sort: 'got' (the order you got them), 'cost', 'name'
  deckFilter: 'all',         // and its filter: 'all', 'attack', 'skill', 'power'
  maxLevel: 0,               // the highest Trainer Level you have unlocked (see data/difficulty.js)
  unlocked: [],               // ids of starters unlocked, either by achievement OR by buying them in the shop
  coins: 0,                  // PokéCoins: the shop currency (see data/shop.js)
  passives: {                 // permanent perks bought in the shop (see data/shop.js)
    hpBoost: 0,               // stacks of "+5 max HP" (0-3)
    relicCharm: false,        // start every run holding one random common relic
    wellFed: false,           // Pokémon Centers heal +5% more
    coinFinder: false,        // +15% PokéCoins from every source
    bagPocket: false,         // the Bag holds one more item
    martCard: 0,              // Poké Mart prices lower (levels 0-3, MART_DISCOUNT)
    tutorNotes: 0,            // PP Up this many starting moves at the start of a run (0-2)
    scoutReport: false,       // card rewards offer 4 moves
    scopeUpgrade: 0,          // the Silph Scope reveals 1 more room a biome per level (0-2); needs a complete Pokédex
  },
  shiny: { owned: [], on: [] },   // starters whose shiny colours were bought, and those switched on
  seen: { relics: [], items: [], cards: [] },   // ids met in a run (offered, found, drawn), unlocked in the Index; others show as silhouettes
  newFinds: { relics: [], items: [], cards: [] },   // seen ids the Collection hasn't shown yet: each wears a "!" there till looked at (js/collection.js)
  dex: { seen: [], defeated: [], done: [], count: {}, complete: false },
  gateHp: GATE_HP,            // the Sealed Gate's HP (js/data/gate.js); 0 = broken, Mewtwo free. Old saves: seedGate()
  gateSeen: false,            // the gate's scene has played once, so its story is told (js/gatescene.js)
  travelSeen: {},             // the journey films played once, by trip ('shrine>wastes': true), so their lines have been read (js/travel.js)
  kenBeaten: false,           // Kenmatta beaten KEN_WINS times (js/run.js): every map shows his dojo's ❓ room with his face
  kenWins: 0,                 // Kenmatta's defeats, one a run at most
  badges: [],                 // BADGES ids earned (js/data/badges.js), oldest first: the Trainer Card's Badge Case
  badgesSeen: [],             // the badges the Trainer Card has shown: one not in here pops in with a shine (js/trainercard.js)
  partner: null,              // the Trainer Card's Pokémon, a key from partnerChoices() (js/trainercard.js); null picks the starter with the most wins
  buddy: null,                // who walks with you in the Clearing, the base and the mall, picked at the PC (js/pc.js): a key from buddyChoices(); null is the most-won starter's first form
  mail: [],                   // the Clearing's PC's mailbox (js/mail.js): letters with PokéCoins waiting to be claimed, newest last
  feats: [],                  // FEATS ids granted (js/data/achievements.js): Eternatus beaten, the Depths page's shiny Mewtwo
  tower: { week: null, tries: 0, best: 0, bestEver: 0, summits: 0, bestTurns: 0 },   // the Sky Pillar (js/data/tower.js): the week (its Monday), its tries (only the first counts), that try's floor, your highest floor ever (any try: the Tower Badges), climbs that reached the top, the fewest turns one took, the weeks climbed (`weeks`, missing in an old save: towerWeeks()) and guardians beaten (`guardians`, likewise: guardiansBeaten()); the augment badges' `augDex` (every augment taken), `sets` (sets completed) and `prismFloor` / `tradeFloor` (the highest floor cleared holding 3 Prismatics / trade-offs), all missing in an old save
  safari: { day: null, tries: 0 },   // the Safari Zone's day (UTC "YYYY-MM-DD"), its tries so far (only the first counts) the days played (`days`, missing in an old save: safariDays()), the day its Day Pass was bought (`pass`) and the Safari Balls left in the run under way (`balls`)
  safariDex: { seen: [], caught: [], done: [], complete: false },   // Safari Pokémon met and caught, on any try (the Safari Pokédex), the areas whose reward was paid, and Rayquaza's full dex
  balls: { great: 0, ultra: 0, owned: [], masterWeek: null },   // Poké Balls from the Game Corner (js/data/balls.js): stock per ball id, the Master Ball if owned, the week the Master Ball was thrown and its throws (`masterThrows`, missing in an old save: masterThrows())
  losses: [],                 // lost runs, a short line each (js/halloffame.js recordLoss()): where it fell and to what, newest LOSS_KEEP
  hallOfFame: [],             // every Trainer Level 5 win, oldest first (js/halloffame.js); old saves start empty   // Pokédex: enemy ids fought / beaten, biome pages whose reward was paid, defeats per id (research), and the whole-dex bonus paid
  stats: {
    runsStarted: 0,
    runsWon: 0,
    enemiesDefeated: 0,
    bossesDefeated: {},       // { 1: true, 2: true, 3: true } by biome number
    winsBy: {},               // run wins per starter, e.g. { charmander: 2 }
    maxLevelWinByType: { fire: -1, grass: -1, water: -1 },   // highest Trainer Level won with each type, -1 = never
    healthyBossWin: false,    // beat a boss with over half your HP left
    lightRestWin: false,      // won a run resting at most 3 times (at most 1 before, which still counts)
    winStreak: 0,             // runs won in a row on Level 2+ (a loss or an abandoned run resets it; Mewtwo's and the Safari's don't count)
    bestStreak: 0,            // the longest winStreak ever (Victini's goal)
    noRestWin: false,         // won a run without resting at a Pokémon Center
    maxTide: 0,               // the most Tide held at once in a fight
    bossKills: {},            // { 1: 3, 2: 1 }: times each biome's boss was beaten
    elitesDefeated: 0,        // Alphas beaten (Team Rocket's too)
    coinsEarned: 0,           // every PokéCoin ever paid out, spent or not
    deepestBiome: 0,          // the furthest biome a run reached (1-3)
    biomesSeen: [],           // every biome a run has walked into, by id (the crossroads' other roads too; the Explorer Badge's)
    level5WinsBy: {},         // Trainer Level 5 wins per starter (a gold star on its portrait); counted from the rewards' release, not seeded
    level5Jackpot: {},        // { fire: true }: the type's first Level 5 win paid LEVEL5_JACKPOT
    playMs: 0,                // play time while the page is visible, counted from the Trainer Card's release (initPlayTime())
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
        gateHp: saved.gateHp ?? seedGate(saved),
        passives: { ...base.passives, ...saved.passives },
        seen: { ...base.seen, ...saved.seen, cards: saved.seen?.cards ?? seedCards(saved) },
        newFinds: { ...base.newFinds, ...saved.newFinds },
        dex: seedCounts({ ...base.dex, ...saved.dex }),
        shiny: { ...base.shiny, ...saved.shiny },
        safariDex: { ...base.safariDex, ...saved.safariDex },
        tower: { ...base.tower, ...saved.tower },
        balls: migrateBalls({ ...base.balls, ...saved.balls }),
        stats: {
          ...base.stats, ...saved.stats,
          maxLevelWinByType: { ...base.stats.maxLevelWinByType, ...(saved.stats && saved.stats.maxLevelWinByType) },
          ...seedStats(saved.stats || {}),
        },
      };
      return renameStarters(merged);
    }
  } catch (err) { /* blocked or corrupted: fall through to a fresh save */ }
  return freshSave();
}

/** Saves from before the Index hid unmet moves: the starting decks you own and the run in progress count as met. */
function seedCards(saved) {
  const ids = STARTERS.filter(s => s.free || (saved.unlocked || []).includes(s.id)).flatMap(s => s.deck);
  try { ids.push(...(JSON.parse(localStorage.getItem(RUN_KEY))?.deck || [])); } catch (err) { /* no run */ }
  return [...new Set(ids.map(id => id.replace(/\+$/, '')))];
}

/** Saves from before the Stats revamp knew only which bosses were ever beaten: count each once, and reach that far. */
function seedStats(stats) {
  const seed = {};
  const beaten = Object.keys(stats.bossesDefeated || {}).map(Number);
  if (!stats.bossKills) seed.bossKills = Object.fromEntries(beaten.map(b => [b, 1]));
  if (stats.deepestBiome === undefined) seed.deepestBiome = stats.runsStarted ? Math.min(3, Math.max(0, ...beaten) + 1) : 0;
  if (!stats.biomesSeen) seed.biomesSeen = ['clearing', 'shrine', 'wastes', 'depths'].slice(0, seed.deepestBiome ?? stats.deepestBiome ?? 0);   // before the crossroads there was one road
  return seed;
}

/** Saves from before research levels knew only who was beaten: each counts as beaten once. */
function seedCounts(dex) {
  if (dex.count && Object.keys(dex.count).length) return dex;
  return { ...dex, count: Object.fromEntries(dex.defeated.map(id => [id, 1])) };
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
  wrote();
}

/** Play time added in memory and to the save on disk, without writing the rest of the in-memory save or waking the cloud
 * save: a page hiding just after a cloud download (or another tab) wrote a newer save must not put its old one back.
 * The cloud gets it with the next real save. */
export function addPlayTime(ms) {
  if (!(ms > 0)) return;
  data.stats.playMs = (data.stats.playMs || 0) + ms;
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (!raw) return;
    raw.stats = { ...raw.stats, playMs: (raw.stats?.playMs || 0) + ms };
    localStorage.setItem(KEY, JSON.stringify(raw));
  } catch (err) { /* blocked: the in-memory count still rides along with the next save */ }
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

/** How many levels of a Game Corner perk you own (one-level perks are saved as true/false). */
export function perkLevel(id) {
  const value = data.passives[id];
  return typeof value === 'number' ? value : (value ? 1 : 0);
}

/** Is this starter shown in its shiny colours? */
export const isShiny = (id) => data.shiny.on.includes(id);

/** Give the player PokéCoins, boosted by the Coin Finder passive if they own it. */
export function awardCoins(amount) {
  const total = coinsWithBonus(amount);
  updateSave(d => { d.coins += total; d.stats.coinsEarned += total; });
  return total;
}

/** A relic or item was met in a run (offered, sold or found): the Index shows it from now on. */
export function markSeen(kind, id) {
  if (kind === 'cards') id = id.replace(/\+$/, '');   // an upgraded copy counts as its card
  if (data.seen[kind].includes(id)) return;
  data.seen[kind].push(id);
  data.newFinds[kind].push(id);
  persist();
}

/** The Collection has shown these finds: their "!" goes. */
export function clearFinds(kind, ids) {
  const gone = new Set(ids);
  if (!data.newFinds[kind].some(id => gone.has(id))) return;
  data.newFinds[kind] = data.newFinds[kind].filter(id => !gone.has(id));
  persist();
}

/** A card or relic never met before (not in the Index yet): rewards and the Mart badge it "New!". */
export const isNew = (kind, id) => !data.seen[kind].includes(kind === 'cards' ? id.replace(/\+$/, '') : id);

/** The Safari Pokédex: `list` is 'seen' or 'caught'. Returns true the first time. */
export function markSafari(list, id) {
  if (data.safariDex[list].includes(id)) return false;
  data.safariDex[list].push(id);
  persist();
  return true;
}

/** The Pokédex: `list` is 'seen' (fought it) or 'defeated' (beat it). Returns true the first time. */
export function markDex(list, id) {
  if (data.dex[list].includes(id)) return false;
  data.dex[list].push(id);
  persist();
  return true;
}

/** One more defeat of this Pokémon for its Pokédex research. Returns the new count. */
export function countDex(id) {
  data.dex.count[id] = (data.dex.count[id] || 0) + 1;
  persist();
  return data.dex.count[id];
}

// Settings' choices (and the deck view's sort) belong to the player, not the progress: a reset keeps them
const PREF_KEYS = ['muted', 'volume', 'musicVolume', 'sfxVolume', 'cryVolume', 'battleSpeed', 'battleFx', 'endTurnWarn', 'textSpeed',
  'clock', 'calmFx', 'vibration', 'shell', 'scenery', 'titleHub', 'deckSort', 'deckFilter', 'seenHelp', 'trainerName'];

export function resetSave() {
  const kept = Object.fromEntries(PREF_KEYS.filter(k => k in data).map(k => [k, data[k]]));
  data = { ...freshSave(), ...kept };
  persist();
}

/* ---------- the run in progress ----------
   Kept under its own key so a broken or outdated run save can be thrown
   away without touching your long-term progress. run.js decides what goes in. */

export function saveRunData(saved) {
  try { localStorage.setItem(RUN_KEY, JSON.stringify(saved)); }
  catch (err) { /* storage is full or blocked: ignore */ }
  wrote();
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
  wrote();
}
