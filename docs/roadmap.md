# PokéDB roadmap

Only what's still open. Everything finished (steps 1-9, the card pool, v1.0 and Mewtwo, the Sealed Gate, the Safari
Zone, the Small asks) is in `docs/roadmap-done.md`, with its decisions, bot numbers and old session prompts; older notes
that say "the roadmap's step N" mean that file. When something here lands, move it there (a line or two is enough)
and take it out of this file, so this stays short.

Every session prompt starts with its "Run in:" line (CLAUDE.md, "Cloud or local").

## Open, ready to build

**UI fixes batch** (the user's asks, 2026-10-07). One session each, all Run in: LOCAL (Desktop app, visual):
- D2. **The last cream: battle** (D's audit, 2026-10-07; groups 1-3 done, see the archive). Left: the nameplates, the
  Ability banner, intent bubbles, the battle log, probably staying cream (the classic look, the user to decide), and the
  title's run plate (`.title-plate`, under the rope). `.btn` moves window by window, never globally (the cream `.btn` is
  still the default outside `.dev-window`). Staying cream on purpose: tap tips, keyword boxes (`.card-tip`), the cards'
  own text windows, the scenes' text boxes.
- E. **Upgrade preview.** Choosing a card to upgrade (PP Up, Tutor Notes, events): highlight the numbers that change, or
  show base and + side by side, before confirming, instead of tapping in and out.

**Waiting on the user: hybrid everywhere?** (2026-10-07). The user liked the hybrid's subtle light, so `?hybrid` now
lights every biome (`js/hybrid-light.js`). Once they've played with it, ask whether it should become the default look
(today it's opt-in per device), and whether to remove the smooth pilot (`?smooth`, `js/smooth-clearing.js`: one revert;
the hybrid borrows its `glow()` / `dot()`, so move those two into `js/hybrid-light.js` first). A more detailed pixel
style (finer pixels, every painter redone) was talked over and parked: a session or two a biome.

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

- **Safari daily modifiers** ("all Pokémon are Water today", "Burn does double"), maybe tied to the clock.
- **More main-game Pokémon** (~70, per biome 3 wild, 1 elite, 1 boss). Candidates are in `docs/roadmap-done.md`'s
  Pokémon list; re-check each against the rules below before using it.

## Parked (don't start unprompted)

- Gen 6-9 starters: the sprites staged in `assets/pokemon/_incoming/` have no Grass line, and they aren't official Gen 5 sprites (the rules below).
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
- **Only official Gen 5 sprites** (PokeAPI black-white animated), never fan-made Gen 6+ ones such as Showdown's (the user's
  call, 2026-10-07; Eternatus / Eternamax are the one exception). Every Gen 1-5 species is now in the main game or the Safari,
  so a future biome takes the Safari's Gen 1-5 Pokémon, **shared** like the Sunken Ruins' and Thornwood's: a main-biome def
  with the slot's numbers under the species id (it wins over `safariMonDef()`, keeping the Safari line as `safariLine`), the
  `SAFARI_MONS` line kept for its area and signature card, plus a cry. It can't also be in a default-road biome.
- **Fire is scarce**: every Gen 1-5 Fire Pokémon is already in the game. The Sunscorch Savanna took Ponyta, Magby, Ninetales,
  Arcanine, Houndoom and Simisear; still free in the Safari only: Larvesta, Magmortar, Darmanitan, Chandelure (rare spawns),
  Lampent, and Numel / Camerupt / Magcargo (Ground / Rock, so not for a Fire slot).
