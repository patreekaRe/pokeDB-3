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
- **Cards** (`js/data/cards.js`): every effect is a key in a card's
  `effects` (the header comment lists them all) and `describe()` writes
  the card text from them, so new mechanics need a line there too. Beyond
  damage/block/heal there are multi-hits (`hits`), player `strength`,
  `power: true` cards whose `POWERS` keys (block/heal/burn/strength/draw
  each turn, thorns, blaze) stay on all fight as nameplate badges,
  `retain`, `exhaust`, `selfDamage`, `blockDamage` and `bonusPerBurn`.
  Each type has an archetype: Fire burn + burst + HP-for-damage, Grass
  healing + growing strength, Water block + draw + hitting back. Weaken
  is the strongest defensive effect in the game (it halves the 30+ hits
  of the late biomes), so it's rationed per type. Water starts with none
  (Fire's deck has two, Grass's one), which made it the weakest type at
  every Trainer Level, dying early to long biome-1 fights (Alpha Gloom,
  Snorlax). Withdraw's 10 block (vs Flame Wall's 9) makes up for it; a
  repeatable Weaken on Bubble overshot to ~90% at Level 5. Water's other
  Weakens are Whirlpool (uncommon, 1 cost) and the evolution cards Bubble
  Beam and Scald. Before Whirlpool cost 1, Bubble Beam (offered in half of
  runs) decided Water runs: ~95% wins after biome 1 with it, ~55% without.
  Card-pool review (bot harness, 2026-09-24): as one extra copy in the
  starting deck, block, Weaken, healing and powers raise win rates and big
  attacks lower them (Flare Blitz, Fire Blast, Solar Beam: −15 to −30
  points), since a turn spent without defending costs more HP than it saves.
  So check defensive numbers first: +1 or +2 block on a starting card moves
  a type 10–30 points at Level 5. Don't remove a card id:
  a saved run holding it would be discarded.
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
A version mismatch or any bad id (deck, relics, Mart stock) silently
discards it: bump `RUN_SAVE_VERSION` when the shape changes. The start
screen's Continue button (`renderContinue()` in `js/main.js`) shows
whenever a valid save exists, and Begin run confirms before replacing it.

## Deck thinning

The Pokémon Center (`restSite()` in `js/run.js`) offers Rest *or* "Forget a
move" (`forgetOption()` / `forgetMove()`): a `showChoice` picker of the deck
grouped with `groupDeck` (×N badges), "Back" returns to the Center. It never
takes the deck below `MIN_DECK` (7); at the minimum the tile is shown
`disabled` (`showChoice` options accept `disabled`). Forgetting doesn't
count as a rest for `restCount`. The Cleanse Tag relic reuses the picker
right after it's picked up (`forgetMove(back, done)`: `done` continues the
reward chain instead of returning to the map). The Poké Mart sells removal too
(see below); events are planned as another source.

## Poké Mart and Pokédollars

Pokédollars (₽, 💴) are per-run prize money, separate from the meta
PokéCoins: `run.money`, saved in the run save and lost when the run ends.
All the numbers live in `js/data/mart.js` (`PRIZE_MONEY` ranges per fight
kind, card/relic prices by rarity with a ±`MART_JITTER` wobble, removal
`base` + `step` per removal already bought this run, `run.removals`). Prize
money is rolled in `afterFight()` and paid in `collect()` with the coins, so
a refresh can't pay it twice; the Amulet Coin relic doubles it. `setMoney()`
in `js/ui.js` fills the top-bar `#money-pill`, which `showScreen()` shows
only on `RUN_SCREENS`.

`shop` is a map room type (blue 🏪 town square, never twice in a row on a
path). Marts aren't rolled (`ROOM_ODDS.shop` is 0): after the other rooms are
rolled, `placeMarts()` in `js/map.js` turns fights/events on `MART_FLOORS`
(the floors after the treasure, ~5 fights of ₽ in) into Marts, greedily picking
the room that the most start-to-boss routes pass, until `MART_ROUTE_SHARE`
(75%) of routes pass one. That gives ~2.1 Marts a map on ~85% of routes
(before: one random Mart, often floor 4, on ~34% of routes, and on 60% of maps
some start couldn't reach any); the Level 0 bot moved within noise (~94.6%).
Measure with a route-share count over a few thousand `generateMap()` calls. Its stock (`node.stock`:
cards, items and relics, each `{ id, price, sold }`) is rolled in `startBiome()`
and saved with the map, so a refresh can't reroll the shelves.
`martRoom()` in `js/run.js` reuses the reward screen (`showChoice`) and
re-renders itself after each purchase; `ware()` wraps a card/item/relic tile with
its price tag (red and disabled when you can't afford it), a `group` and a
two-tap "Buy ₽N" confirm. `layout: 'mart-window'` turns the options into one
window laid out like Slay the Spire's shop (the user's reference): moves on
top, then items (3) and relics (2) as bare icons in a staggered 3-2, and the
forget service as a Mart-blue tile beside them, on a cool grey checker floor
so the parchment cards stand out. (Not `.mart`: that's the top bar's Mart icon.) Removal reuses
`forgetMove(martRoom, pay)`, so backing out of the picker costs nothing; it can be
bought once per Mart (`stock.removed`, then the tile greys out). Every forget picker
(Center, Mart, Cleanse Tag, events) takes two taps, like adding a card: `ask`/`confirm` "Forget it".
Purchases are only saved when you leave for the map. Items are covered
under Items below.

## ? events

`event` map rooms (❓, purple frame) hold one of the scenes in
`js/data/events.js` (numbers, often per biome as `[b1, b2, b3]`); what each
choice does is in `EVENT_CHOICES` in `js/run.js`, shown with `showChoice`.
`rollEvents()` (from `startBiome()`) stores `node.event` = `{ id }` plus any
dice (Item Ball's `trap`, Team Rocket's `enemyId`, Day Care's shuffled
`offers` per rarity, Wishing Well's `luck` + `relics`, Shrine's `relics`),
drawn from a shuffled bag so a biome has no repeats until all have come up;
a refresh can't reroll them. Card/relic ids on an event are checked by
`eventIdsKnown()` on restore. Lists (not single ids) are stored so a card
or relic gained since the biome started is skipped for the next one:
Day Care trades a common/uncommon (never an evolution card) for the first
card of the next rarity you hold under `MAX_COPIES`; Shrine gives the first
unowned relic of your type's `only` relics, then normal ones. The Wishing
Well's one `luck` roll serves both tosses (the big toss wins whenever the
small one would); a win offers its unowned `relics` via `showRelics()`.
Fan Club never costs anything (₽ above half HP, else a Super Potion, or ₽ with a
full Bag). Relics from events go through `gainRelic()` so Cleanse Tag works.
At first the four new events cost Level 5 ~3 points (66%): Shrine HP is barely
healed back when Centers heal 10%, and they replace the healing events some of
the time. Cheaper Shrine (6/9/12 HP) and Well (₽30-50 / ₽70-110) and a Super
Potion from the Fan Club fixed it. Bot now: L0 94.8, L3 86.4, L5 68.1 (Water
trails at L5, ~56%, with or without the new events). Paid choices use `moneyOption`/`hpOption` (greyed out when
unaffordable, and HP costs never faint you), and money/HP is only taken once
the reward is actually received, so "Back" is free. Team Rocket's Battle
runs `fight()` with a copy of the node typed `elite`, so it pays elite
rewards; it has no Leave. A new event needs an entry in both places, an
icon in `ICONS` for any new emoji, and a `RUN_SAVE_VERSION` bump only if the
node shape changes.

## Items

One-use items (Slay the Spire's potions) in `js/data/items.js`: `effects`
keys (heal, block, strength, focus, energy, draw, guard, burn, flee), a
`rarity` (drop/stock weight in `ITEM_WEIGHTS`, Mart price in
`MART_ITEM_PRICES`), `only` for a type's Gem, and `map: true` for heals
usable outside battle. The run holds at most `ITEM_SLOTS` (3) ids in
`run.items`, saved by id with `run.itemChance` (a bad id discards the save).
Sources: 3 per Mart (`node.stock.items`, rolled in `startBiome()`, greyed
out with a full Bag), and after every won fight except the final boss a
StS-style drop (`ITEM_DROP`: 40%, −10% after a drop, +10% after a miss),
shown as a last reward step by `offerItem()` (with a full Bag it offers to
swap one of yours). Nothing heals through Big Root or boosts block through
Damp Rock: those are for cards.

In battle, `battle.items` *is* `run.items`, so using one removes it from the
run too (a refresh replays the fight from the checkpoint, items included).
There are no item slots on the battle screen (the user's call: the Bag is
more Pokémon-like); items are used from the Bag's Items pocket, whose Use
calls `pickItem()` → `tapItem()`, and `renderFocus()` shows a big
`.focus-item` tile to confirm. PP and End Turn share one size
(`.battle-controls .pp-pill`): big on PCs and sideways phones, small in the phone rules (≤720px); upright tablets (721–1100px portrait) put them in a row above the hand like phones, so five cards fit. `useItem()` costs
no PP and works only on your turn (`whyNotUsable()`). The Poké Doll ends a
non-boss fight with `onEnd({ fled: true })`: no rewards, back to the map.
The Bag's Items pocket (`renderItemList()` in `js/run.js`) lists them with
Use / Toss: in battle Use goes through `pickItem()` (same confirm), on the
map only heals work (and only when hurt) and Toss is allowed; on reward
screens both are disabled, since the next checkpoint would split a reward
chain. The bot harness mirrors all of this (`applyItem`, `useItems`,
`ITEM_VALUE`; `cfg.noItems` turns items off for A/B runs).
Items raised the Level 0 bot win rate from ~94% to ~96% however scarce they
were (it sees the enemy's next move, so one timely item saves most of its
deaths), so biomes 2–3 hit harder instead (`dmgBonus` 16→18 and 30→33 in
`BIOMES`). That brought Level 0 back to ~94%, with Level 3 at ~85% and
Level 5 at ~69%. Retune enemy damage rather than starving items.
The harness also has a human-like bot (`humanCfg()`: no intent numbers, 10%
random card plays, one-step routing; see its README), since the target is a
decent human winning about half their Level 0 runs. It won 87.5% at Level 0,
so every biome's `dmgBonus`/`bossBonus` went up +2/+3/+4 and Level 5's
`enemyDmg` down 2→1 to keep it beatable: human bot L0 ~75%, L3 ~62%, L5 ~43%
(strong bot L0 ~86%, L5 ~55%). Water is the weakest type at every level.

## Relics

`js/data/relics.js`; effects are applied where `hasRelic()` appears in
`js/battle.js` (Cleanse Tag, Choice Band and Amulet Coin act in `js/run.js`). Flags:
`only` = one type's starters, `rare` = never from the Starting Relic Charm,
`boss` = only offered after a boss. `relicChoices(run, { boss })` in
`js/rewards.js` offers only boss relics after a boss (normal ones once you
own them all), and never offers boss relics anywhere else. The three boss
relics each give +1 PP with a catch (Choice Band: no Rest; Choice Specs:
draw 1 fewer; Toxic Orb: lose 1 HP a turn, never below 1). Each type has two
relics that push its archetype. Healing from Big Root only boosts card and
power heals, not other relics.

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
has the **status badges** on the left and the HP numbers on the right. The
badges read like PSN/PAR in the games: no box,
just icon then number, coloured blue/green/red for block/buff/debuff (block, burn, weakened, strength, focus,
guard, next-turn energy, your own strength, and one per active power), built by `badgeFor()` in `js/battle.js`. They fill
in from the left and wrap onto a second line when they reach the HP numbers. A badge
only renders while its status is active, and each one explains itself in
its `title` tooltip. A nameplate gets `.has-block` (blue HP-bar rim) while
that fighter has block. Below the arena, `.battle-controls` is a 3-column
grid: energy (`.energy-orb`, drawn as the games' **PP** like the
Diamond/Pearl move screen: a white `.pp-pill` with "PP" on the left and "2/3"
on the right, on a salmon striped panel; the max is `b.turnEnergy`, the
energy the turn started with; `data-shown` remembers the last value so the
number bumps when it changes, and `.empty` turns the numbers red) | hand | End Turn
(`#end-turn-btn`, not a `.btn`: the same salmon panel and white pill, so the
two match; greyed out while disabled). The
draw/discard piles (`.piles` / `.pile`: a floating pixel card stack and the
count, like the coins) live in the top bar beside the Poké Ball, shown only
while `body[data-screen="battle-screen"]`. Relics don't show in battle (they
are in the Bag). Above them, `#battle-log` is a Gold/Silver
text box: `log()` types each line out (instantly under reduced motion) into
`#battle-log-text`, while `#battle-log-live` gets the whole line at once for
screen readers; `.done` shows the blinking ▼. On phones the PP box
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
element's `title` in `.tap-tip`, a mini copy of the battle text box that stays until the next tap or click
anywhere. A mouse also gets it on hover (after 350 ms, gone on leaving),
in place of the native tooltip: while hovered the `title` moves to
`data-tip` and comes back on leaving. Taps and clicks on buttons and other controls are skipped, since tapping
them already does something (hover still shows their hint). Give new non-button things a `title` and they get
this for free.
Every `showChoice` screen (rewards, Center, events, Mart) puts its `sub` text
in `#reward-log`, a copy of the battle text box pinned to the bottom of the
screen beside the Skip / Leave button (stacked on phones), and draws its
`.relic` tiles (relics, items, choices) as parchment Pokégear windows (`sayLines()` in `js/rewards.js`; `sub` may be a list of lines): lines
type out and wait for a tap, like the games (the user wants no autoplay). After
a fight, `coins` (`run.pendingCoins`: `{ foe, coins, money, disadvantage }`)
shows as an icon row (💰 +25 💴 +₽120) on every step, and the first screen's
box says "The wild X fainted!", the PokéCoins and the ₽ as separate lines.
Options with `ask`/`confirm` (card, relic and item rewards) take two taps: the
first blows a copy of the tile up in the middle of a dimmed screen
(`openFocus()`, reusing battle's `.card-focus`/`.focus-card`) with the
`confirm` ("Add to deck") under it; the big tile or that button takes it, the
dimmed area or Escape backs out. "Add to deck" and Skip are `.ds-btn`s: End
Turn's striped panel and white pill, green (`.ds-go`) or blue (`.ds-skip`),
with a blinking ▶ in the pill. Battle's picked card / item shows a red `.ds-play` Play / Use button (`focusButton()` in `js/battle.js`) instead of "Tap again to play".
Titles are short headers on a pixel-font plate ("Learn a new move", "Item found").
In the read-only deck views (the starting deck and the Bag's deck window,
both filled by `fillDeck()` in `js/deckpreview.js`) a tap on a card blows it
up (`zoomable()` / `zoomCard()` in `js/ui.js`); any tap or Escape closes it,
and inside a dialog Escape closes only the zoom.
The hand is held in a fan (`fanHand()` in `js/battle.js`, rerun on resize): cards
overlap, tilt and sink towards the ends, StS-style, squeezing closer as the hand
grows so the whole hand always fits (it never scrolls). It uses the `rotate`/`translate` properties so
the hover lift and deal animation (`transform`) stay separate; a hovered or picked
card straightens and comes to the front.
Playing a card takes two taps (clicks or Enter presses too), except a card that
can't be played: one tap logs why and shakes the PP box, with no big preview
covering it. `tapCard()` first
picks it (`selectedUid`, `.selected` in the hand) and `renderFocus()` shows a
big copy at the bottom middle in `#card-focus`, a dimmed full-screen layer;
tapping that big card plays it, tapping the dimmed area or Escape cancels
(`cancelPick()`), and tapping another hand card switches. The pick clears
itself whenever the battle is busy or the card leaves the hand.
Your Pokémon grows as it evolves: its sprites (map card, map
trainer, evolve pop-up) carry `data-stage`, and CSS scales stage 0 to 78% and
stage 1 to 90% with the `scale` property (from the feet), so the attack and
evolve animations' transforms and the layout are untouched.
In battle, both sprites are sized from their GIF files instead (`sizeSprite()` in
`js/battle.js` sets `--size`): the Showdown sprites share one pixel scale, so
Pidgey (48px) is drawn small and Snorlax big rather than all filling one box. The
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
Enemy sprites are frameless; elites and bosses are marked by a red/gold glow.
Every screen is set in a pixel-art scene per biome *and* fight kind
(`js/scene.js`, the user's call: the blurred photos clashed with the 8-bit
look; there are no photo backdrops left): a normal fight, an elite's tenser
light and a boss's dramatic arena.
Clearing: sunny day / sunset with fireflies / moonlit night. Shrine: misty
morning under pines with a torii, stone lanterns, light shafts and falling
leaves / dusk with lit lanterns and autumn leaves / night with blue spirit
wisps. Wastes: hazy volcano with glowing lava cracks, embers and ash / red
sky / an eruption with lava rivers, flying lava and lightning. All of it is
data in `BIOME_ART` (shared per biome, `kinds` override per fight; `life`
lists the animated parts), painted into `#scene-bg` (a fixed low-res canvas,
one canvas pixel = 4 CSS px on phones, 5 on PCs) by
`showScene(biomeId, kind)`: from `startBattle()`, and from `showMap()` with the
biome's normal scene (reward, Center, Mart and event screens keep whatever is
up, so an elite's rewards stay at sunset). The menus call
`showMenuScene(type)`: each starter type has its own scene, seen nowhere else
(`TYPE_ART`, same shape as a biome without kinds, pads or storms): Fire a red-rock
canyon at sunset with a sparking campfire, Water a seaside with surf, a
lighthouse and a passing sail, Grass a jungle with giant trunks, swaying vines
and light shafts. With none picked it's the Clearing's moonlit night, like
the title. Asking for the scene already up leaves it
running (except in battle). Outside battles `#backdrop` (above the canvas)
dims it so windows stay readable; `setTheme(type)` in `js/ui.js` only sets
the accent colour now. Still parts are painted
once into `base`; `draw()` copies it every frame (8 fps, paused while the tab
or title screen hides it) and adds the living
ones. `sky` masks where clouds, smoke and birds may draw, so they pass behind
hills, trees and the volcano. `horizonRow()` puts the horizon at ~38% of the
screen but always above the enemy's pad, so the layout can move. Both
Pokémon stand on Gen 3/4-style pads (`--pad`, a data-URL pixel image: grass,
mossy flagstone or cracked lava rock, from the scene's `pad`), drawn by
`.enemy-zone::after` / `.player-zone::before` so they don't lunge with the
sprites.
Battle moments: a hit that takes at least a quarter of the target's HP
(clamped to 12–25) runs `bigHit()` in `js/battle.js`, which jolts `.arena`
(the `translate` property, so sprite transforms are untouched) and flashes the
screen white (`#battle-screen.big-hit`), skipped under reduced motion. When a
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

## Map screen

The top `.run-card`, centred like everything below it, shows your Pokémon
floating on the scenery, then its name and a Gold/Silver-style HP bar
(`.gb-hp`: black "HP:" tag, outlined bar, the numbers underneath;
`data-level` turns it yellow at 50% and red at 20%, the games' thresholds).

Below it, `.map-head` holds the biome name alone as a pixel location sign
(`.biome-sign`, wood / mossy stone / dark rock per `data-biome`) that drops
in, like the games' location signs, only when you arrive in a new biome
(`showMap()`).

The **Bag** (`#bag-btn`, a frameless pixel backpack drawn as an inline SVG in
`index.html`) lives in the top bar's right corner, after the coins and the
Poké Mart. `showScreen()` in `js/ui.js` shows it only on `RUN_SCREENS`
(map, battle, rewards) and closes it on every screen change. It's a `.drop`
drop-down hanging from the right edge of `.topbar-actions`, with four
pockets, like the
Gold/Silver Bag: Deck (count + a button that opens the deck dialog), Relics,
Items (see Items below) and the map Key. Pocket tabs pick one, the ◀ ▶ header (and ← →) flips
through `POCKETS` in order, and the last pocket is remembered. It's wired by
`initBag()` / `showPocket()` / `closeBag()` in `js/run.js` and closes on an
outside tap, Escape, or whenever `showMap()` runs. Its rows reuse the How to
play `.howto-li` / `.howto-node` styles (map rooms use `.howto-node.town`),
so keep the Key's wording in step with the How to play map slide.

The map itself is drawn like the Pokégear Town Map from Gold/Silver
(rendering only: the data from `generateMap()` and the saved-run shape are
unchanged, and each node's `jx`/`jy` wobble is no longer drawn). In
`renderMap()` in `js/map.js`:
- Everything snaps to a tile grid (`TILE`, `GRID_W`/`GRID_H`, `colX()`,
  `rowY()`; the boss sits on top at `BOSS_ROW`, low enough to leave room
  above it for its silhouette; below floor 0 the routes join at
  `JOIN_ROW` and one road runs down the middle to `START_ROW`, where you start). `#map` gets
  `--grid-w`/`--grid-h` and keeps that aspect ratio; CSS sizes rooms in
  tiles, so everything scales with the map's width. The map is always
  upright (the user tried it sideways on wide screens and didn't want it).
  Phones use `NARROW_W` tiles across, fitted to 78vh. Wider screens (>720px)
  draw it at `WIDE_TILE` (11) px a tile and `fitGrid()` gives it more tiles
  across (up to `WIDEST_W`) instead of stretching it: more terrain, rooms
  spread further apart, the page scrolls, and `showMap()` scrolls your
  sprite into view. A resize that changes the tile count redraws the map. Paths can wander to one
  side, so `spreadColumns()` resets `colX()` per map to spread the columns
  it uses across the width (centred on `CENTER_X`, at most `MAX_STEP` tiles
  apart); draw rooms with `nodeX(node)`, which keeps the boss centred.
- Terrain is painted pixel by pixel into a small `<canvas>`
  (`.map-terrain`, `image-rendering: pixelated`). `PALETTES` picks each
  biome's ground and blobs (water, mountain, trees, lava), grown only in
  the gaps between routes (`routeTiles()`) by a PRNG seeded from the node
  ids + biome, so a refresh draws the same terrain. Water and lava drift on
  a timer while the map screen shows (off under `prefers-reduced-motion`).
- Routes are smooth SVG polylines over the canvas (`.map-routes`,
  `routeLines()` / `drawRoutes()`), deliberately not pixel art: the user
  found pixel-staircase diagonals too ugly. Every link is its own straight
  line from room centre to room centre (straight up, or diagonal to the
  next column), so routes only meet inside rooms; links to the boss and
  the start road still jog on a shared row, since those all merge anyway.
  Links used to jog on a shared row halfway up, which joined routes from
  different rooms and showed ways that didn't exist on almost every map.
  Routes are cream; walked ones get thick red dashes and the routes you can
  take next are white.
- Rooms are `.map-node` buttons (a tile bigger than the `.map-town` square
  drawn inside, for tap size): orange, red for elites, a gold boss. Poké
  Marts and Pokémon Centers have no square: they stand on the map as little
  Gen 3-style buildings (`.map-building`, 4 tiles wide, SVG from
  `buildingSvg()` in `js/buildings.js`, drawn by rules on a 24x20 grid: blue
  or red gridded roof, emblem over the door, "MART"/"P.C" sign). Visited
  greys out, reachable blinks (buildings glow white). `.node-badge` scouts elite/boss types: the
  bare type icon (no box, the user found the chip cluttered) on the room's
  top-right corner, with a dark pixel outline. Your starter's
  sprite (`.map-trainer`) stands on the current room like the Pokégear's
  trainer head, and the biome's boss (`map.boss.enemyId`) stands above its
  room as a grey silhouette (`.map-boss-shadow`). Stacking: silhouette 0,
  rooms 1, your sprite 2.

The shop's top-bar button (`.shop-btn`) has no chrome: it's a CSS Poké Mart
(`.mart`, sized in em so one `font-size` scales it; also used small on the
How to play shop slide), and
`aria-expanded` on it drives the pressed-in "shop is open" look. Keep that
attribute in sync if you add another way to open or close the shop:
`toggleShop()` sets it to true, and the dialog's `close` listener in
`js/main.js` sets it back to false.

## Windows

Every `.dialog`, every `.panel` (start screen, deck preview), the Bag, the
Continue card and the Poké Ball menu are light Pokégear windows (a `.panel`
inside a `.dialog` is a flat inset box instead):
muted parchment inside a chunky grey frame, softly rounded corners (`--round` 12px windows,
`--round-sm` 8px buttons/tiles, `--round-xs` 4px tiny bits, all in `:root`;
pieces without their own radius get it from the "soft corners" block at the
end of `css/screens.css`). The colours are
the `--win-*` tokens in `:root` (`css/base.css`); tune the tone there. Inside
a `.dialog` the usual tokens (`--ink`, `--muted`, `--panel`, `--gold`...) are
re-pointed to dark-on-parchment values, so most content re-themes itself.
Anything with a hard-coded light colour (white text, `#dfe3ff`) needs a
`.dialog ...` override in `css/base.css`. Game cards (`css/cards.css`) are styled after the Game Boy
Color Pokémon Trading Card Game: square type-coloured frame, pixel checker
body, a round PP cost set inside the frame (a mini PP box: white disc, salmon ring), pixel-font name/type, a framed art window and a
cream text window. The description stays in the normal font on purpose:
pixel letters would be too small to read at card size.
Window text (and the HP bar, biome sign, PP box...) uses Press Start 2P, the
8x8 Game Boy-style font, as `var(--pixel-font)`. It's declared by hand as
"PokeDB Pixel" at the top of `css/base.css` with `size-adjust: 66%` (its
letters are far bigger than other fonts' at the same size; `font-size-adjust`
measured it inconsistently, so don't go back to that). `.card` resets to the
normal font so cards read the same as in battle. Every `.btn` is a Gen 1-3
menu option to match: cream box, pixel frame, and a blinking ▶ cursor on
hover/focus (left padding reserves its space; `.primary` = orange frame,
`.danger` = red). The How to play button is one too, with a gold frame, an
always-blinking ▶ and a stepped pixel glint sweeping across it.

## Title screen

Every page load opens on a Gold/Silver-style title screen (`#title-screen`,
`showTitle()` in `js/title.js`, called at the end of `init()` in
`js/main.js`) before the start screen. It's a fixed overlay above the top
bar: a pixel night sky painted into a low-res `<canvas>` (dithered sky
bands, moon, hills, the grassy ledge; stars twinkle at 10 fps and the odd
shooting star crosses), Moltres flying past the moon as a silhouette, the
three starters hopping on the ledge, and a blinking PRESS START (TAP TO
START on touch). Any tap or key flashes white, fades out, then replays the
start screen's logo bounce and opens the first-time How to play. That
first tap also unlocks audio, so the title music starts with the menu.
`--ground` (set from JS) keeps the CSS sprites on the painted ledge.

## Top bar and start screen

There's no bar: the top-left Poké Ball (`#brand-btn`) opens a drop-down
(`#ball-menu-panel`, wired in `initBallMenu()` in `js/main.js`) holding Main
menu, Stats, Achievements, Sound, How to play and About (Stats and
Achievements are windows built fresh from the save by `js/records.js`). The
top right shows the coins (floating, no box), then the Shop outside a run, or
the ₽ (`#money-pill`) and the Bag during one: on `RUN_SCREENS` `showScreen()`
hides `#shop-btn` and shows a Shop item (`#menu-shop-btn`) in the Poké Ball
menu instead. In battle on phones ≤420px the PokéCoins
hide so the piles, ₽ and buttons fit on one row.
In battle, the draw and discard piles sit beside the Poké Ball.
The "Main menu" item hides itself on the start screen (`showScreen()`).

Tapping an unlocked starter picks it and shows `#starter-sheet`, a window
pinned to the bottom of the screen like the deck screen's Begin run bar
(`showSheet()` in `js/main.js`): a narrow (340px) window with the sprite,
name, type chip, blurb and "See deck →" stacked and centred. It isn't modal, so you can keep scrolling and tapping
other starters (the panel just switches); `body.sheet-open` pads the page
by its height (`--sheet-h`) so it never covers the last row. ✕ hides it and
keeps the pick; tapping the picked tile again brings it back.
Starter tiles are all one size: a locked one shows a 💰 (Shop) or 🏆
(achievement) corner badge instead of a text line, and an unlocked one shows
nothing extra. The sprite GIFs pad their Pokémon very unevenly, so
`fitSprite()` in `js/main.js` measures each one's visible pixels once and
scales small ones up with a `transform` (layout untouched). The Shop marks
owned skins and maxed perks with a small Poké Ball (`ownedTag()` in `js/shop.js`).


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
slide is filled from `COIN_REWARDS` and `PASSIVE_SHOP_ITEMS`, so the guide
stays in step with the game data. The first two slides are numbered rows
(`.howto-flow`, a picture slot then a name and one line); the turn slide
draws a small fanned hand (`.howto-hand`) rather than a real card, whose
text was too small to read at that size.

## Pixel icons

The game never shows emoji: `js/icons.js` swaps every emoji on the page for
an 8-bit pixel icon. Data files and code keep writing emoji (card `art`,
relic `icon`, toasts...); `initPixelIcons()` (called first in `js/main.js`)
swaps existing text and uses a `MutationObserver` to swap anything added
later. Each icon is a 12x12 pixel map in `ICONS` using the letters in
`PALETTE`; the black outline is added automatically, so only draw the fill.
**When you add an emoji anywhere, draw its icon in `ICONS` too**, or it shows
as a plain emoji. Tooltips (`title`) can't hold SVG and keep the emoji. Don't
read an emoji back out of the page with `textContent`: it's been replaced.

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
the map. `heal` is for rest sites only (the user's call): don't reuse it
for potions or other heals. Sound effects are decoded buffers played with `playSound()`; to
add one, list it in `SOUNDS` (`{ url, gain }`, gain boosts a quiet file) and drop the MP3 in `assets/audio/sfx/`.
The rest of `SOUNDS` and where each plays: `card` (`playCard()`), `hit`
(damage gets through, either side; a fully blocked hit plays `block`
instead), `block` (a card gains block), `faint` (enemy KO, in `finish()`),
`item` (`useItem()` in battle), `potion` (a healing item, in battle or
`useItemOnMap()`; falls back to `item` while its file is missing), `buy` (a Mart ware or
removal is paid for) and `event` (walking into a ❓ room, in `enterNode()`,
so "Back" re-renders don't replay it). Battle sounds preload in
`startBattle()`, map ones in `showMap()`. A missing file is silent (one
404 in the console per sound per page load). `playSound()` drops a repeat
of the same sound within `SFX_MIN_GAP` (70 ms) and cuts a still-ringing
earlier copy with a 30 ms fade, so multi-hits don't pile up; different
sounds still overlap (a block card plays `card` + `block` together).
Muted or still-locked audio plays nothing. Tracks crossfade and
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
   rates), use the headless-bot harness in `../pokeDB-sim/` (a sibling
   folder, never committed to this repo; its README says how to run it).
   Reuse it rather than rebuilding it. This machine has no Node or Python,
   so it runs in the browser pane: its `serve-sim.ps1` serves this repo
   plus its `/sim/` folder, and the harness `import()`s the real `js/data/`
   files. Compare before/after under the same bot (in-memory tweaks in
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
