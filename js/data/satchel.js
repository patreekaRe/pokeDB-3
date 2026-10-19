/* ============================================================
   satchel.js  -  the Satchel's things (docs/roadmap.md's Towns step 6, session 1, 2026-10-14): the home stash that
   outlives runs, where the towns' questlines keep what they need (js/data/towns.js's QUESTS). Named the Satchel since
   the Bag is the run's. Two kinds:
   - MATERIALS: counts, a few per biome, for the questlines and Kurt's Workshop. Kept on a lost run, never in the run's
     Bag, so they give no power in a run. They drop in their own biome (session 2, 2026-10-14): from fights (DROPS) and
     the map's sparkling rooms (SPARKLES), rolled through js/rng.js.
   - KEY_ITEMS: one of a kind, never used up: the Waystone Shards, Pat's letter, what Kurt's Workshop makes.
   The save side is js/satchel.js, the app js/satcheldex.js. This file is pure (tests/quests.test.mjs).
   ============================================================ */

const mat = (id, biome, name, icon, use, more = {}) => ({ id, biome, name, icon, use, ...more });
const key = (id, name, icon, text, how, more = {}) => ({ id, name, icon, text, how, ...more });

export const MATERIALS = [
  // the Clearing's own (step 7, 2026-10-14), for the Nietos' questline and Kurt's Waystone Chime
  mat('glowmoss', 'clearing', 'Glowmoss', '🌿', 'It glows a little after dark. The Nietos want it to pack the crack in the Clearing\'s Waystone.'),
  mat('acorn', 'clearing', 'Whisper Acorn', '🌰', 'It hums when you hold it to your ear. Kurt carves chimes from them.'),
  mat('wick', 'shrine', 'Lantern Wick', '🕯️', 'Lantern Village wants these to keep its lanterns lit. Kurt twists them into lanterns too.'),
  mat('washi', 'shrine', 'Washi Paper', '📜', 'Lantern shades and charms, at Kurt\'s Workshop.'),
  mat('magma-ore', 'wastes', 'Magma Ore', '🌋', 'Warms Cinder Springs back up. Kurt can forge with it, even a blade.'),
  mat('copper-wire', 'wastes', 'Copper Wire', '🧲', 'Radios and relays, at Kurt\'s Workshop.'),
  mat('ember-sequin', 'wastes', 'Ember Sequin', '✨', 'They glitter like hot coals. Someone in Cinder Springs would love a costume of them.'),
  mat('bottle', 'ruins', 'Message Bottle', '🍾', 'Pat\'s love letters, adrift across the lagoon. Driftwood Landing wants them back.', { from: 'map' }),
  mat('driftwood', 'ruins', 'Driftwood', '🪵', 'Pier supports and furniture, at Kurt\'s Workshop.'),
  mat('sea-glass', 'ruins', 'Sea Glass', '💎', 'Lanterns, charms and Apricorn ball skins, at Kurt\'s Workshop.'),
  mat('seeds', 'thornwood', 'Thornwood Seeds', '🌱', 'Highbough wants them to plant the Withered Nursery again.'),
  mat('ghostcap', 'thornwood', 'Ghostcap', '🍄', 'It glows in the dark. Kurt can light a Spirit Lantern with it.'),
  mat('spice', 'savanna', 'Savanna Spice', '🌶️', 'Dishes for visiting leaders, at Kurt\'s Workshop.'),
  mat('resin', 'savanna', 'Acacia Resin', '🍯', 'Glue for anything, and a blade\'s grip, at Kurt\'s Workshop.'),
  // grown, not found (the backyard's berry garden, js/data/berries.js): `biome: 'garden'` is no biome, so none drops in a run
  mat('cheri', 'garden', 'Cheri Berry', '🍒', 'Grown in your backyard. Kurt makes held berries and run items from them; sell the spares.', { grown: true }),
  mat('oran', 'garden', 'Oran Berry', '🫐', 'Grown in your backyard. Kurt makes held berries and run items from them; sell the spares.', { grown: true }),
  mat('pecha', 'garden', 'Pecha Berry', '🍑', 'Grown in your backyard. Kurt makes held berries and run items from them; sell the spares.', { grown: true }),
  mat('sitrus', 'garden', 'Sitrus Berry', '🍋', 'Grown in your backyard. Kurt makes held berries and run items from them; sell the spares.', { grown: true }),
  mat('lum', 'garden', 'Lum Berry', '🍏', 'Grown in your backyard. Kurt makes held berries and run items from them; sell the spares.', { grown: true }),
];
export const MATERIALS_BY_ID = Object.fromEntries(MATERIALS.map(m => [m.id, m]));

/* ---------- where they drop (session 2, 2026-10-14) ----------
   Only in a town's biome, only while the towns are on (js/run.js's gleanFight() / gleanSparkle()). A won fight may drop
   one of its biome's materials (DROPS: a wild Pokémon sometimes, an Alpha and the boss always); `from: 'map'` ones
   (Pat's bottles, adrift) never drop from a fight, only from the map's sparkling rooms: SPARKLES of a biome's rooms
   (not the boss's, an Alpha's or the Mart's) sparkle, each holding a few of one material, the `from: 'map'` one first.
   About 10 a biome a pass, so a gather step (3-6) is a run or two through its biome. */
export const DROPS = { fight: { odds: 0.4, n: [1, 1] }, elite: { odds: 1, n: [1, 2] }, boss: { odds: 1, n: [2, 3] } };
export const SPARKLES = { rooms: [1, 2], n: [2, 3], kinds: ['fight', 'event', 'rest'] };

/** A biome's materials (all of them, or only those a fight can drop). */
export const biomeMats = (biome, fight = false) => MATERIALS.filter(m => m.biome === biome && !(fight && m.from === 'map'));

const roll = ([lo, hi], rand) => lo + Math.floor(rand() * (hi - lo + 1));

/** What a won fight of `kind` drops in `biome`: { id, n }, or null. */
export function fightDrop(biome, kind, rand) {
  const d = DROPS[kind], mats = biomeMats(biome, true);
  if (!d || !mats.length || rand() >= d.odds) return null;
  return { id: mats[Math.floor(rand() * mats.length)].id, n: roll(d.n, rand) };
}

/** Mark a biome map's sparkling rooms (`rooms`, in floor order): each gets `sparkle: { id, n }`. */
export function markSparkles(rooms, biome, rand) {
  const mats = biomeMats(biome), spots = rooms.filter(r => SPARKLES.kinds.includes(r.type) && r.floor > 0);
  if (!mats.length || !spots.length) return [];
  const map = mats.filter(m => m.from === 'map'), picked = [];
  for (let i = roll(SPARKLES.rooms, rand); i > 0 && spots.length; i--) {
    const room = spots.splice(Math.floor(rand() * spots.length), 1)[0];
    const pool = map.length && !picked.length ? map : mats;
    room.sparkle = { id: pool[Math.floor(rand() * pool.length)].id, n: roll(SPARKLES.n, rand) };
    picked.push(room);
  }
  return picked;
}

/** Mark the Alpha its town's Waystone Shard floats over (session 4, 2026-10-14), once the questline is up to its shard
    step and the shard isn't held: one of the map's Alphas, picked by `rand`, gets `shard: <key item id>`. */
export function markShard(rooms, key, rand) {
  const alphas = rooms.filter(r => r.type === 'elite');
  if (!alphas.length) return null;
  const room = alphas[Math.floor(rand() * alphas.length)];
  room.shard = key;
  return room;
}

/** `?shard` marks a playtest's Alpha with its biome's shard (`?biome=shrine&shard`, or on into the biome from `?town=`). */
export const shardFlag = () => typeof location !== 'undefined' && new URLSearchParams(location.search).has('shard');

const ROAD = { clearing: 'is every run\'s first stretch', shrine: 'is a run\'s second stretch', wastes: 'is a run\'s third stretch' };

/** Where a material turns up, a few short lines (2026-10-18, the user's ask: tap a material to see where it drops).
    `biome` is its biome's name; `mail` says a Gym Leader from there can be a friend who writes (friendLetter()). */
export function matHints(m, biome = 'wild', mail = false) {
  if (m.grown) return ['Grown in a berry plot in your Secret Base\'s backyard, then picked when it\'s ripe.', 'Water it each day it grows for more berries.'];
  const map = `the ${biome}${biome.endsWith('s') ? '\'' : '\'s'} map`;
  const road = `The ${biome} ${ROAD[m.biome] ?? 'can turn up at either fork in the road'}.`;
  if (m.from === 'map') return [`Never dropped in a fight. It glints in sparkling rooms on ${map}.`, road];
  return [
    `Wild Pokémon in the ${biome} drop it now and then. Alphas always do, and its boss drops 2 or 3.`,
    `Sparkling rooms on ${map} hold a few too.`,
    road,
    ...(mail ? [`A Gym Leader from there may tuck one into a letter, once you're friends.`] : []),
  ];
}

/** The line that says a material went into the Satchel. */
export const matLine = ({ id, n }) => `${MATERIALS_BY_ID[id].icon} ${MATERIALS_BY_ID[id].name}${n > 1 ? ` ×${n}` : ''} went into your Satchel.`;

const SHARD_TOWN = { clearing: 'The Clearing', shrine: 'Lantern Village', wastes: 'Cinder Springs', ruins: 'Driftwood Landing', thornwood: 'Highbough', savanna: 'Sunwell Bazaar' };
const KURT = 'Made at Kurt\'s Workshop in the Whispering Clearing.';

export const KEY_ITEMS = [
  ...Object.entries(SHARD_TOWN).map(([biome, town]) => key(`shard-${biome}`, `${town}'s Shard`, '🔷',
    `A shard of Crystal Depths crystal, cracked off when the Sealed Gate was shut. It belongs in ${biome === 'clearing' ? 'the Whispering Clearing' : town}'s Waystone.`,
    biome === 'clearing' ? 'Floats over an Alpha on the Whispering Clearing\'s map, once the Nietos\' questline gets that far.'
      : 'Floats over an Alpha on its biome\'s map, once the town\'s questline gets that far.', { shard: biome })),
  key('waystone-chime', 'Waystone Chime', '🎐', 'Whisper Acorn wood, carved thin. Struck, it sings the note the Clearing\'s Waystone should hum.', KURT),
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
