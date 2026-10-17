# Poké Deckbound (was PokéDB) — project notes for Claude

A browser-based Pokémon-themed roguelike deck-battler, named Poké Deckbound since 2026-10-08 (the repo and URL keep pokeDB-3). Vanilla HTML/CSS/JS
(ES modules), no build step, no framework. Deployed on GitHub Pages at
https://patreekare.github.io/pokeDB-3/.

## Cloud or local: always tell the user (their request)

The user finds it hard to keep track, so **every time you give them a next step or a next-session prompt, say
plainly whether to run it in the CLOUD or LOCAL**, as the first line (e.g. "▶ Run this in: CLOUD"). Default rule:
- **CLOUD**: building cards/mechanics, balance and bot checks (the sim), anything with long runs or many downloads.
  It saves the user's data and has Node, Python and Chromium. Attach both `pokeDB-3` and `pokeDB-sim`.
- **PLAYTEST ON THE LIVE SITE** (no session needed): https://patreekare.github.io/pokeDB-3/ on their phone or PC,
  a few minutes after a push. This is the default way to playtest. **A branch's playtest link** (the user's ask,
  2026-10-10: give one every time work sits on a branch): `https://rawcdn.githack.com/patreekaRe/pokeDB-3/<full commit hash>/index.html`,
  pinned to the pushed commit (2026-10-11: a branch link, `raw.githack.com/.../<branch>/`, served an old build from its
  cache), its own empty save, so add `?coins=` and what the test needs. Every URL flag is under "Playtest URLs" below.
- **LOCAL** (their Windows PC, `serve.ps1`): only for visual work they want to see change live as it's edited
  (layout, art, animation). No Node/Python there, so no bot runs.
Every session prompt in `docs/roadmap.md` starts with its "Run in:" line; keep adding one.

## No screenshots unless the user asks (their rule, 2026-10-14)

**Never take or send a screenshot unless the user asks for one in that session.** This overrides any default
"verify, then share a screenshot as proof" step, even for visual work. A screenshot stays in the context and is re-read
on every later turn. Still test every change, but with text: the console (`read_console_messages`), the page
(`read_page`, `get_page_text`), `javascript_tool` for computed styles or positions, `node --test`. Then give the
playtest link (the live site, or the githack link for a branch) and say in a line what to look at. The user checks
the look themselves, at no usage cost.

## Town clean-ups: read the handoff first

**Any session cleaning up a gateway town** (the Clearing, Highbough, Lantern Village, Cinder Springs, Driftwood Landing and
Sunwell Bazaar are all done) **reads `docs/handoff-town-cleanups.md` before touching code**: what the user's
clean-up meant (the checklist from the Clearing's and Highbough's), where each town's code lives, and the rules that keep
a town from leaking GPU memory or lagging on a phone (the iPhone tab reloads fixed 2026-10-14). One town a session; ask
the user what bothers them first.

## Roadmap

`docs/roadmap.md` is short: only what's still open (ready to build, ideas, parked, waiting on the user) and the rules
for adding Pokémon. Read it before starting a task. Everything finished is in `docs/roadmap-done.md` (the archive, split
off 2026-10-03), with its decisions, bot numbers and old prompts; "the roadmap's step N" / "Small asks N" in these notes
means that file. When a task lands, move its entry from the roadmap to the archive in a line or two, so the roadmap never
again lists finished work as open. **Update the roadmap every time a step finishes, before you reply** (the user's ask, 2026-10-12: they `/clear` often, so
the roadmap is how the next session knows where things stand): what was done, what's next, the branch and last commit if
it sits on one, and commit and push it with the work.

## Running it locally

There's no `file://` support (ES modules need a real origin). Use the
bundled server:

```
powershell -ExecutionPolicy Bypass -File serve.ps1
```

then open `http://localhost:8123`. Check `netstat -ano | grep LISTENING`
first — a server from a previous session may already be running.

`serve.ps1` is Windows-only. In a Linux/cloud session, serve the repo root
with `python3 -m http.server 8123` instead. Cloud sessions should still push
to `main` (see Conventions), not open a branch or PR. Even when a session is set up with its
own branch, push the work to `main` too (`git push origin HEAD:main`; the user's call, 2026-09-28), so it reaches the
live site.

## Architecture

- **Entry point**: `index.html` loads `js/main.js` as a module. Wide screens play full screen, the scenery and 3D places filling an iPad, while the Pokédex-shaped screens stand in them at a handheld's size (the Collection's device, and since 2026-10-12 the run map's: 500px wide, 940px tall at most, centred, the phone's map grid, `@media (min-width: 721px)` by `#map-screen` in `css/screens.css`; the user's call after a day of a phone-shaped frame round the whole game, which shrank the worlds with it). `?phone` still plays the same URL in `#phone-frame`, a phone-shaped iframe, to see a phone's layout on a wide screen. Every other
  `js/*.js` file is imported from there or from each other.
- **Data-driven design**: all game content — cards, starters, enemies,
  relics, achievements, shop items, difficulty levels — lives in plain
  object arrays/maps under `js/data/`. Tuning (damage numbers, unlock
  conditions, prices) should always be a data change there, not an engine
  change.
- **Screens** (`js/ui.js`): a `SCREENS` array of section ids; `showScreen(id)`
  hides all but one via the `hidden` attribute. The DOM isn't destroyed,
  just hidden, so screen state survives being hidden.

Each system below has its full notes (the user's calls, dates, function names) in a `docs/reference/` file. **Read
that file before changing the system.** The notes were moved out of this file on 2026-10-14 to keep every session's
context small. Where two notes disagree, the later date wins.

- **Windows and the Pokédex device** (`device-and-screens.md`): native `<dialog>`s through `openDialog` /
  `closeDialog` in `js/ui.js`. The shop dialog is non-modal on purpose (`.show()`); don't "fix" it. Every window closes
  on a tap outside it. The Collection is a red handheld (`js/device.js`, `js/collection.js`) whose apps run on
  `shelfApp()` in `js/bagdex.js`. The title opens on a shut Pokédex, every way into a run boots the device, and the
  map, Bag, rooms and run-end windows all wear its look (`.mdex-*`, `#room-bar`, `.dev-window`).
- **Walk-in 3D rooms** (`walk-in-rooms.md`, plus `mart.md` and `events.md`): the Center (`js/center-3d.js`), the Mart
  (`js/mart-3d.js`), the ? rooms, the grotto, the outdoor events and the gyms (`js/event-3d.js`). The pixel room stays
  as the fallback.
- **Starters, skins, legendaries and Abilities** (`starters.md`): only Charmander / Bulbasaur / Squirtle (and Mewtwo)
  have their own decks, and every other starter is a skin. Legendaries power up (aura GIFs from
  `tools/legendary-aura.py`) and never evolve. One Ability per type (`ABILITIES` in `js/data/relics.js`).
- **Mewtwo, the Sealed Gate and the Crystal Depths** (`mewtwo-and-depths.md`): the secret starter, the gate every won
  run strikes, Mewtwo's own mode, the Depths biome, Eternatus / Eternamax and the Depths' ending.
- **Cards and types** (`cards.md`; the design plan is `docs/card-design.md`): every effect is a key in `effects`,
  written out by `describe()`. Keyword boxes come from `cardTerms()`. Upgrades are `<id>+`. Five types, chart in
  `typeMultiplier()`; elites and bosses ignore it.
- **Economy, perks, shinies, Level 5 rewards, the Hall of Fame and Record Book** (`economy-and-hall-of-fame.md`).
- **Chad Master Kenmatta** (`events.md`): the Move Tutor's boss fight and the Mata-Mindset relic.
- **Safari Zone and catching** (`safari.md`) · **Sky Pillar and augments** (`sky-pillar.md`).
- **Journey films, the crossroads and branching biomes** (`biomes-and-journeys.md`): the pool biomes (Ruins,
  Thornwood, Savanna) at either fork, their scenery, films and bonus Pokédex pages.
- **Badges and the Trainer Card** (`badges-and-trainer-card.md`), plus the "!" trail for new finds.
- **The Clearing, Secret Base, Poké Mall and Game Corner** (`hub-base-mall.md`): the walkable 3D hub
  (`js/hub-3d.js`), its PC (`js/pc.js`: mail, missions, house upgrades, patch notes), the Secret Base (`js/base-3d.js`,
  `js/secret-base.js`, furniture in `js/base-furniture*.js`, models in `js/base-mesh.js`), the mall (`js/mall-3d.js`,
  `js/mall-furniture.js`, `js/mall-corner.js`) and its arcade (`js/arcade-*.js`). The Clearing's layout of 2026-10-14
  (the last section there) replaces the older positions in that file.
- **Gym Leaders** (`gym-leaders.md`: who each friend is, and how the gym works).
- **Gateway towns** (`towns.md`; live since 2026-10-15, `TOWNS_LIVE`): any town clean-up reads
  `docs/handoff-town-cleanups.md` first. A Gym Leader's home inside is `js/leader-homes.js`.
- **Seeded rolls** (Safari Zone phase 1, 2026-10-02): every gameplay roll goes through `random()` / `randIndex()` /
  `pickOne()` / `shuffled()` in `js/rng.js`, never `Math.random` (cosmetic rolls stay on it). A Safari run
  (`run.safari`, `js/data/safari.js`) seeds a stream per biome and per room (`reseed()` in `js/run.js`); every other run
  is unseeded. A new gameplay roll that skips `js/rng.js` breaks the daily run being the same for everyone. Tests:
  `node --test` (`tests/`).
- **Achievements vs shop unlocks**: `js/progress.js`'s `isShopUnlock(starter)`
  (`!starter.free && !ACHIEVEMENT_FOR[starter.id]`) is the switch between
  the two unlock paths.

## Rules that are easy to break

These used to be buried in the notes. Each one has its detail in the reference file named.

- **Never remove a card id.** A saved run holding it would be thrown away. Count copies with `baseId()`. (`cards.md`)
- **No two cards one run can meet may share a cost and text.** `noOffer: true` keeps a card out of the pools. (`cards.md`)
- A new card gets an `ART` line in `js/card-art.js`. A new mechanic gets a `describe()` line and a `cardTerms()` line.
  A battle rule change is mirrored in pokeDB-sim's `sim/engine.js`. (`cards.md`)
- Keep Mewtwo's type and all its cards masked as `???` until it's unlocked. The gate's achievement stays last in
  `ACHIEVEMENTS`. (`mewtwo-and-depths.md`)
- Read every perk through `perk()` / `dexPerk()` in `js/run.js`, so a first try stays fair. (`safari.md`)
- An enemy move whose real type isn't Fire / Grass / Water carries `type: 'normal'`. Elites and bosses are pure Normal
  and typeless. (`cards.md`)
- A new flash or shake checks `calmFx()`, and a new battle effect checks `battleFx()` (both in `js/prefs.js`).
- Replacing an id moves old saves over: `RENAMED_STARTERS`, `RENAMED_FURNITURE`.
- What a new thing needs:
  - **Starter**: front / back / shiny GIFs per stage, `SPRITE_FIT` and `BODY_X` lines, and a cry in `CRIES`. A
    legendary also needs `tools/legendary-aura.py`. (`starters.md`)
  - **Safari Pokémon**: a signature card, its GIF and a `SPRITE_FIT` line. (`safari.md`)
  - **Badge**: a `LOOK` line in `js/trainercard.js`. (`badges-and-trainer-card.md`)
  - **Augment**: an `ICONS` line, plus a mirror in the sim for a new fight key. (`sky-pillar.md`)
  - **Biome**: a crossroads `ARMS` line, and a `LANDS` kit for a pool biome. (`biomes-and-journeys.md`)
  - **Gym Leader**: a `leader()` line, a sprite, a `GYM_INK` line, a `GYM_LOOK` line and a `GYM_BIO` line. (`gym-leaders.md`)
    Their home in a town is the grandest house there, on a bigger lot (the village's `manor()`; `towns.md`).
  - **PC page**: a `NEWS` line in `js/pc-news.js`.
  - **Furniture reskin family**: a `set:`. An earned piece needs a source of its own. (`hub-base-mall.md`)
  - **Arcade game**: a `MARQUEE` line, and a `GAMES` line to play it at home. (`hub-base-mall.md`)
  - **Furniture kind**: a painting and a hand-built model in a `js/base-models-*.js` batch, checked with
    `tools/model-check.mjs`; a seasonal one a `holiday`, an outdoor one `outdoor` and a `yard` tab. (`hub-base-mall.md`)
  - **Song**: loop points.

## Playtest URLs

Flags on the live site or a githack link. Most are never saved. Details are in the file named.

- **Save and unlocks**: `?levels` (every Trainer Level), `?coins=N`, `?safari`, `?mewtwo` / `?lockmewtwo`,
  `?lockdepths`, `?gymwins=N` (for good; `?ungym=id,id` undoes it), `?onboard` (new-player setup), `?mail` (sample letters), `?satchel` (every material and key item; on a `?town=` peek every quest step ready), `?holiday=<id>` (a seasonal furniture set on sale, `js/data/holidays.js`), `?shards=N` (N Waystone Shards placed: Mewtwo's Sealed Weakness, the pentagram, the Depths camp), `?hearts=N` (every friend at N hearts at home and in the Secret Base, their heart lines unheard; nothing saved; `?base&hearts=5&visit` a best friend sitting).
- **Look**: `?time=dawn|day|dusk|night`, `?season=halloween|winter|none`, `?hybrid` / `?pixel` / `?smooth`,
  `?pixelcards`, `?sharp=soft|sharp|max` (the Sharpness setting for a page load), `?phone` (a phone frame on a wide screen), `?standalone` (3D drawn as in a Home Screen app), `?signs` / `?walk` (old title / walkable Clearing).
- **Runs** (throwaway): `?biome=ruins` (`&starter=`, `&level=`, `&slot=`), `?event=<id>` (`&event2d`), `?center`
  (`&center2d`), `?mart` (`&money=`), `?crossroads` (`&slot=2&from=`, `&road=`, `&meowth`; `?xr2d` the painted one),
  `?bossfight=<area>|depths` (`&hp=`), `?tower=25` (`&hp=`, `&aug=`), `?climb`, `?gym=<id>` (`&n=2`, `&hp=`),
  `?arena=ken`. Any of these takes `&relics=a,b`, `&cards=a,b+` and `&items=a` (`playtestKit()` in `js/run.js`).
- **Films and scenes**: `?travel=<biome>` (`&from=`, `&at=`, `&flyer=`), `?descent=mewtwo`, `?gate=N`, `?strike=N`
  (`&kind=loss`, `&land=`, `&first`), `?scene=<room>`, `?area=<area>` (`&stage=`, `&kind=boss`, `&intro=0`).
- **The hub**: `?base` (`&basefresh`, `&allfurniture`, `&flat`, `&guests`, `&fps`), `?yard` (out in the Secret Base's backyard, lent for the page load; `?yard=big` the bigger one), `?mall=furniture|2f|3f|corner|outfitter` (3f the Grand Ballroom, lent open)
  (`&stock=id,...`), `?shopopen`, `?ribbon`, `?meowth` (shuts the Game Corner again), `?visit`, `?towns`,
  `?mended` / `?mended=shrine,ruins` (towns mended for a page load, to test Waystone travel), `?town=<biome>` (`&home=`, `&aerial` the whole town from above, `&fest=lantern|moon|fireworks` John's festival in Lantern Village, mended; with `&mend` it appears as you mend the stone), `?nietos`, `?dojo` (straight into Kenmatta's dojo; its stars are real; `&trials` opens every trial), `?aerial`, `?hubat=x,y`, `?curve=N` (the Clearing's and the towns' Animal Crossing bend at another strength; 3 by default, 0 flat).

## Reference

The per-system detail lives in `docs/reference/`. **Before changing anything in one of these systems, read its file
first.** Don't work from the summary above alone, or you'll miss decisions recorded there. Sessions that don't touch a
system never open its file, which is the point. When a task changes a system, update its file, not this one; this file
gets at most a line.

- Windows, the Pokédex device, title, map and rooms' look - `docs/reference/device-and-screens.md`
- Walk-in 3D Center, Mart and ? rooms - `docs/reference/walk-in-rooms.md`
- Starters, skins, legendaries, Abilities - `docs/reference/starters.md`
- Mewtwo, the Sealed Gate, the Crystal Depths - `docs/reference/mewtwo-and-depths.md`
- Cards, card pools, upgrades, types - `docs/reference/cards.md`
- Economy, perks, shinies, Level 5 rewards, Hall of Fame - `docs/reference/economy-and-hall-of-fame.md`
- Journey films, crossroads, branching biomes - `docs/reference/biomes-and-journeys.md`
- Badges and the Trainer Card - `docs/reference/badges-and-trainer-card.md`
- The Clearing, PC, missions, Secret Base, Poké Mall, Game Corner, arcade - `docs/reference/hub-base-mall.md`
- Gateway towns - `docs/reference/towns.md`
- Saved runs - `docs/reference/saved-runs.md`
- Cloud save - `docs/reference/cloud-save.md`
- Deck thinning - `docs/reference/deck-thinning.md`
- Poké Mart and Pokédollars - `docs/reference/mart.md`
- Treasure room - `docs/reference/treasure-room.md`
- ? events and Kenmatta - `docs/reference/events.md`
- Items - `docs/reference/items.md`
- Relics - `docs/reference/relics.md`
- Battle screen layout - `docs/reference/battle-screen-layout.md`
- Map screen - `docs/reference/map-screen.md`
- Windows - `docs/reference/windows.md`
- Title screen - `docs/reference/title-screen.md`
- Safari Zone (seed, catching, balls, rare spawns, leaderboard) - `docs/reference/safari.md`
- Sky Pillar (the climb, its week, augments, leaderboard) - `docs/reference/sky-pillar.md`
- Top bar and start screen - `docs/reference/top-bar-and-start-screen.md`
- Pixel icons - `docs/reference/pixel-icons.md`
- Music - `docs/reference/music.md`
- Gym Leaders (who each friend is, and the gym) - `docs/reference/gym-leaders.md`

## Conventions

- No comments unless they explain a non-obvious *why* (a workaround, a
  hidden constraint). Never comment what the code already says.
- Commits push directly to `main` — this is a solo project with no PR flow.
  Test locally first (see below), then commit and push.
- Commit messages explain *why*, not *what*.
- **Every 3D place shares the GPU** (2026-10-14: iPhone Safari reloaded the tab mid-run when every place kept its WebGL
  context): a new place with its own `THREE.WebGLRenderer` calls `wakeGL(renderer)` from `js/hd2d.js` each time it is
  shown (it puts every other place to sleep), and on leaving either `sleepGL(renderer)` (kept, restored on its next wake)
  or `dropGL(renderer, scene)` (only if it then builds a new renderer next visit; a kept one reopened after it draws black, 2026-10-15). A place warmed ahead (built while the map is up) calls
  `restGL(renderer)` once warm: only the last one warmed stays awake beside the one on screen (2026-10-14: four warmed
  contexts awake on the map still reloaded an iPhone after Clarence's badge). A place that builds rooms on demand keeps
  only the last few (`forgetRooms()` in `js/event-3d.js`, `KEEP_ROOMS` 3), and the map builds only the ? rooms you can
  walk into next (`warmEvent3d()` in `js/run.js`). Check headless that at most two contexts are awake. A new frame loop skips frames with `tooSoon(now, last)` (`js/hd2d.js`; 60 fps at most, 2026-10-15: a 120 Hz phone drew twice as often and ran hot), and a context put to sleep keeps nothing drawn into a render target (re-bake it on wake, as the mall's `hallEnv()`). A new place sizes its canvas from `post.scale()`, which draws a Home Screen app's tall screen at the browser's cost (`fullScreenApp()` in `js/hd2d.js`, 2026-10-16). Sprite frames stay on CPU canvases (`keep()` in `js/hd2d.js`) and a big animated overlay is a 1x canvas, not a masked CSS gradient (2026-10-14: the badge's rays crashed Safari's GPU process, taking the sound and every sprite with it; `rayWheel()` in `js/ui.js` paints rays). A place with several rooms in one scene `unload()`s (`js/hd2d.js`) the one walked out of (2026-10-17, the mall).
- **No text under 12px** (0.75rem; the user's call, 2026-10-12: the pixel font is unreadable smaller). Card faces aside, and text that would otherwise be cut off or wrap where it must stay one line (a title on an LCD): `fitText()` in `js/ui.js` shrinks it only as far as it must (the user's call, 2026-10-12: the Arcade Leaderboard's title).
- **Patch notes, every task** (2026-10-10, the user's ask): anything a player would notice that a session ships gets ONE
  plain line in `NEXT` in `js/data/patchnotes.js` (`[group, line]`, a `GROUPS` key: hub, base, mall, pc, runs, battle,
  modes, dex, music, look, fixes); too-small-to-notice fixes get none. **Keep them short and few** (the user's call,
  2026-10-14, after condensing every patch: "small change ones made the patch notes very convoluted"): one sentence,
  about 25 words at most, no lists of every piece; a tweak, polish or follow-up to something already in `NEXT` edits that
  line instead of adding one; small fixes share a single `fixes` line. The Clearing's PC shows them as "Since vX" with
  no "!". Once `NEXT` holds `RELEASE_AT` (12) lines, or a headline feature (a new mode, biome or place) and 6, cut a
  patch: move them into a new `PATCHES` entry at the top (next minor version, a short name, the date), empty `NEXT`, and
  bring `IN_THE_GAME`'s counts up to date. The PC's "!" (`pcMarks()` in `js/hub-3d.js`) and the PC's PATCH NOTES (NEW)
  follow by themselves (`patchUnseen()` in `js/patchnotes.js`, per device). `tests/patchnotes.test.mjs` fails past
  `NEXT_MAX` (20). The hub's corner version tag is gone; the Signs title keeps `#title-version`.

## Testing a change before shipping

There's no automated test suite. Before committing:
1. Reload the page fresh and check the console for errors.
2. Actually play the affected flow in the browser — pick a starter, fight,
   reach the screen/dialog you changed, and interact with it — rather than
   just reading the code.
3. If it's a balance change (card damage, achievement difficulty, drop
   rates), use the headless-bot harness in `../pokeDB-sim/` (a sibling
   folder, never committed to this repo; its README says how to run it).
   Reuse it rather than rebuilding it. This machine has no Node or Python,
   so it runs in the browser pane: its `serve-sim.ps1` serves this repo
   plus its `/sim/` folder, and the harness `import()`s the real `js/data/`
   files. In a cloud session, `sim/run-node.mjs` runs it in Node worker threads
   with no browser (its README says how; the human bot at Levels 0/3/5 is far slower: 4500 runs took over 20 min on 4 cores).
   **Keep bot runs small** (the user's call, 2026-09-28: "hundreds, not thousands"): screen candidates at ~150 runs a
   cell, only on the types and Levels the change touches, and confirm the pick once at ~300; a cell's noise is then
   ~±8 / ±6 points, so only act on gaps bigger than that. Pipe the runner's stderr to a file, not through `tail`, so
   progress can be checked. Compare before/after under the same bot (in-memory tweaks in
   `sim/variants.js`, or the previous data from `git show`). `sim/engine.js`
   mirrors `js/battle.js`'s rules, so update it when battle rules change. The bot must value damage prevented above damage
   dealt (about 1.6×), or it under-blocks and misjudges attack-heavy pools.
   It must also pick relics by measured value (e.g. win rate starting with
   only that relic), not at random or by a hand-written list: the healing
   relics (Leftovers, Shell Bell) carry bot runs, and energy relics
   (Choice Scarf) must rank with the boss relics, or old-vs-new relic pool
   comparisons swing 20–40 points from pick bias alone. Absolute win rates
   differ between bot versions; only compare runs of the same bot.
4. After pushing, GitHub Pages can take several minutes (occasionally
   10+) to actually serve the new files — `raw.githubusercontent.com/.../main/<path>`
   reflects the pushed source immediately and is the fastest way to confirm
   a push landed, before blaming the CDN for a stale live check.

## Known environment quirks

- PowerShell's `Remove-Item` intermittently throws a spurious
  `blocked: '"C:\Program'` error unrelated to the actual target — retry
  without it, or isolate it in its own call.
- A live ES-module import cache in the browser can make a manual console
  `import()` of a just-edited file return stale content — reload the page
  before trusting console-based verification.

## Keeping sessions cheap

This project has had one very long-running Claude Code conversation, and
long conversations reprocess their whole history every turn, which burns
usage fast even for small changes. Going forward:
- Prefer starting a **new session per feature/fix** rather than continuing
  one indefinitely. This file is what lets a fresh session pick up the
  architecture instantly instead of re-deriving it.
- Prefer text-based verification (`curl`, `read_page`, `get_page_text`) over
  screenshots when just confirming state, not visual review.
- Don't poll a slow external process (like CDN propagation) in tight
  loops — one longer wait beats several short ones.

### Which app to work in

The Desktop app carries ~50k of connector tools on every request; a terminal
session carries none. That makes a terminal session roughly 5x cheaper per
turn, but it can't take screenshots. So:

- **Terminal** for balance, logic, enemies, moves, rewards, data, docs, git.
- **Desktop app** for anything the user has to *see*: UI, layout, animation,
  boss intros, events, art, sprites.
- **No screenshots unless the user asks** (see the rule near the top), even
  for visual work. Confirm with `curl`, the console, `read_page` or the code.
- The user playtests on the live site themselves, at no usage cost. When a
  visual judgement is needed, say what you need them to look at rather than
  asking for a screenshot.

Say which one you're in at the start of the first reply, and say so again if a
session that started as code work turns visual — the user can move it rather
than lose a round trip asking. If a visual task is asked for in a terminal
session, do the code work there and tell the user the visual check needs the
Desktop app.

Every turn re-reads the whole context window, so both *how much* is in it and
*how many turns* you take cost money. A measured session (2026-10-01) ran 92
requests and re-read 8.9M tokens to finish one task, with only a quarter of that
being actual conversation. So, each session:
- **Batch.** Do everything asked in one pass. Don't stop to ask after each item
  — make the reasonable call and say what you decided. Only ask if genuinely
  blocked; each question is a full re-read of the context.
- **Don't re-read** files already read this session unless something changed.
- **When the user asks for a screenshot**, take one, when the change looks
  finished, in one viewport, not one per pass.
- **Keep replies short.** No recapping back what the user just said.
- `/clear` between sub-tasks, not only between tasks.
- Per-system detail lives in `docs/reference/` (see above); read it on demand,
  not up front.
