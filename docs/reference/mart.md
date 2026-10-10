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
two-tap "Buy ₽N" confirm. `layout: 'mart-window'` lays the Mart out like a Zelda shop
(the user's sketch), the same at every screen size, with no window: behind a glass
counter (the grid's `::after`, bare: the user found items on it odd; Leave sits on the floor
just above the text box) stands one
grey pixel shelf unit (hard-edged gradient bands for depth, a strip light under each
board, a Mart-blue crown with a Poké Ball, and big swinging Bag-pocket `.shelf-sign`s over
the items and relics shelves, added by `martRoom()`: an icon, outlined pixel letters), all the moves on
the top shelf as `.card.small` thumbnails (a pixel shine sweeps across them; the tap
blows up a full card, `option.zoom`), the items on the next shelf and the relics under
them in the gaps, a 3-2 pyramid, as bobbing bare icons with plain printed prices (no
tag boxes). Kecleon (2x, flipped to face the shelves; it cries as you come in, `enterNode()`) stands at the counter's left end,
and forgetting a move is the 💻 PC on its right (`martPc()`, under the Center's bouncing
`.center-label` sign, which shows the price: "Forget 💴50"). (Not `.mart`: that's the top bar's Mart icon.)
The room is its own indoor scene (`PLACE_ART.mart`, after the Gen 3 Marts): teal-banded
white walls with pennant bunting and hanging lamps (glow, flicker, drifting dust), and on
wider screens a window (clouds, a passing bird), crates, a SALE poster and a cork board;
green octagon tiles, and two blue bins heaped with Poké/Great/Ultra/Master Balls
(`ballBin()`) with the plants: beside the counter's ends where there's room; a phone's
counter spans the screen, so there `martProps()` paints them as little images
(`paintProp()`) that `.mart-props` stands in front of its foot (the user wanted nothing
scattered on the floor, and nothing hidden behind the counter).
It's barely dimmed, and its floor line follows the counter's foot and its plants its ends
(`showPlaceScene('mart', { floor, span })`), so the shop stands on the tiles instead of
floating (the user's calls; no fridges, no tiny clock or posters).
Removal reuses
`forgetMove(martRoom, pay)`, so backing out of the picker costs nothing; it can be
bought once per Mart (`stock.removed`, then the PC says "Sold out"). Every forget picker
(Center, Mart, Cleanse Tag, events) takes two taps, like adding a card: `ask`/`confirm` "Forget it".
On a short window (a 1280x800 PC, an iPhone SE) `fitMart()` in `js/run.js` zooms the shop out (CSS `zoom`, a binary
search down to 0.6) until Leave and the text box fit without scrolling; it reruns on resize and as the text box grows. `showChoice()` clears that zoom for
the next screen: left on `#reward-options`, it pulled the Center's Chansey and signs (and events' spots, all `position: fixed`) towards the top left.
Purchases are only saved when you leave for the map. Items are covered
under Items below.


**The walk-in 3D Mart** (`js/mart-3d.js`, branch `pokemart-3d`, 2026-10-09, the user's ask after the 3D Center): `mart3d()` in
`js/run.js` lays a 3D room under the shop `martRoom()` just showed, which keeps its choices (hidden: `.m3d`), the two-tap Buy
(the focus over the room and its gold pill) and the text box. HeartGold / SoulSilver's Mart: white walls over a blue wainscot,
bunting, POKé MART on a blue sign, pale blue tiles with a runner to the door. Every ware stands on one wall unit (the pixel
Mart's shelf, so a phone sees all of it at once): the moves on easels along a lit shelf at eye level (`cardArt()` paints
`.card.small` on a canvas: cost, name, rarity, art; a sheen sweeps across them), the items then the relics (under glass domes)
on the cabinet under it, each with a shelf-edge price tag (red when too dear, SOLD OUT once bought). Kecleon stands behind a
blue counter on the left with the PC on it (its "Forget ₽N" sign, `.mart3d-sign`). A tap on a ware walks your Pokémon up
and presses its choice (a greyed one says why in the text box); a bought ware flies into your Pokémon as the shop redraws;
the doormat presses Leave. `warmMart()` builds it while the map is up. `?mart` (`&starter=id`, `&money=N`) walks a
throwaway run straight into one (`peekMart()`), `&mart2d` the pixel shop.
