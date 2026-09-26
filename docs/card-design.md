# Card design: the StS feel (roadmap step 6c)

**Status: approved (2026-09-26).** The user asked Claude to settle the open questions by whatever is closest to
StS (see Decisions at the end). Built so far: the engine pieces marked **(engine: done)**, the three Abilities, and **Fire's whole pool**
(6c.3, see its section). Each type's cards get built in their own session: Water next, then Grass.

The goal (the user's words): "I really want the StS feel... different builds, even if it means 70+ cards".
There are only three characters, Fire, Grass and Water; every other starter stays a skin sharing its
type's deck and Ability.

## Ground rules

- **Every card is modelled on a Slay the Spire 1 card** at StS numbers x~1.2 (Strike 6 -> 7, Defend 5 -> 6),
  keeping StS's price per energy. The "StS" column names the model.
- **No card id is ever removed** (a saved run holding it would be thrown away). Existing cards are marked ★;
  "now:" shows a proposed rework. Names can change freely, ids can't.
- **~70 cards per type**: ~20 common, ~25 uncommon, ~15 rare in the reward pool, plus the 8 evolution cards.
  StS gives each character ~75.
- **3 archetypes per type**, each with ~6 commons, ~8 uncommons and ~5 rares, so a build can come together
  by the second biome. A few cards per type are general (no archetype) and some bridge two archetypes on
  purpose, which is where the fun combos are.
- **~20 Neutral cards** any type can find: cross-type tools, not filler.
- Numbers below are rough (the bot and the playtests settle them). Cost `X` means an X-cost card.
- Every card also gets an **upgrade** (PP Up at the Pokémon Center, see Mechanics). Unless a card says
  otherwise, the default rule applies.

## The archetypes

The roadmap's proposals, with two changes and why.

| Type | Archetype | Plays like | StS roots |
|---|---|---|---|
| Fire | **Burn** | stack Burn on the enemy, then double it or hit per stack | Silent's poison (Catalyst, Bane, Noxious Fumes) |
| Fire | **Reckless** | lose HP to hit harder; payoffs for being low or getting hurt | Ironclad's self-damage (Hemokinesis, Rupture, Offering, Reaper) |
| Fire | **Kindling** *(was Momentum)* | burn up your own cards for fuel: exhaust them, spit out 0-cost Cinders, play lots of cards a turn | Ironclad's exhaust (Feel No Pain, Dark Embrace, Fiend Fire, Corruption) + Silent's Shivs |
| Grass | **Growth** | strength that snowballs over a long fight | Ironclad's strength (Inflame, Demon Form, Limit Break, Heavy Blade) |
| Grass | **Drain** *(was Sustain)* | Leech Seed and healing; healing past full HP becomes block | Reaper, Feed, poison-as-healing |
| Grass | **Spores** | pile debuffs on the enemy (Weak, Vulnerable, Sap) and get paid per debuff | Silent's debuffs (Malaise, Sadistic Nature, Leg Sweep) |
| Water | **Tsunami** | build Tide, cash it in with one big wave | Watcher's Mantra / Brilliance, Perfected Strike |
| Water | **Shell** | block that stays (Shell Armor) and turns into damage (Razor Shell) | Ironclad's block (Barricade, Entrench, Body Slam, Juggernaut) |
| Water | **Flow** | draw, discard for value, retain the right cards | Silent's discard (Acrobatics, Reflex, Tactician), Watcher's retain |

Why the changes:
- **Fire: Kindling instead of Momentum.** Momentum ("cheap attacks, energy, many cards a turn") overlapped
  Water's Flow (both are "play lots of cards"). Exhaust fits Fire: you burn your own cards for power, and it
  gives Fire a way to thin a bloated deck mid-fight, which is what it lacks late (its deaths are biome-3
  bosses). Momentum's best bits live on inside Kindling: Cinders are free cards, so "cards played this turn"
  payoffs (Searing Shot, Sizzly Slide, Torch Song) belong here.
- **Grass: Drain instead of plain Sustain.** Plain healing is weak in StS-style games (the bot measured it:
  healing only matters when you're hurt). Drain gives it teeth: **Leech Seed** is Grass's own poison (the
  enemy loses HP and *you* heal), and **Chlorophyll** turns overhealing into block, so healing is never wasted.
- **Water: Tide becomes Water's shared resource**, not just one archetype. Tsunami spends it on damage, Shell
  can spend it on block (Tidal Wall), and Flow builds it by discarding (Undertow). So the Ability (Torrent,
  below) helps every Water build, the way StS's starter relics help any build.

## Starter Abilities (StS's starter relics)

Every skin of a type shares its Ability. It isn't a relic in the save: it comes from the starter's type, so
it can't be lost or swapped and old saves pick it up for free. It shows at the top of the Bag's Relics pocket.

| Type | Ability | Effect | StS model | Why |
|---|---|---|---|---|
| Fire | **Blaze** | While your HP is below half, your attacks deal +3 damage. | (the games' Blaze) | Aggressive like the games' Blaze; the payoff for Reckless, and a comeback for everyone. |
| Grass | **Overgrow** | After each fight you win, heal 3 HP. | Burning Blood (6 of 80 HP) | Grass regrows; steady value for any Grass build. (5 HP was worth +10 to +22 points in the bot, far more than the others.) |
| Water | **Torrent** | Start each fight with 2 Tide. | Pure Water / Ring of the Snake | Tide is Water's resource, so every build starts a wave ahead. |

The rare power card `blaze` ("+6 on attacks below half HP") is renamed **Solar Power** so it doesn't share the
Ability's name (done in 6c.2; same id).

## New mechanics

**(engine: done)** = built in step 6c.2, ready for the card sessions. The rest get built with their type.

| Mechanic | What it does | Card data | StS |
|---|---|---|---|
| Upgrades **(engine: done)** | Pokémon Center's third choice, **PP Up**: upgrade one card for the run. Upgraded cards show a `+` (Ember+) and save as `id+`. | `upgrade: { effects, cost, ... }`, or the default rule | Smith |
| Exhaust triggers **(engine: done)** | exhaust cards from your hand; do something when a card exhausts, or when *this* card is exhausted | `exhaustPick: N`, `onExhaust: {...}`, powers `exhaustBlock`, `exhaustDraw` | True Grit, Sentinel, Feel No Pain, Dark Embrace |
| Discard triggers **(engine: done)** | discard cards from your hand by choice; cards that act when discarded; per-discard payoffs | `discard: N`, `onDiscard: {...}`, powers `discardTide`, `discardBlock`, `perDiscard: N` | Acrobatics, Reflex, Tactician, Eviscerate |
| Cards that make cards **(engine: done)** | put new cards into your hand / draw pile / discard pile for this fight only | `addCard: { id, n, to }` | Blade Dance, Anger, Wild Strike |
| X cost **(engine: done)** | spend all your PP; the card scales with it | `cost: 'X'`, `perX: {...}` | Whirlwind, Malaise |
| Cards played this turn **(engine: done)** | payoffs for playing many cards | `perPlayed: N`, `perAttack: N`, `combo: { at, ... }`, powers `cardDamage`, `cardBlock` | Finisher, A Thousand Cuts, After Image |
| Keywords **(engine: done)** | **Unplayable**, **Ethereal** (exhausts if still in hand at end of turn), **Innate** (always in your first hand), **Retain** (existing) | `unplayable`, `ethereal`, `innate` | same |
| Status cards **(engine: done)** | junk enemies shuffle into your deck, fight-only | enemy move `adds: { card, n, to }` or `kind: 'status'` | Dazed, Wound, Burn, Slimed |
| Starter Abilities **(engine: done)** | see above | `ABILITIES` in `js/data/relics.js` | starter relics |
| Tokens **(engine: done)** | fight-only cards made by other cards: never offered, not in the Card index | `TOKEN_CARDS` in `js/data/cards.js` | Shiv |
| Leech Seed (Grass) | enemy debuff: at the start of its turn it loses N HP, you heal N, then N drops by 1 | `seed: N` | poison + Reaper |
| Sap (Grass) | the enemy loses strength (can go negative) | `sap: N` | Disarm, Malaise |
| Overheal (Grass) | power: healing past max HP becomes block | power `overheal` | — |
| Temporary strength (Grass) | strength that goes away at end of turn | `flex: N` | Flex |
| Burn multipliers (Fire) **(done in 6c.3)** | double/triple the enemy's Burn; Burn N several times; +N to every Burn you apply; "if the enemy is Burned" | `burnMult: N`, `burnTimes`, power `drought`, `ifBurned: { bonus, ... }` | Catalyst, Bouncing Flask, Envenom, Bane |
| Hurt this turn (Fire) **(done in 6c.3)** | "if you lost HP this turn"; cheaper per HP loss this fight; gain strength when a card hurts you; lose HP at the start/end of your turn | `ifHurt: { bonus, ... }`, `costDownOnHurt`, powers `rupture`, `combust`, `brutality` | Blood for Blood, Rupture, Combust, Brutality |
| Exhaust your hand (Fire) **(done in 6c.3)** | exhaust all (or all non-attacks); scale with how many; non-attacks free but exhausting; play the top card; take one back | `exhaustHand: 'all' / 'skills'`, `perExhausted`, `hitsPerExhausted`, `blockPerExhausted`, power `corruption`, `playTop`, `exhume`, powers `exhaustBurn`, `cinderDamage` | Fiend Fire, Second Wind, Corruption, Havoc, Exhume |
| Tide multipliers (Water) | double your Tide; gain extra Tide whenever you gain Tide | `tideMult`, power `drizzle` | — |
| Block tricks (Water) | double your block; deal damage whenever you gain block; keep block once | `blockMult`, power `blockDamage`, `blur` | Entrench, Juggernaut, Blur |
| Retain tricks (Water) | a card that grows while retained; keep N extra cards at end of turn; draw until N | `growOnRetain`, power `retainN`, `drawTo: N` | Windmill Strike, Well-Laid Plans, Expertise |

**Default upgrade** (a card without its own `upgrade`): +3 damage (+2 per hit on 2-hit cards, +1 on 3+ hits) and
+3 block; if it has neither, +3 heal; else +1 of its first status (Burn +2, Weak, Vulnerable, Tide, focus +3,
strength, draw); powers +1 on their number (thorns +2, Solar Power +3), or -1 cost if they have no number;
anything else costs 1 less, or loses Exhaust if it's already free. The card sessions give most cards a
hand-picked upgrade instead, like StS (Bash: +2 Vulnerable, Inflame: +1 strength, Barricade: cost 2 -> 1).

## Fire (Charmander): Burn, Reckless, Kindling

**Built (6c.3, 2026-09-26).** Everything below is in `js/data/cards.js` with its StS model in a comment and a
hand-picked `upgrade`. Changes made while building it:
- **6 bridge uncommons** were added (StS's 20/36/16 split; marked *bridge* in the table): Blaze Kick (Burn/Reckless),
  Infernal Parade (Burn), Steam Engine (Burn/Kindling), Fiery Wrath (Reckless/Kindling), Armor Cannon and Heatproof
  (Ethereal, so they feed Kindling's exhaust payoffs). Uncommons: 32.
- Burning Jealousy costs 2 like Fiend Fire (the skeleton said 1); Searing Shot counts itself (5 per attack).
- Fire Blast costs 2 (Burn 8, Vulnerable 2): at 3 PP with no damage it was a dead evolution pick.
- Bitter Blade heals what gets through (single target, so 12 damage).
- Flare Boost's upgrade makes it Innate; Rage+ adds a Rage+.

Tokens: **Cinder** (0: deal 4, Exhaust; Shiv). Status it makes itself: Paralysis (Wild Strike's Wound).

| Card | Rarity | Cost | Effect | Arch | StS |
|---|---|---|---|---|---|
| ★Ember | C | 1 | Deal 7 | — | Strike |
| ★Flame Wall | C | 1 | Block 8 | — | Defend |
| ★Scorch | C | 2 | Deal 10, Vulnerable 2 | — | Bash |
| ★Will-O-Wisp | C | 1 | Burn 4, Weak 2 | Burn | Deadly Poison |
| ★Mystical Fire | C | 1 | Deal 6, Weak 1 | — | Sucker Punch |
| ★Fire Punch | C | 1 | Deal 10, draw 1 | — | Pommel Strike |
| ★Flame Body | C | 1 | Block 8, Burn 2 | Burn | Iron Wave |
| ★Fire Spin | C | 1 | Deal 6, Burn 3 | Burn | Poisoned Stab |
| Flame Burst | C | 2 | Burn 3, three times | Burn | Bouncing Flask |
| Scorching Sands | C | 1 | Deal 8; if the enemy is Burned, Vulnerable 1 | Burn | Bane-lite |
| ★Heat Up | C | 1 | +1 strength, next attack +4 | Reckless | Inflame (half) |
| ★Flare Up | C | 2 | Deal 15, +8 if HP below half | Reckless | Perfected Strike (low-HP) |
| Fiery Dance | C | 0 | Lose 3 HP, gain 2 PP | Reckless | Bloodletting |
| Heat Crash | C | 1 | Deal 14; shuffle a Paralysis into your draw pile | Reckless | Wild Strike |
| ★Fire Lash | C | 1 | Deal 5 twice | Kindling | Twin Strike |
| Rage | C | 0 | Deal 6; add a copy of Rage to your discard pile | Kindling | Anger |
| Spark Shower | C | 1 | Add 3 Cinders to your hand | Kindling | Blade Dance |
| Cinder Cloak | C | 1 | Block 7, add a Cinder to your hand | Kindling | Cloak and Dagger |
| Kindle | C | 1 | Block 8; exhaust a card from your hand | Kindling | True Grit |
| Flare | C | 0 | Deal 4, Burn 1 | Kindling/Burn | Flying Knee (lite) |
| ★Inferno | U | 1 | Deal 7, +2 per Burn | Burn | Bane |
| ★Sunny Day | U | 1 | Power: Burn 2 at the start of each turn | Burn | Noxious Fumes |
| ★Heat Wave | U | 2 | Deal 5 three times, Burn 2 | Burn | Riddle with Holes |
| ★Burning Bulwark | U | 1 | Block 11, Burn 3 | Burn | Flame Barrier |
| Fan the Flames | U | 1 | Double the enemy's Burn. Exhaust | Burn | Catalyst |
| Ash Cloud | U | 2 | Burn 5, Weak 2. Exhaust | Burn | Crippling Cloud |
| Heat Haze | U | 1 | Block 7; +5 if the enemy is Burned | Burn | Dodge and Roll |
| ★Flare Blitz | U | 1 | Lose 2 HP, deal 17 | Reckless | Hemokinesis |
| Raging Fury | U | 1 | Power: whenever a card makes you lose HP, +1 strength | Reckless | Rupture |
| Temper Flare | U | 1 | Deal 10; double if you lost HP this turn | Reckless | Spot Weakness (attack) |
| Mind Blown | U | 4 | Deal 22; costs 1 less each time you lose HP this fight | Reckless | Blood for Blood |
| Eruption | U | 1 | Power: at the end of your turn, lose 1 HP and deal 6 | Reckless | Combust |
| Shell Trap | U | 1 | Block 18; add 2 Paralysis to your hand | Reckless | Power Through |
| ★Lava Plume | U | 2 | Deal 15, Weak 1, Vulnerable 1 | — | Uppercut |
| Ember Veil | U | 2 | Block 13, Weak 2 | — | Leg Sweep |
| Flash Fire | U | 2 | Power: whenever a card exhausts, draw 1 | Kindling | Dark Embrace |
| Fire Pledge | U | 1 | Power: whenever a card exhausts, block 4 | Kindling | Feel No Pain |
| Stoke | U | 1 | Exhaust a card from your hand, draw 2 | Kindling | Burning Pact |
| White Smoke | U | 1 | Exhaust every non-attack in your hand, block 6 each | Kindling | Second Wind |
| Magma Armor | U | 1 | Block 6; when exhausted, gain 2 PP | Kindling | Sentinel |
| Magma Storm | U | 2 | Deal 19; exhaust every non-attack in your hand | Kindling | Sever Soul |
| Searing Shot | U | 1 | Deal 5 for each attack played this turn (itself too) | Kindling | Finisher |
| Sizzly Slide | U | 1 | Deal 9. Combo 3: gain 1 PP | Kindling | Sneaky Strike |
| Hot Coals | U | 1 | Power: Cinders deal +4 | Kindling | Accuracy |
| Wildfire | U | 1 | Play the top card of your draw pile and exhaust it | Kindling | Havoc |
| ★Inferno Charge | U | 2 | Deal 9, +2 PP next turn *(now uncommon, was common)* | — | Outmaneuver (attack) |
| Infernal Parade *(bridge)* | U | 1 | Deal 8; +8 if the enemy is Burned | Burn | Bane |
| Blaze Kick *(bridge)* | U | 1 | Lose 2 HP, deal 9, Burn 4 | Burn/Reckless | Hemokinesis + Poisoned Stab |
| Steam Engine *(bridge)* | U | 1 | Power: whenever a card exhausts, Burn 2 | Burn/Kindling | Feel No Pain (Burn) |
| Fiery Wrath *(bridge)* | U | 0 | Lose 3 HP, add 2 Cinders to your hand | Reckless/Kindling | Bloodletting + Blade Dance |
| Armor Cannon *(bridge)* | U | 2 | Deal 24. Ethereal | Kindling | Carnage |
| Heatproof *(bridge)* | U | 1 | Block 12. Ethereal | Kindling | Ghostly Armor |
| ★Firestorm | R | 3 | Deal 36 | — | Bludgeon |
| ★Flame Blast | R | 2 | Deal 18, Burn 4 | Burn | Bane+ |
| Sacred Fire | R | 2 | Triple the enemy's Burn. Exhaust | Burn | Catalyst+ |
| Drought | R | 2 | Power: whenever you apply Burn, apply 2 more | Burn | Envenom |
| ★Solar Power *(was Blaze)* | R | 1 | Power: attacks +6 while HP is below half | Reckless | Berserk |
| Burn Up | R | 0 | Lose 6 HP, gain 2 PP, draw 3. Exhaust | Reckless | Offering |
| Bitter Blade | R | 2 | Deal 12, heal what gets through. Exhaust | Reckless | Reaper |
| Flare Boost | R | 0 | Power: at the start of your turn, lose 1 HP and draw 1 | Reckless | Brutality |
| V-create | R | 2 | Deal 26; shuffle a Poison into your discard pile | Reckless | Immolate |
| Burning Jealousy | R | 2 | Exhaust your hand; deal 8 per card exhausted. Exhaust | Kindling | Fiend Fire |
| Blue Flare | R | 3 | Power: your non-attacks cost 0 but exhaust | Kindling | Corruption |
| Torch Song | R | 2 | Power: whenever you play a card, deal 2 | Kindling | A Thousand Cuts |
| Pyro Ball | R | X | Deal 7, X times | Kindling | Whirlwind |
| Fusion Flare | R | 1 | Put a card from your exhaust pile into your hand. Exhaust | Kindling | Exhume |

Evolution cards (evo-only, 1 copy; small reworks so each tier has one per archetype):

| Card | Tier | Cost | Effect | Arch |
|---|---|---|---|---|
| ★Flame Charge | 1st | 1 | Deal 10, +1 PP next turn | Kindling |
| ★Fire Fang | 1st | 1 | Deal 8, Burn 3 | Burn |
| ★Flame Wheel | 1st | 2 | Deal 16 *(now: lose 2 HP, deal 20)* | Reckless |
| ★Incinerate | 1st | 2 | Deal 14, Weak 2 *(now: deal 14, exhaust a card from your hand, draw 1)* | Kindling |
| ★Flamethrower | final | 2 | Deal 22, Burn 3 | Burn |
| ★Fire Blast | final | 2 *(was 3)* | Deal 24, Burn 5 *(now: Burn 8, Vulnerable 2)* | Burn |
| ★Overheat | final | 3 | Deal 30, +12 if HP below half | Reckless |
| ★Blast Burn | final | 3 | Deal 34 *(now: deal 34, then exhaust your hand; +4 per card)* | Kindling |

Fire: 20 common, 32 uncommon (with the bridges), 14 rare, 8 evolution = **74**.

## Grass (Bulbasaur): Growth, Drain, Spores

Tokens: **Seedling** (0: heal 2, draw 1, Exhaust).

| Card | Rarity | Cost | Effect | Arch | StS |
|---|---|---|---|---|---|
| ★Vine Whip | C | 1 | Deal 7 | — | Strike |
| ★Cotton Guard | C | 1 | Block 8, Retain | — | Defend |
| ★Seed Bomb | C | 2 | Deal 10, Vulnerable 2 | — | Bash |
| ★Petal Dance | C | 1 | Deal 6, block 6 | — | Iron Wave |
| ★Razor Leaf | C | 2 | Deal 16 | — | Carnage (no Ethereal) |
| ★Growth | C | 1 | +1 strength, heal 3 | Growth | Inflame (half) |
| ★Bullet Seed | C | 1 | Deal 3 three times | Growth | Sword Boomerang |
| Rototiller | C | 0 | +3 strength this turn | Growth | Flex |
| Branch Poke | C | 0 | Deal 4 | Growth | Flying Knee |
| Wood Hammer | C | 2 | Deal 14, Weak 2 | Growth | Clothesline |
| ★Absorb | C | 1 | Deal 6, heal 3 | Drain | Reaper (lite) |
| ★Mega Drain | C | 2 | Deal 12, heal 6 | Drain | Reaper (lite) |
| Worry Seed | C | 1 | Leech Seed 4 | Drain | Deadly Poison |
| Snap Trap | C | 1 | Deal 5, Leech Seed 2 | Drain | Poisoned Stab |
| Leaf Guard | C | 1 | Block 7, heal 2 | Drain | Shrug It Off |
| Sprout | C | 1 | Shuffle 2 Seedlings into your draw pile | Drain | Blade Dance (tokens) |
| ★Stun Spore | C | 1 | Deal 6, Weak 1 | Spores | Sucker Punch |
| Magical Leaf | C | 1 | Deal 8; +4 if the enemy is Weak | Spores | Heel Hook |
| Sweet Scent | C | 1 | Sap 2. Exhaust | Spores | Disarm |
| Apple Acid | C | 1 | Deal 8, Vulnerable 1 | Spores | Trip + hit |
| ★Leaf Blade | U | 2 | Deal 10, +2 strength | Growth | Inflame + hit |
| ★Power Whip | U | 2 | Deal 14, strength counts 3x | Growth | Heavy Blade |
| Trailblaze | U | 1 | If the enemy intends to attack, +3 strength | Growth | Spot Weakness |
| Needle Arm | U | 1 | Deal 2 four times. Exhaust | Growth | Pummel |
| Horn Leech | U | 2 | Deal 10, heal 2 per strength | Growth/Drain | Reaper (strength) |
| Grass Pledge | U | 1 | Power: whenever you heal, +1 strength (once a turn) | Growth/Drain | Rupture (heals) |
| Spiky Shield | U | 2 | Power: when attacked, deal 4 back | — | Caltrops |
| ★Synthesis | U | 2 | Heal 14 | Drain | Bandage Up+ |
| ★Ingrain | U | 1 | Power: heal 3 at the start of each turn | Drain | Regen |
| Chlorophyll | U | 1 | Power: healing past your max HP becomes block | Drain | Feel No Pain (heals) |
| Strength Sap | U | 1 | Heal 2 per Leech Seed on the enemy. Exhaust | Drain | Bane (heals) |
| Grassy Glide | U | 1 | Block 8; +5 if you healed this turn | Drain | Dodge and Roll |
| Floral Healing | U | 1 | Heal 5, block 5 | Drain | — |
| Aromatherapy | U | 1 | Heal 4; exhaust every status card in your hand | Drain | Purity |
| Seed Flare | U | 2 | Deal 12, Leech Seed 5 | Drain/Spores | Bouncing Flask + hit |
| ★Sleep Powder | U | 1 | Weak 2, draw 1, Retain | Spores | Blind |
| Spore | U | 1 | Weak 2, Vulnerable 2. Exhaust | Spores | Crippling Cloud |
| Effect Spore | U | 1 | Power: whenever you apply a debuff, deal 4 | Spores | Sadistic Nature |
| Leaf Tornado | U | 1 | Deal 6, +4 per kind of debuff on the enemy | Spores | Bane (debuffs) |
| Rage Powder | U | 1 | Block 8, Weak 1 | Spores | Leg Sweep (lite) |
| Forest's Curse | U | 1 | Sap 1, Vulnerable 2 | Spores | Malaise (lite) |
| Powder | U | 1 | Power: at the start of your turn, Weak 1 | Spores | Noxious Fumes (Weak) |
| Trop Kick | U | 1 | Deal 9, Sap 1 | Spores | Disarm + hit |
| ★Solar Beam | R | 3 | Deal 36 | — | Bludgeon |
| ★Grassy Terrain | R | 3 | Power: +2 strength each turn | Growth | Demon Form |
| Growth Spurt | R | 1 | Double your strength. Exhaust | Growth | Limit Break |
| Solar Blade | R | 1 | Deal 5, strength counts 4x. Retain | Growth | Heavy Blade+ |
| Harvest | R | 1 | Power: whenever you gain strength, heal 2 | Growth/Drain | — |
| Jungle Healing | R | 2 | Deal 12; if it knocks the enemy out, +4 max HP. Exhaust | Drain | Feed |
| Grassy Surge | R | 3 | Power: Leech Seed no longer drops | Drain | — |
| Leech Life | R | 1 | Power: your attacks heal 1 | Drain | — |
| Nature's Madness | R | X | Sap X, Weak X. Exhaust | Spores | Malaise |
| Pollen Puff | R | 1 | Draw 1 per debuff kind on the enemy | Spores | Expertise (debuffs) |
| Sap Sipper | R | 1 | Power: whenever you apply Weak, block 4 | Spores | — |
| Petal Storm | R | 2 | Deal 4 five times, then Vulnerable 1 | Spores | Glass Knife |

Evolution cards:

| Card | Tier | Cost | Effect | Arch |
|---|---|---|---|---|
| ★Leech Seed | 1st | 1 | Deal 8, heal 5 *(now: Leech Seed 6, heal 3)* | Drain |
| ★Bulk Up | 1st | 1 | +2 strength, block 6 | Growth |
| ★Razor Storm | 1st | 2 | Deal 16 *(now: deal 3 six times)* | Growth |
| ★Poison Powder | 1st | 1 | Weak 2, heal 3 *(now: Weak 2, Sap 1)* | Spores |
| ★Giga Drain | final | 2 | Deal 20, heal 12 | Drain |
| ★Petal Blizzard | final | 2 | Deal 24 *(now: deal 12 twice, Vulnerable 2)* | Spores |
| ★Leaf Storm | final | 3 | Deal 26, block 8 | — |
| ★Frenzy Plant | final | 3 | Deal 34 *(now: strength counts 4x)* | Growth |

Grass: 20 common, 24 uncommon, 12 rare, 8 evolution = **64**. (Petal Storm and Harvest are the weakest
ideas here; easy to swap.)

## Water (Squirtle): Tsunami, Shell, Flow

Tokens: **Droplet** (0: deal 3, Tide 1, Exhaust). Discard-trigger cards: Ripple, Wellspring (real cards, not tokens).

| Card | Rarity | Cost | Effect | Arch | StS |
|---|---|---|---|---|---|
| ★Water Gun | C | 1 | Deal 7 | — | Strike |
| ★Withdraw | C | 1 | Block 6 | — | Defend |
| ★Bubble | C | 1 | Deal 5, Weak 1, Tide 1 | Tsunami | Sucker Punch |
| ★Dive | C | 1 | Block 9, draw 1, Tide 1 | Tsunami | Shrug It Off |
| ★Water Pulse | C | 1 | Deal 5, +2 per Tide (spends it). Retain | Tsunami | Windmill Strike |
| ★Rain Dance | C | 1 | Block 4, Tide 2 | Tsunami | Prostrate |
| ★Surf | C | 2 | Deal 12, Tide 2 | Tsunami | Wheel Kick |
| Soak | C | 1 | Vulnerable 2, Tide 1 | Tsunami | Trip |
| Water Sport | C | 0 | Tide 2. Exhaust | Tsunami | Pray |
| Snipe Shot | C | 1 | Deal 6, +1 per Tide (doesn't spend it) | Tsunami | Perfected Strike |
| ★Clamp | C | 2 | Deal 10, block 10 | Shell | Iron Wave x2 |
| ★Razor Shell | C | 1 | Deal damage equal to your block | Shell | Body Slam |
| Splash | C | 0 | Block 4 | Shell | Deflect |
| Shelter | C | 1 | Block 7; block 5 next turn | Shell | Dodge and Roll |
| Flip Turn | C | 1 | Deal 10, draw 1, discard 1 | Flow | Dagger Throw |
| Waterfall | C | 1 | Draw 3, discard 1 | Flow | Acrobatics |
| Aqua Step | C | 0 | Draw 1, discard 1 | Flow | Prepared |
| Mist | C | 1 | Block 10, discard 1 | Flow | Survivor |
| Chilling Water | C | 1 | Block 6, draw 2 | Flow | Backflip |
| Muddy Water | C | 2 | Deal 14, Weak 2 | — | Clothesline |
| ★Whirlpool | U | 1 | Deal 5, Weak 2 | — | Sucker Punch+ |
| ★Liquidation | U | 1 | Deal 8, Vulnerable 1 | — | Trip + hit |
| Rising Tide | U | 1 | Power: gain 1 Tide at the start of each turn | Tsunami | Devotion |
| Swift Swim | U | 0 | Double your Tide. Exhaust | Tsunami | Catalyst (Tide) |
| Crabhammer | U | 2 | Deal 12, +3 per Tide (spends it) | Tsunami | Wallop |
| Water Spout | U | X | Gain 2 Tide, X times | Tsunami | Tempest |
| ★Aqua Ring | U | 1 | Heal 3, block 6 | Shell | — |
| ★Mirror Coat | U | 1 | Power: when attacked, deal 4 back | Shell | Caltrops |
| ★Water Veil | U | 1 | Power: block 3 at the start of each turn | Shell | Metallicize |
| Tidal Wall | U | 1 | Block 4 per Tide (spends it) | Shell/Tsunami | — |
| Shell Smash | U | 2 | Double your block | Shell | Entrench |
| Aqua Tail | U | 1 | Block 7, then deal half your block | Shell | Iron Wave + Body Slam |
| Bubble Shield | U | 1 | Block 14. Ethereal | Shell | Ghostly Armor |
| ★Surging Strikes | U | 2 | Deal 5 three times | Flow | Riddle with Holes |
| Undertow | U | 1 | Power: whenever you discard a card, gain 1 Tide | Flow/Tsunami | — (discard payoff) |
| Ripple | U | — | Unplayable. When discarded, draw 2 | Flow | Reflex |
| Wellspring | U | — | Unplayable. When discarded, gain 1 PP | Flow | Tactician |
| Wash Away | U | 0 | Discard your hand, draw that many. Exhaust | Flow | Calculated Gamble |
| Triple Dive | U | 3 | Deal 7 three times; costs 1 less per card discarded this turn | Flow | Eviscerate |
| Still Waters | U | 1 | Power: keep 1 more card in hand at the end of your turn | Flow | Well-Laid Plans |
| Upwell | U | 1 | Draw until you have 6 cards | Flow | Expertise |
| Fishious Rend | U | 1 | Deal 10; if you discarded this turn, gain 2 PP | Flow | Sneaky Strike |
| Aqua Cutter | U | 1 | Deal 7, +3 each turn it's retained. Retain | Flow | Windmill Strike |
| ★Hydro Pump | R | 2 | Deal 10, +5 per Tide (spends it) | Tsunami | Ragnarok |
| Drizzle | R | 1 | Power: whenever you gain Tide, gain 1 more | Tsunami | — |
| Tsunami | R | 3 | Deal 8 per Tide gained this fight | Tsunami | Brilliance |
| ★Shell Armor | R | 2 | Power: block doesn't wear off | Shell | Barricade |
| Riptide | R | 2 | Power: whenever you gain block, deal 4 | Shell | Juggernaut |
| Iron Shell | R | 2 | Block 36. Exhaust | Shell | Impervious |
| ★Primordial Sea | R | 2 | Power: draw 1 and block 2 each turn | Flow | Tools of the Trade |
| Hydration | R | 1 | Power: whenever you play a card, block 1 | Flow | After Image |
| Water Shuriken | R | 1 | Discard your hand, add a Droplet per card | Flow | Storm of Steel |
| Life Dew | R | 1 | Retain. Heal 6; this card's heal grows by 2 each turn retained | Flow | Windmill (heal) |

Evolution cards:

| Card | Tier | Cost | Effect | Arch |
|---|---|---|---|---|
| ★Aqua Jet | 1st | 1 | Deal 10, block 4 *(now: deal 8, draw 1, discard 1)* | Flow |
| ★Bubble Beam | 1st | 1 | Deal 6, Weak 2 | — |
| ★Brine | 1st | 2 | Deal 8, +4 per Tide | Tsunami |
| ★Rain Shield | 1st | 1 | Block 10, heal 2 | Shell |
| ★Scald | final | 2 | Deal 20, Weak 2 | — |
| ★Wave Crash | final | 2 | Deal 24, block 6 *(now: deal damage equal to your block x1.5)* | Shell |
| ★Origin Pulse | final | 3 | Deal 26, Tide 3 | Tsunami |
| ★Hydro Cannon | final | 3 | Deal 34 *(now: Retain; +6 each turn retained)* | Flow |

Water: 20 common, 25 uncommon, 10 rare, 8 evolution = **63**.

## Neutral (~20)

Any type can be offered these. ★ = existing.

| Card | Rarity | Cost | Effect | StS |
|---|---|---|---|---|
| ★Tackle | C | 1 | Deal 7 | Strike |
| ★Block | C | 1 | Block 6 | Defend |
| ★Double Hit | C | 1 | Deal 5 twice | Twin Strike |
| ★Potion | C | 1 | Heal 10. Exhaust | Bandage Up |
| ★Smokescreen | C | 0 | Weak 2. Exhaust | Intimidate |
| ★Tailwind | C | 0 | +1 PP next turn | — |
| ★Quick Guard | C | 2 | Block the next attack completely | — |
| Quick Attack | C | 0 | Deal 4, draw 1 | Flash of Steel |
| Rapid Spin | C | 1 | Deal 6; exhaust every status card in your hand | Purity + hit |
| ★Iron Defense | U | 2 | Block 22. Exhaust | Impervious |
| ★Lucky Claw | U | 0 | Draw 2. Exhaust | Finesse |
| ★Swords Dance | U | 1 | +2 strength. Exhaust | Inflame |
| ★Agility | U | 0 | +1 PP, draw 2. Exhaust | Adrenaline |
| ★Leer | U | 0 | Vulnerable 2 | Trip |
| Double Team | U | 1 | Block 6; your block doesn't wear off next turn | Blur |
| Substitute | U | 1 | Lose 5 HP, block 16 | — |
| Mimic | U | 1 | Add a copy of a card in your hand | Dual Wield |
| Endure | U | 1 | You can't drop below 1 HP this turn. Exhaust | — |
| Metronome | R | 1 | Add a random card of your type to your hand; it costs 0 this turn. Exhaust | Jack of All Trades / Discovery |
| Hyper Beam | R | 2 | Deal 32; -2 PP next turn | — |
| Last Resort | R | 0 | Only playable when your draw pile is empty. Deal 50 | Grand Finale |

## Status cards (enemies' junk) **(engine: done)**

Fight-only, never in your run deck. Built now; no enemy uses them yet (step 9 gives them to enemies).

| Card | Effect | StS | Suggested users (step 9) |
|---|---|---|---|
| Confusion | Unplayable. Ethereal | Dazed | Psyduck, Slowpoke, Slowking (Confusion / Psybeam) |
| Paralysis | Unplayable | Wound | Stantler, Tauros (Body Slam, Stomp) |
| Poison | Unplayable. At the end of your turn, if it's in your hand, lose 2 HP | Burn | Oddish, Gloom, Seedot (Poison Powder, Acid) |
| Sludge | Costs 1. Exhaust (does nothing) | Slimed | Shellos, Tangela (Mud-Slap, Constrict) |

Enemy moves get `adds: { card, n, to }` (on an attack, it also hits) or `kind: 'status'` (the whole turn is
the junk). The intent bubble shows it; bosses that punish pure turtling (step 9) can shuffle Paralysis.

## Decisions (2026-09-26, "closest to StS")

1. **Archetypes stay as above** (Kindling, Drain, Tide for all of Water). Each maps onto a real StS archetype
   (Ironclad exhaust, poison-as-healing, Watcher's Mantra), which is the point.
2. **Abilities stay small and passive**, like StS's starter relics (Burning Blood, Ring of the Snake, Pure Water):
   Blaze +3 below half HP, Overgrow heal 3 after a win, Torrent 2 Tide at the start. No flashy triggers.
3. **Names stay.** Made-up ones (Kindle, Stoke, Hot Coals, Tidal Wall, Upwell) are fine; swap for a real move
   name if a type session finds a good one.
4. **Status cards stay**: Confusion (Dazed), Paralysis (Wound), Poison (Burn), Sludge (Slimed).
5. **Order: Fire, then Water, then Grass.** Fire trails late and uses the most new mechanics.
6. **The enemy damage bump (+1/+2/+3) stays**: StS's enemies are tuned for a player who upgrades at campfires.
7. **Pool size, StS's split.** StS's Ironclad has 20 commons, 36 uncommons and 16 rares (plus basics). Our
   skeletons have ~20 / ~25 / ~12-14: each type session tops the uncommons up (+6 to +10, mostly bridge cards
   between two archetypes) so each type lands at ~72 cards with the evolution cards.
8. **Upgrades for every card are hand-picked in the type sessions** (StS-style: Bash +2 Vulnerable, Barricade
   2 -> 1 cost), written as each card's `upgrade`; the default rule is only a fallback.
9. **More StS rules for step 6c.9** (not the type sessions): upgraded cards among rewards later in a run
   (StS: none in Act 1, 25% in Act 2, 50% in Act 3 at A0), and one rare-card pity counter like StS's
   (each common offered raises the rare chance a little until a rare shows).
