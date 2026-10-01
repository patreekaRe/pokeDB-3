## Items

One-use items (Slay the Spire's potions) in `js/data/items.js`: `effects`
keys (heal, block, strength, focus, energy, draw, guard, burn, flee, and since 6c.11b weaken / vulnerable / seed
through `applyDebuff()`, `burnMult`, `tide` through `gainTide()`, `maxHp`, `discover`, `revive`), a
`rarity` (common / uncommon / rare: drop/stock weight in `ITEM_WEIGHTS`, Mart price in
`MART_ITEM_PRICES`), `only` for a type's Gem or archetype item, and `map: true` for items
usable outside battle (heals, and HP Up). 20 items since 6c.11b, each new one on a StS potion (in a comment):
Black Flute (Weak Potion), X Accuracy (Fear Potion), TM (Attack Potion: `discoverCard()` lays 3 random cards of
your type out with `pickFromPile()`, the one taken is free this turn via `discount` + `orig`), HP Up (Fruit Juice,
+5 max HP; `onEnd` passes `maxHp` on a flee too), Revive (Fairy in a Bottle: can't be used, `whyNotUsable()` says so;
`hurtPlayer()` calls `revive()` when you'd faint, which takes it out of the Bag, sets 30% HP and adds its news to the
hit's log line via `withRevive()`), and one per type for an archetype: Fire's Burn Drive (Catalyst, doubles Burn),
Grass's Absorb Bulb (Leech Seed 4), Water's Fresh Water (5 Tide). They reuse emoji already in `ICONS`.
The same step's catch-up: Dive blocks 9 and Flame Body 10 (human bot fire / grass / water, 400 runs: L0 ~80 / 74-78 / 72,
L3 58 / 56 / 56, L5 29 / 34 / 32; details in the roadmap's 6c.11b). The run holds at most `ITEM_SLOTS` (3) ids in
`run.items`, saved by id with `run.itemChance` (a bad id discards the save).
Sources: 3 per Mart (`node.stock.items`, rolled in `startBiome()`, greyed
out with a full Bag), and after every won fight except the final boss a
StS-style drop (`ITEM_DROP`: 40%, −10% after a drop, +10% after a miss),
shown as a last reward step by `offerItem()`: it first lies in a round pixel Poké Ball in the middle of the screen
(the user's call, like the games' item balls; `itemBallArt()` in `js/scene.js` paints its two halves, a Poké / Great /
Ultra Ball per biome), which hops like the treasure chest; a tap wobbles it (`chestWobble`), then `ball-open` plays, the
top half pops off in a flash with the chest's rays, and the item rises out where it was (`.float-stage.sealed` →
`.open`; Skip works throughout). Then no tiles: the item floats like a treasure relic
(`floatingThing()`, tap it then Put in Bag, and `flyToBag()` shrinks it into the Bag); with a full Bag your items
float in a row under it, and the one you tap to toss greys out under a red pixel ✕ before you Swap, with two little boxes above Swap saying what
each does ("Toss: X" in red, "Take: Y" in green; `swapTip()`, `.swap-tips`; the user's QoL call, 2026-09-28) (the user's
calls). Nothing heals through Big Root or boosts block through
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
chain, except Toss in the Mart (to make room for a buy: it re-renders the Mart, saved with the purchases). The bot harness mirrors all of this (`applyItem`, `useItems`,
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
Roster balance pass (2026-09-26, after the new 54 Pokémon; the user found Fire
easy): the human bot was back up to L0 ~83%, and biome 1 was a coin flip for
Grass/Water at Levels 3-5 (Alpha elites out-HP'd the boss) while Fire walked
it. Now `dmgBonus` 6/14/24, `bossBonus` 7/19/30, Elite Territory +15% HP
(was 30), Fierce Bosses +10% HP (was 20), Cotton Guard 8 (9 since the 2026-09-28 catch-up, with Bubble Weak 2), Dive 9, and the
outliers evened within each biome (Arcanine, Flareon, Gyarados and Salamence
softer; Gloom and Ursaring harder; since 6c.10 those slots are Kangaskhan, Linoone,
Lickilicky, Porygon-Z and Raticate, same numbers). Human bot fire / grass / water: L0
74 / 76 / 76, L3 59 / 56 / 65, L5 36 / 33 / 39; strong bot L0 79 / 89 / 88,
L5 53 / 51 / 51. Fire still dies mostly to biome 3 bosses (it's strong early,
thin late), Grass/Water mostly in biome 1 at higher Levels. A +1/+2 block on
a starting card moved a type 5-20 points here too.
Card engine (6c.2, 2026-09-26): PP Up and the Abilities made the human bot
~12 points stronger (L0 69 / 78 / 71 -> 83 / 88 / 82; Overgrow at 5 HP alone
was +10-22 for Grass), so Overgrow heals 3 and biome `dmgBonus` / `bossBonus`
went +1/+2/+3 (now 7/16/27 and 8/21/33). Human bot fire / grass / water, 300
runs/cell: L0 70 / 77 / 76, L3 56 / 57 / 61, L5 34 / 34 / 33 (before, 400
runs: L0 69 / 78 / 71, L3 60 / 62 / 64, L5 37 / 32 / 38).

