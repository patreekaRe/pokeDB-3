# PokéDB — project notes for Claude

A browser-based Pokémon-themed roguelike deck-battler. Vanilla HTML/CSS/JS
(ES modules), no build step, no framework. Deployed on GitHub Pages at
https://patreekare.github.io/pokeDB-3/.

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
to `main` (see Conventions), not open a branch or PR.

## Architecture

- **Entry point**: `index.html` loads `js/main.js` as a module. Every other
  `js/*.js` file is imported from there or from each other.
- **Data-driven design**: all game content — cards, starters, enemies,
  relics, achievements, shop items, difficulty levels — lives in plain
  object arrays/maps under `js/data/`. Tuning (damage numbers, unlock
  conditions, prices) should always be a data change there, not an engine
  change.
- **Screens** (`js/ui.js`): a `SCREENS` array of section ids; `showScreen(id)`
  hides all but one via the `hidden` attribute. The DOM isn't destroyed,
  just hidden, so screen state survives being hidden.
- **Dialogs**: native `<dialog>` elements. Most use `openDialog`/`closeDialog`
  in `js/ui.js`, which wrap `.showModal()`/`.close()`. The **shop dialog is
  the exception** — it uses `.show()`/`.close()` directly (non-modal), so it
  floats above whatever screen is showing without blocking or hiding it.
  That's intentional: don't "fix" it back to `showModal()`.
- **Skins share decks**: only Charmander/Bulbasaur/Squirtle have unique
  decks (`FIRE_DECK`/`GRASS_DECK`/`WATER_DECK` in `js/data/starters.js`).
  Every other starter is a skin — same deck array reference, different
  sprite/name/blurb. `skinOf` on a skin entry is documentation only; code
  never reads it.
- **Legendaries** don't evolve into a different species. Their `line` array
  reuses the same sprite id for stages 0–1 and points stage 2 at a
  `-shiny` suffixed sprite id for a visual payoff on final evolution.
  Shaymin was swapped for Virizion; `RENAMED_STARTERS` in
  `js/data/starters.js` moves an old id's unlock, wins and saved run over
  to the new one (add to it if a starter is ever replaced again).
- **Mewtwo** is the secret last starter (`secret: true`: shown as "???",
  centred alone on the last grid row). It unlocks once every other starter
  is unlocked; that achievement must stay last in `ACHIEVEMENTS`, since
  `checkAchievements()` grants in order (the shop also runs it after a
  purchase). It is `type: 'psychic'` with an empty deck, so `comingSoon: true`
  stops it being picked for a run until its own cards exist.
- **Economy**: `js/storage.js` holds `coins` and `passives`. `awardCoins()`
  applies the Coin Finder bonus and persists. `COIN_REWARDS` live in
  `js/run.js`. Shop catalog is `js/data/shop.js`; `js/shop.js` renders it.
- **Achievements vs shop unlocks**: `js/progress.js`'s `isShopUnlock(starter)`
  (`!starter.free && !ACHIEVEMENT_FOR[starter.id]`) is the switch between
  the two unlock paths.

## Saved runs

The run in progress is checkpointed to its own localStorage key
(`pokedb.run.v1`, helpers at the bottom of `js/storage.js`) every time
`showMap()` runs, so a refresh resumes on the map before whatever room you
were in; a battle is replayed from the start, never serialised.
`checkpoint()` / `restoreRun()` in `js/run.js` store everything by id
(starter, cards, relics, unlocks) and rebuild from the data files; `mods`
is recomputed with `modsFor(level)`. The map's `floors` and `byId` share
node objects, so restore rebuilds `floors` from `byId` to keep `visited`
in sync. Every fight node gets its `enemyId` in `startBiome()` so a
refresh can't reroll a fight (only elites/bosses show a scouting badge).
The save is cleared by `endRun()`, by `abandonRun()` when a run was live,
and by the About dialog's erase. Fight coins and the enemiesDefeated stat
are shown on the reward screen but only paid out as the rewards end, just
before the checkpoint, so refreshing on a reward screen can't pay twice.
A version mismatch or any bad id silently
discards it: bump `RUN_SAVE_VERSION` when the shape changes. The start
screen's Continue button (`renderContinue()` in `js/main.js`) shows
whenever a valid save exists, and Begin run confirms before replacing it.

## Battle screen layout

There's no top HUD bar. The arena shows each fighter with a **nameplate**
(name + HP bar) under the sprite and a row of **status badges** above it:
round icons with a number bubble (block, burn, weakened, strength, focus,
guard, next-turn energy), built by `badgeFor()` in `js/battle.js`. A badge
only renders while its status is active, and each one explains itself in
its `title` tooltip. A nameplate gets `.has-block` (blue HP-bar rim) while
that fighter has block. Below the arena, `.battle-controls` is a 3-column
grid: energy orb | hand | End Turn + draw/discard counts. On phones the orb
and End Turn share a row above the hand so the cards get the full width.
Relics show as small icons in the arena's top-left corner (`#battle-relics`).
Enemy sprites are frameless; elites and bosses are marked by a red/gold glow.

**Watch for CSS class-name collisions.** The reward screen already uses
`.relic-icon`, and a later, unscoped rule like
`.relic-icon { font-size: 3rem }` wins over anything earlier in the file.
That's why battle uses `.battle-relics` / `.battle-relic`. Before adding a
generic class name, grep `css/` and `js/` for it.

## Map screen

The top `.run-card` shows your Pokémon inside `.hp-ring`, an SVG ring that
*is* the HP bar (`pathLength="100"`, so `strokeDashoffset = 100 - hp%`;
`data-level` turns it yellow/red and it pulses when low), then the name and
two `.run-pill` buttons: Deck (the deck dialog) and Relics. Relics and the
map Key (next to the biome name) are both `.drop` drop-downs, wired by
`DROPS` / `initDrops()` in `js/run.js`: opening one closes the other, and
they close on an outside tap, Escape, or whenever `showMap()` runs. Their
rows reuse the How to play `.howto-li` / `.howto-node` styles, so keep the
key's wording in step with the How to play map slide. The run card has
`z-index: 6` because its backdrop blur makes a stacking context; without
it the Relics drop-down renders under the map heading.

The shop's top-bar button (`.shop-btn`) has no chrome: it's a CSS Poké Mart
(`.mart`, sized in em so one `font-size` scales it; also used small on the
How to play shop slide), and
`aria-expanded` on it drives the pressed-in "shop is open" look. Keep that
attribute in sync if you add another way to open or close the shop:
`toggleShop()` sets it to true, and the dialog's `close` listener in
`js/main.js` sets it back to false.

## Top bar and start screen

There's no bar: the top-left Poké Ball (`#brand-btn`) opens a drop-down
(`#ball-menu-panel`, wired in `initBallMenu()` in `js/main.js`) holding Main
menu, Stats, Achievements, Sound, How to play and About (Stats and
Achievements are windows built fresh from the save by `js/records.js`). The
top right only shows coins and the
Shop. The "Main menu" item hides itself on the start screen (`showScreen()`).


The logo is built from per-letter spans in `index.html`: "Poké" uses the
Sniglet Google Font (loaded in `<head>`, logo only), "DB" uses the normal
heavy font, and the "o" is a CSS Poké Ball (`.pokeball`). The "How to play"
button's orbiting sparkle ring is drawn on a 2D canvas by `js/fx.js` with
hand-rolled 3D projection, deliberately not Three.js, to keep the page
light on phones. It only animates while the start screen is showing, and
all start-screen motion stops under `prefers-reduced-motion`.

How to play (`#help-dialog`, `js/howto.js`) is a row of swipeable slides
(native CSS scroll-snap, plus dots, Next/Prev and arrow keys). Open it with
`openHowto()`, not `openDialog()`, so it always starts on slide 1. The shop
slide is filled from `COIN_REWARDS` and `PASSIVE_SHOP_ITEMS`, and turn one
uses a real card, so the guide stays in step with the game data.

## Music

`js/audio.js` plays one looping track at a time from `assets/audio/`:
`title` on the menus (triggered in `showScreen()` in
`js/ui.js`), `map1`–`map3` on each biome's map (`showMap()` in `js/run.js`),
`wild` / `elite` / `boss` chosen by `encounter.kind` in
`startBattle()`, `victory` from the moment an enemy faints (`finish()` in
`js/battle.js`) through the reward picks, and `center` at rest sites
(`restSite()` in `js/run.js`). `showScreen()` deliberately leaves the map and
reward screen's music alone so each of those can choose its own track.
Tapping Rest cuts the music (`playMusic(null, { cut: true })`), plays the
`heal` chime from `assets/audio/sfx/`, and waits for it before returning to
the map. Sound effects are decoded buffers played with `playSound()`; to
add one, list it in `SOUNDS` (`{ url, gain }`, gain boosts a quiet file) and drop the MP3 in `assets/audio/sfx/`
(attack hit sounds were planned but are on hold). Tracks crossfade and
each file downloads only the first
time it's needed. Title resumes where it left off; battle tracks restart
each fight. To change a song, replace the MP3 (keep it around 1–3 MB,
128 kbps).
- Playback goes through the Web Audio API (a GainNode per track) because
  iOS ignores `<audio>.volume`, so plain elements can't fade there.
- Browsers block sound until the first tap or key press; `unlock()` starts
  the pending track then. Don't "fix" music not starting on page load.
- The Sound item in the Poké Ball menu saves `muted` in the save file (`js/storage.js`). On iPhone,
  Web Audio also respects the silent switch, which is intended.
- **Cries** (`playCry()`): one MP3 per sprite id in `assets/audio/cries/`
  (from play.pokemonshowdown.com/audio/cries/). Add the id to `CRIES` in
  `js/audio.js` when you drop a file in; ids not listed are silent, and
  `-shiny` ids use the base cry. A new cry cuts the previous one. They play
  on a starter tap and in the battle intro (`playIntro()` in
  `js/battle.js`: enemy cry, Poké Ball throw, your cry, then turn 1). The
  files are mastered ~4× louder than the music, hence `CRY_VOLUME` 0.12.
- `audio.js` defines its own `$` instead of importing `ui.js`, because
  `ui.js` imports `audio.js`.

## Conventions

- No comments unless they explain a non-obvious *why* (a workaround, a
  hidden constraint). Never comment what the code already says.
- Commits push directly to `main` — this is a solo project with no PR flow.
  Test locally first (see below), then commit and push.
- Commit messages explain *why*, not *what*.

## Testing a change before shipping

There's no automated test suite. Before committing:
1. Reload the page fresh and check the console for errors.
2. Actually play the affected flow in the browser — pick a starter, fight,
   reach the screen/dialog you changed, and interact with it — rather than
   just reading the code.
3. If it's a balance change (card damage, achievement difficulty, drop
   rates), a headless-bot regression harness can be built on request (it's
   never committed to this repo — it lives in Claude's scratchpad and gets
   rebuilt each time it's needed).
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
