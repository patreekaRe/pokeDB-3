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
Items (see Items below) and the Map (the map key, plus a "Look at the map" button, hidden on the map itself, that
opens `#map-dialog` from a battle or a reward: `openMapPeek()` in `js/run.js` calls `renderMap(..., { peek: box })`, a
look-only copy with nothing to tap and the map screen's own state untouched; the user's ask, 2026-09-29, to plan a route
mid-fight). Pocket tabs pick one, the ◀ ▶ header (and ← →) flips
through `POCKETS` in order, and the last pocket is remembered. It never runs past the screen: a pocket scrolls inside it (`.bag:not([hidden])`
is a column capped at the screen's height; the user couldn't read past 8 relics on a phone), and the Relics and Key
pockets have no footnote (the user's call, 2026-09-28). It's wired by
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
  a boss. The boss silhouette stays grey on the map; its cry waits until battle. After the
  existing wipe opens, `playIntro()` holds the fighters and battle UI away while
  `bossArenaPrelude()` in `js/scene.js` plays the empty arena: 3.6 s of wake, 1.1 s of handoff, each biome's sounds cued
  on its frames by `preludeSounds()`. All three are set pieces of their own (the user wanted Biomes 1 and 2 as "insanely
  epic" as the eruption, 2026-10-01). The Clearing's ancient tree wakes (`drawClearingAwakening()`): the ground
  trembles and the light drains green, sap veins climb the trunk, glowing roots tear up through the grass towards you
  flinging clods, the meadow blooms in a wave out from the tree, a leaf cyclone winds round the trunk and motes of light
  spiral into the heartwood, which beats faster with rays wheeling out; at `BLOOM_AT` it bursts open into one colossal
  turning blossom (`giantBlossom()`, pink, `BLOSSOM`) with a shockwave ring and a gust of petals blowing sideways across
  the screen (`petalGale()`), and the handoff opens flowers all over the screen in a wave out from it into the flashes; over the fight short dark roots, a third of the flowers, pulses of sap and a small heart glow stay. Sounds
  `quake` then `bloom` (`powerSurge()`). The Shrine summons its spirits (`drawShrineAwakening()`): the temple bell tolls
  at `BELL_TOLLS` (`bell`, `templeBell()`), each toll a ring rolling out from the roof; night falls over everything, the
  lanterns light in a wave down the approach and turn to blue spirit fire at the second toll, mist rolls in, wisps
  gather into the small torii of light at the door, paper wards lift out of the gravel into a cyclone round the
  courtyard, a colossal see-through torii (`ghostTorii()`) rises out of the ground framing the screen (drawn over
  everything, since a phone's sky is a sliver), and spirit fire runs along the ridge; meanwhile a great seal of spirit light
  (`spiritSeal()`: rings, an eight-point star, orbiting runes) draws itself round the hall with a flattened twin across
  the courtyard; at `SPIRIT_AT` (`spirit`) it flares, spins faster and throws fox-fires off its ring (`foxFires()`) that
  blast the wards outwards. Its handoff opens the Hall's shoji doors with the seal spinning tight round them, and the
  spirit light floods out in rippling rings before two flashes. Only the Wastes has a vertical column at its climax (the
  user's call, 2026-10-01: all three had a big beam, and each biome should end differently). The Wastes erupts instead (`drawWastesAwakening()` / `drawWastesPortal()`, 3.6 s + 1.1 s; the user wanted it
  nothing like the Clearing's glow, 2026-10-01): the picture shakes (`draw()` offsets `putImageData`), the sky reddens,
  fissures split the far wall and the rim at your feet, the lake boils and swells into a dome, then at `ERUPT_AT` it
  bursts into a lava column throwing bombs that splat on the foreground, and the column floods sideways into two white
  flashes; the cracks stay as hairlines through the fight. Sounds: synths `quake` and `eruption` in `js/audio.js`. Then the
  regular boss reveal/cry and player Poké Ball entrance run. Nothing checkpoints until `showMap()`,
  so a refresh mid-way resumes before the room. Reduced motion keeps a brief static arena pause
  and the regular Pokémon cries, but skips the scenery animation and portal handoff.

**Biome intros** (`js/biome-intro.js`, 2026-10-01, the user's call: inviting, not like the boss intros): `startBiome()`
in `js/run.js` plays `biomeIntro(biome, number)` over the map after `showMap()` (so after the checkpoint: a refresh or
Continue never replays it), then drops the biome and place signs in again. A fixed `.biome-intro` layer (z-index 940)
with two low-res canvases (4 / 5 CSS px a pixel, like the scenes): `back` (sky, clouds, far / hill / forest / meadow
layers, each painted once from a seeded PRNG and slid by the camera at its own `SPEED`) and `front` (near grass, the
tall-grass tufts hiding the Pokémon's feet, petals, the big near clouds), with real GIFs between them (`.bi-mon`, clipped
at the grass line so they pop up out of it; `.unseen` is a black silhouette until `dex.seen` has them). The beats are the
constants at the top (`TILT`, `PAN`, `POPS`, `TITLE_AT`, `END`); the title is DOM (`.bi-title`, letters dropping in,
over the goal when upright, left of it when wide). Skies are hand-painted per time (`SKIES`), the land graded with
`GRADES`. The Tree (`paintTree()`) stands on a knoll of the hills (`hillLine()`, its foot just in the grass, roots crawling down it, `paintRoots()`; before 2026-10-01 it stopped short of the hills and looked like it floated) and carries the boss arena tree's glowing hollow and moss, so it reads as the same tree; clouds keep their puffs inside the canvas, biggest in the middle (`cloudImage()`: clipped puffs looked like squares). Sounds: synths `rustle` and `biome-title`, plus the Pokémon's cries. `run()` is the shell every biome shares (page,
title, pops, walker, skip); each `INTROS` entry brings its own `scene` painter (`clearingScene()`, `shrineScene()`) and
`beats`, optionally `skies`, `sounds` and `shaded`. A biome without an entry (the Crystal Depths, so far) resolves at once.
**The Wastes'** (`wastesScene()`, 2026-10-02): a third camera move, a rush forward. It bursts out of an ash cloud (big ash
billows parting either side as the haze thins, synth `gust`) and swoops down low over the Ash Plains (`DOLLY`: the camera
drops as it flies, `K()`) towards the smoking volcano on the horizon. The ground is a Mode 7 plane redrawn every frame
(`paintGround()`: a 256-texel tiling texture from `wastesTexture()`, ash or basalt patches, pebbles, lava cracks that
shimmer, pools and rivers further in, fogged into the horizon's haze in 8 dithered steps); the rocks, dead trees, dry grass,
basalt columns and steaming vents on it are billboards projected each frame (`project()`), painted in 4 fogged versions,
with ash and embers streaking past (`motes`) and sparks rising off the cracks. The volcano (`volcanoImage()`) looms as you
rush in, its crater breathing light under a plume of smoke leaning on the wind; it huffs as the title lands (`HUFF`: a
bigger puff, a spray of sparks, a small shake, synth `rumble-far`). The Pokémon pop up from behind low rocks ahead of where
the camera stops; anything nearer than them is drawn on `front`. Place walks: Lava Fields (basalt, lava pools and a river,
the volcano 1.45x) and Volcano Slope (lava channels running at you, the cone 2.05x with three flows, more ash), your
Pokémon walking up a trodden trail (`PATH`) as the camera creeps on and the volcano huffs once.
**The Shrine's** (`shrineScene()`, 2026-10-01): a different camera move, a crane shot. It opens at the foot of a cedar and
autumn-maple hillside and rises up mossy stone steps through a tunnel of torii (`RISE`, each layer slid down at its own
`SPEED`) while stone lanterns light in pairs as they come into view, each pair with a wind chime (synths `furin-0..2`),
until the Main Hall (`paintHall()`, the boss arena's: red pillars, green copper roof, straw rope) stands on the summit above
a bank of mist, its doorway glowing and fox-fire wisps circling it, and its bell tolls far off (`bell-far`, `templeBell` at
half gain). The Pokémon pop out of shrubs beside the steps; gates and trees nearer than them are drawn again over them
(`coverC`) so they peek out from behind. Its place walks: Torii Path (`tunnel`: gates every few steps, the hall nearer) and
Inner Court (`court`: raked gravel, a flagstone walk, plaster walls either side of the hall, lanterns). Its skies are its
own misty ones (`skies`, from js/scene.js's Shrine). Reduced motion shows the last frame and the title for 3.5 s. Under the title only
the place you start in shows, big (`.bi-place`: the later ones are for the walk to show; the user's call). Pokémon the
Pokédex has met (seen, defeated or counted, `known()`) pop up as silhouettes and colour in; unmet ones stay black.
**Place intros** (same day, the user's vision for every biome: travelling towards its goal): coming back to the map from the
last room of a biome's 1st or 2nd place (won or left) plays the next place's `placeIntro(biome, stage, backSprite)` over
it (`nextPlace()` in `showMap()`, `js/run.js`, under the map's music; the user's call 2026-10-01: played on the tap into
the next room, it cut off that room's music; kept in memory only, so a refresh plays it once more), ~5 s: your Pokémon from behind walks up a dirt path
towards the goal while every layer grows about the goal's foot (`DOLLY`, nearer layers faster), and the place's name
drops in. Each place's look is the biome's `INTROS` entry's `stages[i]` (`tree` / `spread` / `mist`: the goal nearer;
`forest`, `shade`, `frame`: trunks either side and a leafy fringe, `shafts`: light through the canopy).

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

A Safari rare spawn's room has a gold ✦ over it (`.map-rare`, added in `js/map.js`; see `docs/reference/safari.md`): 22px,
with a soft glow that swells as it slowly bobs and twinkles (`rareTwinkle`), still under reduced motion.
