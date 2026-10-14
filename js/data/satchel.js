/* ============================================================
   satchel.js  -  the Satchel's things (docs/roadmap.md's Towns step 6, session 1, 2026-10-14): the home stash that
   outlives runs, where the towns' questlines keep what they need (js/data/towns.js's QUESTS). Named the Satchel since
   the Bag is the run's. Two kinds:
   - MATERIALS: counts, a few per biome, for the questlines and Kurt's Workshop. Kept on a lost run, never in the run's
     Bag, so they give no power in a run. Where they drop is session 2's.
   - KEY_ITEMS: one of a kind, never used up: the Waystone Shards, Pat's letter, what Kurt's Workshop makes.
   The save side is js/satchel.js, the app js/satcheldex.js. This file is pure (tests/quests.test.mjs).
   ============================================================ */

const mat = (id, biome, name, icon, use) => ({ id, biome, name, icon, use });
const key = (id, name, icon, text, how, more = {}) => ({ id, name, icon, text, how, ...more });

export const MATERIALS = [
  mat('wick', 'shrine', 'Lantern Wick', '🕯️', 'Lantern Village wants these to keep its lanterns lit. Kurt twists them into lanterns too.'),
  mat('washi', 'shrine', 'Washi Paper', '📜', 'Lantern shades and charms, at Kurt\'s Workshop.'),
  mat('magma-ore', 'wastes', 'Magma Ore', '🌋', 'Warms Cinder Springs back up. Kurt can forge with it, even a blade.'),
  mat('copper-wire', 'wastes', 'Copper Wire', '🧲', 'Radios and relays, at Kurt\'s Workshop.'),
  mat('ember-sequin', 'wastes', 'Ember Sequin', '✨', 'They glitter like hot coals. Someone in Cinder Springs would love a costume of them.'),
  mat('bottle', 'ruins', 'Message Bottle', '🍾', 'Pat\'s love letters, adrift across the lagoon. Driftwood Landing wants them back.'),
  mat('driftwood', 'ruins', 'Driftwood', '🪵', 'Pier supports and furniture, at Kurt\'s Workshop.'),
  mat('sea-glass', 'ruins', 'Sea Glass', '💎', 'Lanterns, charms and Apricorn ball skins, at Kurt\'s Workshop.'),
  mat('seeds', 'thornwood', 'Thornwood Seeds', '🌱', 'Highbough wants them to plant the Withered Nursery again.'),
  mat('ghostcap', 'thornwood', 'Ghostcap', '🍄', 'It glows in the dark. Kurt can light a Spirit Lantern with it.'),
  mat('spice', 'savanna', 'Savanna Spice', '🌶️', 'Dishes for visiting leaders, at Kurt\'s Workshop.'),
  mat('resin', 'savanna', 'Acacia Resin', '🍯', 'Glue for anything, and a blade\'s grip, at Kurt\'s Workshop.'),
];
export const MATERIALS_BY_ID = Object.fromEntries(MATERIALS.map(m => [m.id, m]));

const SHARD_TOWN = { shrine: 'Lantern Village', wastes: 'Cinder Springs', ruins: 'Driftwood Landing', thornwood: 'Highbough', savanna: 'Sunwell Bazaar' };
const KURT = 'Made at Kurt\'s Workshop in the Whispering Clearing.';

export const KEY_ITEMS = [
  ...Object.entries(SHARD_TOWN).map(([biome, town]) => key(`shard-${biome}`, `${town}'s Shard`, '🔷',
    `A shard of Crystal Depths crystal, cracked off when the Sealed Gate was shut. It belongs in ${town}'s Waystone.`,
    'Floats over an Alpha on its biome\'s map, once the town\'s questline gets that far.', { shard: biome })),
  key('festival-lanterns', 'Festival Lanterns', '🏮', 'A string of lanterns for John\'s festival, wicks that won\'t go out.', KURT),
  key('comms-relay', 'Comms Relay', '📡', 'A relay for Shaun\'s comms tower. He says it\'s wired wrong. It isn\'t.', KURT),
  key('sequin-costume', 'Sequin Costume', '🩱', 'Clarence\'s costume for the springs\' reopening show. There\'s a cape.', KURT),
  key('pats-letter', 'Pat\'s Letter', '💌', 'Sealed with a wax heart. Pat says not to read it. It smells of lemonade.', 'Pat gives it to you, once his bottles are back.'),
  key('pier-supports', 'Pier Supports', '🪵', 'Driftwood posts, tarred and banded, for Kayl\'s sinking stilt houses.', KURT),
  key('spirit-lantern', 'Spirit Lantern', '🏮', 'A lantern lit with Ghostcap. Ghosts can\'t look away from it. Neither can Phil.', KURT),
  key('katana', 'Machew\'s Katana', '🗡️', 'Machew\'s plastic katana, reforged in Cinder Springs\' ore. It\'s real now. He\'s nervous.', KURT),
];
export const KEY_BY_ID = Object.fromEntries(KEY_ITEMS.map(k => [k.id, k]));

/** `?satchel` fills the Satchel for a page load (every material and key item), to playtest the questlines before their
    drops and Kurt's Workshop are built. Nothing it lends is saved. */
export const satchelFlag = () => typeof location !== 'undefined' && new URLSearchParams(location.search).has('satchel');
const LENT = 9;

/** The save's Satchel: `keys` owned, `mats` counts, `seen` materials ever held, `fresh` ids with a "!" not looked at yet
    (a material's or key item's id, or "q:<town>" for a questline just opened). */
export function satchelOf(save, lend = satchelFlag()) {
  const s = { keys: [], mats: {}, seen: [], fresh: [], ...(save.satchel || {}) };
  if (!lend) return s;
  return {
    ...s, keys: KEY_ITEMS.map(k => k.id), seen: MATERIALS.map(m => m.id),
    mats: Object.fromEntries(MATERIALS.map(m => [m.id, (s.mats[m.id] || 0) + LENT])),
  };
}

export const matCount = (sat, id) => sat.mats[id] || 0;
export const hasKey = (sat, id) => sat.keys.includes(id);

/** The Satchel with `n` of a material added (or taken, `n` < 0; never below none). */
export function addMat(sat, id, n) {
  const was = sat.mats[id] || 0, now = Math.max(0, was + n);
  const fresh = n > 0 && !sat.seen.includes(id);
  return {
    ...sat, mats: { ...sat.mats, [id]: now },
    seen: fresh ? [...sat.seen, id] : sat.seen,
    fresh: fresh ? [...sat.fresh, id] : sat.fresh,
  };
}

/** The Satchel holding a key item (one of a kind: a second is nothing). */
export const addKey = (sat, id) => (sat.keys.includes(id) ? sat : { ...sat, keys: [...sat.keys, id], fresh: [...sat.fresh, id] });
