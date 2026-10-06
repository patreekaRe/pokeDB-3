# PokéDB roadmap

Only what's still open. Everything finished (steps 1-9, the card pool, v1.0 and Mewtwo, the Sealed Gate, the Safari
Zone, the Small asks) is in `docs/roadmap-done.md`, with its decisions, bot numbers and old session prompts; older notes
that say "the roadmap's step N" mean that file. When something here lands, move it there (a line or two is enough)
and take it out of this file, so this stays short.

Every session prompt starts with its "Run in:" line (CLAUDE.md, "Cloud or local").

## Open, ready to build

**More Settings options** (the user wants all seven, one by one, 2026-10-06; the OPTIONS screen is `js/settings.js`,
their meanings `js/prefs.js`). Run in: LOCAL for 1 and 4 (visual), CLOUD for the rest.
1. ~~Device colour~~ done 2026-10-06 (see the archive).
2. **Battle animations On / Off** (the games' Battle Scene): skip move effects and slow intros.
3. **Reduce flashing / screen shake** (white-outs, `.boom`, shakes; reduced motion already skips some).
4. **Text size**: Normal / Large.
5. **Nickname**: set the Trainer name here, not only through the leaderboard (`trainerName()`).
6. **Music player**: a sound test replaying any unlocked track.
7. **Reset save**: two "Are you sure?" steps, like the games' delete-save combo.

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
    The Explorer and three Tower Badges stay locked slots: drop their `locked: true` and give them a `test` when
    branching biomes / the Sky Pillar land.
    The title's Game Modes sub-menu has the Sky Pillar's gem (`pillarGem()` in `js/title.js`).

18. **The Sky Pillar** is done (parts a and b, 2026-10-05: the rules, then the painted tower; see
    `docs/reference/sky-pillar.md` and the archive). Still the user's: publish `firestore.rules` for the tower board and plaque.

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
  Android vibration on big hits (the Settings switch exists since 2026-10-06, iPhones tick since iOS 18),
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
