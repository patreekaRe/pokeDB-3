## Deck thinning

The Pokémon Center (`restSite()` in `js/run.js`) offers Rest *or* **PP Up** (StS's campfire, the user's call
2026-09-27); its PC's "Forget a move" (`forgetMove()`) is greyed out unless you hold the **Mental Herb** relic
(StS's Peace Pipe). Then **PP Up** (`upgradeMove()`, StS's Smith: pick a card,
the blown-up copy shows the upgraded version via `option.zoom`, and it's swapped
for its `<id>+` in place): each a `showChoice` picker of the deck
grouped with `groupDeck` (×N badges), "Back" returns to the Center. The Center
has no tiles (the user's call, for immersion): its three options (`layout:
'center-room'`) are see-through buttons laid over the scene's healing machine,
PC and Chansey (PP Up, a purple sign; her rect is worked out from `spots.nurse`; each sign is one or two words, "Heal +N", "Upgrade card", "Forget card", with no caption line, `shortSign()`: the user found the captions covered the scene, 2026-10-01; the text box says the rest)
(`placeCenterSpots()`, from `centerSpots()` in `js/scene.js`, rerun on the
scene's `scenepaint` event), each under a bouncing `.center-label` sign, and the
scene isn't dimmed. Its text box sits just under the counter (`--counter-foot`) with
Leave at the bottom of the screen (the user's call); on a short phone `liftRoomLog()` lifts the box (`--log-lift`) just
clear of Leave, for event scenes too. It never
takes the deck below `MIN_DECK` (7); at the minimum the PC is
`disabled` (`showChoice` options accept `disabled`). Forgetting doesn't
count as a rest for `restCount`. The Cleanse Tag relic reuses the picker
right after it's picked up (`forgetMove(back, done)`: `done` continues the
reward chain instead of returning to the map). The Poké Mart sells removal too
(see below); events are planned as another source.

