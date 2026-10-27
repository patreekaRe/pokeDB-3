## ? events

`event` map rooms (❓, purple frame) hold one of the scenes in
`js/data/events.js` (numbers, often per biome as `[b1, b2, b3]`); what each
choice does is in `EVENT_CHOICES` in `js/run.js`, shown with `showChoice`.
`rollEvents()` (from `startBiome()`) stores `node.event` = `{ id }` plus any
dice (Item Ball's `trap`, Team Rocket's `enemyId`, Day Care's shuffled
`offers` per rarity, Wishing Well's `luck` + `relics`, Shrine's `relics`),
drawn from a shuffled bag so a biome has no repeats until all have come up;
a refresh can't reroll them. Card/relic ids on an event are checked by
`eventIdsKnown()` on restore. Lists (not single ids) are stored so a card
or relic gained since the biome started is skipped for the next one:
Day Care trades a common/uncommon (never an evolution card) for the first
card of the next rarity you hold under `MAX_COPIES` (two taps, "Trade it", then `revealCard()` shows the card you got big
in the treasure rays, the user's call 2026-09-28: the text box alone was too blank; reuse it for any card an event gives); Shrine gives the first
unowned relic of your type's `only` relics, then normal ones. The Wishing
Well's one `luck` roll serves both tosses (the big toss wins whenever the
small one would); a win offers its unowned `relics` via `showRelics()`. When the small toss can't be
made (too little ₽, or nothing left to win), its spot becomes "Fish ₽N" (`fish`, free ₽), so the
room is never wasted (the user hit one with no money).
Fan Club never costs anything (₽ above half HP, else a Super Potion, or ₽ with a
full Bag). Relics from events go through `gainRelic()` so Cleanse Tag works.
At first the four new events cost Level 5 ~3 points (66%): Shrine HP is barely
healed back when Centers heal 10%, and they replace the healing events some of
the time. Cheaper Shrine (6/9/12 HP) and Well (₽30-50 / ₽70-110) and a Super
Potion from the Fan Club fixed it. Bot now: L0 94.8, L3 86.4, L5 68.1 (Water
trails at L5, ~56%, with or without the new events). Paid choices use `moneyOption`/`hpOption` (greyed out when
unaffordable, and HP costs never faint you), and money/HP is only taken once
the reward is actually received, so "Back" is free. Team Rocket's Battle
runs `fight()` with a copy of the node typed `elite`, so it pays elite
rewards; it has no Leave. Its Run goes straight to the map once the run-away plays (`doorOut(showMap)`, the user's call,
2026-10-14), no walking back out. A new event needs an entry in both places, an
icon in `ICONS` for any new emoji, and a `RUN_SAVE_VERSION` bump only if the
node shape changes.

Every event has a scene of its own (no event shows plain tiles any more). `EVENT_SCENES` in `js/run.js` maps an event to
its `PLACE_ART` entry; `outdoor: true` makes `showPlaceScene()` paint that biome's own wild scene (sky,
backdrop, ground, life) with the event's props in the middle (`prop`, `eventProps()` in `js/scene.js`), and
its `biomes` only retint the props. Like the Center, there are no tiles: layout `event-room <scene>-room`
lays each choice as a see-through button over a prop (`life.eventSpots`, `eventSpots()`, placed by
`placeEventSpots()`) under a bouncing `.center-label` (`spotOption()`) holding just the choice's name (2026-10-07, the user's call: the old
second-line captions were too much text); the first tap rings it in gold and says its hint in the text box (`peek` on a
`showChoice()` option), the second takes it; a greyed one (`.locked`, not `:disabled`, so it still answers) only says why
(`spreadSigns()` keeps the signs on screen, off each other and off the screen's title), with the text box under the props
(`--counter-foot`). A pick plays out on the scene first (`playOut()` → `sceneAct()`: frames in `ACTS`, drawn
by the prop's draw function off `actFrame()`; skipped under reduced motion), then takes effect. Berry Tree:
eat (berries fall and vanish) or plant (one flies into the empty plot, a sprout comes up). Either way, since 2026-10-16 (the user's ask:
berries from more than the backyard), 1-2 garden berries go in the Satchel (`pocketBerries()` in `js/run.js`, `TREE_BERRIES`
weighted to Oran, once a room through `glean()`; not in a Safari, the Sky Pillar, a peek or a visit). The first ever, Professor Oak
slides in (`treeTalk()`, `gymTalk()`, once a save as `told.tree` in `js/held-tips.js`), his lines following whether you
have a backyard and whether Kurt's Workshop is open. Hot Spring: soak
in the big pool (a cloud of steam) or dip in the small one (ripples); a rubber duck bobs. Wishing Well: its
two halves are the two tosses (signs leaning apart); a coin (a Nugget for the big toss) arcs in, splashes,
and a win sends light and sparkles up. Item Ball (60% an item, rising straight out via `offerItem(item, next, { opened:
true })`; 25% a Voltorb, `trapChance`; 15% a relic, `relicChance`: the user's call 2026-09-27, rolled into `node.event.trap` /
`.relic`, so older saves get an item where they had a relic): a Poké Ball in a patch of the games' tall grass (outlined
tufts, drawn live so they rustle); picking it up wobbles it, then it pops open, or opens its eyes as a Voltorb,
flashes and explodes over a scorch. Team Rocket: a black-and-red roadblock with an R board and a bush, with the grunt
and their Alpha standing at it as real GIFs (the choice returns `figures`, `{ stand: { src, alpha } }`; each
`.event-figure` stands on the scene's `life.stands` at half the scene's pixel size, like Chansey, fitted by
`SPRITE_FIT`). The Alpha comes from `team`, keyed by biome id (since the crossroads, 2026-10-06: the Sunken Ruins has its own
pair), so a new biome needs a line there; every other per-biome number is by slot. The grunt is male or female (`grunts` in `js/data/events.js`, rolled into `node.event.grunt`;
saves from before fall back to the first), animated HGSS-style sprites by justin8964 in `assets/trainers/`,
credited in About. Paying throws coins into the grunt's hand and `figureDoes('trainer', 'hop')` hops the sprite as they
land; Battle goes straight to the fight; Run shakes the bush (and `shake`s the grunt). Shrine (`PLACE_ART.altar`, not `shrine`: that's a biome) is a
close-up with a scene of its own, not a prop in the biome's (the user found it "very small"): like the grotto, no `outdoor`,
a look per biome from `biomes` (`wall`: a Clearing wall of leaves `foliage()`, the Shrine's misty cedars with a roped
sacred tree `cedars()`, the Wastes' cut rock `facetRock()`, shared with the grotto; a fence along it, `shrineFence()`, and
a flagstone path, `shrineApproach()`). The Ilex Forest-style shrine (`shrine()`: steps, lattice doorway, straw rope, bell and
cord, flared roof with chigi) is sized by `shrineLayout()` to fill the screen, its foot ~200 CSS px above the bottom for the
text box and Leave; big stone lanterns (`stoneLantern()`) frame it, a second pair on wide screens. It glows in your type's
colour (`types`, picked by `showPlaceScene()`'s `type`, which works for any place with `biomes`), lanterns too; praying draws red HP motes into it, it flares, and a spark rises out; then the relic floats over the scene with
its name (`revealGift()`, the item screen's `floatingThing()`) until you tap it or Take it and it flies into the Bag. An act's
`cues` play sounds on its frames (`actCues()`; all at once under reduced motion): the Voltorb's `hit`, the
ball's `ball-open`. `life.keep` keeps grass blades and lava cracks off the props. Sounds:
`heal-hp` for the heals, `stat-up` for planting, `buy` for a toss or the toll.
Close-ups (own scenes, no `outdoor`, props sized to the screen with ~190 CSS px left under them for the text box and
Leave), besides the Shrine: the **Hot Spring** (`PLACE_ART.spring`, `springLayout()`: a big rock pool at your feet (soak)
and a little one fed by a bamboo spout (dip), a bamboo fence with the ♨ board, stone lanterns; per biome a sunny garden,
misty cedars, or a milky pool under volcanic rock with steam vents), and four rooms laid out by `roomLayout()` (its
`ceil` is the wall's top under the title and HP window, so wall props hang below it; `roomWall()`, `plankFloor()`,
`roomWindow()` onto the biome outside): the **Move Tutor**'s dojo (shoji walls between timber posts, a tatami floor (`tatamiFloor()`), Alder sitting cross-legged
on a red cushion under his arena's Dragonite medallion, big (the 32-cell Dragonite) in a dark wood alcove (`tokonoma()`) under a
shimenawa rope; the chalkboard is gone (the user's call, 2026-10-01): a hanging scroll beside the alcove, ink brushing itself
down it during a lesson: pay ₽, act `lesson`; on wider screens a weapon rack where the window was; a sandbag: pay HP, act `train`), the **Move Deleter**'s study (bookcases, a lectern's open book: forget one,
act `erase`; a hypnotist's pendulum: forget two, act `hypno`; a dozing Slowpoke figure), the **Day Care** (the house's
clapboard front with a DAY CARE board in the 3x5 `pixelText()` font, a picket fence, an Egg in a straw nest, act
`trade`; Miltank and Marill figures) and the **Fan Club** (striped paper, portraits, pennants, a red carpet to a stage
under a spotlight, act `cheer`: confetti and hearts, the fans hop; Persian and Cinccino figures; a Super Potion gift
floats up with `revealGift()`). A figure's `flip` turns it round (front sprites face left). **Event NPCs** (step from 2026-09-28): a trainer stands in
each of those four rooms (`figures.npc = { npc: id }`, `NPCS` in `js/data/events.js`): the Move Tutor (Chad Master Kenmatta, named in the room's text and his picker's title; Alder's sprite, `alder`, sitting on the
mat, not cut off; the desk, coin tray and scroll are gone, the user's call 2026-09-28), the Move Deleter (behind the dozing Slowpoke), the Day-Care Lady (behind Marill) and
the Fan Club's Chairman (on the stage). They're still sprites from Pokéngine (kyledove's, and Jext's Alder; credited in About),
`assets/trainers/<id>.png` plus a hand-painted eyes-closed `<id>-blink.png`, at the grunts' scale. `eventFigure()` in
`js/run.js` cuts each into legs, upper body and head layers (clip-paths from `NPCS`' `head` box and `waist` row) so they move
a whole sprite pixel at a time: the upper body breathes (a 2.8 s loop, random phase), the head bobs while the text box
types (`sayLines()` puts `.typing` on it), and the eyes-closed head blinks in for 120 ms every 2-6 s (`blinkNow()`).
Reactions go through `figureDoes(stand, move)`: `npc-nod`, `npc-no` (head shake), `npc-jump`, `npc-turn` (faces the other
way until the room closes). **Challenge Kenmatta** (2026-10-01, the user's call): the dojo has a third sign, on Ken himself (the lesson's ₽ sign is on
the hanging scroll, the HP one on the sandbag: `tutorScene()`'s `eventSpots` in that order). It runs
`fight({ ...node, type: 'ken' })`: `KEN` in `js/data/enemies.js` (not in `ENEMY_DEFS`, so never in the Pokédex; Alder's
sprite, HP per biome `[130, 220, 370]`, the biome's `bossBonus`, built by `buildKenEncounter()`) fought as a boss (shatter
wipe, his own music (`music: 'kombat'`), FORTIFY YOUR MIND with Wong's shout (`sound: 'fortify'`, the user's trimmed clip), Neutral, no running) with his own `prelude` / `intro` lines, but it doesn't end the biome.
His arena is his own (`arena: 'kombat'` on `KEN`; `startBattle()` calls `showPlaceScene(def.arena)` instead of the
biome's scene; the user's call, 2026-10-01): a Mortal Kombat courtyard, `PLACE_ART.kombat` in `js/scene.js`, always night.
Laid out like an MK stage, a tall temple backdrop over a strip of floor: the floor line sits just above your pad
(`kombatFloorRow()`), Ken meditates on red-carpeted temple steps raised to his pad (`templeSteps()`), and a gold medallion
holds a roaring Dragonite in relief for the MK dragon (`DRAGONITE`, a 32x32 pixel map scaled into the ring; its eye glows
red, blazing in the storm). `kombatLayout()` places it from the real battle layout: between the two Pokémon, below the
enemy's nameplate where that's over the wall (phones), and clear of the steps. Braziers on red pillars flank it, banners
and pillars repeat in bays across the wall, and the boss storm brings cinders, red light and lightning.
Entering the dojo, Ken brags (`hello` in `EVENT_CHOICES['move-tutor']`); tapping Challenge! makes him jump and talk trash in the text box like a trainer, ending on "TEST YOUR MIGHT!", and tapping past that starts the fight. A `mightPlaque()` in `tutorScene()` hangs TEST YOUR MIGHT in gold on a red plaque (between the alcove and the sandbag, else left of the scroll, else one line across the alcove's top on phones). The relic is named Mata-Mindset (id still `exp-share`). Mid-fight he talks like a Gen 5 gym leader: `KEN.taunts` (`half` / `low` once his HP drops below 1/2 and 1/5, `win` after you faint; `checkTaunts()` in `js/battle.js`), and a move's `say` is yelled in the battle text before it (TEST YOUR MIGHT). He also powers up like a legendary (`aura: true`): `js/aura.js` ports `tools/legendary-aura.py` to a live canvas over his still sprite (`.aura-fx`, in Super Saiyan gold), only level 2 (the user dropped level 1), with a `power` sound once he drops below half HP (`checkTaunts()`). A win pays a boss's coins and ₽ ("You defeated Chad Master Kenmatta!", `pendingCoins.beaten`), then his **Mata-Mindset**
(no Skip, in the gold boss shaft) and a boss card reward. Once you hold it, the sign is greyed out ("You already won his
Mata-Mindset."). **Ken on the map** (Small asks 1, 2026-10-02; 3 wins since the same day, the user's call): `save.kenWins`
counts his defeats (one a run, since the relic greys his sign out). His first is an achievement, `KEN_RELIC` in `js/run.js`
("You beat Chad Master Kenmatta and won his Mata-Mindset!", hint "Beat him 3 times to find his dojo on every map."), his
`KEN_WINS`th (3rd) another, `KEN_MAP` ("Find the Ken icon on the map to find Ken!"), each shown by `unlockWindow()` (his face
from Alder's sprite, the `achievement` jingle then `fortify`) as the first reward step. Until then the Challenge sign says
"Beaten n/3." and the relic window adds "Beat him N more times to find his dojo on every map." Both windows save as they
open, and the relic step saves the count too, always as a max so a replayed step can't count twice (never in a `?event=`
peek, which shows the first window every time); `KEN_MAP` sets `save.kenBeaten` (a save that had it before the 3-win rule
keeps it). From then on `renderMap(..., { ken })` gives the Move Tutor's ❓ room his
face (`.ken-face`, a CSS crop of `alder.png`) and the Bag's Map key a "Ken's dojo" row (`#key-ken`, shown by `drawMap()`;
not on the How to play slide, it's the achievement's secret). The Tutor nods through a lesson and turns to the sandbag to train; the Deleter shakes his head
when you back out of his picker; the Day-Care Lady turns on a trade; the Chairman jumps handing over his gift. A done
picker comes back to the room (`eventRoom(node, after)`, from the choice's `react(move)`): no choices, the NPC does `after`
(the Tutor nods, the Deleter and the Day-Care Lady jump) while the text box says what happened, and closing the box or
Leave goes on to the map. All of it stops under reduced motion. The outdoor ones (Berry Tree, Wishing Well, Item Ball, Team
Rocket) are close-ups too: their art's `zoom` (1.75) makes `resize()` paint the scene with bigger pixels, as far as
their props (`span` pixels across) still fit the screen, so a narrow phone zooms less than a PC. Your HP in an event room is the top bar's
little plate beside the Poké Ball (`#choice-plate`, as on every choice screen; the user's call 2026-09-28: there used to be
a row under the title), and `showHpChange()` runs its bar to the new HP before the room closes. Choices that open a picker (Tutor, Deleter, Day Care) play their act first; the
price is still only paid once something is picked.


**The Move Tutor's room is Kenmatta's hall** (2026-10-15, the user's ask: extravagant, big, a ring in the middle to walk
into): `buildDojoHall()` in `js/event-3d.js`, 17 x 15 (`SIZES.tutor`), shared with the Clearing's dojo. Ken sits in the
ring (Challenge walks you up its steps to him), the scroll on the back wall left of the dais, the sandbag right; the
room keys `rise`, `walls` and `decks` let you walk on the ring. Its Clearing visit (`home: true`) hangs the trial board
where the scroll is; his students (Hitmonlee, Hitmonchan, Machop) say their `cast` lines in `CLEARING.homes.dojo`.

**The walk-in 3D rooms** (2026-10-11, the user's ask after the 3D Center and Mart): the four indoor rooms, the Move
Tutor's dojo, the Move Deleter's study, the Day Care and the Fan Club (`EVENT_3D` in `js/run.js`), are walked in 3D,
`js/event-3d.js`, one engine (the Center's walking, camera and floating signs) and a `build*()` per room in `BUILD`. Like
the Center it is only the scene: `eventRoom()` still shows the room's choices, text box and bar, then `event3d()` mounts
the 3D room under them (`mountEvent()`), the pixel scene hidden behind it (`c3d`, `.event-figure` hidden too). A tap on a
sign or its prop (`userData.spot`, the option's index) walks your Pokémon to that choice's `spots[i].step`, then clicks
the choice, so the two taps (hint, then take) are the same as the pixel room's. `playOut()` plays a choice on the props
through the room's `act(name)` (`acts` per room: `lesson` brushes ink down the hanging scroll, `train` swings the
sandbag, `erase` lifts sparkles off the lectern's book, `hypno` swirls the pendulum, `trade` wobbles the Egg, `cheer` rains
confetti and hearts; their `cues` are timed sounds), and `figureDoes()` forwards to the room (`does()`: jump, nod, no,
turn, the fans' hop). The trainers are their `assets/trainers/` sprites on billboards, blinking with the `-blink` copy.
Coming back from a picker remounts the room with your Pokémon where it stood and `after` the trainer's reaction. Rooms
are built once a page load (`room()`, one at a time), ahead while the map is up (`warmEvent3d()` → `preloadEvent()`).
The decor is the Secret Base's furniture (`piece()`), the rest modelled or painted in the file (Dragonite's medallion
is `DRAGONITE` from `js/scene.js`). `?event=move-tutor` (any of the four) walks in; `&event2d` keeps the pixel room. A
`?event=` peek of an event the map didn't roll now rolls its dice too (`rollEvent()`), so Day Care's peek no longer crashes.

**Open air and the grotto** (part b/c, 2026-10-11): the Hot Spring (`buildSpring()`) and the Shrine (`buildAltar()`) are
open-air rooms: `yard()` lays the shell with no walls' tops, the biome's scenery painted on them behind a fence
(`scenery()`: round trees in the garden, cedars and the roped sacred cedar in the mist, a cliff of cut rock with glowing
seams) and a self-lit sky behind (`skyDome()`; painted on the walls it went grey under the light), the light by the hour
(`SKY_LIGHT`, `timeOfDay()`; the rock looks keep a dusk by day) and a softer bloom (a room's `env`: its sky light, sun and
bloom, set as it mounts; the indoor rooms keep `INDOORS`). The look is `LOOKS[biome]` (`GARDEN`, `CEDAR`, `ROCK`; the Ruins,
Thornwood, Savanna and Depths one of those in their own colours; a Safari area the garden). Trees are modelled (`tree()`),
not furniture. The Hot Spring: two rock-ringed pools (`pool()`: a basin, sliding ripples, a ring of `boulder()`s), steam
(`steam()`, thicker during a soak), the rubber duck, the bamboo spout pouring (`spout()`), the ♨ board; act `soak` hops your
Pokémon into the big pool and sinks it to its shoulders (an act can move it: `walker.ox` / `oy` / `oz`, put back by
`still()`), `dip` leans it over the little one, rings spreading. The Shrine: `shrineModel()`, the pixel one in 3D (stone
tiers and steps, the hall's lattice doors lit from inside in your type's colour, `TYPE_GLOW`, a tiled roof swept up at the
eaves with chigi and katsuogi, the straw rope and paper zigzags, the bell and its cord, the offering box), big stone
lanterns lit the same colour; act `pray` rings the bell, draws red HP motes into the doors, flares (the bloom with it) and
sends a spark up. The grotto (`buildGrotto()`, `treasureRoom()` mounts it with `event3d(…, 'grotto', …, { onPick })`, since
its chest is no `.reward-option`: `ROOM_OF()` / `SIGNS_OF()` say what is the room and its signs) is a cave per biome
(`CAVE`, the pixel grotto's colours: `caveWall()`, `caveFloor()`, `crystals()`, moss, glowing veins, roots or a tide pool,
wisps or embers), a stone dais in a soft shaft of light (`shaftOfLight()` and a spotlight), coins spilled round it, and the
Poké Ball chest (`ballChest()`: a white box, the ball's band and button, a domed lid painted as that biome's ball by
`lidArt()`). The page's chest button stays for its logic and sign (its pictures hidden, `.c3d`); the 3D chest watches its
classes and wobbles while `.shaking`, then the lid swings up and the light pours out on `.opened`; `chest3dSpot()` in
`js/run.js` floats the relics up from it. Rooms with a look are built per biome and hour (`PER_BIOME`). `?event=hot-spring`
(`&biome=wastes`, `&time=night`), `?event=treasure`.

**The outdoor four** (part d, 2026-10-11, the user's pick: a 3D ground per biome over a 3D prop on the painted scene): the
Berry Tree, Wishing Well, Item Ball and Team Rocket stand on a patch of the biome itself, `wild()`: the same scenery and
sky as the open-air rooms with no fence (`paintFence(…, 'none')`: a hedge of bushes, or tumbled rocks), wild ground
(`wildFloor()`: grass and wildflowers, moss and fallen leaves, or ash with glowing cracks, a worn path up from the door;
a look's `grass` / `dirt`), the look's trees about and grass tufts or pebbles (`tufts()`). `buildBerry()`: an Oran Berry
tree over a soil plot (eat: three berries drop and are eaten) and an empty plot with a sign (plant: a berry arcs into it
and a sprout comes up). `buildWell()`: the stone well under a tiled roof, crank, rope and bucket, coins in the water; a tap
on its left half is the first toss (or Fish), its right the big one (`userData.spotAt`, read by `onTap()`); act `toss`
(`{ big, win }`: a coin or a Nugget arcs in, splashes, a win lights the water and sends a column of light and sparkles up).
`buildItemball()`: the Poké Ball at the front of a patch of tall grass that rustles as you wade in; act `pickup`
(`{ trap }`: it wobbles and pops open, or opens a Voltorb's eyes, flashes and blows up over a scorch, knocking your Pokémon
back). `buildRocket()`: a striped roadblock with the R board, the grunt (their GIF, lifted onto its feet by
`standOnFeet()`) and their Alpha (1.35x) standing at it, a bush to run through; no doormat (`exit: false`, `noExit`: there
is no Leave), acts `pay` (coins into the grunt's hand) and `run` (into the bush, which shakes), the grunt's hop and shake
from `figureDoes()`. An act's `ms` and `cues` can be functions of its `opts` (`playOut(act, opts)`), and a room's `reset()`
puts it back whole on a new visit (berries, the sprout, the ball). Team Rocket's room is built per grunt and Alpha, so it
is not built ahead.

## Batch 1 of the StS events (2026-10-17, the user's picks; docs/roadmap.md's "More ? events")

Five events, each on a StS one (named in its `EVENTS` comment), their rules pure in `js/data/events.js` (`snorlaxWakesAt()`,
`trashDig()`, `dittoMorph()`, `eventsFor()`; `tests/events.test.mjs`), their rooms in `EVENT_CHOICES` in `js/run.js`,
mirrored in pokeDB-sim's `sim/engine.js`. An event's `not` keeps it out of a mode: `rollEvents()` draws from
`eventsFor('run' | 'safari' | 'tower')`.
- **Sleeping Snorlax** (Dead Adventurer): the pile's `loot` (₽, an item, a relic) in a rolled order, one a search; each
  search's roll (`node.event.rolls`, rolled as the biome starts) against `wake` (25 / 50 / 75%). Waking is an Alpha
  fight, `fight({ ...node, type: 'elite', enemyId: 'snorlax', foeHp })`: `foeHp` (0.4) scales its HP, read in `fight()`
  (the boss Snorlax as an Alpha would be ~270 HP in the Clearing); elite rewards, the rest of the pile lost.
- **Trash Heap** (Scrap Ooze): a dig costs `digHp` +1 a dig before, and finds the relic at `odds` +`step` a dig before
  (25%, +10%); twelve rolls are rolled ahead. Trubbish stands on the heap.
- **Ditto** (Duplicator + Transmogrifier): Copy pushes one more of a move (under `MAX_COPIES`); Transform swaps a move
  for the first of its rarity's shuffled `offers` that isn't it (like the Day Care's, checked by `eventIdsKnown()`).
  Neither takes an evolution card or an unplayable one.
- **Bill's PC** (Note for Yourself): one Box a type, `save.pcBox[type]` (an empty one holds `box`, Quick Attack). Use the
  PC takes it out (`revealCard()`), then `pcStore()` asks for one of yours, with no Back (you took one); `state.took`
  brings a refresh back to that picker. A peek saves nothing. Not in a Safari day or a climb (`not`): the Box is yours.
- **Abra** (Secret Portal): Teleport goes straight to `run.map.boss` (`enterNode()`, so a Gym Leader's gym still walks
  in), greyed when the boss is the next room anyway. Not in a climb, whose floors are its score. Or **Doze** on the moss
  beside it, `doze` (20%) of max HP healed: added after the bot check (human bot, Level 3, 300 runs; before -> with the
  five -> with Doze): Fire 64.3 -> 54.7 -> 60.7%, Grass 59.7 -> 57.7%, Water 56.0 -> 56.7% (150 runs). Fire's drop wasn't
  Abra's Teleport or Ditto (neither one off brought it back) but fewer healing rooms: 15 events in the bag, not 10.
Their scenes: outdoor ones in `PLACE_ART` (`snorlax`, `trash`, `ditto`, `abra`: the Pokémon are the page's sprites on
`life.stands`) and 3D on the biome's ground (`buildSnorlax()`, `buildTrash()`, `buildDitto()`, `buildAbra()`, per biome);
Bill's PC the Move Deleter's study in other colours (`billspc`, `buildBillsPc()` round the Storage PC furniture piece).
Acts: `search`, `dig`, `copy`, `morph`, `teleport`, `boot`.

## Batch 2 of the StS events (2026-10-17, docs/roadmap.md's "More ? events")

Five more, the same way as batch 1 (rules pure in `js/data/events.js`: `wheelSlice()`, `idolBoulder()`, `keystoneAsk()`,
`swapWares()`, `swapGift()`; `tests/events.test.mjs`; mirrored in pokeDB-sim). Two of them heal (the user's ask: with 20
events in the bag the healing rooms come up less often).
- **Prize Wheel** (Wheel of Change): Meowth's wheel, one free spin, its slice rolled as the biome starts
  (`node.event.spin`): ₽ (`wheelMoney`), a relic, a full heal, a free Forget, an item, or the pinch (`ouch`, 10% max HP).
  A slice that can't pay (Forget at `MIN_DECK`, an item under Dusk Stone) pays ₽ (`wheelPrize()` in `js/run.js`). The act
  `spin` (`{ slice }`) turns the wheel three times and eases it to a stop with that slice under the pin, in 2D and 3D.
- **Ruins Idol** (Golden Idol): Take the idol, the **Relic Statue** (`relic-statue`, `unique` + `event: 'ruins-idol'`: never
  offered, listed in the Index under its own heading, Found; +25% prize money, `prizeMult()` in `js/data/relics.js`, art
  PokéSprite's), or a Relic Gold worth `gold` ₽ if you hold it. Then (`state.took`, no Leave) the Golem shoves its boulder
  down: Brace (`boulder`, 25% max HP) or Hide behind a column (`hide`, 8% max HP for good). Acts `grab`, `brace`, `hide`.
- **Odd Keystone** (Knowing Skull): Spiritomb on a cairn; ask for ₽ (`askMoney`), a neutral move (the first of the rolled
  `node.event.moves` you hold under `MAX_COPIES`, checked by `eventIdsKnown()`) or an item, as often as your HP allows,
  each ask `askHp` + 1 for every ask before. Act `ask` (`{ what }`): wisps stream out to the coins, the cairn or the ball.
- **Moon Dance** (Shining Light): Clefairy round a Moon Stone (the 3D room is always at night). Dance (`danceHp`) PP Ups
  2 random moves (`ppUpRandom()`, shared with Rare Candy; `revealCard()` takes a list and shows both), or Moonlight heals
  `moonlight` (25%) of max HP. Acts `dance`, `moonlight`.
- **Swap Stall** (N'loth): Kecleon wants one of two of your common / uncommon relics (`node.event.rolls`), each shown on
  its cushion (`figures.left` / `right` are the relics' PNGs; the 3D room loads them in `reset()` from `opts.figures`) and
  trades it for the first of the rolled `node.event.relics` a tier rarer that you lack, named in the hint. Act `swap`
  (`{ i, gets }`): the relic spins into the new one while Kecleon changes colour.
Scenes: `PLACE_ART.wheel`, `idol`, `keystone`, `moon`, `stall` (outdoor), 3D `buildWheel()`, `buildIdol()`,
`buildKeystone()`, `buildMoon()`, `buildStall()` on the biome's ground. Event icons 🎡 🗿 🌙 🦎 in `js/icons.js` (Spiritomb
reuses 👻).

## Batch 3 of the StS events, first five (2026-10-17, docs/roadmap.md's "More ? events")

Five more, the same way (rules pure in `js/data/events.js`: `libraryShelf()`, `goopLoss()`, `contestWinner()`;
`tests/events.test.mjs`; mirrored in pokeDB-sim). Three of them can heal or add max HP (the Library's nap, the Fishing
Spot's Old and Good Rods).
- **Canalave Library** (The Library): Read picks one of `books` (20) moves from your type's pool (`node.event.books`,
  rolled as the biome starts; never an evolution or unplayable card, nor one you hold `MAX_COPIES` of), in a deck-pick
  grid (`libraryRead()`); or Nap in the reading chair, `nap` (33%) of max HP. Indoors: the study's shell and floor, a wall
  of bookcases, the lectern (read), an armchair (nap), Noctowl on a perch. Acts `read`, `nap`.
- **Fishing Spot** (Big Fish): one cast, three rods on a boardwalk's rail: the Old Rod heals `oldRod` (33%), the Good
  Rod adds `goodRod` max HP, the Super Rod costs `superRod` HP for a relic (`offerRelic()`; a Gyarados thrashes up in
  3D). Act `cast` (`{ rod }`). The 3D signs float at three heights so they never overlap on a phone.
- **Sludge Pit** (World of Goop): no Leave (`leave: false`, 3D `exit: false` until a choice is made). Dig costs
  `goopHp` for `goopMoney` ₽; Climb out loses `goopLoss()` ₽ (`lose` per biome, rolled into `node.event.lose`, never more
  than you have) and goes straight to the map, no walk back out (the user's call, 2026-10-17). Act `goop` (`{ dig }`).
- **Silph Co. Storeroom** (The Lab): Search gives the `items` (3) rolled into `node.event.haul` (checked by
  `eventIdsKnown()`), one `offerItem()` after another, `node.event.got` counting them (a refresh resumes with "Keep
  searching"); under a Dusk Stone it pays `duskMoney` ₽ an item instead. Indoors: a steel-and-tile room (`labWall()`,
  `labFloor()`, the pixel scene's `lab` backdrop), racks of boxes, a stack of crates, Porygon. Act `rummage`.
- **Bug-Catching Contest** (The Joust): bet `bet` ₽ on Scyther (wins `favourite`, 70%, pays 2x) or Caterpie (pays 5x);
  the winner is rolled as the biome starts (`node.event.roll`). The bet goes through `spend()`. Act `joust` (`{ win }`).
Scenes: `PLACE_ART.library`, `storeroom` (rooms), `fishing`, `sludge`, `contest` (outdoor); 3D `buildLibrary()`,
`buildStoreroom()`, `buildFishing()`, `buildSludge()`, `buildContest()` (the last three per biome). Icons 🎣 🦠 📦 🐛 in
`js/icons.js` (📚 was there).

## Batch 3 of the StS events, last five (2026-10-17, docs/roadmap.md's "More ? events")

The bag now holds 30. Rules pure in `js/data/events.js`: `BASICS` (each type's starting attack and block: Fire Ember and
Flame Wall, Grass Vine Whip and Block, Water Water Gun and Withdraw, Psychic Psywave and Psychic Guard), `tabletUps()`,
`bonfireGift()`, `flipState()`, `rivalWants()`; `tests/events.test.mjs`; mirrored in pokeDB-sim. The Litwick Bonfire heals.
- **Unown Tablet** (Ancient Writing): Study PP Ups every copy of your two `BASICS` not yet PP Upped (both shown by
  `revealCard()`); Erase forgets a move for free. Free either way. Acts `study` (the glyphs light up), `efface` (chips fly
  off the flat stone; `erase` was the Deleter's).
- **Smeargle's Studio** (Designer In-Spire): indoors, three easels. Touch-up (`touchUp` ₽) is the PP Up picker; Repaint
  (`repaint` ₽) Transforms a move into a random one of its rarity (`morph`, the Ditto's `offers`, `studioRepaint()`);
  Portrait (`portrait` ₽) forgets a move and PP Ups a random one (`ppUpRandom(1)`). ₽ is paid only once a move is picked.
  Act `paint` (`{ i }`: strokes go onto that easel's canvas). The middle sign floats higher so none overlap on a phone.
- **Litwick Bonfire** (Bonfire Spirits): one sign, the fire. Offer a move (`bonfirePick()`, each card marked with what it
  gives): a basic heals `warmth.basic` (10%), a common 25%, an uncommon fully, a rare fully and `rareMaxHp` max HP. The
  3D room is always at night, with a real point light. Act `offer` (the fire roars up, purple at the tips, wisps rise).
- **Voltorb Flip** (Match and Keep): `node.event.board` holds a move of each rarity in `pairs` twice (your type's pool,
  under `MAX_COPIES` when rolled) and two Voltorb, shuffled as the biome starts; `node.event.flips` the tiles flipped,
  two a try, `tries` (4). Play opens `flipGame()`: a board of 8 tiles (`.flip-board`, layout `flip-game`, since the room
  is `flip-room`) that turn over; a matched move joins the deck there and then (`learnedId()`), a matched Voltorb pair
  blows up for `zap` HP; every try is saved, so a refresh picks the game up ("Keep playing"). Act `deal`.
- **Rival's Return** (We Meet Again): your rival, a silhouette in a cap (the Gym's unknown leader copied to
  `assets/trainers/rival.png`, its blink the same picture; `NPCS.rival`), and his Sneasel. He asks ₽ (`ask`), the item
  of your Bag and the move of your deck picked by `node.event.pick` (never a basic, an evolution or unplayable card), each
  for a relic (`offerRelic()`). Act `barter` (`{ what }`: the coins, the Bag or the TM disc arcs to him; `trade` was the
  Day Care's).
Scenes: `PLACE_ART.tablet`, `studio` (a room, the `lab` wall), `bonfire`, `flip`, `rival`; 3D `buildTablet()`,
`buildStudio()`, `buildBonfire()`, `buildFlip()`, `buildRival()` (all but the studio per biome). Icons 🔠 🎨 🕯️ 🆚 in
`js/icons.js` (Voltorb Flip shares 🃏). A 2D act name is shared by every pixel room (`ACTS` in `js/scene.js`): check it's
free before naming a new one.

**The Bag in the ? rooms** (2026-10-17, the user's ask: to see your deck before choosing): the room bar's Bag
(`#room-bag`, which the Mart and a fight's reward steps already had) shows in every `event-room` of a run and opens on the
Deck pocket; never on a visit (`body.town-visit`: the dojo, a town, a home), nor at the Center. A tap in the open Bag
doesn't walk your Pokémon (`#bag` in `canWalk()`). Voltorb Flip's board (`flip-game`) is one of the `roomy` layouts in
`showChoice()`, or it would have no room bar and no OK to leave by (the user got stuck there, 2026-10-17): a new layout
that ends on `roomConfirm()` needs the same.
Voltorb Flip's board speaks in one line it replaces (`status()`, `sayLines()`), never `tell()`, which would queue every try's
line for the room's box to tap through after (the user's ask). A face-up card zooms on a tap (`zoomCard()`), and OK shows
what you won in the treasure rays (`revealCard()`, which takes up to three: `.card-reveal.trio`).

## From CLAUDE.md (moved 2026-10-14)

The summary CLAUDE.md used to carry, unchanged. Where it and the notes above disagree, the later date wins.

- **Chad Master Kenmatta** (2026-10-01): the Move Tutor can be challenged to a boss fight from his dojo (a third sign,
  on him); beating him gives his `unique` Mata-Mindset relic (+1 PP, +1 draw, +1 strength). He's fought in his own Mortal
  Kombat arena with a Dragonite medallion (`arena: 'kombat'`, `PLACE_ART.kombat`), to his own music (`KEN.music`), and
  FORTIFY YOUR MIND shouts Wong's line (a move's `sound`, played as the enemy uses it). His first defeat is an achievement
  window (the relic), his third another, and from then on every map shows his dojo's ❓ room with his face (`save.kenWins`,
  `save.kenBeaten`). See `docs/reference/events.md`.

## Kenmatta's dojo in the Clearing (2026-10-15, the user's picks)

The Clearing's boarded-up dojo (`DOJO_AT`; since the same day a temple hall, `makeDojo()` in `js/hub-dojo.js`) is open: a tap walks in like the
Nietos' house (`enterHouse()` → `visitTown(…, 'clearing', …, 'dojo')`; `CLEARING.homes.dojo` in `js/data/towns.js`,
`HOMES.clearing.dojo` in `js/event-3d.js`). Open towns or not, but only once Kenmatta is beaten in a run (`kenWinsOf(save) >= 1`; the user's ask, 2026-10-15): till then the hub's `dojo` place is `open: false` with a note from Ken on the door. `?dojo` walks straight in (its stars and belts are
real, like walking in); `?trials` opens every trial in the window for the page load (`ALL_OPEN` in `js/dojo.js`). The data is `js/data/dojo.js`; nothing in it makes a run stronger, so no bot check.
- **The room** (`buildDojoHall(figs, { home: true, belt })` in `js/event-3d.js`): the Move Tutor's hall (gold leaf, the
  medallion, the ring, the sandbag) with Kenmatta on his cushion in the ring (a tap: his lines, `kenTalk(belt)`, more with each belt), the
  **trial board** where the scroll hung (`trialBoardArt()`: stars, the six belts with yours ringed; its sign **Trials**
  opens `js/dojo.js`'s window) and the **Sandbag** sign (the tutor's `train` act). Your partner wears your belt there
  (`beltOn()`, a band and knot on its sprite at 40% of its height; `dressBelt()` swaps it as a belt is tied on). Music
  `event-room`. The room's cache key carries the belt and stars.
- **Belts** (`BELTS`): white, yellow (2 stars), green (4 + 1 win against him in a run), blue (8 + 2), brown (14 + 3),
  black (20 + 5): set for the full ladder of about 20, so later trials never take anything back. `beltOf(save)` works
  it out from `save.dojo.stars` and `kenWinsOf()` (`save.kenWins`, `kenBeaten` counting 3); `save.dojo.belt` is only
  the last one he has tied on. `dojoTalk()` in `js/run.js`: his hello the first time (`save.dojo.met`), his word on a
  trial just fought, and each new belt's `line` once, with a 🥋 line naming the furniture it sent.
- **The trial ladder** (`TRIALS`, all 20): each a set starter (Charmander / Bulbasaur / Squirtle at its first stage,
  its Ability on), HP, a deck drawn in order (`deck[0]` first, five a turn), a foe (his students: Machop, Mankey,
  Tyrogue, Poliwrath, Hitmonchan, Primeape, Makuhita, then Kenmatta himself), typeless, its moves in order from the
  first, and a goal (`turns`, `noDamage`, `burn` last blow, `full` HP). **Trials 9-14** (2026-10-15) are harder, each a
  combo across turns: Mienfoo (hold Water Pulse while the Tide builds, Sparkling Aria before Swift Swim), Hitmontop
  (Detect soaks turn 3's hits, so Burn it, with Inferno Charge's banked PP), Breloom (Squirtle with lent Grass moves:
  Tidal Wall, Leech Seed healing to full, then Hydro Pump), Machamp (Solar Blade held two turns, a heal before it
  swings), Hariyama (Endure its 60 hit, then Blaze at 1 HP) and Kenmatta again (Riptide and Hydration on his
  FORTIFY turn, Aqua Veil keeping the block, Razor Shell, no damage). **Trials 15-20** (2026-10-15) finish the ladder:
  Scrafty (draw the deck dry for Last Resort, one draw too many reshuffles; Burn Up's HP turns Blaze on), Conkeldurr
  (a `charge` turn, then Quick Guard its 99; Tsunami counts the Tide Hydro Pump spent), Toxicroak (Chlorophyll at full
  HP: Giga Drain and the seed's tick become block, no damage), Lucario (Burning Jealousy on a big hand: Swords Dance is
  worth a card, Heat Up isn't), Medicham (Aqua Veil keeps the wall, Shell Smash, Wave Crash) and Kenmatta's final test,
  the only Bulbasaur one against him (Trailblaze while he attacks, Spicy Extract before Growth Spurt, Frenzy Plant through
  his FORTIFY). A trial's deck can hold another type's cards (t11). One star a clear (`save.dojo.stars`), each opening
  the next, replayable. Played by `trialFight()` / `afterTrial()` in `js/run.js` on a copy of the visit's run (no relics,
  items or deck of yours), `kind: 'fight'`, the kombat arena and song. In `js/battle.js` `encounter.trial` keeps the
  deck's order and the foe's first move, and `trialBroken()` ends it at the start of a turn it can no longer be won in
  (`failTrial()`); the fight's result now carries `turns` and `felledBy` ('burn' / 'seed'). `trialMissed()` reads it.
  Trial-only, so `sim/engine.js` needs nothing. Every trial was played through headless with its intended line
  (2026-10-15); a new one needs the same: `tools/dojo-solve.mjs` lists every line that clears a trial (a light copy of
  the battle rules, which throws on an effect it doesn't know; each of 9-20 has only its intended idea, and every card of it is needed), and `tools/dojo-play.cjs`
  plays a line on the real battle screen in headless Chromium and says if it earns the star. **Rebuilt on the
  twin pass's cards** (2026-10-26, the user's pick over keeping the old ones): 18 trials dealt changed cards. Harden is
  the cheap block where Splash was (t2, t14, t19), Fire Lash the small burning hit where Flare was (t3, t8, t10), Tackle
  and Agility the draws in Empty the Tank, and Patience is a new puzzle (Solar Blade triples Strength only on a turn
  you've healed: Bulbasaur starts on 34/40, no Power Whip or Growth Spurt). HP retuned so 9-20 keep one idea each:
  Machop 33, Hitmontop 136, Machamp 74, Hariyama 56, Scrafty 100, Toxicroak 58 (Poison Jab 18), Medicham 90, Kenmatta's
  final 128. `tools/dojo-solve.mjs` now knows Ethereal (exhausted at the turn's end, as in battle), made cards (a Cinder)
  and Harden's damage cut; `tools/dojo-play.cjs` finds made cards in hand. Every trial earns its star on the real battle
  screen with its line.
- **The dojo set** (`DOJO_REWARDS`, `js/base-furniture-dojo.js`, the `dojo` source in `js/data/furniture.js`; one
  colour each, group Dojo): Kenmatta's poster (1 star), Dojo mat (yellow), Wooden dummy (green), Dragonite medallion (6
  stars), Kenmatta's sandbag (blue), Dojo gong (brown), Black belt trophy (black). The window lists them, greyed till
  earned. The older Training dummy and Punching bag stay the Dojo and Black Belt badges'.

Merged to `main` 2026-10-17 after one bot check with all 30 against `main` (human bot, Levels 0/3/5, 300 runs a cell):
every type and Level within noise, no retune (numbers in `docs/roadmap-done.md`). pokeDB-sim's `noev=id/id` and
`ev=id/field/value` tweaks (e.g. `ev=litwick-bonfire/warmth.uncommon/0.5`) take an event out or change one of its numbers.
