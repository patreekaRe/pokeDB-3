/* ============================================================
   cards.js  -  every card in the game, written as plain data.

   A card is just an object. The "effects" say what it does, and
   describe() turns those effects into the text you read on the card,
   so the text can never get out of sync with what the card really does.

   Effects you can use (all optional):
     damage        deal this much damage
     bonusIfLow    extra damage if your HP is below half
     block         gain this much block (absorbs damage this round)
     heal          restore this much HP
     draw          draw this many cards
     nextEnergy    gain this much extra energy next turn
     focus         your next attack deals this much extra damage
     weaken        the enemy's next attack deals half damage
     burn          burn the enemy (takes damage at the start of its turn)
     guard         completely block the enemy's next attack
     needsWounded  can only be played when you are missing some HP
   ============================================================ */

/** The four card "types". Fire beats Grass, Grass beats Water, Water beats Fire. */
export const TYPES = {
  fire:   { label: 'Fire',    icon: '🔥', beats: 'grass', losesTo: 'water' },
  water:  { label: 'Water',   icon: '💧', beats: 'fire',  losesTo: 'grass' },
  grass:  { label: 'Grass',   icon: '🌿', beats: 'water', losesTo: 'fire'  },
  normal: { label: 'Neutral', icon: '⭐', beats: null,    losesTo: null    },
};

/*
  unlockAt = how many total battle wins you need before the card unlocks.
  0 means available from the start.
*/
const NEUTRAL_CARDS = [
  { id: 'tackle',       name: 'Tackle',       type: 'normal', cost: 1, art: '💥', effects: { damage: 7 } },
  { id: 'block',        name: 'Block',        type: 'normal', cost: 1, art: '🛡️', effects: { block: 6 } },
  { id: 'iron-defense', name: 'Iron Defense', type: 'normal', cost: 2, art: '🏰', effects: { block: 14 } },
  { id: 'quick-guard',  name: 'Quick Guard',  type: 'normal', cost: 2, art: '✋', effects: { guard: true } },
  { id: 'potion',       name: 'Potion',       type: 'normal', cost: 1, art: '🧪', effects: { heal: 10 } },
  { id: 'smokescreen',  name: 'Smokescreen',  type: 'normal', cost: 0, art: '💨', effects: { weaken: true } },
  { id: 'tailwind',     name: 'Tailwind',     type: 'normal', cost: 0, art: '🌬️', effects: { nextEnergy: 1 } },
  { id: 'lucky-claw',   name: 'Lucky Claw',   type: 'normal', cost: 0, art: '🍀', effects: { draw: 2 }, unlockAt: 5 },
];

const FIRE_CARDS = [
  { id: 'ember',           name: 'Ember',           type: 'fire', cost: 1, art: '🔥', effects: { damage: 8 } },
  { id: 'scorch',          name: 'Scorch',          type: 'fire', cost: 1, art: '☄️', effects: { damage: 5, weaken: true } },
  { id: 'heat-up',         name: 'Heat Up',         type: 'fire', cost: 1, art: '📈', effects: { focus: 6 } },
  { id: 'flare-up',        name: 'Flare Up',        type: 'fire', cost: 2, art: '🌋', effects: { damage: 12, bonusIfLow: 10 } },
  { id: 'inferno-charge',  name: 'Inferno Charge',  type: 'fire', cost: 2, art: '⚡', effects: { damage: 8, nextEnergy: 2 } },
  { id: 'fire-spin',       name: 'Fire Spin',       type: 'fire', cost: 1, art: '🌀', effects: { damage: 3, burn: 3 }, unlockAt: 2 },
  { id: 'firestorm',       name: 'Firestorm',       type: 'fire', cost: 3, art: '🌪️', effects: { damage: 30, needsWounded: true }, unlockAt: 4 },
  { id: 'flame-blast',     name: 'Flame Blast',     type: 'fire', cost: 3, art: '💥', effects: { damage: 24, burn: 3 }, unlockAt: 7 },
];

const GRASS_CARDS = [
  { id: 'vine-whip',    name: 'Vine Whip',    type: 'grass', cost: 1, art: '🌿', effects: { damage: 8 } },
  { id: 'stun-spore',   name: 'Stun Spore',   type: 'grass', cost: 1, art: '🍄', effects: { damage: 5, weaken: true } },
  { id: 'growth',       name: 'Growth',       type: 'grass', cost: 1, art: '🌱', effects: { focus: 6 } },
  { id: 'razor-leaf',   name: 'Razor Leaf',   type: 'grass', cost: 2, art: '🍃', effects: { damage: 15 } },
  { id: 'absorb',       name: 'Absorb',       type: 'grass', cost: 1, art: '💚', effects: { damage: 6, heal: 4 } },
  { id: 'synthesis',    name: 'Synthesis',    type: 'grass', cost: 2, art: '☀️', effects: { heal: 14 }, unlockAt: 2 },
  { id: 'petal-dance',  name: 'Petal Dance',  type: 'grass', cost: 2, art: '🌸', effects: { damage: 12, block: 6 }, unlockAt: 4 },
  { id: 'solar-beam',   name: 'Solar Beam',   type: 'grass', cost: 3, art: '🌞', effects: { damage: 28 }, unlockAt: 7 },
];

const WATER_CARDS = [
  { id: 'water-gun',    name: 'Water Gun',    type: 'water', cost: 1, art: '💧', effects: { damage: 8 } },
  { id: 'bubble',       name: 'Bubble',       type: 'water', cost: 1, art: '🫧', effects: { damage: 5, draw: 1 } },
  { id: 'rain-dance',   name: 'Rain Dance',   type: 'water', cost: 1, art: '🌧️', effects: { focus: 6 } },
  { id: 'surf',         name: 'Surf',         type: 'water', cost: 2, art: '🌊', effects: { damage: 15 } },
  { id: 'withdraw',     name: 'Withdraw',     type: 'water', cost: 1, art: '🐚', effects: { block: 9 } },
  { id: 'whirlpool',    name: 'Whirlpool',    type: 'water', cost: 2, art: '🌀', effects: { damage: 8, weaken: true }, unlockAt: 2 },
  { id: 'aqua-ring',    name: 'Aqua Ring',    type: 'water', cost: 1, art: '⭕', effects: { heal: 6, block: 6 }, unlockAt: 4 },
  { id: 'hydro-pump',   name: 'Hydro Pump',   type: 'water', cost: 3, art: '🚿', effects: { damage: 28 }, unlockAt: 7 },
];

/** Every card, and a quick lookup by id (CARDS_BY_ID['ember']). */
export const ALL_CARDS = [...NEUTRAL_CARDS, ...FIRE_CARDS, ...GRASS_CARDS, ...WATER_CARDS];
export const CARDS_BY_ID = Object.fromEntries(ALL_CARDS.map(c => [c.id, c]));

const TYPE_SETS = { fire: FIRE_CARDS, grass: GRASS_CARDS, water: WATER_CARDS };

/** The cards a starter of this type is allowed to use: its own type + neutral cards. */
export function poolForType(type) {
  return [...TYPE_SETS[type], ...NEUTRAL_CARDS];
}

/** A ready-made 10-card deck so a new player can press "Battle!" straight away. */
export function defaultDeck(type) {
  const [basic, second, buff, strong] = TYPE_SETS[type];
  return [basic, basic, basic, second, buff, strong, 'block', 'block', 'block', 'tailwind']
    .map(c => (typeof c === 'string' ? c : c.id));
}

/** Rules for building a deck. */
export const DECK_MIN = 5;
export const DECK_MAX = 10;
export const MAX_COPIES = 3;

/** Turns a card's effects into a readable sentence. */
export function describe(card) {
  const e = card.effects;
  const parts = [];
  if (e.damage)       parts.push(`Deal ${e.damage} damage.`);
  if (e.bonusIfLow)   parts.push(`+${e.bonusIfLow} if your HP is below half.`);
  if (e.burn)         parts.push(`Burn ${e.burn}.`);
  if (e.weaken)       parts.push('Enemy\'s next attack deals half damage.');
  if (e.guard)        parts.push('Block the enemy\'s next attack completely.');
  if (e.block)        parts.push(`Gain ${e.block} block.`);
  if (e.heal)         parts.push(`Heal ${e.heal} HP.`);
  if (e.focus)        parts.push(`Your next attack deals +${e.focus} damage.`);
  if (e.draw)         parts.push(`Draw ${e.draw} card${e.draw > 1 ? 's' : ''}.`);
  if (e.nextEnergy)   parts.push(`+${e.nextEnergy} energy next turn.`);
  if (e.needsWounded) parts.push('Only playable if you are hurt.');
  return parts.join(' ');
}
