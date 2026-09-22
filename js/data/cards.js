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

   A card can also have (these sit next to `effects`, not inside it):
     exhaust    true = this card leaves the fight after you play it once
                (it won't reshuffle back into your draw pile until your
                next battle). Good for strong effects that shouldn't be
                spammed every turn.
     evoOnly    true = this card is never offered as a normal reward.
                It only appears in the "choose 1 of 2" screen you get
                when your starter evolves (see evolutionCardsFor below).
     maxCopies  overrides MAX_COPIES for this one card (evolution cards
                are capped at 1 copy - they're meant to be a signature move).

   rarity: 'common' (default), 'uncommon' or 'rare'. It decides how
   often a card shows up as a reward, and in which biome.
   ============================================================ */

/** How strong the type chart is. Attacks that beat the target's type do this much more damage, and attacks that lose do this much less. It works both ways: on your attacks and on the enemy's attacks. */
export const SUPER_EFFECTIVE = 1.3;
export const NOT_VERY_EFFECTIVE = 0.75;

/** The four card "types". Fire beats Grass, Grass beats Water, Water beats Fire. */
export const TYPES = {
  fire:   { label: 'Fire',    icon: '🔥', beats: 'grass', losesTo: 'water' },
  water:  { label: 'Water',   icon: '💧', beats: 'fire',  losesTo: 'grass' },
  grass:  { label: 'Grass',   icon: '🌿', beats: 'water', losesTo: 'fire'  },
  normal: { label: 'Neutral', icon: '⭐', beats: null,    losesTo: null    },
};

const NEUTRAL_CARDS = [
  { id: 'tackle',       name: 'Tackle',       type: 'normal', cost: 1, art: '💥', effects: { damage: 7 } },
  { id: 'block',        name: 'Block',        type: 'normal', cost: 1, art: '🛡️', effects: { block: 6 } },
  { id: 'iron-defense', name: 'Iron Defense', type: 'normal', cost: 2, art: '🏰', effects: { block: 14 } },
  { id: 'quick-guard',  name: 'Quick Guard',  type: 'normal', cost: 2, art: '✋', effects: { guard: true } },
  // Potion is reward-only now (no starter begins with a free heal) and exhausts,
  // so it's a one-time save rather than a card you can loop every turn.
  { id: 'potion',       name: 'Potion',       type: 'normal', cost: 1, art: '🧪', effects: { heal: 10 }, exhaust: true },
  { id: 'smokescreen',  name: 'Smokescreen',  type: 'normal', cost: 0, art: '💨', effects: { weaken: true } },
  { id: 'tailwind',     name: 'Tailwind',     type: 'normal', cost: 0, art: '🌬️', effects: { nextEnergy: 1 } },
  { id: 'lucky-claw',   name: 'Lucky Claw',   type: 'normal', cost: 0, art: '🍀', effects: { draw: 2 }, rarity: 'uncommon' },
];

const FIRE_CARDS = [
  { id: 'ember',           name: 'Ember',           type: 'fire', cost: 1, art: '🔥', effects: { damage: 8 } },
  { id: 'scorch',          name: 'Scorch',          type: 'fire', cost: 1, art: '☄️', effects: { damage: 5, weaken: true } },
  { id: 'flame-wall',      name: 'Flame Wall',      type: 'fire', cost: 1, art: '🧱', effects: { block: 9 } },
  // The three "set up your next hit" cards (Heat Up, Growth, Rain Dance) each lean into
  // their type's identity: Fire is pure burst, Grass adds a little sustain, Water adds a little safety.
  { id: 'heat-up',         name: 'Heat Up',         type: 'fire', cost: 1, art: '📈', effects: { focus: 8 } },
  { id: 'flare-up',        name: 'Flare Up',        type: 'fire', cost: 2, art: '🌋', effects: { damage: 14, bonusIfLow: 10 } },
  { id: 'inferno-charge',  name: 'Inferno Charge',  type: 'fire', cost: 2, art: '⚡', effects: { damage: 8, nextEnergy: 2 } },
  { id: 'fire-spin',       name: 'Fire Spin',       type: 'fire', cost: 1, art: '🌀', effects: { damage: 3, burn: 3 }, rarity: 'uncommon' },
  { id: 'firestorm',       name: 'Firestorm',       type: 'fire', cost: 3, art: '🌪️', effects: { damage: 30, needsWounded: true }, rarity: 'rare' },
  { id: 'flame-blast',     name: 'Flame Blast',     type: 'fire', cost: 3, art: '💥', effects: { damage: 24, burn: 3 }, rarity: 'rare' },
];

const GRASS_CARDS = [
  { id: 'vine-whip',    name: 'Vine Whip',    type: 'grass', cost: 1, art: '🌿', effects: { damage: 8 } },
  { id: 'stun-spore',   name: 'Stun Spore',   type: 'grass', cost: 1, art: '🍄', effects: { damage: 5, weaken: true } },
  { id: 'growth',       name: 'Growth',       type: 'grass', cost: 1, art: '🌱', effects: { focus: 5, heal: 3 } },
  { id: 'razor-leaf',   name: 'Razor Leaf',   type: 'grass', cost: 2, art: '🍃', effects: { damage: 15 } },
  { id: 'absorb',       name: 'Absorb',       type: 'grass', cost: 1, art: '💚', effects: { damage: 6, heal: 4 } },
  { id: 'synthesis',    name: 'Synthesis',    type: 'grass', cost: 2, art: '☀️', effects: { heal: 14 }, rarity: 'uncommon' },
  { id: 'petal-dance',  name: 'Petal Dance',  type: 'grass', cost: 2, art: '🌸', effects: { damage: 12, block: 6 }, rarity: 'uncommon' },
  { id: 'solar-beam',   name: 'Solar Beam',   type: 'grass', cost: 3, art: '🌞', effects: { damage: 28 }, rarity: 'rare' },
];

const WATER_CARDS = [
  { id: 'water-gun',    name: 'Water Gun',    type: 'water', cost: 1, art: '💧', effects: { damage: 8 } },
  { id: 'bubble',       name: 'Bubble',       type: 'water', cost: 1, art: '🫧', effects: { damage: 5, draw: 1 } },
  { id: 'rain-dance',   name: 'Rain Dance',   type: 'water', cost: 1, art: '🌧️', effects: { focus: 5, block: 4 } },
  { id: 'surf',         name: 'Surf',         type: 'water', cost: 2, art: '🌊', effects: { damage: 15 } },
  { id: 'withdraw',     name: 'Withdraw',     type: 'water', cost: 1, art: '🐚', effects: { block: 9 } },
  { id: 'whirlpool',    name: 'Whirlpool',    type: 'water', cost: 2, art: '🌀', effects: { damage: 8, weaken: true }, rarity: 'uncommon' },
  // Aqua Ring used to heal 6 + block 6, which was strong for a 1-cost card. Heal is now smaller,
  // so it reads as a defensive card with a little sustain, not a free heal.
  { id: 'aqua-ring',    name: 'Aqua Ring',    type: 'water', cost: 1, art: '⭕', effects: { heal: 3, block: 6 }, rarity: 'uncommon' },
  { id: 'hydro-pump',   name: 'Hydro Pump',   type: 'water', cost: 3, art: '🚿', effects: { damage: 28 }, rarity: 'rare' },
];

/* ============================================================
   EVOLUTION CARDS  -  powerful, signature moves you don't win from
   normal fights. When your starter evolves you choose 1 of 2 of
   these (see evolutionChoices() in rewards.js). Each type has 4;
   you'll own 2 of them by the time you finish a run (one per
   evolution), so the choice never repeats a card you already have.
   ============================================================ */

const FIRE_EVO_CARDS = [
  { id: 'flare-blitz', name: 'Flare Blitz', type: 'fire', cost: 2, art: '💥', effects: { damage: 20 }, evoOnly: true, maxCopies: 1 },
  { id: 'inferno',     name: 'Inferno',     type: 'fire', cost: 2, art: '🌋', effects: { damage: 14, burn: 5 }, evoOnly: true, maxCopies: 1 },
  { id: 'fire-blast',  name: 'Fire Blast',  type: 'fire', cost: 3, art: '🔥', effects: { damage: 22, burn: 4 }, evoOnly: true, maxCopies: 1 },
  { id: 'overheat',    name: 'Overheat',    type: 'fire', cost: 3, art: '☀️', effects: { damage: 26, bonusIfLow: 10 }, evoOnly: true, maxCopies: 1 },
];

const GRASS_EVO_CARDS = [
  { id: 'spore',        name: 'Spore',        type: 'grass', cost: 1, art: '🍄', effects: { weaken: true, focus: 8 }, evoOnly: true, maxCopies: 1 },
  { id: 'giga-drain',   name: 'Giga Drain',   type: 'grass', cost: 2, art: '🩸', effects: { damage: 16, heal: 10 }, evoOnly: true, maxCopies: 1 },
  { id: 'frenzy-plant', name: 'Frenzy Plant', type: 'grass', cost: 3, art: '🌳', effects: { damage: 22, block: 8 }, evoOnly: true, maxCopies: 1 },
  { id: 'leaf-storm',   name: 'Leaf Storm',   type: 'grass', cost: 3, art: '🍂', effects: { damage: 26 }, evoOnly: true, maxCopies: 1 },
];

const WATER_EVO_CARDS = [
  { id: 'aqua-jet',     name: 'Aqua Jet',     type: 'water', cost: 1, art: '💨', effects: { damage: 14 }, evoOnly: true, maxCopies: 1 },
  { id: 'wave-crash',   name: 'Wave Crash',   type: 'water', cost: 2, art: '🌊', effects: { damage: 18, focus: 4 }, evoOnly: true, maxCopies: 1 },
  { id: 'scald',        name: 'Scald',        type: 'water', cost: 2, art: '♨️', effects: { damage: 16, weaken: true }, evoOnly: true, maxCopies: 1 },
  { id: 'hydro-cannon', name: 'Hydro Cannon', type: 'water', cost: 3, art: '🌊', effects: { damage: 26 }, evoOnly: true, maxCopies: 1 },
];

/** Every card, and a quick lookup by id (CARDS_BY_ID['ember']). */
export const ALL_CARDS = [
  ...NEUTRAL_CARDS, ...FIRE_CARDS, ...GRASS_CARDS, ...WATER_CARDS,
  ...FIRE_EVO_CARDS, ...GRASS_EVO_CARDS, ...WATER_EVO_CARDS,
];
export const CARDS_BY_ID = Object.fromEntries(ALL_CARDS.map(c => [c.id, c]));

const TYPE_SETS = { fire: FIRE_CARDS, grass: GRASS_CARDS, water: WATER_CARDS };
const EVO_SETS = { fire: FIRE_EVO_CARDS, grass: GRASS_EVO_CARDS, water: WATER_EVO_CARDS };

/** The cards a starter of this type can win as rewards: its own type + neutral cards. */
export function poolForType(type) {
  return [...TYPE_SETS[type], ...NEUTRAL_CARDS];
}

/** The 4 signature evolution cards for a starter's type (see evolutionChoices() in rewards.js). */
export function evolutionCardsFor(type) {
  return EVO_SETS[type];
}

/** You can own at most this many copies of one card in a run (unless the card sets its own maxCopies). */
export const MAX_COPIES = 3;

/* ---------- evolution makes moves stronger ---------- */

/** Each evolution stage makes damage, block, healing and focus this much stronger. */
export const STAGE_POWER = 0.15;

/** A card's effects after applying the evolution bonus (stage 0 = unchanged). */
export function scaledEffects(card, stage = 0) {
  const e = { ...card.effects };
  const k = 1 + STAGE_POWER * stage;
  for (const key of ['damage', 'bonusIfLow', 'block', 'heal', 'focus']) {
    if (e[key]) e[key] = Math.round(e[key] * k);
  }
  if (e.burn) e.burn += stage;
  return e;
}

/** Turns a card's effects into a readable sentence. */
export function describe(card, stage = 0) {
  const e = scaledEffects(card, stage);
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
  if (card.exhaust)   parts.push('Exhausts after use.');
  return parts.join(' ');
}
