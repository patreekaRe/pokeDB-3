/* ============================================================
   missions.js  -  daily and weekly missions (2026-10-11, the user's ask: more ways to earn PokéCoins). Three daily
   missions a UTC day and three weekly ones a week (its Monday, UTC, like the Sky Pillar's), each a goal counted from
   ordinary play (fights won, Alphas, bosses, moves played...) and paid in PokéCoins, claimed at the Clearing's PC
   (js/missions.js keeps the save; this file is pure, for tests/missions.test.mjs). Finishing all three pays a bonus.
   A mission is { id, text ({n} is its goal), n, tier (its coins), on: the event it counts, when(ctx) to count only some,
   distinct(ctx) to count each different value once (a type, a day), needs(save) to be offered only once its mode is
   open, group }. A roll is one mission a tier, never two on one event or one group.
   ============================================================ */

import { hashString, makeRng, shuffled } from '../rng.js';
import { towerOpen, towerWeek } from './tower.js';
import { safariOpen } from './pokedex.js';
import { safariDay } from './safari.js';
import { roadsOpen } from './enemies.js';
import { STARTERS_BY_ID } from './starters.js';

/** Missions a day and a week: one of each tier. */
export const PER_ROLL = 3;
/** What each tier pays, and the bonus for claiming all three of a roll. */
export const TIER_COINS = { daily: [30, 45, 65], weekly: [200, 250, 300] };
export const BONUS = { daily: 60, weekly: 250 };

const typed = (type) => (ctx) => ctx.type === type;
const levelAtLeast = (lv) => (ctx) => !ctx.safari && (ctx.level ?? 0) >= lv;
const hasLevel = (lv) => (save) => (save.maxLevel || 0) >= lv;
const hasSpecial = (save) => (save.unlocked || []).some(id => STARTERS_BY_ID[id] && !STARTERS_BY_ID[id].free);

/* Goals are set from the human-like bot at Level 0 (pokeDB-sim, 150 runs a type, 2026-10-11): a run is ~17 fights, ~2.5
   Alphas and 3 bosses for it, ~6 fights in the first biome. Tier 0 (easy) is done in a first biome, tier 1 (medium)
   about a run into biome 2, tier 2 (hard) one good run. A `group` keeps a roll from asking for two of a kind: two
   type-locked goals (a day is played with one type), two bosses, two modes, or two run wins in a week. */
const D = (tier, m) => ({ ...m, tier, coins: TIER_COINS.daily[tier] });
const W = (tier, m) => ({ ...m, tier, coins: TIER_COINS.weekly[tier] });

export const DAILY = [
  D(0, { id: 'd-fights', text: 'Win {n} fights', n: 6, on: 'fight' }),
  D(0, { id: 'd-flawless', text: 'Win a fight without losing any HP', n: 1, on: 'flawless' }),
  D(0, { id: 'd-quick', text: 'Win {n} fights in 4 turns or fewer', n: 2, on: 'quick' }),
  D(0, { id: 'd-events', text: 'Explore {n} ❓ rooms', n: 2, on: 'event' }),
  D(0, { id: 'd-learn', text: 'Learn {n} new moves', n: 3, on: 'learn' }),
  D(0, { id: 'd-mart', text: 'Buy {n} things at a Poké Mart', n: 2, on: 'mart' }),
  D(0, { id: 'd-forget', text: 'Forget a move', n: 1, on: 'forget' }),
  D(0, { id: 'd-fire', text: 'Win {n} fights with a Fire Pokémon', n: 5, on: 'fight-type', when: typed('fire'), group: 'type' }),
  D(0, { id: 'd-grass', text: 'Win {n} fights with a Grass Pokémon', n: 5, on: 'fight-type', when: typed('grass'), group: 'type' }),
  D(0, { id: 'd-water', text: 'Win {n} fights with a Water Pokémon', n: 5, on: 'fight-type', when: typed('water'), group: 'type' }),
  D(0, { id: 'd-special', text: 'Win {n} fights with a skin or legendary starter', n: 4, on: 'fight-special', when: (ctx) => ctx.special, needs: hasSpecial, group: 'type' }),
  D(0, { id: 'd-safari', text: 'Play the Safari Zone', n: 1, on: 'safari', needs: safariOpen, group: 'mode' }),

  D(1, { id: 'd-alphas', text: 'Beat {n} Alphas', n: 2, on: 'alpha' }),
  D(1, { id: 'd-boss', text: 'Beat a boss or a Sky Pillar guardian', n: 1, on: 'boss', group: 'boss' }),
  D(1, { id: 'd-healthy', text: 'Beat a boss with over half your HP left', n: 1, on: 'healthy-boss', group: 'boss' }),
  D(1, { id: 'd-damage', text: 'Deal {n} damage', n: 1000, on: 'damage' }),
  D(1, { id: 'd-relics', text: 'Find {n} relics', n: 2, on: 'relic' }),
  D(1, { id: 'd-upgrade', text: 'PP Up {n} moves', n: 2, on: 'upgrade' }),
  D(1, { id: 'd-tough', text: 'Win {n} fights against a type strong against yours', n: 2, on: 'tough' }),
  D(1, { id: 'd-powers', text: 'Play {n} Power cards', n: 2, on: 'power' }),
  D(1, { id: 'd-exhaust', text: 'Exhaust {n} cards', n: 10, on: 'exhaust' }),
  D(1, { id: 'd-seed', text: 'Drain {n} HP with Leech Seed', n: 60, on: 'seed', group: 'type' }),
  D(1, { id: 'd-catch', text: 'Catch {n} Pokémon in the Safari Zone', n: 3, on: 'catch', needs: safariOpen, group: 'mode' }),
  D(1, { id: 'd-floors', text: 'Climb {n} Sky Pillar floors', n: 10, on: 'floor', needs: towerOpen, group: 'mode' }),

  D(2, { id: 'd-fights2', text: 'Win {n} fights', n: 12, on: 'fight' }),
  D(2, { id: 'd-bosses', text: 'Beat {n} bosses or Sky Pillar guardians', n: 2, on: 'boss', group: 'boss' }),
  D(2, { id: 'd-bighit', text: 'Deal 50 damage or more in one hit', n: 1, on: 'big-hit' }),
  D(2, { id: 'd-tide', text: 'Build 20 Tide in one fight', n: 1, on: 'tide-fight', group: 'type' }),
  D(2, { id: 'd-burn', text: 'Apply 40 Burn in one fight', n: 1, on: 'burn-fight', group: 'type' }),
  D(2, { id: 'd-alphas2', text: 'Beat {n} Alphas', n: 4, on: 'alpha' }),
  D(2, { id: 'd-floors2', text: 'Climb {n} Sky Pillar floors', n: 20, on: 'floor', needs: towerOpen, group: 'mode' }),
];

export const WEEKLY = [
  W(0, { id: 'w-fights', text: 'Win {n} fights', n: 40, on: 'fight' }),
  W(0, { id: 'w-alphas', text: 'Beat {n} Alphas', n: 8, on: 'alpha' }),
  W(0, { id: 'w-bosses', text: 'Beat {n} bosses or guardians', n: 5, on: 'boss' }),
  W(0, { id: 'w-damage', text: 'Deal {n} damage', n: 5000, on: 'damage' }),
  W(0, { id: 'w-events', text: 'Explore {n} ❓ rooms', n: 8, on: 'event' }),

  W(1, { id: 'w-dailies', text: 'Complete {n} daily missions', n: 9, on: 'daily' }),
  W(1, { id: 'w-wins', text: 'Win {n} runs', n: 2, on: 'win', group: 'win' }),
  W(1, { id: 'w-types', text: 'Win runs with {n} different types', n: 2, on: 'win-type', distinct: (ctx) => ctx.type, group: 'win' }),
  W(1, { id: 'w-road', text: 'Win a run that took the other road at a crossroads', n: 1, on: 'win-road', when: (ctx) => ctx.road, needs: (save) => roadsOpen(save.stats), group: 'win' }),
  W(1, { id: 'w-catch', text: 'Catch {n} Pokémon in the Safari Zone', n: 15, on: 'catch', needs: safariOpen, group: 'mode' }),
  W(1, { id: 'w-safaridays', text: 'Play the Safari Zone on {n} different days', n: 3, on: 'safari', distinct: (ctx) => ctx.day, needs: safariOpen, group: 'mode' }),
  W(1, { id: 'w-floors', text: 'Climb {n} Sky Pillar floors', n: 40, on: 'floor', needs: towerOpen, group: 'mode' }),

  W(2, { id: 'w-level', text: 'Win a run on Trainer Level 3 or higher', n: 1, on: 'win-level', when: levelAtLeast(3), needs: hasLevel(3), group: 'win' }),
  W(2, { id: 'w-norest', text: 'Win a run without healing at a Pokémon Center', n: 1, on: 'win-norest', when: (ctx) => !ctx.rests, group: 'win' }),
  W(2, { id: 'w-height', text: 'Reach floor 30 of the Sky Pillar in one climb', n: 1, on: 'tower-30', needs: towerOpen, group: 'mode' }),
  W(2, { id: 'w-alphas2', text: 'Beat {n} Alphas', n: 14, on: 'alpha' }),
];

export const MISSIONS_BY_ID = Object.fromEntries([...DAILY, ...WEEKLY].map(m => [m.id, m]));

/** A mission's line, its goal filled in. */
export const missionText = (m) => m.text.replace('{n}', m.n.toLocaleString('en-US'));

/** The day ("YYYY-MM-DD", UTC, the Safari's) and the week (its Monday, the Sky Pillar's) a date falls in. */
export const missionDay = (date = new Date()) => safariDay(date);
export const missionWeek = (date = new Date()) => towerWeek(date);

/** The missions of a day or a week, one a tier, from the date's seed and the pool open to this save: the hard one is
    picked first, then the others never share its event or group (if nothing else is left, the group gives way). */
export function rollMissions(kind, key, save) {
  const pool = (kind === 'daily' ? DAILY : WEEKLY).filter(m => !m.needs || m.needs(save));
  const order = shuffled(pool, makeRng(hashString(`missions:${kind}:${key}`)));
  const picked = [];
  for (const tier of [2, 1, 0]) {
    const free = (m, strict) => m.tier === tier && !picked.some(p => p.on === m.on || (strict && p.group && p.group === m.group));
    const m = order.find(x => free(x, true)) || order.find(x => free(x, false));
    if (m) picked.push(m);
  }
  return picked.sort((a, b) => a.tier - b.tier).map(m => m.id);
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
