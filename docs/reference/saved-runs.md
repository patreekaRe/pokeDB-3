## Saved runs

The run in progress is checkpointed to its own localStorage key
(`pokedb.run.v1`, helpers at the bottom of `js/storage.js`) every time
`showMap()` runs, so a refresh resumes on the map before whatever room you
were in; a battle is replayed from the start, never serialised.
`checkpoint()` / `restoreRun()` in `js/run.js` store everything by id
(starter, cards, relics, unlocks) and rebuild from the data files; `mods`
is recomputed with `modsFor(level)`. The map's `floors` and `byId` share
node objects, so restore rebuilds `floors` from `byId` to keep `visited`
in sync. Every fight node gets its `enemyId` in `startBiome()` (dealt by `dealEnemies()` in `js/data/enemies.js`, floor by
floor: each room gets a Pokémon the fewest routes into it have already met, from a per-biome deck, so a route meets the same
Pokémon twice on ~2% of routes instead of ~45%, with each type's share unchanged; the user's call 2026-09-28) so a
refresh can't reroll a fight (no room names its Pokémon in its `title`, elites and the boss included, the user's call
2026-09-28; only a Silph Scope reveal does).
The save is cleared by `endRun()`, by starting a new run over it (Begin run confirms), and by the About dialog's
erase. The Pokédex dock's Main menu keeps it (`suspendRun()`, the user's call): straight from the map, and after a
confirm from anywhere else, since that room replays from the map checkpoint; `abandonRun()` is only for the run's end. Fight coins and the enemiesDefeated stat
are shown on the reward screen but only paid out as the rewards end, just
before the checkpoint, so refreshing on a reward screen can't pay twice.
The Pokédex credit (defeats, research and its coins) is saved the moment a fight is won, so `creditRoom()` in `js/run.js`
writes the room (`biome:nodeId`) into the saved run's `credited` list straight away: a refresh still replays the room
(like restarting a StS fight), but winning it again doesn't count for the Pokédex twice (the user farmed Miltank's
research by refreshing, 2026-09-28). Refreshing mid-fight to restart one you're losing is allowed on purpose (the
user's call: StS allows it too), so don't serialise battles to stop it.
A version mismatch or any bad id (deck, relics, Mart stock) silently
discards it: bump `RUN_SAVE_VERSION` when the shape changes. `route` (roadmap item 19, 2026-10-06) is the biome id taken
at each slot (`['clearing', 'ruins']`): the crossroads (`crossroads()` from `js/crossroads.js`, in `walkOn()`) adds the next slot's pick before the
journey film, and the next biome's `showMap()` checkpoints it. A run saved before it has none and is read as the default
road (`restoreRun()` rebuilds it from `BIOMES`), so it needed no version bump; a route id that isn't a biome of its slot
discards the save. A refresh at the crossroads replays the boss (the last checkpoint was before it) and asks again. The title's
Continue gem (`savedRunCard()` in `js/main.js`, drawn by `renderMenu()` in `js/title.js`) shows whenever a valid save
exists, its icon the run's Poké Ball wobbling like a catch in progress (`.cball`, the old Continue card's pixel ball, which
the user wanted back), its biome and HP on the nameplate under the gems; tapping it swings the lid open in a flash of light, and your
Pokémon comes out white, then in colour, with its cry (`sendOut()`) before the map loads. Begin run confirms before replacing a save.

