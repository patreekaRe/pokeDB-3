# PokéDB roadmap

Only what's still open. Everything finished (steps 1-9, the card pool, v1.0 and Mewtwo, the Sealed Gate, the Safari
Zone, the Small asks) is in `docs/roadmap-done.md`, with its decisions, bot numbers and old session prompts; older notes
that say "the roadmap's step N" mean that file. When something here lands, move it there (a line or two is enough)
and take it out of this file, so this stays short.

Every session prompt starts with its "Run in:" line (CLAUDE.md, "Cloud or local").

## Open, ready to build

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

**The user's third pick (2026-10-05):** the finishing blow (and the Trainer Card, now part of item 17 below).

14. **A finishing blow.** Run in: Desktop app (visual).
    Prompt: "Read AGENTS.md, CLAUDE.md, docs/roadmap.md's item 14 and docs/reference/battle-screen-layout.md. When the
    hit that takes an Alpha, Kenmatta or a boss to 0 HP lands, freeze the battle for a beat (~350 ms: hit-stop), shake
    the screen, flash white over the enemy and show the damage number big, then let the normal faint play. Eternatus's
    first bar keeps its own rebirth hand-off. Pixel-style only (steps, no soft glows); nothing under reduced motion
    beyond the number. Check at 375x812 with `?bossfight=depths&hp=0.05` and an Alpha via `?event=` or a run, push to
    main."

**The user's suggested order (2026-10-05): badges, then the Sky Pillar, then branching biomes.** Each part has a CLOUD
session (rules, data, saves, bot) then a LOCAL Desktop-app session (the look). Each prompt is the whole first message.

17. **Badges** are done (parts a and b: `js/data/badges.js`, the Trainer Card in `js/trainercard.js`; see the archive).
    The Explorer and three Tower Badges stay locked slots: drop their `locked: true` and give them a `test` when
    branching biomes / the Sky Pillar land.
    The title already has the Sky Pillar's gem in its modes slot, greyed "Coming soon" (`pillarGem()` in `js/title.js`):
    when it lands, give it its `onPick` and drop `locked`.

18. **The Sky Pillar: an endless tower climb with a weekly leaderboard.** No map screen: the tower is the map. A side-on
    cutaway panning upward as you rise; each landing has 2-3 doors with room icons (fight, Alpha, Mart, Center, ?) and
    your Pokémon walks through the one you pick; between floors a spiral-stair climb, the floor number stamped on a stone
    plate, an altitude gauge. The windows show the height: treetops, clouds (10), storm (20), sunset above the clouds
    (30), aurora (50), stars and space (100). A guardian boss every 10 floors with its own intro and room, Rayquaza every
    50. Floors you've beaten stay lit below you, each fallen foe a statue. Losing: the floor gives way and you fall past
    every floor you climbed, then the result window. A weekly seeded tower (the Safari's seed system), ranked by highest
    floor on the Safari leaderboard's Firestore setup, the top names engraved on a plaque in the lobby. Its floors 25 /
    50 / 100 earn the Tower Badges.
    a. **Done 2026-10-05** (cloud): the rules, seed, leaderboard, Tower Badges and `?tower=` on the normal map; see
       `docs/reference/sky-pillar.md` and the archive.
       **Open (ask the user):** Grass climbs far too high (bot, 150 climbs past floor 30 at x1.35 HP / +8 dmg a flight:
       Fire median 36, 0% to 100; Water median 32, 3% to 100; Grass median 56, 24% to 100): its healing outgrows enemy
       damage that only grows by +8 a flight. Options: damage that compounds too, or healing that shrinks with height.
    b. **Run in: LOCAL (Desktop app).** Prompt: "Read AGENTS.md, CLAUDE.md and docs/roadmap.md's item 18 (part a is
       done: the Sky Pillar's rules on a placeholder screen). Paint it: the side-on cutaway panning upward, doors with
       room icons and the walk through them, the spiral-stair climb with the stamped floor plate and altitude gauge, the
       windows' sky by height (treetops, clouds, storm, sunset, aurora, space), the lit floors and statues below, the
       guardian rooms and intros, the fall on a loss, and the lobby's plaque of top climbers. Check at 375x812 and
       1280x800 with `?tower=`, push to main."

19. **Branching biomes.** After each boss's rewards, a crossroads: a painted scene with a signpost and two paths, each
    showing its biome's name, a glimpse of its scenery, its boss's silhouette (??? until met) and which types live there.
    Biome 2: Overgrown Shrine or **Sunken Ruins** (a flooded temple, mostly Water). Biome 3: Ember Wastes (mostly Fire) or
    **Thornwood Jungle** (a primeval forest, mostly Grass). Each new biome is built as fully as the others: 12 wilds, 3
    Alphas, 3 bosses (GIF, cry, sprite fit, enemy entry), 4 painted places, an intro film, a boss walk-on and boss intro,
    a map palette and signs, a treasure grotto, a Pokédex page and map music. Journey films go from 2 routes to 6:
    Clearing → Ruins (wading down a flooded stairwell), Ruins → Wastes (steam as the water boils away), Shrine → Jungle
    (a vine-choked torii), Ruins → Jungle (a waterfall crossing). Seeing every biome earns the Explorer Badge. Roughly
    6-10 sessions a biome. **To decide first:** do the new Pokédex pages count towards finishing the Pokédex (suggested:
    no, bonus pages with their own reward, so Reshiram and the Safari don't move); does Mewtwo's speedrun get the
    crossroads or keep its fixed road; the bot checks each new biome against the one it pairs with.
    a. **Run in: CLOUD.** Prompt: "Read AGENTS.md, CLAUDE.md, docs/roadmap.md's item 19 and its 'Rules for adding
       Pokémon'. Ask me the three open decisions in item 19 first. Then build the crossroads' logic (the run picks a
       biome per slot, saved with the run; a plain two-button choice for now) and the Sunken Ruins' gameplay: its 12
       wilds, 3 Alphas and 3 bosses (sprites, cries at -13 LUFS, SPRITE_FIT, ENEMY_DEFS), its Pokédex page and
       events' per-biome values, with `?biome=ruins` to playtest. Bot-check it against the Overgrown Shrine at 150 runs
       a cell (fire / grass / water, Levels 0 and 3). Bump RUN_SAVE_VERSION if needed, update the docs, push to main.
       Attach pokeDB-sim too."
    b. **Run in: LOCAL (Desktop app).** Prompt: "Read AGENTS.md, CLAUDE.md and docs/roadmap.md's item 19 (part a is
       done: the crossroads logic and the Sunken Ruins' gameplay). Paint the crossroads scene (signpost, two paths, each
       biome's glimpse, boss silhouette, type icons) and the Sunken Ruins: its 4 places, intro film, boss walk-on and
       boss intro, map palette and signs, treasure grotto, and the Clearing → Ruins and Ruins → Wastes journey films.
       Check at 375x812 and 1280x800, push to main."
    Then the same two sessions again for the Thornwood Jungle (and its Shrine → Jungle and Ruins → Jungle films).

## Ideas, not agreed yet (ask the user before building)

- Suggested 2026-10-05, not picked: shiny wild Pokémon (~1 in 100 wild fights), a "Save image" share picture of a
  win, Endless mode after Eternatus, Custom runs (switches that count for nothing), Unown letters hidden in the Depths.

- More polish suggested 2026-10-03, not picked yet: keyboard keys in battle on PC (1-0 play a card, E ends the turn),
  Android vibration on big hits (a Settings switch), a "Reduce flashing" / text-size setting,
  quiet background sounds for each place under the music.

- **Safari daily modifiers** ("all Pokémon are Water today", "Burn does double"), maybe tied to the clock.
- **More main-game Pokémon** (~70, per biome 3 wild, 1 elite, 1 boss). Candidates are in `docs/roadmap-done.md`'s
  Pokémon list; re-check each against the rules below before using it.

## Parked (don't start unprompted)

- Gen 6-9 starters: the sprites staged in `assets/pokemon/_incoming/` have no Grass line.
- Catching in the main game: dropped (the user's call, 2026-09-27). Only the Safari Zone catches.
- Game Corner skins Budew, Sewaddle, Lotad, Horsea, Spheal, Tympole: the user said no. Don't re-add them.
- A Safari "zone legend" (a weekly Pokémon catchable only on the last floor): the user said no, 2026-10-03.

## Waiting on the user

- Music: `assets/audio/eternatus.mp3` and `eternamax.mp3` (they borrow `boss` until then).
- Firebase: the first real cloud-save sign-in, and publishing `firestore.rules` (Firestore > Rules) to switch on the
  Safari leaderboard. The console steps are in `docs/roadmap-done.md` (Next sessions, step 4) and
  `docs/reference/cloud-save.md`.
- Playtests on the live site: a real Mewtwo run (Eternatus's numbers, the fall into the Depths), Ken's difficulty, the
  boss intros' and biome films' sound levels.

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
