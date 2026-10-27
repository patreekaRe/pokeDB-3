# PokéDB roadmap

Only what's still open. Everything finished (steps 1-9, the card pool, v1.0 and Mewtwo, the Sealed Gate, the Safari
Zone, the Small asks) is in `docs/roadmap-done.md`, with its decisions, bot numbers and old session prompts; older notes
that say "the roadmap's step N" mean that file. When something here lands, move it there (a line or two is enough)
and take it out of this file, so this stays short.

Every session prompt starts with its "Run in:" line (CLAUDE.md, "Cloud or local").

## Open, ready to build

**▶ PLAYTEST ON THE LIVE SITE. No twin cards: done 2026-10-26, on `main`** (the user's ask: Bubble and Bubble Beam in one
hand, "no cards that repeat ... all across the board"). 197 cards have new moves so no two cards one run can meet read
alike (`docs/card-twins.md` lists each: what it read like, before, now); `tools/card-twins.mjs` finds any and
`tests/cards.test.mjs` fails on them. Kenmatta's 20 trials were rebuilt on the new cards (the user's pick). Bot check
(`docs/reference/cards.md`'s "The twin pass"): every type within noise of before, Fighting after giving its block back. On a phone: a few runs of each type and a Duo Run or two; say which new
moves feel off or too strong, and whether "Imprison" (was Disable+) and the unplayable Splash read clearly. In the dojo
(`?dojo&trials`): Patience is a new puzzle, and seven trials' HP changed. **The Safari signature cards too, done 2026-10-27
on `main`** (the user picked Claude's recommendation): 424 of the 514 got new lines so none reads like a card any run meets
or like another signature card (`docs/card-twins.md`'s last section; `tests/safarimons.test.mjs` holds them to the twin
rule now). In the Safari: catch a few Pokémon a run and say which new signature moves feel weak, too strong or unclear.

**▶ PLAYTEST ON THE LIVE SITE. Mid-run reloads, round seven: done 2026-10-19, on `main`, waiting on the user's phone**
(`docs/reference/walk-in-rooms.md`, "One side-wall painting"). The full `tools/budget-check.mjs` passed before the change;
a new `tools/run-probe.mjs` (fight after fight on one page) found no growth over a run, the map level near 120 MB and each
fight peaking near 185 MB. Fixed: every ? room, gym and town painted its side wall twice (towns 10-21 MB less each, the
gym 9, the dojo 8; budgets recorded lower). On a phone: a long run, towns and gyms included; Settings' Save group lists
any reload (`js/crumbs.js`) with where it happened. **Round eight done 2026-10-24** (branch `claude/pc-app-launch-000m1y`,
on `main` too): a Center or Mart left for the map now sleeps (`putAway(view, scene, renderer)`), and every looped song
is folded to mono once decoded (the user's pick over a lower sample rate). Headless, the map after a Center 85 -> 52 MB,
after a Mart 100 -> 58, one context awake instead of two; a song's decoded memory halves. On a phone: a long run with
Centers and Marts, and whether any song sounds wrong on headphones. **Round nine 2026-10-25** (on `main`): the user's
phone reloaded at Biome 1's crossroads after a double tap on the Shrine road's board. Headless, the taps grow nothing (12
double taps on the board: flat), and a whole Clearing run on one page shows no runaway growth (map ~50 -> ~120 MB over
the biome, all bounded caches: one Mart, one Center, the arena's ground per stage, the last two rooms). Fixed: the
biome's last two rooms (its gym's hand-over and a ? room) stayed kept beside the next town as it was built; walking on
now lets them go (`forgetBiome()`, `docs/reference/walk-in-rooms.md`): headless, a whole Clearing run into Lantern Village
peaks ~232 MB in the town instead of ~260 (a scratchpad probe, not kept). A town's folk load in over its first ~2.5
minutes and then hold (Lantern Village alone ~150 -> 155.5 MB, flat after). On a phone: the crossroads and the first town
after Biome 1, and what Settings' Save card says if it reloads again.

**▶ PLAYTEST ON THE LIVE SITE. Perf audit of the Clearing, the Safari areas and the Duo Run: done 2026-10-21**
(`docs/roadmap-done.md`; branch `claude/perf-audit-clearing-features-xshrrn`, pushed to `main` too). On a phone: a Duo
Run's map should feel smoother; its rare-spawn and material badges still glow and bob, reachable rooms still blink.
**Leads not taken, measured** (▶ Run in: CLOUD, effort medium, only if a phone still lags or reloads): on the map, style
recalc stays ~100-170 ms a second in headless Chrome with only composited animations running (the coin's `filter:
brightness` spin is the last repainting one, ~50 ms/s; dropping its flash is a look call for the user); during a run the
Clearing's vista canvas (`hub-vista.js`, 7.3 MB) and the character select's sky layers (`select-sky.js`, ~6.6 MB, its frame
loop ticking unseen under the Clearing) stay held. The title's `pressBlink` is gone (2026-10-24: its button has been
invisible since 2026-10-08); `tdevGo` didn't run unseen when checked that day. `NODE_PATH=$(npm root -g) node tools/fps-probe.mjs --only=duo-map,clearing` measures them.

**▶ PLAYTEST ON THE LIVE SITE. Safari shinies everywhere: done 2026-10-19, on `main`, waiting on the user** (the three
sessions are in `docs/roadmap-done.md`). Look at `?sparkle=3` (every Safari shiny lent at ★3: the Safari Pokédex's ✨
switch, Secret Base residents with `?base&guests&sparkle=3`), `?lbsample=safari` (the ✨ rows) and the Ranger board's
Feats tab, and say what to change. **One thing only the user can do**: publish `firestore.rules` again in the Firebase
console (the leaderboard's steps in `docs/reference/safari.md`), or a result with shinies posts without its ✨.

**▶ PLAYTEST ON THE LIVE SITE. The towns' and the Clearing's draw calls: done, waiting on the user's phone check** (all five towns merged,
2026-10-17 / 18; numbers in `docs/roadmap-done.md` and `docs/reference/towns.md`'s "Merged buildings"). On a phone, each of
`?town=ruins&towns`, `thornwood`, `savanna`, `shrine`, `wastes` (`&gymwins=1` for the leaders' homes): smoother, nothing
sunk, bent or gapped, banners and flags still sway, roofs still fade behind you. The Clearing too (2026-10-18, ~459 -> ~243 a frame,
`mergeStill()`; `docs/reference/hub-base-mall.md`): on a phone, the walls and roofs whole, the cauldron's fire flickering,
every place still tapped. Not queued, the user's call: the towns' ground extras (Cinder Springs' lava field, Driftwood's
rowboats and jungle). `tools/draw-probe.mjs` measures a place and walks into every door.

**Six new types for the Safari's duo pool: Electric, Ice, Fighting, Ground, Flying, Dark** (the user's go, 2026-10-19:
"let's add the 6"). The plan and its reasons are in Ideas' "Safari duos, real types and new areas" (the duo, the Duo pass,
real types in the Safari, why six); the approved rules are `docs/duo-design.md`. Safari only at first: a duo run starts with Fire / Water / Grass, and catching a new
type's starter in its area adds it to your duo pool.
**Live on `main` since 2026-10-20** (after session 15; the new areas from the same day, the user's call). Before that, the **branch rule** (the user's call, 2026-10-19, like `towns` and `secret-base`): all of it lives on branch **`duo-types`**
(and pokeDB-sim's `duo-types`), never pushed to `main` until the user says it goes live. A session starts from
`duo-types`; a session working alongside another (below) works on its own `duo-types-<part>` branch and merges into
`duo-types` when done, the later one to finish resolving the merge. Playtest links are githack links on its commit.
**When it goes live** (one step, not a session's: every area session leaves it): set `SAFARI_FROM` in
`js/data/safari.js` (the Power Plant, the Ice Cave, Dojo Mountain, the Quarry, the Windy Cliffs and any area added since) to **the day after** the merge
reaches `main` (UTC), in the same push, so no Safari day already played is dealt again. It reads 2026-10-20 on the branch. The
branch's `NEXT` patch lines (one per type) are past `RELEASE_AT`: cut that patch in the same merge.
**One at a time from now on** (the user's call, 2026-10-19, after 0 and 2 ran side by side): run the sessions
below in order, one each; the side-by-side rule that follows stays only in case that changes. **Two at a time** (the user's earlier ask): 2 (real types) can run beside 0 (its rules are settled above and it works with
today's single starter), on `duo-types-realtypes`; 1 runs after 0, and 15 alone at the end.
From 3 on, two sessions can run together when they are different types (Electric's first beside Ice's first, or a
type's second beside the next type's first), never two halves of the same type. Since a duo puts two types in one run,
the later of the pair re-runs `tests/cards.test.mjs` after merging and fixes any same cost + same text twin across
types, and any clash of two new keywords for the same idea.
Sessions, in order, each ▶ Run in: CLOUD (both repos):
0. ~~**Design doc**~~ **done 2026-10-19** (`docs/duo-design.md`, approved: the user clicked through its 22 choices,
   its section 8). The rules every session below builds to: one shared HP bar, switch for 1 PP, STAB x1.2, the one out's
   type and Ability, a 5 + 5 deck, the **Duo Run** (a replay with the Day Pass, unlocked once the day's Daily run is
   finished), the Gen 5 chart capped at x1.3 / x0.75, and per type its archetypes, Ability, area and **3-stage starters
   only** (the user's call): Electric **Shinx** / Mareep / Pichu / Elekid / Tynamo, Ice **Vanillite** / Swinub, Fighting
   **Timburr** / Machop, Ground **Trapinch** / Rhyhorn, Flying **Starly** / Pidgey / Pidove, Dark **Deino** / Sandile.
1. ~~**The duo, the Duo Run and the duo pool**~~ done 2026-10-19 on `duo-types` (both repos; `docs/roadmap-done.md`,
   `docs/reference/safari.md`'s "The duo and the Duo Run"). Answer 13 applied first (Gen 5 types). **Waiting on the
   user**: (a) **the duo's starting deck**: the bot found duos ~20 points under solo (fire+grass / fire+water /
   grass+water 67 / 56 / 59 vs solo fire / grass / water 86 / 78 / 76), and it's the 5 + 5 halves of answer 6 (each
   type loses its second signature; Water Pulse has no Tide). Halves of **1 basic attack, 2 basic blocks and both solo
   signatures** (Ember, Flame Wall x2, Scorch, Will-O-Wisp / Vine Whip, Block x2, Seed Bomb, Absorb / Water Gun,
   Withdraw x2, Bubble, Dive) measured 83 / 73 / 79, level with solo: a one-line `DUO_DECK` change if the user says yes.
   (b) **switching at 1 PP rarely pays**: the bot gains ~3 points from dodging a super-effective hit and loses 8 by
   switching for STAB, so the free-switch cards (Volt Switch, Baton Pass, Shed Shell) matter; a cheaper switch is the
   other lever. (c) **cross-type twins**: a duo now meets two types' pools, and 12 pairs read alike across types (Ember /
   Vine Whip / Water Gun "Deal 7", Scorch / Seed Bomb, Solar Beam / Firestorm, Withdraw / Flame Wall...). The test keys
   on type (a duo plays them differently: STAB, the chart), so they stay unless the user wants them renamed.
   Playtest: the commit's githack link with `?duorun&coins=500`, the Safari lobby's Duo key.
1b. ~~**Two decks**~~ done 2026-10-19 on `duo-types` (both repos; game `82bd1b7`+, `docs/duo-design.md` section 1 and
   answers 23-28, `docs/reference/safari.md`'s duo section). Each partner its own solo deck, piles and hand; settles
   session 1's (a) and (c). Bot: fire+grass 80 (level with solo), fire+water 56, grass+water 50 vs solo 81 / 79 / 67: the
   **Water pairs trail by ~15-25**, for the balance pass (15). (b) the switch is worth 1 PP for a fresh hand when 2 PP
   stay back. Playtest: the githack link with `?duorun&coins=500`, the Safari lobby's Duo key.
2. ~~**Real types in the Safari**~~ done 2026-10-19 on `duo-types-realtypes`, merged into `duo-types` (both repos;
   `docs/roadmap-done.md`, `docs/reference/safari.md`'s Real types). Built on the 18-type chart as the prompt said. The user's answers settle both its opens:
   **Gen 5** (answer 13), so session 1 first runs `tools/real-types.py --gen5` and the tests; and the x0.5 floor (a double resist is x0.75, as the
   user picked). Grass's 6-point drop in the Safari is left for the balance pass.
3-14. **One new type in two sessions** (effort: high for a type's first session, which brings its new mechanics;
   medium for its second, which follows them) (~35 cards each, 70 a type; card rewards split 50/50 between a duo's types): its cards with art, `describe()` / `cardTerms()` lines, Ability, starters (GIFs,
   `SPRITE_FIT`, cries), its area's data on a recoloured existing area (the doc's section 7) and the catch that adds it
   to the pool; sim mirror and a bot check of its pairs. Order: Electric, Ice, Fighting, Ground (after Ice's first:
   Sandstorm uses Ice's Weather engine), Flying, Dark.
15. ~~**The balance pass**~~ done 2026-10-20 on `claude/balance-36-pairs-b2cpn5` (both repos, off `duo-types`; merge it into
   `duo-types`; `docs/duo-design.md`'s "The balance pass", `docs/roadmap-done.md`). The pairs 38-90 -> 51-74. **Waiting on the
   user**: the playtest; whether Torrent firing each time Water comes back (it bends answer 5) stays; Water's pairs still
   ~8 under. **Live 2026-10-20** (the user's call: "push it all"): `duo-types` merged into `main` in both repos, `SAFARI_FROM`
   2026-10-20 for the six new areas (the user's call: today, not the next day), patch 1.28 "Duo Run" cut from `NEXT`.
- **The new areas' art** (the user's pick: data first, art after): each new area's scene, intro film, boss prelude and
  arena, one or two areas a session, after the type sessions or beside the balance pass.
3. ~~**Electric's first**~~ done 2026-10-19 on `duo-types` (both repos; `docs/duo-design.md` section 5's "Electric's
   first session", `docs/reference/safari.md`'s duo section; `docs/roadmap-done.md`). 30 pool cards + 8 evolution cards
   with art, Static / Overcharge / Volt Switch, the Static Ability, Shinx (`DUO_STARTERS`), Shed Shell and Baton Pass
   (Duo Runs only), the sim mirror. The bot made the starting deck Fire's shape (Thunder Shock 8 x3, Eerie Impulse,
   Magnet Rise 8 x4, Spark + Vulnerable, Thunder Wave + Weak) and the caps 7 / 11 / 15 +3. Bot (300 a duo): electric+fire
   69, electric+grass 45, electric+water 42 vs fire+grass 78, fire+water 57, grass+water 44; solo electric 78 (150; fire 71,
   grass 69, water 59). Playtest: the githack link with `?duorun&duopool&coins=500` (the Duo key, Electric lent), or a
   solo fight `?arena=fight&starter=shinx&cards=volt-switch,discharge,electric-terrain`. **Waiting on the user**: the
   playtest, and whether Static's numbers feel right (a wild one Paralyzed at 7).
4. ~~**Electric's second**~~ done 2026-10-19 on `duo-types` (both repos; `docs/duo-design.md` section 5's "Electric's
   second session", `docs/reference/safari.md`'s duo section; `docs/roadmap-done.md`). 36 more cards (defence-leaning, 74
   in all) with art, Magnet (the old `magnet` relic renamed Quick Powder) + 6 relics, Electric Gem and Shock Drive, the
   Card index's Electric tab, Mareep / Pichu / Elekid / Tynamo looks, and **the Power Plant** (a 7th area, date-gated by
   `SAFARI_FROM`, Peak's painters recoloured). Bot (300 a duo): electric+fire / +grass / +water 64.7 / 43.7 / 36.3, ~7 under
   session 3's Electric, still between Grass and Water as a partner: left for the balance pass (15). Playtest: the
   githack link with `?duorun&duopool&powerplant&coins=500`, or `?area=powerplant`, `?bossfight=powerplant&starter=pichu`.
   **Waiting on the user**: the playtest; the Quick Powder rename (`SAFARI_FROM`: the branch rule's go-live step).
5. ~~**Ice's first**~~ done 2026-10-19 on `duo-types` (both repos; `docs/duo-design.md` section 5's "Ice's first
   session", `docs/reference/safari.md`'s duo section; `docs/roadmap-done.md`). 30 pool cards + 8 evolution cards and the
   Icicle token with art (`js/card-art-ice.js`), Frostbite, Icicle, the Weather engine (Hail), Snow Warning, Vanillite's
   line (`DUO_STARTERS`, backs, fits, cries), the sim mirror. The bot gave Icy Wind Weak 2 (without it Ice trailed ~15).
   Bot (300 a cell): ice+fire 67.0, ice+grass 61.7, ice+water 62.3, ice+electric 70.3; solo Ice 74.0: a strong partner for
   Grass and Water. Playtest: the githack link with `?duorun&duopool&coins=500` (the Duo key, Electric and Ice lent), or a
   solo fight `?arena=fight&starter=vanillite&cards=blizzard,glaciate,snow-flurry`. **Waiting on the user**: the playtest,
   and whether Hail's 3 a turn and Frostbite's +1 a hit feel right.
6. ~~**Ice's second**~~ done 2026-10-19 on `duo-types` (both repos; game `a136207`+, `docs/duo-design.md` section 5's
   "Ice's second session", `docs/reference/safari.md`'s duo section; `docs/roadmap-done.md`). 36 more cards
   (defence-leaning, 74 in all) with art, Never-Melt Ice + 6 relics (Snowball, Safety Goggles, Icy Rock, Icicle Plate, Ice
   Memory, Ice Stone), Ice Gem and Chill Drive, the Card index's Ice tab, Swinub's look, and **the Ice Cave** (an 8th
   area: every Ice-typed Safari Pokémon, date-gated like the Power Plant, the Wetland painted frozen). Bot (300 a duo):
   ice+fire / +grass / +water / +electric 66.7 / 62.0 / 56.3 / 67.0 vs session 5's Ice (`iceFirst`) 70.7 / 66.7 / 58.3 /
   64.0, solo 78.7 both: level, inside the noise. Playtest: the githack link with `?duorun&duopool&icecave&coins=500`, or
   `?area=icecave`, `?bossfight=icecave&starter=swinub`, `?arena=fight&starter=swinub&cards=shatter,ice-crown,igloo`.
   **Waiting on the user**: the playtest (the art helper rated Cold Shoulder's picture the weakest).
7. ~~**Fighting's first**~~ done 2026-10-19 on `duo-types` (both repos; game `b4f1bae`+, `docs/duo-design.md` section 5's "Fighting's
   first session", `docs/reference/safari.md`'s duo section; `docs/roadmap-done.md`). 30 pool cards + 8 evolution cards and
   the Sore status card with art (`js/card-art-fighting.js`), Follow-up (a bonus after an attack / a skill; the card glows
   when it would pay), Counter and the last enemy turn's hits (Revenge, Counter, Bide), Guts (Sore, Reversal, Steadfast,
   Defiant), the Guts Ability (+3 on attacks while a status card is in your hand), Timburr's line (`DUO_STARTERS`, backs,
   fits, cries), the sim mirror. The bot gave Low Kick Weak 2 and Vital Throw block 10 (without them solo Fighting 43 vs
   Fire 68). Bot (300 a cell): fighting+fire / +grass / +water / +electric / +ice 67.0 / 57.7 / 49.3 / 64.3 / 73.0; solo
   Fighting 79.3. Playtest: the githack link with `?duorun&duopool&coins=500` (the Duo key, Electric, Ice and Fighting
   lent), or a solo fight `?arena=fight&starter=timburr&cards=close-combat,reversal,counter,bide`. **Waiting on the user**:
   the playtest, and whether Guts at +3 and Counter's numbers feel right.
8. ~~**Fighting's second**~~ done 2026-10-20 on `duo-types` (both repos; game `7d68336`+, `docs/duo-design.md` section 5's
   "Fighting's second session", `docs/reference/safari.md`'s duo section; `docs/roadmap-done.md`). 36 more cards
   (defence-leaning, 74 in all) with art, **Expert Belt** as its held item (`black-belt` was the old strength relic, so
   the design doc's Black Belt became Expert Belt, whose art was already in) + 6 relics, Fighting Gem and Red Card (no
   Fighting Drive exists), the Card index's Fighting tab, Machop's look, and **Dojo Mountain** (a 9th area: all 30
   Fighting-typed Safari Pokémon, date-gated, the Desert painted as a granite mountainside). The rare card first named
   Sturdy is **Stand Firm**: Sturdy is Ground's Ability. Bot (300 a duo): fighting+fire / +grass / +water / +electric / +ice 62.0 / 51.0 /
   45.3 / 54.7 / 67.3 vs session 7's Fighting (`fightFirst`) 73.0 / 57.0 / 50.3 / 56.3 / 70.7; solo 87.3 vs 76.0 (150): solo
   gains, the pairs dip ~5 like Electric's second half, no one part to blame: left for the balance pass (15). Playtest: the githack link with
   `?duorun&duopool&dojomountain&coins=500`, or `?area=dojomountain`, `?bossfight=dojomountain&starter=machop`,
   `?arena=fight&starter=machop&cards=stand-firm,justified,last-stand,gritted-teeth`. **Waiting on the user**: the
   playtest (whether the Moves app's 8 type tabs still read on a phone); the Expert Belt call.
9. ~~**Ground's first**~~ done 2026-10-20 on `duo-types` (both repos; `docs/duo-design.md` section 5's "Ground's
   first session", `docs/reference/safari.md`'s duo section; `docs/roadmap-done.md`). 30 pool cards + 8 evolution cards
   with art (`js/card-art-ground.js`), **Dig** (a card goes underground, ⛏️, and surfaces at your next turn's start),
   **Fault** (🌋: at its turn's start a foe at or under its Fault is knocked out; Alphas and bosses count half),
   **Sandstorm** (the Weather engine's second kind: the chip and +3 on Ground blocks), the **Sturdy** Ability (once a
   fight, a knock-out hit leaves you at 1 HP), Trapinch's line (`DUO_STARTERS`, backs, fits, Vibrava's and Flygon's
   cries), the Ground colours, the sim mirror. Bot (300 a cell): ground+fire / +grass / +water / +electric / +ice /
   +fighting 66.0 / 55.6 / 51.6 / 50.3 / 57.4 / 55.4; solo Ground 71.3 (Fire 68 under the same bot): level on the base
   three, ~10 under Fighting's and Ice's first sessions with Electric and Ice, for the balance pass (15). Playtest: the
   githack link with `?duorun&duopool&coins=500` (Ground lent), or a solo fight
   `?arena=fight&starter=trapinch&cards=dig,landslide,mud-sport,stomping-tantrum,sandstorm`. **Waiting on the user**: the
   playtest, and whether Fault at half on Alphas and bosses and Sandstorm's +3 block feel right.
10. ~~**Ground's second**~~ done 2026-10-20 on `duo-types` (both repos; `docs/duo-design.md` section 5's "Ground's
   second session", `docs/reference/safari.md`'s duo section; `docs/roadmap-done.md`). 36 more cards (defence-leaning, 74
   in all) with art, Soft Sand + 6 relics (Earth Plate, Light Clay, Shuca Berry, Smooth Rock, Ground Memory, Groundium Z),
   Ground Gem and Terrain Extender (no Ground Drive exists), the Card index's Ground tab, Rhyhorn's look, and **the Quarry**
   (a 10th area: 40 Ground-typed Safari Pokémon, date-gated; Drilbur, the Swinub line and the Sandile line stay out, the
   last for Dark's Night Alley; the Desert painted as an open-cut quarry). Bot (300 a duo): ground+fire / +grass / +water /
   +electric / +ice / +fighting 65.3 / 54.7 / 45.3 / 49.7 / 55.3 / 57.3 vs session 9's Ground (`groundFirst`) 66.3 / 53.3 /
   49.0 / 60.7 / 63.3 / 58.0; solo 88.0 vs 76.0: the Electric and Ice pairs dip, for the balance pass (15). The sim's
   `run-node.mjs` ranks merge was wiping every type it didn't measure (fixed). Playtest: the githack link with
   `?duorun&duopool&quarry&coins=500`, or `?area=quarry`, `?bossfight=quarry&starter=rhyhorn`,
   `?arena=fight&starter=rhyhorn&cards=bunker,groundswell,sand-screen,foxhole&relics=shuca-berry`. **Waiting on the
   user**: the playtest (the Moves app now has 9 type tabs on a phone).
11. ~~**Flying's first**~~ done 2026-10-20 on `duo-types` (both repos; `docs/duo-design.md` section 5's "Flying's first
   session", `docs/reference/safari.md`'s duo section; `docs/roadmap-done.md`). 30 pool cards + 8 evolution cards with
   art (`js/card-art-flying.js`), **Evasion** (🪶: each stack halves an enemy attack until your next turn), **Tailwind**
   (🌬️: a card more at each of your next N turns' start; the neutral Tailwind card is **Rest** now, id kept), **Unburden**
   (a bonus on the last card in hand; it glows), the **Keen Eye** Ability (draw 1 as Flying comes out, once a turn),
   Starly's line (backs, fits, cries), the sim mirror. Bot (300): first built, Evasion kept until used, solo 83.7 and the
   pairs 75-92; fading (Blur's rule), solo 78.7, flying+fire / +grass / +water / +electric / +ice / +fighting / +ground
   80.3 / 74.3 / 67.3 / 76.0 / 82.0 / 72.7 / 74.7: a little over the other first sessions, for the balance pass (15).
   Playtest: the githack link with `?duorun&duopool&coins=500` (Flying lent), or a solo fight
   `?arena=fight&starter=starly&cards=peck,acrobatics,tailwind-gust,sky-attack,feather-dance,gale`. **Waiting on the
   user**: the playtest, and whether Evasion fading at your turn and Keen Eye's draw feel right. Two Safari signature
   cards are also named Tailwind (Pelipper's, Whimsicott's), with other text: say if they should be renamed.
12. ~~**Flying's second**~~ done 2026-10-20 on `duo-types` (both repos; game `aff8789`+, `docs/duo-design.md` section 5's
   "Flying's second session", `docs/reference/safari.md`'s duo section; `docs/roadmap-done.md`). 36 more cards
   (defence-leaning, 74 in all) with art, Sharp Beak + 6 relics (Sky Plate, Pretty Wing, Coba Berry, Air Balloon, Flying
   Memory, Flyinium Z), Flying Gem and Swift Wing (no Flying Drive exists), the Card index's Flying tab, Pidgey's and
   Pidove's looks, and **the Windy Cliffs** (an 11th area: the 35 birds, date-gated, the Peak painted as chalk sea cliffs,
   feathers on the wind; the Dark birds wait for Night Alley). Gale Wings' Weak lasts into the enemy's next turn (StS's
   rule for a debuff landed on its own turn). Bot (300 a duo): flying+fire / +grass / +water / +electric / +ice /
   +fighting / +ground 81.0 / 73.7 / 67.7 / 74.7 / 76.3 / 77.3 / 73.7 vs session 11's Flying (`flyFirst`) 83.3 / 79.7 /
   62.7 / 72.3 / 83.7 / 78.0 / 80.3; solo 92.7 vs 78.0 (150): solo now the strongest type alone, the Ice and Ground pairs
   dip ~7: both for the balance pass (15). Playtest: the githack link with `?duorun&duopool&windycliffs&coins=500`, or
   `?area=windycliffs`, `?bossfight=windycliffs&starter=pidgey`,
   `?arena=fight&starter=pidove&cards=phantom-wing,delta-stream,gale-wings,weightless,preen&relics=pretty-wing`.
   **Waiting on the user**: the playtest (the Moves app now has 10 type tabs on a phone); whether the Windy Cliffs should
   take only the birds (35, as built) or every Flying-typed Safari Pokémon (70, the bugs and bats too).
13. ~~**Dark's first**~~ done 2026-10-20 on `duo-types` (both repos; game `3bb88ab`+, `docs/duo-design.md` section 5's "Dark's
   first session", `docs/reference/safari.md`'s duo section; `docs/roadmap-done.md`). 30 pool cards + 8 evolution cards with
   art (`js/card-art-dark.js`), **Steal** (the enemy loses N strength, below 0 too, you gain what it had, and you take 3 x N
   of its block, before the hit), **Punish** (a bonus when it intends to attack; it glows) and **Taunt** (its intent becomes
   its next attack), **Illusion** (the card hits as the better of your two types; alone Dark or Neutral) and **Disguise**
   (🎭: until your next turn its hits land on whichever of your two types takes them best), the **Intimidate** Ability
   (Weak 1 as Dark comes out, once a turn), Deino's line (backs, fits, cries), the sim mirror. Names: most Dark moves were
   already Safari signature cards, so Thief is **Snatch**, Payback **Lash Out**, Copycat **Imposter** and so on (the doc's
   "Names"); Fighting's Intimidate card is **Stare Down** (id kept), as Ground's Sturdy card became Stand Firm. Supersonic
   Skystrike's Unburden now adds its hit (it had no first hit to add to). Bot: as first built solo Dark ran 43 to Fire's 71
   (Steal did nothing to a foe that hadn't buffed); with Steal always taking strength and Lash Out applying Weak 1, solo
   **73.3**, dark+fire / +grass / +water / +electric / +ice / +fighting / +ground / +flying **75.0 / 76.0 / 62.3 / 77.7 /
   77.3 / 77.7 / 77.3 / 89.3** (300 a cell): level with Flying's first session. Playtest: the githack link with
   `?duorun&duopool&coins=500` (Dark lent), or a solo fight
   `?arena=fight&starter=deino&cards=taunt,throat-chop,ruination,masquerade,wicked-blow,imposter`. **Waiting on the user**:
   the playtest; whether Steal pushing strength below 0 and Disguise "the better of your two types" read right; the names.
14. ~~**Dark's second**~~ done 2026-10-20 on `duo-types` (both repos; game `2b2ac59`+, `docs/duo-design.md` section 5's
   "Dark's second session", `docs/reference/safari.md`'s duo section; `docs/roadmap-done.md`). 36 more cards
   (defence-leaning, 74 in all) with art, Black Glasses + 6 relics (Dread Plate, Reveal Glass, Colbur Berry, Razor Claw,
   Dark Memory, Darkinium Z: the Dusk Stone was already everyone's boss relic), Dark Gem and Smoke Ball, the Card index's
   Dark tab, Sandile's look, and **Night Alley** (a 12th area: 23 Pokémon, the Dark-first ones, the Sandile line, the Dark
   birds and the skunks, date-gated, the Marsh painted as a town at night). Bot (300 a duo): dark+fire / +grass / +water /
   +electric / +ice / +fighting / +ground / +flying 76.0 / 79.0 / 61.0 / 70.7 / 83.0 / 74.3 / 78.3 / 86.7 vs session 13's
   Dark (`darkFirst`) 74.3 / 72.0 / 67.3 / 80.3 / 82.7 / 77.3 / 77.7 / 88.0; solo 89.3 vs 74.0 (150): solo gains most, the
   Electric (-10) and Water (-6) pairs dip, for the balance pass (15). Every type is now whole. Playtest: the githack link
   with `?duorun&duopool&nightalley&coins=500`, or `?area=nightalley`, `?bossfight=nightalley&starter=sandile`,
   `?arena=fight&starter=sandile&cards=turnabout,retribution,ill-gotten-gains,costume-change,phantom-mask&relics=dark-memory`.
   **Waiting on the user**: the playtest (the Moves app's 11 tabs show only their type badges since 2026-10-21); whether Night Alley should look
   like night at every hour (as built) or follow the clock like the other areas.
**Done 2026-10-20 (branch `claude/new-starters-lists-tkfrt4`, off `duo-types`): the duo starter unlock window.** A catch
that adds a duo starter now opens the unlock window (`duoNews(windows)` in `js/run.js`, the `feat` form of
`unlockWindow`: "🔓 New duo starter!", its sprite and cry, whether it opened a type or is a new look), not a line in the
catch box. **Then 14 more duo starter lines as looks** (the user: "add as many as you think can be starter skins";
enemies allowed): Magnemite; Poliwag, Ralts; Gible, Geodude, Nidoran♂, Nidoran♀; Togepi, Zubat, Hoppip, Dratini, Bagon;
Larvitar, Seedot (`DUO_LINES`, `DUO_STARTERS`, PokeAPI backs and shinies, 33 cries at -13 LUFS, `SPRITE_FIT` / `BODY_X`).
Not moved into their type areas (`docs/duo-design.md` section 3). The user misread earlier: two-stage lines aren't
wanted, so nothing to decide there. **Merged into `main` 2026-10-20** (it had split off before the go-live, so the live site showed the old Duo app). pokeDB-sim's switch merged into its `main` the same day. The balance pass (session 15) ran before the turn-ending switch; a ~150-a-pair re-check under it is worth one session (▶ CLOUD, effort: high). **Waiting on the user**: a playtest.
Also fixed (2026-10-20, the user's phone): the Duo app wouldn't scroll (`.cdev-dex`'s `overflow: hidden` beat the app
panel's `overflow: auto`; `.cdev-app.sp-duo-app` now scrolls).
**The Duo app's new layout** (2026-10-20, the user's asks from their phone): the window stays up with the picked pair at
the gate, updating as you pick; the pool comes first; today's road folds per area (number, name, Safari Dex count); the
type emoji are round badges (`js/type-badge.js`); the portraits centre their sprite. Detail: `docs/reference/safari.md`'s
"The Duo key". **Waiting on the user**: the look on a phone (the badges' glyphs were drawn blind, no screenshot).
Then each area's row shows its main types and a green ▲ / red ▼ count in view, folded or not (the user's pick from the
categorized mock's road; only that part, the rest stays); a tap on either explains it under the row (`faresLine()`).
Then (same day): each road row is one line (a round number, the name, ▲ ▼, the count; the types inside the fold), and the
roster grew: Poliwag out, Ice / Fighting / Dark filled to 8 / 10 / 9 with two-stage lines and single Pokémon that power up
with a legendary's aura (`docs/duo-design.md` section 3). 47 duo looks in all. **Waiting on the user**: a playtest of the
auras (80 new GIFs, ~8 MB, loaded only for the two starters in a run).
Then the Duo Run's own three areas (`duoRoad()`) and the map's badge on rooms holding a duo starter not caught yet
(`docs/reference/safari.md`).
Then every duo type to 10 looks (60 in all; `docs/duo-design.md` section 3), the type badges everywhere a type was an emoji
(`typeText()` in `js/type-badge.js`: card faces, the battle's plates, the Pokédex and Stats chips, the Hall of Fame, the
map's match marks, the crossroads), and the duo's swap button on the plate's top-left corner (`#player-plate .bench-chip`).
Then the switch reworked (the user's calls, same day): the bench portrait is gone (the Pokémon moved too much to read);
you **hold your Pokémon** to bring up the Go pill, and **a switch ends your turn** as in the games (1 PP still; a card's
switch stays free and mid-turn). pokeDB-sim mirrors it (same branch name there); its bot now only switches last, keeping
the PP back when the coming hit is ▲ on the one out and not the partner. Bot check (150 a pair, 8 pairs): mean 65.2 -> 74.1,
switches a run ~44 -> under 1 (the old bot's hand-fetching churn cost it; pokeDB-sim's README). Session 15 measures with it.
Then "hold to swap" fades over your Pokémon through a duo fight's first two turns.
**Waiting on the user** (2026-10-20, from their phone): the Ice Cave's intro film showed black behind its title and snow,
and the map card's Pokémon came out of its ball small and choppy. Not reproduced headless (the film draws fully, day or
night, every area; a Duo Run's map holds ~131 MB, as the start screen does; run-map within budget). The phone was on low
battery with 7 tabs open, so likely Safari dropping a canvas under memory pressure. If it repeats in a fresh tab, note the
area and time, and add a guard that repaints a lost film canvas.

**Furniture expansion: the plan, session by session** (the user's ask, 2026-10-16: a catalogue as big as Animal
Crossing's; the user picked all of what's below, in this order). The list is `docs/furniture-expansion.md`, and how a
set is built (the helpers' brief, budgets, the check) is its "Building a set" section. Done so far: every kind
hand-built, the seasonal and yard sets (237 kinds, 1,464 in all), the statues as their sprites, and session a, the six Pokémon
rooms and the Present's model (2026-10-17, 150 kinds, 1,645 in all), session b, five more Pokémon sets (2026-10-17, 127
kinds, 1,772 in all), session c, Day Care, partner care, figurines and 60 more dolls (2026-10-17, 140 kinds, 1,912 in
all), session d, the first five furniture series (2026-10-17, 125 kinds, 2,037 in all), session e, the next five (2026-10-17,
125 kinds, 2,162 in all), session f, Cherry blossom, Maple leaf, Acorn and Mushroom (2026-10-17, 100 kinds, 2,262 in all), session g,
Wooden block, Throwback, Ranch and Iron garden (2026-10-17, 100 kinds, 2,362 in all), session h, Bamboo, Stone zen,
Constellations and Desert caravan (2026-10-17, 100 kinds, 2,462 in all), session i, the first five room types (2026-10-17,
125 kinds, 2,587 in all), session j, the next five (2026-10-17, 125 kinds, 2,712 in all), session k, four more (2026-10-17, 100 kinds, 2,812 in all), and session l, the last four (2026-10-17, 100
kinds, 2,912 in all; all twelve in `docs/roadmap-done.md`).
Waiting on the user's playtest of those (`?holiday=valentine` etc. on the Furniture store, `?yard&allfurniture`,
`?mall=3f`), and of the Pokémon rooms and session b's sets (`?base&allfurniture`, or `?mall=furniture&stock=pikabed,pbmaster,mustyrantrum,constage,lgchampseat,rktballoon`), and of session c's
(`?mall=furniture&stock=dccrib,dcponyta,pcgroomtable,pcbigbed,figcharmander,figlugia,bigespeondoll,biglitwickdoll`), and of session d's
(`?mall=furniture&stock=antqbed,rtnpeacock,cabinstove,iwlocker,impgong,impdragon`; try the stove's and the iron stove's fire tap), and of session e's
(`?mall=furniture&stock=dnrjukebox,dnrbooth,cutebed,elgspinet,merbed,merfountain`; the Golden set is never sold:
`?base&allfurniture` lends it, and its pieces say "Earn N achievements" in the base's Shop), and of session f's
(`?mall=furniture&stock=blsmbed,blsmarch,mplbed,mplscreen,acrnwardrobe,acrnstash,shrmbed,shrmshiinotic`; Maple leaf is on the
stands this October by itself, Cherry blossom with `?holiday=sakura`), and of session g's
(`?mall=furniture&stock=blkbed,blkditto,thbtv,thbboombox,rnchbed,rnchsaddle`; Iron garden is outdoor: `?yard&allfurniture`,
or Smeargle's catalogue's Iron garden tab with a yard), and of session h's
(`?mall=furniture&stock=bmbbed,bmbgrove,cstorrery,cstprojector,crvbed,crvspice`; Stone zen is outdoor: `?yard&allfurniture`,
or Smeargle's catalogue's Zen tab with a yard), and of session i's
(`?mall=furniture&stock=hspbed,bstrange,bakcase,sshconveyor,rmnyatai,rmnsnorlax`; try the bed's heal, the oven and fridge
doors, the ticket machines), and of session j's
(`?mall=furniture&stock=pzroven,pzrlickitung,crsfridge,crscrane,lndwasher,lndrotom,slnpole,slngroom,grgporygon,grgtoolchest`;
tap the oven, the fridge and washer doors, the barber pole, the Porygon cart), and of session k's
(`?mall=furniture&stock=crfeasel,crfsewing,gmrdesk,gmrtv,rcsbooth,rcsconsole,cnmscreen,cnmpopcorn,cnmditto`; try the live
screens, the popcorn machine, the booth's note, at night the gamer room's glow), and of session l's
(`?mall=furniture&stock=htldesk,htlrevolving,htlsafe,sklhearth,sklgondola,skldelibird,hntbookcase,hntseance,hntvanity,crzbunk,crztrunk,crzbinnacle`;
tap the revolving door, the safe, the bookcase (a hidden passage), the trunk, the bust that turns to watch you). Each session builds its sets with one helper (Agent) a set or two, in parallel, then checks the whole
catalogue, sends picture sheets (the user asks for them), and pushes to `main`. Watch the usage limit: seven helpers
at once hit it on 2026-10-16; five is safer.
- **a. Done 2026-10-17, on `main`**: the six Pokémon rooms and the Present's model (`docs/roadmap-done.md`).
- **b. Done 2026-10-17, on `main`**: the Poké Ball collection (27), Museum, Contest Hall, Pokémon League and Rocket
  hideout (`docs/roadmap-done.md`).
- **c. Done 2026-10-17, on `main`**: Day Care, Partner care, 30 figurines and 60 more dolls (`docs/roadmap-done.md`).
- **d. Done 2026-10-17, on `main`**: the Antique, Rattan, Log cabin, Ironwood and Imperial series (`docs/roadmap-done.md`).
- **e. Done 2026-10-17, on `main`**: the Diner, Cute, Elegant, Golden and Mermaid series (`docs/roadmap-done.md`).
- **f. Done 2026-10-17, on `main`**: Cherry blossom and Maple leaf (sold only in April / October), Acorn and Mushroom
  (`docs/roadmap-done.md`).
- **g. Done 2026-10-17, on `main`**: Wooden block, Throwback, Ranch and Iron garden (outdoor, its own tab in Smeargle's
  catalogue) (`docs/roadmap-done.md`).
- **h. Done 2026-10-17, on `main`**: Bamboo, Stone zen (outdoor, a Zen tab in Smeargle's catalogue), Constellations and
  Desert caravan (`docs/roadmap-done.md`).
- **i. Done 2026-10-17, on `main`**: the first five room types, Hospital ward, Bistro kitchen, Bakery, Sushi bar and
  Ramen shop (`docs/roadmap-done.md`).
- **j. Done 2026-10-17, on `main`**: Pizzeria, Corner shop, Laundromat, Salon and Garage (`docs/roadmap-done.md`).
- **k. Done 2026-10-17, on `main`**: Craft and sewing room, Gamer room, Recording studio and Cinema (`docs/roadmap-done.md`).
- **l. Done 2026-10-17, on `main`**: Hotel lobby, Ski lodge, Haunted mansion and Cruise cabin, the last room types
  (`docs/roadmap-done.md`).
- **m. The ceiling layer** (~50 pieces): a new `layer: 'ceiling'` hung from the room's ceiling (placing, the tray, the
  store's display, saving), then its pieces: ceiling lamps, chandeliers, fans, hanging plants, mobiles, lanterns, a
  disco ball, bunting. Read `docs/reference/hub-base-mall.md` on how wall pieces were added first.
Every finished session moves its line to `docs/roadmap-done.md` and writes the next session's prompt here.
Next session's prompt (session m):
> Run in: CLOUD. Read CLAUDE.md, the roadmap's "Furniture expansion" entry, docs/furniture-expansion.md (its "Building a
> set" section is the helpers' brief) and docs/reference/hub-base-mall.md on how wall pieces were added. Build session m,
> the ceiling layer: first `layer: 'ceiling'` myself (placing a piece hung from the room's ceiling, the tray, the store's
> display, saving and loading, the 2D room), checked headless with no console errors; then its ~50 pieces (ceiling lamps,
> chandeliers, fans, hanging plants, mobiles, paper lanterns, a disco ball, bunting), one helper a group (at most four at
> once). Check every kind with tools/model-check.mjs, send me picture sheets, update the roadmap and push to main.

**Kenmatta's dojo: all 20 trials in** (2026-10-15, docs/roadmap-done.md). Trials 15-20 are on branch
`claude/kenmatta-trials-9-14-dojo-ffy0jk` and `main`, waiting on the user's playtest (`?dojo&trials` opens every trial on any save). Nothing left to build here unless the user wants more.

**The Secret Base's backyard** (the user's idea and picks, 2026-10-14). An outdoor lot behind the Ancient Tree, through a
back door of the base. The settled calls: **bought on the PC's HOUSE UPGRADES blueprint** (a green outdoor plot behind
the main room, ~1,000 PokéCoins, like `ROOM_PRICE`'s rooms in `js/data/house.js` / `js/pc.js`'s `blueprint()`), **one
plot that grows** (starts ~12x8, a bigger yard a later blueprint buy, like `BIG_PRICE`), and it holds **outdoor furniture,
roaming Pokémon and a berry garden** (fishing not picked). Decoration only, no run perks (the base's rule), except the garden since part g. Read
`docs/reference/hub-base-mall.md` first. Sessions, in order, all ▶ Run in: LOCAL (Desktop app, visual):
  a) Done 2026-10-14, on `main` (docs/roadmap-done.md; how it works in docs/reference/hub-base-mall.md's Backyard).
  b) Done 2026-10-14, on `main`: 16 outdoor kinds, Smeargle's garden catalogue (docs/roadmap-done.md).
  c) Done 2026-10-14, on `main`: the 6 on show let out from the yard's Pokémon tab; swim, swing, sit (docs/roadmap-done.md).
     2026-10-23: every room, the yard too, now picks from the whole Safari list, up to 6 a room, and a new Safari player's
     first two catches move in by themselves, with a window (docs/roadmap-done.md).
     Not yet seen in a browser: playtest `?yard&guests` with a swing set and pond out (`?base&yard` opens the main
     room: `?base` is read first).
  d) Done 2026-10-14, on `main`: berry plots in Smeargle's catalogue, five berries, coins capped at 100 a day, a basket
     for each berry's first picking (docs/roadmap-done.md). A real tap on a plot not yet tried (the hidden pane ran no frames).
  e) Done 2026-10-15, on `main`: the bigger yard, 16x11 for 1,000 on the blueprint (docs/roadmap-done.md). Playtest
     `?yard=big` (or buy it: tap the owned yard on HOUSE UPGRADES).
  f) Done 2026-10-15, on `main` (the user's ask): the way in is a garden arch in the Clearing beside the Ancient Tree,
     brambled and padlocked till the yard is bought; no back door any more (docs/roadmap-done.md). Waiting on the user's
     look: `?hubat=27,4&coins=2000` with a Secret Base owned, Unlock, walk in and back out.
  g) Done 2026-10-15, on `main` (the user's ask; it lifts "decoration only" for the garden): Smeargle's slide-in yard
     intro (and a free plot), watering, picked berries into the Satchel (sell spares), the Garden window, and Kurt's
     two repeatable shelves, held berries and a run kit; the Prepare screen packs a Berry Pouch of 3 (one held, another
     put on from the Bag once a biome after one is eaten) and one kit item
     and Kurt, the battle and the map each explain held berries once (docs/roadmap-done.md). 2026-10-16: a pinned
     "▼ Berry Pouch · Run kit" tab on Prepare while they're below the panel's fold (the user's worry no one sees them).
     (docs/roadmap-done.md). Not yet seen on a phone: `?yard` (intro, Garden button) and `?satchel` at Kurt's. Ideas
     left: a Pokédex Garden app with timers, Pokémon in the yard tending plots.

**Towns and Waystones** (the user's idea and yes, 2026-10-13). Each biome after the Clearing has a **gateway town**, walked
in 3D between the journey film and the biome's map: Clearing → boss → crossroads → journey film → **the town of the biome
ahead** → biome 2 → boss → crossroads → film → town → biome 3 → boss → Sealed Gate. In `walkOn()` (`js/run.js`) the town
comes after `travel()` and before `startBiome()`; before the roads open (`roadsOpen()`) it is still the default road's town.
The settled calls (the user's, 2026-10-13):
- **The town is the biome you're entering**, so the crossroads pick pays off at once, each road has its own town, and you
  meet that biome's Gym Leaders (`leadersOf(biome)` in `js/data/gym.js`) there before fighting them at its boss.
- **Five towns**: Shrine (a lantern village on a mountain stair, Ecruteak's), Wastes (a mining and hot-spring town at the
  volcano's foot, Lavaridge's), Sunken Ruins (a stilted fishing village over the lagoon), Thornwood (treehouses on rope
  bridges, Fortree's), Savanna (a caravan trading post by the watering hole). The Clearing is home, no town. Mewtwo's runs
  and the Safari never stop at one (no journey films there); a Depths crystal miners' camp is a maybe for later.
- **Runs stay balanced**: in a run a town gives only one small choice (one trade or one request's reward) and no healing,
  cards or relics that make a run stronger, so no bot check. The big rewards are on the home side.
- **Waystones**: each town has a broken Waystone, mended by finishing its requests over a few runs (a town's friendship,
  saved per town). A mended one lights its stone in **one ring of standing stones by the Ancient Tree** in the Clearing;
  tapping a lit stone teleports you into that town outside a run: its shop (its own furniture set from the existing
  shelves: Japanese for the Shrine, Hot Spring for the Wastes, Underwater for the Ruins, Greenhouse/Garden for Thornwood,
  Desert for the Savanna, sold only there), its request board (PokéCoins, the missions' `track()` events), its leaders to
  chat with, and a townsperson to invite to the Secret Base. All five mended: a reward to decide then.
- Townsfolk reuse the Game Corner crowd's code (`makeCrowd()` in `js/corner-crowd.js`, lines in a data file per town).

**On branch `towns` only, never pushed to `main` until the user says** (the user's call, 2026-10-13, like `secret-base`):
every session works on `towns`, gives a pinned playtest link (`rawcdn.githack.com/patreekaRe/pokeDB-3/<full hash>/index.html`),
and merges `main` into it now and then so it doesn't drift.

Sessions, in order (one each; a patch-notes line each, `?town=<biome>` to walk one straight in):
1. **Done (2026-10-13): the Shrine's Lantern Village, in a run.** `TOWNS.shrine` in `js/data/towns.js` (pure: requests,
   friendship, `tests/towns.test.mjs`), the save side `js/towns.js` (`trackTowns()` from `mission()` in `js/run.js`, whose
   ctx now carries `biome`; a beaten Gym Leader sends `mission('gym')`), `townRoom()` / `rollTrade()` / `peekTown()` in
   `js/run.js` (walkOn() checkpoints `run.town` after the journey film and shows it, Continue comes back to it; no town
   without Three.js), and `buildTown()` / `townCrowd()` in `js/event-3d.js` (kind `town`, 13 x 18: a stone road to a
   vermilion torii, the far gate, `R.exitAt`; machiya, a pagoda, stone lanterns, cedars and maples dropping leaves; the
   request board and Delibird's stall in the square; John and Jahmes off duty, a tap chatting, `R.talks`; 4 of 10 Eevee-
   family and Ecruteak folk on the crowd code, cries added). The trade is one Bag item for another of the same rarity (since 2026-10-15 picked in a window, `js/town-trade.js`; archive); the
   board shows one request at a time (5, in order, counted only in the Shrine) and hands a finished one in on a later
   visit for `REQUEST_COINS` 40 and +1 friendship (`MEND_AT` 5 mends the Waystone, session 2). Leave asks first only while
   a real pick is left (`askFirst()` skips `.locked` and info-only options now). Patch-notes line in `NEXT` (cut the patch
   on merge, not on the branch). Branch `towns` (and `claude/jolly-ritchie-vdznxn`), **waiting on the user's playtest**.
   **Redone the same day as a Pokémon town** (the user's ask, with a picture of a top-down town: "I want to be able to enter
   some homes"): still 3D, from a tile map (24 x 24, then 20 x 18 the same day: "doesn't have to be this big", every house facing south, its door on the road below; then **38 x 36**, the user's call the same evening: "huge and not feel cramped", with the broken Waystone in a plaza at the middle (`waystone()` in `js/event-3d.js`, a `kind: 'waystone'` building: a tap reads it and says the friendship; mending and lighting it is session 2), 12 houses (8 locked to knock on), 7 folk about at once, the sun's shadow box following the camera (`follow`), the ground's texture scaled to fit; every later town should be this big). **Roofs and leaders at home** (the user's asks, same evening): every house a real tiled roof, `kawaraRoof()` in `js/event-3d.js` (ribbed kawara down both slopes, round tile ends along the eaves, a stacked ridge with onigawara, bargeboards and a gegyo, plaster in the gables, `gableWall()`; the old roofs' tiles only landed on their gable edges), a house you walk into gold on its ridge and a front gable with its crest (`frontGable()`, `houseCrest()`: a Poké Ball on the shop, a leader's initial in their `GYM_INK`); a Gym Leader is only home once beaten (`away` in `homeRoom()`, the home's `away` line, the room cached apart) (`map` in `TOWNS.shrine`, `tests/towns.test.mjs` checks every door,
   stand and the gate can be reached): a ring of forest (instanced, the front rows low bushes), stone roads, rows of houses
   in Pokémon roof colours, tall grass, a pagoda, the Dance Theater, the torii at the top; the camera higher (`pitch` 0.7).
   Four houses go in (`homes`, `HOMES` in `js/event-3d.js`): Delibird's Goods (the trade moved inside), John's and Jahmes's
   homes (the leaders live there now; Jahmes asleep after 11 p.m. your time) and the Dance Theater (the Kimono Girls'
   five Eeveelutions dancing). The rest knock. Headless it runs about half the frame rate of the Hot Spring room (SwiftShader,
   no phone GPU): watch it on a phone. Next: the user's playtest, then session 2.
**Live state (2026-10-15, the user's call): the towns are LIVE** (`TOWNS_LIVE` true in `js/data/towns.js`), shipped as patch 1.20, The Waystones, with the questlines, the Satchel and Quests apps, Kurt's Workshop, the Nietos' questline and Mewtwo's Sealed Weakness and Depths camp (`TOWN_NOTES` condensed into it; `IN_THE_GAME` has a towns line and 164 badges). `tests/camp.test.mjs` now checks the live weakness. Open: the user's own playtests below still stand as feedback rounds, not blockers. Every town has the Clearing's curve since 2026-10-14. Since 2026-10-14 a visit goes home only by the Waystone, and walks into your saved run when it stands in that town's biome (`docs/roadmap-done.md`).

2. **Done (2026-10-14): the Waystone ring and visiting from home**, for all five towns at once (they were all built by
   then). **The Waystone keeps its list hidden till a town is reached** (the user's call, 2026-10-14): before any town is `met`, a tap only reads one of four `RIDDLES` in turn (`sealedWaystone()` in `js/hub-3d.js`), the town list showing from the first town visited. The user's asks the same session: **the Clearing grown** (`COLS` 20 x `ROWS` 16 in `js/hub-3d.js`, seven columns on
   the right and four rows between the back and the plaza, the world anchored where the old grid's middle was, `X0` / `Z0`,
   so the back stays put), **the ring round the plaza's Poké Ball** (`STONES` from `RING` in `js/data/towns.js`, a stone a
   town on a worn circle, `RING_R` 3, none on the paths; `standingStone()`: dark, or lit in its town's colour with a rune,
   a turning crystal and a pool of light once mended), **the Nietos' house** (`NIETOS_AT`, `nietosHouse()`: walked in like a
   town home, `CLEARING` in `js/data/towns.js` / `HOMES.clearing` in `js/event-3d.js`, Law, Britt, Linc and Kangaskhan, away
   till beaten, whispering after seven) and **Kenmatta's dojo, COMING SOON** (`DOJO_AT`, `dojo()`, boarded up, a tap says so;
   a later session opens it). A lit stone walks your buddy into its town (`warpTo()`: a column of its light, then
   `visitTown()` in `js/run.js`, a throwaway run like a playtest, `isVisiting()`, the saved run untouched, the room bar's HP
   hidden, `body.town-visit`), set down by the town's now whole Waystone (`wholeWaystone()`) in the same column of light (`townWarp()` in
   `js/event-3d.js`), which (or the far gate, or Leave) lifts you up in it and home onto that stone (`goHome()` → `cameHome()`). On a visit: requests hand in for real (the 5th mends the
   Waystone with a line), the trader sells the town's furniture shelf instead of trading (`js/town-shop.js`: 6 a UTC day,
   kept in `save.townShop`, sold out once owned; `SHOP_SHELVES`: Japanese, Hot Spring, Underwater, Greenhouse + Garden,
   Desert, taken out of the mall's stock, `TOWN_SHELVES` in `dealDay()`). (Inviting townsfolk to live in the Secret Base was cut
   2026-10-15, the user's call: it overlapped Safari catches, which stay the only way to fill the base.)
   **Done (2026-10-14): one Waystone, not five** (the user's pick). The ring's five stones are gone: one big Waystone stands on
   the plaza's Poké Ball (`clearingWaystone()` in `js/hub-3d.js`, `START`'s tile; the towns' whole Waystone on a plinth,
   silver runes), five crystals orbiting its tip in their `RING` colours, dull until that town is mended. A tap opens its menu
   (`showWaystone()`, `.hub-card.way`: the Pokédex shell round a green LCD, mended towns with Travel, met ones n/5, the rest
   ???); your buddy starts a step in front of it (`SPAWN`) and comes home there (`goHome('waystone', town)` →
   `cameHome(from, town)`); the worn ring path stays. Player lines that said "ring of stones" now say the Waystone.
   Headless-tested (menu, Travel to Lantern Village, Leave home, no errors). Branch `towns`, waiting on the user's playtest.
   **Next**: the user playtests; then session 4 (the all-five reward) and opening Kenmatta's dojo (settled below).
   **Done (2026-10-14): the Clearing laid out anew** (the user's ask, the start of a clean-up of the towns, the Clearing
   first, then the Shrine's town): spread out over a 31 x 21 grid round a paved plaza, cobbled lamp-lit avenues and a ring
   road, the way out north through the Whispering Clearing's gate, Kenmatta's dojo north-west away from the Nietos (east),
   the Ancient Tree / Secret Base north-east (kept a tree), the Mall west, a pond garden south (CLAUDE.md's The Clearing's
   layout). `?aerial` for the overview. Headless-checked: every place reachable, no errors, Halloween's dress re-placed.
   Follow-up (same day, the user's ask): the tree beside the cauldron (`TREE_TILES` [11, 2]) taken out, and the Nietos'
   name board made readable (bigger, white on deep blue, `nietosHouse()`).
   Follow-up (same day, the user's drawing): the Clearing grown south to 31 x 26, the plaza and everything south of the
   north ring road a row lower (a longer north avenue), the pond moved down past the ring road onto a low road from the
   ring road's sides (`POND`), its two lamps taken out. Then (the user: the old road was meant to move, not stay) the
   road the mall and the Nietos' house faced taken out and both moved down three rows, their doorsteps on the low road
   (`MALL_TILE` [8, 18], `NIETOS_AT` [24, 17]). Headless-checked, no errors; waiting on the user's look.
   **Done (2026-10-14): the Nietos' house a storybook cottage** (the user: "more aesthetic than a stupid bland house"):
   painted clapboard, scalloped shingles, porch, curtains, chimney smoke, picket garden, washing line, pram (`cottageArt()`,
   `NIETOS_YARD`, `mergeStatic()`; docs/reference/hub-base-mall.md). On `main`, waiting on the user's look.
   **Done (2026-10-14): the Clearing's gate made grander** (the user: "cleaner, more extravagant and noticeable"): a bigger
   shrine gate with a glowing leaf crest, lanterns, banners and runed stone feet, a shimmer and motes in its opening, a lamp
   before it; the Pokéstop and route sign a step out to its sides, Halloween's hay there gone (`clearingGateArt()`,
   `liveGateway()`). On `main`, waiting on the user's look.
   **Done (2026-10-14): the Clearing's backdrop filled, east trees out, cracks at the Sealed Gate's spot** (the user's
   phone shots): the painted vista runs across the whole back and 40 units on up as plain sky (`vistaSpan()`, `SKY_UP`), so
   no grey shows from the house, the mall or the south side; `TREE_TILES` [30, 15], [29, 20], [30, 24] taken out; violet
   cracks where the Sealed Gate will stand (`SEALED_AT`), growing with `gateStage()`, crystal shards, sparks, whispers when
   near and a tap card (`js/hub-cracks.js`). Patch 1.19 cut. Headless-checked, no errors; waiting on the user's look.
   **Done (2026-10-15): the broken Sealed Gate in the Clearing built in 3D** (the user: "not the paper thin pixel
   version"): obsidian arch, gold, runes, crystal spires, a swirling Depths portal, floating door shards, snapped chains
   (`js/hub-sealed.js`). Headless-checked, no errors; waiting on the user's look (`?mewtwo&gate=0&hubat=2,12`).
   **Done (2026-10-15): the Clearing's lamps and benches in mirrored pairs, and the professors** (the user's ask): 14
   lamps, 6 benches, 4 flower beds (`LAMPS` / `BENCHES` / `BEDS`); Professor Oak by day and Professor Sonia at night on
   the plaza right of the Waystone, tapping through `HINTS`, saying to refresh for updates every fifth tap. Headless-checked,
   no errors; waiting on the user's look. Their sprites are the user's own since 2026-10-14 (80 x 80, like Kurt's).
   **Done (2026-10-15): the professors talk in the Gym Leaders' slide-in** (the user's pick, option 2): the first tap of
   a visit slides Oak / Sonia in with a hello and a hint, later taps just the speech window (`profTalk()` in
   `js/hub-3d.js`). Headless-checked, no errors; waiting on the user's look (`?hubat=20,11`, `&time=night` for Sonia).
   **Done (2026-10-14): Lantern Village's gate out made grand** (the user: "more aesthetic, extravagant, noticeable"):
   `torii()` in `js/event-3d.js` is a gold-trimmed torii with a smaller one behind (`toriiFrame()`), a straw rope with
   swaying shide, red paper lanterns off the beam's ends, a glowing veil, rising motes, a ring of light and a lamp on the
   road; `forest()` leaves a glade round a town's gate, two big stone lanterns in it; `R.reach` lets the camera lean past
   the back row so the gate shows whole. Commit 8eb7285. Other towns' gates could get the same if the user asks.
   **Done (2026-10-14): Lantern Village cleaned up** (the user: "a lot of houses"; same treatment as the Clearing and
   Thornwood, with a shape of its own): a shrine's approach, one 4-wide stone avenue from the way in to the torii between
   pairs of stone lanterns, the Waystone's plaza halfway up, two cross lanes; only four houses (Delibird's, John's,
   Jahmes's and locked `a`; the other seven locked houses gone, their ids saved nowhere), the Dance Theater and pagoda at
   the back against the forest; a koi pond in the west garden (`~`, the village's `holes`, `villageExtras()`: koi, lily
   pads, irises, a stone lip) with a vermilion bridge (`-`, railings arching on posts to the bed); lone maples (`|`) only
   where nothing walks behind them; indigo name boards by the named doors (`n`); every building fades while your Pokémon
   is behind it (`fadeBehind()`, the style's `fade`). `?town=shrine&towns&aerial` for the overview (the towns' `?aerial`,
   added this session). Checked in a browser: map test logic passes for all five towns, every door reachable as Lugia,
   fades and koi checked by hand, no errors; the live GPU in-and-out check couldn't run (the pane draws no frames hidden).
   Follow-up (same day, the user: walkways "more aesthetic and less blocky"): the village's roads are painted by
   `softRoads()` (the style's `soft: true`): corners rounded out and in, uneven slabs in courses, a darker kerb, grass
   creeping over it. Paint only, at build time; the Springs keep the square flags (any town can take `soft` later).
   Follow-up (same day, the user: Gym Leaders' houses "more grand and extravagant and aesthetic", in the Shrine "and all
   future gym leaders"): a village house whose home has a `leader` is now `manor()` in `js/event-3d.js` (any later
   village-style leader gets it unasked): a stone podium up steps, a vermilion veranda, a deep tiled roof, a gold-leafed
   upper storey under a second roof with a gold jewel on the ridge and the crest in a front gable, a gabled porch with the
   crest and a sacred rope, stone lanterns at the steps, paper lanterns and two swaying banners in the leader's `GYM_INK`
   (`noboriArt()`). John's and Jahmes's lots grew to 5 x 4 (John's moved down a row, his door now on the south road).
   **Every town clean-up does the same for its leaders** in its own style (the handoff's checklist, item 12).
   Follow-up (same day, the user: "clean up any awkward lanterns and benches"): the plaza is a clean paved square now (its four
   corner lanterns, the one at the east lane's mouth and its three flower patches gone), two benches along its top facing
   the Waystone, and the entrance lawn's two benches moved to the roadside by the avenue facing the south road. A bench takes
   two tiles (its x and x + 1), so mirror one at x with 36 - x. Map only (`js/data/towns.js`).
   **Done (2026-10-14): Cinder Springs' clean-up** (the user's call: fix what the map review found plus the checklist):
   four locked houses not eight, the crag stubs and stray pool out of the middle, the right road legs a tile left so
   nothing stands flush on the crags, the Waystone centred on its plaza, name boards (`n`, `nameBoards()`), `fade`, and
   Clarence's and Shaun's homes grand two-storey `lodge()`s on 5 x 4 lots (`docs/reference/towns.md`). Tests pass; no
   console errors headless; the in-and-out GPU check wasn't run (no door taps headless). Waiting on the user's playtest.
   **Done (2026-10-14): Cinder Springs a lava field** (the user: "still pretty bland... a lot of homes... make it look
   something cool how you did the thornwood one", and the bathhouse had no road): `~` is lava there (`lavaField()`):
   a lavafall off the crags at the top, a river the switchback crosses on two-tile basalt bridges (`-`, iron rails,
   ember lamps), a moat making the Waystone's plaza an island (bridges in from the west and south), crust drifting,
   bubbles, smoke. Two locked houses (a, e; k and n gone), the bathhouse on its own road with its springs out beside it.
   Tests pass, no console errors headless; waiting on the user's playtest.
   **Done (2026-10-14): Driftwood Landing's clean-up** (the user: "fix all of that", the map review against the
   checklist): the ring a square of boardwalk two tiles wide round the temple's island with water between, a pier in on
   each side, every spoke two wide, the top of the ring a promenade out to the beacon (top left, at the back) and Kayl's;
   four locked huts not ten (a, p, x, y; g, e, j, m, n, d gone), the aquarium off the jungle, Pat's boat moored north of
   its spoke (in front of it, it hid you), the rowboat out of the bottom walk, beach props on the front row; a railing
   and a pale trim along every boardwalk edge over the water, `fade`, name boards (`s` here, `n` being a net;
   `nameBoards(town, 's')`); Kayl in a `stiltManor()` (5 x 4, two tiers of thatch), Pat in a grand two-deck `houseboat()`
   (6 x 3, paddlewheel, banners, fairy lights). Tests pass; no console errors headless; all doors reachable by the game's
   blocked tiles; fades checked by hand; the in-and-out GPU check wasn't run (no door taps headless). Waiting on the
   user's playtest.
   **Done (2026-10-14): Driftwood Landing's homes, trade house and gate made grand** (the user: "make the other homes
   look more cool and aesthetic, especially the trade house, and the exit"): the four locked huts overwater
   `bungalow()`s (woven bamboo, railed porches, lit glass floats; a and p `shape: 'saddle'` roofs swept into horns, x
   and y two-tier thatch), Pelipper's a seaside `baitShop()` (striped awnings, fish stall, rods, BAIT sign, mast,
   bunting, weathervane, smoking stovepipe), the exit the drowned temple's great gate (`templeArch()`: stepped crown,
   frieze, turning wheel, blue spirit-fire braziers, light in the opening, a glowing mosaic under it, broken columns,
   coral, kelp; `B.reach` 2). Tests pass; no console errors headless. Waiting on the user's playtest.
   **Done (2026-10-14): Highbough's leaders, huts and Nursery made grand** (the user: "make the gym leaders houses more
   grand... fix the aesthetic of the huts too and the green house, they're all lame"): Phil's and Ricky's lots 5 x 4,
   both `canopyManor()`s (Ricky's a den round a living tree, Phil's crooked and haunted); the treehouses round huts
   (`treehouse()`); the Nursery a ruined Victorian conservatory (`nursery()`). Tests pass, no console errors. Waiting on
   the user's playtest.
   **Done (2026-10-14): Highbough's small props tidied** (the user: the request board left of the tree, awkward benches,
   "crates with fruits... like paper", "random grass patches"): the board off the north bridge's landing to the Great
   Tree's left (13, 14); benches only as lookouts on south edges over the drop; the painted planters now 3D boxes
   (`planters()`), a pair either side of each plain house's door and the Waystone; the moss tufts gone; crates square
   (the style's `neat`). Tests pass, no console errors. Waiting on the user's playtest.
   **Done (2026-10-14): Highbough's lanterns, planters, start-deck flicker and gate** (the user: lantern posts "in the way of
   walkways", "the constant flower crates everywhere", "a weird flicker at the beginning platform", the exit "more grand"):
   13 lanterns, each in a platform's outer corner clear of every bridge mouth and door path; planters only the Nursery's
   pair at the back; the start deck's crate and barrel off the way in; the flicker was the trunk under the only deck with no
   house on it, its top level with the planks (now just under, and the deck rims too); `vineGate()` now the Bough Gate, a
   living arch of two trunks on flaring roots, crowned, lit with ghost-blooms, ghost-lanterns swaying under it, wisps
   circling, a wider name plank (`B.reach` 2 so it fits the shot). Tests pass, no console errors. Waiting on the user's playtest.
   **Done (2026-10-14): Highbough's name boards** (the user: "legible aesthetic signs for gym leaders and trade house"):
   `s` tiles by Phil's, Ricky's and the Curio Shop's doors, each a dark walnut plank on ropes from a log crossbar
   (`boughBoards()`, `boughBoardArt()`): big cream letters, mossy top, GYM LEADER in the leader's ink on a gold rim, the
   shop's TRADE HOUSE in ghost violet, a ghost lantern swinging off the bar; the small pale plates on the houses gone.
   **Done (2026-10-14): Cinder Springs' roads and houses** (the user: Shaun's gym "in front of the waystone", "better
   designs of the other houses... especially the trade house", "all roads need to connect"): Shaun's lodge east of the
   moat on its own drive, a road straight down from the Waystone's bridge where it stood; a two-wide road to every door
   (the mine, Clarence, house a, the forge, house e; a test holds it); Heatmor's Forge a fieldstone smithy (`forge()`),
   the locked houses stepped adobe `cottage()`s, the bathhouse timbered with a pent roof and lanterns. Then the benches
   (the user: "move those benches somewhere else"): off the Waystone's island and the open ash (each painted a stray
   cobble), now on paved nooks off the roads, two looking onto the springs, two either side of the road to the forge.
   Then (the user, again: "move any awkward brazier torches... and move those benches somewhere else"): one bench on a
   paved terrace looking down over the lava moat (row 12, between Clarence's road and the gate road), one in a little
   square before the forge where its road meets the main one (row 29); braziers in pairs at the mine's mouth, the way in
   and the lava bridge, the strays (in the ash, behind the forge, squeezed by the bathhouse) gone. Waiting on the user's
   playtest.
   **Done (2026-10-14): Sunwell Bazaar's clean-up** (the user: nothing specific, "go ahead with the checklist"): the
   diagonal caravan road kept but three wide (two through the gate), the jetty two wide with a rope railing and a pale
   trim, pale stones along the watering hole's bank, huts a and d gone (their knocks moved onto b, e, g and h), the rest
   spread out, buildings fading while you're behind them (`fade`). Machew and Jerome in `kasbah()`s on 5 x 4 lots
   (Jerome's at the top by the windpump, Machew's out on the east edge), with `s` name boards; their homes are now
   "Machew's / Jerome's Kasbah". Tests pass, no console errors; the walk-in-and-out leak loop wasn't run (the pane draws no
   frames hidden), so the user should walk in and out of a few houses on their phone. Every town's clean-up is done.
   **Done (2026-10-14): the Clearing's curve in every town** (the user's ask: "the animal crossing log style thing
   applied to ALL towns"): all five towns roll away at the Clearing's strength (`CURVE`, `?curve=N`, flat under
   `?aerial`), house insides flat; taps go through bent pieces of the ray (`tapRays()` in `js/event-3d.js`), long shapes
   are cut so they bend (`fineTris()`). Archived in `docs/roadmap-done.md`, details in `docs/reference/towns.md`.
   **Done (2026-10-14): a view past every town** (the user: "I don't like that wall of green"): the back wall and sky dome
   are gone; each town stands the Clearing's vista painting (`vistaArt()`, in its own colours: `TOWN_VISTAS` in
   `js/event-3d.js`) on its back edge, and its sides are trees only. Then the Shrine/Ruins and Thornwood looks' green skies became
   blue (every outdoor room there). **Then (2026-10-14) every town's backdrop rebuilt** (the user: "make them all grand
   and aesthetic and animated"): `js/town-backdrop.js`, layered and moving, hung on the rolled ground's crest, each town's
   landmark behind its exit gate. Details in `docs/reference/towns.md`.
   **Done (2026-10-14): Cinder Springs' bathhouse** (the user: "so stupid looking"): the two-storey adobe box with a pent
   roof stuck on is now a sento (`bathhouse()` in `js/event-3d.js`): wide and low, timbered plaster and lit lattice windows
   under a kawara roof with a steam vent on its ridge, a curved karahafu porch (`karahafu()`) with the ♨ crest, sign and
   indigo noren, red lanterns, a tall round brick chimney smoking at the back, tubs and a woodpile. Waiting on their look.
   **Done (2026-10-14): Sunwell's bazaar and every trade house's sign** (the user: the stalls round the Waystone "so lame
   and dinky", Persian needs a better sign, every trade home a sign and a Poké Ball one, the leaders' signs in the town's
   look): the market is a bazaar square now, long stalls on its four sides (a run of `n` is one stall, `bazaarStall()`:
   striped awnings, valances, kilims, heaped wares, lanterns, bunting, flags) with kilims on its floor; the hut by the sun
   gate (g) gone; Persian's tent wears a crimson marquee with a Poké Ball on top; every other town's trade house a
   `tradePost()` (a turning Poké Ball on a post, a TRADE board swinging off it); Sunwell's `s` boards are
   `bazaarBoards()` in each leader's colours. Waiting on the user's look.
   **Switched on 2026-10-15** (patch 1.20). ▶ Playtest on the live site, no flag needed now.
3. **The other four towns**, one a session (Wastes, Ruins, Thornwood, Savanna): the same code, new art, lines, shop set
   and Waystone. **Wastes done (2026-10-13): Cinder Springs**, Lavaridge's, as big as the village (38 x 36) but laid out unlike it (the user's ask: a switchback road up the slope, in bottom left, out top right, houses on the terraces between its bends, a big spring in the middle with the Waystone on its ledge; each town should get its own shape): crags and
   dead trees for a forest, adobe houses with smoking chimneys, a bathhouse (walked in: five Pokémon soaking, `castAt`),
   open-air springs steaming, the mine head with its turning wheel and rails, a timber mine gate out, ash falling and
   embers rising; Heatmor's Forge holds the trade, Shaun and Clarence at home (Clarence live for the boys from 9 p.m.), 8
   locked houses, 10 folk (Geodude, Numel, Slugma, Torkoal, Machop, Cubone, Vulpix, Larvitar, Drilbur, Houndour; 11 cries
   added), its own 5 requests and Waystone. Built as a `style` over the village's code (CLAUDE.md's Gateway towns), so
   the next three are a style, a map and lines each. Its Waystone is broken like the village's (mending is session 2's).
   Branch `towns` (and `claude/next-town-oahwio`), waiting on the user's playtest.
   **Ruins done (2026-10-13): Driftwood Landing**, a fishing village on stilts over the lagoon (`style: 'lagoon'`), laid out
   unlike both (the user's ask: a new shape a town): a ring of boardwalk round the drowned temple's island (the Waystone at
   its middle, the request board, benches, tiki torches), spokes out to thatched huts on stilts with coloured caps, in up a
   jetty from the beach at the bottom, out through the temple's stone arch on the far shore. The ground is cut away over the
   water (`holes` in `wild()` / `shell()`: the floor's alpha), so the boardwalks stand on posts over a lit lagoon bed (the
   courtyard's flagstones and runes) under a clear rippling surface with lily pads (`lagoonWater()`, `lagoonSupports()`,
   `lagoonKinds()` in `js/event-3d.js`); jungle banks of palms (`lagoonJungle()`), moored rowboats (`y`), drowned columns
   (`|`), nets drying (`n`), the beacon on its rock (Wingull nesting), the Aquarium's glass dome (walked in: Lapras, Mantine,
   Corsola, Chinchou, Lanturn in its pools), Pat's houseboat (fairy lights, a rose in a bottle; he serenades the moon after
   10 p.m.), Kayl's house (Spooky the black cat, a recoloured Glameow, and Reya the purple Purrloin, 15 lines each; a home's `names`), Pelipper's Bait & Tackle (the trade);
   10 locked huts, 10 folk (Wooper, Psyduck, Slowpoke, Corphish, Marill, Poliwag, Buizel, Krabby, Wingull, Staryu; 9 cries
   added), its own requests (fights, the Mart, ❓ rooms, a flawless fight, the Gym). Homes' walls can be `boards` / `aqua`.
   The towns test now knows a bench takes two tiles. Branch `towns` (and `claude/next-town-oahwio`), waiting on the user's
   playtest. **Thornwood done (2026-10-13): Highbough**, a village in the treetops (`style: 'canopy'`), laid out unlike the other
   three (the user's ask): no roads at all, round platforms on giant trunks scattered over the drop like stepping stones,
   joined by rope bridges in no pattern but the trees', in up the lift at the bottom right, the Great Tree's deck in the
   middle (the broken Waystone, the board, a ring of lanterns round the trunk, its hollow to knock on), out through the vine
   gate at the top left. The ground is cut away everywhere but the platforms, so you look down through the bridges' slats
   to the jungle floor in the mist (ferns, a stream, glow caps lit at night); treehouses of logs with leaf-shingle roofs,
   their trees going up through them into crowns that fade while you're behind them; lone giants in the drop, lifts going
   up and down (2026-10-14, the user's ask: on their phone the Great Tree deck's rings covered the drop, so the air was cut
   out last with `destination-out` and the rings stamped tile by tile, no clip; the drop is twice as deep, `DROP` -7, with
   three mist layers and a haze over the floor). Walked in: Kecleon's Canopy Goods (the trade), Phil's (candles, Misdreavus, JONA after 11 p.m.), Ricky's
   (gaming with the boys after 10 p.m.), the glass Bloom Nursery (Bellossom, Sunflora, Cherrim, Oddish, Chikorita; Bellossom's
   cry added). 8 locked treehouses, 10 folk (Aipom, Hoothoot, Sentret, Hoppip, Seedot, Shroomish, Treecko, Teddiursa, Natu,
   Paras), its own requests (fights, ❓ rooms, an Alpha, a PP Up, the Gym) and broken Waystone. **Reworked 2026-10-14 after the
   user's playtest** ("hard to navigate for a bigger Pokémon, hard to tell where I can walk; only scary ghost Pokémon"):
   every rope bridge two tiles wide (`bridgeAxes()` in `js/event-3d.js` paints and ropes a lane by its reach), a rope
   railing round every deck edge over the drop and a pale trim inside it; a ghost town: 10 ghost folk (Gastly, Haunter,
   Duskull, Shuppet, Banette, Drifloon, Yamask, Lampent, Shedinja, Golett), Mismagius's Curio Shop for Kecleon's, the
   Withered Nursery's sleepers (Chandelure, Cofagrigus, Dusclops, Spiritomb, Gengar) on web rugs among graves, will-o'-wisps;
   16 cries added. Its furniture shelf is still Greenhouse / Garden (Spooky is the mall's; ask the user before swapping). **Tidied 2026-10-14 after a second playtest** (the user's circles): the Curio Shop moved to Phil's old spot right of the Great Tree, Phil's treehouse to its own deck at the bottom middle; five locked treehouses (P, X, Y, M, N) and the lone giant and canopy clumps they circled taken out; every deck a clean rectangle and every bridge two wide, landing squarely on a deck (no notches or half-lanes); the shop and Phil's have no tree through the roof (`tree: false` on a building, `treehouse()`), since those crowns hid the walkways. The user liked it ("much cleaner"); after it the Waystone moved onto the Great Tree's axis, 3 tiles wide under its hollow (it stood half a tile off, low on the deck by the bottom bridge, the user found it awkward). Last commit on `claude/next-town-oahwio`. Branch `towns` (and
   `claude/next-town-biome-layout-t5p8t9`), waiting on the user's playtest. **Savanna done (2026-10-13): Sunwell Bazaar**, a
   caravan trading post (`style: 'bazaar'`), laid out unlike the other four (the user's ask): one dusty caravan road cutting
   straight across the map on the diagonal, in at the bottom left, out through a sandstone sun gate at the top right; the
   market where it crosses the middle (the broken Waystone, the board, striped stalls, torches); the watering hole off to the
   top left, cut into the ground like the lagoon (mud bed, still water, reeds, a plank jetty, a windpump with a trough);
   round mud huts under conical thatch either side of the road, wagons drawn up bottom right, a kopje of boulders; the bush
   round it acacias, baobabs and termite mounds; dust drifting up. Walked in: Persian's Bazaar (a striped tent, the trade),
   Machew's hut (dark, a plastic katana; meditating by candle after 10 p.m.), Jerome's hut (the baby, r/GTA6 in eleven tabs;
   whispering at Reddit after 9 p.m.), the Caravanserai (Tauros, Rapidash, Zebstrika, Bouffalant, Kangaskhan). 6 locked huts
   and 2 locked wagons, 10 folk (Girafarig, Phanpy, Hippopotas, Sandile, Blitzle, Mankey, Trapinch, Doduo, Ponyta,
   Sudowoodo; 10 cries added), its own requests (fights, quick wins, the Mart, a relic, the Gym) and broken Waystone.
   `?town=savanna&home=machew&gymwins=1` walks straight into a house. Branch `towns` (and `claude/next-town-savanna-fpkg29`),
   waiting on the user's playtest. **All five towns are built**; next is session 2, the Waystone ring and visiting from home. ▶ Run in: CLOUD. Prompt: "Read CLAUDE.md and docs/roadmap.md's Towns and Waystones entry. Build the
   <biome>'s town the way the others were built, in its own new layout, then its Waystone."
4. **Give every town Highbough's clean-up** (the user's ask, 2026-10-14, after Highbough's tidy: "much cleaner"). One
   town a pass, the user circling what's in the way on a playtest first if they like: the Lantern Village, Cinder Springs,
   Driftwood Landing and Sunwell Bazaar (all four done 2026-10-14, see the Towns and Waystones entry; Lantern Village, step 2 above: the Waystone centred on its plaza on the avenue's axis, the bridge two wide and landing squarely, roofs fading over the paths behind them, `fadeBehind()`, rather than moved; `?town=<biome>&towns&aerial` now shows any town from above). The rules Highbough's tidy set: fewer locked houses (only enough to read as a
   town), every walkway a clean rectangle, every bridge / boardwalk / road two tiles wide and landing squarely (no notches
   or half-lanes), no tree, crown or roof hiding a path (`tree: false`), clutter that only fills gaps taken out, and the
   Waystone centred on its square or deck, on the axis of what it faces. Keep each town's own shape. `node --test
   tests/*.test.mjs` checks every door stays reachable. **Send the user an aerial screenshot** of the town before and
   after (the user's ask, 2026-10-14: the one of Highbough from above showed them the whole layout at once): headless
   Chromium (Playwright, `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`, Three.js routed to a local
   copy if its CDN is blocked) on `?town=<biome>`, a 900 x 900 window, the camera lifted high over the town's middle
   looking down (a throwaway `window.__top` hook in the town camera, never committed), sent with `SendUserFile`; a
   playtest link with it. ▶ Run in: CLOUD. Prompt: "Read CLAUDE.md and docs/roadmap.md's
   Towns step 4. Give <town> Highbough's clean-up, and send me an aerial screenshot before and after."
**Done (2026-10-15): the Waystone's waking made epic** (the user's ask): a ~8 s light show as the shard goes in (rune
   circle, motes, shudder, screen flash and shake, shockwaves, sparks, a pillar of light), a WAYSTONE AWAKENS card, then
   the town's Gym Leaders slide in glowing with new `awaken` lines (`docs/reference/towns.md`, "The waking, made epic").
   Branch `claude/next-town-oahwio` and `main`. Waiting on the user's playtest: `?town=<biome>&mend` (hand the
   shard in at the board). Next: whatever they want tuned in it.
   **Walk-up (2026-10-14, the user's ask: out of the Nietos' house the stone was off the screen):** your partner now walks
   up to the stone's doorstep first, the camera following, then the light show plays (a camera pan was tried first; the
   user picked the walk-up). The Clearing: `cutscene` in `js/hub-3d.js`. Towns: `t0` waits on the walk in `mendStone()`.
   Leaving the house after the shard is no longer a cut: a walk to the doormat and a fade (`outSlow()` in `js/run.js`).
   On `main`; waiting on the user's playtest.
**Done (2026-10-14): the towns' great halls, inside, made huge** (the user: "they SUCK the insides need to be HUGE and be
   super aesthetic and make sense"): the theater, bathhouse, aquarium, Nursery and caravanserai are 17 x 12 halls built
   as what they are (`js/town-halls.js`, `docs/reference/towns.md`'s last section). On `main`; the user playtested
   them the same day and they look good. Nothing open; any later tweak is the user's ask.
**Done (2026-10-14): the Gym Leaders' homes, inside, made big** (the user: "so small and very bland"): 13 x 10 rooms, each
   leader's own walls, floor, light and props (`js/leader-homes.js`, `docs/reference/towns.md`'s last section). On `main`,
   waiting on the user's playtest (`?town=<biome>&home=<leader>&gymwins=1`); ask which house to push further next.
   Same day, the user's ask: the Nietos' house in the Clearing got the same revamp (`LEADER_HOMES.nietos`; walk in from
   the hub with `?nietos&gymwins=1`, or without `?nietos` to see it "out"). On `main`, waiting on their playtest.
**The Nietos at home** (2026-10-14, the user's ask): their house in the Clearing stays; the Nietos (and Kangaskhan) are
   home in it only once THE NIETOS' Kangaskhan is beaten at the Clearing's Gym. How they show up is settled by step 7
   (their questline): `NIETOS_LIVE` is on, so they're home with the towns (`townsOpen()`); they still never visit the
   Secret Base. `?nietos&gymwins=1` previews it.
   **No Gym Leader visits the Secret Base** for now either (2026-10-14, the user's ask): `LEADER_VISITS_LIVE` false in
   `js/data/gym.js` (`leaderVisitor()` returns none); `?visit` still brings one for a page load.
5. **The all-five reward: Mewtwo's full strength.** **The Crystal Depths stay Mewtwo's alone** (the user's call,
   2026-10-14: no other starter ever goes down there to fight; "the Depths open to every starter" was built that day and
   reverted, commit 3dfe9ca / revert dcbbca6, along with Mewtwo talking at the gate and opening it at five shards).
   **Settled (the user's design, 2026-10-14): Mewtwo's Sealed Weakness.** Freed from the gate, Mewtwo is still too weak
   for what's below (its break-out talk already says so: `MEWTWO_LINES` in `js/gatescene.js`). It can always go down,
   but in the Depths only it carries a **permanent damage debuff** (a "Sealed Weakness" nameplate badge), and each
   Waystone Shard you give it lifts a fifth of it; all five, full strength. Its first three biomes are unchanged. Start
   around 50% less damage, 10% back a shard, and check with the bot that 0 shards is hard but winnable (never a wasted
   run). **The shards' progress is shown big**: a **pentagram of five shard slots**, slid in full screen like the gym's
   dialogue, the placed shards glowing in their towns' `RING` colours, the missing ones dark; seen before a Mewtwo run
   and when you meet Mewtwo after one. **The Depths camp**: once the seal is broken, the fall (or the Sealed Gate's
   portal) takes you down to a camp in the Depths you can walk round, between runs too, Mewtwo standing by the
   way in to the Depths proper; talking to it brings up the pentagram, and its lines change with the shards placed
   (why it needs them, what Eternatus is, how much of its strength is back). Builds with step 6 (the shards must drop
   first).
   **Built** (2026-10-14/15; two builds were made in parallel and the user picked, 2026-10-15: `main`'s behaviour with the
   other build's dressed camp, a miners' camp with tents, a fire, a crystal cart out of a mine mouth marked DEPTHS and the
   pentagram carved in a stone dais, and its pentagram window with the town list; the Prepare screen says the weakness).
   Waiting on the user's playtest: `?gate=0&strike=0&towns&shards=3` (a won run's landing), Mewtwo's Prepare with `&shards=`.
   **A won run's ending with the camp** (the user's yes, 2026-10-14): last boss → the fall → the Depths camp (walk
   round, talk to Mewtwo, the pentagram) → leaving it plays the win scene / Hall of Fame → unlock windows → result
   window. The win is recorded before the camp opens, so closing the game there never loses it; leaving only plays
   the celebration. A visit outside a run (the Sealed Gate's button) has no win: leaving goes back to the Clearing.
   **Who lands in the camp** (the user's yes, 2026-10-15): once the gate is broken, **every starter's won run** falls into
   the camp (it replaces the nameless throw-back, `kind: 'open'` in `descent()`), but **only Mewtwo goes past it** into the
   Depths proper, Mewtwo standing by that way in. The other starters' runs are where the shards are won (Mewtwo's never
   stop at a town), so ending them there hands a new shard straight to Mewtwo and lights its pentagram slot. **Kept short**:
   unless something new waits (a shard to hand over, a new line from Mewtwo), a won run's landing is one tap through to
   the win scene, not a walk round. **Mewtwo's own runs** land in the camp after their third boss (seeing how much of its
   strength is back) and go on down from there. Before the gate breaks, won runs strike it as now.
   **Built (2026-10-15): the Sealed Weakness, the pentagram and the Depths camp**, all behind the towns' switch
   (`sealOn()`: `TOWNS_LIVE`, `?towns` or `?shards=N`; live with the towns since 2026-10-15).
   50% in the Depths, +10% a shard (`SEALED_WEAKNESS`); bot, psychic, human / strong: 0 shards 64.0 / 63.7 (300 runs),
   2 shards 78.7 / 77.3, 5 82.0 / 92.0 (150): hard but winnable, kept.
   Every won run lands in the camp once the gate is broken; it's a walk (Mewtwo's talk coming to you) only when
   something new waits (the camp never walked, or a shard lit since Mewtwo last saw the pentagram, `save.campLit`, lit
   last with a flash), else Mewtwo's one line and a tap. Mewtwo's own runs stop there after their third boss (it feels
   its strength, the pentagram, then "Go down" is the way on into the Depths). Detail:
   `docs/reference/mewtwo-and-depths.md`. Playtest `?towns&shards=2&mewtwo&gate=0&strike=0` (the fall into the camp),
   `?towns&shards=1&mewtwo&descent=mewtwo` (Mewtwo's stop). **Step 5 is built; next**: the user playtests it (with
   `?towns`), and it goes live with the towns. Branch `claude/next-town-oahwio`, pushed to `main` too.
   **Done (2026-10-15): the Sealed Gate's portal leads to the camp, and Mewtwo's run starts there** (the user: the
   portal going straight to the Whispering Clearing made no sense). "Go through" is the camp (towns on or off); a tap on
   Mewtwo says why its run goes up through the three lands first (`whyLines()`), then "Set out with Mewtwo?" opens its
   Prepare step. Headless-checked both ways. Playtest `?mewtwo&gate=0&hubat=2,11` (Enter or tap the gate), `&towns&shards=2`
   for the pentagram first. Branch `claude/sharp-ramanujan-nh2503`, pushed to `main` too.
   **Done (2026-10-15): the camp's big look pass** (the user's ask: the broken Sealed Gate as the way into the Depths,
   looking broken through, and everything else cooler). The mine mouth is now the Sealed Gate itself, smashed open (door
   slabs strewn, a horn snapped off, the wall and floor split with violet light); the shard dais is a three-tier seal with a
   crystal spire per mended Waystone beaming into a floating core; tents, fire, crates and lamps dressed up. Draw calls
   down from 282 to 251 (merged). Waiting on the user's look: `?towns&shards=2&mewtwo&gate=0&hubat=2,11` (Go through).
   Branch `claude/sharp-ramanujan-nh2503`, pushed to `main` too.
6. **Questlines, the Satchel and Kurt's Workshop** (the user's idea and plan, 2026-10-14; all five sessions built,
   waiting on the user's playtest). Each town's 5 generic requests become a **questline with a story**, and the leaders open it:
   - **The loop**: a town is quiet till one of its leaders is beaten at the biome's boss; the next visit, that leader
     **slides in to greet you** (the gym intro's slide-in dialogue) and tells you about the Waystone (what broke it,
     what the town lost), unlocking the board. About 4 steps over a few runs, mixing **Do** (the `track()` events),
     **Find** (biome materials) and **Make** (crafted at home, brought back). **The last step is always a Waystone
     Shard** floating over an **Alpha node** on that biome's map: beat it, the shard goes into Key Items, and the next
     visit the leader puts it in and the stone lights (a short scene). Then the town's leaders can come to the Clearing's
     Waystone and the Secret Base (this replaces `LEADER_VISITS_LIVE` being off), and the board rotates small coin
     requests after. Story under it all: the shards are Crystal Depths crystal, cracked when the Sealed Gate was shut;
     all five fully light the Clearing's Waystone (ties into step 5).
   - **The towns' stories**: Lantern Village (John, Jahmes): the lanterns won't stay lit, spirits roam after dark,
     Jahmes's 11pm curfew, John can't pick the festival: wicks, **the player picks John's festival** (which furniture
     you get), relight the lantern ring, shard. Cinder Springs (Clarence, Shaun): the springs went cold, Shaun's comms
     tower is down, Clarence wants a reopening show: Magma Ore, a relay for Shaun, Clarence's costume, shard. Driftwood
     Landing (Pat, Kayl): stilt houses sinking, Pat's love letters in bottles across the lagoon: bottles on the map, pier
     supports for Kayl, deliver Pat's letter, shard. Highbough (Phil, Ricky): something haunts the ruined conservatory,
     Phil hunts it, Ricky films it all night: a Spirit Lantern, a night ghost fight, Thornwood seeds to restore the
     conservatory, shard. Sunwell Bazaar (Machew, Jerome): the watering hole drying, a robbed caravan, Jerome's "heist",
     Machew's broken katana: the stolen crates, **reforge the katana from Cinder Springs ore** (recipes across towns give
     the other roads a reason), shard.
   - **The Satchel**: a new Pokédex app (a `shelfApp()` in `js/bagdex.js`), the home stash that outlives runs, readable
     mid-run too: **Key Items** (shards, letters, the katana; one of a kind, never used up), **Materials** (counts by
     biome, each saying what it's for) and **Quests** (each town's step and what it still needs). "!" on new things.
     Named the Satchel since the Bag is the run's.
   - **Materials**: 2–3 per biome (wicks, ore, driftwood, seeds, spice...), from fight rewards and 1–2 sparkling map
     nodes a run; into the Satchel, never the run's Bag, and **kept on a lost run**. Rolled through `js/rng.js` anyway.
   - **Kurt's Workshop** in the Clearing (Johto's Apricorn ball maker): a workbench and a cauldron. Crafts quest items,
     **craft-only furniture** from each town's set, **gifts and dishes for visiting leaders** (each has a favourite; it
     raises friendship and they give their signature piece) and Apricorn ball **skins** for the Safari (looks only, the
     leaderboard stays fair). **Nothing crafted gives power in a run** (a carried potion would need a bot check first).
   - Sessions: (1) the quest engine: `QUESTS` per town in `js/data/towns.js` (step kinds `track` / `gather` / `craft` /
     `shard`), the leader-beaten unlock and slide-in greeting, the Satchel, tests; (2) materials: drops, sparkling nodes;
     (3) Kurt's Workshop and its recipes; (4) the shard: the marked Alpha node, the pickup, the mending scene, leaders
     coming home; (5) the dialogue, a town a session if it runs long. Towns live since 2026-10-15 (patch 1.20).
   - **Session 1 done (2026-10-14): the quest engine.** `QUESTS` in `js/data/towns.js` (a story, a `greet` per leader, 4
     steps a town: `track` / `gather` / `craft` / `shard`, each with its leader `by` and their `thanks`; a step may
     `gives` a key item, e.g. Pat's Letter, or `pick`, John's festival), pure helpers (`greeterOf`, `openQuest`,
     `questStep`, `countTown`, `handInStep`, `questProgress`), saved as `save.towns[id].quest` (`{ step, got, picks, lit }`);
     `mended()` is the shard put back (`quest.lit`) or an old save's 5 requests. In the town (`townRoom()` in `js/run.js`):
     quiet till a leader is beaten, then on the next pass that leader slides in (`gymTalk()`) with the Waystone's story and
     the board opens; a step handed in slides its leader in with their thanks, pays `QUEST_COINS` (50); once the shard is
     in, the board rotates the old coin requests. The Clearing's Waystone menu shows quest steps (n/4). **The Satchel**:
     `js/data/satchel.js` (`MATERIALS`, 12, 2-3 a biome; `KEY_ITEMS`, the 5 shards plus 7 quest items; `save.satchel`),
     `js/satchel.js` (save side), `js/satcheldex.js` (the app: Key Items, Materials, Quests; "!" on new things), on the
     Collection only while the towns are on. `?satchel` lends every material and key item for a page load (and on a
     `?town=` peek makes every step ready, to walk a questline: `?town=shrine&gymwins=1&satchel`). Tests:
     `tests/quests.test.mjs`. Materials and shards drop and crafts are made since sessions 2-4.
   - **Session 2 done (2026-10-14): materials drop.** In a town's biome while the towns are on (`?towns`): won fights drop
     one (`DROPS` in `js/data/satchel.js`: wild 40%, Alpha 1-2, boss 2-3; a line in the reward box) and 1-2 rooms a map
     sparkle (✧, `markSparkles()`, 2-3 of one material on walking in); Pat's bottles only sparkle. Refresh-safe
     (`run.gleaned`), kept on a lost run; the Satchel says where each turns up. Detail: `docs/reference/towns.md`. Branch
     `claude/sharp-ramanujan-nh2503`, pushed to `main` too.
   - **Session 3 done (2026-10-14): Kurt's Workshop.** A timber workshop in the Clearing's north-east (towns on only), walked
     into like the Nietos' house: Kurt (the user's sprite since 2026-10-15, with a blink made from it) at his workbench, a cauldron, Apricorn trees, a Slowpoke.
     His window makes, from Satchel materials (`RECIPES` in `js/data/workshop.js`): the 6 quest items (the katana from Cinder
     Springs' ore), 2 craft-only pieces a town plus John's festival piece, a gift for each of the 10 town leaders (given in
     their home: their favourite earns a signature piece) and 7 Apricorn looks for the Safari Ball. Detail:
     `docs/reference/towns.md`. What `liked` (gift friendship) is for: step 8. (The Nietos got gifts 2026-10-15: the
     Acorn Rattle earns a Big Kangaskhan doll.) (2026-10-15: the workshop is boarded shut till Law sends you for the Waystone Chime, and Kurt introduces himself on your first visit. Branch `claude/magical-hamilton-ve8726`, pushed to `main` too.)
     Branch `claude/sharp-ramanujan-nh2503`, pushed to `main` too (1094195).
   - **Session 4 done (2026-10-14): the shard.** At the shard step one Alpha on the biome's map has the town's shard over it
     (a crystal in the town's colour); beat it and the shard goes into Key Items. At the board, after its leader's thanks,
     the shard floats from your Pokémon into the crack and the stone mends before your eyes (`mendStone()`). Then the
     town's leaders come home: one a day by the Clearing's Waystone (the one who put the shard in, first), the others
     dropping by the Secret Base (`HOME_LINES`). Detail: `docs/reference/towns.md`. Playtest: `?town=shrine&mend` (the
     scene), `?biome=shrine&shard` (the marked Alpha). Branch `claude/sharp-ramanujan-nh2503`, pushed to `main` too.
   - **Session 5 done (2026-10-14): the dialogue, all five towns.** Each step's `talk` in `QUESTS`: its leader's word on
     the board while it isn't done (`nudge`, `stepNudge()`) and what both leaders say about it at home, said first
     (`homeTalk()`); `after`, their lines at home once the stone is lit; `chats`, the folk's talk then (`folkChats()`, the
     crowd's `R.chats` refilled each visit). `{pick}` is John's festival (`questLine()`, "autumn festival" before one).
     `HOME_LINES` are 4 speeches a leader now, a lot of them about each other (the Clearing deals one a day, the base one a
     visit). Tests in `tests/quests.test.mjs`. Branch `claude/sharp-ramanujan-nh2503`, pushed to `main` too.
     **Step 6 is built.** Next: the user walks a questline (`?town=shrine&gymwins=1&satchel`, `&home=john` for his house)
     and says what to change. Then step 5 (Mewtwo's Sealed Weakness, the pentagram, the Depths camp). Gift friendship (`liked`): step 8. Towns live since 2026-10-15 (patch 1.20).

7. **The Nietos' questline: mending the Clearing's Waystone first** (the user's idea, 2026-10-14). The Clearing's own
   Waystone starts broken, and the Nietos' questline mends it. Every town's questline comes after it: the Clearing stone is
   the hub the others link to, so you can't travel to a town from home until it works.
   - **Opens when you beat the Nietos** (their Kangaskhan, the Clearing's boss): on getting home (`cameHome()` or the
     Clearing after the run ends), Law and Britt **slide in** (`gymTalk()`, like a town leader's greet) with the story: the
     Clearing's Waystone is cracked, which is why the towns' stones are dead too. `NIETOS_LIVE` goes on, so they're home
     once beaten, and their house is where you hand in steps and hear their talk (`homeTalk()`).
   - **Their own quests**, `QUESTS.clearing` on the same engine (`track` / `gather` / `craft` / `shard`), about 4 steps, a
     leader `by` each (Law, Britt; Linc and Kangaskhan for flavour), with `thanks`, `nudge`, `talk`, `after` and `chats`
     like the towns. Do steps count in the Clearing biome. It needs **2 new Clearing materials** in `MATERIALS` (dropping
     in the Clearing biome, the `DROPS` / sparkle code), a Kurt `RECIPES` item for the craft step, and maybe gifts for the
     Nietos (that open question from step 6).
   - **The last step: an Alpha in the Clearing biome** carries the Clearing's shard (the marked Alpha from session 4).
     Beat it, bring it home, the Nietos put it in and the **main stone lights** (`mendStone()` on the Clearing's Waystone,
     `clearingWaystone()` in `js/hub-3d.js`: dull until then, its five town crystals still dull until their towns mend).
   - **What it gates**: until the Clearing stone is lit, towns still show up in runs (trades, chat, their homes), but their
     leaders don't greet you or open the board, and the Clearing's Waystone menu has no Travel (it says it's broken and
     points to the Nietos). An old save that already started a town questline counts the Clearing stone as lit, so nobody
     loses progress. Its menu and the Satchel's Quests list the Clearing first. Tests in `tests/quests.test.mjs`.
   - One session (two if the dialogue runs long). Playtest: `?nietos&gymwins=1&satchel`, `?biome=clearing&shard`.
   - **Built (2026-10-14), waiting on the user's playtest.** `QUESTS.clearing` in `js/data/towns.js` (Law and Britt's greet,
     4 steps all `by: 'nietos'`: win 5 fights in the Clearing, 5 Glowmoss, Kurt's Waystone Chime, the Clearing's shard), the
     Clearing's materials Glowmoss and Whisper Acorn, `clearingLit()` gating the towns' greetings and the Waystone's
     Travel. The greeting plays as the Clearing opens (`homeNews()` in `js/hub-3d.js`), steps are handed in at the Nietos'
     house (`homeRoom()`), and stepping out after the shard plays the stone's light-up (a beam, the cracked stone swapped
     for the whole one). `NIETOS_LIVE` is on, but the Nietos are home only while the towns are on. Playtest on the live site:
     `?towns&gymwins=1` (the greeting), then `&satchel` (every step ready, in their house). Next: the user walks it; then
     step 5 (Mewtwo's Sealed Weakness, the pentagram, the Depths camp), if the user still wants it. Open: the Nietos' gift (step 6's open question); whether the mending wants a bigger scene than the beam.
   - **Quest board (2026-10-14, the user's ask after walking it: "we don't have a place to pick up quests").** A roofed
     cork board on the plaza's north-west corner (`QUEST_AT` [11, 10], the PC's mirror; towns on only): its notice starts
     the Nietos' questline if the greeting didn't (`takeQuest()`), then it says the step up and where to hand it in, then
     every town's questline under way (`boardNow()`); a "!" floats over it with a notice to read or a step ready. The
     Nietos' house got a Quest spot that starts it too. Hand-ins stay at their house. On `main`, waiting on the user's look.
   - **Quests app (2026-10-14, the user's ask: an aesthetic window for the board, and quest progress from anywhere).**
     `js/questlog.js`: the Pokédex's own Quests app (out of the Satchel, which keeps Key Items, Materials, Gifts), a cork
     board of pinned notes, one per questline: the step up now with a progress bar, where its things come from, where to
     hand it in, every step on a tap, and how to start a locked one. Simplified the same day (the user's ask): one big DO THIS NEXT note (the step, a bar,
     WHERE, THEN HAND IN), then every quest as a one-line row that opens on a tap.
   - **Hand-ins to the leaders, with a "!" (2026-10-14, the user's ask).** Every town's steps are handed to their Gym
     Leader at home now, not the board (like the Nietos'); a "!" floats over that leader's house and over them inside while
     a step is ready; the shard's hand-in walks you out to watch the stone mend. On `main`, waiting on the user's look.
     Same day: the "!" moved onto the leaders' name signs (the user's call), the board wears a "!" till read once and then
     opens the Quests app, and the coin requests after a questline go to the leaders by turns too. Then: a tap on the leader
     wearing the "!" hands it in (no floating Hand in / Quests signs, which homes had no prop for), a small picker for
     John's festival, and the "!" drops with the curved ground so it stays on its sign or board. The quest board's button opens it ("Quest log"), and
     says it's in the Pokédex too; new-quest messages point there. On `main`, waiting on the user's look.
   - **John's festival happens in the town (2026-10-14, the user's ask: does the pick "actually happen"?).** Once Lantern
     Village's Waystone is mended, at dusk and night, the town wears the festival picked: Lantern Festival floats paper
     lanterns on the koi pond and strings red and white ones across the avenue; Moon Viewing hangs a harvest moon over the
     torii, pampas vases by the plaza and DANGO / TEA stalls; Fireworks Night bursts fireworks over the Shrine's stair, with
     TAKOYAKI / YAKISOBA stalls and a taiko. Mended in front of you, it appears as the stone blazes. Peek:
     `?town=shrine&towns&time=night&fest=lantern|moon|fireworks` (`&mend` too to watch it appear). On `main`, waiting on
     the user's look. Next: none planned; the user's call whether other towns' picks get the same.

8. **Done (2026-10-15): Friendship, what gifts are for**, all six sessions (a-f): hearts, heart lines, Secret Base visits,
   signature pieces 2 and 3, badges / letters / secret recipes, and (f) each friend's own requests on the Quests board.
   Every session's notes are in `docs/roadmap-done.md`; how it all works in `docs/reference/towns.md`. On `main`, waiting
   on the user's playtest (`?towns&satchel&gymwins=10&hearts=5`). **Since 2026-10-16 the Friends page is a Pokédex app**
   (the user's ask: it's carried into the towns where gifts are chosen), after Quests, a banner a friend in their own
   colours with their hearts, with a "!" the first time it's seen and on a friend changed since you looked; the PC's FRIENDS row opens it (`js/friendsdex.js`, `js/data/friends.js`;
   `docs/reference/towns.md`'s Friends app). **Since 2026-10-16 the game explains it** (the user asked whether any
   dialogue did): Kurt's `giftTalk` after the first gift made, and each friend's `GIFT_MEET` hello the first time home
   after their Gym, hinting at their favourite (`docs/reference/towns.md`'s Gift words). On `main`, waiting on the user's
   look. Next: nothing planned; the user's call.

**Smooth card art** (the user's yes, 2026-10-12: every card's picture off pixels, a picture of the move rather than an
item pun). **Done for every card a run can meet** (2026-10-12): all of Fire, Water, Grass, Psychic and Neutral, the tokens
(Cinder / Seedling / Droplet), the status cards and the Safari's Bait / Rock, ~300 pictures drawn as SVG: `ART` in
`js/card-art.js` (the starting decks) plus one file a type, `js/card-art-fire.js` / `-water` / `-grass` / `-psychic` /
`-neutral`, on the shared brushes in `js/card-art-kit.js` (flame, blaze, puffs, fist, boot, sun, gear, thermo...). Keyed by
base id, so upgrades follow; a Safari `sig-*` card sharing a pool card's name (Fire Punch, Aqua Ring...) borrows its
picture (`namesake()`, 93 of 514). `tools/cards.html` shows every one (`?ids=`), `?pixelcards` the old art. **Next**: the
other ~420 `sig-*` cards still use their PokéSprite item (batches when wanted); **relics and items**: the user wants to
see a smooth test of them later (a handful drawn the same way, then judged) before any batch. Branch
`claude/dreamy-galileo-0o4aqc`, pushed to `main` too.

**Poké Mall hall: fountains, palms, passers-by** (the user's asks, 2026-10-12, on `main`): the one big fountain was
in the way of the Game Corner's carpet, so it's two smaller ones (`FOUNTAINS` / `FOUNTAIN_SCALE` in `js/mall-hall.js`,
a ring painted under each by `floorArt()` in `js/mall-3d.js`) either side of a carpet running straight from the doors;
the palms keep to the sides (beside Furniture and Coming soon, the front corners). The hall has Pokémon now: the Game
Corner's crowd code with options (`makeCrowd()` in `js/corner-crowd.js`: `cast`, `stations`, `wants`, `castHours`...),
`hallCrowd()` in `js/mall-3d.js`, 4 at once (2 standing at `HALL_STANDS`, 2 wandering), one swapped every 40-80 s,
a cast of 6 from `SHOPPERS` (`js/data/mall-crowd.js`, 18) dealt anew every 8 UTC hours. Next: the user playtests (how
many, how chatty, the fountains' size); move to the archive once they're happy.

**Arcade overhaul: waiting on the user's playtest** (2026-10-17): all 18 Game Corner games were deepened in one pass (see
the archive and `docs/reference/hub-base-mall.md`'s "The arcade overhaul"). Next: the user plays them on the phone and
says which feel too hard, too easy or too busy; tune that game's numbers alone.

**Four more pinball tables: waiting on the user's playtest** (2026-10-17, branch `claude/wonderful-ramanujan-ri0gb0`, on
`main` too): Gengar's Haunted, Lapras's Lagoon, Charizard's Volcano and Rayquaza's Sky Pillar, on `js/pinball-kit.js`
(see `docs/reference/hub-base-mall.md`'s last section), patch 1.24 "Full Tilt". Played by a bot headless only. Next: the
user plays them on the phone and says which feel too hard, easy or busy (each file's top constants and its `make()`
numbers are the knobs); their 3D tables were never seen in 3D. All five tables stand in a row down the Arcade Room's right wall (moved from the Game Corner's, 2026-10-17; untested
in 3D, the cloud has no phone GPU).

**Home arcade: one game a session** (the user's call, 2026-10-12: "separate sessions"). A quick first pass of the first ten
went live in patch 1.7 (commit `7d94218` on `main`, branch `claude/dreamy-galileo-0o4aqc`): each is a prize machine at
Meowth's counter (450 coins), played in the Secret Base by a tap (`js/home-arcade.js`), every game a file on
`js/arcade-kit.js` (the shared cabinet window, Score / Best as record `arc-<id>`), its machine painted in
`js/base-furniture-rooms5.js` after `cabinet()`. None was playtested by the user yet, and the tap in the 3D base was never
tested (the cloud has no Three.js). Each session takes ONE game from a first pass to finished: the user plays it first
and says what's off, then feel (controls on a phone, speed, difficulty curve), art (sprites, backgrounds, effects, sounds),
a How to play that matches, a best-score moment, the machine's painting and 3D look in the base, and a patch-notes line.
Prompt for each: "▶ Run in: CLOUD (attach pokeDB-3). Read CLAUDE.md and docs/roadmap.md. Finish the home arcade's
<game> (<file>): ask me what I thought of it first, then polish it as the roadmap's Home arcade entry says. Test it
headless and send me a screenshot and a playtest link." Their 3D machines are done (2026-10-12): `B.arcade` / `B.whack` /
`B.pinball` in `js/base-mesh.js`, shapes in `js/base-shapes.js`, pictures in `js/arcade-art.js` (the claw and skee-ball
still the auto hull). Since 2026-10-17 every machine stands in the Arcade Room, free to play (`MACHINES` in `js/mall-arcade.js`); before that
eight stood under the Game Corner's screens, and Pong and the Maze under the two Plinko boards on the left (2026-10-12, the user's layout: the second board back,
both raised like the screens; the right wall's top four slot machines taken out; the cabinets' flicker fixed by
polygon offset and wider gaps in `js/base-mesh.js`, not yet seen on the user's phone). The claw and skee-ball aren't
in the Game Corner yet. Magikarp Fishing was replaced by Pidgey Flap and two games added (2026-10-12, the user's picks
from Psyduck Pong / Spearow Flap / Gastly Maze, Spearow made Pidgey); a first pass each, played headless. Twelve now,
in this order (the user may reorder):
**Swipe cabinets** (2026-10-12, same branch and `main`, the user's ask): Poliwag Crossing and Ekans Trail have no play
buttons (`swipe: true`, `swipeDeck()` in `js/arcade-kit.js`): a faint "swipe to play" with a gliding fingertip, and
START / EXIT as two small Game Boy pills side by side (`.ar-pill`). Next: the user playtests; say if other cabinets want it.

**Arcade marquees and the mall's frame rate** (2026-10-12, the user's ask; branch `claude/dreamy-galileo-0o4aqc`, on
`main` too): every cabinet's head is a lit marquee (`marquee()` / `MARQUEE` in `js/arcade-kit.js`: the game's Pokémon GIF
bobbing on a turning sunburst, two sets of chasing bulbs, a ribbon line over the name in gold, fitted to one line by
`fitText()`; `.arm-*` in `css/corner-games.css`, composited animations only), and the start screen's name shrinks to fit
(`banner(..., maxW)`). Frame rate: the mall's canvas at the scene's own size, never 2x (like the base), a weak device steps
down shadows then resolution (`keepUp()` / `stepDown()` in `js/mall-3d.js`, `pokedb.mall3d.low`), a place's shaders,
textures and first frame done under the curtain (`warm()`), the hall's window pieces painted after it opens; furniture
painted on CPU-backed canvases (`willReadFrequently` in `p.art()` and `finish()`: `finish()`'s pixel readback from a GPU
canvas stalled 40-95 ms a piece, now 2-5; the Furniture store opened ~5 s faster headless), the Plinko boards at 20 fps
with no mipmaps; the kit's `stamp()` paints a game's still parts once (Breakout 325 fills a frame to 31, Bowling 97 to 4,
Ekans and the Maze too). Measured headless only (SwiftShader: no phone GPU). Next: the user's phone playtest.

**Controls and frame rate pass** (patch 1.10, 2026-10-12, branch `claude/arcade-cabinets-design-yh10el`, on `main` too):
a cabinet's `stick: false` drops the joystick (Berry, Ditto, Stacker, Memory, Puzzle), `keys: { left, right }` puts big
held arrow buttons under each thumb instead (Crossing and Maze ◀ ▶ / ▲ ▼, Pong ◀ / ▶), Invaders' FIRE is a deck button;
Ponyta falls faster (`FALL`), Pidgey's trees lost their leaf clumps. Frame rate: sprites stamped from a cached first frame
(`still()`), the canvas at most 1.5x, the cabinet's CSS lights still while playing (`.playing`), Crossing's backdrop and
Puzzle's panels cached as bitmaps (4x CPU throttle headless: Pong 36→55 fps, Crossing 27→56, Puzzle 15→45). Volleyball
keeps its joystick for now (the user's call). Waiting on the user's phone playtest of these.
1. Whac-a-Diglett (`js/arcade-whack.js`, machine `whackmachine`)
2. Pidgey Flap (`js/arcade-flap.js`, `flapcabinet`)
3. Snorlax Stacker (`js/arcade-stacker.js`, `stackercabinet`)
4. Ponyta Dash (`js/arcade-runner.js`, `dashcabinet`)
5. Voltorb Memory (`js/arcade-memory.js`, `memorycabinet`)
6. Slowpoke's Claw Machine (`js/arcade-claw.js`, `slowpokeclaw`)
7. Poké Ball Skee-Ball (`js/arcade-skeeball.js`, `pokeskeeball`)
8. Pokémon Pinball (`js/arcade-pinball.js`, `pokepinball`)
9. Pikachu Volleyball (`js/arcade-volley.js`, `volleycabinet`)
10. Unown Word Search (`js/arcade-wordsearch.js`, `unowncabinet`)
11. Psyduck Pong (`js/arcade-pong.js`, `pongcabinet`)
12. Gastly Maze (`js/arcade-maze.js`, `gastlymaze`)
13. Poliwag Crossing (`js/arcade-crossing.js`, `crossingcabinet`)
14. Ekans Trail (`js/arcade-snake.js`, `ekanscabinet`)
15. Beedrill Invaders (`js/arcade-invaders.js`, `invaderscabinet`)
16. Electrode Breakout (`js/arcade-breakout.js`, `breakoutcabinet`)
17. Jigglypuff's Sing-Along (`js/arcade-rhythm.js`, `singalongcabinet`)
18. Where's Ditto? (`js/arcade-ditto.js`, `dittocabinet`)
19. Geodude Bowling (`js/arcade-bowling.js`, `bowlingcabinet`)
20. Poké Puzzle (`js/arcade-puzzle.js`, `pokepuzzle`)
13-20 were the user's yes to eight proposed ideas (2026-10-12): a first pass each, built and played headless in one
session, their cabinets on `B.arcade`, released as patch 1.8 "Arcade Night". All twenty stand in the Game Corner (the user's layout: eight each side of the counter,
Whac-a-Diglett on the left wall, Pinball on the right, the slot machines five a side as the base's 3D model); spares if more are wanted: Lunatone Rocks (Asteroids). Pachirisu Berry Catch was built 2026-10-12 (patch 1.9, `js/arcade-berry.js`) in Sing-Along's place; Sing-Along and Unown Word Search went into `RETIRED_PRIZES`. Squirtle Bubble Shooter (`js/arcade-bubble.js`) took Word Search's place the same day (the user's pick); its first playtest polish the same day (branch `claude/arcade-cabinets-design-yh10el`): a SHOOT key under the screen (`pad` in the kit; a tap only aims), an arrow for the aim (the dotted path only the first 3 shots), "Tap to swap" by the bubbles, new rows sliding down, bubbles drawn from cached sprites for the frame rate; Berry Catch's frame rate the same day (its sky, hills and tree painted once, `scenery()`, the Starf glow a painted `halo()` not shadowBlur) and, for every cabinet, the 3D base or Game Corner behind it stops drawing while one is up (`cabinetUp()` in `js/home-arcade.js`, read by `frame()` in `js/base-3d.js` / `js/mall-3d.js`; untested in the cloud, no Three.js); then (the user's ask, same day) every cabinet an arcade machine (`.ar-cab` in `css/corner-games.css`: a lit `.ar-marquee`, the screen in `.ar-bezel` with LED scores, `.ar-deck`: `joystick()` in `js/arcade-kit.js`, 8-way, sent to the game as the arrow keys, START / EXIT, the `pad` keys as round `.ar-btn`s); Bubble Shooter aims by the stick only (a tap only swaps), its launcher a dial, beam and chevrons, an underwater cave (`seabed()`); Volleyball a JUMP button. Next: the user says which other games need buttons (a `pad` line and the method it names); and every cabinet full screen (`.cg-overlay.ar`, `size()` fits the stage), no game closing on a tap outside (`openPanel()`'s `outside`, only the showcase and the guide keep it). Bubble Shooter's second playtest (2026-10-12, branch `claude/new-player-onboarding-ecwtke`): ◀ ▶ buttons in place of the joystick (`keys`; the stick leaning low sent "down", which swapped the bubbles by itself), the launcher kept drawn while a shot flies and the swap mark drawn as a path (both flickered on the phone), and the kit repaints a resized canvas at once (`paint()` in `js/arcade-kit.js`). Then (same day, same branch) its bubbles repainted after Puzzle Bobble's (`bubbleSprite()`: a dark outline, a glossy body, a type glyph embossed inside, `glyph()`, a bold shine and a rim of light), and the mall's tilt-shift blur off everywhere, the hall and shops too (`setPlace()` in `js/mall-3d.js`). Then (same day, branch `claude/pokedex-title-cry-bug-4bqe5z`, the user's screenshot of Puzzle Bobble) its foot redone: a brass launcher and gold pointer (`launcherArt()` / `pointer()`), the normal and shiny Squirtle animated (`gifFrames()` from `js/hd2d.js`) facing each other, the left one loading the next bubble from a bag (`bagArt()`, `load`), both hopping on a pop (`cheer`); a tap anywhere under the line swaps. Then (same day, branch `claude/jolly-ritchie-vdznxn`, the user's ask: clearing a board only to refill it was boring) endless levels: a cleared board is the next level, `LEVELS` in `js/arcade-bubble.js` ([rows, colours, shots a row] each; a 6th colour, Fairy, from level 7; past the last line one shot fewer a level, never under `MIN_PUSH` 2), `CLEAR` 500 x the level, a LEVEL N banner, "Lv N · Row in N" by the line; patch 1.13 cut with it. Then (2026-10-13, branch `claude/jolly-ritchie-vdznxn`, the user's pick after a look at how Puzzle Bobble does it) the endless random rows replaced by Puzzle Bobble's levels: 20 boards laid out by hand (`BOARDS` in `js/data/bubble-boards.js`: First Splash to Final Wave, 3 colours rising to 6, `push` 10 shots down to 6), nothing ever added, the ceiling itself lowering the cluster a row (`drop`, a riveted brass beam, `ceilingArt()`), the bubbles shaking the shot before, the board's name under LEVEL N; past the 20th they come round recoloured, a shot quicker a lap (never under `MIN_PUSH` 3); `tests/bubble.test.mjs` checks every bubble hangs from the ceiling. Next: the user plays it and says if the boards ramp right (a board's `push` or rows are the knobs) and whether they want more boards or a Puzzle Bobble hurry-up timer; ideas left over if more are wanted: Scyther Slice (Fruit Ninja), Spoink Bounce (Doodle Jump), Ampharos Lighthouse (Missile Command).
Polish pass across them (2026-10-12, the user's asks): every cabinet's How to play is an attract screen, the game's own
preview running on a little CRT over numbered step tiles (`helpScreen()` in `js/arcade-kit.js`, `.ar-help` in
`css/corner-games.css`), the head's Free play an LED pill (`.ar-free`); Poké Puzzle a round SWAP key over a smaller RAISE
(`SWAP` in `js/arcade-puzzle.js`), Ponyta Dash a smaller tap hop (`JUMP` 440), Gastly Maze side tunnels (`T` in `MAZE`,
`wrap()`). Weekly arcade leaderboards for those six (the user's yes, same day): `arcadeBoard/<week>_<game>_<uid>`, each player's best
of the week (the Sky Pillar's Monday), raised by any higher score (`ARCADE_GAMES` / `rankArcade()` in
`js/data/leaderboard.js`, `postArcadeScore()` / `KINDS.arcade` in `js/leaderboard.js`, posted from the kit's game over, a 🏆
key in those cabinets' heads); Squirtle Bubble Shooter joined them the same day (`bubble`). **Waiting on the user: paste the new `firestore.rules` into the Firebase console** (again since Bubble Shooter joined), or
nothing posts. Not yet tried against the real Firestore (blocked in the cloud session).
Also open: should the Furniture store's own Pinball, Claw machine and Skee-ball play too (now decoration only)? Ask.
The six casino games got real 3D models too (2026-10-12: `B.slot`, `B.cardtable`, `B.plinko`, Voltorb Flip and the quiz
on `B.arcade`), Meowth's counter sells only the 18 games (the rest `RETIRED_PRIZES`, kept by buyers), each a turning 3D
model on its screen, and the GAME CORNER sign was narrowed to clear the Pokémon screen.


**UI fixes batch** (the user's asks, 2026-10-07). One session each, all Run in: LOCAL (Desktop app, visual):
- ~~D2~~ and ~~E~~ done 2026-10-07 (see the archive). Staying cream on purpose (the user's call): battle's nameplates,
  Ability banner, intent bubbles and log, tap tips, keyword boxes, the cards' own text windows, the scenes' text boxes.
  `.btn` moves window by window, never globally (the cream `.btn` is still the default outside `.dev-window`).

**Waiting on the user: remove the smooth pilot?** The hybrid became the default on 2026-10-08 (see the archive). Still to ask:
whether to remove the smooth pilot (`?smooth`, `js/smooth-clearing.js`: one revert; the hybrid borrows its `glow()` / `dot()`, so
move those two into `js/hybrid-light.js` first). A more detailed pixel style (finer pixels, every painter redone) was talked
over and parked: a session or two a biome.

**More Settings options** (the user wants all seven, one by one, 2026-10-06; the OPTIONS screen is `js/settings.js`,
their meanings `js/prefs.js`). Run in: LOCAL for 1 and 4 (visual), CLOUD for the rest.
1. ~~Device colour~~ done 2026-10-06 (see the archive).
2. ~~Battle animations~~ done 2026-10-06 (see the archive).
3. ~~Flashing & shake~~ done 2026-10-06 (see the archive).
4. ~~Text size~~ done 2026-10-06 (see the archive).
5. ~~Nickname~~ done 2026-10-06 (see the archive).
6. **Music player**: a sound test replaying any unlocked track.
7. ~~Reset save~~ done 2026-10-06 (see the archive). The user skipped 6 for now.

The polish batch (the user wants all of it, 2026-10-03). One session each, in any order:

5. **Music hookups.** Run in: CLOUD, once the user drops files in `assets/audio/`. Find each new file's loop points
   (`LOOP_POINTS`), drop its fallback. Arrived: `eternatus`, `eternamax` (2026-10-18, wired), `map4` and the Sealed Gate's `seal`
   (2026-10-04), `mart` too. New tracks to wire if supplied: a Safari theme and the Game Corner (the credits and Energy Well songs arrived 2026-10-18). Real recordings can also replace
   synths (block, stick, gate-hum / gate-crack / gate-shatter, fireworks).

The user's second pick (2026-10-03), one session each:

9. ~~Seasonal title screen~~ done 2026-10-10 (see the archive).

**Journey films** (the user's pick, 2026-10-03: "like the fall into the Depths, but travelling"). Between a boss's
evolution and the next biome's `biomeIntro()`, a short film of the trip there: your evolved Pokémon walks a side-on
parallax road while the land morphs from one biome into the next and the sky runs dusk → night → dawn, with one
crossing set piece in the middle. Steps 10-12 are done (`js/travel.js`; the archive has them).

**The user's suggested order (2026-10-05): badges, then the Sky Pillar, then branching biomes.** Each part has a CLOUD
session (rules, data, saves, bot) then a LOCAL Desktop-app session (the look). Each prompt is the whole first message.

17. **Badges** are done (parts a and b: `js/data/badges.js`, the Trainer Card in `js/trainercard.js`; see the archive).
    The title's Game Modes sub-menu has the Sky Pillar's gem (`pillarGem()` in `js/title.js`).

18. **The Sky Pillar** is done (parts a and b, 2026-10-05: the rules, then the painted tower; see
    `docs/reference/sky-pillar.md` and the archive). Still the user's: publish `firestore.rules` for the tower board and plaque.

19. **Branching biomes** is done (parts a-d, 2026-10-06/07: the crossroads, the Sunken Ruins and the Thornwood Jungle,
    each painted with its films; see the archive). The new roads open after two won runs (`roadsOpen()`, 2026-10-10; was a Level 2+ win with each type). Still the user's: hear the new synths and films on a phone.

20. **A Fire biome and a shuffled pool of roads** is done (parts a-c, 2026-10-07: the Sunscorch Savanna, the pool of three
    roads rolled at each run's start, its look and films, journey films for every pairing, its badges; see the archive).
    Still the user's: watch the new trips on a phone (`?travel=ruins&from=shrine` etc.).


21. **Sky Pillar augments** (the user's call, 2026-10-07: like League's Arena / ARAM Mayhem, "a SHIT TON of augments"
    so the tower is fun and replayable). The whole plan, rules and a first list of ~110 augments are in
    `docs/augments.md`: no Game Corner perks anywhere in the tower, one of three augments before floor 1 and after every
    guardian, Silver / Gold / Prismatic by height, 1 reroll, type-only ones (Fire must reach floor 100 sometimes; it's 0%
    in the bot today), every offer from the week's seed so the leaderboard stays even.
    - Parts a (the picks and effects) and b (the look) are done: see the archive.
    - Parts c (trade-offs, sets, badges) and its tuning (2026-10-08) are done: see the archive.
    - Part e (the five augments the bot never took, reworked) is done: see the archive. Floor 100: Fire 23%, Grass 56%, Water 41%.
    - Part d (Fire's augments, three new Fire augments, Risky Climb, the trap re-check) is done: see the archive. Grass is
      the strongest; leave it unless a playtest says otherwise.

22. **3D battles** (the user's ask, 2026-10-11: "I want to eventually use this new style for the main"). Battles look like
    today's but in 3D: the battle screen (cards, sprites, nameplates, text box, animations) stays the page's own, and
    `js/arena-3d.js` lays a 3D place under it with a fixed camera. Being built on the test branch
    **`claude/jolly-ritchie-vdznxn`**, never on `main` until the user says it goes live; every session for it starts from
    that branch and pushes only to it. Playtest at `https://raw.githack.com/patreekaRe/pokeDB-3/claude/jolly-ritchie-vdznxn/index.html`
    with `?arena=boss` (`&biome=shrine` / `wastes` / `ruins` / `thornwood` / `savanna`, `&slot=1` / `2` for a pool biome),
    `?bossfight=depths` (Eternatus), `?arena=elite` (an Alpha, any `&biome=`, the Depths too; `&stage=0-2`), `?arena=wild` (the same for a wild Pokémon); `&arena2d` shows today's pixel
    version of the same fight to compare.
    - **Done (2026-10-11):** every main biome's **boss** fights in 3D. The live pixel scene is the 3D view's background
      (`backdrop`, `#scene-bg` as a texture), so each boss's own backdrop keeps playing (the Ancient Tree's pulse, the lava,
      the tide wheel, the storm at low HP); 3D pads stand where the page draws its Pokémon (`layout()`) and follow them
      every few frames (`follow()`), so a sprite that loads late or resizes keeps its pad (the user saw a boss off its
      platform). The Clearing also lays its 3D ground, bushes, flowers and side trees up to the pixel horizon
      (`sceneHorizon()` / `sceneColour()` in `js/scene.js`); every other biome's pads take its floor's colour
      (`padKit()`). Clearing Alphas are 3D too. A boss keeps its pixel prelude, then the 3D fades in.
    - **Done (2026-10-11): b, the Alphas.** Every main biome's Alphas (Team Rocket's too, an `elite` fight) get the boss
      treatment: `arenaFor()` takes `elite` in every `MAIN` biome. `?arena=elite&biome=` takes any biome, the Depths
      too (with Mewtwo, fully powered up; `peekDepths` in `js/run.js`). Checked at 390x844 and 1280x800, every biome.
    - **Done (2026-10-11): c, wild fights.** Every main biome's wild fights get the same treatment (`arenaFor()` takes
      `fight` / `wild`; not Safari, Sky Pillar or Kenmatta). `?arena=wild&biome=` (any biome, the Depths with Mewtwo,
      `&stage=0-2`). Since a wild fight is the most common, a device under ~40 fps steps the arena down, shadows then
      resolution, remembered in `pokedb.arena3d.low` (`keepUp()` / `stepDown()`, the Secret Base's way). Checked at
      390x844 and 1280x800, every biome.
    - **Waiting on the user:** a phone playtest of the wild fights (`?arena=wild`, the Clearing first, which has the most
      3D): does any stutter? The cloud's browser renders 3D in software, so phone frame rates were never measured.
    - **Done (2026-10-11): Kenmatta's arena** (the user's yes). His fight stands on 3D stone pads before his Mortal Kombat
      courtyard (`wantsArena()` takes `def.arena` 'kombat', mounted as biome `kombat`). Since the same day (the user's ask)
      the courtyard is 3D up to the painted wall (`dressKombat()`): flagstones in the painted floor's colours, his dais
      against the wall with carpeted, gold-edged steps (his pad raised onto it, `kombatLift()`; the painted steps step
      aside while it's up, `sceneDais()` in `js/scene.js`), two braziers with flickering fire and light, embers, and the medallion as a smooth gold relief (`medallion3d()`: Dragonite traced from its own sprite, blurred and cut again so its pixel steps round off, baked into `assets/arena/` by `tools/medallion.html` since traced live it never showed on the user's iPhone; hung on the wall between the nameplate and the Pokémon, clear of the dais; the painted one steps aside, `sceneBare()`). `?arena=ken`
      (`&biome=`) walks a throwaway run straight into his fight.
    - **d. Each biome's own 3D foreground**, like the Clearing's, about a session a biome; then main. `GROUNDS` in
      `js/arena-3d.js` is one `dress*()` a biome, handed the ground's span, the fade and the placing tests by `build()`.
      - **Done (2026-10-11): the Wastes** (`dressWastes()`). Its ground takes the pixel floor's own colours row by row
        (`rowColour()`, divided by the light falling on it, `flatLight()`, so it fades into the pixel floor at the
        horizon), read again once a boss's prelude is over (`retint()`: built under it, the floor was mid-eruption), its
        haze the far floor's colour. Lava cracks are merged ribbons (`ribbons()`: scorch, molten core flowing, additive
        glow breathing), lava pools in the Lava Fields and at the Crater Rim, instanced basalt rocks and ash heaps,
        obsidian shards from the Volcano Slope on, charred snags at the sides (one merged mesh each), ash falling and
        embers rising (`drift()`), smoke off the lava, a rain of cinders in the storm. Spots are picked on screen
        (`spot()`) so a phone's narrow view gets its share; flat things keep off the middle between the Pokémon (the boss's
        lava runs across it), tall ones to the sides. Light by the hour, `WASTES_TIMES`; its pads basalt with lava seams.
        ~40 draw calls a frame (the Clearing ~300). Checked at 390x844 and 1280x800, every place, day / dusk / night.
      - **Fixed (2026-10-18):** a Clearing side tree near the camera could fill the screen (the user's iPhone, a Forest
        Edge wild fight): `side()` in `build()` only tested the trunk, so its crown swept across the middle. It now takes a
        `reach` (the crown's spread, a snag's branches) and rejects anything that reaches past the camera. Checked headless
        with a probe of every prop's box on screen, Clearing and Wastes, wild / Alpha / boss, 375x667 to 1280x800.
      - Merged into `main` and live since 2026-10-11 (the user's call). Next: the Shrine, then Ruins, Thornwood, Savanna, Depths.
      Run in: CLOUD (attach `pokeDB-3` and `pokeDB-sim`). Prompt (swap the biome and its dressing each session): "Read
      CLAUDE.md and docs/roadmap.md's item 22, then give the Shrine's 3D arena its own foreground in js/arena-3d.js, a `GROUNDS`
      entry like `dressWastes()`: 3D ground from your feet up to the pixel horizon in the pixel floor's own colours,
      with the Shrine's stone (flagstones, lanterns, moss, fallen leaves, a torii post or two) round the edges, kept off
      the middle and the pads, lit by the hour; boss, Alpha and wild fights alike. Keep it cheap on a phone (instanced or
      merged meshes, the step-down still working). Check it at 390x844 and 1280x800 for every place (`&stage=0-2`,
      `&arena=boss`) with Three.js routed to a local `npm pack three@0.160.0` in Playwright, and give me raw.githack
      links." Order: Shrine, Ruins, Thornwood, Savanna, Depths.

**More ? events, the next batches** (the user's pick, 2026-10-17): 30 are in the game (merged 2026-10-17; the archive's
"More ? events" has the batches and bot checks). Toward StS's ~50: the curse events once curses land, and more on
StS events with Pokémon dress (one walkable 3D room each, every roll through `js/rng.js`, mirrored in pokeDB-sim,
bot-checked when one hands out power; give some a heal). Pairs with the "event-only relics" step below.

**Sky Pillar augments: re-check after the balance pass, then more Prismatics and sets** (the user's pick, 2026-10-17).
116 augments (Silver 38, Gold 48, Prismatic 30; 6 sets holding 25), all ranked in pokeDB-sim's `sim/augranks.json`, but
those ranks are from 2026-10-11, before the pass's 34 relics and 32 cards. The pass's climb check only went to floor 40
(fire 68 -> 70%, grass 80 -> 78%, water 53 -> 58%); floor 100 was last measured 2026-10-05 (Fire 0%, Grass and Water 7%).
A climb shows ~9 Prismatics of 30, so that tier repeats first. Then: re-measure the ranks, climb to 100 per type, list the
dead and must-pick augments and fix them, then ~10 Prismatics and 2-3 new sets (build-arounds), checked again.
▶ Run in: CLOUD (both repos). Prompt: "Read CLAUDE.md, docs/roadmap.md's 'Sky Pillar augments: re-check' entry,
docs/reference/sky-pillar.md, docs/augments.md and pokeDB-sim's README on the Sky Pillar. Re-measure every augment's rank
on today's main, run 4-flight and 10-flight climbs per type, and show me the dead and must-pick augments and Fire's top
floors before changing anything. Then retune, add ~10 Prismatics and 2-3 sets, re-check, and push to main."

**Perk loadout** (the user's pick, 2026-10-17). 15 perks today: 9 at the Game Corner (`PASSIVE_SHOP_ITEMS` in
`js/data/shop.js`, 14 levels, 11,800 coins) and 6 from Pokédex pages (`DEX_PERKS` in `js/data/pokedex.js`). StS has none
past Neow, and every always-on perk makes Level 0 easier, so new perks go in a loadout: own many, bring 3 into a run
(Hades' Mirror, Monster Train's covenants), chosen at the run's start. The 15 that exist stay as they are (players bought
them). Then 5-8 new perks that add choices, not stats, like the Pokédex ones (see the map, reroll, open a road), each read
through `perk()` / `dexPerk()` in `js/run.js` (a Safari first try stays fair), mirrored in the sim and bot-checked.
▶ Run in: CLOUD (both repos). Prompt: "Read CLAUDE.md, docs/roadmap.md's 'Perk loadout' entry and
docs/reference/economy-and-hall-of-fame.md. Propose the loadout (slots, where you pick it, what it costs) and 8 perks,
pick with me, then build it with the sim mirror, a bot check at Levels 0/3/5, a patch-notes line and a githack link."

**Friends list and base visits** (the user's go, 2026-10-17; was parked as "Friends and messages", 2026-10-07).
Offline visits, like Animal Crossing's dream visits: you walk round a friend's Secret Base as they last left it. Live
visits together come later, if ever (they need the full Firestore SDK with live listeners, not `firestore-lite`, and
avatar and position sync). Signed-in players only, no free-text chat. **Friend codes are in** (the user's call,
2026-10-17, replacing 2026-10-07's "no codes"): they are the easiest way in. Name search is left for later, because it
needs unique names, renames and a guard against rude names turning up in results. The easiest build, 2 sessions:
~~**Session 1, the list**~~ done 2026-10-17 on `claude/exciting-cray-y585nt` (pushed to `main` too; `docs/roadmap-done.md`,
details in `docs/reference/cloud-save.md`'s Trainers section): the trainer doc (it already carries `base`, the
`secretBase` as JSON), friend codes, `save.friends`, adding by code or a leaderboard name, the Trainers app, the tip and
the PC letter. **Its rules wait on the user** (Waiting on the user, below).
~~**Finding each other without meeting**~~ done 2026-10-17 (the user's ask, same day; `docs/roadmap-done.md`): the
Trainer Plaza, an "Added you" banner and the TRAINER LINK pop-up when someone adds you (the user saw a screenshot before
it was pushed). Same rules file, so one publish covers both. Then (same day) the TRAINER NETWORK welcome on the app's
first open and the Plaza's 3D board in the Clearing, merged with session 2's visits; the board and the quest board then
moved to the plaza's top corners (the user's marks). Branch
`claude/exciting-cray-y585nt`, pushed to `main` on the user's OK. **Next: the user publishes `firestore.rules`** (Waiting
on the user) **and playtests it on two signed-in devices.**
~~**Session 2, the visit**~~ done 2026-10-17 on `claude/visit-only-base-session-2-72ayar` (pushed to `main` too;
`docs/roadmap-done.md`, details in `docs/reference/cloud-save.md`'s Trainers section): the Trainers app's Visit walks round
a friend's base as they left it, read-only (`openBase3d({ guest })`, every base write refused by `visitBase()`), checked
by `tools/trainers-check.mjs`'s save-unchanged test. Then (the user's picks): Visit house / Visit yard for a base with a
backyard, and their trophy cases as they last saw them at home. **Next: the user playtests it** (two signed-in accounts, or
`?base&asfriend` alone); a guestbook of stamps is still a maybe.
~~**Friends' graves and the Plaza's buddies**~~ done 2026-10-18 on `claude/friends-tombstones` (last commit `da65d5aa`, pushed to `main` too;
`docs/roadmap-done.md`, details in `docs/reference/cloud-save.md`): a lost run (Safari and Sky Pillar too) goes up on
`graves/<uid>`, friends find the grave where it fell (the very room on the Safari, the door on the Pillar, the same
floor elsewhere), a tap opens the loss recap with Pay respects / Avenge, and up to 4 friends' buddies walk the Trainer
Plaza. Since: tapping a buddy past its talk opens its trainer's Trainer Card, and a page carries its Pokédex shell
(`card.shell`, the friend's page wears it; needs the new rules, else it's left off). **Next: the user publishes `firestore.rules`** (Waiting on the user) **and playtests it** (`?graves=3`, or two
signed-in accounts).
Later: name search and Follow, then the rest of the 2026-10-07 phase 2: Dark Souls signs from phrase parts on map nodes
(best on the seeded Safari / Sky Pillar, rated for coins), a daily gift in a friend's Lost & Found (the user's pick to
build first), maybe an Assist (a friend's partner for one fight, bot-checked).
**Friend ideas saved 2026-10-17** (the user's pick of these: **the daily gift**, one item a day to a friend, built
first when friends work resumes; the rest just saved). Real email was ruled out: it needs a server (Cloud Functions on
Blaze plus a mail service), iCloud drops Firebase's mail, and it means using sign-in addresses. Instead, in-game:
Trainer Mail through the PC (Easy Chat-style phrase parts, a stationery pick, an optional small gift; rules shaped like
`adds/`), Friends tabs on the Safari / Sky Pillar / Arcade boards, the visit guestbook of stamps, and trading spare
furniture or Safari Pokémon (hardest: both sides must agree at once). All need `firestore.rules` published first.

**The Berry Booth** was built 2026-10-23 (branch `claude/berry-booth-roadmap-build-h6mbqh` and `main`; archive). **Next: the
user playtests it** (needs Kurt's Workshop open and held berries kept): walk to the kiosk left of the gate, step through
the Guide, pack berries and a kit item, then see Prepare's "Bringing:" line. The booth and the Pokéstop moved a row
forward to the avenue's edges the same day (the user's ask), and the route sign was taken out; the user checks they don't hide the gate's runes. Then, ▶ LOCAL if the kiosk's look or the
window needs work (effort: low). ▶ Playtest on the live site.

**Take off a held berry** was built 2026-10-25 (branch `claude/berries-during-runs-pmaxy1` and `main`; archive). **Next: the
user playtests it** ▶ Playtest on the live site: `?biome=ruins&berries=oran,lum`, open the Bag's Items, Take off, then Hold.

## Ideas, not agreed yet (ask the user before building)

**Twins, what the 2026-10-26 pass left**: (1) the Safari signature cards: done 2026-10-27 (the user went with Claude's
recommendation; all of the twin rule, not only the 170 first counted, see the archive); (2) each type's plain **Strike
and Defend** stay plain (Claude's recommendation, 2026-10-27: a Duo Run's partners draw from their own decks, so two
types' Strikes never share a hand); (3) Kenmatta's dojo was rebuilt on the new cards, done 2026-10-26. (4) **The look-alikes the pass reworded**: done
2026-10-27 (the user: "why not just get rid of cards that are the same"); 28 cards left the pools and the rule reads
"5 damage twice" as "Deal 10" (`docs/card-twins.md`'s "Taken out of the pools", the archive). (5) **Signature cards and
the hits rule**, waiting on the user: under it 97 signature moves would read like a run card or each other (Swift 3x3
Retain / Night Slash 10 Retain...), and a Pokémon can't lose its signature, so each needs a real idea or stays; Claude's
recommendation: redo them in one pass, a type's area at a time. ▶ Run in: CLOUD, effort medium, both repos.

**Records and the jukebox, what's left** (live 2026-10-25, see the archive). Ideas not yet asked for: music fading with
distance from the jukebox; the player piece animating while a record plays; a nudge to go home once a new player mends
the Clearing's Waystone (Smeargle waits there for their next visit). More records: each a TRACKS line, loop points, a
TRACK_GAIN and a RECORDS line (`docs/reference/hub-base-mall.md`'s Records section).

**A basement in the Secret Base** (2026-10-25: the user asked whether you can build downstairs; you can't, floors only
go up, `lv` 0 the ground and each one up a staircase). Not asked for yet, only noted: it would take a negative `lv`, a
stairwell down in a ground-floor room (the `stairwell` branch's look) and its own floor tab on the blueprint.

**Battle juice, after the turn banner** (2026-10-25: the user asked what other "cool aesthetic UI stuff like this" the
game could use; 1-3 of Claude's list are built and on `main`, see the archive). Still ideas: (4) drawn cards fly out of the draw pile, played ones into the discard, and a reshuffle streams
discard into draw with a riffle sound (today it's a "♻️ Reshuffled" pop); (5) the PP pill's pips fill one by one with a
sparkle at turn start; (6) damage numbers that scale with the hit, and a short hit-stop and shake on big or super
effective hits (hit-stop is only on a boss's last blow today); (7) "Groudon's Turn" in place of "Enemy Turn" for a boss
or Gym Leader; (8) a red heartbeat vignette at low HP, matching the low-HP sound loop (likely a no: the user found red arena edges odd). Every one checks `battleFx()` /
`calmFx()`. ▶ Run in: CLOUD (build) then PLAYTEST, effort medium each.

**Friends playing it as an app on their phones** (the user's question, 2026-10-24: "turn it into a game on Unity or
something other than a browser"). Claude's answer, not decided yet: **no Unity**, since that means rewriting ~200k lines
of JS and every three.js place from scratch. The game is already an installable web app (`manifest.webmanifest`,
`fullScreenApp()`), so friends can Add to Home Screen today. Steps, cheapest first: (1) **a service worker** (there is none
yet), so it opens instantly and works offline once cached. Cache assets as they're used, not the whole 186 MB (111 MB of
Pokémon GIFs, 72 MB of audio), and version the cache so a push still reaches players. ▶ CLOUD, effort high. (2) **Lighter
downloads**: re-encode the audio smaller and look at WebP for the GIFs, checked by `tools/budget-check.mjs`. (3) **A
Capacitor wrapper**, the same code in a real Android / iOS app: an Android APK can go to friends directly, but iOS needs a
Mac and Apple's $99 a year. **The app stores are a no**, because Pokémon's names, sprites and cries are Nintendo's and the
stores take such apps down. They could only take it with original art and names.
**The user's go, 2026-10-24** ("I want both"), as two sessions: **1, smoothness** (done the same day: the Center and Mart
sleep, mono songs, the hidden title blink; "Mid-run reloads" above), then **2, loading** (▶ Run in: CLOUD, effort high):
the service worker of (1), and the music re-encoded smaller with every `LOOP_POINTS` loop checked after (re-encoding can
shift timing). The GIF-to-WebP step is out: `js/gif-frames.js` decodes GIFs itself, for little gain. Claude's note to the
user: neither makes play smoother, only loading.

**Cloud save: look at the cloud again when the game comes back from the background** (Claude's offer, 2026-10-23, not
answered yet): a tab left open on one device only learns the other played at its next save, then asks "Two saves found".
Re-checking on return would take the newer cloud save quietly when this device hadn't changed (a reload mid-play, so ask
the user first). ▶ Run in: CLOUD, effort medium.

**Secret Base houses: still open after launch (2026-10-23).** The houses went live (archive: "Secret Base houses").
Waiting on the user: **insides per house** (Claude's pick: drop them, since a round or narrow room breaks friends' laid-out
rooms; a safe middle is house-themed floors, wallpaper and window frames only). Watch for: a friend's lawn shows the
Ancient Tree until they open the game after launch (their page then carries `lot`); the first real Trainers-app visit
through the lawn is its first test with the cloud (a githack link has none).

**The game feels too easy, Grass most of all; healing feels overpowered** (2026-10-22, the user, after a Servine run where
Apple Acid+ (1 PP, 11 + Vulnerable 2) sat beside Seed Bomb (2 PP, 10 + Vulnerable 2)). The human bot, 150 a cell, sim
variants `heal75` / `heal50` / `heal0` / `appleNerf` / `synthEx` (pokeDB-sim, branch `claude/game-difficulty-healing-balance-e107sm`):
- Base: Grass L0 62.0 / L3 46.7, Fire L0 76.0, Water L0 60.0. To the bot Grass isn't the easiest; Fire is.
- **Grass is built on healing**: in-fight healing x0.75 takes Grass 62 -> 42 (L3 47 -> 23), x0.5 to 33, none to 6, while
  Fire only drops 76 -> 64 and Water 60 -> 43-53. A blanket heal cut would break Grass long before it touched the others.
- Single cards move nothing: Apple Acid+ at 10 + Vulnerable 1 (70.7, noise) or Synthesis with Exhaust (61.3).
- Out-of-fight heals are big too: evolving **fully heals** below Level 5, the Center 35%, Overgrow 3 a fight.
Claude's plan, put to the user (not agreed yet; ▶ CLOUD, both repos, effort: high):
1. **Trainer Levels 6-10** (StS's Ascension went to 20; ours stops at 5), for a player who wins at 5. Level 0 stays as it
   is for new players. Candidates, each set by the bot: "Bitter Medicine" (in-fight healing 15-20% less, with Grass given
   something back so its gap stays inside the others'), evolving no longer heals, Centers 0% (resting only upgrades or
   forgets), elites with a buff, a curse in the starting deck (with the Curses idea below), a tougher last boss.
2. **Enemies that answer healing**: a Heal Block move on a few enemies and elites (your heals do nothing for 2 turns), a
   counter Leech Seed on you. Pressure on heal decks only when they meet it. Pairs with "Enemy variety" below.
3. **Apple Acid+ to 10 damage + Vulnerable 1**, so Seed Bomb isn't strictly worse (the bot sees no change in difficulty;
   a fix for the card's design, not the difficulty).
First question for the user: which Trainer Level they were playing. At Level 0-2, try climbing first; at 5, build 1.
**The user: Level 5.** Levels 6-10 and the Apple Acid+ change were built the same day (see the archive).

**Rewards for Trainer Levels 6-10** (2026-10-22, the user: "What should we reward players for 6-10? Has to be worth it
right?"). Today a win from 5 up counts as a Level 5 win (gold star, Hall of Fame, the gate, badges), coins keep +10% a
Level (Level 10 pays double) and the Journal pays 2000 for unlocking Level 10. Claude's lean: nothing that makes a run
easier (it would undo the challenge and leak into the Safari and Sky Pillar); prestige that friends can see, coins, and
things for the Secret Base. **The user: "send it"; 1-3 built the same day** (archive); 4 and 5 still open:
1. ~~**A star that climbs**~~ done: a starter's gold ⭐ becomes the highest Level won with it, gold at 5 and a
   colour per Level up to a rainbow star at 10, on the portrait, the Trainer Card, a friend's Trainers page and the Hall
   of Fame entry. ▶ CLOUD, effort: medium.
2. ~~**A first-win jackpot per Level**~~ done:, as Level 5's 500 per type: the League mails 600 / 700 / 800 / 900 for the first
   win on 6-9 and 2000 for 10 (once ever, or once per type at 10). Data and mail only. ▶ CLOUD, effort: low.
3. ~~**A Level 10 title and look**~~ done 2026-10-22 (branch `claude/pokemon-master-title-cape-b33c37` and `main`; archive):
   "Pokémon Master" on the Trainer Card and a crystal pedestal in the Hall of Fame. **No cape** (the user's call, after
   one was built; seen again 2026-10-23: "looks retarded"). **The Champion's Crown instead** (2026-10-23, on `main`;
   archive): a 3D gold crown with rainbow gems floating and turning over the walking buddy, and a pixel one over the
   Trainer Card's partner, with a Crown key. **Next: the user playtests** `?master` (walk the Clearing; the Trainer
   Card). Maybe later: friends' buddies in the Plaza wearing theirs. ▶ Playtest on the live site.
   **A preview of the crown before it's earned** (2026-10-23, the user: "Is there a way to give the player a preview of the
   crown somewhere?"). **(a) and (c) done 2026-10-23 on `main`** (the user: "Let's just do 1 and 3"; archive): the Level
   picker shows the pixel crown and how to earn it from Level 5 up, and the Trainer Card a greyed crown, "Win Lv 10".
   Not picked: (b) a glass case with the 3D crown in the mall or the Clearing, (d) a "try it on" there.
   `?master` now skips the new-player setup and How to play (2026-10-23: the user's playtest link "doesn't work", as an
   empty githack save hid the buddy behind them).
   ~~**A Super Saiyan aura for each Level won**~~ done 2026-10-23 on `main` (archive). **Next: the user playtests**
   `?aura=6` to `?aura=10` (walk the Clearing; the Trainer Card's Aura key; the Level picker from 6 up) and says if 10 is
   crazy enough or any Level too strong. The user found 10 "laggy af" (cut to three draws), then loved it but found the
   crown hidden behind it and asked for it smaller (2026-10-23): every Level smaller, the crown drawn over it. **Next:**
   the user checks the size and the crown, and says if it still lags. Maybe later: friends' buddies in the Plaza wearing theirs. ▶ Playtest on the live site.
4. **Trophies for the Secret Base**: a cup for each of Levels 6-9 and the Champion's Trophy for 10, earned furniture
   (each a painting and a hand-built model). ▶ CLOUD, effort: high.
5. **Master Badges**: a Level 10 win with a Fire, a Water and a Grass starter, and all three (each a `LOOK` line). ▶
   CLOUD, effort: medium.
More creative ones (2026-10-23, the user: "Lets give them some cool creative stuff"; Claude's pitch; still no outfits
and nothing that makes a run easier). **The user picked 6, 7 and 10** (2026-10-23: "I like 6 7 and 10"); 8, 9, 11 and 12
not picked. **6, 7 and 10 built together 2026-10-23** (branch `claude/cloud-build-shells-letters-jggbf4` and `main`; archive):
the user playtests them (below). The user also asked to see the cape again: its build is
still playable pinned at `e3f047fc` (`rawcdn.githack.com/patreekaRe/pokeDB-3/e3f047fcbae98bf6bcf5b1d001d0d0a374389168/index.html?master`,
`&mall=outfitter` for its stand). If they want it back, revert `11f820a7`.
6. ~~**Foil decks**~~ done: a run with a starter won on Level 6-9 wears foil-edged cards in its star's colour, Level 10 a
   rainbow edge and a holo that follows the pointer or the tilt (Settings, Foil cards). **The user playtests** with
   `?foil=6` to `?foil=10` (lent for a page load, any run) and says if the edge is too thin or the holo too strong.
   ▶ Playtest on the live site.
7. ~~**Gold and Crystal Pokédex shells**~~ done as **Gilded** (Level 8) and **Clear** (Level 10; `?master` lends it):
   "gold" and "crystal" were already taken by Grand Champion's and the Catalogue's. The user looks at both (Settings,
   Device colour) and says if Clear is see-through enough. ▶ Playtest on the live site (`?master` lends both).
8. **The Master's constellation**: each Level won lights a star in the Clearing's night sky, in your starter's shape;
   Level 10 joins them up. Friends visiting see it. ▶ CLOUD, effort: high.
9. **A golden statue in the Clearing**: a Level 10 win casts that starter in gold on a plinth with your name and the
   date, one per type, up to three. ▶ CLOUD, effort: high.
10. ~~**Letters from the Gym Leaders**~~ done: three friends write on each Level 6-9 first win, the Nietos for everyone
    at 10 with a signed group photo (a wall piece). The user reads them (`?mail` doesn't hold them; a real first win
    does) and says if the voices are right. ▶ Playtest on the live site.
11. **The homecoming parade**: after the first Level 10 win, the Clearing at dusk with fireworks in the star's colours
    and the Gym Leaders lined up cheering (Lantern Village's fireworks reused), once. ▶ CLOUD, effort: high.
12. **The silent champion**: after Level 10, a secret summit with one last fight at Level 10's rules; a win puts a gold
    plaque in the Hall of Fame. New content, not power, and needs the bot. ▶ CLOUD, effort: high.

**Picking a duo's look and shiny** (2026-10-21, the user's question: "is this the best way to cycle through our
starters? any other ideas for shiny toggles?"). Built so far: ◀ ▶ under each portrait, and a ✨ on its corner (archive).
Ideas put to the user, none agreed (▶ CLOUD, effort: medium):
- **A look sheet** (recommended): tap a portrait's name to open a strip of every owned look of its type as small faces,
  an owned shiny as a second sparkly face beside its normal one; one tap picks look and colours together. ◀ ▶ could stay
  for a quick flip, or go.
- **Swipe the portrait** left / right to change look, in place of the arrows (saves the row; less obvious).
- **Shinies in the cycle**: ◀ ▶ step through normal and shiny looks alike (Charmander, ✨ Charmander, Cyndaquil...), no
  separate button.
- **A 🎲 random look** per portrait, among owned looks and shinies.
- **An "all shiny" switch** at the pool's head, for every owned shiny at once.

**After the Sky Pillar F100 combo pass** (2026-10-21; the pass is in the archive): left for the user.
- **Fire leads at Level 0 by ~8** since Flame Wall 9 (human bot, 300 a cell: Fire 79 / 55 / 32 at L0 / L3 / L5 against
  Grass ~69 / 54 / 28 and Water ~66 / 45 / 28; Fire trailed at L3 before). If Charmander plays too easy, Flame Wall goes
  back to 8 (only its upgrade at 13 lifted nothing) or Fire gets a lift aimed at L3 / L5. Waiting on the user's playtest.
- **Duo Runs**: Fighting's pairs now sit with Ground's at the top (~76), while Flying's and Dark's trail (~58, the mean
  ~68): for the next duo balance pass (▶ CLOUD, both repos, effort: high).
- Not touched, from the same sweep: Psychic's Safeguard + Amnesia; and if healing still runs away at the tower's top
  floors, the tower's own heal pressure (a `healMult` past floor ~50) rather than cutting heal cards.
- Two probes already failed on `main` before the pass: `tools/electric-probe.mjs` clicks `#player-bench` (gone with the
  turn-ending switch) and `tools/dark-probe.mjs`'s Night Alley day check. A small fix (▶ CLOUD, effort: low).

**A longer Safari run** (2026-10-20, the user: "I think we need to make our safari modes longer?"). Today a day is 3 areas
x 10 floors and a boss, the main game's length. Claude's lean: a 4th area a day (more of the Safari's rosters met, more
catching, ~33% longer) over more floors per area (more fights, not more Pokémon). It needs a bot check of the day's win rate
(a longer run is harder) and fair leaderboard days (a day's areas are seeded; `SAFARI_FROM`-style date gate so no played
day changes). The user first picked a 4th area (each area harder: slots 1-3 take the main biomes' hpMult / dmgBonus /
bossBonus, so a 4th needs its own tier, ~x6.3 / +29 / boss +40, gentler than the Depths'), then said no the same day:
**keep the Safari at 3 areas** (2026-10-20). Don't build unless they bring it back.
Then (same day) the user asked about a 4th area **for Duo Runs only**. Claude's lean: yes. A Duo Run is a replay that
never goes on the leaderboard, so its length can change without touching any day's fairness. Its 4th area would be one of
the new-type areas (Power Plant, Ice Cave, Dojo Mountain, ...), so every Duo Run can catch toward the duo pool. It needs its
own difficulty step (~x6.3 / +29 / boss +40) set by the bot: duos already win less than solo (electric+fire / +grass /
+water 64.7 / 43.7 / 36.3 against solo ~71), so area 4 may need to be gentler, or come with an extra card reward. Build it
on `duo-types` (the Duo Run isn't on `main`). **The user's call: wait until the duo types are finished**, then build it.
The user asked again on 2026-10-20 ("didn't we agree to have 4 biomes for duo run? And aren't the biomes completely
different from the daily seeded run?"). Not built: today a Duo Run replays the day's three areas on a fresh seed. Open,
for the user: 4 areas, and whether all four are the Duo Run's own rather than the Daily's.
**Settled the same day** (the user: "I think we keep it 3 biomes but always different than the daily seed"): built,
`duoRoad()`; 3 areas, never the Daily's. The 4th area is off.

**After the balance pass: more content, toward StS's numbers** (2026-10-16; the user wants these on the roadmap, to pick
from after playtesting the pass). Where it stands: cards per type ~72 like StS (done bar Water's 1 rare and Psychic's 6
uncommons), neutral 28 (StS ~35 colorless), relics 93 (StS ~180), items 34 (StS ~42). Every relic added thins the pool
(the pass's 34 cost Grass ~8 points at Level 3 until retuned), so each batch ends with a relic recalibration
(`sim/calib-new.mjs`) and a human-bot check against `main` (docs/reference/cards.md's "The balance pass"). In order:
1. **Shop-only and event-only relics** (StS has ~35): the Mart and the ? events get rewards of their own without
   thinning the fights' drops. Needs a `shop: true` / `event: true` tier that `relicChoices()` skips.
2. **More boss relics with a catch** (13 now, StS ~25), for a bigger pick after each boss.
3. **Curses**: StS's junk cards you keep for the run as a strong reward's price (a run-deck status card), which opens risky
   events and relics. A new card kind: never offered, removed only by forgetting or a relic.
4. **The last cards**: Water's 16th rare, Psychic's 6 uncommons (to 36), ~7 neutral (to ~35).
5. **Enemy variety** (the biggest gap now): StS's enemy tricks, such as Artifact (blocks your next debuffs), splitting,
   enemies that buff each other, fights with two or three enemies. Every fight is one enemy cycling its moves today.
   Engine work in `js/battle.js` and the sim, then enemies retuned.
   ▶ Run in: CLOUD (both repos), effort: high, on `main` (suggested 2026-10-19 to run beside the duo types' design doc;
   it is main-game work and the duo, Safari only, does not need it). Prompt: "Read
   CLAUDE.md, docs/roadmap.md's 'Enemy variety' item, docs/reference/cards.md and docs/reference/battle-screen-layout.md,
   and pokeDB-sim's README. Propose 5-6 enemy tricks (Artifact, splitting, enemies buffing each other, fights with two or
   three enemies) and which enemies get them, pick with me, then build them in js/battle.js with the sim mirror, retune,
   bot-check at Levels 0/3/5, add a patch-notes line and give me a githack link. Push to main."
Each is ▶ Run in: CLOUD (both repos), one per session, with art, `describe()` / `cardTerms()` lines and the sim mirror.

**The Duo key's picker in categories** (the user's ask, 2026-10-20: "I want them in categories so it's organized"; a mock,
not built; ▶ Run in: CLOUD, effort: medium, on `duo-types`). Today `js/duoprep.js` shows one portrait per type with ◀ ▶
for its looks. The mock (https://claude.ai/artifact/YQMMJCScQXDoPqKtXfqmQq) has LEAD / PARTNER slots on top (swap, clear),
then three groups: **Starter types** (Fire / Water / Grass), **Caught in the Safari**, **Still to find** (locked, with
where to catch one). Each type is a card with its Ability and a scrolling row of every owned look (legendaries tagged),
then today's road ▲ / ▼ and A = Start Duo. Waiting on the user's verdict before building.

**The Safari lobby's area rows with the Duo app's silhouettes** (2026-10-20, the user: "I might want a mix of those
1/2/3 biome names with number caught mixed with the sprites too"; **not decided for the Daily lobby**). The Duo app now
has that mix (collapsible rows with name, count, types and Pokémon; below). Open: whether the Daily lobby's LCD rows
should fold out the same way (`render()` in `js/safariprep.js` could reuse `road()` from `js/duoprep.js`).

**Safari duos, real types and new areas** (the user's shape, 2026-10-19; a plan to pick up, ▶ Run in: CLOUD, both repos):
- **The duo** (built first, Safari only): bring two starters of different types, one out at a time. Switch for 1 PP
  (maybe free once a turn); the one out sets your type for the enemy's hits (the intent shows the move's type, so you
  switch to resist), a card matching it hits harder (STAB), only its Ability works. The deck is half each type; card
  rewards offer both. Works on today's Fire / Grass / Water (3 pairs), no new cards. Mirrored in `sim/engine.js`, bot-checked.
- **The Duo pass** (a third Safari option beside Daily run and Replay): you pick your two, after seeing the day's 3
  areas in order with their main types, a few Pokémon and the rare spawns, so you plan for them. **Never on the
  leaderboard** (the Daily run, fixed starter, stays the ranked mode). Open: tries a day (unlimited, or one "pass" plus
  replays), owned starters only or any, coins no better than Replay (catches and signature cards count as usual), maybe
  its own board tab later. About 3-4 sessions with the duo.
- **Real types in the Safari only** (`run.safari`): every Pokémon its real (dual) types and real move types, the real
  18-type chart with no immunities (they become resistances), a x2 cap, Neutral cards outside it, elites and bosses
  still typeless; the main game keeps its triangle until this has proven itself.
- **New themed areas** (3 of N a day, so days repeat less), from Safari-only single-type Pokémon (checked 2026-10-19):
  Dojo Mountain (Fighting: Machop, Mankey, Makuhita, Throh, Sawk, Mienfoo, Hitmonlee), Night Alley (Dark: Poochyena,
  Purrloin, Absol, Umbreon rare), Psychic Grove (Drowzee, Spoink, Munna, Elgyem, Solosis, Ralts, Espeon rare); later a
  Power Plant (Electric) or an Ice Cave.
- **Growing the duo pool through the Safari** (the user's shape and words, 2026-10-19): a duo is always two, picked from
  a **duo pool** that starts as Fire / Water / Grass only; each Safari area holds starters of its own to catch, and a
  catch adds that starter (and its type) to the pool. **How many types:
  6 new, 9 in all** (worked out on the real chart, 2026-10-19): Fire / Water / Grass hit 8 of the 18 types super
  effectively; the best 3 more reach 15, 4 reach 16, 5 reach 17, and 6 is the fewest that gives every one of the 18 a
  counter (only Fighting hits Normal). Suggested six, all Gen 1-5 types: **Electric, Ice, Fighting, Ground, Flying,
  Dark** (Poison works in Electric's place; a set with Steel and Fairy also covers all 18, but Fairy is Gen 6). Psychic
  (Mewtwo's) could be a 10th later. Each new type gets ~70 cards like Fire / Grass / Water (the user's call, 2026-10-19; 35 was
  suggested, as a duo's pool is two types together). One themed area per new type (so ~9-12 areas, 3 a day), its starters caught there. Starters and
  enemies may be dual types under the Safari's real chart.
- **More playable types, discussed 2026-10-19**: skins with their own decks stay "nah" for now; the six new types are a go
  (Open, ready to build). Notes kept from the talk:
  If it comes back: Fighting / Dark / Psychic is the real chart's second clean triangle (Fighting > Dark > Psychic >
  Fighting; starters Timburr or Machop, Zorua, Gothita or Abra; Psychic would stop being neutral, so Mewtwo re-checked),
  Ground / Rock / Ice a weaker one; enemies can take all 18 real types cheaply, but playable decks cap near 9-10 types at
  ~70 cards each (all 18 only with ~35-card decks, Monster Train-style).

- **Suggested 2026-10-19, not picked** (a brainstorm session; each ▶ Run in: CLOUD, both repos where a battle rule changes):
  - **Biome weather as a battle rule**: rain powers Water, sun powers Fire, and so on per biome (data plus one modifier;
    mirrored in `sim/engine.js`, bot-checked per type).
  - **Enemy Abilities**: the one-per-type Abilities (`ABILITIES` in `js/data/relics.js`) on elites, e.g. a Grass elite's
    hits leech, a Water boss heals each turn. Pairs with "Enemy variety" above.
  - **Boss phases**: at half HP an area boss changes moveset (like Eternamax, but for every boss).
  - **Run history**: the last ~20 runs (starter, deck, relics, where it ended, the seed) in a Pokédex app; also a balance aid.
  - **Challenge codes**: a seed plus switches ("no relics", "Water cards only") shared through the Trainers app, built on
    `js/rng.js` and the Custom runs idea above; counts for nothing.
  - **A weekly mutator run**: the main game on one seed for everyone for a week, with a rule twist and a Friends board.
  - **Colour-blind mode**: a shape or letter on every type colour (cards, intents, the type chart).
  - **A guided first fight**, if `?onboard` doesn't already teach Block, energy and intents.
  - **Tests on every push**: a GitHub Action running `node --test` (later a short `budget-check`) on pushes to `main`,
    since nothing reviews a push before the live site gets it.
- **Suggested 2026-10-26, the user said "nah" to all of them** (asked "what other cool things can we add"; kept so they
  aren't offered again):
  - **A Rival** (Claude's top pick): Blue-style, met 2-3 times a run on the map, his starter the one strong against yours.
    Last time he fights with the deck you lost your previous run with (a ghost of it, saved at the run's end), so every
    loss sets up a revenge match. Beating him gives a rare card. Engine-light: an enemy built from a card list.
  - **Mega Evolution in battle**: a Mega Stone relic (one per starter) fills a meter as you play cards; full, the partner
    Megas for 3 turns (new sprite, +damage, a power of its own). The boss-relic fight's big moment. Sim mirror, bot-checked.
  - **The Elite Four**: unlocked after every gym badge, four bosses and the Champion back to back, a heal only between
    them, its own board. Who they are could be more of the user's friends (`gym-leaders.md`).
  - **Battle Factory** (a Frontier facility beside the Sky Pillar): no deck of your own, you draft one from packs of
    rental cards before each set of fights. Tests card knowledge, not unlocks, so fair for new players.
  - **A weekly Raid boss**: one giant Pokémon everyone fights through the week, each fight's damage taken off a shared HP
    bar (the leaderboards' backend), furniture for all when it falls. The first thing that makes the friends list play together.
  - **Trading with friends**: swap Safari catches through the Trainers app; Haunter, Kadabra, Machoke and Graveler evolve
    when traded, as in the games.
  - **Photo mode / Pokémon Snap**: a camera in the Safari and the hub, each shot scored on size, pose and how centred, an
    album app on the Pokédex, a "best shot" per Pokémon. Mostly UI over the sprites already there.
  - **Underground digging** (Sinnoh's wall-mining): a tap minigame in the Secret Base or the arcade, fossils revived at a
    lab into a Kabuto / Omanyte / Aerodactyl skin or furniture, spheres sold for coins.
  - **Alt-art cards and a binder**: booster packs (PokéCoins) of cosmetic full-art and holo versions of the cards you
    play, a Binder app, a holo shine on the card in battle. Cosmetic only, like skins.
  - **Mass outbreaks**: for one real hour, one Pokémon swarms a Safari area with better shiny odds, flagged on the Safari
    gate. Seeded by the UTC hour so it's the same for everyone (`js/rng.js`).
  - **Mystery Gift codes**: a PC app where a typed code gives a piece of furniture or a skin, so the user can hand out
    gifts to friends in person.
- **Second batch, 2026-10-26, not picked yet** (after the "nah" above; weirder, world and hub life; each ▶ Run in: CLOUD):
  - **MissingNo.**: a rare glitched node on a run's map, the map tiles scrambling round it; inside, a fight with
    MissingNo. (garbled sprite, moves named in static), glitch cards that do odd things, and a corrupted-looking skin or
    furniture as the prize. A secret people talk about.
  - **Team Rocket takes over**: a weekend world event where Rocket grunts hold the Clearing and the mall (shops shut,
    Meowth gone), beaten in fights round the hub, Giovanni at the end, and the place back to normal with a reward.
  - **Roaming legendaries**: Raikou / Entei / Suicune turn up on a run's map as a node that flees; hit it a little each
    run, and after a few runs it's cornered for a real fight and its skin.
  - **Camp curry**: cook at a rest stop on the run map (Sword and Shield's camp), berries and ingredients in, a run buff
    out, a recipe book filling up. Builds on the berry garden.
  - **Your Pokémon go travelling**: a Safari catch leaves the base for a few days and sends postcards (mail) from the
    towns and biomes, then comes home with a souvenir piece of furniture.
  - **Real weather in the hub**: it rains, snows or clears in the Clearing and the towns as it does where you are (a
    free weather API, the location asked once, off by default).
  - **Riding**: ride a Rapidash round the Clearing and the towns, Lapras across the pond, a Charizard flight between
    mended Waystones instead of the jump.
  - **Your own Gym**: build a gym (its puzzle tiles, its deck, your look) that friends challenge from the Trainers app;
    the badge they win from it carries your name.
  - **Poké Stock Exchange** in the mall: buy shares in Pokémon whose price moves with how often everyone picks them as a
    starter or catches them. PokéCoins only, a daily tick.
  - **A Poké Walker**: take the partner for a walk with your phone in your pocket, steps (the phone's motion sensor)
    earning items and hearts.
- Suggested 2026-10-05, not picked: shiny wild Pokémon (~1 in 100 wild fights), a "Save image" share picture of a
  win, Endless mode after Eternatus, Custom runs (switches that count for nothing), Unown letters hidden in the Depths.

- More polish suggested 2026-10-03, not picked yet: keyboard keys in battle on PC (1-0 play a card, E ends the turn),
  Android vibration on big hits (the Settings switch exists since 2026-10-06, iPhones tick since iOS 18),
  quiet background sounds for each place under the music.

- **Secret Base** (the user's idea, 2026-10-08: Gen 3's secret bases crossed with Animal Crossing). A room of your own
  to decorate: furniture bought with PokéCoins, a **daily stock** in its shop, some pieces only from badges / achievements
  / feats / Safari pages, and the Pokémon you caught in the Safari living in it, wandering and reacting to taps. Feasible
  on what's already there: the pixel room is a `PLACE_ART`-style painter (like the ? rooms), furniture is drawn in code
  like the biomes' landmarks (no sprite sheet to find: Gen 3's decorations aren't on PokeAPI), the daily stock is seeded
  by the UTC day like the Safari's (`js/rng.js`), unlocks are `test(stats, save)` lines like `BADGES`, the layout is one
  `save.base` (follows the cloud save), placing is tap-a-tile on a grid (phones, no dragging), and the Pokémon are the
  `save.safariDex` catches' front GIFs. Its way in: a Game Modes sign or a Pokédex app. Suggested parts, each a session:
  a) ~~the room, grid, placing / moving / storing, a starter set of ~15 pieces, `save.base`~~ done 2026-10-08, in 3D (the pilot below won);
  b) ~~the Furniture shop and its daily stock, prices~~ done 2026-10-08 with the first room's present and a 500-piece catalogue (`docs/roadmap-done.md`); ~~a "!" on new stock, wallpapers / floors for sale~~ done 2026-10-08 (`docs/roadmap-done.md`), ~~more kinds of piece~~ ~~(done 2026-10-08: 241 kinds, 4,212 pieces, dolls drawn in code, not from the sprites)~~; **1000 kinds, more detailed** (the user's ask, 2026-10-08): a kind is now bought once with every colour free; the user picked detailed pixel and the 241 are redrawn in it at 32 pixels a tile (`js/base-paint.js`, 2026-10-08); ~~the 1,000 kinds~~ done 2026-10-08 in five batches of themed shelves (1,008 kinds, 19,514 pieces, `js/base-furniture-rooms.js` to `-rooms5.js`; `docs/roadmap-done.md`); 44 more Pokémon dolls 2026-10-09 (60 Pokémon, 1,096 kinds, 19,602 pieces); dolls sewn as real 3D plushies and plants as a pot with crossed leaf cards 2026-10-09 (`js/base-plush3d.js`, `leafyModel()`);
  c) furniture unlocked from badges, achievements, feats and Safari pages: **the data landed first** (2026-10-09, a cloud
     session on main): `js/data/furniture.js`, 39 earned pieces, each `from` one badge / achievement / feat / Safari page,
     owned once its source is (`earnedFurniture(save)`, nothing saved), `howToEarn()` (??? for a secret source),
     `tests/furniture.test.mjs`. ~~Wired into the 3D base~~ done 2026-10-09 on `secret-base`: each is a catalogue
     kind, kept out of the daily stock, shown locked in the Shop with how to earn it (CLAUDE.md); Torchic / Treecko /
     Mudkip give their own dolls since the 44 new ones;
  d) Safari Pokémon on display: pick up to N, they wander, tap for a cry / hop / hearts, some pieces they use (a bed, a pool) (Run in: LOCAL);
  e) visiting another trainer's base: now "Friends list and base visits" under Open, ready to build;
  f) later (the user's ask, 2026-10-08): give the 3D base's tall upper wall (`dressRoom()` in `js/base-3d.js`, the wallpaper
     running up past a picture rail) a job: a **trophy shelf** up there showing your Badges, Hall of Fame wins and trophies,
     and maybe wall pieces (posters, clocks) hung higher than the 3-tile wall (Run in: CLOUD).
  Decorating (the user's ask, 2026-10-08, keep all of it): **rotate** a piece (a tap on it gives Rotate / Move / Store;
  drawn in code, a piece facing 4 ways is its front, back and one side mirrored, so 3 drawings, not 4), **wallpaper and
  floors** swapped like furniture, **rugs** under things, **small things on top** of tables and shelves (Gen 3's dolls on a
  desk: a second layer per tile), **colour variants** of a piece (a palette swap, cheap since it's painted in code), and
  maybe a **day / night light** through the window from `js/daytime.js`. Build rotate, wallpaper / floor and rugs into a);
  stacking and colour variants can be c).
  **Settled** (the user, 2026-10-09, Claude's suggested answers): **one room that grows** (it starts small, bigger rooms
  bought or earned; Gen 3's tree / cave / desert looks as wallpaper-like themes, so one painter, not three), **6 Pokémon on
  show** (more slots could be an unlock), **decoration only** (no perks: the reward is how it looks and the Pokémon
  reacting, and the Safari / Sky Pillar boards stay fair).
  **Branch rule:** Secret Base work stays on `secret-base` until the user says it goes live. A cloud session must start from
  that branch and push only to `origin secret-base`, never `main` (part c's data reached `main` by that rule, 2026-10-09).
- **Walkable 3D (HD-2D) pilot** built 2026-10-08 on `secret-base` only, not pushed (the user wants to playtest first):
  `?3d` (`js/base-3d.js`, Three.js 0.160.0 from jsDelivr) builds the `?base` room as a diorama from the same save and
  paintings (`roomArt()` / `pieceArt()` in `js/secret-base.js`), the partner's GIF frames via ImageDecoder (a live `<img>`
  without it), tap to walk (BFS round furniture), tap it for its cry, a follow camera, tilt-shift on the partner and bloom
  in one pass chain, light by `timeOfDay()` (`&time=night` pins it), `&fps` shows a counter. iPhones split GIFs with
  `js/gif-frames.js` (no ImageDecoder there). **The user's verdict (2026-10-08): 60 fps on their phone, and they want
  both, the base in 3D and the Clearing hub.** Sessions, in order, all on `secret-base`, all Run in: LOCAL (Desktop app):
  1. ~~The base in 3D for real~~ done 2026-10-08 (`docs/roadmap-done.md`): `?base` is the 3D room, decorated in place.
  2. ~~Safari Pokémon living in it~~ done 2026-10-08 (`docs/roadmap-done.md`).
  3. ~~The Clearing as a walkable hub, part a~~ done 2026-10-08 (`docs/roadmap-done.md`): `js/hub-3d.js` after PRESS
     START, the signs as Settings' Title screen: Signs.
  4. ~~The hub, part b~~ done 2026-10-08 (`docs/roadmap-done.md`): light and glows by the hour, fireflies / pollen, the
     legendaries flying over, the walk into the base and back, footsteps and the Clearing's air, the Escape Rope, the
     version tag. The boot (2026-10-08): the Clearing loads behind the shut Pokédex from the first frame, the partner walks in
     from the bottom after the power-on, and How to play comes out of and goes back into the corner handheld. Since then (the user's call, 2026-10-08) the Pokédex is no stand in the Clearing but a shut
     handheld in the bottom left corner that grows into the device over the hub and shrinks back into it (`openDevice()`'s
     `from`). Layout since (the user's calls, 2026-10-08): the Safari gate and its kiosk stand at the end of the back-left
     road (the gate set back behind the Ancient Tree since 2026-10-09, the road running on through it into the distance), a Game Corner stall on the left (`cornerStall()`: 3D and smooth, turned 45 degrees to the plaza), the Sealed Gate once broken on the right where the
     Pokédex stood. The bottom bar (2026-10-08, the user's pick) is the rooms' Pokédex bar: the place's name on the hinge's LCD, its gold pill, then Home (the corner handheld folded into it), round keys and the PokéCoins. **Next: the user playtests the branch and decides if it goes live.**
  Every session checks 30+ fps at 390x844 with `&fps`, and pushes the branch only, never main, until the user says.
  5. **The Poké Mall's shops, walked into** (the user's ask, 2026-10-08; `js/mall-3d.js`'s `FRONTS`). Each a session, all
     on `secret-base`, Run in: LOCAL (Desktop app):
     a) ~~Furniture store~~ done 2026-10-09 (`docs/roadmap-done.md`): `js/mall-furniture.js`, the west front.
     b) ~~Game Corner, walked into~~ done 2026-10-09 (`docs/roadmap-done.md`): `js/mall-corner.js`, the middle front.
     c) **The Game Corner revamp** (branch `game-corner-revamp`, merged into `main` and live since 2026-10-12, the user's call; patch 1.6 "Game Corner"). Built
        2026-10-10 to 10-12 in cloud sessions (the user has no local access); CLAUDE.md's Game Corner paragraph has the
        detail. Where it stands (2026-10-12, see the branch's last commit):
        - **Games (the user's keepers):** Voltorb Flip, Who's That Pokémon?, Slots (tap-to-stop, jackpot, Pikachu
          bonus), Plinko (12 rows, real-feeling fall), Blackjack, High-Low (their floor tables the base's 3D card tables since 2026-10-12, `B.cardtable` at 1.3x, `CARD_K` in `js/mall-corner.js`; the user's ask). **No betting since 2026-10-12** (the user's
          call, the cut-down numbers): all free, a few paying plays a game a day (`PLAYS`), 500 a day cap, 150 a game,
          an average day ~250 (`tests/corner.test.mjs`); raised later that day (the user's pick) to 10 slots, 10 Plinko, 5 each of Blackjack / High-Low / Voltorb Flip and a 7-question quiz, ~380 a day. Then (same day, the user's yes to all of it) Meowth's prize counter (6 new Game Corner pieces and
          Gen 1's prize dolls), records under every game and 8 Game Corner badges. Prize tickets for plays past the paying
          ones came and went the same day (the user's call: Plinko could be spammed): extra plays are for fun, the counter
          sells for PokéCoins (180-450, every game a prize: Blackjack, High-Low and quiz pieces added; the counter a showcase screen; every game prize playable at home, `js/home-arcade.js`, the quiz endless with a streak). Old tickets cashed in at 3 coins; the Chips meter and every "chips" line are gone,
          and Plinko's coins show only once the ball lands (branch `claude/dreamy-galileo-0o4aqc`, pushed to `main`). Then the home arcade (patch 1.7, below). A daily High-Low leaderboard came and went the same day: no leaderboards
          in the Game Corner (the user's call). Next is their playtest. Cut: Roulette, Memory Match, Gachapon (big dolls back in the Furniture store), Team
          Rocket Blast-Off. Every game has a How to play card (the "?").
        - **Meowth:** inside a U-shaped prize counter (front and both sides), its daily stamp card (5 different games) on
          the wall behind it earns a scratch card.
        - **The room:** casino carpet; back wall left two live Plinko boards spaced evenly up to the counter, right three
          equal mounted screens clear of the counter (Pokémon, Shinies, Perks; no Poké Balls; a Pokémon or shiny you don't own is a silhouette and a perk's levels are pips, "Level 1 of 3 owned", Buy Level 2, 2026-10-12; their sprites load through a
          page canvas, as iPhone drew them blank into an OffscreenCanvas); no tilt-shift blur at all; four tables (touchscreen Voltorb / Who's That behind, Blackjack /
          High-Low in front); a line of nine slot machines down each side wall (rows 2-10; the user's ask, 2026-10-12).
        - **2026-10-12 feedback pass:** the arcade leaderboard over Meowth's text made bigger (`boardScreen()`, the board 2.05
          tall); every Pokémon billboard takes its feet's depth (`feetDepth()` in `js/hd2d.js`, all 3D places), so a counter or
          table behind one no longer cuts across it; a little PC on the counter's right end with a bobbing "!" opens the Game
          Corner guide (`js/corner-guide.js`: what pays today and how much is left of the 500, the arcade and its weekly
          boards, taking games home, the stamp card, the showcases). Then a mini "!" over each paying game (slots, Plinko,
          Blackjack, High-Low, Voltorb Flip, Who's That), hopping now and down only once that game's paying plays are used up
          or its coins capped (`stillPays()` in `js/casino-pot.js`, rechecked every 3 s and after a game closes; the user's
          ask, same day). Then an hourglass on the counter's left end, opposite the guide PC, always turning: walk within 2
          tiles and a bubble over it counts down to UTC midnight, a tap walks up and Meowth says the time left and the day's
          coins (`timer` / `untilReset()` in `js/mall-corner.js`; a place's `tick(now, dt, hud)` and `leave()` in
          `js/mall-3d.js`, a game's `talkOnly`). The guide's rows say plays left for every game, the quiz "n of 5 answered",
          the stamp card "complete", a ✓ on finished ones (`puzzlesPlayed()`).
        **Asked, open:** the Pokémon screen sells only the 6 Game Corner skins (31 starters in all); offered to list the earned ones too, greyed with how to earn them, awaiting the user's word.
        **Next:** the user playtests on the live site and gives room/game feedback; work goes to `main` now. ▶ Run in: CLOUD (playtest links: `rawcdn.githack.com/patreekaRe/pokeDB-3/<full hash>/index.html?mall=corner&coins=3000`).
     d) ~~**The east front**: the Safari Outfitter~~ done 2026-10-15, made a grand safari lodge the same day
        (`docs/roadmap-done.md`). **Next**: the user playtests it (`?mall=outfitter&safari&coins=3000`) and says what to
        change. Poké Balls left the Pokédex's Game Corner app 2026-10-19 (the user's ask); the Safari prep window's Buy
        key still sells them (`ballsApp` in `js/shop.js`): say if that should go too. ▶ Run in: CLOUD.
- **Ranger Task Board and Trainer's Journal**: built and rebalanced 2026-10-16, with the Trainer furniture set and the gold
  shell, and its cases sparkling with news when you come home (`docs/roadmap-done.md`). **Next, if wanted**: a reward per Ranger rank, more tasks, seasonal Expeditions.
  Waiting on the user's playtest (`?base` to see the set once claimed). ▶ Run in: CLOUD.
- **Safari daily modifiers** ("all Pokémon are Water today", "Burn does double"), maybe tied to the clock.
- **More main-game Pokémon** (~70, per biome 3 wild, 1 elite, 1 boss). Candidates are in `docs/roadmap-done.md`'s
  Pokémon list; re-check each against the rules below before using it.

## Parked (don't start unprompted)

- Battery Saver (a Settings switch: 3D at 30 fps, backdrops at 15): built and taken out the next day, the user's call (2026-10-16: "keep it 60fps for now"). `git cherry-pick dc3e47e` brings it back whole, `slowFrameMs()` included.
- Gen 6-9 starters: the sprites staged in `assets/pokemon/_incoming/` have no Grass line, and they aren't official Gen 5 sprites (the rules below).
- Catching in the main game: dropped (the user's call, 2026-09-27). Only the Safari Zone catches.
- Game Corner skins Budew, Sewaddle, Lotad, Horsea, Spheal, Tympole: the user said no. Don't re-add them.
- A Safari "zone legend" (a weekly Pokémon catchable only on the last floor): the user said no, 2026-10-03.
- Friends phase 2 (signs, Lost & Found gifts, an Assist; the graves are done): see "Friends list and base visits" above.

## Waiting on the user
- **The Safari's song** (2026-10-24, the user's MP3, on `main`; `docs/reference/music.md`): plays in the Safari lobby and on
  every area's map, Daily and Duo Runs, looped over 17.25-48.34 s. Listen for the loop's join (~48 s in) and the level
  against the Clearing's song. ▶ Run in: PLAYTEST ON THE LIVE SITE.
- **The Nietos' mansion** (2026-10-20, branch `claude/nieto-house-extravagant-mansion-sf3f5m`, on `main` too; archive):
  the cottage is now a white château (turrets, portico, golden Kangaskhan at the gate) and inside a marble-and-gilt hall
  with chandeliers and a family portrait. Walk up to it in the Clearing (south-east), and go in with `?nietos&gymwins=1`
  so the family is home; say what to change (too big? colours? anything they'd never own?). ▶ Run in: PLAYTEST ON THE
  LIVE SITE.
- **The true ending** (2026-10-18, on `main`; archive): all five Waystones gets a TRUE ENDING (the sealed Well's still,
  Mewtwo thanking the towns, Eternatus gone from the title sky); fewer ends on THE END...? and Eternatus's eye opening.
  Playtest `?bossfight=depths&hp=0.001&shards=5` and `&shards=2` and say if the two feel different enough.
  ▶ Run in: PLAYTEST ON THE LIVE SITE.
- **The Ranger Task Board draws the eye** (2026-10-19, branch `claude/ranger-board-visibility-q9ogwn`, on `main` too;
  archive): its plaque and "!" had sat behind the eave. Now lowered, lanterns either side, the notes your own tasks, and
  a glow, sparkles and "!" while a task waits or till it's first opened. Playtest `?mall=outfitter&safari&coins=3000` on
  the phone and say if it calls loudly enough (or too loudly). ▶ Run in: PLAYTEST ON THE LIVE SITE.
- **Publish `firestore.rules` again** (2026-10-18, on `main`): one paste into the Firebase console (Firestore Database >
  Rules > Publish) covers the graves, the leaderboard's ✨ and every newer Trainer Card key (Shinies, Ranger, Gyms,
  Streak, Kenmatta, Summits, Starters, Defeated, Safari days, Coins, best shiny, rarest catch, Hall of Fame, pinned
  badge). Until then those show "-" or nothing on a friend's page. Then look at a friend's page (or `?mycard`: your own
  as a friend sees it) and say what to change.
- **Friends' graves** (2026-10-18, branch `claude/friends-tombstones`, on `main` too): paste the new `firestore.rules` into
  the Firebase console (Firestore Database > Rules > Publish): it adds `graves/`. Until then a lost run is kept in the
  save but friends can't see it, and nothing else changes. Then playtest: `?graves=3` on any run's map and in the
  Clearing (made-up friends, nothing saved), or lose a run on one signed-in account and look on the other's map.

- **Smoother transitions, on a phone** (2026-10-18, the user's ask; `docs/roadmap-done.md`): a new run's Clearing film,
  its first wild fight's wipe, the Shrine's and Wastes' films (biome and place) were measured headless and fixed. The
  user plays a new run on their phone and says whether the first fight's wipe and the films still stutter. Not fixed:
  the ~0.45 s freeze before a new run's film (the map, scenery and film painted at once) and the crossroads' ~0.4 s
  build behind its plain backdrop; next levers if they're noticed.

- **The phone reloads, round six** (2026-10-18, branch `claude/funny-pascal-bu8emp`, on `main` too; archive): round five's
  next levers, done: 2x multisampling on touch screens, songs decoded only up to their loop's end (four battle and gym songs
  loop sooner, the same repeat), a town's ground at 2048 px, two rooms kept (the town you're in always). Headless at an
  iPhone's size: a town 215 -> 183 MB, the gym 128 -> 106, a boss fight 79 -> 46. The friend plays as usual (the Home Screen
  app too) and, if it reloads, reads Settings' Save card ("The game reloaded by itself", shown only after one). The user
  listens to the boss, wild, elite and gym songs loop and looks at a town's ground. Next levers if it still reloads: the
  smooth paintings' canvases kept on the CPU beside their textures (~40-60 MB a town), the full-screen DOM layers (the probe
  can't see them), a 32 kHz song decode (~3 dB off at 10 kHz in Safari, so not done).
  Round seven (2026-10-18, on `main`, archive): the pixel scene stopped redrawing under every 3D place, a Base jukebox
  stops on leaving, the title's light loop no longer restarts under the Clearing; the Clearing's ~5 MB a mall / base trip
  leak stopped; the covered select screen hidden. Fights don't leak. `tools/budget-check.mjs` now guards all of it
  (CLAUDE.md's testing step 3). Next levers: a room's GIF-frame canvases, the map's full-screen layers.
  Open (2026-10-19): `--only=trips` passes even with that leak's fix in `sleepGL()` switched off (heap +1.7 MB over four
  trips), so the budget check doesn't catch it headless any more; a delayed `webglcontextlost` meant to mimic an iPhone
  didn't either. Parked on branch `claude/budget-late-loss-wip`, not merged. The fix itself stays on `main`.
  Open (2026-10-19, found with the Ranger board): the budget check never gets into a mall shop. Headless Chromium's
  ImageDecoder never finishes a keeper's GIF, so `goPlace()` hangs and every shop's row measures the hall (all six record
  332 draws). `&gifjs` gets in (the Outfitter: 252). Fix: `&gifjs` on the mall shops' `PLACES` URLs in
  `tools/budget-check.mjs`, then rerun those with `--update`. ▶ Run in: CLOUD.
  Round eight (2026-10-19, a check of the Safari shinies and the Plaza's buddies): the Outfitter drew at full rate under
  the full-screen Shiny Exchange (~840 draws/s headless, now 0 till it closes), and on a phone that slowdown could make the
  mall's keepUp() step its shadows or resolution down for good. The buddies cost ~1.7 MB and no measurable draws (a walking
  buddy is a starter's first form, ~1 MB of frames at most), and trips with four of them leak nothing. Left as is: a ★5
  card's foil repaints (one card, like a rare's shimmer).
  Round nine (2026-10-19, after the Clearing's trip leak): coming home from a town visit now lets go of the town
  (`forgetTowns()` in `goHome()`, as `walkIntoRun()` already did; its paintings stayed cached, ~90 MB the Clearing
  carried); the scenery's per-frame checks stopped walking the whole page and forcing a style pass (`filmOver()` /
  `unseen()` in `js/scene.js`, ~40 ms a second on the map); the Mart's hidden ware tiles stopped animating. Budget check
  within budget (clearing, town-shrine, mart, run-map, trips).

- **The Arcade Room's look** (2026-10-17, branch `claude/charming-edison-0yf3mg`, on `main` too; the user's "build it"
  after a mock-up, `docs/reference/hub-base-mall.md`'s "The Arcade Room"): all 22 arcade machines moved out of the Game
  Corner into a 15 x 10 room through a lit ARCADE doorway in its right wall (rows 6-7), Porygon at a FREE PLAY desk, the
  weekly leaderboard over it, the GAME CORNER sign back down over Meowth. Headless at an iPhone's size: the Game Corner
  83 MB of textures before, 55 after, the Arcade 54, only one loaded at a time. My picks, said to the user: Porygon; the
  leaderboard moves; the Game Corner's freed spots stay open; four cabinets on the left wall, not a middle row; no
  regulars in the Arcade yet (their lines all talk to Meowth). The user walks it (`?mall=arcade&coins=5000`) and says
  what to change.

- **The Grand Ballroom's look** (2026-10-16): the Furniture store's 3F, selling gold starter statues and six Pokédex
  shells (`docs/roadmap-done.md`). The user looks at the Ballroom (`?mall=3f&coins=20000`), a statue in the base and the
  shells, and says what to change. (Coins were rebalanced the same day: a won run pays 200, the Game Corner 250 a day.)

- **The Sky Pillar's new look in the Clearing** (2026-10-15, the user's ask: "a big change aesthetically"): the box is
  now Hoenn's tower in 3D (`js/hub-pillar.js`; docs/reference/hub-base-mall.md). Checked headless (no errors, frame rate
  unchanged); the user looks at it on their phone (`?hubat=28,-1`, `&time=night` for its glow) and says what to change.
  **The revamp's next parts, in the order I recommended (2026-10-15; the user said yes):** 1. the arena is **done and
  live** (the user approved it 2026-10-15, merged to `main`; archive). 2. **Done and live** (the climb's painted tower repainted in sage stone and jade, the user's yes 2026-10-15, merged to `main`; archive). 4. The lobby's window onto
  the tower, taken before 3 (the user's "just choose", 2026-10-15): **on `main`**, the user looks at it on their phone
  (Sky Pillar Pokéstop in the Clearing; also the shorter week line and the plaque's empty rows; archive). 3. The opening
  film (`js/climb-intro.js`): the first shot is the new crown, the door scene the new porch with Rayquaza's ring and jade
  light: **on `main`**, the user watches it on their phone (archive). That was the revamp's last part.
- **Intro films on the phone** (2026-10-14): the Safari Desert and Overgrown Shrine films were cut from 9-18 ms a frame to
  2-3 (archive); the user watches both on their iPhone and says if they still stutter.
- **The gym's arch and back** (2026-10-13, the user's asks; on `main` and the branch): `buildGym()` / `gymBack()` in
  `js/event-3d.js`: a dark stone wall with a colonnade in place of the woods, the leader's first boss as twin stone colossi
  on tall plinths flanking the arch (`stoneBoard()`, upright), the arch's lintel GYM LEADER over their name
  (`gymPlaqueArt()`; POKéMON GYM only on the hinge's LCD), the badge in a sunburst over it, fires on the lintel, light
  shafts on the dais, a ring of runes round the court's Poké Ball and embers rising, both lit with the great fires.
  **The win's talks** (same day): the losing line slides in on the battle screen as their Pokémon falls, then the gym, where
  they slide in again with the badge line and the badge, every win since the same day (the user's call: the grab is the
  ritual; a repeat's caption says BEATEN N TIMES, `again` in `gymTalk()`). You can't walk
  while a leader talks (`freezeEvent()`). Checked headless (`?gym=britt&hp=0.02`, every line in its place). **The send-out** (same day, the user's ask): on the
  battle screen the leader slides in over anime speed lines (`speedLines()` in `js/gym.js`: only on their "Go, X!" line
  in the room, `speed: 'last'`, and this entry, `'in'`; the user's two) to say "Gym Leader X sent out
  Y!", slides out, then throws their own Poké Ball in from the right onto the boss's pad (`leaderThrow()` in
  `js/battle.js`) and it bursts out (`.ball-out`), then your ball. After the fight their gym talks (badge, re-talks) don't slide
  in, only the speech window pops up (`bubble`). **The arch revamp** (same day, the user's ask): the banners by the pillars
  are gone, and `gymArch()` builds a round arch: fluted columns on stepped bases, the plaque's lintel, eleven wedge stones in
  two shades with an ink keystone, gold trim and gem, the badge (`gymCrest()`, now at 5.2, out in front of the arch and drawn over it, `depthTest` off; its sunburst stays behind in the lunette) in a lunette that glows with the
  great fires. **The badge grab** (same day, the user's ask): after the hand-over line `badgeGet()` in `js/gym.js` darkens
  the screen but for the badge laid over the arch's (`gymBadgeAt()` / `gymBadgeShown()` in `js/event-3d.js`, the crest's
  `at()` / `show()`), glowing, the only thing a tap takes; grabbed, it leaves the arch, tumbles out spinning (two WAAPI
  flights, the landing's flash on the frames drawn) and slams down mid-screen. Since the same day (the user's ask) a tap first
  spins it ten turns on the arch like a Pokéstop (`.spinning`, `aug-reroll` whirrs, `aug-gold` as it slows), then it pops
  out; it swells up on the arch first and the turn is the picture's own CSS `rotate` (`gymStopSpin`), since the first try
  rode on the badge's `transform` and the user saw no spin on their phone, only heard it. Its sounds are sine-only synths
  (`badge-ready` while it waits, `badge-spin` following the turn, in `js/audio.js`), the user's ask: the reroll shuffle and
  Eternamax's `charge` they had sounded gritty. The leader's board stands upright, stretched by 1 / cos(PITCH) to look
  the same (`buildGym()`), since leaning back like the others put a tall leader's head (Phil's) behind the plaque. **Evolving after the badge** (same day, the user's ask): `lastWords()` in `gymRoom()` plays `evolve()` right after the badge is taken, still in the gym, swaps the evolved sprite in where it stands (`swapMate()` in `js/event-3d.js`) and the doormat's rewards skip it (`result.evolved`); untested by hand past a load of `?gym=britt`. The evolution can't be tapped through any more (`skipper()` gone from `js/evolution.js`), and the move picks wear a pulsing SKIP under the » key (`.labelled` in `showChoice()`, `learn-room` only). All shipped as patch 1.17, The Gym Badge. After it, the map's hinge got a POKéDEX shortcut (`#map-dex-btn`, in `NEXT`). Open: the user's look.

  ▶ Run in: PLAYTEST on the branch link (`?gym=britt&hp=0.05`, `&time=night`).
- **Gym Leaders** (live on `main` since 2026-10-13, patch 1.16; the full history is in the archive). Open: see the
  first-win badge land in the Badge Case and the outro straight after a real boss win (a peek gives no badge); the user's
  word on the 13 badges' looks and names. (Every leader has their own intro / beaten / won speeches.)
  **Rematch rewards** (2026-10-13, the user's picks, no plush): a 3rd win hands over the leader's signed poster (a Secret
  Base wall piece, `js/base-furniture-gym.js`), a 5th their Gold badge, and from then on one such leader a UTC day stands
  in the base till tapped, talks and walks out. Their poster / gold / visit lines are one generic set in `leader()` in
  `js/data/gym.js`: ask the user if they want each friend's own. Playtest `?gymwins=5` (for good) then `?base&visit`.

  ▶ Run in: PLAYTEST on the live site.
- **The Poké Mall's Pokédex bar** (2026-10-13, the user's ask; branch `claude/new-player-onboarding-ecwtke` and `main`): the
  Clearing's bottom bar in the hall and every shop (`.mall-bar` in `js/mall-3d.js`, the hub's `.hub-bar` classes): Home
  (the device grows out of it over the mall, `fromKey()`; `body:has(.mall3d) .collection-screen.over` lifts it over the
  mall's z-index 900), How to play, the PokéCoins (`showCoins()`, the old Furniture-only coins LCD gone) and the place's
  name (`placeSign()`; the top title hidden). Checked headless at 390x844. **Next: the user playtests it on the live site.**
- **iPad playtest of the full-screen layout** (2026-10-12, branch `claude/arcade-cabinets-design-yh10el` and `main`): the
  frame is off, the run map is a handheld in its scenery. Ask the user: in a landscape battle the PP and End Turn keys sit
  at the far screen edges (pull them in beside the hand?), and a tall iPad shows black above and below the Secret Base's
  room (zoom its walk shot in to fill?). Since then (patch 1.14, same day) the deck, map-peek and every `.dev-window` and the deck
  pickers (PP Up, Forget, Day Care) are the map's 500px handheld too, and starters stand centred on their body (`BODY_X` in
  `js/data/sprite-fit.js`, `tools/body-centre.py`). Ask: does Charmeleon look centred now, and do any windows still
  stretch? ▶ Playtest on the live site.
- Music: `assets/audio/eternatus.mp3` and `eternamax.mp3` (they borrow `boss` until then).
- Playtests on the live site: a real Mewtwo run (Eternatus's numbers, the fall into the Depths), Ken's difficulty, the
  boss intros' and biome films' sound levels; the Sky Pillar's walk and climb pacing and its guardian intros on a phone.

## Rules for adding Pokémon (still in force)

- Rough numbers only: sensible HP and moves in line with the others in its biome; tune with the bot afterwards.
- Enemy moves whose real type isn't Fire/Grass/Water get `type: 'normal'` (CLAUDE.md, Types).
- Every "Normal" slot is a **pure Normal-type** Pokémon, so none has a hidden extra weakness. Fire/Grass/Water picks avoid
  second types that change their match-ups (no Rock/Ground Fire Pokémon). Elites and bosses are pure Normal.
- Each Pokémon appears in exactly one biome; none are starter lines or used elsewhere (Chansey, Kecleon...).
- A new Pokémon needs its Gen 5 animated front GIF (`assets/pokemon/<id>-front.gif`, PokeAPI black-white animated), its
  cry (`assets/audio/cries/` + `CRIES` in `js/audio.js`; PokeAPI's `cries/pokemon/latest/<dex>.ogg` as mono 64 kbps MP3
  at -13 LUFS, CLAUDE.md), a `js/data/sprite-fit.js` entry and its `ENEMY_DEFS` entry. A Safari Pokémon follows
  `docs/reference/safari.md` instead.
- Removing one: also update Team Rocket's `team` lists in `js/data/events.js`, and bump `RUN_SAVE_VERSION` in
  `js/run.js` (saved maps hold `enemyId`s).
- **Only official Gen 5 sprites** (PokeAPI black-white animated), never fan-made Gen 6+ ones such as Showdown's (the user's
  call, 2026-10-07; Eternatus / Eternamax are the one exception). Every Gen 1-5 species is now in the main game or the Safari,
  so a future biome takes the Safari's Gen 1-5 Pokémon, **shared** like the Sunken Ruins' and Thornwood's: a main-biome def
  with the slot's numbers under the species id (it wins over `safariMonDef()`, keeping the Safari line as `safariLine`), the
  `SAFARI_MONS` line kept for its area and signature card, plus a cry. It can't also be in a default-road biome.
- **Fire is scarce**: every Gen 1-5 Fire Pokémon is already in the game. The Sunscorch Savanna took Ponyta, Magby, Ninetales,
  Arcanine, Houndoom and Simisear; still free in the Safari only: Larvesta, Magmortar, Darmanitan, Chandelure (rare spawns),
  Lampent, and Numel / Camerupt / Magcargo (Ground / Rock, so not for a Fire slot).
