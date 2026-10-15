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
eat (berries fall and vanish) or plant (one flies into the empty plot, a sprout comes up). Hot Spring: soak
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
real, like walking in). The data is `js/data/dojo.js`; nothing in it makes a run stronger, so no bot check.
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
- **The trial ladder** (`TRIALS`, 8 so far): each a set starter (Charmander / Bulbasaur / Squirtle at its first stage,
  its Ability on), HP, a deck drawn in order (`deck[0]` first, five a turn), a foe (his students: Machop, Mankey,
  Tyrogue, Poliwrath, Hitmonchan, Primeape, Makuhita, then Kenmatta himself), typeless, its moves in order from the
  first, and a goal (`turns`, `noDamage`, `burn` last blow, `full` HP). One star a clear (`save.dojo.stars`), each opening
  the next, replayable. Played by `trialFight()` / `afterTrial()` in `js/run.js` on a copy of the visit's run (no relics,
  items or deck of yours), `kind: 'fight'`, the kombat arena and song. In `js/battle.js` `encounter.trial` keeps the
  deck's order and the foe's first move, and `trialBroken()` ends it at the start of a turn it can no longer be won in
  (`failTrial()`); the fight's result now carries `turns` and `felledBy` ('burn' / 'seed'). `trialMissed()` reads it.
  Trial-only, so `sim/engine.js` needs nothing. Every trial was played through headless with its intended line
  (2026-10-15); a new one needs the same.
- **The dojo set** (`DOJO_REWARDS`, `js/base-furniture-dojo.js`, the `dojo` source in `js/data/furniture.js`; one
  colour each, group Dojo): Kenmatta's poster (1 star), Dojo mat (yellow), Wooden dummy (green), Dragonite medallion (6
  stars), Kenmatta's sandbag (blue), Dojo gong (brown), Black belt trophy (black). The window lists them, greyed till
  earned. The older Training dummy and Punching bag stay the Dojo and Black Belt badges'.
