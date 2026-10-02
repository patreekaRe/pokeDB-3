/* ============================================================
   safari.js  -  the Safari Zone daily run (docs/roadmap.md, "Post-v1.0:
   the Safari Zone daily run"): the same run for everyone on a UTC date.

   The date is the seed. It picks 3 of the 6 areas as the run's three
   biomes and a fixed starter (any but Mewtwo, owned or not, so the
   leaderboard is fair). Everything else the run rolls comes from the
   same seed through js/rng.js.

   Each area is a habitat with its own wild roster. Until the Safari's
   own Pokémon land (phase 4), the rosters borrow the main game's wilds;
   the area's place in the run (1st, 2nd or 3rd) sets their strength,
   elites and boss, from that biome of BIOMES. `rares` are the area's
   rare spawns (markRares()): Pokémon met nowhere else in the area, which
   run off after a few turns unless caught or knocked out.
   ============================================================ */

import { makeRng, hashString, shuffled, pickOne, random } from '../rng.js';
import { STARTERS } from './starters.js';
import { RARE } from './balls.js';

export const SAFARI_AREAS = [
  { id: 'meadow',  name: 'Meadow',  normals: ['rattata', 'sentret', 'zigzagoon', 'hoppip', 'oddish', 'vulpix', 'aipom', 'tauros'], rares: ['chansey', 'furret'] },
  { id: 'forest',  name: 'Forest',  normals: ['seedot', 'paras', 'bellsprout', 'cherubi', 'tangela', 'teddiursa', 'aipom', 'growlithe'], rares: ['kecleon', 'ambipom'] },
  { id: 'wetland', name: 'Wetland', normals: ['poliwag', 'psyduck', 'marill', 'krabby', 'shellos', 'staryu', 'slowpoke', 'zigzagoon'], rares: ['chansey', 'linoone'] },
  { id: 'marsh',   name: 'Marsh',   normals: ['psyduck', 'slowpoke', 'shellos', 'crawdaunt', 'oddish', 'tangela', 'litwick', 'bouffalant'], rares: ['kecleon', 'watchog'] },
  { id: 'peak',    name: 'Peak',    normals: ['stantler', 'teddiursa', 'darumaka', 'torkoal', 'houndour', 'sharpedo', 'bouffalant', 'zangoose'], rares: ['persian', 'lopunny'] },
  { id: 'desert',  name: 'Desert',  normals: ['cacturne', 'maractus', 'magmar', 'heatmor', 'pansear', 'growlithe', 'sentret', 'zangoose'], rares: ['cinccino', 'purugly'] },
];

export const SAFARI_AREAS_BY_ID = Object.fromEntries(SAFARI_AREAS.map(a => [a.id, a]));

/** How many areas a day's run crosses. */
export const SAFARI_DAY_AREAS = 3;

/** A date's UTC day, "YYYY-MM-DD": the day changes at midnight UTC for everyone. */
export const safariDay = (date = new Date()) => date.toISOString().slice(0, 10);

/** The seed for a day: every roll of that day's run comes from it. */
export const safariSeed = (day) => hashString(`safari:${day}`);

/** The starters a day can deal: every one but secret Mewtwo. */
export const safariStarters = (starters = STARTERS) => starters.filter(s => !s.secret);

/** A day's run: its seed, 3 areas (in order) and fixed starter. Same day, same answer, on any device. */
export function safariDaily(day = safariDay(), starters = STARTERS) {
  const seed = safariSeed(day);
  const areas = shuffled(SAFARI_AREAS, makeRng(hashString(`${seed}|areas`))).slice(0, SAFARI_DAY_AREAS);
  const starter = pickOne(safariStarters(starters), makeRng(hashString(`${seed}|starter`)));
  return { day, seed, areas, starter };
}

/** Every Pokémon a Safari area can hold, wild or rare, without repeats: the ones with a signature card (cards.js). */
export const SAFARI_ROSTER = [...new Set(SAFARI_AREAS.flatMap(a => [...a.normals, ...a.rares]))];

/** Turn some of a biome's wild rooms into rare spawns (rolled on the biome's seed, js/rng.js, so it's the same day for
    everyone): `rare` on the room, and its Pokémon from the area's `rares`. */
export function markRares(rooms, area) {
  for (const room of rooms) {
    if (random() >= RARE.odds) continue;
    room.rare = true;
    room.enemyId = pickOne(area.rares);
  }
}
