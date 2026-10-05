# The Sky Pillar

The 100-floor tower climb with a weekly leaderboard (roadmap item 18). Part a (2026-10-05, cloud) built the rules, the
seed, the leaderboard and the Tower Badges on a placeholder: the climb plays on the normal map screen. Part b (Desktop
app) gives it its own painted screen.

## The rules (the user's calls, 2026-10-05)

All in `js/data/tower.js`, shared by the game (`js/run.js`) and the bot (pokeDB-sim's `cfg.tower`).

- **Opens** once you've won a run (`towerOpen()`): the title's game-modes slot has a Sky Pillar gem (`pillarGem()` in
  `js/title.js`; greyed with "Win a run" until then, "Best F<n>" after), opening `#tower-dialog` (`js/towerprep.js`).
- **The week deals the tower** (`towerWeekly()`): its Monday (UTC, `towerWeek()`) seeds every roll through `js/rng.js`
  like the Safari's day, and picks the starter everyone climbs with (the Safari's pool: never Mewtwo or Rayquaza).
- **The week's first try counts** for the leaderboard and is played without perks (`fairTry()` covers `run.tower.first`).
  Tries are counted when a climb starts (`save.tower.tries`), so quitting can't retry the first. Climb again as often as you
  like (a replay), or **Practice** with any starter you own but Mewtwo (the window's starter strip): neither posts.
- **Flights of 10 floors** (`FLIGHT`): nine landings, each with 2-3 doors (`landingTypes()`: every landing has a fight;
  no Alpha before floor 3, no Center on floor 1; one Mart, Center and ? at most a landing; a Mart somewhere in every flight;
  the last landing always has a Center), then a **guardian** on every 10th floor (`guardianOf()`: a boss of the Clearing,
  Shrine, Wastes in turn; **Rayquaza** on floor 100 only, `rayquaza-guardian` in `ENEMY_DEFS`, never in the Pokédex).
- **Beating a guardian**: its rewards (card, boss relic, item odds), an evolution at floors 10 and 20 (with its own heal),
  then **30% of max HP** (`GUARDIAN_HEAL`, `guardianHeal()`), and on to the next flight (`climbOn()`).
- **How it gets harder**: floors 1-30 are the three biomes in order, their Pokémon and numbers (`towerBiome()`,
  `towerMods()`: Level 0's rules at that biome). Past 30 the fights and Alphas come from all three biomes (`towerPools()`)
  at the Wastes' numbers, and every flight adds `PAST_TOP` on top, compounding, so every climb ends: enemy HP x1.35,
  +8 damage, then every attack x1.15 (`enemyDmgMult`, applied in `attackDamage()` after strength, before type and Weak;
  2026-10-05, the user's pick: without it Grass's healing outgrew a flat +8 and 24% of its climbs reached floor 100).
- **What it counts for**: your highest floor (`save.tower.bestEver`, any climb) and the week's counted floor
  (`save.tower.best`, its first try only), saved floor by floor as they're cleared (`climbed()`), so an abandoned climb
  keeps what it reached; the **Tower Badges** at 25 / 50 / 100 (`js/data/badges.js`). No starter unlocks, feats, gate
  hits, win streak, Record Book, Stats runs or Pokédex research (`isTower()` guards in `js/run.js`).
- **The top** (2026-10-05, the user's call: no endless mode): floor 100 (`TOP_FLOOR`, `TOP_FLIGHT`) is the summit. Beating
  Rayquaza there skips the guardian's rewards and ends the climb won: `climbed(100)`, then `endTower(true)` plays the summit
  version of the win scene (`winScene(draftSummit(...))` in `js/halloffame.js`, `.hof-scene.summit`: dawn over a sea of
  clouds, a mossy stone pedestal in Rayquaza's green and gold, the Hall of Fame's party and song; never saved in the
  Record Book) and counts `save.tower.summits` and `bestTurns`. The leaderboard already ranks a summit by fewer turns,
  then the faster climb, so there's a reason to climb again after it.
- **The end**: otherwise a climb ends in a faint: `endTower()` shows the floor reached, your best, and posts the week's first
  try. "Climb again" starts the same kind of climb.

## How it runs (part a's placeholder)

- `run.tower = { week, seed, first, practice, flight, floor }`, saved with the run. `flight` is the guardians beaten;
  `run.biome` follows `towerBiome(flight)` for scenery, numbers, events and music.
- Each flight is a map from `landingMap()` in `js/map.js`: a row of doors per landing, every door linked to every door
  above, the guardian on top. So the map screen shows the flight, `F<n>` is the tower's floor, the board says
  "Floors 1-10", the run card's chip says Counts / Replay / Practice, and the sign says Sky Pillar.
- `startFlight()` deals each door's Pokémon from the week's seed (`dealEnemies()` takes an `elites` pool now), the Marts'
  stock and the ? rooms. Seeded streams are keyed by the flight (`zone()`), not the biome.

## The leaderboard

- `towerBoard/<week>_<uid>` in the cloud save's Firestore, posted once by the week's first try when it ends
  (`postTowerResult()` in `js/leaderboard.js`): `{ week, uid, name, starter, floor, turns, time, at }`. The pure part is in
  `js/data/leaderboard.js` (`towerResult()`, `checkTowerEntry()`, `rankTower()`: highest floor, then fewer turns, then
  the faster climb). `firestore.rules` has its `match /towerBoard/{id}` (posted that week or the day after);
  **the user has to publish the rules again** for it to take posts.
- The leaderboard window serves both boards (`openLeaderboard(offset, 'tower')`, `KINDS` in `js/leaderboard.js`): tabs
  This week / Last week, the week's climber in the header.

## Playtest

`?tower=25` starts a throwaway climb at that floor (the week's tower and starter, evolved as its guardians would have),
never saved; `&hp=0.1` shrinks every foe's HP to see guardians and flights through quickly.

## Tests and the bot

`tests/tower.test.mjs` (the week, the deal, landing rules, guardians, scaling, the badges, the board and the rules' bounds).
The bot climbs with `cfg.tower` (and `cfg.towerFlights`, default 3); `progress()` is then the floors cleared.
