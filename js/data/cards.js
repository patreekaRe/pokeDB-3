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
     growOnRetain  { damage: N } / { heal: N }: each time it stays in your hand at the end of your turn, it
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
  { id: 'iron-defense', name: 'Iron Defense', type: 'normal', cost: 2, art: '🏰', sprite: 'metal-coat', effects: { block: 22 }, exhaust: true, rarity: 'uncommon', upgrade: { effects: { block: 30 } } },   // Impervious
  { id: 'quick-guard',  name: 'Quick Guard',  type: 'normal', cost: 2, art: '✋', sprite: 'protective-pads', effects: { guard: true } },
  { id: 'potion',       name: 'Potion',       type: 'normal', cost: 1, art: '🧪', sprite: 'potion', effects: { heal: 10 }, exhaust: true },      // Bandage Up
  { id: 'smokescreen',  name: 'Smokescreen',  type: 'normal', cost: 0, art: '💨', sprite: 'smoke-ball', effects: { weaken: 2 }, exhaust: true },   // Intimidate
  { id: 'tailwind',     name: 'Tailwind',     type: 'normal', cost: 0, art: '🌬️', sprite: 'air-balloon', effects: { nextEnergy: 1 } },
  { id: 'lucky-claw',   name: 'Lucky Claw',   type: 'normal', cost: 0, art: '🍀', sprite: 'razor-claw', effects: { draw: 2 }, exhaust: true, rarity: 'uncommon' },   // Finesse
  { id: 'double-hit',   name: 'Double Hit',   type: 'normal', cost: 1, art: '💥', sprite: 'lucky-punch', effects: { damage: 5, hits: 2 } },     // Twin Strike
  { id: 'swords-dance', name: 'Swords Dance', type: 'normal', cost: 1, art: '⚔️', sprite: 'rusted-sword', effects: { strength: 2 }, exhaust: true, rarity: 'uncommon' },   // Inflame
  { id: 'agility',      name: 'Agility',      type: 'normal', cost: 0, art: '⚡', sprite: 'quick-powder', effects: { energy: 1, draw: 2 }, exhaust: true, rarity: 'uncommon', upgrade: { effects: { energy: 2 } } },   // Adrenaline
  { id: 'leer',         name: 'Leer',         type: 'normal', cost: 0, art: '👀', sprite: 'black-glasses', effects: { vulnerable: 2 }, rarity: 'uncommon' },   // Trip
  { id: 'quick-attack', name: 'Quick Attack', type: 'normal', cost: 0, art: '💨', sprite: 'quick-ball', effects: { damage: 4, draw: 1 }, upgrade: { effects: { damage: 7 } } },   // Flash of Steel
  { id: 'rapid-spin',   name: 'Rapid Spin',   type: 'normal', cost: 1, art: '🌀', sprite: 'paralyze-heal', effects: { exhaustHand: 'status', damage: 7, draw: 1 }, upgrade: { effects: { damage: 10 } } },   // Purity + a Strike
  { id: 'double-team',  name: 'Double Team',  type: 'normal', cost: 1, art: '✨', sprite: 'destiny-knot', effects: { block: 6, blur: 1 }, rarity: 'uncommon' },   // Blur
  { id: 'substitute',   name: 'Substitute',   type: 'normal', cost: 1, art: '🧸', sprite: 'revive', effects: { selfDamage: 4, block: 16 }, rarity: 'uncommon', upgrade: { effects: { block: 20 } } },   // (Offering-style: HP for block)
  { id: 'mimic',        name: 'Mimic',        type: 'normal', cost: 1, art: '🧬', sprite: 'silk-scarf', effects: { copyPick: 1 }, rarity: 'uncommon', upgrade: { effects: { copyPick: 2 } } },   // Dual Wield
  { id: 'endure',       name: 'Endure',       type: 'normal', cost: 1, art: '🎗️', sprite: 'focus-band', effects: { endure: true, block: 4 }, exhaust: true, rarity: 'uncommon', upgrade: { cost: 0 } },   // (Pokémon's Endure; StS has no card for it)
  { id: 'metronome',    name: 'Metronome',    type: 'normal', cost: 1, art: '❓', sprite: 'metronome', effects: { randomCard: 1 }, exhaust: true, rarity: 'rare', upgrade: { exhaust: false } },   // Discovery / Jack of All Trades
  { id: 'hyper-beam',   name: 'Hyper Beam',   type: 'normal', cost: 2, art: '💥', sprite: 'tm-normal', effects: { damage: 38, nextEnergy: -1 }, rarity: 'rare', upgrade: { effects: { damage: 50 } } },   // Bludgeon, 1 PP now and 1 next turn
  { id: 'last-resort',  name: 'Last Resort',  type: 'normal', cost: 0, art: '⭐', sprite: 'normal-gem', effects: { damage: 60, needsEmptyDraw: true }, rarity: 'rare', upgrade: { effects: { damage: 72 } } },   // Grand Finale
];

/* Each type plays its own way:
     Fire   burn that stacks up, big hits, and trading HP for damage (StS's Ironclad + Silent's poison)
     Grass  healing, and strength that grows over a long fight (Ironclad's strength, Reaper)
     Water  Tide for every build: Tsunami builds it and cashes it in with one big wave (Watcher's Mantra),
            Shell keeps block and turns it into damage (Barricade + Body Slam, Juggernaut), Flow draws,
            discards and retains (Silent's discard, Watcher's retain)
   Every starting deck is StS-shaped: 4 attacks, 4 blocks and 2 signature cards. */
const FIRE_CARDS = [
  // Common: 20
  { id: 'ember',           name: 'Ember',           type: 'fire', cost: 1, art: '🔥', sprite: 'fire-stone', effects: { damage: 7 }, upgrade: { effects: { damage: 10 } } },                          // Strike
  { id: 'flame-wall',      name: 'Flame Wall',      type: 'fire', cost: 1, art: '🧱', sprite: 'flame-plate', effects: { block: 8 }, upgrade: { effects: { block: 11 } } },                          // Defend, +2: Fire has the fewest ways to defend
  { id: 'scorch',          name: 'Scorch',          type: 'fire', cost: 2, art: '☄️', sprite: 'burn-drive', effects: { damage: 10, vulnerable: 2 }, upgrade: { effects: { damage: 12, vulnerable: 3 } } },          // Bash
  { id: 'will-o-wisp',     name: 'Will-O-Wisp',     type: 'fire', cost: 1, art: '👻', sprite: 'spell-tag', effects: { burn: 4, weaken: 2 }, upgrade: { effects: { burn: 6 } } },                  // Deadly Poison + Weak, like the move's halved Attack
  { id: 'mystical-fire',   name: 'Mystical Fire',   type: 'fire', cost: 1, art: '✨', sprite: 'wise-glasses', effects: { damage: 6, weaken: 1 }, upgrade: { effects: { damage: 8, weaken: 2 } } },             // Sucker Punch
  { id: 'fire-punch',      name: 'Fire Punch',      type: 'fire', cost: 1, art: '🥊', sprite: 'expert-belt', effects: { damage: 10, draw: 1 }, upgrade: { effects: { damage: 12, draw: 2 } } },               // Pommel Strike
  { id: 'flame-body',      name: 'Flame Body',      type: 'fire', cost: 1, art: '🛡️', sprite: 'magma-stone', effects: { block: 10, burn: 2 }, upgrade: { effects: { block: 12, burn: 3 } } },                 // Iron Wave
  { id: 'fire-spin',       name: 'Fire Spin',       type: 'fire', cost: 1, art: '🌀', sprite: 'red-shard', effects: { damage: 6, burn: 3 }, upgrade: { effects: { damage: 8, burn: 4 } } },                  // Poisoned Stab
  { id: 'flame-burst',     name: 'Flame Burst',     type: 'fire', cost: 2, art: '💥', sprite: 'flame-mail', effects: { burn: 3, burnTimes: 3 }, upgrade: { effects: { burn: 4 } } },          // Bouncing Flask
  { id: 'scorching-sands', name: 'Scorching Sands', type: 'fire', cost: 1, art: '🌪️', sprite: 'soft-sand', effects: { damage: 8, ifBurned: { vulnerable: 1 } }, upgrade: { effects: { damage: 10, ifBurned: { vulnerable: 2 } } } },   // Bane, with Vulnerable
  { id: 'heat-up',         name: 'Heat Up',         type: 'fire', cost: 1, art: '📈', sprite: 'liechi-berry', effects: { strength: 1, focus: 4 }, upgrade: { effects: { focus: 8 } } },            // Inflame, half now
  { id: 'flare-up',        name: 'Flare Up',        type: 'fire', cost: 2, art: '🌋', sprite: 'magmarizer', effects: { damage: 15, bonusIfLow: 8 }, upgrade: { effects: { damage: 18, bonusIfLow: 12 } } },   // Perfected Strike, paid by low HP
  { id: 'fiery-dance',     name: 'Fiery Dance',     type: 'fire', cost: 0, art: '🩸', sprite: 'red-nectar', effects: { selfDamage: 3, energy: 2 }, upgrade: { effects: { energy: 3 } } },            // Bloodletting
  { id: 'heat-crash',      name: 'Heat Crash',      type: 'fire', cost: 1, art: '💥', sprite: 'iron-ball', effects: { damage: 14, addCard: { id: 'paralysis', to: 'draw' } }, upgrade: { effects: { damage: 19 } } },   // Wild Strike
  { id: 'fire-lash',       name: 'Fire Lash',       type: 'fire', cost: 1, art: '🦷', sprite: 'binding-band', effects: { damage: 5, hits: 2 }, upgrade: { effects: { damage: 7 } } },               // Twin Strike
  { id: 'rage',            name: 'Rage',            type: 'fire', cost: 0, art: '😡', sprite: 'rage-candy-bar', effects: { damage: 6, addCard: { id: 'rage', to: 'discard' } }, upgrade: { effects: { damage: 9, addCard: { id: 'rage+', to: 'discard' } } } },   // Anger
  { id: 'spark-shower',    name: 'Spark Shower',    type: 'fire', cost: 1, art: '✨', sprite: 'stardust', effects: { addCard: { id: 'cinder', n: 3 } }, upgrade: { effects: { addCard: { id: 'cinder', n: 4 } } } },   // Blade Dance
  { id: 'cinder-cloak',    name: 'Cinder Cloak',    type: 'fire', cost: 1, art: '🧣', sprite: 'red-scarf', effects: { block: 7, addCard: { id: 'cinder' } }, upgrade: { effects: { addCard: { id: 'cinder', n: 2 } } } },   // Cloak and Dagger
  { id: 'kindle',          name: 'Kindle',          type: 'fire', cost: 1, art: '🧱', sprite: 'stick', effects: { block: 8, exhaustPick: 1 }, upgrade: { effects: { block: 11 } } },                // True Grit
  { id: 'flare',           name: 'Flare',           type: 'fire', cost: 0, art: '🔥', sprite: 'figy-berry', effects: { damage: 4, burn: 1 }, upgrade: { effects: { damage: 5, burn: 2 } } },         // Flying Knee, lite
  // Uncommon: 32
  { id: 'inferno',         name: 'Inferno',         type: 'fire', cost: 1, art: '🌪️', sprite: 'houndoominite', effects: { damage: 7, bonusPerBurn: 2 }, rarity: 'uncommon', upgrade: { effects: { damage: 9, bonusPerBurn: 3 } } },   // Bane, per stack
  { id: 'sunny-day',       name: 'Sunny Day',       type: 'fire', cost: 1, art: '☀️', sprite: 'sun-stone', effects: { burnEachTurn: 2 }, power: true, rarity: 'uncommon', upgrade: { effects: { burnEachTurn: 3 } } },   // Noxious Fumes
  { id: 'heat-wave',       name: 'Heat Wave',       type: 'fire', cost: 2, art: '♨️', sprite: 'blazikenite', effects: { damage: 5, hits: 3, burn: 2 }, rarity: 'uncommon', upgrade: { effects: { damage: 6, burn: 3 } } },   // Riddle with Holes
  { id: 'burning-bulwark', name: 'Burning Bulwark', type: 'fire', cost: 1, art: '🛡️', sprite: 'rusted-shield', effects: { block: 11, burn: 3 }, rarity: 'uncommon', upgrade: { effects: { block: 14, burn: 4 } } },   // Flame Barrier
  { id: 'fan-the-flames',  name: 'Fan the Flames',  type: 'fire', cost: 1, art: '🌬️', sprite: 'fire-memory', effects: { burnMult: 2 }, exhaust: true, rarity: 'uncommon', upgrade: { cost: 0 } },   // Catalyst
  { id: 'ash-cloud',       name: 'Ash Cloud',       type: 'fire', cost: 2, art: '💨', sprite: 'soot-sack', effects: { burn: 5, weaken: 2 }, exhaust: true, rarity: 'uncommon', upgrade: { effects: { burn: 7, weaken: 3 } } },   // Crippling Cloud
  { id: 'heat-haze',       name: 'Heat Haze',       type: 'fire', cost: 1, art: '♨️', sprite: 'bright-powder', effects: { block: 7, ifBurned: { block: 5 } }, rarity: 'uncommon', upgrade: { effects: { block: 9, ifBurned: { block: 6 } } } },   // Dodge and Roll
  { id: 'infernal-parade', name: 'Infernal Parade', type: 'fire', cost: 1, art: '👻', sprite: 'odd-keystone', effects: { damage: 8, ifBurned: { bonus: 8 } }, rarity: 'uncommon', upgrade: { effects: { damage: 10, ifBurned: { bonus: 10 } } } },   // Bane
  { id: 'blaze-kick',      name: 'Blaze Kick',      type: 'fire', cost: 1, art: '👟', sprite: 'heavy-duty-boots', effects: { selfDamage: 2, damage: 9, burn: 4 }, rarity: 'uncommon', upgrade: { effects: { damage: 12, burn: 5 } } },   // Hemokinesis + Poisoned Stab: Burn and Reckless
  { id: 'steam-engine',    name: 'Steam Engine',    type: 'fire', cost: 1, art: '♨️', sprite: 'machine-part', effects: { exhaustBurn: 2 }, power: true, rarity: 'uncommon', upgrade: { effects: { exhaustBurn: 3 } } },   // Feel No Pain, as Burn: Burn and Kindling
  { id: 'flare-blitz',     name: 'Flare Blitz',     type: 'fire', cost: 1, art: '☄️', sprite: 'life-orb', effects: { selfDamage: 2, damage: 17 }, rarity: 'uncommon', upgrade: { effects: { damage: 22 } } },   // Hemokinesis
  { id: 'raging-fury',     name: 'Raging Fury',     type: 'fire', cost: 1, art: '😡', sprite: 'red-chain', effects: { rupture: 1 }, power: true, rarity: 'uncommon', upgrade: { effects: { rupture: 2 } } },   // Rupture
  { id: 'temper-flare',    name: 'Temper Flare',    type: 'fire', cost: 1, art: '😡', sprite: 'red-card', effects: { damage: 10, ifHurt: { bonus: 10 } }, rarity: 'uncommon', upgrade: { effects: { damage: 13, ifHurt: { bonus: 13 } } } },   // Spot Weakness, as an attack
  { id: 'mind-blown',      name: 'Mind Blown',      type: 'fire', cost: 4, art: '💥', sprite: 'weakness-policy', effects: { damage: 22, costDownOnHurt: 1 }, rarity: 'uncommon', upgrade: { cost: 3 } },   // Blood for Blood
  { id: 'eruption',        name: 'Eruption',        type: 'fire', cost: 1, art: '🌋', sprite: 'cameruptite', effects: { combust: 6 }, power: true, rarity: 'uncommon', upgrade: { effects: { combust: 8 } } },   // Combust
  { id: 'shell-trap',      name: 'Shell Trap',      type: 'fire', cost: 1, art: '🐚', sprite: 'jaboca-berry', effects: { block: 18, addCard: { id: 'paralysis', n: 2 } }, rarity: 'uncommon', upgrade: { effects: { block: 23 } } },   // Power Through
  { id: 'fiery-wrath',     name: 'Fiery Wrath',     type: 'fire', cost: 0, art: '😡', sprite: 'dread-plate', effects: { selfDamage: 3, addCard: { id: 'cinder', n: 2 } }, rarity: 'uncommon', upgrade: { effects: { addCard: { id: 'cinder', n: 3 } } } },   // Bloodletting + Blade Dance: Reckless and Kindling
  { id: 'lava-plume',      name: 'Lava Plume',      type: 'fire', cost: 2, art: '🌋', sprite: 'occa-berry', effects: { damage: 15, weaken: 1, vulnerable: 1 }, rarity: 'uncommon', upgrade: { effects: { weaken: 2, vulnerable: 2 } } },   // Uppercut
  { id: 'ember-veil',      name: 'Ember Veil',      type: 'fire', cost: 2, art: '🛡️', sprite: 'safety-goggles', effects: { block: 13, weaken: 2 }, rarity: 'uncommon', upgrade: { effects: { block: 16, weaken: 3 } } },   // Leg Sweep
  { id: 'inferno-charge',  name: 'Inferno Charge',  type: 'fire', cost: 2, art: '⚡', sprite: 'cell-battery', effects: { damage: 9, nextEnergy: 2 }, rarity: 'uncommon', upgrade: { effects: { damage: 13 } } },   // Outmaneuver, as an attack
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
  { id: 'heatproof',       name: 'Heatproof',       type: 'fire', cost: 1, art: '🛡️', sprite: 'assault-vest', effects: { block: 12 }, ethereal: true, rarity: 'uncommon', upgrade: { effects: { block: 16 } } },   // Ghostly Armor
  // Rare: 14
  { id: 'firestorm',       name: 'Firestorm',       type: 'fire', cost: 3, art: '🌪️', sprite: 'charizardite-y', effects: { damage: 36 }, rarity: 'rare', upgrade: { effects: { damage: 46 } } },    // Bludgeon
  { id: 'flame-blast',     name: 'Flame Blast',     type: 'fire', cost: 2, art: '💥', sprite: 'red-orb', effects: { damage: 18, burn: 4 }, rarity: 'rare', upgrade: { effects: { damage: 22, burn: 6 } } },   // Bane+
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
  { id: 'fusion-flare',    name: 'Fusion Flare',    type: 'fire', cost: 1, art: '🧬', sprite: 'dna-splicers', effects: { exhume: 1 }, exhaust: true, rarity: 'rare', upgrade: { cost: 0 } },   // Exhume
];

const GRASS_CARDS = [
  // Common: 20
  { id: 'vine-whip',      name: 'Vine Whip',      type: 'grass', cost: 1, art: '🌿', sprite: 'galarica-twig', effects: { damage: 7 }, upgrade: { effects: { damage: 10 } } },                        // Strike
  { id: 'cotton-guard',   name: 'Cotton Guard',   type: 'grass', cost: 1, art: '🛡️', sprite: 'fluffy-tail', effects: { block: 8 }, retain: true, upgrade: { effects: { block: 11 } } },   // Defend (Retain)
  { id: 'seed-bomb',      name: 'Seed Bomb',      type: 'grass', cost: 2, art: '🌰', sprite: 'rindo-berry', effects: { damage: 10, vulnerable: 2 }, upgrade: { effects: { damage: 12, vulnerable: 3 } } },   // Bash
  { id: 'petal-dance',    name: 'Petal Dance',    type: 'grass', cost: 1, art: '🌸', sprite: 'petal-pink', effects: { damage: 6, block: 6 }, upgrade: { effects: { damage: 8, block: 8 } } },   // Iron Wave
  { id: 'razor-leaf',     name: 'Razor Leaf',     type: 'grass', cost: 2, art: '🍃', sprite: 'silver-leaf', effects: { damage: 16 }, upgrade: { effects: { damage: 21 } } },   // Carnage, without Ethereal
  { id: 'growth',         name: 'Growth',         type: 'grass', cost: 1, art: '🌱', sprite: 'growth-mulch', effects: { strength: 1, heal: 3 }, upgrade: { effects: { strength: 2 } } },   // Inflame (half) + a heal
  { id: 'bullet-seed',    name: 'Bullet Seed',    type: 'grass', cost: 1, art: '🌱', sprite: 'green-apricorn', effects: { damage: 3, hits: 3 }, upgrade: { effects: { damage: 4 } } },   // Sword Boomerang
  { id: 'rototiller',     name: 'Rototiller',     type: 'grass', cost: 0, art: '🌱', sprite: 'boost-mulch', effects: { flex: 3 }, upgrade: { effects: { flex: 5 } } },   // Flex
  { id: 'branch-poke',    name: 'Branch Poke',    type: 'grass', cost: 0, art: '🌿', sprite: 'large-leek', effects: { damage: 4 }, upgrade: { effects: { damage: 6 } } },   // a free hit, for strength to multiply (Flying Knee's price)
  { id: 'wood-hammer',    name: 'Wood Hammer',    type: 'grass', cost: 2, art: '🌳', sprite: 'wood-mail', effects: { damage: 14, weaken: 2 }, upgrade: { effects: { damage: 17, weaken: 3 } } },   // Clothesline
  { id: 'absorb',         name: 'Absorb',         type: 'grass', cost: 1, art: '💚', sprite: 'absorb-bulb', effects: { damage: 6, heal: 3 }, upgrade: { effects: { damage: 8, heal: 4 } } },   // Reaper (lite)
  { id: 'mega-drain',     name: 'Mega Drain',     type: 'grass', cost: 2, art: '💚', sprite: 'luminous-moss', effects: { damage: 12, heal: 6 }, upgrade: { effects: { damage: 15, heal: 8 } } },   // Reaper (lite)
  { id: 'worry-seed',     name: 'Worry Seed',     type: 'grass', cost: 1, art: '🌱', sprite: 'psychic-seed', effects: { seed: 3 }, upgrade: { effects: { seed: 5 } } },   // Deadly Poison
  { id: 'snap-trap',      name: 'Snap Trap',      type: 'grass', cost: 1, art: '🌿', sprite: 'ring-target', effects: { damage: 5, seed: 2 }, upgrade: { effects: { damage: 7, seed: 3 } } },   // Poisoned Stab
  { id: 'leaf-guard',     name: 'Leaf Guard',     type: 'grass', cost: 1, art: '🍃', sprite: 'rose-incense', effects: { block: 7, heal: 2 }, upgrade: { effects: { block: 10, heal: 3 } } },   // Shrug It Off, healing in place of the draw
  { id: 'sprout',         name: 'Sprout',         type: 'grass', cost: 1, art: '🌱', sprite: 'revival-herb', effects: { addCard: { id: 'seedling', n: 2, to: 'draw' } }, upgrade: { effects: { addCard: { id: 'seedling', n: 3, to: 'draw' } } } },   // Blade Dance, into the draw pile
  { id: 'stun-spore',     name: 'Stun Spore',     type: 'grass', cost: 1, art: '🍄', sprite: 'tiny-mushroom', effects: { damage: 6, weaken: 1 }, upgrade: { effects: { damage: 8, weaken: 2 } } },   // Sucker Punch
  { id: 'magical-leaf',   name: 'Magical Leaf',   type: 'grass', cost: 1, art: '🍃', sprite: 'petal-green', effects: { damage: 8, ifWeak: { bonus: 4 } }, upgrade: { effects: { damage: 10, ifWeak: { bonus: 6 } } } },   // Heel Hook
  { id: 'sweet-scent',    name: 'Sweet Scent',    type: 'grass', cost: 1, art: '🌸', sprite: 'sachet', effects: { sap: 2 }, exhaust: true, upgrade: { effects: { sap: 3 } } },   // Disarm
  { id: 'apple-acid',     name: 'Apple Acid',     type: 'grass', cost: 1, art: '🌰', sprite: 'tart-apple', effects: { damage: 8, vulnerable: 1 }, upgrade: { effects: { damage: 11, vulnerable: 2 } } },   // Trip + a hit
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
  { id: 'floral-healing', name: 'Floral Healing', type: 'grass', cost: 1, art: '🌸', sprite: 'small-bouquet', effects: { heal: 5, block: 5 }, rarity: 'uncommon', upgrade: { effects: { heal: 7, block: 7 } } },   // Shrug It Off, as a heal
  { id: 'aromatherapy',   name: 'Aromatherapy',   type: 'grass', cost: 1, art: '🌸', sprite: 'full-restore', effects: { heal: 4, exhaustHand: 'status', draw: 1 }, rarity: 'uncommon', upgrade: { effects: { heal: 7 } } },   // Purity
  { id: 'seed-flare',     name: 'Seed Flare',     type: 'grass', cost: 2, art: '🌸', sprite: 'flower-sweet', effects: { damage: 12, seed: 2 }, rarity: 'uncommon', upgrade: { effects: { damage: 15, seed: 3 } } },   // bridge Drain/Spores: Bouncing Flask + a hit
  { id: 'sleep-powder',   name: 'Sleep Powder',   type: 'grass', cost: 1, art: '🍄', sprite: 'big-mushroom', effects: { weaken: 2, draw: 1 }, retain: true, rarity: 'uncommon', upgrade: { effects: { weaken: 3 } } },   // Blind
  { id: 'spore',          name: 'Spore',          type: 'grass', cost: 1, art: '🍄', sprite: 'balm-mushroom', effects: { weaken: 2, vulnerable: 2 }, exhaust: true, rarity: 'uncommon', upgrade: { effects: { weaken: 3, vulnerable: 3 } } },   // Crippling Cloud
  { id: 'effect-spore',   name: 'Effect Spore',   type: 'grass', cost: 1, art: '🍄', sprite: 'mixed-mushrooms', effects: { debuffDamage: 5 }, power: true, rarity: 'uncommon', upgrade: { effects: { debuffDamage: 7 } } },   // Sadistic Nature
  { id: 'leaf-tornado',   name: 'Leaf Tornado',   type: 'grass', cost: 1, art: '🌪️', sprite: 'green-scarf', effects: { damage: 6, perDebuff: 4 }, rarity: 'uncommon', upgrade: { effects: { damage: 8, perDebuff: 5 } } },   // Bane, per debuff
  { id: 'rage-powder',    name: 'Rage Powder',    type: 'grass', cost: 1, art: '🍄', sprite: 'heal-powder', effects: { block: 8, weaken: 1 }, rarity: 'uncommon', upgrade: { effects: { block: 10, weaken: 2 } } },   // Leg Sweep (lite)
  { id: 'forests-curse',  name: 'Forest\'s Curse', type: 'grass', cost: 1, art: '🌳', sprite: 'odd-incense', effects: { sap: 1, vulnerable: 2 }, rarity: 'uncommon', upgrade: { effects: { sap: 2, vulnerable: 3 } } },   // Malaise (lite)
  { id: 'powder',         name: 'Powder',         type: 'grass', cost: 2, art: '💨', sprite: 'metal-powder', effects: { weakEachTurn: 1 }, power: true, rarity: 'uncommon', upgrade: { cost: 1 } },   // Noxious Fumes, as Weak
  { id: 'trop-kick',      name: 'Trop Kick',      type: 'grass', cost: 1, art: '🥊', sprite: 'fruit-bunch', effects: { damage: 9, sap: 1 }, rarity: 'uncommon', upgrade: { effects: { damage: 12 } } },   // Disarm + a hit
  { id: 'grav-apple',     name: 'Grav Apple',     type: 'grass', cost: 2, art: '🌰', sprite: 'sweet-apple', effects: { damage: 15, weaken: 1, vulnerable: 1 }, rarity: 'uncommon', upgrade: { effects: { weaken: 2, vulnerable: 2 } } },   // bridge Growth/Spores: Uppercut
  { id: 'drum-beating',   name: 'Drum Beating',   type: 'grass', cost: 1, art: '🥊', sprite: 'thick-club', effects: { damage: 7, ifVulnerable: { energy: 1, draw: 1 } }, rarity: 'uncommon', upgrade: { effects: { damage: 10 } } },   // bridge Growth/Spores: Dropkick
  { id: 'spicy-extract',  name: 'Spicy Extract',  type: 'grass', cost: 1, art: '🔥', sprite: 'spice-mix', effects: { vulnerable: 2, strength: 1 }, rarity: 'uncommon', upgrade: { effects: { strength: 2 } } },   // bridge Growth/Spores: Trip + Inflame (half)
  { id: 'chloroblast',    name: 'Chloroblast',    type: 'grass', cost: 1, art: '☀️', sprite: 'tr-grass', effects: { selfDamage: 3, damage: 18 }, rarity: 'uncommon', upgrade: { effects: { damage: 23 } } },   // bridge Growth/Drain: Hemokinesis (heal it back)
  { id: 'flower-shield',  name: 'Flower Shield',  type: 'grass', cost: 1, art: '🌸', sprite: 'petal-orange', effects: { block: 8, ifHealed: { strength: 1 } }, rarity: 'uncommon', upgrade: { effects: { block: 11 } } },   // bridge Growth/Drain: a Defend that grows
  { id: 'sappy-seed',     name: 'Sappy Seed',     type: 'grass', cost: 1, art: '🌱', sprite: 'electric-seed', effects: { seed: 2, sap: 1 }, rarity: 'uncommon', upgrade: { effects: { seed: 3, sap: 2 } } },   // bridge Drain/Spores: Deadly Poison + Disarm (lite)
  { id: 'cotton-spore',   name: 'Cotton Spore',   type: 'grass', cost: 1, art: '💨', sprite: 'fresh-cream', effects: { weaken: 2, seed: 1 }, rarity: 'uncommon', upgrade: { effects: { weaken: 3, seed: 2 } } },   // bridge Drain/Spores: Blind + poison
  { id: 'energy-ball',    name: 'Energy Ball',    type: 'grass', cost: 1, art: '🌀', sprite: 'grass-memory', effects: { damage: 9, ifSeeded: { heal: 4 } }, rarity: 'uncommon', upgrade: { effects: { damage: 12, ifSeeded: { heal: 5 } } } },   // bridge Drain/Spores: Bane, as a heal
  { id: 'aromatic-mist',  name: 'Aromatic Mist',  type: 'grass', cost: 1, art: '🌸', sprite: 'pink-nectar', effects: { heal: 3, weaken: 1, draw: 1 }, rarity: 'uncommon', upgrade: { effects: { heal: 5, weaken: 2 } } },   // bridge Drain/Spores: Blind + a heal
  // Rare: 14
  { id: 'solar-beam',     name: 'Solar Beam',     type: 'grass', cost: 3, art: '🌞', sprite: 'tm-grass', effects: { damage: 36 }, rarity: 'rare', upgrade: { effects: { damage: 46 } } },   // Bludgeon
  { id: 'grassy-terrain', name: 'Grassy Terrain', type: 'grass', cost: 3, art: '🌿', sprite: 'terrain-extender', effects: { strengthEachTurn: 2 }, power: true, rarity: 'rare', upgrade: { effects: { strengthEachTurn: 3 } } },   // Demon Form
  { id: 'growth-spurt',   name: 'Growth Spurt',   type: 'grass', cost: 1, art: '🌱', sprite: 'rare-candy', effects: { doubleStrength: true }, exhaust: true, rarity: 'rare', upgrade: { exhaust: false } },   // Limit Break
  { id: 'solar-blade',    name: 'Solar Blade',    type: 'grass', cost: 2, art: '🌞', sprite: 'solganium-z', effects: { damage: 8, strengthMult: 4 }, retain: true, rarity: 'rare', upgrade: { effects: { damage: 12, strengthMult: 5 } } },   // Heavy Blade+, kept for the big turn
  { id: 'harvest',        name: 'Harvest',        type: 'grass', cost: 1, art: '🫐', sprite: 'berry-pots', effects: { strengthHeal: 2 }, power: true, rarity: 'rare', upgrade: { effects: { strengthHeal: 3 } } },   // bridge Growth/Drain
  { id: 'jungle-healing', name: 'Jungle Healing', type: 'grass', cost: 1, art: '💚', sprite: 'max-potion', effects: { damage: 12, feed: 4 }, exhaust: true, rarity: 'rare', upgrade: { effects: { damage: 14, feed: 5 } } },   // Feed
  { id: 'grassy-surge',   name: 'Grassy Surge',   type: 'grass', cost: 3, art: '🌱', sprite: 'meadow-plate', effects: { seedKeep: 1 }, power: true, rarity: 'rare', upgrade: { cost: 2 } },   // Catalyst, made permanent
  { id: 'leech-life',     name: 'Leech Life',     type: 'grass', cost: 1, art: '🩸', sprite: 'buginium-z', effects: { attackHeal: 2 }, power: true, rarity: 'rare', upgrade: { effects: { attackHeal: 3 } } },   // Reaper, on every attack
  { id: 'seed-sower',     name: 'Seed Sower',     type: 'grass', cost: 2, art: '🌱', sprite: 'starf-berry', effects: { attackSeed: 1 }, power: true, rarity: 'rare', upgrade: { cost: 1 } },   // Envenom
  { id: 'matcha-gotcha',  name: 'Matcha Gotcha',  type: 'grass', cost: 'X', art: '💚', sprite: 'cracked-pot', effects: { damage: 5, perX: { hits: 1 }, healDealt: true }, exhaust: true, rarity: 'rare', upgrade: { effects: { damage: 7 } } },   // Whirlwind + Reaper
  { id: 'natures-madness', name: 'Nature\'s Madness', type: 'grass', cost: 'X', art: '🌀', sprite: 'tapunium-z', effects: { perX: { sap: 1, weaken: 1 } }, exhaust: true, rarity: 'rare', upgrade: { effects: { xPlus: 1 } } },   // Malaise
  { id: 'pollen-puff',    name: 'Pollen Puff',    type: 'grass', cost: 1, art: '🌸', sprite: 'honey', effects: { drawPerDebuff: 1 }, rarity: 'rare', upgrade: { cost: 0 } },   // Expertise, by debuffs
  { id: 'sap-sipper',     name: 'Sap Sipper',     type: 'grass', cost: 1, art: '💚', sprite: 'yellow-nectar', effects: { weakBlock: 4 }, power: true, rarity: 'rare', upgrade: { effects: { weakBlock: 6 } } },   // Sadistic Nature, as block
  { id: 'petal-storm',    name: 'Petal Storm',    type: 'grass', cost: 2, art: '🌸', sprite: 'petal-purple', effects: { damage: 4, hits: 5, vulnerable: 1 }, rarity: 'rare', upgrade: { effects: { damage: 5, vulnerable: 2 } } },   // Glass Knife
];

const WATER_CARDS = [
  // Common: 20
  { id: 'water-gun',      name: 'Water Gun',      type: 'water', cost: 1, art: '💧', sprite: 'water-stone', effects: { damage: 7 }, upgrade: { effects: { damage: 10 } } },                        // Strike
  { id: 'withdraw',       name: 'Withdraw',       type: 'water', cost: 1, art: '🐚', sprite: 'shoal-shell', effects: { block: 6 }, upgrade: { effects: { block: 9 } } },                          // Defend
  { id: 'bubble',         name: 'Bubble',         type: 'water', cost: 1, art: '🫧', sprite: 'bubble-mail', effects: { damage: 5, weaken: 1, tide: 1 }, upgrade: { effects: { damage: 7, weaken: 2 } } },   // Sucker Punch
  { id: 'dive',           name: 'Dive',           type: 'water', cost: 1, art: '🌊', sprite: 'dive-ball', effects: { block: 9, draw: 1, tide: 1 }, upgrade: { effects: { block: 12 } } },   // Shrug It Off
  { id: 'water-pulse',    name: 'Water Pulse',    type: 'water', cost: 1, art: '💧', sprite: 'splash-plate', effects: { damage: 5, perTide: 2 }, retain: true, upgrade: { effects: { perTide: 3 } } },   // Windmill Strike: hold it until the Tide is high
  { id: 'rain-dance',     name: 'Rain Dance',     type: 'water', cost: 1, art: '🌧️', sprite: 'sprinklotad', effects: { block: 4, tide: 2 }, upgrade: { effects: { tide: 3 } } },   // Prostrate
  { id: 'surf',           name: 'Surf',           type: 'water', cost: 2, art: '🌊', sprite: 'hm-water', effects: { damage: 12, tide: 2 }, upgrade: { effects: { damage: 16 } } },   // Wheel Kick
  { id: 'soak',           name: 'Soak',           type: 'water', cost: 1, art: '💦', sprite: 'damp-mulch', effects: { vulnerable: 2, tide: 1 }, upgrade: { effects: { vulnerable: 3 } } },   // Trip
  { id: 'water-sport',    name: 'Water Sport',    type: 'water', cost: 0, art: '💦', sprite: 'sprayduck', effects: { tide: 2 }, exhaust: true, upgrade: { effects: { tide: 3 } } },   // Pray
  { id: 'snipe-shot',     name: 'Snipe Shot',     type: 'water', cost: 1, art: '🎯', sprite: 'wide-lens', effects: { damage: 6, perTideHeld: 2 }, upgrade: { effects: { perTideHeld: 3 } } },   // Perfected Strike: counts Tide without spending it
  { id: 'clamp',          name: 'Clamp',          type: 'water', cost: 2, art: '🐚', sprite: 'big-pearl', effects: { damage: 10, block: 10 }, upgrade: { effects: { damage: 13, block: 13 } } },   // Iron Wave x2
  { id: 'razor-shell',    name: 'Razor Shell',    type: 'water', cost: 1, art: '🐚', sprite: 'tropical-shell', effects: { blockDamage: true }, upgrade: { cost: 0 } },   // Body Slam
  { id: 'splash',         name: 'Splash',         type: 'water', cost: 0, art: '💦', sprite: 'lure-ball', effects: { block: 4 }, upgrade: { effects: { block: 7 } } },   // Deflect
  { id: 'shelter',        name: 'Shelter',        type: 'water', cost: 1, art: '🛡️', sprite: 'light-clay', effects: { block: 9, blockNext: 5 }, upgrade: { effects: { block: 11, blockNext: 7 } } },   // Dodge and Roll
  { id: 'flip-turn',      name: 'Flip Turn',      type: 'water', cost: 1, art: '🌀', sprite: 'eject-button', effects: { damage: 10, draw: 1, discard: 1 }, upgrade: { effects: { damage: 13 } } },   // Dagger Throw
  { id: 'waterfall',      name: 'Waterfall',      type: 'water', cost: 1, art: '🌊', sprite: 'super-rod', effects: { draw: 3, discard: 1 }, upgrade: { effects: { draw: 4 } } },   // Acrobatics
  { id: 'aqua-step',      name: 'Aqua Step',      type: 'water', cost: 0, art: '💦', sprite: 'tropic-mail', effects: { draw: 1, discard: 1 }, upgrade: { effects: { draw: 2, discard: 2 } } },   // Prepared
  { id: 'mist',           name: 'Mist',           type: 'water', cost: 1, art: '💨', sprite: 'misty-seed', effects: { block: 12, discard: 1 }, upgrade: { effects: { block: 15 } } },   // Survivor
  { id: 'chilling-water', name: 'Chilling Water', type: 'water', cost: 1, art: '💧', sprite: 'never-melt-ice', effects: { block: 6, weaken: 1, draw: 1 }, upgrade: { effects: { block: 9, weaken: 2 } } },   // Backflip, with the move's Attack drop as Weak
  { id: 'muddy-water',    name: 'Muddy Water',    type: 'water', cost: 2, art: '🌊', sprite: 'polished-mud-ball', effects: { damage: 14, weaken: 2 }, upgrade: { effects: { damage: 17, weaken: 3 } } },   // Clothesline
  // Uncommon: 32
  { id: 'whirlpool',      name: 'Whirlpool',      type: 'water', cost: 1, art: '🌀', sprite: 'tidal-bell', effects: { damage: 5, weaken: 2 }, rarity: 'uncommon', upgrade: { effects: { damage: 7, weaken: 3 } } },   // Sucker Punch+
  { id: 'liquidation',    name: 'Liquidation',    type: 'water', cost: 1, art: '💦', sprite: 'passho-berry', effects: { damage: 8, vulnerable: 1 }, rarity: 'uncommon', upgrade: { effects: { damage: 11, vulnerable: 2 } } },   // Trip + a hit
  { id: 'rising-tide',    name: 'Rising Tide',    type: 'water', cost: 1, art: '⏫', sprite: 'sea-incense', effects: { tideEachTurn: 1 }, power: true, rarity: 'uncommon', upgrade: { cost: 0 } },   // Devotion
  { id: 'swift-swim',     name: 'Swift Swim',     type: 'water', cost: 0, art: '💦', sprite: 'deep-sea-scale', effects: { tideMult: 2 }, exhaust: true, rarity: 'uncommon', upgrade: { effects: { tideMult: 3 } } },   // Catalyst
  { id: 'crabhammer',     name: 'Crabhammer',     type: 'water', cost: 2, art: '🦀', sprite: 'kings-rock', effects: { damage: 12, perTide: 3 }, rarity: 'uncommon', upgrade: { effects: { damage: 16, perTide: 4 } } },   // Wallop, cashing in Tide
  { id: 'water-spout',    name: 'Water Spout',    type: 'water', cost: 'X', art: '⛲', sprite: 'wailmer-pail', effects: { perX: { tide: 2 } }, rarity: 'uncommon', upgrade: { effects: { xPlus: 1 } } },   // Tempest
  { id: 'aqua-ring',      name: 'Aqua Ring',      type: 'water', cost: 1, art: '⭕', sprite: 'pearl-string', effects: { heal: 3, block: 6 }, rarity: 'uncommon', upgrade: { effects: { heal: 4, block: 9 } } },
  { id: 'mirror-coat',    name: 'Mirror Coat',    type: 'water', cost: 1, art: '🔮', sprite: 'reveal-glass', effects: { thorns: 4 }, power: true, rarity: 'uncommon', upgrade: { effects: { thorns: 6 } } },   // Caltrops
  { id: 'water-veil',     name: 'Water Veil',     type: 'water', cost: 1, art: '🌧️', sprite: 'prism-scale', effects: { blockEachTurn: 3 }, power: true, rarity: 'uncommon', upgrade: { effects: { blockEachTurn: 4 } } },   // Metallicize
  { id: 'tidal-wall',     name: 'Tidal Wall',     type: 'water', cost: 1, art: '🌊', sprite: 'swampertite', effects: { blockPerTide: 4 }, rarity: 'uncommon', upgrade: { effects: { blockPerTide: 5 } } },   // Shell's way to cash in Tide
  { id: 'shell-smash',    name: 'Shell Smash',    type: 'water', cost: 2, art: '🐚', sprite: 'slowbronite', effects: { blockMult: 2 }, rarity: 'uncommon', upgrade: { cost: 1 } },   // Entrench
  { id: 'aqua-tail',      name: 'Aqua Tail',      type: 'water', cost: 1, art: '🌊', sprite: 'lagging-tail', effects: { block: 7, blockDamage: 0.5 }, rarity: 'uncommon', upgrade: { effects: { block: 10 } } },   // Iron Wave + Body Slam
  { id: 'bubble-shield',  name: 'Bubble Shield',  type: 'water', cost: 1, art: '🫧', sprite: 'soda-pop', effects: { block: 12 }, ethereal: true, rarity: 'uncommon', upgrade: { effects: { block: 16 } } },   // Ghostly Armor
  { id: 'surging-strikes', name: 'Surging Strikes', type: 'water', cost: 2, art: '🌊', sprite: 'tr-water', effects: { damage: 5, hits: 3 }, rarity: 'uncommon', upgrade: { effects: { damage: 7 } } },   // Riddle with Holes
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
  { id: 'sparkling-aria', name: 'Sparkling Aria', type: 'water', cost: 2, art: '✨', sprite: 'primarium-z', effects: { tide: 4 }, rarity: 'uncommon', upgrade: { retain: true } },   // Worship
  { id: 'rain-dish',      name: 'Rain Dish',      type: 'water', cost: 1, art: '⛲', sprite: 'pearl', effects: { tideSpendBlock: 2 }, power: true, rarity: 'uncommon', upgrade: { effects: { tideSpendBlock: 3 } } },   // bridge Tsunami/Shell: Mental Fortress (a cash-in also defends)
  { id: 'bouncy-bubble',  name: 'Bouncy Bubble',  type: 'water', cost: 1, art: '🫧', sprite: 'bead-mail', effects: { damage: 4, hits: 2, tide: 1 }, rarity: 'uncommon', upgrade: { effects: { damage: 6 } } },   // bridge Tsunami: Twin Strike + Tide
  { id: 'water-absorb',   name: 'Water Absorb',   type: 'water', cost: 2, art: '💧', sprite: 'fresh-water', effects: { block: 16 }, retain: true, rarity: 'uncommon', upgrade: { effects: { block: 20 } } },   // bridge Shell/Flow: Protect
  { id: 'ebb-tide',       name: 'Ebb Tide',       type: 'water', cost: 0, art: '🌊', sprite: 'moon-stone', effects: { draw: 1, discard: 1, tide: 1 }, rarity: 'uncommon', upgrade: { effects: { draw: 2 } } },   // bridge Flow/Tsunami: Prepared + Tide
  // Rare: 13
  { id: 'hydro-pump',     name: 'Hydro Pump',     type: 'water', cost: 2, art: '🚿', sprite: 'tm-water', effects: { damage: 10, perTide: 5 }, rarity: 'rare', upgrade: { effects: { damage: 14, perTide: 6 } } },   // Ragnarok, as the big cash-in
  { id: 'drizzle',        name: 'Drizzle',        type: 'water', cost: 1, art: '💦', sprite: 'azure-flute', effects: { drizzle: 1 }, power: true, rarity: 'rare', upgrade: { cost: 0 } },   // Envenom for Tide
  { id: 'tsunami',        name: 'Tsunami',        type: 'water', cost: 2, art: '🌊', sprite: 'water-memory', effects: { damage: 10, perTideGained: 3 }, rarity: 'rare', upgrade: { effects: { perTideGained: 4 } } },   // Brilliance
  { id: 'shell-armor',    name: 'Shell Armor',    type: 'water', cost: 2, art: '🐚', sprite: 'shed-shell', effects: { keepBlock: 1 }, power: true, rarity: 'rare', upgrade: { cost: 1 } },   // Barricade
  { id: 'riptide',        name: 'Riptide',        type: 'water', cost: 2, art: '🌀', sprite: 'net-ball', effects: { riptide: 5 }, power: true, rarity: 'rare', upgrade: { effects: { riptide: 7 } } },   // Juggernaut
  { id: 'iron-shell',     name: 'Iron Shell',     type: 'water', cost: 2, art: '🐚', sprite: 'hard-stone', effects: { block: 36 }, exhaust: true, rarity: 'rare', upgrade: { effects: { block: 46 } } },   // Impervious
  { id: 'primordial-sea', name: 'Primordial Sea', type: 'water', cost: 2, art: '🌀', sprite: 'blue-orb', effects: { drawEachTurn: 1, blockEachTurn: 2 }, power: true, rarity: 'rare', upgrade: { cost: 1 } },   // Tools of the Trade
  { id: 'hydration',      name: 'Hydration',      type: 'water', cost: 1, art: '🫧', sprite: 'berry-juice', effects: { cardBlock: 1 }, power: true, rarity: 'rare', upgrade: { innate: true } },   // After Image
  { id: 'water-shuriken', name: 'Water Shuriken', type: 'water', cost: 1, art: '⭐', sprite: 'star-piece', effects: { discardHand: true, perDiscarded: { addCard: { id: 'droplet' } } }, rarity: 'rare', upgrade: { effects: { perDiscarded: { addCard: { id: 'droplet+' } } } } },   // Storm of Steel
  { id: 'life-dew',       name: 'Life Dew',       type: 'water', cost: 1, art: '💚', sprite: 'oran-berry', effects: { heal: 6 }, retain: true, growOnRetain: { heal: 2 }, exhaust: true, rarity: 'rare', upgrade: { effects: { heal: 8 }, growOnRetain: { heal: 3 } } },   // Windmill Strike, for healing
  { id: 'ebb-and-flow',   name: 'Ebb and Flow',   type: 'water', cost: 1, art: '🏷️', sprite: 'soul-dew', effects: { retainDiscount: 1 }, power: true, rarity: 'rare', upgrade: { innate: true } },   // Establishment
  { id: 'aqua-wall',      name: 'Aqua Wall',      type: 'water', cost: 2, art: '🏰', sprite: 'icy-rock', effects: { blockPerCard: 4 }, rarity: 'rare', upgrade: { effects: { blockPerCard: 5 } } },   // Spirit Shield
  { id: 'primal-reversion', name: 'Primal Reversion', type: 'water', cost: 3, art: '🧿', sprite: 'sapphire', effects: { tideSurge: 1 }, power: true, ethereal: true, rarity: 'rare', upgrade: { ethereal: false } },   // Deva Form
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
  { id: 'flame-charge', name: 'Flame Charge', type: 'fire', cost: 1, art: '⚡', sprite: 'power-anklet', effects: { damage: 10, nextEnergy: 1 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 13 } } },   // Kindling
  { id: 'fire-fang',    name: 'Fire Fang',    type: 'fire', cost: 1, art: '🦷', sprite: 'razor-fang', effects: { damage: 8, burn: 3 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 11, burn: 4 } } },   // Burn
  { id: 'flame-wheel',  name: 'Flame Wheel',  type: 'fire', cost: 2, art: '🔥', sprite: 'tr-fire', effects: { selfDamage: 2, damage: 20 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 26 } } },   // Reckless
  { id: 'incinerate',   name: 'Incinerate',   type: 'fire', cost: 2, art: '🌪️', sprite: 'incinium-z', effects: { damage: 14, exhaustPick: 1, draw: 1 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 18 } } },   // Kindling
];
const FIRE_EVO_HIGH = [
  { id: 'flamethrower', name: 'Flamethrower', type: 'fire', cost: 2, art: '🔥', sprite: 'tm-fire', effects: { damage: 22, burn: 3 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 28, burn: 4 } } },   // Burn
  { id: 'fire-blast',   name: 'Fire Blast',   type: 'fire', cost: 2, art: '☄️', sprite: 'firium-z', effects: { burn: 8, vulnerable: 2 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { burn: 11, vulnerable: 3 } } },   // Burn: a big stack to double
  { id: 'overheat',     name: 'Overheat',     type: 'fire', cost: 3, art: '☀️', sprite: 'white-herb', effects: { damage: 30, bonusIfLow: 12 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 38 } } },   // Reckless
  { id: 'blast-burn',   name: 'Blast Burn',   type: 'fire', cost: 3, art: '🌋', sprite: 'charizardite-x', effects: { exhaustHand: 'all', damage: 34, perExhausted: 4 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 42 } } },   // Kindling
];

const GRASS_EVO_MID = [
  { id: 'leech-seed',    name: 'Leech Seed',    type: 'grass', cost: 1, art: '🌱', sprite: 'carrot-seeds', effects: { seed: 3, heal: 3 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { seed: 5, heal: 4 } } },   // Drain: Deadly Poison, the move itself
  { id: 'bulk-up',       name: 'Bulk Up',       type: 'grass', cost: 1, art: '💪', sprite: 'macho-brace', effects: { strength: 2, block: 6 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { strength: 3, block: 8 } } },   // Growth: Inflame + a Defend
  { id: 'razor-storm',   name: 'Razor Storm',   type: 'grass', cost: 2, art: '🍃', sprite: 'gold-leaf', effects: { damage: 3, hits: 6 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 4 } } },   // Growth: every hit carries your strength
  { id: 'poison-powder', name: 'Poison Powder', type: 'grass', cost: 1, art: '☠️', sprite: 'poison-barb', effects: { weaken: 2, sap: 1 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { weaken: 3, sap: 2 } } },   // Spores: Blind + Disarm (lite)
];
const GRASS_EVO_HIGH = [
  { id: 'giga-drain',    name: 'Giga Drain',    type: 'grass', cost: 2, art: '🩸', sprite: 'grassium-z', effects: { damage: 20, heal: 12 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 26, heal: 15 } } },   // Drain
  { id: 'petal-blizzard', name: 'Petal Blizzard', type: 'grass', cost: 2, art: '🌸', sprite: 'petal-red', effects: { damage: 12, hits: 2, vulnerable: 2 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 15, vulnerable: 3 } } },   // Spores
  { id: 'leaf-storm',    name: 'Leaf Storm',    type: 'grass', cost: 3, art: '🍂', sprite: 'sceptilite', effects: { damage: 26, block: 8 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 32, block: 11 } } },
  { id: 'frenzy-plant',  name: 'Frenzy Plant',  type: 'grass', cost: 3, art: '🌳', sprite: 'venusaurite', effects: { damage: 30, strengthMult: 4 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 38 } } },   // Growth: Heavy Blade at its biggest
];

const WATER_EVO_MID = [
  { id: 'aqua-jet',    name: 'Aqua Jet',    type: 'water', cost: 1, art: '💨', sprite: 'aqua-suit', effects: { damage: 8, draw: 1, discard: 1 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 11 } } },   // Flow
  { id: 'bubble-beam', name: 'Bubble Beam', type: 'water', cost: 1, art: '🫧', sprite: 'squirt-bottle', effects: { damage: 6, weaken: 2 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 9, weaken: 3 } } },
  { id: 'brine',       name: 'Brine',       type: 'water', cost: 2, art: '🌊', sprite: 'shoal-salt', effects: { damage: 8, perTide: 4 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 10, perTide: 5 } } },   // Tsunami
  { id: 'rain-shield', name: 'Rain Shield', type: 'water', cost: 1, art: '🌧️', sprite: 'utility-umbrella', effects: { block: 10, heal: 2 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { block: 13, heal: 3 } } },   // Shell
];
const WATER_EVO_HIGH = [
  { id: 'scald',        name: 'Scald',        type: 'water', cost: 2, art: '♨️', sprite: 'douse-drive', effects: { damage: 20, weaken: 2 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 26, weaken: 3 } } },
  { id: 'wave-crash',   name: 'Wave Crash',   type: 'water', cost: 1, art: '🌊', sprite: 'gyaradosite', effects: { blockDamage: 1.5 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { blockDamage: 2 } } },   // Shell: Body Slam x1.5
  { id: 'origin-pulse', name: 'Origin Pulse', type: 'water', cost: 3, art: '🌀', sprite: 'waterium-z', effects: { damage: 26, tide: 3 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 32, tide: 4 } } },   // Tsunami
  { id: 'hydro-cannon', name: 'Hydro Cannon', type: 'water', cost: 3, art: '🚿', sprite: 'blastoisinite', effects: { damage: 34 }, retain: true, growOnRetain: { damage: 6 }, evoOnly: true, maxCopies: 1, upgrade: { effects: { damage: 42 } } },   // Flow: Windmill Strike
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
const UPGRADE_STEPS = [['burn', 2], ['seed', 2], ['weaken', 1], ['vulnerable', 1], ['sap', 1], ['tide', 1], ['focus', 3], ['strength', 1], ['flex', 2], ['draw', 1]];
const POWER_STEPS = { blockEachTurn: 1, healEachTurn: 1, burnEachTurn: 1, strengthEachTurn: 1, thorns: 2, blaze: 3,
  exhaustBlock: 1, exhaustDraw: 1, discardTide: 1, discardBlock: 1, cardDamage: 1, cardBlock: 1,
  rupture: 1, combust: 2, brutality: 1, drought: 1, cinderDamage: 2, exhaustBurn: 1,
  tideEachTurn: 1, drizzle: 1, riptide: 2, retainN: 1, tideSpendBlock: 1, tideSurge: 1,
  healStrength: 1, attackHeal: 1, attackSeed: 1, debuffDamage: 2, weakEachTurn: 1, weakBlock: 2, strengthHeal: 1 };
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

/** A card's effects after applying the evolution bonus (stage 0 = unchanged). */
export function scaledEffects(card, stage = 0) {
  const e = { ...card.effects };
  const k = 1 + STAGE_POWER * stage;
  for (const key of ['damage', 'bonusIfLow', 'block', 'heal', 'focus', 'blockEachTurn', 'healEachTurn', 'thorns', 'blaze', 'exhaustBlock', 'discardBlock', 'cardBlock', 'perExhausted', 'blockPerExhausted', 'combust', 'blockPerTide', 'blockPerCard', 'blockNext', 'riptide', 'weakBlock', 'debuffDamage']) {
    if (e[key]) e[key] = Math.round(e[key] * k);
  }
  if (e.burn) e.burn += stage;
  if (e.seed) e.seed += stage;
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
    const times = e.blockDamage === true ? 'your block' : e.blockDamage === 0.5 ? 'half your block' : `${e.blockDamage} times your block`;
    parts.push(e.block ? `Gain ${e.block} block, then deal damage equal to ${times}.` : `Deal damage equal to ${times}.`);
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
  if (e.strengthMult) parts.push(`Strength counts ${e.strengthMult} times.`);
  if (e.burn)         parts.push(e.burnTimes > 1 ? `Burn ${e.burn}, ${TIMES[e.burnTimes] ?? `${e.burnTimes} times`}.` : `Burn ${e.burn}.`);
  if (e.burnMult)     parts.push(`${MULT[e.burnMult] ?? `Multiply by ${e.burnMult}`} the enemy's Burn.`);
  if (e.weaken)       parts.push(`Apply ${e.weaken} Weak.`);
  if (e.vulnerable)   parts.push(`Apply ${e.vulnerable} Vulnerable.`);
  if (e.seed)         parts.push(`Leech Seed ${e.seed}.`);
  if (e.sap)          parts.push(`Apply ${e.sap} Sap.`);
  if (e.guard)        parts.push('Block the enemy\'s next attack completely.');
  if (e.block && !e.blockDamage) parts.push(`Gain ${e.block} block.`);
  if (e.blockMult)    parts.push(`${MULT[e.blockMult] ?? `Multiply by ${e.blockMult}`} your block.`);
  if (e.blockPerTide) parts.push(`Gain ${e.blockPerTide} block per Tide, then spend all your Tide.`);
  if (e.blockPerCard) parts.push(`Gain ${e.blockPerCard} block for each card in your hand.`);
  if (e.blockNext)    parts.push(`Next turn, gain ${e.blockNext} block.`);
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
  if (e.discardHand) {
    parts.push('Discard your hand.');
    const each = e.perDiscarded || {};
    if (each.draw) parts.push(`Draw ${plural(each.draw, 'card')} for each.`);
    if (each.addCard) parts.push(`Add a ${CARDS_BY_ID[each.addCard.id]?.name ?? each.addCard.id} to your hand for each.`);
  }
  if (e.draw)         parts.push(`Draw ${plural(e.draw, 'card')}.`);
  if (e.drawTo)       parts.push(`Draw until you have ${e.drawTo} cards.`);
  if (e.drawPerDebuff) parts.push(`Draw ${plural(e.drawPerDebuff, 'card')} for each kind of debuff on the enemy.`);
  if (e.discard)      parts.push(`Discard ${plural(e.discard, 'card')}.`);
  if (e.exhaustPick)  parts.push(`Exhaust ${plural(e.exhaustPick, 'card')} from your hand.`);
  if (e.playTop)      parts.push(e.playTop > 1 ? `Play the top ${e.playTop} cards of your draw pile and exhaust them.` : 'Play the top card of your draw pile and exhaust it.');
  if (e.exhume)       parts.push('Put a card from your exhaust pile into your hand.');
  if (e.tide)         parts.push(`Gain ${e.tide} Tide.`);
  if (e.tideMult)     parts.push(`${MULT[e.tideMult] ?? `Multiply by ${e.tideMult}`} your Tide.`);
  if (e.nextEnergy)   parts.push(e.nextEnergy > 0 ? `+${e.nextEnergy} energy next turn.` : `${-e.nextEnergy} less energy next turn.`);
  if (e.copyPick)     parts.push(`Choose a card in your hand. Add ${e.copyPick > 1 ? `${e.copyPick} copies` : 'a copy'} of it to your hand.`);
  if (e.randomCard)   parts.push('Add a random card of your type to your hand. It costs 0 this turn.');
  if (e.endure)       parts.push('Until your next turn, you can\'t drop below 1 HP.');
  if (e.addCard) {
    const { id, n = 1, to = 'hand' } = e.addCard;
    const name = CARDS_BY_ID[id]?.name ?? id;
    const some = n > 1 ? `${n} ${/s$/.test(name) ? `${name} cards` : `${name}s`}` : `a ${name}`;
    parts.push(to === 'draw' ? `Shuffle ${some} into your draw pile.` : `Add ${some} to ${PILES[to]}.`);
  }
  for (const [key, power] of Object.entries(POWERS)) if (e[key]) parts.push(power.text(e[key]));
  if (e.endTurnHurt)  parts.push(`If it's in your hand at the end of your turn, lose ${e.endTurnHurt} HP.`);
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
    parts.push(`Grows ${[g.damage && `+${g.damage} damage`, g.heal && `+${g.heal} heal`].filter(Boolean).join(' and ')} each turn it stays.`);
  }
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
      card.retain && ['Retain', 'Stays in your hand at the end of your turn instead of being discarded.'],
    ].filter(Boolean),
    tail: [
      card.ethereal && ['Ethereal', 'If it\'s still in your hand at the end of your turn, it\'s exhausted.'],
      card.exhaust && ['Exhaust', 'Gone for the rest of this fight once played. Back in your deck next fight.'],
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
    card.growOnRetain && ['Retain', 'Stays in your hand at the end of your turn instead of being discarded.'],
    uses(/^retain/) && ['Retain', 'A kept card stays in your hand at the end of your turn instead of being discarded.'],
    (uses(/exhaust|^playTop$|^exhume$|^corruption$/) || card.onExhaust) && ['Exhaust', 'An exhausted card is gone for the rest of this fight. It\'s back in your deck next fight.'],
    (uses(/discard/i) || card.onDiscard) && ['Discard', 'Moved from your hand to the discard pile. "When discarded" only triggers when a card makes you discard it.'],
    uses(/tide|^drizzle$/i) && ['Tide', 'Builds up and lasts all fight. A move that says "per Tide" spends all of it for a bigger hit.'],
    uses(/burn|^drought$/i) && ['Burn', 'The enemy takes that much damage at the start of its turn, then its Burn drops by 1.'],
    uses(/seed/i) && ['Leech Seed', 'At the start of its turn the enemy loses that much HP and you heal as much, then it drops by 1.'],
    uses(/^sap$/) && ['Sap', 'The enemy\'s attacks deal that much less, for the rest of the fight.'],
    uses(/weak/i) && ['Weak', 'The enemy deals 25% less damage. Lasts that many enemy turns.'],
    uses(/vulnerable/i) && ['Vulnerable', 'The enemy takes 50% more damage from your attacks. Lasts that many enemy turns.'],
    uses(/strength|^flex$/i) && ['Strength', 'Added to every hit you deal, shown as your 💪 badge.'],
    uses(/debuff/i) && ['Debuffs', 'Weak, Vulnerable, Leech Seed, Sap and Burn.'],
    (uses(/^perX$/) || card.cost === 'X') && ['X', 'This card spends all your PP, and X is how much it spent.'],
    e.combo && [`Combo ${e.combo.at}`, `The extra only happens if you've already played ${e.combo.at} other cards this turn.`],
    uses(/^ifHurt$|OnHurt$/) && ['Losing HP', 'Counts however it happens: your own cards, Poison, or the enemy\'s hits.'],
    card.upgraded && ['Upgraded', 'Made stronger with PP Up.'],
  ].filter(Boolean);
  return terms.filter(([label], i) => terms.findIndex(t => t[0] === label) === i);
}

/** The terms a card's text relies on, beyond its bold keywords (which explain themselves), as its text's tooltip. */
export function termTips(card) {
  const own = new Set([...keywords(card).lead, ...keywords(card).tail].map(([label]) => label));
  return cardTerms(card).filter(([label]) => !own.has(label)).map(([label, text]) => `${label}: ${text}`);
}
