/* ============================================================
   tower.js  -  the Sky Pillar's rules (roadmap item 18, the user's calls 2026-10-05).

   A climb of 100 floors, a floor at a time. Floors come in flights of 10:
   nine landings, each with 2-3 doors to pick from (fight, Alpha, Mart,
   Center, ? event), then a guardian on every 10th floor. Floors 1-30 climb
   through the three biomes' Pokémon and numbers in order; past 30 they come
   from all three, and every flight adds PAST_TOP on top of the Wastes'
   numbers, so most climbs end part-way. Rayquaza guards the top, floor 100:
   beating it wins the climb (the user's call, 2026-10-05: no endless mode).

   The week deals the tower: one seed and one starter for everyone. The
   week's first try is the leaderboard's (played without perks, like the
   Safari's); replays and practice with your own starters don't post.
   The game (js/run.js) and the bot (pokeDB-sim) both play from here.
   ============================================================ */

import { BIOMES } from './enemies.js';
import { runMods } from './difficulty.js';
import { safariStarters } from './safari.js';
import { STARTERS } from './starters.js';
import { hashString, makeRng, pickOne, random, shuffled } from '../rng.js';

export const FLIGHT = 10;                // floors a flight: its landings, then the guardian
export const LANDINGS = FLIGHT - 1;
export const GUARDIAN_HEAL = 0.3;        // of max HP, after every guardian (the user's call)
export const TOP_FLOOR = 100;            // Rayquaza's floor, the summit: the climb is won there
export const TOP_FLIGHT = TOP_FLOOR / FLIGHT - 1;
export const RAYQUAZA = 'rayquaza-guardian';
export const PAST_TOP = { hp: 1.35, dmg: 8, dmgMult: 1.15 };   // every flight past the third: enemy HP x1.35, +8 damage, then every attack x1.15, compounding (bot-tuned: x1.15 / +4 let the human bot's median climb reach 45; without dmgMult Grass's healing outgrew it, median 56, 24% to floor 100)
export const DOOR_ODDS = { fight: 50, elite: 14, event: 16, shop: 10, rest: 10 };
export const TOWER_BADGE_FLOORS = [25, 50, 100];

/** The Sky Pillar opens once you've won a run. */
export const towerOpen = (save) => (save.stats?.runsWon || 0) >= 1 || (save.hallOfFame || []).length > 0;

/** A date's week, as its Monday ("YYYY-MM-DD", UTC): the tower changes at Monday 00:00 UTC for everyone. */
export function towerWeek(date = new Date()) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

/** A week moved n weeks. */
export function weekOffset(week, n) {
  const d = new Date(`${week}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 7 * n);
  return d.toISOString().slice(0, 10);
}

export const towerSeed = (week) => hashString(`tower:${week}`);

/** The week's tower: its seed and the starter everyone climbs with (the Safari's pool: never Mewtwo or Rayquaza). */
export function towerWeekly(week = towerWeek(), starters = STARTERS) {
  const seed = towerSeed(week);
  const starter = pickOne(safariStarters(starters), makeRng(hashString(`${seed}|starter`)));
  return { week, seed, starter };
}

/** The floor number of a landing (0-based within its flight), or of the flight's guardian (landing = LANDINGS). */
export const floorOf = (flight, landing) => flight * FLIGHT + landing + 1;

/** Which biome's Pokémon, numbers and scenery a flight uses: the Clearing, the Shrine, then the Wastes from floor 21 up. */
export const towerBiome = (flight) => Math.min(flight, 2);

/** A flight's rules: Level 0's at its biome, then PAST_TOP for every flight past the third. */
export function towerMods(starter, flight) {
  const mods = runMods(starter, 0, towerBiome(flight));
  const k = Math.max(0, flight - 2);
  return { ...mods, normalHp: mods.normalHp * PAST_TOP.hp ** k, bossHp: mods.bossHp * PAST_TOP.hp ** k, enemyDmg: mods.enemyDmg + PAST_TOP.dmg * k,
    enemyDmgMult: (mods.enemyDmgMult ?? 1) * PAST_TOP.dmgMult ** k };
}

function roll(odds) {
  const total = Object.values(odds).reduce((a, b) => a + b, 0);
  let r = random() * total;
  for (const [type, w] of Object.entries(odds)) if ((r -= w) < 0) return type;
  return 'fight';
}

/** A flight's landings: for each, the room types behind its doors (2 or 3), rolled with js/rng.js (the week's seed).
    Every landing has a fight; no Alpha before floor 3 and no Center on floor 1; one Mart, one Center and one ? at most a
    landing; a Mart somewhere in every flight; and a Center beside the last landing's doors, before the guardian. */
export function landingTypes(flight) {
  const rows = [];
  let shops = 0;
  for (let i = 0; i < LANDINGS; i++) {
    const floor = floorOf(flight, i), last = i === LANDINGS - 1;
    const doors = last || random() < 0.65 ? 3 : 2;
    const row = ['fight'];
    if (last) row.push('rest');
    while (row.length < doors) {
      const odds = { ...DOOR_ODDS };
      if (floor <= 2 || row.includes('elite')) odds.elite = 0;
      if (floor === 1) odds.rest = 0;
      for (const t of ['shop', 'rest', 'event']) if (row.includes(t)) odds[t] = 0;
      row.push(roll(odds));
    }
    if (i === LANDINGS - 3 && !shops && !row.includes('shop')) row[row.length - 1] = 'shop';
    if (row.includes('shop')) shops += 1;
    rows.push(shuffled(row));
  }
  return rows;
}

/** The guardian of a flight: Rayquaza on the top floor, else a boss of the biome the flight's number points at
    (Clearing, Shrine, Wastes, round again). */
export function guardianOf(flight) {
  if (flight >= TOP_FLIGHT) return RAYQUAZA;
  return pickOne(BIOMES[flight % 3].bosses);
}

const MAIN = BIOMES.filter(b => !b.secret);
/** Who a flight's fights and Alphas are dealt from: null keeps the biome's own; past floor 30, all three biomes'. */
export const towerPools = (flight) => (flight < 3 ? { normals: null, elites: null }
  : { normals: MAIN.flatMap(b => b.normals), elites: MAIN.flatMap(b => b.elites) });

/** The Tower Badges a floor has earned. */
export const towerBadges = (floor) => TOWER_BADGE_FLOORS.filter(f => floor >= f);
