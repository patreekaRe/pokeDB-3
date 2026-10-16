# Economy, perks, shinies, Level 5 rewards and the Hall of Fame

Moved out of CLAUDE.md on 2026-10-14 so every session loads less; the text is unchanged. Dates are when each call was made: where two notes disagree, the later one wins.

- **Economy**: `js/storage.js` holds `coins` and `passives`. `awardCoins()`
  applies the Coin Finder bonus and persists. `COIN_REWARDS` live in
  `js/run.js` (a won run pays 100 since 2026-09-28, was 50; a wild Pokémon whose type beats your starter's pays an
  elite's coins and ₽, `tough` / `payAs` in `afterFight()`, with a "tough match-up" line in the reward box; the user's calls); fight and win coins grow +10% per Trainer Level played (`COIN_LEVEL_BONUS`, `levelCoins()`; shown
  on the Prepare step's coins chip and How to play's PokéCoins tip). Shop catalog is `js/data/shop.js`; `js/shop.js`
  renders it. The Starting Relic Charm's relic is saved as `run.charm` and handed over on the map by `relicCharm()` in `js/run.js` (`showRelics()` with one relic and no Skip: it floats in the middle, a tap says what it does, Take it flies it into the Bag; the user's call, 2026-10-01). **Game Corner perks** (step 8, 8 in all, each shown `Lv n/m`; `perkLevel(id)` in `js/storage.js` reads
  one, true/false or a number): Max HP Boost, Starting Relic Charm, Well-Fed, Coin Finder, and since step 8 **Bag
  Pocket** (StS's Potion Belt: `itemSlots()` in `js/run.js`, 4 items), **Mart Card** (Membership Card, 3 levels:
  `MART_DISCOUNT` 10/15/20% off every Mart price and the removal, applied at the counter by `martPrice()`, so the
  saved stock keeps its base prices), **Move Tutor Notes** (Neow's upgrade, 1 level; a Lv 2 of two moves was +8 to +28 points at Level 3: `run.tutorLeft` starting moves
  to PP Up, asked by `tutorNotes()` at the end of `showMap()` after the checkpoint, so a refresh asks again) and
  **Scout Report** (Question Card: `REWARD_CARDS`, 4 cards on a fight's card reward). Old saves merge the new
  passives in as 0/false. **Shiny starters** (cosmetic): the Game Corner's third row, one per starter but Mewtwo
  (`SHINY_COSTS`: 400 the free three, 600 skins, 800 legendaries since 2026-10-16, were 250 / 350 / 500 from the user's call 2026-09-27; only once you own the starter, else a silhouette).
  The save's `shiny: { owned, on }`; buying switches it on, and a ✨ Shiny pill in the character select's panel
  (`#sel-shiny`, only once owned; a ✨ marks the portrait too) switches it. `spriteUrl()` in `js/data/starters.js` swaps in `<id>-shiny-<kind>.gif` when it's on
  (main.js hands it `isShiny` via `useShinies()`, since data files don't read the save), so every screen follows,
  a legendary's Super Saiyan forms too. The 126 GIFs are PokeAPI's black-white animated `shiny/` and
  `back/shiny/` sprites (the same source as the normal ones, byte for byte); `spriteFit()` in
  `js/data/sprite-fit.js` lends a shiny its normal sprite's entry. In battle a shiny comes out of its ball in a
  burst of ✨ (`shinySparkle()` in `js/battle.js`).
- **Level 5 rewards** (part 1, the user's picks 2026-09-28; the Hall of Fame is part 2): `level5Rewards()` in
  `js/run.js`, from `endRun()` on a won run at `MAX_LEVEL`, before `announceUnlocks()` (Mewtwo reads it). It counts
  `stats.level5WinsBy[starter]` (a gold ⭐ on that starter's portrait, `.sel-star`, and after its name in the character
  select's panel, `.sel-name-star`), gives the starter's shiny and switches it on if it isn't owned, and pays
  `LEVEL5_JACKPOT` (500, Coin Finder applies) once per type (`stats.level5Jackpot`). Each reward is a line in the
  result window. Old saves seed nothing (the user's call): rewards start from the next Level 5 win.
  **Hall of Fame** (part 2, 2026-09-28) and its **record book** (the user's follow-up, same day): `endRun()` saves *every*
  won run, any Level, in the save's `hallOfFame` list (oldest first; `recordWin()` in `js/halloffame.js`): `no` (win
  number), `fame` (Hall of Fame number, Level 5 wins only; `fameNo()`, and entries saved before the record book were all
  Level 5, numbered by `no`), starter, stage, shiny, type, local `date` / `started` "YYYY-MM-DD", level, the final deck,
  relics and Bag (`items`), `itemsUsed`, HP, and the run's numbers from `run.tally`. The tally (`freshTally()` in
  `js/run.js`, saved with the run; a run saved before it counts from its restore, with no `startedAt`) adds up each fight's
  `tally` from `onEnd` (`battle.tally` in `js/battle.js`: cards played, damage dealt without overkill via `enemyLoses()`
  for hits, Burn and Leech Seed, the biggest hit, items used, plus turns and damage taken) in `addTally()`, and counts
  Alphas, ❓ rooms, moves forgotten (`forgetMove()`) and ₽ spent (every Pokédollar payment goes through `spend()`; earned
  is money left + spent). Every win awaits `winScene()` before opening the result window (a modal dialog would sit in the
  top layer over it; the user wanted normal wins to feel satisfying too): the pedestal scene below, then the run's numbers
  as a grid of dark tiles popping in (`statsPanel()`, short labels, from the same `statList()` as the record's page), then
  the deck. A Level 5 win is the Hall of Fame version (gold pedestal, title, its song, "Welcome to the HALL OF FAME!");
  any other is "Victory!" on a silver pedestal with its own song, `run-win` (`assets/audio/run-win.mp3`, the user's, 112 s; if it's ever missing the victory fanfare already playing carries on), saved "as Win NNN". A Level 5 win also throws a **party** (part 3, 2026-09-28; `.party`, never under reduced motion, where it
  has no sound either): `celebrate()` in `js/celebrate.js` draws on `#hof-fx`, one low-res canvas behind the layout (3 CSS px a
  pixel on phones, 4 wider; ~30 fps; `stop()` when the scene closes), all in whole pixels, fading by stepping down a palette,
  never by alpha: two spotlights sweeping from the bottom corners (filled row by row), rockets on ember trails bursting in the
  starters' type colours and gold (sphere, ring, Poké Ball, gold willow, a crackler fizzing into white sparks), shooting
  stars, four-point twinkles; `land()` fountains gold sparkles off the pedestal as the Pokémon hops onto it (`.hop`); the
  title's letters (`.hof-letter`, `setTitle()`) flash in one by one, then a rainbow sweeps across them every 2.6 s;
  `finale()` at "Welcome to the HALL OF FAME!" launches a huge Poké Ball burst with a rainbow core (its `onBoom` flashes
  `.hof-boom` white and shakes the layout, `.boom`), two side bursts and a 14 s rain of gold confetti and ribbon streamers.
  Its sounds are synths in `js/audio.js` (`fw-launch`, `fw-pop`, `fw-boom`, `fw-crackle`: NES-style held noise,
  `chipNoise()`). Headless at 390x844 and 1280x800 it held 30 fps. The Hall of Fame scene (`#hof-scene`, z-index 950 like the evolution's) is Gold/Silver's: a
  white flash onto a starry night, your Pokémon slides onto a gold pedestal under a spotlight (`SPRITE_FIT` feet, half
  steps) and cries, its plate pops up (No.NNN, name, type chip, date, Lv.5), "Welcome to the HALL OF FAME!", then the
  final deck rises as a strip of `.card.small`s (`.scene-keep`: it scrolls, taps on it don't advance the text) over the
  text box. Its text box is the evolution scene's, `sceneSay()` exported from `js/evolution.js`. Music: `hall-of-fame`
  (`assets/audio/hall-of-fame.mp3`, the user's, 52 s), preloaded before a Level 5 final boss; while the file is missing
  `TRACK_FALLBACK` in `js/audio.js` plays `victory` instead (the element's `error` marks it `missing`). The Collection has two
  cards for it (the user's call: Level 5 champions and normal runs both worth seeing), each a grey "???" with a 🔒 until its
  first entry (`book()` in `js/collection.js`; a tap says how to unlock it, `tipAt()`), and the result window says "Record
  Book unlocked!" / "Hall of Fame unlocked!" the first time: **Record Book** (every win, "Win NNN", Level 5 ones with a ⭐)
  and **Hall of Fame** (Level 5 wins, numbered No.NNN), the last card (the user's call). Both open `#hof-dialog` (`openRecords('fame' | 'record')`,
  `bookEntries()`): entries newest first, the Record Book's lost runs as greyed lines between them (`save.losses`, `recordLoss()`; since 2026-10-04 one opens its **loss recap**, `lossPage()`, the same page a lost run shows before its result window: the fatal move, HP over the run from `run.tally.hpTrail`, its numbers and deck); tap one for its page: plate, a grid of its numbers (old entries show "-" for what
  they lack), the Ability and relics, the items left in the Bag and the ones used (sprites; a tap shows their `title`), and
  the final deck (`fillDeck()` from `js/deckpreview.js`, each card `zoomable()`).

- **The price rise of 2026-10-16** (the user's call, after the Trainer's Journal paid a full save ~26,500 at once): the
  one-off rewards (Journal ~26,500, Pokédex ~13,300, Ranger board ~11,700, Level 5 jackpots, feats; ~55,000 in all) paid
  for everything with a fixed price ~1.5 times over, before runs, missions (up to 200 a day, 1,000 a week) or the Game
  Corner (up to 500 a day). So the shop (`js/data/shop.js`) went skins 150/250 -> 300/500, perks 4,730 -> 11,800 (every
  level about doubled or more, the second and third levels most), shinies as above; Meowth's machines (`PRIZES` in
  `js/data/corner.js`) 450 -> 750; and the furniture store's curve (`shopPrice()` in `js/base-furniture.js`) 50-150 ->
  50-300, so one of every kind is ~192,000 (was ~107,000) and wallpapers and floors ~4,300 (was ~2,300). Fixed prices now
  add up to ~62,000: skins 2,400, perks 11,800, shinies 20,400, machines 18,000, the Secret Base's upgrades 5,000 and its
  papers ~4,300. Owned perks, shinies and pieces stay owned. House rooms (500) and doorways (100) are unchanged.
- **Where coins come from, 2026-10-16** (the user's yes, right after the price rise): a won run's bonus 100 -> 200
  (`COIN_REWARDS.winBonus`), the Game Corner's `DAILY_CAP` 500 -> 250, so runs out-earn the minigames. A daily player earns
  about the same (~1,300 a day before, now more from runs); everything with a fixed price (~209,000 with the statues and
  shells) is some four months of play, one of every furniture kind (~192,000) about as much again.
