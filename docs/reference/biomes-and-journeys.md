# Journey films, the crossroads and branching biomes

Moved out of CLAUDE.md on 2026-10-14 so every session loads less; the text is unchanged. Dates are when each call was made: where two notes disagree, the later one wins.

- **Journey films** (roadmap steps 10-11, 2026-10-04): between a boss's rewards and the next biome, `walkOn()` in `js/run.js`
  plays `travel()` from `js/travel.js` (not on Mewtwo's runs or in the Safari): your Pokémon (front GIF, flipped) walks a
  side-on parallax road, a low-res canvas per layer slid the last fraction of a pixel by CSS so it glides (`into()`; `#travel-scene`, z-index 945), the land turning from one biome into the
  next by where each thing stands on the road, the sky dusk → night → dawn (land graded between `GRADES`), one set piece
  mid-way. It ends dark and resolves with a `close()` called once `startBiome()` has the map and biome film up beneath.
  One `ROUTES` entry per trip: `clearing>shrine` (the Ancient Tree's roots, the Shrine's lantern stair) and `shrine>wastes`
  (three looks, `a` / `d` dried out / `b`; a rope bridge over a lava chasm that sags and sways under your Pokémon, a
  route's `deck` in `groundY()`, its `walk` slowing the steps; ash falls, the volcano rises glowing on the horizon);
  a trip without one is skipped. Since item 20 part c (2026-10-07) every pairing the pool allows has one: the nine newer
  trips run on one painter, `paintPool()`, crossing two `LANDS` kits (palette, trees, roadside; a new pool biome needs a
  kit) with the trip's set piece in hooks (its doc comment lists them; `poolTrip()` builds the route). First-time lines once per trip, `save.travelSeen` (`{ 'shrine>wastes': true }`; an
  old save's `true` counts as the Clearing's). Early in each trip (a route's `fly`) a legendary you haven't unlocked flies
  over as a silhouette with its shadow on the road, or, with the Sealed Gate at half HP or less, sometimes Eternatus's red
  glow pulses on the horizon (`pickGuest()`, seeded by `run.tally.startedAt` and the trip). Playtest `?travel=shrine` /
  `?travel=wastes` (`&at=0.5`, `&flyer=lugia` / `eternatus` / `none`). The Ruins' two trips are under Branching biomes below.
- **Branching biomes** (roadmap item 19 part a, 2026-10-06; the user's settled calls: other roads' Pokédex pages are bonus
  pages, Mewtwo keeps its one road, each new biome is bot-checked against the one it pairs with): `BIOMES` in
  `js/data/enemies.js` is the default road, each entry with its `slot`; `ALT_BIOMES` holds the other roads, since item 20 part
  a (2026-10-07) one **pool** (`POOL`) of three that can each stand at either fork (`FORKS`, slots 1 and 2): each run rolls at
  its start which pool biome each fork offers beside its default (`rollRoads(stats.biomesSeen)`, saved as `run.roads`, never
  the same one twice; an unseen biome is offered before a seen one, a coin flip between equals; a save without `roads` gets
  `LEGACY_ROADS`, the Ruins then Thornwood), `forkRoads(slot, roads)` the fork's two. A pool biome has no numbers of its own:
  `walkAt(biome, slot)` lends it the slot's hpMult / dmgBonus / bossBonus, and `forkGrowth()` grows or shrinks its Pokémon
  (authored at its `home` slot) to the default road's at that slot (average HP per kind and average hit, measured from
  `BIOMES`); `biomeAt()` returns the walked copy, `BIOMES_BY_ID` the one at `home`, `canWalk(id, slot)` checks a route. The
  pool: the **Sunken Ruins** (home 1: a flooded temple, 5 Water / 2 Fire / 2 Grass / 3 Normal wilds, Alphas Lickitung / Herdier / Audino, bosses
  Dunsparce / Wigglytuff / Granbull), since part c (2026-10-07) the **Thornwood Jungle** (home 2: a primeval forest, 7 Grass / 2 Fire / 2 Water / 1 Normal wilds (the only Normal one Slakoth, Team Rocket's whole
  `team` there), Alphas Vigoroth / Delcatty / Spinda, bosses Blissey / Porygon / Porygon2; its look is part d's, below),
  and since item 20 part a the **Sunscorch Savanna** (home 1: a sun-baked grassland of wildfires round one watering hole,
  places Tall Grass / Burnt Plain / Watering Hole / Sun Rock; 6 Fire (Ponyta, Magby, Ninetales, Arcanine, Houndoom, Simisear)
  / 2 Water / 2 Grass / 2 Normal wilds (Meowth and Minccino, Team Rocket's), Alphas Patrat / Buneary / Glameow, bosses
  Castform / Loudred / Munchlax; its look is item 20 part b's, below). A win
  "conquered" its last biome (`conquered(route)` in `js/halloffame.js`, from the `route` a record keeps; a Wastes descent
  scene unless the last biome is another road's: `descent({ land })`, `jungle` / `savanna` / `ruins`, each its own sky and skyline, `onSkyline()` in `js/descent.js`). The other roads stay hidden, no crossroads at all, until one won run (`stats.runsWon`, any starter or Level; `roadsOpen(stats)`, `ROADS_WINS`: 1 since 2026-10-11 for Meowth, 2 from 2026-10-10, a Level 2+ win with each type before); the result window says when they open; a peeked run always gets the fork),
  `biomeAt(route, slot)` the biome a run is in. The run saves `run.route` (a biome id per slot; a save without one is the
  default road, no version bump). The Shrine / Ember Badges read their own bosses from `dex.defeated` (a slot's
  `bossesDefeated` is any road's), the Wanderer a win through every road at either fork, the Explorer every main biome entered. After a boss's rewards `walkOn()` plays `crossroads()` (`js/crossroads.js`,
  `#crossroads-scene`, z-index 944 under the journey film; part b, 2026-10-06): a dusk fork painted on one low-res canvas, the
  path splitting round a signpost (an arm a road in its biome sign's colours, `ARMS`; a new biome needs one) into two gaps in
  the treeline, each a glimpse of its biome (`sceneShot(id, { time: 'dusk' })`), a card over each road (sign, bosses as
  silhouettes until `dexSeen()`, wild types), your Pokémon from behind on the path. Since 2026-10-11 (the user's ask: keep the scene, move like in 3D) you walk it: a tap (or hold and drag, arrows / WASD) walks your Pokémon there, in ground perspective (`toWorld()` / `fromWorld()`), easing down to 70% of the size it loads in at by the fork and held there (the user's pick: full perspective was tried and felt too much), the painting in layers (`far`, `ground`, `trees`, the post) under a still camera (`cam` 0: a following, parallax camera was tried and the user didn't like it); walking onto a road picks it, on up it takes it. Since later that day (the user's pick: "I want the 3D room instead") it is a 3D place, `js/crossroads-3d.js`, tried first by `crossroads()` (`?xr2d`, or no Three.js, paints the old one): the same button, ask and walking, the floating cards replaced by a notice board at each road's mouth (`boardMesh()`, the Clearing's `kioskArt()` in its `ARMS` colours; a tap walks your Pokémon up beside it and opens `.xr-panel`: sign, places, bosses, wilds, Pokédex page; reading never picks a road; the user's pick, same day), your Pokémon easing to 70% of its loaded size by the fork (`SHRINK`; the painted one too), in the painting's camera (level and high over the path, the horizon shifted up by a view offset to the painting's 42% / 50%, its fork and your Pokémon's feet at the painting's heights, `fitCamera()`), open meadow like the painting (a big tree cut by each screen edge, `edgeTree()`, the far treeline low across the horizon, `treeline()`, squashed to the camera's height, a wide gap per road showing a faded `sceneShot()` of its biome), a signpost whose arms light on a pick, fireflies; your Pokémon keeps its size on the screen until it walks off. A tap (card or road) or an arrow key picks,
  a second tap, the button or Enter takes it: it walks up that road into the dark. No way out without choosing. It resolves
  `{ id, close }`, closed once the journey film or the map covers it. Never on Mewtwo's or a Safari run. Playtest
  `?crossroads` (`&starter=`, `&stage=`, `&slot=2` for the second fork with `&from=ruins`, `&road=savanna` the pool biome it offers, never saved). `dealEnemies()` / `buildEncounter()` / `buildKenEncounter()` / `pickEnemyId()` take the
  biome object (or a slot number for the default road). Every per-biome array (events' numbers, Kenmatta's HP,
  `deepestBiome`, `bossesDefeated`, `map${n}` music) stays by slot; Team Rocket's `team` and `BOSS_PRELUDE_LINES` are by
  biome id. `stats.biomesSeen` lists every biome walked into (the Explorer Badge's: every main biome entered, the user's call; six since item 20). The pool's
  Pokédex pages (the Collection tile and Trainer Card count only the three until the Safari opens, then every page found, `dexTally()`, 2026-10-17) are `BONUS_PAGES` in `js/data/pokedex.js` (after the Depths in `ALL_PAGES`, so old indices and numbers stay;
  the Ruins No.072-089, Thornwood No.090-107, the Savanna No.108-125; 500 PokéCoins each once, `bonus`, and since 2026-10-11 a perk each like the three's, `DEX_PERKS` (the user's call: perks that show or choose, never make a run stronger, so no bot test): the Ruins' Unown Rubbing reads a ❓ room's event on the map (`rubbing-btn` beside the Scope, `node.read`), Thornwood's Tracker's Eye rings wild fights by match-up (`.map-match`, `matchUp()` in `js/map.js`), the Savanna's Wayfinder swaps the crossroads' pool road (`wayfinder()` / `swapRoad()` in `js/run.js`, `run.wayfound`, `swap` in `crossroads()`); never in `DEX_PAGES`; "???" until met, `bonusKnown()` in `js/pokedex.js`). The
  pool's Pokémon are **Safari Pokémon, shared** (2026-10-07, the user's call: official Gen 5 sprites only, the Gen 6-9 Showdown
  ones they had were swapped out), like the Safari's 44 borrowed wilds: the biome's `ENEMY_DEFS` entry wins over
  `safariMonDef()` everywhere, Safari included, and keeps the Safari Pokédex's line as `safariLine` (`js/safaridex.js` reads it);
  their area, rare spawn and `sig-<id>` card stay in `SAFARI_MONS`. **Its look**
  (part b, 2026-10-06): `BIOME_ART.ruins` in `js/scene.js`, a temple drowned in a jungle lagoon. Its ground is water:
  `ruinsFloor()` mirrors the backdrop in it, things standing in it are painted with `dry()` and mirrored by `reflect()`, and
  `rippleRuins()` ripples every wet pixel each frame from a still `snap` (`ruinsSettle()`, after the landmark); a new thing
  in the water must be painted `dry()` (or it ripples) and reflected. Places: Flooded Steps (`steppedTemple()`, its stair on
  under the water, an aqueduct pouring), Drowned Halls (`colonnade()` in perspective, lintels, light shafts), Sunken Court
  (`colossalHead()`, `fountain()`, lily pads), Tide Altar (`altarRing()`, `tideAltar()`: the tide wheel, whose 12 runes
  `wheelRunes()` draws live). Its boss prelude (`ruinsWake()` / `ruinsPortal()`, `TIDE_AT`): the runes light round the
  wheel, the pool spins into a whirlpool (`whirl()`), a geyser bursts up through the altar, then a wave rises over the
  screen. Landmarks `LANDMARKS.ruins`; runes glow (`S.rune`, `life.runes`). `kin: 'shrine'` now only dresses its ? events'
  outdoor props (a place's `biomes[biome]` wins over `biomes[kin]`); its grotto is its own (a Dive Ball chest, tide pools).
  Intro film `js/ruins-intro.js` (`RUINS_INTRO`: tilts down out of a drizzle, glides between 3D columns, runes plink,
  Pokémon surface with a `splash`, a film's `pop` sound); map `PALETTES.ruins` (`paving`, `flood`, the `colonnade` prop);
  signs glint (`runeGlint`). Journey films `clearing>ruins` (down a flooded stair in whole steps, `stairDeck()`, wading
  a drowned arcade) and `ruins>wastes` (the lagoon boils away round geysers; `volcano()` is shared with the Shrine's
  trip). Playtest `?area=ruins` (`&stage=`, `&kind=boss`), `?travel=ruins`, `?travel=wastes&from=ruins`. Before part b
  it borrowed the Shrine's scenery. **Thornwood's look** (part d, 2026-10-07): `BIOME_ART.thornwood` (`kin: 'clearing'` dresses
  its ? events' props only), `thornBackdrop()` / `thornFloor()` / `thornFront()`, life in `drawThorn()`. Places: Tangled Edge
  (the forest's wall, giants standing out of it, `emergent()`, a dark way in, `bramble()`s, a trail), Canopy Walk (a plank
  deck, `canopyDeck()`, its far rail over a sea of treetops, `crowns()`, mist drifting, `life.thMist`; giants' trunks,
  `barkColumn()`, with `platform()`s and rope `bridge()`s), Strangler Grove (`gloomUnderRoof()`, figs as a lattice of cords,
  `cordTrunk({ lattice: true })`, aerial roots, `glowCap()` fungi), Heart Tree (`heartTree()`: a cord trunk, its heart in a
  split, `life.heart`, `archRoots()` over the arena). Its prelude (`thornWake()` / `thornPortal()`, `THORN_AT`): `tendrils()`
  writhe in from the edges as the heart beats faster, `thornBurst()`, then a briar closes over the screen. Spores and the
  heart glow (`S.spore`, in `GLOWS`). Landmarks `LANDMARKS.thornwood`; grotto `treasure.biomes.thornwood` (a tree hollow,
  `grottoRoots()`, a Nest Ball, `marks: 'nest'`). Intro film `js/thornwood-intro.js` (`THORNWOOD_INTRO`: down through the
  canopy's leaves, along the trail between 3D giant trunks to the Heart Tree). Map `PALETTES.thornwood` (`litter`, `canopy`,
  `bramble`, the `giant` and `bloom` props). Journey films `shrine>thornwood` (a vine-choked torii) and `ruins>thornwood` (a
  fallen log over a river at a waterfall's foot), sharing `farAndHills()`, `jungleTree()`, `jungleBush()`, `fernFront()`. A run
  lost at its last boss falls through a jungle floor (`descent({ land: 'jungle' })`, from `strikeGate()`). Playtest
  `?area=thornwood`, `?travel=thornwood` (`&from=ruins`), `?strike=40&land=jungle`. **The Savanna's look** (item 20 part b,
  2026-10-07): `BIOME_ART.savanna`, `savannaBackdrop()` / `savannaFloor()` / `savannaFront()`, life in `drawSavanna()` (a heat
  shimmer over the horizon by day, embers, glowing cracks `life.svGlow`, the far wildfire `life.svFire` and its smoke
  `life.svSmoke`). Places: Tall Grass (acacias, a track, `tallGrassEdge()`), Burnt Plain (`wildfireLine()`, `charredGrove()`,
  stumps smoking), Watering Hole (`wateringHole()`, reeds, a `baobab()`), Sun Rock (`sunRock()`: a prow jutting out from the
  right, the sun moved up over it, `life.rock`). Its prelude (`savannaWake()` / `savannaPortal()`, `FLARE_AT`): the sun swells,
  rays wheeling, then `grassFire()` races out from the rock (it burns on, sparse, through the fight); a wall of flame rises
  into the white. Landmarks `LANDMARKS.savanna`; grotto `treasure.biomes.savanna` (sandstone, citrine, a Fast Ball). Intro
  film `js/savanna-intro.js` (`SAVANNA_INTRO`: up out of the tall grass, over the plain between 3D acacias to Sun Rock). Map
  `PALETTES.savanna` (`savgrass`, `scorch`, `kopje`, the `acacia` prop). Journey films `clearing>savanna` and
  `savanna>wastes` (`ridgeFire()`, `acaciaMid()`, `embersUp()`, `sunRock()`). Playtest `?area=savanna`, `?travel=savanna`,
  `?travel=wastes&from=savanna`, `?strike=40&land=savanna`. Playtest `?biome=ruins` (any biome; `&starter=id`,
  `&level=0-5`; `peekBiome()` in `js/run.js`, never saved). Tests: `tests/biomes.test.mjs`.
