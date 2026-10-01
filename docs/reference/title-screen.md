## Title screen

The title screen (`#title-screen`, `js/title.js`) is the game's **home** since 2026-09-28 (the user's design, from
Slay the Spire 2's title and pixel-art button references; mockups in `docs/mockups/`). It's a fixed overlay above the top
bar: a pixel sky for the time of day painted into a low-res `<canvas>` (`SKIES` in `js/title.js`; dusk, the user's pick
before the clock, is deep blue to a rose horizon, dithered; by day the moon is the sun and there are no stars; the moon up in the
corner clear of the logo, `moonOf()`; hills, the grassy ledge; stars twinkle at 10 fps and the odd shooting star crosses),
the flying legendaries crossing it one per pass over an empty ledge (the three starters that stood on it were removed, the
user's call 2026-09-28): `nextFlyer()` in `js/title.js` deals Moltres, Ho-Oh, Lugia, Reshiram, Celebi and Victini (`FLYERS`;
not Mewtwo, the secret) from a shuffled round on each `animationiteration`, a black silhouette until that one is unlocked,
then in colour (`.lit`, shiny if switched on via `spriteUrl()`), all at one scale from each GIF's width (`--w`, 64 at least) (the user's ask, 2026-09-28). With a saved run a battle `.nameplate` sits right under the gems, in `.title-center`'s flow (`#title-run`,
`renderRun()` in `js/title.js`; the user's call: neatly under Game Corner at every size) with the run's name and HP, the floor you stand on in that biome where the games' nameplate has its level (`#title-run-floor`: a grey pixel staircase, then "F7" in the name's font and size, the user's call; `floor` in `savedRunCard()`, the current room's `floor` + 1, 0 on the road in, like StS's Neow floor), the
biome's own map sign over it (`.title-biome`, a smaller `.biome-sign` that drops in: the Clearing's sways, the Shrine's has
mist drifting across, the Wastes' rim flickers like embers) and a red Abandon run pill under it (`requestAbandon()` in
`js/main.js`, after a confirm: the run is gone, nothing else changes; also an 🏳️ Abandon run item in the Poké Ball menu
whenever a run is saved or going). Continue's gem shimmers: `tick()` repaints its canvas with a slanted band of light
(`paintGem(..., sweep)`) crossing it every 3 s. New game hatches the Egg first (`hatch()`: it shakes harder, cracks, bursts
in a flash, `stat-up` then `ball-open`; straight through under reduced motion); the Pokémon itself waits in Continue's ball and pops out of it when you continue. The
top-left corner (`.title-corner`, gems up only) holds the cloud save's PC (see Cloud save) and a 🔊 Sound button whose
`#title-sound-panel` (a `.ball-menu-panel`) has the same Sound toggle and volume slider as the Poké Ball menu
(`SOUND_TOGGLES` / `VOLUME_SLIDERS` in `js/audio.js` keep both in step); the PC is captioned, the speaker isn't (the user's call); both are a size smaller under 600px wide, where the row also hugs the screen's corner. On phones they sit in one row along the top (PC, speaker, ❓, refresh, like battle's piles beside the Poké Ball; the refresh's margin centres it on the speaker), since stacked down the side they crowded the logo (2026-09-28). Over 600px wide there's room beside the logo, so it's one centred column (PC, speaker, ❓, refresh; the user's call). A small ❓ How to play (`#title-help`, the user's ask: 26px, 22px on phones, between the speaker and Refresh; it calls
`openHowto()`). A
small **version tag** (v0.9 until Mewtwo lands, then v1.0) (`#title-version`, a tilted cream sticker at the logo's top right, gems up only; the user's ask, 2026-09-28) bobs up 2px and back (the user found a wiggle and glint too much) until this version's notes are opened on the device (`.seen`, `pokedb.patchSeen` in localStorage, not the save), opens the Patch notes window (`#patch-dialog`, `js/patchnotes.js`): the newest patch's changes, then "In the game", then earlier patches. The words are `PATCHES` (newest first; the tag shows its version) and `IN_THE_GAME` in `js/data/patchnotes.js`: add an entry when a batch of changes ships, and keep the counts in step. A tiny 🔄 Refresh (20px, 16px on phones) (`#title-refresh`, `refreshGame()` in `js/title.js`, the user's ask) re-fetches every `.js` / `.css` file
the page loaded with `cache: 'reload'` (a plain reload can show the old game for ~10 minutes after a push: GitHub Pages'
cache), spinning meanwhile, then reloads; the save is untouched. Each page load opens on a blinking PRESS START (`showTitle()`); any tap or key
plays `confirm`, flashes white and brings up the **gem menu** (`renderMenu()`): a stack of pixel gems under the logo, each
painted on its own `<canvas>` by `paintGem()` (pointed ends, a dark outline, a two-tone bronze frame, an inner groove, a face
with a light band, a shade band, a gloss streak and glints; `gemPx()` CSS px a pixel, 4 or 3 on windows ≤700px tall, the
canvas a whole number of pixels wide so they stay square) with a bare pixel icon on its left end (a dark pixel outline, no
frame: the user's call): **Continue** (amber, only with a save; see Saved runs; the biggest gem, `GEM_BIG`, with a bigger label and a smaller ball, placed by `--icon-x` so it stays on the face), **New game** (violet, an Egg that wobbles while
picked, since Continue has the Poké Ball: the character select), **Collection** (gold, the Pokédex: the Collection screen) and **Game Corner** (coral: `toggleShop()`,
whose dialog sits above the title at z-index 90). Hover, focus or ↑ ↓ move a blinking ▶ (`point()`), Enter / tap picks, a
press sinks the gem. Leaving fades the title out over the screen you go to (`leaveTitle()`), and every way home (the Poké
Ball menu's Main menu, a run's end, Back on the select or the Collection, the About erase) comes back to the gems with
`showHome()`. The first PRESS START unlocks audio and opens the first-time How to play. `--ground` (set from JS) keeps the
CSS sprites on the painted ledge.

