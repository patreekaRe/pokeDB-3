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

**Bot check** (pokeDB-sim, human bot, Safari days, `safariCfg({ catch: true, catchAt: 0.3, duo })`; 300 a duo cell,
150 solo), win %: ice+fire / +grass / +water / +electric 66.7 / 62.0 / 56.3 / 67.0, against session 5's Ice
(`iceFirst`: these 36 cards, the relics and items out, the same game files and days) 70.7 / 66.7 / 58.3 / 64.0; solo Ice
(main game, L0) 78.7 both. Every gap is inside a cell's noise (about ±5.5 at 300): unlike Electric's second half
(~7 under), Ice's holds its level, still the strong partner for Grass and Water. Against session 5's own numbers (67.0 /
61.7 / 62.3 / 70.3) only ice+water moved, and `iceFirst` moved with it, so that's the Ice Cave in the day's areas, not
the cards. Relic ranks (strong bot, solo Ice, 150 each, prog over `none` 19.80): Ice Stone +3.0, Safety Goggles +2.0,
Never-Melt Ice +1.2, Ice Memory +1.0, Icy Rock +0.7, Icicle Plate +0.6, Snowball +0.3. Left for the balance pass
(session 15).

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

#### Fighting's first session: its cards (session 7, 2026-10-19)

Written here before the code, as Electric's and Ice's were. 30 cards in the pools (10 common, 14 uncommon, 6 rare) and
all 8 evolution cards, so a run with Fighting is whole; session 8 adds the other ~36, the relics, items, Machop's look and
Dojo Mountain. Each card is on a StS 1 card at x~1.2 (its model in the last column and in a comment on its line) with a
hand-picked upgrade. The deck is Fire's shape from the start (3 attacks, an Iron Wave, 4 blocks, the Bash and a second
signature), Electric's lesson.

**The rules** (`js/battle.js`, mirrored in pokeDB-sim's `sim/engine.js`):
- **Follow-up** (`ifAfterAttack` / `ifAfterSkill`, extras like `ifHail`): the bonus happens if the last card you played
  this turn, before this one, was an attack / a skill (`b.lastKind`; a power or a status card is neither, and a turn's
  first card has none). Iron Fist (`followAlways`) makes every Follow-up happen. A card in your hand whose Follow-up
  would happen now glows.
- **Counter** (`counter: N` on you, `b.counter`, a 🥊 badge): until your next turn, each enemy attack deals N back (through
  its block, like Rocky Helmet; guarded or not). It's gone at the start of your turn. What the payoffs read is the
  **last enemy turn**: `b.attackedLast` (it attacked you, guarded or not) and `b.lostLast` (the HP its attacks took).
  `ifAttacked` extras, `perLost` (+N per HP lost then). **Bide** (`bide: 2`, `b.bide`, a ⏳ badge): the HP you lose over
  the next 2 enemy turns (what their attacks take) is stored; at the start of your turn after the second, it deals twice
  that, through the enemy's block.
- **Guts**: big moves add **Sore** (a status card: Unplayable. Ethereal; `addCard` to your hand or draw pile). Payoffs per
  status card in your hand (`perStatusHeld`, any status card: the Safari's Paralysis, Confusion and Poison too), or
  when one is drawn (Steadfast's `statusDraw`) or exhausted (Defiant's `statusStrength`, a faded Ethereal one too).
- **Guts** (the Ability, `ABILITIES.fighting`): while Fighting is out and a status card is in your hand, your attacks deal +3.
- Powers: `mixBlock` (Fighting Spirit: an attack after a skill or a skill after an attack), `counterEachTurn`,
  `hurtStrength` (Anger Point: whenever an enemy attack takes your HP), `statusDraw`, `statusStrength`, `followAlways`.

| Card | Rarity | Cost | Effect | Arch | StS |
|---|---|---|---|---|---|
| Rock Smash | C | 1 | Deal 8 *(up 11)* | — | Strike |
| Mat Block | C | 1 | Block 8 *(up 11)* | — | Defend |
| Low Kick | C | 2 | Deal 10, Vulnerable 2, Weak 2 *(up 12, 3, 3)* | — | Bash (+ Weak, as Icy Wind) |
| Vital Throw | C | 1 | Block 10, Counter 4 *(up 13, 6)* | Counter | Iron Wave, Counter for its hit (Flame Barrier's shape) |
| Mach Punch | C | 0 | Deal 4; Follow-up (attack): draw 1 *(up 6)* | Follow-up | Follow-Up, at 0 with a draw for its PP |
| Double Kick | C | 1 | Deal 4 twice; Follow-up (skill): a third time *(up 5)* | Follow-up | Twin Strike + Sash Whip's condition |
| Karate Chop | C | 1 | Deal 9; Follow-up (skill): Vulnerable 1 *(up 11, 2)* | Follow-up | Crush Joints |
| Revenge | C | 1 | Deal 6; if the enemy attacked you last turn, +6 *(up 8, +8)* | Counter | (Counter's Bane: a condition doubles it) |
| Close Combat | C | 1 | Deal 14, add a Sore to your hand *(up 18)* | Guts | Wild Strike |
| No Retreat | C | 1 | Block 12, add a Sore to your hand *(up 15)* | Guts | Power Through (one Sore: it fades) |
| Sky Uppercut | U | 2 | Deal 14; Follow-up (attack): Vulnerable 2 *(up 18, 3)* | Follow-up | Uppercut |
| Arm Thrust | U | 1 | Deal 3 twice; Follow-up (attack): 2 more hits *(up 4)* | Follow-up | Flurry of Blows, in a chain |
| Force Palm | U | 1 | Deal 7; Follow-up (skill): +1 PP *(up 10)* | Follow-up | Follow-Up |
| Parry | U | 1 | Block 7; Follow-up (attack): draw 2 *(up 10)* | Follow-up | Sash Whip's other half: a skill after an attack |
| Fighting Spirit | U | 1 | Power: an attack after a skill or a skill after an attack, block 3 *(up 4)* | Follow-up | Mental Fortress |
| Storm Throw *(bridge)* | U | 1 | Deal 8; Follow-up (skill): Counter 5 *(up 10, 7)* | Follow-up/Counter | Crush Joints, Counter for its Vulnerable |
| Counter | U | 1 | Deal 5, +2 per HP you lost last enemy turn *(up 8)* | Counter | (Counter's Perfected Strike, per HP lost) |
| Detect | U | 0 | Counter 8. Exhaust *(up 12)* | Counter | Flame Barrier's thorns, free and once |
| Circle Throw | U | 2 | Block 12, Counter 6 *(up 15, 8)* | Counter | Flame Barrier |
| Counterstance | U | 1 | Power: at the start of each turn, Counter 3 *(up 5)* | Counter | Caltrops |
| Superpower | U | 2 | Deal 24, shuffle 2 Sores into your draw pile *(up 30)* | Guts | Reckless Charge, Bludgeon-sized |
| Reversal | U | 1 | Deal 6, +6 per status card in your hand *(up 9, +8)* | Guts | Perfected Strike, on status cards |
| Steadfast | U | 1 | Power: whenever you draw a status card, draw 1 *(up cost 0)* | Guts | Evolve |
| Coaching | U | 1 | Gain 2 strength, add a Sore to your hand *(up 3)* | Guts | Spot Weakness, paid with a Sore |
| Iron Fist | R | 2 | Power: every Follow-up happens, whatever you played before *(up cost 1)* | Follow-up | (Follow-up's Barricade) |
| High Jump Kick | R | 2 | Deal 20; Follow-up (skill): +14 *(up 26, +16)* | Follow-up | Bludgeon, at 2 after a skill |
| Bide | R | 1 | Store the HP you lose over the next 2 enemy turns, then deal twice that *(up cost 0)* | Counter | (Counter's own: a delayed hit) |
| Anger Point *(bridge)* | R | 2 | Power: whenever an enemy attack takes your HP, gain 1 strength *(up cost 1)* | Counter/Guts | Rupture, on the enemy's hits |
| Meteor Assault | R | 2 | Deal 26, add 2 Sores to your hand *(up 34)* | Guts | Bludgeon, at 2 with two Sores |
| Defiant | R | 1 | Power: whenever a status card is exhausted, gain 1 strength *(up cost 0)* | Guts | Dark Embrace, as strength |

Evolution cards (evo-only, 1 copy; one per archetype and one general a tier):

| Card | Tier | Cost | Effect | Arch |
|---|---|---|---|---|
| Power-Up Punch | 1st | 1 | Deal 8; Follow-up (attack): gain 2 strength | Follow-up |
| Wide Guard | 1st | 1 | Block 10, Counter 5 | Counter |
| Submission | 1st | 1 | Deal 16, add a Sore to your hand | Guts |
| Cross Chop | 1st | 2 | Deal 18, draw 1 | — |
| Triple Kick | final | 1 | Deal 6 three times; Follow-up (attack): +1 PP | Follow-up |
| Seismic Toss | final | 1 | Block 12, Counter 12 | Counter |
| Dynamic Punch | final | 2 | Deal 24, +4 per status card in your hand | Guts |
| Flying Press | final | 3 | Deal 34, Vulnerable 2 | — |

Fighting so far: 10 common, 14 uncommon, 6 rare, 8 evolution = **38**, plus the Sore status card.

**Starting deck**: Rock Smash x3, **Vital Throw**, Mat Block x4, Low Kick, Mach Punch.

**Bot check** (pokeDB-sim, human bot; duos on Safari days, `safariCfg({ catch: true, catchAt: 0.3, duo })`; solo the
main game at Level 0), win %. The first draft (Low Kick 10 + Vulnerable 2, Vital Throw block 8), 150 a cell: solo
Fighting 43.3 against solo Fire 68.0; fighting+fire 62.0, +grass 42.0, +water 48.7, +electric 45.3, +ice 52.0. Screened
on solo / +fire / +grass: Low Kick + Weak 1 63 / 65 / 43, + Weak 2 77 / 62 / 39, Vital Throw block 10 52 / 63 / 45, Guts
at 5 43 / 60 / 34, Close Combat for Mach Punch in the deck 42 / 49 / 31, **Low Kick + Weak 2 and Vital Throw 10** 76 / 70
/ 62. Shipped with both, 300 a cell: **solo Fighting 79.3; fighting+fire 67.0, +grass 57.7, +water 49.3, +electric
64.3, +ice 73.0** (Ice's: ice+fire / +grass / +water / +electric 66.7 / 62.0 / 56.3 / 67.0; Electric's with Fire / Grass /
Water 64.7 / 43.7 / 36.3; fire+grass 80, fire+water 56, grass+water 50). Fighting sits with Ice, a good partner for
Electric; its Water pair trails like every Water pair, for the balance pass (session 15).

#### Fighting's second session: its other cards (session 8, 2026-10-20)

Written here before the code, as Electric's and Ice's seconds were. The other 36 pool cards (10 common, 18 uncommon, 8
rare), **defence-leaning**: 31 of the 36 block, Weaken, Sap or Counter (the first half's 30 are mostly hits). Fighting is
then whole: 20 common, 32 uncommon, 14 rare and 8 evolution cards (74), plus the Sore status card. Each card is on a StS
1 card at x~1.2 (the last column and a comment on its line) with a hand-picked upgrade.

**The new rules** (`js/battle.js`, mirrored in pokeDB-sim's `sim/engine.js`):
- `blockPerLost` / `blockPerStatusHeld`: +N block per HP you lost last enemy turn / per status card in your hand
  (Endeavor, Grit, Iron Will); `counterPerStatus` / `counterPerLost`: Counter the same way (Last Stand, Final Gambit).
  All are folded into the card's block or Counter in `effectsOf()`, so the raised card's preview shows them.
- **"Whenever a Follow-up happens"**: a card whose `ifAfterAttack` / `ifAfterSkill` paid (Iron Fist's too), read before
  the card's own kind is recorded.
- Powers: `followBlock` (whenever a Follow-up happens, block N: Inner Focus), `followCounter` (... Counter N: No Guard),
  `counterBlock` (whenever your Counter hits back, N block next turn: Justified; next turn, as block gained in the enemy's
  turn would be gone before it mattered), `statusBlock` (whenever a status card is exhausted, block N: Vital Spirit),
  `statusHeldBlock` (at the start of each turn, after the draw, N block per status card in your hand: Gritted Teeth),
  `counterKeep` (your Counter no longer goes away at the start of your turn: Stand Firm, not "Sturdy": that is Ground's
  Ability).

| Card | Rarity | Cost | Effect | Arch | StS |
|---|---|---|---|---|---|
| Rolling Kick | C | 1 | Deal 6; Follow-up (skill): Weak 2 *(up 9)* | Follow-up | Sash Whip, after a skill |
| Feint | C | 0 | Block 4; Follow-up (attack): Weak 1 *(up 6)* | Follow-up | Deflect with Sash Whip's Weak |
| Low Sweep | C | 1 | Deal 5, Weak 1; Follow-up (skill): block 6 *(up 7, 8)* | Follow-up | Iron Wave, in a chain |
| Retaliate | C | 1 | Block 6; if the enemy attacked you last turn, +6 *(up 8, +8)* | Counter | Revenge as block (Bane's condition) |
| Endeavor | C | 1 | Block 4, +1 per HP you lost last enemy turn *(up 7)* | Counter | (Counter's Spirit Shield, per HP lost) |
| Vacuum Wave | C | 0 | Deal 3, Counter 3 *(up 4, 5)* | Counter | a Shiv with Flame Barrier's thorns |
| Wake-Up Slap | C | 1 | Deal 6; if the enemy attacked you last turn, Weak 2 *(up 8, 3)* | Counter | Sucker Punch, on last turn's hit |
| Hammer Arm | C | 2 | Deal 12, Weak 2, add a Sore to your hand *(up 15)* | Guts | Clothesline, paid with a Sore |
| Grit | C | 1 | Block 6, +3 per status card in your hand *(up 8, +4)* | Guts | (Guts' Spirit Shield, on status cards) |
| Shed Skin | C | 1 | Exhaust every status card in your hand. Block 7 *(up 10)* | Guts | Purity with a Defend |
| Inner Focus | U | 1 | Power: whenever a Follow-up happens, block 3 *(up 4)* | Follow-up | Mental Fortress, on Follow-ups |
| Dual Chop | U | 1 | Deal 4 twice; Follow-up (skill): Weak 1 *(up 5)* | Follow-up | Twin Strike with Sash Whip's Weak |
| Brick Break | U | 1 | Deal 7; Follow-up (attack): Sap 1 *(up 10)* | Follow-up | Disarm, in a chain |
| Kata | U | 1 | Block 8; Follow-up (skill): block 4 *(up 10, 5)* | Follow-up | Defend, chained |
| Jump Kick | U | 1 | Deal 9; Follow-up (attack): next turn, block 6 *(up 12)* | Follow-up | Dodge and Roll on a Strike, in a chain |
| Sidestep *(bridge)* | U | 1 | Block 7; Follow-up (attack): Counter 5 *(up 10, 7)* | Follow-up/Counter | Storm Throw's other half |
| Brace *(bridge)* | U | 1 | Block 10, add a Sore to your hand; Follow-up (attack): draw 1 *(up 13)* | Follow-up/Guts | Power Through, with Sash Whip's condition |
| Justified | U | 1 | Power: whenever your Counter hits back, 3 block next turn *(up 4)* | Counter | (Counter's Wired: Flame Barrier pays twice) |
| Payback | U | 1 | Block 7; if the enemy attacked you last turn, Weak 2 *(up 10)* | Counter | Leg Sweep-lite, on last turn's hit |
| Arm Lock | U | 1 | Weak 2, Counter 5 *(up 3, 7)* | Counter | Blind with Flame Barrier's thorns |
| Guard Stance | U | 1 | The enemy's attacks deal 5 less this turn, Counter 5 *(up 7, 7)* | Counter | Piercing Wail with thorns |
| Reflex | U | 0 | Block 3, Counter 3, draw 1 *(up 5, 5)* | Counter | Deflect and Flame Barrier, with a draw |
| Last Stand *(bridge)* | U | 1 | Counter 4, +3 per status card in your hand *(up 6, +4)* | Counter/Guts | Flame Barrier, per status card |
| Vital Spirit | U | 1 | Power: whenever a status card is exhausted, block 4 *(up 6)* | Guts | Feel No Pain, on status cards |
| Iron Will | U | 2 | Block 10, +4 per status card in your hand *(up 13, +5)* | Guts | Grit's big brother |
| Scrappy | U | 1 | Block 8, Weak 1, add a Sore to your hand *(up 11, 2)* | Guts | Power Through-lite, with a Weak |
| Grin and Bear It | U | 2 | Block 16, shuffle 2 Sores into your draw pile *(up 20)* | Guts | Power Through |
| Intimidate | U | 1 | Weak 1, Sap 1 *(up Weak 2)* | — | Disarm-lite, with a Weak |
| Stand Firm | R | 2 | Power: your Counter no longer goes away at the start of your turn *(up cost 1)* | Counter | (Counter's Barricade) |
| Final Gambit | R | 1 | Counter twice the HP you lost last enemy turn. Exhaust *(up cost 0)* | Counter | (Counter's own cash-in) |
| No Guard *(bridge)* | R | 1 | Power: whenever a Follow-up happens, Counter 3 *(up 5)* | Follow-up/Counter | Mental Fortress, as thorns |
| Sacred Sword | R | 2 | Deal 14, Weak 2; Follow-up (skill): block 12 *(up 18)* | Follow-up | Carnage-lite, with Leg Sweep after a skill |
| Mind's Eye | R | 0 | Block 4; Follow-up (attack): draw 2; Follow-up (skill): +1 PP *(up 6)* | Follow-up | (Follow-up's own: either order pays) |
| Gritted Teeth | R | 1 | Power: at the start of each turn, 3 block per status card in your hand *(up 4)* | Guts | (Guts' Metallicize) |
| Second Wind | R | 1 | Exhaust every status card in your hand; 6 block for each, draw 2 *(up 8)* | Guts | Second Wind, on status cards |
| Body Press | R | 2 | Block 12, then deal damage equal to your block *(up 16)* | — | Body Slam with the block first |

Fighting whole: 20 common (Follow-up 6, Counter 6, Guts 5, 3 basics), 32 uncommon, 14 rare, 8 evolution = **74**.

**Relics** (`only: 'fighting'`, 6 plus its held item; the user's answer 21). The doc named **Black Belt** the held item,
but `black-belt` is the old strength relic (and a badge), so the held item is **Expert Belt** (`expert-belt`, common:
your Fighting attacks deal +2; its PokéSprite art was already in `assets/items/`), and Black Belt stays as it is.
**Ring Target** (common: you start each battle with Counter 8; Light Ball's shape), **Focus Band** (common: whenever a
Follow-up happens, gain 3 block), **Protector** (uncommon: whenever you gain Counter, gain 2 more), **Weakness Policy**
(uncommon: whenever a status card is exhausted, gain 3 block), **Fighting Memory** (rare: at the start of your turn,
your Counter halves instead of going away), **Fightinium Z** (boss: draw 1 more each turn, and Guts gives +6, not +3;
Water Stone's shape: Fighting has no evolution stone). **Items**: **Fighting Gem** (gain 8 block, Counter 8) and **Red
Card** (double your Counter; there's no Fighting Drive, so it takes the Drive's place).

**Starters**: Machop (Machop, Machoke, Machamp), a `DUO_STARTERS` skin of Timburr's deck (`FIGHTING_DECK`), as Swinub
is of Vanillite's. Catching any stage adds Fighting with that look (`DUO_LINES.fighting`).

**Dojo Mountain** (`dojomountain`): Trailhead, Training Steps, Waterfall Dojo, the Summit Ring. Its roster is every
Fighting-typed Safari Pokémon (30): the Peak's 18 (the Machop, Mankey, Makuhita, Timburr, Meditite lines, Tyrogue and
the three Hitmons, Riolu and Lucario), the Forest's Mienfoo line, Throh, Sawk, Breloom, Heracross and Gallade, the
Marsh's Croagunk line, the Desert's Scraggy line and the Wetland's Poliwrath, moved in. Its rare spawns are the ones
already rare (Riolu, Lucario, Heracross, Gallade): the Hitmons stay wild, as making them rare would change the days
before the gate. Painted as the **Desert recoloured** to a granite mountainside under a clear sky until its art session
(the Power Plant borrows the Peak and the Ice Cave the Wetland). **Date-gated** like them (`SAFARI_FROM`, 2026-10-20 on
the branch: move it to the day after the branch goes live); from then, 3 of the 9 a day.

**Bot check** (pokeDB-sim, human bot; duos on Safari days, `safariCfg({ catch: true, catchAt: 0.3, duo })`, 300 a cell;
solo the main game at Level 0, 150), win %: fighting+fire / +grass / +water / +electric / +ice 62.0 / 51.0 / 45.3 / 54.7 /
67.3, against session 7's Fighting (`fightFirst`: these 36 cards, the 7 relics and 2 items out, the same game files and
days) 73.0 / 57.0 / 50.3 / 56.3 / 70.7; solo Fighting 87.3 against 76.0. Solo gains, every pair dips: ~5 points on
average, like Electric's second half (~7), against session 7's own numbers (67.0 / 57.7 / 49.3 / 64.3 / 73.0) ~6.
Screens at 150 on +fire / +grass: the cards in but the relics and items out (`fightNoRelics`) 74.7 / 55.3, the relics
and items in but the cards out (`fightNoCards`) 69.3 / 48.0; on +fire alone, without the items 66.7, without the relics
64.0, everything in 66.7. No one part carries the dip, and most single gaps sit inside a cell's noise (about ±5.5 at
300, ±8 at 150): left for the balance pass (session 15). Relic ranks (strong bot, solo Fighting, 150 each, prog over
`none` 18.77): Fightinium Z +3.3, Weakness Policy +2.0, Expert Belt +1.8, Focus Band +1.5, Protector +0.9, Fighting
Memory +0.5, Ring Target +0.4.

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

#### Ground's first session: its cards (session 9, 2026-10-20)

Written here before the code, as the other types' were. 30 cards in the pools (10 common, 14 uncommon, 6 rare) and all
8 evolution cards, so a run with Ground is whole; session 10 adds the other ~36, the relics, items, Rhyhorn's look and
the Quarry. Each card is on a StS 1 card at x~1.2 (its model in the last column and in a comment on its line) with a
hand-picked upgrade. The deck is Fire's shape (3 attacks, an Iron Wave, 4 blocks, the Bash and a second signature).

**The rules** (`js/battle.js`, mirrored in pokeDB-sim's `sim/engine.js`):
- **Dig** (`surface: { ... }` on a card's effects): what's outside `surface` happens when it's played; then the card
  goes **underground** (`b.underground`, a ⛏️ badge with the count) instead of to the discard pile. At the start of your
  next turn, after the hand is drawn, each surfaces in the order dug: its Surface part resolves (its hits through the
  usual damage, STAB and the chart for whoever is out then), then it goes to its own deck's discard pile (a duo's
  partner's if it was dug by the partner). It isn't a card played (no Follow-up, no "per card played"). Payoffs:
  `perUnder` (+N per card underground), powers `surfaceDraw` (Arena Trap), `surfaceDamage` (Excavate).
- **Fault** (`fault: N`, `enemy.fault`, a 🌋 badge: the Safari's Rock has 🪨): stacks and never wears off. At the start of the enemy's turn,
  after Burn and Leech Seed, if its HP is at or below its Fault it's knocked out (`felledBy: 'fault'`). Alphas and bosses
  count half their Fault (the badge shows the number that counts). StS 2's Doom. Payoffs `perFault` (+N per Fault),
  `faultMult`, powers `faultEachTurn`, `sandFault` (whenever Sandstorm hurts the enemy).
- **Sandstorm** (the Weather engine's second kind, `setWeather('sand', n)`, a 🏜️ badge): at the end of your turn the
  enemy loses `SAND.chip` (3) through its block, then a turn goes; while it lasts every block a Ground card gives is
  +`SAND.bonus` (3), its Surface part's too. Hail's own powers (Ice Age, Polar Vortex, Icefall) read Hail only; Weather
  Ball's "any weather" reads both. `ifSand` extras, powers `sandAttack` (Sand Force: +2 on every hit in Sandstorm),
  `sandEachTurn` (Sand Stream).
- **Sturdy** (the Ability, `ABILITIES.ground`): while Ground is out, once a fight, a hit that would knock you out leaves
  you at 1 HP (after Focus Sash, which goes first).

| Card | Rarity | Cost | Effect | Arch | StS |
|---|---|---|---|---|---|
| Mud Shot | C | 1 | Deal 8 *(up 11)* | — | Strike |
| Sand Veil | C | 1 | Block 8 *(up 11)* | — | Defend |
| Bulldoze | C | 2 | Deal 10, Weak 2, Fault 5 *(up 12, 3, 7)* | Fault | Bash, Fault for its Vulnerable (+ Weak, as Icy Wind) |
| Sand Attack | C | 1 | Block 10, Fault 3 *(up 13, 4)* | Fault | Iron Wave (Frost Armor's shape) |
| Dig | C | 1 | Block 6. Surface: deal 12 *(up 8, 15)* | Dig | Iron Wave over two turns |
| Tunnel | C | 0 | Surface: deal 7 *(up 10)* | Dig | a free Strike, a turn late (Doppelganger's delay) |
| Mud Bomb | C | 1 | Deal 6, Fault 5 *(up 8, 7)* | Fault | Poisoned Stab |
| Bonemerang | C | 1 | Deal 4 twice, Fault 3 *(up 5, 4)* | Fault | Twin Strike |
| Sandstorm | C | 1 | Sandstorm 4 *(up cost 0)* | Sandstorm | Noxious Fumes, as a timer (Hail's twin) |
| Mud-Slap | C | 1 | Deal 7; in Sandstorm, Weak 2 *(up 9, 3)* | Sandstorm | Sucker Punch |
| Drill Run | U | 1 | Deal 5. Surface: deal 10 *(up 7, 13)* | Dig | Pummel, split over two turns |
| Earth Power | U | 1 | Deal 6, +6 per card underground *(up 8, +8)* | Dig | Perfected Strike, per card dug |
| Shore Up | U | 1 | Block 7. Surface: block 7 *(up 10, 10)* | Dig | Dodge and Roll |
| Arena Trap | U | 1 | Power: whenever a card surfaces, draw 1 *(up cost 0)* | Dig | (Dig's Evolve) |
| Spikes *(bridge)* | U | 1 | Block 5. Surface: Fault 8 *(up 7, 11)* | Dig/Fault | Caltrops, laid underground |
| Sinkhole *(bridge)* | U | 1 | Surface: deal 10, Sandstorm 2 *(up 14, 3)* | Dig/Sandstorm | (a delayed Noxious Fumes with a hit) |
| Earthquake | U | 2 | Deal 12, Fault 6 *(up 15, 8)* | Fault | Uppercut |
| Mud Sport | U | 1 | Fault 8 *(up 11)* | Fault | Deadly Poison |
| Stomping Tantrum | U | 1 | Deal 6, +1 per Fault *(up 8)* | Fault | Bane, per Fault |
| Quicksand | U | 1 | Power: at the start of each turn, Fault 3 *(up 4)* | Fault | Noxious Fumes |
| Dust Devil *(bridge)* | U | 1 | Sandstorm 2, Fault 5 *(up 3, 7)* | Sandstorm/Fault | Noxious Fumes + Deadly Poison (Snowscape's shape) |
| Land's Wrath | U | 2 | Deal 12; in Sandstorm, +8 *(up 15, +10)* | Sandstorm | Carnage, in the weather |
| Sand Rush | U | 1 | Draw 2; in Sandstorm, +1 PP *(up draw 3)* | Sandstorm | Adrenaline, in the weather |
| Sand Force | U | 1 | Power: in Sandstorm, your attacks deal +2 a hit *(up 3)* | Sandstorm | Inflame, in the weather |
| Fissure | R | 2 | Fault 20. Exhaust *(up 28)* | Fault | (Fault's Catalyst: one big stack) |
| Precipice Blades | R | 2 | Deal 10, double the enemy's Fault *(up 14)* | Fault | Catalyst, with a hit |
| Landslide | R | 2 | Surface: deal 30 *(up 38)* | Dig | Bludgeon, a turn late |
| Excavate | R | 1 | Power: whenever a card surfaces, deal 7 *(up 10)* | Dig | (Dig's Thousand Cuts) |
| Sand Stream | R | 2 | Power: at the start of each turn, Sandstorm 1 *(up cost 1)* | Sandstorm | (Sandstorm's Wraith Form, kept up) |
| Desert Spirit *(bridge)* | R | 2 | Power: whenever Sandstorm hurts the enemy, Fault 4 *(up cost 1)* | Sandstorm/Fault | (Ice Age's twin) |

Evolution cards (evo-only, 1 copy; one per archetype and one general a tier):

| Card | Tier | Cost | Effect | Arch |
|---|---|---|---|---|
| Burrow | 1st | 1 | Block 8. Surface: deal 14 | Dig |
| Magnitude | 1st | 1 | Deal 8, Fault 8 | Fault |
| Sand Spit | 1st | 2 | Deal 14, Sandstorm 2 | Sandstorm |
| High Horsepower | 1st | 2 | Deal 18, Weak 1 | — |
| Thousand Arrows | final | 2 | Block 10. Surface: deal 24 | Dig |
| Thousand Waves | final | 1 | Deal 6, Fault 14 | Fault |
| Sandsear Storm | final | 2 | Deal 20, Sandstorm 3 | Sandstorm |
| Headlong Rush | final | 3 | Deal 34, block 8 | — |

Ground so far: 10 common, 14 uncommon, 6 rare, 8 evolution = **38**.

**Starting deck**: Mud Shot x3, **Sand Attack**, Sand Veil x4, Bulldoze, Dig.

**Bot check** (pokeDB-sim, human bot; duos on Safari days, `safariCfg({ catch: true, catchAt: 0.3, duo })`; solo the
main game at Level 0), win %, 300 a cell: **solo Ground 71.3** (solo Fire 68.0 under the same bot, 150); **ground+fire
66.0, +grass 55.6, +water 51.6, +electric 50.3, +ice 57.4, +fighting 55.4**. Screened (150): Bulldoze with Vulnerable 2
lifts solo to 80.7 but no pair (+grass 52.7, +electric 54.7, +ice 60.7), so it shipped as written. Against the others'
first sessions (Fighting's with Fire / Grass / Water / Electric / Ice 67 / 58 / 49 / 64 / 73, Ice's 67 / 62 / 62 / 70)
Ground sits with them on Fire, Grass and Water and ~10 under on Electric and Ice; its Grass and Electric pairs lose a
sixth of their runs at the first area's boss (Ground fears Grass, Water and Ice wilds; Electric fears Ground ones): for
the balance pass (session 15).

#### Ground's second session: its other cards (session 10, 2026-10-20)

Written here before the code, as Fighting's second was. The other 36 pool cards (10 common, 18 uncommon, 8 rare),
**defence-leaning**: 34 of the 36 block, Weaken or Sap (the first half's 30 are mostly hits and Fault). Ground is then
whole: 20 common, 32 uncommon, 14 rare and 8 evolution cards (74). Each card is on a StS 1 card at x~1.2 (the last column
and a comment on its line) with a hand-picked upgrade. Every block below is a Ground card's, so Sandstorm adds +3 to it.

**The new rules** (`js/battle.js`, mirrored in pokeDB-sim's `sim/engine.js`):
- `blockPerUnder` / `blockPerFault`: +N block per card underground / per Fault on the enemy (Trench, Bunker, Rubble
  Wall), folded into the card's block in `effectsOf()` as Fighting's `blockPerLost` is; `ifFault`: an extra while the
  enemy has any Fault (Earth Wall, Rumble); `blockFault`: Fault equal to your block once the card's block is in
  (Groundswell, Body Press's shape).
- Powers: `digBlock` (whenever a card goes underground, block N: Foxhole), `faultBlock` (whenever you apply Fault, block
  N: Tectonics), `sandChipBlock` (whenever Sandstorm hurts the enemy, block N: Sand Screen, Polar Vortex's twin),
  `sandWeak` (... Weak N: Blinding Sand), `sandKeep` (Sandstorm no longer runs out: Endless Sands, Endless Winter's twin).

| Card | Rarity | Cost | Effect | Arch | StS |
|---|---|---|---|---|---|
| Trench | C | 1 | Block 6, +3 per card underground *(up 8, +4)* | Dig | (Dig's Spirit Shield, per card dug) |
| Bone Club | C | 1 | Deal 7. Surface: block 7 *(up 9, 9)* | Dig | Iron Wave over two turns, the other way round |
| Hunker Down | C | 0 | Block 2. Surface: block 4 *(up 3, 6)* | Dig | Deflect, split over two turns |
| Sand Tomb | C | 1 | Weak 2, Fault 4 *(up 3, 5)* | Fault | Leg Sweep-lite, with Fault for its block |
| Earth Wall | C | 1 | Block 8; if the enemy has Fault, +4 *(up 10, +5)* | Fault | Defend, on a condition |
| Tremor | C | 1 | Block 5, Weak 1, Fault 2 *(up 7, 1, 3)* | Fault | Iron Wave with Sash Whip's Weak |
| Dune Wall | C | 1 | Block 5; in Sandstorm, +5 *(up 7, +6)* | Sandstorm | Defend, in the weather |
| Sand Blast | C | 1 | Deal 7; in Sandstorm, block 7 *(up 9, 9)* | Sandstorm | Iron Wave, in the weather |
| Sand Cloak | C | 1 | Block 5, Sandstorm 2 *(up 7, 3)* | Sandstorm | Defend with Noxious Fumes' timer (Snowscape's shape) |
| Embankment | C | 2 | Block 12, Sap 1 *(up 15)* | — | Defend+ with Disarm's Sap |
| Foxhole | U | 1 | Power: whenever a card goes underground, block 3 *(up 4)* | Dig | (Dig's Feel No Pain) |
| Dig In | U | 1 | Block 10. Surface: draw 2 *(up 13)* | Dig | Shrug It Off, its draw a turn late |
| Lie in Wait | U | 1 | Block 6. Surface: block 6, Weak 2 *(up 8, 8)* | Dig | Dodge and Roll with Leg Sweep's Weak |
| Cave In | U | 2 | Block 12. Surface: deal 12 *(up 15, 15)* | Dig | Iron Wave, big, over two turns |
| Hibernate | U | 1 | Surface: block 15 *(up 20)* | Dig | Impervious-lite, a turn late |
| Tectonics | U | 1 | Power: whenever you apply Fault, block 3 *(up 4)* | Fault | (Fault's Feel No Pain) |
| Ground Lock | U | 1 | Sap 1, Fault 5 *(up 7)* | Fault | Disarm with Deadly Poison |
| Rubble Wall | U | 2 | Block 8, +1 per Fault on the enemy *(up 11)* | Fault | (Fault's Spirit Shield) |
| Rumble | U | 1 | Block 7; if the enemy has Fault, Weak 2 *(up 10)* | Fault | Leg Sweep-lite, on a condition |
| Aftershock | U | 0 | Fault 3, draw 1 *(up Fault 5)* | Fault | Deadly Poison-lite with a draw (a 0-cost Bouncing Flask) |
| Sand Screen | U | 1 | Power: whenever Sandstorm hurts the enemy, block 4 *(up 6)* | Sandstorm | (Polar Vortex's twin) |
| Haboob | U | 2 | Sandstorm 3, block 10 *(up 4, 13)* | Sandstorm | Noxious Fumes with a Defend+ |
| Dust Cloud | U | 1 | Block 4, Weak 1; in Sandstorm, Weak 2 more *(up 6)* | Sandstorm | Leg Sweep-lite, in the weather |
| Desert Mirage | U | 1 | Block 6; in Sandstorm, draw 2 *(up 9)* | Sandstorm | Backflip, in the weather |
| Scour | U | 1 | Deal 6; in Sandstorm, Sap 1 *(up 9)* | Sandstorm | Disarm on a Strike, in the weather |
| Quagmire *(bridge)* | U | 1 | Block 6. Surface: Weak 2, Fault 4 *(up 8, Fault 6)* | Dig/Fault | Spikes' defensive twin |
| Antlion Pit *(bridge)* | U | 1 | Sandstorm 1. Surface: block 10 *(up 13)* | Dig/Sandstorm | Sinkhole's defensive twin |
| Mud Armor | U | 1 | Block 7; next turn, block 5 *(up 9, 7)* | — | Dodge and Roll |
| Endless Sands | R | 3 | Power: Sandstorm 3; Sandstorm no longer runs out *(up cost 2)* | Sandstorm | (Endless Winter's twin) |
| Bunker | R | 1 | Block 6, +4 per card underground. Surface: draw 1 *(up 8, +5)* | Dig | (Dig's own: block that grows with the pit) |
| Groundswell | R | 1 | Block 8, then Fault equal to your block *(up 11)* | Fault | Body Press, as Fault |
| Chasm | R | 1 | Weak 2, double the enemy's Fault. Exhaust *(up no Exhaust)* | Fault | Catalyst, with a Weak |
| Desert Fortress | R | 2 | Block 18, Sandstorm 2 *(up 22)* | Sandstorm | Impervious-lite, bringing its weather |
| Blinding Sand | R | 1 | Power: whenever Sandstorm hurts the enemy, Weak 1 *(up cost 0)* | Sandstorm | (Sandstorm's own: Weak kept up) |
| Stalagmites *(bridge)* | R | 2 | Block 10. Surface: Fault 12, Weak 2 *(up 13, Fault 16)* | Dig/Fault | (a big Spikes) |
| Solid Rock | R | 2 | Block 10, Sap 2. Exhaust *(up 14)* | — | Disarm with a Defend+, once |

Ground whole: 20 common (Dig 6, Fault 6, Sandstorm 5, 3 basics), 32 uncommon, 14 rare, 8 evolution = **74**.

**Relics** (`only: 'ground'`, 6 plus its held item, answer 21): **Soft Sand** (`soft-sand`, common: your Ground attacks
deal +2), **Earth Plate** (common: the enemy starts each battle with Fault 6; Snowball's shape), **Light Clay** (common:
whenever you apply Fault, gain 2 block), **Shuca Berry** (uncommon: whenever a card goes underground, gain 3 block),
**Smooth Rock** (uncommon: whenever a Sandstorm starts, it lasts 3 more turns; Icy Rock's, for Sandstorm), **Ground
Memory** (rare: Fault counts in full on Alphas and bosses), **Groundium Z** (boss: draw 1 more each turn, and Sturdy saves
you twice a fight; Water Stone's shape: Ground has no stone). **Items**: **Ground Gem** (gain 8 block, Fault 8) and
**Terrain Extender** (double the enemy's Fault; there's no Ground Drive, so it takes the Drive's place, as Red Card does
Fighting's).

**Starters**: Rhyhorn (Rhyhorn, Rhydon, Rhyperior), a `DUO_STARTERS` skin of Trapinch's deck (`GROUND_DECK`), as Machop
is of Timburr's. Catching any stage adds Ground with that look (`DUO_LINES.ground`).

**The Quarry** (`quarry`): Dig Site, Mudflats, Sinkhole, the Fault Line. Its roster is every Ground-typed Safari Pokémon
(40) but Drilbur (Excadrill is a main-game enemy), the Swinub line (the Ice Cave's) and the Sandile line (Night Alley's,
Dark's starter): the Desert's 22 (the Trapinch, Rhyhorn, Sandshrew, Diglett, Cubone, Hippopotas, Phanpy, Gligar and Gible
lines, Baltoy), the Peak's Larvitar line, Geodude line, Onix and Camerupt, the Marsh's Stunfisk, Barboach line,
Quagsire, Gastrodon and Golett, the Wetland's Wooper and Numel, and the Forest's Nincada, Nidoqueen and Nidoking, moved
in. Its rare spawns are the ones already rare (Gible, Gabite, Garchomp, Flygon, Rhyperior). Painted as the **Desert
recoloured** to an open-cut quarry (grey spoil heaps, banded cut walls, scrub, bare snags by a muddy pool, a dusty sky)
until its art session. **Date-gated** like the others (`SAFARI_FROM`, 2026-10-20 on the branch: move it to the day after
the branch goes live); from then, 3 of the 10 a day.

**Bot check** (pokeDB-sim, human bot; duos on Safari days, `safariCfg({ catch: true, catchAt: 0.3, duo })`, 300 a cell;
solo the main game at Level 0, 150), win %: ground+fire / +grass / +water / +electric / +ice / +fighting 65.3 / 54.7 /
45.3 / 49.7 / 55.3 / 57.3, against session 9's Ground (`groundFirst`: these 36 cards, the 7 relics and 2 items out, the
same game files and days) 66.3 / 53.3 / 49.0 / 60.7 / 63.3 / 58.0; solo Ground 88.0 against 76.0. Solo gains, Fire, Grass
and Fighting level, Water inside the noise, Electric (-11) and Ice (-8) dip: left for the balance pass (session 15), as
Fighting's and Electric's second halves were. Relic ranks (strong bot, solo Ground, 150 each, prog over `none` 20.27):
Groundium Z +3.3, Shuca Berry +3.0, Light Clay +2.3, Soft Sand +1.3, Smooth Rock +0.7, Earth Plate +0.6, Ground Memory
+0.5. (The ranks run found a bug in pokeDB-sim's `run-node.mjs`: merging into `ranks.json` kept only the types measured;
it now keeps every type.)

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

#### Flying's first session: its cards (session 11, 2026-10-20)

Written here before the code, as the other types' were. 30 cards in the pools (10 common, 14 uncommon, 6 rare) and all
8 evolution cards, so a run with Flying is whole; session 12 adds the other ~36, the relics, items, Pidgey's and Pidove's
looks and the Windy Cliffs. Each card is on a StS 1 card at x~1.2 (its model in the last column and in a comment on its
line) with a hand-picked upgrade. The deck is Fire's shape (3 attacks, an Iron Wave, 4 blocks, the Bash and a second
signature). This half leans on attacks and draw; the second half is the defensive one, as Ground's was.

**The rules** (`js/battle.js`, mirrored in pokeDB-sim's `sim/engine.js`):
- **Evasion** (`evasion: N`, `b.evasion`, a 🪶 badge on you): each of the next N enemy attacks on you deals half (rounded
  down), before your block; one stack per hit. Stacks last until your next turn, as Blur's block does (banked, they lifted
  Flying 15-25 points over the other types: the bot check below). The intent and the shield preview show
  the halved hit. Payoffs `ifEvasion` (an extra while you have any), `perEvasion` (+N per stack), powers `evadeDamage`
  (Gale: whenever Evasion halves a hit, deal N), `evasionEachTurn` (Wind Wall).
- **Tailwind** (`tailwind: N`, `b.tailwind`, a 🌬️ badge): you draw 1 more card at the start of each of your next N turns
  (a turn goes as it draws). Stacks add turns. "In Tailwind" means it's blowing (`ifTailwind`, `freeIn: 'tailwind'`),
  `perTailwind` (+N per turn left); powers `tailwindDamage` (Wind Rider) and `tailwindEvasion` (Wind Dancer) at the start
  of a turn in Tailwind, before it drops. The neutral card that was called Tailwind (+1 PP next turn, id `tailwind`
  kept) is **Rest** (answer 18).
- **Unburden** (`ifEmpty: { ... }`): a bonus if it's the last card in your hand when you play it (read as it's played,
  before its own draw). A card whose Unburden would happen glows, as Follow-up's do. Power `emptyDraw` (Feather Light:
  the first time a card you play leaves your hand empty each turn, draw N).
- **Keen Eye** (the Ability, `ABILITIES.flying`): when Flying comes out, the fight's start included, draw 1, at most
  once a turn (a duo's partner coming out again the same turn draws nothing more).

| Card | Rarity | Cost | Effect | Arch | StS |
|---|---|---|---|---|---|
| Gust | C | 1 | Deal 8 *(up 11)* | — | Strike |
| Feather Guard | C | 1 | Block 8 *(up 11)* | — | Defend |
| Wing Attack | C | 2 | Deal 10, Vulnerable 2, Evasion 1 *(up 12, 3)* | Evasion | Bash, Evasion for Ground's Fault |
| Aerial Ace | C | 1 | Deal 6, Evasion 1 *(up 9)* | Evasion | Iron Wave, Evasion for its block |
| Feather Dance | C | 1 | Weak 2, Evasion 1 *(up 3, 2)* | Evasion | Leg Sweep-lite |
| Air Slash | C | 1 | Deal 7; if you have Evasion, +6 *(up 9, +8)* | Evasion | Sucker Punch |
| Tailwind | C | 1 | Tailwind 3 *(up cost 0)* | Tailwind | Tools of the Trade, as a timer |
| Twister | C | 1 | Deal 4 twice; in Tailwind, once more *(up 5)* | Tailwind | Twin Strike |
| Peck | C | 0 | Deal 4. Unburden: draw 1 *(up 6)* | Unburden | Flash of Steel |
| Acrobatics | C | 1 | Deal 7. Unburden: +7 *(up 9, +9)* | Unburden | Finisher-lite, on the last card |
| Fly | U | 2 | Deal 12, Evasion 2 *(up 16)* | Evasion | Dodge and Roll with a Strike |
| Gale | U | 1 | Power: whenever Evasion halves a hit, deal 6 *(up 9)* | Evasion | Caltrops |
| Sky Drop | U | 1 | Deal 6, +4 per Evasion *(up 8, +5)* | Evasion | Bane, per stack |
| Roost | U | 1 | Heal 6, Evasion 1. Exhaust *(up heal 9)* | Evasion | Bandage Up |
| Hurricane | U | 2 | Deal 6 three times; in Tailwind, once more *(up 8)* | Tailwind | Riddle with Holes-lite |
| Wind Rider | U | 1 | Power: at the start of each turn in Tailwind, deal 6 *(up 9)* | Tailwind | (Tailwind's Thousand Cuts) |
| Drill Peck | U | 1 | Deal 9; in Tailwind, +5 *(up 12, +6)* | Tailwind | Carnage-lite, in the wind |
| Pluck | U | 0 | Deal 4, draw 1. Unburden: +4 *(up 6, +6)* | Unburden | Flash of Steel with a payoff |
| Feather Light | U | 1 | Power: the first time your hand empties each turn, draw 2 *(up cost 0)* | Unburden | (Unburden's Evolve) |
| Dual Wingbeat | U | 1 | Deal 5 twice. Unburden: it hits twice more *(up 6)* | Unburden | Twin Strike, doubled on the last card |
| Glide | U | 1 | Block 7. Unburden: block 7 *(up 10, 10)* | Unburden | Defend, doubled on the last card |
| Bounce *(bridge)* | U | 0 | Evasion 1. Unburden: draw 2 *(up draw 3)* | Evasion/Unburden | Finesse, with Evasion for its block |
| Whirlwind *(bridge)* | U | 1 | Tailwind 2, Evasion 1 *(up 3, 2)* | Evasion/Tailwind | (Tools of the Trade + Blur) |
| Updraft *(bridge)* | U | 0 | Tailwind 1. Unburden: draw 2 *(up Tailwind 2)* | Tailwind/Unburden | Deep Breath-lite |
| Sky Attack | R | 2 | Deal 24; costs 0 in Tailwind *(up 30)* | Tailwind | Carnage, free in the wind (Blizzard's shape) |
| Aeroblast | R | 2 | Deal 10, +5 per turn of Tailwind *(up 14, +6)* | Tailwind | Perfected Strike, per turn of wind |
| Wind Wall | R | 2 | Power: at the start of each turn, Evasion 1 *(up cost 1)* | Evasion | Wraith Form, softened and kept |
| Brave Bird | R | 1 | Lose 3 HP. Deal 20. Unburden: gain 1 PP *(up 26)* | Unburden | Hemokinesis, refunded on the last card |
| Beak Blast | R | 1 | Deal 12. Unburden: +12, Vulnerable 2 *(up 15, +15)* | Unburden | (Unburden's Bludgeon) |
| Wind Dancer *(bridge)* | R | 1 | Power: at the start of each turn in Tailwind, Evasion 1 *(up cost 0)* | Evasion/Tailwind | (Tailwind's Wraith Form) |

Evolution cards (evo-only, 1 copy; one per archetype and one general a tier):

| Card | Tier | Cost | Effect | Arch |
|---|---|---|---|---|
| Steel Wing | 1st | 1 | Block 9, Evasion 1 | Evasion |
| Air Cutter | 1st | 2 | Deal 14, Tailwind 2 | Tailwind |
| Swoop | 1st | 0 | Deal 6. Unburden: draw 2 | Unburden |
| Wing Strike | 1st | 2 | Deal 18, Weak 1 | — |
| Dragon Ascent | final | 2 | Deal 22, Evasion 2 | Evasion |
| Bleakwind Storm | final | 2 | Deal 7 three times, Tailwind 2 | Tailwind |
| Supersonic Skystrike | final | 1 | Deal 14. Unburden: it hits once more | Unburden |
| Sky Fall | final | 3 | Deal 34, Evasion 1 | — |

Flying so far: 10 common, 14 uncommon, 6 rare, 8 evolution = **38**.

**Starting deck**: Gust x3, **Aerial Ace**, Feather Guard x4, Wing Attack, Peck.

**Bot check** (pokeDB-sim, human bot; duos on Safari days, `safariCfg({ catch: true, catchAt: 0.3, duo })`, Flying the
lead; solo the main game at Level 0), win %. As first built, Evasion kept until a hit used it: solo **83.7** (solo Fire
74.0 under the same bot, 150), flying+fire / +grass / +water / +electric / +ice / +fighting / +ground 90.0 / 89.3 / 75.3 /
92.0 / 88.7 / 90.0 / 86.0, 20-30 over the other types' first sessions. Screens (150): Evasion gone at your turn's start
(`evadeFade`) solo 68.7, +fire / +water / +ground 81.3 / 64.7 / 75.3; Keen Eye only the first time each fight
(`keenOnce`) 79.3 / 86.0 / 76.0 / 84.0, inside the noise. So **Evasion fades at your turn's start** (Blur's rule) and Keen
Eye stays. Confirmed (300, the bot valuing stacks as fading): solo **78.7**, pairs **80.3 / 74.3 / 67.3 / 76.0 / 82.0 /
72.7 / 74.7**: solo level with Fighting's first session (79.3), the pairs ~5-10 over Fighting's and Ice's first sessions
on Fire, Grass and Water, for the balance pass (session 15) once the defensive half is in.

#### Flying's second session: its other cards (session 12, 2026-10-20)

Written here before the code, as Ground's second was. The other 36 pool cards (10 common, 18 uncommon, 8 rare),
**defence-leaning**: 35 of the 36 block, Weaken, Sap, heal or give Evasion (the first half's 30 are mostly hits and
draw). Flying is then whole: 20 common, 32 uncommon, 14 rare and 8 evolution cards (74). Each card is on a StS 1 card at
x~1.2 (the last column and a comment on its line) with a hand-picked upgrade.

**The new rules** (`js/battle.js`, mirrored in pokeDB-sim's `sim/engine.js`):
- `blockPerEvasion` / `blockPerTailwind`: +N block per Evasion you have (the card's own counted) / per turn of Tailwind
  left (Plumage, Phantom Wing, Thermal), folded into the card's block in `effectsOf()` as Ground's `blockPerUnder` is.
- Powers: `evasionBlock` (whenever you gain Evasion, block N: Big Pecks), `evadeWeak` / `evadeSap` (whenever Evasion
  halves a hit, Weak / Sap N: Gale Wings, Levitate), `tailwindBlock` (at the start of each turn in Tailwind, block N: Jet
  Stream), `tailwindKeep` (Tailwind no longer runs out: Delta Stream, Endless Sands' twin), `unburdenBlock` (whenever an
  Unburden happens, block N: Early Bird, Focus Band's shape), `emptyBlock` (the first time your hand empties each turn,
  block N: Weightless, Feather Light's twin; the two share the turn's once).

| Card | Rarity | Cost | Effect | Arch | StS |
|---|---|---|---|---|---|
| Tangled Feet | C | 1 | Block 5, Evasion 1 *(up 8)* | Evasion | Blur, Evasion for its kept block |
| Plumage | C | 1 | Block 5, +3 per Evasion *(up 7, +4)* | Evasion | (Evasion's Spirit Shield) |
| Cloud Cover | C | 1 | Block 8; if you have Evasion, +4 *(up 10, +5)* | Evasion | Defend, on a condition |
| Crosswind | C | 1 | Block 6, Tailwind 1 *(up 8, 2)* | Tailwind | Defend with Tools of the Trade's timer |
| Slipstream | C | 1 | Block 5; in Tailwind, +5 *(up 7, +6)* | Tailwind | Defend, in the wind |
| Thermal | C | 1 | Block 5, +2 per turn of Tailwind *(up 7, +3)* | Tailwind | (Tailwind's Spirit Shield) |
| Preen | C | 0 | Block 3. Unburden: block 4 *(up 4, 6)* | Unburden | Deflect, doubled on the last card |
| Perch | C | 1 | Block 6. Unburden: Weak 2 *(up 9)* | Unburden | Defend with Leg Sweep's Weak on the last card |
| Floaty Fall | C | 1 | Deal 5, block 5. Unburden: draw 1 *(up 7, 7)* | Unburden | Iron Wave, with a draw on the last card |
| Defog | C | 2 | Block 12, Weak 2 *(up 15)* | — | Leg Sweep |
| Big Pecks | U | 1 | Power: whenever you gain Evasion, block 3 *(up 4)* | Evasion | (Evasion's Feel No Pain) |
| Gale Wings | U | 1 | Power: whenever Evasion halves a hit, Weak 1 *(up cost 0)* | Evasion | (Blinding Sand's twin) |
| Hover | U | 1 | Evasion 1, Sap 1 *(up Evasion 2)* | Evasion | Disarm, with Blur's Evasion |
| Down Feathers | U | 2 | Block 12, Evasion 1 *(up 15)* | Evasion | Defend+, with Blur's Evasion |
| Mirror Move | U | 1 | Block 6; if you have Evasion, Weak 2 *(up 9)* | Evasion | Leg Sweep-lite, on a condition |
| Jet Stream | U | 1 | Power: at the start of each turn in Tailwind, block 4 *(up 6)* | Tailwind | Metallicize, in the wind |
| Wind Power | U | 1 | Block 7; in Tailwind, draw 1 *(up 10)* | Tailwind | Shrug It Off, in the wind |
| Air Lock | U | 1 | Weak 2, Tailwind 1 *(up Weak 3)* | Tailwind | Leg Sweep-lite with a timer |
| Windbreak | U | 2 | Block 10, Tailwind 2 *(up 13, 3)* | Tailwind | Defend+ with Tools of the Trade's timer |
| Downdraft | U | 1 | Block 6; in Tailwind, Sap 1 *(up 9)* | Tailwind | Disarm-lite, in the wind |
| Early Bird | U | 1 | Power: whenever an Unburden happens, block 4 *(up 6)* | Unburden | (Unburden's Feel No Pain) |
| Ruffle | U | 0 | Block 4, draw 1. Unburden: block 4 *(up 6, 6)* | Unburden | Shrug It Off-lite, free |
| Nest | U | 1 | Block 8. Unburden: heal 4 *(up 11)* | Unburden | Defend with Bandage Up on the last card |
| Squawk | U | 0 | Weak 1. Unburden: draw 2 *(up Weak 2)* | Unburden | Neutralize, with Finesse's draw |
| Soar *(bridge)* | U | 1 | Block 8; in Tailwind, Evasion 1 *(up 11)* | Evasion/Tailwind | Defend with Blur, in the wind |
| Unburden *(bridge)* | U | 1 | Block 6. Unburden: Evasion 2 *(up 9)* | Evasion/Unburden | Defend with Blur, on the last card |
| Lift *(bridge)* | U | 0 | Block 3. Unburden: Tailwind 2 *(up 5)* | Tailwind/Unburden | Updraft's defensive twin |
| Wingspan | U | 2 | Block 9, Weak 1, Sap 1 *(up 12)* | — | Leg Sweep with Disarm's Sap |
| Delta Stream | R | 3 | Power: Tailwind 3; Tailwind no longer runs out *(up cost 2)* | Tailwind | (Endless Winter's twin) |
| Sky Fortress | R | 2 | Block 16, Tailwind 2 *(up 20)* | Tailwind | Impervious-lite, bringing the wind |
| Phantom Wing | R | 1 | Evasion 2, then block 4 per Evasion *(up 5)* | Evasion | (Evasion's own: block that grows with the stacks) |
| Levitate | R | 2 | Power: whenever Evasion halves a hit, Sap 1 *(up cost 1)* | Evasion | (Evasion's own: Sap kept up) |
| Featherweight | R | 0 | Block 5. Unburden: block 8, draw 1 *(up 7, 10)* | Unburden | (Unburden's own) |
| Weightless | R | 1 | Power: the first time your hand empties each turn, block 8 *(up 11)* | Unburden | (Feather Light's defensive twin) |
| Cloud Nine *(bridge)* | R | 1 | Weak 2, Evasion 1; in Tailwind, Sap 1 *(up Weak 3)* | Evasion/Tailwind | Feather Dance with Disarm, in the wind |
| Oblivion Wing | R | 2 | Deal 14, heal 7 *(up 18, 9)* | — | Reaper, on one foe |

Flying whole: 20 common (Evasion 6, Tailwind 5, Unburden 5, 3 basics and the Bash), 32 uncommon, 14 rare, 8 evolution =
**74**.

**Relics** (`only: 'flying'`, 6 plus its held item, answer 21): **Sharp Beak** (`sharp-beak`, common: your Flying attacks
deal +2), **Sky Plate** (common: start each battle with Tailwind 2; Snowball's shape, for you), **Pretty Wing** (common:
whenever you gain Evasion, gain 2 block; Light Clay's shape), **Coba Berry** (uncommon: whenever an Unburden happens, gain
3 block; Focus Band's shape), **Air Balloon** (uncommon: start each battle with Evasion 2), **Flying Memory** (rare: at
the start of your turn, your Evasion halves instead of going away; Fighting Memory's shape), **Flyinium Z** (boss: draw 1
more each turn, and Keen Eye draws 2; Water Stone's shape: Flying has no stone). **Items**: **Flying Gem** (gain 8 block,
Evasion 2) and **Swift Wing** (Tailwind 3, draw 2; there's no Flying Drive, so it takes the Drive's place, as Red Card does
Fighting's).

**Starters**: Pidgey (Pidgey, Pidgeotto, Pidgeot) and Pidove (Pidove, Tranquill, Unfezant), `DUO_STARTERS` skins of
Starly's deck (`FLYING_DECK`), as Rhyhorn is of Trapinch's. Catching any stage adds Flying with that look
(`DUO_LINES.flying`).

**The Windy Cliffs** (`windycliffs`): Cliff Path, Nesting Ledges, Rope Bridge, the Eyrie. Its roster is the **birds**
(35): every Normal / Flying Safari Pokémon (the Pidgey, Starly, Pidove, Spearow, Taillow, Hoothoot, Doduo, Rufflet and
Togetic lines, Swablu and Altaria, Farfetch'd, Chatot), the sea birds (Wingull, Pelipper, Ducklett, Swanna), Natu and
Xatu, the Archen line, Aerodactyl and Skarmory, moved in from the Meadow, Forest, Wetland, Peak and Desert. The other
Flying-typed ones stay where they live: the bugs, bats, balloons, Hoppip's line, Tropius, the Mantine line, Gyarados and
the dragons are their first type's, and the Dark birds (Murkrow, Honchkrow, Vullaby, Mandibuzz) wait for Dark's Night
Alley. Its rare spawns are the ones already rare (Farfetch'd, Togetic, Togekiss, Braviary, Aerodactyl). Painted as the
**Peak recoloured** to sea cliffs (chalk-white faces, wind-bent scrub, turf tops, a bright gusty sky, feathers on the
wind) until its art session. **Date-gated** like the others (`SAFARI_FROM`, 2026-10-20 on the branch: move it to the day
after the branch goes live); from then, 3 of the 11 a day.

**Bot check** (pokeDB-sim, human bot; duos on Safari days, `safariCfg({ catch: true, catchAt: 0.3, duo })`, Flying the
lead, 300 a cell; solo the main game at Level 0, 150), win %: flying+fire / +grass / +water / +electric / +ice /
+fighting / +ground 81.0 / 73.7 / 67.7 / 74.7 / 76.3 / 77.3 / 73.7, against session 11's Flying (`flyFirst`: these 36
cards, the 7 relics and 2 items out, the same game files and days) 83.3 / 79.7 / 62.7 / 72.3 / 83.7 / 78.0 / 80.3; solo
Flying 92.7 against 78.0. Solo gains most (it's now the strongest type alone: Ground's second half reached 88.0); the
pairs are level inside the noise but Ice (-7) and Ground (-7) dipping, as Fighting's and Ground's second halves did: left
for the balance pass (session 15), with Flying's solo. Relic ranks (strong bot, solo Flying, 150 each, prog over `none`
19.53): Flyinium Z +2.7, Pretty Wing +1.8, Sharp Beak +0.9, Sky Plate +0.8, Flying Memory +0.6, Air Balloon 0.0, Coba
Berry -0.2.

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

#### Dark's first session: its cards (session 13, 2026-10-20)

Written here before the code, as the other types' were. 30 cards in the pools (10 common, 14 uncommon, 6 rare) and all
8 evolution cards, so a run with Dark is whole; session 14 adds the other ~36, the relics, items, Sandile's look and
Night Alley. Each card is on a StS 1 card at x~1.2 (its model in the last column and in a comment on its line) with a
hand-picked upgrade. The deck is Fire's shape (3 attacks, an Iron Wave, 4 blocks, the Bash and a second signature). This
half leans on attacks and draw; the second half is the defensive one, as Flying's was.

**Names**: most Dark moves already name a Safari signature card a duo can meet (Thief is Sandile's, Pursuit Murkrow's,
Knock Off, Night Daze, Assurance, Crunch, Dark Pulse, Foul Play, Sucker Punch...), and Payback and Intimidate are
Fighting cards. So the plan's Thief is **Snatch**, Payback **Lash Out**, Assurance **Reprisal**, Knock Off **Brutal Swing**,
Night Daze **Wicked Blow**, Copycat **Imposter** (Copycat is Happiny's signature, and a Sky Pillar augment), Punishment
**Ransack** (so no card is called after a keyword it doesn't use). Fighting's card **Intimidate** (id kept, branch only)
is **Stare Down** now, as Ground's Sturdy card became Stand Firm: Intimidate is Dark's Ability. (The Sky Pillar augment
called Intimidate stays: augments are climbs only, and it means the same.)

**The rules** (`js/battle.js`, mirrored in pokeDB-sim's `sim/engine.js`):
- **Steal** (`steal: N`): the enemy loses N strength (below 0 too, so its attacks deal less) and you gain what it had of
  it, up to N; and up to 3 x N of its block becomes yours, before the card's damage, so a stolen shield lets the hit
  through. (As first built it took only strength the enemy had, so it did nothing to a foe that hadn't buffed: the bot
  check below.) Strength comes
  from its buff moves and Enrage, block from its defend moves (it keeps it through your turn). Payoffs: `ifBuffed` (an
  extra if it has strength or block as you play the card, read before the Steal), Pickpocket (`mirrorStrength`: whenever
  the enemy gains strength, you gain 1), `payDay` (Pay Day's knockout ₽, Plunder).
- **Punish** (`punish: { ... }`): a bonus if the enemy intends to attack this turn (its intent is an attack or a drain,
  and it isn't about to be Paralyzed), the same test as the older "If the enemy intends to attack" cards, which keep
  their text; a Punish card glows when it would pay, as Follow-up's do. **Taunt** (`taunt`): the enemy's intent becomes
  the next attack in its move list (a buff or a shield is skipped, its pattern goes on from there). `perIntent` (Ruination:
  + the damage its coming attack would deal you). Powers `punishDamage` (Unnerve: whenever a Punish happens, deal N) and
  `punishDraw` (Prankster: at the start of each turn, if the enemy intends to attack, draw N).
- **Illusion** (`illusion: true` on a card, "Illusion." on its face): it counts as your partner's type too. With two decks
  (session 1b) a Dark card is always played by Dark, so the STAB half of the plan's rule holds anyway; what Illusion adds
  is the chart: **it hits as whichever of your two types does better against the enemy** (the Safari's real chart; alone,
  Dark or Neutral, so it's never resisted), and your partner's held item boosts it too. A card Imposter copies is an
  Illusion, so a partner's card played by Dark keeps its STAB. Payoff `perIllusion` (+N for each other Illusion card
  you've played this turn, `b.illusions`).
- **Disguise** (`disguise: 1`, a 🎭 badge): until your next turn, the enemy's attacks hit you as whichever of your two
  types takes them best (alone: Dark or Neutral), without switching. The intent's number and ▲ / ▼ show it. Payoff
  `ifDisguised` (an extra while you're Disguised). **Mirage** (power `mirage`): every Dark card is an Illusion card, and
  you're Disguised at the start of each turn.
- **Imposter** (`copyPartner`): add a copy of the last card your partner played this turn to your hand (alone: the last
  card you played), an Illusion. Nothing to copy, nothing happens.
- **Intimidate** (the Ability, `ABILITIES.dark`): when Dark comes out, the fight's start included, apply 1 Weak, at most
  once a turn (Keen Eye's rule).

| Card | Rarity | Cost | Effect | Arch | StS |
|---|---|---|---|---|---|
| Bite | C | 1 | Deal 8 *(up 11)* | — | Strike |
| Obstruct | C | 1 | Block 8 *(up 11)* | — | Defend |
| Snatch | C | 2 | Deal 10, Vulnerable 2, Steal 1 *(up 12, 3)* | Steal | Bash, Steal for Wing Attack's Evasion |
| Feint Attack | C | 1 | Deal 6, block 6. Illusion *(up 8, 8)* | Illusion | Iron Wave |
| Lash Out | C | 0 | Deal 4, Weak 1. Punish: draw 1 *(up 6)* | Punish | Flash of Steel, on its intent, with Weak |
| Covet | C | 1 | Deal 7, Steal 1 *(up 10)* | Steal | Sucker Punch (Silent's), Steal for its Weak |
| Brutal Swing | C | 1 | Deal 7; if it has strength or block, +6 *(up 9, +8)* | Steal | Bane, on its buffs |
| Throat Chop | C | 1 | Deal 7. Punish: +6 *(up 9, +8)* | Punish | Bane, on its intent |
| Disguise | C | 1 | Block 8, Disguise *(up 11)* | Illusion | Defend, in disguise |
| Sleight of Hand | C | 1 | Deal 4 twice. Illusion *(up 5)* | Illusion | Twin Strike |
| Taunt | U | 0 | The enemy's intent becomes its next attack. Draw 1. Exhaust *(up draw 2)* | Punish | (Punish's own: Trip's slot) |
| Reprisal | U | 1 | Block 7. Punish: Vulnerable 2 *(up 10)* | Punish | Go for the Eyes, with a Defend |
| Comeuppance | U | 2 | Deal 12. Punish: it hits once more *(up 15)* | Punish | Twin Strike+, on its intent |
| Unnerve | U | 1 | Power: whenever a Punish happens, deal 5 *(up 7)* | Punish | (Punish's Thousand Cuts) |
| Ransack | U | 1 | Deal 8, Steal 2 *(up 11, 3)* | Steal | Sucker Punch+, Steal for its Weak |
| Pickpocket | U | 1 | Power: whenever the enemy gains strength, you gain 1 *(up cost 0)* | Steal | (Steal's own: Inflame off its buffs) |
| Jaw Lock | U | 1 | Deal 8, Steal 1; if it has strength or block, draw 1 *(up 11)* | Steal | Pommel Strike, on its buffs |
| Imposter | U | 1 | Copy your partner's last card this turn into your hand, an Illusion. Exhaust *(up cost 0)* | Illusion | Dual Wield, off your partner |
| Masquerade | U | 1 | Block 5, Disguise, draw 2 *(up block 8)* | Illusion | Backflip, in disguise |
| Wicked Blow | U | 2 | Deal 16. Illusion. If you're Disguised, +6 *(up 20, +8)* | Illusion | Bludgeon-lite |
| Doppelganger | U | 1 | Deal 5, +4 per other Illusion card played this turn. Illusion *(up 7, +5)* | Illusion | Finisher, on Illusions |
| Mug *(bridge)* | U | 1 | Deal 7. Punish: Steal 2 *(up 10)* | Steal/Punish | Sucker Punch, stealing on its intent |
| Switcheroo *(bridge)* | U | 0 | Steal 1, Disguise *(up Steal 2)* | Steal/Illusion | Disarm-lite, free |
| False Surrender *(bridge)* | U | 1 | Deal 8. Illusion. Punish: +5 *(up 10, +7)* | Punish/Illusion | Bane, on its intent |
| Mirage | R | 2 | Power: your Dark cards are Illusions; Disguise at the start of each turn *(up cost 1)* | Illusion | (Illusion's own: Wraith Form's slot) |
| Darkest Lariat | R | 2 | Deal 16; strength counts 3 times *(up 20, 4 times)* | Steal | Heavy Blade |
| Plunder | R | 2 | Deal 14, Steal 2; a knockout gives 20 ₽ *(up 18, 25 ₽)* | Steal | Hand of Greed |
| Ruination | R | 2 | Deal 8. Punish: + the damage its attack would deal you *(up 12)* | Punish | (Punish's own: Spite thrown back) |
| Prankster | R | 2 | Power: at the start of each turn, if the enemy intends to attack, draw 2 *(up cost 1)* | Punish | Machine Learning, on its intent |
| Hyperspace Fury *(bridge)* | R | 2 | Deal 5 four times, Steal 1. Illusion *(up 6)* | Steal/Illusion | Riddle with Holes-lite |

Evolution cards (evo-only, 1 copy; one per archetype and one general a tier):

| Card | Tier | Cost | Effect | Arch |
|---|---|---|---|---|
| Heist | 1st | 1 | Deal 9, Steal 2 | Steal |
| Vengeance | 1st | 2 | Deal 14. Punish: Vulnerable 2 | Punish |
| Smoke Bomb | 1st | 0 | Disguise, draw 2 | Illusion |
| Kowtow Cleave | 1st | 2 | Deal 17, Weak 1, Vulnerable 1 | — |
| Grand Larceny | final | 2 | Deal 20, Steal 3 | Steal |
| Black Hole Eclipse | final | 2 | Deal 20. Punish: +12 | Punish |
| Dark Void | final | 2 | Deal 24, Disguise. Illusion | Illusion |
| Wicked Torque | final | 3 | Deal 32, Weak 2 | — |

Dark so far: 10 common, 14 uncommon, 6 rare, 8 evolution = **38**.

**Starting deck**: Bite x3, **Feint Attack**, Obstruct x4, Snatch, Lash Out.

**Starters**: **Deino** (Deino, Zweilous, Hydreigon; `DUO_STARTERS`, `DARK_DECK`; back GIFs, `SPRITE_FIT`, `BODY_X`,
cries), `DUO_LINES.dark` (catching any stage adds Dark; they still live in the Peak and the Marsh until Night Alley).

**Bot check** (pokeDB-sim, human bot; duos on Safari days, `safariCfg({ catch: true, catchAt: 0.3, duo })`, Dark the
lead; solo the main game at Level 0), win %. As first built (Steal took only strength the enemy had; Lash Out deal 5, no
Weak), 150 a cell: solo **43.3** (solo Fire 71.3 under the same bot), dark+fire / +water / +ground 59.3 / 54.7 / 57.3.
Solo starting-deck screens (150): Lash Out with Weak 1 53.3, Intimidate Weak 2 51.3, Snatch's Vulnerable as Weak 41.3,
Feint Attack block 8 46.7, Snatch and Lash Out both Weak 58.0. Steal always taking N strength (below 0 too, you gaining
what it had) 52.0; with Lash Out's Weak **76.0** (Snatch's Weak too: 82.0, over the others); +fire / +water 68.0 / 60.0.
So **Steal always takes strength** and **Lash Out applies Weak 1**. Confirmed (300): solo **73.3**; dark+fire / +grass /
+water / +electric / +ice / +fighting / +ground / +flying **75.0 / 76.0 / 62.3 / 77.7 / 77.3 / 77.7 / 77.3 / 89.3**: level
with Flying's first session (solo 78.7, pairs 67-82); +flying runs high (Flying is whole), for the balance pass (session 15).

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
relic in `TYPE_RELIC` (Magnet, Never-Melt Ice, Expert Belt, Soft Sand, Sharp Beak, Black Glasses); its `only` relics
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
