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
  at 23, Clarence live at 21). Since session 4 the Ruins' **Driftwood Landing** (`?town=ruins`, `style: 'lagoon'`): a ring of boardwalk on stilts over the lagoon round the temple's island, the ground cut away over the water (`holes`, its tiles `~ - | y n`), a style's `ground` / `extras` hooks, homes' `walls` (`boards`, `aqua`) and a home's `names` (Kayl's cats). Every town gets its own layout, not a copy (the user's ask). Since session 5 Thornwood's **Highbough** (`?town=thornwood`, `style: 'canopy'`): a village in the treetops, round platforms on giant trunks scattered over the drop and joined by rope bridges two tiles wide (`-`, slats with gaps you see through, hand ropes sagging, netting; `bridgeAxes()` tells a lane's way from its reach; the user's ask, 2026-10-14: a big Pokémon hung off one-tile ones), a rope railing round every deck over the drop so where you can walk reads at a glance, a ghost town (the user's call, 2026-10-14: every townsperson, Mismagius's Curio Shop and the Withered Nursery's sleepers are Ghost types, will-o'-wisps drifting), the jungle floor far below (`DROP`) under two layers of mist tinted by the hour; `canopyGround()` / `canopySupports()` (a trunk under each platform, struts, a rim curving round rounded corners, `ROUND`) / `canopyRim()` / `jungleFloor()`, lone giants (`|`), lifts (`y`), `treehouse()` (since 2026-10-14, the user's ask: "lame", round log huts built round their tree, a railed porch, round door and windows with shutters and flower boxes, a flared leaf-shingle cone banded in the house's colour, the tree out of its top into a crown, moss off the eaves; `tree: false` a spire), Phil's and Ricky's homes `canopyManor()`s on 5 x 4 lots (the handoff's item 12: a railed plank podium up steps, a log hall with a gold-collared veranda, a crest gable over the steps, a terrace railed in `GYM_INK`, banners; Ricky's a round den round a living tree, its window band cycling colours, a dish, fairy lights; Phil's `haunted`: violet windows, a leaning gabled storey, a witch-hat turret, a dead tree hung with violet lanterns, candles), the `nursery()` a ruined Victorian conservatory (a glass rotunda under a ribbed dome between barrel-vaulted wings, grime, ivy, dead plants, ghost wisps inside), `greatTree()` (its deck in rings of planks), `vineGate()` (the Bough Gate since 2026-10-14, the user's ask: "more grand": a living arch of two trunks on flaring roots, crowned, ghost-blooms, ghost-lanterns swaying, wisps circling, `B.reach` 2); lanterns only in platforms' outer corners and planters only by the Nursery (the user's ask, 2026-10-14: they stood in the walkways); every crown (`crown()`) fades while your Pokémon is behind it (`B.crowns`), so a tall town never hides you; homes' walls can be `dusk` / `glass`. Since session 6 the Savanna's **Sunwell Bazaar** (`?town=savanna`, `style: 'bazaar'`): a caravan trading post, one dusty road straight across the map on the diagonal (its wheel ruts one pair of grooves down its middle, `savannaGround()`), the market where it crosses the middle round the Waystone (`n` stalls, `stall()`), the watering hole cut into the ground (`~`, `holes`, `wateringHole()`: a mud bed, still water, banks, reeds and bulrushes, the jetty `-` on posts), round mud huts under conical thatch (`rondavel()`; a Gym Leader's is a `kasbah()` since 2026-10-14: red mud on a plinth, Djenné buttresses with ostrich eggs, a portal with their crest, a gilded dome, banners, on a 5 x 4 lot with an `s` name board; the road three wide, the jetty two wide and railed, pale stones round the watering hole, `fade` on, huts a and d gone), Persian's striped tent (`bazaarTent()`), the sandstone `caravanserai()` (walked in: the caravans' Pokémon resting), `wagon()`s (`kind: 'wagon'`, locked), the `windpump()` and `kopje()` landmarks, the bush of acacias, baobabs and termite mounds (`savannaBush()`; `|` a lone acacia in town), the `sunGate()`; homes' walls `tent` / `sandstone` / `mud`. `&home=<building id>` on `?town=` walks straight into that house (`peekTown()`; `&gymwins=1` puts the leaders at home). A new town is a `TOWNS` entry, a style (or the village's), and a `HOMES` line a home. **The Waystone and visits from home** (session 2, 2026-10-14; the Clearing grown to 20 x 16 for it, `X0` / `Z0` keeping the back where it was): one Waystone on the plaza's Poké Ball (`clearingWaystone()`, on `START`'s tile; one, not five, the user's pick 2026-10-14), five crystals orbiting its tip, one a town in its `RING` colour (`RING` in `js/data/towns.js`, a later town a line there), each lit once its town's friendship mends its Waystone (`MEND_AT`, `isMended()` in `js/towns.js`, the town's own Waystone whole then, `wholeWaystone()`), the worn ring path round it (`RING_R`), its menu's step a tile in front of it (`SPAWN`); your buddy walks in from the gate to the north avenue's crossing with the ring road and first stands there (`ARRIVE`, 2026-10-14, the user's ask); a tap opens its menu (`showWaystone()`, `.hub-card.way`: the Pokédex shell round a green LCD, a town a row, mended ones with Travel, met ones their friendship n/5, the rest ???), and Travel walks your buddy there outside any run (`warpTo()` in `js/hub-3d.js` → `onTown` → `visitTown()` in `js/run.js`: a throwaway run that saves nothing of itself, `visiting` / `isVisiting()`, but requests, buys and invites are real), and its Waystone, far gate or Leave bring you home in front of the Clearing's Waystone (`goHome('waystone', town)` → `cameHome()`). On a visit the trader's Shop sells the town's furniture shelf (`js/town-shop.js`, `SHOP_SHELVES`, never in the mall's stock), and a tapped townsperson asks once to move into the Secret Base (`inviteFolk()`, `save.townsfolk`, `resident()` in `js/pc.js`). The Clearing's own houses are `CLEARING` (the Nietos', `HOMES.clearing`, `visitTown(…, 'clearing', …, 'nietos')`); the house always stands, but the Nietos (and their Kangaskhan) are home only once THE NIETOS are beaten at their Gym, and since 2026-10-14 not at all, **switched off** while the user works out how they turn up (`NIETOS_LIVE` / `nietosHome()` in `js/data/towns.js`, the home's `out` line, and `leaderVisitor()` leaves them out of Secret Base visits; `?nietos&gymwins=1` brings them home for a page load); Kenmatta's dojo beside it is COMING SOON (`dojo()`).

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
e's; `tests/towns.test.mjs` checks each door is on or by a `#`, and nothing stands below the Waystone). `cabin()` now
builds only the bathhouse (timbered, a tiled pent roof under its banner, red paper lanterns) and hands the rest on:
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
handed in at the board to its leader `by` (their `thanks`, sliding in; `{pick}` fills a `pick` step's choice), paying
`QUEST_COINS`; `gives` puts a key item in the Satchel; a `pick` step's board offers one option per choice (`quest.picks`).
After the shard the board's old `requests` rotate. A `?town=` peek keeps its questline on the run (`t.peekSt`), never the
save. **The Satchel** (`js/data/satchel.js`: `MATERIALS`, `KEY_ITEMS`, `satchelOf()`; `js/satchel.js`: `gainMat()`,
`gainKey()`, `satchelNews()`; the app `js/satcheldex.js` on `shelfApp()`, icon `satchel` in `js/smooth-icons.js`):
`save.satchel = { keys, mats, seen, fresh }`, kept on a lost run, never the run's Bag; on the Collection and the device's
"!" only while `townsOpen()`. `?satchel` lends every material and key item for a page load.

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
