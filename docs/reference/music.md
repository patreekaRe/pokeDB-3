## Music

`js/audio.js` plays one looping track at a time from `assets/audio/`:
`title` on the menus (triggered in `showScreen()` in
`js/ui.js`), `map1`–`map3` on each biome's map (`showMap()` in `js/run.js`),
`wild` / `elite` / `boss` chosen by `encounter.kind` in
`startBattle()` (an enemy's own `music` overrides it: Kenmatta's `kombat`, the user's 8-bit Mortal Kombat theme, 2026-10-01,
at `TRACK_GAIN` 0.25 since it's ~13 dB louder than `boss`, looped over its 85.97 s repeat with a crossfade, `boss` while missing), `victory` from the moment a wild Pokémon faints (`finish()` in
`js/battle.js`; after an Alpha, Team Rocket's included, or a boss it's `trainer-victory` instead, Red/Blue's trainer victory, the
user's file and pick 2026-09-29, `winTrack()`, looped with a crossfade like the maps and at `TRACK_GAIN` 0.35 since it's
mastered ~11 dB louder; `evolve()` resumes it after the evolution scene) through the reward picks (after a boss, paused for the evolution scene's `evolution` track; after a Level 5
win, the Hall of Fame's `hall-of-fame`, after any other won run `run-win`, each `victory` while its file is missing), and `center` at rest sites
(`restSite()` in `js/run.js`). `showScreen()` deliberately leaves the map and
reward screen's music alone so each of those can choose its own track.
Tapping Rest cuts the music (`playMusic(null, { cut: true })`), plays the
`heal` chime from `assets/audio/sfx/`, and waits for it before returning to
the map. `heal` is for rest sites only (the user's call): don't reuse it
for potions or other heals. Sound effects are decoded buffers played with `playSound()`; to
add one, list it in `SOUNDS` (`{ url, gain }`, gain boosts a quiet file) and drop the MP3 in `assets/audio/sfx/`.
An entry with both `url` and `synth` plays the file when it's there and the synth while it's missing (`loadSound()`
falls back on a failed fetch, which logs one 404 per page load until the file exists). The Safari Zone's catch uses this
(2026-10-02): **`catch-shake`** (each wobble of the ball on the ground) and **`catch-success`** (the ball latching shut on a
catch, with the "caught a Pokémon!" jingle) wait for the user's own files at `assets/audio/sfx/catch-shake.mp3` and
`assets/audio/sfx/catch-success.mp3`; until then `catchShake()` (a hollow knock and a plastic rattle click) and
`catchSuccess()` (a double latch click, then a four-note chiptune "Gotcha!") stand in.
`start`/`length` play only part of a file with a short fade-out, so a long or late-starting
effect is trimmed in code. A `synth` entry builds its sound in code instead of a file: `block` is
`blockClink()` at the end of `js/audio.js`, an 8-bit shield clink (the user swapped their MP3 for a generated one), normalized to 0.2 like the other synths (at 0.9 it was far too loud).
The user supplies the effect MP3s themselves.
The rest of `SOUNDS` and where each plays: `card` (`playCard()`; at 0.3 gain like `confirm`, the user's call), `hit`
(damage gets through, either side; `hitSound()` in `js/battle.js` plays `hit-super` /
`hit-weak` for super / not very effective hits, like the games' three damage sounds, falling
back to `hit` while those files are missing; a fully blocked hit plays `block`
instead; there are no critical hits), `block` (a card gains block; at half gain, the user found it too loud), `faint` (enemy KO, in `finish()`),
`confirm` (the same file as `card` and `item`, the user's call, but at 0.3 gain since it plays on nearly every tap: every window's confirm
sounds alike; `showChoice` plays it when an `ask` option is taken, or the option's
`confirmSound`, which Mart purchases and the Mart's removal set to `buy`. It's also the menu
blip, the user's call: `menuBlip()` in `js/audio.js` plays it on any click on a control
(`CONTROLS`: buttons, tabs, map rooms, cards, the reward text box, a card's dimmed focus layer
or zoom), unless that click already started an effect of its own; cries don't count, so a
starter tap blips then cries. New buttons get it for free; to silence one, keep it out of `CONTROLS`),
`item` (`useItem()` in battle), `potion` (a healing item, in battle or
`useItemOnMap()`; falls back to `item` while its file is missing), `buy` (a Mart ware or
removal is paid for), `ball-throw` / `ball-open` (the battle intro's Poké Ball; `ball-open` also on the title's Continue gem),
`stat-up` (strength or focus gained, either side, enemy buffs and Enrage too), `stat-down` (the enemy gets
Weak or Vulnerable), `item-get` (a relic or item received: reward picks via `confirmSound`, the Fan Club gift,
the Shrine; not Mart buys), `low-hp` (looped with `setLoop()` in `js/audio.js` while your HP is at 20% or
below, set on every `renderAll()`, off when the battle ends, is abandoned, or on mute), `event` (walking into a ❓ room, in `enterNode()`,
so "Back" re-renders don't replay it), `heal-hp` (a card or a power heals you, not relics; `potion.mp3`, the user's call; never the Center's `heal`),
`power` (a power card is played), `burn` (burn damage ticks), no sound when the discard pile is shuffled back in (the user dropped the synth riffle: it sounded distorted; a file may come later), `thunder` (the first lightning bolt of a boss's storm only, the user's call 2026-09-28: `storm.thundered` in `drawLightning()` in `js/scene.js`; later bolts are silent),
`coins` (a fight's PokéCoins and ₽ are paid, `collect()`; `buy.mp3`), `door` (walking into a Mart or Center, `enterNode()`; `event.mp3`, the same sound as a ❓ room),
`achievement` (`checkAchievements()` grants a starter), `bag` (the Bag opens and closes, and so does the Poké Ball menu: `setOpen()` in `js/main.js`; the user's call), `cancel` (the menu blip for
backing out, `bag.mp3` too, so every window closes with the Bag's sound: `CANCELS` in `js/audio.js`: Back / Skip / Leave (the Collection's and character select's Back too), No, a window's Close or ✕, a zoomed card; also Escape on a modal
window or the Game Corner, the Game Corner's top-bar toggle closing it, and backing out of a picked card or reward; falls back to `confirm`), `stick` (synthesized, `stickTick()`: the Game Corner's joystick moves), `fw-launch` / `fw-pop` / `fw-boom` / `fw-crackle` (synthesized: the Hall of Fame's fireworks, `js/celebrate.js`) and `run-away` (every way of running: the Poké Doll,
in place of `item`, and Team Rocket's "Run for it"; there's no running-away relic) and `no-pp` (tapping a greyed-out card that costs more PP than you have, with the PP box's shake, in `playCard()`). The user picked those file reuses. Synths
(`blockClink()`, `stickTick()`, the fireworks) should peak like the MP3s (~0.1–0.25, `normalize()`), or they come out far louder. The evolution scene has its own track
(`evolution`) and chime (`evolved`, see Evolving above). Battle sounds preload in
`startBattle()` (`thunder` only for bosses), map ones in `showMap()`, `confirm` / `cancel` in `unlock()`. A missing file is silent (one
404 in the console per sound per page load). `playSound()` drops a repeat
of the same sound within `SFX_MIN_GAP` (70 ms) and cuts a still-ringing
earlier copy with a 30 ms fade, so multi-hits don't pile up; different
sounds still overlap (a block card plays `card` + `block` together).
Muted or still-locked audio plays nothing. Tracks crossfade and
each file downloads only the first
time it's needed. The battle tracks (`wild`, `elite`, `boss`) are hard-cut clips of songs that keep repeating, so
looping the whole file cut mid-phrase back to the intro (the user found it broke the immersion, 2026-09-29): they loop
seamlessly inside the file instead, between `LOOP_POINTS` (seconds; the gap is the song's own repeat, 78.69 / 83.50 /
60.64 s, found by correlating each file against itself, and the seam checked by rendering it offline against the file's
own continuation). An `<audio>` element can only loop the whole file, so those play through `LoopedTrack` in
`js/audio.js`, a stand-in with the element's `play` / `pause` / `paused` / `currentTime` over a decoded buffer's
`loopStart` / `loopEnd`; only the playing one stays decoded (~50 MB each). Replacing one of those MP3s means finding its
loop points again (or deleting its `LOOP_POINTS` line). The map songs (`map1`-`map3`) loop too (2026-09-29): each file
is one pass of its song then a fade-out over its start coming round again, which matches in melody and beat (chroma and
onsets) but not sample for sample, so their `LOOP_POINTS` carry a third number, a 0.3 s equal-power crossfade across the
phase-aligned join (`LoopedTrack` then plays each pass as its own source; a pass's `onended` queues the pass after next,
from the audio thread, so a throttled background tab can't miss a join). `victory` loops too: its loop is short (11.25 s after a ~4 s
fanfare), which a first search that only allowed loops of 15 s or more missed. `title` has no convincing repeat in its
file (best chroma match ~0.87 over 4 s), so it still loops the whole file. Title resumes where it left off; battle tracks restart
each fight. To change a song, replace the MP3 (keep it around 1–3 MB,
128 kbps).
- Playback goes through the Web Audio API (a GainNode per track) because
  iOS ignores `<audio>.volume`, so plain elements can't fade there.
- Browsers block sound until the first tap or key press; `unlock()` starts
  the pending track then. Don't "fix" music not starting on page load.
- The Sound item in the Poké Ball menu saves `muted` in the save file (`js/storage.js`); the slider under it (`#volume-slider`)
  saves `volume` (0-1), squared onto `masterBus`, which every other bus runs through. `low-hp` plays at 0.35 gain (the user's call). On iPhone,
  Web Audio also respects the silent switch, which is intended.
- **Cries** (`playCry()`): one MP3 per sprite id in `assets/audio/cries/`
  (from play.pokemonshowdown.com/audio/cries/). Add the id to `CRIES` in
  `js/audio.js` when you drop a file in; ids not listed are silent, and
  `-shiny` ids use the base cry. A new cry cuts the previous one. They play
  on a starter tap and in the battle intro (`playIntro()` in
  `js/battle.js`: the enemy slides in on its pad from off the right edge as a
  silhouette, Diamond/Pearl-style, colours in and cries; then the Poké Ball throw,
  and your cry once it has popped out to full size; then turn 1. Each cry waits
  until its Pokémon can be seen (the user's call). The
  files are mastered ~4× louder than the music, hence `CRY_VOLUME` 0.12.
- `audio.js` defines its own `$` instead of importing `ui.js`, because
  `ui.js` imports `audio.js`.

