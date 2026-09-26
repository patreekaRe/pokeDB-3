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
     tide          gain this much Tide (Water's stored-up resource; it lasts all fight)
     perTide       +this much damage per Tide you hold, then all your Tide is spent
     discard       choose this many cards in your hand to discard (they trigger `onDiscard`)
     exhaustPick   choose this many cards in your hand to exhaust (they trigger `onExhaust`)
     addCard       { id, n, to }: put n new copies of a card (often a TOKEN_CARDS one) into your
                   'hand' (default), 'draw' pile (shuffled in) or 'discard' pile, for this fight only
     perX          on an X-cost card (cost: 'X'): added once per PP spent, e.g. { hits: 1 } = "X times"
     xPlus         X counts this much more (an upgrade's X+1)
     perPlayed     +this much damage for each other card you've played this turn
     hitsPerAttack the damage lands once per attack you've played this turn, this one included
     perDiscard    +this much damage for each card you've discarded this turn
     combo         { at, ...effects }: those extra effects if you've played `at` other cards this turn
     endTurnHurt   (status cards) lose this much HP if it's in your hand when your turn ends

   Power effects (only on `power: true` cards, see POWERS below):
     blockEachTurn, healEachTurn, burnEachTurn, strengthEachTurn,
     drawEachTurn, thorns, blaze, keepBlock, exhaustBlock, exhaustDraw,
     discardTide, discardBlock, cardDamage, cardBlock

   A card can also have (these sit next to `effects`, not inside it):
     exhaust    true = this card leaves the fight after you play it once
                (it won't reshuffle back into your draw pile until your
                next battle). Good for strong effects that shouldn't be
                spammed every turn.
     power      true = playing it switches on its power effects for the
                rest of the fight, and the card leaves the fight.
     retain     true = it stays in your hand when your turn ends.
     ethereal   true = exhausted if it's still in your hand when your turn ends.
     innate     true = always in your first hand of a fight.
     unplayable true = can't be played (status cards, and cards that act when discarded).
     onExhaust / onDiscard   effects that happen when this card is exhausted / discarded from your hand
                by a card (not by the end of your turn): block, draw, energy, tide, heal...
     upgrade    what PP Up changes: { effects: {...}, cost, retain, exhaust, ... } merged over the card.
                Without it the default rule applies (upgradeOf below).
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
     Water  block, card draw, hitting back, and building Tide to cash in with one big wave (Ironclad's block cards,
            Barricade + Body Slam, Silent's draw)
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
  { id: 'blaze',           name: 'Solar Power',     type: 'fire', cost: 1, art: '🌋', sprite: 'adrenaline-orb', effects: { blaze: 6 }, power: true, rarity: 'rare' },
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
  { id: 'bubble',       name: 'Bubble',       type: 'water', cost: 1, art: '🫧', sprite: 'bubble-mail', effects: { damage: 5, weaken: 1, tide: 1 } },   // Sucker Punch
  { id: 'dive',         name: 'Dive',         type: 'water', cost: 1, art: '🌊', sprite: 'dive-ball', effects: { block: 8, draw: 1, tide: 1 } },    // Shrug It Off
  { id: 'rain-dance',   name: 'Rain Dance',   type: 'water', cost: 1, art: '🌧️', sprite: 'sprinklotad', effects: { block: 4, tide: 2 } },
  { id: 'surf',         name: 'Surf',         type: 'water', cost: 2, art: '🌊', sprite: 'hm-water', effects: { damage: 12, tide: 2 } },
  { id: 'water-pulse',  name: 'Water Pulse',  type: 'water', cost: 1, art: '💧', sprite: 'splash-plate', effects: { damage: 5, perTide: 2 }, retain: true },   // Water's cash-in: hold it until the Tide is high
  { id: 'clamp',        name: 'Clamp',        type: 'water', cost: 2, art: '🐚', sprite: 'big-pearl', effects: { damage: 10, block: 10 } },         // Iron Wave x2
  { id: 'razor-shell',  name: 'Razor Shell',  type: 'water', cost: 1, art: '🐚', sprite: 'tropical-shell', effects: { blockDamage: true } },        // Body Slam
  { id: 'whirlpool',    name: 'Whirlpool',    type: 'water', cost: 1, art: '🌀', sprite: 'tidal-bell', effects: { damage: 5, weaken: 2 }, rarity: 'uncommon' },
  { id: 'liquidation',  name: 'Liquidation',  type: 'water', cost: 1, art: '💦', sprite: 'passho-berry', effects: { damage: 8, vulnerable: 1 }, rarity: 'uncommon' },
  { id: 'aqua-ring',    name: 'Aqua Ring',    type: 'water', cost: 1, art: '⭕', sprite: 'pearl-string', effects: { heal: 3, block: 6 }, rarity: 'uncommon' },
  { id: 'surging-strikes', name: 'Surging Strikes', type: 'water', cost: 2, art: '🌊', sprite: 'tr-water', effects: { damage: 5, hits: 3 }, rarity: 'uncommon' },
  { id: 'mirror-coat',  name: 'Mirror Coat',  type: 'water', cost: 1, art: '🔮', sprite: 'reveal-glass', effects: { thorns: 4 }, power: true, rarity: 'uncommon' },   // Caltrops
  { id: 'water-veil',   name: 'Water Veil',   type: 'water', cost: 1, art: '🌧️', sprite: 'prism-scale', effects: { blockEachTurn: 3 }, power: true, rarity: 'uncommon' },   // Metallicize
  { id: 'hydro-pump',   name: 'Hydro Pump',   type: 'water', cost: 2, art: '🚿', sprite: 'tm-water', effects: { damage: 10, perTide: 5 }, rarity: 'rare' },
  { id: 'primordial-sea', name: 'Primordial Sea', type: 'water', cost: 2, art: '🌀', sprite: 'blue-orb', effects: { drawEachTurn: 1, blockEachTurn: 2 }, power: true, rarity: 'rare' },
  { id: 'shell-armor',  name: 'Shell Armor',  type: 'water', cost: 2, art: '🐚', sprite: 'shed-shell', effects: { keepBlock: 1 }, power: true, rarity: 'rare' },   // Barricade
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
  { id: 'brine',       name: 'Brine',       type: 'water', cost: 2, art: '🌊', sprite: 'shoal-salt', effects: { damage: 8, perTide: 4 }, evoOnly: true, maxCopies: 1 },
  { id: 'rain-shield', name: 'Rain Shield', type: 'water', cost: 1, art: '🌧️', sprite: 'utility-umbrella', effects: { block: 10, heal: 2 }, evoOnly: true, maxCopies: 1 },
];
const WATER_EVO_HIGH = [
  { id: 'scald',        name: 'Scald',        type: 'water', cost: 2, art: '♨️', sprite: 'douse-drive', effects: { damage: 20, weaken: 2 }, evoOnly: true, maxCopies: 1 },
  { id: 'wave-crash',   name: 'Wave Crash',   type: 'water', cost: 2, art: '🌊', sprite: 'gyaradosite', effects: { damage: 24, block: 6 }, evoOnly: true, maxCopies: 1 },
  { id: 'origin-pulse', name: 'Origin Pulse', type: 'water', cost: 3, art: '🌀', sprite: 'waterium-z', effects: { damage: 26, tide: 3 }, evoOnly: true, maxCopies: 1 },
  { id: 'hydro-cannon', name: 'Hydro Cannon', type: 'water', cost: 3, art: '🚿', sprite: 'blastoisinite', effects: { damage: 34 }, evoOnly: true, maxCopies: 1 },
];

/* Fight-only cards made by other cards (`addCard`): never offered, not in the Card index, never in your run deck. */
const TOKEN_CARDS = [
  { id: 'cinder',   name: 'Cinder',   type: 'fire',  cost: 0, art: '🔥', effects: { damage: 4 }, exhaust: true, token: true },   // Shiv
  { id: 'seedling', name: 'Seedling', type: 'grass', cost: 0, art: '🌱', effects: { heal: 2, draw: 1 }, exhaust: true, token: true },
  { id: 'droplet',  name: 'Droplet',  type: 'water', cost: 0, art: '💧', effects: { damage: 3, tide: 1 }, exhaust: true, token: true },
];

/* Junk enemies shuffle into your deck for one fight (a move's `adds`, or a `kind: 'status'` move). */
const STATUS_CARDS = [
  { id: 'confusion', name: 'Confusion', type: 'normal', cost: 0, art: '🌀', effects: {}, status: true, unplayable: true, ethereal: true },   // Dazed
  { id: 'paralysis', name: 'Paralysis', type: 'normal', cost: 0, art: '⚡', effects: {}, status: true, unplayable: true },                   // Wound
  { id: 'poison',    name: 'Poison',    type: 'normal', cost: 0, art: '☠️', effects: { endTurnHurt: 2 }, status: true, unplayable: true },   // Burn
  { id: 'sludge',    name: 'Sludge',    type: 'normal', cost: 1, art: '🟣', effects: {}, status: true, exhaust: true },                       // Slimed
];

/** Every card you can be offered (the Card index lists these), and a lookup by id of every card there is,
    upgraded ones included: CARDS_BY_ID['ember'], CARDS_BY_ID['ember+']. */
export const ALL_CARDS = [
  ...NEUTRAL_CARDS, ...FIRE_CARDS, ...GRASS_CARDS, ...WATER_CARDS,
  ...FIRE_EVO_MID, ...FIRE_EVO_HIGH, ...GRASS_EVO_MID, ...GRASS_EVO_HIGH, ...WATER_EVO_MID, ...WATER_EVO_HIGH,
];

/* ---------- PP Up: upgraded cards ----------
   An upgraded card is its own card object with the id `<id>+` and the name `<name>+`, so a deck saves as ids
   and everything that looks cards up by id works unchanged. */

export const upgradeId = (id) => `${id}+`;
export const baseId = (id) => id.replace(/\+$/, '');
export const canUpgrade = (card) => !card.upgraded && !card.status;

/** The default upgrade, StS-sized: +3 damage (less per hit on multi-hits) and +3 block; else +3 heal; else +1 of
    the card's first status or buff; powers +1 on their number; anything else costs 1 less (or stops exhausting). */
const UPGRADE_STEPS = [['burn', 2], ['weaken', 1], ['vulnerable', 1], ['tide', 1], ['focus', 3], ['strength', 1], ['draw', 1]];
const POWER_STEPS = { blockEachTurn: 1, healEachTurn: 1, burnEachTurn: 1, strengthEachTurn: 1, thorns: 2, blaze: 3,
  exhaustBlock: 1, exhaustDraw: 1, discardTide: 1, discardBlock: 1, cardDamage: 1, cardBlock: 1 };
function upgradeOf(card) {
  if (card.upgrade) return { ...card.upgrade, effects: { ...card.effects, ...card.upgrade.effects } };
  const e = { ...card.effects };
  let { cost, exhaust } = card;
  const cheaper = () => { if (typeof cost === 'number' && cost > 0) cost -= 1; else if (exhaust) exhaust = false; else e.draw = 1; };
  if (card.power) {
    const key = Object.keys(POWER_STEPS).find(k => e[k]);
    if (key) e[key] += POWER_STEPS[key]; else cheaper();
  } else if (e.damage || e.block) {
    if (e.damage) e.damage += e.hits >= 3 ? 1 : e.hits === 2 ? 2 : 3;
    if (e.block) e.block += 3;
  } else if (e.heal) e.heal += 3;
  else {
    const step = UPGRADE_STEPS.find(([k]) => e[k]);
    if (step) e[step[0]] += step[1]; else cheaper();
  }
  return { effects: e, cost, exhaust };
}
const upgraded = (card) => ({ ...card, ...upgradeOf(card), id: upgradeId(card.id), name: `${card.name}+`, base: card.id, upgraded: true });

export const CARDS_BY_ID = Object.fromEntries([...ALL_CARDS, ...TOKEN_CARDS, ...STATUS_CARDS].map(c => [c.id, c]));
for (const card of [...ALL_CARDS, ...TOKEN_CARDS]) CARDS_BY_ID[upgradeId(card.id)] = upgraded(card);

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
  for (const key of ['damage', 'bonusIfLow', 'block', 'heal', 'focus', 'blockEachTurn', 'healEachTurn', 'thorns', 'blaze', 'exhaustBlock', 'discardBlock', 'cardBlock']) {
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
  keepBlock:        { icon: '🐚', flag: true, text: () => 'Your block no longer wears off between turns.' },
  blaze:            { icon: '🌋', text: (n) => `Your attacks deal +${n} while your HP is below half.` },
  exhaustBlock:     { icon: '🧱', text: (n) => `Whenever a card exhausts, gain ${n} block.` },
  exhaustDraw:      { icon: '📚', text: (n) => `Whenever a card exhausts, draw ${n}.` },
  discardTide:      { icon: '🌊', text: (n) => `Whenever you discard a card, gain ${n} Tide.` },
  discardBlock:     { icon: '🛡️', text: (n) => `Whenever you discard a card, gain ${n} block.` },
  cardDamage:       { icon: '✨', text: (n) => `Whenever you play a card, deal ${n} damage.` },
  cardBlock:        { icon: '🫧', text: (n) => `Whenever you play a card, gain ${n} block.` },
};

const xLabel = (e) => (e.xPlus ? `X+${e.xPlus}` : 'X');
const plural = (n, word) => `${n} ${word}${n > 1 ? 's' : ''}`;
const PILES = { hand: 'your hand', draw: 'your draw pile', discard: 'your discard pile' };

/** The sentences for a set of effects (a card's, or its combo / onExhaust / onDiscard extras). */
function sentences(e) {
  const parts = [];
  if (e.selfDamage)   parts.push(`Lose ${e.selfDamage} HP.`);
  const times = e.perX?.hits ? ` ${xLabel(e)} times` : e.hitsPerAttack ? ' for each attack you\'ve played this turn' : e.hits > 1 ? ` ${e.hits} times` : '';
  if (e.damage)       parts.push(`Deal ${e.damage} damage${times}.`);
  if (e.blockDamage)  parts.push('Deal damage equal to your block.');
  if (e.perTide)      parts.push(`+${e.perTide} per Tide, then spend all your Tide.`);
  if (e.bonusIfLow)   parts.push(`+${e.bonusIfLow} if your HP is below half.`);
  if (e.bonusPerBurn) parts.push(`+${e.bonusPerBurn} for each Burn on the enemy.`);
  if (e.perPlayed)    parts.push(`+${e.perPlayed} for each other card you've played this turn.`);
  if (e.perDiscard)   parts.push(`+${e.perDiscard} for each card you've discarded this turn.`);
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
  if (e.draw)         parts.push(`Draw ${plural(e.draw, 'card')}.`);
  if (e.discard)      parts.push(`Discard ${plural(e.discard, 'card')}.`);
  if (e.exhaustPick)  parts.push(`Exhaust ${plural(e.exhaustPick, 'card')} from your hand.`);
  if (e.tide)         parts.push(`Gain ${e.tide} Tide.`);
  if (e.nextEnergy)   parts.push(`+${e.nextEnergy} energy next turn.`);
  if (e.addCard) {
    const { id, n = 1, to = 'hand' } = e.addCard;
    const name = CARDS_BY_ID[id]?.name ?? id;
    parts.push(to === 'draw' ? `Shuffle ${n > 1 ? `${n} ${name}s` : `a ${name}`} into your draw pile.` : `Add ${n > 1 ? `${n} ${name}s` : `a ${name}`} to ${PILES[to]}.`);
  }
  for (const [key, power] of Object.entries(POWERS)) if (e[key]) parts.push(power.text(e[key]));
  if (e.endTurnHurt)  parts.push(`If it's in your hand at the end of your turn, lose ${e.endTurnHurt} HP.`);
  if (e.needsWounded) parts.push('Only playable if you are hurt.');
  return parts;
}

/** Turns a card's effects into a readable sentence. */
export function describe(card, stage = 0) {
  const e = scaledEffects(card, stage);
  const parts = sentences(e);
  if (e.perX) {
    const { hits, ...rest } = e.perX;
    parts.push(...sentences(rest).map(line => line.replace(/\.$/, ` ${xLabel(e)} times.`)));
  }
  if (e.combo) { const { at, ...more } = e.combo; parts.push(`Combo ${at}: ${sentences(more).join(' ')}`); }
  if (card.onExhaust) parts.push(`When exhausted: ${sentences(card.onExhaust).join(' ')}`);
  if (card.onDiscard) parts.push(`When discarded: ${sentences(card.onDiscard).join(' ')}`);
  if (card.retain)    parts.push('Stays in hand between turns.');
  if (!parts.length && card.status) parts.push(card.exhaust ? 'Does nothing.' : 'Clogs your hand.');
  return parts.join(' ');
}

/** Keywords shown in bold on the card, around describe()'s text: [label, what it means]. */
export function keywords(card) {
  return {
    lead: [
      card.unplayable && ['Unplayable', 'This card can\'t be played.'],
      card.innate && ['Innate', 'Always in your first hand of a fight.'],
      card.power && ['Power', 'Stays on for the rest of the fight. The card is played once per fight.'],
    ].filter(Boolean),
    tail: [
      card.ethereal && ['Ethereal', 'If it\'s still in your hand at the end of your turn, it\'s exhausted.'],
      card.exhaust && ['Exhaust', 'Gone for the rest of this fight once played. Back in your deck next fight.'],
    ].filter(Boolean),
  };
}

/** Explanations for the terms a card's text uses (shown as the text's tooltip). */
export function termTips(card) {
  const e = card.effects;
  return [e.weaken && 'Weak: the enemy deals 25% less damage. Lasts that many enemy turns.',
    e.vulnerable && 'Vulnerable: the enemy takes 50% more damage from your attacks. Lasts that many enemy turns.',
    (e.tide || e.perTide || e.discardTide) && 'Tide: builds up and lasts all fight. A move that says "per Tide" spends all of it for a bigger hit.',
    (e.perX || card.cost === 'X') && 'X: this card spends all your PP, and X is how much it spent.',
    e.combo && `Combo ${e.combo.at}: the extra only happens if you've already played ${e.combo.at} other cards this turn.`,
    (e.discard || card.onDiscard) && 'Discard: moved from your hand to the discard pile. Cards that say "When discarded" only trigger when a card makes you discard them.',
    (e.exhaustPick || card.onExhaust || e.exhaustBlock || e.exhaustDraw) && 'Exhaust: gone for the rest of this fight.',
    card.upgraded && 'Upgraded with PP Up.',
  ].filter(Boolean);
}
