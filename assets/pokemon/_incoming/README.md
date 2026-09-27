# Incoming starter sprites (not in the game yet)

Animated Black/White-style GIFs for three new starter lines, kept with their
original names and folders, waiting to be renamed to the game's
`<id>-front.gif` / `-back` / `-shiny-front` / `-shiny-back` scheme, measured
into `js/data/sprite-fit.js` and credited in About.

Every Pokémon here has all four: front, back, shiny front, shiny back.

| Line | Source | Files |
|---|---|---|
| Popplio, Brionne, Primarina | Pokémon Showdown | `showdown/gen5ani*/` |
| Sobble, Drizzile, Inteleon | Pokémon Showdown | `showdown/gen5ani*/` |
| Fuecoco, Crocalor, Skeledirge | Ghasty001 | `ghasty001/FRONT*`, `BACK*` |

Folder to variant: `gen5ani` / `FRONT` = front, `gen5ani-back` / `BACK` = back,
`gen5ani-shiny` / `FRONT_SHINY` = shiny front, `gen5ani-back-shiny` /
`BACK_SHINY` = shiny back. Showdown GIFs are cropped tight; Ghasty001's sit on
a padded 96x96 canvas.

## Sources and credits

- Showdown: https://play.pokemonshowdown.com/sprites/gen5ani/ (and `-back`,
  `-shiny`, `-back-shiny`). The Gen 6+ ones are from the Smogon Sprite
  Project, https://www.smogon.com/forums/threads/smogon-sprite-project.3647722/ :
  "These sprites are also free for use as long as the spriter or the project
  itself is credited." and "For the sake of transparency, these sprites are
  free for non-profit use."
- Ghasty001: https://github.com/Ghasty001/Animated_sprites_by_Ghasty001 :
  "All these sprites are free to use, for other projects to use *with
  credit*. The credits also apply to all the artists who made the base sprite
  I used for the animation (also shared with free to use consent)". For this
  line: "Fuecoco's front and back was edited from a sprite by *Bloxable*.
  Skeledirge front sprite was also made by *Bloxable*. both Skeli and
  Crocalor's back come from *KingOfThe*. Crocalor's front is original!"

So About should credit the Smogon Sprite Project, and Ghasty001, Bloxable and
KingOfThe-X-Roads for the Fuecoco line.

## Not included, and why

No animated Black/White sprites exist yet (checked 2026-09-27 on Showdown,
Ghasty001 and the Smogon Gen 8/9 spreadsheets, which only list still PNGs)
for: Chespin, Chesnaught (shinies), Delphox, Frogadier, Greninja (backs),
Rowlet's Dartrix and Decidueye, Torracat, Grookey and Scorbunny (backs),
Rillaboom, Cinderace, and the whole Sprigatito and Quaxly lines. Those lines
wait until animations turn up.
