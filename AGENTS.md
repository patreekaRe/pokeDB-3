# PokéDB: handoff for coding agents

This project was built with Claude Code until 2026-09-29. It moved to opencode then. Everything an agent needs is in
three places:

1. **`CLAUDE.md`**: the architecture, every system, the conventions and how to test. It's long because it holds the
   user's calls about the game. `opencode.json` loads it on every session, so treat it as your own instructions. Where
   it says "Claude", read "you".
2. **`docs/roadmap.md`**: the agreed plan, what's done and what's next. Read it before any roster, balance, Pokédex or
   v1.0 task, and update it as steps land.
3. **This file**: the working notes that lived in Claude's private memory, plus how things differ outside Claude Code.

## Where we left off (2026-10-02)

- `main` is up to date (last task: the epic boss intros for Biomes 1 and 2). No
  unfinished work in the tree, and every `claude/*` branch on GitHub has been merged into `main`.
- Roadmap steps 1-7 of "Next sessions" are done (evolution scene, title/select/Collection redesign, cries, cloud save
  code, Level 5 rewards + Hall of Fame + Record Book, day/night cycle, the biome journey with places and landmarks).
- Biome 1's tree intro was already shipped as `ec686c8`; the Biome 2 Shrine intro landed in `a71dc25` and was checked
  through the actual map walk, wipe, empty-arena sequence, boss cry/reveal and player Poké Ball entrance at the five
  viewport sizes listed in `docs/roadmap.md`. Reduced motion and the browser console were also checked. Biome 3 got its
  own eruption intro on 2026-10-01 (`f3bc32a`; the user wanted it nothing like Biome 1's). The same day Biomes 1 and 2
  got an epic pass to match it (the tree's heart bursting into a colossal blossom; the Shrine's bell tolls, ghost torii,
  a spirit seal and fox-fires). Their climaxes were vertical beams like the eruption's lava column at first; the user
  wanted each biome to end differently, so only the Wastes goes straight up now. All three boss intros are done; the user still has to see the new two in a real fight.
- 2026-10-01: Chad Master Kenmatta is a special boss fight (Challenge sign in the Move Tutor's dojo) whose win gives the
  unique Exp. Share relic (+1 PP, +1 draw, +1 strength). Checked headless through the room, fight, rewards and the next
  fight; the user still has to playtest it and judge his difficulty (HP 130/220/370, never bot-tested).
- 2026-10-02 (Small asks 1): Ken's first defeat pops an achievement window, and from then on every map shows his
  dojo's ❓ room with his pixel face (`save.kenBeaten`) plus a "Ken's dojo" row in the Bag's Map key. Checked at 375x812. Same day, the user's call: the map
  icon now takes 3 wins (`save.kenWins`); the first win's window is the relic's achievement and says so, the Challenge sign
  counts "Beaten n/3". Safari polish (Small asks 2): the rare spawn's ✦ sits centred over its room, and the prep window's
  balls are a big swipeable row. Checked at 375x812 and 768x1024.
- **After every task, update this file and `docs/roadmap.md` first** (the user's call, 2026-10-01), before reporting back.
- **v1.0, Mewtwo and the fourth biome** (done 2026-10-03, part D below) (roadmap section of that name). Part A (Mewtwo's Psychic deck and
  Pressure Ability) landed 2026-09-29. Part B's gameplay landed 2026-10-02 (the user's answers: Eternatus, a 5-floor sprint
  through biomes 1-3, a crystal cavern with themed wilds): the Crystal Depths, its 16 Pokémon with enemy traits, the way
  down after the Biome 3 boss (since 2026-10-02 Mewtwo's fall, `fallIn()`: the descent scene with the full heal told in its
  lines, then the Depths' film; `?descent=mewtwo` playtests it; roadmap Small asks 5), Mewtwo's fixed mode with no Level picker; strong / human bot 78 / 72%. Its scenery was
  painted the same day (B2, below), and `map4` borrows `map3.mp3` until the user supplies one. Part C landed the
  same day: Eternatus is a two-bar set piece (it rises as Eternamax in a cutscene, charges Eternabeam, its Dynamax
  Cannon grows); strong / human bot 92 / 90%; `?bossfight=depths&hp=0.1` playtests it. The user still owes its two music
  files; the Eternamax cutscene was redone the same day as the Darkest Day (part C2: the roof splits on a red sky and
  Eternamax's silhouette comes down through it); the user still has to see it live. Next is part D (the ending); its prompt is in the roadmap.
- 2026-10-02: **The Crystal Depths painted** (v1.0 part B2, Desktop app): four places each deeper and stranger (Cave
  Mouth, Crystal Halls, Deep Core, Energy Well), landmarks per place, Eternatus's boss prelude (its core rises out of the
  Well and bursts), an intro film down a crystal shaft (`js/depths-intro.js`), a map palette with energy rifts, crystal
  signs, a red pad deeper down, its own treasure grotto. `?area=depths` walks it. Checked in the browser pane at 375x812
  and 1280x800, no console errors; not yet seen in a real Mewtwo run. The user still has to playtest it
  (`?mewtwo`, or `?area=depths` for a look).
- 2026-10-02: **The Sealed Gate, part A** (roadmap section of that name): breaking the gate is Mewtwo's unlock now
  (1000 HP, hits by Trainer Level after each win, only Level 5 breaks it; old saves back-filled from the Record Book,
  Mewtwo owners keep it). Tested headless (back-fill, every hit case, the break unlocking Mewtwo). **Part B landed the
  same day** (Desktop app): the gate's pixel art in its damage stages (`js/gate.js`), the after-run attack scene and the
  break that frees Mewtwo (`js/gatescene.js`), and the gate on the title's ledge. Checked in the browser pane at 375x812
  and ~800x760 through `?strike=` (a win, a loss chip, the seal holding at the sliver, the break), no console errors;
  the real end-of-run path was only checked by reading the code. The user still has to watch it on the live site
  (`?strike=120&gate=50` for the break).
- 2026-10-02: **The Sealed Gate's stages and seal bar** (Desktop app, the user's ask): its damage shows in steps at
  75 / 50 / 25% then the break, each step crossed mid-hit jolting it open with its lines, and its HP is a new seal bar
  (gem, stage runes, trailing damage) in the scene and the result window. Checked in the browser pane through
  `?gate=780&strike=300` and `?gate=520&strike=300`; the result window's bar only by reading the code.
- 2026-10-02: **The broken gate on the title** (Desktop app, the user's ask): once the Sealed Gate is broken and Mewtwo
  is free, the open gate stands on the title's ledge; a tap swells its violet light with Mewtwo's cry, then opens
  Mewtwo's Prepare step. Checked in the browser pane at 375x812 with `?mewtwo&gate=0` (hidden without them, no overlap
  with the gems, the tap lands on Prepare, Back on the select).
- 2026-10-02: **The strike card** (Desktop app, the user's ask): the gate scene's move is a card you hold to charge and
  let go to throw (`strikeCard()` in `js/gatescene.js`), phone-safe long press. Checked in the browser pane at 375x812
  with `?strike=90&gate=400` and `?strike=700&gate=600&starter=squirtle&stage=2` (the gold break card); not on a real phone.
- 2026-10-02: **The descent to the Sealed Gate** (Desktop app, roadmap 'Small asks' 4): after the last boss the arena
  splits and your Pokémon falls down a crystal shaft to the gate (`js/descent.js`), then the strike, then the win scene,
  the unlocks (Mewtwo's last) and the result. Checked in the browser pane at 375x812 through `?strike=90`, `&first`,
  `&kind=loss` and `?strike=400&gate=50`; the real end of a run only by reading the code. The user still has to watch it
  live. Item 5 (Mewtwo's fall into the Depths) reuses it.
- 2026-10-02: **Safari Zone phase 1** (cloud, on branch `claude/project-thread-6d3v6i`, reached
  `main` with phase 2): the seeded RNG (`js/rng.js`) under every gameplay roll, the daily seed / areas / starter (`js/data/safari.js`),
  the title's Safari Zone gem (locked until `dex.complete`), a playable daily run with borrowed rosters and the first-try
  flag. `node --test` runs the seed tests. Checked headless (same map, enemies and opening hand in two fresh browsers).
- 2026-10-02: **Safari Zone phase 2** (cloud, pushed to `main`): catching at red HP (a Throw button and a ball picker; a
  throw is the whole turn), a caught Pokémon's signature card (take or skip), `save.safariDex`, Poké Balls in the Game
  Corner (4th row), rare spawns that run off, Bait and Rock, and the first try of the day without perks. Detail:
  `docs/reference/safari.md`. Bot: catching costs win rate (300 runs: knock out 74.0, throw at 50%+ 62.7), so no retune.
  Checked headless at 390x844 (plus layout at 768x1024 and 1280x800); the user still has to try it on a phone. Next is
  phase 3, the Safari Pokédex (prompt in the roadmap).
- 2026-10-02: **Throw like the games** (cloud, pushed to `main`; roadmap 'Small asks' 3): the Throw button shows every
  wild Safari turn, a throw costs 1 PP and ends your turn, and `catchChance()` is a curve on the HP left (5% at full HP,
  70% near 0) instead of the red-HP gate. Bot: catches a run about the same, win rate no longer drops when throwing.
- 2026-10-02: **Safari Zone phase 3** (cloud, pushed to `main`): the Safari Pokédex (`js/safaridex.js`), a tab per area
  (wilds, then rare spawns), ??? / seen / caught marks, each area's caught count, a caught entry's signature card. Opens
  from the Collection, a Safari tab on the main Pokédex, and the Pokédex button in a Safari run. Built from the area
  rosters, so phase 4's Pokémon appear by themselves. Checked headless at 390x844 and 1280x800; the in-run button only
  by reading the code. Open question for the user: a reward for a complete area (proposal in the roadmap). Next is
  phase 4, the roster at scale (prompt in the roadmap).
- 2026-10-02: **Safari Zone phase 4, batch 1** (cloud, pushed to `main`): 10 enemy role templates and 58 new Gen 1-5
  Pokémon (`js/data/safari-mons.js`, one line each, 6 of them rare spawns), each with a PokeAPI GIF, a `SPRITE_FIT` line
  and a signature card; borrowed wilds now live in one area each. 104 Safari Pokédex entries. Bot within noise (knock
  out 76.0 -> 77.3, catching 58.7 -> 64.0). Next: batch 2 (prompt in the roadmap); the area reward is still open.
- 2026-10-02: **Safari Zone phase 4, batch 2** (cloud, pushed to `main`): 84 more Gen 1-5 Pokémon, 12 wilds + 2 rare
  spawns an area, each with a GIF, a `SPRITE_FIT` line and a signature card; 188 Safari Pokédex entries. Bot: knock out
  73.7 -> 81.3 (300 runs, just inside noise), throw at 50%+ 69.3 -> 67.3; no retune. Next: batch 3 (prompt in the roadmap);
  the area reward is still open.
- 2026-10-02: **Safari Zone phase 4, batch 3** (cloud, pushed to `main`): 85 more Gen 1-5 Pokémon (12 Fire: every unused
  Gen 1-5 Fire species), 12-13 wilds + 2 rare spawns an area; 273 Safari Pokédex entries. Knock-out runs had drifted to
  83.7, so every template's HP is x1.1: knock out 74.0, throw at 50%+ 58.3 (300 runs). Next: batch 4 (prompt in the
  roadmap); the area reward is still open.
- 2026-10-02: **Safari Zone phase 4, batch 4** (cloud, pushed to `main`): 81 more Gen 1-5 Pokémon (29 Grass, 27 Water,
  25 Neutral; no Fire species were left), 11-12 wilds + 2 rare spawns an area; 354 Safari Pokédex entries. Bot (300 runs):
  knock out 80.0 -> 75.0, throw at 50%+ 59.7 -> 60.3; no retune. Only 16 Grass / Water species are left (listed in the
  roadmap). Next: batch 5 (prompt in the roadmap).
- 2026-10-02: **Safari Zone phase 4, batch 5** (cloud, pushed to `main`): 80 more Gen 1-5 Pokémon (the last 11 Grass
  and 5 Water species, 64 Neutral), 11-12 wilds + 2 rare spawns an area; 434 Safari Pokédex entries. Numel and Magby moved
  to the Wetland (it had no Fire Pokémon). Bot (300 runs): knock out 74.3 -> 76.7, throw at 50%+ 62.7 -> 62.7; no retune.
  80 species are left, all Neutral (listed in the roadmap). Next: batch 6, the last (prompt in the roadmap).
- 2026-10-02: **Safari Zone phase 4, batch 6, the last** (cloud, pushed to `main`): the last 80 Gen 1-5 Pokémon, all
  Neutral-shown, 20 each to the Forest and Wetland (fewest Neutral there), 9-11 to the rest, 2 rare spawns an area;
  **514 Safari Pokédex entries, the roster is complete**. Bot (300 runs): knock out 75.3 -> 79.2 (600 runs), throw at 50%+ 64.7 ->
  65.0; no retune. Next: phase 5, the leaderboard (cloud) and the areas' art (Desktop); prompts in the roadmap.
- 2026-10-02: **Safari Zone phase 5a, the leaderboard's code** (cloud, pushed to `main`): the day's first try posts its
  result once to Firestore (`safariBoard/<day>_<uid>`), boards for fastest win / fewest turns / most caught, today and
  yesterday, from the Safari Pokédex and a Safari run's result window; `firestore.rules`; `tests/leaderboard.test.mjs`.
  Checked headless with a stand-in Firebase (blocked, signed out, signed in with a name to pick and a post). Next: the
  user publishes `firestore.rules`; phase 5b, the areas' art (Desktop).
- 2026-10-02: **Safari Zone phase 5b, the 6 areas' scenes** (Desktop, not pushed yet: the user asked to hold it while
  another session builds the Safari prep screen and leaderboard): Meadow, Forest, Wetland, Marsh, Peak and Desert in
  `js/scene.js` (`SAFARI_ART` / `SAFARI_PAINT`), 4 named places each (`js/data/safari.js`), the map's palettes and signs,
  `?area=<area>` to look at them. Then each area became one road you walk (a trail to the horizon, the goal ahead
  nearer every floor, a roadside landmark per floor). Detail in `docs/reference/safari.md`. 5c (same day, Desktop, pushed):
  each area's intro film and walk-ons, `js/safari-intro.js`. 5d (same day, Desktop, not pushed yet: the user wants to see
  it first): each area's boss prelude (`SAFARI_PRELUDES` in `js/scene.js`, synths in `js/audio.js`) and, after it, the boss's arena
  (`ARENAS`), seen with
  `?area=<area>&stage=3`.
- 2026-10-03: **v1.0 part D, the ending** (cloud, pushed to `main`): a Mewtwo win plays the Champion of the Depths scene
  (a violet crystal cavern) and the credits (`js/credits.js`), gold-violet entries in both books; the Crystal Depths'
  Pokédex page (completing it unlocks shiny Mewtwo); feats (`FEATS`: Champion of the Depths pays 1000 PokéCoins, Shiny
  Mewtwo); Eternatus crosses the title sky once beaten; the v1.0 patch notes. Final balance pass: the three types are level
  (no change); Eternatus +8 damage / +30% HP (Mewtwo strong / human 93 / 93 -> 86 / 83). Checked headless at 390x844
  through `?bossfight=depths&hp=0.01`. **v1.0 is complete.** The user still has to see the ending on the live site.
- Waiting on the user:
  - The first real cloud-save sign-in (Firebase project `pokedb-42e7c`; setup steps are in the roadmap's step 4).
  - Publishing `firestore.rules` in the Firebase console (Firestore > Rules), which switches the Safari leaderboard on.
  - `assets/audio/hall-of-fame.mp3`, which the user will supply. Until then `victory` plays.
  - Choosing whether the reward, battle and Mart capsules (`.ds-btn`) become pixel pills (`.pxb`).
  - `assets/audio/map4.mp3` for the Crystal Depths (until then `map4` plays `map3.mp3`, `TRACKS` in `js/audio.js`).
  - Playtesting a Mewtwo run to the Crystal Depths (Mewtwo must be unlocked; the `?levels` trick doesn't unlock it).
- Parked (don't start unprompted): Gen 6-9 starters (the sprites staged in `assets/pokemon/_incoming/` have no Grass
  line), Mewtwo's shiny, and catching in the main game (dropped; the Safari Zone has its own).
- 2026-10-02: **Safari Pokédex completion rewards** (cloud, the user's design): a page with every Pokémon caught pays 300
  PokéCoins once and doubles that area's rare spawns on replays (not the day's first try); the whole Safari Pokédex
  unlocks **Rayquaza**, a Grass legendary skin (Grass had only 2 legendaries), with every asset (GIFs, shiny, auras, fits,
  cry). Gold ✦ on finished tabs and on the title's Safari Zone gem. `tests/safarireward.test.mjs`; checked headless at
  390x844 (a Master Ball catch finishing the Meadow page and the whole dex: reward lines, Rayquaza's unlock window, the
  Safari Pokédex, the gem badge, Rayquaza in the character select), no console errors. The user still has to see it live.

## How the user works

- The user is Patrick. They drive the project by playtesting and give concrete feedback ("the shop button should toggle,
  not navigate"). Treat that feedback as the decision and act on it. Many "the user's call" notes in `CLAUDE.md` record
  choices they made. Don't undo them.
- **Every next step or session prompt starts with where to run it** (e.g. "▶ Run this in: LOCAL"). See the next section
  for what CLOUD/LOCAL means now.
- Keep sessions scoped to one feature or fix, and start fresh for the next one. Prefer text checks (reading the page,
  `curl`) over screenshots, and one long wait over tight polling (e.g. GitHub Pages can take 10+ minutes).
- **UI taste**: narrow, centred windows that let the pixel scene show around them; less text (details go in `title`
  tooltips); the map is always upright; everything is pixel art and Pokémon-authentic (Gold/Silver, Gen 3-5), not
  generic fantasy; size tweaks come in small steps. Check at phone portrait (375x812, 390x844), iPad (1024x700, 768x1024)
  and PC (1280x800). **Landscape phones don't matter**: the user never plays sideways.
- Plain, short explanations. Say whether something was actually tested in the browser.

## Differences from Claude Code

- **CLOUD vs LOCAL**: in `CLAUDE.md`, "CLOUD" meant a Claude Code web session (Linux with Node, Python and Chromium).
  "LOCAL" meant the user's Windows PC, which has **no Node or Python**. With opencode on that PC:
  - Serve the game with `powershell -ExecutionPolicy Bypass -File serve.ps1` → http://localhost:8123. Check
    `netstat -ano | findstr LISTENING` first, in case a server is still running.
  - The balance bot (see below) needs Node (`sim/run-node.mjs`) or a browser driving `sim/index.html`
    (`../pokeDB-sim/serve-sim.ps1`). Installing Node is the easiest fix, but ask the user first.
  - Playtesting is still on the live site: https://patreekare.github.io/pokeDB-3/ (`?levels` unlocks every Trainer
    Level, `?time=dawn|day|dusk|night` pins the clock).
- **Bot harness**: `../pokeDB-sim/` (next to this repo, never committed here). The local folder is not a git repo. The
  copy with history is the user's private GitHub repo `patreekare/pokeDB-sim`. Its README says how to run it. Any balance
  change needs before/after runs with the same bot (see "Testing a change before shipping" in `CLAUDE.md`).
- **Git**: push straight to `main` (solo project, no PRs). Commit messages say *why*. Test in the browser before
  committing. `.claude/worktrees/` holds old Claude Code worktrees; ignore them (the user can delete the folder).
- Some parts of `CLAUDE.md` name Claude-only tools (the "browser pane", artifacts, `read_page`). Use whatever browser or
  fetch tool you have instead.
