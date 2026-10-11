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
two-tap "Buy ₽N" confirm. `layout: 'mart-window'` is a plain grid of the wares, hidden under the 3D Mart below and only seen if Three.js won't load (the pixel Mart scene, its painted room, Kecleon, hanging signs and props, was deleted 2026-10-10, the user's call: it slowed the walk in).
Removal (the PC on Kecleon's counter) reuses `forgetMove(martRoom, pay)`, so backing out of the picker costs nothing; it can be
bought once per Mart (`stock.removed`, then the PC says "Sold out"). Every forget picker
(Center, Mart, Cleanse Tag, events) takes two taps, like adding a card: `ask`/`confirm` "Forget it".
Purchases are only saved when you leave for the map. Items are covered
under Items below.


**The walk-in 3D Mart** (`js/mart-3d.js`, 2026-10-09, live on `main` since 2026-10-10, the user's ask after the 3D Center): `mart3d()` in
`js/run.js` lays a 3D room under the shop `martRoom()` just showed, which keeps its choices (hidden: `.m3d`), the two-tap Buy
(the focus over the room and its gold pill) and the text box. HeartGold / SoulSilver's Mart: white walls over a blue wainscot,
bunting, POKé MART on a blue sign, pale blue tiles with a runner to the door. The wares stand on two wall units (the user's
ask, 2026-10-09: the cards were lost among the items under them, and looked black on their phone): MOVES in the middle, the
cards on easels along its top (`cardArt()` paints `.card.small` on a canvas: cost, name, rarity, art; unlit,
`MeshBasicMaterial`, so no light or shadow darkens them; a sheen sweeps across them), and ITEMS on the right (`ITEMS`,
`buildItems()`), the items on its top; the relics under glass domes on a RELICS table of their own on the floor in front of
it (`TABLE`, `buildTable()`; the user's ask, 2026-10-09, with the gondola of goods moved to the left wall). Each ware's
price stands over it, big, tilted to the camera (red when too dear, SOLD OUT once bought): a white pill with a ₽ coin,
`tagArt()`. The MOVES / ITEMS / RELICS signs are glossy blue pills with an emblem each, the wall ones tipped to the camera
(`header()` / `emblem()`; bigger and cleaner since 2026-10-10, the user's ask). The camera starts centred on the
door and follows your Pokémon (it began leaning right, the user's call); a phone's shot is `ACROSS` 8.8 tiles, then brought in to `ZOOM` 0.7 of that distance (0.6 on 2026-10-09, the user's ask: much closer; eased to 0.7 on 2026-10-10 as the right side was hard to see). Since 2026-10-10 the camera follows your Pokémon all the way (it was 0.6 of its x) and a sideways drag looks along the room (`look`, `onDown()` / `onMove()`, a drag swallowing its click; walking brings it back). The wares'
PNGs load with `crossOrigin` (githack can serve them from its CDN's domain, which taints the canvas so WebGL uploads it
blank: on the user's phone every card and sprite was missing). Kecleon stands behind a
blue counter on the left with the PC on it (its "Forget ₽N" sign, `.mart3d-sign`). A tap on a ware walks your Pokémon up
and presses its choice (a greyed one says why in the text box); a bought ware flies into your Pokémon as the shop redraws;
the doormat presses Leave. `preloadMart()` (from `warmMart3d()` in `js/run.js`) builds it while the map is up, with your Pokémon and every Mart's wares painted ahead; the room shows at once, no fade, and its shelves fill as their pictures are ready, all painted in parallel (`paintAll()`; 2026-10-10, the user saw a blank blue screen while they loaded one by one). `?mart` (`&starter=id`, `&money=N`) walks a
throwaway run straight into one (`peekMart()`).
