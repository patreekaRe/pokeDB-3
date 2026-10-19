# Safari duos and six new types: the design (roadmap session 0)

**Status: approved 2026-10-19.** The user answered all 22 open choices by clicking through them (section 8 records
each answer), and session 1b's six. Sessions 1, 1b and 2 are built. Branch `duo-types` (both repos; pokeDB-sim
gets its `duo-types` in session 1). The roadmap's "Six new types for the Safari's duo pool" is the build list and its
Ideas entry "Safari duos, real types and new areas" the reasons; this doc is the rules those sessions build to. Every
**(open N)** points to the user's answer in section 8; the text below follows those answers.

In short: in the Safari you can bring **two starters of different types**, one out at a time. One HP bar, **two decks**
(each partner its own, with its own hand and piles in battle). Switching costs 1 PP; the one out takes the enemy's hits as its type, gets STAB on its own type's
cards and is the only Ability that works. The Safari moves to the **real Gen 5 type chart** (no immunities, capped at one
step). Six new playable types join the **duo pool** when you catch their starters in their own new Safari areas:
**Electric, Ice, Fighting, Ground, Flying, Dark**, each with ~74 cards on three new archetypes, an Ability, starters and
an area. With Fire / Grass / Water that makes 9 types and 36 duos.

## 1. The duo (session 1, on Fire / Grass / Water)

**Two decks, not one** (built in session 1b, 2026-10-19; the user's call after session 1: "it should be as if you're controlling two
completely different starters"; its six rules are the user's answers 23-28 in section 8). Each partner
keeps its own deck and its own piles in battle; it replaced answer 6's shared 5 + 5 and refined answer 7.

| Rule | Proposal |
|---|---|
| Where | Safari runs only (`run.safari`), from the Duo Run screen (section 2). The Daily run stays one dealt starter. |
| HP | **One HP bar** for the trainer, as now (`BASE_HP` + perks + `HP_PER_STAGE`): no fainting of one partner, every heal and relic works unchanged **(open 1)**. |
| Stage | Shared: both evolve together at the bosses, like `run.stage` today. The evolution card pick offers both types' evo cards. |
| Switch | A tap on the benched partner's chip on your nameplate, then a second tap on "⇄ Go, Shinx! 1 PP" (the pile picker's two-tap pattern, no accidental switches). **1 PP**, any number of times on your turn, never on the enemy's; it doesn't end the turn **(open 2; kept for two decks, answer 24)**. A few cards and one relic make it free (Volt Switch, Baton Pass, Shed Shell). |
| Two decks | Each partner's deck is its **own solo starting deck** (10 cards: Charmander's, Squirtle's...), so neither is thinned. In battle each has its own draw, discard and exhaust piles and its own hand; the one out's are live, the other's wait. |
| Hands | **Two hands a turn** (answer 23). At the start of your turn the one out draws its hand. The first time the partner comes out in that turn it draws its own hand (the same count: Scope Lens and the rest count, Lagging Tail's extra only once); a switch back brings back the hand it left, never a new one. At the end of your turn both hands go to their own discard piles: Ethereal cards fade, Retain cards (all of them under Slowpoke Tail) stay with their owner. Poison, Grip Claw and Still Waters read only the one out's hand. |
| The bench's piles | **Untouched while it's benched** (answer 25). What the enemy shuffles into "your deck" (Sludge, Confusion...) and every card a card makes goes to the one out's piles; so does Griseous Orb's Sludge at a fight's start. The chip shows the partner's hand this turn (✋5), else its draw pile (📚10). |
| Who's out at a fight's start | Whoever was out when the last fight ended; the first fight, the one you picked first **(open 8)**. |
| Defending type | The one out's **deck type** (Shinx defends as Electric; a Charizard skin as Fire, not Fire / Flying) **(open 4)**. |
| STAB | A card of the type that's out deals **x1.2** damage (attack damage only: not block, Burn, Leech Seed, Tide, Static...). Neutral cards never **(open 3)**. |
| Abilities | Only the one out's. A "fight's start" Ability (Torrent's 2 Tide, Snow Warning's Hail) fires the first time that partner comes out each fight, so switching can't farm it; "after a fight" ones (Overgrow) go by who's out at the knockout **(open 5)**. |
| What stays when you switch | Everything on the battle: block, strength, Focus, Tide, powers, the enemy's Burn / Seed / Static. Only the defending type, STAB and the Ability change. |
| Starting deck | ~~10 cards, half each (open 6)~~ replaced by two decks, each partner's solo 10 (above). |
| Card rewards | Three cards: one of each type, the third either (50/50); Neutral cards come in at their usual share. The Mart's cards, Move Tutor, Metronome and the ? events' type pools are both types' pools together **(open 7)**. **Whose deck** (answer 26): a type's card joins its type's deck, wherever it came from (a reward, the Mart, an event, an evolution card); a Neutral card you'd pick asks "Who learns it?" when you're back on the map; a status card or token goes to the one out. An upgrade or a swap stays in the deck it was in. |
| Deck picks | The Center's PP Up and Forget, the ? events' picks (Bonfire, Ditto, Day Care, Smeargle, Bill's PC) show **both decks in one picker**, each under its partner's name (answer 27); the pick changes that partner's deck. The Bag's deck window groups them the same way. |
| Relics and items | The Bag is the trainer's: both types' `only` relics and items are in the pools, and a type's held-item relic (Charcoal, Miracle Seed...) boosts its type's cards whoever is out. |
| The intent | The bubble shows the move's type icon, with ▲ when it's super effective on the one out and ▼ when resisted; the bench chip shows the same mark for the partner, so you see at a glance whether a switch helps. |
| Screen | The one out's back sprite on your pad; the partner a small portrait chip on your nameplate (its type colour, its ▲/▼). The switch plays the games' "come back / go" (a red-light recall into a ball, the partner's GIF out) under `battleFx()`, a cut without. |
| The save | `run.duo = { ids: [a, b], out, decks: [lead's, partner's], loose: [] }` beside `run.starter` (which stays the lead, so the ~100 places reading `run.starter.type` keep working until each is moved to a `runTypes()` / `outType()` helper), and `run.deck` stays the whole deck, both decks in order, so the ~60 places that change it still work: `syncDecks()` carries each change into the right deck (answer 28). A duo saved before the two decks (session 1, the branch only) is dropped. Additive, so no `RUN_SAVE_VERSION` bump. |
| Off the board | A duo run never posts to the leaderboard; coins as a Replay; catches, signature cards and Safari Pokédex pages count as usual. |
| The sim | `sim/engine.js` mirrors switching, STAB, the out-only Ability and the two decks' piles. The bot dodges (it switches when the coming hit is ▲ on the one out and not on the partner, with 2+ PP), then fetches the partner's hand (it plays its own keeping 2 PP back, switches and plays the partner's), then guards (with PP left, it switches to whoever the hit isn't ▲ on); a Neutral card goes to the smaller deck. Checked on the 3 pairs against the same bot's solo runs (section 8, answer 24). |

## 2. The Duo Run screen (session 1)

The Safari lobby's (`js/safariprep.js`) third way in, beside the Daily run and Replay: **Duo Run** (the roadmap's "Duo
pass", renamed so it isn't confused with the 100-coin Day Pass **(open 9)**). A fourth key on the device, **Duo**,
slides its app over the LCD like Pokédex / Ranks / Buy:
1. **Today's road**: the day's 3 areas in order (`safariDaily()`), each with its 2-3 main types as chips, 4 of its
   Pokémon (sprites if seen, else silhouettes with their type chips) and its rare spawns' ✦ silhouettes. The point is to
   plan: "the Power Plant is Electric, bring Ground".
2. **Your duo pool**: one portrait per type you hold (the 3 free ones from the start, a new type once caught), greyed
   ones for the types not caught yet with "Catch Shinx in the Power Plant". A tap picks; a second pick of the same type
   swaps. Each pick's look is any owned starter of that type (◀ ▶ under the portrait, like the character select) **(open 11)**.
3. Under the picks, per area, how the duo fares: ▲ how many of its main types your two hit super effectively, ▼ how
   many hit you.
4. A = **Start Duo** (the Day Pass's rules, below). B steps back.

**Tries** **(open 10)**: a Duo Run is a kind of replay. It unlocks for the day once that day's free Daily run is
**finished**, won or lost (abandoning it doesn't count; the user's call), and needs the day's Day Pass (100), perks on,
coins as Replay, never posted. So it can't be a second free run a day or a way round the pass. Until then the Duo key
says "Finish today's Daily run to unlock".

## 3. The duo pool, and catching new types (sessions 1 and 3-14)

- The pool starts as Fire / Grass / Water (the free starters, and every owned skin as a look).
- **Every new starter is a 3-stage line** (the user's call, 2026-10-19: "I only want 3 stage starters"), checked against
  the rules for adding Pokémon: no stage may be a main-game enemy (so not Drilbur, Magnemite or Zubat: Excadrill,
  Magnezone and Crobat are), a starter skin, or a line the user turned down (Spheal). Each plays as its deck's type, so
  a second real type is only its look.
- Each new type's **starter lines** live in that type's own new Safari area (section 5), moved there from the areas
  they're in today. **Catching any stage of a starter line** in any Safari run (Daily, Replay or Duo) adds that type to the
  pool, and that species as a look for it: catching Mareep adds Electric with Mareep's look; Shinx later adds Shinx's. The
  reward box says so ("Shinx joined your duo pool! Electric unlocked").
- **Catches already in the save count** (`save.safariDex.caught`): a Shinx caught in the Meadow last week already
  unlocks Electric when this lands **(open 12)**.
- The new starters stay out of `safariStarters()` (the Daily run's dealt starter: listing them would change every
  day's starter, as Rayquaza would have), out of the main game's character select, and out of the Game Corner's skins.
  They're Safari-only until the user says otherwise.
- Saved as `save.duoPool = { electric: ['mareep', ...], ... }` (types and looks), filled from the Safari Pokédex on load
  for the old catches. Follows the cloud save.

## 4. The Safari's real chart (session 2)

**Built 2026-10-19** (session 2, run beside this draft; `docs/reference/safari.md`'s Real types): to the user's session
prompt, the real **18-type** chart with today's typings (Fairy in). The user then picked Gen 5 (answer 13): `python3
tools/real-types.py --gen5` rewrites the table to Gen 5's 17 types and typings, no other change, and session 1 runs it
first. The types live in one generated table
(`js/data/real-types-table.js`), not a `types` field on each line, and the `N()` wrapper stays for the lines' own game
type (their signature card's). Psychic chips are shown (the user's answer 14). The capped and floored x0.5-x2,
Neutral outside, typeless elites and bosses, the plate's chips, the intent's move type, the ▲ / ▼ hint and the tough
prize are as below. Bot check, solo Daily run, 300 a type, triangle -> real: Fire 89.7 -> 86.7, Grass 85.0 -> 79.0,
Water 75.0 -> 73.0: Grass dropped most but within noise, so no Grass tweak yet.

- **Safari only** (`run.safari`); the main game keeps its triangle (`TYPES` in `js/data/cards.js`) until this has proven
  itself.
- **The Gen 5 chart and Gen 5 typings** (no Fairy: every Pokémon here is Gen 1-5 with its Gen 5 sprite, so Clefairy is
  Normal, Marill Water, Gardevoir Psychic) **(open 13)**.
- **No immunities**: an immunity counts as a resistance (Ground hits Flying for x0.5, not 0).
- **The x2 cap**, in this game's numbers: multiply the real factors of the move's type against each of the
  defender's types, clamp to x0.5 .. x2, then map: x2 → **x1.3** (`SUPER_EFFECTIVE`), x1 → x1, x0.5 → **x0.75**
  (`NOT_VERY_EFFECTIVE`). So a 4x weakness is no worse than a 2x one, and Grass into Water / Ground (4x) is x1.3.
- **Neutral cards are outside the chart**, x1 against everything. Enemy Normal moves follow the chart, which is x1
  against all nine player types anyway.
- **Every Safari Pokémon gets its real (dual) types** and **every enemy move its real type** (a `types` field on each
  `SAFARI_MONS` line and the borrowed wilds' Safari entries; a move-type table for the move names, replacing the `N()`
  wrapper). Elites and bosses stay typeless, as everywhere.
- **On screen**: the enemy's plate shows its one or two type chips; the intent its move's type (section 1); a card in
  your hand a small ▲ / ▼ corner against this enemy (the "super-effective hint"), counted with STAB in a duo; the map's
  "tough" mark (`run.js`, a wild whose type beats yours) reads the real chart.
- **Psychic, Ghost, Dragon... chips**: the Safari has hidden Psychic until now so nothing gave Mewtwo's type away. With
  real types they show; the mask keeps hiding *Mewtwo's* type and cards, not that Psychic exists **(open 14)**.
- **Watch Grass**: on the real chart Grass is resisted by 7 types (Fire, Grass, Poison, Flying, Bug, Dragon, Steel), and
  many of today's "Neutral" Safari Pokémon are Flying, Poison or Bug. Session 2's bot check runs the solo Daily run per
  type before and after; if Grass drops past the noise, the fix is a Grass tweak in the Safari, not a softer chart.

### What each of the nine hits and fears (real chart, before the cap)

| Type | Super effective on | Resisted by | Weak to | Resists |
|---|---|---|---|---|
| Fire | Grass, Ice, Bug, Steel | Fire, Water, Rock, Dragon | Water, Ground, Rock | Fire, Grass, Ice, Bug, Steel |
| Water | Fire, Ground, Rock | Water, Grass, Dragon | Grass, Electric | Fire, Water, Ice, Steel |
| Grass | Water, Ground, Rock | Fire, Grass, Poison, Flying, Bug, Dragon, Steel | Fire, Ice, Poison, Flying, Bug | Water, Electric, Grass, Ground |
| Electric | Water, Flying | Electric, Grass, Dragon, Ground* | Ground | Electric, Flying, Steel |
| Ice | Grass, Ground, Flying, Dragon | Fire, Water, Ice, Steel | Fire, Fighting, Rock, Steel | Ice |
| Fighting | Normal, Ice, Rock, Dark, Steel | Poison, Flying, Psychic, Bug, Ghost* | Flying, Psychic | Bug, Rock, Dark |
| Ground | Fire, Electric, Poison, Rock, Steel | Grass, Bug, Flying* | Water, Grass, Ice | Poison, Rock, Electric* |
| Flying | Grass, Fighting, Bug | Electric, Rock, Steel | Electric, Ice, Rock | Grass, Fighting, Bug, Ground* |
| Dark | Psychic, Ghost | Fighting, Dark, Steel | Fighting, Bug | Ghost, Dark, Psychic* |

\* an immunity in the games, a resistance here. Fighting is the only type that hits Normal, the Safari's most common
type, which is why six is the fewest that covers all 18.

## 5. The six new types

Each type is built like Fire / Grass / Water (`docs/card-design.md`'s ground rules all hold): **~74 cards, StS's split**
(20 common, 32 uncommon with bridges, 14 rare, plus 8 evolution cards), every card on a Slay the Spire 1 card at
x~1.2 with its model in a comment and a hand-picked upgrade, **3 archetypes** of ~6 common / ~8 uncommon / ~5 rare each,
bridges between them. A full 10-card starting deck (4 attacks, 4 blocks, 2 signatures) even though a duo uses half, so
solo play stays possible later. Card names are that type's moves, Abilities and items first, made-up names (like
Kindle, Stoke) where those run out: Ice and Electric have only ~20 moves each in Gen 1-5, so later moves' names are
allowed too (a name is only text). Each type session writes its full card table into this doc first, as 6c did.

**Keywords** were checked against the twelve archetypes (Burn / Reckless / Kindling, Growth / Drain / Spores, Tsunami /
Shell / Flow, Force / Barrier / Mind Games), every `cardTerms()` term, the status cards and the existing card names.
Three of the roadmap's starting ideas clashed and are renamed or moved (table after the types).

### Electric: Static, Overcharge, Volt Switch

Fast and disruptive. Hits Water and Flying; only Ground hurts it.
- **Ability: Static.** While it's out, each time the enemy attacks you it gains 2 Static.
- **Starters**: **Shinx** (Shinx, Luxio, Luxray: the deck), Mareep (Mareep, Flaaffy, Ampharos), Pichu (Pichu,
  Pikachu, Raichu), Elekid (Elekid, Electabuzz, Electivire), Tynamo (Tynamo, Eelektrik, Eelektross). All pure Electric.
- **Area: the Power Plant** (Gen 1's): Gate, Turbine Hall, Generator Room, the Reactor (the boss). Its goal ahead: the
  cooling tower's light. Holds the five starter lines (from the Meadow, Wetland and Marsh today), Voltorb, Electrike,
  Blitzle, Plusle, Minun, Emolga, Joltik; rares such as Rotom. (Magnemite stays out: Magnezone is a main-game enemy.)

| Archetype | The rule | StS roots | Example cards |
|---|---|---|---|
| **Static** | `static: N` on the enemy (⚡ badge), lasting all fight. At the start of its turn, at 10 Static (elites 15, bosses 20) it's **Paralyzed**: it loses that move and Static goes back to 0, and the next one takes 5 more. The intent shows "⚡ Paralyzed" as soon as the meter is full. | Pressure Points (build a mark, then it fires), Vault | Thunder Wave (1: Static 5; Deadly Poison), Nuzzle (1: deal 6, Static 3; Poisoned Stab), Discharge (1: deal 6, +1 per Static; Bane), Thunder Fang (1: deal 8, +8 if it'll be Paralyzed), Zap Cannon (R, 3: deal 20, Static 10) |
| **Overcharge** | PP now and next turn, and big-cost payoffs: 3-4 cost bombs and X costs. A rare power keeps unspent PP. | Defect's Turbo, Double Energy, Aggregate, Meteor Strike; Ice Cream | Charge (0: gain 2 PP, shuffle a Sludge into your draw pile; Turbo), Electrify (1: double your PP. Exhaust; Double Energy), Magnet Pull (1: +1 PP per 4 cards in your draw pile; Aggregate), Thunder (U, 4: deal 38; Meteor Strike-lite), Battery (R power: unspent PP carries over; Ice Cream) |
| **Volt Switch** | The switch type: cards that switch you for free, and payoffs **whenever you switch**. | Watcher's stance dance (Flurry of Blows, Mental Fortress, Rushdown) | Volt Switch (1: deal 8, switch free; Flurry), Shock Wave (1: deal 7; if you switched this turn, +1 PP, draw 1; Rushdown), Wired (U power: whenever you switch, block 5; Mental Fortress), Volt Tackle (R, 2: deal 12, +6 per switch this fight; Perfected Strike) |

Starting deck: Thunder Shock x4 (deal 7), Magnet Rise x4 (block 7), **Spark** (2: deal 10, Static 4; Bash), Thunder
Wave.

#### Electric's first session: its cards (session 3, 2026-10-19)

Written here before the code, as 6c did. 30 cards in the pools (10 common, 14 uncommon, 6 rare) and all 8 evolution
cards, so a run with Electric is whole; session 4 adds the other ~36 (10 common, 18 uncommon, 8 rare). Each card is on
a StS 1 card at x~1.2 (its model in the last column and in a comment on its line) with a hand-picked upgrade.

**The rules**, as built (`js/battle.js`, mirrored in pokeDB-sim's `sim/engine.js`):
- **Static** (`static: N`, `enemy.static`, a ⚡ badge on the enemy): lasts all fight. At the start of the enemy's turn
  (after Burn and Leech Seed), at **7** Static (an Alpha 11, a boss 15, +3 for each time it's been Paralyzed this
  fight; `STATIC_CAP` in `js/data/cards.js`, 10 / 15 / 20 +5 in the first draft, see the bot check below) it's **Paralyzed**: it loses that move (the next one comes up), and its Static goes back to 0. The intent shows
  "⚡ Paralyzed" as soon as the meter is full. Static doesn't grow with evolution (Burn's +1 a stage does).
- **Overcharge**: PP now (`energy`), next turn (`nextEnergy`), doubled (`energyMult`), per 4 cards in the draw pile
  (`energyPer`), each turn (power `energyEachTurn`), kept (power `keepEnergy`: unspent PP carries over), and the 3-5 cost
  bombs and X costs that spend it.
- **Switch** (`switch: true`): once the card has done its thing (and gone to its pile), the partner comes out free.
  Alone (a solo run) it still counts as a switch. Payoffs: `ifSwitched` (you switched this turn), `perSwitch` (+N per
  switch this fight), powers `switchBlock`, `switchDraw`, `switchStrength` (every switch, paid or free, card or chip).
- **Static** the Ability: while Electric is out, each enemy attack gives the enemy 2 Static (blocked or not).
- **Shed Shell** (relic, Duo Runs only): your first switch each turn is free. **Baton Pass** (Neutral, offered only in
  Duo Runs, `duo: true`): 0 PP, block 3, switch.

| Card | Rarity | Cost | Effect | Arch | StS |
|---|---|---|---|---|---|
| Thunder Shock | C | 1 | Deal 8 *(up 11)* | — | Strike |
| Magnet Rise | C | 1 | Block 8 *(up 11)* | — | Defend |
| Spark | C | 2 | Deal 10, Static 4, Vulnerable 2 *(up 12, 6, 3)* | Static | Bash |
| Thunder Wave | C | 1 | Static 5, Weak 1 *(up 7, 2)* | Static | Deadly Poison (+ Will-O-Wisp's Weak) |
| Nuzzle | C | 1 | Deal 6, Static 3 *(up 8, 4)* | Static | Poisoned Stab |
| Eerie Impulse | C | 1 | Block 10, Static 3 *(up 13, 4)* | Static | Iron Wave: Electric's Flame Body |
| Charge | C | 0 | Gain 2 PP; shuffle a Sludge into your draw pile *(up 3 PP)* | Overcharge | Turbo |
| Rising Voltage | C | 2 | Deal 16; costs 1 less each time you play it this fight *(up 20)* | Overcharge | Streamline |
| Volt Switch | C | 1 | Deal 8. Switch *(up 11)* | Volt Switch | Flurry of Blows |
| Shock Wave | C | 1 | Deal 7; if you switched this turn, +1 PP and draw 1 *(up 10)* | Volt Switch | Rushdown's payoff, as an attack |
| Discharge | U | 1 | Deal 6, +1 per Static on the enemy *(up 9)* | Static | Bane |
| Thunder Fang | U | 1 | Deal 8; if the enemy will be Paralyzed, +8 *(up 10, +10)* | Static | Bane (the meter full) |
| Zing Zap *(bridge)* | U | 1 | Deal 7, Static 3; if you switched this turn, Static 3 more *(up 9, 4 / 4)* | Static/Volt Switch | Poisoned Stab |
| Electric Terrain | U | 1 | Power: Static 2 at the start of each turn *(up 3)* | Static | Noxious Fumes |
| Lightning Rod | U | 1 | Power: whenever the enemy is Paralyzed, +2 PP next turn *(up cost 0)* | Static/Overcharge | (Static's Vault payoff) |
| Electrify | U | 1 | Double your PP. Exhaust *(up cost 0)* | Overcharge | Double Energy |
| Magnet Pull | U | 1 | Gain 1 PP per 4 cards in your draw pile *(up per 3)* | Overcharge | Aggregate |
| Thunder | U | 4 | Deal 36, Static 8 *(up 44, 10)* | Overcharge/Static | Meteor Strike-lite |
| Electric Surge | U | 2 | Power: +1 PP at the start of each turn *(up cost 1)* | Overcharge | Fusion (a Plasma a turn) |
| Magnetic Flux | U | X | Block 8, X times *(up 10)* | Overcharge | Reinforced Body |
| Wired | U | 1 | Power: whenever you switch, block 5 *(up 7)* | Volt Switch | Mental Fortress |
| Motor Drive | U | 1 | Power: whenever you switch, draw 2 *(up cost 0)* | Volt Switch | Rushdown |
| Electro Drift | U | 1 | Deal 9; if you switched this turn, +9 *(up 11, +11)* | Volt Switch | Tantrum / Follow-Up |
| Overdrive *(bridge)* | U | 1 | Block 8; if you switched this turn, +1 PP *(up 11)* | Volt Switch/Overcharge | Escape Plan |
| Zap Cannon | R | 3 | Deal 20, Static 10 *(up 26, 12)* | Static | Bludgeon + Static |
| Static Field | R | 2 | Power: whenever a hit of yours gets through, Static 1 *(up cost 1)* | Static | Envenom |
| Battery | R | 1 | Power: unspent PP carries over to your next turn *(up cost 0)* | Overcharge | Ice Cream |
| Gigavolt Havoc | R | 5 | Deal 50; +3 PP next turn *(up 60)* | Overcharge | Meteor Strike |
| Volt Tackle | R | 2 | Deal 12, +5 per switch this fight *(up +7)* | Volt Switch | Perfected Strike |
| Plus | R | 2 | Power: whenever you switch, your hits deal +1 all fight *(up cost 1)* | Volt Switch | Demon Form, per switch |

Evolution cards (evo-only, 1 copy; one per archetype and one general a tier):

| Card | Tier | Cost | Effect | Arch |
|---|---|---|---|---|
| Thunder Punch | 1st | 1 | Deal 9, Static 4 | Static |
| Charge Beam | 1st | 1 | Deal 8, draw 1, +1 PP next turn | Overcharge |
| Wild Charge | 1st | 2 | Deal 16. Switch | Volt Switch |
| Thunderbolt | 1st | 2 | Deal 17, Weak 1 (16 read like Fraxure's signature card) | — |
| Fusion Bolt | final | 2 | Deal 22, Static 8 | Static |
| Electro Shot | final | 3 | Deal 34; +2 PP next turn | Overcharge |
| Supercell Slam | final | 2 | Deal 24. Switch | Volt Switch |
| Bolt Strike | final | 3 | Deal 32, draw 2 | — |

Electric so far: 10 common, 14 uncommon, 6 rare, 8 evolution = **38**, plus Baton Pass (Neutral, Duo Runs only).

**Starting deck, as built**: Thunder Shock x3, **Eerie Impulse**, Magnet Rise x4, Spark, Thunder Wave: Fire's shape
(3 attacks, 4 blocks and an Iron Wave), not the 4 + 4 above. The bot check below says why.

**Bot check** (pokeDB-sim, human bot; duos on Safari days, `safariCfg({ catch: true, catchAt: 0.3, duo })`; solo the
main game at Level 0, `humanCfg(type, 0)`), win %. The first draft (the table's numbers before the bot: Thunder Shock 7
x4, Magnet Rise 7, Spark and Thunder Wave without Vulnerable or Weak, Static at 10 / 15 / 20 +5), 150 a cell: solo
Electric 8-10 against Fire 76; electric+fire 33, electric+grass 11, electric+water 9 against fire+grass 79, fire+water
56, grass+water 52. What it took, screened 150 a cell on solo Electric: Fire's shape (Flame Body traded for a 4th Ember
took Fire itself from 61 to 35), Spark's Vulnerable and Thunder Wave's Weak (17 -> 51 together), lower caps (-> ~60),
then on the duos Thunder Shock 8 (electric+grass 35 -> 48, electric+water 39 -> 45). Rejected, within noise: the Static
Ability at 3, caps 7 / 10 / 13, Overdrive 10 and Nuzzle with Weak. The shipped numbers' check is in the roadmap's entry.

#### Electric's second session: its other cards (session 4, 2026-10-19)

Written here before the code. The other 36 pool cards (10 common, 18 uncommon, 8 rare), **defence-leaning** since the
first half is attack-heavy: 25 of the 36 block, Weaken, Sap or stop a move. Electric is then whole: 20 common, 32
uncommon, 14 rare and 8 evolution cards (74), plus Baton Pass. Each card is on a StS 1 card at x~1.2 (the last column
and a comment on its line) with a hand-picked upgrade.

**The new rules** (`js/battle.js`, mirrored in pokeDB-sim's `sim/engine.js`):
- `blockPerStatic` / `blockPerSwitch`: +N block per Static on the enemy / per switch this fight (Faraday Cage, Volt Guard).
- `staticMult`: multiply the enemy's Static (Static Storm, and the Shock Drive item: Burn Drive's Catalyst for Static).
- Powers: `thornStatic` (whenever the enemy attacks you, Static N: Electromorphosis), `staticBlock` (at the start of
  each turn, block equal to the enemy's Static: Electric Seed), `energyBlock` (at the end of your turn, N block per PP
  left: Dynamo), `switchWeak` / `switchStatic` / `switchSap` (whenever you switch, Weak / Static / Sap N: Shock Tactics,
  Galvanize, Minus, Plus's mirror).
- `ifEnemyAttacks: { switch: true }` (Volt Retreat: a switch only when the hit is coming), `ifSwitched` with block and draw.

| Card | Rarity | Cost | Effect | Arch | StS |
|---|---|---|---|---|---|
| Cell Battery | C | 1 | Block 8; +1 PP next turn *(up 11)* | Overcharge | Charge Battery |
| Electroweb | C | 2 | Block 12, Static 4 *(up 15, 5)* | Static | Leg Sweep, Static for its Weak |
| Ion Deluge | C | 0 | Static 2; if the enemy intends to attack, Static 2 more *(up 3 / 3)* | Static | Go for the Eyes |
| Electro Ball | C | 1 | Deal 6, Static 2, draw 1 *(up 8, 3)* | Static | Pommel Strike |
| Volt Absorb | C | 1 | Block 7; if you switched this turn, +5 block *(up 9, +7)* | Volt Switch | Empty Body, the other way round |
| Thunderclap | C | 1 | Deal 6, block 5. Switch *(up 8, 7)* | Volt Switch | Iron Wave, with a switch |
| Transistor | C | 1 | Block 7, draw 1; if you switched this turn, draw 1 more *(up 10)* | Volt Switch | Shrug It Off |
| Live Wire | C | 1 | Deal 6; +1 PP next turn *(up 9)* | Overcharge | Sneaky Strike's refund, next turn |
| Capacitor | C | 2 | Block 14. Retain *(up 18)* | Overcharge | Protect |
| Insulate | C | 1 | Block 5, and 5 next turn *(up 7 / 7)* | — | Dodge and Roll |
| Electromorphosis | U | 1 | Power: whenever the enemy attacks you, Static 2 *(up 3)* | Static | Static Discharge |
| Faraday Cage | U | 2 | Block 10, +1 per Static on the enemy *(up 13)* | Static | Spirit Shield, on Static |
| Stun Shock | U | 2 | Static 6, Weak 3. Exhaust *(up 8, 4)* | Static | Shockwave |
| Thunder Cage | U | 1 | Static 3; the enemy's attacks deal 6 less this turn. Exhaust *(up 4, 8)* | Static | Piercing Wail |
| Plasma Fists | U | 2 | Deal 11, Static 5 *(up 14, 6)* | Static | Uppercut, Static for both debuffs |
| Power Cell | U | 2 | Block 10; +2 PP next turn *(up 13)* | Overcharge | Glacier |
| Surge Protector | U | 3 | Block 24 *(up 30)* | Overcharge | a 3-cost wall for the PP it makes |
| Dynamo | U | 1 | Power: at the end of your turn, 3 block per PP left *(up 4)* | Overcharge | (Overcharge's own: Battery's other use of spare PP) |
| Recharge | U | 1 | +2 PP next turn, draw 1 *(up +3 PP)* | Overcharge | Outmaneuver |
| Polarity Swap | U | 1 | Block 9. Switch *(up 12)* | Volt Switch | Empty Body |
| Shock Tactics | U | 1 | Power: whenever you switch, apply 1 Weak *(up cost 0)* | Volt Switch | Wave of the Hand, a switch at a time |
| Electric Relay | U | 1 | Block 6; if you switched this turn, draw 2 *(up 9)* | Volt Switch | Sanctity |
| Volt Retreat | U | 1 | Block 7; if the enemy intends to attack, switch *(up 10)* | Volt Switch | Fear No Evil |
| Volt Guard | U | 2 | Block 10, +3 per switch this fight *(up +4)* | Volt Switch | Perfected Strike, as block |
| Galvanize *(bridge)* | U | 1 | Power: whenever you switch, Static 3 *(up 4)* | Volt Switch/Static | Mental Fortress, Static for block |
| Wildbolt Storm *(bridge)* | U | X | Static 4, X times *(up 5)* | Overcharge/Static | Malaise |
| Magnetic Field | U | 2 | Power: at the start of each turn, block 4 *(up 6)* | — | Metallicize |
| Zap Shield | U | 0 | Block 4, Static 2 *(up 6, 3)* | Static | Deflect, with Static |
| Static Storm | R | 1 | Double the enemy's Static. Exhaust *(up triple)* | Static | Catalyst |
| Electric Seed | R | 2 | Power: at the start of each turn, block equal to the enemy's Static *(up cost 1)* | Static | (Static's Metallicize) |
| Max Lightning | R | 2 | Deal 4, +3 per Static on the enemy. Retain *(up +4)* | Static | Bane's big brother |
| Hadron Engine | R | 3 | Power: at the start of each turn, +1 PP and block 5 *(up cost 2)* | Overcharge | Fusion and Metallicize in one |
| Ion Barrier | R | 2 | Block 32. Exhaust *(up 40)* | Overcharge | Impervious |
| Stoked Sparksurfer *(bridge)* | R | 2 | Deal 10, Static 6. Switch *(up 14, 8)* | Volt Switch/Static | Wallop, Raichu's Z-move |
| Minus | R | 2 | Power: whenever you switch, apply 1 Sap *(up cost 1)* | Volt Switch | Disarm a switch at a time: Plus's mirror |
| Booster Energy | R | 0 | Gain 2 PP. Switch. Exhaust *(up 3 PP)* | Volt Switch/Overcharge | Adrenaline |

Electric whole: 20 common (Static 7, Overcharge 5, Volt Switch 5, 3 basics), 32 uncommon, 14 rare, 8 evolution = **74**.

**Relics** (`only: 'electric'`, 6 plus its held item; the user's answer 21): **Magnet** (common: your Electric attacks
deal +2; the old Unceasing Top relic, id `magnet`, is renamed Quick Powder so the names don't clash), **Light Ball**
(common: enemies start each battle with 3 Static; Bag of Marbles / Gooey Mulch), **Eject Button** (common: whenever
you switch, gain 4 block; Wired as a relic), **Zap Plate** (uncommon: whenever you play a card that costs 3 or more, gain
8 block; Overcharge's payoff), **Electirizer** (uncommon: whenever the enemy is Paralyzed, draw 2 more next turn),
**Electric Memory** (rare: a Paralysis leaves half its Static, not 0), **Thunder Stone** (boss: draw 1 more each turn,
and Static charges 4, not 2; Water Stone's shape). **Items**: **Electric Gem** (gain 2 PP, Static 3) and **Shock Drive**
(double the enemy's Static).

**Starters**: Mareep (Mareep, Flaaffy, Ampharos), Pichu (Pichu, Pikachu, Raichu), Elekid (Elekid, Electabuzz,
Electivire), Tynamo (Tynamo, Eelektrik, Eelektross), each a `DUO_STARTERS` skin of Shinx's deck (`ELECTRIC_DECK`), as
the Gen 2 / 3 starters are of Charmander's. Catching any stage adds Electric with that look (`DUO_LINES.electric`).

**The Power Plant** (`powerplant`): Gate, Turbine Hall, Generator Room, the Reactor. Its roster is the five starter
lines and the Electric wilds the Meadow, Forest, Wetland and Marsh held (Voltorb, Electrike, Blitzle, Plusle, Minun,
Emolga, Joltik; Rotom, Ampharos, Luxray, Electivire and Eelektross its rare spawns), moved in. Painted as the Peak
recoloured to a stormy steel night-yellow until its art session. **Date-gated** (`SAFARI_FROM` in `js/data/safari.js`):
a day before it keeps the six areas and their old rosters, so a launch can't change a day already dealt; from it, 3 of
the 7. On the branch it's set to 2026-10-20: **move it to the day after the branch goes live**.

**Bot check** (pokeDB-sim, human bot, Safari days, `safariCfg({ catch: true, catchAt: 0.3, duo })`; 300 a duo cell, 150
the rest), win %: electric+fire / +grass / +water 64.7 / 43.7 / 36.3, against session 3's Electric (`elecFirst`: these
36 cards, the relics and items out) 70.3 / 52.7 / 44.3: about 7 points under on each, half the cards' and half the
relics' (`elecNoCards` +grass / +water 50.3 / 40.0, `elecNoRelics` 48.7 / 37.7). Fire+grass 82.0, fire+water 54.7,
grass+water 37.3; solo Electric 78.7 (74.7 before), Fire 68.7. With a partner Electric sits between Grass and Water, so
the numbers are left for the balance pass (session 15). The bot never took 13 of the 36 (most 2-3 cost blocks and
powers): its card pick divides by cost, as the 2026-09-24 card-pool review found, so a human may rate them higher.

### Ice: Frostbite, Icicle, Hail

Glassy and punishing. Hits Grass, Ground, Flying, Dragon; fears Fire, Fighting, Rock, Steel.
- **Ability: Snow Warning.** The first time it comes out each fight, Hail for 2 turns.
- **Starters**: **Vanillite** (Vanillite, Vanillish, Vanilluxe: the deck), Swinub (Swinub, Piloswine, Mamoswine;
  Ice / Ground, an Ice deck). The only two 3-stage Ice lines in Gen 1-5 (Spheal's is turned down).
- **Area: the Ice Cave** (Seafoam / Icefall): Frozen Falls, Ice Cave, Crystal Hall, the Frozen Lake (the boss). Takes
  the Ice Pokémon, most of them the Peak's today (Vanillite, Snorunt, Swinub, Cubchoo, Sneasel lines; Delibird, Smoochum,
  Cryogonal...); rares such as Jynx and Lapras.

| Archetype | The rule | StS roots | Example cards |
|---|---|---|---|
| **Frostbite** | `frostbite: N` on the enemy (❄️ badge): every hit on it deals +1 per Frostbite, then it thaws by 1 at the end of its turn. Every hit means the partner's and multi-hits too, so it's a duo's glue. (The roadmap's "Freeze", see open 15.) | Lock-On; Silent's Envenom shape | Icy Wind (1: deal 6, Frostbite 2), Frost Breath (1: deal 6, +2 per Frostbite; Bane), Ice Beam (2: deal 12, Frostbite 3), Sheer Cold (R, 1: double the Frostbite. Exhaust; Catalyst), Permafrost (R power: Frostbite no longer thaws) |
| **Icicle** | 0-cost **Icicle** cards: whenever one is played, every Icicle card deals +2 this fight. | Defect's Claw, All for One | Ice Shard (0: deal 3. Icicle; Claw), Icicle Spear (1: deal 2 three times. Icicle), Icicle Crash (U, 2: deal 16. Icicle), Glaciate (R, 2: deal 10, return every 0-cost card from your discard pile to your hand; All for One) |
| **Hail** | **Weather** (below): Hail N turns. At the end of your turn the enemy takes 3; your Ice attacks deal +3 in Hail. | Noxious Fumes; Watcher's "while in a stance" payoffs | Hail (1: Hail 4), Blizzard (2: deal 18, costs 0 in Hail; Carnage), Aurora Veil (1: block 8, 14 in Hail; Dodge and Roll), Icy Rock (relic: weather lasts 3 turns longer) |

Starting deck: Powder Snow x4 (deal 7), Frost Shield x4 (block 7), **Icy Wind** as the Bash (2: deal 10, Frostbite 3),
Ice Shard.

**Weather** (shared by Ice and Ground, one at a time; open 16): `battle.weather = { kind, turns }`, a badge with the
turns left. A new weather replaces the old. Hail and Sandstorm both chip the enemy 3 at the end of your turn; Hail
adds +3 to Ice attacks, Sandstorm +3 to Ground blocks. An Ice + Ground duo can run both, one at a time. (The
brainstorm's "Biome weather as a battle rule" could later set a weather on this same engine.)

#### Ice's first session: its cards (session 5, 2026-10-19)

Written here before the code, as Electric's were. 30 cards in the pools (10 common, 14 uncommon, 6 rare) and all 8
evolution cards, so a run with Ice is whole; session 6 adds the other ~36 (10 common, 18 uncommon, 8 rare), the relics,
items, the other look (Swinub) and the Ice Cave. Each card is on a StS 1 card at x~1.2 (its model in the last column and
in a comment on its line) with a hand-picked upgrade. Starting from Electric's lesson, the deck is Fire's shape from the
start (3 attacks, an Iron Wave, 4 blocks, the Bash and a second signature).

**The rules** (`js/battle.js`, mirrored in pokeDB-sim's `sim/engine.js`):
- **Frostbite** (`frostbite: N`, `enemy.frostbite`, a ❄️ badge on the enemy): every hit on it deals +1 per Frostbite
  (added like strength, before Vulnerable and the chart; any card's hit, the partner's and each hit of a multi-hit),
  then it thaws by 1 at the end of the enemy's turn (Permafrost stops that). Not a hit: Burn, Leech Seed, Hail, relics.
- **Icicle** (`icicle: true` on a card): each Icicle card you play makes every Icicle card deal +2 this fight
  (`ICICLE_STEP`; StS's Claw, so a card's own play counts for the next one, not itself).
- **Weather** (`battle.weather = { kind, turns }`, a badge on the enemy with the turns left): one at a time; a new kind
  replaces the old, the same kind adds its turns. At the end of your turn the enemy loses 3 HP (through block, like
  Burn), then a turn goes. **Hail**: your Ice attacks deal +3 on every hit while it lasts (`HAIL` in
  `js/data/cards.js`). Ground's Sandstorm will add its own kind to the same engine.
- **Snow Warning** (the Ability): the first time Ice comes out each fight (the fight's start for the lead), Hail 2.
- `freeIn: 'hail'` (Blizzard costs 0 in Hail), `ifFrost` / `ifHail` / `ifWeather` extras, `perFrost` (+N per
  Frostbite), `frostMult` (Sheer Cold), `returnZero` (Glaciate: every 0-cost card in the discard pile to your hand),
  powers `frostEachTurn`, `frostKeep`, `zeroBlock` (whenever you play a 0-cost card), `icicleFrost`, `hailDraw`,
  `hailBlock`, `hailFrost` (whenever Hail hurts the enemy). A token, **Icicle** (0: deal 3, Icicle, Exhaust), from
  Snow Flurry.

| Card | Rarity | Cost | Effect | Arch | StS |
|---|---|---|---|---|---|
| Powder Snow | C | 1 | Deal 8 *(up 11)* | — | Strike |
| Frost Shield | C | 1 | Block 8 *(up 11)* | — | Defend |
| Icy Wind | C | 2 | Deal 10, Frostbite 4, Weak 2 *(up 12, 5, 3)* | Frostbite | Bash, Frostbite for its Vulnerable (+ Weak, as Spark has) |
| Frost Armor | C | 1 | Block 10, Frostbite 2 *(up 13, 3)* | Frostbite | Iron Wave (Eerie Impulse's shape) |
| Ice Fang | C | 1 | Deal 7, Frostbite 2 *(up 9, 3)* | Frostbite | Poisoned Stab |
| Ice Shard | C | 0 | Deal 3. Icicle *(up 5)* | Icicle | Claw |
| Icicle Spear | C | 1 | Deal 2 three times. Icicle *(up 3)* | Icicle | Claw, three hits (Sword Boomerang) |
| Ice Spinner | C | 0 | Deal 2, block 3. Icicle *(up 3, 4)* | Icicle | Claw's other half: a 0-cost Iron Wave |
| Hail | C | 1 | Hail 4 *(up cost 0)* | Hail | Noxious Fumes, as a timer |
| Aurora Veil | C | 1 | Block 8; in Hail, +6 *(up 11, +7)* | Hail | Dodge and Roll |
| Frost Breath | U | 1 | Deal 6, +2 per Frostbite *(up 9)* | Frostbite | Bane (Discharge's shape) |
| Ice Beam | U | 2 | Deal 11, Frostbite 3, Weak 1 *(up 14, 4, 2)* | Frostbite | Uppercut |
| Freeze-Dry | U | 1 | Frostbite 5 *(up 7)* | Frostbite | Deadly Poison |
| Cold Snap | U | 1 | Power: Frostbite 2 at the start of each turn *(up 3)* | Frostbite | Noxious Fumes |
| Ice Punch | U | 1 | Deal 6; if the enemy has Frostbite, +1 PP and draw 1 *(up 9)* | Frostbite | Dropkick |
| Icicle Crash | U | 2 | Deal 14. Icicle *(up 18)* | Icicle | Claw's big brother |
| Snow Flurry | U | 1 | Add 2 Icicles to your hand *(up 3)* | Icicle | Blade Dance |
| Refrigerate | U | 1 | Power: whenever you play a 0-cost card, block 2 *(up 3)* | Icicle | After Image, on 0-costs |
| Blizzard | U | 2 | Deal 14; costs 0 in Hail *(up 18)* | Hail | Carnage, free in the weather |
| Weather Ball | U | 1 | Deal 8; in any weather, +8 *(up 10, +10)* | Hail | (the weather's Bane) |
| Slush Rush | U | 1 | Power: in Hail, draw 1 more card each turn *(up cost 0)* | Hail | Tools of the Trade, in Hail |
| Ice Body | U | 1 | Power: at the start of each turn in Hail, block 5 *(up 7)* | Hail | Metallicize, in Hail |
| Snowscape *(bridge)* | U | 1 | Hail 2, Frostbite 3 *(up 3, 4)* | Hail/Frostbite | Noxious Fumes + Deadly Poison |
| Hailstone *(bridge)* | U | 0 | Deal 3. Icicle. In Hail, draw 1 *(up 5)* | Icicle/Hail | Claw with a Pommel in Hail |
| Sheer Cold | R | 1 | Double the enemy's Frostbite. Exhaust *(up triple)* | Frostbite | Catalyst |
| Permafrost | R | 2 | Power: Frostbite no longer thaws *(up cost 1)* | Frostbite | (Frostbite's Wildfire) |
| Glaciate | R | 2 | Deal 10. Put every 0-cost card in your discard pile into your hand *(up 14)* | Icicle | All for One |
| Snow Cloak *(bridge)* | R | 1 | Power: whenever you play an Icicle card, Frostbite 1 *(up cost 0)* | Icicle/Frostbite | Envenom, on Claws |
| Mountain Gale | R | 3 | Deal 28, Hail 3 *(up 36)* | Hail | Bludgeon |
| Ice Age *(bridge)* | R | 2 | Power: whenever Hail hurts the enemy, Frostbite 3 *(up cost 1)* | Hail/Frostbite | (Hail's payoff) |

Evolution cards (evo-only, 1 copy; one per archetype and one general a tier):

| Card | Tier | Cost | Effect | Arch |
|---|---|---|---|---|
| Aurora Beam | 1st | 1 | Deal 9, Frostbite 3 | Frostbite |
| Ice Ball | 1st | 0 | Deal 5. Icicle | Icicle |
| Avalanche | 1st | 2 | Deal 14, Hail 2 | Hail |
| Ice Hammer | 1st | 2 | Deal 16, block 6 | — |
| Glacial Lance | final | 2 | Deal 22, Frostbite 6 | Frostbite |
| Triple Axel | final | 1 | Deal 5 three times. Icicle | Icicle |
| Freeze Shock | final | 2 | Deal 20, Hail 3 | Hail |
| Subzero Slammer | final | 3 | Deal 34, Weak 2 | — |

Ice so far: 10 common, 14 uncommon, 6 rare, 8 evolution = **38**, plus the Icicle token.

**Starting deck**: Powder Snow x3, **Frost Armor**, Frost Shield x4, Icy Wind, Ice Shard.

**Bot check** (pokeDB-sim, human bot; duos on Safari days, `safariCfg({ catch: true, catchAt: 0.3, duo })`; solo the
main game at Level 0), win %. The first draft (Icy Wind without Weak), 150 a cell: ice+fire 53, ice+grass 47, ice+water
51, ice+electric 46; solo Ice ~47 against Fire 69. Screened on ice+fire / ice+grass / solo: Icy Wind + Weak 1 60 / 64 /
64, + Vulnerable 2 69 / 53 / 57, **+ Weak 2 69 / 64 / 73**, + Weak 1 and Vulnerable 2 68 / 63 / 78; Snow Warning at 3,
Hail's bonus at 4 and Ice Fang for Ice Shard within noise or worse. Shipped with Weak 2, 300 a cell: **ice+fire 67.0,
ice+grass 61.7, ice+water 62.3, ice+electric 70.3; solo Ice 74.0** (session 4's: electric+fire / +grass / +water 64.7 /
43.7 / 36.3, fire+grass 82, fire+water 55, grass+water 37). Ice lifts Grass and Water, the pairs Electric can't; its
second half and relics come next, and the balance pass (session 15) settles the rest.

#### Ice's second session: its other cards (session 6, 2026-10-19)

Written here before the code, as Electric's second was. The other 36 pool cards (10 common, 18 uncommon, 8 rare),
**defence-leaning** like Electric's second: 30 of the 36 block, Weaken, Sap or stop a move (the first half's 30 are
mostly hits). Ice is then whole: 20 common, 32 uncommon, 14 rare and 8 evolution cards (74), plus the Icicle token. Each
card is on a StS 1 card at x~1.2 (the last column and a comment on its line) with a hand-picked upgrade.

**The new rules** (`js/battle.js`, mirrored in pokeDB-sim's `sim/engine.js`):
- `blockPerFrost` / `blockPerIcicle`: +N block per Frostbite on the enemy / per Icicle card played this fight (Hoarfrost,
  Igloo); `thaw` (Shatter: after its hit, the enemy's Frostbite is gone).
- Powers: `thornFrost` (whenever the enemy attacks you, Frostbite N: Ice Scales), `frostBlock` (at the start of each
  turn, block equal to the enemy's Frostbite: Ice Core), `hailChipBlock` (whenever Hail hurts the enemy, N block: Polar
  Vortex), `hailIcicle` (whenever Hail hurts the enemy, an Icicle to your hand: Icefall), `icicleEachTurn` (at the start
  of each turn, an Icicle to your hand: Ice Crown), `retainZero` (your 0-cost cards stay in your hand at the end of your
  turn: Cold Storage), `hailKeep` (Hail no longer runs out: Endless Winter).

| Card | Rarity | Cost | Effect | Arch | StS |
|---|---|---|---|---|---|
| Ice Pellet | C | 0 | Deal 2, Weak 1. Icicle *(up 4, 2)* | Icicle | Neutralize, as a Claw |
| Icicle Guard | C | 0 | Block 4. Icicle *(up 6)* | Icicle | Deflect, as an Icicle |
| Freezing Glare | C | 1 | Frostbite 3, Weak 1 *(up 4, 2)* | Frostbite | Neutralize's big brother, Frostbite for its hit |
| Cold Shoulder | C | 1 | Block 7; if the enemy has Frostbite, +4 *(up 9, +5)* | Frostbite | Defend with Bane's condition |
| Frost Nip | C | 1 | Deal 5, block 5, Frostbite 1 *(up 7, 7)* | Frostbite | Iron Wave |
| Ice Wall | C | 2 | Block 11, Frostbite 3 *(up 14, 4)* | Frostbite | Glacier, its Frost orbs as Frostbite |
| Chilly Reception | C | 1 | Block 6, Hail 2 *(up 9)* | Hail | Deflect and Noxious Fumes |
| Snowdrift | C | 1 | Block 6; in Hail, 6 more next turn *(up 8 / 8)* | Hail | Dodge and Roll, in Hail |
| Sleet | C | 1 | Deal 3 twice; in Hail, block 5 *(up 4, 7)* | Hail | Twin Strike, with block in Hail |
| Black Ice | C | 1 | Deal 7, Weak 1, Frostbite 1 *(up 9, 2)* | Frostbite | Sucker Punch |
| Ice Scales | U | 1 | Power: whenever the enemy attacks you, Frostbite 2 *(up 3)* | Frostbite | Static Discharge |
| Hoarfrost | U | 1 | Block 5, +2 per Frostbite on the enemy *(up 8)* | Frostbite | Spirit Shield, on Frostbite |
| Cold Front | U | 1 | Frostbite 3; the enemy's attacks deal 5 less this turn. Exhaust *(up 4, 7)* | Frostbite | Piercing Wail |
| Numbing Cold | U | 1 | Weak 1; if the enemy has Frostbite, Weak 1 more and draw 1 *(up Weak 2)* | Frostbite | Blind, with Bane's condition |
| Frost Barrier | U | 2 | Block 12; if the enemy has Frostbite, Weak 2 *(up 16)* | Frostbite | Leg Sweep, on a frostbitten foe |
| Ice Sheet | U | 0 | Block 3, draw 1. Icicle *(up 5)* | Icicle | Claw with Pommel Strike's draw, as block |
| Igloo | U | 2 | Block 8, +2 per Icicle card played this fight *(up 11)* | Icicle | Perfected Strike as block (Volt Guard's shape) |
| Brinicle | U | 1 | Deal 4, block 4. Icicle *(up 6, 6)* | Icicle | Iron Wave, as an Icicle |
| Shard Storm | U | 1 | Block 6, add an Icicle to your hand *(up 9)* | Icicle | Cloak and Dagger |
| Refreeze | U | 1 | Block 7; put a card from your discard pile on top of your draw pile *(up 10)* | Icicle | Headbutt, as block |
| Snow Fort | U | 2 | Block 11, Hail 2 *(up 14, 3)* | Hail | Glacier, in Hail |
| Whiteout | U | 1 | Weak 2; in Hail, the enemy's attacks deal 5 less this turn *(up 3, 7)* | Hail | Blind, with Piercing Wail in Hail |
| Polar Vortex | U | 1 | Power: whenever Hail hurts the enemy, block 4 *(up 6)* | Hail | (Hail's Wired: block on its chip) |
| Diamond Dust | U | 1 | Block 6; in Hail, draw 2 *(up 9)* | Hail | Sanctity, in Hail |
| Freezing Rain | U | 2 | Hail 3; your block doesn't wear off next turn *(up Hail 4)* | Hail | Blur, with Fumes |
| Icefall *(bridge)* | U | 1 | Power: whenever Hail hurts the enemy, add an Icicle to your hand *(up cost 0)* | Icicle/Hail | Infinite Blades, on Hail's chip |
| Frost Shard *(bridge)* | U | 0 | Block 3, Frostbite 2. Icicle *(up 4, 3)* | Icicle/Frostbite | Claw, as block and Frostbite |
| Thick Fat | U | 1 | Block 6, Sap 1 *(up 9)* | — | Disarm, with a Defend |
| Ice Core | R | 2 | Power: at the start of each turn, block equal to the enemy's Frostbite *(up cost 1)* | Frostbite | (Frostbite's Metallicize: Electric Seed's twin) |
| Flash Freeze | R | 3 | Frostbite 4. The enemy skips its next turn. Exhaust *(up cost 2)* | Frostbite | Vault |
| Shatter | R | 2 | Deal 4, +4 per Frostbite, then its Frostbite is gone *(up +5)* | Frostbite | (Frostbite cashed in: Catalyst's other end) |
| Ice Crown | R | 2 | Power: at the start of each turn, add an Icicle to your hand *(up cost 1)* | Icicle | Infinite Blades |
| Cold Storage | R | 1 | Power: your 0-cost cards stay in your hand at the end of your turn *(up cost 0)* | Icicle | Runic Pyramid, on 0-costs |
| Iceberg | R | 3 | Block 22, Hail 3 *(up 28)* | Hail | Impervious-lite, with the weather |
| Endless Winter | R | 3 | Power: Hail 3; Hail no longer runs out *(up cost 2)* | Hail | (Hail's Permafrost) |
| Absolute Zero *(bridge)* | R | 2 | Deal 12; in Hail, Frostbite 6 *(up 16, 8)* | Hail/Frostbite | Bludgeon's little brother, Frostbite in Hail |

Ice whole: 20 common (Frostbite 8, Icicle 5, Hail 5, 2 basics), 32 uncommon, 14 rare, 8 evolution = **74**.

**Relics** (`only: 'ice'`, 6 plus its held item; the user's answer 21): **Never-Melt Ice** (common: your Ice attacks
deal +2), **Snowball** (common: enemies start each battle with 3 Frostbite; Light Ball's shape), **Safety Goggles**
(common: whenever Hail hurts the enemy, gain 3 block), **Icy Rock** (uncommon: whenever a weather starts, it lasts 3
more turns), **Icicle Plate** (uncommon: your Icicle cards start each battle +4, as if 2 were played), **Ice Memory**
(rare: Frostbite doesn't thaw while Hail falls), **Ice Stone** (boss: draw 1 more each turn, and Snow Warning brings 4
turns of Hail, not 2; Water Stone's shape). **Items**: **Ice Gem** (Hail 3, gain 8 block) and **Chill Drive** (double
the enemy's Frostbite).

**Starters**: Swinub (Swinub, Piloswine, Mamoswine), a `DUO_STARTERS` skin of Vanillite's deck (`ICE_DECK`), as Electric's
four are of Shinx's. Catching any stage adds Ice with that look (`DUO_LINES.ice`).

**The Ice Cave** (`icecave`): Frozen Falls, Ice Cave, Crystal Hall, the Frozen Lake. Its roster is every Ice-typed
Safari Pokémon (the Peak's 21: the Vanillite, Swinub, Snorunt, Cubchoo, Sneasel, Snover, Smoochum lines, Delibird,
Cryogonal, Dewgong, Glaceon; the Wetland's Cloyster and Lapras), moved in; Glaceon and Lapras are its rare spawns.
Painted as the **Wetland recoloured** to a frozen lake under a pale sky until its art session (the Power Plant already
borrows the Peak). **Date-gated** like the Power Plant (`SAFARI_FROM`, 2026-10-20 on the branch: move it to the day
after the branch goes live); from then, 3 of the 8 a day.

### Fighting: Follow-up, Counter, Guts

The only type that hits Normal, the Safari's most common. Fears Flying and Psychic.
- **Ability: Guts.** While it's out and you hold a status card, your attacks deal +3. (Both starters' real Ability; it
  turns the Safari's paralyzer / confuser / poisoner / clogger junk into power.)
- **Starters**: **Timburr** (Timburr, Gurdurr, Conkeldurr: the deck), Machop (Machop, Machoke, Machamp). Both pure
  Fighting, 3 stages.
- **Area: Dojo Mountain** (the roadmap's): Trailhead, Training Steps, Waterfall Dojo, the Summit Ring (the boss). Takes
  the Fighting Pokémon from the Peak and Forest (Machop, Timburr, Mankey, Tyrogue, Riolu, Makuhita, Meditite lines; Throh,
  Sawk, Mienfoo, Scraggy); rares Hitmonlee, Hitmonchan, Hitmontop.

| Archetype | The rule | StS roots | Example cards |
|---|---|---|---|
| **Follow-up** | "Follow-up (attack)" / "Follow-up (skill)": a bonus if the last card you played this turn was an attack / a skill. Chains of jabs and throws. (The roadmap's "Combo": renamed, as Combo N is already Fire's keyword.) | Watcher's Follow-Up, Sash Whip, Crush Joints | Mach Punch (0: deal 4; Follow-up (attack): draw 1), Double Kick (1: deal 4 twice; Follow-up (skill): a third time), Sky Uppercut (2: deal 14; Follow-up (attack): Vulnerable 2; Crush Joints), Fighting Spirit (U power: when you play an attack after a skill or a skill after an attack, block 3) |
| **Counter** | `counter: N` (🥊 badge): until your next turn, each enemy attack on you deals N back. Payoffs read the hits you took **last enemy turn** (backward-looking; Dark's Punish reads the coming one). | Flame Barrier, Caltrops (one turn), Wallop | Vital Throw (1: block 8, Counter 4), Revenge (1: deal 8, 16 if you were hit last turn), Counter (U, 2: deal twice the HP you lost last enemy turn), Detect (U, 1: Counter 10. Exhaust), Bide (R, 1: store the HP you lose over the next 2 enemy turns, then deal twice that) |
| **Guts** | Big moves hurt you: they add **Sore** (a new status card: Unplayable. Ethereal) to your hand or pile. Payoffs per status card held or exhausted, which the enemy's junk feeds too. | Wild Strike, Reckless Charge, Power Through; Evolve | Close Combat (1: deal 14, add a Sore to your hand), Superpower (2: deal 24, shuffle 2 Sores into your draw pile), Reversal (U, 1: deal 6, +6 per status card in your hand), Steadfast (U power: whenever you draw a status card, draw 1; Evolve) |

Starting deck: Rock Smash x4 (deal 7), Mat Block x4 (block 7), **Low Kick** (2: deal 10, Vulnerable 2; Bash), Mach
Punch.

### Ground: Dig, Fault, Sandstorm

Heavy and patient. Hits Fire, Electric, Poison, Rock, Steel; fears Water, Grass, Ice.
- **Ability: Sturdy.** While it's out, once a fight, a hit that would knock you out leaves you at 1 HP.
- **Starters**: **Trapinch** (Trapinch, Vibrava, Flygon; Ground, then Ground / Dragon: the deck), Rhyhorn (Rhyhorn,
  Rhydon, Rhyperior; Ground / Rock). Sandile's line went to Dark.
- **Area: the Quarry** (the Desert keeps its Fire and cacti): the Dig Site, Mudflats, the Sinkhole, the Fault Line (the
  boss). Takes the Ground Pokémon, most of them the Desert's today (the Trapinch and Rhyhorn lines, Sandshrew, Phanpy, Diglett, Cubone,
  Hippopotas, Gligar, Baltoy...); rares the session picks. (Drilbur stays out: Excadrill is a main-game enemy.)

| Archetype | The rule | StS roots | Example cards |
|---|---|---|---|
| **Dig** | A **Dig** card goes underground when played (out of your hand, a ⛏️ counter on your plate) and surfaces at the start of your next turn, resolving its "Surface:" part then. Many block now and hit later. | Phantasmal Killer, Nightmare, Doppelganger | Dig (1: block 5. Surface: deal 12), Drill Run (U, 2: Surface: deal 22), Earth Power (U, 1: deal 6, +6 per card underground), Arena Trap (U power: whenever a card surfaces, draw 1) |
| **Fault** | `fault: N` on the enemy (🪨 badge): at the start of its turn, if its HP is at or below its Fault, it's knocked out. Elites and bosses count half their Fault. The execute, not a damage-over-time. | StS 2's Doom | Mud Bomb (1: deal 6, Fault 3), Bonemerang (1: deal 4 twice, Fault 2), Earthquake (U, 2: deal 12, Fault 5), Sand Tomb (U power: Fault 2 at the start of each turn), Fissure (R, 2: Fault 20. Exhaust) |
| **Sandstorm** | **Weather** (see Ice): Sandstorm N turns. At the end of your turn the enemy takes 3; your Ground blocks give +3 in Sandstorm. | as Hail | Sandstorm (1: Sandstorm 4), Sand Veil (as the basic block, +3 in Sandstorm), Sand Force (U power: in Sandstorm, your attacks deal +2), Smooth Rock (relic: as Icy Rock) |

Starting deck: Mud Shot x4 (deal 7), Sand Veil x4 (block 7), **Bulldoze** (2: deal 10, Weak 2; Bash), Dig.

### Flying: Evasion, Tailwind, Unburden

Light and quick: cheap cards, an empty hand, dodging. Hits Grass, Fighting, Bug; fears Electric, Ice, Rock.
- **Ability: Keen Eye.** When it comes out (the fight's start too, once a turn), draw 1.
- **Starters**: **Starly** (Starly, Staravia, Staraptor: the deck), Pidgey (Pidgey, Pidgeotto, Pidgeot), Pidove
  (Pidove, Tranquill, Unfezant). All Normal / Flying, Flying decks.
- **Area: the Windy Cliffs**: the Cliff Path, Nesting Ledges, the Rope Bridge, the Eyrie (the boss). Takes the
  birds from the Meadow, Forest, Wetland and Peak (Pidgey, Starly, Pidove, Spearow, Taillow, Hoothoot, Wingull, Swablu, Rufflet, Ducklett...);
  rares such as Skarmory and Aerodactyl.

| Archetype | The rule | StS roots | Example cards |
|---|---|---|---|
| **Evasion** | `evasion: N` on you (🪶 badge): each of the next N hits you take deals half, one stack per hit. | Silent's Blur, Wraith Form (Intangible, softened), Dodge and Roll | Feather Dance (1: Evasion 1, Weak 1), Air Slash (1: deal 8, +8 if you have Evasion), Fly (U, 2: Evasion 2, deal 12), Gale (U power: whenever Evasion halves a hit, deal 6) |
| **Tailwind** | `tailwind: N` turns (🌬️ badge): draw 1 more card each turn. Payoffs "in Tailwind". The neutral card called Tailwind (+1 PP next turn) gets a new name, its id kept (open 18). | Tools of the Trade, Wraith Form's timer | Tailwind (U, 1: Tailwind 3), Sky Attack (R, 2: deal 30, costs 0 in Tailwind), Hurricane (U, 2: deal 6 three times, four in Tailwind), Roost (C, 1: heal 4, block 6) |
| **Unburden** | "Unburden:" a bonus if your hand is empty after this card. Lots of 0-1 cost cards and small draws, the opposite of Water's Flow (which keeps cards). | Defect's FTL and Claw spam, Silent's Finesse, Grand Finale | Peck (0: deal 4. Unburden: draw 1), Acrobatics (1: deal 6, 12 if Unburden), Pluck (0: deal 3, draw 1), Brave Bird (R, 1: deal 20; Unburden: gain 1 PP) |

Starting deck: Gust x4 (deal 7), Feather Guard x4 (block 7), **Wing Attack** (2: deal 10, Evasion 1; Bash), Peck.

### Dark: Steal, Punish, Illusion

Sly. Hits Psychic and Ghost; fears Fighting and Bug.
- **Ability: Intimidate.** When it comes out (the fight's start too, once a turn), Weak 1 on the enemy.
- **Starters**: **Deino** (Deino, Zweilous, Hydreigon; Dark / Dragon: the deck), Sandile (Sandile, Krokorok,
  Krookodile; Ground / Dark, a Dark deck here). Zorua, Poochyena and Purrloin are 2-stage, so they stay area Pokémon.
- **Area: Night Alley** (the roadmap's): the Back Streets, the Night Market, the Rooftops, the Moonlit Square (the boss).
  Takes the Dark Pokémon, most of them the Forest's today (the Deino and Sandile lines, Poochyena, Purrloin,
  Zorua, Murkrow, Pawniard...); rares Absol, Umbreon. (Sableye is a main-game enemy, so it stays out.)

| Archetype | The rule | StS roots | Example cards |
|---|---|---|---|
| **Steal** | "Steal N": take up to N of the enemy's strength (it loses it, you gain it), or its block. Payoffs when it has buffs, and a little ₽ on knockouts. | Disarm, Sap (in reverse), Hand of Greed | Thief (1: deal 7, Steal 1), Knock Off (1: deal 8, +8 and remove its block if it has any), Snatch (U power: whenever the enemy gains strength, you gain 1), Covet (U, 1: deal 9; a knockout gives +15 ₽) |
| **Punish** | "Punish:" a bonus if the enemy **intends to attack** this turn (forward-looking), and Taunt to make it. | Spot Weakness, Go for the Eyes, Wallop | Payback (1: deal 7; Punish: +7), Assurance (1: block 7; Punish: Vulnerable 2), Taunt (U, 0: its next move becomes an attack. Exhaust), Punishment (U, 2: deal 10, +3 per strength it has) |
| **Illusion** | Named for Zorua's Ability, a duo trick: an **Illusion** card counts as your partner's type too (STAB whoever's out), and Disguise cards let you defend as your partner's type without switching. | Watcher's stance tricks; Mimic / Dual Wield | Disguise (1: block 8; until your next turn you defend as your partner's type), Night Daze (2: deal 14. Illusion), Copycat (U, 1: copy the last card of your partner's type you played this turn), Mirage (R power: your Dark cards count as both types) |

Starting deck: Bite x4 (deal 7), Obstruct x4 (block 7), **Thief** as the Bash (2: deal 10, Steal 2), Payback.

### The clash check

| Starting idea (roadmap) | Clash found | Now |
|---|---|---|
| Electric "Paralysis" | **Paralysis** is already the Wound-like status card enemies give you | The meter is **Static**, its effect "Paralyzed" (a word on the intent, not a card) |
| Ice "Freeze" | Another enemy-skips-a-turn meter would be Static again | **Frostbite**, a damage amp (open 15) |
| Ice "Hail" + Ground "Sandstorm" | Two weather keywords for one idea | **One Weather** with two kinds, one at a time (open 16) |
| Fighting "Combo" | **Combo N** is Fire's (Sizzly Slide) | **Follow-up** (the last card played, not how many) |
| Fighting "Counter" vs Dark "Punish" | Both "when it attacks" | Counter reads the hits you took; Punish the coming intent |
| Flying "Tailwind" | **Tailwind** is a neutral card | The neutral card is renamed (open 18) |
| Flying "cheap cards, draw" | Water's Flow is draw, Kindling cheap Cinders, Ice's Icicles 0-costs | **Unburden**: an *empty* hand, not a big one; Icicles grow, Peck draws |
| Dark "Steal" | Grass's Sap only lowers | Steal moves it to you |
| Ground "Dig" vs Flying "Fly" | Same move in the games | Dig is Ground's; Fly is one Evasion card |
| Electric Static vs Psychic Barrier | none | — |

Every type session also re-runs `tests/cards.test.mjs` with its new pool (no two cards a run can meet with the same
cost and text: a duo can meet two types' pools, the neutral pool and the Safari's signature cards), and the later of two
sessions run side by side does it after merging.

## 6. What every new type needs (the plumbing)

From the ~100 places that read `run.starter.type` today, per type: a `TYPES` entry (label, icon, colour) and the
real-chart row; its theme (`setTheme()`, the CSS type colours, card frame); `ABILITIES`; `POWER_LENS`; its held-item
relic in `TYPE_RELIC` (Magnet, Never-Melt Ice, Black Belt, Soft Sand, Sharp Beak, Black Glasses); its `only` relics
(**6 a type** to start, not Fire's 13: a duo's pool already holds two types' worth; open 21) and 2 items (a Gem and a
Drive); `BASICS` (the Unown Tablet); the PC Box; `describe()` and `cardTerms()` lines for each keyword, `TERM_KIND`
colours; `ART` lines for every card; the starter's front / back / shiny GIFs per stage, `SPRITE_FIT`, `BODY_X`, cries in
`CRIES`; the Safari Pokédex moves (pages are built from the areas, earned stays earned); the sim mirror and its relic
ranks.

## 7. Sessions (the roadmap's list, refined)

0. This doc, approved.
1. **The duo, the Duo Run screen and the duo pool** on Fire / Grass / Water (sections 1-3): the helpers, switching,
   STAB, the bench chip, the save, the sim mirror and its bot policy, a bot check of the 3 pairs vs solo.
2. **The real chart in the Safari** (section 4): types on every Safari Pokémon and move, the chart, the hints, the solo
   Daily run's bot check per type.
3-14. **Each type in two sessions**, in the order Electric, Ice, Fighting, Ground, Flying, Dark (Ground after Ice:
   Sandstorm uses the Weather engine Ice builds). The first session builds the mechanics, the Ability, the starting
   deck and ~35 cards; the second the other ~35, the starters (sprites, cries) and the area's **data** (its roster moved
   in, its stages, the catch that adds the type), on an existing area's painter recoloured **(open 22)**.
   - **The new areas are date-gated** (`areasFor(day)`): days before the launch keep their 6, so a launch mid-day can't
     change that day's run and leaderboard; from launch on, 3 of the 12 a day.
15. **The balance pass** over all 36 pairs and the solo Daily run, patch notes, a githack link.
- After 15, or beside it: **the new areas' art** (each area's scene, intro film, boss prelude and arena, map palette,
  like Safari phases 5b-5d), one or two areas a session, if open 22 goes that way.

## 8. The user's answers (2026-10-19)

The 22 open choices, clicked through as answer cards. Where the user wrote their own answer, it's quoted.

1. **HP**: one shared bar. (Asked what a bar each would cost: ~500 HP touchpoints across the game and sim, a fainting
   rule, about one more high-effort session; then chose the shared bar.)
2. **Switch cost**: 1 PP every time, with a few free-switch cards and a relic.
3. **STAB**: x1.2 on attack damage.
4. **Defending type**: the deck's type.
5. **Abilities**: only the one out's; fight-start ones the first time each partner comes out.
6. **Starting deck**: 5 + 5 (each type's 2 attacks, 2 blocks and Bash-like signature).
7. **Card rewards**: one of each type, the third 50/50.
8. **Who's out first**: whoever was out when the last fight ended.
9. **Name**: Duo Run.
10. **Tries**: "a replay with the day pass, duo runs only unlock for the day when you complete your daily free safari
    run": finished counts, won or lost (asked).
11. **Picking**: a type from your pool, its look any owned starter of that type.
12. **Old catches**: count.
13. **The chart**: Gen 5, no immunities, capped to x1.3 / x0.75.
14. **Psychic chips on Safari wilds**: shown.
15. **The stun**: Electric's Static; Ice gets Frostbite.
16. **Weather**: one engine, Hail for Ice and Sandstorm for Ground.
17. **Combo**: Fighting's is Follow-up; Fire keeps Combo.
18. **Tailwind**: the neutral card is renamed (id `tailwind` kept); Flying owns Tailwind.
19. **Dark's third**: Illusion.
20. **Starters**: "I only want 3 stage starters if possible" (2-stage lines were disliked). From every 3-stage Gen 1-5
    line that fits: Electric **Shinx** + Mareep, Pichu, Elekid, Tynamo; Ice **Vanillite** + Swinub; Fighting **Timburr**
    + Machop; Ground **Trapinch** + Rhyhorn; Flying **Starly** + Pidgey, Pidove; Dark **Deino** + Sandile (bold: the
    deck's). No 2-stage rule is needed.
21. **Type relics**: 6 per new type plus its held item.
22. **The new areas' art**: data first on a recoloured existing area; the full art in visual sessions afterwards.

### Session 1b's answers: two decks (2026-10-19)

The user's call after session 1 ("as if you're controlling two completely different starters"), then six answer cards:

23. **Hands**: two hands a turn. Asked first about discard-and-draw ("You really would do a discard?"): Claude agreed it
    let a switch back and forth draw a new 5 each time, and proposed this instead: each partner has its own hand, a
    switch swaps which you hold, its first time out in a turn draws its own, and both hands discard at the turn's end.
24. **Switch cost**: 1 PP, re-measured with two decks.
25. **The bench's piles**: untouched while benched.
26. **Card rewards**: one of each type, the third either; each joins its type's deck; a Neutral card asks who takes it.
27. **Deck picks** (Mart, Center, PC, events): both decks in one picker, grouped under each partner.
28. **The save**: `run.duo.decks`; a session 1 duo save on the branch is dropped.

**Bot check** (human bot, Safari days, `safariCfg({ catch: true, catchAt: 0.3, duo })`, the bot that fetches the
partner's hand keeping 2 PP back; 300 a duo cell, 150 the rest; noise ~±6 / ±8), win %:

| | fire+grass | fire+water | grass+water |
|---|---|---|---|
| two decks, the default bot | 80.0 | 55.7 | 49.7 |
| `noFetch` (switch only to dodge a ▲ hit) | 70.0 | 55.3 | 46.0 |
| `fetchHold1` (keep only the switch's PP back) | 56.7 | 33.3 | 36.0 |

Solo, the same bot, 150 a type: fire 81.3, grass 78.7, water 67.3. Session 1's 5 + 5 under its own bot: 66.7 / 56.0 / 59.3.
- **Fire + Grass is level with solo**; the Water pairs trail their solo types by ~15-25 points (grass+water dies in the
  first biome a quarter of the time with the fetch, 3% without), so Water in a duo is the balance pass's first job.
- **Is the switch worth 1 PP now?** (session 1's finding b): for a fresh hand, yes when 2 PP stay back to play it
  (+10 on fire+grass, level on the others); keeping only 1 back loses 13-22 points. A cheaper switch isn't needed; how
  much a fetch buys depends on the pair, so the free-switch cards stay as planned. Left for session 15.
