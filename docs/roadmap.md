# PokéDB roadmap

The plan agreed with the user (2026-09-25/26). Work top to bottom; update this file as
steps land (mark them done, note anything decided along the way).

## Chain summary (2026-09-27, second chain)

What the second chain did (details and "For the user" notes in each step below):
- **7b, Pokédex research levels**: every entry counts defeats ("Oddish defeated 2/3"); at 3 (bosses 2) it's Research
  complete, a gold mark, each move's numbers, and PokéCoins (wild 25 / Alpha 50 / boss 100); every entry done pays 1000 once.
- **9a, 6 Game Corner skins**: Budew, Sewaddle, Lotad (Grass) and Horsea, Spheal, Tympole (Water). **Removed again the same
  day: the user had said no to them.** Don't re-add them.
- **9b, 6 legendaries**: Entei / Celebi / Kyogre (a Level 5 win per type), Ho-Oh / Lugia / Palkia (a finished Pokédex page).
  Unlocks are now also checked after each won fight and at the end of a lost run. Moltres, Virizion, Suicune and Mewtwo got
  the cries they never had.
- **9c, the last 5 legendaries**: Reshiram (whole-dex research), Victini (win with ≤15 cards), Heatran (win with no rest),
  Manaphy (20 Tide at once), Keldeo (win with every Water starter you own). Done in 9b's session: the chain hit its session
  depth limit and couldn't start a fourth.

**For you to check:** the new blurbs, types (Lugia / Palkia / Manaphy / Keldeo as Water, Ho-Oh / Reshiram / Victini / Heatran
as Fire; Grass has only Celebi and Virizion) and cries by ear; research numbers show Level 0's values; Keldeo's
Victini at ≤15 cards may be easy (it was: since 2026-09-28 it needs Level 3+, where the capped bot won 63 / 39 / 42% fire / grass / water); the Game Corner's
total is now ~14400 PokéCoins (~20200 since shinies went to 250 / 350 / 500, the user's call the same day). Mewtwo's "unlock every other Pokémon" now needs all 25 others (31 before the 9a skins were removed), the new legendaries included.

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
- Step 7: Pokédex perks lift Grass/Water at Levels 3/5 by 5-15 once earned; fight-room silhouettes on the map were
  dropped (your call, like catching); page coins 100 / 150 / 200 are a guess.
- 6c.11b: TM's picker reuses Fusion Flare's layout; Revive's news rides on the hit's text line; Fire L0 ~79 is a bit high.
- Explain-itself: the nameplate chip is the Ability Capsule, not the type icon; on phones the risen card's keyword boxes
  stack over the arena; Block has no keyword box; the TM / Fusion Flare picker has no boxes yet.
- Seen in passing: on short PC windows (1280x800) the Mart's text box covered half of Leave. Fixed 2026-09-27 (`fitMart()`).

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
     that biome, so the Alpha is lighter than a real elite (no more 700+ HP Rhyhorn). Since 2026-09-30
     Teddiursa/Aipom and Bouffalant/Zangoose: every Alpha is Normal, and a "Neutral" Houndour using Fire
     Fang read as a bug.
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
7. **Pokédex** (2–3 sessions; catching was dropped, the user's call 2026-09-27: "doesn't make sense"). Each completed biome page grants a permanent perk
   (the user's idea, 2026-09-26), on top of the achievement and PokéCoins below.
   **Pokédex done (2026-09-27, overnight session).** See CLAUDE.md's Top bar and
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
   - Map silhouettes for fight rooms: dropped (the user's call, 2026-09-27; it would have shown every wild on the map).
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
     Fixed 2026-09-27: `fitMart()` zooms the shop out to fit.

9. **More starters** (agreed with the user, 2026-09-27; ~3-4 sessions, 4-6 starters each). Only Pokémon with matching
   Gen 5 animated sprites (normal and shiny, PokeAPI's black-white `animated/`), not on the enemy roster, and no two-stage
   lines with a made-up middle stage (the user's call). The Gen 6-9 starters wait: they have no Gen 5-style sprites.
   - **6 three-stage skins, bought at the Game Corner (~300 each, a shiny each): REJECTED by the user; added in 9a by
     mistake and removed again (2026-09-27). Don't add them.** Grass Budew → Roselia → Roserade,
     Sewaddle → Swadloon → Leavanny, Lotad → Lombre → Ludicolo; Water Horsea → Seadra → Kingdra, Spheal → Sealeo → Walrein,
     Tympole → Palpitoad → Seismitoad. (Fire has no clean three-stage line left: Magby and Litwick are enemies.)
   - **11 legendaries, earned by achievements** (the same sprite for stages 0-1, the shiny as "Ascendant", like Moltres):
     - Entei / Celebi / Kyogre: win on Trainer Level 5 with a Fire / Grass / Water starter.
     - Ho-Oh / Lugia / Palkia: complete the Clearing / Shrine / Wastes Pokédex page.
     - Reshiram: complete every Pokédex entry's research (step 7b).
     - Victini: win a run with a deck of 15 cards or fewer.
     - Heatran: win a run without resting at a Pokémon Center.
     - Manaphy: hold 20 Tide at once in a fight (Water's own mechanic; the "6 Mart relics" idea was dropped as unclear).
     - Keldeo: win a run with every Water starter you own (since 2026-09-28: with 3 different Water starters, the user's call).
   - Needs: starter entries, 6 + 6 shiny sprites each (legendaries 2 + 2), cries (PokeAPI, see step 3), `SPRITE_FIT`
     entries, achievement stats (deck size at the win, no-rest win, max Tide), and the Game Corner rows. Mewtwo stays "unlock
     every other Pokémon" for now; the user will adjust it later.
   - **9a, the 6 Game Corner skins: removed (2026-09-27).** The user had said no; their starter entries, shop rows,
     GIFs, cries and `SPRITE_FIT` lines are gone (git history has them). A save that bought one keeps a harmless stale id.
     What the original session did: Budew, Sewaddle, Lotad (Grass) and Horsea, Spheal,
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

Done 2026-09-27 (the user's asks, no bot run): Pokédex payouts raised (research 50 / 100 / 200, pages 300 / 400 / 500, whole
dex 1500, first 5000), a Rewards tab in the Pokédex, the Silph Scope (reveal a fight room's Pokémon, 1 a biome, 3 with the Game Corner's
Scope Upgrade), a volume slider, a quieter low-HP beep, and Main menu keeping the run saved.

**Pile bug (fixed 2026-09-28).** From 6c.11a (the Lum Berry change, 2026-09-27) a misplaced `else` in `resolveCard()`
also put every played power and Exhaust card in the discard pile, so powers stacked every reshuffle (the user noticed Hot
Coals) and Exhaust cards came back. The sim (`sim/engine.js`) had the same bug and is fixed too. Human bot, 300 runs/cell,
fire / grass / water, before -> after: L0 78 / 82 / 75 -> 79 / 77 / 70, L3 59 / 57 / 60 -> 62 / 59 / 53, L5 29 / 31 / 30 ->
34 / 33 / 29. Overall about the same (the bot rarely builds around powers or Exhaust); Water's L0 / L3 drop (-6 / -7) is
about two standard errors, worth a re-check with more runs before retuning.

**Grass/Water catch-up (2026-09-28).** Grass and Water died in biome 1 at Levels 3/5 (its Alpha and boss) while Fire
walked it. Human bot, fire / grass / water, 500 runs/cell: L0 82 / 81 / 71, L3 61 / 54 / 56, L5 34 / 28 / 27. Screened at
150 runs: Cotton Guard 9 grass 82 / 57 / 38, Absorb heal 4 85 / 61 / 47 (too much), Withdraw 7 water 89 / 73 / 45 (too much, as
before), Bubble Weak 2 77 / 60 / 35. Shipped Cotton Guard 9 (upgrade 12) and Bubble Weak 2 (upgrade +2 damage only). Confirmed
at 300 runs, L3 / L5: grass 65 / 37; water 63 / 42 with Bubble+ at Weak 3, so Bubble+ stayed at Weak 2 (the screened version).
Runs are kept to hundreds now (the user's call, CLAUDE.md's Testing section).

## Next sessions (queued 2026-09-27)

Start a fresh session for each (CLAUDE.md, "Keeping sessions cheap").

1. ~~**Evolution overhaul.**~~ Done 2026-09-28 (see the Anytime entry below).
2. ~~**Title, starter select and Collection redesign**~~ Done 2026-09-28 (the dusk title with its gem menu, the StS-style
   character select, the Collection, pixel pills for the menus' buttons; CLAUDE.md's Title screen and Top bar sections).
   The mockups stay in `docs/mockups/`. Left for later, the user to decide: pills for the reward, battle and Mart capsules
   (Add to deck, Skip, End Turn, PP).
3. ~~**Cries.**~~ Checked 2026-09-28: every starter, evolution, legendary and enemy (115 of the 117 Pokémon shown) has
   its cry; only Chansey (the Center) and Kecleon (the Mart) have none, and nothing asks them to cry. Ideas the user may
   pick up later: Chansey / Kecleon greeting you as you walk in, event figures crying in their rooms, a loudness pass.
4. **Cloud save with login.** Code done 2026-09-28 (CLAUDE.md's Cloud save): Firebase, Google and email-link sign-in,
   and a "Two saves found" window when two devices both changed (the user's picks). The user's Firebase project
   (`pokedb-42e7c`) was set up the same day and its config is in `js/cloud-config.js`; next is their first real sign-in. Checked headless with a stand-in Firebase at 390 and 1280px: the
   first sign-in uploads the device's save, a blank device takes the cloud's, changes upload, a reload picks up the other
   device's, a real clash asks, the email link signs in, sign out keeps the save, and signed out nothing loads.
   The user's setup (console.firebase.google.com):
   1. Add project, any name, Google Analytics off.
   2. Build > Authentication > Get started. Sign-in method: Google (enable, pick the support email, Save); Email/Password
      (enable it and "Email link (passwordless sign-in)", Save). Settings > Authorized domains > Add domain
      `patreekare.github.io`.
   3. Build > Firestore Database > Create database, a location near them, production mode. Rules tab, paste and Publish:
      ```
      rules_version = '2';
      service cloud.firestore {
        match /databases/{database}/documents {
          match /saves/{uid} {
            allow read, write: if request.auth != null && request.auth.uid == uid;
          }
        }
      }
      ```
   4. Project settings (gear) > General > Your apps > Web (`</>`), a nickname, no Hosting, Register; the
      `firebaseConfig = { ... }` block goes into `js/cloud-config.js` as `FIREBASE_CONFIG`. Then playtest on the live site:
      sign in on the phone first (its save becomes the cloud save), then on the PC.
5. **Level 5 rewards.** Part 1 done 2026-09-28 (the user's picks; CLAUDE.md's "Level 5 rewards"): a Level 5 win
   unlocks and switches on that starter's shiny, puts a gold star on its portrait and panel, pays 500 PokéCoins the
   first time per type, and Mewtwo's unlock now also needs a Level 5 win. Old saves seed nothing. Part 2 done
   2026-09-28: the Hall of Fame (CLAUDE.md's "Hall of Fame"): a Gold/Silver-style scene after a Level 5 win (your Pokémon
   on a pedestal, its name, the date, its type, the final deck), each entry saved, and a Hall of Fame card in the
   Collection listing them (tap one for its deck). Its music is `assets/audio/hall-of-fame.mp3`, which the user will
   supply; until then it plays `victory`. Then (the user's ask) every won run, at any Level, is saved as a record-book
   page: its deck, relics, items (left and used) and numbers (fights, Alphas, turns, cards played, damage dealt and
   taken, biggest hit, ₽ earned and spent, rests, events, moves forgotten and upgraded). The Collection shows it as two cards,
   Record Book (every win) and Hall of Fame (Level 5 wins, the last card), each a ??? until its first win unlocks it.
   Every win plays the pedestal scene with its stats and deck; only a Level 5 one is the Hall of Fame (song, welcome).
   Part 3 done 2026-09-28: a Level 5 win's scene throws a party (CLAUDE.md's "Hall of Fame"): pixel fireworks in the
   type colours on one canvas, sweeping spotlights, shooting stars, gold confetti and streamers, the Pokémon hops onto the
   pedestal in a fountain of sparkles, a rainbow title, and a giant Poké Ball firework with a white flash and a shake at
   "Welcome to the HALL OF FAME!". Firework sounds are synths; none of it runs under reduced motion.
   ▶ Playtest on the live site (no session needed): open https://patreekare.github.io/pokeDB-3/?levels and win a
   Level 5 run to see it.
6. **Day/night cycle.** Done 2026-09-28 (the user's pick of the recommended scope; CLAUDE.md's "Day and night"): every
   scene follows the device's clock, dawn 5-7, day 7-17, dusk 17-20, night 20-5 (`js/daytime.js`). Biomes use the day /
   sunset / night looks that used to mean wild / elite / boss, plus a new dawn each; elites and bosses follow the clock too
   (the user's call), with a tenser grade over it, the Shrine's spirits and lit lanterns at a boss, and the Wastes' eruption
   and lightning at a boss at any hour. The character select's three scenes, ? events, the open-air rooms (Hot Spring,
   Shrine, Day Care), the rooms' windows and the title's sky follow it too. Lighting is kept apart from scenery, so step 7
   plugs in. `?time=dawn|day|dusk|night` pins it for playtesting.
   ▶ Playtest on the live site (no session needed): https://patreekare.github.io/pokeDB-3/?time=night (or dawn, dusk, day).
7. **A journey through each biome** (planned 2026-09-28, the user's ask: each floor should feel like travelling towards
   the boss). The recommended shape: a "how far along" dial first (each floor moves the scenery a notch: the Wastes'
   volcano grows nearer with more smoke and lava, the Clearing's meadow thickens into forest, the Shrine gains more torii,
   lanterns and mist), then 3 stages plus a boss arena per biome, e.g. Clearing meadow -> forest edge -> deep woods -> an
   ancient giant tree; Shrine foot of the steps -> torii path -> inner courtyard -> the main hall; Wastes ash plains ->
   lava fields -> the volcano's slope -> the crater rim. About half reuse today's painters with the dial, half are new
   ones. The stage decides what's there, the clock the light (step 6), so every stage gets every time for free. The map
   screen shows the stage you stand in. Not 10 unique floors: each is seen for one room, so most of that work would go unseen.
   Part 1 done 2026-09-28: the per-floor progress dial (CLAUDE.md's "Progress dial"): the Clearing's meadow thickens
   into woods with big trees framing it and a canopy closing overhead, the Shrine gains a tunnel of torii, lantern pairs
   along the path and thicker mist, the Wastes' volcano looms nearer with more lava. Checked in headless shots of every
   floor (0-10 and the boss) at every time of day, at 1280x800 and 390x844.
   ▶ Playtest on the live site (no session needed): https://patreekare.github.io/pokeDB-3/ and walk up a biome's map;
   add `?time=night` (or dawn, dusk) to see it in other light.
   Part 2 plan (the user's go-ahead, 2026-09-28: floors should look more unique, still a journey to the boss): 3 places
   plus a boss arena per biome, the dial smoothing within each, and a different small landmark on every floor inside a
   place so neighbouring floors never look alike. Clearing: F1-3 meadow (signpost), F4-6 forest edge (a stream, a log
   bridge, berry bushes), F7-10 deep woods (dark trunks, light shafts, mushrooms, a hollow log), boss an ancient giant
   tree. Shrine: F1-3 foot of the stone steps (bamboo, a guardian statue), F4-6 the torii path (today's tunnel), F7-10
   the inner courtyard (raked gravel, koi pond, bell tower, walls), boss the main hall. Wastes: F1-3 ash plains (dead
   trees, bleached rocks, the volcano far off), F4-6 lava fields (lava rivers, basalt columns, steam), F7-10 the volcano's
   slope (tilted ground, vents, the peak looming), boss the crater rim over a lava lake. Big features at the back and the
   edges: the middle stays clear for the two Pokémon. Landmarks are seeded per floor, so a refresh draws the same one.
   Part 2 done 2026-09-28 (CLAUDE.md's "Places"): the 3 places and boss arena per biome as planned, 30 landmarks (5 per
   place, dealt per run by the map's seed, one per floor), and the map hangs the place's name under the biome sign.
   Checked in headless shots of every floor (0-10 and the boss) at every time of day, at 1280x800 and 390x844, plus the
   outdoor ? events on the new places.
   ▶ Playtest on the live site (no session needed): https://patreekare.github.io/pokeDB-3/ and walk up a biome's map
   (the place's name hangs under the biome sign); add `?time=night` (or dawn, dusk) to see it in other light.

Anytime, as a break from number work:
- ~~**Evolution overhaul**~~ (done 2026-09-28): cosmetic only (the user's call, no stat or deck changes). The evolve
  pop-up is gone; after a boss the victory fanfare plays a moment, the screen flashes white twice and holds white, the
  Pokémon fades in alone and cries, "What? X is evolving!" waits for a tap, then the evolution song plays while it flashes
  white and its dark silhouette switches between the two forms faster and faster; a flash colours the new form in with
  its cry as the song cuts, the `evolved` chime plays with "Congratulations! Your X evolved into Y!" (plus the Max HP /
  heal / move-power line the pop-up used to give), and a tap fades the white out onto the Signature move reward.
  `js/evolution.js`; CLAUDE.md's Battle screen layout has the details. Legendaries (same sprite, shiny final stage) and
  bought shinies work; reduced motion keeps the cries, song and chime but drops the flashing and wipes. Checked headless
  at 375, 390 and 1280px wide.
  The user added the song (`assets/audio/evolution.mp3`, 28 s, as loud as the other tracks) and the chime
  (`assets/audio/sfx/evolved.mp3`, played at 0.55 gain to match item-get / achievement) the same day.
- ~~**Ken's challenge**~~ (done 2026-10-01): a third sign in the Move Tutor's dojo, on Chad Master Kenmatta himself, starts
  a boss fight against him (Alder's sprite, HP 130/220/370 by biome, the biome's boss damage); winning gives his unique
  **Exp. Share** relic (+1 PP and +1 card a turn, 1 strength each battle) and a boss card reward. Not bot-tested: the sim
  has no events. **For the user to check:** how hard he is, and whether the relic is too strong for an optional fight.
  His own stage (2026-10-01): a Mortal Kombat courtyard, Ken on temple steps, a gold Dragonite medallion for the MK dragon
  (`PLACE_ART.kombat`; see `docs/reference/events.md`).
  The medallion was redrawn (2026-10-01) as two hand-drawn grids, 32 and 18 cells, each drawn at whole pixels a cell
  (`medallionFit()`), and also hangs on the dojo wall behind Ken, the chalkboard moved beside it.
- ~~**The last 4 event scenes**~~ (done 2026-09-27): Move Tutor (a dojo: chalkboard and desk for ₽, a sandbag for HP),
  Move Deleter (a candle-lit study: a lectern's open book, a hypnotist's pendulum, a dozing Slowpoke), Day Care (the
  couple's house front, a picket fence, an Egg in a straw nest, Miltank and Marill) and Fan Club (portraits, pennants, a
  red carpet to a spotlit stage, Persian and Cinccino). Each choice plays out first (chalk writing, the sandbag swinging,
  the book's words fading, the pendulum's rings, the Egg wobbling, confetti). See CLAUDE.md's ? events.
  The same day the four outdoor events (Berry Tree, Wishing Well, Item Ball, Team Rocket) became close-ups too: their
  scenes zoom in (bigger pixels) as far as their props fit the screen width, so nothing looks far away any more.
  **For the user to check:** the zoomed scenes' chunkier pixels (1.75x on PCs, less on narrow phones); the figures (Slowpoke, Miltank, Marill, Persian, Cinccino) are my picks from sprites the
  game already had; the Day Care couple and the tutor themselves aren't shown (no trainer sprites for them yet).
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
- ~~**Hot Spring close-up**~~ (done 2026-09-27): it "felt far away"; it's now its own `PLACE_ART.spring` scene, standing
  at the edge of a big steaming rock pool (soak) with a little pool below it fed by a bamboo spout (dip), a bamboo fence
  with the ♨ board, stone lanterns and a bath bucket. A look per biome: a sunny garden with maple leaves, misty cedars
  with autumn leaves, a milky pool under volcanic rock with steam vents and embers. The user also asked to see their HP
  there: every event where HP decides the choice (Hot Spring, Berry Tree, Shrine, Item Ball, Team Rocket, and the
  new scenes below) shows a slim HP row under the title (`eventVitals()`; first a full nameplate, slimmed the same day at the user's ask), and its bar runs to the new
  HP before the room closes (`showHpChange()`). The signs say where you'd end up ("Heal 11 HP, to 46/70").
- **Biome 2 boss intro** (done 2026-09-30, `a71dc25`): on the map walk, the boss stays a grey silhouette. After the boss
  wipe, the empty Main Hall wakes: lanterns light down the approach, mist rolls in, wisps gather into a torii-shaped
  spirit gate, then the shoji doors open with spirit light and paper wards before the flashes, boss cry/reveal and player's
  Poké Ball entrance. Reduced motion keeps the pause and regular cries/entrance but skips the scenery animation. The full
  map-to-battle flow was checked at 375×812, 390×844, 768×1024, 1024×700 and 1280×800; no horizontal overflow, boss in
  bounds, five-card hand present, and no console errors. The browser's local preview was also checked end to end.
- **Biome 3 boss intro** (done 2026-10-01, `f3bc32a`): the user found the shared fallback the same as Biome 1's and wanted
  something "way cooler". The crater erupts: the screen shakes, the sky reddens, fissures split the far wall and the rim at
  your feet, the lake boils and swells into a dome, then bursts into a lava column throwing bombs that splat on the
  foreground, and the column floods sideways into the white flashes (CLAUDE.md, Map screen). New synth sounds `quake` and
  `eruption`. Checked in a real Wastes boss fight at ~580x783; **for the user to check:** the sounds' volume, and PC size.
- **Biome 1 and 2 boss intros, epic pass** (done 2026-10-01): the user asked for both to be "just as insanely epic" as
  the eruption. Both now run the Wastes' timing (3.6 s wake + 1.1 s handoff, with screen shake). The Clearing's tree
  wakes: sap veins, roots tearing towards you, a blooming wave, a leaf cyclone, light motes and a beating heart, then a
  pillar of light, a shockwave and a leaf-storm flood. The Shrine summons its spirits: three bell tolls, night falling,
  lanterns turning to blue spirit fire, a cyclone of paper wards, a colossal ghost torii rising to frame the screen, and
  spirit fire along the roof, then a burst through the roof and the spirit light flooding out of the doors (CLAUDE.md,
  Map screen). New synths `bloom`, `bell`, `spirit`. Checked frame by frame (contact sheets of the canvas) at 375x812
  and PC size, no console errors; **for the user to check:** in a real boss fight on the live site, and the new
  sounds' volume.
  Follow-up (same day): the user saw that all three climaxes were a big vertical beam and wanted each biome to end
  differently. The Clearing's heart now bursts into one colossal pink blossom with a sideways petal gust, its handoff
  flowers opening over the whole screen; the Shrine's burst is a spinning seal of spirit light (round the hall and flat
  across the courtyard) that flares and throws fox-fires, its handoff a ring flood out of the doors. Only the Wastes
  keeps a column. Checked frame by frame at PC size; **for the user to check:** in a real boss fight.
- **Biome intros** (Biome 1 and 2 done 2026-10-01, Biome 3 2026-10-02): the user asked for a 5-10 s intro on entering each biome, clearly
  showing its title and "a cool scenery thing", inviting rather than menacing like the boss intros. `js/biome-intro.js`,
  played over the map by `startBiome()` (after the checkpoint, so a refresh skips it), ~9 s, tap / Enter / Escape skips.
  The Clearing's: letterbox bars, the camera drops through the clouds past a flock of birds, then glides sideways in
  parallax (mountains, hills, tree line, a meadow with a stream) while three of the biome's wild Pokémon pop out of tall
  grass with a rustle and their cry (silhouettes until the Pokédex has seen them), and comes to rest on the Ancient Tree
  glowing on the horizon as "BIOME 1 / WHISPERING CLEARING" drops in letter by letter with the four places underneath.
  Lit for the time of day. New synths `rustle` and `biome-title`. Checked at 375x812 and 1280x800, day / dusk / night,
  through New game, no console errors. **Next:** the Shrine's and the Wastes' (an `INTROS` entry each, their own
  painters, a different camera move, and the same walk on through their places towards the Main Hall / the crater);
  **for the user to check:** on the live site with sound.
  The user's follow-up (same day): only the place you're in shows under the title, bigger ("- MEADOW -", `.bi-place`; the
  list of all four gave the later places away); Pokémon the Pokédex has met (seen, defeated or counted) pop up as
  silhouettes and colour in a beat later, unmet ones stay black; and every later place gets a **mini intro**
  (`placeIntro()`, ~5 s, from `nextPlace()` in `showMap()` once the last room of Meadow / Forest Edge is
  won or left, 2026-10-01; it used to wait for a tap on the next room and cut that room's music): your Pokémon's back sprite walks up a dirt path towards the Ancient
  Tree while the layers grow about its foot (nearer ones faster), the place's name drops in under the biome's. Per place
  in `INTROS.clearing.stages`: the Tree nearer each time (taller upright, its crown spreading on wide screens), the tree
  line taller, the land and sky shaded; Deep Woods adds great trunks either side, a leafy fringe with vines, light shafts,
  fireflies and falling leaves. This is the pattern for every biome: travelling towards its goal.
  **Biome 2** (same day): `run()` split into a shared shell and a per-biome `scene`. The Shrine's film is a crane shot up
  its mossy steps through a tunnel of torii, the lanterns lighting in pairs with a wind chime each, to the Main Hall above
  the mist (a distant temple bell, fox-fires round its glowing doorway); Pokémon pop out of shrubs by the steps. Place
  walks: Torii Path (gates close together) and Inner Court (gravel, walls, the hall up close). Checked at 375x812 and
  1280x720, day and dusk, no console errors. **Next:** the Wastes' (towards the crater); **for the user to check:** on the
  live site with sound (the chimes' and the bell's volume).
  **Biome 3** (2026-10-02): a rush forward. It bursts out of an ash cloud and swoops low over the Ash Plains (a Mode 7
  ground redrawn each frame, rocks / dead trees / vents as billboards, ash and embers streaking past) to the smoking
  volcano, which huffs (smoke, sparks, a soft rumble) as "EMBER WASTES" lands; Pokémon pop up from behind rocks. Place
  walks up a trail: Lava Fields (lava pools and a river) and Volcano Slope (the cone filling the sky, lava channels). New
  synths `gust` and `rumble-far`. Checked frame by frame at 390x844 and 1280x800, day / dawn / dusk / night, no console
  errors. **For the user to check:** on the live site with sound (the gust's and rumble's volume). Still to do: the Crystal
  Depths' (with its art).
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
- Mewtwo's Psychic deck: now the v1.0 plan, see "v1.0: Mewtwo and the fourth biome" below.

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

## v1.0: Mewtwo and the fourth biome (the user's plan, 2026-09-28)

The game's true ending, and what turns the title's v0.9 into v1.0 (`js/data/patchnotes.js`: a new `PATCHES` entry at the
top, and the "Coming in v1.0" section of 0.9 stays as history). Slay the Spire's Act 4 / Heart is the model: a hidden
last act only a special run reaches.

**Settled (the user's calls):**
- **Mewtwo is its own game mode.** Its run goes through the three biomes and then a **fourth biome** that only Mewtwo can
  enter. No other starter ever sees it.
- **Mewtwo should feel really strong**: it's meant to shred biomes 1-3 (a victory lap through places you struggled in),
  then biome 4 is a real fight, strong but still a bit challenging.
- **Biome 4 has one set difficulty.** Whatever Trainer Level the run is on, arriving in biome 4 always plays the same
  numbers, so the ending is the same test for everyone.
- **Mewtwo has no Trainer Level** (the user's call, 2026-09-28). Its Prepare step (`prepare()` in `js/select.js`) hides the
  ◀ n ▶ Level picker, its rule and "All rules", and the run plays one fixed setting from start to end: biomes 1-3 at a set
  of numbers tuned for Mewtwo's strength (part B picks them; `modsFor()` isn't read), biome 4 at its own. A Mewtwo win
  counts for nothing Level-based (no `maxLevel` unlock, no `level5WinsBy` star, no Level 5 jackpot or shiny); its own
  rewards are part D's.
- **Its boss is the final boss: "the last energy".** My suggestion was Eternatus (a creature of raw energy, Sword/Shield's
  Darkest Day, Eternamax as a giant last form); Arceus, Deoxys or Mew (a twist on Mewtwo's origin) are the others. The
  user picks.

**Open (ask the user before building each part):**
1. ~~The final boss~~ settled 2026-10-02: **Eternatus**.
2. ~~Biomes 1-3 for Mewtwo~~ settled 2026-10-02: a **short sprint**, one place per biome; after the user's playtest the
   same day, one road per biome (fight, fight, elite, Mart, Center, boss) that Mewtwo shreds, with money to shop.
3. ~~Trainer Levels for biomes 1-3~~ settled, see above.
4. ~~Biome 4's name, place and look~~ settled 2026-10-02: a **crystal cavern** with no day/night clock, the **Crystal
   Depths** (Cave Mouth, Crystal Halls, Deep Core, and the arena Energy Well). Its wilds are themed to the place (strong,
   fully evolved cave Pokémon shown as Neutral or Psychic), its Alphas and boss pure Normal as everywhere. Its art is
   still to paint: `BIOME_ART` look(s), the places' painters and landmarks, a boss intro and a biome intro, a real map
   palette, `map4` music (a placeholder borrows `map3.mp3`).
5. **Rewards**: a 4th Pokédex page (its wilds, Alphas and boss, with a perk), its own Hall of Fame entry style (a
   different pedestal or scene), and a title-screen touch once it's beaten (the final boss crossing the sky, say).
   Mewtwo's shiny (`SHINY_COSTS` skips it today).

**Parts, one session each:**
- **A. Mewtwo's deck — built 2026-09-29.** The user chose Force / Barrier / Mind Games and Pressure (start each fight
  with 2 Focus). The Psychic pool is 20 common / 26 uncommon / 14 rare plus 8 evolution cards; its 10-card starter deck
  follows the existing 4 attacks / 4 blocks / 2 signatures pattern. Psychic is neutral both ways. The character select and
  Card Index now show Psychic, Mewtwo's power-up GIFs already exist, and `comingSoon` is off. Run-end guards keep interim
  Mewtwo runs out of Level-based rewards until Part B removes its Level picker. All card effects reuse existing mechanics;
  the sim mirrors Pressure and those effects. Strong-bot check: 500 Level-0 runs with generic Water-ranked relic picks
  won **495/500 (99%)**; no Biome-1 elite deaths, and all five losses were to Biome-3 bosses. This clears the ~95% target
  for the first three biomes.
- **B. The fourth biome — gameplay built 2026-10-02** (scenery is placeholder, see B2). The user's answers are under Open
  above. What landed (CLAUDE.md, Mewtwo, has the map of it):
  - **Mewtwo mode**: `MEWTWO_MODE` / `runMods()` / `runFloors()` in `js/data/difficulty.js`. No Level picker; biomes 1-3
    are 5-floor sprints at Level 0's rules (fight, fight/event, treasure, Mart/elite, Center, boss; `generateMap({ floors })`,
    `setFloors()` / `setRows()` in `js/map.js`), the Crystal Depths 10 floors at its own `BIOMES` numbers. No save version
    bump: the saved run's shape didn't change (a part A Mewtwo run in progress just carries on under the new rules).
  - **Sprint rework (after the user's playtest, 2026-10-02)**: they died in biome 3, had no ₽ for the first Mart, and
    wanted a speedrun. Biomes 1-3 are now one fixed road each, `['fight', 'fight', 'elite', 'shop', 'rest']` then the boss
    (`roadMap()` in `js/map.js`), with `prizeMult` 2.5 (new mod, ~₽150 at the first Mart), and biome 2 `normalHp` 0.7 /
    `bossHp` 0.85 / `enemyDmg` -5, biome 3 0.55 / 0.7 / -12. Human bot, 150 runs: road alone 76.7 (5 biome-3 deaths: the
    elite is no longer optional), mid trim (0.8 / 0.9 / -3, 0.65 / 0.8 / -8) 82.0, **strong (shipped)** 76.0; at 300,
    82.3, every loss in the Depths. Biome 2-3 fights now cost 2-5% HP in 3-5 turns, like biome 1's wilds (biome 3's were
    ~10% in 6 turns). The first biome's elite and boss (~15% each) are the sprint's hardest fights.
    `?mewtwo` unlocks Mewtwo for playtests.
  - **Events and power (the user's calls, 2026-10-02)**: the road is now fight, fight, ? event, elite, Mart, Center, boss;
    Mewtwo's attacks deal 25% more in biomes 1-3 (`playerDmg` 1.25, `battle.dmgMult`, a 🧬 "Unleashed" badge), on top of
    the trims above; and those biomes' defeats don't count for Pokédex research (`afterFight()`: a sprint would farm it).
    Achievements can't be farmed anyway: Mewtwo only unlocks once every starter is (Reshiram needs the whole Pokédex).
    Not yet bot-checked: `sim/engine.js` needs `playerDmg` and the event room before it can be.
  - **The gate**: `finalBiome(starter)` replaced every `BIOMES.length - 1`. After the Biome 3 boss a Mewtwo run gets
    `depthsGate()` (a full heal and "Go down", since it has no form left) and its card / relic rewards, then the Depths.
  - **Roster** (sprites, cries at ~-14 dB, `SPRITE_FIT` by the PIL median bbox, which matched six existing entries
    exactly): wilds Crobat, Sableye, Gigalith, Steelix, Excadrill, Haxorus, Golurk, Bronzong, Claydol, Dusknoir, Lanturn,
    Magnezone; Alphas Clefable, Ditto, Smeargle; boss **Eternatus** (800 HP; PokeAPI's `other/showdown/890.gif`, a Gen
    5-style pixel GIF). Tests for a strong deck: heavy shields (Iron Defense / Cosmic Power 12-22), scaling (Dragon Dance
    4, Calm Mind), status cards, and **traits** (`TRAITS`): Iron Barbs / Rough Skin / Own Tempo (`barbs`: each attack you
    play hurts you 2-3), Analytic / Levitate / Imposter (`analytic`: +3-5 strength per Power you play), Sturdy / No Guard /
    Magic Guard / Eternatus's Pressure (`stamina`: block for every card past your 4th in a turn).
  - Pokédex: the Depths stays the ??? tab (`DEX_PAGES` skips `secret` biomes), so `dex.complete` doesn't move. Records show
    its boss row and "x/4" only once it's been reached. Per-biome event numbers and Kenmatta's HP have a 4th value; Team
    Rocket brings Crobat / Sableye there.
  - **Bot check** (pokeDB-sim now mirrors Pressure, the Mewtwo mode and the traits; Mewtwo borrows Water's relic ranks):
    first cut (hpMult 7, dmgBonus 34, bossBonus 40, Eternatus 720) strong 89.3 / human 88.0 (150 each), every loss in
    biome 4; biomes 1-3 kill ~0-1% (the victory lap works). Screened at 150 strong: dmg 38 / boss 46 / hp 7.5 85.3, dmg 42
    / boss 50 / hp 8 74.7 (15 of its 25 points lost to wilds), dmg 40 / boss 54 / Eternatus 820 76.7, **dmg 38 / boss 58 /
    hp 7.5 / Eternatus 800 78.7** (losses: boss 9, wilds 7, Alphas 5), shipped. Confirmed at 300: strong 78.3 (biome 4 deaths: boss 8, wilds 7, Alphas 6);
    human 72.3 (boss 11, wilds 9, Alphas 6); biome 3's boss took 1% in each. Part D's final pass re-checks it.
  - **Softer wilds (the user's playtest, 2026-10-02)**: they died to a Depths wild fight ("the enemies hit hard"). A
    14-damage move landed for 52 (+38); the bot blocks it all (it lost only 2-15% HP a wild fight), a person doesn't. The
    Depths' `dmgBonus` is now 31 (wilds and Alphas -7; Eternatus's `bossBonus` 58 unchanged). Human bot, 150 runs each
    (sim now mirrors `playerDmg`): before 88.0 / 91.3, after 94.7 / 92.7; nearly every loss is Eternatus.
  - **B2 (Desktop, LOCAL or CLOUD with screenshots): the Crystal Depths' art.** Its scenery, places and landmarks, the
    biome intro and the boss intro, the map palette, a pad, `map4` music from the user.
- **C. The final boss fight** as a set piece: several phases (Eternatus -> Eternamax, say), its own music, the storm at
  30% at its most dramatic.
- **D. The ending**: its Hall of Fame / Record Book entry, the 4th Pokédex page's perk (the page itself is a "???" tab since 2026-09-28, `renderMystery()` in `js/pokedex.js`, 12 + 3 + 1 placeholder tiles; part B swaps it for a real `DEX_PAGES` entry, and must keep it out of `ALL_IDS` / `dex.complete` until biome 4 exists, so the 55-entry jackpot isn't taken away), achievements, the
  completionist extras above, then the v1.0 patch notes and a final balance pass (bot runs over all three types, and
  Mewtwo's biome 4 win rate: aim for Mewtwo winning most runs but able to lose, e.g. strong bot ~70-80% in biome 4).

**Run in: CLOUD.** Next-session prompt (part C): "Read AGENTS.md, CLAUDE.md, and docs/roadmap.md's 'v1.0: Mewtwo and the
fourth biome'. Parts A and B (Mewtwo's deck, the Crystal Depths' gameplay) are done. Ask me what part C needs, then build
Eternatus's final boss fight as a set piece (phases, Eternamax), with a bot check. Attach pokeDB-sim too."

**Run in: Desktop app (visual).** Next-session prompt (part B2): "Read AGENTS.md, CLAUDE.md, and docs/roadmap.md's 'v1.0:
Mewtwo and the fourth biome'. Paint the Crystal Depths: replace the placeholder `BIOME_ART.depths` with its own scenery,
places, landmarks, biome and boss intros, and map palette."

## The Sealed Gate: why every run matters (the user's idea, agreed 2026-10-02)

A story for doing run after run, like Slay the Spire's climb to the Heart: something is sealed below the three biomes,
the Crystal Depths, and Eternatus's energy leaking out of it is **why the wild Pokémon and bosses are so aggressive**.
Every run fights its way down to the seal. **Mewtwo is trapped behind it** (as it hid in Cerulean Cave). Breaking the
gate frees Mewtwo as a starter, and its own run (Mewtwo mode, v1.0 above) goes down into the Depths to face Eternatus,
the source.

**Settled (the user's calls, 2026-10-02):**
- **After every won run, the starter attacks the gate**: a short scene after the win scene (before the result window),
  the gate's health bar drops, and its HP is **saved** (a new save field, old saves start it full).
- **Harder Trainer Levels hit harder** (small at Level 0, big at Level 5), so everyone gets there and skilled players
  faster. **Losses that reach the third biome's boss chip it a little** (StS: a lost run is still progress).
- **The gate replaces Mewtwo's current unlock** (every other starter unlocked + a Level 5 win, the last `ACHIEVEMENTS`
  entry): breaking the gate *is* the unlock.
- **Only a Level 5 win can deal the final blow**: lower Levels can take it down to a sliver, never to 0, so Mewtwo still
  feels earned.
- **Old saves**: Mewtwo stays unlocked for anyone who has it. Wins already in the Record Book (`hallOfFame`) count as
  damage already dealt, so long-time players don't start from zero.
- **It shows its damage**: cracks, light through them, and from about half HP Mewtwo's silhouette behind it. Also on the
  title screen, so progress shows every time the game opens.

**To settle when it's built**: the gate's HP and the hit per Level (aim: ~10-15 wins at mixed Levels, fewer if most are
high Levels), the loss chip, where the gate lives in the UI between runs (title screen, start screen, its own window),
and whether Mewtwo mode stays out of it (it should: Mewtwo is what's behind it).

**Parts:**
- **A. Gameplay (CLOUD)**: **done 2026-10-02.** Numbers (the user approved): 1000 HP; a win hits 40 / 50 / 60 / 75 / 90 /
  120 at Levels 0-5; below Level 5 it stops at 50; a loss at the third biome's boss chips 15; Mewtwo's runs don't count.
  So ~11 wins climbing the Levels once, ~13-15 mixed, ~9 mostly Level 5. The back-fill stops at the sliver too, so an old
  save's next Level 5 win breaks it (and gets part B's break scene). The locked Mewtwo's panel shows the gate's HP. Was:
  the save field, damage per run in `endRun()`, the Record Book back-fill, swapping Mewtwo's
  achievement for the gate (keeping it last in `ACHIEVEMENTS`, and existing unlocks), a plain health bar and a line in
  the result window. No bot check needed (no fight changes).
- **B. The scene and art (Desktop)**: **done 2026-10-02.** The gate is painted in code at any size (`js/gate.js`):
  cracks out from the seal leaking light, the runes going out, chains snapping at half HP and near the end, Mewtwo's
  silhouette from ~55% HP, broken steps down into violet light. After the win scene, `js/gatescene.js` plays the attack
  (each type's move, stronger for a win and an ultimate for a Level 5 win; a loss chip uses the weakest), the bar and
  cracks running down together; the break whites out, blows the door apart and Mewtwo steps out in colour with its aura.
  Playtest links: `?gate=NNN`, `?strike=NN` (see CLAUDE.md).
  **Stages and bar (2026-10-02, the user's call):** the damage shows in steps, past 75 / 50 / 25% then broken (a chain
  snaps at 50%, the other at 25%), each step jolting the gate open mid-hit with its lines; its HP is the seal bar (gem,
  stage runes, trailing damage) in the scene and the result window.
  **Follow-up (2026-10-02, the user's calls):** the gate left the title screen (and Mewtwo the flyers): it's only seen
  at a run's end, so its progress is a reason to win another. A loss at the last boss deals nothing now; the scene still
  plays, and your Pokémon is too weak to harm the seal. The story is told in the scene (the first visit's lore, then
  what higher Levels would deal). The art is fantasy rather than bricks: crystal spires, an obsidian and gold frame of
  glowing glyphs, a turning magic-circle seal. `?lockmewtwo` relocks a playtest unlock.
  **The broken gate on the title (2026-10-02, the user's ask):** once broken and Mewtwo is free, the open gate stands on
  the title's ledge; a tap swells its violet light with Mewtwo's cry and opens Mewtwo's Prepare step. Before the break
  the title still shows nothing. Playtest: `?mewtwo&gate=0`.
  **The strike card (2026-10-02, the user's ask):** every gate scene deals your move as a card: hold to charge (a ring
  fills, your Pokémon gathers energy, Android buzzes), let go and it flies into the seal. Gold foil for the break, grey and
  cracked for a loss. Damage unchanged. Built for phones (no long-press menus or selection). Playtest: `?strike=90&gate=400`.

**Run in: CLOUD.** Next-session prompt (part A): "Read AGENTS.md, CLAUDE.md, and docs/roadmap.md's 'The Sealed Gate'.
Build part A: the saved gate HP, damage after each won run (more at higher Trainer Levels; only a Level 5 win can break
it) and a small chip for losses at the third biome's boss, the Record Book back-fill for old saves, and the gate
replacing Mewtwo's current unlock (players who have Mewtwo keep it). Propose the HP numbers before building."

**Run in: Desktop app (visual).** Next-session prompt (part B): "Read AGENTS.md, CLAUDE.md, and docs/roadmap.md's 'The
Sealed Gate'. Part A is done. Build part B: the gate's art in its damage stages, the after-run attack scene, the break
scene that frees Mewtwo, and the gate on the title screen."

## Post-v1.0: the Safari Zone daily run (the user's idea, planned 2026-10-02)

A daily seeded run in a new place of its own, the **Safari Zone**, with a **capture** mechanic and hundreds more Pokémon
to collect in a **Safari Pokédex**. Catching stays out of the main game (see Catching below); here it's the point of the
mode, so it makes sense. It unlocks once the main Pokédex is fully researched (`dex.complete`, Reshiram's achievement).

**Settled (the user's calls, 2026-10-02):**
- **One theme, the Safari Zone**, not separate leaderboard biomes. It has ~6 **areas** (Johto's Safari Zone is the model):
  Meadow, Forest, Wetland, Marsh, Peak, Desert. Each day's seed picks **3 of them** as that run's three biomes. Each area
  is a habitat whose roster fits it (Wetland: Water; Peak: Rock/Ice...), so a wanted Pokémon means waiting for its area's
  day: the daily hook. Art is one look (fences, tall grass, Safari signs) with 6 painted area scenes.
- **The daily seed**: the same run for everyone on a UTC date: map, enemies, rewards, and a **fixed starter** the seed
  picks (any starter but Mewtwo, owned or not, so the leaderboard is fair).
- **One button, one mode** (the user's call, 2026-10-02): the Safari Zone *is* the daily run. A single **Safari Zone**
  button on the start screen (locked until `dex.complete`), with a line under it naming today's areas ("Today: Wetland ·
  Peak · Desert"). No separate Daily button.
- **Catching on the first try too** (the user's call, 2026-10-02): every Safari run can catch, the leaderboard try
  included; it costs the turn and a miss gives the enemy a free hit, so it's a risk, not a shortcut.
- **Attempts**: the **first try of the day counts for the leaderboard**; after it, unlimited replays of the same seed for
  catching (they count for the Safari Pokédex, not the board).
- **Capture**: once an enemy's HP is red (below 25%), a **Throw Ball** button appears. Throwing costs the turn's energy;
  a miss and the enemy acts. Odds rise with lower HP, the ball, and your debuffs on it (Burn, Leech Seed, Weak, Sap: the
  games' sleep/paralysis bonus, so every type helps). A catch pays less ₽ than a knockout (money vs a card and an entry).
- **What a catch gives** (Claude's recommendation, the user agreed): the Pokémon's **Safari Pokédex** entry, plus its
  **signature card offered for the run, take or skip** like a card reward, so catching never bloats a leaderboard deck.
- **Poké Balls in the Game Corner**: cheap ones as consumable stock (Great, Ultra), special ones as permanent unlocks:
  Dusk Ball (better at night, `js/daytime.js`), Quick Ball (turn 1), Timer Ball (better the longer the fight), Net Ball
  (Water and Grass), Luxury Ball (bonus coins), and a Master Ball, one a week.

**Proposed, to confirm with the user when its phase comes:**
- **Rare spawns** that flee after a few turns if not caught (weaken it fast without knocking it out).
- **Safari-only cards**: Bait (easier to catch, but it hits harder) and Rock (takes more damage, more likely to flee).
- **Daily modifiers** on top of the areas ("all Pokémon are Water today", "Burn does double"), maybe tied to the clock.
- **The third area's boss**: the Safari Warden's ace, or a weekly "zone legend" catchable only on the last floor.
- **Roster at scale**: ~10 enemy role templates (striker, tank, debuffer, status-spammer...) scaled per biome, so each new
  Pokémon is a data line (species, type, area, template, signature move + its card), added ~50 a session. Sprites from
  PokeAPI, loaded on demand (hundreds are a few MB, fine on Pages).
- **Leaderboard** on the existing Firebase (`js/cloud.js`): fastest win, fewest turns, most caught. Needs sign-in.

**Engineering note**: every gameplay roll must come from a seeded RNG for a daily seed to be the same run for everyone.
About 40 `Math.random` calls today (run.js 13, rewards.js 7, battle.js 7, map.js 4, data/enemies.js 3...); gameplay ones
move to a seeded generator, cosmetic ones (celebrate, audio, title, transition, scene) stay as they are.

**Phases, one or more sessions each:**
1. **Seeded RNG + the Daily button**: the seeded generator through every gameplay roll, a Safari Zone button on the start screen
   (today's areas under it; locked until `dex.complete`), the day's 3 areas and fixed starter, the first-try flag, a small starting roster per
   area. Playable day one, without capture yet.
   **Built 2026-10-02** (cloud, a draft PR): `js/rng.js` (mulberry32; `random()` is Math.random unless a Safari run set a
   stream: one per biome, `biome:N`, and one per room, `room:N:id`, so a room plays the same whatever came before it and a
   refresh replays it exactly), every gameplay roll moved onto it (Fisher-Yates instead of `sort(() => Math.random() - 0.5)`,
   which differs between browsers). `js/data/safari.js`: the 6 areas with borrowed wild rosters (8 each, from the main game's
   wilds; the area's place in the run sets their strength, elites and boss), `safariDaily(day)` = seed, 3 areas, starter.
   The title's 5th gem, **Safari Zone** (green; greyed with a padlock until `dex.complete`, a tap says why), shows today's
   starter and areas and starts the run (`beginSafari()` in `js/run.js`: Level 0 rules, `run.safari`, saved with the run).
   `save.safari = { day, tries }`: the try is counted at the start, so quitting can't retry the first; the result window
   says whether it counted, and its button is "Try again". A Safari run adds nothing to the main Pokédex, Record Book,
   Trainer Levels, the Sealed Gate, or the per-starter/per-biome stats (its starter isn't yours); it pays PokéCoins.
   Tests: `node --test` (tests/seed.test.mjs; a GitHub Action runs it). Checked headless: two fresh browsers on the same day
   got the same map, enemies and opening hand.
   **Open for the user**: Game Corner and Pokédex perks still apply in a Safari run (HP Boost, Relic Charm, Scout Report...),
   so two players' runs differ; strip them for the leaderboard try? The map and battles still use the main biomes' scenery
   and music until the areas' art (phase 5).
2. **Capture and Poké Balls**: Throw Ball at red HP, catch odds, the take-or-skip card, the Game Corner balls. Bot check
   (the sim needs the seeded run and the throw) that catching doesn't make the run easier than knocking out.
3. **The Safari Pokédex**: its own window/tab, entries by area, caught/seen marks, area progress.
4. **The roster at scale**: role templates, then batches of ~50 Pokémon a session.
5. **Leaderboard** on Firebase, and the 6 areas' art (Desktop).

**Run in: CLOUD.** Next-session prompt (phase 1): "Read AGENTS.md, CLAUDE.md, and docs/roadmap.md's 'Post-v1.0: the
Safari Zone daily run'. Build phase 1: a seeded RNG for every gameplay roll, the Safari Zone button showing today's areas (locked until the Pokédex is
fully researched), the day's 3 Safari areas and fixed starter from a UTC-date seed, the first-try leaderboard flag, and a
small starting roster per area. Ask me about anything the plan leaves open first. Attach pokeDB-sim too."

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

- ~~Fight rooms on the map show a silhouette until you've beaten that Pokémon~~ (dropped, the user's call 2026-09-27).
- A Pokédex window, probably in the Poké Ball menu, that can also be opened from the map (the user's note,
  2026-09-27).
- Each entry lists that Pokémon's moves (its enemy moves from `js/data/enemies.js`), hidden until you've fought it
  (the user's note, 2026-09-27).
- Finishing a biome's set gives an achievement, PokéCoins and a permanent perk (one per biome).
  Keep them small and different from the Game Corner's (ideas: Clearing: start each run with ₽50;
  Shrine: start with a Potion; Wastes: one free card-reward reroll per biome). They can't be bought,
  so show them locked in the Pokédex window with the biome's progress.
- Unregistered Pokémon show up a bit more often, so the last few entries don't drag.

## Catching: dropped

The user's call (2026-09-27): it doesn't make sense for this game. (The idea was Poké Balls from the Mart that end a
fight early at low HP.)
Exception (2026-10-02): the **Safari Zone daily run** is built around catching, in its own mode; see "Post-v1.0: the
Safari Zone daily run". The main game still has none.

## Bot harness in a cloud session

The harness is in the user's private repo `patreekare/pokeDB-sim` (add it with add_repo, clone it
next to this repo). It runs in a browser: serve this repo on port 8130 with the harness's `sim/`
folder symlinked in (`ln -s <sim clone>/sim sim`, then `python3 -m http.server 8130`; add `sim` to
`.git/info/exclude`), and drive `sim/index.html` headless with Playwright (Chromium is at
`/opt/pw-browsers/chromium`). `sim/run-headless.mjs` in that repo does this.
