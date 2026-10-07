/* ============================================================
   tower.js  -  the Sky Pillar's rules (roadmap item 18, the user's calls 2026-10-05).

   A climb of 100 floors, a floor at a time. Floors come in flights of 10:
   nine landings, each with 2-3 doors to pick from (fight, Alpha, ? event;
   a Mart on the 5th, a Center on the 9th), then a guardian on every 10th floor. Floors 1-30 climb
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
export const GUARDIAN_HEAL = 0.5;        // of max HP, after every guardian (30% until the top was capped at 100; the user's pick, 2026-10-05: Fire needs it most)
export const TOP_FLOOR = 100;            // Rayquaza's floor, the summit: the climb is won there
export const TOP_FLIGHT = TOP_FLOOR / FLIGHT - 1;
export const RAYQUAZA = 'rayquaza-guardian';
export const PAST_TOP = { hp: 1.12, dmg: 4, dmgMult: 1.1 };   // every flight past the third: enemy HP x1.12, +4 damage, then every attack x1.1, compounding (bot-tuned for a 100-floor top: x1.35 / +8 / x1.15 let no climb reach it; HP growth stalls Fire, damage growth checks Grass's healing)
export const DOOR_ODDS = { fight: 55, elite: 25, event: 20 };   // the other doors of a plain landing
export const MART_LANDING = 4;           // floor 5 of a flight: a Mart beside an Alpha
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
    A fixed shape (the user's call, 2026-10-07: Marts and Centers on most landings let a climb skip half its fights):
    floor 5 of every flight is a Mart beside an Alpha, floor 9 a Center beside a fight, and every other landing a fight
    with fights, Alphas or a ? (one ? a flight, no Alpha before floor 3) behind its other doors. */
export function landingTypes(flight) {
  const rows = [];
  let events = 0;
  for (let i = 0; i < LANDINGS; i++) {
    const floor = floorOf(flight, i);
    if (i === MART_LANDING) { rows.push(shuffled(['shop', 'elite'])); continue; }
    if (i === LANDINGS - 1) { rows.push(shuffled(['fight', 'rest'])); continue; }
    const doors = random() < 0.65 ? 3 : 2;
    const row = ['fight'];
    while (row.length < doors) {
      const odds = { ...DOOR_ODDS };
      if (floor <= 2 || row.includes('elite')) odds.elite = 0;
      if (events) odds.event = 0;
      const t = roll(odds);
      if (t === 'event') events += 1;
      row.push(t);
    }
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
