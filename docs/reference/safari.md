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
- **The record**: `save.safariDex = { seen, caught }` (`markSafari()` in `js/storage.js`): `seen` when a Safari wild fight
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
  has `RARE.odds` (12%) to hold one of its area's `rares` instead (Chansey and Kecleon are Safari-only `ENEMY_DEFS`, the
  rest are the main game's elite species as plain wilds), with `node.rare` saved on the map.
- The map shows a gold ✦ over its room (`.map-rare`, its title says so); in battle the name gets a ✨, the nameplate a gold
  rim (`#enemy-plate.rare`) and a 💨 badge counts the turns left. It runs off at the start of its turn once `turn >=
  RARE.turns - rock` (4 of your turns): `runAway()` -> `onEnd({ escaped: true })`, and the map says "ran away. Nothing
  won." Its catch odds are halved (`RARE.mult`).

## Poké Balls (the Game Corner's fourth row)

- `BALLS` in `js/data/balls.js`; `save.balls = { great, ultra, owned, masterWeek }`. The row is for sale once the Pokédex
  is complete (the Safari's own lock).
- Safari Ball: free, always. Great (x1.5) and Ultra (x2): packs of 5 (40 / 90 coins), used up when thrown (the save is
  written as the ball is thrown, so a refresh that replays the room doesn't give it back). Unlocked once, thrown freely:
  Dusk (x3 at `timeOfDay()` night), Quick (x4 in turns 1-3: "turn 1" alone could never be used, since a throw needs red
  HP), Timer (x1 +0.25 a turn, up to x3), Net (x3 on Water and Grass), Luxury (x1, +10 PokéCoins on a catch). Master Ball
  (1500): a sure catch, one throw a UTC ISO week (`ballWeek()`, `masterWeek`).

## The fair first try

The day's first try is the leaderboard's, so `fairTry()` in `js/run.js` turns off every perk for it: `perk(id)` and
`dexPerk(id)` (Max HP Boost, Starting Relic Charm, Well-Fed, Bag Pocket, Mart Card, Move Tutor Notes, Scout Report, the
Silph Scope's reveals and Scope Upgrade, Mom's Savings, Chansey's Gift, Oak's Advice). Coin Finder stays (it only touches
PokéCoins). The map says so at the start, and the result window's first-try line too. Replays keep the perks.

## The bot (`../pokeDB-sim`)

`cfg.safari` (`safariCfg()` in `sim/run-node.mjs`) plays a Safari day: `true` deals a random day per run (its starter,
areas, seeded maps, wilds and rare spawns via the game's own `dealEnemies()` / `markRares()`), with each type's relic
ranks. `cfg.catch` throws a Safari Ball at the start of a turn at red HP once the odds reach `cfg.catchAt`; the engine
mirrors Bait, Rock, running off and the catch's prize and signature card. Variants `noSafariCards` and `noRares` give the
phase 1 run.
