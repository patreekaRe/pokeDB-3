# Cards, card pools, upgrades and types

Moved out of CLAUDE.md on 2026-10-14 so every session loads less; the text is unchanged. Dates are when each call was made: where two notes disagree, the later one wins.

- **Card art** (2026-10-12, the user's yes, by batches): a card's picture is smooth SVG from `ART` in `js/card-art.js` (keyed by base id, a picture of the move itself) when it has a line there, else its PokéSprite item (`sprite`); `tools/cards.html` shows them all, `?pixelcards` the old art. A new card gets an `ART` line.
- **Cards** (`js/data/cards.js`): every effect is a key in a card's
  `effects` (the header comment lists them all) and `describe()` writes
  the card text from them, so new mechanics need a line there too. Beyond
  damage/block/heal there are multi-hits (`hits`), player `strength`,
  `power: true` cards whose `POWERS` keys (played with a Power Lens pop-up in
the starter's colour, `POWER_LENS`) (block/heal/burn/strength/draw
  each turn, thorns, blaze) stay on all fight as nameplate badges,
  `retain`, `exhaust`, `selfDamage`, `blockDamage` and `bonusPerBurn`.
  Power, exhaust and retain cards carry a bold "Power." / "Exhaust." / "Retain." keyword
  (`keywords()` in `js/data/cards.js`, drawn by `makeCard()`, with a
  `title` explaining it); powers leave the fight once played, like StS.
  **Keyword boxes** (StS's): `cardTerms(card)` in `js/data/cards.js` lists every term a card uses as
  `[label, text]` (its keywords, then Tide, Burn, Leech Seed, Weak, Vulnerable, Sap, Strength, Focus, Discard, X,
  Combo... found by regex over its effect keys, nested ones too), and `termTips()` is the same minus the
  keywords, for the text's `title`. `cardTips()` / `withTips()` in `js/ui.js` draw them as little parchment
  windows beside any blown-up card: battle's risen card (`placeTips()` in `js/battle.js`: beside it on
  whichever side has 190px, else stacked over it, with taps passing through), `zoomCard()`, the reward /
  Mart focus (`openFocus()`) and the pile picker (`pickFromPile()`: since 2026-10-03 a first tap picks a card and shows its boxes and the take button under the row, a second takes it); on phones (`.tip-row`, ≤720px) they stack under the card, which shrinks by
  `--tips`; wider, they hang off the card's right side (absolute), so the card itself stays centred over its button. A new mechanic only needs a line in `cardTerms()`; every term with a box is
  coloured in the card's own text and on its box's name (`colourTerms()` / `TERM_KIND` in `js/ui.js`, `.term-*` in
  `css/cards.css`: Burn orange-red, Tide blue, Leech Seed green, debuffs purple, Strength red, the rest keyword gold; StS 2's,
  the user's pick 2026-09-28); keep each box's text short (~55 characters,
  the user's call 2026-09-28: "Burn: Damage each enemy turn, then -1."), longer only when short stops explaining it: Tide says
  what it is and what spending it does (the user couldn't tell from "Builds up all fight"). Block, Draw and Heal get no box:
  their words say it (the user's call). A card that makes cards (`addCard`, however nested) gets a box per made card with its cost,
  keywords and text (`addedCards()` / `madeCardText()`: Rage, Paralysis, Poison, Cinder...; Rage's says it's a copy of itself).
  Each gameplay type has three archetypes (docs/card-design.md): Fire Burn / Reckless / Kindling, Grass Growth /
  Drain / Spores, Water Tsunami / Shell / Flow, Psychic Force / Barrier / Mind Games.
  Psychic (Part A, 2026-09-29): 20 common / 26 uncommon / 14 rare + 8 evolution cards; Psychic is neutral both ways and
  all cards use existing mechanics. Keep Mewtwo's type and all 68 cards masked as `???` in player-facing selection and
  the Index until the starter is unlocked. Mewtwo's Pressure starts each fight with 2 Focus.
  Water rework (2026-09-26, the user found Water bland): **Tide** is Water's
  "build up, cash in" resource, `battle.tide`, shown as a 🌊 nameplate badge and
  lasting all fight. `tide: N` cards build it (Bubble, Dive, Rain Dance, Surf,
  Origin Pulse); `perTide: N` cards add N damage per Tide, then spend it all
  (Water Pulse, retained so you can hold it until the Tide is high, replaces a
  Water Gun in the starting deck; Hydro Pump, now 2 cost; Brine). `makeCard()`
  explains Tide in the text's `title`. Shell Armor (rare power, StS's Barricade)
  is `keepBlock`: `beginPlayerTurn()` keeps your block instead of zeroing it, so
  Razor Shell builds are worth aiming for; a `POWERS` entry with `flag: true`
  shows its badge without a number. Withdraw deliberately builds no Tide: 4 of
  them made Water win ~95% at Level 3 in the bot, and Tide on Bubble made the bot
  hoard Bubbles until it dropped to 5 damage (Rain Dance to 4 block). After (human
  bot, 600 runs/cell) fire / grass / water: L0 66 / 77 / 78, L3 61 / 57 / 67,
  L5 35 / 37 / 41; Water was 76 / 65 / 39 before, so it stays level.
  StS revamp (2026-09-26, the user's call: "more like StS"): every card is
  modelled on a Slay the Spire 1 card (named in a comment on its line) at
  StS's numbers x~1.2 (Strike 6 -> 7, Defend 5 -> 6), keeping StS's price
  per energy. Starting decks are StS-shaped: 4 attacks, 4 blocks, 2
  signature cards (Fire: Scorch = Bash + Will-O-Wisp; Grass: Seed Bomb =
  Bash + Absorb, one of its blocks a Cotton Guard; Water: Bubble + Dive =
  Shrug It Off, one of its attacks a Water Pulse), no Tailwind. `weaken: N` is StS's Weak (enemy deals 25%
  less for N enemy turns, `WEAK_MULT`) and `vulnerable: N` its Vulnerable
  (your attacks deal 50% more, `VULNERABLE_MULT`); both tick down at the end
  of each enemy turn (`enemy.weak` / `enemy.vulnerable` in `js/battle.js`),
  and `makeCard()` puts an explaining `title` on the text. Enemy numbers
  were retuned around the cards (biome `dmgBonus` 4/11/22, `bossBonus`
  5/16/28, `hpMult` 1.2/2.9/5.2; Fierce Bosses +2 damage, not +4), then
  again over the new 54-Pokémon roster (2026-09-26, see Items below). Fire
  has the fewest defensive cards, so its Defend (Flame Wall) blocks 8 and
  its Flame Barrier (Burning Bulwark) is 1 cost; without that Fire trailed
  the others by 15-30 points.
  Card-pool review (bot harness, 2026-09-24): as one extra copy in the
  starting deck, block, Weaken, healing and powers raise win rates and big
  attacks lower them (Flare Blitz, Fire Blast, Solar Beam: −15 to −30
  points), since a turn spent without defending costs more HP than it saves.
  So check defensive numbers first: +1 or +2 block on a starting card moves
  a type 10–30 points at Level 5. Don't remove a card id:
  a saved run holding it would be discarded.
  **Card pool expansion (roadmap 6c)**: `docs/card-design.md` is the plan (12 archetypes, ~70 cards a
  type, each on a StS card); the user approved it (2026-09-26); its Decisions section settles the open questions. The engine for it
  landed first (6c.2), all in `js/battle.js` and described by `describe()` (the header of
  `js/data/cards.js` lists every key): X cost (`cost: 'X'` + `perX`, `xPlus`), `discard` / `exhaustPick`
  (the hand glows and one tap picks, `pickFromHand()`; no more cards than asked takes them all),
  `onDiscard` / `onExhaust` (only a card's discard counts, not the end of turn, like StS), exhaust and
  discard powers (`exhaustBlock`, `exhaustDraw`, `discardTide`, `discardBlock`), played-this-turn
  (`battle.played` / `attacks` / `discarded`: `perPlayed`, `hitsPerAttack`, `perDiscard`,
  `combo: { at, ... }`, powers `cardDamage` / `cardBlock`), `addCard: { id, n, to }`, keywords
  `unplayable` / `ethereal` / `innate` (bold via `keywords()`; `termTips()` explains terms in the text's
  `title`), a 10-card hand cap (`MAX_HAND`: draws stop, made cards go to the discard pile). Played cards
  now reach their pile *after* resolving (their own draw can't reshuffle them), and every exhaust goes
  through `exhaustCard()` (so Eject Pack also fires for ethereal and picked exhausts). `TOKEN_CARDS`
  (Cinder, Seedling, Droplet) and `STATUS_CARDS` (Confusion, Paralysis, Poison, Sludge: grey `.status`
  cards) are in `CARDS_BY_ID` only, never in `ALL_CARDS`, so they're never offered or indexed. Enemy
  moves can carry `adds: { card, n, to }` (default the discard pile), or be `kind: 'status'` (only
  that; a grey intent bubble; on an attack the junk card's icon follows the move name). Enemies using them since 6c.9
  are listed in the doc's Status cards table (Psyduck, Oddish, Alpha Raticate, Snorlax, Slowpoke, Shellos, Stantler, Alpha
  Watchog, Exploud, Tangela, Tauros).
  **Fire's pool (6c.3, 2026-09-26)**: 20 common / 32 uncommon / 14 rare + 8 evolution cards, each with its StS
  model in a comment and a hand-picked `upgrade` (the doc's Fire section lists them and what changed). Fire's
  mechanics, all in `js/battle.js` with `describe()` lines: `burnTimes`, `burnMult` (Catalyst), power `drought`
  (every Burn a card applies +N, via `burnEnemy()`), `ifBurned` / `ifHurt` (`{ bonus, ...effects }` merged in by
  `effectsOf()` as the card is played), `costDownOnHurt` (Mind Blown), `exhaustHand: 'all' | 'skills'` with
  `perExhausted` / `hitsPerExhausted` / `blockPerExhausted` (resolved before the damage), `playTop` (Wildfire, StS's
  Havoc: `resolveCard()` plays the top card free and exhausts it), `exhume` (Fusion Flare: `pickFromPile()` lays the
  exhaust pile over the dimmed battle, `.pile-pick`; two taps, like TM's picker), `healDealt`, powers `rupture`, `combust` (end of your turn,
  in `endTurn()`), `brutality`, `corruption` (Blue Flare: `costOf()` makes non-attacks 0 and `resolveCard()`
  exhausts them), `cinderDamage`, `exhaustBurn`. `loseHp()` is every self-inflicted HP loss (Raging Fury triggers
  on it) and `markHurt()` counts every HP loss, the enemy's too (`battle.hurtThisTurn`, `battle.timesHurt`). A card's
  cost in the hand comes from `costOf()` (`makeCard(card, { cost })` shows a cheaper one in green).
  Human bot, Fire L0 / L3 / L5: 71.2 / 63.3 / 34.5 before, 70.7 / 62.2 / 39.3 after (600 runs/cell); the bot never
  takes the combo cards, so those builds are for the user's playtest.
  **Water's pool (6c.4, 2026-09-26)**: 20 common / 32 uncommon / 13 rare + 8 evolution cards, the same way (the doc's
  Water section lists them and what changed). Water's mechanics, all in `js/battle.js` with `describe()` lines: Tide goes
  through `gainTide()` (Drizzle adds to every gain; `battle.tideGained` counts it all for Tsunami's `perTideGained`) and
  `spendTide()` (every "spend all your Tide": `perTide`, `blockPerTide`; Rain Dish's `tideSpendBlock` turns it into
  block), `perTideHeld` (counts without spending), `tideMult`, powers `tideEachTurn`, `tideSurge` (Primal Reversion, 1 more
  each turn, `battle.surgeTurns`). Block: `blockMult`, `blockPerCard`, `blockNext` and `blur` (`battle.blockNext` /
  `battle.blur`, used in `beginPlayerTurn()`, with badges), `blockDamage` true or a multiple (with `block`, the block comes
  first: Aqua Tail), power `riptide` (every `gainBlock()` and the turn's first block hit the enemy). Hand: `drawTo`,
  `ifDiscarded`, `costDownOnDiscard`, `discardHand` + `perDiscarded` (`timesEach()`). At the end of your turn Still
  Waters' `retainN` asks which card to keep (`pickFromHand()` takes an `only` filter; `choosing.only` greys the rest),
  then every kept card with a `growOnRetain` (next to `effects`: Aqua Cutter, Life Dew, Hydro Cannon) or under Ebb and
  Flow (`retainDiscount`) becomes its own copy for the fight, with bigger effects or a `discount` that `costOf()`
  subtracts; the deck's card is untouched. The sim mirrors it all; its bot check (6c.5) found the pool 7-16 points
  weaker, so Shelter blocks 9, Mist 12 and Chilling Water trades a draw for Weak 1 (human bot L0 / L3 / L5 ~74 / 57 / 36).
  **Grass's pool (6c.5, 2026-09-27)**: 20 common / 32 uncommon / 14 rare + 8 evolution cards (the doc's Grass section).
  Grass's mechanics, all in `js/battle.js` with `describe()` lines: **Leech Seed** (`seed`, `enemy.seed`, 🌱 badge: at the
  start of the enemy's turn, after Burn, it loses that much HP, you heal as much, then it drops by 1; Grassy Surge's
  `seedKeep` stops the drop; Seed Sower's `attackSeed` seeds on every hit that gets through) and **Sap** (`sap`,
  `enemy.sap`, 🍂 badge: `attackDamage()` subtracts it, all fight). Every debuff from a card or power goes through
  `applyDebuff()` (Effect Spore's `debuffDamage`, Sap Sipper's `weakBlock`); `debuffKinds()` counts Weak / Vulnerable / Seed /
  Sap / Burn (`perDebuff`, `drawPerDebuff`). Every heal goes through `healPlayer()` (Chlorophyll's `overheal`: healing past
  max HP becomes block; Grass Pledge's `healStrength`, once a turn via `battle.pledged`; `battle.healedThisTurn` for
  `ifHealed`), every strength gain through `gainStrength()` (Harvest's `strengthHeal`; `flex` strength is kept in
  `battle.flex` and taken off in `endTurn()`). Also `ifWeak` / `ifVulnerable` / `ifSeeded` / `ifEnemyAttacks`,
  `healPerStrength`, `healPerSeed`, `doubleStrength`, powers `attackHeal`, `weakEachTurn`, `exhaustHand: 'status'`, and
  `feed` (Jungle Healing, StS's Feed: +max HP on a kill; `onEnd` now passes `maxHp` and `afterFight()` keeps it). Leech Seed
  skips block and heals, so its numbers are small (Worry Seed 3): at 4-6 the human bot won 89 / 77 / 59 at L0 / L3 / L5.
  **Neutral pool (6c.9, 2026-09-27)**: 21 cards any type can be offered (the doc's Neutral section), 9 of them new:
  Quick Attack, Rapid Spin, Double Team, Substitute, Mimic (`copyPick`), Endure (`endure`: `battle.endure`, a 🎗️ badge,
  `hurtPlayer()` stops at 1 HP until your next turn), Metronome (`randomCard`: a random card from `typePool(type)`, free
  this turn; the free copy carries `orig` and `settled()` puts the real card back wherever it goes, and in the hand at the
  end of the turn), Hyper Beam (a negative `nextEnergy`, a red ⚡ badge) and Last Resort (`needsEmptyDraw`).
  **Reward rules (6c.9)**: a fight's card reward (`cardChoices(run, source, 3, { reward: true })`, not the Mart or events)
  offers commons/uncommons upgraded at `REWARD_UPGRADE_ODDS` per biome (0 / 25% / 50%, StS's) and adds `run.rarePity`
  (StS's rare pity: +1 rare weight per common offered, up to 40, reset once a rare is offered; saved with the run, an old
  save's missing value counts as 0) to the rare weight. Both live in `js/rewards.js`.
  Bot pass after 6c.9 (human bot, fire / grass / water): L0 ~75 / 76 / 69, L3 ~64 / 59 / 49, L5 ~39 / 33 / 26; Water
  trails at Levels 3-5 (the status cards clog its hand-based decks). Numbers per part are in the roadmap's step 6c.9.
  **Upgrades (PP Up)**: `CARDS_BY_ID['<id>+']` is every card's upgraded copy (name `<name>+`, green
  name, `upgraded: true`, `base`), built at load from its `upgrade` field or the default rule
  (`upgradeOf()`), so a deck saves upgraded cards as ids and old saves load unchanged (no version
  bump). Anything counting copies uses `baseId()` (MAX_COPIES, Mart, Day Care, Move Tutor, rewards).
  `ALL_CARDS` stays base cards only. The Center's third choice is PP Up (see Deck thinning). Every PP Up picker
  (`upgradeMove()`) shows the cards upgraded with what changes in big bright green text, no box (`markUpgrade()` in `js/ui.js`) and the blown-up
  one beside the card as it is now (an option's `before`, 2026-10-07).
  **No duplicates in one run** (the user found Fire Lash = Double Hit, 2026-09-28): no two cards a run can meet (its type's
  pool, the neutral pool, its starting deck) may share cost and text. `noOffer: true` keeps a card out of `poolForType()`
  (Block: Grass's starting Defend, which offered doubled Water's Withdraw); Tackle is Pommel Strike (6 + draw 1) and Fire
  Lash burns. **Since 2026-10-26 the rule is stricter** (the twin pass, below): not even the same card with other numbers.

- **Electric** (2026-10-19, the Safari's duo pool; `docs/duo-design.md` section 5, `docs/reference/safari.md`'s duo
  section): `ELECTRIC_CARDS` / `ELECTRIC_EVO_*`, art in `js/card-art-electric.js`. New keys: `static`, `perStatic`,
  `ifFull`, `energyMult`, `energyPer`, `switch`, `ifSwitched`, `perSwitch`, `growOnPlay: { discount }`; powers
  `staticEachTurn`, `paraEnergy`, `attackStatic`, `energyEachTurn`, `keepEnergy`, `switchBlock`, `switchDraw`,
  `switchStrength`; session 4 (74 cards in all) `blockPerStatic`, `blockPerSwitch`, `staticMult`, powers `thornStatic`,
  `staticBlock`, `energyBlock`, `switchWeak`, `switchStatic`, `switchSap`. Boxes: Static, Paralyzed, Switch. The Card
  index has an Electric tab. A `duo: true` card (Baton Pass) is offered only in a Duo Run
  (`poolForType(type, duo)`). `TYPES.electric` has no triangle match-ups: outside the Safari it's neutral.
- **Ice** (session 5, 2026-10-19; `docs/duo-design.md` section 5's "Ice's first session"): `ICE_CARDS` / `ICE_EVO_*`
  (30 + 8 so far), art in `js/card-art-ice.js`, the `icicle` token. New keys: `frostbite`, `perFrost`, `frostMult`,
  `ifFrost`, `hail`, `ifHail`, `ifWeather`, `returnZero`; card flags `icicle: true` (each one played adds `ICICLE_STEP`
  to every Icicle card's hits this fight, `b.icicles`) and `freeIn: 'hail'` (costs 0 in Hail, `costOf()`); powers
  `frostEachTurn`, `frostKeep`, `zeroBlock`, `icicleFrost`, `hailDraw`, `hailBlock`, `hailFrost`. Boxes: Frostbite,
  Icicle, Hail. `TYPES.ice` is neutral outside the Safari, like Electric.
  Session 6 (2026-10-19, "Ice's second session") brought the other 36 (74 in all, StS's split): new keys
  `blockPerFrost`, `blockPerIcicle`, `thaw` (Shatter); powers `thornFrost`, `frostBlock`, `hailChipBlock`, `hailIcicle`,
  `icicleEachTurn`, `retainZero` (Cold Storage: 0-cost cards kept at turn end), `hailKeep` (Endless Winter). Never-Melt
  Ice is Ice's `TYPE_RELIC`.
- **Fighting** (session 7, 2026-10-19; `docs/duo-design.md` section 5's "Fighting's first session"): `FIGHTING_CARDS` /
  `FIGHTING_EVO_*` (30 + 8 so far), art in `js/card-art-fighting.js`, and **Sore** (a status card: Unplayable. Ethereal).
  New keys: `ifAfterAttack` / `ifAfterSkill` (**Follow-up**: `b.lastKind`, the last card played this turn, an attack or a
  skill; a power or status card is neither; a card whose Follow-up would happen now glows, `.follow-ready`), `counter`
  (`b.counter`, gone at your turn's start; each enemy attack takes that much back), `ifAttacked` and `perLost` (the last
  enemy turn: `b.attackedLast`, `b.lostLast`), `bide` (`b.bide`), `perStatusHeld`; an extra's `hits` alone reads "It hits
  once more."; powers `mixBlock`, `counterEachTurn`, `hurtStrength`, `statusDraw` (in `draw()`), `statusStrength` (in
  `exhaustCard()`), `followAlways`. Boxes: Follow-up, Counter, Status cards. `TYPES.fighting` is neutral outside the Safari.
  Session 8 (2026-10-20, "Fighting's second session") brought the other 36 (74 in all): new keys `blockPerLost`,
  `blockPerStatusHeld`, `counterPerStatus`, `counterPerLost` (all folded into the card's block or Counter in `effectsOf()`);
  "whenever a Follow-up happens" (`followed` in `resolveCard()`, read before the card's kind is recorded); powers
  `followBlock`, `followCounter`, `counterBlock` (Justified: block next turn), `statusBlock` (in `exhaustCard()`),
  `statusHeldBlock` (after the turn's draw), `counterKeep` (Stand Firm). Expert Belt is Fighting's `TYPE_RELIC` (Black Belt
  was taken).
- **Ground** (session 9, 2026-10-20; `docs/duo-design.md` section 5's "Ground's first session"): `GROUND_CARDS` /
  `GROUND_EVO_*` (30 + 8 so far), art in `js/card-art-ground.js`. New keys: `surface` (**Dig**: what's outside it happens
  when played, then the card goes to `b.underground`, not the discard pile; `surface()` in `js/battle.js` resolves each at
  your next turn's start, after the draw, and sends it to its own deck's discard pile, a duo partner's included; it isn't a
  card played; an upgrade replaces `surface` whole, so a Dig card's upgrade spells it out), `perUnder`, `fault`
  (`enemy.fault`, the 🌋 badge; checked in `enemyTurn()` after Burn and Leech Seed against `faultLine()`, half on Alphas
  and bosses; `felledBy: 'fault'`), `perFault`, `faultMult`, `sand` (`setWeather('sand', n)`, `sanding()`, `SAND` in
  `js/data/cards.js`: the chip, and +3 on a Ground card's block in `effectsOf()`), `ifSand`; powers `surfaceDraw`,
  `surfaceDamage`, `faultEachTurn`, `sandAttack`, `sandEachTurn`, `sandFault`. Hail's own powers and Safety Goggles now
  read Hail only. Boxes: Dig, Fault, Sandstorm. The Sturdy Ability is in `hurtPlayer()`, after Focus Sash.
  Session 10 (2026-10-20, "Ground's second session") brought the other 36 (74 in all), defence-leaning: new keys
  `blockPerUnder`, `blockPerFault` (folded into the card's block in `effectsOf()`), `ifFault` (an extra while the enemy has
  any Fault), `blockFault` (Fault equal to your block, after the card's block: Groundswell); powers `digBlock` (as a card
  goes underground, in `resolveCard()`), `faultBlock` (in `applyFault()`), `sandChipBlock`, `sandWeak` (on Sandstorm's
  chip in `endTurn()`), `sandKeep` (Endless Sands). Soft Sand is Ground's `TYPE_RELIC`. Sturdy reads `b.ability.amount`
  (2 with Groundium Z), the second save from 1 HP too.
- **Flying** (session 11, 2026-10-20; `docs/duo-design.md` section 5's "Flying's first session"): `FLYING_CARDS` /
  `FLYING_EVO_*` (30 + 8 so far), art in `js/card-art-flying.js`. New keys: `evasion` (`b.evasion`, the 🪶 badge: each
  stack halves an enemy attack, before block, in `enemyTurn()`, and they're gone at your turn's start; `evaded()` shows the halved hit on the intent and the
  shield preview), `ifEvasion`, `perEvasion`, `tailwind` (`b.tailwind`, the 🌬️ badge: 1 more card at the start of each
  of your next N turns, a turn going as it draws in `beginPlayerTurn()`), `ifTailwind`, `perTailwind`, `freeIn: 'tailwind'`
  (Sky Attack), `ifEmpty` (**Unburden**: `unburdened()`, the last card in your hand as it's played; `effectsOf()` takes the
  hand's size without the card, so the preview and the glow (`.follow-ready`) read it too); powers `evadeDamage` (Gale),
  `evasionEachTurn` (Wind Wall), `tailwindDamage` (Wind Rider), `tailwindEvasion` (Wind Dancer), `emptyDraw` (Feather
  Light, once a turn, after a card in `playCard()`). Boxes: Evasion, Tailwind, Unburden. The **Keen Eye** Ability
  (`keenEye()`: draw 1 at the fight's start, and as Flying comes out in a duo, once a turn). Flying's Tailwind card is
  `tailwind-gust`: the neutral card `tailwind` (+1 PP next turn) is named **Rest** now, its id kept (answer 18).
  Session 12 (2026-10-20, "Flying's second session") brought the other 36 (74 in all), defence-leaning: new keys
  `blockPerEvasion` (the card's own Evasion counted: Phantom Wing) and `blockPerTailwind`, folded into the card's block in
  `effectsOf()`; powers `evasionBlock` (in `gainEvasion()`), `evadeWeak`, `evadeSap` (on an evaded hit in `enemyTurn()`;
  Gale Wings' Weak is `enemy.weakNew`, so it isn't worn off at the end of the turn it lands in, StS's rule for a debuff
  applied on the monster's turn), `tailwindBlock` (a turn's start in Tailwind), `tailwindKeep` (Delta Stream: the turn's
  draw no longer spends it), `unburdenBlock` (whenever an Unburden happens, in `resolveCard()`), `emptyBlock` (Weightless,
  sharing Feather Light's once a turn). Sharp Beak is Flying's `TYPE_RELIC`.
- **Dark** (session 13, 2026-10-20; `docs/duo-design.md` section 5's "Dark's first session"): `DARK_CARDS` / `DARK_EVO_*`
  (30 + 8 so far), art in `js/card-art-dark.js`. New keys: `steal` (**Steal**: `steal()` in `resolveCard()` before the
  hit, up to N of the enemy's strength and `STEAL_BLOCK` x N of its block become yours), `ifBuffed` (it has strength or
  block), `punish` (**Punish**: `punishing()`, its intent an attack or a drain and it not about to be Paralyzed, the older
  `ifEnemyAttacks` test, whose cards keep their wording; a Punish card glows as Follow-up's do), `taunt` (`taunt()`: its
  `moveIndex` jumps to the next attack in its list), `perIntent` (Ruination), the card flag `illusion` (**Illusion**:
  `illusive()`, `cardMultiplier()` takes the better of the card's type and `partnerType()`, alone Neutral; STAB and the
  partner's held item count it), `perIllusion` (`b.illusions`, this turn's), `disguise` (**Disguise**: `b.disguised` till
  your next turn, the 🎭 badge; `guardType()` is `enemyTypeMultiplier()`'s default defender, so the intent and the hit
  both read it), `ifDisguised`, `copyPartner` (Imposter: `b.lastCards`, each partner's last card this turn, copied as an
  Illusion); powers `mirrorStrength` (Pickpocket, in `enemyStrength()`, which the buff moves, Enrage and Analytic now go
  through), `punishDamage` (Unnerve), `punishDraw` (Prankster, at the turn's start), `mirage` (Mirage). Boxes: Steal,
  Punish, Illusion, Disguise. The **Intimidate** Ability (`intimidate()`: Weak 1 at the fight's start and as Dark comes out,
  once a turn, `b.intimTurn`). Fighting's card `intimidate` is named **Stare Down** now, its id kept.
  Session 14 (2026-10-20, "Dark's second session") brought the other 36 (74 in all), defence-leaning: new keys
  `blockPerStrength` (the card's own Steal counted, `stealGain()`), `blockPerIllusion` and `blockIntent` (block equal to
  its coming attack, on a Punish), folded into the card's block in `effectsOf()`; powers `stealBlock` (in `steal()`),
  `punishBlock` (in `resolveCard()`), `intentBlock` / `intentWeak` / `stealEachTurn` (a turn's start, after the draw),
  `disguiseBlock` / `disguiseWeak` (in `disguise()`, Mirage's too), `illusionBlock` (in `resolveCard()`). Black Glasses is
  Dark's `TYPE_RELIC`.
- **Types**: five types (fire/grass/water, `normal`, shown as Neutral, and `psychic`), with Neutral and Psychic x1 both ways.
  `typeMultiplier()` in `js/battle.js` is the chart; a card
  uses its own `type`. An enemy attack uses the move's `type` if it has one,
  else the enemy's: moves whose real type isn't Fire/Grass/Water (Body Slam,
  Bite, Vice Grip, Acid) carry `type: 'normal'` in `js/data/enemies.js`, so
  give any new off-type move one too. **Elites and bosses ignore the chart
  both ways** (`typeless()`, by `battle.kind`, so Team Rocket's Alpha too;
  the user's call: type walls there felt unfair, match-ups are for wild
  fights). Since 6c.10 every elite and boss is also a pure Normal Pokémon (the user's call: a Gloom that
  wasn't weak to Charmander looked like a bug), with no Fire/Grass/Water move names. So the elite type-disadvantage coin bonus is gone, and they *show* as Neutral too
  (the nameplate chip, `setupBattleScreen()` in `js/battle.js`; the map shows no type badge at all), since
  their own type would suggest a match-up; `def.type` stays as theme for the Pokédex. The sim
  mirrors both (`enemyMult()`; variant `oldTypes` restores the old rules).
  **In the Safari** (2026-10-19) wild fights use the real Gen 5 chart (17 types) on real types instead (`js/data/real-types.js`,
  `docs/reference/safari.md`'s Real types); Neutral cards stay x1 there too.

## The balance pass (2026-10-16, the user's ask: "match Slay the Spire's numbers... find broken builds")

On branch `balance-pass` (both repos) until the user's playtest. **How broken builds are found now**: the whole-run bot
can't see combos, so pokeDB-sim has `sim/combo-lab.mjs` (fixed decks and relics against a training dummy that hits 12
+3 a turn, 3000 HP, and against real bosses: `vs: 'boss', level: 5`) and `sim/combo-fuzz.mjs` (thousands of random
late-run decks, ranked by how long they last and how hard they hit, with per-card and per-pair lift). Its README says how.
- **Fixed** (each measured in the lab): **Shell Smash exhausts** (with Shell Armor it doubled block every turn: 396 million
  in the fuzz; peak block ~1,500 -> ~85 in the lab, Level 5 boss wins 53 -> 30%); **Leech Seed no longer grows with
  evolution** (`STAGE_STATUS.seed` 0; Burn keeps +1 a stage): at stage 2 it was +2 a card (Worry Seed 3 -> 5) and 3 Worry
  Seeds took a plain Grass deck from 0% to 97% against Level 5's last bosses, losing ~5 HP a fight; now seed decks win
  5-50% there, like Fire's Burn decks (5-17%); halving the heal instead barely helped (90%). **Quick Guard
  exhausts** (a whole enemy turn negated every time: top-3 card in every type's fuzz, stall loops of 20+ turns; Mewtwo's
  Safeguard was made to as well, but it cost Mewtwo's mode 63 -> 45% and three of them stall without winning, so it stays).
  **Amnesia** blocks 12 and **Power Within** gives 4 Focus too (each read exactly like Barrier Field / Swords Dance:
  `tests/cards.test.mjs` now checks that rule for every type).
- **New cards** (32, each on a StS card, named in its comment; art in `js/card-art-new.js`): Fire and Grass at StS's
  20/36/16, Water 20/36/15, Psychic 20/30/16, Neutral 28. New mechanics, in `js/battle.js` with `describe()` and
  `cardTerms()` lines and mirrored in the sim: `growOnPlay` (Blazing Torque = Rampage: its pile copy grows),
  `growOnRetain: { discount }` (Steam Eruption = Sands of Time), `echo` (Inferno Overdrive: the next card this turn twice,
  `battle.echoNext`, counted before a card resolves so it never replays itself), `seedMult` (Bloom Doom), `tempSap`
  (Charm = Dark Shackles: `enemy.tempSap`, gone after its turn), `skipEnemy` (Eye of the Storm = Vault, Time Warp's path),
  `reshuffle` (Recycle), `returnCard` (Return = Headbutt), `sketch` (Sketch = Secret Technique, `pickFromPile()` on the draw
  pile), `upgradeAll` (Mega Evolution = Apotheosis, fight-only copies), `payDay` (Pay Day = Hand of Greed: `tally.payDay`,
  added to the prize in `afterFight()`), powers `statusDamage` (Burning Spirit = Fire Breathing, in `draw()`), `burnKeep`
  (Desolate Land), `strengthBlock` (Overgrowth), `focusEachTurn` (Meditate), `focusKeep` (Psychic Terrain) and `regen`
  (only Sweet Heart gives it).
- Playtest any of it on a throwaway run: `?arena=elite&starter=squirtle&relics=wide-lens,sticky-barb&cards=blazing-torque,ignite+&items=iron`
  (`playtestKit()` in `js/run.js`, any `peek` run).
- **Bot check** (human bot, `humanCfg`, fire / grass / water, L0 / L3 / L5): the branch's start (dbdfb4a, 200 runs a cell)
  78 / 84 / 78, 62 / 68 / 61, 44 / 35 / 38; the pass before any retune (200) 76 / 59 / 54, 54 / 32 / 30, 38 / 14 / 17 (Grass lost
  ~15 at L3 to the seed fix; Water ~13 to new cards the bot over-picks, ~6 to Quick Guard's Exhaust; at L3 putting the three
  boss relics back changed nothing). Screens at L3 (150): Worry Seed 4 etc. brought Grass back but the lab's seed decks too
  (95% against Level 5's last bosses), so **Grass got defence instead: Block 7 (its starting Defends) and Cotton Guard 11**
  (68); **Withdraw 8** like Flame Wall (Water 60); **Flame Body 11** (Fire 62; Flame Wall 9 was 69). Confirmed, 300 a cell:
  **81 / 84 / 78, 62 / 64 / 60, 40 / 38 / 38**, the types within ~4 points of each other at every Level. The weak new cards
  (one extra copy at L3: Hydro Steam -12, Gulp Missile -7, Overgrowth -4) were raised; the sim's `cardScore` no longer
  rates draw-to cards past 3 cards (Downpour was its favourite card, at -11).
- **Mewtwo** (human bot, `humanCfg('psychic', 0)`, shards 0): 63% at the branch's start (200 runs), 53.5% after the pass
  (400; all of it in the Depths), 45.5% while Safeguard exhausted too. Eternatus's own numbers barely moved it; the
  Depths' `MEWTWO_MODE.mods[3]` is now bossDmg 4 / bossHp 1.2 / enemyDmg -3 (was 8 / 1.3 / 0): 66.7% (300).
- **Sky Pillar** (`towerCfg`, 60 climbs of 4 flights a type), reaching floor 40 before -> after: fire 68 -> 70%, grass
  80 -> 78%, water 53 -> 58%: unchanged within noise. Its augments weren't retuned (stacking them is the mode's point).

## The Sky Pillar F100 combo pass (2026-10-20)

A friend's ~12-card Turtwig deck climbed the Sky Pillar to floor 100 (Leech Seed, Growth Spurt+, Overgrowth+, Lum Berry;
roadmap entry of that name). Targeted fixes, not a blanket nerf, all mirrored in pokeDB-sim (variant `preF100` undoes them):
- **Growth Spurt+** costs 0 and keeps Exhaust (was: no Exhaust). Here strength turns into block and healing too
  (Overgrowth, Horn Leech, Hoard), and a thin deck doubled it every other turn: ~390 peak strength in the combo lab, ~22 after.
- **Overgrowth+** costs 0 at x1 (was x2). **Ice Core** and **Electric Seed** give half the enemy's Frostbite / Static a
  copy: `frostBlock` / `staticBlock` now count halves (`halfOf()` writes the text; two copies give it whole). Ice Core with
  Cold Snap outlived the lab's dummy every time; its fuzzer lift fell 13.4 -> 3.8.
- **Dark Memory** adds 1 only to a card's Steal (`steal(n, byCard)`): not Magician's every turn, Dread Plate's or the Dark
  Gem's. Magician + Dark Memory lasted ~61 turns against the dummy, ~31 after.
- **Lum Berry** no longer draws (StS's Medical Kit doesn't): every status an enemy added cycled a thin deck.
- **Fire's and Fighting's lift** (the sweep's weakest late decks): **Flame Wall** and **Mat Block** 9 block, 12 upgraded
  (were 8 / 11). Buffing their scaling pieces (Fire Pledge, Burning Bulwark, Fighting Spirit, Counterstance) or their
  Abilities moved nothing; the starter's block card, in every deck, did.
- Bot check (human bot, 150 a cell; Fire 300): fire L0 / L3 / L5 68 / 46 / 24 -> 79 / 55 / 32, grass 71 / 54 / 28 -> 68 /
  54 / 27, water 65 / 45 / 25 -> 67 / 45 / 32; the 36 Safari pairs mean 65.8 -> 67.6 (fighting 67.8 -> 76.1, fire 63.3 ->
  67.6, the rest within noise). Fire now leads at L0 by ~8 (level at L3 / L5, where it trailed). Sky Pillar (`towerCfg`,
  10 flights, 60 climbs a type), reach floor 100: fire 27 -> 40%, grass 30 -> 23%, water 27 -> 30% (noisy at 60). Detail:
  pokeDB-sim's README.

## The twin pass (2026-10-26)

The user found Bubble and Bubble Beam (Deal 5 / 6. Weak 2. Tide 1 / 2.) in one hand: "no cards that repeat ... very unique
and distinct differences", all across the board. `docs/card-twins.md` lists every card that changed, what it read like
and what it does now.
- **The rule** (`tools/card-twins.mjs`, run by `tests/cards.test.mjs`): two cards one run can meet (its type's pool, the
  Neutral pool, its starting deck, both evolutions' cards; a Duo Run both types') are **twins** if their lines match once
  numbers are out, whatever they cost, and **near twins** if they cost the same and one is the other plus a line, sharing
  two or more. A line is a sentence of `describe()`; an "If ...:" / "Punish:" / "Surface:" / "Unburden:" clause and what
  follows it is one line; each keyword (Exhaust, Retain, Innate, Ethereal, Power, Icicle, Illusion) is a line. "If the
  enemy intends to attack:" is Punish's older wording (`punishing()`), so the tool reads them as one; made cards read
  alike whatever their count ("Add a Cinder" / "Add 3 Cinders"). Only each type's plain Strike and Defend (a starting
  card that is just "Deal N damage." or "Gain N block.") may match another type's in a Duo Run.
- **How each family was settled**: one card keeps a template, usually the starting-deck or common one, and the others
  take a different line of their own type's mechanics. No pure generic card is left in a Duo type (a plain "Deal X.
  Apply Weak." or "Bash" belongs to nobody), since every type meets every other in some Duo Run: each Bash in a starting
  deck carries its type's rider (Scorch Burn 2, Seed Bomb Leech Seed 1, Wing Attack Unburden: draw; Spark, Snatch,
  Bulldoze, Icy Wind already had one). Evolution cards that were a common with bigger numbers became signature moves;
  the three Z-Moves (Gigavolt Havoc, Subzero Slammer, Black Hole Eclipse) exhaust. Power was kept card for card (StS's
  numbers, x~1.2); no new mechanics, so pokeDB-sim's engine needed nothing. `perDiscard` (Flip Turn) was in
  `damageFor()` and the sim before any card used it.
- **Names and ids**: every id stays (saved runs load as they were); Disable+ is named **Imprison** (a card named like
  an upgrade read as a second Disable).
- **Safari signature cards** (514) are outside the rule: one per Pokémon, one copy a run. 170 still read like a card
  their run can meet (200 before); `tests/safarimons.test.mjs` keeps them from reading exactly like one.
- **Kenmatta's dojo** keeps the cards its trials were built on: `DOJO_CARDS` (`dojo-<id>`, in `CARDS_BY_ID` only, art by
  name through `cardArt()`'s namesake) holds the 15 changed cards as they were, and the trial decks deal those.
