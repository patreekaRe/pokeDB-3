## Relics

`js/data/relics.js` (58 relics since 6c.11a); effects are applied where `hasRelic()` appears in
`js/battle.js` (Cleanse Tag, Choice Band, Amulet Coin and Big Malasada act in `js/run.js`). Every relic's art is
`assets/items/<id>.png` (PokéSprite), and each one from 6c.11a names its Slay the Spire model in a comment.
Fields: `only` = one type's starters; `rarity` = StS's tiers, 'common' / 'uncommon' / 'rare' (replaced the old
`rare` flag): each relic `relicChoices(run, { boss, source })` in `js/rewards.js` offers rolls a tier by
`RELIC_ODDS[source]` ('normal' 50/33/17 like StS; 'elite' 35/40/25 after an elite or Team Rocket; 'treasure'
20/50/30), falling to the next tier up (then down) when one is empty; the Mart prices relics by tier
(`MART_RELIC_PRICES`) and the Starting Relic Charm never gives a rare. `boss` = only offered after a boss (normal
ones once you own them all), never anywhere else. Six boss relics each give +1 PP with a catch (`ENERGY_RELICS`):
Choice Band (no Rest), Choice Specs (draw 1 fewer), Toxic Orb (lose 1 HP a turn, never below 1), Room Service
(StS's Velvet Choker: 6 cards a turn, `ROOM_SERVICE_CAP`), Griseous Orb (Mark of Pain: 2 Sludge shuffled
into every fight's draw pile, `startBattle()`), Dusk Stone (Sozu: no new items; drops, the Item Ball (a relic instead), the
Fan Club (₽ instead) and the Mart check it). Until 2026-09-30 they were Philosopher's Stone and Runic Dome; the user disliked
the hidden intent. **Mata-Mindset** (`unique: true`, 2026-10-01): +1 PP and +1 card every turn (each turn's draw shouts FORTIFY YOUR MIND with a "🎓 +1 card" pop, the user's call) and 1 strength at each battle's start; never
offered (`relicChoices()` and the Starting Relic Charm skip `unique`), only won by beating Chad Master Kenmatta in his
dojo (see ? events). The Index lists it under Special. Relics get keyword boxes like cards: `relicTerms()` in `js/data/relics.js` finds terms in the text
(the words are `TERMS` in `js/data/cards.js`, shared with `cardTerms()`), shown as lines under the tile (`relicTips()`,
`makeRelic(relic, { tips: true })`: rewards, the Index, the Bag) or extra text box lines (`relicLines()`: treasure,
floating relic rewards, the Shrine). Each type has 8 relics: its +2
damage one plus two per archetype, one of them a rule-changer (Fire: Tamato Berry +2 per Burn (`burnEnemy()`), Spelon Berry half
the Burn again at your turn's start, Black Sludge +3 per attack for 1 HP on the turn's first (`battle.sludged`), Salac Berry = Runic
Cube (draws on every HP loss, in `markHurt()`), Dawn Stone = Dead Branch, Smoke-Poke Tail = Charon's Ashes (4); Grass: Protein = Shuriken, Muscle
Wing +1 to every strength gain, Gooey Mulch 2 Leech Seed at the start, Enigma Berry (heals hit the enemy), Max
Mushrooms = Snecko Eye (a drawn card is a copy costing 0-3 with `orig`, so `settled()` restores it; `makeCard()` compares against `orig.cost`, so a roll shows green when cheaper, red when dearer), Toxic Plate =
Champion Belt; Water: Blue Flute +1 Tide a turn, Lustrous Orb (spending Tide leaves half), Eviolite 3 block every turn (Orichalcum never fired: Water nearly always has block),
Everstone = Calipers (block drops by 10), Slowpoke Tail = Runic Pyramid, Heart Scale = Tough Bandages). Any type:
Casteliacone (Ice Cream: unspent PP carries over), Magnet (Unceasing Top), Lum Berry (Medical Kit: status cards
cost 0, exhaust and draw a card, `lumCures()`; in battle they read that way too, 0 PP "Draw 1 card. Exhaust.", via
`asShown()` in `js/battle.js`, a display-only copy for the hand, risen card, piles and boxes), Strange Souvenir (a free random card of your type on turn 1), Fist Plate
(Ornamental Fan), Dragon Fang (Akabeko, +10: `battle.firstAttack`), Big Malasada (Meal Ticket: heal 15 entering a Mart,
in `enterNode()`), Lemonade (Lantern), Stone Plate (Horn Cleat). Relic damage that can end a fight off your turn
(Smoke-Poke Tail on an Ethereal card, Enigma Berry off a Potion) is checked in
`endTurn()` / `useItem()`. Healing from Big Root only boosts card and power heals, not other relics.
Relics carry runs here (with none, even the strong bot wins ~10% at Level 0), so the pool's average value is a big
balance knob: adding 30 middling relics first cost Fire 18 points at Level 3 (fewer Leftovers / Shell Bell / Heat Rock
offers). After the retune (see roadmap 6c.11a), human bot fire / grass / water: L0 71 / 79 / 73, L3 52 / 56 / 51, L5
27 / 29 / 26. Recalibrate `sim/ranks.json` after any relic change (`calibrateJobs(n, [ids])` measures just those).

