# Card twins: the 2026-10-26 pass

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
- **Safari signature cards** (514, one per Safari Pokémon, one copy a run, caught one at a time) are outside this pass.
  The pass took the ones that read like a card their run meets from 200 to 170 (439 pairs to 174), and none reads
  exactly like one (`tests/safarimons.test.mjs`). The roadmap's Ideas has the question of doing them too.
- **Kenmatta's dojo trials** keep the cards they were built on: `DOJO_CARDS` in `js/data/cards.js` holds the 15 changed
  cards as they were (`dojo-<id>`, same names and art, never in a run), and `tools/dojo-solve.mjs` finds every trial's
  answers exactly as before.

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
| **Circle Throw** uncommon | Vital Throw, Wide Guard, Seismic Toss | [2] Gain 12 block. Counter 6. | [2] Gain 10 block. If the enemy attacked you last turn: Counter 8. |
| **Wide Guard** evolution 1 | Vital Throw, Circle Throw, Seismic Toss | [1] Gain 10 block. Counter 5. | [1] Counter 6. Next turn, gain 8 block. |
| **Seismic Toss** evolution 2 | Vital Throw, Circle Throw, Wide Guard | [1] Gain 12 block. Counter 12. | [1] Counter 12. Draw 1 card. |
| **Submission** evolution 1 | Close Combat, Meteor Assault | [1] Deal 16 damage. Add a Sore to your hand. | [1] Deal 9 damage 2 times. Add a Sore to your hand. |
| **Meteor Assault** rare | Close Combat, Hammer Arm (+1 line), Submission | [2] Deal 26 damage. Add 2 Sores to your hand. | [2] Deal 22 damage. +4 for each status card in your hand. Add 2 Sores to your hand. |
| **Brace** uncommon | No Retreat (+1 line), Parry (+1 line) | [1] Gain 10 block. Add a Sore to your hand. Follow-up (attack): Draw 1 card. | [1] Next turn, gain 11 block. Follow-up (attack): Draw 1 card. |
| **Scrappy** uncommon | No Retreat (+1 line), Rage Powder (+1 line) | [1] Apply 1 Weak. Gain 8 block. Add a Sore to your hand. | [1] Apply 2 Weak. Gain 1 energy. Add a Sore to your hand. |
| **Dynamic Punch** evolution 2 | Reversal | [2] Deal 24 damage. +4 for each status card in your hand. | [2] Deal 22 damage. Apply 2 Vulnerable. Add a Sore to your hand. |
| **Sacred Sword** rare | Low Sweep, Wood Hammer (+1 line), Muddy Water (+1 line), Scald (+1 line) +3 | [2] Deal 14 damage. Apply 2 Weak. Follow-up (skill): Gain 12 block. | [2] Deal 18 damage. Follow-up (skill): Gain 12 block. |
| **Iron Will** uncommon | Grit | [2] Gain 10 block. +4 block for each status card in your hand. | [2] Gain 12 block. +3 Counter for each status card in your hand. |
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
