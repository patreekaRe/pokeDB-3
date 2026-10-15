/* ============================================================
   workshop.js  -  Kurt's Workshop in the Whispering Clearing (docs/roadmap.md's Towns step 6, session 3, 2026-10-14):
   Johto's Apricorn ball maker turns the Satchel's materials (js/data/satchel.js) into four kinds of thing, none of them
   any power in a run:
   - key    the questlines' Make steps (js/data/towns.js's QUESTS `craft`), into the Satchel's Key Items
   - piece  craft-only furniture from each town's shelf, into the Secret Base (js/data/furniture.js's 'craft' source)
   - gift   a present for a Gym Leader, handed over in their home; their favourite earns their signature piece
   - skin   an Apricorn ball's look for the Safari Ball (looks only: the odds stay the Safari Ball's)
   A recipe shows once it can matter: a quest item while its town's questline is open, a town's pieces once you've been
   there, a gift once you've beaten whoever loves it, the Apricorns always. Pure: tests/workshop.test.mjs.
   The save's side and the window are js/workshop.js; the save is `save.workshop` (workshopOf()).
   ============================================================ */

import { MATERIALS_BY_ID } from './satchel.js';

const key = (id, town, needs, more = {}) => ({ id, kind: 'key', town, makes: id, needs, ...more });
const piece = (id, name, town, needs, more = {}) => ({ id: `piece-${id}`, kind: 'piece', name, town, makes: id, needs, ...more });
const gift = (id, name, icon, leader, needs, text, sig) => ({ id: `gift-${id}`, kind: 'gift', name, icon, leader, makes: id, needs, text, sig });
const skin = (id, name, needs, text) => ({ id: `skin-${id}`, kind: 'skin', name, makes: id, sprite: `${id}-ball`, needs, text });

export const RECIPES = [
  // the questlines' Make steps: each from its own biome, but Machew's katana wants Cinder Springs' ore, and the Spirit
  // Lantern a Shrine wick, so the other roads matter (the user's plan)
  key('waystone-chime', 'clearing', { acorn: 4, glowmoss: 1 }),   // the Nietos' (step 7), from the Clearing's own
  key('festival-lanterns', 'shrine', { wick: 3, washi: 3 }),
  key('comms-relay', 'wastes', { 'copper-wire': 4, 'magma-ore': 1 }),
  key('sequin-costume', 'wastes', { 'ember-sequin': 5, 'copper-wire': 1 }),
  key('pier-supports', 'ruins', { driftwood: 5, 'sea-glass': 1 }),
  key('spirit-lantern', 'thornwood', { ghostcap: 3, wick: 1 }, { at: 'cauldron' }),
  key('katana', 'savanna', { 'magma-ore': 4, resin: 2 }),
  // craft-only furniture, two a town, and John's festival's own piece once you've picked it
  piece('daruma', 'Daruma', 'shrine', { washi: 3, wick: 1 }),
  piece('chochin', 'Paper lantern', 'shrine', { washi: 2, wick: 2 }, { pick: ['sh-spirits', 'lantern'] }),
  piece('teaset', 'Tea set', 'shrine', { washi: 2, wick: 2 }, { pick: ['sh-spirits', 'moon'] }),
  piece('taiko', 'Taiko drum', 'shrine', { washi: 2, wick: 2 }, { pick: ['sh-spirits', 'fireworks'] }),
  piece('steamrocks', 'Steam rocks', 'wastes', { 'magma-ore': 3 }),
  piece('massagechair', 'Massage chair', 'wastes', { 'copper-wire': 3, 'ember-sequin': 2 }),
  piece('shipwreck', 'Shipwreck', 'ruins', { driftwood: 4, 'sea-glass': 1 }),
  piece('jellylamp', 'Jelly lamp', 'ruins', { 'sea-glass': 3 }),
  piece('seedtrays', 'Seed trays', 'thornwood', { seeds: 3 }),
  piece('flytrap', 'Flytrap', 'thornwood', { seeds: 2, ghostcap: 2 }),
  piece('brasslantern', 'Brass lantern', 'savanna', { resin: 2, spice: 1 }),
  piece('bedouintent', 'Bedouin tent', 'savanna', { resin: 3, spice: 2 }),
  // a gift a Gym Leader, each someone's favourite: given in their home, it earns their signature piece (`sig`)
  gift('fan', 'Paper Fan', '🪭', 'john', { washi: 2, wick: 1 }, 'A folding fan with the festival\'s three choices painted on it. Fan it at John till he picks.', 'luckycat'),
  gift('curry', 'Wake-Up Curry', '🍛', 'jahmes', { spice: 3 }, 'Savanna Spice, a lot of it. Nobody has gone to bed early after a bowl.', 'zabuton'),
  gift('mirror', 'Stage Mirror', '🪞', 'clarence', { 'sea-glass': 2, 'ember-sequin': 1 }, 'A hand mirror rimmed in sequins. For checking the pose between poses.', 'wavebyobu'),
  gift('keyboard', 'Clicky Keyboard', '⌨️', 'shaun', { 'copper-wire': 3, resin: 1 }, 'Hand-wired, every key louder than the last. He\'ll say the wiring\'s wrong.', 'pingpong'),
  gift('lemonade', 'Tall Lemonade', '🍋', 'pat', { spice: 1, resin: 1 }, 'Like a tall glass of lemonade. Sweetened with Acacia Resin. Pat might cry.', 'pearlstand'),
  gift('cattower', 'Cat Tower', '🐈', 'kayl', { driftwood: 3, resin: 1 }, 'Driftwood shelves and a rope post. For the cats, who are tenants too.', 'octopuschair'),
  gift('stew', 'Ghostcap Stew', '🍲', 'phil', { ghostcap: 2, spice: 1 }, 'It glows a little. Phil eats it in the dark to check. Jona wants none.', 'scarecrow'),
  gift('cocoa', 'Ember Cocoa', '☕', 'ricky', { spice: 1, 'ember-sequin': 1 }, 'Hot cocoa that fizzes. For the third hour of a stream at 3 a.m.', 'hammock'),
  gift('incense', 'Shadow Incense', '🪔', 'machew', { resin: 2, wick: 1 }, 'Acacia smoke for meditating on failure. Machew has a lot to meditate on.', 'sphinx'),
  gift('heistmap', 'Heist Map', '🗺️', 'jerome', { washi: 2, resin: 1 }, 'A map of the bandits\' camp. Every route is labelled IN AND OUT.', 'goldurn'),
  // the Clearing's own: the Nietos, given at their house by the plaza
  gift('rattle', 'Acorn Rattle', '🪇', 'nietos', { acorn: 3, glowmoss: 1 }, 'Whisper Acorns in a glowing rattle. It hums Linc to sleep, so Law and Britt finally get a night off.', 'bigkangaskhandoll'),
  // Kurt's own trade: an Apricorn's look for the Safari Ball
  skin('level', 'Level Ball', { 'magma-ore': 3 }, 'A red Apricorn, cured over Cinder Springs\' ore.'),
  skin('lure', 'Lure Ball', { driftwood: 3 }, 'A blue Apricorn, carved for the fishermen of Driftwood Landing.'),
  skin('moon', 'Moon Ball', { ghostcap: 3 }, 'A yellow Apricorn that glows like Ghostcap after dark.'),
  skin('friend', 'Friend Ball', { seeds: 3 }, 'A green Apricorn, planted and picked in Thornwood.'),
  skin('love', 'Love Ball', { 'ember-sequin': 3 }, 'A pink Apricorn, sequinned. Clarence asked for one first.'),
  skin('heavy', 'Heavy Ball', { 'copper-wire': 3 }, 'A black Apricorn, banded in copper. It still flies like a Safari Ball.'),
  skin('fast', 'Fast Ball', { resin: 3 }, 'A white Apricorn, varnished in Acacia Resin.'),
];
export const RECIPES_BY_ID = Object.fromEntries(RECIPES.map(r => [r.id, r]));

/** The Workshop's shelves, in its window's order. */
export const TABS = [
  { id: 'key', name: 'Quest' },
  { id: 'piece', name: 'Furniture' },
  { id: 'gift', name: 'Gifts' },
  { id: 'skin', name: 'Apricorns' },
];

/** The gifts, by the Gym Leader who loves each. */
export const GIFTS = RECIPES.filter(r => r.kind === 'gift');
export const GIFT_BY_ID = Object.fromEntries(GIFTS.map(g => [g.makes, g]));
export const FAVOURITE = Object.fromEntries(GIFTS.map(g => [g.leader, g]));
export const SKINS = RECIPES.filter(r => r.kind === 'skin');
export const SKIN_BY_ID = Object.fromEntries(SKINS.map(s => [s.makes, s]));

/** Who a gift is handed to, by name: the Nietos are Law and Britt at home. */
export const gifteeOf = (leader, name) => (leader === 'nietos' ? 'Law and Britt' : name);

/** The save's Workshop: furniture and skins `made`, `gifts` held (counts), each leader's `liked` (gifts given) and `heard` (heart lines said, js/data/towns.js's HEART_LINES), those
    `fond` of you (their favourite given, their signature piece earned) and the Safari Ball's `skin` (null: its own). */
export function workshopOf(save) {
  return { made: [], gifts: {}, liked: {}, heard: {}, fond: [], skin: null, ...(save.workshop || {}) };
}

/** What a recipe needs that the Satchel lacks: [{ id, need, have }] (empty when it can be made). */
export function shortOf(recipe, sat) {
  return Object.entries(recipe.needs).map(([id, need]) => ({ id, need, have: sat.mats[id] || 0 })).filter(m => m.have < m.need);
}

/** Made already, for good: a key item held, a piece or skin made (a gift can always be made again). */
export function isMade(recipe, ws, sat) {
  if (recipe.kind === 'key') return sat.keys.includes(recipe.makes);
  if (recipe.kind === 'gift') return false;
  return ws.made.includes(recipe.id);
}

/** Whether the Workshop shows a recipe (see the top of this file). `towns` is the save's per-town states
    (js/data/towns.js's townState() of each), `wins` a Gym Leader's wins. */
export function shows(recipe, { towns, wins }) {
  if (recipe.kind === 'key') return !!towns[recipe.town]?.quest;
  if (recipe.kind === 'piece') {
    const st = towns[recipe.town];
    if (!st?.met) return false;
    return !recipe.pick || st.quest?.picks?.[recipe.pick[0]] === recipe.pick[1];
  }
  if (recipe.kind === 'gift') return wins(recipe.leader) > 0;
  return true;
}

/** The Satchel's materials with a recipe's taken out (call only when shortOf() is empty). */
export function spend(recipe, sat) {
  const mats = { ...sat.mats };
  for (const [id, n] of Object.entries(recipe.needs)) mats[id] = Math.max(0, (mats[id] || 0) - n);
  return { ...sat, mats };
}

/** The Workshop once a recipe's made (the Satchel's side, a key item, is js/workshop.js's). */
export function madeInto(recipe, ws) {
  if (recipe.kind === 'gift') return { ...ws, gifts: { ...ws.gifts, [recipe.makes]: (ws.gifts[recipe.makes] || 0) + 1 } };
  if (recipe.kind === 'key' || ws.made.includes(recipe.id)) return ws;
  return { ...ws, made: [...ws.made, recipe.id] };
}

/** A gift handed to `leader`: one fewer held, their liking up (two for their favourite), and their favourite the first
    time makes them fond of you (their signature piece). Returns { ws, favourite, first }. */
export function giveGift(ws, giftId, leader) {
  const g = GIFT_BY_ID[giftId];
  if (!g || !(ws.gifts[giftId] > 0)) return { ws, favourite: false, first: false };
  const favourite = g.leader === leader, first = favourite && !ws.fond.includes(leader);
  return {
    favourite, first,
    ws: { ...ws, gifts: { ...ws.gifts, [giftId]: ws.gifts[giftId] - 1 }, liked: { ...ws.liked, [leader]: (ws.liked[leader] || 0) + (favourite ? 2 : 1) },
      fond: first ? [...ws.fond, leader] : ws.fond },
  };
}

/** A friend's hearts (the user's picks, 2026-10-14; docs/roadmap.md's step 8): `liked` shown as up to HEARTS, so a gift
    fills one and their favourite two. Gifts past the last still count in `liked`, so the cap can move later. */
export const HEARTS = 5;
export const heartsOf = (ws, leader) => Math.min(HEARTS, ws.liked?.[leader] || 0);

/** Everyone who takes a gift, the Nietos (home) first. */
export const FRIENDS = ['nietos', ...GIFTS.map(g => g.leader).filter(id => id !== 'nietos')];

/** A recipe's needs as a line ("🕯️ 2/3 · 📜 3/3"). */
export const needsLine = (recipe, sat) => Object.entries(recipe.needs)
  .map(([id, n]) => `${MATERIALS_BY_ID[id].icon} ${Math.min(sat.mats[id] || 0, n)}/${n}`).join(' · ');

/** The Safari Ball's sprite: its own, or the Apricorn skin carried. */
export const safariSprite = (ws) => (ws.skin && SKIN_BY_ID[ws.skin] ? SKIN_BY_ID[ws.skin].sprite : 'safari-ball');
