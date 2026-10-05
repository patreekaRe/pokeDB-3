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

**The user's third pick (2026-10-05), one session each, in any order** (15, a holo shine on rares, and 16, your Pokémon
walking the map, were already in the game: `.card.shimmer` and the map's `trainerImg` walk). Each prompt below is the
whole message to start its session with.

13. **Shiny wild Pokémon.** Run in: CLOUD (sprite downloads).
    Prompt: "Read AGENTS.md, CLAUDE.md and docs/roadmap.md's item 13, then docs/reference/saved-runs.md. Add shiny wild
    Pokémon: about 1 in 100 wild fights (not Alphas, bosses or the Safari) is a shiny, rolled through js/rng.js. It
    comes out with the shiny sparkle (reuse shinySparkle() in js/battle.js), uses `<id>-shiny-front.gif` (download the
    PokeAPI black-white animated shiny front for every main-game and Depths wild Pokémon, the same source as the normal
    GIFs; SPRITE_FIT lends a shiny its normal entry), pays double PokéCoins and ₽, and its Pokédex entry gets a ✨ mark
    (`save.dex.shiny`). The map room keeps no hint. Add `?shiny=1` to force the next wild fight shiny for a playtest.
    Check headless at 390x844, update CLAUDE.md, AGENTS.md and the roadmap, push to main."

14. **A finishing blow.** Run in: Desktop app (visual).
    Prompt: "Read AGENTS.md, CLAUDE.md, docs/roadmap.md's item 14 and docs/reference/battle-screen-layout.md. When the
    hit that takes an Alpha, Kenmatta or a boss to 0 HP lands, freeze the battle for a beat (~350 ms: hit-stop), shake
    the screen, flash white over the enemy and show the damage number big, then let the normal faint play. Eternatus's
    first bar keeps its own rebirth hand-off. Pixel-style only (steps, no soft glows); nothing under reduced motion
    beyond the number. Check at 375x812 with `?bossfight=depths&hp=0.05` and an Alpha via `?event=` or a run, push to
    main."

17. **Trainer Card.** Run in: Desktop app (visual).
    Prompt: "Read AGENTS.md, CLAUDE.md and docs/roadmap.md's item 17, then js/collection.js and js/records.js. Add a
    Gen 3-style Trainer Card as a Collection card: your cloud-save name or 'TRAINER', play time (count it from now on,
    `save.stats.playMs`, ticking while the page is visible), runs won, Pokédex and Safari Pokédex counts, gold stars,
    the Sealed Gate's state, and a badge case with one pixel badge per biome boss beaten (`stats.bossesDefeated`), the
    Depths' badge last and rarest. Its colour steps up with progress like the games' card (green, bronze, silver, gold,
    then violet once Eternatus is beaten). Check at 375x812 and 1280x800, push to main."

18. **Share a win.** Run in: CLOUD.
    Prompt: "Read AGENTS.md, CLAUDE.md and docs/roadmap.md's item 18, then js/halloffame.js. Add a 'Save image' button
    to a won run's result window and to every Record Book page: it paints a pixel picture on a canvas (the champion on
    its pedestal, name, Level or 'Champion of the Depths', date, the run's top numbers, and the deck as a grid of small
    card frames with names) and shares it with navigator.share where it exists (phones), else downloads the PNG.
    Nothing leaves the device otherwise. Check headless that the PNG is made at 390x844, push to main."

19. **Endless mode.** Run in: CLOUD (with bot checks). Ask the user to confirm the rules below before building.
    Prompt: "Read AGENTS.md, CLAUDE.md and docs/roadmap.md's item 19. Plan, then build, Slay the Spire's Endless: once
    Eternatus has been beaten (its feat), the Prepare step offers Endless for any starter you own. After the last boss
    the run loops back to biome 1, each loop harder (enemy HP and damage up, and one 'blight' a loop from a short list
    such as -1 draw, elites everywhere, Centers heal less). It ends when you faint; your best loop and floor go in the
    Record Book and Stats. No unlocks, gate hits, streaks or Level rewards from it. Propose the numbers and blights to
    the user first, then bot-check loops 1-3 at 150 runs with pokeDB-sim (it may need an engine change). Push to main."

20. **Custom runs.** Run in: CLOUD.
    Prompt: "Read AGENTS.md, CLAUDE.md and docs/roadmap.md's item 20, then js/data/difficulty.js and js/select.js. Add
    Slay the Spire's Custom mode as a third choice in the Prepare step, unlocked by any won run: a list of switches,
    each a small change to run.mods or the run's start (e.g. start with 15 cards, every fight an Alpha, no Centers,
    double ₽, start with a random rare, enemies +50% HP, all Trainer Level rules). Custom runs never count for unlocks,
    achievements, the gate, streaks, the Record Book or research; the result window says so. Check headless, push to
    main."

21. **Unown secret in the Depths.** Run in: CLOUD for the logic, then a Desktop app pass for the look.
    Prompt: "Read AGENTS.md, CLAUDE.md and docs/roadmap.md's item 21, then the Crystal Depths parts of js/scene.js
    (DEEP_MARKS, the Unown tablet). In each Mewtwo run, one Depths landmark hides an Unown letter: tapping it on the map's
    scene or the battle backdrop collects it (`save.unown`, one new letter a run, in a fixed order that spells a word,
    e.g. MEW). A collected letter shows on the Depths' Pokédex page. The full word unlocks a small secret (ask the user:
    a cosmetic, e.g. a Mew silhouette flying the title sky, or a Pokédex note). Check headless, push to main."

## Ideas, not agreed yet (ask the user before building)

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
