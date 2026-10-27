# Card twins: the 2026-10-26 pass, and the signature cards' (2026-10-27)

The user found Bubble (Deal 5 damage. Apply 2 Weak. Gain 1 Tide.) and Bubble Beam (Deal 6. Weak 2. Tide 2.) side by side
in one hand and asked for every card that's "basically the same" to be found and changed "all across the board", so each
card a run can meet is its own thing. This file is that list: what each card read like, and what it does now.

## The rule

`node tools/card-twins.mjs` lists them, and `tests/cards.test.mjs` fails on any. Two cards one run can meet are:

- **twins** when they read the same once the numbers are taken out, **whatever they cost**: Bubble / Bubble Beam, Ember
  (Deal 7) / Firestorm (Deal 36), Harden (0 PP, Gain 5 block) / every type's Defend.
- **near twins** when they cost the same and one is the other plus one line, sharing two or more lines: Whirlpool (Deal 5.
  Weak 2.) / Bubble (the same, and Tide 1).

A card's lines are its sentences with the numbers out; an "If ...:", "Punish:", "Surface:" or "Unburden:" clause is one
line with what follows it; Exhaust, Retain, Innate, Ethereal, Power, Icicle and Illusion each count as a line. Punish and
"If the enemy intends to attack:" are the same test, so they read alike; "Add a Cinder" and "Add 3 Cinders" too.

What one run meets: its type's pool, the Neutral pool, its starting deck and both evolutions' cards; a Duo Run both
types'. Every type keeps its plain Strike and Defend ("Deal N damage.", "Gain N block."), which may match another type's in
a Duo Run, but no other card may be a plain Strike or Defend.

A **Safari signature card** (one per Safari Pokémon, one copy a run) is caught in any Safari run, a Duo Run too, so it is
held to the same rule against every card any run can meet and against every other signature card (`sigReport()`;
`tests/safarimons.test.mjs` fails on any). The last section lists them.

## What it found, and what changed

Before: **378 twin pairs and 182 near-twin pairs, 332 cards** (206 and 82 inside single-type runs; the rest met in a Duo
Run). Psychic had five "Deal X. Your next attack deals +Y." cards and five plain multi-hits; Electric six "Deal X.
Static Y."; Ground four Dig-then-hit cards; Neutral's Harden read like every type's Defend.

**197 cards** have new moves, each a different line of its own type's mechanics (no new mechanics, so the bot harness
needed no engine change). Ids and names stay, so saved runs load unchanged; Disable+ is named **Imprison** now (a card
named like an upgrade was a second Disable). The kept one of each family is usually the starting-deck card or the
common one; evolution cards, which were mostly a common with bigger numbers, became signature moves (Z-Moves exhaust:
Gigavolt Havoc, Subzero Slammer, Black Hole Eclipse). After: **0 twins, 0 near twins.**

Kept on purpose:
- **Safari signature cards** were outside this pass, then had their own the next day (the last section).
- **Kenmatta's dojo trials** were rebuilt on the new cards (the user's pick): each keeps its idea, and the solver finds
  only that idea in trials 9-20 (`docs/reference/events.md`).

## Every card that changed

### Neutral (5)

| Card | Read like | Before | Now |
|---|---|---|---|
| **Harden** common | Flame Wall, Block, Withdraw, Splash +8 | [0] Gain 5 block. | [0] The enemy's attacks deal 2 less this turn. Gain 3 block. |
| **Quick Attack** common | Fire Punch, Tackle, Bolt Strike, Cross Chop +1 | [0] Deal 4 damage. Draw 1 card. | [0] Deal 3 damage 2 times. Innate. |
| **Rapid Spin** common | Fire Punch (+1 line), Tackle (+1 line) | [1] Exhaust every status card in your hand. Deal 7 damage. Draw 1 card. | [1] Exhaust every status card in your hand. Deal 8 damage. +4 for each card exhausted. |
| **Double Team** uncommon | Aqua Veil, Reflective Screen, Telekinetic Wall | [1] Gain 6 block. Your block doesn't wear off at the start of your next turn. | [0] Gain 4 block. Add a Double Team to your discard pile. |
| **Agility** uncommon | Burn Up (+1 line), Psychic Overload (+1 line) | [0] Gain 1 energy. Draw 2 cards. Exhaust. | [0] Gain 1 energy. Draw 1 card. Exhaust. Innate. |

### Fire (16)

| Card | Read like | Before | Now |
|---|---|---|---|
| **Scorch** starting deck | Lava Plume (+1 line), Seed Bomb, Apple Acid, Grav Apple (+1 line) +7 | [2] Deal 10 damage. Apply 2 Vulnerable. | [2] Deal 8 damage. Burn 2. Apply 2 Vulnerable. |
| **Mystical Fire** common | Wood Hammer, Stun Spore, Bubble (+1 line), Muddy Water +10 | [1] Deal 6 damage. Apply 1 Weak. | [1] Deal 6 damage. If the enemy is Burned: Apply 2 Weak. |
| **Fire Punch** common | Tackle, Quick Attack, Rapid Spin (+1 line), Flip Turn (+1 line) +4 | [1] Deal 10 damage. Draw 1 card. | [1] Deal 9 damage. Add a Cinder to your hand. |
| **Flare** common | Fire Spin, Flame Blast, Flamethrower | [0] Deal 4 damage. Burn 1. | [0] Deal 4 damage. Exhaust 1 card from your hand. |
| **Heat Wave** uncommon | Fire Lash | [2] Deal 5 damage 3 times. Burn 2. | [2] Deal 5 damage 3 times. If the enemy is Burned: It hits once more. |
| **Blaze Kick** uncommon | Fire Spin (+1 line), Flare Blitz (+1 line), Chloroblast (+1 line) | [1] Lose 2 HP. Deal 9 damage. Burn 4. | [1] Deal 9 damage. If you've lost HP this turn: Burn 5. |
| **Inferno Charge** uncommon | Flame Charge, Gigavolt Havoc, Live Wire, Electro Shot | [2] Deal 9 damage. +2 energy next turn. | [2] Lose 2 HP. Deal 11 damage. +2 energy next turn. |
| **Flame Charge** evolution 1 | Inferno Charge, Gigavolt Havoc, Live Wire, Charge Beam (+1 line) +1 | [1] Deal 10 damage. +1 energy next turn. | [1] Deal 9 damage. Gain 1 energy. Exhaust 1 card from your hand. |
| **Fire Blast** evolution 2 | Scorch, once Scorch burned (+1 line) | [2] Burn 8. Apply 2 Vulnerable. | [2] Burn 7. Apply 2 Weak. Apply 2 Vulnerable. |
| **Fire Fang** evolution 1 | Fire Spin (+1 line) | [1] Deal 8 damage. Burn 3. If the enemy intends to attack: Apply 2 Weak. | [1] Deal 9 damage. If the enemy intends to attack: Burn 4. Apply 2 Weak. |
| **Flame Blast** rare | Fire Spin, Flare, Flamethrower | [2] Deal 18 damage. Burn 4. | [2] Deal 16 damage. Burn 3. If the enemy is Burned: Gain 1 energy. |
| **Flamethrower** evolution 2 | Fire Spin, Flare, Flame Blast | [2] Deal 22 damage. Burn 3. | [2] Deal 18 damage. Burn 3, twice. |
| **Firestorm** rare | Ember, Vine Whip, Razor Leaf, Branch Poke +8 | [3] Deal 36 damage. | [3] Deal 24 damage. Shuffle 3 Cinders into your draw pile. |
| **Overheat** evolution 2 | Flare Up | [3] Deal 30 damage. +12 if your HP is below half. | [3] Lose 4 HP. Deal 28 damage. +12 if your HP is below half. |
| **Lava Plume** uncommon | Scorch (+1 line), Seed Bomb (+1 line), Wood Hammer (+1 line), Grav Apple +8 | [2] Deal 15 damage. Apply 1 Weak. Apply 1 Vulnerable. | [2] Deal 12 damage. Burn 3. Apply 1 Weak. |
| **Ember Veil** uncommon | Rage Powder, Defog, Wingspan (+1 line), Snarl | [2] Apply 2 Weak. Gain 13 block. | [2] Burn 2. Apply 1 Weak. Gain 11 block. |

### Grass (22)

| Card | Read like | Before | Now |
|---|---|---|---|
| **Branch Poke** common | Vine Whip, Razor Leaf, Solar Beam, Ember +8 | [0] Deal 4 damage. | [0] Deal 3 damage. Your hits deal +2 this turn. |
| **Razor Leaf** common | Vine Whip, Branch Poke, Solar Beam, Ember +8 | [2] Deal 16 damage. | [2] Deal 13 damage. If the enemy has Leech Seed: +7 damage. |
| **Solar Beam** rare | Vine Whip, Razor Leaf, Branch Poke, Ember +8 | [3] Deal 36 damage. | [3] Deal 30 damage. If you've healed this turn: Gain 1 energy. |
| **Bullet Seed** common | Double Hit, Razor Storm, Surging Strikes | [1] Deal 3 damage 3 times. | [1] Deal 3 damage 3 times. If the enemy has Leech Seed: It hits 2 more times. |
| **Razor Storm** evolution 1 | Bullet Seed, Double Hit, Surging Strikes | [2] Deal 3 damage 6 times. | [2] Deal 3 damage 5 times. Heal the damage that gets through. |
| **Wood Hammer** common | Stun Spore, Grav Apple (+1 line), Mystical Fire, Lava Plume (+1 line) +15 | [2] Deal 14 damage. Apply 2 Weak. | [2] Deal 15 damage. If the enemy is Weak: Apply 1 Sap. |
| **Chloroblast** uncommon | Blaze Kick (+1 line), Flare Blitz, Brave Bird (+1 line) | [1] Lose 3 HP. Deal 18 damage. | [2] Lose 4 HP. Deal 20 damage. If you've healed this turn: +10 damage. |
| **Stun Spore** common | Wood Hammer, Mystical Fire, Bubble (+1 line), Muddy Water +10 | [1] Deal 6 damage. Apply 1 Weak. | [1] Deal 5 damage. If the enemy intends to attack: Apply 2 Weak. |
| **Apple Acid** common | Seed Bomb, Scorch, Liquidation, Flying Press +1 | [1] Deal 8 damage. Apply 1 Vulnerable. | [1] Deal 8 damage. Apply 1 Vulnerable. Retain. |
| **Seed Bomb** starting deck | Apple Acid, Grav Apple (+1 line), Scorch, Lava Plume (+1 line) +7 | [2] Deal 10 damage. Apply 2 Vulnerable. | [2] Deal 9 damage. Apply 2 Vulnerable. Leech Seed 1. |
| **Seed Flare** uncommon | Snap Trap | [2] Deal 12 damage. Leech Seed 2. | [2] Deal 12 damage. If the enemy has Leech Seed: Apply 2 Vulnerable. |
| **Mega Drain** common | Absorb, Giga Drain, Oblivion Wing | [2] Deal 12 damage. Heal 6 HP. | [2] Deal 10 damage. Heal 3 HP. If the enemy has Leech Seed: Heal 4 HP. |
| **Giga Drain** evolution 2 | Absorb, Mega Drain, Oblivion Wing | [2] Deal 20 damage. Heal 12 HP. | [2] Deal 18 damage. Leech Seed 2. Heal 6 HP. |
| **Floral Healing** uncommon | Leaf Guard, Aqua Ring, Lick Wounds | [1] Gain 5 block. Heal 5 HP. | [1] Gain 6 block. Heal 1 HP for each strength you have. |
| **Petal Dance** common | Leaf Storm, Clamp, Thunderclap (+1 line), Frost Nip (+1 line) +5 | [1] Deal 6 damage. Gain 6 block. | [1] Deal 4 damage 2 times. Gain 5 block. |
| **Leaf Storm** evolution 2 | Petal Dance, Clamp, Ice Hammer, Headlong Rush | [3] Deal 26 damage. Gain 8 block. | [3] Deal 26 damage. Then gain 2 block for each strength you have. |
| **Solar Blade** rare | Power Whip (+1 line), Darkest Lariat (+1 line) | [2] Deal 8 damage. Strength counts 4 times. Retain. | [2] Deal 14 damage. If you've healed this turn: Strength counts 3 times. Retain. |
| **Frenzy Plant** evolution 2 | Power Whip, Darkest Lariat | [3] Deal 30 damage. Strength counts 4 times. | [3] Deal 34 damage. Strength counts 4 times. 1 less energy next turn. |
| **Petal Blizzard** evolution 2 | Petal Storm | [2] Deal 12 damage 2 times. Apply 2 Vulnerable. | [2] Deal 10 damage 2 times. Apply 2 Weak. Heal 4 HP. |
| **Grav Apple** uncommon | Seed Bomb (+1 line), Wood Hammer (+1 line), Scorch (+1 line), Lava Plume +8 | [2] Deal 15 damage. Apply 1 Weak. Apply 1 Vulnerable. | [2] Deal 14 damage. Apply 1 Vulnerable. Apply 1 Sap. |
| **Rage Powder** uncommon | Ember Veil, Chilling Water (+1 line), Scrappy (+1 line), Tremor (+1 line) +3 | [1] Apply 1 Weak. Gain 8 block. | [1] Gain 8 block. If the enemy is Weak: Gain 5 block. |
| **Grass Whistle** uncommon | Sleep Powder (+1 line), Aromatic Mist (+1 line), Chilling Water (+1 line) | [1] Apply 1 Weak. Draw 2 cards. | [1] Apply 1 Weak. If the enemy intends to attack: Draw 2 cards. |

### Water (20)

| Card | Read like | Before | Now |
|---|---|---|---|
| **Splash** common | Withdraw, Harden, Flame Wall, Block +7 | [0] Gain 4 block. | [0] When discarded: Gain 5 block. Unplayable. |
| **Bubble Beam** evolution 1 | Bubble, Whirlpool (+1 line), Mystical Fire (+1 line), Stun Spore (+1 line) | [1] Deal 6 damage. Apply 2 Weak. Gain 2 Tide. | [1] Apply 2 Weak. Draw 1 card. Gain 3 Tide. |
| **Whirlpool** uncommon | Bubble (+1 line), Muddy Water, Bubble Beam (+1 line), Scald +10 | [1] Deal 5 damage. Apply 2 Weak. | [1] Deal 3 damage 2 times. Apply 2 Weak. |
| **Muddy Water** common | Whirlpool, Scald, Mystical Fire, Lava Plume (+1 line) +15 | [2] Deal 14 damage. Apply 2 Weak. | [2] Deal 13 damage. Apply 2 Weak. Discard 1 card. |
| **Scald** evolution 2 | Muddy Water, Whirlpool, Mystical Fire, Lava Plume (+1 line) +15 | [2] Deal 20 damage. Apply 2 Weak. | [2] Deal 14 damage. +1 per Tide (it isn't spent). Burn 3. |
| **Rain Dance** common | Dive (+1 line) | [1] Gain 4 block. Gain 2 Tide. | [1] Gain 2 Tide. +1 energy next turn. |
| **Origin Pulse** evolution 2 | Surf | [3] Deal 26 damage. Gain 3 Tide. | [3] Deal 24 damage. Draw 2 cards. Gain 3 Tide. |
| **Flip Turn** common | Waterfall (+1 line), Tackle (+1 line), Aqua Jet (+1 line), Fire Punch (+1 line) | [1] Deal 10 damage. Draw 1 card. Discard 1 card. | [1] Deal 7 damage. +4 for each card you've discarded this turn. |
| **Aqua Step** common | Waterfall, Ebb Tide (+1 line) | [0] Draw 1 card. Discard 1 card. | [0] Gain 4 block. Discard 1 card. Gain 1 Tide. |
| **Crabhammer** uncommon | Hydro Pump, Brine (+1 line) | [2] Deal 12 damage. +3 per Tide, then spend all your Tide. | [2] Deal 6 damage 2 times. +2 per Tide, then spend all your Tide. |
| **Brine** evolution 1 | Crabhammer (+1 line), Hydro Pump (+1 line) | [2] Deal 8 damage. +4 per Tide, then spend all your Tide. Gain 2 block per Tide spent. | [2] Deal 9 damage. +2 per Tide (it isn't spent). Draw 1 card. |
| **Surging Strikes** uncommon | Double Hit, Bullet Seed, Razor Storm | [2] Deal 5 damage 3 times. | [2] Deal 4 damage 3 times. +1 per Tide (it isn't spent). |
| **Hydro Cannon** evolution 2 | Aqua Cutter | [3] Deal 34 damage. Grows +6 damage each turn it stays. Retain. | [3] Deal 20 damage 2 times. 1 less energy next turn. |
| **Iron Shell** rare | Iron Defense, Ion Barrier | [2] Gain 36 block. Exhaust. | [2] Gain 24 block. Your block doesn't wear off at the start of your next turn. Exhaust. |
| **Bubble Shield** uncommon | Heatproof | [1] Gain 12 block. Ethereal. | [1] Gain 10 block. Gain 1 Tide. Ethereal. |
| **Water Absorb** uncommon | Cotton Guard, Capacitor | [2] Gain 16 block. Retain. | [2] Gain 13 block. Heal 4 HP. Retain. |
| **Aqua Ring** uncommon | Leaf Guard, Floral Healing, Lick Wounds | [1] Gain 6 block. Heal 3 HP. | [1] Heal 4 HP. Gain 2 Tide. |
| **Mirror Coat** uncommon | Spiky Shield | [1] When the enemy attacks you, it takes 4 damage. | [1] When the enemy attacks you, it takes 3 damage. At the start of each turn, gain 1 Tide. |
| **Liquidation** uncommon | Scorch, Seed Bomb, Apple Acid, Flying Press +1 | [1] Deal 8 damage. Apply 1 Vulnerable. | [1] Deal 10 damage. If you've discarded a card this turn: Apply 2 Vulnerable. |
| **Sparkling Aria** uncommon | Water Sport, but for its Exhaust | [2] Gain 4 Tide. | [2] Draw 2 cards. Gain 3 Tide. |

### Electric (24)

| Card | Read like | Before | Now |
|---|---|---|---|
| **Nuzzle** common | Zing Zap (+1 line), Thunder, Zap Cannon, Electro Ball (+1 line) +3 | [1] Deal 6 damage. Static 3. | [1] Deal 5 damage. Static 3. If the enemy will be Paralyzed: Gain 1 energy. |
| **Zap Cannon** rare | Nuzzle, Thunder, Plasma Fists, Thunder Punch +1 | [3] Deal 20 damage. Static 10. | [3] Deal 22 damage. Double the enemy's Static. |
| **Plasma Fists** uncommon | Spark (+1 line), Nuzzle, Thunder, Zap Cannon +3 | [2] Deal 11 damage. Static 5. | [2] Deal 5 damage 2 times. Static 3. |
| **Thunder Punch** evolution 1 | Nuzzle, Zing Zap (+1 line), Thunder, Zap Cannon +3 | [1] Deal 9 damage. Static 4. | [1] Deal 8 damage. Static 3. Your hits deal +1 all fight. |
| **Fusion Bolt** evolution 2 | Spark (+1 line), Nuzzle, Thunder, Zap Cannon +3 | [2] Deal 22 damage. Static 8. | [2] Deal 20 damage. Static 6. If you've switched this turn: +10 damage. |
| **Wild Charge** evolution 1 | Volt Switch, Stoked Sparksurfer (+1 line), Supercell Slam | [2] Deal 16 damage. Switch. | [2] Lose 3 HP. Deal 18 damage. Switch. |
| **Supercell Slam** evolution 2 | Volt Switch, Stoked Sparksurfer (+1 line), Wild Charge | [2] Deal 24 damage. Switch. | [2] Deal 26 damage. Draw 1 card. Switch. |
| **Electro Ball** common | Nuzzle (+1 line), Tackle (+1 line), Thunder Punch (+1 line), Fire Punch (+1 line) | [1] Deal 6 damage. Static 2. Draw 1 card. | [1] Deal 5 damage. Static 2. If you've switched this turn: Draw 2 cards. |
| **Thunderclap** common | Volt Switch (+1 line), Polarity Swap (+1 line), Petal Dance (+1 line) | [1] Deal 6 damage. Gain 5 block. Switch. | [1] Deal 7 damage. If you've switched this turn: Gain 6 block. |
| **Gigavolt Havoc** rare | Live Wire, Electro Shot, Inferno Charge, Flame Charge | [5] Deal 50 damage. +3 energy next turn. | [5] Deal 50 damage. +3 energy next turn. Exhaust. |
| **Electro Shot** evolution 2 | Gigavolt Havoc, Live Wire, Inferno Charge, Flame Charge | [3] Deal 34 damage. +2 energy next turn. | [3] Deal 30 damage. If the enemy will be Paralyzed: Gain 2 energy. |
| **Charge Beam** evolution 1 | Live Wire (+1 line), Recharge (+1 line), Tackle (+1 line), Fire Punch (+1 line) +1 | [1] Deal 8 damage. Draw 1 card. +1 energy next turn. | [1] Deal 8 damage. Your next attack deals +6 damage. |
| **Power Cell** uncommon | Cell Battery | [2] Gain 10 block. +2 energy next turn. | [2] Gain 10 block. Gain 1 energy for every 8 cards in your draw pile. |
| **Electroweb** common | Eerie Impulse, Zap Shield | [2] Static 4. Gain 12 block. | [2] Apply 1 Weak. Static 3. Gain 10 block. |
| **Zap Shield** uncommon | Eerie Impulse, Electroweb | [0] Static 2. Gain 4 block. | [0] Static 2. If you've switched this turn: Gain 6 block. |
| **Electric Relay** uncommon | Transistor (+1 line) | [1] Gain 6 block. If you've switched this turn: Draw 2 cards. | [1] Draw 2 cards. Switch. |
| **Surge Protector** uncommon | Magnet Rise, Harden, Flame Wall, Block +7 | [3] Gain 24 block. | [3] Gain 22 block. Gain 1 energy. |
| **Capacitor** common | Cotton Guard, Water Absorb | [2] Gain 14 block. Retain. | [2] Gain 13 block. Costs 1 less each turn it stays. Retain. |
| **Insulate** common | Shelter, Mud Armor | [1] Gain 5 block. Next turn, gain 5 block. | [1] Gain 7 block. If the enemy will be Paralyzed: Gain 7 block. |
| **Magnetic Field** uncommon | Water Veil | [2] At the start of each turn, gain 4 block. | [2] At the start of each turn, gain 3 block. At the start of each turn, Static 1. |
| **Ion Barrier** rare | Iron Defense, Iron Shell | [2] Gain 32 block. Exhaust. | [2] Static 6. Gain 24 block. Exhaust. |
| **Thunderbolt** evolution 1 | Mystical Fire, Lava Plume (+1 line), Wood Hammer, Stun Spore +15 | [2] Deal 17 damage. Apply 1 Weak. | [2] Deal 14 damage. +1 for each Static on the enemy. Apply 1 Weak. |
| **Bolt Strike** evolution 2 | Tackle, Quick Attack, Fire Punch, Cross Chop | [3] Deal 32 damage. Draw 2 cards. | [3] Deal 30 damage. Static 5. Gain 1 energy. |
| **Polarity Swap** uncommon | Thunderclap (+1 line), Baton Pass | [1] Gain 9 block. Switch. | [1] Gain 5 block. +2 block for each time you've switched this fight. Switch. |

### Ice (16)

| Card | Read like | Before | Now |
|---|---|---|---|
| **Ice Beam** uncommon | Icy Wind, Black Ice, Glacial Lance (+1 line), Wood Hammer (+1 line) +5 | [2] Deal 11 damage. Apply 1 Weak. Frostbite 3. | [2] Deal 12 damage. Frostbite 3. Draw 1 card. |
| **Black Ice** common | Icy Wind, Ice Fang (+1 line), Ice Beam, Freezing Glare (+1 line) +4 | [1] Deal 7 damage. Apply 1 Weak. Frostbite 1. | [1] Deal 7 damage. If the enemy has Frostbite: Apply 2 Weak. |
| **Aurora Beam** evolution 1 | Ice Fang, Frost Nip (+1 line), Black Ice (+1 line), Glacial Lance | [1] Deal 9 damage. Frostbite 3. | [2] Deal 12 damage. Frostbite 4. Apply 1 Sap. |
| **Glacial Lance** evolution 2 | Icy Wind (+1 line), Ice Fang, Ice Beam (+1 line), Aurora Beam | [2] Deal 22 damage. Frostbite 6. | [2] Deal 18 damage. Frostbite 5. In Hail: +8 damage. |
| **Frost Nip** common | Frost Armor (+1 line), Ice Fang (+1 line), Aurora Beam (+1 line), Petal Dance (+1 line) | [1] Deal 5 damage. Frostbite 1. Gain 5 block. | [1] Deal 5 damage. Gain 5 block. If the enemy has Frostbite: Draw 1 card. |
| **Icicle Crash** uncommon | Ice Shard, Ice Ball | [2] Deal 14 damage. Icicle. | [2] Deal 12 damage. Frostbite 2. Icicle. |
| **Ice Ball** evolution 1 | Ice Shard, Icicle Crash | [0] Deal 5 damage. Icicle. | [0] Deal 4 damage. Each time you play it, it deals 3 more this fight. Icicle. |
| **Triple Axel** evolution 2 | Icicle Spear | [1] Deal 5 damage 3 times. Icicle. | [2] Deal 6 damage 3 times. Frostbite 3. Icicle. |
| **Brinicle** uncommon | Ice Spinner, Petal Dance (+1 line) | [1] Deal 4 damage. Gain 4 block. Icicle. | [1] Deal 4 damage. Frostbite 2. Gain 4 block. Icicle. |
| **Avalanche** evolution 1 | Mountain Gale, Freeze Shock | [2] Deal 14 damage. Hail 2. | [2] Deal 14 damage. In Hail: Apply 2 Weak. |
| **Freeze Shock** evolution 2 | Mountain Gale, Avalanche | [2] Deal 20 damage. Hail 3. | [2] Deal 18 damage. Frostbite 3. Hail 2. |
| **Snow Fort** uncommon | Chilly Reception, Iceberg | [2] Hail 2. Gain 11 block. | [2] Hail 2. Gain 7 block. Next turn, gain 6 block. |
| **Iceberg** rare | Chilly Reception, Snow Fort | [3] Hail 3. Gain 22 block. | [3] Frostbite 4. Hail 2. Gain 20 block. |
| **Ice Wall** common | Frost Armor | [2] Frostbite 3. Gain 11 block. | [2] Gain 12 block. If the enemy has Frostbite: Gain 1 energy. |
| **Ice Hammer** evolution 1 | Petal Dance, Leaf Storm, Clamp, Headlong Rush | [2] Deal 16 damage. Gain 6 block. | [2] Deal 16 damage. +2 block for each Frostbite on the enemy. |
| **Subzero Slammer** evolution 2 | Mystical Fire, Wood Hammer, Stun Spore, Muddy Water +6 | [3] Deal 34 damage. Apply 2 Weak. | [3] Deal 34 damage. Frostbite 8. Exhaust. |

### Fighting (13)

| Card | Read like | Before | Now |
|---|---|---|---|
| **Circle Throw** uncommon | Vital Throw, Wide Guard, Seismic Toss | [2] Gain 12 block. Counter 6. | [2] Gain 12 block. If the enemy attacked you last turn: Counter 8. |
| **Wide Guard** evolution 1 | Vital Throw, Circle Throw, Seismic Toss | [1] Gain 10 block. Counter 5. | [1] Counter 6. Next turn, gain 8 block. |
| **Seismic Toss** evolution 2 | Vital Throw, Circle Throw, Wide Guard | [1] Gain 12 block. Counter 12. | [1] Gain 10 block. Counter twice the HP you lost last enemy turn. |
| **Submission** evolution 1 | Close Combat, Meteor Assault | [1] Deal 16 damage. Add a Sore to your hand. | [1] Deal 9 damage 2 times. Add a Sore to your hand. |
| **Meteor Assault** rare | Close Combat, Hammer Arm (+1 line), Submission | [2] Deal 26 damage. Add 2 Sores to your hand. | [2] Deal 22 damage. +4 for each status card in your hand. Add 2 Sores to your hand. |
| **Brace** uncommon | No Retreat (+1 line), Parry (+1 line) | [1] Gain 10 block. Add a Sore to your hand. Follow-up (attack): Draw 1 card. | [1] Next turn, gain 12 block. Follow-up (attack): Draw 1 card. |
| **Scrappy** uncommon | No Retreat (+1 line), Rage Powder (+1 line) | [1] Apply 1 Weak. Gain 8 block. Add a Sore to your hand. | [1] Apply 2 Weak. Gain 5 block. Gain 1 energy. Add a Sore to your hand. |
| **Dynamic Punch** evolution 2 | Reversal | [2] Deal 24 damage. +4 for each status card in your hand. | [2] Deal 22 damage. Apply 2 Vulnerable. Add a Sore to your hand. |
| **Sacred Sword** rare | Low Sweep, Wood Hammer (+1 line), Muddy Water (+1 line), Scald (+1 line) +3 | [2] Deal 14 damage. Apply 2 Weak. Follow-up (skill): Gain 12 block. | [2] Deal 18 damage. Follow-up (skill): Gain 12 block. |
| **Iron Will** uncommon | Grit | [2] Gain 10 block. +4 block for each status card in your hand. | [2] Gain 14 block. +3 Counter for each status card in your hand. |
| **Cross Chop** evolution 1 | Tackle, Quick Attack, Fire Punch, Incinerate (+1 line) +1 | [2] Deal 18 damage. Draw 1 card. | [2] Deal 9 damage 2 times. Follow-up (skill): Draw 2 cards. |
| **Stare Down** uncommon | Poison Powder | [1] Apply 1 Weak. Apply 1 Sap. | [1] Apply 2 Weak. If the enemy attacked you last turn: Apply 1 Sap. |
| **Flying Press** evolution 2 | Scorch, Seed Bomb, Apple Acid, Liquidation +1 | [3] Deal 34 damage. Apply 2 Vulnerable. | [3] Deal 28 damage. Apply 2 Vulnerable. Counter 8. |

### Ground (19)

| Card | Read like | Before | Now |
|---|---|---|---|
| **Cave In** uncommon | Dig, Landslide (+1 line), Burrow, Thousand Arrows | [2] Gain 12 block. Dig. Surface: Deal 12 damage. | [2] Dig. Surface: Deal 12 damage. Gain 12 block. |
| **Burrow** evolution 1 | Dig, Cave In, Thousand Arrows | [1] Gain 8 block. Dig. Surface: Deal 14 damage. | [1] Dig. Surface: Deal 10 damage. Draw 2 cards. |
| **Thousand Arrows** evolution 2 | Dig, Landslide (+1 line), Cave In, Burrow | [2] Gain 10 block. Dig. Surface: Deal 24 damage. | [2] Gain 10 block. Dig. Surface: Deal 6 damage 4 times. |
| **Landslide** rare | Tunnel, Cave In (+1 line), Thousand Arrows (+1 line) | [2] Dig. Surface: Deal 30 damage. | [2] Fault 8. Dig. Surface: Deal 24 damage. |
| **Earthquake** uncommon | Bulldoze (+1 line), Mud Bomb, Magnitude, Thousand Waves | [2] Deal 12 damage. Fault 6. | [2] Deal 11 damage. Fault 5. In Sandstorm: Fault 5. |
| **Magnitude** evolution 1 | Mud Bomb, Earthquake, Thousand Waves | [1] Deal 8 damage. Fault 8. | [1] Deal 7 damage. If the enemy has Fault: +7 damage. |
| **Thousand Waves** evolution 2 | Mud Bomb, Earthquake, Magnitude | [1] Deal 6 damage. Fault 14. | [1] Fault 12. The enemy's attacks deal 5 less this turn. |
| **Haboob** uncommon | Sand Cloak, Desert Fortress | [2] Sandstorm 3. Gain 10 block. | [2] Apply 2 Weak. Sandstorm 3. Gain 8 block. |
| **Desert Fortress** rare | Sand Cloak, Haboob | [2] Sandstorm 2. Gain 18 block. | [2] Sandstorm 2. Gain 14 block. Your block doesn't wear off at the start of your next turn. |
| **Hibernate** uncommon | Shore Up (+1 line), Bone Club (+1 line), Antlion Pit (+1 line) | [1] Dig. Surface: Gain 15 block. | [1] Dig. Surface: Gain 10 block. Heal 4 HP. |
| **Shore Up** uncommon | Hunker Down, Hibernate (+1 line) | [1] Gain 7 block. Dig. Surface: Gain 7 block. | [1] Heal 4 HP. Dig. Surface: Gain 8 block. |
| **Stalagmites** rare | Quagmire | [2] Gain 10 block. Dig. Surface: Apply 2 Weak. Fault 12. | [2] Gain 10 block. Dig. Surface: Deal 10 damage. Fault 10. |
| **Sandsear Storm** evolution 2 | Sand Spit | [2] Deal 20 damage. Sandstorm 3. | [2] Deal 18 damage. Burn 4. In Sandstorm: Burn 4. |
| **Tremor** common | Sand Attack (+1 line), Sand Tomb (+1 line), Rage Powder (+1 line) | [1] Apply 1 Weak. Fault 2. Gain 5 block. | [1] Apply 1 Weak. Gain 3 block. +1 block for each Fault on the enemy. |
| **Embankment** common | Solid Rock (+1 line), Thick Fat, Wingspan (+1 line) | [2] Apply 1 Sap. Gain 12 block. | [2] Apply 1 Sap. Gain 11 block. If the enemy has Fault: Gain 5 block. |
| **Bunker** rare | Dig In (+1 line) | [1] Gain 6 block. +4 block for each card underground. Dig. Surface: Draw 1 card. | [1] Gain 5 block. +4 block for each card underground. Dig. Surface: Gain 6 block. |
| **Mud Armor** uncommon | Shelter, Insulate | [1] Gain 7 block. Next turn, gain 5 block. | [1] Gain 7 block. In Sandstorm: Next turn, gain 7 block. |
| **High Horsepower** evolution 1 | Bulldoze (+1 line), Mystical Fire, Lava Plume (+1 line), Wood Hammer +15 | [2] Deal 18 damage. Apply 1 Weak. | [2] Deal 15 damage. Fault 5. Draw 1 card. |
| **Headlong Rush** evolution 2 | Petal Dance, Leaf Storm, Clamp, Ice Hammer | [3] Deal 34 damage. Gain 8 block. | [3] Lose 4 HP. Deal 36 damage. Fault 8. |

### Flying (16)

| Card | Read like | Before | Now |
|---|---|---|---|
| **Fly** uncommon | Aerial Ace, Dragon Ascent, Sky Fall | [2] Deal 12 damage. Evasion 2. | [2] Deal 8 damage. +4 for each Evasion you have. Evasion 1. |
| **Dragon Ascent** evolution 2 | Aerial Ace, Fly, Sky Fall | [2] Deal 22 damage. Evasion 2. | [2] Deal 18 damage. Evasion 2. Unburden: +12 damage. |
| **Sky Fall** evolution 2 | Aerial Ace, Fly, Dragon Ascent | [3] Deal 34 damage. Evasion 1. | [3] Deal 30 damage. Evasion 1. Tailwind 2. |
| **Hurricane** uncommon | Twister | [2] Deal 6 damage 3 times. In Tailwind: It hits once more. | [2] Deal 5 damage 3 times. +2 for each turn of Tailwind left. |
| **Swoop** evolution 1 | Peck | [0] Deal 6 damage. Unburden: Draw 2 cards. | [0] Deal 6 damage. Unburden: Gain 1 energy. |
| **Preen** common | Glide, Ruffle (+1 line) | [0] Gain 3 block. Unburden: Gain 4 block. | [0] Heal 2 HP. Unburden: Gain 5 block. |
| **Down Feathers** uncommon | Tangled Feet, Steel Wing | [2] Evasion 1. Gain 12 block. | [2] Evasion 1. Apply 1 Sap. Gain 10 block. |
| **Steel Wing** evolution 1 | Tangled Feet, Down Feathers | [1] Evasion 1. Gain 9 block. | [1] Deal 8 damage. Next turn, gain 8 block. |
| **Windbreak** uncommon | Crosswind, Sky Fortress | [2] Tailwind 2. Gain 10 block. | [2] Apply 1 Weak. Tailwind 2. Gain 8 block. |
| **Sky Fortress** rare | Crosswind, Windbreak | [2] Tailwind 2. Gain 16 block. | [2] Tailwind 2. Gain 12 block. Your block doesn't wear off at the start of your next turn. |
| **Cloud Nine** rare | Feather Dance (+1 line) | [1] Apply 2 Weak. Evasion 1. In Tailwind: Apply 1 Sap. | [1] Evasion 2. In Tailwind: Evasion 1. Draw 2 cards. |
| **Defog** common | Wingspan (+1 line), Ember Veil, Rage Powder, Snarl | [2] Apply 2 Weak. Gain 12 block. | [2] Exhaust every status card in your hand. Apply 2 Weak. Gain 10 block. |
| **Wing Attack** starting deck | Scorch, Lava Plume (+1 line), Seed Bomb, Apple Acid +7 | [2] Deal 10 damage. Apply 2 Vulnerable. | [2] Deal 9 damage. Apply 2 Vulnerable. Unburden: Draw 1 card. |
| **Wing Strike** evolution 1 | Mystical Fire, Lava Plume (+1 line), Wood Hammer, Stun Spore +15 | [2] Deal 18 damage. Apply 1 Weak. | [2] Deal 16 damage. In Tailwind: Apply 2 Weak. |
| **Oblivion Wing** rare | Absorb, Mega Drain, Giga Drain | [2] Deal 14 damage. Heal 7 HP. | [2] Deal 14 damage. Evasion 1. Heal the damage that gets through. |
| **Brave Bird** rare | Flare Blitz (+1 line), Chloroblast (+1 line) | [1] Lose 3 HP. Deal 20 damage. Unburden: Gain 1 energy. | [2] Lose 4 HP. Deal 26 damage. Unburden: Gain 2 energy. |

### Dark (20)

| Card | Read like | Before | Now |
|---|---|---|---|
| **Ransack** uncommon | Covet, Jaw Lock (+1 line), Heist, Grand Larceny | [1] Deal 8 damage. Steal 2. | [1] Deal 5 damage 2 times. Steal 1. |
| **Heist** evolution 1 | Covet, Ransack, Jaw Lock (+1 line), Grand Larceny | [1] Deal 9 damage. Steal 2. | [1] Steal 2. Draw 2 cards. |
| **Grand Larceny** evolution 2 | Snatch (+1 line), Covet, Ransack, Plunder (+1 line) +1 | [2] Deal 20 damage. Steal 3. | [2] Deal 16 damage. Steal 3. Then gain 2 block for each strength you have. |
| **Jaw Lock** uncommon | Covet (+1 line), Ransack (+1 line), Heist (+1 line) | [1] Deal 8 damage. Steal 1. If the enemy has strength or block: Draw 1 card. | [1] Deal 8 damage. If the enemy has strength or block: Apply 2 Weak. |
| **Plunder** rare | Pay Day (+1 line), Grand Larceny (+1 line) | [2] Deal 14 damage. Steal 2. If this knocks the enemy out, gain 20 ₽. | [2] Deal 12 damage. Steal 2. If the enemy has strength or block: Steal 2. |
| **Black Hole Eclipse** evolution 2 | Throat Chop | [2] Deal 20 damage. Punish: +12 damage. | [2] Deal 34 damage. Steal 3. Exhaust. |
| **False Surrender** uncommon | Throat Chop (+1 line) | [1] Deal 8 damage. Punish: +5 damage. Illusion. | [1] Deal 8 damage. Punish: Disguise. Illusion. |
| **Shadow Cloak** uncommon | Disguise, Shadow Fortress | [2] Gain 12 block. Disguise. | [2] Gain 11 block. Disguise. Your block doesn't wear off at the start of your next turn. |
| **Shadow Fortress** rare | Disguise, Shadow Cloak | [2] Gain 16 block. Disguise. | [2] Gain 12 block. Disguise. +3 block for each other Illusion card you've played this turn. |
| **Masquerade** uncommon | Disguise (+1 line) | [1] Gain 5 block. Disguise. Draw 2 cards. | [1] Apply 1 Weak. Disguise. Draw 1 card. |
| **Vanishing Act** uncommon | Disguise (+1 line), Pilfer (+1 line), Siphon (+1 line) | [1] Steal 1. Gain 5 block. Disguise. | [1] The enemy's attacks deal 6 less this turn. Disguise. |
| **Siphon** uncommon | Pilfer, Knock Away, Vanishing Act (+1 line) | [1] Steal 2. Gain 6 block. | [1] Steal 1. Heal 5 HP. |
| **Knock Away** uncommon | Pilfer, Siphon | [2] Steal 1. Gain 12 block. | [2] Steal 1. The enemy's intent becomes its next attack. Gain 10 block. |
| **Cower** common | Brace for It | [0] Gain 3 block. Punish: Gain 4 block. | [0] The enemy's attacks deal 3 less this turn. Punish: Draw 1 card. |
| **Spite Guard** uncommon | Lurk | [2] Gain 11 block. Punish: Apply 2 Weak. | [2] Gain 10 block. Punish: Apply 1 Sap. |
| **Dark Void** evolution 2 | Veiled Strike | [2] Deal 24 damage. Disguise. Illusion. | [3] Deal 12 damage. The enemy skips its next turn. Illusion. Exhaust. |
| **Snarl** common | Ember Veil, Rage Powder, Defog, Wingspan (+1 line) | [2] Apply 2 Weak. Gain 12 block. | [2] Apply 2 Weak. Steal 1. Gain 9 block. |
| **Lick Wounds** uncommon | Leaf Guard, Floral Healing, Aqua Ring | [1] Gain 8 block. Heal 3 HP. | [1] Gain 6 block. If you're Disguised: Heal 6 HP. |
| **Darkest Lariat** rare | Power Whip, Solar Blade (+1 line), Frenzy Plant | [2] Deal 16 damage. Strength counts 3 times. | [2] Deal 16 damage. If the enemy has strength or block: Strength counts 3 times. |
| **Kowtow Cleave** evolution 1 | Scorch (+1 line), Lava Plume, Seed Bomb (+1 line), Wood Hammer (+1 line) +8 | [2] Deal 17 damage. Apply 1 Weak. Apply 1 Vulnerable. | [2] Deal 15 damage. If you're Disguised: Apply 2 Vulnerable. |

### Psychic (26)

| Card | Read like | Before | Now |
|---|---|---|---|
| **Focus Blast** common | Psywave | [2] Deal 14 damage. | [2] Deal 13 damage. If the enemy is Vulnerable: +7 damage. |
| **Mind Lance** evolution 1 | Mind Reader (+1 line), Tackle (+1 line) | [1] Deal 8 damage. Apply 2 Vulnerable. Draw 1 card. | [1] Deal 10 damage. +3 for each kind of debuff on the enemy. |
| **Psychic Crush** uncommon | Confusion, Mind Break | [2] Deal 18 damage. Apply 1 Vulnerable. | [2] Deal 16 damage. If the enemy is Weak: Apply 2 Vulnerable. |
| **Mind Break** rare | Confusion, Psychic Crush | [2] Deal 18 damage. Apply 3 Vulnerable. | [2] Deal 18 damage. Apply 1 Weak. Apply 2 Sap. |
| **Psybeam** common | Psystrike | [1] Deal 7 damage. Apply 1 Weak. | [1] Deal 7 damage. If the enemy is Vulnerable: Apply 2 Weak. |
| **Focus Punch** uncommon | Mind Bolt, Future Shock, Psycho Shift, Psycho Break | [1] Deal 9 damage. Your next attack deals +5 damage. | [1] Deal 8 damage. Grows +4 damage each turn it stays. Retain. |
| **Future Shock** uncommon | Mind Bolt, Focus Punch, Psycho Shift, Psycho Break | [1] Deal 9 damage. Your next attack deals +6 damage. | [1] Your next attack deals +7 damage. +1 energy next turn. |
| **Psycho Shift** evolution 1 | Mind Bolt, Focus Punch, Future Shock, Psycho Break | [1] Deal 10 damage. Your next attack deals +8 damage. | [1] Deal 8 damage. Apply 2 Sap. |
| **Psycho Break** evolution 2 | Mind Bolt, Focus Punch, Future Shock, Psycho Shift | [2] Deal 26 damage. Your next attack deals +8 damage. | [2] Deal 20 damage. Your next card this turn is played twice. |
| **Telekinetic Crush** common | Dissonant Pulse, Kinetic Barrage, Psyshock Wave, Double Hit | [1] Deal 3 damage 3 times. | [1] Deal 4 damage for each attack you've played this turn. |
| **Dissonant Pulse** common | Telekinetic Crush, Kinetic Barrage, Psyshock Wave, Double Hit | [1] Deal 4 damage 2 times. | [1] Deal 4 damage 2 times. Apply 1 Weak. |
| **Kinetic Barrage** uncommon | Telekinetic Crush, Dissonant Pulse, Psyshock Wave, Double Hit | [1] Deal 4 damage 3 times. | [1] Deal 3 damage 3 times. Draw 1 card. |
| **Psyshock Wave** rare | Telekinetic Crush, Dissonant Pulse, Kinetic Barrage, Double Hit | [2] Deal 8 damage 3 times. | [2] Deal 6 damage 3 times. Strength counts 2 times. |
| **Power Within** uncommon | Calm Mind (+1 line) | [1] Your hits deal +2 all fight. Your next attack deals +4 damage. Exhaust. | [1] Your hits deal +2 all fight. Draw 2 cards. Exhaust. |
| **Psychic Rampart** uncommon | Barrier | [1] Gain 11 block. Next turn, gain 5 block. | [1] Gain 10 block. If the enemy intends to attack: Gain 6 block. |
| **Telekinetic Wall** uncommon | Reflective Screen, Double Team | [2] Gain 15 block. Your block doesn't wear off at the start of your next turn. | [2] Gain 16 block. Retain. |
| **Disable** common | Disable+, Smokescreen | [1] Apply 2 Weak. Exhaust. | [1] Apply 1 Weak. The enemy's attacks deal 4 less this turn. |
| **Imprison (was Disable+)** uncommon | Disable, Smokescreen | [1] Apply 3 Weak. Exhaust. | [1] Apply 2 Weak. Apply 1 Sap. Exhaust. |
| **Zen Focus** uncommon | Mirror Image | [1] Gain 7 block. Your next attack deals +5 damage. | [1] Gain 7 block. If the enemy is Weak: Your next attack deals +6 damage. |
| **Psychic Mastery** rare | Psychic Surge | [2] At the start of each turn, gain 2 strength. | [2] At the start of each turn, gain 1 strength. At the start of each turn, your next attack deals +3 damage. |
| **Precognition** rare | Kinesis (+1 line) | [1] Your next attack deals +10 damage. Draw 2 cards. Exhaust. | [1] Your next attack deals +5 damage. Draw until you have 6 cards. Exhaust. |
| **Mirror Armor** rare | Reflective Armor | [2] When the enemy attacks you, it takes 8 damage. | [2] When the enemy attacks you, it takes 5 damage. At the start of each turn, apply 1 Weak. |
| **Mind Control** rare | Hypnosis (+1 line) | [2] Apply 3 Weak. Apply 3 Vulnerable. Apply 2 Sap. Exhaust. | [2] Apply 3 Sap. The enemy's attacks deal 6 less this turn. Exhaust. |
| **Psycho Boost** rare | Hyper Beam | [2] Deal 30 damage. 1 less energy next turn. | [2] Deal 32 damage. Exhaust. |
| **Dream World** rare | Psychic Fortress | [2] At the start of each turn, gain 3 block. Draw 1 more card each turn. | [2] At the start of each turn, heal 2 HP. Draw 1 more card each turn. |
| **Mindstorm** evolution 2 | Mind Storm | [X] Deal 8 damage X times. | [X] Deal 6 damage X times. Apply 1 Weak X times. |

## Safari signature cards (2026-10-27)

The user's go (Claude's recommendation after the 197): the same rule for the 514 signature cards. Counted fully (every
run a signature card can be caught in, a Duo Run too, and near twins), **365** read like a card some run meets (676
pairs), not the 170 first counted (that count took only the card's own type's solo run, and only twins); and 491 read
like a run card or another signature card (2,964 pairs: 15 were "Lose N HP. Deal N damage.", 14 "Deal N. Gain N
block."). **424 got new lines**, one card of each signature family kept as it was; after, **0 pairs**.

How: each new card carries at most one plain line (Deal, Gain block, Weak...) beside the lines that make it its own,
mostly an "If ...:" clause with a payoff no other card has (Furret's Body Slam: Deal 8, Punish: Static 3), or its real
type's mechanic (Static for the Power Plant, Frostbite and Hail for the Ice Cave, Counter and Follow-up for Dojo Mountain,
Fault and Sandstorm for the Quarry, Evasion and Tailwind for the Windy Cliffs, Steal and Disguise for Night Alley); a few
take a new name for a move that fits better (Hoppip's Synthesis, Delcatty's Charm, Finneon's Attract, Remoraid's Lock-On,
Klang's Shift Gear, Trubbish's and Munchlax's Recycle, Gulpin's Swallow, Swablu's Sing, Azurill's Splash, Clamperl's
Clamp, Azumarill's Huge Power, Vespiquen's Defend Order). Numbers were then raised where a rough value score (damage,
block and each effect at a weight, an "If" clause at its odds) fell more than 2 under the old card, at most +40%: a
signature card's odd condition (In Sandstorm, If the enemy has Fault) rarely holds in a solo run, so its plain part has
to carry it. Ids stay; no new mechanics, so the sim needed nothing.

Bot check: Human bot, Safari days (`safariCfg({ catch: true, catchAt: 0.3 })`), the same sim both sides, 150 a cell, win %: solo fire / grass / water 78.0 / 69.3 / 65.3 -> 80.7 / 65.3 / 61.3; Duo Runs grass+fire / electric+water / ground+fighting / dark+flying 51.3 / 62.0 / 82.0 / 59.3 -> 48.0 / 66.7 / 81.3 / 52.7 (mean 66.7 -> 65.1); every cell inside a cell's noise (about 8 points), about 8 Pokémon caught a run on both sides.

## Every signature card that changed

### Meadow (45)

| Pokémon | Read like | Before | Now |
|---|---|---|---|
| **Rattata**: Hyper Fang | Scorch (+1 line), Seed Bomb (+1 line), Grav Apple (+1 line) +22 | [2] Deal 18 damage. Apply 1 Vulnerable. | [1] Deal 8 damage. If the enemy has strength or block: Apply 2 Vulnerable. |
| **Zigzagoon**: Headbutt | Bubble (+1 line), Low Sweep (+1 line), Wicked Torque +41 | [1] Deal 7 damage. Apply 2 Weak. | [1] Deal 8 damage. The enemy's attacks deal 3 less this turn. |
| **Hoppip**: Synthesis (was Acrobatics) | Tackle, Pluck (+1 line), Swinub's Ice Shard (+1 line) +6 | [0] Deal 5 damage. Draw 1 card. | [0] Heal 3 HP. Unburden: Draw 2 cards. |
| **Vulpix**: Weather Ball | Fire Spin, Magmar's Smog, Ponyta's Flame Charge (+1 line) +9 | [1] Deal 8 damage. Burn 2. | [1] Burn 4. If the enemy is Burned: Draw 2 cards. |
| **Ponyta**: Flame Charge | Vulpix's Weather Ball (+1 line), Magmar's Smog (+1 line), Fire Spin (+1 line) +8 | [1] Deal 6 damage. Burn 1. Draw 1 card. | [1] Deal 4 damage. Burn 1. +1 energy next turn. Exhaust. |
| **Sunkern**: Sunny Day | Growth (+1 line), Feebas's Beautify (+1 line), Cherrim's Flower Gift (+1 line) +1 | [1] Heal 4 HP. Your hits deal +1 all fight. Exhaust. | [0] Heal 3 HP. Your next attack deals +4 damage. Exhaust. |
| **Cottonee**: Cotton Spore | Chilling Water (+1 line), Tremor (+1 line), Dust Cloud (+1 line) +24 | [1] Apply 2 Weak. Gain 7 block. | [1] Leech Seed 2. Evasion 1. |
| **Lillipup**: Work Up | Bulk Up, Gulpin's Stockpile (+1 line), Larvesta's Quiver Dance (+1 line) +9 | [1] Gain 5 block. Your hits deal +1 all fight. | [0] Your hits deal +2 this turn. Draw 1 card. |
| **Petilil**: Sleep Powder | Poison Powder, Venonat's Signal Beam (+1 line), Trapinch's Sand Tomb (+1 line) +11 | [1] Apply 1 Weak. Apply 2 Sap. | [1] Apply 2 Weak. If the enemy is Weak: Apply 2 Sap. |
| **Nidoran♀**: Poison Point | Thick Fat, Spinarak's Spider Web (+1 line), Wurmple's Shield Dust +9 | [1] Apply 2 Sap. Gain 6 block. | [1] Gain 6 block. If the enemy attacked you last turn: Apply 2 Sap. |
| **Nidoran♂**: Double Kick | Skorupi's Toxic Spikes, Anorith's Rock Blast, Tentacruel's Toxic Tentacles +1 | [1] Deal 5 damage 2 times. Apply 1 Sap. | [1] Deal 5 damage 2 times. If the enemy intends to attack: Apply 1 Sap. |
| **Bidoof**: Super Fang | Zigzagoon's Headbutt, Psyduck's Zen Headbutt, Shellos's Mud-Slap +31 | [2] Deal 12 damage. Apply 2 Weak. | [2] Deal 12 damage. If the enemy is Vulnerable: +4 damage. Apply 1 Weak. |
| **Kricketot**: Struggle Bug | Zigzagoon's Headbutt (+1 line), Sharpedo's Ice Fang (+1 line), Mareep's Thunder Wave (+1 line) +17 | [1] Deal 6 damage. Apply 1 Weak. Draw 1 card. | [0] Apply 1 Weak. The enemy's attacks deal 2 less this turn. |
| **Combee**: Honey Gather | Cherubi's Morning Sun (+1 line), Ducklett's Roost (+1 line), Leaf Guard (+1 line) +9 | [1] Gain 5 block. Heal 5 HP. Exhaust. | [0] Heal 3 HP. Put a card from your discard pile on top of your draw pile. Exhaust. |
| **Ninetales**: Fire Spin | Fire Lash, Magmortar's Heat Wave | [1] Deal 3 damage 2 times. Burn 2. | [2] Burn 6. Double the enemy's Burn. Exhaust. |
| **Rapidash**: Flame Wheel | Vulpix's Weather Ball, Magmar's Smog, Ponyta's Flame Charge (+1 line) +9 | [1] Deal 8 damage. Burn 1. | [1] Deal 7 damage. Follow-up (attack): Burn 3. |
| **Arcanine**: Extreme Speed | Starly's Aerial Ace | [0] Deal 5 damage. Innate. | [0] Deal 5 damage. Burn 1. Innate. |
| **Clefairy**: Moonlight | Cherubi's Morning Sun, Ducklett's Roost, Combee's Honey Gather (+1 line) +12 | [1] Gain 4 block. Heal 5 HP. | [1] Heal 5 HP. If you've lost HP this turn: Gain 6 block. |
| **Meowth**: Pay Day | Pidgey's Wing Attack (+1 line), Mareep's Thunder Wave (+1 line), Pansage's Bullet Seed (+1 line) +10 | [1] Deal 3 damage 2 times. Apply 1 Weak. Draw 1 card. | [1] Deal 4 damage 2 times. If this knocks the enemy out, gain 15 ₽. |
| **Patrat**: Detect | Hippopotas's Sandstorm (+1 line), Masquerain's Scary Face, Sandslash's Crush Claw (+1 line) +5 | [1] Apply 1 Vulnerable. Gain 6 block. | [1] Gain 5 block. If the enemy intends to attack: Apply 1 Vulnerable. Draw 1 card. |
| **Sunflora**: Petal Blizzard | Petal Blizzard (+1 line) | [2] Deal 6 damage 2 times. Heal 3 HP. | [2] Deal 6 damage 2 times. If you've healed this turn: It hits once more. |
| **Skiploom**: Acrobatics | Stantler's Psyshield Bash (+1 line), Krabby's Vice Grip (+1 line), Eevee's Baton Pass (+1 line) +9 | [1] Deal 6 damage. Gain 3 block. Draw 1 card. | [1] Deal 7 damage. Unburden: +4 damage. Draw 1 card. |
| **Bellossom**: Petal Dance | Tauros's Thrash | [2] Deal 6 damage 3 times. Add a Confusion to your discard pile. | [2] Deal 5 damage 3 times. If the enemy has Leech Seed: Heal 4 HP. |
| **Jumpluff**: Cotton Guard | Seedot's Harden, Grimer's Minimize, Roggenrola's Iron Defense +8 | [1] Gain 6 block. Next turn, gain 5 block. | [1] Evasion 2. Next turn, gain 5 block. |
| **Lilligant**: Quiver Dance | Cottonee's Cotton Spore (+1 line), Lillipup's Work Up (+1 line), Numel's Yawn (+1 line) +6 | [1] Apply 1 Weak. Gain 5 block. Your hits deal +1 all fight. | [1] Your hits deal +1 all fight. Follow-up (skill): Draw 2 cards. |
| **Whimsicott**: Tailwind | Sandshrew's Sand Attack (+1 line), Jigglypuff's Sing, Parting Shot (+1 line) +1 | [0] Apply 1 Weak. Draw 2 cards. Exhaust. | [0] Tailwind 2. Draw 1 card. Exhaust. |
| **Ledian**: Comet Punch | Petal Dance, Cloyster's Icicle Spear, Armaldo's X-Scissor +4 | [1] Deal 2 damage 4 times. Gain 2 block. | [1] Deal 2 damage 4 times. Follow-up (skill): It hits 2 more times. |
| **Azumarill**: Huge Power (was Aqua Ring) | Cherubi's Morning Sun (+1 line), Ducklett's Roost (+1 line), Nincada's Molt (+1 line) +14 | [1] Gain 5 block. Heal 3 HP. Gain 1 Tide. | [1] Your hits deal +1 all fight. Gain 2 Tide. |
| **Wigglytuff**: Defense Curl | Eevee's Baton Pass (+1 line), Pelipper's Tailwind (+1 line), Togekiss's Serene Grace (+1 line) +3 | [1] Gain 10 block. Draw 1 card. Exhaust. | [1] Gain 8 block. If you've lost HP this turn: Draw 1 card. |
| **Kricketune**: Bug Buzz | Zigzagoon's Headbutt (+1 line), Oddish's Acid (+1 line), Tangela's Constrict (+1 line) +16 | [1] Deal 7 damage. Apply 1 Weak. Apply 1 Sap. | [1] Deal 8 damage. Follow-up (attack): The enemy's attacks deal 2 less this turn. |
| **Cherrim**: Flower Gift | Sunkern's Sunny Day (+1 line), Deerling's Aromatherapy (+1 line), Feebas's Beautify +3 | [1] Heal 3 HP. Your hits deal +1 all fight. Draw 1 card. Exhaust. | [1] Your hits deal +1 all fight. If you've healed this turn: Draw 2 cards. |
| **Cleffa**: Wish | Illumise's Wish (+1 line), Togetic's Wish | [1] Next turn, gain 5 block. Heal 4 HP. Exhaust. | [1] Heal 4 HP. If the enemy is Weak: Next turn, gain 5 block. |
| **Delcatty**: Charm (was Fake Out) | Ambipom's Fake Out, Nuzleaf's Fake Out (+1 line), Fake Out +1 | [0] Deal 4 damage. Apply 1 Weak. Exhaust. Innate. | [1] Apply 4 Weak. If the enemy is Weak: Gain 6 block. |
| **Herdier**: Retaliate | Spiritomb's Grudge, Vanillite's Avalanche, Purrloin's Assurance +5 | [1] Deal 6 damage. If you've lost HP this turn: +7 damage. | [1] Deal 7 damage. If the enemy attacked you last turn: Draw 1 card. |
| **Igglybuff**: Sweet Kiss | Cottonee's Cotton Spore, Numel's Yawn, Azurill's Charm +4 | [0] Apply 1 Weak. Gain 3 block. | [0] Apply 2 Weak. Retain. |
| **Whismur**: Uproar | Stunfisk's Discharge, Larvitar's Rock Slide, Doduo's Tri Attack +11 | [1] Deal 4 damage 2 times. Apply 2 Weak. | [1] Deal 8 damage. If the enemy is Weak: The enemy's attacks deal 2 less this turn. |
| **Loudred**: Hyper Voice | Psyduck's Zen Headbutt (+1 line), Bidoof's Super Fang (+1 line), Kricketot's Struggle Bug +12 | [2] Deal 14 damage. Apply 1 Weak. Draw 1 card. | [2] Deal 15 damage. Unburden: Apply 2 Weak. |
| **Buneary**: Bounce | Lopunny's Bounce, Diglett's Dig, Scraggy's Brick Break +6 | [1] Deal 5 damage. Next turn, gain 6 block. | [1] Evasion 1. Your next attack deals +6 damage. |
| **Happiny**: Copycat | Delibird's Present (+1 line), Metronome (+1 line) | [1] Heal 3 HP. Add a random card of your type to your hand. It costs 0 this turn. Exhaust. | [0] Heal 2 HP. Choose a card in your hand. Add a copy of it to your hand. Exhaust. |
| **Chansey**: Soft-Boiled | Potion, Slakoth's Slack Off, Blissey's Soft-Boiled | [2] Heal 16 HP. Exhaust. | [1] Heal 8 HP. If you've lost HP this turn: Heal 6 HP. Exhaust. |
| **Furret**: Body Slam | Body Press, Ferrothorn's Iron Barbs, Shieldon's Metal Burst | [1] Gain 5 block, then deal damage equal to your block. | [1] Deal 8 damage. If the enemy intends to attack: Static 3. |
| **Eevee**: Baton Pass | Dive (+1 line), Chilling Water (+1 line), Transistor (+1 line) +16 | [1] Gain 5 block. Draw 2 cards. | [1] Gain 7 block. Choose a card in your draw pile and put it into your hand. |
| **Togepi**: Ancient Power | Stantler's Psyshield Bash (+1 line), Krabby's Vice Grip (+1 line), Lillipup's Work Up (+1 line) +10 | [1] Deal 5 damage. Gain 3 block. Your hits deal +1 all fight. | [1] Deal 8 damage. Follow-up (skill): Your hits deal +1 all fight. |
| **Jolteon**: Pin Missile | Pidgey's Wing Attack, Pansage's Bullet Seed, Gligar's Acrobatics +6 | [1] Deal 3 damage 4 times. Draw 1 card. | [1] Deal 3 damage 4 times. Follow-up (skill): +1 energy next turn. |
| **Blissey**: Soft-Boiled | Chansey's Soft-Boiled, Slakoth's Slack Off, Potion | [1] Heal 8 HP. Exhaust. | [1] Heal 7 HP. +1 energy next turn. Exhaust. |

### Forest (60)

| Pokémon | Read like | Before | Now |
|---|---|---|---|
| **Seedot**: Harden | Shelter, Grimer's Minimize, Roggenrola's Iron Defense +8 | [1] Gain 9 block. Next turn, gain 4 block. | [1] Gain 8 block. If the enemy intends to attack: Next turn, gain 4 block. |
| **Paras**: X-Scissor | Sentret's Fury Swipes, Cinccino's Tail Slap, Double Hit +5 | [1] Deal 6 damage 2 times. | [1] Deal 5 damage 2 times. If the enemy has Leech Seed: Apply 1 Weak. |
| **Bellsprout**: Wrap | Snap Trap, Weedle's Poison Sting, Simisage's Seed Bomb +1 | [1] Deal 3 damage. Leech Seed 3. | [1] Deal 4 damage. If the enemy has Leech Seed: Leech Seed 3. |
| **Cherubi**: Morning Sun | Leaf Guard, Ducklett's Roost, Combee's Honey Gather (+1 line) +12 | [1] Gain 6 block. Heal 5 HP. | [1] Heal 6 HP. If you've lost HP this turn: Draw 2 cards. |
| **Teddiursa**: Slash | Tackle (+1 line), Charge Beam (+1 line), Persian's Nasty Plot (+1 line) +7 | [1] Deal 8 damage. Your next attack deals +3 damage. Draw 1 card. | [1] Deal 8 damage. Follow-up (attack): +5 damage. |
| **Growlithe**: Crunch | Rattata's Hyper Fang, Zangoose's Crush Claw, Apple Acid (+1 line) +25 | [1] Deal 9 damage. Apply 1 Vulnerable. | [1] Deal 8 damage. If the enemy is Vulnerable: Draw 1 card. |
| **Venonat**: Signal Beam | Zigzagoon's Headbutt (+1 line), Oddish's Acid (+1 line), Tangela's Constrict (+1 line) +16 | [1] Deal 6 damage. Apply 1 Weak. Apply 1 Sap. | [1] Apply 3 Sap. If the enemy is Weak: Draw 1 card. |
| **Pineco**: Self-Destruct | Flare Blitz (+1 line), Basculin's Reckless (+1 line), Swanna's Brave Bird (+1 line) +9 | [1] Lose 6 HP. Deal 20 damage. Exhaust. | [1] Deal 14 damage. +8 if your HP is below half. Exhaust. |
| **Shroomish**: Spore | Cotton Spore, Snover's Snow Warning (+1 line), Vileplume's Stun Spore (+1 line) | [1] Apply 2 Weak. Leech Seed 2. | [1] Leech Seed 2. The enemy's attacks deal 4 less this turn. |
| **Pansage**: Bullet Seed | Pidgey's Wing Attack, Gligar's Acrobatics, Drilbur's Drill Run +6 | [1] Deal 3 damage 3 times. Draw 1 card. | [1] Deal 3 damage 3 times. If the enemy has Leech Seed: Draw 1 card. |
| **Karrablast**: Fury Cutter | Marill's Rollout, Aqua Cutter, Geodude's Rollout +1 | [1] Deal 5 damage. Grows +3 damage each turn it stays. Retain. | [1] Deal 3 damage 2 times. Each time you play it, it deals 2 more this fight. |
| **Deerling**: Aromatherapy | Feebas's Beautify (+1 line), Solrock's Morning Sun (+1 line), Cherrim's Flower Gift (+1 line) +3 | [1] Heal 6 HP. Draw 1 card. Exhaust. | [1] Heal 5 HP. If you've healed this turn: Draw 2 cards. |
| **Caterpie**: String Shot | Petilil's Sleep Powder, Poison Powder, Mime Jr.'s Baby-Doll Eyes (+1 line) | [0] Apply 1 Weak. Apply 1 Sap. | [0] The enemy's attacks deal 2 less this turn. Draw 1 card. |
| **Weedle**: Poison Sting | Bellsprout's Wrap, Snap Trap, Simisage's Seed Bomb +1 | [1] Deal 6 damage. Leech Seed 2. | [1] Deal 5 damage. If the enemy intends to attack: Apply 2 Sap. |
| **Ledyba**: Light Screen | Seedot's Harden, Grimer's Minimize, Roggenrola's Iron Defense +8 | [1] Gain 6 block. Next turn, gain 6 block. | [1] The enemy's attacks deal 3 less this turn. Next turn, gain 6 block. |
| **Spinarak**: Spider Web | Cottonee's Cotton Spore (+1 line), Petilil's Sleep Powder (+1 line), Numel's Yawn (+1 line) +11 | [1] Apply 1 Weak. Apply 1 Sap. Gain 6 block. | [1] Gain 6 block. If the enemy is Weak: Apply 2 Sap. |
| **Wurmple**: Shield Dust | Nidoran♀'s Poison Point, Spinarak's Spider Web (+1 line), Thick Fat +9 | [1] Apply 1 Sap. Gain 7 block. | [1] Apply 2 Sap. If the enemy intends to attack: Gain 5 block. |
| **Burmy**: Protect | Iron Defense, Bastiodon's Wide Guard | [1] Gain 12 block. Exhaust. | [1] Gain 7 block. Follow-up (skill): Next turn, gain 4 block. |
| **Venipede**: Venoshock | Oddish's Acid, Tangela's Constrict, Venonat's Signal Beam (+1 line) +15 | [1] Deal 5 damage. Apply 2 Sap. | [1] Deal 6 damage. Follow-up (skill): Apply 2 Sap. |
| **Pachirisu**: Nuzzle | Zigzagoon's Headbutt, Psyduck's Zen Headbutt, Shellos's Mud-Slap +41 | [1] Deal 4 damage. Apply 2 Weak. | [1] Static 2. Heal 4 HP. |
| **Simisear**: Incinerate | Vulpix's Weather Ball, Magmar's Smog, Ponyta's Flame Charge (+1 line) +9 | [1] Deal 5 damage. Burn 3. | [1] Deal 5 damage. If the enemy is Burned: Burn 3. |
| **Simipour**: Soak | Mareep's Thunder Wave (+1 line), Smoochum's Sweet Kiss (+1 line), Bubble Beam | [1] Apply 1 Weak. Draw 1 card. Gain 2 Tide. | [1] Apply 2 Weak. Double your Tide. |
| **Butterfree**: Silver Wind | Zigzagoon's Headbutt (+1 line), Sharpedo's Ice Fang (+1 line), Mareep's Thunder Wave (+1 line) +17 | [1] Deal 5 damage. Apply 1 Weak. Draw 1 card. | [1] Apply 2 Weak. Draw 1 card for each kind of debuff on the enemy. |
| **Beedrill**: Twineedle | Stunfisk's Discharge, Larvitar's Rock Slide, Doduo's Tri Attack +11 | [1] Deal 4 damage 2 times. Apply 1 Weak. | [1] Deal 4 damage 2 times. If the enemy is Weak: Apply 2 Sap. |
| **Gloom**: Sweet Scent | Surskit's Sticky Web (+1 line), Hippopotas's Sandstorm (+1 line), Frillish's Cursed Body (+1 line) +8 | [1] Apply 2 Weak. Apply 1 Vulnerable. | [1] Apply 2 Vulnerable. Leech Seed 1. |
| **Parasect**: Leech Life | Pidove's Pluck, Lickitung's Wring Out, Absorb +5 | [1] Deal 7 damage. Heal 3 HP. | [1] Deal 6 damage. If the enemy has Leech Seed: Heal the damage that gets through. |
| **Nuzleaf**: Fake Out | Ambipom's Fake Out (+1 line), Shellos's Mud-Slap (+1 line), Shinx's Spark (+1 line) +4 | [0] Deal 3 damage. Apply 1 Weak. Exhaust. | [0] Deal 3 damage. The enemy's attacks deal 3 less this turn. Exhaust. Innate. |
| **Ferroseed**: Spikes | Nidoran♀'s Poison Point, Spinarak's Spider Web (+1 line), Wurmple's Shield Dust +9 | [1] Apply 1 Sap. Gain 8 block. | [1] Gain 7 block. If the enemy intends to attack: Apply 1 Vulnerable. Apply 1 Sap. |
| **Slakoth**: Slack Off | Chansey's Soft-Boiled, Potion, Blissey's Soft-Boiled | [1] Heal 7 HP. Exhaust. | [0] Heal 6 HP. 1 less energy next turn. |
| **Venomoth**: Bug Buzz | Zigzagoon's Headbutt (+1 line), Oddish's Acid (+1 line), Tangela's Constrict (+1 line) +16 | [1] Deal 8 damage. Apply 1 Weak. Apply 1 Sap. | [1] Deal 8 damage. Follow-up (attack): Apply 1 Weak. Apply 1 Sap. |
| **Shiftry**: Leaf Tornado | Stunfisk's Discharge, Larvitar's Rock Slide, Doduo's Tri Attack +11 | [1] Deal 3 damage 3 times. Apply 1 Weak. | [1] Deal 3 damage 3 times. If the enemy has strength or block: Steal 1. |
| **Vileplume**: Stun Spore | Shroomish's Spore (+1 line), Cotton Spore (+1 line), Leech Seed (+1 line) | [1] Apply 1 Weak. Leech Seed 2. Heal 4 HP. | [1] Leech Seed 3. If the enemy has Leech Seed: Apply 2 Weak. |
| **Forretress**: Spikes | Stantler's Psyshield Bash, Krabby's Vice Grip, Wooper's Mud Shot +36 | [1] Deal 3 damage. Gain 8 block. | [1] Gain 7 block. If the enemy intends to attack: Counter 5. |
| **Ariados**: Spider Web | Dustox's Toxic (+1 line), Spore (+1 line), Drowzee's Hypnosis (+1 line) | [1] Apply 1 Weak. Apply 1 Vulnerable. Apply 1 Sap. Exhaust. | [1] Apply 1 Weak. If the enemy is Weak: Apply 2 Vulnerable. |
| **Sawsbuck**: Horn Leech | Zubat's Leech Life, Bitter Blade (+1 line), Oblivion Wing (+1 line) +1 | [2] Deal 12 damage. Heal the damage that gets through. | [2] Deal 13 damage. If you've healed this turn: +4 damage. Draw 1 card. |
| **Simisage**: Seed Bomb | Bellsprout's Wrap, Weedle's Poison Sting, Lileep's Giga Drain (+1 line) +4 | [2] Deal 9 damage. Leech Seed 3. | [2] Deal 9 damage. Double the enemy's Leech Seed. |
| **Sudowoodo**: Mimic Tree | Hippopotas's Sandstorm (+1 line), Patrat's Detect, Masquerain's Scary Face +5 | [1] Apply 1 Vulnerable. Gain 7 block. | [1] Gain 6 block. If the enemy attacked you last turn: Apply 2 Vulnerable. |
| **Kakuna**: Harden | Seedot's Harden, Grimer's Minimize, Roggenrola's Iron Defense +8 | [1] Gain 8 block. Next turn, gain 4 block. | [1] Gain 14 block. 1 less energy next turn. |
| **Silcoon**: Silk Cocoon | Cherubi's Morning Sun (+1 line), Eevee's Baton Pass (+1 line), Ducklett's Roost (+1 line) +10 | [1] Gain 6 block. Heal 3 HP. Draw 1 card. | [1] Your block doesn't wear off at the start of your next turn. Heal 5 HP. |
| **Cascoon**: Iron Cocoon | Eevee's Baton Pass (+1 line), Nidoran♀'s Poison Point (+1 line), Wurmple's Shield Dust (+1 line) +5 | [1] Apply 1 Sap. Gain 5 block. Draw 1 card. | [1] Apply 2 Sap. Your block doesn't wear off at the start of your next turn. |
| **Wormadam**: Leaf Cloak | Foongus's Ingrain, Amoonguss's Rage Powder | [2] Leech Seed 2. Gain 11 block. | [2] Gain 11 block. If the enemy has Leech Seed: Next turn, gain 5 block. |
| **Woobat**: Heart Stamp | Growlithe's Crunch (+1 line), Tentacool's Acid Spray (+1 line), Sandile's Thief (+1 line) +9 | [1] Deal 6 damage. Apply 1 Vulnerable. Draw 1 card. | [1] Deal 8 damage. If the enemy is Vulnerable: The enemy's attacks deal 3 less this turn. |
| **Munna**: Dream Eater | Sandile's Thief (+1 line), Blitzle's Volt Switch (+1 line), Zubat's Leech Life (+1 line) +2 | [1] Deal 5 damage. Heal the damage that gets through. Draw 1 card. | [1] Deal 9 damage. If the enemy is Weak: Heal 4 HP. |
| **Nidorina**: Helping Hand | Eevee's Baton Pass (+1 line), Nidoran♀'s Poison Point (+1 line), Wurmple's Shield Dust (+1 line) +5 | [1] Apply 1 Sap. Gain 7 block. Draw 1 card. | [1] Gain 8 block. If the enemy is Vulnerable: Apply 2 Sap. |
| **Nidorino**: Horn Attack | Oddish's Acid (+1 line), Tangela's Constrict (+1 line), Croagunk's Poison Jab (+1 line) +6 | [1] Deal 7 damage. Apply 1 Sap. Your next attack deals +2 damage. | [1] Deal 7 damage. If the enemy has strength or block: Apply 2 Sap. |
| **Snubbull**: Scary Face | Watchog's Confuse Ray, Misdreavus's Perish Song, Spore | [0] Apply 1 Weak. Apply 1 Vulnerable. Exhaust. | [0] Apply 2 Vulnerable. The enemy's attacks deal 2 less this turn. Exhaust. |
| **Granbull**: Play Rough | Carnivine's Power Whip (+1 line), Aron's Iron Head (+1 line), Timburr's Hammer Arm (+1 line) +11 | [2] Deal 13 damage. Apply 1 Sap. Gain 4 block. | [2] Deal 14 damage. If the enemy attacked you last turn: Apply 2 Vulnerable. |
| **Munchlax**: Recycle | Deerling's Aromatherapy, Feebas's Beautify (+1 line), Solrock's Morning Sun (+1 line) +3 | [1] Heal 4 HP. Draw 2 cards. Exhaust. | [1] Heal 4 HP. Put a card from your exhaust pile into your hand. Exhaust. |
| **Girafarig**: Twin Beam | Pidgey's Wing Attack (+1 line), Mareep's Thunder Wave (+1 line), Pansage's Bullet Seed (+1 line) +10 | [1] Deal 4 damage 2 times. Apply 1 Weak. Draw 1 card. | [2] Deal 7 damage. Your next card this turn is played twice. |
| **Spinda**: Teeter Dance | Cottonee's Cotton Spore (+1 line), Numel's Yawn (+1 line), Hippopotas's Sandstorm +7 | [1] Apply 2 Weak. Apply 1 Vulnerable. Gain 3 block. | [1] Apply 1 Vulnerable. Evasion 1. The enemy's attacks deal 3 less this turn. |
| **Glameow**: Fury Swipes | Pidgey's Wing Attack, Pansage's Bullet Seed, Gligar's Acrobatics +6 | [1] Deal 2 damage 5 times. Draw 1 card. | [1] Deal 2 damage 5 times. If the enemy is Weak: Draw 1 card. |
| **Axew**: Dragon Claw | Spiritomb's Grudge, Vanillite's Avalanche, Purrloin's Assurance +5 | [1] Deal 8 damage. If you've lost HP this turn: +4 damage. | [1] Deal 8 damage. If you've lost HP this turn: Apply 1 Vulnerable. |
| **Fraxure**: Dragon Rush | Zigzagoon's Headbutt, Psyduck's Zen Headbutt, Shellos's Mud-Slap +31 | [2] Deal 16 damage. Apply 1 Weak. | [2] Deal 14 damage. If the enemy has strength or block: +4 damage. Apply 1 Weak. |
| **Ambipom**: Fake Out | Fake Out, Nuzleaf's Fake Out (+1 line), Delcatty's Fake Out +1 | [0] Deal 5 damage. Apply 1 Weak. Exhaust. Innate. | [0] Deal 4 damage. +1 energy next turn. Exhaust. Innate. |
| **Scyther**: Swords Dance | Swords Dance | [1] Your hits deal +3 all fight. Exhaust. | [1] Your hits deal +2 all fight. Your hits deal +3 this turn. Exhaust. |
| **Pinsir**: Submission | Bouffalant's Head Charge, Flare Blitz, Inferno Charge (+1 line) +19 | [2] Lose 3 HP. Deal 20 damage. | [2] Deal 16 damage. If the enemy has strength or block: Your hits deal +1 all fight. |
| **Leafeon**: Leaf Blade | Hoppip's Acrobatics, Sandile's Thief, Blitzle's Volt Switch +16 | [2] Deal 15 damage. Draw 1 card. | [2] Deal 14 damage. If you've healed this turn: Draw 2 cards. |
| **Scizor**: Bullet Punch | Beautifly's Silver Wind | [0] Deal 4 damage. Your hits deal +1 all fight. Exhaust. | [0] Deal 4 damage. If the enemy is Weak: Your hits deal +1 all fight. |
| **Vespiquen**: Defend Order (was Attack Order) | Bagon's Outrage, Vigoroth's Uproar (+1 line), Nidoking's Thrash | [1] Deal 2 damage 3 times. Your hits deal +1 all fight. | [1] Gain 7 block. Follow-up (attack): Heal 3 HP. |
| **Druddigon**: Dragon Tail | Stantler's Psyshield Bash, Krabby's Vice Grip, Wooper's Mud Shot +16 | [2] Deal 12 damage. Gain 6 block. | [2] Deal 12 damage. If the enemy attacked you last turn: Gain 8 block. |

### Wetland (59)

| Pokémon | Read like | Before | Now |
|---|---|---|---|
| **Poliwag**: Wake-Up Slap | Magical Leaf, Murkrow's Pursuit | [1] Deal 6 damage. If the enemy is Weak: +6 damage. | [1] Deal 6 damage. If the enemy is Weak: Gain 2 Tide. |
| **Psyduck**: Zen Headbutt | Zigzagoon's Headbutt, Lava Plume (+1 line), Muddy Water (+1 line) +31 | [2] Deal 13 damage. Apply 1 Weak. | [2] Deal 13 damage. If the enemy has strength or block: Gain 3 Tide. |
| **Marill**: Rollout | Aqua Cutter, Karrablast's Fury Cutter, Geodude's Rollout +1 | [1] Deal 6 damage. Grows +4 damage each turn it stays. Retain. | [1] Deal 4 damage. Gain 1 Tide. Grows +3 damage each turn it stays. Retain. |
| **Krabby**: Vice Grip | Stantler's Psyshield Bash, Clamp, Frost Nip (+1 line) +36 | [1] Deal 7 damage. Gain 4 block. | [1] Deal 6 damage. If the enemy intends to attack: Gain 6 block. |
| **Staryu**: Power Gem | Bubble (+1 line), Surf, Octazooka (+1 line) +15 | [1] Deal 8 damage. Gain 1 Tide. | [1] Deal 7 damage. Follow-up (skill): Gain 2 Tide. |
| **Goldeen**: Waterfall | Staryu's Power Gem (+1 line), Tackle (+1 line), Origin Pulse +6 | [1] Deal 7 damage. Draw 1 card. Gain 1 Tide. | [1] Deal 8 damage. If the enemy attacked you last turn: Gain 2 Tide. |
| **Tentacool**: Acid Spray | Rattata's Hyper Fang, Zangoose's Crush Claw, Growlithe's Crunch +25 | [1] Deal 5 damage. Apply 2 Vulnerable. | [1] Deal 6 damage. If the enemy is Vulnerable: Apply 2 Sap. |
| **Surskit**: Sticky Web | Soak (+1 line), Smoochum's Sweet Kiss (+1 line), Gloom's Sweet Scent (+1 line) | [1] Apply 1 Weak. Apply 1 Vulnerable. Gain 1 Tide. | [1] Evasion 1. Gain 1 Tide. |
| **Buizel**: Aqua Jet | Staryu's Power Gem, Surf, Swinub's Ice Shard (+1 line) +4 | [0] Deal 4 damage. Gain 1 Tide. | [0] Deal 4 damage. Unburden: Gain 2 Tide. |
| **Panpour**: Scald | Vulpix's Weather Ball, Magmar's Smog, Ponyta's Flame Charge (+1 line) +9 | [1] Deal 7 damage. Burn 2. | [1] Burn 3. Gain 2 Tide. |
| **Yanma**: U-turn | Pansear's Fling (+1 line), Tackle (+1 line), Waterfall (+1 line) +5 | [1] Deal 6 damage. Draw 2 cards. Discard 1 card. | [0] Deal 3 damage. Unburden: Evasion 1. |
| **Chinchou**: Charge Beam | Inferno Charge (+1 line), Live Wire | [2] Deal 9 damage. +1 energy next turn. | [1] Deal 5 damage. Static 2. Gain 1 Tide. |
| **Corphish**: Crabhammer | Staryu's Power Gem, Buizel's Aqua Jet, Surf +8 | [2] Deal 13 damage. Gain 2 Tide. | [2] Deal 13 damage. Follow-up (attack): Gain 2 Tide. |
| **Finneon**: Attract (was Aqua Ring) | Aqua Ring (+1 line), Vaporeon's Aqua Ring (+1 line), Milotic's Recover | [1] Heal 4 HP. Gain 2 Tide. Exhaust. | [1] Apply 2 Weak. If the enemy is Weak: Heal 3 HP. |
| **Remoraid**: Lock-On (was Octazooka) | Bouncy Bubble, Gorebyss's Whirlpool (+1 line) | [1] Deal 3 damage 3 times. Gain 1 Tide. | [1] Apply 2 Vulnerable. Your next attack deals +6 damage. |
| **Basculin**: Reckless | Bouffalant's Head Charge, Pineco's Self-Destruct (+1 line), Pinsir's Submission +17 | [1] Lose 3 HP. Deal 11 damage. | [1] Deal 8 damage. If you've lost HP this turn: Gain 2 Tide. |
| **Carvanha**: Crunch | Growlithe's Crunch (+1 line), Staryu's Power Gem (+1 line), Tentacool's Acid Spray (+1 line) +6 | [1] Deal 6 damage. Apply 2 Vulnerable. Gain 1 Tide. | [1] Deal 7 damage. If the enemy intends to attack: Gain 2 Tide. |
| **Wailmer**: Water Spout | Snipe Shot, Brine (+1 line), Scald (+1 line) +2 | [2] Deal 8 damage. +2 per Tide (it isn't spent). | [2] Deal 6 damage. +2 per Tide (it isn't spent). Next turn, gain 5 block. |
| **Mantyke**: Wide Guard | Shellder's Clamp (+1 line), Dive (+1 line), Bubble Shield (+1 line) +11 | [1] Gain 8 block. Gain 1 Tide. | [1] Gain 6 block. Follow-up (attack): Gain 2 Tide. |
| **Azurill**: Splash (was Charm) | Cottonee's Cotton Spore, Koffing's Haze (+1 line), Numel's Yawn +24 | [1] Apply 3 Weak. Gain 3 block. | [0] Evasion 1. Heal 2 HP. |
| **Magby**: Fire Punch | Vulpix's Weather Ball, Magmar's Smog, Ponyta's Flame Charge (+1 line) +9 | [1] Deal 6 damage. Burn 2. | [1] Deal 6 damage. Follow-up (skill): Burn 3. |
| **Golduck**: Amnesia | Shellder's Clamp (+1 line), Mantyke's Wide Guard, Qwilfish's Spikes (+1 line) +11 | [1] Gain 7 block. Gain 2 Tide. | [1] Draw 2 cards. Gain 3 Tide. 1 less energy next turn. |
| **Kingler**: Crabhammer | Rattata's Hyper Fang, Zangoose's Crush Claw, Growlithe's Crunch +22 | [2] Deal 13 damage. Apply 2 Vulnerable. | [2] Deal 14 damage. If the enemy is Vulnerable: Gain 2 Tide. |
| **Corsola**: Recover | Cherubi's Morning Sun, Ducklett's Roost, Combee's Honey Gather (+1 line) +12 | [1] Gain 7 block. Heal 3 HP. | [1] Heal 5 HP. If the enemy attacked you last turn: Gain 2 Tide. |
| **Octillery**: Octazooka | Zigzagoon's Headbutt, Psyduck's Zen Headbutt, Shellos's Mud-Slap +41 | [1] Deal 6 damage. Apply 2 Weak. | [1] Deal 8 damage. If the enemy is Weak: Draw 1 card. |
| **Clamperl**: Clamp (was Whirlpool) | Staryu's Power Gem, Goldeen's Waterfall (+1 line), Buizel's Aqua Jet +15 | [1] Deal 4 damage. Gain 2 Tide. | [1] Gain 6 block. Follow-up (skill): Gain 2 Tide. |
| **Seaking**: Horn Attack | Stantler's Psyshield Bash, Krabby's Vice Grip, Wooper's Mud Shot +36 | [1] Deal 6 damage. Gain 4 block. | [1] Deal 7 damage. Follow-up (attack): Gain 4 block. |
| **Bibarel**: Hyper Fang | Heracross's Megahorn, Taillow's Aerial Ace, Ember +8 | [1] Deal 10 damage. | [1] Deal 9 damage. If the enemy has strength or block: Draw 1 card. |
| **Tentacruel**: Toxic Tentacles | Skorupi's Toxic Spikes, Nidoran♂'s Double Kick, Anorith's Rock Blast +1 | [1] Deal 2 damage 3 times. Apply 1 Sap. | [1] Deal 2 damage 3 times. Follow-up (skill): Apply 2 Sap. |
| **Slowbro**: Slack Off | Cherubi's Morning Sun (+1 line), Ducklett's Roost (+1 line), Combee's Honey Gather +9 | [1] Gain 6 block. Heal 6 HP. Exhaust. | [1] Heal 11 HP. 1 less energy next turn. Exhaust. |
| **Mantine**: Air Glide | Shellder's Clamp (+1 line), Mantyke's Wide Guard, Qwilfish's Spikes (+1 line) +11 | [1] Gain 6 block. Gain 2 Tide. | [1] Tailwind 2. Gain 1 Tide. |
| **Floatzel**: Aqua Tail | Staryu's Power Gem, Buizel's Aqua Jet, Corphish's Crabhammer +8 | [2] Deal 10 damage. Gain 2 Tide. | [2] Deal 6 damage 2 times. Unburden: Gain 2 Tide. |
| **Lumineon**: Water Pulse | Wailmer's Water Spout, Snipe Shot | [1] Deal 5 damage. +1 per Tide (it isn't spent). | [1] Apply 2 Weak. Follow-up (attack): Gain 2 Tide. |
| **Huntail**: Sucker Punch | Cacturne's Sucker Punch, Throat Chop | [1] Deal 6 damage. If the enemy intends to attack: +5 damage. | [1] Deal 5 damage. If the enemy intends to attack: +4 damage. Gain 1 Tide. |
| **Gorebyss**: Whirlpool | Stunfisk's Discharge (+1 line), Remoraid's Octazooka (+1 line), Smoochum's Sweet Kiss (+1 line) +8 | [1] Deal 3 damage 2 times. Apply 1 Weak. Gain 1 Tide. | [1] Deal 4 damage 2 times. If the enemy is Weak: Gain 2 Tide. |
| **Starmie**: Power Gem | Staryu's Power Gem, Goldeen's Waterfall (+1 line), Buizel's Aqua Jet +15 | [1] Deal 6 damage. Gain 2 Tide. | [1] Deal 6 damage. If you've healed this turn: Gain 3 Tide. |
| **Wailord**: Bounce | Shellder's Clamp, Corphish's Crabhammer (+1 line), Aron's Iron Head (+1 line) +13 | [2] Deal 9 damage. Gain 5 block. Gain 3 Tide. | [2] Deal 11 damage. Evasion 1. Next turn, gain 5 block. |
| **Tropius**: Natural Gift | Sunkern's Sunny Day, Feebas's Beautify (+1 line), Cherrim's Flower Gift (+1 line) +1 | [1] Heal 5 HP. Your hits deal +1 all fight. Exhaust. | [1] Heal 5 HP. If you've healed this turn: Your hits deal +1 all fight. |
| **Castform**: Weather Ball | Vulpix's Weather Ball (+1 line), Magmar's Smog (+1 line), Staryu's Power Gem (+1 line) +7 | [1] Deal 5 damage. Burn 1. Gain 1 Tide. | [1] Deal 5 damage. If the enemy is Burned: Gain 2 Tide. |
| **Ralts**: Teleport | Natu's Teleport (+1 line), Waterfall, Ebb Tide (+1 line) | [0] Draw 2 cards. Discard 1 card. | [0] Evasion 1. Draw 1 card. |
| **Kirlia**: Draining Kiss | Stantler's Psyshield Bash (+1 line), Cherubi's Morning Sun (+1 line), Krabby's Vice Grip (+1 line) +14 | [1] Deal 5 damage. Gain 2 block. Heal 3 HP. | [1] Deal 7 damage. If you've healed this turn: Gain 5 block. |
| **Mr. Mime**: Reflect | Seedot's Harden, Grimer's Minimize, Roggenrola's Iron Defense +7 | [2] Gain 12 block. Next turn, gain 6 block. | [2] Gain 13 block. If the enemy intends to attack: The enemy's attacks deal 4 less this turn. |
| **Magnemite**: Magnet Pull | Cottonee's Cotton Spore (+1 line), Mareep's Thunder Wave (+1 line), Eevee's Baton Pass (+1 line) +7 | [1] Apply 1 Weak. Gain 5 block. Draw 1 card. | [1] Static 3. Choose a card in your draw pile and put it into your hand. |
| **Magneton**: Zap Cannon | Zigzagoon's Headbutt, Psyduck's Zen Headbutt, Shellos's Mud-Slap +31 | [2] Deal 11 damage. Apply 2 Weak. | [2] Deal 13 damage. If the enemy is Weak: Static 3. |
| **Electrode**: Swift | Archeops's Acrobatics, Quick Attack | [1] Deal 4 damage 2 times. Innate. | [1] Deal 4 damage 2 times. Follow-up (skill): Static 2. |
| **Manectric**: Thunder | Psyduck's Zen Headbutt (+1 line), Bidoof's Super Fang (+1 line), Kricketot's Struggle Bug +12 | [2] Deal 15 damage. Apply 1 Weak. Draw 1 card. | [2] Deal 12 damage. Static 2. +1 energy next turn. |
| **Wobbuffet**: Counter | Stantler's Psyshield Bash (+1 line), Krabby's Vice Grip (+1 line), Wooper's Mud Shot (+1 line) +9 | [1] Deal 4 damage. Gain 6 block. If you've lost HP this turn: +8 damage. | [1] Counter 11. Retain. |
| **Chingling**: Uproar Chime | Hoothoot's Foresight, Bonsly's Fake Tears (+1 line) | [0] Apply 1 Vulnerable. Draw 1 card. Exhaust. | [0] Draw 1 card. Follow-up (skill): Apply 1 Vulnerable. |
| **Spoink**: Pearl Bounce | Stantler's Psyshield Bash (+1 line), Krabby's Vice Grip (+1 line), Wooper's Mud Shot (+1 line) +6 | [1] Deal 4 damage. Gain 5 block. Your next attack deals +2 damage. | [1] Deal 6 damage. Follow-up (skill): Your next attack deals +4 damage. |
| **Grumpig**: Calm Mind | Lillipup's Work Up (+1 line), Gulpin's Stockpile, Shuckle's Power Trick +9 | [1] Gain 6 block. Your hits deal +1 all fight. Exhaust. | [1] Next turn, gain 5 block. Your next attack deals +4 damage. |
| **Dunsparce**: Coil | Lillipup's Work Up (+1 line), Nidoran♀'s Poison Point (+1 line), Wurmple's Shield Dust (+1 line) +6 | [1] Apply 1 Sap. Gain 6 block. Your hits deal +1 all fight. | [1] Your hits deal +1 all fight. If the enemy is Weak: Gain 5 block. |
| **Musharna**: Dream Eater | Pidove's Pluck, Lickitung's Wring Out, Lileep's Giga Drain (+1 line) +4 | [2] Deal 10 damage. Heal 6 HP. | [2] Deal 12 damage. If the enemy is Weak: Heal the damage that gets through. |
| **Swoobat**: Heart Stamp | Growlithe's Crunch (+1 line), Pidove's Pluck (+1 line), Tentacool's Acid Spray (+1 line) +4 | [1] Deal 6 damage. Apply 1 Vulnerable. Heal 2 HP. | [1] Deal 7 damage. If the enemy is Vulnerable: Heal 3 HP. |
| **Vaporeon**: Aqua Ring | Finneon's Aqua Ring (+1 line), Aqua Ring, Azumarill's Aqua Ring (+1 line) +1 | [1] Heal 3 HP. Gain 3 Tide. | [1] Gain 3 Tide. If you've healed this turn: Gain 2 Tide. |
| **Dragonair**: Dragon Tail | Psyduck's Zen Headbutt (+1 line), Bidoof's Super Fang (+1 line), Kricketot's Struggle Bug +12 | [2] Deal 11 damage. Apply 2 Weak. Draw 1 card. | [2] Deal 15 damage. The enemy's intent becomes its next attack. |
| **Gyarados**: Thrash | Bagon's Outrage (+1 line), Flame Wheel (+1 line), Dragonite's Outrage (+1 line) +2 | [2] Lose 3 HP. Deal 8 damage 2 times. Your hits deal +1 all fight. | [2] Deal 8 damage 2 times. If you've lost HP this turn: Your hits deal +1 all fight. |
| **Milotic**: Recover | Finneon's Aqua Ring, Vaporeon's Aqua Ring (+1 line), Aqua Ring (+1 line) | [1] Heal 7 HP. Gain 2 Tide. Exhaust. | [1] Heal 5 HP. Double your Tide. Exhaust. |
| **Dragonite**: Outrage | Gyarados's Thrash (+1 line), Flame Wheel, Salamence's Dragon Rush | [2] Lose 3 HP. Deal 8 damage 3 times. | [2] Deal 6 damage 3 times. If you've lost HP this turn: It hits once more. |
| **Gardevoir**: Moonblast | Psyduck's Zen Headbutt (+1 line), Bidoof's Super Fang (+1 line), Kricketot's Struggle Bug +12 | [2] Deal 12 damage. Apply 2 Weak. Draw 1 card. | [2] Deal 17 damage. If you've healed this turn: Apply 2 Weak. |

### Marsh (53)

| Pokémon | Read like | Before | Now |
|---|---|---|---|
| **Shellos**: Mud-Slap | Zigzagoon's Headbutt, Psyduck's Zen Headbutt, Ice Pellet (+1 line) +12 | [0] Deal 3 damage. Apply 1 Weak. | [0] Apply 1 Weak. If the enemy attacked you last turn: Gain 2 Tide. |
| **Oddish**: Acid | Trop Kick, Tangela's Constrict, Venonat's Signal Beam (+1 line) +15 | [1] Deal 7 damage. Apply 1 Sap. | [1] Deal 6 damage. If the enemy has Leech Seed: Apply 2 Sap. |
| **Tangela**: Constrict | Oddish's Acid, Trop Kick, Venonat's Signal Beam (+1 line) +15 | [1] Deal 6 damage. Apply 2 Sap. | [1] Apply 3 Sap. If the enemy has Leech Seed: Apply 2 Sap. |
| **Litwick**: Hex | Infernal Parade | [1] Deal 6 damage. If the enemy is Burned: +7 damage. | [1] Deal 5 damage. If the enemy is Burned: +3 damage. Apply 1 Weak. |
| **Grimer**: Minimize | Seedot's Harden, Shelter, Roggenrola's Iron Defense +8 | [1] Gain 4 block. Next turn, gain 8 block. | [1] Apply 2 Sap. Next turn, gain 6 block. |
| **Ekans**: Glare | Spore (+1 line), Jigglypuff's Sing (+1 line), Golbat's Confuse Ray (+1 line) +2 | [1] Apply 2 Weak. Apply 2 Vulnerable. Draw 1 card. Exhaust. | [1] Static 6. Exhaust. |
| **Gulpin**: Swallow (was Stockpile) | Lillipup's Work Up (+1 line), Bulk Up (+1 line), Shuckle's Power Trick +9 | [1] Gain 8 block. Your hits deal +1 all fight. Exhaust. | [1] Heal 3 HP. Grows +2 heal each turn it stays. Retain. |
| **Koffing**: Haze | Cottonee's Cotton Spore (+1 line), Mareep's Thunder Wave (+1 line), Eevee's Baton Pass (+1 line) +7 | [1] Apply 1 Weak. Gain 7 block. Draw 1 card. | [1] Steal 2. The enemy's attacks deal 3 less this turn. |
| **Misdreavus**: Perish Song | Watchog's Confuse Ray, Spore, Snubbull's Scary Face | [2] Apply 3 Weak. Apply 3 Vulnerable. Exhaust. | [1] Apply 2 Vulnerable. If the enemy is Vulnerable: Apply 2 Weak. Exhaust. |
| **Carnivine**: Power Whip | Oddish's Acid, Tangela's Constrict, Croagunk's Poison Jab +8 | [2] Deal 14 damage. Apply 1 Sap. | [2] Deal 12 damage. If the enemy intends to attack: Leech Seed 3. |
| **Duskull**: Will-O-Wisp | Will-O-Wisp, Lampent's Hex (+1 line), Chandelure's Inferno | [1] Burn 3. Apply 1 Weak. | [1] Burn 3. If the enemy is Burned: Apply 2 Weak. |
| **Shuppet**: Knock Off | Oddish's Acid (+1 line), Tangela's Constrict (+1 line), Croagunk's Poison Jab (+1 line) +6 | [1] Deal 7 damage. Apply 1 Sap. Draw 1 card. | [1] Deal 8 damage. If the enemy has strength or block: Steal 2. |
| **Drifloon**: Ominous Wind | Zigzagoon's Headbutt (+1 line), Growlithe's Crunch (+1 line), Sharpedo's Ice Fang (+1 line) +14 | [1] Deal 5 damage. Apply 1 Weak. Apply 1 Vulnerable. | [1] Deal 6 damage. If you've lost HP this turn: Your hits deal +1 all fight. |
| **Trubbish**: Recycle (was Clear Smog) | Sandile's Thief (+1 line), Blitzle's Volt Switch (+1 line), Stoke (+1 line) +3 | [1] Deal 5 damage. Draw 1 card. Exhaust 1 card from your hand. | [1] Heal 4 HP. Put a card from your discard pile on top of your draw pile. |
| **Seviper**: Poison Fang | Oddish's Acid (+1 line), Tangela's Constrict (+1 line), Growlithe's Crunch (+1 line) +9 | [1] Deal 4 damage. Apply 1 Vulnerable. Apply 1 Sap. | [1] Deal 6 damage. If the enemy is Vulnerable: Apply 1 Weak. Apply 1 Sap. |
| **Roselia**: Petal Dance | Exeggcute's Egg Barrage, Cacnea's Needle Arm | [2] Deal 4 damage 4 times. Leech Seed 1. | [2] Deal 4 damage 4 times. If you've healed this turn: Leech Seed 2. |
| **Qwilfish**: Spikes | Nidoran♀'s Poison Point (+1 line), Wurmple's Shield Dust (+1 line), Mantyke's Wide Guard (+1 line) +8 | [1] Apply 1 Sap. Gain 5 block. Gain 1 Tide. | [1] Gain 2 Tide. If the enemy intends to attack: Apply 2 Sap. |
| **Shelmet**: Acid Armor | Aqua Veil, Iron Shell (+1 line), Desert Fortress (+1 line) +2 | [2] Gain 12 block. Your block doesn't wear off at the start of your next turn. | [2] Gain 8 block. Your block doesn't wear off at the start of your next turn. If the enemy attacked you last turn: Apply 2 Sap. |
| **Lickitung**: Wring Out | Pidove's Pluck, Absorb, Mega Drain (+1 line) +4 | [2] Deal 10 damage. Heal 4 HP. | [1] Deal 4 damage. Static 3. Retain. |
| **Lampent**: Hex | Zigzagoon's Headbutt (+1 line), Vulpix's Weather Ball (+1 line), Magmar's Smog (+1 line) +13 | [1] Deal 4 damage. Burn 2. Apply 1 Weak. | [1] Deal 4 damage. If the enemy is Burned: Apply 2 Weak. Draw 1 card. |
| **Haunter**: Curse | Spore (+1 line) | [1] Lose 3 HP. Apply 2 Weak. Apply 2 Vulnerable. Exhaust. | [0] Lose 3 HP. Apply 3 Vulnerable. Exhaust. |
| **Muk**: Acid Armor | Cottonee's Cotton Spore, Numel's Yawn, Azurill's Charm +12 | [2] Apply 1 Weak. Gain 15 block. | [2] Gain 13 block. If the enemy is Weak: Next turn, gain 6 block. |
| **Arbok**: Coil | Lillipup's Work Up, Gulpin's Stockpile (+1 line), Larvesta's Quiver Dance (+1 line) +9 | [1] Gain 6 block. Your hits deal +1 all fight. | [1] Your hits deal +1 all fight. Follow-up (skill): Your next attack deals +4 damage. |
| **Swalot**: Spit Up | Pidove's Pluck (+1 line), Parasect's Leech Life (+1 line), Absorb (+1 line) | [1] Deal 8 damage. Heal 4 HP. Exhaust. | [1] Deal 7 damage. If you've healed this turn: +5 damage. |
| **Amoonguss**: Rage Powder | Foongus's Ingrain, Snover's Snow Warning (+1 line), Cradily's Root Hold (+1 line) +1 | [1] Leech Seed 2. Gain 7 block. | [1] Leech Seed 3. If the enemy intends to attack: Leech Seed 2. |
| **Dustox**: Toxic | Petilil's Sleep Powder (+1 line), Poison Powder (+1 line), Ariados's Spider Web (+1 line) +2 | [1] Apply 2 Weak. Apply 2 Sap. Exhaust. | [1] Apply 2 Sap. Retain. |
| **Banette**: Knock Off | Zigzagoon's Headbutt, Psyduck's Zen Headbutt, Shellos's Mud-Slap +41 | [1] Deal 8 damage. Apply 1 Weak. | [1] Deal 7 damage. If you've lost HP this turn: Apply 2 Weak. |
| **Tangrowth**: Power Whip | Bellsprout's Wrap, Weedle's Poison Sting, Lileep's Giga Drain (+1 line) +4 | [2] Deal 16 damage. Leech Seed 1. | [2] Deal 14 damage. If the enemy has Leech Seed: Draw 2 cards. |
| **Accelgor**: Final Gambit | Pineco's Self-Destruct, Weezing's Explosion, Golem's Explosion +1 | [0] Lose 5 HP. Deal 9 damage. Exhaust. | [0] Lose 5 HP. Deal 8 damage. Evasion 1. Exhaust. |
| **Escavalier**: Iron Head | Psyduck's Zen Headbutt (+1 line), Bidoof's Super Fang (+1 line), Onix's Bind +18 | [2] Deal 10 damage. Apply 1 Weak. Gain 9 block. | [2] Deal 14 damage. Follow-up (skill): Next turn, gain 6 block. |
| **Galvantula**: Electroweb | Stunfisk's Discharge (+1 line), Beedrill's Twineedle (+1 line), Pidgeotto's Twister (+1 line) +3 | [1] Deal 3 damage 2 times. Apply 1 Weak. +1 energy next turn. | [1] Deal 4 damage 2 times. If the enemy is Weak: Static 2. |
| **Jellicent**: Water Spout | Corphish's Crabhammer (+1 line), Wailmer's Water Spout (+1 line), Floatzel's Aqua Tail (+1 line) +1 | [2] Deal 6 damage. +2 per Tide (it isn't spent). Gain 1 Tide. | [2] Gain 4 Tide. If the enemy attacked you last turn: Apply 2 Sap. |
| **Slowking**: Calm Mind | Persian's Nasty Plot (+1 line), Eevee's Baton Pass (+1 line), Pelipper's Tailwind (+1 line) +2 | [1] Gain 5 block. Your next attack deals +6 damage. Draw 1 card. | [1] Your next attack deals +8 damage. Follow-up (skill): Draw 1 card. |
| **Drapion**: Cross Poison | Oddish's Acid (+1 line), Tangela's Constrict (+1 line), Growlithe's Crunch (+1 line) +9 | [1] Deal 7 damage. Apply 1 Vulnerable. Apply 1 Sap. | [1] Deal 7 damage. If the enemy is Weak: Apply 2 Vulnerable. |
| **Dusclops**: Shadow Punch | Lopunny's Bounce, Diglett's Dig, Scraggy's Brick Break +6 | [1] Deal 6 damage. Next turn, gain 6 block. | [1] Deal 7 damage. If the enemy attacked you last turn: Next turn, gain 5 block. |
| **Whirlipede**: Poison Tail | Stantler's Psyshield Bash (+1 line), Oddish's Acid (+1 line), Tangela's Constrict (+1 line) +13 | [1] Deal 5 damage. Apply 1 Sap. Gain 5 block. | [1] Gain 8 block. Follow-up (attack): Apply 2 Sap. |
| **Garbodor**: Gunk Shot | Oddish's Acid, Tangela's Constrict, Croagunk's Poison Jab +8 | [2] Deal 13 damage. Apply 2 Sap. | [2] Deal 13 damage. If you've lost HP this turn: Apply 3 Sap. |
| **Drowzee**: Hypnosis | Petilil's Sleep Powder (+1 line), Dustox's Toxic, Ariados's Spider Web (+1 line) +2 | [1] Apply 2 Weak. Apply 1 Sap. Exhaust. | [1] The enemy's attacks deal 3 less this turn. If the enemy is Weak: The enemy's attacks deal 3 less this turn. |
| **Hypno**: Pendulum | Ekans's Glare, Jigglypuff's Sing (+1 line), Golbat's Confuse Ray (+1 line) +2 | [1] Apply 1 Weak. Apply 1 Vulnerable. Draw 2 cards. Exhaust. | [1] Draw 2 cards. If the enemy is Weak: Gain 1 energy. |
| **Gothorita**: Psyshock | Teddiursa's Slash (+1 line), Machop's Karate Chop (+1 line), Riolu's Aura Sphere +8 | [1] Deal 7 damage. Your next attack deals +3 damage. | [1] Deal 6 damage. If the enemy is Weak: Your next attack deals +5 damage. |
| **Solosis**: Acid Armor | Nidoran♀'s Poison Point, Spinarak's Spider Web (+1 line), Wurmple's Shield Dust +9 | [1] Apply 1 Sap. Gain 9 block. | [1] Gain 7 block. If the enemy is Vulnerable: Gain 4 block. |
| **Duosion**: Ally Switch | Eevee's Baton Pass (+1 line), Natu's Teleport, Pelipper's Tailwind (+1 line) +2 | [1] Gain 5 block. Draw 2 cards. Discard 1 card. | [1] Gain 7 block. If you've discarded a card this turn: Draw 2 cards. |
| **Kadabra**: Kinesis | Ekans's Glare, Jigglypuff's Sing (+1 line), Golbat's Confuse Ray (+1 line) +2 | [1] Apply 1 Weak. Apply 2 Vulnerable. Draw 2 cards. Exhaust. | [1] Apply 3 Weak. Choose a card in your draw pile and put it into your hand. |
| **Bronzor**: Gyro Ball | Stantler's Psyshield Bash (+1 line), Lopunny's Bounce (+1 line), Seedot's Harden (+1 line) +18 | [1] Deal 5 damage. Gain 5 block. Next turn, gain 2 block. | [1] Gain 9 block. If the enemy has strength or block: Gain 4 block. |
| **Elgyem**: Imprison | Mareep's Thunder Wave (+1 line), Petilil's Sleep Powder (+1 line), Poison Powder (+1 line) | [1] Apply 2 Weak. Apply 1 Sap. Draw 1 card. | [1] Apply 2 Sap. +1 energy next turn. |
| **Beheeyem**: Zen Headbutt | Zigzagoon's Headbutt (+1 line), Sharpedo's Ice Fang (+1 line), Pachirisu's Nuzzle (+1 line) +8 | [1] Deal 8 damage. Apply 1 Weak. Your next attack deals +2 damage. | [1] Deal 9 damage. Follow-up (skill): Draw 1 card. |
| **Porygon**: Conversion | Kecleon's Camouflage (+1 line), Metronome (+1 line), Porygon2's Conversion 2 (+1 line) | [1] Gain 6 block. Add a random card of your type to your hand. It costs 0 this turn. Exhaust. | [1] Gain 4 block. Choose a card in your hand. Add a copy of it to your hand. Exhaust. |
| **Watchog**: Confuse Ray | Spore, Misdreavus's Perish Song, Snubbull's Scary Face | [0] Apply 2 Weak. Apply 1 Vulnerable. Exhaust. | [0] Apply 2 Weak. If the enemy is Weak: Draw 1 card. Exhaust. |
| **Spiritomb**: Grudge | Temper Flare, Vanillite's Avalanche, Purrloin's Assurance +5 | [1] Deal 6 damage. If you've lost HP this turn: +8 damage. | [1] Deal 5 damage. If you've lost HP this turn: +4 damage. Apply 1 Sap. |
| **Chandelure**: Inferno | Duskull's Will-O-Wisp, Will-O-Wisp, Ash Cloud (+1 line) +3 | [2] Burn 5. Apply 2 Weak. | [2] Burn 6. If the enemy is Weak: Burn 3. |
| **Mismagius**: Mystical Fire | Growlithe's Crunch (+1 line), Tentacool's Acid Spray (+1 line), Sandile's Thief (+1 line) +9 | [1] Deal 5 damage. Apply 1 Vulnerable. Draw 1 card. | [1] Deal 6 damage. If the enemy is Weak: Apply 1 Vulnerable. Draw 1 card. |
| **Reuniclus**: Psychic | Zigzagoon's Headbutt (+1 line), Growlithe's Crunch (+1 line), Sharpedo's Ice Fang (+1 line) +14 | [1] Deal 9 damage. Apply 1 Weak. Apply 1 Vulnerable. | [1] Deal 10 damage. If the enemy is Vulnerable: Apply 2 Weak. |
| **Alakazam**: Psychic | Rattata's Hyper Fang (+1 line), Zangoose's Crush Claw (+1 line), Barboach's Earthquake (+1 line) +10 | [2] Deal 10 damage. Apply 2 Vulnerable. Draw 1 card. | [2] Deal 13 damage. Choose a card in your draw pile and put it into your hand. |

### Peak (24)

| Pokémon | Read like | Before | Now |
|---|---|---|---|
| **Stantler**: Psyshield Bash | Clamp, Frost Nip (+1 line), Floaty Fall (+1 line) +36 | [1] Deal 7 damage. Gain 7 block. | [1] Deal 9 damage. If the enemy intends to attack: Next turn, gain 5 block. |
| **Darumaka**: Belly Drum | Dwebble's Shell Smash (+1 line), Poliwhirl's Belly Drum, Crustle's Shell Smash (+1 line) +1 | [1] Lose 8 HP. Your hits deal +3 all fight. Exhaust. | [1] Your hits deal +2 all fight. If you've lost HP this turn: Your hits deal +1 all fight. Exhaust. |
| **Torkoal**: Protect | Quick Guard | [1] Block the enemy's next attack completely. Exhaust. | [1] Burn 2. Block the enemy's next attack completely. Exhaust. |
| **Houndour**: Foul Play | Power Whip | [1] Deal 7 damage. Strength counts 3 times. | [1] Burn 3. Steal 1. |
| **Sharpedo**: Ice Fang | Zigzagoon's Headbutt, Psyduck's Zen Headbutt, Shellos's Mud-Slap +41 | [1] Deal 9 damage. Apply 1 Weak. | [1] Deal 8 damage. If the enemy has strength or block: Apply 1 Vulnerable. Gain 1 Tide. |
| **Bouffalant**: Head Charge | Flare Blitz, Inferno Charge (+1 line), Chloroblast (+1 line) +19 | [2] Lose 4 HP. Deal 24 damage. | [2] Deal 18 damage. If you've lost HP this turn: Gain 6 block. |
| **Roggenrola**: Iron Defense | Seedot's Harden, Grimer's Minimize, Shelter +8 | [1] Gain 10 block. Next turn, gain 3 block. | [1] Gain 9 block. If the enemy attacked you last turn: Next turn, gain 4 block. |
| **Slugma**: Lava Plume | Vulpix's Weather Ball, Magmar's Smog, Panpour's Scald +12 | [2] Deal 10 damage. Burn 4. | [2] Deal 11 damage. If the enemy attacked you last turn: Burn 4. |
| **Seel**: Aurora Beam | Zigzagoon's Headbutt (+1 line), Staryu's Power Gem (+1 line), Sharpedo's Ice Fang (+1 line) +13 | [1] Deal 6 damage. Apply 1 Weak. Gain 1 Tide. | [1] Deal 6 damage. Follow-up (attack): Apply 2 Weak. |
| **Aron**: Iron Head | Stantler's Psyshield Bash, Krabby's Vice Grip, Wooper's Mud Shot +16 | [2] Deal 11 damage. Gain 9 block. | [2] Deal 14 damage. Follow-up (skill): The enemy's attacks deal 3 less this turn. |
| **Magcargo**: Flame Body | Flame Body | [1] Burn 2. Gain 6 block. | [1] Gain 7 block. If the enemy attacked you last turn: Burn 3. |
| **Ferrothorn**: Iron Barbs | Furret's Body Slam, Body Press, Shieldon's Metal Burst | [1] Gain 9 block, then deal damage equal to your block. | [2] Gain 13 block, then deal damage equal to your block. Apply 1 Sap. |
| **Lairon**: Iron Tail | Rattata's Hyper Fang, Zangoose's Crush Claw, Growlithe's Crunch +22 | [2] Deal 15 damage. Apply 1 Vulnerable. | [2] Deal 14 damage. Unburden: Apply 2 Vulnerable. |
| **Nosepass**: Rock Polish | Eevee's Baton Pass, Natu's Teleport (+1 line), Pelipper's Tailwind +6 | [0] Gain 3 block. Draw 1 card. | [0] Draw 1 card. Unburden: Gain 1 energy. |
| **Boldore**: Rock Blast | Ledian's Comet Punch, Cloyster's Icicle Spear, Armaldo's X-Scissor +4 | [1] Deal 3 damage 3 times. Gain 3 block. | [1] Deal 3 damage 3 times. Follow-up (skill): Gain 4 block. |
| **Aggron**: Heavy Slam | Stantler's Psyshield Bash, Krabby's Vice Grip, Wooper's Mud Shot +16 | [2] Deal 9 damage. Gain 10 block. | [2] Deal 14 damage. If the enemy has strength or block: Gain 6 block. |
| **Shelgon**: Shell Wait | Seedot's Harden, Grimer's Minimize, Roggenrola's Iron Defense +8 | [1] Gain 8 block. Next turn, gain 5 block. | [1] Next turn, gain 10 block. Retain. |
| **Beldum**: Take Down | Stantler's Psyshield Bash (+1 line), Krabby's Vice Grip (+1 line), Wooper's Mud Shot (+1 line) +11 | [1] Lose 2 HP. Deal 11 damage. Gain 3 block. | [1] Deal 9 damage. Unburden: Gain 5 block. |
| **Metang**: Meteor Mash | Aerodactyl's Ancient Power, Volcarona's Fiery Dance (+1 line), Eelektrik's Charge Beam +2 | [2] Deal 12 damage. Your hits deal +1 all fight. | [2] Deal 14 damage. If you've healed this turn: Your hits deal +1 all fight. |
| **Lopunny**: Bounce | Steel Wing, Diglett's Dig, Scraggy's Brick Break +6 | [1] Deal 7 damage. Next turn, gain 7 block. | [1] Deal 9 damage. If you have Evasion: Apply 2 Vulnerable. |
| **Magmortar**: Heat Wave | Ninetales's Fire Spin, Fire Lash | [2] Deal 6 damage 2 times. Burn 3. | [2] Deal 6 damage 2 times. If the enemy is Burned: Burn 3. |
| **Tyranitar**: Stone Edge | Rattata's Hyper Fang, Zangoose's Crush Claw, Growlithe's Crunch +22 | [2] Deal 17 damage. Apply 2 Vulnerable. | [2] Deal 17 damage. If the enemy is Weak: Steal 2. |
| **Salamence**: Dragon Rush | Gyarados's Thrash (+1 line), Dragonite's Outrage, Flame Wheel | [2] Lose 2 HP. Deal 10 damage 2 times. | [2] Deal 8 damage 2 times. If the enemy attacked you last turn: It hits once more. |
| **Metagross**: Bullet Punch | Ledian's Comet Punch, Cloyster's Icicle Spear, Armaldo's X-Scissor +4 | [1] Deal 5 damage 2 times. Gain 6 block. | [1] Deal 6 damage 2 times. Follow-up (attack): Gain 5 block. |

### Desert (37)

| Pokémon | Read like | Before | Now |
|---|---|---|---|
| **Cacturne**: Sucker Punch | Throat Chop, Huntail's Sucker Punch | [1] Deal 4 damage. If the enemy intends to attack: +8 damage. | [1] Deal 5 damage. If the enemy intends to attack: +5 damage. Leech Seed 1. |
| **Maractus**: Pin Missile | Sentret's Fury Swipes, Cinccino's Tail Slap, Paras's X-Scissor +5 | [1] Deal 3 damage 4 times. | [1] Deal 3 damage 3 times. If the enemy is Weak: It hits once more. |
| **Magmar**: Smog | Vulpix's Weather Ball, Fire Spin, Ponyta's Flame Charge (+1 line) +9 | [1] Deal 4 damage. Burn 3. | [1] Burn 2. Apply 2 Sap. |
| **Pansear**: Fling | Octazooka (+1 line), Yanma's U-turn (+1 line) | [1] Deal 9 damage. Discard 1 card. | [1] Deal 8 damage. If you've discarded a card this turn: Burn 3. |
| **Sentret**: Fury Swipes | Double Hit, Cinccino's Tail Slap, Paras's X-Scissor +5 | [1] Deal 2 damage 5 times. | [1] Deal 2 damage 3 times. If the enemy is Vulnerable: It hits 2 more times. |
| **Zangoose**: Crush Claw | Rattata's Hyper Fang, Scorch (+1 line), Seed Bomb (+1 line) +22 | [2] Deal 14 damage. Apply 2 Vulnerable. | [2] Deal 15 damage. If the enemy has strength or block: +4 damage. Apply 1 Vulnerable. |
| **Yamask**: Disable | Smokescreen | [0] Apply 3 Weak. Exhaust. | [0] Apply 2 Weak. +1 energy next turn. Exhaust. |
| **Sigilyph**: Cosmic Power | Seedot's Harden, Grimer's Minimize, Roggenrola's Iron Defense +8 | [1] Gain 7 block. Next turn, gain 7 block. | [1] Gain 7 block. Follow-up (attack): Next turn, gain 5 block. |
| **Cacnea**: Needle Arm | Exeggcute's Egg Barrage, Roselia's Petal Dance | [1] Deal 5 damage 2 times. Leech Seed 1. | [1] Deal 5 damage 2 times. If the enemy intends to attack: Leech Seed 2. |
| **Anorith**: Rock Blast | Skorupi's Toxic Spikes, Nidoran♂'s Double Kick, Tentacruel's Toxic Tentacles +1 | [1] Deal 3 damage 3 times. Apply 1 Sap. | [1] Deal 3 damage 3 times. If the enemy attacked you last turn: Apply 2 Sap. |
| **Lileep**: Giga Drain | Lickitung's Wring Out (+1 line), Giga Drain, Simisage's Seed Bomb (+1 line) +2 | [2] Deal 8 damage. Leech Seed 1. Heal 4 HP. | [1] Leech Seed 2. If you've healed this turn: Leech Seed 2. |
| **Solrock**: Morning Sun | Deerling's Aromatherapy (+1 line), Aromatherapy (+1 line), Aromatic Mist (+1 line) +2 | [1] Heal 5 HP. Draw 1 card. | [1] Heal 4 HP. If the enemy is Burned: Draw 2 cards. |
| **Lunatone**: Psychic | Zigzagoon's Headbutt, Psyduck's Zen Headbutt, Shellos's Mud-Slap +31 | [2] Deal 10 damage. Apply 2 Weak. | [2] Deal 11 damage. If the enemy is Weak: +1 energy next turn. |
| **Cofagrigus**: Mummy | Cottonee's Cotton Spore, Koffing's Haze (+1 line), Numel's Yawn +24 | [1] Apply 1 Weak. Gain 9 block. | [1] Apply 2 Weak. Your block doesn't wear off at the start of your next turn. |
| **Cradily**: Root Hold | Cherubi's Morning Sun (+1 line), Foongus's Ingrain (+1 line), Ducklett's Roost (+1 line) +9 | [1] Leech Seed 2. Gain 5 block. Heal 2 HP. | [1] Leech Seed 3. If the enemy has Leech Seed: Gain 6 block. |
| **Kabuto**: Harden Shell | Eevee's Baton Pass (+1 line), Mantyke's Wide Guard (+1 line), Golduck's Amnesia (+1 line) +6 | [1] Gain 7 block. Draw 1 card. Gain 1 Tide. | [1] Gain 9 block. Unburden: Gain 2 Tide. |
| **Tirtouga**: Shell Shield | Shellder's Clamp (+1 line), Mantyke's Wide Guard, Qwilfish's Spikes (+1 line) +11 | [1] Gain 9 block. Gain 1 Tide. | [1] Gain 7 block. If the enemy is Vulnerable: Gain 2 Tide. |
| **Relicanth**: Head Smash | Bouffalant's Head Charge, Pinsir's Submission, Basculin's Reckless +19 | [2] Lose 4 HP. Deal 18 damage. | [2] Lose 3 HP. Deal 17 damage. Next turn, gain 4 block. |
| **Armaldo**: X-Scissor | Ledian's Comet Punch, Cloyster's Icicle Spear, Petal Dance +4 | [1] Deal 5 damage 2 times. Gain 3 block. | [1] Deal 5 damage 2 times. If the enemy has strength or block: Gain 5 block. |
| **Durant**: Metal Claw | Stantler's Psyshield Bash (+1 line), Krabby's Vice Grip (+1 line), Lillipup's Work Up (+1 line) +10 | [1] Deal 5 damage. Gain 2 block. Your hits deal +1 all fight. | [1] Deal 4 damage 2 times. Follow-up (attack): Your hits deal +1 all fight. |
| **Scolipede**: Steamroller | Oddish's Acid, Tangela's Constrict, Croagunk's Poison Jab +8 | [2] Deal 12 damage. Apply 2 Sap. | [2] Deal 12 damage. If the enemy attacked you last turn: Apply 2 Sap. |
| **Cranidos**: Zen Headbutt | Bouffalant's Head Charge, Pineco's Self-Destruct (+1 line), Pinsir's Submission +17 | [1] Lose 2 HP. Deal 9 damage. | [1] Deal 9 damage. If you've lost HP this turn: +3 damage. Draw 1 card. |
| **Shieldon**: Metal Burst | Furret's Body Slam, Ferrothorn's Iron Barbs, Body Press | [1] Gain 7 block, then deal damage equal to your block. | [1] Counter 7. Your block doesn't wear off at the start of your next turn. |
| **Carracosta**: Solid Rock | Shellder's Clamp (+1 line), Mantyke's Wide Guard, Qwilfish's Spikes (+1 line) +11 | [1] Gain 8 block. Gain 2 Tide. | [1] Gain 8 block. If you've lost HP this turn: Gain 2 Tide. |
| **Exeggutor**: Wood Hammer | Bouffalant's Head Charge, Pinsir's Submission, Basculin's Reckless +19 | [2] Lose 3 HP. Deal 15 damage. | [2] Deal 14 damage. If you've healed this turn: Leech Seed 3. |
| **Ninjask**: Speed Boost | Lucky Claw | [1] Draw 3 cards. Exhaust. | [1] Tailwind 1. Draw 2 cards. |
| **Bastiodon**: Wide Guard | Burmy's Protect, Iron Defense | [2] Gain 16 block. Exhaust. | [2] Block the enemy's next attack completely. Gain 6 block. Exhaust. |
| **Unown**: Hidden Power | Metronome (+1 line), Porygon2's Conversion 2 (+1 line) | [1] Apply 1 Weak. Add a random card of your type to your hand. It costs 0 this turn. Exhaust. | [0] Your next attack deals +2 damage. Add a random card of your type to your hand. It costs 0 this turn. Exhaust. |
| **Probopass**: Power Gem | Stantler's Psyshield Bash, Krabby's Vice Grip, Wooper's Mud Shot +16 | [2] Deal 9 damage. Gain 9 block. | [2] Deal 13 damage. If the enemy has strength or block: Static 3. |
| **Klang**: Shift Gear (was Gear Grind) | Ledian's Comet Punch, Cloyster's Icicle Spear, Armaldo's X-Scissor +3 | [2] Deal 8 damage 2 times. Gain 3 block. | [1] Your next attack deals +4 damage. +1 energy next turn. |
| **Zebstrika**: Flame Charge Dash | Lopunny's Bounce, Diglett's Dig, Scraggy's Brick Break +6 | [1] Deal 7 damage. Next turn, gain 4 block. | [1] Deal 7 damage. Unburden: +1 energy next turn. |
| **Cinccino**: Tail Slap | Sentret's Fury Swipes, Double Hit, Paras's X-Scissor +5 | [2] Deal 4 damage 5 times. | [2] Deal 4 damage 5 times. If the enemy has strength or block: It hits 2 more times. |
| **Purugly**: Slam | Hyper Beam | [1] Deal 13 damage. 1 less energy next turn. | [1] Deal 8 damage. If the enemy has strength or block: The enemy's attacks deal 3 less this turn. |
| **Larvesta**: Quiver Dance | Lillipup's Work Up (+1 line), Eevee's Baton Pass (+1 line), Dratini's Dragon Dance (+1 line) +6 | [1] Gain 4 block. Your hits deal +1 all fight. Draw 1 card. | [1] Your hits deal +1 all fight. If the enemy is Burned: Draw 2 cards. |
| **Darmanitan**: Hammer Arm | Vulpix's Weather Ball, Magmar's Smog, Panpour's Scald +12 | [2] Deal 13 damage. Burn 3. | [2] Burn 6. If you've lost HP this turn: Your hits deal +1 all fight. |
| **Volcarona**: Fiery Dance | Slugma's Lava Plume (+1 line), Darmanitan's Hammer Arm (+1 line), Leaf Blade (+1 line) +1 | [2] Deal 8 damage. Burn 3. Your hits deal +1 all fight. | [2] Deal 11 damage. If the enemy is Burned: Your hits deal +1 all fight. |
| **Kabutops**: Razor Shell | Growlithe's Crunch (+1 line), Staryu's Power Gem (+1 line), Tentacool's Acid Spray (+1 line) +6 | [1] Deal 8 damage. Apply 1 Vulnerable. Gain 1 Tide. | [1] Deal 5 damage 2 times. If the enemy is Vulnerable: Gain 2 Tide. |

### Power Plant (19)

| Pokémon | Read like | Before | Now |
|---|---|---|---|
| **Mareep**: Thunder Wave | Sleep Powder (+1 line), Aromatic Mist (+1 line), Chilling Water (+1 line) +14 | [1] Apply 2 Weak. Draw 1 card. | [1] Static 3. Draw 1 card. |
| **Shinx**: Spark | Zigzagoon's Headbutt, Psyduck's Zen Headbutt, Shellos's Mud-Slap +12 | [0] Deal 2 damage. Apply 2 Weak. | [0] Deal 4 damage. Follow-up (skill): Static 1. |
| **Blitzle**: Volt Switch | Teddiursa's Slash (+1 line), Hoppip's Acrobatics, Ponyta's Flame Charge (+1 line) +19 | [1] Deal 5 damage. Draw 2 cards. | [1] Static 3. Unburden: Draw 2 cards. |
| **Tynamo**: Charge | Recharge | [1] Draw 2 cards. +1 energy next turn. | [1] Static 3. +1 energy next turn. |
| **Joltik**: Electroweb | Zigzagoon's Headbutt (+1 line), Growlithe's Crunch (+1 line), Sharpedo's Ice Fang (+1 line) +14 | [1] Deal 4 damage. Apply 1 Weak. Apply 1 Vulnerable. | [1] Static 2. Apply 2 Sap. |
| **Flaaffy**: Thunder Punch | Zigzagoon's Headbutt (+1 line), Sharpedo's Ice Fang (+1 line), Pachirisu's Nuzzle (+1 line) +5 | [1] Deal 7 damage. Apply 1 Weak. +1 energy next turn. | [1] Deal 8 damage. If the enemy attacked you last turn: Static 3. |
| **Raichu**: Thunderbolt | Zigzagoon's Headbutt (+1 line), Sharpedo's Ice Fang (+1 line), Pachirisu's Nuzzle (+1 line) +5 | [1] Deal 6 damage. Apply 1 Weak. +1 energy next turn. | [1] Deal 10 damage. If the enemy is Vulnerable: Static 3. |
| **Pichu**: Volt Tackle | Bouffalant's Head Charge, Pineco's Self-Destruct (+1 line), Pinsir's Submission +17 | [1] Lose 3 HP. Deal 10 damage. | [1] Deal 6 damage. If you've lost HP this turn: Static 3. |
| **Plusle**: Helping Hand | Gulpin's Stockpile, Shuckle's Power Trick, Poochyena's Howl +3 | [0] Gain 3 block. Your hits deal +1 all fight. Exhaust. | [0] Static 1. Your hits deal +1 all fight. Exhaust. |
| **Minun**: Charge | Cell Battery | [1] Gain 5 block. +1 energy next turn. | [1] Gain 6 block. If the enemy is Weak: +1 energy next turn. |
| **Emolga**: Shock Wave | Nuzleaf's Fake Out (+1 line), Whimsicott's Tailwind (+1 line), Breloom's Mach Punch (+1 line) | [0] Deal 4 damage. Apply 1 Weak. Draw 1 card. Exhaust. | [0] Deal 4 damage. Unburden: Static 2. |
| **Eelektrik**: Charge Beam | Aerodactyl's Ancient Power, Togepi's Ancient Power (+1 line), Beautifly's Silver Wind (+1 line) +6 | [1] Deal 5 damage. Your hits deal +1 all fight. | [1] Deal 6 damage. Follow-up (skill): +1 energy next turn. |
| **Luxio**: Spark Claw | Zigzagoon's Headbutt (+1 line), Lopunny's Bounce (+1 line), Sharpedo's Ice Fang (+1 line) +12 | [1] Deal 7 damage. Apply 1 Weak. Next turn, gain 3 block. | [1] Deal 7 damage. If the enemy intends to attack: Apply 1 Weak. Static 2. |
| **Voltorb**: Explosion | Pineco's Self-Destruct, Basculin's Reckless (+1 line), Swanna's Brave Bird (+1 line) +9 | [1] Lose 7 HP. Deal 22 damage. Exhaust. | [1] Lose 6 HP. Deal 18 damage. Static 4. Exhaust. |
| **Elekid**: Thunder Punch | Zigzagoon's Headbutt (+1 line), Lopunny's Bounce (+1 line), Sharpedo's Ice Fang (+1 line) +12 | [1] Deal 6 damage. Apply 1 Weak. Next turn, gain 3 block. | [1] Deal 8 damage. Follow-up (attack): Static 2. |
| **Electabuzz**: Light Screen | Seedot's Harden (+1 line), Cottonee's Cotton Spore (+1 line), Grimer's Minimize (+1 line) +12 | [1] Apply 1 Weak. Gain 5 block. Next turn, gain 5 block. | [1] Gain 7 block. If the enemy intends to attack: Static 3. |
| **Rotom**: Trick | Metronome | [0] Add a random card of your type to your hand. It costs 0 this turn. Exhaust. | [0] Static 1. Add a random card of your type to your hand. It costs 0 this turn. Exhaust. |
| **Ampharos**: Thunderbolt | Psyduck's Zen Headbutt (+1 line), Bidoof's Super Fang (+1 line), Kricketot's Struggle Bug +12 | [2] Deal 13 damage. Apply 1 Weak. Draw 1 card. | [2] Deal 12 damage. Static 3. Draw 1 card. |
| **Luxray**: Wild Charge | Growlithe's Crunch (+1 line), Tentacool's Acid Spray (+1 line), Spearow's Drill Peck (+1 line) +10 | [1] Lose 2 HP. Deal 11 damage. Apply 1 Vulnerable. | [1] Deal 9 damage. If the enemy is Weak: +3 damage. Static 1. |

### Ice Cave (18)

| Pokémon | Read like | Before | Now |
|---|---|---|---|
| **Swinub**: Ice Shard | Hoppip's Acrobatics (+1 line), Goldeen's Waterfall, Buizel's Aqua Jet (+1 line) +1 | [0] Deal 3 damage. Draw 1 card. Gain 1 Tide. | [0] Deal 4 damage. If the enemy has Frostbite: Draw 1 card. |
| **Snorunt**: Icy Wind | Zigzagoon's Headbutt (+1 line), Staryu's Power Gem (+1 line), Sharpedo's Ice Fang (+1 line) +13 | [1] Deal 4 damage. Apply 2 Weak. Gain 1 Tide. | [1] Deal 7 damage. If the enemy is Weak: Frostbite 3. |
| **Cubchoo**: Flail | Flare Up, Mankey's Cross Chop, Phanpy's Endeavor (+1 line) | [1] Deal 5 damage. +10 if your HP is below half. | [1] Deal 5 damage. +8 if your HP is below half. Retain. |
| **Sneasel**: Beat Up | Sentret's Fury Swipes, Cinccino's Tail Slap, Paras's X-Scissor +5 | [1] Deal 2 damage 4 times. | [1] Deal 3 damage 3 times. If the enemy intends to attack: It hits once more. |
| **Snover**: Snow Warning | Cottonee's Cotton Spore (+1 line), Shroomish's Spore (+1 line), Foongus's Ingrain (+1 line) +6 | [1] Apply 1 Weak. Leech Seed 1. Gain 6 block. | [1] Leech Seed 2. Hail 3. |
| **Smoochum**: Sweet Kiss | Surskit's Sticky Web (+1 line), Snorunt's Icy Wind (+1 line), Seel's Aurora Beam (+1 line) +7 | [1] Apply 2 Weak. Gain 2 Tide. | [1] Apply 2 Weak. If the enemy is Weak: Draw 1 card. Gain 1 Tide. |
| **Vanillite**: Avalanche | Spiritomb's Grudge, Temper Flare, Purrloin's Assurance +4 | [2] Deal 8 damage. If you've lost HP this turn: +8 damage. | [2] Deal 10 damage. If you've lost HP this turn: Frostbite 4. |
| **Glalie**: Ice Fang | Zigzagoon's Headbutt (+1 line), Staryu's Power Gem (+1 line), Sharpedo's Ice Fang (+1 line) +13 | [1] Deal 7 damage. Apply 1 Weak. Gain 1 Tide. | [1] Deal 10 damage. If the enemy has Frostbite: The enemy's attacks deal 3 less this turn. |
| **Beartic**: Icicle Crash | Psyduck's Zen Headbutt (+1 line), Snorunt's Icy Wind, Bidoof's Super Fang (+1 line) +11 | [2] Deal 13 damage. Apply 1 Weak. Gain 1 Tide. | [2] Deal 15 damage. If the enemy has Frostbite: +6 damage. |
| **Abomasnow**: Wood Hammer | Bouffalant's Head Charge, Pinsir's Submission, Basculin's Reckless +19 | [2] Lose 4 HP. Deal 16 damage. | [2] Lose 3 HP. Deal 16 damage. Hail 2. |
| **Cloyster**: Icicle Spear | Ledian's Comet Punch, Petal Dance, Armaldo's X-Scissor +4 | [1] Deal 2 damage 4 times. Gain 3 block. | [1] Deal 3 damage 3 times. If the enemy has Frostbite: It hits 2 more times. |
| **Dewgong**: Aurora Beam | Zigzagoon's Headbutt (+1 line), Stantler's Psyshield Bash (+1 line), Krabby's Vice Grip (+1 line) +18 | [1] Deal 5 damage. Apply 1 Weak. Gain 4 block. | [1] Deal 7 damage. If the enemy is Weak: Frostbite 2. Gain 3 block. |
| **Vanillish**: Frost Breath | Stantler's Psyshield Bash (+1 line), Krabby's Vice Grip (+1 line), Staryu's Power Gem (+1 line) +14 | [1] Deal 4 damage. Gain 4 block. Gain 1 Tide. | [1] Gain 7 block. If the enemy has Frostbite: Gain 2 Tide. |
| **Froslass**: Icy Wind | Zigzagoon's Headbutt (+1 line), Stantler's Psyshield Bash (+1 line), Krabby's Vice Grip (+1 line) +18 | [1] Deal 3 damage. Apply 2 Weak. Gain 4 block. | [1] Apply 2 Weak. If the enemy is Weak: Frostbite 3. |
| **Weavile**: Night Slash | Wingull's Air Cutter, Gabite's Dual Chop, Petal Storm +3 | [1] Deal 4 damage 2 times. Apply 1 Vulnerable. | [1] Deal 4 damage 2 times. If the enemy has Frostbite: Steal 1. |
| **Vanilluxe**: Blizzard | Larvitar's Rock Slide (+1 line), Doduo's Tri Attack (+1 line), Piloswine's Blizzard +3 | [2] Deal 7 damage 2 times. Apply 2 Weak. Gain 1 Tide. | [2] Deal 8 damage 2 times. Hail 2. |
| **Lapras**: Ice Beam | Psyduck's Zen Headbutt (+1 line), Snorunt's Icy Wind, Bidoof's Super Fang (+1 line) +11 | [2] Deal 12 damage. Apply 2 Weak. Gain 2 Tide. | [2] Deal 14 damage. If the enemy has Frostbite: Gain 3 Tide. |
| **Glaceon**: Ice Fang | Zigzagoon's Headbutt (+1 line), Stantler's Psyshield Bash (+1 line), Krabby's Vice Grip (+1 line) +18 | [1] Deal 7 damage. Apply 1 Weak. Gain 3 block. | [1] Deal 8 damage. If the enemy has Frostbite: Gain 5 block. |

### Dojo Mountain (28)

| Pokémon | Read like | Before | Now |
|---|---|---|---|
| **Croagunk**: Poison Jab | Oddish's Acid, Tangela's Constrict, Venonat's Signal Beam (+1 line) +15 | [1] Deal 8 damage. Apply 1 Sap. | [1] Deal 7 damage. If the enemy attacked you last turn: +3 damage. Apply 1 Sap. |
| **Meditite**: Meditate | Heat Up (+1 line) | [1] Your hits deal +2 all fight. Your next attack deals +4 damage. Exhaust. | [1] Counter 4. Your next attack deals +5 damage. |
| **Machop**: Karate Chop | Teddiursa's Slash, Persian's Nasty Plot (+1 line), Sandile's Thief (+1 line) +7 | [1] Deal 7 damage. Your next attack deals +3 damage. Draw 1 card. | [1] Deal 9 damage. Follow-up (skill): +2 damage. Draw 1 card. |
| **Mankey**: Cross Chop | Cubchoo's Flail, Flare Up | [2] Deal 11 damage. +6 if your HP is below half. | [1] Deal 6 damage. If the enemy attacked you last turn: Your hits deal +1 all fight. |
| **Scraggy**: Brick Break | Lopunny's Bounce, Diglett's Dig, Steel Wing +6 | [1] Deal 8 damage. Next turn, gain 4 block. | [1] Deal 7 damage. If the enemy has strength or block: +3 damage. Draw 1 card. |
| **Machoke**: Bulk Up | Lillipup's Work Up, Gulpin's Stockpile (+1 line), Larvesta's Quiver Dance (+1 line) +9 | [1] Gain 7 block. Your hits deal +1 all fight. | [1] Counter 6. Your hits deal +1 all fight. |
| **Timburr**: Hammer Arm | Stantler's Psyshield Bash, Krabby's Vice Grip, Wooper's Mud Shot +16 | [2] Deal 14 damage. Gain 4 block. | [2] Deal 14 damage. Follow-up (attack): Counter 4. |
| **Toxicroak**: Cross Chop | Riolu's Aura Sphere, Charge Beam, Gothorita's Psyshock +2 | [2] Deal 14 damage. Your next attack deals +4 damage. | [2] Deal 12 damage. If the enemy intends to attack: Apply 2 Sap. Counter 3. |
| **Makuhita**: Arm Thrust | Aipom's Swift | [1] Deal 2 damage 4 times. Retain. | [1] Deal 2 damage 4 times. If the enemy intends to attack: Counter 3. |
| **Gurdurr**: Bulk Up | Lillipup's Work Up (+1 line), Gulpin's Stockpile, Shuckle's Power Trick +9 | [1] Gain 7 block. Your hits deal +1 all fight. Exhaust. | [1] Gain 6 block. Follow-up (attack): Your hits deal +1 all fight. |
| **Machamp**: Seismic Toss | Bouffalant's Head Charge, Pineco's Self-Destruct (+1 line), Pinsir's Submission +17 | [1] Lose 2 HP. Deal 10 damage. | [1] Deal 4 damage 3 times. Counter 3. |
| **Primeape**: Stomping Tantrum | Spiritomb's Grudge, Vanillite's Avalanche, Purrloin's Assurance +5 | [1] Deal 6 damage. If you've lost HP this turn: +5 damage. | [1] Deal 6 damage. If you've lost HP this turn: Counter 5. |
| **Hariyama**: Knock Off | Zigzagoon's Headbutt (+1 line), Growlithe's Crunch (+1 line), Sharpedo's Ice Fang (+1 line) +14 | [1] Deal 8 damage. Apply 1 Weak. Apply 1 Vulnerable. | [1] Deal 10 damage. If the enemy intends to attack: Counter 4. |
| **Conkeldurr**: Hammer Arm | Stantler's Psyshield Bash, Krabby's Vice Grip, Wooper's Mud Shot +16 | [2] Deal 15 damage. Gain 3 block. | [2] Deal 14 damage. If the enemy attacked you last turn: Counter 5. |
| **Medicham**: High Jump Kick | Bouffalant's Head Charge, Pineco's Self-Destruct (+1 line), Pinsir's Submission +17 | [1] Lose 4 HP. Deal 13 damage. | [1] Deal 10 damage. Follow-up (attack): Your next attack deals +4 damage. |
| **Scrafty**: Drain Punch | Pidove's Pluck (+1 line), Aerodactyl's Ancient Power (+1 line), Parasect's Leech Life (+1 line) +4 | [1] Deal 6 damage. Heal 2 HP. Your hits deal +1 all fight. | [1] Deal 8 damage. Follow-up (skill): Heal 3 HP. |
| **Mienfoo**: Fake Out | Ambipom's Fake Out, Nuzleaf's Fake Out (+1 line), Delcatty's Fake Out +1 | [0] Deal 3 damage. Apply 1 Weak. Exhaust. Innate. | [0] Deal 3 damage. If the enemy intends to attack: Apply 2 Weak. Exhaust. Innate. |
| **Mienshao**: Hi Jump Kick | Bouffalant's Head Charge, Pinsir's Submission, Basculin's Reckless +19 | [2] Lose 3 HP. Deal 17 damage. | [2] Deal 14 damage. Follow-up (attack): Evasion 1. |
| **Throh**: Storm Throw | Stantler's Psyshield Bash (+1 line), Growlithe's Crunch (+1 line), Krabby's Vice Grip (+1 line) +10 | [1] Deal 6 damage. Apply 1 Vulnerable. Gain 4 block. | [1] Deal 8 damage. If the enemy has strength or block: Counter 4. |
| **Sawk**: Karate Chop | Farfetch'd's Leek Slash, Gallade's Psycho Cut, Hitmonchan's Comet Punch | [1] Deal 5 damage 2 times. Your next attack deals +2 damage. | [1] Deal 5 damage 2 times. Follow-up (skill): Your next attack deals +3 damage. |
| **Tyrogue**: Mach Punch | Riolu's Aura Sphere, Toxicroak's Cross Chop, Gothorita's Psyshock +2 | [0] Deal 4 damage. Your next attack deals +2 damage. | [0] Deal 3 damage. Your next attack deals +3 damage. Innate. |
| **Hitmonlee**: Rolling Kick | Zigzagoon's Headbutt (+1 line), Sharpedo's Ice Fang (+1 line), Pachirisu's Nuzzle (+1 line) +8 | [1] Deal 9 damage. Apply 1 Weak. Your next attack deals +2 damage. | [1] Deal 10 damage. If the enemy intends to attack: The enemy's attacks deal 3 less this turn. |
| **Hitmonchan**: Comet Punch | Farfetch'd's Leek Slash, Sawk's Karate Chop, Gallade's Psycho Cut | [1] Deal 2 damage 4 times. Your next attack deals +2 damage. | [1] Deal 2 damage 4 times. If the enemy intends to attack: Your next attack deals +4 damage. |
| **Hitmontop**: Triple Kick | Pidgey's Wing Attack (+1 line), Eevee's Baton Pass (+1 line), Pansage's Bullet Seed (+1 line) +10 | [1] Deal 3 damage 3 times. Gain 4 block. Draw 1 card. | [1] Deal 4 damage 3 times. Follow-up (skill): Counter 3. |
| **Heracross**: Megahorn | Ember, Vine Whip, Water Gun +8 | [2] Deal 19 damage. | [2] Deal 15 damage. If you've lost HP this turn: +3 damage. Your hits deal +1 all fight. |
| **Riolu**: Aura Sphere | Teddiursa's Slash (+1 line), Machop's Karate Chop (+1 line), Charge Beam +8 | [1] Deal 9 damage. Your next attack deals +2 damage. | [1] Deal 7 damage. If the enemy attacked you last turn: Your next attack deals +4 damage. |
| **Lucario**: Aura Sphere | Teddiursa's Slash (+1 line), Hoppip's Acrobatics, Ponyta's Flame Charge (+1 line) +19 | [1] Deal 9 damage. Draw 1 card. | [1] Deal 9 damage. If the enemy intends to attack: Your next attack deals +5 damage. |
| **Gallade**: Psycho Cut | Farfetch'd's Leek Slash, Sawk's Karate Chop, Hitmonchan's Comet Punch | [1] Deal 6 damage 2 times. Your next attack deals +3 damage. | [1] Deal 6 damage 2 times. If the enemy attacked you last turn: Your next attack deals +4 damage. |

### Quarry (33)

| Pokémon | Read like | Before | Now |
|---|---|---|---|
| **Wooper**: Mud Shot | Stantler's Psyshield Bash, Krabby's Vice Grip, Clamp +36 | [1] Deal 5 damage. Gain 7 block. | [1] Deal 7 damage. If the enemy has Fault: Gain 2 Tide. |
| **Stunfisk**: Discharge | Whirlpool, Larvitar's Rock Slide, Doduo's Tri Attack +11 | [1] Deal 5 damage 2 times. Apply 1 Weak. | [1] Static 3. Fault 2. |
| **Barboach**: Earthquake | Rattata's Hyper Fang, Zangoose's Crush Claw, Growlithe's Crunch +22 | [2] Deal 16 damage. Apply 1 Vulnerable. | [2] Deal 16 damage. If the enemy is Vulnerable: Fault 3. |
| **Larvitar**: Rock Slide | Stunfisk's Discharge, Petal Blizzard (+1 line), Whirlpool +9 | [2] Deal 8 damage 2 times. Apply 1 Weak. | [2] Deal 8 damage 2 times. Sandstorm 1. |
| **Numel**: Yawn | Cottonee's Cotton Spore, Koffing's Haze (+1 line), Chilling Water (+1 line) +24 | [1] Apply 2 Weak. Gain 6 block. | [1] Burn 3. The enemy's attacks deal 2 less this turn. |
| **Diglett**: Dig | Lopunny's Bounce, Steel Wing, Scraggy's Brick Break +6 | [1] Deal 6 damage. Next turn, gain 5 block. | [0] Deal 3 damage. If the enemy has Fault: Draw 1 card. |
| **Cubone**: Bonemerang | Sentret's Fury Swipes, Cinccino's Tail Slap, Paras's X-Scissor +5 | [2] Deal 9 damage 2 times. | [2] Deal 8 damage 2 times. If the enemy has Fault: It hits once more. |
| **Trapinch**: Sand Tomb | Zigzagoon's Headbutt (+1 line), Oddish's Acid (+1 line), Tangela's Constrict (+1 line) +16 | [1] Deal 3 damage. Apply 1 Weak. Apply 2 Sap. | [1] Sandstorm 2. Apply 3 Sap. |
| **Nincada**: Molt | Cherubi's Morning Sun, Ducklett's Roost, Combee's Honey Gather (+1 line) +12 | [1] Gain 6 block. Heal 4 HP. | [1] Heal 4 HP. Exhaust 1 card from your hand. |
| **Geodude**: Rollout | Marill's Rollout, Karrablast's Fury Cutter, Aqua Cutter +1 | [1] Deal 4 damage. Grows +4 damage each turn it stays. Retain. | [1] Deal 3 damage. Fault 1. Grows +4 damage each turn it stays. Retain. |
| **Gligar**: Acrobatics | Pidgey's Wing Attack, Pansage's Bullet Seed, Drilbur's Drill Run +6 | [1] Deal 5 damage 2 times. Draw 1 card. | [1] Deal 5 damage 2 times. Unburden: Draw 1 card. |
| **Baltoy**: Gyro Ball | Stantler's Psyshield Bash (+1 line), Krabby's Vice Grip (+1 line), Eevee's Baton Pass (+1 line) +9 | [1] Deal 4 damage. Gain 4 block. Draw 1 card. | [1] Deal 7 damage. If the enemy has Fault: Gain 5 block. |
| **Quagsire**: Mud Bomb | Stantler's Psyshield Bash (+1 line), Krabby's Vice Grip (+1 line), Staryu's Power Gem (+1 line) +14 | [1] Deal 5 damage. Gain 4 block. Gain 1 Tide. | [1] Gain 8 block. If the enemy has strength or block: Gain 2 Tide. |
| **Whiscash**: Muddy Water | Psyduck's Zen Headbutt (+1 line), Snorunt's Icy Wind, Bidoof's Super Fang (+1 line) +11 | [2] Deal 9 damage. Apply 2 Weak. Gain 2 Tide. | [2] Deal 13 damage. If the enemy is Weak: Fault 3. |
| **Gastrodon**: Storm Drain | Shellder's Clamp (+1 line), Mantyke's Wide Guard, Qwilfish's Spikes (+1 line) +11 | [1] Gain 4 block. Gain 3 Tide. | [1] Gain 3 Tide. If the enemy intends to attack: Gain 2 Tide. |
| **Camerupt**: Eruption | Slugma's Lava Plume (+1 line), Aron's Iron Head (+1 line), Darmanitan's Hammer Arm (+1 line) +9 | [2] Deal 8 damage. Burn 3. Gain 4 block. | [2] Deal 13 damage. If the enemy is Burned: Fault 3. |
| **Graveler**: Rollout | Marill's Rollout, Karrablast's Fury Cutter, Geodude's Rollout +1 | [1] Deal 5 damage. Grows +4 damage each turn it stays. Retain. | [1] Deal 4 damage. Sandstorm 1. Grows +4 damage each turn it stays. Retain. |
| **Dugtrio**: Sucker Punch | Rhyhorn's Horn Drill, Rhyperior's Rock Wrecker | [0] Deal 6 damage. Exhaust. | [0] Deal 5 damage. If the enemy intends to attack: +4 damage. Exhaust. |
| **Marowak**: Bone Rush | Sentret's Fury Swipes, Cinccino's Tail Slap, Paras's X-Scissor +5 | [2] Deal 3 damage 5 times. | [2] Deal 3 damage 5 times. If the enemy intends to attack: Gain 5 block. |
| **Vibrava**: Dragon Breath | Zigzagoon's Headbutt (+1 line), Sharpedo's Ice Fang (+1 line), Mareep's Thunder Wave (+1 line) +17 | [1] Deal 7 damage. Apply 1 Weak. Draw 1 card. | [1] Deal 8 damage. In Sandstorm: Draw 2 cards. |
| **Hippowdon**: Earth Power | Stantler's Psyshield Bash, Krabby's Vice Grip, Wooper's Mud Shot +16 | [2] Deal 10 damage. Gain 8 block. | [2] Sandstorm 3. Heal 7 HP. |
| **Golett**: Mega Punch | Stantler's Psyshield Bash, Krabby's Vice Grip, Wooper's Mud Shot +16 | [2] Deal 13 damage. Gain 5 block. | [2] Deal 15 damage. If the enemy attacked you last turn: Fault 3. |
| **Golem**: Explosion | Pineco's Self-Destruct, Basculin's Reckless (+1 line), Swanna's Brave Bird (+1 line) +9 | [1] Lose 8 HP. Deal 24 damage. Exhaust. | [1] Lose 7 HP. Deal 20 damage. Fault 3. Exhaust. |
| **Pupitar**: Rock Tomb | Zigzagoon's Headbutt (+1 line), Stantler's Psyshield Bash (+1 line), Krabby's Vice Grip (+1 line) +18 | [1] Deal 6 damage. Apply 1 Weak. Gain 3 block. | [1] Gain 10 block. In Sandstorm: Fault 3. |
| **Rhydon**: Horn Drill | Rattata's Hyper Fang (+1 line), Zangoose's Crush Claw (+1 line), Barboach's Earthquake (+1 line) +16 | [2] Deal 13 damage. Apply 2 Vulnerable. Gain 3 block. | [2] Deal 18 damage. If the enemy has Fault: Apply 2 Vulnerable. |
| **Gliscor**: Poison Heal | Cherubi's Morning Sun (+1 line), Ducklett's Roost (+1 line), Nidoran♀'s Poison Point (+1 line) +11 | [1] Apply 1 Sap. Gain 3 block. Heal 4 HP. | [1] Sandstorm 2. Evasion 1. |
| **Nidoqueen**: Superpower | Stantler's Psyshield Bash, Krabby's Vice Grip, Wooper's Mud Shot +16 | [2] Deal 15 damage. Gain 6 block. | [2] Deal 16 damage. If the enemy is Vulnerable: Gain 6 block. |
| **Nidoking**: Thrash | Bagon's Outrage, Vespiquen's Attack Order, Gyarados's Thrash (+1 line) | [2] Deal 6 damage 3 times. Your hits deal +1 all fight. | [2] Deal 7 damage 3 times. If the enemy is Vulnerable: Your hits deal +1 all fight. |
| **Gible**: Dragon Rush | Hoppip's Acrobatics, Sandile's Thief, Blitzle's Volt Switch +16 | [2] Deal 16 damage. Draw 1 card. | [1] Deal 8 damage. In Sandstorm: Evasion 1. |
| **Gabite**: Dual Chop | Wingull's Air Cutter, Petal Storm, Weavile's Night Slash +3 | [1] Deal 5 damage 2 times. Apply 1 Vulnerable. | [1] Deal 5 damage 2 times. If you have Evasion: It hits once more. |
| **Flygon**: Dragon Claw | Needle Arm | [1] Deal 6 damage 2 times. Exhaust. | [1] Deal 5 damage 2 times. Evasion 1. |
| **Garchomp**: Dual Chop | Wingull's Air Cutter, Gabite's Dual Chop, Weavile's Night Slash +3 | [1] Deal 6 damage 2 times. Apply 1 Vulnerable. | [1] Deal 6 damage 2 times. In Sandstorm: It hits once more. |
| **Rhyperior**: Rock Wrecker | Rhyhorn's Horn Drill, Dugtrio's Sucker Punch | [2] Deal 22 damage. Exhaust. | [2] Deal 18 damage. Fault 4. Exhaust. |

### Windy Cliffs (27)

| Pokémon | Read like | Before | Now |
|---|---|---|---|
| **Pidgey**: Wing Attack | Pansage's Bullet Seed, Gligar's Acrobatics, Drilbur's Drill Run +6 | [1] Deal 4 damage 2 times. Draw 1 card. | [1] Deal 4 damage 2 times. In Tailwind: Draw 2 cards. |
| **Pidove**: Pluck | Absorb, Lickitung's Wring Out, Parasect's Leech Life +5 | [1] Deal 7 damage. Heal 2 HP. | [1] Deal 6 damage. Unburden: Heal 3 HP. |
| **Hoothoot**: Foresight | Bonsly's Fake Tears (+1 line), Chingling's Uproar Chime | [0] Apply 2 Vulnerable. Draw 1 card. Exhaust. | [0] Apply 2 Vulnerable. If the enemy is Vulnerable: Draw 2 cards. Exhaust. |
| **Wingull**: Air Cutter | Petal Storm, Gabite's Dual Chop, Weavile's Night Slash +3 | [1] Deal 3 damage 2 times. Apply 1 Vulnerable. | [1] Deal 4 damage 2 times. If the enemy is Weak: Evasion 1. |
| **Ducklett**: Roost | Cherubi's Morning Sun, Leaf Guard, Combee's Honey Gather (+1 line) +12 | [1] Gain 4 block. Heal 6 HP. | [1] Tailwind 1. Heal 5 HP. |
| **Spearow**: Drill Peck | Rattata's Hyper Fang, Zangoose's Crush Claw, Growlithe's Crunch +25 | [1] Deal 8 damage. Apply 2 Vulnerable. | [1] Deal 10 damage. In Tailwind: Apply 2 Vulnerable. |
| **Doduo**: Tri Attack | Stunfisk's Discharge, Larvitar's Rock Slide, Petal Blizzard (+1 line) +9 | [2] Deal 5 damage 3 times. Apply 1 Weak. | [1] Deal 4 damage. Burn 1. Static 1. Frostbite 1. |
| **Taillow**: Aerial Ace | Heracross's Megahorn, Ember, Vine Whip +8 | [1] Deal 9 damage. | [1] Deal 7 damage. If you've lost HP this turn: Evasion 1. |
| **Pelipper**: Tailwind | Eevee's Baton Pass, Koffing's Haze (+1 line), Larvesta's Quiver Dance (+1 line) +16 | [1] Gain 4 block. Draw 2 cards. | [1] Gain 3 Tide. In Tailwind: Draw 2 cards. |
| **Swanna**: Brave Bird | Bouffalant's Head Charge, Pineco's Self-Destruct (+1 line), Pinsir's Submission +17 | [1] Lose 4 HP. Deal 12 damage. | [1] Deal 9 damage. If you have Evasion: Gain 2 Tide. |
| **Swablu**: Sing (was Round) | Cherubi's Morning Sun, Ducklett's Roost, Combee's Honey Gather (+1 line) +12 | [1] Gain 5 block. Heal 3 HP. | [1] The enemy's attacks deal 3 less this turn. Heal 3 HP. |
| **Archen**: Head Smash | Bouffalant's Head Charge, Pineco's Self-Destruct (+1 line), Pinsir's Submission +17 | [1] Lose 3 HP. Deal 12 damage. | [1] Deal 6 damage. Unburden: +3 damage. Evasion 1. |
| **Pidgeotto**: Twister | Stunfisk's Discharge, Larvitar's Rock Slide, Doduo's Tri Attack +11 | [1] Deal 3 damage 2 times. Apply 1 Weak. | [1] Deal 3 damage 2 times. Unburden: Tailwind 1. |
| **Tranquill**: Facade | Spiritomb's Grudge, Vanillite's Avalanche, Purrloin's Assurance +5 | [1] Deal 5 damage. If you've lost HP this turn: +6 damage. | [1] Deal 5 damage. If you've lost HP this turn: It hits once more. |
| **Skarmory**: Steel Wing | Stantler's Psyshield Bash (+1 line), Krabby's Vice Grip (+1 line), Wooper's Mud Shot (+1 line) +3 | [1] Deal 6 damage. Gain 6 block. Exhaust. | [1] Deal 6 damage. If you have Evasion: Gain 6 block. |
| **Pidgeot**: Hurricane | Stunfisk's Discharge, Larvitar's Rock Slide, Doduo's Tri Attack +9 | [2] Deal 7 damage 2 times. Apply 1 Weak. | [2] Deal 7 damage 2 times. In Tailwind: Apply 2 Weak. |
| **Staravia**: Brave Bird | Bouffalant's Head Charge, Pinsir's Submission, Basculin's Reckless +19 | [2] Lose 4 HP. Deal 17 damage. | [2] Deal 14 damage. In Tailwind: It hits once more. |
| **Swellow**: Quick Guard | Wigglytuff's Defense Curl, Nosepass's Rock Polish (+1 line), Abra's Teleport | [0] Gain 2 block. Draw 2 cards. Exhaust. | [1] Block the enemy's next attack completely. Draw 1 card. Exhaust. |
| **Unfezant**: Sky Attack | Rattata's Hyper Fang, Zangoose's Crush Claw, Growlithe's Crunch +22 | [2] Deal 16 damage. Apply 2 Vulnerable. | [2] Deal 18 damage. If the enemy intends to attack: Evasion 1. |
| **Altaria**: Cotton Cloud | Cherubi's Morning Sun, Ducklett's Roost, Combee's Honey Gather (+1 line) +12 | [1] Gain 8 block. Heal 2 HP. | [1] Gain 7 block. If you've healed this turn: Evasion 1. |
| **Archeops**: Acrobatics | Quick Attack, Electrode's Swift | [1] Deal 3 damage 3 times. Innate. | [1] Deal 3 damage 3 times. +1 energy next turn. Innate. |
| **Fearow**: Drill Run | Teddiursa's Slash (+1 line), Machop's Karate Chop (+1 line), Riolu's Aura Sphere +8 | [1] Deal 9 damage. Your next attack deals +3 damage. | [1] Deal 9 damage. In Tailwind: Your next attack deals +5 damage. |
| **Dodrio**: Triple Peck | Wingull's Air Cutter, Gabite's Dual Chop, Weavile's Night Slash +3 | [1] Deal 3 damage 3 times. Apply 1 Vulnerable. | [1] Deal 3 damage 3 times. If you have Evasion: Apply 1 Vulnerable. |
| **Staraptor**: Brave Bird | Bouffalant's Head Charge, Pinsir's Submission, Basculin's Reckless +19 | [2] Lose 5 HP. Deal 19 damage. | [2] Lose 4 HP. Deal 18 damage. Evasion 1. |
| **Rufflet**: Crush Claw | Growlithe's Crunch (+1 line), Tentacool's Acid Spray (+1 line), Sandile's Thief (+1 line) +9 | [1] Deal 7 damage. Apply 1 Vulnerable. Draw 1 card. | [1] Deal 10 damage. If you have Evasion: Draw 1 card. |
| **Aerodactyl**: Ancient Power | Leaf Blade, Thunder Punch (+1 line), Togepi's Ancient Power (+1 line) +6 | [1] Deal 6 damage. Your hits deal +1 all fight. | [1] Deal 7 damage. Unburden: Your hits deal +1 all fight. |
| **Togetic**: Wish | Illumise's Wish (+1 line), Cleffa's Wish | [1] Next turn, gain 6 block. Heal 5 HP. Exhaust. | [1] Heal 5 HP. If the enemy intends to attack: Next turn, gain 5 block. |

### Night Alley (21)

| Pokémon | Read like | Before | Now |
|---|---|---|---|
| **Sandile**: Thief | Teddiursa's Slash (+1 line), Hoppip's Acrobatics, Ponyta's Flame Charge (+1 line) +19 | [1] Deal 8 damage. Draw 1 card. | [1] Deal 8 damage. Unburden: Steal 1. |
| **Murkrow**: Pursuit | Poliwag's Wake-Up Slap, Magical Leaf | [1] Deal 6 damage. If the enemy is Weak: +5 damage. | [1] Deal 5 damage. If the enemy is Weak: +4 damage. Steal 1. |
| **Stunky**: Smokescreen | Cottonee's Cotton Spore, Koffing's Haze (+1 line), Numel's Yawn +24 | [1] Apply 2 Weak. Gain 4 block. | [1] Apply 2 Sap. Disguise. |
| **Poochyena**: Howl | Gulpin's Stockpile, Shuckle's Power Trick, Gurdurr's Bulk Up +3 | [0] Gain 2 block. Your hits deal +1 all fight. Exhaust. | [0] Steal 1. Your hits deal +1 all fight. Exhaust. |
| **Purrloin**: Assurance | Spiritomb's Grudge, Vanillite's Avalanche, Temper Flare +5 | [1] Deal 5 damage. If you've lost HP this turn: +5 damage. | [1] Deal 5 damage. If the enemy attacked you last turn: Steal 1. |
| **Houndoom**: Foul Play | Vulpix's Weather Ball (+1 line), Growlithe's Crunch (+1 line), Magmar's Smog (+1 line) +9 | [1] Deal 5 damage. Burn 2. Apply 1 Vulnerable. | [1] Deal 7 damage. If the enemy has strength or block: Burn 3. |
| **Krokorok**: Swagger | Rattata's Hyper Fang, Zangoose's Crush Claw, Growlithe's Crunch +25 | [1] Deal 7 damage. Apply 1 Vulnerable. | [1] Deal 6 damage. If the enemy is Vulnerable: Steal 1. |
| **Krookodile**: Crunch | Drifloon's Ominous Wind (+1 line), Joltik's Electroweb (+1 line), Spore (+1 line) +2 | [1] Deal 8 damage. Apply 1 Weak. Apply 1 Vulnerable. Exhaust. | [2] Deal 17 damage. If the enemy has strength or block: Apply 1 Vulnerable. Steal 1. |
| **Mightyena**: Howl | Heatmor's Hone Claws, Dratini's Dragon Dance (+1 line), Feebas's Beautify (+1 line) +2 | [1] Your hits deal +1 all fight. Draw 2 cards. Exhaust. | [1] The enemy's attacks deal 3 less this turn. Your hits deal +1 all fight. Exhaust. |
| **Liepard**: Fake Tears | Cottonee's Cotton Spore (+1 line), Numel's Yawn (+1 line), Hippopotas's Sandstorm +7 | [1] Apply 1 Weak. Apply 2 Vulnerable. Gain 3 block. | [1] Apply 2 Vulnerable. Disguise. |
| **Vullaby**: Bone Nest | Cottonee's Cotton Spore (+1 line), Petilil's Sleep Powder (+1 line), Numel's Yawn (+1 line) +11 | [1] Apply 1 Weak. Apply 1 Sap. Gain 7 block. | [1] Gain 8 block. If the enemy has strength or block: Apply 2 Sap. |
| **Pawniard**: Metal Claw | Aerodactyl's Ancient Power, Togepi's Ancient Power (+1 line), Beautifly's Silver Wind (+1 line) +6 | [1] Deal 7 damage. Your hits deal +1 all fight. | [1] Deal 7 damage. If the enemy intends to attack: Your hits deal +1 all fight. |
| **Deino**: Dragon Breath | Zigzagoon's Headbutt (+1 line), Oddish's Acid (+1 line), Tangela's Constrict (+1 line) +16 | [1] Deal 6 damage. Apply 1 Weak. Apply 2 Sap. | [1] Deal 7 damage. If the enemy intends to attack: +3 damage. Apply 1 Sap. |
| **Zweilous**: Double Hit | Petilil's Sleep Powder (+1 line), Stunfisk's Discharge (+1 line), Skorupi's Toxic Spikes (+1 line) +9 | [1] Deal 5 damage 2 times. Apply 1 Weak. Apply 1 Sap. | [1] Deal 6 damage 2 times. If the enemy intends to attack: Apply 1 Weak. |
| **Absol**: Razor Wind | Sentret's Fury Swipes, Cinccino's Tail Slap, Paras's X-Scissor +5 | [2] Deal 7 damage 3 times. | [2] Deal 6 damage 3 times. Disguise. |
| **Zorua**: Night Daze | Zigzagoon's Headbutt, Psyduck's Zen Headbutt, Shellos's Mud-Slap +41 | [1] Deal 7 damage. Apply 1 Weak. | [1] Disguise. Choose a card in your hand. Add a copy of it to your hand. Exhaust. |
| **Zoroark**: Night Daze | Rattata's Hyper Fang (+1 line), Zangoose's Crush Claw (+1 line), Psyduck's Zen Headbutt (+1 line) +14 | [2] Deal 12 damage. Apply 1 Weak. Apply 1 Vulnerable. | [2] Deal 14 damage. If you're Disguised: Apply 2 Weak. |
| **Umbreon**: Moonlight | Cherubi's Morning Sun, Ducklett's Roost, Combee's Honey Gather (+1 line) +12 | [1] Gain 7 block. Heal 4 HP. | [1] Heal 5 HP. If the enemy intends to attack: Gain 6 block. |
| **Mandibuzz**: Foul Play | Zigzagoon's Headbutt (+1 line), Oddish's Acid (+1 line), Tangela's Constrict (+1 line) +16 | [1] Deal 6 damage. Apply 2 Weak. Apply 1 Sap. | [1] Deal 8 damage. If the enemy has strength or block: Apply 1 Weak. Steal 1. |
| **Bisharp**: Swords Dance | Lillipup's Work Up (+1 line), Gulpin's Stockpile, Shuckle's Power Trick +9 | [1] Gain 3 block. Your hits deal +3 all fight. Exhaust. | [1] Your hits deal +2 all fight. If the enemy intends to attack: Gain 6 block. Exhaust. |
| **Hydreigon**: Dark Pulse | Stunfisk's Discharge, Larvitar's Rock Slide, Doduo's Tri Attack +9 | [2] Deal 6 damage 3 times. Apply 1 Weak. | [2] Deal 6 damage 3 times. If the enemy is Weak: Steal 1. |
