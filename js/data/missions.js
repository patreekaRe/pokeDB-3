/* ============================================================
   missions.js  -  daily and weekly missions (2026-10-11, the user's ask: more ways to earn PokéCoins). Three daily
   missions a UTC day and three weekly ones a week (its Monday, UTC, like the Sky Pillar's), each a goal counted from
   ordinary play (fights won, Alphas, bosses, moves played...) and paid in PokéCoins, claimed at the Clearing's PC
   (js/missions.js keeps the save; this file is pure, for tests/missions.test.mjs). Finishing all three pays a bonus.
   A mission is { id, text ({n} is its goal), n, coins, on: the event it counts, when(ctx) to count only some, distinct(ctx) to
   count each different value once (a type, a day), needs(save)
   to be offered only once its mode is open }. Two missions of one roll never count the same event.
   ============================================================ */

import { hashString, makeRng, shuffled } from '../rng.js';
import { towerOpen, towerWeek } from './tower.js';
import { safariOpen } from './pokedex.js';
import { safariDay } from './safari.js';
import { roadsOpen } from './enemies.js';
import { STARTERS_BY_ID } from './starters.js';

/** Missions a day and a week. */
export const PER_ROLL = 3;
/** Finishing all of a day's or a week's missions pays this much more. */
export const BONUS = { daily: 60, weekly: 300 };

const typed = (type) => (ctx) => ctx.type === type;
const levelAtLeast = (lv) => (ctx) => !ctx.safari && (ctx.level ?? 0) >= lv;
const hasLevel = (lv) => (save) => (save.maxLevel || 0) >= lv;
const hasSpecial = (save) => (save.unlocked || []).some(id => STARTERS_BY_ID[id] && !STARTERS_BY_ID[id].free);

export const DAILY = [
  { id: 'd-fights', text: 'Win {n} fights', n: 8, coins: 40, on: 'fight' },
  { id: 'd-alphas', text: 'Beat {n} Alphas', n: 2, coins: 50, on: 'alpha' },
  { id: 'd-boss', text: 'Beat a boss or a Sky Pillar guardian', n: 1, coins: 60, on: 'boss' },
  { id: 'd-damage', text: 'Deal {n} damage', n: 800, coins: 45, on: 'damage' },
  { id: 'd-events', text: 'Explore {n} ❓ rooms', n: 2, coins: 35, on: 'event' },
  { id: 'd-rest', text: 'Heal at a Pokémon Center', n: 1, coins: 30, on: 'rest' },
  { id: 'd-fire', text: 'Win {n} fights with a Fire Pokémon', n: 5, coins: 45, on: 'fight-type', when: typed('fire') },
  { id: 'd-grass', text: 'Win {n} fights with a Grass Pokémon', n: 5, coins: 45, on: 'fight-type', when: typed('grass') },
  { id: 'd-water', text: 'Win {n} fights with a Water Pokémon', n: 5, coins: 45, on: 'fight-type', when: typed('water') },
  { id: 'd-catch', text: 'Catch {n} Pokémon in the Safari Zone', n: 3, coins: 50, on: 'catch', needs: safariOpen },
  { id: 'd-floors', text: 'Climb {n} Sky Pillar floors', n: 10, coins: 50, on: 'floor', needs: towerOpen },
  // the second batch (2026-10-11, the user's call: a pool of 25), asking to play differently, not only more
  { id: 'd-flawless', text: 'Win a fight without losing any HP', n: 1, coins: 45, on: 'flawless' },
  { id: 'd-bighit', text: 'Deal 30 damage or more in one hit', n: 1, coins: 40, on: 'big-hit' },
  { id: 'd-quick', text: 'Win {n} fights in 2 turns or fewer', n: 3, coins: 45, on: 'quick' },
  { id: 'd-tough', text: 'Win {n} fights against a type strong against yours', n: 2, coins: 50, on: 'tough' },
  { id: 'd-healthy', text: 'Beat a boss with over half your HP left', n: 1, coins: 60, on: 'healthy-boss' },
  { id: 'd-biome', text: 'Reach the second biome of a run', n: 1, coins: 40, on: 'biome' },
  { id: 'd-learn', text: 'Learn {n} new moves', n: 4, coins: 35, on: 'learn' },
  { id: 'd-relics', text: 'Find {n} relics', n: 2, coins: 45, on: 'relic' },
  { id: 'd-upgrade', text: 'PP Up {n} moves', n: 2, coins: 40, on: 'upgrade' },
  { id: 'd-mart', text: 'Buy {n} things at a Poké Mart', n: 2, coins: 35, on: 'mart' },
  { id: 'd-safari', text: 'Play the Safari Zone', n: 1, coins: 40, on: 'safari', needs: safariOpen },
  // the third batch (the user's call, same day): the game's own mechanics, in place of Spend ₽, Use items and Play moves
  { id: 'd-tide', text: 'Build 10 Tide in one fight', n: 1, coins: 45, on: 'tide-fight' },
  { id: 'd-burn', text: 'Apply 15 Burn in one fight', n: 1, coins: 45, on: 'burn-fight' },
  { id: 'd-seed', text: 'Drain {n} HP with Leech Seed', n: 30, coins: 45, on: 'seed' },
  { id: 'd-powers', text: 'Play {n} Power cards', n: 3, coins: 40, on: 'power' },
  { id: 'd-exhaust', text: 'Exhaust {n} cards', n: 5, coins: 40, on: 'exhaust' },
  { id: 'd-forget', text: 'Forget a move', n: 1, coins: 30, on: 'forget' },
  { id: 'd-special', text: 'Win {n} fights with a skin or legendary starter', n: 3, coins: 45, on: 'fight-special', when: (ctx) => ctx.special, needs: hasSpecial },
];

export const WEEKLY = [
  { id: 'w-wins', text: 'Win {n} runs', n: 2, coins: 250, on: 'win' },
  { id: 'w-level', text: 'Win a run on Trainer Level 3 or higher', n: 1, coins: 300, on: 'win-level', when: levelAtLeast(3), needs: hasLevel(3) },
  { id: 'w-bosses', text: 'Beat {n} bosses or guardians', n: 6, coins: 200, on: 'boss' },
  { id: 'w-alphas', text: 'Beat {n} Alphas', n: 10, coins: 200, on: 'alpha' },
  { id: 'w-fights', text: 'Win {n} fights', n: 50, coins: 200, on: 'fight' },
  { id: 'w-damage', text: 'Deal {n} damage', n: 6000, coins: 200, on: 'damage' },
  { id: 'w-events', text: 'Explore {n} ❓ rooms', n: 10, coins: 180, on: 'event' },
  { id: 'w-dailies', text: 'Complete {n} daily missions', n: 9, coins: 250, on: 'daily' },
  { id: 'w-catch', text: 'Catch {n} Pokémon in the Safari Zone', n: 15, coins: 250, on: 'catch', needs: safariOpen },
  { id: 'w-floors', text: 'Climb {n} Sky Pillar floors', n: 40, coins: 250, on: 'floor', needs: towerOpen },
  { id: 'w-types', text: 'Win runs with {n} different types', n: 2, coins: 300, on: 'win-type', distinct: (ctx) => ctx.type },
  { id: 'w-norest', text: 'Win a run without healing at a Pokémon Center', n: 1, coins: 300, on: 'win-norest', when: (ctx) => !ctx.rests },
  { id: 'w-road', text: 'Win a run that took the other road at a crossroads', n: 1, coins: 300, on: 'win-road', when: (ctx) => ctx.road, needs: (save) => roadsOpen(save.stats) },
  { id: 'w-height', text: 'Reach floor 30 of the Sky Pillar in one climb', n: 1, coins: 300, on: 'tower-30', needs: towerOpen },
  { id: 'w-safaridays', text: 'Play the Safari Zone on {n} different days', n: 3, coins: 250, on: 'safari', distinct: (ctx) => ctx.day, needs: safariOpen },
];

export const MISSIONS_BY_ID = Object.fromEntries([...DAILY, ...WEEKLY].map(m => [m.id, m]));

/** A mission's line, its goal filled in. */
export const missionText = (m) => m.text.replace('{n}', m.n.toLocaleString('en-US'));

/** The day ("YYYY-MM-DD", UTC, the Safari's) and the week (its Monday, the Sky Pillar's) a date falls in. */
export const missionDay = (date = new Date()) => safariDay(date);
export const missionWeek = (date = new Date()) => towerWeek(date);

/** The missions of a day or a week: PER_ROLL of the pool open to this save, from the date's seed, never two on one event. */
export function rollMissions(kind, key, save) {
  const pool = (kind === 'daily' ? DAILY : WEEKLY).filter(m => !m.needs || m.needs(save));
  const out = [], events = new Set();
  for (const m of shuffled(pool, makeRng(hashString(`missions:${kind}:${key}`)))) {
    if (events.has(m.on)) continue;
    events.add(m.on);
    out.push(m.id);
    if (out.length === PER_ROLL) break;
  }
  return out;
}

/** A fresh roll's record in the save: each mission's count so far and whether it's been paid. */
export const freshRoll = (kind, key, save) => ({ key, list: rollMissions(kind, key, save).map(id => ({ id, got: 0, claimed: false })), bonus: false });

/** Add `amount` of `event` to a roll's missions. Returns the ones it just finished. */
export function countInto(roll, event, amount, ctx = {}) {
  const done = [];
  for (const entry of roll.list) {
    const m = MISSIONS_BY_ID[entry.id];
    if (!m || m.on !== event || (m.when && !m.when(ctx)) || entry.got >= m.n) continue;
    if (m.distinct) {   // counts each different type, day... once
      const key = m.distinct(ctx);
      if (key == null || (entry.keys || []).includes(key)) continue;
      entry.keys = [...(entry.keys || []), key];
    }
    entry.got = Math.min(m.n, entry.got + (m.distinct ? 1 : amount));
    if (entry.got >= m.n) done.push(m);
  }
  return done;
}

export const isDone = (entry) => entry.got >= (MISSIONS_BY_ID[entry.id]?.n ?? Infinity);
/** Every mission of the roll done and paid: its bonus is ready. */
export const bonusReady = (roll) => !roll.bonus && roll.list.length > 0 && roll.list.every(e => e.claimed);
