## Music

`js/audio.js` plays one looping track at a time from `assets/audio/`:
`title` on the menus (triggered in `showScreen()` in
`js/ui.js`), `map1`–`map3` on each biome's map (`showMap()` in `js/run.js`),
`wild` / `elite` / `boss` chosen by `encounter.kind` in
`startBattle()` (an enemy's own `music` overrides it: Kenmatta's `kombat`, the user's 8-bit Mortal Kombat theme, 2026-10-01,
at `TRACK_GAIN` 0.25 since it's ~13 dB louder than `boss`, looped over its 85.97 s repeat with a crossfade, `boss` while missing), `victory` from the moment a wild Pokémon faints (`finish()` in
`js/battle.js`; after an Alpha, Team Rocket's included, or a boss it's `trainer-victory` instead, Red/Blue's trainer victory, the
user's file and pick 2026-09-29, `winTrack()`, looped with a crossfade like the maps and at `TRACK_GAIN` 0.35 since it's
mastered ~11 dB louder; `evolve()` resumes it after the evolution scene) through the reward picks (after a boss, paused for the evolution scene's `evolution` track; `seal`, the user's song, from the descent's start (`descent()`, Mewtwo's fall too) through the Sealed Gate's strike and break, faded on a loss in `playGate()`, at `TRACK_GAIN` 0.22 since it's mastered ~13 dB louder (the user's file, 2026-10-04, 102 s with its own fade-out; since 2026-10-09 looped over a 38.18 s repeat, 41.4-79.58 s, cross-faded, as it is also the Crystal Depths' map song, the Depths' `music: 'seal'`, carrying on from Mewtwo's fall), preloaded at a Biome 3+ boss; after a Level 5
win, the Hall of Fame's `hall-of-fame`, after any other won run `run-win`, each `victory` while its file is missing), and `center` at rest sites
(`restSite()` in `js/run.js`), `mart` in a Poké Mart (`martRoom()`, the user's song, 2026-10-04: looped over its 48.71 s repeat with a crossfade, at `TRACK_GAIN` 0.27 since it's ~11.5 dB louder).
`savanna` on the Sunscorch Savanna's map at either fork, in place of its slot's `mapN` (a biome's `music` in `js/data/enemies.js`, read by `showMap()`; a new biome song is one such key): the user's song, 2026-10-09, 56.7 s fading from ~48 s, looped over a 23.51 s repeat (17.3-40.81 s, 0.95 melody match, cross-faded), at `TRACK_GAIN` 0.12 since it's ~18.2 dB louder than `map2` (RMS -13.4 vs -31.6).
`map4` (the user's, 2026-10-04) was the Crystal Depths' map song until 2026-10-09; since then it is the Sky Pillar climb's (`showMap()` plays it for any `isTower()` run, whatever biome the floors borrow), and the Depths play `seal` (the user's call). Since 2026-10-15 the Crystal Depths' map and Mewtwo's camp play `map4` too (the user's call: "use the sky pillar song on crystal depths"); `seal` still plays through the fall and the gate.
`ruins` on the Sunken Ruins' map the same way: the user's song, 2026-10-09, 133.4 s, looped over a 61.09 s repeat (16.05-77.14 s, 0.968 melody match, 0.912 at the join, cross-faded), at `TRACK_GAIN` 0.26 (~11.8 dB louder than `map2`, RMS -19.8).
`thornwood` on the Thornwood Jungle's map the same way: the user's song, 2026-10-09, 94.8 s fading from ~86 s, looped over a 65.34 s repeat (20.2-85.54 s, 0.888 melody match, 0.747 at the join, cross-faded; the finder's top pick, a 16 s repeat at 1.8 s, would have skipped most of the song), at `TRACK_GAIN` 0.15 (~16.6 dB louder than `map2`, RMS -15.0).
`safari` in the Safari lobby (`openSafariPrep()` plays it; shut without starting a run, `playMusic('title')` brings the Clearing's back) and on every Safari area's map, Daily and Duo Runs (`showMap()`, `run.safari`), in place of the `mapN` songs: the user's song, 2026-10-24, 69.2 s fading from ~60 s, looped over a 31.09 s repeat (17.25-48.34 s, 0.950 melody match, 0.800 at the join, cross-faded), at `TRACK_GAIN` 0.18 (~15 dB louder than `map2`, RMS -16.5). Fights keep their battle songs.
`team-rocket` in Team Rocket's ? room (an event's `music` in `js/data/events.js`, played by `eventRoom()`): the user's song, 2026-10-09, 75 s, looped over its 58.73 s repeat (2.5-61.23 s, cross-faded), at `TRACK_GAIN` 0.24 (~12.9 dB louder than `center`). Battle! cuts to `elite` as usual (the user's call: it stops when the fight starts); Pay / Run go back to the map's song.
`event-room` in the four indoor ? rooms, the Move Tutor's dojo, the Move Deleter's study, the Day Care and the Fan Club (their events.js `music`, like Team Rocket's): the user's song, 2026-10-11, 145.6 s fading from ~137 s, looped over a 62.97 s repeat (33.02-95.99 s, 0.998 melody match, 0.961 at the join, cross-faded), at `TRACK_GAIN` 0.36 (-19.2 LUFS, set level with `team-rocket`); Kenmatta's fight cuts to `kombat`, Leave goes back to the map's song.
`event-outdoor` in the Hot Spring, Berry Tree, Wishing Well and Item Ball the same way: the user's song, 2026-10-11, 86 s, its second pass fading from ~74 s, looped over a 37.24 s repeat (7.94-45.18 s, 0.996 melody match, 0.79 at the join, so a 0.3 s cross-fade), at `TRACK_GAIN` 0.16 (-12.1 LUFS).
`shrine-room` in the Shrine's ? room the same way: the user's song, 2026-10-11, 97.6 s fading from ~88 s, looped over a 57.55 s repeat (10.96-68.51 s, 0.995 melody match, 0.965 at the join, cross-faded), at `TRACK_GAIN` 0.2 (-13.9 LUFS). Every ? room now has a song of its own.
`gym-room` in a Gym Leader's 3D gym (`gymRoom()` in `js/run.js`, while you walk up), `gym-leader-battle` for the fight with their boss (`encounter.leader` in `startBattle()`, and `battleWipe()` from `fight()`), `gym-victory` from the moment it faints (`winTrack(kind, leader)`) through the badge, the rewards and the evolution (`bossWin()` in `js/run.js`, also the crossroads after a refresh): the user's songs, 2026-10-12. `gym-room` 77.9 s, looped over a 33.92 s repeat (23.2-57.12 s, 0.998 at the join, no cross-fade; since 2026-10-18 9-42.92 s, below), at `TRACK_GAIN` 0.52 (-21.5 LUFS, level with `event-room`); `gym-victory` 100.2 s, a 41.94 s repeat (36.92-78.86 s, 0.953 at the join, cross-faded), 0.47 (-21.4 LUFS, level with `trainer-victory`); `gym-leader-battle` is a 60.4 s clip with no repeat in it, so it loops its closest bars (17.83-49.18 s, a 0.5 s cross-fade), 0.13 (-8.6 LUFS, very loud, level with `boss`). Each falls back to `event-room` / `boss` / `trainer-victory` while missing.
`town-lantern`, `town-cinder`, `town-driftwood`, `town-sunwell` in Lantern Village, Cinder Springs, Driftwood Landing and Sunwell Bazaar (each town's `music` in `js/data/towns.js`, played by the town's walk in `js/run.js`; till then `shrine-room` / `event-outdoor`): the user's songs, 2026-10-15, loop points from `tools/loop.html` run headless (`LOOP_POINTS` in `js/audio.js` says each pick and why), gains set level with `event-room` at about -28 LUFS played. Lantern's song has no clean repeat (best melody match 0.65 over its 63 s body), so it cross-fades; re-run the finder if its join is heard. Highbough still borrows `seal`.
`eternatus` and `eternamax` for the Depths' final boss, its first form and its second (each its `music` in `js/data/enemies.js`): the user's songs, 2026-10-18, 179.5 s each, re-encoded to 128 kbps; loops from `tools/loop.html` run headless (46.25-167.23 s, a 120.98 s repeat, 0.999 at the join; 11.40-165.45 s, a 154.05 s repeat, 0.988), neither cross-faded; `TRACK_GAIN` 0.22 / 0.18 (-12.8 / -11.2 LUFS, set level with `boss`). Their `boss` fallback is gone.

`energy-well` and `credits` for the Depths' ending (the user's songs, 2026-10-18): `energy-well` from the Well's white-out through the epilogue stills (`wellEnding()` in `js/well.js`, in place of `seal`), 67.1 s re-encoded to 128 kbps, looped over its 48.02 s repeat (11.45-59.47 s, 0.988 at the join; the finder's first pick, 16 s, repeats too soon), `TRACK_GAIN` 0.17 (-13.8 LUFS, level with `seal`); `credits` from the Champion of the Depths' scene through the credits and Mewtwo's last word (`winScene()` plays it for a Depths entry instead of `hall-of-fame`), 251.2 s kept as given (124 kbps), no repeat in it longer than 11 s, so it loops the whole file, 0.16 (-12.8 LUFS, level with `hall-of-fame`). Preloaded with the final boss (`js/battle.js`, `preloadWinScene()`).

`treasure` in the treasure grotto (`treasureRoom()`, which plays it; `showMap()` brings the map's back): the user's song, 2026-10-11, 158.7 s fading from ~140 s, looped over a 92.46 s repeat (33.02-125.48 s, 0.997 melody match, 0.935 at the join, cross-faded), at `TRACK_GAIN` 0.29 (-17.2 LUFS).
`mart` also plays through the Poké Mall, its hall and every shop in it (`openMall()` in `js/mall-3d.js`, the user's ask, 2026-10-09; the doormat's `showHome()` brings `title` back).
`clearing-hub` stands in for `title` wherever the walkable Clearing is the title (`setHomeTrack()` in `js/audio.js`, set by `init()` in `js/main.js` and `openHub()` in `js/title.js`: every `playMusic('title')` plays it, so the hub, the character select and the doormat's way back all do; over the signs, or without WebGL, `title` again): the user's song, 2026-10-09, 84.5 s, looped over a 53.55 s repeat (22.3-75.85 s, 0.983 at the join, no cross-fade), at `TRACK_GAIN` 0.29 since it's ~10.7 dB louder (RMS -17.3 vs -28.0).
`secret-base` inside the Secret Base (`openBase3d()` / `reopen()` in `js/base-3d.js`; the doormat's `showHome()` brings `title` back): the user's song, 2026-10-09, 98 s fading out at its end, looped seamlessly over its own 43.85 s repeat (40.4-84.25 s, 0.997 at the join, no cross-fade), at gain 1 (as loud as `title`, -28 dB RMS). `showScreen()` deliberately leaves the map and
reward screen's music alone so each of those can choose its own track.
Tapping Rest cuts the music (`playMusic(null, { cut: true })`), plays the
`heal` chime from `assets/audio/sfx/`, and waits for it before returning to
the map. `heal` is for rest sites only (the user's call): don't reuse it
for potions or other heals. Sound effects are decoded buffers played with `playSound()`; to
add one, list it in `SOUNDS` (`{ url, gain }`, gain boosts a quiet file) and drop the MP3 in `assets/audio/sfx/`.
An entry with both `url` and `synth` plays the file when it's there and the synth while it's missing (`loadSound()`
falls back on a failed fetch, which logs one 404 per page load until the file exists). The Safari Zone's catch uses this
(2026-10-02): **`catch-shake`** (each wobble of the ball on the ground) and **`catch-success`** (the ball latching shut on a
catch, with the "caught a Pokémon!" jingle) play the user's own files in `assets/audio/sfx/`. His shake recording had three wobbles, so it's cut into
`catch-shake.mp3` / `-2` / `-3`, one per wobble, and `SHAKE_GAPS` in `js/battle.js` spaces the ball's wobbles (wider
than his recording, for suspense; 2026-10-02, his calls). A catch plays one sound at a time: the battle music cuts, the
`catch-click` synth latches, then his jingle alone, and only once it ends does the victory music start, as the reward
opens (`ballAnimation()` / `caughtIt()`); `catch-success.mp3` is his jingle, its trailing silence cut. If a file fails to load,
`catchShake()` (a hollow knock and a plastic rattle click) and `catchSuccess()` (a double latch click, then a four-note
chiptune "Gotcha!") stand in.
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
or zoom), unless that click already asked for an effect of its own (counted as it's asked, not as it starts: the tab's own sound could still be waiting on the context, and the Ranger Task Board's tabs clicked twice on a phone, 2026-10-18); cries don't count, so a
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
`achievement` (`checkAchievements()` grants a starter), `bag` (the Bag opens and closes; the user's call), `cancel` (the menu blip for
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
`loopStart` / `loopEnd`; only the playing one stays decoded (~25 MB each, mono), and only up to its loop's end (2026-10-18, below). Replacing one of those MP3s means finding its
loop points again (or deleting its `LOOP_POINTS` line). The map songs (`map1`-`map3`) loop too (2026-09-29): each file
is one pass of its song then a fade-out over its start coming round again, which matches in melody and beat (chroma and
onsets) but not sample for sample, so their `LOOP_POINTS` carry a third number, a 0.3 s equal-power crossfade across the
phase-aligned join (`LoopedTrack` then plays each pass as its own source; a pass's `onended` queues the pass after next,
from the audio thread, so a throttled background tab can't miss a join). `victory` loops too: its loop is short (11.25 s after a ~4 s
fanfare), which a first search that only allowed loops of 15 s or more missed. `title` has no convincing repeat in its
file (best chroma match ~0.87 over 4 s), so it still loops the whole file. Title resumes where it left off; battle tracks restart
each fight. **A new song's loop** (2026-10-09, the user's ask: every song they give should loop forever): open
`tools/loop.html?song=<name>` (the file in `assets/audio/`, or pick one), which runs in the browser (no Node needed): it
compares the song with itself semitone by semitone, levels included so a fade-out never matches, lists the best repeats
(Hear plays the 6 s before a join and jumps back), and prints the `LOOP_POINTS` line, with a 0.3 s cross-fade only when
the waveform at the join correlates under 0.95. It found Mart's 48.709 s to the sample. To change a song, replace the MP3 (keep it around 1–3 MB,
128 kbps).
- Playback goes through the Web Audio API (a GainNode per track) because
  iOS ignores `<audio>.volume`, so plain elements can't fade there.
- Browsers block sound until the first tap or key press; `unlock()` starts
  the pending track then. Don't "fix" music not starting on page load.
- The speaker in the Pokédex's Settings and on the title (`SOUND_TOGGLES`) saves `muted` in the save file (`js/storage.js`); the
  bar beside it (`VOLUME_SLIDERS`: `#volume-slider`, `#title-volume`) saves `volume` (0-1); dragging it up while muted unmutes, squared onto `masterBus`, which every other bus runs through. `low-hp` plays at 0.35 gain (the user's call). On iPhone,
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


- 2026-10-17: a preload (`preloadMusic`) of a looped track only fetches its MP3; it decodes on play. Decoding at preload held a boss fight's victory, Sealed Gate and phase-two songs (~40-70 MB each) at once and reloaded iPhones on bosses and Alphas.
- 2026-10-17: `pause()` drops `this.buffer` too, not only `this.decoded`: kept, every song played once stayed decoded for the page load (headless: 8 songs played, 10 still decoded; ~1GB if all 31 play). The MP3 bytes (~2MB each) stay, so a song comes back in a moment.
- 2026-10-18: the MP3 bytes go too (`this.bytes`; ~60 MB once every song had played), fetched again from the browser's cache on the next play (`LoopedTrack.fetch()`). Cries: only the last 32 heard stay decoded (`loadCry()`, `CRIES_KEPT`; all 248 were ~50 MB).
- 2026-10-18: a song decodes only up to its loop's end, plus a second (`decode()` cuts the MP3 at a frame with `mp3Upto()`;
  the whole file if the cut won't decode): what follows, a fade-out or a second pass, never plays. 17% less on average,
  ruins / kombat / event-outdoor ~40-45%. `wild`, `elite`, `boss` and `gym-room` loop from their phrase's second time round
  ([28, 106.69], [27.75, 111.25], [20.8, 81.44], [9, 42.92]; the old points in the comment over them): the files repeat
  sample for sample from ~13-14 s (0.25 s for gym-room), the new joins as clean (0.99-0.998 over 50 ms, 0.5 s and 2 s,
  stereo, against 0.985-0.998), and the boss song decodes to 82 s, not 180 (headless: 61 -> 28 MB). Not done: decoding at
  a lower rate. Above 16 kHz the songs hold almost nothing (37-45 dB down), but Safari's and Chrome's buffer sources resample
  by straight lines, ~3 dB off at 10 kHz from a 32 kHz buffer; and mono, as every song has real stereo (side 4-14 dB under
  mid).
- 2026-10-24: a looped song is folded to mono once decoded (`mono()` in `js/audio.js`), halving what the playing one holds (15-35 MB stereo). The user's pick over a lower `AudioContext` sample rate, which would dull cymbals and the top end; a phone's speaker plays mono the same. The MP3s stay stereo; the width the line above notes is what headphones lose.
