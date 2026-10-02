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
rewards; it has no Leave. A new event needs an entry in both places, an
icon in `ICONS` for any new emoji, and a `RUN_SAVE_VERSION` bump only if the
node shape changes.

Every event has a scene of its own (no event shows plain tiles any more). `EVENT_SCENES` in `js/run.js` maps an event to
its `PLACE_ART` entry; `outdoor: true` makes `showPlaceScene()` paint that biome's own wild scene (sky,
backdrop, ground, life) with the event's props in the middle (`prop`, `eventProps()` in `js/scene.js`), and
its `biomes` only retint the props. Like the Center, there are no tiles: layout `event-room <scene>-room`
lays each choice as a see-through button over a prop (`life.eventSpots`, `eventSpots()`, placed by
`placeEventSpots()`) under a bouncing `.center-label` (`spotOption()`) whose second line (`.spot-caption`, in the pixel font like every window since 2026-09-28) says what
it does (phones never see a `title`; `spreadSigns()` keeps the signs on screen, off each other and off the screen's title), with the text box under the props
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
`SPRITE_FIT`). The grunt is male or female (`grunts` in `js/data/events.js`, rolled into `node.event.grunt`;
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
A win pays a boss's coins and ₽ ("You defeated Chad Master Kenmatta!", `pendingCoins.beaten`), then his **Exp. Share**
(no Skip, in the gold boss shaft) and a boss card reward. Once you hold it, the sign is greyed out ("You already won his
Exp. Share."). The Tutor nods through a lesson and turns to the sandbag to train; the Deleter shakes his head
when you back out of his picker; the Day-Care Lady turns on a trade; the Chairman jumps handing over his gift. A done
picker comes back to the room (`eventRoom(node, after)`, from the choice's `react(move)`): no choices, the NPC does `after`
(the Tutor nods, the Deleter and the Day-Care Lady jump) while the text box says what happened, and closing the box or
Leave goes on to the map. All of it stops under reduced motion. The outdoor ones (Berry Tree, Wishing Well, Item Ball, Team
Rocket) are close-ups too: their art's `zoom` (1.75) makes `resize()` paint the scene with bigger pixels, as far as
their props (`span` pixels across) still fit the screen, so a narrow phone zooms less than a PC. Your HP in an event room is the top bar's
little plate beside the Poké Ball (`#choice-plate`, as on every choice screen; the user's call 2026-09-28: there used to be
a row under the title), and `showHpChange()` runs its bar to the new HP before the room closes. Choices that open a picker (Tutor, Deleter, Day Care) play their act first; the
price is still only paid once something is picked.

