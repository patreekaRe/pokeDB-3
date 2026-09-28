# PokéDB — project notes for Claude

A browser-based Pokémon-themed roguelike deck-battler. Vanilla HTML/CSS/JS
(ES modules), no build step, no framework. Deployed on GitHub Pages at
https://patreekare.github.io/pokeDB-3/.

## Cloud or local: always tell the user (their request)

The user finds it hard to keep track, so **every time you give them a next step or a next-session prompt, say
plainly whether to run it in the CLOUD or LOCAL**, as the first line (e.g. "▶ Run this in: CLOUD"). Default rule:
- **CLOUD**: building cards/mechanics, balance and bot checks (the sim), anything with long runs or many downloads.
  It saves the user's data and has Node, Python and Chromium. Attach both `pokeDB-3` and `pokeDB-sim`.
- **PLAYTEST ON THE LIVE SITE** (no session needed): https://patreekare.github.io/pokeDB-3/ on their phone or PC,
  a few minutes after a push. This is the default way to playtest. Adding `?levels` to the URL unlocks every Trainer
  Level for good (`init()` in `js/main.js`), so the user can playtest Level 3/5 without climbing. `?time=dawn`, `day`, `dusk` or
  `night` pins the day/night cycle for that page load (`js/daytime.js`).
- **LOCAL** (their Windows PC, `serve.ps1`): only for visual work they want to see change live as it's edited
  (layout, art, animation). No Node/Python there, so no bot runs.
Every session prompt in `docs/roadmap.md` starts with its "Run in:" line; keep adding one.

## Roadmap

The agreed plan (task order, the new 54-Pokémon roster per biome, rules for adding
enemies, Pokédex/catching ideas) is in `docs/roadmap.md`. Read it before starting a
roster, balance or Pokédex task, and keep it up to date as steps land.

## Running it locally

There's no `file://` support (ES modules need a real origin). Use the
bundled server:

```
powershell -ExecutionPolicy Bypass -File serve.ps1
```

then open `http://localhost:8123`. Check `netstat -ano | grep LISTENING`
first — a server from a previous session may already be running.

`serve.ps1` is Windows-only. In a Linux/cloud session, serve the repo root
with `python3 -m http.server 8123` instead. Cloud sessions should still push
to `main` (see Conventions), not open a branch or PR. Even when a session is set up with its
own branch, push the work to `main` too (`git push origin HEAD:main`; the user's call, 2026-09-28), so it reaches the
live site.

## Architecture

- **Entry point**: `index.html` loads `js/main.js` as a module. Every other
  `js/*.js` file is imported from there or from each other.
- **Data-driven design**: all game content — cards, starters, enemies,
  relics, achievements, shop items, difficulty levels — lives in plain
  object arrays/maps under `js/data/`. Tuning (damage numbers, unlock
  conditions, prices) should always be a data change there, not an engine
  change.
- **Screens** (`js/ui.js`): a `SCREENS` array of section ids; `showScreen(id)`
  hides all but one via the `hidden` attribute. The DOM isn't destroyed,
  just hidden, so screen state survives being hidden.
- **Dialogs**: native `<dialog>` elements. Most use `openDialog`/`closeDialog`
  in `js/ui.js`, which wrap `.showModal()`/`.close()`. The **shop dialog is
  the exception** — it uses `.show()`/`.close()` directly (non-modal), so it
  floats above whatever screen is showing without blocking or hiding it.
  That's intentional: don't "fix" it back to `showModal()`.
  **Every window closes on a tap outside it** (the user's call, 2026-09-27): `js/ui.js` closes any modal dialog when
  a press starts and ends on its backdrop (with the `cancel` sound); the result and yes/no windows click
  their stand-in button instead (`OUTSIDE_TAP`: Main menu, No). The Game Corner, having no backdrop,
  closes on any tap elsewhere and swallows that tap (`initShop()`; the shop button and locked starters still toggle
  it). The Bag, the Poké Ball menu, zooms and
  focus layers already did. The Collection screen goes back on a tap on its empty background too (`initCollection()`).
- **Skins share decks**: only Charmander/Bulbasaur/Squirtle have unique
  decks (`FIRE_DECK`/`GRASS_DECK`/`WATER_DECK` in `js/data/starters.js`).
  Every other starter is a skin — same deck array reference, different
  sprite/name/blurb. `skinOf` on a skin entry is documentation only; code
  never reads it. 6 are Game Corner skins (`SKIN_SHOP_ITEMS`): the Gen 2/5 starters (150/250). Step 9a's six skins
  (Budew, Sewaddle, Lotad, Horsea, Spheal, Tympole) were removed again: the user didn't want them. A new starter
  needs front/back GIFs and their `shiny/` pair for every stage (PokeAPI black-white animated), `SPRITE_FIT` lines for
  the normal ones (a PIL median bbox over all frames matches the ImageDecoder numbers exactly), and a cry in `CRIES`
  (play.pokemonshowdown.com is blocked in cloud sessions: PokeAPI's `cries/pokemon/latest/<dex>.ogg`, mono 64 kbps MP3
  at ~-14 dB mean, see the roadmap's step 3).
- **Legendaries** don't evolve into a different species. Their `line` array
  reuses the same sprite id for stages 0–1 and points stage 2 at a `-shiny` id (only read for its cry, which drops the
  suffix). They never change colours: they power up, Super Saiyan style (the user's calls, 2026-09-28), in their normal
  colours, or their shiny ones once bought and switched on. `spriteUrl()` gives stage 1 `<id>[-shiny]-awakened-*.gif` (Super
  Saiyan: a flame aura in the type's colours engulfing the body, tongues off every upward edge and up its sides, two
  shimmering rings, a gentle pulse, a few drifting particles, two circling sparkles) and stage 2 `<id>[-shiny]-ascendant-*.gif`
  (Super Saiyan 2: the aura taller and denser, three rings pouring outwards, lightning crackling round it, a body flash
  twice a loop, a shower of the type's particles (embers, bubbles, leaves, stars), orbiting sparkles with trails). Baked
  into the GIFs, not CSS, since those sprites already carry their own filters (the intro's silhouette, the evolution's
  flashes). `tools/legendary-aura.py <id> <type>` (Pillow) makes all eight of a legendary's files and prints their
  `SPRITE_FIT` lines (the source's gaps plus the padding) for the end of `js/data/sprite-fit.js`; a new legendary needs both.
  Sixteen earned ones: Moltres / Virizion / Suicune (a Level 2 win per type), and since step 9b Entei / Celebi / Kyogre
  (a Level 3 win per type; Level 3 and 5 until 2026-09-28, the user's call) and Ho-Oh / Lugia / Palkia (the Clearing / Shrine / Wastes Pokédex page, `save.dex.done`;
  ids `hooh` etc.), and since step 9c Reshiram (`dex.complete`), Victini (`stats.smallDeckWin`: won on Level 3+ with 15 cards or
  fewer, any Level until 2026-09-28), Heatran (`stats.noRestWin`: `restCount` 0; PP Up at a Center isn't a rest), Manaphy (`stats.maxTide`, raised
  in `gainTide()` in `js/battle.js`) and Keldeo (wins with 3 different Water starters, Keldeo aside: `winsBy`; was every one you own until 2026-09-28).
  `checkAchievements()` runs after every won fight's Pokédex update (`afterFight()`, so a page's
  legendary is told in that reward box), after each boss, at every run's end, won or lost (so an old save that
  already met a goal gets it then), and after a Game Corner buy.
  Shaymin was swapped for Virizion; `RENAMED_STARTERS` in
  `js/data/starters.js` moves an old id's unlock, wins and saved run over
  to the new one (add to it if a starter is ever replaced again).
- **Mewtwo** is the secret last starter (`secret: true`: shown as "???",
  the last portrait in the character select's Legendaries tab). It unlocks once every other starter
  is unlocked and a run is won on Trainer Level 5 (`stats.level5WinsBy`, so only wins since 2026-09-28 count);
  that achievement must stay last in `ACHIEVEMENTS`, since
  `checkAchievements()` grants in order (the shop also runs it after a
  purchase). It is `type: 'psychic'` with an empty deck, so `comingSoon: true`
  stops it being picked for a run until its own cards exist.
- **Cards** (`js/data/cards.js`): every effect is a key in a card's
  `effects` (the header comment lists them all) and `describe()` writes
  the card text from them, so new mechanics need a line there too. Beyond
  damage/block/heal there are multi-hits (`hits`), player `strength`,
  `power: true` cards whose `POWERS` keys (played with a Power Lens pop-up in
the starter's colour, `POWER_LENS`) (block/heal/burn/strength/draw
  each turn, thorns, blaze) stay on all fight as nameplate badges,
  `retain`, `exhaust`, `selfDamage`, `blockDamage` and `bonusPerBurn`.
  Power, exhaust and retain cards carry a bold "Power." / "Exhaust." / "Retain." keyword
  (`keywords()` in `js/data/cards.js`, drawn by `makeCard()`, with a
  `title` explaining it); powers leave the fight once played, like StS.
  **Keyword boxes** (StS's): `cardTerms(card)` in `js/data/cards.js` lists every term a card uses as
  `[label, text]` (its keywords, then Tide, Burn, Leech Seed, Weak, Vulnerable, Sap, Strength, Discard, X,
  Combo... found by regex over its effect keys, nested ones too), and `termTips()` is the same minus the
  keywords, for the text's `title`. `cardTips()` / `withTips()` in `js/ui.js` draw them as little parchment
  windows beside any blown-up card: battle's risen card (`placeTips()` in `js/battle.js`: beside it on
  whichever side has 190px, else stacked over it, with taps passing through), `zoomCard()` and the reward /
  Mart focus (`openFocus()`); on phones (`.tip-row`, ≤720px) they stack under the card, which shrinks by
  `--tips`; wider, they hang off the card's right side (absolute), so the card itself stays centred over its button. A new mechanic only needs a line in `cardTerms()`; every term with a box is
  coloured in the card's own text and on its box's name (`colourTerms()` / `TERM_KIND` in `js/ui.js`, `.term-*` in
  `css/cards.css`: Burn orange-red, Tide blue, Leech Seed green, debuffs purple, Strength red, the rest keyword gold; StS 2's,
  the user's pick 2026-09-28); keep each box's text short (~55 characters,
  the user's call 2026-09-28: "Burn: Damage each enemy turn, then -1."), longer only when short stops explaining it: Tide says
  what it is and what spending it does (the user couldn't tell from "Builds up all fight"). Block, Draw and Heal get no box:
  their words say it (the user's call). A card that makes cards (`addCard`, however nested) gets a box per made card with its cost,
  keywords and text (`addedCards()` / `madeCardText()`: Rage, Paralysis, Poison, Cinder...; Rage's says it's a copy of itself).
  Each type has three archetypes (docs/card-design.md): Fire Burn / Reckless / Kindling, Grass Growth /
  Drain / Spores, Water Tsunami / Shell / Flow.
  Water rework (2026-09-26, the user found Water bland): **Tide** is Water's
  "build up, cash in" resource, `battle.tide`, shown as a 🌊 nameplate badge and
  lasting all fight. `tide: N` cards build it (Bubble, Dive, Rain Dance, Surf,
  Origin Pulse); `perTide: N` cards add N damage per Tide, then spend it all
  (Water Pulse, retained so you can hold it until the Tide is high, replaces a
  Water Gun in the starting deck; Hydro Pump, now 2 cost; Brine). `makeCard()`
  explains Tide in the text's `title`. Shell Armor (rare power, StS's Barricade)
  is `keepBlock`: `beginPlayerTurn()` keeps your block instead of zeroing it, so
  Razor Shell builds are worth aiming for; a `POWERS` entry with `flag: true`
  shows its badge without a number. Withdraw deliberately builds no Tide: 4 of
  them made Water win ~95% at Level 3 in the bot, and Tide on Bubble made the bot
  hoard Bubbles until it dropped to 5 damage (Rain Dance to 4 block). After (human
  bot, 600 runs/cell) fire / grass / water: L0 66 / 77 / 78, L3 61 / 57 / 67,
  L5 35 / 37 / 41; Water was 76 / 65 / 39 before, so it stays level.
  StS revamp (2026-09-26, the user's call: "more like StS"): every card is
  modelled on a Slay the Spire 1 card (named in a comment on its line) at
  StS's numbers x~1.2 (Strike 6 -> 7, Defend 5 -> 6), keeping StS's price
  per energy. Starting decks are StS-shaped: 4 attacks, 4 blocks, 2
  signature cards (Fire: Scorch = Bash + Will-O-Wisp; Grass: Seed Bomb =
  Bash + Absorb, one of its blocks a Cotton Guard; Water: Bubble + Dive =
  Shrug It Off, one of its attacks a Water Pulse), no Tailwind. `weaken: N` is StS's Weak (enemy deals 25%
  less for N enemy turns, `WEAK_MULT`) and `vulnerable: N` its Vulnerable
  (your attacks deal 50% more, `VULNERABLE_MULT`); both tick down at the end
  of each enemy turn (`enemy.weak` / `enemy.vulnerable` in `js/battle.js`),
  and `makeCard()` puts an explaining `title` on the text. Enemy numbers
  were retuned around the cards (biome `dmgBonus` 4/11/22, `bossBonus`
  5/16/28, `hpMult` 1.2/2.9/5.2; Fierce Bosses +2 damage, not +4), then
  again over the new 54-Pokémon roster (2026-09-26, see Items below). Fire
  has the fewest defensive cards, so its Defend (Flame Wall) blocks 8 and
  its Flame Barrier (Burning Bulwark) is 1 cost; without that Fire trailed
  the others by 15-30 points.
  Card-pool review (bot harness, 2026-09-24): as one extra copy in the
  starting deck, block, Weaken, healing and powers raise win rates and big
  attacks lower them (Flare Blitz, Fire Blast, Solar Beam: −15 to −30
  points), since a turn spent without defending costs more HP than it saves.
  So check defensive numbers first: +1 or +2 block on a starting card moves
  a type 10–30 points at Level 5. Don't remove a card id:
  a saved run holding it would be discarded.
  **Card pool expansion (roadmap 6c)**: `docs/card-design.md` is the plan (9 archetypes, ~70 cards a
  type, each on a StS card); the user approved it (2026-09-26); its Decisions section settles the open questions. The engine for it
  landed first (6c.2), all in `js/battle.js` and described by `describe()` (the header of
  `js/data/cards.js` lists every key): X cost (`cost: 'X'` + `perX`, `xPlus`), `discard` / `exhaustPick`
  (the hand glows and one tap picks, `pickFromHand()`; no more cards than asked takes them all),
  `onDiscard` / `onExhaust` (only a card's discard counts, not the end of turn, like StS), exhaust and
  discard powers (`exhaustBlock`, `exhaustDraw`, `discardTide`, `discardBlock`), played-this-turn
  (`battle.played` / `attacks` / `discarded`: `perPlayed`, `hitsPerAttack`, `perDiscard`,
  `combo: { at, ... }`, powers `cardDamage` / `cardBlock`), `addCard: { id, n, to }`, keywords
  `unplayable` / `ethereal` / `innate` (bold via `keywords()`; `termTips()` explains terms in the text's
  `title`), a 10-card hand cap (`MAX_HAND`: draws stop, made cards go to the discard pile). Played cards
  now reach their pile *after* resolving (their own draw can't reshuffle them), and every exhaust goes
  through `exhaustCard()` (so Eject Pack also fires for ethereal and picked exhausts). `TOKEN_CARDS`
  (Cinder, Seedling, Droplet) and `STATUS_CARDS` (Confusion, Paralysis, Poison, Sludge: grey `.status`
  cards) are in `CARDS_BY_ID` only, never in `ALL_CARDS`, so they're never offered or indexed. Enemy
  moves can carry `adds: { card, n, to }` (default the discard pile), or be `kind: 'status'` (only
  that; a grey intent bubble; on an attack the junk card's icon follows the move name). Enemies using them since 6c.9
  are listed in the doc's Status cards table (Psyduck, Oddish, Alpha Raticate, Snorlax, Slowpoke, Shellos, Stantler, Alpha
  Watchog, Exploud, Tangela, Tauros).
  **Fire's pool (6c.3, 2026-09-26)**: 20 common / 32 uncommon / 14 rare + 8 evolution cards, each with its StS
  model in a comment and a hand-picked `upgrade` (the doc's Fire section lists them and what changed). Fire's
  mechanics, all in `js/battle.js` with `describe()` lines: `burnTimes`, `burnMult` (Catalyst), power `drought`
  (every Burn a card applies +N, via `burnEnemy()`), `ifBurned` / `ifHurt` (`{ bonus, ...effects }` merged in by
  `effectsOf()` as the card is played), `costDownOnHurt` (Mind Blown), `exhaustHand: 'all' | 'skills'` with
  `perExhausted` / `hitsPerExhausted` / `blockPerExhausted` (resolved before the damage), `playTop` (Wildfire, StS's
  Havoc: `resolveCard()` plays the top card free and exhausts it), `exhume` (Fusion Flare: `pickFromPile()` lays the
  exhaust pile over the dimmed battle, `.pile-pick`), `healDealt`, powers `rupture`, `combust` (end of your turn,
  in `endTurn()`), `brutality`, `corruption` (Blue Flare: `costOf()` makes non-attacks 0 and `resolveCard()`
  exhausts them), `cinderDamage`, `exhaustBurn`. `loseHp()` is every self-inflicted HP loss (Raging Fury triggers
  on it) and `markHurt()` counts every HP loss, the enemy's too (`battle.hurtThisTurn`, `battle.timesHurt`). A card's
  cost in the hand comes from `costOf()` (`makeCard(card, { cost })` shows a cheaper one in green).
  Human bot, Fire L0 / L3 / L5: 71.2 / 63.3 / 34.5 before, 70.7 / 62.2 / 39.3 after (600 runs/cell); the bot never
  takes the combo cards, so those builds are for the user's playtest.
  **Water's pool (6c.4, 2026-09-26)**: 20 common / 32 uncommon / 13 rare + 8 evolution cards, the same way (the doc's
  Water section lists them and what changed). Water's mechanics, all in `js/battle.js` with `describe()` lines: Tide goes
  through `gainTide()` (Drizzle adds to every gain; `battle.tideGained` counts it all for Tsunami's `perTideGained`) and
  `spendTide()` (every "spend all your Tide": `perTide`, `blockPerTide`; Rain Dish's `tideSpendBlock` turns it into
  block), `perTideHeld` (counts without spending), `tideMult`, powers `tideEachTurn`, `tideSurge` (Primal Reversion, 1 more
  each turn, `battle.surgeTurns`). Block: `blockMult`, `blockPerCard`, `blockNext` and `blur` (`battle.blockNext` /
  `battle.blur`, used in `beginPlayerTurn()`, with badges), `blockDamage` true or a multiple (with `block`, the block comes
  first: Aqua Tail), power `riptide` (every `gainBlock()` and the turn's first block hit the enemy). Hand: `drawTo`,
  `ifDiscarded`, `costDownOnDiscard`, `discardHand` + `perDiscarded` (`timesEach()`). At the end of your turn Still
  Waters' `retainN` asks which card to keep (`pickFromHand()` takes an `only` filter; `choosing.only` greys the rest),
  then every kept card with a `growOnRetain` (next to `effects`: Aqua Cutter, Life Dew, Hydro Cannon) or under Ebb and
  Flow (`retainDiscount`) becomes its own copy for the fight, with bigger effects or a `discount` that `costOf()`
  subtracts; the deck's card is untouched. The sim mirrors it all; its bot check (6c.5) found the pool 7-16 points
  weaker, so Shelter blocks 9, Mist 12 and Chilling Water trades a draw for Weak 1 (human bot L0 / L3 / L5 ~74 / 57 / 36).
  **Grass's pool (6c.5, 2026-09-27)**: 20 common / 32 uncommon / 14 rare + 8 evolution cards (the doc's Grass section).
  Grass's mechanics, all in `js/battle.js` with `describe()` lines: **Leech Seed** (`seed`, `enemy.seed`, 🌱 badge: at the
  start of the enemy's turn, after Burn, it loses that much HP, you heal as much, then it drops by 1; Grassy Surge's
  `seedKeep` stops the drop; Seed Sower's `attackSeed` seeds on every hit that gets through) and **Sap** (`sap`,
  `enemy.sap`, 🍂 badge: `attackDamage()` subtracts it, all fight). Every debuff from a card or power goes through
  `applyDebuff()` (Effect Spore's `debuffDamage`, Sap Sipper's `weakBlock`); `debuffKinds()` counts Weak / Vulnerable / Seed /
  Sap / Burn (`perDebuff`, `drawPerDebuff`). Every heal goes through `healPlayer()` (Chlorophyll's `overheal`: healing past
  max HP becomes block; Grass Pledge's `healStrength`, once a turn via `battle.pledged`; `battle.healedThisTurn` for
  `ifHealed`), every strength gain through `gainStrength()` (Harvest's `strengthHeal`; `flex` strength is kept in
  `battle.flex` and taken off in `endTurn()`). Also `ifWeak` / `ifVulnerable` / `ifSeeded` / `ifEnemyAttacks`,
  `healPerStrength`, `healPerSeed`, `doubleStrength`, powers `attackHeal`, `weakEachTurn`, `exhaustHand: 'status'`, and
  `feed` (Jungle Healing, StS's Feed: +max HP on a kill; `onEnd` now passes `maxHp` and `afterFight()` keeps it). Leech Seed
  skips block and heals, so its numbers are small (Worry Seed 3): at 4-6 the human bot won 89 / 77 / 59 at L0 / L3 / L5.
  **Neutral pool (6c.9, 2026-09-27)**: 21 cards any type can be offered (the doc's Neutral section), 9 of them new:
  Quick Attack, Rapid Spin, Double Team, Substitute, Mimic (`copyPick`), Endure (`endure`: `battle.endure`, a 🎗️ badge,
  `hurtPlayer()` stops at 1 HP until your next turn), Metronome (`randomCard`: a random card from `typePool(type)`, free
  this turn; the free copy carries `orig` and `settled()` puts the real card back wherever it goes, and in the hand at the
  end of the turn), Hyper Beam (a negative `nextEnergy`, a red ⚡ badge) and Last Resort (`needsEmptyDraw`).
  **Reward rules (6c.9)**: a fight's card reward (`cardChoices(run, source, 3, { reward: true })`, not the Mart or events)
  offers commons/uncommons upgraded at `REWARD_UPGRADE_ODDS` per biome (0 / 25% / 50%, StS's) and adds `run.rarePity`
  (StS's rare pity: +1 rare weight per common offered, up to 40, reset once a rare is offered; saved with the run, an old
  save's missing value counts as 0) to the rare weight. Both live in `js/rewards.js`.
  Bot pass after 6c.9 (human bot, fire / grass / water): L0 ~75 / 76 / 69, L3 ~64 / 59 / 49, L5 ~39 / 33 / 26; Water
  trails at Levels 3-5 (the status cards clog its hand-based decks). Numbers per part are in the roadmap's step 6c.9.
  **Upgrades (PP Up)**: `CARDS_BY_ID['<id>+']` is every card's upgraded copy (name `<name>+`, green
  name, `upgraded: true`, `base`), built at load from its `upgrade` field or the default rule
  (`upgradeOf()`), so a deck saves upgraded cards as ids and old saves load unchanged (no version
  bump). Anything counting copies uses `baseId()` (MAX_COPIES, Mart, Day Care, Move Tutor, rewards).
  `ALL_CARDS` stays base cards only. The Center's third choice is PP Up (see Deck thinning).
  **No duplicates in one run** (the user found Fire Lash = Double Hit, 2026-09-28): no two cards a run can meet (its type's
  pool, the neutral pool, its starting deck) may share cost and text. `noOffer: true` keeps a card out of `poolForType()`
  (Block: Grass's starting Defend, which offered doubled Water's Withdraw); Tackle is Pommel Strike (6 + draw 1) and Fire
  Lash burns. Cross-type twins (Scorch / Seed Bomb, Firestorm / Solar Beam...) never meet in a run, so they stay.
- **Starter Abilities** (StS's starter relics): `ABILITIES` in `js/data/relics.js`, one per type, so
  every skin shares it and nothing is saved (it comes from `starter.type`). Fire **Blaze**: attacks +3
  while HP is below half (a 🔥 badge shows while it's on); Grass **Overgrow**: heal 3 after each won
  fight (in `finish()`; see Items for the bot numbers); Water **Torrent**: start each fight with 2 Tide. It's the first row of the
  Bag's Relics pocket, an "Ability: X" line in the character select's panel (`#sel-ability`), an "Ability: X" line on
  the map's run card (`#run-ability`), and an Ability Capsule chip on your battle nameplate (`#player-ability`,
  tap for its text; the capsule, not the type icon, so it doesn't read as a type). When it does something,
  `abilityBanner()` in `js/battle.js` slides in Gen 5's "Charmander's Blaze" window (`#ability-banner`) on
  your side for 1.9 s: Torrent on turn 1, Blaze each time HP drops below half (`checkBlaze()` in
  `renderAll()`, again after a heal took it back over), Overgrow when it heals after a win (the faint pause
  is 1.7 s then). The rare power card `blaze`
  is named Solar Power now (same id) so the two don't share a name.
- **Types**: four types (fire/grass/water, and `normal`, shown as Neutral,
  x1 both ways). `typeMultiplier()` in `js/battle.js` is the chart; a card
  uses its own `type`. An enemy attack uses the move's `type` if it has one,
  else the enemy's: moves whose real type isn't Fire/Grass/Water (Body Slam,
  Bite, Vice Grip, Acid) carry `type: 'normal'` in `js/data/enemies.js`, so
  give any new off-type move one too. **Elites and bosses ignore the chart
  both ways** (`typeless()`, by `battle.kind`, so Team Rocket's Alpha too;
  the user's call: type walls there felt unfair, match-ups are for wild
  fights). Since 6c.10 every elite and boss is also a pure Normal Pokémon (the user's call: a Gloom that
  wasn't weak to Charmander looked like a bug), with no Fire/Grass/Water move names. So the elite type-disadvantage coin bonus is gone, and they *show* as Neutral too
  (the nameplate chip, `setupBattleScreen()` in `js/battle.js`; the map shows no type badge at all), since
  their own type would suggest a match-up; `def.type` stays as theme for the Pokédex. The sim
  mirrors both (`enemyMult()`; variant `oldTypes` restores the old rules).
- **Economy**: `js/storage.js` holds `coins` and `passives`. `awardCoins()`
  applies the Coin Finder bonus and persists. `COIN_REWARDS` live in
  `js/run.js`; fight and win coins grow +10% per Trainer Level played (`COIN_LEVEL_BONUS`, `levelCoins()`; shown
  on the Prepare step's coins chip and the How to play coins slide). Shop catalog is `js/data/shop.js`; `js/shop.js`
  renders it. **Game Corner perks** (step 8, 8 in all, each shown `Lv n/m`; `perkLevel(id)` in `js/storage.js` reads
  one, true/false or a number): Max HP Boost, Starting Relic Charm, Well-Fed, Coin Finder, and since step 8 **Bag
  Pocket** (StS's Potion Belt: `itemSlots()` in `js/run.js`, 4 items), **Mart Card** (Membership Card, 3 levels:
  `MART_DISCOUNT` 10/15/20% off every Mart price and the removal, applied at the counter by `martPrice()`, so the
  saved stock keeps its base prices), **Move Tutor Notes** (Neow's upgrade, 1 level; a Lv 2 of two moves was +8 to +28 points at Level 3: `run.tutorLeft` starting moves
  to PP Up, asked by `tutorNotes()` at the end of `showMap()` after the checkpoint, so a refresh asks again) and
  **Scout Report** (Question Card: `REWARD_CARDS`, 4 cards on a fight's card reward). Old saves merge the new
  passives in as 0/false. **Shiny starters** (cosmetic): the Game Corner's third row, one per starter but Mewtwo
  (`SHINY_COSTS`: 250 the free three, 350 skins, 500 legendaries, the user's call 2026-09-27; only once you own the starter, else a silhouette).
  The save's `shiny: { owned, on }`; buying switches it on, and a ✨ Shiny pill in the character select's panel
  (`#sel-shiny`, only once owned; a ✨ marks the portrait too) switches it. `spriteUrl()` in `js/data/starters.js` swaps in `<id>-shiny-<kind>.gif` when it's on
  (main.js hands it `isShiny` via `useShinies()`, since data files don't read the save), so every screen follows,
  a legendary's Super Saiyan forms too. The 126 GIFs are PokeAPI's black-white animated `shiny/` and
  `back/shiny/` sprites (the same source as the normal ones, byte for byte); `spriteFit()` in
  `js/data/sprite-fit.js` lends a shiny its normal sprite's entry. In battle a shiny comes out of its ball in a
  burst of ✨ (`shinySparkle()` in `js/battle.js`).
- **Level 5 rewards** (part 1, the user's picks 2026-09-28; the Hall of Fame is part 2): `level5Rewards()` in
  `js/run.js`, from `endRun()` on a won run at `MAX_LEVEL`, before `announceUnlocks()` (Mewtwo reads it). It counts
  `stats.level5WinsBy[starter]` (a gold ⭐ on that starter's portrait, `.sel-star`, and after its name in the character
  select's panel, `.sel-name-star`), gives the starter's shiny and switches it on if it isn't owned, and pays
  `LEVEL5_JACKPOT` (500, Coin Finder applies) once per type (`stats.level5Jackpot`). Each reward is a line in the
  result window. Old saves seed nothing (the user's call): rewards start from the next Level 5 win.
  **Hall of Fame** (part 2, 2026-09-28) and its **record book** (the user's follow-up, same day): `endRun()` saves *every*
  won run, any Level, in the save's `hallOfFame` list (oldest first; `recordWin()` in `js/halloffame.js`): `no` (win
  number), `fame` (Hall of Fame number, Level 5 wins only; `fameNo()`, and entries saved before the record book were all
  Level 5, numbered by `no`), starter, stage, shiny, type, local `date` / `started` "YYYY-MM-DD", level, the final deck,
  relics and Bag (`items`), `itemsUsed`, HP, and the run's numbers from `run.tally`. The tally (`freshTally()` in
  `js/run.js`, saved with the run; a run saved before it counts from its restore, with no `startedAt`) adds up each fight's
  `tally` from `onEnd` (`battle.tally` in `js/battle.js`: cards played, damage dealt without overkill via `enemyLoses()`
  for hits, Burn and Leech Seed, the biggest hit, items used, plus turns and damage taken) in `addTally()`, and counts
  Alphas, ❓ rooms, moves forgotten (`forgetMove()`) and ₽ spent (every Pokédollar payment goes through `spend()`; earned
  is money left + spent). Every win awaits `winScene()` before opening the result window (a modal dialog would sit in the
  top layer over it; the user wanted normal wins to feel satisfying too): the pedestal scene below, then the run's numbers
  as a grid of dark tiles popping in (`statsPanel()`, short labels, from the same `statList()` as the record's page), then
  the deck. A Level 5 win is the Hall of Fame version (gold pedestal, title, its song, "Welcome to the HALL OF FAME!");
  any other is "Victory!" on a silver pedestal with its own song, `run-win` (`assets/audio/run-win.mp3`, the user's, 112 s; if it's ever missing the victory fanfare already playing carries on), saved "as Win NNN". A Level 5 win also throws a **party** (part 3, 2026-09-28; `.party`, never under reduced motion, where it
  has no sound either): `celebrate()` in `js/celebrate.js` draws on `#hof-fx`, one low-res canvas behind the layout (3 CSS px a
  pixel on phones, 4 wider; ~30 fps; `stop()` when the scene closes), all in whole pixels, fading by stepping down a palette,
  never by alpha: two spotlights sweeping from the bottom corners (filled row by row), rockets on ember trails bursting in the
  starters' type colours and gold (sphere, ring, Poké Ball, gold willow, a crackler fizzing into white sparks), shooting
  stars, four-point twinkles; `land()` fountains gold sparkles off the pedestal as the Pokémon hops onto it (`.hop`); the
  title's letters (`.hof-letter`, `setTitle()`) flash in one by one, then a rainbow sweeps across them every 2.6 s;
  `finale()` at "Welcome to the HALL OF FAME!" launches a huge Poké Ball burst with a rainbow core (its `onBoom` flashes
  `.hof-boom` white and shakes the layout, `.boom`), two side bursts and a 14 s rain of gold confetti and ribbon streamers.
  Its sounds are synths in `js/audio.js` (`fw-launch`, `fw-pop`, `fw-boom`, `fw-crackle`: NES-style held noise,
  `chipNoise()`). Headless at 390x844 and 1280x800 it held 30 fps. The Hall of Fame scene (`#hof-scene`, z-index 950 like the evolution's) is Gold/Silver's: a
  white flash onto a starry night, your Pokémon slides onto a gold pedestal under a spotlight (`SPRITE_FIT` feet, half
  steps) and cries, its plate pops up (No.NNN, name, type chip, date, Lv.5), "Welcome to the HALL OF FAME!", then the
  final deck rises as a strip of `.card.small`s (`.scene-keep`: it scrolls, taps on it don't advance the text) over the
  text box. Its text box is the evolution scene's, `sceneSay()` exported from `js/evolution.js`. Music: `hall-of-fame`
  (`assets/audio/hall-of-fame.mp3`, the user's, 52 s), preloaded before a Level 5 final boss; while the file is missing
  `TRACK_FALLBACK` in `js/audio.js` plays `victory` instead (the element's `error` marks it `missing`). The Collection has two
  cards for it (the user's call: Level 5 champions and normal runs both worth seeing), each a grey "???" with a 🔒 until its
  first entry (`book()` in `js/collection.js`; a tap says how to unlock it, `tipAt()`), and the result window says "Record
  Book unlocked!" / "Hall of Fame unlocked!" the first time: **Record Book** (every win, "Win NNN", Level 5 ones with a ⭐)
  and **Hall of Fame** (Level 5 wins, numbered No.NNN), the last card (the user's call). Both open `#hof-dialog` (`openRecords('fame' | 'record')`,
  `bookEntries()`): entries newest first; tap one for its page: plate, a grid of its numbers (old entries show "-" for what
  they lack), the Ability and relics, the items left in the Bag and the ones used (sprites; a tap shows their `title`), and
  the final deck (`fillDeck()` from `js/deckpreview.js`, each card `zoomable()`).
- **Achievements vs shop unlocks**: `js/progress.js`'s `isShopUnlock(starter)`
  (`!starter.free && !ACHIEVEMENT_FOR[starter.id]`) is the switch between
  the two unlock paths.

## Saved runs

The run in progress is checkpointed to its own localStorage key
(`pokedb.run.v1`, helpers at the bottom of `js/storage.js`) every time
`showMap()` runs, so a refresh resumes on the map before whatever room you
were in; a battle is replayed from the start, never serialised.
`checkpoint()` / `restoreRun()` in `js/run.js` store everything by id
(starter, cards, relics, unlocks) and rebuild from the data files; `mods`
is recomputed with `modsFor(level)`. The map's `floors` and `byId` share
node objects, so restore rebuilds `floors` from `byId` to keep `visited`
in sync. Every fight node gets its `enemyId` in `startBiome()` (dealt by `dealEnemies()` in `js/data/enemies.js`, floor by
floor: each room gets a Pokémon the fewest routes into it have already met, from a per-biome deck, so a route meets the same
Pokémon twice on ~2% of routes instead of ~45%, with each type's share unchanged; the user's call 2026-09-28) so a
refresh can't reroll a fight (no room names its Pokémon in its `title`, elites and the boss included, the user's call
2026-09-28; only a Silph Scope reveal does).
The save is cleared by `endRun()`, by starting a new run over it (Begin run confirms), and by the About dialog's
erase. The Poké Ball menu's Main menu keeps it (`suspendRun()`, the user's call): straight from the map, and after a
confirm from anywhere else, since that room replays from the map checkpoint; `abandonRun()` is only for the run's end. Fight coins and the enemiesDefeated stat
are shown on the reward screen but only paid out as the rewards end, just
before the checkpoint, so refreshing on a reward screen can't pay twice.
The Pokédex credit (defeats, research and its coins) is saved the moment a fight is won, so `creditRoom()` in `js/run.js`
writes the room (`biome:nodeId`) into the saved run's `credited` list straight away: a refresh still replays the room
(like restarting a StS fight), but winning it again doesn't count for the Pokédex twice (the user farmed Miltank's
research by refreshing, 2026-09-28). Refreshing mid-fight to restart one you're losing is allowed on purpose (the
user's call: StS allows it too), so don't serialise battles to stop it.
A version mismatch or any bad id (deck, relics, Mart stock) silently
discards it: bump `RUN_SAVE_VERSION` when the shape changes. The title's
Continue gem (`savedRunCard()` in `js/main.js`, drawn by `renderMenu()` in `js/title.js`) shows whenever a valid save
exists, its icon the run's Poké Ball wobbling like a catch in progress (`.cball`, the old Continue card's pixel ball, which
the user wanted back), its biome and HP on the nameplate under the gems; tapping it swings the lid open in a flash of light, and your
Pokémon comes out white, then in colour, with its cry (`sendOut()`) before the map loads. Begin run confirms before replacing a save.

## Cloud save

Optional, from the Poké Ball menu (the user's picks, 2026-09-28: Firebase, Google and email-link sign-in, ask when two
saves differ). `js/cloud.js`; the project (`pokedb-42e7c`, the user's) and its public web config is `FIREBASE_CONFIG` in `js/cloud-config.js` (not a secret;
the Firestore rules guard the data). While it's `null` the ☁️ Sign in item (`#cloud-btn`) and the title's PC stay
hidden and nothing changes. The title's top-left corner has its own way in once the gems are up: the games' PC
(`#title-account`, the 🖥️ pixel icon big, captioned Sign in / Cloud save, a green power light once signed in; the user's
idea; tapping it plays `pc-on`, `assets/audio/sfx/pc-on.mp3`, the games' PC boot sound, supplied by the user, and
sets `data-close-sound="pc-off"` on the window, so however it closes it plays `pc-off.mp3` (logging off) in place of
`cancel`: `js/ui.js`'s outside tap and `js/audio.js`'s Escape skip `cancel` for a window with a `data-close-sound`; both
are preloaded so they replace the menu blip; from the Poké Ball menu it closes as usual). Signed out, the Firebase SDK (gstatic, 12.19.0, `firebase-firestore-lite`) is never downloaded: it loads only
when `pokedb.cloud.v1` (this device's `{ uid, rev, dirty, localAt }`) says you're signed in, the URL is an email sign-in
link, or you open the window. Both localStorage keys (`SAVE_KEYS` in `js/storage.js`) go as they are into one Firestore
document, `saves/<uid>` = `{ save, run, rev, savedAt, device }`; `onSaveWrite()` fires on every write, and the upload
follows 4 s later (and when the tab hides, or comes back online), in a transaction that refuses it if the cloud's `rev`
isn't the one this device last agreed with. Rules: cloud moved and this device didn't → take the cloud's (write the keys,
`location.reload()`; only on the title or right after signing in, else ask); this device moved → upload; both → the
"Two saves found" window (`#cloud-pick-dialog`, a summary of each; closing it means ask again next load). The first
sign-in on a device uploads its save if the cloud has none (the user's phone save becomes the first cloud save) and takes
the cloud's if this device has no progress (`isBlank()`). Sign out keeps the local save. The About erase uploads the
erased save too. Email links come back to the page with `?mode=signIn&oobCode=...`; the address is kept in
`pokedb.cloud.email` (asked again if the link opens in another browser) and the URL is cleaned. Firestore rules, and the
Firebase console steps, are in the roadmap's step 4. Headless tests route gstatic to stand-in modules (the real SDK
can't be reached from a cloud session).

## Deck thinning

The Pokémon Center (`restSite()` in `js/run.js`) offers Rest *or* **PP Up** (StS's campfire, the user's call
2026-09-27); its PC's "Forget a move" (`forgetMove()`) is greyed out unless you hold the **Mental Herb** relic
(StS's Peace Pipe). Then **PP Up** (`upgradeMove()`, StS's Smith: pick a card,
the blown-up copy shows the upgraded version via `option.zoom`, and it's swapped
for its `<id>+` in place): each a `showChoice` picker of the deck
grouped with `groupDeck` (×N badges), "Back" returns to the Center. The Center
has no tiles (the user's call, for immersion): its three options (`layout:
'center-room'`) are see-through buttons laid over the scene's healing machine,
PC and Chansey (PP Up, a purple sign; her rect is worked out from `spots.nurse`; each sign has a caption line, `captionedSign()`)
(`placeCenterSpots()`, from `centerSpots()` in `js/scene.js`, rerun on the
scene's `scenepaint` event), each under a bouncing `.center-label` sign, and the
scene isn't dimmed. Its text box sits just under the counter (`--counter-foot`) with
Leave at the bottom of the screen (the user's call); on a short phone `liftRoomLog()` lifts the box (`--log-lift`) just
clear of Leave, for event scenes too. It never
takes the deck below `MIN_DECK` (7); at the minimum the PC is
`disabled` (`showChoice` options accept `disabled`). Forgetting doesn't
count as a rest for `restCount`. The Cleanse Tag relic reuses the picker
right after it's picked up (`forgetMove(back, done)`: `done` continues the
reward chain instead of returning to the map). The Poké Mart sells removal too
(see below); events are planned as another source.

## Poké Mart and Pokédollars

Pokédollars (₽, 💴) are per-run prize money, separate from the meta
PokéCoins: `run.money`, saved in the run save and lost when the run ends.
All the numbers live in `js/data/mart.js` (`PRIZE_MONEY` ranges per fight
kind, card/relic prices by rarity with a ±`MART_JITTER` wobble, removal
`base` + `step` per removal already bought this run, `run.removals`). Prize
money is rolled in `afterFight()` and paid in `collect()` with the coins, so
a refresh can't pay it twice; the Amulet Coin relic doubles it. `setMoney()`
in `js/ui.js` fills the top-bar `#money-pill`, which `showScreen()` shows
only on `RUN_SCREENS`.

`shop` is a map room type (blue 🏪 town square, never twice in a row on a
path). Marts aren't rolled (`ROOM_ODDS.shop` is 0): after the other rooms are
rolled, `placeMarts()` in `js/map.js` turns fights/events on `MART_FLOORS`
(the floors after the treasure, ~5 fights of ₽ in) into Marts, greedily picking
the room that the most start-to-boss routes pass, until `MART_ROUTE_SHARE`
(75%) of routes pass one. That gives ~2.1 Marts a map on ~85% of routes
(before: one random Mart, often floor 4, on ~34% of routes, and on 60% of maps
some start couldn't reach any); the Level 0 bot moved within noise (~94.6%).
Measure with a route-share count over a few thousand `generateMap()` calls. Its stock (`node.stock`:
cards, items and relics, each `{ id, price, sold }`) is rolled in `startBiome()`
and saved with the map, so a refresh can't reroll the shelves.
`martRoom()` in `js/run.js` reuses the reward screen (`showChoice`) and
re-renders itself after each purchase; `ware()` wraps a card/item/relic tile with
its price tag (red and disabled when you can't afford it), a `group` and a
two-tap "Buy ₽N" confirm. `layout: 'mart-window'` lays the Mart out like a Zelda shop
(the user's sketch), the same at every screen size, with no window: behind a glass
counter (the grid's `::after`, bare: the user found items on it odd; Leave sits on the floor
just above the text box) stands one
grey pixel shelf unit (hard-edged gradient bands for depth, a strip light under each
board, a Mart-blue crown with a Poké Ball, and big swinging Bag-pocket `.shelf-sign`s over
the items and relics shelves, added by `martRoom()`: an icon, outlined pixel letters), all the moves on
the top shelf as `.card.small` thumbnails (a pixel shine sweeps across them; the tap
blows up a full card, `option.zoom`), the items on the next shelf and the relics under
them in the gaps, a 3-2 pyramid, as bobbing bare icons with plain printed prices (no
tag boxes). Kecleon (2x, flipped to face the shelves) stands at the counter's left end,
and forgetting a move is the 💻 PC on its right (`martPc()`, under the Center's bouncing
`.center-label` sign, which shows the price: "Forget 💴50"). (Not `.mart`: that's the top bar's Mart icon.)
The room is its own indoor scene (`PLACE_ART.mart`, after the Gen 3 Marts): teal-banded
white walls with pennant bunting and hanging lamps (glow, flicker, drifting dust), and on
wider screens a window (clouds, a passing bird), crates, a SALE poster and a cork board;
green octagon tiles, and two blue bins heaped with Poké/Great/Ultra/Master Balls
(`ballBin()`) with the plants: beside the counter's ends where there's room; a phone's
counter spans the screen, so there `martProps()` paints them as little images
(`paintProp()`) that `.mart-props` stands in front of its foot (the user wanted nothing
scattered on the floor, and nothing hidden behind the counter).
It's barely dimmed, and its floor line follows the counter's foot and its plants its ends
(`showPlaceScene('mart', { floor, span })`), so the shop stands on the tiles instead of
floating (the user's calls; no fridges, no tiny clock or posters).
Removal reuses
`forgetMove(martRoom, pay)`, so backing out of the picker costs nothing; it can be
bought once per Mart (`stock.removed`, then the PC says "Sold out"). Every forget picker
(Center, Mart, Cleanse Tag, events) takes two taps, like adding a card: `ask`/`confirm` "Forget it".
On a short window (a 1280x800 PC, an iPhone SE) `fitMart()` in `js/run.js` zooms the shop out (CSS `zoom`, a binary
search down to 0.6) until Leave and the text box fit without scrolling; it reruns on resize and as the text box grows. `showChoice()` clears that zoom for
the next screen: left on `#reward-options`, it pulled the Center's Chansey and signs (and events' spots, all `position: fixed`) towards the top left.
Purchases are only saved when you leave for the map. Items are covered
under Items below.

## Treasure room

`treasureRoom()` in `js/run.js` has no tiles (the user's call: immersive, relics floating
with no borders). It shows `PLACE_ART.treasure` (`showPlaceScene('treasure', { biome })`):
a grotto with a shaft of light through a hole in the roof onto a stone dais, Voronoi-faceted
rock, crystals, stalactites, gold spilled round the dais. Its look comes per biome from the
art's `biomes` (the pattern for the planned event scenes: outdoor ones tint per biome):
Clearing mossy with blue crystals and drips, Shrine rose quartz with wisps, Wastes obsidian
with glowing veins and embers. The chest is Pokémon-style (the user's call): a Poké / Great /
Ultra Ball per biome (`BALL_CHEST` + each biome's `lid`), its button the latch, painted by
`chestLid()` / `chestOpenLid()` / `chestBody()` in `js/scene.js` and handed to the page as
images by `treasureChest()`. `placeTreasure()` stands it on the dais (`treasureSpots()`, in
the scene's own pixel size `--px`) and reruns on `scenepaint`. Tap: it hops, wobbles three
times like a Poké Ball, pops open (`ball-open`, a flash, rays), and the relics
(`relicChoices()`) arc up out of it to float in a row. A tap picks one (its text in the text
box, its name under it, a Take it button); tapping it again or Take it flies it into the Bag
(`item-get`), then `gainRelic()`. Leave is hidden with `visibility` meanwhile (`showChoice()`
resets it) so the text box doesn't jump.

## ? events

`event` map rooms (❓, purple frame) hold one of the scenes in
`js/data/events.js` (numbers, often per biome as `[b1, b2, b3]`); what each
choice does is in `EVENT_CHOICES` in `js/run.js`, shown with `showChoice`.
`rollEvents()` (from `startBiome()`) stores `node.event` = `{ id }` plus any
dice (Item Ball's `trap`, Team Rocket's `enemyId`, Day Care's shuffled
`offers` per rarity, Wishing Well's `luck` + `relics`, Shrine's `relics`),
drawn from a shuffled bag so a biome has no repeats until all have come up;
a refresh can't reroll them. Card/relic ids on an event are checked by
`eventIdsKnown()` on restore. Lists (not single ids) are stored so a card
or relic gained since the biome started is skipped for the next one:
Day Care trades a common/uncommon (never an evolution card) for the first
card of the next rarity you hold under `MAX_COPIES`; Shrine gives the first
unowned relic of your type's `only` relics, then normal ones. The Wishing
Well's one `luck` roll serves both tosses (the big toss wins whenever the
small one would); a win offers its unowned `relics` via `showRelics()`. When the small toss can't be
made (too little ₽, or nothing left to win), its spot becomes "Fish ₽N" (`fish`, free ₽), so the
room is never wasted (the user hit one with no money).
Fan Club never costs anything (₽ above half HP, else a Super Potion, or ₽ with a
full Bag). Relics from events go through `gainRelic()` so Cleanse Tag works.
At first the four new events cost Level 5 ~3 points (66%): Shrine HP is barely
healed back when Centers heal 10%, and they replace the healing events some of
the time. Cheaper Shrine (6/9/12 HP) and Well (₽30-50 / ₽70-110) and a Super
Potion from the Fan Club fixed it. Bot now: L0 94.8, L3 86.4, L5 68.1 (Water
trails at L5, ~56%, with or without the new events). Paid choices use `moneyOption`/`hpOption` (greyed out when
unaffordable, and HP costs never faint you), and money/HP is only taken once
the reward is actually received, so "Back" is free. Team Rocket's Battle
runs `fight()` with a copy of the node typed `elite`, so it pays elite
rewards; it has no Leave. A new event needs an entry in both places, an
icon in `ICONS` for any new emoji, and a `RUN_SAVE_VERSION` bump only if the
node shape changes.

Every event has a scene of its own (no event shows plain tiles any more). `EVENT_SCENES` in `js/run.js` maps an event to
its `PLACE_ART` entry; `outdoor: true` makes `showPlaceScene()` paint that biome's own wild scene (sky,
backdrop, ground, life) with the event's props in the middle (`prop`, `eventProps()` in `js/scene.js`), and
its `biomes` only retint the props. Like the Center, there are no tiles: layout `event-room <scene>-room`
lays each choice as a see-through button over a prop (`life.eventSpots`, `eventSpots()`, placed by
`placeEventSpots()`) under a bouncing `.center-label` (`spotOption()`) whose second line (`.spot-caption`, in the pixel font like every window since 2026-09-28) says what
it does (phones never see a `title`; `spreadSigns()` keeps the signs on screen, off each other and off the screen's title), with the text box under the props
(`--counter-foot`). A pick plays out on the scene first (`playOut()` → `sceneAct()`: frames in `ACTS`, drawn
by the prop's draw function off `actFrame()`; skipped under reduced motion), then takes effect. Berry Tree:
eat (berries fall and vanish) or plant (one flies into the empty plot, a sprout comes up). Hot Spring: soak
in the big pool (a cloud of steam) or dip in the small one (ripples); a rubber duck bobs. Wishing Well: its
two halves are the two tosses (signs leaning apart); a coin (a Nugget for the big toss) arcs in, splashes,
and a win sends light and sparkles up. Item Ball (60% an item, rising straight out via `offerItem(item, next, { opened:
true })`; 25% a Voltorb, `trapChance`; 15% a relic, `relicChance`: the user's call 2026-09-27, rolled into `node.event.trap` /
`.relic`, so older saves get an item where they had a relic): a Poké Ball in a patch of the games' tall grass (outlined
tufts, drawn live so they rustle); picking it up wobbles it, then it pops open, or opens its eyes as a Voltorb,
flashes and explodes over a scorch. Team Rocket: a black-and-red roadblock with an R board and a bush, with the grunt
and their Alpha standing at it as real GIFs (the choice returns `figures`, `{ stand: { src, alpha } }`; each
`.event-figure` stands on the scene's `life.stands` at half the scene's pixel size, like Chansey, fitted by
`SPRITE_FIT`). The grunt is male or female (`grunts` in `js/data/events.js`, rolled into `node.event.grunt`;
saves from before fall back to the first), animated HGSS-style sprites by justin8964 in `assets/trainers/`,
credited in About. Paying throws coins into the grunt's hand and `figureDoes('trainer', 'hop')` hops the sprite as they
land; Battle goes straight to the fight; Run shakes the bush (and `shake`s the grunt). Shrine (`PLACE_ART.altar`, not `shrine`: that's a biome) is a
close-up with a scene of its own, not a prop in the biome's (the user found it "very small"): like the grotto, no `outdoor`,
a look per biome from `biomes` (`wall`: a Clearing wall of leaves `foliage()`, the Shrine's misty cedars with a roped
sacred tree `cedars()`, the Wastes' cut rock `facetRock()`, shared with the grotto; a fence along it, `shrineFence()`, and
a flagstone path, `shrineApproach()`). The Ilex Forest-style shrine (`shrine()`: steps, lattice doorway, straw rope, bell and
cord, flared roof with chigi) is sized by `shrineLayout()` to fill the screen, its foot ~200 CSS px above the bottom for the
text box and Leave; big stone lanterns (`stoneLantern()`) frame it, a second pair on wide screens. It glows in your type's
colour (`types`, picked by `showPlaceScene()`'s `type`, which works for any place with `biomes`), lanterns too; praying draws red HP motes into it, it flares, and a spark rises out; then the relic floats over the scene with
its name (`revealGift()`, the item screen's `floatingThing()`) until you tap it or Take it and it flies into the Bag. An act's
`cues` play sounds on its frames (`actCues()`; all at once under reduced motion): the Voltorb's `hit`, the
ball's `ball-open`. `life.keep` keeps grass blades and lava cracks off the props. Sounds:
`heal-hp` for the heals, `stat-up` for planting, `buy` for a toss or the toll.
Close-ups (own scenes, no `outdoor`, props sized to the screen with ~190 CSS px left under them for the text box and
Leave), besides the Shrine: the **Hot Spring** (`PLACE_ART.spring`, `springLayout()`: a big rock pool at your feet (soak)
and a little one fed by a bamboo spout (dip), a bamboo fence with the ♨ board, stone lanterns; per biome a sunny garden,
misty cedars, or a milky pool under volcanic rock with steam vents), and four rooms laid out by `roomLayout()` (its
`ceil` is the wall's top under the title and HP window, so wall props hang below it; `roomWall()`, `plankFloor()`,
`roomWindow()` onto the biome outside): the **Move Tutor**'s dojo (Alder sitting cross-legged on a straw mat before a chalkboard, the Pay sign on him: pay ₽,
act `lesson`; a sandbag: pay HP, act `train`), the **Move Deleter**'s study (bookcases, a lectern's open book: forget one,
act `erase`; a hypnotist's pendulum: forget two, act `hypno`; a dozing Slowpoke figure), the **Day Care** (the house's
clapboard front with a DAY CARE board in the 3x5 `pixelText()` font, a picket fence, an Egg in a straw nest, act
`trade`; Miltank and Marill figures) and the **Fan Club** (striped paper, portraits, pennants, a red carpet to a stage
under a spotlight, act `cheer`: confetti and hearts, the fans hop; Persian and Cinccino figures; a Super Potion gift
floats up with `revealGift()`). A figure's `flip` turns it round (front sprites face left). **Event NPCs** (step from 2026-09-28): a trainer stands in
each of those four rooms (`figures.npc = { npc: id }`, `NPCS` in `js/data/events.js`): the Move Tutor (Alder, `alder`, sitting on the
mat, not cut off; the desk, coin tray and scroll are gone, the user's call 2026-09-28), the Move Deleter (behind the dozing Slowpoke), the Day-Care Lady (behind Marill) and
the Fan Club's Chairman (on the stage). They're still sprites from Pokéngine (kyledove's, and Jext's Alder; credited in About),
`assets/trainers/<id>.png` plus a hand-painted eyes-closed `<id>-blink.png`, at the grunts' scale. `eventFigure()` in
`js/run.js` cuts each into legs, upper body and head layers (clip-paths from `NPCS`' `head` box and `waist` row) so they move
a whole sprite pixel at a time: the upper body breathes (a 2.8 s loop, random phase), the head bobs while the text box
types (`sayLines()` puts `.typing` on it), and the eyes-closed head blinks in for 120 ms every 2-6 s (`blinkNow()`).
Reactions go through `figureDoes(stand, move)`: `npc-nod`, `npc-no` (head shake), `npc-jump`, `npc-turn` (faces the other
way until the room closes). The Tutor nods through a lesson and turns to the sandbag to train; the Deleter shakes his head
when you back out of his picker; the Day-Care Lady turns on a trade; the Chairman jumps handing over his gift. A done
picker comes back to the room (`eventRoom(node, after)`, from the choice's `react(move)`): no choices, the NPC does `after`
(the Tutor nods, the Deleter and the Day-Care Lady jump) while the text box says what happened, and closing the box or
Leave goes on to the map. All of it stops under reduced motion. The outdoor ones (Berry Tree, Wishing Well, Item Ball, Team
Rocket) are close-ups too: their art's `zoom` (1.75) makes `resize()` paint the scene with bigger pixels, as far as
their props (`span` pixels across) still fit the screen, so a narrow phone zooms less than a PC. Your HP in an event room is the top bar's
little plate beside the Poké Ball (`#choice-plate`, as on every choice screen; the user's call 2026-09-28: there used to be
a row under the title), and `showHpChange()` runs its bar to the new HP before the room closes. Choices that open a picker (Tutor, Deleter, Day Care) play their act first; the
price is still only paid once something is picked.

## Items

One-use items (Slay the Spire's potions) in `js/data/items.js`: `effects`
keys (heal, block, strength, focus, energy, draw, guard, burn, flee, and since 6c.11b weaken / vulnerable / seed
through `applyDebuff()`, `burnMult`, `tide` through `gainTide()`, `maxHp`, `discover`, `revive`), a
`rarity` (common / uncommon / rare: drop/stock weight in `ITEM_WEIGHTS`, Mart price in
`MART_ITEM_PRICES`), `only` for a type's Gem or archetype item, and `map: true` for items
usable outside battle (heals, and HP Up). 20 items since 6c.11b, each new one on a StS potion (in a comment):
Black Flute (Weak Potion), X Accuracy (Fear Potion), TM (Attack Potion: `discoverCard()` lays 3 random cards of
your type out with `pickFromPile()`, the one taken is free this turn via `discount` + `orig`), HP Up (Fruit Juice,
+5 max HP; `onEnd` passes `maxHp` on a flee too), Revive (Fairy in a Bottle: can't be used, `whyNotUsable()` says so;
`hurtPlayer()` calls `revive()` when you'd faint, which takes it out of the Bag, sets 30% HP and adds its news to the
hit's log line via `withRevive()`), and one per type for an archetype: Fire's Burn Drive (Catalyst, doubles Burn),
Grass's Absorb Bulb (Leech Seed 4), Water's Fresh Water (5 Tide). They reuse emoji already in `ICONS`.
The same step's catch-up: Dive blocks 9 and Flame Body 10 (human bot fire / grass / water, 400 runs: L0 ~80 / 74-78 / 72,
L3 58 / 56 / 56, L5 29 / 34 / 32; details in the roadmap's 6c.11b). The run holds at most `ITEM_SLOTS` (3) ids in
`run.items`, saved by id with `run.itemChance` (a bad id discards the save).
Sources: 3 per Mart (`node.stock.items`, rolled in `startBiome()`, greyed
out with a full Bag), and after every won fight except the final boss a
StS-style drop (`ITEM_DROP`: 40%, −10% after a drop, +10% after a miss),
shown as a last reward step by `offerItem()`: it first lies in a round pixel Poké Ball in the middle of the screen
(the user's call, like the games' item balls; `itemBallArt()` in `js/scene.js` paints its two halves, a Poké / Great /
Ultra Ball per biome), which hops like the treasure chest; a tap wobbles it (`chestWobble`), then `ball-open` plays, the
top half pops off in a flash with the chest's rays, and the item rises out where it was (`.float-stage.sealed` →
`.open`; Skip works throughout). Then no tiles: the item floats like a treasure relic
(`floatingThing()`, tap it then Put in Bag, and `flyToBag()` shrinks it into the Bag); with a full Bag your items
float in a row under it, and the one you tap to toss greys out under a red pixel ✕ before you Swap (the user's
calls). Nothing heals through Big Root or boosts block through
Damp Rock: those are for cards.

In battle, `battle.items` *is* `run.items`, so using one removes it from the
run too (a refresh replays the fight from the checkpoint, items included).
There are no item slots on the battle screen (the user's call: the Bag is
more Pokémon-like); items are used from the Bag's Items pocket, whose Use
calls `pickItem()` → `tapItem()`, and `renderFocus()` shows a big
`.focus-item` tile to confirm. PP and End Turn share one size
(`.battle-controls .pp-pill`): big on PCs and sideways phones, small in the phone rules (≤720px); upright tablets (721–1100px portrait) put them in a row above the hand like phones, so five cards fit. `useItem()` costs
no PP and works only on your turn (`whyNotUsable()`). The Poké Doll ends a
non-boss fight with `onEnd({ fled: true })`: no rewards, back to the map.
The Bag's Items pocket (`renderItemList()` in `js/run.js`) lists them with
Use / Toss: in battle Use goes through `pickItem()` (same confirm), on the
map only heals work (and only when hurt) and Toss is allowed; on reward
screens both are disabled, since the next checkpoint would split a reward
chain, except Toss in the Mart (to make room for a buy: it re-renders the Mart, saved with the purchases). The bot harness mirrors all of this (`applyItem`, `useItems`,
`ITEM_VALUE`; `cfg.noItems` turns items off for A/B runs).
Items raised the Level 0 bot win rate from ~94% to ~96% however scarce they
were (it sees the enemy's next move, so one timely item saves most of its
deaths), so biomes 2–3 hit harder instead (`dmgBonus` 16→18 and 30→33 in
`BIOMES`). That brought Level 0 back to ~94%, with Level 3 at ~85% and
Level 5 at ~69%. Retune enemy damage rather than starving items.
The harness also has a human-like bot (`humanCfg()`: no intent numbers, 10%
random card plays, one-step routing; see its README), since the target is a
decent human winning about half their Level 0 runs. It won 87.5% at Level 0,
so every biome's `dmgBonus`/`bossBonus` went up +2/+3/+4 and Level 5's
`enemyDmg` down 2→1 to keep it beatable: human bot L0 ~75%, L3 ~62%, L5 ~43%
(strong bot L0 ~86%, L5 ~55%). Water is the weakest type at every level.
Roster balance pass (2026-09-26, after the new 54 Pokémon; the user found Fire
easy): the human bot was back up to L0 ~83%, and biome 1 was a coin flip for
Grass/Water at Levels 3-5 (Alpha elites out-HP'd the boss) while Fire walked
it. Now `dmgBonus` 6/14/24, `bossBonus` 7/19/30, Elite Territory +15% HP
(was 30), Fierce Bosses +10% HP (was 20), Cotton Guard 8 (9 since the 2026-09-28 catch-up, with Bubble Weak 2), Dive 9, and the
outliers evened within each biome (Arcanine, Flareon, Gyarados and Salamence
softer; Gloom and Ursaring harder; since 6c.10 those slots are Kangaskhan, Linoone,
Lickilicky, Porygon-Z and Raticate, same numbers). Human bot fire / grass / water: L0
74 / 76 / 76, L3 59 / 56 / 65, L5 36 / 33 / 39; strong bot L0 79 / 89 / 88,
L5 53 / 51 / 51. Fire still dies mostly to biome 3 bosses (it's strong early,
thin late), Grass/Water mostly in biome 1 at higher Levels. A +1/+2 block on
a starting card moved a type 5-20 points here too.
Card engine (6c.2, 2026-09-26): PP Up and the Abilities made the human bot
~12 points stronger (L0 69 / 78 / 71 -> 83 / 88 / 82; Overgrow at 5 HP alone
was +10-22 for Grass), so Overgrow heals 3 and biome `dmgBonus` / `bossBonus`
went +1/+2/+3 (now 7/16/27 and 8/21/33). Human bot fire / grass / water, 300
runs/cell: L0 70 / 77 / 76, L3 56 / 57 / 61, L5 34 / 34 / 33 (before, 400
runs: L0 69 / 78 / 71, L3 60 / 62 / 64, L5 37 / 32 / 38).

## Relics

`js/data/relics.js` (58 relics since 6c.11a); effects are applied where `hasRelic()` appears in
`js/battle.js` (Cleanse Tag, Choice Band, Amulet Coin and Big Malasada act in `js/run.js`). Every relic's art is
`assets/items/<id>.png` (PokéSprite), and each one from 6c.11a names its Slay the Spire model in a comment.
Fields: `only` = one type's starters; `rarity` = StS's tiers, 'common' / 'uncommon' / 'rare' (replaced the old
`rare` flag): each relic `relicChoices(run, { boss, source })` in `js/rewards.js` offers rolls a tier by
`RELIC_ODDS[source]` ('normal' 50/33/17 like StS; 'elite' 35/40/25 after an elite or Team Rocket; 'treasure'
20/50/30), falling to the next tier up (then down) when one is empty; the Mart prices relics by tier
(`MART_RELIC_PRICES`) and the Starting Relic Charm never gives a rare. `boss` = only offered after a boss (normal
ones once you own them all), never anywhere else. Six boss relics each give +1 PP with a catch (`ENERGY_RELICS`):
Choice Band (no Rest), Choice Specs (draw 1 fewer), Toxic Orb (lose 1 HP a turn, never below 1), Room Service
(StS's Velvet Choker: 6 cards a turn, `ROOM_SERVICE_CAP`), Griseous Orb (Philosopher's Stone: enemies start with 2
strength), Dusk Stone (Runic Dome: `renderIntent()` shows a grey "???" bubble). Each type has 8 relics: its +2
damage one plus two per archetype, one of them a rule-changer (Fire: Tamato Berry +2 per Burn (`burnEnemy()`), Spelon Berry half
the Burn again at your turn's start, Black Sludge +3 per attack for 1 HP on the turn's first (`battle.sludged`), Salac Berry = Runic
Cube (draws on every HP loss, in `markHurt()`), Dawn Stone = Dead Branch, Smoke-Poke Tail = Charon's Ashes (4); Grass: Protein = Shuriken, Muscle
Wing +1 to every strength gain, Gooey Mulch 2 Leech Seed at the start, Enigma Berry (heals hit the enemy), Max
Mushrooms = Snecko Eye (a drawn card is a copy costing 0-3 with `orig`, so `settled()` restores it), Toxic Plate =
Champion Belt; Water: Blue Flute +1 Tide a turn, Lustrous Orb (spending Tide leaves half), Eviolite 3 block every turn (Orichalcum never fired: Water nearly always has block),
Everstone = Calipers (block drops by 10), Slowpoke Tail = Runic Pyramid, Heart Scale = Tough Bandages). Any type:
Casteliacone (Ice Cream: unspent PP carries over), Magnet (Unceasing Top), Lum Berry (Medical Kit: status cards
cost 0, exhaust and draw a card, `lumCures()`; in battle they read that way too, 0 PP "Draw 1 card. Exhaust.", via
`asShown()` in `js/battle.js`, a display-only copy for the hand, risen card, piles and boxes), Strange Souvenir (a free random card of your type on turn 1), Fist Plate
(Ornamental Fan), Dragon Fang (Akabeko, +10: `battle.firstAttack`), Big Malasada (Meal Ticket: heal 15 entering a Mart,
in `enterNode()`), Lemonade (Lantern), Stone Plate (Horn Cleat). Relic damage that can end a fight off your turn
(Smoke-Poke Tail on an Ethereal card, Enigma Berry off a Potion) is checked in
`endTurn()` / `useItem()`. Healing from Big Root only boosts card and power heals, not other relics.
Relics carry runs here (with none, even the strong bot wins ~10% at Level 0), so the pool's average value is a big
balance knob: adding 30 middling relics first cost Fire 18 points at Level 3 (fewer Leftovers / Shell Bell / Heat Rock
offers). After the retune (see roadmap 6c.11a), human bot fire / grass / water: L0 71 / 79 / 73, L3 52 / 56 / 51, L5
27 / 29 / 26. Recalibrate `sim/ranks.json` after any relic change (`calibrateJobs(n, [ids])` measures just those).

## Battle screen layout

There's no top HUD bar. The arena shows each fighter with a **nameplate**
(a small Pokégear window: name + the same Gold/Silver `.gb-hp` HP bar as
the map, filled by `setHpBar()` in `js/ui.js`), laid out like the games: the
enemy's nameplate top left with the enemy top right, your Pokémon bottom left
with its nameplate bottom right. The nameplates are direct children of
`.arena` (outside `#enemy-zone`/`#player-zone`, which keep the sprites and the
`pop()` numbers) on a 2-column, 3-row grid; the two sprites share the middle
row in opposite columns, which keeps the scene short. The title row holds
just the name (and the enemy's type chip); under the HP bar, `.nameplate-foot`
has the **status badges** on the left and the HP numbers on the right. The
badges read like PSN/PAR in the games: no box,
just icon then number, coloured blue/green/red for block/buff/debuff (block, burn, Weak, Vulnerable, strength, focus,
guard, next-turn energy, your own strength, and one per active power), built by `badgeFor()` in `js/battle.js`. They fill
in from the left and wrap onto a second line when they reach the HP numbers. A badge
only renders while its status is active, and each one explains itself in
its `title` tooltip. The biome's and level's extra enemy damage (`encounter.strength`)
is kept in `enemy.dmgBonus`, not `strength`, so an enemy doesn't walk in with a 💪
badge (the user found that confusing); only strength gained in the fight shows. A nameplate gets `.has-block` (blue HP-bar rim) while
that fighter has block. Below the arena, `.battle-controls` is a 3-column
grid: energy (`.energy-orb`, drawn as the games' **PP** like the
Diamond/Pearl move screen: a white `.pp-pill` (ringed in its panel's `--rim` colour, in a capsule-shaped panel, on every button built from it) with "PP" on the left and "2/3"
on the right, on a salmon striped panel; the max is `b.turnEnergy`, the
energy the turn started with; `data-shown` remembers the last value so the
number bumps when it changes, and `.empty` turns the numbers red) | hand | End Turn
(`#end-turn-btn`, not a `.btn`: the same salmon panel and white pill, so the
two match; greyed out while disabled; when no card in hand can be played, `.nudge` (set in `renderAll()`, items don't count) makes it hop, scroll its stripes and blink a gold ring and a ▶ in the pill, the user's call, so it's clear to end the turn). The
draw/discard/exhaust piles (`.piles` / `button.pile`: a floating pixel card and the
count, like the coins) live in the top bar beside the Poké Ball, shown only
while `body[data-screen="battle-screen"]`. The exhaust pile (🌫️, its own icon: 💨 is shared) only shows once a card
has been exhausted; played powers also go to `b.exhaust` (so they leave the fight) but, as in StS, never count as
exhausted (`exhaustedCards()`). Tapping a pile opens `#piles-dialog` (`openPiles()` in `js/battle.js`, the user's call
2026-09-28, StS's pile screens): Index-style tabs Draw / Discard / Exhaust with counts, the draw pile sorted by name
(its order stays secret), the others latest first, cards grouped by object (a grown copy is its own card), each
`zoomable()`; it closes when the fight ends.
A played card goes to exactly one pile in `resolveCard()`: power → `b.exhaust`, exhaust/Corruption/Lum Berry →
`exhaustCard()`, else the discard. From 6c.11a (2026-09-27) to 2026-09-28 a misplaced `else` also put every power and
Exhaust card in the discard pile, so powers stacked every reshuffle and Exhaust cards came back; the sim had the same
bug, so bot numbers from those days include it. Relics don't show in battle (they
are in the Bag). Above them, `#battle-log` is a Gold/Silver
text box: `log()` types each line out (instantly under reduced motion) into
`#battle-log-text`, while `#battle-log-live` gets the whole line at once for
screen readers; `.done` shows the blinking ▼. The box is always two lines tall, like the
games', with exactly that room (plus a gap) reserved under your nameplate; a line
that would need three gets one notch smaller text (`fitLog()`), and the rare one
that still doesn't fit grows a line (the user's call). On phones the PP box
and End Turn share a row above the hand so the cards get the full width.
The enemy's next move (`#enemy-intent`, `renderIntent()`) is a compact
one-row Pokégear bubble over its head: icon, number, move name, and a pixel
tail. Its frame colour is the move kind (red attack, purple drain, blue
defend, green buff), and it pops in (`.fresh`) only when the move changes.
On short phones (≤700px tall, like the iPhone SE) the scene is tight, so a
media query at the end of the phone rules compacts the nameplates, keeps the
enemy's box square (`min-height: 0`, or a tall sprite like Oddish stretches
it), trims the space under your Pokémon so your nameplate clears the enemy's
feet, and keeps room above the text box; the phone rules also keep a 10px
gap between the two columns.
Hints live in `title` attributes. `js/tips.js` shows a tapped or clicked
element's `title` in `.tap-tip` (on `click`, not pointerup, and never within `SCROLL_QUIET` of a scroll: phones send no
click for a swipe or for the tap that stops a gliding scroll, which used to pop tips up; don't give a `title` to things
whose text already says it, like achievement rows, Index tiles or HP bars), a mini copy of the battle text box that stays until the next tap or click
anywhere. A mouse also gets it on hover (after 350 ms, gone on leaving),
in place of the native tooltip: while hovered the `title` moves to
`data-tip` and comes back on leaving. Taps and clicks on buttons and other controls are skipped, since tapping
them already does something (hover still shows their hint). Give new non-button things a `title` and they get
this for free.
There are no toasts (the user's call: no pop-ups that don't fit their area). Run news goes to `tell()` in
`js/rewards.js`: it's said in the next `showChoice` text box, before that screen's own lines, or on the
map in `#map-log` (the same box, pinned to the bottom of the map; `showNotes()` runs at the end of
`showMap()`, and straight away if you're already on the map, e.g. a Bag item used there). `beginRun()`
and the result window drop leftover notes (`dropNotes()`); the result window lists unlocks and the win's
coins itself. A note about one element uses `tipAt(el, text)` from `js/tips.js` (a locked starter's
how-to-unlock), and the Game Corner says its own on the CRT.
Scrollbars are chunky square pixel bars (end of `css/base.css`: `::-webkit-scrollbar`, `scrollbar-color`
only for browsers without it, since Chrome drops the webkit rules once it's set): a bevelled grey thumb in
a dark slot, a parchment slot inside windows.
Every `showChoice` screen also shows your HP: `#choice-plate` in the top bar beside the Poké Ball (a small
Pokégear window with a `.gb-hp` bar, shown only on `body[data-screen="reward-screen"]`), filled by
`showChoiceHp()` in `js/rewards.js` from `trackHp()` (run.js hands it the run); the Center's Rest refreshes it
as the heal runs. On ≤420px the bar drops its HP: tag, and on ≤340px the PokéCoins step aside for it.
Every `showChoice` screen (rewards, Center, events, Mart) puts its `sub` text
in `#reward-log`, a copy of the battle text box pinned to the bottom of the
screen, narrow and centred (`--log-w`: 440px, 300px on phones; the user's call: no
stretched text boxes; the untyped rest of a line is laid out invisibly, `.log-rest`,
so centred text doesn't slide as it types); the Skip / Leave button (in `.reward-actions`, with Oak's Advice's Reroll beside it) sits centred right under the options (the user's
call: not off to the right by the text box), except on the floating-thing screens (Item found, the treasure grotto),
and the relic rewards (`showRelics()`: elites, bosses, the Item Ball, the Wishing Well; since 2026-09-28 they burst out in
a flash and float in a row in the treasure room's rays, gold for a boss, tap one to read it, then again or Take it),
where the text box sits with the thing and Skip / Leave goes to the very bottom (the user's call: nothing should pull you
off the item). It draws its
`.relic` tiles (relics, items, choices) as parchment Pokégear windows, which on
phones become short rows (icon | name over text) so a choice isn't a screen tall (`sayLines()` in `js/rewards.js`; `sub` may be a list of lines): lines
type out and wait for a tap, like the games (the user wants no autoplay), and a tap on
the last line closes the box. After
a fight, `coins` (`run.pendingCoins`: `{ foe, coins, money }`)
shows as an icon row (💰 +25 💴 +₽120) on every step, and the first screen's
box says "The wild X fainted!", the PokéCoins and the ₽ as separate lines.
Options with `ask`/`confirm` (card, relic and item rewards) take two taps: the
first blows a copy of the tile up in the middle of a dimmed screen
(`openFocus()`, reusing battle's `.card-focus`/`.focus-card`) with the
`confirm` ("Add to deck") under it; the big tile or that button takes it, the
dimmed area or Escape backs out. "Add to deck" and Skip are `.ds-btn`s: End
Turn's striped panel and white pill, green (`.ds-go`) or blue (`.ds-skip`),
with a blinking ▶ in the pill. The menus' own buttons are **pixel pills** instead (`.pxb` in
`css/menus.css`, the user's reference, 2026-09-28): a button of two spans (`.pxb-o` the dark outline, `.pxb-i` the face, both
clipped to stepped 3-2-1 pixel corners by `--steps`) with a light band on top, a shade band below, white glint dashes and a
solid drop shadow; colours `.green` `.blue` `.purple` `.orange` `.sun` `.red`, `.white` for white labels, `.small`, `.on`
for a lit toggle or tab (a tab that's off sits back). They're the character select's Back / Choose / tabs / Shiny, the
Collection's Back and the Prepare step's Back / Begin run. The reward, battle and Mart capsules (`.ds-btn`) stay as they are
for now. Battle's picked card / item shows a red `.ds-play` Play / Use button (`focusButton()` in `js/battle.js`) instead of "Tap again to play".
Titles are short headers on a pixel-font plate ("Learn a new move", "Item found").
In the read-only deck views (the Prepare step's starting deck, `renderDeck()` in `js/select.js`, and the Bag's deck
window, `fillDeck()` in `js/deckpreview.js`) a tap on a card blows it
up (`zoomable()` / `zoomCard()` in `js/ui.js`); any tap or Escape closes it,
and inside a dialog Escape closes only the zoom.
The hand is held in a fan (`fanHand()` in `js/battle.js`, rerun on resize): cards
overlap, tilt and sink towards the ends, StS-style, squeezing closer as the hand
grows so the whole hand always fits (it never scrolls). It uses the `rotate`/`translate` properties so
the hover lift and deal animation (`transform`) stay separate; a hovered or picked
card straightens and comes to the front.
A card's pick from your hand (discard, exhaust, keep, Mimic's copy: `pickFromHand()`) takes two taps too: the first lifts
it like a played card with a button naming the verb (`PICK_VERBS`, `choosing.picked`), the second confirms (the user's call).
While one is asked the battle dims under the hand and a banner names it (`renderPicking()`, `#pick-banner`, `PICK_TEXT`;
`#battle-screen.picking`, `data-pick` colours it: exhaust purple, discard blue, keep green, copy gold, as are the pickable
cards' pulsing rings and the risen card's button, `.pick-<verb>`), and an exhausted pick goes poof first, as does a card exhausted as it's played (an Exhaust card,
Corruption, a status card under Lum Berry: `playCard()` starts it without waiting)
(`smokeOut()`, skipped under reduced motion: it flashes grey in a ring of pixel smoke, shrinks and flies into the exhaust pile,
like an item into the Bag, showing the pile if it was hidden and bumping it; its rule is `.card.exhaust-ghost`, since
`.card.focus-card`'s own animation would win): the user exhausted a card thinking they were playing it (2026-09-28).
Playing a card takes two taps (clicks or Enter presses too), except a card that
can't be played: one tap logs why and shakes the PP box, with no big preview
covering it. `tapCard()` first
picks it (`selectedUid`, `.selected` in the hand) and `renderFocus()` lifts a
big copy straight up out of its place in the hand, StS-style (the user's call:
it used to blow up in the middle over a dimmed screen): `popFromHand()` places it
in `#card-focus` (a see-through full-screen layer, `.rise`), grows it from the hand
card's box, hides the hand's copy (`.lifted`) and sets a small Play button under it.
Tapping that big card plays it, tapping elsewhere or Escape cancels
(`cancelPick()`), and tapping another hand card through the layer switches
(`elementsFromPoint`, by `data-uid`). Items still blow up at the bottom middle. The pick clears
itself whenever the battle is busy or the card leaves the hand.
Your Pokémon grows as it evolves: its sprites (map card, map
trainer) carry `data-stage`, and CSS scales stage 0 to 78% and
stage 1 to 90% with the `scale` property (from the feet), so the attack
animations' transforms and the layout are untouched.
**Evolving** (roadmap's Evolution overhaul, 2026-09-28, cosmetic only) is Gold/Silver's scene, `evolutionScene()` in
`js/evolution.js`, awaited by `evolve()` in `js/run.js` (the first boss reward step; the stage, HP and heal are already
applied). ~1.3 s into the victory fanfare the screen flashes white twice like `battleWipe()` and holds white
(`#evolve-scene`, a fixed layer at z-index 950 over everything; the music fades out). The Pokémon fades in alone, stood on
its feet at 58% of the height (both forms share one scale fitted to the bigger resting pose, `SPRITE_FIT` for the feet,
centred on its body, not its box: `massX()` weights each column by its height squared, so Charmeleon's tail flame hangs off
to the side (the user saw it sit left, 2026-09-28),
legendaries' 78/90% stage steps folded in), and cries; its text box (`#evolve-log`, `sayLines()` with an `onDone`, taps
anywhere on the white or Enter advance) says "What? X is evolving!". The tap starts the `evolution` track
(`assets/audio/evolution.mp3`); `morph()` flashes it white three times, goes to a dark silhouette (`.dark`, `.white` are
CSS filters) and switches old/new forms, 560 ms down to 50 ms apart, then white flashes between the fastest switches,
ending on the new form under a full-screen flash (`#evolve-flash`). The song is cut, the new form cries, `evolved`
(`assets/audio/sfx/evolved.mp3`) plays with "Congratulations! Your X evolved into Y!" and the stats line. The last tap
starts `victory` again, runs the next reward step (Signature move) under the white, then fades the white out onto it.
Legendaries power up in place (the aura forms from `spriteUrl()`, cries strip `-shiny`), and so do bought shinies
(`spriteUrl()`). Under reduced motion the cries, song and chime stay; the white fades in, and the song plays ~5.5 s over
the still first form before the swap, with no flashing. `fight()` preloads the song, chime and both cries before a boss.
In battle, both sprites are sized from their GIF files instead (`sizeSprite()` in
`js/battle.js` sets `--size`): the Showdown sprites share one pixel scale, so
Teddiursa (36px) is drawn small and Snorlax big rather than all filling one box. The
curve is softened and clamped, and the enemy's base size is smaller than yours
because it stands further back (the user's call). Legendaries, which reuse one
sprite, get the 78/90% stage steps folded into `--size`. Sizes and placement use each GIF's
resting pose from `js/data/sprite-fit.js` (median bounds over every frame, since a
hop or a wingbeat widens the frame): `--shift`/`--drop` centre that pose on its feet
at the box bottom, and `--head-room` drops the enemy's intent to its head.
Re-measure (ImageDecoder over all frames) when adding a sprite. The enemy's pad is
sized from `--base` on `.enemy-zone` and sits so the feet land just below its middle;
`horizonRow()` in `js/scene.js` mirrors that. The deck
preview's swipeable evolution line uses bigger steps (64/88/116px).
Enemy sprites are frameless; elites and bosses are marked by a red/gold glow.
Every screen is set in a pixel-art scene per biome
(`js/scene.js`, the user's call: the blurred photos clashed with the 8-bit
look; there are no photo backdrops left), lit for the time of day.
**Day and night** (2026-09-28, the user's call): every scene follows the device's clock, `timeOfDay()` in
`js/daytime.js` (dawn 5-7, day 7-17, dusk 17-20, night 20-5; `?time=` pins it). Scenery and light are kept apart so
per-floor stages (roadmap step 7) can plug in: a biome's `times` are its hand-painted looks (a `from` one is another
time's look graded under its own sky), and `kinds` lays an elite's or a boss's mood over whatever time it is (a `grade`
from `GRADES`, switches, `addLife`), since elites and bosses follow the clock too (the user's call). Anything without a
hand-painted look is graded (`grade()` in `js/scene.js`: every colour but `GLOWS`, sky keys by the sky grade) and
`relight()` swaps the sun for the moon and stars at night. The paint key includes the time, so the next screen after the
hour turns repaints.
**Progress dial** (roadmap step 7 part 1, 2026-09-28): `showScene(biome, kind, progress)` takes how far into the biome
you are, `journey(map, node)` in `js/map.js` (floor / (floors + 1), 0 on the road in, 1 at the boss; the map, battles and
outdoor ? events pass it; the paint key includes it). The painters read it as `dial()`: the Clearing's tree line grows and
crowds, a far wood hides the hills (from ~F3), big near trees frame the scene (F7+) and a leaf fringe closes overhead
(F9+), flowers thin out and shade creeps onto the grass; the Shrine gains up to 4 darker torii behind its gate (a tunnel)
and up to 3 pairs of stouter lanterns lining the path, with thicker mist; the Wastes' volcano looms from 72% to 122% size
with 1-3 lava flows running further down, more cracks, lava pools, embers and a brighter glow. The clock still decides the
light, so every floor gets every time. Shots of every floor x time: a headless script calling `showScene()` per step.
**Places** (step 7 part 2, 2026-09-28): each biome is 3 places plus the boss's arena, floors 1-3 / 4-6 / 7-10 / boss
(`stageOf()` in `js/map.js`; names in each `BIOMES` entry's `stages`). `journey(map, node)` now returns `{ progress, stage,
step, seed }` (step = floors into the place, seed = a hash of the map, so each run deals landmarks afresh and a refresh draws
the same), and `showScene()` / `showPlaceScene(..., { where })` take it (a bare number still works: no landmark). The painters
ask `stage()`: Clearing meadow -> forest edge (a stream winding along the back and down to the right, `winding()`, berry
bushes) -> deep woods (a canopy roof, dark trunks in a gloom, light shafts) -> the ancient giant tree; Shrine stone steps
(the gate raised on a flight, bamboo at the edges) -> torii path (as before) -> inner court (raked gravel, a plastered wall,
a bell tower) -> the main hall; Wastes ash plains (pale ground, dead trees, bleached boulders) -> lava fields (a lava river,
basalt columns, steam) -> the volcano's slope (rock rising at one side, sulphur vents) -> the crater rim over a lava lake.
Every floor of a place also gets one small landmark (`LANDMARKS`, 5 per place, 30 in all: signpost, log bridge, komainu,
koi pond, ribcage, warning sign...), dealt by the seed so two floors of a place never share one, at the back of the left
edge or the middle of the right (the deep woods: right only, the big trees frame the left), clear of the Pokémon. ? events
get the place but no landmark. Their colours are each biome's `marks`, painted by day and graded (a shade darker at dusk and
night). The map hangs the place's name under the biome sign (`#stage-name`, `.stage-sign`, swinging in when it changes).
Clearing: sunny day / sunset with fireflies / moonlit night / rose dawn. Shrine: misty
morning under pines with a torii, stone lanterns, light shafts and falling
leaves / dusk with lit lanterns and autumn leaves / night with blue spirit
wisps / pink misty dawn. Wastes: hazy volcano with glowing lava cracks, embers and ash / red
sky / a glowing night under a few stars / a violet dawn; an elite is a shade tenser, a boss darker and redder, with the
Shrine's spirits and lanterns out and the Wastes erupting (lava rivers, flying lava, lightning) at any hour. All of it is
data in `BIOME_ART` (shared per biome, `times` per time of day, `kinds` per fight; `life`
lists the animated parts), painted into `#scene-bg` (a fixed low-res canvas,
one canvas pixel = 4 CSS px on phones, 5 on PCs) by
`showScene(biomeId, kind)`: from `startBattle()`, and from `showMap()` with the
biome's normal scene (reward, Center, Mart and event screens keep whatever is
up, so an elite's rewards keep its light). The menus call
`showMenuScene(type)`: each starter type has its own scene, seen nowhere else
(`TYPE_ART`, same shape as a biome without kinds, pads or storms): Fire a red-rock
canyon (painted at sunset, `native: 'dusk'`) with a sparking campfire, Water a seaside with surf, a
lighthouse and a passing sail, Grass a jungle with giant trunks, swaying vines
and light shafts; each type's `times` gives the other times their sky and switches (`typeLook()`). With none picked
it's the Clearing, like the title. ? events outdoors stand in the biome's look for the time with their props graded;
`open: true` places (Hot Spring, Shrine, Day Care) are graded whole and take the biome's sky; indoor rooms keep their
light and only their windows (`view`, the Mart's `window`) change. The Pokémon Center (`restSite()`) has an indoor scene instead
(`PLACE_ART.center`, `showPlaceScene('center')`): a big Center logo (a Poké Ball
with a red cross) on the wall behind the counter, hospital monitors on ceiling arms
(a scrolling heartbeat, a party screen, and the big patient monitor: `centerVitals()` in
`js/run.js` lays your Pokémon's sprite, name and a green-phosphor HP bar over it, with what
Rest would heal blinking on the bar's end and "+N"; resting runs the bar and numbers up in
real time for the chime's length), and on wider walls a clock showing the real
time and the town map. Chansey is the real sprite (`assets/pokemon/chansey-front.gif`,
`.center-nurse`, cropped at the counter top by `placeCenterSpots()`); on the counter
are the games' PC (a cream CRT with a blue menu, a keyboard) and the healing machine
(a tray of six slots and a screen), both outlined, shaded pixel maps (`pixelMap()`: one letter per pixel, the user wanted them detailed); a Poké Ball rug in front. Its `horizon: 0.6` puts
the counter below the Center's two tiles. Rest, like the games: the music cuts,
`healAtCenter()` drops your one Poké Ball into the tray (you carry one Pokémon, so
the other five slots stay empty) and resolves once it's in, then the `heal` chime
starts and `flashCenter(seconds)` flashes the ball for exactly as long as it plays. Then the text box says
your Pokémon is feeling better and the full bar stays up ~2 s before the map (the user
found leaving straight away too quick).
Asking for the scene already up leaves it
running (except in battle). Outside battles `#backdrop` (above the canvas)
dims it so windows stay readable; `setTheme(type)` in `js/ui.js` only sets
the accent colour now. Still parts are painted
once into `base`; `draw()` copies it every frame (8 fps, paused while the tab
or title screen hides it) and adds the living
ones. `sky` masks where clouds, smoke and birds may draw, so they pass behind
hills, trees and the volcano. `horizonRow()` puts the horizon at ~38% of the
screen but always above the enemy's pad, so the layout can move. Both
Pokémon stand on Gen 3/4-style pads (`--pad`, a data-URL pixel image: grass,
mossy flagstone or cracked lava rock, from the scene's `pad`), drawn by
`.enemy-zone::after` / `.player-zone::before` so they don't lunge with the
sprites.
Stat changes look like the games': `statFx(side, dir)` in `js/battle.js` lays a `.stat-fx` over the sprite, masked
with the sprite's own GIF (`mask`, contain, 50% 100%, the same fit as the `<img>`), with stepped stripes that
rise warm (`up`) or sink blue (`down`) for 0.9 s. It sits in `#player-zone` / `#enemy-portrait-box` so it moves
with a shake. Raises: strength, focus, Guard and block too (the user's call: block is Defense), either side,
including block at the start of a turn; drops: Weak and Vulnerable. Skipped under reduced motion.
Battle moments: a hit that takes at least a quarter of the target's HP
(clamped to 12–25) runs `bigHit()` in `js/battle.js`, which jolts `.arena`
(the `translate` property, so sprite transforms are untouched) and flashes the
screen white (`#battle-screen.big-hit`), skipped under reduced motion. When a
boss drops to 30% HP, `checkStorm()` calls `setStorm(true)`: the biome's
`storm` (rain in the Clearing and Shrine, a rain of cinders in the Wastes)
fades in over 2 s with darker/redder light, stronger wind, faster clouds and
lightning every few seconds; `finish()` lets it pass, and every new fight
starts calm.

**Watch for CSS class-name collisions.** The reward screen already uses
`.relic-icon`, and a later, unscoped rule like
`.relic-icon { font-size: 3rem }` wins over anything earlier in the file.
Before adding a
generic class name, grep `css/` and `js/` for it.

## Map screen

The top `.run-card`, centred like everything below it, shows your Pokémon
floating on the scenery, then its name and a Gold/Silver-style HP bar
(`.gb-hp`: black "HP:" tag, outlined bar, the numbers underneath;
`data-level` turns it yellow at 50% and red at 20%, the games' thresholds).
Kept to three rows (the user found six "screen vomit"): the name with the Ability as just its capsule after it (tap for its
text), the HP bar with Gold/Silver's thin blue EXP bar flush under it sharing the one "HP:" tag (`.gb-bars`; `showExp()` in
`js/run.js` fills it floor / (floors + 1), full at the boss where you evolve, its `title` says so), then the numbers. Blaze's
capsule (`showAbility()`, rerun after a map heal) is grey above half HP and glows orange and bobs below it, while your
Pokémon flickers with flame (`.run-sprite[data-blaze]`). The sprite is a fidget (`#run-mon`, the user's idea): a tap
recalls it in a red beam into the title's pixel Poké Ball (`.cball-ball` parts; `ball-throw`), which sits wobbling; a tap
sends it out again (lid, flash, white then colour, `ball-open` and its cry). `toggleMon()` / `showMon()` in `js/run.js`;
the state (`recalled`) lasts the page's life, not saved.

Below it, `.map-head` holds the biome name alone as a pixel location sign
(`.biome-sign`, wood / mossy stone / dark rock per `data-biome`) that drops
in, like the games' location signs, only when you arrive in a new biome
(`showMap()`).

The **Bag** (`#bag-btn`, a frameless pixel backpack drawn as an inline SVG in
`index.html`) lives in the top bar's right corner, after the coins and the
Poké Mart. `showScreen()` in `js/ui.js` shows it only on `RUN_SCREENS`
(map, battle, rewards) and closes it on every screen change. It's a `.drop`
drop-down hanging from the right edge of `.topbar-actions`, with four
pockets, like the
Gold/Silver Bag: Deck (count + a button that opens the deck dialog), Relics,
Items (see Items below) and the map Key. Pocket tabs pick one, the ◀ ▶ header (and ← →) flips
through `POCKETS` in order, and the last pocket is remembered. It's wired by
`initBag()` / `showPocket()` / `closeBag()` in `js/run.js` and closes on an
outside tap, Escape, or whenever `showMap()` runs. Its rows reuse the How to
play `.howto-li` / `.howto-node` styles (bare icons with no chip or frame, the user's call; map rooms add `.town`),
so keep the Key's wording in step with the How to play map slide. In both, `initHowto()` swaps the
Mart and Center rows' emoji for the map's own buildings (`buildingSvg()`).

The map itself is drawn like the Pokégear Town Map from Gold/Silver
(rendering only: the data from `generateMap()` and the saved-run shape are
unchanged, and each node's `jx`/`jy` wobble is no longer drawn). In
`renderMap()` in `js/map.js`:
- Everything snaps to a tile grid (`TILE`, `GRID_W`/`GRID_H`, `colX()`,
  `rowY()`; the boss sits on top at `BOSS_ROW`, low enough to leave room
  above it for its silhouette; below floor 0 the routes join at
  `JOIN_ROW` and one road runs down the middle to `START_ROW`, where you start). `#map` gets
  `--grid-w`/`--grid-h` and keeps that aspect ratio; CSS sizes rooms in
  tiles, so everything scales with the map's width. The map is always
  upright (the user tried it sideways on wide screens and didn't want it).
  Phones use `NARROW_W` tiles across, fitted to 78vh. Wider screens (>720px)
  draw it at `WIDE_TILE` (11) px a tile and `fitGrid()` gives it more tiles
  across (up to `WIDEST_W`) instead of stretching it: more terrain, rooms
  spread further apart, the page scrolls, and `showMap()` scrolls your
  sprite into view. A resize that changes the tile count redraws the map. Paths can wander to one
  side, so `spreadColumns()` resets `colX()` per map to spread the columns
  it uses across the width (centred on `CENTER_X`, at most `MAX_STEP` tiles
  apart); draw rooms with `nodeX(node)`, which keeps the boss centred.
- Terrain is painted pixel by pixel into a small `<canvas>`
  (`.map-terrain`, `image-rendering: pixelated`). `PALETTES` picks each
  biome's ground and blobs (water, mountain, trees, lava), grown only in
  the gaps between routes (`routeTiles()`) by a PRNG seeded from the node
  ids + biome, so a refresh draws the same terrain. Water and lava drift on
  a timer while the map screen shows (off under `prefers-reduced-motion`).
- Routes are smooth SVG polylines over the canvas (`.map-routes`,
  `routeLines()` / `drawRoutes()`), deliberately not pixel art: the user
  found pixel-staircase diagonals too ugly. Every link is its own straight
  line from room centre to room centre (straight up, or diagonal to the
  next column), so routes only meet inside rooms; links to the boss and
  the start road still jog on a shared row, since those all merge anyway.
  Links used to jog on a shared row halfway up, which joined routes from
  different rooms and showed ways that didn't exist on almost every map.
  Routes are cream; walked ones get thick red dashes and the routes you can
  take next are white.
- Rooms are `.map-node` buttons (a tile bigger than the `.map-town` square
  drawn inside, for tap size): orange, red for elites, a gold boss. Poké
  Marts and Pokémon Centers have no square: they stand on the map as little
  Gen 3-style buildings (`.map-building`, 4 tiles wide, SVG from
  `buildingSvg()` in `js/buildings.js`, drawn by rules on a 24x20 grid: blue
  or red gridded roof, emblem over the door, "MART"/"P.C" sign). Visited
  greys out, reachable blinks (buildings glow white). Elite and boss rooms carry no type badge
  (the user's call: they're all Normal); their `title` doesn't name the Pokémon either. Your starter's
  sprite (`.map-trainer`) stands on the current room like the Pokégear's
  trainer head, and the biome's boss (`map.boss.enemyId`) stands above its
  room as a grey silhouette (`.map-boss-shadow`). Stacking: silhouette 0,
  rooms 1, your sprite 2.
- Tapping a reachable room walks your sprite there first (`walkTo()`):
  along the same route `linkPoints()` gives `routeLines()`, one tile a step,
  bobbing every other step, flipped (`--face`) to walk right (Showdown
  front sprites face left), with the red walked dashes trailing it. 500–850
  ms a link (`WALK_MS`; faster looked like zooming), then the room opens; taps are ignored meanwhile,
  and reduced motion skips it (the user's picks: brisk, stepped, trailed).
- Every battle opens with a Gen 3/4-style transition (`js/transition.js`, the user's call):
  `fight()` in `js/run.js` awaits `battleWipe(kind)` (two white flashes, then wild: bars from
  alternate sides, elite: a closing iris, boss: a shatter from the centre; the battle theme
  starts with the flash (no sound effect of its own: the games have none), so `startBattle()`'s `playMusic` is a no-op), starts the battle under
  the black, then opens onto it the same way (`.out`: the bars carry on off the far side, the
  iris opens, the tiles fall away), so the battle screen never just appears: ~1.6 s, ~2.7 s for
  a boss. Before a boss, `walkTo()` runs
  `bossReveal()`: the silhouette colours in (`.revealed`) with its cry, and `body.battle-intro`
  blocks taps. Nothing checkpoints until `showMap()`, so a refresh mid-way resumes before the
  room. Reduced motion keeps the reveal's cry and pause but skips the wipe.

The home shop is the **Game Corner** (the user's call: the Gold/Silver prize
counter, where coins buy Pokémon), so it can't be mistaken for the run's blue
Poké Mart: PokéCoins buy starters and perks at the Game Corner, ₽ buys cards and
relics at the Mart. Its top-bar button (`.shop-btn`) has no chrome: a pixel
slot machine (🎰 in `js/icons.js`, in `.gc-icon`; also on the menu item, the
sign and the How to play coins slide), and
`aria-expanded` on it drives the pressed-in "shop is open" look. Keep that
attribute in sync if you add another way to open or close the shop:
`toggleShop()` sets it to true, and the dialog's `close` listener in
`js/main.js` sets it back to false.
Its window (`#shop-dialog.gc-cabinet`, `js/shop.js`) is a pixel-art arcade cabinet (after the user's
reference photo): charcoal body between brass side trims, two pixel speaker grilles round a purple
GAME CORNER sign, a teal CRT (scanlines) in a curved black bezel, and a control deck with ONE red
ball-top joystick (the user's call) and two round buttons, a pink Buy and a blue Exit (a
`form[method="dialog"]` button, so it blips `cancel`). The CRT is a fighting-game character select:
three roster rows, Pokémon (skins), Perks and Shiny, with a blinking cursor frame; a row longer than `WINDOW` (6)
shows the 6 cells round the cursor with ◀ ▶ marks; the choice under it is shown
big (sprite or icon, name, one line, `Lv n/m`, price in red when you can't afford it, or `ownedTag()`).
Joystick up/down switches row, left/right moves along it (both wrap). Since 2026-09-28 (the user found it fiddly) the
whole stick takes presses (`initDrag()` on `#gc-stick`): drag it (one move per push past `PUSH` px, held over it repeats
every 150 ms after 420 ms), or tap anywhere on it and it moves towards where you tapped from its middle (the ball sits
above the middle, so tapping it is "up"); the printed arrows (`.gc-pad`, bigger now, `pointer-events: none`) stay as
buttons for keyboards. Arrow keys and tapping a roster cell work too. The chosen item's words sit on a dark plate above
the scanlines (`.gc-pick-plate`) with a hard text shadow, in bigger type (the user found the CRT hard to read); under
600px tall (an iPhone SE) the art and sign shrink and the deck is `zoom`ed to 0.8 so it all fits. Moves play `stick` (a synth). Buy takes two presses: the first arms it
(`Sure?`, blinking), any move disarms it; the purchase plays `buy` and the CRT says what you got in
place of the item's text (`cursor.news`: never a toast), including any starter `checkAchievements()`
unlocks. Escape closes it while nothing modal is open. The grille and ball are pixel maps drawn as SVG
(`pixelSvg()`). Tapping a shop-locked starter opens it on that skin.

## Windows

Every `.dialog`, every `.panel` (deck preview), the Bag
and the Poké Ball menu are light Pokégear windows (a `.panel`
inside a `.dialog` is a flat inset box instead):
muted parchment inside a chunky grey frame, softly rounded corners (`--round` 12px windows,
`--round-sm` 8px buttons/tiles, `--round-xs` 4px tiny bits, all in `:root`;
pieces without their own radius get it from the "soft corners" block at the
end of `css/screens.css`). The colours are
the `--win-*` tokens in `:root` (`css/base.css`); tune the tone there. Inside
a `.dialog` the usual tokens (`--ink`, `--muted`, `--panel`, `--gold`...) are
re-pointed to dark-on-parchment values, so most content re-themes itself.
Anything with a hard-coded light colour (white text, `#dfe3ff`) needs a
`.dialog ...` override in `css/base.css`. Game cards (`css/cards.css`) are styled after the Game Boy
Color Pokémon Trading Card Game: square type-coloured frame, pixel checker
body, a round PP cost set inside the frame (a mini PP box: white disc, salmon ring), pixel-font name/type, a framed art window and a
cream text window. Every card keeps a fixed two-line name band (the
name centred on the card, padded the same both sides, the PP cost on its centre line), so the art,
type and text windows line up across a row whichever names wrap (the user's call: the text was
"all over the place"). The description stays in the normal font on purpose:
pixel letters would be too small to read at card size. A long text or a two-line
name could push the text window out of the card, so `makeCard()` hands every card
to a `ResizeObserver` (`fitCard()` in `js/ui.js`): once it's first laid out, its
`--name-fit` / `--text-fit` shrink just enough to fit (measured, since the fonts
differ per device; everything is in cqw, so one fit holds at any size).
Window text (and the HP bar, biome sign, PP box...) uses Press Start 2P, the
8x8 Game Boy-style font, as `var(--pixel-font)`. It's declared by hand as
"PokeDB Pixel" at the top of `css/base.css` with `size-adjust: 66%` (its
letters are far bigger than other fonts' at the same size; `font-size-adjust`
measured it inconsistently, so don't go back to that). Since 2026-09-28 it's the
page's own font (`body` in `css/base.css`): the user wants no plain text anywhere (sheets, tiles, captions, footer), so
don't set `var(--font)` on anything new. `.card` alone resets to the normal font (`css/cards.css`), since card text at
card size needs it. Every `.btn` is a Gen 1-3
menu option to match: cream box, pixel frame, and a blinking ▶ cursor on
hover/focus (left padding reserves its space; `.primary` = orange frame,
`.danger` = red). The How to play button is a gold `.ds-btn` capsule instead (see below).

## Title screen

The title screen (`#title-screen`, `js/title.js`) is the game's **home** since 2026-09-28 (the user's design, from
Slay the Spire 2's title and pixel-art button references; mockups in `docs/mockups/`). It's a fixed overlay above the top
bar: a pixel sky for the time of day painted into a low-res `<canvas>` (`SKIES` in `js/title.js`; dusk, the user's pick
before the clock, is deep blue to a rose horizon, dithered; by day the moon is the sun and there are no stars; the moon up in the
corner clear of the logo, `moonOf()`; hills, the grassy ledge; stars twinkle at 10 fps and the odd shooting star crosses),
the flying legendaries crossing it one per pass over an empty ledge (the three starters that stood on it were removed, the
user's call 2026-09-28): `nextFlyer()` in `js/title.js` deals Moltres, Ho-Oh, Lugia, Reshiram, Celebi and Victini (`FLYERS`;
not Mewtwo, the secret) from a shuffled round on each `animationiteration`, a black silhouette until that one is unlocked,
then in colour (`.lit`, shiny if switched on via `spriteUrl()`), all at one scale from each GIF's width (`--w`, 64 at least) (the user's ask, 2026-09-28). With a saved run a battle `.nameplate` sits right under the gems, in `.title-center`'s flow (`#title-run`,
`renderRun()` in `js/title.js`; the user's call: neatly under Game Corner at every size) with the run's name and HP, the floor you stand on in that biome where the games' nameplate has its level (`#title-run-floor`: a grey pixel staircase, then "F7" in the name's font and size, the user's call; `floor` in `savedRunCard()`, the current room's `floor` + 1, 0 on the road in, like StS's Neow floor), the
biome's own map sign over it (`.title-biome`, a smaller `.biome-sign` that drops in: the Clearing's sways, the Shrine's has
mist drifting across, the Wastes' rim flickers like embers) and a red Abandon run pill under it (`requestAbandon()` in
`js/main.js`, after a confirm: the run is gone, nothing else changes; also an 🏳️ Abandon run item in the Poké Ball menu
whenever a run is saved or going). Continue's gem shimmers: `tick()` repaints its canvas with a slanted band of light
(`paintGem(..., sweep)`) crossing it every 3 s. New game hatches the Egg first (`hatch()`: it shakes harder, cracks, bursts
in a flash, `stat-up` then `ball-open`; straight through under reduced motion); the Pokémon itself waits in Continue's ball and pops out of it when you continue. The
top-left corner (`.title-corner`, gems up only) holds the cloud save's PC (see Cloud save) and a 🔊 Sound button whose
`#title-sound-panel` (a `.ball-menu-panel`) has the same Sound toggle and volume slider as the Poké Ball menu
(`SOUND_TOGGLES` / `VOLUME_SLIDERS` in `js/audio.js` keep both in step); the PC is captioned, the speaker isn't (the user's call); both are a size smaller under 600px wide, where the row also hugs the screen's corner. On phones they sit in one row along the top (PC, speaker, ❓, refresh, like battle's piles beside the Poké Ball; the refresh's margin centres it on the speaker), since stacked down the side they crowded the logo (2026-09-28). Over 600px wide there's room beside the logo, so it's one centred column (PC, speaker, ❓, refresh; the user's call). A small ❓ How to play (`#title-help`, the user's ask: 26px, 22px on phones, between the speaker and Refresh; it calls
`openHowto()`). A
small **version tag** (v0.9 until Mewtwo lands, then v1.0) (`#title-version`, a tilted cream sticker at the logo's top right, gems up only; the user's ask, 2026-09-28) bobs up 2px and back (the user found a wiggle and glint too much) until this version's notes are opened on the device (`.seen`, `pokedb.patchSeen` in localStorage, not the save), opens the Patch notes window (`#patch-dialog`, `js/patchnotes.js`): the newest patch's changes, then "In the game", then earlier patches. The words are `PATCHES` (newest first; the tag shows its version) and `IN_THE_GAME` in `js/data/patchnotes.js`: add an entry when a batch of changes ships, and keep the counts in step. A tiny 🔄 Refresh (20px, 16px on phones) (`#title-refresh`, `refreshGame()` in `js/title.js`, the user's ask) re-fetches every `.js` / `.css` file
the page loaded with `cache: 'reload'` (a plain reload can show the old game for ~10 minutes after a push: GitHub Pages'
cache), spinning meanwhile, then reloads; the save is untouched. Each page load opens on a blinking PRESS START (`showTitle()`); any tap or key
plays `confirm`, flashes white and brings up the **gem menu** (`renderMenu()`): a stack of pixel gems under the logo, each
painted on its own `<canvas>` by `paintGem()` (pointed ends, a dark outline, a two-tone bronze frame, an inner groove, a face
with a light band, a shade band, a gloss streak and glints; `gemPx()` CSS px a pixel, 4 or 3 on windows ≤700px tall, the
canvas a whole number of pixels wide so they stay square) with a bare pixel icon on its left end (a dark pixel outline, no
frame: the user's call): **Continue** (amber, only with a save; see Saved runs; the biggest gem, `GEM_BIG`, with a bigger label and a smaller ball, placed by `--icon-x` so it stays on the face), **New game** (violet, an Egg that wobbles while
picked, since Continue has the Poké Ball: the character select), **Collection** (gold, the Pokédex: the Collection screen) and **Game Corner** (coral: `toggleShop()`,
whose dialog sits above the title at z-index 90). Hover, focus or ↑ ↓ move a blinking ▶ (`point()`), Enter / tap picks, a
press sinks the gem. Leaving fades the title out over the screen you go to (`leaveTitle()`), and every way home (the Poké
Ball menu's Main menu, a run's end, Back on the select or the Collection, the About erase) comes back to the gems with
`showHome()`. The first PRESS START unlocks audio and opens the first-time How to play. `--ground` (set from JS) keeps the
CSS sprites on the painted ledge.

## Top bar and start screen

There's no bar: the top-left Poké Ball (`#brand-btn`: an 18x18 pixel sprite inline in `index.html`, `.ball-sprite`, always
36px so each pixel is exactly 2x2, the user's call 2026-09-28: "between smooth and a hint of 8-bit"; the logo's "o" stays
the CSS `.pokeball`) opens a drop-down
(`#ball-menu-panel`, wired in `initBallMenu()` in `js/main.js`) holding Main
menu, Index, Stats, Achievements, Sign in (the cloud save, see Cloud save), Sound, How to play and About (Stats and
Achievements are windows built fresh from the save by `js/records.js`; a locked legendary's achievement shows "???" for
its name, the user's call). Stats (revamped 2026-09-28, the user found "0/3 bosses" meaningless) is in sections: Runs (won
with win rate, lost, best level won, wins per type), Battles (Pokémon and Alphas defeated, furthest biome, each boss's kill
count), Collection (bars: starters, shinies, Pokédex defeated / researched, moves / relics / items found), PokéCoins &
records, and wins by starter. The newer counters live in `stats` (`bossKills`, `elitesDefeated`, `coinsEarned` in
`awardCoins()`, `deepestBiome` in `startBiome()`); old saves are seeded by `seedStats()` in `js/storage.js` (each boss ever
beaten counts once). Main menu's icon is the games' cream PC (🖥️, with the `v`/`V` cream
letters in `PALETTE`). The
**Index** (`js/cardindex.js`, `#index-dialog`, StS's Compendium; "Card index" until 6c.11b) opens from the
Poké Ball menu and the Collection's Moves, Relics and Items cards: every card in `ALL_CARDS`,
a sticky tab row per type (Fire, Grass, Water, Neutral, then a purple **???** for Mewtwo's coming Psychic pool: `renderMystery()`, 8 blank locked cards, counted nowhere; the user's ask 2026-09-28), grouped by rarity and
then the two evolution tiers (`evolutionCardsFor()`), sorted by cost then name at
stage 0 numbers, each card `zoomable()`. It opens on the picked starter's type,
else the last tab; new cards show up there on their own. Two more tabs, Relics and Items (the user's call,
2026-09-27), list every relic (the Abilities first, then by rarity, then Boss) and item (by rarity), with an
"N/M found" count: one you haven't taken (relics) or used (items) in a run is a dark silhouette of its sprite, "???" (`.index-thing.locked`).
Moves work the same since 2026-09-28 (the user's call, Pokédex-style): an unmet card is a grey "???" card with a black
silhouette of its art (`lockedCard()`, `.card.index-locked`, not zoomable), each rarity heading and the tab count "N/M".
A card is met (`markSeen('cards', id)`, upgrades count as their base) once it's in your deck (the starting deck,
a reward you took, a Mart buy, an event: `checkpoint()` in `js/run.js` marks the whole deck at every map checkpoint) or
you play it (`resolveCard()` in `js/battle.js`: Metronome's and the TM's too). Being offered isn't enough (the user's call,
2026-09-28). Saves from before seed `seen.cards` with the owned starters' decks and the run's deck (`seedCards()`).
A relic or item is only met once it's really yours (the user's call, 2026-09-28; before, being offered was enough):
`markSeen(kind, id)` in `js/storage.js` (the save's `seen: { relics, items }`) runs for a relic when you take it
(`gainRelic()`, every reward / treasure / event relic; a Mart buy; the Relic Charm) and for an item when you use it
(`useItem()` and `revive()` in `js/battle.js`, `useItemOnMap()`). Saves keep what they had already marked.
The **Pokédex** (`js/pokedex.js`, `#dex-dialog`, roadmap step 7) opens from the Collection's Pokédex card
and a Poké Ball menu item (so it opens from the map too, on the run's biome page). A page per biome
(`DEX_PAGES` in `js/data/pokedex.js`, built from `BIOMES`: 12 wilds, then Alphas, then Bosses, numbered No.001-055);
an entry is a dark "???" silhouette (`.dex-entry.locked`) until you've fought it (seen: picture, name, biome and research count only), then a
Poké Ball mark once beaten (defeated), like the games' seen / caught; everything else waits for Research complete (the
user's call 2026-09-27, `showEntry()`); tap an entry for
it blown up (`.dex-zoom`, the zoom layer). The save's `dex: { seen, defeated, done }` (old saves merge in empty) is written
by `dexSeen()` from `fight()` and `dexDefeated()` from `afterFight()` (Team Rocket's Alpha counts as its species). The
first defeat says "X's data was added to the Pokédex!" in the reward text box (`pendingCoins.dex`, after the coin
lines); defeating the last entry on a page pays its PokéCoins once (300 / 400 / 500, `done` guards it) and turns on its
perk (`DEX_PERKS`, `hasDexPerk()`): Mom's Savings (start runs with ₽50, `DEX_START_MONEY`), Chansey's Gift (start
with a Potion), Oak's Advice (once per biome a card reward gets a 🎓 Reroll button beside Skip, `showChoice({ reroll })`,
`run.rerollBiome` / `run.rerollsUsed`, saved with the run). Researching every entry on a page raises its perk to **Lv 2**
(the user's call, 2026-09-28): ₽100, a Super Potion, two rerolls a biome (`lv2` in `DEX_PERKS`; `DEX_START_MONEY` /
`DEX_START_ITEM` / `DEX_REROLLS` by level). `dexPerkLevel()` in `js/pokedex.js` works it out from the save (0 / 1 / 2), so
nothing new is saved; the page's perk box then tracks research, and the Rewards tab has a goal per page. A final-boss page completion goes in the result window (`run.dexNews`). The
Achievements window lists the three pages after the starters. Fight rooms prefer unbeaten Pokémon 2:1
(`pickEnemyId(biome, kind, dexWeight)`). The sim mirrors the perks as `cfg.dexPerks`. **Research** (step 7b, Legends: Arceus-style): the save's `dex.count: { id: n }` counts
every defeat (`countDex()`; old saves seed 1 per `defeated` id in `seedCounts()`), and each win's reward text box says
"X defeated n/3" until the entry's `RESEARCH_GOAL` (3, bosses 2, in `js/data/pokedex.js`). At the goal it's Research
complete: a gold mark (`.dex-mark.gold`, a gold tile), `RESEARCH_COINS` once (wild 50 / Alpha 100 / boss 200), and its entry
shows its type, role, flavour text, weakness, HP and each move's numbers at that biome on Level 0 (`buildEncounter()` + `moveNumbers()`, before types). Every entry
complete pays `DEX_COMPLETE_COINS` (1500) once (`dex.complete`), with a line in the result window (`run.dexComplete`,
saved with the run) and a "Pokédex complete" row in the Achievements window. `dexDefeated()` returns `{ lines, complete }`. A fourth tab, **???** (`renderMystery()`, the user's ask 2026-09-28), stands in for the Mewtwo-only fourth biome (roadmap's v1.0 plan): question-mark tiles, counted nowhere, until part B gives it real entries. A fifth tab, **Rewards** (`renderRewards()`, the user's call: easy to find), lists
the complete-Pokédex jackpot (1500 coins, Reshiram, shown as a "???" silhouette until won, the Silph Scope), research payouts and each page's perk with progress.
**Silph Scope** (`SCOPE` in `js/data/pokedex.js`, the complete Pokédex's prize): a button in the map's bottom-left corner
(`#scope-btn`, `drawMap()` in `js/run.js`; the user's call 2026-09-28: a child of `#map` kept by `renderMap()` as `.map-keep`,
sticky so a tall PC map scrolled up keeps it at the screen's bottom) with `SCOPE_REVEALS` (1) reveals a biome, +1 per level of the Game Corner's
**Scope Upgrade** (`scopeUpgrade`, 2 levels, `needsDex`: greyed out until the Pokédex is complete). Tapping it lights up
every unvisited fight / elite room (`scopeable()`, `.scope-pick`, `renderMap(..., { reveal })`); the one picked gets
`node.revealed` (saved with the map's nodes, which also counts the biome's reveals used), cries, and shows its Pokémon above
the room in colour (`.map-revealed`) with its type icon for a wild one (elites are Normal, so none). No bot run (the user's call). The
top right shows the coins (floating, no box), then the Game Corner outside a run, or
the ₽ (`#money-pill`) and the Bag during one: on `RUN_SCREENS` `showScreen()`
hides `#shop-btn` and shows a Game Corner item (`#menu-shop-btn`) in the Poké Ball
menu instead. In battle on phones ≤420px the PokéCoins
hide so the piles, ₽ and buttons fit on one row.
In battle, the draw and discard piles sit beside the Poké Ball. On the map, the floor you stand on in the biome does (`#floor-tag`, the user's
call: a cream pixel staircase and "F7", outlined like the piles, shown only on `body[data-screen="map-screen"]`, set in
`showMap()`, counted like the title's Continue plate; its `title` says "Floor 7 of 10 in X, then the boss").
The "Main menu" item takes you to the title's gem menu from anywhere.

**Character select** (`#start-screen.select-screen`, `js/select.js`, New game; Slay the Spire's, the user's call
2026-09-28): the picked Pokémon stands big on its type's scene (`showMenuScene()`), its resting pose (`SPRITE_FIT`) scaled in
half steps to fit the stage (`sizeSprite()`), with a see-through dark panel (name in big gold pixel letters, HP, type chip,
blurb, Ability, a ✨ Shiny pill once that shiny is owned) and a strip of portraits along the bottom under two pill tabs,
**Starters** and **Legendaries** (with unlocked/total counts; Mewtwo is the last legendary). A locked portrait is a silhouette
with a 🔒, and picking it shows the silhouette big with how to get it: the achievement's text, or a 🎰 Game Corner pill
(`#sel-corner`) that opens the Game Corner on that skin; Choose is greyed out for it (and for Mewtwo while `comingSoon`).
Picking plays the cry and swaps the scene; ← → move along the strip, Enter chooses, Escape goes back. Choose turns the same
screen into the run's setup (**Prepare**, `prepare()` in `js/select.js`, StS's Ascension on its select; the user approved
a mockup 2026-09-28; the old separate deck preview screen is gone): `.preparing` hides the stats, blurb, Ability, pills and
portrait strip; `#sel-prep` in the panel shows the evolution line in a row (each form's HP and when, the evolution rules
in its `title`) and the Trainer Level as ◀ n ▶ (`setLevel()`; ← → too), the level's name, the rule it adds, a coins chip and
an "All rules" fold-out (with the next level's lock); `#sel-deck` fans the starting deck along the bottom with copies stacked
(`groupDeck`, the ×N under each card), each `zoomable()`; Choose reads Begin run (`onBegin(level)`, which confirms over a
saved run) and Back / Escape return to the portraits (`showSelect()` clears it). A Game Corner purchase refreshes it
(`refreshSelect()` on the shop's `close`). Phones stack it (Pokémon, panel, Back / Choose, tabs, strip, which scrolls
sideways); ≥900px wide it's StS's layout (the Pokémon right, the panel left, Back / Choose on the sides, the strip centred at
the bottom). The page's footer note hides here.

**Collection** (`#collection-screen`, `js/collection.js`, StS's compendium): eight Pokégear cards with a coloured header
(Pokédex, Moves, Relics, Items, Stats, Achievements, Record Book, Hall of Fame), each with its art, a line and a progress count (defeated, moves,
found, done; Stats is a plain "12 runs · 3 wins", `runCount()`, since "0 of 1 runs won" read like a goal to the user), opening the same windows as the Poké Ball menu (Relics and Items open the Index on their tabs).
4 across on PCs, 2 on phones. The Shop marks owned skins and maxed perks with a small Poké Ball (`ownedTag()` in `js/shop.js`).


The logo is pixel art since 2026-09-28 (the user's pick of two mockups): `js/logo.js` paints each glyph of "PokéDB"
(hand-drawn in `GLYPHS`, the "o" a Poké Ball) on its own canvas, yellow with a light and a shade band, a blue outline, a
dark rim and a hard shadow, `logoPixel()` CSS px a pixel (3-6, whole numbers, ~70% of the width); `paintLogo()` in
`js/title.js` lays them in `#title-logo`, overlapping by `EDGE`, and repaints on resize, so the letters still bounce in and
wave one by one and the ball wobbles (`.tl-ball`). No web font any more (Sniglet is gone); `.pokeball` is still the CSS
ball used elsewhere. Under `prefers-reduced-motion` the title, select and Collection skip their
animations (the gems' rise, the send-out, the fades), but not their sounds.

How to play (`#help-dialog`, `js/howto.js`) is a row of swipeable slides
(native CSS scroll-snap, plus dots, Next/Prev and arrow keys). Open it with
`openHowto()`, not `openDialog()`, so it always starts on slide 1. The coins
slide is filled from `COIN_REWARDS`, so the guide stays in step with the game
data. It deliberately doesn't list the Game Corner's perks (the user's call:
players find them there), it opens on coin ▶ slot machine (`.gc-hero`) with a "Starters" and a "Perks" row, then "Earn them". The first two slides are numbered rows
(`.howto-flow`, a picture slot then a name and one line); the turn slide
draws a small fanned hand (`.howto-hand`) rather than a real card, whose
text was too small to read at that size. Its two tips show a sample intent bubble and a copy of the top bar's Bag sprite (cloned in `initHowto()`).

## Pixel icons

The game never shows emoji: `js/icons.js` swaps every emoji on the page for
an 8-bit pixel icon. Data files and code keep writing emoji (card `art`,
relic `icon`, text boxes...); `initPixelIcons()` (called first in `js/main.js`)
swaps existing text and uses a `MutationObserver` to swap anything added
later. Each icon is a 12x12 pixel map in `ICONS` using the letters in
`PALETTE`; the black outline is added automatically, so only draw the fill.
**When you add an emoji anywhere, draw its icon in `ICONS` too**, or it shows
as a plain emoji. Tooltips (`title`) can't hold SVG and keep the emoji. Don't
read an emoji back out of the page with `textContent`: it's been replaced.

Items and relics are the exception: they show real PokéSprite item sprites
(`assets/items/<id>.png`, 32x32, from github.com/msikma/pokesprite, credited in
About) through `itemSprite()` in `js/ui.js`, which falls back to the emoji if the
file is missing. A card can use one as art with `sprite` (every card does), cropped to
its visible pixels from `js/data/item-fit.js` and scaled to fill the art window
(re-measure the alpha bounds when adding one); some are puns on the move. Tackle's
`hit-spark` and Block's `shield` aren't PokéSprite: they're original 32x32 pixel art in
the same folder and style (the user wanted a real shield and a hit spark). Their emoji stay in the data
for tooltips and event text, and must not be swapped globally: many are shared
(🔥 is the Fire type, 💪 the strength badge). A new item or relic needs its PNG
named after its id.

## Music

`js/audio.js` plays one looping track at a time from `assets/audio/`:
`title` on the menus (triggered in `showScreen()` in
`js/ui.js`), `map1`–`map3` on each biome's map (`showMap()` in `js/run.js`),
`wild` / `elite` / `boss` chosen by `encounter.kind` in
`startBattle()`, `victory` from the moment an enemy faints (`finish()` in
`js/battle.js`) through the reward picks (after a boss, paused for the evolution scene's `evolution` track; after a Level 5
win, the Hall of Fame's `hall-of-fame`, after any other won run `run-win`, each `victory` while its file is missing), and `center` at rest sites
(`restSite()` in `js/run.js`). `showScreen()` deliberately leaves the map and
reward screen's music alone so each of those can choose its own track.
Tapping Rest cuts the music (`playMusic(null, { cut: true })`), plays the
`heal` chime from `assets/audio/sfx/`, and waits for it before returning to
the map. `heal` is for rest sites only (the user's call): don't reuse it
for potions or other heals. Sound effects are decoded buffers played with `playSound()`; to
add one, list it in `SOUNDS` (`{ url, gain }`, gain boosts a quiet file) and drop the MP3 in `assets/audio/sfx/`.
`start`/`length` play only part of a file with a short fade-out, so a long or late-starting
effect is trimmed in code. A `synth` entry builds its sound in code instead of a file: `block` is
`blockClink()` at the end of `js/audio.js`, an 8-bit shield clink (the user swapped their MP3 for a generated one), normalized to 0.2 like the other synths (at 0.9 it was far too loud).
The user supplies the effect MP3s themselves.
The rest of `SOUNDS` and where each plays: `card` (`playCard()`; at 0.3 gain like `confirm`, the user's call), `hit`
(damage gets through, either side; `hitSound()` in `js/battle.js` plays `hit-super` /
`hit-weak` for super / not very effective hits, like the games' three damage sounds, falling
back to `hit` while those files are missing; a fully blocked hit plays `block`
instead; there are no critical hits), `block` (a card gains block; at half gain, the user found it too loud), `faint` (enemy KO, in `finish()`),
`confirm` (the same file as `card` and `item`, the user's call, but at 0.3 gain since it plays on nearly every tap: every window's confirm
sounds alike; `showChoice` plays it when an `ask` option is taken, or the option's
`confirmSound`, which Mart purchases and the Mart's removal set to `buy`. It's also the menu
blip, the user's call: `menuBlip()` in `js/audio.js` plays it on any click on a control
(`CONTROLS`: buttons, tabs, map rooms, cards, the reward text box, a card's dimmed focus layer
or zoom), unless that click already started an effect of its own; cries don't count, so a
starter tap blips then cries. New buttons get it for free; to silence one, keep it out of `CONTROLS`),
`item` (`useItem()` in battle), `potion` (a healing item, in battle or
`useItemOnMap()`; falls back to `item` while its file is missing), `buy` (a Mart ware or
removal is paid for), `ball-throw` / `ball-open` (the battle intro's Poké Ball; `ball-open` also on the title's Continue gem),
`stat-up` (strength or focus gained, either side, enemy buffs and Enrage too), `stat-down` (the enemy gets
Weak or Vulnerable), `item-get` (a relic or item received: reward picks via `confirmSound`, the Fan Club gift,
the Shrine; not Mart buys), `low-hp` (looped with `setLoop()` in `js/audio.js` while your HP is at 20% or
below, set on every `renderAll()`, off when the battle ends, is abandoned, or on mute), `event` (walking into a ❓ room, in `enterNode()`,
so "Back" re-renders don't replay it), `heal-hp` (a card or a power heals you, not relics; `potion.mp3`, the user's call; never the Center's `heal`),
`power` (a power card is played), `burn` (burn damage ticks), no sound when the discard pile is shuffled back in (the user dropped the synth riffle: it sounded distorted; a file may come later), `thunder` (the first lightning bolt of a boss's storm only, the user's call 2026-09-28: `storm.thundered` in `drawLightning()` in `js/scene.js`; later bolts are silent),
`coins` (a fight's PokéCoins and ₽ are paid, `collect()`; `buy.mp3`), `door` (walking into a Mart or Center, `enterNode()`; `event.mp3`, the same sound as a ❓ room),
`achievement` (`checkAchievements()` grants a starter), `bag` (the Bag opens and closes, and so does the Poké Ball menu: `setOpen()` in `js/main.js`; the user's call), `cancel` (the menu blip for
backing out, `bag.mp3` too, so every window closes with the Bag's sound: `CANCELS` in `js/audio.js`: Back / Skip / Leave (the Collection's and character select's Back too), No, a window's Close or ✕, a zoomed card; also Escape on a modal
window or the Game Corner, the Game Corner's top-bar toggle closing it, and backing out of a picked card or reward; falls back to `confirm`), `stick` (synthesized, `stickTick()`: the Game Corner's joystick moves), `fw-launch` / `fw-pop` / `fw-boom` / `fw-crackle` (synthesized: the Hall of Fame's fireworks, `js/celebrate.js`) and `run-away` (every way of running: the Poké Doll,
in place of `item`, and Team Rocket's "Run for it"; there's no running-away relic) and `no-pp` (tapping a greyed-out card that costs more PP than you have, with the PP box's shake, in `playCard()`). The user picked those file reuses. Synths
(`blockClink()`, `stickTick()`, the fireworks) should peak like the MP3s (~0.1–0.25, `normalize()`), or they come out far louder. The evolution scene has its own track
(`evolution`) and chime (`evolved`, see Evolving above). Battle sounds preload in
`startBattle()` (`thunder` only for bosses), map ones in `showMap()`, `confirm` / `cancel` in `unlock()`. A missing file is silent (one
404 in the console per sound per page load). `playSound()` drops a repeat
of the same sound within `SFX_MIN_GAP` (70 ms) and cuts a still-ringing
earlier copy with a 30 ms fade, so multi-hits don't pile up; different
sounds still overlap (a block card plays `card` + `block` together).
Muted or still-locked audio plays nothing. Tracks crossfade and
each file downloads only the first
time it's needed. Title resumes where it left off; battle tracks restart
each fight. To change a song, replace the MP3 (keep it around 1–3 MB,
128 kbps).
- Playback goes through the Web Audio API (a GainNode per track) because
  iOS ignores `<audio>.volume`, so plain elements can't fade there.
- Browsers block sound until the first tap or key press; `unlock()` starts
  the pending track then. Don't "fix" music not starting on page load.
- The Sound item in the Poké Ball menu saves `muted` in the save file (`js/storage.js`); the slider under it (`#volume-slider`)
  saves `volume` (0-1), squared onto `masterBus`, which every other bus runs through. `low-hp` plays at 0.35 gain (the user's call). On iPhone,
  Web Audio also respects the silent switch, which is intended.
- **Cries** (`playCry()`): one MP3 per sprite id in `assets/audio/cries/`
  (from play.pokemonshowdown.com/audio/cries/). Add the id to `CRIES` in
  `js/audio.js` when you drop a file in; ids not listed are silent, and
  `-shiny` ids use the base cry. A new cry cuts the previous one. They play
  on a starter tap and in the battle intro (`playIntro()` in
  `js/battle.js`: the enemy slides in on its pad from off the right edge as a
  silhouette, Diamond/Pearl-style, colours in and cries; then the Poké Ball throw,
  and your cry once it has popped out to full size; then turn 1. Each cry waits
  until its Pokémon can be seen (the user's call). The
  files are mastered ~4× louder than the music, hence `CRY_VOLUME` 0.12.
- `audio.js` defines its own `$` instead of importing `ui.js`, because
  `ui.js` imports `audio.js`.

## Conventions

- No comments unless they explain a non-obvious *why* (a workaround, a
  hidden constraint). Never comment what the code already says.
- Commits push directly to `main` — this is a solo project with no PR flow.
  Test locally first (see below), then commit and push.
- Commit messages explain *why*, not *what*.

## Testing a change before shipping

There's no automated test suite. Before committing:
1. Reload the page fresh and check the console for errors.
2. Actually play the affected flow in the browser — pick a starter, fight,
   reach the screen/dialog you changed, and interact with it — rather than
   just reading the code.
3. If it's a balance change (card damage, achievement difficulty, drop
   rates), use the headless-bot harness in `../pokeDB-sim/` (a sibling
   folder, never committed to this repo; its README says how to run it).
   Reuse it rather than rebuilding it. This machine has no Node or Python,
   so it runs in the browser pane: its `serve-sim.ps1` serves this repo
   plus its `/sim/` folder, and the harness `import()`s the real `js/data/`
   files. In a cloud session, `sim/run-node.mjs` runs it in Node worker threads
   with no browser (its README says how; the human bot at Levels 0/3/5 is far slower: 4500 runs took over 20 min on 4 cores).
   **Keep bot runs small** (the user's call, 2026-09-28: "hundreds, not thousands"): screen candidates at ~150 runs a
   cell, only on the types and Levels the change touches, and confirm the pick once at ~300; a cell's noise is then
   ~±8 / ±6 points, so only act on gaps bigger than that. Pipe the runner's stderr to a file, not through `tail`, so
   progress can be checked. Compare before/after under the same bot (in-memory tweaks in
   `sim/variants.js`, or the previous data from `git show`). `sim/engine.js`
   mirrors `js/battle.js`'s rules, so update it when battle rules change. The bot must value damage prevented above damage
   dealt (about 1.6×), or it under-blocks and misjudges attack-heavy pools.
   It must also pick relics by measured value (e.g. win rate starting with
   only that relic), not at random or by a hand-written list: the healing
   relics (Leftovers, Shell Bell) carry bot runs, and energy relics
   (Choice Scarf) must rank with the boss relics, or old-vs-new relic pool
   comparisons swing 20–40 points from pick bias alone. Absolute win rates
   differ between bot versions; only compare runs of the same bot.
4. After pushing, GitHub Pages can take several minutes (occasionally
   10+) to actually serve the new files — `raw.githubusercontent.com/.../main/<path>`
   reflects the pushed source immediately and is the fastest way to confirm
   a push landed, before blaming the CDN for a stale live check.

## Known environment quirks

- PowerShell's `Remove-Item` intermittently throws a spurious
  `blocked: '"C:\Program'` error unrelated to the actual target — retry
  without it, or isolate it in its own call.
- A live ES-module import cache in the browser can make a manual console
  `import()` of a just-edited file return stale content — reload the page
  before trusting console-based verification.

## Keeping sessions cheap

This project has had one very long-running Claude Code conversation, and
long conversations reprocess their whole history every turn, which burns
usage fast even for small changes. Going forward:
- Prefer starting a **new session per feature/fix** rather than continuing
  one indefinitely. This file is what lets a fresh session pick up the
  architecture instantly instead of re-deriving it.
- Prefer text-based verification (`curl`, `read_page`, `get_page_text`) over
  screenshots when just confirming state, not visual review.
- Don't poll a slow external process (like CDN propagation) in tight
  loops — one longer wait beats several short ones.
