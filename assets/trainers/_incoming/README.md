# Incoming event NPCs (not in the game yet)

Still front sprites (WebP, original Pokéngine ids as names) for a trainer NPC
in four ? events, picked by the user on 2026-09-27. All four are by
**kyledove** on Pokéngine, each marked "Free to use with credit".

| File | Pokéngine page | Event | Size |
|---|---|---|---|
| `01p3c3zu.webp` | https://pokengine.org/trainers/01p3c3zu/Scientist | Move Tutor | 34x75 |
| `01786ho1.webp` | https://pokengine.org/trainers/01786ho1/Augustine+Sycamore | Move Deleter | 58x78 |
| `019vz4hw.webp` | https://pokengine.org/trainers/019vz4hw/Agatha | Day Care (as the Day-Care Lady) | 37x67 |
| `017aj8x2.webp` | https://pokengine.org/trainers/017aj8x2/Founder | Fan Club (as the Chairman) | 35x70 |

Credit in About: "Event NPC sprites (Scientist, Sycamore, Agatha, Founder) by
kyledove on Pokéngine, https://pokengine.org". Characters © Nintendo / Game Freak.

## Plan (agreed with the user)

Rename to `assets/trainers/<role>.webp` (or convert to PNG), stand each one
in its event scene through the existing `figures` / `.event-figure` /
`life.stands` path at the grunts' scale, measured into `SPRITE_FIT`. One NPC
per event: the Fan Club's Persian and Cinccino and the Day Care's Miltank and
Marill stay. The sprites are still images, so bring them to life:

1. **Breathing**: a slow 1px squash from the feet (2-3 s loop, random phase).
2. **Blinking**: paint one eyes-closed copy of each sprite (a few pixels),
   swapped in for ~120 ms every few seconds at random.
3. **Talking**: a small head-bob while `sayLines()` types that NPC's line,
   stopping at the ▼.
4. **Reactions** in the choice's `playOut()` act, like `gruntDoes('hop')`:
   Tutor nods on learning a move and turns to the prop while teaching;
   Deleter hops when a move is forgotten, shakes their head on Back; Day-Care
   Lady turns to Miltank/Marill on a trade, then back with a hop; Chairman
   jumps when the gift is handed over. Turning is `flip`.

All motion off under reduced motion. Check it on a phone size and an iPad size.
