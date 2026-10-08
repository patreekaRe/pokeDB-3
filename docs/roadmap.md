# PokéDB roadmap

Only what's still open. Everything finished (steps 1-9, the card pool, v1.0 and Mewtwo, the Sealed Gate, the Safari
Zone, the Small asks) is in `docs/roadmap-done.md`, with its decisions, bot numbers and old session prompts; older notes
that say "the roadmap's step N" mean that file. When something here lands, move it there (a line or two is enough)
and take it out of this file, so this stays short.

Every session prompt starts with its "Run in:" line (CLAUDE.md, "Cloud or local").

## Open, ready to build

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

9. **Seasonal title screen.** Run in: LOCAL (Desktop app). The title dresses up by the date, the way `js/daytime.js`
   follows the clock: October Halloween (pumpkins on the ledge, Gastly / Haunter in the flyers' round, an orange dusk
   tint), December snow, and room for more. A `season(now)` helper like `timeOfDay()`, and `?season=halloween` to pin it
   for a playtest (as `?time=` does). Title only; battles and the map are untouched.

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
    each painted with its films; see the archive). The new roads open after a Level 2+ win with each type (`roadsOpen()`, 2026-10-07). Still the user's: hear the new synths and films on a phone.

20. **A Fire biome and a shuffled pool of roads** is done (parts a-c, 2026-10-07: the Sunscorch Savanna, the pool of three
    roads rolled at each run's start, its look and films, journey films for every pairing, its badges; see the archive).
    Still the user's: watch the new trips on a phone (`?travel=ruins&from=shrine` etc.).


21. **Sky Pillar augments** (the user's call, 2026-10-07: like League's Arena / ARAM Mayhem, "a SHIT TON of augments"
    so the tower is fun and replayable). The whole plan, rules and a first list of ~110 augments are in
    `docs/augments.md`: no Game Corner perks anywhere in the tower, one of three augments before floor 1 and after every
    guardian, Silver / Gold / Prismatic by height, 1 reroll, type-only ones (Fire must reach floor 100 sometimes; it's 0%
    in the bot today), every offer from the week's seed so the leaderboard stays even.
    - Parts a (the picks and effects) and b (the look) are done: see the archive.
    - **Part c.** Run in: CLOUD. The trade-off augments, sets and their bonuses, augment badges, the rest of the list.

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
  a) the room, grid, placing / moving / storing, a starter set of ~15 pieces, `save.base` (Run in: LOCAL, visual);
  b) the Furniture shop and its daily stock, prices, a "!" on new stock (Run in: CLOUD);
  c) furniture unlocked from badges, achievements, feats and Safari pages, ~30 more pieces (Run in: CLOUD for the data, LOCAL for the art);
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
  Claude's suggested answers (2026-10-08; the user plans to start on Saturday 2026-10-10, confirm with them then): **one
  room that grows** (it starts small, bigger rooms bought or earned; Gen 3's tree / cave / desert looks as wallpaper-like
  themes later, so there's one painter, not three), **6 Pokémon on show** (enough to feel lively, few enough to read on a
  phone; more slots could be an unlock), **decoration only** (bonuses would make the base a chore and pull at the
  Safari / Sky Pillar boards' fairness; the reward is how it looks, and the Pokémon reacting).
  Open questions for the user before a): one room or rooms that grow (Gen 3's tree / cave / desert bases?), how many
  Pokémon on show, and whether furniture is pure decoration or gives a small perk.
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
     road, a Game Corner stall on the left (`cornerStall()`: 3D and smooth, turned 45 degrees to the plaza), the Sealed Gate once broken on the right where the
     Pokédex stood. The bottom bar (2026-10-08, the user's pick) is the rooms' Pokédex bar: the place's name on the hinge's LCD, its gold pill, then Home (the corner handheld folded into it), round keys and the PokéCoins. **Next: the user playtests the branch and decides if it goes live.**
  Every session checks 30+ fps at 390x844 with `&fps`, and pushes the branch only, never main, until the user says.
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
