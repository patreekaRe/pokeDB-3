# PokéDB roadmap

The plan agreed with the user (2026-09-25/26). Work top to bottom; update this file as
steps land (mark them done, note anything decided along the way).

## Chain summary (2026-09-27, second chain)

What the second chain did (details and "For the user" notes in each step below):
- **7b, Pokédex research levels**: every entry counts defeats ("Oddish defeated 2/3"); at 3 (bosses 2) it's Research
  complete, a gold mark, each move's numbers, and PokéCoins (wild 25 / Alpha 50 / boss 100); every entry done pays 1000 once.
- **9a, 6 Game Corner skins**: Budew, Sewaddle, Lotad (Grass) and Horsea, Spheal, Tympole (Water), 300 each plus a shiny.
- **9b, 6 legendaries**: Entei / Celebi / Kyogre (a Level 5 win per type), Ho-Oh / Lugia / Palkia (a finished Pokédex page).
  Unlocks are now also checked after each won fight and at the end of a lost run. Moltres, Virizion, Suicune and Mewtwo got
  the cries they never had.
- **9c, the last 5 legendaries**: Reshiram (whole-dex research), Victini (win with ≤15 cards), Heatran (win with no rest),
  Manaphy (20 Tide at once), Keldeo (win with every Water starter you own). Done in 9b's session: the chain hit its session
  depth limit and couldn't start a fourth.

**For you to check:** the new blurbs, types (Lugia / Palkia / Manaphy / Keldeo as Water, Ho-Oh / Reshiram / Victini / Heatran
as Fire; Grass has only Celebi and Virizion) and cries by ear; 300 per skin; research numbers show Level 0's values; Keldeo's
"every Water starter you own" gets harder as you buy Water skins; Victini at ≤15 cards may be easy; the Game Corner's
total is now ~14400 PokéCoins. Mewtwo's "unlock every other Pokémon" now needs all 31 others, the new legendaries included.

## Overnight summary (2026-09-27)

What the overnight chain did, one session per big step (details and bot numbers in each step below):
- **6c.11a, relics**: 30 new StS-style relics (58 in all) with common / uncommon / rare tiers and PokéSprite art; the sim
  mirrors them and ranks.json was recalibrated. Levels 3/5 ended ~2-4 points harder, Fire/Water a little behind Grass.
- **6c.11b, items**: 8 new StS-potion items (20 in all), one per type feeding an archetype; Dive 9 and Flame Body 10 as the
  Fire/Water catch-up; a Relics and an Items tab in the Index (silhouettes until met).
- **Make the game explain itself**: Ability chip + Gen 5 "Charmander's Blaze" banner, keyword boxes beside blown-up cards,
  and an HP plate on every choice screen.
- **7, Pokédex**: a page per biome, "???" until fought, complete once beaten; finishing a page pays PokéCoins and a perk
  (Mom's Savings ₽50, Chansey's Gift Potion, Oak's Advice reroll).
- **8, Game Corner perks and coin economy**: Bag Pocket, Mart Card, Move Tutor Notes, Scout Report; shiny starters (a third
  Game Corner row, a ✨ toggle on the starter sheet, a sparkle in battle); PokéCoins +10% per Trainer Level. No enemy retune
  (Level 0 with no perks is ~77%); Move Tutor Notes cut to one move after the bot found two worth 8-28 points.
- Planned with you during step 8: **7b, Pokédex research levels** (done in the next chain) and **9, more starters**.

**For you to check or decide** (the full lists are in each step's "For the user" notes):
- Step 8: with every perk bought, Level 0 is ~96% and Level 5 ~75% (endgame easy); Move Tutor Notes is still the strongest
  single perk; every perk now reads `Lv n/m`.
- Step 7: Pokédex perks lift Grass/Water at Levels 3/5 by 5-15 once earned; fight-room silhouettes on the map aren't done
  (your call); page coins 100 / 150 / 200 are a guess.
- 6c.11b: TM's picker reuses Fusion Flare's layout; Revive's news rides on the hit's text line; Fire L0 ~79 is a bit high.
- Explain-itself: the nameplate chip is the Ability Capsule, not the type icon; on phones the risen card's keyword boxes
  stack over the arena; Block has no keyword box; the TM / Fusion Flare picker has no boxes yet.
- Seen in passing: on short PC windows (1280x800) the Mart's text box covers half of Leave (it was so before step 8).

## Order

1. **Lock the Pokémon list** — done (the list below).
2. **Move type audit + neutral elites/bosses** — done (`88fad54`): enemy moves carry their
   real `type`, elites and bosses ignore the type chart both ways.
   - Also done early (`085f4bb`): the StS card revamp (every card rebuilt on a Slay the Spire 1
     card, Weak/Vulnerable, StS-shaped starting decks) and an enemy retune to match. That retune
     only moved the per-biome numbers (`dmgBonus`, `bossBonus`, `hpMult`), so step 5 redoes it
     cheaply once the new roster exists.
3. **New elites and bosses** — done: every biome has its own 3 elites and 3 bosses from the
   list below (one boss picked per run), all with rough numbers in line with what they replaced.
   - Arcanine moved from elite base to a biome-1 boss (150 HP), so `RUN_SAVE_VERSION` went 5 → 6.
   - Salamence stays as a 4th biome-3 boss (bosses are neutral, so it costs nothing).
   - Slaking's pattern is Truant: every other move is a loaf (a block move called Truant).
   - Elites and bosses now also *show* as Neutral (battle nameplate chip, map scouting badge);
     their own types are theme only and stay in the data for the Pokédex.
   - Cries come from PokeAPI (`github.com/PokeAPI/cries`, `cries/pokemon/latest/<dex no>.ogg`),
     since play.pokemonshowdown.com is blocked in cloud sessions: convert to mono 64 kbps MP3
     normalized to about -14 dB mean volume (the level of the existing cries); `pip install
     imageio-ffmpeg` gives an ffmpeg binary, and PIL's median frame bounds match sprite-fit.js.
4. **New wild Pokémon** — done: every biome has its 12 wilds from the list below (3 per type),
   with rough numbers in the range of the wilds they replaced (biome 1 ~40–48 HP, biome 2
   ~48–60, biome 3 ~60–72; the usual attack / setup / big attack shape).
   - Growlithe moved to biome 1 (HP 58 → 46), Magmar became a biome-3 wild (64 HP).
   - Pidgey, Zubat, Machop, Geodude, Rhyhorn, Ponyta and Lapras left the game (sprites, cries,
     sprite-fit entries and defs removed), so `RUN_SAVE_VERSION` went 6 → 7.
   - Team Rocket's teams are now Rattata/Zigzagoon, Houndour/Aipom, Sharpedo/Zangoose: wilds of
     that biome, so the Alpha is lighter than a real elite (no more 700+ HP Rhyhorn).
   - With 12 wilds a biome, a run rarely meets the same wild twice; nothing weights the picks yet
     (the Pokédex step may favour unregistered ones).
5. **Big balance pass** — bots done (2026-09-26); the user's own playtest is next.
   - Baseline over the new roster (human bot): L0 ~83, L3 ~68, L5 ~45, and the user found Fire
     easy. Biome 1 never killed anyone at L0, but at L3/L5 it killed Grass/Water 10-30% of runs
     (Arcanine, Flareon; Alpha elites with Elite Territory had as much HP as the boss) and Fire ~0%.
   - Shipped: biome `dmgBonus` 6/14/24, `bossBonus` 7/19/30; Arcanine Fire Fang 9 / Flare Blitz 13,
     Flareon Flare Blitz 10, Gloom Petal Dance 11, Ursaring Hammer Arm 22, Gyarados and Salamence
     Hyper Beam 20 (evens each biome's elites/bosses); Elite Territory +15% HP, Fierce Bosses
     +10% HP; Cotton Guard 8, Dive 9.
   - Now (human bot, 600 runs/cell) fire / grass / water: L0 74 / 76 / 76, L3 59 / 56 / 65,
     L5 36 / 33 / 39. Strong bot L0 79 / 89 / 88, L3 75 / 73 / 78, L5 53 / 51 / 51.
   - Still to watch in the playtest: Fire's deaths are mostly biome 3 bosses (strong start, thin
     late game); Grass/Water's are biome 1 at Levels 3+. Slaking is the softest biome-3 boss.
6. **Card index** — done (2026-09-26): a StS-style Compendium of every card (`js/cardindex.js`,
   `#index-dialog`), opened from the Poké Ball menu and a blue "Card index" button under How to play.
   Tabs per type (Fire, Grass, Water, Neutral; ← → switch), grouped Common / Uncommon / Rare, then the
   evolution-only cards in two groups (1st form, final form), each sorted by cost then name, at base
   (stage 0) numbers; tap to zoom (`zoomable()`). It opens on the picked starter's type, else the last tab.
6b. **Water rework** — done (2026-09-26, the user's playtest: "Water felt kind of bland"). Water now
   has a "build up, cash in" mechanic, **Tide** (`battle.tide`, a 🌊 nameplate badge, lasts all fight):
   - Build (`tide: N`): Bubble 5 dmg + Weak 1 + Tide 1, Dive 8 block + draw + Tide 1, Rain Dance
     4 block + Tide 2 (was focus + block), Surf 12 dmg + Tide 2 (was 16), Origin Pulse Tide 3 (was focus 6).
   - Cash in (`perTide: N`, then all Tide is spent): Water Pulse 5 + 2/Tide (retain; replaces one
     Water Gun in the starting deck), Hydro Pump 2 cost 10 + 5/Tide (was 3 cost 36), Brine 8 + 4/Tide.
   - New rare power **Shell Armor** (`shell-armor`, StS's Barricade, `keepBlock`): block no longer wears
     off between turns, so Razor Shell builds are worth aiming for. No ids removed, no save bump.
   - Rejected in the bot: Tide on Withdraw (Water L3 ~83-95%), Water Pulse +3/Tide, Bubble 6 dmg with
     Tide (the bot hoarded Bubbles: L5 47).
   - After (human bot, 600 runs/cell) fire / grass / water: L0 66 / 77 / 78, L3 61 / 57 / 67,
     L5 35 / 37 / 41 (strong bot L0 80 / 87 / 90, L3 73 / 72 / 82, L5 56 / 53 / 58). Water was
     76 / 65 / 39 before, so it stays level (the top of the three at L3, within noise elsewhere).
   - For the playtest: does Tide read clearly (card text, badge tooltip), and is holding Water Pulse fun?
6c. **Card pool expansion: the StS feel** (~8–10 sessions, the user's call 2026-09-26: "I really want the StS
   feel... different builds, even if it means 70+ cards per [type]"). There are only 3 characters (Fire, Grass,
   Water); every other starter stays a cosmetic skin sharing its type's deck. Each character gets StS's shape:
   - **~70 cards per type** supporting 3 archetypes, so two runs of one type can play completely differently:
     Fire: Burn (stack/spread burn), Recklessness (lose HP to hit harder), Momentum (cheap attacks, energy,
     many cards a turn). Grass: Strength (grow over a fight), Sustain (healing that turns into block/damage),
     Spores (stacking debuffs on the enemy). Water: Tide (build up, cash in), Shell (Shell Armor block +
     Razor Shell), Flow (draw, retain, cycling). These are proposals: the design doc settles them.
   - **A starter relic per character** (StS's Burning Blood): an Ability like Blaze / Overgrow / Torrent,
     shared by all of that type's skins.
   - **~20 real Neutral cards** (cross-type tools, not filler), build-defining relics, enemy status effects.
   - Never remove a card id (rework instead), so saved runs survive.
   Steps, one per session:
   1. **Design doc** (`docs/card-design.md`) — done and approved (2026-09-26; the user asked Claude to settle the
      open questions by what's closest to StS, see its Decisions section): the 9
      archetypes, each type's Ability, the new mechanics, and a card-list skeleton per type (name, rarity, cost,
      rough effect, archetype, StS card it's modelled on). Changes from the proposals: Fire's Momentum became
      **Kindling** (exhaust + 0-cost Cinders; Momentum overlapped Water's Flow), Grass's Sustain became **Drain**
      (Leech Seed as Grass's poison, overheal turns into block), Water's third is **Tsunami** and Tide is now all
      of Water's resource. Fire 68 / Grass 64 / Water 63 cards incl. 8 evolution cards each, Neutral 21, and 4
      status cards.
   2. **Engine** — done (2026-09-26). Built: PP Up at the Pokémon Center (Chansey is the third spot; upgraded
      cards are `CARDS_BY_ID['<id>+']`, built from a card's `upgrade` or a default rule, so no save bump), X cost,
      discard / exhaust picks from the hand, `onDiscard` / `onExhaust`, exhaust and discard powers, cards made in
      a fight (`addCard`, tokens Cinder / Seedling / Droplet), cards-played-this-turn payoffs (`perPlayed`,
      `hitsPerAttack`, `combo`, `cardDamage` / `cardBlock`), Unplayable / Ethereal / Innate, a 10-card hand cap,
      status cards (Confusion, Paralysis, Poison, Sludge) via enemy moves' `adds` / `kind: 'status'` (no enemy uses
      them yet), and the Abilities (Blaze +3 below half HP, Overgrow heal 3 after a win, Torrent 2 Tide). The rare
      power `blaze` is named Solar Power now. All mirrored in the sim (variants `noAbility`, `noUpgrades`, `og3`,
      `dmgUp1`). Tested headless with injected test cards for every mechanic.
      - Bot: PP Up + Abilities made the human bot ~12 points stronger (L0 69 / 78 / 71 -> 83 / 88 / 82); Overgrow at
        5 HP was +10 to +22 for Grass alone. Shipped Overgrow 3 and enemy `dmgBonus` / `bossBonus` +1/+2/+3 (7/16/27,
        8/21/33): human L0 70 / 77 / 76, L3 56 / 57 / 61, L5 34 / 34 / 33 (fire / grass / water), close to before.
      - Left for the type sessions (listed per type in the doc): Leech Seed, Sap, overheal, Flex, burn multipliers,
        hurt-this-turn, exhaust-your-hand, Tide multipliers, block tricks, retain tricks, picking from the exhaust pile.
   3. **Fire's cards** — done (2026-09-26). 20 common / 32 uncommon / 14 rare + 8 evolution cards = 74, each on a StS
      card with a hand-picked upgrade and PokéSprite art (45 new sprites + `item-fit.js`). Fire's mechanics are in
      `js/battle.js`: burn multipliers (`burnMult`, `burnTimes`, Drought), `ifBurned` / `ifHurt`, `costDownOnHurt`,
      powers Raging Fury (Rupture), Eruption (Combust), Flare Boost (Brutality), Blue Flare (Corruption), Steam Engine,
      Hot Coals, exhaust-your-hand (`exhaustHand` + per-card scaling), Wildfire (Havoc) and Fusion Flare (Exhume, a
      pick from the exhaust pile). 6 bridge uncommons were added (Blaze Kick, Infernal Parade, Steam Engine, Fiery
      Wrath, Armor Cannon, Heatproof); Burning Jealousy costs 2, Fire Blast 2. Starting deck unchanged.
      Bot check (human bot, 600 runs/cell, same bot): Fire L0 / L3 / L5 was 71.2 / 63.3 / 34.5, now 70.7 / 62.2 / 39.3,
      so no retune. Grass / Water in the same run: L0 74.2 / 74.8, L3 52.2 / 57.8, L5 32.0 / 30.2 (unchanged data;
      within noise of the last session's 300-run numbers), so Fire is now level with or ahead of the others. The bot scores cards one at a time and never takes the combo pieces (Fan the Flames, Sacred Fire,
      Drought, Blue Flare, Raging Fury, Fusion Flare, Wildfire, the exhaust engine): only the user's playtest can judge
      those builds. Before/after runs: serve the old commit (`git worktree`) with the old sim on a second port.
   4. **Water's cards** — done (2026-09-26); bot check done in 6c.5. 20 common / 32 uncommon / 13 rare + 8 evolution
      cards = 73 (the doc's Water section lists them). Bot (human, 600 runs/cell, pre-6c.4 commit on port 8131 with the old
      sim): L0 / L3 / L5 71.0 / 57.8 / 33.8 -> 64.2 / 41.5 / 24.5 with the new pool. Retuned Water's commons (Shelter 9,
      Mist 12, Chilling Water gains Weak 1 for one of its draws): 74.0 / 56.8 / 36.3 (400 runs). The new sim on the old data
      played 58.5 at L3 (old sim 57.8), so the drop was the pool, not the mirror.
      - For the playtest: do the three Water builds feel different (Tide cash-ins, a Shell Armor / Riptide wall, a
        discard-and-retain hand)? Is Still Waters' "Choose a card to keep" clear? Swift Swim with Drizzle, Snipe Shot at high
        Tide and Wave Crash behind Iron Shell hit very hard: fun or broken?
   5. **Grass's cards** — done (2026-09-27). 20 common / 32 uncommon / 14 rare + 8 evolution cards = 74, each on a StS card
      with a hand-picked upgrade and PokéSprite art (49 new sprites + `item-fit.js`). Grass's mechanics are in `js/battle.js`:
      Leech Seed (`seed`, `enemy.seed`: drains at the start of the enemy's turn and heals you; Grassy Surge's `seedKeep`
      stops it dropping; Seed Sower's `attackSeed`), Sap (`enemy.sap`, its attacks deal that much less), Flex
      (`battle.flex`, gone at the end of your turn), `healPlayer()` with Chlorophyll's overheal-to-block and Grass Pledge's
      strength, `gainStrength()` with Harvest's heal, `applyDebuff()` with Effect Spore and Sap Sipper, `debuffKinds()` for
      Leaf Tornado / Pollen Puff, conditions `ifWeak` / `ifVulnerable` / `ifSeeded` / `ifHealed` / `ifEnemyAttacks`, Feed
      (`feed`: +max HP, returned to `afterFight()` as `result.maxHp`), `exhaustHand: 'status'`. The doc's Grass section lists
      the bridges and every number changed. Starting deck unchanged. All mirrored in the sim.
      - Bot (human): old pool L0 / L3 / L5 74.2 / 52.2 / 32.0 (6c.3's run); new pool 89.3 / 76.5 / 58.8, almost all from
        Leech Seed. With smaller seeds (shipped): 78.8 / 57.0 / 32.5 (400 runs).
      - For the playtest: does Leech Seed read clearly (badge, the drain at the enemy's turn)? Is a Drain deck (Chlorophyll +
        Ingrain + seeds) fun or too safe? Do Growth (Rototiller, Growth Spurt, Solar Blade) and Spores (Effect Spore, Leaf
        Tornado, Nature's Madness) feel like their own builds? The bot never takes the combo pieces.
   6. **The user's playtest of all three types** — ongoing (play on the live site). Notes so far: 2026-09-27, one Fire
      run won, "pretty smooth... felt pretty easy", lowest HP a little over half. After 6c.9 the human bot has Fire the
      strongest at Level 0 (~75%); if it still feels easy, raise biome 2-3 `dmgBonus` by 1-2 (all types).
   7–8. Spare sessions for fixes from the user's playtests of each type.
   Each type step: its ~72 cards with PokéSprite art (+ `item-fit.js`), starting deck,
      Ability, a bot check at Levels 0/3/5. The bot scores cards one at a time and won't see combos, so it
      only guards against broken numbers; the user's playtests judge whether builds are fun.
   9. **Neutral pool, reward rules, enemy status cards** — done (2026-09-27, 6c.9; see the doc's Neutral and Status
      sections and Decisions 9):
      - 9 new Neutral cards (21 in all), StS's reward rules (upgraded commons/uncommons in biomes 2-3 at 25% / 50%, a rare
        pity counter), status cards on 11 enemies (Alpha Gloom 1 Poison, Tangrowth 2 Paralysis, Psyduck/Slowpoke/Slowking
        Confusion, Snorlax/Stantler/Tauros Paralysis, Oddish Poison, Shellos/Tangela Sludge).
      - The user's notes (same day): the Center offers Rest or PP Up only (forgetting there needs the new Mental Herb relic,
        StS's Peace Pipe); found items float like treasure relics and a full Bag shows which item you'd toss; the Shrine
        shows the relic it gives; in-battle hand picks (discard, exhaust, keep, copy) take a confirm tap; the Mart PC's sign
        shows its price and the Bag can toss items in the Mart. Biomes stay at 10 floors (the user's call).
      - Bot (human, 300 runs/cell) fire / grass / water: L0 74.7 / 75.7 / 69.7, L3 64.3 / 59.0 / 42.0, L5 39.0 / 33.0 / 24.0
        with Gloom at 2 Poison; each part alone: new Neutral cards ~0 (within noise), reward rules +3 to +7, status cards
        -3 to +3 at L0 but Water -15 / -8 and Grass -8 at L3 / L5 (biome 1's Alpha Gloom), the Center change -2 to +7.
        Gloom at 1 Poison (shipped): Water 69.3 / 49.0 / 25.8 (400). Withdraw 7 on top overshot (82.3 / 70.5 / 47.3).
      - Left: build-defining relics and more items (next sessions), and Water trails by ~10 at L3/L5.
   10. **Normal-type elites and bosses (a visual swap)** — done (2026-09-27). The user's call: elites and bosses already
      fought as Neutral, but a Gloom that isn't weak to Fire looked like a bug, so every non-Normal elite and boss became a
      pure Normal Pokémon with the same moves, numbers, status cards and place in `BIOMES` (new ids, `RUN_SAVE_VERSION`
      7 → 8). Old → new (moves renamed only where they named a type, or didn't fit):
      - Biome 1 elites: Gloom → Raticate (Super Fang, Toxic, Hyper Fang), Poliwhirl → Furret (Quick Attack, Defense
        Curl, Body Slam), Flareon → Linoone (Headbutt, Work Up, Double-Edge). Bosses: Arcanine → Kangaskhan (Mega Punch,
        Howl, Extreme Speed, Mega Kick), Poliwrath → Miltank (Rollout, Defense Curl, Bulk Up, Dynamic Punch).
      - Biome 2 elites: Ninetales → Ambipom (Double Hit, Nasty Plot, Last Resort), Shiftry → Persian (Faint Attack, Nasty
        Plot, Slash), Slowking → Watchog (Confuse Ray, Amnesia, Crunch). Bosses: Chandelure → Stoutland (Take Down, Work
        Up, Retaliate, Giga Impact), Tangrowth → Exploud (Uproar, Bite, Screech, Hyper Voice).
      - Biome 3 elites: Houndoom → Purugly (Bite, Nasty Plot, Slam), Breloom → Cinccino (Double Slap, Covet, Tail Slap),
        Kingdra → Lopunny (Dizzy Punch, Agility, Return). Bosses: Magmortar → Regigigas (Knock Off, Slow Start, Payback,
        Crush Grip), Gyarados → Lickilicky (Wrap, Swords Dance, Wring Out, Hyper Beam), Salamence → Porygon-Z (Psybeam,
        Nasty Plot, Tri Attack, Hyper Beam).
      - The replaced Pokémon's sprites, cries and sprite-fit entries are gone (nothing else used them). Checked headless:
        every new one's intro, size and intent bubble. The sim (`pokeDB-sim`) still needs its enemy ids mirrored
        (variants such as `oldStatus`, `gloomPoison1`): this session couldn't attach that repo.
   11. **More relics and items, and the Fire/Water catch-up** (agreed 2026-09-27: ~30 relics and ~8 items, so the
      pool goes 28 → ~58 relics and 12 → ~20 items; a run sees ~41 relics, 3-4 runs' worth, like StS's ratio).
      Two sessions:
      - **11a: relics.** **Run in the CLOUD** (both repos). Session prompt:
        > Do roadmap step 6c.11a (read CLAUDE.md, docs/roadmap.md and docs/card-design.md first). First mirror the
        > 6c.10 enemy changes into pokeDB-sim (the new Normal elites/bosses and their status cards; the last session
        > couldn't attach it). Then add ~30 relics, StS-style, with PokéSprite art: 18 for the types (2 per archetype, one
        > of each type's a rule-changer like Dead Branch / Runic Pyramid / Snecko Eye), 9 any type can get, 3 boss relics
        > (big upside with a real catch, like the Choice items). At least half should change how you play, not just add
        > numbers. Add relic rarity tiers (common / uncommon / rare, StS's weights; treasure and elites lean rarer),
        > replacing the lone `rare` flag's role where it fits. Recalibrate sim/ranks.json (calibrate()) so the bot picks
        > relics by value, then a human-bot pass at Levels 0/3/5 (300+ runs/cell): keep Level 0 near ~75%. Update
        > CLAUDE.md and the roadmap and push both repos to main.
      - **11a done (2026-09-27).** 30 relics (58 in all), rarity tiers, PokéSprite art; the list and what each is modelled
        on are in CLAUDE.md's Relics. The sim mirrors them all, ranks.json is recalibrated (200 runs/relic/type) and the
        sim has a browser-free runner (`sim/run-node.mjs`, README). Human bot, 400 runs/cell, fire / grass / water:
        before (the 28 old relics, 300 runs) L0 74.3 / 72.7 / 70.3, L3 62.3 / 55.0 / 48.7, L5 33.0 / 30.0 / 30.3;
        after L0 71.3 / 79.3 / 73.3, L3 51.5 / 55.5 / 51.0, L5 27.3 / 28.8 / 26.3. What moved it: this game leans on
        relics hard (with none, even the strong bot wins ~10% at L0), so 30 middling relics thinned Fire's and Water's
        offers of the healing ones (Fire L3 62 -> 44 at first; with the new relics banned from the pool it's 61 again).
        Retuned: Tamato Berry +2 (it was never wired in), Black Sludge's HP only on the turn's first attack, Salac Berry
        on every HP loss, Smoke-Poke Tail 4, Big Malasada 15, Eviolite 3 block every turn (Orichalcum never fired for
        Water), Lum Berry also draws, Dragon Fang 10, Gooey Mulch 2 Seed, and the old Heat Rock heals 2 per burn tick
        (Fire L0 68 -> 71, L3 43 -> 52). No effect: Spelon Berry at full Burn, Griseous Orb at 1 strength, Leftovers
        and Shell Bell as commons (all within noise). The bot never builds for Fire's combo relics (Dawn Stone, Spelon
        Berry, Smoke-Poke Tail), as with its combo cards: those are for playtests.
        Parked during this session: the user's "make the game explain itself" notes (Anytime list below).
      - **11b: items and the Fire/Water catch-up.** **Run in the CLOUD** (both repos). Session prompt:
        > Do roadmap step 6c.11b (read CLAUDE.md and docs/roadmap.md first): add ~8 items (StS potions, PokéSprite art),
        > including one per type that feeds an archetype (e.g. Water gaining Tide). Since the 6c.11a relics, Levels 3/5
        > are ~2-4 points harder than before and Fire/Water trail Grass a little there: try small buffs (Withdraw 7 was
        > far too much for Water). Run the bot with `sim/run-node.mjs` (see its README). Human-bot pass at Levels 0/3/5
        > (300+ runs/cell), Level 0 near ~75%. Update CLAUDE.md and the roadmap and push both repos to main.
      - **11b done (2026-09-27).** 8 items (20 in all), each on a StS potion, PokéSprite art, an item `rare` tier
        (weight 1, ₽90): Black Flute (Weak 3), X Accuracy (Vulnerable 3), TM (choose 1 of 3 cards of your type, free this
        turn), HP Up (rare, +5 max HP, map too), Revive (rare, Fairy in a Bottle: 30% HP when you'd faint), and per type
        Burn Drive (Fire: double Burn, StS's Catalyst), Absorb Bulb (Grass: Leech Seed 4), Fresh Water (Water: 5 Tide).
        Catch-up: Dive 8 -> 9 block (upgrade 12) and Flame Body 8 -> 10 (upgrade 12).
        Human bot, 400 runs/cell, fire / grass / water: old items L0 74.3 / 82.3 / 65.0, L3 49.3 / 56.5 / 46.8, L5 25.8 /
        30.5 / 23.8; new items L0 72.8 / 73.5 (77.8 on a re-run: noise is ~±4) / 68.5, L3 51.0 / 56.0 / 49.0, L5 28.8 /
        33.5 / 28.3; shipped (with the buffs) fire 79.5 / 57.8 / 29.3, water 72.3 / 56.3 / 31.5 (grass as above). Tried and
        dropped: Blaze +4 and Torrent 3 Tide (within noise), Flame Wall 9 (Fire L0 81.3, L3 62.0, L5 35.5: 4 copies is
        too much). Also: the sim's `cardScore` is memoised, so a run is ~5x faster.
        **Also added (the user's request that night): a Relics and an Items tab in the Index** (the Card index,
        renamed): every relic and item, a dark silhouette until met in a run (offered, sold or found), with found
        counts. See CLAUDE.md's Top bar and start screen.
        **For the user to check:** TM's picker reuses Fusion Flare's card layout; Revive's news rides on the hit's own
        text line; Fire L0 ~79 is a bit above target (it was the weakest at L3, so the buff went in anyway).
7. **Pokédex, then catching** (2–3 sessions). Each completed biome page grants a permanent perk
   (the user's idea, 2026-09-26), on top of the achievement and PokéCoins below.
   **Pokédex done (2026-09-27, overnight session); catching still waits for the user.** See CLAUDE.md's Top bar and
   start screen. A `📕 Pokédex` window (Poké Ball menu, so the map too, and a red button beside Index on the start
   screen), a page per biome with its 12 wilds, 3 Alphas and 3-4 bosses (No.001-055). Entries are "???" silhouettes until
   fought (seen: name, type chip, moves in order), then complete once beaten (a Poké Ball mark, flavour text, weakness).
   First defeats say "X's data was added to the Pokédex!" after the fight's coin lines. Finishing a page pays PokéCoins
   once (100 / 150 / 200) and turns on its perk, listed locked with the page's progress bar at the top of the page and in
   the Achievements window: **Mom's Savings** (Clearing: start runs with ₽50, Neow's gold), **Chansey's Gift** (Shrine:
   start with a Potion, Neow's potions), **Oak's Advice** (Wastes: once per biome, a Reroll button beside Skip on a
   card reward). Fight rooms pick unbeaten Pokémon twice as often. No save bump (old saves load with an empty dex and
   run saves with no `rerollBiome` just have their reroll unused).
   Bot (human bot, 400 runs/cell, sim `cfg.dexPerks` = all three perks) fire / grass / water, no perks -> all three
   perks: L0 79.0 / 80.5 / 76.8 -> 80.8 / 83.0 / 78.8, L3 62.8 / 54.5 / 49.3 -> 61.5 / 69.5 / 59.3, L5 35.8 / 27.3 / 32.8 ->
   37.5 / 41.3 / 37.8 (noise ~±4). Level 0 barely moves, but Grass/Water at Levels 3/5 gain 5-15 points, nearly all from
   fewer biome-1 deaths (the Potion and ₽50 at the start). Shipped as is: the perks are earned late (every Pokémon on a
   page, bosses included) and a new player never has them; **step 8 should measure each perk alone and, with the Game
   Corner perks, decide whether to soften one (e.g. the Potion only from the 2nd biome) or retune.**
   **For the user to decide / check:**
   - The perks lift Levels 3/5 for Grass/Water by 5-15 points once earned (above): fine as an endgame reward, or too much?
   - The "achievement" for a page is a row in the Achievements window's new "Pokédex pages" list, not a starter unlock
     (every achievement there unlocks a starter; a page unlocking one would need 3 new starters).
   - The roadmap's "fight rooms on the map show a silhouette until beaten, then sprite and weakness" isn't done: it
     would show every wild on the map (only elites/bosses are scouted today) and change routing. Your call.
   - Coin amounts (100 / 150 / 200) are a guess; step 8 reviews the whole coin economy.
   - Seen = fought (a map's boss silhouette doesn't count); moves show at seen, per your note; amounts aren't shown
     (they grow per biome and Level, so a base number would mislead).
   - Perks are always on once earned (no toggle), like the Game Corner's.
7b. **Pokédex research levels** (the user's idea, 2026-09-27, agreed that day; 1 small session, after step 8). One defeat
   still unlocks an entry and counts for its page and perk (the user asked whether to require 3; bosses are met once per
   biome per run, so 3 of each would take a dozen-plus runs and the Wastes page a dozen winning runs). On top, Legends:
   Arceus-style research: every entry counts its defeats, the reward text box says "Oddish defeated 2/3" after a win, the
   entry shows its count, and at 3 (bosses 2) it's **Research complete**: a gold mark in place of the red Poké Ball and more
   detail (each move's numbers at that biome). Each completed entry pays a small one-time PokéCoin bonus (the user's call:
   wild 25, Alpha 50, boss 100: 36 wilds, 9 Alphas and 10 bosses make ~2350 over all 55, about ten winning runs'
   worth, a real second source of coins for the shinies), and completing every entry pays one big bonus (1000, the jackpot) with a
   "Pokédex complete" line in the result window and the Achievements list (a new way to earn, not an easier run; no
   per-page research bonus, since the page's first-defeat reward already exists). Save: `dex.count: { id: n }` (old saves start from their `defeated` list as 1 each).
   **Run in: CLOUD.** Session prompt:
   > Do roadmap step 7b, Pokédex research levels (read CLAUDE.md and docs/roadmap.md first, especially step 7 and 7b).
   > Count defeats per Pokédex entry, say "X defeated n/3" after a win, mark Research complete at 3 (bosses 2) with a gold
   > mark and each move's numbers, pay a small one-time PokéCoin bonus per completed entry (wild 25, Alpha 50, boss 100)
   > and a big one (1000) for completing every entry. Old saves must load (seed
   > counts from `dex.defeated`). Test at phone (390x844, 375x667) and PC widths with Playwright, update CLAUDE.md and the
   > roadmap, and push to main. No balance change, so no bot run is needed.
   **Done (2026-09-27, chain session 1).** As agreed: one defeat still unlocks an entry; every entry counts its defeats
   (`dex.count`, old saves seed 1 per beaten entry), the reward text box says "Oddish defeated 2/3." after each win until
   the goal, then "Oddish defeated 3/3: Research complete! +25 PokéCoins." Tiles show `n/3` under the name, and a gold
   Poké Ball mark and gold tile once complete ("★ Research"); the entry's zoom says its research count and, once complete,
   its HP and each move's numbers. The whole-dex 1000 is told in the reward box (or the result window after the final
   boss), again in the result window at the run's end, and is a "Pokédex complete" row under Pokédex pages in
   Achievements (with the research count). The header shows `★N` for completed entries. No balance change, no bot run.
   **Decisions for the user to check:**
   - The numbers are Level 0's at that biome and before the type chart (the entry says so): attacks include the biome's
     extra damage, Alphas show Rampage, status moves show the junk they add (e.g. "+1 Poison").
   - Defeats past the goal are still counted but not announced (no line after "Research complete").
   - A refresh on a reward screen replays the fight, and that replayed win counts as another defeat (like the coins, it's
     a fight you won again). If a refresh lands between earning the 1000 and the next map, the result window at the run's
     end won't repeat the line (the coins are already paid).
   - Coin Finder's +15% applies to research and jackpot coins, like every other PokéCoin.
8. **Game Corner perks and coin economy** (1 session): only 4 perks today, so PokéCoins run out of
   uses. **Agreed list (the user, 2026-09-27): exactly these, 4 new perks (4 -> 8), each levelled like the current
   ones (`Lv n/m`):**
   - **Bag Pocket** (StS's Potion Belt): carry 4 items instead of 3 (`ITEM_SLOTS`).
   - **Mart Card** (StS's Membership Card): Poké Mart prices lower, cards, relics, items and removal (e.g. 10 / 15 /
     20% by level).
   - **Move Tutor Notes** (Neow's upgrade blessing): start each run with one starting card PP Upped, you pick which.
   - **Scout Report** (StS's Question Card): a fight's card reward shows 4 cards instead of 3.
   Plus two ways to keep earning that don't make runs easier: **shiny starters**, a shiny version of every starter
   bought with coins (Showdown's shiny sprites; swapped in on the starter screen, map and battle; cosmetic only, a
   toggle once owned), and **PokéCoin rewards that grow with the Trainer Level** played. The new perks all make runs
   easier (and the Pokédex adds 3 more: mirrored in the sim as `cfg.dexPerks`), so finish with a bot pass at Levels 0/3/5 (the sim needs the Game Corner perks mirrored)
   and retune enemies (not the perks) if Level 0 drifts well above ~75% (human bot, no perks bought, is the baseline
   a new player sees; also check with all perks maxed).
   **Done (2026-09-27, the last overnight session).** See CLAUDE.md's Economy. Perks now show `Lv n/m`:
   - **Bag Pocket** (300): 4 items. **Mart Card** (150 / 250 / 400): 10 / 15 / 20% off every Mart price and the removal.
     **Move Tutor Notes** (300): PP Up one starting move before the first room. **Scout Report** (350): 4-card rewards.
   - **Shiny starters**: a third Game Corner row, 150 (the free three) / 200 (skins) / 300 (legendaries), only for a starter
     you own; buying switches it on, a ✨ Shiny toggle on the starter sheet switches it. Swapped in everywhere via
     `spriteUrl()` (90 PokeAPI shiny GIFs), with a sparkle burst when it comes out of its ball in battle.
   - **Coins grow +10% per Trainer Level** (Level 5 pays +50%), shown on the deck screen's level rules and How to play.
   - Old saves load (new perks start at 0, no shinies). No run-save bump (`tutorLeft` missing = 0).
   Bot (human bot, 400 runs/cell; sim `cfg.perks` = { id: level } or 'max', which includes the old four perks the sim
   never modelled before; `cfg.dexPerks` = true or a list), fire / grass / water:
   - **No perks** (what a new player sees): L0 79.5 / 79.3 / 72.8, L3 59.3 / 54.5 / 49.5, L5 34.8 / 29.3 / 31.0. Level 0
     is ~77%, near the ~75% target, so **no enemy retune**.
   - **Each perk alone at L3** (vs 59.3 / 54.5 / 49.5; noise ~±5): Mom's Savings 61.3 / 61.0 / 51.0, Chansey's Gift
     67.8 / 57.3 / 59.0, Oak's Advice 57.5 / 57.3 / 57.5, Bag Pocket 61.3 / 56.8 / 53.3, Mart Card Lv 3 56.0 / 55.0 / 55.3,
     Scout Report 60.8 / 56.8 / 55.3, **Move Tutor Notes two moves 67.0 / 83.0 / 72.3** (+8 to +28), one move 66.0 / 75.5 /
     61.0. So Tutor Notes shipped as one move (Neow's own blessing) at 300; the rest are within a few points.
   - **Game Corner perks all maxed** (Tutor Notes at two): L0 95.3 / 98.3 / 95.0, L3 83.5 / 93.5 / 90.0, L5 72.8 / 84.5 /
     74.5. **Every perk, Pokédex too**: two-move Tutor L0 97.0 / 98.8 / 96.3, L3 89.3 / 96.5 / 92.8, L5 73.0 / 85.3 / 85.0;
     shipped (one move) L0 94.8 / 97.8 / 96.5, L5 72.0 / 81.3 / 73.8.
   **For the user to decide / check:**
   - With **everything bought** (~3100 coins of perks and all three Pokédex pages), Level 5 is ~75% and Level 0 ~96%: the
     endgame is easy. That's the permanent-upgrade trade-off (StS has none; Hades-style mirrors do this). If it's too much,
     the old Max HP Boost (+15 HP) and Starting Relic Charm are the likely big ones (not measured alone), or Trainer
     Levels 6+ could be added for maxed players. Level 0 with no perks is unchanged, so new players aren't affected.
   - Move Tutor Notes is still the strongest single perk (Grass +21 at L3: a PP Upped Block/Cotton Guard is +3 block every
     cycle). One level only; the text and price (300) say so.
   - Chansey's Gift (+3 to +10 at L3) is the strongest Pokédex perk; left as is (it's earned late).
   - Every perk shows `Lv n/m`, one-level ones as `Lv 0/1` / `Lv 1/1`, so the row reads the same.
   - Shiny rows show a starter you haven't unlocked as a "???" silhouette you can't buy yet; Mewtwo has no shiny (not
     playable). Legendaries' shiny only changes stages 0-1 (their final stage is already the shiny).
   - The Game Corner shows 6 cells a row with ◀ ▶ past that (8 perks, 18 shinies).
   - Seen at 1280x800 (and at HEAD before this step): the Mart's text box covers half of Leave on short PC windows.

9. **More starters** (agreed with the user, 2026-09-27; ~3-4 sessions, 4-6 starters each). Only Pokémon with matching
   Gen 5 animated sprites (normal and shiny, PokeAPI's black-white `animated/`), not on the enemy roster, and no two-stage
   lines with a made-up middle stage (the user's call). The Gen 6-9 starters wait: they have no Gen 5-style sprites.
   - **6 three-stage skins, bought at the Game Corner (~300 each, a shiny each):** Grass Budew → Roselia → Roserade,
     Sewaddle → Swadloon → Leavanny, Lotad → Lombre → Ludicolo; Water Horsea → Seadra → Kingdra, Spheal → Sealeo → Walrein,
     Tympole → Palpitoad → Seismitoad. (Fire has no clean three-stage line left: Magby and Litwick are enemies.)
   - **11 legendaries, earned by achievements** (the same sprite for stages 0-1, the shiny as "Ascendant", like Moltres):
     - Entei / Celebi / Kyogre: win on Trainer Level 5 with a Fire / Grass / Water starter.
     - Ho-Oh / Lugia / Palkia: complete the Clearing / Shrine / Wastes Pokédex page.
     - Reshiram: complete every Pokédex entry's research (step 7b).
     - Victini: win a run with a deck of 15 cards or fewer.
     - Heatran: win a run without resting at a Pokémon Center.
     - Manaphy: hold 20 Tide at once in a fight (Water's own mechanic; the "6 Mart relics" idea was dropped as unclear).
     - Keldeo: win a run with every Water starter you own.
   - Needs: starter entries, 6 + 6 shiny sprites each (legendaries 2 + 2), cries (PokeAPI, see step 3), `SPRITE_FIT`
     entries, achievement stats (deck size at the win, no-rest win, max Tide), and the Game Corner rows. Mewtwo stays "unlock
     every other Pokémon" for now; the user will adjust it later.
   - **9a, the 6 Game Corner skins: done (2026-09-27, chain session).** Budew, Sewaddle, Lotad (Grass) and Horsea, Spheal,
     Tympole (Water), 300 PokéCoins each at the end of the Game Corner's Pokémon row, and a 200 shiny each (the skin price in
     `SHINY_COSTS`). 72 GIFs (front/back, normal and shiny, for all 18 stages), 18 cries (PokeAPI's, converted like step 3's:
     Showdown's are still blocked), 36 `SPRITE_FIT` lines. In the starter grid they sit after the Gen 5 skins, a row of Grass
     then a row of Water (no Fire skin, so the grid's usual fire/grass/water columns would have a gap). No save change: old
     saves load as before. Checked headless at 390x844, 375x667 and 1366x900: buying a skin and its shiny, a run and a fight
     with each type (shiny and normal back sprites), no console errors.
     **For the user to check:** the blurbs are mine; the cries' loudness by ear; whether 300 feels right (the shop's total is
     now ~11100 coins). Mewtwo's "unlock every other Pokémon" now needs these six too; a save that already had Mewtwo keeps it.
   - **9b, 6 legendaries by achievement: done (2026-09-27, chain session).** Entei / Celebi / Kyogre (win on Trainer Level 5
     with a Fire / Grass / Water starter) and Ho-Oh / Lugia / Palkia (complete the Clearing / Shrine / Wastes Pokédex page),
     after Suicune in `STARTERS` and `ACHIEVEMENTS` (Mewtwo still last). Types: Entei / Ho-Oh Fire, Celebi Grass, Kyogre /
     Lugia / Palkia Water (their Water-ish side: the list gave none). One sprite for stages 0-1 and the shiny as "Ascendant",
     like Moltres; 24 GIFs, 24 `SPRITE_FIT` lines (PIL median bbox), 6 cries from PokeAPI (-14 dB mean, mono 64 kbps), and a
     300 shiny each (the legendary price; the Game Corner's total is now ~12900). Achievements are now also checked after
     every won fight (a finished page says "Ho-Oh unlocked!" in that reward box) and at the end of a *lost* run too (before,
     only a win or a boss checked, so a goal met in a lost run waited). An old save that already won Level 5 or finished a
     page gets the legendary at its next run's end, listed in the result window. No save change.
     Also fixed in passing: Moltres, Virizion, Suicune and Mewtwo had no cries (not in `CRIES`, no files); they now have
     PokeAPI's, converted the same way.
     Checked headless at 390x844, 375x667 and 1366x900: the grid (a row of Entei / Celebi / Kyogre, then Ho-Oh / Lugia /
     Palkia, Mewtwo centred under), an old-style save granting Entei + Ho-Oh on a lost run, finishing the Clearing page
     mid-run unlocking Ho-Oh, fights as Entei, shiny Kyogre and Lugia, the Game Corner's shiny row, the Achievements window
     (16 now); no console errors.
     **For the user to check:** the blurbs and types are mine; Kyogre's GIF swims high in its frame (its median pose is used,
     like the rest); the new cries' loudness by ear. Level 5 wins are rare (the human bot wins ~30%), so Entei / Celebi /
     Kyogre are the hardest unlocks by design.
   - **9c, the last 5 legendaries: done (2026-09-27, in 9b's session:** the chain couldn't start a 4th session, "lineage depth
     8 (limit 8)", so 9b's session did 9c too). Reshiram (every entry's research done, `dex.complete`), Victini (win with 15
     cards or fewer), Heatran (win without resting at a Center; PP Up there isn't a rest), Manaphy (hold 20 Tide at once),
     Keldeo (win with every Water starter you own). Types: Reshiram / Victini / Heatran Fire, Manaphy / Keldeo Water. New
     stats `smallDeckWin`, `noRestWin`, `maxTide` (old saves merge them in as false / 0; `maxTide` is written by `gainTide()`,
     so Torrent's opening 2 doesn't count but every gain after does). 20 GIFs, 20 `SPRITE_FIT` lines, 5 cries, a 300 shiny
     each (Game Corner total ~14400). No save-shape change beyond the stats, no run-save bump.
     Checked headless at 390x844, 375x667 and 1366x900: a final-boss win at 10 cards with no rest unlocking Victini + Heatran
     (+ Reshiram from an old-style save with `dex.complete`), Keldeo on a Squirtle win once Mudkip had a win, `maxTide` rising
     from a Bubble, fights as Reshiram and Keldeo, the full grid (Mewtwo still centred last); no console errors.
     **For the user to check:**
     - Keldeo's goal grows as you buy Water skins (each owned one needs a win), and a win that unlocks Mudkip holds Keldeo back
       until Mudkip wins too; that's how "every Water starter you own" reads, but you may prefer "every Water type line" or a
       fixed list.
     - Victini at 15 cards is easy-ish with the Center's PP Up and Mart removals (a 10-card start plus ~5 picks); Manaphy's
       20 Tide needs a Drizzle / Tide build. Say if either should be harder.
     - Grass got no legendary in 9c (the list had none): Celebi (9b) and Virizion are its only two.
   **Run in: CLOUD.** Session prompt (repeat for the next batch):
   > Do roadmap step 9, more starters (read CLAUDE.md and docs/roadmap.md first). Add the next 4-6 starters from the list
   > (start with the 6 Game Corner skins), with normal and shiny sprites from PokeAPI, cries, SPRITE_FIT entries and their
   > unlocks. Keep old saves loading, test at phone and PC widths with Playwright, update CLAUDE.md and the roadmap (mark
   > which ones landed), and push to main. No balance change (skins share decks), so no bot run is needed.

Anytime, as a break from number work:
- **Evolution overhaul**: cosmetic only (the user's call, no stat or deck changes): the games'
  evolve animation (flashing silhouette switching between the two forms) plus the evolution
  song, which the user supplies as an MP3.
- **The last 4 event scenes**: Move Tutor, Move Deleter, Day Care, Fan Club.
- ~~**Event choices explained on phones**~~ (the user's note, 2026-09-27; done the same day): an event scene's
  signs (`spotOption()`) explained themselves only in a hover tooltip, which phones never show. Each sign now carries
  a visible caption under its label (`.spot-caption`), and `placeEventSpots()` nudges signs back onto the screen and
  lifts one clear of a lower sign it would cover (Team Rocket's three). Checked headless at 375 and 320px wide.
  Follow-up the same day: the Center's three signs got captions too (`captionedSign()`, spread by `spreadSigns()`), and
  on short phones (375x667, 320x568) the text box under the counter no longer covers Leave: `liftRoomLog()` lifts it
  just clear (13-30px on a 375x667 phone; on 320x568 it covers the foot of the props).
- ~~**Shrine close-up**~~ (done 2026-09-27): the Shrine event "looked very small"; it's now a close-up filling the
  screen, its own `PLACE_ART.altar` scene with a look per biome (leafy grove / misty cedars / obsidian rock), like the
  treasure grotto. See CLAUDE.md's ? events.
- **Hot Spring close-up** (the user's idea, 2026-09-27): it "feels far away"; a very close view, as if you're about
  to step in. Likewise its own `PLACE_ART` scene rather than a prop on the outdoor scene.
- **Make the game explain itself: done (2026-09-27, overnight session).** All three notes below landed:
  - Abilities: an Ability Capsule chip on your battle nameplate (tap it for the text), Gen 5's "Charmander's Blaze"
    banner sliding in on your side when it does something (Torrent on turn 1, Blaze whenever HP drops below half,
    Overgrow when it heals after a win), an "Ability: X" line on the map's run card, and a boxed "Ability: X" on the
    starter sheet.
  - Keyword boxes beside every blown-up card (battle's lifted card, the Index / deck zoom, reward and Mart picks),
    built from `cardTerms()` in `js/data/cards.js`. Retain is now a bold keyword like Exhaust ("Retain." on Water
    Pulse, Cotton Guard...) instead of "Stays in hand between turns." at the end of the text.
  - A small HP plate in the top bar on every choice screen (rewards, events, Center, Mart).
  **For the user to check:** the nameplate chip is the Ability Capsule sprite, not the type icon (Blaze's 🔥 is also the
  Fire type's icon, so it read as a second type chip); on phones the risen card's keyword boxes stack above it, over
  the arena (StS puts them beside it, but a phone has no room); Strength gets a box on every strength card (Growth
  too), Block doesn't (StS shows one for Block, but every card would carry it); the Fusion Flare / TM pile picker
  has no boxes yet.
- **Make the game explain itself** (the user's notes, 2026-09-27, parked while 11a ran; do after the 11 sessions):
  - **Starter Abilities are easy to miss**: the user only found theirs in the Bag's Relics pocket. Ideas: an always-on
    Ability badge on your nameplate (tap for its text), a Gen 5-style "Charmander's Blaze" banner whenever it triggers
    (Blaze turning on, Torrent at a fight's start, Overgrow after a win), a line on the map's run card, and a clearer
    Ability line on the starter sheet.
  - **Keyword tips**: Ethereal, Exhaust, Retain, Tide, Burn, Leech Seed and the rest are only explained in the card
    text's `title` (`termTips()` / `keywords()` in `js/data/cards.js`), which a phone can't reach on a hand card (a tap
    picks it). StS's way: little keyword boxes beside the card whenever it's blown up (battle's lifted card, `zoomCard()`,
    the reward focus).
  - **Show your HP on event screens**: the Hot Spring's choice (soak vs dip) depends on your HP, but nothing there
    shows it. A small `.gb-hp` plate on every `showChoice` screen during a run (events, Center, Mart) would do.
- Missing sound files `hit-super` / `hit-weak` (they fall back to `hit`; the user supplies MP3s).
- Mewtwo's Psychic deck (much later).

### Rules for steps 3–4

- **Rough numbers only, don't fine-tune.** Give each new Pokémon sensible HP and moves in line
  with the ones already in its biome; all real tuning is step 5. Tuning each batch separately
  just gets redone when the next one lands.
- Enemy moves whose real type isn't Fire/Grass/Water get `type: 'normal'` (see CLAUDE.md, Types).
- Every "Normal" slot is a **pure Normal-type** Pokémon, so none has a hidden extra weakness
  (the user's call: Geodude "should" be weak to Water and Grass, so it was swapped out rather
  than adding a fuller type chart). Fire/Grass/Water picks also avoid second types that would
  change their match-ups (no Rock/Ground Fire Pokémon, for example).
- Elites and bosses are neutral, so their types are theme only.
- Each Pokémon appears in exactly one biome (no more Growlithe / Gloom / Arcanine repeats).
- A new Pokémon needs: its Gen 5 animated sprite in `assets/pokemon/<id>-front.gif` (PokeAPI
  sprites, `sprites/pokemon/versions/generation-v/black-white/animated/<dex no>.gif`), its cry
  in `assets/audio/cries/` + `CRIES` in `js/audio.js` (play.pokemonshowdown.com/audio/cries/),
  a `js/data/sprite-fit.js` entry (median bounds over every frame), and its `ENEMY_DEFS` entry.
- Removing a Pokémon: also update Team Rocket's `team` lists in `js/data/events.js`; keep
  Rocket's optional fight no harder than an elite.
- A saved run holds map nodes with `enemyId`s: bump `RUN_SAVE_VERSION` (js/run.js) when
  enemy ids are removed, or old saves will point at missing Pokémon.

## The Pokémon list: 18 per biome, 54 in all

Each biome: 12 wild (3 Fire, 3 Grass, 3 Water, 3 pure Normal, so every starter meets the same
number of good and bad match-ups), 3 elites, 3 bosses (biome 3 has a 4th), all elites and bosses pure Normal
since 6c.10. All Gen 1–5, to match the sprite style;
none are starter lines or Pokémon the game uses elsewhere (Moltres, Suicune, Virizion, Mewtwo,
Chansey, Kecleon).

| | Biome 1: Whispering Clearing | Biome 2: Overgrown Shrine | Biome 3: Ember Wastes |
|---|---|---|---|
| Theme | meadow and pond, baby forms | spirits and folklore | volcano, fully evolved |
| Fire | Vulpix, Growlithe, Pansear | Litwick, Houndour, Darumaka | Magmar, Torkoal, Heatmor |
| Grass | Oddish, Hoppip, Seedot | Bellsprout, Paras, Cherubi | Tangela, Cacturne, Maractus |
| Water | Poliwag, Psyduck, Marill | Krabby, Slowpoke, Shellos | Staryu, Crawdaunt, Sharpedo |
| Normal | Rattata, Sentret, Zigzagoon | Teddiursa, Aipom, Stantler | Tauros, Bouffalant, Zangoose |
| Elites | Raticate, Furret, Linoone | Ambipom, Persian, Watchog | Purugly, Cinccino, Lopunny |
| Bosses | Snorlax, Kangaskhan, Miltank | Stoutland, Exploud, Ursaring | Slaking, Regigigas, Lickilicky, Porygon-Z |

Leaving the game: Pidgey, Zubat, Machop, Geodude, Rhyhorn, Salamence (the current final boss;
it could stay as a 4th biome-3 boss, since bosses are neutral), plus current bosses Magmar
(becomes a biome-3 wild) and Lapras.

Some lines carry across biomes, for a sense of progression in the Pokédex: Rattata → Raticate,
Sentret → Furret, Zigzagoon → Linoone, Aipom → Ambipom, Teddiursa → Ursaring. (Houndoom, Chandelure,
Magmortar and the other non-Normal elites and bosses left the game in 6c.10.)

Possible later expansion to ~70 (per biome: 3 wild, 1 elite, 1 boss):
- Biome 1: Ponyta, Sunkern, Goldeen; Pidgeotto (elite); Vileplume (boss)
- Biome 2: Darumaka, Petilil, Buizel; Xatu (elite); Lapras (boss)
- Biome 3: Torkoal, Victreebel, Whiscash; Aerodactyl (elite); Cradily (boss)
(Some of these were since used in the main list or aren't pure Normal; re-check before using.)

## Pokédex (step 7)

- Fight rooms on the map show a silhouette until you've beaten that Pokémon; after that, its
  sprite and weakness.
- A Pokédex window, probably in the Poké Ball menu, that can also be opened from the map (the user's note,
  2026-09-27).
- Each entry lists that Pokémon's moves (its enemy moves from `js/data/enemies.js`), hidden until you've fought it
  (the user's note, 2026-09-27).
- Finishing a biome's set gives an achievement, PokéCoins and a permanent perk (one per biome).
  Keep them small and different from the Game Corner's (ideas: Clearing: start each run with ₽50;
  Shrine: start with a Potion; Wastes: one free card-reward reroll per biome). They can't be bought,
  so show them locked in the Pokédex window with the biome's progress.
- Unregistered Pokémon show up a bit more often, so the last few entries don't drag.

## Catching (optional, after the Pokédex)

- Poké Balls sold at the Mart, taking item slots. Throwing one at low HP ends the fight early;
  a miss ends your turn. Changes balance, so it needs another bot run.

## Bot harness in a cloud session

The harness is in the user's private repo `patreekare/pokeDB-sim` (add it with add_repo, clone it
next to this repo). It runs in a browser: serve this repo on port 8130 with the harness's `sim/`
folder symlinked in (`ln -s <sim clone>/sim sim`, then `python3 -m http.server 8130`; add `sim` to
`.git/info/exclude`), and drive `sim/index.html` headless with Playwright (Chromium is at
`/opt/pw-browsers/chromium`). `sim/run-headless.mjs` in that repo does this.
