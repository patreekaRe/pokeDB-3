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
     burnTimes     the card's `burn` is applied this many times (Drought adds to each)
     burnMult      multiply the enemy's Burn by this (after the card's own Burn)
     ifBurned      { bonus, ...effects }: if the enemy has Burn when you play it, +bonus damage and those effects
     ifHurt        the same, if you've lost HP this turn
     costDownOnHurt  costs this much less for each time you've lost HP this fight
     exhaustHand   'all' or 'skills' (every non-attack): exhaust those cards in your hand first
     perExhausted  +this much damage per card exhaustHand took; blockPerExhausted: this much block per card
     hitsPerExhausted  the damage lands once per card exhaustHand took
     playTop       play the top card of your draw pile this many times, free, and exhaust it
     exhume        choose a card in your exhaust pile and put it into your hand
     healDealt     heal the damage that got through
     perTideHeld   +this much damage per Tide you hold (it isn't spent)
     perTideGained +this much damage per Tide you've gained this fight, spent or not
     tideMult      multiply your Tide by this
     blockMult     multiply your block by this
     blockPerTide  gain this much block per Tide, then all your Tide is spent
     blockPerCard  gain this much block per card in your hand
     blockNext     gain this much block at the start of your next turn
     blur          your block survives the start of your next turn(s)
     blockDamage   true = the damage is your block; a number = that many times your block (with `block`, the
                   block comes first)
     drawTo        draw until you hold this many cards
     costDownOnDiscard  costs this much less for each card you've discarded this turn
     ifDiscarded   { bonus, ...effects } if you've discarded a card this turn
     discardHand   discard your whole hand (one by one, so discard triggers fire); perDiscarded: { draw: 1 } or
                   { addCard } happens once per card it discarded
     seed          Leech Seed: at the start of its turn the enemy loses that much HP, you heal as much, then it drops by 1
     sap           Sap: the enemy's attacks deal that much less for the rest of the fight
     flex          +this much strength for this turn only (StS's Flex)
     ifWeak / ifVulnerable / ifSeeded / ifHealed / ifEnemyAttacks   { bonus, ...effects } like ifBurned: if the enemy is
                   Weak / Vulnerable / has Leech Seed, if you've healed this turn, if the enemy intends to attack
     healPerStrength  heal this much per strength you have
     healPerSeed   heal this much per Leech Seed on the enemy
     perDebuff     +this much damage per kind of debuff on the enemy (Weak, Vulnerable, Leech Seed, Sap, Burn)
     drawPerDebuff draw this many cards per kind of debuff on the enemy
     doubleStrength  double your strength
     feed          if this card knocks the enemy out, gain this much max HP (StS's Feed)
     exhaustHand: 'status'  exhaust every status card in your hand (StS's Purity)
     copyPick      choose a card in your hand and add this many copies of it to your hand (StS's Dual Wield)
     randomCard    add this many random cards of your type to your hand; they cost 0 this turn (StS's Discovery)
     endure        until your next turn, you can't drop below 1 HP
     needsEmptyDraw  can only be played when your draw pile is empty (StS's Grand Finale)
     nextEnergy    a negative number is that much less energy next turn (Hyper Beam's recharge)

   Power effects (only on `power: true` cards, see POWERS below):
     blockEachTurn, healEachTurn, burnEachTurn, strengthEachTurn,
     drawEachTurn, thorns, blaze, keepBlock, exhaustBlock, exhaustDraw,
     discardTide, discardBlock, cardDamage, cardBlock, rupture, combust, brutality,
     corruption, drought, cinderDamage, exhaustBurn, tideEachTurn, drizzle, riptide, retainN,
     tideSpendBlock, retainDiscount, tideSurge, overheal, healStrength, seedKeep, attackHeal, attackSeed,
     debuffDamage, weakEachTurn, weakBlock, strengthHeal

   A card can also have (these sit next to `effects`, not inside it):
     exhaust    true = this card leaves the fight after you play it once
                (it won't reshuffle back into your draw pile until your
                next battle). Good for strong effects that shouldn't be
                spammed every turn.
     power      true = playing it switches on its power effects for the
                rest of the fight, and the card leaves the fight.
     retain     true = it stays in your hand when your turn ends.
     growOnRetain  { damage: N } / { block: N } / { heal: N }: each time it stays in your hand at the end of your turn, it
                gets that much stronger for the rest of the fight (StS's Windmill Strike)
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

import { SAFARI_MONS } from './safari-mons.js';

/** How strong the type chart is. Attacks that beat the target's type do this much more damage, and attacks that lose do this much less. It works both ways: on your attacks and on the enemy's attacks. */
export const SUPER_EFFECTIVE = 1.3;
export const NOT_VERY_EFFECTIVE = 0.75;

/** Electric's Static: the meter that Paralyzes the enemy, a wild one's, an Alpha's and a boss's, and how much each
    Paralysis this fight raises it (docs/duo-design.md section 5). */
export const STATIC_CAP = { fight: 7, elite: 11, boss: 12, step: 3 };   // 10 / 15 / 20 +5 at first: Electric's pairs trailed 15-40 points (2026-10-19); boss 12 for the first area's boss (2026-10-20)

/** Ice's (docs/duo-design.md section 5): each Icicle card played makes every Icicle card deal this much more this fight,
    and Hail's chip at the end of your turn and its bonus on every hit of your Ice attacks. */
export const ICICLE_STEP = 2;
export const HAIL = { chip: 3, bonus: 3 };
/** Ground's Sandstorm (the Weather engine's second kind): its chip at the end of your turn, and what it adds to every
    block a Ground card gives. */
export const SAND = { chip: 3, bonus: 3 };

/** Dark's Steal N takes up to N of the enemy's strength and this many times N of its block. */
export const STEAL_BLOCK = 3;

/** StS's Weak and Vulnerable. Both wear off by one at the end of each enemy turn. */
export const WEAK_MULT = 0.75;
export const VULNERABLE_MULT = 1.5;

/** The battle types. Psychic is neutral against every type, like Normal. */
export const TYPES = {
  fire:   { label: 'Fire',    icon: '🔥', beats: 'grass', losesTo: 'water' },
  water:  { label: 'Water',   icon: '💧', beats: 'fire',  losesTo: 'grass' },
  grass:  { label: 'Grass',   icon: '🌿', beats: 'water', losesTo: 'fire'  },
  normal: { label: 'Neutral', icon: '🔯', beats: null,    losesTo: null    },
  psychic: { label: 'Psychic', icon: '🔮', beats: null,    losesTo: null    },
  electric: { label: 'Electric', icon: '⚡', beats: null,   losesTo: null    },   // the Safari's duo pool: there the real chart decides (js/data/real-types.js)
  ice:      { label: 'Ice',      icon: '❄️', beats: null,   losesTo: null    },
  fighting: { label: 'Fighting', icon: '🥊', beats: null,   losesTo: null    },
  ground:   { label: 'Ground',   icon: '⛰️', beats: null,   losesTo: null    },
  flying:   { label: 'Flying',   icon: '🪶', beats: null,   losesTo: null    },
  dark:     { label: 'Dark',     icon: '🌙', beats: null,   losesTo: null    },
};

/* Every card is modelled on a Slay the Spire 1 card (named in its comment), at StS's numbers
   times ~1.2 (Strike 6 -> 7, Defend 5 -> 6), so the cards keep StS's price per energy:
   1 energy buys ~7 damage or ~6 block, draw 1 is worth ~3 damage, Weak 1 ~2-3, and
   uncommons/rares give ~20%/~50% more than a common. Enemies are tuned around the cards. */
const NEUTRAL_CARDS = [
  { id: 'tackle',       name: 'Tackle',       type: 'normal', cost: 1, art: '💥', sprite: 'hit-spark', effects: { damage: 6, draw: 1 }, upgrade: { effects: { damage: 9 } } },   // Pommel Strike: a plain 7 was each type's own Strike (Ember...)
  { id: 'block',        name: 'Block',        type: 'normal', cost: 1, art: '🛡️', sprite: 'shield', effects: { block: 7 }, noOffer: true },   // Defend: Grass's starting deck only; offered, it doubled Water's Withdraw. 7 since the 2026-10-16 balance pass (Leech Seed lost its stage bonus)
  { id: 'iron-defense', name: 'Iron Defense', type: 'normal', cost: 2, art: '🏰', sprite: 'metal-coat', effects: { block: 22 }, exhaust: true, rarity: 'uncommon', upgrade: { effects: { block: 30 } } },   // Impervious
  { id: 'quick-guard',  name: 'Quick Guard',  type: 'normal', cost: 2, art: '✋', sprite: 'protective-pads', effects: { guard: true }, exhaust: true },   // Exhaust since 2026-10-16: a whole enemy turn for 2 PP, every time, topped the bot's card picks for every type
  { id: 'potion',       name: 'Potion',       type: 'normal', cost: 1, art: '🧪', sprite: 'potion', effects: { heal: 10 }, exhaust: true },      // Bandage Up
  { id: 'smokescreen',  name: 'Smokescreen',  type: 'normal', cost: 0, art: '💨', sprite: 'smoke-ball', effects: { weaken: 2 }, exhaust: true },   // Intimidate
  { id: 'tailwind',     name: 'Rest',         type: 'normal', cost: 0, art: '💤', sprite: 'air-balloon', effects: { nextEnergy: 1 } },   // was Tailwind, its id kept: Flying owns Tailwind now (docs/duo-design.md answer 18)
  { id: 'lucky-claw',   name: 'Lucky Claw',   type: 'normal', cost: 0, art: '🍀', sprite: 'razor-claw', effects: { draw: 2 }, exhaust: true, rarity: 'uncommon' },   // Finesse
  { id: 'double-hit',   name: 'Double Hit',   type: 'normal', cost: 1, art: '💥', sprite: 'lucky-punch', effects: { damage: 5, hits: 2 } },     // Twin Strike
  { id: 'swords-dance', name: 'Swords Dance', type: 'normal', cost: 1, art: '⚔️', sprite: 'rusted-sword', effects: { strength: 2 }, exhaust: true, rarity: 'uncommon' },   // Inflame
  { id: 'agility',      name: 'Agility',      type: 'normal', cost: 0, art: '⚡', sprite: 'quick-powder', effects: { energy: 1, draw: 1 }, innate: true, exhaust: true, rarity: 'uncommon', upgrade: { effects: { draw: 2 } } },   // Adrenaline, Innate: its speed is there from the first turn (Burn Up and Psychic Overload were Adrenaline and more)
  { id: 'leer',         name: 'Leer',         type: 'normal', cost: 0, art: '👀', sprite: 'black-glasses', effects: { vulnerable: 2 }, rarity: 'uncommon' },   // Trip
  { id: 'quick-attack', name: 'Quick Attack', type: 'normal', cost: 0, art: '💨', sprite: 'quick-ball', effects: { damage: 3, hits: 2 }, innate: true, upgrade: { effects: { damage: 4 } } },   // two quick hits, Innate: it always goes first
  { id: 'rapid-spin',   name: 'Rapid Spin',   type: 'normal', cost: 1, art: '🌀', sprite: 'paralyze-heal', effects: { exhaustHand: 'status', damage: 8, perExhausted: 4 }, upgrade: { effects: { damage: 11, perExhausted: 5 } } },   // Purity + a Strike that hits harder for each status card it spins away
  { id: 'double-team',  name: 'Double Team',  type: 'normal', cost: 0, art: '✨', sprite: 'destiny-knot', effects: { block: 4, addCard: { id: 'double-team', to: 'discard' } }, rarity: 'uncommon', upgrade: { effects: { block: 6, addCard: { id: 'double-team+', to: 'discard' } } } },   // Anger as a block: each one played makes another
  { id: 'substitute',   name: 'Substitute',   type: 'normal', cost: 1, art: '🧸', sprite: 'revive', effects: { selfDamage: 4, block: 16 }, rarity: 'uncommon', upgrade: { effects: { block: 20 } } },   // (Offering-style: HP for block)
  { id: 'mimic',        name: 'Mimic',        type: 'normal', cost: 1, art: '🧬', sprite: 'silk-scarf', effects: { copyPick: 1 }, rarity: 'uncommon', upgrade: { effects: { copyPick: 2 } } },   // Dual Wield
  { id: 'endure',       name: 'Endure',       type: 'normal', cost: 1, art: '🎗️', sprite: 'focus-band', effects: { endure: true, block: 4 }, exhaust: true, rarity: 'uncommon', upgrade: { cost: 0 } },   // (Pokémon's Endure; StS has no card for it)
  { id: 'metronome',    name: 'Metronome',    type: 'normal', cost: 1, art: '❓', sprite: 'metronome', effects: { randomCard: 1 }, exhaust: true, rarity: 'rare', upgrade: { exhaust: false } },   // Discovery / Jack of All Trades
  { id: 'hyper-beam',   name: 'Hyper Beam',   type: 'normal', cost: 2, art: '💥', sprite: 'tm-normal', effects: { damage: 38, nextEnergy: -1 }, rarity: 'rare', upgrade: { effects: { damage: 50 } } },   // Bludgeon, 1 PP now and 1 next turn
  // The 2026-10-16 balance pass: more of StS's colorless cards
  { id: 'harden',       name: 'Harden',       type: 'normal', cost: 0, art: '🪨', sprite: 'hard-stone', effects: { block: 3, tempSap: 2 }, upgrade: { effects: { block: 5, tempSap: 3 } } },   // Good Instincts with a Dark Shackles edge: its Defense up for the turn
  { id: 'return',       name: 'Return',       type: 'normal', cost: 1, art: '🔁', sprite: 'soothe-bell', effects: { damage: 9, returnCard: 1 }, upgrade: { effects: { damage: 13 } } },   // Headbutt
  { id: 'fake-out',     name: 'Fake Out',     type: 'normal', cost: 0, art: '👏', sprite: 'hit-spark', effects: { damage: 8, weaken: 1 }, innate: true, exhaust: true, rarity: 'uncommon', upgrade: { effects: { damage: 12, weaken: 2 } } },   // Dramatic Entrance
  { id: 'recycle',      name: 'Recycle',      type: 'normal', cost: 0, art: '♻️', sprite: 'max-ether', effects: { reshuffle: true, draw: 1 }, rarity: 'uncommon', upgrade: { effects: { draw: 2 } } },   // Deep Breath
  { id: 'charm',        name: 'Charm',        type: 'normal', cost: 0, art: '💕', sprite: 'pink-nectar', effects: { tempSap: 10 }, exhaust: true, rarity: 'uncommon', upgrade: { effects: { tempSap: 14 } } },   // Dark Shackles
  { id: 'pay-day',      name: 'Pay Day',      type: 'normal', cost: 2, art: '🪙', sprite: 'amulet-coin', effects: { damage: 24, payDay: 20 }, rarity: 'rare', upgrade: { effects: { damage: 30, payDay: 25 } } },   // Hand of Greed
  { id: 'sketch',       name: 'Sketch',       type: 'normal', cost: 0, art: '🖌️', sprite: 'silk-scarf', effects: { sketch: 1 }, exhaust: true, rarity: 'rare', upgrade: { exhaust: false } },   // Secret Technique / Secret Weapon
  { id: 'mega-evolution', name: 'Mega Evolution', type: 'normal', cost: 2, art: '🧬', sprite: 'dna-splicers', effects: { upgradeAll: true }, exhaust: true, rarity: 'rare', upgrade: { cost: 1 } },   // Apotheosis
  // a Duo Run's free switch (docs/duo-design.md section 5): `duo: true` keeps it out of every other run's pools
  { id: 'baton-pass',   name: 'Baton Pass',   type: 'normal', cost: 0, art: '🪄', sprite: 'shed-shell', effects: { block: 3, switch: true }, duo: true, upgrade: { effects: { block: 6 } } },   // Finesse, its draw a switch
  { id: 'last-resort',  name: 'Last Resort',  type: 'normal', cost: 0, art: '⭐', sprite: 'normal-gem', effects: { damage: 60, needsEmptyDraw: true }, rarity: 'rare', upgrade: { effects: { damage: 72 } } },   // Grand Finale
];

/* Each type plays its own way:
     Fire   burn that stacks up, big hits, and trading HP for damage (StS's Ironclad + Silent's poison)
     Grass  healing, and strength that grows over a long fight (Ironclad's strength, Reaper)
     Water  Tide for every build: Tsunami builds it and cashes it in with one big wave (Watcher's Mantra),
            Shell keeps block and turns it into damage (Barricade + Body Slam, Juggernaut), Flow draws,
            discards and retains (Silent's discard, Watcher's retain)
     Psychic Mewtwo: Force builds strength and Focus for huge hits; Barrier turns defense into offense;
             Mind Games disrupts enemies and shapes the hand
    Every starting deck is StS-shaped: 4 attacks, 4 blocks and 2 signature cards. */
const FIRE_CARDS = [
  // Common: 20
  { id: 'ember',           name: 'Ember',           type: 'fire', cost: 1, art: '🔥', sprite: 'fire-stone', effects: { damage: 7 }, upgrade: { effects: { damage: 10 } } },                          // Strike
  { id: 'flame-wall',      name: 'Flame Wall',      type: 'fire', cost: 1, art: '🧱', sprite: 'flame-plate', effects: { block: 9 }, upgrade: { effects: { block: 12 } } },                          // Defend, +3: Fire has the fewest ways to defend (9 since 2026-10-20, Fire's lift)
  { id: 'scorch',          name: 'Scorch',          type: 'fire', cost: 2, art: '☄️', sprite: 'burn-drive', effects: { damage: 8, vulnerable: 2, burn: 2 }, upgrade: { effects: { damage: 10, vulnerable: 3, burn: 3 } } },          // Bash with a Burn: Seed Bomb and Wing Attack were Bash too
  { id: 'will-o-wisp',     name: 'Will-O-Wisp',     type: 'fire', cost: 1, art: '👻', sprite: 'spell-tag', effects: { burn: 4, weaken: 2 }, upgrade: { effects: { burn: 6 } } },                  // Deadly Poison + Weak, like the move's halved Attack
  { id: 'mystical-fire',   name: 'Mystical Fire',   type: 'fire', cost: 1, art: '✨', sprite: 'wise-glasses', effects: { damage: 6, ifBurned: { weaken: 2 } }, upgrade: { effects: { damage: 9, ifBurned: { weaken: 3 } } } },             // Sucker Punch, its Weak on a Burned enemy
  { id: 'fire-punch',      name: 'Fire Punch',      type: 'fire', cost: 1, art: '🥊', sprite: 'expert-belt', effects: { damage: 9, addCard: { id: 'cinder', n: 1 } }, upgrade: { effects: { damage: 12 } } },               // Pommel Strike, its draw a Cinder
  { id: 'flame-body',      name: 'Flame Body',      type: 'fire', cost: 1, art: '🛡️', sprite: 'magma-stone', effects: { block: 11, burn: 2 }, upgrade: { effects: { block: 13, burn: 3 } } },                 // Iron Wave (11 since the 2026-10-16 balance pass)
  { id: 'fire-spin',       name: 'Fire Spin',       type: 'fire', cost: 1, art: '🌀', sprite: 'red-shard', effects: { damage: 6, burn: 3 }, upgrade: { effects: { damage: 8, burn: 4 } } },                  // Poisoned Stab
  { id: 'flame-burst',     name: 'Flame Burst',     type: 'fire', cost: 2, art: '💥', sprite: 'flame-mail', effects: { burn: 3, burnTimes: 3 }, upgrade: { effects: { burn: 4 } } },          // Bouncing Flask
  { id: 'scorching-sands', name: 'Scorching Sands', type: 'fire', cost: 1, art: '🌪️', sprite: 'soft-sand', effects: { damage: 8, ifBurned: { vulnerable: 1 } }, upgrade: { effects: { damage: 10, ifBurned: { vulnerable: 2 } } } },   // Bane, with Vulnerable
  { id: 'heat-up',         name: 'Heat Up',         type: 'fire', cost: 1, art: '📈', sprite: 'liechi-berry', effects: { strength: 1, focus: 4 }, upgrade: { effects: { focus: 8 } } },            // Inflame, half now
  { id: 'flare-up',        name: 'Flare Up',        type: 'fire', cost: 2, art: '🌋', sprite: 'magmarizer', effects: { damage: 15, bonusIfLow: 8 }, upgrade: { effects: { damage: 18, bonusIfLow: 12 } } },   // Perfected Strike, paid by low HP
  { id: 'fiery-dance',     name: 'Fiery Dance',     type: 'fire', cost: 0, art: '🩸', sprite: 'red-nectar', effects: { selfDamage: 3, energy: 2 }, upgrade: { effects: { energy: 3 } } },            // Bloodletting
  { id: 'heat-crash',      name: 'Heat Crash',      type: 'fire', cost: 1, art: '💥', sprite: 'iron-ball', effects: { damage: 14, addCard: { id: 'paralysis', to: 'draw' } }, upgrade: { effects: { damage: 19 } } },   // Wild Strike
  { id: 'fire-lash',       name: 'Fire Lash',       type: 'fire', cost: 1, art: '🦷', sprite: 'binding-band', effects: { damage: 4, hits: 2, burn: 2 }, upgrade: { effects: { damage: 5, burn: 3 } } },   // Twin Strike + Burn: Double Hit is the plain Twin Strike
  { id: 'rage',            name: 'Rage',            type: 'fire', cost: 0, art: '😡', sprite: 'rage-candy-bar', effects: { damage: 6, addCard: { id: 'rage', to: 'discard' } }, upgrade: { effects: { damage: 9, addCard: { id: 'rage+', to: 'discard' } } } },   // Anger
  { id: 'spark-shower',    name: 'Spark Shower',    type: 'fire', cost: 1, art: '✨', sprite: 'stardust', effects: { addCard: { id: 'cinder', n: 3 } }, upgrade: { effects: { addCard: { id: 'cinder', n: 4 } } } },   // Blade Dance
  { id: 'cinder-cloak',    name: 'Cinder Cloak',    type: 'fire', cost: 1, art: '🧣', sprite: 'red-scarf', effects: { block: 7, addCard: { id: 'cinder' } }, upgrade: { effects: { addCard: { id: 'cinder', n: 2 } } } },   // Cloak and Dagger
  { id: 'kindle',          name: 'Kindle',          type: 'fire', cost: 1, art: '🧱', sprite: 'stick', effects: { block: 8, exhaustPick: 1 }, upgrade: { effects: { block: 11 } } },                // True Grit
  { id: 'flare',           name: 'Flare',           type: 'fire', cost: 0, art: '🔥', sprite: 'figy-berry', effects: { damage: 4, exhaustPick: 1 }, upgrade: { effects: { damage: 7 } } },         // True Grit as a 0-cost attack: Kindling
  // Uncommon: 32
  { id: 'inferno',         name: 'Inferno',         type: 'fire', cost: 1, art: '🌪️', sprite: 'houndoominite', effects: { damage: 7, bonusPerBurn: 2 }, rarity: 'uncommon', upgrade: { effects: { damage: 9, bonusPerBurn: 3 } } },   // Bane, per stack
  { id: 'sunny-day',       name: 'Sunny Day',       type: 'fire', cost: 1, art: '☀️', sprite: 'sun-stone', effects: { burnEachTurn: 2 }, power: true, rarity: 'uncommon', upgrade: { effects: { burnEachTurn: 3 } } },   // Noxious Fumes
  { id: 'heat-wave',       name: 'Heat Wave',       type: 'fire', cost: 2, art: '♨️', sprite: 'blazikenite', effects: { damage: 5, hits: 3, ifBurned: { hits: 1 } }, rarity: 'uncommon', upgrade: { effects: { damage: 7 } } },   // Riddle with Holes, a hit more on a Burned enemy
  { id: 'burning-bulwark', name: 'Burning Bulwark', type: 'fire', cost: 1, art: '🛡️', sprite: 'rusted-shield', effects: { block: 10, ifEnemyAttacks: { burn: 5 } }, rarity: 'uncommon', upgrade: { effects: { block: 13, ifEnemyAttacks: { burn: 7 } } } },   // Flame Barrier: it burns the attacker
  { id: 'fan-the-flames',  name: 'Fan the Flames',  type: 'fire', cost: 1, art: '🌬️', sprite: 'fire-memory', effects: { burnMult: 2 }, exhaust: true, rarity: 'uncommon', upgrade: { cost: 0 } },   // Catalyst
  { id: 'ash-cloud',       name: 'Ash Cloud',       type: 'fire', cost: 2, art: '💨', sprite: 'soot-sack', effects: { burn: 5, weaken: 2 }, exhaust: true, rarity: 'uncommon', upgrade: { effects: { burn: 7, weaken: 3 } } },   // Crippling Cloud
  { id: 'heat-haze',       name: 'Heat Haze',       type: 'fire', cost: 1, art: '♨️', sprite: 'bright-powder', effects: { block: 7, ifBurned: { block: 5 } }, rarity: 'uncommon', upgrade: { effects: { block: 9, ifBurned: { block: 6 } } } },   // Dodge and Roll
  { id: 'infernal-parade', name: 'Infernal Parade', type: 'fire', cost: 1, art: '👻', sprite: 'odd-keystone', effects: { damage: 8, ifBurned: { bonus: 8 } }, rarity: 'uncommon', upgrade: { effects: { damage: 10, ifBurned: { bonus: 10 } } } },   // Bane
  { id: 'blaze-kick',      name: 'Blaze Kick',      type: 'fire', cost: 1, art: '👟', sprite: 'heavy-duty-boots', effects: { damage: 9, ifHurt: { burn: 5 } }, rarity: 'uncommon', upgrade: { effects: { damage: 12, ifHurt: { burn: 7 } } } },   // Burn and Reckless: hurt yourself first
  { id: 'steam-engine',    name: 'Steam Engine',    type: 'fire', cost: 1, art: '♨️', sprite: 'machine-part', effects: { exhaustBurn: 2 }, power: true, rarity: 'uncommon', upgrade: { effects: { exhaustBurn: 3 } } },   // Feel No Pain, as Burn: Burn and Kindling
  { id: 'flare-blitz',     name: 'Flare Blitz',     type: 'fire', cost: 1, art: '☄️', sprite: 'life-orb', effects: { selfDamage: 2, damage: 17 }, rarity: 'uncommon', upgrade: { effects: { damage: 22 } } },   // Hemokinesis
  { id: 'raging-fury',     name: 'Raging Fury',     type: 'fire', cost: 1, art: '😡', sprite: 'red-chain', effects: { rupture: 1 }, power: true, rarity: 'uncommon', upgrade: { effects: { rupture: 2 } } },   // Rupture
  { id: 'temper-flare',    name: 'Temper Flare',    type: 'fire', cost: 1, art: '😡', sprite: 'red-card', effects: { damage: 10, ifHurt: { bonus: 10 } }, rarity: 'uncommon', upgrade: { effects: { damage: 13, ifHurt: { bonus: 13 } } } },   // Spot Weakness, as an attack
  { id: 'mind-blown',      name: 'Mind Blown',      type: 'fire', cost: 4, art: '💥', sprite: 'weakness-policy', effects: { damage: 22, costDownOnHurt: 1 }, rarity: 'uncommon', upgrade: { cost: 3 } },   // Blood for Blood
  { id: 'eruption',        name: 'Eruption',        type: 'fire', cost: 1, art: '🌋', sprite: 'cameruptite', effects: { combust: 6 }, power: true, rarity: 'uncommon', upgrade: { effects: { combust: 8 } } },   // Combust
  { id: 'shell-trap',      name: 'Shell Trap',      type: 'fire', cost: 1, art: '🐚', sprite: 'jaboca-berry', effects: { block: 18, addCard: { id: 'paralysis', n: 2 } }, rarity: 'uncommon', upgrade: { effects: { block: 23 } } },   // Power Through
  { id: 'fiery-wrath',     name: 'Fiery Wrath',     type: 'fire', cost: 0, art: '😡', sprite: 'dread-plate', effects: { selfDamage: 3, addCard: { id: 'cinder', n: 2 } }, rarity: 'uncommon', upgrade: { effects: { addCard: { id: 'cinder', n: 3 } } } },   // Bloodletting + Blade Dance: Reckless and Kindling
  { id: 'lava-plume',      name: 'Lava Plume',      type: 'fire', cost: 2, art: '🌋', sprite: 'occa-berry', effects: { damage: 12, burn: 3, weaken: 1 }, rarity: 'uncommon', upgrade: { effects: { damage: 16, burn: 4, weaken: 2 } } },   // Uppercut, its Vulnerable a Burn
  { id: 'ember-veil',      name: 'Ember Veil',      type: 'fire', cost: 2, art: '🛡️', sprite: 'safety-goggles', effects: { burn: 2, weaken: 1, block: 11 }, rarity: 'uncommon', upgrade: { effects: { burn: 3, weaken: 2, block: 14 } } },   // a Defend that burns and weakens
  { id: 'inferno-charge',  name: 'Inferno Charge',  type: 'fire', cost: 2, art: '⚡', sprite: 'cell-battery', effects: { selfDamage: 2, damage: 11, nextEnergy: 2 }, rarity: 'uncommon', upgrade: { effects: { damage: 15 } } },   // Outmaneuver as a Reckless attack
  { id: 'flash-fire',      name: 'Flash Fire',      type: 'fire', cost: 2, art: '📚', sprite: 'light-ball', effects: { exhaustDraw: 1 }, power: true, rarity: 'uncommon', upgrade: { cost: 1 } },   // Dark Embrace
  { id: 'fire-pledge',     name: 'Fire Pledge',     type: 'fire', cost: 1, art: '🧱', sprite: 'red-flute', effects: { exhaustBlock: 4 }, power: true, rarity: 'uncommon', upgrade: { effects: { exhaustBlock: 5 } } },   // Feel No Pain
  { id: 'stoke',           name: 'Stoke',           type: 'fire', cost: 1, art: '🔥', sprite: 'lava-cookie', effects: { exhaustPick: 1, draw: 2 }, rarity: 'uncommon', upgrade: { effects: { draw: 3 } } },   // Burning Pact
  { id: 'white-smoke',     name: 'White Smoke',     type: 'fire', cost: 1, art: '💨', sprite: 'silver-powder', effects: { exhaustHand: 'skills', blockPerExhausted: 6 }, rarity: 'uncommon', upgrade: { effects: { blockPerExhausted: 8 } } },   // Second Wind
  { id: 'magma-armor',     name: 'Magma Armor',     type: 'fire', cost: 1, art: '🛡️', sprite: 'protector', effects: { block: 6 }, onExhaust: { energy: 2 }, rarity: 'uncommon', upgrade: { effects: { block: 9 }, onExhaust: { energy: 3 } } },   // Sentinel
  { id: 'magma-storm',     name: 'Magma Storm',     type: 'fire', cost: 2, art: '🌋', sprite: 'magma-suit', effects: { exhaustHand: 'skills', damage: 19 }, rarity: 'uncommon', upgrade: { effects: { damage: 26 } } },   // Sever Soul
  { id: 'searing-shot',    name: 'Searing Shot',    type: 'fire', cost: 1, art: '🎯', sprite: 'x-sp-atk', effects: { damage: 5, hitsPerAttack: true }, rarity: 'uncommon', upgrade: { effects: { damage: 7 } } },   // Finisher
  { id: 'sizzly-slide',    name: 'Sizzly Slide',    type: 'fire', cost: 1, art: '👟', sprite: 'roller-skates', effects: { damage: 9, combo: { at: 3, energy: 1 } }, rarity: 'uncommon', upgrade: { effects: { damage: 12 } } },   // Sneaky Strike
  { id: 'hot-coals',       name: 'Hot Coals',       type: 'fire', cost: 1, art: '🔥', sprite: 'ruby', effects: { cinderDamage: 4 }, power: true, rarity: 'uncommon', upgrade: { effects: { cinderDamage: 6 } } },   // Accuracy
  { id: 'wildfire',        name: 'Wildfire',        type: 'fire', cost: 1, art: '🌪️', sprite: 'blunder-policy', effects: { playTop: 1 }, rarity: 'uncommon', upgrade: { cost: 0 } },   // Havoc
  { id: 'armor-cannon',    name: 'Armor Cannon',    type: 'fire', cost: 2, art: '💥', sprite: 'armorite-ore', effects: { damage: 24 }, ethereal: true, rarity: 'uncommon', upgrade: { effects: { damage: 30 } } },   // Carnage: Ethereal feeds the exhaust payoffs
  { id: 'blazing-torque',  name: 'Blazing Torque',  type: 'fire', cost: 1, art: '⚙️', sprite: 'machine-part', effects: { damage: 9 }, growOnPlay: { damage: 5 }, rarity: 'uncommon', upgrade: { effects: { damage: 9 }, growOnPlay: { damage: 8 } } },   // Rampage
  { id: 'ignite',          name: 'Ignite',          type: 'fire', cost: 1, art: '⚡', sprite: 'fire-stone', effects: { energy: 2 }, exhaust: true, rarity: 'uncommon', upgrade: { cost: 0 } },   // Seeing Red
  { id: 'burning-spirit',  name: 'Burning Spirit',  type: 'fire', cost: 1, art: '👹', sprite: 'red-chain', effects: { statusDamage: 7 }, power: true, rarity: 'uncommon', upgrade: { effects: { statusDamage: 10 } } },   // Fire Breathing: Kindling's junk and Reckless's
  { id: 'flame-rush',      name: 'Flame Rush',      type: 'fire', cost: 0, art: '💨', sprite: 'flame-mail', effects: { damage: 9, addCard: { id: 'confusion', to: 'draw' } }, rarity: 'uncommon', upgrade: { effects: { damage: 12 } } },   // Reckless Charge
  { id: 'heatproof',       name: 'Heatproof',       type: 'fire', cost: 1, art: '🛡️', sprite: 'assault-vest', effects: { block: 12 }, ethereal: true, rarity: 'uncommon', upgrade: { effects: { block: 16 } } },   // Ghostly Armor
  // Rare: 14
  { id: 'firestorm',       name: 'Firestorm',       type: 'fire', cost: 3, art: '🌪️', sprite: 'charizardite-y', effects: { damage: 24, addCard: { id: 'cinder', n: 3, to: 'draw' } }, rarity: 'rare', upgrade: { effects: { damage: 32 } } },    // Bludgeon that leaves embers in your deck
  { id: 'flame-blast',     name: 'Flame Blast',     type: 'fire', cost: 2, art: '💥', sprite: 'red-orb', effects: { damage: 16, burn: 3, ifBurned: { energy: 1 } }, rarity: 'rare', upgrade: { effects: { damage: 21, burn: 4 } } },   // Bane with a Burn: cheaper on a Burned enemy
  { id: 'sacred-fire',     name: 'Sacred Fire',     type: 'fire', cost: 2, art: '🔥', sprite: 'sacred-ash', effects: { burnMult: 3 }, exhaust: true, rarity: 'rare', upgrade: { cost: 1 } },   // Catalyst+
  { id: 'drought',         name: 'Drought',         type: 'fire', cost: 2, art: '🌞', sprite: 'sun-flute', effects: { drought: 2 }, power: true, rarity: 'rare', upgrade: { cost: 1 } },   // Envenom
  { id: 'blaze',           name: 'Solar Power',     type: 'fire', cost: 1, art: '🌋', sprite: 'adrenaline-orb', effects: { blaze: 6 }, power: true, rarity: 'rare', upgrade: { effects: { blaze: 9 } } },   // Berserk
  { id: 'burn-up',         name: 'Burn Up',         type: 'fire', cost: 0, art: '🔥', sprite: 'energy-root', effects: { selfDamage: 6, energy: 2, draw: 3 }, exhaust: true, rarity: 'rare', upgrade: { effects: { draw: 5 } } },   // Offering
  { id: 'bitter-blade',    name: 'Bitter Blade',    type: 'fire', cost: 2, art: '🗡️', sprite: 'reaper-cloth', effects: { damage: 12, healDealt: true }, exhaust: true, rarity: 'rare', upgrade: { effects: { damage: 16 } } },   // Reaper
  { id: 'flare-boost',     name: 'Flare Boost',     type: 'fire', cost: 0, art: '🩸', sprite: 'energy-powder', effects: { brutality: 1 }, power: true, rarity: 'rare', upgrade: { innate: true } },   // Brutality
  { id: 'v-create',        name: 'V-create',        type: 'fire', cost: 2, art: '☄️', sprite: 'liberty-pass', effects: { damage: 26, addCard: { id: 'poison', to: 'discard' } }, rarity: 'rare', upgrade: { effects: { damage: 33 } } },   // Immolate
  { id: 'burning-jealousy', name: 'Burning Jealousy', type: 'fire', cost: 2, art: '😡', sprite: 'green-shard', effects: { exhaustHand: 'all', damage: 8, hitsPerExhausted: true }, exhaust: true, rarity: 'rare', upgrade: { effects: { damage: 11 } } },   // Fiend Fire
  { id: 'blue-flare',      name: 'Blue Flare',      type: 'fire', cost: 3, art: '🔵', sprite: 'light-stone', effects: { corruption: 1 }, power: true, rarity: 'rare', upgrade: { cost: 2 } },   // Corruption
  { id: 'torch-song',      name: 'Torch Song',      type: 'fire', cost: 2, art: '📣', sprite: 'throat-spray', effects: { cardDamage: 2 }, power: true, rarity: 'rare', upgrade: { effects: { cardDamage: 3 } } },   // A Thousand Cuts
  { id: 'pyro-ball',       name: 'Pyro Ball',       type: 'fire', cost: 'X', art: '⚫', sprite: 'fast-ball', effects: { damage: 7, perX: { hits: 1 } }, rarity: 'rare', upgrade: { effects: { damage: 10 } } },   // Whirlwind
  { id: 'inferno-overdrive', name: 'Inferno Overdrive', type: 'fire', cost: 1, art: '♾️', sprite: 'firium-z', effects: { echo: 1 }, rarity: 'rare', upgrade: { cost: 0 } },   // Double Tap + Burst
  { id: 'desolate-land',   name: 'Desolate Land',   type: 'fire', cost: 3, art: '🏜️', sprite: 'red-orb', effects: { burnKeep: 1 }, power: true, rarity: 'rare', upgrade: { cost: 2 } },   // (Burn's own Catalyst, made permanent: Grassy Surge's twin)
  { id: 'fusion-flare',    name: 'Fusion Flare',    type: 'fire', cost: 1, art: '🧬', sprite: 'dna-splicers', effects: { exhume: 1 }, exhaust: true, rarity: 'rare', upgrade: { cost: 0 } },   // Exhume
];

const GRASS_CARDS = [
  // Common: 20
  { id: 'vine-whip',      name: 'Vine Whip',      type: 'grass', cost: 1, art: '🌿', sprite: 'galarica-twig', effects: { damage: 7 }, upgrade: { effects: { damage: 10 } } },                        // Strike
  { id: 'cotton-guard',   name: 'Cotton Guard',   type: 'grass', cost: 1, art: '🛡️', sprite: 'fluffy-tail', effects: { block: 11 }, retain: true, upgrade: { effects: { block: 14 } } },   // Defend (Retain); 11 since the 2026-10-16 balance pass
  { id: 'seed-bomb',      name: 'Seed Bomb',      type: 'grass', cost: 2, art: '🌰', sprite: 'rindo-berry', effects: { damage: 9, vulnerable: 2, seed: 1 }, upgrade: { effects: { damage: 11, vulnerable: 3, seed: 2 } } },   // Bash with a Leech Seed
  { id: 'petal-dance',    name: 'Petal Dance',    type: 'grass', cost: 1, art: '🌸', sprite: 'petal-pink', effects: { damage: 4, hits: 2, block: 5 }, upgrade: { effects: { damage: 5, block: 7 } } },   // Iron Wave in two petals
  { id: 'razor-leaf',     name: 'Razor Leaf',     type: 'grass', cost: 2, art: '🍃', sprite: 'silver-leaf', effects: { damage: 13, ifSeeded: { bonus: 7 } }, upgrade: { effects: { damage: 17, ifSeeded: { bonus: 9 } } } },   // a big leaf that cuts deeper into a seeded enemy
  { id: 'growth',         name: 'Growth',         type: 'grass', cost: 1, art: '🌱', sprite: 'growth-mulch', effects: { strength: 1, heal: 3 }, upgrade: { effects: { strength: 2 } } },   // Inflame (half) + a heal
  { id: 'bullet-seed',    name: 'Bullet Seed',    type: 'grass', cost: 1, art: '🌱', sprite: 'green-apricorn', effects: { damage: 3, hits: 3, ifSeeded: { hits: 2 } }, upgrade: { effects: { damage: 4 } } },   // seeds fired into a seeded enemy: two more hits
  { id: 'rototiller',     name: 'Rototiller',     type: 'grass', cost: 0, art: '🌱', sprite: 'boost-mulch', effects: { flex: 3 }, upgrade: { effects: { flex: 5 } } },   // Flex
  { id: 'branch-poke',    name: 'Branch Poke',    type: 'grass', cost: 0, art: '🌿', sprite: 'large-leek', effects: { damage: 3, flex: 2 }, upgrade: { effects: { damage: 5, flex: 3 } } },   // a 0-cost poke that sets up a strong turn (Flex on a Strike)
  { id: 'wood-hammer',    name: 'Wood Hammer',    type: 'grass', cost: 2, art: '🌳', sprite: 'wood-mail', effects: { damage: 15, ifWeak: { sap: 1 } }, upgrade: { effects: { damage: 20, ifWeak: { sap: 2 } } } },   // a heavy blow that saps a Weak enemy for good
  { id: 'absorb',         name: 'Absorb',         type: 'grass', cost: 1, art: '💚', sprite: 'absorb-bulb', effects: { damage: 6, heal: 3 }, upgrade: { effects: { damage: 8, heal: 4 } } },   // Reaper (lite)
  { id: 'mega-drain',     name: 'Mega Drain',     type: 'grass', cost: 2, art: '💚', sprite: 'luminous-moss', effects: { damage: 10, heal: 3, ifSeeded: { heal: 4 } }, upgrade: { effects: { damage: 14, heal: 4, ifSeeded: { heal: 5 } } } },   // drains more from a seeded enemy
  { id: 'worry-seed',     name: 'Worry Seed',     type: 'grass', cost: 1, art: '🌱', sprite: 'psychic-seed', effects: { seed: 3 }, upgrade: { effects: { seed: 5 } } },   // Deadly Poison
  { id: 'snap-trap',      name: 'Snap Trap',      type: 'grass', cost: 1, art: '🌿', sprite: 'ring-target', effects: { damage: 5, seed: 2 }, upgrade: { effects: { damage: 7, seed: 3 } } },   // Poisoned Stab
  { id: 'leaf-guard',     name: 'Leaf Guard',     type: 'grass', cost: 1, art: '🍃', sprite: 'rose-incense', effects: { block: 7, heal: 2 }, upgrade: { effects: { block: 10, heal: 3 } } },   // Shrug It Off, healing in place of the draw
  { id: 'sprout',         name: 'Sprout',         type: 'grass', cost: 1, art: '🌱', sprite: 'revival-herb', effects: { addCard: { id: 'seedling', n: 2, to: 'draw' } }, upgrade: { effects: { addCard: { id: 'seedling', n: 3, to: 'draw' } } } },   // Blade Dance, into the draw pile
  { id: 'stun-spore',     name: 'Stun Spore',     type: 'grass', cost: 1, art: '🍄', sprite: 'tiny-mushroom', effects: { damage: 5, ifEnemyAttacks: { weaken: 2 } }, upgrade: { effects: { damage: 8, ifEnemyAttacks: { weaken: 3 } } } },   // Sucker Punch: it stuns an attacker
  { id: 'magical-leaf',   name: 'Magical Leaf',   type: 'grass', cost: 1, art: '🍃', sprite: 'petal-green', effects: { damage: 8, ifWeak: { bonus: 4 } }, upgrade: { effects: { damage: 10, ifWeak: { bonus: 6 } } } },   // Heel Hook
  { id: 'sweet-scent',    name: 'Sweet Scent',    type: 'grass', cost: 1, art: '🌸', sprite: 'sachet', effects: { sap: 2 }, exhaust: true, upgrade: { effects: { sap: 3 } } },   // Disarm
  { id: 'apple-acid',     name: 'Apple Acid',     type: 'grass', cost: 1, art: '🌰', sprite: 'tart-apple', effects: { damage: 8, vulnerable: 1 }, retain: true, upgrade: { effects: { damage: 11, vulnerable: 2 } } },   // a Vulnerable you can hold until the big hit
  // Uncommon: 32
  { id: 'leaf-blade',     name: 'Leaf Blade',     type: 'grass', cost: 2, art: '🍃', sprite: 'leaf-stone', effects: { damage: 10, strength: 2 }, rarity: 'uncommon', upgrade: { effects: { damage: 14 } } },   // Inflame + a hit
  { id: 'power-whip',     name: 'Power Whip',     type: 'grass', cost: 2, art: '🌳', sprite: 'power-band', effects: { damage: 14, strengthMult: 3 }, rarity: 'uncommon', upgrade: { effects: { strengthMult: 5 } } },   // Heavy Blade
  { id: 'trailblaze',     name: 'Trailblaze',     type: 'grass', cost: 1, art: '🌿', sprite: 'swift-wing', effects: { ifEnemyAttacks: { strength: 3 } }, rarity: 'uncommon', upgrade: { effects: { ifEnemyAttacks: { strength: 4 } } } },   // Spot Weakness
  { id: 'needle-arm',     name: 'Needle Arm',     type: 'grass', cost: 1, art: '🌿', sprite: 'sticky-barb', effects: { damage: 2, hits: 4 }, exhaust: true, rarity: 'uncommon', upgrade: { effects: { hits: 5 } } },   // Pummel
  { id: 'horn-leech',     name: 'Horn Leech',     type: 'grass', cost: 2, art: '🌳', sprite: 'rare-bone', effects: { damage: 10, healPerStrength: 2 }, rarity: 'uncommon', upgrade: { effects: { damage: 13, healPerStrength: 3 } } },   // bridge Growth/Drain: Reaper, by strength
  { id: 'grass-pledge',   name: 'Grass Pledge',   type: 'grass', cost: 1, art: '🌿', sprite: 'leaf-letter-eevee', effects: { healStrength: 1 }, power: true, rarity: 'uncommon', upgrade: { cost: 0 } },   // bridge Growth/Drain: Rupture, on heals
  { id: 'spiky-shield',   name: 'Spiky Shield',   type: 'grass', cost: 1, art: '🌿', sprite: 'sharp-beak', effects: { thorns: 4 }, power: true, rarity: 'uncommon', upgrade: { effects: { thorns: 6 } } },   // Caltrops
  { id: 'synthesis',      name: 'Synthesis',      type: 'grass', cost: 2, art: '☀️', sprite: 'sitrus-berry', effects: { heal: 14 }, rarity: 'uncommon', upgrade: { effects: { heal: 19 } } },   // Bandage Up, kept
  { id: 'ingrain',        name: 'Ingrain',        type: 'grass', cost: 1, art: '🌳', sprite: 'rich-mulch', effects: { healEachTurn: 3 }, power: true, rarity: 'uncommon', upgrade: { effects: { healEachTurn: 4 } } },   // Regen
  { id: 'chlorophyll',    name: 'Chlorophyll',    type: 'grass', cost: 1, art: '☀️', sprite: 'petal-yellow', effects: { overheal: 1 }, power: true, rarity: 'uncommon', upgrade: { cost: 0 } },   // Feel No Pain, for healing past full
  { id: 'strength-sap',   name: 'Strength Sap',   type: 'grass', cost: 1, art: '💚', sprite: 'max-honey', effects: { healPerSeed: 2, sap: 1 }, exhaust: true, rarity: 'uncommon', upgrade: { effects: { healPerSeed: 3 } } },   // Bane, as a heal
  { id: 'grassy-glide',   name: 'Grassy Glide',   type: 'grass', cost: 1, art: '🍃', sprite: 'pretty-wing', effects: { block: 8, ifHealed: { block: 5 } }, rarity: 'uncommon', upgrade: { effects: { block: 10, ifHealed: { block: 7 } } } },   // Dodge and Roll
  { id: 'floral-healing', name: 'Floral Healing', type: 'grass', cost: 1, art: '🌸', sprite: 'small-bouquet', effects: { block: 6, healPerStrength: 1 }, rarity: 'uncommon', upgrade: { effects: { block: 9, healPerStrength: 2 } } },   // a Defend that heals with strength
  { id: 'aromatherapy',   name: 'Aromatherapy',   type: 'grass', cost: 1, art: '🌸', sprite: 'full-restore', effects: { heal: 4, exhaustHand: 'status', draw: 1 }, rarity: 'uncommon', upgrade: { effects: { heal: 7 } } },   // Purity
  { id: 'seed-flare',     name: 'Seed Flare',     type: 'grass', cost: 2, art: '🌸', sprite: 'flower-sweet', effects: { damage: 12, ifSeeded: { vulnerable: 2 } }, rarity: 'uncommon', upgrade: { effects: { damage: 16, ifSeeded: { vulnerable: 3 } } } },   // a flare off the seed: Vulnerable on a seeded enemy
  { id: 'sleep-powder',   name: 'Sleep Powder',   type: 'grass', cost: 1, art: '🍄', sprite: 'big-mushroom', effects: { weaken: 2, draw: 1 }, retain: true, rarity: 'uncommon', upgrade: { effects: { weaken: 3 } } },   // Blind
  { id: 'spore',          name: 'Spore',          type: 'grass', cost: 1, art: '🍄', sprite: 'balm-mushroom', effects: { weaken: 2, vulnerable: 2 }, exhaust: true, rarity: 'uncommon', upgrade: { effects: { weaken: 3, vulnerable: 3 } } },   // Crippling Cloud
  { id: 'effect-spore',   name: 'Effect Spore',   type: 'grass', cost: 1, art: '🍄', sprite: 'mixed-mushrooms', effects: { debuffDamage: 5 }, power: true, rarity: 'uncommon', upgrade: { effects: { debuffDamage: 7 } } },   // Sadistic Nature
  { id: 'leaf-tornado',   name: 'Leaf Tornado',   type: 'grass', cost: 1, art: '🌪️', sprite: 'green-scarf', effects: { damage: 6, perDebuff: 4 }, rarity: 'uncommon', upgrade: { effects: { damage: 8, perDebuff: 5 } } },   // Bane, per debuff
  { id: 'rage-powder',    name: 'Rage Powder',    type: 'grass', cost: 1, art: '🍄', sprite: 'heal-powder', effects: { block: 8, ifWeak: { block: 5 } }, rarity: 'uncommon', upgrade: { effects: { block: 11, ifWeak: { block: 6 } } } },   // a Defend that holds better against a Weak enemy
  { id: 'forests-curse',  name: 'Forest\'s Curse', type: 'grass', cost: 1, art: '🌳', sprite: 'odd-incense', effects: { sap: 1, vulnerable: 2 }, rarity: 'uncommon', upgrade: { effects: { sap: 2, vulnerable: 3 } } },   // Malaise (lite)
  { id: 'powder',         name: 'Powder',         type: 'grass', cost: 2, art: '💨', sprite: 'metal-powder', effects: { weakEachTurn: 1 }, power: true, rarity: 'uncommon', upgrade: { cost: 1 } },   // Noxious Fumes, as Weak
  { id: 'trop-kick',      name: 'Trop Kick',      type: 'grass', cost: 1, art: '🥊', sprite: 'fruit-bunch', effects: { damage: 9, sap: 1 }, rarity: 'uncommon', upgrade: { effects: { damage: 12 } } },   // Disarm + a hit
  { id: 'grav-apple',     name: 'Grav Apple',     type: 'grass', cost: 2, art: '🌰', sprite: 'sweet-apple', effects: { damage: 14, sap: 1, vulnerable: 1 }, rarity: 'uncommon', upgrade: { effects: { damage: 18, sap: 1, vulnerable: 2 } } },   // Uppercut, its Weak a Sap
  { id: 'drum-beating',   name: 'Drum Beating',   type: 'grass', cost: 1, art: '🥊', sprite: 'thick-club', effects: { damage: 7, ifVulnerable: { energy: 1, draw: 1 } }, rarity: 'uncommon', upgrade: { effects: { damage: 10 } } },   // bridge Growth/Spores: Dropkick
  { id: 'spicy-extract',  name: 'Spicy Extract',  type: 'grass', cost: 1, art: '🔥', sprite: 'spice-mix', effects: { vulnerable: 2, strength: 1 }, rarity: 'uncommon', upgrade: { effects: { strength: 2 } } },   // bridge Growth/Spores: Trip + Inflame (half)
  { id: 'chloroblast',    name: 'Chloroblast',    type: 'grass', cost: 2, art: '☀️', sprite: 'tr-grass', effects: { selfDamage: 4, damage: 20, ifHealed: { bonus: 10 } }, rarity: 'uncommon', upgrade: { effects: { damage: 26, ifHealed: { bonus: 12 } } } },   // a 2-cost Hemokinesis, stronger after a heal (Flare Blitz is the 1-cost one)
  { id: 'flower-shield',  name: 'Flower Shield',  type: 'grass', cost: 1, art: '🌸', sprite: 'petal-orange', effects: { block: 8, ifHealed: { strength: 1 } }, rarity: 'uncommon', upgrade: { effects: { block: 11 } } },   // bridge Growth/Drain: a Defend that grows
  { id: 'sappy-seed',     name: 'Sappy Seed',     type: 'grass', cost: 1, art: '🌱', sprite: 'electric-seed', effects: { seed: 2, sap: 1 }, rarity: 'uncommon', upgrade: { effects: { seed: 3, sap: 2 } } },   // bridge Drain/Spores: Deadly Poison + Disarm (lite)
  { id: 'cotton-spore',   name: 'Cotton Spore',   type: 'grass', cost: 1, art: '💨', sprite: 'fresh-cream', effects: { weaken: 2, seed: 1 }, rarity: 'uncommon', upgrade: { effects: { weaken: 3, seed: 2 } } },   // bridge Drain/Spores: Blind + poison
  { id: 'energy-ball',    name: 'Energy Ball',    type: 'grass', cost: 1, art: '🌀', sprite: 'grass-memory', effects: { damage: 9, ifSeeded: { heal: 4 } }, rarity: 'uncommon', upgrade: { effects: { damage: 12, ifSeeded: { heal: 5 } } } },   // bridge Drain/Spores: Bane, as a heal
  { id: 'ivy-cudgel',     name: 'Ivy Cudgel',     type: 'grass', cost: 2, art: '🪓', sprite: 'large-leek', effects: { damage: 6, hits: 2, strengthMult: 2 }, rarity: 'uncommon', upgrade: { effects: { damage: 8, strengthMult: 3 } } },   // Sword Boomerang + Heavy Blade (Growth)
  { id: 'flower-trick',   name: 'Flower Trick',   type: 'grass', cost: 1, art: '💐', sprite: 'small-bouquet', effects: { damage: 8, ifVulnerable: { bonus: 8 } }, rarity: 'uncommon', upgrade: { effects: { damage: 10, ifVulnerable: { bonus: 10 } } } },   // Bane, on Vulnerable (Spores)
  { id: 'grass-whistle',  name: 'Grass Whistle',  type: 'grass', cost: 1, art: '🎶', sprite: 'grass-memory', effects: { weaken: 1, ifEnemyAttacks: { draw: 2 } }, rarity: 'uncommon', upgrade: { effects: { weaken: 2, ifEnemyAttacks: { draw: 2 } } } },   // it lulls an attacker: Weak, and draw while it winds up
  { id: 'leafage',        name: 'Leafage',        type: 'grass', cost: 0, art: '🍂', sprite: 'gold-leaf', effects: { damage: 5, ifHealed: { draw: 1, heal: 2 } }, rarity: 'uncommon', upgrade: { effects: { damage: 8 } } },   // Flash of Steel, for Drain
  { id: 'aromatic-mist',  name: 'Aromatic Mist',  type: 'grass', cost: 1, art: '🌸', sprite: 'pink-nectar', effects: { heal: 3, weaken: 1, draw: 1 }, rarity: 'uncommon', upgrade: { effects: { heal: 5, weaken: 2 } } },   // bridge Drain/Spores: Blind + a heal
  // Rare: 14
  { id: 'solar-beam',     name: 'Solar Beam',     type: 'grass', cost: 3, art: '🌞', sprite: 'tm-grass', effects: { damage: 30, ifHealed: { energy: 1 } }, rarity: 'rare', upgrade: { effects: { damage: 40 } } },   // Bludgeon, cheaper in the sun: if you healed this turn
  { id: 'grassy-terrain', name: 'Grassy Terrain', type: 'grass', cost: 3, art: '🌿', sprite: 'terrain-extender', effects: { strengthEachTurn: 2 }, power: true, rarity: 'rare', upgrade: { effects: { strengthEachTurn: 3 } } },   // Demon Form
  { id: 'growth-spurt',   name: 'Growth Spurt',   type: 'grass', cost: 1, art: '🌱', sprite: 'rare-candy', effects: { doubleStrength: true }, exhaust: true, rarity: 'rare', upgrade: { cost: 0 } },   // Limit Break, but the upgrade keeps Exhaust: here strength turns into block and healing too (a ~12-card Sky Pillar deck doubled to floor 100, 2026-10-20)
  { id: 'solar-blade',    name: 'Solar Blade',    type: 'grass', cost: 2, art: '🌞', sprite: 'solganium-z', effects: { damage: 14, ifHealed: { strengthMult: 3 } }, retain: true, rarity: 'rare', upgrade: { effects: { damage: 18, ifHealed: { strengthMult: 4 } } } },   // Heavy Blade, charged by a heal: hold it until you heal
  { id: 'harvest',        name: 'Harvest',        type: 'grass', cost: 1, art: '🫐', sprite: 'berry-pots', effects: { strengthHeal: 2 }, power: true, rarity: 'rare', upgrade: { effects: { strengthHeal: 3 } } },   // bridge Growth/Drain
  { id: 'jungle-healing', name: 'Jungle Healing', type: 'grass', cost: 1, art: '💚', sprite: 'max-potion', effects: { damage: 12, feed: 4 }, exhaust: true, rarity: 'rare', upgrade: { effects: { damage: 14, feed: 5 } } },   // Feed
  { id: 'grassy-surge',   name: 'Grassy Surge',   type: 'grass', cost: 3, art: '🌱', sprite: 'meadow-plate', effects: { seedKeep: 1 }, power: true, rarity: 'rare', upgrade: { cost: 2 } },   // Catalyst, made permanent
  { id: 'leech-life',     name: 'Leech Life',     type: 'grass', cost: 1, art: '🩸', sprite: 'buginium-z', effects: { attackHeal: 2 }, power: true, rarity: 'rare', upgrade: { effects: { attackHeal: 3 } } },   // Reaper, on every attack
  { id: 'seed-sower',     name: 'Seed Sower',     type: 'grass', cost: 2, art: '🌱', sprite: 'starf-berry', effects: { attackSeed: 1 }, power: true, rarity: 'rare', upgrade: { cost: 1 } },   // Envenom
  { id: 'matcha-gotcha',  name: 'Matcha Gotcha',  type: 'grass', cost: 'X', art: '💚', sprite: 'cracked-pot', effects: { damage: 5, perX: { hits: 1 }, healDealt: true }, exhaust: true, rarity: 'rare', upgrade: { effects: { damage: 7 } } },   // Whirlwind + Reaper
  { id: 'natures-madness', name: 'Nature\'s Madness', type: 'grass', cost: 'X', art: '🌀', sprite: 'tapunium-z', effects: { perX: { sap: 1, weaken: 1 } }, exhaust: true, rarity: 'rare', upgrade: { effects: { xPlus: 1 } } },   // Malaise
  { id: 'pollen-puff',    name: 'Pollen Puff',    type: 'grass', cost: 1, art: '🌸', sprite: 'honey', effects: { drawPerDebuff: 1 }, rarity: 'rare', upgrade: { cost: 0 } },   // Expertise, by debuffs
  { id: 'sap-sipper',     name: 'Sap Sipper',     type: 'grass', cost: 1, art: '💚', sprite: 'yellow-nectar', effects: { weakBlock: 4 }, power: true, rarity: 'rare', upgrade: { effects: { weakBlock: 6 } } },   // Sadistic Nature, as block
  { id: 'bloom-doom',     name: 'Bloom Doom',     type: 'grass', cost: 2, art: '🌺', sprite: 'grassium-z', effects: { seedMult: 3 }, exhaust: true, rarity: 'rare', upgrade: { cost: 1 } },   // Catalyst, for Leech Seed
  { id: 'overgrowth',     name: 'Overgrowth',     type: 'grass', cost: 1, art: '🌳', sprite: 'rich-mulch', effects: { strengthBlock: 1 }, power: true, rarity: 'rare', upgrade: { cost: 0 } },   // (Growth's defence: Metallicize by strength; + was x2 until 2026-10-20, a deck that outlived any fight)
  { id: 'petal-storm',    name: 'Petal Storm',    type: 'grass', cost: 2, art: '🌸', sprite: 'petal-purple', effects: { damage: 4, hits: 5, vulnerable: 1 }, rarity: 'rare', upgrade: { effects: { damage: 5, vulnerable: 2 } } },   // Glass Knife
];

const WATER_CARDS = [
  // Common: 20
  { id: 'water-gun',      name: 'Water Gun',      type: 'water', cost: 1, art: '💧', sprite: 'water-stone', effects: { damage: 7 }, upgrade: { effects: { damage: 10 } } },                        // Strike
  { id: 'withdraw',       name: 'Withdraw',       type: 'water', cost: 1, art: '🐚', sprite: 'shoal-shell', effects: { block: 8 }, upgrade: { effects: { block: 11 } } },                         // Defend, 8 like Fire's Flame Wall since the 2026-10-16 balance pass
  { id: 'bubble',         name: 'Bubble',         type: 'water', cost: 1, art: '🫧', sprite: 'bubble-mail', effects: { damage: 5, weaken: 2, tide: 1 }, upgrade: { effects: { damage: 7 } } },   // Sucker Punch
  { id: 'dive',           name: 'Dive',           type: 'water', cost: 1, art: '🌊', sprite: 'dive-ball', effects: { block: 9, draw: 1, tide: 1 }, upgrade: { effects: { block: 12 } } },   // Shrug It Off
  { id: 'water-pulse',    name: 'Water Pulse',    type: 'water', cost: 1, art: '💧', sprite: 'splash-plate', effects: { damage: 5, perTide: 2 }, retain: true, upgrade: { effects: { perTide: 3 } } },   // Windmill Strike: hold it until the Tide is high
  { id: 'rain-dance',     name: 'Rain Dance',     type: 'water', cost: 1, art: '🌧️', sprite: 'sprinklotad', effects: { tide: 2, nextEnergy: 1 }, upgrade: { effects: { tide: 3 } } },   // rain now, energy next turn
  { id: 'surf',           name: 'Surf',           type: 'water', cost: 2, art: '🌊', sprite: 'hm-water', effects: { damage: 12, tide: 2 }, upgrade: { effects: { damage: 16 } } },   // Wheel Kick
  { id: 'soak',           name: 'Soak',           type: 'water', cost: 1, art: '💦', sprite: 'damp-mulch', effects: { vulnerable: 2, tide: 1 }, upgrade: { effects: { vulnerable: 3 } } },   // Trip
  { id: 'water-sport',    name: 'Water Sport',    type: 'water', cost: 0, art: '💦', sprite: 'sprayduck', effects: { tide: 2 }, exhaust: true, upgrade: { effects: { tide: 3 } } },   // Pray
  { id: 'snipe-shot',     name: 'Snipe Shot',     type: 'water', cost: 1, art: '🎯', sprite: 'wide-lens', effects: { damage: 6, perTideHeld: 2 }, upgrade: { effects: { perTideHeld: 3 } } },   // Perfected Strike: counts Tide without spending it
  { id: 'clamp',          name: 'Clamp',          type: 'water', cost: 2, art: '🐚', sprite: 'big-pearl', effects: { damage: 10, block: 10 }, upgrade: { effects: { damage: 13, block: 13 } } },   // Iron Wave x2
  { id: 'razor-shell',    name: 'Razor Shell',    type: 'water', cost: 1, art: '🐚', sprite: 'tropical-shell', effects: { blockDamage: true }, upgrade: { cost: 0 } },   // Body Slam
  { id: 'splash',         name: 'Splash',         type: 'water', cost: 0, art: '💦', sprite: 'lure-ball', effects: {}, onDiscard: { block: 5 }, unplayable: true, upgrade: { onDiscard: { block: 8 } } },   // Splash does nothing, until you discard it
  { id: 'shelter',        name: 'Shelter',        type: 'water', cost: 1, art: '🛡️', sprite: 'light-clay', effects: { block: 9, blockNext: 5 }, upgrade: { effects: { block: 11, blockNext: 7 } } },   // Dodge and Roll
  { id: 'flip-turn',      name: 'Flip Turn',      type: 'water', cost: 1, art: '🌀', sprite: 'eject-button', effects: { damage: 7, perDiscard: 4 }, upgrade: { effects: { damage: 10, perDiscard: 5 } } },   // Flow: it hits harder for each card discarded this turn
  { id: 'waterfall',      name: 'Waterfall',      type: 'water', cost: 1, art: '🌊', sprite: 'super-rod', effects: { draw: 3, discard: 1 }, upgrade: { effects: { draw: 4 } } },   // Acrobatics
  { id: 'aqua-step',      name: 'Aqua Step',      type: 'water', cost: 0, art: '💦', sprite: 'tropic-mail', effects: { block: 4, tide: 1, discard: 1 }, upgrade: { effects: { block: 6 } } },   // a dance step: block, Tide and a discard
  { id: 'mist',           name: 'Mist',           type: 'water', cost: 1, art: '💨', sprite: 'misty-seed', effects: { block: 12, discard: 1 }, upgrade: { effects: { block: 15 } } },   // Survivor
  { id: 'chilling-water', name: 'Chilling Water', type: 'water', cost: 1, art: '💧', sprite: 'never-melt-ice', effects: { block: 6, weaken: 1, draw: 1 }, upgrade: { effects: { block: 9, weaken: 2 } } },   // Backflip, with the move's Attack drop as Weak
  { id: 'muddy-water',    name: 'Muddy Water',    type: 'water', cost: 2, art: '🌊', sprite: 'polished-mud-ball', effects: { damage: 13, weaken: 2, discard: 1 }, upgrade: { effects: { damage: 17, weaken: 3 } } },   // Clothesline that feeds the discard pile
  // Uncommon: 32
  { id: 'whirlpool',      name: 'Whirlpool',      type: 'water', cost: 1, art: '🌀', sprite: 'tidal-bell', effects: { damage: 3, hits: 2, weaken: 2 }, rarity: 'uncommon', upgrade: { effects: { damage: 4, weaken: 3 } } },   // it traps: two hits and a long Weak
  { id: 'liquidation',    name: 'Liquidation',    type: 'water', cost: 1, art: '💦', sprite: 'passho-berry', effects: { damage: 10, ifDiscarded: { vulnerable: 2 } }, rarity: 'uncommon', upgrade: { effects: { damage: 13, ifDiscarded: { vulnerable: 3 } } } },   // Flow: Vulnerable after a discard
  { id: 'rising-tide',    name: 'Rising Tide',    type: 'water', cost: 1, art: '⏫', sprite: 'sea-incense', effects: { tideEachTurn: 1 }, power: true, rarity: 'uncommon', upgrade: { cost: 0 } },   // Devotion
  { id: 'swift-swim',     name: 'Swift Swim',     type: 'water', cost: 0, art: '💦', sprite: 'deep-sea-scale', effects: { tideMult: 2 }, exhaust: true, rarity: 'uncommon', upgrade: { effects: { tideMult: 3 } } },   // Catalyst
  { id: 'crabhammer',     name: 'Crabhammer',     type: 'water', cost: 2, art: '🦀', sprite: 'kings-rock', effects: { damage: 6, hits: 2, perTide: 2 }, rarity: 'uncommon', upgrade: { effects: { damage: 8 } } },   // two claws, each +2 per Tide (Hydro Pump is the one big hit)
  { id: 'water-spout',    name: 'Water Spout',    type: 'water', cost: 'X', art: '⛲', sprite: 'wailmer-pail', effects: { perX: { tide: 2 } }, rarity: 'uncommon', upgrade: { effects: { xPlus: 1 } } },   // Tempest
  { id: 'aqua-ring',      name: 'Aqua Ring',      type: 'water', cost: 1, art: '⭕', sprite: 'pearl-string', effects: { heal: 4, tide: 2 }, rarity: 'uncommon', upgrade: { effects: { heal: 6 } } },   // a ring of water: heal and Tide
  { id: 'mirror-coat',    name: 'Mirror Coat',    type: 'water', cost: 1, art: '🔮', sprite: 'reveal-glass', effects: { thorns: 3, tideEachTurn: 1 }, power: true, rarity: 'uncommon', upgrade: { effects: { thorns: 5 } } },   // Thorns that brings in the Tide
  { id: 'water-veil',     name: 'Water Veil',     type: 'water', cost: 1, art: '🌧️', sprite: 'prism-scale', effects: { blockEachTurn: 3 }, power: true, rarity: 'uncommon', upgrade: { effects: { blockEachTurn: 4 } } },   // Metallicize
  { id: 'tidal-wall',     name: 'Tidal Wall',     type: 'water', cost: 1, art: '🌊', sprite: 'swampertite', effects: { blockPerTide: 4 }, rarity: 'uncommon', upgrade: { effects: { blockPerTide: 5 } } },   // Shell's way to cash in Tide
  { id: 'shell-smash',    name: 'Shell Smash',    type: 'water', cost: 2, art: '🐚', sprite: 'slowbronite', effects: { blockMult: 2 }, exhaust: true, rarity: 'uncommon', upgrade: { cost: 1 } },   // Entrench; Exhaust since 2026-10-16: with Shell Armor it doubled every turn, to millions of block
  { id: 'aqua-tail',      name: 'Aqua Tail',      type: 'water', cost: 1, art: '🌊', sprite: 'lagging-tail', effects: { block: 7, blockDamage: 0.5 }, rarity: 'uncommon', upgrade: { effects: { block: 10 } } },   // Iron Wave + Body Slam
  { id: 'bubble-shield',  name: 'Bubble Shield',  type: 'water', cost: 1, art: '🫧', sprite: 'soda-pop', effects: { block: 10, tide: 1 }, ethereal: true, rarity: 'uncommon', upgrade: { effects: { block: 13 } } },   // a Tide with its Ethereal block
  { id: 'surging-strikes', name: 'Surging Strikes', type: 'water', cost: 2, art: '🌊', sprite: 'tr-water', effects: { damage: 4, hits: 3, perTideHeld: 1 }, rarity: 'uncommon', upgrade: { effects: { damage: 6 } } },   // three hits that each ride the Tide
  { id: 'undertow',       name: 'Undertow',       type: 'water', cost: 1, art: '🌊', sprite: 'wave-mail', effects: { discardTide: 1 }, power: true, rarity: 'uncommon', upgrade: { cost: 0 } },   // a discard payoff that feeds Tide
  { id: 'ripple',         name: 'Ripple',         type: 'water', cost: 0, art: '💧', sprite: 'blue-shard', effects: {}, unplayable: true, onDiscard: { draw: 2 }, rarity: 'uncommon', upgrade: { onDiscard: { draw: 3 } } },   // Reflex
  { id: 'wellspring',     name: 'Wellspring',     type: 'water', cost: 0, art: '⛲', sprite: 'max-ether', effects: {}, unplayable: true, onDiscard: { energy: 1 }, rarity: 'uncommon', upgrade: { onDiscard: { energy: 2 } } },   // Tactician
  { id: 'wash-away',      name: 'Wash Away',      type: 'water', cost: 0, art: '🌊', sprite: 'full-heal', effects: { discardHand: true, perDiscarded: { draw: 1 } }, exhaust: true, rarity: 'uncommon', upgrade: { exhaust: false } },   // Calculated Gamble
  { id: 'triple-dive',    name: 'Triple Dive',    type: 'water', cost: 3, art: '🌊', sprite: 'devon-scuba-gear', effects: { damage: 7, hits: 3, costDownOnDiscard: 1 }, rarity: 'uncommon', upgrade: { effects: { damage: 9 } } },   // Eviscerate
  { id: 'still-waters',   name: 'Still Waters',   type: 'water', cost: 1, art: '🔒', sprite: 'clear-bell', effects: { retainN: 1 }, power: true, rarity: 'uncommon', upgrade: { effects: { retainN: 2 } } },   // Well-Laid Plans
  { id: 'upwell',         name: 'Upwell',         type: 'water', cost: 1, art: '⛲', sprite: 'good-rod', effects: { drawTo: 6 }, rarity: 'uncommon', upgrade: { effects: { drawTo: 7 } } },   // Expertise
  { id: 'fishious-rend',  name: 'Fishious Rend',  type: 'water', cost: 2, art: '🦷', sprite: 'deep-sea-tooth', effects: { damage: 14, ifDiscarded: { energy: 2 } }, rarity: 'uncommon', upgrade: { effects: { damage: 18 } } },   // Sneaky Strike
  { id: 'aqua-cutter',    name: 'Aqua Cutter',    type: 'water', cost: 1, art: '🌊', sprite: 'sharpedonite', effects: { damage: 8 }, retain: true, growOnRetain: { damage: 4 }, rarity: 'uncommon', upgrade: { effects: { damage: 11 }, growOnRetain: { damage: 5 } } },   // Windmill Strike
  { id: 'octazooka',      name: 'Octazooka',      type: 'water', cost: 1, art: '🎯', sprite: 'zoom-lens', effects: { damage: 7, discard: 1, tide: 1 }, rarity: 'uncommon', upgrade: { effects: { damage: 10 } } },   // bridge Flow/Tsunami: Dagger Throw + Tide
  { id: 'storm-drain',    name: 'Storm Drain',    type: 'water', cost: 1, art: '🛡️', sprite: 'float-stone', effects: { discardBlock: 3 }, power: true, rarity: 'uncommon', upgrade: { effects: { discardBlock: 4 } } },   // bridge Flow/Shell: Feel No Pain for discards
  { id: 'aqua-veil',      name: 'Aqua Veil',      type: 'water', cost: 1, art: '🧣', sprite: 'blue-scarf', effects: { block: 7, blur: 1 }, rarity: 'uncommon', upgrade: { effects: { block: 10 } } },   // bridge Shell/Flow: Blur
  { id: 'jet-punch',      name: 'Jet Punch',      type: 'water', cost: 0, art: '🥊', sprite: 'jet-ball', effects: { damage: 5, ifDiscarded: { draw: 1 } }, rarity: 'uncommon', upgrade: { effects: { damage: 7 } } },   // bridge Flow: Flash of Steel
  { id: 'sparkling-aria', name: 'Sparkling Aria', type: 'water', cost: 2, art: '✨', sprite: 'primarium-z', effects: { tide: 3, draw: 2 }, rarity: 'uncommon', upgrade: { effects: { tide: 4 } } },   // Tide and two cards (Water Sport is the plain Tide)
  { id: 'rain-dish',      name: 'Rain Dish',      type: 'water', cost: 1, art: '⛲', sprite: 'pearl', effects: { tideSpendBlock: 2 }, power: true, rarity: 'uncommon', upgrade: { effects: { tideSpendBlock: 3 } } },   // bridge Tsunami/Shell: Mental Fortress (a cash-in also defends)
  { id: 'bouncy-bubble',  name: 'Bouncy Bubble',  type: 'water', cost: 1, art: '🫧', sprite: 'bead-mail', effects: { damage: 4, hits: 2, tide: 1 }, rarity: 'uncommon', upgrade: { effects: { damage: 6 } } },   // bridge Tsunami: Twin Strike + Tide
  { id: 'water-absorb',   name: 'Water Absorb',   type: 'water', cost: 2, art: '💧', sprite: 'fresh-water', effects: { block: 13, heal: 4 }, retain: true, rarity: 'uncommon', upgrade: { effects: { block: 16, heal: 6 } } },   // a kept shield that heals
  { id: 'hydro-steam',    name: 'Hydro Steam',    type: 'water', cost: 1, art: '♨️', sprite: 'douse-drive', effects: { damage: 9, tideMult: 2 }, rarity: 'uncommon', upgrade: { effects: { damage: 13 } } },   // Strike + Catalyst (Tsunami); 1 PP since the bot's check (2 PP for 14 tested -12)
  { id: 'gulp-missile',   name: 'Gulp Missile',   type: 'water', cost: 1, art: '🐟', sprite: 'deep-sea-tooth', effects: { blockDamage: 0.75, hits: 2 }, rarity: 'uncommon', upgrade: { cost: 0 } },   // Body Slam, twice at three quarters (Shell; half tested -7)
  { id: 'undercurrent',   name: 'Undercurrent',   type: 'water', cost: 0, art: '🌀', sprite: 'wave-mail', effects: { discard: 3, energy: 2 }, rarity: 'uncommon', upgrade: { effects: { discard: 2 } } },   // Concentrate (Flow)
  { id: 'steam-eruption', name: 'Steam Eruption', type: 'water', cost: 4, art: '🌋', sprite: 'water-memory', effects: { damage: 24 }, retain: true, growOnRetain: { discount: 1 }, rarity: 'uncommon', upgrade: { effects: { damage: 31 } } },   // Sands of Time (Flow's retain)
  { id: 'ebb-tide',       name: 'Ebb Tide',       type: 'water', cost: 0, art: '🌊', sprite: 'moon-stone', effects: { draw: 1, discard: 1, tide: 1 }, rarity: 'uncommon', upgrade: { effects: { draw: 2 } } },   // bridge Flow/Tsunami: Prepared + Tide
  // Rare: 13
  { id: 'hydro-pump',     name: 'Hydro Pump',     type: 'water', cost: 2, art: '🚿', sprite: 'tm-water', effects: { damage: 10, perTide: 5 }, rarity: 'rare', upgrade: { effects: { damage: 14, perTide: 6 } } },   // Ragnarok, as the big cash-in
  { id: 'drizzle',        name: 'Drizzle',        type: 'water', cost: 1, art: '💦', sprite: 'azure-flute', effects: { drizzle: 1 }, power: true, rarity: 'rare', upgrade: { cost: 0 } },   // Envenom for Tide
  { id: 'tsunami',        name: 'Tsunami',        type: 'water', cost: 2, art: '🌊', sprite: 'water-memory', effects: { damage: 10, perTideGained: 3 }, rarity: 'rare', upgrade: { effects: { perTideGained: 4 } } },   // Brilliance
  { id: 'shell-armor',    name: 'Shell Armor',    type: 'water', cost: 2, art: '🐚', sprite: 'shed-shell', effects: { keepBlock: 1 }, power: true, rarity: 'rare', upgrade: { cost: 1 } },   // Barricade
  { id: 'riptide',        name: 'Riptide',        type: 'water', cost: 2, art: '🌀', sprite: 'net-ball', effects: { riptide: 5 }, power: true, rarity: 'rare', upgrade: { effects: { riptide: 7 } } },   // Juggernaut
  { id: 'iron-shell',     name: 'Iron Shell',     type: 'water', cost: 2, art: '🐚', sprite: 'hard-stone', effects: { block: 24, blur: 1 }, exhaust: true, rarity: 'rare', upgrade: { effects: { block: 32 } } },   // Impervious that lasts a second turn
  { id: 'primordial-sea', name: 'Primordial Sea', type: 'water', cost: 2, art: '🌀', sprite: 'blue-orb', effects: { drawEachTurn: 1, blockEachTurn: 2 }, power: true, rarity: 'rare', upgrade: { cost: 1 } },   // Tools of the Trade
  { id: 'hydration',      name: 'Hydration',      type: 'water', cost: 1, art: '🫧', sprite: 'berry-juice', effects: { cardBlock: 1 }, power: true, rarity: 'rare', upgrade: { innate: true } },   // After Image
  { id: 'water-shuriken', name: 'Water Shuriken', type: 'water', cost: 1, art: '⭐', sprite: 'star-piece', effects: { discardHand: true, perDiscarded: { addCard: { id: 'droplet' } } }, rarity: 'rare', upgrade: { effects: { perDiscarded: { addCard: { id: 'droplet+' } } } } },   // Storm of Steel
  { id: 'life-dew',       name: 'Life Dew',       type: 'water', cost: 1, art: '💚', sprite: 'oran-berry', effects: { heal: 6 }, retain: true, growOnRetain: { heal: 2 }, exhaust: true, rarity: 'rare', upgrade: { effects: { heal: 8 }, growOnRetain: { heal: 3 } } },   // Windmill Strike, for healing
  { id: 'ebb-and-flow',   name: 'Ebb and Flow',   type: 'water', cost: 1, art: '🏷️', sprite: 'soul-dew', effects: { retainDiscount: 1 }, power: true, rarity: 'rare', upgrade: { innate: true } },   // Establishment
  { id: 'aqua-wall',      name: 'Aqua Wall',      type: 'water', cost: 2, art: '🏰', sprite: 'icy-rock', effects: { blockPerCard: 4 }, rarity: 'rare', upgrade: { effects: { blockPerCard: 5 } } },   // Spirit Shield
  { id: 'downpour',       name: 'Downpour',       type: 'water', cost: 1, art: '🌧️', sprite: 'sprinklotad', effects: { drawTo: 10 }, exhaust: true, rarity: 'rare', upgrade: { cost: 0 } },   // Scrawl
  { id: 'eye-of-the-storm', name: 'Eye of the Storm', type: 'water', cost: 3, art: '🌀', sprite: 'tidal-bell', effects: { skipEnemy: true }, exhaust: true, rarity: 'rare', upgrade: { cost: 2 } },   // Vault
  { id: 'primal-reversion', name: 'Primal Reversion', type: 'water', cost: 3, art: '🧿', sprite: 'sapphire', effects: { tideSurge: 1 }, power: true, ethereal: true, rarity: 'rare', upgrade: { ethereal: false } },   // Deva Form
];

const PSYCHIC_CARDS = [
  // Common: 20
  { id: 'psywave',             name: 'Psywave',             type: 'psychic', cost: 1, art: '🌀', effects: { damage: 10 }, upgrade: { effects: { damage: 13 } } },                                    // Strike
  { id: 'psychic-guard',       name: 'Psychic Guard',       type: 'psychic', cost: 1, art: '🛡️', effects: { block: 11 }, upgrade: { effects: { block: 14 } } },                                    // Defend
  { id: 'psychic-confusion',   name: 'Confusion',           type: 'psychic', cost: 2, art: '💫', effects: { damage: 12, vulnerable: 2 }, upgrade: { effects: { damage: 14, vulnerable: 3 } } },      // Bash
  { id: 'psystrike',           name: 'Psystrike',           type: 'psychic', cost: 1, art: '💥', effects: { damage: 10, weaken: 2 }, upgrade: { effects: { damage: 13, weaken: 3 } } },             // Sucker Punch
  { id: 'mind-bolt',           name: 'Mind Bolt',           type: 'psychic', cost: 1, art: '✨', effects: { damage: 6, focus: 4 }, upgrade: { effects: { damage: 8, focus: 5 } } },                  // Strike + setup
  { id: 'telekinetic-crush',   name: 'Telekinetic Crush',   type: 'psychic', cost: 1, art: '🌀', effects: { damage: 4, hitsPerAttack: true }, upgrade: { effects: { damage: 6 } } },                          // once for each attack played this turn
  { id: 'calm-mind',           name: 'Calm Mind',           type: 'psychic', cost: 1, art: '🧘', effects: { strength: 1, focus: 4 }, upgrade: { effects: { strength: 2 } } },                       // Inflame, half + Focus
  { id: 'barrier',             name: 'Barrier',             type: 'psychic', cost: 1, art: '🟣', effects: { block: 7, blockNext: 3 }, upgrade: { effects: { block: 9, blockNext: 4 } } },          // Dodge and Roll
  { id: 'recover',             name: 'Recover',             type: 'psychic', cost: 1, art: '💚', effects: { heal: 7 }, upgrade: { effects: { heal: 10 } } },                                        // Bandage Up
  { id: 'future-sight',        name: 'Future Sight',        type: 'psychic', cost: 1, art: '🔮', effects: { focus: 8 }, upgrade: { effects: { focus: 11 } } },                                      // Predator, as setup
  { id: 'mind-reader',         name: 'Mind Reader',         type: 'psychic', cost: 1, art: '👁️', effects: { vulnerable: 2, draw: 1 }, upgrade: { effects: { vulnerable: 3 } } },                   // Trip + draw
  { id: 'telekinesis',         name: 'Telekinesis',         type: 'psychic', cost: 1, art: '✋', effects: { block: 6, draw: 1 }, upgrade: { effects: { block: 9 } } },                              // Shrug It Off
  { id: 'reflective-screen',   name: 'Reflective Screen',   type: 'psychic', cost: 1, art: '🪞', effects: { block: 8, blur: 1 }, upgrade: { effects: { block: 11 } } },                            // Blur
  { id: 'disable',             name: 'Disable',             type: 'psychic', cost: 1, art: '🚫', effects: { weaken: 1, tempSap: 4 }, upgrade: { effects: { weaken: 2, tempSap: 5 } } },                       // it disables a move this turn
  { id: 'psybeam',             name: 'Psybeam',             type: 'psychic', cost: 1, art: '🌈', effects: { damage: 7, ifVulnerable: { weaken: 2 } }, upgrade: { effects: { damage: 10, ifVulnerable: { weaken: 3 } } } },             // it confuses an exposed enemy: Weak
  { id: 'brain-wave',          name: 'Brain Wave',          type: 'psychic', cost: 0, art: '🧠', effects: { damage: 5, nextEnergy: 1 }, upgrade: { effects: { damage: 7 } } },                      // Flying Knee
  { id: 'dissonant-pulse',     name: 'Dissonant Pulse',     type: 'psychic', cost: 1, art: '〰️', effects: { damage: 4, hits: 2, weaken: 1 }, upgrade: { effects: { damage: 5, weaken: 2 } } },                          // two pulses that weaken
  { id: 'focus-blast',         name: 'Focus Blast',         type: 'psychic', cost: 2, art: '💫', effects: { damage: 13, ifVulnerable: { bonus: 7 } }, upgrade: { effects: { damage: 17, ifVulnerable: { bonus: 9 } } } },                                   // a blast that finds the weak spot: more on Vulnerable
  { id: 'dream-eater',         name: 'Dream Eater',         type: 'psychic', cost: 1, art: '🌙', effects: { damage: 7, ifWeak: { bonus: 7 } }, upgrade: { effects: { damage: 9, ifWeak: { bonus: 9 } } } }, // Heel Hook
  { id: 'mirror-image',        name: 'Mirror Image',        type: 'psychic', cost: 1, art: '🪞', effects: { block: 7, focus: 3 }, upgrade: { effects: { block: 9, focus: 4 } } },                  // Iron Wave, psychic setup
  // Uncommon: 26
  { id: 'psychic-surge',       name: 'Psychic Surge',       type: 'psychic', cost: 2, art: '🌌', effects: { strengthEachTurn: 1 }, power: true, rarity: 'uncommon', upgrade: { effects: { strengthEachTurn: 2 } } }, // Demon Form
  { id: 'kinetic-barrage',     name: 'Kinetic Barrage',     type: 'psychic', cost: 1, art: '🌀', effects: { damage: 3, hits: 3, draw: 1 }, rarity: 'uncommon', upgrade: { effects: { damage: 4 } } },          // three hits and a draw
  { id: 'psycho-cut',          name: 'Psycho Cut',          type: 'psychic', cost: 1, art: '🔪', effects: { damage: 8, strength: 1 }, rarity: 'uncommon', upgrade: { effects: { damage: 11, strength: 2 } } }, // Iron Wave + Inflame
  { id: 'telekinetic-toss',    name: 'Telekinetic Toss',    type: 'psychic', cost: 1, art: '🪨', effects: { damage: 7, perPlayed: 3 }, rarity: 'uncommon', upgrade: { effects: { damage: 9, perPlayed: 4 } } }, // Dagger Spray payoff
  { id: 'focus-punch',         name: 'Focus Punch',         type: 'psychic', cost: 1, art: '👊', effects: { damage: 8 }, growOnRetain: { damage: 4 }, retain: true, rarity: 'uncommon', upgrade: { effects: { damage: 11 } } }, // Windmill Strike: it focuses while you hold it
  { id: 'aura-sphere',         name: 'Aura Sphere',         type: 'psychic', cost: 2, art: '🔵', effects: { damage: 12, strengthMult: 2 }, rarity: 'uncommon', upgrade: { effects: { damage: 16, strengthMult: 3 } } }, // Heavy Blade
  { id: 'power-within',        name: 'Power Within',        type: 'psychic', cost: 1, art: '💪', effects: { strength: 2, draw: 2 }, exhaust: true, rarity: 'uncommon', upgrade: { effects: { strength: 3 } } }, // Inflame that draws (Calm Mind is the one with Focus)
  { id: 'psychic-crush',       name: 'Psychic Crush',       type: 'psychic', cost: 2, art: '💥', effects: { damage: 16, ifWeak: { vulnerable: 2 } }, rarity: 'uncommon', upgrade: { effects: { damage: 21, ifWeak: { vulnerable: 3 } } } }, // it crushes a Weak enemy's guard: Vulnerable
  { id: 'kinesis',             name: 'Kinesis',             type: 'psychic', cost: 1, art: '🧲', effects: { focus: 6, draw: 1 }, rarity: 'uncommon', upgrade: { effects: { focus: 8 } } },         // Setup + draw
  { id: 'light-screen',        name: 'Light Screen',        type: 'psychic', cost: 1, art: '✨', effects: { blockEachTurn: 3 }, power: true, rarity: 'uncommon', upgrade: { effects: { blockEachTurn: 4 } } }, // Metallicize
  { id: 'barrier-field',       name: 'Barrier Field',       type: 'psychic', cost: 2, art: '🟣', effects: { keepBlock: 1 }, power: true, rarity: 'uncommon', upgrade: { cost: 1 } },               // Barricade
  { id: 'counter-guard',       name: 'Counter Guard',       type: 'psychic', cost: 1, art: '🛡️', effects: { block: 10, ifEnemyAttacks: { weaken: 1 } }, rarity: 'uncommon', upgrade: { effects: { block: 13, ifEnemyAttacks: { weaken: 2 } } } }, // Flame Barrier
  { id: 'safeguard',           name: 'Safeguard',           type: 'psychic', cost: 1, art: '🔰', effects: { block: 7, guard: true }, rarity: 'uncommon', upgrade: { effects: { block: 10 } } }, // Protect
  { id: 'telekinetic-wall',    name: 'Telekinetic Wall',    type: 'psychic', cost: 2, art: '🧱', effects: { block: 16 }, retain: true, rarity: 'uncommon', upgrade: { effects: { block: 21 } } },       // a wall you can hold for the big hit
  { id: 'reflective-armor',    name: 'Reflective Armor',    type: 'psychic', cost: 1, art: '🪞', effects: { thorns: 5 }, power: true, rarity: 'uncommon', upgrade: { effects: { thorns: 7 } } }, // Caltrops
  { id: 'psychic-rampart',     name: 'Psychic Rampart',     type: 'psychic', cost: 1, art: '🏰', effects: { block: 10, ifEnemyAttacks: { block: 6 } }, rarity: 'uncommon', upgrade: { effects: { block: 13, ifEnemyAttacks: { block: 7 } } } }, // it braces against an attack
  { id: 'force-bubble',        name: 'Force Bubble',        type: 'psychic', cost: 2, art: '🫧', effects: { block: 19 }, ethereal: true, rarity: 'uncommon', upgrade: { effects: { block: 24 } } }, // Ghostly Armor
  { id: 'zen-focus',           name: 'Zen Focus',           type: 'psychic', cost: 1, art: '🧘', effects: { block: 7, ifWeak: { focus: 6 } }, rarity: 'uncommon', upgrade: { effects: { block: 10, ifWeak: { focus: 8 } } } }, // calm against a Weak enemy: Focus
  { id: 'hypnosis',            name: 'Hypnosis',            type: 'psychic', cost: 2, art: '😴', effects: { weaken: 3, vulnerable: 2 }, exhaust: true, rarity: 'uncommon', upgrade: { effects: { weaken: 4, vulnerable: 3 } } }, // Crippling Cloud
  { id: 'trick-room',          name: 'Trick Room',          type: 'psychic', cost: 1, art: '🌀', effects: { vulnerable: 2, weaken: 1 }, rarity: 'uncommon', upgrade: { effects: { vulnerable: 3 } } }, // Trip + Weak
  { id: 'mind-games',          name: 'Mind Games',          type: 'psychic', cost: 1, art: '🎭', effects: { vulnerable: 1, ifVulnerable: { draw: 1 } }, rarity: 'uncommon', upgrade: { effects: { vulnerable: 2 } } }, // Dropkick
  { id: 'thought-scan',        name: 'Thought Scan',        type: 'psychic', cost: 1, art: '👁️', effects: { draw: 2, discard: 1 }, rarity: 'uncommon', upgrade: { effects: { draw: 3 } } }, // Acrobatics
  { id: 'disable-plus',        name: 'Imprison',            type: 'psychic', cost: 1, art: '🚫', effects: { weaken: 2, sap: 1 }, exhaust: true, rarity: 'uncommon', upgrade: { cost: 0 } },            // was Disable+, a second Disable: it seals a move for good (a Sap)
  { id: 'future-shock',       name: 'Future Shock',        type: 'psychic', cost: 1, art: '🔮', effects: { focus: 7, nextEnergy: 1 }, rarity: 'uncommon', upgrade: { effects: { focus: 10 } } }, // Focus now, energy next turn
  { id: 'telepathy',           name: 'Telepathy',           type: 'psychic', cost: 1, art: '🧠', effects: { drawEachTurn: 1 }, power: true, rarity: 'uncommon', upgrade: { cost: 0 } },        // Tools of the Trade, without discard
  { id: 'expanding-force',     name: 'Expanding Force',     type: 'psychic', cost: 2, art: '🌐', effects: { damage: 9, hits: 2, vulnerable: 1 }, rarity: 'uncommon', upgrade: { effects: { damage: 12, vulnerable: 2 } } }, // Twin Strike + Trip (Force)
  { id: 'magic-room',          name: 'Magic Room',          type: 'psychic', cost: 1, art: '🎪', effects: { weaken: 1, vulnerable: 1, draw: 1 }, retain: true, rarity: 'uncommon', upgrade: { effects: { weaken: 2, vulnerable: 2 } } }, // Blind + Trip, kept (Mind Games)
  { id: 'cosmic-power',        name: 'Cosmic Power',        type: 'psychic', cost: 1, art: '🌠', effects: { blockEachTurn: 2, thorns: 3 }, power: true, rarity: 'uncommon', upgrade: { effects: { blockEachTurn: 3, thorns: 4 } } }, // Metallicize + Caltrops, lite (Barrier)
  { id: 'meditate',            name: 'Meditate',            type: 'psychic', cost: 1, art: '🧘', effects: { focusEachTurn: 3 }, power: true, rarity: 'uncommon', upgrade: { effects: { focusEachTurn: 5 } } }, // (Force: Focus every turn)
  { id: 'synchro-strike',      name: 'Synchro Strike',      type: 'psychic', cost: 1, art: '💫', effects: { damage: 8, ifVulnerable: { energy: 1, draw: 1 } }, rarity: 'uncommon', upgrade: { effects: { damage: 11 } } }, // Dropkick
  // Rare: 14
  { id: 'psycho-boost',        name: 'Psycho Boost',        type: 'psychic', cost: 2, art: '🌠', effects: { damage: 32 }, exhaust: true, rarity: 'rare', upgrade: { effects: { damage: 40 } } },  // one huge blast a fight (Hyper Beam is the one that recharges)
  { id: 'psyshock-wave',       name: 'Psyshock Wave',       type: 'psychic', cost: 2, art: '🌌', effects: { damage: 6, hits: 3, strengthMult: 2 }, rarity: 'rare', upgrade: { effects: { damage: 8 } } },    // three hits that each count your strength twice
  { id: 'unleashed-power',    name: 'Unleashed Power',    type: 'psychic', cost: 1, art: '💥', effects: { damage: 12, strengthMult: 4 }, retain: true, rarity: 'rare', upgrade: { effects: { damage: 16, strengthMult: 5 } } }, // Heavy Blade+
  { id: 'psychic-mastery',     name: 'Psychic Mastery',     type: 'psychic', cost: 2, art: '🧠', effects: { strengthEachTurn: 1, focusEachTurn: 3 }, power: true, rarity: 'rare', upgrade: { effects: { focusEachTurn: 5 } } }, // strength and Focus every turn
  { id: 'amnesia',             name: 'Amnesia',             type: 'psychic', cost: 2, art: '🌫️', effects: { keepBlock: 1, block: 12 }, power: true, rarity: 'rare', upgrade: { cost: 1 } },   // Barricade+ (block 12 since 2026-10-16: it read just like Barrier Field)
  { id: 'mirror-armor',        name: 'Mirror Armor',        type: 'psychic', cost: 2, art: '🪞', effects: { thorns: 5, weakEachTurn: 1 }, power: true, rarity: 'rare', upgrade: { effects: { thorns: 8 } } }, // Thorns that wears it down: Weak each turn
  { id: 'psychic-fortress',    name: 'Psychic Fortress',    type: 'psychic', cost: 2, art: '🏰', effects: { blockEachTurn: 5, drawEachTurn: 1 }, power: true, rarity: 'rare', upgrade: { cost: 1 } }, // Barricade + Tools
  { id: 'precognition',        name: 'Precognition',        type: 'psychic', cost: 1, art: '🔮', effects: { focus: 5, drawTo: 6 }, exhaust: true, rarity: 'rare', upgrade: { effects: { focus: 8 } } }, // see what's coming: draw to 6, and Focus
  { id: 'mind-break',          name: 'Mind Break',          type: 'psychic', cost: 2, art: '💢', effects: { damage: 18, weaken: 1, sap: 2 }, rarity: 'rare', upgrade: { effects: { damage: 24, weaken: 2 } } }, // it breaks its will: Weak, and Sap for good
  { id: 'dream-world',         name: 'Dream World',         type: 'psychic', cost: 2, art: '🌙', effects: { healEachTurn: 2, drawEachTurn: 1 }, power: true, rarity: 'rare', upgrade: { effects: { healEachTurn: 3 } } }, // it heals and draws every turn
  { id: 'psychic-dominance',   name: 'Psychic Dominance',   type: 'psychic', cost: 2, art: '👁️', effects: { cardDamage: 2 }, power: true, rarity: 'rare', upgrade: { effects: { cardDamage: 3 } } }, // A Thousand Cuts
  { id: 'mind-storm',          name: 'Mind Storm',          type: 'psychic', cost: 'X', art: '🌪️', effects: { damage: 7, perX: { hits: 1 } }, rarity: 'rare', upgrade: { effects: { damage: 10 } } }, // Whirlwind
  { id: 'psychic-overload',    name: 'Psychic Overload',    type: 'psychic', cost: 0, art: '⚡', effects: { focus: 8, energy: 1, draw: 2 }, exhaust: true, rarity: 'rare', upgrade: { effects: { focus: 11 } } }, // Adrenaline
  { id: 'psychic-terrain',     name: 'Psychic Terrain',     type: 'psychic', cost: 3, art: '🌈', effects: { focusKeep: 1 }, power: true, rarity: 'rare', upgrade: { cost: 2 } }, // (Force's rule-changer: Focus stays)
  { id: 'lunar-blessing',      name: 'Lunar Blessing',      type: 'psychic', cost: 2, art: '🌙', effects: { heal: 10, block: 12 }, exhaust: true, rarity: 'rare', upgrade: { effects: { heal: 14, block: 16 } } }, // Bandage Up + Impervious, lite (Barrier)
  { id: 'mind-control',        name: 'Mind Control',        type: 'psychic', cost: 2, art: '🎭', effects: { sap: 3, tempSap: 6 }, exhaust: true, rarity: 'rare', upgrade: { effects: { sap: 4 } } }, // it takes the fight out of it
];

/* Electric (the Safari's duo pool, docs/duo-design.md section 5): Static builds on the enemy until it's Paralyzed and
   loses a move (Vault, as a meter), Overcharge makes PP now and next turn for 3-5 cost bombs and X costs (Defect's Turbo,
   Double Energy, Aggregate), Volt Switch switches you free and pays off on every switch (Watcher's stance dance). Session
   3 built 30 of its 66 pool cards and all 8 evolution cards, session 4 the other 36. */
const ELECTRIC_CARDS = [
  { id: 'thunder-shock',  name: 'Thunder Shock',  type: 'electric', cost: 1, art: '⚡', effects: { damage: 8 }, upgrade: { effects: { damage: 11 } } },   // Strike (8: without Burn or Tide, 7 left Electric's pairs 10-15 points under, 2026-10-19's bot check)
  { id: 'magnet-rise',    name: 'Magnet Rise',    type: 'electric', cost: 1, art: '🧲', effects: { block: 8 }, upgrade: { effects: { block: 11 } } },   // Defend (8, like Flame Wall and Withdraw)
  { id: 'spark',          name: 'Spark',          type: 'electric', cost: 2, art: '✨', effects: { damage: 13, static: 4, vulnerable: 2 }, upgrade: { effects: { damage: 15, static: 6, vulnerable: 3 } } },   // Bash, plus Static
  { id: 'thunder-wave',   name: 'Thunder Wave',   type: 'electric', cost: 1, art: '〰️', effects: { static: 5, weaken: 1 }, upgrade: { effects: { static: 7, weaken: 2 } } },   // Deadly Poison, plus Weak like Will-O-Wisp
  { id: 'nuzzle',         name: 'Nuzzle',         type: 'electric', cost: 1, art: '🐭', effects: { damage: 5, static: 3, ifFull: { energy: 1 } }, upgrade: { effects: { damage: 8, static: 4, ifFull: { energy: 1 } } } },   // Static, and a refund once it will be Paralyzed
  { id: 'eerie-impulse',  name: 'Eerie Impulse',  type: 'electric', cost: 1, art: '📡', effects: { block: 10, static: 3 }, upgrade: { effects: { block: 13, static: 4 } } },   // Iron Wave, Static for the hit: Electric's Flame Body
  { id: 'charge',         name: 'Charge',         type: 'electric', cost: 0, art: '🔋', effects: { energy: 2, addCard: { id: 'sludge', to: 'draw' } }, upgrade: { effects: { energy: 3 } } },   // Turbo
  { id: 'rising-voltage', name: 'Rising Voltage', type: 'electric', cost: 2, art: '📈', effects: { damage: 16 }, growOnPlay: { discount: 1 }, upgrade: { effects: { damage: 20 } } },   // Streamline
  { id: 'volt-switch',    name: 'Volt Switch',    type: 'electric', cost: 1, art: '🔄', effects: { damage: 8, switch: true }, upgrade: { effects: { damage: 11 } } },   // Flurry of Blows
  { id: 'shock-wave',     name: 'Shock Wave',     type: 'electric', cost: 1, art: '💫', effects: { damage: 7, ifSwitched: { energy: 1, draw: 1 } }, upgrade: { effects: { damage: 10 } } },   // Rushdown's payoff, as an attack
  { id: 'discharge',      name: 'Discharge',      type: 'electric', cost: 1, art: '🌩️', effects: { damage: 6, perStatic: 1 }, rarity: 'uncommon', upgrade: { effects: { damage: 9 } } },   // Bane
  { id: 'thunder-fang',   name: 'Thunder Fang',   type: 'electric', cost: 1, art: '🦷', effects: { damage: 8, ifFull: { bonus: 8 } }, rarity: 'uncommon', upgrade: { effects: { damage: 10, ifFull: { bonus: 10 } } } },   // Bane, on a full meter
  { id: 'zing-zap',       name: 'Zing Zap',       type: 'electric', cost: 1, art: '⚡', effects: { damage: 7, static: 3, ifSwitched: { static: 3 } }, rarity: 'uncommon', upgrade: { effects: { damage: 9, static: 4, ifSwitched: { static: 4 } } } },   // Poisoned Stab, a Static / Volt Switch bridge
  { id: 'electric-terrain', name: 'Electric Terrain', type: 'electric', cost: 1, art: '🟨', effects: { staticEachTurn: 2 }, power: true, rarity: 'uncommon', upgrade: { effects: { staticEachTurn: 3 } } },   // Noxious Fumes
  { id: 'lightning-rod',  name: 'Lightning Rod',  type: 'electric', cost: 1, art: '🗼', effects: { paraEnergy: 2 }, power: true, rarity: 'uncommon', upgrade: { cost: 0 } },   // (Static's payoff: PP when it's Paralyzed)
  { id: 'electrify',      name: 'Electrify',      type: 'electric', cost: 1, art: '🔌', effects: { energyMult: 2 }, exhaust: true, rarity: 'uncommon', upgrade: { cost: 0 } },   // Double Energy
  { id: 'magnet-pull',    name: 'Magnet Pull',    type: 'electric', cost: 1, art: '🧲', effects: { energyPer: 4 }, rarity: 'uncommon', upgrade: { effects: { energyPer: 3 } } },   // Aggregate
  { id: 'thunder',        name: 'Thunder',        type: 'electric', cost: 4, art: '🌩️', effects: { damage: 36, static: 8 }, rarity: 'uncommon', upgrade: { effects: { damage: 44, static: 10 } } },   // Meteor Strike-lite
  { id: 'electric-surge', name: 'Electric Surge', type: 'electric', cost: 2, art: '🔆', effects: { energyEachTurn: 1 }, power: true, rarity: 'uncommon', upgrade: { cost: 1 } },   // Fusion: a Plasma a turn
  { id: 'magnetic-flux',  name: 'Magnetic Flux',  type: 'electric', cost: 'X', art: '🧭', effects: { perX: { block: 8 } }, rarity: 'uncommon', upgrade: { effects: { perX: { block: 10 } } } },   // Reinforced Body
  { id: 'wired',          name: 'Wired',          type: 'electric', cost: 1, art: '🔗', effects: { switchBlock: 5 }, power: true, rarity: 'uncommon', upgrade: { effects: { switchBlock: 7 } } },   // Mental Fortress
  { id: 'motor-drive',    name: 'Motor Drive',    type: 'electric', cost: 1, art: '⚙️', effects: { switchDraw: 2 }, power: true, rarity: 'uncommon', upgrade: { cost: 0 } },   // Rushdown
  { id: 'electro-drift',  name: 'Electro Drift',  type: 'electric', cost: 1, art: '🏎️', effects: { damage: 9, ifSwitched: { bonus: 9 } }, rarity: 'uncommon', upgrade: { effects: { damage: 11, ifSwitched: { bonus: 11 } } } },   // Follow-Up, after a switch
  { id: 'overdrive',      name: 'Overdrive',      type: 'electric', cost: 1, art: '🎸', effects: { block: 8, ifSwitched: { energy: 1 } }, rarity: 'uncommon', upgrade: { effects: { block: 11 } } },   // Escape Plan, a Volt Switch / Overcharge bridge
  { id: 'zap-cannon',     name: 'Zap Cannon',     type: 'electric', cost: 3, art: '🔫', effects: { damage: 22, staticMult: 2 }, rarity: 'rare', upgrade: { effects: { damage: 30 } } },   // Bludgeon that doubles the Static (it stops at the cap)
  { id: 'static-field',   name: 'Static Field',   type: 'electric', cost: 2, art: '🌐', effects: { attackStatic: 1 }, power: true, rarity: 'rare', upgrade: { cost: 1 } },   // Envenom
  { id: 'battery',        name: 'Battery',        type: 'electric', cost: 1, art: '🔋', effects: { keepEnergy: 1 }, power: true, rarity: 'rare', upgrade: { cost: 0 } },   // Ice Cream, as a power
  { id: 'gigavolt-havoc', name: 'Gigavolt Havoc', type: 'electric', cost: 5, art: '💥', effects: { damage: 50, nextEnergy: 3 }, exhaust: true, rarity: 'rare', upgrade: { effects: { damage: 64 } } },   // a Z-Move: once a fight
  { id: 'volt-tackle',    name: 'Volt Tackle',    type: 'electric', cost: 2, art: '🐭', effects: { damage: 12, perSwitch: 5 }, rarity: 'rare', upgrade: { effects: { perSwitch: 7 } } },   // Perfected Strike, per switch
  { id: 'plus',           name: 'Plus',           type: 'electric', cost: 2, art: '➕', effects: { switchStrength: 1 }, power: true, rarity: 'rare', upgrade: { cost: 1 } },   // Demon Form, a switch at a time
  // session 4's 36 (docs/duo-design.md section 5, "Electric's second session"): defence-leaning, the first half being attack-heavy
  { id: 'cell-battery',   name: 'Cell Battery',   type: 'electric', cost: 1, art: '🔋', effects: { block: 8, nextEnergy: 1 }, upgrade: { effects: { block: 11 } } },   // Charge Battery
  { id: 'electroweb',     name: 'Electroweb',     type: 'electric', cost: 2, art: '🕸️', effects: { static: 3, block: 10, weaken: 1 }, upgrade: { effects: { static: 4, block: 13, weaken: 2 } } },   // a web that slows it: Weak
  { id: 'ion-deluge',     name: 'Ion Deluge',     type: 'electric', cost: 0, art: '🌧️', effects: { static: 2, ifEnemyAttacks: { static: 2 } }, upgrade: { effects: { static: 3, ifEnemyAttacks: { static: 3 } } } },   // Go for the Eyes
  { id: 'electro-ball',   name: 'Electro Ball',   type: 'electric', cost: 1, art: '🟡', effects: { damage: 5, static: 2, ifSwitched: { draw: 2 } }, upgrade: { effects: { damage: 8, static: 3, ifSwitched: { draw: 2 } } } },   // Pommel Strike with Static, its draw after a Switch
  { id: 'volt-absorb',    name: 'Volt Absorb',    type: 'electric', cost: 1, art: '🪫', effects: { block: 7, ifSwitched: { block: 5 } }, upgrade: { effects: { block: 9, ifSwitched: { block: 7 } } } },   // Empty Body, the other way round
  { id: 'thunderclap',    name: 'Thunderclap',    type: 'electric', cost: 1, art: '👏', effects: { damage: 7, ifSwitched: { block: 6 } }, upgrade: { effects: { damage: 10, ifSwitched: { block: 8 } } } },   // a shield too after a Switch
  { id: 'transistor',     name: 'Transistor',     type: 'electric', cost: 1, art: '📻', effects: { block: 7, draw: 1, ifSwitched: { draw: 1 } }, upgrade: { effects: { block: 10 } } },   // Shrug It Off
  { id: 'live-wire',      name: 'Live Wire',      type: 'electric', cost: 1, art: '〽️', effects: { damage: 6, nextEnergy: 1 }, upgrade: { effects: { damage: 9 } } },   // Sneaky Strike's refund, next turn
  { id: 'capacitor',      name: 'Capacitor',      type: 'electric', cost: 2, art: '🧃', effects: { block: 13 }, growOnRetain: { discount: 1 }, retain: true, upgrade: { effects: { block: 17 } } },   // it charges while kept: costs 1 less each turn it stays
  { id: 'insulate',       name: 'Insulate',       type: 'electric', cost: 1, art: '🧤', effects: { block: 7, ifFull: { block: 7 } }, upgrade: { effects: { block: 10, ifFull: { block: 8 } } } },   // a Defend that holds better once the enemy will be Paralyzed
  { id: 'electromorphosis', name: 'Electromorphosis', type: 'electric', cost: 1, art: '🪼', effects: { thornStatic: 2 }, power: true, rarity: 'uncommon', upgrade: { effects: { thornStatic: 3 } } },   // Static Discharge
  { id: 'faraday-cage',   name: 'Faraday Cage',   type: 'electric', cost: 2, art: '🥅', effects: { block: 10, blockPerStatic: 1 }, rarity: 'uncommon', upgrade: { effects: { block: 13 } } },   // Spirit Shield, on Static
  { id: 'stun-shock',     name: 'Stun Shock',     type: 'electric', cost: 2, art: '😵', effects: { static: 6, weaken: 3 }, exhaust: true, rarity: 'uncommon', upgrade: { effects: { static: 8, weaken: 4 } } },   // Shockwave
  { id: 'thunder-cage',   name: 'Thunder Cage',   type: 'electric', cost: 1, art: '🪤', effects: { static: 3, tempSap: 6 }, exhaust: true, rarity: 'uncommon', upgrade: { effects: { static: 4, tempSap: 8 } } },   // Piercing Wail
  { id: 'plasma-fists',   name: 'Plasma Fists',   type: 'electric', cost: 2, art: '🥊', effects: { damage: 5, hits: 2, static: 3 }, rarity: 'uncommon', upgrade: { effects: { damage: 7, static: 4 } } },   // two charged fists
  { id: 'power-cell',     name: 'Power Cell',     type: 'electric', cost: 2, art: '🔋', effects: { block: 10, energyPer: 8 }, rarity: 'uncommon', upgrade: { effects: { block: 14 } } },   // block, and energy from a full draw pile
  { id: 'surge-protector', name: 'Surge Protector', type: 'electric', cost: 3, art: '🔌', effects: { block: 22, energy: 1 }, rarity: 'uncommon', upgrade: { effects: { block: 28 } } },   // a big shield that hands back a PP
  { id: 'dynamo',         name: 'Dynamo',         type: 'electric', cost: 1, art: '🌀', effects: { energyBlock: 3 }, power: true, rarity: 'uncommon', upgrade: { effects: { energyBlock: 4 } } },   // (Overcharge's own: spare PP as block)
  { id: 'recharge',       name: 'Recharge',       type: 'electric', cost: 1, art: '♻️', effects: { nextEnergy: 2, draw: 1 }, rarity: 'uncommon', upgrade: { effects: { nextEnergy: 3 } } },   // Outmaneuver
  { id: 'polarity-swap',  name: 'Polarity Swap',  type: 'electric', cost: 1, art: '🧲', effects: { block: 5, blockPerSwitch: 2, switch: true }, rarity: 'uncommon', upgrade: { effects: { block: 8 } } },   // Switch, its block growing with every Switch this fight
  { id: 'shock-tactics',  name: 'Shock Tactics',  type: 'electric', cost: 1, art: '🎯', effects: { switchWeak: 1 }, power: true, rarity: 'uncommon', upgrade: { cost: 0 } },   // Wave of the Hand, a switch at a time
  { id: 'electric-relay', name: 'Electric Relay', type: 'electric', cost: 1, art: '📶', effects: { switch: true, draw: 2 }, rarity: 'uncommon', upgrade: { effects: { draw: 3 } } },   // Switch and draw
  { id: 'volt-retreat',   name: 'Volt Retreat',   type: 'electric', cost: 1, art: '🏃', effects: { block: 7, ifEnemyAttacks: { switch: true } }, rarity: 'uncommon', upgrade: { effects: { block: 10 } } },   // Fear No Evil
  { id: 'volt-guard',     name: 'Volt Guard',     type: 'electric', cost: 2, art: '🛡️', effects: { block: 10, blockPerSwitch: 3 }, rarity: 'uncommon', upgrade: { effects: { blockPerSwitch: 4 } } },   // Perfected Strike, as block
  { id: 'galvanize',      name: 'Galvanize',      type: 'electric', cost: 1, art: '🔩', effects: { switchStatic: 3 }, power: true, rarity: 'uncommon', upgrade: { effects: { switchStatic: 4 } } },   // Mental Fortress, Static for block: a Volt Switch / Static bridge
  { id: 'wildbolt-storm', name: 'Wildbolt Storm', type: 'electric', cost: 'X', art: '🌪️', effects: { perX: { static: 4 } }, rarity: 'uncommon', upgrade: { effects: { perX: { static: 5 } } } },   // Malaise: an Overcharge / Static bridge
  { id: 'magnetic-field', name: 'Magnetic Field', type: 'electric', cost: 2, art: '🧭', effects: { blockEachTurn: 3, staticEachTurn: 1 }, power: true, rarity: 'uncommon', upgrade: { effects: { blockEachTurn: 4 } } },   // Metallicize with a trickle of Static
  { id: 'zap-shield',     name: 'Zap Shield',     type: 'electric', cost: 0, art: '🔰', effects: { static: 2, ifSwitched: { block: 6 } }, rarity: 'uncommon', upgrade: { effects: { static: 3, ifSwitched: { block: 8 } } } },   // Static, and a shield after a Switch
  { id: 'static-storm',   name: 'Static Storm',   type: 'electric', cost: 1, art: '⛈️', effects: { staticMult: 2 }, exhaust: true, rarity: 'rare', upgrade: { effects: { staticMult: 3 } } },   // Catalyst
  { id: 'electric-seed',  name: 'Electric Seed',  type: 'electric', cost: 2, art: '🌰', effects: { staticBlock: 1 }, power: true, rarity: 'rare', upgrade: { cost: 1 } },   // (Static's Metallicize, at half since 2026-10-20)
  { id: 'max-lightning',  name: 'Max Lightning',  type: 'electric', cost: 2, art: '🌟', effects: { damage: 4, perStatic: 3 }, retain: true, rarity: 'rare', upgrade: { effects: { perStatic: 4 } } },   // Bane's big brother
  { id: 'hadron-engine',  name: 'Hadron Engine',  type: 'electric', cost: 3, art: '🏭', effects: { energyEachTurn: 1, blockEachTurn: 5 }, power: true, rarity: 'rare', upgrade: { cost: 2 } },   // Fusion and Metallicize in one
  { id: 'ion-barrier',    name: 'Ion Barrier',    type: 'electric', cost: 2, art: '🔷', effects: { block: 24, static: 6 }, exhaust: true, rarity: 'rare', upgrade: { effects: { block: 30, static: 8 } } },   // Impervious that charges the air
  { id: 'stoked-sparksurfer', name: 'Stoked Sparksurfer', type: 'electric', cost: 2, art: '🏄', effects: { damage: 10, static: 6, switch: true }, rarity: 'rare', upgrade: { effects: { damage: 14, static: 8 } } },   // Wallop, Raichu's Z-move: a Volt Switch / Static bridge
  { id: 'minus',          name: 'Minus',          type: 'electric', cost: 2, art: '➖', effects: { switchSap: 1 }, power: true, rarity: 'rare', upgrade: { cost: 1 } },   // Disarm, a switch at a time: Plus's mirror
  { id: 'booster-energy', name: 'Booster Energy', type: 'electric', cost: 0, art: '🧪', effects: { energy: 2, switch: true }, exhaust: true, rarity: 'rare', upgrade: { effects: { energy: 3 } } },   // Adrenaline: a Volt Switch / Overcharge bridge
];

/* Ice (the Safari's duo pool, docs/duo-design.md section 5): Frostbite on the enemy adds to every hit and thaws a turn
   at a time (Lock-On, Envenom's shape), Icicle cards grow every Icicle as they're played (Claw), Hail chips the enemy
   and powers Ice attacks while it lasts (Noxious Fumes, with Watcher's "in a stance" payoffs). Session 5 built 30 of
   its 66 pool cards and all 8 evolution cards, session 6 the other 36. */
const ICE_CARDS = [
  { id: 'powder-snow',    name: 'Powder Snow',    type: 'ice', cost: 1, art: '🌨️', effects: { damage: 8 }, upgrade: { effects: { damage: 11 } } },   // Strike (8, like Thunder Shock)
  { id: 'frost-shield',   name: 'Frost Shield',   type: 'ice', cost: 1, art: '🧊', effects: { block: 8 }, upgrade: { effects: { block: 11 } } },   // Defend
  { id: 'icy-wind',       name: 'Icy Wind',       type: 'ice', cost: 2, art: '🌬️', effects: { damage: 10, frostbite: 4, weaken: 2 }, upgrade: { effects: { damage: 12, frostbite: 5, weaken: 3 } } },   // Bash, Frostbite for its Vulnerable (Weak 2: without it Ice trailed ~15 points, 2026-10-19)
  { id: 'frost-armor',    name: 'Frost Armor',    type: 'ice', cost: 1, art: '🥶', effects: { block: 10, frostbite: 2 }, upgrade: { effects: { block: 13, frostbite: 3 } } },   // Iron Wave (Eerie Impulse's shape)
  { id: 'ice-fang',       name: 'Ice Fang',       type: 'ice', cost: 1, art: '🦷', effects: { damage: 7, frostbite: 2 }, upgrade: { effects: { damage: 9, frostbite: 3 } } },   // Poisoned Stab
  { id: 'ice-shard',      name: 'Ice Shard',      type: 'ice', cost: 0, art: '🔹', effects: { damage: 3 }, icicle: true, upgrade: { effects: { damage: 5 } } },   // Claw
  { id: 'icicle-spear',   name: 'Icicle Spear',   type: 'ice', cost: 1, art: '🍢', effects: { damage: 2, hits: 3 }, icicle: true, upgrade: { effects: { damage: 3 } } },   // Claw, three hits (Sword Boomerang)
  { id: 'ice-spinner',    name: 'Ice Spinner',    type: 'ice', cost: 0, art: '⛸️', effects: { damage: 2, block: 3 }, icicle: true, upgrade: { effects: { damage: 3, block: 4 } } },   // Claw's other half: a 0-cost Iron Wave
  { id: 'hail',           name: 'Hail',           type: 'ice', cost: 1, art: '🌨️', effects: { hail: 4 }, upgrade: { cost: 0 } },   // Noxious Fumes, as a timer
  { id: 'aurora-veil',    name: 'Aurora Veil',    type: 'ice', cost: 1, art: '🌈', effects: { block: 8, ifHail: { block: 6 } }, upgrade: { effects: { block: 11, ifHail: { block: 7 } } } },   // Dodge and Roll
  { id: 'frost-breath',   name: 'Frost Breath',   type: 'ice', cost: 1, art: '😮‍💨', effects: { damage: 6, perFrost: 2 }, rarity: 'uncommon', upgrade: { effects: { damage: 9 } } },   // Bane (Discharge's shape)
  { id: 'ice-beam',       name: 'Ice Beam',       type: 'ice', cost: 2, art: '🔦', effects: { damage: 12, frostbite: 3, draw: 1 }, rarity: 'uncommon', upgrade: { effects: { damage: 16, frostbite: 4 } } },   // Frostbite and a draw (Icy Wind is the Weak one)
  { id: 'freeze-dry',     name: 'Freeze-Dry',     type: 'ice', cost: 1, art: '🧂', effects: { frostbite: 5 }, rarity: 'uncommon', upgrade: { effects: { frostbite: 7 } } },   // Deadly Poison
  { id: 'cold-snap',      name: 'Cold Snap',      type: 'ice', cost: 1, art: '🌡️', effects: { frostEachTurn: 2 }, power: true, rarity: 'uncommon', upgrade: { effects: { frostEachTurn: 3 } } },   // Noxious Fumes
  { id: 'ice-punch',      name: 'Ice Punch',      type: 'ice', cost: 1, art: '👊', effects: { damage: 6, ifFrost: { energy: 1, draw: 1 } }, rarity: 'uncommon', upgrade: { effects: { damage: 9 } } },   // Dropkick
  { id: 'icicle-crash',   name: 'Icicle Crash',   type: 'ice', cost: 2, art: '🗡️', effects: { damage: 12, frostbite: 2 }, icicle: true, rarity: 'uncommon', upgrade: { effects: { damage: 16 } } },   // a falling icicle that freezes
  { id: 'snow-flurry',    name: 'Snow Flurry',    type: 'ice', cost: 1, art: '❄️', effects: { addCard: { id: 'icicle', n: 2 } }, rarity: 'uncommon', upgrade: { effects: { addCard: { id: 'icicle', n: 3 } } } },   // Blade Dance
  { id: 'refrigerate',    name: 'Refrigerate',    type: 'ice', cost: 1, art: '🧊', effects: { zeroBlock: 2 }, power: true, rarity: 'uncommon', upgrade: { effects: { zeroBlock: 3 } } },   // After Image, on 0-costs
  { id: 'blizzard',       name: 'Blizzard',       type: 'ice', cost: 2, art: '🌪️', effects: { damage: 14 }, freeIn: 'hail', rarity: 'uncommon', upgrade: { effects: { damage: 18 } } },   // Carnage, free in the weather
  { id: 'weather-ball',   name: 'Weather Ball',   type: 'ice', cost: 1, art: '🔮', effects: { damage: 8, ifWeather: { bonus: 8 } }, rarity: 'uncommon', upgrade: { effects: { damage: 10, ifWeather: { bonus: 10 } } } },   // (the weather's Bane)
  { id: 'slush-rush',     name: 'Slush Rush',     type: 'ice', cost: 1, art: '🏂', effects: { hailDraw: 1 }, power: true, rarity: 'uncommon', upgrade: { cost: 0 } },   // Tools of the Trade, in Hail
  { id: 'ice-body',       name: 'Ice Body',       type: 'ice', cost: 1, art: '⛄', effects: { hailBlock: 5 }, power: true, rarity: 'uncommon', upgrade: { effects: { hailBlock: 7 } } },   // Metallicize, in Hail
  { id: 'snowscape',      name: 'Snowscape',      type: 'ice', cost: 1, art: '🏔️', effects: { hail: 2, frostbite: 3 }, rarity: 'uncommon', upgrade: { effects: { hail: 3, frostbite: 4 } } },   // a Hail / Frostbite bridge: Noxious Fumes + Deadly Poison
  { id: 'hailstone',      name: 'Hailstone',      type: 'ice', cost: 0, art: '🧊', effects: { damage: 3, ifHail: { draw: 1 } }, icicle: true, rarity: 'uncommon', upgrade: { effects: { damage: 5 } } },   // an Icicle / Hail bridge: Claw with a Pommel in Hail
  { id: 'sheer-cold',     name: 'Sheer Cold',     type: 'ice', cost: 1, art: '🥶', effects: { frostMult: 2 }, exhaust: true, rarity: 'rare', upgrade: { effects: { frostMult: 3 } } },   // Catalyst
  { id: 'permafrost',     name: 'Permafrost',     type: 'ice', cost: 2, art: '🏔️', effects: { frostKeep: 1 }, power: true, rarity: 'rare', upgrade: { cost: 1 } },   // (Frostbite's Wildfire)
  { id: 'glaciate',       name: 'Glaciate',       type: 'ice', cost: 2, art: '🧊', effects: { damage: 10, returnZero: true }, rarity: 'rare', upgrade: { effects: { damage: 14 } } },   // All for One
  { id: 'snow-cloak',     name: 'Snow Cloak',     type: 'ice', cost: 1, art: '🧥', effects: { icicleFrost: 1 }, power: true, rarity: 'rare', upgrade: { cost: 0 } },   // an Icicle / Frostbite bridge: Envenom, on Claws
  { id: 'mountain-gale',  name: 'Mountain Gale',  type: 'ice', cost: 3, art: '🏔️', effects: { damage: 28, hail: 3 }, rarity: 'rare', upgrade: { effects: { damage: 36 } } },   // Bludgeon
  { id: 'ice-age',        name: 'Ice Age',        type: 'ice', cost: 2, art: '🦣', effects: { hailFrost: 3 }, power: true, rarity: 'rare', upgrade: { cost: 1 } },   // a Hail / Frostbite bridge (Hail's payoff)
  // session 6's 36 (docs/duo-design.md section 5, "Ice's second session"): defence-leaning, the first half being attack-heavy
  { id: 'ice-pellet',     name: 'Ice Pellet',     type: 'ice', cost: 0, art: '⚪', effects: { damage: 2, weaken: 1 }, icicle: true, upgrade: { effects: { damage: 4, weaken: 2 } } },   // Neutralize, as a Claw
  { id: 'icicle-guard',   name: 'Icicle Guard',   type: 'ice', cost: 0, art: '🛡️', effects: { block: 4 }, icicle: true, upgrade: { effects: { block: 6 } } },   // Deflect, as an Icicle
  { id: 'freezing-glare', name: 'Freezing Glare', type: 'ice', cost: 1, art: '👀', effects: { frostbite: 3, weaken: 1 }, upgrade: { effects: { frostbite: 4, weaken: 2 } } },   // Neutralize's big brother, Frostbite for its hit
  { id: 'cold-shoulder',  name: 'Cold Shoulder',  type: 'ice', cost: 1, art: '🧊', effects: { block: 7, ifFrost: { block: 4 } }, upgrade: { effects: { block: 9, ifFrost: { block: 5 } } } },   // Defend with Bane's condition
  { id: 'frost-nip',      name: 'Frost Nip',      type: 'ice', cost: 1, art: '🦀', effects: { damage: 5, block: 5, ifFrost: { draw: 1 } }, upgrade: { effects: { damage: 7, block: 7 } } },   // Iron Wave that draws on a frozen enemy
  { id: 'ice-wall',       name: 'Ice Wall',       type: 'ice', cost: 2, art: '🧱', effects: { block: 12, ifFrost: { energy: 1 } }, upgrade: { effects: { block: 16 } } },   // a wall that costs less against a frozen enemy
  { id: 'chilly-reception', name: 'Chilly Reception', type: 'ice', cost: 1, art: '👋', effects: { block: 6, hail: 2 }, upgrade: { effects: { block: 9 } } },   // Deflect and Noxious Fumes
  { id: 'snowdrift',      name: 'Snowdrift',      type: 'ice', cost: 1, art: '🌨️', effects: { block: 6, ifHail: { blockNext: 6 } }, upgrade: { effects: { block: 8, ifHail: { blockNext: 8 } } } },   // Dodge and Roll, in Hail
  { id: 'sleet',          name: 'Sleet',          type: 'ice', cost: 1, art: '🌧️', effects: { damage: 3, hits: 2, ifHail: { block: 5 } }, upgrade: { effects: { damage: 4, ifHail: { block: 7 } } } },   // Twin Strike, with block in Hail
  { id: 'black-ice',      name: 'Black Ice',      type: 'ice', cost: 1, art: '⚫', effects: { damage: 7, ifFrost: { weaken: 2 } }, upgrade: { effects: { damage: 10, ifFrost: { weaken: 3 } } } },   // it slips a frozen enemy up: Weak on Frostbite
  { id: 'ice-scales',     name: 'Ice Scales',     type: 'ice', cost: 1, art: '🦋', effects: { thornFrost: 2 }, power: true, rarity: 'uncommon', upgrade: { effects: { thornFrost: 3 } } },   // Static Discharge
  { id: 'hoarfrost',      name: 'Hoarfrost',      type: 'ice', cost: 1, art: '🌿', effects: { block: 5, blockPerFrost: 2 }, rarity: 'uncommon', upgrade: { effects: { block: 8 } } },   // Spirit Shield, on Frostbite
  { id: 'cold-front',     name: 'Cold Front',     type: 'ice', cost: 1, art: '🗺️', effects: { frostbite: 3, tempSap: 5 }, exhaust: true, rarity: 'uncommon', upgrade: { effects: { frostbite: 4, tempSap: 7 } } },   // Piercing Wail
  { id: 'numbing-cold',   name: 'Numbing Cold',   type: 'ice', cost: 1, art: '🥶', effects: { weaken: 1, ifFrost: { weaken: 1, draw: 1 } }, rarity: 'uncommon', upgrade: { effects: { weaken: 2 } } },   // Blind, with Bane's condition
  { id: 'frost-barrier',  name: 'Frost Barrier',  type: 'ice', cost: 2, art: '🚧', effects: { block: 12, ifFrost: { weaken: 2 } }, rarity: 'uncommon', upgrade: { effects: { block: 16 } } },   // Leg Sweep, on a frostbitten foe
  { id: 'ice-sheet',      name: 'Ice Sheet',      type: 'ice', cost: 0, art: '⬜', effects: { block: 3, draw: 1 }, icicle: true, rarity: 'uncommon', upgrade: { effects: { block: 5 } } },   // Claw with Pommel Strike's draw, as block
  { id: 'igloo',          name: 'Igloo',          type: 'ice', cost: 2, art: '🛖', effects: { block: 8, blockPerIcicle: 2 }, rarity: 'uncommon', upgrade: { effects: { block: 11 } } },   // Perfected Strike as block (Volt Guard's shape)
  { id: 'brinicle',       name: 'Brinicle',       type: 'ice', cost: 1, art: '🧂', effects: { damage: 4, frostbite: 2, block: 4 }, icicle: true, rarity: 'uncommon', upgrade: { effects: { damage: 6, block: 6 } } },   // an Icicle Iron Wave that freezes
  { id: 'shard-storm',    name: 'Shard Storm',    type: 'ice', cost: 1, art: '💠', effects: { block: 6, addCard: { id: 'icicle', n: 1 } }, rarity: 'uncommon', upgrade: { effects: { block: 9 } } },   // Cloak and Dagger
  { id: 'refreeze',       name: 'Refreeze',       type: 'ice', cost: 1, art: '🔄', effects: { block: 7, returnCard: 1 }, rarity: 'uncommon', upgrade: { effects: { block: 10 } } },   // Headbutt, as block
  { id: 'snow-fort',      name: 'Snow Fort',      type: 'ice', cost: 2, art: '🏰', effects: { hail: 2, block: 7, blockNext: 6 }, rarity: 'uncommon', upgrade: { effects: { block: 10, blockNext: 8 } } },   // Hail, and a fort that holds into next turn
  { id: 'whiteout',       name: 'Whiteout',       type: 'ice', cost: 1, art: '🌫️', effects: { weaken: 2, ifHail: { tempSap: 5 } }, rarity: 'uncommon', upgrade: { effects: { weaken: 3, ifHail: { tempSap: 7 } } } },   // Blind, with Piercing Wail in Hail
  { id: 'polar-vortex',   name: 'Polar Vortex',   type: 'ice', cost: 1, art: '🌀', effects: { hailChipBlock: 4 }, power: true, rarity: 'uncommon', upgrade: { effects: { hailChipBlock: 6 } } },   // (Hail's Wired: block on its chip)
  { id: 'diamond-dust',   name: 'Diamond Dust',   type: 'ice', cost: 1, art: '💎', effects: { block: 6, ifHail: { draw: 2 } }, rarity: 'uncommon', upgrade: { effects: { block: 9 } } },   // Sanctity, in Hail
  { id: 'freezing-rain',  name: 'Freezing Rain',  type: 'ice', cost: 2, art: '☔', effects: { hail: 3, blur: true }, rarity: 'uncommon', upgrade: { effects: { hail: 4 } } },   // Blur, with Fumes
  { id: 'icefall',        name: 'Icefall',        type: 'ice', cost: 1, art: '🏔️', effects: { hailIcicle: 1 }, power: true, rarity: 'uncommon', upgrade: { cost: 0 } },   // Infinite Blades, on Hail's chip: an Icicle / Hail bridge
  { id: 'frost-shard',    name: 'Frost Shard',    type: 'ice', cost: 0, art: '🔷', effects: { block: 3, frostbite: 2 }, icicle: true, rarity: 'uncommon', upgrade: { effects: { block: 4, frostbite: 3 } } },   // Claw, as block and Frostbite: an Icicle / Frostbite bridge
  { id: 'thick-fat',      name: 'Thick Fat',      type: 'ice', cost: 1, art: '🦭', effects: { block: 6, sap: 1 }, rarity: 'uncommon', upgrade: { effects: { block: 9 } } },   // Disarm, with a Defend
  { id: 'ice-core',       name: 'Ice Core',       type: 'ice', cost: 2, art: '💙', effects: { frostBlock: 1 }, power: true, rarity: 'rare', upgrade: { cost: 1 } },   // (Frostbite's Metallicize: Electric Seed's twin, at half since 2026-10-20: with Cold Snap it outlived any fight)
  { id: 'flash-freeze',   name: 'Flash Freeze',   type: 'ice', cost: 3, art: '🧊', effects: { frostbite: 4, skipEnemy: true }, exhaust: true, rarity: 'rare', upgrade: { cost: 2 } },   // Vault
  { id: 'shatter',        name: 'Shatter',        type: 'ice', cost: 2, art: '💥', effects: { damage: 4, perFrost: 4, thaw: true }, rarity: 'rare', upgrade: { effects: { perFrost: 5 } } },   // (Frostbite cashed in: Catalyst's other end)
  { id: 'ice-crown',      name: 'Ice Crown',      type: 'ice', cost: 2, art: '👑', effects: { icicleEachTurn: 1 }, power: true, rarity: 'rare', upgrade: { cost: 1 } },   // Infinite Blades
  { id: 'cold-storage',   name: 'Cold Storage',   type: 'ice', cost: 1, art: '🗄️', effects: { retainZero: 1 }, power: true, rarity: 'rare', upgrade: { cost: 0 } },   // Runic Pyramid, on 0-costs
  { id: 'iceberg',        name: 'Iceberg',        type: 'ice', cost: 3, art: '🏔️', effects: { hail: 2, frostbite: 4, block: 20 }, rarity: 'rare', upgrade: { effects: { block: 26 } } },   // Impervious with Hail and Frostbite
  { id: 'endless-winter', name: 'Endless Winter', type: 'ice', cost: 3, art: '☃️', effects: { hail: 3, hailKeep: 1 }, power: true, rarity: 'rare', upgrade: { cost: 2 } },   // (Hail's Permafrost)
  { id: 'absolute-zero',  name: 'Absolute Zero',  type: 'ice', cost: 2, art: '🌡️', effects: { damage: 12, ifHail: { frostbite: 6 } }, rarity: 'rare', upgrade: { effects: { damage: 16, ifHail: { frostbite: 8 } } } },   // Bludgeon's little brother: a Hail / Frostbite bridge
];

/* Fighting (the Safari's duo pool, docs/duo-design.md section 5): Follow-up pays when the last card you played this
   turn was an attack / a skill (Watcher's Follow-Up, Sash Whip, Crush Joints), Counter hits back each enemy attack until
   your next turn and its payoffs read the hits you took last enemy turn (Flame Barrier, Caltrops), Guts adds Sore status
   cards and pays per status card held or exhausted (Wild Strike, Power Through, Evolve). Session 7 built 30 of its 66
   pool cards and all 8 evolution cards, session 8 the other 36. */
const FIGHTING_CARDS = [
  { id: 'rock-smash',     name: 'Rock Smash',     type: 'fighting', cost: 1, art: '🪨', effects: { damage: 8 }, upgrade: { effects: { damage: 11 } } },   // Strike (8, like Thunder Shock)
  { id: 'mat-block',      name: 'Mat Block',      type: 'fighting', cost: 1, art: '🥋', effects: { block: 9 }, upgrade: { effects: { block: 12 } } },   // Defend (9 since 2026-10-20, Fighting's lift)
  { id: 'low-kick',       name: 'Low Kick',       type: 'fighting', cost: 2, art: '🦵', effects: { damage: 10, vulnerable: 2, weaken: 2 }, upgrade: { effects: { damage: 12, vulnerable: 3, weaken: 3 } } },   // Bash (+ Weak 2, as Icy Wind: without it Fighting trailed ~25 points, 2026-10-19)
  { id: 'vital-throw',    name: 'Vital Throw',    type: 'fighting', cost: 1, art: '🤼', effects: { block: 10, counter: 4 }, upgrade: { effects: { block: 13, counter: 6 } } },   // Iron Wave, Counter for its hit (Flame Barrier's shape; Frost Armor's block)
  { id: 'mach-punch',     name: 'Mach Punch',     type: 'fighting', cost: 0, art: '👊', effects: { damage: 4, ifAfterAttack: { draw: 1 } }, upgrade: { effects: { damage: 6 } } },   // Follow-Up, at 0 with a draw for its PP
  { id: 'double-kick',    name: 'Double Kick',    type: 'fighting', cost: 1, art: '🦶', effects: { damage: 4, hits: 2, ifAfterSkill: { hits: 1 } }, upgrade: { effects: { damage: 5 } } },   // Twin Strike + Sash Whip's condition
  { id: 'karate-chop',    name: 'Karate Chop',    type: 'fighting', cost: 1, art: '🤚', effects: { damage: 9, ifAfterSkill: { vulnerable: 1 } }, upgrade: { effects: { damage: 11, ifAfterSkill: { vulnerable: 2 } } } },   // Crush Joints
  { id: 'revenge',        name: 'Revenge',        type: 'fighting', cost: 1, art: '😤', effects: { damage: 6, ifAttacked: { bonus: 6 } }, upgrade: { effects: { damage: 8, ifAttacked: { bonus: 8 } } } },   // (Counter's Bane: a condition doubles it)
  { id: 'close-combat',   name: 'Close Combat',   type: 'fighting', cost: 1, art: '💢', effects: { damage: 14, addCard: { id: 'sore' } }, upgrade: { effects: { damage: 18 } } },   // Wild Strike
  { id: 'no-retreat',     name: 'No Retreat',     type: 'fighting', cost: 1, art: '🚧', effects: { block: 12, addCard: { id: 'sore' } }, upgrade: { effects: { block: 15 } } },   // Power Through (one Sore: it fades)
  { id: 'sky-uppercut',   name: 'Sky Uppercut',   type: 'fighting', cost: 2, art: '🌠', effects: { damage: 14, ifAfterAttack: { vulnerable: 2 } }, rarity: 'uncommon', upgrade: { effects: { damage: 18, ifAfterAttack: { vulnerable: 3 } } } },   // Uppercut
  { id: 'arm-thrust',     name: 'Arm Thrust',     type: 'fighting', cost: 1, art: '🖐️', effects: { damage: 3, hits: 2, ifAfterAttack: { hits: 2 } }, rarity: 'uncommon', upgrade: { effects: { damage: 4 } } },   // Flurry of Blows, in a chain
  { id: 'force-palm',     name: 'Force Palm',     type: 'fighting', cost: 1, art: '✋', effects: { damage: 7, ifAfterSkill: { energy: 1 } }, rarity: 'uncommon', upgrade: { effects: { damage: 10 } } },   // Follow-Up
  { id: 'parry',          name: 'Parry',          type: 'fighting', cost: 1, art: '🤺', effects: { block: 7, ifAfterAttack: { draw: 2 } }, rarity: 'uncommon', upgrade: { effects: { block: 10 } } },   // Sash Whip's other half: a skill after an attack
  { id: 'fighting-spirit', name: 'Fighting Spirit', type: 'fighting', cost: 1, art: '🔥', effects: { mixBlock: 3 }, power: true, rarity: 'uncommon', upgrade: { effects: { mixBlock: 4 } } },   // Mental Fortress
  { id: 'storm-throw',    name: 'Storm Throw',    type: 'fighting', cost: 1, art: '🌀', effects: { damage: 8, ifAfterSkill: { counter: 5 } }, rarity: 'uncommon', upgrade: { effects: { damage: 10, ifAfterSkill: { counter: 7 } } } },   // a Follow-up / Counter bridge: Crush Joints, Counter for its Vulnerable
  { id: 'counter',        name: 'Counter',        type: 'fighting', cost: 1, art: '↩️', effects: { damage: 5, perLost: 2 }, rarity: 'uncommon', upgrade: { effects: { damage: 8 } } },   // (Counter's Perfected Strike, per HP lost)
  { id: 'detect',         name: 'Detect',         type: 'fighting', cost: 0, art: '👁️', effects: { counter: 8 }, exhaust: true, rarity: 'uncommon', upgrade: { effects: { counter: 12 } } },   // Flame Barrier's thorns, free and once
  { id: 'circle-throw',   name: 'Circle Throw',   type: 'fighting', cost: 2, art: '🔄', effects: { block: 12, ifAttacked: { counter: 8 } }, rarity: 'uncommon', upgrade: { effects: { block: 15, ifAttacked: { counter: 10 } } } },   // Counter, if it hit you last turn
  { id: 'counterstance',  name: 'Counterstance',  type: 'fighting', cost: 1, art: '🧘', effects: { counterEachTurn: 3 }, power: true, rarity: 'uncommon', upgrade: { effects: { counterEachTurn: 5 } } },   // Caltrops
  { id: 'superpower',     name: 'Superpower',     type: 'fighting', cost: 2, art: '💪', effects: { damage: 24, addCard: { id: 'sore', n: 2, to: 'draw' } }, rarity: 'uncommon', upgrade: { effects: { damage: 30 } } },   // Reckless Charge, Bludgeon-sized
  { id: 'reversal',       name: 'Reversal',       type: 'fighting', cost: 1, art: '🔃', effects: { damage: 6, perStatusHeld: 6 }, rarity: 'uncommon', upgrade: { effects: { damage: 9, perStatusHeld: 8 } } },   // Perfected Strike, on status cards
  { id: 'steadfast',      name: 'Steadfast',      type: 'fighting', cost: 1, art: '🗿', effects: { statusDraw: 1 }, power: true, rarity: 'uncommon', upgrade: { cost: 0 } },   // Evolve
  { id: 'coaching',       name: 'Coaching',       type: 'fighting', cost: 1, art: '📣', effects: { strength: 2, addCard: { id: 'sore' } }, rarity: 'uncommon', upgrade: { effects: { strength: 3 } } },   // Spot Weakness, paid with a Sore
  { id: 'iron-fist',      name: 'Iron Fist',      type: 'fighting', cost: 2, art: '🦾', effects: { followAlways: 1 }, power: true, rarity: 'rare', upgrade: { cost: 1 } },   // (Follow-up's Barricade)
  { id: 'high-jump-kick', name: 'High Jump Kick', type: 'fighting', cost: 2, art: '🦘', effects: { damage: 20, ifAfterSkill: { bonus: 14 } }, rarity: 'rare', upgrade: { effects: { damage: 26, ifAfterSkill: { bonus: 16 } } } },   // Bludgeon, at 2 after a skill
  { id: 'bide',           name: 'Bide',           type: 'fighting', cost: 1, art: '⏳', effects: { bide: 2 }, rarity: 'rare', upgrade: { cost: 0 } },   // (Counter's own: a delayed hit)
  { id: 'anger-point',    name: 'Anger Point',    type: 'fighting', cost: 2, art: '💥', effects: { hurtStrength: 1 }, power: true, rarity: 'rare', upgrade: { cost: 1 } },   // a Counter / Guts bridge: Rupture, on the enemy's hits
  { id: 'meteor-assault', name: 'Meteor Assault', type: 'fighting', cost: 2, art: '☄️', effects: { damage: 22, perStatusHeld: 4, addCard: { id: 'sore', n: 2 } }, rarity: 'rare', upgrade: { effects: { damage: 28 } } },   // Guts: it rides your status cards, then adds two
  { id: 'defiant',        name: 'Defiant',        type: 'fighting', cost: 1, art: '😠', effects: { statusStrength: 1 }, power: true, rarity: 'rare', upgrade: { cost: 0 } },   // Dark Embrace, as strength
  // session 8's 36 (docs/duo-design.md section 5, "Fighting's second session"): defence-leaning, the first half being attack-heavy
  { id: 'rolling-kick',   name: 'Rolling Kick',   type: 'fighting', cost: 1, art: '🦵', effects: { damage: 6, ifAfterSkill: { weaken: 2 } }, upgrade: { effects: { damage: 9 } } },   // Sash Whip, after a skill
  { id: 'feint',          name: 'Feint',          type: 'fighting', cost: 0, art: '💨', effects: { block: 4, ifAfterAttack: { weaken: 1 } }, upgrade: { effects: { block: 6 } } },   // Deflect with Sash Whip's Weak
  { id: 'low-sweep',      name: 'Low Sweep',      type: 'fighting', cost: 1, art: '🧹', effects: { damage: 5, weaken: 1, ifAfterSkill: { block: 6 } }, upgrade: { effects: { damage: 7, ifAfterSkill: { block: 8 } } } },   // Iron Wave, in a chain
  { id: 'retaliate',      name: 'Retaliate',      type: 'fighting', cost: 1, art: '🛡️', effects: { block: 6, ifAttacked: { block: 6 } }, upgrade: { effects: { block: 8, ifAttacked: { block: 8 } } } },   // Revenge as block (Bane's condition)
  { id: 'endeavor',       name: 'Endeavor',       type: 'fighting', cost: 1, art: '🩹', effects: { block: 4, blockPerLost: 1 }, upgrade: { effects: { block: 7 } } },   // (Counter's Spirit Shield, per HP lost)
  { id: 'vacuum-wave',    name: 'Vacuum Wave',    type: 'fighting', cost: 0, art: '🌬️', effects: { damage: 3, counter: 3 }, upgrade: { effects: { damage: 4, counter: 5 } } },   // a Shiv with Flame Barrier's thorns
  { id: 'wake-up-slap',   name: 'Wake-Up Slap',   type: 'fighting', cost: 1, art: '👋', effects: { damage: 6, ifAttacked: { weaken: 2 } }, upgrade: { effects: { damage: 8, ifAttacked: { weaken: 3 } } } },   // Sucker Punch, on last turn's hit
  { id: 'hammer-arm',     name: 'Hammer Arm',     type: 'fighting', cost: 2, art: '🔨', effects: { damage: 12, weaken: 2, addCard: { id: 'sore' } }, upgrade: { effects: { damage: 15 } } },   // Clothesline, paid with a Sore
  { id: 'grit',           name: 'Grit',           type: 'fighting', cost: 1, art: '😬', effects: { block: 6, blockPerStatusHeld: 3 }, upgrade: { effects: { block: 8, blockPerStatusHeld: 4 } } },   // (Guts' Spirit Shield, on status cards)
  { id: 'shed-skin',      name: 'Shed Skin',      type: 'fighting', cost: 1, art: '🐍', effects: { exhaustHand: 'status', block: 7 }, upgrade: { effects: { block: 10 } } },   // Purity with a Defend
  { id: 'inner-focus',    name: 'Inner Focus',    type: 'fighting', cost: 1, art: '🧠', effects: { followBlock: 3 }, power: true, rarity: 'uncommon', upgrade: { effects: { followBlock: 4 } } },   // Mental Fortress, on Follow-ups
  { id: 'dual-chop',      name: 'Dual Chop',      type: 'fighting', cost: 1, art: '✌️', effects: { damage: 4, hits: 2, ifAfterSkill: { weaken: 1 } }, rarity: 'uncommon', upgrade: { effects: { damage: 5 } } },   // Twin Strike with Sash Whip's Weak
  { id: 'brick-break',    name: 'Brick Break',    type: 'fighting', cost: 1, art: '🧱', effects: { damage: 7, ifAfterAttack: { sap: 1 } }, rarity: 'uncommon', upgrade: { effects: { damage: 10 } } },   // Disarm, in a chain
  { id: 'kata',           name: 'Kata',           type: 'fighting', cost: 1, art: '🥋', effects: { block: 8, ifAfterSkill: { block: 4 } }, rarity: 'uncommon', upgrade: { effects: { block: 10, ifAfterSkill: { block: 5 } } } },   // Defend, chained
  { id: 'jump-kick',      name: 'Jump Kick',      type: 'fighting', cost: 1, art: '🦘', effects: { damage: 9, ifAfterAttack: { blockNext: 6 } }, rarity: 'uncommon', upgrade: { effects: { damage: 12 } } },   // Dodge and Roll on a Strike, in a chain
  { id: 'sidestep',       name: 'Sidestep',       type: 'fighting', cost: 1, art: '↪️', effects: { block: 7, ifAfterAttack: { counter: 5 } }, rarity: 'uncommon', upgrade: { effects: { block: 10, ifAfterAttack: { counter: 7 } } } },   // a Follow-up / Counter bridge: Storm Throw's other half
  { id: 'brace',          name: 'Brace',          type: 'fighting', cost: 1, art: '🧍', effects: { blockNext: 12, ifAfterAttack: { draw: 1 } }, rarity: 'uncommon', upgrade: { effects: { blockNext: 15 } } },   // brace for the next hit: block next turn
  { id: 'justified',      name: 'Justified',      type: 'fighting', cost: 1, art: '⚖️', effects: { counterBlock: 3 }, power: true, rarity: 'uncommon', upgrade: { effects: { counterBlock: 4 } } },   // (Counter's Wired: Flame Barrier pays twice)
  { id: 'payback',        name: 'Payback',        type: 'fighting', cost: 1, art: '🔙', effects: { block: 7, ifAttacked: { weaken: 2 } }, rarity: 'uncommon', upgrade: { effects: { block: 10 } } },   // Leg Sweep-lite, on last turn's hit
  { id: 'arm-lock',       name: 'Arm Lock',       type: 'fighting', cost: 1, art: '🦾', effects: { weaken: 2, counter: 5 }, rarity: 'uncommon', upgrade: { effects: { weaken: 3, counter: 7 } } },   // Blind with Flame Barrier's thorns
  { id: 'guard-stance',   name: 'Guard Stance',   type: 'fighting', cost: 1, art: '🙅', effects: { tempSap: 5, counter: 5 }, rarity: 'uncommon', upgrade: { effects: { tempSap: 7, counter: 7 } } },   // Piercing Wail with thorns
  { id: 'reflex',         name: 'Reflex',         type: 'fighting', cost: 0, art: '⚡', effects: { block: 3, counter: 3, draw: 1 }, rarity: 'uncommon', upgrade: { effects: { block: 5, counter: 5 } } },   // Deflect and Flame Barrier, with a draw
  { id: 'last-stand',     name: 'Last Stand',     type: 'fighting', cost: 1, art: '🏴', effects: { counter: 4, counterPerStatus: 3 }, rarity: 'uncommon', upgrade: { effects: { counter: 6, counterPerStatus: 4 } } },   // a Counter / Guts bridge: Flame Barrier, per status card
  { id: 'vital-spirit',   name: 'Vital Spirit',   type: 'fighting', cost: 1, art: '✊', effects: { statusBlock: 4 }, power: true, rarity: 'uncommon', upgrade: { effects: { statusBlock: 6 } } },   // Feel No Pain, on status cards
  { id: 'iron-will',      name: 'Iron Will',      type: 'fighting', cost: 2, art: '🗿', effects: { block: 14, counterPerStatus: 3 }, rarity: 'uncommon', upgrade: { effects: { block: 18 } } },   // Guts: Counter for each status card held
  { id: 'scrappy',        name: 'Scrappy',        type: 'fighting', cost: 1, art: '🤛', effects: { weaken: 2, block: 5, energy: 1, addCard: { id: 'sore' } }, rarity: 'uncommon', upgrade: { effects: { weaken: 3, block: 7 } } },   // a free Weak and guard, paid in a Sore
  { id: 'grin-and-bear-it', name: 'Grin and Bear It', type: 'fighting', cost: 2, art: '😁', effects: { block: 16, addCard: { id: 'sore', n: 2, to: 'draw' } }, rarity: 'uncommon', upgrade: { effects: { block: 20 } } },   // Power Through
  { id: 'intimidate',     name: 'Stare Down',     type: 'fighting', cost: 1, art: '😠', effects: { weaken: 2, ifAttacked: { sap: 1 } }, rarity: 'uncommon', upgrade: { effects: { weaken: 3 } } },   // Stare Down: a Sap if it hit you last turn
  { id: 'stand-firm',     name: 'Stand Firm',     type: 'fighting', cost: 2, art: '🪨', effects: { counterKeep: 1 }, power: true, rarity: 'rare', upgrade: { cost: 1 } },   // (Counter's Barricade)
  { id: 'final-gambit',   name: 'Final Gambit',   type: 'fighting', cost: 1, art: '🎲', effects: { counterPerLost: 2 }, exhaust: true, rarity: 'rare', upgrade: { cost: 0 } },   // (Counter's own cash-in)
  { id: 'no-guard',       name: 'No Guard',       type: 'fighting', cost: 1, art: '🙌', effects: { followCounter: 3 }, power: true, rarity: 'rare', upgrade: { effects: { followCounter: 5 } } },   // a Follow-up / Counter bridge: Mental Fortress, as thorns
  { id: 'sacred-sword',   name: 'Sacred Sword',   type: 'fighting', cost: 2, art: '🗡️', effects: { damage: 18, ifAfterSkill: { block: 12 } }, rarity: 'rare', upgrade: { effects: { damage: 24, ifAfterSkill: { block: 14 } } } },   // Follow-up: a guard after a skill
  { id: 'minds-eye',      name: 'Mind\'s Eye',    type: 'fighting', cost: 0, art: '👁️‍🗨️', effects: { block: 4, ifAfterAttack: { draw: 2 }, ifAfterSkill: { energy: 1 } }, rarity: 'rare', upgrade: { effects: { block: 6 } } },   // (Follow-up's own: either order pays)
  { id: 'gritted-teeth',  name: 'Gritted Teeth',  type: 'fighting', cost: 1, art: '😣', effects: { statusHeldBlock: 3 }, power: true, rarity: 'rare', upgrade: { effects: { statusHeldBlock: 4 } } },   // (Guts' Metallicize)
  { id: 'second-wind',    name: 'Second Wind',    type: 'fighting', cost: 1, art: '🌬️', effects: { exhaustHand: 'status', blockPerExhausted: 6, draw: 2 }, rarity: 'rare', upgrade: { effects: { blockPerExhausted: 8 } } },   // Second Wind, on status cards
  { id: 'body-press',     name: 'Body Press',     type: 'fighting', cost: 2, art: '🏋️', effects: { block: 12, blockDamage: true }, rarity: 'rare', upgrade: { effects: { block: 16 } } },   // Body Slam with the block first
];

/* Ground (the Safari's duo pool, docs/duo-design.md section 5): Dig cards go underground when played and surface at
   the start of your next turn, doing their Surface part then (Phantasmal Killer's delay, Doppelganger), Fault knocks
   the enemy out at the start of its turn once its HP is at or below it (StS 2's Doom; Alphas and bosses count half), and
   Sandstorm is the Weather engine's second kind: a chip, and +3 on every block a Ground card gives. Session 9 built 30
   of its 66 pool cards and all 8 evolution cards; session 10 the other 36. */
const GROUND_CARDS = [
  { id: 'mud-shot',       name: 'Mud Shot',       type: 'ground', cost: 1, art: '🟤', effects: { damage: 8 }, upgrade: { effects: { damage: 11 } } },   // Strike
  { id: 'sand-veil',      name: 'Sand Veil',      type: 'ground', cost: 1, art: '🏜️', effects: { block: 8 }, upgrade: { effects: { block: 11 } } },   // Defend
  { id: 'bulldoze',       name: 'Bulldoze',       type: 'ground', cost: 2, art: '🚜', effects: { damage: 10, weaken: 2, fault: 5 }, upgrade: { effects: { damage: 12, weaken: 3, fault: 7 } } },   // Bash, Fault for its Vulnerable (+ Weak, as Icy Wind)
  { id: 'sand-attack',    name: 'Sand Attack',    type: 'ground', cost: 1, art: '💨', effects: { block: 10, fault: 3 }, upgrade: { effects: { block: 13, fault: 4 } } },   // Iron Wave (Frost Armor's shape)
  { id: 'dig',            name: 'Dig',            type: 'ground', cost: 1, art: '⛏️', effects: { block: 9, surface: { damage: 12 } }, upgrade: { effects: { block: 11, surface: { damage: 15 } } } },   // Iron Wave over two turns
  { id: 'tunnel',         name: 'Tunnel',         type: 'ground', cost: 0, art: '🕳️', effects: { surface: { damage: 7 } }, upgrade: { effects: { surface: { damage: 10 } } } },   // a free Strike, a turn late (Doppelganger's delay)
  { id: 'mud-bomb',       name: 'Mud Bomb',       type: 'ground', cost: 1, art: '💣', effects: { damage: 6, fault: 5 }, upgrade: { effects: { damage: 8, fault: 7 } } },   // Poisoned Stab
  { id: 'bonemerang',     name: 'Bonemerang',     type: 'ground', cost: 1, art: '🦴', effects: { damage: 4, hits: 2, fault: 3 }, upgrade: { effects: { damage: 5, fault: 4 } } },   // Twin Strike
  { id: 'sandstorm',      name: 'Sandstorm',      type: 'ground', cost: 1, art: '🌪️', effects: { sand: 4 }, upgrade: { cost: 0 } },   // Noxious Fumes, as a timer (Hail's twin)
  { id: 'mud-slap',       name: 'Mud-Slap',       type: 'ground', cost: 1, art: '🫳', effects: { damage: 7, ifSand: { weaken: 2 } }, upgrade: { effects: { damage: 9, ifSand: { weaken: 3 } } } },   // Sucker Punch
  { id: 'drill-run',      name: 'Drill Run',      type: 'ground', cost: 1, art: '🌀', effects: { damage: 5, surface: { damage: 10 } }, rarity: 'uncommon', upgrade: { effects: { damage: 7, surface: { damage: 13 } } } },   // Pummel, split over two turns
  { id: 'earth-power',    name: 'Earth Power',    type: 'ground', cost: 1, art: '🌋', effects: { damage: 6, perUnder: 6 }, rarity: 'uncommon', upgrade: { effects: { damage: 8, perUnder: 8 } } },   // Perfected Strike, per card dug
  { id: 'shore-up',       name: 'Shore Up',       type: 'ground', cost: 1, art: '🏖️', effects: { heal: 4, surface: { block: 8 } }, rarity: 'uncommon', upgrade: { effects: { heal: 6, surface: { block: 10 } } } },   // heal now, block next turn
  { id: 'arena-trap',     name: 'Arena Trap',     type: 'ground', cost: 1, art: '🐜', effects: { surfaceDraw: 1 }, power: true, rarity: 'uncommon', upgrade: { cost: 0 } },   // (Dig's Evolve)
  { id: 'spikes',         name: 'Spikes',         type: 'ground', cost: 1, art: '📌', effects: { block: 5, surface: { fault: 8 } }, rarity: 'uncommon', upgrade: { effects: { block: 7, surface: { fault: 11 } } } },   // a Dig / Fault bridge: Caltrops, laid underground
  { id: 'sinkhole',       name: 'Sinkhole',       type: 'ground', cost: 1, art: '🫙', effects: { surface: { damage: 10, sand: 2 } }, rarity: 'uncommon', upgrade: { effects: { surface: { damage: 14, sand: 3 } } } },   // a Dig / Sandstorm bridge: a delayed Noxious Fumes with a hit
  { id: 'earthquake',     name: 'Earthquake',     type: 'ground', cost: 2, art: '🫨', effects: { damage: 11, fault: 5, ifSand: { fault: 5 } }, rarity: 'uncommon', upgrade: { effects: { damage: 15, fault: 6, ifSand: { fault: 6 } } } },   // it cracks deeper in a Sandstorm
  { id: 'mud-sport',      name: 'Mud Sport',      type: 'ground', cost: 1, art: '🤽', effects: { fault: 8 }, rarity: 'uncommon', upgrade: { effects: { fault: 11 } } },   // Deadly Poison
  { id: 'stomping-tantrum', name: 'Stomping Tantrum', type: 'ground', cost: 1, art: '🦶', effects: { damage: 6, perFault: 1 }, rarity: 'uncommon', upgrade: { effects: { damage: 8 } } },   // Bane, per Fault
  { id: 'quicksand',      name: 'Quicksand',      type: 'ground', cost: 1, art: '⏬', effects: { faultEachTurn: 3 }, power: true, rarity: 'uncommon', upgrade: { effects: { faultEachTurn: 4 } } },   // Noxious Fumes
  { id: 'dust-devil',     name: 'Dust Devil',     type: 'ground', cost: 1, art: '🌫️', effects: { sand: 2, fault: 5 }, rarity: 'uncommon', upgrade: { effects: { sand: 3, fault: 7 } } },   // a Sandstorm / Fault bridge: Noxious Fumes + Deadly Poison (Snowscape's shape)
  { id: 'lands-wrath',    name: 'Land\'s Wrath',  type: 'ground', cost: 2, art: '🗻', effects: { damage: 12, ifSand: { bonus: 8 } }, rarity: 'uncommon', upgrade: { effects: { damage: 15, ifSand: { bonus: 10 } } } },   // Carnage, in the weather
  { id: 'sand-rush',      name: 'Sand Rush',      type: 'ground', cost: 1, art: '🏃', effects: { draw: 2, ifSand: { energy: 1 } }, rarity: 'uncommon', upgrade: { effects: { draw: 3 } } },   // Adrenaline, in the weather
  { id: 'sand-force',     name: 'Sand Force',     type: 'ground', cost: 1, art: '💪', effects: { sandAttack: 2 }, power: true, rarity: 'uncommon', upgrade: { effects: { sandAttack: 3 } } },   // Inflame, in the weather
  { id: 'fissure',        name: 'Fissure',        type: 'ground', cost: 2, art: '⚡', effects: { fault: 20 }, exhaust: true, rarity: 'rare', upgrade: { effects: { fault: 28 } } },   // (Fault's Catalyst: one big stack)
  { id: 'precipice-blades', name: 'Precipice Blades', type: 'ground', cost: 2, art: '🗡️', effects: { damage: 10, faultMult: 2 }, rarity: 'rare', upgrade: { effects: { damage: 14 } } },   // Catalyst, with a hit
  { id: 'landslide',      name: 'Landslide',      type: 'ground', cost: 2, art: '🏔️', effects: { fault: 8, surface: { damage: 24 } }, rarity: 'rare', upgrade: { effects: { fault: 10, surface: { damage: 32 } } } },   // Bludgeon, a turn late, its Fault now
  { id: 'excavate',       name: 'Excavate',       type: 'ground', cost: 1, art: '🪏', effects: { surfaceDamage: 7 }, power: true, rarity: 'rare', upgrade: { effects: { surfaceDamage: 10 } } },   // (Dig's Thousand Cuts)
  { id: 'sand-stream',    name: 'Sand Stream',    type: 'ground', cost: 2, art: '⏳', effects: { sandEachTurn: 1 }, power: true, rarity: 'rare', upgrade: { cost: 1 } },   // (Sandstorm's Wraith Form, kept up)
  { id: 'desert-spirit',  name: 'Desert Spirit',  type: 'ground', cost: 2, art: '🐉', effects: { sandFault: 4 }, power: true, rarity: 'rare', upgrade: { cost: 1 } },   // a Sandstorm / Fault bridge: Ice Age's twin
  // session 10's 36 (docs/duo-design.md section 5, "Ground's second session"): defence-leaning, the first half being hits and Fault
  { id: 'trench',         name: 'Trench',         type: 'ground', cost: 1, art: '🪖', effects: { block: 6, blockPerUnder: 3 }, upgrade: { effects: { block: 8, blockPerUnder: 4 } } },   // (Dig's Spirit Shield, per card dug)
  { id: 'bone-club',      name: 'Bone Club',      type: 'ground', cost: 1, art: '🦴', effects: { damage: 7, surface: { block: 7 } }, upgrade: { effects: { damage: 9, surface: { block: 9 } } } },   // Iron Wave over two turns, the other way round
  { id: 'hunker-down',    name: 'Hunker Down',    type: 'ground', cost: 0, art: '🫣', effects: { block: 2, surface: { block: 4 } }, upgrade: { effects: { block: 3, surface: { block: 6 } } } },   // Deflect, split over two turns
  { id: 'sand-tomb',      name: 'Sand Tomb',      type: 'ground', cost: 1, art: '⚱️', effects: { weaken: 2, fault: 4 }, upgrade: { effects: { weaken: 3, fault: 5 } } },   // Leg Sweep-lite, with Fault for its block
  { id: 'earth-wall',     name: 'Earth Wall',     type: 'ground', cost: 1, art: '🧱', effects: { block: 8, ifFault: { block: 4 } }, upgrade: { effects: { block: 10, ifFault: { block: 5 } } } },   // Defend, on a condition
  { id: 'tremor',         name: 'Tremor',         type: 'ground', cost: 1, art: '〽️', effects: { weaken: 1, block: 3, blockPerFault: 1 }, upgrade: { effects: { weaken: 2, block: 5 } } },   // Weak, and a shield from the cracks
  { id: 'dune-wall',      name: 'Dune Wall',      type: 'ground', cost: 1, art: '🏝️', effects: { block: 5, ifSand: { block: 5 } }, upgrade: { effects: { block: 7, ifSand: { block: 6 } } } },   // Defend, in the weather
  { id: 'sand-blast',     name: 'Sand Blast',     type: 'ground', cost: 1, art: '💥', effects: { damage: 7, ifSand: { block: 7 } }, upgrade: { effects: { damage: 9, ifSand: { block: 9 } } } },   // Iron Wave, in the weather
  { id: 'sand-cloak',     name: 'Sand Cloak',     type: 'ground', cost: 1, art: '🧥', effects: { block: 5, sand: 2 }, upgrade: { effects: { block: 7, sand: 3 } } },   // Defend with Noxious Fumes' timer (Snowscape's shape)
  { id: 'embankment',     name: 'Embankment',     type: 'ground', cost: 2, art: '⛰️', effects: { sap: 1, block: 11, ifFault: { block: 5 } }, upgrade: { effects: { block: 14, ifFault: { block: 6 } } } },   // a wall that holds better against a cracked enemy
  { id: 'foxhole',        name: 'Foxhole',        type: 'ground', cost: 1, art: '🦊', effects: { digBlock: 3 }, power: true, rarity: 'uncommon', upgrade: { effects: { digBlock: 4 } } },   // (Dig's Feel No Pain)
  { id: 'dig-in',         name: 'Dig In',         type: 'ground', cost: 1, art: '🪣', effects: { block: 10, surface: { draw: 2 } }, rarity: 'uncommon', upgrade: { effects: { block: 13, surface: { draw: 2 } } } },   // Shrug It Off, its draw a turn late
  { id: 'lie-in-wait',    name: 'Lie in Wait',    type: 'ground', cost: 1, art: '👀', effects: { block: 6, surface: { block: 6, weaken: 2 } }, rarity: 'uncommon', upgrade: { effects: { block: 8, surface: { block: 8, weaken: 2 } } } },   // Dodge and Roll with Leg Sweep's Weak
  { id: 'cave-in',        name: 'Cave In',        type: 'ground', cost: 2, art: '🪨', effects: { surface: { damage: 12, block: 12 } }, rarity: 'uncommon', upgrade: { effects: { surface: { damage: 16, block: 15 } } } },   // it all comes down next turn: damage and block together
  { id: 'hibernate',      name: 'Hibernate',      type: 'ground', cost: 1, art: '💤', effects: { surface: { block: 10, heal: 4 } }, rarity: 'uncommon', upgrade: { effects: { surface: { block: 13, heal: 5 } } } },   // it sleeps it off: block and a heal next turn
  { id: 'tectonics',      name: 'Tectonics',      type: 'ground', cost: 1, art: '🗺️', effects: { faultBlock: 3 }, power: true, rarity: 'uncommon', upgrade: { effects: { faultBlock: 4 } } },   // (Fault's Feel No Pain)
  { id: 'ground-lock',    name: 'Ground Lock',    type: 'ground', cost: 1, art: '🔒', effects: { sap: 1, fault: 5 }, rarity: 'uncommon', upgrade: { effects: { fault: 7 } } },   // Disarm with Deadly Poison
  { id: 'rubble-wall',    name: 'Rubble Wall',    type: 'ground', cost: 2, art: '🏚️', effects: { block: 8, blockPerFault: 1 }, rarity: 'uncommon', upgrade: { effects: { block: 11 } } },   // (Fault's Spirit Shield)
  { id: 'rumble',         name: 'Rumble',         type: 'ground', cost: 1, art: '📳', effects: { block: 7, ifFault: { weaken: 2 } }, rarity: 'uncommon', upgrade: { effects: { block: 10 } } },   // Leg Sweep-lite, on a condition
  { id: 'aftershock',     name: 'Aftershock',     type: 'ground', cost: 0, art: '📉', effects: { fault: 3, draw: 1 }, rarity: 'uncommon', upgrade: { effects: { fault: 5 } } },   // Deadly Poison-lite with a draw (a 0-cost Bouncing Flask)
  { id: 'sand-screen',    name: 'Sand Screen',    type: 'ground', cost: 1, art: '🪟', effects: { sandChipBlock: 4 }, power: true, rarity: 'uncommon', upgrade: { effects: { sandChipBlock: 6 } } },   // (Polar Vortex's twin)
  { id: 'haboob',         name: 'Haboob',         type: 'ground', cost: 2, art: '🌫️', effects: { sand: 3, weaken: 2, block: 8 }, rarity: 'uncommon', upgrade: { effects: { block: 11 } } },   // a blinding dust storm: Weak
  { id: 'dust-cloud',     name: 'Dust Cloud',     type: 'ground', cost: 1, art: '☁️', effects: { block: 4, weaken: 1, ifSand: { weaken: 2 } }, rarity: 'uncommon', upgrade: { effects: { block: 6 } } },   // Leg Sweep-lite, in the weather
  { id: 'desert-mirage',  name: 'Desert Mirage',  type: 'ground', cost: 1, art: '🌅', effects: { block: 6, ifSand: { draw: 2 } }, rarity: 'uncommon', upgrade: { effects: { block: 9 } } },   // Backflip, in the weather
  { id: 'scour',          name: 'Scour',          type: 'ground', cost: 1, art: '🧽', effects: { damage: 6, ifSand: { sap: 1 } }, rarity: 'uncommon', upgrade: { effects: { damage: 9 } } },   // Disarm on a Strike, in the weather
  { id: 'quagmire',       name: 'Quagmire',       type: 'ground', cost: 1, art: '🫠', effects: { block: 6, surface: { weaken: 2, fault: 4 } }, rarity: 'uncommon', upgrade: { effects: { block: 8, surface: { weaken: 2, fault: 6 } } } },   // a Dig / Fault bridge: Spikes' defensive twin
  { id: 'antlion-pit',    name: 'Antlion Pit',    type: 'ground', cost: 1, art: '🐜', effects: { sand: 1, surface: { block: 10 } }, rarity: 'uncommon', upgrade: { effects: { surface: { block: 13 } } } },   // a Dig / Sandstorm bridge: Sinkhole's defensive twin
  { id: 'mud-armor',      name: 'Mud Armor',      type: 'ground', cost: 1, art: '🦺', effects: { block: 7, ifSand: { blockNext: 7 } }, rarity: 'uncommon', upgrade: { effects: { block: 10, ifSand: { blockNext: 8 } } } },   // mud that holds into next turn in a Sandstorm
  { id: 'endless-sands',  name: 'Endless Sands',  type: 'ground', cost: 3, art: '♾️', effects: { sand: 3, sandKeep: 1 }, power: true, rarity: 'rare', upgrade: { cost: 2 } },   // (Endless Winter's twin)
  { id: 'bunker',         name: 'Bunker',         type: 'ground', cost: 1, art: '🏯', effects: { block: 5, blockPerUnder: 4, surface: { block: 6 } }, rarity: 'rare', upgrade: { effects: { block: 7, blockPerUnder: 5, surface: { block: 8 } } } },   // block that grows with the pit, and more as it surfaces
  { id: 'groundswell',    name: 'Groundswell',    type: 'ground', cost: 1, art: '🌊', effects: { block: 8, blockFault: true }, rarity: 'rare', upgrade: { effects: { block: 11 } } },   // Body Press, as Fault
  { id: 'chasm',          name: 'Chasm',          type: 'ground', cost: 1, art: '🕳️', effects: { weaken: 2, faultMult: 2 }, exhaust: true, rarity: 'rare', upgrade: { exhaust: false } },   // Catalyst, with a Weak
  { id: 'desert-fortress', name: 'Desert Fortress', type: 'ground', cost: 2, art: '🏰', effects: { sand: 2, block: 14, blur: 1 }, rarity: 'rare', upgrade: { effects: { block: 18 } } },   // a fort that stands a second turn
  { id: 'blinding-sand',  name: 'Blinding Sand',  type: 'ground', cost: 1, art: '😵', effects: { sandWeak: 1 }, power: true, rarity: 'rare', upgrade: { cost: 0 } },   // (Sandstorm's own: Weak kept up)
  { id: 'stalagmites',    name: 'Stalagmites',    type: 'ground', cost: 2, art: '🦷', effects: { block: 10, surface: { damage: 10, fault: 10 } }, rarity: 'rare', upgrade: { effects: { block: 13, surface: { damage: 13, fault: 14 } } } },   // Spikes that stab on the way up
  { id: 'solid-rock',     name: 'Solid Rock',     type: 'ground', cost: 2, art: '🗿', effects: { block: 10, sap: 2 }, exhaust: true, rarity: 'rare', upgrade: { effects: { block: 14 } } },   // Disarm with a Defend+, once
];

/* Flying (the Safari's duo pool, docs/duo-design.md section 5): Evasion halves the enemy's next hits, one stack a hit
   (Blur and Wraith Form, softened), Tailwind draws 1 more card at the start of each of your next turns (Tools of the
   Trade, as a timer), and Unburden pays off when the card is the last in your hand (FTL, Finisher, Grand Finale).
   Session 11 built 30 of its 66 pool cards and all 8 evolution cards; session 12 the other 36. */
const FLYING_CARDS = [
  { id: 'gust',           name: 'Gust',           type: 'flying', cost: 1, art: '🌬️', effects: { damage: 8 }, upgrade: { effects: { damage: 11 } } },   // Strike
  { id: 'feather-guard',  name: 'Feather Guard',  type: 'flying', cost: 1, art: '🪶', effects: { block: 8 }, upgrade: { effects: { block: 11 } } },   // Defend
  { id: 'wing-attack',    name: 'Wing Attack',    type: 'flying', cost: 2, art: '🦅', effects: { damage: 9, vulnerable: 2, ifEmpty: { draw: 1 } }, upgrade: { effects: { damage: 11, vulnerable: 3, ifEmpty: { draw: 1 } } } },   // Bash that draws as your last card (Unburden)
  { id: 'aerial-ace',     name: 'Aerial Ace',     type: 'flying', cost: 1, art: '✈️', effects: { damage: 6, evasion: 1 }, upgrade: { effects: { damage: 9 } } },   // Iron Wave, Evasion for its block
  { id: 'feather-dance',  name: 'Feather Dance',  type: 'flying', cost: 1, art: '💃', effects: { weaken: 2, evasion: 1 }, upgrade: { effects: { weaken: 3, evasion: 2 } } },   // Leg Sweep-lite
  { id: 'air-slash',      name: 'Air Slash',      type: 'flying', cost: 1, art: '🌀', effects: { damage: 7, ifEvasion: { bonus: 6 } }, upgrade: { effects: { damage: 9, ifEvasion: { bonus: 8 } } } },   // Sucker Punch
  { id: 'tailwind-gust',  name: 'Tailwind',       type: 'flying', cost: 1, art: '🍃', effects: { tailwind: 3 }, upgrade: { cost: 0 } },   // Tools of the Trade, as a timer
  { id: 'twister',        name: 'Twister',        type: 'flying', cost: 1, art: '🌪️', effects: { damage: 4, hits: 2, ifTailwind: { hits: 1 } }, upgrade: { effects: { damage: 5 } } },   // Twin Strike
  { id: 'peck',           name: 'Peck',           type: 'flying', cost: 0, art: '🐦', effects: { damage: 4, ifEmpty: { draw: 1 } }, upgrade: { effects: { damage: 6 } } },   // Flash of Steel
  { id: 'acrobatics',     name: 'Acrobatics',     type: 'flying', cost: 1, art: '🤸', effects: { damage: 7, ifEmpty: { bonus: 7 } }, upgrade: { effects: { damage: 9, ifEmpty: { bonus: 9 } } } },   // Finisher-lite, on the last card
  { id: 'fly',            name: 'Fly',            type: 'flying', cost: 2, art: '🕊️', effects: { damage: 8, perEvasion: 4, evasion: 1 }, rarity: 'uncommon', upgrade: { effects: { damage: 11, perEvasion: 5 } } },   // it strikes from above: stronger with Evasion
  { id: 'gale',           name: 'Gale',           type: 'flying', cost: 1, art: '💨', effects: { evadeDamage: 6 }, power: true, rarity: 'uncommon', upgrade: { effects: { evadeDamage: 9 } } },   // Caltrops
  { id: 'sky-drop',       name: 'Sky Drop',       type: 'flying', cost: 1, art: '🪂', effects: { damage: 6, perEvasion: 4 }, rarity: 'uncommon', upgrade: { effects: { damage: 8, perEvasion: 5 } } },   // Bane, per stack
  { id: 'roost',          name: 'Roost',          type: 'flying', cost: 1, art: '🪹', effects: { heal: 6, evasion: 1 }, exhaust: true, rarity: 'uncommon', upgrade: { effects: { heal: 9 } } },   // Bandage Up
  { id: 'hurricane',      name: 'Hurricane',      type: 'flying', cost: 2, art: '🌀', effects: { damage: 5, hits: 3, perTailwind: 2 }, rarity: 'uncommon', upgrade: { effects: { damage: 7 } } },   // three gusts, each stronger for each turn of Tailwind left
  { id: 'wind-rider',     name: 'Wind Rider',     type: 'flying', cost: 1, art: '🏄', effects: { tailwindDamage: 6 }, power: true, rarity: 'uncommon', upgrade: { effects: { tailwindDamage: 9 } } },   // (Tailwind's Thousand Cuts)
  { id: 'drill-peck',     name: 'Drill Peck',     type: 'flying', cost: 1, art: '🌀', effects: { damage: 9, ifTailwind: { bonus: 5 } }, rarity: 'uncommon', upgrade: { effects: { damage: 12, ifTailwind: { bonus: 6 } } } },   // Carnage-lite, in the wind
  { id: 'pluck',          name: 'Pluck',          type: 'flying', cost: 0, art: '🍒', effects: { damage: 4, draw: 1, ifEmpty: { bonus: 4 } }, rarity: 'uncommon', upgrade: { effects: { damage: 6, ifEmpty: { bonus: 6 } } } },   // Flash of Steel with a payoff
  { id: 'feather-light',  name: 'Feather Light',  type: 'flying', cost: 1, art: '🎈', effects: { emptyDraw: 2 }, power: true, rarity: 'uncommon', upgrade: { cost: 0 } },   // (Unburden's Evolve)
  { id: 'dual-wingbeat',  name: 'Dual Wingbeat',  type: 'flying', cost: 1, art: '🪽', effects: { damage: 5, hits: 2, ifEmpty: { hits: 2 } }, rarity: 'uncommon', upgrade: { effects: { damage: 6 } } },   // Twin Strike, doubled on the last card
  { id: 'glide',          name: 'Glide',          type: 'flying', cost: 1, art: '🛩️', effects: { block: 7, ifEmpty: { block: 7 } }, rarity: 'uncommon', upgrade: { effects: { block: 10, ifEmpty: { block: 10 } } } },   // Defend, doubled on the last card
  { id: 'bounce',         name: 'Bounce',         type: 'flying', cost: 0, art: '🦘', effects: { evasion: 1, ifEmpty: { draw: 2 } }, rarity: 'uncommon', upgrade: { effects: { ifEmpty: { draw: 3 } } } },   // an Evasion / Unburden bridge: Finesse, with Evasion for its block
  { id: 'whirlwind',      name: 'Whirlwind',      type: 'flying', cost: 1, art: '🌫️', effects: { tailwind: 2, evasion: 1 }, rarity: 'uncommon', upgrade: { effects: { tailwind: 3, evasion: 2 } } },   // an Evasion / Tailwind bridge: Tools of the Trade + Blur
  { id: 'updraft',        name: 'Updraft',        type: 'flying', cost: 0, art: '🎐', effects: { tailwind: 1, ifEmpty: { draw: 2 } }, rarity: 'uncommon', upgrade: { effects: { tailwind: 2 } } },   // a Tailwind / Unburden bridge: Deep Breath-lite
  { id: 'sky-attack',     name: 'Sky Attack',     type: 'flying', cost: 2, art: '☄️', effects: { damage: 24 }, freeIn: 'tailwind', rarity: 'rare', upgrade: { effects: { damage: 30 } } },   // Carnage, free in the wind (Blizzard's shape)
  { id: 'aeroblast',      name: 'Aeroblast',      type: 'flying', cost: 2, art: '🎯', effects: { damage: 10, perTailwind: 5 }, rarity: 'rare', upgrade: { effects: { damage: 14, perTailwind: 6 } } },   // Perfected Strike, per turn of wind
  { id: 'wind-wall',      name: 'Wind Wall',      type: 'flying', cost: 2, art: '🧱', effects: { evasionEachTurn: 1 }, power: true, rarity: 'rare', upgrade: { cost: 1 } },   // Wraith Form, softened and kept
  { id: 'brave-bird',     name: 'Brave Bird',     type: 'flying', cost: 2, art: '🔥', effects: { selfDamage: 4, damage: 26, ifEmpty: { energy: 2 } }, rarity: 'rare', upgrade: { effects: { damage: 33 } } },   // Reckless, refunded as your last card (Flare Blitz is the 1-cost recoil)
  { id: 'beak-blast',     name: 'Beak Blast',     type: 'flying', cost: 1, art: '💥', effects: { damage: 12, ifEmpty: { bonus: 12, vulnerable: 2 } }, rarity: 'rare', upgrade: { effects: { damage: 15, ifEmpty: { bonus: 15, vulnerable: 2 } } } },   // (Unburden's Bludgeon)
  { id: 'wind-dancer',    name: 'Wind Dancer',    type: 'flying', cost: 1, art: '🩰', effects: { tailwindEvasion: 1 }, power: true, rarity: 'rare', upgrade: { cost: 0 } },   // an Evasion / Tailwind bridge: Tailwind's Wraith Form
  // session 12's 36 (docs/duo-design.md section 5, "Flying's second session"): defence-leaning, the first half being hits and draw
  { id: 'tangled-feet',   name: 'Tangled Feet',   type: 'flying', cost: 1, art: '🦩', effects: { block: 5, evasion: 1 }, upgrade: { effects: { block: 8 } } },   // Blur, Evasion for its kept block
  { id: 'plumage',        name: 'Plumage',        type: 'flying', cost: 1, art: '🦚', effects: { block: 5, blockPerEvasion: 3 }, upgrade: { effects: { block: 7, blockPerEvasion: 4 } } },   // (Evasion's Spirit Shield)
  { id: 'cloud-cover',    name: 'Cloud Cover',    type: 'flying', cost: 1, art: '☁️', effects: { block: 8, ifEvasion: { block: 4 } }, upgrade: { effects: { block: 10, ifEvasion: { block: 5 } } } },   // Defend, on a condition
  { id: 'crosswind',      name: 'Crosswind',      type: 'flying', cost: 1, art: '🎏', effects: { block: 6, tailwind: 1 }, upgrade: { effects: { block: 8, tailwind: 2 } } },   // Defend with Tools of the Trade's timer
  { id: 'slipstream',     name: 'Slipstream',     type: 'flying', cost: 1, art: '〰️', effects: { block: 5, ifTailwind: { block: 5 } }, upgrade: { effects: { block: 7, ifTailwind: { block: 6 } } } },   // Defend, in the wind
  { id: 'thermal',        name: 'Thermal',        type: 'flying', cost: 1, art: '♨️', effects: { block: 5, blockPerTailwind: 2 }, upgrade: { effects: { block: 7, blockPerTailwind: 3 } } },   // (Tailwind's Spirit Shield)
  { id: 'preen',          name: 'Preen',          type: 'flying', cost: 0, art: '🪮', effects: { heal: 2, ifEmpty: { block: 5 } }, upgrade: { effects: { heal: 3, ifEmpty: { block: 7 } } } },   // a heal, and block as the last card
  { id: 'perch',          name: 'Perch',          type: 'flying', cost: 1, art: '🪵', effects: { block: 6, ifEmpty: { weaken: 2 } }, upgrade: { effects: { block: 9 } } },   // Defend with Leg Sweep's Weak on the last card
  { id: 'floaty-fall',    name: 'Floaty Fall',    type: 'flying', cost: 1, art: '🪁', effects: { damage: 5, block: 5, ifEmpty: { draw: 1 } }, upgrade: { effects: { damage: 7, block: 7 } } },   // Iron Wave, with a draw on the last card
  { id: 'defog',          name: 'Defog',          type: 'flying', cost: 2, art: '🌁', effects: { exhaustHand: 'status', weaken: 2, block: 10 }, upgrade: { effects: { block: 13 } } },   // it clears the air: status cards out
  { id: 'big-pecks',      name: 'Big Pecks',      type: 'flying', cost: 1, art: '🐤', effects: { evasionBlock: 3 }, power: true, rarity: 'uncommon', upgrade: { effects: { evasionBlock: 4 } } },   // (Evasion's Feel No Pain)
  { id: 'gale-wings',     name: 'Gale Wings',     type: 'flying', cost: 1, art: '🌬️', effects: { evadeWeak: 1 }, power: true, rarity: 'uncommon', upgrade: { cost: 0 } },   // (Blinding Sand's twin)
  { id: 'hover',          name: 'Hover',          type: 'flying', cost: 1, art: '🛸', effects: { evasion: 1, sap: 1 }, rarity: 'uncommon', upgrade: { effects: { evasion: 2 } } },   // Disarm, with Blur's Evasion
  { id: 'down-feathers',  name: 'Down Feathers',  type: 'flying', cost: 2, art: '🛏️', effects: { evasion: 1, sap: 1, block: 10 }, rarity: 'uncommon', upgrade: { effects: { block: 13 } } },   // it lowers its attack: a Sap
  { id: 'mirror-move',    name: 'Mirror Move',    type: 'flying', cost: 1, art: '🪞', effects: { block: 6, ifEvasion: { weaken: 2 } }, rarity: 'uncommon', upgrade: { effects: { block: 9 } } },   // Leg Sweep-lite, on a condition
  { id: 'jet-stream',     name: 'Jet Stream',     type: 'flying', cost: 1, art: '🛫', effects: { tailwindBlock: 4 }, power: true, rarity: 'uncommon', upgrade: { effects: { tailwindBlock: 6 } } },   // Metallicize, in the wind
  { id: 'wind-power',     name: 'Wind Power',     type: 'flying', cost: 1, art: '🌀', effects: { block: 7, ifTailwind: { draw: 1 } }, rarity: 'uncommon', upgrade: { effects: { block: 10 } } },   // Shrug It Off, in the wind
  { id: 'air-lock',       name: 'Air Lock',       type: 'flying', cost: 1, art: '🔐', effects: { weaken: 2, tailwind: 1 }, rarity: 'uncommon', upgrade: { effects: { weaken: 3 } } },   // Leg Sweep-lite with a timer
  { id: 'windbreak',      name: 'Windbreak',      type: 'flying', cost: 2, art: '🌲', effects: { tailwind: 2, block: 8, weaken: 1 }, rarity: 'uncommon', upgrade: { effects: { block: 11 } } },   // Tailwind, and a gust that weakens
  { id: 'downdraft',      name: 'Downdraft',      type: 'flying', cost: 1, art: '⬇️', effects: { block: 6, ifTailwind: { sap: 1 } }, rarity: 'uncommon', upgrade: { effects: { block: 9 } } },   // Disarm-lite, in the wind
  { id: 'early-bird',     name: 'Early Bird',     type: 'flying', cost: 1, art: '🐓', effects: { unburdenBlock: 4 }, power: true, rarity: 'uncommon', upgrade: { effects: { unburdenBlock: 6 } } },   // (Unburden's Feel No Pain)
  { id: 'ruffle',         name: 'Ruffle',         type: 'flying', cost: 0, art: '🐔', effects: { block: 4, draw: 1, ifEmpty: { block: 4 } }, rarity: 'uncommon', upgrade: { effects: { block: 6, ifEmpty: { block: 6 } } } },   // Shrug It Off-lite, free
  { id: 'nest',           name: 'Nest',           type: 'flying', cost: 1, art: '🪺', effects: { block: 8, ifEmpty: { heal: 4 } }, rarity: 'uncommon', upgrade: { effects: { block: 11 } } },   // Defend with Bandage Up on the last card
  { id: 'squawk',         name: 'Squawk',         type: 'flying', cost: 0, art: '📢', effects: { weaken: 1, ifEmpty: { draw: 2 } }, rarity: 'uncommon', upgrade: { effects: { weaken: 2 } } },   // Neutralize, with Finesse's draw
  { id: 'soar',           name: 'Soar',           type: 'flying', cost: 1, art: '🦅', effects: { block: 8, ifTailwind: { evasion: 1 } }, rarity: 'uncommon', upgrade: { effects: { block: 11 } } },   // an Evasion / Tailwind bridge: Defend with Blur, in the wind
  { id: 'unburden',       name: 'Unburden',       type: 'flying', cost: 1, art: '🎒', effects: { block: 6, ifEmpty: { evasion: 2 } }, rarity: 'uncommon', upgrade: { effects: { block: 9 } } },   // an Evasion / Unburden bridge: Defend with Blur, on the last card
  { id: 'lift',           name: 'Lift',           type: 'flying', cost: 0, art: '🎈', effects: { block: 3, ifEmpty: { tailwind: 2 } }, rarity: 'uncommon', upgrade: { effects: { block: 5 } } },   // a Tailwind / Unburden bridge: Updraft's defensive twin
  { id: 'wingspan',       name: 'Wingspan',       type: 'flying', cost: 2, art: '🪽', effects: { block: 9, weaken: 1, sap: 1 }, rarity: 'uncommon', upgrade: { effects: { block: 12 } } },   // Leg Sweep with Disarm's Sap
  { id: 'delta-stream',   name: 'Delta Stream',   type: 'flying', cost: 3, art: '♾️', effects: { tailwind: 3, tailwindKeep: 1 }, power: true, rarity: 'rare', upgrade: { cost: 2 } },   // (Endless Winter's twin)
  { id: 'sky-fortress',   name: 'Sky Fortress',   type: 'flying', cost: 2, art: '🏰', effects: { tailwind: 2, block: 12, blur: 1 }, rarity: 'rare', upgrade: { effects: { block: 16 } } },   // a fort that stands a second turn
  { id: 'phantom-wing',   name: 'Phantom Wing',   type: 'flying', cost: 1, art: '👻', effects: { evasion: 2, blockPerEvasion: 4 }, rarity: 'rare', upgrade: { effects: { blockPerEvasion: 5 } } },   // (Evasion's own: block that grows with the stacks)
  { id: 'levitate',       name: 'Levitate',       type: 'flying', cost: 2, art: '🫧', effects: { evadeSap: 1 }, power: true, rarity: 'rare', upgrade: { cost: 1 } },   // (Evasion's own: Sap kept up)
  { id: 'featherweight',  name: 'Featherweight',  type: 'flying', cost: 0, art: '🪶', effects: { block: 5, ifEmpty: { block: 8, draw: 1 } }, rarity: 'rare', upgrade: { effects: { block: 7, ifEmpty: { block: 10, draw: 1 } } } },   // (Unburden's own)
  { id: 'weightless',     name: 'Weightless',     type: 'flying', cost: 1, art: '🎐', effects: { emptyBlock: 8 }, power: true, rarity: 'rare', upgrade: { effects: { emptyBlock: 11 } } },   // (Feather Light's defensive twin)
  { id: 'cloud-nine',     name: 'Cloud Nine',     type: 'flying', cost: 1, art: '9️⃣', effects: { evasion: 2, ifTailwind: { evasion: 1, draw: 2 } }, rarity: 'rare', upgrade: { effects: { evasion: 3 } } },   // Evasion, and more in Tailwind
  { id: 'oblivion-wing',  name: 'Oblivion Wing',  type: 'flying', cost: 2, art: '🦇', effects: { damage: 14, healDealt: true, evasion: 1 }, rarity: 'rare', upgrade: { effects: { damage: 19 } } },   // Yveltal's drain, and Evasion
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
  { id: 'flame-charge', name: 'Flame Charge', type: 'fire', cost: 1, art: '⚡', sprite: 'power-anklet', effects: { damage: 9, energy: 1, exhaustPick: 1 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 13 } } },   // Kindling: free if you feed it a card
  { id: 'fire-fang',    name: 'Fire Fang',    type: 'fire', cost: 1, art: '🦷', sprite: 'razor-fang', effects: { damage: 9, ifEnemyAttacks: { burn: 4, weaken: 2 } }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 12, ifEnemyAttacks: { burn: 5, weaken: 2 } } } },   // a fang that burns and makes it flinch as it attacks
  { id: 'flame-wheel',  name: 'Flame Wheel',  type: 'fire', cost: 2, art: '🔥', sprite: 'tr-fire', effects: { selfDamage: 2, damage: 7, hits: 3 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 9 } } },   // Reckless: Sword Boomerang with a price
  { id: 'incinerate',   name: 'Incinerate',   type: 'fire', cost: 2, art: '🌪️', sprite: 'incinium-z', effects: { damage: 14, exhaustPick: 1, draw: 1 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 18 } } },   // Kindling
];
const FIRE_EVO_HIGH = [
  { id: 'flamethrower', name: 'Flamethrower', type: 'fire', cost: 2, art: '🔥', sprite: 'tm-fire', effects: { damage: 18, burn: 3, burnTimes: 2 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 24, burn: 4 } } },   // Burn twice: Drought adds to each
  { id: 'fire-blast',   name: 'Fire Blast',   type: 'fire', cost: 2, art: '☄️', sprite: 'firium-z', effects: { burn: 7, weaken: 2, vulnerable: 2 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { burn: 9, weaken: 2, vulnerable: 3 } } },   // Burn with Weak and Vulnerable both (Scorch is a Bash with a Burn now)
  { id: 'overheat',     name: 'Overheat',     type: 'fire', cost: 3, art: '☀️', sprite: 'white-herb', effects: { selfDamage: 4, damage: 28, bonusIfLow: 12 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 36, bonusIfLow: 14 } } },   // Reckless: it burns your own HP down to its low-HP bonus
  { id: 'blast-burn',   name: 'Blast Burn',   type: 'fire', cost: 3, art: '🌋', sprite: 'charizardite-x', effects: { exhaustHand: 'all', damage: 34, perExhausted: 4 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 42 } } },   // Kindling
];

const GRASS_EVO_MID = [
  { id: 'leech-seed',    name: 'Leech Seed',    type: 'grass', cost: 1, art: '🌱', sprite: 'carrot-seeds', effects: { seed: 3, heal: 3 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { seed: 5, heal: 4 } } },   // Drain: Deadly Poison, the move itself
  { id: 'bulk-up',       name: 'Bulk Up',       type: 'grass', cost: 1, art: '💪', sprite: 'macho-brace', effects: { strength: 2, block: 6 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { strength: 3, block: 8 } } },   // Growth: Inflame + a Defend
  { id: 'razor-storm',   name: 'Razor Storm',   type: 'grass', cost: 2, art: '🍃', sprite: 'gold-leaf', effects: { damage: 3, hits: 5, healDealt: true }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 4 } } },   // Reaper in five cuts
  { id: 'poison-powder', name: 'Poison Powder', type: 'grass', cost: 1, art: '☠️', sprite: 'poison-barb', effects: { weaken: 2, sap: 1 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { weaken: 3, sap: 2 } } },   // Spores: Blind + Disarm (lite)
];
const GRASS_EVO_HIGH = [
  { id: 'giga-drain',    name: 'Giga Drain',    type: 'grass', cost: 2, art: '🩸', sprite: 'grassium-z', effects: { damage: 18, heal: 6, seed: 2 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 24, heal: 8, seed: 3 } } },   // Drain and seed in one
  { id: 'petal-blizzard', name: 'Petal Blizzard', type: 'grass', cost: 2, art: '🌸', sprite: 'petal-red', effects: { damage: 10, hits: 2, weaken: 2, heal: 4 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 13, heal: 6 } } },   // two hits that weaken it, and petals that heal
  { id: 'leaf-storm',    name: 'Leaf Storm',    type: 'grass', cost: 3, art: '🍂', sprite: 'sceptilite', effects: { damage: 26, blockPerStrength: 2 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 33, blockPerStrength: 3 } } },   // a storm that shields you as strength grows
  { id: 'frenzy-plant',  name: 'Frenzy Plant',  type: 'grass', cost: 3, art: '🌳', sprite: 'venusaurite', effects: { damage: 34, strengthMult: 4, nextEnergy: -1 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 42 } } },   // Heavy Blade that needs a turn to recharge
];

const WATER_EVO_MID = [
  { id: 'aqua-jet',    name: 'Aqua Jet',    type: 'water', cost: 1, art: '💨', sprite: 'aqua-suit', effects: { damage: 7, ifDiscarded: { bonus: 6 }, draw: 2, discard: 1 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 10, ifDiscarded: { bonus: 8 } } } },   // Flow: Finisher-lite
  { id: 'bubble-beam', name: 'Bubble Beam', type: 'water', cost: 1, art: '🫧', sprite: 'squirt-bottle', effects: { weaken: 2, tide: 3, draw: 1 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { weaken: 3, tide: 4 } } },   // a wall of bubbles: Weak, Tide and a draw (Bubble is the attack)
  { id: 'brine',       name: 'Brine',       type: 'water', cost: 2, art: '🌊', sprite: 'shoal-salt', effects: { damage: 9, perTideHeld: 2, draw: 1 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 12, perTideHeld: 3 } } },   // it rides the Tide without spending it, and draws
  { id: 'rain-shield', name: 'Rain Shield', type: 'water', cost: 1, art: '🌧️', sprite: 'utility-umbrella', effects: { block: 8, heal: 2 }, retain: true, growOnRetain: { block: 3 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { block: 11, heal: 3 } } },   // Shell: held, it grows
];
const WATER_EVO_HIGH = [
  { id: 'scald',        name: 'Scald',        type: 'water', cost: 2, art: '♨️', sprite: 'douse-drive', effects: { damage: 14, burn: 3, perTideHeld: 1 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 19, burn: 4 } } },   // boiling water: a Burn, hotter with the Tide
  { id: 'wave-crash',   name: 'Wave Crash',   type: 'water', cost: 1, art: '🌊', sprite: 'gyaradosite', effects: { blockDamage: 1.5 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { blockDamage: 2 } } },   // Shell: Body Slam x1.5
  { id: 'origin-pulse', name: 'Origin Pulse', type: 'water', cost: 3, art: '🌀', sprite: 'waterium-z', effects: { damage: 24, tide: 3, draw: 2 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 30 } } },   // Kyogre's wave: damage, Tide and two cards
  { id: 'hydro-cannon', name: 'Hydro Cannon', type: 'water', cost: 3, art: '🚿', sprite: 'blastoisinite', effects: { damage: 20, hits: 2, nextEnergy: -1 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 25 } } },   // two blasts, then a turn to recharge
];
const PSYCHIC_EVO_MID = [
  { id: 'psycho-shift',   name: 'Psycho Shift',   type: 'psychic', cost: 1, art: '🌀', effects: { damage: 8, sap: 2 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 11 } } }, // it shifts the enemy's power away: Sap
  { id: 'mind-over-matter', name: 'Mind Over Matter', type: 'psychic', cost: 1, art: '🧠', effects: { strength: 2, block: 8 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { strength: 3, block: 10 } } }, // Force + Barrier
  { id: 'psychic-reflection', name: 'Psychic Reflection', type: 'psychic', cost: 1, art: '🪞', effects: { block: 10, thorns: 6 }, power: true, evoOnly: true, maxCopies: 1, upgrade: { effects: { block: 13, thorns: 8 } } }, // Barrier: Caltrops + block
  { id: 'mind-lance',     name: 'Mind Lance',     type: 'psychic', cost: 1, art: '🔮', effects: { damage: 10, perDebuff: 3 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 13, perDebuff: 4 } } }, // it pierces every weakness: +3 for each kind of debuff
];
const PSYCHIC_EVO_HIGH = [
  { id: 'psycho-break',   name: 'Psycho Break',   type: 'psychic', cost: 2, art: '💥', effects: { damage: 20, echo: 1 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 26 } } }, // Echo: your next card this turn twice
  { id: 'mindstorm',      name: 'Mindstorm',      type: 'psychic', cost: 'X', art: '🌪️', effects: { damage: 6, perX: { hits: 1, weaken: 1 } }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 8, perX: { hits: 1, weaken: 1 } } } }, // X hits and X Weak (Mind Storm is the plain one)
  { id: 'absolute-barrier', name: 'Absolute Barrier', type: 'psychic', cost: 2, art: '🛡️', effects: { keepBlock: 1, blockEachTurn: 5 }, power: true, evoOnly: true, maxCopies: 1, upgrade: { cost: 1 } }, // Barrier: Barricade + Metallicize
  { id: 'psycho-annihilation', name: 'Psycho Annihilation', type: 'psychic', cost: 3, art: '🌌', effects: { damage: 30, vulnerable: 3, weaken: 2 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 38, vulnerable: 4 } } }, // Mind Games
];

const ELECTRIC_EVO_MID = [
  { id: 'thunder-punch',  name: 'Thunder Punch',  type: 'electric', cost: 1, art: '👊', effects: { damage: 8, static: 3, strength: 1 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 11, static: 4 } } },   // Static, and a punch that stays: +1 strength
  { id: 'charge-beam',    name: 'Charge Beam',    type: 'electric', cost: 1, art: '🔦', effects: { damage: 8, focus: 6 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 11, focus: 8 } } },   // it charges up your next attack
  { id: 'wild-charge',    name: 'Wild Charge',    type: 'electric', cost: 2, art: '🦁', effects: { selfDamage: 3, damage: 18, switch: true }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 24 } } },   // Reckless: recoil, then Switch out
  { id: 'thunderbolt',    name: 'Thunderbolt',    type: 'electric', cost: 2, art: '⚡', effects: { damage: 14, perStatic: 1, weaken: 1 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 18, weaken: 2 } } },   // it rides the Static, and weakens
];
const ELECTRIC_EVO_HIGH = [
  { id: 'fusion-bolt',    name: 'Fusion Bolt',    type: 'electric', cost: 2, art: '🐉', effects: { damage: 20, static: 6, ifSwitched: { bonus: 10 } }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 26, static: 8, ifSwitched: { bonus: 10 } } } },   // stronger after a Switch, as Fusion Bolt is after Fusion Flare
  { id: 'electro-shot',   name: 'Electro Shot',   type: 'electric', cost: 3, art: '☄️', effects: { damage: 30, ifFull: { energy: 2 } }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 38 } } },   // cheaper once the enemy will be Paralyzed
  { id: 'supercell-slam', name: 'Supercell Slam', type: 'electric', cost: 2, art: '⛈️', effects: { damage: 26, draw: 1, switch: true }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 33 } } },   // a huge slam, then Switch out
  { id: 'bolt-strike',    name: 'Bolt Strike',    type: 'electric', cost: 3, art: '🌠', effects: { damage: 30, static: 5, energy: 1 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 38 } } },   // Zekrom's bolt: Static and a PP back
];

const ICE_EVO_MID = [
  { id: 'aurora-beam',    name: 'Aurora Beam',    type: 'ice', cost: 2, art: '🌈', effects: { damage: 12, frostbite: 4, sap: 1 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 16, frostbite: 5 } } },   // it lowers its attack for good: a Sap
  { id: 'ice-ball',       name: 'Ice Ball',       type: 'ice', cost: 0, art: '⚪', effects: { damage: 4 }, growOnPlay: { damage: 3 }, icicle: true, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 6 } } },   // it rolls up: Rampage as an Icicle
  { id: 'avalanche',      name: 'Avalanche',      type: 'ice', cost: 2, art: '🏔️', effects: { damage: 14, ifHail: { weaken: 2 } }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 19 } } },   // Weak in Hail
  { id: 'ice-hammer',     name: 'Ice Hammer',     type: 'ice', cost: 2, art: '🔨', effects: { damage: 16, blockPerFrost: 2 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 21, blockPerFrost: 3 } } },   // a blow that shields you with its Frostbite
];
const ICE_EVO_HIGH = [
  { id: 'glacial-lance',  name: 'Glacial Lance',  type: 'ice', cost: 2, art: '🔱', effects: { damage: 18, frostbite: 5, ifHail: { bonus: 8 } }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 24, frostbite: 6, ifHail: { bonus: 8 } } } },   // a lance that hits harder in Hail
  { id: 'triple-axel',    name: 'Triple Axel',    type: 'ice', cost: 2, art: '⛸️', effects: { damage: 6, hits: 3, frostbite: 3 }, icicle: true, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 8 } } },   // three kicks that freeze (Icicle Spear is the 1-cost one)
  { id: 'freeze-shock',   name: 'Freeze Shock',   type: 'ice', cost: 2, art: '🧊', effects: { damage: 18, frostbite: 3, hail: 2 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 24, frostbite: 4 } } },   // Frostbite and Hail in one blow
  { id: 'subzero-slammer', name: 'Subzero Slammer', type: 'ice', cost: 3, art: '💥', effects: { damage: 34, frostbite: 8 }, exhaust: true, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 42, frostbite: 10 } } },   // a Z-Move: once a fight
];

const FIGHTING_EVO_MID = [
  { id: 'power-up-punch', name: 'Power-Up Punch', type: 'fighting', cost: 1, art: '🥊', effects: { damage: 8, ifAfterAttack: { strength: 2 } }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 11, ifAfterAttack: { strength: 3 } } } },   // Follow-up
  { id: 'wide-guard',     name: 'Wide Guard',     type: 'fighting', cost: 1, art: '🧱', effects: { counter: 6, blockNext: 8 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { counter: 8, blockNext: 11 } } },   // Counter now, a guard next turn
  { id: 'submission',     name: 'Submission',     type: 'fighting', cost: 1, art: '🤼', effects: { damage: 9, hits: 2, addCard: { id: 'sore' } }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 11 } } },   // a Guts double hit
  { id: 'cross-chop',     name: 'Cross Chop',     type: 'fighting', cost: 2, art: '❌', effects: { damage: 9, hits: 2, ifAfterSkill: { draw: 2 } }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 12 } } },   // two chops, and a draw after a skill
];
const FIGHTING_EVO_HIGH = [
  { id: 'triple-kick',    name: 'Triple Kick',    type: 'fighting', cost: 1, art: '🦶', effects: { damage: 6, hits: 3, ifAfterAttack: { energy: 1 } }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 8 } } },   // Follow-up
  { id: 'seismic-toss',   name: 'Seismic Toss',   type: 'fighting', cost: 1, art: '🌍', effects: { block: 10, counterPerLost: 2 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { block: 14 } } },   // a guard, and Counter twice what it took last turn
  { id: 'dynamic-punch',  name: 'Dynamic Punch',  type: 'fighting', cost: 2, art: '💫', effects: { damage: 22, vulnerable: 2, addCard: { id: 'sore' } }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 28, vulnerable: 3 } } },   // a punch that leaves you dizzy: a Sore
  { id: 'flying-press',   name: 'Flying Press',   type: 'fighting', cost: 3, art: '🛬', effects: { damage: 28, vulnerable: 2, counter: 8 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 35 } } },   // it lands and braces: Counter
];

const GROUND_EVO_MID = [
  { id: 'burrow',         name: 'Burrow',         type: 'ground', cost: 1, art: '⛏️', effects: { surface: { damage: 10, draw: 2 } }, evoOnly: true, maxCopies: 1, upgrade: { effects: { surface: { damage: 14, draw: 2 } } } },   // it pops up hitting, with two cards
  { id: 'magnitude',      name: 'Magnitude',      type: 'ground', cost: 1, art: '📈', effects: { damage: 7, ifFault: { bonus: 7 } }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 10, ifFault: { bonus: 9 } } } },   // stronger on a cracked enemy
  { id: 'sand-spit',      name: 'Sand Spit',      type: 'ground', cost: 2, art: '🐍', effects: { damage: 14, sand: 2 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 18, sand: 3 } } },   // Sandstorm
  { id: 'high-horsepower', name: 'High Horsepower', type: 'ground', cost: 2, art: '🐎', effects: { damage: 15, fault: 5, draw: 1 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 20, fault: 6 } } },   // Fault and a draw
];
const GROUND_EVO_HIGH = [
  { id: 'thousand-arrows', name: 'Thousand Arrows', type: 'ground', cost: 2, art: '🏹', effects: { block: 10, surface: { damage: 6, hits: 4 } }, evoOnly: true, maxCopies: 1, upgrade: { effects: { block: 12, surface: { damage: 8, hits: 4 } } } },   // a volley from below: four hits
  { id: 'thousand-waves', name: 'Thousand Waves', type: 'ground', cost: 1, art: '〰️', effects: { fault: 12, tempSap: 5 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { fault: 16 } } },   // waves that pin it: Fault and a softer attack
  { id: 'sandsear-storm', name: 'Sandsear Storm', type: 'ground', cost: 2, art: '🌪️', effects: { damage: 18, burn: 4, ifSand: { burn: 4 } }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 24, burn: 5, ifSand: { burn: 5 } } } },   // a scorching sandstorm: Burn, twice in a Sandstorm
  { id: 'headlong-rush',  name: 'Headlong Rush',  type: 'ground', cost: 3, art: '🦏', effects: { selfDamage: 4, damage: 36, fault: 8 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 44 } } },   // Reckless: it drops your guard for a huge Fault
];

const FLYING_EVO_MID = [
  { id: 'steel-wing',     name: 'Steel Wing',     type: 'flying', cost: 1, art: '🛡️', effects: { damage: 8, blockNext: 8 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 11, blockNext: 10 } } },   // a wing that hardens: block next turn
  { id: 'air-cutter',     name: 'Air Cutter',     type: 'flying', cost: 2, art: '🔪', effects: { damage: 14, tailwind: 2 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 18, tailwind: 3 } } },   // Tailwind
  { id: 'swoop',          name: 'Swoop',          type: 'flying', cost: 0, art: '🦉', effects: { damage: 6, ifEmpty: { energy: 1 } }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 9 } } },   // Unburden: free if it's your last card
  { id: 'wing-strike',    name: 'Wing Strike',    type: 'flying', cost: 2, art: '🪶', effects: { damage: 16, ifTailwind: { weaken: 2 } }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 21, ifTailwind: { weaken: 2 } } } },   // Weak in Tailwind
];
const FLYING_EVO_HIGH = [
  { id: 'dragon-ascent',  name: 'Dragon Ascent',  type: 'flying', cost: 2, art: '🐲', effects: { damage: 18, evasion: 2, ifEmpty: { bonus: 12 } }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 24 } } },   // Unburden: a dive with nothing held back
  { id: 'bleakwind-storm', name: 'Bleakwind Storm', type: 'flying', cost: 2, art: '🌩️', effects: { damage: 7, hits: 3, tailwind: 2 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 9, tailwind: 3 } } },   // Tailwind
  { id: 'supersonic-skystrike', name: 'Supersonic Skystrike', type: 'flying', cost: 1, art: '🚀', effects: { damage: 14, hits: 1, ifEmpty: { hits: 1 } }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 18 } } },   // Unburden
  { id: 'sky-fall',       name: 'Sky Fall',       type: 'flying', cost: 3, art: '🌠', effects: { damage: 30, evasion: 1, tailwind: 2 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 38 } } },   // it lifts the enemy: Evasion and Tailwind
];

/* Dark (the Safari's duo pool, docs/duo-design.md section 5): Steal takes the enemy's strength and block as yours
   (Disarm and Sap, turned round), Punish pays off when it intends to attack (Go for the Eyes, Spot Weakness), and
   Illusion cards hit as whichever of your two types does better, while Disguise lets you defend as it (Zorua's
   Illusion, a duo trick). Session 13 built 30 of its 66 pool cards and all 8 evolution cards; session 14 the other 36. */
const DARK_CARDS = [
  { id: 'bite',           name: 'Bite',           type: 'dark', cost: 1, art: '🦷', effects: { damage: 8 }, upgrade: { effects: { damage: 11 } } },   // Strike
  { id: 'obstruct',       name: 'Obstruct',       type: 'dark', cost: 1, art: '✋', effects: { block: 8 }, upgrade: { effects: { block: 11 } } },   // Defend
  { id: 'snatch',         name: 'Snatch',         type: 'dark', cost: 2, art: '🫳', effects: { damage: 10, vulnerable: 2, steal: 1 }, upgrade: { effects: { damage: 12, vulnerable: 3 } } },   // Bash, Steal for Wing Attack's Evasion
  { id: 'feint-attack',   name: 'Feint Attack',   type: 'dark', cost: 1, art: '🎭', effects: { damage: 6, block: 6 }, illusion: true, upgrade: { effects: { damage: 8, block: 8 } } },   // Iron Wave
  { id: 'lash-out',       name: 'Lash Out',       type: 'dark', cost: 0, art: '😤', effects: { damage: 4, punish: { draw: 1 } }, upgrade: { effects: { damage: 6 } } },   // Flash of Steel, on its intent (Weak 1 too until 2026-10-20: solo Dark 43 without it at first, but its pairs ran ~8 over the base three's once Dark was whole)
  { id: 'covet',          name: 'Covet',          type: 'dark', cost: 1, art: '🤲', effects: { damage: 7, steal: 1 }, upgrade: { effects: { damage: 10 } } },   // Sucker Punch (Silent's), Steal for its Weak
  { id: 'brutal-swing',   name: 'Brutal Swing',   type: 'dark', cost: 1, art: '🌀', effects: { damage: 7, ifBuffed: { bonus: 6 } }, upgrade: { effects: { damage: 9, ifBuffed: { bonus: 8 } } } },   // Bane, on its buffs
  { id: 'throat-chop',    name: 'Throat Chop',    type: 'dark', cost: 1, art: '🤚', effects: { damage: 7, punish: { bonus: 6 } }, upgrade: { effects: { damage: 9, punish: { bonus: 8 } } } },   // Bane, on its intent
  { id: 'disguise',       name: 'Disguise',       type: 'dark', cost: 1, art: '🥸', effects: { block: 8, disguise: 1 }, upgrade: { effects: { block: 11 } } },   // Defend, in disguise
  { id: 'sleight-of-hand', name: 'Sleight of Hand', type: 'dark', cost: 1, art: '🃏', effects: { damage: 4, hits: 2 }, illusion: true, upgrade: { effects: { damage: 5 } } },   // Twin Strike
  { id: 'taunt',          name: 'Taunt',          type: 'dark', cost: 0, art: '😜', effects: { taunt: 1, draw: 1 }, exhaust: true, rarity: 'uncommon', upgrade: { effects: { draw: 2 } } },   // (Punish's own: Trip's slot)
  { id: 'reprisal',       name: 'Reprisal',       type: 'dark', cost: 1, art: '🔁', effects: { block: 7, punish: { vulnerable: 2 } }, rarity: 'uncommon', upgrade: { effects: { block: 10 } } },   // Go for the Eyes, with a Defend
  { id: 'comeuppance',    name: 'Comeuppance',    type: 'dark', cost: 2, art: '⚖️', effects: { damage: 12, hits: 1, punish: { hits: 1 } }, rarity: 'uncommon', upgrade: { effects: { damage: 15 } } },   // Twin Strike+, on its intent
  { id: 'unnerve',        name: 'Unnerve',        type: 'dark', cost: 1, art: '😰', effects: { punishDamage: 5 }, power: true, rarity: 'uncommon', upgrade: { effects: { punishDamage: 7 } } },   // (Punish's Thousand Cuts)
  { id: 'ransack',        name: 'Ransack',        type: 'dark', cost: 1, art: '🗃️', effects: { damage: 5, hits: 2, steal: 1 }, rarity: 'uncommon', upgrade: { effects: { damage: 7, steal: 2 } } },   // two grabs and a Steal
  { id: 'pickpocket',     name: 'Pickpocket',     type: 'dark', cost: 1, art: '👛', effects: { mirrorStrength: 1 }, power: true, rarity: 'uncommon', upgrade: { cost: 0 } },   // (Steal's own: Inflame off its buffs)
  { id: 'jaw-lock',       name: 'Jaw Lock',       type: 'dark', cost: 1, art: '🐊', effects: { damage: 8, ifBuffed: { weaken: 2 } }, rarity: 'uncommon', upgrade: { effects: { damage: 11, ifBuffed: { weaken: 3 } } } },   // it clamps down on a buffed enemy: Weak
  { id: 'imposter',       name: 'Imposter',       type: 'dark', cost: 1, art: '🫥', effects: { copyPartner: 1 }, exhaust: true, rarity: 'uncommon', upgrade: { cost: 0 } },   // Dual Wield, off your partner
  { id: 'masquerade',     name: 'Masquerade',     type: 'dark', cost: 1, art: '🎭', effects: { weaken: 1, disguise: 1, draw: 1 }, rarity: 'uncommon', upgrade: { effects: { draw: 2 } } },   // Weak behind a mask, and a card
  { id: 'wicked-blow',    name: 'Wicked Blow',    type: 'dark', cost: 2, art: '👊', effects: { damage: 16, ifDisguised: { bonus: 6 } }, illusion: true, rarity: 'uncommon', upgrade: { effects: { damage: 20, ifDisguised: { bonus: 8 } } } },   // Bludgeon-lite
  { id: 'doppelganger',   name: 'Doppelganger',   type: 'dark', cost: 1, art: '👥', effects: { damage: 5, perIllusion: 4 }, illusion: true, rarity: 'uncommon', upgrade: { effects: { damage: 7, perIllusion: 5 } } },   // Finisher, on Illusions
  { id: 'mug',            name: 'Mug',            type: 'dark', cost: 1, art: '💰', effects: { damage: 7, punish: { steal: 2 } }, rarity: 'uncommon', upgrade: { effects: { damage: 10 } } },   // a Steal / Punish bridge: Sucker Punch, stealing on its intent
  { id: 'switcheroo',     name: 'Switcheroo',     type: 'dark', cost: 0, art: '🔀', effects: { steal: 1, disguise: 1 }, rarity: 'uncommon', upgrade: { effects: { steal: 2 } } },   // a Steal / Illusion bridge: Disarm-lite, free
  { id: 'false-surrender', name: 'False Surrender', type: 'dark', cost: 1, art: '🏳️', effects: { damage: 8, punish: { disguise: 1 } }, illusion: true, rarity: 'uncommon', upgrade: { effects: { damage: 11 } } },   // Punish: it bows, then slips into a Disguise
  { id: 'mirage',         name: 'Mirage',         type: 'dark', cost: 2, art: '🌫️', effects: { mirage: 1 }, power: true, rarity: 'rare', upgrade: { cost: 1 } },   // (Illusion's own: Wraith Form's slot)
  { id: 'darkest-lariat', name: 'Darkest Lariat', type: 'dark', cost: 2, art: '🌪️', effects: { damage: 16, ifBuffed: { strengthMult: 3 } }, rarity: 'rare', upgrade: { effects: { damage: 20, ifBuffed: { strengthMult: 4 } } } },   // Heavy Blade against a buffed enemy
  { id: 'plunder',        name: 'Plunder',        type: 'dark', cost: 2, art: '🏴‍☠️', effects: { damage: 12, steal: 2, ifBuffed: { steal: 2 } }, rarity: 'rare', upgrade: { effects: { damage: 16 } } },   // it takes more from a buffed enemy
  { id: 'ruination',      name: 'Ruination',      type: 'dark', cost: 2, art: '💀', effects: { damage: 8, punish: { perIntent: 1 } }, rarity: 'rare', upgrade: { effects: { damage: 12 } } },   // (Punish's own: Spite thrown back)
  { id: 'prankster',      name: 'Prankster',      type: 'dark', cost: 2, art: '🃏', effects: { punishDraw: 2 }, power: true, rarity: 'rare', upgrade: { cost: 1 } },   // Machine Learning, on its intent
  { id: 'hyperspace-fury', name: 'Hyperspace Fury', type: 'dark', cost: 2, art: '🌌', effects: { damage: 5, hits: 4, steal: 1 }, illusion: true, rarity: 'rare', upgrade: { effects: { damage: 6 } } },   // a Steal / Illusion bridge: Riddle with Holes-lite
  // session 14's 36 (docs/duo-design.md section 5, "Dark's second session"): defence-leaning, the first half being hits
  { id: 'pilfer',         name: 'Pilfer',         type: 'dark', cost: 1, art: '🧤', effects: { block: 6, steal: 1 }, upgrade: { effects: { block: 9 } } },   // Defend, with Disarm's theft
  { id: 'hoard',          name: 'Hoard',          type: 'dark', cost: 1, art: '💰', effects: { block: 5, blockPerStrength: 2 }, upgrade: { effects: { block: 7, blockPerStrength: 3 } } },   // (Steal's Spirit Shield)
  { id: 'shakedown',      name: 'Shakedown',      type: 'dark', cost: 1, art: '🫨', effects: { block: 7, ifBuffed: { weaken: 1 } }, upgrade: { effects: { block: 10 } } },   // Defend, on its buffs
  { id: 'brace-for-it',   name: 'Brace for It',   type: 'dark', cost: 1, art: '🧱', effects: { block: 6, punish: { block: 5 } }, upgrade: { effects: { block: 9, punish: { block: 6 } } } },   // Defend, doubled on its intent
  { id: 'lurk',           name: 'Lurk',           type: 'dark', cost: 1, art: '👁️', effects: { block: 6, punish: { weaken: 2 } }, upgrade: { effects: { block: 9 } } },   // Defend with Leg Sweep's Weak on its intent
  { id: 'cower',          name: 'Cower',          type: 'dark', cost: 0, art: '🙈', effects: { tempSap: 3, punish: { draw: 1 } }, upgrade: { effects: { tempSap: 5 } } },   // it shrinks from an attack, and draws
  { id: 'veil',           name: 'Veil',           type: 'dark', cost: 1, art: '🧕', effects: { block: 5, ifDisguised: { block: 5 } }, upgrade: { effects: { block: 7, ifDisguised: { block: 6 } } } },   // Defend, in disguise
  { id: 'decoy',          name: 'Decoy',          type: 'dark', cost: 0, art: '🪆', effects: { block: 3, disguise: 1 }, illusion: true, upgrade: { effects: { block: 5 } } },   // Deflect, in disguise
  { id: 'night-shroud',   name: 'Night Shroud',   type: 'dark', cost: 1, art: '🌑', effects: { block: 5, blockPerIllusion: 3 }, upgrade: { effects: { block: 7, blockPerIllusion: 4 } } },   // (Illusion's Spirit Shield)
  { id: 'snarl',          name: 'Snarl',          type: 'dark', cost: 2, art: '😾', effects: { weaken: 2, steal: 1, block: 9 }, upgrade: { effects: { block: 12 } } },   // Weak, and a Steal
  { id: 'sticky-hold',    name: 'Sticky Hold',    type: 'dark', cost: 1, art: '🍯', effects: { stealBlock: 3 }, power: true, rarity: 'uncommon', upgrade: { effects: { stealBlock: 4 } } },   // (Steal's Feel No Pain)
  { id: 'siphon',         name: 'Siphon',         type: 'dark', cost: 1, art: '🩸', effects: { steal: 1, heal: 5 }, rarity: 'uncommon', upgrade: { effects: { steal: 2, heal: 6 } } },   // Steal, and drink it in
  { id: 'knock-away',     name: 'Knock Away',     type: 'dark', cost: 2, art: '🏏', effects: { steal: 1, taunt: 1, block: 10 }, rarity: 'uncommon', upgrade: { effects: { block: 13 } } },   // it knocks the buff away and goads an attack
  { id: 'extort',         name: 'Extort',         type: 'dark', cost: 1, art: '🧾', effects: { weaken: 1, ifBuffed: { steal: 2 } }, rarity: 'uncommon', upgrade: { effects: { weaken: 2 } } },   // Disarm, on its buffs
  { id: 'vendetta',       name: 'Vendetta',       type: 'dark', cost: 1, art: '🗡️', effects: { punishBlock: 4 }, power: true, rarity: 'uncommon', upgrade: { effects: { punishBlock: 6 } } },   // (Unnerve's defensive twin)
  { id: 'night-watch',    name: 'Night Watch',    type: 'dark', cost: 1, art: '🔦', effects: { intentBlock: 4 }, power: true, rarity: 'uncommon', upgrade: { effects: { intentBlock: 6 } } },   // Metallicize, on its intent
  { id: 'turnabout',      name: 'Turnabout',      type: 'dark', cost: 1, art: '🔄', effects: { block: 5, punish: { blockIntent: 1 } }, rarity: 'uncommon', upgrade: { effects: { block: 8 } } },   // (Punish's own: its hit turned to block)
  { id: 'spite-guard',    name: 'Spite Guard',    type: 'dark', cost: 2, art: '🛡️', effects: { block: 10, punish: { sap: 1 } }, rarity: 'uncommon', upgrade: { effects: { block: 13 } } },   // Punish: a Sap for good
  { id: 'goad',           name: 'Goad',           type: 'dark', cost: 1, art: '👉', effects: { block: 8, taunt: 1 }, rarity: 'uncommon', upgrade: { effects: { block: 11 } } },   // Defend with Taunt
  { id: 'costume-change', name: 'Costume Change', type: 'dark', cost: 1, art: '👘', effects: { disguiseBlock: 3 }, power: true, rarity: 'uncommon', upgrade: { effects: { disguiseBlock: 4 } } },   // (Disguise's Feel No Pain)
  { id: 'hall-of-mirrors', name: 'Hall of Mirrors', type: 'dark', cost: 1, art: '🪞', effects: { illusionBlock: 2 }, power: true, rarity: 'uncommon', upgrade: { effects: { illusionBlock: 3 } } },   // (Illusion's After Image)
  { id: 'shadow-cloak',   name: 'Shadow Cloak',   type: 'dark', cost: 2, art: '🧛', effects: { block: 11, disguise: 1, blur: 1 }, rarity: 'uncommon', upgrade: { effects: { block: 14 } } },   // a cloak that lasts a second turn
  { id: 'reflection',     name: 'Reflection',     type: 'dark', cost: 1, art: '🌗', effects: { block: 7, draw: 1 }, illusion: true, rarity: 'uncommon', upgrade: { effects: { block: 10 } } },   // Shrug It Off, an Illusion
  { id: 'veiled-strike',  name: 'Veiled Strike',  type: 'dark', cost: 1, art: '🥷', effects: { damage: 6, disguise: 1 }, illusion: true, rarity: 'uncommon', upgrade: { effects: { damage: 9 } } },   // Iron Wave, its block a disguise
  { id: 'ambush',         name: 'Ambush',         type: 'dark', cost: 1, art: '🕸️', effects: { block: 7, punish: { steal: 2 } }, rarity: 'uncommon', upgrade: { effects: { block: 10 } } },   // a Steal / Punish bridge: Defend, stealing on its intent
  { id: 'vanishing-act',  name: 'Vanishing Act',  type: 'dark', cost: 1, art: '🎩', effects: { disguise: 1, tempSap: 6 }, rarity: 'uncommon', upgrade: { effects: { tempSap: 9 } } },   // it can't find you this turn
  { id: 'play-dead',      name: 'Play Dead',      type: 'dark', cost: 1, art: '😵', effects: { block: 7, punish: { disguise: 1 } }, illusion: true, rarity: 'uncommon', upgrade: { effects: { block: 10 } } },   // a Punish / Illusion bridge: Defend, in disguise on its intent
  { id: 'lick-wounds',    name: 'Lick Wounds',    type: 'dark', cost: 1, art: '👅', effects: { block: 6, ifDisguised: { heal: 6 } }, rarity: 'uncommon', upgrade: { effects: { block: 9, ifDisguised: { heal: 7 } } } },   // it heals in hiding
  { id: 'magician',       name: 'Magician',       type: 'dark', cost: 2, art: '🪄', effects: { stealEachTurn: 1 }, power: true, rarity: 'rare', upgrade: { cost: 1 } },   // (Steal's own: Disarm every turn)
  { id: 'ill-gotten-gains', name: 'Ill-Gotten Gains', type: 'dark', cost: 1, art: '💸', effects: { steal: 2, blockPerStrength: 4 }, rarity: 'rare', upgrade: { effects: { blockPerStrength: 5 } } },   // (Steal's own: Body Slam's block)
  { id: 'retribution',    name: 'Retribution',    type: 'dark', cost: 2, art: '⚔️', effects: { block: 10, punish: { blockIntent: 1, weaken: 1 } }, rarity: 'rare', upgrade: { effects: { block: 14 } } },   // Impervious, on its intent
  { id: 'pressure',       name: 'Pressure',       type: 'dark', cost: 2, art: '😤', effects: { intentWeak: 1 }, power: true, rarity: 'rare', upgrade: { cost: 1 } },   // (Punish's own: Leg Sweep kept up)
  { id: 'shadow-fortress', name: 'Shadow Fortress', type: 'dark', cost: 2, art: '🏯', effects: { block: 12, disguise: 1, blockPerIllusion: 3 }, rarity: 'rare', upgrade: { effects: { block: 16, blockPerIllusion: 4 } } },   // a fortress of Illusions
  { id: 'phantom-mask',   name: 'Phantom Mask',   type: 'dark', cost: 1, art: '🎭', effects: { disguiseWeak: 1 }, power: true, rarity: 'rare', upgrade: { cost: 0 } },   // (Disguise's own: Weak kept up)
  { id: 'parting-shot',   name: 'Parting Shot',   type: 'dark', cost: 0, art: '💨', effects: { weaken: 2, steal: 1, draw: 1 }, exhaust: true, rarity: 'rare', upgrade: { effects: { weaken: 3 } } },   // Disarm with Neutralize's Weak
  { id: 'smoke-and-mirrors', name: 'Smoke and Mirrors', type: 'dark', cost: 0, art: '🌫️', effects: { block: 4, disguise: 1, punish: { weaken: 2 } }, rarity: 'rare', upgrade: { effects: { block: 7 } } },   // a Punish / Illusion bridge: Deflect, in disguise, with Leg Sweep on its intent
];

const DARK_EVO_MID = [
  { id: 'heist',          name: 'Heist',          type: 'dark', cost: 1, art: '🦹', effects: { steal: 2, draw: 2 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { steal: 3 } } },   // Steal and slip away with two cards
  { id: 'vengeance',      name: 'Vengeance',      type: 'dark', cost: 2, art: '😠', effects: { damage: 14, punish: { vulnerable: 2 } }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 18, punish: { vulnerable: 3 } } } },   // Punish
  { id: 'smoke-bomb',     name: 'Smoke Bomb',     type: 'dark', cost: 0, art: '💨', effects: { disguise: 1, draw: 2 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { draw: 3 } } },   // Illusion
  { id: 'kowtow-cleave',  name: 'Kowtow Cleave',  type: 'dark', cost: 2, art: '🗡️', effects: { damage: 15, ifDisguised: { vulnerable: 2 } }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 20 } } },   // a bow, then a cleave: Vulnerable from hiding
];
const DARK_EVO_HIGH = [
  { id: 'grand-larceny',  name: 'Grand Larceny',  type: 'dark', cost: 2, art: '💎', effects: { damage: 16, steal: 3, blockPerStrength: 2 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 22 } } },   // Steal, and hide behind what you took
  { id: 'black-hole-eclipse', name: 'Black Hole Eclipse', type: 'dark', cost: 2, art: '🌑', effects: { damage: 34, steal: 3 }, exhaust: true, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 42 } } },   // a Z-Move: once a fight
  { id: 'dark-void',      name: 'Dark Void',      type: 'dark', cost: 3, art: '🕳️', effects: { damage: 12, skipEnemy: true }, exhaust: true, illusion: true, evoOnly: true, maxCopies: 1, upgrade: { cost: 2 } },   // Vault: the enemy sleeps a turn
  { id: 'wicked-torque',  name: 'Wicked Torque',  type: 'dark', cost: 3, art: '⚙️', effects: { damage: 32, weaken: 2 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 40, weaken: 3 } } },
];

/* Fight-only cards made by other cards (`addCard`): never offered, not in the Card index, never in your run deck. */
const TOKEN_CARDS = [
  { id: 'cinder',   name: 'Cinder',   type: 'fire',  cost: 0, art: '🔥', effects: { damage: 4 }, exhaust: true, token: true },   // Shiv
  { id: 'seedling', name: 'Seedling', type: 'grass', cost: 0, art: '🌱', effects: { heal: 2, draw: 1 }, exhaust: true, token: true },
  { id: 'droplet',  name: 'Droplet',  type: 'water', cost: 0, art: '💧', effects: { damage: 3, tide: 1 }, exhaust: true, token: true },
  { id: 'icicle',   name: 'Icicle',   type: 'ice',   cost: 0, art: '🔹', effects: { damage: 3 }, icicle: true, exhaust: true, token: true },   // Snow Flurry's (Blade Dance's Shiv)
];

/* Junk enemies shuffle into your deck for one fight (a move's `adds`, or a `kind: 'status'` move). */
const STATUS_CARDS = [
  { id: 'confusion', name: 'Confusion', type: 'normal', cost: 0, art: '🌀', effects: {}, status: true, unplayable: true, ethereal: true },   // Dazed
  { id: 'paralysis', name: 'Paralysis', type: 'normal', cost: 0, art: '⚡', effects: {}, status: true, unplayable: true },                   // Wound
  { id: 'poison',    name: 'Poison',    type: 'normal', cost: 0, art: '☠️', effects: { endTurnHurt: 2 }, status: true, unplayable: true },   // Burn
  { id: 'sludge',    name: 'Sludge',    type: 'normal', cost: 1, art: '🟣', effects: {}, status: true, exhaust: true },                       // Slimed
  { id: 'sore',      name: 'Sore',      type: 'normal', cost: 0, art: '🩹', effects: {}, status: true, unplayable: true, ethereal: true },   // Fighting's Guts moves make these (Reckless Charge's Dazed)
];

/* The Safari Zone's cards (docs/reference/safari.md): never offered outside a Safari run, never in ALL_CARDS (so not in
   the Card index). Bait and Rock join a Safari run's card rewards; a caught Pokémon offers its signature card, built
   from its own best-known move with the cards' existing mechanics, one copy a run. `from` is the Pokémon's ENEMY_DEFS id. */
export const SAFARI_ONLY_CARDS = [
  { id: 'bait', name: 'Bait', type: 'normal', cost: 0, art: '🍓', effects: { bait: 1 }, safari: true },   // the Safari Zone's Bait
  { id: 'rock', name: 'Rock', type: 'normal', cost: 0, art: '🪨', effects: { damage: 4, vulnerable: 1, rock: 1 }, safari: true },   // ...and its Rock
];
const sig = (from, name, type, cost, art, effects, more = {}) =>
  ({ id: `sig-${from}`, name, type, cost, art, effects, rarity: 'uncommon', maxCopies: 1, safari: true, from, ...more });
const SIGNATURE_CARDS = [
  // Neutral
  sig('rattata', 'Hyper Fang', 'normal', 1, '🦷', { damage: 8, ifBuffed: { vulnerable: 2 } }),
  sig('sentret', 'Fury Swipes', 'normal', 1, '🐾', { damage: 2, hits: 3, ifVulnerable: { hits: 2 } }),
  sig('zigzagoon', 'Headbutt', 'normal', 1, '💢', { damage: 8, tempSap: 3 }),
  sig('aipom',      'Swift',          'normal', 1, '⭐', { damage: 3, hits: 3 }, { retain: true }),
  sig('tauros',     'Thrash',         'normal', 2, '🐂', { damage: 9, hits: 2, addCard: { id: 'confusion', n: 1, to: 'discard' } }),
  sig('teddiursa', 'Slash', 'normal', 1, '🐻', { damage: 8, ifAfterAttack: { bonus: 5 } }),
  sig('stantler', 'Psyshield Bash', 'normal', 1, '🦌', { damage: 9, ifEnemyAttacks: { blockNext: 5 } }),
  sig('bouffalant', 'Head Charge', 'normal', 2, '🦬', { damage: 18, ifHurt: { block: 6 } }),
  sig('zangoose', 'Crush Claw', 'normal', 2, '🩸', { damage: 15, ifBuffed: { bonus: 4, vulnerable: 1 } }),
  sig('chansey', 'Soft-Boiled', 'normal', 1, '🥚', { heal: 8, ifHurt: { heal: 6 } }, { exhaust: true }),
  sig('kecleon',    'Camouflage',     'normal', 1, '🦎', { block: 7, randomCard: 1 }),
  sig('furret', 'Body Slam', 'normal', 1, '🐿️', { damage: 8, ifEnemyAttacks: { static: 3 } }),
  sig('linoone',    'Extreme Speed',  'normal', 0, '💨', { damage: 6 }, { innate: true, exhaust: true }),
  sig('ambipom', 'Fake Out', 'normal', 0, '👐', { damage: 4, nextEnergy: 1 }, { innate: true, exhaust: true }),
  sig('persian',    'Nasty Plot',     'normal', 1, '😼', { focus: 10, draw: 1 }),
  sig('watchog', 'Confuse Ray', 'normal', 0, '👁️', { weaken: 2, ifWeak: { draw: 1 } }, { exhaust: true }),
  sig('lopunny', 'Bounce', 'normal', 1, '🐰', { damage: 9, ifEvasion: { vulnerable: 2 } }),
  sig('cinccino', 'Tail Slap', 'normal', 2, '🧹', { damage: 4, hits: 5, ifBuffed: { hits: 2 } }),
  sig('purugly', 'Slam', 'normal', 1, '🐈', { damage: 8, ifBuffed: { tempSap: 3 } }),
  // Grass
  sig('hoppip', 'Synthesis', 'grass', 0, '🎈', { heal: 3, ifEmpty: { draw: 2 } }),
  sig('oddish', 'Acid', 'grass', 1, '🧪', { damage: 6, ifSeeded: { sap: 2 } }),
  sig('seedot', 'Harden', 'grass', 1, '🌰', { block: 8, ifEnemyAttacks: { blockNext: 4 } }),
  sig('paras', 'X-Scissor', 'grass', 1, '✂️', { damage: 5, hits: 2, ifSeeded: { weaken: 1 } }),
  sig('bellsprout', 'Wrap', 'grass', 1, '🌱', { damage: 4, ifSeeded: { seed: 3 } }),
  sig('cherubi', 'Morning Sun', 'grass', 1, '🌅', { heal: 6, ifHurt: { draw: 2 } }),
  sig('tangela', 'Constrict', 'grass', 1, '🪢', { sap: 3, ifSeeded: { sap: 2 } }),
  sig('cacturne', 'Sucker Punch', 'grass', 1, '🌵', { damage: 5, ifEnemyAttacks: { bonus: 5, seed: 1 } }),
  sig('maractus', 'Pin Missile', 'grass', 1, '📌', { damage: 3, hits: 3, ifWeak: { hits: 1 } }),
  // Fire
  sig('vulpix', 'Weather Ball', 'fire', 1, '☀️', { burn: 4, ifBurned: { draw: 2 } }),
  sig('growlithe', 'Crunch', 'normal', 1, '🐕', { damage: 8, ifVulnerable: { draw: 1 } }),
  sig('pansear', 'Fling', 'fire', 1, '🍒', { damage: 8, ifDiscarded: { burn: 3 } }),
  sig('litwick', 'Hex', 'fire', 1, '🕯️', { damage: 5, ifBurned: { bonus: 3, weaken: 1 } }),
  sig('houndour', 'Foul Play', 'normal', 1, '😈', { burn: 3, steal: 1 }),
  sig('darumaka', 'Belly Drum', 'normal', 1, '🥁', { strength: 2, ifHurt: { strength: 1 } }, { exhaust: true }),
  sig('torkoal', 'Protect', 'normal', 1, '🛡️', { guard: true, burn: 2 }, { exhaust: true }),
  sig('magmar', 'Smog', 'fire', 1, '🌫️', { burn: 2, sap: 2 }),
  sig('heatmor',    'Hone Claws',     'normal', 0, '🔪', { strength: 1, draw: 1 }, { exhaust: true }),
  // Water
  sig('poliwag', 'Wake-Up Slap', 'normal', 1, '👋', { damage: 6, ifWeak: { tide: 2 } }),
  sig('psyduck', 'Zen Headbutt', 'water', 2, '🦆', { damage: 13, ifBuffed: { tide: 3 } }),
  sig('marill', 'Rollout', 'water', 1, '🔵', { damage: 4, tide: 1 }, { retain: true, growOnRetain: { damage: 3 } }),
  sig('krabby', 'Vice Grip', 'normal', 1, '🦀', { damage: 6, ifEnemyAttacks: { block: 6 } }),
  sig('shellos', 'Mud-Slap', 'water', 0, '🟤', { weaken: 1, ifAttacked: { tide: 2 } }),
  sig('staryu', 'Power Gem', 'water', 1, '💎', { damage: 7, ifAfterSkill: { tide: 2 } }),
  sig('slowpoke',   'Slack Off',      'normal', 1, '🥱', { heal: 7 }, { retain: true }),
  sig('crawdaunt',  'Night Slash',    'water', 1, '🌙', { damage: 10 }, { retain: true }),
  sig('sharpedo', 'Ice Fang', 'water', 1, '🦈', { damage: 8, ifBuffed: { vulnerable: 1, tide: 1 } }),
  // the Safari Zone's own Pokémon carry theirs on their data line (js/data/safari-mons.js); the card's type is the Pokémon's
  ...SAFARI_MONS.map(m => { const [name, cost, art, effects, more = {}] = m.sig; return sig(m.id, name, m.type, cost, art, effects, more); }),
];
/** A Pokémon's signature card (by its ENEMY_DEFS id), offered when it's caught in the Safari Zone; null if it has none. */
export const SIGNATURE_FOR = Object.fromEntries(SIGNATURE_CARDS.map(c => [c.from, c.id]));

/** Every card you can be offered (the Card index lists these), and a lookup by id of every card there is,
    upgraded ones included: CARDS_BY_ID['ember'], CARDS_BY_ID['ember+']. */
export const ALL_CARDS = [
  ...NEUTRAL_CARDS, ...FIRE_CARDS, ...GRASS_CARDS, ...WATER_CARDS, ...PSYCHIC_CARDS, ...ELECTRIC_CARDS, ...ICE_CARDS, ...FIGHTING_CARDS, ...GROUND_CARDS, ...FLYING_CARDS, ...DARK_CARDS,
  ...FIRE_EVO_MID, ...FIRE_EVO_HIGH, ...GRASS_EVO_MID, ...GRASS_EVO_HIGH, ...WATER_EVO_MID, ...WATER_EVO_HIGH,
  ...PSYCHIC_EVO_MID, ...PSYCHIC_EVO_HIGH, ...ELECTRIC_EVO_MID, ...ELECTRIC_EVO_HIGH,
  ...ICE_EVO_MID, ...ICE_EVO_HIGH, ...FIGHTING_EVO_MID, ...FIGHTING_EVO_HIGH,
  ...GROUND_EVO_MID, ...GROUND_EVO_HIGH, ...FLYING_EVO_MID, ...FLYING_EVO_HIGH, ...DARK_EVO_MID, ...DARK_EVO_HIGH,
];

/* ---------- PP Up: upgraded cards ----------
   An upgraded card is its own card object with the id `<id>+` and the name `<name>+`, so a deck saves as ids
   and everything that looks cards up by id works unchanged. */

export const upgradeId = (id) => `${id}+`;
export const baseId = (id) => id.replace(/\+$/, '');
export const canUpgrade = (card) => !card.upgraded && !card.status;

/** The default upgrade, StS-sized: +3 damage (less per hit on multi-hits) and +3 block; else +3 heal; else +1 of
    the card's first status or buff; powers +1 on their number; anything else costs 1 less (or stops exhausting). */
const UPGRADE_STEPS = [['burn', 2], ['seed', 2], ['static', 2], ['frostbite', 2], ['hail', 2], ['sand', 2], ['fault', 3], ['counter', 2], ['weaken', 1], ['vulnerable', 1], ['sap', 1], ['tide', 1], ['focus', 3], ['strength', 1], ['flex', 2], ['draw', 1]];
const POWER_STEPS = { blockEachTurn: 1, healEachTurn: 1, burnEachTurn: 1, strengthEachTurn: 1, thorns: 2, blaze: 3,
  exhaustBlock: 1, exhaustDraw: 1, discardTide: 1, discardBlock: 1, cardDamage: 1, cardBlock: 1,
  rupture: 1, combust: 2, brutality: 1, drought: 1, cinderDamage: 2, exhaustBurn: 1,
  tideEachTurn: 1, drizzle: 1, riptide: 2, retainN: 1, tideSpendBlock: 1, tideSurge: 1,
  healStrength: 1, attackHeal: 1, attackSeed: 1, debuffDamage: 2, weakEachTurn: 1, weakBlock: 2, strengthHeal: 1,
  staticEachTurn: 1, paraEnergy: 1, switchBlock: 2, switchDraw: 1, thornStatic: 1, energyBlock: 1, switchStatic: 1,
  frostEachTurn: 1, zeroBlock: 1, hailBlock: 2, icicleFrost: 1, hailFrost: 1, thornFrost: 1, hailChipBlock: 2,
  mixBlock: 1, counterEachTurn: 1, followBlock: 1, followCounter: 2, counterBlock: 1, statusBlock: 2, statusHeldBlock: 1,
  faultEachTurn: 1, surfaceDamage: 3, sandAttack: 1, sandFault: 2, digBlock: 1, faultBlock: 1, sandChipBlock: 2, sandWeak: 1,
  evadeDamage: 3, tailwindDamage: 3, emptyDraw: 1, evasionBlock: 1, tailwindBlock: 2, unburdenBlock: 2, emptyBlock: 3,
  stealBlock: 1, punishBlock: 2, intentBlock: 2, disguiseBlock: 1, illusionBlock: 1 };
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

export const CARDS_BY_ID = Object.fromEntries([...ALL_CARDS, ...TOKEN_CARDS, ...STATUS_CARDS, ...SAFARI_ONLY_CARDS, ...SIGNATURE_CARDS].map(c => [c.id, c]));
for (const card of [...ALL_CARDS, ...TOKEN_CARDS, ...SAFARI_ONLY_CARDS, ...SIGNATURE_CARDS]) CARDS_BY_ID[upgradeId(card.id)] = upgraded(card);

const TYPE_SETS = { fire: FIRE_CARDS, grass: GRASS_CARDS, water: WATER_CARDS, psychic: PSYCHIC_CARDS, electric: ELECTRIC_CARDS, ice: ICE_CARDS, fighting: FIGHTING_CARDS, ground: GROUND_CARDS, flying: FLYING_CARDS, dark: DARK_CARDS };
// Keyed by the evolution STAGE you're reaching: 1 = your first evolution (mid tier),
// 2 = your final evolution (high tier).
const EVO_SETS = {
  fire:  { 1: FIRE_EVO_MID,  2: FIRE_EVO_HIGH },
  grass: { 1: GRASS_EVO_MID, 2: GRASS_EVO_HIGH },
  water: { 1: WATER_EVO_MID, 2: WATER_EVO_HIGH },
  psychic: { 1: PSYCHIC_EVO_MID, 2: PSYCHIC_EVO_HIGH },
  electric: { 1: ELECTRIC_EVO_MID, 2: ELECTRIC_EVO_HIGH },
  ice: { 1: ICE_EVO_MID, 2: ICE_EVO_HIGH },
  fighting: { 1: FIGHTING_EVO_MID, 2: FIGHTING_EVO_HIGH },
  ground: { 1: GROUND_EVO_MID, 2: GROUND_EVO_HIGH },
  flying: { 1: FLYING_EVO_MID, 2: FLYING_EVO_HIGH },
  dark: { 1: DARK_EVO_MID, 2: DARK_EVO_HIGH },
};

/** The cards a starter of this type can win as rewards: its own type + neutral cards. A Duo Run's (`duo`) also offers
    the cards that only make sense with a partner (`duo: true`, Baton Pass). */
export function poolForType(type, duo = false) {
  return [...TYPE_SETS[type], ...NEUTRAL_CARDS].filter(c => !c.noOffer && (duo || !c.duo));
}

/** Only your type's own reward cards (Metronome's random card). */
export function typePool(type) {
  return TYPE_SETS[type] || [];
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

/** Each evolution stage adds this much to every Burn and Leech Seed a card applies (flat, since they're small numbers). */
export const STAGE_STATUS = { burn: 1, seed: 0 };   // seed 0 since 2026-10-16: +2 Leech Seed a card at stage 2 (Worry Seed 3 -> 5) took a plain deck from 0% to 97% against Level 5's last bosses

/** A card's effects after applying the evolution bonus (stage 0 = unchanged). */
export function scaledEffects(card, stage = 0) {
  const e = { ...card.effects };
  const k = 1 + STAGE_POWER * stage;
  for (const key of ['damage', 'bonusIfLow', 'block', 'heal', 'focus', 'focusEachTurn', 'blockEachTurn', 'healEachTurn', 'thorns', 'blaze', 'exhaustBlock', 'discardBlock', 'cardBlock', 'perExhausted', 'blockPerExhausted', 'combust', 'blockPerTide', 'blockPerCard', 'blockNext', 'riptide', 'weakBlock', 'debuffDamage']) {
    if (e[key]) e[key] = Math.round(e[key] * k);
  }
  if (e.burn) e.burn += Math.floor(STAGE_STATUS.burn * stage);
  if (e.seed) e.seed += Math.floor(STAGE_STATUS.seed * stage);
  return e;
}

/**
 * The power effects: what each one does at full strength, and the badge it shows
 * on your nameplate while it's switched on (battle.js adds up every power you play).
 */
/** The Power Lens shown when a power card is played, in the starter's colours (purple for any other type). */
export const POWER_LENS = { fire: '🟧', grass: '🟩', water: '🟦', psychic: '🟪', electric: '🟨', ice: '🟦', fighting: '🟫', ground: '🟫', flying: '🟦', dark: '⬛' };

/** Electric Seed and Ice Core give half their stack a copy (2026-10-20), so two copies give it whole. */
const halfOf = (n, what) => (n === 1 ? `half ${what}` : `${what}${n > 2 ? ` x${n / 2}` : ''}`);

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
  rupture:          { icon: '😡', text: (n) => `Whenever a card makes you lose HP, your hits deal +${n} all fight.` },
  combust:          { icon: '💥', text: (n) => `At the end of your turn, lose 1 HP and deal ${n} damage.` },
  brutality:        { icon: '🩸', text: (n) => `At the start of your turn, lose ${n} HP and draw ${plural(n, 'card')}.` },
  corruption:       { icon: '🔵', flag: true, text: () => 'Your cards that aren\'t attacks or powers cost 0, but exhaust when played.' },
  drought:          { icon: '🌞', text: (n) => `Whenever you Burn the enemy, Burn it ${n} more.` },
  cinderDamage:     { icon: '⭐', text: (n) => `Your Cinders deal +${n} damage.` },
  exhaustBurn:      { icon: '♨️', text: (n) => `Whenever a card exhausts, Burn the enemy ${n}.` },
  tideEachTurn:     { icon: '⏫', text: (n) => `At the start of each turn, gain ${n} Tide.` },
  drizzle:          { icon: '💦', text: (n) => `Whenever you gain Tide, gain ${n} more.` },
  riptide:          { icon: '🌀', text: (n) => `Whenever you gain block, deal ${n} damage.` },
  retainN:          { icon: '🔒', text: (n) => `At the end of your turn, keep ${plural(n, 'more card')} in your hand.` },
  tideSpendBlock:   { icon: '⛲', text: (n) => `Whenever you spend Tide, gain ${n} block per Tide spent.` },
  retainDiscount:   { icon: '🏷️', text: (n) => `Whenever a card stays in your hand at the end of your turn, it costs ${n} less this fight.` },
  tideSurge:        { icon: '🧿', text: (n) => `At the start of each turn, gain ${n} Tide, then 1 more each turn after.` },
  overheal:         { icon: '🌸', flag: true, text: () => 'Healing past your max HP becomes block.' },
  healStrength:     { icon: '🍀', text: (n) => `Whenever you heal (once a turn), your hits deal +${n} all fight.` },
  seedKeep:         { icon: '🌳', flag: true, text: () => 'Leech Seed on the enemy no longer drops.' },
  attackHeal:       { icon: '🦷', text: (n) => `Whenever your attack deals damage, heal ${n} HP.` },
  attackSeed:       { icon: '🌿', text: (n) => `Whenever a hit of yours gets through, Leech Seed ${n}.` },
  debuffDamage:     { icon: '🍄', text: (n) => `Whenever you apply a debuff, deal ${n} damage.` },
  weakEachTurn:     { icon: '💨', text: (n) => `At the start of each turn, apply ${n} Weak.` },
  weakBlock:        { icon: '🍃', text: (n) => `Whenever you apply Weak, gain ${n} block.` },
  strengthHeal:     { icon: '🌰', text: (n) => `Whenever you gain strength, heal ${n} HP.` },
  statusDamage:     { icon: '👹', text: (n) => `Whenever you draw a status card, deal ${n} damage.` },
  burnKeep:         { icon: '🏜️', flag: true, text: () => 'Burn on the enemy no longer drops.' },
  strengthBlock:    { icon: '🌳', text: (n) => `At the end of your turn, gain block equal to your strength${n > 1 ? ` x${n}` : ''}.` },
  focusEachTurn:    { icon: '🧘', text: (n) => `At the start of each turn, your next attack deals +${n} damage.` },
  focusKeep:        { icon: '🌈', flag: true, text: () => 'Focus is no longer used up: every attack adds it.' },
  staticEachTurn:   { icon: '🟨', text: (n) => `At the start of each turn, Static ${n}.` },
  paraEnergy:       { icon: '🗼', text: (n) => `Whenever the enemy is Paralyzed, gain ${n} energy next turn.` },
  attackStatic:     { icon: '🌐', text: (n) => `Whenever a hit of yours gets through, Static ${n}.` },
  energyEachTurn:   { icon: '🔆', text: (n) => `At the start of each turn, gain ${n} energy.` },
  keepEnergy:       { icon: '🔋', flag: true, text: () => 'Energy you don\'t spend carries over to your next turn.' },
  switchBlock:      { icon: '🔗', text: (n) => `Whenever you switch, gain ${n} block.` },
  switchDraw:       { icon: '⚙️', text: (n) => `Whenever you switch, draw ${plural(n, 'card')}.` },
  switchStrength:   { icon: '➕', text: (n) => `Whenever you switch, your hits deal +${n} all fight.` },
  thornStatic:      { icon: '🪼', text: (n) => `Whenever the enemy attacks you, Static ${n}.` },
  staticBlock:      { icon: '🌰', text: (n) => `At the start of each turn, gain block equal to ${halfOf(n, "the enemy's Static")}.` },
  energyBlock:      { icon: '🌀', text: (n) => `At the end of your turn, gain ${n} block for each energy left.` },
  switchWeak:       { icon: '🎯', text: (n) => `Whenever you switch, apply ${n} Weak.` },
  switchStatic:     { icon: '🔩', text: (n) => `Whenever you switch, Static ${n}.` },
  switchSap:        { icon: '➖', text: (n) => `Whenever you switch, apply ${n} Sap.` },
  frostEachTurn:    { icon: '🌡️', text: (n) => `At the start of each turn, Frostbite ${n}.` },
  frostKeep:        { icon: '🏔️', flag: true, text: () => 'Frostbite no longer thaws.' },
  zeroBlock:        { icon: '🧊', text: (n) => `Whenever you play a 0-cost card, gain ${n} block.` },
  icicleFrost:      { icon: '🧥', text: (n) => `Whenever you play an Icicle card, Frostbite ${n}.` },
  hailDraw:         { icon: '🏂', text: (n) => `In Hail, draw ${plural(n, 'more card')} each turn.` },
  hailBlock:        { icon: '⛄', text: (n) => `At the start of each turn in Hail, gain ${n} block.` },
  hailFrost:        { icon: '🦣', text: (n) => `Whenever Hail hurts the enemy, Frostbite ${n}.` },
  thornFrost:       { icon: '🦋', text: (n) => `Whenever the enemy attacks you, Frostbite ${n}.` },
  frostBlock:       { icon: '💙', text: (n) => `At the start of each turn, gain block equal to ${halfOf(n, "the enemy's Frostbite")}.` },
  hailChipBlock:    { icon: '🌀', text: (n) => `Whenever Hail hurts the enemy, gain ${n} block.` },
  hailIcicle:       { icon: '🏔️', text: (n) => `Whenever Hail hurts the enemy, add ${n > 1 ? `${n} Icicles` : 'an Icicle'} to your hand.` },
  icicleEachTurn:   { icon: '👑', text: (n) => `At the start of each turn, add ${n > 1 ? `${n} Icicles` : 'an Icicle'} to your hand.` },
  retainZero:       { icon: '🗄️', flag: true, text: () => 'Your 0-cost cards stay in your hand at the end of your turn.' },
  hailKeep:         { icon: '☃️', flag: true, text: () => 'Hail no longer runs out.' },
  mixBlock:         { icon: '🔥', text: (n) => `Whenever you play an attack after a skill, or a skill after an attack, gain ${n} block.` },
  counterEachTurn:  { icon: '🧘', text: (n) => `At the start of each turn, Counter ${n}.` },
  hurtStrength:     { icon: '💥', text: (n) => `Whenever an enemy attack takes your HP, gain ${n} strength.` },
  statusDraw:       { icon: '🗿', text: (n) => `Whenever you draw a status card, draw ${plural(n, 'card')}.` },
  statusStrength:   { icon: '😠', text: (n) => `Whenever a status card is exhausted, gain ${n} strength.` },
  followAlways:     { icon: '🦾', flag: true, text: () => 'Every Follow-up happens, whatever you played before it.' },
  followBlock:      { icon: '🧠', text: (n) => `Whenever a Follow-up happens, gain ${n} block.` },
  followCounter:    { icon: '🙌', text: (n) => `Whenever a Follow-up happens, Counter ${n}.` },
  counterBlock:     { icon: '⚖️', text: (n) => `Whenever your Counter hits back, gain ${n} block next turn.` },
  statusBlock:      { icon: '✊', text: (n) => `Whenever a status card is exhausted, gain ${n} block.` },
  statusHeldBlock:  { icon: '😣', text: (n) => `At the start of each turn, gain ${n} block for each status card in your hand.` },
  counterKeep:      { icon: '🪨', flag: true, text: () => 'Your Counter no longer goes away at the start of your turn.' },
  surfaceDraw:      { icon: '🐜', text: (n) => `Whenever a card surfaces, draw ${plural(n, 'card')}.` },
  surfaceDamage:    { icon: '🪏', text: (n) => `Whenever a card surfaces, deal ${n} damage.` },
  faultEachTurn:    { icon: '⏬', text: (n) => `At the start of each turn, Fault ${n}.` },
  sandAttack:       { icon: '💪', text: (n) => `In Sandstorm, your attacks deal +${n} damage a hit.` },
  sandEachTurn:     { icon: '⏳', text: (n) => `At the start of each turn, Sandstorm ${n}.` },
  sandFault:        { icon: '🐉', text: (n) => `Whenever Sandstorm hurts the enemy, Fault ${n}.` },
  digBlock:         { icon: '🦊', text: (n) => `Whenever a card goes underground, gain ${n} block.` },
  faultBlock:       { icon: '🗺️', text: (n) => `Whenever you apply Fault, gain ${n} block.` },
  sandChipBlock:    { icon: '🧱', text: (n) => `Whenever Sandstorm hurts the enemy, gain ${n} block.` },
  sandWeak:         { icon: '😵', text: (n) => `Whenever Sandstorm hurts the enemy, apply ${n} Weak.` },
  sandKeep:         { icon: '♾️', flag: true, text: () => 'Sandstorm no longer runs out.' },
  evadeDamage:      { icon: '💨', text: (n) => `Whenever Evasion halves a hit, deal ${n} damage.` },
  evasionEachTurn:  { icon: '🧱', text: (n) => `At the start of each turn, Evasion ${n}.` },
  tailwindDamage:   { icon: '🏄', text: (n) => `At the start of each turn in Tailwind, deal ${n} damage.` },
  tailwindEvasion:  { icon: '🩰', text: (n) => `At the start of each turn in Tailwind, Evasion ${n}.` },
  emptyDraw:        { icon: '🎈', text: (n) => `The first time your hand empties each turn, draw ${plural(n, 'card')}.` },
  evasionBlock:     { icon: '🐤', text: (n) => `Whenever you gain Evasion, gain ${n} block.` },
  evadeWeak:        { icon: '🌬️', text: (n) => `Whenever Evasion halves a hit, apply ${n} Weak.` },
  evadeSap:         { icon: '🫧', text: (n) => `Whenever Evasion halves a hit, apply Sap ${n}.` },
  tailwindBlock:    { icon: '🛫', text: (n) => `At the start of each turn in Tailwind, gain ${n} block.` },
  tailwindKeep:     { icon: '♾️', flag: true, text: () => 'Tailwind no longer runs out.' },
  unburdenBlock:    { icon: '🐓', text: (n) => `Whenever an Unburden happens, gain ${n} block.` },
  emptyBlock:       { icon: '🎐', text: (n) => `The first time your hand empties each turn, gain ${n} block.` },
  mirrorStrength:   { icon: '👛', text: (n) => `Whenever the enemy gains strength, your hits deal +${n} all fight.` },
  punishDamage:     { icon: '😰', text: (n) => `Whenever a Punish happens, deal ${n} damage.` },
  punishDraw:       { icon: '🃏', text: (n) => `At the start of each turn, if the enemy intends to attack, draw ${plural(n, 'card')}.` },
  mirage:           { icon: '🌫️', flag: true, text: () => 'Your Dark cards are Illusions. At the start of each turn, Disguise.' },
  stealBlock:       { icon: '🍯', text: (n) => `Whenever you Steal, gain ${n} block.` },
  punishBlock:      { icon: '🗡️', text: (n) => `Whenever a Punish happens, gain ${n} block.` },
  intentBlock:      { icon: '🔦', text: (n) => `At the start of each turn, if the enemy intends to attack, gain ${n} block.` },
  intentWeak:       { icon: '😤', text: (n) => `At the start of each turn, if the enemy intends to attack, apply ${n} Weak.` },
  stealEachTurn:    { icon: '🪄', text: (n) => `At the start of each turn, Steal ${n}.` },
  disguiseBlock:    { icon: '👘', text: (n) => `Whenever you Disguise, gain ${n} block.` },
  disguiseWeak:     { icon: '🎭', text: (n) => `Whenever you Disguise, apply ${n} Weak.` },
  illusionBlock:    { icon: '🪞', text: (n) => `Whenever you play an Illusion card, gain ${n} block.` },
  regen:            { icon: '🍫', text: (n) => `At the start of each turn, heal ${n} HP.` },   // only an item gives it (Sweet Heart)
};

const xLabel = (e) => (e.xPlus ? `X+${e.xPlus}` : 'X');
const plural = (n, word) => `${n} ${word}${n > 1 ? 's' : ''}`;
const PILES = { hand: 'your hand', draw: 'your draw pile', discard: 'your discard pile' };
const TIMES = { 2: 'twice', 3: 'three times', 4: 'four times' };
const MULT = { 2: 'Double', 3: 'Triple' };

/** The sentences for a set of effects (a card's, or its combo / onExhaust / onDiscard extras). */
function sentences(e) {
  const parts = [];
  if (e.selfDamage)   parts.push(`Lose ${e.selfDamage} HP.`);
  if (e.exhaustHand)  parts.push({ all: 'Exhaust your hand.', status: 'Exhaust every status card in your hand.' }[e.exhaustHand] ?? 'Exhaust every non-attack in your hand.');
  const times = e.perX?.hits ? ` ${xLabel(e)} times` : e.hitsPerAttack ? ' for each attack you\'ve played this turn'
    : e.hitsPerExhausted ? ' for each card exhausted' : e.hits > 1 ? ` ${e.hits} times` : '';
  if (e.damage)       parts.push(`Deal ${e.damage} damage${times}.`);
  if (e.blockDamage) {
    const share = e.blockDamage === true ? 'your block' : e.blockDamage === 0.5 ? 'half your block' : e.blockDamage === 0.75 ? 'three quarters of your block' : `${e.blockDamage} times your block`;
    parts.push(e.block ? `Gain ${e.block} block, then deal damage equal to ${share}${times}.` : `Deal damage equal to ${share}${times}.`);
  }
  if (e.bonus)        parts.push(`+${e.bonus} damage.`);
  if (e.perExhausted) parts.push(`+${e.perExhausted} for each card exhausted.`);
  if (e.perTide)      parts.push(`+${e.perTide} per Tide, then spend all your Tide.`);
  if (e.perTideHeld)  parts.push(`+${e.perTideHeld} per Tide (it isn't spent).`);
  if (e.perTideGained) parts.push(`+${e.perTideGained} for each Tide you've gained this fight.`);
  if (e.bonusIfLow)   parts.push(`+${e.bonusIfLow} if your HP is below half.`);
  if (e.bonusPerBurn) parts.push(`+${e.bonusPerBurn} for each Burn on the enemy.`);
  if (e.perPlayed)    parts.push(`+${e.perPlayed} for each other card you've played this turn.`);
  if (e.perDiscard)   parts.push(`+${e.perDiscard} for each card you've discarded this turn.`);
  if (e.perDebuff)    parts.push(`+${e.perDebuff} for each kind of debuff on the enemy.`);
  if (e.perStatic)    parts.push(`+${e.perStatic} for each Static on the enemy.`);
  if (e.perSwitch)    parts.push(`+${e.perSwitch} for each time you've switched this fight.`);
  if (e.perFrost)     parts.push(`+${e.perFrost} for each Frostbite on the enemy.`);
  if (e.thaw)         parts.push('Then remove all its Frostbite.');
  if (e.perUnder)     parts.push(`+${e.perUnder} for each card underground.`);
  if (e.perEvasion)   parts.push(`+${e.perEvasion} for each Evasion you have.`);
  if (e.perTailwind)  parts.push(`+${e.perTailwind} for each turn of Tailwind left.`);
  if (e.perFault)     parts.push(`+${e.perFault} for each Fault on the enemy.`);
  if (e.perIllusion)  parts.push(`+${e.perIllusion} for each other Illusion card you've played this turn.`);
  if (e.perIntent)    parts.push('+ the damage its attack would deal you.');
  if (e.perLost)      parts.push(`+${e.perLost} for each HP you lost last enemy turn.`);
  if (e.perStatusHeld) parts.push(`+${e.perStatusHeld} for each status card in your hand.`);
  if (e.hits && !e.damage && !e.blockDamage) parts.push(e.hits > 1 ? `It hits ${e.hits} more times.` : 'It hits once more.');
  if (e.strengthMult) parts.push(`Strength counts ${e.strengthMult} times.`);
  if (e.burn)         parts.push(e.burnTimes > 1 ? `Burn ${e.burn}, ${TIMES[e.burnTimes] ?? `${e.burnTimes} times`}.` : `Burn ${e.burn}.`);
  if (e.burnMult)     parts.push(`${MULT[e.burnMult] ?? `Multiply by ${e.burnMult}`} the enemy's Burn.`);
  if (e.seedMult)     parts.push(`${MULT[e.seedMult] ?? `Multiply by ${e.seedMult}`} the enemy's Leech Seed.`);
  if (e.weaken)       parts.push(`Apply ${e.weaken} Weak.`);
  if (e.vulnerable)   parts.push(`Apply ${e.vulnerable} Vulnerable.`);
  if (e.seed)         parts.push(`Leech Seed ${e.seed}.`);
  if (e.static)       parts.push(`Static ${e.static}.`);
  if (e.frostbite)    parts.push(`Frostbite ${e.frostbite}.`);
  if (e.frostMult)    parts.push(`${MULT[e.frostMult] ?? `Multiply by ${e.frostMult}`} the enemy's Frostbite.`);
  if (e.hail)         parts.push(`Hail ${e.hail}.`);
  if (e.sand)         parts.push(`Sandstorm ${e.sand}.`);
  if (e.evasion)      parts.push(`Evasion ${e.evasion}.`);
  if (e.tailwind)     parts.push(`Tailwind ${e.tailwind}.`);
  if (e.steal)        parts.push(`Steal ${e.steal}.`);
  if (e.taunt)        parts.push('The enemy\'s intent becomes its next attack.');
  if (e.fault)        parts.push(`Fault ${e.fault}.`);
  if (e.faultMult)    parts.push(`${MULT[e.faultMult] ?? `Multiply by ${e.faultMult}`} the enemy's Fault.`);
  if (e.bide)         parts.push(`Store the HP you lose over the next ${e.bide} enemy turns, then deal twice that.`);
  if (e.staticMult)   parts.push(`${MULT[e.staticMult] ?? `Multiply by ${e.staticMult}`} the enemy's Static.`);
  if (e.sap)          parts.push(`Apply ${e.sap} Sap.`);
  if (e.tempSap)      parts.push(`The enemy's attacks deal ${e.tempSap} less this turn.`);
  if (e.skipEnemy)    parts.push('The enemy skips its next turn.');
  if (e.guard)        parts.push('Block the enemy\'s next attack completely.');
  if (e.block && !e.blockDamage) parts.push(`Gain ${e.block} block.`);
  if (e.counter)      parts.push(`Counter ${e.counter}.`);
  if (e.disguise)     parts.push('Disguise.');
  if (e.copyPartner)  parts.push('Add a copy of the last card your partner played this turn to your hand (alone: your last card). It\'s an Illusion.');
  if (e.counterPerStatus) parts.push(`+${e.counterPerStatus} Counter for each status card in your hand.`);
  if (e.counterPerLost) parts.push(`Counter ${TIMES[e.counterPerLost] ?? `${e.counterPerLost} times`} the HP you lost last enemy turn.`);
  if (e.blockMult)    parts.push(`${MULT[e.blockMult] ?? `Multiply by ${e.blockMult}`} your block.`);
  if (e.blockPerTide) parts.push(e.perTide ? `Gain ${e.blockPerTide} block per Tide spent.` : `Gain ${e.blockPerTide} block per Tide, then spend all your Tide.`);
  if (e.blockPerStatic) parts.push(`+${e.blockPerStatic} block for each Static on the enemy.`);
  if (e.blockPerSwitch) parts.push(`+${e.blockPerSwitch} block for each time you've switched this fight.`);
  if (e.blockPerFrost) parts.push(`+${e.blockPerFrost} block for each Frostbite on the enemy.`);
  if (e.blockPerIcicle) parts.push(`+${e.blockPerIcicle} block for each Icicle card you've played this fight.`);
  if (e.blockPerLost) parts.push(`+${e.blockPerLost} block for each HP you lost last enemy turn.`);
  if (e.blockPerStatusHeld) parts.push(`+${e.blockPerStatusHeld} block for each status card in your hand.`);
  if (e.blockPerUnder) parts.push(`+${e.blockPerUnder} block for each card underground.`);
  if (e.blockPerFault) parts.push(`+${e.blockPerFault} block for each Fault on the enemy.`);
  if (e.blockPerEvasion) parts.push(`${e.block ? '+' : 'Gain '}${e.blockPerEvasion} block for each Evasion you have${e.evasion ? ', this card\'s too' : ''}.`);
  if (e.blockPerTailwind) parts.push(`+${e.blockPerTailwind} block for each turn of Tailwind left.`);
  if (e.blockPerStrength) parts.push(`${e.block ? '+' : 'Then gain '}${e.blockPerStrength} block for each strength you have.`);
  if (e.blockPerIllusion) parts.push(`+${e.blockPerIllusion} block for each other Illusion card you've played this turn.`);
  if (e.blockIntent)  parts.push(`${e.block ? '+' : 'Gain'} block equal to the damage its attack would deal you.`);
  if (e.blockPerCard) parts.push(`Gain ${e.blockPerCard} block for each card in your hand.`);
  if (e.blockNext)    parts.push(`Next turn, gain ${e.blockNext} block.`);
  if (e.blockFault)   parts.push('Then apply Fault equal to your block.');
  if (e.blur)         parts.push('Your block doesn\'t wear off at the start of your next turn.');
  if (e.blockPerExhausted) parts.push(`Gain ${e.blockPerExhausted} block for each card exhausted.`);
  if (e.heal)         parts.push(`Heal ${e.heal} HP.`);
  if (e.healDealt)    parts.push('Heal the damage that gets through.');
  if (e.healPerStrength) parts.push(`Heal ${e.healPerStrength} HP for each strength you have.`);
  if (e.healPerSeed)  parts.push(`Heal ${e.healPerSeed} HP for each Leech Seed on the enemy.`);
  if (e.feed)         parts.push(`If this knocks the enemy out, gain ${e.feed} max HP.`);
  if (e.strength)     parts.push(`Your hits deal +${e.strength} all fight.`);
  if (e.flex)         parts.push(`Your hits deal +${e.flex} this turn.`);
  if (e.doubleStrength) parts.push('Double your strength.');
  if (e.focus)        parts.push(`Your next attack deals +${e.focus} damage.`);
  if (e.energy)       parts.push(`Gain ${e.energy} energy.`);
  if (e.energyMult)   parts.push(`${MULT[e.energyMult] ?? `Multiply by ${e.energyMult}`} your energy.`);
  if (e.energyPer)    parts.push(`Gain 1 energy for every ${e.energyPer} cards in your draw pile.`);
  if (e.discardHand) {
    parts.push('Discard your hand.');
    const each = e.perDiscarded || {};
    if (each.draw) parts.push(`Draw ${plural(each.draw, 'card')} for each.`);
    if (each.addCard) parts.push(`Add a ${CARDS_BY_ID[each.addCard.id]?.name ?? each.addCard.id} to your hand for each.`);
  }
  if (e.reshuffle)    parts.push('Shuffle your discard pile into your draw pile.');
  if (e.draw)         parts.push(`Draw ${plural(e.draw, 'card')}.`);
  if (e.drawTo)       parts.push(`Draw until you have ${e.drawTo} cards.`);
  if (e.drawPerDebuff) parts.push(`Draw ${plural(e.drawPerDebuff, 'card')} for each kind of debuff on the enemy.`);
  if (e.discard)      parts.push(`Discard ${plural(e.discard, 'card')}.`);
  if (e.exhaustPick)  parts.push(`Exhaust ${plural(e.exhaustPick, 'card')} from your hand.`);
  if (e.playTop)      parts.push(e.playTop > 1 ? `Play the top ${e.playTop} cards of your draw pile and exhaust them.` : 'Play the top card of your draw pile and exhaust it.');
  if (e.exhume)       parts.push('Put a card from your exhaust pile into your hand.');
  if (e.sketch)       parts.push('Choose a card in your draw pile and put it into your hand.');
  if (e.returnCard)   parts.push('Put a card from your discard pile on top of your draw pile.');
  if (e.returnZero)   parts.push('Put every 0-cost card in your discard pile into your hand.');
  if (e.upgradeAll)   parts.push('PP Up every card in your deck for the rest of this fight.');
  if (e.echo)         parts.push(e.echo > 1 ? `Your next card this turn is played ${e.echo + 1} times.` : 'Your next card this turn is played twice.');
  if (e.payDay)       parts.push(`If this knocks the enemy out, gain ${e.payDay} ₽.`);
  if (e.tide)         parts.push(`Gain ${e.tide} Tide.`);
  if (e.tideMult)     parts.push(`${MULT[e.tideMult] ?? `Multiply by ${e.tideMult}`} your Tide.`);
  if (e.nextEnergy)   parts.push(e.nextEnergy > 0 ? `+${e.nextEnergy} energy next turn.` : `${-e.nextEnergy} less energy next turn.`);
  if (e.copyPick)     parts.push(`Choose a card in your hand. Add ${e.copyPick > 1 ? `${e.copyPick} copies` : 'a copy'} of it to your hand.`);
  if (e.randomCard)   parts.push('Add a random card of your type to your hand. It costs 0 this turn.');
  if (e.endure)       parts.push('Until your next turn, you can\'t drop below 1 HP.');
  if (e.switch)       parts.push('Switch.');
  if (e.addCard) {
    const { id, n = 1, to = 'hand' } = e.addCard;
    const name = CARDS_BY_ID[id]?.name ?? id;
    const some = n > 1 ? `${n} ${/s$/.test(name) ? `${name} cards` : `${name}s`}` : `a ${name}`;
    parts.push(to === 'draw' ? `Shuffle ${some} into your draw pile.` : `Add ${some} to ${PILES[to]}.`);
  }
  for (const [key, power] of Object.entries(POWERS)) if (e[key]) parts.push(power.text(e[key]));
  if (e.bait)         parts.push(`Throw Bait${e.bait > 1 ? ` x${e.bait}` : ''}: it's easier to catch, but hits harder.`);
  if (e.rock)         parts.push('It may run off.');
  if (e.endTurnHurt)  parts.push(`Lose ${e.endTurnHurt} HP if in hand at turn end.`);
  if (e.needsWounded) parts.push('Only playable if you are hurt.');
  if (e.needsEmptyDraw) parts.push('Only playable when your draw pile is empty.');
  if (e.ifBurned)     parts.push(`If the enemy is Burned: ${sentences(e.ifBurned).join(' ')}`);
  if (e.ifHurt)       parts.push(`If you've lost HP this turn: ${sentences(e.ifHurt).join(' ')}`);
  if (e.costDownOnHurt) parts.push(`Costs ${e.costDownOnHurt} less for each time you've lost HP this fight.`);
  if (e.ifDiscarded)  parts.push(`If you've discarded a card this turn: ${sentences(e.ifDiscarded).join(' ')}`);
  if (e.costDownOnDiscard) parts.push(`Costs ${e.costDownOnDiscard} less for each card you've discarded this turn.`);
  if (e.ifWeak)       parts.push(`If the enemy is Weak: ${sentences(e.ifWeak).join(' ')}`);
  if (e.ifVulnerable) parts.push(`If the enemy is Vulnerable: ${sentences(e.ifVulnerable).join(' ')}`);
  if (e.ifSeeded)     parts.push(`If the enemy has Leech Seed: ${sentences(e.ifSeeded).join(' ')}`);
  if (e.ifHealed)     parts.push(`If you've healed this turn: ${sentences(e.ifHealed).join(' ')}`);
  if (e.ifEnemyAttacks) parts.push(`If the enemy intends to attack: ${sentences(e.ifEnemyAttacks).join(' ')}`);
  if (e.ifFull)       parts.push(`If the enemy will be Paralyzed: ${sentences(e.ifFull).join(' ')}`);
  if (e.ifSwitched)   parts.push(`If you've switched this turn: ${sentences(e.ifSwitched).join(' ')}`);
  if (e.ifFrost)      parts.push(`If the enemy has Frostbite: ${sentences(e.ifFrost).join(' ')}`);
  if (e.ifHail)       parts.push(`In Hail: ${sentences(e.ifHail).join(' ')}`);
  if (e.ifWeather)    parts.push(`In any weather: ${sentences(e.ifWeather).join(' ')}`);
  if (e.ifAfterAttack) parts.push(`Follow-up (attack): ${sentences(e.ifAfterAttack).join(' ')}`);
  if (e.ifAfterSkill) parts.push(`Follow-up (skill): ${sentences(e.ifAfterSkill).join(' ')}`);
  if (e.ifAttacked)   parts.push(`If the enemy attacked you last turn: ${sentences(e.ifAttacked).join(' ')}`);
  if (e.ifSand)       parts.push(`In Sandstorm: ${sentences(e.ifSand).join(' ')}`);
  if (e.ifFault)      parts.push(`If the enemy has Fault: ${sentences(e.ifFault).join(' ')}`);
  if (e.surface)      parts.push(`Dig. Surface: ${sentences(e.surface).join(' ')}`);
  if (e.ifEvasion)    parts.push(`If you have Evasion: ${sentences(e.ifEvasion).join(' ')}`);
  if (e.ifTailwind)   parts.push(`In Tailwind: ${sentences(e.ifTailwind).join(' ')}`);
  if (e.ifEmpty)      parts.push(`Unburden: ${sentences(e.ifEmpty).join(' ')}`);
  if (e.ifBuffed)     parts.push(`If the enemy has strength or block: ${sentences(e.ifBuffed).join(' ')}`);
  if (e.punish)       parts.push(`Punish: ${sentences(e.punish).join(' ')}`);
  if (e.ifDisguised)  parts.push(`If you're Disguised: ${sentences(e.ifDisguised).join(' ')}`);
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
  if (card.growOnRetain) {
    const g = card.growOnRetain;
    const grows = [g.damage && `+${g.damage} damage`, g.block && `+${g.block} block`, g.heal && `+${g.heal} heal`].filter(Boolean);
    if (grows.length) parts.push(`Grows ${grows.join(' and ')} each turn it stays.`);
    if (g.discount) parts.push(`Costs ${g.discount} less each turn it stays.`);
  }
  if (card.growOnPlay?.damage) parts.push(`Each time you play it, it deals ${card.growOnPlay.damage} more this fight.`);
  if (card.growOnPlay?.discount) parts.push(`Each time you play it, it costs ${card.growOnPlay.discount} less this fight.`);
  if (card.icicle) parts.push('Icicle.');
  if (card.freeIn === 'hail') parts.push('Costs 0 in Hail.');
  if (card.freeIn === 'tailwind') parts.push('Costs 0 in Tailwind.');
  if (card.illusion) parts.push('Illusion.');
  if (!parts.length && card.status) parts.push(card.exhaust ? 'Does nothing.' : 'Clogs your hand.');
  return parts.join(' ');
}

/** Keywords shown in bold on the card, around describe()'s text: [label, what it means]. */
/** The shared keyword box texts: cards' (cardTerms) and relics' (relicTerms in relics.js) say the same thing. */
export const TERMS = {
  Exhaust: 'Gone for this fight. Back next fight.',
  Discard: 'Hand to discard pile. Turn end doesn\'t count.',
  Tide: 'A stack you build up all fight (your 🌊 badge). "Per Tide" moves get stronger per stack, then use it all up.',
  Burn: 'Damage each enemy turn, then -1.',
  'Leech Seed': 'Drains that much HP each enemy turn, then -1.',
  Sap: 'Enemy attacks deal that much less, all fight.',
  Weak: 'Enemy deals 25% less. Counts down each turn.',
  Vulnerable: 'Enemy takes 50% more. Counts down each turn.',
  Strength: 'Added to every hit you deal.',
  Focus: 'Adds damage to your next attack.',
  Power: 'Lasts all fight. Played once.',
  Static: `Builds up on the enemy. At ${STATIC_CAP.fight} (Alpha ${STATIC_CAP.elite}, boss ${STATIC_CAP.boss}) it's Paralyzed. Lasts all fight.`,
  Paralyzed: `It loses its next move and its Static drops to 0. The next takes ${STATIC_CAP.step} more Static.`,
  Switch: 'Your partner comes out, free. Alone, it still counts as a switch.',
  Frostbite: 'Every hit on the enemy deals +1 per Frostbite. Thaws by 1 each enemy turn.',
  Icicle: `Each Icicle card you play makes every Icicle card deal +${ICICLE_STEP} this fight.`,
  'Follow-up': 'A bonus if your last card this turn was an attack (or a skill, as it says).',
  Counter: 'Until your next turn, each enemy attack takes that much back.',
  Dig: 'Goes underground when played. At the start of your next turn it surfaces and does its Surface part.',
  Fault: 'At the start of its turn, if its HP is at or below its Fault, it\'s knocked out. Alphas and bosses count half.',
  Sandstorm: `Weather. At the end of your turn the enemy loses ${SAND.chip} HP. Your Ground cards block +${SAND.bonus}. Lasts that many turns.`,
  Evasion: 'Each stack halves an enemy attack on you, before your block. Gone at your next turn.',
  Tailwind: 'Draw 1 more card at the start of each of your next that many turns.',
  Unburden: 'A bonus if it\'s the last card in your hand when you play it.',
  Steal: 'The enemy loses that much strength (below 0 too) and you gain what it had. You also take 3 times that of its block.',
  Punish: 'A bonus if the enemy intends to attack this turn.',
  Illusion: 'Counts as your partner\'s type too: it hits as whichever of the two does better (alone: Dark or Neutral).',
  Disguise: 'Until your next turn, enemy attacks hit you as whichever of your two types takes them best (alone: Dark or Neutral).',
  Hail: `Weather. At the end of your turn the enemy loses ${HAIL.chip} HP. Your Ice attacks deal +${HAIL.bonus} a hit. Lasts that many turns.`,
  Bait: 'Catch odds +50% each, its attacks +3 each. All fight.',
  Rock: 'A wild one may run off on its turn (no reward). A rare one leaves sooner.',
};
export const term = (label) => [label, TERMS[label]];

export function keywords(card) {
  return {
    lead: [
      card.unplayable && ['Unplayable', 'Can\'t be played.'],
      card.innate && ['Innate', 'Always in your first hand.'],
      card.power && term('Power'),
      card.retain && ['Retain', 'Stays in your hand at turn end.'],
    ].filter(Boolean),
    tail: [
      card.ethereal && ['Ethereal', 'Exhausted if still in hand at turn end.'],
      card.exhaust && ['Exhaust', 'Gone for this fight once played.'],
    ].filter(Boolean),
  };
}

/** Every effect key a card uses, its nested ones too (combo, perX, ifBurned, onExhaust...), so a term hidden in one still gets its tip. */
function effectKeys(card) {
  const keys = new Set();
  const walk = (obj) => {
    for (const [k, v] of Object.entries(obj || {})) {
      if (v === 0 || v === false || v == null) continue;
      keys.add(k);
      if (typeof v === 'object') walk(v);
    }
  };
  walk(card.effects); walk(card.onExhaust); walk(card.onDiscard);
  return [...keys];
}

/**
 * The terms a card uses, as [label, what it means]: its bold keywords first, then everything its text relies on.
 * They're the keyword boxes beside a blown-up card (cardTips() in ui.js, StS's) and the text's tooltip, so a new
 * mechanic only needs a line here.
 */
export function cardTerms(card) {
  const keys = effectKeys(card);
  const uses = (re) => keys.some(k => re.test(k));
  const e = card.effects;
  const { lead, tail } = keywords(card);
  const terms = [...lead, ...tail,
    card.growOnRetain && ['Retain', 'Stays in your hand at turn end.'],
    uses(/^retain/) && ['Retain', 'A kept card stays in hand at turn end.'],
    (uses(/exhaust|^playTop$|^exhume$|^corruption$/) || card.onExhaust) && term('Exhaust'),
    (uses(/discard/i) || card.onDiscard) && term('Discard'),
    uses(/tide|^drizzle$/i) && term('Tide'),
    uses(/burn|^drought$/i) && term('Burn'),
    uses(/seed/i) && term('Leech Seed'),
    uses(/^sap$|^switchSap$/) && term('Sap'),
    uses(/weak/i) && term('Weak'),
    uses(/vulnerable/i) && term('Vulnerable'),
    uses(/strength|^flex$/i) && term('Strength'),
    uses(/^focus/i) && term('Focus'),
    uses(/static/i) && term('Static'),
    uses(/static|^ifFull$|^paraEnergy$/i) && term('Paralyzed'),
    uses(/switch/i) && term('Switch'),
    uses(/^frostbite$|frost/i) && term('Frostbite'),
    (card.icicle || uses(/icicle/i)) && term('Icicle'),
    (uses(/hail|weather/i) || card.freeIn === 'hail') && term('Hail'),
    uses(/^surface|^perUnder$|^blockPerUnder$|^digBlock$/) && term('Dig'),
    uses(/fault/i) && term('Fault'),
    uses(/^sand|^ifSand$/) && term('Sandstorm'),
    uses(/evasion|^evade(Damage|Weak|Sap)$/i) && term('Evasion'),
    (uses(/tailwind/i) || card.freeIn === 'tailwind') && term('Tailwind'),
    uses(/^ifEmpty$|^empty(Draw|Block)$|^unburdenBlock$/) && term('Unburden'),
    uses(/^steal$|^stealBlock$|^stealEachTurn$/) && term('Steal'),
    uses(/^ifBuffed$|^mirrorStrength$|^blockPerStrength$/) && term('Strength'),
    uses(/^punish|^taunt$|^intent(Block|Weak)$|^blockIntent$/) && term('Punish'),
    (card.illusion || uses(/^perIllusion$|^blockPerIllusion$|^illusionBlock$|^copyPartner$|^mirage$/)) && term('Illusion'),
    uses(/disguise|^mirage$/i) && term('Disguise'),
    uses(/^ifAfter|^followAlways$|^mixBlock$|^follow(Block|Counter)$/) && term('Follow-up'),
    uses(/^counter|^followCounter$/) && term('Counter'),
    uses(/^perStatusHeld$|^statusDraw$|^statusStrength$|^blockPerStatusHeld$|^counterPerStatus$|^statusBlock$|^statusHeldBlock$/) && ['Status cards', 'Junk in your deck for this fight: Sore, and what enemies add.'],
    uses(/^tempSap$/) && ['Charmed', 'Its attacks this turn deal less. Gone after it acts.'],
    uses(/^statusDamage$/) && ['Status cards', 'Junk enemies (and some of your moves) put in your deck, for this fight only.'],
    uses(/^upgradeAll$/) && ['PP Up', 'A card\'s upgraded form (its name gets a +).'],
    card.growOnPlay && (card.growOnPlay.discount ? ['Grows', 'Cheaper each time it\'s played, until the fight ends.'] : ['Grows', 'Stronger each time it\'s played, until the fight ends.']),
    uses(/^bait$/) && term('Bait'),
    uses(/^rock$/) && term('Rock'),
    uses(/debuff/i) && ['Debuffs', 'Weak, Vulnerable, Leech Seed, Sap, Burn.'],
    (uses(/^perX$/) || card.cost === 'X') && ['X', 'Spends all your PP. X is how much.'],
    e.combo && [`Combo ${e.combo.at}`, `Only if you've played ${e.combo.at} other cards this turn.`],
    uses(/^ifHurt$|OnHurt$/) && ['Losing HP', 'Any HP loss counts, even your own.'],
    card.upgraded && ['Upgraded', 'Boosted with PP Up.'],
    ...addedCards(card).map(c => [c.name, madeCardText(c, card)]),
  ].filter(Boolean);
  return terms.filter(([label], i) => terms.findIndex(t => t[0] === label) === i);
}

/** Every card a card makes (addCard, however deep), so a keyword box can say what a Rage or a Paralysis does. */
function addedCards(card) {
  const ids = new Set();
  const walk = (obj) => {
    for (const [k, v] of Object.entries(obj || {})) {
      if (k === 'addCard' && v?.id) ids.add(v.id);
      else if (v && typeof v === 'object') walk(v);
    }
  };
  walk(card.effects); walk(card.onExhaust); walk(card.onDiscard);
  return [...ids].map(id => CARDS_BY_ID[id]).filter(Boolean);
}

function madeCardText(c, card) {
  if (baseId(c.id) === baseId(card.id)) return 'A copy of this card, for this fight only.';
  const { lead, tail } = keywords(c);
  const words = [...lead, ...tail].map(([label]) => `${label}.`);
  const cost = c.unplayable ? '' : `${c.cost} PP. `;
  return `${cost}${[...words, describe(c)].filter(Boolean).join(' ')}`;
}

/** The terms a card's text relies on, beyond its bold keywords (which explain themselves), as its text's tooltip. */
export function termTips(card) {
  const own = new Set([...keywords(card).lead, ...keywords(card).tail].map(([label]) => label));
  return cardTerms(card).filter(([label]) => !own.has(label)).map(([label, text]) => `${label}: ${text}`);
}
