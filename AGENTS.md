# PokéDB: handoff for coding agents

This project was built with Claude Code until 2026-09-29. It moved to opencode then. Everything an agent needs is in
three places:

1. **`CLAUDE.md`**: the architecture, every system, the conventions and how to test. It's long because it holds the
   user's calls about the game. `opencode.json` loads it on every session, so treat it as your own instructions. Where
   it says "Claude", read "you".
2. **`docs/roadmap.md`**: the agreed plan, what's done and what's next. Read it before any roster, balance, Pokédex or
   v1.0 task, and update it as steps land.
3. **This file**: the working notes that lived in Claude's private memory, plus how things differ outside Claude Code.

## Where we left off (2026-10-01)

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
- **After every task, update this file and `docs/roadmap.md` first** (the user's call, 2026-10-01), before reporting back.
- **Next big task: v1.0, Mewtwo and the fourth biome** (roadmap section of that name). Part A (Mewtwo's Psychic deck and
  Pressure Ability) landed 2026-09-29. Part B's gameplay landed 2026-10-02 (the user's answers: Eternatus, a 5-floor sprint
  through biomes 1-3, a crystal cavern with themed wilds): the Crystal Depths, its 16 Pokémon with enemy traits, the gate
  after the Biome 3 boss, Mewtwo's fixed mode with no Level picker; strong / human bot 78 / 72%. Its scenery is a
  placeholder (B2, a Desktop session), and `map4` borrows `map3.mp3` until the user supplies one. Next is part C (the
  Eternatus set piece) or B2; both prompts are in the roadmap.
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
- Waiting on the user:
  - The first real cloud-save sign-in (Firebase project `pokedb-42e7c`; setup steps are in the roadmap's step 4).
  - `assets/audio/hall-of-fame.mp3`, which the user will supply. Until then `victory` plays.
  - Choosing whether the reward, battle and Mart capsules (`.ds-btn`) become pixel pills (`.pxb`).
  - `assets/audio/map4.mp3` for the Crystal Depths (until then `map4` plays `map3.mp3`, `TRACKS` in `js/audio.js`).
  - Playtesting a Mewtwo run to the Crystal Depths (Mewtwo must be unlocked; the `?levels` trick doesn't unlock it).
- Parked (don't start unprompted): Gen 6-9 starters (the sprites staged in `assets/pokemon/_incoming/` have no Grass
  line), Mewtwo's shiny, and catching (dropped).

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
