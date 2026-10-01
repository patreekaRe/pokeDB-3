## Treasure room

`treasureRoom()` in `js/run.js` has no tiles (the user's call: immersive, relics floating
with no borders). It shows `PLACE_ART.treasure` (`showPlaceScene('treasure', { biome })`):
a grotto with a shaft of light through a hole in the roof onto a stone dais, Voronoi-faceted
rock, crystals, stalactites, gold spilled round the dais. Its look comes per biome from the
art's `biomes` (the pattern for the planned event scenes: outdoor ones tint per biome):
Clearing mossy with blue crystals and drips, Shrine rose quartz with wisps, Wastes obsidian
with glowing veins and embers. The chest is Pokémon-style (the user's call): a Poké / Great /
Ultra Ball per biome (`BALL_CHEST` + each biome's `lid`), its button the latch, painted by
`chestLid()` / `chestOpenLid()` / `chestBody()` in `js/scene.js` and handed to the page as
images by `treasureChest()`. `placeTreasure()` stands it on the dais (`treasureSpots()`, in
the scene's own pixel size `--px`) and reruns on `scenepaint`. Tap: it hops, wobbles three
times like a Poké Ball, pops open (`ball-open`, a flash, rays), and the relics
(`relicChoices()`) arc up out of it to float in a row. A tap picks one (its text in the text
box, its name under it, a Take it button); tapping it again or Take it flies it into the Bag
(`item-get`), then `gainRelic()`. Leave is hidden with `visibility` meanwhile (`showChoice()`
resets it) so the text box doesn't jump.

