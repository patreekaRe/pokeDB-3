# Your trainer and the buddy following (2026-10-28)

The user's ask: "choose a trainer so our buddy can follow us". You walk as a trainer and your buddy walks a step behind,
**everywhere the buddy walks**: the Clearing (`js/hub-3d.js`), the Secret Base (`js/base-3d.js`), the Poké Mall
(`js/mall-3d.js`), the towns and every ? room and gym (`js/event-3d.js`), the Pokémon Center (`js/center-3d.js`) and the
Poké Mart (`js/mart-3d.js`). No look worn (`save.look` null, every save until it picks one): the buddy walks alone, as
before.

**The looks** (`js/data/looks.js`): Gen 4 walking sheets from Vanilla Sunshine's OW pack in `assets/overworld/` (credit
in About and the credits roll; never commit the whole pack, its terms forbid redistributing it). The four heroes (Ethan,
Lyra, Lucas, Dawn) are free and offered in the new-player setup; eleven classes are bought with PokéCoins on the Trainer
Card (300-800). `save.look` is the one worn, `save.looks` those bought; `wornLook()` reads them, `?look=<id>` lends one
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
steps each (`walkFrames()`), drawn at `WALKER_PX` (a quarter bigger than a GIF's pixels) and stepped by `drawStep()`
from `{ dir, moving }`. The same sheets walk the towns' and the Clearing's townspeople (`person: true` in the crowd's
cast, `js/corner-crowd.js`).

**Picking it**: the setup's step 2 of 3, WHO ARE YOU? (`askLook()` in `js/title.js`), and the Trainer Card's Trainer key
(`lookPicker()` in `js/trainercard.js`: a first tap on a class says its price, a second buys it; Walk alone takes the
look off). `lookArt()` in `js/ui.js` draws a look's front frame from its sheet, `.look-art`, the picked one walking.

**Checked** headless in every place with a look worn (`?look=dawn`): within the phone budget (2-3 more draws and under
1 MB a place), and the Clearing -> Secret Base trips keep nothing.
