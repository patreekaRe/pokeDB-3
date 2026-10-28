## Battle screen layout

There's no top HUD bar. The arena shows each fighter with a **nameplate**
(a small Pokégear window: name + the same Gold/Silver `.gb-hp` HP bar as
the map, filled by `setHpBar()` in `js/ui.js`), laid out like the games: the
enemy's nameplate top left with the enemy top right, your Pokémon bottom left
with its nameplate bottom right. The nameplates are direct children of
`.arena` (outside `#enemy-zone`/`#player-zone`, which keep the sprites and the
`pop()` numbers) on a 2-column, 3-row grid; the two sprites share the middle
row in opposite columns, which keeps the scene short. The title row holds
just the name (and the enemy's type chip); under the HP bar, `.nameplate-foot`
has the HP numbers on the right. The **status badges** (`.badges`, still inside the nameplate in the DOM) float
just outside it since 2026-10-03 (the user's call): under the enemy's plate, over yours (absolute, so the plate never
changes size; yours wraps upwards). Each is icon then number with no chip behind it (the user's call, 2026-10-03; the number has a dark outline to read over the arena),
the number coloured blue/green/red for block/buff/debuff (block, burn, Weak, Vulnerable, strength, focus,
guard, next-turn energy, your own strength, and one per active power), built by `badgeFor()` in `js/battle.js`. A badge
only renders while its status is active, and each one explains itself in
its `title` tooltip. The biome's and level's extra enemy damage (`encounter.strength`)
is kept in `enemy.dmgBonus`, not `strength`, so an enemy doesn't walk in with a 💪
badge (the user found that confusing); only strength gained in the fight shows. A nameplate gets `.has-block` (blue HP-bar rim) while
that fighter has block. Below the arena, `.battle-controls` is a 3-column
grid: energy (`.energy-orb`, drawn as the games' **PP** like the
Diamond/Pearl move screen: a white `.pp-pill` (ringed in its panel's `--rim` colour, in a capsule-shaped panel, on every button built from it) with "PP" on the left and "2/3"
on the right, on a salmon striped panel; the max is `b.turnEnergy`, the
energy the turn started with; `data-shown` remembers the last value so the
number bumps when it changes, and `.empty` turns the numbers red) | hand | End Turn
(`#end-turn-btn`, not a `.btn`: the same salmon panel and white pill, so the
two match; greyed out while disabled; when no card in hand can be played, `.nudge` (set in `renderAll()`, items don't count) makes it hop, scroll its stripes and blink a gold ring, the user's call, so it's clear to end the turn; the ▶ it also blinked in the pill went 2026-10-03: it widened the button and crowded the Safari row); a tap with PP left and a playable card asks first, `askEndTurn()`, unless Settings turned that off). At 2x battle speed (Settings) `pause()` halves the enemy turn's and your hits' waits and `.fast-battle` halves the hit, lunge and pop animations. The
draw/discard/exhaust piles (`.piles` / `button.pile`: a floating pixel card and the
count, floating with no plate: polish batch 2 put them on biome-coloured plates, the user preferred them floating and a step smaller, 2026-10-03) live in the top bar beside the Poké Ball, shown only
while `body[data-screen="battle-screen"]`. The exhaust pile (🌫️, its own icon: 💨 is shared) only shows once a card
has been exhausted; played powers also go to `b.exhaust` (so they leave the fight) but, as in StS, never count as
exhausted (`exhaustedCards()`). Tapping a pile opens `#piles-dialog` (`openPiles()` in `js/battle.js`, the user's call
2026-09-28, StS's pile screens): Index-style tabs Draw / Discard / Exhaust with counts, the draw pile sorted by name
(its order stays secret), the others latest first, cards grouped by object (a grown copy is its own card), each
`zoomable()`; it closes when the fight ends.
A played card goes to exactly one pile in `resolveCard()`: power → `b.exhaust`, exhaust/Corruption/Lum Berry →
`exhaustCard()`, else the discard. From 6c.11a (2026-09-27) to 2026-09-28 a misplaced `else` also put every power and
Exhaust card in the discard pile, so powers stacked every reshuffle and Exhaust cards came back; the sim had the same
bug, so bot numbers from those days include it. Relics don't show in battle (they
are in the Bag). Above them, `#battle-log` is a Gold/Silver
text box: `log()` types each line out (instantly under reduced motion) into
`#battle-log-text`, while `#battle-log-live` gets the whole line at once for
screen readers; `.done` shows the blinking ▼. The box is always two lines tall, like the
games', with exactly that room (plus a gap) reserved under your nameplate; a line
that would need three gets one notch smaller text (`fitLog()`), and the rare one
that still doesn't fit grows a line (the user's call). On phones the PP box
and End Turn share a row above the hand so the cards get the full width.
The enemy's next move (`#enemy-intent`, `renderIntent()`) is a compact
one-row Pokégear bubble over its head: icon, number, move name, and a pixel
tail. Its frame colour is the move kind (red attack, purple drain, blue
defend, green buff), and it pops in (`.fresh`) only when the move changes.
On short phones (≤700px tall, like the iPhone SE) the scene is tight, so a
media query at the end of the phone rules compacts the nameplates, keeps the
enemy's box square (`min-height: 0`, or a tall sprite like Oddish stretches
it), trims the space under your Pokémon so your nameplate clears the enemy's
feet, and keeps room above the text box; the phone rules also keep a 10px
gap between the two columns.
Hints live in `title` attributes. `js/tips.js` shows a tapped or clicked
element's `title` in `.tap-tip` (on `click`, not pointerup, and never within `SCROLL_QUIET` of a scroll: phones send no
click for a swipe or for the tap that stops a gliding scroll, which used to pop tips up; don't give a `title` to things
whose text already says it, like achievement rows, Index tiles or HP bars), a mini copy of the battle text box that stays until the next tap or click
anywhere. A mouse also gets it on hover (after 350 ms, gone on leaving),
in place of the native tooltip: while hovered the `title` moves to
`data-tip` and comes back on leaving. Taps and clicks on buttons and other controls are skipped, since tapping
them already does something (hover still shows their hint). Give new non-button things a `title` and they get
this for free.
There are no toasts (the user's call: no pop-ups that don't fit their area). Run news goes to `tell()` in
`js/rewards.js`: it's said in the next `showChoice` text box, before that screen's own lines, or on the
map in `#map-log` (the same box, pinned to the bottom of the map; `showNotes()` runs at the end of
`showMap()`, and straight away if you're already on the map, e.g. a Bag item used there). `beginRun()`
and the result window drop leftover notes (`dropNotes()`); the result window lists unlocks and the win's
coins itself. A note about one element uses `tipAt(el, text)` from `js/tips.js` (a locked starter's
how-to-unlock), and the Game Corner says its own on the CRT.
Scrollbars are chunky square pixel bars (end of `css/base.css`: `::-webkit-scrollbar`, `scrollbar-color`
only for browsers without it, since Chrome drops the webkit rules once it's set): a bevelled grey thumb in
a dark slot, a parchment slot inside windows.
Every `showChoice` screen also shows your HP: `#choice-plate` in the top bar beside the Poké Ball (since 2026-10-03
just the `.gb-hp` bar and its outlined numbers over the scene, no window behind them: the user's call; shown only on `body[data-screen="reward-screen"]`), filled by
`showChoiceHp()` in `js/rewards.js` from `trackHp()` (run.js hands it the run); the Center's Rest refreshes it
as the heal runs. On ≤420px the bar drops its HP: tag, and on ≤340px the PokéCoins step aside for it.
Every `showChoice` screen (rewards, Center, events, Mart) puts its `sub` text
in `#reward-log`, a copy of the battle text box pinned to the bottom of the
screen, narrow and centred (`--log-w`: 440px, 300px on phones; the user's call: no
stretched text boxes; the untyped rest of a line is laid out invisibly, `.log-rest`,
so centred text doesn't slide as it types); the Skip / Leave button (in `.reward-actions`, with Oak's Advice's Reroll beside it) sits centred right under the options (the user's
call: not off to the right by the text box), except on the floating-thing screens (Item found, the treasure grotto),
and the relic rewards (`showRelics()`: elites, bosses, the Item Ball, the Wishing Well; since 2026-09-28 they burst out in
a flash and float in a row in the treasure room's rays, gold for a boss, tap one to read it, then again or Take it),
where the text box sits with the thing and Skip / Leave goes to the very bottom (the user's call: nothing should pull you
off the item). It draws its
`.relic` tiles (relics, items, choices) as parchment Pokégear windows, which on
phones become short rows (icon | name over text) so a choice isn't a screen tall (`sayLines()` in `js/rewards.js`; `sub` may be a list of lines): lines
type out and wait for a tap, like the games (the user wants no autoplay), and a tap on
the last line closes the box. After
a fight, `coins` (`run.pendingCoins`: `{ foe, coins, money }`)
shows as an icon row (💰 +25 💴 +₽120) on every step, and the first screen's
box says "The wild X fainted!", the PokéCoins and the ₽ as separate lines.
Options with `ask`/`confirm` (card, relic and item rewards) take two taps: the
first blows a copy of the tile up in the middle of a dimmed screen
(`openFocus()`, reusing battle's `.card-focus`/`.focus-card`) with the
`confirm` ("Add to deck") under it; the big tile or that button takes it, the
dimmed area or Escape backs out. "Add to deck" and Skip are `.ds-btn`s: End
Turn's striped panel and white pill, green (`.ds-go`) or blue (`.ds-skip`),
with a blinking ▶ in the pill. The menus' own buttons are **pixel pills** instead (`.pxb` in
`css/menus.css`, the user's reference, 2026-09-28): a button of two spans (`.pxb-o` the dark outline, `.pxb-i` the face, both
clipped to stepped 3-2-1 pixel corners by `--steps`) with a light band on top, a shade band below, white glint dashes and a
solid drop shadow; colours `.green` `.blue` `.purple` `.orange` `.sun` `.red`, `.white` for white labels, `.small`, `.on`
for a lit toggle or tab (a tab that's off sits back). They're the character select's Back / Choose / tabs / Shiny, the
Collection's Back and the Prepare step's Back / Begin run. The reward, battle and Mart capsules (`.ds-btn`) stay as they are
for now. Battle's picked card / item shows a red `.ds-play` Play / Use button (`focusButton()` in `js/battle.js`) instead of "Tap again to play".
Titles are short headers on a pixel-font plate ("Learn a new move", "Item found").
In the read-only deck views (the Prepare step's starting deck, `renderDeck()` in `js/select.js`, and the Bag's deck
window, `fillDeck()` in `js/deckpreview.js`) a tap on a card blows it
up (`zoomable()` / `zoomCard()` in `js/ui.js`); any tap or Escape closes it,
and inside a dialog Escape closes only the zoom.
The hand is held in a fan (`fanHand()` in `js/battle.js`, rerun on resize): cards
overlap, tilt and sink towards the ends, StS-style, squeezing closer as the hand
grows so the whole hand always fits (it never scrolls). It uses the `rotate`/`translate` properties so
the hover lift and deal animation (`transform`) stay separate; a hovered or picked
card straightens and comes to the front.
A card's pick from your hand (discard, exhaust, keep, Mimic's copy: `pickFromHand()`) takes two taps too: the first lifts
it like a played card with a button naming the verb (`PICK_VERBS`, `choosing.picked`), the second confirms (the user's call).
While one is asked the battle dims under the hand and a banner names it (`renderPicking()`, `#pick-banner`, `PICK_TEXT`;
`#battle-screen.picking`, `data-pick` colours it: exhaust purple, discard blue, keep green, copy gold, as are the pickable
cards' pulsing rings and the risen card's button, `.pick-<verb>`), and an exhausted pick burns away first, as does a card exhausted as it's played (an Exhaust card,
Corruption, a status card under Lum Berry: `playCard()` starts it without waiting), an ethereal card at the end of the turn
and Burning Jealousy's hand (`burnOut()` -> `burnAway()` in js/cardfx.js, roadmap 8, 2026-10-03; skipped under reduced motion,
half as long under 2x speed: a ragged, glowing edge eats it from the bottom up, charring, its embers rising and a few drifting into
the exhaust pile, which it shows if hidden and bumps): the user exhausted a card thinking they were playing it (2026-09-28).
Playing a card takes two taps (clicks or Enter presses too), except a card that
can't be played: one tap logs why and shakes the PP box, with no big preview
covering it. `tapCard()` first
picks it (`selectedUid`, `.selected` in the hand) and `renderFocus()` lifts a
big copy straight up out of its place in the hand, StS-style (the user's call:
it used to blow up in the middle over a dimmed screen): `popFromHand()` places it
in `#card-focus` (a see-through full-screen layer, `.rise`), grows it from the hand
card's box, hides the hand's copy (`.lifted`) and sets a small Play button under it. Since 2026-10-04 it is
**Sliding through the hand** (2026-10-04, the user's ask): hold a hand card (or the risen one) and slide sideways: `initScrub()` in
`js/battle.js` raises whichever card is nearest the finger's x (by `offsetLeft`, so the spread doesn't move the targets), with
the `stick` tick and a short Android buzz; letting go leaves it up and swallows that click, so only a fresh tap plays it.
Works for discard / exhaust picks too. **Swipe up to play** (same day): drag a card up out of the hand and the risen card
follows the finger; once it is `FLING` (40px) above where the finger started and above the hand it glows (`.flinging`) and
letting go plays it (or confirms the pick), like a second tap. The whole `#battle-screen` is `touch-action: none` with no
long-press select/callout, and the page has `overscroll-behavior: none` there, so the fighters, nameplates and bars never pan
or pull to refresh (the pile picker keeps `pan-y` to scroll).
Every battle shows `.hand-hint` in the gap over the fan, behind the cards (absolute in `.hand-wrap`, `isolation: isolate`, `z-index: -1`): "<— hold to drag —>" and "swipe up to play" fade in turn on turns 1-2 (gone from the 3rd, `HINT_TURNS`), gold on a see-through dark pill so they read over any scenery.
smaller (`--card-w: min(38vw, 160px)`) and its Play button stands just above the hand card, so the rest of the hand stays
in view (the user found it too much in the way).
Once played it flies off to where it acts (`flyCard()` -> `flyTrail()` in js/cardfx.js, the user's call 2026-09-28, 0.4 s,
0.2 s at 2x, never awaited): an attack arcs high, spinning, into the enemy as the hit lands, anything else drops glowing into your
Pokémon, both shedding a trail in the card's type (Fire embers, Water droplets, Grass leaves, Psychic sparkles, Neutral white;
roadmap 8, 2026-10-03) with a burst where it lands. The particles live on one canvas (`.card-fx`). Since 2026-10-28 (branch
`clean-card-fx`, the user's ask: the pixels looked messy) they're drawn smooth at the screen's sharpness (at most 2x, the canvas
emptied to 0x0 once idle, it's megabytes): soft glowing embers cooling white to red, turned and stretched water droplets,
spinning, tumbling leaves, twinkling four-point stars (Psychic, Electric), snowflakes (Ice), soft specks, and a ring where it
lands, from sprites painted once per type (`drawClean()` in js/cardfx.js); the exhaust burn's edge is a smooth wavering glow
over a char band (`burnClean()`). The physics is shared: particles move in units of 3 CSS px on phones, 4 wider. `?pixelfx`
shows the old look for a page load: whole pixels on a low-res canvas, faded by stepping down a palette. **More effects** (2026-10-28, branch `more-card-fx`, the
user's ask, all of the ideas at once; `js/movefx.js`, drawn on the same canvas and loop through `kit` in js/cardfx.js):
each attack's hit plays its move's effect (`MOVE_FX` in js/data/move-fx.js, else its type's `TYPE_FX`: a stream, wave,
beam, bolt, bubbles, blades, petals, vines, flames / inferno, orb, frost / blizzard / shards, rings, punch, slash,
fangs, rocks / quake, gust / twister, void; a multi-hit move's later hits only punch and flash), the hit's light over the
scene, the foe's sprite flashing its colour (`tintFoe()`, masked like `statFx()`), the 3D arena's sky light leaning to it
(`glowArena()` in js/arena-3d.js: no new light, so no shader rebuilds) and a jolt as big as the hit (`.fx-jolt`, `--jolt`;
not under `calmFx()`, and a big hit keeps `bigHit()`'s); all of it from `strikeFx()` in js/battle.js. A 3-PP (or X of 3+)
or rare card's cut-in plays first (`cutIn()`, 0.6 s, 0.3 at 2x: the screen dims and a band in its type's colours sweeps
across with its name) and its first hit holds a beat (`.hitstop`). Block gained forms a hex shield bubble round your
Pokémon (`shieldFx()`, at most one each 0.4 s), a heal raises green motes (`healFx()`), and the foe's Burn, Leech Seed,
Static and Frostbite show on it all fight (`ambience()`, from `renderStatus()`; the loop drops to half rate once only
that is left, and stops off screen). The flying card leaves a tapering ribbon (`ribbon()`), and a risen card glows its
type's colour (`.lift-glow`, opacity only). Settings' **Effects look** (`cardFx`: Smooth / Pixel / Off) picks the canvas:
Pixel draws everything, the new effects too, in pixels; Off skips them (Battle animations Off skips them too).
**PP and End Turn** (2026-10-28, the user's ask, to match): a turn's refill swirls gold motes into the PP pill, then a ring, a flash and stars as they land (`ppFx()` in js/movefx.js, from `ppChanged()` in js/battle.js, flagged by `b.refilled` in `beginPlayerTurn()` so it plays even when PP comes back to the same number), while the capsule charges gold (`.energy-orb.refill`), a shine sweeps it (`::after`, a background-position sweep) and the number pops gold (`b.fill`); a card's +PP gathers a few motes and the shine (`.gain`); spending PP puffs gold sparks off the number. Pressing End Turn (`askEndTurn()`, not a switch or throw that ends the turn) flashes it, throws a ring, speed lines and sparks up toward the arena (`endTurnFx()`) and sweeps the shine (`.pressed`); the shine also runs with End Turn's hop when nothing is left to play (`.nudge`). Each one-shot class comes off once played (`replay()` in js/battle.js): left on, `.pressed` outranked `.nudge`'s looping shine, and a hidden screen's animations replay when it next shows. Changes within one fight only (`ppShownFor`), so a new fight doesn't puff. **The plates' look** (2026-10-28, the user's ask, merged from branch `button-look`): PP, End Turn, Throw and Mulligan are dark glass plates with a rim (`--rim`: the turn banner's gold, Throw green, Mulligan violet, PP red when empty), skewed -8deg with their contents skewed back, in one block after the hover rules in css/screens.css that overrides the older salmon DS-capsule rules above it (ids in its selectors, since the hover rules match through `#end-turn-btn`). PP's number is slanted white Chakra Petch (gold on the gold fill didn't read) over `.pp-fill`: gold liquid to `--lvl` (the PP left of the turn's), kept across renders so its height eases, rising after the refill's motes (`.refill` delays it) and full to the plate's top; no wave or bubbles (the user's call: pips, then a wave, were tried). End Turn reads "END TURN »" (`.et-arrow`, running and the rim breathing under `.nudge`). `tests/move-fx.test.mjs` checks every `MOVE_FX` line names a card and an effect that exists. **Kept cheap** (2026-10-28, the
user's ask before main): the canvas draws at 1.5x CSS pixels at most (2x dropped frames headless in a busy fight and
held 5.6 MB; 1.5x holds 3.2 and dropped none), is cleared when quiet and freed after 5 s of it (freeing it at once made
the next card's first frame cost ~4 ms), particles are capped at `MAX_PARTS` (450), drawn in two passes by blend (the
glowing ones in one run) with `put()` setting the transform outright rather than a save/restore each, the dead dropped
in place, and every gradient a sprite painted once (a hit's light, the shield, a scorch, the void). `tools/fx-probe.mjs`
measures it: 1.1 ms a frame on average, 2.2 at the 95th percentile, and nothing left behind or growing. The card is a clone flown by a Web Animation of transform and opacity (2026-10-18:
moved by hand every frame it restyled ~60 elements a frame and stuttered whenever the 3D arena, the text box or the hand's
redraw ran long; a block's glow is `.fly-glow`'s opacity, not a filter). `renderHand()` keeps a hand card's node while it
would look the same (its HTML, less the art's numbered SVG ids), so a tap no longer rebuilds and re-fits the whole hand; a
card that changes is rebuilt. The Ability chip's sheen and glow are transform and opacity layers (`.ability-shine`) for the
same reason: their background and box-shadow repainted every frame of a fight. A card that exhausts burns
away instead (`burnOut()`). Tapping that big card plays it, tapping elsewhere or Escape cancels
(`cancelPick()`), and tapping another hand card through the layer switches
(`elementsFromPoint`, by `data-uid`). Items still blow up at the bottom middle. The pick clears
itself whenever the battle is busy or the card leaves the hand.
Your Pokémon grows as it evolves: its sprites (map card, map
trainer) carry `data-stage`, and CSS scales stage 0 to 78% and
stage 1 to 90% with the `scale` property (from the feet), so the attack
animations' transforms and the layout are untouched.
**Evolving** (roadmap's Evolution overhaul, 2026-09-28, cosmetic only) is Gold/Silver's scene, `evolutionScene()` in
`js/evolution.js`, awaited by `evolve()` in `js/run.js` (the first boss reward step; the stage, HP and heal are already
applied). ~1.3 s into the victory fanfare the screen flashes white twice like `battleWipe()` and holds white
(`#evolve-scene`, a fixed layer at z-index 950 over everything; the music fades out). The Pokémon fades in alone, stood on
its feet at 58% of the height (both forms share one scale fitted to the bigger resting pose, `SPRITE_FIT` for the feet,
centred on its body, not its box: `bodyX()` / `BODY_X` in `js/data/sprite-fit.js`, the middle of the columns at least 60%
as tall as the tallest, so Charmeleon's tail flame hangs off to the side (the user saw it sit left, 2026-09-28, and still
left of centre on 2026-10-12; the select, battle, Hall of Fame and gate scene use it too; `tools/body-centre.py` measures a new starter),
legendaries' 78/90% stage steps folded in), and cries; its text box (`#evolve-log`, `sayLines()` with an `onDone`, taps
anywhere on the white or Enter advance) says "What? X is evolving!". The tap starts the `evolution` track
(`assets/audio/evolution.mp3`); `morph()` flashes it white three times, goes to a dark silhouette (`.dark`, `.white` are
CSS filters) and switches old/new forms, 560 ms down to 50 ms apart, then white flashes between the fastest switches,
ending on the new form under a full-screen flash (`#evolve-flash`). The song is cut, the new form cries, `evolved`
(`assets/audio/sfx/evolved.mp3`) plays with "Congratulations! Your X evolved into Y!" and the stats line. The last tap
starts `victory` again, runs the next reward step (Signature move) under the white, then fades the white out onto it.
Legendaries power up in place (the aura forms from `spriteUrl()`, cries strip `-shiny`), and so do bought shinies
(`spriteUrl()`). Under reduced motion the cries, song and chime stay; the white fades in, and the song plays ~5.5 s over
the still first form before the swap, with no flashing. `fight()` preloads the song, chime and both cries before a boss.
In battle, both sprites are sized from their GIF files instead (`sizeSprite()` in
`js/battle.js` sets `--size`): the Showdown sprites share one pixel scale, so
Teddiursa (36px) is drawn small and Snorlax big rather than all filling one box. The
curve is softened and clamped, and the enemy's base size is smaller than yours
because it stands further back (the user's call). Legendaries, which reuse one
sprite, get the 78/90% stage steps folded into `--size`. Sizes and placement use each GIF's
resting pose from `js/data/sprite-fit.js` (median bounds over every frame, since a
hop or a wingbeat widens the frame): `--shift`/`--drop` centre that pose on its feet
at the box bottom, and `--head-room` drops the enemy's intent to its head.
Re-measure (ImageDecoder over all frames) when adding a sprite. The enemy's pad is
sized from `--base` on `.enemy-zone` and sits so the feet land just below its middle;
`horizonRow()` in `js/scene.js` mirrors that. The deck
preview's swipeable evolution line uses bigger steps (64/88/116px).
Enemy sprites are frameless; elites and bosses are marked by a red/gold glow. **Body language** (2026-10-03): the GIF sits in `#enemy-pose` (`.enemy-pose`), a wrapper of its own between the box (whose `.attacking` / `.sinking` / `.emerging` / `.hit` animate it) and the GIF (`.recoil`, Eternamax's breath and charge, the reveal), so `renderPose()` in `js/battle.js` can animate it without clashing: `.bracing` (a crouch and flinch, `transform`) while the risen card is an attack, `.swaying` (`rotate`, so the two stack) below 25% HP, both from the feet (`transform-origin: 50% 100%`, where `sizeSprite()` stands them). It runs from `renderHand()` and `renderBars()`; off under reduced motion and on a `.defeated` / `.sinking` / `.captured` / `.ran` box. Kenmatta's aura canvas goes in it too (`img.after()`), so it moves with him.
Every screen is set in a pixel-art scene per biome
(`js/scene.js`, the user's call: the blurred photos clashed with the 8-bit
look; there are no photo backdrops left), lit for the time of day.
**Day and night** (2026-09-28, the user's call): every scene follows the device's clock, `timeOfDay()` in
`js/daytime.js` (dawn 5-7, day 7-17, dusk 17-20, night 20-5; `?time=` pins it). Scenery and light are kept apart so
per-floor stages (roadmap step 7) can plug in: a biome's `times` are its hand-painted looks (a `from` one is another
time's look graded under its own sky), and `kinds` lays an elite's or a boss's mood over whatever time it is (a `grade`
from `GRADES`, switches, `addLife`), since elites and bosses follow the clock too (the user's call). Anything without a
hand-painted look is graded (`grade()` in `js/scene.js`: every colour but `GLOWS`, sky keys by the sky grade) and
`relight()` swaps the sun for the moon and stars at night. The paint key includes the time, so the next screen after the
hour turns repaints.
**Progress dial** (roadmap step 7 part 1, 2026-09-28): `showScene(biome, kind, progress)` takes how far into the biome
you are, `journey(map, node)` in `js/map.js` (floor / (floors + 1), 0 on the road in, 1 at the boss; the map, battles and
outdoor ? events pass it; the paint key includes it). The painters read it as `dial()`: the Clearing's tree line grows and
crowds, a far wood hides the hills (from ~F3), big near trees frame the scene (F7+) and a leaf fringe closes overhead
(F9+), flowers thin out and shade creeps onto the grass; the Shrine gains up to 4 darker torii behind its gate (a tunnel)
and up to 3 pairs of stouter lanterns lining the path, with thicker mist; the Wastes' volcano looms from 72% to 122% size
with 1-3 lava flows running further down, more cracks, lava pools, embers and a brighter glow. The clock still decides the
light, so every floor gets every time. Shots of every floor x time: a headless script calling `showScene()` per step.
**Places** (step 7 part 2, 2026-09-28): each biome is 3 places plus the boss's arena, floors 1-3 / 4-6 / 7-10 / boss
(`stageOf()` in `js/map.js`; names in each `BIOMES` entry's `stages`). `journey(map, node)` now returns `{ progress, stage,
step, seed }` (step = floors into the place, seed = a hash of the map, so each run deals landmarks afresh and a refresh draws
the same), and `showScene()` / `showPlaceScene(..., { where })` take it (a bare number still works: no landmark). The painters
ask `stage()`: Clearing meadow -> forest edge (a stream winding along the back and down to the right, `winding()`, berry
bushes) -> deep woods (a canopy roof, dark trunks in a gloom, light shafts) -> the ancient giant tree; Shrine stone steps
(the gate raised on a flight, bamboo at the edges) -> torii path (as before) -> inner court (raked gravel, a plastered wall,
a bell tower) -> the main hall; Wastes ash plains (pale ground, dead trees, bleached boulders) -> lava fields (a lava river,
basalt columns, steam) -> the volcano's slope (rock rising at one side, sulphur vents) -> the crater rim over a lava lake.
Every floor of a place also gets one small landmark (`LANDMARKS`, 5 per place, 30 in all: signpost, log bridge, komainu,
koi pond, ribcage, warning sign...), dealt by the seed so two floors of a place never share one, at the back of the left
edge or the middle of the right (the deep woods: right only, the big trees frame the left), clear of the Pokémon. ? events
get the place but no landmark. Their colours are each biome's `marks`, painted by day and graded (a shade darker at dusk and
night). The map hangs the place's name under the biome sign (`#stage-name`, `.stage-sign`, swinging in when it changes).
Clearing: sunny day / sunset with fireflies / moonlit night / rose dawn. Shrine: misty
morning under pines with a torii, stone lanterns, light shafts and falling
leaves / dusk with lit lanterns and autumn leaves / night with blue spirit
wisps / pink misty dawn. Wastes: hazy volcano with glowing lava cracks, embers and ash / red
sky / a glowing night under a few stars / a violet dawn; an elite is a shade tenser, a boss darker and redder, with the
Shrine's spirits and lanterns out and the Wastes erupting (lava rivers, flying lava, lightning) at any hour. All of it is
data in `BIOME_ART` (shared per biome, `times` per time of day, `kinds` per fight; `life`
lists the animated parts), painted into `#scene-bg` (a fixed low-res canvas,
one canvas pixel = 4 CSS px on phones, 5 on PCs) by
`showScene(biomeId, kind)`: from `startBattle()`, and from `showMap()` with the
biome's normal scene (reward, Center, Mart and event screens keep whatever is
up, so an elite's rewards keep its light). The menus call
`showMenuScene(type)`: each starter type has its own scene, seen nowhere else
(`TYPE_ART`, same shape as a biome without kinds, pads or storms): Fire a red-rock
canyon (painted at sunset, `native: 'dusk'`) with a sparking campfire, Water a seaside with surf, a
lighthouse and a passing sail, Grass a jungle with giant trunks, swaying vines
and light shafts; each type's `times` gives the other times their sky and switches (`typeLook()`). With none picked
it's the Clearing, like the title. ? events outdoors stand in the biome's look for the time with their props graded;
`open: true` places (Hot Spring, Shrine, Day Care) are graded whole and take the biome's sky; indoor rooms keep their
light and only their windows (`view`, the Mart's `window`) change. The Pokémon Center (`restSite()`) has an indoor scene instead
(`PLACE_ART.center`, `showPlaceScene('center')`): a big Center logo (a Poké Ball
with a red cross) on the wall behind the counter, hospital monitors on ceiling arms
(a scrolling heartbeat, a party screen, and the big patient monitor: `centerVitals()` in
`js/run.js` lays your Pokémon's sprite, name and a green-phosphor HP bar over it, with what
Rest would heal blinking on the bar's end and "+N"; resting runs the bar and numbers up in
real time for the chime's length), and on wider walls a clock showing the real
time and the town map. Chansey is the real sprite and cries as you come in (`enterNode()`; `assets/pokemon/chansey-front.gif`,
`.center-nurse`, cropped at the counter top by `placeCenterSpots()`); on the counter
are the games' PC (a cream CRT with a blue menu, a keyboard) and the healing machine
(a tray of six slots and a screen), both outlined, shaded pixel maps (`pixelMap()`: one letter per pixel, the user wanted them detailed); a Poké Ball rug in front. Its `horizon: 0.6` puts
the counter below the Center's two tiles. Rest, like the games: the music cuts,
`healAtCenter()` drops your one Poké Ball into the tray (you carry one Pokémon, so
the other five slots stay empty) and resolves once it's in, then the `heal` chime
starts and `flashCenter(seconds)` flashes the ball for exactly as long as it plays. Then the text box says
your Pokémon is feeling better and the full bar stays up ~2 s before the map (the user
found leaving straight away too quick).
Asking for the scene already up leaves it
running (except in battle). Outside battles `#backdrop` (above the canvas)
dims it so windows stay readable; `setTheme(type)` in `js/ui.js` only sets
the accent colour now. Still parts are painted
once into `base`; `draw()` copies it every frame (30 fps, paused while the tab
or title screen hides it) and adds the living
ones. Since 2026-10-05 (the user's call) everything is still timed in 8-a-second
ticks (`FPS`; prelude beats, cue frames, `FPS * 2` timers), but `tick` moves
`DT` = 8/30 a frame: every per-frame move is scaled by `DT`, a check on a whole
tick (a flash on frame 0, `t % 2` blinks, random flame flicker) rounds the tick
down so it holds for an eighth of a second as before, and a one-off at a tick (a
sound cue, a spawn) uses `reached(n)` / `everyAt(n, k)` so it fires once, not on
every frame drawn during it. New life code must follow the same three rules. `sky` masks where clouds, smoke and birds may draw, so they pass behind
hills, trees and the volcano. `horizonRow()` puts the horizon at ~38% of the
screen but always above the enemy's pad, so the layout can move. Both
Pokémon stand on Gen 3/4-style pads (`--pad`, a data-URL pixel image: grass,
mossy flagstone or cracked lava rock, from the scene's `pad`), drawn by
`.enemy-zone::after` / `.player-zone::before` so they don't lunge with the
sprites.
Stat changes look like the games': `statFx(side, dir)` in `js/battle.js` lays a `.stat-fx` over the sprite, masked
with the sprite's own GIF (`mask`, contain, 50% 100%, the same fit as the `<img>`), with stepped stripes that
rise warm (`up`) or sink blue (`down`) for 0.9 s. It sits in `#player-zone` / `#enemy-portrait-box` so it moves
with a shake. Raises: strength, focus, Guard and block too (the user's call: block is Defense), either side,
including block at the start of a turn; drops: Weak and Vulnerable. Skipped under reduced motion.
**Block preview** (2026-10-03): while a card is raised, `showPreview()` in `js/battle.js` blinks the block it would add as a `+N` badge and the blue rim (`.block-preview`). The HP bars had a damage preview too (a blinking chunk, `previewHp()`), removed 2026-10-07: the user read it as a stray dot on the bar. Since the same day your HP bar shows the block instead (the user's ask): `shieldPreview()` lays the part of the enemy's coming hit that your block plus the card's would stop as a blue chunk over the end of the HP fill (`.gb-hp-shield`, at least 4px; a raised card's `.ghost` blinks between two blues, never to nothing), and the badge's title says how much; no chunk when the enemy isn't attacking or your Guard is up. `clearPreview()` runs on every `renderFocus()` and as the card is played, and puts back the chunk for the block you already have: since 2026-10-08 (R6, the user's ask) that one stays on the bar, steady, from `renderBars()`, until the hit lands, when `soakShield()` flashes it white and breaks it off (`.soak`) and `b.struck` keeps it away until your next turn. The enemy winds up before it lunges (`enemyLunge`), and a big hit
makes its sprite reel back (`#enemy-img.recoil`, on the img so it doesn't fight the box's shake animation); a
super-effective hit's number is red (`.pop.dmg.super`), either side.
Battle moments: a hit that takes at least a quarter of the target's HP
(clamped to 12–25) runs `bigHit()` in `js/battle.js`, which jolts `.arena`
(the `translate` property, so sprite transforms are untouched) and flashes the
screen white (`#battle-screen.big-hit`), skipped under reduced motion. The hit that fells an
Alpha, Kenmatta or a boss is a **finishing blow** (`finishingBlow()`, from the
hit loop, or from `finish()` for a Burn / Leech Seed / relic kill): every
animation in `#battle-screen` pauses for 350 ms (`.hitstop`, hit-stop) while the
enemy burns white (`.ko-flash`, masked by its sprite, blinking off in steps), the
number slams in big and gold (`.ko-num`), then `.ko-shake` jolts the arena in
whole steps and the faint plays. Under reduced motion only the number shows.
Eternatus's first bar skips it for its rebirth; Eternamax gets it. When a
boss drops to 30% HP, `checkStorm()` calls `setStorm(true)`: the biome's
`storm` (rain in the Clearing and Shrine, a rain of cinders in the Wastes)
fades in over 2 s with darker/redder light, stronger wind, faster clouds and
lightning every few seconds; `finish()` lets it pass, and every new fight
starts calm.

**Watch for CSS class-name collisions.** The reward screen already uses
`.relic-icon`, and a later, unscoped rule like
`.relic-icon { font-size: 3rem }` wins over anything earlier in the file.
Before adding a
generic class name, grep `css/` and `js/` for it.

**Turn banner** (2026-10-25, the user's ask, from Slay the Spire's): `turnBanner()` in `js/battle.js` lays a dark stripe
across the middle of `.arena` (`#turn-banner`, `.turn-banner` in `css/screens.css`) at the start of each of your turns,
"Battle Start!" (gold, with its own synth sting, `battleSting()` in `js/audio.js`) first on turn 1 with turn 1's own banner queued behind it (`turnNext`, dropped if End Turn comes first),
"Your Turn:" with the turn's number beside it (2026-10-25, the user's call: one line; a slanted gold Chakra Petch numeral that slams in), and "Enemy Turn" (a red rim) after End Turn, unless Time Warp or Eye of the Storm skips the
enemy. Your Turn and Enemy Turn each get Game Boy menu blips (`turnBlips()` in `js/audio.js`: three up, or two low ones down over a swish; 2026-10-25, the user's pick over soft bell chimes; a stat sound at turn start can cover them, which the user is fine with). It never blocks a tap; off with Settings' battle effects (`battleFx()`), a fade only under `calmFx()`, half as
long at 2x. Turn 1's Ability banner (Torrent, Pressure, Snow Warning) waits for both to go (`afterTurnBanner()`). The
Enemy Turn wait after End Turn went from 500 to 750 ms to let it read.

**A duo's switch** (2026-10-20, the user's calls from their phone): hold your Pokémon (`#player-zone`, `holdStart()` /
`holdEnd()` in `js/battle.js`, 450 ms; a conic ring fills round it, `.player-zone.duo.holding::after`) and the Go pill
comes up just over your plate, small (the user's call, 2026-10-20: not a centred window, so the enemy and its intent stay
in view): "⇄ Bulbasaur", then "1 PP · ends turn" and, when it matters, "▲ Ice Punch" / "▼ Ice Punch" in red / blue; the
full sentence is its title. A tap gives "Hold your Pokémon to switch partners." Through a duo fight's first two turns, "hold to swap" fades in and out over your Pokémon (`#swap-hint`, the hand
hint's look; gone after the first hold), centred on its pose's middle (`centreSwapHint()`, by `SPRITE_FIT`). A tap anywhere else puts the pill away. The bench portrait
on the plate's corner (and `HEAD_FIT`) came and went the same day: the Pokémon moved too much to read at that size. The
plates' type marks are round badges (`typeText()` in `js/type-badge.js`), not emoji.
**Lethal warning, relic flash, Victory / Defeat** (2026-10-25, the user's picks from the battle-juice list): when the
enemy's next attack would get through your block (`incoming()`: Evasion, Protective Pads, Assault Vest) for your HP or
more, the intent gets `.lethal` (a red throb and a 💀) and `#player-plate.danger` blinks your HP bar red (`battleFx()`
only; still under `calmFx()`; red arena edges were tried first and looked like a frame on a phone, the user's call); a hit your block fully covers gets a blue ✔. Relics doing something call `fired(id)` (hasRelic() plus
`relicFlash()`): the first time a relic fires in a fight it gets a stripe in the turn banner's style (`#relic-banner`, `relicBanner()`:
queued after any turn banner via `turnBusy`, one relic a stripe, one after another (the user's call), a new turn banner
replaces it), with what it did in green beside its name (`RELIC_GAIN`, "+2 HP"; `fired(id, gain)` for one that varies:
Enigma Berry, Spelon Berry; a new relic trigger needs a `RELIC_GAIN` line); no icons on turn 1, which has its banners; after that its icon, in Torrent's window (the user's call, after trying it bare), slides in from the arena's left edge
like Torrent's pop-up (`bannerIn`, above
where Torrent's shows), one at a time, the next sliding in as the last slides out (the user's calls:
chips with names every time were too fast and busy) (keyframes
`relicFlashRise`: `relicRise` is the reward screen's); passive
modifiers (damage, draw counts) use plain `hasRelic()` since they're read in previews too. `finish()` shows
`turnBanner('win')` (gold "Victory!", the fanfare is its sound) or `'lose'` ("Defeat…", grey, a falling `defeat` blip);
Overgrow's banner waits for it.
**Abilities in the same style** (2026-10-25, the user's call, every starter): `abilityBanner()` gives an Ability's first
use in a fight a stripe like a relic's, with what it did (`ABILITY_GAIN`: "🌊 Torrent +2 Tide"), and the Gen 5 window
sliding in from the left only from turn 2 on (with battle effects off, the window as before). Static (each enemy attack)
and Guts (lighting up as a status card comes in) now call it too; Overgrow's after a win queues behind Victory!
(`relicBanner(..., late)`). `afterTurnBanner()` is gone: the stripe queue (`turnBusy`) does its job.
