# The walk-in 3D Center, Mart and ? rooms

Moved out of CLAUDE.md on 2026-10-14 so every session loads less; the text is unchanged. Dates are when each call was made: where two notes disagree, the later one wins.

- **The walk-in 3D Pokémon Center** (merged into `main` and live since 2026-10-09; asked for after DPPt's
  Centers): `js/center-3d.js` lays a 3D room under the run's Center (`restSite()` in `js/run.js` keeps its choices,
  text box and room bar; `mountCenter()` puts a canvas where the pixel scene was, `#reward-options.c3d` hides the
  pixel room's nurse and monitor and floats the choices' signs, one word each, small cream speech windows with a thin border in the choice's colour, over the 3D things, Heal on the counter's front under the machine, `placeSigns()`; the pixel room never shows while the 3D one loads, `c3d-wait`):
  orange walls over a red band, a cream tiled floor with the Poké Ball seal and a red runner, the red counter (no plants, 2026-10-09, the user's call) and Chansey behind it (Upgrade), a modelled healing machine (Heal, after a "Heal N HP?" ask; its one
  Poké Ball, a true sphere, appears only then: your Pokémon shrinks into it in a red glow, it's thrown into the dish, flashing with the chime, hopping
  back and your Pokémon popping out, `tickHeal()`) under a big patient monitor counting the HP up, the Clearing's PC model (`pcModel()`, js/hub-pc.js,
  whose screens now roll together) on the floor before the counter (Forget, or why not), a cabinet of varied stock
  (`STOCK` / `cabinet()`: books, binders, potions, jars, towels, a first-aid kit, a photo, a plant; never two shelves
  alike), benches, an escalator down in each front corner; the doormat presses Leave. A choice no longer sends you to the map: the room stays with every sign greyed and you walk out yourself (`restSite({ used })`; 2026-10-09, the user's ask). A gentle tilt, close in, no tilt-shift blur (2026-10-09, the user's call)
  (`PITCH`, `ACROSS`, `SHOT_TOP`). Your Pokémon walks to the spot first; back from a deck picker it stands where it was.
  `warmCenter()` builds it while the map is up (`warmCenter3d()`; since 2026-10-18 once a Center is a step away, the Mart
  likewise, and only after any film over the map, `warmPlaces()`); without Three.js the pixel room stays. `?center`
  (`&starter=id`) walks a throwaway run straight into one (`peekCenter()`), `&center2d` the pixel room.
- **The walk-in 3D Poké Mart** (2026-10-09; merged into `main` and live since 2026-10-10, the user's call): `js/mart-3d.js`
  lays a 3D HGSS-style Mart under `martRoom()` the way the Center does (`mart3d()` in `js/run.js`): the moves on a wall unit
  of their own, the items on another on the right, the domed relics on a table of their own in front (the user's asks), each price over its ware, the camera centred on the door, Britt's counter with the PC (Britt, the user's friend, took over from Kecleon 2026-10-13; a tap on her says the next of `BRITT_TALKS`, her name on the box's tag), a tap walks up and
  presses the choice. `?mart` (`&money=N`). Detail in `docs/reference/mart.md`.
- **The walk-in 3D ? rooms** (2026-10-11, the user's ask): the Move Tutor's dojo, the Move Deleter's study, the Day Care
  and the Fan Club are walked in 3D like the Center (`js/event-3d.js`, mounted by `event3d()` under `eventRoom()`; the
  choices' acts and the trainers' reactions play on the props); since part b/c (same day) so are the Hot Spring and the
  Shrine (open air: a look per biome, `LOOKS`, lit by the hour) and the treasure grotto (`treasureRoom()`, a cave per
  biome, `CAVE`, its Poké Ball chest following the page chest's `.shaking` / `.opened`), and since part d (same day, the
  user's pick: a 3D ground per biome) the outdoor four, the Berry Tree, Wishing Well, Item Ball and Team Rocket, on a
  patch of the biome's own ground (`wild()`). Kenmatta's fight is the 3D arena's (`?arena=ken`, `dressKombat()` in `js/arena-3d.js`, 2026-10-11). `?event=day-care` (`&biome=shrine`, `&starter=id`;
  `?event=treasure` the grotto; `&event2d` the pixel room). Merged into `main` and live since 2026-10-11 (the user's call). Detail in
  `docs/reference/events.md`.
- **A deck picker over its room** (2026-10-14, the user's ask): wider than a phone, the PP Up / Forget pickers of the Center, the Mart's PC and the ? rooms (Move Deleter, Day Care) keep the 3D room up behind them, still and untappable, instead of the old pixel scene it was drawn over (`pickingOver()` in `js/hd2d.js`, in each room's `alive()`; walking checks `inRoom()`). On a phone the picker covers everything, so the room is put away as before.

## Sharpness (2026-10-16)

Every smooth 3D place sizes its scene through `scale()` in `createPost()` (`js/hd2d.js`), which reads `sharpness()` in
`js/prefs.js`: Soft draws at most at CSS pixels (the old way, and the only level the Home Screen app's tall-screen fit
applies on), Sharp (the default) up to 1.5x CSS pixels, Max up to 2x, never past the device's pixels. Crisp posts (the
Clearing) keep their pixel-art size. A new place built on `createPost()` gets it for free; one that sizes its own
canvas should read `sharpness().cap`.

## Memory when a room is left (2026-10-17)

The Center, Mart and event rooms keep their renderer awake under the map (to warm the next rooms), and kept the room
walked out of uploaded with it. `unmount()` now calls `putAway(view, scene)` (`js/hd2d.js`): a second after, if the map
is up, the scene is `unload()`ed (re-uploaded on the next visit); headless, ~65-80MB down to ~47MB, which is the
renderer's own post targets. Since 2026-10-24 the Center and the Mart pass their renderer too (`putAway(view, scene,
renderer)`), which then sleeps: the map warms nothing into them, so their post targets sat awake beside the warmed arena
(headless, the map 85 -> 52 MB after a Center, 100 -> 58 after a Mart). The ? rooms' doesn't: the map warms rooms into it.
Swapping rooms (a town and its houses) unloads the one left; leaving a town disposes it
(`forgetTowns()`); a partner board replaced is disposed; `dispose()`/`unload()` free every material map but `envMap`;
the Mart keeps at most `CARD_TEX_MAX` (24) card faces.

**The 20 new ? rooms checked** (2026-10-17, headless Chromium at 390x844 x3, one page load): every room walked in and
out three laps, each act played six times, one pair ten times running. Each room is 13-14MB of textures, ~40-190
shapes; an act adds no objects; leaving drops the renderer to its post targets (1 shape, 4 textures) every lap; the room
cache stays at 3, the canvases flat, the heap ~47MB with no growth lap on lap; no "Too many active WebGL contexts". Their
ticks no longer allocate per frame (the Odd Keystone's wisps made 7 vectors a frame). The harness hooks `__e3d` /
`__run` onto `js/event-3d.js` and `js/run.js` through Playwright routes, Three.js from a local `npm pack`; re-make it
from this note if needed. Sludge Pit and Team Rocket have no Leave: walk out by a choice.

**Two rooms kept** (2026-10-18, round six of the iPhone reloads): `KEEP_ROOMS` 2, down from 3, and the newest town is
never one `forgetRooms()` lets go (`forgetTowns()` does, on the way out), so a town keeps itself and its last home. The map
warms only that many of the next step's rooms (`warmEvent3d()` in `js/run.js`, the gym last so it's kept); a third ? room
reachable is built when it's walked into.

**One side-wall painting** (2026-10-19, the user's ask: the tab still reloading mid-run). `shell()` paints a room's side
wall once and both walls share its material, unless the painter takes `left` (only `careSide` does); a side wall's glow
map is dropped, since no side material ever used one. Every other room painted the same wall twice and kept the copy all
run; the cave's right wall was also painted as a back wall (`caveWall(…, left)` read `left` as "is a side"). Measured
(`tools/memory-probe.mjs`, `tools/budget-check.mjs`): the towns 10-21 MB less each, Britt's gym 106 -> 97, the dojo
154 -> 145, a wild ? room ~4.5 less. `tools/run-probe.mjs` counts memory fight after fight on one page (budget-check loads
each place fresh): over 11 rounds the map levels off near 120 MB (no growth from fight to fight) and each fight peaks
near 185 MB, the arena awake over what the run keeps (the last two ? rooms, the Center, the Mart, the song playing).
- **Loading and a second try** (2026-10-18, the user's ask after the Moon Dance showed its pixel room on a phone): the ? rooms,
  the gym, towns and homes (`event3d()`), the Center and the Mart mount through `load3d()` in `js/run.js`. A failed mount
  is tried once more a second later (the mount functions forget a failed try's `visit` / `runId`, so the retry is a first
  visit), and only a second failure lets the pixel room show. `loadThree()` (`js/hd2d.js`) asks for `?try=N` after a
  failure: a failed `import()` fails again from the module map without fetching. A wait past half a second shows
  `.loading-mark` (the user's layout, 2026-10-18: the room bar fades away, a navy banner bottom left with a red stripe and
  gold edges holds the room's name and LOADING with stepping dots, your Pokémon at 56px by a rolling 30px Poké Ball bottom
  right; still under `calmFx()`; once shown it stays 0.6 s at least and fades out over the room, the bar fading back, `endLoading()`), inside `#reward-screen` so it goes with it.
- **A reload after a second failure** (2026-10-18, the user's report: Kenmatta's dojo walked them out each time until a
  hard refresh). On a day of many pushes the browser held old and new files at once (GitHub Pages lets each be cached 10
  minutes), and a home room's `onFail` walks you out. Now `load3d()`'s second failure asks once a page load ("This room
  didn't load... reload?"); Reload runs `freshReload()`: every same-origin script and stylesheet in the resource timing
  list (its buffer raised to 4000, the sprites filled the default 250) fetched with `cache: 'reload'`, then
  `location.reload()`, since a plain reload takes fresh-cached modules from the cache. No goes on to the pixel room or
  `onFail` as before.
