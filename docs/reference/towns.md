# Gateway towns

Moved out of CLAUDE.md on 2026-10-14 so every session loads less; the text is unchanged. Dates are when each call was made: where two notes disagree, the later one wins.

- **Gateway towns** (2026-10-13; the code is on `main` since 2026-10-14 with the new Clearing, but **switched off** till the user says: `TOWNS_LIVE` / `townsOpen()` in `js/data/towns.js` (off: no town after the journey film, no requests counted, the Clearing's Waystone only reading `RIDDLES`), `?towns` on for a page load, `?town=` peeks either way; their patch lines wait in `TOWN_NOTES` in `js/data/patchnotes.js`, back into `NEXT` when they go live; `docs/roadmap.md`'s Towns and Waystones): the
  biome ahead's town is walked after the journey film (`walkOn()` → `townRoom()` in `js/run.js`, saved as `run.town`),
  never on Mewtwo's or a Safari run. Its data and request rules are `TOWNS` in `js/data/towns.js`, the save side
  `js/towns.js` (`save.towns[id]`: `done` friendship, `got`, `ready`, `met`), the room `buildTown()` in `js/event-3d.js`
  (kind `town`, laid out from `town.map`, a tile map like a Pokémon town's, the user's ask after their picture; its far gate
  is `R.exitAt`, its houses' doors `R.doors`, its folk `townCrowd()` on `makeCrowd()`, its camera higher, `pitch`). Houses
  with a `home` are walked into (`homeRoom()` in `js/run.js`, kind `home`, `HOMES` in `js/event-3d.js`: Delibird's shop
  holds the trade, the Gym Leaders are at home, `R.talks`), the rest knock. A town makes no run stronger: one sidegrade
  trade, requests paying PokéCoins. `?town=shrine`. Since session 3 (2026-10-13) the Wastes' **Cinder Springs** too (`?town=wastes`):
  a town's `style` picks its dress (`TOWN_STYLES` in `js/event-3d.js`: ground tints, flowers, litter, forest, houses, gate,
  lamps, what drifts; the Shrine's is `village`, the Wastes' `springs`: `crags()`, adobe `cabin()`s with smoking chimneys,
  `mineGate()`, `minehead()`, `springs()` on `o` tiles, `puffs()` of smoke and steam), its map tiles `= c k o` (rails,
  crate, barrel, spring) beside the village's; `HOMES` is by town (`leaderAt`, `castAt` for the bathers, `stage` for the
  theater), a home's `cast` its Pokémon to chat to, `nightAt` / `nightSub` / `night` its leader's evening (Jahmes asleep
  at 23, Clarence live at 21). Since session 4 the Ruins' **Driftwood Landing** (`?town=ruins`, `style: 'lagoon'`): a ring of boardwalk on stilts over the lagoon round the temple's island, the ground cut away over the water (`holes`, its tiles `~ - | y n`), a style's `ground` / `extras` hooks, homes' `walls` (`boards`, `aqua`) and a home's `names` (Kayl's cats). Every town gets its own layout, not a copy (the user's ask). Since session 5 Thornwood's **Highbough** (`?town=thornwood`, `style: 'canopy'`): a village in the treetops, round platforms on giant trunks scattered over the drop and joined by rope bridges two tiles wide (`-`, slats with gaps you see through, hand ropes sagging, netting; `bridgeAxes()` tells a lane's way from its reach; the user's ask, 2026-10-14: a big Pokémon hung off one-tile ones), a rope railing round every deck over the drop so where you can walk reads at a glance, a ghost town (the user's call, 2026-10-14: every townsperson, Mismagius's Curio Shop and the Withered Nursery's sleepers are Ghost types, will-o'-wisps drifting), the jungle floor far below (`DROP`) under two layers of mist tinted by the hour; `canopyGround()` / `canopySupports()` (a trunk under each platform, struts, a rim curving round rounded corners, `ROUND`) / `canopyRim()` / `jungleFloor()`, lone giants (`|`), lifts (`y`), `treehouse()` (since 2026-10-14, the user's ask: "lame", round log huts built round their tree, a railed porch, round door and windows with shutters and flower boxes, a flared leaf-shingle cone banded in the house's colour, the tree out of its top into a crown, moss off the eaves; `tree: false` a spire), Phil's and Ricky's homes `canopyManor()`s on 5 x 4 lots (the handoff's item 12: a railed plank podium up steps, a log hall with a gold-collared veranda, a crest gable over the steps, a terrace railed in `GYM_INK`, banners; Ricky's a round den round a living tree, its window band cycling colours, a dish, fairy lights; Phil's `haunted`: violet windows, a leaning gabled storey, a witch-hat turret, a dead tree hung with violet lanterns, candles), the `nursery()` a ruined Victorian conservatory (a glass rotunda under a ribbed dome between barrel-vaulted wings, grime, ivy, dead plants, ghost wisps inside), `greatTree()` (its deck in rings of planks), `vineGate()` (the Bough Gate since 2026-10-14, the user's ask: "more grand": a living arch of two trunks on flaring roots, crowned, ghost-blooms, ghost-lanterns swaying, wisps circling, `B.reach` 2); lanterns only in platforms' outer corners and planters only by the Nursery (the user's ask, 2026-10-14: they stood in the walkways); every crown (`crown()`) fades while your Pokémon is behind it (`B.crowns`), so a tall town never hides you; homes' walls can be `dusk` / `glass`. Since session 6 the Savanna's **Sunwell Bazaar** (`?town=savanna`, `style: 'bazaar'`): a caravan trading post, one dusty road straight across the map on the diagonal (its wheel ruts one pair of grooves down its middle, `savannaGround()`), the market where it crosses the middle round the Waystone (a bazaar square since 2026-10-14, the user's ask: "lame and dinky" stalls; a run of `n` is one long stall, a column of them faces in, `bazaarStall()`, kilims on the floor; the leaders' `s` boards `bazaarBoards()` in their colours; Persian's tent a marquee with a Poké Ball on top; every other town's trade house a `tradePost()` beside it, a turning Poké Ball and a TRADE board, `g.userData.signed` skips it), the watering hole cut into the ground (`~`, `holes`, `wateringHole()`: a mud bed, still water, banks, reeds and bulrushes, the jetty `-` on posts), round mud huts under conical thatch (`rondavel()`; a Gym Leader's is a `kasbah()` since 2026-10-14: red mud on a plinth, Djenné buttresses with ostrich eggs, a portal with their crest, a gilded dome, banners, on a 5 x 4 lot with an `s` name board; the road three wide, the jetty two wide and railed, pale stones round the watering hole, `fade` on, huts a and d gone), Persian's striped tent (`bazaarTent()`), the sandstone `caravanserai()` (walked in: the caravans' Pokémon resting), `wagon()`s (`kind: 'wagon'`, locked), the `windpump()` and `kopje()` landmarks, the bush of acacias, baobabs and termite mounds (`savannaBush()`; `|` a lone acacia in town), the `sunGate()`; homes' walls `tent` / `sandstone` / `mud`. `&home=<building id>` on `?town=` walks straight into that house (`peekTown()`; `&gymwins=1` puts the leaders at home). A new town is a `TOWNS` entry, a style (or the village's), and a `HOMES` line a home. **The Waystone and visits from home** (session 2, 2026-10-14; the Clearing grown to 20 x 16 for it, `X0` / `Z0` keeping the back where it was): one Waystone on the plaza's Poké Ball (`clearingWaystone()`, on `START`'s tile; one, not five, the user's pick 2026-10-14), five crystals orbiting its tip, one a town in its `RING` colour (`RING` in `js/data/towns.js`, a later town a line there), each lit once its town's friendship mends its Waystone (`MEND_AT`, `isMended()` in `js/towns.js`, the town's own Waystone whole then, `wholeWaystone()`), the worn ring path round it (`RING_R`), its menu's step a tile in front of it (`SPAWN`); your buddy walks in from the gate to the north avenue's crossing with the ring road and first stands there (`ARRIVE`, 2026-10-14, the user's ask); a tap opens its menu (`showWaystone()`, `.hub-card.way`: the Pokédex shell round a green LCD, a town a row, mended ones with Travel, met ones their friendship n/5, the rest ???), and Travel walks your buddy there outside any run in a column of the town's light (`warpTo()` in `js/hub-3d.js`; the town's end of it since 2026-10-14 `townWarp()` in `js/event-3d.js`: the same beam sets you down by its Waystone and lifts you home whichever way you leave, and a visit never walks on into the biome → `onTown` → `visitTown()` in `js/run.js`: a throwaway run that saves nothing of itself, `visiting` / `isVisiting()`, but requests, buys and invites are real), and its Waystone, far gate or Leave bring you home in front of the Clearing's Waystone (`goHome('waystone', town)` → `cameHome()`). On a visit the trader's Shop sells the town's furniture shelf (`js/town-shop.js`, `SHOP_SHELVES`, never in the mall's stock), and a tapped townsperson asks once to move into the Secret Base (`inviteFolk()`, `save.townsfolk`, `resident()` in `js/pc.js`). The Clearing's own houses are `CLEARING` (the Nietos', `LEADER_HOMES.nietos` in `js/leader-homes.js` since 2026-10-14, `visitTown(…, 'clearing', …, 'nietos')`); the house always stands, but the Nietos (and their Kangaskhan) are home only once THE NIETOS are beaten at their Gym, and since 2026-10-14 not at all, **switched off** while the user works out how they turn up (`NIETOS_LIVE` / `nietosHome()` in `js/data/towns.js`, the home's `out` line, and `leaderVisitor()` leaves them out of Secret Base visits; `?nietos&gymwins=1` brings them home for a page load); Kenmatta's dojo beside it is COMING SOON (`dojo()`).

**Lantern Village cleaned up** (2026-10-14, the user: "a lot of houses"): a shrine's approach, one 4-wide avenue from the
way in to the torii between pairs of stone lanterns, the Waystone's plaza halfway up, two cross lanes, only four houses
plus the Dance Theater and pagoda (backed onto the forest). The village style now has `holes` (the koi pond, `~`, cut
from `townGround()`, its rounded corners and pebble lip there), `extras: villageExtras` (pond bed, jade water, banks,
rim stones, irises, lily pads, seven koi on one instanced mesh; the vermilion bridge `-`: planks painted on the ground,
railings arching along it on posts to the bed, gold caps; `n` an indigo name board by a named door, `nameBoardArt()`),
`fade: true` (`fadeBehind()` in `buildTown()`: a building goes see-through while your Pokémon is behind it), and `|` a
lone maple in `forest()`. The theater's sign is bigger. **Gym Leaders' manors** (2026-10-14, the user's ask: "more grand and extravagant and
aesthetic", for every leader to come): `house()` hands a home with a `leader` to `manor()` (a 5 x 4 lot: stone podium
and steps, vermilion veranda, gold-leafed upper storey, a gold jewel on the top ridge, a gabled porch with the crest and
a sacred rope, stone lanterns, paper lanterns and `noboriArt()` banners in the leader's `GYM_INK`); every other town's
leaders get a grand home in that town's style at its clean-up (the handoff's item 12). `?town=<id>&aerial` shows a whole town from above (`aerialShot()`).

**Townsfolk mostly stand** (2026-10-14, the user's ask: "let only one or two move at a time"): `townCrowd()` passes
`walkers: 2` to `makeCrowd()` (the cap that generalises the Game Corner's `oneWalker`); the rest wait at their `stands` or
where they last stopped until a walker arrives.

**Cinder Springs cleaned up** (2026-10-14, the user's ask: fix what the map review found plus the handoff's checklist):
the switchback kept, its right legs a tile left (`gate.x` 28) so the right strip has room; four locked houses (a, k, n,
e; j, d, g and p gone), the crag stubs and the stray two-tile pool in the middle taken out, the outcrops kept only
against the back wall; the Waystone centred on its plaza (`W` x24-25). Clarence (top terrace) and Shaun (lower terrace)
live in `lodge()`s on 5 x 4 lots, `cabin()` handing a home with a `leader` over: a two-storey adobe lodge on a basalt
podium up steps, beam ends and a `GYM_INK` band, the flat roof a railed terrace, an upper storey with a gable to you
and the crest, a steaming stack, braziers at the steps, an awning and `noboriArt()` banners. The springs style now has
`fade: true` and `extras: nameBoards` (the `n` boards, split out of `villageExtras()`); `cabin()` no longer hangs its
small name plate.

**Cinder Springs a lava field** (2026-10-14, the user: "bland", "a lot of homes", "something cool how you did the
thornwood one", and no road to the bathhouse): the springs style has `holes: true` and `extras: lavaField`, so `~` is
lava there: one plane at `LAVA_Y` under the ground's holes (`lavaArt()` glowing, `crustArt()` plates drifting over it,
both repeating textures moved by `.offset` in a tick), basalt banks and rocks along its edges, bubbles (one instanced
mesh), smoke `puffs()`, and the lavafall where the lava's top row meets the crags (a curved sheet sharing the lava's
texture, a basalt cliff behind; `crags()` leaves the tiles in front of it bare). `-` is a basalt bridge: the style's
`bridge` colours paint it (`townGround()` falls back to the village's planks and vermilion), a slab under each tile,
iron rails on posts along its sides over the lava, ember lamps on the end posts (in `lit`). The map: lavafall top
centre, the river crossing the top leg on a bridge, a moat round the Waystone's island (bridges in from road E's side
and road D), on out at its far corner under roads D and B; the mine top left, Clarence's lodge top middle, house a top
right; the bathhouse mid-left on its own road (rows 20-21) with its springs (`o`) below it; the forge and Shaun's lodge
bottom middle, house e bottom right. Houses k and n are gone.

**Driftwood Landing cleaned up** (2026-10-14, the user's call: fix what the map review found plus the handoff's
checklist): the ring kept as the Landing's shape but drawn plainly, a square of boardwalk two tiles wide round the
temple's island with two tiles of water between them and a pier in from each side; every spoke two wide; the ring's top
runs on as a promenade to the beacon (top left, tall, at the back) and Kayl's; the aquarium and Pat's boat sit north of
the west and east spokes so they never stand between you and the camera at their doors; four locked huts (a, p, x, y;
g, e, j, m, n and d gone, a few of their knock lines kept on the rest). `lagoonSupports()` now rails every boardwalk edge
over the water (a wooden top rail and a rope, posts at the ends, open where a houseboat's gangway lands) and
`lagoonGround()` paints a pale trim inside it, Highbough's idea. The lagoon style has `fade: true`. Its name boards are
`s` tiles (`n` is a net drying there; `nameBoards(town, at)` takes the letter, and `tests/towns.test.mjs` knows `s`);
`stiltHut()` no longer hangs a small plate, and the aquarium's sign is part of its group so it fades with it. Kayl lives
in a `stiltManor()` (5 x 4: a raised deck up steps, a veranda on posts in her `GYM_INK` with gold bands and a railing,
glass-float lanterns, a deep thatch with an upper storey rising out of it under a second thatch, her crest on its front
slope, a gold spire, lavender planters, banners on mooring poles clear of the eaves); `stiltHut()` hands any home with a
`leader` to it. Pat's `houseboat()` is a two-deck riverboat on a 6 x 3 lot: a stripe and gold rub rail, his crest on
the hull and over the wheelhouse eave, the upper deck railed in his colours, a paddlewheel turning at the stern, his
banners on mast and flagstaff, fairy lights (three instanced meshes, `instancedIn()` for things inside a rocking group),
a hammock and the rose in a bottle; its gangway runs to the door's side of the boat.

**Driftwood Landing's homes, trade house and gate** (2026-10-14, the user: the other homes "more cool and aesthetic,
especially the trade house, and the exit"): `stiltHut()` now only builds the aquarium and hands the rest on. The locked
huts are `bungalow()`s: a raised plank deck up two steps, woven-bamboo walls (`wovenArt()`) between bamboo poles, a lit
front with a round-topped door and porthole, shells strung over it, a shuttered window and a hibiscus box
(`bungalowFront()`), a porch railed in bamboo, glass floats lit in the house's colour under the front eave, a surfboard,
a potted palm, the net and floats; the roof two tiers of thatch with straw hanging off the lower (`fringeArt()`), or a
house's `shape: 'saddle'` (a and p) a saddle roof swept up into horns at both ends, its gables painted in diamonds
(`gableArt()`). Pelipper's is a `baitShop()`: sea-glass lap boards (`clapArt()`), white trim, a tin roof with its gable
to you and the Poké Ball crest in it, a copper fish weathervane, a striped awning with a scalloped hem (`awningArt()`)
and ship's lanterns over the door and two lit windows (`baitFront()`), a life ring, bait barrel and crates; an open fish
stall beside it under a striped lean-to (fish on ice, rods racked, the fish-shaped BAIT sign standing on its edge,
`baitSignArt()`), a stovepipe smoking (the lagoon's `house` now passes `smoke`), a mast with Pelipper's flag and
bunting to the vane. Textures shared by a town's homes sit on `B.lagoonKit`, materials stay each house's own (`fade`).
The exit is the drowned temple's great gate (`templeArch()`): pillars on stepped plinths banded with waves and runes,
corbels at the opening's top corners, a three-tier crown with a carved frieze of waves and runes (`friezeArt()`), the
name tablet, a wheel medallion whose runes turn (`wheelArt()`), braziers of blue spirit-fire on its shoulders, pale
light hanging in the opening (`templeVeilArt()`), a glowing mosaic on the paving under it (`mosaicArt()`), broken
columns either side (their tiles blocked), coral, shells and kelp; it's taller, so it sets `B.reach` 2 like Highbough's.

**Cinder Springs' roads and houses** (2026-10-14, the user: Shaun's lodge stood in front of the Waystone, the other houses
needed better designs, the trade house most, and every road should reach a house): Shaun's lodge is east of the moat
(x 30-34, rows 16-19) on a drive up from road D; a two-wide road runs straight down from the Waystone's south bridge to
road A where it stood; every door has a road to it (the mine's beside its rails, Clarence's, house a's, the forge's, house
e's; `tests/towns.test.mjs` checks each door is on or by a `#`, and nothing stands below the Waystone). `cabin()` hands
each house on: `bathhouse()` for the bathhouse (2026-10-14, the user: the old adobe box was "so stupid looking": a sento,
wide and low, timbered plaster under a kawara roof with a ridge steam vent, a curved `karahafu()` porch with the ♨ crest,
its sign and noren, red lanterns, a tall round brick chimney at the back),
`lodge()` for leaders, `forge()` for the shop (a fieldstone smithy, its arched mouth glowing, its FORGE sign under the
eave, a tapered brick stack spitting embers, a lean-to over the anvil, hearth and quench tub), `cottage()` for locked
houses (stepped adobe, beam ends and a parapet, an upper room under a gable, a ladder, a tiled porch, chillies, lilies).

**Questlines and the Satchel** (session 1 of Towns step 6, 2026-10-14; `docs/roadmap.md` has the plan): each town's
board runs a questline before its coin requests. `QUESTS` in `js/data/towns.js` (pure, `tests/quests.test.mjs`): a town
is quiet (`st.quest` null, nothing counted) till one of its leaders has a Gym win (`greeterOf()`); the next pass through,
`townRoom()` in `js/run.js` has that leader slide in (`gymTalk()`, the town frozen meanwhile) with their `greet` lines
and opens it (`startQuest()` in `js/towns.js`). Steps in order: `track` (a missions event in the town's biome, counted by
`countTown()` from `trackTowns()`), `gather` (materials from the Satchel, taken on hand-in), `craft` (a key item from Kurt's
Workshop, kept), `shard` (the town's Waystone Shard; handing it in sets `quest.lit`, which `mended()` reads). Each is
handed in to its leader `by` at their house (since 2026-10-14, the user's ask; it was the board: `homeRoom()`'s Hand in, their
`thanks`; `{pick}` fills a `pick` step's choice), paying `QUEST_COINS`; `gives` puts a key item in the Satchel; a `pick`
step offers one option per choice there (`quest.picks`). While a questline runs its leaders are home, beaten or not. The
board says whose house to take it to. A shard handed in sets `t.mendNext` and walks you out: `townRoom()` shows the unlit
town and plays `mendScene()` (the stone waking, its card, its leaders' say), then the lit one.
After the shard the board's old `requests` rotate. A `?town=` peek keeps its questline on the run (`t.peekSt`), never the
save. **The Satchel** (`js/data/satchel.js`: `MATERIALS`, `KEY_ITEMS`, `satchelOf()`; `js/satchel.js`: `gainMat()`,
`gainKey()`, `satchelNews()`; the app `js/satcheldex.js` on `shelfApp()`, icon `satchel` in `js/smooth-icons.js`):
`save.satchel = { keys, mats, seen, fresh }`, kept on a lost run, never the run's Bag; on the Collection and the device's
"!" only while `townsOpen()`. `?satchel` lends every material and key item for a page load. Its shelves are Key Items,
Materials and Gifts: the questlines moved to their own app (below).
**Where materials drop** (session 2, 2026-10-14): only in a town's biome, while `townsOpen()`, never in a Safari area,
the Sky Pillar or a playtest (`gleaning()` in `js/run.js`). A won fight rolls `fightDrop()` (`DROPS`: a wild Pokémon 40%,
an Alpha 1-2, the boss 2-3), said first in the reward box and given as the rewards end (`collect()`); `markSparkles()`
lights 1-2 of a biome map's fight / ❓ / Center rooms (not floor 0) with `sparkle: { id, n }` (2-3), a pale ✧ over the room
(`.map-sparkle`), given on walking in and told back on the map. A `from: 'map'` material (Pat's Message Bottles) never
drops from a fight and takes a biome's first sparkle. Each gift is keyed in `run.gleaned` and written into the saved run
at once (`glean()`, `creditRoom()`'s way), so a refresh can't give it twice. All rolls go through `js/rng.js`. About 10 a
biome a pass, so a gather step is a run or two (`tests/quests.test.mjs` checks it).

**Kurt's Workshop** (session 3 of Towns step 6, 2026-10-14; only while `townsOpen()`). A timber workshop in the
Clearing's north-east (`WORKSHOP_AT` 23,6 in `js/hub-3d.js`, `kurtWorkshop()`, its path down to the east avenue a `towns:
true` road; Halloween's pumpkin patch moved either side of it), walked into like the Nietos' house: `CLEARING.buildings` /
`homes.workshop` (`kurt: true`, a Slowpoke cast) in `js/data/towns.js`, `HOMES.clearing.workshop` in `js/event-3d.js`
(`kurtAt`: Kurt, `assets/trainers/kurt.png` drawn for it, is the room's spot 0 like a shop's keeper). His window is
`openWorkshop()` in `js/workshop.js` (tabs Quest / Furniture / Gifts / Apricorns, tap a recipe, Make); recipes are
`RECIPES` in `js/data/workshop.js` (pure, `tests/workshop.test.mjs`), each `needs` materials from the Satchel, and
`shows()` gates them: a quest item once its town's questline is open, a town's two pieces once you've been there (`met`;
John's festival piece only for the festival picked), a gift once its leader is beaten, the seven Apricorns always. Made:
a key item into the Satchel; a piece is earned furniture (`from: ['craft', recipe]` in `js/data/furniture.js`, so the
town shop no longer sells it, and `towns: true` keeps it out of the base's locked list while the towns are off); a gift
is counted (`save.workshop.gifts`); a skin is kept (`made`) and carried (`skin`). `save.workshop = { made, gifts, liked,
fond, skin }` (`workshopOf()`). **Gifts**: one favourite a town Gym Leader (`FAVOURITE`); at their home, awake and in,
holding any gift, a Gift sign stands beside them (`gift` on the room, its key `:gift`; `pickGift()` / `handGift()`): any
gift +1 `liked`, their favourite +2, and the first time `fond`, earning their signature piece (`sig`, `from: ['gift',
leader]`). Liking does nothing else yet. **The Nietos too** (2026-10-15, the user's call: they "should definitely get gifts and provide furniture"): their gift is the Acorn Rattle (3 Whisper Acorns, 1 Glowmoss, from the Clearing biome), given in their house even after seven (only Linc sleeps; the other leaders take none asleep), and it earns the **Big Kangaskhan doll** (`bigkangaskhandoll`, a new `DOLLS` / `PLUSH` line with a joey in the pouch, `EXTRAS.joey` in `js/base-dolls.js`; its small doll sells in the mall like the rest). `gifteeOf()` in `js/data/workshop.js` names them Law and Britt. **Apricorn skins** change only the Safari Ball's sprite (`looks()` in
`js/battle.js`: the picker and the throw), never its odds. The Satchel app has a shelf for them, Gifts. The `?satchel` loan
counts toward a recipe's needs, and what's made is saved (a playtest save only).

**The Clearing's curve in every town** (2026-10-14, the user's ask: "the animal crossing log style thing applied to ALL
towns"). A town rolls away like the Clearing, at its strength (`CURVE`, exported from `js/hub-3d.js`; `?curve=N`, flat
under `?aerial`). In `js/event-3d.js` (by `AERIAL`): one uniform `BEND` `{ k, z }`, `k` set to `CURVE` when a `kind:
'town'` room is shown and 0 for every other room (so a house's inside, a ? room and a gym stay flat, and your Pokémon,
whose material is always bent, draws straight there), `z` the shot's focus (`camZ`) every frame. `room()` bends a town's
`B.group` and `B.who` once after its build and before `warmShaders()`, so the cut shapes are the only ones sent to the GPU;
`mountEvent()` catches anything added since, and the crowd's boards are bent as they're made (a wrapped `monBoard` in
`townCrowd()`). Nothing runs per frame but setting `z`. `bendFine()` cuts big boxes and planes; `fineTris()` halves any
other shape's triangles (a rounded box's top, a gable, a pond, an instanced railing's ropes, measured by its longest
instance) till none is over 2.2 tiles, with a triangle budget, as a manor's plinth top sagged a fifth of a tile under its
walls (about +13% triangles in Lantern Village). Taps and drags go through `tapRays()`: the screen's ray in 1.5-tile
pieces put back where they stand unbent (`unbend()`), reused, not made per move; `hitsOf()` and `floorHit()` take the
nearest piece that hits. The floating signs (`placeSigns()`) and the folk's bubbles (`drawn` handed to `makeCrowd()`) are
placed where things are drawn (`drawn()`). Far things drop below the horizon (12 tiles off sinks ~4 tiles), so a far
door or the gate can't be tapped until you walk nearer, as in the Clearing.

**What lies past each town: `js/town-backdrop.js`** (2026-10-14, the user: "refix the backgrounds of each town,
mostly the exits, and make them all grand and aesthetic and animated... i understand the green choice but make it work...
some clouds need to be higher too or cover much more vertically"). `buildTown()` still calls `wild(..., { walled: false })`
(no back wall, no `skyDome()`, side walls `bare`: trees only). The first fix that day stood the Clearing's vista painting on
the back edge, but the bend sank it out of sight from most of the town, leaving a flat colour for a sky. Now
`townBackdrop()` builds a rig that hangs 128 units off (inside the camera's far plane of 140), square to the camera, and
`place()` (called from `frame()` once the camera has moved, as `R.sky.place`) sets its horizon on the crest of the rolled
ground every frame (the highest point on screen of the bent ground from the bend's focus to the back edge) and scales it to
the band of sky above (`sc`, clamped 0.42 to 0.85 of the screen's half-height). It and its meshes carry
`userData.noBend`, which `bendOne()` skips. Layers back to front: the sky (gradient, stars), towering cumulus that climb
from just over the horizon right up the sky plus high cirrus (`CLOUDS` per town, drifting), the land with its landmark at
the painting's middle, lined up behind the exit gate (`FAR` 0.85 of the gate's screen x; the treeline follows it fully,
with a gap where the road goes on), what moves (additive glows that breathe, smoke and embers scrolling up through an
`alphaMap` mask, mist and birds drifting), then the treeline. Each town: Lantern Village a misty mountain with a pagoda and a
lantern stair, a waterfall, cedars and maples, a jade-pale horizon (the green kept, as haze); Cinder Springs a volcano with
lava flows, a smoke plume and embers under an ashen sky; Driftwood Landing open sea, karst islands and the drowned stepped
temple, a rainbow by day, gulls and glints; Highbough colossal trees in a green-gold haze, the Great Tree with decks and
ghost-lanterns, light shafts and wisps; Sunwell Bazaar a great sun (the moon at night) over the road between mesas, a snowy
peak, a caravan, acacias, birds and dust. On a phone it fills the top 35-40% of the screen, on a desktop about the top
fifth. About 5-6 MB of textures a town, painted once per visit; `dispose()` in `js/hd2d.js` now frees `alphaMap`s too.
Animation is one `B.ticks` entry, held still in calm mode. `?aerial` hides it.

**No green skies** (2026-10-14, the user: "maybe its the green sky i dont like"). The cedar look's sky (the Shrine, and the
Ruins, which inherit it) and Thornwood's were greens; both are blues now (`CEDAR` and `LOOKS.thornwood` in
`js/event-3d.js`), so every outdoor ? room and event under them reads as sky.

**The Gym Leaders' homes, inside** (2026-10-14, the user: "they're so small and very bland, we need to beef them up
ALOT"). A town home with a `leader` is built by `js/leader-homes.js`, not `HOMES` in `js/event-3d.js` (`buildHome()`
hands it the room's kit; the leaders' old `HOMES` lines are gone). Every one is 13 x 10 (`LEADER_SIZE`, `view: 8`, the
shot sliding round it as you walk; it was 9 x 7) with `shotTop` 3.1 so the wall's decor shows. A `LEADER_HOMES` entry:
`leaderAt` / `castAt` as before, `mood` (the room's hemi, sun and bloom; `leaderEnv()` dims it at dusk and night and
lets its glows carry it), its own `floor` and wallpaper (`paint`, both painted per leader, glowing bits on `f.shine()`),
`skirt`, `furnish` (Secret Base pieces, `mid` setting a two-wide piece on the middle of an odd-width room), `hang` (wall
pieces: the back wall at x, or a side one, `side: 'l' | 'r'` and `row`), `blocks` (the tiles its own props stand on)
and `props(K, P)` (P: the first of each piece laid, to set things on its top). Each house says who they are (the corners
in `docs/reference/gym-leaders.md`): John's kotatsu with three handhelds charging and a model jet on his desk, Jahmes's
bed side (a wall clock keeping your time, LIGHTS OUT at 11 in neon) against his RGB gaming side, Shaun's three monitors
(VOD, tickets, the boys in voice) and a pile of laptops tagged FIXED, Clarence's stage (velvet, SHOWTIME neon, ring light,
webcam, a turning disco ball, ON AIR lit at night, the boa on the sofa), Kayl's music corner, cat tree (Reya sits on top)
and lease renewals, Pat's fairy lights strung across the cabin and a rose in a bottle, Phil's chair rocking on its own in
a salt ring over glowing runes with seven candles floating, the tree up through Ricky's den and his sleep maths, Machew's
spotlit (plastic, $14.99) katana under a blood moon, Jerome's Vice sunset, eleven r/GTA6 tabs and the countdown taped
over the crib (days to 19 November 2026). While Phil is home, JONA stands in his back right corner (2026-10-15): the user's sprite (`assets/trainers/gym/jona.png`, Acerola's) as a figure like Phil's own (`with` in Phil's `LEADER_HOMES` entry, built by `npcBoard()` in `buildHome()`, lit a little by an emissive copy of her sprite), with a violet glow, a shadow and motes behind her (`jona()`). Three boards drawn in `js/leader-homes.js` (a Sprite, a board painted on load, one given its texture on load) all showed nothing on the user's phone, so she now uses the code that draws every leader. She stands far enough off the wall that her board, leaning back, clears it. The user dropped her turning round (2026-10-15); the crooked lamp moved to the front right corner for her. Two point lights a room at most; the rest glows. A rug or mat with no model is
now laid as its painting on the floor (`flatPiece()` in `js/event-3d.js`): the Nursery's web rugs and Persian's dune
rug showed nothing before. `tests/leader-homes.test.mjs` checks every piece exists, nothing overlaps, and every free
tile (and the leader) is reachable from the door. `?town=<biome>&home=<leader>&gymwins=1` walks straight in.

**The shard, the mending and leaders coming home** (session 4 of Towns step 6, 2026-10-14). **The marked Alpha**: once a
town's questline is up to its `shard` step and the shard isn't in the Satchel, `startBiome()` in `js/run.js` has
`shardHere()` name the key item and `markShard()` (`js/data/satchel.js`) put `shard: <key>` on one of the biome map's
Alphas (rolled through `js/rng.js`, saved with the map). The map draws a crystal in the town's `RING` colour bobbing and
turning over it (`.map-shard` in `css/screens.css`, `js/map.js`). Winning that fight says so first in the reward box and
gives the shard as the rewards end (`glean()` with `{ key }`, keyed `…:shard` in `run.gleaned`, so a refresh can't give it
twice); a lost run's Alpha is marked again next pass. Same rules as materials: towns on, never a Safari, the Sky Pillar
or a playtest (`?shard` marks one on a `?biome=` or `?town=` playtest, nothing saved). **The mending**: handing the shard in
at the board, its leader's thanks, then `mendStone()` in `js/event-3d.js` (you're frozen meanwhile): the crystal rises off
your Pokémon, floats over the broken stone and hangs, sinks into the crack as it blazes (`userData.boost` on the broken
`waystone()`), a flash, the stone swapped in place for `wholeWaystone()` (built into the room's kit, bent, its door spot
and fade kept), a ring of light rolling out and a beam going up (made far grander 2026-10-15, the user's ask, below); the room is re-keyed as the town's `:lit` one in `built`
(each room carries its `id`), so the board's redraw needs no rebuild. Under reduced motion only the swap. `B.stone` keeps
the stone's footprint and look. `?town=<biome>&mend` puts a peek's questline at its shard, ready, to see it.
**The waking, made epic** (2026-10-15, the user's ask: "a slide in dialogue for the gym leaders when we activate the
waystones... and a way more epic animation"). `mendStone(glow, onFlash)` now runs ~8 s: the crystal arcs over and hangs
spinning while a rune circle (`runeCircleArt()`) burns into the ground and 44 motes spiral in, the stone shudders as it
sinks in, then the flash (`onFlash` → `wayFlash()` in `js/gym.js`: a full-screen white-out in the town's colour and a
shake), two shockwaves, 40 sparks, a 40-tall pillar with a white core and the motes riding it up, the circle flaring out.
Then `wayCard()` (THE WAYSTONE OF / town / AWAKENS, a band sweeping open, a tap or ~3 s) and `awakenTalk()`: each
leader in `QUESTS[id].awaken` slides in in turn, glowing in the town's colour (`.gym-scene.awaken`, `--glow`, plate
WAYSTONE KEEPER). The Clearing's (`homeNews()` in `js/hub-3d.js`) gets a taller beam, a shockwave (`wave` in
`liveWarp()`), the flash, the card and the Nietos' `awaken` lines. Calm effects: no flash or shake, the card still.
**Leaders coming home** (this replaces `LEADER_VISITS_LIVE` being off): once a town is mended, `homeLeaders()` in
`js/data/towns.js` lists its Gym Leaders. One a UTC day stands by the Clearing's Waystone, left of it (`GUEST_AT`,
`standGuest()` in `js/hub-3d.js`, a place `guest`; its card says their lines): `todaysGuest()` in `js/towns.js` →
`waystoneGuest()`, the first time home after a mending the leader who put the shard in (`welcome`, a thank-you first;
tapping them sets `quest.welcomed`, `welcomeHome()`), else dealt by the day. The others drop by the Secret Base
(`leaderVisitor()` in `js/secret-base.js`, never today's Waystone guest), saying their `HOME_LINES` (no speaker names:
the base strips them); the GYM_GOLD visits stay behind `LEADER_VISITS_LIVE`. Tests: `tests/shard.test.mjs`.

**The Nietos' house, inside** (2026-10-14, the user's ask: the same revamp as the leaders'): `LEADER_HOMES.nietos`, so
the Clearing's house is 13 x 10 too (its old `HOMES.clearing` line is gone). Linc's nursery back left (the crib, Kangaskhan
beside it on [1, 1], a changing table with the baby monitor, toys, a puzzle mat, the big Pikachu plush, L I N C bunting,
a growth chart with KANGASKHAN off the top), the fireplace under the family's photos, Law's and Britt's desks side by
side (his party 4/5 WAITING ON LAW, her Sage, her phone on Pokémon, red and teal LEDs), the very tired couch (`sofa-ragged`)
facing the TV, a kitchen of fish sticks on the stove and Linc's drawing on the fridge, Britt's teacher desk under the
house's GOLD STARS chart (Law: "see me."), and Lego scattered everywhere. The kit's `away` (no leader figure) puts an
OUT! note on the fridge; from 19:00 on your clock (the home's `nightAt`) Linc sleeps in the crib in his Pikachu suit, z's
rising, the monitor's bars moving and a night light on, else his plush lies there. The gym posters (`nietosposter`...)
have no 3D model, so a walk-in room can't hang them.

**The questlines' dialogue** (session 5 of Towns step 6, 2026-10-14). Each town's `QUESTS` entry carries `talk` (per
step id: `nudge`, the step's leader's word added to the board's Quest sign while it isn't done, via `stepNudge()`, which
puts their name first unless the line has one, as Phil's PHIL / JONA lines do; and a list per leader of what they say
about that step at home), `after` (per leader, at home once the stone is lit) and `chats` (the folk's two-way talk once
lit). `homeTalk()` gives a leader's home lines: the topical ones first (`homeRoom()` in `js/run.js` starts its cycle at
them; asleep, the night lines still win), then their usual `leaders` lines. `folkChats()` puts the lit chats ahead of the
usual ones; `townRoom()` hands them to the room as `extra.chats`, and the crowd reads `R.chats`, one array per room
refilled on every visit, so the mending's redraw changes what the folk say without a rebuild. `{pick}` in any of it is
the pick made (`questLine()`: John's festival, or the pick's `fallback`, "autumn festival", before one or on a save
mended by the old requests). `HOME_LINES[id]` is a list of speeches (4 each, several about the other leaders):
`waystoneGuest()` deals one a day (`speech`; the welcome is the first), the Secret Base picks one a visit. Tests:
`tests/quests.test.mjs`, `tests/shard.test.mjs`.

**Highbough's name boards** (2026-10-14, the user: "legible aesthetic signs for gym leaders and trade house"): `s` tiles by
Phil's, Ricky's and the Curio Shop's doors; `boughBoards()` (from `canopyExtras()`) hangs a walnut plank (`boughBoardArt()`: cream
letters, GYM LEADER in the leader's ink on a gold rim, the shop's TRADE HOUSE in violet) from a log bar with a ghost lantern;
`treehouse()` and `canopyManor()` no longer hang the small `nameArt()` plate.

**The Nietos' questline: the Clearing's Waystone first** (step 7, 2026-10-14). `QUESTS.clearing` runs on the towns' engine
with `CLEARING` (`placeOf('clearing')`) as its town, saved as `save.towns.clearing.quest`; every step is `by: 'nietos'` (LAW: /
BRITT: / LINC: lines, the gym's `voices`). `clearingLit(save)` is its shard put in, or any town's questline opened or
mended (an old save loses nothing). Till then `townRoom()` has no greeter (its board points home; a `?town=` peek ignores
it), the Clearing's Waystone is cracked (`clearingWaystone(g, lit, whole)`: a darker stone, a zigzag crack, its runes
flickering dim) and its card is `brokenWaystone()` (no Travel, the quest's n/4); once lit, the menu lists the Clearing
first. `homeNews()` in `js/hub-3d.js` runs as the Clearing opens (`openHub()`, `enterHub()`): beaten Nietos and no quest,
Law and Britt slide in (`gymTalk()`) and `startQuest('clearing')`; the shard in and not `welcomed`, a beam rises off the
stone (`warp.stone` in `liveWarp()`), the places rebuilt whole at its peak, and `welcomeHome('clearing')`. Steps are handed in
in the Nietos' house (`homeRoom()`: Quest / Hand in, `handInQuest('clearing', null, force)`, `force` under `?satchel`);
the shard's hand-in walks you out onto the plaza. Its Do step counts in the Clearing biome (`trackTowns()` reads
`placeOf()`; `countTown()` counts nothing once a board-less questline is done). Materials Glowmoss and Whisper Acorn drop in
the Clearing biome; Kurt's `waystone-chime` (4 acorns, 1 moss); `shard-clearing` floats over a Clearing Alpha
(`shardHere()`). `nietosHome()` is on with the towns (`NIETOS_LIVE` true and `townsOpen()`), `?nietos` for a page load.
The plaza's **quest board** (2026-10-14, the user's ask: nowhere said where the questline was picked up) stands on
`QUEST_AT` [11, 10], the PC's mirror, only while the towns are on. `boardNow(save)` is its state: `locked` (Nietos not
beaten), `new` (its one button, Read, is `takeQuest()`: the greeting, then `startQuest('clearing')`), `on` (the step,
its count and "hand it in at their house"; `ready` under `?satchel` or once had), then `towns` (every town's questline
under way, n/of). Its `line` and `buttons` are getters. Past `new` its button is Quest log (`questLog()`), and reading the notice opens it too. The "!" over it (`questMark`, `questMarks()`) shows for `new` or
`ready`. The Nietos' house has a Quest spot that starts the questline too, when it hasn't started and the Clearing isn't lit.
**The Quests app** (`js/questlog.js`, 2026-10-14, the user's ask: "an aesthetic window" for the board, and the quest
progress findable from anywhere): the Pokédex's own app, beside the Satchel, towns on only (icon `quests`, a cork board, in
`js/smooth-icons.js`; count `questCount()`, questlines done of 6). Kept simple (the user's ask, same day: "even more
simple to understand"): a cork board with the Waystones as crystals and "n of 6 quests done", then one big note, DO THIS
NEXT (`nextNote()`: a step ready to hand in first, else the first under way, in `LINES` order, the Clearing first): the
step, a bar of `stepHave()`, WHERE (`source()`, a few words) and THEN HAND IN (`handIn()`), or READY! HAND IT IN. Under
it, ALL QUESTS: one row a questline (leader, name, n of m steps, a chip: Under way / Ready! / Done / Locked); a tap
opens the same step card, its story and every step (later ones `???`), or HOW TO START for a locked one. The board opens it as
`openDeviceApp('quests', 'board')` (through the hub's `acts.onApp(id, at)`), and then it says it's in the Pokédex too.
A questline opened (`q:<town>` in `satchel.fresh`) is `questNews()`, the Quests icon's "!", not the Satchel's.
**The quest "!"** (2026-10-14, the user's ask): a step ready to hand in puts a bobbing "!" over its leader's name sign in
the town (the user's call: the sign, not the roof; `marks: ['door:<id>']` handed to `mountEvent()`, drawn by `markQuests()`
in `js/event-3d.js` at `B.signs[id]`, which `nameBoards()` / `boughBoards()` / `bazaarBoards()` record, the roof if a house
has none) and over them inside (`who:<id>`); the Nietos' the same, in the Clearing over their house (`nietosMark`) and inside. The
quest board's "!" is only for a notice to read now (`questMarks()`).
**Every turn-in goes to a leader, the board is for reading** (2026-10-14, the user's ask: "to push the player to explore
their homes"). A town's board opens the Quests app (`openDeviceApp('quests', 'board', false, again)`) once its questline
is posted, a "!" over it (`board` mark, at `B.boardAt`) till it's read once (`readBoard()` in `js/towns.js`: `st.board`;
a `?town=` peek keeps `t.boardRead`). After the questline the coin requests go to the town's leaders by turns
(`requestBy()`: `st.done` round `town.leaders`), handed in at home (`reqMine` in `homeRoom()`), a "!" over that leader's
sign; the Quests app shows a done town's request (`requestCard()`). While a questline has started its leaders are home.
