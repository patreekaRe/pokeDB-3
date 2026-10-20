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
dojo (see ? events). The Index lists it under Special. **Relic Statue** (`unique`, `event: 'ruins-idol'`, 2026-10-17): +25% prize money, only from the Ruins Idol ? room; the Index lists `event` relics under Found. Relics get keyword boxes like cards: `relicTerms()` in `js/data/relics.js` finds terms in the text
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
Casteliacone (Ice Cream: unspent PP carries over), Quick Powder (Unceasing Top; named Magnet until 2026-10-19, its id still `magnet`: Electric's held item took the name), Lum Berry (Medical Kit: status cards
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


**The balance pass (2026-10-16, branch `balance-pass`)**: 93 relics (34 new, each on a StS relic named in its comment;
art from PokéSprite). Shared: commons Wide Lens, Lava Cookie, Soothe Bell, Metal Coat, Rare Candy (`pickedUp()` in
`js/run.js`, with Cleanse Tag), Lucky Punch, Adrenaline Orb, Moomoo Milk; uncommons Sticky Barb, Lucky Egg, Power Bracer /
Power Belt (`learnedId()`: every card add goes through it), Razor Fang (`battle.fightAttacks`), Spell Tag (`battle.skills`);
rares Helix Fossil, Bright Powder, Sacred Ash (`run.ashUsed`, saved), Assault Vest, Protective Pads (both in
`hurtPlayer()`, after Helix), Lagging Tail (`battle.drawNext`), Shiny Stone. One more per archetype for each type: Fire Kee
Berry / Fire Memory / Soot Sack, Grass Macho Brace / Luminous Moss / Sachet, Water Splash Plate / Big Pearl / Tidal Bell.
**Boss relics** (13): **Choice Scarf is one now** (it was a rare with no catch and the bot's best relic for every type;
its catch is StS's Fusion Hammer: no PP Up at Centers, and it's in `ENERGY_RELICS`), **Max Mushrooms and Slowpoke Tail
too** (StS's Snecko Eye and Runic Pyramid are boss relics), plus Ability upgrades like StS's Black Blood / Ring of the
Serpent (Magmarizer: Blaze always on; Leaf Stone: Overgrow 10; Water Stone: +1 draw and Torrent 4, both raised in
`startBattle()`'s `stone`) and Shiny Charm (Black Star: a second Alpha relic). The boss pick's text says "some come with
a catch". ranks.json recalibrated (150 runs a relic a type).

**Electric's** (2026-10-19, the duo pool's Electric second session; `docs/duo-design.md` section 5): **Magnet**
(`bar-magnet`, its held item in `TYPE_RELIC`: Electric attacks +2, whoever's out), Light Ball (enemies start with 3
Static), Eject Button (4 block a switch), Zap Plate (8 block when a 3+ PP card is played), Electirizer (2 more cards next
turn after a Paralysis), Electric Memory (a Paralysis halves the Static instead of emptying it) and Thunder Stone (boss:
+1 draw, the Static Ability 4; `abilityFor()`'s `stone`). Items: Electric Gem (2 PP, Static 3) and Shock Drive (Static x2).
The sim measured them on solo Electric (150 runs each) and borrows Water's ranks for the rest (`rankCfg()`).

**Ice's** (2026-10-19, Ice's second session; `docs/duo-design.md` section 5): **Never-Melt Ice** (its held item in
`TYPE_RELIC`), Snowball (enemies start with 3 Frostbite), Safety Goggles (3 block whenever Hail hurts the enemy), Icy
Rock (a weather that starts lasts 3 more turns, `ICY_ROCK`; Snow Warning's opening Hail too), Icicle Plate (`b.icicles`
starts at 2), Ice Memory (no thaw while Hail falls) and Ice Stone (boss: +1 draw, Snow Warning's Hail 4). Items: Ice Gem
(Hail 3, 8 block) and Chill Drive (Frostbite x2). Measured on solo Ice like Electric's.

**Fighting's** (2026-10-20, Fighting's second session; `docs/duo-design.md` section 5): **Expert Belt** (`expert-belt`,
its held item in `TYPE_RELIC`: the design doc named Black Belt, but `black-belt` is the old strength relic and a badge),
Ring Target (Counter 8 on your first turn), Focus Band (3 block whenever a Follow-up happens), Protector (every Counter
you gain +2, in `gainCounter()`), Weakness Policy (3 block whenever a status card is exhausted), Fighting Memory (your
Counter halves at your turn's start instead of going) and Fightinium Z (boss: +1 draw, Guts +6; `abilityFor()`'s
`stone`). Items: Fighting Gem (8 block, Counter 8) and Red Card (Counter x2; there's no Fighting Drive). Measured on solo
Fighting like Electric's.

**Ground's** (2026-10-20, Ground's second session; `docs/duo-design.md` section 5): **Soft Sand** (`soft-sand`, its held
item in `TYPE_RELIC`), Earth Plate (the enemy starts each battle with Fault 6, set on the enemy in `startBattle()`), Light
Clay (2 block whenever you apply Fault, in `applyFault()`), Shuca Berry (3 block whenever a card goes underground), Smooth
Rock (a Sandstorm lasts 3 more turns when it starts, in `setWeather()`, beside Icy Rock), Ground Memory (Alphas and bosses
count all their Fault, in `faultLine()`) and Groundium Z (boss: +1 draw, Sturdy twice a fight; `abilityFor()`'s `stone`).
Items: Ground Gem (8 block, Fault 8) and Terrain Extender (Fault x2; there's no Ground Drive). Measured on solo Ground like
Fighting's.

**Flying's** (2026-10-20, Flying's second session; `docs/duo-design.md` section 5): **Sharp Beak** (`sharp-beak`, its held
item in `TYPE_RELIC`), Sky Plate (start each battle with Tailwind 2, set in `startBattle()`; the first turn's draw spends
one), Pretty Wing (2 block whenever you gain Evasion, in `gainEvasion()`), Coba Berry (3 block whenever an Unburden
happens, in `resolveCard()`), Air Balloon (Evasion 2 at the first turn's start), Flying Memory (Evasion halves at your
turn's start instead of going, in `beginPlayerTurn()`) and Flyinium Z (boss: +1 draw, Keen Eye draws 2; `abilityFor()`'s
`stone`). Items: Flying Gem (8 block, Evasion 2) and Swift Wing (Tailwind 3, draw 2; there's no Flying Drive). Measured on
solo Flying like Ground's.
