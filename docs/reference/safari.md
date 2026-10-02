# The Safari Zone

The daily seeded run (roadmap: "Post-v1.0: the Safari Zone daily run"). Phase 1 built the seed and the run; phase 2
(2026-10-02) added catching, the Game Corner's Poké Balls, rare spawns, Bait and Rock, and the fair first try.

## The seed (phase 1)

- `js/rng.js`: every gameplay roll goes through `random()` / `randIndex()` / `pickOne()` / `shuffled()`. Unseeded it's
  `Math.random`; a Safari run sets a stream per biome (`biome:N`, from `startBiome()`) and per room (`room:N:id`, from
  `enterNode()`), so a room plays the same whatever came before it. Cosmetic rolls stay on `Math.random`.
- `js/data/safari.js`: `safariDaily(day)` = the UTC date's seed, 3 of the 6 areas (`SAFARI_AREAS`, each with `normals` and
  `rares`) and a starter (any but Mewtwo). `beginSafari()` in `js/run.js` starts it at Level 0's rules with
  `run.safari = { day, seed, areas, first }`; `save.safari = { day, tries }` counts tries at the start, so quitting
  can't retry the first. A Safari run adds nothing to the main Pokédex, Record Book, Trainer Levels, the Sealed Gate or
  the per-starter stats; it pays PokéCoins.

## Catching (phase 2)

- **When**: a Safari run's wild rooms only (`battle.catchable`: `run.safari` and kind `fight`; Alphas and bosses can't be
  caught), once the HP is red, below `CATCH_HP` (25%). The **Throw** button (`#throw-btn`, green, beside End Turn; on
  phones on the PP row) shows then.
- **Cost**: a throw is the whole turn. It needs your PP untouched (`whyNotThrow()`: `energy >= turnEnergy`; 0-cost cards
  and items are fine first), sets PP to 0, and a miss runs `endTurn()`, so the enemy acts.
- **Picker**: a tap opens `#ball-picker` over the button, one row per ball you can throw now (`ballsInBag()`), with how
  many are left and its odds; a tap throws. A tap elsewhere closes it.
- **Odds** (`catchChance()` in `js/data/balls.js`, pure, pinned by `tests/catch.test.mjs`): base 30% at 25% HP rising to
  70% at 1 HP (`CATCH_BASE`); a multiplier m turns the miss chance q into q^m (the games' shape), m = ball x (1 + 0.25 per
  kind of debuff on it: Burn, Leech Seed, Weak, Sap) x (1 + 0.5 per Bait) x 0.5 for a rare spawn; capped at 95%
  (`CATCH_CAP`); the Master Ball is 100%. The roll is `random()`, on the room's seeded stream.
- **The throw on screen** (`ballAnimation()`): the ball's sprite arcs to the Pokémon (Web Animations), it's pulled in
  (`.enemy-portrait.captured`), the ball drops and shakes 0-3 times (`ball-shake`, a synth; near misses shake more, like
  the games), then clicks shut (`ball-click`) or bursts open.
- **A catch** (`caughtIt()`): `onEnd({ won: true, caught: true, ball })`. `afterFight()` pays `CATCH_PRIZE` (half) of the
  knockout's ₽, the same PokéCoins (+`LUXURY_COINS` with a Luxury Ball), the usual item odds, and instead of the card
  reward `offerSignature()`: the Pokémon's signature card, take or skip (skipped silently if you already hold it). The
  reward box says "Gotcha! X was caught!".
- **The record**: `save.safariDex = { seen, caught, done, complete }` (`markSafari()` in `js/storage.js`): `seen` when a Safari wild fight
  starts, `caught` on a catch, any try. Phase 3's Safari Pokédex will show them. A catch also counts `run.tally.caught`
  (a line in the result window).

## Signature cards, Bait and Rock

- In `js/data/cards.js`: `SIGNATURE_CARDS` (one per Safari Pokémon, `sig-<enemy id>`, built from its own best-known move
  with existing mechanics, `safari: true`, `maxCopies: 1`, `from`) and `SAFARI_ONLY_CARDS` (Bait, Rock). They're in
  `CARDS_BY_ID` (upgrades too) but never in `ALL_CARDS`, so never in the Card index or `poolForType()`. `SIGNATURE_FOR`
  maps an enemy id to its card. A new Safari Pokémon needs one (the test checks every `SAFARI_ROSTER` id). Their texts
  were checked against the run's pools for same cost + same text (the "No duplicates in one run" rule).
- **Bait** (0 PP, `bait: 1`): `enemy.bait`, a 🍓 badge; +50% catch multiplier each, its attacks +`BAIT.damage` (3) each
  (`attackDamage()`).
- **Rock** (0 PP, 4 damage, Vulnerable 1, `rock: 1`): `enemy.rock`, a 🪨 badge. `runsOff()` at the start of the enemy's
  turn: a Rock'd wild runs off with `ROCK_FLEE` (15%) per Rock; a rare spawn just leaves a turn sooner per Rock.
- Both join a Safari run's card rewards and Mart (`cardChoices()` in `js/rewards.js` adds them when `run.safari`).

## Rare spawns

- `markRares()` in `js/data/safari.js`, from `startBiome()` after the wilds are dealt, on the biome's seed: each wild room
  has `RARE.odds` (12%) to hold one of its area's `rares` instead (Chansey, Kecleon and the `rare` lines of `safari-mons.js`
  are Safari-only, the rest are the main game's elite species as plain wilds), with `node.rare` saved on the map.
- The map shows a gold ✦ over its room (`.map-rare`, its title says so); in battle the name gets a ✨, the nameplate a gold
  rim (`#enemy-plate.rare`) and a 💨 badge counts the turns left. It runs off at the start of its turn once `turn >=
  RARE.turns - rock` (4 of your turns): `runAway()` -> `onEnd({ escaped: true })`, and the map says "ran away. Nothing
  won." Its catch odds are halved (`RARE.mult`).

## Poké Balls (the Game Corner's fourth row)

- `BALLS` in `js/data/balls.js`; `save.balls = { great, ultra, dusk, ..., owned, masterWeek }` (a count per pack ball,
  `owned` the Master Ball). The row is for sale once the Pokédex
  is complete (the Safari's own lock).
- Safari Ball: free, always. Every other ball but the Master Ball comes in packs, used up when thrown (the save is
  written as the ball is thrown, so a refresh that replays the room doesn't give it back): Great (x1.5) and Ultra (x2),
  5 for 40 / 90 coins; Dusk (x3 at `timeOfDay()` night), Quick (x4 in turns 1-3: "turn 1" alone could never be used,
  since a throw needs red HP), Timer (x1 +0.25 a turn, up to x3) and Net (x3 on Water and Grass), 3 for 150; Luxury (x1,
  +10 PokéCoins on a catch), 3 for 100. Master Ball (1500): a sure catch, one throw a UTC ISO week (`ballWeek()`,
  `masterWeek`).
- Until 2026-10-02 Dusk / Quick / Timer / Net / Luxury were one-time unlocks (300 / 250, thrown freely, in
  `save.balls.owned`); the user found 300 too much. `migrateBalls()` (from `load()` in `js/storage.js`) turns an owned
  one into `UNLOCK_REFUND` (10) throws of it, and `owned` keeps only the Master Ball. Pinned by `tests/catch.test.mjs`.

## The prep window (2026-10-02)

The title's Safari Zone gem opens `#safari-prep-dialog` (`js/safariprep.js`), not the run (the user's ask: "like setting
your loadout"). Styled like the character select's Prepare step (the user's ask after a playtest): a dark panel, gold
pixel heads, pixel pill buttons (`.pxb`), bigger text (rules 0.82rem, 0.78 on phones). It holds today's run (the
starter, the 3 areas with each page's caught count, first try or replay), 📕 Pokédex (on the day's first area) and 🏆
Leaderboard buttons, the rules in eight short lines (`RULES`, each with a pixel icon that `js/icons.js` has: an emoji
without one would show as a plain emoji), then a sticky foot (`.sp-foot`): your Poké Balls in one row like an item bar
(a slot each, sprite and ×count, greyed at 0, the Safari Ball's ∞ big at the sprite's bottom centre; the Master Ball ×1 or ×0 once thrown this week), a purple 🎰 Buy slot at its
end for the Game Corner, and Back / Start. Start keeps the "your saved run will be lost" confirm (`onStart` in
`js/main.js`; No reopens the window). The Game Corner is non-modal, so it would sit under this modal window: Buy closes
it, opens the shop on its Poké Balls row (`toggleShop('balls')`) and reopens it, refreshed, when the shop closes. The
Safari Pokédex and the Leaderboard are modal and simply stack on top.

## The fair first try

The day's first try is the leaderboard's, so `fairTry()` in `js/run.js` turns off every perk for it: `perk(id)` and
`dexPerk(id)` (Max HP Boost, Starting Relic Charm, Well-Fed, Bag Pocket, Mart Card, Move Tutor Notes, Scout Report, the
Silph Scope's reveals and Scope Upgrade, Mom's Savings, Chansey's Gift, Oak's Advice). Coin Finder stays (it only touches
PokéCoins). The map says so at the start, and the result window's first-try line too. Replays keep the perks.

## The Safari Pokédex (phase 3)

- `#safari-dex-dialog` (`js/safaridex.js`, `index.html`), the main Pokédex's classes (`.dex-entry`, `.dex-perk`,
  `.dex-detail`) plus `.safari-*` in `css/screens.css`. A tab per area (`.safari-tab.area-<id>`, gold once every entry is
  caught); each page has the area's box (caught / seen / total, a bar of the caught) then **Wild Pokémon** and **Rare
  spawns** (`.safari-rare`, gold rim and ✦). An entry is a silhouette and ??? until seen, its sprite and name once seen,
  plus a Poké Ball mark once caught (`.safari-caught`). The header counts caught / all and seen.
- **Entry page** (a tap, like the main Pokédex's): sprite, number, type, the areas it lives in (✦ rare where it's a rare
  spawn), caught or not, its description, and its signature card (`SIGNATURE_FOR`, a 150px `makeCard()`), a dashed ?
  until caught.
- **Data** (`js/data/safari.js`): `SAFARI_DEX_PAGES` (one per `SAFARI_AREAS` entry: `wild`, `rare` without repeats,
  `ids`), `SAFARI_NUMBER` (`SAFARI_ROSTER` order, so phase 4's Pokémon get numbers by being listed), `safariHomes(id)`,
  `safariProgress(ids, dex)` (caught counts as seen). Pinned by `tests/safaridex.test.mjs` (every entry has a picture,
  a number and a signature card).
- **Where it opens**: the Collection's **Safari Pokédex** card (`safariCard()` in `js/collection.js`, a 🔒 ??? until
  `safariOpen(save)`), the main Pokédex's last tab **Safari** (`#dex-safari-tab`, hidden until `safariOpen(save)`; it closes that
  window and opens this one), and the Poké Ball menu's Pokédex button during a Safari run, on the run's area
  (`runSafariArea()` in `js/run.js`).

## Completion rewards (2026-10-02, the user's design)

- **A page** (an area with every Pokémon on it caught, `safariPageDone()`): `SAFARI_AREA_COINS` (1000 since 2026-10-02, was 300: the user found it too small; Coin Finder applies)
  once, and that area's rare spawns `RARE_BOOST` (x2) as often when it comes up, on replays only: `rareOdds(area, dex,
  fairTry())` in `startBiome()` feeds `markRares()`. `creditSafari()` in `js/run.js` pays it after every won Safari fight
  (`safariNews(dex)` lists what's newly done), before `checkAchievements()`, with reward-box lines. Paid on any try: the
  coins don't touch the leaderboard, the boost waits for a replay.
- **The whole Safari Pokédex** (every `SAFARI_ROSTER` id caught, judged on the roster of that day): `save.safariDex.complete`,
  Rayquaza's achievement.
- Earned stays earned: `save.safariDex.done` (area ids) and `complete` are saved, so a later batch adding Pokémon to a page
  takes nothing back (the tab keeps its ✦, the box says Earned).
- **On screen**: each page's box shows its reward (🔒 until earned, gold once earned, ✦ on the count), a Rayquaza box on
  every page (a silhouette until won; the Safari UI never names Rayquaza until it's unlocked, the user's call: "Complete the
  Safari Pokédex: a new Legendary awaits you." there and in the prep window's last rule), a gold ✦ on finished tabs (`.safari-tab.complete .safari-tab-star`), and a gold ✦
  badge on the title's Safari Zone gem once complete (`.gem-badge`, `safariGem()` in `js/title.js`).
- **Rayquaza** (`safariPrize: true`) is left out of `safariStarters()`: listing it would have changed every day's dealt
  starter. Pinned by `tests/safarireward.test.mjs` (page / whole-dex news once, the boost, Rayquaza's assets).

## The Safari's own Pokémon (phase 4)

- `js/data/safari-mons.js`: `SAFARI_MONS`, one line each: `mon(id, name, type, area, template, [3 move names], description,
  [card name, cost, art, effects, card extras], { rare })`. A move name wrapped in `N()` is x1 (`type: 'normal'`), for an
  off-type move. `safariMonDef()` builds the `ENEMY_DEFS` entry (enemies.js adds them all, `safari: true`, `template`);
  cards.js builds each line's `sig-<id>` card (the card's type is the Pokémon's); safari.js appends each area's lines to
  its `normals` (or `rares`), after the borrowed wilds.
- Batches: 1 (58 Pokémon, ~9 an area + a rare spawn), 2 (84, 12 an area + 2 rare spawns, appended per area under
  `Batch 2` headers) and 3 (85, under `Batch 3` headers: 12-13 wilds + 2 rare spawns an area, 12 of them Fire, since
  batch 2 had only two; evolved forms of earlier Pokémon count as new species) and 4 (81, under `Batch 4` headers: 11-12
  wilds + 2 rare spawns an area, 29 Grass, 27 Water, 25 Neutral, since no Fire species were left) and 5 (80, under
  `Batch 5` headers: 11-12 wilds + 2 rare spawns an area, the last 11 Grass and 5 Water species and 64 Neutral; Numel and
  Magby moved from the Peak to the Wetland, which had no Fire Pokémon) and 6, the last (80, under `Batch 6` headers, all
  Neutral-shown: 20 each to the Forest and Wetland, which had the fewest Neutral Pokémon, 9-11 to the rest, 2 rare spawns
  each); **514 Safari Pokédex entries with the borrowed wilds: every Gen 1-5 non-legendary is in**. The Budew / Sewaddle / Lotad / Horsea / Spheal /
  Tympole lines stay out (the user turned them down as skins).
- `TEMPLATES` (Biome 1 numbers): striker 46 HP 6/5/9; bruiser 51, 6 / +2 strength / 9; tank 57, 8 block / 6 / 9; heavy 62,
  9 block / 5 / 11; speedster 40, 7/6/10; drainer 51, drain 5 (+4) / 6 / drain 8 (+5); poisoner 48, 5 + Poison / 6 block /
  9; paralyzer 48, 6 + Paralysis (draw pile) / +1 strength / 9; confuser 48, 5 / 6 block / 9 + Confusion (draw pile);
  clogger 51, 2 Sludge / 6 / 9. HP x1.1 since batch 3 (2026-10-02): the template Pokémon had become most of every
  roster and knock-out runs drifted to 83.7% (human bot); with it 74.0.
- `PLACE`: a template Pokémon in the run's 2nd / 3rd area has x1.16 / x1.42 HP and +1 / +2 on its attacks (its
  `strength` from `buildEncounter()`), on top of that biome's `hpMult` / `dmgBonus`, like the main game's wilds grow. The
  borrowed wilds keep their own numbers.
- Types: only the main game's four (a Psychic chip would give Mewtwo's type away): Bug is Grass, Ice is Water, the rest
  of the off types Normal.
- A new Pokémon: its line, `assets/pokemon/<id>-front.gif` (PokeAPI's `versions/generation-v/black-white/animated/<dex>.gif`
  from raw.githubusercontent.com) and its `SPRITE_FIT` line (a PIL median bbox over all frames). `tests/safarimons.test.mjs`
  checks them all, that it isn't a main-game Pokémon, and that no signature card has the same cost, text and keywords as
  another card a Fire / Grass / Water run can meet (Mewtwo's Psychic cards are left out: it never walks the Safari).

## The bot (`../pokeDB-sim`)

`cfg.safari` (`safariCfg()` in `sim/run-node.mjs`) plays a Safari day: `true` deals a random day per run (its starter,
areas, seeded maps, wilds and rare spawns via the game's own `dealEnemies()` / `markRares()`), with each type's relic
ranks. `cfg.catch` throws a Safari Ball at the start of a turn at red HP once the odds reach `cfg.catchAt`; the engine
mirrors Bait, Rock, running off and the catch's prize and signature card. Variants `noSafariCards` and `noRares` give the
phase 1 run.

## The leaderboard (phase 5a, 2026-10-02)

- **What posts**: only the day's first try (`run.safari.first`, never a `?event=` peek), once, when it ends, won or lost
  (`endRun()` in `js/run.js` -> `postSafariResult()` in `js/leaderboard.js`). Abandoning it posts nothing. The result is
  kept on this device (`pokedb.safari.post`) until it's posted, so signed out, offline or with no name yet it goes up later:
  on sign-in (`onCloudSignIn()` in `js/cloud.js`) or when the Leaderboard opens, while its day is within a day of today.
  The result window gets a 📮 line saying which.
- **An entry** is `safariBoard/<day>_<uid>` in the cloud save's Firestore: `{ day, uid, name, starter, won, area, bosses,
  turns, time, caught, at }` (`at` the server's time; `time` is wall-clock seconds from `run.tally.startedAt`). The name
  is always a nickname the player picked (`pokedb.safari.name`, `nameFor()`), never the sign-in's display name, which
  would put real names on a public board (the user's call, 2026-10-02). Signed in with no nickname yet, the Leaderboard
  opens with a gold-rimmed name box at the top (`nameRow()`, prefilled with the Google first name only as a suggestion),
  and posting waits (`post()` returns 'name') until one is saved. Trimmed to 16 (`cleanName()`); it can't be changed
  after posting.
- **Pure part**: `js/data/leaderboard.js` (`runResult()`, `buildEntry()`, `checkEntry()` mirroring the rules,
  `rankBoards()`, `formatTime()`), pinned by `tests/leaderboard.test.mjs`, which also checks `firestore.rules` keeps the
  same bounds (`LIMITS`, `NAME_MAX`, the keys).
- **Boards** (`BOARDS`): Fastest win (wins, time then turns), Fewest turns (wins, turns then time), Most caught (caught > 0;
  then wins, bosses, turns). Ties: the earlier post first. Top 10 each, plus your row under a ⋯ when you're below, and a
  "Your try" line with your own entry. A day's entries are one `where('day', '==', day)` query (up to 1000, no index
  needed), sorted on the device and cached a minute.
- **The window** (`#board-dialog`, `.board-*` in `css/screens.css`): Today / Yesterday tabs, the day's starter and areas,
  then the three boards. Opens from the title's 🏆 beside the Safari Zone gem (`#title-board`, only once the Safari is open), the prep
  window, the Safari Pokédex's 🏆 Leaderboard button (`#safari-dex-board`) and a Safari run's result window
  (`#result-board`). Signed out: "Sign in to post..." with a Sign in button (opens the cloud window).
  No config / Firebase unreachable: "can't be reached right now", the game unaffected. Every Firebase call is caught.
- **Rules**: `firestore.rules` (the cloud save's `saves/<uid>` rule plus `safariBoard`): anyone reads; a signed-in player
  creates only their own `<day>_<uid>`, day within ±1 of the server's date, every field typed and bounded, `won` only with
  3 bosses, `at == request.time`; no updates or deletes, so each day posts once.
- **Switching it on** (the user, once, in the Firebase console for `pokedb-42e7c`):
  1. console.firebase.google.com > the pokedb project > Build > Firestore Database (if it says Create database: create
     it, a location near you, production mode).
  2. Its **Rules** tab: replace everything with the contents of `firestore.rules` from the repo, then **Publish**.
  3. Nothing else: no index, no new sign-in method. Sign in on the live site and play the day's first Safari try.
- Headless tests route gstatic to stand-in modules (an in-memory Firestore), as the cloud save's did. A cheater with the
  console can still post a made-up (in-bounds) result for their own account: there's no server replay check.
