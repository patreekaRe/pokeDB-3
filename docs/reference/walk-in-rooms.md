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
