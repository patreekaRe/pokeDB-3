## Windows

Every `.dialog`, every `.panel` (deck preview), the Bag
and the device's Settings app are light Pokégear windows (a `.panel`
inside a `.dialog` is a flat inset box instead):
muted parchment inside a chunky grey frame, softly rounded corners (`--round` 12px windows,
`--round-sm` 8px buttons/tiles, `--round-xs` 4px tiny bits, all in `:root`;
pieces without their own radius get it from the "soft corners" block at the
end of `css/screens.css`). The colours are
the `--win-*` tokens in `:root` (`css/base.css`); tune the tone there. Inside
a `.dialog` the usual tokens (`--ink`, `--muted`, `--panel`, `--gold`...) are
re-pointed to dark-on-parchment values, so most content re-themes itself.
Anything with a hard-coded light colour (white text, `#dfe3ff`) needs a
`.dialog ...` override in `css/base.css`. Game cards (`css/cards.css`) are styled after the Game Boy
Color Pokémon Trading Card Game: square type-coloured frame, pixel checker
body, a round PP cost set inside the frame (a mini PP box: white disc, salmon ring), pixel-font name/type, a framed art window and a
cream text window. Every card keeps a fixed two-line name band (the
name centred on the card, padded the same both sides, the PP cost on its centre line), so the art,
type and text windows line up across a row whichever names wrap (the user's call: the text was
"all over the place"). The description stays in the normal font on purpose:
pixel letters would be too small to read at card size. A long text or a two-line
name could push the text window out of the card, so `makeCard()` hands every card
to a `ResizeObserver` (`fitCard()` in `js/ui.js`): once it's first laid out, its
`--name-fit` / `--text-fit` shrink just enough to fit (measured, since the fonts
differ per device; everything is in cqw, so one fit holds at any size).
Window text (and the HP bar, biome sign, PP box...) uses Press Start 2P, the
8x8 Game Boy-style font, as `var(--pixel-font)`. It's declared by hand as
"PokeDB Pixel" at the top of `css/base.css` with `size-adjust: 66%` (its
letters are far bigger than other fonts' at the same size; `font-size-adjust`
measured it inconsistently, so don't go back to that). Since 2026-09-28 it's the
page's own font (`body` in `css/base.css`): the user wants no plain text anywhere (sheets, tiles, captions, footer), so
don't set `var(--font)` on anything new. `.card` alone resets to the normal font (`css/cards.css`), since card text at
card size needs it. Every `.btn` is a Gen 1-3
menu option to match: cream box, pixel frame, and a blinking ▶ cursor on
hover/focus (left padding reserves its space; `.primary` = orange frame,
`.danger` = red). The How to play button is a gold `.ds-btn` capsule instead (see below).

**Sound control** (`.sound-ctl` in `css/base.css`, 2026-10-02, the user's calls): a Sound button opens a pop-out with no
frame (`.sound-pop`, `SOUND_POPS` in `js/audio.js`: the button again, a tap elsewhere or Escape close it): a speaker
(`.sound-mute`, 🔊 / 🔇, every `.snd-icon` follows the mute) and a `.vol-slider` to its right, a pixel track (the HP bar's
outline, green fill from `--v`) with a square knob; `.muted` on the row greys the bar, and dragging it up unmutes. In the
Pokédex it is the Settings app (`#dev-settings`), on the title under or beside the speaker on a soft dark
backing (`#title-sound-pop`). The speaker's icon is swapped as it's tapped, so the outside-tap checks use
`e.composedPath()`, not `e.target.closest()` (a detached target read as outside and closed the menu).

**Tap tips** (`js/tips.js`, `.tap-tip`): any `title` pops up in a little text box, but **only on a deliberate tap** of
the thing it explains (the user's call, 2026-10-03: hover tips popped up on their own over the title's gems and the
Safari Pokédex, since a screen opening under a resting mouse counts as a hover). Hover only hides the browser's own
tooltip (the title moves to `data-tip` meanwhile); nothing shows on focus, scroll or load. The next tap anywhere, or the
same thing again, puts it away. Taps on buttons and other controls do their own thing, not the tip; code that wants a
note there calls `tipAt()` (a locked starter, the locked Safari gem, an unseen Pokédex tile: those tiles are
`aria-disabled`, not `disabled`, so the tap reaches them). `showTip()` tries above, below, right and left of the thing
and takes the first spot that covers no button or tab (else the one covering least).
