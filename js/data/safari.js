/* ============================================================
   safari.js  -  the Safari Zone daily run (docs/roadmap-done.md, "Post-v1.0:
   the Safari Zone daily run"): the same run for everyone on a UTC date.

   The date is the seed. It picks 3 of the 6 areas as the run's three
   biomes and a fixed starter (any but Mewtwo, owned or not, so the
   leaderboard is fair). Everything else the run rolls comes from the
   same seed through js/rng.js.

   Each area is a habitat with its own wild roster: its own Pokémon
   (safari-mons.js, phase 4) and a few of the main game's wilds; the area's place in the run (1st, 2nd or 3rd) sets their strength,
   elites and boss, from that biome of BIOMES. `rares` are the area's
   rare spawns (markRares()): Pokémon met nowhere else in the area, which
   run off after a few turns unless caught or knocked out.
   ============================================================ */

import { makeRng, hashString, shuffled, pickOne, random } from '../rng.js';
import { STARTERS } from './starters.js';
import { RARE } from './balls.js';
import { SAFARI_MONS } from './safari-mons.js';

/* The borrowed main-game wilds each live in one area since phase 4 (they were in two or three), so the areas' own
   Pokémon (SAFARI_MONS in safari-mons.js, listed after them) are most of every roster. */
const BORROWED = [
  { id: 'meadow',  name: 'Meadow',  normals: ['rattata', 'zigzagoon', 'hoppip', 'vulpix', 'tauros'], rares: ['chansey', 'furret'] },
  { id: 'forest',  name: 'Forest',  normals: ['seedot', 'paras', 'bellsprout', 'cherubi', 'teddiursa', 'aipom', 'growlithe'], rares: ['kecleon', 'ambipom'] },
  { id: 'wetland', name: 'Wetland', normals: ['poliwag', 'psyduck', 'marill', 'krabby', 'staryu'], rares: ['chansey', 'linoone'] },
  { id: 'marsh',   name: 'Marsh',   normals: ['slowpoke', 'shellos', 'crawdaunt', 'oddish', 'tangela', 'litwick'], rares: ['kecleon', 'watchog'] },
  { id: 'peak',    name: 'Peak',    normals: ['stantler', 'darumaka', 'torkoal', 'houndour', 'sharpedo', 'bouffalant'], rares: ['persian', 'lopunny'] },
  { id: 'desert',  name: 'Desert',  normals: ['cacturne', 'maractus', 'magmar', 'heatmor', 'pansear', 'sentret', 'zangoose'], rares: ['cinccino', 'purugly'] },
];

/* Each area's places, floors 1-3, 4-6, 7-10 and the boss's (the map's floor sign; js/scene.js paints them), like a
   main biome's `stages`. */
const STAGES = {
  meadow: ['Grassland', 'Flower Field', 'Tall Grass', 'Lone Tree'],
  forest: ['Woodland Path', 'Old Growth', 'Thicket', 'Sunlit Glade'],
  wetland: ['Lakeshore', 'Pier', 'Boardwalk', 'Lily Lake'],
  marsh: ['Bog', 'Willow Bank', 'Sunken Woods', 'Misty Mire'],
  peak: ['Foothills', 'Pine Slopes', 'Snowfield', 'Summit'],
  desert: ['Dunes', 'Cactus Flats', 'Canyon', 'Oasis'],
};

export const SAFARI_AREAS = BORROWED.map(a => {
  const own = SAFARI_MONS.filter(m => m.area === a.id);
  return { ...a, stages: STAGES[a.id], normals: [...a.normals, ...own.filter(m => !m.rare).map(m => m.id)], rares: [...a.rares, ...own.filter(m => m.rare).map(m => m.id)] };
});

export const SAFARI_AREAS_BY_ID = Object.fromEntries(SAFARI_AREAS.map(a => [a.id, a]));

/** How many areas a day's run crosses. */
export const SAFARI_DAY_AREAS = 3;

/** A date's UTC day, "YYYY-MM-DD": the day changes at midnight UTC for everyone. */
export const safariDay = (date = new Date()) => date.toISOString().slice(0, 10);

/** The seed for a day: every roll of that day's run comes from it. */
export const safariSeed = (day) => hashString(`safari:${day}`);

/** The starters a day can deal: every one but secret Mewtwo, and Rayquaza, the Safari Pokédex's own prize (`safariPrize`;
    it came after the first days were dealt, and listing it would have changed every day's starter). */
export const safariStarters = (starters = STARTERS) => starters.filter(s => !s.secret && !s.safariPrize);

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
export function markRares(rooms, area, odds = RARE.odds) {
  for (const room of rooms) {
    if (random() >= odds) continue;
    room.rare = true;
    room.enemyId = pickOne(area.rares);
  }
}

/* ---------- the Safari Pokédex (phase 3): built from the area rosters, so new Pokémon join it by being listed above ---------- */

/** Each Safari Pokémon's number, in roster order, like the games' regional dex. */
export const SAFARI_NUMBER = Object.fromEntries(SAFARI_ROSTER.map((id, i) => [id, i + 1]));

/** One page per area: its wilds, then its rare spawns (a Pokémon can live in several areas and shows on each). */
export const SAFARI_DEX_PAGES = SAFARI_AREAS.map(a => {
  const wild = [...new Set(a.normals)];
  const rare = [...new Set(a.rares)].filter(id => !wild.includes(id));
  return { area: a.id, name: a.name, wild, rare, ids: [...wild, ...rare] };
});

/** The areas a Pokémon lives in, by name, and whether it's a rare spawn in each. */
export const safariHomes = (id) => SAFARI_DEX_PAGES.filter(p => p.ids.includes(id)).map(p => ({ name: p.name, rare: p.rare.includes(id) }));

/** How far along a list of ids is in a save's `safariDex`: caught, seen (caught counts as seen) and total. */
export function safariProgress(ids, dex = { seen: [], caught: [] }) {
  const caught = new Set(dex.caught);
  const seen = new Set([...dex.seen, ...dex.caught]);
  return { caught: ids.filter(id => caught.has(id)).length, seen: ids.filter(id => seen.has(id)).length, total: ids.length };
}

/* ---------- completion rewards (the user's design, 2026-10-02) ----------
   A page is complete when every Pokémon on it is caught: SAFARI_AREA_COINS once and its rare spawns RARE_BOOST times as
   often on replays (never the day's first try). Every page caught: Rayquaza (achievements.js). Judged against the roster
   of the day it happens; once earned it stays earned (save.safariDex.done / complete), as the roster grows. */
export const SAFARI_AREA_COINS = 1000;
export const RARE_BOOST = 2;

/** Is every Pokémon on this page caught? */
export const safariPageDone = (page, dex) => safariProgress(page.ids, dex).caught === page.ids.length;

/** What a save's `safariDex` has newly finished, not yet in `done` / `complete`: `areas` (ids) and `complete`. */
export function safariNews(dex) {
  const done = dex.done ?? [];
  const areas = SAFARI_DEX_PAGES.filter(p => !done.includes(p.area) && safariPageDone(p, dex)).map(p => p.area);
  const complete = !dex.complete && safariProgress(SAFARI_ROSTER, dex).caught === SAFARI_ROSTER.length;   // today's roster, every one
  return { areas, complete };
}

/** A rare spawn's odds in an area: doubled once its page was completed, on a replay. */
export const rareOdds = (area, dex, fair) => RARE.odds * (!fair && (dex.done ?? []).includes(area) ? RARE_BOOST : 1);
