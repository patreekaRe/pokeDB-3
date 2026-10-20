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
     weaken    / vulnerable / seed: debuff the enemy (through applyDebuff, like a card)
     burnMult  multiply the enemy's Burn (Burn Drive, StS's Catalyst)
     tide      gain Tide (through gainTide, so Drizzle adds to it)
     maxHp     raise max HP by this much, and HP with it, for the run (HP Up, StS's Fruit Juice)
     discover  choose 1 of this many random cards of your type; it costs 0 this turn (TM, StS's Attack Potion)
     revive    can't be used: when you'd faint it's used up and you come back at this share of max HP
               (Revive, StS's Fairy in a Bottle)
     blockBonus  your cards give this much more block for the rest of the fight (Iron, StS's Dexterity Potion)
     power     { key: n }: a power for the rest of the fight, as if a power card gave it (POWERS in cards.js: Zinc's
               block, Carbos's draw, Rage Candy Bar's strength; `regen` heals at the start of each turn)
     cleanse   exhaust every status card in your hand and piles (Full Heal)
     hit       deal this much damage to the enemy (Iron Ball, StS's Explosive Potion)
     echo      the next card you play is played this many more times (Gold Bottle Cap, StS's Duplication Potion)
     kind      with `discover`: only 'power' or 'skill' cards are offered (TR, HM: StS's Power and Skill Potions)
     recall    choose a card in your discard pile; it goes to your hand and costs 0 this turn (Revival Herb, StS's
               Liquid Memories)
     fill      fill your Bag's empty slots with random items (Wishing Piece, StS's Entropic Brew)
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
  { id: 'black-flute',  name: 'Black Flute',  icon: '📉', rarity: 'common',   effects: { weaken: 3 },           text: 'The enemy is Weak for 3 turns: it deals 25% less.' },   // StS's Weak Potion
  { id: 'x-accuracy',   name: 'X Accuracy',   icon: '💔', rarity: 'common',   effects: { vulnerable: 3 },       text: 'The enemy is Vulnerable for 3 turns: your attacks deal 50% more.' },   // Fear Potion
  { id: 'tm-normal',    name: 'TM',           icon: '🃏', rarity: 'uncommon', effects: { discover: 3 },         text: 'Choose 1 of 3 random cards of your type to add to your hand. It costs 0 this turn.' },   // Attack Potion
  { id: 'hp-up',        name: 'HP Up',        icon: '💚', rarity: 'rare',     map: true, effects: { maxHp: 5 }, text: 'Raise your max HP by 5 for the rest of the run. Works on the map too.' },   // Fruit Juice
  { id: 'revive',       name: 'Revive',       icon: '✨', rarity: 'rare',     effects: { revive: 0.3 },         text: 'Used up on its own when you would faint: you come back with 30% of your max HP.' },   // Fairy in a Bottle
  { id: 'burn-drive',   name: 'Burn Drive',   icon: '🔥', rarity: 'uncommon', only: 'fire',  effects: { burnMult: 2 },  text: 'Double the enemy\'s Burn.' },   // Catalyst
  { id: 'absorb-bulb',  name: 'Absorb Bulb',  icon: '🌱', rarity: 'uncommon', only: 'grass', effects: { seed: 4 },      text: 'Leech Seed the enemy 4.' },   // Poison Potion
  { id: 'fresh-water',  name: 'Fresh Water',  icon: '🌊', rarity: 'uncommon', only: 'water', effects: { tide: 5 },      text: 'Gain 5 Tide.' },
  // The 2026-10-16 balance pass: more of StS's potions
  { id: 'hyper-potion', name: 'Hyper Potion', icon: '🧴', rarity: 'rare',     map: true, effects: { heal: 40 }, text: 'Heal 40 HP. Works on the map too.' },   // Blood Potion, Pokémon-sized
  { id: 'full-heal',    name: 'Full Heal',    icon: '🧴', rarity: 'common',   effects: { cleanse: true, draw: 1 }, text: 'Exhaust every status card in your hand, draw pile and discard pile. Draw 1 card.' },   // Ancient Potion (the only debuffs you get are status cards)
  { id: 'iron',         name: 'Iron',         icon: '🔰', rarity: 'common',   effects: { blockBonus: 3 }, text: 'Your cards give 3 more block for the rest of the fight.' },   // Dexterity Potion
  { id: 'zinc',         name: 'Zinc',         icon: '🔰', rarity: 'common',   effects: { power: { blockEachTurn: 4 } }, text: 'Gain 4 block at the start of each turn for the rest of the fight.' },   // Essence of Steel
  { id: 'carbos',       name: 'Carbos',       icon: '👟', rarity: 'uncommon', effects: { power: { drawEachTurn: 1 } }, text: 'Draw 1 more card each turn for the rest of the fight.' },   // (Swift Potion, kept)
  { id: 'rage-candy-bar', name: 'Rage Candy Bar', icon: '🍫', rarity: 'rare', effects: { power: { strengthEachTurn: 1 } }, text: 'Gain 1 strength at the start of each turn for the rest of the fight.' },   // Cultist Potion
  { id: 'sweet-heart',  name: 'Sweet Heart',  icon: '🍫', rarity: 'uncommon', effects: { power: { regen: 3 } }, text: 'Heal 3 HP at the start of each turn for the rest of the fight.' },   // Regen Potion
  { id: 'elixir',       name: 'Elixir',       icon: '🍶', rarity: 'common',   effects: { energy: 1, draw: 1 }, text: 'Gain 1 PP. Draw 1 card.' },   // (Energy Potion, small)
  { id: 'iron-ball',    name: 'Iron Ball',    icon: '⚫', rarity: 'common',   effects: { hit: 12 }, text: 'Deal 12 damage to the enemy.' },   // Explosive Potion
  { id: 'gold-bottle-cap', name: 'Gold Bottle Cap', icon: '🧢', rarity: 'uncommon', effects: { echo: 1 }, text: 'The next card you play this turn is played twice.' },   // Duplication Potion
  { id: 'tr-normal',    name: 'TR',           icon: '🃏', rarity: 'uncommon', effects: { discover: 3, kind: 'power' }, text: 'Choose 1 of 3 random powers of your type to add to your hand. It costs 0 this turn.' },   // Power Potion
  { id: 'hm-normal',    name: 'HM',           icon: '🃏', rarity: 'common',   effects: { discover: 3, kind: 'skill' }, text: 'Choose 1 of 3 random cards of your type that aren\'t attacks or powers to add to your hand. It costs 0 this turn.' },   // Skill Potion
  { id: 'revival-herb', name: 'Revival Herb', icon: '🌿', rarity: 'uncommon', effects: { recall: 1 }, text: 'Choose a card in your discard pile to put into your hand. It costs 0 this turn.' },   // Liquid Memories
  { id: 'wishing-piece', name: 'Wishing Piece', icon: '🌠', rarity: 'uncommon', map: true, effects: { fill: true }, text: 'Fill your Bag\'s empty slots with random items. Works on the map too.' },   // Entropic Brew
  { id: 'water-gem',    name: 'Water Gem',    icon: '🔵', rarity: 'uncommon', only: 'water', effects: { block: 10, draw: 2 },   text: 'Gain 10 block and draw 2 cards.' },
  // Electric's (docs/duo-design.md section 5: a Gem and a Drive a new type)
  { id: 'electric-gem', name: 'Electric Gem', icon: '🟡', rarity: 'uncommon', only: 'electric', effects: { energy: 2, static: 3 }, text: 'Gain 2 PP. Static 3.' },
  { id: 'shock-drive',  name: 'Shock Drive',  icon: '⚡', rarity: 'uncommon', only: 'electric', effects: { staticMult: 2 }, text: 'Double the enemy\'s Static.' },   // Catalyst, Burn Drive's for Static
  // Ice's
  { id: 'ice-gem',      name: 'Ice Gem',      icon: '🔹', rarity: 'uncommon', only: 'ice', effects: { hail: 3, block: 8 }, text: 'Hail 3. Gain 8 block.' },
  { id: 'chill-drive',  name: 'Chill Drive',  icon: '❄️', rarity: 'uncommon', only: 'ice', effects: { frostMult: 2 }, text: 'Double the enemy\'s Frostbite.' },   // Catalyst, Shock Drive's for Frostbite
  // Fighting's (no Fighting Drive exists: Red Card takes its place)
  { id: 'fighting-gem', name: 'Fighting Gem', icon: '🟤', rarity: 'uncommon', only: 'fighting', effects: { block: 8, counter: 8 }, text: 'Gain 8 block. Counter 8.' },
  { id: 'red-card',     name: 'Red Card',     icon: '🟥', rarity: 'uncommon', only: 'fighting', effects: { counterMult: 2 }, text: 'Double your Counter.' },   // Catalyst, the Drives' shape for Counter
  // Ground's (no Ground Drive exists: Terrain Extender takes its place)
  { id: 'ground-gem',   name: 'Ground Gem',   icon: '🟫', rarity: 'uncommon', only: 'ground', effects: { block: 8, fault: 8 }, text: 'Gain 8 block. Fault 8.' },
  { id: 'terrain-extender', name: 'Terrain Extender', icon: '🌋', rarity: 'uncommon', only: 'ground', effects: { faultMult: 2 }, text: 'Double the enemy\'s Fault.' },   // Catalyst, the Drives' shape for Fault
];

export const ITEMS_BY_ID = Object.fromEntries(ITEMS.map(i => [i.id, i]));

/** How many items the Bag holds at once. */
export const ITEM_SLOTS = 3;

/** After each won fight: `base` chance of an item drop, which goes down by `step` after a drop and up by `step` after a miss. */
export const ITEM_DROP = { base: 0.4, step: 0.1 };

/** How often each rarity comes up in drops and Mart stock. */
export const ITEM_WEIGHTS = { common: 3, uncommon: 2, rare: 1 };

/** The items a starter of this type can find. */
export const itemsForType = (type) => ITEMS.filter(i => !i.only || i.only === type);
