# PokéDB roadmap

Only what's still open. Everything finished (steps 1-9, the card pool, v1.0 and Mewtwo, the Sealed Gate, the Safari
Zone, the Small asks) is in `docs/roadmap-done.md`, with its decisions, bot numbers and old session prompts; older notes
that say "the roadmap's step N" mean that file. When something here lands, move it there (a line or two is enough)
and take it out of this file, so this stays short.

Every session prompt starts with its "Run in:" line (CLAUDE.md, "Cloud or local").

## Open, ready to build

**▶ Run in: CLOUD. Safari shinies: catching, Sparkle levels and the Shiny Exchange** (the user's asks, 2026-10-18;
agreed on the mock https://claude.ai/artifact/9uB1Mu3pG2C6WLFQRQctQy, boards 1-7). Decided:
- **Shiny catching**, look only: any wild in a Safari room is shiny at `SHINY_ODDS` (1 in 150), rares too; the same
  fight, HP, moves and catch odds, so the roll is cosmetic (`Math.random`, off the daily seed: the run and leaderboard
  stay the same for everyone). It comes out in the starters' ✨ burst (`shinySparkle()` in `js/battle.js`) under a gold
  "A SHINY X APPEARED!" banner and sparkles all fight; the ball's shakes trail gold. Knocked out, it's gone. Caught, the
  GOTCHA box says NEW SHINY (and fills its Safari Pokédex page if new), or raises its Sparkle if owned.
- **Sparkle** ★1-★5 per owned Safari shiny (a duplicate +1). Shown on its signature card (★1 shiny art, ★2 a burst when
  played, ★3 a glowing edge, ★4 sparkles over the art, ★5 a gold frame and foil, under `calmFx()`), the catch box, the
  Safari Pokédex and its Secret Base resident. Wild Pokémon stay their normal colours whatever you own.
- **The Shiny Exchange**: a kiosk on the Outfitter's floor right of the Day Pass dais (tile 13,8), facing the door, no
  taller than the booth; its LED screen cycles the Safari shinies (a shadow until caught); a capsule tray at its base.
  Its window (dark hi-tech, not the Pokédex look): six biome banners, each a capsule machine of the shinies you've
  caught. Coins only pull, never buy outright (the user's call): 150 a pull, x10 for 1,500 always holding a gold one.
  Duplicates allowed (a duplicate is +1 Sparkle and 2 Lucky Stars, 3 past ★5; about 1 plain capsule in 3 is a shiny you
  don't own yet). A gold capsule is a rare (8%, +4% each plain one, back to 8% after a gold). Every capsule is a Lucky
  Star; 10 pick any caught shiny free (a prism capsule). The reveal: the capsule drops in the tray (a gold one shows
  plain, then turns gold), a tap opens it (rays, stars), the shadow holds (a gold one shakes), a flash, the shiny.
  Capsules are smooth SVG in the window (no new GL context); the tray's one is a sphere in the lodge's own scene.
  Make them look cool (the user's only ask; the design is session 2's call): start from the mock's glossy capsule
  (biome colour, gold, prism; pearl base, chrome band and button), and push it: a see-through top with sparkles
  drifting inside, a rim light in its colour, a slow idle turn in the tray, a crack of light along the band before it
  opens. Animate only transform and opacity, no animated blur or masks, and all of it off under `calmFx()`.
- Sprites: every Safari Pokémon (514, all Gen 1-5) has PokeAPI's black-white animated shiny, the source of the normal
  ones; numbers from `raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/pokemon.csv` (pokeapi.co is blocked).

Three sessions, in order. **Session 1 done 2026-10-18, on `main`** (patch 1.26): the 514 shiny GIFs, `save.safariShinies`,
the roll, the battle's entrance, banner, twinkles, gold shakes and catch box, the signature card's Sparkle looks; how it
works is `docs/reference/safari.md`'s "Wild shinies and Sparkle". The user plays a Safari run with `?wildshiny` (every
wild shiny, a catch saves nothing) and looks at the cards with `?sparkle=1` to `?sparkle=5`, and says what to change.
**Session 2 done 2026-10-18, on `main`**: the Shiny Exchange kiosk right of the Day Pass dais (LED screen, tray
capsule), its window, the pulls and the reveal; how it works is `docs/reference/hub-base-mall.md`'s Safari Outfitter part
("The Shiny Exchange"), the rules `js/data/exchange.js` (`tests/exchange.test.mjs`). The user tries it at
`?mall=outfitter&ribbon&coins=5000&safaridex` (every Safari Pokémon counted caught) and says what to change; one call to
check with them: `NEW_ODDS` (1 in 3 plain capsules new) means a machine where you own one shiny gives that one again and
again (a pull of ten gave six Wurmple headless), so they may want it as a floor instead (new at least 1 in 3, else
any caught one at random). Next, session 3:

> Run in: CLOUD. Read CLAUDE.md, docs/reference/safari.md's Safari Pokédex part, hub-base-mall.md's residents and the
> Ranger Task Board, and this roadmap entry. Session 3, shinies everywhere else: the Safari Pokédex shows owned shinies
> and their Sparkle (a shiny toggle on a page), Secret Base residents come out shiny, Ranger tasks for shiny catches,
> the Trainer Card's count and a ✨ on the day's leaderboard. Check headless, a patch-notes line, move this entry to
> docs/roadmap-done.md, push to main and give me the githack link.

**▶ PLAYTEST ON THE LIVE SITE. The towns' and the Clearing's draw calls: done, waiting on the user's phone check** (all five towns merged,
2026-10-17 / 18; numbers in `docs/roadmap-done.md` and `docs/reference/towns.md`'s "Merged buildings"). On a phone, each of
`?town=ruins&towns`, `thornwood`, `savanna`, `shrine`, `wastes` (`&gymwins=1` for the leaders' homes): smoother, nothing
sunk, bent or gapped, banners and flags still sway, roofs still fade behind you. The Clearing too (2026-10-18, ~459 -> ~243 a frame,
`mergeStill()`; `docs/reference/hub-base-mall.md`): on a phone, the walls and roofs whole, the cauldron's fire flickering,
every place still tapped. Not queued, the user's call: the towns' ground extras (Cinder Springs' lava field, Driftwood's
rowboats and jungle). `tools/draw-probe.mjs` measures a place and walks into every door.

**Furniture expansion: the plan, session by session** (the user's ask, 2026-10-16: a catalogue as big as Animal
Crossing's; the user picked all of what's below, in this order). The list is `docs/furniture-expansion.md`, and how a
set is built (the helpers' brief, budgets, the check) is its "Building a set" section. Done so far: every kind
hand-built, the seasonal and yard sets (237 kinds, 1,464 in all), the statues as their sprites, and session a, the six Pokémon
rooms and the Present's model (2026-10-17, 150 kinds, 1,645 in all), session b, five more Pokémon sets (2026-10-17, 127
kinds, 1,772 in all), session c, Day Care, partner care, figurines and 60 more dolls (2026-10-17, 140 kinds, 1,912 in
all), session d, the first five furniture series (2026-10-17, 125 kinds, 2,037 in all), session e, the next five (2026-10-17,
125 kinds, 2,162 in all), session f, Cherry blossom, Maple leaf, Acorn and Mushroom (2026-10-17, 100 kinds, 2,262 in all), session g,
Wooden block, Throwback, Ranch and Iron garden (2026-10-17, 100 kinds, 2,362 in all), session h, Bamboo, Stone zen,
Constellations and Desert caravan (2026-10-17, 100 kinds, 2,462 in all), session i, the first five room types (2026-10-17,
125 kinds, 2,587 in all), session j, the next five (2026-10-17, 125 kinds, 2,712 in all), session k, four more (2026-10-17, 100 kinds, 2,812 in all), and session l, the last four (2026-10-17, 100
kinds, 2,912 in all; all twelve in `docs/roadmap-done.md`).
Waiting on the user's playtest of those (`?holiday=valentine` etc. on the Furniture store, `?yard&allfurniture`,
`?mall=3f`), and of the Pokémon rooms and session b's sets (`?base&allfurniture`, or `?mall=furniture&stock=pikabed,pbmaster,mustyrantrum,constage,lgchampseat,rktballoon`), and of session c's
(`?mall=furniture&stock=dccrib,dcponyta,pcgroomtable,pcbigbed,figcharmander,figlugia,bigespeondoll,biglitwickdoll`), and of session d's
(`?mall=furniture&stock=antqbed,rtnpeacock,cabinstove,iwlocker,impgong,impdragon`; try the stove's and the iron stove's fire tap), and of session e's
(`?mall=furniture&stock=dnrjukebox,dnrbooth,cutebed,elgspinet,merbed,merfountain`; the Golden set is never sold:
`?base&allfurniture` lends it, and its pieces say "Earn N achievements" in the base's Shop), and of session f's
(`?mall=furniture&stock=blsmbed,blsmarch,mplbed,mplscreen,acrnwardrobe,acrnstash,shrmbed,shrmshiinotic`; Maple leaf is on the
stands this October by itself, Cherry blossom with `?holiday=sakura`), and of session g's
(`?mall=furniture&stock=blkbed,blkditto,thbtv,thbboombox,rnchbed,rnchsaddle`; Iron garden is outdoor: `?yard&allfurniture`,
or Smeargle's catalogue's Iron garden tab with a yard), and of session h's
(`?mall=furniture&stock=bmbbed,bmbgrove,cstorrery,cstprojector,crvbed,crvspice`; Stone zen is outdoor: `?yard&allfurniture`,
or Smeargle's catalogue's Zen tab with a yard), and of session i's
(`?mall=furniture&stock=hspbed,bstrange,bakcase,sshconveyor,rmnyatai,rmnsnorlax`; try the bed's heal, the oven and fridge
doors, the ticket machines), and of session j's
(`?mall=furniture&stock=pzroven,pzrlickitung,crsfridge,crscrane,lndwasher,lndrotom,slnpole,slngroom,grgporygon,grgtoolchest`;
tap the oven, the fridge and washer doors, the barber pole, the Porygon cart), and of session k's
(`?mall=furniture&stock=crfeasel,crfsewing,gmrdesk,gmrtv,rcsbooth,rcsconsole,cnmscreen,cnmpopcorn,cnmditto`; try the live
screens, the popcorn machine, the booth's note, at night the gamer room's glow), and of session l's
(`?mall=furniture&stock=htldesk,htlrevolving,htlsafe,sklhearth,sklgondola,skldelibird,hntbookcase,hntseance,hntvanity,crzbunk,crztrunk,crzbinnacle`;
tap the revolving door, the safe, the bookcase (a hidden passage), the trunk, the bust that turns to watch you). Each session builds its sets with one helper (Agent) a set or two, in parallel, then checks the whole
catalogue, sends picture sheets (the user asks for them), and pushes to `main`. Watch the usage limit: seven helpers
at once hit it on 2026-10-16; five is safer.
- **a. Done 2026-10-17, on `main`**: the six Pokémon rooms and the Present's model (`docs/roadmap-done.md`).
- **b. Done 2026-10-17, on `main`**: the Poké Ball collection (27), Museum, Contest Hall, Pokémon League and Rocket
  hideout (`docs/roadmap-done.md`).
- **c. Done 2026-10-17, on `main`**: Day Care, Partner care, 30 figurines and 60 more dolls (`docs/roadmap-done.md`).
- **d. Done 2026-10-17, on `main`**: the Antique, Rattan, Log cabin, Ironwood and Imperial series (`docs/roadmap-done.md`).
- **e. Done 2026-10-17, on `main`**: the Diner, Cute, Elegant, Golden and Mermaid series (`docs/roadmap-done.md`).
- **f. Done 2026-10-17, on `main`**: Cherry blossom and Maple leaf (sold only in April / October), Acorn and Mushroom
  (`docs/roadmap-done.md`).
- **g. Done 2026-10-17, on `main`**: Wooden block, Throwback, Ranch and Iron garden (outdoor, its own tab in Smeargle's
  catalogue) (`docs/roadmap-done.md`).
- **h. Done 2026-10-17, on `main`**: Bamboo, Stone zen (outdoor, a Zen tab in Smeargle's catalogue), Constellations and
  Desert caravan (`docs/roadmap-done.md`).
- **i. Done 2026-10-17, on `main`**: the first five room types, Hospital ward, Bistro kitchen, Bakery, Sushi bar and
  Ramen shop (`docs/roadmap-done.md`).
- **j. Done 2026-10-17, on `main`**: Pizzeria, Corner shop, Laundromat, Salon and Garage (`docs/roadmap-done.md`).
- **k. Done 2026-10-17, on `main`**: Craft and sewing room, Gamer room, Recording studio and Cinema (`docs/roadmap-done.md`).
- **l. Done 2026-10-17, on `main`**: Hotel lobby, Ski lodge, Haunted mansion and Cruise cabin, the last room types
  (`docs/roadmap-done.md`).
- **m. The ceiling layer** (~50 pieces): a new `layer: 'ceiling'` hung from the room's ceiling (placing, the tray, the
  store's display, saving), then its pieces: ceiling lamps, chandeliers, fans, hanging plants, mobiles, lanterns, a
  disco ball, bunting. Read `docs/reference/hub-base-mall.md` on how wall pieces were added first.
Every finished session moves its line to `docs/roadmap-done.md` and writes the next session's prompt here.
Next session's prompt (session m):
> Run in: CLOUD. Read CLAUDE.md, the roadmap's "Furniture expansion" entry, docs/furniture-expansion.md (its "Building a
> set" section is the helpers' brief) and docs/reference/hub-base-mall.md on how wall pieces were added. Build session m,
> the ceiling layer: first `layer: 'ceiling'` myself (placing a piece hung from the room's ceiling, the tray, the store's
> display, saving and loading, the 2D room), checked headless with no console errors; then its ~50 pieces (ceiling lamps,
> chandeliers, fans, hanging plants, mobiles, paper lanterns, a disco ball, bunting), one helper a group (at most four at
> once). Check every kind with tools/model-check.mjs, send me picture sheets, update the roadmap and push to main.

**Kenmatta's dojo: all 20 trials in** (2026-10-15, docs/roadmap-done.md). Trials 15-20 are on branch
`claude/kenmatta-trials-9-14-dojo-ffy0jk` and `main`, waiting on the user's playtest (`?dojo&trials` opens every trial on any save). Nothing left to build here unless the user wants more.

**The Secret Base's backyard** (the user's idea and picks, 2026-10-14). An outdoor lot behind the Ancient Tree, through a
back door of the base. The settled calls: **bought on the PC's HOUSE UPGRADES blueprint** (a green outdoor plot behind
the main room, ~1,000 PokéCoins, like `ROOM_PRICE`'s rooms in `js/data/house.js` / `js/pc.js`'s `blueprint()`), **one
plot that grows** (starts ~12x8, a bigger yard a later blueprint buy, like `BIG_PRICE`), and it holds **outdoor furniture,
roaming Pokémon and a berry garden** (fishing not picked). Decoration only, no run perks (the base's rule), except the garden since part g. Read
`docs/reference/hub-base-mall.md` first. Sessions, in order, all ▶ Run in: LOCAL (Desktop app, visual):
  a) Done 2026-10-14, on `main` (docs/roadmap-done.md; how it works in docs/reference/hub-base-mall.md's Backyard).
  b) Done 2026-10-14, on `main`: 16 outdoor kinds, Smeargle's garden catalogue (docs/roadmap-done.md).
  c) Done 2026-10-14, on `main`: the 6 on show let out from the yard's Pokémon tab; swim, swing, sit (docs/roadmap-done.md).
     Not yet seen in a browser: playtest `?yard&guests` with a swing set and pond out (`?base&yard` opens the main
     room: `?base` is read first).
  d) Done 2026-10-14, on `main`: berry plots in Smeargle's catalogue, five berries, coins capped at 100 a day, a basket
     for each berry's first picking (docs/roadmap-done.md). A real tap on a plot not yet tried (the hidden pane ran no frames).
  e) Done 2026-10-15, on `main`: the bigger yard, 16x11 for 1,000 on the blueprint (docs/roadmap-done.md). Playtest
     `?yard=big` (or buy it: tap the owned yard on HOUSE UPGRADES).
  f) Done 2026-10-15, on `main` (the user's ask): the way in is a garden arch in the Clearing beside the Ancient Tree,
     brambled and padlocked till the yard is bought; no back door any more (docs/roadmap-done.md). Waiting on the user's
     look: `?hubat=27,4&coins=2000` with a Secret Base owned, Unlock, walk in and back out.
  g) Done 2026-10-15, on `main` (the user's ask; it lifts "decoration only" for the garden): Smeargle's slide-in yard
     intro (and a free plot), watering, picked berries into the Satchel (sell spares), the Garden window, and Kurt's
     two repeatable shelves, held berries and a run kit; the Prepare screen packs a Berry Pouch of 3 (one held, another
     put on from the Bag once a biome after one is eaten) and one kit item
     and Kurt, the battle and the map each explain held berries once (docs/roadmap-done.md). 2026-10-16: a pinned
     "▼ Berry Pouch · Run kit" tab on Prepare while they're below the panel's fold (the user's worry no one sees them).
     (docs/roadmap-done.md). Not yet seen on a phone: `?yard` (intro, Garden button) and `?satchel` at Kurt's. Ideas
     left: a Pokédex Garden app with timers, Pokémon in the yard tending plots.

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
   family and Ecruteak folk on the crowd code, cries added). The trade is one Bag item for another of the same rarity (since 2026-10-15 picked in a window, `js/town-trade.js`; archive); the
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
**Live state (2026-10-15, the user's call): the towns are LIVE** (`TOWNS_LIVE` true in `js/data/towns.js`), shipped as patch 1.20, The Waystones, with the questlines, the Satchel and Quests apps, Kurt's Workshop, the Nietos' questline and Mewtwo's Sealed Weakness and Depths camp (`TOWN_NOTES` condensed into it; `IN_THE_GAME` has a towns line and 164 badges). `tests/camp.test.mjs` now checks the live weakness. Open: the user's own playtests below still stand as feedback rounds, not blockers. Every town has the Clearing's curve since 2026-10-14. Since 2026-10-14 a visit goes home only by the Waystone, and walks into your saved run when it stands in that town's biome (`docs/roadmap-done.md`).

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
   hidden, `body.town-visit`), set down by the town's now whole Waystone (`wholeWaystone()`) in the same column of light (`townWarp()` in
   `js/event-3d.js`), which (or the far gate, or Leave) lifts you up in it and home onto that stone (`goHome()` → `cameHome()`). On a visit: requests hand in for real (the 5th mends the
   Waystone with a line), the trader sells the town's furniture shelf instead of trading (`js/town-shop.js`: 6 a UTC day,
   kept in `save.townShop`, sold out once owned; `SHOP_SHELVES`: Japanese, Hot Spring, Underwater, Greenhouse + Garden,
   Desert, taken out of the mall's stock, `TOWN_SHELVES` in `dealDay()`). (Inviting townsfolk to live in the Secret Base was cut
   2026-10-15, the user's call: it overlapped Safari catches, which stay the only way to fill the base.)
   **Done (2026-10-14): one Waystone, not five** (the user's pick). The ring's five stones are gone: one big Waystone stands on
   the plaza's Poké Ball (`clearingWaystone()` in `js/hub-3d.js`, `START`'s tile; the towns' whole Waystone on a plinth,
   silver runes), five crystals orbiting its tip in their `RING` colours, dull until that town is mended. A tap opens its menu
   (`showWaystone()`, `.hub-card.way`: the Pokédex shell round a green LCD, mended towns with Travel, met ones n/5, the rest
   ???); your buddy starts a step in front of it (`SPAWN`) and comes home there (`goHome('waystone', town)` →
   `cameHome(from, town)`); the worn ring path stays. Player lines that said "ring of stones" now say the Waystone.
   Headless-tested (menu, Travel to Lantern Village, Leave home, no errors). Branch `towns`, waiting on the user's playtest.
   **Next**: the user playtests; then session 4 (the all-five reward) and opening Kenmatta's dojo (settled below).
   **Done (2026-10-14): the Clearing laid out anew** (the user's ask, the start of a clean-up of the towns, the Clearing
   first, then the Shrine's town): spread out over a 31 x 21 grid round a paved plaza, cobbled lamp-lit avenues and a ring
   road, the way out north through the Whispering Clearing's gate, Kenmatta's dojo north-west away from the Nietos (east),
   the Ancient Tree / Secret Base north-east (kept a tree), the Mall west, a pond garden south (CLAUDE.md's The Clearing's
   layout). `?aerial` for the overview. Headless-checked: every place reachable, no errors, Halloween's dress re-placed.
   Follow-up (same day, the user's ask): the tree beside the cauldron (`TREE_TILES` [11, 2]) taken out, and the Nietos'
   name board made readable (bigger, white on deep blue, `nietosHouse()`).
   Follow-up (same day, the user's drawing): the Clearing grown south to 31 x 26, the plaza and everything south of the
   north ring road a row lower (a longer north avenue), the pond moved down past the ring road onto a low road from the
   ring road's sides (`POND`), its two lamps taken out. Then (the user: the old road was meant to move, not stay) the
   road the mall and the Nietos' house faced taken out and both moved down three rows, their doorsteps on the low road
   (`MALL_TILE` [8, 18], `NIETOS_AT` [24, 17]). Headless-checked, no errors; waiting on the user's look.
   **Done (2026-10-14): the Nietos' house a storybook cottage** (the user: "more aesthetic than a stupid bland house"):
   painted clapboard, scalloped shingles, porch, curtains, chimney smoke, picket garden, washing line, pram (`cottageArt()`,
   `NIETOS_YARD`, `mergeStatic()`; docs/reference/hub-base-mall.md). On `main`, waiting on the user's look.
   **Done (2026-10-14): the Clearing's gate made grander** (the user: "cleaner, more extravagant and noticeable"): a bigger
   shrine gate with a glowing leaf crest, lanterns, banners and runed stone feet, a shimmer and motes in its opening, a lamp
   before it; the Pokéstop and route sign a step out to its sides, Halloween's hay there gone (`clearingGateArt()`,
   `liveGateway()`). On `main`, waiting on the user's look.
   **Done (2026-10-14): the Clearing's backdrop filled, east trees out, cracks at the Sealed Gate's spot** (the user's
   phone shots): the painted vista runs across the whole back and 40 units on up as plain sky (`vistaSpan()`, `SKY_UP`), so
   no grey shows from the house, the mall or the south side; `TREE_TILES` [30, 15], [29, 20], [30, 24] taken out; violet
   cracks where the Sealed Gate will stand (`SEALED_AT`), growing with `gateStage()`, crystal shards, sparks, whispers when
   near and a tap card (`js/hub-cracks.js`). Patch 1.19 cut. Headless-checked, no errors; waiting on the user's look.
   **Done (2026-10-15): the broken Sealed Gate in the Clearing built in 3D** (the user: "not the paper thin pixel
   version"): obsidian arch, gold, runes, crystal spires, a swirling Depths portal, floating door shards, snapped chains
   (`js/hub-sealed.js`). Headless-checked, no errors; waiting on the user's look (`?mewtwo&gate=0&hubat=2,12`).
   **Done (2026-10-15): the Clearing's lamps and benches in mirrored pairs, and the professors** (the user's ask): 14
   lamps, 6 benches, 4 flower beds (`LAMPS` / `BENCHES` / `BEDS`); Professor Oak by day and Professor Sonia at night on
   the plaza right of the Waystone, tapping through `HINTS`, saying to refresh for updates every fifth tap. Headless-checked,
   no errors; waiting on the user's look. Their sprites are the user's own since 2026-10-14 (80 x 80, like Kurt's).
   **Done (2026-10-15): the professors talk in the Gym Leaders' slide-in** (the user's pick, option 2): the first tap of
   a visit slides Oak / Sonia in with a hello and a hint, later taps just the speech window (`profTalk()` in
   `js/hub-3d.js`). Headless-checked, no errors; waiting on the user's look (`?hubat=20,11`, `&time=night` for Sonia).
   **Done (2026-10-14): Lantern Village's gate out made grand** (the user: "more aesthetic, extravagant, noticeable"):
   `torii()` in `js/event-3d.js` is a gold-trimmed torii with a smaller one behind (`toriiFrame()`), a straw rope with
   swaying shide, red paper lanterns off the beam's ends, a glowing veil, rising motes, a ring of light and a lamp on the
   road; `forest()` leaves a glade round a town's gate, two big stone lanterns in it; `R.reach` lets the camera lean past
   the back row so the gate shows whole. Commit 8eb7285. Other towns' gates could get the same if the user asks.
   **Done (2026-10-14): Lantern Village cleaned up** (the user: "a lot of houses"; same treatment as the Clearing and
   Thornwood, with a shape of its own): a shrine's approach, one 4-wide stone avenue from the way in to the torii between
   pairs of stone lanterns, the Waystone's plaza halfway up, two cross lanes; only four houses (Delibird's, John's,
   Jahmes's and locked `a`; the other seven locked houses gone, their ids saved nowhere), the Dance Theater and pagoda at
   the back against the forest; a koi pond in the west garden (`~`, the village's `holes`, `villageExtras()`: koi, lily
   pads, irises, a stone lip) with a vermilion bridge (`-`, railings arching on posts to the bed); lone maples (`|`) only
   where nothing walks behind them; indigo name boards by the named doors (`n`); every building fades while your Pokémon
   is behind it (`fadeBehind()`, the style's `fade`). `?town=shrine&towns&aerial` for the overview (the towns' `?aerial`,
   added this session). Checked in a browser: map test logic passes for all five towns, every door reachable as Lugia,
   fades and koi checked by hand, no errors; the live GPU in-and-out check couldn't run (the pane draws no frames hidden).
   Follow-up (same day, the user: walkways "more aesthetic and less blocky"): the village's roads are painted by
   `softRoads()` (the style's `soft: true`): corners rounded out and in, uneven slabs in courses, a darker kerb, grass
   creeping over it. Paint only, at build time; the Springs keep the square flags (any town can take `soft` later).
   Follow-up (same day, the user: Gym Leaders' houses "more grand and extravagant and aesthetic", in the Shrine "and all
   future gym leaders"): a village house whose home has a `leader` is now `manor()` in `js/event-3d.js` (any later
   village-style leader gets it unasked): a stone podium up steps, a vermilion veranda, a deep tiled roof, a gold-leafed
   upper storey under a second roof with a gold jewel on the ridge and the crest in a front gable, a gabled porch with the
   crest and a sacred rope, stone lanterns at the steps, paper lanterns and two swaying banners in the leader's `GYM_INK`
   (`noboriArt()`). John's and Jahmes's lots grew to 5 x 4 (John's moved down a row, his door now on the south road).
   **Every town clean-up does the same for its leaders** in its own style (the handoff's checklist, item 12).
   Follow-up (same day, the user: "clean up any awkward lanterns and benches"): the plaza is a clean paved square now (its four
   corner lanterns, the one at the east lane's mouth and its three flower patches gone), two benches along its top facing
   the Waystone, and the entrance lawn's two benches moved to the roadside by the avenue facing the south road. A bench takes
   two tiles (its x and x + 1), so mirror one at x with 36 - x. Map only (`js/data/towns.js`).
   **Done (2026-10-14): Cinder Springs' clean-up** (the user's call: fix what the map review found plus the checklist):
   four locked houses not eight, the crag stubs and stray pool out of the middle, the right road legs a tile left so
   nothing stands flush on the crags, the Waystone centred on its plaza, name boards (`n`, `nameBoards()`), `fade`, and
   Clarence's and Shaun's homes grand two-storey `lodge()`s on 5 x 4 lots (`docs/reference/towns.md`). Tests pass; no
   console errors headless; the in-and-out GPU check wasn't run (no door taps headless). Waiting on the user's playtest.
   **Done (2026-10-14): Cinder Springs a lava field** (the user: "still pretty bland... a lot of homes... make it look
   something cool how you did the thornwood one", and the bathhouse had no road): `~` is lava there (`lavaField()`):
   a lavafall off the crags at the top, a river the switchback crosses on two-tile basalt bridges (`-`, iron rails,
   ember lamps), a moat making the Waystone's plaza an island (bridges in from the west and south), crust drifting,
   bubbles, smoke. Two locked houses (a, e; k and n gone), the bathhouse on its own road with its springs out beside it.
   Tests pass, no console errors headless; waiting on the user's playtest.
   **Done (2026-10-14): Driftwood Landing's clean-up** (the user: "fix all of that", the map review against the
   checklist): the ring a square of boardwalk two tiles wide round the temple's island with water between, a pier in on
   each side, every spoke two wide, the top of the ring a promenade out to the beacon (top left, at the back) and Kayl's;
   four locked huts not ten (a, p, x, y; g, e, j, m, n, d gone), the aquarium off the jungle, Pat's boat moored north of
   its spoke (in front of it, it hid you), the rowboat out of the bottom walk, beach props on the front row; a railing
   and a pale trim along every boardwalk edge over the water, `fade`, name boards (`s` here, `n` being a net;
   `nameBoards(town, 's')`); Kayl in a `stiltManor()` (5 x 4, two tiers of thatch), Pat in a grand two-deck `houseboat()`
   (6 x 3, paddlewheel, banners, fairy lights). Tests pass; no console errors headless; all doors reachable by the game's
   blocked tiles; fades checked by hand; the in-and-out GPU check wasn't run (no door taps headless). Waiting on the
   user's playtest.
   **Done (2026-10-14): Driftwood Landing's homes, trade house and gate made grand** (the user: "make the other homes
   look more cool and aesthetic, especially the trade house, and the exit"): the four locked huts overwater
   `bungalow()`s (woven bamboo, railed porches, lit glass floats; a and p `shape: 'saddle'` roofs swept into horns, x
   and y two-tier thatch), Pelipper's a seaside `baitShop()` (striped awnings, fish stall, rods, BAIT sign, mast,
   bunting, weathervane, smoking stovepipe), the exit the drowned temple's great gate (`templeArch()`: stepped crown,
   frieze, turning wheel, blue spirit-fire braziers, light in the opening, a glowing mosaic under it, broken columns,
   coral, kelp; `B.reach` 2). Tests pass; no console errors headless. Waiting on the user's playtest.
   **Done (2026-10-14): Highbough's leaders, huts and Nursery made grand** (the user: "make the gym leaders houses more
   grand... fix the aesthetic of the huts too and the green house, they're all lame"): Phil's and Ricky's lots 5 x 4,
   both `canopyManor()`s (Ricky's a den round a living tree, Phil's crooked and haunted); the treehouses round huts
   (`treehouse()`); the Nursery a ruined Victorian conservatory (`nursery()`). Tests pass, no console errors. Waiting on
   the user's playtest.
   **Done (2026-10-14): Highbough's small props tidied** (the user: the request board left of the tree, awkward benches,
   "crates with fruits... like paper", "random grass patches"): the board off the north bridge's landing to the Great
   Tree's left (13, 14); benches only as lookouts on south edges over the drop; the painted planters now 3D boxes
   (`planters()`), a pair either side of each plain house's door and the Waystone; the moss tufts gone; crates square
   (the style's `neat`). Tests pass, no console errors. Waiting on the user's playtest.
   **Done (2026-10-14): Highbough's lanterns, planters, start-deck flicker and gate** (the user: lantern posts "in the way of
   walkways", "the constant flower crates everywhere", "a weird flicker at the beginning platform", the exit "more grand"):
   13 lanterns, each in a platform's outer corner clear of every bridge mouth and door path; planters only the Nursery's
   pair at the back; the start deck's crate and barrel off the way in; the flicker was the trunk under the only deck with no
   house on it, its top level with the planks (now just under, and the deck rims too); `vineGate()` now the Bough Gate, a
   living arch of two trunks on flaring roots, crowned, lit with ghost-blooms, ghost-lanterns swaying under it, wisps
   circling, a wider name plank (`B.reach` 2 so it fits the shot). Tests pass, no console errors. Waiting on the user's playtest.
   **Done (2026-10-14): Highbough's name boards** (the user: "legible aesthetic signs for gym leaders and trade house"):
   `s` tiles by Phil's, Ricky's and the Curio Shop's doors, each a dark walnut plank on ropes from a log crossbar
   (`boughBoards()`, `boughBoardArt()`): big cream letters, mossy top, GYM LEADER in the leader's ink on a gold rim, the
   shop's TRADE HOUSE in ghost violet, a ghost lantern swinging off the bar; the small pale plates on the houses gone.
   **Done (2026-10-14): Cinder Springs' roads and houses** (the user: Shaun's gym "in front of the waystone", "better
   designs of the other houses... especially the trade house", "all roads need to connect"): Shaun's lodge east of the
   moat on its own drive, a road straight down from the Waystone's bridge where it stood; a two-wide road to every door
   (the mine, Clarence, house a, the forge, house e; a test holds it); Heatmor's Forge a fieldstone smithy (`forge()`),
   the locked houses stepped adobe `cottage()`s, the bathhouse timbered with a pent roof and lanterns. Then the benches
   (the user: "move those benches somewhere else"): off the Waystone's island and the open ash (each painted a stray
   cobble), now on paved nooks off the roads, two looking onto the springs, two either side of the road to the forge.
   Then (the user, again: "move any awkward brazier torches... and move those benches somewhere else"): one bench on a
   paved terrace looking down over the lava moat (row 12, between Clarence's road and the gate road), one in a little
   square before the forge where its road meets the main one (row 29); braziers in pairs at the mine's mouth, the way in
   and the lava bridge, the strays (in the ash, behind the forge, squeezed by the bathhouse) gone. Waiting on the user's
   playtest.
   **Done (2026-10-14): Sunwell Bazaar's clean-up** (the user: nothing specific, "go ahead with the checklist"): the
   diagonal caravan road kept but three wide (two through the gate), the jetty two wide with a rope railing and a pale
   trim, pale stones along the watering hole's bank, huts a and d gone (their knocks moved onto b, e, g and h), the rest
   spread out, buildings fading while you're behind them (`fade`). Machew and Jerome in `kasbah()`s on 5 x 4 lots
   (Jerome's at the top by the windpump, Machew's out on the east edge), with `s` name boards; their homes are now
   "Machew's / Jerome's Kasbah". Tests pass, no console errors; the walk-in-and-out leak loop wasn't run (the pane draws no
   frames hidden), so the user should walk in and out of a few houses on their phone. Every town's clean-up is done.
   **Done (2026-10-14): the Clearing's curve in every town** (the user's ask: "the animal crossing log style thing
   applied to ALL towns"): all five towns roll away at the Clearing's strength (`CURVE`, `?curve=N`, flat under
   `?aerial`), house insides flat; taps go through bent pieces of the ray (`tapRays()` in `js/event-3d.js`), long shapes
   are cut so they bend (`fineTris()`). Archived in `docs/roadmap-done.md`, details in `docs/reference/towns.md`.
   **Done (2026-10-14): a view past every town** (the user: "I don't like that wall of green"): the back wall and sky dome
   are gone; each town stands the Clearing's vista painting (`vistaArt()`, in its own colours: `TOWN_VISTAS` in
   `js/event-3d.js`) on its back edge, and its sides are trees only. Then the Shrine/Ruins and Thornwood looks' green skies became
   blue (every outdoor room there). **Then (2026-10-14) every town's backdrop rebuilt** (the user: "make them all grand
   and aesthetic and animated"): `js/town-backdrop.js`, layered and moving, hung on the rolled ground's crest, each town's
   landmark behind its exit gate. Details in `docs/reference/towns.md`.
   **Done (2026-10-14): Cinder Springs' bathhouse** (the user: "so stupid looking"): the two-storey adobe box with a pent
   roof stuck on is now a sento (`bathhouse()` in `js/event-3d.js`): wide and low, timbered plaster and lit lattice windows
   under a kawara roof with a steam vent on its ridge, a curved karahafu porch (`karahafu()`) with the ♨ crest, sign and
   indigo noren, red lanterns, a tall round brick chimney smoking at the back, tubs and a woodpile. Waiting on their look.
   **Done (2026-10-14): Sunwell's bazaar and every trade house's sign** (the user: the stalls round the Waystone "so lame
   and dinky", Persian needs a better sign, every trade home a sign and a Poké Ball one, the leaders' signs in the town's
   look): the market is a bazaar square now, long stalls on its four sides (a run of `n` is one stall, `bazaarStall()`:
   striped awnings, valances, kilims, heaped wares, lanterns, bunting, flags) with kilims on its floor; the hut by the sun
   gate (g) gone; Persian's tent wears a crimson marquee with a Poké Ball on top; every other town's trade house a
   `tradePost()` (a turning Poké Ball on a post, a TRADE board swinging off it); Sunwell's `s` boards are
   `bazaarBoards()` in each leader's colours. Waiting on the user's look.
   **Switched on 2026-10-15** (patch 1.20). ▶ Playtest on the live site, no flag needed now.
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
   10 p.m.), Kayl's house (Spooky the black cat, a recoloured Glameow, and Reya the purple Purrloin, 15 lines each; a home's `names`), Pelipper's Bait & Tackle (the trade);
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
   up and down (2026-10-14, the user's ask: on their phone the Great Tree deck's rings covered the drop, so the air was cut
   out last with `destination-out` and the rings stamped tile by tile, no clip; the drop is twice as deep, `DROP` -7, with
   three mist layers and a haze over the floor). Walked in: Kecleon's Canopy Goods (the trade), Phil's (candles, Misdreavus, JONA after 11 p.m.), Ricky's
   (gaming with the boys after 10 p.m.), the glass Bloom Nursery (Bellossom, Sunflora, Cherrim, Oddish, Chikorita; Bellossom's
   cry added). 8 locked treehouses, 10 folk (Aipom, Hoothoot, Sentret, Hoppip, Seedot, Shroomish, Treecko, Teddiursa, Natu,
   Paras), its own requests (fights, ❓ rooms, an Alpha, a PP Up, the Gym) and broken Waystone. **Reworked 2026-10-14 after the
   user's playtest** ("hard to navigate for a bigger Pokémon, hard to tell where I can walk; only scary ghost Pokémon"):
   every rope bridge two tiles wide (`bridgeAxes()` in `js/event-3d.js` paints and ropes a lane by its reach), a rope
   railing round every deck edge over the drop and a pale trim inside it; a ghost town: 10 ghost folk (Gastly, Haunter,
   Duskull, Shuppet, Banette, Drifloon, Yamask, Lampent, Shedinja, Golett), Mismagius's Curio Shop for Kecleon's, the
   Withered Nursery's sleepers (Chandelure, Cofagrigus, Dusclops, Spiritomb, Gengar) on web rugs among graves, will-o'-wisps;
   16 cries added. Its furniture shelf is still Greenhouse / Garden (Spooky is the mall's; ask the user before swapping). **Tidied 2026-10-14 after a second playtest** (the user's circles): the Curio Shop moved to Phil's old spot right of the Great Tree, Phil's treehouse to its own deck at the bottom middle; five locked treehouses (P, X, Y, M, N) and the lone giant and canopy clumps they circled taken out; every deck a clean rectangle and every bridge two wide, landing squarely on a deck (no notches or half-lanes); the shop and Phil's have no tree through the roof (`tree: false` on a building, `treehouse()`), since those crowns hid the walkways. The user liked it ("much cleaner"); after it the Waystone moved onto the Great Tree's axis, 3 tiles wide under its hollow (it stood half a tile off, low on the deck by the bottom bridge, the user found it awkward). Last commit on `claude/next-town-oahwio`. Branch `towns` (and
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
4. **Give every town Highbough's clean-up** (the user's ask, 2026-10-14, after Highbough's tidy: "much cleaner"). One
   town a pass, the user circling what's in the way on a playtest first if they like: the Lantern Village, Cinder Springs,
   Driftwood Landing and Sunwell Bazaar (all four done 2026-10-14, see the Towns and Waystones entry; Lantern Village, step 2 above: the Waystone centred on its plaza on the avenue's axis, the bridge two wide and landing squarely, roofs fading over the paths behind them, `fadeBehind()`, rather than moved; `?town=<biome>&towns&aerial` now shows any town from above). The rules Highbough's tidy set: fewer locked houses (only enough to read as a
   town), every walkway a clean rectangle, every bridge / boardwalk / road two tiles wide and landing squarely (no notches
   or half-lanes), no tree, crown or roof hiding a path (`tree: false`), clutter that only fills gaps taken out, and the
   Waystone centred on its square or deck, on the axis of what it faces. Keep each town's own shape. `node --test
   tests/*.test.mjs` checks every door stays reachable. **Send the user an aerial screenshot** of the town before and
   after (the user's ask, 2026-10-14: the one of Highbough from above showed them the whole layout at once): headless
   Chromium (Playwright, `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`, Three.js routed to a local
   copy if its CDN is blocked) on `?town=<biome>`, a 900 x 900 window, the camera lifted high over the town's middle
   looking down (a throwaway `window.__top` hook in the town camera, never committed), sent with `SendUserFile`; a
   playtest link with it. ▶ Run in: CLOUD. Prompt: "Read CLAUDE.md and docs/roadmap.md's
   Towns step 4. Give <town> Highbough's clean-up, and send me an aerial screenshot before and after."
**Done (2026-10-15): the Waystone's waking made epic** (the user's ask): a ~8 s light show as the shard goes in (rune
   circle, motes, shudder, screen flash and shake, shockwaves, sparks, a pillar of light), a WAYSTONE AWAKENS card, then
   the town's Gym Leaders slide in glowing with new `awaken` lines (`docs/reference/towns.md`, "The waking, made epic").
   Branch `claude/next-town-oahwio` and `main`. Waiting on the user's playtest: `?town=<biome>&mend` (hand the
   shard in at the board). Next: whatever they want tuned in it.
   **Walk-up (2026-10-14, the user's ask: out of the Nietos' house the stone was off the screen):** your partner now walks
   up to the stone's doorstep first, the camera following, then the light show plays (a camera pan was tried first; the
   user picked the walk-up). The Clearing: `cutscene` in `js/hub-3d.js`. Towns: `t0` waits on the walk in `mendStone()`.
   Leaving the house after the shard is no longer a cut: a walk to the doormat and a fade (`outSlow()` in `js/run.js`).
   On `main`; waiting on the user's playtest.
**Done (2026-10-14): the towns' great halls, inside, made huge** (the user: "they SUCK the insides need to be HUGE and be
   super aesthetic and make sense"): the theater, bathhouse, aquarium, Nursery and caravanserai are 17 x 12 halls built
   as what they are (`js/town-halls.js`, `docs/reference/towns.md`'s last section). On `main`; the user playtested
   them the same day and they look good. Nothing open; any later tweak is the user's ask.
**Done (2026-10-14): the Gym Leaders' homes, inside, made big** (the user: "so small and very bland"): 13 x 10 rooms, each
   leader's own walls, floor, light and props (`js/leader-homes.js`, `docs/reference/towns.md`'s last section). On `main`,
   waiting on the user's playtest (`?town=<biome>&home=<leader>&gymwins=1`); ask which house to push further next.
   Same day, the user's ask: the Nietos' house in the Clearing got the same revamp (`LEADER_HOMES.nietos`; walk in from
   the hub with `?nietos&gymwins=1`, or without `?nietos` to see it "out"). On `main`, waiting on their playtest.
**The Nietos at home** (2026-10-14, the user's ask): their house in the Clearing stays; the Nietos (and Kangaskhan) are
   home in it only once THE NIETOS' Kangaskhan is beaten at the Clearing's Gym. How they show up is settled by step 7
   (their questline): `NIETOS_LIVE` is on, so they're home with the towns (`townsOpen()`); they still never visit the
   Secret Base. `?nietos&gymwins=1` previews it.
   **No Gym Leader visits the Secret Base** for now either (2026-10-14, the user's ask): `LEADER_VISITS_LIVE` false in
   `js/data/gym.js` (`leaderVisitor()` returns none); `?visit` still brings one for a page load.
5. **The all-five reward: Mewtwo's full strength.** **The Crystal Depths stay Mewtwo's alone** (the user's call,
   2026-10-14: no other starter ever goes down there to fight; "the Depths open to every starter" was built that day and
   reverted, commit 3dfe9ca / revert dcbbca6, along with Mewtwo talking at the gate and opening it at five shards).
   **Settled (the user's design, 2026-10-14): Mewtwo's Sealed Weakness.** Freed from the gate, Mewtwo is still too weak
   for what's below (its break-out talk already says so: `MEWTWO_LINES` in `js/gatescene.js`). It can always go down,
   but in the Depths only it carries a **permanent damage debuff** (a "Sealed Weakness" nameplate badge), and each
   Waystone Shard you give it lifts a fifth of it; all five, full strength. Its first three biomes are unchanged. Start
   around 50% less damage, 10% back a shard, and check with the bot that 0 shards is hard but winnable (never a wasted
   run). **The shards' progress is shown big**: a **pentagram of five shard slots**, slid in full screen like the gym's
   dialogue, the placed shards glowing in their towns' `RING` colours, the missing ones dark; seen before a Mewtwo run
   and when you meet Mewtwo after one. **The Depths camp**: once the seal is broken, the fall (or the Sealed Gate's
   portal) takes you down to a camp in the Depths you can walk round, between runs too, Mewtwo standing by the
   way in to the Depths proper; talking to it brings up the pentagram, and its lines change with the shards placed
   (why it needs them, what Eternatus is, how much of its strength is back). Builds with step 6 (the shards must drop
   first).
   **Built** (2026-10-14/15; two builds were made in parallel and the user picked, 2026-10-15: `main`'s behaviour with the
   other build's dressed camp, a miners' camp with tents, a fire, a crystal cart out of a mine mouth marked DEPTHS and the
   pentagram carved in a stone dais, and its pentagram window with the town list; the Prepare screen says the weakness).
   Waiting on the user's playtest: `?gate=0&strike=0&towns&shards=3` (a won run's landing), Mewtwo's Prepare with `&shards=`.
   **A won run's ending with the camp** (the user's yes, 2026-10-14): last boss → the fall → the Depths camp (walk
   round, talk to Mewtwo, the pentagram) → leaving it plays the win scene / Hall of Fame → unlock windows → result
   window. The win is recorded before the camp opens, so closing the game there never loses it; leaving only plays
   the celebration. A visit outside a run (the Sealed Gate's button) has no win: leaving goes back to the Clearing.
   **Who lands in the camp** (the user's yes, 2026-10-15): once the gate is broken, **every starter's won run** falls into
   the camp (it replaces the nameless throw-back, `kind: 'open'` in `descent()`), but **only Mewtwo goes past it** into the
   Depths proper, Mewtwo standing by that way in. The other starters' runs are where the shards are won (Mewtwo's never
   stop at a town), so ending them there hands a new shard straight to Mewtwo and lights its pentagram slot. **Kept short**:
   unless something new waits (a shard to hand over, a new line from Mewtwo), a won run's landing is one tap through to
   the win scene, not a walk round. **Mewtwo's own runs** land in the camp after their third boss (seeing how much of its
   strength is back) and go on down from there. Before the gate breaks, won runs strike it as now.
   **Built (2026-10-15): the Sealed Weakness, the pentagram and the Depths camp**, all behind the towns' switch
   (`sealOn()`: `TOWNS_LIVE`, `?towns` or `?shards=N`; live with the towns since 2026-10-15).
   50% in the Depths, +10% a shard (`SEALED_WEAKNESS`); bot, psychic, human / strong: 0 shards 64.0 / 63.7 (300 runs),
   2 shards 78.7 / 77.3, 5 82.0 / 92.0 (150): hard but winnable, kept.
   Every won run lands in the camp once the gate is broken; it's a walk (Mewtwo's talk coming to you) only when
   something new waits (the camp never walked, or a shard lit since Mewtwo last saw the pentagram, `save.campLit`, lit
   last with a flash), else Mewtwo's one line and a tap. Mewtwo's own runs stop there after their third boss (it feels
   its strength, the pentagram, then "Go down" is the way on into the Depths). Detail:
   `docs/reference/mewtwo-and-depths.md`. Playtest `?towns&shards=2&mewtwo&gate=0&strike=0` (the fall into the camp),
   `?towns&shards=1&mewtwo&descent=mewtwo` (Mewtwo's stop). **Step 5 is built; next**: the user playtests it (with
   `?towns`), and it goes live with the towns. Branch `claude/next-town-oahwio`, pushed to `main` too.
   **Done (2026-10-15): the Sealed Gate's portal leads to the camp, and Mewtwo's run starts there** (the user: the
   portal going straight to the Whispering Clearing made no sense). "Go through" is the camp (towns on or off); a tap on
   Mewtwo says why its run goes up through the three lands first (`whyLines()`), then "Set out with Mewtwo?" opens its
   Prepare step. Headless-checked both ways. Playtest `?mewtwo&gate=0&hubat=2,11` (Enter or tap the gate), `&towns&shards=2`
   for the pentagram first. Branch `claude/sharp-ramanujan-nh2503`, pushed to `main` too.
   **Done (2026-10-15): the camp's big look pass** (the user's ask: the broken Sealed Gate as the way into the Depths,
   looking broken through, and everything else cooler). The mine mouth is now the Sealed Gate itself, smashed open (door
   slabs strewn, a horn snapped off, the wall and floor split with violet light); the shard dais is a three-tier seal with a
   crystal spire per mended Waystone beaming into a floating core; tents, fire, crates and lamps dressed up. Draw calls
   down from 282 to 251 (merged). Waiting on the user's look: `?towns&shards=2&mewtwo&gate=0&hubat=2,11` (Go through).
   Branch `claude/sharp-ramanujan-nh2503`, pushed to `main` too.
6. **Questlines, the Satchel and Kurt's Workshop** (the user's idea and plan, 2026-10-14; all five sessions built,
   waiting on the user's playtest). Each town's 5 generic requests become a **questline with a story**, and the leaders open it:
   - **The loop**: a town is quiet till one of its leaders is beaten at the biome's boss; the next visit, that leader
     **slides in to greet you** (the gym intro's slide-in dialogue) and tells you about the Waystone (what broke it,
     what the town lost), unlocking the board. About 4 steps over a few runs, mixing **Do** (the `track()` events),
     **Find** (biome materials) and **Make** (crafted at home, brought back). **The last step is always a Waystone
     Shard** floating over an **Alpha node** on that biome's map: beat it, the shard goes into Key Items, and the next
     visit the leader puts it in and the stone lights (a short scene). Then the town's leaders can come to the Clearing's
     Waystone and the Secret Base (this replaces `LEADER_VISITS_LIVE` being off), and the board rotates small coin
     requests after. Story under it all: the shards are Crystal Depths crystal, cracked when the Sealed Gate was shut;
     all five fully light the Clearing's Waystone (ties into step 5).
   - **The towns' stories**: Lantern Village (John, Jahmes): the lanterns won't stay lit, spirits roam after dark,
     Jahmes's 11pm curfew, John can't pick the festival: wicks, **the player picks John's festival** (which furniture
     you get), relight the lantern ring, shard. Cinder Springs (Clarence, Shaun): the springs went cold, Shaun's comms
     tower is down, Clarence wants a reopening show: Magma Ore, a relay for Shaun, Clarence's costume, shard. Driftwood
     Landing (Pat, Kayl): stilt houses sinking, Pat's love letters in bottles across the lagoon: bottles on the map, pier
     supports for Kayl, deliver Pat's letter, shard. Highbough (Phil, Ricky): something haunts the ruined conservatory,
     Phil hunts it, Ricky films it all night: a Spirit Lantern, a night ghost fight, Thornwood seeds to restore the
     conservatory, shard. Sunwell Bazaar (Machew, Jerome): the watering hole drying, a robbed caravan, Jerome's "heist",
     Machew's broken katana: the stolen crates, **reforge the katana from Cinder Springs ore** (recipes across towns give
     the other roads a reason), shard.
   - **The Satchel**: a new Pokédex app (a `shelfApp()` in `js/bagdex.js`), the home stash that outlives runs, readable
     mid-run too: **Key Items** (shards, letters, the katana; one of a kind, never used up), **Materials** (counts by
     biome, each saying what it's for) and **Quests** (each town's step and what it still needs). "!" on new things.
     Named the Satchel since the Bag is the run's.
   - **Materials**: 2–3 per biome (wicks, ore, driftwood, seeds, spice...), from fight rewards and 1–2 sparkling map
     nodes a run; into the Satchel, never the run's Bag, and **kept on a lost run**. Rolled through `js/rng.js` anyway.
   - **Kurt's Workshop** in the Clearing (Johto's Apricorn ball maker): a workbench and a cauldron. Crafts quest items,
     **craft-only furniture** from each town's set, **gifts and dishes for visiting leaders** (each has a favourite; it
     raises friendship and they give their signature piece) and Apricorn ball **skins** for the Safari (looks only, the
     leaderboard stays fair). **Nothing crafted gives power in a run** (a carried potion would need a bot check first).
   - Sessions: (1) the quest engine: `QUESTS` per town in `js/data/towns.js` (step kinds `track` / `gather` / `craft` /
     `shard`), the leader-beaten unlock and slide-in greeting, the Satchel, tests; (2) materials: drops, sparkling nodes;
     (3) Kurt's Workshop and its recipes; (4) the shard: the marked Alpha node, the pickup, the mending scene, leaders
     coming home; (5) the dialogue, a town a session if it runs long. Towns live since 2026-10-15 (patch 1.20).
   - **Session 1 done (2026-10-14): the quest engine.** `QUESTS` in `js/data/towns.js` (a story, a `greet` per leader, 4
     steps a town: `track` / `gather` / `craft` / `shard`, each with its leader `by` and their `thanks`; a step may
     `gives` a key item, e.g. Pat's Letter, or `pick`, John's festival), pure helpers (`greeterOf`, `openQuest`,
     `questStep`, `countTown`, `handInStep`, `questProgress`), saved as `save.towns[id].quest` (`{ step, got, picks, lit }`);
     `mended()` is the shard put back (`quest.lit`) or an old save's 5 requests. In the town (`townRoom()` in `js/run.js`):
     quiet till a leader is beaten, then on the next pass that leader slides in (`gymTalk()`) with the Waystone's story and
     the board opens; a step handed in slides its leader in with their thanks, pays `QUEST_COINS` (50); once the shard is
     in, the board rotates the old coin requests. The Clearing's Waystone menu shows quest steps (n/4). **The Satchel**:
     `js/data/satchel.js` (`MATERIALS`, 12, 2-3 a biome; `KEY_ITEMS`, the 5 shards plus 7 quest items; `save.satchel`),
     `js/satchel.js` (save side), `js/satcheldex.js` (the app: Key Items, Materials, Quests; "!" on new things), on the
     Collection only while the towns are on. `?satchel` lends every material and key item for a page load (and on a
     `?town=` peek makes every step ready, to walk a questline: `?town=shrine&gymwins=1&satchel`). Tests:
     `tests/quests.test.mjs`. Materials and shards drop and crafts are made since sessions 2-4.
   - **Session 2 done (2026-10-14): materials drop.** In a town's biome while the towns are on (`?towns`): won fights drop
     one (`DROPS` in `js/data/satchel.js`: wild 40%, Alpha 1-2, boss 2-3; a line in the reward box) and 1-2 rooms a map
     sparkle (✧, `markSparkles()`, 2-3 of one material on walking in); Pat's bottles only sparkle. Refresh-safe
     (`run.gleaned`), kept on a lost run; the Satchel says where each turns up. Detail: `docs/reference/towns.md`. Branch
     `claude/sharp-ramanujan-nh2503`, pushed to `main` too.
   - **Session 3 done (2026-10-14): Kurt's Workshop.** A timber workshop in the Clearing's north-east (towns on only), walked
     into like the Nietos' house: Kurt (the user's sprite since 2026-10-15, with a blink made from it) at his workbench, a cauldron, Apricorn trees, a Slowpoke.
     His window makes, from Satchel materials (`RECIPES` in `js/data/workshop.js`): the 6 quest items (the katana from Cinder
     Springs' ore), 2 craft-only pieces a town plus John's festival piece, a gift for each of the 10 town leaders (given in
     their home: their favourite earns a signature piece) and 7 Apricorn looks for the Safari Ball. Detail:
     `docs/reference/towns.md`. What `liked` (gift friendship) is for: step 8. (The Nietos got gifts 2026-10-15: the
     Acorn Rattle earns a Big Kangaskhan doll.) (2026-10-15: the workshop is boarded shut till Law sends you for the Waystone Chime, and Kurt introduces himself on your first visit. Branch `claude/magical-hamilton-ve8726`, pushed to `main` too.)
     Branch `claude/sharp-ramanujan-nh2503`, pushed to `main` too (1094195).
   - **Session 4 done (2026-10-14): the shard.** At the shard step one Alpha on the biome's map has the town's shard over it
     (a crystal in the town's colour); beat it and the shard goes into Key Items. At the board, after its leader's thanks,
     the shard floats from your Pokémon into the crack and the stone mends before your eyes (`mendStone()`). Then the
     town's leaders come home: one a day by the Clearing's Waystone (the one who put the shard in, first), the others
     dropping by the Secret Base (`HOME_LINES`). Detail: `docs/reference/towns.md`. Playtest: `?town=shrine&mend` (the
     scene), `?biome=shrine&shard` (the marked Alpha). Branch `claude/sharp-ramanujan-nh2503`, pushed to `main` too.
   - **Session 5 done (2026-10-14): the dialogue, all five towns.** Each step's `talk` in `QUESTS`: its leader's word on
     the board while it isn't done (`nudge`, `stepNudge()`) and what both leaders say about it at home, said first
     (`homeTalk()`); `after`, their lines at home once the stone is lit; `chats`, the folk's talk then (`folkChats()`, the
     crowd's `R.chats` refilled each visit). `{pick}` is John's festival (`questLine()`, "autumn festival" before one).
     `HOME_LINES` are 4 speeches a leader now, a lot of them about each other (the Clearing deals one a day, the base one a
     visit). Tests in `tests/quests.test.mjs`. Branch `claude/sharp-ramanujan-nh2503`, pushed to `main` too.
     **Step 6 is built.** Next: the user walks a questline (`?town=shrine&gymwins=1&satchel`, `&home=john` for his house)
     and says what to change. Then step 5 (Mewtwo's Sealed Weakness, the pentagram, the Depths camp). Gift friendship (`liked`): step 8. Towns live since 2026-10-15 (patch 1.20).

7. **The Nietos' questline: mending the Clearing's Waystone first** (the user's idea, 2026-10-14). The Clearing's own
   Waystone starts broken, and the Nietos' questline mends it. Every town's questline comes after it: the Clearing stone is
   the hub the others link to, so you can't travel to a town from home until it works.
   - **Opens when you beat the Nietos** (their Kangaskhan, the Clearing's boss): on getting home (`cameHome()` or the
     Clearing after the run ends), Law and Britt **slide in** (`gymTalk()`, like a town leader's greet) with the story: the
     Clearing's Waystone is cracked, which is why the towns' stones are dead too. `NIETOS_LIVE` goes on, so they're home
     once beaten, and their house is where you hand in steps and hear their talk (`homeTalk()`).
   - **Their own quests**, `QUESTS.clearing` on the same engine (`track` / `gather` / `craft` / `shard`), about 4 steps, a
     leader `by` each (Law, Britt; Linc and Kangaskhan for flavour), with `thanks`, `nudge`, `talk`, `after` and `chats`
     like the towns. Do steps count in the Clearing biome. It needs **2 new Clearing materials** in `MATERIALS` (dropping
     in the Clearing biome, the `DROPS` / sparkle code), a Kurt `RECIPES` item for the craft step, and maybe gifts for the
     Nietos (that open question from step 6).
   - **The last step: an Alpha in the Clearing biome** carries the Clearing's shard (the marked Alpha from session 4).
     Beat it, bring it home, the Nietos put it in and the **main stone lights** (`mendStone()` on the Clearing's Waystone,
     `clearingWaystone()` in `js/hub-3d.js`: dull until then, its five town crystals still dull until their towns mend).
   - **What it gates**: until the Clearing stone is lit, towns still show up in runs (trades, chat, their homes), but their
     leaders don't greet you or open the board, and the Clearing's Waystone menu has no Travel (it says it's broken and
     points to the Nietos). An old save that already started a town questline counts the Clearing stone as lit, so nobody
     loses progress. Its menu and the Satchel's Quests list the Clearing first. Tests in `tests/quests.test.mjs`.
   - One session (two if the dialogue runs long). Playtest: `?nietos&gymwins=1&satchel`, `?biome=clearing&shard`.
   - **Built (2026-10-14), waiting on the user's playtest.** `QUESTS.clearing` in `js/data/towns.js` (Law and Britt's greet,
     4 steps all `by: 'nietos'`: win 5 fights in the Clearing, 5 Glowmoss, Kurt's Waystone Chime, the Clearing's shard), the
     Clearing's materials Glowmoss and Whisper Acorn, `clearingLit()` gating the towns' greetings and the Waystone's
     Travel. The greeting plays as the Clearing opens (`homeNews()` in `js/hub-3d.js`), steps are handed in at the Nietos'
     house (`homeRoom()`), and stepping out after the shard plays the stone's light-up (a beam, the cracked stone swapped
     for the whole one). `NIETOS_LIVE` is on, but the Nietos are home only while the towns are on. Playtest on the live site:
     `?towns&gymwins=1` (the greeting), then `&satchel` (every step ready, in their house). Next: the user walks it; then
     step 5 (Mewtwo's Sealed Weakness, the pentagram, the Depths camp), if the user still wants it. Open: the Nietos' gift (step 6's open question); whether the mending wants a bigger scene than the beam.
   - **Quest board (2026-10-14, the user's ask after walking it: "we don't have a place to pick up quests").** A roofed
     cork board on the plaza's north-west corner (`QUEST_AT` [11, 10], the PC's mirror; towns on only): its notice starts
     the Nietos' questline if the greeting didn't (`takeQuest()`), then it says the step up and where to hand it in, then
     every town's questline under way (`boardNow()`); a "!" floats over it with a notice to read or a step ready. The
     Nietos' house got a Quest spot that starts it too. Hand-ins stay at their house. On `main`, waiting on the user's look.
   - **Quests app (2026-10-14, the user's ask: an aesthetic window for the board, and quest progress from anywhere).**
     `js/questlog.js`: the Pokédex's own Quests app (out of the Satchel, which keeps Key Items, Materials, Gifts), a cork
     board of pinned notes, one per questline: the step up now with a progress bar, where its things come from, where to
     hand it in, every step on a tap, and how to start a locked one. Simplified the same day (the user's ask): one big DO THIS NEXT note (the step, a bar,
     WHERE, THEN HAND IN), then every quest as a one-line row that opens on a tap.
   - **Hand-ins to the leaders, with a "!" (2026-10-14, the user's ask).** Every town's steps are handed to their Gym
     Leader at home now, not the board (like the Nietos'); a "!" floats over that leader's house and over them inside while
     a step is ready; the shard's hand-in walks you out to watch the stone mend. On `main`, waiting on the user's look.
     Same day: the "!" moved onto the leaders' name signs (the user's call), the board wears a "!" till read once and then
     opens the Quests app, and the coin requests after a questline go to the leaders by turns too. Then: a tap on the leader
     wearing the "!" hands it in (no floating Hand in / Quests signs, which homes had no prop for), a small picker for
     John's festival, and the "!" drops with the curved ground so it stays on its sign or board. The quest board's button opens it ("Quest log"), and
     says it's in the Pokédex too; new-quest messages point there. On `main`, waiting on the user's look.
   - **John's festival happens in the town (2026-10-14, the user's ask: does the pick "actually happen"?).** Once Lantern
     Village's Waystone is mended, at dusk and night, the town wears the festival picked: Lantern Festival floats paper
     lanterns on the koi pond and strings red and white ones across the avenue; Moon Viewing hangs a harvest moon over the
     torii, pampas vases by the plaza and DANGO / TEA stalls; Fireworks Night bursts fireworks over the Shrine's stair, with
     TAKOYAKI / YAKISOBA stalls and a taiko. Mended in front of you, it appears as the stone blazes. Peek:
     `?town=shrine&towns&time=night&fest=lantern|moon|fireworks` (`&mend` too to watch it appear). On `main`, waiting on
     the user's look. Next: none planned; the user's call whether other towns' picks get the same.

8. **Done (2026-10-15): Friendship, what gifts are for**, all six sessions (a-f): hearts, heart lines, Secret Base visits,
   signature pieces 2 and 3, badges / letters / secret recipes, and (f) each friend's own requests on the Quests board.
   Every session's notes are in `docs/roadmap-done.md`; how it all works in `docs/reference/towns.md`. On `main`, waiting
   on the user's playtest (`?towns&satchel&gymwins=10&hearts=5`). **Since 2026-10-16 the Friends page is a Pokédex app**
   (the user's ask: it's carried into the towns where gifts are chosen), after Quests, a banner a friend in their own
   colours with their hearts, with a "!" the first time it's seen and on a friend changed since you looked; the PC's FRIENDS row opens it (`js/friendsdex.js`, `js/data/friends.js`;
   `docs/reference/towns.md`'s Friends app). **Since 2026-10-16 the game explains it** (the user asked whether any
   dialogue did): Kurt's `giftTalk` after the first gift made, and each friend's `GIFT_MEET` hello the first time home
   after their Gym, hinting at their favourite (`docs/reference/towns.md`'s Gift words). On `main`, waiting on the user's
   look. Next: nothing planned; the user's call.

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

**Arcade overhaul: waiting on the user's playtest** (2026-10-17): all 18 Game Corner games were deepened in one pass (see
the archive and `docs/reference/hub-base-mall.md`'s "The arcade overhaul"). Next: the user plays them on the phone and
says which feel too hard, too easy or too busy; tune that game's numbers alone.

**Four more pinball tables: waiting on the user's playtest** (2026-10-17, branch `claude/wonderful-ramanujan-ri0gb0`, on
`main` too): Gengar's Haunted, Lapras's Lagoon, Charizard's Volcano and Rayquaza's Sky Pillar, on `js/pinball-kit.js`
(see `docs/reference/hub-base-mall.md`'s last section), patch 1.24 "Full Tilt". Played by a bot headless only. Next: the
user plays them on the phone and says which feel too hard, easy or busy (each file's top constants and its `make()`
numbers are the knobs); their 3D tables were never seen in 3D. All five tables stand in a row down the Arcade Room's right wall (moved from the Game Corner's, 2026-10-17; untested
in 3D, the cloud has no phone GPU).

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
still the auto hull). Since 2026-10-17 every machine stands in the Arcade Room, free to play (`MACHINES` in `js/mall-arcade.js`); before that
eight stood under the Game Corner's screens, and Pong and the Maze under the two Plinko boards on the left (2026-10-12, the user's layout: the second board back,
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
   (`LOOP_POINTS`), drop its fallback. Arrived: `eternatus`, `eternamax` (2026-10-18, wired), `map4` and the Sealed Gate's `seal`
   (2026-10-04), `mart` too. New tracks to wire if supplied: a Safari theme and the Game Corner (the credits and Energy Well songs arrived 2026-10-18). Real recordings can also replace
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
      - **Fixed (2026-10-18):** a Clearing side tree near the camera could fill the screen (the user's iPhone, a Forest
        Edge wild fight): `side()` in `build()` only tested the trunk, so its crown swept across the middle. It now takes a
        `reach` (the crown's spread, a snag's branches) and rejects anything that reaches past the camera. Checked headless
        with a probe of every prop's box on screen, Clearing and Wastes, wild / Alpha / boss, 375x667 to 1280x800.
      - Merged into `main` and live since 2026-10-11 (the user's call). Next: the Shrine, then Ruins, Thornwood, Savanna, Depths.
      Run in: CLOUD (attach `pokeDB-3` and `pokeDB-sim`). Prompt (swap the biome and its dressing each session): "Read
      CLAUDE.md and docs/roadmap.md's item 22, then give the Shrine's 3D arena its own foreground in js/arena-3d.js, a `GROUNDS`
      entry like `dressWastes()`: 3D ground from your feet up to the pixel horizon in the pixel floor's own colours,
      with the Shrine's stone (flagstones, lanterns, moss, fallen leaves, a torii post or two) round the edges, kept off
      the middle and the pads, lit by the hour; boss, Alpha and wild fights alike. Keep it cheap on a phone (instanced or
      merged meshes, the step-down still working). Check it at 390x844 and 1280x800 for every place (`&stage=0-2`,
      `&arena=boss`) with Three.js routed to a local `npm pack three@0.160.0` in Playwright, and give me raw.githack
      links." Order: Shrine, Ruins, Thornwood, Savanna, Depths.

**More ? events, the next batches** (the user's pick, 2026-10-17): 30 are in the game (merged 2026-10-17; the archive's
"More ? events" has the batches and bot checks). Toward StS's ~50: the curse events once curses land, and more on
StS events with Pokémon dress (one walkable 3D room each, every roll through `js/rng.js`, mirrored in pokeDB-sim,
bot-checked when one hands out power; give some a heal). Pairs with the "event-only relics" step below.

**Sky Pillar augments: re-check after the balance pass, then more Prismatics and sets** (the user's pick, 2026-10-17).
116 augments (Silver 38, Gold 48, Prismatic 30; 6 sets holding 25), all ranked in pokeDB-sim's `sim/augranks.json`, but
those ranks are from 2026-10-11, before the pass's 34 relics and 32 cards. The pass's climb check only went to floor 40
(fire 68 -> 70%, grass 80 -> 78%, water 53 -> 58%); floor 100 was last measured 2026-10-05 (Fire 0%, Grass and Water 7%).
A climb shows ~9 Prismatics of 30, so that tier repeats first. Then: re-measure the ranks, climb to 100 per type, list the
dead and must-pick augments and fix them, then ~10 Prismatics and 2-3 new sets (build-arounds), checked again.
▶ Run in: CLOUD (both repos). Prompt: "Read CLAUDE.md, docs/roadmap.md's 'Sky Pillar augments: re-check' entry,
docs/reference/sky-pillar.md, docs/augments.md and pokeDB-sim's README on the Sky Pillar. Re-measure every augment's rank
on today's main, run 4-flight and 10-flight climbs per type, and show me the dead and must-pick augments and Fire's top
floors before changing anything. Then retune, add ~10 Prismatics and 2-3 sets, re-check, and push to main."

**Perk loadout** (the user's pick, 2026-10-17). 15 perks today: 9 at the Game Corner (`PASSIVE_SHOP_ITEMS` in
`js/data/shop.js`, 14 levels, 11,800 coins) and 6 from Pokédex pages (`DEX_PERKS` in `js/data/pokedex.js`). StS has none
past Neow, and every always-on perk makes Level 0 easier, so new perks go in a loadout: own many, bring 3 into a run
(Hades' Mirror, Monster Train's covenants), chosen at the run's start. The 15 that exist stay as they are (players bought
them). Then 5-8 new perks that add choices, not stats, like the Pokédex ones (see the map, reroll, open a road), each read
through `perk()` / `dexPerk()` in `js/run.js` (a Safari first try stays fair), mirrored in the sim and bot-checked.
▶ Run in: CLOUD (both repos). Prompt: "Read CLAUDE.md, docs/roadmap.md's 'Perk loadout' entry and
docs/reference/economy-and-hall-of-fame.md. Propose the loadout (slots, where you pick it, what it costs) and 8 perks,
pick with me, then build it with the sim mirror, a bot check at Levels 0/3/5, a patch-notes line and a githack link."

**Friends list and base visits** (the user's go, 2026-10-17; was parked as "Friends and messages", 2026-10-07).
Offline visits, like Animal Crossing's dream visits: you walk round a friend's Secret Base as they last left it. Live
visits together come later, if ever (they need the full Firestore SDK with live listeners, not `firestore-lite`, and
avatar and position sync). Signed-in players only, no free-text chat. **Friend codes are in** (the user's call,
2026-10-17, replacing 2026-10-07's "no codes"): they are the easiest way in. Name search is left for later, because it
needs unique names, renames and a guard against rude names turning up in results. The easiest build, 2 sessions:
~~**Session 1, the list**~~ done 2026-10-17 on `claude/exciting-cray-y585nt` (pushed to `main` too; `docs/roadmap-done.md`,
details in `docs/reference/cloud-save.md`'s Trainers section): the trainer doc (it already carries `base`, the
`secretBase` as JSON), friend codes, `save.friends`, adding by code or a leaderboard name, the Trainers app, the tip and
the PC letter. **Its rules wait on the user** (Waiting on the user, below).
~~**Finding each other without meeting**~~ done 2026-10-17 (the user's ask, same day; `docs/roadmap-done.md`): the
Trainer Plaza, an "Added you" banner and the TRAINER LINK pop-up when someone adds you (the user saw a screenshot before
it was pushed). Same rules file, so one publish covers both. Then (same day) the TRAINER NETWORK welcome on the app's
first open and the Plaza's 3D board in the Clearing, merged with session 2's visits; the board and the quest board then
moved to the plaza's top corners (the user's marks). Branch
`claude/exciting-cray-y585nt`, pushed to `main` on the user's OK. **Next: the user publishes `firestore.rules`** (Waiting
on the user) **and playtests it on two signed-in devices.**
~~**Session 2, the visit**~~ done 2026-10-17 on `claude/visit-only-base-session-2-72ayar` (pushed to `main` too;
`docs/roadmap-done.md`, details in `docs/reference/cloud-save.md`'s Trainers section): the Trainers app's Visit walks round
a friend's base as they left it, read-only (`openBase3d({ guest })`, every base write refused by `visitBase()`), checked
by `tools/trainers-check.mjs`'s save-unchanged test. Then (the user's picks): Visit house / Visit yard for a base with a
backyard, and their trophy cases as they last saw them at home. **Next: the user playtests it** (two signed-in accounts, or
`?base&asfriend` alone); a guestbook of stamps is still a maybe.
~~**Friends' graves and the Plaza's buddies**~~ done 2026-10-18 on `claude/friends-tombstones` (pushed to `main` too;
`docs/roadmap-done.md`, details in `docs/reference/cloud-save.md`): a lost run (Safari and Sky Pillar too) goes up on
`graves/<uid>`, friends find the grave where it fell (the very room on the Safari, the door on the Pillar, the same
floor elsewhere), a tap opens the loss recap with Pay respects / Avenge, and up to 4 friends' buddies walk the Trainer
Plaza. **Next: the user publishes `firestore.rules`** (Waiting on the user) **and playtests it** (`?graves=3`, or two
signed-in accounts).
Later: name search and Follow, then the rest of the 2026-10-07 phase 2: Dark Souls signs from phrase parts on map nodes
(best on the seeded Safari / Sky Pillar, rated for coins), a daily gift in a friend's Lost & Found (the user's pick to
build first), maybe an Assist (a friend's partner for one fight, bot-checked).
**Friend ideas saved 2026-10-17** (the user's pick of these: **the daily gift**, one item a day to a friend, built
first when friends work resumes; the rest just saved). Real email was ruled out: it needs a server (Cloud Functions on
Blaze plus a mail service), iCloud drops Firebase's mail, and it means using sign-in addresses. Instead, in-game:
Trainer Mail through the PC (Easy Chat-style phrase parts, a stationery pick, an optional small gift; rules shaped like
`adds/`), Friends tabs on the Safari / Sky Pillar / Arcade boards, the visit guestbook of stamps, and trading spare
furniture or Safari Pokémon (hardest: both sides must agree at once). All need `firestore.rules` published first.

## Ideas, not agreed yet (ask the user before building)

**After the balance pass: more content, toward StS's numbers** (2026-10-16; the user wants these on the roadmap, to pick
from after playtesting the pass). Where it stands: cards per type ~72 like StS (done bar Water's 1 rare and Psychic's 6
uncommons), neutral 28 (StS ~35 colorless), relics 93 (StS ~180), items 34 (StS ~42). Every relic added thins the pool
(the pass's 34 cost Grass ~8 points at Level 3 until retuned), so each batch ends with a relic recalibration
(`sim/calib-new.mjs`) and a human-bot check against `main` (docs/reference/cards.md's "The balance pass"). In order:
1. **Shop-only and event-only relics** (StS has ~35): the Mart and the ? events get rewards of their own without
   thinning the fights' drops. Needs a `shop: true` / `event: true` tier that `relicChoices()` skips.
2. **More boss relics with a catch** (13 now, StS ~25), for a bigger pick after each boss.
3. **Curses**: StS's junk cards you keep for the run as a strong reward's price (a run-deck status card), which opens risky
   events and relics. A new card kind: never offered, removed only by forgetting or a relic.
4. **The last cards**: Water's 16th rare, Psychic's 6 uncommons (to 36), ~7 neutral (to ~35).
5. **Enemy variety** (the biggest gap now): StS's enemy tricks, such as Artifact (blocks your next debuffs), splitting,
   enemies that buff each other, fights with two or three enemies. Every fight is one enemy cycling its moves today.
   Engine work in `js/battle.js` and the sim, then enemies retuned.
Each is ▶ Run in: CLOUD (both repos), one per session, with art, `describe()` / `cardTerms()` lines and the sim mirror.

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
  e) visiting another trainer's base: now "Friends list and base visits" under Open, ready to build;
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
     d) ~~**The east front**: the Safari Outfitter~~ done 2026-10-15, made a grand safari lodge the same day
        (`docs/roadmap-done.md`). **Next**: the user playtests it (`?mall=outfitter&safari&coins=3000`) and says what to
        change. Poké Balls are still also sold in the Pokédex's Game Corner app and the Safari prep window's Buy key: say
        if they should move to the Outfitter only. ▶ Run in: CLOUD.
- **Ranger Task Board and Trainer's Journal**: built and rebalanced 2026-10-16, with the Trainer furniture set and the gold
  shell, and its cases sparkling with news when you come home (`docs/roadmap-done.md`). **Next, if wanted**: a reward per Ranger rank, more tasks, seasonal Expeditions.
  Waiting on the user's playtest (`?base` to see the set once claimed). ▶ Run in: CLOUD.
- **Safari daily modifiers** ("all Pokémon are Water today", "Burn does double"), maybe tied to the clock.
- **More main-game Pokémon** (~70, per biome 3 wild, 1 elite, 1 boss). Candidates are in `docs/roadmap-done.md`'s
  Pokémon list; re-check each against the rules below before using it.

## Parked (don't start unprompted)

- Battery Saver (a Settings switch: 3D at 30 fps, backdrops at 15): built and taken out the next day, the user's call (2026-10-16: "keep it 60fps for now"). `git cherry-pick dc3e47e` brings it back whole, `slowFrameMs()` included.
- Gen 6-9 starters: the sprites staged in `assets/pokemon/_incoming/` have no Grass line, and they aren't official Gen 5 sprites (the rules below).
- Catching in the main game: dropped (the user's call, 2026-09-27). Only the Safari Zone catches.
- Game Corner skins Budew, Sewaddle, Lotad, Horsea, Spheal, Tympole: the user said no. Don't re-add them.
- A Safari "zone legend" (a weekly Pokémon catchable only on the last floor): the user said no, 2026-10-03.
- Friends phase 2 (signs, Lost & Found gifts, an Assist; the graves are done): see "Friends list and base visits" above.

## Waiting on the user
- **Friends' graves** (2026-10-18, branch `claude/friends-tombstones`, on `main` too): paste the new `firestore.rules` into
  the Firebase console (Firestore Database > Rules > Publish): it adds `graves/`. Until then a lost run is kept in the
  save but friends can't see it, and nothing else changes. Then playtest: `?graves=3` on any run's map and in the
  Clearing (made-up friends, nothing saved), or lose a run on one signed-in account and look on the other's map.

- **Smoother transitions, on a phone** (2026-10-18, the user's ask; `docs/roadmap-done.md`): a new run's Clearing film,
  its first wild fight's wipe, the Shrine's and Wastes' films (biome and place) were measured headless and fixed. The
  user plays a new run on their phone and says whether the first fight's wipe and the films still stutter. Not fixed:
  the ~0.45 s freeze before a new run's film (the map, scenery and film painted at once) and the crossroads' ~0.4 s
  build behind its plain backdrop; next levers if they're noticed.

- **The phone reloads, round six** (2026-10-18, branch `claude/funny-pascal-bu8emp`, on `main` too; archive): round five's
  next levers, done: 2x multisampling on touch screens, songs decoded only up to their loop's end (four battle and gym songs
  loop sooner, the same repeat), a town's ground at 2048 px, two rooms kept (the town you're in always). Headless at an
  iPhone's size: a town 215 -> 183 MB, the gym 128 -> 106, a boss fight 79 -> 46. The friend plays as usual (the Home Screen
  app too) and, if it reloads, reads Settings' Save card ("The game reloaded by itself", shown only after one). The user
  listens to the boss, wild, elite and gym songs loop and looks at a town's ground. Next levers if it still reloads: the
  smooth paintings' canvases kept on the CPU beside their textures (~40-60 MB a town), the full-screen DOM layers (the probe
  can't see them), a 32 kHz song decode (~3 dB off at 10 kHz in Safari, so not done).

- **The Arcade Room's look** (2026-10-17, branch `claude/charming-edison-0yf3mg`, on `main` too; the user's "build it"
  after a mock-up, `docs/reference/hub-base-mall.md`'s "The Arcade Room"): all 22 arcade machines moved out of the Game
  Corner into a 15 x 10 room through a lit ARCADE doorway in its right wall (rows 6-7), Porygon at a FREE PLAY desk, the
  weekly leaderboard over it, the GAME CORNER sign back down over Meowth. Headless at an iPhone's size: the Game Corner
  83 MB of textures before, 55 after, the Arcade 54, only one loaded at a time. My picks, said to the user: Porygon; the
  leaderboard moves; the Game Corner's freed spots stay open; four cabinets on the left wall, not a middle row; no
  regulars in the Arcade yet (their lines all talk to Meowth). The user walks it (`?mall=arcade&coins=5000`) and says
  what to change.

- **The Grand Ballroom's look** (2026-10-16): the Furniture store's 3F, selling gold starter statues and six Pokédex
  shells (`docs/roadmap-done.md`). The user looks at the Ballroom (`?mall=3f&coins=20000`), a statue in the base and the
  shells, and says what to change. (Coins were rebalanced the same day: a won run pays 200, the Game Corner 250 a day.)

- **The Sky Pillar's new look in the Clearing** (2026-10-15, the user's ask: "a big change aesthetically"): the box is
  now Hoenn's tower in 3D (`js/hub-pillar.js`; docs/reference/hub-base-mall.md). Checked headless (no errors, frame rate
  unchanged); the user looks at it on their phone (`?hubat=28,-1`, `&time=night` for its glow) and says what to change.
  **The revamp's next parts, in the order I recommended (2026-10-15; the user said yes):** 1. the arena is **done and
  live** (the user approved it 2026-10-15, merged to `main`; archive). 2. **Done and live** (the climb's painted tower repainted in sage stone and jade, the user's yes 2026-10-15, merged to `main`; archive). 4. The lobby's window onto
  the tower, taken before 3 (the user's "just choose", 2026-10-15): **on `main`**, the user looks at it on their phone
  (Sky Pillar Pokéstop in the Clearing; also the shorter week line and the plaque's empty rows; archive). 3. The opening
  film (`js/climb-intro.js`): the first shot is the new crown, the door scene the new porch with Rayquaza's ring and jade
  light: **on `main`**, the user watches it on their phone (archive). That was the revamp's last part.
- **Intro films on the phone** (2026-10-14): the Safari Desert and Overgrown Shrine films were cut from 9-18 ms a frame to
  2-3 (archive); the user watches both on their iPhone and says if they still stutter.
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
