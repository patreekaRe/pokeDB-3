# Starters, skins, legendaries and Abilities

Moved out of CLAUDE.md on 2026-10-14 so every session loads less; the text is unchanged. Dates are when each call was made: where two notes disagree, the later one wins.

- **Skins share decks**: only Charmander/Bulbasaur/Squirtle have unique
  decks (`FIRE_DECK`/`GRASS_DECK`/`WATER_DECK` in `js/data/starters.js`).
  Every other starter is a skin — same deck array reference, different
  sprite/name/blurb. `skinOf` on a skin entry is documentation only; code
  never reads it. 6 are Game Corner skins (`SKIN_SHOP_ITEMS`): the Gen 2/5 starters (150/250). Step 9a's six skins
  (Budew, Sewaddle, Lotad, Horsea, Spheal, Tympole) were removed again: the user didn't want them. A new starter
  needs front/back GIFs and their `shiny/` pair for every stage (PokeAPI black-white animated), `SPRITE_FIT` lines for
  the normal ones (and `BODY_X` lines from `tools/body-centre.py`, so a long tail doesn't push it off centre) (a PIL median bbox over all frames matches the ImageDecoder numbers exactly), and a cry in `CRIES`
  (play.pokemonshowdown.com is blocked in cloud sessions: PokeAPI's `cries/pokemon/latest/<dex>.ogg`, mono 64 kbps MP3
  at -13 LUFS integrated (ffmpeg `ebur128`, padded with 0.4 s of silence for short cries; see the archive's
  "Cry loudness pass").
- **A duo look's `aura`** (2026-10-20): a stage may carry `aura: 'awakened' | 'ascendant'`, and `spriteUrl()` then
  gives `<id>[-shiny]-<aura>-<kind>.gif`. Two-stage duo lines end on their second form, Awakened; Hitmonlee and Hitmonchan
  run plain, Awakened, Ascendant. `docs/duo-design.md` section 3.
- **Legendaries** don't evolve into a different species. Their `line` array
  reuses the same sprite id for stages 0–1 and points stage 2 at a `-shiny` id (only read for its cry, which drops the
  suffix). They never change colours: they power up, Super Saiyan style (the user's calls, 2026-09-28), in their normal
  colours, or their shiny ones once bought and switched on. `spriteUrl()` gives stage 1 `<id>[-shiny]-awakened-*.gif` (Super
  Saiyan: a flame aura in the type's colours engulfing the body, tongues off every upward edge and up its sides, two
  shimmering rings, a gentle pulse, a few drifting particles, two circling sparkles) and stage 2 `<id>[-shiny]-ascendant-*.gif`
  (Super Saiyan 2: the aura taller and denser, three rings pouring outwards, lightning crackling round it, a body flash
  twice a loop, a shower of the type's particles (embers, bubbles, leaves, stars), orbiting sparkles with trails). Baked
  into the GIFs, not CSS, since those sprites already carry their own filters (the intro's silhouette, the evolution's
  flashes). `tools/legendary-aura.py <id> <type>` (Pillow) makes all eight of a legendary's files and prints their
  `SPRITE_FIT` lines (the source's gaps plus the padding) for the end of `js/data/sprite-fit.js`; a new legendary needs both.
  Fifteen earned ones (plus Mewtwo, below; this said sixteen before Rayquaza, a miscount): Moltres / Virizion / Suicune (a Level 2 win per type), and since step 9b Entei / Celebi / Kyogre
  (a Level 3 win per type; Level 3 and 5 until 2026-09-28, the user's call) and Ho-Oh / Lugia / Palkia (the Clearing / Shrine / Wastes Pokédex page, `save.dex.done`;
  ids `hooh` etc.), and since step 9c Reshiram (`dex.complete`), Victini (`stats.bestStreak` >= 3: 3 wins in a row on Level 2+, `STREAK_LEVEL` in `js/run.js`; a loss or an Abandon (`forfeitRun()`) resets `winStreak`, a lower-Level win neither counts nor breaks it, Mewtwo and Safari runs never touch it; the result window says the streak (`streakLine()`) and the Achievements window shows "Current streak: n/3" from the goal's optional `progress`; since 2026-10-03, after a day as no duplicate cards / no moves forgotten; 15 cards or fewer before that
  (any Level until 2026-09-28)), Heatran (`stats.noRestWin`: `restCount` 0; PP Up at a Center isn't a rest), Manaphy (`stats.maxTide`, raised
  in `gainTide()` in `js/battle.js`) and Keldeo (wins with 3 different Water starters, Keldeo aside: `winsBy`; was every one you own until 2026-09-28), and since 2026-10-02 Rayquaza (Grass, the full Safari
  Pokédex: `save.safariDex.complete`; `safariPrize: true` keeps it out of the Safari's daily starters).
  `checkAchievements()` runs after every won fight's Pokédex update (`afterFight()`, quietly: `{ sound: false }`; its
  unlocks get a window of their own, `unlockWindow()` / `#unlock-dialog`, with the `achievement` jingle then the cry, as the
  first reward step, or after the evolution for a boss, whose chime sounds just like it; the user heard it early, 2026-09-28;
  at a run's end `announceUnlocks()` is quiet too and the windows come after the win scene, before the result window; the
  music dips under the jingle, `duckMusic()` in `js/audio.js`; only the Game Corner still plays it straight away), after each boss, at every run's end, won or lost (so an old save that
  already met a goal gets it then), and after a Game Corner buy.
  Shaymin was swapped for Virizion; `RENAMED_STARTERS` in
  `js/data/starters.js` moves an old id's unlock, wins and saved run over
  to the new one (add to it if a starter is ever replaced again).

- **Starter Abilities** (StS's starter relics): `ABILITIES` in `js/data/relics.js`, one per type, so
  every skin shares it and nothing is saved (it comes from `starter.type`). Fire **Blaze**: attacks +3
  while HP is below half (a 🔥 badge shows while it's on); Grass **Overgrow**: heal 3 after each won
   fight (in `finish()`; see Items for the bot numbers); Water **Torrent**: start each fight with 2 Tide; Psychic **Pressure**:
   start each fight with 2 Focus (Mewtwo's first attack deals +2). It's the first row of the
  Bag's Relics pocket, an "Ability: X" line in the character select's panel (`#sel-ability`), an "Ability" pill in the
  starter's type colour beside the map run card's Level chip (`#run-ability`, a `.chip` like the Level chip, its colours by `data-type`; always alive with a sheen sweeping across it and a glow breathing in its colour, `abilitySheen` / `abilityGlow`), and the same pill under your battle nameplate's HP bar, left of the HP numbers (`#player-ability`,
  `showAbilityState()` in `js/battle.js`; tap for its text), whose title shows the starter's type icon (`#player-type`), like the enemy's. When it does something,
  `abilityBanner()` in `js/battle.js` slides in Gen 5's "Charmander's Blaze" window (`#ability-banner`) on
   your side for 1.9 s: Torrent and Pressure on turn 1, Blaze each time HP drops below half (`checkBlaze()` in
  `renderAll()`, again after a heal took it back over), Overgrow when it heals after a win (the faint pause
  is 1.7 s then). The rare power card `blaze`
  is named Solar Power now (same id) so the two don't share a name.
