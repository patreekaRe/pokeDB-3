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
     hits          the damage lands this many times (strength, relics and
                   block apply to every hit; focus only to the first)
     blockDamage   the damage is your current block (instead of `damage`)
     bonusPerBurn  extra damage per Burn stack on the enemy
     strengthMult  your strength counts this many times on this attack
     selfDamage    lose this much HP first (never below 1; it can switch on bonusIfLow)
     strength      +this much damage on every hit for the rest of the fight
     energy        gain this much energy right now

   Power effects (only on `power: true` cards, see POWERS below):
     blockEachTurn, healEachTurn, burnEachTurn, strengthEachTurn,
     drawEachTurn, thorns, blaze

   A card can also have (these sit next to `effects`, not inside it):
     exhaust    true = this card leaves the fight after you play it once
                (it won't reshuffle back into your draw pile until your
                next battle). Good for strong effects that shouldn't be
                spammed every turn.
     power      true = playing it switches on its power effects for the
                rest of the fight, and the card leaves the fight.
     retain     true = it stays in your hand when your turn ends.
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
  // The free cards were picked over everything else, so the two strongest now work once per fight.
  { id: 'smokescreen',  name: 'Smokescreen',  type: 'normal', cost: 0, art: '💨', effects: { weaken: true }, exhaust: true },
  { id: 'tailwind',     name: 'Tailwind',     type: 'normal', cost: 0, art: '🌬️', effects: { nextEnergy: 1 } },
  { id: 'lucky-claw',   name: 'Lucky Claw',   type: 'normal', cost: 0, art: '🍀', effects: { draw: 2 }, exhaust: true, rarity: 'uncommon' },
  { id: 'double-hit',   name: 'Double Hit',   type: 'normal', cost: 1, art: '💥', effects: { damage: 4, hits: 2 } },
  { id: 'swords-dance', name: 'Swords Dance', type: 'normal', cost: 1, art: '⚔️', effects: { strength: 2 }, exhaust: true, rarity: 'uncommon' },
  { id: 'agility',      name: 'Agility',      type: 'normal', cost: 0, art: '⚡', effects: { energy: 1, draw: 1 }, exhaust: true, rarity: 'uncommon' },
];

/* Each type plays its own way:
     Fire   burn that stacks up, big hits, and trading HP for damage
     Grass  healing, and strength that grows over a long fight
     Water  block, card draw, hitting back, and turning block into damage */
const FIRE_CARDS = [
  { id: 'ember',           name: 'Ember',           type: 'fire', cost: 1, art: '🔥', effects: { damage: 9 } },
  { id: 'scorch',          name: 'Scorch',          type: 'fire', cost: 1, art: '☄️', effects: { damage: 5, weaken: true } },
  { id: 'flame-wall',      name: 'Flame Wall',      type: 'fire', cost: 1, art: '🧱', effects: { block: 9 } },
  // The three "set up your next hit" cards (Heat Up, Growth, Rain Dance) each lean into
  // their type's identity: Fire is pure burst, Grass adds a little sustain, Water adds a little safety.
  { id: 'heat-up',         name: 'Heat Up',         type: 'fire', cost: 1, art: '📈', effects: { focus: 8 } },
  { id: 'flare-up',        name: 'Flare Up',        type: 'fire', cost: 2, art: '🌋', effects: { damage: 14, bonusIfLow: 10 } },
  { id: 'inferno-charge',  name: 'Inferno Charge',  type: 'fire', cost: 2, art: '⚡', effects: { damage: 8, nextEnergy: 2 } },
  { id: 'will-o-wisp',     name: 'Will-O-Wisp',     type: 'fire', cost: 1, art: '👻', effects: { burn: 3, weaken: true } },
  { id: 'flame-body',      name: 'Flame Body',      type: 'fire', cost: 1, art: '🛡️', effects: { block: 8, burn: 2 } },
  { id: 'fire-lash',       name: 'Fire Lash',       type: 'fire', cost: 1, art: '🦷', effects: { damage: 5, hits: 2 } },
  { id: 'fire-spin',       name: 'Fire Spin',       type: 'fire', cost: 1, art: '🌀', effects: { damage: 3, burn: 4 }, rarity: 'uncommon' },
  { id: 'flare-blitz',     name: 'Flare Blitz',     type: 'fire', cost: 2, art: '☄️', effects: { selfDamage: 5, damage: 22 }, rarity: 'uncommon' },
  { id: 'inferno',         name: 'Inferno',         type: 'fire', cost: 2, art: '🌪️', effects: { damage: 6, bonusPerBurn: 2 }, rarity: 'uncommon' },
  { id: 'heat-wave',       name: 'Heat Wave',       type: 'fire', cost: 2, art: '♨️', effects: { damage: 5, hits: 3, burn: 2 }, rarity: 'uncommon' },
  { id: 'sunny-day',       name: 'Sunny Day',       type: 'fire', cost: 1, art: '☀️', effects: { burnEachTurn: 2 }, power: true, rarity: 'uncommon' },
  { id: 'firestorm',       name: 'Firestorm',       type: 'fire', cost: 3, art: '🌪️', effects: { damage: 30, needsWounded: true }, rarity: 'rare' },
  { id: 'flame-blast',     name: 'Flame Blast',     type: 'fire', cost: 3, art: '💥', effects: { damage: 24, burn: 3 }, rarity: 'rare' },
  { id: 'blaze',           name: 'Blaze',           type: 'fire', cost: 1, art: '🌋', effects: { blaze: 6 }, power: true, rarity: 'rare' },
];

const GRASS_CARDS = [
  { id: 'vine-whip',    name: 'Vine Whip',    type: 'grass', cost: 1, art: '🌿', effects: { damage: 8 } },
  { id: 'stun-spore',   name: 'Stun Spore',   type: 'grass', cost: 1, art: '🍄', effects: { damage: 5, weaken: true } },
  { id: 'growth',       name: 'Growth',       type: 'grass', cost: 1, art: '🌱', effects: { focus: 5, heal: 3 } },
  { id: 'razor-leaf',   name: 'Razor Leaf',   type: 'grass', cost: 2, art: '🍃', effects: { damage: 15 } },
  { id: 'absorb',       name: 'Absorb',       type: 'grass', cost: 1, art: '💚', effects: { damage: 6, heal: 4 } },
  { id: 'bullet-seed',  name: 'Bullet Seed',  type: 'grass', cost: 1, art: '🌱', effects: { damage: 3, hits: 3 } },
  { id: 'mega-drain',   name: 'Mega Drain',   type: 'grass', cost: 2, art: '💚', effects: { damage: 11, heal: 6 } },
  { id: 'cotton-guard', name: 'Cotton Guard', type: 'grass', cost: 1, art: '🛡️', effects: { block: 8 }, retain: true },
  { id: 'synthesis',    name: 'Synthesis',    type: 'grass', cost: 2, art: '☀️', effects: { heal: 14 }, rarity: 'uncommon' },
  { id: 'petal-dance',  name: 'Petal Dance',  type: 'grass', cost: 2, art: '🌸', effects: { damage: 12, block: 6 }, rarity: 'uncommon' },
  { id: 'leaf-blade',   name: 'Leaf Blade',   type: 'grass', cost: 2, art: '🍃', effects: { damage: 10, strength: 2 }, rarity: 'uncommon' },
  { id: 'sleep-powder', name: 'Sleep Powder', type: 'grass', cost: 1, art: '🍄', effects: { weaken: true, draw: 1 }, retain: true, rarity: 'uncommon' },
  { id: 'ingrain',      name: 'Ingrain',      type: 'grass', cost: 1, art: '🌳', effects: { healEachTurn: 3 }, power: true, rarity: 'uncommon' },
  { id: 'solar-beam',   name: 'Solar Beam',   type: 'grass', cost: 3, art: '🌞', effects: { damage: 28 }, rarity: 'rare' },
  { id: 'grassy-terrain', name: 'Grassy Terrain', type: 'grass', cost: 2, art: '🌿', effects: { strengthEachTurn: 1 }, power: true, rarity: 'rare' },
  { id: 'power-whip',   name: 'Power Whip',   type: 'grass', cost: 2, art: '🌳', effects: { damage: 10, strengthMult: 3 }, rarity: 'rare' },
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
  { id: 'water-pulse',  name: 'Water Pulse',  type: 'water', cost: 1, art: '💧', effects: { damage: 7 }, retain: true },
  { id: 'dive',         name: 'Dive',         type: 'water', cost: 1, art: '🌊', effects: { block: 7, draw: 1 } },
  { id: 'clamp',        name: 'Clamp',        type: 'water', cost: 2, art: '🐚', effects: { damage: 9, block: 9 } },
  { id: 'razor-shell',  name: 'Razor Shell',  type: 'water', cost: 1, art: '🐚', effects: { blockDamage: true }, rarity: 'uncommon' },
  { id: 'surging-strikes', name: 'Surging Strikes', type: 'water', cost: 2, art: '🌊', effects: { damage: 5, hits: 3 }, rarity: 'uncommon' },
  { id: 'mirror-coat',  name: 'Mirror Coat',  type: 'water', cost: 1, art: '🔮', effects: { thorns: 5 }, power: true, rarity: 'uncommon' },
  { id: 'water-veil',   name: 'Water Veil',   type: 'water', cost: 2, art: '🌧️', effects: { blockEachTurn: 5 }, power: true, rarity: 'uncommon' },
  { id: 'hydro-pump',   name: 'Hydro Pump',   type: 'water', cost: 3, art: '🚿', effects: { damage: 28 }, rarity: 'rare' },
  { id: 'primordial-sea', name: 'Primordial Sea', type: 'water', cost: 2, art: '🌀', effects: { drawEachTurn: 1, blockEachTurn: 3 }, power: true, rarity: 'rare' },
];

/* ============================================================
   EVOLUTION CARDS  -  powerful, signature moves you don't win from
   normal fights. There are two TIERS per type, one per evolution:

     MID tier   offered when you evolve for the FIRST time
                (Charmander -> Charmeleon, Bulbasaur -> Ivysaur, ...)
     HIGH tier  offered when you evolve for the SECOND time, into
                your final form (-> Charizard, Venusaur, Blastoise, ...)

   Each tier has 4 cards; you choose 1 of a random 2 (see
   evolutionChoices() in rewards.js). High tier is meant to feel like
   a real power spike, not just "mid tier with bigger numbers" - it
   costs more energy on average and its top card in each type
   (Blast Burn / Frenzy Plant / Hydro Cannon) is the strongest single
   hit in the game.
   ============================================================ */

const FIRE_EVO_MID = [
  { id: 'flame-charge', name: 'Flame Charge', type: 'fire', cost: 1, art: '⚡', effects: { damage: 10, nextEnergy: 1 }, evoOnly: true, maxCopies: 1 },
  { id: 'fire-fang',    name: 'Fire Fang',    type: 'fire', cost: 1, art: '🦷', effects: { damage: 8, burn: 3 }, evoOnly: true, maxCopies: 1 },
  { id: 'flame-wheel',  name: 'Flame Wheel',  type: 'fire', cost: 2, art: '🔥', effects: { damage: 16 }, evoOnly: true, maxCopies: 1 },
  { id: 'incinerate',   name: 'Incinerate',   type: 'fire', cost: 2, art: '🌪️', effects: { damage: 14, weaken: true }, evoOnly: true, maxCopies: 1 },
];
const FIRE_EVO_HIGH = [
  { id: 'flamethrower', name: 'Flamethrower', type: 'fire', cost: 2, art: '🔥', effects: { damage: 22, burn: 3 }, evoOnly: true, maxCopies: 1 },
  { id: 'fire-blast',   name: 'Fire Blast',   type: 'fire', cost: 3, art: '☄️', effects: { damage: 24, burn: 5 }, evoOnly: true, maxCopies: 1 },
  { id: 'overheat',     name: 'Overheat',     type: 'fire', cost: 3, art: '☀️', effects: { damage: 30, bonusIfLow: 12 }, evoOnly: true, maxCopies: 1 },
  { id: 'blast-burn',   name: 'Blast Burn',   type: 'fire', cost: 3, art: '🌋', effects: { damage: 34 }, evoOnly: true, maxCopies: 1 },
];

const GRASS_EVO_MID = [
  { id: 'leech-seed',    name: 'Leech Seed',    type: 'grass', cost: 1, art: '🌱', effects: { damage: 8, heal: 5 }, evoOnly: true, maxCopies: 1 },
  { id: 'bulk-up',       name: 'Bulk Up',       type: 'grass', cost: 1, art: '💪', effects: { strength: 2, block: 6 }, evoOnly: true, maxCopies: 1 },
  { id: 'razor-storm',   name: 'Razor Storm',   type: 'grass', cost: 2, art: '🍃', effects: { damage: 16 }, evoOnly: true, maxCopies: 1 },
  { id: 'poison-powder', name: 'Poison Powder', type: 'grass', cost: 1, art: '☠️', effects: { weaken: true, heal: 3 }, evoOnly: true, maxCopies: 1 },
];
const GRASS_EVO_HIGH = [
  { id: 'giga-drain',    name: 'Giga Drain',    type: 'grass', cost: 2, art: '🩸', effects: { damage: 20, heal: 12 }, evoOnly: true, maxCopies: 1 },
  { id: 'petal-blizzard', name: 'Petal Blizzard', type: 'grass', cost: 2, art: '🌸', effects: { damage: 24 }, evoOnly: true, maxCopies: 1 },
  { id: 'leaf-storm',    name: 'Leaf Storm',    type: 'grass', cost: 3, art: '🍂', effects: { damage: 26, block: 8 }, evoOnly: true, maxCopies: 1 },
  { id: 'frenzy-plant',  name: 'Frenzy Plant',  type: 'grass', cost: 3, art: '🌳', effects: { damage: 34 }, evoOnly: true, maxCopies: 1 },
];

const WATER_EVO_MID = [
  { id: 'aqua-jet',    name: 'Aqua Jet',    type: 'water', cost: 1, art: '💨', effects: { damage: 10, block: 4 }, evoOnly: true, maxCopies: 1 },
  { id: 'bubble-beam', name: 'Bubble Beam', type: 'water', cost: 1, art: '🫧', effects: { damage: 10, weaken: true }, evoOnly: true, maxCopies: 1 },
  { id: 'brine',       name: 'Brine',       type: 'water', cost: 2, art: '🌊', effects: { damage: 16 }, evoOnly: true, maxCopies: 1 },
  { id: 'rain-shield', name: 'Rain Shield', type: 'water', cost: 1, art: '🌧️', effects: { block: 10, heal: 2 }, evoOnly: true, maxCopies: 1 },
];
const WATER_EVO_HIGH = [
  { id: 'scald',        name: 'Scald',        type: 'water', cost: 2, art: '♨️', effects: { damage: 20, weaken: true }, evoOnly: true, maxCopies: 1 },
  { id: 'wave-crash',   name: 'Wave Crash',   type: 'water', cost: 2, art: '🌊', effects: { damage: 24, block: 6 }, evoOnly: true, maxCopies: 1 },
  { id: 'origin-pulse', name: 'Origin Pulse', type: 'water', cost: 3, art: '🌀', effects: { damage: 26, focus: 6 }, evoOnly: true, maxCopies: 1 },
  { id: 'hydro-cannon', name: 'Hydro Cannon', type: 'water', cost: 3, art: '🚿', effects: { damage: 34 }, evoOnly: true, maxCopies: 1 },
];

/** Every card, and a quick lookup by id (CARDS_BY_ID['ember']). */
export const ALL_CARDS = [
  ...NEUTRAL_CARDS, ...FIRE_CARDS, ...GRASS_CARDS, ...WATER_CARDS,
  ...FIRE_EVO_MID, ...FIRE_EVO_HIGH, ...GRASS_EVO_MID, ...GRASS_EVO_HIGH, ...WATER_EVO_MID, ...WATER_EVO_HIGH,
];
export const CARDS_BY_ID = Object.fromEntries(ALL_CARDS.map(c => [c.id, c]));

const TYPE_SETS = { fire: FIRE_CARDS, grass: GRASS_CARDS, water: WATER_CARDS };
// Keyed by the evolution STAGE you're reaching: 1 = your first evolution (mid tier),
// 2 = your final evolution (high tier).
const EVO_SETS = {
  fire:  { 1: FIRE_EVO_MID,  2: FIRE_EVO_HIGH },
  grass: { 1: GRASS_EVO_MID, 2: GRASS_EVO_HIGH },
  water: { 1: WATER_EVO_MID, 2: WATER_EVO_HIGH },
};

/** The cards a starter of this type can win as rewards: its own type + neutral cards. */
export function poolForType(type) {
  return [...TYPE_SETS[type], ...NEUTRAL_CARDS];
}

/** The 4 signature evolution cards for a starter's type at a given evolution stage (1 or 2). */
export function evolutionCardsFor(type, stage) {
  return (EVO_SETS[type] && EVO_SETS[type][stage]) || [];
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
  for (const key of ['damage', 'bonusIfLow', 'block', 'heal', 'focus', 'blockEachTurn', 'healEachTurn', 'thorns', 'blaze']) {
    if (e[key]) e[key] = Math.round(e[key] * k);
  }
  if (e.burn) e.burn += stage;
  return e;
}

/**
 * The power effects: what each one does at full strength, and the badge it shows
 * on your nameplate while it's switched on (battle.js adds up every power you play).
 */
export const POWERS = {
  blockEachTurn:    { icon: '🏰', text: (n) => `At the start of each turn, gain ${n} block.` },
  healEachTurn:     { icon: '💚', text: (n) => `At the start of each turn, heal ${n} HP.` },
  burnEachTurn:     { icon: '☀️', text: (n) => `At the start of each turn, Burn the enemy ${n}.` },
  strengthEachTurn: { icon: '🌱', text: (n) => `At the start of each turn, gain ${n} strength.` },
  drawEachTurn:     { icon: '🌧️', text: (n) => `Draw ${n} more card${n > 1 ? 's' : ''} each turn.` },
  thorns:           { icon: '🔮', text: (n) => `When the enemy attacks you, it takes ${n} damage.` },
  blaze:            { icon: '🌋', text: (n) => `Your attacks deal +${n} while your HP is below half.` },
};

/** Turns a card's effects into a readable sentence. */
export function describe(card, stage = 0) {
  const e = scaledEffects(card, stage);
  const parts = [];
  if (e.selfDamage)   parts.push(`Lose ${e.selfDamage} HP.`);
  if (e.damage)       parts.push(`Deal ${e.damage} damage${e.hits > 1 ? ` ${e.hits} times` : ''}.`);
  if (e.blockDamage)  parts.push('Deal damage equal to your block.');
  if (e.bonusIfLow)   parts.push(`+${e.bonusIfLow} if your HP is below half.`);
  if (e.bonusPerBurn) parts.push(`+${e.bonusPerBurn} for each Burn on the enemy.`);
  if (e.strengthMult) parts.push(`Strength counts ${e.strengthMult} times.`);
  if (e.burn)         parts.push(`Burn ${e.burn}.`);
  if (e.weaken)       parts.push('Enemy\'s next attack deals half damage.');
  if (e.guard)        parts.push('Block the enemy\'s next attack completely.');
  if (e.block)        parts.push(`Gain ${e.block} block.`);
  if (e.heal)         parts.push(`Heal ${e.heal} HP.`);
  if (e.strength)     parts.push(`Your hits deal +${e.strength} all fight.`);
  if (e.focus)        parts.push(`Your next attack deals +${e.focus} damage.`);
  if (e.energy)       parts.push(`Gain ${e.energy} energy.`);
  if (e.draw)         parts.push(`Draw ${e.draw} card${e.draw > 1 ? 's' : ''}.`);
  if (e.nextEnergy)   parts.push(`+${e.nextEnergy} energy next turn.`);
  for (const [key, power] of Object.entries(POWERS)) if (e[key]) parts.push(power.text(e[key]));
  if (e.needsWounded) parts.push('Only playable if you are hurt.');
  if (card.retain)    parts.push('Stays in hand between turns.');
  if (card.exhaust)   parts.push('Exhausts after use.');
  return parts.join(' ');
}
