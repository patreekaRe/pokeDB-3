# Mewtwo, the Sealed Gate and the Crystal Depths

Moved out of CLAUDE.md on 2026-10-14 so every session loads less; the text is unchanged. Dates are when each call was made: where two notes disagree, the later one wins.

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
  its aura GIF and cry, then slides in to speak, a Gym Leader's talk in violet (`MEWTWO_LINES` in `js/gatescene.js`, `gymTalk()`'s `title` / `look: 'psychic'`; 2026-10-14, the user's ask: it's weak after the seal and needs your help); the pedestal follows, then its unlock window. Sounds `gate-hum` / `gate-crack` / `gate-shatter` are synths in
  `js/audio.js`. **Until it breaks, the gate is only ever seen there** (the user's call, 2026-10-02: seeing its progress is a reason to
  win another run): not on the title (Mewtwo never flies by either, it has no flying sprite), and the locked "???" panel
  only hints. **Once broken** (and Mewtwo unlocked) it stands open on the title's ledge (`sizeGate()` / `paintGate()` in
  `js/title.js`, `.title-gate` in `css/screens.css`): a tap swells its violet light over the screen (`.gate-opening`)
  with Mewtwo's cry, then `onGate` in `js/main.js` opens Mewtwo's Prepare step, a shortcut to the same screen as its
  Legendaries portrait (the user's ask, 2026-10-02). Playtest: `?mewtwo&gate=0`. The story is told on the way: the first time (`save.gateSeen`) the
  descent tells the chamber's lore, the gate scene a line that past victories already cracked it (if old wins were counted) and, after the hit, that every win weakens the seal and higher Trainer Levels hit
  harder; later wins say what the next Level would deal. Playtest: `?gate=NNN` shows that HP (never saved),
  `?strike=90` (with `&starter=`, `&stage=`, `&level=`, `&kind=loss`, `&first`, `&land=jungle`) plays the descent and the scene after PRESS START; a
  strike past the HP plays the break. **Once broken**, until a Mewtwo run reaches the Depths (`deepestBiome` 4), a won run
  still shakes the arena and opens the crack (in its last biome's look), but the floor holds and your Pokémon is thrown back
  by the psychic force below, a hint that only Mewtwo goes down (`kind: 'open'` in `descent()`, from `strikeGate()`; no
  strike, then the win scene; 2026-10-07, the user's ask). Playtest `?gate=0&strike=0` (`&land=`). `?lockmewtwo` undoes `?mewtwo` (relocks it, drops its shiny and a saved Mewtwo
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
  treasure grotto (`PLACE_ART.treasure.biomes.depths`, a Master Ball chest). Its map plays `seal`, the fall's song
  carrying on (its `music`, 2026-10-09, the user's call); `map4`, the user's song that was the Depths' (looped at
  6.0-45.747 s, `TRACK_GAIN` 0.18), is the Sky Pillar climb's since (`showMap()`).
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
