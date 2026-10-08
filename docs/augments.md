# Sky Pillar augments - the plan

The user's call (2026-10-07): the Sky Pillar gets its own run-changing **augments**, picked one of three like League's
Arena / ARAM Mayhem or a roguelike's boons, and "a SHIT TON of them" so every climb plays differently. Roadmap item 21.
All of it is built (parts a-c, 2026-10-07): 113 augments, 10 trade-offs, 6 sets, 6 augment badges. `js/data/augments.js` is
the source of truth for names and numbers; the tables below are the first list, with what changed noted under
"Part c's calls".

## Rules

- **No Game Corner perks in the tower at all**, leaderboard climb, replays and Practice alike (Max HP Boost, Starting
  Relic Charm, Move Tutor Notes, Mart Card, Bag Pocket, Coin Finder, Scout Report...). Today only the week's first try
  skips them (`fairTry()` in `js/run.js`); make every `isTower()` run skip them. Normal biome runs keep them all.
- **Picks**: one of three before floor 1, then one of three after every guardian (floors 10-90): up to 10 a climb.
- **Tiers by height**: floors 1-30 Silver, 40-60 Gold, 70-90 Prismatic (the start's pick is Silver). A small seeded
  chance (~10%) of an offer one tier up, Arena's surprise.
- **Rerolls**: 1 a climb (maybe +1 from an augment). A reroll swaps all three.
- **The leaderboard stays even**: every offer and reroll comes from the week's seed (`js/rng.js`, a stream per pick,
  e.g. `aug:<floor>` and `aug:<floor>:r1`), so everyone sees the same three at the same floor and the same reroll.
  Only the choice differs. The board entry saves the augments taken, shown on the leaderboard and plaque.
- **Type-only augments** are offered only to that starter's type; a few per type, so Fire gets help where it fails
  (single fights at floors 75-99).
- **Never offered twice** in a climb; an augment whose need isn't met (a Tide augment for Fire) isn't offered.
- **Sets** (ARAM Mayhem's): some augments carry a set tag; 2 or 3 of a set gives a bonus (below).
- Augments are their own row in the Bag (a tier-framed icon each) and badges on the battle nameplate when they act.

## Building it

- `js/data/augments.js`: `{ id, tier, name, text, type?, set?, needs?, ...effect }`, pure, shared with the bot.
- Most work as relics under the hood (the relic hooks already cover start-of-fight, per-turn, after-fight, heals,
  max HP); only rule-benders (Echo, Overclock, Rising Tide, Glass Cannon...) need new hooks in `js/battle.js`, mirrored
  in `pokeDB-sim/sim/engine.js`.
- Saved on `run.tower.augments` (ids), so a refresh keeps them and the pick in progress re-asks.
- Bot: picks augments by measured value (win/floor gain with only that augment), like relics, or the numbers are
  pick bias. Goal: every type reaches floor 100 sometimes (Fire is 0% today), no augment is always right, and
  Prismatics feel huge but none wins alone.
- Badges: e.g. reach floor 50 with 3 Prismatics, win with 5 of one set, take every augment once (an augment dex).

## The list (first pass, ~110)

### Silver (floors 1-30)

| Augment | Effect |
|---|---|
| Thick Skin | +15 max HP |
| Iron Wall | Start every fight with 6 block |
| Light Pack | Remove 2 cards |
| Sharpened | Upgrade 3 random cards |
| Training Day | Upgrade 1 card of your choice; again after every guardian |
| Pocket Change | +50% ₽ from fights |
| Big Spender | Mart prices -25% |
| Field Medic | Heal 3 HP after every fight |
| Rest Stop | Centers heal 50% more |
| First Strike | Your first attack each fight deals +8 |
| Warm Up | Draw 2 more cards on turn 1 |
| Early Bird | +1 PP on turn 1 of every fight |
| Hoarder | +1 item slot, and an item now |
| Lucky Find | A random relic now |
| Scavenger | Fights drop an item twice as often |
| Thorn Coat | Enemies take 3 damage when they hit you |
| Steady Hands | Your block cards give +2 |
| Heavy Hitter | Your attacks deal +2 |
| Alpha Hunter | Alphas give an extra card reward |
| Second Helping | Card rewards offer 4 cards |
| Picky Eater | Reroll a fight's card reward once, for 30 ₽ |
| Deep Pockets | +1 reroll this climb |
| Tough Hide | Take 1 less damage from every hit |
| Insight | See the enemy's next two moves |
| Clean Slate | Remove a card at every Center as well as resting |
| Lucky Coin | 25% chance for an extra relic from guardians |
| Mulligan | Once a fight, shuffle your hand into the draw pile and draw that many |
| Inner Focus | Start every fight with 1 strength |

### Gold (floors 40-60)

| Augment | Effect |
|---|---|
| Second Wind | Once a climb, survive a lethal hit at 1 HP and heal 30% |
| Echo | The first card you play each fight is played twice |
| Overflow | Half your block carries over to the next turn |
| Double Down | Every 5th card you play each fight is played twice |
| Combo Master | Every 3rd card you play each turn costs 0 |
| Momentum | +1 strength every 3 turns of a fight |
| Bulwark | Gain block equal to 25% of the damage you deal |
| Siphon | Heal 2 every time you play an attack that kills |
| Executioner | Attacks deal double to enemies below 25% HP |
| Opening Act | Your Power cards cost 0 on turn 1 |
| Deck Diet | Remove 4 cards; max HP -5 |
| Refresh | Draw 1 card whenever you shuffle your discard pile |
| Ambush | Enemies start every fight Vulnerable 2 |
| Intimidate | Enemies start every fight Weak 2 |
| Bodyguard | The first time each fight you'd drop below half, gain 15 block |
| Spoils of War | Guardians give a second boss relic to choose |
| Golden Touch | Gain ₽ equal to the damage of your biggest hit each fight |
| Duelist | Fights with one enemy: +25% damage dealt |
| Comeback | While below half HP, draw 1 more card a turn |
| Last Stand | While below 25% HP, +1 PP a turn |
| Card Shark | Every card reward has an upgraded rare |
| Recycler | A card exhausted in a fight comes back upgraded next fight (once each) |
| Steel Nerves | Status cards (Confusion, Poison...) are exhausted the moment they're drawn |
| Retainer | Retain 1 card of your choice each turn |
| Pack Rat | Every item works twice when used |
| Fortress | Block from cards is +30%, but your attacks -15% |
| Guardian Slayer | +30% damage against guardians |
| Flurry | Your multi-hit attacks hit 1 more time |
| Overcharge | X-cost cards get +1 X |
| Combo Breaker | When you play 3 attacks in a turn, gain 8 block |
| Patience | End a turn with unused PP: +4 block per PP |

### Prismatic (floors 70-90)

| Augment | Effect |
|---|---|
| Glass Cannon | Double damage dealt; max HP halved |
| Vampire | Heal 15% of all the damage you deal |
| Overclock | +2 PP a turn; draw 2 fewer cards |
| Metronome Mind | Each turn a random card joins your hand, free |
| Mirror Force | Reflect 50% of attack damage you take |
| Infinite Loop | Your deck is reshuffled every turn: draw a fresh hand, nothing discarded is lost |
| Time Warp | Every 4th turn of a fight is an extra turn (enemies skip it) |
| Avatar | All your cards cost 1 (X and 0 too) |
| Legend | Evolve once more: +30 max HP and your Ability's numbers double |
| Chaos Theory | At the start of each turn, every card in your hand changes cost randomly (0-3) |
| Bloodlust | Every kill gives +1 strength for the rest of the climb |
| Immortal | You can't drop below 1 HP for the first 3 turns of each fight |
| Gambler | Every fight: a coin flip doubles or halves all damage both ways |
| Hydra | When you play an attack, play a copy of it on the enemy at half damage |
| One Punch | Once a fight, your next attack deals 5x |
| Living Legend | Start every fight with 3 strength, 3 Focus and 10 block |
| Copycat | Each turn the enemy's move is copied into your hand as a card |
| Soul Bond | Your relics' numbers are doubled |
| Speedrunner | Fights won in 3 turns or fewer heal 10 and give +1 max HP |
| Overgrowth Nova | Every 10th card you play each fight deals 50 to every enemy |
| Pandemonium | Draw 3 more cards a turn; at the end of your turn discard your hand and lose 1 HP per card |
| Last Breath | At 1 HP your attacks deal triple |

### Type-only

| Augment | Tier | Type | Effect |
|---|---|---|---|
| Kindling | Silver | Fire | Your Burn applies +1 |
| Ember Skin | Silver | Fire | Start every fight with 8 block |
| Heat Shield | Gold | Fire | Every Burn you apply also gives you 2 block |
| Wildfire | Gold | Fire | Burn never goes down |
| Cauterize | Gold | Fire | Heal 1 for every Burn tick on an enemy |
| Phoenix | Prismatic | Fire | Blaze is always on and its bonus doubles |
| Rebirth | Prismatic | Fire | Once a climb, at 0 HP: revive at full HP with 3 strength |
| Supernova | Prismatic | Fire | Burn stacks deal double; your exhausted cards deal 6 to the enemy |
| Deep Roots | Silver | Grass | Overgrow heals 6 |
| Pollinate | Silver | Grass | Leech Seed applies +1 |
| Photosynthesis | Gold | Grass | Heal 2 at the start of every turn |
| Thorn Garden | Gold | Grass | Enemies with Leech Seed take 3 when they attack |
| Overbloom | Gold | Grass | Healing past max HP becomes block (twice as much) |
| World Tree | Prismatic | Grass | Leech Seed never goes down and heals double |
| Spore Storm | Prismatic | Grass | Every debuff you apply is applied twice |
| Still Pool | Silver | Water | Torrent starts fights with 5 Tide |
| Undertow | Silver | Water | Gain 1 Tide whenever you discard a card |
| Rising Tide | Gold | Water | Spending Tide only spends half |
| Tidal Armor | Gold | Water | Gain 1 block per Tide at the end of your turn |
| Riptide Rush | Gold | Water | Retained cards cost 1 less |
| Tsunami | Prismatic | Water | Tide is never spent, only counted |
| Abyss | Prismatic | Water | Every 10 Tide gained: +1 PP for the fight |

(Mewtwo never climbs the tower, so no Psychic set; add some if that ever changes.)

### Trade-offs (any tier, the risky ones)

| Augment | Effect |
|---|---|
| Cursed Gold | +300 ₽ now; every Mart costs 25% more |
| Darkrai's Deal | A random Prismatic now; -20 max HP |
| Heavy Pack | Take 2 cards from every card reward; a Sludge joins your deck every flight |
| Berserker | +3 strength; you can't gain block from cards |
| Pacifist | Your attacks deal half; you gain double block and Thorns 5 |
| Monk | Remove all your attacks but 3; every Skill deals 4 |
| Speed Demon | +1 PP a turn; enemies act twice on turn 1 |
| Sudden Death | Guardians have half HP; you can't heal outside Centers |
| Risky Climb | Every floor's fight is an Alpha, Alphas give double rewards |
| No Mercy | +40% damage; Centers are gone (fights) |

### Sets (part c)

| Set | Members | 2 / 3 bonus |
|---|---|---|
| Snowball | Bloodlust, Momentum, Speedrunner, Executioner | +1 strength a fight / +3 |
| Ironclad | Iron Wall, Bulwark, Overflow, Fortress, Bodyguard | +3 block a turn / block can't drop below 10 |
| High Roller | Gambler, Chaos Theory, Lucky Find, Cursed Gold | +1 reroll / every pick shows 4 |
| Glutton | Field Medic, Siphon, Vampire, Photosynthesis | +10 max HP / healing +50% |
| Tempo | Combo Master, Double Down, Echo, Overclock | +1 draw / +1 PP on turn 1 |
| Card Smith | Sharpened, Training Day, Card Shark, Recycler | Upgrades show / every new card comes upgraded |

## Part c's calls (2026-10-07)

- **Trade-offs** are `trade: true` (a red Trade-off chip on the tile): Cursed Gold, Heavy Pack and Risky Climb are Silver;
  Darkrai's Deal, Berserker, Pacifist, Monk, Speed Demon, Sudden Death and No Mercy Gold (Darkrai's Deal at Gold, not
  Silver, so no Prismatic lands on floor 1). Changed from the list: Heavy Pack's Sludge comes after every guardian; Risky
  Climb's "double rewards" is double ₽ (an Alpha already pays a relic); Monk keeps your 3 best attacks (rarest, then PP
  Upped, then dearest) and every Skill deals 5; Sudden Death is "nothing heals you during fights" (Centers, Field Medic and
  the guardian's heal still do); No Mercy's Centers are dealt as fights. Darkrai's Deal's Prismatic comes from the week's
  seed and the floor it was taken at (`dealPrismatic()`), so it's the same for everyone. Risky Climb and No Mercy taken
  before a flight's first door deal that flight again.
- **The rest of the list**: Picky Eater (a reroll for 30 ₽ once a reward, after Oak's Advice), Insight (the move after next
  under the intent, plus +3 on the fight's first attack so it isn't a blank for players who read intents anyway), Mulligan (a
  violet button beside End Turn, once a fight), Recycler (each move exhausted in a fight gets PP Up after it), Pack Rat (items
  work twice, +1 slot), Infinite Loop (+1 draw), Chaos Theory (Snecko Eye: drawn cards cost 0-3, +2 draw), Hydra (every hit
  again at half), Copycat (the enemy's coming move as a free exhausting card at half power, `copyCard()`). **Soul Bond**
  is two relics now and one after every guardian: doubling every relic's numbers would mean rewriting each relic.
- **Sets** (`AUG_SETS`; an augment's `set`): 2 of a set give its first bonus, 3 the second as well; `augEffects()` adds them,
  and the ones that happen once (Glutton's max HP, Card Smith's PP Ups) happen as the set reaches them (`setBonusNow()`).
  Card Smith's 2 is "PP Up 2 random moves" (the list's "upgrades show" had no meaning in this game). High Roller's 3 shows a
  4th augment after the usual three, walking on down the floor's own tier without drawing a roll, so the three stay everyone's.
- **Badges** (Sky Pillar group): Augmenter (25 different), Augment Dex (every one), Set (3 of a set in a climb), Set Master
  (every set), Prism (clear floor 90 holding 3 Prismatics), Devil's Bargain (clear floor 50 holding 3 trade-offs). They read
  `save.tower.augDex`, `sets`, `prismFloor` and `tradeFloor`.

## Tuning (2026-10-08, bot-checked)

Human bot on full 100-floor climbs, the bot picking augments by measured value (pokeDB-sim's `sim/augranks.json`: floors
gained by a 4-flight climb holding only that augment). Every type already reached floor 100 sometimes; the problems were one
augment always taken and seven never. Changes, each re-measured before the climbs:

| Augment | Was | Now |
|---|---|---|
| Siphon | Heal 2 per attack (taken 99% when offered) | Heal 1 |
| Vampire | Heal 15% of attack damage | 10% |
| Pacifist | Block x2, Thorns 5 | Block x1.75, Thorns 3 |
| Bulwark | Block 25% of attack damage | 20% |
| Berserker | +3 strength; cards give no block | +4 strength; cards that give block give 1 less |
| Speed Demon | +1 PP; enemies act twice on turn 1 | +1 PP; every enemy attack deals 2 more (`hitReduce: -2`) |
| Sudden Death | Guardians half HP; no healing in fights | Every enemy -25% HP; -25% max HP (`enemyHp`) |
| Overclock | +2 PP; draw 2 fewer | +2 PP; draw 1 fewer after turn 1 |
| Pandemonium | Draw 3 more; -1 HP per card left in hand | +2 PP and draw 1 more; -1 HP per card left |
| Gambler | All damage x2 or x0.5, both ways | Your attacks x3 or x0.75 (`gambler: [3, 0.75]`); enemies unchanged |

Guardian-only upsides measure close to nothing (the bot dies on landings, not guardians), so Sudden Death became an all-foes
trade. Gambler's old halving lost the fight it landed on early in a climb, hence the softer tails.
