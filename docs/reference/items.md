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
calls). Since 2026-10-14 (the user's call) the ball has no "Open" sign over it and the screen has no text box to tap
through: once the item rises, a window under it (`.swap-found`) says what it does (and, with a full Bag, to tap one of
yours), the same for Chansey's Gift. Nothing heals through Big Root or boosts block through
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


## Held berries (2026-10-15, the user's ask)

Like the games' held items: your Pokémon holds at most one at a time, `run.held = { id, used }`, packed from Kurt's
Workshop before the run (docs/reference/towns.md's Kurt's Workshop: the Held berries shelf and Pack); a Run kit item packed
the same way is just an item in `run.items` from the start. `HELD` in `js/data/held.js` (pure, `tests/held.test.mjs`): each
goes off by itself once, in battle, and is then eaten (`heldFires()` says when, `heldGoes()` in `js/battle.js` does it):
- **Oran Berry**: the first time your HP is below half after losing some, heal 10.
- **Sitrus Berry**: the same moment, heal 25% of max HP.
- **Cheri Berry**: the first time one loss takes 10 or more HP (after Block), +2 strength for the fight.
- **Pecha Berry**: the first time an enemy puts Poison in your deck, every Poison card (hand and piles) is thrown out and
  no more lands that fight (`battle.shut`; the move's pop says "No Poison!", its line "The Poison didn't take").
- **Lum Berry**: the first time an enemy puts any status card in your deck (Confusion, Paralysis, Poison, Sludge: the only
  debuffs the player gets), every status card in your hand and piles is thrown out. (Not the Lum Berry relic, which makes
  status cards playable.)
"Hurt" is checked in `hurtPlayer()` (after Revive and the lifelines, so a revived Pokémon below half eats an Oran) and in
`loseHp()`; "status" after `move.adds` in `enemyTurn()`. Heals go through `healPlayer()`. On going off: a pop with its name,
`statFx()` (so `battleFx()` off skips the glow) and `heal-hp`; its line rides on the hit's (`b.revived`, `withRevive()`) or
is added to the line shown (`logMore()`). `battle.held` *is* `run.held`, so it stays eaten, and a refresh replays the fight
from the map's checkpoint with it uneaten, like items. Saved with the run (`held`); a run saved before has none, and an
unknown id is dropped rather than discarding the save (no version bump). The Bag's Items pocket opens on a "Held:" line
(`heldRow()` in `js/run.js`), "(eaten)" once it's gone. **The Berry Pouch** (2026-10-15, the user's approved design: one held berry a biome):
up to `POUCH` (3) packed, the first held as the run sets out (`setOut()`, so a one-berry pouch plays as before), the rest in
`run.pouch` (ids). The Bag lists them under the Held line, each with Hold (`holdBerry()` -> `holdFromPouch()`), on the map
only, never in battle or on a reward screen: while the held one is uneaten, Hold swaps them (it goes back in that berry's
place); once one's eaten, `heldGoes()` sets `run.heldAte` to `run.biome` (through `battle.ate()`), and `canHold()` keeps the
next off till `run.biome` is past it, the buttons greyed under "Your next berry can go on in the next biome". A Hold is
saved at once (`afterBagChange()`, Toss's way). `pouch` and `heldAte` are saved with the run; missing reads as empty / none. **First-time tips** (2026-10-16, the user's ask), each once a save, flagged in
`save.workshop.told` as it shows (`toldHeld()` / `tellHeld()` in `js/held-tips.js`; under `?satchel` once a page load, never
saved): `held`, Kurt slides in (`gymTalk()`, APRICORN SMITH) after the forge of your first held berry with
`CLEARING.homes.workshop.heldTalk` in `js/data/towns.js` (the bench closes while he talks and comes back as it was); `kit`, the same
after your first run kit item, with `kitTalk` (make as many as you like, take one a run, it starts in your Bag and stays behind
when the run ends);
`eaten`, the first berry eaten in battle puts a tap-or-wait LCD note over the fight (`heldTip()` in `js/battle.js`, `.held-tip`,
7 s, no animation under `calmFx()`): "<Mon> ate its <Berry>! You can put on another from your Bag in the next biome." (or
"Pack more in your Berry Pouch next run." with the pouch empty); `pouch`, the first map where `nextBerryReady()` (js/data/held.js)
says the next can go on queues "A new biome! Open your Bag's Items to put on your next berry from the Berry Pouch." with the
map's notes (`noteLater()` in `js/rewards.js`, `berryNote()` in `js/run.js`) and pulses the dock's Items key three times
(`.berry-pulse`, not under `calmFx()`). The sim mirrors it (`cfg.held`, a list for a pouch refilled at each biome's start, `heldGoes()` in `sim/engine.js`);
no bot numbers (the user's call: none needed). Cheri and Pecha's sprites are PokéSprite's, like the rest.

## In the Index

An item counts as found (`save.seen.items`, the Collection's Items app) once it is in the Bag, used or not (the user's call, 2026-10-06: a Revive carried twice and never used stayed ???). `checkpoint()` in `js/run.js` marks the Bag at every map, `endRun()` marks whatever the last rewards added, and using one in battle or on the map still marks it.

**The balance pass (2026-10-16, branch `balance-pass`)**: 34 items (14 new, each on a StS potion): Hyper Potion (heal
40, map), Full Heal (`cleanse`: every status card, then draw 1), Iron (`blockBonus`: `battle.blockBonus` in `cardBlock()`),
Zinc / Carbos / Rage Candy Bar / Sweet Heart (`power`: a POWERS key for the fight, badge and all; Sweet Heart's `regen`
skips Big Root), Elixir, Iron Ball (`hit` 12), Gold Bottle Cap (`echo`), TR / HM (`discover` with `kind` 'power' /
'skill'), Revival Herb (`recall`, from the discard pile) and Wishing Piece (`fill`, on the map too; `startBattle()` gets the
Bag's size as `slots`; none under Dusk Stone). The sim's `ITEM_VALUE` has a number for each.
