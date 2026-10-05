# The Sky Pillar

The 100-floor tower climb with a weekly leaderboard (roadmap item 18). Part a (2026-10-05, cloud) built the rules, the
seed, the leaderboard and the Tower Badges on a placeholder map. Part b (2026-10-05, Desktop app) painted it: the tower is
the map now (see "The look" below).

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

## How it runs

- `run.tower = { week, seed, first, practice, flight, floor }`, saved with the run. `flight` is the guardians beaten;
  `run.biome` follows `towerBiome(flight)` for scenery, numbers, events and music.
- Each flight is a map from `landingMap()` in `js/map.js`: a row of doors per landing, every door linked to every door
  above, the guardian on top. The map screen draws it as the tower (`drawMap()` hands it to `renderTower()`), `F<n>` in
  the top bar is the last floor cleared, and the run card's chip says Counts / Replay / Practice. The Bag's map peek still
  shows the flight as a plain map.
- `run.tower.trail` (saved with the run): a `{ f, type, enemy, n, k }` per floor gone through (`enterNode()`), so the
  tower can draw each beaten foe's statue before the door (`k` of `n`) it came through, on this flight and the ones below.
- `startFlight()` deals each door's Pokémon from the week's seed (`dealEnemies()` takes an `elites` pool now), the Marts'
  stock and the ? rooms. Seeded streams are keyed by the flight (`zone()`), not the biome.

## The look (part b, 2026-10-05)

Two modules. `js/tower-art.js` holds every painter (pure pixels into a `{ W, H, px }` buffer, like the scenes): the tower's
world is `FH` (56) pixels a floor, y up, floor 0 the lobby; a camera is the world row at the screen's bottom. `js/tower.js`
is the screen and the overlay that use them.

- **The sky by height** (`paintSky()`): one colour table by floor (`SKY_STOPS`), dithered between rows, then the features in
  their bands: the ground and a forest round the foot (treetops for the first floors), drifting clouds about floor 5-14, the
  storm 15-26 (dark masses, rain, a bolt every few seconds, and flashes on the climb screen), the cloud sea's lit tops at 27
  with the sun setting over it, the aurora's two ribbons about 47 and 55, stars from 36, a nebula and a moon about 90, and
  the planet's curve with dawn breaking along it at the summit's horizon (`LIMB`). Windows are holes: `paintTower()` keeps a
  copy of the sky (`b.sky`) and every window, and the lobby's open door, shows it.
- **The tower** (`paintTower()`, `towerLayout()`): outer walls cut away (moss and ivy outside), each floor a back wall of
  stone courses whose stone changes every few flights (`TIERS`: mossy grey, sandstone, cloud grey, moonstone, jade at the
  top), its number carved by the wall, its slab open over the stair of the floor below. A floor is lit once climbed or where
  you stand, dim above (`stone(f, lit)`). Plain floors: their 2-3 doors (`door()`: an arched frame, planks, iron bands, a
  gem in the keystone in the room's colour, `DOOR_GEM`) with windows and torches between; every 10th a guardian's hall
  (banners in the guardian's biome colours, `BANNER`, braziers, a gold-trimmed double door); floor 0 the lobby (the way in,
  a bronze plaque, torches); floor 100 the summit, open to the sky (broken pillars, an altar where Rayquaza comes down). The
  spiral stair (`stairWell()`, `stairSteps()`) winds round a newel at the right of every floor but the top.
- **The climb screen** (`renderTower()`): `#tower-view` fills the map screen behind the run card (the sign and the map box
  are hidden, `#map-screen.tower`). The floor you stand on sits 30% up the screen; its doors are buttons (`.tw-door`) with
  the room's icon on a hanging sign. A tap: your Pokémon (its front GIF, `#tw-mon`) walks to the door, it opens and the
  Pokémon goes in, then `enterNode()`. Back on the map with the floor above to pick, it comes out of the same door (`last`),
  a beaten foe's statue rises out of the floor (`statue()`: its sprite cropped to its pose in four greys), it walks to the
  stair and climbs it step by step round the newel while the camera pans up a floor, then the stone plate (`#tw-plate`)
  stamps the new number (gold on a guardian's floor, SUMMIT on the top) with the `stamp` synth. A fresh climb walks up from
  the lobby. The altitude gauge (`#tw-gauge`) is the sky's colours from 0 to 100, a tick every 10, your floor and a gold
  tick at your best; wider screens add its marks (🌲 ☁️ ⛈️ 🌇 🌌 🐉). Under reduced motion nothing walks.
- **Guardian intros** (`guardianIntro()`, from `fight()` before the wipe): the overlay `#tower-fx` shows the hall close up
  (bigger pixels, no stair): the braziers flare, the doors grind open on red light and the guardian's silhouette (its GIF,
  sized to the door), and "Floor N · Guardian" slams in. Rayquaza's on floor 100: green streaks cross the stars twice, the
  altar's light climbs into the sky, rays fan out and the dragon coils down in lightning as "Rayquaza, Lord of the Sky"
  lands. A tap skips either.
- **The fall** (`towerFall()`, from `endTower()` on a faint): the floor cracks under your Pokémon, gives way, and it tumbles
  past every floor it climbed (lit, statues and all, the sky running back down) to the lobby floor: a thud, a white flash,
  dark. The overlay stays dark behind the result window until it closes.
- **The battle arena** (`showTowerScene()` in `js/scene.js`, `paintArena()`): every Sky Pillar fight is in one of the
  tower's rooms, its tall windows on the sky at that floor's height, torches (braziers, banners and a red runner for a
  guardian, banners for an Alpha); Rayquaza's is the open summit.
- **The summit's win scene** (`.hof-scene.summit`): its backdrop is `paintSummit()`, floor 100 as the climb and the fight
  show it, its horizon behind the pedestal.
- **The lobby's plaque** (`engrave()` in `js/towerprep.js`, `towerTop()` in `js/leaderboard.js`): the Sky Pillar window
  lists the week's top five climbers on a bronze plate (a summit shows its turns). The board is public to read, but until
  the user publishes `firestore.rules` Firestore refuses it and the plaque says it can't be read.

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
never saved; `&hp=0.1` shrinks every foe's HP to see guardians and flights through quickly (`?tower=99&hp=0.01` reaches
Rayquaza in one fight). `?tower=1` walks up from the lobby. From the console, `import('/js/tower.js')` then
`guardianIntro({ def, floor })` or `towerFall({ floor, trail: [], sprite })` plays either on its own.

## Tests and the bot

`tests/tower.test.mjs` (the week, the deal, landing rules, guardians, scaling, the badges, the board and the rules' bounds).
The bot climbs with `cfg.tower` (and `cfg.towerFlights`, default 3); `progress()` is then the floors cleared.
