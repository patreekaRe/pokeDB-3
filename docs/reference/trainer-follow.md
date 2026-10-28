# Your trainer and the buddy following (2026-10-28)

The user's ask: "choose a trainer so our buddy can follow us". You walk as a trainer and your buddy walks a step behind,
**everywhere the buddy walks**: the Clearing (`js/hub-3d.js`), the Secret Base (`js/base-3d.js`), the Poké Mall
(`js/mall-3d.js`), the towns and every ? room and gym (`js/event-3d.js`), the Pokémon Center (`js/center-3d.js`) and the
Poké Mart (`js/mart-3d.js`). No look worn (`save.look` null, every save until it picks one): the buddy walks alone, as
before.

**The looks** (`js/data/looks.js`): Gen 4 walking sheets from Vanilla Sunshine's OW pack in `assets/overworld/` (credit
in About and the credits roll; never commit the whole pack, its terms forbid redistributing it). The four heroes (Ethan,
Lyra, Lucas, Dawn) are free and offered in the new-player setup; 29 more are bought at the Trainer Tailor in the Poké Mall (since 2026-10-28; `docs/reference/hub-base-mall.md`) at one
price, `LOOK_PRICE` 500 (the user's call, 2026-10-28; a won run pays about 100 plus its fights). **No names show** on any
tile, key or line (the user's call: naming the heroes took away that you're you); `name` is only for screen readers. `save.look` is the one worn, `save.looks` those bought; `wornLook()` reads them, `?look=<id>` lends one
for the page load. A new look: its sheet in `assets/overworld/<id>.png` (Essentials' layout, below) and a `LOOKS` line.

**The follow** (`js/follow.js`): each place still moves its own `walker` and sets its buddy's group where the walker
stands; `lead.lead(walker, mon, dt, acting)` then puts the trainer on that spot (so taps, the camera and the crowds go on
reading the walker) and eases the buddy to the point `GAP` (0.85) back along the trainer's trail, returning the pose to
draw the buddy with. A walker moved further than `JUMP` in a frame (a door, a warp, the lift) starts the trail afresh.
**Acting** swaps them: while the buddy does something on the spot itself, it keeps the spot and the trainer stands back
on the trail (the base: a seat or a leap to one; the Center: shrunk into its ball to heal; the event rooms: `acting`,
an act at a choice). Each place keeps a `leadFor()` keeper, which rebuilds the trainer the frame after the worn look
changes (picked on the Trainer Card while you stand there) and whose `ready()` on each way in restarts the trail. The
Mart caps the trainer's height as it does the buddy's (`fit`); the base tilts it with the camera every frame and bends it
with its own list; the rooms re-add it to the scene and set their tilt on each mount.

**The sheets** (`monBoard({ sheet })` in `js/hd2d.js`): Pokémon Essentials' layout, rows down / left / right / up, four
steps each (`walkFrames()`), drawn at `WALKER_PX` (a GIF's pixels: the user's pick of 2026-10-28 over a quarter bigger, which looked big indoors; `?walker=N`
tries another size for a page load), the buddy trailing `GAP` behind (`js/follow.js`, 0.95 since 2026-10-28, a tiny bit more than 0.85 for the smaller trainer; `?gap=N` tries another) and stepped by `drawStep()`
from `{ dir, moving }`. The same sheets walk the towns' and the Clearing's townspeople (`person: true` in the crowd's
cast, `js/corner-crowd.js`).

**Picking it**: the setup's step 2 of 3, WHO ARE YOU? (`askLook()` in `js/title.js`), and the Trainer Card's Trainer key
(`lookPicker()` in `js/trainercard.js`, since 2026-10-28 the Trainer Tailor's window, `lookWindow()` in `js/look-window.js`,
without Kecleon: Wear only, the looks not owned greyed "At the Trainer Tailor"; Walk alone takes the look off). Buying is
the tailor's only (the user's call). A look tried on there is `tryLook()` in `js/data/looks.js`, read first by `wornLook()`,
never saved. `lookArt()` in `js/ui.js` draws a look's front frame from its sheet, `.look-art`, the picked one walking.

**Checked** headless in every place with a look worn (`?look=dawn`): within the phone budget (2-3 more draws and under
1 MB a place), and the Clearing -> Secret Base trips keep nothing.

**A save from before trainers** (the user's pick, 2026-10-28): once, as the device powers on, the setup's trainer step on
its own, Later in place of Back (`askTrainer()` in `js/title.js`). Later asks again at every launch till a trainer is
picked (the user's call, 2026-10-28, replacing once only): `save.lookChosen` stops it, set by the setup, an OK here, or
wearing a look or Walk alone on the Trainer Card. A lent `?look=` skips it.

**Roaming free in your own Secret Base** (2026-10-28, the user's ask: "let our buddy roam free whenever we get to our secret
base house... go into other rooms with us but continue to free roam"): with a trainer worn and the base your own (not a
friend's, `host`), `pal` in `js/base-3d.js` takes the buddy off the trail: you walk as the trainer (`lead.solo()` in
`js/follow.js`, the trainer alone on the walker) and the buddy lives about the room as the Safari residents do
(`liveGuest()` / `think()`), a guest's shape `{ id, mon, w }`, now and then trotting over to stand by you (`livePal()`).
Through a door it comes along, set down beside you in the new room (`placePal()` from `showRoom()`). A tap on a seat sends
it to sit (`sendPal()`, from `sitPartner()`); a cheer meant for the partner (a piece tapped) is its hop. Taking the look
off drops `pal` and the old follow comes back.

**Petting** (same day: "cute little emojis over their head when we pet them"): a tap on your buddy or a resident in the
Base is `pet()`: its cry, a hop and `emote()`, a white pixel speech bubble over its head holding a heart (twice as
likely), a smile, a note or a twinkle (`EMOTES`), as HeartGold's followers show. It rides over the head, pops in and
fades in 1.5 s, and a new one replaces the one up. Only the Base has it so far.
