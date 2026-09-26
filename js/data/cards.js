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
     weaken        Weak: the enemy deals 25% less damage for this many turns
     vulnerable    Vulnerable: the enemy takes 50% more from your attacks for this many turns
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
     sprite     an assets/items/ file name (no .png) drawn as the art in place of the emoji.

   rarity: 'common' (default), 'uncommon' or 'rare'. It decides how
   often a card shows up as a reward, and in which biome.
   ============================================================ */

/** How strong the type chart is. Attacks that beat the target's type do this much more damage, and attacks that lose do this much less. It works both ways: on your attacks and on the enemy's attacks. */
export const SUPER_EFFECTIVE = 1.3;
export const NOT_VERY_EFFECTIVE = 0.75;

/** StS's Weak and Vulnerable. Both wear off by one at the end of each enemy turn. */
export const WEAK_MULT = 0.75;
export const VULNERABLE_MULT = 1.5;

/** The four card "types". Fire beats Grass, Grass beats Water, Water beats Fire. */
export const TYPES = {
  fire:   { label: 'Fire',    icon: '🔥', beats: 'grass', losesTo: 'water' },
  water:  { label: 'Water',   icon: '💧', beats: 'fire',  losesTo: 'grass' },
  grass:  { label: 'Grass',   icon: '🌿', beats: 'water', losesTo: 'fire'  },
  normal: { label: 'Neutral', icon: '🔯', beats: null,    losesTo: null    },
};

/* Every card is modelled on a Slay the Spire 1 card (named in its comment), at StS's numbers
   times ~1.2 (Strike 6 -> 7, Defend 5 -> 6), so the cards keep StS's price per energy:
   1 energy buys ~7 damage or ~6 block, draw 1 is worth ~3 damage, Weak 1 ~2-3, and
   uncommons/rares give ~20%/~50% more than a common. Enemies are tuned around the cards. */
const NEUTRAL_CARDS = [
  { id: 'tackle',       name: 'Tackle',       type: 'normal', cost: 1, art: '💥', sprite: 'hit-spark', effects: { damage: 7 } },                 // Strike
  { id: 'block',        name: 'Block',        type: 'normal', cost: 1, art: '🛡️', sprite: 'shield', effects: { block: 6 } },                    // Defend
  { id: 'iron-defense', name: 'Iron Defense', type: 'normal', cost: 2, art: '🏰', sprite: 'metal-coat', effects: { block: 22 }, exhaust: true, rarity: 'uncommon' },   // Impervious
  { id: 'quick-guard',  name: 'Quick Guard',  type: 'normal', cost: 2, art: '✋', sprite: 'protective-pads', effects: { guard: true } },
  { id: 'potion',       name: 'Potion',       type: 'normal', cost: 1, art: '🧪', sprite: 'potion', effects: { heal: 10 }, exhaust: true },      // Bandage Up
  { id: 'smokescreen',  name: 'Smokescreen',  type: 'normal', cost: 0, art: '💨', sprite: 'smoke-ball', effects: { weaken: 2 }, exhaust: true },   // Intimidate
  { id: 'tailwind',     name: 'Tailwind',     type: 'normal', cost: 0, art: '🌬️', sprite: 'air-balloon', effects: { nextEnergy: 1 } },
  { id: 'lucky-claw',   name: 'Lucky Claw',   type: 'normal', cost: 0, art: '🍀', sprite: 'razor-claw', effects: { draw: 2 }, exhaust: true, rarity: 'uncommon' },   // Finesse
  { id: 'double-hit',   name: 'Double Hit',   type: 'normal', cost: 1, art: '💥', sprite: 'lucky-punch', effects: { damage: 5, hits: 2 } },     // Twin Strike
  { id: 'swords-dance', name: 'Swords Dance', type: 'normal', cost: 1, art: '⚔️', sprite: 'rusted-sword', effects: { strength: 2 }, exhaust: true, rarity: 'uncommon' },   // Inflame
  { id: 'agility',      name: 'Agility',      type: 'normal', cost: 0, art: '⚡', sprite: 'quick-powder', effects: { energy: 1, draw: 2 }, exhaust: true, rarity: 'uncommon' },   // Adrenaline
  { id: 'leer',         name: 'Leer',         type: 'normal', cost: 0, art: '👀', sprite: 'black-glasses', effects: { vulnerable: 2 }, rarity: 'uncommon' },   // Trip
];

/* Each type plays its own way:
     Fire   burn that stacks up, big hits, and trading HP for damage (StS's Ironclad + Silent's poison)
     Grass  healing, and strength that grows over a long fight (Ironclad's strength, Reaper)
     Water  block, card draw, hitting back, and turning block into damage (Ironclad's block cards, Silent's draw)
   Every starting deck is StS-shaped: 4 attacks, 4 blocks and 2 signature cards. */
const FIRE_CARDS = [
  { id: 'ember',           name: 'Ember',           type: 'fire', cost: 1, art: '🔥', sprite: 'fire-stone', effects: { damage: 7 } },                          // Strike
  { id: 'flame-wall',      name: 'Flame Wall',      type: 'fire', cost: 1, art: '🧱', sprite: 'flame-plate', effects: { block: 8 } },                          // Defend, +2: Fire has the fewest ways to defend
  { id: 'scorch',          name: 'Scorch',          type: 'fire', cost: 2, art: '☄️', sprite: 'burn-drive', effects: { damage: 10, vulnerable: 2 } },          // Bash
  { id: 'will-o-wisp',     name: 'Will-O-Wisp',     type: 'fire', cost: 1, art: '👻', sprite: 'spell-tag', effects: { burn: 4, weaken: 2 } },                  // Deadly Poison + Weak, like the move's halved Attack
  { id: 'mystical-fire',   name: 'Mystical Fire',   type: 'fire', cost: 1, art: '✨', sprite: 'wise-glasses', effects: { damage: 6, weaken: 1 } },             // Sucker Punch
  { id: 'fire-punch',      name: 'Fire Punch',      type: 'fire', cost: 1, art: '🥊', sprite: 'expert-belt', effects: { damage: 10, draw: 1 } },               // Pommel Strike
  { id: 'heat-up',         name: 'Heat Up',         type: 'fire', cost: 1, art: '📈', sprite: 'liechi-berry', effects: { strength: 1, focus: 4 } },            // Inflame, half now
  { id: 'flare-up',        name: 'Flare Up',        type: 'fire', cost: 2, art: '🌋', sprite: 'magmarizer', effects: { damage: 15, bonusIfLow: 8 } },
  { id: 'inferno-charge',  name: 'Inferno Charge',  type: 'fire', cost: 2, art: '⚡', sprite: 'cell-battery', effects: { damage: 9, nextEnergy: 2 } },
  { id: 'flame-body',      name: 'Flame Body',      type: 'fire', cost: 1, art: '🛡️', sprite: 'magma-stone', effects: { block: 8, burn: 2 } },                 // Iron Wave
  { id: 'fire-lash',       name: 'Fire Lash',       type: 'fire', cost: 1, art: '🦷', sprite: 'binding-band', effects: { damage: 5, hits: 2 } },               // Twin Strike
  { id: 'fire-spin',       name: 'Fire Spin',       type: 'fire', cost: 1, art: '🌀', sprite: 'red-shard', effects: { damage: 6, burn: 3 } },                  // Poisoned Stab
  { id: 'flare-blitz',     name: 'Flare Blitz',     type: 'fire', cost: 1, art: '☄️', sprite: 'life-orb', effects: { selfDamage: 2, damage: 17 }, rarity: 'uncommon' },   // Hemokinesis
  { id: 'inferno',         name: 'Inferno',         type: 'fire', cost: 1, art: '🌪️', sprite: 'houndoominite', effects: { damage: 7, bonusPerBurn: 2 }, rarity: 'uncommon' },   // Bane
  { id: 'lava-plume',      name: 'Lava Plume',      type: 'fire', cost: 2, art: '🌋', sprite: 'occa-berry', effects: { damage: 15, weaken: 1, vulnerable: 1 }, rarity: 'uncommon' },   // Uppercut
  { id: 'burning-bulwark', name: 'Burning Bulwark', type: 'fire', cost: 1, art: '🛡️', sprite: 'rusted-shield', effects: { block: 11, burn: 3 }, rarity: 'uncommon' },   // Flame Barrier
  { id: 'heat-wave',       name: 'Heat Wave',       type: 'fire', cost: 2, art: '♨️', sprite: 'blazikenite', effects: { damage: 5, hits: 3, burn: 2 }, rarity: 'uncommon' },
  { id: 'sunny-day',       name: 'Sunny Day',       type: 'fire', cost: 1, art: '☀️', sprite: 'sun-stone', effects: { burnEachTurn: 2 }, power: true, rarity: 'uncommon' },   // Noxious Fumes
  { id: 'firestorm',       name: 'Firestorm',       type: 'fire', cost: 3, art: '🌪️', sprite: 'charizardite-y', effects: { damage: 36 }, rarity: 'rare' },    // Bludgeon
  { id: 'flame-blast',     name: 'Flame Blast',     type: 'fire', cost: 2, art: '💥', sprite: 'red-orb', effects: { damage: 18, burn: 4 }, rarity: 'rare' },
  { id: 'blaze',           name: 'Blaze',           type: 'fire', cost: 1, art: '🌋', sprite: 'adrenaline-orb', effects: { blaze: 6 }, power: true, rarity: 'rare' },
];

const GRASS_CARDS = [
  { id: 'vine-whip',    name: 'Vine Whip',    type: 'grass', cost: 1, art: '🌿', sprite: 'galarica-twig', effects: { damage: 7 } },                  // Strike
  { id: 'stun-spore',   name: 'Stun Spore',   type: 'grass', cost: 1, art: '🍄', sprite: 'tiny-mushroom', effects: { damage: 6, weaken: 1 } },       // Sucker Punch
  { id: 'absorb',       name: 'Absorb',       type: 'grass', cost: 1, art: '💚', sprite: 'absorb-bulb', effects: { damage: 6, heal: 3 } },           // a small Reaper
  { id: 'growth',       name: 'Growth',       type: 'grass', cost: 1, art: '🌱', sprite: 'growth-mulch', effects: { strength: 1, heal: 3 } },
  { id: 'seed-bomb',    name: 'Seed Bomb',    type: 'grass', cost: 2, art: '🌰', sprite: 'rindo-berry', effects: { damage: 10, vulnerable: 2 } },    // Bash
  { id: 'razor-leaf',   name: 'Razor Leaf',   type: 'grass', cost: 2, art: '🍃', sprite: 'silver-leaf', effects: { damage: 16 } },
  { id: 'bullet-seed',  name: 'Bullet Seed',  type: 'grass', cost: 1, art: '🌱', sprite: 'green-apricorn', effects: { damage: 3, hits: 3 } },         // Sword Boomerang
  { id: 'mega-drain',   name: 'Mega Drain',   type: 'grass', cost: 2, art: '💚', sprite: 'luminous-moss', effects: { damage: 12, heal: 6 } },
  { id: 'cotton-guard', name: 'Cotton Guard', type: 'grass', cost: 1, art: '🛡️', sprite: 'fluffy-tail', effects: { block: 8 }, retain: true },
  { id: 'petal-dance',  name: 'Petal Dance',  type: 'grass', cost: 1, art: '🌸', sprite: 'petal-pink', effects: { damage: 6, block: 6 } },            // Iron Wave
  { id: 'synthesis',    name: 'Synthesis',    type: 'grass', cost: 2, art: '☀️', sprite: 'sitrus-berry', effects: { heal: 14 }, rarity: 'uncommon' },
  { id: 'leaf-blade',   name: 'Leaf Blade',   type: 'grass', cost: 2, art: '🍃', sprite: 'leaf-stone', effects: { damage: 10, strength: 2 }, rarity: 'uncommon' },
  { id: 'power-whip',   name: 'Power Whip',   type: 'grass', cost: 2, art: '🌳', sprite: 'power-band', effects: { damage: 14, strengthMult: 3 }, rarity: 'uncommon' },   // Heavy Blade
  { id: 'sleep-powder', name: 'Sleep Powder', type: 'grass', cost: 1, art: '🍄', sprite: 'big-mushroom', effects: { weaken: 2, draw: 1 }, retain: true, rarity: 'uncommon' },
  { id: 'ingrain',      name: 'Ingrain',      type: 'grass', cost: 1, art: '🌳', sprite: 'rich-mulch', effects: { healEachTurn: 3 }, power: true, rarity: 'uncommon' },
  { id: 'solar-beam',   name: 'Solar Beam',   type: 'grass', cost: 3, art: '🌞', sprite: 'tm-grass', effects: { damage: 36 }, rarity: 'rare' },        // Bludgeon
  { id: 'grassy-terrain', name: 'Grassy Terrain', type: 'grass', cost: 3, art: '🌿', sprite: 'terrain-extender', effects: { strengthEachTurn: 2 }, power: true, rarity: 'rare' },   // Demon Form
];

const WATER_CARDS = [
  { id: 'water-gun',    name: 'Water Gun',    type: 'water', cost: 1, art: '💧', sprite: 'water-stone', effects: { damage: 7 } },                   // Strike
  { id: 'withdraw',     name: 'Withdraw',     type: 'water', cost: 1, art: '🐚', sprite: 'shoal-shell', effects: { block: 6 } },                    // Defend
  { id: 'bubble',       name: 'Bubble',       type: 'water', cost: 1, art: '🫧', sprite: 'bubble-mail', effects: { damage: 6, weaken: 1 } },        // Sucker Punch
  { id: 'dive',         name: 'Dive',         type: 'water', cost: 1, art: '🌊', sprite: 'dive-ball', effects: { block: 9, draw: 1 } },             // Shrug It Off
  { id: 'rain-dance',   name: 'Rain Dance',   type: 'water', cost: 1, art: '🌧️', sprite: 'sprinklotad', effects: { focus: 5, block: 5 } },
  { id: 'surf',         name: 'Surf',         type: 'water', cost: 2, art: '🌊', sprite: 'hm-water', effects: { damage: 16 } },
  { id: 'water-pulse',  name: 'Water Pulse',  type: 'water', cost: 1, art: '💧', sprite: 'splash-plate', effects: { damage: 8 }, retain: true },
  { id: 'clamp',        name: 'Clamp',        type: 'water', cost: 2, art: '🐚', sprite: 'big-pearl', effects: { damage: 10, block: 10 } },         // Iron Wave x2
  { id: 'razor-shell',  name: 'Razor Shell',  type: 'water', cost: 1, art: '🐚', sprite: 'tropical-shell', effects: { blockDamage: true } },        // Body Slam
  { id: 'whirlpool',    name: 'Whirlpool',    type: 'water', cost: 1, art: '🌀', sprite: 'tidal-bell', effects: { damage: 5, weaken: 2 }, rarity: 'uncommon' },
  { id: 'liquidation',  name: 'Liquidation',  type: 'water', cost: 1, art: '💦', sprite: 'passho-berry', effects: { damage: 8, vulnerable: 1 }, rarity: 'uncommon' },
  { id: 'aqua-ring',    name: 'Aqua Ring',    type: 'water', cost: 1, art: '⭕', sprite: 'pearl-string', effects: { heal: 3, block: 6 }, rarity: 'uncommon' },
  { id: 'surging-strikes', name: 'Surging Strikes', type: 'water', cost: 2, art: '🌊', sprite: 'tr-water', effects: { damage: 5, hits: 3 }, rarity: 'uncommon' },
  { id: 'mirror-coat',  name: 'Mirror Coat',  type: 'water', cost: 1, art: '🔮', sprite: 'reveal-glass', effects: { thorns: 4 }, power: true, rarity: 'uncommon' },   // Caltrops
  { id: 'water-veil',   name: 'Water Veil',   type: 'water', cost: 1, art: '🌧️', sprite: 'prism-scale', effects: { blockEachTurn: 3 }, power: true, rarity: 'uncommon' },   // Metallicize
  { id: 'hydro-pump',   name: 'Hydro Pump',   type: 'water', cost: 3, art: '🚿', sprite: 'tm-water', effects: { damage: 36 }, rarity: 'rare' },        // Bludgeon
  { id: 'primordial-sea', name: 'Primordial Sea', type: 'water', cost: 2, art: '🌀', sprite: 'blue-orb', effects: { drawEachTurn: 1, blockEachTurn: 2 }, power: true, rarity: 'rare' },
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
  { id: 'flame-charge', name: 'Flame Charge', type: 'fire', cost: 1, art: '⚡', sprite: 'power-anklet', effects: { damage: 10, nextEnergy: 1 }, evoOnly: true, maxCopies: 1 },
  { id: 'fire-fang',    name: 'Fire Fang',    type: 'fire', cost: 1, art: '🦷', sprite: 'razor-fang', effects: { damage: 8, burn: 3 }, evoOnly: true, maxCopies: 1 },
  { id: 'flame-wheel',  name: 'Flame Wheel',  type: 'fire', cost: 2, art: '🔥', sprite: 'tr-fire', effects: { damage: 16 }, evoOnly: true, maxCopies: 1 },
  { id: 'incinerate',   name: 'Incinerate',   type: 'fire', cost: 2, art: '🌪️', sprite: 'incinium-z', effects: { damage: 14, weaken: 2 }, evoOnly: true, maxCopies: 1 },
];
const FIRE_EVO_HIGH = [
  { id: 'flamethrower', name: 'Flamethrower', type: 'fire', cost: 2, art: '🔥', sprite: 'tm-fire', effects: { damage: 22, burn: 3 }, evoOnly: true, maxCopies: 1 },
  { id: 'fire-blast',   name: 'Fire Blast',   type: 'fire', cost: 3, art: '☄️', sprite: 'firium-z', effects: { damage: 24, burn: 5 }, evoOnly: true, maxCopies: 1 },
  { id: 'overheat',     name: 'Overheat',     type: 'fire', cost: 3, art: '☀️', sprite: 'white-herb', effects: { damage: 30, bonusIfLow: 12 }, evoOnly: true, maxCopies: 1 },
  { id: 'blast-burn',   name: 'Blast Burn',   type: 'fire', cost: 3, art: '🌋', sprite: 'charizardite-x', effects: { damage: 34 }, evoOnly: true, maxCopies: 1 },
];

const GRASS_EVO_MID = [
  { id: 'leech-seed',    name: 'Leech Seed',    type: 'grass', cost: 1, art: '🌱', sprite: 'carrot-seeds', effects: { damage: 8, heal: 5 }, evoOnly: true, maxCopies: 1 },
  { id: 'bulk-up',       name: 'Bulk Up',       type: 'grass', cost: 1, art: '💪', sprite: 'macho-brace', effects: { strength: 2, block: 6 }, evoOnly: true, maxCopies: 1 },
  { id: 'razor-storm',   name: 'Razor Storm',   type: 'grass', cost: 2, art: '🍃', sprite: 'gold-leaf', effects: { damage: 16 }, evoOnly: true, maxCopies: 1 },
  { id: 'poison-powder', name: 'Poison Powder', type: 'grass', cost: 1, art: '☠️', sprite: 'poison-barb', effects: { weaken: 2, heal: 3 }, evoOnly: true, maxCopies: 1 },
];
const GRASS_EVO_HIGH = [
  { id: 'giga-drain',    name: 'Giga Drain',    type: 'grass', cost: 2, art: '🩸', sprite: 'grassium-z', effects: { damage: 20, heal: 12 }, evoOnly: true, maxCopies: 1 },
  { id: 'petal-blizzard', name: 'Petal Blizzard', type: 'grass', cost: 2, art: '🌸', sprite: 'petal-red', effects: { damage: 24 }, evoOnly: true, maxCopies: 1 },
  { id: 'leaf-storm',    name: 'Leaf Storm',    type: 'grass', cost: 3, art: '🍂', sprite: 'sceptilite', effects: { damage: 26, block: 8 }, evoOnly: true, maxCopies: 1 },
  { id: 'frenzy-plant',  name: 'Frenzy Plant',  type: 'grass', cost: 3, art: '🌳', sprite: 'venusaurite', effects: { damage: 34 }, evoOnly: true, maxCopies: 1 },
];

const WATER_EVO_MID = [
  { id: 'aqua-jet',    name: 'Aqua Jet',    type: 'water', cost: 1, art: '💨', sprite: 'aqua-suit', effects: { damage: 10, block: 4 }, evoOnly: true, maxCopies: 1 },
  { id: 'bubble-beam', name: 'Bubble Beam', type: 'water', cost: 1, art: '🫧', sprite: 'squirt-bottle', effects: { damage: 6, weaken: 2 }, evoOnly: true, maxCopies: 1 },
  { id: 'brine',       name: 'Brine',       type: 'water', cost: 2, art: '🌊', sprite: 'shoal-salt', effects: { damage: 16 }, evoOnly: true, maxCopies: 1 },
  { id: 'rain-shield', name: 'Rain Shield', type: 'water', cost: 1, art: '🌧️', sprite: 'utility-umbrella', effects: { block: 10, heal: 2 }, evoOnly: true, maxCopies: 1 },
];
const WATER_EVO_HIGH = [
  { id: 'scald',        name: 'Scald',        type: 'water', cost: 2, art: '♨️', sprite: 'douse-drive', effects: { damage: 20, weaken: 2 }, evoOnly: true, maxCopies: 1 },
  { id: 'wave-crash',   name: 'Wave Crash',   type: 'water', cost: 2, art: '🌊', sprite: 'gyaradosite', effects: { damage: 24, block: 6 }, evoOnly: true, maxCopies: 1 },
  { id: 'origin-pulse', name: 'Origin Pulse', type: 'water', cost: 3, art: '🌀', sprite: 'waterium-z', effects: { damage: 26, focus: 6 }, evoOnly: true, maxCopies: 1 },
  { id: 'hydro-cannon', name: 'Hydro Cannon', type: 'water', cost: 3, art: '🚿', sprite: 'blastoisinite', effects: { damage: 34 }, evoOnly: true, maxCopies: 1 },
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
/** The Power Lens shown when a power card is played, in the starter's colours (purple for any other type). */
export const POWER_LENS = { fire: '🟧', grass: '🟩', water: '🟦' };

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
  if (e.weaken)       parts.push(`Apply ${e.weaken} Weak.`);
  if (e.vulnerable)   parts.push(`Apply ${e.vulnerable} Vulnerable.`);
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
  return parts.join(' ');
}

/** Keywords shown in bold on the card, around describe()'s text: [label, what it means]. */
export function keywords(card) {
  return {
    lead: card.power ? [['Power', 'Stays on for the rest of the fight. The card is played once per fight.']] : [],
    tail: card.exhaust ? [['Exhaust', 'Gone for the rest of this fight once played. Back in your deck next fight.']] : [],
  };
}
