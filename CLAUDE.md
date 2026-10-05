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
  Level for good (`init()` in `js/main.js`), so the user can playtest Level 3/5 without climbing. `?safari` opens the Safari Zone for good (`save.safariPass`, read by `safariOpen()`), to test it and its leaderboard without finishing the Pokédex. `?mewtwo` unlocks Mewtwo for good the same way, to playtest its run (and the Crystal Depths). `?lockdepths` hides the Depths' Pokédex tab again (forgets its Pokémon and `deepestBiome` 4), for a save an old playtest revealed it on. `?time=dawn`, `day`, `dusk` or
  `night` pins the day/night cycle for that page load (`js/daytime.js`). `?event=move-tutor` (any event id) walks a throwaway, never-saved run straight into that ? room, fights included (`peekEvent()` in `js/run.js`). `?bossfight=wetland` (any Safari area, `&starter=id`) walks one straight into that area's boss fight, prelude and arena included (`peekSafariBoss()`); `?bossfight=depths` (`&hp=0.1`) does it for Eternatus, the final boss, with Mewtwo. `?tower=25` starts a throwaway Sky Pillar climb at that floor (`&hp=0.1` shrinks every foe's HP; `peekTower()`). `?descent=mewtwo` plays Mewtwo's fall into the Crystal Depths (after its Biome 3 boss), then the Depths' film and map (`peekDescent()`). `?travel=shrine` (the biome walked to; `&starter=id`, `&stage=`) plays that journey film after PRESS START with its first-time lines, never saved; `&at=0.5` holds it at that point of the trip (`peekTravel()` in `js/main.js`). `?scene=tutor` (any `PLACE_ART` room: `kombat`,
  `center`...; `&biome=shrine` / `wastes`, or a Safari area) shows just that room's painted scene, without starting a run. `?area=wetland` (any Safari area, or a main biome: `?area=depths` walks the Crystal Depths;
  `&stage=0-3`, `&kind=boss`) shows that area's scene the same way, and each tap walks on a floor (11 an area, the boss's last), then the next area (`peekSafari()` in `js/main.js`); each area opens with its intro film and each new place with its walk-on (`js/safari-intro.js`; `&intro=0` skips them); the boss's place then plays its boss prelude (a tap replays it, a tap on the label walks on). `?gate=380` shows the Sealed Gate at that HP; `?strike=120&gate=50` plays its attack scene (here, the
  break that frees Mewtwo) after PRESS START. Neither is saved.
- **LOCAL** (their Windows PC, `serve.ps1`): only for visual work they want to see change live as it's edited
  (layout, art, animation). No Node/Python there, so no bot runs.
Every session prompt in `docs/roadmap.md` starts with its "Run in:" line; keep adding one.

## Roadmap

`docs/roadmap.md` is short: only what's still open (ready to build, ideas, parked, waiting on the user) and the rules
for adding Pokémon. Read it before starting a task. Everything finished is in `docs/roadmap-done.md` (the archive, split
off 2026-10-03), with its decisions, bot numbers and old prompts; "the roadmap's step N" / "Small asks N" in these notes
means that file. When a task lands, move its entry from the roadmap to the archive in a line or two, so the roadmap never
again lists finished work as open.

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
  That's intentional: don't "fix" it back to `showModal()`. The one exception: the Safari's prep window opens it with
  `toggleShop('balls', { modal: true })`, since it must pop up over that modal window (`docs/reference/safari.md`).
  **Every window closes on a tap outside it** (the user's call, 2026-09-27): `js/ui.js` closes any modal dialog when
  a press starts and ends on its backdrop (with the `cancel` sound); the result and yes/no windows click
  their stand-in button instead (`OUTSIDE_TAP`: Main menu, No). The Game Corner, having no backdrop,
  closes on any tap elsewhere and swallows that tap (`initShop()`; the shop button and locked starters still toggle
  it). The Bag, the Poké Ball menu, zooms and
  focus layers already did. The Collection screen goes back on a tap on its empty background too (`initCollection()`: pointer events, since iOS Safari sends no `click` for a tap on a plain section or the body).
- **Skins share decks**: only Charmander/Bulbasaur/Squirtle have unique
  decks (`FIRE_DECK`/`GRASS_DECK`/`WATER_DECK` in `js/data/starters.js`).
  Every other starter is a skin — same deck array reference, different
  sprite/name/blurb. `skinOf` on a skin entry is documentation only; code
  never reads it. 6 are Game Corner skins (`SKIN_SHOP_ITEMS`): the Gen 2/5 starters (150/250). Step 9a's six skins
  (Budew, Sewaddle, Lotad, Horsea, Spheal, Tympole) were removed again: the user didn't want them. A new starter
  needs front/back GIFs and their `shiny/` pair for every stage (PokeAPI black-white animated), `SPRITE_FIT` lines for
  the normal ones (a PIL median bbox over all frames matches the ImageDecoder numbers exactly), and a cry in `CRIES`
  (play.pokemonshowdown.com is blocked in cloud sessions: PokeAPI's `cries/pokemon/latest/<dex>.ogg`, mono 64 kbps MP3
  at -13 LUFS integrated (ffmpeg `ebur128`, padded with 0.4 s of silence for short cries; see the archive's
  "Cry loudness pass").
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
  Fifteen earned ones (plus Mewtwo, below; this said sixteen before Rayquaza, a miscount): Moltres / Virizion / Suicune (a Level 2 win per type), and since step 9b Entei / Celebi / Kyogre
  (a Level 3 win per type; Level 3 and 5 until 2026-09-28, the user's call) and Ho-Oh / Lugia / Palkia (the Clearing / Shrine / Wastes Pokédex page, `save.dex.done`;
  ids `hooh` etc.), and since step 9c Reshiram (`dex.complete`), Victini (`stats.bestStreak` >= 3: 3 wins in a row on Level 2+, `STREAK_LEVEL` in `js/run.js`; a loss or an Abandon (`forfeitRun()`) resets `winStreak`, a lower-Level win neither counts nor breaks it, Mewtwo and Safari runs never touch it; the result window says the streak (`streakLine()`) and the Achievements window shows "Current streak: n/3" from the goal's optional `progress`; since 2026-10-03, after a day as no duplicate cards / no moves forgotten; 15 cards or fewer before that
  (any Level until 2026-09-28)), Heatran (`stats.noRestWin`: `restCount` 0; PP Up at a Center isn't a rest), Manaphy (`stats.maxTide`, raised
  in `gainTide()` in `js/battle.js`) and Keldeo (wins with 3 different Water starters, Keldeo aside: `winsBy`; was every one you own until 2026-09-28), and since 2026-10-02 Rayquaza (Grass, the full Safari
  Pokédex: `save.safariDex.complete`; `safariPrize: true` keeps it out of the Safari's daily starters).
  `checkAchievements()` runs after every won fight's Pokédex update (`afterFight()`, quietly: `{ sound: false }`; its
  unlocks get a window of their own, `unlockWindow()` / `#unlock-dialog`, with the `achievement` jingle then the cry, as the
  first reward step, or after the evolution for a boss, whose chime sounds just like it; the user heard it early, 2026-09-28;
  at a run's end `announceUnlocks()` is quiet too and the windows come after the win scene, before the result window; the
  music dips under the jingle, `duckMusic()` in `js/audio.js`; only the Game Corner still plays it straight away), after each boss, at every run's end, won or lost (so an old save that
  already met a goal gets it then), and after a Game Corner buy.
  Shaymin was swapped for Virizion; `RENAMED_STARTERS` in
  `js/data/starters.js` moves an old id's unlock, wins and saved run over
  to the new one (add to it if a starter is ever replaced again).
- **Mewtwo** is the secret last starter (`secret: true`: shown as "???",
  the last portrait in the character select's Legendaries tab). It unlocks when the **Sealed Gate** breaks (2026-10-02; it was
  every other starter + a Level 5 win): the save's `gateHp` (`js/data/gate.js`: 1000 HP) takes `GATE_HIT[level]`
  (40/50/60/75/90/120) after every won run; a loss at the last biome's boss still plays the scene, but your Pokémon is
  too weak to harm it (the user's call, 2026-10-02: no more loss chip) (`strikeGate()` in `js/run.js`, before `announceUnlocks()`, with a line and the seal bar in the result window); only a
  Level 5 win takes it below `GATE_SLIVER` (50). Mewtwo's own runs leave it be. Old saves: `seedGate()` counts each
  Record Book win once (never past the sliver), and anyone who has Mewtwo gets 0. That achievement (`gateHp <= 0`) must
  stay last in `ACHIEVEMENTS`, since `checkAchievements()` grants in order (the shop also runs it after a purchase).
  **The gate's art and scenes** (part B, 2026-10-02): `makeGate(W, H)` in `js/gate.js` paints it pixel by pixel at any
  size from its HP (since 2026-10-02 fantasy, not bricks, the user's call: ice-crystal spires, floating shards, an obsidian
  frame trimmed in gold whose glyphs glow, a dark crystal door chained shut, Eternatus's seal as a turning magic circle;
  the damage in steps, not smoothly (`GATE_STAGES` / `gateStage()` in `js/data/gate.js`: past 75%, 50%, 25%, then broken;
  the user's call, 2026-10-02; `STAGE_LOOK` in `js/gate.js` is what each step paints): past 75% seeded cracks out from the
  seal leaking light; past 50% more, the crystal cracks, a chain snaps, the light behind the door rises with Mewtwo's
  silhouette, from its sprite, eyes glowing; past 25% the other chain, chunks fall out; the frame's glyphs go out a quarter
  at a time; broken, steps down into violet light). **The seal bar** (`gateBar()` / `setGateBar()` in `js/gate.js`,
  `.seal-bar` in `css/base.css`, `.big` in the scene) is its HP in the scene and the result window: the seal's gem at its
  head, a crystal track in a stone frame with light running along it, a rune at each stage that goes dark once passed, a
  pale trail lagging behind a hit (`settleGateBar()`), a flicker past 25%. **The run's end order** (the user's pick, 2026-10-02): last boss falls → the
  **descent** → the gate strike → the win scene / Hall of Fame with its song → the unlock windows (Mewtwo's last, so the run
  ends on the reveal) → the result window; a loss at the last boss gets the descent and the strike, no pedestal.
  `playGate()` in `js/run.js` chains the first two: `descent()` in `js/descent.js` (`#descent-scene`, z-index 949, one
  low-res canvas) shakes the arena (a dusky wasteland), opens a violet crack under your Pokémon, and drops it down an
  endless crystal shaft (walls, crystals and strata painted every frame from the depth; crystals chime as they pass) for as
  long as its lines last, then the light below floods up and it goes dark; it resolves with a `close()` the gate scene
  calls once it covers the screen (`onShow`). Its lines are `descentLines()` (first time: the chamber's lore; later wins one
  line each way; a loss "Something drags it down..."), or handed in as `lines` (Mewtwo's fall, roadmap Small asks 5). The
  win's fanfare fades as it starts; the break no longer brings a song back (`music` is null), the win scene starts its own.
  Then `gateScene()` in `js/gatescene.js` (`#gate-scene`, z-index 950): a crystal cavern on one low-res canvas, the gate's
  HP in a boss plate (`.gate-plate`, the big seal bar), your Pokémon from behind using its type's move (`MOVES`: a loss Ember / Water Gun / Vine
  Whip, a win Flamethrower / Hydro Pump / Leaf Storm, a Level 5 win Blast Burn / Hydro Cannon / Frenzy Plant), played
  as a **strike card** you hold to charge and let go to throw (`strikeCard()`, `.gate-strike`, every time, the user's call
  2026-10-02: gold foil for the breaking blow, grey and cracked for a loss; the damage is fixed, the charge only scales the
  show; a quick tap charges it for you, and it waits for the player, never playing itself (the user's call, 2026-10-02); no long-press select/callout/scroll on phones, pointer
  capture, Android vibration), then the flash, shake, -N and the bar running down; each stage it passes jolts the gate a step more broken
  (`crackOpen()`: crack, flash, shake, the bar's rune shattering) and adds its lines (`STAGE_LINES`). The breaking blow: shudder, light rays,
  chains snap, white-out, the door blown apart in shards, Mewtwo's silhouette in the arch, then it steps out in colour with
  its aura GIF and cry; the pedestal follows, then its unlock window. Sounds `gate-hum` / `gate-crack` / `gate-shatter` are synths in
  `js/audio.js`. **Until it breaks, the gate is only ever seen there** (the user's call, 2026-10-02: seeing its progress is a reason to
  win another run): not on the title (Mewtwo never flies by either, it has no flying sprite), and the locked "???" panel
  only hints. **Once broken** (and Mewtwo unlocked) it stands open on the title's ledge (`sizeGate()` / `paintGate()` in
  `js/title.js`, `.title-gate` in `css/screens.css`): a tap swells its violet light over the screen (`.gate-opening`)
  with Mewtwo's cry, then `onGate` in `js/main.js` opens Mewtwo's Prepare step, a shortcut to the same screen as its
  Legendaries portrait (the user's ask, 2026-10-02). Playtest: `?mewtwo&gate=0`. The story is told on the way: the first time (`save.gateSeen`) the
  descent tells the chamber's lore, the gate scene a line that past victories already cracked it (if old wins were counted) and, after the hit, that every win weakens the seal and higher Trainer Levels hit
  harder; later wins say what the next Level would deal. Playtest: `?gate=NNN` shows that HP (never saved),
  `?strike=90` (with `&starter=`, `&stage=`, `&level=`, `&kind=loss`, `&first`) plays the descent and the scene after PRESS START; a
  strike past the HP plays the break. `?lockmewtwo` undoes `?mewtwo` (relocks it, drops its shiny and a saved Mewtwo
  run, and re-seeds the gate from the Record Book; only while Mewtwo is unlocked). It is `type: 'psychic'`, has its own 10-card `PSYCHIC_DECK`, 68-card Psychic pool (including 8 evolution
  cards), and the Pressure Ability. Psychic is neutral in the type chart. Part A removed `comingSoon` once the deck and
  Ability landed; run-end guards (`isMewtwoRun()`) keep Mewtwo out of Level-based rewards and stats.
  **Mewtwo's run is its own game mode** (v1.0 part B, 2026-10-02): no Trainer Level (`prepare()` in `js/select.js` hides
  the picker and shows its rule), one fixed setting, `MEWTWO_MODE` in `js/data/difficulty.js` (`runMods()` per biome,
  `runFloors()`): biomes 1-3 are a speedrun, one road with no forks (`generateMap({ floors: [types] })` builds it,
  `roadMap()`: fight, fight, ? event, elite, Mart, Center, boss; Mewtwo's attacks +25% there, `playerDmg`, and no Pokédex research; a short map stays in its first place, `stageOf()`), at Level 0's
  rules with 2.5x prize money (`prizeMult`) and biomes 2-3 trimmed so Mewtwo shreds them (the user's calls after a
  playtest, 2026-10-02), then the **Crystal Depths**, the
  `secret` 4th `BIOMES` entry only Mewtwo enters (`finalBiome(starter)` in `js/data/enemies.js` is every "is this the last
  biome?" check). Mewtwo is fully powered up after Boss 2, so after the Biome 3 boss's rewards (card, relic, item) it
  falls in instead of evolving: `fallIn()` in `js/run.js` plays the Sealed Gate's `descent()` with Mewtwo's own lines (it
  senses a call from below, dives, and the shaft's crystals restore it: the full heal, StS's between-acts heal), then
  `startBiome()` brings the Depths' map and intro film up under the dark before `close()` takes the descent away. No pedestal
  or victory song until Eternamax falls. Playtest: `?descent=mewtwo` (`peekDescent()`, a throwaway run at half HP, never saved). Its 12 wilds, 3 Alphas and boss Eternatus (Gen 8: its sprite is
  PokeAPI's `other/showdown/` Gen 5-style GIF) are themed to a crystal cave and shown as Neutral or Psychic. Some carry a
  `trait` (`TRAITS` in `js/data/enemies.js`, `enemyTrait()` in `js/battle.js`, a nameplate badge): `barbs` (each attack you
  play hurts you, block first, never fatal), `analytic` (strength per Power you play), `stamina` (block per card past the
  Nth in a turn). **Eternatus is a two-bar set piece** (part C, 2026-10-02, the user's calls): its `phase2` def, Eternamax,
  rises when it faints (`finish()` hands over to `rebirth()` in `js/battle.js`: it sinks into the Well, `bossRebirth()` in
  `js/scene.js` plays the Darkest Day (C2, the user's pick: the cave goes dark, red cracks race over the roof, it splits on a
  blood-red sky with Dynamax hexagons, rock rains down, Eternamax's silhouette from its sprite comes down through the rift,
  its markings ignite, a crimson burst; `depthsMax()` / `darkestDay()`, `MAX_*` frames; the rift stays open all fight and the
  sprite drops in from above, `.emerging`), then a fresh bar scaled by `b.hpScale`, its debuffs / block / strength gone, its
  own sprite (`eternamax-front.gif`, PokeAPI's showdown 10190 at every 2nd frame), cry, music and a red `.max` glow, in the
  storm at its fiercest, `storm.fury`; a tap skips the show; risen on its own turn, rising was that turn). The storm waits
  for Eternamax (`checkStorm()`). Its moves: `kind: 'charge'` (a turn's warning, its intent shows the next move's hit) and
  `grow` (the move hits N harder each use, `enemy.grown`). Music `eternatus` / `eternamax` play `boss` until the user's
  files arrive. Playtest: `?bossfight=depths` (`&hp=0.1` shrinks both bars; Mewtwo at 300 HP; `peekFinalBoss()`, never saved).
  Every per-biome array (events, Kenmatta's HP) has a 4th value. `secret` keeps it out of `DEX_PAGES` and
  the records until reached. **Its scenery** (B2, 2026-10-02): `BIOME_ART.depths` in `js/scene.js`, no clock (one `day` look,
  `marks` skipped so nothing is graded), each place its own palette (`voids` / `rocks` / `floors` by stage), its glows
  (`crystal`, `amethyst`, `ruby`, `energy`...) in `GLOWS`. One painter (`depthsBackdrop()` / `depthsFloor()` / `depthsFront()`,
  life in `drawDepths()`): **Cave Mouth** a tunnel of rock arches, a crack of daylight fading as you go in, glowing
  mushrooms; **Crystal Halls** giant crystal columns, prism-light shafts, a mirror lake (landmarks keep to the right there);
  **Deep Core** black rock split by energy veins (`wallVeins()`), glowing floor cracks, floating boulders, a red fissure;
  **Energy Well** a bottomless pit whose energy column climbs to a vortex on the roof, five black crystal monoliths
  orbiting, cracks fanning out of the pit, an energy ring under the fight. Every crystal is `prism()` / `gemCluster()`; the
  energy in the veins and seams pulses towards the Well (`life.veins` / `life.seams`). From the Deep Core on the battle
  pad turns red (`padDeep`). Landmarks are `DEEP_MARKS` (lamp, mine cart, geode, Unown tablet, crystal arch, vent,
  obelisk, floating boulder...). Its boss prelude (`depthsWake()` / `depthsPortal()`, `CORE_AT`): the column is drawn
  down, the seams light inwards, Eternatus's five-sided core rises out of the Well and bursts (a shock ring, shards off the
  walls, the vortex spreading over the roof), then the energy floods out in a hex grid; the arena keeps the big column and
  red vortex (`wellState()`). Sounds `gate-hum`, `quake`, `eruption`, `core-surge`. Its intro film is `js/depths-intro.js`
  (`DEPTHS_INTRO`): down a crystal shaft into the cavern, its crystals lighting one by one with `crystal-0..2` chimes, a
  push towards the far Well; walk-ons for the Halls and the red Deep Core. Map: `PALETTES.depths` with `rift` (flowing
  energy), `crystal` and `geode` (crystal tips twinkle); signs `[data-biome="depths"]` in `css/screens.css`; its own
  treasure grotto (`PLACE_ART.treasure.biomes.depths`, a Master Ball chest). `map4` is the user's own song (2026-10-04,
  looped at 6.0-45.747 s, `TRACK_GAIN` 0.18).
  **The ending** (part D, 2026-10-03, the user's picks): a Mewtwo win is the **Champion of the Depths**: `winScene()` in
  `js/halloffame.js` plays its own version (`.hof-scene.depths`: a violet cavern with crystal clusters and stalactites, a
  crystal pedestal trimmed in gold, the party in violet / crystal / gold, `celebrate()`'s `psychic` palette), then
  `rollCredits()` (`js/credits.js`, `.hof-credits`: the staff roll with the cast's sprites, THE END; a tap skips to it).
  Its entry (`isDepths()`, numbered `champ`, "Depths 001") stands in the Hall of Fame and the Record Book in gold and violet
  (`.hof-row.depths`). Achievements that unlock something other than a starter are **feats** (`FEATS` in
  `js/data/achievements.js`, `checkFeats()` in `js/progress.js`, saved in `save.feats`, their own window in `unlockWindow()`,
  a "Crystal Depths" section in the Achievements window, ??? until Mewtwo is free): **Champion of the Depths** (beat
  Eternatus, `bossesDefeated[4]`: 1000 PokéCoins) and **Shiny Mewtwo** (the Depths page done; it can't be bought). The
  Depths' **Pokédex page** is `DEPTHS_PAGE` in `js/data/pokedex.js` (in `ALL_PAGES` and `DEX_NUMBER`, No.056-071, never in
  `DEX_PAGES`, so `dex.complete`, Reshiram, the Safari Zone and the Collection / Stats counts never wait on it); its tab is
  "???" until a Mewtwo run reaches the Depths (`depthsKnown()` in `js/pokedex.js`), and Eternatus's entry lists Eternamax's
  moves too. Once its feat is earned **Eternatus crosses the title sky** in the flyers' round (`nextFlyer()` in
  `js/title.js`). `?bossfight=depths` plays the whole ending without saving anything (`draftWin()`, a preview of the feat's
  window) and lends Eternatus to the title sky for that page load (`eternatusGuest()`); peeked runs no longer count for the
  Pokédex or `bossesDefeated`.
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
  `[label, text]` (its keywords, then Tide, Burn, Leech Seed, Weak, Vulnerable, Sap, Strength, Focus, Discard, X,
  Combo... found by regex over its effect keys, nested ones too), and `termTips()` is the same minus the
  keywords, for the text's `title`. `cardTips()` / `withTips()` in `js/ui.js` draw them as little parchment
  windows beside any blown-up card: battle's risen card (`placeTips()` in `js/battle.js`: beside it on
  whichever side has 190px, else stacked over it, with taps passing through), `zoomCard()`, the reward /
  Mart focus (`openFocus()`) and the pile picker (`pickFromPile()`: since 2026-10-03 a first tap picks a card and shows its boxes and the take button under the row, a second takes it); on phones (`.tip-row`, ≤720px) they stack under the card, which shrinks by
  `--tips`; wider, they hang off the card's right side (absolute), so the card itself stays centred over its button. A new mechanic only needs a line in `cardTerms()`; every term with a box is
  coloured in the card's own text and on its box's name (`colourTerms()` / `TERM_KIND` in `js/ui.js`, `.term-*` in
  `css/cards.css`: Burn orange-red, Tide blue, Leech Seed green, debuffs purple, Strength red, the rest keyword gold; StS 2's,
  the user's pick 2026-09-28); keep each box's text short (~55 characters,
  the user's call 2026-09-28: "Burn: Damage each enemy turn, then -1."), longer only when short stops explaining it: Tide says
  what it is and what spending it does (the user couldn't tell from "Builds up all fight"). Block, Draw and Heal get no box:
  their words say it (the user's call). A card that makes cards (`addCard`, however nested) gets a box per made card with its cost,
  keywords and text (`addedCards()` / `madeCardText()`: Rage, Paralysis, Poison, Cinder...; Rage's says it's a copy of itself).
  Each gameplay type has three archetypes (docs/card-design.md): Fire Burn / Reckless / Kindling, Grass Growth /
  Drain / Spores, Water Tsunami / Shell / Flow, Psychic Force / Barrier / Mind Games.
  Psychic (Part A, 2026-09-29): 20 common / 26 uncommon / 14 rare + 8 evolution cards; Psychic is neutral both ways and
  all cards use existing mechanics. Keep Mewtwo's type and all 68 cards masked as `???` in player-facing selection and
  the Index until the starter is unlocked. Mewtwo's Pressure starts each fight with 2 Focus.
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
  **Card pool expansion (roadmap 6c)**: `docs/card-design.md` is the plan (12 archetypes, ~70 cards a
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
  exhaust pile over the dimmed battle, `.pile-pick`; two taps, like TM's picker), `healDealt`, powers `rupture`, `combust` (end of your turn,
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
   fight (in `finish()`; see Items for the bot numbers); Water **Torrent**: start each fight with 2 Tide; Psychic **Pressure**:
   start each fight with 2 Focus (Mewtwo's first attack deals +2). It's the first row of the
  Bag's Relics pocket, an "Ability: X" line in the character select's panel (`#sel-ability`), an "Ability" pill in the
  starter's type colour beside the map run card's Level chip (`#run-ability`, a `.chip` like the Level chip, its colours by `data-type`; always alive with a sheen sweeping across it and a glow breathing in its colour, `abilitySheen` / `abilityGlow`), and the same pill under your battle nameplate's HP bar, left of the HP numbers (`#player-ability`,
  `showAbilityState()` in `js/battle.js`; tap for its text), whose title shows the starter's type icon (`#player-type`), like the enemy's. When it does something,
  `abilityBanner()` in `js/battle.js` slides in Gen 5's "Charmander's Blaze" window (`#ability-banner`) on
   your side for 1.9 s: Torrent and Pressure on turn 1, Blaze each time HP drops below half (`checkBlaze()` in
  `renderAll()`, again after a heal took it back over), Overgrow when it heals after a win (the faint pause
  is 1.7 s then). The rare power card `blaze`
  is named Solar Power now (same id) so the two don't share a name.
- **Types**: five types (fire/grass/water, `normal`, shown as Neutral, and `psychic`), with Neutral and Psychic x1 both ways.
  `typeMultiplier()` in `js/battle.js` is the chart; a card
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
  `js/run.js` (a won run pays 100 since 2026-09-28, was 50; a wild Pokémon whose type beats your starter's pays an
  elite's coins and ₽, `tough` / `payAs` in `afterFight()`, with a "tough match-up" line in the reward box; the user's calls); fight and win coins grow +10% per Trainer Level played (`COIN_LEVEL_BONUS`, `levelCoins()`; shown
  on the Prepare step's coins chip and the How to play coins slide). Shop catalog is `js/data/shop.js`; `js/shop.js`
  renders it. The Starting Relic Charm's relic is saved as `run.charm` and handed over on the map by `relicCharm()` in `js/run.js` (`showRelics()` with one relic and no Skip: it floats in the middle, a tap says what it does, Take it flies it into the Bag; the user's call, 2026-10-01). **Game Corner perks** (step 8, 8 in all, each shown `Lv n/m`; `perkLevel(id)` in `js/storage.js` reads
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
  `bookEntries()`): entries newest first, the Record Book's lost runs as greyed lines between them (`save.losses`, `recordLoss()`; since 2026-10-04 one opens its **loss recap**, `lossPage()`, the same page a lost run shows before its result window: the fatal move, HP over the run from `run.tally.hpTrail`, its numbers and deck); tap one for its page: plate, a grid of its numbers (old entries show "-" for what
  they lack), the Ability and relics, the items left in the Bag and the ones used (sprites; a tap shows their `title`), and
  the final deck (`fillDeck()` from `js/deckpreview.js`, each card `zoomable()`).
- **Chad Master Kenmatta** (2026-10-01): the Move Tutor can be challenged to a boss fight from his dojo (a third sign,
  on him); beating him gives his `unique` Mata-Mindset relic (+1 PP, +1 draw, +1 strength). He's fought in his own Mortal
  Kombat arena with a Dragonite medallion (`arena: 'kombat'`, `PLACE_ART.kombat`), to his own music (`KEN.music`), and
  FORTIFY YOUR MIND shouts Wong's line (a move's `sound`, played as the enemy uses it). His first defeat is an achievement
  window (the relic), his third another, and from then on every map shows his dojo's ❓ room with his face (`save.kenWins`,
  `save.kenBeaten`). See `docs/reference/events.md`.
- **Seeded rolls** (Safari Zone phase 1, 2026-10-02): every gameplay roll goes through `random()` / `randIndex()` /
  `pickOne()` / `shuffled()` in `js/rng.js`, never `Math.random` (cosmetic rolls stay on it). A Safari run
  (`run.safari`, `js/data/safari.js`) seeds a stream per biome and per room (`reseed()` in `js/run.js`); every other run
  is unseeded. A new gameplay roll that skips `js/rng.js` breaks the daily run being the same for everyone. Tests:
  `node --test` (`tests/`).
- **Catching** (Safari Zone phase 2, 2026-10-02; detail in `docs/reference/safari.md`): only in a Safari run's wild rooms,
  any turn a Throw button (`#throw-btn`) opens a ball picker (`#ball-picker`); a throw costs 1 PP and ends your turn, and its
  odds are `catchChance()` in `js/data/balls.js` (pure, `tests/catch.test.mjs`), rolled on the seed. A catch pays half the ₽
  and offers the Pokémon's signature card (`SIGNATURE_FOR` / `sig-*` cards, `safari: true`, never in `ALL_CARDS`); a new
  Safari Pokémon needs one. `save.safariDex` and `save.balls` (the Game Corner's 4th row). Rare spawns (`markRares()`) run
  off after 4 turns; Bait / Rock (`SAFARI_ONLY_CARDS`) are Safari-only rewards. The day's first try reads every perk
  through `perk()` / `dexPerk()` in `js/run.js`, which are off for it (`fairTry()`): read any new perk through them.
- **Safari Zone** (the daily run, `docs/reference/safari.md`): its **Safari Pokédex** (`js/safaridex.js`,
  `#safari-dex-dialog`) is a page per area built from `SAFARI_AREAS` (`SAFARI_DEX_PAGES`), so a Pokémon added to an area
  joins it; it opens from the Collection, the main Pokédex's Safari tab and, in a Safari run, the Pokédex button.
  **Prep window** (2026-10-02): the title's Safari Zone gem opens `#safari-prep-dialog` (`js/safariprep.js`: today's run,
  the rules, your balls, the Safari Pokédex / Leaderboard / Game Corner, then Start); a 🏆 beside the gem
  (`#title-board`) opens the leaderboard. Every ball but the Safari and Master Balls is a pack used up when thrown
  (Great / Ultra 5, the special ones 3); `migrateBalls()` turned old one-time unlocks into 10 throws.
  **Completion rewards** (2026-10-02): a page with every Pokémon caught pays 1000 PokéCoins once and doubles its rare spawns
  on replays (`rareOdds()`, never the first try); the whole Safari Pokédex unlocks Rayquaza. `creditSafari()` in
  `js/run.js`; earned stays earned in `save.safariDex.done` / `complete`, however the roster grows.
  **Its own Pokémon** (phase 4) are one line each in `js/data/safari-mons.js` (species, type, area, one of 10 role
  `TEMPLATES`, move names, Pokédex line, signature card); `PLACE` grows them with the area's place in the run. A new one
  also needs its front GIF and `SPRITE_FIT` line; `tests/safarimons.test.mjs` checks it all.
  **Leaderboard** (phase 5a, 2026-10-02): the day's first try posts once to Firestore (`safariBoard/<day>_<uid>`) through
  the cloud save's sign-in (`js/leaderboard.js`, pure part `js/data/leaderboard.js`, guarded by `firestore.rules`, which
  the user pastes into the console); every Firebase call is caught, so offline or blocked the game is unchanged.
  **Its scenery** (phase 5b): each area is a `BIOME_ART` entry built from `SAFARI_ART` in `js/scene.js` (Meadow, Forest,
  Wetland, Marsh, Peak, Desert; painted by `SAFARI_PAINT`, with the Zone's own fence, sign, rest house and tall grass over
  all six), with 4 places each (`stages` in `js/data/safari.js`), walked as one road: a trail to the horizon, the area's
  goal ahead growing nearer every floor, a different roadside landmark each floor. A Safari run asks for its area (`land()` in `js/run.js`)
  for the scene, the map's palette and the signs; detail in `docs/reference/safari.md`.
- **Journey films** (roadmap steps 10-11, 2026-10-04): between a boss's rewards and the next biome, `walkOn()` in `js/run.js`
  plays `travel()` from `js/travel.js` (not on Mewtwo's runs or in the Safari): your Pokémon (front GIF, flipped) walks a
  side-on parallax road on two low-res canvases (`#travel-scene`, z-index 945), the land turning from one biome into the
  next by where each thing stands on the road, the sky dusk → night → dawn (land graded between `GRADES`), one set piece
  mid-way. It ends dark and resolves with a `close()` called once `startBiome()` has the map and biome film up beneath.
  One `ROUTES` entry per trip: `clearing>shrine` (the Ancient Tree's roots, the Shrine's lantern stair) and `shrine>wastes`
  (three looks, `a` / `d` dried out / `b`; a rope bridge over a lava chasm that sags and sways under your Pokémon, a
  route's `deck` in `groundY()`, its `walk` slowing the steps; ash falls, the volcano rises glowing on the horizon);
  a trip without one is skipped. First-time lines once per trip, `save.travelSeen` (`{ 'shrine>wastes': true }`; an
  old save's `true` counts as the Clearing's). Early in each trip (a route's `fly`) a legendary you haven't unlocked flies
  over as a silhouette with its shadow on the road, or, with the Sealed Gate at half HP or less, sometimes Eternatus's red
  glow pulses on the horizon (`pickGuest()`, seeded by `run.tally.startedAt` and the trip). Playtest `?travel=shrine` /
  `?travel=wastes` (`&at=0.5`, `&flyer=lugia` / `eternatus` / `none`).
- **Badges** (roadmap item 17 part a, 2026-10-05): `BADGES` in `js/data/badges.js` (id, `group`, name, `icon` for part b's
  pixel art, `emoji` for text lines, `text` how to earn, `test(stats, save)` like `ACHIEVEMENTS`'), four `BADGE_GROUPS`:
  Journey (the three biome bosses, Champion, Fire / Water / Grass), Trainer Levels (Bronze 2, Silver 3, Gold 5, Master 5 with
  all three types), Secrets (Dojo, Seal, Depths `secret`, Pokédex, Safari, Streak) and New frontiers (Explorer, Tower
  25F / 50F / 100F: `locked`, never earned until their content lands). Each test reads only what the save already keeps (the
  Level legendaries, `maxLevelWinByType`, `level5WinsBy` / `level5Jackpot`, the Hall of Fame, `winsBy` by the starter's
  type), so `checkBadges()` in `js/progress.js` (pure part `newBadges(save)`) granting into `save.badges` at load (`init()`
  in `js/main.js`, silent) gives an old save everything it can prove on day one. In a run it's quiet, no window: a
  `badgeLine()` in the fight's reward box (`unlock()` in `afterFight()`; Kenmatta's Dojo Badge in his relic window, once
  `kenWins` is saved) and in the result window (`announceUnlocks()` keeps them in `run.badges`). Peeked runs grant none.
  Tests: `tests/badges.test.mjs`. **The Trainer Card** (part b, 2026-10-04): `js/trainercard.js`, the Collection's first card
  (`trainerTile()`) opening `#trainer-dialog`: the leaderboard nickname (`trainerName()`, never the sign-in's real name) or
  TRAINER, wins, Pokédex / Safari counts, gold stars, play time (`stats.playMs`: `initPlayTime()` feeds `addPlayTime()` in
  `js/storage.js`, which adds only its own minutes to the save on disk and never wakes the cloud, so a hiding page can't
  write an old save over a cloud download), the partner, and the Badge Case. Each badge is painted from `LOOK` (a shape
  polygon, three colours, a glyph) by `badgeArt()`; a new badge needs a `LOOK` line. Its colour steps up with badges
  (`cardTier()`: green, bronze 5, silver 10, gold 15, violet with the Depths Badge). Badges not in `save.badgesSeen` pop in
  the next time it opens. **Getting to it** (2026-10-04): the title's Collection / Trainer Card / Game Corner slot (`HUB` in `js/title.js`, flipped like the modes slot), the
  Bag's 5th pocket (`trainer`, `renderTrainerPocket()` in `js/run.js`), and a tap on a result window's badge line
  (`badgeItem()`); `showBadgeNews()` colours the title's Trainer Card gem and the Bag by tier and puts a gold "!" on them while a badge
  is unseen (after a fight that earns one, too). The title's last gem is a **game modes slot** (`pageSlot(MODES)` in
  `js/title.js`: Safari Zone, Sky Pillar "Coming soon"), flipped with ◀ ▶, a swipe or ← →, so new modes never lengthen
  the stack (`docs/reference/title-screen.md`).
- **The Sky Pillar** (roadmap item 18 part a, 2026-10-05; detail in `docs/reference/sky-pillar.md`, read it first): a
  100-floor climb with a weekly leaderboard, its rules in `js/data/tower.js` (shared with the bot). The week (its Monday, UTC)
  seeds every roll and picks the starter; its first try posts to `towerBoard/<week>_<uid>` without perks (`fairTry()`),
  replays and Practice (any owned starter but Mewtwo) don't. Flights of 10 floors: 9 landings of 2-3 doors, then a guardian
  (a biome boss in turn; Rayquaza on floor 100, `rayquaza-guardian`, the top: beating it wins the climb, `TOP_FLOOR`, with a
  summit version of the win scene, `draftSummit()` / `.hof-scene.summit`, never saved as a run); a guardian evolves you at 10
  and 20 and heals 30%.
  Floors 1-30 are the biomes in order, past 30 all three biomes' Pokémon at the Wastes' numbers plus `PAST_TOP` a flight.
  `run.tower` (`isTower()`, seeded streams keyed by `zone()`); part a plays each flight on the normal map (`landingMap()`
  in `js/map.js`) until part b paints the tower. It counts only for `save.tower` (`bestEver`, the week's `best`, `summits`, `bestTurns`) and the
  Tower Badges: no unlocks, gate, streak, Record Book, Stats runs or research. Opens after a won run (the title's modes
  slot, `#tower-dialog` in `js/towerprep.js`). Playtest `?tower=25` (`&hp=0.1` shrinks foes; never saved).
- **Achievements vs shop unlocks**: `js/progress.js`'s `isShopUnlock(starter)`
  (`!starter.free && !ACHIEVEMENT_FOR[starter.id]`) is the switch between
  the two unlock paths.


## Reference

The Architecture notes above are the map. The per-system detail behind them
lives in `docs/reference/`. **Before changing anything in one of these systems,
read its file first** - don't work from the summary alone, or you'll miss the
decisions recorded in there. Sessions that don't touch these systems never open
one, which is the point: it costs nothing until it's needed.

- Saved runs - `docs/reference/saved-runs.md`
- Cloud save - `docs/reference/cloud-save.md`
- Deck thinning - `docs/reference/deck-thinning.md`
- Poké Mart and Pokédollars - `docs/reference/mart.md`
- Treasure room - `docs/reference/treasure-room.md`
- ? events - `docs/reference/events.md`
- Items - `docs/reference/items.md`
- Relics - `docs/reference/relics.md`
- Battle screen layout - `docs/reference/battle-screen-layout.md`
- Map screen - `docs/reference/map-screen.md`
- Windows - `docs/reference/windows.md`
- Title screen - `docs/reference/title-screen.md`
- Safari Zone (seed, catching, balls, rare spawns, leaderboard) - `docs/reference/safari.md`
- Sky Pillar (the tower climb, its week, the tower leaderboard) - `docs/reference/sky-pillar.md`
- Top bar and start screen - `docs/reference/top-bar-and-start-screen.md`
- Pixel icons - `docs/reference/pixel-icons.md`
- Music - `docs/reference/music.md`
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

### Which app to work in

The Desktop app carries ~50k of connector tools on every request; a terminal
session carries none. That makes a terminal session roughly 5x cheaper per
turn, but it can't take screenshots. So:

- **Terminal** for balance, logic, enemies, moves, rewards, data, docs, git.
- **Desktop app** for anything the user has to *see*: UI, layout, animation,
  boss intros, events, art, sprites.
- **Don't screenshot unless the user asks for a look, or the change is
  inherently visual.** Confirm with `curl`, the console or the code first. A
  screenshot stays in the context and is re-read on every later turn, so one
  unasked-for image costs for the rest of the session. While iterating on an
  animation, check one viewport and finish before checking the rest.
- The user playtests on the live site themselves, at no usage cost. When a
  visual judgement is needed, say what you need them to look at rather than
  asking for a screenshot.

Say which one you're in at the start of the first reply, and say so again if a
session that started as code work turns visual — the user can move it rather
than lose a round trip asking. If a visual task is asked for in a terminal
session, do the code work there and tell the user the visual check needs the
Desktop app.

Every turn re-reads the whole context window, so both *how much* is in it and
*how many turns* you take cost money. A measured session (2026-10-01) ran 92
requests and re-read 8.9M tokens to finish one task, with only a quarter of that
being actual conversation. So, each session:
- **Batch.** Do everything asked in one pass. Don't stop to ask after each item
  — make the reasonable call and say what you decided. Only ask if genuinely
  blocked; each question is a full re-read of the context.
- **Don't re-read** files already read this session unless something changed.
- **Screenshot a UI change once**, when it looks finished. One viewport while
  iterating, the rest at the end — not all five on every pass.
- **Keep replies short.** No recapping back what the user just said.
- `/clear` between sub-tasks, not only between tasks.
- Per-system detail lives in `docs/reference/` (see above); read it on demand,
  not up front.
