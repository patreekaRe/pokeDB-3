## Pixel icons

The game never shows emoji: `js/icons.js` swaps every emoji on the page for
an 8-bit pixel icon (but the title screen's, smooth vector art since 2026-10-06: `js/smooth-icons.js`, see title-screen.md; and the Collection device's app and dock icons since 2026-10-05, the same file; the user is moving things off pixel art bit by bit and will say which next). Data files and code keep writing emoji (card `art`,
relic `icon`, text boxes...); `initPixelIcons()` (called first in `js/main.js`)
swaps existing text and uses a `MutationObserver` to swap anything added
later. Each icon is a 12x12 pixel map in `ICONS` using the letters in
`PALETTE`; the black outline is added automatically, so only draw the fill.
**When you add an emoji anywhere, draw its icon in `ICONS` too**, or it shows
as a plain emoji. Tooltips (`title`) can't hold SVG and keep the emoji. Don't
read an emoji back out of the page with `textContent`: it's been replaced.

Items and relics are the exception: they show real PokéSprite item sprites
(`assets/items/<id>.png`, 32x32, from github.com/msikma/pokesprite, credited in
About) through `itemSprite()` in `js/ui.js`, which falls back to the emoji if the
file is missing. A card can use one as art with `sprite` (every card does), cropped to
its visible pixels from `js/data/item-fit.js` and scaled to fill the art window
(re-measure the alpha bounds when adding one); some are puns on the move. Tackle's
`hit-spark` and Block's `shield` aren't PokéSprite: they're original 32x32 pixel art in
the same folder and style (the user wanted a real shield and a hit spark). Their emoji stay in the data
for tooltips and event text, and must not be swapped globally: many are shared
(🔥 is the Fire type, 💪 the strength badge). A new item or relic needs its PNG
named after its id.

