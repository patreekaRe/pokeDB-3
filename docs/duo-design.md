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
