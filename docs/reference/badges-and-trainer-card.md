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
  write an old save over a cloud download), the partner (a tap picks it: any owned starter at any stage, a defeated Pokédex entry or a Safari catch, `partnerChoices()`, saved as `save.partner`; an owned shiny comes both ways, a "Shiny" group in the picker and a ✨ toggle on the card (`:shiny` on the key; since 2026-10-19 a Safari shiny that's yours too, `mon:<id>:shiny`, with a SHINIES line counting them); Auto is the starter with the most wins; it also shows on the device cover and ID strip), and the Badge Case. Each badge is drawn as smooth SVG (2026-10-05, no pixels) from `LOOK` (a shape
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
- **The cover's Badge Case** (2026-10-27, the user's ask: the cover's badge pile kept growing up into the partner window,
  229 badges in all): `badgeCase()` in `js/collection.js` draws a fixed 6×2 grid, a slot per `BADGE_GROUPS` entry, holding
  that group's pinned badge (`save.pinBadge`) if it's there, else the last earned in the group's list order; a full group's
  slot is gold-rimmed, an empty one a dark socket, and a line under it counts every badge. A new group adds a slot (13 would
  wrap to a third row: change the grid's columns).
- **Choosing the cover's badges, and the pin made easy to find** (2026-10-27, the user: the "Pinned" tab looked hidden, and
  could the cover's 12 be set?): the Badge Case label is a flex row (`.tc-case-label`, keys in `.tc-case-keys`). A **Cover**
  key opens `coverPicker()` in `js/trainercard.js`: a row per group with any earned, AUTO first, a tap saving
  `save.coverBadges[group]` (AUTO deletes it); `coverBadge(groupId, save)` is the slot's badge (the set one, else the pin
  if it's in the group, else the last earned) and `badgeCase()` in `js/collection.js` reads it. The pin key is a gold-ringed
  plate in the card's dark ink with the badge in a cream disc (`.tc-pin-btn`, `.tc-pin-art`), a shine sweeping it while
  nothing is pinned (not under `calmFx()` or reduced motion), and the same badge sits as a tilted pin on the partner's
  portrait's corner (`.tc-tack`, "+" when empty), both opening `pinPicker()`. Both appear only when friends can see your
  page (`myCode()` or `?mycard`); Cover always.

**The Ball key** (2026-10-27, the user's yes): a chip under the partner with the carried ball (a 3D ball, js/ball-looks.js)
and its name opens `ballPicker()`: the Poké Ball, every Apricorn ball owned (made at Kurt's or bought at the Safari
Outfitter), then Kurt's seven not yet owned, greyed, saying where they come from. A tap carries it (`workshop.skin`):
the ball your partner comes out of in every battle, and the Safari Balls' look.

**The ball picker (2026-10-27, the user's ask):** `ballPicker()` in `js/trainercard.js` names each ball under it (the
plain Poké Ball "Plain") and puts a Put away button on the Carrying line while an Apricorn skin is carried. A `ball3d()`
sheet is an absolute URL (`setBall3d()` in `js/ball-looks.js`): a relative `url()` in a custom property resolves against
the stylesheet that uses it, `css/`.

**The Trainer key** (2026-10-28, the user's ask: a trainer the buddy follows): beside the Ball key, the worn look's front
frame and name (or "Trainer"), opening `lookPicker()`: the heroes free, the classes for PokéCoins, Walk alone to go
without. The system's notes: `docs/reference/trainer-follow.md`.

**The style slots** (2026-10-29, the user's pick of four ideas: the five pills under the partner, Ball / Trainer / Shiny /
Crown / Aura, read messy in four looks): one panel (`.tc-partner-frame`) holds the partner and a 2-column grid of square
slots (`.tc-slots`, `.tc-slot`; `slot()` / `locked()` in `openTrainerCard()`), in the order ball, trainer, shiny, aura,
crown, an odd last one centred. Pickers (ball, trainer) always show their icon; toggles (shiny, aura, crown) fade while
off and are ringed in the tier's ink (`--tc3`) while on (`aria-pressed`); the aura slot shows the worn (else best) aura
and its Level in a corner chip. Locked ones (aura before a Level 6 win, crown before 10) are greyed spans under a 🔒,
their title saying how they're earned on a tap. No captions: a 12px pixel letter is 12px wide and a slot about 47px.
Walk alone shows the first hero as a faint silhouette. The other ideas offered: a row of round slots, one Style key
opening a wardrobe page, or one pill style with "Ball · Moon" labels.
