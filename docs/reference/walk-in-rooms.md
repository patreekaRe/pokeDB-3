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
  `warmCenter()` builds it while the map is up (`warmCenter3d()`); without Three.js the pixel room stays. `?center`
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
renderer's own post targets. Swapping rooms (a town and its houses) unloads the one left; leaving a town disposes it
(`forgetTowns()`); a partner board replaced is disposed; `dispose()`/`unload()` free every material map but `envMap`;
the Mart keeps at most `CARD_TEX_MAX` (24) card faces.

**The 20 new ? rooms checked** (2026-10-17, headless Chromium at 390x844 x3, one page load): every room walked in and
out three laps, each act played six times, one pair ten times running. Each room is 13-14MB of textures, ~40-190
shapes; an act adds no objects; leaving drops the renderer to its post targets (1 shape, 4 textures) every lap; the room
cache stays at 3, the canvases flat, the heap ~47MB with no growth lap on lap; no "Too many active WebGL contexts". Their
ticks no longer allocate per frame (the Odd Keystone's wisps made 7 vectors a frame). The harness hooks `__e3d` /
`__run` onto `js/event-3d.js` and `js/run.js` through Playwright routes, Three.js from a local `npm pack`; re-make it
from this note if needed. Sludge Pit and Team Rocket have no Leave: walk out by a choice.

