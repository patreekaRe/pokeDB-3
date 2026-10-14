# PokéDB roadmap

Only what's still open. Everything finished (steps 1-9, the card pool, v1.0 and Mewtwo, the Sealed Gate, the Safari
Zone, the Small asks) is in `docs/roadmap-done.md`, with its decisions, bot numbers and old session prompts; older notes
that say "the roadmap's step N" mean that file. When something here lands, move it there (a line or two is enough)
and take it out of this file, so this stays short.

Every session prompt starts with its "Run in:" line (CLAUDE.md, "Cloud or local").

## Open, ready to build

**Towns and Waystones** (the user's idea and yes, 2026-10-13). Each biome after the Clearing has a **gateway town**, walked
in 3D between the journey film and the biome's map: Clearing → boss → crossroads → journey film → **the town of the biome
ahead** → biome 2 → boss → crossroads → film → town → biome 3 → boss → Sealed Gate. In `walkOn()` (`js/run.js`) the town
comes after `travel()` and before `startBiome()`; before the roads open (`roadsOpen()`) it is still the default road's town.
The settled calls (the user's, 2026-10-13):
- **The town is the biome you're entering**, so the crossroads pick pays off at once, each road has its own town, and you
  meet that biome's Gym Leaders (`leadersOf(biome)` in `js/data/gym.js`) there before fighting them at its boss.
- **Five towns**: Shrine (a lantern village on a mountain stair, Ecruteak's), Wastes (a mining and hot-spring town at the
  volcano's foot, Lavaridge's), Sunken Ruins (a stilted fishing village over the lagoon), Thornwood (treehouses on rope
  bridges, Fortree's), Savanna (a caravan trading post by the watering hole). The Clearing is home, no town. Mewtwo's runs
  and the Safari never stop at one (no journey films there); a Depths crystal miners' camp is a maybe for later.
- **Runs stay balanced**: in a run a town gives only one small choice (one trade or one request's reward) and no healing,
  cards or relics that make a run stronger, so no bot check. The big rewards are on the home side.
- **Waystones**: each town has a broken Waystone, mended by finishing its requests over a few runs (a town's friendship,
  saved per town). A mended one lights its stone in **one ring of standing stones by the Ancient Tree** in the Clearing;
  tapping a lit stone teleports you into that town outside a run: its shop (its own furniture set from the existing
  shelves: Japanese for the Shrine, Hot Spring for the Wastes, Underwater for the Ruins, Greenhouse/Garden for Thornwood,
  Desert for the Savanna, sold only there), its request board (PokéCoins, the missions' `track()` events), its leaders to
  chat with, and a townsperson to invite to the Secret Base. All five mended: a reward to decide then.
- Townsfolk reuse the Game Corner crowd's code (`makeCrowd()` in `js/corner-crowd.js`, lines in a data file per town).

**On branch `towns` only, never pushed to `main` until the user says** (the user's call, 2026-10-13, like `secret-base`):
every session works on `towns`, gives a pinned playtest link (`rawcdn.githack.com/patreekaRe/pokeDB-3/<full hash>/index.html`),
and merges `main` into it now and then so it doesn't drift.

Sessions, in order (one each; a patch-notes line each, `?town=<biome>` to walk one straight in):
1. **Done (2026-10-13): the Shrine's Lantern Village, in a run.** `TOWNS.shrine` in `js/data/towns.js` (pure: requests,
   friendship, `tests/towns.test.mjs`), the save side `js/towns.js` (`trackTowns()` from `mission()` in `js/run.js`, whose
   ctx now carries `biome`; a beaten Gym Leader sends `mission('gym')`), `townRoom()` / `rollTrade()` / `peekTown()` in
   `js/run.js` (walkOn() checkpoints `run.town` after the journey film and shows it, Continue comes back to it; no town
   without Three.js), and `buildTown()` / `townCrowd()` in `js/event-3d.js` (kind `town`, 13 x 18: a stone road to a
   vermilion torii, the far gate, `R.exitAt`; machiya, a pagoda, stone lanterns, cedars and maples dropping leaves; the
   request board and Delibird's stall in the square; John and Jahmes off duty, a tap chatting, `R.talks`; 4 of 10 Eevee-
   family and Ecruteak folk on the crowd code, cries added). The trade is one Bag item for another of the same rarity; the
   board shows one request at a time (5, in order, counted only in the Shrine) and hands a finished one in on a later
   visit for `REQUEST_COINS` 40 and +1 friendship (`MEND_AT` 5 mends the Waystone, session 2). Leave asks first only while
   a real pick is left (`askFirst()` skips `.locked` and info-only options now). Patch-notes line in `NEXT` (cut the patch
   on merge, not on the branch). Branch `towns` (and `claude/jolly-ritchie-vdznxn`), **waiting on the user's playtest**.
   **Redone the same day as a Pokémon town** (the user's ask, with a picture of a top-down town: "I want to be able to enter
   some homes"): still 3D, from a tile map (24 x 24, then 20 x 18 the same day: "doesn't have to be this big", every house facing south, its door on the road below; then **38 x 36**, the user's call the same evening: "huge and not feel cramped", with the broken Waystone in a plaza at the middle (`waystone()` in `js/event-3d.js`, a `kind: 'waystone'` building: a tap reads it and says the friendship; mending and lighting it is session 2), 12 houses (8 locked to knock on), 7 folk about at once, the sun's shadow box following the camera (`follow`), the ground's texture scaled to fit; every later town should be this big). **Roofs and leaders at home** (the user's asks, same evening): every house a real tiled roof, `kawaraRoof()` in `js/event-3d.js` (ribbed kawara down both slopes, round tile ends along the eaves, a stacked ridge with onigawara, bargeboards and a gegyo, plaster in the gables, `gableWall()`; the old roofs' tiles only landed on their gable edges), a house you walk into gold on its ridge and a front gable with its crest (`frontGable()`, `houseCrest()`: a Poké Ball on the shop, a leader's initial in their `GYM_INK`); a Gym Leader is only home once beaten (`away` in `homeRoom()`, the home's `away` line, the room cached apart) (`map` in `TOWNS.shrine`, `tests/towns.test.mjs` checks every door,
   stand and the gate can be reached): a ring of forest (instanced, the front rows low bushes), stone roads, rows of houses
   in Pokémon roof colours, tall grass, a pagoda, the Dance Theater, the torii at the top; the camera higher (`pitch` 0.7).
   Four houses go in (`homes`, `HOMES` in `js/event-3d.js`): Delibird's Goods (the trade moved inside), John's and Jahmes's
   homes (the leaders live there now; Jahmes asleep after 11 p.m. your time) and the Dance Theater (the Kimono Girls'
   five Eeveelutions dancing). The rest knock. Headless it runs about half the frame rate of the Hot Spring room (SwiftShader,
   no phone GPU): watch it on a phone. Next: the user's playtest, then session 2.
**Live state (2026-10-14, the user's call):** the new Clearing went live on `main` as patch 1.18 with the towns **switched off** (`TOWNS_LIVE` false in `js/data/towns.js`; `?towns` turns them on to playtest; their patch lines in `TOWN_NOTES`). To ship the towns: set `TOWNS_LIVE` true and move `TOWN_NOTES` into `NEXT`.

2. **Done (2026-10-14): the Waystone ring and visiting from home**, for all five towns at once (they were all built by
   then). **The Waystone keeps its list hidden till a town is reached** (the user's call, 2026-10-14): before any town is `met`, a tap only reads one of four `RIDDLES` in turn (`sealedWaystone()` in `js/hub-3d.js`), the town list showing from the first town visited. The user's asks the same session: **the Clearing grown** (`COLS` 20 x `ROWS` 16 in `js/hub-3d.js`, seven columns on
   the right and four rows between the back and the plaza, the world anchored where the old grid's middle was, `X0` / `Z0`,
   so the back stays put), **the ring round the plaza's Poké Ball** (`STONES` from `RING` in `js/data/towns.js`, a stone a
   town on a worn circle, `RING_R` 3, none on the paths; `standingStone()`: dark, or lit in its town's colour with a rune,
   a turning crystal and a pool of light once mended), **the Nietos' house** (`NIETOS_AT`, `nietosHouse()`: walked in like a
   town home, `CLEARING` in `js/data/towns.js` / `HOMES.clearing` in `js/event-3d.js`, Law, Britt, Linc and Kangaskhan, away
   till beaten, whispering after seven) and **Kenmatta's dojo, COMING SOON** (`DOJO_AT`, `dojo()`, boarded up, a tap says so;
   a later session opens it). A lit stone walks your buddy into its town (`warpTo()`: a column of its light, then
   `visitTown()` in `js/run.js`, a throwaway run like a playtest, `isVisiting()`, the saved run untouched, the room bar's HP
   hidden, `body.town-visit`), set down by the town's now whole Waystone (`wholeWaystone()`), which (or the far gate, or
   Leave) takes you home onto that stone (`goHome()` → `cameHome()`). On a visit: requests hand in for real (the 5th mends the
   Waystone with a line), the trader sells the town's furniture shelf instead of trading (`js/town-shop.js`: 6 a UTC day,
   kept in `save.townShop`, sold out once owned; `SHOP_SHELVES`: Japanese, Hot Spring, Underwater, Greenhouse + Garden,
   Desert, taken out of the mall's stock, `TOWN_SHELVES` in `dealDay()`), and a townsperson you tap asks once a visit to
   come and live in your Secret Base (`inviteFolk()`, `save.townsfolk` keys `town:pokemon`, read by the PC's Base residents
   and the base's guests, `resident()` in `js/pc.js`).
   **Done (2026-10-14): one Waystone, not five** (the user's pick). The ring's five stones are gone: one big Waystone stands on
   the plaza's Poké Ball (`clearingWaystone()` in `js/hub-3d.js`, `START`'s tile; the towns' whole Waystone on a plinth,
   silver runes), five crystals orbiting its tip in their `RING` colours, dull until that town is mended. A tap opens its menu
   (`showWaystone()`, `.hub-card.way`: the Pokédex shell round a green LCD, mended towns with Travel, met ones n/5, the rest
   ???); your buddy starts a step in front of it (`SPAWN`) and comes home there (`goHome('waystone', town)` →
   `cameHome(from, town)`); the worn ring path stays. Player lines that said "ring of stones" now say the Waystone.
   Headless-tested (menu, Travel to Lantern Village, Leave home, no errors). Branch `towns`, waiting on the user's playtest.
   **Next**: the user playtests; then session 4 (the all-five reward) and opening Kenmatta's dojo (ask what it holds).
   **Done (2026-10-14): the Clearing laid out anew** (the user's ask, the start of a clean-up of the towns, the Clearing
   first, then the Shrine's town): spread out over a 31 x 21 grid round a paved plaza, cobbled lamp-lit avenues and a ring
   road, the way out north through the Whispering Clearing's gate, Kenmatta's dojo north-west away from the Nietos (east),
   the Ancient Tree / Secret Base north-east (kept a tree), the Mall west, a pond garden south (CLAUDE.md's The Clearing's
   layout). `?aerial` for the overview. Headless-checked: every place reachable, no errors, Halloween's dress re-placed.
   Follow-up (same day, the user's ask): the tree beside the cauldron (`TREE_TILES` [11, 2]) taken out, and the Nietos'
   name board made readable (bigger, white on deep blue, `nietosHouse()`).
   **Done (2026-10-14): the Clearing's Nietos home, pass 2** (the user's ask, branch `towns`; this is the Clearing, not
   the Shrine town): moved the home one tile south toward the east avenue/player, adjusted its occupied tiles, and rebuilt
   it as a wider family cottage with a tiled blue roof, porch, framed windows, flower boxes, chimney and Linc's sandbox.
   Kept the latest `main` home-availability logic. Browser preview at `?hubat=25,12` and `?aerial`; awaiting the user's
   visual playtest before the next layout pass.
    **Done (2026-10-14): the Clearing's marked layout, pass 3** (branch `towns`): moved the Nietos into the red lower-right
    garden, keeping their steps short of the south street; moved the Poké Mall into the yellow lower-left garden; set the
    PC into the small blue space by the plaza, facing the player square-on; and moved the Sealed Gate to the purple site
    on the west side. Removed the beds under the buildings and moved Halloween's pumpkin patch clear of the home. Next:
    the user's visual playtest of `?aerial` before another layout pass.
    **Done (2026-10-14): the Poké Mall meets the street** (branch `towns`, follow-up to pass 3): moved the Mall two tiles
    south and aligned its front doors flush with the south ring road. The player approaches from the street. Next: the user's
    visual playtest of `?aerial`.
    **Done (2026-10-14): the Nietos' house meets the street** (branch `towns`): moved it about two-thirds of a tile south
    and lined the bottom step up with the south ring road. Its approach step is on the road. Next: the user's visual playtest
    of `?aerial`.
    **Done (2026-10-14): the west avenue reaches the street and Sealed Gate** (branch `towns`): extended the road across
    the west ring road to the Sealed Gate's approach tile, connecting the avenue, ring road and Depths teleporter.
    Next: the user's visual playtest of `?aerial`.
    **Done (2026-10-14): square Sealed Gate street end** (branch `towns`): squared off the west avenue's end at the
    teleporter instead of leaving a rounded cap. Next: the user's visual playtest of `?aerial`.
    **Done (2026-10-14): align the square street end with the teleporter** (branch `towns`): extended the flat end to the
    teleporter's left edge, using the same width as its art. Next: the user's visual playtest of `?aerial`.
    **Done (2026-10-14): a buried rift at the Sealed Gate** (branch `towns`): while the teleporter is locked, violet cracks
    glow on the ground and a tap gives a mysterious hint about something pressing up from below. The actual gate replaces
    the rift when unlocked. Next: the user's visual playtest of `?aerial`.
    **Done (2026-10-14): Violet Fissure polish** (branch `towns`, user's ask): replaced the chunky neon mark with smooth,
    tapered cracks around a recessed violet core; Three.js shader flow, broken pulse rings and a few rising motes add
    motion, while reduced-motion mode holds it still. The glow is quieter and the rift sits clear of its approach. Browser
    checked at `?hubat=2,12&time=night` and `?aerial&time=night`, no console errors; waiting on the user's visual playtest.
    Feature commit `e7f4b99`; pinned playtest: <https://rawcdn.githack.com/patreekare/pokeDB-3/e7f4b99b41bd999e4272aeb51ff08a8b1582ec6d/index.html?hubat=2,12&time=night>.
    **Follow-up (2026-10-14, user's ask):** moved the fissure one tile north onto the grass above the west avenue. Browser
    checked at `?hubat=2,12&time=night` and `?aerial&time=night`, no console errors; waiting on the user's visual playtest.
    Follow-up commit `1d3bd41`; pinned playtest: <https://rawcdn.githack.com/patreekare/pokeDB-3/1d3bd4143a76e68078db958da2f4c768d7f52409/index.html?hubat=2,12&time=night>.
    **Follow-up (2026-10-14, user's ask):** removed the three streetlamps closest to the Clearing's Waystone, leaving the plaza clear around it while keeping the avenue lights. Browser-checked at `?aerial&time=day`, no console errors. Branch `towns`, commit `059ddfc`; pinned playtest: <https://rawcdn.githack.com/patreekare/pokeDB-3/059ddfcf35a646ec85b5e0ee5c11438c3264de4d/index.html?aerial&time=day>.
   **Next: the Shrine town's clean-up** (Lantern Village, `?town=shrine`). ▶ Run in: CLOUD. Prompt: "Read CLAUDE.md and
   docs/roadmap.md's Towns and Waystones entry. Clean up the Shrine's Lantern Village the way the Clearing was (ask me what
   bothers me about it first), and send an aerial view." 
3. **The other four towns**, one a session (Wastes, Ruins, Thornwood, Savanna): the same code, new art, lines, shop set
   and Waystone. **Wastes done (2026-10-13): Cinder Springs**, Lavaridge's, as big as the village (38 x 36) but laid out unlike it (the user's ask: a switchback road up the slope, in bottom left, out top right, houses on the terraces between its bends, a big spring in the middle with the Waystone on its ledge; each town should get its own shape): crags and
   dead trees for a forest, adobe houses with smoking chimneys, a bathhouse (walked in: five Pokémon soaking, `castAt`),
   open-air springs steaming, the mine head with its turning wheel and rails, a timber mine gate out, ash falling and
   embers rising; Heatmor's Forge holds the trade, Shaun and Clarence at home (Clarence live for the boys from 9 p.m.), 8
   locked houses, 10 folk (Geodude, Numel, Slugma, Torkoal, Machop, Cubone, Vulpix, Larvitar, Drilbur, Houndour; 11 cries
   added), its own 5 requests and Waystone. Built as a `style` over the village's code (CLAUDE.md's Gateway towns), so
   the next three are a style, a map and lines each. Its Waystone is broken like the village's (mending is session 2's).
   Branch `towns` (and `claude/next-town-oahwio`), waiting on the user's playtest.
   **Ruins done (2026-10-13): Driftwood Landing**, a fishing village on stilts over the lagoon (`style: 'lagoon'`), laid out
   unlike both (the user's ask: a new shape a town): a ring of boardwalk round the drowned temple's island (the Waystone at
   its middle, the request board, benches, tiki torches), spokes out to thatched huts on stilts with coloured caps, in up a
   jetty from the beach at the bottom, out through the temple's stone arch on the far shore. The ground is cut away over the
   water (`holes` in `wild()` / `shell()`: the floor's alpha), so the boardwalks stand on posts over a lit lagoon bed (the
   courtyard's flagstones and runes) under a clear rippling surface with lily pads (`lagoonWater()`, `lagoonSupports()`,
   `lagoonKinds()` in `js/event-3d.js`); jungle banks of palms (`lagoonJungle()`), moored rowboats (`y`), drowned columns
   (`|`), nets drying (`n`), the beacon on its rock (Wingull nesting), the Aquarium's glass dome (walked in: Lapras, Mantine,
   Corsola, Chinchou, Lanturn in its pools), Pat's houseboat (fairy lights, a rose in a bottle; he serenades the moon after
   10 p.m.), Kayl's house (Spooky the Purrloin and Reya the Glameow, a home's `names`), Pelipper's Bait & Tackle (the trade);
   10 locked huts, 10 folk (Wooper, Psyduck, Slowpoke, Corphish, Marill, Poliwag, Buizel, Krabby, Wingull, Staryu; 9 cries
   added), its own requests (fights, the Mart, ❓ rooms, a flawless fight, the Gym). Homes' walls can be `boards` / `aqua`.
   The towns test now knows a bench takes two tiles. Branch `towns` (and `claude/next-town-oahwio`), waiting on the user's
   playtest. **Thornwood done (2026-10-13): Highbough**, a village in the treetops (`style: 'canopy'`), laid out unlike the other
   three (the user's ask): no roads at all, round platforms on giant trunks scattered over the drop like stepping stones,
   joined by rope bridges in no pattern but the trees', in up the lift at the bottom right, the Great Tree's deck in the
   middle (the broken Waystone, the board, a ring of lanterns round the trunk, its hollow to knock on), out through the vine
   gate at the top left. The ground is cut away everywhere but the platforms, so you look down through the bridges' slats
   to the jungle floor in the mist (ferns, a stream, glow caps lit at night); treehouses of logs with leaf-shingle roofs,
   their trees going up through them into crowns that fade while you're behind them; lone giants in the drop, lifts going
   up and down. Walked in: Kecleon's Canopy Goods (the trade), Phil's (candles, Misdreavus, JONA after 11 p.m.), Ricky's
   (gaming with the boys after 10 p.m.), the glass Bloom Nursery (Bellossom, Sunflora, Cherrim, Oddish, Chikorita; Bellossom's
   cry added). 8 locked treehouses, 10 folk (Aipom, Hoothoot, Sentret, Hoppip, Seedot, Shroomish, Treecko, Teddiursa, Natu,
   Paras), its own requests (fights, ❓ rooms, an Alpha, a PP Up, the Gym) and broken Waystone. **Reworked 2026-10-14 after the
   user's playtest** ("hard to navigate for a bigger Pokémon, hard to tell where I can walk; only scary ghost Pokémon"):
   every rope bridge two tiles wide (`bridgeAxes()` in `js/event-3d.js` paints and ropes a lane by its reach), a rope
   railing round every deck edge over the drop and a pale trim inside it; a ghost town: 10 ghost folk (Gastly, Haunter,
   Duskull, Shuppet, Banette, Drifloon, Yamask, Lampent, Shedinja, Golett), Mismagius's Curio Shop for Kecleon's, the
   Withered Nursery's sleepers (Chandelure, Cofagrigus, Dusclops, Spiritomb, Gengar) on web rugs among graves, will-o'-wisps;
   16 cries added. Its furniture shelf is still Greenhouse / Garden (Spooky is the mall's; ask the user before swapping). Branch `towns` (and
   `claude/next-town-biome-layout-t5p8t9`), waiting on the user's playtest. **Savanna done (2026-10-13): Sunwell Bazaar**, a
   caravan trading post (`style: 'bazaar'`), laid out unlike the other four (the user's ask): one dusty caravan road cutting
   straight across the map on the diagonal, in at the bottom left, out through a sandstone sun gate at the top right; the
   market where it crosses the middle (the broken Waystone, the board, striped stalls, torches); the watering hole off to the
   top left, cut into the ground like the lagoon (mud bed, still water, reeds, a plank jetty, a windpump with a trough);
   round mud huts under conical thatch either side of the road, wagons drawn up bottom right, a kopje of boulders; the bush
   round it acacias, baobabs and termite mounds; dust drifting up. Walked in: Persian's Bazaar (a striped tent, the trade),
   Machew's hut (dark, a plastic katana; meditating by candle after 10 p.m.), Jerome's hut (the baby, r/GTA6 in eleven tabs;
   whispering at Reddit after 9 p.m.), the Caravanserai (Tauros, Rapidash, Zebstrika, Bouffalant, Kangaskhan). 6 locked huts
   and 2 locked wagons, 10 folk (Girafarig, Phanpy, Hippopotas, Sandile, Blitzle, Mankey, Trapinch, Doduo, Ponyta,
   Sudowoodo; 10 cries added), its own requests (fights, quick wins, the Mart, a relic, the Gym) and broken Waystone.
   `?town=savanna&home=machew&gymwins=1` walks straight into a house. Branch `towns` (and `claude/next-town-savanna-fpkg29`),
   waiting on the user's playtest. **All five towns are built**; next is session 2, the Waystone ring and visiting from home. ▶ Run in: CLOUD. Prompt: "Read CLAUDE.md and docs/roadmap.md's Towns and Waystones entry. Build the
   <biome>'s town the way the others were built, in its own new layout, then its Waystone."
**The Nietos at home** (2026-10-14, the user's ask): their house in the Clearing stays; the Nietos (and Kangaskhan) are
   home in it only once THE NIETOS' Kangaskhan is beaten at the Clearing's Gym, and that is switched off for now
   (`NIETOS_LIVE` false in `js/data/towns.js`: beaten saves find a "Back soon!" note, and they never visit the Secret Base;
   only their house shows, and their Gym fight in runs is unchanged) while the user works out more of how
   the Nietos show up. Waiting on their idea; `?nietos&gymwins=1` previews it.
   **No Gym Leader visits the Secret Base** for now either (2026-10-14, the user's ask): `LEADER_VISITS_LIVE` false in
   `js/data/gym.js` (`leaderVisitor()` returns none); `?visit` still brings one for a page load.
4. **The all-five reward** (ask the user what it is) and a Depths camp if wanted.

**Smooth card art** (the user's yes, 2026-10-12: every card's picture off pixels, a picture of the move rather than an
item pun). **Done for every card a run can meet** (2026-10-12): all of Fire, Water, Grass, Psychic and Neutral, the tokens
(Cinder / Seedling / Droplet), the status cards and the Safari's Bait / Rock, ~300 pictures drawn as SVG: `ART` in
`js/card-art.js` (the starting decks) plus one file a type, `js/card-art-fire.js` / `-water` / `-grass` / `-psychic` /
`-neutral`, on the shared brushes in `js/card-art-kit.js` (flame, blaze, puffs, fist, boot, sun, gear, thermo...). Keyed by
base id, so upgrades follow; a Safari `sig-*` card sharing a pool card's name (Fire Punch, Aqua Ring...) borrows its
picture (`namesake()`, 93 of 514). `tools/cards.html` shows every one (`?ids=`), `?pixelcards` the old art. **Next**: the
other ~420 `sig-*` cards still use their PokéSprite item (batches when wanted); **relics and items**: the user wants to
see a smooth test of them later (a handful drawn the same way, then judged) before any batch. Branch
`claude/dreamy-galileo-0o4aqc`, pushed to `main` too.

**Poké Mall hall: fountains, palms, passers-by** (the user's asks, 2026-10-12, on `main`): the one big fountain was
in the way of the Game Corner's carpet, so it's two smaller ones (`FOUNTAINS` / `FOUNTAIN_SCALE` in `js/mall-hall.js`,
a ring painted under each by `floorArt()` in `js/mall-3d.js`) either side of a carpet running straight from the doors;
the palms keep to the sides (beside Furniture and Coming soon, the front corners). The hall has Pokémon now: the Game
Corner's crowd code with options (`makeCrowd()` in `js/corner-crowd.js`: `cast`, `stations`, `wants`, `castHours`...),
`hallCrowd()` in `js/mall-3d.js`, 4 at once (2 standing at `HALL_STANDS`, 2 wandering), one swapped every 40-80 s,
a cast of 6 from `SHOPPERS` (`js/data/mall-crowd.js`, 18) dealt anew every 8 UTC hours. Next: the user playtests (how
many, how chatty, the fountains' size); move to the archive once they're happy.

**Home arcade: one game a session** (the user's call, 2026-10-12: "separate sessions"). A quick first pass of the first ten
went live in patch 1.7 (commit `7d94218` on `main`, branch `claude/dreamy-galileo-0o4aqc`): each is a prize machine at
Meowth's counter (450 coins), played in the Secret Base by a tap (`js/home-arcade.js`), every game a file on
`js/arcade-kit.js` (the shared cabinet window, Score / Best as record `arc-<id>`), its machine painted in
`js/base-furniture-rooms5.js` after `cabinet()`. None was playtested by the user yet, and the tap in the 3D base was never
tested (the cloud has no Three.js). Each session takes ONE game from a first pass to finished: the user plays it first
and says what's off, then feel (controls on a phone, speed, difficulty curve), art (sprites, backgrounds, effects, sounds),
a How to play that matches, a best-score moment, the machine's painting and 3D look in the base, and a patch-notes line.
Prompt for each: "▶ Run in: CLOUD (attach pokeDB-3). Read CLAUDE.md and docs/roadmap.md. Finish the home arcade's
<game> (<file>): ask me what I thought of it first, then polish it as the roadmap's Home arcade entry says. Test it
headless and send me a screenshot and a playtest link." Their 3D machines are done (2026-10-12): `B.arcade` / `B.whack` /
`B.pinball` in `js/base-mesh.js`, shapes in `js/base-shapes.js`, pictures in `js/arcade-art.js` (the claw and skee-ball
still the auto hull). Eight of them also stand in a row under the Game Corner's screens, free to play (`ARCADE` in `js/mall-corner.js`),
and Pong and the Maze under the two Plinko boards on the left (2026-10-12, the user's layout: the second board back,
both raised like the screens; the right wall's top four slot machines taken out; the cabinets' flicker fixed by
polygon offset and wider gaps in `js/base-mesh.js`, not yet seen on the user's phone). The claw and skee-ball aren't
in the Game Corner yet. Magikarp Fishing was replaced by Pidgey Flap and two games added (2026-10-12, the user's picks
from Psyduck Pong / Spearow Flap / Gastly Maze, Spearow made Pidgey); a first pass each, played headless. Twelve now,
in this order (the user may reorder):
**Swipe cabinets** (2026-10-12, same branch and `main`, the user's ask): Poliwag Crossing and Ekans Trail have no play
buttons (`swipe: true`, `swipeDeck()` in `js/arcade-kit.js`): a faint "swipe to play" with a gliding fingertip, and
START / EXIT as two small Game Boy pills side by side (`.ar-pill`). Next: the user playtests; say if other cabinets want it.

**Arcade marquees and the mall's frame rate** (2026-10-12, the user's ask; branch `claude/dreamy-galileo-0o4aqc`, on
`main` too): every cabinet's head is a lit marquee (`marquee()` / `MARQUEE` in `js/arcade-kit.js`: the game's Pokémon GIF
bobbing on a turning sunburst, two sets of chasing bulbs, a ribbon line over the name in gold, fitted to one line by
`fitText()`; `.arm-*` in `css/corner-games.css`, composited animations only), and the start screen's name shrinks to fit
(`banner(..., maxW)`). Frame rate: the mall's canvas at the scene's own size, never 2x (like the base), a weak device steps
down shadows then resolution (`keepUp()` / `stepDown()` in `js/mall-3d.js`, `pokedb.mall3d.low`), a place's shaders,
textures and first frame done under the curtain (`warm()`), the hall's window pieces painted after it opens; furniture
painted on CPU-backed canvases (`willReadFrequently` in `p.art()` and `finish()`: `finish()`'s pixel readback from a GPU
canvas stalled 40-95 ms a piece, now 2-5; the Furniture store opened ~5 s faster headless), the Plinko boards at 20 fps
with no mipmaps; the kit's `stamp()` paints a game's still parts once (Breakout 325 fills a frame to 31, Bowling 97 to 4,
Ekans and the Maze too). Measured headless only (SwiftShader: no phone GPU). Next: the user's phone playtest.

**Controls and frame rate pass** (patch 1.10, 2026-10-12, branch `claude/arcade-cabinets-design-yh10el`, on `main` too):
a cabinet's `stick: false` drops the joystick (Berry, Ditto, Stacker, Memory, Puzzle), `keys: { left, right }` puts big
held arrow buttons under each thumb instead (Crossing and Maze ◀ ▶ / ▲ ▼, Pong ◀ / ▶), Invaders' FIRE is a deck button;
Ponyta falls faster (`FALL`), Pidgey's trees lost their leaf clumps. Frame rate: sprites stamped from a cached first frame
(`still()`), the canvas at most 1.5x, the cabinet's CSS lights still while playing (`.playing`), Crossing's backdrop and
Puzzle's panels cached as bitmaps (4x CPU throttle headless: Pong 36→55 fps, Crossing 27→56, Puzzle 15→45). Volleyball
keeps its joystick for now (the user's call). Waiting on the user's phone playtest of these.
1. Whac-a-Diglett (`js/arcade-whack.js`, machine `whackmachine`)
2. Pidgey Flap (`js/arcade-flap.js`, `flapcabinet`)
3. Snorlax Stacker (`js/arcade-stacker.js`, `stackercabinet`)
4. Ponyta Dash (`js/arcade-runner.js`, `dashcabinet`)
5. Voltorb Memory (`js/arcade-memory.js`, `memorycabinet`)
6. Slowpoke's Claw Machine (`js/arcade-claw.js`, `slowpokeclaw`)
7. Poké Ball Skee-Ball (`js/arcade-skeeball.js`, `pokeskeeball`)
8. Pokémon Pinball (`js/arcade-pinball.js`, `pokepinball`)
9. Pikachu Volleyball (`js/arcade-volley.js`, `volleycabinet`)
10. Unown Word Search (`js/arcade-wordsearch.js`, `unowncabinet`)
11. Psyduck Pong (`js/arcade-pong.js`, `pongcabinet`)
12. Gastly Maze (`js/arcade-maze.js`, `gastlymaze`)
13. Poliwag Crossing (`js/arcade-crossing.js`, `crossingcabinet`)
14. Ekans Trail (`js/arcade-snake.js`, `ekanscabinet`)
15. Beedrill Invaders (`js/arcade-invaders.js`, `invaderscabinet`)
16. Electrode Breakout (`js/arcade-breakout.js`, `breakoutcabinet`)
17. Jigglypuff's Sing-Along (`js/arcade-rhythm.js`, `singalongcabinet`)
18. Where's Ditto? (`js/arcade-ditto.js`, `dittocabinet`)
19. Geodude Bowling (`js/arcade-bowling.js`, `bowlingcabinet`)
20. Poké Puzzle (`js/arcade-puzzle.js`, `pokepuzzle`)
13-20 were the user's yes to eight proposed ideas (2026-10-12): a first pass each, built and played headless in one
session, their cabinets on `B.arcade`, released as patch 1.8 "Arcade Night". All twenty stand in the Game Corner (the user's layout: eight each side of the counter,
Whac-a-Diglett on the left wall, Pinball on the right, the slot machines five a side as the base's 3D model); spares if more are wanted: Lunatone Rocks (Asteroids). Pachirisu Berry Catch was built 2026-10-12 (patch 1.9, `js/arcade-berry.js`) in Sing-Along's place; Sing-Along and Unown Word Search went into `RETIRED_PRIZES`. Squirtle Bubble Shooter (`js/arcade-bubble.js`) took Word Search's place the same day (the user's pick); its first playtest polish the same day (branch `claude/arcade-cabinets-design-yh10el`): a SHOOT key under the screen (`pad` in the kit; a tap only aims), an arrow for the aim (the dotted path only the first 3 shots), "Tap to swap" by the bubbles, new rows sliding down, bubbles drawn from cached sprites for the frame rate; Berry Catch's frame rate the same day (its sky, hills and tree painted once, `scenery()`, the Starf glow a painted `halo()` not shadowBlur) and, for every cabinet, the 3D base or Game Corner behind it stops drawing while one is up (`cabinetUp()` in `js/home-arcade.js`, read by `frame()` in `js/base-3d.js` / `js/mall-3d.js`; untested in the cloud, no Three.js); then (the user's ask, same day) every cabinet an arcade machine (`.ar-cab` in `css/corner-games.css`: a lit `.ar-marquee`, the screen in `.ar-bezel` with LED scores, `.ar-deck`: `joystick()` in `js/arcade-kit.js`, 8-way, sent to the game as the arrow keys, START / EXIT, the `pad` keys as round `.ar-btn`s); Bubble Shooter aims by the stick only (a tap only swaps), its launcher a dial, beam and chevrons, an underwater cave (`seabed()`); Volleyball a JUMP button. Next: the user says which other games need buttons (a `pad` line and the method it names); and every cabinet full screen (`.cg-overlay.ar`, `size()` fits the stage), no game closing on a tap outside (`openPanel()`'s `outside`, only the showcase and the guide keep it). Bubble Shooter's second playtest (2026-10-12, branch `claude/new-player-onboarding-ecwtke`): ◀ ▶ buttons in place of the joystick (`keys`; the stick leaning low sent "down", which swapped the bubbles by itself), the launcher kept drawn while a shot flies and the swap mark drawn as a path (both flickered on the phone), and the kit repaints a resized canvas at once (`paint()` in `js/arcade-kit.js`). Then (same day, same branch) its bubbles repainted after Puzzle Bobble's (`bubbleSprite()`: a dark outline, a glossy body, a type glyph embossed inside, `glyph()`, a bold shine and a rim of light), and the mall's tilt-shift blur off everywhere, the hall and shops too (`setPlace()` in `js/mall-3d.js`). Then (same day, branch `claude/pokedex-title-cry-bug-4bqe5z`, the user's screenshot of Puzzle Bobble) its foot redone: a brass launcher and gold pointer (`launcherArt()` / `pointer()`), the normal and shiny Squirtle animated (`gifFrames()` from `js/hd2d.js`) facing each other, the left one loading the next bubble from a bag (`bagArt()`, `load`), both hopping on a pop (`cheer`); a tap anywhere under the line swaps. Then (same day, branch `claude/jolly-ritchie-vdznxn`, the user's ask: clearing a board only to refill it was boring) endless levels: a cleared board is the next level, `LEVELS` in `js/arcade-bubble.js` ([rows, colours, shots a row] each; a 6th colour, Fairy, from level 7; past the last line one shot fewer a level, never under `MIN_PUSH` 2), `CLEAR` 500 x the level, a LEVEL N banner, "Lv N · Row in N" by the line; patch 1.13 cut with it. Then (2026-10-13, branch `claude/jolly-ritchie-vdznxn`, the user's pick after a look at how Puzzle Bobble does it) the endless random rows replaced by Puzzle Bobble's levels: 20 boards laid out by hand (`BOARDS` in `js/data/bubble-boards.js`: First Splash to Final Wave, 3 colours rising to 6, `push` 10 shots down to 6), nothing ever added, the ceiling itself lowering the cluster a row (`drop`, a riveted brass beam, `ceilingArt()`), the bubbles shaking the shot before, the board's name under LEVEL N; past the 20th they come round recoloured, a shot quicker a lap (never under `MIN_PUSH` 3); `tests/bubble.test.mjs` checks every bubble hangs from the ceiling. Next: the user plays it and says if the boards ramp right (a board's `push` or rows are the knobs) and whether they want more boards or a Puzzle Bobble hurry-up timer; ideas left over if more are wanted: Scyther Slice (Fruit Ninja), Spoink Bounce (Doodle Jump), Ampharos Lighthouse (Missile Command).
Polish pass across them (2026-10-12, the user's asks): every cabinet's How to play is an attract screen, the game's own
preview running on a little CRT over numbered step tiles (`helpScreen()` in `js/arcade-kit.js`, `.ar-help` in
`css/corner-games.css`), the head's Free play an LED pill (`.ar-free`); Poké Puzzle a round SWAP key over a smaller RAISE
(`SWAP` in `js/arcade-puzzle.js`), Ponyta Dash a smaller tap hop (`JUMP` 440), Gastly Maze side tunnels (`T` in `MAZE`,
`wrap()`). Weekly arcade leaderboards for those six (the user's yes, same day): `arcadeBoard/<week>_<game>_<uid>`, each player's best
of the week (the Sky Pillar's Monday), raised by any higher score (`ARCADE_GAMES` / `rankArcade()` in
`js/data/leaderboard.js`, `postArcadeScore()` / `KINDS.arcade` in `js/leaderboard.js`, posted from the kit's game over, a 🏆
key in those cabinets' heads); Squirtle Bubble Shooter joined them the same day (`bubble`). **Waiting on the user: paste the new `firestore.rules` into the Firebase console** (again since Bubble Shooter joined), or
nothing posts. Not yet tried against the real Firestore (blocked in the cloud session).
Also open: should the Furniture store's own Pinball, Claw machine and Skee-ball play too (now decoration only)? Ask.
The six casino games got real 3D models too (2026-10-12: `B.slot`, `B.cardtable`, `B.plinko`, Voltorb Flip and the quiz
on `B.arcade`), Meowth's counter sells only the 18 games (the rest `RETIRED_PRIZES`, kept by buyers), each a turning 3D
model on its screen, and the GAME CORNER sign was narrowed to clear the Pokémon screen.


**UI fixes batch** (the user's asks, 2026-10-07). One session each, all Run in: LOCAL (Desktop app, visual):
- ~~D2~~ and ~~E~~ done 2026-10-07 (see the archive). Staying cream on purpose (the user's call): battle's nameplates,
  Ability banner, intent bubbles and log, tap tips, keyword boxes, the cards' own text windows, the scenes' text boxes.
  `.btn` moves window by window, never globally (the cream `.btn` is still the default outside `.dev-window`).

**Waiting on the user: remove the smooth pilot?** The hybrid became the default on 2026-10-08 (see the archive). Still to ask:
whether to remove the smooth pilot (`?smooth`, `js/smooth-clearing.js`: one revert; the hybrid borrows its `glow()` / `dot()`, so
move those two into `js/hybrid-light.js` first). A more detailed pixel style (finer pixels, every painter redone) was talked
over and parked: a session or two a biome.

**More Settings options** (the user wants all seven, one by one, 2026-10-06; the OPTIONS screen is `js/settings.js`,
their meanings `js/prefs.js`). Run in: LOCAL for 1 and 4 (visual), CLOUD for the rest.
1. ~~Device colour~~ done 2026-10-06 (see the archive).
2. ~~Battle animations~~ done 2026-10-06 (see the archive).
3. ~~Flashing & shake~~ done 2026-10-06 (see the archive).
4. ~~Text size~~ done 2026-10-06 (see the archive).
5. ~~Nickname~~ done 2026-10-06 (see the archive).
6. **Music player**: a sound test replaying any unlocked track.
7. ~~Reset save~~ done 2026-10-06 (see the archive). The user skipped 6 for now.

The polish batch (the user wants all of it, 2026-10-03). One session each, in any order:

5. **Music hookups.** Run in: CLOUD, once the user drops files in `assets/audio/`. Find each new file's loop points
   (`LOOP_POINTS`), drop its fallback. Wired already: `eternatus`, `eternamax` (`map4` and the Sealed Gate's `seal` arrived
   2026-10-04, `mart` too). New tracks to wire if supplied: a Safari theme, a credits song and the Game Corner. Real recordings can also replace
   synths (block, stick, gate-hum / gate-crack / gate-shatter, fireworks).

The user's second pick (2026-10-03), one session each:

9. ~~Seasonal title screen~~ done 2026-10-10 (see the archive).

**Journey films** (the user's pick, 2026-10-03: "like the fall into the Depths, but travelling"). Between a boss's
evolution and the next biome's `biomeIntro()`, a short film of the trip there: your evolved Pokémon walks a side-on
parallax road while the land morphs from one biome into the next and the sky runs dusk → night → dawn, with one
crossing set piece in the middle. Steps 10-12 are done (`js/travel.js`; the archive has them).

**The user's suggested order (2026-10-05): badges, then the Sky Pillar, then branching biomes.** Each part has a CLOUD
session (rules, data, saves, bot) then a LOCAL Desktop-app session (the look). Each prompt is the whole first message.

17. **Badges** are done (parts a and b: `js/data/badges.js`, the Trainer Card in `js/trainercard.js`; see the archive).
    The title's Game Modes sub-menu has the Sky Pillar's gem (`pillarGem()` in `js/title.js`).

18. **The Sky Pillar** is done (parts a and b, 2026-10-05: the rules, then the painted tower; see
    `docs/reference/sky-pillar.md` and the archive). Still the user's: publish `firestore.rules` for the tower board and plaque.

19. **Branching biomes** is done (parts a-d, 2026-10-06/07: the crossroads, the Sunken Ruins and the Thornwood Jungle,
    each painted with its films; see the archive). The new roads open after two won runs (`roadsOpen()`, 2026-10-10; was a Level 2+ win with each type). Still the user's: hear the new synths and films on a phone.

20. **A Fire biome and a shuffled pool of roads** is done (parts a-c, 2026-10-07: the Sunscorch Savanna, the pool of three
    roads rolled at each run's start, its look and films, journey films for every pairing, its badges; see the archive).
    Still the user's: watch the new trips on a phone (`?travel=ruins&from=shrine` etc.).


21. **Sky Pillar augments** (the user's call, 2026-10-07: like League's Arena / ARAM Mayhem, "a SHIT TON of augments"
    so the tower is fun and replayable). The whole plan, rules and a first list of ~110 augments are in
    `docs/augments.md`: no Game Corner perks anywhere in the tower, one of three augments before floor 1 and after every
    guardian, Silver / Gold / Prismatic by height, 1 reroll, type-only ones (Fire must reach floor 100 sometimes; it's 0%
    in the bot today), every offer from the week's seed so the leaderboard stays even.
    - Parts a (the picks and effects) and b (the look) are done: see the archive.
    - Parts c (trade-offs, sets, badges) and its tuning (2026-10-08) are done: see the archive.
    - Part e (the five augments the bot never took, reworked) is done: see the archive. Floor 100: Fire 23%, Grass 56%, Water 41%.
    - Part d (Fire's augments, three new Fire augments, Risky Climb, the trap re-check) is done: see the archive. Grass is
      the strongest; leave it unless a playtest says otherwise.

22. **3D battles** (the user's ask, 2026-10-11: "I want to eventually use this new style for the main"). Battles look like
    today's but in 3D: the battle screen (cards, sprites, nameplates, text box, animations) stays the page's own, and
    `js/arena-3d.js` lays a 3D place under it with a fixed camera. Being built on the test branch
    **`claude/jolly-ritchie-vdznxn`**, never on `main` until the user says it goes live; every session for it starts from
    that branch and pushes only to it. Playtest at `https://raw.githack.com/patreekaRe/pokeDB-3/claude/jolly-ritchie-vdznxn/index.html`
    with `?arena=boss` (`&biome=shrine` / `wastes` / `ruins` / `thornwood` / `savanna`, `&slot=1` / `2` for a pool biome),
    `?bossfight=depths` (Eternatus), `?arena=elite` (an Alpha, any `&biome=`, the Depths too; `&stage=0-2`), `?arena=wild` (the same for a wild Pokémon); `&arena2d` shows today's pixel
    version of the same fight to compare.
    - **Done (2026-10-11):** every main biome's **boss** fights in 3D. The live pixel scene is the 3D view's background
      (`backdrop`, `#scene-bg` as a texture), so each boss's own backdrop keeps playing (the Ancient Tree's pulse, the lava,
      the tide wheel, the storm at low HP); 3D pads stand where the page draws its Pokémon (`layout()`) and follow them
      every few frames (`follow()`), so a sprite that loads late or resizes keeps its pad (the user saw a boss off its
      platform). The Clearing also lays its 3D ground, bushes, flowers and side trees up to the pixel horizon
      (`sceneHorizon()` / `sceneColour()` in `js/scene.js`); every other biome's pads take its floor's colour
      (`padKit()`). Clearing Alphas are 3D too. A boss keeps its pixel prelude, then the 3D fades in.
    - **Done (2026-10-11): b, the Alphas.** Every main biome's Alphas (Team Rocket's too, an `elite` fight) get the boss
      treatment: `arenaFor()` takes `elite` in every `MAIN` biome. `?arena=elite&biome=` takes any biome, the Depths
      too (with Mewtwo, fully powered up; `peekDepths` in `js/run.js`). Checked at 390x844 and 1280x800, every biome.
    - **Done (2026-10-11): c, wild fights.** Every main biome's wild fights get the same treatment (`arenaFor()` takes
      `fight` / `wild`; not Safari, Sky Pillar or Kenmatta). `?arena=wild&biome=` (any biome, the Depths with Mewtwo,
      `&stage=0-2`). Since a wild fight is the most common, a device under ~40 fps steps the arena down, shadows then
      resolution, remembered in `pokedb.arena3d.low` (`keepUp()` / `stepDown()`, the Secret Base's way). Checked at
      390x844 and 1280x800, every biome.
    - **Waiting on the user:** a phone playtest of the wild fights (`?arena=wild`, the Clearing first, which has the most
      3D): does any stutter? The cloud's browser renders 3D in software, so phone frame rates were never measured.
    - **Done (2026-10-11): Kenmatta's arena** (the user's yes). His fight stands on 3D stone pads before his Mortal Kombat
      courtyard (`wantsArena()` takes `def.arena` 'kombat', mounted as biome `kombat`). Since the same day (the user's ask)
      the courtyard is 3D up to the painted wall (`dressKombat()`): flagstones in the painted floor's colours, his dais
      against the wall with carpeted, gold-edged steps (his pad raised onto it, `kombatLift()`; the painted steps step
      aside while it's up, `sceneDais()` in `js/scene.js`), two braziers with flickering fire and light, embers, and the medallion as a smooth gold relief (`medallion3d()`: Dragonite traced from its own sprite, blurred and cut again so its pixel steps round off, baked into `assets/arena/` by `tools/medallion.html` since traced live it never showed on the user's iPhone; hung on the wall between the nameplate and the Pokémon, clear of the dais; the painted one steps aside, `sceneBare()`). `?arena=ken`
      (`&biome=`) walks a throwaway run straight into his fight.
    - **d. Each biome's own 3D foreground**, like the Clearing's, about a session a biome; then main. `GROUNDS` in
      `js/arena-3d.js` is one `dress*()` a biome, handed the ground's span, the fade and the placing tests by `build()`.
      - **Done (2026-10-11): the Wastes** (`dressWastes()`). Its ground takes the pixel floor's own colours row by row
        (`rowColour()`, divided by the light falling on it, `flatLight()`, so it fades into the pixel floor at the
        horizon), read again once a boss's prelude is over (`retint()`: built under it, the floor was mid-eruption), its
        haze the far floor's colour. Lava cracks are merged ribbons (`ribbons()`: scorch, molten core flowing, additive
        glow breathing), lava pools in the Lava Fields and at the Crater Rim, instanced basalt rocks and ash heaps,
        obsidian shards from the Volcano Slope on, charred snags at the sides (one merged mesh each), ash falling and
        embers rising (`drift()`), smoke off the lava, a rain of cinders in the storm. Spots are picked on screen
        (`spot()`) so a phone's narrow view gets its share; flat things keep off the middle between the Pokémon (the boss's
        lava runs across it), tall ones to the sides. Light by the hour, `WASTES_TIMES`; its pads basalt with lava seams.
        ~40 draw calls a frame (the Clearing ~300). Checked at 390x844 and 1280x800, every place, day / dusk / night.
      - Merged into `main` and live since 2026-10-11 (the user's call). Next: the Shrine, then Ruins, Thornwood, Savanna, Depths.
      Run in: CLOUD (attach `pokeDB-3` and `pokeDB-sim`). Prompt (swap the biome and its dressing each session): "Read
      CLAUDE.md and docs/roadmap.md's item 22, then give the Shrine's 3D arena its own foreground in js/arena-3d.js, a `GROUNDS`
      entry like `dressWastes()`: 3D ground from your feet up to the pixel horizon in the pixel floor's own colours,
      with the Shrine's stone (flagstones, lanterns, moss, fallen leaves, a torii post or two) round the edges, kept off
      the middle and the pads, lit by the hour; boss, Alpha and wild fights alike. Keep it cheap on a phone (instanced or
      merged meshes, the step-down still working). Check it at 390x844 and 1280x800 for every place (`&stage=0-2`,
      `&arena=boss`) with Three.js routed to a local `npm pack three@0.160.0` in Playwright, and give me raw.githack
      links." Order: Shrine, Ruins, Thornwood, Savanna, Depths.

## Ideas, not agreed yet (ask the user before building)

- Suggested 2026-10-05, not picked: shiny wild Pokémon (~1 in 100 wild fights), a "Save image" share picture of a
  win, Endless mode after Eternatus, Custom runs (switches that count for nothing), Unown letters hidden in the Depths.

- More polish suggested 2026-10-03, not picked yet: keyboard keys in battle on PC (1-0 play a card, E ends the turn),
  Android vibration on big hits (the Settings switch exists since 2026-10-06, iPhones tick since iOS 18),
  quiet background sounds for each place under the music.

- **Secret Base** (the user's idea, 2026-10-08: Gen 3's secret bases crossed with Animal Crossing). A room of your own
  to decorate: furniture bought with PokéCoins, a **daily stock** in its shop, some pieces only from badges / achievements
  / feats / Safari pages, and the Pokémon you caught in the Safari living in it, wandering and reacting to taps. Feasible
  on what's already there: the pixel room is a `PLACE_ART`-style painter (like the ? rooms), furniture is drawn in code
  like the biomes' landmarks (no sprite sheet to find: Gen 3's decorations aren't on PokeAPI), the daily stock is seeded
  by the UTC day like the Safari's (`js/rng.js`), unlocks are `test(stats, save)` lines like `BADGES`, the layout is one
  `save.base` (follows the cloud save), placing is tap-a-tile on a grid (phones, no dragging), and the Pokémon are the
  `save.safariDex` catches' front GIFs. Its way in: a Game Modes sign or a Pokédex app. Suggested parts, each a session:
  a) ~~the room, grid, placing / moving / storing, a starter set of ~15 pieces, `save.base`~~ done 2026-10-08, in 3D (the pilot below won);
  b) ~~the Furniture shop and its daily stock, prices~~ done 2026-10-08 with the first room's present and a 500-piece catalogue (`docs/roadmap-done.md`); ~~a "!" on new stock, wallpapers / floors for sale~~ done 2026-10-08 (`docs/roadmap-done.md`), ~~more kinds of piece~~ ~~(done 2026-10-08: 241 kinds, 4,212 pieces, dolls drawn in code, not from the sprites)~~; **1000 kinds, more detailed** (the user's ask, 2026-10-08): a kind is now bought once with every colour free; the user picked detailed pixel and the 241 are redrawn in it at 32 pixels a tile (`js/base-paint.js`, 2026-10-08); ~~the 1,000 kinds~~ done 2026-10-08 in five batches of themed shelves (1,008 kinds, 19,514 pieces, `js/base-furniture-rooms.js` to `-rooms5.js`; `docs/roadmap-done.md`); 44 more Pokémon dolls 2026-10-09 (60 Pokémon, 1,096 kinds, 19,602 pieces); dolls sewn as real 3D plushies and plants as a pot with crossed leaf cards 2026-10-09 (`js/base-plush3d.js`, `leafyModel()`);
  c) furniture unlocked from badges, achievements, feats and Safari pages: **the data landed first** (2026-10-09, a cloud
     session on main): `js/data/furniture.js`, 39 earned pieces, each `from` one badge / achievement / feat / Safari page,
     owned once its source is (`earnedFurniture(save)`, nothing saved), `howToEarn()` (??? for a secret source),
     `tests/furniture.test.mjs`. ~~Wired into the 3D base~~ done 2026-10-09 on `secret-base`: each is a catalogue
     kind, kept out of the daily stock, shown locked in the Shop with how to earn it (CLAUDE.md); Torchic / Treecko /
     Mudkip give their own dolls since the 44 new ones;
  d) Safari Pokémon on display: pick up to N, they wander, tap for a cry / hop / hearts, some pieces they use (a bed, a pool) (Run in: LOCAL);
  e) later, maybe: visit another trainer's base through Firestore, like the leaderboards (Run in: CLOUD).
  f) later (the user's ask, 2026-10-08): give the 3D base's tall upper wall (`dressRoom()` in `js/base-3d.js`, the wallpaper
     running up past a picture rail) a job: a **trophy shelf** up there showing your Badges, Hall of Fame wins and trophies,
     and maybe wall pieces (posters, clocks) hung higher than the 3-tile wall (Run in: CLOUD).
  Decorating (the user's ask, 2026-10-08, keep all of it): **rotate** a piece (a tap on it gives Rotate / Move / Store;
  drawn in code, a piece facing 4 ways is its front, back and one side mirrored, so 3 drawings, not 4), **wallpaper and
  floors** swapped like furniture, **rugs** under things, **small things on top** of tables and shelves (Gen 3's dolls on a
  desk: a second layer per tile), **colour variants** of a piece (a palette swap, cheap since it's painted in code), and
  maybe a **day / night light** through the window from `js/daytime.js`. Build rotate, wallpaper / floor and rugs into a);
  stacking and colour variants can be c).
  **Settled** (the user, 2026-10-09, Claude's suggested answers): **one room that grows** (it starts small, bigger rooms
  bought or earned; Gen 3's tree / cave / desert looks as wallpaper-like themes, so one painter, not three), **6 Pokémon on
  show** (more slots could be an unlock), **decoration only** (no perks: the reward is how it looks and the Pokémon
  reacting, and the Safari / Sky Pillar boards stay fair).
  **Branch rule:** Secret Base work stays on `secret-base` until the user says it goes live. A cloud session must start from
  that branch and push only to `origin secret-base`, never `main` (part c's data reached `main` by that rule, 2026-10-09).
- **Walkable 3D (HD-2D) pilot** built 2026-10-08 on `secret-base` only, not pushed (the user wants to playtest first):
  `?3d` (`js/base-3d.js`, Three.js 0.160.0 from jsDelivr) builds the `?base` room as a diorama from the same save and
  paintings (`roomArt()` / `pieceArt()` in `js/secret-base.js`), the partner's GIF frames via ImageDecoder (a live `<img>`
  without it), tap to walk (BFS round furniture), tap it for its cry, a follow camera, tilt-shift on the partner and bloom
  in one pass chain, light by `timeOfDay()` (`&time=night` pins it), `&fps` shows a counter. iPhones split GIFs with
  `js/gif-frames.js` (no ImageDecoder there). **The user's verdict (2026-10-08): 60 fps on their phone, and they want
  both, the base in 3D and the Clearing hub.** Sessions, in order, all on `secret-base`, all Run in: LOCAL (Desktop app):
  1. ~~The base in 3D for real~~ done 2026-10-08 (`docs/roadmap-done.md`): `?base` is the 3D room, decorated in place.
  2. ~~Safari Pokémon living in it~~ done 2026-10-08 (`docs/roadmap-done.md`).
  3. ~~The Clearing as a walkable hub, part a~~ done 2026-10-08 (`docs/roadmap-done.md`): `js/hub-3d.js` after PRESS
     START, the signs as Settings' Title screen: Signs.
  4. ~~The hub, part b~~ done 2026-10-08 (`docs/roadmap-done.md`): light and glows by the hour, fireflies / pollen, the
     legendaries flying over, the walk into the base and back, footsteps and the Clearing's air, the Escape Rope, the
     version tag. The boot (2026-10-08): the Clearing loads behind the shut Pokédex from the first frame, the partner walks in
     from the bottom after the power-on, and How to play comes out of and goes back into the corner handheld. Since then (the user's call, 2026-10-08) the Pokédex is no stand in the Clearing but a shut
     handheld in the bottom left corner that grows into the device over the hub and shrinks back into it (`openDevice()`'s
     `from`). Layout since (the user's calls, 2026-10-08): the Safari gate and its kiosk stand at the end of the back-left
     road (the gate set back behind the Ancient Tree since 2026-10-09, the road running on through it into the distance), a Game Corner stall on the left (`cornerStall()`: 3D and smooth, turned 45 degrees to the plaza), the Sealed Gate once broken on the right where the
     Pokédex stood. The bottom bar (2026-10-08, the user's pick) is the rooms' Pokédex bar: the place's name on the hinge's LCD, its gold pill, then Home (the corner handheld folded into it), round keys and the PokéCoins. **Next: the user playtests the branch and decides if it goes live.**
  Every session checks 30+ fps at 390x844 with `&fps`, and pushes the branch only, never main, until the user says.
  5. **The Poké Mall's shops, walked into** (the user's ask, 2026-10-08; `js/mall-3d.js`'s `FRONTS`). Each a session, all
     on `secret-base`, Run in: LOCAL (Desktop app):
     a) ~~Furniture store~~ done 2026-10-09 (`docs/roadmap-done.md`): `js/mall-furniture.js`, the west front.
     b) ~~Game Corner, walked into~~ done 2026-10-09 (`docs/roadmap-done.md`): `js/mall-corner.js`, the middle front.
     c) **The Game Corner revamp** (branch `game-corner-revamp`, merged into `main` and live since 2026-10-12, the user's call; patch 1.6 "Game Corner"). Built
        2026-10-10 to 10-12 in cloud sessions (the user has no local access); CLAUDE.md's Game Corner paragraph has the
        detail. Where it stands (2026-10-12, see the branch's last commit):
        - **Games (the user's keepers):** Voltorb Flip, Who's That Pokémon?, Slots (tap-to-stop, jackpot, Pikachu
          bonus), Plinko (12 rows, real-feeling fall), Blackjack, High-Low (their floor tables the base's 3D card tables since 2026-10-12, `B.cardtable` at 1.3x, `CARD_K` in `js/mall-corner.js`; the user's ask). **No betting since 2026-10-12** (the user's
          call, the cut-down numbers): all free, a few paying plays a game a day (`PLAYS`), 500 a day cap, 150 a game,
          an average day ~250 (`tests/corner.test.mjs`); raised later that day (the user's pick) to 10 slots, 10 Plinko, 5 each of Blackjack / High-Low / Voltorb Flip and a 7-question quiz, ~380 a day. Then (same day, the user's yes to all of it) Meowth's prize counter (6 new Game Corner pieces and
          Gen 1's prize dolls), records under every game and 8 Game Corner badges. Prize tickets for plays past the paying
          ones came and went the same day (the user's call: Plinko could be spammed): extra plays are for fun, the counter
          sells for PokéCoins (180-450, every game a prize: Blackjack, High-Low and quiz pieces added; the counter a showcase screen; every game prize playable at home, `js/home-arcade.js`, the quiz endless with a streak). Old tickets cashed in at 3 coins; the Chips meter and every "chips" line are gone,
          and Plinko's coins show only once the ball lands (branch `claude/dreamy-galileo-0o4aqc`, pushed to `main`). Then the home arcade (patch 1.7, below). A daily High-Low leaderboard came and went the same day: no leaderboards
          in the Game Corner (the user's call). Next is their playtest. Cut: Roulette, Memory Match, Gachapon (big dolls back in the Furniture store), Team
          Rocket Blast-Off. Every game has a How to play card (the "?").
        - **Meowth:** inside a U-shaped prize counter (front and both sides), its daily stamp card (5 different games) on
          the wall behind it earns a scratch card.
        - **The room:** casino carpet; back wall left two live Plinko boards spaced evenly up to the counter, right three
          equal mounted screens clear of the counter (Pokémon, Shinies, Perks; no Poké Balls; a Pokémon or shiny you don't own is a silhouette and a perk's levels are pips, "Level 1 of 3 owned", Buy Level 2, 2026-10-12; their sprites load through a
          page canvas, as iPhone drew them blank into an OffscreenCanvas); no tilt-shift blur at all; four tables (touchscreen Voltorb / Who's That behind, Blackjack /
          High-Low in front); a line of nine slot machines down each side wall (rows 2-10; the user's ask, 2026-10-12).
        - **2026-10-12 feedback pass:** the arcade leaderboard over Meowth's text made bigger (`boardScreen()`, the board 2.05
          tall); every Pokémon billboard takes its feet's depth (`feetDepth()` in `js/hd2d.js`, all 3D places), so a counter or
          table behind one no longer cuts across it; a little PC on the counter's right end with a bobbing "!" opens the Game
          Corner guide (`js/corner-guide.js`: what pays today and how much is left of the 500, the arcade and its weekly
          boards, taking games home, the stamp card, the showcases). Then a mini "!" over each paying game (slots, Plinko,
          Blackjack, High-Low, Voltorb Flip, Who's That), hopping now and down only once that game's paying plays are used up
          or its coins capped (`stillPays()` in `js/casino-pot.js`, rechecked every 3 s and after a game closes; the user's
          ask, same day). Then an hourglass on the counter's left end, opposite the guide PC, always turning: walk within 2
          tiles and a bubble over it counts down to UTC midnight, a tap walks up and Meowth says the time left and the day's
          coins (`timer` / `untilReset()` in `js/mall-corner.js`; a place's `tick(now, dt, hud)` and `leave()` in
          `js/mall-3d.js`, a game's `talkOnly`). The guide's rows say plays left for every game, the quiz "n of 5 answered",
          the stamp card "complete", a ✓ on finished ones (`puzzlesPlayed()`).
        **Asked, open:** the Pokémon screen sells only the 6 Game Corner skins (31 starters in all); offered to list the earned ones too, greyed with how to earn them, awaiting the user's word.
        **Next:** the user playtests on the live site and gives room/game feedback; work goes to `main` now. ▶ Run in: CLOUD (playtest links: `rawcdn.githack.com/patreekaRe/pokeDB-3/<full hash>/index.html?mall=corner&coins=3000`).
     d) **The east front**: a **Safari Outfitter** (Poké Balls, the Day Pass, the Safari leaderboard on its wall), picked
        with the revamp (2026-10-10), so each shop is one thing coins buy: home, runs, the Safari. The user wants it right
        after the Game Corner. Poké Balls are off the Game Corner's wall screens since 2026-10-12 (still in the Pokédex's
        Game Corner app and the Safari prep window) until it's built. ▶ Run in: CLOUD (a 3D shop like
        `js/mall-furniture.js`; the user has no local access, so check it headless and send screenshots).
- **Safari daily modifiers** ("all Pokémon are Water today", "Burn does double"), maybe tied to the clock.
- **More main-game Pokémon** (~70, per biome 3 wild, 1 elite, 1 boss). Candidates are in `docs/roadmap-done.md`'s
  Pokémon list; re-check each against the rules below before using it.

## Parked (don't start unprompted)

- Gen 6-9 starters: the sprites staged in `assets/pokemon/_incoming/` have no Grass line, and they aren't official Gen 5 sprites (the rules below).
- Catching in the main game: dropped (the user's call, 2026-09-27). Only the Safari Zone catches.
- Game Corner skins Budew, Sewaddle, Lotad, Horsea, Spheal, Tympole: the user said no. Don't re-add them.
- A Safari "zone legend" (a weekly Pokémon catchable only on the last floor): the user said no, 2026-10-03.
- Friends and messages (talked through 2026-10-07, "maybe later"; Run in: CLOUD). No free-text chat. Friends with no
  codes or links: unique nicknames (claimed in Firestore, a "Let others find me" switch), search by name, one-tap
  Follow (mutual = Friends) from search, leaderboards and suggested Rivals, a Friends tab on both boards, a Friends app
  in the device. Then, Dark Souls style: signs built from phrase parts left on map nodes (best on the seeded Safari /
  Sky Pillar, rated for coins), friends' ghosts where they lost (opens their loss recap), a daily gift item in a
  friend's Lost & Found. Maybe an Assist (a friend's partner for one fight), bot-checked. Needs sign-in.

## Waiting on the user

- **The gym's arch and back** (2026-10-13, the user's asks; on `main` and the branch): `buildGym()` / `gymBack()` in
  `js/event-3d.js`: a dark stone wall with a colonnade in place of the woods, the leader's first boss as twin stone colossi
  on tall plinths flanking the arch (`stoneBoard()`, upright), the arch's lintel GYM LEADER over their name
  (`gymPlaqueArt()`; POKéMON GYM only on the hinge's LCD), the badge in a sunburst over it, fires on the lintel, light
  shafts on the dais, a ring of runes round the court's Poké Ball and embers rising, both lit with the great fires.
  **The win's talks** (same day): the losing line slides in on the battle screen as their Pokémon falls, then the gym, where
  they slide in again with the badge line and the badge, every win since the same day (the user's call: the grab is the
  ritual; a repeat's caption says BEATEN N TIMES, `again` in `gymTalk()`). You can't walk
  while a leader talks (`freezeEvent()`). Checked headless (`?gym=britt&hp=0.02`, every line in its place). **The send-out** (same day, the user's ask): on the
  battle screen the leader slides in over anime speed lines (`speedLines()` in `js/gym.js`: only on their "Go, X!" line
  in the room, `speed: 'last'`, and this entry, `'in'`; the user's two) to say "Gym Leader X sent out
  Y!", slides out, then throws their own Poké Ball in from the right onto the boss's pad (`leaderThrow()` in
  `js/battle.js`) and it bursts out (`.ball-out`), then your ball. After the fight their gym talks (badge, re-talks) don't slide
  in, only the speech window pops up (`bubble`). **The arch revamp** (same day, the user's ask): the banners by the pillars
  are gone, and `gymArch()` builds a round arch: fluted columns on stepped bases, the plaque's lintel, eleven wedge stones in
  two shades with an ink keystone, gold trim and gem, the badge (`gymCrest()`, now at 5.2, out in front of the arch and drawn over it, `depthTest` off; its sunburst stays behind in the lunette) in a lunette that glows with the
  great fires. **The badge grab** (same day, the user's ask): after the hand-over line `badgeGet()` in `js/gym.js` darkens
  the screen but for the badge laid over the arch's (`gymBadgeAt()` / `gymBadgeShown()` in `js/event-3d.js`, the crest's
  `at()` / `show()`), glowing, the only thing a tap takes; grabbed, it leaves the arch, tumbles out spinning (two WAAPI
  flights, the landing's flash on the frames drawn) and slams down mid-screen. Since the same day (the user's ask) a tap first
  spins it ten turns on the arch like a Pokéstop (`.spinning`, `aug-reroll` whirrs, `aug-gold` as it slows), then it pops
  out; it swells up on the arch first and the turn is the picture's own CSS `rotate` (`gymStopSpin`), since the first try
  rode on the badge's `transform` and the user saw no spin on their phone, only heard it. Its sounds are sine-only synths
  (`badge-ready` while it waits, `badge-spin` following the turn, in `js/audio.js`), the user's ask: the reroll shuffle and
  Eternamax's `charge` they had sounded gritty. The leader's board stands upright, stretched by 1 / cos(PITCH) to look
  the same (`buildGym()`), since leaning back like the others put a tall leader's head (Phil's) behind the plaque. **Evolving after the badge** (same day, the user's ask): `lastWords()` in `gymRoom()` plays `evolve()` right after the badge is taken, still in the gym, swaps the evolved sprite in where it stands (`swapMate()` in `js/event-3d.js`) and the doormat's rewards skip it (`result.evolved`); untested by hand past a load of `?gym=britt`. The evolution can't be tapped through any more (`skipper()` gone from `js/evolution.js`), and the move picks wear a pulsing SKIP under the » key (`.labelled` in `showChoice()`, `learn-room` only). All shipped as patch 1.17, The Gym Badge. After it, the map's hinge got a POKéDEX shortcut (`#map-dex-btn`, in `NEXT`). Open: the user's look.

  ▶ Run in: PLAYTEST on the branch link (`?gym=britt&hp=0.05`, `&time=night`).
- **Gym Leaders** (live on `main` since 2026-10-13, patch 1.16; the full history is in the archive). Open: see the
  first-win badge land in the Badge Case and the outro straight after a real boss win (a peek gives no badge); the user's
  word on the 13 badges' looks and names. (Every leader has their own intro / beaten / won speeches.)
  **Rematch rewards** (2026-10-13, the user's picks, no plush): a 3rd win hands over the leader's signed poster (a Secret
  Base wall piece, `js/base-furniture-gym.js`), a 5th their Gold badge, and from then on one such leader a UTC day stands
  in the base till tapped, talks and walks out. Their poster / gold / visit lines are one generic set in `leader()` in
  `js/data/gym.js`: ask the user if they want each friend's own. Playtest `?gymwins=5` (for good) then `?base&visit`.

  ▶ Run in: PLAYTEST on the live site.
- **The Poké Mall's Pokédex bar** (2026-10-13, the user's ask; branch `claude/new-player-onboarding-ecwtke` and `main`): the
  Clearing's bottom bar in the hall and every shop (`.mall-bar` in `js/mall-3d.js`, the hub's `.hub-bar` classes): Home
  (the device grows out of it over the mall, `fromKey()`; `body:has(.mall3d) .collection-screen.over` lifts it over the
  mall's z-index 900), How to play, the PokéCoins (`showCoins()`, the old Furniture-only coins LCD gone) and the place's
  name (`placeSign()`; the top title hidden). Checked headless at 390x844. **Next: the user playtests it on the live site.**
- **iPad playtest of the full-screen layout** (2026-10-12, branch `claude/arcade-cabinets-design-yh10el` and `main`): the
  frame is off, the run map is a handheld in its scenery. Ask the user: in a landscape battle the PP and End Turn keys sit
  at the far screen edges (pull them in beside the hand?), and a tall iPad shows black above and below the Secret Base's
  room (zoom its walk shot in to fill?). Since then (patch 1.14, same day) the deck, map-peek and every `.dev-window` and the deck
  pickers (PP Up, Forget, Day Care) are the map's 500px handheld too, and starters stand centred on their body (`BODY_X` in
  `js/data/sprite-fit.js`, `tools/body-centre.py`). Ask: does Charmeleon look centred now, and do any windows still
  stretch? ▶ Playtest on the live site.
- Music: `assets/audio/eternatus.mp3` and `eternamax.mp3` (they borrow `boss` until then).
- Firebase: the first real cloud-save sign-in, and publishing `firestore.rules` (Firestore > Rules) to switch on the
  Safari leaderboard and the Sky Pillar's (its board and the lobby's plaque refuse reads until then). The console steps are in `docs/roadmap-done.md` (Next sessions, step 4) and
  `docs/reference/cloud-save.md`.
- Playtests on the live site: a real Mewtwo run (Eternatus's numbers, the fall into the Depths), Ken's difficulty, the
  boss intros' and biome films' sound levels; the Sky Pillar's walk and climb pacing and its guardian intros on a phone.

## Rules for adding Pokémon (still in force)

- Rough numbers only: sensible HP and moves in line with the others in its biome; tune with the bot afterwards.
- Enemy moves whose real type isn't Fire/Grass/Water get `type: 'normal'` (CLAUDE.md, Types).
- Every "Normal" slot is a **pure Normal-type** Pokémon, so none has a hidden extra weakness. Fire/Grass/Water picks avoid
  second types that change their match-ups (no Rock/Ground Fire Pokémon). Elites and bosses are pure Normal.
- Each Pokémon appears in exactly one biome; none are starter lines or used elsewhere (Chansey, Kecleon...).
- A new Pokémon needs its Gen 5 animated front GIF (`assets/pokemon/<id>-front.gif`, PokeAPI black-white animated), its
  cry (`assets/audio/cries/` + `CRIES` in `js/audio.js`; PokeAPI's `cries/pokemon/latest/<dex>.ogg` as mono 64 kbps MP3
  at -13 LUFS, CLAUDE.md), a `js/data/sprite-fit.js` entry and its `ENEMY_DEFS` entry. A Safari Pokémon follows
  `docs/reference/safari.md` instead.
- Removing one: also update Team Rocket's `team` lists in `js/data/events.js`, and bump `RUN_SAVE_VERSION` in
  `js/run.js` (saved maps hold `enemyId`s).
- **Only official Gen 5 sprites** (PokeAPI black-white animated), never fan-made Gen 6+ ones such as Showdown's (the user's
  call, 2026-10-07; Eternatus / Eternamax are the one exception). Every Gen 1-5 species is now in the main game or the Safari,
  so a future biome takes the Safari's Gen 1-5 Pokémon, **shared** like the Sunken Ruins' and Thornwood's: a main-biome def
  with the slot's numbers under the species id (it wins over `safariMonDef()`, keeping the Safari line as `safariLine`), the
  `SAFARI_MONS` line kept for its area and signature card, plus a cry. It can't also be in a default-road biome.
- **Fire is scarce**: every Gen 1-5 Fire Pokémon is already in the game. The Sunscorch Savanna took Ponyta, Magby, Ninetales,
  Arcanine, Houndoom and Simisear; still free in the Safari only: Larvesta, Magmortar, Darmanitan, Chandelure (rare spawns),
  Lampent, and Numel / Camerupt / Magcargo (Ground / Rock, so not for a Fire slot).
