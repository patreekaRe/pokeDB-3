# PokéDB roadmap

Only what's still open. Everything finished (steps 1-9, the card pool, v1.0 and Mewtwo, the Sealed Gate, the Safari
Zone, the Small asks) is in `docs/roadmap-done.md`, with its decisions, bot numbers and old session prompts; older notes
that say "the roadmap's step N" mean that file. When something here lands, move it there (a line or two is enough)
and take it out of this file, so this stays short.

Every session prompt starts with its "Run in:" line (CLAUDE.md, "Cloud or local").

## Open, ready to build

1. **A loudness pass on the cries** (the user's idea, 2026-09-28; optional). Some cries are louder than others.

The polish batch (the user wants all of it, 2026-10-03). One session each, in any order:

2. **Battle feel.** Run in: LOCAL (Desktop app). Read `docs/reference/battle-screen-layout.md` first. (a) Damage
   preview: while a card is raised, the enemy's HP bar flashes the chunk it would lose (after block, Vulnerable,
   strength, Focus), and your block bar the block it would add. (b) The enemy lunges a little on its attack and recoils
   on a big hit; a super-effective hit's number shows red. (c) Rare cards shimmer in rewards and the Mart; taking an
   upgraded `+` card gives a small burst. Respect reduced motion.
3. **World polish.** Run in: LOCAL (Desktop app). Read `docs/reference/map-screen.md` first. (a) Light weather in battle
   that matches the biome and the time of day (`js/daytime.js`), in whole pixels like the scenery: rain, falling leaves,
   ash. (b) The draw and discard piles take the biome's colour. (c) Footprints on the map path already walked. (d) A
   Pokédex entry plays its cry and a small idle bounce when opened.
4. **Settings and battle QoL.** Run in: CLOUD. (a) Separate music and effects volume (the 🔊 button mutes both now,
   `js/audio.js`), saved. (b) A 1x / 2x battle speed toggle for the enemy turn and hit animations. (c) An end-turn
   warning when PP is left and a card is playable, which can be switched off. (d) Sort and filter in the deck view
   (cost, attack / skill / power).
5. **Records QoL.** Run in: CLOUD. Read `docs/reference/safari.md` for (c). (a) A "New!" badge on cards and relics never
   seen before, in rewards and the Mart (`save.seen`). (b) Lost runs keep a short line too (where you fell, to what),
   beside the Record Book's wins. (c) A Safari result line to copy and share ("Safari 2026-10-03: 4 caught, floor 11").
   (d) **Ask the user first:** holding a boss shows its next 2 moves (might be too generous).
6. **Music hookups.** Run in: CLOUD, once the user drops files in `assets/audio/`. Find each new file's loop points
   (`LOOP_POINTS`), drop its fallback. Wired already: `map4`, `eternatus`, `eternamax`. New tracks to wire if supplied:
   a Safari theme, a credits song, the Sealed Gate scene, the Mart and the Game Corner. Real recordings can also replace
   synths (block, stick, gate-hum / gate-crack / gate-shatter, fireworks).

## Ideas, not agreed yet (ask the user before building)

- **Safari daily modifiers** ("all Pokémon are Water today", "Burn does double"), maybe tied to the clock.
- **A Safari "zone legend"**: a weekly Pokémon catchable only on the last floor.
- **More main-game Pokémon** (~70, per biome 3 wild, 1 elite, 1 boss). Candidates are in `docs/roadmap-done.md`'s
  Pokémon list; re-check each against the rules below before using it.

## Parked (don't start unprompted)

- Gen 6-9 starters: the sprites staged in `assets/pokemon/_incoming/` have no Grass line.
- Catching in the main game: dropped (the user's call, 2026-09-27). Only the Safari Zone catches.
- Game Corner skins Budew, Sewaddle, Lotad, Horsea, Spheal, Tympole: the user said no. Don't re-add them.

## Waiting on the user

- Music: `assets/audio/eternatus.mp3`, `eternamax.mp3` and `map4.mp3` (they borrow `boss` / `map3` until then).
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
  at ~-14 dB mean), a `js/data/sprite-fit.js` entry and its `ENEMY_DEFS` entry. A Safari Pokémon follows
  `docs/reference/safari.md` instead.
- Removing one: also update Team Rocket's `team` lists in `js/data/events.js`, and bump `RUN_SAVE_VERSION` in
  `js/run.js` (saved maps hold `enemyId`s).
