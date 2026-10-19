/* ============================================================
   exchange.js  -  the Shiny Exchange's pull rules (2026-10-18, the user's ask; the kiosk in the Safari Outfitter,
   js/exchange.js its window).

   Each Safari area is a capsule machine of every Pokémon on its Safari Pokédex page, caught or not (2026-10-19, the
   user's catch: a machine of only what you'd caught held one shiny at first, so a pull was a sure buy). A capsule holds
   one of their shinies; one you haven't caught comes out sealed, kept in the save till a Safari catch of it opens it.
   Coins only pull, never buy outright (the user's call). A plain capsule holds one of the area's wilds, a gold one one
   of its rare spawns; the gold odds climb with each plain capsule and fall back after a gold one, and a pull of ten
   always holds a gold one. Duplicates come out too: one is +1 Sparkle (js/data/shinies.js) and more Lucky Stars, and
   ten Lucky Stars pick any caught shiny free.
   ============================================================ */

import { SAFARI_DEX_PAGES } from './safari.js';
import { addShiny, sparkleOf } from './shinies.js';

export const PULL_COST = 150;
export const PULL_TEN = 10;
export const TEN_COST = PULL_COST * PULL_TEN;
/** A gold capsule's odds: GOLD_BASE, + GOLD_STEP for each plain capsule since the last gold one. */
export const GOLD_BASE = 0.08;
export const GOLD_STEP = 0.04;
/** How often, at least, a capsule holds a shiny you don't own yet (nor hold sealed); otherwise any of the machine. */
export const NEW_ODDS = { plain: 1 / 3, gold: 1 / 2 };
/** Lucky Stars a capsule pays: a new shiny, a duplicate, a duplicate already at ★5, a sealed one. */
export const CAPSULE_STARS = { isNew: 1, dupe: 2, maxed: 3, sealed: 1 };
export const STARS_FOR_PICK = 10;

/** Each area's capsule colour and its deep shade (the window's banners, the kiosk's screen and tray). */
export const EXCHANGE_INK = {
  meadow: ['#8cd060', '#3a7a24'], forest: ['#4aa860', '#163e20'], wetland: ['#4ab0d8', '#164a78'],
  marsh: ['#9a80c0', '#2e2448'], peak: ['#9ab4d0', '#34466a'], desert: ['#eab860', '#8a5418'], powerplant: ['#e8c830', '#5a4a10'],
};

/** The odds of a gold capsule after `pity` plain ones in a row. */
export const goldOdds = (pity = 0) => Math.min(1, GOLD_BASE + GOLD_STEP * Math.max(0, pity));

/** An area's machine: its page's wilds (plain capsules) and rare spawns (gold ones), and which you've `caught` (they
    come out open; the rest sealed). */
export function machineOf(area, caught = []) {
  const page = SAFARI_DEX_PAGES.find(p => p.area === area);
  return { area, plain: [...page.wild], gold: [...page.rare], caught: new Set(caught), page };
}

/** Lucky Stars for what a capsule did (its shinyGain()). */
export const starsFor = (gain) => (gain.isNew ? CAPSULE_STARS.isNew : gain.maxed ? CAPSULE_STARS.maxed : CAPSULE_STARS.dupe);

/** One of `pool`: a shiny you don't own yet (nor hold sealed) `odds` of the time while it has both kinds, else any. */
function pickFrom(pool, isFresh, odds, roll) {
  const fresh = pool.filter(isFresh);
  const from = fresh.length && fresh.length < pool.length && roll() < odds ? fresh : pool;
  return from[Math.floor(roll() * from.length) % from.length];
}

/** Pull `n` capsules from a machine. `shinies` and `sealed` are the save's maps (id -> Sparkle, id -> sealed capsules
    held), changed in place as each capsule opens, so a later capsule in a pull of ten sees the earlier ones; `pity` the
    plain capsules since the last gold one. A Pokémon the machine doesn't count as caught comes out `sealed` (no gain).
    Returns the capsules, plain ones first and gold ones last (the reveal saves them for the end), the Lucky Stars they
    paid and the new pity. A pull of ten with no gold one by its last capsule makes that one gold. */
export function pullCapsules(machine, n, shinies, pity = 0, roll = Math.random, sealed = {}) {
  const out = [];
  if (!machine.plain.length && !machine.gold.length) return { capsules: out, stars: 0, pity };
  for (let k = 0; k < n; k++) {
    let gold = machine.gold.length > 0 && (!machine.plain.length || roll() < goldOdds(pity));
    if (n >= PULL_TEN && k === n - 1 && machine.gold.length && !out.some(c => c.gold)) gold = true;
    const fresh = (id) => !sparkleOf(shinies, id) && !(sealed[id] > 0);
    const id = pickFrom(gold ? machine.gold : machine.plain, fresh, gold ? NEW_ODDS.gold : NEW_ODDS.plain, roll);
    if (machine.caught && !machine.caught.has(id)) {
      sealed[id] = (sealed[id] || 0) + 1;
      out.push({ id, gold, sealed: true, gain: null, stars: CAPSULE_STARS.sealed });
    } else {
      const gain = addShiny(shinies, id);
      out.push({ id, gold, gain, stars: starsFor(gain) });
    }
    pity = gold ? 0 : pity + 1;
  }
  out.sort((a, b) => a.gold - b.gold);
  return { capsules: out, stars: out.reduce((s, c) => s + c.stars, 0), pity };
}

/** A Safari catch of `id` opens every sealed capsule of it held: each a new shiny or +1 Sparkle, in `shinies`, and
    gone from `sealed` (both changed in place). Returns their gains, in order. */
export function openSealed(shinies, sealed, id) {
  const n = Math.max(0, Math.floor(sealed[id] || 0));
  delete sealed[id];
  return Array.from({ length: n }, () => addShiny(shinies, id));
}

/** Sealed capsules held, of one Pokémon or (no id) all told. */
export const sealedCount = (sealed, id = null) => (id ? sealed?.[id] || 0 : Object.values(sealed || {}).reduce((s, n) => s + n, 0));

/** Ten Lucky Stars spent on one caught shiny: its gain, or null while it can't be picked. Pays no star itself. */
export function luckyPick(shinies, stars, caught, id) {
  if (stars < STARS_FOR_PICK || !caught.includes(id)) return null;
  return addShiny(shinies, id);
}
