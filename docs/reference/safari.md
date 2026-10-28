# The Safari Zone

The daily seeded run (roadmap: "Post-v1.0: the Safari Zone daily run"). Phase 1 built the seed and the run; phase 2
(2026-10-02) added catching, the Game Corner's Poké Balls, rare spawns, Bait and Rock, and the fair first try.

## The seed (phase 1)

- `js/rng.js`: every gameplay roll goes through `random()` / `randIndex()` / `pickOne()` / `shuffled()`. Unseeded it's
  `Math.random`; a Safari run sets a stream per biome (`biome:N`, from `startBiome()`) and per room (`room:N:id`, from
  `enterNode()`), so a room plays the same whatever came before it. Cosmetic rolls stay on `Math.random`.
- `js/data/safari.js`: `safariDaily(day)` = the UTC date's seed, 3 of the 6 areas (`SAFARI_AREAS`, each with `normals` and
  `rares`) and a starter (any but Mewtwo). `beginSafari()` in `js/run.js` starts it at Level 0's rules with
  `run.safari = { day, seed, areas, first }`; `save.safari = { day, tries }` counts tries at the start, so quitting
  can't retry the first. A Safari run adds nothing to the main Pokédex, Record Book, Trainer Levels, the Sealed Gate or
  the per-starter stats; it pays PokéCoins.

## Catching (phase 2)

- **The Throw button on phones** (≤720px): PP | Throw | End Turn, Throw centred on the screen (`.battle-controls:has(.throw-btn:not([hidden]))`
  makes it a grid of three equal columns, each capsule stretched to fill its own, and `.turn-side` `display: contents`; the user's calls
  2026-10-02 and 2026-10-03, when End Turn was squeezed and its label sat low). Normal fights keep PP left, End Turn right.
- **When**: a Safari run's wild rooms only (`battle.catchable`: `run.safari` and kind `fight`; Alphas and bosses can't be
  caught, and Throw doesn't show there: 2026-10-20 it showed greyed, `battle.uncatchable`, a tap saying why, as the user was
  caught off guard by it missing; 2026-10-28 the user asked for it gone), every turn, at any HP (like the games; until 2026-10-02 only once the HP was red, below 25%). The **Throw**
  button (`#throw-btn`, green, beside End Turn; on phones on the PP row) shows all fight.
- **Cost**: a throw costs `THROW_PP` (1 PP) and ends your turn (`whyNotThrow()`: `energy >= THROW_PP`); cards and items
  can be played first, so wear it down, then throw with the PP you kept. A miss runs `endTurn()`, so the enemy acts.
  (Until 2026-10-02 it needed your PP untouched and took all of it.)
- **Picker**: a tap opens `#ball-picker` over the button, one row per ball you can throw now (`ballsInBag()`), with how
  many are left and its odds; a tap throws. A tap elsewhere closes it.
- **Odds** (`catchChance()` in `js/data/balls.js`, pure, pinned by `tests/catch.test.mjs`): a curve on the HP left
  (`CATCH_BASE`: 8% at full HP + 67% x (HP lost)^1.5, so ~32% at half (yellow), ~56% at a fifth (red), 75% near 0: a
  throw at full HP is a long shot; it was cubic, 13% at half and 38% at red, until 2026-10-04, when the user found
  yellow/red catches far harsher than the games); a multiplier m turns the miss chance q into q^m (the games' shape), m = ball x (1 + 0.25 per
  kind of debuff on it: Burn, Leech Seed, Weak, Sap) x (1 + 0.5 per Bait) x 0.5 for a rare spawn; capped at 95%
  (`CATCH_CAP`); the Master Ball is 100%. The roll is `random()`, on the room's seeded stream.
- **The throw on screen** (`ballAnimation()`): the ball's sprite arcs to the Pokémon (Web Animations), it's pulled in
  (`.enemy-portrait.captured`), the ball drops and shakes 0-3 times (`catch-shake`; near misses shake more, like the
  games), then latches shut with the catch jingle (`catch-success`) or bursts open. Both play the user's files in
  `assets/audio/sfx/` once they're there, synths until then (`docs/reference/music.md`).
- **A catch** (`caughtIt()`): `onEnd({ won: true, caught: true, ball })`. `afterFight()` pays `CATCH_PRIZE` (half) of the
  knockout's ₽, the same PokéCoins (+`LUXURY_COINS` with a Luxury Ball), the usual item odds, and instead of the card
  reward `offerSignature()`: the Pokémon's signature card, take or skip (skipped silently if you already hold it). The
  reward box says "Gotcha! X was caught!".
- **The record**: `save.safariDex = { seen, caught, done, complete }` (`markSafari()` in `js/storage.js`): `seen` when a Safari wild fight
  starts, `caught` on a catch, any try. Phase 3's Safari Pokédex will show them. A catch also counts `run.tally.caught`
  (a line in the result window).

## Signature cards, Bait and Rock

- In `js/data/cards.js`: `SIGNATURE_CARDS` (one per Safari Pokémon, `sig-<enemy id>`, built from its own best-known move
  with existing mechanics, `safari: true`, `maxCopies: 1`, `from`) and `SAFARI_ONLY_CARDS` (Bait, Rock). They're in
  `CARDS_BY_ID` (upgrades too) but never in `ALL_CARDS`, so never in the Card index or `poolForType()`. `SIGNATURE_FOR`
  maps an enemy id to its card. A new Safari Pokémon needs one (the test checks every `SAFARI_ROSTER` id). The twin rule
  holds them (the signature pass, 2026-10-27, `docs/card-twins.md`'s last section): 424 of the 514 got new lines so none
  reads like a card a run meets or like another signature card.
- **Bait** (0 PP, `bait: 1`): `enemy.bait`, a 🍓 badge; +50% catch multiplier each, its attacks +`BAIT.damage` (3) each
  (`attackDamage()`).
- **Rock** (0 PP, 4 damage, Vulnerable 1, `rock: 1`): `enemy.rock`, a 🪨 badge. `runsOff()` at the start of the enemy's
  turn: a Rock'd wild runs off with `ROCK_FLEE` (15%) per Rock; a rare spawn just leaves a turn sooner per Rock.
- Both join a Safari run's card rewards and Mart (`cardChoices()` in `js/rewards.js` adds them when `run.safari`).

## Rare spawns

- `markRares()` in `js/data/safari.js`, from `startBiome()` after the wilds are dealt, on the biome's seed: each wild room
  has `RARE.odds` (12%) to hold one of its area's `rares` instead (Chansey, Kecleon and the `rare` lines of `safari-mons.js`
  are Safari-only, the rest are the main game's elite species as plain wilds), with `node.rare` saved on the map.
- The run card on the map shows the run's catches so far (`#run-caught`, `showCaught()` in `js/run.js`, a Safari Ball and
  `run.tally.caught`, beside the Ability; it bumps when it went up; the user's ask, 2026-10-20). Hidden outside the Safari.
- The map shows rustling grass on its room's top-right corner (`rareMark()` in `js/ui.js`, a pixel tuft that shakes in a
  gold-rimmed badge, `.map-grass`, placed like a material's badge; the user's ask, 2026-10-20: the gold ✦ centred above the
  room, there since 2026-10-02, read as a shiny and hung between rooms). The prep window's rare-spawn rule and the Duo
  Run's areas show the same badge (`.rare-mark.inline`); in battle the name gets it too, the nameplate a grass-green
  rim (`#enemy-plate.rare`; a shiny keeps ✨ and gold) and a 💨 badge counts the turns left. It runs off at the start of its turn once `turn >=
  RARE.turns - rock` (4 of your turns): `runAway()` -> `onEnd({ escaped: true })`, and the map says "ran away. Nothing
  won." Its catch odds are halved (`RARE.mult`).

## Wild shinies and Sparkle (2026-10-18, the roadmap's "Safari shinies" session 1)

- **The roll** (`js/data/shinies.js`): `markShinies()` from `startBiome()`, after `markRares()`, marks a wild room
  (`node.type === 'fight'`, a rare spawn too) `node.shiny` at `SHINY_ODDS` (1 in 150) on `Math.random`, never the
  seed: the fight is the same (HP, moves, catch odds), so the daily run and leaderboard stay the same for everyone.
  Saved on the map with the checkpoint, so a refresh can't reroll it. `fight()` hands it on as `encounter.shiny`;
  `battle.shiny` only for a Safari wild.
- **The battle** (`js/battle.js`): `setupEnemy()` swaps in `<id>-shiny-front.gif` (`shinyImage()`; all 514, PokeAPI's
  black-white animated `shiny/`, byte for byte the normal ones' source; `spriteFit()` lends the normal entry, but
  Chansey's normal GIF isn't PokeAPI's, so it has its own `chansey-shiny-front` line), a ✨ and gold rim on the plate
  (`#enemy-plate.shiny`) with a SHINY tag (`#enemy-shiny`), and five twinkles on it all fight (`.shiny-aura`, only under
  `battleFx()`). `playIntro()` bursts the starters' ✨ (`shinySparkle()`) as it appears, plays `shiny` (a synth chime in
  `js/audio.js`) and slides the gold `shinyBanner()` across the arena (still, without battle effects). The log says "A
  shiny X appeared!". The thrown ball glows gold and each shake throws gold sparks (`goldTrail()`).
- **A catch**: `onEnd` carries `shiny`. `afterFight()` reads `shinyGain()` (not saved yet) for the GOTCHA box: "Gotcha!
  Shiny X was caught!" and `shinyLine()` (NEW SHINY at ★1, or ★2 → ★3, or already ★5), the box gold
  (`.reward-log.shiny-catch`, from `pendingCoins.shiny`), its signature card offered at the new Sparkle
  (`offerSignature(id, next, level)` -> `makeCard(..., { sparkle })`). `gainShiny()` saves it in `collect()`, with the
  coins, so a refresh on the reward screen (which replays the fight) can't raise it twice. Knocked out, it's gone.
- **The save**: `save.safariShinies` = { id: Sparkle 1-5 }; a duplicate +1, never past `SPARKLE_MAX` (5).
  `safariSparkle(id)` in `js/storage.js` reads it. Pinned by `tests/shinies.test.mjs`.
- **Sparkle on the signature card** (`makeCard()` in `js/ui.js`, `css/cards.css`): ★1 its art window shows the shiny
  Pokémon (`shinyArt()`, cropped to its pose by `spriteFit()`) and a ★N chip in the rarity gem's place; ★2 a ✨ burst
  when it's played (`playCard()`); ★3 an ice-blue glowing edge; ★4 three sparkles over the art; ★5 a gold edge, gold name
  and a foil sweep. The twinkles and foil stand still under `calmFx()` and reduced motion. Wild Pokémon stay their
  normal colours whatever you own.
- **Playtest**: `?wildshiny` makes every Safari wild shiny, and a catch saves nothing (the box says so); `?sparkle=N`
  shows every signature card at ★N for the page load.
- **The Shiny Exchange** (session 2): the Safari Outfitter's kiosk pulls capsules of caught Pokémon's shinies for coins,
  through the same `addShiny()` (repeats raise Sparkle); `docs/reference/hub-base-mall.md`'s Safari Outfitter part. A
  Pokémon not caught yet comes out sealed, and a Safari catch of it opens it right on the catch (session 2b, sealed
  capsules, there too).
- **Everywhere else** (2026-10-19, session 3): the Safari Pokédex (below), the Secret Base's residents (shiny once
  yours, `resident()` in `js/pc.js`, never a friend's base's; a gold star puffs off them now and then, more often the
  higher the Sparkle, not under `calmFx()`), the Trainer Card (a SHINIES line, and a Safari shiny as partner,
  `mon:<id>:shiny`, a ✨ toggle like a starter's; `js/trainers.js` draws the key, an older copy shows it plain), eight
  Ranger tasks (`docs/reference/hub-base-mall.md`'s board) and a ✨ on the leaderboard (below).

## Poké Balls (the Game Corner's fourth row)

- `BALLS` in `js/data/balls.js`; `save.balls = { great, ultra, dusk, ..., owned, masterWeek }` (a count per pack ball,
  `owned` the Master Ball). The row is for sale once the Pokédex
  is complete (the Safari's own lock).
- Safari Ball: free, `SAFARI_BALLS` (30) a run, the daily try and every replay alike (since 2026-10-07, the user's call; it
  was unlimited): `save.safari.balls`, reset by `beginSafari()`, spent as thrown (`safariBallsLeft()`; an old saved run
  without it starts full); with none left and no packs, the Throw button says "You're out of balls!". Every other ball but the Master Ball comes in packs, used up when thrown (the save is
  written as the ball is thrown, so a refresh that replays the room doesn't give it back): Great (x1.5) and Ultra (x2),
  5 for 40 / 90 coins; Dusk (x3 at `timeOfDay()` night), Quick (x4 in turns 1-3; chosen when a throw needed red HP, so
  turn 1 alone could never be used; kept now a throw can open the fight), Timer (x1 +0.25 a turn, up to x3) and Net (x3 on Water and Bug, by the real types since 2026-10-19; it was Water and Grass), 3 for 150; Luxury (x1,
  +10 PokéCoins on a catch), 3 for 100. Master Ball (1500): a sure catch, one throw a UTC ISO week (`ballWeek()`,
  `masterWeek`).
- Until 2026-10-02 Dusk / Quick / Timer / Net / Luxury were one-time unlocks (300 / 250, thrown freely, in
  `save.balls.owned`); the user found 300 too much. `migrateBalls()` (from `load()` in `js/storage.js`) turns an owned
  one into `UNLOCK_REFUND` (10) throws of it, and `owned` keeps only the Master Ball. Pinned by `tests/catch.test.mjs`.

## The prep window (2026-10-02)

**A Pokédex device since 2026-10-07** (the user's call: the Sky Pillar lobby's treatment; the old `?safariclassic`
window is gone). `#safari-prep-dialog` wears `.tower-lobby`, so the shell, lid, window, bezel, green LCD, keys and A / B
are the tower lobby's (`docs/reference/sky-pillar.md`); only its own parts are in `css/screens.css`'s Safari block. Top to
bottom: the lid's LCD (Safari Zone, the day); a window onto the Zone's gate (`#sp-top`, `js/safari-lobby.js` painting
the window's box smooth at full resolution since 2026-10-07, like the tower's, with `js/smooth-paint.js`; `--ground` its grass line), today's starter at it; the LCD (`#sp-base`): the starter's name, the 3
areas as numbered rows with their caught counts (reversed once caught), the try, the two try rows of pills (struck through
when off), your balls in a swipe row, "How it works" folded, today's top catchers (the tower lobby's list); then the
keys: Pokédex, Ranks (the leaderboard), Buy (the Game Corner), B, and A labelled Start / Replay / Pass 100. **The three
keys are the device's apps** (2026-10-07, the user's call: "as if they're just other apps already part of it"): `APPS` in
`js/safariprep.js` slides `safariDexApp`, `boardApp('safari')` (`js/leaderboard.js`: the board's tabs, day and rows move
in) or `cornerApp` (aimed at the balls row) over the LCD in `#sp-glass` (`.sp-app`), the window folding away
(`.app-open`), the open app's key lit, the lid's LCD naming it; B (or Escape, or its key again) steps back inside the app,
then slides it away and the lobby re-renders (a buy shows in the balls); A is the app's own (the Game Corner's Buy) or
off. The D-pad's arrows go to the app. Everything
below in this section is the older look's history; what it says about Start's confirm, the Game Corner over it and the
re-render on close still holds.

The title's Safari Zone gem opens `#safari-prep-dialog` (`js/safariprep.js`), not the run (the user's ask: "like setting
your loadout"). Styled like the character select's Prepare step (the user's ask after a playtest): a dark panel, gold
pixel heads, pixel pill buttons (`.pxb`), bigger text (rules 0.82rem, 0.78 on phones). It holds today's run (the
starter, the 3 areas with each page's caught count, first try or replay), a gold-rimmed replay box under it (`#sp-replay`:
replay today's Safari as often as you like to keep catching; only the first try counts for the leaderboard, replays get
the perks back; the user wanted it prominent, not in the rules; the day's try shows as a count: "Daily run: 1/1", then "Daily run: 0/1", with both rows of pills always under it (Daily run = Leaderboard + Perks greyed; Replay = Leaderboard greyed + Perks coloured; `.sp-pill`, no sentences, the user's ask), and Start carries the count, Start 1/1 then Replay ∞, the same as on the title's Safari gem (`.gem-tries`): bare pixel text with the gem's outline, no chip (the user's asks 2026-10-03); the pixel font has no ∞, so `infGlyph()` in `js/ui.js` draws a 9x5 pixel one (`.inf-px`, sized by `--ip`); in the run the map's run card shows a 🏆 Counts or blue 🔁 Replay chip in the Level chip's place), 📕 Pokédex (on the day's first area) and 🏆
Leaderboard buttons, the rules in short lines (`RULES`; the rare-spawn line carries the map's own ✦; Bait's and Rock's lines say they're Safari-only card rewards after fights and
carry the card itself as a `.card.small`, `zoomable()`: a tap opens it big with its keyword boxes; each line has a pixel icon that `js/icons.js` has: an emoji
without one would show as a plain emoji), then a sticky foot (`.sp-foot`): your Poké Balls in one row you swipe sideways like the character select's
portraits (since 2026-10-02, the user's ask: big 72px slots, 62 on phones, 80 wider; scroll-snap; a mouse wheel scrolls
it; its edges fade while there's more that way, `.more-l` / `.more-r` from `ballEdges()` in `js/safariprep.js`) (a slot each, sprite and ×count, greyed at 0, the Safari Ball's ∞ big at the sprite's bottom centre; the Master Ball ×1 or ×0 once thrown this week), a purple 🎰 Buy slot at its
end for the Game Corner, and Back / Start. Start keeps the "your saved run will be lost" confirm (`onStart` in
`js/main.js`; No reopens the window). The Game Corner pops up over this window, which stays open
underneath (the user's ask): Buy calls `toggleShop('balls', { modal: true })`, the one place the shop opens with
`showModal()`, since a plain `show()` would sit under this modal window. Modal, its outside tap is `js/ui.js`'s backdrop
close (the shop's own click-elsewhere handler stands aside while any modal is open), Escape and the joystick keys still
work, and its `close` re-renders this window, so bought balls show at once. The Safari Pokédex and the Leaderboard are
modal and simply stack on top too. The area chips are 0.86rem with 0.74rem counts.

## The Day Pass (2026-10-07, the user's design)

The day's first try is free. Replays need a **Day Pass**: `DAY_PASS` (100) PokéCoins, bought once and good until the UTC
day turns (`save.safari.pass`, the day bought). `safariAccess(safari, day)` in `js/data/balls.js` says 'first' / 'pass' /
'locked'; `safariTicket()` in `js/daypass.js` is every way in (the prep window's Start, the result window's again button):
it lets 'first' and 'pass' through and otherwise offers the pass (or says the coins are short). The prep window's Start
reads Start 1/1, then "Day Pass 100", then Replay ∞; the title's gem 1/1, 0/1, then ∞. Pinned by `tests/daypass.test.mjs`.

**Each replay its own seed** (the user's call, 2026-10-20): only the first try plays the day's `safariSeed(day)`, the
same for everyone. Every replay (`beginSafari()` in `js/run.js`, a Duo Run too) keeps the day's areas and starter but
rolls a fresh `run.safari.seed`, so its maps, fights, rewards and rare spawns differ each time. It's saved in the run, so
a refresh still replays a room exactly. `?bossfight=<area>` keeps the day's seed.

## The fair first try

The day's first try is the leaderboard's, so `fairTry()` in `js/run.js` turns off every perk for it: `perk(id)` and
`dexPerk(id)` (Max HP Boost, Starting Relic Charm, Well-Fed, Bag Pocket, Mart Card, Move Tutor Notes, Scout Report, the
Silph Scope's reveals and Scope Upgrade, Mom's Savings, Chansey's Gift, Oak's Advice). Coin Finder stays (it only touches
PokéCoins). The map says so at the start, and the result window's first-try line too. Replays keep the perks.

## The Safari Pokédex (phase 3)

- **Since 2026-10-07 the main Pokédex's look** (the user's call): `safariDexApp` in `js/safaridex.js` runs on `shelfApp()`
  (`js/bagdex.js`), with no window of its own (`#safari-dex-dialog` is gone). A banner per area painted with that area's
  scene (a group's `scene`, `still()` from `js/pokedex.js`; colours `AREA_INK`), its caught count and bar (`score`), a medal
  (gold once the area's reward is earned) and three of its Pokémon; a tap zooms it into the red handheld on that area:
  one Pokémon at a time on its place's scenery (`shotFor()`: wilds in the first two places, rare spawns the third), Wild or
  ✦ Rare, its type and a Caught tag once caught, its text typing out (where it lives, its line, caught or not, its
  signature card, a dashed ? until caught, a tap zooms it), the area's every Pokémon as slots (blue wilds, gold rares, a
  white dot once caught; `.sdx-*` in `css/screens.css`), the caught tally, then the area's reward box and the Rayquaza box.
  An entry is a silhouette and ??? until seen.
- **Shinies and sealed capsules** (2026-10-19, the roadmap's "Safari shinies" session 3; the user's ask): a shiny that's
  yours shows a ✨ ★N switch on its page's screen (bottom left; `shinySwitch()`): on, the screen's sprite and every owned
  slot's turn shiny, the battle's five twinkles (`.shiny-aura`, not under `calmFx()`), a chime; it stays on while the
  app is open (`shinyView`). Its lines say its Sparkle (★★★☆☆), or for a caught one not owned how to get it. A sealed
  capsule (`save.exchange.sealed`) is a smoked capsule ×N badge on the screen (top right, `sealedCap()`, a still copy of
  the Exchange's look) and a "🔒 2 sealed — catch to open" line (the user's words), seen or not. Slots: a gold star
  corner for an owned shiny, a capsule corner and blue-grey rim for a sealed one. Totals: `shinyBar()` over the banners
  (✨ Shinies N / 514 · Sealed: N) and under an area's slots, and each banner's sub line (`subArt`: ✨N · Sealed: N).
- **Data** (`js/data/safari.js`): `SAFARI_DEX_PAGES` (one per `SAFARI_AREAS` entry: `wild`, `rare` without repeats,
  `ids`), `SAFARI_NUMBER` (`SAFARI_ROSTER` order, so phase 4's Pokémon get numbers by being listed), `safariHomes(id)`,
  `safariProgress(ids, dex)` (caught counts as seen). Pinned by `tests/safaridex.test.mjs` (every entry has a picture,
  a number and a signature card).
- **Where it opens**: the Collection's **Safari** app (a 🔒 ??? until `safariOpen(save)`; the main Pokédex no longer has a
  Safari banner, 2026-10-07, the user's call: it was in two places), the Safari lobby's Pokédex key (in the lobby's own
  screen, below), and the top bar's Pokédex during a Safari run (its Safari app opens on the run's area, `runSafariArea()`
  in `js/run.js`).

## Completion rewards (2026-10-02, the user's design)

- **A page** (an area with every Pokémon on it caught, `safariPageDone()`): `SAFARI_AREA_COINS` (1000 since 2026-10-02, was 300: the user found it too small; Coin Finder applies)
  once, and that area's rare spawns `RARE_BOOST` (x2) as often when it comes up, on replays only: `rareOdds(area, dex,
  fairTry())` in `startBiome()` feeds `markRares()`. `creditSafari()` in `js/run.js` pays it after every won Safari fight
  (`safariNews(dex)` lists what's newly done), before `checkAchievements()`, with reward-box lines. Paid on any try: the
  coins don't touch the leaderboard, the boost waits for a replay.
- **The whole Safari Pokédex** (every `SAFARI_ROSTER` id caught, judged on the roster of that day): `save.safariDex.complete`,
  Rayquaza's achievement.
- Earned stays earned: `save.safariDex.done` (area ids) and `complete` are saved, so a later batch adding Pokémon to a page
  takes nothing back (the tab keeps its ✦, the box says Earned).
- **On screen**: each page's box shows its reward (🔒 until earned, gold once earned, ✦ on the count), a Rayquaza box on
  every page (a silhouette until won; the Safari UI never names Rayquaza until it's unlocked, the user's call: "Complete the
  Safari Pokédex: a new Legendary awaits you." there and in the prep window's last rule), a gold medal on finished areas' banners, and a gold ✦
  badge on the title's Safari Zone gem once complete (`.gem-badge`, `safariGem()` in `js/title.js`).
- **Rayquaza** (`safariPrize: true`) is left out of `safariStarters()`: listing it would have changed every day's dealt
  starter. Pinned by `tests/safarireward.test.mjs` (page / whole-dex news once, the boost, Rayquaza's assets).

## The Safari's own Pokémon (phase 4)

- `js/data/safari-mons.js`: `SAFARI_MONS`, one line each: `mon(id, name, type, area, template, [3 move names], description,
  [card name, cost, art, effects, card extras], { rare })`. A move name wrapped in `N()` is x1 (`type: 'normal'`), for an
  off-type move. `safariMonDef()` builds the `ENEMY_DEFS` entry (enemies.js adds them all, `safari: true`, `template`);
  cards.js builds each line's `sig-<id>` card (the card's type is the Pokémon's); safari.js appends each area's lines to
  its `normals` (or `rares`), after the borrowed wilds. **Shared ones** (2026-10-07): the 54 Pokémon of the Sunken Ruins,
  Thornwood Jungle and Sunscorch Savanna are Safari lines a main biome also holds. Their `ENEMY_DEFS` entry is that biome's (it wins over
  `safariMonDef()`, so in the Safari they fight at the biome's numbers like the borrowed wilds, not a template's), with the
  line's description kept as `safariLine` for the Safari Pokédex (`js/safaridex.js`); area, rare spawn and signature card
  still come from the line.
- Batches: 1 (58 Pokémon, ~9 an area + a rare spawn), 2 (84, 12 an area + 2 rare spawns, appended per area under
  `Batch 2` headers) and 3 (85, under `Batch 3` headers: 12-13 wilds + 2 rare spawns an area, 12 of them Fire, since
  batch 2 had only two; evolved forms of earlier Pokémon count as new species) and 4 (81, under `Batch 4` headers: 11-12
  wilds + 2 rare spawns an area, 29 Grass, 27 Water, 25 Neutral, since no Fire species were left) and 5 (80, under
  `Batch 5` headers: 11-12 wilds + 2 rare spawns an area, the last 11 Grass and 5 Water species and 64 Neutral; Numel and
  Magby moved from the Peak to the Wetland, which had no Fire Pokémon) and 6, the last (80, under `Batch 6` headers, all
  Neutral-shown: 20 each to the Forest and Wetland, which had the fewest Neutral Pokémon, 9-11 to the rest, 2 rare spawns
  each); **514 Safari Pokédex entries with the borrowed wilds: every Gen 1-5 non-legendary is in**. The Budew / Sewaddle / Lotad / Horsea / Spheal /
  Tympole lines stay out (the user turned them down as skins).
- `TEMPLATES` (Biome 1 numbers): striker 46 HP 6/5/9; bruiser 51, 6 / +2 strength / 9; tank 57, 8 block / 6 / 9; heavy 62,
  9 block / 5 / 11; speedster 40, 7/6/10; drainer 51, drain 5 (+4) / 6 / drain 8 (+5); poisoner 48, 5 + Poison / 6 block /
  9; paralyzer 48, 6 + Paralysis (draw pile) / +1 strength / 9; confuser 48, 5 / 6 block / 9 + Confusion (draw pile);
  clogger 51, 2 Sludge / 6 / 9. HP x1.1 since batch 3 (2026-10-02): the template Pokémon had become most of every
  roster and knock-out runs drifted to 83.7% (human bot); with it 74.0.
- `PLACE`: a template Pokémon in the run's 2nd / 3rd area has x1.16 / x1.42 HP and +1 / +2 on its attacks (its
  `strength` from `buildEncounter()`), on top of that biome's `hpMult` / `dmgBonus`, like the main game's wilds grow. The
  borrowed wilds keep their own numbers.
- Types: a line's `type` is only the main game's four (Bug is Grass, Ice is Water, the rest of the off types Normal): its
  signature card's type. Battles use the real types (below).
- A new Pokémon: its line, `assets/pokemon/<id>-front.gif` (PokeAPI's `versions/generation-v/black-white/animated/<dex>.gif`
  from raw.githubusercontent.com) and its `SPRITE_FIT` line (a PIL median bbox over all frames). `tests/safarimons.test.mjs`
  checks them all, that it isn't a main-game Pokémon, and that no signature card reads like a card any run can meet or
  another signature card, by the twin rule (`sigReport()` in `tools/card-twins.mjs`, `docs/card-twins.md`; since
  2026-10-27, was the same cost and text against a Fire / Grass / Water run). A new one needs a line of its own:
  `node tools/card-twins.mjs` names what it reads like. Mewtwo's Psychic cards are left out: it never walks the Safari.

## Real types (2026-10-19, the roadmap's "Six new types for the Safari's duo pool", session 2)

- **The rule** (the user's shape): in a Safari run every wild Pokémon wears its real (dual) types and every move its real
  type, on the real 18-type chart, with no immunities (an x0 is a resistance), the product capped at x2 and floored at
  x0.5, so a hit is still one of the game's three steps (`SUPER_EFFECTIVE` 1.3, 1, `NOT_VERY_EFFECTIVE` 0.75). Neutral
  cards stay outside the chart (x1 both ways); a wild's Normal move is a real Normal move. Elites and bosses stay
  typeless (`typeless()`). You defend as your starter's deck type (Fire / Grass / Water) alone. The main game keeps its
  triangle. The floor at x0.5 is this session's call (a x0.25 would be a step the game doesn't have): one line in
  `realFactor()` to change.
- **Data**: `js/data/real-types-table.js` (`CHART`, `SPECIES` grouped by types, `MOVES` grouped by type), written by
  `tools/real-types.py --gen5` from PokeAPI's CSVs: **Gen 5's 17 types and typings since 2026-10-19** (the user's answer
  13 in `docs/duo-design.md`: no Fairy, so Clefairy is Normal, Marill Water, Steel resists Ghost and Dark; Gen 6's Fairy
  moves, Moonblast and Fairy Wind, count as Normal, like Charm was; built first on today's 18, which the script still writes
  without the flag); it maps our ids
  and a few old move names (`Faint Attack`, `Hi Jump Kick`, and the Abilities `Forecast` / `Stench` used as moves). **A new
  Safari Pokémon or move needs the script run again**; `tests/realtypes.test.mjs` fails until it is. Helpers in
  `js/data/real-types.js`: `REAL_TYPES` (names and icons; `js/icons.js` draws all 18, ❄️ ⛰️ 🪶 🪨 added for them),
  `speciesTypes(def)` (by `spriteId`), `moveType(move, def)`, `realFactor()`, `realMultiplier(type, defenders, { card })`,
  `realBeats()` (the tough match-up prize: one of its types hits yours super effectively).
- **The battle** (`js/battle.js`, all behind `battle.safari`): `cardMultiplier()` and `enemyTypeMultiplier()`; the
  nameplate's chip shows one icon per type (title "Grass / Fairy type") and the frame takes the first type's colour
  (`.enemy-zone[data-type]`); the intent's title names the move's type ("Grass move: 14 damage"); **the hint**:
  `markEdge()` turns an attack's type line green with a ▲ when it's super effective on this wild, grey with a ▼ when
  it's resisted (`.card.edge-up` / `.edge-down` in `css/cards.css`), in hand and on the risen card. The Safari Pokédex
  shows a caught Pokémon's real types (`.sdx-typechips`), and the lobby's rules a line on them.
- **The bot**: the sim mirrors it (`b.real`; variant `triangle` restores the old Safari; `cfg.safariType` deals only days
  whose starter is that type). Numbers in pokeDB-sim's README.

## The duo and the Duo Run (2026-10-19, the roadmap's "Six new types", session 1)

`docs/duo-design.md` sections 1-3 are the rules (the user's 22 answers); this is where they live.
- **The pure part**: `js/data/duo.js` (the sim imports it): `DUO_SWITCH_PP` 1, `STAB` 1.2, `validDuo()`, `newDuo()`
  (the pair with its **two decks**, each partner's own solo starting deck: session 1b), `duoDeck()` (both decks and the
  loose cards, what `run.deck` mirrors), `restoreDuo()`, `ownerOf()`, `asksOwner()`, `syncDecks()`, `runTypes()` / `outStarter()` /
  `benchStarter()`, the pools (`runPool()` both types' cards with Neutral once, `runTypePool()`, `runItems()`,
  `fitsTypes()` for `only` relics and items), `rewardSlots()`, `duoPool()`, `duoGains()` and `duoOpen()`. Pinned by
  `tests/duo.test.mjs`; `tests/cards.test.mjs` checks no two cards a duo can meet share a type, cost and text.
- **Two decks** (session 1b, 2026-10-19, the user's call; `docs/duo-design.md` section 1 and answers 23-28):
  `run.duo.decks = [lead's, partner's]` and `run.duo.loose` (Neutral cards not yet given) are the decks; `run.deck` stays
  the whole deck in their order, so every place that pushes, splices or swaps in it still works, and `syncDecks(run, aim)`
  carries each change into the right deck (a type's card to its type, an upgrade or swap to the deck it was in, a
  removal from the deck `aim.from` names or its type's, a status card or token to the one out, a Neutral one into
  `loose`). It runs at `checkpoint()`, `showMap()`, a fight's start and the deck window. `showMap()` asks "Who learns it?"
  for each loose card (`whoTakes()`: the two partners' portraits) before the map. The deck pickers (PP Up, Forget, the
  Bonfire, Ditto, Day Care, Smeargle, Bill's PC) take their cards from `deckGroups()` and their options through
  `inDeck()`: each partner's cards under its name (`groupLabel`, `.choice-group-head` in `showChoice()`), the pick
  syncing that partner's deck. The Bag's deck window (`js/deckpreview.js`) groups them too. A duo saved before the
  decks is dropped (`restoreDuo()`).
- **The run** (`js/run.js`): `run.duo = { ids: [lead, partner], out, decks, loose }` beside `run.starter` (the lead), saved with the
  run (additive, no `RUN_SAVE_VERSION` bump; restored through `restoreDuo()`, Safari runs only). `beginSafari(daily, pair)`
  starts one: both solo decks (`newDuo()`), `first: false` (never posted, coins as a replay, perks on), and it never spends the day's
  free try. The map's run card shows the one out and both names; the Bag's relics list both Abilities ("while out");
  a boss evolves both (the one out on screen, a line for the partner). Card rewards (`cardChoices()` in
  `js/rewards.js`): one of each type, the third either, each slot from its type's pool with Neutral at its usual
  share; the Mart, Move Tutor, the ? events and Metronome draw from both pools; evolution offers one card of each type;
  `only` relics and items of either type; the tough match-up prize only when the wild beats both. The places that
  still read one type (Bill's PC, the Unown Tablet, the Litwick Bonfire) read the one out.
- **The battle** (`js/battle.js`): `battle.starter` is the one out (`outStarter()`), `battle.duo = { run, types, came,
  armed, switches, piles, drew }`. **Each partner's piles**: `drawPile` / `hand` / `discard` / `exhaust` are the one
  out's, live as ever; `duo.piles[i]` holds each partner's, the one out's written back on a switch (`swapPiles()`), so
  every rule that reads the piles reads the one out's and the bench's stay untouched. `drew[i]`: a partner's first time
  out in a turn draws its hand (`turnDraw()`, the turn's count without Lagging Tail's extra); at the end of your turn the
  benched hand fades, keeps its Retain cards and discards the rest (`benchEndsTurn()`). The chip shows ✋ its hand this
  turn, else 📚 its draw pile. The chip on your nameplate (`#player-bench`, `renderBench()`) is the partner's portrait in its
  type's colour with ▲ / ▼ for the coming hit on it; a tap arms `#switch-go` ("⇄ Go, Squirtle! 1 PP"), a second tap
  switches (`switchOut()`), a tap elsewhere puts it away. Only on your turn, any number of times, never ending it. The
  switch swaps the sprite (a red-light `recalled`, then the ball's `released`, under `battleFx()`, a cut without), the
  name, type chip, theme and Ability (`abilityFor()`); a fight-start Ability (Torrent's Tide) fires the first time each
  partner comes out (`came`); since the balance pass (2026-10-20) Torrent gives its Tide again each time Water comes back
  out, once a turn (`tideTurn`), like Keen Eye and Intimidate. Everything else stays. STAB (`stabOf()`) multiplies the attack damage of the out type's
  cards, against elites and bosses too; the card hint (`markEdge()`) counts it, its title naming the parts. Held-item
  relics (Charcoal...) boost their type whoever's out. Who's out is written into `run.duo.out` as you switch, so the
  next fight starts with whoever was out at the knockout (Overgrow goes by that too).
- **The Duo key** (`js/duoprep.js`, `duoApp` in the lobby's `APPS`; since 2026-10-20, the user's call, in the gate window's top right corner, `.sp-duo-key`, grey until the day's Daily run is done, the four other keys below): today's road (each area's main types,
  `areaTypes()`, 4 of its Pokémon, silhouettes until seen, its rare spawns' ✦), the duo pool's portraits (a tap picks,
  the first is the lead, a tap on a pick drops it, a third pick takes the second's place; ◀ ▶ steps the look through
  your owned starters of the type), how the pair fares in each area (`fares()`), A = Pick 2 / Start Duo / Locked.
  Start Duo goes through `safariTicket()` (the Day Pass) and `onDuo` in `js/main.js`. Locked until the day's free try
  ends, won or lost (`save.safari.done`, set in `endRun()`; abandoning never gets there); `?duorun` lends it.
  **Its layout** (the user's calls, 2026-10-20): the Duo app alone keeps the lobby's window (`window: true` in `APPS`),
  and the picks stand at the gate as they're made, lead on the left (`dressGate()` in `js/safariprep.js`, `duoLooks()`;
  "Pick your duo" / "Pick a partner" until two are picked). Below it the panel scrolls: the pool first, then today's
  road, each area a `<details>` row (number, name, its Safari Dex count; collapsed by default, its open state kept
  across a pick's re-render) holding the types, Pokémon and fares. The road is the Daily run's own three areas and the
  counts are the one Safari Dex, the same as the lobby's rows. Type chips and the portraits' corners are round badges
  (`typeBadge()` in `js/type-badge.js`, SVG glyphs in the games' icon colours, not the emoji), and each portrait stands
  its sprite by `SPRITE_FIT` / `BODY_X` (`faceSprite()`), not by its GIF's frame.
- **The Duo Run's own road** (the user's call, 2026-10-20: "keep it 3 biomes but always different than the daily"):
  `duoRoad(daily)` in `js/data/safari.js` deals three of the day's other areas on `${seed}|duo-areas`, the same all day
  for everyone, so the Duo app shows it ahead; `beginSafari()` swaps it in for a duo, and each try still rolls a fresh
  seed for its maps. `?powerplant` and the like still put their area first. Pinned by `tests/duo.test.mjs`.
- **New duo starters on the map** (2026-10-20): on a Safari map (not a peek), a wild room whose Pokémon is a stage of a
  duo line you haven't caught (`duoGains()`) shows its type's badge on the room's top-left (14px, `.map-duo`) (`map-duo`, `duoNew` in
  `tracking()` in `js/run.js`), unnamed like every room; a tap says a new duo starter lives there.
- **The duo pool**: `save.duoPool` holds the types caught beyond Fire / Grass / Water (type -> starter ids as looks);
  the base three are every owned starter of the type. `duoNews()` in `js/run.js` (from `creditSafari()`) adds a type
  when a stage of one of its `DUO_LINES` starter lines is in `save.safariDex.caught`, old catches included, with the
  unlock window ("🔓 New duo starter!", 2026-10-20: `duoNews(windows)` feeds `unlockWindow`'s `feat` form; a line in
  the reward box was easy to miss). 30 lines in all; the 14 added 2026-10-20 (`docs/duo-design.md` section 3) stay in the
  areas they already lived in.
- **Electric** (session 3, 2026-10-19; its rules and card table are `docs/duo-design.md` section 5's "Electric's first
  session"): the first new type. **Shinx** (`DUO_STARTERS` in `js/data/starters.js`: looked up by id only, never in
  `STARTERS`, so no character select, Game Corner, statue or "every starter" count sees it; its back GIFs, `SPRITE_FIT`,
  `BODY_X` and cries came with it), `DUO_LINES.electric` (catching Shinx, Luxio or Luxray adds Electric; session 4
  adds Mareep / Pichu / Elekid / Tynamo and moves them to the Power Plant). In `js/battle.js`: **Static**
  (`applyStatic()`, `enemy.static`, the ⚡ badge; `staticCap()` 10 / Alpha 15 / boss 20, +5 per `enemy.paras`;
  `paralyzing()`: the intent reads "⚡ Paralyzed" and `enemyTurn()`'s step 1c skips the move), the **Static Ability**
  (an enemy attack adds 2), **Overcharge** (`energyMult`, `energyPer`, powers `energyEachTurn`, `keepEnergy`),
  **switches** (`switch: true` sets `b.switchAfter`; `playCard()` then calls `comeOut()` free in a duo and `switched()`
  always: `b.switches` / `b.switchesTurn`, powers `switchBlock` / `switchDraw` / `switchStrength`; `ifSwitched`,
  `perSwitch`). `switchOut()` is now only the chip's paid switch (`switchCost()`: **Shed Shell**, a `duo: true` relic,
  makes the turn's first free). **Baton Pass** is a `duo: true` Neutral card: `poolForType(type, duo)` and `fitsRun()`
  keep both out of every other run. `?duopool` lends every built type for the page load; `tools/electric-probe.mjs`
  checks the mechanics in a real fight. Duo Runs have no leaderboard tab.
- **Electric's second session** (session 4, 2026-10-19; the card table, relics and the area are `docs/duo-design.md`
  section 5's "Electric's second session"): 36 more cards (74 in all, defence-leaning), their new keys in
  `js/battle.js` (`blockPerStatic`, `blockPerSwitch`, `staticMult`, powers `thornStatic`, `staticBlock`, `energyBlock`,
  `switchWeak` / `switchStatic` / `switchSap` in `switched()`), Magnet (`bar-magnet`; the old `magnet` relic is now Quick
  Powder) and 6 more relics, Electric Gem and Shock Drive, the Card index's Electric tab (its moves ??? until met), and
  four more `DUO_STARTERS` looks on Shinx's deck: **Mareep, Pichu, Elekid, Tynamo** (back GIFs, `SPRITE_FIT`, `BODY_X`,
  cries), each line in `DUO_LINES.electric`. **The Power Plant** (`powerplant`, a 7th area: Gate, Turbine Hall,
  Generator Room, Reactor): the five lines and the Meadow's, Forest's, Wetland's and Marsh's Electric wilds moved in
  (`was:` on their `SAFARI_MONS` lines). **Date-gated**: `SAFARI_FROM` in `js/data/safari.js`; `safariAreasOn(day)` gives
  a day before it the six areas with the old rosters (the same deal as before, checked day by day), and from it 3 of the
  7; a run reads its areas through `safariAreaOn(id, run.safari.day)`. The Safari Pokédex (`SAFARI_AREAS`) shows today's
  rosters, so its numbering moved. Painted as the Peak in storm steel and hazard yellow (`SAFARI_ART.powerplant` with
  `paintAs: 'peak'` in `js/scene.js`; its film in `js/safari-intro.js`; map, badge, Exchange and Pokédex colours) until its
  art session; no furniture prize for its page yet. Its Ranger survey stops at I (23 Pokémon). `?powerplant` with
  `?duorun` puts it first in a Duo Run before its day.
- **Ice's first session** (session 5, 2026-10-19; rules and card table in `docs/duo-design.md` section 5's "Ice's first
  session"): **Vanillite** (`DUO_STARTERS`, `ICE_DECK`; back GIFs, `SPRITE_FIT`, `BODY_X`, cries), `DUO_LINES.ice`
  (catching Vanillite, Vanillish or Vanilluxe adds Ice; they still live in the Peak until the Ice Cave). In
  `js/battle.js`: **Frostbite** (`applyFrost()`, `enemy.frostbite`, the ❄️ badge: +1 a stack on every hit in
  `damageFor()`, thawing 1 at the end of the enemy's turn), **Icicle** (`b.icicles`, counted in `resolveCard()` after
  the card's own hit), **Weather** (`b.weather = { kind, turns }`, `setWeather()`, `hailing()`, the 🌨️ badge; `endTurn()`
  chips the enemy `HAIL.chip` through its block, then a turn goes; Hail adds `HAIL.bonus` to every hit of an Ice card),
  and **Snow Warning** (Hail 2 at the fight's start, or the first time Ice comes out in a duo, `comeOut()`).
  `tools/ice-probe.mjs` checks them in a real fight.
- **Ice's second session** (session 6, 2026-10-19; `docs/duo-design.md` section 5's "Ice's second session"): 36 more
  cards (defence-leaning), Never-Melt Ice + 6 relics (Snowball, Safety Goggles, Icy Rock `ICY_ROCK`, Icicle Plate, Ice
  Memory, the boss Ice Stone in `abilityFor()`), Ice Gem and Chill Drive, the Card index's Ice tab, **Swinub** (a
  `skinOf: 'vanillite'` look; `DUO_LINES.ice.swinub`) and **the Ice Cave** (`icecave`, an 8th area: every Ice-typed
  Safari Pokémon moved in with `was:`, date-gated by `SAFARI_FROM` like the Power Plant, painted as the Wetland
  recoloured to a frozen lake: `SAFARI_ART.icecave`, `paintAs: 'wetland'`). Playtest a Duo Run in it with `&icecave`.
- **Fighting's first session** (session 7, 2026-10-19; rules and card table in `docs/duo-design.md` section 5's
  "Fighting's first session"): **Timburr** (`DUO_STARTERS`, `FIGHTING_DECK`; back GIFs, `SPRITE_FIT`, `BODY_X`, cries),
  `DUO_LINES.fighting` (catching Timburr, Gurdurr or Conkeldurr adds Fighting; they still live in the Peak until Dojo
  Mountain). In `js/battle.js`: **Follow-up** (`b.lastKind`, set at the end of `resolveCard()`; `followsUp()`), **Counter**
  (`gainCounter()`, `b.counter` and the 🥊 badge, cleared in `beginPlayerTurn()`; `enemyTurn()` hits back after each attack
  and records `attackedNow` / `lostNow`, which become `attackedLast` / `lostLast` at your turn's start), **Bide** (⏳,
  released in `beginPlayerTurn()`), **Sore** and the **Guts** Ability (`statusHeld()`: +3 on attacks while a status card
  is in your hand, the 💢 badge and the lit Ability pill). `tools/fighting-probe.mjs` checks them in a real fight.
- **Fighting's second session** (session 8, 2026-10-20; `docs/duo-design.md` section 5's "Fighting's second session"):
  36 more cards (defence-leaning), Expert Belt + 6 relics (Ring Target, Focus Band, Protector, Weakness Policy, Fighting
  Memory, the boss Fightinium Z in `abilityFor()`), Fighting Gem and Red Card, the Card index's Fighting tab, **Machop**
  (a `skinOf: 'timburr'` look; `DUO_LINES.fighting.machop`; Machamp's cry new) and **Dojo Mountain** (`dojomountain`, a
  9th area: every Fighting-typed Safari Pokémon, 30, moved in with `was:`, date-gated by `SAFARI_FROM` like the Power
  Plant, painted as the Desert recoloured to a granite mountainside: `SAFARI_ART.dojomountain`, `paintAs: 'desert'`; its
  rares the ones already rare). Playtest a Duo Run in it with `&dojomountain`.
- **Ground's first session** (session 9, 2026-10-20; rules and card table in `docs/duo-design.md` section 5's "Ground's
  first session"): **Trapinch** (`DUO_STARTERS`, `GROUND_DECK`; back GIFs, `SPRITE_FIT`, `BODY_X`, Vibrava's and Flygon's
  cries), `DUO_LINES.ground` (catching Trapinch, Vibrava or Flygon adds Ground; they still live in the Desert until the
  Quarry). In `js/battle.js`: **Dig** (`b.underground`, the ⛏️ badge, `surface()` at your turn's start), **Fault**
  (`applyFault()`, `enemy.fault`, the 🌋 badge, `faultLine()`), **Sandstorm** (the Weather engine's `'sand'` kind, the 🏜️
  badge; its chip and Ground blocks' +3) and **Sturdy** (`b.sturdy`, once a fight in `hurtPlayer()`).
  `tools/ground-probe.mjs` checks them in a real fight.
- **Ground's second session** (session 10, 2026-10-20; `docs/duo-design.md` section 5's "Ground's second session"):
  36 more cards (defence-leaning), Soft Sand + 6 relics (Earth Plate, Light Clay, Shuca Berry, Smooth Rock, Ground Memory,
  the boss Groundium Z in `abilityFor()`), Ground Gem and Terrain Extender, the Card index's Ground tab, **Rhyhorn** (a
  `skinOf: 'trapinch'` look; `DUO_LINES.ground.rhyhorn`; Rhydon's and Rhyperior's cries new) and **the Quarry**
  (`quarry`, a 10th area: every Ground-typed Safari Pokémon but Drilbur, the Swinub line (the Ice Cave's) and the Sandile
  line (left for Dark's Night Alley), 40, moved in with `was:`, date-gated by `SAFARI_FROM`, painted as the Desert
  recoloured to an open-cut quarry: `SAFARI_ART.quarry`, `paintAs: 'desert'`; its rares the ones already rare: Gible,
  Gabite, Garchomp, Flygon, Rhyperior). Playtest a Duo Run in it with `&quarry`.
- **Flying's first session** (session 11, 2026-10-20; rules and card table in `docs/duo-design.md` section 5's "Flying's
  first session"): **Starly** (`DUO_STARTERS`, `FLYING_DECK`; back GIFs, `SPRITE_FIT`, `BODY_X`, Starly's, Staravia's and
  Staraptor's cries), `DUO_LINES.flying` (catching Starly, Staravia or Staraptor adds Flying; they still live in the Meadow
  and the Forest until the Windy Cliffs). In `js/battle.js`: **Evasion** (`gainEvasion()`, `b.evasion`, the 🪶 badge,
  `evaded()`), **Tailwind** (`b.tailwind`, the 🌬️ badge, its extra card in `beginPlayerTurn()`), **Unburden**
  (`unburdened()`) and **Keen Eye** (`keenEye()`, `b.keenTurn`). `tools/flying-probe.mjs` checks them in a real fight.
- **Flying's second session** (session 12, 2026-10-20; `docs/duo-design.md` section 5's "Flying's second session"):
  36 more cards (defence-leaning), Sharp Beak + 6 relics (Sky Plate, Pretty Wing, Coba Berry, Air Balloon, Flying Memory,
  the boss Flyinium Z in `abilityFor()`), Flying Gem and Swift Wing, the Card index's Flying tab, **Pidgey** and **Pidove**
  (`skinOf: 'starly'` looks; `DUO_LINES.flying.pidgey` / `.pidove`; back GIFs, `SPRITE_FIT`, `BODY_X`, six cries) and **the
  Windy Cliffs** (`windycliffs`, an 11th area: the birds, 35: every Normal / Flying Safari Pokémon, the sea birds, Natu and
  Xatu, the Archen line, Aerodactyl and Skarmory, moved in with `was:`; the bugs, bats, balloons, grass and water flyers and
  dragons stay with their first type, and the Dark birds wait for Night Alley; date-gated by `SAFARI_FROM`; painted as the
  Peak recoloured to chalk sea cliffs: `SAFARI_ART.windycliffs`, `paintAs: 'peak'`, the `feathers` weather (drawn as
  leaves); its rares the ones already rare: Farfetch'd, Togetic, Togekiss, Braviary, Aerodactyl). Playtest a Duo Run in it
  with `&windycliffs`.
- **Dark's first session** (session 13, 2026-10-20; rules and card table in `docs/duo-design.md` section 5's "Dark's
  first session"): **Deino** (`DUO_STARTERS`, `DARK_DECK`; back GIFs, `SPRITE_FIT`, `BODY_X`, Deino's, Zweilous's and
  Hydreigon's cries), `DUO_LINES.dark` (catching Deino, Zweilous or Hydreigon adds Dark; they still live in the Peak and the
  Marsh until Night Alley). In `js/battle.js`: **Steal** (`steal()`), **Punish** (`punishing()`, `taunt()`), **Illusion**
  (`illusive()`, `partnerType()`), **Disguise** (`b.disguised`, `guardType()`) and **Intimidate** (`intimidate()`,
  `b.intimTurn`). `tools/dark-probe.mjs` checks them in a real fight; `tools/duo-probe.mjs --pair=dark,fire` a whole duo.
- **Dark's second session** (session 14, 2026-10-20; `docs/duo-design.md` section 5's "Dark's second session"): 36 more
  cards (defence-leaning), Black Glasses + 6 relics (Dread Plate, Reveal Glass, Colbur Berry, Razor Claw, Dark Memory, the
  boss Darkinium Z in `abilityFor()`), Dark Gem and Smoke Ball, the Card index's Dark tab, **Sandile** (`skinOf: 'deino'`;
  `DUO_LINES.dark.sandile`; back GIFs, `SPRITE_FIT`, `BODY_X`, Krokorok's and Krookodile's cries) and **Night Alley**
  (`nightalley`, a 12th area: 23 Pokémon, the Dark-first ones, the Sandile line, the Dark birds and the skunks, moved in
  with `was:`; Carvanha, Nuzleaf, Shiftry, Drapion, Spiritomb and Tyranitar stay with their first type, Sneasel, Weavile,
  Scraggy and Scrafty with the new area that already took them; date-gated by `SAFARI_FROM`; painted as the Marsh recoloured
  to a town at night: `SAFARI_ART.nightalley`, `paintAs: 'marsh'`, night at any hour, drizzle at dusk and night; its rares
  the ones already rare: Absol, Umbreon, Zorua, Zoroark, Bisharp, Hydreigon, Mandibuzz). Playtest a Duo Run in it with
  `&nightalley`.
- **Playtest**: `?duorun` (the Duo key open; `&duopool` lends Electric, Ice, Fighting, Ground, Flying and Dark; `&powerplant` / `&icecave` / `&dojomountain` / `&quarry` / `&windycliffs` / `&nightalley` put that area first), `tools/duo-probe.mjs` (headless: the lobby, two picks, a fight, a switch
  and back (the same hand), the turn's end (both hands discarded), the reward, the save's two decks, the Neutral ask and
  the grouped Forget). The sim: `cfg.duo` (pokeDB-sim's README).

- **Shinies in the Duo picker** (2026-10-21, the user's ask): a portrait whose shown look's shiny you own wears a round ✨ button on its top-right corner (`.duo-shiny`, gold when on), flipping the same `save.shiny.on` as the character select's ✨ Shiny. Not under the arrows: a second row there made the cards uneven (the user's "ew", same day). The ◀ ▶ row never wraps (`.duo-count` a fixed width).

## The areas' scenes (phase 5b, 2026-10-02)

- **One look, six places**: `SAFARI_ART` in `js/scene.js` becomes six `BIOME_ART` entries (ids = the area ids,
  `backdrop` / `floor` `'safari'`, `area`), so `showScene(areaId, kind, journey)` paints them like a main biome. Every
  area gets the Zone's own parts from `safariFront()`: a ranch fence along the back (gaps in the wilder areas; none on the
  Peak's snow), the games' tall grass in the near corners (more further in), the Zone's green signboard at the entrance
  (place 0) and a green-roofed rest house by the boss (place 3). An event room (`S.raw.prop`) leaves out the sign and house.
- **The areas** (`SAFARI_PAINT`: `back`, `floor`, `front`), each with 4 places (`STAGES` in `js/data/safari.js`,
  floors 1-3, 4-6, 7-10, the boss; the map's stage sign shows them):
  - Meadow (Grassland, Flower Field, Tall Grass, Lone Tree): rolling hills, far flat-topped acacias, a dirt track; the
    Flower Field is thick with flowers, the Tall Grass has clumps mid-field, the boss waits under a big acacia.
  - Forest (Woodland Path, Old Growth, Thicket, Sunlit Glade): trunks rising into a leaf roof, light falling through,
    ferns, mushrooms, stumps and logs; the Thicket closes in and darkens, the Glade opens a sunlit hole.
  - Wetland (Lakeshore, Pier, Boardwalk, Lily Lake): a lake under wooded hills with glints and the odd splash, reed beds,
    a stream across the grass, a pier on stilts (longer on the Boardwalk), a lily pond in a near corner, flattened in perspective (rx x 0.2-0.32, like the Marsh pools; sized from the screen height it looked seen from above, the user, 2026-10-02).
  - Marsh (Bog, Willow Bank, Sunken Woods, Misty Mire): an overcast sky, weeping willows and dead trees, murky pools that
    bubble, mud, cattails, mist thickening further in (`S.mist` + 8 a place).
  - Peak (Foothills, Pine Slopes, Snowfield, Summit): snow-capped ranges, snow-dusted pines, snow drifts growing to a
    snowfield, flakes falling; the Summit is cracked bare rock above a sea of cloud with a cairn.
  - Desert (Dunes, Cactus Flats, Canyon, Oasis): dunes and far mesas, wind ripples, cacti, bleached bones, blowing sand
    and a tumbleweed now and then; the Canyon's red walls, the Oasis's pool under palms.
- **One road** (the user's ask, 2026-10-02: "as if we're actually traveling through a linear place"): every floor shows the
  same trail running from your feet to the vanishing point (`trailAt(t)`, bending a little differently per floor;
  `paintTrail()`, styles `dirt` / `planks` / `snow` / `sand` from the area's `trail` list, by place: the Wetland's
  shore path turns into a boardwalk, the Peak's into a snow track), lined with `trailMarkers()` (rope posts, stones,
  railings, stakes, orange-tipped snow poles), through a gate in the ranch fence. The area's **goal** stands by the road
  far ahead and comes nearer every floor (`along()` = the journey's progress, `approach(side, k)`: it drifts out to the
  edge and down as you reach it): the Meadow's Lone Tree, the Forest's sunlit opening, the Wetland's lake widening, the
  Marsh's Great Snag in the mist (which thickens), the Peak's summit, the Desert's oasis palms. At the boss you're there.
  Each floor also gets a **roadside landmark** just past the fence (`floorLandmark()`, `ROADSIDE`: a fingerpost, Safari
  Ball crates, a bench, a lookout, a ranger's tent, plus the area's own: hay bales, a log pile, a rowboat, a stilt hut, a
  cairn, bones or a dead snag), dealt by the map's seed and the floor, so neighbouring floors differ. The Zone's
  signboard stands only on the first floor; the boss's floor has the rest house instead of a landmark.
- **Times**: only the day is hand-painted; dawn, dusk and night are it graded under their own sky (`safariTimes()`), the
  moon and stars at night. Elite and boss moods are the main biomes' grades. Storms: rain, the Peak a snowstorm, the
  Desert a sandstorm. Battle pads: grass, the Peak's stone with snow on its rim, the Desert's new `sand` style.
- **Rooms**: an area's `kin` (meadow / wetland / peak -> clearing, forest / marsh -> shrine, desert -> wastes) picks the
  look of the rooms that have one per main biome (treasure grotto, Hot Spring, Shrine, event props); outdoor ? events
  stand in the area's own scene.
- **The run**: `land()` in `js/run.js` (the Safari area, or the main biome) feeds the scene, the map (`PALETTES` in
  `js/map.js` has the six, with `bog`, `sand`, `snow` and `dune` terrain) and the signs (`data-safari`: the Zone's
  green board and a tan stage sign). Playtest: `?area=wetland` (`&stage`, `&kind`, `&time`), a tap walks on a floor.

## The areas' intro films (phase 5c, 2026-10-02)

- `js/safari-intro.js`: `SAFARI_INTROS`, spread into `INTROS` in `js/biome-intro.js`, whose `run()` plays them like the
  main biomes' (title, Pokémon popping out of the tall grass, the walk-on, tap to skip). One painter, `safariScene()`: five
  layers (far, mid with the goal, back, ground, fore; the Forest adds near trunks) slid and grown about the goal by the
  area's camera (`CAMS`): Meadow `drop` (down through the clouds, a pan to the Lone Tree), Forest `push` (in between the
  trunks to the sunlit glade), Wetland `glide` (down and along the lake to the lilies' bloom), Marsh `mist` (the mist
  parting on the Great Snag), Peak `crane` (rising out of the alpine grass to the summit), Desert `sweep` (a whip pan
  over the dunes, pulling back to the oasis, heat shimmer). Each area's `far` / `mid` / `back` / `ground` painters are
  plain functions there; the Zone's fence, signboard (the full film's first frame), trail and tall grass are shared.
- **Title**: kicker "Area N", SAFARI ZONE in the area's ink, the area's name on a green board (`.bi-area`), then the
  place. Silhouettes colour in from the **Safari** Pokédex (`known(..., film.safari)`).
- **Walk-ons**: `placeIntro()` for places 1, 2 and 3; unlike the main biomes, the boss's place gets one too (`nextPlace()`
  in `js/run.js`, `toBoss`), with the rest house by the goal. Each place's `look.goal` (1.35 / 1.8 / 2.4) brings the goal
  nearer; where it can't grow taller (wide screens) it grows wider (`spread`). Area extras: the Meadow's flowers and
  tall grass, the Forest's shade, the Wetland's lake widening, the Marsh's mist, the Peak's snow.
- **Playtest**: `?area=<area>` plays the area's film first, then each new place's walk-on as you tap through the floors
  (`peekSafari()` in `js/main.js`; `&intro=0` leaves them out). `body.scene-peek` lets `.biome-intro` show.

## The areas' boss preludes (phase 5d, 2026-10-02)

- `bossArenaPrelude()` in `js/scene.js` plays for a Safari area's boss place too (`hasPrelude()`: stage 3, not an event's
  room), on the main biomes' beats: a 3.6 s wake building to its climax, a 1.1 s portal into the paired white flashes,
  then an `awake` look that stays, quietly, over the fight. `SAFARI_PRELUDES` holds each area's `wake`, `portal` and
  `sounds` (frame, sound), all built on the area's goal (`loneTree()`, `greatSnag()`, `lakeTop()`, `life.oasis`...):
  - Meadow: the wind rises, the Lone Tree's crown thrashes and sheds leaves, then a flock bursts out of it; the portal is
    the flock pouring at you until it blacks out the screen. Sounds `leaf-storm`, `flock`.
  - Forest: the wood goes dark, beams reach down through the opening in the leaves, then the glade floods with light and
    flowers open across it; the light pours down over the screen. `glade-hum`, `sunburst`.
  - Wetland: a squall, rings pulsing across the darkening lake as it rises and heaves into a mound, which bursts into a
    column and one great wave; the wave breaks over the screen. `lake-churn`, `wave-crash`.
  - Marsh: the light goes, the mist thickens, and the Great Snag looms out of it as a bigger, clawing silhouette with
    glowing hollows for eyes, will-o'-wisps circling in; the mist closes in solid. `mist-drone`, `creak` x2, `loom`.
  - Peak: the summit shakes and cracks, snow slides down the far range, then an avalanche's powder cloud boils up out of
    the sea of cloud and rolls at you, ice tumbling ahead of it; a white-out. `quake`, `ice-crack`, `avalanche`.
  - Desert: heat shimmer, false oases flickering along a mirage lake on the horizon, the sky yellowing, then a haboob
    rises and rolls in; the sandstorm swallows the screen. `mirage`, `sandstorm`.
- **The arenas** (the user's ask, 2026-10-02: the boss room looked like any other): under the portal's last white flash
  `enterArena(true)` repaints the place as the area's boss arena (`S.raw.arena`, `ARENAS` in `js/scene.js`: `back` over the
  area's own sky and far backdrop, `floor`, `front`, and `life` for its `awake` animation, which fades up out of the white;
  `noSun` hides the sun where the arena lights its own sky). The floor is a disc laid on the ground in perspective
  (`arenaGround()` / `fillDisc()`: every ring, tile, vein and streak is placed in ground units, so it shrinks and flattens
  into the distance, and raised floors hang a face under their near rim; `DEPTH` sets how much farther the far rim is than
  the near one, since the user saw flat ellipses as "circles slapped onto the screen"):
  Meadow a crop circle under a gathering storm, standing stones round it, the Lone Tree huge in the corner; Forest a fairy
  ring of glowing mushrooms on flagstones laid in rings round a middle slab, every third ring moss, between two colossal trunks out at the edges, dark undergrowth closing the glade behind (straight courses and light shafts down over the floor read as a wall on a phone; the user, 2026-10-02); Wetland a giant lily pad out on the lake, lotus
  flowers, waterfalls off the far hills; Marsh a peat island in a glowing bog, lantern stakes, the Great Snag towering;
  Peak an ice sheet under the aurora between crystal spires; Desert a carved sandstone dais in ruins, a pyramid and a
  swollen red sun behind. A replay of the prelude puts the place back first. In a battle the disc is fitted to the two pads
  (`battlePads()`: its far rim just behind the boss's, its near rim just in front of yours); `?bossfight=<area>` shows it in
  a real fight.
- The battle preloads the scene's own prelude sounds (`bossPreludeSounds()`), and a Safari boss opens with its area's
  line (`SAFARI_PRELUDE_LINES` in `js/battle.js`).
- **Playtest**: `?area=<area>&stage=3` plays the boss place's walk-on, then its prelude; a tap replays the prelude, a
  tap on the label walks on (`&intro=0` skips the walk-on).

## The bot (`../pokeDB-sim`)

`cfg.safari` (`safariCfg()` in `sim/run-node.mjs`) plays a Safari day: `true` deals a random day per run (its starter,
areas, seeded maps, wilds and rare spawns via the game's own `dealEnemies()` / `markRares()`), with each type's relic
ranks. `cfg.catch` keeps 1 PP back while the bot plays its cards, then throws a Safari Ball if the odds reach
`cfg.catchAt` (else it spends the PP); the engine
mirrors Bait, Rock, running off and the catch's prize and signature card. Variants `noSafariCards` and `noRares` give the
phase 1 run.

## The leaderboard (phase 5a, 2026-10-02)

- **What posts**: only the day's first try (`run.safari.first`, never a `?event=` peek), once, when it ends, won or lost
  (`endRun()` in `js/run.js` -> `postSafariResult()` in `js/leaderboard.js`). Abandoning it posts nothing. The result is
  kept on this device (`pokedb.safari.post`) until it's posted, so signed out, offline or with no name yet it goes up later:
  on sign-in (`onCloudSignIn()` in `js/cloud.js`) or when the Leaderboard opens, while its day is within a day of today.
  The result window gets a 📮 line saying which.
- **An entry** is `safariBoard/<day>_<uid>` in the cloud save's Firestore: `{ day, uid, name, starter, won, area, bosses,
  turns, time, caught, at }` (`at` the server's time; `time` is wall-clock seconds from `run.tally.startedAt`). The name
  is always a nickname the player picked (`pokedb.safari.name`, `nameFor()`), never the sign-in's display name, which
  would put real names on a public board (the user's call, 2026-10-02). With no nickname yet, signed in or not, the
  Leaderboard opens with a gold-rimmed name box at the top (`nameRow()`, prefilled with the Google first name only as a
  suggestion), and posting waits (`post()` returns 'name') until one is saved. Once saved it shows as a line with a
  Change button (`nameLine()`, `editingName`); a result already posted keeps the name it went up with. Trimmed to 16
  (`cleanName()`).
- **Pure part**: `js/data/leaderboard.js` (`runResult()`, `buildEntry()`, `checkEntry()` mirroring the rules,
  `rankBoards()`, `formatTime()`), pinned by `tests/leaderboard.test.mjs`, which also checks `firestore.rules` keeps the
  same bounds (`LIMITS`, `NAME_MAX`, the keys).
- **Boards** (`BOARDS`): Fastest win (wins, time then turns), Fewest turns (wins, turns then time), Most caught (caught > 0;
  then wins, bosses, turns). Ties: the earlier post first. Top 10 each, plus your row under a ⋯ when you're below, and a
  "Your try" line with your own entry. A day's entries are one `where('day', '==', day)` query (up to 1000, no index
  needed), sorted on the device and cached a minute.
- **The window** (`#board-dialog`, `.lb-*` in `css/screens.css`; since 2026-10-18 an MMO-style table, the user's ask:
  "easy to read and follow and see all the information"; `tableApp()` in `js/leaderboard.js`, it was the Pokédex look
  on `shelfApp()`): a red handheld (lid, LCD title, ✕), its screen dark navy and gold: a banner in the board's colours
  (its name, the period's line, the period's starter, "Resets in" or "Final standings"), gold period tabs, any sign-in /
  name / posting lines, pills for the board (Safari: Fastest / Turns / Caught; arcade: one per game), then a row per
  trainer (rank badge gold / silver / bronze for the top three, their Pokémon, name, a second line of the other numbers,
  a climb's augments as up to 6 icons and "+N", the board's number on the right), your own row pinned in green at the
  bottom, the count and your name (✎ to change it) in the foot. A tap opens a row's details (every number, its Pokémon,
  a climb's augments by name, Add to Trainers); B / Escape shuts it first. ◀ / ▶ switch the period. `?lbsample=tower|safari|arcade`
  opens the board on 24 made-up trainers (you 14th), nothing fetched or posted. Opens from the title's 🏆 beside the Safari Zone gem (`#title-board`, only once the Safari is open) and a Safari run's
  result window; the lobbies' Ranks keys mount the same app in their own screen (`boardApp()`)
  (`#result-board`). Signed out: "Sign in to post..." with a Sign in button (opens the cloud window).
  No config / Firebase unreachable: "can't be reached right now", the game unaffected. Every Firebase call is caught.
- **Shinies** (2026-10-19): a try that caught wild shinies posts `shinies` (`run.tally.shinies`, never a `?wildshiny`
  one), only when there's one, so `OPTIONAL_LIMITS` (1-300) and the rules take it as optional. A row shows ✨ (✨N past
  one) after the name, its details a Shinies line, the lobby's plaque and the Outfitter's chalkboard a gold star. Until
  **the user publishes `firestore.rules` again** the old rules refuse the key: `post()` then posts the entry without it
  (the ✨ is lost, the result isn't).
- **Rules**: `firestore.rules` (the cloud save's `saves/<uid>` rule plus `safariBoard`): anyone reads; a signed-in player
  creates only their own `<day>_<uid>`, day within ±1 of the server's date, every field typed and bounded, `won` only with
  3 bosses, `at == request.time`; no updates or deletes, so each day posts once.
- **Switching it on** (the user, once, in the Firebase console for `pokedb-42e7c`):
  1. console.firebase.google.com > the pokedb project > Build > Firestore Database (if it says Create database: create
     it, a location near you, production mode).
  2. Its **Rules** tab: replace everything with the contents of `firestore.rules` from the repo, then **Publish**.
  3. Nothing else: no index, no new sign-in method. Sign in on the live site and play the day's first Safari try.
- Headless tests route gstatic to stand-in modules (an in-memory Firestore), as the cloud save's did. A cheater with the
  console can still post a made-up (in-bounds) result for their own account: there's no server replay check.

## From CLAUDE.md (moved 2026-10-14)

The summary CLAUDE.md used to carry, unchanged. Where it and the notes above disagree, the later date wins.

- **Catching** (Safari Zone phase 2, 2026-10-02; detail in `docs/reference/safari.md`): only in a Safari run's wild rooms,
  any turn a Throw button (`#throw-btn`) opens a ball picker (`#ball-picker`); a throw costs 1 PP and ends your turn, and its
  odds are `catchChance()` in `js/data/balls.js` (pure, `tests/catch.test.mjs`), rolled on the seed. A catch pays half the ₽
  and offers the Pokémon's signature card (`SIGNATURE_FOR` / `sig-*` cards, `safari: true`, never in `ALL_CARDS`); a new
  Safari Pokémon needs one. `save.safariDex` and `save.balls` (the Game Corner's 4th row). Rare spawns (`markRares()`) run
  off after 4 turns; Bait / Rock (`SAFARI_ONLY_CARDS`) are Safari-only rewards. The day's first try reads every perk
  through `perk()` / `dexPerk()` in `js/run.js`, which are off for it (`fairTry()`): read any new perk through them.
- **Safari Zone** (the daily run, `docs/reference/safari.md`): its **Safari Pokédex** (`js/safaridex.js`,
  an app on `shelfApp()`) is a banner per area built from `SAFARI_AREAS` (`SAFARI_DEX_PAGES`), so a Pokémon added to an area
  joins it; it opens from the Collection's Safari app, the prep window's Pokédex key and, in a Safari run, the top bar's Pokédex.
  **Prep window** (2026-10-02): the title's Safari Zone gem opens `#safari-prep-dialog` (`js/safariprep.js`: today's run,
  the rules, your balls, the Safari Pokédex / Leaderboard / Game Corner, then Start; its Pokédex / Ranks / Buy keys slide their apps over its own screen, `APPS` in `js/safariprep.js`); a 🏆 beside the gem
  (`#title-board`) opens the leaderboard. Every ball but the Safari and Master Balls is a pack used up when thrown
  (Great / Ultra 5, the special ones 3); `migrateBalls()` turned old one-time unlocks into 10 throws. Since 2026-10-07 every run
  has 30 Safari Balls (`SAFARI_BALLS`), and replays after the free daily try need a 100-coin **Day Pass** for the day
  (`safariTicket()` in `js/daypass.js`; `docs/reference/safari.md`).
  **Completion rewards** (2026-10-02): a page with every Pokémon caught pays 1000 PokéCoins once and doubles its rare spawns
  on replays (`rareOdds()`, never the first try); the whole Safari Pokédex unlocks Rayquaza. `creditSafari()` in
  `js/run.js`; earned stays earned in `save.safariDex.done` / `complete`, however the roster grows.
  **Its own Pokémon** (phase 4) are one line each in `js/data/safari-mons.js` (species, type, area, one of 10 role
  `TEMPLATES`, move names, Pokédex line, signature card); `PLACE` grows them with the area's place in the run. A new one
  also needs its front GIF and `SPRITE_FIT` line; `tests/safarimons.test.mjs` checks it all.
  **Leaderboard** (phase 5a, 2026-10-02): the day's first try posts once to Firestore (`safariBoard/<day>_<uid>`) through
  the cloud save's sign-in (`js/leaderboard.js`, pure part `js/data/leaderboard.js`, guarded by `firestore.rules`, which
  the user pastes into the console); every Firebase call is caught, so offline or blocked the game is unchanged. Its
  window and the lobbies' Ranks apps (the Sky Pillar's board too) are the MMO-style table (2026-10-18; see The window).
  **Its scenery** (phase 5b): each area is a `BIOME_ART` entry built from `SAFARI_ART` in `js/scene.js` (Meadow, Forest,
  Wetland, Marsh, Peak, Desert; painted by `SAFARI_PAINT`, with the Zone's own fence, sign, rest house and tall grass over
  all six), with 4 places each (`stages` in `js/data/safari.js`), walked as one road: a trail to the horizon, the area's
  goal ahead growing nearer every floor, a different roadside landmark each floor. A Safari run asks for its area (`land()` in `js/run.js`)
  for the scene, the map's palette and the signs; detail in `docs/reference/safari.md`.

## The locked door's tracker (2026-10-17, the user's ask)
While the Safari Zone is shut, a tap on the title's gem, the Clearing's gate (`open()` in `js/hub-3d.js`) or the
Collection's 🔒 Safari app opens `#safari-lock-dialog` (`showSafariLock()`, `js/safarilock.js`): one bar per DEX_PAGES biome,
Pokémon beaten / its entries (`safariUnlockPages()`), gold with ✓ Done once full, and the total. Walking up to the gate
without tapping it still shows only its card line.
In a run, a first win over one of the three biomes' Pokémon (`dexDefeated()` returns `safari`, passed on as
`pendingCoins.safari`) slides `.sl-toast` (`safariStepToast()`) down over the reward screen as it tells the news: that
biome's bar stepping up by one and the Safari total, gone after 4.5s, a tap opening the whole window. Never in a
playtest, the Safari, the Sky Pillar or Mewtwo's sprint (none of those count), nor once the Safari is open.
