# Handoff: cleaning up the gateway towns

For whichever agent picks this up next (written 2026-10-14 for opencode / GPT-6 LUNA, but any agent can use it). Read all
of this before touching code. Then read `CLAUDE.md` all the way through (the Gateway towns, The Clearing's layout and
Conventions entries matter most) and `docs/roadmap.md`'s Towns and Waystones entry.

## What the job is

Five gateway towns are built, one per biome after the Clearing. Two places have had a clean-up pass after the user's
playtests and the user liked the results: **the Clearing** (the hub, `js/hub-3d.js`) and **Highbough** (Thornwood's
town). The other four need the same care, **one town a session**, in this order unless the user says otherwise:

| Town | Biome | `style` | Peek it | Walked-in homes (`&home=`) |
|---|---|---|---|---|
| Lantern Village | Shrine | `village` | `?town=shrine` | done 2026-10-14 (the koi pond, `fadeBehind()`): a model too |
| Cinder Springs | Wastes | `springs` | `?town=wastes` | done 2026-10-14 (the leaders in `lodge()`s on 5 x 4 lots, `nameBoards()`, `fade`; then a lava field, `lavaField()`, two locked houses; then a road to every door, `forge()`, `cottage()`) |
| Driftwood Landing | Sunken Ruins | `lagoon` | `?town=ruins` | done 2026-10-14 (a square ring two wide, railings, four locked huts, Kayl's `stiltManor()`, Pat's two-deck `houseboat()`, `s` name boards, `fade`; then `bungalow()`s, the `baitShop()` and the temple gate) |
| Sunwell Bazaar | Savanna | `bazaar` | `?town=savanna` | done 2026-10-14 (the road three wide, the jetty two wide and railed, a stone edge round the watering hole, huts a and d gone, Machew's and Jerome's `kasbah()`s on 5 x 4 lots, `s` name boards, `fade`) |
| Highbough | Thornwood | `canopy` | `?town=thornwood` | already cleaned up: the model to copy (its leaders' `canopyManor()`s, round huts and conservatory 2026-10-14; lanterns in the platforms' corners, the Bough Gate) |

`&gymwins=1` puts the Gym Leaders at home; `&home=<id>` walks straight into a house; `?towns` switches the towns on for a
page load. All maps are 38 x 36 tiles.

**The towns are switched off on the live site** (`TOWNS_LIVE = false` in `js/data/towns.js`). Leave that alone; it's the
user's call to turn them on. Work goes to `main` like everything else (see CLAUDE.md's Conventions), and players won't
see a town until the user flips the switch.

## Start every town session by asking

Don't guess what's wrong. The Clearing's clean-up started with the user saying what bothered them ("cramped", "Kenmatta's
dojo right beside the Nietos", "spread it out along wide roads"). Highbough's started with "hard to get round with a big
Pokémon, hard to tell where I can walk". Ask the user what bothers them about this town before changing anything, and
make an aerial view first (below) so you're both looking at the same thing. Batch the fixes: make all of them in one
pass, then report back. Don't stop to ask after each one.

## What "the same treatment" meant (the checklist)

These are the fixes the user asked for in the Clearing and Highbough. Check each town against every line:

1. **Room to move.** Nothing cramped. Landmarks of different kinds don't stand side by side (the dojo beside the Nietos
   was the complaint). Roads are wide and read as roads.
2. **You can tell where you can walk at a glance.** Highbough got two-tile bridges (`bridgeAxes()`), a rope railing round
   every deck edge over the drop and a pale trim inside it (`canopySupports()` / `canopyGround()` in `js/event-3d.js`).
   Lagoon boardwalks and the bazaar's watering hole have the same kind of edge: check them.
3. **Big Pokémon fit.** Walk the town as a big Pokémon too, not only a small starter: `&starter=lugia` or
   `&starter=palkia` (the peek takes any starter id, locked or not). A one-tile path that a big sprite hangs off of is
   the bug Highbough had.
4. **Nothing hides your Pokémon.** Tall things stand at the back. Highbough's crowns fade while your Pokémon is behind
   them (`B.crowns`). Roofs, pagodas, crags, the temple, tents: walk behind each one and check.
5. **Nothing sits on a road or a path.** The Clearing's Poké Mall had its side on the ring road. The buddy spawned on the
   Waystone's Poké Ball. Check the spawn (`town.door`), the gate and every building's footprint against the roads.
6. **No holes in the edge.** An open meadow by the cauldron read as a hole in the Clearing's edge, so trees closed it.
   Walk the town's rim and look for gaps in the forest, crags, jungle or bush.
7. **No stray-looking art.** The Ancient Tree's long roots looked like stray branches and were cut. Anything that reads
   as a mistake goes.
8. **Readable signs.** The Nietos' sign was pale blue on sky blue, so now it's white on deep blue, and bigger. Every
   name board, crest and plaque must read from the path. No text under 12px anywhere (CLAUDE.md).
9. **Each town keeps its own shape.** The user asked for every town to have its own layout: the village's grid, the
   Springs' switchback, the Landing's ring, Highbough's platforms, the Bazaar's diagonal road. Clean up, don't flatten
   them into one template.
10. **Townsfolk fit the place.** Highbough became a ghost town on the user's ask. Don't change a town's cast unless
    the user asks, and ask before swapping a town's furniture shelf (`SHOP_SHELVES`).
12. **Gym Leaders live grandly** (the user's ask, 2026-10-14: their houses "more grand and extravagant and aesthetic",
    for every Gym Leader to come). A leader's home is the grandest house in town, on a bigger lot (Lantern Village's are
    5 x 4), in the town's own style, never a copy of the village's `manor()`: raised up, two storeys or tiers, gold
    trim, their crest, and banners or lights in their `GYM_INK`. Lantern Village's `manor()` is the bar to match.
11. **The ground rolls away like Animal Crossing's** (the user's ask, 2026-10-14: every town gets the Clearing's curve
    before the towns go live). Done for all five at once (2026-10-14, `docs/reference/towns.md`). Walk your town with it
    on (`?curve=0` lays it flat to compare) and check nothing far off pokes up wrong or vanishes too early; a new long,
    flat shape is cut to bend by itself (`fineTris()`), and a new tappable thing needs nothing more than `userData.spot`.

## Where things live

- **Layout and data**: `TOWNS` in `js/data/towns.js`: each town's `map` (a tile map, one string a row; the letters are
  explained in the comment over each map and in CLAUDE.md's Gateway towns entry), `buildings` (`at` letter, `kind`, `door`,
  `home`, `knock`), `door` (the way in), `gate` (the way out), `stands`, `folk`, `requests`. This file is pure and tested.
- **Building it**: `buildTown()` in `js/event-3d.js` (around line 5770). `TOWN_STYLES` (just above it) picks each town's
  ground, trees, houses, gate, lamps and what drifts in the air. Each style's painters are named in it (`crags`, `cabin`,
  `mineGate`, `lagoonGround`, `lagoonJungle`, `stiltHut`, `templeArch`, `savannaGround`, `savannaBush`, `rondavel`,
  `bazaarTent`, `sunGate`...).
- **Insides of houses**: `HOMES` in `js/event-3d.js` (by town, then home id).
- **Townsfolk**: `townCrowd()` in `js/event-3d.js` on `makeCrowd()` from `js/corner-crowd.js`.
- **Camera**: a town's size and camera come from `sizeOf()` (`pitch` 0.7, `view` 12, `follow: true` so the sun's shadow
  box follows the camera); `placeCamera()` aims it.
- **How the Clearing was done** (to copy its approach): `git show 8ab193a`, `git show a75eb34`, `git show aae4562`.
  **How Highbough was done**: `git show ceec897`. Read these diffs. They're the best guide to what the user wants.

## Making an aerial view (do this first)

Done (2026-10-14): `?town=<id>&towns&aerial` shows a whole town from above (`aerialShot()` in `js/event-3d.js`). Send
the user that link first, pinned to the commit, so you're both looking at the same picture. (The browser pane draws no
frames while it's hidden, so a headless walk there won't move your Pokémon: run the room's `B.ticks` by hand to test.)

## Don't cause lag or memory leaks (read this twice)

Earlier today (2026-10-14) iPhone Safari kept **reloading the tab mid-run**. The cause: every 3D place kept its own WebGL
context and every texture it had ever drawn, and some made a new context on every visit. The phone ran out of memory.
It was fixed in commit `29bbb01` (`git show 29bbb01`). The rules that came out of it:

1. **Never create a new `THREE.WebGLRenderer`.** Towns are rooms inside `js/event-3d.js`, which already has one renderer
   shared by every room. It calls `wakeGL(renderer)` from `js/hd2d.js` when shown, which puts every other 3D place to
   sleep. A clean-up never needs a new renderer, scene, camera or `createPost()`.
2. **Add everything a town builds to `B.group`** (or to `B.who` for people). `forgetRooms()` in `js/event-3d.js` keeps
   only the last `KEEP_ROOMS` (3) rooms and frees the older ones with `dispose(b.group)`. Anything added straight to
   `scene` (only the lights and your Pokémon are) or kept in a module-level array outlives its room and leaks. Don't
   change `KEEP_ROOMS` or `forgetRooms()`.
3. **Animate with `B.ticks.push((now, dt) => ...)`**, never `setInterval`, `setTimeout` loops or your own
   `requestAnimationFrame`. A tick dies with its room. A timer keeps running and holds the room in memory forever.
4. **Never add event listeners in a build.** `mountEvent()` already listens for taps and resize once. Tappable things get
   `userData.spot` (see how `buildTown()` tags doors) and the existing tap handler finds them.
5. **Nothing new per frame.** Inside a tick: no `new THREE.*` (Vector3, Color, Material, Geometry, Texture), no
   `document.createElement('canvas')`, no `.clone()`, no array or object building. Make them once in the build and reuse
   them. Change `.position`, `.rotation`, `.material.opacity`, `.emissiveIntensity`, `.offset` only.
6. **Many of one thing = one instanced mesh.** Trees, rocks, posts, rails, slats, reeds, lamps in a row: use `instanced()`
   in `js/event-3d.js` (or a `THREE.InstancedMesh` like `canopySupports()` does), never one mesh each. The forest round a
   38 x 36 town is hundreds of trees; as separate meshes it would crawl on a phone.
7. **Textures are painted once.** Paint canvases with `fine()` and turn them into textures with `texOf()` (both from
   `js/hub-3d.js`), at build time. A painting that's used many times is made once and shared, not repainted per copy.
8. **Keep the counts in check.** The drifting leaves / ash / wisps are capped at 90 (`Math.min(90, ...)` in
   `buildTown()`); don't raise it. Only big things cast shadows (`castShadow`). Small decorations get
   `raycast = () => {}` so taps don't test them. Don't add lights: the room's sun and hemisphere light everything, and
   glows are emissive materials (pushed into `lit`, which `buildTown()` brightens at night).
9. **Calm mode.** Every moving thing checks `calm` (`calmFx()`, reduced motion) and holds still when it's on.

**How to check you didn't leak** (if you can run a headless browser; the cloud sessions have Chromium and Playwright,
see CLAUDE.md): open `?town=<id>&towns`, walk into a home and back out 10 times, and into two other towns and back.
The console must show no errors and no "Too many active WebGL contexts" warning, and
`document.querySelectorAll('canvas').length` must be the same at the end as after the first visit. If you can't run a
browser, say so plainly and tell the user exactly what to look for on their phone: walk in and out of houses for a few
minutes, and the tab must never reload.

## Don't break the code

- **Run `node --test` before every commit** (if Node is there). `tests/towns.test.mjs` checks every town's map: square
  rows, only known letters, and every door, stand, the board and the gate reachable from the way in. If you move a house
  or a road, this is what catches a door you walled off. All tests must pass. Never delete or loosen a test to get green.
- **A map letter you add must be one `tests/towns.test.mjs` knows** (`'T.#,fLbR=cko~-|yn'` plus building letters). If you
  truly need a new tile letter, add it to the test's list and to the painters that read it, and note it in CLAUDE.md.
- **Change one town at a time.** `TOWN_STYLES`' shared painters (`house()`, `forest()`, `townGrass()`, `buildTown()`
  itself) are used by every town. If a fix has to touch shared code, re-check every town after (`?town=shrine`, `wastes`,
  `ruins`, `thornwood`, `savanna`), not just yours.
- **Don't rename or remove** a town id, a building `id`, a home id or a folk id. Saves store them (`save.towns[id]`,
  `save.townsfolk` keys `town:pokemon`, `run.town`). Moving a building on the map is fine; renaming it isn't.
- **Don't turn the towns on** (`TOWNS_LIVE`), and don't touch the Nietos' switch (`NIETOS_LIVE`) or the Gym Leader visit
  switch (`LEADER_VISITS_LIVE`). Those are the user's calls.
- **No gameplay changes.** A town must never make a run stronger (no healing, cards, relics). That's a settled rule. A
  clean-up is layout and looks only.
- **Match the code around you.** Read CLAUDE.md's Conventions: no comments unless they explain a non-obvious why,
  commit messages say why, and the house style of the file (short helper names, dense lines, the user's call quoted with
  its date in a comment when you change something they asked for, e.g. "(the user's ask, 2026-10-15: ...)").

## When a town is done

1. `node --test` passes; the headless check above (or your note to the user that you couldn't run it).
2. **Update `docs/roadmap.md`** (the user `/clear`s often, so this is how the next session knows where things stand):
   under Towns and Waystones, write what this town's clean-up changed in a few lines, and set **Next** to the following
   town with its "▶ Run in:" line and a ready-to-paste prompt. Update the town's line in CLAUDE.md's Gateway towns entry
   if something it names moved or changed.
3. **No patch-notes line** while the towns are switched off; put a line in `TOWN_NOTES` in `js/data/patchnotes.js`
   instead, so it ships when the towns do.
4. Commit (message says why, ends with the attribution lines your harness asks for), then push to `main`
   (`git push origin HEAD:main`) and to the session's own branch if it has one.
5. Give the user a **pinned playtest link**: `https://rawcdn.githack.com/patreekaRe/pokeDB-3/<full commit hash>/index.html?town=<id>&towns`
   (and `&aerial` for the overview). Start the reply with "▶ Run this in: ..." as CLAUDE.md asks.
