# Badges and the Trainer Card

Moved out of CLAUDE.md on 2026-10-14 so every session loads less; the text is unchanged. Dates are when each call was made: where two notes disagree, the later one wins.

- **Badges** (roadmap item 17 part a, 2026-10-05): `BADGES` in `js/data/badges.js` (id, `group`, name, `icon` for part b's
  pixel art, `emoji` for text lines, `text` how to earn, `test(stats, save)` like `ACHIEVEMENTS`'), in nine `BADGE_GROUPS` (130 since 2026-10-07: the user's list, then 6 augment badges):
  Journey (each biome's boss, the Ruins' and Thornwood's read from `dex.defeated`, Champion,
  Fire / Water / Grass, Wanderer: a win through every road, at either fork, Explorer; the Savanna's Sun Badge, page and Savanna Hunter badges like the Ruins' and Thornwood's), Trainer Levels (Rookie 1 to Gold 5, a crown per type, Master,
  Veteran: 5 starters on Level 5), Challenges (one win's Record Book entry, Mewtwo's skipped: full HP, 12 cards, no move
  forgotten, under ₽100 spent, under 60 turns, 5 Alphas, no item; plus no rest, a 100 hit (losses too), 30 Tide), Collector
  (shinies, every starter, every ball held at once, every perk maxed, 10,000 coins earned), Pokédex (each page researched,
  and every Pokémon on the Ruins' / Thornwood's / Depths' page beaten: the main game's "capture"), Secrets (Dojo, Black Belt,
  Seal, Depths and Eternal `secret`, Pokédex, Safari, Streak 3 / Thunder 5, every legendary), Safari Zone (opened, 7 days,
  the Master Ball thrown 10 times: it's one buy with a throw a week, so `balls.masterThrows`, `masterThrows()` in
  `js/data/balls.js`; 1/5/10/15/20 different rares, each area's page, each area's rares, the whole Safari Pokédex), Safari
  types (each area x each type it holds, generated from `SAFARI_DEX_PAGES`, so a new area or type adds its own) and Sky
  Pillar (each guardian floor 10-100 from `bestEver`; 1-50 guardians in all, `tower.guardians`, counted in `climbed()` and
  read by `guardiansBeaten()`, an old save proving its best climb's or 10 a summit; Sky King, 4 weeks `tower.weeks`).
  `towerWeeks()` / `safariDays()` read an old save as one. The Game Corner checks
  them after a purchase too. Each test reads only what the save already keeps (the
  Level legendaries, `maxLevelWinByType`, `level5WinsBy` / `level5Jackpot`, the Hall of Fame, `winsBy` by the starter's
  type), so `checkBadges()` in `js/progress.js` (pure part `newBadges(save)`) granting into `save.badges` at load (`init()`
  in `js/main.js`, silent) gives an old save everything it can prove on day one. In a run it's quiet, no window: a
  `badgeLine()` in the fight's reward box (`unlock()` in `afterFight()`; Kenmatta's Dojo Badge in his relic window, once
  `kenWins` is saved) and in the result window (`announceUnlocks()` keeps them in `run.badges`). Peeked runs grant none.
  Tests: `tests/badges.test.mjs`. **The Trainer Card** (part b, 2026-10-04): `js/trainercard.js`, the Collection device's ID strip
  (`ownerStrip()`, drawn in the device's screen; `#trainer-dialog` from the title's Trainer Card sign and the Bag): the leaderboard nickname (`trainerName()`, never the sign-in's real name) or
  TRAINER (a tap on NAME edits it in place, `nameField()`, the same nickname as Settings' box, 2026-10-08; kept in the save's `trainerName` since then, so it follows a cloud save, a device's old `pokedb.safari.name` moving in if the save has none: `nameFor()` in `js/leaderboard.js`; posted board entries keep the name they went up with), wins, Pokédex / Safari counts, gold stars, play time (`stats.playMs`: `initPlayTime()` feeds `addPlayTime()` in
  `js/storage.js`, which adds only its own minutes to the save on disk and never wakes the cloud, so a hiding page can't
  write an old save over a cloud download), the partner (a tap picks it: any owned starter at any stage, a defeated Pokédex entry or a Safari catch, `partnerChoices()`, saved as `save.partner`; an owned shiny comes both ways, a "Shiny" group in the picker and a ✨ toggle on the card (`:shiny` on the key; only starters have shiny sprites); Auto is the starter with the most wins; it also shows on the device cover and ID strip), and the Badge Case. Each badge is drawn as smooth SVG (2026-10-05, no pixels) from `LOOK` (a shape
  polygon, three colours, a glyph) by `badgeArt()`; a new badge needs a `LOOK` line (the bulk ones are made in loops after it: `AREA_LOOK`, `TYPE_LOOK`, `BIOME_INK`). Its colour steps up with badges
  (`cardTier()`: green, bronze 10, silver 25, gold 40, violet with the Depths Badge). Badges not in `save.badgesSeen` pop in
  the next time it opens, and the gold "!" follows the trail (2026-10-07, the user's ask: it was hard to find what was new): on the
  home screen's ID strip, the new badge's group and the badge itself (`.tc-new`, a gold ring), opened scrolled to the first; a
  badge is seen only once tapped (`markSeen()` in `js/trainercard.js`), or by "Clear all !" when there are several.
  **New finds** get the same trail (2026-10-08, the user's ask: a relic found on a climb showed no "!"), in every mode: the
  first `markSeen()` of a relic, item or move also files it in `save.newFinds`, and while any is there the title's Pokédex
  sign, the top bar's / map's / rooms' Home keys (`.dex-news`, `deviceNews()` in `showBadgeNews()`), the device's LED, the
  app's tile, the group's banner and the slot (`shelfApp()`'s `fresh` / `shown`; the group opens on it) or the Moves tab
  and card wear a "!"; once on screen it's cleared (`clearFinds()`). `newFinds()` ignores ids no app lists (tokens, status cards). The Friends app's "!" (`friendsNews()`, 2026-10-16) rides the same trail: until it's first opened, then for a friend changed since the page showed them (`docs/reference/towns.md`'s Friends app). **Getting to it** (2026-10-04): the title's Pokédex sign (the device, whose home has the Trainer Card strip; `renderMenu()` in `js/title.js`), the
  Bag's 5th pocket (`trainer`, `renderTrainerPocket()` in `js/run.js`), and a tap on a result window's badge line
  (`badgeItem()`); `showBadgeNews()` colours the title's Pokédex sign and the Bag by tier and puts a gold "!" on them while a badge
  is unseen (after a fight that earns one, too). The title is four signs, Continue, New game, **Game Modes ▸** and **Pokédex** (2026-10-05, the user's pick over
  two flipped slots): Game Modes ▸ slides the stack sideways to a sub-menu with a Back sign, the Pokédex opens the device (since 2026-10-05; it was a Collection ▸ sub-menu) (`renderMenu()` / `goTo()` in
  `js/title.js`; Game Modes holds the Safari Zone and Sky Pillar), so new modes never lengthen the title
  (`docs/reference/title-screen.md`).

- **Friendship badges** (2026-10-15): the `friends` group, a badge a friend at 5 hearts and Best Friends for all 11
  (`docs/reference/towns.md`'s Friendship badges paragraph). 176 badges in all.
- **Ranger badges** (2026-10-16): one per Ranger Rank past Rookie, `ranger-2` (Scout) to `ranger-7` (Master Ranger), in the Safari group, tested by `rankOf()` from `js/data/ranger.js`; the card's RANGER line shows the rank. Detail: `docs/reference/hub-base-mall.md`, the Ranger Task Board.
- **Journal badges** (2026-10-16): one per Trainer's Journal rank past Beginner, `journal-2` (Novice) to `journal-7` (Grand Champion), in the Collector group, tested by `journalClaims()` from `js/data/journal-ranks.js`; the card's JOURNAL line shows the rank. Two ranks were renamed (Pro Trainer, Grand Champion) so no two badges share a name (`tests/journal.test.mjs` checks).
