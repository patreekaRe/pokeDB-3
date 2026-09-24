/* ============================================================
   items.js  -  one-use items you carry in the Bag during a run
   (like Slay the Spire's potions). You find them after fights and
   buy them at Poké Marts; they're lost when the run ends.

   Effects (applied by useItem() in battle.js):
     heal      restore HP (not boosted by Big Root: that's cards and powers)
     block     gain block
     strength  gain strength for the rest of the fight
     focus     your next attack deals this much more
     energy    gain PP this turn
     draw      draw cards
     guard     block the next enemy attack completely
     burn      burn the enemy
     flee      leave a non-boss fight at once (no rewards)
   `map: true` items can also be used from the Bag on the map.
   `only` means the item only shows up for starters of that type.
   ============================================================ */

export const ITEMS = [
  { id: 'potion',       name: 'Potion',       icon: '🧴', rarity: 'common',   map: true, effects: { heal: 12 },  text: 'Heal 12 HP. Works on the map too.' },
  { id: 'super-potion', name: 'Super Potion', icon: '🥤', rarity: 'uncommon', map: true, effects: { heal: 25 },  text: 'Heal 25 HP. Works on the map too.' },
  { id: 'x-attack',     name: 'X Attack',     icon: '🗡️', rarity: 'common',   effects: { strength: 2 },         text: 'Gain 2 strength for the rest of the fight.' },
  { id: 'x-defend',     name: 'X Defend',     icon: '🔰', rarity: 'common',   effects: { block: 12 },           text: 'Gain 12 block.' },
  { id: 'x-speed',      name: 'X Speed',      icon: '👟', rarity: 'common',   effects: { draw: 3 },             text: 'Draw 3 cards.' },
  { id: 'dire-hit',     name: 'Dire Hit',     icon: '🏹', rarity: 'common',   effects: { focus: 10 },           text: 'Your next attack deals 10 more damage.' },
  { id: 'ether',        name: 'Ether',        icon: '🍶', rarity: 'uncommon', effects: { energy: 2 },           text: 'Gain 2 PP this turn.' },
  { id: 'guard-spec',   name: 'Guard Spec.',  icon: '🧿', rarity: 'uncommon', effects: { guard: true },         text: 'Guard: the next enemy attack is blocked completely.' },
  { id: 'poke-doll',    name: 'Poké Doll',    icon: '🧸', rarity: 'uncommon', effects: { flee: true },          text: 'Escape a fight that isn\'t a boss. You get no rewards.' },
  { id: 'fire-gem',     name: 'Fire Gem',     icon: '🔴', rarity: 'uncommon', only: 'fire',  effects: { burn: 8 },            text: 'Burn the enemy 8.' },
  { id: 'grass-gem',    name: 'Grass Gem',    icon: '🟢', rarity: 'uncommon', only: 'grass', effects: { heal: 8, strength: 1 }, text: 'Heal 8 HP and gain 1 strength.' },
  { id: 'water-gem',    name: 'Water Gem',    icon: '🔵', rarity: 'uncommon', only: 'water', effects: { block: 10, draw: 2 },   text: 'Gain 10 block and draw 2 cards.' },
];

export const ITEMS_BY_ID = Object.fromEntries(ITEMS.map(i => [i.id, i]));

/** How many items the Bag holds at once. */
export const ITEM_SLOTS = 3;

/** After each won fight: `base` chance of an item drop, which goes down by `step` after a drop and up by `step` after a miss. */
export const ITEM_DROP = { base: 0.4, step: 0.1 };

/** How often each rarity comes up in drops and Mart stock. */
export const ITEM_WEIGHTS = { common: 3, uncommon: 2 };

/** The items a starter of this type can find. */
export const itemsForType = (type) => ITEMS.filter(i => !i.only || i.only === type);
