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
   2026-10-04). New tracks to wire if supplied: a Safari theme, a credits song, the Mart and the Game Corner. Real recordings can also replace
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
