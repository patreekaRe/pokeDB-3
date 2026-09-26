# PokéDB roadmap

The plan agreed with the user (2026-09-25/26). Work top to bottom; update this file as
steps land (mark them done, note anything decided along the way).

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
   1. **Design doc** (`docs/card-design.md`) — done (2026-09-26), **waiting for the user's approval**: the 9
      archetypes, each type's Ability, the new mechanics, and a card-list skeleton per type (name, rarity, cost,
      rough effect, archetype, StS card it's modelled on). Changes from the proposals: Fire's Momentum became
      **Kindling** (exhaust + 0-cost Cinders; Momentum overlapped Water's Flow), Grass's Sustain became **Drain**
      (Leech Seed as Grass's poison, overheal turns into block), Water's third is **Tsunami** and Tide is now all
      of Water's resource. Fire 68 / Grass 64 / Water 63 cards incl. 8 evolution cards each, Neutral 21, and 4
      status cards. The doc ends with 5 questions for the user.
      **The user approves it before any type's cards are built.**
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
   3–8. **One type per 1–2 sessions**: its ~70 cards with PokéSprite art (+ `item-fit.js`), starting deck,
      Ability, a bot check at Levels 0/3/5. The bot scores cards one at a time and won't see combos, so it
      only guards against broken numbers; the user's playtests judge whether builds are fun.
   9. **Neutral pool, build-defining relics, enemy retune** (status-applying moves, bosses that punish pure
      turtling), then a full bot pass.
7. **Pokédex, then catching** (2–3 sessions). Each completed biome page grants a permanent perk
   (the user's idea, 2026-09-26), on top of the achievement and PokéCoins below.
8. **Game Corner perks and coin economy** (1 session): only 4 perks today, so PokéCoins run out of
   uses. Add a few more small ones and a reason to keep earning (e.g. coins scaling with Trainer
   Level). Pokédex perks and new Game Corner perks all make runs easier, so finish with a bot pass
   at Levels 0/3/5 and retune enemies (not the perks) if Level 0 drifts well above ~75% (human bot).

Anytime, as a break from number work:
- **Evolution overhaul**: cosmetic only (the user's call, no stat or deck changes): the games'
  evolve animation (flashing silhouette switching between the two forms) plus the evolution
  song, which the user supplies as an MP3.
- **The last 4 event scenes**: Move Tutor, Move Deleter, Day Care, Fan Club.
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
number of good and bad match-ups), 3 elites, 3 bosses. All Gen 1–5, to match the sprite style;
none are starter lines or Pokémon the game uses elsewhere (Moltres, Suicune, Virizion, Mewtwo,
Chansey, Kecleon).

| | Biome 1: Whispering Clearing | Biome 2: Overgrown Shrine | Biome 3: Ember Wastes |
|---|---|---|---|
| Theme | meadow and pond, baby forms | spirits and folklore | volcano, fully evolved |
| Fire | Vulpix, Growlithe, Pansear | Litwick, Houndour, Darumaka | Magmar, Torkoal, Heatmor |
| Grass | Oddish, Hoppip, Seedot | Bellsprout, Paras, Cherubi | Tangela, Cacturne, Maractus |
| Water | Poliwag, Psyduck, Marill | Krabby, Slowpoke, Shellos | Staryu, Crawdaunt, Sharpedo |
| Normal | Rattata, Sentret, Zigzagoon | Teddiursa, Aipom, Stantler | Tauros, Bouffalant, Zangoose |
| Elites | Gloom, Poliwhirl, Flareon | Ninetales, Shiftry, Slowking | Houndoom, Breloom, Kingdra |
| Bosses | Snorlax, Arcanine, Poliwrath | Chandelure, Tangrowth, Ursaring | Slaking, Magmortar, Gyarados |

Leaving the game: Pidgey, Zubat, Machop, Geodude, Rhyhorn, Salamence (the current final boss;
it could stay as a 4th biome-3 boss, since bosses are neutral), plus current bosses Magmar
(becomes a biome-3 wild) and Lapras.

Some lines carry across biomes, for a sense of progression in the Pokédex: Houndour → Houndoom,
Litwick → Chandelure, Teddiursa → Ursaring, Magmar → Magmortar.

Possible later expansion to ~70 (per biome: 3 wild, 1 elite, 1 boss):
- Biome 1: Ponyta, Sunkern, Goldeen; Pidgeotto (elite); Vileplume (boss)
- Biome 2: Darumaka, Petilil, Buizel; Xatu (elite); Lapras (boss)
- Biome 3: Torkoal, Victreebel, Whiscash; Aerodactyl (elite); Cradily (boss)
(Some of these were since used in the main list or aren't pure Normal; re-check before using.)

## Pokédex (step 7)

- Fight rooms on the map show a silhouette until you've beaten that Pokémon; after that, its
  sprite and weakness.
- A Pokédex window, probably in the Poké Ball menu.
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
