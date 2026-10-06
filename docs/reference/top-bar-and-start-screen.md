## Top bar and start screen

There's no bar: the top-left **Pokédex** (`#brand-btn`: an 18x18 pixel red handheld inline in `index.html`, `.dex-sprite`,
always 36px so each pixel is exactly 2x2, the user's call 2026-09-28: "between smooth and a hint of 8-bit") opens the
Collection device over whatever is showing (`initPokedexButton()` in `js/main.js`, `openPokedex()` in `js/collection.js`).
It replaced the Poké Ball and its drop-down menu (2026-10-05, the user's call). The menu's items moved into the device's
home-screen dock: **Settings** (`#dev-settings`, a games' OPTIONS screen since 2026-10-06, the user found it bland: a card
per group, its head a band in the group's colour with a smooth icon, `.set-group` in `css/base.css`. **Sound**: the speaker
that mutes, then Music, Effects and Cries bars, each with an LCD number (`.vol-num`, painted by `paintSliders()`); Cries
have their own gain node (`cryVol` in `js/audio.js`, the save's `cryVolume`, which follows `sfxVolume` until moved; letting
go of the bar plays a cry). **Display**: Text speed Slow / Mid / Fast / Instant (`textPace()` in `js/prefs.js`, DOM-free so tests can import it, read by `sayLines()` in
`js/rewards.js`, so every text box and scene, and the Pokédex's `typeOut()`), Day & night Clock / Dawn / Day / Dusk / Night
(`setClock()` in `js/daytime.js`; a `?time=` pin still wins). **Battle**: speed 1x / 2x, the end-turn warning, Vibration
(`vibrate()` in `js/prefs.js`, every buzz goes through it). **Save**: Sign in (the cloud save, see Cloud save) and Abandon run over a run;
the card hides when neither shows. Every chip row is built from `OPTIONS` in `js/settings.js`: a new option is a line
there, a `.set-opt` in `index.html` and a default in `freshSave()`), **Help** (`#dev-help`: How to play, About), and over a screen also **Game Corner** and
**Main menu**. Stats and Achievements are device apps built fresh from the save by `js/records.js` (a locked legendary's
achievement shows "???" for its name, the user's call). Stats (revamped 2026-09-28, the user found "0/3 bosses" meaningless) is in sections: Runs (won
with win rate, lost, best level won, wins per type), Battles (Pokémon and Alphas defeated, furthest biome, each boss's kill
count), Collection (bars: starters, shinies, Pokédex defeated / researched, moves / relics / items found), PokéCoins &
records, and wins by starter. The newer counters live in `stats` (`bossKills`, `elitesDefeated`, `coinsEarned` in
`awardCoins()`, `deepestBiome` in `startBiome()`); old saves are seeded by `seedStats()` in `js/storage.js` (each boss ever
beaten counts once). Main menu's icon is the games' cream PC (🖥️, with the `v`/`V` cream
letters in `PALETTE`). The
**Index** (`js/cardindex.js`, `#index-dialog`, StS's Compendium; "Card index" until 6c.11b) opens from the
the Collection's Moves, Relics and Items cards (the device's apps since 2026-10-05; `openCardIndex()` has no caller now): every card in `ALL_CARDS`,
a sticky tab row per type (Fire, Grass, Water, Neutral, then a purple **???** for Mewtwo's coming Psychic pool: `renderMystery()`, 8 blank locked cards, counted nowhere; the user's ask 2026-09-28), grouped by rarity and
then the two evolution tiers (`evolutionCardsFor()`), sorted by cost then name at
stage 0 numbers, each card `zoomable()`. It opens on the picked starter's type,
else the last tab; new cards show up there on their own. Two more tabs, Relics and Items (the user's call,
2026-09-27), list every relic (the Abilities first, then by rarity, then Boss) and item (by rarity), with an
"N/M found" count: one you haven't taken (relics) or used (items) in a run is a dark silhouette of its sprite, "???" (`.index-thing.locked`).
Moves work the same since 2026-09-28 (the user's call, Pokédex-style): an unmet card is a grey "???" card with a black
silhouette of its art (`lockedCard()`, `.card.index-locked`, not zoomable), each rarity heading and the tab count "N/M".
A card is met (`markSeen('cards', id)`, upgrades count as their base) once it's in your deck (the starting deck,
a reward you took, a Mart buy, an event: `checkpoint()` in `js/run.js` marks the whole deck at every map checkpoint) or
you play it (`resolveCard()` in `js/battle.js`: Metronome's and the TM's too). Being offered isn't enough (the user's call,
2026-09-28). Saves from before seed `seen.cards` with the owned starters' decks and the run's deck (`seedCards()`).
A relic or item is only met once it's really yours (the user's call, 2026-09-28; before, being offered was enough):
`markSeen(kind, id)` in `js/storage.js` (the save's `seen: { relics, items }`) runs for a relic when you take it
(`gainRelic()`, every reward / treasure / event relic; a Mart buy; the Relic Charm) and for an item when you use it
(`useItem()` and `revive()` in `js/battle.js`, `useItemOnMap()`). Saves keep what they had already marked.
The **Pokédex** (`js/pokedex.js`, `#dex-dialog`, roadmap step 7) opens from the Collection's Pokédex card
and the top bar's Pokédex (so it opens from the map too, on the run's biome page). A page per biome
(`DEX_PAGES` in `js/data/pokedex.js`, built from `BIOMES`: 12 wilds, then Alphas, then Bosses, numbered No.001-055);
an entry is a dark "???" silhouette (`.dex-entry.locked`) until you've fought it (seen: picture, name, biome and research count only), then a
Poké Ball mark once beaten (defeated), like the games' seen / caught; everything else waits for Research complete (the
user's call 2026-09-27, `showEntry()`); tap an entry for
it blown up (`.dex-zoom`, the zoom layer). The save's `dex: { seen, defeated, done }` (old saves merge in empty) is written
by `dexSeen()` from `fight()` and `dexDefeated()` from `afterFight()` (Team Rocket's Alpha counts as its species). The
first defeat says "X's data was added to the Pokédex!" in the reward text box (`pendingCoins.dex`, after the coin
lines); defeating the last entry on a page pays its PokéCoins once (300 / 400 / 500, `done` guards it) and turns on its
perk (`DEX_PERKS`, `hasDexPerk()`): Mom's Savings (start runs with ₽50, `DEX_START_MONEY`), Chansey's Gift (start
with a Potion), Oak's Advice (once per biome a card reward gets a 🎓 Reroll button beside Skip, `showChoice({ reroll })`,
`run.rerollBiome` / `run.rerollsUsed`, saved with the run). Researching every entry on a page raises its perk to **Lv 2**
(the user's call, 2026-09-28): ₽100, a Super Potion, two rerolls a biome (`lv2` in `DEX_PERKS`; `DEX_START_MONEY` /
`DEX_START_ITEM` / `DEX_REROLLS` by level). `dexPerkLevel()` in `js/pokedex.js` works it out from the save (0 / 1 / 2), so
nothing new is saved; the page's perk box then tracks research, and the Rewards tab has a goal per page. A final-boss page completion goes in the result window (`run.dexNews`). The
Achievements window lists the three pages after the starters. Fight rooms prefer unbeaten Pokémon 2:1
(`pickEnemyId(biome, kind, dexWeight)`). The sim mirrors the perks as `cfg.dexPerks`. **Research** (step 7b, Legends: Arceus-style): the save's `dex.count: { id: n }` counts
every defeat (`countDex()`; old saves seed 1 per `defeated` id in `seedCounts()`), and each win's reward text box says
"X defeated n/3" until the entry's `RESEARCH_GOAL` (3, bosses 2, in `js/data/pokedex.js`). At the goal it's Research
complete: a gold mark (`.dex-mark.gold`, a gold tile), `RESEARCH_COINS` once (wild 50 / Alpha 100 / boss 200), and its entry
shows its type, role, flavour text, weakness, HP and each move's numbers at that biome on Level 0 (`buildEncounter()` + `moveNumbers()`, before types). Every entry
complete pays `DEX_COMPLETE_COINS` (1500) once (`dex.complete`), with a line in the result window (`run.dexComplete`,
saved with the run) and a "Pokédex complete" row in the Achievements window. `dexDefeated()` returns `{ lines, complete }`. A fourth tab, **???** (`renderMystery()`, the user's ask 2026-09-28), stands in for the Mewtwo-only fourth biome (roadmap's v1.0 plan): question-mark tiles, counted nowhere, until part B gives it real entries. A fifth tab, **Rewards** (`renderRewards()`, the user's call: easy to find), lists
the complete-Pokédex jackpot (1500 coins, Reshiram, shown as a "???" silhouette until won, the Silph Scope), research payouts and each page's perk with progress.
**Silph Scope** (`SCOPE` in `js/data/pokedex.js`, the complete Pokédex's prize): a button in the map's bottom-left corner
(`#scope-btn`, `drawMap()` in `js/run.js`; the user's call 2026-09-28: a child of `#map` kept by `renderMap()` as `.map-keep`,
sticky so a tall PC map scrolled up keeps it at the screen's bottom) with `SCOPE_REVEALS` (1) reveals a biome, +1 per level of the Game Corner's
**Scope Upgrade** (`scopeUpgrade`, 2 levels, `needsDex`: greyed out until the Pokédex is complete). Tapping it lights up
every unvisited fight / elite room (`scopeable()`, `.scope-pick`, `renderMap(..., { reveal })`); the one picked gets
`node.revealed` (saved with the map's nodes, which also counts the biome's reveals used), cries, and shows its Pokémon above
the room in colour (`.map-revealed`) with its type icon for a wild one (elites are Normal, so none). No bot run (the user's call). The
top right shows the coins (floating, no box), then the Game Corner outside a run, or
the ₽ (`#money-pill`) and the Bag during one: on `RUN_SCREENS` `showScreen()`
hides `#shop-btn`; the Game Corner is then in the Pokédex's
dock. In battle on phones ≤420px the PokéCoins
hide so the piles, ₽ and buttons fit on one row.
In battle, the draw and discard piles sit beside the Pokédex. On the map, the floor you stand on in the biome does (`#floor-tag`, the user's
call: a cream pixel staircase and "F7", outlined like the piles, shown only on `body[data-screen="map-screen"]`, set in
`showMap()`, counted like the title's Continue plate; its `title` says "Floor 7 of 10 in X, then the boss").
The dock's "Main menu" takes you to the title's gem menu from anywhere.

**Character select** (`#start-screen.select-screen`, `js/select.js`, New game; Slay the Spire's, the user's call
2026-09-28): the picked Pokémon stands big on its type's scene (`showMenuScene()`), its resting pose (`SPRITE_FIT`) scaled in
half steps to fit the stage (`sizeSprite()`), with a see-through dark panel (name in big gold pixel letters, HP, type chip,
blurb, Ability, a ✨ Shiny pill once that shiny is owned; its wins at any Level, `stats.winsBy`, as "🏆 N wins" beside the
HP, `#sel-wins`, and as a 🏆N tag on the portrait's bottom left once it has one, `.sel-thumb-wins`; the user's ask, 2026-10-01) and a strip of portraits along the bottom under two pill tabs,
**Starters** and **Legendaries** (with unlocked/total counts; Mewtwo is the last legendary). A locked portrait is a silhouette
with a 🔒, and picking it shows the silhouette big with how to get it: the achievement's text, or a 🎰 Game Corner pill
(`#sel-corner`) that opens the Game Corner on that skin; Choose is greyed out for it (and for Mewtwo while `comingSoon`).
Picking plays the cry and swaps the scene; ← → move along the strip, Enter chooses, Escape goes back. Choose turns the same
screen into the run's setup (**Prepare**, `prepare()` in `js/select.js`, StS's Ascension on its select; the user approved
a mockup 2026-09-28; the old separate deck preview screen is gone): `.preparing` hides the stats, blurb, Ability, pills and
portrait strip; `#sel-prep` in the panel shows the evolution line in a row (each form's HP and when, the evolution rules
in its `title`) and the Trainer Level as ◀ n ▶ (`setLevel()`; ← → too), the level's name, the rule it adds, a coins chip and
an "All rules" fold-out (with the next level's lock); `#sel-deck` fans the starting deck along the bottom with copies stacked
(`groupDeck`, the ×N under each card), each `zoomable()`; Choose reads Begin run (`onBegin(level)`, which confirms over a
saved run) and Back / Escape return to the portraits (`showSelect()` clears it). A Game Corner purchase refreshes it
(`refreshSelect()` on the shop's `close`). Phones stack it (Pokémon, panel, Back / Choose, tabs, strip, which scrolls
sideways); ≥900px wide it's StS's layout (the Pokémon right, the panel left, Back / Choose on the sides, the strip centred at
the bottom). The page's footer note hides here.

**Collection** (`#collection-screen`): since 2026-10-05 a red handheld device (`js/device.js`) whose home screen
(`js/collection.js`) is the owner's ID strip and a 3x3 grid of apps with their counts; CLAUDE.md's Dialogs note has the
detail. Stats' count is a plain "3 wins", since "0 of 1 runs won" read like a goal to the user. The Shop marks owned skins and maxed perks with a small Poké Ball (`ownedTag()` in `js/shop.js`).


The logo is pixel art since 2026-09-28 (the user's pick of two mockups): `js/logo.js` paints each glyph of "PokéDB"
(hand-drawn in `GLYPHS`, the "o" a Poké Ball) on its own canvas, yellow with a light and a shade band, a blue outline, a
dark rim and a hard shadow, `logoPixel()` CSS px a pixel (3-6, whole numbers, ~70% of the width); `paintLogo()` in
`js/title.js` lays them in `#title-logo`, overlapping by `EDGE`, and repaints on resize, so the letters still bounce in and
wave one by one and the ball wobbles (`.tl-ball`). No web font any more (Sniglet is gone); `.pokeball` is still the CSS
ball used elsewhere. Under `prefers-reduced-motion` the title, select and Collection skip their
animations (the gems' rise, the send-out, the fades), but not their sounds.

How to play (`#help-dialog`, `js/howto.js`) is a row of swipeable slides
(native CSS scroll-snap, plus dots, Next/Prev and arrow keys). Open it with
`openHowto()`, not `openDialog()`, so it always starts on slide 1. The coins
slide is filled from `COIN_REWARDS`, so the guide stays in step with the game
data. It deliberately doesn't list the Game Corner's perks (the user's call:
players find them there), it opens on coin ▶ slot machine (`.gc-hero`) with a "Starters" and a "Perks" row, then "Earn them". The first two slides are numbered rows
(`.howto-flow`, a picture slot then a name and one line); the turn slide
draws a small fanned hand (`.howto-hand`) rather than a real card, whose
text was too small to read at that size. Its two tips show a sample intent bubble and a copy of the top bar's Bag sprite (cloned in `initHowto()`).

