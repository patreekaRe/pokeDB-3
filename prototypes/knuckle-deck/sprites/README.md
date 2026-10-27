# Knuckle Deck sprites

Drop images in here and the game uses them. Any fighter or pose without a picture keeps the block figure, so
you can add them a few at a time.

## Files

One folder per fighter, one image per pose, named exactly like this (`.png`, or `.gif` for an animated one):

```
sprites/hero/idle.png      you
sprites/brawler/idle.png   Dock Brawler (floor 1)
sprites/monk/idle.png      Iron Monk (floor 2)
sprites/ninja/idle.png     Alley Ninja (floor 3)
```

The 12 poses each fighter can use:

| file | when it shows | if it's missing, the game uses |
|---|---|---|
| `idle` | standing, waiting (**needed**: without it the fighter stays a block figure) | the block figure |
| `high` | a High attack: a punch | `idle` |
| `low` | a Low attack: a low kick or sweep | `high` |
| `over` | an Overhead: an axe kick | `high` |
| `throw` | grabbing the other fighter | `high` |
| `sblock` | Stand Block: arms up | `cblock` |
| `cblock` | Crouch Block: crouched, arms up | `sblock` |
| `hurt` | the frame they get hit | `reel` |
| `reel` | staggered, wobbling | `hurt` |
| `air` | launched into the air | `hurt` |
| `down` | knocked down, lying on the floor | `ko` |
| `ko` | knocked out | `down` |

The fewest that look good: `idle`, `high`, `low`, `sblock`, `hurt`, `down` (6 per fighter).

## Rules for every image (so they line up)

- **Side view, facing RIGHT.** The game flips the enemy to face left itself.
- **Transparent background.**
- **Same canvas size for every pose:** 128 x 128 (or 96 x 96). Don't crop each one tight.
- **Feet on the bottom edge**, the fighter in the middle, the same scale in every pose.
- About 80-100% of the canvas tall when standing. The game shows them 132px tall (`--spr-h` in `index.html` changes that).

## How to keep one character looking the same (PixelLab or Ludo)

AI makes a slightly different person every time you ask. So:
1. Make the **idle** pose first, from the character line below plus the style line. Redo it until you like it.
2. Make every other pose **from that idle image** (use it as the reference / init / style image, the tool's
   animate or pose feature if it has one), and change only the pose words.
3. Same seed, same size, same palette for all four fighters, so they look like one game.

## Prompts

**Style line (add to every prompt):**
`16-bit arcade fighting game sprite, side view, full body, facing right, clean dark outline, limited palette,
crisp pixel art, transparent background, no shadow, no text`

**Characters:**
- **hero**: `young street fighter, teal headband and teal hand wraps, white sleeveless gi, black pants, barefoot,
  athletic build, confident`
- **brawler** (Dock Brawler: big, slow, heavy hitter): `huge dock worker brawler, bald, thick beard, red tank top,
  rolled-up jeans, work boots, anchor tattoo, giant fists`
- **monk** (Iron Monk: patient, blocks and kicks): `calm martial arts monk, shaved head, orange and brown robes tied
  at the waist, iron bracers on both forearms, prayer beads, barefoot`
- **ninja** (Alley Ninja: fast, tricky, throws): `lean street ninja, dark purple hood and mask, red scarf, wrapped
  shins, tabi boots, crouched and quick`

**Poses (swap in for each image):**
- `idle`: `fighting stance, fists raised, knees bent, weight balanced`
- `high`: `throwing a straight punch forward at head height, arm fully extended`
- `low`: `low kick forward at shin height, leaning back, one leg extended`
- `over`: `axe kick, leg raised high above head coming down`
- `throw`: `lunging forward with both arms out to grab`
- `sblock`: `standing guard, both forearms raised in front of face`
- `cblock`: `crouching guard, low, forearms raised in front of face`
- `hurt`: `hit in the face, head snapped back, eyes shut, recoiling`
- `reel`: `staggering backwards, dazed, arms loose`
- `air`: `knocked up into the air, body arched back, limbs flailing`
- `down`: `knocked down, lying flat on the back on the ground`
- `ko`: `knocked out, lying face down on the ground, limp`

Example, the hero's punch:
`young street fighter, teal headband and teal hand wraps, white sleeveless gi, black pants, barefoot, athletic build,
throwing a straight punch forward at head height, arm fully extended, 16-bit arcade fighting game sprite, side view,
full body, facing right, clean dark outline, limited palette, crisp pixel art, transparent background, no shadow, no text`
